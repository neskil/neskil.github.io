// Hero set piece for "banyan-homecoming": THE HALL of the tree that is a forest.
//
// One banyan a kilometre across. From above it is a lumpy green dome with a dark hole (the oculus, where
// the mother trunk died) and a funnel of flying foxes turning over it and pouring in. Underneath it is a
// nave: thousands of pale root pillars (braided columns with flared feet, poles, hanging threads), a roof
// of dark limbs hung with bats, and long level blades of gold light from every gap in the leaves.
// Round five: the bark is dark and solid at any range with a warm rim on its sunward edge; the roof underside
// is hung with layered leaf masses (ragged, with hanging sprays); ferns sit on the columns and boughs; grass and
// fig seedlings stand in every pool of light; and the elder giant is the MOTHER TRUNK with its hollow.
//
// COORDINATES (local): origin at the centre of the dome on the floor, +Y up. North is -Z, east is +X, so
// the front (+Z) is the SOUTH side the camera arrives from. A compass heading h is (sin h, 0, -cos h).
//   dome       ellipse 1000 m (X) by 640 m (Z), 26-32 m high          anchors.bounds
//   oculus     90 m hole centred (0, *, 120), floor = the courtyard   anchors.oculus
//   hall       floor y ~0.2, ceiling of limbs 13-20 m, pillars 12.5 m apart on average
//
// WHAT IS BUILT (everything animates in shaders, one draw call each, about 20 in all, about 230k triangles,
// ~400 ms to build, no lights and no render targets; one 1024 px canvas texture):
//   dome       a tensor grid (3 m cells under the approach) shaded as florets of leaf with gust bands, plus
//              ~3,500 instanced leaf clumps along the approach, round the lip of the well and on the skyline;
//              from above the hall under the well goes dark (uMist.w), so the oculus is a black oval
//   courtyard  tussock grass, fig saplings (stem + clumps + long multiplied shadows), sun through the well
//              (courtSun), root curtains and hanging sprays round the lip
//   mist       weather 'fog': strata in the haze and a patchy ground layer that catches the sun (hallHaze)
//   bark       every pillar (3 tiers by distance from the route), limbs, surface roots, the exit arch
//   floor      leaf litter with light bars; litter cards that lift and whirl in the camera's wake
//   ceiling    leaf roof seen from below with glowing gaps; dome shell seen from above; leaf sprays
//   threads    hanging aerial roots (ribbons, never thinner than ~1.5 px) swaying
//   light      one SUN MASK texture (canopy gaps + oculus) looked up by every hall material at the
//              fragment slid along the sun to roof height, so floor bars, lit pillar faces, shafts and
//              dust agree; additive shaft slabs; the courtyard's standing column of gold; dust and gnats
//   bats       ~3000 hung in the roof (swaying, some fanning a wing), ~1700 flying (stream from the south,
//              funnel over the oculus, pour down it), ~50 landers that brake, flip, hook on and hang
//
// opts
//   palette   [peach, gold, amber, cream, leaf, deep green, peacock]  (brief palette by default)
//   hour      'sunrise' (default; 'golden' is the same) | 'day' (sun 28 deg, whiter, shorter shafts) |
//             'night' (low full moon in the west, silver-blue shafts from the other side)
//   season    'flush' (default: copper new leaves, thin roof) | 'figs' (red twigs) | 'monsoon' (thick roof,
//             few intense shafts, moss on the pillars)
//   weather   'clear' (default) | 'fog' (knee-deep white on the floor) | 'shower' (dark glossy bark)
//   density   0.8..1.2 pillar and bat density (default 1)
//   sunDir    THREE.Vector3 toward the sun, overrides the hour's direction
//   path      a makePath() route to use instead of the built-in one (clearances are cut around it)
//
// anchors (all local space)
//   flyThrough   ordered [x,y,z] points of the route in the brief: enter 48 m up south-south-west of the
//                rim, sink over the dome, dive through the oculus, loop left through the hall and run the
//                avenue to the arch. Every pillar keeps >= 6 m from it, limbs >= 5 m, threads >= 3 m.
//                Feed it straight to makePath().
//   portalSeat   { position, facing } centre of the 14 m ring under the arch of two fused pillars and the
//                unit vector pointing back up the avenue (toward the arriving camera)
//   oculus       { center, radius, rimY } ; courtyard { center, radius } ; funnelTop (bat funnel apex)
//   stream       { from, to } the axis of the colony's incoming stream (the bats on the wing fly in along it to the well)
//   sunDir       unit vector toward the sun (bearing 96, 8 deg up at sunrise) ; sunColor (linear)
//   viewpoints   named { position, target } views for the part viewer: entry, dive, firstHall, nave, column, avenue
//   stations     { chital, peacockA, peacockB, langurs, glider } good shaft-lit spots for the world's animals
//   bounds       { rx, rz, height } true size of the dome (radius/height below are viewer framing only)
//   perches      positions of the keyed landers (bats that land as the camera passes)
//
// hooks: setProgress(u) keys the twelve landers to the route (without it they loop on time, for the
//   viewer); setHaze(color, density); setWake(strength). update(dt, time, camera) drives everything else.
//
// lighting: self-lit. Every material is a ShaderMaterial with its own sun, shade, bounce and hall haze,
//   plus scene fog (use a pale FogExp2 of ~0.0005). Scene lights are ignored. Wants bloom on.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#F3D9B8', '#FFC766', '#E8892B', '#CFC3A8', '#5E8F3A', '#173A26', '#0E6F8E'];
const RX = 500, RZ = 320;                 // dome half-axes
const OC = { x: 0, z: 120, r: 45 };       // oculus / courtyard
const MASK_SPAN = 1152, MASK_PX = 1024;   // sun mask covers +-576 m
const TAU = Math.PI * 2;

const ROUTE = [
  // the approach: in low over the plain, slantwise on the tree's southern rim so that it runs away ahead as a wall of leaf
  // with the plain beside it, then a left turn up over the rim with
  // the crown tops close below, on up to 57 m to look down the well, then the dive. Its length is trimmed so that every
  // u under the roof falls where it fell before (the hall's layout and beats are keyed to u).
  [-109.061, 31.313, 367.076], [-93.05, 30.2, 351.6], [-79, 30.6, 336], [-62, 37, 290], [-30, 57, 202], [-15, 35, 160], [-8, 21, 134], [-4, 9.5, 110],
  [0, 4.4, 88], [6, 4, 60], [16, 3.6, 22], [11, 3.5, -18], [15, 3.5, -56], [0, 3.5, -98],
  [-30, 3.5, -128], [-66, 3.5, -140], [-102, 4, -131], [-130, 5, -108], [-144, 6.5, -75],
  [-146, 8.5, -40], [-137, 10, -5], [-121, 8.5, 30], [-92, 6.8, 46], [-64, 5.2, 58], [-42, 4.5, 74],
  [-30, 4.2, 96], [-30.5, 4.4, 120], [-38, 5, 142], [-80.75, 7.5, 259.5],
];
// the two giants of the mother grove: G1 on our left as we turn south into the grove (seen from its shaded side, dark
// against the lit haze), G2 (the elder) dead ahead down the grove and passed close on our right, its sunward face to us
// (the elder is the MOTHER TRUNK: a wall of fused roots 13 m through with a hollow a deer could shelter in, its mouth
// turned to us as we come down the grove, the low sun on its left flank)
const GIANTS = [{ x: -130.5, z: -71.4, R: 3.9, seed: 3.1 }, { x: -149.5, z: 21.5, R: 6.4, seed: 8.7, mother: true }];
// the rain pool lying in a hollow of the hall floor north of the courtyard: a capsule A-B with a ragged shore (GL_POOL)
const POOL = { ax: 10, az: 44, bx: 13, bz: -12, w: 15, y: 0 };
const SPIT = ['9., 23.5', '2.6', '4., 27.5', '2.3', '-1.5, 31.5', '3.', '-7.5, 34.5', '3.8'];      // centre, radius of each hummock (glsl)

// ---------------------------------------------------------------------------------------------------
// GLSL shared by every hall material
// ---------------------------------------------------------------------------------------------------
const GL_COMMON = /* glsl */`
uniform sampler2D uMask;
uniform vec3 uSunDir, uSunH, uSunCol, uShade, uBounce, uSkyAmb, uHazeCol, uCam;
uniform vec4 uHall;   // x roof height, y haze density, z time, w 1/mask span
uniform vec4 uWx;     // x ground fog, y wet, z moss, w night
uniform vec4 uMist;   // x ground mist density, y strata in the haze, z sun caught by the mist, w dimming when seen from above the dome
uniform vec3 uMistCol;
uniform vec4 uOc;     // courtyard x, z, radius, how far the low sun reaches across its floor
uniform vec4 uRing;   // the exit ring: centre, strength of the light it throws on the arch and the floor round it
uniform vec3 uRingCol;
uniform vec4 uG1, uG2, uHol, uHolD;   // the giants (x, z, radius, depth of the shade pooled at the foot); the mother's hollow (x, z, radius, depth) and its axis (x, z, half length)
uniform vec4 uWrap;   // x glow of the sunward haze on whatever faces it, y warm rim on bark, z share of the haze laid on bark, w cool cast of the haze away from the sun
uniform vec4 uStage;  // x 1 while the camera is above the roof (the hall under the eave of the well is then in deep shade), y side light on bark, z depth tone of far bark, w spare
float hash11(float n){ return fract(sin(n * 127.1) * 43758.5453); }
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y);
}
float fbm2(vec2 p){ return vnoise(p) * .55 + vnoise(p * 2.13 + 7.1) * .3 + vnoise(p * 4.7 + 3.3) * .15; }
// the rain pool: metres outside its ragged shore (negative over the water)
float poolD(vec2 p){
  vec2 a = vec2(${POOL.ax.toFixed(1)}, ${POOL.az.toFixed(1)}), ba = vec2(${(POOL.bx - POOL.ax).toFixed(1)}, ${(POOL.bz - POOL.az).toFixed(1)}), pa = p - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.);
  float dc = length(pa - ba * h) - (${POOL.w.toFixed(1)} + 6. * vnoise(p * .07 + 3.) + 2. * vnoise(p * .31));
  // a spit of mud runs out into it from the west shore, and ends in an islet
  float rg = 1.2 * vnoise(p * .45 + 7.) + .5 * vnoise(p * 1.3);
  float isl = min(min(length(p - vec2(${SPIT[0]})) - ${SPIT[1]} - rg, length(p - vec2(${SPIT[2]})) - ${SPIT[3]} - rg), min(length(p - vec2(${SPIT[4]})) - ${SPIT[5]} - rg, length(p - vec2(${SPIT[6]})) - ${SPIT[7]} - rg));
  return max(dc, -isl);
}
// the courtyard is open to the sky: sun on its floor on the side away from the sun, the rim's lumpy shadow on the near side
float courtSun(vec3 P){
  vec2 q = P.xz - uOc.xy;
  float inC = 1. - smoothstep(uOc.z - 2., uOc.z + 2.5, length(q));
  float edge = -dot(q, uSunH.xz) + uOc.z * uOc.w + (vnoise(q * .07 + 3.) - .5) * 24. + (vnoise(q * .31) - .5) * 6.;
  return inC * smoothstep(-1.7, 1.7, edge);
}
// direct sun reaching P: the mask at P slid along the sun to roof height, flickered by moving leaves
float sunVis(vec3 P){
  float t = max(uHall.x - P.y, 0.) / max(uSunDir.y, .03);
  t += (vnoise(P.xz * .43 + P.y * .29) - .5) * 9. + (vnoise(P.xz * 1.9 + P.y * 1.3) - .5) * 2.5;
  vec2 q = P.xz + uSunDir.xz * t;
  float m = texture2D(uMask, q * uHall.w + .5, 1.2).r;
  float fl = .7 + .3 * vnoise(q * .33 + vec2(uHall.z * .21, uHall.z * .13));
  float brk = .3 + .7 * smoothstep(.28, .62, vnoise(P.xz * 1.15 + P.y * 1.7 + 3. + uHall.z * vec2(.3, .21)));     // leaf shadows break the bars up
  return max(m * fl * brk, courtSun(P));
}
// open sky straight overhead, blurred (pools of cool light under gaps, the courtyard, the rim)
float skyVis(vec3 P){ return texture2D(uMask, P.xz * uHall.w + .5, 3.5).r; }
float footShade(vec3 P){     // whatever is as big as a giant stands in a pool of its own shade; the hollow is dark inside
  float low = 1. - smoothstep(1., 9., P.y);
  float a = uG1.w * (1. - smoothstep(uG1.z * .9, uG1.z * 2.3, length(P.xz - uG1.xy))) + uG2.w * (1. - smoothstep(uG2.z * .9, uG2.z * 2.1, length(P.xz - uG2.xy)));
  return 1. - min(a, .6) * low;
}
float hollowIn(vec3 P){      // inside the mother's hollow: no sun, hardly any sky
  vec2 hd = P.xz - uHol.xy; float al = clamp(dot(hd, uHolD.xy), -uHolD.z, uHolD.z);
  return uHol.w * (1. - smoothstep(uHol.z * .6, uHol.z, length(hd - uHolD.xy * al))) * (1. - smoothstep(7.5, 11., P.y));
}
vec3 hallLight(vec3 P, vec3 N, float ao){
  float hol = hollowIn(P);
  ao *= footShade(P) * (1. - .8 * hol);
  float sv = sunVis(P) * (1. - hol), kv = skyVis(P);
  float ndl = dot(N, uSunDir);
  float dif = clamp(ndl * .8 + .2, 0., 1.);
  vec3 amb = uShade * (.62 + .38 * N.y) + uBounce * (.5 - .5 * N.y) + uSkyAmb * kv * (.55 + .45 * N.y);
  vec3 rd = P - uRing.xyz; float rk = uRing.w / (1. + dot(rd, rd) * .011);
  float wr = max(dot(N, uSunH), 0.);
  vec3 inHol = uBounce * hol * (.5 + .5 * max(dot(N.xz, uHolD.xy), 0.)) * 1.5 * (1. - uWx.w * .6);      // the hollow's own light: day bounced in off the litter at its mouth, warm on whatever faces out
  return uSunCol * sv * dif + amb * ao + inHol + uSunCol * uWrap.x * wr * wr * (.4 + .6 * ao) * (1. - hol) + uRingCol * rk * (.6 + .4 * dot(N, -rd / max(length(rd), 1e-3)));
}
vec3 hallHaze(vec3 col, vec3 P){
  vec3 v = P - uCam; float d = length(v); vec3 vd = v / max(d, 1e-3);
  float s = max(dot(vd, uSunH), 0.), kv = skyVis(P), t = uHall.z;
  // strata: the haze lies in soft layers between the trunks (misty weather only)
  float strata = 1. + uMist.y * (vnoise(vec2(P.y * .45 + vnoise(P.xz * .013 + 5.) * 3.5, t * .012 + P.x * .004)) - .42) * 1.7;
  strata *= 1. - uMist.y * .6 * smoothstep(3., 13., P.y);          // mist is a thing of the floor: the roof stays dark and green
  float ro = length(P.xz - uOc.xy);
  float cw = uStage.w * smoothstep(uOc.z - 3., uOc.z + 7., ro) * (1. - smoothstep(13., 19., P.y)) * smoothstep(18., 55., d);      // from the open court the hall under the eave is seen through clear air, in the roof's shade
  float h = (1. - exp(-d * uHall.y * max(strata, .25))) * (1. - .72 * cw);
  float away = 1. - smoothstep(-.35, .55, dot(vd, uSunH));
  vec3 hc = uHazeCol * mix(vec3(1.), vec3(.74, .98, 1.1), uWrap.w * away) * (1. + .5 * kv) + uSunCol * .045 * s * s * s;
  // the deep hall, far from the light well: the air between the trunks is leaf-shade, greener and darker than the mist by the well
  hc *= mix(vec3(1.), vec3(.6, .84, .64), smoothstep(uOc.z + 95., uOc.z + 165., ro) * (1. - uWx.w));
  col = mix(col, hc, h);
  if (uMist.x > 0.) {
    // ground mist: an exponential layer on the floor, integrated along the line of sight, so the litter shows through
    // under us and the far pillars stand in a bright floor; patchy, drifting, torn where our wings pass
    float y0 = max(uCam.y, 0.), y1 = max(P.y, 0.), dy = y1 - y0;
    float e0 = exp(-y0 / 1.4), e1 = exp(-y1 / 1.4);
    float avg = abs(dy) > .05 ? 1.4 * (e0 - e1) / dy : e0;
    vec2 mp = P.xz;
    float ptc = vnoise(mp * .045 + vec2(t * .02, -t * .013)) * .5 + vnoise(mp * .13 + vec2(-t * .04, t * .03)) * .28 + vnoise(mp * vec2(.47, .21) + vec2(t * .07, -t * .05)) * .22;   // banks, patches, wisps
    float tear = smoothstep(2., 13., length(mp - uCam.xz));
    float tau = uMist.x * d * avg * (.03 + 2.1 * ptc * ptc * ptc) * (.25 + .75 * tear);
    tau *= 1. - .75 * (1. - smoothstep(uOc.z - 8., uOc.z + 6., length(mp - uOc.xy)));      // burnt off where the courtyard is open to the sun
    float gf = (1. - exp(-tau)) * (1. - .55 * smoothstep(.08, .45, -vd.y)) * (1. - .75 * uStage.x) * (1. - .72 * cw);     // looked down on, a thin layer shows the floor through it
    float lit = texture2D(uMask, (mp + uSunDir.xz * ((uHall.x - 1.5) / max(uSunDir.y, .03))) * uHall.w + .5, 2.5).r;
    lit = max(lit, courtSun(P));
    vec3 mc = uMistCol * (.6 + .4 * kv) + uSunCol * uMist.z * (lit * (.4 + .6 * s * s) + .1 * s * s);
    col = mix(col, mc, gf * .92);
  }
  col *= mix(vec3(1.), vec3(.6, .7, .62), cw);
  float eave = uStage.x * smoothstep(uOc.z - 1., uOc.z + 5., ro) * (1. - smoothstep(uOc.z + 45., uOc.z + 95., ro)) * (1. - smoothstep(13., 19., P.y));
  return col * uMist.w * mix(vec3(1.), vec3(.3, .4, .43), eave);      // from the air, whatever stands under the eave of the well is in the roof's shade
}
`;
const GL_FOG_V = /* glsl */`#include <fog_pars_vertex>\n`;
const GL_FOG_F = /* glsl */`#include <fog_pars_fragment>\n`;

function hexLin(h) { return new THREE.Color(h); }
function mix3(a, b, t) { return a.clone().lerp(b, t); }

// growable vertex store: pos(3) nrm(3) uv(2) col(3)
class Store {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.i = []; this.count = 0; }
  v(x, y, z, nx, ny, nz, u, v, r, g, b) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.u.push(u, v); this.c.push(r, g, b); return this.count++;
  }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.u), 2));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(this.i), 1));
    return g;
  }
  async geometryY(ctx) {            // the same, a breath between the big array copies
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3)); await ctx.yield();
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3)); await ctx.yield();
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.u), 2));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3)); await ctx.yield();
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(this.i), 1)); await ctx.yield();
    return g;
  }
}

// Loft a tube along axis(t) -> [x,y,z] with radius rad(t, a) into a Store.
// ts: ring parameters; sides: vertices round; col(t, a, lobe) -> [r,g,b]; uScale: strand cycles round.
function loft(S, axis, rad, ts, sides, col, uScale, vScale, geoN) {
  const rings = ts.length, base = S.count;
  const c = [0, 0, 0], c2 = [0, 0, 0];
  for (let i = 0; i < rings; i++) {
    const t = ts[i];
    axis(t, c); axis(Math.min(1, t + 0.02), c2);
    let tx = c2[0] - c[0], ty = c2[1] - c[1], tz = c2[2] - c[2];
    if (tx * tx + ty * ty + tz * tz < 1e-10) { axis(Math.max(0, t - 0.02), c2); tx = c[0] - c2[0]; ty = c[1] - c2[1]; tz = c[2] - c2[2]; }
    const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    // frame
    let ux, uy, uz;
    if (Math.abs(ty) > 0.8) { ux = 1 - tx * tx; uy = -tx * ty; uz = -tx * tz; } else { ux = -ty * tx; uy = 1 - ty * ty; uz = -ty * tz; }
    const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux;
    for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const r = rad(t, a);
      const nx = ca * ux + sa * vx, ny = ca * uy + sa * vy, nz = ca * uz + sa * vz;
      const k = col(t, a);
      S.v(c[0] + nx * r, c[1] + ny * r, c[2] + nz * r, nx, ny, nz, (j / sides) * uScale, t * vScale, k[0], k[1], k[2]);
    }
  }
  const w = sides + 1;
  for (let i = 0; i < rings - 1; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * w + j;
    S.quad(a, a + 1, a + w + 1, a + w);
  }
  if (geoN) {          // normals of the lofted surface (flutes, fins and flares catch the light), kept on the side the ring normal was on
    const P = S.p, N = S.n;
    for (let i = 0; i < rings; i++) for (let j = 0; j <= sides; j++) {
      const jj = j === sides ? 0 : j, o = (base + i * w + j) * 3;
      const a = (base + i * w + (jj === 0 ? sides - 1 : jj - 1)) * 3, b = (base + i * w + jj + 1) * 3, c = (base + Math.max(0, i - 1) * w + j) * 3, d = (base + Math.min(rings - 1, i + 1) * w + j) * 3;
      const ax = P[b] - P[a], ay = P[b + 1] - P[a + 1], az = P[b + 2] - P[a + 2], bx = P[d] - P[c], by = P[d + 1] - P[c + 1], bz = P[d + 2] - P[c + 2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz);
      if (l < 1e-9) continue;
      const s = (nx * N[o] + ny * N[o + 1] + nz * N[o + 2] < 0 ? -1 : 1) / l;
      N[o] = lerp(N[o], nx * s, geoN); N[o + 1] = lerp(N[o + 1], ny * s, geoN); N[o + 2] = lerp(N[o + 2], nz * s, geoN);
      const l2 = Math.hypot(N[o], N[o + 1], N[o + 2]) || 1; N[o] /= l2; N[o + 1] /= l2; N[o + 2] /= l2;
    }
  }
}
// An upright trunk lofted at chosen angles round its axis (finer where its form is finest), with the normals of the surface itself.
function loftTrunk(S, cx, cz, y0, H, rad, ts, angs, col, uScale) {
  const nr = ts.length, na = angs.length, P = new Float32Array(nr * na * 3), C = new Float32Array(nr * na * 3), base = S.count, a0 = angs[0];
  for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) {
    const a = angs[j], r = rad(ts[i], a), k = col(ts[i], a), o = (i * na + j) * 3;
    P[o] = cx + Math.cos(a) * r; P[o + 1] = y0 + ts[i] * H; P[o + 2] = cz + Math.sin(a) * r; C[o] = k[0]; C[o + 1] = k[1]; C[o + 2] = k[2];
  }
  for (let i = 0; i < nr; i++) for (let j = 0; j < na; j++) {
    const o = (i * na + j) * 3, a = (i * na + (j === 0 ? na - 2 : j - 1)) * 3, b = (i * na + (j === na - 1 ? 1 : j + 1)) * 3, c = (Math.max(0, i - 1) * na + j) * 3, d = (Math.min(nr - 1, i + 1) * na + j) * 3;
    const ax = P[b] - P[a], ay = P[b + 1] - P[a + 1], az = P[b + 2] - P[a + 2], bx = P[d] - P[c], by = P[d + 1] - P[c + 1], bz = P[d + 2] - P[c + 2];
    let nx = by * az - bz * ay, ny = bz * ax - bx * az, nz = bx * ay - by * ax; const l = Math.hypot(nx, ny, nz) || 1;
    nx /= l; ny /= l; nz /= l;
    S.v(P[o], P[o + 1], P[o + 2], nx, ny, nz, ((angs[j] - a0) / TAU) * uScale, ts[i] * H, C[o], C[o + 1], C[o + 2]);
  }
  for (let i = 0; i < nr - 1; i++) for (let j = 0; j < na - 1; j++) { const a = base + i * na + j; S.quad(a, a + na, a + na + 1, a + 1); }
}

// ---------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('banyan-hall'), noise = ctx.noise;
  // everything added in the rebuild draws from its own generators, so the hall as first laid out keeps its layout
  const xr = (label) => makeRng(hashSeed('banyan-' + label + ':' + ctx.seed));
  const detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(hexLin);
  const [cPeach, cGold, cAmber, cCream, cLeaf, cDeep, cPeacock] = pal;
  const hour = opts.hour === 'day' ? 'day' : opts.hour === 'night' ? 'night' : 'sunrise';
  const season = opts.season === 'figs' ? 'figs' : opts.season === 'monsoon' ? 'monsoon' : 'flush';
  const weather = opts.weather === 'fog' ? 'fog' : opts.weather === 'shower' ? 'shower' : 'clear';
  const density = clamp(opts.density ?? 1, 0.8, 1.2);
  const group = new THREE.Group(); group.name = 'banyan-hall';

  // ---- sun -----------------------------------------------------------------------------------------
  const sunBear = (hour === 'night' ? 262 : hour === 'day' ? 102 : 96) * Math.PI / 180;
  const sunEl = (hour === 'night' ? 11 : hour === 'day' ? 28 : 8) * Math.PI / 180;
  const sunDir = opts.sunDir ? opts.sunDir.clone().normalize()
    : new THREE.Vector3(Math.sin(sunBear) * Math.cos(sunEl), Math.sin(sunEl), -Math.cos(sunBear) * Math.cos(sunEl));
  if (sunDir.y < 0.05) { sunDir.y = 0.05; sunDir.normalize(); }
  const sunH = new THREE.Vector3(sunDir.x, 0, sunDir.z); if (sunH.lengthSq() < 1e-6) sunH.set(1, 0, 0); sunH.normalize();
  const white = new THREE.Color(1, 1, 1);
  const sunCol = hour === 'night' ? new THREE.Color(0.55, 0.7, 1.0).multiplyScalar(2.1)
    : hour === 'day' ? mix3(cGold, white, weather === 'fog' ? 0.3 : 0.5).multiplyScalar(weather === 'fog' ? 3.0 : 3.3) : mix3(cGold, white, 0.3).multiplyScalar(2.5);
  const shaftCol = hour === 'night' ? new THREE.Color(0.5, 0.66, 1.0) : hour === 'day' ? mix3(cGold, white, weather === 'fog' ? 0.14 : 0.4) : mix3(cGold, cPeach, 0.25);
  const ROOF = 16;

  // ---- route ---------------------------------------------------------------------------------------
  const route = ROUTE.map((p) => p.slice());
  const path = opts.path || makePath(route);
  const NS = 560, sx = new Float32Array(NS + 1), sy = new Float32Array(NS + 1), sz = new Float32Array(NS + 1);
  { const v = new THREE.Vector3(); for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, v); sx[i] = v.x; sy[i] = v.y; sz[i] = v.z; } }
  const avenueU = 1 - 128 / path.length;
  // nothing stands between us and the mother trunk as we come down the grove toward it
  const sightM = (() => {
    const G = GIANTS[1], pts = [0.672, 0.688, 0.704].map((u) => path.pointAt(u));
    return (x, z, rad) => {
      for (const a of pts) { const dx = G.x - a.x, dz = G.z - a.z, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz), 0, 1); if (Math.hypot(x - a.x - dx * t, z - a.z - dz * t) < rad) return true; }
      return false;
    };
  })();
  // nearest route sample that is under the roof (y < 13): { d, i }; and nearest in 3D
  const near = { d: 0, i: 0 };
  function routeNear(x, z) {
    let best = 1e12, bi = 0;
    for (let i = 0; i <= NS; i++) { if (sy[i] > 13) continue; const dx = sx[i] - x, dz = sz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
    near.d = Math.sqrt(best); near.i = bi; return near;
  }
  function routeDist3(x, y, z) {
    let best = 1e12;
    for (let i = 0; i <= NS; i += 2) { const dx = sx[i] - x, dy = sy[i] - y, dz = sz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < best) best = d; }
    return Math.sqrt(best);
  }
  const iLow0 = (() => { for (let i = 0; i <= NS; i++) if (sy[i] < 13) return i; return 0; })();

  // ---- shape of the tree ---------------------------------------------------------------------------
  const nOff = rng.range(0, 500);
  const rho = (x, z) => Math.sqrt((x / RX) * (x / RX) + (z / RZ) * (z / RZ));
  const ocDist = (x, z) => Math.hypot(x - OC.x, z - OC.z);
  const floorY = (x, z) => 0.16 + 0.14 * noise.n2(x * 0.021 + nOff, z * 0.021);
  // over the two giants the roof stands 7 m higher (a crossing in the nave) and the dome carries an emergent crown
  const GA = GIANTS[0], GB = GIANTS[1], gdx = GB.x - GA.x, gdz = GB.z - GA.z, gl2 = gdx * gdx + gdz * gdz;
  const liftK = (x, z) => {
    const h = clamp(((x - GA.x) * gdx + (z - GA.z) * gdz) / gl2, -0.12, 1.12);
    return 1 - smoothstep(16, 56, Math.hypot(x - GA.x - gdx * h, z - GA.z - gdz * h));
  };
  const giantD = (x, z) => Math.min(Math.hypot(x - GA.x, z - GA.z) - GA.R, Math.hypot(x - GB.x, z - GB.z) - GB.R);      // to the nearer giant's bark
  const poolIn = (x, z) => {        // metres inside the pool's mean shore (positive over water)
    const bx = POOL.bx - POOL.ax, bz = POOL.bz - POOL.az, h = clamp(((x - POOL.ax) * bx + (z - POOL.az) * bz) / (bx * bx + bz * bz), 0, 1);
    return POOL.w + 4 - Math.hypot(x - POOL.ax - bx * h, z - POOL.az - bz * h);
  };
  const ceilY = (x, z) => 16.2 + 3.2 * noise.fbm2(x * 0.011 + nOff, z * 0.011 - 4, 3) + 7.5 * liftK(x, z);
  // sub-crowns: every limb system makes its own rounded head, so the dome is a field of domes with dark creases
  function crownH(x, z, cs = 26) {
    const gx = Math.floor(x / cs), gz = Math.floor(z / cs); let best = 9;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
      const cx = gx + i, cz = gz + j, h1 = Math.sin(cx * 127.1 + cz * 311.7 + nOff) * 43758.5453, h2 = Math.sin(cx * 269.5 + cz * 183.3 + nOff * 1.7) * 43758.5453;
      const px = (cx + 0.15 + 0.7 * (h1 - Math.floor(h1))) * cs, pz = (cz + 0.15 + 0.7 * (h2 - Math.floor(h2))) * cs;
      const k = 0.3 + 0.2 * (h1 * 7.13 - Math.floor(h1 * 7.13)), d = ((x - px) * (x - px) + (z - pz) * (z - pz)) / (cs * cs * k);
      if (d < best) best = d;
    }
    const v = Math.max(0, 1 - best);
    return 0.35 * v + 0.65 * Math.sqrt(v);          // rounded heads that meet in creases
  }
  function domeY(x, z) {
    const r = Math.min(rho(x, z), 1), r2 = r * r, e = Math.pow(Math.max(0, 1 - r2 * r2 * r2), 0.42);
    const lump = Math.abs(noise.n2(x / 62 + nOff, z / 62 + 9));
    const big = crownH(x, z);
    let b = (1 - lump) * 3.4 - 2.2 + 6.6 * big + 1.5 * crownH(x + 40, z - 17, 9.5) * (0.35 + 0.65 * big) + 0.6 * noise.n2(x / 19 - 3, z / 19 + nOff);
    // round the well the far (north) lip stands a little proud and the lip we come in over sits low, so the hole shows from afar
    const od = Math.hypot(x - OC.x, z - OC.z), w = 1 - smoothstep(OC.r + 8, OC.r + 62, od);
    if (w > 0) { const nn = -(z - OC.z) / Math.max(od, 1); b += w * (nn > 0 ? 3.2 * nn : 3.4 * nn); }
    return 9 + e * (17 + b + 6.5 * liftK(x, z));
  }
  // the low sun rakes the dome: a crown is lit on its sunward flank and top, and lies in the long shadow of the next
  // crown otherwise. sunReach() marches toward the sun over the height field; macroLight() adds the slope of the big form
  const tanElS = Math.min(sunDir.y / Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z)) * 1.6, 0.26) / 1.6, SHS = [5, 11, 19, 30, 46];      // the crowns are modelled as by a low sun at any hour
  const sunLow = new THREE.Vector3(sunH.x, Math.min(sunDir.y / Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z)), 0.27), sunH.z).normalize();
  const domeTop = (x, z) => (rho(x, z) > 1 || ocDist(x, z) < OC.r ? 0 : domeY(x, z));
  function sunReach(x, y, z) {
    let ex = -9;
    for (let k = 0; k < 5; k++) { const s = SHS[k], h = domeTop(x + sunH.x * s, z + sunH.z * s) - (y + s * tanElS * 1.6); if (h > ex) ex = h; }
    return 1 - smoothstep(-0.8, 1.8, ex);
  }
  const ML = [0, 0, 0];      // reach, wrapped diffuse of the big form, crown height 0..1
  function macroLight(x, y, z) {
    const gx = (domeY(x + 4, z) - domeY(x - 4, z)) / 8, gz = (domeY(x, z + 4) - domeY(x, z - 4)) / 8, l = Math.hypot(gx, 1, gz);
    const reach = sunReach(x, y, z);
    const ndl2 = (-gx * sunLow.x + sunLow.y - gz * sunLow.z) / l;
    ML[0] = reach; ML[1] = smoothstep(-0.12, 0.5, ndl2) * lerp(0.05, 1, reach); ML[2] = crownH(x, z);
    return ML;
  }
  // mother grove: the thickest columns, west of the courtyard on the southbound leg
  const grove = { x: -138 + 0.25 * rng.range(-8, 8), z: -24 + 0.25 * rng.range(-10, 10), r: 74 };
  const groveF = (x, z) => smoothstep(grove.r, grove.r * 0.35, Math.hypot(x - grove.x, z - grove.z));
  // the way the elder's hollow faces: along the line from the trunk to the middle of the grove
  const motherA = Math.atan2(grove.z - GIANTS[1].z, grove.x - GIANTS[1].x);

  // route point at u, pushed `lat` metres to the right of travel
  function stationPt(u, lat) {
    const i = clamp(Math.round(u * NS), 0, NS - 1), tx = sx[i + 1] - sx[i], tz = sz[i + 1] - sz[i], tl = Math.hypot(tx, tz) || 1;
    return [sx[i] - (tz / tl) * lat, sz[i] + (tx / tl) * lat];
  }
  // (name, u along the route, metres to the right of travel, height above the floor): the kit's chital to the left of the
  // route, each cock to the right of it, the langurs' bounding bough and the glider's line on the route itself, above the floor
  const STATION_DEFS = [['chital', 0.415, -9.5, 0], ['peacockA', 0.53, 6.5, 0], ['peacockB', 0.437, 6.2, 0], ['langurs', 0.563, 0, 4], ['glider', 0.79, 0, 3]];
  const GLADE = { chital: 12, peacockA: 4.6, peacockB: 4.6, chital2: 7.5 };     // pillars keep out of where the world's animals stand
  const stations = {};
  // the rest of the cast, each placed by the world and each with a bar of light of its own:
  //   chital2     the second party, where the brief has it (journey: 'chital in a shaft 11 m to the right at u 0.46')
  //   langurRoot  the great root, which leaves the foot of the first giant (laid below, once all that stands in the
  //               middle hall is known, and its gap in the roof with it, over the root's own middle)
  //   batBough    the low bough hung with the colony, across the route at the middle of the grove (the point of the route
  //               nearest the grove's centre)
  //   langurLimb  a low limb between the nearest pair of grove columns (found once the pillars stand, below)
  // (name, u, metres to the right, height of the subject above the floor, half width of its gap across the sun and along
  // it). Their gaps go on the END of the list and take nothing from the hall's own random stream.
  const turnAt = (i, k = 6) => {        // how far the route turns over 2k samples about sample i (positive to the right)
    const a = clamp(i - k, 0, NS), b = clamp(i + k, 0, NS), ax = sx[i] - sx[a], az = sz[i] - sz[a], bx = sx[b] - sx[i], bz = sz[b] - sz[i];
    return Math.atan2(ax * bz - az * bx, ax * bx + az * bz);
  };
  const iRoot = routeNear(GIANTS[0].x, GIANTS[0].z).i;      // where along our way the first giant stands, from whose foot the great root runs: in the bend that carries the route round into the grove
  const rootIn = turnAt(iRoot) < 0 ? -1 : 1;                      // which side the inside of that bend is
  const iGrove = routeNear(grove.x, grove.z).i;
  const STATION2 = [['chital2', 0.46, 11, 0.7, 7.5, 9], ['batBough', iGrove / NS, 0, sy[iGrove] + 3.6, 10, 5]];

  // ---- sun mask: canopy gaps + oculus, and the shafts that come through them -------------------------
  const shafts = [];   // { gx, gz, a, b, I }
  {
    const tanEl = sunDir.y / Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z));
    const step0 = season === 'monsoon' ? 30 : 15;
    const inDome = (x, z) => rho(x, z) < 0.94 && ocDist(x, z) > OC.r + 9;
    let s = 0, i = iLow0 + 26;
    while (i < NS - 2) {
      const C = [sx[i], sy[i], sz[i]];
      const tx = sx[i + 1] - sx[i], tz = sz[i + 1] - sz[i], tl = Math.hypot(tx, tz) || 1;
      const lat = rng.range(-9, 9), hC = rng.range(1.0, 7.5);
      const px = C[0] - (tz / tl) * lat, pz = C[2] + (tx / tl) * lat;
      const sl = (ROOF - hC) / tanEl;
      const gx = px + sunH.x * sl, gz = pz + sunH.z * sl;
      const tall = rng.chance(0.45);
      if (inDome(gx, gz)) shafts.push({ gx, gz, a: tall ? rng.range(1.6, 3.2) : rng.range(3.5, 8), b: tall ? rng.range(7, 15) : rng.range(2.2, 4.5), I: rng.range(0.7, 1.15) * (season === 'monsoon' ? 1.5 : 1) });
      s = rng.range(step0 * 0.85, step0 * 1.5);
      i += Math.max(2, Math.round(s / (path.length / NS)));
    }
    // one broad gap for each place the world will stand an animal, so it is in light
    for (const st of STATION_DEFS) {
      const q = stationPt(st[1], st[2]); stations[st[0]] = new THREE.Vector3(q[0], floorY(q[0], q[1]) + st[3], q[1]);
      const sl = (ROOF - 1 - st[3]) / tanEl, gx = q[0] + sunH.x * sl, gz = q[1] + sunH.z * sl;
      // long enough along the sun that the bar of light is as tall as the animal standing in it
      if (inDome(gx, gz)) shafts.push(st[0] === 'chital' ? { gx, gz, a: 9, b: clamp(1.4 / tanEl, 8, 13), I: 1.05 }
        : st[0].startsWith('peacock') ? { gx, gz, a: 6.5, b: clamp(1.7 / tanEl, 5.5, 15), I: 1.15 } : { gx, gz, a: 5.5, b: 5, I: 1.1 });
    }
    // one long gap for each giant, so a bar of sun stands on its sunward flank from knee to shoulder
    for (const G of GIANTS) {
      let sl = (ROOF - 8.5) / tanEl + G.R, gx = G.x + sunH.x * sl, gz = G.z + sunH.z * sl;
      let aw = G.R * 1.6;
      if (G.mother) {      // the bar of sun stands on the sunward flank, as near the mouth of the hollow as it can without the beam crossing the mouth
        const nx = -sunH.z, nz = sunH.x, m = (Math.cos(motherA) * nx + Math.sin(motherA) * nz) * G.R;
        aw = G.R * 0.42;
        const c = clamp(m - (m < 0 ? -1 : 1) * (aw + 2.9), -G.R * 0.7, G.R * 0.7);
        sl = (ROOF - 7) / tanEl + G.R * 0.95; gx = G.x + sunH.x * sl + nx * c; gz = G.z + sunH.z * sl + nz * c;
      }
      if (inDome(gx, gz)) shafts.push({ gx, gz, a: aw, b: clamp(5.5 / tanEl, 9, 28), I: G.mother ? 1.15 : 1.1 });
    }
    // bars of sun lying across the avenue from the left (the brief: 'shafts from the left barring it'): one every 32 m
    // along the whole avenue, from its start to the ring's foot
    for (let dA = avenueU * path.length + 16; dA < path.length - 4; dA += 32) {
      const i = clamp(Math.round((dA / path.length) * NS), 0, NS), sl = (ROOF - 0.5) / tanEl, gx = sx[i] + sunH.x * sl, gz = sz[i] + sunH.z * sl;
      if (inDome(gx, gz)) shafts.push({ gx, gz, a: 3.2, b: clamp(1.2 / tanEl, 4, 9), I: 0.95, av: 1, x: 1 });
    }
    const extra = season === 'monsoon' ? 8 : 26;
    for (let k = 0; k < extra; k++) {
      const j = rng.int(iLow0 + 20, NS - 1), ang = rng.range(0, TAU), rr = rng.range(22, 110);
      const gx = sx[j] + Math.cos(ang) * rr + sunH.x * 60, gz = sz[j] + Math.sin(ang) * rr + sunH.z * 60;
      if (inDome(gx, gz)) shafts.push({ gx, gz, a: rng.range(2.5, 7), b: rng.range(2.5, 9), I: rng.range(0.5, 1.0) });
    }
    for (const st of STATION2) {
      const q = stationPt(st[1], st[2]); stations[st[0]] = new THREE.Vector3(q[0], floorY(q[0], q[1]) + st[3], q[1]);
      const sl = (ROOF - st[3]) / tanEl, gx = q[0] + sunH.x * sl, gz = q[1] + sunH.z * sl;
      if (inDome(gx, gz)) shafts.push({ gx, gz, a: st[4], b: clamp(st[5] * 0.14 / tanEl, st[5] * 0.6, st[5] * 1.5), I: 1.12, x: 1 });
    }
  }
  await ctx.yield();
  const maskCanvas = document.createElement('canvas'); maskCanvas.width = maskCanvas.height = MASK_PX;
  let maskBlob = () => {};          // paints one more gap into the mask (for a set piece placed after the pillars)
  {
    const g = maskCanvas.getContext('2d'), K = MASK_PX / MASK_SPAN, H = MASK_PX / 2;
    g.fillStyle = '#fff'; g.fillRect(0, 0, MASK_PX, MASK_PX);
    g.fillStyle = '#000'; g.beginPath(); g.ellipse(H, H, RX * 0.985 * K, RZ * 0.985 * K, 0, 0, TAU); g.fill();
    const blob = (x, z, a, b, I, rot) => {
      g.save(); g.translate(H + x * K, H + z * K); g.rotate(rot); g.scale(Math.max(1.2, b * K), Math.max(1.2, a * K));
      const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1);
      gr.addColorStop(0, `rgba(255,255,255,${I})`); gr.addColorStop(0.62, `rgba(255,255,255,${I})`); gr.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, TAU); g.fill(); g.restore();
    };
    blob(OC.x, OC.z, OC.r + 3, OC.r + 3, 1, 0);
    // ragged oculus edge and ragged rim
    for (let k = 0; k < 70; k++) { const a = rng.range(0, TAU), r = OC.r + rng.range(-2, 5); blob(OC.x + Math.cos(a) * r, OC.z + Math.sin(a) * r, rng.range(2, 6), rng.range(2, 6), 0.9, 0); }
    const rot = Math.atan2(sunH.z, sunH.x);
    await ctx.yield();
    for (const s of shafts) blob(s.gx, s.gz, s.a, s.b, Math.min(1, s.I), rot);
    maskBlob = (s) => blob(s.gx, s.gz, s.a, s.b, Math.min(1, s.I), rot);
    await ctx.yield();
    // dapples: the dry-season roof is thin everywhere
    const nd = season === 'monsoon' ? 60 : 280;
    for (let k = 0; k < nd; k++) {
      const j = rng.int(iLow0, NS), ang = rng.range(0, TAU), rr = rng.range(0, 170) ;
      const x = sx[j] + Math.cos(ang) * rr + sunH.x * 70, z = sz[j] + Math.sin(ang) * rr + sunH.z * 70;
      blob(x, z, rng.range(1.2, 3.2), rng.range(1.5, 4.5), rng.range(0.4, 0.85), rng.range(0, 3));
      if ((k & 31) === 31) await ctx.yield();
    }
  }
  const maskTex = new THREE.CanvasTexture(maskCanvas);
  maskTex.flipY = false; maskTex.wrapS = maskTex.wrapT = THREE.ClampToEdgeWrapping;
  maskTex.minFilter = THREE.LinearMipmapLinearFilter; maskTex.magFilter = THREE.LinearFilter; maskTex.generateMipmaps = true;
  maskTex.colorSpace = THREE.NoColorSpace;
  await ctx.yield();

  // ---- shared uniforms -----------------------------------------------------------------------------
  const night = hour === 'night' ? 1 : 0;
  const shade = night ? new THREE.Color(0.078, 0.108, 0.17) : mix3(cDeep, new THREE.Color(0.4, 0.55, 0.72), 0.72).multiplyScalar(0.78);
  const bounce = night ? new THREE.Color(0.034, 0.044, 0.064) : mix3(cAmber, cPeach, 0.45).multiplyScalar(0.36);
  const skyAmb = night ? new THREE.Color(0.11, 0.16, 0.28) : mix3(cPeach, new THREE.Color(0.6, 0.85, 0.95), 0.5).multiplyScalar(0.5);
  const hazeCol = night ? new THREE.Color(0.045, 0.07, 0.115) : mix3(mix3(cLeaf, cDeep, 0.45), new THREE.Color(0.72, 0.78, 0.62), 0.32).multiplyScalar(0.6);
  // misty weather: the far hall is bright warm mist (near trunks read dark against it), a patchy layer lies on the floor
  const foggy = weather === 'fog';
  const mistCol = night ? new THREE.Color(0.1, 0.14, 0.22) : hour === 'day' ? new THREE.Color(0.4, 0.43, 0.36) : mix3(cPeach, new THREE.Color(0.6, 0.62, 0.48), 0.4).multiplyScalar(0.6);
  if (foggy) hazeCol.lerp(mistCol, hour === 'day' ? 0.38 : 0.5);
  const U = {
    uMask: { value: maskTex }, uSunDir: { value: sunDir }, uSunH: { value: sunH }, uSunCol: { value: sunCol },
    uShade: { value: shade }, uBounce: { value: bounce }, uSkyAmb: { value: skyAmb }, uHazeCol: { value: hazeCol },
    uHall: { value: new THREE.Vector4(ROOF, 0.0105, 0, 1 / MASK_SPAN) },
    uWx: { value: new THREE.Vector4(weather === 'fog' ? 1 : 0, weather === 'shower' ? 1 : 0, season === 'monsoon' ? 1 : 0, night) },
    uMist: { value: new THREE.Vector4(foggy ? (hour === 'day' ? 0.048 : 0.06) : 0, foggy ? 1 : 0, night ? 0.14 : hour === 'day' ? 0.24 : 0.18, 1) }, uMistCol: { value: mistCol },
    uOc: { value: new THREE.Vector4(OC.x, OC.z, OC.r, hour === 'day' ? 0.06 : 0.12) },
    uG1: { value: new THREE.Vector4(GIANTS[0].x, GIANTS[0].z, GIANTS[0].R, 0.5) }, uG2: { value: new THREE.Vector4(GIANTS[1].x, GIANTS[1].z, GIANTS[1].R, 0.55) }, uHol: { value: new THREE.Vector4(0, -900, 1, 0) }, uHolD: { value: new THREE.Vector4(1, 0, 1, 0) },
    uWrap: { value: new THREE.Vector4(night ? 0.035 : hour === 'day' ? 0.05 : 0.075, night ? 0.1 : hour === 'day' ? 0.2 : 0.26, foggy ? 0.56 : 0.6, night ? 0.3 : foggy ? 0.85 : 0.7) },
    uStage: { value: new THREE.Vector4(0, night ? 0.5 : 1, 1, 0) },
    uOutK: { value: 0 },       // 1 while the camera is outside or above the crown: the hem at the rim then hangs higher, showing the pillars under it
    uRing: { value: new THREE.Vector4(0, -500, 0, 0) }, uRingCol: { value: night ? new THREE.Color(0.3, 0.4, 0.62) : new THREE.Color(0.62, 0.42, 0.2) },
    uCam: { value: new THREE.Vector3() }, uCamDir: { value: new THREE.Vector3(0, 0, -1) }, uWake: { value: 1 }, uPx: { value: 600 }, uWave: { value: new THREE.Vector4(0, -900, 0, 0.001) },
  };
  const hazeBase = foggy ? (hour === 'day' ? 0.0072 : 0.0085) : night ? 0.0092 : 0.0105;
  const mkMat = (o) => {
    const m = new THREE.ShaderMaterial({ fog: true, ...o });
    m.uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, ...(o.uniforms || {}) };
    return m;
  };

  // ---- where the set pieces of the middle hall stand (worked out before the pillars, which keep clear) -----------------
  // the BAT BOUGH: a low limb slanting over our way at the middle of the grove, hung thick with the colony, each end on a
  // pole of its own. A pole keeps the elder trunk's clearing (ELDER_CLEAR metres from the trunk's middle, the same that
  // the roost boughs keep): it steps outward along its own line only while it stands nearer the trunk than that. The
  // LANGUR LIMB is placed once the pillars stand, the GREAT ROOT after the giants (both below)
  const ELDER_CLEAR = 25, elderD = (x, z) => Math.hypot(x - GIANTS[1].x, z - GIANTS[1].z);
  const bbA = stationPt((iGrove - 1.9) / NS, -9.4);
  let bbB = stationPt((iGrove + 1.9) / NS, 9.8);
  for (let lat = 9.8; lat < 17 && elderD(bbB[0], bbB[1]) < ELDER_CLEAR; lat += 0.6) bbB = stationPt((iGrove + 1.9) / NS, lat);
  for (let lat = 9.4; lat < 17 && elderD(bbA[0], bbA[1]) < ELDER_CLEAR; lat += 0.6) { const q = stationPt((iGrove - 1.9) / NS, -lat); bbA[0] = q[0]; bbA[1] = q[1]; }
  const keepOut = [[bbA[0], bbA[1], 2.2], [bbB[0], bbB[1], 2.2]];
  keepOut.push([stations.peacockA.x, stations.peacockA.z, 5.2]);
  const kept = (x, z, r) => { for (const k of keepOut) if (Math.hypot(x - k[0], z - k[1]) < k[2] + r) return true; return false; };

  // the height of the roof's underside at (x, z) as its sheet is drawn (ceilGeo below: 110 spokes from the well, rings
  // up to 60 m apart, so it stands metres off ceilY in places). A pillar that stops at ceilY shows a sawn top in mid-air
  // under it; the shafts of the middle and far tiers run on up through the sheet into the leaves instead
  const CEIL_A = 110;
  const ceilDists = (L) => { const o = [1, 6, 16, 34], far = L - OC.r; for (let k = 1; k <= 6; k++) o.push(lerp(34, far - 34, k / 6)); o.push(far - 14, far - 3); return o; };
  const ceilV = (x, z) => Math.min(ceilY(x, z) + 1.1, domeY(x, z) - 0.6);
  function sheetSpoke(i, d) {
    const a = (i / CEIL_A) * TAU, ca = Math.cos(a), sa = Math.sin(a), ds = ceilDists(rimDist(ca, sa));
    let j = 0; while (j < ds.length - 2 && ds[j + 1] < d) j++;
    const f = clamp((d - ds[j]) / Math.max(ds[j + 1] - ds[j], 1e-3), 0, 1), r0 = OC.r + ds[j], r1 = OC.r + ds[j + 1];
    return lerp(ceilV(OC.x + ca * r0, OC.z + sa * r0), ceilV(OC.x + ca * r1, OC.z + sa * r1), f);
  }
  function sheetY(x, z) {
    const dx = x - OC.x, dz = z - OC.z, d = Math.hypot(dx, dz) - OC.r; let a = Math.atan2(dz, dx); if (a < 0) a += TAU;
    const fi = (a / TAU) * CEIL_A, i0 = Math.floor(fi) % CEIL_A;
    return Math.max(sheetSpoke(i0, d), sheetSpoke((i0 + 1) % CEIL_A, d));
  }
  // ---- pillars: where they stand ---------------------------------------------------------------------
  const pillars = [];
  // sight lines to the ring: from the southbound leg the exit is glimpsed between the pillars well before the avenue.
  // A pillar standing in one of them is a young root bundle that has not reached the ground yet (it stops 9 m up), so
  // the limbs still have their support and the view under it is clear
  const sightA = [0.825, 0.84, 0.855, 0.87, 0.885, 0.9].map((u) => path.pointAt(u)), sightB = path.pointAt(1);
  const inSight = (x, z, r) => {
    for (const a of sightA) {
      const dx = sightB.x - a.x, dz = sightB.z - a.z, t = clamp(((x - a.x) * dx + (z - a.z) * dz) / (dx * dx + dz * dz), 0, 1);
      if (Math.hypot(x - a.x - dx * t, z - a.z - dz * t) < 2.6 + r * 1.7) return true;
    }
    return false;
  };
  {
    const cell = 12.5 / Math.sqrt(density);
    for (let gz = -RZ; gz <= RZ; gz += cell) { await ctx.yield(); for (let gx = -RX; gx <= RX; gx += cell) {
      let x = gx + rng.range(-0.42, 0.42) * cell, z = gz + rng.range(-0.42, 0.42) * cell;
      const r0 = rng(), r1 = rng(), r2 = rng(), r3 = rng();
      if (rho(x, z) > 0.962 || ocDist(x, z) < OC.r + 4) continue;
      const glade = (px, pz) => {
        for (const k in GLADE) if (Math.hypot(px - stations[k].x, pz - stations[k].z) < GLADE[k]) return true;
        for (const G of GIANTS) if (Math.hypot(px - G.x, pz - G.z) < G.R * 2.5 + 5) return true;        // a giant stands alone
        if (kept(px, pz, 1.2)) return true;
        return sightM(px, pz, 7.5);
      };
      if (glade(x, z)) continue;
      const gf = groveF(x, z);
      const col = r0 < 0.3 + 0.5 * gf;
      const r = col ? 0.72 + r1 * 0.45 + gf * 0.38 : 0.15 + r1 * 0.14;
      let n = routeNear(x, z);
      const cl = (n.i > avenueU * NS ? 8.4 : 6.4) + r * 1.2;
      if (n.d < cl) {           // push it out to line the corridor instead of losing it
        let dx = x - sx[n.i], dz = z - sz[n.i]; const dl = Math.hypot(dx, dz);
        if (dl < 0.5) continue;
        const k = (cl + r2 * 1.6) / dl; x = sx[n.i] + dx * k; z = sz[n.i] + dz * k;
        n = routeNear(x, z);
        if (n.d < cl - 0.05 || ocDist(x, z) < OC.r + 4 || glade(x, z)) continue;
      }
      const tier = n.d < 19 ? 0 : n.d < 70 ? 1 : 2;
      if (tier === 2) { if (n.d > 250 && rho(x, z) < 0.8) continue; if (r3 > detail * 0.88) continue; if (!col && n.d > 170 && r3 > 0.5) continue; }
      const top = Math.min(ceilY(x, z) + 0.9, domeY(x, z) - 1);
      pillars.push({ x, z, r, col, tier, d: n.d, ni: n.i, top, topX: tier === 0 ? top : Math.max(top, sheetY(x, z) + 1.3), s: r2, gf, ghost: inSight(x, z, r) });
    } }
  }
  await ctx.yield();
  // the langurs' limb: a low bough from one column of the grove to its neighbour, on the pair that stands nearest our way
  // between the great root and the bat bough (two thick columns 7 to 14 m apart on the same side of the route, the limb
  // itself at least 6 m from it). It gets a gap in the roof of its own, like the other set pieces.
  let llA = null, llB = null, iLimb = Math.round((iRoot + iGrove) / 2);
  {
    const side = (q) => { const i = clamp(q.ni, 0, NS - 1); return (q.x - sx[i]) * -(sz[i + 1] - sz[i]) + (q.z - sz[i]) * (sx[i + 1] - sx[i]) < 0 ? -1 : 1; };
    for (const relax of [0, 1]) {
      if (llA) break;
      const cand = pillars.filter((q) => q.tier === 0 && q.col && !q.ghost && q.gf > (relax ? 0 : 0.2) && q.ni > iRoot + 10 && q.ni < iGrove - (relax ? 4 : 10));
      let best = 1e9;
      for (let a = 0; a < cand.length; a++) for (let b = a + 1; b < cand.length; b++) {
        const A2 = cand[a], B2 = cand[b], len = Math.hypot(A2.x - B2.x, A2.z - B2.z);
        if (len < 7 || len > (relax ? 18 : 14) || side(A2) !== side(B2)) continue;
        let clear = 1e9; for (let t = 0; t <= 1.001; t += 0.125) clear = Math.min(clear, routeNear(lerp(A2.x, B2.x, t), lerp(A2.z, B2.z, t)).d);
        if (clear < 6 || kept((A2.x + B2.x) / 2, (A2.z + B2.z) / 2, 6) || giantD((A2.x + B2.x) / 2, (A2.z + B2.z) / 2) < 9) continue;
        const score = A2.d + B2.d;
        if (score < best) { best = score; const fwd = A2.ni <= B2.ni; llA = fwd ? [A2.x, A2.z] : [B2.x, B2.z]; llB = fwd ? [B2.x, B2.z] : [A2.x, A2.z]; iLimb = Math.round((A2.ni + B2.ni) / 2); }
      }
    }
    const own = !llA;                 // no such pair in this seed's grove: the limb stands on two poles of its own beside the route
    if (own) { llA = stationPt((iLimb - 3) / NS, 9.8 * rootIn); llB = stationPt((iLimb + 3) / NS, 6.9 * rootIn); }
    llA.own = own;
    const mx = (llA[0] + llB[0]) / 2, mz = (llA[1] + llB[1]) / 2, hL = sy[iLimb] + 1.2;
    stations.langurLimb = new THREE.Vector3(mx, hL, mz);
    const tanEl = sunDir.y / Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z)), sl = (ROOF - Math.min(hL, ROOF - 2)) / tanEl, gx = mx + sunH.x * sl, gz = mz + sunH.z * sl;
    if (rho(gx, gz) < 0.94 && ocDist(gx, gz) > OC.r + 9) { const sh2 = { gx, gz, a: 6, b: clamp(5 * 0.14 / tanEl, 3, 7.5), I: 1.12, x: 1 }; shafts.push(sh2); maskBlob(sh2); }
  }

  // round six: what is drawn when. Everything is built once; whole meshes are switched by where the camera is, so the
  // detail added under the roof costs nothing over the dome and the crown costs nothing in the middle of the hall.
  //   outer: seen only from the air or the plain; court: the dome's shell, the lip of the well and its eave (hidden deep
  //   in the hall); hall: seen only from under the roof; pool: the pillars' reflections; mid: the set pieces of the middle
  const stage = { outer: [], court: [], hall: [], pool: [], mid: [] };
  // ---- bark geometry -----------------------------------------------------------------------------------
  const S = new Store();
  const barkBase = mix3(cCream, new THREE.Color(0.55, 0.56, 0.52), 0.25).multiplyScalar(weather === 'shower' ? (night ? 0.86 : 0.62) : foggy ? (night ? 0.88 : 0.72) : night ? 0.94 : hour === 'day' ? 0.74 : 0.8);
  if (foggy && !night) { barkBase.r *= 1.08; barkBase.b *= 0.9; }      // damp bark, warmer: no grey trunks in the mist
  const T_NEAR = [0, 0.025, 0.065, 0.13, 0.25, 0.42, 0.6, 0.76, 0.88, 0.95, 1];
  const T_POLE = [0, 0.04, 0.3, 0.65, 0.94, 1];
  const T_MID = [0, 0.07, 0.5, 0.92, 1];
  const T_MIDP = [0, 0.06, 1], T_FAR = [0, 1];
  const kc = [0, 0, 0];
  const nearCols = [];
  // round six: every column within 40 m of our way is BRAIDED. Separate roots stand off the core and wind round it,
  // each with a splayed foot of its own, parting again under the bough; a pole has a younger root or two beside it.
  // They are lofted into stores of their own, one per stretch of the route (braidAt), drawn only while we are near.
  const NBR = 8, braids = [];
  for (let k = 0; k < NBR; k++) braids.push({ S: new Store(), x: 0, z: 0, n: 0, r: 0 });
  const TS_BN = [0, 0.03, 0.08, 0.16, 0.3, 0.5, 0.7, 0.86, 0.95, 1], TS_BM = [0, 0.05, 0.14, 0.35, 0.65, 0.9, 1], TS_BP = [0, 0.08, 0.4, 0.8, 1];
  let ST = S;                       // the store column() lofts into
  function column(x, z, r, top, tier, seed, isCol, hangY = 0, braidTo = null, braidLod = 0, headY = 0) {
    // headY: where the head (the flare under the bough) is, when the shaft itself runs on up through the roof's leaves
    const f0 = hangY || floorY(x, z) - 0.45, H = top - f0, Hh = (headY || top) - f0;
    const prng = (k) => { const v = Math.sin(seed * 91.7 + k * 37.3) * 43758.5453; return v - Math.floor(v); };
    const leanA = prng(1) * TAU, lean = (isCol ? 0.035 : 0.07) * prng(2), bow = (isCol ? 0.45 : 0.9) * (prng(3) - 0.5);
    const lx = Math.cos(leanA), lz = Math.sin(leanA);
    const k = 4 + Math.floor(prng(4) * 3), tw = (prng(5) - 0.5) * 5, ph = prng(6) * TAU, A0 = 0.26 + 0.2 * prng(7);
    const tint = 0.84 + 0.3 * prng(8), warm = prng(9);
    const tr = barkBase.r * tint * (0.95 + 0.1 * warm), tg = barkBase.g * tint, tb = barkBase.b * tint * (1.06 - 0.14 * warm);
    let lobe = 1;
    const axis = (t, o) => { const b = bow * Math.sin(Math.PI * t), l = lean * t * H; o[0] = x + lx * l + lz * b; o[1] = f0 + t * H; o[2] = z + lz * l - lx * b; };
    const rad = (t, a) => {
      const y = t * H, foot = hangY ? 0 : Math.exp(-y / 1.5), head = Math.exp(-Math.abs(Hh - y) / 2.2) * (y > Hh ? 0.5 : 1);
      if (tier === 2) { lobe = 0.8; return r * (1.42 - 0.5 * t) * (hangY ? 0.03 + 0.97 * smoothstep(0, 0.6, t) : 1); }      // far off: a plain pale shaft, a little stouter at the foot, no flared lid
      const R = r * (1 - 0.12 * t) * (1 + (isCol ? 1.45 : 2.2) * foot + (isCol ? 0.95 : 1.6) * head) * (hangY ? 0.03 + 0.97 * smoothstep(0, 0.6, t) : 1);
      lobe = Math.pow(Math.abs(Math.sin(0.5 * (k * a + tw * t + ph))), 0.7);
      const A = isCol ? A0 + 0.5 * Math.exp(-y / 1.25) + 0.25 * head : 0.1;
      return R * (1 + A * (lobe - 0.62));
    };
    const col = (t) => {
      const y = t * H, g = 0.5 + 0.5 * lobe, low = 1 - 0.45 * Math.exp(-y / 0.9), hi = 1 - 0.5 * Math.exp(-Math.max(Hh - y, 0) / 3);
      const m = g * low * hi; kc[0] = tr * m; kc[1] = tg * m; kc[2] = tb * m; return kc;
    };
    if (tier === 0) loft(ST, axis, rad, isCol ? T_NEAR : T_POLE, isCol ? 14 : 6, col, isCol ? k : 2, H, isCol ? 0.8 : 0);
    else if (tier === 1) loft(ST, axis, rad, isCol ? T_MID : T_MIDP, isCol ? 6 : 4, col, isCol ? k : 2, H);
    else loft(ST, axis, rad, T_FAR, 3, col, 3, H);
    // a younger root leaning in and fusing with a near column
    if (tier === 0 && isCol && !hangY && prng(10) < 0.42) {
      const a2 = prng(11) * TAU, off = r * 2.2 + 1.2 + prng(12) * 1.6, jh = (0.45 + 0.35 * prng(13)) * H, r2 = 0.12 + 0.12 * prng(14);
      const fx = x + Math.cos(a2) * off, fz = z + Math.sin(a2) * off, c0 = [0, 0, 0];
      axis(jh / H, c0);
      const ax2 = (t, o) => { const e = t * t * (3 - 2 * t) * 0.35 + t * 0.65; o[0] = lerp(fx, c0[0], e); o[1] = f0 + t * (jh - 0.2); o[2] = lerp(fz, c0[2], e); };
      const rad2 = (t) => r2 * (1 + 1.8 * Math.exp(-t * jh / 0.8) + 0.8 * Math.exp(-(1 - t) * jh / 1.2));
      const col2 = (t) => { const m = 0.9 * (1 - 0.4 * Math.exp(-t * jh / 0.8)); kc[0] = tr * m * 1.05; kc[1] = tg * m; kc[2] = tb * m * 0.95; return kc; };
      loft(ST, ax2, rad2, [0, 0.07, 0.4, 0.8, 1], 5, col2, 2, jh);
    }
    if (braidTo && !hangY) {
      const nS = isCol ? (braidLod ? 3 : 4 + (prng(20) < 0.5 ? 1 : 0)) : 1 + (prng(20) < 0.45 ? 1 : 0), c0 = [0, 0, 0];
      for (let q = 0; q < nS; q++) {
        const a0 = ((q + 0.7 * prng(21 + q)) / nS) * TAU + ph, turn = (prng(31 + q) < 0.5 ? -1 : 1) * (0.5 + 1.3 * prng(41 + q)), wp = prng(51 + q) * TAU;
        const rs = isCol ? r * (0.2 + 0.16 * prng(61 + q)) : r * (0.42 + 0.3 * prng(61 + q)), out = isCol ? 0.9 + 1.3 * prng(71 + q) : 0.7 + 1.5 * prng(71 + q);
        const hTop = isCol ? 1 : 0.5 + 0.45 * prng(81 + q), pale = 0.92 + 0.3 * prng(91 + q);      // a pole's companion joins it part way up
        const axS = (t, o) => {
          const tt = t * hTop, y = tt * H; axis(tt, c0);
          const core = r * (1 - 0.12 * tt) * (1 + (isCol ? 0.5 : 0.4) * Math.exp(-y / 1.5));
          const join = isCol ? 1 : 1 - smoothstep(0.75, 1, t);
          const rd = (core * (isCol ? 0.92 : 0.7) + rs * 0.3 + out * Math.exp(-y / (isCol ? 1.15 : 2.6)) + (isCol ? 0.55 * Math.exp(-(H - y) / 1.7) : 0)) * join;
          const a = a0 + turn * tt + 0.3 * Math.sin(tt * 7 + wp);
          o[0] = c0[0] + Math.cos(a) * rd; o[1] = c0[1]; o[2] = c0[2] + Math.sin(a) * rd;
        };
        const rdS = (t) => rs * (1 + 1.3 * Math.exp(-t * hTop * H / 0.55) + (isCol ? 0.4 * Math.exp(-(1 - t) * H / 1.5) : 0)) * (isCol ? 1 : 1 - 0.5 * t);
        const colS = (t, a) => { const y = t * hTop * H, m = pale * (0.82 + 0.18 * Math.cos(a)) * (1 - 0.42 * Math.exp(-y / 0.8)); kc[0] = tr * m * 1.04; kc[1] = tg * m; kc[2] = tb * m * 0.95; return kc; };
        loft(braidTo, axS, rdS, isCol ? (braidLod ? TS_BM : TS_BN) : TS_BP, isCol ? (braidLod ? 4 : 5) : 3, colS, 1, H * hTop);
      }
    }
  }
  const braidAt = (i) => braids[clamp(Math.floor(((i / NS) - 0.25) / 0.75 * NBR), 0, NBR - 1)];
  let cnt = [0, 0, 0];
  const mirrorIdx = [];          // index ranges of the pillars that stand in or round the pool: drawn again upside down as its reflection
  for (let i = 0; i < pillars.length; i++) {
    const p = pillars[i], i0 = S.i.length;
    const br = !p.ghost && p.d < 40 ? braidAt(p.ni) : null;
    if (br) { br.x += p.x; br.z += p.z; br.n++; }
    column(p.x, p.z, p.col ? p.r : p.r * 1.5, p.topX, p.tier, i + p.s * 7, p.col, p.ghost ? Math.min(9.5 + 2.5 * p.s, p.top - 3) : 0, br ? br.S : null, p.tier === 0 ? 0 : 1, p.top); cnt[p.tier]++;      // the poles are young trunks, not sticks
    if (!p.ghost && p.tier < 2 && poolIn(p.x, p.z) > (p.tier === 0 ? -32 : -58)) mirrorIdx.push(i0, S.i.length);
    if (p.tier === 0 && p.col) nearCols.push(p);
    if (i % 6 === 5) await ctx.yield();
  }

  // ---- the outermost aerial roots: pale poles standing in the shade of the hem where we come in, in twos and threes ----
  {
    const pr = xr('rimpoles'), thE = Math.atan2(sz[0] / RZ, (sx[0] + 75) / RX);
    for (let k = 0; k < 120; k++) {
      const th = thE + (pr() - 0.5) * 0.84, rr = pr.range(0.972, 1.008), n = 1 + pr.int(0, 2);
      for (let q = 0; q < n; q++) {
        const x = RX * rr * Math.cos(th) + (q ? pr.range(-1.8, 1.8) : 0), z = RZ * rr * Math.sin(th) + (q ? pr.range(-1.2, 1.2) : 0), r = q ? pr.range(0.13, 0.24) : pr.range(0.24, 0.5);
        column(x, z, r, 11 + pr.range(0, 5), 1, 3000 + k * 7.3 + q, r > 0.3);
      }
    }
  }
  await ctx.yield();
  // ---- the exit arch: two columns that lean together and fuse 18 m up ----------------------------------
  const endP = path.pointAt(1), endT = path.tangentAt(1);
  const avD = new THREE.Vector3(endT.x, 0, endT.z).normalize(), avL = new THREE.Vector3(-avD.z, 0, avD.x);
  const seat = new THREE.Vector3(endP.x, 7.5, endP.z);
  U.uRing.value.set(seat.x, 6, seat.z, 1);
  {
    const tsA = [0, 0.02, 0.05, 0.1, 0.18, 0.28, 0.4, 0.52, 0.64, 0.75, 0.85, 0.93, 1];
    for (const sd of [-1, 1]) {
      const k = 5 + (sd > 0 ? 1 : 0), ph = rng.range(0, TAU), tw = rng.range(2, 4) * sd, off = sd * (9.7 + rng.range(0, 0.5)), fwd = rng.range(-0.8, 0.8);
      const f0 = floorY(seat.x + avL.x * off, seat.z + avL.z * off) - 0.45;
      let lobe = 1;
      const axis = (t, o) => { const l = off * (1 - t * t * t) , y = f0 + t * (18.6 - f0); o[0] = seat.x + avL.x * l + avD.x * fwd * (1 - t); o[1] = y; o[2] = seat.z + avL.z * l + avD.z * fwd * (1 - t); };
      const rad = (t, a) => {
        const y = t * 18.6; lobe = Math.pow(Math.abs(Math.sin(0.5 * (k * a + tw * t + ph))), 0.7);
        return 1.22 * (1 - 0.2 * t) * (1 + 1.5 * Math.exp(-y / 1.6) + 0.45 * Math.exp(-(18.6 - y) / 2.5)) * (1 + (0.2 + 0.5 * Math.exp(-y / 1.3)) * (lobe - 0.62));
      };
      const col = (t) => { const m = (0.5 + 0.5 * lobe) * (1 - 0.45 * Math.exp(-t * 18.6 / 0.9)); kc[0] = barkBase.r * m; kc[1] = barkBase.g * m; kc[2] = barkBase.b * m; return kc; };
      loft(S, axis, rad, tsA, 16, col, k, 19, 0.8);
    }
    // the fused crown above the join, running up into the roof
    const topY = ceilY(seat.x, seat.z) + 1.2;
    const axis = (t, o) => { o[0] = seat.x + 0.6 * Math.sin(t * 2); o[1] = 17.2 + t * (topY - 17.2); o[2] = seat.z; };
    let lobe = 1;
    const rad = (t, a) => { lobe = Math.pow(Math.abs(Math.sin(0.5 * (7 * a + 3 * t))), 0.7); return (1.75 - 0.5 * Math.sin(Math.PI * t) + 1.3 * t * t) * (1 + 0.25 * (lobe - 0.6)); };
    const col = () => { const m = 0.45 + 0.4 * lobe; kc[0] = barkBase.r * m; kc[1] = barkBase.g * m; kc[2] = barkBase.b * m; return kc; };
    loft(S, axis, rad, [0, 0.15, 0.4, 0.7, 1], 12, col, 7, 4);
  }
  await ctx.yield();

  // ---- limbs: boughs from pillar head to pillar head --------------------------------------------------
  const limbPts = [];   // underside points for bats and threads: x, y, z, weight
  {
    const cand = pillars.filter((p) => p.d < 48);
    const G = 22, grid = new Map(), key = (x, z) => Math.floor(x / G) + ':' + Math.floor(z / G);
    cand.forEach((p, i) => { const k = key(p.x, p.z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(i); });
    let made = 0; const maxLimbs = 300;
    const T_L = [0, 0.14, 0.3, 0.5, 0.7, 0.86, 1];
    for (let i = 0; i < cand.length && made < maxLimbs; i++) {
      if ((i & 63) === 63) await ctx.yield();
      const A = cand[i], opt = [];
      const cx = Math.floor(A.x / G), cz = Math.floor(A.z / G);
      for (let ox = -1; ox <= 1; ox++) for (let oz = -1; oz <= 1; oz++) {
        const l = grid.get((cx + ox) + ':' + (cz + oz)); if (!l) continue;
        for (const j of l) { if (j <= i) continue; const B = cand[j], d = Math.hypot(B.x - A.x, B.z - A.z); if (d > 8 && d < 23) opt.push([d, j]); }
      }
      opt.sort((a, b) => a[0] - b[0]);
      const take = A.col ? 2 : 1;
      for (let q = 0; q < Math.min(take, opt.length) && made < maxLimbs; q++) {
        const B = cand[opt[q][1]], len = opt[q][0];
        const rA = clamp(A.r * 0.7, 0.26, 0.9), rB = clamp(B.r * 0.7, 0.26, 0.9);
        const mx = (A.x + B.x) / 2, mz = (A.z + B.z) / 2, nr = routeNear(mx, mz);
        const drop = rng.range(2.4, 4.6);
        const lift = nr.d < 12 ? Math.max(0, sy[nr.i] + 6.4 - Math.min(A.top, B.top) + drop) : 0;
        const arch = rng.range(-0.7, 1.6) + lift, wob = rng.range(-1.6, 1.6), wp = rng.range(0, TAU);
        const px = -(B.z - A.z) / len, pz = (B.x - A.x) / len, tint = rng.range(0.2, 0.36), kn = rng.range(0, TAU);
        const axis = (t, o) => { const w = wob * Math.sin(Math.PI * t) * Math.sin(t * 5 + wp); o[0] = lerp(A.x, B.x, t) + px * w; o[1] = lerp(A.top, B.top, t) - drop + arch * Math.sin(Math.PI * t) + 0.3 * Math.sin(t * 8 + kn); o[2] = lerp(A.z, B.z, t) + pz * w; };
        const rad = (t) => lerp(rA, rB, t) * (0.66 + 0.34 * Math.cos(t * TAU) * Math.cos(t * TAU)) * (1 + 0.22 * Math.sin(t * 11 + kn));
        const col = (t, a) => { const m = tint * (0.8 - 0.25 * Math.sin(a)); kc[0] = barkBase.r * m; kc[1] = barkBase.g * m; kc[2] = barkBase.b * m; return kc; };
        loft(S, axis, rad, T_L, 5, col, 2, len);
        const o = [0, 0, 0];
        for (let s = 1; s < 8; s++) { axis(s / 8, o); limbPts.push(o[0], o[1] - rad(s / 8), o[2], nr.d); }
        made++;
      }
    }
  }
  await ctx.yield();
  // ---- the giants of the mother grove: each a fused bundle of trunks 8 to 11 m through, fluted into buttress fins at the
  //      foot, younger trunks leaning in and welding on, strangler roots winding up it, boughs as thick as trees propped on
  //      pillars of their own and hung with curtains of rope roots
  const giantThreads = [];      // x y z len seed
  {
    const TS_CORE = [0, 0.015, 0.035, 0.06, 0.095, 0.14, 0.2, 0.28, 0.37, 0.47, 0.57, 0.67, 0.76, 0.84, 0.91, 0.96, 1];
    const TS_SAT = [0, 0.02, 0.05, 0.1, 0.18, 0.28, 0.4, 0.52, 0.64, 0.76, 0.88, 1], TS_CL = [], TS_B = [], TS_RT = [0, 0.08, 0.18, 0.3, 0.44, 0.58, 0.72, 0.86, 1];
    for (let i = 0; i <= 15; i++) TS_CL.push(i / 15);
    for (let i = 0; i <= 12; i++) TS_B.push(i / 12);
    const o3 = [0, 0, 0];
    for (let gi = 0; gi < GIANTS.length; gi++) {
      const G = GIANTS[gi], gr = xr('giant' + gi), R0 = G.R;
      const f0 = floorY(G.x, G.z) - 0.6, top = Math.min(ceilY(G.x, G.z) + 1.6, domeY(G.x, G.z) - 0.8), H = top - f0;
      const k = 9 + gr.int(0, 2), ph = gr.range(0, TAU), tw = gr.range(-2.2, 2.2), k2 = 2 * k + 3, ph2 = gr.range(0, TAU);
      let lobe = 1, inH = 0, lipK = 0;
      const baseR = (t, a) => {
        const y = t * H, foot = Math.exp(-y / 3.4), head = Math.exp(-(H - y) / 4.5);
        lobe = Math.pow(Math.abs(Math.sin(0.5 * (k * a + tw * t + ph))), 0.6);
        const l2 = Math.pow(Math.abs(Math.sin(0.5 * (k2 * a - tw * 1.4 * t + ph2))), 0.8);
        return R0 * (1 - 0.1 * t) * (1 + 0.5 * foot + 0.5 * head) * (1 + (0.2 + 0.9 * foot + 0.25 * head) * (lobe - 0.5) + 0.08 * (l2 - 0.5))
          + 0.3 * noise.n2(Math.cos(a) * 1.7 + G.seed + y * 0.11, Math.sin(a) * 1.7 - y * 0.07);
      };
      // the mother's hollow: a pointed mouth 4 m wide and 8.6 m high on the side we come from, the heartwood gone behind it
      const mother = !!G.mother, aH = motherA, wrapA = (d) => Math.atan2(Math.sin(d), Math.cos(d));
      const hwAt = (y) => (mother && y < 9.6 ? 0.37 * Math.pow(1 - (y / 9.6) * (y / 9.6), 0.6) : 0);
      const coreR = mother ? (t, a) => {
        const r = baseR(t, a), y = t * H, hw = hwAt(y), da = Math.abs(wrapA(a - aH));
        inH = hw > 0 ? 1 - smoothstep(hw * 0.72, hw * 1.08 + 0.015, da) : 0;
        const lip = hw > 0 ? Math.exp(-Math.pow((da - hw * 1.45) / 0.11, 2)) : 0;         // the bark rolls in a thick lip round the mouth
        lipK = lip;
        return lerp(r * (1 + 0.2 * lip), R0 * (0.3 + 0.045 * Math.sin(a * 23 + y * 1.3)), inH);
      } : baseR;
      const coreCol = (t) => {
        const y = t * H, m = (0.36 + 0.64 * lobe) * (1 - 0.5 * Math.exp(-y / 1.2)) * (1 - 0.45 * Math.exp(-(H - y) / 3.5)) * (1 - 0.8 * inH);
        const lg = 1 + 0.85 * lipK * (1 - inH);                 // the rolled lip is young pale bark, and catches the gold
        kc[0] = barkBase.r * m * lg * (1 + 0.12 * lipK); kc[1] = barkBase.g * m * (1 - 0.1 * inH) * lg; kc[2] = barkBase.b * m * (1 - 0.25 * inH) * lg * (1 - 0.12 * lipK); return kc;
      };
      if (mother) {
        const angs = []; let a = 0;
        while (a < TAU - 0.03) { angs.push(aH + Math.PI + a); a += Math.abs(a - Math.PI) < 0.62 ? 0.042 : 0.105; }
        angs.push(aH + Math.PI + TAU);
        loftTrunk(S, G.x, G.z, f0, H, coreR, [0, 15, 35, 60, 95, 130, 170, 210, 250, 285, 315, 340, 370, 420, 500, 600, 700, 800, 880, 940, 1000].map((h) => h / 1000), angs, coreCol, Math.round(TAU * R0 * 1.2 / 1.15));
        U.uHol.value.set(G.x + Math.cos(aH) * R0 * 0.62, G.z + Math.sin(aH) * R0 * 0.62, 3.3, 0.78);
        U.uHolD.value.set(Math.cos(aH), Math.sin(aH), R0 * 0.36, 0);
      } else loft(S, (t, o) => { o[0] = G.x; o[1] = f0 + t * H; o[2] = G.z; }, coreR, TS_CORE, 32, coreCol, Math.round(TAU * R0 * 1.2 / 1.15), H, 0.85);
      // younger trunks standing off and leaning in to weld onto the core, then running up it as ribs
      const nS = 11 + gr.int(0, 3) + (mother ? 4 : 0), sats = [];
      for (let q = 0; q < nS; q++) {
        const a0 = ((q + gr.range(-0.3, 0.3)) / nS) * TAU, r = gr.range(0.5, 1.15) * (0.75 + 0.05 * R0), hm = gr.range(0.28, 0.62) * H, drift = gr.range(-0.35, 0.35);
        let rf = R0 * gr.range(1.5, 2.15);
        if (routeNear(G.x + Math.cos(a0) * rf, G.z + Math.sin(a0) * rf).d < 7.6 + r) rf = R0 * (mother ? 1.2 : 1.42);      // tucked in on the side we pass
        const k3 = 3 + gr.int(0, 2), ph3 = gr.range(0, TAU);
        if (mother && Math.abs(wrapA(a0 - aH)) < 0.8) continue;                              // none across the mouth
        sats.push([a0, r, hm, drift, rf, k3, ph3, 1.5]);
      }
      if (mother) for (const sd of [-1, 1]) sats.push([aH + sd * 0.6, 1.15, 0.46 * H, -sd * 0.36, R0 * 1.3, 4, 1.3 + sd, 0.55]);       // the two jambs, leaning together over the mouth
      for (const [a0, r, hm, drift, rf, k3, ph3, flare] of sats) {
        let lb = 1;
        const axis = (t, o) => {
          const y = t * H, a = a0 + drift * t, rd = lerp(rf, coreR(t, a) * 0.93 + r * 0.25, smoothstep(0, hm, y));
          o[0] = G.x + Math.cos(a) * rd; o[1] = f0 + y; o[2] = G.z + Math.sin(a) * rd;
        };
        const rad = (t, a) => {
          const y = t * H; lb = Math.pow(Math.abs(Math.sin(0.5 * (k3 * a + ph3 + 3 * t))), 0.7);
          return r * (1 + flare * Math.exp(-y / 1.3) + 0.5 * Math.exp(-(H - y) / 3)) * (1 - 0.45 * smoothstep(hm * 0.8, H, y)) * (1 + 0.24 * (lb - 0.6));
        };
        const col = (t) => { const y = t * H, m = (0.55 + 0.45 * lb) * (1 - 0.45 * Math.exp(-y / 0.9)); kc[0] = barkBase.r * m * 1.04; kc[1] = barkBase.g * m; kc[2] = barkBase.b * m * 0.94; return kc; };
        loft(S, axis, rad, TS_SAT, 9, col, k3, H, 0.85);
      }
      // strangler roots winding up the core, standing proud of it
      const nC = 12 + gr.int(0, 3) + (mother ? 9 : 0);
      for (let q = 0; q < nC; q++) {
        const a0 = gr.range(0, TAU), turn = gr.sign() * gr.range(1.2, 2.8), r = gr.range(0.17, 0.32) * (mother ? 1.25 : 1), t0 = gr.range(0, 0.15), t1 = gr.range(0.6, 1), wob = gr.range(0, TAU);
        if (mother) { let cross = false; for (let sI = 0; sI <= 12; sI++) { const tt = lerp(t0, t1, sI / 12), hw = hwAt(tt * H); if (hw > 0 && Math.abs(wrapA(a0 + turn * tt - aH)) < hw * 1.5 + 0.3) cross = true; } if (cross) continue; }
        const axis = (t, o) => { const tt = lerp(t0, t1, t), a = a0 + turn * tt + 0.25 * Math.sin(tt * 9 + wob), rd = coreR(tt, a) + r * 0.45; o[0] = G.x + Math.cos(a) * rd; o[1] = f0 + tt * H; o[2] = G.z + Math.sin(a) * rd; };
        const rad = (t) => r * (1 + 0.6 * Math.exp(-t * 6)) * (1 - 0.5 * t);
        const col = (t, a) => { const m = 0.8 + 0.2 * Math.cos(a); kc[0] = barkBase.r * m * 1.06; kc[1] = barkBase.g * m; kc[2] = barkBase.b * m * 0.9; return kc; };
        loft(S, axis, rad, TS_CL, 5, col, 1, (t1 - t0) * H);
      }
      // the fins run out over the floor as roots as thick as a man
      const nF = mother ? 13 : 9;
      for (let q = 0; q < nF; q++) {
        const a0 = ((q + gr.range(-0.3, 0.3)) / nF) * TAU, len = gr.range(12, 22), curl = gr.range(-0.9, 0.9), wp = gr.range(0, TAU), r0 = gr.range(0.55, 0.9) * (mother ? 1.2 : 1);
        if (mother && Math.abs(wrapA(a0 - aH)) < 0.46) continue;
        const axis = (t, o) => { const a = a0 + curl * t + 0.3 * Math.sin(t * 6 + wp), d = R0 * 1.25 + t * len; o[0] = G.x + Math.cos(a) * d; o[2] = G.z + Math.sin(a) * d; o[1] = floorY(o[0], o[2]) + 0.05 + 0.9 * (1 - t) * (1 - t); };
        const rad = (t) => r0 * (1 - 0.85 * t) + 0.06;
        const col = (t, a) => { const m = 0.74 + 0.3 * Math.cos(a - 1.57); kc[0] = barkBase.r * m; kc[1] = barkBase.g * m * 0.97; kc[2] = barkBase.b * m * 0.9; return kc; };
        loft(S, axis, rad, TS_RT, mother ? 9 : 7, col, 1, len);
      }
      await ctx.yield();
      // boughs, each propped on pillars of its own and hung with curtains of rope roots
      for (let q = 0; q < 6; q++) {
        if (q > 0) await ctx.yield();
        const a0 = ((q + gr.range(-0.25, 0.25)) / 6) * TAU + 0.4, len = gr.range(20, 31), hb = H * gr.range(0.6, 0.78), ca = Math.cos(a0), sa = Math.sin(a0);
        const ex = G.x + ca * (R0 + len), ez = G.z + sa * (R0 + len), eTop = Math.min(ceilY(ex, ez) + 0.9, domeY(ex, ez) - 1);
        const yE = Math.min(eTop - 2.5, f0 + hb + gr.range(1, 4)), rA = gr.range(1.0, 1.35) * (R0 / 5), arch = gr.range(0.5, 2.2), wv = gr.range(0, TAU), bend = gr.range(-3, 3);
        const tint = gr.range(0.24, 0.36), prop = gr.range(0.45, 0.65), sdT = [gr(), gr(), gr(), gr(), gr()];
        const axis = (t, o) => { const d = R0 * 0.7 + t * (len + R0 * 0.3), w = bend * Math.sin(Math.PI * t); o[0] = G.x + ca * d - sa * w; o[1] = lerp(f0 + hb, yE, t) + arch * Math.sin(Math.PI * t) + 0.25 * Math.sin(t * 9 + wv); o[2] = G.z + sa * d + ca * w; };
        const rad = (t) => lerp(rA, 0.5, Math.sqrt(t)) * (1 + 0.5 * Math.exp(-t * 7)) * (1 + 0.1 * Math.sin(t * 13 + wv));
        let ok = true;
        for (let sI = 0; sI <= 10; sI++) { axis(sI / 10, o3); if (routeDist3(o3[0], o3[1] - rad(sI / 10), o3[2]) < 5.2 || ocDist(o3[0], o3[2]) < OC.r + 3) ok = false; }
        if (!ok) continue;
        loft(S, axis, rad, TS_B, 8, (t, a) => { const m = tint * (0.85 - 0.3 * Math.sin(a)) * (1 + 1.2 * Math.exp(-t * 5)); kc[0] = barkBase.r * m; kc[1] = barkBase.g * m; kc[2] = barkBase.b * m; return kc; }, 3, len);
        for (let sI = 1; sI < 12; sI++) { axis(sI / 12, o3); const rr = rad(sI / 12); limbPts.push(o3[0], o3[1] - rr, o3[2], 10, o3[0], o3[1] - rr, o3[2], 10); }
        await ctx.yield();
        for (const tp of [1, prop]) {
          axis(tp, o3); const px = o3[0], pz = o3[2];
          if (routeNear(px, pz).d < 10.5 || rho(px, pz) > 0.95 || sightM(px, pz, 6.5)) continue;
          const pTop = tp === 1 ? eTop : o3[1] + 0.3;
          column(px, pz, tp === 1 ? 0.5 : 0.36, pTop, 0, 700 + gi * 31 + q * 7 + tp, true);
          nearCols.push({ x: px, z: pz, r: 0.5, top: pTop, pole: true });
        }
        for (let b = 0; b < 5; b++) {
          const tb = 0.1 + 0.62 * sdT[b]; axis(tb, o3);
          const bx = o3[0], by = o3[1] - rad(tb), bz = o3[2], bl = gr.range(5, 12), nb = 10 + gr.int(0, 8);
          for (let j = 0; j < nb; j++) {
            const x = bx + gr.gauss() * 0.7, z = bz + gr.gauss() * 0.7, ln = Math.min(bl * gr.range(0.55, 1.15), by - floorY(x, z) - 0.6), sd = gr();
            if (ln < 2 || routeDist3(x, by - ln, z) < 5.5 || routeDist3(x, by - ln * 0.5, z) < 5.5) continue;
            giantThreads.push(x, by, z, ln, sd);
          }
        }
      }
      await ctx.yield();
    }
  }
  // ---- the langurs' bough: one low limb that crosses the route between two poles (the world's monkeys bound along it)
  const bough = { a: new THREE.Vector3(), b: new THREE.Vector3(), mid: new THREE.Vector3(), sag: 0.9, r: 0.3 };
  {
    const ub = opts.boughU ?? 0.563, i = clamp(Math.round(ub * NS), 1, NS - 2);
    const tx = sx[i + 1] - sx[i], tz = sz[i + 1] - sz[i], tl = Math.hypot(tx, tz) || 1, rx = -tz / tl, rz = tx / tl;
    const yb = sy[i] + 3.5, half = 13.5;
    bough.a.set(sx[i] + rx * half, yb + 0.9, sz[i] + rz * half); bough.b.set(sx[i] - rx * half, yb + 0.9, sz[i] - rz * half);
    bough.mid.set(sx[i], yb, sz[i]);
    for (const e of [bough.a, bough.b]) {
      const top = Math.min(ceilY(e.x, e.z) + 0.9, domeY(e.x, e.z) - 1);
      column(e.x, e.z, 0.44, top, 0, 901.3 + e.x, true);
      nearCols.push({ x: e.x, z: e.z, r: 0.44, top, pole: true });
    }
    const axis = (t, o) => { o[0] = lerp(bough.a.x, bough.b.x, t); o[1] = lerp(bough.a.y, bough.b.y, t) - bough.sag * Math.sin(Math.PI * t) + 0.08 * Math.sin(t * 17); o[2] = lerp(bough.a.z, bough.b.z, t); };
    const rad = (t) => bough.r * (1 + 0.45 * Math.pow(Math.abs(2 * t - 1), 3)) * (1 + 0.12 * Math.sin(t * 23));
    const col = (t, a) => { const m = 0.42 * (0.85 - 0.3 * Math.sin(a)); kc[0] = barkBase.r * m; kc[1] = barkBase.g * m; kc[2] = barkBase.b * m; return kc; };
    loft(S, axis, rad, [0, 0.06, 0.14, 0.24, 0.36, 0.5, 0.64, 0.76, 0.86, 0.94, 1], 8, col, 2, 27);
  }
  // ---- the GREAT ROOT (the langurs' seat): a surface root as thick as a man, humped like a sea serpent. It belongs to the
  //      tree: it leaves the flared foot of the first giant and runs out over the floor by the law the giant's own lesser
  //      roots follow (a bearing that curls and wavers as it goes out), every number of it drawn from a stream of its own.
  //      Its length along its own back is drawn from ROOT_LEN. Its bearing is drawn among the ROOT_WAYS bearings round the
  //      trunk in which it meets nothing that stands: no pillar and no pole (ROOT_ROOM metres clear of its foot), neither
  //      end of the langurs' limb, none of the set pieces worked out above, and not the corridor we fly (the contract of
  //      worlds: nothing solid within 6 m of the path, here in plan). Nothing moves for it. Where no bearing is free at
  //      the drawn length it is laid 2 m shorter, and so on (a root no longer than the troop's own sitting room,
  //      ROOT_SEATS times SEAT_ROOM, is asked to keep the corridor only). Its gap in the roof is over its own middle (the
  //      sitters 2.6 m up; 6.5 m across the sun and 9 m along it); what is placed after it keeps clear of it (keepOut).
  //      rootS is the length of root, in metres, from the foot to t = j / 48.
  const ROOT_LEN = [18, 24], ROOT_WAYS = 24, ROOT_ROOM = 1.5, CORRIDOR = 6, ROOT_SEATS = 6, SEAT_ROOM = 1.2;
  let rootXZ = null; const rootS = new Float32Array(49);
  await ctx.yield();
  {
    const rt = xr('greatroot'), G = GIANTS[0], q = [0, 0], curl = rt.range(-0.9, 0.9), wp = rt.range(0, TAU), a00 = rt.range(0, TAU), pick = rt();
    const wayAt = (a0, run) => (t, o) => { const a = a0 + curl * t + 0.3 * Math.sin(t * 6 + wp), d = G.R * 1.25 + t * run; o[0] = G.x + Math.cos(a) * d; o[1] = G.z + Math.sin(a) * d; };
    const measure = (way) => { let px = 0, pz = 0; for (let j = 0; j <= 48; j++) { way(j / 48, q); rootS[j] = j ? rootS[j - 1] + Math.hypot(q[0] - px, q[1] - pz) : 0; px = q[0]; pz = q[1]; } return rootS[48]; };
    const within = (x, z, ox, oz, room) => (x - ox) * (x - ox) + (z - oz) * (z - oz) < room * room;
    const meets = (x, z, last) => {
      if (routeNear(x, z).d < CORRIDOR) return true;
      if (last) return false;
      if (kept(x, z, ROOT_ROOM) || within(x, z, llA[0], llA[1], 1 + ROOT_ROOM) || within(x, z, llB[0], llB[1], 1 + ROOT_ROOM)) return true;
      for (const p of pillars) if (!p.ghost && within(x, z, p.x, p.z, p.r * (p.col ? 2 : 1.6) + ROOT_ROOM)) return true;
      for (const p of nearCols) if (p.pole && within(x, z, p.x, p.z, p.r * 2 + ROOT_ROOM)) return true;
      return false;
    };
    const free = (way, last) => { for (let j = 0; j <= 48; j++) { way(j / 48, q); if (meets(q[0], q[1], last)) return false; } return true; };
    for (let len = rt.range(ROOT_LEN[0], ROOT_LEN[1]); !rootXZ; len -= 2) {
      let run = len; for (let it = 0; it < 6; it++) run *= len / measure(wayAt(0, run));          // how far out it runs, to be `len` metres long along its back
      const last = len <= ROOT_SEATS * SEAT_ROOM, ways = [];
      for (let k = 0; k < ROOT_WAYS; k++) { const way = wayAt(a00 + (k / ROOT_WAYS) * TAU, run); if (free(way, last)) ways.push(way); if ((k & 3) === 3) await ctx.yield(); }
      if (ways.length || last) rootXZ = ways.length ? ways[Math.min(ways.length - 1, Math.floor(pick * ways.length))] : wayAt(a00, run);
    }
    measure(rootXZ);
    for (let k = 0; k <= 6; k++) { rootXZ(k / 6, q); keepOut.push([q[0], q[1], 3.0]); }
    rootXZ(0.5, q);
    stations.langurRoot = new THREE.Vector3(q[0], floorY(q[0], q[1]) + 2.6, q[1]);
    const tanEl = sunDir.y / Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z)), sl = (ROOF - 2.6) / tanEl, gx = q[0] + sunH.x * sl, gz = q[1] + sunH.z * sl;
    if (rho(gx, gz) < 0.94 && ocDist(gx, gz) > OC.r + 9) { const sh2 = { gx, gz, a: 6.5, b: clamp(9 * 0.14 / tanEl, 9 * 0.6, 9 * 1.5), I: 1.12, x: 1 }; shafts.push(sh2); maskBlob(sh2); }
  }
  // ---- round six: the set pieces of the middle hall (a store of their own, drawn only while we are in that stretch) ----
  const SX = new Store(), feats = { rootSeats: [], perchA: new THREE.Vector3(), batBough: null, langurLimb: null, featThreads: [] };
  {
    const fr = xr('features'), o3 = [0, 0, 0], o4 = [0, 0, 0];
    const bk = (m, w = 0) => { kc[0] = barkBase.r * m * (1 + 0.05 * w); kc[1] = barkBase.g * m; kc[2] = barkBase.b * m * (1 - 0.08 * w); return kc; };
    // the great root: two humps a langur can sit on, its ends going under the litter, lesser roots propping it and snaking off
    {
      const hump = (t) => 2.05 * Math.exp(-Math.pow((t - 0.27) / 0.135, 2)) + 1.35 * Math.exp(-Math.pow((t - 0.66) / 0.11, 2));
      const rr = (t) => (0.5 - 0.14 * t) * (0.55 + 0.45 * smoothstep(0, 0.08, t) * (1 - smoothstep(0.9, 1, t)));
      const axis = (t, o) => { rootXZ(t, o4); o[0] = o4[0]; o[2] = o4[1]; o[1] = floorY(o4[0], o4[1]) - 0.3 + 0.62 * smoothstep(0, 0.1, t) * (1 - smoothstep(0.88, 1, t)) + hump(t); };
      let lobe = 1; const kph = fr.range(0, TAU);
      const rad = (t, a) => { lobe = Math.pow(Math.abs(Math.sin(0.5 * (5 * a + 9 * t + kph))), 0.7); return rr(t) * (1 + 0.24 * (lobe - 0.6)) * (1 + 0.1 * Math.sin(t * 31 + kph)); };
      const col = (t, a) => bk(1.4 * (0.5 + 0.5 * lobe) * (0.72 + 0.28 * Math.cos(a)) * (0.75 + 0.25 * smoothstep(0, 1.2, hump(t))), 0.5);
      const ts = []; for (let i = 0; i <= 30; i++) ts.push(i / 30);
      loft(SX, axis, rad, ts, 12, col, 5, 26, 0.7);
      // seats along its back, dealt from the troop's own stream: ROOT_SEATS of them (the root's share of the troop: the
      // world seats one langur on each; fewer only on a root too short to hold them), along the length that stands out
      // of the litter (from its rise at t 0.1 to its dive at t 0.88, as axis() has them), no two nearer than SEAT_ROOM
      // metres along the root (a langur's sitting room). One draw each, in order along the root: the room left over
      // when every seat has its least spacing is shared out among them by those draws. Each with the way the root
      // itself runs there (a sitter sits across it) and a seeded turn
      const tq = xr('troop'), seatT = [];
      {
        const sAt = (t) => { const f = clamp(t, 0, 1) * 48, j = Math.min(47, Math.floor(f)); return lerp(rootS[j], rootS[j + 1], f - j); };
        const tAt = (m) => { let j = 0; while (j < 47 && rootS[j + 1] < m) j++; return (j + (m - rootS[j]) / Math.max(rootS[j + 1] - rootS[j], 1e-6)) / 48; };
        const m0 = sAt(0.1), room = sAt(0.88) - m0, n = Math.min(ROOT_SEATS, 1 + Math.floor(room / SEAT_ROOM)), draws = [];
        for (let k = 0; k < n; k++) draws.push(tq());
        draws.sort((a, b) => a - b);
        for (let k = 0; k < n; k++) seatT.push(tAt(m0 + draws[k] * (room - (n - 1) * SEAT_ROOM) + k * SEAT_ROOM));
      }
      for (const t of seatT) {
        axis(t, o3); axis(t + 0.02, o4);
        feats.rootSeats.push({ x: o3[0], y: o3[1] + rr(t) * 0.86, z: o3[2], ax: o4[0] - o3[0], az: o4[2] - o3[2], turn: fr.range(-0.5, 0.5) });
      }
      { const oq = [0, 0, 0]; feats.rootAt = (t, out) => { axis(t, oq); return out.set(oq[0], oq[1] + rr(t), oq[2]); }; }
      // props: younger roots that came down beside it and fused under each hump; one runs off across the floor
      for (let q = 0; q < 7; q++) {
        const t0 = q < 4 ? 0.16 + 0.07 * q + fr.range(-0.02, 0.02) : 0.58 + 0.06 * (q - 4), sd = q % 2 ? 1 : -1, off = fr.range(0.8, 1.9), r0 = fr.range(0.1, 0.17), wv = fr.range(0, TAU);
        axis(t0, o3); axis(Math.min(1, t0 + 0.02), o4);
        let px = -(o4[2] - o3[2]), pz = o4[0] - o3[0]; const pl = Math.hypot(px, pz) || 1; px *= sd / pl; pz *= sd / pl;
        const jx = o3[0], jy = o3[1] - rr(t0) * 0.5, jz = o3[2], fx = jx + px * off, fz = jz + pz * off, fy = floorY(fx, fz) - 0.25;
        loft(SX, (t, o) => { const e = t * t; o[0] = lerp(fx, jx, e) + 0.12 * Math.sin(t * 5 + wv); o[1] = lerp(fy, jy, t); o[2] = lerp(fz, jz, e); }, (t) => r0 * (1 + 1.5 * Math.exp(-t * 6) + 0.5 * t), [0, 0.1, 0.3, 0.6, 0.85, 1], 5, (t, a) => bk(0.78 + 0.2 * Math.cos(a), 1), 1, 2);
      }
      for (const [t0, sd] of [[0.45, 1], [0.8, -1], [0.1, 1]]) {
        axis(t0, o3); axis(Math.min(1, t0 + 0.02), o4);
        let px = -(o4[2] - o3[2]), pz = o4[0] - o3[0]; const pl = Math.hypot(px, pz) || 1; px *= sd / pl; pz *= sd / pl;
        const bx = o3[0], bz = o3[2], len = fr.range(5, 9), curl = fr.range(-0.8, 0.8), a0 = Math.atan2(pz, px), wv = fr.range(0, TAU);
        loft(SX, (t, o) => { const a = a0 + curl * t + 0.3 * Math.sin(t * 6 + wv), d = 0.2 + t * len; o[0] = bx + Math.cos(a) * d; o[2] = bz + Math.sin(a) * d; o[1] = floorY(o[0], o[2]) + 0.04 + 0.3 * (1 - t) * (1 - t); }, (t) => 0.26 * (1 - 0.8 * t) + 0.05, [0, 0.1, 0.22, 0.36, 0.52, 0.68, 0.84, 1], 6, (t, a) => bk(0.62 + 0.25 * Math.cos(a - 1.57)), 1, len);
      }
    }
    // the cock's root: a knuckle of root standing 0.8 m out of the litter in his bar of light
    {
      const st = stations.peacockA, ya = fr.range(0, TAU), ca = Math.cos(ya), sa = Math.sin(ya), fy = floorY(st.x, st.z);
      let lobe = 1;
      const axis = (t, o) => { const d = (t - 0.5) * 5.6; o[0] = st.x + ca * d + sa * 0.5 * Math.sin(t * 5); o[2] = st.z + sa * d - ca * 0.5 * Math.sin(t * 5); o[1] = fy - 0.45 + 0.86 * Math.sin(Math.PI * t) * Math.sin(Math.PI * t); };
      const rad = (t, a) => { lobe = Math.pow(Math.abs(Math.sin(0.5 * (4 * a + 6 * t))), 0.7); return (0.2 + 0.26 * Math.sin(Math.PI * t)) * (1 + 0.22 * (lobe - 0.6)); };
      loft(SX, axis, rad, [0, 0.08, 0.18, 0.3, 0.42, 0.5, 0.58, 0.7, 0.82, 0.92, 1], 10, (t, a) => bk((0.5 + 0.5 * lobe) * (0.75 + 0.25 * Math.cos(a)), 0.5), 4, 5.6, 0.7);
      axis(0.5, o3); feats.perchA.set(o3[0], o3[1] + 0.44, o3[2]);
      for (let q = 0; q < 4; q++) {
        const a0 = ya + 1.2 + q * 1.5 + fr.range(-0.3, 0.3), len = fr.range(2.5, 5), curl = fr.range(-0.9, 0.9), wv = fr.range(0, TAU);
        loft(SX, (t, o) => { const a = a0 + curl * t + 0.3 * Math.sin(t * 6 + wv), d = 0.3 + t * len; o[0] = st.x + Math.cos(a) * d; o[2] = st.z + Math.sin(a) * d; o[1] = floorY(o[0], o[2]) + 0.03 + 0.28 * (1 - t) * (1 - t); }, (t) => 0.17 * (1 - 0.8 * t) + 0.04, [0, 0.14, 0.3, 0.5, 0.72, 1], 5, (t, a) => bk(0.62 + 0.25 * Math.cos(a - 1.57)), 1, len);
      }
    }
    // the two boughs, each on two poles of its own (lofted into the same store)
    const boughOn = (A2, B2, yA, yB, r, sag, seed, poles = true) => {
      const b = { a: new THREE.Vector3(A2[0], yA, A2[1]), b: new THREE.Vector3(B2[0], yB, B2[1]), sag, r };
      ST = SX;
      if (poles) for (const e of [b.a, b.b]) {
        const top = Math.min(ceilY(e.x, e.z) + 0.9, domeY(e.x, e.z) - 1);
        column(e.x, e.z, 0.5, top, 0, seed + e.x * 0.37, true, 0, SX, 0);
        nearCols.push({ x: e.x, z: e.z, r: 0.5, top, pole: true });
      }
      ST = S;
      const len = b.a.distanceTo(b.b), wv = fr.range(0, TAU);
      const axis = (t, o) => { o[0] = lerp(b.a.x, b.b.x, t); o[1] = lerp(b.a.y, b.b.y, t) - sag * Math.sin(Math.PI * t) + 0.1 * Math.sin(t * 15 + wv); o[2] = lerp(b.a.z, b.b.z, t); };
      const rad = (t, a) => r * (1 + 0.5 * Math.pow(Math.abs(2 * t - 1), 3)) * (1 + 0.1 * Math.sin(t * 21 + wv)) * (1 + 0.12 * Math.sin(3 * a + t * 9));
      const ts = []; for (let i = 0; i <= 16; i++) ts.push(i / 16);
      loft(SX, axis, rad, ts, 9, (t, a) => bk(0.72 * (0.84 - 0.26 * Math.sin(a)), 0.3), 3, len, 0.6);
      b.at = (t, o) => { axis(t, o3); return o.set(o3[0], o3[1], o3[2]); };
      // stubs of lesser limbs going up into the roof from it
      for (let q = 0; q < 3; q++) {
        const t0 = 0.2 + 0.3 * q + fr.range(-0.06, 0.06), ang = fr.range(0, TAU), up = fr.range(3, 5.5), lean = fr.range(1, 2.6);
        axis(t0, o3); const bx = o3[0], by = o3[1], bz = o3[2];
        loft(SX, (t, o) => { o[0] = bx + Math.cos(ang) * lean * t * t; o[1] = by + up * t; o[2] = bz + Math.sin(ang) * lean * t * t; }, (t) => r * (0.62 - 0.3 * t), [0, 0.2, 0.5, 1], 5, (t, a) => bk(0.6 + 0.1 * Math.cos(a)), 2, up);
      }
      return b;
    };
    {
      const yb = sy[iGrove] + 4.3;
      feats.batBough = boughOn(bbA, bbB, yb + 0.5, yb + 0.9, 0.4, 0.7, 941.7);
      const yl = sy[iLimb] + 0.55;
      feats.langurLimb = boughOn(llA, llB, yl + 0.3, yl + 0.7, 0.36, 0.55, 977.3, !!llA.own);
      // root threads let down from both: short over our way, long toward their ends
      const v3 = new THREE.Vector3();
      for (const [b, n] of [[feats.batBough, 26], [feats.langurLimb, 16]]) for (let q = 0; q < n; q++) {
        const t = fr.range(0.06, 0.94); b.at(t, v3);
        const x = v3.x + fr.range(-0.25, 0.25), z = v3.z + fr.range(-0.25, 0.25), y = v3.y - b.r, nr = routeNear(x, z);
        const len = Math.min(fr.range(1.2, 6.5), y - floorY(x, z) - 0.5, nr.d < 6 ? Math.max(0, y - (sy[nr.i] + 3.0)) : 99);
        if (len > 0.5) feats.featThreads.push(x, y, z, len, fr());
      }
    }
  }
  await ctx.yield();
  // ---- round nine: the roost boughs of the nave (the brief's journey: 'u 0.57-0.73 ... the roost nave through the mother
  //      grove ... the ceiling 6 m overhead dense with hanging bats and six landings timed to our passing'). Six low boughs
  //      slant across our way through the grove, one every 20 to 26 m of the route by seeded draw, each on two poles of its
  //      own that stand where no pillar does and outside the elder trunk's clearing (ELDER_CLEAR metres round it; a bough
  //      may cross that clearing only higher than the trunk's flare); each has its own gap in the roof, so a bar of sun
  //      crosses the place on it where a bat will land. A draw that falls at the bat bough takes that bough. They are
  //      lofted into three stores of their own (thirds of the nave), each drawn while the lens is under the roof within
  //      160 m of it; they take nothing from the hall's random stream and no pillar moves for them.
  const roostStores = [new Store(), new Store(), new Store()];
  feats.roost = [];
  {
    const rr = xr('roost'), o3 = [0, 0, 0], mPer = path.length / NS, iN0 = Math.round(0.57 * NS), iN1 = Math.round(0.73 * NS);
    const tanEl = sunDir.y / Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z));
    const bk = (m, w = 0) => { kc[0] = barkBase.r * m * (1 + 0.05 * w); kc[1] = barkBase.g * m; kc[2] = barkBase.b * m * (1 - 0.08 * w); return kc; };
    const FLARE = 10;
    const clearAt = (x, z) => {
      if (kept(x, z, 1.6) || elderD(x, z) < ELDER_CLEAR || giantD(x, z) < 4.5 || routeNear(x, z).d < 8.6 || rho(x, z) > 0.95) return false;
      for (const q of pillars) { const cl = q.r * 1.6 + 2.0, dx = q.x - x, dz = q.z - z; if (dx * dx + dz * dz < cl * cl) return false; }
      for (const q of nearCols) { if (!q.pole) continue; const dx = q.x - x, dz = q.z - z; if (dx * dx + dz * dz < 9) return false; }
      return true;
    };
    const ts = []; for (let i = 0; i <= 14; i++) ts.push(i / 14);
    const gapFor = (h) => {      // a gap in the roof whose bar of sun crosses the point h
      const sl = (ROOF - Math.min(h.y, ROOF - 2)) / tanEl, gx = h.x + sunH.x * sl, gz = h.z + sunH.z * sl;
      if (rho(gx, gz) < 0.94 && ocDist(gx, gz) > OC.r + 9) { const sh2 = { gx, gz, a: 5.5, b: clamp(5 * 0.14 / tanEl, 3, 7.5), I: 1.12, x: 1 }; shafts.push(sh2); maskBlob(sh2); }
    };
    // where they stand: one is the ALARM bough, 17 m beyond the point of the route at u 0.6 (the brief's amended beat: 'the
    // langur troop barks and bounds along the boughs at u 0.6'), so that the troop bounds across our way 17 m ahead at
    // that beat; one stands a seeded 34 to 40 m before it (short of the great root, which is the troop's) and the others
    // follow at seeded 21 to 26 m after
    const dAlarm = 0.6 * path.length + 17, g0 = rr.range(34, 40), where = [dAlarm - g0, dAlarm];
    for (let k = 2; k < 6; k++) where.push(where[k - 1] + rr.range(21, 26));
    const latOf = (x, z) => { const n = routeNear(x, z), i = clamp(n.i, 0, NS - 1); return ((x - sx[i]) * -(sz[i + 1] - sz[i]) + (z - sz[i]) * (sx[i + 1] - sx[i]) < 0 ? -1 : 1) * n.d; };      // metres to the right of the route
    const hangOn = (at, side, hLat) => {      // the place on a bough that lies hLat metres to the given side of our way
      let best = 1e9, bt = 0.5; const q = new THREE.Vector3();
      for (let t = 0.12; t <= 0.881; t += 0.02) { at(t, q); const e = Math.abs(latOf(q.x, q.z) - side * hLat); if (e < best) { best = e; bt = t; } }
      return bt;
    };
    for (let k = 0; k < 6; k++) {
      const side = rr.sign(), slant = rr.sign() * rr.range(0.9, 2.4), hLat = rr.range(3.6, 4.6), up = rr.range(5.3, 5.9), rB = rr.range(0.34, 0.42), seed = rr.range(0, 900), wv = rr.range(0, TAU);
      const stub = [rr.range(-0.06, 0.06), rr.range(0, TAU), rr.range(3, 5.5), rr.range(1, 2.6), rr.range(-0.06, 0.06), rr.range(0, TAU), rr.range(3, 5.5), rr.range(1, 2.6)];
      const iW = clamp(Math.round(where[k] / mPer), 1, NS - 2);
      if (iW > iN1 - 4 || iW < iN0 + 2) continue;
      if (k !== 1 && Math.abs(iW - iGrove) * mPer < 11) {          // this one comes in to the bat bough itself
        const B = feats.batBough, hT = hangOn(B.at, side, hLat), hang = B.at(hT, new THREE.Vector3()); hang.y -= B.r;
        gapFor(hang);
        feats.roost.push({ a: B.a, b: B.b, r: B.r, at: B.at, hangT: hT, hang, side, d: iGrove * mPer, own: false, alarm: false });
        continue;
      }
      let A2 = null, B2 = null, i = iW;
      for (const di of [0, 2, -2, 4, -4]) {
        if (A2 && B2) break;
        if (k === 1 && di) break;                      // (the alarm bough stands where the beat puts it)
        i = clamp(iW + di, 1, NS - 2);
        for (const sg of [1, -1, 0]) {
          if (A2 && B2) break;
          A2 = B2 = null;
          for (let lat = 9.3; lat < 16.5 && !A2; lat += 0.6) { const q = stationPt((i - sg * slant) / NS, -lat); if (clearAt(q[0], q[1])) A2 = q; }
          for (let lat = 9.3; lat < 16.5 && !B2; lat += 0.6) { const q = stationPt((i + sg * slant) / NS, lat); if (clearAt(q[0], q[1])) B2 = q; }
        }
      }
      if (!A2 || !B2) continue;
      {       // across the elder's clearing a bough passes only above the trunk's flare
        const yLow = sy[i] + (k === 1 ? 3.9 : up) + 0.5 - 0.7 - rB; let low = false;
        for (let t = 0; t <= 1.001; t += 0.1) { const x = lerp(A2[0], B2[0], t), z = lerp(A2[1], B2[1], t); if (elderD(x, z) < ELDER_CLEAR && yLow < floorY(x, z) + FLARE) low = true; }
        if (low) continue;
      }
      const SR = roostStores[clamp(Math.floor((i - iN0) / Math.max(1, iN1 - iN0) * 3), 0, 2)];
      // (the alarm bough is the lowest: the troop that bounds along it is some 9 to 10 m up, 4 m over our line)
      const yb = sy[i] + (k === 1 ? 3.9 : up), b = { a: new THREE.Vector3(A2[0], yb + 0.5, A2[1]), b: new THREE.Vector3(B2[0], yb + 0.9, B2[1]), sag: 0.7, r: rB };
      ST = SR;
      for (const e of [b.a, b.b]) {
        const head = Math.min(ceilY(e.x, e.z) + 0.9, domeY(e.x, e.z) - 1);
        column(e.x, e.z, 0.46, Math.max(head, sheetY(e.x, e.z) + 1.3), 0, seed + e.x * 0.37, true, 0, SR, 1, head);
      }
      ST = S;
      const len = b.a.distanceTo(b.b);
      const axis = (t, o) => { o[0] = lerp(b.a.x, b.b.x, t); o[1] = lerp(b.a.y, b.b.y, t) - b.sag * Math.sin(Math.PI * t) + 0.1 * Math.sin(t * 15 + wv); o[2] = lerp(b.a.z, b.b.z, t); };
      const rad = (t, a) => rB * (1 + 0.5 * Math.pow(Math.abs(2 * t - 1), 3)) * (1 + 0.1 * Math.sin(t * 21 + wv)) * (1 + 0.12 * Math.sin(3 * a + t * 9));
      loft(SR, axis, rad, ts, 8, (t, a) => bk(0.72 * (0.84 - 0.26 * Math.sin(a)), 0.3), 3, len, 0.6);
      b.at = (t, o) => { axis(t, o3); return o.set(o3[0], o3[1], o3[2]); };
      for (let q = 0; q < 2; q++) {          // stubs of lesser limbs going up into the roof from it
        const t0 = 0.3 + 0.4 * q + stub[q * 4], ang = stub[q * 4 + 1], upS = stub[q * 4 + 2], lean = stub[q * 4 + 3];
        axis(t0, o3); const bx = o3[0], by = o3[1], bz = o3[2];
        loft(SR, (t, o) => { o[0] = bx + Math.cos(ang) * lean * t * t; o[1] = by + upS * t; o[2] = bz + Math.sin(ang) * lean * t * t; }, (t) => rB * (0.62 - 0.3 * t), [0, 0.2, 0.5, 1], 5, (t, a) => bk(0.6 + 0.1 * Math.cos(a)), 2, upS);
      }
      const hT = hangOn(b.at, side, hLat), hang = b.at(hT, new THREE.Vector3()); hang.y -= rB;
      gapFor(hang);
      const headA = Math.min(ceilY(b.a.x, b.a.z) + 0.9, domeY(b.a.x, b.a.z) - 1), headB = Math.min(ceilY(b.b.x, b.b.z) + 0.9, domeY(b.b.x, b.b.z) - 1);
      feats.roost.push({ a: b.a, b: b.b, r: rB, at: b.at, hangT: hT, hang, side, d: i * mPer, own: true, alarm: k === 1, latA: latOf(b.a.x, b.a.z), headA, headB });
      await ctx.yield();
    }
  }
  await ctx.yield();
  // ---- surface roots snaking from the feet of the near columns ----------------------------------------
  {
    const T_R = [0, 0.12, 0.26, 0.42, 0.6, 0.8, 1];
    let rc = 0;
    for (const p of nearCols) {
      if (p.pole) continue;
      if ((rc++ & 15) === 15) await ctx.yield();
      const n = 2 + (rng.chance(0.5) ? 1 : 0);
      for (let q = 0; q < n; q++) {
        const a0 = rng.range(0, TAU), len = rng.range(5, 12), curl = rng.range(-1.3, 1.3), wig = rng.range(0.4, 1.1), wp = rng.range(0, TAU), r0 = p.r * rng.range(0.28, 0.42);
        const axis = (t, o) => { const a = a0 + curl * t + 0.3 * Math.sin(t * 3.4 + wp) * wig, d = p.r * 1.3 + t * len; o[0] = p.x + Math.cos(a) * d; o[2] = p.z + Math.sin(a) * d; o[1] = floorY(o[0], o[2]) + 0.02 + 0.2 * (1 - t) * (1 - t); };
        const rad = (t) => r0 * (1 - 0.8 * t) + 0.07;
        const col = (t, a) => { const m = 0.62 + 0.25 * Math.cos(a - 1.57); kc[0] = barkBase.r * m; kc[1] = barkBase.g * m * 0.97; kc[2] = barkBase.b * m * 0.9; return kc; };
        if (!p.ghost) { const v0 = S.count; loft(S, axis, rad, T_R, 4, col, 1, len); for (let v = v0; v < S.count; v++) S.u[v * 2] += 1000; }
      }
    }
  }
  await ctx.yield();
  // ---- the floor's own relief: surface roots lying across the litter as ribs 0.2 to 0.4 m high, all along our way under
  //      the roof (one every ten metres or so, on alternate sides), each with copper litter banked against it and fallen
  //      figs lying in the bank; and before the mouth of the elder's hollow, in place of undergrowth, four heavier roots
  //      running out over the floor, two bundles of red-tipped threads let down beside the jambs, litter and figs
  const drifts = [];        // x y z size seed yaw tilt kind (0 a leaf, 2 a fig)
  {
    const rb = xr('ribs'), T_RB = [0, 0.1, 0.22, 0.36, 0.5, 0.64, 0.78, 0.9, 1], o3 = [0, 0, 0];
    const bank = (axis, rad, len, nLeaf, nFig) => {
      for (let q = 0; q < nLeaf + nFig; q++) {
        const t = rb.range(0.08, 0.92), sd = rb.sign(), fig = q >= nLeaf;
        axis(t, o3); const x0 = o3[0], z0 = o3[2]; axis(Math.min(1, t + 0.03), o3);
        let px = -(o3[2] - z0), pz = o3[0] - x0; const pl = Math.hypot(px, pz) || 1; px /= pl; pz /= pl;
        const off = rad(t) * (fig ? rb.range(1.1, 2.6) : rb.range(0.7, 1.9)) + (fig ? 0.1 : 0.05), x = x0 + px * off * sd, z = z0 + pz * off * sd;
        if (poolIn(x, z) > -3 || ocDist(x, z) < OC.r) continue;
        const up = fig ? 0.05 : 0.04 + rad(t) * 0.5 * Math.max(0, 1 - (off - rad(t) * 0.7) / (rad(t) * 1.2));
        drifts.push(x, floorY(x, z) + up, z, fig ? rb.range(0.1, 0.17) : rb.range(0.3, 0.52), rb(), fig ? 0 : Math.atan2(pz * sd, px * sd) + rb.range(-0.7, 0.7), fig ? 0 : rb.range(0.25, 0.8), fig ? 2 : 0);
      }
    };
    const rib = (x0, z0, a0, len, r0, curl, store, nLeaf, nFig) => {
      const wp = rb.range(0, TAU), hmp = rb.range(0.04, 0.16);
      const axis = (t, o) => { const a = a0 + curl * (t - 0.5) + 0.25 * Math.sin(t * 5 + wp), d = (t - 0.5) * len; o[0] = x0 + Math.cos(a) * d; o[2] = z0 + Math.sin(a) * d; o[1] = floorY(o[0], o[2]) - r0 * 0.55 + (r0 * 0.95 + hmp) * Math.pow(Math.sin(Math.PI * t), 0.7); };
      const rad = (t) => r0 * (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * t), 0.6)) * (1 + 0.14 * Math.sin(t * 17 + wp)) + 0.03;
      for (let sI = 0; sI <= 8; sI++) { axis(sI / 8, o3); if (poolIn(o3[0], o3[2]) > -2.5 || ocDist(o3[0], o3[2]) < OC.r + 1.5 || rho(o3[0], o3[2]) > 0.95) return; }
      const col = (t, a) => { const m = 0.66 + 0.26 * Math.cos(a - 1.57); kc[0] = barkBase.r * m; kc[1] = barkBase.g * m * 0.97; kc[2] = barkBase.b * m * 0.9; return kc; };
      const v0 = store.count; loft(store, axis, rad, T_RB, 6, col, 1, len); for (let v = v0; v < store.count; v++) store.u[v * 2] += 1000;
      bank(axis, rad, len, nLeaf, nFig);
    };
    let side = 1;
    for (let i = iLow0 + 34; i < NS - 8; i += 5) {
      if ((i & 31) < 5) await ctx.yield();
      side = -side;
      const tx = sx[i + 1] - sx[i], tz = sz[i + 1] - sz[i], th = Math.atan2(tz, tx), lat = side * rb.range(2.2, 7.5), jit = rb.range(-4, 4);
      const x = sx[i] - Math.sin(th) * lat + Math.cos(th) * jit, z = sz[i] + Math.cos(th) * lat + Math.sin(th) * jit;
      const a0 = th + rb.range(0.5, 1.3) * rb.sign(), len = rb.range(5.5, 10.5), r0 = rb.range(0.17, 0.3), curl = rb.range(-0.9, 0.9), nL = 9 + rb.int(0, 5), nF = 3 + rb.int(0, 3);
      if (kept(x, z, 1.5) || giantD(x, z) < 6) continue;
      let inGlade = false; for (const k in GLADE) if (stations[k] && Math.hypot(x - stations[k].x, z - stations[k].z) < (k === 'chital' ? 9 : 3.5)) inGlade = true;
      if (!inGlade) rib(x, z, a0, len, r0, curl, S, nL, nF);
    }
    const G = GIANTS[1], mf = xr('mouthroots');
    for (let q = 0; q < 4; q++) {
      const sd = q % 2 ? 1 : -1, a = motherA + sd * (0.36 + 0.2 * (q >> 1) + mf.range(-0.04, 0.04)), d = G.R * (1.5 + 0.5 * (q >> 1)) + mf.range(0, 1.2), len = mf.range(7, 10.5);
      rib(G.x + Math.cos(a) * d + Math.cos(motherA) * len * 0.3, G.z + Math.sin(a) * d + Math.sin(motherA) * len * 0.3, motherA + sd * mf.range(0.25, 0.7), len, mf.range(0.34, 0.46), sd * mf.range(0.3, 0.8), SX, 16, 7);
    }
    for (const sd of [-1, 1]) {
      const a = motherA + sd * 0.58, bx = G.x + Math.cos(a) * G.R * 1.42, bz = G.z + Math.sin(a) * G.R * 1.42, by = 12.5 + mf.range(0, 1.5), bl = mf.range(7, 9.5);
      for (let j = 0; j < 11; j++) {
        const x = bx + mf.gauss() * 0.45, z = bz + mf.gauss() * 0.45, ln = Math.min(bl * mf.range(0.6, 1.1), by - floorY(x, z) - 0.8);
        if (ln > 2 && routeDist3(x, by - ln, z) > 5 && routeDist3(x, by - ln * 0.5, z) > 5) giantThreads.push(x, by, z, ln, mf());
      }
    }
  }

  // ---- bark material ---------------------------------------------------------------------------------
  const VS_STD = /* glsl */`
    varying vec3 vP, vN, vC; varying vec2 vUv;
    ${GL_FOG_V}
    void main(){
      vP = position; vN = normal; vC = color; vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`;
  // bark: two families of root strands wind up every pillar, one leaning each way, so they cross and braid; close to,
  // finer strands, flecks, cracks and lenticels come in, the creases go dark and damp, the foot stands in its own shade.
  // The relief is a height in metres and the normal is bent by its screen-space slope (bumpN), so it holds at any range.
  const GL_BUMP = /* glsl */`
    vec3 bumpN(vec3 P, vec3 N, float h, float k){
      vec3 dpx = dFdx(P), dpy = dFdy(P); float hx = dFdx(h), hy = dFdy(h);
      vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
      vec3 grad = (det < 0. ? -1. : 1.) * (hx * r1 + hy * r2);
      return normalize(abs(det) * N - k * grad + vec3(0., 1e-6, 0.));
    }`;
  const barkFrag = (mirror) => /* glsl */`
      varying vec3 vP, vN, vC; varying vec2 vUv;
      ${GL_COMMON}
      ${GL_BUMP}
      ${GL_FOG_F}
      void main(){
        ${mirror ? `if (vP.y < ${POOL.y.toFixed(2)}) discard;` : `if (vP.y < ${(POOL.y + 0.03).toFixed(2)} && poolD(vP.xz) < 0.) discard;      // under the pool's surface`}
        vec3 Ng = normalize(vN + vec3(0., 1e-4, 0.));
        float dist = length(vP - uCam);
        float df = 1. - smoothstep(35., 130., dist), dn = 1. - smoothstep(8., 30., dist);
        // every layer of relief is drawn only while its lines are a few pixels wide: far pillars are clean pale shafts with the
        // soft fluting of their lofted lobes, the lattice of roots comes in under 30 m, the fine grain under 12
        float fwx = fwidth(vUv.x) + 1e-5;
        float wob = vnoise(vec2(vUv.x * 2.3, vUv.y * .22)) * 5.;
        float phA = vUv.x * 18.85 + wob + vUv.y * .6 + .8 * sin(vUv.y * .9 + vUv.x * 2.);
        float kA = (1. - smoothstep(.07, .16, fwx * 3.)) * (1. - smoothstep(26., 58., dist));
        float rA0 = (.5 + .5 * sin(phA)) * (.72 + .28 * sin(phA * .5 + 1.3));                 // cables side by side, some standing prouder
        float bare = smoothstep(.3, .62, vnoise(vec2(vUv.x * .8 + 3., vUv.y * .16)));         // ... in places; plain bark between
        kA *= .35 + .65 * bare;
        // a few thick roots wind up the column standing proud of it, thinner ones cross between them on the other slant
        float c1 = vUv.x + vUv.y * .4 + vnoise(vec2(vUv.x * .9, vUv.y * .2)) * 1.7;
        float c2 = vUv.x * 2. - vUv.y * .7 + vnoise(vec2(vUv.x * 1.1 + 7., vUv.y * .29)) * 2.6;
        float c3 = vUv.x * 3. + vUv.y * 1.3 + vnoise(vec2(vUv.x * 1.6 + 2., vUv.y * .4)) * 2.2;
        float h1 = hash11(floor(c1) + 11.), h2 = hash11(floor(c2) + 17.), h3 = hash11(floor(c3) + 5.);
        float w1 = .17 + .17 * h1, w2 = .07 + .09 * h2, w3 = .06 + .06 * h3;
        float d1 = abs(fract(c1) - .5), d2 = abs(fract(c2) - .5), d3 = abs(fract(c3) - .5);
        float kT = smoothstep(1.2, 2.6, w1 / (fwidth(c1) + 1e-5)) * (1. - smoothstep(34., 64., dist)) * step(.42, hash11(floor(c1) + 3.));
        float kN2 = smoothstep(1.2, 2.6, w2 / (fwidth(c2) + 1e-5)) * (1. - smoothstep(11., 26., dist)) * step(.56, hash11(floor(c2) + 31.));
        float kN3 = smoothstep(1.2, 2.6, w3 / (fwidth(c3) + 1e-5)) * (1. - smoothstep(9., 20., dist)) * step(.66, hash11(floor(c3) + 23.));
        ${mirror ? 'kA *= .35; kT *= .45; kN2 = 0.; kN3 = 0.; dn = 0.;                                 // in the water the bark is softened' : ''}
        float thick = sqrt(max(1. - (d1 / w1) * (d1 / w1), 0.)) * kT;                         // round in section
        float thin = max((1. - smoothstep(w2 * .4, w2, d2)) * kN2, (1. - smoothstep(w3 * .4, w3, d3)) * kN3 * .8);
        float shadow = (1. - smoothstep(w1, w1 * 1.8, d1)) * kT * (1. - step(d1, w1));         // the crease each thick root lies in
        float over = max(thick, thin);
        float rA = mix(.62, rA0, kA);
        float strand = max(rA, over);
        float fine = .5 + .5 * sin(vUv.x * 56.5 + wob * 2.3 + vUv.y * 1.1);
        float kF = dn * (1. - smoothstep(.05, .12, fwx * 9.));
        float fleck = vnoise(vec2(vUv.x * 64., vUv.y * 7.)), crack = smoothstep(.62, .7, vnoise(vec2(vUv.x * 23. + wob, vUv.y * 2.1)));
        float h = (rA - .62) * .07 + thick * .13 + thin * .05 + kF * (fine * .022 + fleck * .012 - crack * .018);
        vec3 N = bumpN(vP, Ng, h, 2.2 * df);
        float crease = (1. - smoothstep(.12, .6, rA0)) * kA;
        float streak = vnoise(vec2(vUv.x * 9., vUv.y * .3 + 3.));
        float blotch = vnoise(vP.xz * .9 + vP.y * .37);
        float isRoot = step(500., vUv.x);                                                       // a surface root lying on the litter
        vec3 alb = vC * mix(.84, .76 + .2 * rA, kA) * (.74 + .42 * streak) * vec3(1., .95, .84);
        alb = mix(alb, alb * vec3(1.16, 1.1, 1.) + vec3(.012, .01, .006), over * .7);          // roots standing proud are younger, paler
        alb *= 1. - .42 * shadow;
        alb *= 1. - kF * (.3 * (1. - fine) * (1. - crease) + .35 * crack - .22 * smoothstep(.74, .8, fleck));      // fine strands, cracks, pale lenticels
        alb = mix(alb, alb * vec3(.64, .6, .54), crease * (.55 + .45 * smoothstep(.3, .7, streak)));         // the creases are dark and damp
        alb = mix(alb, alb * vec3(.8, .92, .84), smoothstep(.55, .8, blotch) * .6);            // lichen
        float moss = uWx.z * smoothstep(.35, .7, vnoise(vP.xz * .5 + vP.y * .2 + 9.)) * (1. - smoothstep(2., 9., vP.y));
        alb = mix(alb, mix(vec3(.07, .16, .04), vec3(.17, .27, .1), isRoot), moss * .8);
        alb = mix(alb, vec3(.24, .15, .075), (1. - smoothstep(.1, .9, vP.y)) * .55 * (1. - isRoot));      // litter banked at the foot
        float ao = (1. - .34 * crease - .25 * shadow) * mix(.56 + .44 * smoothstep(.1, 1.5, vP.y), .92, isRoot);     // and it stands in its own shade
        float holK = 1. - hollowIn(vP);                                                        // nothing rims or fills the inside of the hollow
        vec3 col = alb * (hallLight(vP, N, ao) + (uShade * .38 + uSkyAmb * .1) * (.5 + .5 * ao) * (.12 + .88 * holK));      // shaded bark is cool grey-brown, never black
        // every trunk has a side to the low sun and a side away from it: warm and a little lifted, cool and a good deal darker
        float sl = smoothstep(-.7, .8, dot(Ng, uSunH));
        vec3 sideT = mix(vec3(.6, .72, .9), mix(vec3(1.2, 1.1, .9), vec3(1.12, 1.18, 1.28), uWx.w), sl);
        col *= mix(vec3(1.), sideT, uStage.y * holK * (1. - .75 * isRoot));
        col += alb * (uBounce * 1.1 + uShade * .55) * smoothstep(.1, .8, -Ng.y) * holK;       // the underside of a bough is lit by the floor
        col += alb * (uBounce * .3 + uShade * .2) * isRoot;                                    // a root on the floor lies in the floor's own light: never a black line
        vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
        float sp = max(dot(reflect(-uSunDir, N), V), 0.); sp *= sp; sp *= sp;
        col += uSunCol * sunVis(vP) * sp * sp * (.04 + .5 * uWx.y) * holK;
        float edge = 1. - max(dot(N, V), 0.), moon = max(dot(N, uSunH), 0.);
        col += alb * uSunCol * uWx.w * (.1 * moon * moon + .22 * moon * edge * edge);        // night: a silver-blue edge on the moon side
        // the low sun's glow in the haze rims every trunk on its sunward edge, warm; the far side falls to cool shade
        float sunSide = max(dot(Ng, uSunH), 0.), rimK = edge * edge * (.35 + .65 * sunSide) * smoothstep(-.25, .35, dot(Ng, uSunH));
        col += (alb * 1.6 + vec3(.03, .022, .012)) * uSunCol * uWrap.y * rimK * (.6 + .4 * smoothstep(.5, 4., vP.y)) * holK;
        // near bark is solid (it takes a share of the haze only); beyond 30 m each pillar takes more of the air in front of it,
        // so each stands a step paler than the one before it and the farthest are lost in the green-gold of the hall
        float hs = mix(uWrap.z, 1., smoothstep(26., 105., dist) * (1. - uStage.x));
        col = hallHaze(col, uCam + (vP - uCam) * hs * (.45 + .55 * holK));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`;
  const barkMat = mkMat({ vertexColors: true, vertexShader: VS_STD, fragmentShader: barkFrag(false) });
  // the same bark upside down under the pool's surface: its reflection (lit as the true pillar is)
  const VS_MIRROR = /* glsl */`
    varying vec3 vP, vN, vC; varying vec2 vUv;
    ${GL_FOG_V}
    void main(){
      vP = position; vN = normal; vC = color; vUv = uv;
      vec4 mvPosition = modelViewMatrix * vec4(position.x, ${(2 * POOL.y).toFixed(2)} - position.y, position.z, 1.);
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`;
  const barkMirrorMat = mkMat({ vertexColors: true, side: THREE.DoubleSide, vertexShader: VS_MIRROR, fragmentShader: barkFrag(true) });
  const barkGeo = await S.geometryY(ctx);
  const bark = new THREE.Mesh(barkGeo, barkMat); bark.frustumCulled = false; group.add(bark);
  {
    let n = 0; for (let k = 0; k < mirrorIdx.length; k += 2) n += mirrorIdx[k + 1] - mirrorIdx[k];
    const mi = new Uint32Array(n), src = barkGeo.index.array; let o = 0;
    for (let k = 0; k < mirrorIdx.length; k += 2) { mi.set(src.subarray(mirrorIdx[k], mirrorIdx[k + 1]), o); o += mirrorIdx[k + 1] - mirrorIdx[k]; }
    const mg = new THREE.BufferGeometry();
    for (const nm of ['position', 'normal', 'uv', 'color']) mg.setAttribute(nm, barkGeo.attributes[nm]);
    mg.setIndex(new THREE.BufferAttribute(mi, 1));
    const mirror = new THREE.Mesh(mg, barkMirrorMat); mirror.frustumCulled = false; mirror.renderOrder = -5; group.add(mirror);
    stage.pool.push(mirror);
  }
  await ctx.yield();
  // the braids, one mesh per stretch of the route (shown while we are within sight of it), and the set pieces of the middle hall
  for (const b of braids) {
    if (!b.S.count) continue;
    b.x /= Math.max(b.n, 1); b.z /= Math.max(b.n, 1);
    const P = b.S.p; let r2 = 0;
    for (let i = 0; i < P.length; i += 3) { const dx = P[i] - b.x, dz = P[i + 2] - b.z; if (dx * dx + dz * dz > r2) r2 = dx * dx + dz * dz; }
    b.r = Math.sqrt(r2);
    b.mesh = new THREE.Mesh(await b.S.geometryY(ctx), barkMat); b.mesh.frustumCulled = false; group.add(b.mesh);
    await ctx.yield();
  }
  {
    const fm = new THREE.Mesh(await SX.geometryY(ctx), barkMat); fm.frustumCulled = false; group.add(fm);
    stage.mid.push(fm);
    // the roost boughs of the nave, by thirds (each third is drawn while the lens is near it: see update)
    for (const SR of roostStores) {
      if (!SR.count) continue;
      const rm = new THREE.Mesh(await SR.geometryY(ctx), barkMat); rm.geometry.computeBoundingSphere(); group.add(rm);
      stage.mid.push(rm);
    }
  }
  await ctx.yield();

  // ---- floor: leaf litter --------------------------------------------------------------------------------
  {
    const cs = 20, nx = Math.ceil((RX * 2.24) / cs), nz = Math.ceil((RZ * 2.3) / cs), F = new Store();
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = -RX * 1.12 + i * cs, z = -RZ * 1.15 + j * cs;
      F.v(x, floorY(x, z), z, 0, 1, 0, 0, 0, 1, 1, 1);
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = j * (nx + 1) + i; F.quad(a, a + nx + 1, a + nx + 2, a + 1); }
    const copper = mix3(cAmber, new THREE.Color(0.26, 0.15, 0.07), 0.68);
    const floorMat = mkMat({
      uniforms: { uOchre: { value: mix3(cGold, cCream, 0.62).multiplyScalar(0.55) }, uCopper: { value: copper.multiplyScalar(0.62) }, uGrass: { value: mix3(cLeaf, cCream, 0.35).multiplyScalar(0.6) }, uCourtK: { value: hour === 'day' ? 0.5 : 1 }, uDome: { value: new THREE.Vector2(RX, RZ) } },
      vertexShader: VS_STD, vertexColors: true,
      fragmentShader: /* glsl */`
        varying vec3 vP, vN, vC; varying vec2 vUv;
        uniform vec3 uOchre, uCopper, uGrass; uniform vec2 uDome; uniform float uCourtK;
        ${GL_COMMON}
        ${GL_FOG_F}
        vec4 leafCell(vec2 p){     // xy: tilt, z: coverage, w: id
          vec2 i = floor(p), f = fract(p); float id = hash21(i);
          vec2 c = vec2(.32) + .36 * vec2(hash21(i + 7.7), hash21(i + 3.1));
          float a = id * 6.283; vec2 d = vec2(cos(a), sin(a)); vec2 r = f - c;
          float along = dot(r, d), across = dot(r, vec2(-d.y, d.x));
          float sz = .55 + .45 * hash21(i + 1.3);
          float e = 1. - smoothstep(.6, 1., length(vec2(along * 1.5, across * 2.7)) * 2.5 / sz);
          return vec4(d * e, e, id);
        }
        void main(){
          float rr = length(vP.xz / uDome);
          float edge = rr + .03 * vnoise(vP.xz * .06);
          if (edge > 1.1) discard;
          float pd = poolD(vP.xz);
          if (pd < 0.) discard;                                         // the rain pool: the floor leaves a hole for it
          float dist = length(vP - uCam), df = 1. - smoothstep(9., 46., dist);
          vec2 w = vP.xz + (vec2(vnoise(vP.xz * .8), vnoise(vP.xz * .8 + 31.)) - .5) * .9;
          vec4 l1 = leafCell(w * 2.3);
          vec4 l2 = leafCell(mat2(.8, -.6, .6, .8) * w * 1.55 + 17.3);
          vec4 l3 = leafCell(mat2(.6, .8, -.8, .6) * w * 3.4 + 5.1);
          float mott = fbm2(vP.xz * .09), big = vnoise(vP.xz * .023 + 4.);
          vec3 avg = mix(uOchre, uCopper, smoothstep(.3, .7, mott)) * .78;
          vec3 c1 = mix(uOchre, uCopper, step(.45, fract(l1.w * 5.3))) * (.65 + .6 * fract(l1.w * 9.1));
          vec3 c2 = mix(uOchre * 1.15, uCopper, step(.6, fract(l2.w * 3.7))) * (.75 + .4 * fract(l2.w * 7.9));
          vec3 c3 = mix(uCopper * .6, uOchre * .8, fract(l3.w * 4.1));
          vec3 nearC = mix(avg * .62, c3, l3.z);
          nearC = mix(nearC, c1, l1.z); nearC = mix(nearC, c2, l2.z);
          vec3 alb = mix(avg, nearC, df) * (.8 + .3 * big);
          float fig = step(.975, hash21(floor(w * 5.))) * df * step(length(fract(w * 5.) - .5), .28);
          alb = mix(alb, vec3(.42, .03, .02), fig);
          float court = 1. - smoothstep(uOc.z - 6., uOc.z + 5., length(vP.xz - uOc.xy));
          float outside = smoothstep(.93, 1.03, edge);
          // the courtyard: tussocky pale grass with leaf-strewn earth between, straw where it has dried
          // (in the open the rust blotches of the hall floor are calmed: pale dry earth strewn with leaves under the grass)
          // (in the open: pale dry earth, cracked and pebbled, strewn with the same curled ochre and copper leaves)
          float pebble = vnoise(vP.xz * 3.3) * .6 + vnoise(vP.xz * 9.1) * .4;
          vec3 earth = uOchre * (.4 + .26 * mott) * (.78 + .44 * pebble * df) * (1. - .3 * df * smoothstep(.55, .62, vnoise(vP.xz * 1.3 + 9.)) * step(.5, vnoise(vP.xz * 4.7)));
          // drifts of leaf lie in its hollows, and the biggest leaves (curled, a hand long) still read from the well's height
          float drift = smoothstep(.44, .7, vnoise(vP.xz * .19 + 5.) * .6 + vnoise(vP.xz * .57) * .4), dfc = 1. - smoothstep(34., 120., dist);
          earth = mix(earth, mix(uOchre, uCopper, smoothstep(.25, .75, mott)) * .66, drift * .6);
          vec3 strewn = mix(earth, c3 * 1.2, l3.z * .8); strewn = mix(strewn, c1 * 1.15, l1.z); strewn = mix(strewn, c2 * 1.1, l2.z);
          vec4 l4 = leafCell(mat2(.7, .71, -.71, .7) * w * .95 + 9.4);
          vec3 c4 = mix(uOchre * 1.3, uCopper * 1.2, step(.5, fract(l4.w * 7.3))) * (.8 + .4 * fract(l4.w * 3.1));
          vec3 courtC = mix(earth * 1.05, strewn, df);
          courtC = mix(courtC, c4, l4.z * step(.4, fract(l4.w * 11.7)) * dfc * (.5 + .5 * drift));
          alb = mix(alb, courtC, court);
          alb = mix(alb, alb * vec3(.36, .33, .3), (1. - smoothstep(.3, 3.4, pd)) * .9);          // wet mud and sodden leaves along the pool's shore
          alb = mix(alb, vec3(.2, .17, .12) * (.8 + .5 * vnoise(vP.xz * 2.3)), 1. - smoothstep(.05, .5, pd));      // and a paler rim of drying silt at the water
          float tus = vnoise(vP.xz * .9 + 2.) * .55 + vnoise(vP.xz * 2.9) * .45;
          float gr = max(court * smoothstep(.22, .55, vnoise(vP.xz * .3) * .6 + tus * .4), outside);
          vec3 straw = mix(uGrass, vec3(.4, .33, .15), smoothstep(.3, .8, vnoise(vP.xz * .17 + 7.)));
          float blade = .5 + .5 * vnoise(vP.xz * vec2(11., 13.));
          alb = mix(alb, straw * (.3 + .95 * tus) * mix(1., .6 + .6 * blade, df), gr * .85);
          alb *= mix(1., uCourtK, court);                              // under a high sun the open floor must not bleach
          // the open floor has relief under a low sun: every tussock and drift has a flank turned to the sun and throws
          // a shadow away from it, a metre or two long, over the earth and the lower grass behind it
          vec2 s1 = vP.xz + uSunH.xz * .5, s2 = vP.xz + uSunH.xz * 1.5;
          float hgt = tus * (.35 + .65 * gr), tus1 = vnoise(s1 * .9 + 2.) * .55 + vnoise(s1 * 2.9) * .45, tus2 = vnoise(s2 * .9 + 2.) * .55 + vnoise(s2 * 2.9) * .45;
          float gr2 = smoothstep(.22, .55, vnoise(s2 * .3) * .6 + tus2 * .4);
          float flank = clamp((hgt - tus1 * (.35 + .65 * gr)) * 4., -1., 1.);
          float shd = smoothstep(.1, .34, tus2 * (.35 + .65 * gr2) - hgt) * (1. - smoothstep(60., 170., dist));
          float relief = court * (1. - outside);
          vec3 N = normalize(vec3(0., 1., 0.) + (vec3(l1.x, 0., l1.y) * .8 + vec3(l2.x, 0., l2.y) * .8 + vec3(l3.x, 0., l3.y) * .4) * df);
          vec3 lit = hallLight(vP, N, (.82 + .18 * mott) * (1. - .28 * court * df * (1. - max(l1.z, l2.z)))) + uBounce * .9;      // each leaf in the open lies on its own small shadow
          // the open courtyard is divided by the low sun: a pool of gold where it comes over the rim, cool blue-green shade under the lip
          float cs = courtSun(vP);
          lit = mix(lit, lit * vec3(.36, .58, .7), court * (1. - cs));
          lit *= 1. + relief * (.3 + .7 * cs) * (.42 * flank - .1);
          lit = mix(lit, lit * vec3(.4, .55, .68), relief * cs * shd * .8);
          // curled leaves that happen to face the low sun flare
          float sv = sunVis(vP);
          lit += uSunCol * sv * (.22 + .5 * smoothstep(.2, .9, dot(N, uSunDir)) * df) * (1. + .8 * court * cs);
          vec3 col = hallHaze(alb * lit, vP);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const floor = new THREE.Mesh(F.geometry(), floorMat); floor.frustumCulled = false; group.add(floor);
  }

  // ---- roof: polar sheets from the oculus rim out to the dome rim ------------------------------------------
  function rimDist(ca, sa) {     // distance from the oculus centre to the dome ellipse along (ca, sa)
    const A = (ca * ca) / (RX * RX) + (sa * sa) / (RZ * RZ), B = 2 * ((OC.x * ca) / (RX * RX) + (OC.z * sa) / (RZ * RZ)), C = (OC.x * OC.x) / (RX * RX) + (OC.z * OC.z) / (RZ * RZ) - 1;
    return (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A);
  }
  async function polarSheet(nA, dists, yFn, colFn, up) {
    const P = new Store(), nR = dists(100).length;
    for (let i = 0; i <= nA; i++) {
      if ((i & 15) === 15) await ctx.yield();
      const a = (i / nA) * TAU, ca = Math.cos(a), sa = Math.sin(a), L = rimDist(ca, sa), ds = dists(L);
      for (let j = 0; j < nR; j++) {
        const d = OC.r + ds[j], x = OC.x + ca * d, z = OC.z + sa * d, k = colFn(x, z, ds[j], L);
        P.v(x, yFn(x, z, ds[j], L), z, 0, 1, 0, ds[j], L - OC.r - ds[j], k, k, k);
      }
    }
    await ctx.yield();
    for (let i = 0; i < nA; i++) for (let j = 0; j < nR - 1; j++) { const a = i * nR + j; if (up) P.quad(a, a + nR, a + nR + 1, a + 1); else P.quad(a, a + 1, a + nR + 1, a + nR); }
    await ctx.yield();
    const g = await P.geometryY(ctx); g.computeVertexNormals(); await ctx.yield(); return g;
  }
  const lipY = (x, z, d) => { const s = Math.pow(smoothstep(0, 15, d), 0.55); return lerp(ceilY(x, z) - 1.5, domeY(x, z) - 1.2 * (1 - s), s); };
  await ctx.yield();
  // the dome shell: a tensor grid, 3 m under the approach and round the well and coarser far away, with normals from
  // the height field itself (the old 250-spoke fan left 10 m facets where the camera flies lowest)
  async function domeGrid() {
    const fine = 3 + (1 - detail) * 3;
    const lines = (lo, hi, a, b, cap) => {
      const o = []; for (let v = a; v <= b + 1e-3; v += fine) o.push(v);
      let st = fine, v = o[o.length - 1]; while (v < hi) { st = Math.min(cap, st * 1.2); v = Math.min(hi, v + st); o.push(v); }
      st = fine; v = a; while (v > lo) { st = Math.min(cap, st * 1.2); v = Math.max(lo, v - st); o.unshift(v); }
      return o;
    };
    const xs = lines(-RX * 1.04, RX * 1.04, -128, 46, 14), zs = lines(-RZ * 1.04, RZ * 1.04, 62, 323, 12);
    const nx = xs.length, nz = zs.length, n = nx * nz;
    const pos = new Float32Array(n * 3), nrm = new Float32Array(n * 3), col = new Float32Array(n * 3), uv = new Float32Array(n * 2), keep = new Uint8Array(n);
    for (let j = 0; j < nz; j++) {
      if ((j & 1) === 1) await ctx.yield();
      for (let i = 0; i < nx; i++) {
        let x = xs[i], z = zs[j]; const r = rho(x, z), q = j * nx + i, o = q * 3;
        if (r > 1) { x /= r; z /= r; }
        const od = ocDist(x, z), d = od - OC.r, L = rimDist((x - OC.x) / Math.max(od, 1e-3), (z - OC.z) / Math.max(od, 1e-3));
        pos[o] = x; pos[o + 1] = r > 1 ? 7.5 : lipY(x, z, Math.max(d, -1.5)); pos[o + 2] = z;
        col[o] = crownH(x, z); col[o + 1] = sunReach(x, pos[o + 1], z); col[o + 2] = 1;      // crown height, sun reaching it, spare
        uv[q * 2] = d; uv[q * 2 + 1] = r > 1 ? 0 : L - od;
        keep[q] = r < 1.03 && d > -4.5 ? 1 : 0;
      }
    }
    await ctx.yield();
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const o = (j * nx + i) * 3, a = (j * nx + Math.max(0, i - 1)) * 3, b = (j * nx + Math.min(nx - 1, i + 1)) * 3, c = (Math.max(0, j - 1) * nx + i) * 3, d = (Math.min(nz - 1, j + 1) * nx + i) * 3;
      const ax = pos[b] - pos[a], ay = pos[b + 1] - pos[a + 1], az = pos[b + 2] - pos[a + 2], bx = pos[d] - pos[c], by = pos[d + 1] - pos[c + 1], bz = pos[d + 2] - pos[c + 2];
      let nxn = by * az - bz * ay, nyn = bz * ax - bx * az, nzn = bx * ay - by * ax; const l = Math.hypot(nxn, nyn, nzn);
      if (l < 1e-6 || nyn <= 0) { nxn = 0; nyn = 1; nzn = 0; } else { nxn /= l; nyn /= l; nzn /= l; }
      nrm[o] = nxn; nrm[o + 1] = nyn; nrm[o + 2] = nzn;
    }
    await ctx.yield();
    const idx = [];
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = j * nx + i, b = a + 1, c = a + nx + 1, d = a + nx;
      if (keep[a] + keep[b] + keep[c] + keep[d] === 0) continue;
      idx.push(a, d, c, a, c, b);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
    return g;
  }
  const domeGeo = await domeGrid();
  await ctx.yield();
  const ceilGeo = await polarSheet(CEIL_A, ceilDists, (x, z) => ceilV(x, z), () => 1, false);

  const leafDeep = mix3(cDeep, cLeaf, 0.18), leafMid = mix3(cLeaf, cDeep, 0.45);
  { const l = leafMid.r * 0.3 + leafMid.g * 0.6 + leafMid.b * 0.1; leafMid.lerp(new THREE.Color(l, l, l * 0.9), 0.28); }
  const leafCopper = mix3(cAmber, new THREE.Color(0.24, 0.17, 0.07), 0.72).multiplyScalar(0.62);
  const flush = season === 'monsoon' ? 0.04 : season === 'figs' ? 0.22 : 0.4;
  const skyGlow = night ? new THREE.Color(0.12, 0.18, 0.32) : mix3(cPeach, new THREE.Color(0.7, 0.92, 1.0), hour === 'day' ? 0.7 : 0.45).multiplyScalar(hour === 'day' ? 1.25 : 1.7);
  const LU = { uLeafA: { value: leafDeep }, uLeafB: { value: leafMid }, uLeafC: { value: leafCopper }, uFlush: { value: flush }, uSkyGlow: { value: skyGlow }, uFig: { value: season === 'figs' ? 1 : 0.35 } };
  // the crown in the open (dome, clumps, the leaves of the lip, the saplings): the same greens pulled toward olive, more so
  // under the white light of day and in the monsoon, so the lit flanks are gold-green and never emerald
  const olive = (c, k) => { const l = c.r * 0.3 + c.g * 0.6 + c.b * 0.1; return c.clone().lerp(hour === 'night' ? new THREE.Color(l * 0.78, l * 1.0, l * 1.1) : new THREE.Color(l * 1.12, l * 0.97, l * 0.62), hour === 'night' ? 0.55 : k); };
  const oK = (hour === 'day' ? 0.42 : 0.36) + (season === 'monsoon' ? 0.08 : 0);
  const LUo = { ...LU, uLeafA: { value: olive(leafDeep, Math.min(0.7, oK * 1.3)) }, uLeafB: { value: olive(leafMid, oK) },
    uDomeK: { value: hour === 'day' ? 0.7 : hour === 'night' ? 0.6 : 1 }, uGlint: { value: hour === 'day' ? 0.2 : hour === 'night' ? 0.6 : 0.7 },
    // the air over the crown: haze with distance and mist lying in the creases between the sub-crowns (rgb, strength); the
    // sun on leaves in the open is warmed by day so the lit flanks are olive-gold and never grey
    uAir: { value: hour === 'night' ? new THREE.Vector4(0.085, 0.13, 0.23, 0.6) : hour === 'day' ? new THREE.Vector4(0.6, 0.68, 0.7, 0.36) : new THREE.Vector4(0.8, 0.64, 0.46, 0.3) },
    uSunTint: { value: hour === 'day' ? new THREE.Vector3(1.14, 1.0, 0.7) : new THREE.Vector3(1, 1, 1) },
    uSunLow: { value: sunLow }, uGust: { value: new THREE.Vector4(0.34, -0.94, 0, 11) }, uShadeK: { value: hour === 'day' ? 2.5 : hour === 'night' ? 0.23 : 1.0 } };
  {
    // the fill in the crown's own shade: sky light, green off the leaves round it, so that a crease or a shaded flank is
    // deep green and never black. Its strength is set against the grade's toe (which takes everything under about a
    // twentieth of white to black), by the hour's exposure; by night the dome stays a dark mass under the sky
    const lf = LUo.uLeafA.value.clone().lerp(LUo.uLeafB.value, 0.5), g = new THREE.Vector3(lf.r * 0.86, lf.g, lf.b * 0.98);
    g.lerp(new THREE.Vector3(1, 1, 1).multiplyScalar((g.x + g.y + g.z) / 3), 0.2);
    const lum = g.x * 0.3 + g.y * 0.6 + g.z * 0.1;
    LUo.uFill = { value: new THREE.Vector4(g.x / Math.max(lum, 1e-5), g.y / Math.max(lum, 1e-5), g.z / Math.max(lum, 1e-5), hour === 'day' ? 0.064 : hour === 'night' ? 0.02 : 0.055) };
  }
  const GL_AIR = /* glsl */`
    uniform vec4 uAir, uGust, uFill; uniform vec3 uSunTint, uSunLow; uniform float uShadeK;
    // the crown's deepest shade is lifted to the sky's fill (the darkest most, the lit not at all) by where the LEAF is:
    // m says how open to the sky its place is (0 deep in a crease, 1 on a head) and y is its height in the crown (the
    // heads stand in the open sky; the hem at the rim hangs in the tree's own shade and takes rather over half the fill)
    vec3 domeFill(vec3 col, float m, float y){
      col = max(col, vec3(0.));
      float l = dot(col, vec3(.3, .6, .1)), lf = uFill.w * (1. + .35 * clamp(m, 0., 1.));
      float l2 = max(l, lf * .8 + l * .2);            // nothing darker than the fill; what was darker keeps a fifth of its own modelling
      return col + uFill.rgb * (l2 - l) * (.58 + .42 * smoothstep(6., 18., y));
    }
    vec3 domeAir(vec3 col, vec2 p, float dist, float crown, float back, float well){
      float hol = (1. - crown) * (.3 + .7 * vnoise(p * .018 + vec2(uHall.z * .012, 0.)));
      float low = 1. - smoothstep(10., 26., uCam.y);                              // from inside the court the lip is leaf against the sky, green not gold
      if (low > .001) {      // gold-green crowns and blue-green ones, a copper flush here and there, dark between the leaf heads: foliage, never rock
        float lum = dot(col, vec3(.3, .6, .1)), kind = smoothstep(.35, .65, vnoise(p * .05 + 7.));
        vec3 leafy = lum * mix(vec3(.62, 1.14, .3), vec3(.4, .98, .66), kind);
        leafy = mix(leafy, lum * vec3(1.3, .64, .3), smoothstep(.6, .78, vnoise(p * .11 + 2.)) * (.25 + 1.2 * uFlush) * smoothstep(24., 62., dist));
        leafy *= .56 + .8 * (vnoise(p * .8) * .55 + vnoise(p * 2.1 + 4.) * .45);
        col = mix(col, leafy, low * .88);
      }
      float air = uAir.w * ((1. - exp(-dist * .0021)) * .62 + hol * (.03 + .31 * smoothstep(50., 240., dist))) * well * (1. - .7 * low);
      return mix(col, uAir.rgb * (1. + .35 * back * back), clamp(air, 0., .8));
    }
    float gustBand(vec2 p, float tt){      // one pale front of turned leaves running over the crowns ahead of us, on the wind we ride
      float s = dot(p, uGust.xy) - uGust.z + (vnoise(p * .021 + 3.) - .5) * 30. + (vnoise(p * .09) - .5) * 7.;
      return (1. - smoothstep(uGust.w * .3, uGust.w, abs(s))) * (.55 + .45 * smoothstep(.25, .6, vnoise(p * .045 + vec2(tt * .2, 0.))));
    }
    vec3 domeShade(){ return (uSkyAmb * .42 + uShade * .95) * vec3(.7, .98, 1.14); }      // the shadow side of a crown: blue-green`;
  const GL_LEAF = /* glsl */`
    uniform vec3 uLeafA, uLeafB, uLeafC, uSkyGlow; uniform float uFlush, uFig;
    vec4 leafCell(vec2 p){        // x coverage, y id, z along, w across (leaf space, -1..1)
      vec2 i = floor(p), f = fract(p); float id = hash21(i);
      vec2 c = vec2(.3) + .4 * vec2(hash21(i + 7.7), hash21(i + 3.1));
      float a = id * 6.283; vec2 d = vec2(cos(a), sin(a)); vec2 r = f - c;
      float along = dot(r, d) * 3.4, across = dot(r, vec2(-d.y, d.x)) * 6.2;
      float e = 1. - smoothstep(.6, 1., length(vec2(along, across)));
      return vec4(e, id, along, across);
    }
    vec4 leafCellB(vec2 p){       // bigger blades, for the crown seen from the air (the small ones leave it four fifths gap)
      vec2 i = floor(p), f = fract(p); float id = hash21(i);
      vec2 c = vec2(.34) + .32 * vec2(hash21(i + 7.7), hash21(i + 3.1));
      float a = id * 6.283; vec2 d = vec2(cos(a), sin(a)); vec2 r = f - c;
      float along = dot(r, d) * 2.5, across = dot(r, vec2(-d.y, d.x)) * 4.1;
      float e = 1. - smoothstep(.62, .92, length(vec2(along, across)));
      return vec4(e, id, along, across);
    }
    vec3 leafColor(float id, float pch){
      vec3 c = mix(uLeafA, uLeafB, smoothstep(.2, .9, fract(id * 7.3)));
      return mix(c, uLeafC, step(1. - uFlush * (.1 + 1.1 * pch), fract(id * 3.7)));
    }
    vec3 leafField(vec2 q, vec3 avgLeaf, float pch, out float cover){     // three layers of blades over the dark between them
      vec4 lc = leafCellB(q * .8), lc2 = leafCellB(mat2(.8, -.6, .6, .8) * q + 9.3), lc3 = leafCellB(mat2(.6, .8, -.8, .6) * q * .9 + 3.1);
      vec3 c = mix(avgLeaf * .68, leafColor(lc3.y, pch) * (.7 + .4 * fract(lc3.y * 9.7)), lc3.x);
      c = mix(c, leafColor(lc2.y, pch) * (.8 + .5 * fract(lc2.y * 13.7)), lc2.x);
      c = mix(c, leafColor(lc.y, pch) * (.9 + .6 * fract(lc.y * 5.3)) * (.72 + .28 * smoothstep(0., .22, abs(lc.w))), lc.x);
      cover = max(lc.x, max(lc2.x, lc3.x * .8));
      return c;
    }`;
  const GL_MOUNDS = /* glsl */`
    vec3 mounds(vec2 p){          // rounded heads of leaf with creases between: x height, yz slope away from the head's centre
      vec2 i = floor(p), f = fract(p); float best = 8.; vec2 bd = vec2(0.);
      for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) {
        vec2 g = vec2(float(xx), float(yy));
        vec2 o = vec2(hash21(i + g), hash21(i + g + 17.3));
        vec2 d = g + o - f; float dd = dot(d, d);
        if (dd < best) { best = dd; bd = d; }
      }
      float h = sqrt(max(1. - min(best * 1.35, 1.), 0.));
      return vec3(h, bd * 1.6 / max(h, .4));
    }`;
  // dome shell seen from outside: lumpy crown raked by the low sun
  const domeMat = mkMat({
    uniforms: { ...LUo }, vertexColors: true, vertexShader: VS_STD,
    fragmentShader: /* glsl */`
      varying vec3 vP, vN, vC; varying vec2 vUv;
      ${GL_COMMON}
      ${GL_LEAF}
      ${GL_FOG_F}
      uniform float uDomeK, uGlint;
      ${GL_MOUNDS}
      ${GL_AIR}
      void main(){
        vec2 p = vP.xz;
        if (vUv.y < 2.6 * vnoise(p * .7) + .2) discard;                    // ragged hem of the skirt
        if (vUv.x < -1.2 + 2.4 * vnoise(p * .9 + 5.)) discard;             // ragged lip of the oculus
        float dist = length(vP - uCam), df = 1. - smoothstep(34., 120., dist);
        vec2 pw = p + (vec2(vnoise(p * .11), vnoise(p * .11 + 9.)) - .5) * 9. + (vec2(vnoise(p * .85 + 2.), vnoise(p * .85 + 7.)) - .5) * 1.7;   // leafy, not ruled, creases
        vec3 m1 = mounds(pw / 6.2 + 3.), m2 = mounds(pw / 2.3 - 7.);
        float d2 = 1. - smoothstep(110., 420., dist);
        float h = min(m1.x, mix(1., .35 + .65 * m2.x, d2));
        vec2 sl = m1.yz * .6 + m2.yz * .5 * d2 + (vec2(vnoise(p * .8), vnoise(p * .8 + 5.)) - .5) * .5 * d2;
        vec3 Ng = normalize(vN + vec3(0., 1e-4, 0.));
        vec3 N = normalize(Ng + vec3(-sl.x, 0., -sl.y));
        float sh = mix(.5, .36, df) + mix(.5, .64, df) * smoothstep(0., .6, h);              // far off the florets close up: crowns, not moss
        // leaves: big leathery ovals, each tilted its own way, dark between them
        float pch = smoothstep(.3, .75, vnoise(p * .1 + 11.) * .6 + vnoise(p * .03 + 4.) * .4), cover;
        vec3 avgLeaf = mix(mix(uLeafA, uLeafB, .4), uLeafC, uFlush * (.05 + .45 * pch));
        vec3 nearLeaf = leafField(p, avgLeaf, pch, cover);
        float steep = 1. - smoothstep(.62, .84, Ng.y);                 // on a steep flank the leaves are laid on the slope, not smeared down it
        if (steep > .01 && df > .01) {
          vec2 tgd = normalize(vec2(-Ng.z, Ng.x) + vec2(1e-4, 0.)); float cv2;
          nearLeaf = mix(nearLeaf, leafField(vec2(dot(p, tgd), vP.y * 1.05), avgLeaf, pch, cv2), steep); cover = mix(cover, cv2, steep);
        }
        float crown = smoothstep(.02, .55, vC.r);                      // 0 in the creases between sub-crowns, 1 on their heads
        vec3 alb = mix(avgLeaf, nearLeaf * 1.12, df) * sh * (.36 + .7 * crown);            // dark in the creases where heads meet
        alb *= mix(vec3(1.12, 1., .74), vec3(.8, .97, 1.1), smoothstep(.25, .75, vnoise(p * .023 + 3.) * .6 + vnoise(p * .071) * .4)) * uDomeK;   // crown to crown: yellower, bluer
        // the well: from far above a dark hole (its lip in shadow to well back from the edge); as we come down into it the lip lights up
        float well = mix(1., smoothstep(1., 24., vUv.x), (1. - uMist.w) / .8);
        // gust fronts: bands of paler leaf (undersides turned up) sweep across the dome, the leaves in them fluttering
        float tt = uHall.z;
        float gb = vnoise(p * .012 + vec2(tt * .1, tt * .04)) * .7 + vnoise(p * .035 - vec2(tt * .16, tt * .05)) * .3;
        float gband = gustBand(p, tt), gust = max(smoothstep(.5, .7, gb) * .6, gband), flut = vnoise(p * 1.1 + vec2(tt * 2.3, -tt * 1.9));
        alb = mix(alb, alb * vec3(1.7, 1.8, 1.55) + vec3(.02, .028, .02), gust * (.4 + .6 * flut) * .85);
        alb = mix(alb, alb * 1.5 + vec3(.05, .075, .055), gband * (.5 + .5 * flut) * .8);             // the band itself: undersides turned up, grey-green
        // the big form decides: the sunward flank and the top of each sub-crown are lit, the far flank and whatever lies in
        // the next crown's long shadow fall to blue-green shade; the leaf heads on it model the light, they do not replace it
        float reach = vC.g;
        float difG = smoothstep(-.04, .58, dot(Ng, uSunLow)) * mix(.04, 1., reach);
        float difD = max(dot(N, uSunLow), 0.); difD = difD / (difD + .3) * 1.3;
        float dif = difG * (.42 + .58 * difD);
        dif *= mix(1., .05 + .95 * smoothstep(.45, .92, Ng.y) * crown, uWx.w);                   // by night the moon silvers only the tops of the crowns
        vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
        float back = max(dot(-V, uSunH), 0.), rim = 1. - max(dot(N, V), 0.);
        vec3 amb = domeShade() * (.72 + .28 * N.y) * (.36 + .56 * crown) * uShadeK;
        vec3 lit = uSunCol * uSunTint * (dif * 1.2 + .28 * back * back * rim * rim * reach) + amb * (.5 + .5 * well);
        vec3 col = alb * lit * (.3 + .7 * well) * (1. - .34 * uWx.w);              // by night the dome is a deep blue-green mass, darker than the sky behind it
        float sp = max(dot(reflect(-uSunDir, N), V), 0.); sp *= sp; sp *= sp;
        col += uSunCol * sp * sp * .12 * sh * cover * df * reach * uGlint;                    // leathery leaves glint
        col = domeFill(col, (.3 + .7 * smoothstep(0., .6, h)) * (.4 + .6 * crown) * (.55 + .45 * cover * df + .45 * (1. - df)), vP.y);
        col = domeAir(col, p, dist, crown, back, well);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const dome = new THREE.Mesh(domeGeo, domeMat); dome.frustumCulled = false; group.add(dome); stage.court.push(dome);
  // the roof seen from below: dark leaf mass; where the mask says there is a gap, twigs and leaves hang across it lit
  // through, so the sky shows as a lace of small lights and never as a clean hole
  const roofGL = (lod) => /* glsl */`
    vec3 roofCol(vec2 pw){
      float t = uHall.z;
      vec2 p = pw + (vec2(vnoise(pw * .4 + t * .25), vnoise(pw * .4 - t * .21 + 9.)) - .5) * .7;
      ${lod ? 'float gap = textureLod(uMask, p * uHall.w + .5, 0.).r, soft = textureLod(uMask, p * uHall.w + .5, 3.).r;' : 'float gap = texture2D(uMask, p * uHall.w + .5).r, soft = texture2D(uMask, p * uHall.w + .5, 3.).r;'}
      float b = vnoise(p * 1.7) * .6 + vnoise(p * 5.1) * .4;
      vec4 lc = leafCell(p * .8 + b);
      vec4 lcb = leafCell(mat2(.8, -.6, .6, .8) * p * 1.1 + 4.7); if (lcb.x > lc.x) lc = lcb;
      float pin = smoothstep(.8, .93, vnoise(p * 2.7 + 3.)) * .5;
      float open = smoothstep(.3, .66, gap * 1.2 + pin - b * .5);
      vec4 la = leafCellB(p * .55 + 3.3), lb = leafCellB(mat2(.8, -.6, .6, .8) * p * .8 + 7.1), lc3 = leafCellB(mat2(.6, .8, -.8, .6) * p * 1.15 + 1.9);
      float lace = max(max(la.x, lb.x), lc3.x);
      lace = max(lace, smoothstep(.42, .6, vnoise(p * .55 + 1.) * .6 + vnoise(p * 1.9 + 6.) * .4));                    // whole sprays hang across
      float twig = 1. - smoothstep(.02, .07, abs(vnoise(p * .3 + 4.) * 7. - floor(vnoise(p * .3 + 4.) * 7.) - .5));
      float hole = open * (1. - lace) * (1. - .85 * twig) * (1. - .75 * lc.x * (1. - gap));
      float pch = smoothstep(.35, .7, vnoise(p * .035 + 11.));
      vec3 leaf = mix(uLeafA * .8, mix(uLeafA, leafColor(lc.y, pch), .6), lc.x);
      float clump = .55 + .45 * smoothstep(.3, .7, vnoise(p * .22 + 2.));
      leaf = mix(leaf, uLeafB, .3);
      vec3 col = leaf * (uBounce * 1.7 + uShade * 1.5) * (.6 + .6 * lc.x) * clump * vec3(1.15, 1.6, 1.05);      // leaf-green by the light off the floor, never black
      col += leaf * uSunCol * (.035 + .16 * soft) * (.4 + b) * (.4 + lc.x);              // sun soaking through the leaves
      col += leafColor(la.y + lb.y, pch) * vec3(1.25, 1.2, .5) * uSunCol * open * lace * (1. - .6 * twig) * (.22 + .3 * b);   // the leaves across a gap glow green-gold
      return mix(col, uSkyGlow, hole);
    }`;
  const GL_ROOF = roofGL(false);
  const ceilMat = mkMat({
    uniforms: { ...LU }, vertexColors: true, vertexShader: VS_STD,
    fragmentShader: /* glsl */`
      varying vec3 vP, vN, vC; varying vec2 vUv;
      ${GL_COMMON}
      ${GL_LEAF}
      ${GL_ROOF}
      ${GL_FOG_F}
      void main(){
        float e = (vUv.x - .6) / 5.5;                                   // metres in from the lip of the light well
        if (e < 1.) {
          vec2 q = vP.xz * .5;
          float lf = max(max(leafCellB(q).x, leafCellB(mat2(.8, -.6, .6, .8) * q * 1.4 + 3.7).x), leafCellB(mat2(.6, .8, -.8, .6) * q * .8 + 9.1).x * .9);
          if (lf * (.45 + .8 * vnoise(vP.xz * .23 + 5.)) < 1. - e) discard;
        }
        vec3 col = hallHaze(roofCol(vP.xz), vP);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const ceil = new THREE.Mesh(ceilGeo, ceilMat); ceil.frustumCulled = false; group.add(ceil);
  let hallGrassMat = null;      // the rushes' material, used again for the grass of the light pools
  // ---- the rain pool: a calm mirror. Its reflection is the hall itself drawn again upside down under the floor (the
  //      pillars in and round it, the shafts) and seen through the hole the floor leaves; behind that, the roof as the
  //      water shows it; over it a skin of dark water with slow rings, the sun's bars lying on it, leaves afloat
  {
    const x0 = Math.min(POOL.ax, POOL.bx) - 26, x1 = Math.max(POOL.ax, POOL.bx) + 26, z0 = Math.min(POOL.az, POOL.bz) - 26, z1 = Math.max(POOL.az, POOL.bz) + 26;
    const quad = (y) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([x0, y, z0, x1, y, z0, x1, y, z1, x0, y, z1]), 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
      return g;
    };
    const VS_P = /* glsl */`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
    const back = new THREE.Mesh(quad(POOL.y - 0.02), mkMat({
      fog: false, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...LU }, vertexShader: VS_P,
      fragmentShader: /* glsl */`
        varying vec3 vP;
        ${GL_COMMON}
        ${GL_LEAF}
        ${roofGL(true)}
        void main(){
          if (poolD(vP.xz) > .6) discard;
          vec3 v = vP - uCam; float d = length(v); vec3 vd = v / max(d, 1e-3);
          vec3 R = normalize(vec3(vd.x, max(abs(vd.y), .03), vd.z));
          float t = min((uHall.x + 1.2 - vP.y) / R.y, 420.);
          vec3 Pr = vP + R * t;
          // the mirror shows the dark roof and its lace of gaps; only the far water whitens toward the haze
          // (softened: the lace of gaps is a glow, not a speckle), and the far water is all lit haze
          vec3 Ph = vP + R * min(t, 230.);
          float soft = textureLod(uMask, Pr.xz * uHall.w + .5, 3.5).r;
          vec3 calm = uLeafA * (uBounce * 1.1 + uShade * .5) * .42 + uSkyGlow * soft * .16 + uLeafB * uSunCol * soft * .05;
          vec3 col = hallHaze(mix(roofCol(Pr.xz), calm, .72), vec3(Ph.x, max(Ph.y, 9.), Ph.z)) * .86;
          gl_FragColor = vec4(col, 1.);
        }`,
    }));
    back.frustumCulled = false; back.renderOrder = -6; group.add(back);
    // once the mirrored hall is drawn (orders -5, -4.5) the hole is sealed in depth, so nothing drawn later under the
    // floor (the sky, the plain outside) can paint over the reflection
    const seal = new THREE.Mesh(quad(POOL.y - 0.01), mkMat({
      fog: false, colorWrite: false, side: THREE.DoubleSide, vertexShader: VS_P,
      fragmentShader: /* glsl */`
        varying vec3 vP;
        ${GL_COMMON}
        void main(){ if (poolD(vP.xz) > .6) discard; gl_FragColor = vec4(0.); }`,
    }));
    seal.frustumCulled = false; seal.renderOrder = -4; group.add(seal);
    const skin = new THREE.Mesh(quad(POOL.y), mkMat({
      fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, vertexShader: VS_P,
      fragmentShader: /* glsl */`
        varying vec3 vP;
        ${GL_COMMON}
        void main(){
          float pd = poolD(vP.xz);
          if (pd > 0.) discard;
          vec2 p = vP.xz; float t = uHall.z;
          vec3 v = vP - uCam; float d = length(v); vec3 vd = v / max(d, 1e-3);
          // looked along, the water is a mirror; looked down into, it is clear and tea-coloured over a bed of sunk leaves
          float gz = 1. - clamp(abs(vd.y), 0., 1.);
          float F = clamp(.05 + 1.25 * gz * gz * gz, 0., 1.);
          float depth = smoothstep(0., 9., -pd), shallow = 1. - smoothstep(0., 3.5, -pd);
          vec2 bp = p + vd.xz * (.5 + 1.5 * depth);                                          // the bed lies under the surface
          float bedN = vnoise(bp * 1.7) * .55 + vnoise(bp * 5.3) * .45, bedL = vnoise(bp * .23 + 4.);
          vec3 bedA = mix(vec3(.2, .14, .07), vec3(.42, .3, .13), smoothstep(.35, .75, bedN));    // ochre and copper leaves lying on the mud
          bedA = mix(bedA, vec3(.1, .075, .04), smoothstep(.55, .8, bedL) * .6);
          bedA *= mix(vec3(1.), vec3(.62, .46, .24), depth);                                  // deeper, the tea of the water takes over
          float sv = sunVis(vP), kv = skyVis(vP);
          vec3 bed = bedA * (uShade * .9 + uBounce * 1.5 + uSkyAmb * (.35 + .6 * kv) + uSunCol * sv * (.55 + .3 * bedN));
          // slow rings where a fig or a drop has fallen, each cell in its own time
          vec2 g = p / 7.; vec2 gi = floor(g); float ring = 0.;
          vec2 c = (gi + .25 + .5 * vec2(hash21(gi), hash21(gi + 5.3))) * 7.;
          float age = fract(t * .11 + hash21(gi + 9.1)), rr = length(p - c);
          ring = (1. - smoothstep(0., .26, abs(rr - age * 4.2))) * (1. - age) * (1. - age) * smoothstep(.05, .2, age);
          ring += .6 * (1. - smoothstep(0., .22, abs(rr - age * 2.7))) * (1. - age) * (1. - age) * smoothstep(.1, .3, age);
          vec2 g2 = (p + 3.5) / 7.; vec2 gj = floor(g2);
          vec2 c2 = (gj + .25 + .5 * vec2(hash21(gj + 2.2), hash21(gj + 7.9))) * 7. - 3.5;
          float age2 = fract(t * .09 + hash21(gj + 4.4)), rr2 = length(p - c2);
          ring += (1. - smoothstep(0., .26, abs(rr2 - age2 * 4.2))) * (1. - age2) * (1. - age2) * smoothstep(.05, .2, age2);
          // a breath of wind now and then roughens a patch: the mirror dulls there
          float ruf = smoothstep(.62, .8, vnoise(p * .09 + vec2(t * .05, -t * .03))) * (.5 + .5 * vnoise(p * vec2(3.1, 1.3) + t * .6));
          vec3 sheen = uSkyAmb * (.5 + .6 * kv) + uHazeCol * .6 + uSunCol * sv * .12;
          // a pale meniscus where the water meets the mud
          float lip = (1. - smoothstep(0., .22, -pd)) * .5;
          vec3 col = bed + sheen * (ring * .8 + ruf * .45 + lip);
          float a = clamp((1. - F) * .96 + ring * .45 + ruf * .4 + lip, 0., .97);
          {
            // rafts of lily pads in the quiet water off the shores: flat green plates, each with its notch, the sun's bars lying on them
            float raft = smoothstep(.46, .6, vnoise(p * .1 + 17.) * .65 + vnoise(p * .29 + 5.) * .35) * smoothstep(.4, 2.2, -pd) * (1. - smoothstep(9., 15., -pd));
            vec2 lg = p / 1.05, li = floor(lg), lf = fract(lg) - .5;
            vec2 ld = lf - (vec2(hash21(li + 3.1), hash21(li + 8.7)) - .5) * .42;
            float lr = .2 + .22 * hash21(li + 1.9), ldist = length(ld);
            float la = atan(ld.y, ld.x + 1e-5) + hash21(li) * 6.283;
            float notch = step(.2, abs(sin(la * .5))) + step(ldist, lr * .18);
            float aa = clamp(fwidth(ldist) * 1.5, .01, .2);
            float pad = (1. - smoothstep(lr - aa, lr, ldist)) * min(notch, 1.) * step(hash21(li + 5.5), raft * 1.15);
            vec3 padA = mix(vec3(.05, .13, .035), vec3(.16, .3, .07), hash21(li + 2.7)) * (.8 + .2 * smoothstep(.0, .06, abs(sin(la * 5.))) ) * (1. - .25 * smoothstep(lr * .3, lr, ldist));
            vec3 padC = padA * (uShade * .9 + uBounce * .4 + uSkyAmb * (.5 + .7 * kv) + uSunCol * sv * .8) + sheen * .1 * gz * gz;
            col = mix(col, padC, pad); a = max(a, pad * .97);
          }
          // ground mist lies on the water too
          float mist = clamp(uMist.x * 5. * (1. - exp(-d * .012)) * smoothstep(.3, .75, vnoise(p * .06 + vec2(t * .02, 0.))), 0., .5);
          col = mix(col, uMistCol * (.7 + .3 * kv) + uSunCol * uMist.z * sv * .5, mist);
          a = max(a, mist);
          gl_FragColor = vec4(col * uMist.w, a);
        }`,
    }));
    skin.frustumCulled = false; skin.renderOrder = 2; group.add(skin);
    // rushes: stands of them along the shore and on the spit, each standing over its own reflection
    const fr = (v) => v - Math.floor(v);
    const h21 = (x, y) => { let px = fr(x * 123.34), py = fr(y * 456.21); const d = px * (px + 45.32) + py * (py + 45.32); px += d; py += d; return fr(px * py); };
    const vn = (x, y) => { const ix = Math.floor(x), iy = Math.floor(y); let fx = x - ix, fy = y - iy; fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy); return lerp(lerp(h21(ix, iy), h21(ix + 1, iy), fx), lerp(h21(ix, iy + 1), h21(ix + 1, iy + 1), fx), fy); };
    const SP = SPIT.map((q) => q.split(',').map(Number));
    const shore = (x, z) => {         // the shader's poolD: [metres outside the water, metres outside the spit]
      const bx = POOL.bx - POOL.ax, bz = POOL.bz - POOL.az, h = clamp(((x - POOL.ax) * bx + (z - POOL.az) * bz) / (bx * bx + bz * bz), 0, 1);
      const dc = Math.hypot(x - POOL.ax - bx * h, z - POOL.az - bz * h) - (POOL.w + 6 * vn(x * 0.07 + 3, z * 0.07 + 3) + 2 * vn(x * 0.31, z * 0.31));
      const rg = 1.2 * vn(x * 0.45 + 7, z * 0.45 + 7) + 0.5 * vn(x * 1.3, z * 1.3);
      let isl = 1e9; for (let k = 0; k < 8; k += 2) isl = Math.min(isl, Math.hypot(x - SP[k][0], z - SP[k][1]) - SP[k + 1][0] - rg);
      return [Math.max(dc, -isl), isl];
    };
    const rr = xr('rushes'), R = [];      // x y z yaw h seed
    for (let k = 0, tries = 0; k < 460 && tries < 30000; tries++) {
      const onSpit = tries % 3 === 0, x = onSpit ? rr.range(-13, 13) : rr.range(x0 + 4, x1 - 4), z = onSpit ? rr.range(19, 39) : rr.range(z0 + 4, z1 - 4), sd = shore(x, z);
      if (sd[0] < -1.3 || sd[0] > 1.1) continue;
      if (!onSpit && vn(x * 0.16 + 11, z * 0.16) < 0.5) continue;           // in stands, with bare shore between
      if (routeDist3(x, 1.5, z) < 5.2) continue;
      R.push(x, sd[0] < 0 ? POOL.y - 0.05 : floorY(x, z) - 0.05, z, rr.range(0, Math.PI), rr.range(0.9, 1.9) * (sd[0] < 0 ? 1.1 : 0.85), rr()); k++;
    }
    const nR = R.length / 6;
    if (nR) {
      const pos = new Float32Array(nR * 24), aT = new Float32Array(nR * 24), uv = new Float32Array(nR * 16), idx = new Uint32Array(nR * 12);
      for (let i = 0; i < nR; i++) for (let w = 0; w < 2; w++) {
        for (let c = 0; c < 4; c++) {
          const o = (i * 2 + w) * 4 + c;
          pos[o * 3] = R[i * 6]; pos[o * 3 + 1] = R[i * 6 + 1]; pos[o * 3 + 2] = R[i * 6 + 2];
          aT[o * 3] = R[i * 6 + 3] + w * 1.571; aT[o * 3 + 1] = R[i * 6 + 4]; aT[o * 3 + 2] = R[i * 6 + 5];
          uv[o * 2] = c === 0 || c === 3 ? -1 : 1; uv[o * 2 + 1] = c < 2 ? 0 : 1;
        }
        const q = (i * 2 + w) * 4; idx.set([q, q + 1, q + 2, q, q + 2, q + 3], (i * 2 + w) * 6);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const rushMat = (mirror) => mkMat({
        side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec3 aT; uniform vec4 uHall;
          varying vec3 vP; varying vec2 vUv; varying float vS;
          ${GL_FOG_V}
          void main(){
            float h = aT.y, sd = aT.z, t = uHall.z;
            vec3 r = vec3(cos(aT.x), 0., sin(aT.x));
            float gust = sin(dot(position.xz, vec2(.21, .17)) - t * 1.1) * .5 + .5;
            vec3 P = position + r * uv.x * h * .5 + vec3(0., uv.y * h, 0.);
            P.xz += vec2(sin(t * 1.7 + sd * 40.), cos(t * 1.3 + sd * 23.)) * uv.y * uv.y * h * (.04 + .08 * gust);
            vP = P; vUv = uv; vS = sd;
            vec4 mvPosition = modelViewMatrix * vec4(P.x, ${mirror ? (2 * POOL.y).toFixed(2) + ' - P.y' : 'P.y'}, P.z, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vP; varying vec2 vUv; varying float vS;
          ${GL_COMMON}
          ${GL_FOG_F}
          void main(){
            float x = vUv.x, y = vUv.y;
            float far = smoothstep(12., 40., length(vP - uCam));
            float bl = x / max(.16 + .84 * y, 1e-3) * 3.2 + vS * 7.;
            float w = abs(fract(bl) - .5), hgt = mix(.45 + .55 * hash11(floor(bl) + vS * 31.), .9, far * .7);
            if (w > mix(.26, .5, far) * (1. - .8 * y / hgt) || y > hgt || abs(x) > .16 + .84 * y) discard;
            vec3 alb = mix(vec3(.035, .075, .03), vec3(.2, .3, .09), smoothstep(.05, .9, y / hgt)) * (.75 + .5 * hash11(floor(bl) * 1.7 + vS * 3.));
            alb = mix(alb, vec3(.2, .12, .05), step(.8, hash11(floor(bl) + vS * 13.)) * smoothstep(.78, .86, y / hgt));       // a brown seed head here and there
            vec3 v = vP - uCam; vec3 vd = v / max(length(v), 1e-3);
            float thru = max(dot(vd, uSunDir), 0.);
            vec3 col = alb * (hallLight(vP, vec3(0., 1., 0.), .4 + .6 * y) * 1.1 + uSunCol * sunVis(vP) * (.3 + .8 * thru * thru));
            col = hallHaze(col, vP)${mirror ? ' * .8' : ''};
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      hallGrassMat = rushMat(false);
      const rushes = new THREE.Mesh(g, hallGrassMat); rushes.frustumCulled = false; group.add(rushes);
      const rushes2 = new THREE.Mesh(g, rushMat(true)); rushes2.frustumCulled = false; rushes2.renderOrder = -4.7; group.add(rushes2);
    }
  }
  await ctx.yield();

  // ---- leaf sprays: under the roof, on the crown tops along the approach, round the oculus, saplings ------
  {
    const cards = [];   // x y z size yaw tilt kind seed
    const nUnder = Math.round(1500 * detail), nlp = limbPts.length / 4;
    for (let k = 0, tries = 0; k < nUnder && tries < nUnder * 6; tries++) {
      const j = rng.int(iLow0, NS), ang = rng.range(0, TAU), rr = 42 * Math.sqrt(rng());
      let x = sx[j] + Math.cos(ang) * rr, z = sz[j] + Math.sin(ang) * rr, y = ceilY(x, z) + 1.0 - rng.range(0, 2.3);
      const onLimb = rng.chance(0.3) && nlp > 0, lj = rng.int(0, Math.max(0, nlp - 1)) * 4;
      if (onLimb) { x = limbPts[lj] + rng.range(-1, 1); y = limbPts[lj + 1] + 0.8; z = limbPts[lj + 2] + rng.range(-1, 1); }
      if (rho(x, z) > 0.95 || ocDist(x, z) < OC.r + 2) continue;
      const size = onLimb ? rng.range(1.2, 2.4) : rng.range(1.8, 4.2);
      if (routeDist3(x, y - size, z) < 5.4) continue;
      cards.push(x, y, z, size, rng.range(0, TAU), rng.range(-0.35, 0.35), 0, rng()); k++;
    }
    {                                    // sprays hanging under the lip of the light well and standing along its edge
      const lr = xr('lip');
      for (let k = 0; k < Math.round(560 * (0.6 + 0.4 * detail)); k++) {
        const a = lr.range(0, TAU), hang = lr.chance(0.55), d = hang ? lr.range(-0.6, 5.5) : lr.range(-0.4, 9) * lr();
        const x = OC.x + Math.cos(a) * (OC.r + d), z = OC.z + Math.sin(a) * (OC.r + d);
        const size = hang ? lr.range(2.2, 4.6) : lr.range(1.6, 3.2), y = lipY(x, z, d) - (hang ? 0.2 : 0.5);
        if (routeDist3(x, y + (hang ? -size : size) * 0.5, z) < 6.5) continue;
        cards.push(x, y, z, size, a + Math.PI / 2 + lr.range(-0.7, 0.7), lr.range(-0.5, 0.3), hang ? 0 : 1, lr());
      }
    }
    const n = cards.length / 8, pos = new Float32Array(n * 12), a1 = new Float32Array(n * 16), a2 = new Float32Array(n * 12), idx = new Uint32Array(n * 6);
    for (let i = 0; i < n; i++) {
      for (let c = 0; c < 4; c++) {
        const o = i * 4 + c, u = c === 0 || c === 3 ? -1 : 1, v = c < 2 ? 0 : 1;
        pos[o * 3] = cards[i * 8]; pos[o * 3 + 1] = cards[i * 8 + 1]; pos[o * 3 + 2] = cards[i * 8 + 2];
        a1[o * 4] = u; a1[o * 4 + 1] = v; a1[o * 4 + 2] = cards[i * 8 + 3]; a1[o * 4 + 3] = cards[i * 8 + 7];
        a2[o * 3] = cards[i * 8 + 4]; a2[o * 3 + 1] = cards[i * 8 + 5]; a2[o * 3 + 2] = cards[i * 8 + 6];
      }
      idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aCard', new THREE.BufferAttribute(a1, 4)); g.setAttribute('aRot', new THREE.BufferAttribute(a2, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const m = mkMat({
      uniforms: { ...LU }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aCard; attribute vec3 aRot;
        uniform vec4 uHall;
        varying vec3 vP, vN; varying vec2 vUv; varying vec2 vK;
        ${GL_FOG_V}
        void main(){
          float kind = aRot.z, sz = aCard.z, t = uHall.z;
          vec3 right = vec3(cos(aRot.x), 0., sin(aRot.x));
          vec3 fw = vec3(-right.z, 0., right.x);
          float dirY = kind < .5 ? -1. : 1.;                       // sprays under the roof hang down
          vec3 up = normalize(vec3(0., dirY, 0.) + fw * aRot.y);
          float gust = sin(dot(position.xz, vec2(.06, .045)) - t * .9 + aCard.w * 6.283);
          float fl = aCard.y * (.06 + .1 * (.5 + .5 * gust)) * sz;
          vec3 P = position + right * aCard.x * sz * .62 + up * aCard.y * sz
                 + fw * fl * sin(t * 2.3 + aCard.w * 40. + aCard.x) + right * fl * .5 * sin(t * 1.7 + aCard.w * 17.);
          vP = P; vN = normalize(cross(right, up)); vUv = vec2(aCard.x * .5 + .5, aCard.y); vK = vec2(kind, aCard.w);
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP, vN; varying vec2 vUv; varying vec2 vK;
        ${GL_COMMON}
        ${GL_LEAF}
        ${GL_FOG_F}
        void main(){
          vec2 q = vUv * vec2(4.4, 5.2) + vK.y * 13.;
          vec4 a = leafCell(q), b = leafCell(mat2(.8, -.6, .6, .8) * q * 1.13 + 5.37);
          vec4 lc = a.x > b.x ? a : b;
          vec4 c3 = leafCell(mat2(.6, .8, -.8, .6) * q * .9 + 2.1); if (c3.x > lc.x) lc = c3;
          float env = smoothstep(0., .12, vUv.y) * (1. - smoothstep(.8, 1., vUv.y)) * (1. - smoothstep(.72, 1., abs(vUv.x * 2. - 1.)));
          float twig = (1. - smoothstep(.012, .03, abs(vUv.x - .5 + .08 * sin(vUv.y * 7. + vK.y * 9.)))) * step(vUv.y, .8);
          if (lc.x * env < .2 && twig < .5) discard;
          vec3 alb = leafColor(lc.y + vK.y, .6) * (.6 + .4 * smoothstep(.0, .22, abs(lc.w)));       // pale midrib
          float fig = uFig * step(.82, fract(lc.y * 11.3)) * step(length(vec2(lc.z, lc.w) - vec2(.5, .3)), .3);
          alb = mix(alb, vec3(.6, .04, .03), fig);
          alb = mix(alb, vec3(.09, .07, .05), twig * (1. - lc.x));
          vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
          vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
          if (dot(N, V) < 0.) N = -N;
          vec3 col;
          float thru = max(dot(-V, uSunDir), 0.);
          if (vK.x > .5 && vK.x < 1.5) {                     // on the crown: full sun, glowing through when backlit
            col = alb * (uSunCol * (.25 + .6 * max(dot(N, uSunDir), 0.) + .9 * thru * thru) + uSkyAmb * .5 + uShade * .3);
          } else {
            float sv = sunVis(vP);
            col = alb * .75 * (hallLight(vP, N, 1.) + uSunCol * sv * (.35 + 1.1 * thru * thru));
            col = hallHaze(col, vP);
          }
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const leaves = new THREE.Mesh(g, m); leaves.frustumCulled = false; group.add(leaves);
  }
  await ctx.yield();

  // ---- foliage in the open: leaf clumps standing proud of the shell (every crown along the approach, the dark mass of
  //      the lip, the skyline), and LEAVES: separate leathery ovals on twigs, for the eave round the light well, the
  //      crown tops under the approach, the fig saplings of the courtyard and the hem that hangs round the rim at the exit
  const saplings = [];
  const FL = [];                 // one leaf: base xyz, axis xyz, face xyz, size, seed, kind, light, ao
  const hemThreads = [];         // x y z len seed: root threads let down from the hem (built with the other threads)
  // a twig with leaves set alternately along it: (dx,dy,dz) the way it grows, (fx,fy,fz) the way its leaves face
  function spray(r, bx, by, bz, dx, dy, dz, fx, fy, fz, len, n, size, kind, light, ao, droop) {
    const dl = Math.hypot(dx, dy, dz) || 1; dx /= dl; dy /= dl; dz /= dl;
    let ux = dy * fz - dz * fy, uy = dz * fx - dx * fz, uz = dx * fy - dy * fx; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.6) / n, sd = i % 2 ? 1 : -1, k = i === n - 1 ? 0.15 : 0.95;      // the last leaf carries the twig on
      FL.push(bx + dx * len * t, by + dy * len * t - droop * t * t * len, bz + dz * len * t,
        dx * 0.6 + ux * sd * k + r.range(-0.25, 0.25), dy * 0.6 + uy * sd * k - droop * (0.5 + t) + r.range(-0.2, 0.2), dz * 0.6 + uz * sd * k + r.range(-0.25, 0.25),
        fx + r.range(-0.4, 0.4), fy + r.range(-0.4, 0.4), fz + r.range(-0.4, 0.4), size * r.range(0.75, 1.15), r(), kind, light, ao);
    }
  }
  {
    const br = xr('clumps'), near = [], far = [];      // x y z size squash yaw kind seed
    const put = (x, y, z, size, kind) => { (routeDist3(x, y, z) < 12.5 ? near : far).push(x, y, z, size, br.range(0.62, 0.9) * (kind === 2 ? 0.5 : 1), br.range(0, TAU), kind, br()); };
    const nApp = Math.round(2600 * (0.5 + 0.5 * detail));
    for (let k = 0; k < nApp; k++) {                   // leaf heads on the sub-crowns under and beside the approach: big on the
      if ((k & 511) === 511) await ctx.yield();
      const j = br.int(0, iLow0 + 4), x = sx[j] + br.gauss() * 34, z = sz[j] + br.range(-9, 9), d = ocDist(x, z) - OC.r, ch = crownH(x, z);   // tops, none in the creases
      const size = br.range(2.0, 3.3) * (0.6 + 1.0 * ch * ch), ok = br.chance(0.25 + 0.75 * ch);
      if (rho(x, z) > 0.995 || d < 0.5 || ch < 0.22 || !ok) continue;
      const y = lipY(x, z, d) + size * 0.1;
      if (routeDist3(x, y + size, z) < 6.5) continue;
      put(x, y, z, size, 0);
    }
    for (let k = 0; k < Math.round(700 * (0.5 + 0.5 * detail)); k++) {     // the lip of the light well: the dark mass the leaves stand on
      const a = br.range(0, TAU), d = -0.5 + 12 * br() * br(), x = OC.x + Math.cos(a) * (OC.r + d), z = OC.z + Math.sin(a) * (OC.r + d);
      const size = br.range(1.9, 3.3), y = lipY(x, z, d) - size * 0.08;      // flat and overlapping: one rolled mass, not a row of balls
      if (routeDist3(x, y + size * 0.5, z) < 6.5) continue;
      put(x, y, z, size, 2);
    }
    for (let k = 0; k < Math.round(330 * (0.5 + 0.5 * detail)); k++) {     // heads along the rim where we cross it
      const x = sx[0] + br.range(-190, 190), rr = br.range(0.93, 0.985), z = RZ * rr * Math.sqrt(Math.max(0, 1 - (x / RX) * (x / RX) / (rr * rr)));
      const size = br.range(2.2, 4.4), y = Math.max(domeY(x, z), 9.5) + size * 0.2;
      if (routeDist3(x, y + size, z) < 7) continue;
      far.push(x, y, z, size, br.range(0.6, 0.9), br.range(0, TAU), 0, br());
    }
    for (let k = 0; k < 190; k++) {                                        // and a hem of heads below those, down the skirt where we come in
      const x = sx[0] + br.range(-130, 130), rr = br.range(0.992, 1.03), z = RZ * rr * Math.sqrt(Math.max(0, 1 - (x / RX) * (x / RX) / (rr * rr)));   // over it: from the air the tree ends in leaf, not in a frayed edge over its dark hall
      const size = br.range(3.4, 5.4), y = br.range(3.2, 9.5);
      far.push(x, y, z, size, br.range(0.6, 0.85), br.range(0, TAU), 0.5, br());
    }
    {                                                                      // the rim where we come in is a wall of crowns: big heads billowing out over the hem
      const wr = xr('rimwall');
      for (let k = 0; k < Math.round(210 * (0.6 + 0.4 * detail)); k++) {
        const x = clamp(sx[0] + 62 + wr.gauss() * 115, -330, 300), rr = wr.range(0.972, 0.998), z = RZ * rr * Math.sqrt(Math.max(0, 1 - (x / RX) * (x / RX) / (rr * rr)));
        const size = wr.range(2.6, 4.6), yTop = Math.max(domeY(x * 0.975, z * 0.975), 15), y = lerp(13, yTop + 1.5, Math.pow(wr(), 0.8)), sq = wr.range(0.62, 0.86), yaw = wr.range(0, TAU), sd = wr();
        if (routeDist3(x, y + size * 0.6, z) < 8.5) continue;
        far.push(x, y, z, size, sq, yaw, 0.5, sd);
      }
      const lh = xr('liphd');                                              // and the whole lip of the well, seen from the courtyard, is leaf heads too
      for (let k = 0; k < Math.round(440 * (0.5 + 0.5 * detail)); k++) {
        const a = lh.range(0, TAU), d = lh.chance(0.62) ? lh.range(0.8, 15) : lh.range(15, 42), x = OC.x + Math.cos(a) * (OC.r + d), z = OC.z + Math.sin(a) * (OC.r + d);
        const size = lh.range(2.4, 4.4), y = lipY(x, z, d) + size * 0.15, sq = lh.range(0.62, 0.88), yaw = lh.range(0, TAU), sd = lh();
        if (routeDist3(x, y + size * 0.5, z) < 7.5) continue;
        far.push(x, y, z, size, sq, yaw, 0, sd);
      }
    }
    for (let k = 0; k < Math.round(300 * detail); k++) {                   // big heads far over the dome, for its skyline
      const a = br.range(0, TAU), rr = Math.sqrt(br()) * 0.97, x = Math.cos(a) * RX * rr, z = Math.sin(a) * RZ * rr, d = ocDist(x, z) - OC.r;
      if (d < 3 || z < -140) continue;
      const size = br.range(2.6, 4.8), y = lipY(x, z, d) + size * 0.2;
      if (routeDist3(x, y + size, z) < 7) continue;
      far.push(x, y, z, size, br.range(0.6, 0.85), br.range(0, TAU), 0, br());
    }
    await ctx.yield();
    const farIn = [], farOut = [];           // the heads round the well are drawn with it; the rest of the crown only from the air
    for (let i = 0; i < far.length; i += 8) { const dst = ocDist(far[i], far[i + 2]) < OC.r + 62 ? farIn : farOut; for (let k = 0; k < 8; k++) dst.push(far[i + k]); }
    for (const [list, det, where] of [[near, 1, stage.court], [farIn, 0, stage.court], [farOut, 0, stage.outer]]) {
      const n = list.length / 8; if (!n) continue;
      const g = new THREE.IcosahedronGeometry(1, det); g.deleteAttribute('uv'); g.setAttribute('normal', g.attributes.position.clone());
      const aB = new Float32Array(n * 2), aM = new Float32Array(n * 3), mesh = new THREE.InstancedMesh(g, null, n);
      const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const o = i * 8, sz = list[o + 3];
        Q.setFromEuler(E.set((list[o + 7] - 0.5) * 0.7, list[o + 5], (list[o + 4] - 0.75) * 1.2));
        mesh.setMatrixAt(i, M.compose(Pv.set(list[o], list[o + 1], list[o + 2]), Q, Sv.set(sz, sz * list[o + 4], sz)));
        aB[i * 2] = list[o + 6]; aB[i * 2 + 1] = list[o + 7];
        if (list[o + 6] < 1) { const ml = macroLight(list[o], list[o + 1], list[o + 2]); aM[i * 3] = ml[0]; aM[i * 3 + 1] = ml[1]; aM[i * 3 + 2] = ml[2]; }
        else { aM[i * 3] = sunReach(list[o], list[o + 1], list[o + 2]); aM[i * 3 + 1] = 0; aM[i * 3 + 2] = 1; }
        if ((i & 255) === 255) await ctx.yield();
      }
      g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 2)); g.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 3));
      mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; mesh.userData.clumps = true; group.add(mesh); where.push(mesh);
      await ctx.yield();
    }
    const clumpMat = mkMat({
      uniforms: { ...LUo },
      vertexShader: /* glsl */`
        attribute vec2 aB; attribute vec3 aM;
        uniform vec4 uHall; uniform vec3 uCam;
        varying vec3 vP, vN, vL, vM; varying vec2 vK;
        ${GL_FOG_V}
        void main(){
          vec3 p = position * (1. + .2 * sin(dot(position, vec3(3.1, 2.3, 4.7)) + aB.y * 40.) + .13 * sin(dot(position, vec3(-5.3, 6.1, 4.2)) + aB.y * 71.));
          if (aB.x > .25 && aB.x < .75) p *= step(21., uCam.y);            // the hem of heads at the rim is for the air only: from the hall it would be lumps under the skirt
          vec4 wp = instanceMatrix * vec4(p, 1.);
          vec3 org = instanceMatrix[3].xyz; float sc = length(instanceMatrix[0].xyz), t = uHall.z;
          float gb = sin(dot(org.xz, vec2(.045, .03)) - t * .8) * .5 + .5;
          float sw = (.25 + .75 * gb) * sc * (.5 + .5 * position.y);
          wp.x += sin(t * 1.9 + aB.y * 30. + position.z * 2.) * .05 * sw;
          wp.z += cos(t * 1.6 + aB.y * 17. + position.x * 2.) * .04 * sw;
          wp.y += sin(t * 2.6 + aB.y * 50. + position.x * 3.) * .022 * sw;
          vP = wp.xyz; vN = normalize(mat3(instanceMatrix) * normal + vec3(0., 1e-4, 0.)); vL = position; vK = aB; vM = aM;
          vec4 mvPosition = modelViewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP, vN, vL, vM; varying vec2 vK;
        ${GL_COMMON}
        ${GL_LEAF}
        ${GL_MOUNDS}
        ${GL_FOG_F}
        uniform float uDomeK, uGlint;
        ${GL_AIR}
        void main(){
          vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.)), Ng = normalize(vN);
          float ndv = dot(Ng, V), tt = uHall.z; vec2 p = vP.xz;
          float dist = length(vP - uCam), df = 1. - smoothstep(34., 120., dist), dfe = 1. - smoothstep(22., 55., dist);
          vec2 tg = normalize(vec2(-Ng.z, Ng.x) + vec2(1e-4, 0.));
          vec2 q = abs(Ng.y) > .62 ? p : vec2(dot(p, tg), vP.y * 1.05);
          vec3 fm = mounds((vec2(vP.x + vP.y * .55, vP.z + vP.y * .4) + (vec2(vnoise(vP.xz * 1.9 + vP.y), vnoise(vP.xz * 1.9 - vP.y + 7.)) - .5) * .7) / 1.5 + vK.y * 9.);      // florets on the clump
          float pch = smoothstep(.3, .75, vnoise(p * .1 + 11.) * .6 + vnoise(p * .03 + 4.) * .4), cover;
          vec3 avgLeaf = mix(mix(uLeafA, uLeafB, .4), uLeafC, uFlush * (.05 + .45 * pch));
          vec3 nearLeaf = leafField(q, avgLeaf, pch, cover);
          float edge = mix(fm.x, cover, dfe);
          if (ndv < .8 && edge < (.8 - ndv) * 1.25) discard;                                  // the outline is leaves, not an edge
          vec3 N = normalize(Ng + vec3(-fm.y, 0., -fm.z) * .5);
          float core = step(1.5, vK.x);                                                       // the dark mass behind the leaves of the lip
          float crown = mix(smoothstep(.02, .55, vM.z), 1., core);
          vec3 alb = mix(avgLeaf, nearLeaf * 1.1, df) * uDomeK * (.36 + .64 * smoothstep(0., .55, fm.x)) * (.5 + .56 * crown) * mix(1., .9, core);
          alb *= mix(vec3(1.12, 1., .74), vec3(.8, .97, 1.1), smoothstep(.25, .75, vnoise(p * .023 + 3.) * .6 + vnoise(p * .071) * .4));
          float gb = vnoise(p * .012 + vec2(tt * .1, tt * .04)) * .7 + vnoise(p * .035 - vec2(tt * .16, tt * .05)) * .3;
          float gband = gustBand(p, tt), gust = max(smoothstep(.5, .7, gb) * .6, gband), flut = vnoise(p * 1.1 + vec2(tt * 2.3, -tt * 1.9));
          alb = mix(alb, alb * vec3(1.7, 1.8, 1.55) + vec3(.02, .028, .02), gust * (.4 + .6 * flut) * .85 * (1. - core));
          alb = mix(alb, alb * 1.5 + vec3(.05, .075, .055), gband * (.5 + .5 * flut) * .8 * (1. - core));
          float ao = .44 + .56 * smoothstep(-.75, .45, vL.y);                         // dark where it sits in the crown
          // lit as the shell under it is: the sub-crown's flank decides, the head itself only models the light
          float own = smoothstep(-.12, .5, dot(normalize(mix(Ng, vec3(0., 1., 0.), .3)), uSunLow)) * mix(.04, 1., vM.x);
          float difG = mix(mix(vM.y, own, .5), own, core);
          float difD = max(dot(N, uSunLow), 0.); difD = difD / (difD + .3) * 1.3;
          float dif = difG * (.3 + .7 * difD);
          float back = max(dot(-V, uSunH), 0.), rim = 1. - max(ndv, 0.);
          float od = length(p - uOc.xy) - uOc.z;
          float well = mix(1., smoothstep(1., 24., od), (1. - uMist.w) / .8);
          vec3 amb = domeShade() * (.72 + .28 * N.y) * (.62 + .38 * crown) * (1. + 1.3 * core) * uShadeK;
          vec3 lit = uSunCol * uSunTint * (dif * 1.2 + .28 * back * back * rim * rim * vM.x) + amb * (.5 + .5 * well);
          vec3 col = alb * lit * ao * (.3 + .7 * well);
          float sp = max(dot(reflect(-uSunDir, N), V), 0.); sp *= sp; sp *= sp;
          col += uSunCol * sp * sp * .1 * cover * df * vM.x * uGlint * (1. - core);
          col = domeFill(col, smoothstep(0., .55, fm.x) * ao * (.4 + .6 * crown), vP.y);
          col = domeAir(col, p, dist, crown, back, well);
          // from under the roof the heads along the rim are dark leaf against the light outside
          float under = (1. - smoothstep(12., 20., uCam.y)) * smoothstep(.86, .93, length(p / vec2(${RX.toFixed(1)}, ${RZ.toFixed(1)})));
          col = mix(col, hallHaze(col * .3 + uLeafB * (uShade + uBounce) * .22, uCam + (vP - uCam) * .4), under);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    group.traverse((o) => { if (o.userData.clumps) o.material = clumpMat; });
    await ctx.yield();
    // fig saplings where the mother trunk stood: a slim stem, a few twigs, fifteen to thirty big leaves, a long shadow
    const sr = xr('saplings'), SS = new Store(), kc3 = [0.13, 0.1, 0.07], o3 = [0, 0, 0];
    const tanEl = sunDir.y / Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z)), shq = [];
    for (let k = 0; k < 110; k++) {
      const a = sr.range(0, TAU), d = OC.r * Math.sqrt(sr()) * 0.93, x = OC.x + Math.cos(a) * d, z = OC.z + Math.sin(a) * d;
      const h = sr.range(2.4, 4.8), lean = sr.range(-0.2, 0.2), la = sr.range(0, TAU), f0 = floorY(x, z) - 0.1;
      if (routeDist3(x, h, z) < 7 || routeDist3(x, 0.5, z) < 5.2) continue;
      const tx = x + Math.cos(la) * lean * h, tz = z + Math.sin(la) * lean * h;
      const stemAt = (t, o) => { o[0] = lerp(x, tx, t * t); o[1] = f0 + t * h * 0.9; o[2] = lerp(z, tz, t * t); };
      loft(SS, stemAt, (t) => 0.02 * h * (1 - 0.7 * t) + 0.012, [0, 0.3, 0.65, 1], 5, () => kc3, 1, h);
      const nTw = 3 + (sr.chance(0.5) ? 1 : 0) + (h > 2.8 ? 1 : 0), ls = sr.range(0.8, 1.1) * (0.7 + 0.08 * h);
      for (let q = 0; q < nTw; q++) {
        const ts = 0.4 + 0.5 * (q / nTw) + sr.range(0, 0.08), ta = q * 2.4 + sr.range(0, 0.9), tl = h * sr.range(0.26, 0.42), rise = sr.range(0.25, 0.7);
        stemAt(ts, o3);
        const bx = o3[0], by = o3[1], bz = o3[2], dx = Math.cos(ta), dz = Math.sin(ta);
        loft(SS, (t, o) => { o[0] = bx + dx * tl * t; o[1] = by + rise * tl * t - 0.12 * tl * t * t; o[2] = bz + dz * tl * t; }, (t) => 0.018 * (1 - 0.6 * t) + 0.006, [0, 0.5, 1], 3, () => kc3, 1, tl);
        spray(sr, bx + dx * tl * 0.15, by + rise * tl * 0.15, bz + dz * tl * 0.15, dx, rise * 0.8, dz, 0, 1, 0, tl * 0.95, 5 + sr.int(0, 2), ls, 0, 1, 1, 0.12);
      }
      spray(sr, tx, f0 + h * 0.86, tz, Math.cos(la) * 0.25, 1, Math.sin(la) * 0.25, Math.cos(la + 1.6), 0.7, Math.sin(la + 1.6), 0.45, 3, ls, 0, 1, 1, 0);
      saplings.push({ x, z, h });
      shq.push(x, z, h, h * 0.5);
    }
    await ctx.yield();
    // the eave round the light well: sprays lying on the roll of the lip, drooping over its edge, hanging under it
    {
      const lr2 = xr('lipleaf'), nLip = Math.round(1100 * (0.6 + 0.4 * detail));
      for (let k = 0; k < nLip; k++) {
        if ((k & 127) === 127) await ctx.yield();
        const a = lr2.range(0, TAU), ca = Math.cos(a), sa = Math.sin(a), type = lr2(), tw = lr2.range(-0.9, 0.9);
        const len = lr2.range(2.4, 4.0), n = 7 + lr2.int(0, 3), size = lr2.range(0.85, 1.25);
        let d, y, dx, dy, dz, fx, fy, fz, droop, ao;
        if (type < 0.42) { d = 0.5 + 9 * lr2() * lr2(); dx = -ca - sa * tw; dy = 0.25; dz = -sa + ca * tw; fx = -ca * 0.3; fy = 1; fz = -sa * 0.3; droop = 0.1; ao = 1; }
        else if (type < 0.8) { d = lr2.range(-0.4, 2.2); dx = -ca * 0.5 - sa * tw * 0.6; dy = -0.9; dz = -sa * 0.5 + ca * tw * 0.6; fx = -ca; fy = 0.35; fz = -sa; droop = 0.15; ao = 0.8; }
        else { d = lr2.range(0.3, 4.2); dx = -sa * tw * 0.5; dy = -1; dz = ca * tw * 0.5; fx = -ca; fy = 0.1; fz = -sa; droop = 0.05; ao = 0.5; }
        const x = OC.x + ca * (OC.r + d), z = OC.z + sa * (OC.r + d);
        if (type < 0.42) y = lipY(x, z, d) + lr2.range(0.5, 1.3); else if (type < 0.8) y = lipY(x, z, d) + lr2.range(-0.3, 0.6); else y = ceilY(x, z) - lr2.range(1.4, 3.2);
        const dl = Math.hypot(dx, dy, dz);
        if (routeDist3(x, y, z) < 7.5 || routeDist3(x + dx / dl * len, y + dy / dl * len, z + dz / dl * len) < 6) continue;
        spray(lr2, x, y, z, dx, dy, dz, fx, fy, fz, len, n, size, 1, sunReach(x, y, z), ao, droop);
      }
    }
    await ctx.yield();
    // the lip over the way out of the court: a ragged rim of shoots standing up against the sky and sprays hanging off it
    {
      const er = xr('exitrim');
      for (let k = 0; k < Math.round(520 * (0.6 + 0.4 * detail)); k++) {
        if ((k & 127) === 127) await ctx.yield();
        const a = er.range(1.25, 3.05), ca = Math.cos(a), sa = Math.sin(a), up = er.chance(0.55), d = up ? 0.3 + 16 * er() * er() : er.range(-0.5, 1.6), tw = er.range(-0.9, 0.9);
        const x = OC.x + ca * (OC.r + d), z = OC.z + sa * (OC.r + d), len = er.range(2.2, 4.4), n = 6 + er.int(0, 3), size = er.range(0.9, 1.35);
        const y = up ? Math.max(lipY(x, z, d), Math.min(domeY(x, z), lipY(x, z, d) + 9)) + er.range(0.2, 1.2) : lipY(x, z, d) + er.range(-0.4, 0.5);
        if (routeDist3(x, y, z) < 7.5 || routeDist3(x - ca * len * 0.5, y - (up ? 0 : len), z - sa * len * 0.5) < 6) continue;
        if (up) spray(er, x, y, z, -ca * 0.5 - sa * tw, er.range(0.5, 1.5), -sa * 0.5 + ca * tw, -ca * 0.4, 1, -sa * 0.4, len, n, size, 1, sunReach(x, y + 2, z), 1, 0.12);
        else spray(er, x, y, z, -ca * 0.35 - sa * tw * 0.4, -1, -sa * 0.35 + ca * tw * 0.4, -ca, 0.3, -sa, len * 1.25, n + 2, size, 1, sunReach(x, y, z), 0.85, 0.08);
      }
    }
    await ctx.yield();
    // crown tops under the approach: shoots standing out of the leaf heads, so there are leaves to see as we skim them
    {
      const cr2 = xr('crownleaf'), nCr = Math.round(1000 * detail);
      for (let k = 0; k < nCr; k++) {
        if ((k & 127) === 127) await ctx.yield();
        const j = cr2.int(0, iLow0 + 2), x = sx[j] + cr2.gauss() * 19, z = sz[j] + cr2.range(-8, 8), d = ocDist(x, z) - OC.r, ch = crownH(x, z), a = cr2.range(0, TAU);
        const up = cr2.range(1.6, 3.1), rise = cr2.range(0.2, 0.9), len = cr2.range(2.4, 4.2), n = 6 + cr2.int(0, 3), size = cr2.range(0.85, 1.3) * 0.78;
        if (rho(x, z) > 0.98 || d < 1 || ch < 0.35) continue;
        const y = lipY(x, z, d) + (0.6 + ch * ch) * up;
        if (routeDist3(x, y + 3, z) < 7) continue;
        spray(cr2, x, y, z, Math.cos(a), rise, Math.sin(a), 0, 1, 0, len, n, size, 2, macroLight(x, y, z)[1], 1, 0.08);
      }
    }
    await ctx.yield();
    // the rim where we come in: sprays of big leaves drooping down the wall of the crown, so it is leaf at any range
    {
      const rs = xr('rimleaf');
      for (let k = 0; k < Math.round(480 * (0.6 + 0.4 * detail)); k++) {
        if ((k & 127) === 127) await ctx.yield();
        const x = clamp(sx[0] + 58 + rs.gauss() * 92, -300, 146), rr = rs.range(0.984, 1.002), z = RZ * rr * Math.sqrt(Math.max(0, 1 - (x / RX) * (x / RX) / (rr * rr)));
        let nx = x / (RX * RX), nz = z / (RZ * RZ); const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
        const yTop = Math.max(domeY(x * 0.975, z * 0.975), 14), y = lerp(10.5, yTop + 1, rs()), tw = rs.range(-0.9, 0.9);
        const len = rs.range(2.6, 4.4), n = 7 + rs.int(0, 3), size = rs.range(0.95, 1.4);
        if (routeDist3(x, y, z) < 8) continue;
        spray(rs, x + nx * 0.7, y, z + nz * 0.7, nx * 0.5 - nz * tw, -0.75, nz * 0.5 + nx * tw, nx, 0.45, nz, len, n, size, 1, sunReach(x + nx * 4, y, z + nz * 4), 0.9, 0.12);
      }
    }
    await ctx.yield();
    // the hem at the exit: behind the arch the roof comes down in one ragged skirt of leaf to a few metres off the ground
    // (two sheets, the inner one shorter), hung with sprays and root threads, so the ring stands against dark leaf
    const th0 = Math.atan2(sightB.z / RZ, sightB.x / RX), TH = 0.5, ARC = Math.hypot(RX * Math.sin(th0), RZ * Math.cos(th0));
    const hemY = (th) => Math.max(2.7, 3.9 + 1.9 * noise.n2(th * 15, 4.2) + 1.0 * noise.n2(th * 47, 9.1) + 0.5 * noise.n2(th * 140, 2.3)) + 5.5 * smoothstep(0.55, 1, Math.abs(th - th0) / TH);
    {
      const W = new Store(), NSEG = Math.round(170 * (0.6 + 0.4 * detail)), ROWS = 4;
      for (let L = 0; L < 2; L++) {
        const base = W.count;
        for (let i = 0; i <= NSEG; i++) {
          const th = th0 - TH + (2 * TH * i) / NSEG, c = Math.cos(th), s = Math.sin(th);
          const rr0 = (L ? 0.972 : 0.99) + 0.005 * noise.n2(th * 60 + L * 9, 2.2 + L), hb = hemY(th) + L * 1.3;
          let nx = c / RX, nz = s / RZ; const nl = Math.hypot(nx, nz); nx /= nl; nz /= nl;
          const top = Math.min(domeY(RX * rr0 * c, RZ * rr0 * s) - 0.4, 21);
          for (let v = 0; v <= ROWS; v++) {
            const f = v / ROWS, rr = rr0 + 0.007 * f * f;
            W.v(RX * rr * c, lerp(top, hb, f), RZ * rr * s, nx, 0, nz, (th - th0) * ARC + L * 31, f, top, hb, 1);
          }
        }
        for (let i = 0; i < NSEG; i++) for (let v = 0; v < ROWS; v++) { const q = base + i * (ROWS + 1) + v; W.quad(q, q + 1, q + ROWS + 2, q + ROWS + 1); }
      }
      const skirtMat = mkMat({
        uniforms: { ...LUo }, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          uniform vec4 uHall; uniform float uOutK; attribute vec3 color;
          varying vec3 vP, vN; varying vec2 vUv;
          ${GL_FOG_V}
          void main(){
            vec3 P = position; float t = uHall.z;
            // seen from the plain the hem hangs higher, in swags, and the outermost pillars stand in the shade under it
            float hO = 9.2 + 1.7 * sin(uv.x * .071) + 1.1 * sin(uv.x * .23 + 2.) + .6 * sin(uv.x * .61 + 4.);
            P.y = mix(P.y, mix(color.r, max(color.g, hO), uv.y), uOutK);
            P += normal * (sin(t * .8 + uv.x * .13) * .22 + sin(t * 1.7 + uv.x * .41) * .08) * uv.y * uv.y;      // the hem stirs
            vP = P; vN = normal; vUv = uv;
            vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vP, vN; varying vec2 vUv;
          ${GL_COMMON}
          ${GL_LEAF}
          ${GL_FOG_F}
          uniform float uDomeK;
          void main(){
            vec2 q = vec2(vUv.x, vP.y);
            float rag = vnoise(vec2(q.x * .11, 3.)) * .5 + vnoise(vec2(q.x * .45, 7.)) * .3 + vnoise(q * vec2(1.3, .9)) * .2;
            vec4 lc = leafCell(q * .9), lc2 = leafCell(mat2(.8, -.6, .6, .8) * q * 1.25 + 4.7);
            float leafy = max(lc.x, lc2.x);
            float thr = smoothstep(.76, 1., vUv.y + (rag - .5) * .3);
            if (thr > .01 && leafy < thr * 1.02) discard;                         // the lower edge frays into single leaves
            vec3 alb = mix(uLeafA * .4, leafColor(lc.x > lc2.x ? lc.y : lc2.y, .5) * (.6 + .7 * fract(lc.y * 5.3)), leafy);
            vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.)), N = normalize(vN + vec3(0., 1e-4, 0.));
            float outside = smoothstep(-.05, .05, dot(N, V));
            vec3 cOut = alb * uDomeK * (uSunCol * clamp(dot(N, uSunDir) * .9 + .22, 0., 1.) * (.3 + .7 * leafy) + uSkyAmb * .45 + uShade * .7) * (.4 + .6 * smoothstep(3., 12., vP.y));
            vec3 cIn = alb * (uShade * .5 + uBounce * .45) + alb * uSkyGlow * .05 * thr;      // from inside: dark leaf, the frayed edge glowing a little
            cIn = hallHaze(cIn, uCam + (vP - uCam) * .4);
            gl_FragColor = vec4(mix(cIn, cOut, outside), 1.);
            #include <fog_fragment>
          }`,
      });
      const skirt = new THREE.Mesh(W.geometry(), skirtMat); skirt.frustumCulled = false; group.add(skirt);
      const hr = xr('hem');
      for (let k = 0; k < Math.round(330 * (0.6 + 0.4 * detail)); k++) {       // sprays hanging along the frayed edge
        const th = th0 + hr.range(-0.86, 0.86) * TH, L = hr.chance(0.4) ? 1 : 0, rr = (L ? 0.972 : 0.99) + 0.005 * noise.n2(th * 60 + L * 9, 2.2 + L) + 0.005;
        const c = Math.cos(th), s = Math.sin(th), x = RX * rr * c, z = RZ * rr * s, y = hemY(th) + L * 1.3 + hr.range(0.3, 3), tw = hr.range(-0.7, 0.7);
        spray(hr, x, y, z, -s * tw, -1, c * tw, -c, 0.1, -s, hr.range(1.8, 3.2), 6 + hr.int(0, 3), hr.range(0.7, 1.0), 3, 0, 1, 0.05);
      }
      for (let k = 0; k < Math.round(340 * (0.6 + 0.4 * detail)); k++) {       // and root threads let down from it
        const th = th0 + hr.range(-0.8, 0.8) * TH, rr = hr.range(0.968, 0.992), x = RX * rr * Math.cos(th), z = RZ * rr * Math.sin(th);
        const y = hemY(th) + hr.range(0.8, 3), len = Math.min(hr.range(2, 5.5), y - floorY(x, z) - 0.5);
        if (len > 1) hemThreads.push(x, y, z, len, hr());
      }
    }
    await ctx.yield();
    // ---- under the roof: LEAF MASSES. The ceiling is not a slab: heads of leaf hang below it at every height, round the
    //      head of each column and all round the lip of the light well, ragged at their edges, lit green-gold from above
    //      where the roof is thin; sprays of leaf hang from them; ferns sit on the trunks and boughs and at their feet;
    //      and where a bar of sun lies on the floor, grass, ferns and fig seedlings have come up in it
    const lobes = [];              // x top z sx sy sz yaw seed kind
    const hallFerns = [];          // x y z ax ay az size seed
    const hallGrass = [];          // x y z yaw h seed
    {
      const lr3 = xr('lobes');
      const putLobe = (x, z, s, kind, topY) => {
        if (rho(x, z) > 0.95 || ocDist(x, z) < OC.r + (kind ? -1.2 : 0.8)) return;
        const top = topY ?? ceilY(x, z) + 0.9, sy = s * lr3.range(0.52, 0.9), sz = s * lr3.range(0.8, 1.25), yaw = lr3.range(0, TAU), sd = lr3();
        if (routeDist3(x, top - sy, z) < 5.6 + s * 0.45 || routeDist3(x, top - sy * 0.5, z) < 5.2 + s * 0.8) return;
        lobes.push(x, top, z, s, sy, sz, yaw, sd, kind);
      };
      const nScat = Math.round(400 * (0.6 + 0.4 * detail));
      for (let k = 0; k < nScat; k++) {
        const j = lr3.int(iLow0 + 10, NS), ang = lr3.range(0, TAU), rr = Math.min(Math.abs(lr3.gauss()) * 17 + 3, 44);
        putLobe(sx[j] + Math.cos(ang) * rr, sz[j] + Math.sin(ang) * rr, lr3.range(2.3, 4.7), 0);
      }
      for (const p of nearCols) {                                   // round the head of every near column, so no trunk is cut off by the roof
        if (p.ghost) continue;
        const n = p.pole ? 1 : 2;
        for (let q = 0; q < n; q++) { const a = lr3.range(0, TAU), d = (p.r || 0.5) + lr3.range(0.6, 2.4); putLobe(p.x + Math.cos(a) * d, p.z + Math.sin(a) * d, lr3.range(1.9, 3.3), 0, Math.min(p.top + 0.4, ceilY(p.x, p.z) + 0.9)); }
      }
      await ctx.yield();
      for (let k = 0; k < 150; k++) {                               // all round the lip of the light well, closing the roof's edge
        const a = lr3.range(0, TAU), d = lr3.range(-0.8, 6), x = OC.x + Math.cos(a) * (OC.r + d), z = OC.z + Math.sin(a) * (OC.r + d);
        putLobe(x, z, lr3.range(2.2, 3.8), 1, Math.max(ceilY(x, z) + 1.0, lipY(x, z, Math.max(d, 0)) - 0.6));
      }
      // sprays of leaf hanging from the masses near our way
      for (let i = 0; i < lobes.length; i += 9) {
        if (lobes[i + 8] > 0.5 || routeNear(lobes[i], lobes[i + 2]).d > 30) continue;
        const n = lr3.chance(0.6) ? (lr3.chance(0.4) ? 2 : 1) : 0;
        for (let q = 0; q < n; q++) {
          const a = lr3.range(0, TAU), off = lobes[i + 3] * lr3.range(0.1, 0.6), x = lobes[i] + Math.cos(a) * off, z = lobes[i + 2] + Math.sin(a) * off, y = lobes[i + 1] - lobes[i + 4] * 0.8;
          const len = lr3.range(1.8, 3.4), tw = lr3.range(-0.5, 0.5);
          if (routeDist3(x, y - len, z) < 5.4) continue;
          spray(lr3, x, y, z, Math.cos(a) * 0.3 + tw * 0.2, -1, Math.sin(a) * 0.3, Math.cos(a), 0.25, Math.sin(a), len, 6 + lr3.int(0, 3), lr3.range(0.75, 1.05), 4, 0, 1, 0.06);
        }
      }
      await ctx.yield();
      // ferns: on the trunks beside our way (the giants most of all), in the forks of the boughs, at the trunks' feet
      const fr3 = xr('ferns');
      const trunkFern = (cx, cz, R, yLo, yHi, n, szK, skipA) => {
        for (let q = 0; q < n; q++) {
          const nr0 = routeNear(cx, cz), toR = Math.atan2(sz[nr0.i] - cz, sx[nr0.i] - cx);
          const a = fr3.chance(0.65) ? toR + fr3.range(-1.3, 1.3) : fr3.range(0, TAU), y = fr3.range(yLo, yHi), ca = Math.cos(a), sa = Math.sin(a);
          if (skipA !== undefined && y < 11.5 && Math.abs(Math.atan2(Math.sin(a - skipA), Math.cos(a - skipA))) < 0.6) continue;
          const x = cx + ca * R, z = cz + sa * R, size = fr3.range(0.75, 1.35) * szK;
          if (routeDist3(x + ca * size, y, z + sa * size) < 4.6) continue;
          hallFerns.push(x, y, z, ca * 0.8, 0.6, sa * 0.8, size, fr3());
        }
      };
      for (const p of nearCols) {
        if (p.ghost || p.pole) continue;
        if (fr3.chance(0.75)) trunkFern(p.x, p.z, p.r * 1.02, 2.2, Math.min(11, p.top - 3), 1 + fr3.int(0, 2), 1);
        if (fr3.chance(0.6)) {                                       // and one or two at its foot
          const a = fr3.range(0, TAU), d = p.r * 2.3 + fr3.range(0.2, 1.4), x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
          if (poolIn(x, z) < -5) hallFerns.push(x, floorY(x, z) + 0.05, z, fr3.range(-0.15, 0.15), 1, fr3.range(-0.15, 0.15), fr3.range(1.1, 1.9), fr3());
        }
      }
      for (const G of GIANTS) {
        trunkFern(G.x, G.z, G.R * 1.0, 2.5, 13, G.mother ? 30 : 14, 1.35, G.mother ? motherA : undefined);
        for (let q = 0; q < (G.mother ? 16 : 9); q++) {              // a skirt of ferns between its roots
          const a = fr3.range(0, TAU), d = G.R * fr3.range(1.5, 2.5), x = G.x + Math.cos(a) * d, z = G.z + Math.sin(a) * d;
          if (G.mother && Math.abs(Math.atan2(Math.sin(a - motherA), Math.cos(a - motherA))) < 0.42) continue;
          hallFerns.push(x, floorY(x, z) + 0.05, z, fr3.range(-0.15, 0.15), 1, fr3.range(-0.15, 0.15), fr3.range(1.3, 2.3), fr3());
        }
      }
      for (let k = 0, nl = limbPts.length / 4; k < 90 && nl; k++) {  // bird's-nest ferns in the boughs
        const j = fr3.int(0, nl - 1) * 4, x = limbPts[j], y = limbPts[j + 1] + 0.75, z = limbPts[j + 2], size = fr3.range(0.9, 1.6);
        if (limbPts[j + 3] > 26 || routeDist3(x, y, z) < 4.6 + size) continue;
        hallFerns.push(x, y, z, fr3.range(-0.2, 0.2), 1, fr3.range(-0.2, 0.2), size, fr3());
      }
      await ctx.yield();
      // green in the pools of light: for every bar of sun that lands near our way, grass, ferns and seedlings in it
      const pr3 = xr('pools'), tanE2 = sunDir.y / Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z));
      for (const s of shafts) {
        const fx = s.gx - sunH.x * (ROOF / tanE2), fz = s.gz - sunH.z * (ROOF / tanE2), nr1 = routeNear(fx, fz);
        if (s.av || nr1.d > 24 || rho(fx, fz) > 0.93 || ocDist(fx, fz) < OC.r + 3 || nr1.i > 0.9 * NS) continue;
        const nT = Math.round(clamp(s.a * s.b * 1.1, 10, 34) * (0.6 + 0.4 * detail));
        for (let q = 0; q < nT; q++) {
          const ang = pr3.range(0, TAU), rr = Math.sqrt(pr3()) * 1.05, du = Math.cos(ang) * rr * Math.max(s.b, 2.2), dv = Math.sin(ang) * rr * Math.max(s.a, 2.2);
          const x = fx + sunH.x * du - sunH.z * dv, z = fz + sunH.z * du + sunH.x * dv;
          if (poolIn(x, z) > -4.5 || giantD(x, z) < 1.5) continue;
          const y = floorY(x, z) - 0.03, kind = pr3();
          if (kind < 0.76) hallGrass.push(x, y, z, pr3.range(0, Math.PI), pr3.range(0.5, 1.15) * (1.25 - 0.4 * rr), pr3());
          else if (kind < 0.88) hallFerns.push(x, y + 0.06, z, pr3.range(-0.12, 0.12), 1, pr3.range(-0.12, 0.12), pr3.range(0.8, 1.5), pr3());
          else { const a = pr3.range(0, TAU); spray(pr3, x, y, z, Math.cos(a) * 0.2, 1, Math.sin(a) * 0.2, Math.cos(a + 1.6), 0.45, Math.sin(a + 1.6), pr3.range(0.5, 1.1), 3 + pr3.int(0, 2), pr3.range(0.42, 0.66), 4, 0, 1, 0.05); }
        }
      }
    }
    await ctx.yield();
    // every leaf is one instanced card: an oval blade with midrib and veins, cupped and drooping in the shading, fluttering
    // (three meshes of the one card: the leaves of the hall and the court floor, the eave of the well, the crown in the open)
    {
      const nAll = FL.length / 14, which = new Uint8Array(nAll), cntL = [0, 0, 0];
      for (let i = 0; i < nAll; i++) {
        const o = i * 14, kind = FL[o + 11];
        which[i] = kind > 0.5 && kind < 2.5 ? (kind < 1.5 && ocDist(FL[o], FL[o + 2]) < OC.r + 62 ? 1 : 2) : 0; cntL[which[i]]++;
      }
      const leafMeshes = [], M = new THREE.Matrix4(), e = M.elements, fill = [0, 0, 0];
      for (let w = 0; w < 3; w++) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-0.34, 0, 0, 0.34, 0, 0, 0.34, 0, 1, -0.34, 0, 1]), 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
        const mesh = new THREE.InstancedMesh(g, null, Math.max(cntL[w], 1)); mesh.count = cntL[w];
        g.setAttribute('aF', new THREE.InstancedBufferAttribute(new Float32Array(Math.max(cntL[w], 1) * 4), 4));
        leafMeshes.push(mesh);
      }
      for (let i = 0; i < nAll; i++) {
        const o = i * 14, s = FL[o + 9]; let ax = FL[o + 3], ay = FL[o + 4], az = FL[o + 5], nx = FL[o + 6], ny = FL[o + 7], nz = FL[o + 8];
        const al = Math.hypot(ax, ay, az) || 1; ax /= al; ay /= al; az /= al;
        let rx = ny * az - nz * ay, ry = nz * ax - nx * az, rz = nx * ay - ny * ax; const rl = Math.hypot(rx, ry, rz);
        if (rl < 1e-3) { rx = az; ry = 0; rz = -ax; const l2 = Math.hypot(rx, rz) || 1; rx /= l2; rz /= l2; if (l2 === 1 && rx === 0 && rz === 0) rx = 1; } else { rx /= rl; ry /= rl; rz /= rl; }
        nx = ay * rz - az * ry; ny = az * rx - ax * rz; nz = ax * ry - ay * rx;
        e[0] = rx * s; e[1] = ry * s; e[2] = rz * s; e[3] = 0; e[4] = nx * s; e[5] = ny * s; e[6] = nz * s; e[7] = 0;
        e[8] = ax * s; e[9] = ay * s; e[10] = az * s; e[11] = 0; e[12] = FL[o]; e[13] = FL[o + 1]; e[14] = FL[o + 2]; e[15] = 1;
        const w = which[i], mesh = leafMeshes[w], j = fill[w]++, aF = mesh.geometry.attributes.aF.array;
        mesh.setMatrixAt(j, M);
        aF[j * 4] = FL[o + 10]; aF[j * 4 + 1] = FL[o + 11]; aF[j * 4 + 2] = FL[o + 12]; aF[j * 4 + 3] = FL[o + 13];
        if ((i & 2047) === 2047) await ctx.yield();
      }
      const mesh = leafMeshes[0];
      mesh.material = mkMat({
        uniforms: { ...LUo }, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec4 aF;
          uniform vec4 uHall; uniform vec3 uCam; uniform float uOutK;
          varying vec3 vP, vN, vR, vAx; varying vec2 vUv; varying vec4 vK;
          ${GL_FOG_V}
          void main(){
            float t = uHall.z, sd = aF.x;
            vec3 org = instanceMatrix[3].xyz, rt = instanceMatrix[0].xyz, nr = instanceMatrix[1].xyz, ax = instanceMatrix[2].xyz;
            float sc = max(length(ax), 1e-4);
            vec3 lp = position;
            if (aF.y > 1.5 && aF.y < 2.5) lp *= 1. - smoothstep(46., 78., length(org - uCam));      // crown-top shoots: only close to
            vec4 wp = instanceMatrix * vec4(lp, 1.);
            if (aF.y > 2.5 && aF.y < 3.5) wp.y += uOutK * 5.5;
            float gb = sin(dot(org.xz, vec2(.045, .03)) - t * .8) * .5 + .5;        // gust bands: the tip of the blade moves most
            float w = position.z * (.3 + .7 * gb);
            wp.xyz += nr * sin(t * (2.4 + 2. * sd) + sd * 40.) * .16 * w + rt * sin(t * 1.7 + sd * 23.) * .07 * w;
            vP = wp.xyz; vN = nr / sc; vR = rt / sc; vAx = ax / sc; vUv = vec2(position.x / .34, position.z); vK = aF;
            vec4 mvPosition = modelViewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          varying vec3 vP, vN, vR, vAx; varying vec2 vUv; varying vec4 vK;
          ${GL_COMMON}
          ${GL_LEAF}
          ${GL_FOG_F}
          uniform float uDomeK, uGlint;
          ${GL_AIR}
          void main(){
            float x = vUv.x, y = vUv.y, sd = vK.x, kind = vK.y;
            float wd = pow(max(sin(3.1416 * pow(max(y, 1e-4), .82)), 0.) + 1e-5, .62) * .96 * smoothstep(.04, .14, y);     // a broad oval, blunt at the tip
            float stalk = step(y, .14) * step(abs(x), .09);
            if (abs(x) > wd && stalk < .5) discard;
            vec3 alb = leafColor(sd, kind < .5 ? .42 : kind < 1.5 ? .26 : .5) * (.8 + .5 * fract(sd * 9.1)) * (kind < .5 ? 1.3 : kind < 1.5 ? 1.15 : .95);
            if (kind > 1.5 && kind < 2.5) alb = mix(alb, vec3(.5, .035, .025), uFig * step(.9, fract(sd * 17.3)) * step(length(vec2(x, y - .2)), .16));       // a fig at the base of a crown-top leaf
            float rib = smoothstep(0., .13, abs(x));
            float vein = smoothstep(.06, .22, abs(fract(y * 6.5 - abs(x) * 1.3 + sd) - .5));
            alb *= (.6 + .4 * rib) * (.85 + .15 * vein);
            if (kind > .5 && kind < 2.5) alb = mix(alb, alb * 1.4 + vec3(.06, .09, .065), gustBand(vP.xz, uHall.z) * .7);      // undersides turned up in the gust
            alb = mix(alb, vec3(.07, .055, .04), stalk * step(wd, abs(x)));
            vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.));
            vec3 Nf = normalize(vN + vec3(0., 1e-4, 0.));
            vec3 N = normalize(Nf - vR * x * .5 + vAx * (y - .45) * .45);          // cupped across, drooping along
            if (dot(Nf, V) < 0.) N = -N;
            float ndl = dot(N, uSunDir), front = max(ndl, 0.), trans = max(-ndl, 0.);
            float sp = max(dot(reflect(-uSunDir, N), V), 0.); sp *= sp; sp *= sp; sp *= sp;
            float od = length(vP.xz - uOc.xy) - uOc.z;
            float well = mix(1., smoothstep(1., 24., od), (1. - uMist.w) / .8);
            vec3 col;
            if (kind > 3.5) {                                   // under the roof: young leaves, fresh green, a few still copper, the light coming through them
              vec3 fresh = mix(vec3(.07, .17, .04), vec3(.2, .33, .07), fract(sd * 7.3));
              fresh = mix(fresh, vec3(.34, .15, .05), step(.86, fract(sd * 3.7)) * (.4 + .6 * uFlush));
              fresh *= (.6 + .4 * rib) * (.85 + .15 * vein);
              float sv = sunVis(vP);
              col = fresh * (hallLight(vP, N, 1.) * 1.25 + uSkyAmb * .25 + uSunCol * sv * (front * .5 + trans * 1.1) * vec3(1.1, 1.1, .6));
              col = hallHaze(col, vP);
            } else if (kind > 2.5) {                            // the hem at the exit, seen from inside the hall
              float sv = sunVis(vP);
              col = alb * .85 * (hallLight(vP, N, 1.) + uSunCol * sv * (trans * .8 + sp * .2));
              col = hallHaze(col, uCam + (vP - uCam) * .4);
            } else {
              float sunK = kind < .5 ? courtSun(vP) : vK.z;
              vec3 amb = (uShade * .75 + uSkyAmb * .65) * vK.w * (kind > .5 && kind < 1.5 ? 2.4 * (.55 + .45 * N.y) : 1.);      // the eave stands under open sky
              vec3 sunC = kind < .5 ? uSunCol : uSunCol * uSunTint;
              col = alb * (sunC * sunK * (front * .95 + .13) + amb)
                  + alb * vec3(1.3, 1.2, .45) * sunC * sunK * trans * .55         // the sun through the blade
                  + uSunCol * sunK * sp * .12 * uGlint;
              if (kind < .5) col = hallHaze(col, vP);
              else { col *= uDomeK * (.14 + .86 * well); col = domeFill(col, .5, vP.y); col = domeAir(col, vP.xz, length(vP - uCam), 1., 0., well); }
            }
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }`,
      });
      for (let w = 0; w < 3; w++) { const lm = leafMeshes[w]; lm.material = mesh.material; lm.frustumCulled = false; group.add(lm); if (w) (w === 1 ? stage.court : stage.outer).push(lm); }
    }
    await ctx.yield();
    {
      // the leaf masses: one instanced lobe (a cap bulging downward), its outline and its holes cut by the leaves themselves
      const nL = lobes.length / 9;
      if (nL) {
        const seg = 6, th = [0.55, 1.12, 1.74], pos = [0, -1, 0], idx = [];
        for (let r = 0; r < th.length; r++) for (let j = 0; j < seg; j++) { const a = (j / seg) * TAU + r * 0.5; pos.push(Math.sin(th[r]) * Math.cos(a), -Math.cos(th[r]), Math.sin(th[r]) * Math.sin(a)); }
        for (let j = 0; j < seg; j++) idx.push(0, 1 + j, 1 + ((j + 1) % seg));
        for (let r = 0; r < th.length - 1; r++) for (let j = 0; j < seg; j++) { const a = 1 + r * seg + j, b = 1 + r * seg + ((j + 1) % seg); idx.push(a, a + seg, b + seg, a, b + seg, b); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setIndex(idx);
        const aB = new Float32Array(nL * 2), mesh = new THREE.InstancedMesh(g, null, nL);
        const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3();
        for (let i = 0; i < nL; i++) {
          const o = i * 9;
          Q.setFromEuler(E.set((lobes[o + 7] - 0.5) * 0.5, lobes[o + 6], (lobes[o + 7] * 7.3 % 1 - 0.5) * 0.5));
          mesh.setMatrixAt(i, M.compose(Pv.set(lobes[o], lobes[o + 1], lobes[o + 2]), Q, Sv.set(lobes[o + 3], lobes[o + 4], lobes[o + 5])));
          aB[i * 2] = lobes[o + 7]; aB[i * 2 + 1] = lobes[o + 8];
          if ((i & 255) === 255) await ctx.yield();
        }
        g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 2));
        mesh.material = mkMat({
          uniforms: { ...LU }, side: THREE.DoubleSide,
          vertexShader: /* glsl */`
            attribute vec2 aB;
            uniform vec4 uHall;
            varying vec3 vP, vN, vL; varying vec2 vK;
            ${GL_FOG_V}
            void main(){
              vec3 p = position * (1. + .22 * sin(dot(position, vec3(3.1, 2.3, 4.7)) + aB.x * 40.) + .14 * sin(dot(position, vec3(-5.3, 6.1, 4.2)) + aB.x * 71.));
              vec4 wp = instanceMatrix * vec4(p, 1.);
              vec3 org = instanceMatrix[3].xyz; float t = uHall.z, low = clamp(-position.y, 0., 1.);
              float gb = sin(dot(org.xz, vec2(.045, .03)) - t * .8) * .5 + .5;
              wp.x += sin(t * 1.3 + aB.x * 30. + position.z * 2.) * .1 * (.3 + .7 * gb) * low;
              wp.z += cos(t * 1.1 + aB.x * 17. + position.x * 2.) * .08 * (.3 + .7 * gb) * low;
              vP = wp.xyz; vN = normalize(mat3(instanceMatrix) * position + vec3(0., 1e-4, 0.)); vL = position; vK = aB;
              vec4 mvPosition = modelViewMatrix * wp;
              gl_Position = projectionMatrix * mvPosition;
              #include <fog_vertex>
            }`,
          fragmentShader: /* glsl */`
            varying vec3 vP, vN, vL; varying vec2 vK;
            ${GL_COMMON}
            ${GL_LEAF}
            ${GL_FOG_F}
            void main(){
              vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.)), Ng = normalize(vN);
              float ndv = abs(dot(Ng, V)); vec2 p = vP.xz;
              float dist = length(vP - uCam), df = 1. - smoothstep(30., 95., dist);
              vec2 tg = normalize(vec2(-Ng.z, Ng.x) + vec2(1e-4, 0.));
              vec2 q = (abs(Ng.y) > .6 ? p : vec2(dot(p, tg), vP.y * 1.05)) * 1.15 + vK.x * 31.;
              float pch = smoothstep(.3, .75, vnoise(p * .1 + 11.) * .6 + vnoise(p * .03 + 4.) * .4), cover;
              vec3 avgLeaf = mix(mix(uLeafA, uLeafB, .5), uLeafC, uFlush * (.03 + .1 * pch));
              vec3 nearLeaf = leafField(q, avgLeaf, pch * .3, cover);
              float clump = vnoise(q * .42 + 3.) * .6 + vnoise(q * 1.1) * .4;                    // sprays of leaf with air between them
              float keep = cover * (.55 + .9 * clump);
              // the outline is leaves; the top frays into the roof; here and there a hole shows the roof and the sky behind
              float thr = max((.72 - ndv) * 1.1, 0.) + .34 * smoothstep(-.28, .1, vL.y) + .5 * (1. - smoothstep(.3, .52, clump)) * df;
              if (keep < thr) discard;
              vec3 N = dot(Ng, V) < 0. ? -Ng : Ng;
              vec3 alb = (mix(avgLeaf, nearLeaf * 1.1, df) * 1.5 + vec3(.006, .014, .004)) * vec3(.86, 1.16, .8) * (.62 + .6 * clump);
              float kv = skyVis(vP + vec3(0., 0., 0.)), sv = sunVis(vP);
              float inner = 1. - .58 * smoothstep(-.95, -.1, vL.y);                               // dark up under the roof, lighter at the hanging tips
              float edge = 1. - ndv;
              vec3 col = alb * hallLight(vP, N, inner) * 1.05;
              // light comes down through the leaves where the roof is thin: the mass glows green-gold at its edges
              col += alb * vec3(.95, 1.25, .4) * uSunCol * (kv * (.04 + .16 * edge * edge) + sv * .3 * max(dot(-V, uSunDir), 0.));
              col += alb * uSkyGlow * kv * .08 * (1. - uWx.w * .6);
              col = hallHaze(col, vP);
              gl_FragColor = vec4(col, 1.);
              #include <fog_fragment>
            }`,
        });
        mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; group.add(mesh);
      }
      await ctx.yield();
      // ferns: a rosette of arching fronds, each cut into pinnae in the shader
      const nF = hallFerns.length / 8;
      if (nF) {
        const NFR = 6, pos = [], uvs = [], idx = [];
        for (let f = 0; f < NFR; f++) {
          const a = (f / NFR) * TAU + (f % 2) * 0.35, ca = Math.cos(a), sa = Math.sin(a), rise = f % 2 ? 0.52 : 0.36, base = pos.length / 3;
          for (let s = 0; s <= 2; s++) {
            const t = s / 2, out = t * (0.95 - 0.12 * t), up = rise * Math.sin(Math.PI * Math.min(t * 0.9, 1) * 0.85) - 0.1 * t * t, w = 0.2;
            for (const e of [-1, 1]) { pos.push(ca * out - sa * e * w, up, sa * out + ca * e * w); uvs.push(e, t); }
          }
          for (let s = 0; s < 2; s++) { const q = base + s * 2; idx.push(q, q + 1, q + 3, q, q + 3, q + 2); }
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2)); g.setIndex(idx);
        const aB = new Float32Array(nF), mesh = new THREE.InstancedMesh(g, null, nF);
        const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), Sv = new THREE.Vector3(), Pv = new THREE.Vector3(), Yv = new THREE.Vector3(0, 1, 0), Av = new THREE.Vector3();
        for (let i = 0; i < nF; i++) {
          const o = i * 8, s = hallFerns[o + 6];
          Q.setFromUnitVectors(Yv, Av.set(hallFerns[o + 3], hallFerns[o + 4], hallFerns[o + 5]).normalize()).multiply(Q2.setFromAxisAngle(Yv, hallFerns[o + 7] * TAU));
          mesh.setMatrixAt(i, M.compose(Pv.set(hallFerns[o], hallFerns[o + 1], hallFerns[o + 2]), Q, Sv.set(s, s, s)));
          aB[i] = hallFerns[o + 7];
        }
        g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 1));
        mesh.material = mkMat({
          side: THREE.DoubleSide,
          vertexShader: /* glsl */`
            attribute float aB;
            uniform vec4 uHall;
            varying vec3 vP, vN; varying vec2 vUv; varying float vS;
            ${GL_FOG_V}
            void main(){
              vec4 wp = instanceMatrix * vec4(position, 1.);
              float t = uHall.z, w = uv.y * uv.y * length(instanceMatrix[0].xyz);
              wp.xyz += vec3(sin(t * 1.6 + aB * 40. + position.x * 5.), sin(t * 2.3 + aB * 23. + position.z * 4.) * .6, cos(t * 1.3 + aB * 31.)) * .05 * w;
              vP = wp.xyz; vN = normalize(mat3(instanceMatrix) * vec3(0., 1., 0.) + vec3(0., 1e-4, 0.)); vUv = uv; vS = aB;
              vec4 mvPosition = modelViewMatrix * wp;
              gl_Position = projectionMatrix * mvPosition;
              #include <fog_vertex>
            }`,
          fragmentShader: /* glsl */`
            varying vec3 vP, vN; varying vec2 vUv; varying float vS;
            ${GL_COMMON}
            ${GL_FOG_F}
            void main(){
              float x = abs(vUv.x), y = vUv.y, far = smoothstep(14., 40., length(vP - uCam));
              float env = pow(max(sin(3.1416 * pow(clamp(y, 0., 1.), .7)), 0.) + 1e-4, .6) * (1. - .25 * y);
              float pin = abs(fract(y * 11. + vS * 3.) - .5) * 2.;                                  // the pinnae, each a small blade
              float cut = mix(env * (.14 + .86 * smoothstep(.1, .62, 1. - pin)), env * .7, far);
              if (x > max(cut, .07 * (1. - y))) discard;
              vec3 alb = mix(vec3(.05, .13, .03), vec3(.2, .36, .08), smoothstep(.0, .9, y) * (.6 + .4 * fract(vS * 7.3)));
              alb *= .7 + .3 * smoothstep(.0, .12, x);                                               // the dark midrib
              vec3 V = normalize(uCam - vP + vec3(0., 1e-4, 0.)), N = normalize(vN);
              if (dot(N, V) < 0.) N = -N;
              float sv = sunVis(vP), thru = max(dot(-V, uSunDir), 0.);
              vec3 col = alb * (hallLight(vP, N, .55 + .45 * y) * 1.2 + uSunCol * sv * (.25 + .9 * thru * thru) * vec3(1.1, 1.1, .6));
              col = hallHaze(col, vP);
              gl_FragColor = vec4(col, 1.);
              #include <fog_fragment>
            }`,
        });
        mesh.instanceMatrix.needsUpdate = true; mesh.frustumCulled = false; group.add(mesh); stage.hall.push(mesh);
      }
      // the grass of the light pools: the rushes' own blades (and material), shorter
      const nG = hallGrass.length / 6;
      if (nG && hallGrassMat) {
        const pos = new Float32Array(nG * 24), aT = new Float32Array(nG * 24), uv = new Float32Array(nG * 16), idx = new Uint32Array(nG * 12);
        for (let i = 0; i < nG; i++) for (let w = 0; w < 2; w++) {
          for (let c = 0; c < 4; c++) {
            const o = (i * 2 + w) * 4 + c;
            pos[o * 3] = hallGrass[i * 6]; pos[o * 3 + 1] = hallGrass[i * 6 + 1]; pos[o * 3 + 2] = hallGrass[i * 6 + 2];
            aT[o * 3] = hallGrass[i * 6 + 3] + w * 1.571; aT[o * 3 + 1] = hallGrass[i * 6 + 4]; aT[o * 3 + 2] = hallGrass[i * 6 + 5];
            uv[o * 2] = c === 0 || c === 3 ? -1 : 1; uv[o * 2 + 1] = c < 2 ? 0 : 1;
          }
          const q = (i * 2 + w) * 4; idx.set([q, q + 1, q + 2, q, q + 2, q + 3], (i * 2 + w) * 6);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
        const grass = new THREE.Mesh(g, hallGrassMat); grass.frustumCulled = false; group.add(grass); stage.hall.push(grass);
      }
    }
    await ctx.yield();
    if (SS.count) { const stems = new THREE.Mesh(SS.geometry(), barkMat); stems.frustumCulled = false; group.add(stems); }
    // the saplings' shadows: thrown long across the courtyard floor by the low sun, only where the sun reaches:
    // a thin line for the stem, then the crown drawn out into a long dappled streak
    const ns = shq.length / 4;
    if (ns) {
      const pos = new Float32Array(ns * 12), uv = new Float32Array(ns * 8), idx = new Uint32Array(ns * 6);
      const lx = -sunH.x, lz = -sunH.z, wx = -lz, wz = lx, qd = [[-1, 0], [1, 0], [1, 1], [-1, 1]];
      for (let i = 0; i < ns; i++) {
        const x = shq[i * 4], z = shq[i * 4 + 1], h = shq[i * 4 + 2], r = shq[i * 4 + 3], len = Math.min(h / tanEl, 22) + r;
        for (let k = 0; k < 4; k++) {
          const o = (i * 4 + k) * 3, px = x + lx * len * qd[k][1] + wx * r * qd[k][0], pz = z + lz * len * qd[k][1] + wz * r * qd[k][0];
          pos[o] = px; pos[o + 1] = floorY(px, pz) + 0.07; pos[o + 2] = pz; uv[(i * 4 + k) * 2] = qd[k][0]; uv[(i * 4 + k) * 2 + 1] = qd[k][1];
        }
        idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const m = mkMat({
        fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        blending: THREE.CustomBlending, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendEquation: THREE.AddEquation,
        vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vP; void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          varying vec2 vUv; varying vec3 vP;
          ${GL_COMMON}
          void main(){
            float dap = smoothstep(.2, .6, vnoise(vP.xz * 1.1 + 3.) * .55 + vnoise(vP.xz * 2.9 + uHall.z * .15) * .45);                // leaves and the gaps between them
            float fray = (vnoise(vP.xz * .7 + 11.) - .5) * .5;
            float tr = (1. - smoothstep(.04, .34, abs(vUv.x + fray * .3))) * (1. - smoothstep(.36, .66, vUv.y)) * smoothstep(0., .08, vUv.y) * (.35 + .4 * dap);   // the stem: a soft streak
            float cr = (1. - smoothstep(.2, 1., length(vec2(vUv.x + fray * .4, (vUv.y - .72) * 2.9)))) * (.2 + .8 * dap);                // the crown, drawn out long and broken into dapples
            float a = max(tr, cr) * .95 * courtSun(vP) * (1. - smoothstep(.86, 1., vUv.y));
            gl_FragColor = vec4(mix(vec3(1.), vec3(.24, .38, .52), a), 1.);
          }`,
      });
      const shadows = new THREE.Mesh(g, m); shadows.frustumCulled = false; shadows.renderOrder = 1; group.add(shadows);
    }
  }
  await ctx.yield();

  // helper: merged quads with per-quad data. rows(i) fills `q` (per-quad floats); corners get (u,v) appended
  function quadCloud(n, stride, fill) {
    const data = new Float32Array(n * 4 * stride), uv = new Float32Array(n * 8), idx = new Uint32Array(n * 6), q = new Float32Array(stride);
    for (let i = 0; i < n; i++) {
      fill(i, q);
      for (let c = 0; c < 4; c++) { data.set(q, (i * 4 + c) * stride); uv[(i * 4 + c) * 2] = c === 0 || c === 3 ? -1 : 1; uv[(i * 4 + c) * 2 + 1] = c < 2 ? -1 : 1; }
      idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
    }
    const g = new THREE.BufferGeometry(), ib = new THREE.InterleavedBuffer(data, stride);
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.userData.ib = ib; return g;
  }
  const iattr = (g, name, size, off) => g.setAttribute(name, new THREE.InterleavedBufferAttribute(g.userData.ib, size, off));

  await ctx.yield();
  // ---- hanging root threads and taut ropes ---------------------------------------------------------------
  {
    const nT = Math.round(900 * detail), rows = 5, th = [];
    for (let k = 0, tries = 0; k < nT && tries < nT * 8; tries++) {
      let x, y, z;
      if (rng.chance(0.5) && limbPts.length) { const j = rng.int(0, limbPts.length / 4 - 1) * 4; x = limbPts[j] + rng.range(-0.3, 0.3); y = limbPts[j + 1]; z = limbPts[j + 2] + rng.range(-0.3, 0.3); }
      else { const j = rng.int(iLow0 + 8, NS), ang = rng.range(0, TAU), rr = 34 * Math.sqrt(rng()); x = sx[j] + Math.cos(ang) * rr; z = sz[j] + Math.sin(ang) * rr; y = ceilY(x, z) + 0.6; }
      if (rho(x, z) > 0.95 || ocDist(x, z) < OC.r + 1.5) continue;
      const n = routeNear(x, z), fy = floorY(x, z);
      let taut = rng.chance(0.14) ? 1 : 0, len = taut ? y - fy + 0.2 : rng.range(2, 10.5);
      if (n.d < 3.6) { taut = 0; len = Math.min(len, y - (sy[n.i] + 4.2)); if (len < 1.2) continue; }
      else if (n.d < 6.5 && taut) taut = 0;
      len = Math.min(len, y - fy - 0.3);
      th.push(x, y, z, len, taut, rng(), 0); k++;
      if ((k & 127) === 127) await ctx.yield();
    }
    await ctx.yield();
    {                                    // curtains of roots let down round the lip of the light well: bunches of ropes
      const cr = xr('curtain');           // hanging 4 to 8 m below the eave, in front of the ring of pillars
      for (let bq = 0; bq < Math.round(72 * (0.6 + 0.4 * detail)); bq++) {
        const a0 = cr.range(0, TAU), bl = cr.range(4, 8), nb = 9 + cr.int(0, 8);
        for (let k = 0; k < nb; k++) {
          const a = a0 + cr.gauss() * 0.04, d = cr.range(0.2, 3.4), x = OC.x + Math.cos(a) * (OC.r + d), z = OC.z + Math.sin(a) * (OC.r + d);
          const y = lipY(x, z, d) - 0.3, len = Math.min(bl * cr.range(0.55, 1.15), y - floorY(x, z) - 0.6), sd = cr();
          if (len < 2 || routeDist3(x, y - len * 0.5, z) < 5.5 || routeDist3(x, y - len, z) < 5.5 || routeDist3(x, y, z) < 5.5) continue;
          th.push(x, y, z, len, 0, sd, 1);
        }
      }
      {
        const xc = xr('exitcurtain');       // more of them over the way out, long, in front of the sky
        for (let bq = 0; bq < 22; bq++) {
          const a0 = xc.range(1.3, 3.0), bl = xc.range(5, 10), nb = 7 + xc.int(0, 6);
          for (let k = 0; k < nb; k++) {
            const a = a0 + xc.gauss() * 0.035, d = xc.range(-0.3, 1.6), x = OC.x + Math.cos(a) * (OC.r + d), z = OC.z + Math.sin(a) * (OC.r + d);
            const y = lipY(x, z, Math.max(d, 0.2)) - 0.2, len = Math.min(bl * xc.range(0.55, 1.15), y - floorY(x, z) - 0.6), sd = xc();
            if (len < 2 || routeDist3(x, y - len * 0.5, z) < 5.5 || routeDist3(x, y - len, z) < 5.5 || routeDist3(x, y, z) < 5.5) continue;
            th.push(x, y, z, len, 0, sd, 1);
          }
        }
      }
      for (let k = 0; k < hemThreads.length; k += 5) th.push(hemThreads[k], hemThreads[k + 1], hemThreads[k + 2], hemThreads[k + 3], 0, hemThreads[k + 4], 0.7);
      for (let k = 0; k < giantThreads.length; k += 5) th.push(giantThreads[k], giantThreads[k + 1], giantThreads[k + 2], giantThreads[k + 3], 0, giantThreads[k + 4], 0.45);
      for (let k = 0; k < feats.featThreads.length; k += 5) th.push(feats.featThreads[k], feats.featThreads[k + 1], feats.featThreads[k + 2], feats.featThreads[k + 3], 0, feats.featThreads[k + 4], 0.3);
      // round six: root threads let down beside every braided pillar, from the boughs at its head
      await ctx.yield();
      const pt = xr('pillarthreads');
      for (const q of pillars) {
        if (q.ghost || q.d > 40 || !q.col) continue;
        const n = q.tier === 0 ? 2 + pt.int(0, 2) : 1 + pt.int(0, 1);
        for (let k = 0; k < n; k++) {
          const a = pt.range(0, TAU), d = q.r * 1.6 + pt.range(0.5, 2.6), x = q.x + Math.cos(a) * d, z = q.z + Math.sin(a) * d, sd = pt();
          const y = Math.min(q.top - pt.range(0.6, 2.6), ceilY(x, z) + 0.4), len = Math.min(pt.range(2.5, 9), y - floorY(x, z) - 0.4);
          if (len < 1.5 || routeDist3(x, y - len, z) < 5.6 || routeDist3(x, y - len * 0.5, z) < 5.6 || ocDist(x, z) < OC.r + 1.5) continue;
          th.push(x, y, z, len, 0, sd, 0.25);
        }
      }
    }
    const n = th.length / 7, pos = new Float32Array(n * rows * 6), aT = new Float32Array(n * rows * 8), aK = new Float32Array(n * rows * 4), idx = new Uint32Array(n * (rows - 1) * 6);
    await ctx.yield();
    for (let i = 0; i < n; i++) {
      if ((i & 511) === 511) await ctx.yield();
      for (let r = 0; r < rows; r++) for (let s = 0; s < 2; s++) {
        const o = (i * rows + r) * 2 + s;
        pos[o * 3] = th[i * 7]; pos[o * 3 + 1] = th[i * 7 + 1]; pos[o * 3 + 2] = th[i * 7 + 2];
        aT[o * 4] = r / (rows - 1); aT[o * 4 + 1] = s * 2 - 1; aT[o * 4 + 2] = th[i * 7 + 3]; aT[o * 4 + 3] = th[i * 7 + 5]; aK[o * 2] = th[i * 7 + 4]; aK[o * 2 + 1] = th[i * 7 + 6];
        if (r < rows - 1 && s === 0) idx.set([o, o + 1, o + 3, o, o + 3, o + 2], (i * (rows - 1) + r) * 6);
      }
    }
    await ctx.yield();
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 4)); g.setAttribute('aK', new THREE.BufferAttribute(aK, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const m = mkMat({
      uniforms: { uRootCol: { value: mix3(cCream, new THREE.Color(0.4, 0.3, 0.2), 0.5).multiplyScalar(0.42) } }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec4 aT; attribute vec2 aK;
        uniform vec4 uHall; uniform vec3 uCam; uniform float uOutK;
        varying vec3 vP; varying vec3 vI; varying float vSd;
        ${GL_FOG_V}
        void main(){
          float t = aT.x, L = aT.z, sd = aT.w, time = uHall.z;
          vec3 P = position; P.y -= t * L;
          if (aK.y > .6 && aK.y < .8) P.y += uOutK * 4.5;                // the hem's threads hang from wherever the hem is
          float om = .9 + 2.4 / sqrt(max(L, 1.));
          float gust = .55 + .45 * sin(dot(position.xz, vec2(.06, .045)) - time * .9);
          float stir = 1. + 2.2 * (1. - smoothstep(3., 15., length(position.xz - uCam.xz)));
          vec2 swF = vec2(sin(time * om + sd * 40. - t * 1.3), cos(time * om * .83 + sd * 23. - t * 1.1));
          vec2 swT = vec2(sin(time * 7. + sd * 31.), cos(time * 6.1 + sd * 12.));
          P.xz += mix(swF * .075 * L * pow(max(t, 0.) + 1e-5, 1.6) * gust * stir, swT * .03 * sin(3.14159 * t) * stir, aK.x);
          vec3 toC = uCam - P; float d = length(toC);
          vec3 s = cross(vec3(0., 1., 0.), toC); s = s / max(length(s), 1e-4);
          float w = max(mix(.03, .065, aK.x) * (1.6 - .9 * t * (1. - aK.x)) * (1. + .9 * aK.y), d * .0013 * (1. + .5 * aK.y));      // the curtain's ropes are a little thicker
          w *= mix(1. - .88 * smoothstep(.55, 1., t), 1., aK.x);          // a free root tapers to its growing tip
          P += s * aT.y * w;
          vP = P; vI = vec3(t, aK.x, sd); vSd = aT.y;
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP; varying vec3 vI; varying float vSd; uniform vec3 uRootCol;
        ${GL_COMMON}
        ${GL_FOG_F}
        void main(){
          vec3 toC = vec3(uCam.x - vP.x, 0., uCam.z - vP.z); vec3 N = toC / max(length(toC), 1e-3);
          N = normalize(N * sqrt(max(1. - vSd * vSd, 0.)) + vec3(-N.z, 0., N.x) * vSd + vec3(0., 1e-4, 0.));      // a rope, round in section
          vec3 alb = uRootCol * (.75 + .5 * hash11(floor(vI.z * 64.))) * (.55 + .45 * (1. - vSd * vSd));
          alb = mix(alb, vec3(.42, .075, .04), smoothstep(.86, .97, vI.x) * (1. - vI.y) * (1. - .75 * uWx.w) * (.35 + .65 * step(.5, fract(vI.z * 7.3))));       // red growing tips, on the younger ones
          vec3 col = alb * (hallLight(vP, N, 1.) + uSunCol * sunVis(vP) * .5);
          col = hallHaze(col, vP);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const threads = new THREE.Mesh(g, m); threads.frustumCulled = false; group.add(threads);
  }
  await ctx.yield();

  // ---- litter cards (lift in our wake) and falling leaves -------------------------------------------------
  {
    const nLit = Math.round(3600 * detail), nFall = Math.round(900 * detail);
    const nDrift = drifts.length / 8;
    const g = quadCloud(nLit + nFall + nDrift, 8, (i, q) => {
      if (i >= nLit + nFall) { for (let k = 0; k < 8; k++) q[k] = drifts[(i - nLit - nFall) * 8 + k]; return; }
      const fall = i >= nLit;
      for (let tries = 0; tries < 12; tries++) {
        const j = rng.int(iLow0 + 4, NS), ang = rng.range(0, TAU), rr = (fall ? 24 : 14) * Math.sqrt(rng());
        const x = sx[j] + Math.cos(ang) * rr, z = sz[j] + Math.sin(ang) * rr;
        q[0] = x; q[2] = z; q[1] = fall ? Math.min(ceilY(x, z), 17) : poolIn(x, z) > -5 ? POOL.y + 0.02 : floorY(x, z) + 0.03;
        if (rho(x, z) < 0.95 && (fall ? ocDist(x, z) > OC.r : true)) break;
      }
      q[3] = fall ? rng.range(0.22, 0.4) : rng.range(0.2, 0.42); q[4] = rng(); q[5] = rng.range(0, TAU); q[6] = fall ? 1 : rng.range(0.1, 0.6); q[7] = fall ? 1 : 0;
    });
    iattr(g, 'position', 3, 0); iattr(g, 'aL', 2, 3); iattr(g, 'aR', 3, 5);
    const m = mkMat({
      uniforms: { uOchre: { value: mix3(cGold, cCream, 0.4).multiplyScalar(0.6) }, uCopper: { value: mix3(cAmber, new THREE.Color(0.26, 0.15, 0.07), 0.62).multiplyScalar(0.7) } }, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec2 aL; attribute vec3 aR;
        uniform vec4 uHall; uniform vec3 uCam, uCamDir; uniform float uWake;
        varying vec3 vP, vN; varying vec2 vUv; varying float vS;
        ${GL_FOG_V}
        void main(){
          float sz = aL.x, sd = aL.y, time = uHall.z, yaw = aR.x, tilt = aR.y, fig = step(1.5, aR.z);
          vec3 C = position;
          float spin = 0.;
          if (aR.z > .5 && aR.z < 1.5) {                     // falling: tumble down from the roof, drift, land, start again
            float f = fract(sd * 7.13 + time * (.05 + .03 * sd));
            C.y = mix(C.y, .1, f);
            C.xz += vec2(sin(time * 1.1 + sd * 50.), cos(time * .9 + sd * 31.)) * (.5 + sd) + vec2(f * 2.5, 0.);
            spin = time * (2. + 2. * sd) + sd * 20.; tilt = 1.1 * sin(spin * .7);
          } else {                                           // litter: lifted and whirled by the wings going by
            vec2 dv = C.xz - uCam.xz; vec2 fd = uCamDir.xz / max(length(uCamDir.xz), 1e-3);
            float along = -dot(dv, fd), lat = dot(dv, vec2(-fd.y, fd.x));
            float k = uWake * (1. - smoothstep(1.5, 6.5, abs(lat))) * smoothstep(-16., -3., along) * (1. - smoothstep(8., 34., along));
            k *= .35 + .65 * sd;
            // the figs take no part in that wake: a fig lies where it fell
            k *= 1. - fig;
            C.y += k * (.4 + 2.3 * fract(sd * 9.7));
            C.xz += vec2(-fd.y, fd.x) * sign(lat) * k * 1.4 + fd * k * 2.;
            spin = k * (5. + time * 6. * (sd - .3)); tilt += k * 1.3 * sin(spin);
          }
          float a = yaw + spin;
          float dc = length(C - uCam);
          sz *= mix(1., smoothstep(2.2, 7.5, dc), max(aR.z * (1. - fig), clamp(C.y - position.y, 0., 1.)));      // nothing big and flat across the lens
          vec3 right = vec3(cos(a), 0., sin(a)), fw = vec3(-right.z, 0., right.x);
          vec3 fw2 = normalize(fw * cos(tilt) + vec3(0., 1., 0.) * sin(tilt));
          vec3 P = C + right * uv.x * sz * .55 + fw2 * uv.y * sz + vec3(0., 1., 0.) * .25 * sz * uv.x * uv.x * (1. - fig);   // curled edges
          if (fig > .5) {                                    // a fallen fig: a little ball, drawn as a disc turned to the eye
            vec3 toC = uCam - C; vec3 fr = cross(vec3(0., 1., 0.), toC); fr = fr / max(length(fr), 1e-4);
            vec3 fu = cross(toC, fr); fu = fu / max(length(fu), 1e-4);
            P = C + vec3(0., sz * .8, 0.) + (fr * uv.x + fu * uv.y) * sz;
          }
          vP = P; vN = normalize(cross(fw2, right)); vUv = uv; vS = sd + 2. * fig;
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP, vN; varying vec2 vUv; varying float vS; uniform vec3 uOchre, uCopper;
        ${GL_COMMON}
        ${GL_FOG_F}
        void main(){
          if (vS > 1.5) {                                    // a fig: scarlet, round, a pale speck where the sky shows on it, dark underneath
            float rr = dot(vUv, vUv);
            if (rr > 1.) discard;
            vec3 Nf = normalize(vec3(vUv.x * .7, vUv.y + .25, .6 * sqrt(max(1. - rr, 0.)) + 1e-3));
            vec3 af = mix(vec3(.46, .035, .02), vec3(.3, .05, .03), fract(vS * 7.7)) * (.55 + .45 * smoothstep(-.9, .5, vUv.y));
            vec3 cf = af * (hallLight(vP, vec3(0., 1., 0.), .5 + .5 * smoothstep(-.8, .3, vUv.y)) * (.7 + .5 * Nf.y) + uSunCol * sunVis(vP) * .35 * max(Nf.y, 0.));
            gl_FragColor = vec4(hallHaze(cf, vP), 1.);
            #include <fog_fragment>
            return;
          }
          float e = length(vec2(vUv.x * (1.15 + .45 * vUv.y), vUv.y));
          if (e > 1.) discard;
          vec3 alb = mix(uOchre, uCopper, smoothstep(.2, .8, fract(vS * 5.3))) * (.7 + .5 * fract(vS * 11.7));
          float rib = smoothstep(.0, .1, abs(vUv.x));                                                // midrib
          float vein = smoothstep(.05, .2, abs(fract((vUv.y * .5 + .5) * 5. - abs(vUv.x) * 1.6) - .5)); // side veins
          alb *= (.6 + .4 * rib) * (.8 + .2 * vein) * (.75 + .5 * abs(vUv.x)) * (.85 + .3 * vnoise(vUv * 6. + vS * 40.));
          alb = mix(alb, alb * vec3(.55, .42, .3), smoothstep(.75, 1., e) * .7);                    // dry curled rim
          vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
          vec3 col = alb * (hallLight(vP, N, 1.) + uSunCol * sunVis(vP) * .55);
          col = hallHaze(col, vP);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const litter = new THREE.Mesh(g, m); litter.frustumCulled = false; group.add(litter); stage.hall.push(litter);
  }
  await ctx.yield();

  // ---- shafts: additive slabs laid along the sun from every gap in the mask -----------------------------------
  const down = sunDir.clone().multiplyScalar(-1);
  const xsh = xr('shafts6');
  const shaftEnds = shafts.map((s) => {
    const A = new THREE.Vector3(s.gx, ROOF, s.gz).addScaledVector(sunDir, 9 + 7 * liftK(s.gx, s.gz) / Math.max(sunDir.y, 0.13));
    const B = new THREE.Vector3(s.gx, ROOF, s.gz).addScaledVector(down, (ROOF + 0.5) / sunDir.y);
    return { A, B, a: s.a, bv: Math.max(0.55, s.b * sunDir.y * 1.6), I: s.I, seed: s.x ? xsh() : rng() };
  });
  const LIGHT_V = /* glsl */`
    vec3 bH = cross(ax, vec3(0., 1., 0.)); bH = bH / max(length(bH), 1e-4); vec3 bV = cross(bH, ax);`;
  {
    const rows = 5, n = shaftEnds.length, pos = new Float32Array(n * rows * 6), aB = new Float32Array(n * rows * 6), aS = new Float32Array(n * rows * 8), aI = new Float32Array(n * rows * 4), idx = new Uint32Array(n * (rows - 1) * 6);
    for (let i = 0; i < n; i++) for (let r = 0; r < rows; r++) for (let s = 0; s < 2; s++) {
      const o = (i * rows + r) * 2 + s, e = shaftEnds[i];
      pos.set([e.A.x, e.A.y, e.A.z], o * 3); aB.set([e.B.x, e.B.y, e.B.z], o * 3);
      aS.set([r / (rows - 1), s * 2 - 1, e.a, e.bv], o * 4); aI.set([e.I, e.seed], o * 2);
      if (r < rows - 1 && s === 0) idx.set([o, o + 1, o + 3, o, o + 3, o + 2], (i * (rows - 1) + r) * 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aB', new THREE.BufferAttribute(aB, 3));
    g.setAttribute('aS', new THREE.BufferAttribute(aS, 4)); g.setAttribute('aI', new THREE.BufferAttribute(aI, 2));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const shaftMat = (mirror) => mkMat({
      fog: false, transparent: !mirror, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { uShaftCol: { value: shaftCol }, uShaftI: { value: (night ? 0.6 : hour === 'day' ? 0.7 : 1) * (foggy ? (hour === 'day' ? 1.2 : 1.5) : 1) * (mirror ? 0.75 : 1) } },
      vertexShader: /* glsl */`
        attribute vec3 aB; attribute vec4 aS; attribute vec2 aI;
        uniform vec3 uCam;
        varying vec3 vP; varying vec4 vS; varying vec2 vI;
        void main(){
          vec3 d = aB - position; float len = length(d); vec3 ax = d / max(len, 1e-3);
          vec3 P = mix(position, aB, aS.x);
          vec3 toC = uCam - P; vec3 s = cross(ax, toC); s = s / max(length(s), 1e-4);
          ${LIGHT_V}
          float w = max(length(vec2(dot(s, bH) * aS.z, dot(s, bV) * aS.w)), .45);
          P += s * aS.y * w * 1.25;
          vP = P; vS = vec4(aS.x, aS.y, len, aS.z * aS.w / w); vI = aI;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(P.x, ${mirror ? (2 * POOL.y).toFixed(2) + ' - P.y' : 'P.y'}, P.z, 1.);
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP; varying vec4 vS; varying vec2 vI;
        uniform vec3 uShaftCol; uniform float uShaftI;
        ${GL_COMMON}
        void main(){
          float prof = 1. - vS.y * vS.y; prof *= prof;
          float ends = smoothstep(0., .07, vS.x) * (1. - .35 * vS.x);
          float time = uHall.z;
          float dust = .5 + .5 * vnoise(vec2(vS.x * vS.z * .22 - time * .1, vS.y * 1.6 + vI.y * 19.));
          dust *= .7 + .3 * vnoise(vec2(vS.x * vS.z * .9 + time * .23, vS.y * 4. - vI.y * 7.));
          float flick = .62 + .38 * vnoise(vec2(time * .7 + vI.y * 40., vI.y * 13.));
          vec3 v = vP - uCam; float d = length(v); vec3 vd = v / max(d, 1e-3);
          float nearF = smoothstep(2.5, 11., d);
          float toSun = max(dot(vd, uSunH), 0.);
          float phase = .8 + .75 * toSun * toSun;
          float dens = 1. - exp(-vS.w * .22);
          // never meet the floor (or end) at a line: fade out over the last metres above the litter, edges broken by leaf shadow
          float soft = smoothstep(.15, 3.4, vP.y) * (1. - smoothstep(.8, 1., vS.x));
          soft *= .72 + .28 * vnoise(vec2(vS.y * 3.1 + vI.y * 5., vS.x * vS.z * .35));
          float a = prof * ends * soft * dust * flick * nearF * phase * dens * vI.x * uShaftI * exp(-d * uHall.y * .55);
          gl_FragColor = vec4(uShaftCol * a * 1.35, 1.);
        }`,
    });
    const mesh = new THREE.Mesh(g, shaftMat(false)); mesh.frustumCulled = false; mesh.renderOrder = 6; group.add(mesh);
    const mesh2 = new THREE.Mesh(g, shaftMat(true)); mesh2.frustumCulled = false; mesh2.renderOrder = -4.5; group.add(mesh2);      // the shafts in the pool
  }

  // ---- the courtyard's standing column of gold -----------------------------------------------------------
  const colTop = 36;
  const columnMat = mkMat({
    fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: { uShaftCol: { value: shaftCol }, uCol: { value: new THREE.Vector4(OC.x, OC.z, OC.r - 1.5, colTop) }, uColI: { value: 1 } },
    vertexShader: /* glsl */`
      varying vec3 vP;
      void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; uniform vec3 uShaftCol; uniform vec4 uCol; uniform float uColI;
      ${GL_COMMON}
      void main(){
        vec3 ro = uCam, v = vP - uCam; float dl = length(v); vec3 rd = v / max(dl, 1e-3);
        vec2 oc = ro.xz - uCol.xy;
        float a = max(dot(rd.xz, rd.xz), 1e-5), b = dot(oc, rd.xz), c = dot(oc, oc) - uCol.z * uCol.z;
        float disc = b * b - a * c;
        float sq = sqrt(max(disc, 0.));
        float t0 = max((-b - sq) / a, 0.), t1 = (-b + sq) / a;
        float ry = abs(rd.y) < 1e-4 ? 1e-4 : rd.y;
        float ta = (0. - ro.y) / ry, tb = (uCol.w - ro.y) / ry;
        t0 = max(t0, min(ta, tb)); t1 = min(min(t1, max(ta, tb)), dl + 2.);
        float chord = max(t1 - t0, 0.) * step(0., disc);
        vec3 pm = ro + rd * (t0 + t1) * .5;
        float s = dot(pm.xz - uCol.xy, uSunH.xz);
        float shadowH = uCol.w - 9. - (uCol.z - s) * uSunDir.y / max(length(uSunDir.xz), .05);
        float lit = .68 + .32 * smoothstep(-7., 7., pm.y - shadowH);
        float mote = .7 + .3 * vnoise(vec2(pm.x * .11 + pm.z * .07, pm.y * .16 - uHall.z * .04));
        float fadeTop = 1. - smoothstep(uCol.w - 12., uCol.w, pm.y);
        // the crown round the well is lumpy, so the sun comes over it in beams: the air of the well is barred with light
        // and shade along the sun (three places along the line through it, each asked which beam it stands in)
        vec3 bH = cross(uSunDir, vec3(0., 1., 0.)); bH = bH / max(length(bH), 1e-3); vec3 bV = cross(bH, uSunDir);
        float beam = 0.;
        for (int k = 0; k < 3; k++) {
          vec3 pk = ro + rd * (t0 + chord * (.18 + .32 * float(k)));
          vec2 bp = vec2(dot(pk, bH), dot(pk, bV));
          beam += smoothstep(.36, .68, vnoise(vec2(bp.x * .15 + 3., bp.y * .045)) * .68 + vnoise(vec2(bp.x * .47 + 7., bp.y * .13)) * .32);
        }
        beam *= .3333;
        float g = (1. - exp(-chord * .012)) * lit * mote * (.35 + .65 * fadeTop) * exp(-t0 * uHall.y * .45) * (.6 + .95 * beam);
        float inside = (1. - smoothstep(uCol.z + 2., uCol.z + 17., length(oc))) * (1. - smoothstep(uCol.w - 8., uCol.w, ro.y));
        g *= mix(1., (.2 + .34 * beam) * (1. - .75 * smoothstep(.1, .6, rd.y)), inside);                    // from within the court it is the air we are in, not a wall of gold
        // from the court floor the far lip of the well is leaf in clear morning air: the gold hangs under the eave, not over the crowns
        g *= 1. - .86 * smoothstep(5., 15., ro.y + rd.y * t1) * (1. - smoothstep(12., 20., ro.y)) * smoothstep(-.02, .06, rd.y);
        gl_FragColor = vec4(uShaftCol * g * uColI * 1.9, 1.);
      }`,
  });
  {
    const g = new THREE.CylinderGeometry(OC.r - 1.5, OC.r - 1.5, colTop, 48, 1, true); g.translate(OC.x, colTop / 2, OC.z);
    const mesh = new THREE.Mesh(g, columnMat); mesh.frustumCulled = false; mesh.renderOrder = 5; group.add(mesh);
    const lid = new THREE.CircleGeometry(OC.r - 1.5, 48); lid.rotateX(-Math.PI / 2); lid.translate(OC.x, colTop, OC.z);
    const mesh2 = new THREE.Mesh(lid, columnMat); mesh2.frustumCulled = false; mesh2.renderOrder = 5; group.add(mesh2);
  }

  // ---- dust and gnats: points that only exist inside the shafts ---------------------------------------------
  {
    const n = Math.round(2600 * detail), pos = new Float32Array(n * 3), aB = new Float32Array(n * 3), aD = new Float32Array(n * 4), aE = new Float32Array(n * 2);
    const mr = xr('motes');          // each mote is dealt to a shaft, and to its place in it, from the motes' own stream
    for (let i = 0; i < n && shaftEnds.length; i++) {
      const e = shaftEnds[mr.int(0, shaftEnds.length - 1)];
      pos.set([e.A.x, e.A.y, e.A.z], i * 3); aB.set([e.B.x, e.B.y, e.B.z], i * 3);
      const an = mr.range(0, TAU), rr = Math.sqrt(mr());
      aD.set([mr.range(0.1, 1), Math.cos(an) * rr, Math.sin(an) * rr, mr()], i * 4); aE.set([e.a, e.bv], i * 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aB', new THREE.BufferAttribute(aB, 3));
    g.setAttribute('aD', new THREE.BufferAttribute(aD, 4)); g.setAttribute('aE', new THREE.BufferAttribute(aE, 2));
    const m = mkMat({
      fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uShaftCol: { value: shaftCol } },
      vertexShader: /* glsl */`
        attribute vec3 aB; attribute vec4 aD; attribute vec2 aE;
        uniform vec3 uCam; uniform vec4 uHall; uniform float uPx;
        varying float vA;
        void main(){
          vec3 d = aB - position; float len = length(d); vec3 ax = d / max(len, 1e-3);
          ${LIGHT_V}
          float time = uHall.z, sd = aD.w, gnat = step(.78, sd);
          float t = fract(aD.x + time * .003 * (sd - .5));
          vec3 P = mix(position, aB, t) + bH * aE.x * aD.y * .9 + bV * aE.y * aD.z * .9;
          float sp = mix(.35, 3.2, gnat), am = mix(.35, .22, gnat);
          P += vec3(sin(time * sp + sd * 91.), sin(time * sp * 1.31 + sd * 47.) * mix(.5, 1.4, gnat), cos(time * sp * .87 + sd * 63.)) * am;
          vec4 mv = modelViewMatrix * vec4(P, 1.);
          float dist = max(-mv.z, .1);
          float ideal = mix(.03, .05, gnat) * uPx / dist;
          gl_PointSize = clamp(ideal, 1.5, 7.);
          float tw = .55 + .45 * sin(time * (1.5 + 4. * sd) + sd * 200.);
          vA = min(1., ideal / 1.5) * tw * smoothstep(1.5, 5., dist) * exp(-dist * uHall.y) * smoothstep(.02, .1, t) * mix(1., .75, gnat);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        varying float vA; uniform vec3 uShaftCol;
        void main(){
          vec2 q = gl_PointCoord - .5; float r = dot(q, q) * 4.;
          float a = max(1. - r, 0.); a *= a;
          gl_FragColor = vec4(uShaftCol * a * vA * 2.6, 1.);
        }`,
    });
    const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 7; group.add(pts);
  }
  await ctx.yield();

  // ---- the hung colony: bats as thick as fruit along the limbs ---------------------------------------------
  const mantle = mix3(cAmber, new THREE.Color(0.45, 0.2, 0.05), 0.5).multiplyScalar(0.75);
  const amber = cAmber.clone();
  {
    const rng = xr('hungcolony');          // (the colony has a stream of its own: nothing before it in the build can deal it afresh)
    const hooks = [];
    const want = Math.round(2900 * detail * density);
    const nl = limbPts.length / 4;
    for (let k = 0, tries = 0; k < want && tries < want * 8; tries++) {
      let x, y, z;
      const r = rng();
      if (r < 0.62 && nl) {                          // strung along the underside of a limb, in clusters
        const j = rng.int(0, nl - 1) * 4; const gfv = groveF(limbPts[j], limbPts[j + 2]);
        if (!rng.chance(0.3 + 0.7 * gfv)) continue;
        const cl = 2 + rng.int(0, 5);
        for (let c = 0; c < cl; c++) hooks.push(limbPts[j] + rng.range(-0.9, 0.9), limbPts[j + 1] + rng.range(-0.05, 0.1), limbPts[j + 2] + rng.range(-0.9, 0.9), rng.range(0.56, 0.74), rng(), 0);
        k += cl; continue;
      } else if (r < 0.9) {                          // on twigs just under the leaf roof
        const j = rng.int(iLow0 + 6, NS), ang = rng.range(0, TAU), rr = 38 * Math.sqrt(rng());
        x = sx[j] + Math.cos(ang) * rr; z = sz[j] + Math.sin(ang) * rr; y = ceilY(x, z) + 0.7 - rng.range(0, 1.4);
        if (rho(x, z) > 0.95 || ocDist(x, z) < OC.r + 1 || !rng.chance(0.35 + 0.65 * groveF(x, z))) continue;
      } else {                                       // round the lip of the light well
        const a = rng.range(0, TAU), d = rng.range(-1, 7); x = OC.x + Math.cos(a) * (OC.r + d); z = OC.z + Math.sin(a) * (OC.r + d); y = lipY(x, z, d) - rng.range(0.6, 1.6);
      }
      if (routeDist3(x, y - 0.5, z) < 4.6) continue;
      hooks.push(x, y, z, rng.range(0.56, 0.74), rng(), 0); k++;
    }
    const nb = hooks.length / 6, fans = [];
    for (let i = 0; i < nb; i++) if (rng.chance(0.24)) fans.push(i);
    const g = quadCloud(nb + fans.length, 7, (i, q) => {
      const j = (i < nb ? i : fans[i - nb]) * 6;
      q[0] = hooks[j]; q[1] = hooks[j + 1]; q[2] = hooks[j + 2]; q[3] = hooks[j + 3]; q[4] = hooks[j + 4]; q[5] = i < nb ? 0 : 1; q[6] = 0;
    });
    iattr(g, 'position', 3, 0); iattr(g, 'aH', 4, 3);
    const m = mkMat({
      side: THREE.DoubleSide, uniforms: { uMantle: { value: mantle }, uAmber: { value: amber } },
      vertexShader: /* glsl */`
        attribute vec4 aH;
        uniform vec4 uHall, uWave; uniform vec3 uCam;
        varying vec3 vP; varying vec2 vUv; varying vec2 vK;
        ${GL_FOG_V}
        void main(){
          float sz = aH.x, sd = aH.y, kind = aH.z, time = uHall.z;
          vec3 H = position;
          sz *= smoothstep(uWave.w * .55, uWave.w, length(H - uWave.xyz) + (sd - .5) * uWave.w * .3);      // rare event: the colony lets go
          vec3 toC = vec3(uCam.x - H.x, 0., uCam.z - H.z); toC = toC / max(length(toC), 1e-3);
          vec3 right = vec3(toC.z, 0., -toC.x);
          float ph = time * (1.3 + sd) + sd * 50.;
          float shuffle = smoothstep(.93, 1., sin(time * .35 + sd * 77.));              // now and then one shifts its grip
          float sw = .13 * sin(ph) + .05 * sin(ph * 2.7 + 1.) + .25 * shuffle * sin(time * 9.);
          vec3 dn = normalize(vec3(0., -1., 0.) + right * sw + toC * .08 * cos(ph * .8));
          vec3 P;
          if (kind < .5) P = H + right * uv.x * sz * .3 + dn * (uv.y * .5 + .5) * sz;
          else {
            float side = sd > .5 ? 1. : -1.;
            float open = smoothstep(-.2, .9, sin(time * (.5 + .6 * sd) + sd * 9.)) * (.75 + .25 * sin(time * (5. + 3. * sd)));   // fanning
            P = H + dn * sz * (.22 + (uv.y * .5 + .5) * .9) + right * side * sz * (.12 + (uv.x * .5 + .5) * (.25 + 1.25 * open));
          }
          vP = P; vUv = uv; vK = vec2(kind, sd);
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP; varying vec2 vUv; varying vec2 vK; uniform vec3 uMantle, uAmber;
        ${GL_COMMON}
        ${GL_FOG_F}
        void main(){
          float y = vUv.y * .5 + .5, x = vUv.x;
          vec3 alb; float thru = 0.;
          if (vK.x < .5) {
            float w = mix(.14, 1., smoothstep(0., .34, y)) * (1. - .62 * smoothstep(.72, 1., y));
            if (abs(x) > w) discard;
            float m = smoothstep(.52, .66, y) * (1. - smoothstep(.8, .9, y)) * (1. - smoothstep(.25, .6, abs(x)));
            alb = mix(vec3(.022, .018, .016), uMantle, m);
            alb = mix(alb, vec3(.012), smoothstep(.0, .5, abs(x)) * step(y, .6) * .5);
          } else {
            float sp = x * .5 + .5;
            float trail = .95 - .25 * abs(sin(sp * 7.85)) - .35 * sp;
            if (y > trail || y < .12 * sp) discard;
            float bone = 1. - smoothstep(.02, .06, abs(fract(atan(y - .02, sp + .12) * 2.6) - .5) * .5);
            alb = vec3(.03, .022, .018); thru = 1. - bone;
          }
          float sv = sunVis(vP);
          vec3 lit = hallLight(vP, vec3(0., -.4, 0.) + normalize(vec3(uCam.x - vP.x, 0., uCam.z - vP.z) + 1e-4) * .9, 1.);
          vec3 col = alb * lit * 1.3 + uAmber * uSunCol * sv * (.06 + .55 * thru) + uMantle * uSunCol * sv * .25 * (1. - vK.x);
          col = hallHaze(col, vP);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const hung = new THREE.Mesh(g, m); hung.frustumCulled = false; group.add(hung);
  }
  await ctx.yield();

  // ---- bats on the wing: the stream from the south, the funnel, the pour, and the landers --------------------
  const perches = [];
  const batU = { uPour: { value: 0 }, uBat: { value: new THREE.Vector4(0, 0, OC.x, OC.z) }, uS0: { value: new THREE.Vector3() }, uS1: { value: new THREE.Vector3() }, uMantle: { value: mantle }, uAmber: { value: amber } };
  {
    const rng = xr('wingbats');            // (and so have the bats on the wing)
    const back = new THREE.Vector3(sx[0] - sx[40], 0, sz[0] - sz[40]).normalize();
    batU.uS1.value.set(OC.x, 0, OC.z).addScaledVector(back, 30); batU.uS0.value.set(OC.x, 0, OC.z).addScaledVector(back, 900);
    const landers = [];   // x y z yaw key off seed
    const keys = [0.215, 0.245, 0.3, 0.36, 0.43, 0.5, 0.585, 0.61, 0.635, 0.66, 0.685, 0.71];
    for (let k = 0; k < keys.length; k++) {
      const i = Math.min(NS - 2, Math.round((keys[k] + 0.012) * NS));
      const tx = sx[i + 1] - sx[i], tz = sz[i + 1] - sz[i], tl = Math.hypot(tx, tz) || 1, sd = (k % 2 ? 1 : -1) * rng.range(2.5, 6);
      const x = sx[i] - (tz / tl) * sd, z = sz[i] + (tx / tl) * sd;
      const y = sy[i] < 13 ? Math.max(sy[i] + 5.6, Math.min(ceilY(x, z) - 2.4, sy[i] + 7)) : sy[i] - 3;
      landers.push(x, y, z, Math.atan2(tz, tx) + rng.range(-0.3, 0.3), keys[k], 0, rng());
      perches.push({ u: keys[k], position: new THREE.Vector3(x, y, z) });
    }
    for (let k = 0; k < 38; k++) {
      let x, y, z, yaw;
      if (k < 10) { const a = rng.range(0, TAU); x = OC.x + Math.cos(a) * (OC.r + 2.5); z = OC.z + Math.sin(a) * (OC.r + 2.5); y = ceilY(x, z) - 1; yaw = a + rng.range(-0.5, 0.5); }
      else {
        const j = rng.int(iLow0 + 10, NS), ang = rng.range(0, TAU), rr = rng.range(6, 16);
        x = sx[j] + Math.cos(ang) * rr; z = sz[j] + Math.sin(ang) * rr; y = ceilY(x, z) - 2.3; yaw = rng.range(0, TAU);
        if (routeDist3(x, y - 1.5, z) < 5 || ocDist(x, z) < OC.r + 2) { x += 1e4; }   // parked far away, never seen
      }
      landers.push(x, y, z, yaw, -1, rng(), rng());
    }
    const nLand = landers.length / 7, nFun = Math.round(3000 * detail * density), nStr = Math.round(900 * detail * density);
    const g = quadCloud((nFun + nStr) * 2 + nLand * 5, 10, (i, q) => {
      if (i < (nFun + nStr) * 2) {
        if (i % 2 === 0) { q[0] = rng(); q[1] = rng(); q[2] = rng(); q[3] = rng(); }
        q[4] = q[5] = q[6] = 0; q[7] = 0; q[8] = i % 2 ? 1 : -1; q[9] = i < nFun * 2 ? 0 : 1;
      } else {
        const j = i - (nFun + nStr) * 2, b = Math.floor(j / 5) * 7, part = j % 5;
        q[0] = landers[b]; q[1] = landers[b + 1]; q[2] = landers[b + 2]; q[3] = landers[b + 3]; q[4] = landers[b + 4]; q[5] = landers[b + 5]; q[6] = landers[b + 6];
        q[7] = part === 4 ? 3 : part < 2 ? 1 : 2; q[8] = part === 4 ? 0 : part % 2 ? 1 : -1; q[9] = 2;
      }
    });
    iattr(g, 'position', 3, 0); iattr(g, 'aQ', 4, 3); iattr(g, 'aV', 3, 7);
    const m = mkMat({
      side: THREE.DoubleSide, uniforms: batU,
      vertexShader: /* glsl */`
        attribute vec4 aQ; attribute vec3 aV;
        uniform vec4 uHall, uBat; uniform vec3 uCam, uS0, uS1; uniform float uPour;
        varying vec3 vP; varying vec3 vW;
        ${GL_FOG_V}
        vec3 flyPos(float time, vec3 sd, float sw, float mode, out float vis){
          if (mode < .5) {
            float h0 = fract(sd.x - time * .02 * (.8 + .4 * sw)), hh = h0 * sqrt(sqrt(h0));       // thickest low over the well
            float r = 7. + 30. * pow(hh, .8) + (sd.y - .5) * 9. * (.3 + hh);
            float ang = (floor(sd.z * 3.) / 3. + (fract(sd.z * 3.) - .5) * .2) * 6.2832 - 12. * log(10. + 34. * hh);
            float fy = 11. + 127. * pow(hh, 1.3) + (sw - .5) * 6.;
            vis = smoothstep(0., .03, hh) * (1. - smoothstep(.93, 1., hh)) * (1. - uPour * (1. - smoothstep(26., 46., fy)));
            return vec3(uBat.z + cos(ang) * r, fy, uBat.w + sin(ang) * r);
          }
          float s = fract(sd.x + time * .011 * (.85 + .3 * sw));
          vec3 ax = uS1 - uS0; vec3 perp = vec3(-ax.z, 0., ax.x) / max(length(ax.xz), 1e-3);
          float l = sd.y * 2. - 1.;
          float lat = (l < 0. ? -1. : 1.) * (7. + 80. * l * l) + 3. * sin(s * 40. + sw * 30.);
          vis = smoothstep(0., .03, s) * (1. - smoothstep(.94, 1., s));
          return mix(uS0, uS1, s) + perp * lat + vec3(0., 46. + (sd.z - .5) * 24. + 2.5 * sin(s * 55. + sw * 17.), 0.);
        }
        void main(){
          float part = aV.x, side = aV.y, mode = aV.z, time = uHall.z;
          vec3 F, A, Rl, D; float phi, spread, vis, sd;
          if (mode < 1.5) {
            sd = aQ.x; float v2;
            vec3 p0 = flyPos(time, position, sd, mode, vis), p1 = flyPos(time + .12, position, sd, mode, v2);
            vec3 d = p1 - p0; A = d / max(length(d), 1e-4);
            F = p0 - A * .28;
            float fl = sin(time * (15. + 3. * sd) + sd * 100.);
            float glide = smoothstep(.6, .9, sin(time * .7 + sd * 31.));
            phi = .12 + .78 * fl * (1. - .8 * glide); spread = 1.;
            Rl = vec3(-A.z, 0., A.x); Rl = Rl / max(length(Rl), 1e-3);
          } else {
            sd = aQ.w;
            float p = aQ.y < 0. ? fract(time / (10. + 6. * sd) + aQ.z)
                    : mix(fract(time / 9. + sd), clamp(.46 + (uBat.x - aQ.y) / .16, 0., .86), uBat.y);
            vec3 a = vec3(cos(aQ.x), 0., sin(aQ.x)), up = vec3(0., 1., 0.), Hk = position;
            Rl = vec3(-a.z, 0., a.x);
            float f = clamp(p / .4, 0., 1.), g = smoothstep(.4, .52, p), h = clamp((p - .52) / .36, 0., 1.), dp = clamp((p - .88) / .12, 0., 1.);
            vec3 Q = Hk - up * 1.25 - a;
            F = Q - a * 42. * (1. - f) - up * 2.5 * (1. - f) * (1. - f);
            F = mix(F, Hk, g) + a * sin(3.1416 * g) * .7 - up * sin(3.1416 * g) * .3;
            F += -up * 1.6 * sin(1.5708 * dp) + a * 40. * dp * dp;
            float th = 4.7124 * g + .6 * exp(-5. * h) * sin(h * 26.) * step(.52, p) + 1.5708 * smoothstep(0., .5, dp);
            A = a * cos(th) + up * sin(th);
            float wfly = clamp(1. - smoothstep(0., .25, h) + smoothstep(0., .3, dp), 0., 1.);
            float fl = sin(time * 16. + sd * 40.);
            phi = mix(-1.3, .15 + .7 * fl * (1. - .6 * g) + .6 * sin(3.1416 * g), wfly);
            spread = mix(.14, 1., wfly);
            vis = smoothstep(0., .03, p) * (1. - smoothstep(.5, 1., dp));
          }
          D = cross(Rl, A);
          vec3 Fc = F + A * .28, P;
          if (part > 2.5) {
            vec3 toC = uCam - Fc; vec3 wd = cross(A, toC); wd = wd / max(length(wd), 1e-4);
            P = F + A * (uv.y * .5 + .5) * .46 + wd * uv.x * .11;
            vW = vec3(uv.x, uv.y, 3.);
          } else {
            float s01 = uv.x * .5 + .5;
            float sp = part < .5 ? s01 : part < 1.5 ? s01 * .5 : .5 + s01 * .5;
            float ph2 = phi * (1. + .5 * sp);
            vec3 arm = Rl * side * cos(ph2) + D * sin(ph2);
            P = F + A * (.3 - uv.y * .2 * (.45 + .55 * spread) - .1 * sp * spread) + arm * sp * .66 * spread;
            vW = vec3(sp, uv.y, 0.);
          }
          float dc = length(uCam - Fc);
          float fk = step(.5, mode);
          P = Fc + (P - Fc) * vis * clamp(dc / mix(92., 170., fk), 1., mix(3.6, 2.6, fk)) * smoothstep(5., 11., dc);      // none so near that the frame's edge cuts it
          vP = P;
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vP; varying vec3 vW; uniform vec3 uMantle, uAmber;
        ${GL_COMMON}
        ${GL_FOG_F}
        void main(){
          float sp = vW.x, c = vW.y, bone = 0.; vec3 alb = vec3(.024, .019, .017);
          if (vW.z > 2.5) {
            float y = clamp(c * .5 + .5, 0., 1.);
            if (abs(sp) > .25 + .75 * sqrt(max(sin(3.1416 * y), 0.))) discard;
            alb = mix(alb, uMantle, smoothstep(.5, .66, y) * (1. - smoothstep(.84, .95, y)));
            bone = 1.;
          } else {
            float lead = -.9 + .55 * abs(sp - .42);
            float trail = .8 - .5 * sp - .24 * abs(sin(sp * 7.854));
            if (c < lead || c > trail || sp > .985) discard;
            float armB = 1. - smoothstep(.02, .16, c - lead);
            float ang = atan(c + .62, sp - .42 + 1e-4);
            float fing = (1. - smoothstep(.03, .1, abs(fract(ang * 1.9 + .25) - .5))) * step(.42, sp);
            float body = 1. - smoothstep(.04, .16, sp);
            bone = max(max(armB, fing), body);
            alb = mix(alb, uMantle, body * (1. - smoothstep(-.5, .1, c)) * .8);
          }
          vec3 v = vP - uCam; vec3 vd = v / max(length(v), 1e-3);
          float above = smoothstep(15., 24., vP.y);
          float sv = mix(sunVis(vP), 1., above);
          // dark wings, chestnut mantle; only a wing between us and the sun glows amber, its bones dark in it
          float th = max(dot(vd, uSunDir), 0.); th *= th; th *= th;
          float webv = .65 + .5 * vnoise(vec2(sp * 14., c * 9.));
          vec3 col = alb * (uSkyAmb * .7 + uShade * .7 + uSunCol * sv * .45);
          col += uAmber * uSunCol * sv * (1. - bone) * webv * (.012 + .018 * (1. - above) + .55 * th);
          col = mix(hallHaze(col, vP), col, above);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }`,
    });
    const bats = new THREE.Mesh(g, m); bats.frustumCulled = false; group.add(bats);
  }
  // from far off the funnel is one dark turning column: a soft swarm-grained sleeve round the bats, gone by the time we reach it
  {
    const NR = 13, NSG = 28, pos = new Float32Array((NR + 1) * (NSG + 1) * 3), aH = new Float32Array((NR + 1) * (NSG + 1) * 3), idx = [];
    for (let i = 0; i <= NR; i++) for (let j = 0; j <= NSG; j++) {
      const hh = i / NR, a = (j / NSG) * TAU, r = 8.5 + 30 * Math.pow(hh, 0.8) + 3.5 * hh, o = (i * (NSG + 1) + j) * 3;
      pos[o] = OC.x + Math.cos(a) * r; pos[o + 1] = 9 + 129 * Math.pow(hh, 1.3); pos[o + 2] = OC.z + Math.sin(a) * r;
      aH[o] = Math.cos(a); aH[o + 1] = hh; aH[o + 2] = Math.sin(a);
      if (i < NR && j < NSG) { const q = i * (NSG + 1) + j; idx.push(q, q + 1, q + NSG + 2, q, q + NSG + 2, q + NSG + 1); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aH', new THREE.BufferAttribute(aH, 3)); g.setIndex(idx);
    const m = mkMat({
      fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec3 aH; varying vec3 vP, vH;
        void main(){ vP = position; vH = aH; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: /* glsl */`
        varying vec3 vP, vH;
        ${GL_COMMON}
        void main(){
          vec3 v = vP - uCam; float d = length(v), t = uHall.z;
          vec2 vh = v.xz / max(length(v.xz), 1e-3);
          float face = abs(dot(vec2(vH.x, vH.z), vh));                                   // deep through the middle, nothing at the outline
          float n = vnoise(vP.xz * .3 + vec2(t * .45, vP.y * .17)) * .55 + vnoise(vec2(vP.x * .95 - t * .8, vP.y * .7 + vP.z * .95)) * .45;
          float wisp = vnoise(vec2(vP.y * .045 - t * .05, vP.x * .03 + vP.z * .03));
          float a = face * face * (.3 + .7 * smoothstep(.36, .66, n)) * (.55 + .45 * wisp) * smoothstep(0., .05, vH.y) * (1. - smoothstep(.42, .98, vH.y)) * smoothstep(75., 200., d);
          gl_FragColor = vec4(vec3(.03, .026, .024) * (uSkyAmb + uShade), a * .56);
        }`,
    });
    const sleeve = new THREE.Mesh(g, m); sleeve.frustumCulled = false; sleeve.renderOrder = 4; group.add(sleeve);
  }
  await ctx.yield();

  // ---- anchors -----------------------------------------------------------------------------------------
  const P3 = (u) => path.pointAt(u), V = (x, y, z) => new THREE.Vector3(x, y, z);
  const look = (u, du = 0.04) => ({ position: P3(u), target: P3(Math.min(1, u + du)) });
  // how much sun reaches a point under the roof (0..1): the point slid along the sun to roof height, against every gap
  // in the leaves (the same gaps the mask was painted from) and the well
  function litAt(x, y, z) {
    const sl = Math.max(0, ROOF - y) / Math.max(1e-3, sunDir.y / Math.max(1e-3, Math.hypot(sunDir.x, sunDir.z))), qx = x + sunH.x * sl, qz = z + sunH.z * sl;
    if (ocDist(qx, qz) < OC.r) return 1;
    let best = 0;
    for (let k = 0; k < shafts.length; k++) {
      const g = shafts[k], dx = qx - g.gx, dz = qz - g.gz, r = Math.hypot((dx * sunH.x + dz * sunH.z) / Math.max(g.b, 1.3), (dz * sunH.x - dx * sunH.z) / Math.max(g.a, 1.3));
      if (r < 1) best = Math.max(best, Math.min(1, g.I) * (1 - smoothstep(0.62, 1, r)));
    }
    return best;
  }
  const anchors = {
    flyThrough: route,
    portalSeat: { position: seat.clone(), facing: avD.clone().multiplyScalar(-1) },
    oculus: { center: V(OC.x, 27, OC.z), radius: OC.r, rimY: 27 },
    courtyard: { center: V(OC.x, 0.2, OC.z), radius: OC.r },
    funnelTop: V(OC.x, 138, OC.z),
    stream: { from: batU.uS0.value.clone(), to: batU.uS1.value.clone() },
    sunDir: sunDir.clone(), sunColor: sunCol.clone(),
    grove: V(grove.x, 8, grove.z),
    bounds: { rx: RX, rz: RZ, height: 32, ceiling: [13, 20] },
    viewpoints: {
      entry: { position: P3(0), target: V(OC.x, 30, OC.z) }, dive: look(0.22), firstHall: look(0.33), nave: look(0.65),
      column: { position: P3(0.78), target: V(OC.x, 10, OC.z) }, avenue: { position: P3(0.9), target: seat.clone() },
    },
    stations, perches, bough, saplings, feats, limbUnder: limbPts, litAt,
    giants: GIANTS.map((G, i) => ({ x: G.x, z: G.z, r: G.R, top: Math.min(ceilY(G.x, G.z) + 1.6, domeY(G.x, G.z) - 0.8), mouth: i === 1 ? motherA : null })),
    pool: { a: V(POOL.ax, POOL.y, POOL.az), b: V(POOL.bx, POOL.y, POOL.bz), w: POOL.w, y: POOL.y },
    pillars: pillars.filter((q) => q.d < 60).map((q) => ({ x: q.x, z: q.z, r: q.r * (q.col ? 2 : 1.6) })),
    columns: nearCols.map((p) => ({ x: p.x, z: p.z, r: p.r, top: p.top, pole: !!p.pole, d: p.d ?? 14, ghost: !!p.ghost })),
    archFeet: [-1, 1].map((sd) => new THREE.Vector3(seat.x + avL.x * sd * 9.9, 0, seat.z + avL.z * sd * 9.9)),
    pois: [{ at: V(OC.x, 26, OC.z), from: 0.05, to: 0.2, weight: 0.4 }, { at: V(OC.x, 9, OC.z), from: 0.74, to: 0.84, weight: 0.35 }],
  };

  // viewer framing (the true size is anchors.bounds): the orbit of tools/shot.mjs _part sits inside the hall
  const hv = opts.view || 'hall';
  const frames = {
    hall: [V(-60, 4, -62), 20, 6], nave: [V(grove.x, 6, grove.z), 9, 5], dome: [V(OC.x, 22, OC.z), 110, 90], well: [V(OC.x, 8, OC.z), 10, 44],
    arch: [V(seat.x - avD.x * 22, 6.5, seat.z - avD.z * 22), 9, 4], column: [V(OC.x, 5, OC.z), 45, 4], mix: [V(OC.x, 14, OC.z), 45, 60],
  };
  const fr = frames[hv] || frames.hall;

  // ---- per-frame --------------------------------------------------------------------------------------------
  const inv = new THREE.Matrix4(), camL = new THREE.Vector3(), camD = new THREE.Vector3(), buf = new THREE.Vector2();
  let progress = 0, progressOn = 0, hazeIn = 1, wake = 1, colVis = 1, first = true;
  // where each piece of the middle hall lies (the middle and reach of its own mesh)
  const midSeen = stage.mid.map((m) => { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); const b = m.geometry.boundingSphere; return { m, x: b.center.x, z: b.center.z, r: b.radius }; });
  const show = (list, v) => { for (let i = 0; i < list.length; i++) list[i].visible = v; };
  function update(dt, time, camera) {
    U.uHall.value.z = time;
    if (camera) {
      group.updateWorldMatrix(true, false); inv.copy(group.matrixWorld).invert();
      camL.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(inv);
      const e = camera.matrixWorld.elements; camD.set(-e[8], -e[9], -e[10]).transformDirection(inv);
      U.uCam.value.copy(camL); U.uCamDir.value.copy(camD);
      const inside = (1 - smoothstep(0.97, 1.03, rho(camL.x, camL.z))) * (1 - smoothstep(19, 27, camL.y));
      hazeIn = lerp(0.32, lerp(1, 0.5, smoothstep(8, 18, camL.y)), inside);
      colVis = lerp(1, 0.3, 1 - smoothstep(OC.r - 2, OC.r + 6, ocDist(camL.x, camL.z))) * (1 - 0.96 * smoothstep(15, 25, camL.y));
      U.uMist.value.w = 1 - 0.8 * smoothstep(33, 50, camL.y) * smoothstep(96, 150, ocDist(camL.x, camL.z));        // from far off the well is a dark hole; the eye opens as we come up to it
      U.uOutK.value = rho(camL.x, camL.z) > 1 || camL.y > 21 ? 1 : 0;
      LUo.uGust.value.z = camL.x * LUo.uGust.value.x + camL.z * LUo.uGust.value.y + 66 + 9 * Math.sin(time * 0.3);
      ctx.renderer?.getDrawingBufferSize?.(buf);
      U.uPx.value = (buf.y || 720) * 0.5 * camera.projectionMatrix.elements[5];
    }
    U.uHall.value.y = hazeBase * hazeMul * hazeIn;
    U.uStage.value.x = smoothstep(16, 26, camL.y);
    U.uStage.value.w = (1 - smoothstep(OC.r + 4, OC.r + 18, ocDist(camL.x, camL.z))) * (1 - smoothstep(13, 21, camL.y));
    {
      // what is drawn from where the lens is (whole meshes; nothing is made or compiled). Each rule sets the place of the
      // thing against the place of the lens, so it is the same in every camera and on any route:
      //   the far crown            from higher than the lip of the well (27 m), or from the plain outside the tree: from
      //                            inside the well below its lip the lip's own leaves stand in front of it
      //   the dome's skin, the lip the same, and from under the roof within 200 m of the well (seen through it)
      //   the hall's floor cover   from under the roof, or from inside the well below its lip (from over the lip the
      //                            floor under the far eave is 60 m off and more, in the eave's shade)
      //   the pool's mirror        from under the roof within 125 m of the water
      //   the middle hall's pieces from under the roof within 160 m of each (the hall's haze has closed by then)
      const on = !progressOn, under = camL.y < 21, outside = rho(camL.x, camL.z) > 0.97, dOc = ocDist(camL.x, camL.z);
      const overLip = camL.y > 27, hallOn = on || under || (dOc < OC.r + 3 && !overLip);
      show(stage.outer, on || overLip || outside);
      show(stage.court, on || !under || outside || dOc < 200);
      show(stage.hall, hallOn);
      {
        const bx = POOL.bx - POOL.ax, bz = POOL.bz - POOL.az, h = clamp(((camL.x - POOL.ax) * bx + (camL.z - POOL.az) * bz) / (bx * bx + bz * bz), 0, 1);
        show(stage.pool, on || (under && Math.hypot(camL.x - POOL.ax - bx * h, camL.z - POOL.az - bz * h) < 125));
      }
      for (let i = 0; i < midSeen.length; i++) { const q = midSeen[i]; q.m.visible = on || (under && Math.hypot(camL.x - q.x, camL.z - q.z) < q.r + 160); }
      for (let i = 0; i < braids.length; i++) { const b = braids[i]; if (b.mesh) b.mesh.visible = on || (hallOn && Math.hypot(camL.x - b.x, camL.z - b.z) < b.r + 85); }
      // the scattered foot of the bat funnel is not drawn while the lens is itself inside it (in the well's own column of
      // air, between the saplings and the funnel's waist): the pour is then the stream that passes us
      batU.uPour.value = progressOn * (1 - smoothstep(43, 59, dOc)) * smoothstep(5, 9, camL.y) * (1 - smoothstep(40, 50, camL.y));
    }
    columnMat.uniforms.uColI.value = colVis;
    U.uWake.value = wake * (camL.y < 11 ? 1 : 0);
    batU.uBat.value.x = progress; batU.uBat.value.y = progressOn;
  }
  let hazeMul = 1;
  update(0, 0, null);

  return {
    object: group,
    radius: fr[1], height: fr[2], center: fr[0],
    anchors,
    update,
    setProgress(u) { progress = u; progressOn = 1; },
    setHaze(color, mul = 1) { if (color) hazeCol.set(color); hazeMul = mul; },
    setWake(s) { wake = s; },
    setWave(x, y, z, r) { U.uWave.value.set(x, y, z, Math.max(0.001, r)); },
    // for the world's own creatures: the hall's light (GL_COMMON + uniforms), material factory, lofting tools, ground and roof
    shared: { GL_COMMON, GL_FOG_V, GL_FOG_F, U, mkMat, Store, loft, floorY, ceilY, domeY, rho, ocDist, poolIn, hour, season, weather, ROOF },
    stats: { pillars: pillars.length, near: cnt[0], mid: cnt[1], far: cnt[2], shafts: shafts.length },
    dispose() { maskTex.dispose(); },
    ground: true, groundY: -0.25,
  };
}
