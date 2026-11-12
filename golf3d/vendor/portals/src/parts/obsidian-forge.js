// THE FOUNTAIN: hero set piece for the world "obsidian-forge".
//
// A summit vent throwing a 300 m lava fountain that falls back as a glowing curtain; in front of it
// the last basalt terrace with an 80 m wide lava fall pouring into a plunge pool; and between pool
// and camera a natural basalt bridge 100 m long spanning the molten river, with columns hanging
// beneath it like organ pipes. Hexagonal column walls line the gorge and the terrace face, column
// stacks and obsidian sail-blades stand on the banks, an ash plume glows red from beneath.
//
// SPACE     origin = river surface under the centre of the bridge arch, +Y up, front = +Z.
//           The camera comes UP the river travelling toward -Z; lava flows toward +Z.
//           z = +300 river stub end (join your river) .. 0 bridge .. -90 lava fall / terrace face
//           (terrace top y = 46) .. -430 vent cone (vent y ~ 155, fountain top y ~ 455).
// SIZE      radius ~300 m (x -330..330, z -760..+300), height ~460 m with the fountain.
//           The lump the cone stands on tapers to y ~ 3 at its sides and back: bury it in the volcano flank.
// COST      ~125-133k triangles (seed dependent), 10 draw calls, no lights, no textures, no render targets.
//           uniforms.falls: two vec4 (x, z of a lip, half width, on) the world sets for its own lava falls; the river churns below them.
//           Build ~200 ms of CPU (yields between steps).
// LIGHT     Self-lit. All rock uses one custom shader lit by analytic lava emitters (river, pool, fall,
//           upper river, fountain: orange up-light), a cold moon rim (opts.moonDir, local space, toward
//           the moon; default above-right) and a dim violet/maroon hemisphere. It ignores scene lights,
//           so it looks right in a black scene; add your own lights only for kit objects around it
//           (anchors.emitters lists position/colour/intensity suggestions). Wants a night sky, dark
//           maroon fog and bloom (lava/fountain emissive 2-8). All shaders honour scene fog.
//
// OPTS      palette   7 hex strings in brief order: sky, violet-maroon, maroon, basalt, lava orange,
//                     hot yellow, moon/gas blue
//           moonDir   [x,y,z] or Vector3, local space, toward the moon (default 0.62, 0.66, 0.42)
//           moon      0..2 moon rim gain (default 1);  glow 0..2 lava light gain on rock (default 1)
//           plume     false to leave out the ash plume (if you add kit smoke columns instead)
//           emitters  extra lava light sources for rock, [[ax,ay,az, bx,by,bz, radius, intensity, wrap, hot], ...] or
//                     (layout) => that list; columns (add, layout) => void stands more hex columns in the hero's
//                     draw call; bladeSpots (layout) => [[x, groundY, z, height], ...] stands more obsidian blades.
//                     The returned hero also carries materials { terrain, river }, glsl, lightUniforms(), layout.
//           blades    false to leave out the obsidian blades
//
// PROGRESS  hero.setProgress(u) with the world's path u: the fountain surges (brighter, denser, a
//           second pulse of bombs) from u = 0.72 to the exit so it peaks as the camera lines up on the
//           portal. Never called = steady medium fountain. hero.uniforms exposes { time, surge, ... }.
//
// ANCHORS   (local space)
//           portalSeat   { position, facing, radius }: centre of the 14 m portal hanging under the
//                        arch (y 11, >= 6 m to the pipes above and the gorge walls), facing +Z.
//           flyThrough   ordered Vector3 list: safe camera line from the river stub up the river
//                        to the portal; >= 8 m from every solid, last 130 m straight and level.
//           viewpoints   { far, mid, close, deck }: good camera positions.
//           lookAt       where to gaze from the river (fall + fountain axis).
//           archApex, bridgeDeck, fallLip, fallFoot, poolCenter, poolRadius, vent, fountainTop,
//           terraceY, coneCenter, coneRadius, plumeBase
//           riverStart   { position, direction, width }: downstream end of the hero's river stub.
//           banks        { left, right }: flat-ish bank spots for Slag-walkers / ember-moth columns.
//           emitters     [{ position, color, intensity, radius }] lava light sources for your own lights.
//           moonDirDefault
import * as THREE from 'three';
import { clamp, lerp, smoothstep as sst } from '../kit/core.js';

const DEFAULT_PALETTE = ['#07040a', '#2a0f1e', '#5a1a1a', '#12101a', '#ff5a1f', '#ffc21a', '#7fe0ff'];
const GRAV = 9.81, HT = 46, ZT = -90, CZ = -430, CRAD = 300, RC = 30;

const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 h22(vec2 p){ float n = h21(p); return vec2(n, h21(p + n * 37.1 + 11.7)); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
float fb(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * vn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
// cellular: x = F1, y = F2 - F1 (0 on cell borders)
vec2 voro(vec2 p){ vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { vec2 g = vec2(float(x), float(y)); vec2 r = g + h22(i + g) - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
  d1 = sqrt(d1); return vec2(d1, sqrt(d2) - d1); }
// black crust -> deep red -> orange -> yellow-white, linear HDR
vec3 lavaRamp(float h){
  vec3 c = mix(vec3(0.012, 0.006, 0.008), vec3(0.55, 0.015, 0.0), smoothstep(0.08, 0.34, h));
  c = mix(c, uLavaCol * 2.3, smoothstep(0.3, 0.6, h));
  c = mix(c, uHotCol * 3.4, smoothstep(0.6, 0.88, h));
  return mix(c, vec3(5.5, 3.9, 1.6), smoothstep(0.9, 1.0, h)); }
`;
const GLSL_FOG_FADE = /* glsl */`
float fogFade(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      return 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 1.0;
  #endif
}`;
// rock lighting: analytic capsule emitters (lava), moon rim, hemisphere. Everything in hero-local space.
const mkLight = (NE) => /* glsl */`
uniform vec3 uEA[${NE}]; uniform vec3 uEB[${NE}]; uniform vec4 uEP[${NE}];
uniform vec3 uMoonDir, uMoonCol, uAmbLo, uAmbHi, uLavaCol, uHotCol; uniform float uGlow;
float gLava = 1.0, gMoonSpec = 1.0;      // set before calling forgeShade: lava-light gain, moon-glint gain
vec3 forgeShade(vec3 P, vec3 N, vec3 V, vec3 alb, float gloss, float ao){
  vec3 E = vec3(0.0), S = vec3(0.0);
  for (int i = 0; i < ${NE}; i++) {
    vec3 ab = uEB[i] - uEA[i]; float t = clamp(dot(P - uEA[i], ab) / max(dot(ab, ab), 1e-4), 0.0, 1.0);
    vec3 L = uEA[i] + ab * t - P; float d2 = dot(L, L), q2 = d2 / (uEP[i].x * uEP[i].x);
    if (q2 > 64.0) continue;                                   // out of reach: skip (the falloff is windowed to zero there)
    float d = sqrt(d2); L /= max(d, 1e-3);
    float w = uEP[i].z, nl = dot(N, L), ndl = max((nl + w) / (1.0 + w), 0.0);
    float at = uGlow * uEP[i].y / (1.0 + q2) * smoothstep(64.0, 30.0, q2);
    vec3 c = mix(uLavaCol, uHotCol, uEP[i].w);
    E += c * at * ndl * gLava;
    S += c * at * pow(max(dot(N, normalize(L + V)), 0.0), mix(8.0, 90.0, gloss)) * gloss * 0.09 * smoothstep(-0.1, 0.2, nl) * gLava;
  }
  float mn = dot(N, uMoonDir);
  E += uMoonCol * max(mn, 0.0);
  S += uMoonCol * pow(max(dot(N, normalize(uMoonDir + V)), 0.0), mix(24.0, 220.0, gloss)) * gloss * 0.8 * smoothstep(-0.1, 0.2, mn) * gMoonSpec;
  E += mix(uAmbLo, uAmbHi, N.y * 0.5 + 0.5);
  return (alb * E + S) * ao;
}`;
const VERT_HEAD = /* glsl */`
uniform mat4 uInv;
varying vec3 vP; varying vec3 vN; varying vec3 vCam;
#include <fog_pars_vertex>
`;
const VERT_TAIL = /* glsl */`
  vP = P; vN = N; vCam = (uInv * vec4(cameraPosition, 1.0)).xyz;
  vec4 mvPosition = modelViewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
`;

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('obsidian-forge-hero');
  const noise = ctx.core.makeNoise(Math.floor(rng() * 1e9));
  // a generator for one thing the world hands over (a pipe, a stub, a sail), made from the seed and the thing's own place (to 2 cm):
  // what it deals depends neither on how many others stand nor on their order
  const placeRng = (kind, x, z) => ctx.core.makeRng(ctx.core.hashSeed(kind + ':' + ctx.seed + ':' + Math.round(x * 50) + ':' + Math.round(z * 50)));
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const DETAIL = clamp((ctx.quality && ctx.quality.detail) || 1, 0.5, 1);
  const root = new THREE.Group(); root.name = 'obsidian-forge-hero';

  // ---------- per-seed character ----------
  const S = {
    meander: rng.sign() * rng.range(22, 46),            // river stub bends left or right beyond z = 140
    uMeander: rng.range(-1, 1) * 26, uPhase: rng.range(0, 6.28),
    wing: rng.range(55, 85),                             // how far the terrace wings curl forward
    sag: rng.range(-1.2, 1.2), deck: rng.range(37.5, 40.5), lean: rng.range(-0.5, 0.5),   // bridge
    coneH: rng.range(138, 158), coneSkew: rng.range(0, 6.28),
    fountH: rng.range(285, 320), spread: rng.range(0.13, 0.19), tilt: rng.range(-0.035, 0.035),
    wind: rng.range(-0.9, 0.9),                          // plume / ember drift (radians off +X..)
    fallGaps: rng.int(1, 3), heatHue: rng.range(-0.035, 0.03),
    streams: rng.int(3, 5),
  };
  const lavaCol = pal[4].clone().offsetHSL(S.heatHue, 0, 0), hotCol = pal[5].clone().offsetHSL(S.heatHue * 0.5, 0, 0);

  // ---------- layout functions (local metres) ----------
  const rx = (z) => (z > 140 ? S.meander * ((z - 140) / 160) ** 2 : 0);          // lower river centre line
  const hw = (z) => 15 + 30 * sst(-35, -76, z) + 3 * sst(150, 300, z);            // lower river half width
  const cliffZ = (x) => ZT + S.wing * Math.pow(sst(50, 285, Math.abs(x)), 1.2);   // terrace face line
  const urx = (z) => S.uMeander * Math.sin((z - ZT) * 0.021 + S.uPhase) * sst(ZT - 6, ZT - 70, z) * sst(CZ + 40, CZ + 130, z);
  const uw = (z) => lerp(40, 7, Math.pow(sst(ZT, ZT - 110, z), 0.7));              // upper river half width
  const wallH = (z) => (z >= 0 ? 5 + 25 * Math.exp(-((z / 72) ** 2)) : lerp(30, HT, sst(-15, -80, z)));
  const rimH = S.coneH * Math.pow(1 - RC / CRAD, 1.75);
  function coneH(x, z) {
    const dx = x, dz = z - CZ, th = Math.atan2(dx, dz);
    const rho = Math.hypot(dx, dz) * (1 + 0.1 * Math.cos(th - S.coneSkew));
    const t = clamp(1 - Math.max(rho, RC) / CRAD, 0, 1);
    if (t <= 0) return 0;
    let h = S.coneH * Math.pow(t, 1.75);
    const flank = t * (1 - t) * 4;
    h += flank * 9 * noise.fbm3(Math.cos(th) * 3.2, Math.sin(th) * 3.2, rho * 0.004, 3);
    h += flank * 2.5 * noise.fbm2(x * 0.03, z * 0.03, 3);
    h += 5 * Math.exp(-(((rho - RC * 1.1) / 9) ** 2));                              // rim lip
    h -= 17 * sst(RC, RC * 0.4, rho);                                               // crater
    h -= 15 * Math.exp(-((th / 0.3) ** 2)) * sst(RC * 2.6, RC * 0.9, rho) * sst(0, RC * 0.7, rho);   // breach toward +Z
    return h;
  }
  function groundH(x, z) {
    const rho = Math.hypot(x, z - CZ);
    const e = 1 - sst(240, 325, z < CZ ? rho : Math.abs(x));
    const n1 = noise.fbm2(x * 0.012 + 7.3, z * 0.012 - 3.1, 4), n2 = noise.fbm2(x * 0.07, z * 0.07, 3);
    const zc = cliffZ(x), k = sst(zc + 2.5, zc - 2.5, z);
    let low = 0, up = 0;
    if (k < 1) {
      const d = Math.abs(x - rx(z)) - hw(z);
      const W = 3 + n1 * 2.2 + n2 * 0.7 + (wallH(z) - 3) * (1 - 0.84 * sst(30, 125, d));
      const sb = sst(8, 14, wallH(z));
      low = lerp(-4, W, Math.pow(sst(-3 + 5 * sb, 9 + 8 * sb, d), 0.8 + 0.4 * sb));
      if (d > -2 && d < 34) low += ((noise.ridged2(x * 0.105 + 9, z * 0.05, 2) - 0.42) * 2.6 * sst(-1.5, 3.5, d) * (1 - sst(12, 34, d))
        + Math.round(noise.n2(x * 0.06 + 31, z * 0.035) * 2) * 0.45 * sst(0, 5, d) * (1 - sst(16, 34, d))) * (1 - 0.75 * sb);
    }
    if (k > 0) {
      const du = Math.abs(x - urx(z)) - uw(z);
      up = 3 + (HT - 3 + n1 * 3.5) * e + n2 * 0.8 - 1.8 * (1 - sst(-3, 3, du)) * sst(CZ + 20, CZ + 60, z) + coneH(x, z) * e;
    }
    return lerp(low, up, k);
  }
  const VENT = V3(0, groundH(0, CZ) + 1.5, CZ);
  const FTOP = VENT.y + S.fountH;

  // ---------- shared uniforms ----------
  const moonDir = (opts.moonDir ? (opts.moonDir.isVector3 ? opts.moonDir.clone() : V3(...opts.moonDir)) : V3(0.62, 0.66, 0.42)).normalize();
  const EA = [], EB = [], EP = [];
  const emit = (a, b, R, I, wrap, hot) => { EA.push(a); EB.push(b); EP.push(new THREE.Vector4(R, I, wrap, hot)); };
  emit(V3(rx(300), 0, 300), V3(rx(170), 0, 170), 20, 5.2, 0.3, 0.3);               // river, far stub (its banks stand right above the first fall: kept dimmer than that fall's own blaze)
  emit(V3(rx(170), 0, 170), V3(0, 0, 45), 20, 8, 0.3, 0.3);                        // river approach
  emit(V3(0, 0, 45), V3(0, 0, -40), 22, 9, 0.6, 0.32);                             // river under the bridge
  emit(V3(-26, 0.5, -64), V3(26, 0.5, -64), 30, 11, 0.3, 0.4);                     // plunge pool
  emit(V3(-34, 24, ZT + 5), V3(34, 24, ZT + 5), 32, 9.5, 0.35, 0.5);              // the fall
  emit(V3(0, HT, ZT - 14), V3(urx(-200), HT + 6, -230), 34, 6, 0.3, 0.35);          // upper river
  emit(V3(0, VENT.y + 12, CZ), V3(0, VENT.y + S.fountH * 0.72, CZ), 230, 6.5, 0.4, 0.6);   // the fountain
  // extra emitters from the world (its own lava downstream): [ax,ay,az, bx,by,bz, radius, intensity, wrap, hot]
  const hookLayout = { rx, hw, cliffZ, groundH, meander: S.meander };
  await ctx.yield();
  for (const e of (typeof opts.emitters === 'function' ? opts.emitters(hookLayout) : opts.emitters) || []) emit(V3(e[0], e[1], e[2]), V3(e[3], e[4], e[5]), e[6], e[7], e[8] ?? 0.3, e[9] ?? 0.3);
  const GLSL_LIGHT = mkLight(EA.length);
  const baseI = EP.map((p) => p.y);
  const U = {
    time: { value: 0 }, surge: { value: 0.35 }, inv: { value: new THREE.Matrix4() },
    EA: { value: EA }, EB: { value: EB }, EP: { value: EP },
    moonDir: { value: moonDir }, moonCol: { value: pal[6].clone().lerp(new THREE.Color('#ffffff'), 0.25).multiplyScalar(0.85 * (opts.moon ?? 1)) },
    ambLo: { value: pal[2].clone().multiplyScalar(0.3) }, ambHi: { value: pal[1].clone().lerp(pal[6], 0.2).multiplyScalar(0.35) },
    lavaCol: { value: lavaCol }, hotCol: { value: hotCol }, glow: { value: opts.glow ?? 1 },
    vent: { value: VENT.clone() }, fountH: { value: S.fountH }, shield: { value: new THREE.Vector4(0, -1700, 0, 0) },
    falls: { value: [new THREE.Vector4(0, 9999, 0, 0), new THREE.Vector4(0, 9999, 0, 0)] },      // the world's own falls: x, z of the lip, half width, on
  };
  const shared = {};
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const lightU = () => ({ ...fogU(), uInv: U.inv, uEA: U.EA, uEB: U.EB, uEP: U.EP, uMoonDir: U.moonDir, uMoonCol: U.moonCol,
    uAmbLo: U.ambLo, uAmbHi: U.ambHi, uLavaCol: U.lavaCol, uHotCol: U.hotCol, uGlow: U.glow, uTime: U.time });
  const rockTint = [pal[3].clone().multiplyScalar(6.5), pal[3].clone().lerp(pal[1], 0.4).multiplyScalar(5.5), pal[2].clone().multiplyScalar(0.55)];
  await ctx.yield();

  // ---------- terrain: gorge, banks, terrace (grid) + vent cone (polar), one mesh ----------
  const lavaFlowGLSL = /* glsl */`
  // x: the heat of the crust (seams, thin skin over the hot reaches); y: the seams between the plates alone, 1 down the middle of a seam
  vec2 lavaCells(vec2 p){
    vec2 w = vec2(vn(p * 0.33), vn(p * 0.33 + 7.7)) * 0.7 + vec2(vn(p * 0.8 + 3.0), vn(p * 0.8 + 11.0)) * 0.3;
    vec2 v = voro(p * 0.17 + w * 1.3);
    float crack = pow(smoothstep(0.27, 0.0, v.y), 1.7);
    float hz = smoothstep(0.46, 0.8, vn(p * 0.075 + 1.7) * 0.65 + vn(p * 0.19) * 0.35);
    float thin = hz * (0.1 + 0.3 * vn(p * 0.7 + 3.1)) * smoothstep(0.75, 0.2, v.x);
    return vec2(clamp(crack * (0.46 + 0.4 * hz) + thin + 0.03, 0.0, 1.0), crack); }
  // two-phase advection along +y of p so the pattern flows forever without stretching
  vec2 lavaFlow2(vec2 p, float t, float sp){
    float a = fract(t * 0.045), b = fract(t * 0.045 + 0.5);
    vec2 ha = lavaCells(p - vec2(0.0, sp * 22.0 * (a - 0.5)));
    vec2 hb = lavaCells(p + 31.7 - vec2(0.0, sp * 22.0 * (b - 0.5)));
    return mix(hb, ha, 1.0 - abs(2.0 * a - 1.0)); }
  float lavaFlow(vec2 p, float t, float sp){ return lavaFlow2(p, t, sp).x; }`;
  {
    const NX = 120, NZ = 130, xs = [], zs = [];
    for (let i = 0; i <= NX; i++) { const t = (i / NX) * 2 - 1; xs.push(330 * (0.22 * t + 0.78 * t * t * t)); }
    for (let j = 0; j <= NZ; j++) { const t = (j / NZ) * 2 - 1; zs.push(-20 + (t > 0 ? 320 : 280) * (0.25 * t + 0.75 * t * t * t)); }
    const mk = async (pts, idx) => {
      const n = pts.length / 2, pos = new Float32Array(n * 3), dat = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        const x = pts[i * 2], z = pts[i * 2 + 1], rho = Math.hypot(x, z - CZ);
        const sink = idx.polar ? 4 * sst(250, 272, rho) : 4 * sst(262, 240, rho);
        const zc = cliffZ(x), k = sst(zc + 2.5, zc - 2.5, z);
        const d = Math.abs(x - rx(z)) - hw(z), du = Math.abs(x - urx(z)) - uw(z);
        pos[i * 3] = x; pos[i * 3 + 1] = groundH(x, z) - sink; pos[i * 3 + 2] = z;
        dat[i * 3] = Math.max((1 - k) * (1 - sst(-2, 30, d)), k * (1 - sst(0, 34, du)) * sst(CZ, CZ + 80, z), 1 - sst(RC, RC * 2.2, rho));
        dat[i * 3 + 1] = lerp(0.55 + 0.45 * sst(-4, 16, d), 1, k);
        dat[i * 3 + 2] = k;
        if ((i & 127) === 127) await ctx.yield();
      }
      // area-weighted vertex normals, a few thousand triangles at a time (computeVertexNormals on the whole grid is one long stall)
      const nrm = new Float32Array(n * 3), il = idx.list;
      for (let t = 0; t < il.length; t += 3) {
        const a = il[t] * 3, b = il[t + 1] * 3, c = il[t + 2] * 3;
        const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2], vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
        const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
        nrm[a] += nx; nrm[a + 1] += ny; nrm[a + 2] += nz; nrm[b] += nx; nrm[b + 1] += ny; nrm[b + 2] += nz; nrm[c] += nx; nrm[c + 1] += ny; nrm[c + 2] += nz;
        if (t % 12000 === 11997) await ctx.yield();
      }
      for (let i = 0; i < n; i++) { const o = i * 3, l = Math.hypot(nrm[o], nrm[o + 1], nrm[o + 2]) || 1; nrm[o] /= l; nrm[o + 1] /= l; nrm[o + 2] /= l; }
      await ctx.yield();
      return { pos, dat, nrm, list: il, n };
    };
    const p1 = [], i1 = [];
    for (let j = 0; j <= NZ; j++) for (let i = 0; i <= NX; i++) p1.push(xs[i], zs[j]);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; i1.push(a, c, b, b, c, d); }
    const gA = await mk(p1, { list: i1 });
    await ctx.yield();
    const NR = 44, NA = 96, p2 = [0, CZ], i2 = [];
    for (let r = 1; r <= NR; r++) { const s = r / NR, rho = 330 * (0.3 * s + 0.7 * s * s); for (let a = 0; a < NA; a++) { const th = (a / NA) * Math.PI * 2; p2.push(Math.sin(th) * rho, CZ + Math.cos(th) * rho); } }
    for (let a = 0; a < NA; a++) i2.push(0, 1 + a, 1 + ((a + 1) % NA));
    for (let r = 1; r < NR; r++) for (let a = 0; a < NA; a++) { const a0 = 1 + (r - 1) * NA + a, a1 = 1 + (r - 1) * NA + ((a + 1) % NA), b0 = a0 + NA, b1 = a1 + NA; i2.push(a0, b0, a1, a1, b0, b1); }
    await ctx.yield();
    const gB = await mk(p2, { list: i2, polar: true });
    await ctx.yield();
    // the two sheets joined by hand into one geometry (a typed-array copy: no module to load, no long merge)
    const geo = new THREE.BufferGeometry();
    {
      const cat = (k) => { const o = new Float32Array((gA.n + gB.n) * 3); o.set(gA[k], 0); o.set(gB[k], gA.n * 3); return o; };
      geo.setAttribute('position', new THREE.BufferAttribute(cat('pos'), 3)); geo.setAttribute('normal', new THREE.BufferAttribute(cat('nrm'), 3)); geo.setAttribute('aData', new THREE.BufferAttribute(cat('dat'), 3));
      await ctx.yield();
      const ix = new Uint32Array(gA.list.length + gB.list.length); ix.set(gA.list, 0);
      for (let i = 0, o = gA.list.length, nA = gA.n; i < gB.list.length; i++) ix[o + i] = gB.list[i] + nA;
      geo.setIndex(new THREE.BufferAttribute(ix, 1));
    }
    await ctx.yield();
    const streams = [];
    for (let i = 0; i < 5; i++) {
      const on = i < S.streams, th = 0.75 + (i / 5) * 4.9 + rng.range(-0.3, 0.3);
      streams.push(new THREE.Vector4(th, on ? rng.range(110, 250) : 0, rng.range(3.5, 7), rng.range(0, 6.28)));
    }
    const mat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: { ...lightU(), uStr: { value: streams }, uUM: { value: new THREE.Vector2(S.uMeander, S.uPhase) },
        uT0: { value: rockTint[0] }, uT1: { value: rockTint[1] }, uT2: { value: rockTint[2] }, uVent: U.vent, uShield: U.shield },
      vertexShader: /* glsl */`
        attribute vec3 aData; varying vec3 vD;
        ${VERT_HEAD}
        void main(){ vec3 P = position, N = normal; vD = aData; ${VERT_TAIL} }`,
      fragmentShader: /* glsl */`
        varying vec3 vP; varying vec3 vN; varying vec3 vCam; varying vec3 vD;
        uniform float uTime; uniform vec4 uStr[5], uShield; uniform vec2 uUM; uniform vec3 uT0, uT1, uT2, uVent;
        #include <fog_pars_fragment>
        ${GLSL_LIGHT}
        ${GLSL_NOISE}
        ${lavaFlowGLSL}
        void main(){
          vec3 P = vP; float dist = length(vCam - P); vec3 V = (vCam - P) / dist;
          vec2 q = P.xz;
          // crust relief: ropey pahoehoe + pits, fading with distance
          float fw = length(fwidth(q));                                // pixel footprint on the ground: fine relief fades before it can alias
          float bs = smoothstep(380.0, 80.0, dist) / (1.0 + dist * 0.006) * (1.0 - smoothstep(0.35, 2.2, fw));
          // relief = slabs + pahoehoe ropes in lobes; the normal comes from finite differences of the same band-limited function
          vec2 wq = q + 3.0 * vec2(vn(q * 0.085), vn(q * 0.085 + 7.3));
          float rm = smoothstep(0.42, 0.66, vn(q * 0.041 + 8.0)) * (1.0 - smoothstep(0.25, 0.8, fw)) * 0.4;
          float fA = 0.45 * (1.0 - smoothstep(0.15, 0.7, fw));
          float nearK = 1.0 - smoothstep(22.0, 55.0, dist);                                   // close to the eye: glassy ropes and blisters
          float fB = 0.3 * nearK * (1.0 - smoothstep(0.04, 0.22, fw));
          #define RELIEF(o) (0.62 * vn((q + o) * 0.33) + fA * vn((q + o) * 1.1 + 5.0) + fB * (vn((q + o) * 2.6 + 3.0) + 0.6 * (1.0 - abs(sin((wq.x + (o).x) * 4.1 + 3.0 * vn((q + o) * 0.6))))) + rm * (1.0 - abs(sin((wq.x + (o).x) * 1.25 + 2.0 * sin((wq.y + (o).y) * 0.31)))))
          vec2 o0 = vec2(0.0), ox = vec2(0.3, 0.0), oz = vec2(0.0, 0.3);
          float b0 = RELIEF(o0);
          vec3 N = normalize(vN);
          if (bs > 0.01) { float hx = RELIEF(ox) - b0, hz = RELIEF(oz) - b0;
            N = normalize(N - vec3(hx, 0.0, hz) * (5.0 * bs)); }
          b0 = b0 * 0.8 + 0.2;
          float slope = 1.0 - N.y;
          float big = vn(q * 0.02 + 3.0) * 0.7 + vn(q * 0.057) * 0.3;
          vec3 alb = mix(uT0, uT1, smoothstep(0.3, 0.75, big));
          alb *= 0.55 + 0.9 * b0;
          if (nearK > 0.0) alb *= mix(1.0, 0.55 + 0.9 * vn(q * 2.9 + 1.3) * (0.6 + 0.8 * vn(q * 7.3)), nearK * (1.0 - smoothstep(0.05, 0.3, fw)));
          alb = mix(alb, uT0 * 0.6, smoothstep(0.25, 0.6, slope));
          // cracked crust glowing near lava
          vec2 vc = vD.x > 0.03 ? voro(q * 0.13 + vec2(vn(q * 0.07), vn(q * 0.07 + 9.0)) * 1.6) : vec2(1.0);
          float crack = smoothstep(0.1, 0.0, vc.y);
          float hm = vD.x * (0.35 + 1.1 * vn(q * 0.05 + uTime * 0.012)) * (0.8 + 0.2 * sin(uTime * 0.9 + vc.x * 19.0));
          float heat = crack * smoothstep(0.2, 0.75, hm) * 0.62, shieldHot = 0.0;
          alb = mix(alb, uT2, 0.3 * smoothstep(0.3, 0.9, vD.x));
          // upper river, crater lake, flank streams (drawn, not modelled)
          float up = smoothstep(0.5, 1.0, vD.z);
          if (up > 0.0) {
            float z = P.z, cz = ${CZ.toFixed(1)}, zt = ${ZT.toFixed(1)};
            float urx = uUM.x * sin((z - zt) * 0.021 + uUM.y) * smoothstep(zt - 6.0, zt - 70.0, z) * smoothstep(cz + 40.0, cz + 130.0, z);
            float uw = mix(40.0, 7.0, pow(smoothstep(zt, zt - 110.0, z), 0.7));
            float du = abs(P.x - urx) - uw + 5.0 * (vn(q * 0.12) - 0.5);
            float band = smoothstep(1.2, -1.8, du) * step(cz + 6.0, z);
            vec2 fl2 = band > 0.001 ? lavaFlow2(vec2((P.x - urx) * 0.9, z * 0.55), uTime, 1.0 + 1.5 * smoothstep(cz + 200.0, cz + 60.0, z)) : vec2(0.0); float fl = fl2.x;
            float cool = smoothstep(-uw, 0.0, du);                       // cooler toward the banks
            float hr = band * clamp(fl * (1.15 - 0.45 * cool) + 0.1, 0.0, 1.0);
            // the same deep line as the river below the fall has: a gold core down the middle of the upper river, from the vent to the brink
            float deepU = 1.0 - smoothstep(0.1, 0.5, cool + 0.3 * (vn(vec2(z * 0.013, 4.7)) - 0.5));
            hr = max(hr, band * deepU * mix(0.3, 0.82, smoothstep(0.05, 0.4, fl2.y)));
            vec2 dv = P.xz - uVent.xz; float rho = length(dv), th = atan(dv.x, dv.y);
            float lake = smoothstep(${(RC * 0.72).toFixed(1)}, ${(RC * 0.5).toFixed(1)}, rho);
            hr = max(hr, lake * (0.65 + 0.35 * vn(q * 0.4 + uTime * 0.3)));
            if (rho < 290.0) {
              float bm = 0.0; vec2 bq = vec2(0.0);
              for (int i = 0; i < 5; i++) {
                vec4 s = uStr[i]; float dth = th - s.x; dth = atan(sin(dth), cos(dth));
                float lat = (dth + 0.09 * sin(rho * 0.035 + s.w) + 0.03 * sin(rho * 0.11 + s.w * 2.0)) * rho;
                float m = (1.0 - smoothstep(s.z * 0.25, s.z, abs(lat))) * step(1.0, s.y) * (1.0 - smoothstep(s.y * 0.7, s.y + 0.01, rho))
                  * smoothstep(${(RC * 0.8).toFixed(1)}, ${(RC * 1.3).toFixed(1)}, rho) * mix(1.0, 0.5, rho / max(s.y, 1.0));
                if (m > bm) { bm = m; bq = vec2(lat * 1.4, rho * 0.6 + s.w * 9.0); }
              }
              if (bm > 0.01) hr = max(hr, bm * clamp(lavaFlow(bq, uTime, 2.2) * 0.9 + 0.3, 0.0, 1.0));
            }
            heat = max(heat, hr * up);
          }
          // lava streams running down the great shield behind the vent (the world places it: uShield = x, z, on, phase)
          if (uShield.z > 0.5 && P.y > 95.0) {
            vec2 dv = (P.xz - uShield.xy) * vec2(0.5, 1.0); float rho = length(dv), th = atan(dv.x, dv.y);
            float a = th * 17.0 + uShield.w + 0.3 * sin(rho * 0.009 + th * 3.0) + 0.1 * sin(rho * 0.037 + th * 9.0);
            float id = floor(a / 6.2832), hs = h21(vec2(id, 3.7)), hs2 = h21(vec2(id, 9.1));
            float lat = abs(fract(a / 6.2832) - 0.5) * 0.37 * rho;
            float w = max(mix(4.0, 9.0, hs2) * (0.65 + 0.35 * sin(rho * 0.017 + id * 2.3)), min(fw, 22.0) * 0.95);
            lat = abs(lat - w * 1.7 * max(sin(rho * 0.0085 + id * 4.1), 0.0));                 // braids: the stream parts round a kipuka and rejoins
            float m = (1.0 - smoothstep(w * 0.35, w, lat)) * step(0.42, hs) * smoothstep(mix(700.0, 1650.0, hs2), mix(400.0, 900.0, hs2), rho) * smoothstep(40.0, 130.0, rho) * smoothstep(95.0, 170.0, P.y);
            float fl = vn(vec2(lat * 0.12 + id * 5.0, rho * 0.03 - uTime * 0.22)) * 0.6 + vn(vec2(id * 3.0, rho * 0.009 - uTime * 0.05)) * 0.4;
            shieldHot = m * (0.34 + 0.46 * fl);
            heat = max(heat, shieldHot);
          }
          gMoonSpec = 0.45 * mix(1.0, 0.12, smoothstep(35.0, 90.0, dist)); gLava = mix(0.62, 0.45, nearK);
          vec3 col = forgeShade(P, N, V, alb, 0.03 + (0.08 + 0.14 * b0) * smoothstep(150.0, 25.0, dist), vD.y) * (1.0 - smoothstep(0.25, 0.6, heat));
          col += uMoonCol * alb * 2.3 * max(dot(N, uMoonDir) * 0.5 + 0.5, 0.0) * vD.y * (1.0 - smoothstep(0.25, 0.6, heat));      // cold moon fill: the plains keep their form in the dark
          // the mountain: ridged flanks catch the moon on their moon-side slopes, and the vent warms the rock around it
          float farM = smoothstep(350.0, 800.0, dist) * smoothstep(60.0, 140.0, P.y);
          if (farM > 0.0) {
            float rg = 1.0 - abs(2.0 * vn(q * 0.011 + 3.0) - 1.0), rg2 = 1.0 - abs(2.0 * vn(q * 0.031 + 9.0) - 1.0);
            vec3 Nr = normalize(normalize(vN) + vec3(uMoonDir.x, 0.0, uMoonDir.z) * (rg * 0.9 + rg2 * 0.5 - 0.7) * 0.9);
            float mr = smoothstep(0.0, 0.7, dot(Nr, uMoonDir));
            col += uMoonCol * vec3(0.6, 0.68, 1.0) * (0.04 + 0.15 * mr * (0.5 + 0.5 * rg)) * farM * (1.0 - smoothstep(0.25, 0.6, heat));
          }
          vec3 dvn = uVent + vec3(0.0, 90.0, 0.0) - P; float dv2 = dot(dvn, dvn);
          col += mix(uLavaCol, vec3(0.9, 0.08, 0.02), 0.5) * alb * 6.0 * (62500.0 / (62500.0 + dv2)) * max(dot(normalize(vN), dvn / sqrt(max(dv2, 1.0))) * 0.6 + 0.4, 0.0) * smoothstep(250.0, 420.0, dist);
          col += lavaRamp(heat) * step(0.02, heat) * (1.0 + 2.2 * smoothstep(0.02, 0.2, shieldHot));
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-terrain'; root.add(mesh); shared.terrain = mat;
  }
  await ctx.yield();

  // ---------- the bridge: profile functions ----------
  const APEX = 28 + S.sag;
  const yu = (x) => Math.max(-2, APEX - 16 * ((x + S.lean * 3) / 34) ** 2);                      // underside
  const yt = (x) => lerp(S.deck - 7 * (x / 50) ** 2 + 1.2 * noise.n2(x * 0.05, 4.2), 23, sst(44, 66, Math.abs(x)));
  const wz = (x) => 7.5 + 5.5 * (Math.abs(x) / 50) ** 2 + 1.2 * noise.n2(x * 0.07, 9.1);          // half depth in z

  // ---------- basalt columns: one instanced hex prism (standing walls, stacks, hanging organ pipes) ----------
  {
    const pos = [], nor = [];
    const c = (i, r) => [Math.cos((i * Math.PI) / 3) * r, Math.sin((i * Math.PI) / 3) * r];
    const tri = (a, b, cc, n) => { pos.push(...a, ...b, ...cc); nor.push(...n, ...n, ...n); };
    for (let i = 0; i < 6; i++) {
      const [x0, z0] = c(i, 1), [x1, z1] = c(i + 1, 1), [u0, w0] = c(i, 0.62), [u1, w1] = c(i + 1, 0.62);
      const nx = Math.cos(((i + 0.5) * Math.PI) / 3), nz = Math.sin(((i + 0.5) * Math.PI) / 3);
      tri([x0, 0, z0], [x1, 1, z1], [x1, 0, z1], [nx, 0, nz]); tri([x0, 0, z0], [x0, 1, z0], [x1, 1, z1], [nx, 0, nz]);
      tri([x0, 1, z0], [u1, 2, w1], [x1, 1, z1], [nx * 0.8, 0.6, nz * 0.8]); tri([x0, 1, z0], [u0, 2, w0], [u1, 2, w1], [nx * 0.8, 0.6, nz * 0.8]);
      tri([0, 2, 0], [u1, 2, w1], [u0, 2, w0], [0, 1, 0]);
    }
    const aI = [], aJ = [];
    const add = (x, base, z, r, h, flip, heat) => { aI.push(x, base, z, r); aJ.push(h, rng(), flip, heat); };
    // free-standing stacks on the banks and the terrace
    const clusters = [];
    for (let i = 0, tries = 0; i < 7 && tries < 200; tries++) {
      const side = i % 2 ? 1 : -1, cx = side * rng.range(62, 235), cz = rng.range(-45, 235), R = rng.range(13, 25);
      if (Math.abs(cx - rx(cz)) < 48 + R || cz < cliffZ(cx) + R + 16) continue;
      if (clusters.some((q) => Math.hypot(q.x - cx, q.z - cz) < q.R + R + 12)) continue;
      clusters.push({ x: cx, z: cz, R, peak: rng.range(18, 58) * (1 - 0.3 * sst(120, 240, Math.abs(cx))) }); i++;
    }
    const R1 = 2.0, SQ3 = Math.sqrt(3);
    for (let i = -108; i <= 108; i++) {
      for (let j = -31; j <= 74; j++) {
        const x = 1.5 * R1 * i, z = SQ3 * R1 * (j + 0.5 * (i & 1));
        const zc = cliffZ(x), dz = z - zc;
        if (dz < -3) continue;
        const d = Math.abs(x - rx(z)) - hw(z);
        if (d < 0.6) continue;
        let near = dz < 15 || (d < 18 && z < 150);
        let cl = null;
        if (!near) { for (const q of clusters) if (Math.hypot(q.x - x, q.z - z) < q.R) { cl = q; break; } if (!cl) continue; }
        const gH = groundH(x, z), nA = noise.n2(x * 0.045, z * 0.045), nB = noise.n2(x * 0.83 + 5, z * 0.83);
        let top = -1e9;
        if (dz < 15) {
          const e = 1 - sst(240, 325, Math.abs(x));
          top = Math.max(top, 3 + (HT - 3) * e * (1 - 0.86 * Math.pow(sst(1, 15, dz), 0.7)) + nA * 4.5 + nB * 4.2 * sst(0, 5, dz) + (dz < 1.5 ? 1.5 : 0));
        }
        if (d < 18 && z < 150) {
          const W = wallH(z);
          if (W > 8) top = Math.max(top, W * clamp(0.36 + 0.72 * sst(0, 9, d), 0, 1.06) * (1 - 0.25 * sst(11, 17, d)) + nA * 3 + nB * 4.5);
        }
        if (cl) { const rr = Math.hypot(cl.x - x, cl.z - z) / cl.R; if (noise.n2(x * 1.7 + 40, z * 1.7) > 0.42 - 0.5 * rr) cl = null; else top = Math.max(top, gH + cl.peak * Math.pow(1 - rr * rr, 0.45) * (0.5 + 0.5 * (nB * 0.5 + 0.5)) + nA * 4 + nB * 5); }
        if (top < gH + 1.4) continue;
        const base = Math.min(gH, d < 4 ? -3 : gH) - 4;
        if (Math.abs(x) > 15 || z > 30) top = Math.max(gH + 1.4, top + Math.round(noise.n2(x * 1.9 + 60, z * 1.9) * 2.6) * 1.5 * (cl ? 0.6 : 1) * (d < 6 && z < 150 ? 0.5 : 1));   // stepped lids: no ruled wall tops
        add(x + nB * 0.12, base, z, R1 * 0.965, top - base, 1, (1 - sst(0, 24, d)) * (dz > 4 ? 1 : 0.6));
      }
      if ((i & 1) === 0) await ctx.yield();
    }
    // organ pipes hanging under the arch: shortest above the portal, longest toward the abutments
    const R2 = 1.25;
    for (let i = -22; i <= 22; i++) for (let j = -10; j <= 10; j++) {
      const x = 1.5 * R2 * i, z = SQ3 * R2 * (j + 0.5 * (i & 1)), w = wz(x) - 1.4;
      if (Math.abs(z) > w) continue;
      const zr = z / w, nB = noise.n2(x * 0.6 + 31, z * 0.6), nA = noise.n2(x * 0.11, z * 0.11 + 17);
      const rootY = yu(x) + 1.6 + zr * zr * 3.2;
      let L = (1.4 + 9.5 * sst(4, 27, Math.abs(x)) * (0.55 + 0.45 * (nA * 0.5 + 0.5)) + 2.2 * (nB * 0.5 + 0.5)) * (1 - 0.45 * zr * zr) + 1.6;
      L = Math.min(L, rootY - (groundH(x, z) + 2.5));
      const clear = 14.2, ax = Math.abs(x);
      if (ax < clear) L = Math.min(L, rootY - (11 + Math.sqrt(clear * clear - ax * ax)));
      if (L < 0.9) continue;
      add(x, rootY, z, R2 * 0.95, L, -1, 0.25);
    }
    // the world may stand more columns in the same draw call: add(x, baseY, z, radius, height, flip(1 up | -1 hanging), heat 0..1).
    // Each of those takes its number from its own place, never from the hero's generator: how many the world stands, and in what
    // order, moves nothing that the hero deals after them
    const addAt = (x, base, z, r, h, flip, heat) => { aI.push(x, base, z, r); aJ.push(h, placeRng('forge-pipe', x, z)(), flip, heat); };
    if (opts.columns) await opts.columns(addAt, hookLayout);        // may be async: it yields inside its loops
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(aI), 4));
    geo.setAttribute('aJ', new THREE.InstancedBufferAttribute(new Float32Array(aJ), 4));
    geo.instanceCount = aI.length / 4;
    geo.boundingSphere = new THREE.Sphere(V3(0, 20, 60), 420);
    const mat = new THREE.ShaderMaterial({
      fog: true, side: THREE.DoubleSide,
      uniforms: { ...lightU(), uT0: { value: rockTint[0] }, uT1: { value: rockTint[1] }, uT2: { value: rockTint[2] } },
      vertexShader: /* glsl */`
        attribute vec4 aI; attribute vec4 aJ; varying vec4 vH; varying float vFootY; varying vec2 vHex;
        ${VERT_HEAD}
        void main(){
          float r = aI.w, h = aJ.x, fl = aJ.z, yf = position.y;
          float y = yf < 0.5 ? 0.0 : (yf < 1.5 ? h - min(0.62 * r, 0.4 * h) : h);
          vec2 tilt = (vec2(fract(aJ.y * 7.13), fract(aJ.y * 13.7)) - 0.5) * 0.55;
          if (yf > 0.5) y += dot(position.xz, tilt) * r;
          vec3 P = vec3(aI.x + position.x * r, aI.y + fl * y, aI.z + position.z * r);
          vec3 N = normalize(vec3(normal.x, normal.y * fl, normal.z));
          vHex = position.xz; vH = vec4(y / max(h, 0.01), aJ.y, aJ.w, fl); vFootY = y - 6.0;      // height above the lava the column stands by (bases are sunk ~6 m)
          ${VERT_TAIL} }`,
      fragmentShader: /* glsl */`
        varying vec3 vP; varying vec3 vN; varying vec3 vCam; varying vec4 vH; varying float vFootY; varying vec2 vHex;
        uniform float uTime; uniform vec3 uT0, uT1, uT2;
        #include <fog_pars_fragment>
        ${GLSL_LIGHT}
        ${GLSL_NOISE}
        void main(){
          vec3 P = vP, N = normalize(vN); float dist = length(vCam - P); vec3 V = (vCam - P) / dist;
          float seed = vH.y, side = 1.0 - smoothstep(0.3, 0.7, abs(N.y)), up = step(0.0, vH.w);
          // cooling joints: two or three irregular dark cross-fractures to a pipe, never a regular banding
          float jy = (P.y + seed * 53.0) / (7.0 + 9.0 * fract(seed * 5.7));
          float drum = h21(vec2(floor(jy), seed * 91.0));
          float joint = smoothstep(0.0, 0.012, abs(fract(jy) - 0.5) - 0.488) * side * step(0.4, drum) * (1.0 - smoothstep(60.0, 160.0, dist));
          // each face is fluted: long vertical ribs (noise drawn out 20:1 in y), fading with distance; no cross grain at all
          float fid = floor(atan(vHex.y, vHex.x + 1e-5) / 1.0472 + 3.0);
          float ha = dot(vHex, vec2(-sin((fid - 2.5) * 1.0472), cos((fid - 2.5) * 1.0472)));          // -0.5 .. 0.5 across this face
          float nearF = 1.0 - smoothstep(18.0, 46.0, dist);
          float flA = vn(vec2(ha * 5.0 + fid * 3.7 + seed * 19.0, P.y * 0.07 + seed * 5.0)), flB = vn(vec2(ha * 13.0 + fid * 7.1 + seed * 31.0, P.y * 0.19));
          float flute = mix(0.5, 0.62 * flA + 0.38 * flB, nearF), streak = mix(0.5, vn(vec2(seed * 23.0 + fid, P.y * 0.045)), 1.0 - smoothstep(80.0, 220.0, dist));
          vec3 alb = mix(uT0, uT1, smoothstep(0.35, 0.9, fract(seed * 3.3) * 0.6 + streak * 0.5));
          alb *= (0.62 + 0.5 * fract(seed * 17.3)) * (0.9 + 0.2 * drum) * (0.72 + 0.56 * flute);
          alb *= 1.0 - 0.5 * joint;
          // the creases where neighbouring prisms meet stay dark: every pipe reads as a prism
          float crease = smoothstep(0.885, 1.0, length(vHex)) * side;
          alb *= 1.0 - 0.85 * crease;
          // the six faces are six fracture planes: alternate ones a quarter darker, each a little its own, so the section reads hexagonal
          alb *= mix(1.0, (0.76 + 0.24 * mod(fid, 2.0)) * (0.82 + 0.36 * h21(vec2(fid, seed * 37.0))), side);
          alb = mix(alb, alb * 0.8, 1.0 - side);                                     // lids and shoulders: dark, they only take the moon
          N = normalize(N + vec3(-N.z, 0.0, N.x) * (flA - 0.5) * 0.5 * nearF * side);                // the ribs turn the light a little from side to side
          float ao = (0.42 + 0.58 * smoothstep(0.0, 0.55, vH.x)) * (1.0 - 0.3 * joint) * (1.0 - 0.45 * crease);
          // lava is an up-light: it reaches the lower faces of standing columns, and never their lids
          float reach = mix(0.12, 0.8, smoothstep(30.0, 2.0, vFootY)) * (1.0 - 0.74 * smoothstep(0.06, 0.9, vH.x));     // the up-light climbs the pipe and dies away smoothly
          float topK = 1.0 - smoothstep(0.0, 9.0, (vFootY + 6.0) * (1.0 / max(vH.x, 0.02) - 1.0));                     // the last metres under each lid: out of the glow, in the moonlight
          reach *= 1.0 - 0.6 * topK;
          float gorge = smoothstep(175.0, 140.0, P.z) * smoothstep(-30.0, -8.0, P.z);
          reach *= mix(1.0, 0.88, gorge);                                                                              // the bridge gorge keeps darker upper walls
          gLava = mix(1.0, mix(0.05, reach, side), up);
          gLava *= mix(1.0, 0.35, smoothstep(120.0, 350.0, dist) * up);                                                 // far fields: dark silhouettes over a base glow
          gMoonSpec = 0.6;
          vec3 col = forgeShade(P, N, V, alb, 0.35 + 0.3 * drum, ao);
          float rimF = 1.0 - max(dot(N, V), 0.0);
          float mnC = dot(N, uMoonDir);
          col += uMoonCol * 0.2 * rimF * rimF * smoothstep(-0.2, 0.4, mnC) * side * ao;                                // cold moon rim against the lava key
          float fill = max(smoothstep(0.05, 0.55, vH.x), topK) * (ao + 0.5 * topK);
          col += uMoonCol * alb * 1.6 * max(mnC * 0.32 + 0.68, 0.0) * side * up * fill;       // and a cold sky fill on the shafts above the feet (the moon stands ahead: wrapped, or the faces we see stay black)
          col += uMoonCol * alb * 0.3 * side * (0.6 + 0.4 * ao);                                                        // a floor: no side face of any pipe is ever flat black
          col += mix(uLavaCol, vec3(0.9, 0.08, 0.02), 0.4) * dot(alb, vec3(0.42)) * 1.5 * side * up * smoothstep(20.0, 0.0, vFootY) * (0.4 + 0.6 * vH.z);   // the glowing crust warms every foot, river or no river
          col += uMoonCol * alb * 4.0 * max(mnC, 0.0) * (1.0 - side) * up;                                             // the lids take the moon: cold tops over warm feet
          float lr = length(vHex);
          col += uMoonCol * 0.12 * smoothstep(0.52, 0.62, lr) * (1.0 - smoothstep(0.62, 0.74, lr)) * (1.0 - side) * up * smoothstep(-0.2, 0.6, dot(uMoonDir, vec3(vHex.x, 0.6, vHex.y))) * (1.0 - smoothstep(70.0, 200.0, dist));   // a thin moon-blue line on the lid's edge
          // feet standing in the heat glow dull red
          float foot = vH.z * smoothstep(14.0, -1.0, vFootY) * up * side; foot *= foot;
          col += lavaRamp(0.2 + 0.25 * foot * (0.6 + 0.4 * streak)) * foot * 0.3;
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-columns'; mesh.frustumCulled = false; root.add(mesh);
  }
  await ctx.yield();

  // ---------- the bridge body: massive hackly entablature over the hanging colonnade ----------
  {
    const NXB = 76, NS = 24, pos = [], idx = [];
    const se = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
    for (let i = 0; i <= NXB; i++) {
      const x = -67 + (134 * i) / NXB, top = yt(x), bot = yu(x), yc = (top + bot) / 2, hy = Math.max(1.5, (top - bot) / 2), w = wz(x) + 0.6;
      for (let j = 0; j <= NS; j++) {
        const ph = (j / NS) * Math.PI * 2, cy = se(Math.sin(ph), 0.55), czz = se(Math.cos(ph), 0.5);
        let y = yc + cy * hy, z = czz * w;
        const n = noise.fbm3(x * 0.07, y * 0.07, z * 0.07, 3), blk = Math.round(noise.n3(x * 0.16, y * 0.1, z * 0.16) * 2.5) / 2.5;
        const amp = 1.6 * (0.4 + 0.6 * Math.abs(czz));                      // flanks are rougher than deck and soffit
        z += czz * (n * 1.6 + blk * 1.1) * amp + (cy < -0.2 ? -czz * 1.2 * sst(-0.2, -1, cy) : 0);
        y += (cy > 0 ? 1 : 0.4) * (n * 0.9 + blk * 0.5);
        pos.push(x + noise.n3(x * 0.2, y * 0.2, z * 0.2) * 0.8, y, z);
      }
      if ((i & 15) === 15) await ctx.yield();
    }
    for (let i = 0; i < NXB; i++) for (let j = 0; j < NS; j++) { const a = i * (NS + 1) + j, b = a + 1, cc = a + NS + 1, d = cc + 1; idx.push(a, cc, b, b, cc, d); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({
      fog: true,
      uniforms: { ...lightU(), uT0: { value: rockTint[0] }, uT1: { value: rockTint[1] }, uT2: { value: rockTint[2] } },
      vertexShader: /* glsl */`
        ${VERT_HEAD}
        void main(){ vec3 P = position, N = normal; ${VERT_TAIL} }`,
      fragmentShader: /* glsl */`
        varying vec3 vP; varying vec3 vN; varying vec3 vCam;
        uniform float uTime; uniform vec3 uT0, uT1, uT2;
        #include <fog_pars_fragment>
        ${GLSL_LIGHT}
        ${GLSL_NOISE}
        void main(){
          vec3 P = vP; float dist = length(vCam - P); vec3 V = (vCam - P) / dist;
          vec3 Nf = normalize(cross(dFdx(P), dFdy(P))); if (dot(Nf, V) < 0.0) Nf = -Nf;
          vec3 N = normalize(mix(normalize(vN), Nf, 0.5));
          float side = 1.0 - smoothstep(0.35, 0.8, abs(N.y));
          // entablature: irregular, narrow, mostly vertical fracture cells on the flanks; crust on the deck
          vec2 cu = mix(P.xz * 0.35, vec2(P.x * 0.55 + P.z * 0.2, P.y * 0.2), side);
          vec2 vc = voro(cu + vec2(fb(cu * 0.6), fb(cu * 0.6 + 4.0)) * 0.7);
          float crack = smoothstep(0.09, 0.0, vc.y), cell = h21(floor(cu * 1.0) + vc.x);
          float n = fb(P.xy * 0.4 + P.z * 0.31);
          vec3 alb = mix(uT0, uT1, smoothstep(0.3, 0.8, n)) * (0.6 + 0.6 * fb(cu * 2.3)) * (0.8 + 0.35 * cell);
          alb *= 1.0 - 0.7 * crack;
          N = normalize(N + (vec3(vc.x, 0.0, vc.y) - 0.3) * 0.5 * side);
          float ao = 0.6 + 0.4 * smoothstep(8.0, 30.0, P.y) - 0.3 * crack;
          gLava = mix(1.0, 1.7, smoothstep(0.1, -0.5, N.y));                                   // the soffit is lit hard from below
          vec3 col = forgeShade(P, N, V, alb * 0.85, 0.12 + 0.15 * n, ao);
          float rimB = 1.0 - max(dot(N, V), 0.0);
          col += uMoonCol * (0.05 + 0.16 * rimB * rimB) * smoothstep(0.15, 0.75, N.y) * (0.6 + 0.8 * n);   // moon along the deck's top edge
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-bridge'; root.add(mesh);
  }
  await ctx.yield();
  // ---------- molten river + plunge pool (ribbon) ----------
  const lavaMatU = () => ({ ...fogU(), uInv: U.inv, uTime: U.time, uLavaCol: U.lavaCol, uHotCol: U.hotCol, uMoonDir: U.moonDir, uMoonCol: U.moonCol,
    uVent: U.vent, uFountH: U.fountH, uSurge: U.surge, uFalls: U.falls });
  {
    const NC = 10, pos = [], uv = [], idx = [], rows = [];
    for (let z = 300; z > ZT + 1; z -= (z > 60 ? 6 : 3.5)) rows.push(z);
    rows.push(ZT + 1);
    rows.forEach((z, r) => {
      const c0 = rx(z), w = hw(z) + 4.5;
      for (let i = 0; i <= NC; i++) { const u = (i / NC) * 2 - 1; pos.push(c0 + u * w, 0, z); uv.push(u * w, z, u, 1); }      // the last number: how deep the channel is (1: the river)
      if (r > 0) for (let i = 0; i < NC; i++) { const a = (r - 1) * (NC + 1) + i, b = a + 1, c = a + NC + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 4)); geo.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      fog: true, uniforms: lavaMatU(),
      vertexShader: /* glsl */`
        attribute vec4 aUV; varying vec4 vUV;
        ${VERT_HEAD}
        void main(){ vec3 P = position, N = vec3(0.0, 1.0, 0.0); vUV = aUV; ${VERT_TAIL} }`,
      fragmentShader: /* glsl */`
        varying vec3 vP; varying vec3 vN; varying vec3 vCam; varying vec4 vUV;
        uniform float uTime, uFountH, uSurge; uniform vec3 uLavaCol, uHotCol, uMoonDir, uMoonCol, uVent; uniform vec4 uFalls[2];
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        ${lavaFlowGLSL}
        // close to the eye the plates are crazed with hairline seams (x) and their skin is rough (y)
        vec2 fineCells(vec2 p){ vec2 v = voro(p * 0.95 + vec2(vn(p * 0.5), vn(p * 0.5 + 4.0)) * 0.8);
          return vec2(smoothstep(0.075, 0.0, v.y), 0.5 * vn(p * 2.9 + v.x * 3.0) + 0.5 * vn(p * 6.7)); }
        void main(){
          vec3 P = vP; float dist = length(vCam - P); vec3 V = (vCam - P) / dist;
          float edge = abs(vUV.z), z = vUV.y, zt = ${ZT.toFixed(1)};
          float pool = smoothstep(-30.0, -78.0, z);
          float sp = (1.7 + 1.2 * pool) * (1.0 - 0.65 * edge * edge);
          vec2 p = vec2(vUV.x, z) * 0.85;
          vec2 fl2 = lavaFlow2(p, uTime, sp); float fl = fl2.x, seam = fl2.y;
          float temp = 0.85 + 0.35 * pool - 0.4 * edge * edge * edge;
          float heat = clamp(fl * temp * mix(1.0, 0.82, smoothstep(40.0, 200.0, dist)) + 0.05, 0.0, 1.0);
          // the deep line of the river: down its middle (wandering a little from bank to bank as it goes) the melt is deepest, runs fastest and never
          // skins over: a gold core, orange shoulders beside it, and the red and black crust left to the shallows at the banks. vUV.w says how deep
          // this channel is (1: the river, the whole way from the upper fall down to the lowest terrace; a braid is shallow and keeps its crust)
          // The deep line is as wide in metres wherever the river goes (am: metres from it): where the river spreads, more of it is crust
          float am = abs(vUV.x + 5.0 * (vn(vec2(z * 0.013, 4.7)) - 0.5) + 2.4 * (vn(vec2(z * 0.047, 9.1)) - 0.5));
          float deep = clamp(vUV.w, 0.0, 1.0) * (1.0 - smoothstep(0.6, 0.95, edge)), run = fb(vec2(vUV.x * 0.3, z * 0.045 - uTime * 0.16));
          float core = deep * (1.0 - smoothstep(1.5, 5.5, am)) * (0.75 + 0.5 * run), shoulder = deep * (1.0 - smoothstep(4.5, 12.0, am)), h0 = heat;
          heat = mix(heat, max(heat, 0.6 * smoothstep(0.2, 0.65, seam)), shoulder);      // shoulders: the plates keep their black crust, the seams between them run orange
          heat = mix(heat, max(heat, mix(0.13, 0.77, smoothstep(0.1, 0.5, seam)) + 0.04 * (run - 0.5)), clamp(core, 0.0, 1.0));      // the core: dark red rafts adrift, gold melt in the seams between them
          float lift = heat - h0;
          // churn at the foot of the fall
          float churn = smoothstep(zt + 20.0, zt + 9.0, z) * smoothstep(48.0, 36.0, abs(P.x));
          for (int i = 0; i < 2; i++) { vec4 f = uFalls[i]; float dzf = P.z - f.y;
            churn = max(churn, f.w * smoothstep(1.0, 4.5, dzf) * smoothstep(19.0, 8.0, dzf) * smoothstep(f.z + 2.0, f.z - 5.0, abs(P.x - f.x))); }
          if (churn > 0.0) heat = mix(heat, 0.5 + 0.4 * fb(P.xz * 0.35 + vec2(0.0, uTime * 1.3)), churn);
          float nearK = (1.0 - smoothstep(26.0, 62.0, dist)) * (1.0 - smoothstep(0.08, 0.35, length(fwidth(p)))), rough = 0.5;
          if (nearK > 0.0) {
            float fa = fract(uTime * 0.045), fb2 = fract(uTime * 0.045 + 0.5);
            vec2 ca = fineCells(p - vec2(0.0, sp * 22.0 * (fa - 0.5))), cb = fineCells(p + 31.7 - vec2(0.0, sp * 22.0 * (fb2 - 0.5)));
            vec2 fc = mix(cb, ca, 1.0 - abs(2.0 * fa - 1.0));
            float cool = 1.0 - smoothstep(0.14, 0.4, heat);                                   // only the cooled plates craze
            heat = max(heat, fc.x * cool * nearK * (0.27 + 0.2 * vn(p * 0.3 + uTime * 0.05)) * (1.0 - churn) * smoothstep(0.25, 0.6, vn(p * 0.23 + 5.0)));
            rough = mix(0.5, fc.y, nearK);
          }
          vec3 col = lavaRamp(heat) * 0.8;
          // cooled plates: dark glassy crust with a soft moon sheen; they mirror the fall and the fountain
          float crust = 1.0 - smoothstep(0.16, 0.42, heat);
          float pfw = length(fwidth(p));
          vec2 bn = vec2(vn(p * 0.6) - 0.5, vn(p * 0.6 + 5.3) - 0.5) * (1.0 - smoothstep(0.3, 1.5, pfw));   // broad swells only: nothing here can alias
          bn += vec2(vn(p * 3.1 + 2.0) - 0.5, vn(p * 3.1 + 8.0) - 0.5) * 0.7 * nearK;
          vec3 N = normalize(vec3(bn.x * 0.22, 1.0, bn.y * 0.22));
          vec3 R = reflect(-V, N);
          float fres = 0.04 + 0.96 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
          vec3 refl = vec3(0.0);
          vec3 R0 = reflect(-V, normalize(vec3(bn.x * 0.03, 1.0, bn.y * 0.03)));
          if (R0.z < -0.01) { float t = (zt + 6.0 - P.z) / R0.z; vec3 hit = P + R0 * t;
            float shim = (0.55 + 0.45 * sin(P.x * 1.9 + 5.0 * vn(vec2(P.x * 0.6, P.z * 0.05 - uTime * 0.25)))) * smoothstep(0.25, 0.7, fb(vec2(P.x * 0.22, P.z * 0.025 - uTime * 0.06))) * 1.7 * smoothstep(0.0, 0.1, V.y);      // long soft streaks lying toward the fall
            refl += mix(uLavaCol, vec3(1.0, 0.16, 0.02), 0.45) * 1.2 * shim * smoothstep(46.0, 30.0, abs(hit.x)) * smoothstep(54.0, 30.0, hit.y) * smoothstep(-2.0, 4.0, hit.y) * step(0.0, t) * smoothstep(250.0, 110.0, P.z); }      // only the gorge below the fall mirrors it: further down the river it is hidden behind the bridge
          refl += uMoonCol * vec3(0.82, 0.74, 1.12) * (0.28 * pow(max(dot(R, uMoonDir), 0.0), 14.0) + 0.035);      // a violet-blue sheen: a cyan one over dim orange melt read olive green
          col += crust * (refl * fres * (0.6 + 0.8 * rough) + vec3(0.0058, 0.0048, 0.0095) * (0.6 + 0.8 * vn(p * 0.45 + 2.0)) * (0.3 + 1.4 * rough));
          // the fountain's glitter path: a broken streak of its light lying on the lava toward the vent
          vec2 cv = uVent.xz - vCam.xz; float cl = max(length(cv), 1.0); cv /= cl;
          vec2 pc = P.xz - vCam.xz; float along = dot(pc, cv), off = pc.x * cv.y - pc.y * cv.x;
          float gw = 2.2 + along * 0.075;
          float dash = fb(vec2(off * 0.5, along * 0.11 - uTime * 0.22));                    // one continuous shimmer drawn out toward the vent: no cells, no steps
          float glit = exp(-(off * off) / (gw * gw)) * smoothstep(0.3, 0.75, dash + 0.12 * uSurge) * smoothstep(4.0, 14.0, along) * (1.0 - smoothstep(60.0, 170.0, along))
            * smoothstep(1100.0, 600.0, cl) * (1.0 - 0.97 * (1.0 - smoothstep(0.16, 0.42, heat - lift * (1.0 - churn)))) * (0.55 + 0.75 * uSurge) * (0.85 + 0.15 * sin(uTime * 5.1));
          col += mix(uLavaCol, uHotCol, 0.5) * 1.5 * glit;                                                        // it brightens the molten cracks; the plates stay dark
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-river'; root.add(mesh); shared.river = mat;
  }
  await ctx.yield();

  // ---------- the lava fall: 80 m curtain over the last terrace ----------
  {
    const NXF = 56, top = 5, fallRows = 26, pos = [], uv = [], idx = [], rows = [];
    for (let r = 0; r < top; r++) rows.push({ z: ZT - 16 + (17 * r) / top, y: HT - 0.9, tau: -1 + r / top });
    for (let r = 0; r <= fallRows; r++) { const t = r / fallRows; rows.push({ z: ZT + 1 + 12.5 * t, y: HT - 0.9 - (HT + 0.4) * t * t - 1.2 * t, tau: t }); }
    rows.forEach((q, r) => {
      for (let i = 0; i <= NXF; i++) { const x = -43 + (86 * i) / NXF; pos.push(x, q.y + (q.tau > 0 ? 0 : 0.5), q.z + (q.tau > 0 ? 1.6 * noise.n2(x * 0.12, 3.3) * (1 - q.tau * 0.5) : 0)); uv.push(x, q.tau); }
      if (r > 0) for (let i = 0; i < NXF; i++) { const a = (r - 1) * (NXF + 1) + i, b = a + 1, c = a + NXF + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    });
    const gaps = [];
    for (let i = 0; i < 3; i++) gaps.push(new THREE.Vector3(i < S.fallGaps ? rng.range(-30, 30) : 999, rng.range(1.8, 4.2), rng.range(0.35, 0.9)));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const mat = new THREE.ShaderMaterial({
      fog: true, side: THREE.DoubleSide, uniforms: { ...lavaMatU(), uGap: { value: gaps } },
      vertexShader: /* glsl */`
        attribute vec2 aUV; varying vec2 vUV; uniform float uTime;
        #include <fog_pars_vertex>
        void main(){ vUV = aUV; vec3 P = position; float t = max(aUV.y, 0.0);
          P.z += (sin(P.x * 0.31 + t * 7.0 - uTime * 2.3) * 0.7 + sin(P.x * 0.83 - uTime * 1.7 + t * 11.0) * 0.3) * t;
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vUV; uniform float uTime; uniform vec3 uLavaCol, uHotCol; uniform vec3 uGap[3];
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        void main(){
          float x = vUV.x, tau = vUV.y, t = max(tau, 0.0);
          // ragged edges and rock teeth that split the curtain at the lip
          float wn = fb(vec2(x * 0.5, t * 2.0 - uTime * 0.4));
          float m = smoothstep(41.5, 38.0, abs(x) + (wn - 0.5) * 5.0 * (0.4 + t));
          for (int i = 0; i < 3; i++) { vec3 g = uGap[i]; m *= smoothstep(g.y * (1.0 - t / g.z) , g.y * (1.0 - t / g.z) + 1.4, abs(x - g.x) + (wn - 0.5) * 1.5); }
          // threads thinning as the sheet accelerates
          float thr = fb(vec2(x * 1.7, t * 1.4 - uTime * 0.55));
          m *= smoothstep(0.02, 0.2, thr + 0.55 - 0.42 * t);
          if (m < 0.5) discard;
          float fall = t * 3.1 - uTime;                                        // pattern rides the falling melt
          float streak = fb(vec2(x * 1.3, fall * 0.9)) * 0.6 + fb(vec2(x * 4.1, fall * 0.5)) * 0.4;
          float clot = smoothstep(0.5, 0.8, fb(vec2(x * 4.0, fall * 0.25)));        // long thin cooling skins
          float heat = 0.9 - 0.26 * t - 0.2 * clot * (0.3 + t) + (streak - 0.5) * 0.6;
          heat += 0.14 * smoothstep(0.25, 0.0, t) * smoothstep(-0.2, 0.0, tau);    // the brink is the hottest
          heat = mix(heat, 0.5 + 0.4 * streak, step(tau, 0.0) * 0.6);          // the river arriving at the lip is cooler
          heat = max(heat, (0.8 + 0.2 * fb(vec2(x * 0.7, uTime * 1.6))) * smoothstep(0.88, 1.0, t));   // impact
          heat -= 0.09 * exp(-x * x / 260.0) * smoothstep(-0.2, 0.3, tau);    // a cooler curtain right behind the portal: its rim separates
          gl_FragColor = vec4(lavaRamp(clamp(heat, 0.0, 0.95)) * (1.0 - 0.25 * exp(-x * x / 260.0)), 1.0);
          #include <fog_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-fall'; root.add(mesh);
  }
  await ctx.yield();
  const WIND = new THREE.Vector2(rng.sign() * Math.cos(S.wind), Math.sin(S.wind));      // downwind, unit XZ
  // ---------- fountain bombs + falling veil + fall splash + river embers: one instanced additive quad cloud ----------
  const quad = () => { const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; };
  {
    // the released counts are drawn from rng in the released order (so nothing after this reshuffles); the thicker veil and
    // the thinning by quality take their extra numbers from a generator of their own
    const B0 = 14500, B1 = 2400, N2 = 500, N3 = 700, nb = B0 + B1 + N2 + N3, a0 = new Float32Array(nb * 4);
    for (let i = 0; i < nb * 4; i++) a0[i] = rng();
    const N0 = Math.round(B0 * DETAIL), N1 = Math.round(4200 * DETAIL), n = N0 + N1 + N2 + N3, a = new Float32Array(n * 4), b = new Float32Array(n);
    const er = ctx.core.makeRng(((ctx.seed | 0) + 1) * 5081 + 77);
    for (let i = 0; i < n; i++) {
      const kind = i < N0 ? 0 : i < N0 + N1 ? 1 : i < N0 + N1 + N2 ? 2 : 3, j = kind === 0 ? i : kind === 1 ? i - N0 : kind === 2 ? i - N0 - N1 : i - N0 - N1 - N2;
      const src = kind === 0 ? j : kind === 1 ? (j < B1 ? B0 + j : -1) : kind === 2 ? B0 + B1 + j : B0 + B1 + N2 + j;
      for (let k = 0; k < 4; k++) a[i * 4 + k] = src >= 0 ? a0[src * 4 + k] : er();
      b[i] = kind;
    }
    await ctx.yield();
    const geo = quad();
    geo.setAttribute('aS', new THREE.InstancedBufferAttribute(a, 4));
    geo.setAttribute('aK', new THREE.InstancedBufferAttribute(b, 1));
    geo.instanceCount = n; geo.boundingSphere = new THREE.Sphere(V3(0, 200, -200), 700);
    const mat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { ...fogU(), uTime: U.time, uVent: U.vent, uFountH: U.fountH, uSurge: U.surge, uLavaCol: U.lavaCol, uHotCol: U.hotCol,
        uShape: { value: new THREE.Vector3(S.spread, S.tilt, S.meander) }, uWind: { value: WIND } },
      vertexShader: /* glsl */`
        attribute vec4 aS; attribute float aK;
        uniform float uTime, uFountH, uSurge; uniform vec3 uVent, uShape; uniform vec2 uWind;
        varying vec2 vQ; varying vec3 vC;
        #include <fog_pars_vertex>
        const float G = ${GRAV.toFixed(2)};
        void main(){
          vec3 c, vel; float w, len, heat, bright, T, t;
          if (aK < 1.5) {                                         // fountain: ballistic, launched in pulses
            float v0 = sqrt(2.0 * G * uFountH);
            float sp = v0 * (0.5 + 0.5 * sqrt(aS.x));
            float ang = uShape.x * (0.07 + 0.96 * aS.y * aS.y) * (1.0 + 0.7 * step(0.5, aK) * (0.4 + 0.6 * aS.w)), az = aS.z * 6.2832;       // a narrow jet: ~10 degrees at the widest; the veil opens wider
            vec3 dir = normalize(vec3(sin(ang) * cos(az) + uShape.y, cos(ang), sin(ang) * sin(az)));
            T = 2.0 * sp * dir.y / G + 2.2;
            float cyc = uTime / T + aS.w; t = fract(cyc) * T;
            float born = (floor(cyc) - aS.w) * T;
            float pulse = 0.86 + 0.09 * sin(born * 0.83) + 0.05 * sin(born * 2.1 + 1.3);
            vec3 v0v = dir * sp * pulse;
            vec3 wnd = vec3(uWind.x, 0.0, uWind.y) * (0.5 + aS.x);
            float hs = 1.04;                                                   // the clots' paths are the same all through the visit: the surge lights more of them, it does not throw them higher (1.04 is midway between the 1.00 and 1.08 this used to move between)
            c = uVent + (v0v * t + vec3(0.0, -0.5 * G * t * t, 0.0)) * hs + wnd * t * t * 0.3;
            vel = (v0v + vec3(0.0, -G * t, 0.0)) * hs + wnd * t * 0.6;
            float k = t / T, fallk = smoothstep(0.0, -14.0, vel.y);
            heat = 1.0 - 0.68 * k;
            float fl = uVent.y + 14.0 - 0.72 * max(length(c.xz - uVent.xz) - 28.0, 0.0);       // cone flank
            float on = smoothstep(fl - 6.0, fl + 6.0, c.y) * step(aS.w * 0.999, 0.55 + 0.65 * uSurge + 0.3 * step(0.5, aK));
            on *= mix(0.6, 1.0, smoothstep(6.0, 42.0, length(c.xz - uVent.xz))) / (0.75 + 0.7 * uSurge);          // inside the jet the clots do not pile up to white: the jet itself is drawn there
            if (aK < 0.5) {                                       // clots and bombs: short trails, they leave the jet and arc over
              w = mix(1.2, 3.4, aS.z * aS.z); len = w + length(vel) * 0.62;                   // long trails along the flight
              bright = on * 2.0 * smoothstep(0.03, 0.2, k) * (1.0 - 0.5 * smoothstep(0.85, 1.0, k));
            } else {                                              // the falling veil: wide soft streaks, only on the way down
              w = mix(5.0, 11.0, aS.x); len = w * 1.3 + length(vel) * 0.55;
              bright = on * 1.1 * (0.9 + 0.15 * uSurge) * fallk * (1.0 - 0.45 * smoothstep(0.82, 1.0, k)); heat *= 0.88;
            }
          } else if (aK < 2.5) {                                  // spatter where the fall hits the pool
            vec3 p0 = vec3((aS.x * 2.0 - 1.0) * 37.0, 0.5, ${(ZT + 13).toFixed(1)});
            vec3 v0v = vec3((aS.y - 0.5) * 12.0, 9.0 + 17.0 * aS.z * aS.z, 2.0 + 9.0 * aS.y);
            T = 2.0 * v0v.y / G + 0.2; t = fract(uTime / T + aS.w) * T;
            c = p0 + v0v * t + vec3(0.0, -0.5 * G * t * t, 0.0); vel = v0v + vec3(0.0, -G * t, 0.0);
            heat = 1.0 - 0.5 * t / T; bright = 0.9; w = mix(0.45, 1.1, aS.x); len = w + length(vel) * 0.09;
          } else {                                                // embers lifting off the river in the heat
            float z0 = mix(-84.0, 270.0, aS.y), rxz = z0 > 140.0 ? uShape.z * pow((z0 - 140.0) / 160.0, 2.0) : 0.0;
            float hwz = 13.0 + 26.0 * smoothstep(-35.0, -76.0, z0);
            T = mix(6.0, 11.0, aS.z); t = fract(uTime / T + aS.w) * T;
            float up = mix(2.5, 6.5, aS.w);
            c = vec3(rxz + (aS.x * 2.0 - 1.0) * hwz, 0.3 + up * t + 0.12 * t * t, z0);
            c.xz += uWind * t * 1.4 + vec2(sin(t * 1.3 + aS.x * 40.0), cos(t * 1.1 + aS.y * 40.0)) * (0.6 + 0.35 * t);
            vel = vec3(cos(t * 1.3 + aS.x * 40.0), up, -sin(t * 1.1 + aS.y * 40.0));
            float k = t / T; heat = 0.9 - 0.6 * k;
            bright = 1.3 * smoothstep(0.0, 0.08, k) * (1.0 - smoothstep(0.55, 1.0, k)) * (0.55 + 0.45 * sin(uTime * 7.0 + aS.z * 90.0));
            w = mix(0.16, 0.38, aS.z); len = w * 2.2;
          }
          vec4 mv = modelViewMatrix * vec4(c, 1.0);
          vec2 d2 = (mat3(modelViewMatrix) * vel).xy; float dl = length(d2); d2 = dl > 1e-4 ? d2 / dl : vec2(0.0, 1.0);
          float px = -mv.z * 0.0022;                               // never thinner than ~1.2 px (and no brighter for it)
          float farK = smoothstep(250.0, 900.0, -mv.z) * step(aK, 1.5);          // from afar the fountain is drawn in arcs, not in sparks
          bright *= clamp(w / px, aK < 0.5 ? 0.22 : 0.5, 1.0) * mix(1.0, aK < 0.5 ? 0.5 : 0.8, farK);
          w = max(w, px); len = max(len, px * mix(1.0, aK < 0.5 ? 4.5 : 7.0, farK));
          mv.xy += d2 * position.y * len + vec2(-d2.y, d2.x) * position.x * w;
          vQ = position.xy * 2.0;
          vec3 hot = mix(vec3(0.9, 0.09, 0.005), vec3(1.0, 0.24, 0.03), smoothstep(0.2, 0.55, heat));
          hot = mix(hot, vec3(1.0, 0.56, 0.12), smoothstep(0.55, 0.85, heat)); hot = mix(hot, vec3(1.0, 0.68, 0.2), smoothstep(0.85, 1.0, heat));      // fresh clots leave the vent yellow
          vC = hot * bright * mix(0.7, 1.6, heat * heat);
          vec4 mvPosition = mv; gl_Position = projectionMatrix * mv;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vQ; varying vec3 vC;
        #include <fog_pars_fragment>
        ${GLSL_FOG_FADE}
        void main(){
          float a = (1.0 - vQ.x * vQ.x) * smoothstep(-1.0, 0.45, vQ.y) * (1.0 - smoothstep(0.55, 1.0, vQ.y));
          gl_FragColor = vec4(vC * a * a * fogFade(), 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-sparks'; mesh.frustumCulled = false; mesh.renderOrder = 4; root.add(mesh);
  }
  await ctx.yield();

  // ---------- fountain core jet: a camera-facing (about Y) strip of rising incandescent streaks ----------
  {
    const NJ = 14, pos = [], idx = [];
    for (let j = 0; j <= NJ; j++) { pos.push(-1, j / NJ, 0, 1, j / NJ, 0); if (j < NJ) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
    geo.boundingSphere = new THREE.Sphere(VENT.clone().add(V3(0, 150, 0)), 260);
    const mat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      uniforms: { ...fogU(), uInv: U.inv, uTime: U.time, uVent: U.vent, uFountH: U.fountH, uSurge: U.surge, uLavaCol: U.lavaCol, uHotCol: U.hotCol, uTilt: { value: S.tilt } },
      vertexShader: /* glsl */`
        uniform mat4 uInv; uniform vec3 uVent; uniform float uFountH, uTilt, uSurge; varying vec2 vQ; varying float vFar;
        #include <fog_pars_vertex>
        void main(){
          vec3 cam = (uInv * vec4(cameraPosition, 1.0)).xyz; vec3 toC = cam - uVent; toC.y = 0.0;
          vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toC));
          float y = position.y * 1.18 - 0.18, hgt = uFountH * (0.86 + 0.1 * uSurge);      // the strip starts below the vent: the curtain lands on the cone
          float wd = 250.0;                                             // wide enough for the falling curtain; the jet is shaped in the fragment shader
          vec3 P = uVent + vec3(uTilt * y * hgt * 0.8, y * hgt - 4.0, 0.0) + right * position.x * wd;
          vQ = vec2(position.x, y); vFar = smoothstep(520.0, 1100.0, length(toC));
          vec4 mvPosition = modelViewMatrix * vec4(P, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vQ; varying float vFar; uniform float uTime, uSurge; uniform vec3 uLavaCol, uHotCol;
        #include <fog_pars_fragment>
        ${GLSL_NOISE}
        ${GLSL_FOG_FADE}
        void main(){
          float x = vQ.x, y = vQ.y, xm = x * 250.0;                                       // xm: metres off the axis
          float cw = mix(8.0, 31.0, pow(max(y, 0.0), 1.6)), xc = xm / cw;                             // a tapered jet: 16 m at the vent, 60 m at the crown
          float n1 = fb(vec2(xm * 0.07 + 9.0, y * 5.0 - uTime * 1.25));
          float n2 = fb(vec2(xm * 0.22, y * 11.0 - uTime * 2.1));
          float core = exp(-xc * xc * 1.2);
          float body = core * smoothstep(1.0, 0.0, y + 0.5 * (n1 - 0.5)) * (0.2 + 1.5 * n1 * n1) * (0.35 + 1.3 * n2 * n2);
          float sx = (xm + 3.0 * (n1 - 0.5)) / (cw * 0.55);
          float spine = exp(-sx * sx) * pow(max(1.0 - y, 0.0), 0.5) * (0.55 + 0.75 * n2) * (0.6 + 0.6 * n1);   // the dense unbroken column
          // the curtain: what went up comes down as a weeping dome of cooling streaks, widest at the cone
          float ro = 230.0 * pow(max(1.0 - y / 0.97, 0.0), 0.62), edge = abs(xm) / max(ro, 1.0);
          float s1 = fb(vec2(xm * 0.085, y * 1.5 + uTime * 0.33)), s2 = fb(vec2(xm * 0.3 + 7.0, y * 3.0 + uTime * 0.6));
          float streak = smoothstep(0.36, 0.6, s1) * (0.6 + 1.0 * s2) + 0.4;
          float dome = smoothstep(1.0, 0.55, edge + 0.3 * (s1 - 0.5));
          float veil = dome * (1.0 + 0.7 * smoothstep(0.45, 0.9, edge)) * smoothstep(0.5, 1.7, abs(xc)) * (0.4 + 0.6 * y) * smoothstep(-0.18, -0.06, y) * streak * (1.0 - x * x);
          float gush = 0.85 + 0.15 * sin(uTime * 0.83 - y * 6.0);
          float h = clamp((body * (1.5 - 0.7 * y) + spine * 1.25) * gush, 0.0, 1.5) * smoothstep(0.0, 0.03, y);
          vec3 hotC = mix(uHotCol, vec3(1.0, 0.92, 0.7), 0.25);
          vec3 col = mix(uLavaCol * 1.2, hotC * 1.5, smoothstep(0.2, 0.85, h)) * min(h, 1.2) * (1.15 / (1.0 + 0.6 * uSurge));
          col += mix(vec3(0.9, 0.1, 0.0), uLavaCol * 1.25, clamp(0.2 + 0.7 * y, 0.0, 1.0)) * min(veil, 1.6) * 2.3 * (0.85 + 0.12 * uSurge) * (1.0 + 2.2 * vFar);
          gl_FragColor = vec4(min(col, hotC * 1.65) * fogFade(), 1.0);                      // the column's core burns yellow-white, as bright at the far end of the river as under the bridge
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-jet'; mesh.frustumCulled = false; mesh.renderOrder = 3; root.add(mesh);
  }
  await ctx.yield();
  // ---------- soft glows (heat haze lit by the lava) ----------
  {
    const g = [], c = [], bb = [];
    const glow = (x, y, z, size, col, I, aspect = 1, flick = 0.15) => { g.push(x, y, z, size); c.push(col.r * I, col.g * I, col.b * I, rng() * 10); bb.push(aspect, flick); };
    const mid = lavaCol.clone().lerp(hotCol, 0.35);
    glow(VENT.x, VENT.y + 14, VENT.z, 110, lavaCol.clone().lerp(hotCol, 0.6), 0.1, 1, 0.3);
    glow(VENT.x, VENT.y + S.fountH * 0.42, VENT.z, 900, lavaCol, 0.04, 1.1, 0.12);
    glow(VENT.x, VENT.y + S.fountH * 0.36, VENT.z, 300, mid, 0.1, 1.9, 0.2);
    glow(VENT.x, VENT.y + S.fountH * 0.42, VENT.z, 620, mid, 0.075, 0.85, 0.16);            // the torch: a broad underglow where the plume begins
    glow(VENT.x, VENT.y + S.fountH * 0.62, VENT.z, 330, lavaCol, 0.04, 0.8, 0.2);               // the crown the curtain falls from
    glow(0, 21, ZT + 12, 150, lavaCol, 0.12, 0.62, 0.12);
    glow(-18, 4, ZT + 16, 62, mid, 0.22, 0.6, 0.3); glow(16, 4, ZT + 15, 66, mid, 0.22, 0.6, 0.3);
    glow(0, 3, -62, 120, lavaCol, 0.09, 0.5, 0.1);
    for (let z = -10; z <= 270; z += 56) glow(rx(z), 2.5, z, 74, lavaCol, 0.05, 0.42, 0.1);
    g.push(VENT.x, VENT.y + S.fountH * 0.52, VENT.z, 270); c.push(0.32, 0.028, 0.004, 3.3); bb.push(0.7, 0.2);      // the plume's underside takes the fountain's red (no rng: nothing after this reshuffles)
    const geo = quad();
    geo.setAttribute('aG', new THREE.InstancedBufferAttribute(new Float32Array(g), 4));
    geo.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(c), 4));
    geo.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(bb), 2));
    geo.instanceCount = g.length / 4;
    const mat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { ...fogU(), uTime: U.time, uSurge: U.surge },
      vertexShader: /* glsl */`
        attribute vec4 aG; attribute vec4 aC; attribute vec2 aB; uniform float uTime, uSurge; varying vec2 vQ; varying vec3 vC;
        #include <fog_pars_vertex>
        void main(){
          vec4 mvPosition = modelViewMatrix * vec4(aG.xyz, 1.0);
          mvPosition.xy += position.xy * aG.w * vec2(1.0, aB.x);
          float f = 1.0 + aB.y * (sin(uTime * 2.3 + aC.w) * 0.6 + sin(uTime * 5.9 + aC.w * 3.0) * 0.4);
          vQ = position.xy * 2.0; vC = aC.rgb * f * (0.9 + 0.15 * uSurge);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vQ; varying vec3 vC;
        #include <fog_pars_fragment>
        ${GLSL_FOG_FADE}
        void main(){ float r2 = dot(vQ, vQ); float a = exp(-r2 * 5.5) * pow(max(1.0 - r2, 0.0), 2.0);
          gl_FragColor = vec4(vC * a * fogFade(), 1.0); }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-glow'; mesh.frustumCulled = false; mesh.renderOrder = 2; root.add(mesh);
  }

  // ---------- ash plume: dark puffs rising off the fountain and shearing downwind, lit red from beneath ----------
  if (opts.plume !== false) {
    // the first 46 puffs draw from rng as released (nothing after this reshuffles); the rest have a generator of their own
    const NP = 84, a = new Float32Array(NP * 4), pr = ctx.core.makeRng(((ctx.seed | 0) + 1) * 3251 + 19);
    for (let i = 0; i < NP; i++) { const r = i < 46 ? rng : pr; a[i * 4] = r(); a[i * 4 + 1] = r(); a[i * 4 + 2] = r(); a[i * 4 + 3] = (i + r() * 0.6) / NP; }
    const geo = quad(); geo.setAttribute('aS', new THREE.InstancedBufferAttribute(a, 4)); geo.instanceCount = NP;
    const mat = new THREE.ShaderMaterial({
      fog: true, transparent: true, depthWrite: false,
      uniforms: { ...fogU(), uTime: U.time, uVent: U.vent, uFountH: U.fountH, uWind: { value: WIND }, uLavaCol: U.lavaCol, uMoonDir: U.moonDir, uMoonCol: U.moonCol,
        uAsh: { value: pal[1].clone().lerp(pal[0], 0.2).lerp(new THREE.Color('#4a4258'), 0.5).multiplyScalar(2.2) } },
      vertexShader: /* glsl */`
        attribute vec4 aS; uniform float uTime, uFountH; uniform vec3 uVent, uMoonDir; uniform vec2 uWind;
        varying vec2 vQ; varying vec4 vS; varying float vPh; varying vec3 vW;
        #include <fog_pars_vertex>
        void main(){
          float ph = fract(uTime / 52.0 + aS.w);
          vec3 c = uVent + vec3(0.0, uFountH * 0.42 + 330.0 * pow(ph, 0.8), 0.0);
          c.xz += uWind * (pow(ph, 1.5) * 300.0) + (aS.xy - 0.5) * mix(46.0, 170.0, ph);
          c.y += (aS.z - 0.5) * 60.0 * ph;
          float size = mix(80.0, 270.0, ph) * (0.75 + 0.5 * aS.z);
          vec4 mvPosition = modelViewMatrix * vec4(c, 1.0);
          float rot = (aS.x - 0.5) * 6.0 + uTime * 0.03 * (aS.y - 0.5); vec2 q = position.xy; q = vec2(q.x * cos(rot) - q.y * sin(rot), q.x * sin(rot) + q.y * cos(rot));
          mvPosition.xy += q * size;
          vec2 ml = (viewMatrix * modelMatrix * vec4(uMoonDir, 0.0)).xy;                    // the moon's side of every puff, on screen
          vW = vec3(q * 2.0, 0.0); vW.z = dot(vW.xy, ml / max(length(ml), 1e-3));
          vQ = position.xy * 2.0; vS = aS; vPh = ph;
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vQ; varying vec4 vS; varying float vPh; varying vec3 vW; uniform float uTime; uniform vec3 uLavaCol, uAsh, uMoonCol;
        #include <fog_pars_fragment>
        float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
        float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y); }
        void main(){
          float r = length(vQ);
          float n = vn(vQ * 1.6 + vS.xy * 30.0 + uTime * 0.02) * 0.6 + vn(vQ * 3.7 + vS.yz * 17.0 - uTime * 0.03) * 0.4;
          float a = smoothstep(1.0, 0.0, r + (n - 0.5) * 0.9), a0 = a; a *= a;
          a *= 0.92 * smoothstep(0.0, 0.16, vPh) * (1.0 - smoothstep(0.6, 1.0, vPh));
          if (a < 0.004) discard;
          // lit red from the vent beneath, rimmed cold by the moon on the moon's side of each billow
          float under = pow(max(1.0 - vPh, 0.0), 1.8) * (0.25 + 0.75 * smoothstep(0.6, -0.9, vW.y)) * (0.5 + n);
          float rim = smoothstep(-0.1, 0.9, vW.z) * smoothstep(0.75, 0.2, a0) * (0.4 + 1.2 * n);
          vec3 col = uAsh * (0.45 + 0.9 * n) * (0.55 + 0.75 * smoothstep(-0.8, 0.8, vW.z)) + uLavaCol * under * 1.7 + uMoonCol * 0.3 * rim;
          gl_FragColor = vec4(col, a);
          #include <fog_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-plume'; mesh.frustumCulled = false; mesh.renderOrder = 1; root.add(mesh);
  }

  // ---------- obsidian blades: black glass sails on the banks ----------
  const bladeSpots = [];
  if (opts.blades !== false) {
    const pos = [], idx = [];
    const blade = (bx, bz, hgt, y0, r = rng) => {                    // r: the generator that shapes it (the hero's own for the hero's own sails)
      const by = (y0 ?? groundH(bx, bz)) - 1.2, yaw = r.range(0, Math.PI), c0 = hgt * r.range(0.26, 0.4), t0 = c0 * r.range(0.07, 0.11), lean = r.range(-0.5, 0.5);
      const cx = Math.cos(yaw), cz = Math.sin(yaw), K = 6, o = pos.length / 3;
      for (let k = 0; k <= K; k++) {
        const s = k / K, ch = c0 * (1 - 0.86 * Math.pow(s, 1.5)), th = t0 * (1 - 0.8 * s), off = lean * c0 * s * s * 1.3, y = by + hgt * s;
        const jl = r.range(-0.07, 0.07) * c0, jt = r.range(-0.1, 0.1) * c0, jr = r.range(-0.2, 0.2);
        const P = (along, across) => pos.push(bx + cx * (off + along) - cz * across, y + r.range(-0.3, 0.3), bz + cz * (off + along) + cx * across);
        P(ch * 0.5 + jl, 0); P(ch * jr, th); P(-ch * 0.5 + jt, 0); P(ch * (jr - 0.1), -th);
        if (k > 0) for (let e = 0; e < 4; e++) { const a = o + (k - 1) * 4 + e, b = o + (k - 1) * 4 + ((e + 1) % 4), c = a + 4, d = b + 4; idx.push(a, c, b, b, c, d); }
      }
      const tip = pos.length / 3; pos.push(bx + cx * lean * c0 * 1.45, by + hgt * 1.07, bz + cz * lean * c0 * 1.45);
      for (let e = 0; e < 4; e++) idx.push(o + K * 4 + e, tip, o + K * 4 + ((e + 1) % 4));
      bladeSpots.push(V3(bx, by + hgt, bz));
    };
    for (let i = 0, tries = 0; i < 11 && tries < 300; tries++) {
      const side = i % 2 ? 1 : -1, hero = i < 2;
      const z = hero ? rng.range(70, 150) : rng.range(-40, 250), d = hero ? rng.range(26, 40) : rng.range(24, 95);
      const x = rx(z) + side * (hw(z) + d);
      if (Math.abs(z) < 26 || z < cliffZ(x) + 18) continue;
      if (bladeSpots.some((q) => Math.hypot(q.x - x, q.z - z) < 16)) continue;
      blade(x, z, hero ? rng.range(26, 36) : rng.range(11, 30)); i++;
      for (let k = rng.int(0, 2); k > 0; k--) blade(x + rng.range(-7, 7), z + rng.range(-7, 7), rng.range(5, 12));     // shards at its foot
    }
    // the world may stand more blades on its own ground: [[x, groundY, z, height], ...]. Each is shaped from its own place,
    // so a sail keeps its shape whatever else the world stands or leaves out
    for (const b of (opts.bladeSpots ? opts.bladeSpots(hookLayout) : [])) blade(b[0], b[2], b[3], b[1], placeRng('forge-sail', b[0], b[2]));
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const mat = new THREE.ShaderMaterial({
      fog: true, side: THREE.DoubleSide,
      uniforms: lightU(),
      vertexShader: /* glsl */`
        ${VERT_HEAD}
        void main(){ vec3 P = position, N = normal; ${VERT_TAIL} }`,
      fragmentShader: /* glsl */`
        varying vec3 vP; varying vec3 vN; varying vec3 vCam;
        #include <fog_pars_fragment>
        ${GLSL_LIGHT}
        ${GLSL_NOISE}
        void main(){
          vec3 P = vP; float dist = length(vCam - P); vec3 V = (vCam - P) / dist;
          vec3 N = normalize(cross(dFdx(P), dFdy(P))); if (dot(N, V) < 0.0) N = -N;
          // conchoidal fracture ripples
          vec2 q = vec2(dot(P.xz, vec2(0.71, 0.71)), P.y) * 0.3; vec2 vc = voro(q);
          float rip = sin(vc.x * 24.0) * smoothstep(0.0, 0.3, vc.y);
          N = normalize(N + vec3(rip, rip * 0.6, -rip) * 0.03);
          vec3 R = reflect(-V, N);
          float fres = 0.05 + 0.95 * pow(1.0 - max(dot(N, V), 0.0), 4.0);
          vec3 toF = normalize(uEB[6] - P);
          vec3 env = uAmbHi * 1.2 * smoothstep(0.0, 0.7, R.y) + mix(uLavaCol, uHotCol, 0.3) * (0.4 * smoothstep(0.02, -0.3, R.y) + 2.5 * smoothstep(0.93, 0.995, dot(R, toF)));
          fres = max(fres, 0.1);
          float edge = 1.0 - max(dot(N, V), 0.0);
          vec3 col = forgeShade(P, N, V, vec3(0.03, 0.025, 0.04), 0.95, 1.0) + uMoonCol * (0.012 + 0.07 * edge * edge) + env * fres + uMoonCol * fres * (0.1 + 0.9 * pow(max(dot(R, uMoonDir), 0.0), 8.0)) * smoothstep(0.0, 0.6, dot(N, uMoonDir) + 0.3);   // black glass: moon sheen only near the mirror direction
          gl_FragColor = vec4(col, 1.0);
          #include <fog_fragment>
        }`,
    });
    const mesh = new THREE.Mesh(geo, mat); mesh.name = 'forge-blades'; root.add(mesh);
  }
  await ctx.yield();

  // ---------- anchors ----------
  const riverPt = (z, y) => V3(rx(z), y, z);
  const anchors = {
    portalSeat: { position: V3(0, 11, 2), facing: V3(0, 0, 1), radius: 7 },
    flyThrough: [riverPt(420, 26), riverPt(330, 20), riverPt(250, 15), riverPt(190, 12.5), V3(0, 11.5, 132), V3(0, 11, 90), V3(0, 11, 45), V3(0, 11, 2)],
    viewpoints: { far: riverPt(520, 34), mid: riverPt(260, 16), close: V3(0, 11, 110), deck: V3(-70, S.deck + 16, 46) },
    lookAt: V3(0, 60, ZT), archApex: V3(-S.lean * 3, APEX, 0), bridgeDeck: V3(0, yt(0) + 1, 0),
    fallLip: V3(0, HT, ZT + 1), fallFoot: V3(0, 0, ZT + 13.5), poolCenter: V3(0, 0, -62), poolRadius: 45,
    vent: VENT.clone(), fountainTop: V3(VENT.x + S.tilt * S.fountH, FTOP, CZ), terraceY: HT, coneCenter: V3(0, HT, CZ), coneRadius: CRAD,
    plumeBase: V3(VENT.x, VENT.y + S.fountH * 0.42, CZ), plumeDrift: V3(WIND.x, 0, WIND.y),
    riverStart: { position: riverPt(300, 0), direction: V3(rx(300) - rx(290), 0, 10).normalize(), width: hw(300) * 2 },
    banks: { left: V3(-(hw(165) + 34) + rx(165), groundH(rx(165) - hw(165) - 34, 165), 165), right: V3(rx(205) + hw(205) + 34, groundH(rx(205) + hw(205) + 34, 205), 205) },
    blades: bladeSpots,
    emitters: EA.map((a, i) => ({ position: a.clone().lerp(EB[i], 0.5), color: lavaCol.clone().lerp(hotCol, EP[i].w), intensity: baseI[i], radius: EP[i].x })),
    moonDirDefault: moonDir.clone(),
  };

  let surgeT = 0.35, surgeU = -1;   // surgeU: the place setProgress was last given (-1: none yet)
  return {
    object: root, radius: 300, height: FTOP, center: V3(0, 120, -210), anchors,
    uniforms: U, ground: true, groundY: -0.5,
    // for the world around it: reuse the terrain / river materials on its own meshes, the shared GLSL and the layout functions
    materials: shared, glsl: { noise: GLSL_NOISE, light: GLSL_LIGHT, fogFade: GLSL_FOG_FADE, lavaFlow: lavaFlowGLSL, vertHead: VERT_HEAD, vertTail: VERT_TAIL },
    lightUniforms: lightU, lavaUniforms: lavaMatU, rockTint,
    layout: { rx, hw, cliffZ, groundH, meander: S.meander, wind: WIND, terraceY: HT, coneZ: CZ },
    // the surge eases toward its target by the clock step alone: at a step of 0 (a pause, the frame after a crossing, a still drawn twice)
    // it stays exactly where it is. The first time a place is given, and when the place jumps further than a flight goes in one step
    // (a still, a place posed afresh; a hurried flight at the fastest Pace makes 0.013 of the route in its longest step), it is put at its target at once
    setProgress(u) { surgeT = 0.35 + 0.4 * sst(0.72, 0.97, u); if (Math.abs(u - surgeU) > 0.04) U.surge.value = surgeT; surgeU = u; },
    update(dt, time, camera) {
      U.time.value = time;
      if (dt > 0) U.surge.value += (surgeT - U.surge.value) * Math.min(1, dt * 1.5);
      root.updateWorldMatrix(true, false);
      U.inv.value.copy(root.matrixWorld).invert();
      // the lava light breathes: fountain gushes, fall and river flicker
      const g = 0.85 + 0.15 * Math.sin(time * 0.83) + 0.06 * Math.sin(time * 5.3) * Math.sin(time * 1.9);
      for (let i = 0; i < EP.length; i++) {
        const f = i === 6 ? g * (0.75 + 0.7 * U.surge.value) : 0.93 + 0.07 * Math.sin(time * (1.7 + i * 0.37) + i * 2.1);
        EP[i].y = baseI[i] * f;
      }
    },
    dispose() {},
  };
}
