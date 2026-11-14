// THE STORM BANDS: a glide through the upper atmosphere of a gas giant.
// Cream cloud rolls run like plough lines to the horizon with rust-floored rifts between them, mushroom
// towers stand on the deck like chess pieces, a pod of Floaters drifts across the route, and the deck
// ends at the rim of the Eye (src/parts/storm-bands.js), a 1600 m cyclone with the exit portal over its well.
// World space == the hero's local space: the Eye's centre is the origin, travel is toward -Z.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField, makeCloudFieldAsync, skyDirection } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/storm-bands.js';

const PALETTE = ['#1a2a5a', '#e8c79a', '#f6e9d2', '#c9743a', '#7a3a2a', '#2a1a2a', '#6fffe0'];
const TAU = Math.PI * 2;
const PERIOD = 370;                 // roll spacing (120 m rolls, 250 m rifts)
const FLOOR_Y = -260;               // the rust floor seen through the rifts (shallow enough that the route can see it with the horizon in frame)
const RT = 75, HD = 60, FLARE = 42; // roll section: dome half-width, dome height, how far the walls flare out at the floor
const L1 = 520, L2 = 190;           // noise wavelengths (m per texture tile)
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// ---- layout shared by JS and GLSL: every roll follows the same gentle meander (period 2400 m, so wrapped puffs stay on it)
const meanderJS = (lay, z) => lay.m1 * Math.sin(z * TAU / 1200 + lay.p1) + lay.m2 * Math.sin(z * TAU / 800 + lay.p2);
const rollXJS = (lay, x, z) => { const q = x - meanderJS(lay, z) - lay.x0; return q - Math.round(q / PERIOD) * PERIOD; };

const GLSL_LAYOUT = /* glsl */`
uniform vec4 uLay;      // x0, period, meander amp 1, amp 2
uniform vec2 uLayPh;
float meander(float z) { return uLay.z * sin(z * 0.005235988 + uLayPh.x) + uLay.w * sin(z * 0.007853982 + uLayPh.y); }
float rollX(vec2 xz) { float x = xz.x - meander(xz.y) - uLay.x; return x - floor(x / uLay.y + 0.5) * uLay.y; }
float halfW(float y) { return ${RT.toFixed(1)} + ${FLARE.toFixed(1)} * pow(clamp((-y - ${HD.toFixed(1)}) / ${(-FLOOR_Y - HD).toFixed(1)}, 0., 1.), 1.3); }
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
`;

// ---------------------------------------------------------------------------------------------
// The cream deck: long cloud rolls, displaced and shaded like the Eye so the two read as one sky
// ---------------------------------------------------------------------------------------------
// section parameter: 45% of the vertices on the dome, 35% on the top 150 m of the wall (what the camera sees), the rest below
const secT = (v) => { const t = Math.abs(v), q = t < 0.45 ? t / 0.45 * 0.5 : t < 0.8 ? 0.5 + (t - 0.45) / 0.35 * 0.2 : 0.7 + (t - 0.8) / 0.2 * 0.3; return v < 0 ? -q : q; };
async function buildRolls(ctx, U, lay, rolls, rings = []) {
  const pos = [], inf = [], idx = [], ring = [];
  for (const R of rolls) {
    const NS = R.near ? 48 : 10, zs = [];
    if (R.near) { let z = 2700; while (z > -3900) { zs.push(z); z -= (z <= 1960 && z > 180) ? 14 : 70; } }
    else for (let z = 2700; z > -3900; z -= 95) zs.push(z);
    zs.push(-3900);
    const base = pos.length / 3, W = NS + 1;
    for (let i = 0; i < zs.length; i++) for (let j = 0; j <= NS; j++) {
      pos.push(R.x, secT((j / NS) * 2 - 1), zs[i]);
      inf.push(R.hash, R.flow, R.near ? 1 : 0.25); ring.push(0);
    }
    const ax = Math.max(Math.abs(R.x) - 190, 0);
    for (let i = 0; i < zs.length - 1; i++) {
      const za = Math.min(Math.abs(zs[i]), Math.abs(zs[i + 1]));
      if (Math.hypot(ax, za) < 800 && Math.hypot(Math.abs(R.x) + 190, Math.max(Math.abs(zs[i]), Math.abs(zs[i + 1]))) < 840) continue;   // wholly inside the Eye
      for (let j = 0; j < NS; j++) { const a = base + i * W + j, b = a + 1, c = a + W, d = c + 1; idx.push(a, b, c, b, d, c); }
    }
    await ctx.yield();   // one roll at a time (no draw is taken in here)
  }
  // circular rolls: the banded flow wraps round the Eye as a collar (position.z = angle, 0 on the +Z side)
  for (const R of rings) {
    await ctx.yield();   // one ring at a time: each is as big as a near roll
    const NS = 40, W = NS + 1, th = [], base = pos.length / 3;
    for (let a = -Math.PI; a < Math.PI;) { th.push(a); a += Math.abs(a) < 0.95 ? 14 / R.R : 0.05; }
    th.push(Math.PI);
    for (let i = 0; i < th.length; i++) for (let j = 0; j <= NS; j++) { pos.push(0, secT((j / NS) * 2 - 1), th[i]); inf.push(R.hash, R.flow, 1); ring.push(R.R); }
    for (let i = 0; i < th.length - 1; i++) for (let j = 0; j < NS; j++) { const a = base + i * W + j, b = a + 1, c = a + W, d = c + 1; idx.push(a, b, c, b, d, c); }
  }
  await ctx.yield();
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aRoll', new THREE.Float32BufferAttribute(inf, 3));
  geo.setAttribute('aRing', new THREE.Float32BufferAttribute(ring, 1));
  geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 9000);
  const mat = new THREE.ShaderMaterial({
    fog: true, uniforms: { ...U, ...fogU() },
    vertexShader: /* glsl */`
      ${GLSL_LAYOUT}
      attribute vec3 aRoll; attribute float aRing;
      uniform sampler2D uTexA, uTexB; uniform float uTime;
      varying vec4 vUv; varying vec3 vN0, vTs, vTz, vWorld; varying vec2 vAmp;
      #include <fog_pars_vertex>
      void main() {
        float s = position.y, t = abs(s), sg = s < 0. ? -1. : 1., z = position.z;
        vec3 across = vec3(1., 0., 0.), along = vec3(0., 0., 1.); vec2 c = vec2(position.x + meander(z), z);
        if (aRing > 0.5) { across = vec3(sin(z), 0., cos(z)); along = vec3(cos(z), 0., -sin(z)); c = across.xz * aRing; z *= aRing; }
        vec2 sec, nrm; float arc;
        if (t < 0.5) {
          float a = t * 3.14159265;
          sec = vec2(${RT.toFixed(1)} * sin(a), -${HD.toFixed(1)} * (1. - cos(a)));
          nrm = normalize(vec2(${HD.toFixed(1)} * sin(a), ${RT.toFixed(1)} * cos(a)));
          arc = t * 200.;
        } else {
          float q = (t - 0.5) * 2.;
          sec = vec2(${RT.toFixed(1)} + ${FLARE.toFixed(1)} * pow(q, 1.3), -${HD.toFixed(1)} - ${(-FLOOR_Y - HD + 30).toFixed(1)} * q);
          nrm = normalize(vec2(${(-FLOOR_Y - HD).toFixed(1)}, 1.3 * ${FLARE.toFixed(1)} * pow(max(q, 1e-3), 0.3)));
          arc = 100. + q * 350.;
        }
        float zf = z - aRoll.y * uTime;
        vec4 uv = vec4(zf / ${L1.toFixed(1)} + aRoll.x * 7.1, sg * arc / ${L1.toFixed(1)} + aRoll.x * 3.3,
                       zf / ${L2.toFixed(1)} + aRoll.x * 5.7, sg * arc / ${L2.toFixed(1)} + aRoll.x * 9.1);
        // the walls are sampled more coarsely than the crest, so their relief is taken from blurrier mips (no strata)
        float wl = smoothstep(0.46, 0.72, t);
        float hA = textureLod(uTexA, uv.xy, mix(2., 3.2, wl)).r, hB = textureLod(uTexB, uv.zw, mix(3.5, 4.6, wl)).r;
        float amp = mix(27., 15., smoothstep(0.42, 0.9, t));
        float h = amp * ((hA - 0.5) * 1.5 + (hB - 0.45) * 0.9 * aRoll.z * (1. - 0.45 * wl));
        float wS = 1. + 0.17 * sin(z * 0.0047 + aRoll.x * 20.) + 0.08 * sin(z * 0.0131 + aRoll.x * 51.);
        vec3 p = vec3(c.x, sec.y + nrm.y * h, c.y) + across * (sg * (sec.x * mix(wS, 1., smoothstep(0.5, 1., t)) + nrm.x * h));
        if (aRing > 0.5) p.y += 12.; else p.y -= 135. * smoothstep(1065., 905., length(p.xz));   // straight rolls dive under the collar
        vUv = uv; vAmp = vec2(amp, aRoll.z);
        vN0 = across * (sg * nrm.x) + vec3(0., nrm.y, 0.); vTs = across * nrm.y + vec3(0., -sg * nrm.x, 0.); vTz = along;
        vWorld = p;
        vec4 mvPosition = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uTexA, uTexB; uniform vec2 uGradScale; uniform float uTime;
      uniform vec3 uSunDir, uSunCol, uIndigo, uTan, uCream, uRust, uRustDark, uPlum, uBoltCol;
      uniform vec4 uFlash[4];
      varying vec4 vUv; varying vec3 vN0, vTs, vTz, vWorld; varying vec2 vAmp;
      #include <fog_pars_fragment>
      void main() {
        vec4 sa = texture2D(uTexA, vUv.xy), sb = texture2D(uTexB, vUv.zw), sc = texture2D(uTexB, vUv.zw * 2.7 + 0.37);
        vec2 gA = (sa.gb * 2. - 1.) * uGradScale.x, gB = (sb.gb * 2. - 1.) * uGradScale.y, gC = (sc.gb * 2. - 1.) * uGradScale.y;
        float dz = vAmp.x * (1.5 * gA.x / ${L1.toFixed(1)} + 0.9 * gB.x / ${L2.toFixed(1)});
        float ds = vAmp.x * (1.5 * gA.y / ${L1.toFixed(1)} + 0.9 * gB.y / ${L2.toFixed(1)});
        vec3 n0 = normalize(vN0), ts = normalize(vTs), tz = normalize(vTz);
        float depth = clamp(-vWorld.y / 400., 0., 1.);
        float wallK = 1. - 0.7 * smoothstep(0.06, 0.2, depth);                                  // rift walls: soft vapour, not marbled rock
        vec2 sl = vec2(ds, dz) * 0.95 * wallK; sl /= 1. + length(sl) * 0.9;                       // soft-limited slope: billows, not crags
        vec3 N = normalize(n0 - ts * sl.x - tz * sl.y);
        vec2 sf = vec2(gC.y, gC.x) * 0.16 * vAmp.y * wallK; sf /= 1. + length(sf) * 1.5;
        N = normalize(N - ts * sf.x - tz * sf.y);

        float hN = clamp((sa.r - 0.5) * 1.5 + (sb.r - 0.45) * 0.9, -1., 1.) * 0.5 + 0.5;
        float ao = smoothstep(0.15, 0.7, hN);
        // cream crests, tan folds, rust and then dark rust down the rift walls: broad soft gradients, no speckle
        vec3 alb = mix(uTan, uCream, smoothstep(0.2, 0.62, hN + (sc.r - 0.5) * 0.25));
        alb *= mix(0.8, 1., smoothstep(0.08, 0.5, sc.r));                                         // cauliflower creases
        alb = mix(alb, mix(uTan, uRust, 0.8), smoothstep(0.07, 0.3, depth));
        alb = mix(alb, uRustDark, smoothstep(0.3, 0.85, depth));
        alb *= 0.72 * mix(0.9, 1., sc.a);

        vec3 sunL = normalize(uSunDir);
        vec3 Ns = normalize(n0 - ts * sl.x * 0.4 - tz * sl.y * 0.4);                              // the broad form carries the terminator: one clean edge per billow, no speckle
        float ndl = mix(dot(N, sunL), dot(Ns, sunL), 0.85);
        float wallW = smoothstep(0.03, 0.2, depth);                                              // walls take a broad, vaporous terminator
        float lit = smoothstep(mix(-0.02, -0.3, wallW), mix(0.3, 0.6, wallW), ndl) * mix(0.3, 1., ao);
        // the neighbouring roll shades the wall: the wall that faces the sun keeps its light further down
        float sunSide = smoothstep(0.1, 0.6, dot(n0.xz, normalize(sunL.xz)));
        lit *= 1. - smoothstep(mix(0.03, 0.2, sunSide), mix(0.3, 0.55, sunSide), depth) * 0.95;
        vec3 shade = mix(uPlum * 0.9, uRust * 0.4 + uRustDark * 0.25 + uPlum * 0.5, ao);                         // crisp terminators into rust and plum
        shade = mix(shade, alb * mix(uRust, uTan, 0.45) * 0.78, 0.2 * (1. - smoothstep(0.08, 0.5, depth)));
        shade += uIndigo * 0.22 * clamp(N.y, 0., 1.);
        shade = mix(shade, uIndigo * 0.9 + uRustDark * 0.3, smoothstep(0.06, 0.45, depth) * 0.95);  // rifts fall to indigo
        vec3 col = alb * uSunCol * lit + shade * (1. - lit * 0.85) * (0.5 + 0.6 * alb.r);
        col += uRust * (lit * (1. - lit)) * 0.35;                                                // warm bleed along the terminator
        vec3 V = normalize(cameraPosition - vWorld);
        col += uCream * pow(1. - clamp(dot(N, V), 0., 1.), 3.) * 0.12 * lit;                     // powdery edges
        for (int i = 0; i < 4; i++) {                                                            // lightning from inside the rift
          vec3 d = uFlash[i].xyz - vWorld; float dist = length(d);
          col += uBoltCol * (uFlash[i].w * exp(-dist / 170.) * mix(0.45, 1., sb.r) * 2.6);
        }
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'deck-rolls'; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// The rust floor 400 m down: slow banded flow, sun strips under the rifts, lightning lighting it from inside
// ---------------------------------------------------------------------------------------------
function buildFloor(U) {
  const geo = new THREE.PlaneGeometry(13000, 13000, 1, 1).rotateX(-Math.PI / 2);
  const mat = new THREE.ShaderMaterial({
    fog: true, uniforms: { ...U, ...fogU() },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vWorld = (modelMatrix * vec4(position, 1.)).xyz;
        vec4 mvPosition = viewMatrix * vec4(vWorld, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LAYOUT}
      uniform sampler2D uTexA, uTexB; uniform vec2 uGradScale; uniform float uTime, uStorm;
      uniform vec3 uSunDir, uSunCol, uIndigo, uTan, uCream, uRust, uRustDark, uPlum, uBoltCol;
      uniform vec4 uFlash[4];
      varying vec3 vWorld;
      #include <fog_pars_fragment>
      void main() {
        vec2 p = vWorld.xz;
        if (length(p) < 640.) discard;                               // under the Eye nothing is ever seen
        vec4 a = texture2D(uTexA, vec2(p.x / 760., p.y / 2300. + uTime * 0.0035));
        vec4 b = texture2D(uTexB, vec2(p.x / 240. + a.r * 0.25, p.y / 520. - uTime * 0.011));
        float band = a.r * 0.75 + b.r * 0.45 + (a.a - 0.5) * 0.3;
        vec3 alb = mix(uRustDark * 0.85, uRust, smoothstep(0.3, 0.85, band));
        alb = mix(alb, uPlum * 1.6, smoothstep(0.5, 0.22, band) * 0.8);
        vec2 g = (b.gb * 2. - 1.) * uGradScale.y;
        vec3 N = normalize(vec3(-g.x * 0.5, 1., -g.y * 0.25));
        vec3 sunL = normalize(uSunDir);
        // sunlight only reaches the floor through the rifts: march the ray back up past the roll above
        float lit = 1.;
        vec2 sh = sunL.xz / max(sunL.y, 0.2);
        for (int i = 0; i < 3; i++) {
          float y = ${FLOOR_Y.toFixed(1)} * (0.82 - 0.3 * float(i));
          float xr = abs(rollX(p + sh * (y - ${FLOOR_Y.toFixed(1)})));
          float hw = halfW(y);
          lit *= smoothstep(hw - 6., hw + 34., xr);
        }
        lit *= smoothstep(0.1, 0.7, dot(N, sunL)) * (0.6 + 0.5 * b.r);
        // billowing rust cloud, dark where it meets the rift walls, smouldering from inside
        vec4 c = texture2D(uTexB, vec2(p.x / 95. + b.r * 0.3, p.y / 230. - uTime * 0.018));
        float occl = smoothstep(${(RT + FLARE - 6).toFixed(1)}, ${(RT + FLARE + 66).toFixed(1)}, abs(rollX(p)));
        vec3 col = alb * (0.3 + 0.35 * b.r) * (0.55 + 0.9 * c.r) + alb * uSunCol * lit * 0.5;
        col += uRust * 0.55 * pow(b.r, 3.) * (0.6 + 0.4 * sin(uTime * 0.4 + a.r * 9.)) * (0.4 + c.r);
        col *= mix(0.1, 1., occl);
        // sheet lightning walking through the floor cloud, cell by cell
        vec2 cq = p / 380., cid = floor(cq);
        float tk = uTime * 0.85 + hash21(cid) * 9., k = floor(tk), f = fract(tk);
        float on = step(0.93 - uStorm * 0.08, hash21(cid + k * 17.3));
        vec2 cp = (cid + 0.5 + (vec2(hash21(cid + k), hash21(cid - k * 3.1)) - 0.5) * 0.3) * 380.;
        vec2 ce = abs(fract(cq) - 0.5);
        float sheet = on * smoothstep(0., 0.09, f) * exp(-f * 5.) * (0.75 + 0.25 * sin(f * 40.)) * exp(-length(p - cp) / 95.) * (1. - smoothstep(0.34, 0.5, max(ce.x, ce.y)));
        col = mix(col, uIndigo * 0.5 + uPlum * 0.3, 0.12);
        col += uBoltCol * sheet * (0.6 + 1.6 * b.r) * 4. * mix(0.3, 1., occl);
        for (int i = 0; i < 4; i++) {
          float dist = length(uFlash[i].xyz - vWorld);
          col += uBoltCol * (uFlash[i].w * exp(-dist / 210.) * (0.5 + b.r) * 3.2);
        }
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = FLOOR_Y; mesh.name = 'rust-floor'; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// Amber haze sheets sliding along the rifts, two levels
// ---------------------------------------------------------------------------------------------
function buildVeils(U) {
  const geo = new THREE.BufferGeometry();
  const S = 4200, ys = [-90, -170], P = [], I = [];
  ys.forEach((y, i) => { P.push(-S, y, -S, S, y, -S, S, y, S, -S, y, S); const b = i * 4; I.push(b, b + 2, b + 1, b, b + 3, b + 2); });
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 9000);
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, uniforms: { ...U, ...fogU() },
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      #include <fog_pars_vertex>
      void main() {
        vWorld = position;
        vec4 mvPosition = viewMatrix * vec4(position, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      ${GLSL_LAYOUT}
      uniform sampler2D uTexA, uTexB; uniform float uTime, uVeil;
      uniform vec3 uSunCol, uTan, uCream, uRust, uIndigo;
      varying vec3 vWorld;
      #include <fog_pars_fragment>
      void main() {
        vec2 p = vWorld.xz;
        float lvl = step(-130., vWorld.y), dir = lvl * 2. - 1.;
        float hw = halfW(vWorld.y), xr = abs(rollX(p));
        float m = smoothstep(hw + 6., hw + 58., xr) * smoothstep(1150., 1290., length(p));
        float a = texture2D(uTexA, vec2(p.x / 330. + lvl * 0.37, p.y / 1500. + dir * uTime * 0.012)).r;
        float b = texture2D(uTexB, vec2(p.x / 140., p.y / 620. + dir * uTime * 0.021 + lvl * 0.5)).r;
        float alpha = m * smoothstep(0.52, 0.95, a * 0.75 + b * 0.55) * uVeil * mix(0.24, 0.07, lvl);
        float dC = length(cameraPosition - vWorld);
        alpha *= smoothstep(60., 160., dC);
        vec3 col = mix(uRust * 0.45 + uIndigo * 0.3, uTan * 0.7 + uRust * 0.15, lvl * 0.6 + b * 0.3) * (0.4 + 0.35 * lvl);
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'rift-veils'; mesh.frustumCulled = false; mesh.renderOrder = 1;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// The ring arch: a camera-following band of many thin lines, horizon to horizon, crossing the route ahead
// ---------------------------------------------------------------------------------------------
function buildRing(rng, U, latDeg, bright) {
  const N = 512, data = new Uint8Array(N * 4);
  // radial structure: broad ringlets, a wide gap, hundreds of thin lines
  const gap = rng.range(0.52, 0.66), gap2 = rng.range(0.18, 0.3);
  const coarse = [], fine = [];
  for (let i = 0; i < 26; i++) coarse.push(rng()); for (let i = 0; i < 140; i++) fine.push(rng());
  const samp = (arr, x) => { const f = x * (arr.length - 1), k = Math.min(Math.floor(f), arr.length - 2), q = f - k, e = q * q * (3 - 2 * q); return arr[k] * (1 - e) + arr[k + 1] * e; };
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1), w = samp(coarse, t), v = samp(fine, t);
    let d = (0.16 + 0.62 * w * w) * (0.62 + 0.38 * v);
    d *= 1 - 0.92 * Math.exp(-Math.pow((t - gap) / 0.03, 2));
    d *= 1 - 0.7 * Math.exp(-Math.pow((t - gap2) / 0.015, 2));
    d *= smoothstep(0, 0.1, t) * smoothstep(1, 0.86, t) * (0.5 + 0.5 * smoothstep(0.08, 0.45, t));
    const warm = 0.5 + 0.5 * Math.sin(t * 9 + w * 2);
    data[i * 4] = 255 * clamp(d, 0, 1); data[i * 4 + 1] = 255 * warm; data[i * 4 + 2] = 0; data[i * 4 + 3] = 255;
  }
  const tex = new THREE.DataTexture(data, N, 1, THREE.RGBAFormat);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter; tex.wrapS = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  // The rings as they really look from inside the atmosphere: circles in the planet's equatorial plane seen from latitude
  // `latDeg`, projected onto a camera-following dome. Not a great circle, so the band is a true arch that comes down to the
  // limb on both sides (a great circle would project as a straight bar).
  const SEG = 128, R = 5200, lat = latDeg * Math.PI / 180, cl = Math.cos(lat), sl = Math.sin(lat), RHO = [1.78, 2.34];
  const l0 = Math.asin(1 / (RHO[0] * cl)) - 0.2;            // a little below where the inner edge meets the horizon
  const pos = [], uv = [], idx = [], d = V3();
  for (let i = 0; i <= SEG; i++) {
    const l = l0 + (Math.PI - 2 * l0) * i / SEG;
    for (let k = 0; k < 2; k++) {
      d.set(RHO[k] * Math.cos(l), -1 + RHO[k] * Math.sin(l) * cl, -RHO[k] * Math.sin(l) * sl).normalize().multiplyScalar(R);
      pos.push(d.x, d.y, d.z); uv.push(l, k);
    }
    if (i < SEG) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uRing: { value: tex }, uNoise: U.uNoise, uTime: U.uTime, uCream: U.uCream, uTan: U.uTan, uBright: { value: bright } },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying float vEl;
      void main() {
        vUv = uv; vEl = normalize(position).y;
        vec4 mv = viewMatrix * vec4(position + cameraPosition, 1.);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uRing, uNoise; uniform float uTime, uBright; uniform vec3 uCream, uTan;
      varying vec2 vUv; varying float vEl;
      void main() {
        vec4 r = texture2D(uRing, vec2(vUv.y, 0.5));
        // ringlets shear slowly past each other (inner lanes orbit faster)
        float lane = floor(vUv.y * 40.);
        float cl = texture2D(uNoise, vec2(vUv.x * 2.2 + uTime * (0.004 + 0.006 * fract(lane * 0.371)), lane * 0.137)).r;
        float d = r.r * (0.78 + 0.44 * cl);
        vec3 col = mix(uTan * 1.25, vec3(1., 0.97, 0.92), r.g * 0.7 + 0.2) * d * uBright;
        col *= smoothstep(0.0, 0.075, vEl);                           // sinks into the limb haze
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'ring-arch'; mesh.frustumCulled = false; mesh.renderOrder = 0;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// Aerial kelp: strings of gas bladders hanging 130-220 m in the still air, olive and gold, swaying from the top
// strings: [{ x, top, z, len, phase }]
// ---------------------------------------------------------------------------------------------
function buildBladders(rng, U, strings) {
  const sph = new THREE.SphereGeometry(1, 10, 8), cyl = new THREE.CylinderGeometry(1, 1, 1, 5, 1, true).translate(0, 0.5, 0);
  const P = [], K = [], I = [];
  for (let i = 0; i < sph.attributes.position.count; i++) { P.push(sph.attributes.position.getX(i), sph.attributes.position.getY(i), sph.attributes.position.getZ(i)); K.push(0); }
  for (let i = 0; i < sph.index.count; i++) I.push(sph.index.array[i]);
  const off = sph.attributes.position.count;
  for (let i = 0; i < cyl.attributes.position.count; i++) { P.push(cyl.attributes.position.getX(i), cyl.attributes.position.getY(i), cyl.attributes.position.getZ(i)); K.push(1); }
  for (let i = 0; i < cyl.index.count; i++) I.push(off + cyl.index.array[i]);
  sph.dispose(); cyl.dispose();
  const iA = [], iB = [];
  for (const s of strings) {
    const n = Math.round(s.len / rng.range(5.5, 7)), step = s.len / n;
    for (let j = 0; j < n; j++) {
      const t = j / (n - 1);
      // a big float on top, a run of small beads, swelling again toward the free end
      // a big float on top, runs of small beads broken by fat bladders, swelling again toward the free end
      let r = j === 0 ? rng.range(4.6, 6.4) : (0.6 + 1.9 * Math.pow(Math.sin(t * Math.PI * (2.5 + s.phase)) * 0.5 + 0.5, 1.8) + rng.range(0, 0.5)) * (1 - 0.25 * t);
      if (j > 2 && rng.chance(0.09)) r = rng.range(2.8, 4.2);
      iA.push(s.x, s.top - j * step, s.z, r);
      iB.push(s.phase, t, j === 0 ? 0 : step, rng());
    }
    // thin filaments trailing from the free end and from the big float (drawn by the link cylinder of a zero-size bead)
    for (let f = 0, nf = rng.int(3, 4); f < nf; f++) {
      const top = f === 0, len = top ? rng.range(18, 30) : rng.range(28, 60), y0 = top ? s.top - 3 : s.top - s.len + rng.range(0, 14);
      iA.push(s.x + rng.range(-1.6, 1.6), y0 - len, s.z + rng.range(-1.6, 1.6), 0.001);
      iB.push(s.phase, (top ? 0.012 : 1 - (y0 - (s.top - s.len)) / s.len) + len * 0.004, len, rng());
    }
  }
  const count = iA.length / 4;
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  geo.setAttribute('aKind', new THREE.Float32BufferAttribute(K, 1));
  geo.setIndex(I);
  geo.setAttribute('iA', new THREE.InstancedBufferAttribute(new Float32Array(iA), 4));
  geo.setAttribute('iB', new THREE.InstancedBufferAttribute(new Float32Array(iB), 4));
  geo.instanceCount = count;
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 9000);
  const mat = new THREE.ShaderMaterial({
    fog: true, uniforms: { ...U, ...fogU() },
    vertexShader: /* glsl */`
      attribute float aKind; attribute vec4 iA, iB;
      uniform float uTime;
      varying vec3 vN, vWorld, vL; varying vec4 vI; varying float vKind;
      #include <fog_pars_vertex>
      vec3 sway(vec3 p, float t, float ph) {
        float w = t * t * 11. + t * 3.;
        p.x += sin(uTime * 0.31 + ph * 40. + t * 2.6) * w + sin(uTime * 0.07 + ph * 13.) * 5.;
        p.z += cos(uTime * 0.26 + ph * 23. + t * 2.1) * w + cos(uTime * 0.06 + ph * 29.) * 5.;
        p.y += sin(uTime * 0.2 + ph * 51.) * 2.5;
        return p;
      }
      void main() {
        float r = iA.w, t = iB.y;
        vec3 p; vec3 n;
        if (aKind < 0.5) {
          float breathe = 1. + 0.06 * sin(uTime * 0.9 + iB.w * 6.28 - t * 9.);
          p = iA.xyz + position * vec3(r, r * 1.5, r) * breathe; n = normalize(position * vec3(1., 0.67, 1.));
        } else {
          float wd = max(0.2, distance(cameraPosition, iA.xyz) * 0.0013);                  // links stay at least ~1.5 px wide
          p = iA.xyz + vec3(position.x * wd, position.y * iB.z, position.z * wd); n = normalize(vec3(position.x, 0., position.z));
        }
        p = sway(p, clamp(t - (p.y - iA.y) * 0.004, 0., 1.), iB.x);
        vN = n; vWorld = p; vI = vec4(iB.x, t, iB.w, r); vKind = aKind; vL = position;
        vec4 mvPosition = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uTexA; uniform float uTime; uniform vec3 uSunDir, uSunCol, uIndigo, uTan, uCream, uRust, uPlum, uCyan;
      varying vec3 vN, vWorld, vL; varying vec4 vI; varying float vKind;
      #include <fog_pars_fragment>
      void main() {
        vec3 N = normalize(vN), V = normalize(cameraPosition - vWorld), L = normalize(uSunDir);
        float ndl = dot(N, L), lit = smoothstep(-0.2, 0.4, ndl), nv = abs(dot(N, V)), fr = pow(1. - nv, 2.2);
        vec3 olive = vec3(0.13, 0.14, 0.04), gold = vec3(0.5, 0.33, 0.08);
        vec3 col;
        if (vKind > 0.5) col = olive * 0.6 * (0.35 + 0.65 * lit) * uSunCol;
        else {
          // a gas bag, not a bead: veined membrane, darker cap and gas line, translucent rim, light coming through the far side
          vec2 muv = vec2(atan(vL.x, vL.z) * 0.159 * 2. + vI.z * 7., vL.y * 0.45 + vI.z * 3.);
          vec4 m = texture2D(uTexA, muv);
          float vein = smoothstep(0.62, 0.86, m.a) * smoothstep(1.2, 2.4, vI.w);                 // only bags big enough to show it
          float gore = pow(abs(sin(atan(vL.x, vL.z) * 3.)), 14.) * smoothstep(1.6, 3., vI.w);
          vec3 alb = mix(olive, gold, smoothstep(0.4, 0.95, vI.z * 0.7 + (vL.y * 0.5 + 0.5) * 0.5 + (m.r - 0.5) * 0.4));
          alb *= 0.75 + 0.5 * m.r;
          alb = mix(alb, olive * 0.45, max(vein * 0.75, gore * 0.5));
          alb = mix(alb, olive * 0.6, smoothstep(0.55, 0.95, vL.y) * 0.7);                       // cap
          col = alb * uSunCol * lit + alb * (uPlum * 1.2 + uIndigo * 0.5) * (1. - lit);
          col += gold * smoothstep(0.3, -0.7, ndl) * 0.6 * (1. - vein * 0.7) * (0.5 + 0.5 * nv);   // sun through the bag
          col += mix(uTan, uCream, 0.5) * fr * (0.18 + 0.45 * lit);                              // membrane rim
          col += uSunCol * pow(max(dot(reflect(-L, N), V), 0.), 24.) * 0.35 * lit;               // wet highlight
          float bead = smoothstep(0.75, 1., sin(vI.y * 16. - uTime * 0.9 + vI.x * 30.));
          col += uCyan * bead * 0.7 * (0.4 + 0.6 * (1. - fr)) * (0.6 + 0.8 * vein);              // a pulse of light walking down the string
        }
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'bladder-strings'; mesh.frustumCulled = false;
  return { mesh, count, triangles: count * (I.length / 3) };
}

export default {
  id: 'storm-bands',
  name: 'The Storm Bands',
  category: 'alien',
  weirdness: 0.5,
  async build(ctx) {
    const rng = ctx.rng;
    const scene = new THREE.Scene();

    // ---------------- per-seed character
    // three clearly different planets: pale cream over indigo, ochre over teal-black, dusty rose over violet
    const mood = rng.pick(['cream', 'ochre', 'rose']);
    const pal = PALETTE.map((h) => new THREE.Color(h));
    let skyMid = '#1a2a5a', skyZen = '#060a1c', wellCol = [0.03, 0.013, 0.065], gradeTint = '#fff7ec', gradeShadow = '#17123a';
    if (mood === 'ochre') {
      pal[2].offsetHSL(0.03, 0.2, -0.09); pal[1].offsetHSL(0.03, 0.15, -0.07); pal[3].offsetHSL(0.05, 0.08, -0.02); pal[4].offsetHSL(0.045, 0.06, 0);
      gradeTint = '#fff1d0'; gradeShadow = '#0b262e';
      pal[0].offsetHSL(-0.09, 0.05, -0.03); skyMid = '#0e3040'; skyZen = '#03090e'; wellCol = [0.008, 0.03, 0.075];
    }
    if (mood === 'rose') {
      pal[2].offsetHSL(-0.035, 0.04, -0.01); pal[1].offsetHSL(-0.035, 0, -0.02); pal[3].offsetHSL(-0.028, -0.04, -0.01); pal[4].offsetHSL(-0.03, 0, 0);
      pal[5].offsetHSL(-0.04, 0.12, 0.02); pal[0].offsetHSL(0.07, 0, 0.01); gradeTint = '#fff0f1'; gradeShadow = '#26103a'; skyMid = '#2c1c5e'; skyZen = '#0a0618'; wellCol = [0.05, 0.01, 0.06];
    }
    const palHex = pal.map((c) => '#' + c.getHexString());
    // a hard sun from the left and a little behind, low enough that every right-hand flank falls into shade; never in frame
    const sunDir = skyDirection(rng.range(40, 48), -rng.range(105, 125));
    const side = rng.sign();                       // which way the entry is offset in its rift, and which side things favour
    const xR = 125 + rng.range(-14, 14);           // centre line of the rift the route follows
    const storm = rng.range(0.2, 1);               // how busy the lightning is
    const hazeK = rng.range(0.85, 1.2);
    const ringLat = rng.range(36, 46), ringBright = rng.range(0.75, 1.15);
    const lay = { x0: xR + PERIOD / 2, m1: rng.range(8, 14), m2: rng.range(4, 8), p1: rng.range(0, TAU), p2: rng.range(0, TAU) };

    // ---------------- sky: near-space dark, hard stars, amber limb haze, one to three crescent moons low ahead
    const haze = pal[1].clone().multiplyScalar(0.46 * hazeK);
    const nMoons = rng.int(1, 3), moons = [], moonK = rng.range(0.75, 1.9);
    for (let i = 0; i < nMoons; i++) {
      const size = [3.4, 1.9, 1.2][i] * rng.range(0.85, 1.2) * (i === 0 ? moonK : 2.6 - moonK);
      moons.push({ elevation: [6, 5, 11.5][i] + rng.range(-1, 1.5) + size * 0.25, azimuth: [-side * 4.5, side * 15, side * 29][i] + rng.range(-2.5, 2.5), size,
        color: ['#f1e2c8', '#d9b9a0', '#c8d4e8'][i], color2: ['#8a6c58', '#6a4a44', '#5a6480'][i], texture: 0.7,
        phase: rng.range(0.16, 0.34), phaseAngle: rng.range(105, 150), intensity: 1.5, dark: 0.02, glow: 0.12, glowColor: '#ffe2b8' });
    }
    await ctx.yield();   // the kit's sky is one long call: ask before it (takes no draw)
    const sky = makeSky({
      rng, preset: 'night', bake: true, renderer: ctx.renderer,
      zenith: skyZen, mid: skyMid, horizon: haze, ground: haze.clone().multiplyScalar(0.8), horizonPow: 36, midPow: 3.2, groundFalloff: 3,
      sunDirection: sunDir, sunColor: '#fff6ea', sunSize: 0.42, sunIntensity: 13, sunGlow: 0.25, sunGlowTight: 0.9, scatter: 0,
      stars: 1.15, twinkle: 0.22, starDensity: 1, milkyWay: 0.45, bodies: moons, key: 'sun', clouds: false, clouds2: false, lightning: 0,
    });
    scene.add(sky.object);
    const fogDensity = 0.0003 * hazeK;
    scene.fog = new THREE.FogExp2(haze, fogDensity);
    await ctx.yield();

    // ---------------- the Floater pod (absolute positions: the route past them is fixed by the Eye's fly-through).
    // Sizes are bell heights: the two the route passes between are 60-70 m and 28-35 m clear of it, the rest 90-150 m.
    const jit = (a) => rng.range(-a, a);
    const big = rng.chance(0.5);
    const pod = [
      { position: [79 + jit(3), 70 + jit(4), 1092 + jit(10)], size: big ? 68 : 60, drift: [2, 5] },                 // left of the route, eye level
      { position: [207 + jit(4), 80 + jit(5), 1040 + jit(12)], size: big ? 62 : 70, drift: [3, 6] },                // right, a little ahead
      { position: [-75 + jit(18), 118 + jit(12), 950 + jit(25)], size: rng.range(105, 128), drift: [12, 12] },
      { position: [305 + jit(14), 150 + jit(16), 1245 + jit(20)], size: rng.range(88, 108), drift: [8, 12] },
      { position: [18 + jit(14), 250 + jit(14), 846 + jit(20)], size: rng.range(98, 118), drift: [8, 10] },
      { position: [-195 + jit(18), 84 + jit(8), 1265 + jit(25)], size: rng.range(122, 150), drift: [12, 12] },
    ];
    const hero = await buildHero(ctx, { palette: palHex, sunDir: [sunDir.x, sunDir.y, sunDir.z], pod, apronCut: 872, wellColor: wellCol });
    scene.add(hero.object);
    const HU = hero.uniforms;
    await ctx.yield();

    // ---------------- route: in along a rift between two rolls (the plough lines run straight ahead), between two Floaters,
    // past the last tower on its sunlit side, over the rim, down to the seat
    const FL = hero.anchors.flyThrough, seat = hero.anchors.portalSeat.position.clone();
    const xE = xR + side * rng.range(3, 12), yE = rng.range(72, 78), Z0 = 1790;
    const path = makePath([
      [xE, yE, Z0], [xE, yE, Z0 - 95], [xR + side * 9, yE + 1, 1545], [xR + side * 4, yE + 5, 1395], [xR + 4, yE + 9, 1245],
      [136, 86, 1085], [124, 78, 955], FL[2], FL[3], FL[4],
      [12, seat.y + 9, 478], [1.5, seat.y + 1, 432], [0, seat.y, 395], seat,
    ]);
    const uRim = path.nearestXZ(FL[2].x, FL[2].z).u, uPod = path.nearestXZ(136, 1085).u;

    // ---------------- shared uniforms for everything shaded like the Eye
    const flash = [0, 1, 2, 3].map(() => new THREE.Vector4(0, -300, 0, 0));
    const U = {
      uNoise: HU.uNoise, uTexA: HU.uTexA, uTexB: HU.uTexB, uGradScale: HU.uGradScale, uTime: HU.uTime,
      uSunDir: HU.uSunDirW, uSunCol: HU.uSunCol, uIndigo: HU.uIndigo, uTan: HU.uTan, uCream: HU.uCream, uRust: HU.uRust,
      uRustDark: HU.uRustDark, uPlum: HU.uPlum, uCyan: HU.uCyan, uBoltCol: HU.uBoltCol,
      uLay: { value: new THREE.Vector4(lay.x0, PERIOD, lay.m1, lay.m2) }, uLayPh: { value: new THREE.Vector2(lay.p1, lay.p2) },
      uFlash: { value: flash }, uStorm: { value: storm }, uVeil: { value: rng.range(0.7, 1.1) },
    };

    // ---------------- the deck, the floor, the haze in the rifts
    const rolls = [];
    for (let k = -9; k <= 8; k++) {
      const x = lay.x0 + k * PERIOD;
      rolls.push({ x, hash: rng(), flow: (k & 1 ? 1 : -1) * rng.range(5, 10), near: Math.abs(x - xR) < 600 });
    }
    // three collar rolls circle the Eye where the bands are bent round it (they replace the hero's ragged apron); inner ones turn faster
    const spinS = hero.anchors.spin || 1, RINGS = [1046, 900];
    scene.add(await buildRolls(ctx, U, lay, rolls, RINGS.map((R, i) => ({ R, hash: rng(), flow: spinS * (8 + 2.6 * i + rng.range(0, 1.5)) }))));
    await ctx.yield();
    scene.add(buildFloor(U), buildVeils(U));
    scene.add(buildRing(rng.fork('ring'), U, ringLat, ringBright));
    await ctx.yield();

    // ---------------- kit clouds: fluff on the roll crests (wraps round the camera), cover for the Eye's collar, the towers
    const cloudLook = { sunDirection: sunDir, sunColor: '#fff4e2', litColor: pal[2].clone().lerp(pal[1], 0.22).multiplyScalar(0.9), shadeColor: pal[3].clone().lerp(pal[4], 0.5).multiplyScalar(0.85), bottomColor: pal[5],
      hazeColor: haze, silver: 0.12, opacity: 0.9 };
    const crestAt = [], crng = rng.fork('crest');
    for (let k = -3; k <= 2; k++) for (let z = -1200; z < 1200; z += 200) {
      const zz = z + crng.range(0, 150), x = lay.x0 + k * PERIOD + meanderJS(lay, zz) + crng.range(-12, 12);
      crestAt.push([x, -20 + crng.range(-5, 4), zz, crng.range(58, 84)]);
    }
    await ctx.yield();   // the crest field bakes the kit's cloud noise (in steps): start it on a fresh step
    const crest = await makeCloudFieldAsync({ rng, ...cloudLook, mode: 'cumulus', at: crestAt, puffs: 9, height: 0.32, wrap: true, extent: [PERIOD * 6, 2400],
      farFade: [760, 1080], wind: [0, 0, -2.5], avoid: [[0, 0, 0, 1125]] }, ctx.yield);
    await ctx.yield();   // the first field bakes the kit's noise texture: keep it apart from the collar
    const collarAt = [], arng = rng.fork('collar');
    RINGS.forEach((R, k) => {
      for (let a = -80; a <= 80; a += 6.2 * 1192 / R) {
        const th = (a + arng.range(-1.5, 1.5)) * Math.PI / 180, r = R + arng.range(-30, 30), x = Math.sin(th) * r, z = Math.cos(th) * r;
        const d = path.nearestXZ(x, z).dist;
        if (d < (k === 1 ? 130 : 105)) continue;                                           // near the route the roll mesh itself is the cloud
        collarAt.push(d < 190 ? [x, -40, z, 84] : [x, -26 + arng.range(-6, 6), z, arng.range(120, 180) * (k === 1 ? 0.8 : 1)]);
      }
    });
    // a fluffy lip along the rim of the Eye, two rows deep, so the cliff edge is under cloud wherever the route can see it
    // (the route crosses 60 m and more above these)
    for (let a = -80; a <= 80; a += 4.2) {
      const th = (a + arng.range(-1.2, 1.2)) * Math.PI / 180, r = 862 + arng.range(-10, 16);
      collarAt.push([Math.sin(th) * r, -30 + arng.range(-5, 4), Math.cos(th) * r, arng.range(74, 108)]);
      const th2 = th + 0.037, r2 = arng.range(825, 840);
      collarAt.push([Math.sin(th2) * r2, -45 + arng.range(-4, 4), Math.cos(th2) * r2, arng.range(60, 90)]);
    }
    const collar = makeCloudField({ rng, ...cloudLook, litColor: cloudLook.litColor.clone().multiplyScalar(0.9), mode: 'cumulus', at: collarAt, puffs: 13, height: 0.3, wind: [0, 0, 0], farFade: [2600, 3600],
      noiseTexture: crest.noiseTexture, avoid: [[0, 0, 0, 790]] });
    await ctx.yield();

    // seven mushroom towers standing on the deck like chess pieces. The first two frame the notch from the entry and the
    // route rounds the first on its sunlit side; two more stand ~600 m off as midground; the far three differ per seed
    const trng = rng.fork('towers');
    const towerSpots = [[368, 915, 310], [-350, 1045, 300], [720, 770, 380], [-700, 640, 430], [-620 * side, -1180, 420], [570 * side, -1300, 600], [1500 * side, -260, 400]];
    const towers = [], towerAt = [];
    towerSpots.forEach(([x, z, w], i) => {
      const j = i < 2 ? 10 : i < 4 ? 40 : 90, W = w * (i < 1 ? trng.range(0.97, 1.06) : trng.range(0.88, 1.14)), far = i >= 4;
      const t = { x: x + trng.range(-j, j), z: z + trng.range(-j, j), W };
      towers.push(t);
      const lean = far ? 0.2 : 0.07, capY = far ? trng.range(0.4, 0.66) : 0.52;
      towerAt.push([t.x, -70, t.z, W * 0.6]);                                            // stem, seated into the deck
      towerAt.push([t.x + trng.range(-0.05, 0.05) * W, W * 0.2, t.z + trng.range(-0.05, 0.05) * W, W * 0.5]);
      towerAt.push([t.x + trng.range(-lean, lean) * W, W * capY, t.z + trng.range(-lean, lean) * W, W * (far ? trng.range(0.8, 1.1) : 1)]);   // the cap, flat underneath
    });
    const towerField = makeCloudField({ rng, ...cloudLook, mode: 'cumulus', at: towerAt, puffs: 40, height: 0.8, wind: [0.5, 0, 0.2], farFade: [4300, 5600],
      noiseTexture: crest.noiseTexture, opacity: 0.94, bump: 1.05 });
    scene.add(crest.object, collar.object, towerField.object);
    const fields = [crest, collar, towerField];
    await ctx.yield();

    // ---------------- lightning under the deck: one bolt walks the rift ahead of the camera, two more in the rifts either side
    const boltDefs = [{ rift: 0, lead: 360, dz: 48, n: 6 }, { rift: -1, lead: 620, dz: -55, n: 6 }, { rift: 1, lead: 380, dz: 75, n: 5 }];
    const bolts = boltDefs.map((d, i) => {
      const b = fx.makeLightning({ rng: rng.fork('bolt' + i), from: [0, -85, 0], to: [0, FLOOR_Y + 4, 0], variants: 5, branches: 6, color: '#b9c8ff',
        intensity: 8, width: 2.6, interval: [1.9, 2.8, 3.5][i] / (0.55 + 0.75 * storm), offset: i * 0.83, light: false, glow: 0.8 });
      scene.add(b.object);
      return b;
    });
    await ctx.yield();   // the bolts and the kelp in steps of their own
    const h01 = (a, b) => { const s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); };

    // ---------------- aerial kelp: bladder strings near the route and scattered between the towers
    const floaterAt = pod.map((p) => [p.position[0], p.position[2], p.size]);
    const strings = [], srng = rng.fork('kelp');
    const okSpot = (x, z, clear) => {
      if (path.nearestXZ(x, z).dist < clear) return false;
      for (const t of towers) if (Math.hypot(x - t.x, z - t.z) < t.W * 0.72) return false;
      for (const f of floaterAt) if (Math.hypot(x - f[0], z - f[1]) < f[2] + 22) return false;
      for (const s of strings) if (Math.hypot(x - s.x, z - s.z) < 26) return false;
      return true;
    };
    const kelpK = rng.range(0.45, 1);              // sparse or thick with kelp, per seed
    for (const u of [0.17, 0.23, 0.29, 0.36, 0.45, 0.53, 0.61, 0.68, 0.75]) {
      if (!srng.chance(kelpK)) continue;
      for (let tries = 0; tries < 6; tries++) {
        const p = path.pointAt(u + srng.range(-0.015, 0.015)), sd = srng.sign(), off = srng.range(95, 170);
        const x = p.x + sd * off, z = p.z + srng.range(-20, 20);
        if (!okSpot(x, z, 90)) continue;
        const inEye = Math.hypot(x, z) < 800, len = inEye ? srng.range(110, 140) : srng.range(170, 220);
        strings.push({ x, z, top: Math.max(p.y, inEye ? 20 : 60) + srng.range(70, 150), len, phase: srng() });
        break;
      }
    }
    for (let i = 0, nFar = Math.round(2 + kelpK * 5), tries = 0; i < nFar && tries < 80; tries++) {
      const x = srng.range(-650, 800), z = srng.range(860, 1700);
      if (Math.hypot(x, z) < 900 || !okSpot(x, z, 130) || Math.hypot(x - xE, z - Z0) < 520 || (z > 1250 && Math.abs(x - xR) < 230)) continue;
      strings.push({ x, z, top: srng.range(190, 330), len: srng.range(170, 220), phase: srng() }); i++;
    }
    const kelp = buildBladders(srng, U, strings);
    scene.add(kelp.mesh);
    await ctx.yield();

    // ---------------- Skimmers: thin-winged gliders feeding along the cloud faces
    const light = { sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: '#fff4e2', sunIntensity: 2.4, sky: '#5262a6', skyIntensity: 0.7, ground: palHex[3], groundIntensity: 0.9 };
    const skim = { rng, light, caustics: 0, top: '#cdb27a', belly: '#f6e9d2' };
    const T1 = towers[0], spin = hero.anchors.spin || 1;
    const fauna = [];
    fauna.push(F.makeMantaRay({ ...skim, rng: rng.fork('sk1'), count: rng.int(9, 14), span: 5.5, speed: 13,
      center: [Math.max(T1.x - T1.W * 0.5, 250), 112, T1.z + T1.W * 0.34], radius: 68, height: 30 }));
    fauna.push(F.makeMantaRay({ ...skim, rng: rng.fork('sk2'), count: rng.int(5, 8), span: 6.5, speed: 16,
      cross: { path, u: 0.13, lead: 110, span: 520, angle: 58, side: -side, height: 6, window: 0.2 } }));
    fauna.push(F.makeMantaRay({ ...skim, rng: rng.fork('sk3'), count: rng.int(7, 11), span: 6, speed: 15,
      center: [-spin * 70, seat.y - 62, 300], radius: 165, height: 14 }));
    const swarm = rng.chance(0.65);
    if (swarm) {
      fauna.push(F.makeFlock({ rng: rng.fork('swarm'), species: 'starlings', count: 1000, size: 17, speed: 34, light,
        center: [-spin * 230, 20, 150], radius: 230, height: 50, spread: [150, 60, 110], body: '#3a2230', belly: '#5a3440', wingC: '#2c1c2a', trail: '#4a2c3a', tip: '#20141e', head: '#2a1a26' }));
    } else {
      fauna.push(F.makeMantaRay({ ...skim, rng: rng.fork('sk4'), count: rng.int(8, 12), span: 7, speed: 14,
        along: { path, side: 34 * side, up: -16, lead: 95, from: 0.0, to: 0.42 } }));
    }
    for (const f of fauna) scene.add(f.object);
    await ctx.yield();

    // ---------------- ice motes streaming past, and a beacon glow so the portal reads as a point of light from the rim
    const set = fx.fxGroup(); scene.add(set.object);
    set.add(fx.makeParticles({ rng: rng.fork('ice'), preset: 'dust', count: 1500, box: [240, 150, 240], size: [0.3, 1.0], colors: ['#fff3dc', '#bff6ea', '#ffd9a0'],
      velocity: [0.8, 0.15, 2.4], velocityRandom: [0.6, 0.3, 0.8], intensity: 1.5, time: HU.uTime }));
    const beacon = set.add(fx.makeGlow({ position: [seat.x, seat.y, seat.z - 0.6], color: '#a8f7e6', size: 60, intensity: 0.8, rays: 0.25, depthBias: 0, near: [0.3, 1.6], fogAmount: 0.2, time: HU.uTime }));

    // gaze targets
    const F1 = V3(pod[0].position[0], pod[0].position[1] + pod[0].size * 0.5, pod[0].position[2]);
    const riftGaze = V3(), tmp = V3();
    const lookEye = hero.anchors.lookAt.clone();
    const towerGaze = V3(T1.x - T1.W * 0.15, T1.W * 0.42, T1.z + 20);
    const uGazeEnd = uPod - 0.03;

    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: 52,
      camera: { fov: 62, near: 1, far: 6000, lookAhead: 40, sway: 1, bank: 0.9 },
      pois: [
        { at: (time, u) => { path.pointAt(Math.min(u + 0.1, uGazeEnd), tmp); return riftGaze.set(xR - side * 6, -120, tmp.z); }, from: 0.05, to: uPod - 0.1, weight: 0.3, fade: 0.35 },
        { at: F1, from: uPod - 0.13, to: uPod + 0.02, weight: 0.3, fade: 0.4 },
        { at: towerGaze, from: uPod + 0.02, to: uRim - 0.06, weight: 0.32, fade: 0.4 },      // round the last tower on its sunlit side
        { at: lookEye, from: uRim - 0.08, to: 0.93, weight: 0.5, fade: 0.3 },
      ],
      portal: { shape: 'circle', radius: 9, color: '#bff6ea', glow: 1.5, revealDistance: 480 },
      post: { exposure: 0.94, bloom: { strength: 0.5, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 1.08, contrast: 1.06, tint: gradeTint, shadowTint: gradeShadow, vignette: 0.34, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        sky.update(dt, time, camera);
        hero.setProgress(u - uRim + 0.6);              // the arrival strike in the well fires as the camera crosses the rim
        hero.update(dt, time, camera);                 // also advances the shared uTime
        for (const f of fields) f.update(dt, time, camera);
        path.pointAt(u, tmp);
        const camZ = tmp.z;
        for (let i = 0; i < bolts.length; i++) {
          const b = bolts[i], d = boltDefs[i];
          b.update(dt, time);
          // each strike lands a stride further along its rift, always ahead of the camera, until the rift ends at the collar
          const k = b.strike, st = ((k % d.n) + d.n) % d.n, z = Math.max(camZ - d.lead - Math.abs(d.dz) * (d.dz > 0 ? st : d.n - 1 - st) + (h01(k, i) - 0.5) * 30, 1180);
          const x = xR + d.rift * PERIOD + meanderJS(lay, z) + (h01(k, i + 7.3) - 0.5) * 110;
          b.object.position.set(x, 0, z); b.object.rotation.y = h01(k, i + 3.1) * TAU;
          flash[i].set(x, FLOOR_Y + 45, z, b.flash);
        }
        // over the rift the storm below answers the camera: a keyed run of sheet flashes ahead of it (eased, ~1.5 per second)
        const A = 1 - smoothstep(uPod - 0.16, uPod - 0.09, u);
        const fl = Math.pow(Math.abs(Math.sin(time * 2.3)), 8) * (0.8 + 0.2 * Math.sin(time * 17));
        flash[3].set(xR + Math.sin(time * 0.9) * 50, FLOOR_Y + 35, Math.max(camZ - 420 - 120 * Math.sin(time * 0.37), 1200), A * fl * 0.9);
        for (const f of fauna) f.update(dt, time, camera, u);
        beacon.uniforms.uIntensity.value = 0.8 + 0.2 * Math.sin(time * 1.7);
        set.update(dt, time, camera);
      },
      dispose() { hero.dispose(); sky.dispose(); },
    };
  },
};
