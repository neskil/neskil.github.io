// HERO SET PIECE for "chinar-water-terraces": THE GREAT CASCADE AND THE BLACK PAVILION, one machine of water.
//
// WHAT IT IS
//   The end of terrace 3: a 200 m retaining wall with blind arcades whose middle 60 m is a wall of 300 cusped
//   niches (5 rows of 60, real recesses 0.55 m deep) each holding a brass pot of marigolds; a stone shelf
//   cantilevered 16 m out over it with a scalloped lip that combs the basin into ONE sheet of falling water
//   60 m wide and 16 m high; the gallery between sheet and niches (wet ledge, corbel ribs converging overhead,
//   drips, caustic water-light, sun cut off by the shelf); the tank (200 x 240 m of slate-teal water with an
//   analytic mirror of sky, sun, cascade and pavilion, ring stamps under every jet, foam at the cascade foot);
//   ~150 backlit fountain jets on bronze lotus buds on a 14 m grid; four causeways; and the black marble
//   pavilion (48 m square, twelve cusped arches, eave on brackets, pyramidal roof, gilt finial, coffered
//   ceiling with water-light, checker floor, four inner columns) on a stepped plinth.
//
// LOCAL SPACE (do not rotate; translate only)   local = brief world coordinates + (0, 0, 480)
//   Origin on the TANK WATER (y = 0) on the garden axis, 84 m in front of the cascade. +Y up. The camera
//   comes from +Z (terrace 3) and leaves toward -Z. Sheet / lip plane z = +84, niche wall face z = +100,
//   upper basin water y = 16, gallery x -30..30, tank x -100..100, z +84..-156, pavilion centre (0, -80),
//   pavilion floor y = 2. Height ~29 m, center (0, 8, -10). `radius` is 70: a FRAMING radius for the viewer's
//   orbit; the real footprint is hero.footprint (x -100..100, z -156..+150 with the terrace stand-in).
//   NOTE on the brief: flying the gallery after a right-hand turn round the LEFT end of the shelf means heading
//   +X, which puts the niches on the camera's RIGHT and the sheet (and the low sun behind it) on its LEFT, and
//   "curve left at the sheet" then works. To have the niches on the left, enter from the right end and fly -X
//   (the far mouth is then the bright sun end); pass your own opts.route so the jets clear your line.
//
// OPTS
//   palette   7 hex strings in brief order [ember red, marigold, cobalt, slate teal, black marble, snow, stone]
//   look      'october' (default) | 'april' (narcissus in the niches) | 'snow' (snow caps, steaming) |
//             'night' (snow + an oil lamp in every niche, moon-coloured water). Light colours follow; override
//             any of them afterwards with setLight().
//   sunDir    Vector3 TO the sun, local (default: 14 deg up, 60 deg left of the axis, ahead).
//   route     [[x,y,z],...] the camera line through the tank; jets within 9 m of it are left out
//             (default anchors.flyThrough). Pass yours if the path differs.
//   terrace   true (default): a plain slab of terrace 3 and its basin behind the wall so the piece stands
//             alone. The world passes false and abuts its own terrace at z = +106, y = 16.
//   veil      true (default): the full-screen spray veil used by setProgress.
//
// RETURNS (besides the contract fields)
//   setProgress(k, side)  0..1 across the second or two in which the eye passes the fall (0 and 1 = nothing):
//                   threads of water fall down the frame, white and teal, gold toward the sun, never a hard cut.
//                   side +1 / -1 keeps the curtain on the right / left of the frame (the eye rounds the END of the
//                   sheet) and opens it away from the centre; 0 covers the whole frame (the eye goes THROUGH it).
//                   The hole in the sheet itself needs no hook: it opens round the camera passed to update()
//                   (opts.hole === false leaves the sheet whole, for a route that goes round its end).
//   setLight({ sunDir, sunColor, skyTop, skyHorizon, band, tree, snow, lamp, mist, portal })   any subset (mist =
//                   opacity of the canal mist, portal = the colour of the glow seen through the sheet).
//   uniforms        the shared block (uHcTime, uHcSun, uHcSunCol, uHcSkyTop, uHcSkyHor, uHcBand, uHcTree, ...).
//   jets            [{ x, z, group }]  the jets that were built (for mallards, leaf rafts, pois).
//
// ANCHORS (local space, [x, y, z])
//   flyThrough    ordered safe camera line: over the wall left of the shelf, down and right into the gallery
//                 mouth, 40 m along the gallery centre line (8 m from niches and sheet, 6.5 m from ledge and
//                 ribs), out through the sheet at `burst`, one S through the jets, 58 m straight up the axis
//                 over the front causeway, through the near arch to the portal. >= 6 m from all stone.
//   galleryLine   { from, to }   the centre line of the gallery (fly it either way; the piece is symmetric)
//   burst         where flyThrough crosses the sheet
//   portalSeat    { position, facing, width, height }  the 14 m arch portal in the FAR arch, floor at y = 2
//   viewpoints    { above, galleryIn, galleryBack, niches, sheet, tank, approach, inside }  each { position, look }
//   nicheWall     { center, size }      sheet { center, size }     pavilion { center, half, floorY }
//   tubs          eight [x, y, z] on the plinth for the orange trees;   carpet  [x, y, z] pavilion floor centre
//   waterY 0, basinY 16, sunDir
//
// COST  126k-145k triangles by seed (hero.triangles; the 300 niches are ~30-40k, pots 36k, flowers 24k), 10 draw
//   calls (+1 while the veil shows), build ~160-240 ms, no lights, one 14 x 17 data texture. ctx.quality.detail
//   thins only mist puffs and drips.
// PER SEED  niche foils 5 or 7, pavilion foils 7/9/11, 30/40/48 scallops on the lip, stone warmer or cooler,
//   flower arrangement (scatter / rows / chevron / bands), finial size, jet height, streak pattern.
// LIGHT  wants ONE directional sun from opts.sunDir (intensity ~3, warm white) and a cobalt/rose hemisphere
//   light (~1). Stone, marble, brass and flowers are MeshStandardMaterials with injected detail, so they take
//   scene lights and fog. Baked into the shaders from local position: the shelf's shadow inside the gallery
//   (hcGal: no direct sun but at the mouths; a slate-blue fill that never reaches black, the same on ledge, wall and
//   soffit; and hcBand, the sun through the sheet as broad soft green-white bands that crawl over all three and
//   make the marigolds and the brass flare where they cross), caustics on the pavilion ceiling, damp, coursing,
//   an analytic sky/tree-band reflection on marble, brass and water (the sun's path on water is glitter). Blooming things: sheet streaks toward the sun, jet cores, sun glints, lamps (night).
// WORLD HOOKS (added by the world builder)  opts.canals [{ x0, x1, z0, z1, y, lip, jets }] extra water sheets drawn with
//   the tank's material (canal jets ring-stamp at x = +-8, z = 5 + 10 k); opts.extraJets [{ x, y, z, group, seed }];
//   opts.mist [[x, y, z, seed, 2, size], ...] low canal mist sliding downstream. Exports makeB, archPanel, archPts, patch
//   and HC_PARS; the stone shader has extra kinds for the terraces (lawn, carved, jali, creeper wall, beds, vault, carpet)
//   and hcGarden() bakes the garden's light (side-wall shadow, trunk stripes, crown dapple, the gatehouse lattice).

import * as THREE from 'three';
import { clamp, smoothstep } from '../kit/core.js';

const V3 = THREE.Vector3;
const DEFAULT_PALETTE = ['#C4381C', '#F5A21E', '#1D4FA8', '#2B4F5E', '#15161B', '#DCE3EA', '#9A8C80'];
const ZS = 84, ZW = 100, GH = 16, GX = 30, TX = 100, TZ1 = -156, PZ = -80, PH = 24, PY = 2;
const JG = 14, JX0 = -91, JZ0 = 70, JNX = 14, JNZ = 17;

// ---------------------------------------------------------------- shared GLSL
const HC_PARS = /* glsl */`
uniform float uHcTime, uHcSnow, uHcLamp, uHcWet, uHcMist;
uniform vec4 uHcGard;
uniform vec3 uHcSun, uHcSunCol, uHcSkyTop, uHcSkyHor, uHcBand, uHcTree, uHcCam, uHcWater, uHcCaus, uHcAccent, uHcLeaf;
float hcHash(vec2 p){ p = fract(p * vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x * p.y); }
float hcN2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hcHash(i), hcHash(i + vec2(1., 0.)), f.x), mix(hcHash(i + vec2(0., 1.)), hcHash(i + vec2(1., 1.)), f.x), f.y); }
float hcFbm(vec2 p){ return hcN2(p) * .55 + hcN2(p * 2.13 + 7.1) * .3 + hcN2(p * 4.31 + 3.7) * .15; }
// a drifting web of light, ~0..1.6
float hcCaus(vec2 p, float t){
  vec2 q = p + vec2(sin(p.y * 1.3 + t * .9), cos(p.x * 1.1 - t * .7)) * .55;
  float a = sin(q.x * 2.1 + t) + sin(q.y * 2.3 - t * 1.1) + sin((q.x + q.y) * 1.4 + t * .6);
  vec2 r = p * 1.7 + vec2(cos(p.y * .9 - t * .6), sin(p.x * 1.2 + t * .8)) * .6 + 4.;
  float b = sin(r.x * 2.3 - t * .8) + sin(r.y * 1.9 + t) + sin((r.x - r.y) * 1.3 - t * .5);
  float l1 = 1. - abs(a) / 3., l2 = 1. - abs(b) / 3.;
  l1 *= l1; l1 *= l1; l2 *= l2; l2 *= l2;
  return (l1 + l2) * .45 + l1 * l2 * .9;
}
// analytic surroundings for reflections: cobalt sky, pale horizon, a wall and tree band, the sun, dark water below
vec3 hcEnv(vec3 r){
  float h = r.y;
  vec3 c = mix(uHcSkyHor, uHcSkyTop, smoothstep(0., .55, h));
  float az = atan(r.z, r.x + 1e-4);
  float crown = .5 + .5 * sin(az * 23.) * sin(az * 7. + 1.3);
  float tb = smoothstep(.03, .07, h) * (1. - smoothstep(.1 + .1 * crown, .16 + .12 * crown, h));
  c = mix(c, uHcTree * (.55 + .9 * crown), tb * .85);
  c = mix(c, uHcBand, (1. - smoothstep(.02, .06, h)) * step(-.02, h));
  c = mix(c, uHcWater * (.5 + .5 * smoothstep(-.6, 0., h)), 1. - smoothstep(-.03, 0., h));
  float s = max(dot(r, uHcSun), 0.); float s2 = s * s; s2 *= s2; s2 *= s2; s2 *= s2;
  return c + uHcSunCol * (s2 * s2 * 1.1 + s2 * .03);
}
// the garden's baked light. uHcGard: x = shadow strength, y = fallen leaves on the lawns, z = spring (0 autumn, 1 april), w = spare
float hcGround(float z){ return z > 330. ? 32. : (z > 205. ? 24. : (z > 100.6 ? 16. : 0.)); }
float hcJali(vec2 q){ vec2 a = abs(fract(vec2(q.x + q.y, q.x - q.y) * .78) - .5); float d = min(a.x, a.y) - .2; float st = .16 - length(fract(vec2(q.x + q.y, q.x - q.y) * .78 + .5) - .5); return max(d, -1.) * step(st, 0.) - step(0., st) * .05; }
// the shadow of one row of chinars d metres down-sun of it, hy metres above the ground: 1 lit .. 0 dark
float hcRow(float d, float hy, float pz, float ky, float kz, float ph){
  float hr = hy + ky * d, zr = pz + kz * d;
  float has = 1. - step(abs(zr - 326.), 14.) - step(zr, 89.6);          // no tree stands on the chute or past the last one (z 103.6, at the terrace edge)
  float m = abs(mod(zr - 1.6 * step(zr, 116.) - 18. + 14., 28.) - 14.);
  float trunk = (1. - smoothstep(1.5, 2.7 + d * .025, m)) * (1. - smoothstep(13., 19., hr));
  float crown = smoothstep(12., 20., hr) * (1. - smoothstep(40., 48., hr));
  float dap = smoothstep(.38, .7, hcN2(vec2(zr * .13 + uHcTime * .02 + ph, hr * .17)) * .6 + hcN2(vec2(zr * .45 + ph, hr * .5 - uHcTime * .05)) * .4);
  return mix(1., (1. - trunk * .9) * mix(1., dap * .85, crown), clamp(has, 0., 1.));
}
float hcGarden(vec3 p){
  if (p.z < 101.4) return 1.;
  float ax = max(abs(uHcSun.x), .05); float sx = uHcSun.x < 0. ? 1. : -1.;
  float xr = p.x * sx, ky = uHcSun.y / ax, kz = uHcSun.z / ax;
  if (p.z > 480.3 && abs(p.x) < 15.6 && p.y < 64.) {            // the gatehouse hall: sun only through the screen and the arch
    float d = xr + 15.; float ys = p.y + ky * d, zs = p.z + kz * d;
    float top = 47.6 - 4.4 * min(abs(zs - 504.) / 8., 1.);
    float soft = smoothstep(14., 70., d);
    float scr = step(496., zs) * step(zs, 512.) * step(36., ys) * step(ys, top) * mix(step(0., hcJali(vec2(zs, ys))), .3, soft) * mix(.8, .5, soft) * step(p.y, 32.75);   // the lattice lies on the floor, the kerbs and the channel only
    float tz = (p.z - 480.) / max(-uHcSun.z, .05); float xa = p.x + uHcSun.x * tz, ya = p.y + uHcSun.y * tz;
    float arc = step(abs(xa), 8.8) * step(ya, 55.5 - abs(xa) * .9) * step(.001, -uHcSun.z);
    return max(scr, arc);
  }
  float g = hcGround(p.z);
  float lit = smoothstep(g + 20.5, g + 23.5, p.y + ky * (xr + 100.));
  // both rows of chinars (34 m either side of the axis) throw trunk stripes and a shifting crown dapple down-sun
  float d = xr + 34.;
  if (d > 1.) lit *= hcRow(d, p.y - g, p.z, ky, kz, 0.);
  d = xr - 34.;
  if (d > 1.) lit *= hcRow(d, p.y - g, p.z, ky, kz, 5.3);
  // the long shadows of the smaller trees (orchards, cypress pairs, the poplars beyond the wall), drawn out along the sun's
  // azimuth across lawn, paving and water, their edges a moving dapple
  vec2 sd = normalize(vec2(uHcSun.x, uHcSun.z) + vec2(1e-4, 0.)); float al = dot(p.xz, sd), ac = dot(p.xz, vec2(-sd.y, sd.x));
  float st = hcN2(vec2(ac * .09, al * .016 + 3.)) * .62 + hcN2(vec2(ac * .21 + 7., al * .045)) * .38;
  float dp = hcN2(vec2(ac * .9 + uHcTime * .06, al * .7 - uHcTime * .04));
  lit *= 1. - .78 * smoothstep(.55, .64, st + (dp - .5) * .13) * (1. - smoothstep(3., 14., p.y - g));
  return mix(1., lit, uHcGard.x);
}
// the water-light inside the gallery: broad soft bands thrown by the sun through the falling sheet (xl, yl = where
// the ray crossed it), crawling sideways and sliding down with the water, ~0..1.6
float hcBand(float xl, float yl){
  float t = uHcTime;
  float a = hcN2(vec2(xl * .19 + yl * .07 + t * .15, yl * .1 - t * .17));
  float b = hcN2(vec2(xl * .4 - yl * .1 - t * .1 + 9., yl * .21 + t * .32));
  float broad = smoothstep(.3, .7, a * .68 + b * .32);                 // bands several metres wide with edges metres soft
  float web = hcCaus(vec2(xl * .3, yl * .26 + t * .36), t * .7);
  return broad * (.48 + .5 * web) + .015 + .035 * web;
}
// inside the gallery: x = how much direct sun arrives (0 in the shelf's shadow, streaked where it has come
// through the sheet), y = how much bounced water-light there is
// (z = the band of water-light itself, for surfaces that glow in it)
vec3 hcGal(vec3 p){
  float inside = step(abs(p.x), 34.5) * step(${(ZS + 0.5).toFixed(1)}, p.z) * step(p.z, ${(ZW + 1.2).toFixed(1)}) * step(p.y, 15.6);
  float lz = max(-uHcSun.z, .05);
  float t = (p.z - ${ZS.toFixed(1)}) / lz;
  float yl = p.y + t * uHcSun.y, xl = p.x + t * uHcSun.x;
  float reach = mix(.6, 1., 1. - smoothstep(13., 23., yl)) * step(.001, -uHcSun.z);
  float open = smoothstep(29., 31.5, abs(p.x + t * uHcSun.x * .3));     // only the last metres by the mouths take the sun unfiltered
  float band = hcBand(xl, yl) * reach;
  float sun = reach * open;                                             // everywhere else the sun arrives only as water-light (z)
  float deep = smoothstep(35., 25., abs(p.x));
  vec3 gr = mix(vec3(1., 0., 0.), vec3(sun, deep, band), inside); gr.x *= hcGarden(p); return gr;
}
`;

function makeUniforms(pal, look, sunDir) {
  const C = (h) => new THREE.Color(h);
  const night = look === 'night', snow = look === 'snow' || night;
  const skyTop = C(pal[2]), hor = C(pal[2]).lerp(C(pal[5]), 0.62);
  if (snow) { skyTop.lerp(C(pal[5]), 0.55); hor.lerp(C(pal[5]), 0.6); }
  if (night) { skyTop.set('#0a1430'); hor.set('#1c2c52'); }
  const tree = look === 'april' ? C('#7fae3c') : C(pal[0]).lerp(C(pal[1]), 0.25);
  if (night) tree.multiplyScalar(0.08);
  const band = C(pal[6]).lerp(C(pal[2]), 0.3).multiplyScalar(night ? 0.12 : 0.7);
  return {
    uHcTime: { value: 0 }, uHcSnow: { value: snow ? 1 : 0 }, uHcLamp: { value: night ? 1 : 0 }, uHcWet: { value: 1 },
    uHcSun: { value: sunDir.clone().normalize() },
    uHcSunCol: { value: night ? C('#9fb4e8').multiplyScalar(0.5) : snow ? C('#fff2e2').multiplyScalar(0.8) : C('#fff0d8').multiplyScalar(1.6) },
    uHcSkyTop: { value: skyTop }, uHcSkyHor: { value: hor }, uHcBand: { value: band }, uHcTree: { value: tree },
    uHcCam: { value: new V3(0, 10, 200) }, uHcWater: { value: C(pal[3]).multiplyScalar(night ? 0.25 : 0.55) },
    uHcCaus: { value: night ? C('#8fa6d8').multiplyScalar(0.35) : C('#d8f2e0') },
    uHcAccent: { value: C(pal[1]).multiplyScalar(0.8) }, uHcLeaf: { value: look === 'april' ? C('#4f8a2c') : C('#2f5a22') },
    uHcGard: { value: new THREE.Vector4(look === 'october' || look === 'april' ? 1 : look === 'snow' ? 0.3 : 0.75, look === 'april' ? 0.06 : 1, look === 'april' ? 1 : 0, look === 'april' ? 1 : night ? 0.22 : 0.3) },
    uHcBurst: { value: 0 }, uHcHole: { value: new THREE.Vector4(0, -100, 0, 0) }, uHcVeil: { value: new THREE.Vector4(0, 0, 0, 0) },
    uHcMist: { value: 1 }, uHcBend: { value: new THREE.Vector2(1, 0) }, uHcPortal: { value: C('#ffb650') },
  };
}

// MeshStandardMaterial with local-space varyings and injected colour / roughness / light code.
//   o.color: runs after <color_fragment> (edit diffuseColor.rgb; hp = local position, hn = local normal, vAux, vHcUv)
//   o.rough: runs after <roughnessmap_fragment>   o.light: after <lights_fragment_end>   o.add: vec3 hcAdd before output
function patch(mat, U, key, o) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aux; attribute vec2 huv; varying vec4 vAux; varying vec2 vHcUv; varying vec3 vHcP; varying vec3 vHcN;\nuniform float uHcTime;\n' + (o.vpars || ''))
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        ${o.vert || ''}
        vec4 hcP4 = vec4(transformed, 1.); vec3 hcN3 = normal;
        #ifdef USE_INSTANCING
          hcP4 = instanceMatrix * hcP4; hcN3 = mat3(instanceMatrix) * hcN3;
        #endif
        vHcP = hcP4.xyz; vHcN = hcN3; vAux = aux; vHcUv = huv;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vAux; varying vec2 vHcUv; varying vec3 vHcP; varying vec3 vHcN;\n' + HC_PARS + (o.pars || ''))
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 hp = vHcP; vec3 hn = normalize(vHcN + vec3(0., 1e-5, 0.)); vec3 hcAdd = vec3(0.); float hcWet = 0.; float hcGloss = 0.;
        vec3 hv = normalize(uHcCam - hp + vec3(0., 1e-4, 0.));
        ${o.color || ''}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
        ${o.rough || ''}`)
      .replace('#include <lights_fragment_end>', `#include <lights_fragment_end>
        ${o.light || ''}`)
      .replace('#include <opaque_fragment>', `outgoingLight += hcAdd;
        #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => 'hc-cwt-' + key;
  return mat;
}

// ---------------------------------------------------------------- geometry builder (flat-shaded, vertex-coloured)
// Vertices are [x, y, z, ao?]. Every face is oriented to agree with a wanted normal, so winding never matters.
// Attributes: position, normal, color, aux (x = baked occlusion, y = kind, z/w = panel half-width / height), huv.
function makeB() {
  const P = [], N = [], C = [], A = [], UV = [];
  const b = { col: [1, 1, 1], ao: 1, kind: 0, az: 0, aw: 0, n: 0 };
  const put = (p, nx, ny, nz, u, v) => {
    P.push(p[0], p[1], p[2]); N.push(nx, ny, nz); C.push(b.col[0], b.col[1], b.col[2]);
    A.push(b.ao * (p[3] === undefined ? 1 : p[3]), b.kind, b.az, b.aw); UV.push(u, v); b.n++;
  };
  b.setCol = (c, k = 1) => { b.col = [c.r * k, c.g * k, c.b * k]; return b; };
  // triangle oriented toward (wx, wy, wz); sm = optional per-vertex normals [[...],[...],[...]]
  b.tri = (p0, p1, p2, wx, wy, wz, uv) => {
    const ax = p1[0] - p0[0], ay = p1[1] - p0[1], az = p1[2] - p0[2], bx = p2[0] - p0[0], by = p2[1] - p0[1], bz = p2[2] - p0[2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx;
    const l = Math.hypot(nx, ny, nz); if (l < 1e-9) return;
    nx /= l; ny /= l; nz /= l;
    const u = uv || [[0, 0], [0, 0], [0, 0]];
    if (nx * wx + ny * wy + nz * wz < 0) { put(p0, -nx, -ny, -nz, u[0][0], u[0][1]); put(p2, -nx, -ny, -nz, u[2][0], u[2][1]); put(p1, -nx, -ny, -nz, u[1][0], u[1][1]); }
    else { put(p0, nx, ny, nz, u[0][0], u[0][1]); put(p1, nx, ny, nz, u[1][0], u[1][1]); put(p2, nx, ny, nz, u[2][0], u[2][1]); }
  };
  // quad a-b-c-d (a,b bottom; c above b; d above a) facing (wx, wy, wz); uv in metres across the face when w > 0
  b.quad = (p0, p1, p2, p3, wx, wy, wz, w = 0, h = 0) => {
    const hw = w * 0.5; const pz = b.az, pw = b.aw;
    if (w > 0) { b.az = hw; b.aw = h; }
    const u = [[-hw, 0], [hw, 0], [hw, h], [-hw, h]];
    b.tri(p0, p1, p2, wx, wy, wz, [u[0], u[1], u[2]]); b.tri(p0, p2, p3, wx, wy, wz, [u[0], u[2], u[3]]);
    b.az = pz; b.aw = pw;
  };
  // axis-aligned box; skip = string of faces to leave out among 'xXyYzZ' (lower = min side)
  b.box = (x0, y0, z0, x1, y1, z1, skip = '') => {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0;
    if (!skip.includes('x')) b.quad([x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1], -1, 0, 0, d, h);
    if (!skip.includes('X')) b.quad([x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0], 1, 0, 0, d, h);
    if (!skip.includes('z')) b.quad([x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0], 0, 0, -1, w, h);
    if (!skip.includes('Z')) b.quad([x1, y0, z1], [x0, y0, z1], [x0, y1, z1], [x1, y1, z1], 0, 0, 1, w, h);
    if (!skip.includes('y')) b.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], 0, -1, 0);
    if (!skip.includes('Y')) b.quad([x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1], 0, 1, 0);
  };
  // vertical prism over a convex footprint [[x,z],...]; aoBottom darkens the foot
  b.prism = (poly, y0, y1, top = true, aoBottom = 1) => {
    let cx = 0, cz = 0; for (const p of poly) { cx += p[0]; cz += p[1]; } cx /= poly.length; cz /= poly.length;
    for (let i = 0; i < poly.length; i++) {
      const p = poly[i], q = poly[(i + 1) % poly.length], w = Math.hypot(q[0] - p[0], q[1] - p[1]);
      const mx = (p[0] + q[0]) / 2 - cx, mz = (p[1] + q[1]) / 2 - cz;
      b.quad([p[0], y0, p[1], aoBottom], [q[0], y0, q[1], aoBottom], [q[0], y1, q[1]], [p[0], y1, p[1]], mx, 0, mz, w, y1 - y0);
      if (top) b.tri([cx, y1, cz], [p[0], y1, p[1]], [q[0], y1, q[1]], 0, 1, 0);
    }
  };
  // rectangular moulding: profile [[d, y, ao?],...] walked bottom-to-top along the OUTSIDE; each point is a
  // rectangle of half sizes (hx + d, hz + d) at height y
  b.ring = (prof, cx, cz, hx, hz) => {
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (let i = 0; i + 1 < prof.length; i++) {
      const a = prof[i], c = prof[i + 1], dd = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dd, dy) || 1;
      const nd = dy / l, ny = -dd / l;
      for (let k = 0; k < 4; k++) {
        const s0 = cs[k], s1 = cs[(k + 1) % 4];
        const ox = (s0[0] + s1[0]) / 2, oz = (s0[1] + s1[1]) / 2;
        const pt = (pr, s) => [cx + s[0] * (hx + pr[0]), pr[1], cz + s[1] * (hz + pr[0]), pr[2]];
        const w = k % 2 === 0 ? 2 * (hx + a[0]) : 2 * (hz + a[0]);
        b.quad(pt(a, s0), pt(a, s1), pt(c, s1), pt(c, s0), ox * nd, ny, oz * nd, Math.abs(dd) < 0.02 ? w : 0, l);
      }
    }
  };
  // smooth lathe: profile [[r, y, ao?],...] bottom-to-top along the outside
  b.lathe = (prof, cx, cy, cz, segs, rot = 0) => {
    const nrm = prof.map((p, i) => {
      const a = prof[Math.max(0, i - 1)], c = prof[Math.min(prof.length - 1, i + 1)];
      const dr = c[0] - a[0], dy = c[1] - a[1], l = Math.hypot(dr, dy) || 1; return [dy / l, -dr / l];
    });
    const pv = (i, k) => { const a = rot + (k / segs) * Math.PI * 2, p = prof[i]; return [[cx + Math.cos(a) * p[0], cy + p[1], cz + Math.sin(a) * p[0], p[2]], [Math.cos(a) * nrm[i][0], nrm[i][1], Math.sin(a) * nrm[i][0]]]; };
    const emit = (v0, v1, v2) => { for (const v of [v0, v1, v2]) put(v[0], v[1][0], v[1][1], v[1][2], 0, 0); };
    for (let i = 0; i + 1 < prof.length; i++) for (let k = 0; k < segs; k++) {
      const a = pv(i, k), c = pv(i, k + 1), d = pv(i + 1, k + 1), e = pv(i + 1, k);
      if (prof[i][0] > 1e-4) emit(a, d, c);
      if (prof[i + 1][0] > 1e-4) emit(a, e, d);
    }
  };
  const attrs = [['position', P, 3], ['normal', N, 3], ['color', C, 3], ['aux', A, 4], ['huv', UV, 2]];
  b.geometry = () => {
    const g = new THREE.BufferGeometry();
    for (const [name, a, size] of attrs) g.setAttribute(name, new THREE.Float32BufferAttribute(a, size));
    g.computeBoundingSphere();
    return g;
  };
  // the same geometry for a large mesh: pause() (ctx.yield) is awaited between its attributes
  b.geometryAsync = async (pause) => {
    const g = new THREE.BufferGeometry();
    for (const [name, a, size] of attrs) { g.setAttribute(name, new THREE.Float32BufferAttribute(a, size)); await pause(); }
    g.computeBoundingSphere();
    return g;
  };
  return b;
}

// cusped (multi-foil) pointed arch from the left spring to the right spring, centred on x = 0.
function archPts(w, ySpring, yApex, foils, per = 3, cusp = 0.09) {
  const pts = [], rise = yApex - ySpring, n = Math.max(1, foils) * per;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = Math.PI * t;
    let x = -Math.cos(a) * w * 0.5, y = Math.pow(Math.sin(a), 0.8) * rise * 0.86;
    const og = Math.max(0, 1 - Math.abs(x) / (0.3 * w)); y += rise * 0.14 * og * og;      // ogee point
    if (foils > 1) { const f = 1 - cusp * (1 - Math.abs(Math.sin(Math.PI * foils * t))) * Math.sin(a); x *= f; y *= f; }
    pts.push([x, ySpring + y]);
  }
  return pts;
}

// Wall panel with an arched opening. T(s, y, d) maps wall coordinates (s along, y up, d into the wall) to
// local space; F = the front normal (pointing out of the wall, toward -d).
//   o: { s0, s1, y0, y1, cx, w, yBase, ySpring, yApex, foils, per, depth, back, through, aoIn, cusp }
function archPanel(b, T, F, o) {
  const arch = archPts(o.w, o.ySpring, o.yApex, o.foils ?? 1, o.per ?? 3, o.cusp ?? 0.09).map((p) => [p[0] + o.cx, p[1]]);
  const out = [[o.cx - o.w / 2, o.yBase], ...arch, [o.cx + o.w / 2, o.yBase]];
  const sill = o.yBase > o.y0 + 1e-3;
  const border = out.map((p, i) => {
    if (i === 0) return sill ? [o.s0, o.y0] : [o.s0, p[1]];
    if (i === out.length - 1) return sill ? [o.s1, o.y0] : [o.s1, p[1]];
    const dx = p[0] - o.cx, dy = Math.max(p[1] - o.ySpring, 0);
    if (dy < 1e-3) return [dx < 0 ? o.s0 : o.s1, p[1]];
    const ex = dx < 0 ? o.s0 - o.cx : o.s1 - o.cx, tt = Math.abs(dx) > 1e-6 ? ex / dx : 1e9, tu = (o.y1 - o.ySpring) / dy;
    return tt < tu ? [dx < 0 ? o.s0 : o.s1, o.ySpring + dy * tt] : [o.cx + dx * tu, o.y1];
  });
  const face = (d, fx, fy, fz, ao) => {
    const V = (p) => { const v = T(p[0], p[1], d); v[3] = ao; return v; };
    for (let i = 0; i + 1 < out.length; i++) {
      const b0 = border[i], b1 = border[i + 1];
      b.quad(V(out[i]), V(out[i + 1]), V(b1), V(b0), fx, fy, fz);
      const top0 = Math.abs(b0[1] - o.y1) < 1e-6, top1 = Math.abs(b1[1] - o.y1) < 1e-6;
      if (top0 !== top1) { const c = [top0 ? b1[0] : b0[0], o.y1]; b.tri(V(b0), V(b1), V(c), fx, fy, fz); }
      else if (!top0 && b0[0] !== b1[0]) {   // jumps from the left edge to the right edge (very wide panel)
        b.quad(V(b0), V(b1), V([b1[0], o.y1]), V([b0[0], o.y1]), fx, fy, fz);
      }
    }
    if (sill) b.quad(V([o.s0, o.y0]), V([o.s1, o.y0]), V(out[out.length - 1]), V(out[0]), fx, fy, fz);
  };
  face(0, F[0], F[1], F[2], 1);
  if (o.through) face(o.depth, -F[0], -F[1], -F[2], 1);
  // reveal
  const aoIn = o.through ? 1 : (o.aoIn ?? 0.45), mid = [o.cx, (o.yBase + o.yApex) * 0.5];
  const loop = sill ? [...out, out[0]] : out;
  for (let i = 0; i + 1 < loop.length; i++) {
    const p = loop[i], q = loop[i + 1];
    const a = T(p[0], p[1], 0), c = T(q[0], q[1], 0), d = T(q[0], q[1], o.depth), e = T(p[0], p[1], o.depth);
    d[3] = aoIn; e[3] = aoIn;
    const m = T(mid[0], mid[1], o.depth * 0.5), fx = m[0] - (a[0] + c[0]) / 2, fy = m[1] - (a[1] + c[1]) / 2, fz = m[2] - (a[2] + c[2]) / 2;
    b.quad(a, c, d, e, fx, fy, fz, Math.hypot(q[0] - p[0], q[1] - p[1]), o.depth);
  }
  if (o.back) {
    const V = (s, y, ao) => { const v = T(s, y, o.depth); v[3] = ao; return v; };
    const xa = o.cx - o.w / 2, xb = o.cx + o.w / 2, ym = (o.yBase + o.yApex) / 2;
    b.quad(V(xa, o.yBase, aoIn * 1.25), V(xb, o.yBase, aoIn * 1.25), V(xb, ym, aoIn), V(xa, ym, aoIn), F[0], F[1], F[2]);
    b.quad(V(xa, ym, aoIn), V(xb, ym, aoIn), V(xb, o.yApex, aoIn * 0.55), V(xa, o.yApex, aoIn * 0.55), F[0], F[1], F[2]);
  }
}

// A rectangle of wall (s0..s1, y0..y1 in the wall coordinates of T) with one sunk panel in it: a chamfered frame, a
// riser, a shadowed back and (o.boss = [half width, half height, how proud]) a low raised lozenge in its field.
//   o: { s0, s1, y0, y1, ps0, ps1, py0, py1, ch, chy (the chamfer's width along s, along y), chd, depth, aoIn,
//        ao(s, y) -> the face's own occlusion, boss,
//        cols: [[colour, tone] of the frame, of the moulding and lozenge, of the back] }
function sunkPanel(b, T, F, o) {
  const ao = o.ao || (() => 1), aoIn = o.aoIn ?? 0.5, ch = o.ch ?? 0.12, chy = o.chy ?? ch, chd = o.chd ?? 0.08;
  const V = (s, y, d, a) => { const v = T(s, y, d); v[3] = a; return v; }, Vf = (s, y) => V(s, y, 0, ao(s, y));
  const q = (p0, p1, p2, p3) => b.quad(p0, p1, p2, p3, F[0], F[1], F[2]);
  const tone = (i) => { if (o.cols) b.setCol(o.cols[i][0], o.cols[i][1]); };
  tone(0);
  // the frame: two stiles the full height, two rails between them; each stile is laid in three pieces that meet at the rails'
  // inner edges, so every corner of a rail and of the moulding is a corner of the stile beside it (no joint ends in the middle of an edge)
  for (const [sa, sb] of [[o.s0, o.ps0], [o.ps1, o.s1]]) for (const [ya, yb] of [[o.y0, o.py0], [o.py0, o.py1], [o.py1, o.y1]]) q(Vf(sa, ya), Vf(sb, ya), Vf(sb, yb), Vf(sa, yb));
  q(Vf(o.ps0, o.y0), Vf(o.ps1, o.y0), Vf(o.ps1, o.py0), Vf(o.ps0, o.py0)); q(Vf(o.ps0, o.py1), Vf(o.ps1, o.py1), Vf(o.ps1, o.y1), Vf(o.ps0, o.y1));
  const A = [[o.ps0, o.py0], [o.ps1, o.py0], [o.ps1, o.py1], [o.ps0, o.py1]];
  const I = [[o.ps0 + ch, o.py0 + chy], [o.ps1 - ch, o.py0 + chy], [o.ps1 - ch, o.py1 - chy], [o.ps0 + ch, o.py1 - chy]];
  const cs = (o.ps0 + o.ps1) / 2, cy = (o.py0 + o.py1) / 2, m = T(cs, cy, o.depth * 0.5);
  tone(1);
  for (let i = 0; i < 4; i++) {
    const a = A[i], c = A[(i + 1) % 4], e = I[i], f = I[(i + 1) % 4];
    q(V(a[0], a[1], 0, ao(a[0], a[1])), V(c[0], c[1], 0, ao(c[0], c[1])), V(f[0], f[1], chd, 0.8), V(e[0], e[1], chd, 0.8));           // the chamfer
    const p0 = V(e[0], e[1], chd, 0.8), p1 = V(f[0], f[1], chd, 0.8), p2 = V(f[0], f[1], o.depth, aoIn), p3 = V(e[0], e[1], o.depth, aoIn);
    b.quad(p0, p1, p2, p3, m[0] - (p0[0] + p1[0]) / 2, m[1] - (p0[1] + p1[1]) / 2, m[2] - (p0[2] + p1[2]) / 2);                          // the riser
  }
  // the back, with its lozenge
  const B = I.map((p) => V(p[0], p[1], o.depth, aoIn));
  tone(2);
  if (!o.boss) { q(B[0], B[1], B[2], B[3]); return; }
  const [hs, hy, hh] = o.boss, k = Math.min(1, aoIn * 1.5);
  const R = [V(cs, cy - hy, o.depth, aoIn), V(cs + hs, cy, o.depth, aoIn), V(cs, cy + hy, o.depth, aoIn), V(cs - hs, cy, o.depth, aoIn)], top = V(cs, cy, o.depth - hh, k);
  const t3 = (p0, p1, p2) => b.tri(p0, p1, p2, F[0], F[1], F[2]);
  for (let i = 0; i < 4; i++) { t3(B[i], B[(i + 1) % 4], R[i]); t3(B[i], R[i], R[(i + 3) % 4]); }
  tone(1);
  for (let i = 0; i < 4; i++) t3(R[i], R[(i + 1) % 4], top);
}

// ---------------------------------------------------------------- stone: wall, niches, shelf, ledge, causeways, plinth
// kinds (aux.y): 0 ashlar / paving by normal, 1 polished niche stone, 3 causeway side (culvert arches), 4 lawn
// (the world adds 5..12, see the header; 13 = a raked heap of leaves)
async function buildStone(pal, rng, opts, pause) {
  const b = makeB();
  const stone = new THREE.Color(pal[6]).multiplyScalar(1.22), pale = new THREE.Color(pal[6]).lerp(new THREE.Color(pal[5]), 0.5);
  const lawn = new THREE.Color('#4f7a34');
  const Tw = (s, y, d) => [s, y, ZW + d], Fw = [0, 0, -1];
  // ---- niche wall: 5 rows of 60 cusped recesses
  b.kind = 1;
  const foils = opts.foils;
  for (let r = 0; r < 5; r++) for (let c = 0; c < 60; c++) {
    if (c % 10 === 0) await pause();                  // 300 panels: hand the page back every ten
    const s0 = -GX + c, y0 = 0.9 + r * 2.6;
    b.setCol(pale, 0.9 + 0.14 * rng());
    archPanel(b, Tw, Fw, { s0, s1: s0 + 1, y0, y1: y0 + 2.6, cx: s0 + 0.5, w: 0.8, yBase: y0 + 0.3, ySpring: y0 + 1.6, yApex: y0 + 2.3, foils, per: 4, depth: 0.55, back: true, aoIn: 0.5, cusp: 0.12 });
  }
  b.setCol(pale, 0.86);
  b.quad([-34, 0.5, ZW], [34, 0.5, ZW], [34, 0.9, ZW], [-34, 0.9, ZW], 0, 0, -1);
  b.quad([-34, 13.9, ZW, 0.7], [34, 13.9, ZW, 0.7], [34, 14.2, ZW, 0.5], [-34, 14.2, ZW, 0.5], 0, 0, -1);
  // the two end panels of the niche wall (4 x 13 m each): a blind arch in two orders, the inner one cusped like the
  // niches and its back cut in fish-scales, under a sunk panel with a lozenge
  const cr = opts.carve;
  for (const sx of [-1, 1]) {
    const s0 = sx > 0 ? GX : -34, cx = s0 + 2;
    b.kind = 1; b.setCol(pale, 0.86 * (0.96 + 0.08 * cr()));
    archPanel(b, Tw, Fw, { s0, s1: s0 + 4, y0: 0.9, y1: 11.45, cx, w: 3.1, yBase: 1.5, ySpring: 8.3, yApex: 11.1, foils: 1, per: 10, depth: 0.16, aoIn: 0.8 });
    b.setCol(pale, 0.9 * (0.96 + 0.08 * cr())); b.ao = 0.86;
    archPanel(b, (s, y, d) => [s, y, ZW + 0.16 + d], Fw, { s0: cx - 1.55, s1: cx + 1.55, y0: 1.5, y1: 11.1, cx, w: 2.4, yBase: 1.5, ySpring: 7.9, yApex: 10.4, foils, per: 3, depth: 0.4, aoIn: 0.5, cusp: 0.1 });
    b.ao = 1;
    b.quad([cx - 1.2, 1.5, ZW + 0.16, 0.8], [cx + 1.2, 1.5, ZW + 0.16, 0.8], [cx + 1.2, 1.5, ZW + 0.56, 0.5], [cx - 1.2, 1.5, ZW + 0.56, 0.5], 0, 1, 0);
    b.kind = 5; b.setCol(pale, 0.92 * (0.96 + 0.08 * cr()));
    // (the back stands in the light the slab had: no baked shade on it. Toward the gallery's open ends the cool fill thins, and a shaded back there went black)
    b.quad([cx - 1.2, 1.5, ZW + 0.56], [cx + 1.2, 1.5, ZW + 0.56], [cx + 1.2, 6, ZW + 0.56], [cx - 1.2, 6, ZW + 0.56], 0, 0, -1);
    b.quad([cx - 1.2, 6, ZW + 0.56], [cx + 1.2, 6, ZW + 0.56], [cx + 1.2, 10.4, ZW + 0.56], [cx - 1.2, 10.4, ZW + 0.56], 0, 0, -1);
    b.kind = 1; b.setCol(pale, 0.86 * (0.96 + 0.08 * cr()));
    sunkPanel(b, Tw, Fw, { s0, s1: s0 + 4, y0: 11.45, y1: 13.9, ps0: cx - 1.3, ps1: cx + 1.3, py0: 11.75, py1: 13.25, ch: 0.12, chd: 0.08, depth: 0.22, aoIn: 0.55, boss: [0.8, 0.42, 0.09] });
  }
  b.setCol(pale, 1.04);
  for (let r = 0; r <= 5; r++) { const y = 0.9 + r * 2.6 + (r === 5 ? -0.1 : 0.13); b.box(-GX - 0.4, y - 0.06, ZW - 0.1, GX + 0.4, y + 0.06, ZW, 'Z'); }
  for (let i = 0; i <= 6; i++) { const s = -GX + i * 10; b.box(s - 0.09, 0.5, ZW - 0.07, s + 0.09, 14, ZW, 'yYZ'); }
  await pause();
  // ---- retaining wall with blind arcades either side
  b.kind = 0;
  for (const sx of [-1, 1]) for (let i = 0; i < 6; i++) {
    const a = 34 + i * 11, s0 = sx > 0 ? a : -a - 11;
    b.setCol(stone, 0.92 + 0.1 * rng());
    archPanel(b, Tw, Fw, { s0, s1: s0 + 11, y0: 0.5, y1: GH, cx: s0 + 5.5, w: 7.6, yBase: 0.5, ySpring: 8.6, yApex: 13, foils: 1, per: 12, depth: 0.9, back: true, aoIn: 0.62 });
    b.setCol(stone, 1.02);
    b.prism([[s0 - 0.6, ZW - 0.3], [s0 + 0.6, ZW - 0.3], [s0 + 0.6, ZW + 0.1], [s0 - 0.6, ZW + 0.1]], 0.5, GH, false, 0.7);
    b.box(s0 + 5.5 - 4.4, 8.45, ZW - 0.12, s0 + 5.5 - 3.8, 8.75, ZW + 0.9, 'Z');
    b.box(s0 + 5.5 + 3.8, 8.45, ZW - 0.12, s0 + 5.5 + 4.4, 8.75, ZW + 0.9, 'Z');
  }
  b.setCol(stone, 1.06);
  for (const sx of [-1, 1]) {
    const x0 = sx > 0 ? 31.2 : -TX, x1 = sx > 0 ? TX : -31.2;
    b.box(x0, GH, ZW - 0.35, x1, GH + 0.25, ZW + 1.3, 'y'); b.box(x0, GH + 0.25, ZW - 0.2, x1, GH + 0.6, ZW + 1.15, 'y');
  }
  await pause();
  // ---- the shelf: soffit, corbel ribs, cheeks, kerbs, scalloped lip
  const zr = ZS + 1.0, zEnd = opts.terrace ? 150 : ZW + 1.3;
  b.setCol(stone, 0.9);
  // the soffit: in each of the 20 bays between two ribs three coffers in a row from wall to lip, sunk 0.42 m up into the
  // shelf by a lighter chamfer and a riser, a low lozenge on each darker, shadowed back; the half bays outside the end ribs stay plain
  const Ts = (s, t, d) => [s, 14.2 + ((ZW - t) / (ZW - zr)) * 0.8 + d, t], Fs = [0, -1, 0], aoS = (s, t) => 0.55 + 0.4 * ((ZW - t) / (ZW - zr));
  const CT = [[zr, zr + 1, zr + 4.9, zr + 5.225], [zr + 5.225, zr + 5.55, zr + 9.45, zr + 9.775], [zr + 9.775, zr + 10.1, zr + 14, ZW]];
  // the two plain half bays: the same plane as before, laid as a fan from its two outer corners, its inner edge cut where the end
  // bay's frame has its corners, so the plain strip and the coffered bay beside it share every corner along their joint
  const Ps = (s, t) => { const v = Ts(s, t, 0); v[3] = aoS(s, t); return v; }, CS = [...new Set(CT.flat())];
  for (const sx of [-1, 1]) {
    for (let j = 0; j + 1 < CS.length; j++) b.tri(Ps(sx * 31.2, zr), Ps(sx * GX, CS[j]), Ps(sx * GX, CS[j + 1]), 0, -1, 0);
    b.tri(Ps(sx * 31.2, zr), Ps(sx * GX, ZW), Ps(sx * 31.2, ZW), 0, -1, 0);
  }
  for (let i = 0; i < 20; i++) {
    const x0 = -GX + i * 3;
    for (const [t0, p0, p1, t1] of CT) {
      const tk = 0.95 + 0.1 * cr();
      sunkPanel(b, Ts, Fs, { s0: x0, s1: x0 + 3, y0: t0, y1: t1, ps0: x0 + 0.6, ps1: x0 + 2.4, py0: p0, py1: p1, ch: 0.14, chd: 0.12, depth: 0.42, aoIn: 0.42, ao: aoS, boss: [0.45, 1.15, 0.12],
        cols: [[stone, 0.9], [stone, 1.12 * tk], [stone, 0.9 * 0.62 * tk]] });
    }
    if (i % 5 === 4) await pause();
  }
  b.setCol(stone, 0.9);
  for (let i = 0; i <= 20; i++) {
    const x = -GX + i * 3, w = 0.28; b.setCol(stone, 0.95 + 0.1 * rng());
    for (const s of [-1, 1]) b.quad([x + s * w, 11.8, ZW, 0.6], [x + s * w, 14.86, ZS + 1.6], [x + s * w, 15.0, ZS + 1.6], [x + s * w, 14.25, ZW, 0.6], s, 0, 0);
    b.quad([x - w, 11.8, ZW, 0.6], [x + w, 11.8, ZW, 0.6], [x + w, 14.86, ZS + 1.6], [x - w, 14.86, ZS + 1.6], 0, -1, -0.2);
    b.box(x - 0.42, 10.9, ZW - 0.55, x + 0.42, 11.8, ZW, 'YZ'); b.box(x - 0.34, 10.45, ZW - 0.3, x + 0.34, 10.9, ZW, 'YZ');
  }
  for (const sx of [-1, 1]) {
    const x = sx * 31.2; b.setCol(stone, 1.0);
    // the cheek: a frieze of thirteen small blind trefoil arches over a fillet; the wedge under the fillet stays plain
    b.quad([x, 14.2, ZW], [x, 15.0, zr], [x, 15.05, zr], [x, 15.05, ZW], sx, 0, 0);
    b.setCol(stone, 1.08); b.box(Math.min(x, x + sx * 0.07), 14.98, zr, Math.max(x, x + sx * 0.07), 15.08, ZW, sx > 0 ? 'x' : 'X');
    const Tc = (s, y, d) => [sx * (31.2 - d), y, s], pw = (ZW - zr) / 13;
    for (let k = 0; k < 13; k++) {
      b.setCol(stone, 0.95 + 0.1 * cr());
      archPanel(b, Tc, [sx, 0, 0], { s0: zr + k * pw, s1: zr + (k + 1) * pw, y0: 15.05, y1: 16.5, cx: zr + (k + 0.5) * pw, w: 0.78, yBase: 15.22, ySpring: 15.8, yApex: 16.24, foils: 3, per: 3, depth: 0.22, back: true, aoIn: 0.45, cusp: 0.14 });
    }
    b.setCol(stone, 1.0);
    b.quad([x, 15.0, zr], [x, 15.25, ZS - 0.3], [x, 16.5, ZS - 0.3], [x, 16.5, zr], sx, 0, 0);
    b.box(Math.min(x, sx * GX), 15.3, ZS - 0.3, Math.max(x, sx * GX), 16.5, zEnd, sx > 0 ? 'Xy' : 'xy');
  }
  const NS = opts.scallops * 4, ze = (x) => ZS + 0.05 - 0.42 * Math.abs(Math.sin((Math.PI * (x + GX) * opts.scallops) / (2 * GX)));
  b.setCol(stone, 1.08);
  for (let i = 0; i < NS; i++) {
    const xa = -GX + (i / NS) * 2 * GX, xb = -GX + ((i + 1) / NS) * 2 * GX, za = ze(xa), zb = ze(xb);
    b.quad([xa, 15.22, za, 0.8], [xb, 15.22, zb, 0.8], [xb, 15.9, zb], [xa, 15.9, za], 0, 0, -1);
    b.quad([xa, 15.0, zr, 0.8], [xb, 15.0, zr, 0.8], [xb, 15.22, zb, 0.8], [xa, 15.22, za, 0.8], 0, -1, 0);
    b.quad([xa, 15.9, za], [xb, 15.9, zb], [xb, 15.9, zr + 0.4], [xa, 15.9, zr + 0.4], 0, 1, 0);
  }
  await pause();
  // ---- gallery ledge and the walk along the wall foot
  b.setCol(stone, 0.96);
  b.box(-34, -0.4, ZS + 2.6, 34, 0.5, ZW, 'yZ'); b.box(-34.6, -0.4, ZS + 1.7, 34.6, 0.22, ZS + 2.6, 'yZ');
  for (const sx of [-1, 1]) b.box(sx > 0 ? 34 : -TX, -0.4, ZW - 3.6, sx > 0 ? TX : -34, 0.5, ZW, 'yZ');
  // ---- causeways (culvert arches painted on their sides by the shader), landing, plinth
  const cway = (x0, z0, x1, z1) => {
    const alongZ = z1 - z0 > x1 - x0;
    b.kind = 3; b.setCol(stone, 0.95); b.box(x0, -0.4, z0, x1, 1.2, z1, 'yY');
    b.kind = 0; b.setCol(stone, 1.0); b.quad([x0, 1.2, z0], [x1, 1.2, z0], [x1, 1.2, z1], [x0, 1.2, z1], 0, 1, 0);
    b.setCol(stone, 1.08);
    if (alongZ) { b.box(x0 - 0.12, 1.02, z0, x0 + 0.4, 1.4, z1, 'y'); b.box(x1 - 0.4, 1.02, z0, x1 + 0.12, 1.4, z1, 'y'); }
    else { b.box(x0, 1.02, z0 - 0.12, x1, 1.4, z0 + 0.4, 'y'); b.box(x0, 1.02, z1 - 0.4, x1, 1.4, z1 + 0.12, 'y'); }
  };
  cway(-3, PZ + 29.2, 3, -4); cway(-3, TZ1, 3, PZ - 29.2); cway(-TX, PZ - 3, -29.2, PZ + 3); cway(29.2, PZ - 3, TX, PZ + 3);
  const oct = (r, cz) => Array.from({ length: 8 }, (_, i) => { const a = (i + 0.5) * Math.PI / 4; return [Math.cos(a) * r, cz + Math.sin(a) * r]; });
  b.setCol(stone, 0.98); b.prism(oct(8.8, 2.5), -0.4, 0.5, true, 0.75); b.setCol(stone, 1.04); b.prism(oct(7.6, 2.5), 0.5, 1.2, true);
  b.setCol(stone, 1.1); b.prism(oct(1.5, 2.5), 1.2, 1.75, true, 0.7); b.prism(oct(1.1, 2.5), 1.75, 2.0, true);
  b.setCol(stone, 1.0);
  b.ring([[1.4, -0.4, 0.7], [1.4, 0.55], [0.7, 0.55, 0.8], [0.7, 1.25], [0, 1.25, 0.8], [0, PY], [-4.3, PY]], 0, PZ, 28, 28);
  // ---- optional stand-in for terrace 3 behind the wall
  if (opts.terrace) {
    b.kind = 4; b.setCol(lawn, 1);
    for (const sx of [-1, 1]) b.quad([sx * 31.2, GH + 0.25, ZW + 1.3], [sx * TX, GH + 0.25, ZW + 1.3], [sx * TX, GH + 0.25, 150], [sx * 31.2, GH + 0.25, 150], 0, 1, 0);
    b.kind = 0; b.setCol(stone, 0.9);
    b.quad([-TX, 0, 150], [TX, 0, 150], [TX, GH + 0.25, 150], [-TX, GH + 0.25, 150], 0, 0, 1);
    for (const sx of [-1, 1]) b.quad([sx * TX, 0, ZW], [sx * TX, 0, 150], [sx * TX, GH + 0.25, 150], [sx * TX, GH + 0.25, ZW], sx, 0, 0);
  }
  return b;
}

// The gallery's web of water-light drawn as lines (stone and flowers only): hcCaus's own field, at the place and pace it
// is given, with its ridges raised higher. x = thin bright lines (12th power), y = their broad lobes (3rd power).
const GAL_NET = /* glsl */`
vec2 hcNet(vec2 p, float t){
  vec2 q = p + vec2(sin(p.y * 1.3 + t * .9), cos(p.x * 1.1 - t * .7)) * .55;
  float a = sin(q.x * 2.1 + t) + sin(q.y * 2.3 - t * 1.1) + sin((q.x + q.y) * 1.4 + t * .6);
  vec2 r = p * 1.7 + vec2(cos(p.y * .9 - t * .6), sin(p.x * 1.2 + t * .8)) * .6 + 4.;
  float b = sin(r.x * 2.3 - t * .8) + sin(r.y * 1.9 + t) + sin((r.x - r.y) * 1.3 - t * .5);
  float l1 = clamp(1. - abs(a) / 3., 0., 1.), l2 = clamp(1. - abs(b) / 3., 0., 1.);
  float c1 = l1 * l1 * l1, c2 = l2 * l2 * l2;
  float s1 = c1 * c1, s2 = c2 * c2; s1 *= s1; s2 *= s2;
  return vec2(s1 + s2 * .6 + s1 * s2 * 1.5, c1 * .7 + c2 * .45);
}
`;
const STONE_COLOR = /* glsl */`
  float hKind = vAux.y; float hao = vAux.x;
  float up = abs(hn.y);
  vec2 suv = up > .6 ? hp.xz : vec2(hp.x * abs(hn.z) + hp.z * abs(hn.x), hp.y);
  // coursed ashlar on walls, slabs on floors
  vec2 bs = up > .6 ? vec2(2.4, 1.6) : vec2(2.2, 1.1);
  float hallW = step(480.3, hp.z) * step(abs(hp.x), 15.95) * step(up, .6) * step(hKind, .5);
  bs = mix(bs, vec2(3.3, 1.65), hallW * step(hp.y, 43.3));       // the gatehouse stands on bigger, older blocks below its string course
  vec2 g = suv / bs; g.x += step(1., mod(floor(g.y), 2.)) * .5;
  vec2 gi = floor(g), gf = fract(g);
  float joint = min(min(gf.x, 1. - gf.x) * bs.x, min(gf.y, 1. - gf.y) * bs.y);
  float polished = step(.5, hKind) * step(hKind, 1.5);
  float jl = smoothstep(.0, .045, joint); jl = mix(jl, 1., polished);
  float tint = hcHash(gi + 3.7);
  float mott = hcFbm(suv * .55 + hn.xz * 5.) * .6 + hcFbm(suv * 4.3) * .4;
  vec3 sc = diffuseColor.rgb * mix(.82, 1.12, mix(tint, .5, polished * .8)) * (.72 + .5 * mott);
  sc = mix(sc, sc * vec3(1.1, .96, .93), .35 + tint * .5);         // rose in the grey, warmer blocks
  sc *= mix(.5, 1., jl);
  // weather: moss creeping out of the joints wherever the stone lies open to the sky, ochre lichen in patches, rain-dark under copings
  float hOpen = step(101.4, hp.z) * step(hp.z, 480.) + step(hp.z, 83.) ;
  float mossN = hcFbm(suv * .31 + 9.);
  float moss = (1. - smoothstep(.0, .26, joint)) * smoothstep(.34, .62, mossN) * (1. - polished) * hOpen * (.55 + .45 * up);
  sc = mix(sc, vec3(.12, .2, .045) * (.7 + .7 * mott), moss * .85);
  float lich = smoothstep(.63, .72, hcFbm(suv * 1.7 + 20.)) * smoothstep(.3, .7, hcN2(suv * 9.)) * (1. - polished) * hOpen;
  sc = mix(sc, sc * vec3(1.3, 1.12, .62) + vec3(.035, .028, 0.), lich * .55);
  sc *= 1. - .22 * (1. - up) * hOpen * smoothstep(.45, .8, hcN2(vec2(suv.x * 2.3, 1.))) * smoothstep(.2, .9, hcN2(vec2(suv.x * .7, suv.y * .12)));
  if (hallW > .5) {
    // a carved string course round the hall (linked rosettes between two fillets), worn arrises on the old blocks below it,
    // a dado of upright flutes above the plinth moulding
    float by = hp.y - 44.05, bandM = 1. - smoothstep(.62, .68, abs(by));
    float ro = length(vec2((fract(suv.x / 1.3) - .5) * 1.3, by));
    float carve = smoothstep(.0, .07, abs(ro - .36)) * smoothstep(.0, .06, abs(ro - .14));
    float fil = smoothstep(.0, .05, abs(abs(by) - .55));
    sc = mix(sc, diffuseColor.rgb * 1.1 * (.45 + .55 * carve) * (.6 + .4 * fil) * (.8 + .3 * mott), bandM);
    sc *= mix(1., .8 + .2 * smoothstep(.0, .18, joint) + .16 * (tint - .5), (1. - bandM) * step(hp.y, 43.3));
    float fl = abs(fract(suv.x / .55) - .5);
    sc *= mix(1., .7 + .5 * smoothstep(.05, .3, fl), step(34.3, hp.y) * step(hp.y, 36.4) * .8);
  }
  // polished niche stone: faint veining
  float vein = smoothstep(.47, .5, hcFbm(suv * vec2(1.3, 2.9) + 11.)) * (1. - smoothstep(.5, .53, hcFbm(suv * vec2(1.3, 2.9) + 11.)));
  sc = mix(sc, sc * .78, vein * polished);
  // damp: near the water, on the gallery ledge, streaks down from the shelf
  float inG = step(abs(hp.x), 34.5) * step(${(ZS - 0.5).toFixed(1)}, hp.z) * step(hp.z, ${(ZW + 0.7).toFixed(1)});
  float streak = hcN2(vec2(suv.x * 1.7, 3.)) * hcN2(vec2(suv.x * .31, suv.y * .12 + 5.));
  hcWet = max((1. - smoothstep(.2, 1.5 + 2.5 * streak, hp.y)) * step(hp.z, ${(ZW + 0.7).toFixed(1)}), inG * (up > .6 ? .85 : .25 + .5 * streak)) * uHcWet;
  sc *= mix(1., .55, hcWet); sc = mix(sc, sc * vec3(.8, .98, .86), hcWet * .5 * hcFbm(suv * .9 + 2.));
  // a film of water sliding down the ledge
  float film = inG * step(.6, up) * step(hp.y, 1.);
  hcGloss = film * (.5 + .5 * sin(hp.z * 3.1 + hcN2(hp.xz * .8) * 6. + uHcTime * 2.2));
  // culvert arches on causeway sides
  if (hKind > 2.5 && hKind < 3.5) { float al = mod((abs(hn.x) > .5 ? hp.z : hp.x) + 300., 5.) - 2.5; float ar = length(vec2(al, hp.y + .25)); sc *= mix(.12, 1., smoothstep(1.15, 1.3, ar)); sc *= mix(1.25, 1., smoothstep(1.3, 1.36, ar) + (1. - smoothstep(1.2, 1.3, ar))); }
  // ---- terrace kinds
  if (hKind > 3.5 && hKind < 4.5) {                             // clipped lawn, mown in stripes
    float mowS = smoothstep(-.3, .3, sin(hp.x * .7));
    sc = diffuseColor.rgb * (.74 + .4 * hcFbm(hp.xz * .3)) * (.86 + .24 * mowS) * (.8 + .4 * hcN2(hp.xz * vec2(13., 2.5)));
    sc = mix(sc, sc * vec3(1.5, 1.12, .6), smoothstep(.5, .78, hcFbm(hp.xz * .07 + 11.)) * .5);      // tired autumn patches
    sc = mix(sc, vec3(dot(sc, vec3(.3, .5, .2))) * vec3(.96, 1., .9), .3) * .9;
    if (uHcGard.z > 0.) {                                       // April: new grass mown in broad light and dark bands, blades, sun-yellowed patches, daisies
      float fine = 1. - smoothstep(18., 80., length(uHcCam - hp));
      float band = smoothstep(-.3, .3, sin(hp.x * 1.05 + .5 * hcN2(vec2(hp.z * .05, 2.))));
      float blade = hcN2(hp.xz * vec2(11., 1.3)) * .55 + hcN2(hp.xz * vec2(27., 3.1) + 5.) * .45;
      vec3 grs = mix(vec3(.095, .215, .055), vec3(.19, .31, .07), band) * (1. + (blade - .5) * .7 * fine) * (.8 + .4 * hcFbm(hp.xz * .1 + 3.));
      grs = mix(grs, grs * vec3(1.3, 1.12, .55), smoothstep(.52, .8, hcFbm(hp.xz * .045 + 21.)) * .45);
      float dz = step(.972, hcHash(floor(hp.xz * 4.) + 3.)) * smoothstep(.4, .62, hcFbm(hp.xz * .12 + 4.)) * fine;
      sc = mix(sc, mix(grs, vec3(.78, .78, .66), dz * .85), uHcGard.z * .9);
    }
    sc = mix(sc, vec3(.92, .8, .84), smoothstep(.8, .86, hcN2(hp.xz * 7.3)) * smoothstep(.42, .7, hcFbm(hp.xz * .09 + 7.)) * uHcGard.z * .6);   // April: drifts of fallen blossom
  } else if (hKind > 4.5 && hKind < 5.5) {                      // carved: fish-scale relief
    vec2 q = suv / vec2(.9, .62); q.x += .5 * mod(floor(q.y), 2.);
    vec2 f = fract(q) - vec2(.5, 1.); float r = length(f * vec2(1., .9));
    sc *= mix(.55, 1., smoothstep(.0, .09, abs(r - .56))) * (.86 + .32 * smoothstep(.0, .56, r));
  } else if (hKind > 5.5 && hKind < 6.5) {                      // pierced screen
    float jl2 = hcJali(suv);
    if (jl2 > 0.) discard;
    sc *= .8 + .35 * smoothstep(-.12, 0., jl2);
  } else if (hKind > 6.5 && hKind < 7.5) {                      // plain plaster, domes
    sc = diffuseColor.rgb * (.82 + .3 * hcFbm(suv * 1.3));
    float rib = abs(fract(atan(hn.z, hn.x + 1e-4) * 1.9099) - .5);                 // the kiosk domes: ribs of turquoise and cobalt glaze
    vec3 glaze = mix(vec3(.03, .36, .4), vec3(.02, .11, .38), smoothstep(.3, .34, rib)) * (.75 + .5 * mott);
    sc = mix(sc, glaze, uHcGard.w * .9);
  } else if (hKind > 7.5 && hKind < 8.5) {                      // garden wall with creeper spilling over its top
    float topY = (hp.z > 100.6 ? hcGround(hp.z) : 0.) + 22.;
    float dn = topY - hp.y;
    if (uHcGard.z > 0.) {                                       // April: red sandstone banded with white marble, a row of red diamonds in the upper course
      vec3 rose = vec3(.5, .13, .085) * (.66 + .6 * mott) * mix(.8, 1.14, tint);
      float b1 = smoothstep(1.0, 1.08, dn) - smoothstep(2.3, 2.38, dn), b2 = smoothstep(20.3, 20.36, dn) - smoothstep(20.85, 20.9, dn);
      float dia = abs(fract(suv.x / 1.3) - .5) * 2. + abs((dn - 1.69) / .5);
      vec3 marble = vec3(.74, .7, .62) * (.84 + .3 * mott);
      vec3 rs = mix(rose, mix(marble, rose * 1.1, (1. - smoothstep(.72, .8, dia)) * b1), clamp(b1 + b2, 0., 1.));
      sc = mix(sc, rs * mix(.55, 1., jl) * (1. - .5 * moss), uHcGard.z);
    }
    float hn3 = hcN2(vec2(suv.x * 1.3, 7.));
    float hang = .5 + 4.6 * hcFbm(vec2(suv.x * .16, 2.)) * hcFbm(vec2(suv.x * .05, 9.)) * 1.6 + 4. * hn3 * hn3 * hn3;
    float cm = smoothstep(hang + .5, hang - .5, dn + (hcN2(suv * 2.3) - .5) * 1.6);
    float lf = hcN2(suv * 5.1 + vec2(sin(uHcTime * 1.3 + suv.x) * .08, 0.));
    cm *= smoothstep(.22, .4, hcN2(suv * 2.9 + 4.) + (1. - smoothstep(0., hang * .6, dn)) * .5);
    vec3 cc = mix(mix(vec3(.2, .012, .02), vec3(.56, .06, .035), lf), mix(vec3(.1, .26, .07), vec3(.3, .5, .12), lf), uHcGard.z);
    sc = mix(sc, cc * (.6 + .8 * lf), cm * .95);
  } else if (hKind > 8.5 && hKind < 9.5) {                      // flower bed: soil and massed heads in the block's colour
    // dark earth, a ground of leaves, and the heads of the plants that stand lower than the tall ones: round dots of the
    // block's colour, each its own shade
    float hd = hcN2(hp.xz * 2.6) * .6 + hcN2(hp.xz * 6.1 + 4.) * .4;
    vec3 earth = vec3(.07, .052, .038) * (.7 + .7 * hd);
    vec3 fol = mix(vec3(.05, .13, .04), vec3(.13, .27, .07), hcN2(hp.xz * 4.7 + 9.)) * (1. + .25 * uHcGard.z);
    vec2 hq = hp.xz * 2.3; vec2 hi2 = floor(hq); vec2 hf = fract(hq) - .5 - (vec2(hcHash(hi2 + 1.), hcHash(hi2 + 7.)) - .5) * .5;
    float head = (1. - smoothstep(.15, .27, length(hf))) * step(.42 - .12 * uHcGard.z, hcHash(hi2 + 3.));
    sc = mix(earth, fol, smoothstep(.26, .5, hd + .12));
    sc = mix(sc, diffuseColor.rgb * (.7 + .5 * hcHash(hi2 + 5.)), head * .9);
  } else if (hKind > 9.5 && hKind < 10.5) {                     // honeycomb vault
    vec2 q = vec2(hp.z, hp.x * 1.25) / 1.7; q.x += .5 * mod(floor(q.y), 2.); vec2 f = fract(q) - .5;
    float r = max(abs(f.x), abs(f.y) * .9 + abs(f.x) * .5);
    sc = diffuseColor.rgb * (.5 + .75 * smoothstep(.5, .1, r) * (.6 + .4 * smoothstep(-.5, .5, f.y))) * (.85 + .3 * hcHash(floor(q)));
  } else if (hKind > 10.5 && hKind < 11.5) {                    // props: the vertex colour as painted
    sc = diffuseColor.rgb * (.86 + .26 * hcFbm(hp.xz * 3. + hp.y * 2.));
  } else if (hKind > 12.5) {                                    // a raked heap of leaves: small overlapping blades, dark gaps between them
    vec3 lq = hp * vec3(5.2, 2.2, 5.2);
    float l1 = hcN2(lq.xz + lq.y * .7), l2 = hcN2(lq.xz * 2.3 + lq.y * 1.9 + 5.), l3 = hcN2(hp.xz * 1.7 + hp.y * 2.3 + 9.);
    vec3 lc2 = mix(uHcTree * .75, uHcAccent * .95, smoothstep(.38, .72, l3 * .6 + l2 * .4));
    lc2 = mix(lc2, uHcTree * vec3(.45, .3, .3), smoothstep(.62, .8, l1 * .5 + l3 * .5));
    sc = lc2 * (.5 + .85 * l1) * mix(.22, 1., smoothstep(.2, .42, l2));
  } else if (hKind > 11.5) {                                    // the carpet
    vec2 hf = vec2(vAux.z, vAux.w * .5); vec2 c = vec2(abs(vHcUv.x), abs(vHcUv.y - hf.y)); vec2 e = hf - c; float de = min(e.x, e.y);
    vec3 red = vec3(.42, .05, .04), blue = vec3(.04, .09, .3), cream = vec3(.62, .52, .36), gold = vec3(.6, .33, .06);
    float med = length(c / hf * vec2(1., .8));
    vec3 cp = mix(red, blue, 1. - smoothstep(.36, .38, med + .05 * sin(atan(c.y, c.x + 1e-3) * 16.)));
    cp = mix(cp, cream, 1. - smoothstep(.12, .14, med));
    vec2 gq = fract(vHcUv / 1.1) - .5; float gul = abs(gq.x) + abs(gq.y);
    cp = mix(cp, gold, (1. - smoothstep(.16, .2, gul)) * smoothstep(.4, .42, med) * step(1.6, de));
    cp = mix(cp, blue, step(de, 1.5)); cp = mix(cp, cream, step(de, 1.25) * step(.95, de) + step(de, .35) * step(.2, de));
    float zz = abs(fract((vHcUv.x + vHcUv.y) / .5) - .5); cp = mix(cp, gold, step(de, .95) * step(.45, de) * step(zz, .2));
    sc = cp * (.8 + .3 * hcN2(vHcUv * 30.));
  }
  if (hKind > 10.5) { hcWet = 0.; hcGloss = 0.; }
  // snow on what faces up
  float snow = uHcSnow * smoothstep(.45, .8, hn.y + .25 * hcFbm(suv * 1.3)) * (1. - film) * step(.2, hp.y) * (1. - step(10.5, hKind)) * (1. - step(480.3, hp.z) * step(abs(hp.x), 15.6));
  sc = mix(sc, vec3(.82, .86, .92), snow);
  if (hp.z > 101.4 && hp.z < 480. && hn.y > .7 && (hKind < .5 || (hKind > 3.5 && hKind < 4.5))) {   // fallen leaves: a carpet under each tree, drifts, thick along the kerbs
    vec2 tq = vec2(abs(hp.x) - 34., mod(hp.z - 18. + 14., 28.) - 14.);
    float amt = clamp((1. - smoothstep(5., 19., length(tq))) * .85 + smoothstep(.33, .68, hcFbm(hp.xz * .11 + 3.)) * .66 + (1. - smoothstep(13.3, 16.5, abs(hp.x))) * .55, 0., 1.) * uHcGard.y;
    float fl = hcN2(hp.xz * 3.6) * .5 + hcN2(hp.xz * 8.3 + 5.) * .5;
    float lm = smoothstep(1. - amt * .8, 1.04 - amt * .7, fl + amt * .25);
    vec3 lc = mix(uHcTree * .8, uHcAccent, smoothstep(.3, .8, hcN2(hp.xz * 1.9 + 9.)));
    sc = mix(sc, lc * (.7 + .5 * hcN2(hp.xz * 11.)), lm * .92);
  }
  diffuseColor.rgb = sc * mix(.3, 1., hao);
`;
const STONE_ROUGH = /* glsl */`roughnessFactor = mix(roughnessFactor, .22, clamp(hcWet * .8 + hcGloss * .4, 0., 1.)); roughnessFactor = mix(roughnessFactor, .45, step(.5, vAux.y) * step(vAux.y, 1.5));`;
const STONE_LIGHT = /* glsl */`
  vec3 gal = hcGal(hp);
  // the low sun rakes the open ground of the terraces: warm pools between slate-blue shadows of trunks and crowns
  float gdn = step(101.4, hp.z) * step(hp.z, 480.) * smoothstep(.4, .8, hn.y);
  reflectedLight.directDiffuse *= gal.x * (1. + 1.5 * gdn * uHcGard.x); reflectedLight.directSpecular *= gal.x;
  float hao2 = mix(.25, 1., vAux.x);
  if (hKind > 10.5 && (hKind < 11.5 || hKind > 12.5)) reflectedLight.indirectDiffuse *= 1. + 1.5 * step(101.4, hp.z);
  // behind the water the shelf's shadow is slate-blue, never black: the same cool fill on ledge, wall and soffit
  // whichever way they face (the night's lamps keep their own soft fill)
  float dk = gal.y * (1. - .6 * uHcLamp);
  vec3 slate = (uHcSkyHor * vec3(.2, .28, .37) + uHcSkyTop * .17) * (1.06 + 1.05 * max(-hn.y, 0.) + .55 * max(hn.y, 0.)) * mix(vec3(1.), vec3(.42, .47, .58), polished);   // the pale niche stone sits deeper, so the bands and the pots carry the wall
  reflectedLight.indirectDiffuse = mix(reflectedLight.indirectDiffuse, mix(diffuseColor.rgb, vec3(dot(diffuseColor.rgb, vec3(.3, .5, .2))), .45) * slate, dk) * mix(hao2, mix(.7, 1., vAux.x), dk);
  reflectedLight.indirectDiffuse *= mix(vec3(1.), vec3(.82, .98, 1.36) * (1. + .3 * uHcGard.z), gdn * (1. - gal.x) * uHcGard.x);
  if (hp.z > 480.3 && abs(hp.x) < 15.6) {
    // the gatehouse hall: no black anywhere. Sky from both screens and the arch fills it, the sunlit floor throws warm light up
    // the walls and into the vault, and the screen on the shaded side lays a second, cooler lattice the other way across the floor
    float toArch = smoothstep(546., 484., hp.z);
    reflectedLight.indirectDiffuse *= (.95 + .55 * toArch) * (1. - .2 * step(.6, hn.y));
    reflectedLight.directDiffuse *= 1.8 + 1.5 * step(.6, hn.y); // the lattice the sun lays over the pale floor: warm, and clear of the cool fill
    float sxs = uHcSun.x < 0. ? 1. : -1.; float d2 = 15. - hp.x * sxs;
    float ys2 = hp.y + .62 * d2, zs2 = hp.z + .22 * d2;
    float top2 = 47.6 - 4.4 * min(abs(zs2 - 504.) / 8., 1.);
    float soft2 = smoothstep(8., 42., d2);
    float scr2 = step(496., zs2) * step(zs2, 512.) * step(36., ys2) * step(ys2, top2) * mix(step(0., hcJali(vec2(zs2, ys2))), .35, soft2);
    hcAdd += diffuseColor.rgb * (uHcSkyHor * .5 + uHcSkyTop * .25) * scr2 * .9 * step(.6, hn.y) * step(hp.y, 32.75);
    float bounce = (1. - smoothstep(32., 60., hp.y)) * (.35 + .65 * toArch) * (1. - step(.6, hn.y));
    hcAdd += diffuseColor.rgb * uHcSunCol * vec3(.5, .4, .28) * (.1 + .22 * bounce);
  }
  // water-light: the bands the sun throws through the sheet, and a slow bounced web on walls and soffit
  float cz = hcCaus(vec2(hp.x * .4 + hp.z * .2, hp.y * .3 + hp.z * .4 + uHcTime * .45), uHcTime * .7);
  hcAdd += diffuseColor.rgb * uHcCaus * vec3(.9, 1.18, 1.14) * (cz * .07 + gal.z * 1.3) * gal.y * mix(.5, 1., vAux.x);   // green-white, on every face alike
  float cs = hcCaus(vec2(hp.x * 1.05 + hp.z * .45, hp.y * 1.1 + hp.z * 1.15 + uHcTime * .5), uHcTime * .9);          // the same web drawn finer, thrown up off the moving water
  hcAdd += diffuseColor.rgb * uHcCaus * vec3(.9, 1.18, 1.14) * cs * (.24 * max(step(hn.y, -.5), smoothstep(10.5, 12., hp.y)) + .1 * step(hn.z, -.5)) * gal.y * mix(.5, 1., vAux.x);   // its bright lines crawl on the soffit and the niche wall
  // and the same web as a net of thin bright lines, lying on the soft one and moving with it: square on to the faces
  // that look at the sheet, glancing on soffit, ledge and ribs, lost in the depth of a recess, gone toward the open ends
  vec2 nt = hcNet(vec2(hp.x * 1.05 + hp.z * .45, hp.y * 1.1 + hp.z * 1.15 + uHcTime * .5), uHcTime * .9);
  hcAdd += diffuseColor.rgb * uHcCaus * vec3(.9, 1.18, 1.14) * nt.x * .85 * (.45 + .55 * max(-hn.z, 0.) + .15 * abs(hn.y)) * vAux.x * vAux.x * (.7 + .6 * gal.z) * gal.y;
  if (hp.z > 480.3 && abs(hp.x) < 15.6) hcAdd += diffuseColor.rgb * uHcSkyHor * (cz * .16 + .015) * smoothstep(32.5, 44., hp.y) * hao2;   // the channel's light wavering on the hall's walls and vault
  // wet stone mirrors what is bright: the sky outside; in the gallery the sheet and the open mouths
  float fr = 1. - max(dot(hn, hv), 0.); fr *= fr;
  vec3 wr = reflect(-hv, hn);
  vec3 wenv = hcEnv(wr);
  vec3 genv = (uHcSkyHor * .5 + uHcSunCol * .2) * (smoothstep(.8, .985, abs(wr.x)) * (1. - smoothstep(.06, .3, wr.y)) + .55 * smoothstep(.2, .75, -wr.z) * (.5 + .5 * hcN2(vec2(hp.x * 1.7, wr.y * 9. + uHcTime * 2.))));
  hcAdd += mix(wenv, genv, step(.001, gal.y)) * (hcWet * .1 + hcGloss * .12) * (.15 + .85 * fr) * mix(1., 1.6, gal.y);
  // night: an oil lamp in every niche
  if (uHcLamp > 0. && vAux.y > .5 && vAux.y < 1.5) {
    vec2 cell = vec2(floor(hp.x) + .5, floor((hp.y - .9) / 2.6));
    vec3 lp = vec3(cell.x, .9 + cell.y * 2.6 + .62, ${(ZW + 0.26).toFixed(2)});
    float d2 = dot(hp - lp, hp - lp);
    float fl = .75 + .25 * sin(uHcTime * 9. + cell.x * 7.3 + cell.y * 3.1) * sin(uHcTime * 5.3 + cell.x * 1.7);
    hcAdd += diffuseColor.rgb * vec3(1., .55, .2) * uHcLamp * fl * 1.5 / (1. + d2 * 7.);
  }
`;

// ---------------------------------------------------------------- the black pavilion
// kinds (aux.y): 0 polished black (faces with panel uv get a white-and-marigold inlay border), 1 checker floor,
// 2 coffered ceiling panel, 5 roof / eave top
const YT = 21.6;
async function buildPavilion(pal, rng, opts, pause) {
  const b = makeB(), g = makeB();
  const blk = new THREE.Color(pal[4]), gold = new THREE.Color(pal[1]).lerp(new THREE.Color('#8a5a12'), 0.35);
  const sides = [[0, 1, 1, 0], [1, 0, 0, 1], [0, -1, 1, 0], [-1, 0, 0, 1]];
  const cham = (x0, z0, x1, z1, c) => [[x0 + c, z0], [x1 - c, z0], [x1, z0 + c], [x1, z1 - c], [x1 - c, z1], [x0 + c, z1], [x0, z1 - c], [x0, z0 + c]];
  const pier = (x0, z0, x1, z1, ySpring) => {
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, hx = (x1 - x0) / 2, hz = (z1 - z0) / 2;
    b.setCol(blk, 1); b.prism(cham(x0, z0, x1, z1, 0.32), PY, YT, false, 0.8);
    b.setCol(blk, 1.15);
    b.ring([[0.4, PY, 0.7], [0.4, PY + 0.85], [0.18, PY + 1.15], [0, PY + 1.15]], cx, cz, hx, hz);
    b.ring([[0, ySpring - 0.75], [0.22, ySpring - 0.6], [0.22, ySpring - 0.15], [0.34, ySpring], [0.34, ySpring + 0.22], [0, ySpring + 0.4]], cx, cz, hx, hz);
  };
  for (let k = 0; k < 4; k++) {
    const [nx, nz, tx, tz] = sides[k];
    const T = (s, y, d) => [nx * (PH - 0.5 - d) + tx * s, y, PZ + nz * (PH - 0.5 - d) + tz * s], F = [nx, 0, nz];
    const sbox = (s0, y0, d0, s1, y1, d1, skip) => { const a = T(s0, y0, d0), c = T(s1, y1, d1); b.box(Math.min(a[0], c[0]), y0, Math.min(a[2], c[2]), Math.max(a[0], c[0]), y1, Math.max(a[2], c[2]), skip); };
    b.kind = 0; b.setCol(blk, 1);
    archPanel(b, T, F, { s0: -8, s1: 8, y0: PY, y1: YT, cx: 0, w: 15.6, yBase: PY, ySpring: PY + 11.5, yApex: PY + 19, foils: opts.pavFoils, per: 4, depth: 3, through: true, cusp: 0.07 });
    for (const sg of [-1, 1]) {
      const s0 = sg > 0 ? 11 : -20;
      archPanel(b, T, F, { s0, s1: s0 + 9, y0: PY, y1: YT, cx: sg * 15.5, w: 7.4, yBase: PY, ySpring: PY + 9.5, yApex: PY + 14.5, foils: opts.pavFoils - 2, per: 4, depth: 3, through: true, cusp: 0.08 });
      // raised frame over the side arch, inside and out
      b.setCol(blk, 1.2);
      for (const [d0, d1] of [[-0.14, 0], [3, 3.14]]) {
        sbox(s0 + 1, 17.6, d0, s0 + 8, 17.85, d1, ''); sbox(s0 + 1, 20.35, d0, s0 + 8, 20.6, d1, '');
        sbox(s0 + 1, 17.85, d0, s0 + 1.25, 20.35, d1, 'yY'); sbox(s0 + 7.75, 17.85, d0, s0 + 8, 20.35, d1, 'yY');
      }
      b.setCol(blk, 1);
      // inner pier between the side bay and the central arch
      const a = T(sg > 0 ? 8 : -11, 0, -0.5), c = T(sg > 0 ? 11 : -8, 0, 3.5);
      pier(Math.min(a[0], c[0]), Math.min(a[2], c[2]), Math.max(a[0], c[0]), Math.max(a[2], c[2]), PY + 11.5);
    }
    // corner pier
    const cs = [[1, 1], [1, -1], [-1, -1], [-1, 1]][k];
    pier(cs[0] * 22 - 2, PZ + cs[1] * 22 - 2, cs[0] * 22 + 2, PZ + cs[1] * 22 + 2, PY + 11.5);
    // brackets under the eave
    b.setCol(blk, 1.1);
    for (let i = 0; i < 20; i++) {
      const s = -22.8 + i * 2.4;
      sbox(s - 0.28, 21.25, -2.6, s + 0.28, 21.95, -0.5, 'Y'); sbox(s - 0.22, 20.6, -1.7, s + 0.22, 21.25, -0.5, 'Y'); sbox(s - 0.16, 20.1, -1.0, s + 0.16, 20.6, -0.5, 'Y');
    }
    await pause();
  }
  // entablature, eave, parapet, roof
  b.kind = 0; b.setCol(blk, 1.1);
  b.ring([[0, YT - 0.1], [0.4, YT + 0.2], [0.4, YT + 0.75, 0.7], [3.9, YT + 0.35, 0.8], [3.9, YT + 0.6]], 0, PZ, PH, PH);
  b.kind = 5; b.setCol(blk, 1.0);
  b.ring([[3.9, YT + 0.6], [0.2, YT + 1.35]], 0, PZ, PH, PH);
  b.kind = 0; b.setCol(blk, 1.1);
  b.ring([[0.2, YT + 1.35], [0.2, YT + 2.0], [-0.6, YT + 2.0], [-0.6, YT + 1.6]], 0, PZ, PH, PH);
  b.kind = 5; b.setCol(blk, 0.95);
  b.ring([[-0.6, YT + 1.6], [-10, YT + 3.0], [-18, YT + 4.4], [-23.1, YT + 5.5], [-24, YT + 5.5]], 0, PZ, PH, PH);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) {       // hip ridges
    const p = [[23.4, YT + 1.6], [14, YT + 3.0], [6, YT + 4.4], [0.9, YT + 5.5]];
    for (let i = 0; i < 3; i++) {
      const a = p[i], c = p[i + 1], w = 0.32;
      const A = [sx * a[0], a[1] + 0.3, PZ + sz * a[0]], C = [sx * c[0], c[1] + 0.3, PZ + sz * c[0]];
      b.quad([A[0] - sx * w, a[1], A[2] + sz * w], [C[0] - sx * w, c[1], C[2] + sz * w], C, A, -sx, 1, sz);
      b.quad([A[0] + sx * w, a[1], A[2] - sz * w], [C[0] + sx * w, c[1], C[2] - sz * w], C, A, sx, 1, -sz);
    }
  }
  await pause();
  // coffered ceiling: 6 x 6
  const CO = 41 / 6;
  b.kind = 2; b.setCol(blk, 1.25);
  b.quad([-20.5, YT + 0.3, PZ - 20.5], [20.5, YT + 0.3, PZ - 20.5], [20.5, YT + 0.3, PZ + 20.5], [-20.5, YT + 0.3, PZ + 20.5], 0, -1, 0);
  b.kind = 0; b.setCol(blk, 1.1);
  for (let i = 0; i <= 6; i++) {
    const c = -20.5 + i * CO, w = i === 0 || i === 6 ? 0.9 : 0.45;
    b.box(c - w, YT - 0.6, PZ - 20.5, c + w, YT + 0.3, PZ + 20.5, 'YzZ'); b.box(-20.5, YT - 0.45, PZ + c - w, 20.5, YT + 0.3, PZ + c + w, 'YxX');
  }
  // four inner columns under beam crossings
  b.setCol(blk, 1.05);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) {
    const cx = sx * CO * 2, cz = PZ + sz * CO * 2;
    b.lathe([[1.55, PY, 0.7], [1.55, PY + 0.5], [1.25, PY + 0.95], [1.05, PY + 1.5], [0.92, PY + 12], [0.98, PY + 16.6], [1.3, PY + 17.2], [1.2, PY + 17.6], [1.75, PY + 18.5], [1.75, YT - 0.6]], cx, 0, cz, 8, Math.PI / 8);
  }
  // floor
  b.kind = 1; b.setCol(blk, 1);
  b.quad([-23.8, PY + 0.02, PZ - 23.8], [23.8, PY + 0.02, PZ - 23.8], [23.8, PY + 0.02, PZ + 23.8], [-23.8, PY + 0.02, PZ + 23.8], 0, 1, 0);
  await pause();
  // gilt finial and four corner finials (metal builder)
  g.kind = 1; g.setCol(gold, 1);
  const fin = [[0.95, 0], [1.15, 0.25], [0.6, 0.5], [0.38, 0.75], [0.7, 1.0], [1.0, 1.3], [0.95, 1.6], [0.5, 1.9], [0.25, 2.1], [0.55, 2.4], [0.5, 2.6], [0.14, 2.9], [0.07, 3.6], [0.0, 3.9]];
  const fs = opts.finial;
  g.lathe(fin.map((p) => [p[0] * fs, p[1] * fs]), 0, YT + 5.5, PZ, 10);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) g.lathe(fin.map((p) => [p[0] * 0.42, p[1] * 0.42]), sx * 23.8, YT + 2.0, PZ + sz * 23.8, 6);
  return { b, g };
}

const MARBLE_COLOR = /* glsl */`
  float hKind = vAux.y; vec3 mc = diffuseColor.rgb; float inlay = 0.; float acc = 0.;
  vec2 pq = hp.xz - vec2(0., ${PZ.toFixed(1)});
  float vn = hcFbm(pq * .35 + hp.y * .3 + hcFbm(pq * 1.1 + hp.y) * 1.6);
  float vein = smoothstep(.485, .5, vn) * (1. - smoothstep(.5, .515, vn));
  mc += vec3(.2, .22, .25) * vein * .5;
  mc += vec3(.011, .016, .027) * smoothstep(.3, .75, hcFbm(pq * .16 + hp.y * .21 + 9.));     // clouds of slate in the black
  if (hKind > .5 && hKind < 1.5) {                              // floor: black and white checker inside a border
    vec2 q = pq / 2.4; vec2 qf = fract(q);
    float chk = mod(floor(q.x) + floor(q.y), 2.);
    float m = max(abs(pq.x), abs(pq.y));
    float field = 1. - step(19.2, m);
    float gr = min(min(qf.x, 1. - qf.x), min(qf.y, 1. - qf.y));
    vec3 white = vec3(.55, .56, .55) * (.8 + .3 * hcFbm(pq * .8)) - vein * .2;
    mc = mix(mc, white, chk * field);
    mc *= mix(1., .6, (1. - smoothstep(.0, .015, gr)) * field);
    inlay = (smoothstep(19.2, 19.3, m) - smoothstep(19.6, 19.7, m)) + (smoothstep(22.6, 22.7, m) - smoothstep(22.85, 22.95, m));
    acc = smoothstep(20.5, 20.6, m) - smoothstep(20.9, 21., m);
  } else if (hKind > 1.5 && hKind < 2.5) {                      // coffer panel: border and medallion
    vec2 c = fract((pq + 20.5) / ${(41 / 6).toFixed(4)}) - .5; float m = max(abs(c.x), abs(c.y)); float r = length(c);
    inlay = (smoothstep(.33, .34, m) - smoothstep(.36, .37, m)) + (smoothstep(.19, .2, r) - smoothstep(.215, .225, r));
    acc = (1. - smoothstep(.05, .06, r)) + (smoothstep(.28, .285, m) - smoothstep(.295, .3, m));
  } else if (hKind > 4.5) {                                    // roof: standing seams, weathered
    float sc = abs(hn.x) > abs(hn.z) ? hp.z : hp.x; float sf = abs(fract(sc / 1.6) - .5);
    mc *= (.75 + .5 * hcFbm(vec2(sc * .7, hp.y * 2.))) * mix(1.6, 1., smoothstep(.0, .06, sf));
    mc = mix(mc, vec3(.82, .86, .92), uHcSnow * smoothstep(.2, .6, hn.y + .3 * hcFbm(hp.xz * .6)));
  } else if (vAux.z > .9 && vAux.w > 2.5) {                    // pier and wall faces: inlay border
    float dE = min(vAux.z - abs(vHcUv.x), min(vHcUv.y, vAux.w - vHcUv.y));
    inlay = smoothstep(.36, .38, dE) - smoothstep(.43, .45, dE);
    acc = (smoothstep(.56, .57, dE) - smoothstep(.6, .61, dE)) * step(1.3, vAux.z);
    float dot1 = 1. - smoothstep(.1, .13, length(vec2(abs(vHcUv.x) - (vAux.z - .9), mod(vHcUv.y, 1.5) - .75)));
    acc += dot1 * step(1.3, vAux.z) * step(.9, vHcUv.y) * step(vHcUv.y, vAux.w - .9);
  }
  mc = mix(mc, vec3(.56, .57, .56), clamp(inlay, 0., 1.));
  mc = mix(mc, uHcAccent, clamp(acc, 0., 1.));
  diffuseColor.rgb = mc * mix(.35, 1., vAux.x);
`;
const MARBLE_ROUGH = /* glsl */`roughnessFactor = vAux.y > 4.5 ? .55 : (vAux.y > .5 && vAux.y < 1.5 ? .1 : .2);`;
const MARBLE_LIGHT = /* glsl */`
  vec2 pq2 = hp.xz - vec2(0., ${PZ.toFixed(1)}); float pm = max(abs(pq2.x), abs(pq2.y));
  float indoor = (1. - smoothstep(20.4, 23.6, pm)) * step(hp.y, ${(YT + 0.4).toFixed(1)});
  float fr = 1. - max(dot(hn, hv), 0.); float fr2 = fr * fr; float fres = .13 + .87 * fr2 * fr2 * fr;
  float gloss = vAux.y > 4.5 ? .25 : 1.;
  vec3 rr = reflect(-hv, hn);
  // indoors the mirror shows the bright arches round a dark hall, outdoors the sky and the trees
  vec3 env = hcEnv(rr) * mix(1., .42 + .75 * smoothstep(.55, .95, max(abs(rr.x), abs(rr.z))) * step(rr.y, .45), indoor);
  env = mix(env, vec3(dot(env, vec3(.3, .5, .2))) * vec3(.55, .78, 1.3), .8);
  hcAdd += env * fres * gloss * mix(.4, 1., vAux.x);
  reflectedLight.directSpecular *= .3;
  // water-light crawling over the ceiling and the upper piers
  float up2 = smoothstep(9., 20., hp.y) * indoor + step(1.5, vAux.y) * step(vAux.y, 2.5);
  float cz = hcCaus(vec2(hp.x, hp.z) * .3 + hp.y * .12, uHcTime * .7);
  hcAdd += uHcCaus * (diffuseColor.rgb + .05) * cz * up2 * (.5 + .8 * smoothstep(4., 21., pm)) * .9;
  reflectedLight.indirectDiffuse *= mix(.3, 1., vAux.x) * mix(1., 1.5, indoor);
  hcAdd += (uHcSkyHor * .014 + uHcSkyTop * .03) * mix(.75, 1., indoor) * mix(.4, 1., vAux.x);       // black marble holding a cobalt sheen, never a hole in the picture
  hcAdd += uHcCaus * (diffuseColor.rgb + .035) * cz * (1. - indoor) * (1. - smoothstep(3., 16., hp.y)) * step(hn.y, .5) * .4;   // the tank's light crawling up the outer faces
  reflectedLight.directDiffuse *= mix(1., .55, indoor * smoothstep(21., 12., pm));
`;

// ---------------------------------------------------------------- brass pots, gilt, bronze buds; niche flowers / lamps
// metal kinds (aux.y): 0 brass pot, 1 gilt, 2 dark bronze
function buildPotGeo(pal) {
  const b = makeB(), brass = new THREE.Color(pal[1]).lerp(new THREE.Color('#7a5216'), 0.42);
  b.kind = 0; b.setCol(brass, 1);
  b.lathe([[0.17, 0, 0.5], [0.23, 0.04, 0.7], [0.3, 0.2], [0.31, 0.34], [0.21, 0.53, 0.85], [0.28, 0.64], [0.24, 0.66, 0.5]], 0, 0, 0, 8);
  return b.geometry();
}
function buildBudGeo() {
  const b = makeB(); b.kind = 2; b.setCol(new THREE.Color('#a8824a'), 1);
  b.lathe([[0.13, -0.4], [0.13, 0.12], [0.3, 0.22], [0.44, 0.45], [0.38, 0.72], [0.17, 0.98], [0.08, 1.05]], 0, 0, 0, 6);
  return b.geometry();
}
// aux.y: 0 flower heads (instance colour), 1 leaves, 2 flame, 3 clay
function buildFlowerGeo(look) {
  const b = makeB();
  if (look === 'night') {
    b.kind = 3; b.setCol(new THREE.Color('#8a4a2a'), 1);
    b.lathe([[0.1, 0], [0.2, 0.05], [0.24, 0.12], [0.2, 0.13], [0.0, 0.1]], 0, 0, 0, 7);
    b.kind = 2; b.setCol(new THREE.Color('#ffffff'), 1);
    b.lathe([[0.0, 0.1], [0.07, 0.18], [0.085, 0.27], [0.05, 0.4], [0.0, 0.55]], 0.12, 0, 0, 6);
    return b.geometry();
  }
  b.kind = 1; b.setCol(new THREE.Color('#2f5a22'), 1);
  b.lathe([[0.2, 0.56, 0.5], [0.4, 0.63, 0.8], [0.42, 0.74], [0.27, 0.86], [0.0, 0.9]], 0, 0, 0, 6);
  b.kind = 0; b.setCol(new THREE.Color('#ffffff'), 1);
  for (const [x, y, z, s] of [[0.25, 0.76, 0.13, 1.0], [-0.22, 0.78, 0.17, 0.95], [0.02, 0.8, 0.3, 0.9], [0.06, 0.85, -0.2, 0.95], [0.0, 0.93, 0.03, 1.12]])
    b.lathe([[0.06 * s, 0, 0.55], [0.16 * s, 0.08 * s, 0.9], [0.09 * s, 0.2 * s], [0.0, 0.215 * s]], x, y, z, 5, x * 9 + z * 5);
  return b.geometry();
}

const METAL_COLOR = /* glsl */`
  float pat = hcFbm(hp.xy * 9. + hp.z * 5.);
  diffuseColor.rgb *= (.7 + .5 * pat) * mix(.45, 1., vAux.x);
  if (vAux.y > 1.5) diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.1, .22, .17), smoothstep(.45, .7, pat) * .6);   // verdigris on bronze
`;
const METAL_LIGHT = /* glsl */`
  vec3 gal = hcGal(hp);
  reflectedLight.directDiffuse *= gal.x; reflectedLight.directSpecular *= gal.x;
  reflectedLight.indirectDiffuse *= mix(vec3(1.), vec3(.5, .62, .9), gal.y * (1. - .6 * uHcLamp));
  vec3 rr = reflect(-hv, hn);
  float inG = step(.001, gal.y);
  // in the gallery brass mirrors the bright sheet as a hard stripe that flares when a band of water-light crosses it; outside, the sky and the trees
  float stripe = smoothstep(.12, .7, -rr.z) * (1. - smoothstep(.25, .8, abs(rr.y))) * (.4 + .6 * hcCaus(vec2(hp.x * .9 + rr.x * 3., hp.y * .4 + rr.y * 4. + uHcTime * 1.3), uHcTime));
  vec3 warm = mix(uHcCaus, vec3(1., .88, .62) * dot(uHcCaus, vec3(.34)), .6);
  vec3 env = mix(hcEnv(rr), (uHcCaus * .07 + warm * (stripe * (.3 + 2.5 * gal.z) + gal.z * .28)) * (uHcSunCol.g * .5 + .2), inG);
  hcAdd += env * mix(diffuseColor.rgb, mix(diffuseColor.rgb, vec3(1., .74, .34) * (.7 + .5 * pat), .55), inG) * 1.3 * mix(.5, 1., vAux.x);
  if (vAux.y > 1.5) hcAdd += diffuseColor.rgb * (uHcSunCol * (.12 + .3 * max(dot(hn, uHcSun), 0.)) + uHcSkyHor * .1) * (1. - inG);   // wet bronze in the open tank: never a black dot under its plume
`;
const FLOWER_VPARS = /* glsl */`float hcVH(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }`;
const FLOWER_VERT = /* glsl */`
  #ifdef USE_INSTANCING
    float fph = instanceMatrix[3].x * 2.7 + instanceMatrix[3].y * 1.3;
  #else
    float fph = 0.;
  #endif
  if (aux.y < 1.5) {
    float lump = hcVH(floor(position * 40.) + 3.) - .5;
    transformed += normal * lump * .03 * step(.7, position.y);
    float k = smoothstep(.55, 1.2, position.y);
    transformed.x += sin(uHcTime * 1.9 + fph) * .035 * k; transformed.z += sin(uHcTime * 1.3 + fph * 1.7) * .03 * k;
  } else if (aux.y < 2.5) {
    float k = smoothstep(.12, .55, position.y);
    transformed.x += (sin(uHcTime * 11. + fph * 5.) * .02 + sin(uHcTime * 3.1 + fph) * .035) * k;
    transformed.y *= 1. + .12 * sin(uHcTime * 7.3 + fph * 3.) * k;
  }`;
const FLOWER_COLOR = /* glsl */`
  vec3 fc = diffuseColor.rgb; float fk = vAux.y;
  vec3 leaf = uHcLeaf * (.6 + .7 * hcN2(hp.xy * 23.));
  if (fk < .5) {
    float ruff = hcN2(hp.xy * 31. + hp.z * 19.) * .6 + hcN2(hp.xz * 57. + hp.y * 23. + 3.) * .4;
    fc *= (.66 + .58 * ruff) * (.82 + .3 * smoothstep(-.3, .9, hn.y));
    fc = mix(fc, fc * vec3(1.1, .72, .45), smoothstep(.3, .1, ruff) * .6);
    fc = mix(fc, vec3(.85, .88, .93), uHcSnow * .5 * smoothstep(.4, .9, hn.y) * step(hp.z, ${(ZW + 0.12).toFixed(2)}));
  } else if (fk < 1.5) fc = leaf;
  else if (fk < 2.5) fc = vec3(0.);
  diffuseColor.rgb = fc * mix(.45, 1., vAux.x);
`;
const FLOWER_LIGHT = /* glsl */`
  vec3 gal = hcGal(hp);
  reflectedLight.directDiffuse *= gal.x * 1.15; reflectedLight.directSpecular *= gal.x * .3;
  float fdk = gal.y * (1. - .6 * uHcLamp);
  reflectedLight.indirectDiffuse = mix(reflectedLight.indirectDiffuse, diffuseColor.rgb * (uHcSkyHor * vec3(.3, .34, .4) + uHcSkyTop * .12), fdk);
  float cz = hcCaus(vec2(hp.x * .4 + hp.z * .2, hp.y * .3 + hp.z * .4 + uHcTime * .45), uHcTime * .7);
  hcAdd += diffuseColor.rgb * mix(uHcCaus, vec3(1., .9, .7) * dot(uHcCaus, vec3(.34)), .55) * (cz * .1 + .05 + gal.z * 2.9) * gal.y;     // the heads glow where a band of water-light crosses them
  // what stands in a niche catches the gallery's web of water-light where it stands: a steady floor, and a glow as each line crosses it
  vec2 fnt = hcNet(vec2(hp.x * 1.05 + hp.z * .45, hp.y * 1.1 + hp.z * 1.15 + uHcTime * .5), uHcTime * .9);
  hcAdd += diffuseColor.rgb * mix(uHcCaus, vec3(1., .9, .7) * dot(uHcCaus, vec3(.34)), .55) * (.16 + 1.5 * fnt.y) * (.7 + .6 * gal.z) * gal.y;
  if (vAux.y > 1.5 && vAux.y < 2.5) {
    float fl = .75 + .25 * sin(uHcTime * 9. + floor(hp.x) * 7.3 + floor((hp.y - .9) / 2.6) * 3.1) * sin(uHcTime * 5.3 + floor(hp.x) * 1.7);
    hcAdd += vec3(1., .6, .2) * 4.5 * fl;
  }
`;

// ---------------------------------------------------------------- water: the tank, the basin above, the falling sheet
const FOG_V = '#include <fog_pars_vertex>', FOG_F = '#include <fog_pars_fragment>';
function fogUniforms() { return THREE.UniformsUtils.clone(THREE.UniformsLib.fog); }

function makeWaterMaterial(U, jetTex) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...fogUniforms(), ...U, uJet: { value: jetTex }, uLeafAmt: { value: 1 }, uLeafMore: { value: 0 } },
    vertexShader: /* glsl */`
      varying vec3 vP; attribute vec2 wk; varying vec2 vWk;
      ${FOG_V}
      void main(){ vP = position; vWk = wk; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; varying vec2 vWk; uniform sampler2D uJet; uniform float uLeafAmt, uLeafMore;
      ${FOG_F}
      ${HC_PARS}
      // what the water mirrors: cold slate-teal overhead paling to the horizon with no plateau (so no contour ever
      // shows round the eye), the red crowns and the walls as soft bands, the sun
      vec3 hcEnvW(vec3 r, float gl){
        float h = clamp(r.y, 0., 1.), k = 1. - h;
        vec3 top = mix(mix(uHcSkyTop, vec3(dot(uHcSkyTop, vec3(.3, .5, .2))), .45), uHcWater * vec3(2.9, 3.4, 3.1), .86);
        vec3 c = mix(top, uHcSkyHor * vec3(.78, .96, .94), k * k * k);
        float az = atan(r.z, r.x + 1e-4);
        float crown = .5 + .5 * sin(az * 23.) * sin(az * 7. + 1.3);
        float tb = smoothstep(.015, .09, h) * (1. - smoothstep(.1 + .1 * crown, .3 + .16 * crown, h));
        c = mix(c, uHcTree * (.55 + .9 * crown), tb * .8);
        c = mix(c, uHcBand, 1. - smoothstep(.015, .09, h));
        float s = max(dot(r, uHcSun), 0.); float s2 = s * s; s2 *= s2; s2 *= s2; s2 *= s2;
        return c + uHcSunCol * vec3(1., .92, .76) * (s2 * s2 * 1.1 + s2 * .03) * gl;
      }
      void main(){
        vec3 p = vP; float t = uHcTime; float basin = step(8., p.y);
        vec3 toCam = uHcCam - p; float dist = length(toCam) + 1e-3; vec3 V = toCam / dist;
        float near = 1. / (1. + dist * .012);
        // ripples: three crossing swells and a fine chop, quieter far away
        vec2 q = p.xz; float flow = basin * t * 2.2;
        q.y += flow;
        vec2 g = vec2(0.);
        g += vec2(.8, .6) * cos(dot(q, vec2(.8, .6)) * .9 + t * 1.1) * .05;
        g += vec2(-.5, .86) * cos(dot(q, vec2(-.5, .86)) * 1.7 - t * 1.6) * .04;
        g += vec2(.2, -.98) * cos(dot(q, vec2(.2, -.98)) * 3.1 + t * 2.3) * .03;
        float ch = hcN2(q * 2.2 + vec2(t * .5, -t * .4)), ch2 = hcN2(q * 2.2 + vec2(.35, 0.) + vec2(t * .5, -t * .4)), ch3 = hcN2(q * 2.2 + vec2(0., .35) + vec2(t * .5, -t * .4));
        g += vec2(ch2 - ch, ch3 - ch) * (.05 + .3 * near);
        float foam = 0.;
        if (basin < .5) {
          // ring stamps under the jets
          vec2 gi = vec2(floor((p.x - ${JX0.toFixed(1)}) / ${JG.toFixed(1)} + .5), floor((${JZ0.toFixed(1)} - p.z) / ${JG.toFixed(1)} + .5));
          float inb = step(-.5, gi.x) * step(gi.x, ${(JNX - 0.5).toFixed(1)}) * step(-.5, gi.y) * step(gi.y, ${(JNZ - 0.5).toFixed(1)});
          float jet = texture2D(uJet, (gi + .5) / vec2(${JNX.toFixed(1)}, ${JNZ.toFixed(1)})).r * inb;
          vec2 d = p.xz - vec2(${JX0.toFixed(1)} + gi.x * ${JG.toFixed(1)}, ${JZ0.toFixed(1)} - gi.y * ${JG.toFixed(1)}); float r = length(d);
          float ring = sin(r * 4.2 - t * 5.) * exp(-r * .32) * (1. - smoothstep(5.5, 7., r)) * jet;
          g += d / (r + .05) * ring * .22;
          foam += jet * (1. - smoothstep(.5, 2.6, r)) * (.45 + .55 * hcN2(p.xz * 3. + t * 2.));
          // churn and rollers at the cascade foot
          float ft = smoothstep(${(ZS - 16).toFixed(1)}, ${(ZS - 1).toFixed(1)}, p.z) * (1. - smoothstep(30., 34., abs(p.x)));
          g.y += sin((${ZS.toFixed(1)} - p.z) * 1.1 - t * 3.2 + hcN2(p.xz * .3) * 4.) * .2 * ft;
          float fn = hcFbm(p.xz * .45 + vec2(0., t * 1.2));
          float fn2 = hcFbm(p.xz * 1.5 + vec2(t * .6, t * 2.1) + 7.);
          float churn = smoothstep(.76 - ft * .3, 1. - ft * .14, fn * .58 + fn2 * .42 + ft * ft * .15);
          foam += churn * ft * (.5 + .45 * fn2);                 // broken white with teal gaps, thinning away from the fall
        } else {
          // the basin slides to the lip and goes glassy
          float lipk = smoothstep(vWk.x + 5., vWk.x + .4, p.z);
          g *= 1. - lipk * .7; g.y += lipk * .15;
          if (vWk.y > .5) {                                       // the canal's own jets, 8 m either side of the axis every 10 m
            float zc = floor((p.z - 5.) / 10. + .5) * 10. + 5.;
            vec2 d = vec2(p.x - 8. * (p.x < 0. ? -1. : 1.), p.z - zc); float r = length(d);
            float ring = sin(r * 4.2 - t * 5.) * exp(-r * .32) * (1. - smoothstep(5.5, 7., r));
            g += d / (r + .05) * ring * .22;
            foam += (1. - smoothstep(.5, 2.6, r)) * (.45 + .55 * hcN2(p.xz * 3. + t * 2.));
          }
        }
        vec3 n = normalize(vec3(-g.x, 1., -g.y));
        vec3 R = reflect(-V, n); R.y = abs(R.y) + .015; R = normalize(R);
        // the sun's path is glitter: each ripple facet flashes, the water between stays its own colour
        float spk = hcN2(q * 1.7 + vec2(t * .8, -t * .6)) * .55 + hcN2(q * 4.9 + vec2(-t * 1.1, t * .9)) * .45;
        vec3 refl = hcEnvW(R, .16 + 1.5 * smoothstep(.5, .76, spk));
        if (basin < .5) {
          // analytic mirror: the cascade and its wall
          float tz = (${ZS.toFixed(1)} - p.z) / max(R.z, 1e-3); float hy = tz * R.y, hx = p.x + tz * R.x;
          float fz = step(.001, R.z);
          float wallM = fz * (1. - smoothstep(16., 17.2, hy)) * step(abs(hx), 100.);
          float sheetM = fz * (1. - smoothstep(15., 16.2, hy)) * (1. - smoothstep(29.5, 30.5, abs(hx)));
          vec3 wallC = uHcBand * 1.1;
          vec3 sheetC = (uHcSkyHor * .5 + uHcSunCol * .4) * (.45 + .55 * hcN2(vec2(hx * 2.5, hy * .5 + t * 2.)));
          refl = mix(refl, wallC, wallM * .9); refl = mix(refl, sheetC, sheetM * .8);
          // the black pavilion: slab test against its box
          vec3 bmin = vec3(-24., 0., ${(PZ - 24).toFixed(1)}), bmax = vec3(24., 23.6, ${(PZ + 24).toFixed(1)});
          vec3 inv = 1. / (R + vec3(1e-4) * (step(0., R) * 2. - 1.));
          vec3 t0 = (bmin - p) * inv, t1 = (bmax - p) * inv; vec3 tmn = min(t0, t1), tmx = max(t0, t1);
          float tn = max(max(tmn.x, tmn.y), tmn.z), tf = min(min(tmx.x, tmx.y), tmx.z);
          float hit = smoothstep(0., 8., tf - max(tn, 0.)) * step(0., tf);      // soft where the ray only clips a corner: a trembling dark, not a cut-out
          vec3 hp2 = p + R * max(tn, 0.); vec2 hq = abs(hp2.xz - vec2(0., ${PZ.toFixed(1)}));
          float along = min(hq.x, hq.y);
          float archM = max((1. - smoothstep(6.8, 7.6, along)) * (1. - smoothstep(16., 20.5, hp2.y)), (smoothstep(11.6, 12.2, along) - smoothstep(18.6, 19.2, along)) * (1. - smoothstep(12.5, 16., hp2.y)));
          refl = mix(refl, mix(uHcSkyTop * .08 + vec3(.012, .017, .026), refl * .5, archM * .7), hit * .86);
        }
        float fr = 1. - max(dot(n, V), 0.); float fr2 = fr * fr; float F = .04 + .96 * fr2 * fr2 * fr;
        F = max(F, .22);
        vec3 col = mix(uHcWater * 1.3, refl, F);
        float lipB = basin * smoothstep(vWk.x + 4., vWk.x + .5, p.z);
        if (basin > .5) {                                         // the garden's light on the canals; the gatehouse channel mirrors a lit vault
          float gl2 = hcGarden(p + vec3(0., .3, 0.));
          refl *= mix(1., .5, step(480.3, p.z));
          // the canal bed: glazed tiles seen through a hand of moving water (uHcGard.w: how strongly), eight-pointed
          // stars of turquoise in a cobalt ground, pale grout, each tile its own shade
          vec2 tq = (p.xz + g * 1.3) / 2.2; vec2 ti = floor(tq), tf = abs(fract(tq) - .5);
          float star = min(max(tf.x, tf.y), (tf.x + tf.y) * .7071);
          float far2 = smoothstep(30., 110., dist);                                   // the pattern melts into its mean colour with distance
          vec3 tile = mix(vec3(.035, .4, .42), vec3(.02, .13, .36), smoothstep(.3, .34, star) * (1. - far2 * .7));
          tile = mix(tile, vec3(.34, .52, .52), smoothstep(.46, .49, max(tf.x, tf.y)) * (1. - far2));
          tile = mix(tile, vec3(.5, .42, .12), (1. - smoothstep(.06, .09, star)) * (1. - far2));
          tile *= mix(.8 + .34 * hcHash(ti + 2.), .97, far2) * (uHcSunCol * (.25 + .75 * gl2) * .62 + mix(uHcSkyHor, uHcSkyTop, .5) * .5);
          float cz2 = hcCaus(p.xz * .45 + vec2(0., flow * .2), t * .9);
          tile *= 1. + cz2 * .45 * gl2 * (1. - far2);
          vec3 body = mix(uHcWater * 1.3, tile, uHcGard.w * (1. - .55 * lipB) * (1. - smoothstep(40., 150., dist) * .6));
          col = mix(body, refl, F * mix(1., .72, uHcGard.w));
          col = mix(col * vec3(.5, .62, .88), col, gl2);
          col += uHcSunCol * vec3(.5, .46, .36) * .2 * gl2 * step(480.3, p.z);
        }
        float lst = hcN2(vec2(p.x * 2.6, p.z * .42 + t * 2.6)) * .6 + hcN2(vec2(p.x * 7.1 + 3., p.z * .8 + t * 4.1)) * .4;      // the water draws out into threads as it nears a lip
        col = mix(col, uHcWater * vec3(1.1, 1.75, 1.8) * (.7 + .6 * lst), lipB * .62);
        col += (uHcSkyHor * vec3(.3, .42, .46) + uHcSunCol * .05) * lipB * smoothstep(.52, .8, lst) * .8;
        // red leaves turning on the surface (near the eye only), rafting thicker toward a lip
        vec2 lc = p.xz * .7 + vec2(t * .05, flow * .7 - t * .03); vec2 li = floor(lc), lf = fract(lc) - .5;
        float lh = hcHash(li + 17.); float la = lh * 40. + t * (.2 + lh * .3);
        lf += (vec2(hcHash(li + 3.), hcHash(li + 9.)) - .5) * .5;
        vec2 lr = vec2(lf.x * cos(la) - lf.y * sin(la), lf.x * sin(la) + lf.y * cos(la));
        float leafM = (1. - smoothstep(.1, .14, length(lr * vec2(1., 1.7)))) * step(.87 - uLeafMore - .3 * lipB, lh) * uLeafAmt * (1. - smoothstep(60., 110., dist));
        col = mix(col, mix(uHcTree * (.25 + .4 * hcHash(li + 5.)), vec3(.86, .62, .7) * (.6 + .4 * hcHash(li + 5.)), uHcGard.z) * (.4 + uHcSunCol.g * .3), leafM);          // red leaves, or in April fallen blossom
        col = mix(col, (uHcSkyHor * .45 + uHcSunCol * .35), clamp(foam, 0., 1.) * .9);
        // behind the fall the water lies in the gallery's shade
        col *= mix(vec3(1.), vec3(.4, .56, .78), (1. - basin) * smoothstep(${(ZS - 1.9).toFixed(1)}, ${(ZS - 0.7).toFixed(1)}, p.z) * (1. - smoothstep(30., 34., abs(p.x))));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

function makeSheet(U, opts, detail) {
  const cols = 60, rows = 14, pos = [], uv = [], idx = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
    const v = j / rows, x = -GX + (i / cols) * 2 * GX;
    pos.push(x, GH + 0.02 - v * (GH + 0.1), v === 0 ? ZS + 0.6 : ZS - 0.15 - 1.25 * Math.sqrt(v)); uv.push(i / cols, v);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = j * (cols + 1) + i, c = a + cols + 1; idx.push(a, c, a + 1, a + 1, c, c + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...fogUniforms(), ...U, uSeed: { value: opts.sheetSeed }, uScal: { value: opts.scallops } },
    vertexShader: /* glsl */`
      varying vec3 vP; varying vec2 vUv; uniform float uHcTime;
      ${FOG_V}
      void main(){ vec3 p = position; vUv = uv;
        p.z += sin(p.x * .31 + uHcTime * .8 + uv.y * 3.) * .14 * uv.y + sin(p.x * 1.3 - uHcTime * 1.7) * .04 * uv.y;
        vP = p; vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; varying vec2 vUv; uniform float uSeed, uScal; uniform vec4 uHcHole; uniform vec2 uHcBend; uniform vec3 uHcPortal;
      ${FOG_F}
      ${HC_PARS}
      // What lies beyond the sheet, painted from where things are known to stand (no render target): the tank and its
      // rows of jets, the walls and the red crowns over them, the black pavilion with the portal burning in its arch.
      // o = a point on the sheet, v = the view ray after the water has bent and smeared it.
      vec3 hcBeyond(vec3 o, vec3 v, float t, float jk){
        v.x *= .62; v.y = v.y * .55 - .012; v.z = min(v.z, -.05); v = normalize(v);          // the water is a lens: the far garden stands tall in it
        float h = v.y;
        vec3 sky = mix(uHcSkyHor * .9, uHcSkyTop * .8, smoothstep(0., .2, h));
        // the walls round the tank (x = +-100, z = -156), 22 m high, creeper over their tops, chinars behind them
        float sx = v.x < 0. ? -1. : 1.;
        float tx = (sx * 100. - o.x) / (sx * max(abs(v.x), 1e-3));
        float tz = (-156. - o.z) / v.z;
        float side = step(tx, tz), tw = min(tx, tz);
        float wy = o.y + v.y * tw, wa = mix(o.x + v.x * tw, o.z + v.z * tw, side);
        float tc = tw * 1.12, cy = o.y + v.y * tc, ca = mix(o.x + v.x * tc, o.z + v.z * tc, side);
        float lump = .5 + .5 * cos(ca * .12566 - mix(3.1416, 2.513, side));
        lump = lump * .7 + .3 * hcN2(vec2(ca * .11, 3. + side));
        float top = 26. + 24. * lump;
        float crown = (1. - smoothstep(top - 8., top, cy + 6. * hcN2(vec2(ca * .3, cy * .25)))) * step(21.5, wy);
        float sunSide = side * step(0., sx * uHcSun.x);
        vec3 treeC = uHcTree * vec3(1.25, .95, .8) * (.5 + .9 * hcN2(vec2(ca * .21, cy * .2 + 5.))) * (1. + 1.1 * sunSide);
        treeC = mix(treeC, uHcAccent * (1.1 + .9 * sunSide), smoothstep(top - 12., top - 2., cy) * .6);
        float bay = abs(fract(wa / 11.1) - .5);
        vec3 wallC = uHcBand * mix(.5, 1., smoothstep(.3, .34, bay) + step(14., wy)) * mix(1.5, .8, max(sunSide, 1. - side));
        wallC = mix(wallC, mix(uHcTree * .5, wallC, .25), smoothstep(15., 20., wy + 3. * hcN2(vec2(wa * .4, 1.))));
        vec3 c = mix(sky, treeC, crown);
        c = mix(c, wallC, 1. - step(22., wy));
        c = mix(c, uHcSkyHor, (1. - exp(-tw * .002)) * .7);
        // the black pavilion: slab test against its box, bright arches cut through it, the portal in the middle one
        vec3 bmin = vec3(-24., 0., ${(PZ - 24).toFixed(1)}), bmax = vec3(24., 24.4, ${(PZ + 24).toFixed(1)});
        vec3 inv = 1. / (v + vec3(1e-4) * (step(0., v) * 2. - 1.));
        vec3 t0 = (bmin - o) * inv, t1 = (bmax - o) * inv; vec3 tmn = min(t0, t1), tmx = max(t0, t1);
        float tn = max(max(tmn.x, tmn.y), tmn.z), tf = min(min(tmx.x, tmx.y), tmx.z);
        float hit = step(tn, tf) * step(0., tf);
        vec3 hp2 = o + v * max(tn, 0.); vec2 hq = abs(hp2.xz - vec2(0., ${PZ.toFixed(1)}));
        float along = min(hq.x, hq.y);
        float archM = max((1. - smoothstep(6.6, 7.8, along + max(hp2.y - 13., 0.) * .9)) * (1. - smoothstep(19., 21., hp2.y)),
          (smoothstep(11.6, 12.4, along) - smoothstep(18.4, 19.2, along)) * (1. - smoothstep(13., 16.5, hp2.y + abs(along - 15.4) * .8)));
        vec3 pavC = mix(vec3(.008, .009, .013) + uHcSkyHor * .012, uHcSkyHor * .09, archM * step(2., hp2.y));
        float pr = length(vec2(hp2.x, (hp2.y - 9.) * .9));
        pavC += uHcPortal * (2.6 * exp(-pr * pr / 34.) + .6 * exp(-pr * pr / 260.)) * step(hq.x, hq.y);
        c = mix(c, pavC, hit);
        vec3 pd = normalize(vec3(0., 9., ${(PZ - 22).toFixed(1)}) - o);
        c += uHcPortal * .4 * exp(-(1. - max(dot(v, pd), 0.)) * 260.);
        // the tank: slate-teal mirroring the pale horizon and the red crowns, churned white under the fall
        if (h < -.004) {
          float tq = -o.y / h;
          if (tq < tw && (hit < .5 || tq < tn)) {
            vec2 q = o.xz + v.xz * tq;
            float gl = exp(h * 11.);
            vec3 wc = mix(uHcWater * 1.5 + sky * .1, mix(uHcSkyHor * .62, uHcTree * .75, .42 + .3 * hcN2(q * vec2(.05, .3))), gl);
            wc = mix(wc, uHcSkyHor * .5 + uHcSunCol * .3, (1. - smoothstep(1., 15., ${ZS.toFixed(1)} - q.y)) * (.45 + .4 * hcN2(q * .5 + vec2(0., t * 1.5))));
            c = mix(wc, uHcSkyHor, (1. - exp(-tq * .0032)) * .6);
          }
        }
        // the jets: seven rows of them, then the rest as a pale band under the horizon
        float jets = 0.;
        for (int k = 0; k < 7; k++) {
          float fk = float(k), tk = (70. - 14. * fk - o.z) / v.z;
          vec3 pk = o + v * tk;
          // no two alike: each stands off its mark, some are missing, tall thin plumes among low wide bells, all drawn out by the water
          float ji = floor((pk.x + 98.) / 14.), jh = hcHash(vec2(ji, fk) + 5.), jo = hcHash(vec2(ji, fk) + 9.);
          float dx = abs(pk.x + 98. - (ji + .5 + (jo - .5) * .56) * 14.);
          float H = 7.6 * (.28 + 1.9 * jh * jh) * (.72 + .28 * sin(t * .45 + ji * 2.0944 + fk * 4.19));
          dx *= .5 + 1.5 * (1. - jh);
          float inT = step(abs(pk.x), 96.) * step(0., pk.y) * step(.26, fract(jo * 7.31));
          float m = (1. - smoothstep(.3, 1.3 + tk * .012, dx)) * (1. - smoothstep(H - 3.5, H + 1.6, pk.y));
          m += .5 * jh * (1. - smoothstep(.8, 3.2, dx)) * smoothstep(H - 4., H - .5, pk.y) * (1. - smoothstep(H, H + 1.2, pk.y));
          jets += m * inT * exp(-tk * .005);
        }
        jets += .45 * (1. - smoothstep(0., .04, abs(h + .008))) * (.5 + .5 * hcN2(vec2(v.x / max(-v.z, .05) * 40., 2.)));
        c = mix(c, uHcSkyHor * .55 + uHcSunCol * .36, clamp(jets, 0., 1.) * .9 * jk);
        return c;
      }
      void main(){
        float t = uHcTime; float x = vP.x + uSeed; float v = vUv.y; float s = sqrt(max(v, 0.)) * 16.;   // fall accelerates
        float n1 = hcN2(vec2(x * 6.5, s * .55 - t * 2.9));
        float n2 = hcN2(vec2(x * 2.1 + 5., s * .3 - t * 1.9));
        float n3 = hcN2(vec2(x * 17., s * 1.1 - t * 4.3));
        float comb = .5 + .5 * cos(6.2831853 * (vP.x + 30.) * uScal / 60.);
        float thick = smoothstep(.4, .85, hcN2(vec2(x * .13, s * .16 - t * .55)));           // slow thickenings
        float n4 = hcN2(vec2(x * 3.3 + 2., s * .4 - t * 2.3));
        float dens = clamp(.02 + .3 * n1 + .22 * n2 + .22 * n4 + .2 * n3 * n1 + .3 * thick + comb * (1. - v) * .2, 0., 1.);
        dens = smoothstep(.2, .85, dens);
        float lip = 1. - smoothstep(.0, .06, v);
        dens = mix(dens, .35, lip);
        float spray = smoothstep(.8, 1., v) * (.5 + .5 * hcN2(vec2(x * 1.2, t * 1.5)));
        vec3 D = normalize(vP - uHcCam + vec3(0., 1e-4, 0.));
        float fs = max(dot(D, uHcSun), 0.); float fs2 = fs * fs; float fs6 = fs2 * fs2 * fs2;
        float inner = smoothstep(-.02, .08, -D.z);                                         // 1 seen from the gallery, 0 from the tank
        vec3 amb = mix(uHcSkyHor, uHcSkyTop, .35);
        // seen from the tank: the lit face of the fall
        float front = max(dot(-D, vec3(0., 0., -1.)), 0.) * max(-uHcSun.z, 0.);
        vec3 glass = mix(uHcWater * 1.5 + amb * .3, amb * .74 + uHcSunCol * .1, dens);
        glass = mix(glass, amb * .8 + uHcSunCol * .22, smoothstep(.55, .9, n3 * .6 + n1 * .4) * .6);          // threads of white in it
        vec3 colT = glass + uHcSunCol * (front * .5 * dens + fs6 * (.06 + .7 * dens * dens) + fs2 * .03);
        colT += uHcSunCol * vec3(1., .8, .45) * fs6 * fs6 * n3 * dens * .8;
        float alphaT = mix(.42, .92, dens);
        // seen from behind: streaked glass. Each thread of water bends the view its own way, so the garden beyond
        // arrives as trembling smears of its colours, and the sun burns through where the view runs toward it
        vec3 vb = vec3(D.x * uHcBend.x - D.z * uHcBend.y, D.y, D.z * uHcBend.x + D.x * uHcBend.y);
        vb.y += (n1 - .5) * .05 + (n2 - .5) * .04 + (n3 - .5) * .015;
        vb.x += (n4 - .5) * .05;
        float outG = smoothstep(31., 38., abs(uHcCam.x)) * inner;                                // the eye stands beyond the end of the shelf: the fall seen along its back
        vec3 beyond = hcBeyond(vP, vb, t, 1. - .6 * outG) * vec3(.8, .94, .92);
        float fs12 = fs6 * fs6, fs48 = fs12 * fs12; fs48 *= fs48;
        float core = fs48 * fs48; core *= core; core *= core;
        float thru = .25 + .75 * smoothstep(.02, .3, dot(beyond, vec3(.3, .5, .2)));
        vec3 milk = amb * .36 + uHcSunCol * (.02 + .14 * fs12);
        vec3 colG = mix(beyond, milk, dens * dens * .3 * thru);
        float thread = smoothstep(.62, .9, n3) * smoothstep(.3, .8, n1);
        colG += (amb * .15 + uHcSunCol * (.025 + .22 * fs12)) * thread * thru;
        colG += uHcSunCol * ((fs48 * (.04 + .22 * dens) + fs12 * .02) * thru + core * 1.4);
        colG += uHcSunCol * vec3(1., .8, .45) * fs48 * n3 * dens * .5 * thru;                       // gold in the brightest streaks
        float alphaG = mix(.9, .98, dens);
        // from there it is plainly falling water: white streaks and thickenings over teal glass, the sun gold in its top
        vec3 fallC = mix(uHcWater * 1.7 + amb * .26, amb * .82 + uHcSunCol * .14, dens) + (amb * .3 + uHcSunCol * .16) * thread;
        fallC += uHcSunCol * vec3(1., .8, .45) * (1. - smoothstep(0., .55, v)) * (.06 + .5 * fs2) * (.35 + .65 * dens);
        colG = mix(colG, mix(colG * .5, fallC, .35 + .65 * dens), outG * .85);
        alphaG = mix(alphaG, mix(.55, .96, dens), outG);
        vec3 col = mix(colT, colG, inner); float alpha = mix(alphaT, alphaG, inner);
        alpha = mix(alpha, max(alpha, .8), spray * .7);
        col += amb * lip * mix(.4, .15, inner) + (amb * .3 + uHcSunCol * .15) * spray;
        // leaves coming over the lip as dark flecks
        vec2 lc = vec2(x * .55, s * .22 - t * .62); vec2 li = floor(lc), lf = fract(lc) - .5;
        float lh = hcHash(li + 4.);
        lf += (vec2(hcHash(li + 1.), hcHash(li + 2.)) - .5) * .6;
        float fleck = (1. - smoothstep(.03, .05, length(lf * vec2(1., .5)))) * step(.84, lh);
        col = mix(col, uHcTree * .22, fleck * .9); alpha = mix(alpha, .95, fleck);
        // the tear round the camera
        float hd = length(vec2(vP.x - uHcHole.x, (vP.y - uHcHole.y) * .85)) + (n1 - .5) * 2.5 * step(.01, uHcHole.z);
        float open = smoothstep(uHcHole.z * .75, uHcHole.z + .01, hd);
        float rim = (1. - smoothstep(0., 3., abs(hd - uHcHole.z))) * step(.01, uHcHole.z);
        col += (amb + uHcSunCol * .6) * rim * mix(.8, .45, inner); alpha = mix(alpha, .95, rim * .6) * mix(1., open, step(.01, uHcHole.z));
        // the ends fray: over the last metres the sheet thins to separate falling threads, the strongest lasting longest
        float endk = smoothstep(23.4, 29.9, abs(vP.x));
        float fray = hcN2(vec2(x * 3.3, s * .12 - t * .9)) * .6 + n1 * .4;
        alpha *= mix(1., smoothstep(.22 + .5 * endk, .34 + .56 * endk, fray), endk) * (1. - smoothstep(29.6, 30.05, abs(vP.x)));
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.renderOrder = 3; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- jets, mist and drips, the burst veil
function makeJets(U, jets, jetH) {
  const P = [];
  const strip = (id, segs) => { for (let j = 0; j < segs; j++) { const a = j / segs, c = (j + 1) / segs; P.push(-1, a, id, 1, a, id, 1, c, id, -1, a, id, 1, c, id, -1, c, id); } };
  strip(-1, 9); for (let k = 0; k < 6; k++) strip(k, 6);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  const ia = new Float32Array(jets.length * 4);
  jets.forEach((j, i) => { ia[i * 4] = j.x; ia[i * 4 + 1] = j.z; ia[i * 4 + 2] = j.group; ia[i * 4 + 3] = j.seed; });
  g.setAttribute('iJet', new THREE.InstancedBufferAttribute(ia, 4)); g.instanceCount = jets.length;
  g.setAttribute('iJetY', new THREE.InstancedBufferAttribute(new Float32Array(jets.map((j) => j.y || 0)), 1));
  // the form of each jet: (height x, spread x, 1 = an arch thrown toward the garden axis, 2 = an arch thrown down its own
  // line of jets, bud to bud, so that no water crosses the axis)
  const ik = new Float32Array(jets.length * 3); jets.forEach((j, i) => { const k = j.k || [1, 1, 0]; ik[i * 3] = k[0]; ik[i * 3 + 1] = k[1]; ik[i * 3 + 2] = k[2]; });
  g.setAttribute('iJetK', new THREE.InstancedBufferAttribute(ik, 3));
  const m = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { ...fogUniforms(), ...U, uJetH: { value: jetH } },
    vertexShader: /* glsl */`
      attribute vec4 iJet; attribute float iJetY; attribute vec3 iJetK; uniform float uHcTime, uJetH; uniform vec3 uHcCam;
      varying vec4 vJ; varying vec3 vP; varying float vArch;
      ${FOG_V}
      void main(){
        float s = position.y, id = position.z, seed = iJet.w, t = uHcTime;
        float H = uJetH * iJetK.x * (.9 + .25 * seed) * (.72 + .28 * sin(t * .45 + iJet.z * 2.0944 + seed * .6));
        vec3 base = vec3(iJet.x, iJetY, iJet.y), c, tg; float w;
        vArch = iJetK.z;
        if (iJetK.z > .5) {
          // an arch of water thrown across the canal: seven strands of slightly different reach, combed apart as they fall
          float k2 = id + 1., sgn = base.x < 0. ? 1. : -1., al = step(1.5, iJetK.z);
          float reach = mix(12.4, 8.5, al) + mix(1.5, .8, al) * sin(k2 * 2.4 + seed * 9.) + mix(.5, .25, al) * sin(t * .9 + k2);
          float apex = (uJetH * iJetK.x * (1.16 + .1 * sin(k2 * 1.7 + seed * 5.))) * (.93 + .07 * sin(t * .45 + iJet.z * 2.0944));
          float zo = ((k2 - 3.) * .34 + sin(t * 1.3 + k2 * 2. + seed * 20.) * .12) * mix(1., .5, al);
          // thrown across (toward the axis) or along (down the canal, combed a little outward, away from the axis)
          vec3 thr = mix(vec3(sgn, 0., 0.), vec3(0., 0., -1.), al), cmb = mix(vec3(0., 0., 1.), vec3(-sgn, 0., 0.), al);
          c = base + thr * (reach * s) + vec3(0., .5 + apex * 4. * s * (1. - s) - .3 * s, 0.) + cmb * (zo * s * (.4 + s) + al * .7 * s);
          tg = normalize(thr * reach + vec3(0., apex * 4. * (1. - 2. * s), 0.) + cmb * zo);
          w = mix(.07, .17, s);
        } else if (id < -.5) {
          c = base + vec3(sin(t * 3.1 + s * 5. + seed * 40.) * .07 * s, .5 + s * H, cos(t * 2.3 + s * 4. + seed * 17.) * .07 * s);
          tg = vec3(0., 1., 0.); w = mix(.34, .2, s) * mix(1., .78, step(1.35, iJetK.x));
        } else {
          float ang = id * 1.0472 + seed * 6.283 + sin(t * .7 + id) * .15;
          vec3 dir = vec3(cos(ang), 0., sin(ang)); float rr = 2.1 * iJetK.y * (.75 + .5 * fract(seed * 7.3 + id * .37));
          float top = .5 + H;
          c = base + dir * rr * s + vec3(s * s * (.7 + .5 * sin(t * .31 + seed * 9.)), top * (1. - s * s) + .7 * sin(3.14159 * s), 0.);   // spray drifts left to right
          tg = normalize(dir * rr + vec3(0., -2. * top * s + 2.2 * cos(3.14159 * s), 0.)); w = mix(.2, .5, s);
        }
        vec3 toCam = uHcCam - c; vec3 side = cross(tg, toCam); side /= max(length(side), 1e-4);
        float dC = length(toCam);
        w *= 1. + dC / 90.;
        // slim near the eye: over the last 15 m a ribbon narrows, and none is ever wider on screen than about a fiftieth of its distance
        w = min(w * mix(.45, 1., smoothstep(2., 15., dC)), .014 * dC);
        vec3 p = c + side * position.x * w;
        vJ = vec4(position.x, s, id, seed); vP = p;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec4 vJ; varying vec3 vP; varying float vArch;
      ${FOG_F}
      ${HC_PARS}
      void main(){
        // across and along a ribbon both stay in their own range: on a ribbon thinner than a pixel antialiasing reads them far outside it
        float ac = clamp(vJ.x, -1., 1.), s = clamp(vJ.y, 0., 1.), id = vJ.z, seed = vJ.w, t = uHcTime; float a;
        float edge = 1. - ac * ac;
        if (vArch > .5) a = edge * (.4 + .6 * hcN2(vec2(ac * 3. + id * 5. + seed * 9., s * 22. - t * 9.))) * smoothstep(0., .04, s) * (1. - .55 * smoothstep(.7, 1., s)) * .8;
        else if (id < -.5) a = edge * (.55 + .45 * hcN2(vec2(ac * 3. + seed * 9., s * 13. - t * 7.))) * (1. - .4 * smoothstep(.85, 1., s));
        else a = edge * edge * (.2 + .8 * hcN2(vec2(ac * 2.5 + id * 3., s * 8. - t * 5. + seed * 7.))) * (1. - smoothstep(.8, 1., s)) * smoothstep(0., .1, s) * .75;
        vec3 D = normalize(vP - uHcCam + vec3(0., 1e-4, 0.));
        float fs = max(dot(D, uHcSun), 0.); fs *= fs; fs *= fs;
        vec3 amb = mix(uHcSkyHor, uHcSkyTop, .3);
        vec3 col = amb * .55 + uHcSunCol * (.2 + .5 * fs);
        col = mix(col, col * vec3(1.15, .86, .5), smoothstep(.45, 1., abs(ac)) * (.3 + .7 * fs));     // gold rim
        col *= mix(vec3(.5, .6, .82), vec3(1.), hcGarden(vP));
        float dE = length(vP - uHcCam);
        // toward its top (an arch toward its fall) the water breaks into beads; too fine to draw far off, so it eases out with distance
        float bead = smoothstep(.3, .62, hcN2(vec2(ac * 1.6 + id * 3.7 + seed * 31., s * 34. - t * 8.)));
        a *= mix(1., .12 + 1.05 * bead, smoothstep(.45, .95, s) * (1. - smoothstep(22., 55., dE)));
        // and it thins as it nears the eye: translucent over the last 14 m, gone before it could cross the lens
        a *= (.55 + .45 * smoothstep(6., 22., dE)) * mix(.5, 1., smoothstep(2., 14., dE)) * smoothstep(.5, 3., dE);
        gl_FragColor = vec4(col, a * .82);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

// soft billboards: kind 0 mist puffs (cascade foot, gallery mouths), kind 1 drips from the soffit
function makeMist(U, rng, detail, extra) {
  const items = [];
  const nFoot = Math.round(44 * detail), nEnd = Math.round(9 * detail), nDrip = Math.round(110 * detail);
  for (let i = 0; i < nFoot; i++) items.push([rng.range(-31, 31), 0.2, ZS - rng.range(0.5, 9), rng(), 0, rng.range(5, 9)]);
  for (const sx of [-1, 1]) for (let i = 0; i < nEnd; i++) items.push([sx * rng.range(26, 36), 0.6, rng.range(ZS + 2, ZW - 2), rng(), 0, rng.range(4, 7)]);
  for (let i = 0; i < nDrip; i++) items.push([rng.range(-GX, GX), 0, rng.range(ZS + 1.4, ZW - 0.8), rng(), 1, rng.range(0.5, 1.1)]);
  const nSpray = Math.round(84 * detail);                // broken spray where the sheet meets the tank, seen from the gallery and from outside
  for (let i = 0; i < nSpray; i++) items.push([-GX + 1 + (58 * (i + rng())) / nSpray, 0.25, ZS - 1.4 + rng.range(-0.5, 2.6), rng(), 3, rng.range(1.9, 3.5)]);
  for (const sx of [-1, 1]) for (let i = 0; i < Math.round(13 * detail); i++) items.push([sx * rng.range(21, 36), 0.3, ZS - rng.range(-1.2, 7), rng(), 0, rng.range(6.5, 10.5)]);
  for (const it of extra || []) items.push(it);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  const a = new Float32Array(items.length * 4), k = new Float32Array(items.length * 2);
  items.forEach((it, i) => { a.set(it.slice(0, 4), i * 4); k[i * 2] = it[4]; k[i * 2 + 1] = it[5]; });
  g.setAttribute('iM', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('iK', new THREE.InstancedBufferAttribute(k, 2)); g.instanceCount = items.length;
  const m = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false,
    uniforms: { ...fogUniforms(), ...U },
    vertexShader: /* glsl */`
      attribute vec4 iM; attribute vec2 iK; uniform float uHcTime; uniform vec3 uHcCam;
      varying vec4 vM; varying vec3 vP; varying float vNear;
      ${FOG_V}
      void main(){
        float t = uHcTime, seed = iM.w; vec3 c = iM.xyz; vec3 p; float life; vNear = 1.;
        vec3 toCam = uHcCam - c; vec3 side = normalize(vec3(toCam.z, 0., -toCam.x) + vec3(1e-4, 0., 0.));
        if (iK.x > 2.5) {
          life = fract(t * (.16 + .14 * seed) + seed * 7.31);
          c += vec3(sin(t * .4 + seed * 40.) * .5 + life * .5, life * (1.1 + 2.6 * seed), (seed - .5) * life * 1.2);
          float sz = iK.y * (.45 + .95 * life);
          vec3 up = normalize(cross(side, normalize(uHcCam - c + vec3(0., 1e-4, 0.))));
          p = c + (side * position.x + up * position.y) * sz;
        } else if (iK.x < .5) {
          life = fract(t * (.07 + .05 * seed) + seed * 7.31);
          c += vec3(sin(t * .23 + seed * 40.) * 1.5 + life * 2., life * (3. + 5. * seed), -life * 3. * step(c.z, ${ZS.toFixed(1)}));
          float sz = iK.y * (.6 + .8 * life);
          vec3 up = normalize(cross(side, normalize(uHcCam - c + vec3(0., 1e-4, 0.))));
          p = c + (side * position.x + up * position.y) * sz;
        } else if (iK.x > 1.5) {
          life = fract(t * (.045 + .03 * seed) + seed * 7.31);
          c += vec3(sin(t * .21 + seed * 40.) * 1.4, life * .6 + iK.y * .05, 8. - life * 16.);
          float sz = iK.y * (.75 + .5 * life);
          p = c + side * position.x * sz + vec3(0., position.y * min(sz * .19, 1.7), 0.);        // it lies on the water, 1 to 3 m deep
        } else {
          life = fract(t * (.33 + .2 * seed) + seed * 13.7);
          float y = 14.6 - (14.6 - .55) * life * life + (c.z - ${ZS.toFixed(1)}) * -.05;
          c.y = y; p = c + side * position.x * .022 + vec3(0., position.y * iK.y * (.15 + .5 * life), 0.);
          vNear = smoothstep(.6, 2.5, length((modelViewMatrix * vec4(c, 1.)).xyz)) * 1.002;        // the kit's near law for small falling things (its own two numbers, and like the kit's by the true distance of the drip's centre from the eye): a drip thins to nothing as it nears the eye. Carried a hair over 1 and cut at 1 below, so that a drip further off than 2.5 m is drawn to the bit as it was, whatever a graphics card's interpolation makes of a constant
        }
        vM = vec4(position.xy, iK.x, life); vP = p;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec4 vM; varying vec3 vP; varying float vNear;
      ${FOG_F}
      ${HC_PARS}
      void main(){
        vec3 D = normalize(vP - uHcCam + vec3(0., 1e-4, 0.)); float fs = max(dot(D, uHcSun), 0.); fs *= fs;
        vec3 amb = mix(uHcSkyHor, uHcSkyTop, .3); vec3 col; float a;
        if (vM.z < .5 || vM.z > 1.5) {
          float r = length(vM.xy); float n = hcN2(vM.xy * 2.3 + vP.xz * .15 + uHcTime * .2);
          a = (1. - smoothstep(.15, 1., r + (n - .5) * .5)) * (1. - smoothstep(.72, 1., r)) * sin(3.14159 * vM.w) * (vM.z < .5 ? .25 : .17);
          col = amb * .7 + uHcSunCol * (.08 + .3 * fs * fs);
          float nearFade = smoothstep(2., 9., length(vP - uHcCam)); a *= nearFade;
          if (vM.z > 2.5) {                                   // spray at the foot of the fall: denser, torn, cool in the gallery's shade
            a = min(a * 2.6 * (.45 + .9 * hcN2(vM.xy * 3.1 + vP.xy * .7 - vec2(0., uHcTime * 1.3))), .46);
            col = mix(amb * .62 + uHcCaus * .2 + uHcSunCol * (.05 + .25 * fs * fs), col, smoothstep(${(ZS - 0.4).toFixed(1)}, ${(ZS - 2.4).toFixed(1)}, vP.z));
          } else if (vM.z > 1.5) {                                   // the canal mist: blue in shadow, white where the sun crosses it
            float lit = hcGarden(vP);
            a = min(a * 1.5 * uHcMist * (.45 + 1.1 * hcN2(vP.xz * .3 + vec2(uHcTime * .12, 0.))), .5);     // wisps, never a slab
            a *= .35 + .65 * smoothstep(8., 30., length(vP - uHcCam));
            a *= smoothstep(-.15, 1.1, vP.y - hcGround(vP.z));
            col = mix(amb * vec3(.5, .62, .86), amb * .55 + uHcSunCol * (.26 + .42 * fs * fs), lit);
          }
        } else {
          // a drip is thinner than a pixel far off: both of its coordinates stay in their own range (see the jets)
          a = (1. - min(abs(vM.x), 1.)) * (1. - min(vM.y * vM.y, 1.)) * .55 * min(vNear, 1.);
          col = uHcCaus * .9 + amb * .4 + uHcSunCol * fs * fs * 1.2;
        }
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return mesh;
}

// the spray that crosses the eye as it passes the fall (uHcBurst 0..1 over about a second and a half): threads of
// water falling down the frame, white and teal, gold toward the sun, thick on the side the sheet is on (uHcVeil.x:
// +1 right, -1 left, 0 the whole frame) and tearing open from the other; never a cut, never a white-out
function makeVeil(U) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const m = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, depthTest: false, uniforms: { ...U },
    vertexShader: 'varying vec2 vS; void main(){ vS = position.xy; gl_Position = vec4(position.xy, 0., 1.); }',
    fragmentShader: /* glsl */`
      varying vec2 vS; uniform float uHcBurst; uniform vec4 uHcVeil;
      ${HC_PARS}
      void main(){
        float k = uHcBurst, t = uHcTime; float env = smoothstep(0., .32, k) * (1. - smoothstep(.42, 1., k));
        float x = vS.x, y = vS.y;
        float sway = sin(y * 1.7 + t * 2.1) * .012;
        float a1 = hcN2(vec2((x + sway) * 47., y * .8 + t * 5.2));                  // threads a hundredth of the frame wide, falling
        float a2 = hcN2(vec2((x + sway) * 118. + 3., y * 1.7 + t * 9.));            // hair-fine ones, faster
        float a3 = hcN2(vec2(x * 3.1 + 7., y * .35 + t * 1.9));                     // where they gather (their number, never their width)
        float brk = hcN2(vec2(x * 47. + 11., y * 6.5 + t * 13.));                   // each thread breaks into drops as it falls
        float th = smoothstep(.6, .82, a1) * (.4 + .6 * a3) * (.1 + .9 * smoothstep(.3, .62, brk)) + smoothstep(.68, .86, a2) * .45;
        float st = .3 + .6 * th;
        float beads = smoothstep(.83, .9, hcN2(vec2(x * 85., y * 5. + t * 15.))) * smoothstep(.3, .7, a3);
        // the curtain stands on the sheet's side of the frame and opens from the other as the eye clears it
        float edge = mix(.3, 1.3, smoothstep(.42, 1., k)) + (a3 - .5) * .4;
        float side = mix(1., smoothstep(edge - .3, edge + .3, x * uHcVeil.x), abs(uHcVeil.x));
        vec2 sd = vS - uHcVeil.yz; float sun = uHcVeil.w * exp(-dot(sd, sd) * 1.6);
        // fine spray: a breath of haze, thin threads and drops, brightest toward the sun; what lies beyond shows between them
        float a = env * side * (.035 + .06 * a3 + .36 * th * (.75 + .5 * sun) + beads * .38);
        vec3 teal = uHcWater * vec3(2.2, 3.1, 3.) + uHcSkyHor * .22;
        vec3 white = uHcSkyHor * .62 + uHcSunCol * .3;
        vec3 col = mix(teal, white, smoothstep(.42, .8, st)) * (.8 + .4 * a2);
        col += uHcSunCol * vec3(1., .82, .5) * sun * (.35 + .9 * smoothstep(.5, .85, st)) + uHcSunCol * beads * .5;
        gl_FragColor = vec4(col, clamp(a, 0., .6));
      }`,
  });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = 999; mesh.visible = false;
  return mesh;
}

// ---------------------------------------------------------------- assembly
const FLY = [[-41, 24, 130], [-41, 23, 104], [-42, 15, 91], [-33, 7.6, 92], [-12, 7.3, 92], [7, 7.3, 92], [17, 7.2, 90], [25, 6.5, 84], [33, 5.2, 75],
  [40, 4.5, 50], [38, 4.5, 20], [22, 5.5, -8], [8, 7.5, -30], [0, 9, -46], [0, 9, -76], [0, 9, -102]];
const VIEWS = [
  [[-33, 7.3, 92], [30, 6.5, 92.5]], [[26, 7.3, 92], [-30, 6.5, 92]], [[0, 7.3, 92], [5, 7, 100]], [[6, 7.3, 92.5], [-8, 6, 84]],
  [[30, 5, 66], [2, 9, -80]], [[4, 9, -34], [0, 10, -104]], [[1, 9, -66], [0, 9.5, -104]], [[-22, 22, 132], [0, 6, -80]],
  [[38, 10, 22], [0, 7.3, 92]], [[13, 7, -46], [-4, 13, -60]],
];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('cwt-hero') : ctx.rng;
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).slice();
  const look = opts.look || 'october';
  const sunDir = (opts.sunDir ? new V3().copy(opts.sunDir) : new V3(-Math.sin(Math.PI / 3) * Math.cos(0.244), Math.sin(0.244), -Math.cos(Math.PI / 3) * Math.cos(0.244))).normalize();
  // per-seed character: stone tint, number of foils, scallops on the lip, how the flowers are arranged, finial, jet height
  const seedV = {
    foils: rng.pick([5, 5, 7]), pavFoils: rng.pick([7, 9, 11]), scallops: rng.pick([30, 40, 48]), finial: rng.range(0.9, 1.25),
    sheetSeed: rng.range(0, 100), arrange: rng.pick(['scatter', 'rows', 'chevron', 'bands']), jetH: rng.range(6.4, 8.2), warm: rng.range(-1, 1),
  };
  const stoneC = new THREE.Color(pal[6]); stoneC.lerp(new THREE.Color(seedV.warm > 0 ? '#b08a78' : '#8f9099'), Math.abs(seedV.warm) * 0.3);
  const palS = pal.slice(); palS[6] = '#' + stoneC.getHexString();
  const U = makeUniforms(pal, look, sunDir);
  const object = new THREE.Group(); object.name = 'chinar-water-terraces-hero';
  const bo = { foils: seedV.foils, pavFoils: seedV.pavFoils, scallops: seedV.scallops, finial: seedV.finial, terrace: opts.terrace !== false };
  // the tone of each carved piece of the gallery (end panels, frieze, coffers): a stream of its own, so no other deals differently
  bo.carve = ctx.core.makeRng(ctx.core.hashSeed('cwt-gallery-carve:' + ctx.seed));

  // ---- stone
  const pause = () => ctx.yield?.();
  const sb = await buildStone(palS, rng.fork ? rng.fork('stone') : rng, bo, pause);
  await pause();
  const stoneMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, metalness: 0 }), U, 'stone', { pars: GAL_NET, color: STONE_COLOR, rough: STONE_ROUGH, light: STONE_LIGHT });
  const stone = new THREE.Mesh(await sb.geometryAsync(pause), stoneMat); stone.frustumCulled = false; object.add(stone);
  let tris = sb.n / 3;
  await pause();

  // ---- pavilion
  const pv = await buildPavilion(pal, rng, bo, pause);
  await pause();
  const marbleMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.2, metalness: 0 }), U, 'marble', { color: MARBLE_COLOR, rough: MARBLE_ROUGH, light: MARBLE_LIGHT });
  const pav = new THREE.Mesh(await pv.b.geometryAsync(pause), marbleMat); object.add(pav);
  const metalMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3, metalness: 0.85 }), U, 'metal', { color: METAL_COLOR, light: METAL_LIGHT });
  object.add(new THREE.Mesh(pv.g.geometry(), metalMat));
  tris += (pv.b.n + pv.g.n) / 3;
  await pause();

  // ---- niches: 300 pots and what stands in them
  const potGeo = buildPotGeo(pal), flGeo = buildFlowerGeo(look);
  const flowerMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, metalness: 0 }), U, 'flower', { vpars: FLOWER_VPARS, vert: FLOWER_VERT, pars: GAL_NET, color: FLOWER_COLOR, light: FLOWER_LIGHT });
  const lamps = look === 'night';
  const pots = lamps ? null : new THREE.InstancedMesh(potGeo, metalMat, 300);
  const flowers = new THREE.InstancedMesh(flGeo, flowerMat, 300);
  const fcols = look === 'april' ? ['#efe9d2', '#f2d43a', '#f6f1e4', '#f0b92e'] : [pal[1], '#e8701a', '#f6c12a', pal[0]];
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new V3(), T = new V3(), Yax = new V3(0, 1, 0), col = new THREE.Color();
  for (let r = 0; r < 5; r++) for (let c = 0; c < 60; c++) {
    const i = r * 60 + c, sc = rng.range(0.9, 1.08);
    T.set(-GX + c + 0.5 + rng.range(-0.03, 0.03), 0.9 + r * 2.6 + 0.3, ZW + 0.27);
    Q.setFromAxisAngle(Yax, rng.range(0, 6.283)); S.set(sc, sc * rng.range(0.94, 1.1), sc);
    if (pots) { M.compose(T, Q, S); pots.setMatrixAt(i, M); }
    if (lamps) { Q.setFromAxisAngle(Yax, Math.PI / 2 + rng.range(-0.4, 0.4)); S.setScalar(rng.range(1.0, 1.25)); }
    else S.multiplyScalar(rng.range(0.92, 1.12));
    M.compose(T, Q, S); flowers.setMatrixAt(i, M);
    let k;
    if (seedV.arrange === 'rows') k = r % 3;
    else if (seedV.arrange === 'chevron') k = (Math.abs((c % 12) - 6) + r) % 3;
    else if (seedV.arrange === 'bands') k = Math.floor(c / 5) % 3;
    else k = rng.int(0, 2);
    if (rng.chance(0.06)) k = 3; else if (rng.chance(0.12)) k = rng.int(0, 2);
    col.set(fcols[k]).multiplyScalar(rng.range(0.82, 1.0)); flowers.setColorAt(i, lamps ? col.set('#ffffff') : col);
  }
  if (pots) { pots.frustumCulled = false; object.add(pots); tris += 300 * potGeo.attributes.position.count / 3; }
  flowers.frustumCulled = false; flowers.instanceColor.needsUpdate = true; object.add(flowers);
  tris += 300 * flGeo.attributes.position.count / 3;
  await pause();

  // ---- jets on the 14 m grid, left out round the pavilion, the causeways, the cascade foot and the camera's line
  const route = (opts.route || FLY).map((p) => (p.isVector3 ? [p.x, p.y, p.z] : p));
  const dSeg = (x, z, a, c) => { const dx = c[0] - a[0], dz = c[2] - a[2], l = dx * dx + dz * dz || 1, t = clamp(((x - a[0]) * dx + (z - a[2]) * dz) / l, 0, 1); return Math.hypot(x - a[0] - dx * t, z - a[2] - dz * t); };
  const jets = [], jdat = new Uint8Array(JNX * JNZ * 4);
  for (let iz = 0; iz < JNZ; iz++) for (let ix = 0; ix < JNX; ix++) {
    const x = JX0 + ix * JG, z = JZ0 - iz * JG;
    if (Math.abs(x) < 49 && Math.abs(z - PZ) < 49) continue;
    if ((Math.abs(x) < 9 && (z < 12 || z < PZ)) || Math.abs(z - PZ) < 9) continue;
    if (z < TZ1 + 5) continue;
    let dr = 1e9; for (let i = 0; i + 1 < route.length; i++) dr = Math.min(dr, dSeg(x, z, route[i], route[i + 1]));
    if (dr < 9) continue;
    // no two neighbours alike: tall thin plumes, low wide bells and the plain umbrella between them, and a ring of
    // the tallest standing round the pavilion
    // in groups, read from the wall top: a ring of the tallest plumes round the pavilion, low wide bells lining the
    // causeways, arches thrown in from the side walls in pairs, and between them a field that steps down in height
    // away from the pavilion; no two of a group quite the same height
    const sd = rng(), dP = Math.max(Math.abs(x), Math.abs(z - PZ)), way = Math.min(Math.abs(x), Math.abs(z - PZ)) < 16, hf = clamp((dP - 64) / 56, 0, 1);
    // the field is planted in beds, not sown on the grid: two by two the cells are umbrellas, a stand of thin spires, or left as open mirror
    const edgeArch = (ix === 0 || ix === JNX - 1) && iz % 2 === 0, bh = Math.sin(Math.floor((ix + 1) / 2) * 12.9898 + Math.floor(iz / 2) * 78.233) * 43758.5453, bed = bh - Math.floor(bh);
    if (dP >= 64 && !way && !edgeArch && bed < 0.3) continue;
    const k = dP < 64 ? [1.85 + 0.7 * sd, 0.36, 0] : way ? [0.27 + 0.14 * sd, 2.1, 0] : edgeArch ? [0.85 + 0.35 * sd, 1, 1]
      : bed > 0.72 ? [1.55 + 0.6 * sd, 0.07, 0] : [(1.5 - 0.95 * hf) * (0.75 + 0.5 * sd), clamp(0.5 + 1.2 * hf, 0.45, 1.7), 0];
    // beside the route a jet keeps its height but not its spread: its outermost water (2.1 x spread x 1.25, the drift and
    // the ribbon's own width) stays 7 m off the line that is flown
    if (k[2] < 0.5) k[1] = Math.min(k[1], Math.max(0.07, (dr - 8.8) / 2.625));
    jets.push({ x, z, group: (ix + iz * 2) % 3, seed: sd, k });
    jdat[(iz * JNX + ix) * 4] = 255;
  }
  const jetTex = new THREE.DataTexture(jdat, JNX, JNZ, THREE.RGBAFormat); jetTex.magFilter = jetTex.minFilter = THREE.NearestFilter; jetTex.needsUpdate = true;

  // ---- water
  const wg = new THREE.BufferGeometry(), wp = [], wkA = [];
  const zb = bo.terrace ? 150 : ZW + 1.3;
  const wquad = (xa, xb, za, zc, y, lip, jf) => {
    const x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), z0 = Math.min(za, zc), z1 = Math.max(za, zc);
    wp.push(x0, y, z0, x1, y, z1, x1, y, z0, x0, y, z0, x0, y, z1, x1, y, z1);
    for (let i = 0; i < 6; i++) wkA.push(lip, jf);
  };
  wquad(-TX, TX, TZ1, ZS + 2.2, 0, ZS, 0); wquad(-GX, GX, ZS + 0.5, zb, GH, ZS, 0);
  for (const c of opts.canals || []) wquad(c.x0, c.x1, c.z0, c.z1, c.y, c.lip ?? -1e4, c.jets ? 1 : 0);
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('wk', new THREE.Float32BufferAttribute(wkA, 2));
  const water = new THREE.Mesh(wg, makeWaterMaterial(U, jetTex)); water.frustumCulled = false; object.add(water);
  const sheet = makeSheet(U, { sheetSeed: seedV.sheetSeed, scallops: seedV.scallops }, detail); object.add(sheet);
  const allJets = jets.concat(opts.extraJets || []);
  const jetMesh = makeJets(U, allJets, seedV.jetH); object.add(jetMesh);
  const budGeo = buildBudGeo(), buds = new THREE.InstancedMesh(budGeo, metalMat, allJets.length);
  allJets.forEach((j, i) => { T.set(j.x, j.y || 0, j.z); Q.setFromAxisAngle(Yax, j.seed * 6.283); S.setScalar(1.1); M.compose(T, Q, S); buds.setMatrixAt(i, M); });
  buds.frustumCulled = false; object.add(buds);
  const mist = makeMist(U, rng, detail, opts.mist); object.add(mist);
  const veil = opts.veil === false ? null : makeVeil(U); if (veil) object.add(veil);
  tris += 4 + 60 * 14 * 2 + allJets.length * (90 + budGeo.attributes.position.count / 3) + mist.geometry.instanceCount * 2;
  await pause();

  const center = new V3(0, 8, -10);
  const cl = new V3(), fw = new V3(), sp = new V3(), sq = new V3();
  let burst = 0, veilSide = 0;
  const hero = {
    object, radius: 70, height: 29, center, ground: true, groundY: -0.6, footprint: { x: [-TX, TX], z: [TZ1, bo.terrace ? 150 : ZW + 1.3] }, triangles: Math.round(tris), jets, uniforms: U, stoneColor: palS[6], materials: { stone: stoneMat, metal: metalMat, marble: marbleMat },
    anchors: {
      flyThrough: FLY.map((p) => p.slice()), galleryLine: { from: [-33, 7.3, 92], to: [20, 7.3, 92] }, burst: [25, 6.5, 84],
      portalSeat: { position: [0, 9, PZ - 22], facing: [0, 0, 1], width: 14, height: 14 },
      viewpoints: {
        above: { position: [-22, 22, 132], look: [0, 6, -80] }, galleryIn: { position: [-33, 7.3, 92], look: [30, 6.5, 92.5] },
        galleryBack: { position: [26, 7.3, 92], look: [-30, 6.5, 92] }, niches: { position: [0, 7.3, 92], look: [5, 7, 100] },
        sheet: { position: [6, 7.3, 92.5], look: [-8, 6, 84] }, tank: { position: [30, 5, 66], look: [2, 9, -80] },
        approach: { position: [4, 9, -34], look: [0, 10, -104] }, inside: { position: [1, 9, -66], look: [0, 9.5, -104] },
      },
      nicheWall: { center: [0, 7.4, ZW], size: [60, 13] }, sheet: { center: [0, 8, ZS], size: [60, 16] },
      pavilion: { center: [0, PY, PZ], half: PH, floorY: PY, roofY: YT + 5.5 },
      tubs: [[-26, PY, PZ + 26], [26, PY, PZ + 26], [-26, PY, PZ - 26], [26, PY, PZ - 26], [-9.5, PY, PZ + 26], [9.5, PY, PZ + 26], [-9.5, PY, PZ - 26], [9.5, PY, PZ - 26]],
      carpet: [0, PY + 0.03, PZ], waterY: 0, basinY: GH, sunDir: sunDir.toArray(),
    },
    setProgress(k, side = 0) { burst = clamp(k, 0, 1); veilSide = side; },
    setLight(l = {}) {
      if (l.sunDir) U.uHcSun.value.copy(l.sunDir).normalize();
      const set = (u, v) => { if (v !== undefined) u.value.set(v); };
      if (l.sunColor !== undefined) U.uHcSunCol.value.copy(new THREE.Color(l.sunColor)).multiplyScalar(l.sunIntensity ?? 1.6);
      set(U.uHcSkyTop, l.skyTop); set(U.uHcSkyHor, l.skyHorizon); set(U.uHcBand, l.band); set(U.uHcTree, l.tree); set(U.uHcWater, l.water); set(U.uHcCaus, l.caustic);
      if (l.snow !== undefined) U.uHcSnow.value = l.snow;
      if (l.lamp !== undefined) U.uHcLamp.value = l.lamp;
      if (l.leaves !== undefined) water.material.uniforms.uLeafAmt.value = l.leaves;
      if (l.leafMore !== undefined) water.material.uniforms.uLeafMore.value = l.leafMore;
      if (l.gard) U.uHcGard.value.fromArray(l.gard);
      if (l.mist !== undefined) U.uHcMist.value = l.mist;
      set(U.uHcPortal, l.portal);
    },
    update(dt, time, camera) {
      U.uHcTime.value = time;
      if (!camera) return;
      object.updateMatrixWorld();
      cl.setFromMatrixPosition(camera.matrixWorld); object.worldToLocal(cl); U.uHcCam.value.copy(cl);
      camera.getWorldDirection(fw);
      // the tear in the sheet follows the eye: it opens as the camera closes on the plane and heals behind it
      const dz = cl.z - ZS; let r = 0;
      if (opts.hole !== false && Math.abs(cl.x) < 36 && cl.y < 15.5 && dz < 7.5 && dz > -18) r = 9.5 * (dz > 0 ? 1 - smoothstep(1, 7.5, dz) : 1 - smoothstep(5, 18, -dz));
      const tp = clamp(dz / Math.max(-fw.z, 0.35), -14, 14);
      U.uHcHole.value.set(cl.x + fw.x * tp, cl.y + fw.y * tp, r, 0);
      // flying along the gallery the sheet is seen at a grazing angle: its threads turn the view toward the garden
      // (about 60 degrees), easing to nothing as the camera swings round to face the water and go through it
      const inG = cl.z > ZS - 1.5 && cl.y < 16 && Math.abs(cl.x) < 62 ? 1 : 0;
      const beta = 0.95 * inG * smoothstep(0.42, 0.85, Math.abs(fw.x)) * (fw.x < 0 ? 1 : -1);
      U.uHcBend.value.set(Math.cos(beta), Math.sin(beta));
      const k = burst;
      U.uHcBurst.value = k; if (veil) veil.visible = k > 0.001 && k < 0.999;
      // where the sun stands on the screen, for the gold in the spray
      sq.setFromMatrixPosition(camera.matrixWorld); sp.copy(U.uHcSun.value).transformDirection(object.matrixWorld).multiplyScalar(1000).add(sq);
      const ahead = fw.dot(U.uHcSun.value) > 0.05; sp.project(camera);
      U.uHcVeil.value.set(veilSide, ahead ? clamp(sp.x, -2, 2) : 0, ahead ? clamp(sp.y, -2, 2) : 0, ahead ? 1 : 0);
    },
    dispose() { jetTex.dispose(); },
  };
  return hero;
}

export { makeB, archPanel, archPts, patch, HC_PARS };
