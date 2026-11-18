// THE FALL - hero set piece for the world "mara-crossing".
//
// A waterfall made of animals. A 12 m cut bank of red-ochre earth, 130 m long and curving round the viewer,
// with a 45 m front in its middle where the herd goes over the edge without stopping: ~150 wildebeest
// (a quarter of them tan calves) and a family of zebra gallop in out of the dust on planted hooves, and at
// the lip either launch (forelegs tucked, then reaching) or sit back and slide a worn chute in an avalanche
// of clods and dust before they jump. Eight to twelve bodies are in the air at any instant at every height;
// each throws a true projected shadow that races down the sunlit face (and across the water) to meet it.
// They land in 3-4 m splash crowns, vanish for half a second, and surface as swimming heads with white
// beards, foam collars and V wakes, fanning out across milky-tea water and carried downstream. Above the
// trampled plain a ray-marched dust plume slants 60 m up like smoke, gold on its sunward edge, umber in
// its own shade; animals at the lip are dark shapes against it.
//
// LOCAL SPACE  origin = water level at the foot of the middle of the Fall. +Y up. The face looks toward +Z
//   (the river, the viewer); the plain is behind it (z < 0) at y ~ 11; the herd runs toward +Z. The river
//   flows toward +X (opts.current = -1 to flip). Water surface y = 0.
// SIZE   bank x -66..66, z -58..+12 (lip at z ~ -3..+12, curving forward on the wings), top y ~ 11; the
//   Fall front is |x| < ~22; swimmers reach z ~ +50; plume top y ~ 72. hero.radius 34 / height 27 / center
//   (0,18,2) frame the Fall itself for the viewer; the true bounding radius is ~75.
// COST   ~122k triangles, 8 draw calls (bank, wildebeest, zebra, grass tufts, water sheet, foam decals,
//   sprites, plume), no lights, no textures, ~80 ms build. The plume is a 26-step ray march in a sheared
//   box (steps scale with ctx.quality.detail); everything else is vertex-shader animation.
// DRAW ORDER  bank: opaque. Then, in the transparent queue: water (renderOrder 1, writes depth), plume (2),
//   animals (2.5) and grass (2.6) (both opaque-looking, alpha 1, depth-written), foam decals (3), sprites (4).
//   The plume has no scene depth to read, so it is depth-tested once, at the point where each ray ENTERS the
//   dust box: solids in front of the dust hide it, solids behind are veiled, and the plain under it is the
//   box floor. Anything standing INSIDE the dust (the herd on the plain) must be drawn after the plume and
//   veil itself with dustVeil() from DUST_GLSL, as the animals here do; do the same for the world's own
//   creatures near the lip (material.transparent = true, renderOrder 2.5) or they vanish in the dust.
// LIGHT  Everything here is a ShaderMaterial lit by uniforms, not by scene lights: one low gold sun and a
//   blue-violet sky fill / ochre ground bounce (hemisphere). Defaults are the brief's 17:15 light: sun 18
//   degrees up, raking the face from the upstream side, direction TOWARD the sun (-0.45, 0.31, 0.84) local,
//   #FFD9A0 x 2.4. Call hero.setLight({ sunDir, sunColor, sunIntensity, sky, skyIntensity, ground,
//   groundIntensity, dustLit, dustShade }) with LOCAL-space sunDir to match the world. All materials honour
//   scene fog (fog chunks / the same formula for the premultiplied ones). Shading recipe to match in the
//   world's bank and terrain: albedo x (sun x half-lambert^1.3 x (1 - leaper shadow) + hemi(sky, ground) x
//   AO), strata as vertex colour, clod relief as a noise bump, wet band + foam line at the waterline.
//
// OPTS   palette  7 hex strings in brief order: gold dust, straw, ochre earth/water, slate hide, splash
//                 white, sky blue, fig green (unused: nothing is green here)
//        hour     'golden' (default) | 'dawn' (sun behind the bank, rose light, blue dust) | 'noon' | 'dusk'
//        weather  'haze' (default) | 'storm' (denser, taller plume) | 'rains' (half the dust, darker river)
//        season   'october' (default) | 'july' (river high: water level +0.9 m, faster current)
//        density  0.7..1.3 scales the herd (default 1)       cast  'zebra' makes a third of the herd zebra
//        current  +1 river flows toward +X (default), -1 toward -X
//        swimLength  metres the swimmers cover before they go under and dissolve (default 50: seat the far
//                 bar there; the river in the brief is 68 m wide)
//        swimTo   [x, z] local point every swimmer makes for instead (the far bar's waterline): the fan becomes a
//                 stream to the exit. Keep it within ~55 m of the Fall's foot, or raise opts.cycle (seconds, default
//                 26; a longer cycle gives a longer swim but proportionally fewer bodies in the air).
//        water    false to omit the built-in water sheet (use your own river at y = 0; foam decals sit at
//                 y 0.05; make it opaque enough to hide submerged bodies)
//        plume    false to omit the dust plume             duration  seconds mapped by setProgress (40)
//        sunDir   [x,y,z] local, toward the sun (overrides hour)
// HERO API (besides the contract)
//   hero.setProgress(u)   herd clock = u x opts.duration. If never called the herd free-runs on the time
//                         passed to update(). The Fall is a continuous loop (cycle hero.cycle seconds), so
//                         nothing has to coincide with the camera; drive it from u only if you assert
//                         clearances. hero.setClock(seconds) is the same clock in seconds.
//   hero.setCollapse(k)   0..1, the rare event: a 20 m slab of bank beside the Fall (x ~ +24..+46) slumps
//                         into the river with a dust bloom and a brown wave. Key it to u (0.63 -> 0.70).
//   hero.animalAt(i, clock, out) -> {x,y,z,phase} body centre of animal i (CPU mirror of the shader);
//   hero.clearance(x, y, z, clock) -> metres to the nearest animal body; hero.count; hero.setLight(...);
//   hero.uniforms; hero.stats { triangles, airborneMean, airborneMin }. The module also exports DUST_GLSL.
// ANCHORS (local space)
//   fall        { center [0,0,zFoot], halfWidth, lipY, normal [0,0,1] }: the 45 m front.
//   viewpoints  river: eye 0.7 m over the water, 34 m off the Fall's splash line (the brief's u 0.63 frame);
//               leap: beside the upstream lip looking along the face; plain: behind the column, on the axis.
//   flyThrough  ordered points of the swim past the Fall, parallel to the face 34-38 m out at y 0.7,
//               upstream (-X) to downstream (+X). Clear of bank, splash and plume by > 20 m; swimmers DO
//               cross it (they are the foreground heads of the brief): check hero.clearance().
//   plume       { base, top, radius }: axis of the dust column (for vultures to wheel round).
//   lip         [[x, y, z] ...] the bank edge every 6 m (seat thicket / join the world's bank here).
//   ends        where the bank mesh stops (x = +-66): continue the world's bank from these.
//   portalSeat  none here: the exit portal belongs between the figs on the far bank (brief u 0.93).
//               A fallback seat is given 70 m out on the river axis facing the Fall, should a world want it.
//   sunDir, waterY, current.
import * as THREE from 'three';
import { Geo, quadrupedGeometry, HERD_PRESETS } from '../kit/fauna.js';

const PALETTE = ['#E9B45A', '#C7A55E', '#9A6A45', '#2F2C2B', '#F3EDE0', '#8FB6D2', '#3F6B34'];
const PIV = 0.95, GRAV = 8.0, TOP = 11, NSH = 16, ZBACK = -44;
const prof = (t) => t * (0.72 + 0.28 * t), dprof = (t) => 0.72 + 0.56 * t;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const HOURS = {
  golden: { sun: [-0.45, 0.31, 0.84], sunC: '#FFD9A0', sunI: 2.4, sky: '#8c9fd6', skyI: 0.62, gnd: '#9A6A45', gndI: 0.32, lit: null, shade: '#5c4434' },
  dawn: { sun: [0.48, 0.2, -0.85], sunC: '#ffb9a2', sunI: 2.3, sky: '#93a8dc', skyI: 0.75, gnd: '#7a6a70', gndI: 0.3, lit: '#eeb0a6', shade: '#48587c' },
  noon: { sun: [-0.2, 0.93, 0.31], sunC: '#fff0d8', sunI: 2.0, sky: '#a8c4ea', skyI: 0.95, gnd: '#b08a60', gndI: 0.55, lit: '#e2c88e', shade: '#8c765a' },
  dusk: { sun: [-0.5, 0.07, 0.86], sunC: '#ffae78', sunI: 1.15, sky: '#8c7cc0', skyI: 0.75, gnd: '#80605a', gndI: 0.3, lit: '#f2b68e', shade: '#584868' },
};

// ---------------------------------------------------------------- shared GLSL
export const GLSL_COMMON = /* glsl */`
float h11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float h31(vec3 p3){ p3 = fract(p3 * .1031); p3 += dot(p3, p3.zyx + 31.32); return fract((p3.x + p3.y) * p3.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1., 0., 0.)), f.x), mix(h31(i + vec3(0., 1., 0.)), h31(i + vec3(1., 1., 0.)), f.x), f.y),
             mix(mix(h31(i + vec3(0., 0., 1.)), h31(i + vec3(1., 0., 1.)), f.x), mix(h31(i + vec3(0., 1., 1.)), h31(i + vec3(1.)), f.x), f.y), f.z); }
float prof(float t){ return t * (.72 + .28 * t); }
float dprof(float t){ return .72 + .56 * t; }
// swimmer track after the splash: L = (xLand, zLand, lateral speed, forward speed), vImp = forward speed at impact
vec2 swimXZ(float d, vec4 L, float vImp){
  float dd = max(d, 0.);
  return vec2(L.x + L.z * (dd - 1.2 * (1. - exp(-dd / 1.2))), L.y + L.w * dd + (vImp * .5 - L.w) * .4 * (1. - exp(-dd / .4)));
}
// thrown water: a ragged sheet that leans, forks and tears into shreds as it ages, and the fine bright drops round it.
// u.x -1..1 across, u.y 0 at the water .. 1 at the top; k = age 0..1; lt = age in seconds
float sprayDrops(vec2 u, float seed, float cells){
  vec2 g = u * cells + seed * 17., c = floor(g), f = g - c; float h = h21(c + seed * 3.1), h2 = h21(c + 7.3 + seed);
  vec2 o = vec2(.25 + .5 * h2, .25 + .5 * fract(h2 * 13.7)); float rr = .1 + .16 * fract(h * 7.1);
  return step(.55, h) * (1. - smoothstep(rr * .5, rr, length(f - o)));
}
float spray(vec2 u, float seed, float k, float lt){
  float n = vn2(u * vec2(4.2, 3.4) + vec2(seed * 19., -lt * 2.2)), n2 = vn2(u * vec2(10., 8.) + vec2(seed * 7., -lt * 4.)), n3 = vn2(u * vec2(1.6, 1.3) + seed * 5.);
  float lean = u.x - (n3 - .5) * 1.1 * u.y, wd = mix(.22, .78, sqrt(max(u.y, 0.)));
  float env = (1. - smoothstep(wd * .35, wd, abs(lean))) * (1. - smoothstep(.3, .92, u.y + (n - .5) * .7)) * smoothstep(0., .05, u.y) * (1. - smoothstep(.8, 1., abs(u.x)));
  float n4 = vn2(u * vec2(23., 19.) + vec2(seed * 3., -lt * 7.));
  float sheet = smoothstep(.6 + .24 * k, .72 + .24 * k, env * (.08 + n * .3 + n2 * .45 + n4 * .45));       // lace, not a slab: holes from the first, shreds at the end
  float reach = 1. - smoothstep(.55, 1., length(vec2(u.x, (u.y - .45) * 1.5)));
  float drops = max(sprayDrops(u, seed, 9.), sprayDrops(u + .37, seed + .5, 15.) * .8) * reach;
  return max(sheet * mix(.66, .36, u.y), drops * .95);
}
`;
// THE RIVER SURFACE, shared by the Fall's own sheet and the world's: milky-tea water seen from 0.7 m up. From that height nothing of a wave
// whose crest lies across the line of sight survives beyond a few metres, so every wave train is faded by its own footprint on the screen
// (dx, dy = dFdx / dFdy of the world xz, taken once at the top of main): crisp wavelets under the lens, calm bands of light further out, no
// crawling. The water is turbid and scatters like a matte surface: wavelet faces turned to the low sun are lit, the others stand in their own
// shade. Foam is flecks, one to a cell, gathered into drift lines by the current; far off the lines thin to a pale breath and never smear.
// Needs GLSL_COMMON and the uniforms uTime, uSun, uSunC, uSkyC, uGndC, uTea, uFoam, uSkyRef, uHaze.
export const WATER_GLSL = /* glsl */`
void wtrain(vec2 p, vec2 dir, float lam, float steep, float sp, float sd, vec2 dx, vec2 dy, inout vec2 sl){
  float k = 6.2832 / lam, fp = k * (abs(dot(dir, dx)) + abs(dot(dir, dy)));              // phase run per pixel
  float fade = 1. - smoothstep(.7, 2.1, fp); if (fade <= 0.) return;
  float warp = vn2(p * (.62 / lam) + sd * 7.3) * 3.4 + vn2(p * (.21 / lam) - sd * 3.1) * 4.6;      // short crests that bend and break: wind ripple, not corduroy
  float ph = dot(p, dir) * k - uTime * sp * sqrt(9.8 * k) + warp;
  float m = 1.5 * smoothstep(.2, .85, vn2(p * (.27 / lam) + sd * 11.7 + uTime * .05));       // cat's paws: the chop comes in patches, with slicks between
  float c = cos(ph); sl += dir * (steep * m * fade * (c + .35 * cos(2. * ph + .6)));      // peaked crests, flat troughs
}
// slope of the surface at world xz p (agit scales the chop: the churned water under the Fall)
vec2 riverSlope(vec2 p, vec2 dx, vec2 dy, float agit){
  vec2 sl = vec2(0.);
  wtrain(p, vec2(0.993, 0.122), 3.1, 0.03, 0.5, 1., dx, dy, sl);
  wtrain(p, vec2(0.515, 0.857), 1.7, 0.045, 0.55, 2., dx, dy, sl);
  wtrain(p, vec2(0.906, 0.423), 0.93, 0.078, 0.6, 3., dx, dy, sl);
  wtrain(p, vec2(0.342, 0.940), 0.52, 0.15, 0.6, 4., dx, dy, sl);
  wtrain(p, vec2(0.743, 0.669), 0.29, 0.18, 0.65, 5., dx, dy, sl);
  wtrain(p, vec2(0.974, 0.225), 0.16, 0.17, 0.7, 6., dx, dy, sl);
  wtrain(p, vec2(0.616, 0.788), 0.09, 0.13, 0.7, 7., dx, dy, sl);
  // slow boils welling up from the bed
  float e = .2, b0 = vn2(p * .23 + vec2(0., uTime * .11));
  sl += (vec2(vn2((p + vec2(e, 0.)) * .23 + vec2(0., uTime * .11)), vn2((p + vec2(0., e)) * .23 + vec2(0., uTime * .11))) - b0) / e * .22;
  // and the lumps and dimples of a current over an uneven bed, carried along: no two metres of it alike
  float lf = 1. - smoothstep(.2, .8, max(length(dx), length(dy)));
  if (lf > 0.) { vec2 q = p * .61 + vec2(-uTime * .23, uTime * .06); float e2 = .3, c0 = vn2(q); sl += (vec2(vn2(q + vec2(e2, 0.)), vn2(q + vec2(0., e2))) - c0) / e2 * .05 * lf; }
  return sl * agit;
}
float fleckCell(vec2 q, float cell, float sd, float px){
  vec2 g = q / cell, c = floor(g), f = g - c - .5; float h = h21(c + sd), on = step(.6, h), rr = .09 + .14 * fract(h * 9.3);
  vec2 o = (vec2(h21(c + sd + 3.1), h21(c + sd + 7.7)) - .5) * .34;
  float r = length((f - o) * vec2(.72, 1.25)) + (vn2(g * 3.1 + sd) - .5) * .12, aa = px / cell;                // ragged, a little drawn out along the current
  return mix(on * (1. - smoothstep(rr - .05 - aa, rr + .05 + aa, r)), .09, smoothstep(.35, 1.1, aa));          // too small to draw: its mean
}
// foam coverage at f (xz carried with the current: x runs downstream); px = footprint of a pixel in metres
float riverFoam(vec2 f, float px){
  float lane = smoothstep(.54, .8, vn2(f * vec2(.045, .26) + 7.)) * (.55 + .45 * vn2(f * vec2(.21, .9) + 3.));                   // drift lines along the current
  vec2 fr = vec2(f.x * .8 - f.y * .6, f.x * .6 + f.y * .8) + (vec2(vn2(f * .83 + 13.), vn2(f * .83 + 47.)) - .5) * 2.6;
  float raft = smoothstep(.7, .86, vn2(fr * vec2(.3, .5) + 31.)) * smoothstep(.38, .62, vn2(fr * 1.9 + 5.) * .6 + vn2(fr * 4.3 - 9.) * .4);              // and rafts of froth riding down on it: blotches, never lines
  float sparse = smoothstep(.66, .82, vn2(f * .19 + 21.));
  float bub = mix(smoothstep(.3, .62, vn2(f * 21.) * .6 + vn2(f * 47.) * .4), .5, smoothstep(.02, .09, px));                        // close to, a patch is a raft of bubbles
  float fl = fleckCell(f, .34, 0., px) * (.12 + .88 * lane) + fleckCell(f + 3.7, .13, 5., px) * (.06 + .8 * lane) + fleckCell(f - 9.1, .75, 9., px) * lane * .8 * bub;
  fl = fl * (.3 + .7 * max(lane, sparse)) + raft * mix(.2 + .8 * bub, .26, smoothstep(.05, .5, px)) * (1. - .75 * smoothstep(.3, 1.6, px));
  return clamp(fl, 0., 1.) * .8;
}
// the one place the river is allowed to shine: a glancing band under the sun's own quarter (0 away from it, 1 looking into it)
float sunSheen(vec3 V){ vec2 a = normalize(uSun.xz + vec2(1e-4, 0.)); float d = dot(a, -V.xz / max(length(V.xz), 1e-3)); return smoothstep(.6, .97, d); }
// N: surface normal, V: to the eye, refl: what the surface mirrors there, sh: shadow lying on it (0..1), foam: coverage
// f: xz carried with the current (the silt lies in streaks along it); bank: 0..1 close under a cut bank (dark there: the bank's own shade and wet earth)
// The river is milk tea: silt lit from within. Under the lens it mirrors little; the further off and the more glancing the look, the more
// of the pale sky lies on it, and in the band under the sun it shines.
vec3 riverColor(vec3 N, vec3 V, float dist, vec3 refl, float sh, float foam, vec2 f, float bank){
  float sheen = sunSheen(V) * (1. - .85 * bank);
  float far = smoothstep(3., 42., dist) * (1. - .7 * bank);
  float cv = clamp(dot(N, V), 0., 1.), fres = min(.04 + .96 * pow(1. - cv, 5.), .22 + .2 * far + .34 * sheen);
  float flat0 = max(uSun.y, .06), relief = clamp(max(dot(N, uSun), 0.) / flat0, 0., 1.9);                     // 1 on flat water
  float silt = vn2(f * vec2(.021, .1) + 3.7) * .6 + vn2(f * vec2(.085, .34) - 11.) * .4;                     // thick mud and thin, drawn out by the current
  vec3 tea = uTea * vec3(1., .81, .62) * mix(vec3(.7, .68, .66), vec3(1.1, 1.06, .98), smoothstep(.3, .7, silt)) * (1. - .5 * bank);
  vec3 body = tea * (uSunC * flat0 * mix(.6 + .4 * relief, 1., .55 * smoothstep(5., 36., dist)) * (1. - .75 * sh) * .85 + uSkyC * .9 + uGndC * .2);      // far off the relief is lost
  vec3 rf = refl * mix(vec3(.8, .58, .37), vec3(1.), max(sheen, .6 * far)) * (1. - .4 * bank);                             // away from the sun what it mirrors is seen through the silt
  vec3 col = mix(body, rf * (1. - .35 * sh), fres);
  col = mix(col, uFoam * (uSunC * (.3 + .14 * relief) * (1. - .6 * sh) + uSkyC), foam);
  vec3 Hh = normalize(uSun + V); float ng = max(dot(N, Hh), 0.), fk = smoothstep(4., 70., dist);
  col += uSunC * pow(ng, mix(240., 46., fk)) * mix(1.5, .6 * (.1 + .9 * sheen), fk) * (1. - sh) * (1. - foam);       // glints near; far off a glitter path, and only under the sun
  return col;
}
// a swimmer's wake, in the frame of its quad: a = 0 on the axis .. 1 at the edge, b = 0 ahead of the chest .. 1 at the tail of the wake.
// A solid foam collar round neck and shoulders, churn close astern, and a V of broken foam patches: never two rails.
float wakeFoam(float a, float b, float sd, vec2 uv){
  float n = vn2(uv * 4.5 + sd * 13.), n2 = vn2(uv * 11. - sd * 7.), n3 = vn2(uv * vec2(19., 27.) + sd * 29.);
  float cl = length(vec2(a * 1.15, (b - .2) * 4.2)), collar = exp(-((cl - .4) / .2) * ((cl - .4) / .2)) * (.72 + .28 * smoothstep(.25, .6, n2));
  float ac = .12 + .78 * b + (vn2(vec2(b * 6., sd * 31.)) - .5) * .2;
  float pch = smoothstep(.5, .66, n * .45 + n2 * .35 + n3 * .3) * (1. - smoothstep(.6, 1., b));
  float arm = exp(-((a - ac) / .12) * ((a - ac) / .12)) * smoothstep(.16, .3, b) * pch;
  float churn = (1. - smoothstep(0., .16 + .34 * b, a)) * (1. - b) * (1. - b) * smoothstep(.14, .26, b) * smoothstep(.42, .7, n * .55 + n3 * .5);
  float raw = clamp(collar * .95 + arm * .8 + churn * .6, 0., 1.);
  float tex = .45 + .75 * (vn2(uv * 23. + sd * 5.) * .6 + vn2(uv * 51. - sd * 3.) * .4);       // rafts of bubbles with water showing through, not a white glow
  return smoothstep(.42, .62, raw * tex) * (.75 + .25 * raw);
}
`;
// the shadows of the clouds drifting over the plain. A world lends the pattern its own land is shaded with (a tiling noise texture in tCloud;
// uTCloud = offset xy, 1 / size in metres, amount) so that they lie on the herd and the grass exactly where they lie on the ground under
// them. cloudSun: 1 in the sun, 1 - amount under a cloud. The amount is 0 until a world sets it.
export const CLOUD_GLSL = /* glsl */`
uniform sampler2D tCloud; uniform vec4 uTCloud;
float cloudSun(vec2 xz){ return 1. - uTCloud.w * smoothstep(.46, .66, texture2D(tCloud, xz * uTCloud.z + uTCloud.xy).r); }
`;
// fog for materials that write premultiplied colour (needs <fog_pars_fragment>)
export const GLSL_FOGMIX = /* glsl */`
#ifdef USE_FOG
  #define FOGD vFogDepth
#else
  #define FOGD 0.
#endif
float fogAt(float depth){
#ifdef USE_FOG
  #ifdef FOG_EXP2
    return 1. - exp(-fogDensity * fogDensity * depth * depth);
  #else
    return smoothstep(fogNear, fogFar, depth);
  #endif
#else
  return 0.;
#endif
}
vec3 fogMix(vec3 c, float depth){
#ifdef USE_FOG
  return mix(c, fogColor, fogAt(depth));
#else
  return c;
#endif
}
`;
// projected shadows of the animals in the air: uSh[i] = (body centre xyz, pitch); inactive entries sit far below
export const GLSL_SHADOW = /* glsl */`
uniform vec4 uSh[${NSH}];
float leapShadow(vec3 p){
  float sh = 0.;
  for (int i = 0; i < ${NSH}; i++) {
    vec4 s = uSh[i];
    vec3 w = p - s.xyz; float k = -dot(w, uSun);
    vec3 wp = w + uSun * k;
    vec3 ax = vec3(0., -sin(s.w), cos(s.w)); vec3 axp = ax - uSun * dot(ax, uSun);
    float t = clamp(dot(wp, axp) / max(dot(axp, axp), 1e-4), -.8, .8);
    float dist = length(wp - axp * t), soft = .22 + k * .03;
    sh = max(sh, (1. - smoothstep(.46 - soft * .5, .46 + soft, dist)) * step(.05, k) * (1. - smoothstep(20., 34., k)));
  }
  return sh;
}
`;

// The dust plume as analytic fog. The plume itself is drawn as a BACKDROP (right after the sky, before every
// opaque thing), so nothing solid is ever veiled by dust that lies behind it; instead each opaque material here
// integrates the same envelope along its own view ray with dustVeil(). Use DUST_GLSL + hero.uniforms
// (uPB, uPL, uPBox, uPY, uPDen, uSun, uSunC, uSkyC, uDustLit, uDustShade) in the world's own shaders to match.
export const DUST_GLSL = /* glsl */`
uniform vec3 uPB, uPBox; uniform vec2 uPL, uPY; uniform float uPDen;
vec3 dustShear(vec3 p){ return vec3(p.x - uPB.x - uPL.x * (p.y - uPB.y), p.y, p.z - uPB.z - uPL.y * (p.y - uPB.y)); }
vec3 dustShearDir(vec3 d){ return vec3(d.x - uPL.x * d.y, d.y, d.z - uPL.y * d.y); }
float dustRad(vec3 q, float h){ vec2 rr = mix(vec2(uPBox.x * .8, 17.), vec2(uPBox.x * .7, 22.), h) * (1. + .14 * sin(h * 9. + 1.)); return 1. - length(vec2(q.x + 7. * h * sin(h * 4.6 + .6), q.z + 5.) / rr); }
float dustEnv(vec3 q){
  float hh = (q.y - uPB.y) / (uPY.y - uPB.y), h = clamp(hh, 0., 1.);
  return smoothstep(0., .55, dustRad(q, h)) * smoothstep(-.015, .03, hh) * (1. - smoothstep(.55, 1., h)) * mix(.55, 1., smoothstep(0., .25, h));
}
vec2 dustSpan(vec3 roq, vec3 rdq){
  vec3 sd = vec3(rdq.x < 0. ? -1. : 1., rdq.y < 0. ? -1. : 1., rdq.z < 0. ? -1. : 1.), inv = sd / max(abs(rdq), vec3(1e-5));
  vec3 t0 = (vec3(-uPBox.x, uPY.x, -uPBox.y) - roq) * inv, t1 = (vec3(uPBox.x, uPY.y, uPBox.z) - roq) * inv, a = min(t0, t1), b = max(t0, t1);
  return vec2(max(max(a.x, a.y), max(a.z, 0.)), min(b.x, min(b.y, b.z)));
}
vec3 dustLitC(){ return uDustLit * (.62 + .24 * uSunC); }
vec3 dustShadeC(){ return uDustShade * (1.3 + uSkyC * .8); }
vec4 dustVeil(vec3 p, vec3 cam){
  vec3 rd = p - cam; float dist = max(length(rd), 1e-3); rd /= dist;
  vec3 roq = dustShear(cam), rdq = dustShearDir(rd), sq = dustShearDir(uSun);
  vec2 sp = dustSpan(roq, rdq); sp.y = min(sp.y, dist);
  if (sp.y <= sp.x) return vec4(0.);
  float dl = (sp.y - sp.x) / 4., tau = 0., lit = 0.;
  for (int i = 0; i < 4; i++) {
    vec3 q = roq + rdq * (sp.x + (float(i) + .5) * dl); float e = dustEnv(q);
    tau += e; lit += e * exp(-(dustEnv(q + sq * 9.) + dustEnv(q + sq * 24.) * 1.5) * 1.4);
  }
  return vec4(mix(dustShadeC(), dustLitC(), lit / max(tau, 1e-3)), 1. - exp(-tau * dl * uPDen * .5));
}
`;

// ---------------------------------------------------------------- wildebeest (kit Geo conventions:
// aAnim = (neck weight, limb weight 0 joint..1 tip, part 1 leg / 2 neck+head / 3 tail, 2 = horn), aPivot = joint, aGlow = coat mask)
// tier: lo = true (far, 312 tris), default (584), hi = true (the camera's neighbours: rounder, more rings, eyes and nostrils)
export const HEAD_W = [1.29, 0.96];                         // the poll (y, z) of the far tiers: the head turns about it when swimming
// THE SWIM POSE is baked into every animal geometry (bakeSwim: attributes aSwim, aSwimN) and the shaders blend to it by the swim weight.
// A swimming wildebeest lies along the water: rump under, the hump of the withers a low island, the neck sloping forward out of the water
// at about thirty degrees, the long head carried forward with the chin on the surface and the nostrils clear, horns standing, the white beard
// trailing in the water. Per species: neck = turn of the neck about its base (negative raises it), head = turn of the head about the poll,
// pitch = body pitch (negative = nose up), lv = the body-space height of the waterline in that pose, flat = how far the mane lies down.
// After baking, the waterline of every species is at body height SWIM_LV.
export const SWIM_LV = 1.2;
export const SWIM = { w: { lv: 1.28, pitch: -0.07, head: -0.62, neck: -0.3, flat: 0.75 }, z: { lv: 1.33, pitch: -0.12, head: -0.5, neck: -0.42, flat: 0.5 } };
export function bakeSwim(geo, kind = 'w', poll = null) {
  const S = SWIM[kind], P = geo.attributes.position, N = geo.attributes.normal, A = geo.attributes.aAnim, V = geo.attributes.aPivot, K = geo.attributes.aCrest, n = P.count;
  const pl = poll || geo.userData.poll || HEAD_W, sw = new Float32Array(n * 3), sn = new Float32Array(n * 3), bd = geo.userData.beard || null;
  const rot = (y, z, a) => [y * Math.cos(a) - z * Math.sin(a), z * Math.cos(a) + y * Math.sin(a)];
  for (let i = 0; i < n; i++) {
    let x = P.getX(i), y = P.getY(i), z = P.getZ(i), ny = N.getY(i), nz = N.getZ(i); const part = A.getZ(i), nx = N.getX(i);
    if (K) y -= K.getX(i) * S.flat;                              // the wet mane lies down; the beard clings (its entries are negative)
    if (bd && i >= bd[0] && i < bd[1] && K && K.getX(i) < 0) z -= 0.09;      // and trails back in the water
    if (part > 1.5 && part < 2.5) {
      let a = S.head * Math.min(A.getW(i), 1), r = rot(y - pl[0], z - pl[1], a); y = pl[0] + r[0]; z = pl[1] + r[1]; r = rot(ny, nz, a); ny = r[0]; nz = r[1];
      a = S.neck * A.getX(i); r = rot(y - V.getY(i), z - V.getZ(i), a); y = V.getY(i) + r[0]; z = V.getZ(i) + r[1]; r = rot(ny, nz, a); ny = r[0]; nz = r[1];
    }
    let r = rot(y - PIV, z, S.pitch); y = PIV + r[0] + (SWIM_LV - S.lv); z = r[1]; r = rot(ny, nz, S.pitch);
    if (bd && i >= bd[0] && i < bd[1] && K && K.getX(i) < 0 && y < SWIM_LV + 0.09) { x = x * 2.2 + Math.sign(x) * 0.04 * (SWIM_LV + 0.09 - y) / 0.1; y = SWIM_LV + 0.09; }      // the ends of the beard float, spread on the foam
    sw[i * 3] = x; sw[i * 3 + 1] = y; sw[i * 3 + 2] = z; sn[i * 3] = nx; sn[i * 3 + 1] = r[0]; sn[i * 3 + 2] = r[1];
  }
  geo.setAttribute('aSwim', new THREE.BufferAttribute(sw, 3)); geo.setAttribute('aSwimN', new THREE.BufferAttribute(sn, 3));
  if (K) geo.deleteAttribute('aCrest');
  return geo;
}
// the wet coat: the output stage turns anything under about 0.045 linear into pure black, so a wet hide keeps a slate floor; it is matte,
// with one narrow gold streak where the sun strikes poll, horn boss and the top of the neck, and a little sky on what faces up
export const WET = { floor: 0.082, spec1: 0.24, spec2: 0.03, sheen: 0.03, sheenUp: 0.03, sheenAll: 0.01, sheenShade: 0.03, dark: [0.92, 0.82] };
export function wildebeestGeometry(pal, lo = false, hi = false) {
  const far = lo === 2, g = new Geo(), C = (h) => new THREE.Color(h), RGB = (r, g2, b) => new THREE.Color(r, g2, b);
  // slate hide (linear): blue-grey flank, darker belly and quarters, near-black face, mane and tail, cream beard
  const cCoat = RGB(0.094, 0.087, 0.083), cBelly = RGB(0.04, 0.037, 0.035), cBlack = RGB(0.02, 0.019, 0.02), cFace = RGB(0.032, 0.03, 0.03), cLeg = RGB(0.075, 0.066, 0.058), cSock = RGB(0.15, 0.115, 0.08),
    cBeard = C(pal[4]).multiplyScalar(0.62), cHorn = RGB(0.2, 0.185, 0.16), cHornTip = RGB(0.012, 0.01, 0.009), cHoof = RGB(0.006, 0.005, 0.005);
  // smooth a ring list (Catmull-Rom midpoints) for the near tier
  const refine = (R) => { if (!hi) return R; const o = [], q = (i) => R[Math.min(R.length - 1, Math.max(0, i))];
    for (let i = 0; i < R.length; i++) { o.push(R[i]); if (i < R.length - 1) { const a = q(i - 1), b = q(i), c = q(i + 1), d = q(i + 2), m = {}; for (const k of ['z', 'y', 'rx', 'ry']) m[k] = Math.max(k === 'rx' || k === 'ry' ? 0.001 : -9, (-a[k] + 9 * b[k] + 9 * c[k] - d[k]) / 16); if (b.rx === 0 || c.rx === 0) { m.rx = Math.max(b.rx, c.rx) * 0.72; m.ry = Math.max(b.ry, c.ry) * 0.72; m.z = (b.z + c.z) / 2; m.y = (b.y + c.y) / 2; } o.push(m); } }
    return o; };
  // torso: low rump, sloping back, high humped withers, deep chest
  const body = g.loft(refine([
    { z: -0.82, y: 1.02, rx: 0, ry: 0 }, { z: -0.74, y: 1.0, rx: 0.12, ry: 0.13 }, { z: -0.56, y: 0.975, rx: 0.2, ry: 0.215 }, { z: -0.26, y: 0.95, rx: 0.235, ry: 0.245 },
    { z: 0.04, y: 0.96, rx: 0.25, ry: 0.285 }, { z: 0.28, y: 1.0, rx: 0.25, ry: 0.36 }, { z: 0.46, y: 1.03, rx: 0.215, ry: 0.355 }, { z: 0.6, y: 1.03, rx: 0.15, ry: 0.27 }, { z: 0.7, y: 1.02, rx: 0, ry: 0 },
  ].filter((r, i) => !lo || i !== 1 && i !== 3 && (!far || i !== 5 && i !== 7))), { sides: far ? 4 : lo ? 5 : hi ? 14 : 8, top: cCoat, belly: cBelly, shade: [-0.7, 0.1] });
  g.glow(body, 1);
  // the quarters and the lower shoulder are darker; a paler saddle behind the withers
  g.paint(body, (px, py, pz, c) => { const k = Math.max(0, 1 - Math.abs(pz + 0.1) / 0.5) * Math.max(0, Math.min(1, (py - 0.95) / 0.25)); c.lerp(RGB(0.15, 0.14, 0.132), 0.5 * k); if (pz > 0.25) c.lerp(cBelly, 0.45 * Math.max(0, Math.min(1, (1.12 - py) / 0.3))); });
  const leg = (sx, z, front) => {
    const jy = front ? 0.9 : 0.85, x = sx * (front ? 0.125 : 0.13), k = jy * 0.5;
    const pts = front
      ? [[x, 1.02, z], [x, 0.84, z], [x, k + 0.05, z + 0.012], [x, k, z + 0.016], [x, 0.13, z], [x, 0.065, z + 0.008], [x, 0.03, z + 0.02], [x, 0, z + 0.028]]
      : [[x, 1.0, z + 0.03], [x, 0.8, z - 0.02], [x, k + 0.05, z - 0.07], [x, k, z - 0.08], [x, 0.13, z - 0.03], [x, 0.065, z - 0.02], [x, 0.03, z - 0.005], [x, 0, z + 0.005]];
    const rr = front ? [0.085, 0.07, 0.042, 0.047, 0.028, 0.034, 0.044, 0.05] : [0.115, 0.095, 0.046, 0.05, 0.028, 0.034, 0.044, 0.05];
    const keep = (v, i) => !lo || i === 0 || (i === 1 && !far) || i === 3 || (i === 4 && !far) || i === 7;
    const r = g.tube(pts.filter(keep), rr.filter(keep), lo ? 3 : hi ? 6 : 4, cLeg, cSock);
    g.anim(r, (px, py) => [0, Math.min(1, Math.max(0, (jy - py) / jy)), 1, 0]); g.pivot(r, x, jy, z);
    g.paint(r, (px, py, pz, c) => { if (py < 0.05) c.copy(cHoof); else if (py > 0.62) c.lerp(cCoat, Math.min(1, (py - 0.62) / 0.2)); });
    g.glow(r, (px, py) => (py > 0.7 ? 1 : 0));
  };
  leg(-1, 0.42, true); leg(1, 0.42, true); leg(-1, -0.5, false); leg(1, -0.5, false);
  // neck: short, thick, carried low and forward; everything from here on nods around its base
  const nb = [0, 1.13, 0.52], na = 0.3, nl = 0.44, n0 = g.n, npts = [], nr = [], NN = hi ? 6 : far ? 2 : 4;
  for (let i = 0; i <= NN; i++) { const t = i / NN; npts.push([0, nb[1] - 0.08 * (1 - t) + Math.sin(na) * nl * t, nb[2] + Math.cos(na) * nl * t]); nr.push(0.2 - 0.075 * Math.pow(t, 0.8)); }
  g.glow(g.tube(npts, nr, far ? 4 : lo ? 5 : hi ? 10 : 7, cCoat, cCoat.clone().lerp(cBlack, 0.45), { flatten: 0.74 }), 1);
  // mane: an upright black crest from the poll back over the withers
  const crest = [[0, 1.36, 0.2], [0, 1.385, 0.42], ...npts.slice(1).map((p, i) => [0, p[1] + nr[i + 1] * 0.95, p[2] - 0.03])];
  if (!far) g.strip(crest, crest.map((p, i) => [0, p[1] + (i === 0 ? 0.03 : 0.11), p[2] - 0.03]), cBlack, cBlack);
  // head: long, convex, broad-muzzled, held ~55 degrees down
  const top = npts[NN], hp = 0.98, h0 = g.n, place = (p) => { const y = p[1], z = p[2]; return [p[0], y * Math.cos(hp) - z * Math.sin(hp) + top[1] + 0.03, y * Math.sin(hp) + z * Math.cos(hp) + top[2] + 0.02]; };
  g.loft(refine([{ z: -0.14, y: 0.01, rx: 0, ry: 0 }, { z: -0.07, y: 0.01, rx: 0.085, ry: 0.1 }, { z: 0.08, y: 0.012, rx: 0.1, ry: 0.115 }, { z: 0.25, y: 0, rx: 0.082, ry: 0.098 },
    { z: 0.4, y: -0.012, rx: 0.086, ry: 0.082 }, { z: 0.49, y: -0.02, rx: 0.074, ry: 0.062 }, { z: 0.53, y: -0.025, rx: 0, ry: 0 }].filter((r, i) => !lo || i !== 2 && i !== 5 && (!far || i !== 3))), { sides: far ? 3 : lo ? 4 : hi ? 9 : 6, top: cFace, belly: cFace.clone().lerp(cCoat, 0.3), shade: [-0.6, 0] });
  if (hi) for (const sx of [-1, 1]) {                 // eyes (a wet glint under the horn boss) and nostrils
    g.blob(sx * 0.088, 0.055, 0.1, 0.022, 0.026, 0.034, RGB(0.16, 0.13, 0.1), cBlack, 5, 3);
    g.blob(sx * 0.045, 0.02, 0.5, 0.02, 0.016, 0.03, cBlack, cBlack, 4, 3);
  }
  g.move([h0, g.n], (p) => { const q = place([p.x, p.y, p.z]); p.set(q[0], q[1], q[2]); });
  const hd0 = g.n;
  for (const sx of [-1, 1]) {
    // horns: out from the boss, dipping, then sweeping up and in (0.62 m across)
    const hr = g.tube([[sx * 0.04, 0.1, 0.0], [sx * 0.16, 0.085, 0.01], [sx * 0.26, 0.07, 0.02], [sx * 0.31, 0.15, 0.02], [sx * 0.275, 0.27, 0.0], [sx * 0.22, 0.33, -0.01]].filter((p, i) => !far || i % 2 === 0 || i === 5).map(place),
      [0.05, 0.043, 0.034, 0.026, 0.016, 0].filter((p, i) => !far || i % 2 === 0 || i === 5), lo ? 3 : hi ? 6 : 4, cHorn, cHornTip);
    g.anim(hr, () => [1, 0, 2, 2]);
    if (!lo) g.fan([[sx * 0.07, 0.07, -0.05], [sx * 0.22, 0.03, -0.1], [sx * 0.11, 0.0, -0.04]].map(place), cCoat, cBlack);   // ear
  }
  const hd1 = g.n;
  // beard: a cream fringe from the jaw down the throat (two leaves so it has width from every side)
  const bd = [];
  for (const sx of far ? [] : [-1, 1]) {
    const a = [[sx * 0.02, -0.07, 0.34], [sx * 0.03, -0.09, 0.14], [sx * 0.03, -0.1, -0.02]].map(place).concat([[sx * 0.03, npts[NN >> 1][1] - nr[NN >> 1], npts[NN >> 1][2]], [sx * 0.03, npts[0][1] - nr[0] + 0.03, npts[0][2] + 0.04]]);
    const drop = [0.09, 0.2, 0.25, 0.22, 0.1];
    bd.push(g.strip(a, a.map((p, i) => [p[0] + sx * 0.06, p[1] - drop[i], p[2] + 0.02]), cBeard.clone().lerp(cCoat, 0.3), cBeard));
  }
  for (let i = n0; i < g.n; i++) {
    const t = Math.min(1, Math.max(0, ((g.p[i * 3 + 2] - nb[2]) * Math.cos(na) + (g.p[i * 3 + 1] - nb[1]) * Math.sin(na)) / (nl * 0.6)));
    g.a[i * 4] = i >= h0 ? 1 : t; g.a[i * 4 + 2] = 2; g.pv[i * 3] = 0; g.pv[i * 3 + 1] = nb[1] - 0.1; g.pv[i * 3 + 2] = nb[2];
    if (i >= h0 && i < hd1 && g.a[i * 4 + 3] < 1.5) g.a[i * 4 + 3] = 1;                                   // the head proper (horns keep 2)
  }
  for (const r of bd) for (let i = r[0]; i < r[1]; i++) { const k = (i - r[0]) >> 1; if (k < 3) g.a[i * 4 + 3] = 1; g.g[i] = 2; }      // the jaw end of the beard goes with the head; aGlow 2 = beard hair
  // tail: black, horse-like, to the hocks
  const ty = 1.13, tz = -0.8, t0 = g.n;
  g.tube([[0, ty, tz], [0, ty - 0.12, tz - 0.08], [0, ty - 0.36, tz - 0.1], [0, ty - 0.56, tz - 0.09]].filter((p, i) => !far || i !== 1), [0.03, 0.022, 0.018, 0.016].filter((p, i) => !far || i !== 1), lo ? 3 : 4, cCoat, cBlack);
  const ta = [[0, ty - 0.3, tz - 0.07], [0, ty - 0.5, tz - 0.05], [0, ty - 0.74, tz - 0.05]];
  g.strip(ta, ta.map((p, i) => [0, p[1] - 0.03, p[2] - [0.05, 0.11, 0.07][i]]), cBlack, cBlack);
  if (!lo) g.strip(ta.map((p) => [0.03, p[1], p[2] - 0.03]), ta.map((p, i) => [-0.03, p[1] - 0.04, p[2] - 0.03 - [0.0, 0.03, 0.02][i]]), cBlack, cBlack);
  g.anim([t0, g.n], (x, y) => [0, Math.min(1, Math.max(0, (ty - y) / 0.75)), 3, 0]); g.pivot([t0, g.n], 0, ty, tz);
  return bakeSwim(g.build(), 'w', HEAD_W);
}
// ---------------------------------------------------------------- the near tiers: anatomy lofted from shaped cross-sections
// beastGeometry(pal, 'w' | 'z', tier): tier 2 = the camera's own company (about 2,900 triangles), 1 = the animals within 40 m
// (about 1,200). Same attribute conventions as above, plus aCrest: the height of a mane vertex above its root (the swim pose
// lays the crest flat, so no black fin stands out of the water). geo.userData.poll = the poll (y, z) the head turns about.
// A ring is [z, top, bottom, half width, height of the widest point 0..1, top exponent (under 2 = ridged), side exponent (over 2 = slab-sided)].
function shell(g, rings, sides, cTop, cBel, sh = [-0.55, 0.35]) {
  const start = g.n, rows = [], c = new THREE.Color();
  for (const r of rings) {
    const top = r.cT || cTop, bel = r.cB || cBel;
    if (!(r.w > 1e-5)) { c.copy(top).lerp(bel, 0.5); rows.push([g.v(0, (r.top + r.bot) / 2, r.z, c)]); continue; }
    const row = [], ym = r.bot + (r.top - r.bot) * r.wy;
    for (let j = 0; j < sides; j++) {
      const th = (j / sides) * Math.PI * 2, cs = Math.cos(th), sn = Math.sin(th);
      const x = r.w * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / r.nx);
      const y = cs >= 0 ? ym + (r.top - ym) * Math.pow(cs, 2 / r.nt) : ym - (ym - r.bot) * Math.pow(-cs, 2 / 2.2);
      const k = Math.min(1, Math.max(0, (cs - sh[0]) / (sh[1] - sh[0])));
      c.copy(bel).lerp(top, k * k * (3 - 2 * k));
      row.push(g.v(x, y, r.z, c));
    }
    rows.push(row);
  }
  for (let i = 0; i < rows.length - 1; i++) {
    const A = rows[i], B = rows[i + 1];
    if (A.length === 1 && B.length === 1) continue;
    for (let j = 0; j < sides; j++) {
      const j1 = (j + 1) % sides;
      if (A.length === 1) g.tri(A[0], B[j], B[j1]); else if (B.length === 1) g.tri(A[j], B[0], A[j1]); else g.quad(A[j], B[j], B[j1], A[j1]);
    }
  }
  return [start, g.n];
}
const ringOf = (a) => ({ z: a[0], top: a[1], bot: a[2], w: a[3], wy: a[4] ?? 0.5, nt: a[5] ?? 2, nx: a[6] ?? 2 });
// rows of rings, thinned for the lower tier (every other inner ring) or refined for the top one (Catmull-Rom midpoints)
function ringsFor(tab, tier) {
  let R = tab.map(ringOf);
  if (tier < 1.2) R = R.filter((r, i) => i < 2 || i > R.length - 3 || i % 2 === 0);
  else if (tier >= 2) {
    const o = [], q = (i) => R[Math.min(R.length - 1, Math.max(0, i))];
    for (let i = 0; i < R.length; i++) {
      o.push(R[i]); if (i >= R.length - 1) break;
      const a = q(i - 1), b = q(i), c = q(i + 1), d = q(i + 2), m = {};
      if (b.w === 0 || c.w === 0) continue;
      for (const k of ['z', 'top', 'bot', 'w', 'wy', 'nt', 'nx']) m[k] = (-a[k] + 9 * b[k] + 9 * c[k] - d[k]) / 16;
      if (a.w === 0 || d.w === 0) for (const k of ['top', 'bot', 'w', 'wy', 'nt', 'nx']) m[k] = (b[k] + c[k]) / 2;
      m.z = (b.z + c.z) / 2; o.push(m);
    }
    R = o;
  }
  return R;
}
// a limb standing roughly upright: elliptical sections (rx across, rz fore and aft) at points [x, y, z]
function limb(g, pts, rx, rz, sides, cols) {
  const start = g.n, rows = [];
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], row = [];
    for (let j = 0; j < sides; j++) { const th = (j / sides) * Math.PI * 2; row.push(g.v(p[0] + Math.cos(th) * rx[i], p[1], p[2] + Math.sin(th) * rz[i], cols[i])); }
    rows.push(row);
  }
  for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; g.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]); }
  const cap = g.v(pts[pts.length - 1][0], pts[pts.length - 1][1] - 0.004, pts[pts.length - 1][2], cols[pts.length - 1]);
  for (let j = 0; j < sides; j++) g.tri(rows[pts.length - 1][j], rows[pts.length - 1][(j + 1) % sides], cap);
  return [start, g.n];
}
const SPECIES = {
  // western white-bearded wildebeest: low rump, back climbing to a ridged hump at the withers, deep narrow chest, tucked flank
  w: {
    body: [[-0.86, 1.1, 1.1, 0], [-0.83, 1.15, 1.0, 0.065], [-0.76, 1.175, 0.86, 0.14, 0.5], [-0.66, 1.19, 0.76, 0.185, 0.46], [-0.54, 1.2, 0.72, 0.212, 0.45], [-0.42, 1.205, 0.73, 0.222, 0.5],
      [-0.3, 1.21, 0.77, 0.215, 0.52], [-0.18, 1.22, 0.76, 0.226, 0.52], [-0.06, 1.24, 0.71, 0.246, 0.5], [0.06, 1.27, 0.655, 0.264, 0.5], [0.17, 1.315, 0.61, 0.276, 0.5, 1.9],
      [0.27, 1.37, 0.585, 0.278, 0.48, 1.7], [0.36, 1.415, 0.575, 0.268, 0.46, 1.5], [0.45, 1.425, 0.585, 0.248, 0.45, 1.45], [0.53, 1.39, 0.62, 0.218, 0.45, 1.5], [0.61, 1.32, 0.69, 0.172, 0.45, 1.7],
      [0.68, 1.23, 0.78, 0.11, 0.5], [0.73, 1.0, 1.0, 0]],
    neck: { base: [1.14, 0.5], ang: 0.3, len: 0.47, rings: [[-0.12, 0.22, -0.3, 0.14], [0, 0.205, -0.28, 0.135], [0.1, 0.19, -0.25, 0.125, 0.5, 1.7], [0.2, 0.172, -0.22, 0.115, 0.5, 1.6], [0.3, 0.155, -0.19, 0.106, 0.5, 1.6], [0.4, 0.14, -0.165, 0.098, 0.5, 1.7], [0.48, 0.125, -0.145, 0.092, 0.5, 1.8]] },
    // a long flat-fronted head: deep at the jaw, widest across the eyes, pinched in the face, then a broad blunt muzzle
    head: { pitch: 0.98, off: [0.03, 0.02], s: 0.84, rings: [[-0.15, 0.03, 0.01, 0], [-0.11, 0.098, -0.07, 0.076, 0.5, 2.6, 2.4], [-0.035, 0.128, -0.128, 0.108, 0.58, 3.2, 2.8], [0.06, 0.13, -0.165, 0.116, 0.64, 3.4, 3.0], [0.15, 0.124, -0.16, 0.098, 0.62, 3.4, 3.0],
      [0.25, 0.114, -0.118, 0.074, 0.58, 3.4, 3.0], [0.35, 0.104, -0.088, 0.064, 0.52, 3.4, 3.0], [0.44, 0.094, -0.074, 0.076, 0.5, 3.4, 3.2], [0.52, 0.082, -0.07, 0.093, 0.5, 3.4, 3.4], [0.575, 0.066, -0.064, 0.091, 0.5, 3.4, 3.4], [0.604, 0.03, -0.042, 0.066, 0.5, 2.8, 3.0], [0.615, -0.006, -0.006, 0]] },
    horn: { pts: [[0.035, 0.105, 0], [0.12, 0.108, 0.004], [0.2, 0.092, 0.01], [0.265, 0.075, 0.018], [0.315, 0.09, 0.022], [0.345, 0.15, 0.02], [0.345, 0.225, 0.008], [0.318, 0.295, -0.008], [0.275, 0.345, -0.022], [0.235, 0.375, -0.03]], r: [0.054, 0.05, 0.044, 0.038, 0.033, 0.027, 0.021, 0.015, 0.009, 0] },
    ear: [[0.088, 0.03, -0.075], [0.105, 0.08, -0.09], [0.21, 0.07, -0.13], [0.31, -0.012, -0.165], [0.225, -0.05, -0.135], [0.11, -0.016, -0.082]],
    crest: { from: 0.2, h: [0.06, 0.088], hang: 0.24 }, beard: 1, tail: { y: 1.16, z: -0.83, len: 0.72, tuft: 0.46, r: 0.03 },
    legF: { x: 0.125, z: 0.42, jy: 0.9, k: 1 }, legH: { x: 0.13, z: -0.5, jy: 0.85, k: 1 },
    bumps: [[0.4, 1.02, 0.2, 0.3, 0.04], [0.43, 0.78, 0.11, 0.13, 0.022], [-0.52, 0.94, 0.22, 0.28, 0.036],
      [-0.36, 1.13, 0.075, 0.07, 0.022], [0.16, 0.98, 0.1, 0.25, -0.012], [-0.22, 1.0, 0.11, 0.2, -0.02], [-0.7, 1.0, 0.1, 0.16, 0.014]],
  },
  // plains zebra: level back, round barrel, neck carried up, erect mane, long head, no horns
  z: {
    body: [[-0.8, 1.17, 1.17, 0], [-0.77, 1.225, 1.03, 0.08], [-0.7, 1.272, 0.87, 0.17], [-0.6, 1.3, 0.77, 0.228, 0.46], [-0.48, 1.314, 0.725, 0.254, 0.46], [-0.34, 1.31, 0.715, 0.26],
      [-0.2, 1.296, 0.705, 0.264], [-0.06, 1.286, 0.695, 0.27], [0.08, 1.286, 0.695, 0.27], [0.2, 1.3, 0.7, 0.264], [0.32, 1.32, 0.712, 0.25, 0.5, 1.8], [0.42, 1.326, 0.735, 0.228, 0.5, 1.8],
      [0.51, 1.3, 0.775, 0.19], [0.58, 1.24, 0.835, 0.14], [0.64, 1.03, 1.03, 0]],
    neck: { base: [1.12, 0.43], ang: 0.84, len: 0.6, rings: [[-0.14, 0.2, -0.26, 0.125], [0, 0.175, -0.225, 0.118], [0.12, 0.155, -0.19, 0.108], [0.24, 0.138, -0.165, 0.098], [0.36, 0.124, -0.145, 0.09], [0.48, 0.112, -0.128, 0.083], [0.61, 0.1, -0.115, 0.076]] },
    head: { pitch: 1.12, off: [0.02, 0.0], s: 1.0, rings: [[-0.13, 0.02, 0.02, 0], [-0.09, 0.08, -0.075, 0.066], [-0.02, 0.105, -0.11, 0.09], [0.07, 0.108, -0.125, 0.098, 0.55], [0.17, 0.096, -0.12, 0.09, 0.55],
      [0.28, 0.082, -0.1, 0.074, 0.55], [0.38, 0.072, -0.082, 0.064, 0.5], [0.46, 0.066, -0.072, 0.066, 0.5, 2.2, 2.5], [0.52, 0.056, -0.064, 0.064, 0.5, 2.2, 2.5], [0.555, 0.03, -0.045, 0.045, 0.5], [0.57, -0.006, -0.006, 0]] },
    horn: null, ear: [[0.06, 0.085, -0.06], [0.075, 0.17, -0.1], [0.085, 0.235, -0.125], [0.115, 0.165, -0.1], [0.105, 0.085, -0.05]],
    crest: { from: 0.34, h: [0.085, 0.1], hang: 0 }, beard: 0, tail: { y: 1.25, z: -0.77, len: 0.62, tuft: 0.34, r: 0.026 },
    legF: { x: 0.13, z: 0.4, jy: 0.9, k: 1.12 }, legH: { x: 0.135, z: -0.5, jy: 0.85, k: 1.12 },
    bumps: [[0.38, 1.04, 0.2, 0.28, 0.03], [-0.5, 1.0, 0.22, 0.28, 0.038], [-0.2, 1.02, 0.1, 0.2, -0.012], [-0.68, 1.04, 0.1, 0.16, 0.016]],
  },
};
export function beastGeometry(pal, kind = 'w', tier = 2) {
  const S = SPECIES[kind], zeb = kind === 'z', hiT = tier >= 2, lean = tier < 1, g = new Geo(), RGB = (r, g2, b) => new THREE.Color(r, g2, b), crestH = [];
  const cCoat = zeb ? RGB(0.74, 0.72, 0.67) : RGB(0.09, 0.083, 0.079), cSilver = zeb ? cCoat : RGB(0.125, 0.117, 0.11), cBelly = zeb ? RGB(0.6, 0.58, 0.54) : RGB(0.036, 0.033, 0.031), cBlack = RGB(0.016, 0.015, 0.015),
    cFace = zeb ? RGB(0.66, 0.64, 0.6) : RGB(0.026, 0.024, 0.023), cLeg = zeb ? RGB(0.7, 0.68, 0.63) : RGB(0.066, 0.057, 0.05), cSock = zeb ? RGB(0.66, 0.64, 0.6) : RGB(0.115, 0.092, 0.07), cHoof = RGB(0.008, 0.007, 0.007),
    cBeard = new THREE.Color(pal[4]).multiplyScalar(0.6), cHorn = RGB(0.17, 0.16, 0.14), cHornTip = RGB(0.012, 0.01, 0.009), cMuzzle = zeb ? RGB(0.03, 0.027, 0.026) : cBlack, cMane = zeb ? cCoat : cBlack;
  const lerp = (a, b, t) => a + (b - a) * t, bodyTop = (z) => { const B = S.body; for (let i = 0; i < B.length - 1; i++) if (z <= B[i + 1][0]) { const t = Math.max(0, (z - B[i][0]) / (B[i + 1][0] - B[i][0])); return lerp(B[i][1], B[i + 1][1], t * t * (3 - 2 * t)); } return B[B.length - 1][1]; };
  // ---- torso, with the masses of shoulder, haunch and hip point pushed out of it and the hollows of flank and girth pressed in
  const body = shell(g, ringsFor(S.body, Math.min(tier, 1.5)), hiT ? 12 : lean ? 6 : 8, cCoat, cBelly, [-0.8, 0.0]);
  g.glow(body, 1);
  g.move(body, (p) => { let d = 0; for (const b of S.bumps) { const dz = (p.z - b[0]) / b[2], dy = (p.y - b[1]) / b[3]; d += b[4] * Math.exp(-(dz * dz + dy * dy)); } p.x += Math.sign(p.x) * d * Math.min(1, Math.abs(p.x) / 0.1); });
  if (!zeb) g.paint(body, (px, py, pz, c) => {
    const top = bodyTop(pz), up = Math.min(1, Math.max(0, (py - 0.92) / 0.25));
    c.lerp(cSilver, 0.6 * Math.max(0, 1 - Math.abs(pz + 0.12) / 0.55) * up);                                       // the pale saddle of the flank
    if (pz > 0.2) c.lerp(cBelly, 0.5 * Math.min(1, Math.max(0, (1.1 - py) / 0.32)));                               // dark lower shoulder and brisket
    if (pz < -0.55) c.lerp(cBelly, 0.4 * Math.min(1, (-0.55 - pz) / 0.25));                                         // dark quarters
    c.lerp(cBlack, 0.55 * Math.max(0, 1 - Math.abs(px) / 0.05) * Math.max(0, 1 - (top - py) / 0.05));             // the dorsal stripe
  });
  // ---- legs: forearm and gaskin with muscle, knee and hock as knobs, thin cannons, fetlock, pastern, hoof
  const leg = (sx, L, front) => {
    const x = sx * L.x, z = L.z, jy = L.jy, k = L.k, kn = jy * 0.5;
    let T = front
      ? [[1.03, 0.012, 0.072, 0.098], [0.88, 0.006, 0.064, 0.09], [0.74, 0, 0.052, 0.07], [0.6, 0.006, 0.041, 0.052], [kn + 0.045, 0.014, 0.039, 0.046], [kn, 0.018, 0.041, 0.047], [kn - 0.045, 0.012, 0.034, 0.039], [0.3, 0.004, 0.026, 0.031], [0.17, 0, 0.024, 0.029], [0.105, -0.004, 0.032, 0.037], [0.065, 0.004, 0.029, 0.033], [0.04, 0.014, 0.036, 0.043], [0, 0.024, 0.04, 0.05]]
      : [[1.02, 0.04, 0.085, 0.14], [0.87, 0.01, 0.075, 0.125], [0.72, -0.025, 0.058, 0.094], [0.58, -0.055, 0.044, 0.064], [kn + 0.045, -0.078, 0.039, 0.056], [kn, -0.086, 0.04, 0.054], [kn - 0.05, -0.074, 0.031, 0.038], [0.27, -0.05, 0.026, 0.031], [0.16, -0.036, 0.024, 0.029], [0.105, -0.03, 0.032, 0.037], [0.065, -0.02, 0.029, 0.033], [0.04, -0.006, 0.036, 0.043], [0, 0.005, 0.04, 0.05]];
    if (!hiT) T = T.filter((r, i) => i !== 1 && i !== 4 && i !== 6 && i !== 8 && i !== 10 && !(lean && (i === 3 || i === 11)));
    const cols = T.map((r) => (r[0] < 0.05 ? cHoof : r[0] > 0.62 ? cCoat.clone().lerp(cBelly, zeb ? 0 : 0.35) : cLeg.clone().lerp(cSock, Math.min(1, Math.max(0, (0.5 - r[0]) / 0.3)))));
    const r = limb(g, T.map((q) => [x, q[0], z + q[1]]), T.map((q) => q[2] * k), T.map((q) => q[3] * k), hiT ? 6 : lean ? 3 : 4, cols);
    g.anim(r, (px, py) => [0, Math.min(1, Math.max(0, (jy - py) / jy)), 1, 0]); g.pivot(r, x, jy, z);
    g.glow(r, (px, py) => (zeb ? 1 : py > 0.7 ? 1 : 0));
  };
  leg(-1, S.legF, true); leg(1, S.legF, true); leg(-1, S.legH, false); leg(1, S.legH, false);
  // ---- the mane: a ragged crest of two leaning leaves (a fin would stand out of the water: aCrest lets the swim pose lay it flat)
  const nk = S.neck, na = nk.ang, cn = Math.cos(na), sn = Math.sin(na), nb = nk.base;
  const toNeck = (p) => [p[0], nb[0] + p[1] * cn + p[2] * sn, nb[1] + p[2] * cn - p[1] * sn];
  const crest = (pts, part) => {                       // pts: [x0, y, z] along the ridge, already in body space
    for (const sx of hiT ? [-1, 1] : [0]) {
      const a = [], b = [], hs = [];
      pts.forEach((p, i) => { const end = i === 0 || i === pts.length - 1, h = end ? 0.02 : S.crest.h[i % 2] * (0.85 + 0.3 * ((i * 0.618) % 1)); hs.push(h); a.push([sx * 0.014, p[1] - 0.012, p[2]]); b.push([sx * (zeb ? 0.012 : 0.022 + 0.02 * (i % 2)), p[1] + h, p[2] - h * (zeb ? 0.1 : 0.3)]); });
      const r = g.strip(a, b, cMane, cMane);
      for (let i = 0; i < pts.length; i++) crestH.push([r[0] + i * 2 + 1, hs[i] + 0.012]);
      if (zeb) g.glow(r, 1);
    }
  };
  const ridgeB = []; for (let z = S.crest.from; z < nb[1] - 0.02; z += hiT ? 0.032 : 0.08) ridgeB.push([0, bodyTop(z), z]);
  ridgeB.push([0, bodyTop(nb[1]), nb[1]]);
  crest(ridgeB, 0);
  // ---- neck: short, deep and narrow; everything from here on nods around its base
  const n0 = g.n, NR = ringsFor(nk.rings, Math.min(tier, 1.5));
  const neck = shell(g, NR, hiT ? 10 : lean ? 5 : 6, cCoat, zeb ? cBelly : cCoat.clone().lerp(cBlack, 0.55), [-0.7, 0.2]);
  g.glow(neck, 1);
  const neckTop = (zl) => { const R = nk.rings; for (let i = 0; i < R.length - 1; i++) if (zl <= R[i + 1][0]) { const t = Math.max(0, (zl - R[i][0]) / (R[i + 1][0] - R[i][0])); return [lerp(R[i][1], R[i + 1][1], t), lerp(R[i][3], R[i + 1][3], t)]; } const e = R[R.length - 1]; return [e[1], e[3]]; };
  const ridgeN = []; for (let zl = 0.03; zl <= nk.len + 0.001; zl += hiT ? 0.034 : 0.09) ridgeN.push([0, neckTop(zl)[0], zl]);
  g.move(neck, (p) => { const q = toNeck([p.x, p.y, p.z]); p.set(q[0], q[1], q[2]); });
  crest(ridgeN.map(toNeck), 2);
  if (S.crest.hang > 0 && hiT) for (const sx of [-1, 1]) {      // the long hair that hangs down the side of the neck
    const a = [], b = [];
    ridgeN.forEach((p, i) => { const w = neckTop(p[2])[1], d = S.crest.hang * (i % 2 ? 1 : 0.93) * (0.45 + 0.55 * Math.sin(Math.PI * Math.min(1, (i + 0.7) / ridgeN.length))); a.push(toNeck([sx * 0.02, p[1] - 0.01, p[2]])); b.push(toNeck([sx * (w + 0.018), p[1] - 0.06 - d, p[2] - 0.03])); });
    g.strip(a, b, cBlack, cBlack);
  }
  // ---- head: long and flat-fronted, deep at the jaw, pinched in the face, a broad blunt muzzle; brow ridges over the eyes
  const top = toNeck([0, 0, nk.len]), hp = S.head.pitch, h0 = g.n;
  const place = (p) => [p[0], p[1] * Math.cos(hp) - p[2] * Math.sin(hp) + top[1] + S.head.off[0], p[1] * Math.sin(hp) + p[2] * Math.cos(hp) + top[2] + S.head.off[1]];
  const hs = S.head.s, head = shell(g, ringsFor(S.head.rings.map((r) => [r[0] * hs, r[1] * hs, r[2] * hs, r[3] * hs, r[4], r[5], r[6]]), Math.min(tier, 1.5)), hiT ? 12 : lean ? 5 : 7, cFace, zeb ? cFace : cFace.clone().lerp(cCoat, 0.3), [-0.6, 0.1]);
  if (zeb) { g.glow(head, 1); g.paint(head, (px, py, pz, c) => { c.lerp(cMuzzle, Math.min(1, Math.max(0, (pz - 0.4) / 0.08))); }); }
  else {
    const cBrow = RGB(0.085, 0.058, 0.04), cNose = RGB(0.05, 0.046, 0.044), cCheek = RGB(0.06, 0.055, 0.052);
    g.move(head, (p) => {                                         // the bony brow over each eye, the hollow of the face in front of it, the flare of the nostril
      const z = p.z / hs, y = p.y / hs, ax = Math.abs(p.x) / hs, up = Math.max(0, Math.min(1, (y - 0.02) / 0.06));
      const brow = Math.exp(-(((z - 0.05) / 0.06) ** 2)) * up, hollow = Math.exp(-(((z - 0.3) / 0.1) ** 2)) * Math.max(0, 1 - Math.abs(y) / 0.08), nost = Math.exp(-(((z - 0.55) / 0.04) ** 2)) * up;
      const k = Math.min(1, ax / 0.04); p.x += Math.sign(p.x) * hs * k * (0.014 * brow - 0.012 * hollow + 0.01 * nost); p.y += hs * 0.008 * brow * k;
    });
    g.paint(head, (px, py, pz, c) => {
      const z = pz / hs, y = py / hs;
      c.lerp(cBrow, 0.75 * Math.max(0, 1 - Math.abs(z - 0.0) / 0.12) * Math.max(0, Math.min(1, (y - 0.03) / 0.06)));      // the rufous tuft of the forehead
      c.lerp(cCheek, 0.6 * Math.max(0, 1 - Math.abs(z - 0.1) / 0.12) * Math.max(0, Math.min(1, (0.02 - y) / 0.08)));      // the grey of the jaw
      c.lerp(cNose, 0.8 * Math.max(0, Math.min(1, (z - 0.46) / 0.06)));                                                    // the bare muzzle
    });
  }
  if (!lean) for (const sx of [-1, 1]) {                         // eyes (dark, wet: aGlow -1 gives them their highlight) and nostrils
    const ey = zeb ? g.blob(sx * 0.088, 0.05 * hs, 0.1 * hs, 0.022, 0.026, 0.034, RGB(0.16, 0.13, 0.1), cBlack, 5, 3) : g.blob(sx * 0.101 * hs, 0.066 * hs, 0.085 * hs, 0.03, 0.03, 0.038, RGB(0.05, 0.035, 0.025), cBlack, hiT ? 7 : 5, hiT ? 4 : 3);
    g.glow(ey, -1);
    if (zeb) g.blob(sx * 0.045 * hs, 0.02 * hs, 0.53 * hs, 0.02, 0.016, 0.03, cBlack, cBlack, 4, 3);
    else if (hiT) g.blob(sx * 0.056 * hs, 0.04 * hs, 0.565 * hs, 0.026, 0.017, 0.034, cBlack, cBlack, 5, 3);
  }
  if (S.horn && !lean) g.blob(0, 0.112 * hs, -0.018 * hs, 0.1 * hs, 0.034 * hs, 0.07 * hs, cHorn.clone().multiplyScalar(0.8), cHorn.clone().multiplyScalar(0.45), hiT ? 8 : 5, hiT ? 4 : 3);      // the boss that crosses the poll
  g.move([h0, g.n], (p) => { const q = place([p.x, p.y, p.z]); p.set(q[0], q[1], q[2]); });
  for (const sx of [-1, 1]) {
    if (S.horn) { const hr = g.tube(S.horn.pts.filter((p, i) => hiT || i % 2 === 0 || i === 9).map((p) => place([sx * p[0] * hs * 1.02, p[1] * hs * 0.98, p[2] * hs])), S.horn.r.filter((p, i) => hiT || i % 2 === 0 || i === 9).map((r) => r * 0.92), hiT ? 7 : lean ? 3 : 4, cHorn, cHornTip); g.anim(hr, () => [1, 0, 2, 2]); }
    const cEar = zeb ? cCoat : cCoat.clone().lerp(cBlack, 0.35), er = g.fan(S.ear.map((p) => place([sx * p[0] * hs, p[1] * hs, p[2] * hs])), zeb ? cCoat : RGB(0.13, 0.105, 0.09), cEar); if (zeb) g.glow(er, 1);
  }
  const hd1 = g.n, bd = [], beard0 = g.n;
  if (S.beard) {
    // the white beard: curtains of hair hanging from the jaw and down the throat. Each is a plain strip; the shader cuts it into fine strands of
    // uneven length (ANIMAL_FRAG, aGlow = 2 + leaf + 0.9 x the way down), so there are no locks to count
    const jawL = [[0.42, -0.074], [0.36, -0.086], [0.3, -0.105], [0.24, -0.125], [0.18, -0.138], [0.12, -0.146], [0.06, -0.146], [0.0, -0.13], [-0.05, -0.11]];
    const thrZ = [0.42, 0.36, 0.3, 0.24, 0.18, 0.12, 0.06], NJ = jawL.length, dropA = [0.1, 0.17, 0.22, 0.26, 0.28, 0.29, 0.28, 0.27, 0.27, 0.28, 0.29, 0.28, 0.25, 0.2, 0.13, 0.08];
    const cRoot = cBeard.clone().lerp(cCoat, 0.3), cTip = cBeard.clone();
    const leaves = hiT ? [-1, -0.35, 0.35, 1] : lean ? [0] : [-0.7, 0.7];
    leaves.forEach((sx, ri) => {
      const a = [], b = [], N = NJ + thrZ.length;
      for (let i = 0; i < N; i++) {
        const onJaw = i < NJ, len = dropA[i] * (hiT ? 1 : 1.1);
        const r0 = onJaw ? place([sx * 0.03 * hs, jawL[i][1] * hs, jawL[i][0] * hs]) : (() => { const R = nk.rings, t = thrZ[i - NJ] / nk.len; return toNeck([sx * 0.045, lerp(R[1][2], R[R.length - 1][2], t) + 0.03, thrZ[i - NJ]]); })();
        a.push(r0); b.push([r0[0] + sx * 0.035 + (ri % 2 ? 0.012 : -0.012), r0[1] - len, r0[2]]);
      }
      const r = g.strip(a, b, cRoot, cTip);
      for (let i = 0; i < N; i++) { crestH.push([r[0] + i * 2 + 1, -dropA[i] * 0.45]); bd.push([r[0] + i * 2, i < NJ, 2 + ri], [r[0] + i * 2 + 1, i < NJ, 2 + ri + 0.9]); }
    });
  }
  const beard1 = g.n;
  for (let i = n0; i < g.n; i++) {
    const t = Math.min(1, Math.max(0, ((g.p[i * 3 + 2] - nb[1]) * cn + (g.p[i * 3 + 1] - nb[0]) * sn) / (nk.len * 0.6)));
    g.a[i * 4] = i >= h0 ? 1 : t; g.a[i * 4 + 2] = 2; g.pv[i * 3] = 0; g.pv[i * 3 + 1] = nb[0] - 0.1; g.pv[i * 3 + 2] = nb[1];
    if (i >= h0 && i < hd1 && g.a[i * 4 + 3] < 1.5) g.a[i * 4 + 3] = 1;
  }
  for (const r of bd) { const i = r[0], root = i - (i - beard0) % 2; if (r[1]) g.a[i * 4 + 3] = 1; else g.a[i * 4] = Math.min(1, Math.max(0, ((g.p[root * 3 + 2] - nb[1]) * cn + (g.p[root * 3 + 1] - nb[0]) * sn) / (nk.len * 0.6))); g.g[i] = r[2]; }      // the jaw's hair goes with the head; aGlow >= 2 marks beard hair for the shader
  // ---- tail: a dock, then long black hair to the hocks
  const tl = S.tail, t0 = g.n;
  g.tube([[0, tl.y, tl.z + 0.04], [0, tl.y - 0.03, tl.z - 0.04], [0, tl.y - 0.16, tl.z - 0.085], [0, tl.y - tl.len * 0.5, tl.z - 0.1], [0, tl.y - tl.len * 0.8, tl.z - 0.09]], [tl.r * 1.3, tl.r, tl.r * 0.8, tl.r * 0.62, tl.r * 0.5], hiT ? 6 : 4, cCoat, cBlack);
  const y1 = tl.y - tl.len + tl.tuft, ta = [0, 0.25, 0.5, 0.75, 1].map((u) => [0, y1 - tl.tuft * u, tl.z - 0.085 - 0.02 * Math.sin(u * 3)]);
  for (const an of hiT ? [0, 1.05, 2.1] : [0, 1.57]) g.strip(ta.map((p, i) => [Math.cos(an) * 0.012, p[1], p[2] + Math.sin(an) * 0.012]), ta.map((p, i) => [-Math.cos(an) * (0.02 + 0.05 * Math.sin(Math.PI * Math.min(1, i / 3.4))), p[1] - 0.03 * (i % 2), p[2] - Math.sin(an) * (0.02 + 0.05 * Math.sin(Math.PI * Math.min(1, i / 3.4)))]), cBlack, cBlack);
  g.anim([t0, g.n], (x, y) => [0, Math.min(1, Math.max(0, (tl.y - y) / tl.len)), 3, 0]); g.pivot([t0, g.n], 0, tl.y, tl.z);
  const geo = g.build(), cr = new Float32Array(geo.attributes.position.count);
  for (const c of crestH) cr[c[0]] = c[1];
  geo.setAttribute('aCrest', new THREE.BufferAttribute(cr, 1));
  geo.userData.poll = [top[1] + S.head.off[0], top[2] + S.head.off[1]]; geo.userData.beard = [beard0, beard1];
  return bakeSwim(geo, kind);
}
// marks the head of a kit quadruped (aAnim.w = 1) so the swim pose can lift the muzzle: returns the poll (y, z)
export function markHead(geo, neckAngDeg, neckLen, headPitchDeg) {
  const a = geo.attributes.aAnim, p = geo.attributes.position, pv = geo.attributes.aPivot, na = (neckAngDeg * Math.PI) / 180, dy = Math.sin(na), dz = Math.cos(na), hp = (headPitchDeg * Math.PI) / 180;
  let py = 0, pz = 0;
  for (let i = 0; i < a.count; i++) if (Math.round(a.getZ(i)) === 2) { py = pv.getY(i); pz = pv.getZ(i); break; }
  const qy = py + dy * neckLen, qz = pz + dz * neckLen;
  for (let i = 0; i < a.count; i++) if (Math.round(a.getZ(i)) === 2 && a.getW(i) < 0.5) {
    const t = (p.getY(i) - py) * dy + (p.getZ(i) - pz) * dz, d = (p.getZ(i) - qz) * Math.cos(hp) - (p.getY(i) - qy) * Math.sin(hp);
    if (t > neckLen * 0.6) a.setW(i, sstep(-0.02, 0.1, d));
  }
  a.needsUpdate = true;
  return [qy, qz];
}

// ---------------------------------------------------------------- the animals: one shader for the whole journey
// per instance: iA (lane x, lip z, lip y, clock offset)  iB (run time, slide time, flight time, run speed)
//   iC (leap start: pivot y, z, vy, vz)  iD (seed, size, kind 0 adult / 1 calf, notch depth)
//   iE (face run, slid fraction of the face, swim lateral speed, swim forward speed)  iTint
const ANIMAL_VERT = /* glsl */`
#include <common>
#include <fog_pars_vertex>
attribute vec4 aAnim; attribute vec3 aPivot, aSwim, aSwimN; attribute float aGlow;
attribute vec4 iA, iB, iC, iD, iE; attribute vec3 iTint;
uniform float uT, uCycle, uWaterY, uGait, uSlab; uniform vec3 uSlabX, uKeep; uniform vec4 uWaveP;
varying vec3 vCol, vN, vW, vLp; varying float vWet, vVis, vMask;
${GLSL_COMMON}
vec2 rotP(vec2 yz, float a){ float c = cos(a), s = sin(a); return vec2(yz.x * c - yz.y * s, yz.y * c + yz.x * s); }   // (y,z): nose-down positive
void main(){
  float seed = iD.x, size = iD.y, dN = iD.w;
  float tau = mod(uT + iA.w, uCycle);
  float tA = iB.x, ts = iB.y, tF = iB.z, v = iB.w;
  float s = tau - tA, sl = s - ts, d = sl - tF;
  float x0 = iA.x, zLip = iA.y, yLip = iA.z;
  vec3 p = position, n = normal;
  // ---- gallop on the plain (pivot = body centre)
  float fq = 2.35 / sqrt(size) * uGait, cyc = tau * fq + seed * 7.;
  float runW = 1. - smoothstep(-.2, 0., s);
  float zr = zLip + v * s, rt = clamp((zr - zLip + 10.) / 10., 0., 1.);
  float yG = yLip + dN * (1. - rt * rt * (3. - 2. * rt));
  float crouch = .13, bob = .05 * sin(cyc * 6.2832 + 1.) * runW;
  vec3 P = vec3(x0, yG + (${PIV.toFixed(2)} - crouch + bob) * size, zr);
  float pitchRun = atan(dN * .6 * rt * (1. - rt)) + .06 * sin(cyc * 6.2832 + 2.4) * runW;
  float pitch = pitchRun, yaw = 0.;
  float neckA = .1 + .14 * sin(cyc * 6.2832 + .6), tailUp = .75;
  // ---- the rare slab: whoever stands on it rides it down
  float sK = smoothstep(0., 1., uSlab), sW = (1. - smoothstep(uSlabX.y - 1.5, uSlabX.y, abs(x0 - uSlabX.x))) * smoothstep(zLip - 6.5, zLip - 4., zr) * uSlabX.z;
  { float th = .42 * sK * sW, c = cos(th), sn = sin(th), zP = zLip + .25 + iE.x; vec2 q = P.yz - vec2(0., zP);
    P.yz = mix(P.yz, vec2(q.x * c - q.y * sn - 7.4 * sK, q.y * c + q.x * sn + zP + 3.4 * sK), sW); pitch += th + .2 * sin(sK * PI) * sin(seed * 40.) * sW; P.y -= sW * sK * 1.7 * clamp((x0 - uSlabX.x) / uSlabX.y, -1., 1.); }
  // ---- sliding a chute on the haunches
  float wSlide = 0.;
  if (ts > 0. && s > 0.) {
    float k = clamp(s / ts, 0., 1.), t = iE.y * k * sqrt(k);
    float al = atan(yLip, iE.x * dprof(t));
    vec2 ps = vec2(yLip * (1. - t), zLip + iE.x * prof(t)) + vec2(cos(al), sin(al)) * .62 * size;
    wSlide = smoothstep(0., .28, s);
    P.yz = mix(P.yz, ps, wSlide); pitch = mix(pitch, al * .9, wSlide); neckA = mix(neckA, -.5, wSlide);
  }
  // ---- in the air
  float q = clamp(sl / max(tF, .01), 0., 1.), wFly = smoothstep(-.06, .14, sl);
  if (sl > 0.) {
    float t2 = min(sl, tF);
    P.y = iC.x + iC.z * t2 - ${(0.5 * GRAV).toFixed(2)} * t2 * t2; P.z = iC.y + iC.w * t2;
    float pv = atan(-(iC.z - ${GRAV.toFixed(2)} * t2), iC.w) * .85;
    pitch = mix(pitch, pv, smoothstep(0., .25, sl));
    neckA = mix(neckA, mix(-.32, .12, q), wFly); tailUp = 1.1;
  }
  // ---- plunge, surface, swim
  float wSwim = smoothstep(0., .35, d);
  if (d > 0.) {
    float zL = iC.y + iC.w * tF, yL = iC.x + iC.z * tF - ${(0.5 * GRAV).toFixed(2)} * tF * tF;
    vec2 xz = swimXZ(d, vec4(x0, zL, iE.z, iE.w), iC.w);
    float ySw = uWaterY + (${PIV.toFixed(2)} - ${SWIM_LV.toFixed(2)}) * size, kk = clamp(d / .8, 0., 1.);
    float y = ySw + (yL - ySw) * exp(-d * 9.) - 4.8 * size * kk * (1. - kk) + .05 * sin(tau * 5.2 + seed * 40.) * smoothstep(.7, 1.6, d);
    y -= smoothstep(uCycle - 2.8, uCycle - .4, tau) * 1.15 * size;
    P = vec3(xz.x, y, xz.y);
    // nobody swims through the lens: whoever would cross within a body length of the viewer is carried round
    { vec2 kd = P.xz - uKeep.xy; float kl = length(kd), kq = max(0., 1. - kl / uKeep.z); P.xz += kd / max(kl, .05) * .62 * uKeep.z * kq * kq; }
    // the slab's wave lifts each swimmer as it passes
    float wr = length(P.xz - uWaveP.xy) - uWaveP.z, wg = uWaveP.w * exp(-wr * wr * .08); P.y += .05 * wg;
    pitch = mix(pitch, .025 * sin(tau * 2.3 + seed * 30.), smoothstep(0., .7, d)) - .1 * wg;
    yaw = atan(iE.z, iE.w) * .7 * smoothstep(.3, 2.5, d);
    tailUp = .15;
  }
  // ---- pose
  float part = aAnim.z;
  if (part > .5 && part < 1.5) {
    // two-bone leg solved to a foot target; on the ground the target is planted (moves back at exactly body speed)
    bool front = aPivot.z > 0.; float side = aPivot.x > 0. ? 1. : 0.;
    float jy = aPivot.y, l1 = jy * .5, duty = .22, Ls = (v / size) * duty / fq;
    float ph = fract(cyc + (front ? .45 : 0.) + side * .11), dz, lift;
    if (ph < duty) { dz = Ls * (.5 - ph / duty); lift = 0.; }
    else { float e = (ph - duty) / (1. - duty); dz = Ls * (e * e * (3. - 2. * e) - .5); lift = (front ? .34 : .26) * sin(e * PI); }
    float zf = zr + (aPivot.z + dz) * size, rf = clamp((zf - zLip + 10.) / 10., 0., 1.);
    float yGf = yLip + dN * (1. - rf * rf * (3. - 2. * rf));
    vec2 Fw = vec2(${PIV.toFixed(2)} - (yG + (${PIV.toFixed(2)} - crouch + bob) * size - yGf) / size + lift, aPivot.z + dz);
    vec2 T = vec2(${PIV.toFixed(2)}, 0.) + rotP(Fw - vec2(${PIV.toFixed(2)}, 0.), -pitchRun);
    float jit = sin(tau * 13. + seed * 9. + side * 2. + (front ? 0. : 1.7));
    if (ts > 0.) T = mix(T, front ? vec2(.13 + .03 * jit, aPivot.z + .36) : vec2(.42, aPivot.z + .22 + .05 * jit), smoothstep(-.05, .15, s));
    float reach = smoothstep(.5, .9, q) * (.55 + .45 * h11(seed + 3.));
    vec2 Tf = front ? mix(vec2(.52, aPivot.z + .12), vec2(.17, aPivot.z + .42), reach) : mix(vec2(.3, aPivot.z - .55), vec2(.42, aPivot.z + .04), smoothstep(.45, 1., q));
    Tf.y += .07 * jit;
    T = mix(T, Tf, wFly);
    vec2 hip = vec2(jy, aPivot.z), dd = T - hip;
    float dist = clamp(length(dd), .08, 2. * l1 * .999);
    float beta = atan(dd.y, max(-dd.x, .02)), A = acos(clamp(dist / (2. * l1), -1., 1.));
    float ua = beta + (front ? A : -A);
    vec2 knee = hip + l1 * vec2(-cos(ua), sin(ua));
    float la = atan(T.y - knee.y, knee.x - T.x + 1e-4);
    float w = smoothstep(.42, .58, aAnim.y);
    vec2 up = hip + rotP(p.yz - hip, -ua), lo = knee + rotP(p.yz - vec2(jy - l1, aPivot.z), -la);
    p.yz = mix(up, lo, w); n.yz = mix(rotP(n.yz, -ua), rotP(n.yz, -la), w);
  } else if (part > 1.5 && part < 2.5) {
    if (aAnim.w > 1.5 && iD.z > .5) p = mix(p, vec3(sign(p.x) * .05, 1.36, 1.04), .6);      // calves: short spikes
    float a = neckA * aAnim.x;
    p.yz = aPivot.yz + rotP(p.yz - aPivot.yz, a); n.yz = rotP(n.yz, a);
  } else if (part > 2.5) {
    float w = aAnim.y, a = w * (tailUp + .25 * sin(cyc * 12.566 + seed));
    p.yz = aPivot.yz + rotP(p.yz - aPivot.yz, a); n.yz = rotP(n.yz, a);
    p.x += w * w * .16 * sin(tau * 9. + seed * 20.);
  }
  // ---- swimming: the baked pose (head low and forward, chin on the water, the withers awash), with a slow nod of the head
  if (wSwim > 0.) {
    vec3 sp = aSwim, sn = aSwimN;
    if (part > 1.5 && part < 2.5) { float na = .045 * sin(tau * 2.3 + seed * 40.) * aAnim.x; sp.yz = aPivot.yz + rotP(sp.yz - aPivot.yz, na); sn.yz = rotP(sn.yz, na); if (aAnim.w > 1.5 && iD.z > .5) sp = mix(sp, vec3(sign(sp.x) * .05, 1.42, 1.1), .6); }
    p = mix(p, sp, wSwim); n = mix(n, sn, wSwim);
  }
  // ---- body transform
  vec3 b = p - vec3(0., ${PIV.toFixed(2)}, 0.);
  b.yz = rotP(b.yz, pitch); n.yz = rotP(n.yz, pitch);
  float roll = (.1 * sin(tau * 3. + seed * 11.) * wFly + .05 * sin(tau * 2.6 + seed) * wSwim);
  float cr = cos(roll), sr = sin(roll); b.xy = vec2(b.x * cr - b.y * sr, b.y * cr + b.x * sr); n.xy = vec2(n.x * cr - n.y * sr, n.y * cr + n.x * sr);
  float cy = cos(yaw), sy = sin(yaw); b.xz = vec2(b.x * cy + b.z * sy, b.z * cy - b.x * sy); n.xz = vec2(n.x * cy + n.z * sy, n.z * cy - n.x * sy);
  vec3 wp = P + b * size;
  vW = wp; vN = n; vLp = position; vMask = aGlow;
  vCol = color * iTint;
  vWet = smoothstep(0., .3, d);
  vVis = smoothstep(.05, 1., tau) * (1. - smoothstep(uCycle - 1.7, uCycle - .3, tau));
  vec4 mvPosition = modelViewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
export const ANIMAL_FRAG = /* glsl */`
#include <common>
#include <fog_pars_fragment>
uniform vec3 uSun, uSunC, uSkyC, uGndC, uDustLit, uDustShade, uTea, uCamL, uSkyRef; uniform float uWaterY, uRim, uShade;
varying vec3 vCol, vN, vW, vLp; varying float vWet, vVis, vMask;
${GLSL_COMMON}
${DUST_GLSL}
${CLOUD_GLSL}
void main(){
  if (vVis < .995) { float dn = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715)))); if (dn > vVis) discard; }
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCamL - vW + vec3(0., 1e-5, 0.));
  // the hide's fine work, by how far the hide is from the eye (uCamL): within eight metres of the eye all of it, beyond twelve and a
  // half none. The brindle stands out of a paler coat, dust lies to the knee, the shade side is slate and the sun's side carries a
  // broad gold edge on spine, hump and horn.
  float nearK = 1. - smoothstep(8., 12.5, length(uCamL - vW));
  vec3 alb = vCol; float beard = step(1.5, vMask), eyeM = step(vMask, -.5), mk = clamp(vMask, 0., 1.) * (1. - beard);     // aGlow: 1 = coat (bars, stripes), 2.. = beard hair, -1 = eye
  // the beard is a curtain cut into fine strands of uneven length (vMask = 2 + leaf + .9 x the way down the hair); too far off to draw them, a ragged hem
  float bStr = 1., bfw = fwidth(vLp.z) * 125.;
  if (beard > .5) {
    float bt = vMask - 2., leaf = floor(bt + .001), bv = (bt - leaf) / .9, bu = vLp.z * 125. + leaf * 17.37, sid = floor(bu), bf = fract(bu) - .5;
    float thin = smoothstep(.5, 1.4, bfw), blen = (.38 + .62 * h11(sid * 1.31 + leaf * 7.)) * (.75 + .25 * sin(vLp.z * 23. + leaf * 2.));
    float bw = .5 * (1. - .75 * smoothstep(.3, 1., bv / max(blen, .05)));
    if (bv > .02 && (bv > mix(blen, .62 + .2 * sin(vLp.z * 23. + leaf * 2.), thin) || abs(bf) > mix(bw, .5, thin))) discard;
    bStr = mix(.8 + .35 * h11(sid + 3.), 1., thin) * (.72 + .28 * smoothstep(0., .5, bv));
  }
  // the coat: hair lying along the body and down the flanks, in clumps when it is wet; mottling; never one flat tone
  float hair = vn2(vec2(vLp.z * 26. + vLp.y * 6., vLp.y * 38. + vLp.x * 20.)), mott = vn3(vLp * vec3(6., 7., 5.) + 3.);
  float hc = vLp.y * 150. + vLp.x * 95. + vn2(vLp.zy * vec2(9., 7.)) * 9., hk = 1. - smoothstep(.6, 1.7, fwidth(hc));
  float hs1 = vn2(vec2(vLp.z * 7., hc)), hs2 = vn2(vec2(vLp.z * 3. + 5., hc * .31));
  float streak = mix(.5, hs1 * .6 + hs2 * .4, hk), coatK = (1. - beard) * (1. - eyeM);
#ifdef ZEBRA
  float H = 1.35, leg = 1. - smoothstep(.5 * H, .62 * H, vLp.y), nk = smoothstep(.5, .8, vLp.z) * smoothstep(.95 * H, 1.1 * H, vLp.y);
  vec3 dir = normalize(mix(mix(vec3(0., .25, 1.), vec3(0., 1., .1), leg), vec3(0., .75, -.65), nk));
  float sp = dot(vLp, dir) * 50. / H + sin(vLp.y * 5. / H + vLp.x * 3.) * .6, fw = fwidth(sp);
  float st = smoothstep(-.3 - fw, .3 + fw, sin(sp)); st = mix(st, .45, smoothstep(1.2, 2.8, fw));
  alb = mix(alb, mix(vec3(.012, .011, .012), alb * 1.1, st), mk);
  alb *= .86 + .2 * mott;
  float bars = 0.;
#else
  // brindle bars down neck, shoulder and flank, dying out on the quarters
  float bz = vLp.z * 47. + sin(vLp.y * 8. + vLp.z * 3.) * 1.6 + (vn2(vLp.zy * 5.) - .5) * 5.;
  float bars = smoothstep(.3, .8, sin(bz)) * smoothstep(-.5, .0, vLp.z) * smoothstep(.72, .96, vLp.y) * (.4 + .6 * vn2(vLp.zy * 3. + 7.)) * mk;
  alb *= mix(.8 + .15 * hair * mk + .2 * mott, bStr, beard);
#endif
  // dust on dry legs; wet coats go darker
  float dry = 1. - smoothstep(.45, 1., vWet);
  alb = mix(alb, uDustLit * .16, dry * min(.04 + .34 * (1. - smoothstep(.08, .6, vLp.y)) + .34 * nearK * (1. - smoothstep(.1, .85, vLp.y)), .8) * (1. - eyeM));
  alb *= mix(1., .88, vWet * beard);                                                      // wet, the beard is still pale cream against the dark throat
  float wetC = vWet * coatK;                                                              // the beard stays matte hair, wet or dry
  float clearW = smoothstep(uWaterY + .35, uWaterY + 1.1, vW.y);                          // out of the water and no longer streaming: a soaked coat is darker than a dry one
  alb *= mix(1., mix(${WET.dark[0].toFixed(2)}, ${WET.dark[1].toFixed(2)}, mk), wetC) * mix(1., .6, wetC * clearW);
#ifndef ZEBRA
  alb = mix(alb, max(alb, vec3(1., .95, .93) * ${WET.floor.toFixed(3)} * (1. - .7 * clearW) * (.72 + 3. * dot(alb, vec3(.33))) * (1. + .8 * mk)), wetC);        // wet slate, never a black hole: the face stays a tone darker than the coat
  alb *= 1. - mix(.5, .4, wetC) * bars;                                                   // the bars show wet or dry
#endif
  alb *= 1. + nearK * coatK * mix(.2 - .42 * bars, .26 - .3 * bars, vWet);
  alb *= mix(1., mix(.84 + .32 * streak, .6 + .8 * streak, wetC), coatK);                 // hair: fine and dry, or wet and drawn into dark and bright strings
  float hairN = (.25 + .75 * wetC) * hk * coatK;
  vec3 Ng = N;                                                                            // (the body's own normal: the wet rim and the wet streak follow the form, not the hair)
  N = normalize(N + vec3(hs1 - .5, (hs2 - .5) * .7, 0.) * .85 * hairN);                   // and the light breaks along it
  float ndl = dot(N, uSun), dif = max(ndl * .72 + .28, 0.); dif *= dif;
  // hides stay warm slate under gold light and blue sky: the fill is three parts grey, the gold goes into the rim
  float sunL = dot(uSunC, vec3(.3, .5, .2));
  vec3 sunD = mix(uSunC, vec3(sunL), .66), skyD = mix(uSkyC, vec3(dot(uSkyC, vec3(.3, .5, .2))), .68);
  vec3 amb = mix(uGndC * .85 + uDustLit * .06, skyD * .9, N.y * .5 + .5) * (.55 + .45 * smoothstep(-.95, .25, N.y)) + vec3(.108, .1, .095) * sunL * (.7 + .3 * N.y) * (1. + 1.4 * nearK) + uDustLit * sunL * .1 * nearK * (1. - smoothstep(-.5, .3, N.y));       // a floor of warm grey: the shade side is slate, never a black hole; bellies and the insides of legs sit in their own shade
  float cs = cloudSun(vW.xz);                                                             // a cloud's shadow lies on it as it lies on the ground
  vec3 col = alb * (sunD * dif * .38 * (1. - .9 * uShade) * cs + amb * (1. - .35 * uShade) * (.82 + .18 * cs) + uDustLit * .12 * uShade);     // uShade: down in the gully, out of the sun
  col += alb * uSunC * vec3(1., .8, .52) * max(ndl, 0.) * smoothstep(-.15, .45, Ng.y) * 1.25 * cs * (1. - .9 * uShade) * (1. - vWet);      // the low sun rakes spine, poll and horns with gold
  float fr = 1. - max(dot(N, V), 0.), fr2 = fr * fr, fr3 = fr2 * fr;
  float frG = 1. - max(dot(Ng, V), 0.), frR = mix(fr, frG, vWet), spine = smoothstep(.3, .8, Ng.y), topK = smoothstep(-.15, .45, Ng.y);
  float toSun = smoothstep(-.25, .55, ndl);
  float rimK = smoothstep(-.25, .15, ndl) * (1. - .92 * smoothstep(.22, .6, ndl));                                      // only where the light just grazes: a flank square to the sun is lit, not rimmed
  float frP = frR * frR * frR; frP *= mix(frR, 1., .7 * nearK) * (1. + .8 * nearK);
  float hb = mix(1., .3 + 1.5 * streak * streak, hk * coatK);                                                            // highlights sit on the hair, not on a skin of plastic
  col += uSunC * mix(mix(uDustLit, vec3(1.), .3), vec3(.86, .66, .42), vWet) * frP * (.03 + .8 * rimK) * uRim * (.12 + .88 * cs) * mix(1., .5 * topK, vWet) * (1. - beard) * mix(1., hb, .7 * (1. - vWet)) * mix(1., (1. - .6 * bars) * (.6 + .8 * mott) * (.45 + .55 * smoothstep(.55, .9, frR)), 1. - vWet);      // the burning rim on spine, horn and flank; on a wet hide it is gold and keeps to what faces up: spine, poll and horns
  col += uSunC * vec3(1., .8, .5) * beard * nearK * bStr * toSun * .05 * (1. - .6 * uShade) * cs;
  col += skyD * fr2 * .04 * (1. - toSun);                                                                                // a cool edge on the shaded side
  vec3 Hh = normalize(uSun + V); float nh = max(dot(N, Hh), 0.), upK = smoothstep(.25, .9, N.y);
  float low = mix(.2, 1., 1. - smoothstep(uWaterY + .5, uWaterY + 1.25, vW.y));                                          // what stands well clear of the water has stopped streaming
  col += uSunC * (pow(nh, 36.) * .02 + wetC * hb * spine * (pow(nh, 90.) * ${WET.spec1.toFixed(3)} + pow(nh, 14.) * ${WET.spec2.toFixed(3)} * low));    // wet: narrow gold lines along poll, horn boss and the top of the neck
  col += mix(uSkyRef, vec3(.34, .5, .85) * (dot(uSkyRef, vec3(.3, .5, .2)) * 1.5 + .1), .8) * wetC * low * hb * (fr3 * (${WET.sheen.toFixed(3)} * (.3 + .7 * spine) + ${WET.sheenUp.toFixed(3)} * upK) + ${WET.sheenAll.toFixed(3)} * upK + ${WET.sheenShade.toFixed(3)} * fr2 * (1. - toSun) * (.4 + .6 * spine));        // and the sky lying on it: blue on the shaded side
  col += uSunC * vec3(1., .82, .55) * wetC * max(ndl, 0.) * max(ndl, 0.) * upK * .03 * hb;                          // and the low sun warm along whatever of it faces up
  if (eyeM > .5) { float eg = pow(max(dot(N, normalize(V + vec3(0., .8, 0.))), 0.), 16.); col = alb * amb * .6 + (uSkyRef * 2.6 + uSunC * .7) * eg * eg; }      // the eye: dark, wet, a point of sky in it
  col = mix(col, uTea * (uSunC * .25 + uSkyC), (1. - smoothstep(uWaterY - .3, uWaterY + .03, vW.y)) * .85);
  // the knee-deep dust every dry hoof runs in, brighter on the sun side
  vec3 dc = mix(dustShadeC(), dustLitC(), .35 + .35 * toSun); dc = mix(dc, vec3(dot(dc, vec3(.3, .5, .2))), .3);         // a veil, not paint: greyer than the lit plume
  float dk = 1. - smoothstep(.0, .5, vLp.y), lay = max(.55 - vLp.y, 0.) / max(1.5 - vLp.y, .4) * length(uCamL - vW);      // and far off the layer itself lies between us and its legs
  col = mix(col, dc * (1. - .35 * uShade), dry * max(dk * dk * .62, (1. - exp(-lay * .1)) * .85) * (1. - eyeM));
  vec4 dv = dustVeil(vW, uCamL); col = mix(col, dv.rgb, dv.a);
  gl_FragColor = vec4(col, 1.);
  #ifdef USE_FOG
    float fd = vFogDepth * .55; gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, 1. - exp(-fogDensity * fogDensity * fd * fd));         // a dark body holds its own in the haze longer than the ground does
  #endif
}`;

// lays the herd out: lanes along the front, phases round the cycle, leapers and sliders, the swim
function layoutHerd(rng, S0, n, o) {
  const S = o.cycle ? { ...S0, cycle: o.cycle } : S0;
  const A = { n, iA: new Float32Array(n * 4), iB: new Float32Array(n * 4), iC: new Float32Array(n * 4), iD: new Float32Array(n * 4), iE: new Float32Array(n * 4), tint: new Float32Array(n * 3), land: [] };
  const gold = 0.6180339887, off = rng();
  for (let i = 0; i < n; i++) {
    // lanes: a low-discrepancy sweep of the front, pulled toward the worn chutes
    let x = (((i * gold + off) % 1) - 0.5) * 2 * S.half;
    if (S.chutes.length && rng.chance(0.62)) { const c = S.chutes[Math.floor(rng() * S.chutes.length)]; x = c.x + rng.gauss() * c.w * 0.4; }
    x = Math.max(-S.half - 3, Math.min(S.half + 3, x));
    const ch = S.chute(x), zLip = S.lipZ(x), yLip = S.lipY(x), R = S.runR(x), dN = S.notch(x);
    const calf = o.calf(i), size = (calf ? rng.range(0.68, 0.8) : rng.range(0.93, 1.1)) * o.scale, seed = rng();
    const v = rng.range(8.2, 10.2), tA = (zLip - ZBACK - rng.range(1, 7) - (o.cycle ? 14 : 0)) / v;
    const slider = ch > 0.45 && rng.chance(o.cycle ? 0.55 : 0.82);
    let ts = 0, tEnd = 0, y1 = yLip + (PIV - 0.13) * size, z1 = zLip, vy = rng.range(1.2, 3.4), vz = v * rng.range(0.72, 0.9);
    if (slider) {
      ts = rng.range(0.75, 1.05); tEnd = rng.range(0.34, 0.56);
      const al = Math.atan2(yLip, R * dprof(tEnd)), len = Math.hypot(yLip, R) * tEnd, sp = Math.min(9, (1.5 * len) / ts) * 0.75;
      y1 = yLip * (1 - tEnd) + Math.cos(al) * 0.62 * size; z1 = zLip + R * prof(tEnd) + Math.sin(al) * 0.62 * size;
      vy = -Math.sin(al) * sp + rng.range(1.5, 2.6); vz = Math.cos(al) * sp + rng.range(2.4, 3.6);
    }
    // flight ends when the body centre is 0.3 above the water
    const yEnd = S.waterY + 0.3 * size, tF = (vy + Math.sqrt(vy * vy + 2 * GRAV * Math.max(0.1, y1 - yEnd))) / GRAV;
    const swimT = S.cycle - (tA + ts + tF), vS = Math.max(1.4, (o.swimLength - (z1 + vz * tF)) / Math.max(4, swimT - 1.5));
    let vx = S.current * S.curSpeed * rng.range(0.5, 0.85) + (x / S.half) * 0.35 + rng.gauss() * 0.22, vSw = vS;
    if (o.swimTo) { const T = Math.max(4, swimT - 1.2); vx = (o.swimTo[0] + rng.gauss() * 4 - x) / T; vSw = Math.max(0.8, (o.swimTo[1] + rng.gauss() * 3 - (z1 + vz * tF)) / T); }
    const t0 = o.t0 ? o.t0(i) : tA - ((i + rng.range(-0.3, 0.3)) / n) * S.cycle;      // arrivals at the lip are evenly spread
    A.iA.set([x, zLip, yLip, t0], i * 4); A.iB.set([tA, ts, tF, v], i * 4); A.iC.set([y1, z1, vy, vz], i * 4);
    A.iD.set([seed, size, calf ? 1 : 0, dN], i * 4); A.iE.set([R, tEnd, vx, vSw], i * 4);
    const c = o.tint(calf, rng); A.tint.set([c.r, c.g, c.b], i * 3);
    A.land.push({ x, z: z1 + vz * tF, tL: tA + ts + tF, t0, vx, vS: vSw, vImp: vz, size, slider, tA, ts, tEnd, zLip, yLip, R, v, dN, y1, z1, vy, vz, tF, swimT, cycle: S.cycle, fill: !!o.cycle });
  }
  return A;
}
// CPU mirror of the shader's body-centre track (phase: 0 run, 1 slide, 2 air, 3 water)
function animalState(S0, a, clock, out) {
  const S = a.cycle && a.cycle !== S0.cycle ? { waterY: S0.waterY, cycle: a.cycle } : S0;
  const tau = (((clock + a.t0) % S.cycle) + S.cycle) % S.cycle, s = tau - a.tA, sl = s - a.ts, d = sl - a.tF;
  if (d > 0) {
    const ySw = S.waterY + (PIV - SWIM_LV) * a.size, yL = a.y1 + a.vy * a.tF - 0.5 * GRAV * a.tF * a.tF, kk = Math.min(1, d / 0.8);
    out.x = a.x + a.vx * (d - 1.2 * (1 - Math.exp(-d / 1.2))); out.z = a.z + a.vS * d + (a.vImp * 0.5 - a.vS) * 0.4 * (1 - Math.exp(-d / 0.4));
    out.y = ySw + (yL - ySw) * Math.exp(-d * 9) - 4.8 * a.size * kk * (1 - kk) - sstep(S.cycle - 2.8, S.cycle - 0.4, tau) * 1.15 * a.size; out.pitch = -0.17; out.phase = 3;
  } else if (sl > 0) {
    out.x = a.x; out.y = a.y1 + a.vy * sl - 0.5 * GRAV * sl * sl; out.z = a.z1 + a.vz * sl; out.pitch = Math.atan2(-(a.vy - GRAV * sl), a.vz) * 0.85 * sstep(0, 0.25, sl); out.phase = 2;
  } else if (s > 0 && a.ts > 0) {
    const k = Math.min(1, s / a.ts), t = a.tEnd * k * Math.sqrt(k), al = Math.atan2(a.yLip, a.R * dprof(t)), b = sstep(0, 0.28, s);
    const ry = a.yLip + (PIV - 0.13) * a.size, rz = a.zLip + a.v * s;
    out.x = a.x; out.y = ry + (a.yLip * (1 - t) + Math.cos(al) * 0.62 * a.size - ry) * b; out.z = rz + (a.zLip + a.R * prof(t) + Math.sin(al) * 0.62 * a.size - rz) * b; out.pitch = al * 0.9 * b; out.phase = 1;
  } else {
    const z = a.zLip + a.v * s, rt = Math.min(1, Math.max(0, (z - a.zLip + 10) / 10));
    out.x = a.x; out.z = z; out.y = a.yLip + a.dN * (1 - rt * rt * (3 - 2 * rt)) + (PIV - 0.13) * a.size; out.pitch = 0; out.phase = 0;
  }
  out.vis = tau > 0.5 && tau < S.cycle - 1;
  return out;
}
function layoutMill(rng, S, n, cyc) {
  const A = { n, iA: new Float32Array(n * 4), iB: new Float32Array(n * 4), iC: new Float32Array(n * 4), iD: new Float32Array(n * 4), iE: new Float32Array(n * 4), tint: new Float32Array(n * 3) };
  for (let i = 0; i < n; i++) {
    const onSlab = i % 5 === 0, x = onSlab ? S.slabX + rng.range(-7.5, 7.5) : rng.range(-S.half - 22, S.half + 9), calf = i % 6 === 5, size = calf ? rng.range(0.68, 0.8) : rng.range(0.93, 1.1), v = rng.range(0.14, 0.3), k = rng.range(0.6, 0.95);
    A.iA.set([x, S.lipZ(x) - 0.25, S.lipY(x), rng() * cyc], i * 4); A.iB.set([cyc + rng.range(0.3, 3), 0, 1, v], i * 4); A.iC.set([0, 0, 0, 1], i * 4);
    A.iD.set([rng(), size, calf ? 1 : 0, S.notch(x)], i * 4); A.iE.set([S.runR(x), 0, 0, 1], i * 4);
    A.tint.set(calf ? [2.3 * k, 1.75 * k, 1.2 * k] : [k * 1.02, k, k * 0.98], i * 3);
  }
  return A;
}
function instanced(base, A) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
  for (const k of ['iA', 'iB', 'iC', 'iD', 'iE']) g.setAttribute(k, new THREE.InstancedBufferAttribute(A[k], 4));
  g.setAttribute('iTint', new THREE.InstancedBufferAttribute(A.tint, 3));
  g.instanceCount = A.n;
  return g;
}

// ---------------------------------------------------------------- the cut bank
async function buildBank(ctx, S, pal, U) {
  const nz = ctx.noise, C = (h) => new THREE.Color(h), NX = 172, ROWS = 41;
  const cOchre = C(pal[2]), cStraw = C(pal[1]), cRed = C('#8f5638'), cPale = C(pal[1]).lerp(C('#eadbb8'), 0.45), cSoil = C('#3b2a20'), cRust = C('#a87238'), cEarth = C(pal[2]).lerp(C(pal[1]), 0.5);
  const pos = new Float32Array((NX + 1) * ROWS * 3), colr = new Float32Array((NX + 1) * ROWS * 3), dat = new Float32Array((NX + 1) * ROWS * 3), c = new THREE.Color(), c2 = new THREE.Color();
  let k = 0;
  for (let i = 0; i <= NX; i++) {
    if ((i & 3) === 0) await ctx.yield();                              // a few columns of the bank at a time
    const u = (i / NX) * 2 - 1, x = 66 * Math.sign(u) * Math.pow(Math.abs(u), 1.18);
    const e = S.endF(x), ch = S.chute(x), yT = S.topY(x) * e, yL = S.lipY(x) * e, zL = S.lipZ(x), R = S.runR(x), zB = ZBACK + 3 * nz.n2(x * 0.03, 4.2);
    const slab = sstep(S.slabX - 12, S.slabX - 8.5, x) * (1 - sstep(S.slabX + 8.5, S.slabX + 12, x));
    const ov = 0.34 * (1 - ch) * (0.5 + 0.5 * nz.n2(x * 0.5, 9.1));
    for (let j = 0; j < ROWS; j++) {
      let y, z, ao = 1, tr = 0, sl = 0;
      if (j < 16) {                                                    // back skirt and the plain
        if (j < 3) { const a = [0, 0.38, 0.84][j]; z = zB - 14 + j * 5.5; y = -1.5 + (yT + 1.5) * a; }
        else { const a = (j - 3) / 12; z = zB + (zL - 0.4 - zB) * (1 - (1 - a) * (1 - a)); y = yT; }
        tr = S.trample(x, z);
        if (j >= 3) { const rt = sstep(zL - 10, zL, z); y = yT - (yT - yL) * rt + (1 - tr) * 0.16 * nz.n2(x * 0.3, z * 0.3) * (1 - rt); }
        const gr = 0.78 + 0.3 * nz.n2(x * 0.11, z * 0.11);
        c.copy(cStraw).lerp(cRust, 0.5 * sstep(-0.2, 0.7, nz.n2(x * 0.05 + 9, z * 0.05))).multiplyScalar(gr);
        c.lerp(c2.copy(cEarth).multiplyScalar(0.92 + 0.14 * nz.n2(x * 0.4, z * 0.4)), Math.min(1, tr + sstep(zL - 1.6, zL - 0.3, z) * 0.6));
        sl = slab * sstep(zL - 6.5, zL - 4, z);
      } else if (j < 18) {                                             // turf lip
        z = zL - 0.05 + ov * (j === 16 ? 0.7 : 1) + (j - 16) * 0.14; y = yL - (j - 16) * 0.3 * e; tr = S.trample(x, zL);
        c.copy(cSoil).lerp(cEarth, 0.25 + 0.5 * ch); ao = j === 17 ? 0.75 : 1; sl = slab;
      } else if (j < 38) {                                             // the face
        const t = (j - 17) / 20; y = yL * (1 - t);
        const w = y + 1.1 * nz.fbm2(x * 0.035, y * 0.12, 3), rib = nz.ridged2(x * 0.17, y * 0.028 + 3.1, 3);
        let dz = 1.05 * rib * (1 - 0.5 * t) + 1.3 * sstep(0.72, 1, t) ** 2 + 0.3 * nz.n2(3.3, w * 0.85) + 0.75 * nz.fbm2(x * 0.06, y * 0.1, 3) - 0.5 * Math.exp(-(((y - 0.6) / 0.7) ** 2)) - 0.3 * Math.exp(-((t / 0.08) ** 2));
        z = zL + R * prof(t) + dz * (1 - 0.72 * ch) * e;
        const band = nz.n2(7.7, w * 0.5);
        c.copy(cOchre).lerp(cRed, Math.min(1, Math.max(0, 0.45 + 0.7 * band)));
        c.lerp(cPale, 0.42 * Math.max(0, 1 - Math.abs(w - S.paleY) / 0.75)); c.lerp(cSoil, 0.5 * Math.max(0, 1 - Math.abs(w - S.seamY) / 0.4));
        c.lerp(cSoil, 0.75 * Math.max(0, 1 - (yL - y) / 0.8)); c.lerp(cPale, 0.3 * ch);
        c.multiplyScalar(0.88 + 0.2 * nz.n2(x * 0.4, y * 0.4));
        ao = (0.42 + 0.58 * rib) * (1 - 0.3 * Math.exp(-(((y - 0.6) / 0.7) ** 2))); tr = ch; sl = slab;
      } else {                                                         // toe, under water
        const a = j - 37; y = [-0.7, -1.8, -3.2][a - 1]; z = zL + R + [1.3, 3.2, 6.5][a - 1]; c.copy(cOchre).multiplyScalar(0.55); sl = slab;
      }
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z; colr[k] = c.r; colr[k + 1] = c.g; colr[k + 2] = c.b; dat[k] = ao; dat[k + 1] = sl; dat[k + 2] = tr; k += 3;
    }
  }
  const idx = [];
  for (let i = 0; i < NX; i++) for (let j = 0; j < ROWS - 1; j++) { const a = i * ROWS + j, b = a + ROWS; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3)); g.setAttribute('aData', new THREE.BufferAttribute(dat, 3));
  await ctx.yield();
  g.setIndex(idx);
  { const nN = pos.length / 3, nor = new Float32Array(nN * 3), nF = idx.length / 3;
    for (let f = 0; f < nF; f++) {
      if ((f & 2047) === 2047) await ctx.yield();
      const a = idx[f * 3] * 3, b = idx[f * 3 + 1] * 3, cc = idx[f * 3 + 2] * 3;
      const cx = pos[cc] - pos[b], cy = pos[cc + 1] - pos[b + 1], cz = pos[cc + 2] - pos[b + 2], ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
      const x = cy * az - cz * ay, y = cz * ax - cx * az, z = cx * ay - cy * ax;
      nor[a] += x; nor[a + 1] += y; nor[a + 2] += z; nor[b] += x; nor[b + 1] += y; nor[b + 2] += z; nor[cc] += x; nor[cc + 1] += y; nor[cc + 2] += z;
    }
    for (let i = 0; i < nN; i++) { const x = nor[i * 3], y = nor[i * 3 + 1], z = nor[i * 3 + 2], il = 1 / (Math.sqrt(x * x + y * y + z * z) || 1); nor[i * 3] = x * il; nor[i * 3 + 1] = y * il; nor[i * 3 + 2] = z * il; }
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); }
  await ctx.yield();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, vertexColors: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec3 aData; uniform float uSlab, uSlabP; uniform vec3 uSlabX;
      varying vec3 vW, vN, vCol, vData; varying float vScar;
      void main(){
        vec3 p = position, nn = normal; float e = smoothstep(0., 1., uSlab);
        float th = .42 * e * aData.y, c = cos(th), sn = sin(th); vec2 q = p.yz - vec2(0., uSlabP);                 // the rare slab: it leans out on its toe and slides down in one piece
        p.yz = mix(p.yz, vec2(q.x * c - q.y * sn - 7.4 * e, q.y * c + q.x * sn + uSlabP + 3.4 * e), aData.y);
        nn.yz = vec2(nn.y * c - nn.z * sn, nn.z * c + nn.y * sn);
        p.y -= aData.y * e * 1.7 * clamp((position.x - uSlabX.x) / uSlabX.y, -1., 1.);                               // and it rolls: the end by the Fall goes first
        vW = p; vN = nn; vCol = color; vData = aData; vScar = 4. * aData.y * (1. - aData.y) * e;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uFoam, uDustLit, uDustShade, uCamL; uniform float uTime, uWaterY, uCur;
      varying vec3 vW, vN, vCol, vData; varying float vScar;
      ${GLSL_COMMON}
      ${GLSL_SHADOW}
      float clod(vec3 p, float top){ return vn3(p * vec3(1.5, 2.6, 1.5)) * .6 + vn3(p * 5.3) * .3 + (.2 * sin(p.y * 7. + vn2(p.xz * .4) * 5.) + .5 * vn2(vec2(p.x * 1.4 + p.z * .6, p.y * .13))) * (1. - top); }
      void main(){
        vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), p = vW;
        float top = smoothstep(.55, .85, N.y), e = .12;
        float h0 = clod(p, top); vec3 g = vec3(clod(p + vec3(e, 0., 0.), top), clod(p + vec3(0., e, 0.), top), clod(p + vec3(0., 0., e), top)) - h0;
        g = g / e; g -= N * dot(g, N); N = normalize(N - g * mix(.48, .16, top));
        vec3 alb = vCol * (.8 + .4 * vn3(p * vec3(.9, 3., .9)));
        alb *= 1. - .25 * smoothstep(.5, .9, vn2(vec2(p.x * 2.2 + p.z, p.y * .22))) * (1. - top);                       // drip streaks
        alb *= 1. - .34 * vData.z * smoothstep(.5, .8, vn2(p.xz * 2.7)) * top;                                          // hoof pocks
        alb *= 1. - .2 * vData.z * smoothstep(.42, .7, vn2(p.xz * vec2(1.7, .16))) * top;                               // trails along the run
        alb *= mix(1., (.7 + .35 * vn2(p.xz * 1.3) + .3 * vn2(p.xz * 7.)) * (.85 + .3 * vn2(p.xz * vec2(23., 19.))), top * (1. - vData.z));
        alb *= mix(1., (.8 + .4 * vn2(p.xz * 11.)) * (1. - .3 * smoothstep(.55, .75, vn2(p.xz * 6.3))), top * vData.z);                                    // grass grain
        alb = mix(alb, vec3(.16, .072, .04) * (.55 + .8 * vn3(p * 1.7)), clamp(vScar * 2.4, 0., 1.));                       // the raw scar the slab leaves
        float wet = 1. - smoothstep(uWaterY + .2, uWaterY + 1.1 + .7 * vn2(vec2(p.x * .5, 2.)), p.y);
        alb *= mix(1., .5, wet);
        float ndl = dot(N, uSun), dif = max(ndl, 0.) * .85 + .15 * (ndl * .5 + .5);
        float sh = leapShadow(p);
        vec3 col = alb * (uSunC * dif * (1. - .8 * sh) + mix(uGndC, uSkyC, N.y * .5 + .5) * vData.x);
        col += uSkyC * wet * .12;
        float fl = 1. - smoothstep(0., .1 + .14 * vn2(vec2(p.x * 1.3 - uTime * .5 * uCur, uTime * .6)), abs(p.y - uWaterY - .05));
        col = mix(col, uFoam * (uSunC * .4 + uSkyC), fl * .85 * (1. - top));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return { mesh, triangles: idx.length / 3 };
}

// ---------------------------------------------------------------- the river in front of it
function buildWater(S, U) {
  const g = new THREE.PlaneGeometry(260, 118, 1, 1); g.rotateX(-Math.PI / 2); g.translate(0, S.waterY, 55);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, transparent: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      varying vec3 vW; varying vec2 vUv;
      void main(){ vW = position; vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uFoam, uTea, uSkyRef, uHaze, uBankLit, uDustLit, uCamL; uniform vec4 uBank, uCut; uniform float uTime, uCur, uCurSpeed, uHalf;
      varying vec3 vW; varying vec2 vUv;
      ${GLSL_COMMON}
      ${GLSL_SHADOW}
      ${WATER_GLSL}
      void main(){
        vec3 p = vW, V = uCamL - p; float dist = max(length(V), .01); V /= dist;
        vec2 dx = dFdx(p.xz), dy = dFdy(p.xz); float px = max(length(dx), length(dy));
        vec2 f = p.xz - vec2(uCur * uCurSpeed * uTime, 0.);
        float agit = 1. + 1.1 * exp(-max(p.z - uBank.x, 0.) / 10.) * (1. - smoothstep(uHalf, uHalf + 9., abs(p.x)));        // churned under the Fall
        vec2 gr = riverSlope(p.xz, dx, dy, agit);
        vec3 N = normalize(vec3(-gr.x, 1., -gr.y));
        vec3 R = reflect(-V, N); R.y = abs(R.y) + .002;
        vec3 sky = mix(uHaze, uSkyRef, smoothstep(.02, .24, R.y));
        float rz = min(R.z, -.02), t = (uBank.x + uBank.y * p.x * p.x - p.z) / rz, hx = p.x + R.x * t;
        t = (uBank.x + uBank.y * hx * hx - p.z) / rz; float hy = R.y * t, on = step(R.z, -.02);
        float mB = on * (1. - smoothstep(uBank.z - 5., uBank.z + 3., hy)) * (1. - smoothstep(54., 66., abs(hx)));
        float mP = on * smoothstep(uBank.z, uBank.z + 7., hy) * (1. - smoothstep(38., 78., hy)) * exp(-((hx - uBank.w * hy) / 36.) * ((hx - uBank.w * hy) / 36.));
        float sh = leapShadow(p);
        vec3 bodyR = uTea * (uSunC * max(uSun.y, .06) * .8 + uSkyC * .95 + uGndC * .2);
        vec3 refl = mix(mix(sky, uDustLit * .9, mP * .7), mix(uBankLit * (.36 + .22 * vn2(vec2(hx * .45, hy * .9))), bodyR, .45), mB);
        // close under the Fall, and under the cut bank we leap from (uCut: its x, where it begins in z), the water is dark
        float nb = max(exp(-max(p.z - uBank.x - uBank.y * p.x * p.x, 0.) / 4.5) * (1. - smoothstep(60., 80., abs(p.x))), exp(-max(p.x - uCut.x, 0.) / 4.) * smoothstep(uCut.y - 8., uCut.y + 6., p.z));
        vec3 col = riverColor(N, V, dist, refl, sh, riverFoam(f, px) * (1. - .5 * smoothstep(30., 90., dist)), f, nb);
        vec2 ed = abs(vUv * 2. - 1.);
        gl_FragColor = vec4(col, (1. - smoothstep(.82, 1., ed.x)) * smoothstep(0., .14, vUv.y));
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 1;
  return mesh;
}

// ---------------------------------------------------------------- foam on the water: splash rings, swimmers' wakes, the slab's wave
// dA (x, z, clock offset, kind 0 ring / 1 wake / 2 slab wave)  dB (lateral speed, forward speed, life, size)  dC (impact speed, seed, -, -)
function buildDecals(S, U, list) {
  const n = list.length, dA = new Float32Array(n * 4), dB = new Float32Array(n * 4), dC = new Float32Array(n * 4);
  list.forEach((d, i) => { dA.set(d.a, i * 4); dB.set(d.b, i * 4); dC.set(d.c, i * 4); });
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  g.index = q.index; g.setAttribute('position', q.attributes.position);
  g.setAttribute('dA', new THREE.InstancedBufferAttribute(dA, 4)); g.setAttribute('dB', new THREE.InstancedBufferAttribute(dB, 4)); g.setAttribute('dC', new THREE.InstancedBufferAttribute(dC, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 dA, dB, dC; uniform float uT, uCycle, uWaterY, uCur, uCurSpeed, uSlabA;
      varying vec2 vUv; varying vec3 vK;
      ${GLSL_COMMON}
      void main(){
        float kind = dA.w, lt = mod(uT + dA.z, uCycle), life = dB.z, a = 0.;
        vec2 c = dA.xy, ax = vec2(1., 0.), ext = vec2(1.), q = position.xy;
        if (kind < .5) {
          c.x += uCur * uCurSpeed * .55 * lt;
          ext = vec2(dB.w * (.22 + .78 * (1. - exp(-lt * 1.15))));
          a = smoothstep(0., .12, lt) * (1. - smoothstep(life * .35, life, lt));
        } else if (kind < 1.5) {
          c = swimXZ(lt, vec4(dA.x, dA.y, dB.x, dB.y), dC.x);
          vec2 vel = vec2(dB.x * (1. - exp(-lt / 1.2)), dB.y); float yaw = atan(vel.x, vel.y) * .7;
          ax = vec2(cos(yaw), -sin(yaw));
          q.y = q.y * .5 - .5;                                         // 0 at the chest .. -1 at the tail of the wake
          ext = vec2(1.5, 4.2) * dB.w; c += vec2(-ax.y, ax.x) * 1.1 * dB.w;
          a = smoothstep(.8, 1.7, lt) * (1. - smoothstep(life - 2.8, life - 1., lt));
        } else {
          lt = uSlabA - 1.9 - dA.z; ext = vec2(3. + 8.5 * max(lt, 0.)); a = smoothstep(0., .25, lt) * (1. - smoothstep(life * .5, life, lt));     // the slab's wave: a ring that runs out over the river
        }
        vec2 xz = c + ax * q.x * ext.x + vec2(-ax.y, ax.x) * q.y * ext.y;
        vUv = position.xy; vK = vec3(kind, a, kind > 1.5 ? ext.x : dC.y + lt * .15);
        vec4 mvPosition = modelViewMatrix * vec4(xz.x, uWaterY + .05, xz.y, 1.);
        gl_Position = a > .002 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uFoam, uTea, uSkyRef, uHaze; uniform float uTime;
      varying vec2 vUv; varying vec3 vK;
      ${GLSL_COMMON}
      ${WATER_GLSL}
      ${GLSL_FOGMIX}
      void main(){
        float al = 0., r = length(vUv), n = vn2(vUv * 4.5 + vK.z * 13.), n2 = vn2(vUv * 11. - vK.z * 7.);
        vec3 tone = uFoam;
        if (vK.x < .5) {
          float rw = r + (vn2(vUv * 1.7 + vK.z * 5.) - .5) * .34, ring = smoothstep(.46, .74, rw) * (1. - smoothstep(.8, 1., rw));
          al = max(ring * smoothstep(.25, .6, n) * (.4 + .6 * n2), (1. - smoothstep(.15, .8, r)) * smoothstep(.35, .7, n * .7 + n2 * .45)) * (.6 + .4 * n2);
        } else if (vK.x < 1.5) {
          al = wakeFoam(abs(vUv.x), vUv.y * -.5 + .5, vK.z, vUv);          // 0 at the chest .. 1 at the tail
        } else {
          float R = vK.z, bw = 1.5 / R, rw = r + (vn2(vUv * R * .3 + 3.) - .5) * (1.8 / R), nn = vn2(vUv * R * .9 + 7.);
          float ring = smoothstep(1. - 3.2 * bw, 1. - 1.7 * bw, rw) * (1. - smoothstep(1. - 1.3 * bw, 1. - .5 * bw, rw));
          float back = smoothstep(1. - 9. * bw, 1. - 3. * bw, rw) * (1. - smoothstep(1. - 3. * bw, 1. - 1.7 * bw, rw));
          al = max(ring * (.55 + .45 * smoothstep(.25, .65, nn)), back * .35 * smoothstep(.4, .75, nn)); tone = mix(uTea * 1.6, uFoam, .3 + .7 * smoothstep(.3, .7, nn));
        }
        al *= vK.y;
        gl_FragColor = vec4(fogMix(tone * (uSunC * .42 + uSkyC), FOGD) * al, al * .92);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

// ---------------------------------------------------------------- sprites: splash jets and crowns, hoof and slide dust, clods, spray veil, slab dust
// sA (x, y, z, clock offset)  sB (velocity, life)  sC (type, size0, size1, seed)
// type 0 splash jet  1 crown clump  2 dust  3 -  4 clod  5 slab dust (driven by uSlab)  6 standing spray veil
function buildSprites(U, list) {
  const n = list.length, sA = new Float32Array(n * 4), sB = new Float32Array(n * 4), sC = new Float32Array(n * 4);
  list.forEach((d, i) => { sA.set(d.a, i * 4); sB.set(d.b, i * 4); sC.set(d.c, i * 4); });
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  g.index = q.index; g.setAttribute('position', q.attributes.position);
  g.setAttribute('sA', new THREE.InstancedBufferAttribute(sA, 4)); g.setAttribute('sB', new THREE.InstancedBufferAttribute(sB, 4)); g.setAttribute('sC', new THREE.InstancedBufferAttribute(sC, 4));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute vec4 sA, sB, sC; uniform float uT, uTime, uCycle, uSlabA, uCur, uCurSpeed; uniform vec3 uSun, uWind;
      varying vec2 vUv; varying vec4 vK; varying vec3 vL;
      void main(){
        float type = sC.x, life = sB.w, lt = mod(uT + sA.w, uCycle);
        if (type > 4.5) lt = type < 5.5 ? uSlabA - sA.w : life * .5;
        float k = clamp(lt / life, 0., 1.), a = lt < life && lt >= 0. ? 1. : 0.;
        vec3 p = sA.xyz; vec2 q = position.xy, ext = vec2(mix(sC.y, sC.z, 1. - (1. - k) * (1. - k)));
        vec3 right = normalize(vec3(modelViewMatrix[0][0], modelViewMatrix[1][0], modelViewMatrix[2][0]));
        vec3 up = normalize(vec3(modelViewMatrix[0][1], modelViewMatrix[1][1], modelViewMatrix[2][1]));
        if (type < .5) {                                               // jet: stands on the water, shoots up, collapses
          float rise = smoothstep(0., .18, lt), fall = 1. - smoothstep(.3, 1., k);
          ext = vec2(sC.y * (.55 + .9 * k), sC.z * rise * (.3 + .7 * fall)); q.y = q.y * .5 + .5; up = vec3(0., 1., 0.);
          p.x += uCur * uCurSpeed * .5 * lt; a *= smoothstep(0., .05, k) * (1. - k * k);
        } else if (type < 1.5 || (type > 3.5 && type < 4.5)) {         // ballistic: crown clumps, clods
          p += sB.xyz * lt; p.y -= 4.9 * lt * lt; a *= type < 1.5 ? smoothstep(0., .08, k) * (1. - k) : 1. - smoothstep(.85, 1., k);
        } else if (type > 4.5 && type < 5.5 && sC.w > .72) {           // the slab's splash: thrown water
          p += sB.xyz * lt; p.y -= 4.9 * lt * lt; a *= smoothstep(0., .08, k) * (1. - k);
        } else if (type < 5.5) {                                       // dust: thrown, slowed by the air, taken by the wind
          p += sB.xyz * (1. - exp(-lt * 1.4)) / 1.4 + uWind * lt * (.35 + .65 * k) + vec3(0., .35 * lt, 0.);
          a *= type > 4.5 ? smoothstep(0., .1, k) * pow(1. - k, 1.4) * .95 : smoothstep(0., .12, k) * (1. - k) * (1. - k);
        } else if (type < 6.5) { p.x += 1.5 * sin(uTime * .3 + sC.w * 9.); ext *= 1. + .15 * sin(uTime * .9 + sC.w * 30.); a = .5 + .3 * sin(uTime * .7 + sC.w * 50.); }
        else { up = normalize(sB.xyz); ext = vec2(sC.y, sC.z); a = .75 + .25 * sin(uTime * 1.3 + sC.w * 40.); lt = uTime; }
        vec3 fwd = cross(right, up);
        float dz = -(modelViewMatrix * vec4(p, 1.)).z;
        if (type > .5 && type < 1.5) ext = min(ext, vec2(.014 * dz));       // a clump of drops is never a disc on the screen
        if (type < 1.5) a *= smoothstep(2.6, 6.5, dz);
        if (type > 1.5 && type < 2.5) a *= 1. - .85 * smoothstep(32., 60., dz);       // hoof dust far off is the plume's business: no row of little flames on the bank top
        vL = vec3(dot(uSun, right), dot(uSun, up), dot(uSun, fwd));
        vUv = q; vK = vec4(type, a, sC.w, lt);
        vec4 mvPosition = modelViewMatrix * vec4(p + right * q.x * ext.x + up * q.y * ext.y, 1.);
        gl_Position = a > .003 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSunC, uSkyC, uGndC, uFoam, uDustLit, uDustShade;
      varying vec2 vUv; varying vec4 vK; varying vec3 vL;
      ${GLSL_COMMON}
      ${GLSL_FOGMIX}
      void main(){
        float type = vK.x, al = 0., r = length(vUv), add = 1.;
        vec3 nn = vec3(vUv, sqrt(max(1. - min(r * r, 1.), 0.))); float lit = clamp(dot(nn, vL) * .6 + .5, 0., 1.);
        vec3 col;
        if (type < .5) {
          al = spray(vUv, vK.z, clamp(vK.w / 1.2, 0., 1.), vK.w);          // vUv.y 0 at the water .. 1 at the top
          col = uFoam * (uSunC * (.3 + .55 * lit) + uSkyC * .8); add = .8;
        } else if (type < 1.5) {
          float n = vn2(vUv * 2.6 + vK.z * 31.);
          al = (1. - smoothstep(.2, 1., r + (n - .5) * 1.1)) * (1. - smoothstep(.7, 1., r)) * .7;
          col = uFoam * (uSunC * (.3 + .6 * lit) + uSkyC * .8); add = .8;
        } else if (type > 3.5 && type < 4.5) {
          al = (1. - smoothstep(.55, 1., r + (vn2(vUv * 3. + vK.z * 9.) - .5) * .5)) * (1. - smoothstep(.8, 1., r));
          col = uDustShade * .5 * (uSunC * (.2 + .6 * lit) + uSkyC);
        } else if (type < 5.5) {
          float n = vn2(vUv * 1.9 + vK.z * 17. + vK.w * .25) * .65 + vn2(vUv * 4.7 - vK.z * 5.) * .35;
          al = (1. - smoothstep(.15, 1., r + (n - .5) * .9)) * (1. - smoothstep(.72, 1., r)) * .55;
          col = mix(mix(uDustShade * 1.6, uDustLit, .45), uDustLit * (.55 + .22 * uSunC), lit);
          if (type > 4.5) { if (vK.z > .72) { col = uFoam * (uSunC * (.3 + .5 * lit) + uSkyC * .8); al *= 1.4; } else col *= vec3(.86, .68, .5); }      // the slab's own splash; its dust is the bank's raw earth
        } else if (type > 6.5) {
          float n = vn2(vec2(vUv.x * 2.4 + vK.z * 9., vUv.y * 1.5 + vK.w * 1.1)), n2 = vn2(vec2(vUv.x * 6. - vK.z * 5., vUv.y * 3.2 + vK.w * 2.3));
          al = (1. - smoothstep(.25, 1., abs(vUv.x) + (n - .5) * .7)) * smoothstep(-1., -.5, vUv.y) * (1. - smoothstep(.45, 1., vUv.y)) * (.3 + .7 * n2) * .62;
          col = mix(mix(uDustShade * 1.6, uDustLit, .5), uDustLit * (.55 + .22 * uSunC), .35 + .65 * n);
        } else {
          al = (1. - smoothstep(0., 1., r)); al *= al * .2;
          col = uFoam * (uSunC * .5 + uSkyC * .8); add = .6;
        }
        al *= vK.y;
        gl_FragColor = vec4(fogMix(col, FOGD) * al, al * add);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

// ---------------------------------------------------------------- the dust plume: a ray march inside a sheared box
function buildPlume(S, U, steps) {
  const P = S.plume, g = new THREE.BoxGeometry(1, 1, 1), pa = g.attributes.position;
  for (let i = 0; i < pa.count; i++) {
    const qx = pa.getX(i) * 2 * P.X0, y = P.y0 + (pa.getY(i) + 0.5) * (P.y1 - P.y0), qz = pa.getZ(i) > 0 ? P.Z1 : -P.Z0;
    pa.setXYZ(i, qx + P.bx + P.lx * (y - P.by), y, qz + P.bz + P.lz * (y - P.by));
  }
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    fog: true, transparent: true, depthWrite: false, side: THREE.BackSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      varying vec3 vP;
      void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform mat4 projectionMatrix, modelViewMatrix;
      uniform vec3 uCamL, uSun, uSunC, uSkyC, uDustLit, uDustShade; uniform float uTime;
      varying vec3 vP;
      ${GLSL_COMMON}
      ${GLSL_FOGMIX}
      ${DUST_GLSL}
      void main(){
        vec3 rd = normalize(vP - uCamL + vec3(0., 1e-5, 0.)), roq = dustShear(uCamL), rdq = dustShearDir(rd), sq = dustShearDir(uSun);
        vec2 sp = dustSpan(roq, rdq);
        if (sp.y <= sp.x) discard;
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(uCamL + rd * max(sp.x, .4), 1.);            // depth-test at the point where the ray enters the dust
        gl_FragDepth = clamp(clip.z / max(clip.w, 1e-4) * .5 + .5, 0., 1.);
        float dt = (sp.y - sp.x) / float(${steps}), jit = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
        float Tr = 1., glow = 1. + .6 * pow(max(dot(rd, uSun), 0.), 4.);
        // THE PLUME'S OWN LAW OF DISTANCE. Seen from the plain (a hundred metres off and more, F) it is a landmark, not haze: the column is
        // thicker to the eye, the flank on the sun's side of our line of sight stands gold and the rest of it umber in its own shade
        // (billow by billow, by the same noise that shapes it), and the plain's haze takes only a third of what it takes of the ground.
        float F = smoothstep(100., 210., sp.x);
        vec2 sunH = normalize(uSun.xz + vec2(1e-4, 0.)), rdH = normalize(rd.xz + vec2(1e-4, 0.)), perp = sunH - rdH * dot(sunH, rdH);
        float pl = length(perp); perp /= max(pl, 1e-3);
        vec3 C = vec3(0.), litC = dustLitC() * glow * (1. + .34 * F), shC = dustShadeC() * mix(1., .74, F);
        for (int i = 0; i < ${steps}; i++) {
          vec3 q = roq + rdq * (sp.x + (float(i) + jit) * dt);
          float hh = (q.y - uPB.y) / (uPY.y - uPB.y), h = clamp(hh, 0., 1.), rad = dustRad(q, h);
          if (rad > -.45 && hh > -.02) {
            vec3 c = vec3(q.x, q.y * .75 - uTime * 2.2, q.z) * .042 + vec3(0., 0., uTime * .015);
            float n = vn3(c) * .5 + vn3(c * 2.4 + 7.) * .32 + vn3(c * 5.6 - 3.) * .18;
            float dn = smoothstep(.0, .16, rad * .8 - .06 + .1 * F + (n - .5) * mix(.9, 1.5, h)) * (1. - smoothstep(mix(.62, .78, F), mix(1., 1.06, F), h + (n - .5) * .6)) * smoothstep(-.015, .03, hh);
            dn *= uPDen * mix(.75, 1., smoothstep(0., .2, h)) * mix(1., .65, h) * (1. + 1.5 * F);
            if (dn > 0.) {
              float ns = vn3(c * 2.4 + 7. + sq * .55) * .6 + vn3(c + sq * .3) * .4;                                // the billows between this point and the sun
              float Ts = exp(-(dustEnv(q + sq * 8.) * (.15 + 2.2 * ns * ns) + dustEnv(q + sq * 24.) * 1.5) * 2.4);
              float sideS = dot(vec2(q.x + 7. * h * sin(h * 4.6 + .6), q.z + 5.), perp) / 19.;                      // -1 on the far flank .. +1 on the sun's
              Ts = mix(Ts, smoothstep(-.08, .6, sideS * pl + (n - .5) * 1.25 + (ns - .5) * .5 + .2 * h), F * .92);
              float a = 1. - exp(-dn * dt);
              C += Tr * a * mix(shC, litC, Ts); Tr *= 1. - a;
            }
          }
        }
        float al = 1. - Tr;
      #ifdef USE_FOG
        C = mix(C, fogColor * al, fogAt(sp.x + 15.) * mix(1., .3, F));
      #endif
        gl_FragColor = vec4(C, al);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// ---------------------------------------------------------------- red-oat grass tufts on the untrampled bank top
function buildGrass(rng, S, pal, U, count) {
  const pos = [], hh = [], idx = [], BLADES = 5;                 // five blades to a tuft, a little broader
  for (let b = 0; b < BLADES; b++) {
    const a = (b / BLADES) * Math.PI * 2 + rng() * 0.8, lean = rng.range(0.15, 0.5), h = rng.range(0.5, 1), w = rng.range(0.045, 0.085), o = pos.length / 3;
    const dx = Math.cos(a), dz = Math.sin(a), px = -dz * w, pz = dx * w;
    pos.push(px, 0, pz, -px, 0, -pz, dx * lean * 0.35 + px * 0.7, h * 0.55, dz * lean * 0.35 + pz * 0.7, dx * lean * 0.35 - px * 0.7, h * 0.55, dz * lean * 0.35 - pz * 0.7, dx * lean, h, dz * lean);
    hh.push(0, 0, 0.55, 0.55, 1); idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2, o + 2, o + 3, o + 4);
  }
  const gA = [], gB = [];
  for (let tries = 0; gA.length / 4 < count && tries < count * 30; tries++) {
    const x = rng.range(-63, 63), edge = rng.chance(0.45), zl = S.lipZ(x), z = edge ? zl - rng.range(0.1, 2.5) : rng.range(ZBACK + 2, zl - 0.3);
    if (rng() < S.trample(x, z) * 1.2 || S.endF(x) < 0.25) continue;
    gA.push(x, S.apronY(x, z) - 0.04, z, rng.range(0.7, 1.35)); gB.push(rng() * 6.283, rng(), rng(), 0);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setIndex(idx); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aH', new THREE.Float32BufferAttribute(hh, 1));
  g.setAttribute('gA', new THREE.InstancedBufferAttribute(new Float32Array(gA), 4)); g.setAttribute('gB', new THREE.InstancedBufferAttribute(new Float32Array(gB), 4));
  g.instanceCount = gA.length / 4;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uRoot: { value: new THREE.Color(pal[2]).lerp(new THREE.Color('#3b2a20'), 0.35) }, uTip: { value: new THREE.Color(pal[1]).lerp(new THREE.Color(pal[0]), 0.35) } },
    fog: true, side: THREE.DoubleSide, transparent: true,
    vertexShader: /* glsl */`
      #include <common>
      #include <fog_pars_vertex>
      attribute float aH; attribute vec4 gA, gB; uniform float uTime; uniform vec3 uWind;
      varying float vH, vS; varying vec3 vW;
      void main(){
        float c = cos(gB.x), s = sin(gB.x); vec3 p = position * gA.w; p.xz = vec2(p.x * c - p.z * s, p.z * c + p.x * s);
        float gust = .5 + .5 * sin(uTime * 1.7 + gA.x * .21 + gA.z * .13 + gB.y * 3.) + .3 * sin(uTime * 4.3 + gB.y * 40.);
        p.xz += uWind.xz * aH * aH * (.1 + .12 * gust) * gA.w; p.y -= aH * aH * .06 * gust;
        vH = aH; vS = gB.z; vW = p + gA.xyz;
        vec4 mvPosition = modelViewMatrix * vec4(p + gA.xyz, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      #include <common>
      #include <fog_pars_fragment>
      uniform vec3 uSun, uSunC, uSkyC, uGndC, uRoot, uTip, uDustLit, uDustShade, uCamL; varying float vH, vS; varying vec3 vW;
      ${DUST_GLSL}
      void main(){
        vec3 alb = mix(uRoot, uTip * (.8 + .4 * vS), smoothstep(0., .8, vH));
        vec3 col = alb * (uSunC * (.3 + .4 * vH) + mix(uGndC, uSkyC, .4 + .5 * vH));
        vec4 dv = dustVeil(vW, uCamL); col = mix(col, dv.rgb, dv.a);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2.6;
  return { mesh, triangles: (idx.length / 3) * g.instanceCount };
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, C = (h) => new THREE.Color(h);
  const pal = Array.isArray(opts.palette) && opts.palette.length >= 6 ? opts.palette.slice() : PALETTE.slice();
  while (pal.length < 7) pal.push(PALETTE[pal.length]);
  const hour = HOURS[opts.hour === 'night' ? 'dusk' : opts.hour] || HOURS.golden, weather = opts.weather || 'haze', july = opts.season === 'july';
  const detail = ctx.quality?.detail ?? 1, density = Math.min(1.3, Math.max(0.7, opts.density ?? 1));
  // ---- the shape of this visit's bank
  const half = rng.range(20.5, 24.5), nCh = rng.int(2, 4), ph = [0, 1, 2, 3, 4].map(() => rng() * 6.283), K = rng.range(0.0034, 0.005);
  const chutes = []; for (let k = 0; k < nCh; k++) chutes.push({ x: -half + (k + 0.5 + rng.range(-0.3, 0.3)) * ((2 * half) / nCh), w: rng.range(2.4, 3.8), d: rng.range(1.2, 2.0) });
  const S = {
    half, chutes, waterY: july ? 0.9 : 0, current: opts.current === -1 ? -1 : 1, curSpeed: july ? 2.1 : 1.4, cycle: Math.max(20, opts.cycle ?? 26),
    paleY: rng.range(6.4, 8.6), seamY: rng.range(2.8, 4.6), slabX: -(half + 13),
    chute: (x) => { let m = 0; for (const c of chutes) m = Math.max(m, Math.exp(-(((x - c.x) / c.w) ** 2))); return m; },
    notch: (x) => { let m = 0; for (const c of chutes) m = Math.max(m, c.d * Math.exp(-(((x - c.x) / c.w) ** 2))); return m; },
    lipZ: (x) => K * x * x + 1.3 * Math.sin(0.115 * x + ph[0]) + 0.6 * Math.sin(0.31 * x + ph[1]) - 1.7 * S.chute(x),
    topY: (x) => TOP + 0.45 * Math.sin(0.06 * x + ph[2]) + 0.22 * Math.sin(0.17 * x + ph[3]),
    lipY: (x) => S.topY(x) - S.notch(x),
    runR: (x) => 3.3 + 0.6 * Math.sin(0.21 * x + ph[4]) + 2.9 * S.chute(x),
    endF: (x) => 1 - sstep(52, 66, Math.abs(x)),
    trample: (x) => sstep(half + 10, half + 2, Math.abs(x)),
    apronY: (x, z) => { const e = S.endF(x), zl = S.lipZ(x); return (S.topY(x) - S.notch(x) * sstep(zl - 10, zl, z)) * e; },
  };
  const windX = (rng.chance(0.7) ? 1 : -1) * S.current * rng.range(0.42, 0.62), dustK = weather === 'rains' ? 0.5 : weather === 'storm' ? 1.3 : 1;
  S.plume = { bx: rng.range(-3, 3), by: TOP, bz: -20, lx: windX, lz: -rng.range(0.1, 0.24), X0: half + 17, Z0: 30, Z1: 20, y0: TOP - 0.5, y1: TOP + (weather === 'storm' ? 70 : 61) };
  // ---- shared uniforms
  const sunDir = new THREE.Vector3().fromArray(opts.sunDir || hour.sun).normalize();
  const dustLit = C(hour.lit || pal[0]), tea = C(pal[2]).lerp(C('#b9a78c'), 0.5).multiplyScalar(weather === 'rains' ? 0.6 : 0.85);
  const U = {
    uT: { value: 0 }, uTime: { value: 0 }, uCycle: { value: S.cycle }, uGait: { value: 1 }, uSlabX: { value: new THREE.Vector3(-(half + 13), 9.5, 0) }, uSlabP: { value: 0 }, uWaterY: { value: S.waterY }, uSlab: { value: 0 }, uSlabA: { value: -1 }, uWaveP: { value: new THREE.Vector4(0, 0, 0, 0) }, uKeep: { value: new THREE.Vector3(0, -999, 5.5) }, uCur: { value: S.current }, uCurSpeed: { value: S.curSpeed },
    uSun: { value: sunDir }, uSunC: { value: C(hour.sunC).multiplyScalar(hour.sunI) }, uSkyC: { value: C(hour.sky).multiplyScalar(hour.skyI) }, uGndC: { value: C(hour.gnd).multiplyScalar(hour.gndI) },
    tCloud: { value: null }, uTCloud: { value: new THREE.Vector4(0, 0, 1 / 900, 0) },
    uRim: { value: 1 }, uShade: { value: 0 }, uDustLit: { value: dustLit }, uDustShade: { value: C(hour.shade) }, uFoam: { value: C(pal[4]).multiplyScalar(0.92) }, uTea: { value: tea }, uCamL: { value: new THREE.Vector3(0, 5, 60) },
    uWind: { value: new THREE.Vector3(windX * 2.2, 0, -0.9) }, uSh: { value: Array.from({ length: NSH }, () => new THREE.Vector4(0, -1000, 0, 0)) },
    uHalf: { value: half }, uBank: { value: new THREE.Vector4(2.2, K, TOP, windX) }, uCut: { value: new THREE.Vector4(-84, 36, 0, 0) }, uBankLit: { value: new THREE.Color() }, uSkyRef: { value: C(pal[5]).lerp(C('#ffffff'), 0.25) }, uHaze: { value: C(pal[5]).lerp(C(pal[1]), 0.55).lerp(C('#ffffff'), 0.3) },
    uPDen: { value: opts.plume === false ? 0 : 0.1 * dustK }, uPB: { value: new THREE.Vector3(S.plume.bx, S.plume.by, S.plume.bz) }, uPL: { value: new THREE.Vector2(S.plume.lx, S.plume.lz) },
    uPBox: { value: new THREE.Vector3(S.plume.X0, S.plume.Z0, S.plume.Z1) }, uPY: { value: new THREE.Vector2(S.plume.y0, S.plume.y1) },
  };
  U.uSlabP.value = S.lipZ(S.slabX) + S.runR(S.slabX);
  const relight = () => U.uBankLit.value.set(pal[2]).multiply(U.uSunC.value).multiplyScalar(0.25 + 0.75 * Math.max(0.1, sunDir.z)).add(C(pal[2]).multiply(U.uSkyC.value));
  relight();
  const root = new THREE.Group(); root.name = 'mara-fall';
  let tris = 0;
  // ---- bank
  const bank = await buildBank(ctx, S, pal, U); root.add(bank.mesh); tris += bank.triangles;
  await ctx.yield();
  // ---- herd
  const zebraCast = opts.cast === 'zebra', nAll = Math.round((150 + rng.int(-5, 5)) * density), nZ = zebraCast ? Math.round(nAll / 3) : rng.int(7, 11), nW = nAll - nZ;
  const tintW = (calf, r) => { const k = r.range(0.62, 1.0), w = r.range(-0.05, 0.06); return calf ? new THREE.Color(2.3 * k, 1.75 * k, 1.2 * k) : new THREE.Color(k * (1.03 + w), k, k * (0.98 - w)); };
  const herdW = layoutHerd(rng, S, nW, { calf: (i) => i % 4 === 3, scale: 1, swimLength: opts.swimLength ?? 50, swimTo: opts.swimTo, tint: tintW });
  await ctx.yield();
  const fam = Math.max(1, Math.round(nZ / 6)), herdZ = layoutHerd(rng, S, nZ, { calf: () => false, scale: 0.94, swimLength: opts.swimLength ?? 50, swimTo: opts.swimTo,
    tint: (c, r) => { const k = r.range(0.66, 0.8); return new THREE.Color(k, k * 0.95, k * 0.86); }, t0: zebraCast ? null : (i) => (i % fam) * (S.cycle / fam) + Math.floor(i / fam) * rng.range(0.5, 0.8) + 3 });
  await ctx.yield();
  const wGeo = beastGeometry(pal, 'w', 0), zGeo = beastGeometry(pal, 'z', 0);
  await ctx.yield();
  const aMat = (zebra) => new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, fog: true, vertexColors: true, side: THREE.DoubleSide, transparent: true,
    defines: zebra ? { ZEBRA: 1 } : {}, vertexShader: ANIMAL_VERT, fragmentShader: ANIMAL_FRAG });
  const wMesh = new THREE.Mesh(instanced(wGeo, herdW), aMat(false)), zMesh = new THREE.Mesh(instanced(zGeo, herdZ), aMat(true));
  wMesh.frustumCulled = zMesh.frustumCulled = false; wMesh.renderOrder = zMesh.renderOrder = 2.5; root.add(wMesh, zMesh);
  tris += (wGeo.index.count / 3) * nW + (zGeo.index.count / 3) * nZ;
  await ctx.yield();
  // the body of the Fall: far-tier animals on a short cycle that leap, splash and go under (the full herd above carries the swim),
  // and a crowd pressed against the lip that stamps, creeps forward and is replaced
  const fCyc = 11.5, nF = Math.round(64 * Math.min(1.2, density + 0.25)), nM = Math.round(56 * Math.min(1.2, density + 0.25));
  const herdF = layoutHerd(rng, S, nF, { calf: (i) => i % 5 === 4, scale: 1, swimLength: 16, tint: tintW, cycle: fCyc });
  const herdM = layoutMill(rng, S, nM, 30);
  const fMat = aMat(false), mMat = aMat(false);
  fMat.uniforms.uCycle = { value: fCyc };
  mMat.uniforms.uCycle = { value: 30 }; mMat.uniforms.uGait = { value: 0.4 }; mMat.uniforms.uSlabX = { value: new THREE.Vector3(S.slabX, 9.5, 1) };
  const farGeo = wildebeestGeometry(pal, 2), fMesh = new THREE.Mesh(instanced(farGeo, herdF), fMat), mMesh = new THREE.Mesh(instanced(farGeo, herdM), mMat);
  fMesh.frustumCulled = mMesh.frustumCulled = false; fMesh.renderOrder = mMesh.renderOrder = 2.5; root.add(fMesh, mMesh);
  tris += (farGeo.index.count / 3) * (nF + nM);
  const animals = herdW.land.concat(herdZ.land), fliers = animals.concat(herdF.land);
  await ctx.yield();
  // ---- sprites and foam, phased from their owners
  const sp = [], dc = [], spF = [], R = (a, b) => rng.range(a, b), sprK = detail < 1 ? detail : 1;
  for (const a of herdF.land) {                       // the fillers' splashes, lip dust and clods, on their own cycle
    const wy = S.waterY;
    spF.push({ a: [a.x + R(-0.4, 0.4), wy, a.z + 0.2, a.t0 - a.tL], b: [0, 0, 0, R(1.05, 1.4)], c: [0, R(1.3, 2.0) * a.size, R(3.0, 4.6) * a.size, rng()] });
    for (let j = 0; j < Math.round(4 * sprK); j++) { const an = R(0, 6.283), r = R(1, 3.6); spF.push({ a: [a.x, wy + 0.2, a.z, a.t0 - a.tL], b: [Math.cos(an) * r, R(4.5, 7.6), Math.sin(an) * r + 1, R(0.85, 1.25)], c: [1, R(0.16, 0.3), R(0.45, 0.8), rng()] }); }
    spF.push({ a: [a.x, a.yLip + 0.4, a.zLip - 0.3, a.t0 - a.tA], b: [R(-0.5, 0.5), 1.2, 2.4, R(2.2, 3)], c: [2, 0.8, R(2.6, 3.6), rng()] });
    for (let j = 0; j < 2; j++) { const vy = R(0.5, 2.6), y = a.yLip + 0.1, life = (vy + Math.sqrt(vy * vy + 19.6 * Math.max(0.2, y - wy))) / 9.8, sz = R(0.1, 0.24); spF.push({ a: [a.x + R(-0.7, 0.7), y, a.zLip + (a.slider ? 1.5 : 0), a.t0 - a.tA - (a.slider ? a.ts * 0.5 : 0)], b: [R(-1.2, 1.2), vy, R(1.5, 4.2), life], c: [4, sz, sz, rng()] }); }
  }
  await ctx.yield();
  for (const a of animals) {
    const wy = S.waterY, sd = rng();
    for (let j = 0; j < 2; j++) sp.push({ a: [a.x + R(-0.4, 0.4), wy, a.z + 0.2 + j * 0.5, a.t0 - a.tL - j * 0.07], b: [0, 0, 0, R(1.05, 1.4)], c: [0, R(1.2, 1.9) * a.size, R(2.9, 4.4) * a.size * (j ? 0.7 : 1), rng()] });
    for (let j = 0; j < Math.round(7 * sprK); j++) { const an = R(0, 6.283), r = R(1, 3.6); sp.push({ a: [a.x, wy + 0.2, a.z, a.t0 - a.tL], b: [Math.cos(an) * r, R(4.5, 7.6), Math.sin(an) * r + 1, R(0.85, 1.25)], c: [1, R(0.16, 0.3), R(0.45, 0.8), rng()] }); }
    for (let j = 0; j < 2; j++) { const dd = R(3, 36), z = a.zLip - dd; sp.push({ a: [a.x + R(-0.5, 0.5), S.apronY(a.x, z) + 0.4, z, a.t0 - (a.tA - dd / a.v)], b: [R(-0.6, 0.6), R(0.4, 1.2), -1.5, R(3, 4.4)], c: [2, R(0.6, 0.9), R(3, 4.2), rng()] }); }
    sp.push({ a: [a.x, a.yLip + 0.4, a.zLip - 0.3, a.t0 - a.tA], b: [R(-0.5, 0.5), 1.2, 2.4, R(2.2, 3)], c: [2, 0.8, R(2.6, 3.6), rng()] });
    const clod = (te, y, z, vy0) => { const vy = vy0, life = (vy + Math.sqrt(vy * vy + 19.6 * Math.max(0.2, y - wy))) / 9.8, s = R(0.1, 0.24); sp.push({ a: [a.x + R(-0.7, 0.7), y, z, a.t0 - te], b: [R(-1.2, 1.2), vy, R(1.5, 4.2), life], c: [4, s, s, rng()] }); };
    if (a.slider) {
      for (let j = 0; j < 4; j++) { const f = (j + R(0.1, 0.9)) / 4, t = a.tEnd * Math.pow(f, 1.5); sp.push({ a: [a.x + R(-0.5, 0.5), a.yLip * (1 - t) + 0.3, a.zLip + a.R * prof(t) + 0.6, a.t0 - (a.tA + a.ts * f)], b: [R(-0.5, 0.5), -2.4, 2.2, R(2.1, 2.9)], c: [2, 0.8, R(2.8, 4), rng()] }); }
      for (let j = 0; j < 5; j++) { const f = rng(), t = a.tEnd * Math.pow(f, 1.5); clod(a.tA + a.ts * f, a.yLip * (1 - t) + 0.2, a.zLip + a.R * prof(t) + 0.3, R(-1, 2)); }
    } else for (let j = 0; j < 2; j++) clod(a.tA + R(-0.05, 0.1), a.yLip + 0.1, a.zLip, R(0.5, 2.6));
    dc.push({ a: [a.x, a.z + 0.4, a.t0 - a.tL, 0], b: [0, 0, R(5, 6.5), R(3.4, 4.8) * a.size], c: [0, sd, 0, 0] });
    dc.push({ a: [a.x, a.z, a.t0 - a.tL, 1], b: [a.vx, a.vS, a.swimT, a.size], c: [a.vImp, sd, 0, 0] });
  }
  for (const c of chutes) for (let j = 0; j < 3; j++) {
    const x = c.x + (j - 1) * c.w * 0.45, yl = S.lipY(x), rr = S.runR(x), t = 0.46, len = Math.hypot(yl, rr);
    sp.push({ a: [x, yl * (1 - t) + 0.5, S.lipZ(x) + rr * prof(t) + 0.9, 0], b: [0, yl, -rr, 1], c: [7, R(1.6, 2.4), len * R(0.42, 0.5), rng()] });
  }
  for (let j = 0; j < 14; j++) { const x = R(-half, half); sp.push({ a: [x, S.waterY + 1.4, S.lipZ(x) + S.runR(x) + R(2, 8), 0], b: [0, 0, 0, 1], c: [6, R(5, 8), R(5, 8), rng()] }); }
  // the rare slab: dust that boils off the scar from the top down as it goes, the water it throws when it lands, and the wave that runs out from it
  for (let j = 0; j < 90; j++) {
    const x = S.slabX + R(-11, 11), wh = j % 3 === 0, top = R(0, 1);
    sp.push(wh
      ? { a: [x, R(0.3, 1.2), S.lipZ(x) + R(7, 12), 1.75 + R(0, 0.5)], b: [R(-3, 3), R(6, 11), R(3, 9), R(1.3, 1.9)], c: [5, 0.3, R(0.5, 1.0), R(0.75, 1)] }
      : { a: [x + R(-3, 3), 0.6 + top * (TOP - 1), S.lipZ(x) + R(1, 4) + (1 - top) * R(2, 8), 0.15 + (1 - top) * 1.5 + R(0, 0.6)], b: [R(-2.5, 2.5), R(0.4, 2.4), R(2, 6.5), R(5, 7.5)], c: [5, R(1.6, 2.4), R(5, 9), R(0, 0.7)] });
  }
  for (let j = 0; j < 2; j++) dc.push({ a: [S.slabX, S.lipZ(S.slabX) + 8, j * 0.9, 2], b: [0, 0, 7.5 - j * 2, 34], c: [0, rng(), 0, 0] });
  await ctx.yield();
  const water = opts.water === false ? null : buildWater(S, U); if (water) { root.add(water); tris += 2; }
  const plume = opts.plume === false ? null : buildPlume(S, U, Math.max(12, Math.round(26 * detail))); if (plume) { root.add(plume); tris += 12; }
  const decals = buildDecals(S, U, dc), sprites = buildSprites(U, sp), spritesF = buildSprites({ ...U, uCycle: { value: fCyc } }, spF); decals.material.side = sprites.material.side = spritesF.material.side = THREE.DoubleSide;
  root.add(decals, sprites, spritesF); tris += (dc.length + sp.length + spF.length) * 2;
  await ctx.yield();
  const grass = buildGrass(rng, S, pal, U, Math.round(460 * detail)); root.add(grass.mesh); tris += grass.triangles;
  // the rendering camera, in local space, for every material here (never cached: set as each mesh is drawn)
  const inv = new THREE.Matrix4(), camL = (r, s, camera) => { inv.copy(root.matrixWorld).invert(); U.uCamL.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv); };
  root.traverse((o) => { if (o.isMesh) o.onBeforeRender = camL; });
  await ctx.yield();
  // ---- clock, shadows, API
  let clock = 0, driven = false; const st = { x: 0, y: 0, z: 0, pitch: 0, phase: 0, vis: true };
  const setShadows = () => {
    let k = 0;
    for (let i = 0; i < fliers.length && k < NSH; i++) { animalState(S, fliers[(i * 7) % fliers.length], clock, st); if (st.phase === 1 || st.phase === 2) U.uSh.value[k++].set(st.x, st.y, st.z, st.pitch); }
    for (; k < NSH; k++) U.uSh.value[k].set(0, -1000, 0, 0);
  };
  let air = 0, airMin = 99; for (let j = 0; j < 68; j++) { let n = 0; for (const a of fliers) { const p = animalState(S, a, j * 0.5, st).phase; if (p === 1 || p === 2) n++; } air += n / 68; airMin = Math.min(airMin, n); }
  await ctx.yield();
  const zFoot = S.lipZ(0) + S.runR(0), lip = []; for (let x = -66; x <= 66; x += 6) lip.push([x, S.lipY(x) * S.endF(x), S.lipZ(x)]);
  const P = S.plume, hero = {
    object: root, radius: 34, height: 27, center: new THREE.Vector3(0, 18, 2), ground: true, groundY: -0.6,
    cycle: S.cycle, count: animals.length, uniforms: U, stats: { triangles: Math.round(tris), airborneMean: air, airborneMin: airMin, buildMs: 0 },
    anchors: {
      fall: { center: [0, S.waterY, zFoot], halfWidth: half, lipY: TOP, normal: [0, 0, 1] },
      viewpoints: { river: { position: [-8, S.waterY + 0.7, zFoot + 40], lookAt: [2, 9, 0] }, leap: { position: [-half - 14, TOP + 1.5, S.lipZ(-half - 14) + 5], lookAt: [0, 5, zFoot + 4] }, plain: { position: [0, TOP + 1.5, ZBACK - 4], lookAt: [0, TOP + 14, 0] } },
      flyThrough: [[-78, S.waterY + 0.7, zFoot + 44], [-40, S.waterY + 0.7, zFoot + 39], [0, S.waterY + 0.7, zFoot + 36], [40, S.waterY + 0.7, zFoot + 38], [78, S.waterY + 0.7, zFoot + 43]],
      plume: { base: [P.bx, P.by, P.bz], top: [P.bx + P.lx * 58, P.by + 58, P.bz + P.lz * 58], radius: 30 },
      lip, ends: [[-66, 0, S.lipZ(-66)], [66, 0, S.lipZ(66)]], slab: [S.slabX, TOP, S.lipZ(S.slabX)],
      portalSeat: { position: [0, S.waterY + 7, zFoot + 72], facing: [0, 0, -1], radius: 7, note: 'fallback only: the brief seats the portal between the figs on the far bank' },
      sunDir: sunDir.toArray(), waterY: S.waterY, current: [S.current, 0, 0],
      shape: { lipZ: S.lipZ, lipY: S.lipY, topY: S.topY, endF: S.endF, runR: S.runR, half, K, zBack: ZBACK, curSpeed: S.curSpeed, windX },
    },
    setProgress(u) { driven = true; clock = u * (opts.duration ?? 40); },
    setClock(s) { driven = true; clock = s; },
    // k 0..1 is the slide itself; age is seconds since it began (the dust, the splash and the wave outlive the slide)
    setCollapse(k, age) {
      U.uSlab.value = Math.min(1, Math.max(0, k)); const a = age ?? k * 2.5, lt = a - 1.9; U.uSlabA.value = k > 0 ? a : -1;
      U.uWaveP.value.set(S.slabX, S.lipZ(S.slabX) + 8, 3 + 8.5 * Math.max(lt, 0), k > 0 ? Math.min(1, Math.max(0, lt / 0.25)) * (1 - Math.min(1, Math.max(0, (lt - 3.5) / 3.5))) : 0);
    },
    // the viewer's place on the water (local x, z): swimmers keep a body length clear of it
    setKeepOut(x, z) { U.uKeep.value.x = x; U.uKeep.value.y = z; },
    setLight(o = {}) {
      if (o.sunDir) sunDir.fromArray(o.sunDir.isVector3 ? o.sunDir.toArray() : o.sunDir).normalize();
      if (o.sunColor || o.sunIntensity !== undefined) U.uSunC.value.set(o.sunColor || hour.sunC).multiplyScalar(o.sunIntensity ?? hour.sunI);
      if (o.sky || o.skyIntensity !== undefined) U.uSkyC.value.set(o.sky || hour.sky).multiplyScalar(o.skyIntensity ?? hour.skyI);
      if (o.ground || o.groundIntensity !== undefined) U.uGndC.value.set(o.ground || hour.gnd).multiplyScalar(o.groundIntensity ?? hour.gndI);
      if (o.dustLit) U.uDustLit.value.set(o.dustLit); if (o.dustShade) U.uDustShade.value.set(o.dustShade);
      relight();
    },
    animalAt(i, t, out = {}) { return animalState(S, animals[i], t, out); },
    // (x, z) is taken as the viewer's place: swimmers are carried round it exactly as the shader carries them (setKeepOut)
    clearance(x, y, z, t) {
      let m = 1e9; const R = U.uKeep.value.z;
      for (const a of animals) {
        animalState(S, a, t, st); if (!st.vis) continue;
        let dx = st.x - x, dz = st.z - z;
        if (st.phase === 3) { const kl = Math.hypot(dx, dz), kq = Math.max(0, 1 - kl / R), f = 1 + 0.62 * R * kq * kq / Math.max(kl, 0.05); dx *= f; dz *= f; }
        m = Math.min(m, Math.hypot(dx, st.y - y, dz) - 1.1 * a.size);
      }
      return m;
    },
    update(dt, time) { if (!driven) clock = time; U.uT.value = clock; U.uTime.value = time; setShadows(); },
    dispose() {},
  };
  return hero;
}
