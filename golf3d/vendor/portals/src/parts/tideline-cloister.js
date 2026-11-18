// HERO SET PIECE for "tideline-cloister": THE MOTHER TREE, built for a split (half-submerged) lens.
//
// WHAT IT IS
//   A 35 m red mangrove standing in a lagoon on a dome of ~500 arching, knuckled prop roots 50 m wide. The
//   roots are single continuous tubes: each arches through the air, plunges through the waterline (y = 0) and
//   hangs 2.5-6 m into the water like a chandelier, so the eye can follow any root straight across the
//   meniscus. Above: trunk, boughs, hanging aerial roots, a broad leaf crown dotted with ~400 scarlet ibis
//   (plus gliders circling it) and dangling / dropping seedling pods. Below: barnacle band at the tide line,
//   sponge-furred roots, algae beards streaming in the current, turtle grass on a sand mound, slanting sun
//   rays, a dozen young lemon sharks, and in the middle of the root cage an 8 m bait ball of 5,000 silversides
//   that swirls, breathes, flashes and opens a hole around the camera.
//   The roots leave a NAVE along the Z axis: nothing solid within 6.4 m of the line x = 0 below y = 6.4, so
//   the camera can ride the waterline straight through the dome under a gothic vault of roots and the trunk.
//
// LOCAL SPACE
//   Origin = centre of the root dome AT THE WATERLINE. +Y up, y = 0 is the still water surface, the sand is at
//   y = -6 under the tree. Front = +Z: the camera arrives from +Z and leaves toward -Z. Do not tilt the object.
//   radius ~27 m, height 41 m (y -6 .. +35), center = (0, 11, 0).
//
// OPTS
//   palette    7 hex strings in brief order [sky, shadow green, sunlit leaf, root brown, tannin gold, turquoise,
//              scarlet]. Scarlet (index 6) is used for the ibis only.
//   water      true (default): draw a simple translucent lagoon surface (radius 400 m) so the piece reads on
//              its own. A world with its own surface / split render passes water:false.
//   floor      true (default): a sand mound (radius 46, sinks below y = -6 beyond r ~28 and darkens toward its rim) with turtle grass.
//   floorFade  how much the mound darkens toward its rim (default 1; a world with its own sea bed passes ~0).
//   tide       0 (default) .. 1: raises the barnacle band on the roots (half ebb).
//   lintel     true (default): the root slung along the surface across the nave at z = +14 that the camera
//              ducks under (anchors.duckRoot). false removes it.
//   sunDir     THREE.Vector3 pointing TO the sun, local space (default 65 degrees up, ahead-left of a camera
//              travelling toward -Z). Used for caustics, ray slant, light coins and glints.
//   underHaze  density of the built-in underwater distance haze (default 0.035 = ~30 m visibility). Set 0 when
//              the world's lower pass applies its own turquoise fog (all materials also honour scene.fog).
//   ibis       number of roosting ibis (default per-seed 340-440).  fish  bait-ball size (default 5000).
//   strike     initial value for setStrike (default 0).
//
// RETURNS (besides the contract fields)
//   setStrike(k, burst) / setProgress(k)   0..1, the rare "tarpon strike": the bait ball bursts outward in a silver
//                    explosion while every roosting ibis lifts from the crown in a scarlet cloud. Purely a
//                    function of k (drive it from path u; leave 0 for the ordinary visit).
//   setAvoid(v3|null, radius)   point (local space) the bait ball and sharks open around. By default update()
//                    uses the camera passed to it, so the ball parts as the lens goes through it.
//   setLight({ sunDir, sunColor, absorb, haze, hazeDensity })   any subset.
//   uniforms         shared uniform block (uHcTime, uHcSun, uHcSunCol, uHcAbsorb, uHcHaze, uHcStrike, uHcBurst, uHcForest, uHcSil, uLeafK, ...).
//   airOnly / seaOnly   meshes only visible above / below the line; setEye(camera) for the second pass of a split render.
//
// ANCHORS (local space; [x, y, z] arrays unless noted)
//   waterY 0, floorY -6
//   flyThrough   ordered camera line at the waterline through the nave, +Z to -Z, >= 6 m clear of everything
//                solid (fish and sharks give way) EXCEPT the lintel root: the two points marked by duckRoot dip
//                to y = -1.7 to pass beneath it.
//   duckRoot     { position, clearBelow }  centre of the lintel root; stay below clearBelow (or above y 2.2).
//   reveal       where the tree first fills the frame (split view), looking toward -Z.
//   portalSeat   { position, facing }  centre for the 14 m ring 40 m beyond the far side of the dome, bisected
//                by the waterline, facing back toward the tree (+Z).
//   baitBall     { center, radius }      crown { center, radius }      trunkBase (the vault boss above the nave)
//   viewpoints   { front, inside, side, under }  good camera spots; `inside` looks up into the vault.
//   sunDir       the sun direction actually used.
//
// COST  ~141k triangles (hero.triangles has the exact count), 12 draw calls per pass (10 with water:false and
//   floor:false), build ~300 ms. No lights of its own, one 512 px canvas texture (leaf sprigs).
// SPLIT RENDER  if the frame is drawn in two passes with different eyes, call hero.update(0, time, passCamera)
//   (or set uniforms.uHcCamY.value) before each pass: the haze, rays and water underside key off the eye's side
//   of the waterline. Custom ShaderMaterials here are built with clipping:true, so clip planes work on all parts.
// LIGHT  wants one warm directional sun (intensity ~3) + a blue/green hemisphere light; MeshStandardMaterial
//   surfaces with injected detail, so they take scene lights, scene fog and renderer/material clipping planes.
//   Canopy shade and drifting sun coins under the crown, caustics and depth absorption are baked into the
//   shaders (function of local position), so no shadow map is needed. Nothing here blooms except fish flashes,
//   water glints and ray cores.
//
// EXPORTS for the world module: HC_PARS, HC_FRAG, patch (o.pre may #define HC_AMT(p) to replace the canopy-shade mask), makeBuilder,
//   finish, tube, makeLeafTexture, WOOD_FCOLOR (bark / lenticels / barnacle band / sponge fur). U.uHcTide raises the barnacle band (half ebb).

import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const V3 = THREE.Vector3;
const DEFAULT_PALETTE = ['#8FD3F0', '#2E7D4F', '#B9C94A', '#6B4A35', '#C9922E', '#2FA89A', '#E8202A'];
const CLEAR = 6.4;        // half-width of the nave (m)
const CLEAR_Y = 6.4;      // nothing in the nave below this height
const FLOOR = -6;

// ---------------------------------------------------------------- shared GLSL
export const HC_PARS = /* glsl */`
uniform float uHcTime; uniform vec3 uHcSun; uniform vec3 uHcSunCol; uniform vec3 uHcAbsorb; uniform vec4 uHcHaze;
uniform float uHcCamY; uniform float uHcStrike; uniform vec4 uHcAvoid; uniform float uHcTide;
uniform float uHcForest; uniform float uHcShadeK; uniform float uHcSil; uniform vec2 uHcCoin;
varying vec3 vHcP;
`;
export const HC_FRAG = HC_PARS + /* glsl */`
float hcHash(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float hcNoise(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hcHash(i), hcHash(i + vec3(1,0,0)), f.x), mix(hcHash(i + vec3(0,1,0)), hcHash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hcHash(i + vec3(0,0,1)), hcHash(i + vec3(1,0,1)), f.x), mix(hcHash(i + vec3(0,1,1)), hcHash(i + vec3(1,1,1)), f.x), f.y), f.z); }
float hcCaustic(vec2 p, float t){ float c = 0.0; vec2 q = p;
  for (int i = 0; i < 3; i++){ float fi = float(i) + 1.0;
    q += vec2(sin(q.y * 1.7 + t * 0.9 + fi), cos(q.x * 1.5 - t * 0.7 + fi * 2.0)) * 0.6;
    c += abs(sin(q.x * 1.2 + fi) * sin(q.y * 1.2 - fi)); }
  c = 1.0 - c / 3.0; return pow(clamp(c, 0.0, 1.0), 3.0) * 3.0; }
// canopy shade with drifting coins of sunlight, projected along the sun direction
float hcShade(vec3 p){
  float r = length(p.xz);
#ifdef HC_AMT
  float amt = HC_AMT(p);
#else
  // under the Mother Tree's crown, or (in a world that sets uHcForest) under the mangrove tunnel beyond z = uHcForest
  float amt = max((1.0 - smoothstep(11.0, 25.0, r)) * (1.0 - smoothstep(11.0, 17.0, p.y)), (1.0 - smoothstep(7.0, 12.0, p.y)) * smoothstep(uHcForest - 6.0, uHcForest + 6.0, p.z)) * uHcShadeK;
#endif
  vec2 q = p.xz - uHcSun.xz / max(uHcSun.y, 0.2) * p.y;
  float n = hcNoise(vec3(q * 0.42, uHcTime * 0.08)) * 0.65 + hcNoise(vec3(q * 1.1 + 9.0, uHcTime * 0.13)) * 0.35;
  float coin = smoothstep(0.5, 0.64, n);
  return mix(1.0, mix(uHcCoin.x, uHcCoin.y, coin), amt); }
vec3 hcApply(vec3 col, vec3 alb, vec3 p, float vd){
  float sh = hcShade(p);
  col *= sh;
  if (p.y < 0.0){ float d = -p.y;
    float ca = hcCaustic(p.xz * 0.8 + p.y * 0.25, uHcTime * 1.5);
    col += alb * uHcSunCol * ca * 0.3 * exp(-d * 0.1) * sh;
    col *= mix(vec3(1.0), uHcAbsorb, 1.0 - exp(-d * 0.25));
    float pl = uHcCamY < 0.0 ? vd : d * 1.6;
    col = mix(col, uHcHaze.rgb, 1.0 - exp(-pl * uHcHaze.w)); }
  return col; }
`;

// Patch a MeshStandardMaterial: shared uniforms, local-position varying, optional vertex / colour code and the
// canopy-shade + underwater pass on the lit result. Keeps three's lights, fog and clipping planes.
export function patch(mat, U, key, o = {}) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\n' + HC_PARS + (o.vHead || ''))
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\n' + (o.vNormal || ''))
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n' + (o.vBody || '') + '\nvHcP = transformed;');
    let f = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + (o.pre || '') + HC_FRAG + (o.fHead || ''))
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (o.fColor || ''))
      .replace('#include <opaque_fragment>', (o.fLit || '') + '\noutgoingLight = hcApply(outgoingLight, diffuseColor.rgb, vHcP, length(vViewPosition));\n#include <opaque_fragment>');
    // o.sil: under water, seen from under water, distance fog takes the surface toward a DARKER shade of the fog colour, so
    // the root cage stays a readable silhouette (it would otherwise dissolve at ~1.5 visibilities) and only melts far away
    if (o.sil) f = f.replace('#include <fog_fragment>', /* glsl */`
      #ifdef USE_FOG
        #ifdef FOG_EXP2
          float hcFf = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          float hcSk = mix(uHcSil, 1.0, smoothstep(2.2, 4.5, vFogDepth * fogDensity));
        #else
          float hcFf = smoothstep(fogNear, fogFar, vFogDepth); float hcSk = 1.0;
        #endif
        // above the line, seen from below through the surface: the arch is a dark silhouette that carries straight on
        // from its leg (same fog), and only melts into the bright mirror higher up
        float hcAb = (vHcP.y >= 0.0 && uHcCamY < 0.0) ? 1.0 : 0.0;
        gl_FragColor.rgb *= 1.0 - 0.62 * hcAb;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * (uHcCamY < 0.0 ? hcSk : 1.0), hcFf);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * 1.15, hcAb * smoothstep(1.6, 7.5, vHcP.y) * 0.7);
      #endif`);
    if (o.noFlip) f = f.replace('float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;', 'float faceDirection = 1.0;');
    sh.fragmentShader = f;
  };
  mat.customProgramCacheKey = () => 'tideline-' + key;
  return mat;
}

export const WOOD_FHEAD = 'varying vec2 vRuv; uniform vec3 uSpA; uniform vec3 uSpB; float hcBandK = 0.0;\n';
export const WOOD_VHEAD = 'attribute vec2 aRuv; varying vec2 vRuv;\n';
export const WOOD_FCOLOR = /* glsl */`
    { float y = vHcP.y;
      float bn = hcNoise(vec3(vRuv.x * 6.0, vRuv.y * 1.3, 3.0));
      diffuseColor.rgb *= 0.72 + 0.56 * bn;
      diffuseColor.rgb *= 0.84 + 0.32 * hcNoise(vec3(vRuv.x * 46.0, vRuv.y * 2.6, 7.0));                    // fissures running along the root
      vec2 lc = vec2(vRuv.x * 15.0, vRuv.y * 12.0), ci = floor(lc), cf = fract(lc) - 0.5; float h = hcHash(vec3(ci, 1.0));
      float lent = smoothstep(0.2, 0.07, length(cf * vec2(1.0, 1.7) + (h - 0.5) * 0.4)) * step(0.55, h) * step(0.0, y);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.6, 0.52, 0.4), lent * 0.36);
      float damp = smoothstep(1.5 + uHcTide, 0.45 + uHcTide, y) * step(0.0, y);
      diffuseColor.rgb *= mix(1.0, 0.55, damp);
      float band = smoothstep(-0.16, -0.03, y) * (1.0 - smoothstep(0.36 + uHcTide, 0.46 + uHcTide, y + (bn - 0.5) * 0.18));
      float oy = hcNoise(vHcP * 4.0 + 5.0);
      // the barnacle band: every barnacle a pale cone with a dark mouth, grey oysters crusted between them
      vec3 bq = vec3(dot(vHcP, vec3(0.8, 0.36, 0.48)), dot(vHcP, vec3(-0.6, 0.48, 0.64)), dot(vHcP, vec3(0.0, -0.8, 0.6))) * 25.0, bi = floor(bq), bf = fract(bq) - 0.5;
      bf += (vec3(hcHash(bi + 7.0), hcHash(bi + 11.0), hcHash(bi + 17.0)) - 0.5) * 0.45;
      float bh = step(0.22, hcHash(bi + 3.0)), bl = length(bf);
      vec3 barn = mix(vec3(0.3, 0.29, 0.26), vec3(0.8, 0.78, 0.72), (1.0 - smoothstep(0.12, 0.5, bl)) * bh) * (1.0 - 0.75 * smoothstep(0.17, 0.07, bl) * bh);
      barn = mix(barn, vec3(0.47, 0.49, 0.52) * (0.55 + 0.9 * hcNoise(vHcP * 9.0 + 2.0)), smoothstep(0.58, 0.68, oy));
      diffuseColor.rgb = mix(diffuseColor.rgb, barn, band * 0.95);
      hcBandK = band * step(0.0, y);
      if (y < 0.0) {
        float sn = hcNoise(vHcP * 6.0 + 11.0) * 0.5 + hcNoise(vHcP * 17.0 + 3.0) * 0.5;
        vec3 sp = mix(uSpA, uSpB, smoothstep(0.45, 0.6, hcNoise(vHcP * 1.1 + 7.0))) * (0.6 + 0.6 * hcNoise(vHcP * 22.0));
        float m = smoothstep(0.5, 0.6, sn) * smoothstep(-0.1, -0.6, y);
        vec3 silt = mix(diffuseColor.rgb * vec3(0.9, 0.86, 0.7), vec3(0.36, 0.33, 0.23) * (0.55 + 0.9 * bn), 0.6 * smoothstep(-0.1, -0.8, y));   // a skin of silt and turf below the line
        diffuseColor.rgb = mix(silt, sp, m * 0.8);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.16, 0.34, 0.1), smoothstep(0.58, 0.72, hcNoise(vHcP * 5.3 + 20.0)) * 0.5 * (1.0 - m));
      } }`;

export const WOOD_OPTS = { vHead: WOOD_VHEAD, vBody: 'vRuv = aRuv;', fHead: WOOD_FHEAD, fColor: WOOD_FCOLOR, sil: true,
  // under water there is no key light to model the legs: darken their turning edges and undersides so they read as round
  fLit: `outgoingLight += diffuseColor.rgb * 0.07 * hcBandK;
    if (vHcP.y < 0.0) { vec3 hcUp = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz); float hcRd = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
    outgoingLight *= (0.4 + 0.8 * hcRd) * (0.78 + 0.42 * dot(normal, hcUp)); }` };
export const SPONGE_OPTS = { fColor: 'diffuseColor.rgb *= 0.7 + 0.6 * hcNoise(vHcP * 24.0);' };
export const SWAY_OPTS = { noFlip: true, vHead: 'attribute vec2 aSw;\n',
  vBody: 'transformed.x += aSw.x * (1.0 + 0.55 * sin(uHcTime * 1.3 + aSw.y + transformed.z * 0.4)); transformed.z += aSw.x * 0.35 * sin(uHcTime * 0.9 + aSw.y * 1.7);' };
const QROT = 'vec3 hcQ(vec4 q, vec3 v){ return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }\n';
// leaf-sprig cards; uLeafK = (back-light gain, ambient gain, brightness cap) is a per-material uniform
export const LEAF_OPTS = { noFlip: true,
  vHead: 'attribute vec3 iPos; attribute vec4 iQuat; attribute vec4 iData; attribute vec3 iCol; attribute vec3 iN; varying vec3 vLc;\n' + QROT,
  vNormal: 'objectNormal = normalize(mix(normalize(iN), hcQ(iQuat, objectNormal), 0.22));',
  vBody: /* glsl */`
        vec3 lp = hcQ(iQuat, transformed * iData.x);
        float wv = sin(uHcTime * 1.7 + iData.z + iPos.x * 0.3) + 0.5 * sin(uHcTime * 3.3 + iData.z * 1.7);
        lp += vec3(0.075, 0.04, 0.055) * wv * iData.x * (0.4 + uv.y);
        transformed = iPos + lp; vLc = iCol;
        vMapUv = uv * 0.5 + vec2(mod(iData.y, 2.0), floor(iData.y * 0.5)) * 0.5;`,
  fHead: 'varying vec3 vLc; uniform vec3 uLeafK;\n', fColor: 'diffuseColor.rgb *= vLc;',
  fLit: `{ vec3 Lv = normalize((viewMatrix * vec4(uHcSun, 0.0)).xyz); float bl = max(dot(normalize(-vViewPosition), Lv), 0.0); bl = bl * bl * bl;
        outgoingLight += diffuseColor.rgb * (uHcSunCol * bl * uLeafK.x + vec3(0.13, 0.17, 0.08) * uLeafK.y); outgoingLight = min(outgoingLight, vec3(uLeafK.z)); }` };
export const POD_OPTS = { vHead: 'attribute vec4 iA; attribute vec2 iB;\n',
  vBody: /* glsl */`
        vec3 pp = transformed * iB.y; vec3 bp = iA.xyz; float sc = 1.0;
        float sw = sin(uHcTime * 1.4 + iA.w * 40.0) * 0.18;
        if (iB.x > 0.0) {
          float t = fract(uHcTime / iB.x + iA.w) * iB.x, tf = max(t - 1.2, 0.0), tHit = sqrt(max(bp.y, 0.0) / 4.9), ts = tf - tHit;
          bp.y -= 4.9 * tf * tf; sw *= 1.0 - smoothstep(0.0, 0.3, tf);
          if (ts > 0.0) bp.y = 0.3 - 0.75 * exp(-ts * 1.5) * cos(ts * 5.0);
          sc = (1.0 - smoothstep(iB.x - 1.6, iB.x - 0.4, t)) * smoothstep(0.0, 0.5, t);
        }
        pp.xz += vec2(sw, sw * 0.6) * -pp.y;
        transformed = bp + pp * sc;` };

// ---------------------------------------------------------------- geometry builder
export function makeBuilder() { return { pos: [], nor: [], col: [], uv: [], idx: [], ext: [] }; }
export function finish(B, extName, extSize) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3));
  if (B.uv.length) g.setAttribute('aRuv', new THREE.Float32BufferAttribute(B.uv, 2));
  if (extName) g.setAttribute(extName, new THREE.Float32BufferAttribute(B.ext, extSize));
  g.setIndex(B.idx);
  g.computeBoundingSphere();
  return g;
}

// the same, one attribute per step, for the large merged meshes (each conversion of a long array is a few milliseconds)
export async function finishAsync(B, ctx, extName, extSize) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(B.pos, 3)); await ctx.yield();
  g.setAttribute('normal', new THREE.Float32BufferAttribute(B.nor, 3)); await ctx.yield();
  g.setAttribute('color', new THREE.Float32BufferAttribute(B.col, 3)); await ctx.yield();
  if (B.uv.length) { g.setAttribute('aRuv', new THREE.Float32BufferAttribute(B.uv, 2)); await ctx.yield(); }
  if (extName) { g.setAttribute(extName, new THREE.Float32BufferAttribute(B.ext, extSize)); await ctx.yield(); }
  g.setIndex(B.idx); await ctx.yield();
  g.computeBoundingSphere();
  return g;
}
// a unit icosphere with shared vertices: { pos: [x, y, z, ...], idx: [...], count }
export function icoIndexed(detail) {
  const g = new THREE.IcosahedronGeometry(1, detail), a = g.getAttribute('position'), map = new Map(), pos = [], idx = [];
  for (let i = 0; i < a.count; i++) {
    const k = Math.round(a.getX(i) * 1e4) + ',' + Math.round(a.getY(i) * 1e4) + ',' + Math.round(a.getZ(i) * 1e4);
    let j = map.get(k); if (j === undefined) { j = pos.length / 3; map.set(k, j); pos.push(a.getX(i), a.getY(i), a.getZ(i)); }
    idx.push(j);
  }
  g.dispose(); return { pos, idx, count: pos.length / 3 };
}

const _t = new V3(), _n = new V3(), _b = new V3(), _pt = new V3(), _ax = new V3(), _q = new THREE.Quaternion();
// Tube along pts with parallel-transported frames. rad(i) -> radius, col(i, j, out) -> rgb. uv = (around, metres).
export function tube(B, pts, rad, sides, col, bump) {
  const n = pts.length, base = B.pos.length / 3, c = [0, 0, 0];
  let s = 0;
  _t.subVectors(pts[1], pts[0]).normalize();
  _n.set(1, 0, 0); if (Math.abs(_t.x) > 0.8) _n.set(0, 0, 1);
  _n.addScaledVector(_t, -_n.dot(_t)).normalize();
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    _pt.copy(_t); _t.subVectors(b, a).normalize();
    _ax.crossVectors(_pt, _t); const sl = _ax.length();
    if (sl > 1e-5) { _q.setFromAxisAngle(_ax.multiplyScalar(1 / sl), Math.asin(Math.min(1, sl))); _n.applyQuaternion(_q); }
    _n.addScaledVector(_t, -_n.dot(_t)).normalize(); _b.crossVectors(_t, _n);
    if (i > 0) s += pts[i].distanceTo(pts[i - 1]);
    const r = rad(i), p = pts[i];
    for (let j = 0; j <= sides; j++) {
      const an = (j / sides) * Math.PI * 2, cs = Math.cos(an), sn = Math.sin(an);
      const nx = _n.x * cs + _b.x * sn, ny = _n.y * cs + _b.y * sn, nz = _n.z * cs + _b.z * sn;
      const rr = r * (bump ? bump(i, j % sides, p) : 1);
      B.pos.push(p.x + nx * rr, p.y + ny * rr, p.z + nz * rr); B.nor.push(nx, ny, nz);
      col(i, j % sides, c); B.col.push(c[0], c[1], c[2]); B.uv.push(j / sides, s);
    }
    if (i > 0) for (let j = 0; j < sides; j++) {
      const p0 = base + (i - 1) * (sides + 1) + j, p1 = p0 + sides + 1;
      B.idx.push(p0, p1, p0 + 1, p0 + 1, p1, p1 + 1);
    }
  }
}

// canvas texture: a 2x2 atlas of mangrove sprigs (paired glossy leaves on a twig), alpha-tested
export function makeLeafTexture(rng) {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S * 2;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, S * 2, S * 2);
  for (let t = 0; t < 4; t++) {
    const ox = (t % 2) * S, oy = (t >> 1) * S;
    g.save(); g.beginPath(); g.rect(ox + 2, oy + 2, S - 4, S - 4); g.clip();
    const twigs = 3 + (t % 2);
    for (let k = 0; k < twigs; k++) {
      const bx = ox + S * (0.5 + rng.range(-0.1, 0.1)), by = oy + S * 0.96;
      const ang = -Math.PI / 2 + (k - (twigs - 1) / 2) * 0.62 + rng.range(-0.12, 0.12), len = S * rng.range(0.62, 0.82);
      g.strokeStyle = '#8a8266'; g.lineWidth = 5; g.beginPath(); g.moveTo(bx, by);
      g.lineTo(bx + Math.cos(ang) * len, by + Math.sin(ang) * len); g.stroke();
      const pairs = 5;
      for (let i = 1; i <= pairs; i++) for (const sd of [-1, 1]) {
        const f = 0.2 + (i / pairs) * 0.8, cx = bx + Math.cos(ang) * len * f, cy = by + Math.sin(ang) * len * f;
        const la = ang + sd * rng.range(0.6, 1.05), ll = S * rng.range(0.2, 0.27), lw = ll * rng.range(0.36, 0.46);
        g.save(); g.translate(cx, cy); g.rotate(la);
        const sh = Math.floor(rng.range(150, 255));
        const gr = g.createLinearGradient(0, -lw, 0, lw);
        gr.addColorStop(0, `rgb(${sh},${sh},${sh})`); gr.addColorStop(0.5, `rgb(${sh - 50},${sh - 40},${sh - 50})`); gr.addColorStop(1, `rgb(${sh - 20},${sh - 10},${sh - 30})`);
        g.fillStyle = gr; g.beginPath(); g.moveTo(0, 0);
        g.bezierCurveTo(ll * 0.25, -lw, ll * 0.8, -lw * 0.9, ll, 0); g.bezierCurveTo(ll * 0.8, lw * 0.9, ll * 0.25, lw, 0, 0); g.fill();
        g.strokeStyle = 'rgba(255,255,235,0.55)'; g.lineWidth = 2; g.beginPath(); g.moveTo(ll * 0.05, 0); g.lineTo(ll * 0.95, 0); g.stroke();
        g.restore();
      }
    }
    g.restore();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

// ================================================================= buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const [cSky, cShade, cLeaf, cRoot, cGold, cTurq, cScarlet] = pal;

  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new V3(-0.26, 0.906, -0.33)).normalize();
  const group = new THREE.Group(); group.name = 'mother-tree';

  // ---- per-seed character
  const leanA = rng.range(0, Math.PI * 2), leanM = rng.range(0.6, 2.2);
  const nBoughs = rng.int(6, 8), crownR = rng.range(16.5, 19.5), crownY = rng.range(22.5, 24), crownRy = rng.range(7, 8);
  const spread = rng.range(23.5, 25.5), barkRed = rng.range(0, 1), leafWarm = rng.range(-0.5, 1);
  const nIbis = opts.ibis ?? rng.int(340, 440), nFish = opts.fish ?? 5000, nSharks = rng.int(11, 14);
  const ballC = new V3(rng.range(-0.6, 0.6), -2.7, rng.range(-1.5, 1.5)), ballR = rng.range(3.7, 4.2);
  const swirl = rng.sign();

  const U = {
    uHcTime: { value: 0 }, uHcSun: { value: sunDir }, uHcSunCol: { value: new THREE.Color('#FFF4C8').multiplyScalar(2.2) },
    uHcAbsorb: { value: new THREE.Color(0.42, 0.86, 0.84) },
    uHcHaze: { value: new THREE.Vector4(cTurq.r * 0.75, cTurq.g * 0.9, cTurq.b * 0.95, opts.underHaze ?? 0.035) },
    uHcCamY: { value: 10 }, uHcStrike: { value: opts.strike ?? 0 }, uHcAvoid: { value: new THREE.Vector4(0, 50, 0, 0) },
    uHcBall: { value: new THREE.Vector4(ballC.x, ballC.y, ballC.z, ballR) }, uHcTide: { value: opts.tide ?? 0 },
    uHcForest: { value: 1e5 }, uHcShadeK: { value: 1 }, uHcSil: { value: 0.6 }, uHcBurst: { value: opts.strike ?? 0 }, uLeafK: { value: new V3(0.1, 1, 0.85) },
    uHcCoin: { value: new THREE.Vector2(0.34, 1.3) },      // canopy shade floor, brightness of a sun coin
  };

  // ---- colours
  const bark = cRoot.clone().lerp(new THREE.Color('#7a3f2c'), 0.25 + barkRed * 0.3);
  const barkPale = bark.clone().lerp(new THREE.Color('#b9a58a'), 0.45);
  const barkDark = bark.clone().multiplyScalar(0.5);
  const tmpC = new THREE.Color();
  const barkCol = (seed, top) => (i, j, out) => {
    const k = 0.5 + 0.5 * Math.sin(seed * 31 + i * 1.7 + j * 2.1);
    tmpC.copy(barkDark).lerp(bark, 0.35 + 0.65 * k).lerp(barkPale, top * (0.3 + 0.4 * ((j * 7 + i) % 3 === 0 ? 1 : 0.3)));
    out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b;
  };

  // ================================================================= WOOD: trunk, boughs, roots (one mesh)
  const W = makeBuilder();
  const leanX = Math.cos(leanA) * leanM, leanZ = Math.sin(leanA) * leanM;
  const trunkAt = (y) => { const f = clamp((y - 6.6) / 11, 0, 1.3); return new V3(leanX * f * f + Math.sin(y * 0.5 + leanA) * 0.35 * f, y, leanZ * f * f + Math.cos(y * 0.43) * 0.35 * f); };
  const trunkR = (y) => 0.3 + 1.9 * smoothstep(6.6, 9.4, y) - 0.85 * smoothstep(9.6, 17.5, y);
  {
    const pts = []; for (let i = 0; i <= 14; i++) pts.push(trunkAt(6.6 + (i / 14) * 11.4));
    tube(W, pts, (i) => trunkR(pts[i].y), 10, barkCol(1.3, 0.5),
      (i, j, p) => 1 + 0.16 * noise.n3(p.x * 0.6 + j * 1.3, p.y * 0.35, j * 0.9) + 0.12 * Math.sin(j * 1.885 + p.y * 0.2));
  }
  const trunkTop = trunkAt(18);
  // boughs and sub-branches; branch ends carry the leaf clumps
  const clumps = [];      // { c: V3, r }
  const boughPts = [];    // sample points along boughs (aerial roots drop from these)
  const branch = (p0, p1, r0, r1, sides, n, sag, seed) => {
    const mid = p0.clone().lerp(p1, 0.45); mid.y += sag; mid.x += rng.range(-1, 1); mid.z += rng.range(-1, 1);
    const pts = new THREE.CatmullRomCurve3([p0, mid, p1], false, 'centripetal').getPoints(n);
    tube(W, pts, (i) => lerp(r0, r1, Math.pow(i / n, 0.8)) * (i === 0 ? 1.35 : 1), sides, barkCol(seed, 0.6),
      (i, j, p) => 1 + 0.14 * noise.n3(p.x * 0.8, p.y * 0.8, p.z * 0.8 + j));
    return pts;
  };
  const a0 = rng.range(0, Math.PI * 2);
  for (let b = 0; b < nBoughs; b++) {
    const a = a0 + (b / nBoughs) * Math.PI * 2 + rng.range(-0.25, 0.25);
    const y0 = rng.range(10.8, 16.5), st = trunkAt(y0);
    const R1 = crownR * rng.range(0.55, 0.95);
    const end = new V3(trunkTop.x + Math.cos(a) * R1, crownY + rng.range(-5.5, 0.5), trunkTop.z + Math.sin(a) * R1);
    const pts = branch(st, end, trunkR(y0) * 0.5, 0.16, 6, 9, rng.range(1.5, 3.2), b + 2);
    clumps.push({ c: end.clone(), r: rng.range(4.4, 5.8) });
    for (let i = 3; i < pts.length; i++) boughPts.push(pts[i]);
    const subs = rng.int(2, 3);
    for (let s = 0; s < subs; s++) {
      const i0 = rng.int(3, 7), sp = pts[i0], aa = a + rng.range(-1.2, 1.2), RR = rng.range(5, 9.5);
      const e2 = new V3(sp.x + Math.cos(aa) * RR, lerp(sp.y, crownY, 0.5) + rng.range(0.5, 5), sp.z + Math.sin(aa) * RR);
      const p2 = branch(sp, e2, 0.24, 0.07, 4, 5, rng.range(0.3, 1.4), b * 7 + s);
      clumps.push({ c: e2.clone(), r: rng.range(3.6, 5) });
      boughPts.push(p2[2], p2[3], p2[4]);
    }
  }
  { // leader
    const e = new V3(trunkTop.x + rng.range(-2, 2), crownY + crownRy * 0.55, trunkTop.z + rng.range(-2, 2));
    branch(trunkAt(17.6), e, 0.9, 0.14, 6, 6, 0.5, 77); clumps.push({ c: e, r: rng.range(4.4, 5.4) });
  }
  // filler clumps on the crown ellipsoid
  for (let i = 0; i < 30; i++) {
    const a = rng.range(0, Math.PI * 2), el = rng.range(-0.8, 1), ce = Math.sqrt(1 - Math.min(1, el * el));
    clumps.push({ c: new V3(trunkTop.x + Math.cos(a) * ce * crownR * 0.92, crownY + el * crownRy * 0.8, trunkTop.z + Math.sin(a) * ce * crownR * 0.92), r: rng.range(3.6, 5.2) });
  }
  let crownTop = 0; for (const c of clumps) crownTop = Math.max(crownTop, c.c.y + c.r * 0.72);
  const liftAll = 35 - crownTop;           // seat the crown top at 35 m
  for (const c of clumps) c.c.y += liftAll * smoothstep(15, 28, c.c.y);
  await ctx.yield();

  // ---- roots
  const roots = [];        // { pts, rad[], tier }
  const under = [];        // underwater attachment points { p, r }
  const perches = [];      // ibis perches on high arches
  const inNave = (p, r) => Math.abs(p.x) < CLEAR + r && p.y < CLEAR_Y && p.y > FLOOR - 1;
  function addRoot(ctrl, o) {
    // curvature-adaptive resampling: rings crowd into the bends, straight runs get few
    const fine = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getPoints(48), cost = [0], pts = [];
    for (let i = 1; i <= 48; i++) {
      const len = fine[i].distanceTo(fine[i - 1]);
      let ang = 0; if (i < 48) { _t.subVectors(fine[i], fine[i - 1]).normalize(); _pt.subVectors(fine[i + 1], fine[i]).normalize(); ang = Math.acos(clamp(_t.dot(_pt), -1, 1)); }
      cost.push(cost[i - 1] + len * 0.35 + ang * 2.4);
    }
    for (let k = 0, j = 0; k <= o.n; k++) {
      const target = cost[48] * k / o.n; while (j < 47 && cost[j + 1] < target) j++;
      pts.push(fine[j].clone().lerp(fine[j + 1], clamp((target - cost[j]) / Math.max(1e-6, cost[j + 1] - cost[j]), 0, 1)));
    }
    if (!o.free) for (const p of pts) if (inNave(p, o.r0)) return null;
    const n = pts.length, seed = rng.range(0, 100), rad = new Array(n);
    let L = 0; const ss = [0]; for (let i = 1; i < n; i++) { L += pts[i].distanceTo(pts[i - 1]); ss.push(L); }
    const sp = rng.range(1.3, 2.2), ph = rng();
    for (let i = 0; i < n; i++) {
      const t = ss[i] / L, y = pts[i].y;
      let r = o.r0 * (1 - (o.fat ? 0.3 : 0.5) * t) * (1 + 0.5 * Math.max(0, 1 - t * 10)) * (1 + 0.3 * smoothstep(0.3, -1.6, y));   // legs swell below the line
      if (o.fat) r *= 1 + (o.fat - 1) * smoothstep(0.9, -0.7, y);            // the chandelier's columns: thick from just above the line to the tip
      if (o.tip) r *= 1 - smoothstep(0.9, 1, t) * 0.9;                       // free-hanging: a blunt taper over the last tenth
      else r *= 1 + 0.5 * smoothstep(FLOOR + 1.2, FLOOR, y);                    // planted: flare into the sand
      r *= 1 + 0.38 * Math.pow(Math.max(0, Math.cos((ss[i] / sp + ph) * 6.283)), 4);   // knuckles
      rad[i] = Math.max(y < 0 ? 0.05 : 0.012, r);
      if (y < -0.5 && y > FLOOR + 0.3 && t < 0.97) under.push({ p: pts[i], r: rad[i] });
      if (o.tier === 0 && y > 4.5 && y < 12 && i > 2 && Math.abs(pts[i].x) > 2) perches.push({ p: pts[i], r: rad[i] });
    }
    tube(W, pts, (i) => rad[i], o.sides, barkCol(seed, 0.35),
      (i, j, p) => 1 + 0.13 * noise.n3(p.x * 1.3 + seed, p.y * 1.3, p.z * 1.3 + j * 0.7));
    const lp = pts[n - 1], root = { pts, rad, tier: o.tier, landR: Math.hypot(lp.x, lp.z) }; roots.push(root); return root;
  }
  // arch from p0 over to a landing point, then down through the waterline into the water
  function archRoot(p0, lx, lz, o) {
    const dx = lx - p0.x, dz = lz - p0.z, L = Math.hypot(dx, dz); if (L < 0.6) return null;
    const px = -dz / L, pz = dx / L, w = rng.range(-1, 1), apexY = Math.max(p0.y + o.lift, o.kneeY + 0.6);
    const depth = o.depth, drift = rng.range(0.1, 0.8), da = rng.range(0, 6.283);
    const ex = lx + Math.cos(da) * drift + 0.5, ez = lz + Math.sin(da) * drift;       // tips lean with the current (+x)
    const ctrl = [p0.clone(),
      new V3(p0.x + dx * 0.36 + px * w * L * 0.1, apexY, p0.z + dz * 0.36 + pz * w * L * 0.1),
      new V3(p0.x + dx * 0.78 - px * w * L * 0.05, lerp(apexY, o.kneeY, 0.5), p0.z + dz * 0.78 - pz * w * L * 0.05),
      new V3(p0.x + dx * 0.96, o.kneeY, p0.z + dz * 0.96),
      new V3(lx, 0, lz),
      new V3(lerp(lx, ex, 0.35), -depth * 0.55, lerp(lz, ez, 0.35)),
      new V3(ex, -depth, ez)];
    return addRoot(ctrl, o);
  }
  const depthPick = () => (rng.chance(0.3) ? { depth: 6.25, tip: false } : { depth: rng.range(2.4, 5.6), tip: true });
  // tier A: buttress roots from the trunk
  for (let i = 0, made = 0; i < 600 && made < 60; i++) {
    if ((i & 31) === 31) await ctx.yield();
    const a = rng.range(0, Math.PI * 2), r = rng.range(7, 13.5), lx = Math.sin(a) * r, lz = Math.cos(a) * r;
    if (Math.abs(lx) < CLEAR + 0.6) continue;
    const y0 = rng.range(7.4, 13.2), tc = trunkAt(y0), tr = trunkR(y0) * 0.7;
    const p0 = new V3(tc.x + Math.sin(a) * tr, y0, tc.z + Math.cos(a) * tr);
    if (archRoot(p0, lx, lz, { n: 18, sides: 5, r0: rng.range(0.3, 0.5), lift: rng.range(-0.5, 1.6), kneeY: rng.range(1.6, 3.2), tier: 0, ...depthPick() })) made++;
  }
  await ctx.yield();
  // tiers B and C: roots springing from roots, looping outward
  const spawn = (fromTier, tier, want, o) => {
    const parents = roots.filter((r) => r.tier === fromTier);
    for (let i = 0, made = 0; i < want * 12 && made < want && parents.length; i++) {
      const par = rng.pick(parents), k = rng.int(Math.floor(par.pts.length * 0.25), Math.floor(par.pts.length * 0.72)), p0 = par.pts[k];
      if (p0.y < 1.3) continue;
      const oa = Math.atan2(p0.x, p0.z) + rng.sign() * rng.range(0.05, 0.85), L = rng.range(o.l0, o.l1);
      const lx = p0.x + Math.sin(oa) * L, lz = p0.z + Math.cos(oa) * L, lr = Math.hypot(lx, lz);
      if (lr > spread || lr < Math.max(6.5, par.landR + 0.8) || Math.abs(lx) < CLEAR + 0.4) continue;
      const kneeY = Math.min(p0.y * 0.6, rng.range(0.9, 2.6));
      if (archRoot(p0, lx, lz, { n: o.n, sides: o.fat ? 5 : o.sides, r0: Math.min(par.rad[k] * 0.8, rng.range(o.r0, o.r1)), lift: rng.range(0.3, 1.5), kneeY, tier, fat: o.fat && made % o.every === 0 ? o.fat : 0, ...depthPick() })) made++;
    }
  };
  spawn(0, 1, 80, { l0: 4, l1: 8, n: 13, sides: 5, r0: 0.16, r1: 0.26 });
  await ctx.yield();
  spawn(1, 2, 90, { l0: 4, l1: 8, n: 13, sides: 4, r0: 0.13, r1: 0.2 });
  await ctx.yield();
  spawn(2, 3, 90, { l0: 4, l1: 8, n: 11, sides: 4, r0: 0.1, r1: 0.16 });
  await ctx.yield();
  spawn(3, 4, 80, { l0: 4, l1: 8, n: 11, sides: 4, r0: 0.08, r1: 0.14, fat: 1.8, every: 3 });
  await ctx.yield();
  spawn(4, 5, 90, { l0: 3.5, l1: 7.5, n: 10, sides: 4, r0: 0.07, r1: 0.12, fat: 2.3, every: 2 });      // every other root of the outer ring is a thick column below the line
  await ctx.yield();
  // the chandelier's inner colonnade: thick legs that drop from the arches straight through the line along both
  // flanks of the nave (6.9-9 m from the camera line), so the dunk passes between two dense rows of them
  {
    const drops = [], placed = [];
    for (const r of roots) for (let i = 1; i < r.pts.length - 1; i++) { const p = r.pts[i]; if (p.y > 2.0 && p.y < 9.5 && Math.abs(p.x) > CLEAR + 0.5 && Math.abs(p.x) < 11 && Math.abs(p.z) < 24) drops.push(p); }
    for (let i = 0, made = 0; i < 1400 && made < 88 && drops.length; i++) {
      if ((i & 63) === 63) await ctx.yield();
      const d = rng.pick(drops), sx = Math.sign(d.x) || 1, lx = sx * rng.range(CLEAR + (sx < 0 ? 0.95 : 0.5), 9.2), lz = d.z + rng.range(-1.8, 1.8);
      let ok = Math.abs(lz) < 24; for (const q of placed) if ((q[0] - lx) * (q[0] - lx) + (q[1] - lz) * (q[1] - lz) < 0.8) { ok = false; break; }
      if (!ok) continue;
      const planted = rng.chance(0.45), depth = planted ? 6.25 : rng.range(3.2, 5.7), dz = rng.range(-0.25, 0.25);
      const ctrl = [d.clone(), new V3(lerp(d.x, lx, 0.65), d.y * 0.55, lerp(d.z, lz, 0.65)), new V3(lx, 0.25, lz), new V3(lx + 0.12, -depth * 0.5, lz + dz), new V3(lx + 0.4, -depth, lz + dz * 2)];
      if (addRoot(ctrl, { n: 10, sides: 6, r0: rng.range(0.2, 0.32), tier: 6, tip: !planted, fat: 1.35 })) { placed.push([lx, lz]); made++; }
    }
  }
  await ctx.yield();
  // aerial roots dropping from the boughs
  for (let i = 0, made = 0; i < 900 && made < 46; i++) {
    const p0 = rng.pick(boughPts), a = Math.atan2(p0.x, p0.z) + rng.range(-0.6, 0.6), off = rng.range(0.5, 3.5);
    const lx = p0.x + Math.sin(a) * off, lz = p0.z + Math.cos(a) * off;
    if (Math.abs(lx) < CLEAR + 0.3 || Math.abs(p0.x) < CLEAR + 0.3 || Math.hypot(lx, lz) > spread) continue;
    const dangle = rng.chance(0.38), endY = dangle ? rng.range(1.2, 7) : -rng.range(2.2, 5.4), sw = rng.range(-1.6, 1.6);
    const ctrl = [p0.clone(), new V3(lerp(p0.x, lx, 0.25) + sw, lerp(p0.y, 0, 0.35), lerp(p0.z, lz, 0.25) - sw),
      new V3(lerp(p0.x, lx, 0.8), lerp(p0.y, Math.max(endY, 0), 0.75), lerp(p0.z, lz, 0.8)), new V3(lx, Math.max(endY, 0) + (dangle ? 0.6 : 0), lz)];
    if (!dangle) ctrl.push(new V3(lx + 0.15, endY * 0.5, lz), new V3(lx + 0.45, endY, lz));
    if (addRoot(ctrl, { n: 8, sides: 3, r0: rng.range(0.07, 0.13), tier: 9, tip: true })) made++;
  }
  // the vault boss: short rootlets under the trunk that stop well above the nave
  for (let i = 0; i < 9; i++) {
    const a = rng.range(0, 6.283), r = rng.range(0.2, 1.3), y0 = rng.range(7, 8.6), tc = trunkAt(y0), ey = rng.range(6.7, 7.4) - 0.0;
    addRoot([new V3(tc.x + Math.cos(a) * r * 0.5, y0 + 0.8, tc.z + Math.sin(a) * r * 0.5), new V3(tc.x + Math.cos(a) * r, (y0 + ey) / 2, tc.z + Math.sin(a) * r), new V3(tc.x + Math.cos(a) * r * 1.2, ey, tc.z + Math.sin(a) * r * 1.2)],
      { n: 4, sides: 3, r0: rng.range(0.07, 0.13), tier: 3, tip: true, free: true });
  }
  // the lintel root slung along the surface across the nave
  const lintelZ = 14;
  if (opts.lintel !== false) {
    const s = rng.sign();
    addRoot([new V3(-11.5 * s, 4.2, lintelZ - 2.2), new V3(-8.6 * s, 2.1, lintelZ - 0.9), new V3(-5 * s, 0.62, lintelZ - 0.1), new V3(0, 0.3, lintelZ + 0.3),
      new V3(5 * s, 0.5, lintelZ), new V3(8 * s, 0.2, lintelZ - 0.6), new V3(9 * s, -2.2, lintelZ - 0.9), new V3(9.4 * s, -4.6, lintelZ - 1)],
      { n: 22, sides: 6, r0: 0.3, tier: 1, tip: true, free: true });
  }
  await ctx.yield();

  const woodMat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 }), {
    ...U, uSpA: { value: cGold.clone().lerp(new THREE.Color('#ff6a1a'), 0.55) }, uSpB: { value: new THREE.Color('#7b3fa8') },
  }, 'wood', WOOD_OPTS);
  await ctx.yield();
  const wood = new THREE.Mesh(await finishAsync(W, ctx), woodMat); wood.name = 'wood'; group.add(wood);
  await ctx.yield();

  // ================================================================= CROWN: clump cores + leaf sprig cards
  {
    const ico = icoIndexed(1), C = makeBuilder(), v = new V3();
    for (const cl of clumps) {
      const b0 = C.pos.length / 3;
      for (let k = 0; k < ico.idx.length; k++) C.idx.push(b0 + ico.idx[k]);
      for (let i = 0; i < ico.count; i++) {
        v.set(ico.pos[i * 3], ico.pos[i * 3 + 1], ico.pos[i * 3 + 2]);
        const d = cl.r * 0.64 * (1 + 0.28 * noise.n3(v.x * 1.3 + cl.c.x, v.y * 1.3 + cl.c.y, v.z * 1.3 + cl.c.z));
        C.pos.push(cl.c.x + v.x * d, cl.c.y + v.y * d * 0.7, cl.c.z + v.z * d); C.nor.push(v.x * 0.6, v.y * 0.6 + 0.7, v.z * 0.6);
        const k = 0.5 + 0.4 * Math.max(0, v.y);
        C.col.push(lerp(cShade.r, cLeaf.r, 0.25) * k, lerp(cShade.g, cLeaf.g, 0.25) * k, lerp(cShade.b, cLeaf.b, 0.25) * k);
      }
    }
    await ctx.yield();
    const cores = new THREE.Mesh(finish(C), patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), U, 'core', { fLit: 'outgoingLight += diffuseColor.rgb * vec3(0.1, 0.13, 0.06);' }));
    cores.name = 'crown-cores'; group.add(cores);
  }
  let crownRad = 0; for (const cl of clumps) crownRad = Math.max(crownRad, Math.hypot(cl.c.x, cl.c.z) + cl.r);
  {
    const nCards = 4400; let rsum = 0; for (const cl of clumps) rsum += cl.r * cl.r;
    const iPos = [], iQuat = [], iData = [], iCol = [], iN = [];
    const q = new THREE.Quaternion(), q2 = new THREE.Quaternion(), nrm = new V3(), dir = new V3(), Z = new V3(0, 0, 1), col = new THREE.Color();
    const warm = cLeaf.clone().lerp(cGold, 0.35), deep = cShade.clone().multiplyScalar(0.62);
    let ci = 0;
    for (const cl of clumps) {
      if ((++ci & 7) === 0) await ctx.yield();
      const cnt = Math.round(nCards * cl.r * cl.r / rsum);
      for (let i = 0; i < cnt; i++) {
        dir.set(rng.gauss(), rng.gauss(), rng.gauss()).normalize();
        if (dir.y < -0.45 && rng.chance(0.6)) dir.y = -dir.y;
        const rr = cl.r * rng.range(0.72, 1.1);
        iPos.push(cl.c.x + dir.x * rr, cl.c.y + dir.y * rr * 0.72, cl.c.z + dir.z * rr);
        nrm.set(dir.x + rng.range(-0.7, 0.7), dir.y + rng.range(-0.5, 0.9), dir.z + rng.range(-0.7, 0.7)).normalize();
        q.setFromUnitVectors(Z, nrm); q2.setFromAxisAngle(Z, rng.range(0, 6.283)); q.multiply(q2);
        iQuat.push(q.x, q.y, q.z, q.w);
        iData.push(rng.range(2.3, 3.8), rng.int(0, 3), rng.range(0, 6.283), 0);
        const light = clamp(0.56 + 0.16 * dir.dot(sunDir) + 0.3 * dir.y + rng.range(-0.2, 0.2), 0, 1);
        col.copy(deep).lerp(cLeaf, Math.pow(light, 1.2));
        if (rng.chance(0.12 + 0.1 * Math.max(0, leafWarm))) col.lerp(warm, rng.range(0.2, 0.7) * light);
        col.multiplyScalar(rng.range(0.8, 1.0));
        iCol.push(col.r, col.g, col.b); iN.push(dir.x * 0.6, dir.y * 0.6 + 0.75, dir.z * 0.6);
      }
    }
    await ctx.yield();
    const pg = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
    g.index = pg.index; g.setAttribute('position', pg.getAttribute('position')); g.setAttribute('normal', pg.getAttribute('normal')); g.setAttribute('uv', pg.getAttribute('uv'));
    g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 3));
    g.setAttribute('iQuat', new THREE.InstancedBufferAttribute(new Float32Array(iQuat), 4));
    g.setAttribute('iData', new THREE.InstancedBufferAttribute(new Float32Array(iData), 4));
    g.setAttribute('iCol', new THREE.InstancedBufferAttribute(new Float32Array(iCol), 3));
    g.setAttribute('iN', new THREE.InstancedBufferAttribute(new Float32Array(iN), 3));
    g.instanceCount = iPos.length / 3;
    g.boundingSphere = new THREE.Sphere(new V3(0, crownY, 0), crownRad + 8);
    await ctx.yield();
    const leafTex = makeLeafTexture(rng); await ctx.yield();
    const mat = patch(new THREE.MeshStandardMaterial({ map: leafTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1, metalness: 0 }), U, 'leaf', LEAF_OPTS);
    const leaves = new THREE.Mesh(g, mat); leaves.name = 'leaves'; group.add(leaves);
  }
  await ctx.yield();

  // ---- seedling pods (propagules): dangling under the crown, a few dropping, spearing the water and bobbing
  {
    const P = makeBuilder(), green = cLeaf.clone().multiplyScalar(0.8), tipc = new THREE.Color('#6a4a22');
    const pts = [new V3(0, 0, 0), new V3(0, -0.12, 0), new V3(0, -0.5, 0), new V3(0, -0.85, 0), new V3(0, -1, 0)], rr = [0.02, 0.05, 0.062, 0.04, 0.004];
    tube(P, pts, (i) => rr[i], 3, (i, j, out) => { tmpC.copy(green).lerp(tipc, i / 4 * 0.8); if (i === 0) tmpC.copy(tipc); out[0] = tmpC.r; out[1] = tmpC.g; out[2] = tmpC.b; });
    const base = finish(P), g = new THREE.InstancedBufferGeometry();
    g.index = base.index; for (const k of ['position', 'normal', 'color']) g.setAttribute(k, base.getAttribute(k));
    const n = 180, iA = new Float32Array(n * 4), iB = new Float32Array(n * 2);
    for (let i = 0; i < n; i++) {
      const cl = rng.pick(clumps), a = rng.range(0, 6.283), r = cl.r * rng.range(0.2, 0.95), falling = i < 26;
      let x = cl.c.x + Math.cos(a) * r, z = cl.c.z + Math.sin(a) * r;
      if (falling && Math.abs(x) < 3.5) x = 3.5 * Math.sign(x || 1) + x;
      iA.set([x, cl.c.y - cl.r * rng.range(0.5, 0.72), z, rng()], i * 4);
      iB.set([falling ? rng.range(6, 11) : 0, rng.range(0.7, 1.15)], i * 2);
    }
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 2));
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new V3(0, 15, 0), 40);
    const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.45 }), U, 'pod', POD_OPTS);
    const pods = new THREE.Mesh(g, mat); pods.name = 'pods'; group.add(pods);
  }

  // ================================================================= SCARLET IBIS (roosting + gliding), one instanced mesh
  {
    const pa = [], pb = [], col = [], aw = [], idx = [];
    const scar = cScarlet, bill = new THREE.Color('#4a2620'), leg = new THREE.Color('#b8433a'), blk = new THREE.Color('#0c0a0a');
    const ringsOf = (pts, radii, sides, out) => {
      for (let i = 0; i < pts.length; i++) {
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
        let ty = b[1] - a[1], tz = b[2] - a[2]; const l = Math.hypot(ty, tz) || 1; ty /= l; tz /= l;
        for (let j = 0; j < sides; j++) {
          const an = (j / sides) * 6.283 + 0.6, cs = Math.cos(an) * radii[i], sn = Math.sin(an) * radii[i];
          out.push(pts[i][0] + cs, pts[i][1] - tz * sn, pts[i][2] + ty * sn);
        }
      }
    };
    const spine = (A, Bp, radii, sides, cf, neck) => {
      const b0 = pa.length / 3; ringsOf(A, radii, sides, pa); ringsOf(Bp, radii, sides, pb);
      for (let i = 0; i < A.length; i++) for (let j = 0; j < sides; j++) { const c = cf(i); col.push(c.r, c.g, c.b); aw.push(0, neck ? i / (A.length - 1) : 0); }
      for (let i = 0; i < A.length - 1; i++) for (let j = 0; j < sides; j++) {
        const p0 = b0 + i * sides + j, p1 = b0 + i * sides + (j + 1) % sides, p2 = p0 + sides, p3 = p1 + sides;
        idx.push(p0, p2, p1, p1, p2, p3);
      }
    };
    // body (roost: upright; fly: level), neck + head + down-curved bill, legs
    spine([[0, 0.33, -0.2], [0, 0.4, -0.08], [0, 0.5, 0.06], [0, 0.56, 0.13]], [[0, 0, -0.26], [0, 0, -0.1], [0, 0, 0.08], [0, 0, 0.2]],
      [0.012, 0.085, 0.098, 0.04], 4, (i) => (i === 0 ? blk : scar));
    spine([[0, 0.55, 0.12], [0, 0.71, 0.16], [0, 0.84, 0.19], [0, 0.8, 0.28], [0, 0.69, 0.35]],
      [[0, 0, 0.18], [0, 0.02, 0.4], [0, 0.03, 0.53], [0, 0.0, 0.63], [0, -0.09, 0.71]],
      [0.04, 0.028, 0.044, 0.018, 0.004], 3, (i) => (i >= 3 ? bill : scar), true);
    for (const sx of [-1, 1]) { // legs: one thin quad each
      const b0 = pa.length / 3, x = sx * 0.036;
      pa.push(x - 0.01, 0.36, -0.03, x + 0.01, 0.36, -0.01, x - 0.008, 0, -0.01, x + 0.008, 0, 0.01);
      pb.push(x - 0.012, -0.04, -0.18, x + 0.012, -0.04, -0.18, x - 0.009, -0.06, -0.52, x + 0.009, -0.06, -0.52);
      for (let i = 0; i < 4; i++) { col.push(leg.r, leg.g, leg.b); aw.push(0, 0); }
      idx.push(b0, b0 + 2, b0 + 1, b0 + 1, b0 + 2, b0 + 3);
    }
    for (const sx of [-1, 1]) { // wings: A shoulder, B root back, C wrist front, D wrist back, E tip (black)
      const b0 = pa.length / 3;
      pa.push(sx * 0.09, 0.53, 0.09, sx * 0.075, 0.43, -0.1, sx * 0.105, 0.49, -0.02, sx * 0.09, 0.37, -0.15, sx * 0.045, 0.31, -0.3);
      pb.push(sx * 0.06, 0.03, 0.1, sx * 0.06, 0.01, -0.14, sx * 0.44, 0.05, 0.12, sx * 0.4, 0.02, -0.12, sx * 0.86, 0.04, -0.03);
      for (const [c, w] of [[scar, 0], [scar, 0], [scar, 0.5], [scar, 0.5], [blk, 1]]) { col.push(c.r, c.g, c.b); aw.push(w, 0); }
      if (sx > 0) idx.push(b0, b0 + 2, b0 + 1, b0 + 1, b0 + 2, b0 + 3, b0 + 2, b0 + 4, b0 + 3); else idx.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2, b0 + 2, b0 + 3, b0 + 4);
    }
    const nrm = (p) => { const t = new THREE.BufferGeometry(); t.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); t.setIndex(idx); t.computeVertexNormals(); const a = t.getAttribute('normal'); t.dispose(); return a; };
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pa, 3)); g.setAttribute('normal', nrm(pa));
    g.setAttribute('aFly', new THREE.Float32BufferAttribute(pb, 3)); g.setAttribute('aFlyN', nrm(pb));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 2)); g.setIndex(idx);
    const nFly = 38, n = nIbis + nFly, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), d = new V3();
    const tx = trunkAt(18).x, tz = trunkAt(18).z;
    for (let i = 0; i < n; i++) {
      if (i < nIbis) {
        if (i % 11 === 0 && perches.length) { const pc = rng.pick(perches); iA.set([pc.p.x, pc.p.y + pc.r * 0.9, pc.p.z, rng.range(0, 6.283)], i * 4); }
        else {
          const cl = rng.pick(clumps); d.set(rng.gauss(), Math.abs(rng.gauss()) * 0.9 + 0.25, rng.gauss()).normalize();
          iA.set([cl.c.x + d.x * cl.r * 1.12, cl.c.y + d.y * cl.r * 0.8 + 0.5, cl.c.z + d.z * cl.r * 1.12, rng.range(0, 6.283)], i * 4);
        }
        iB.set([rng(), rng.range(1.8, 2.3), 0, 0], i * 4);
      } else {
        const low = rng.chance(0.15);
        iA.set([tx, low ? rng.range(5, 13) : rng.range(19, 37), tz, 0], i * 4);
        iB.set([rng(), rng.range(1.5, 2.0), 1, (low ? rng.range(crownRad + 9, crownRad + 20) : rng.range(crownRad + 2, crownRad + 16)) * (rng.chance(0.75) ? swirl : -swirl)], i * 4);
      }
    }
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new V3(0, 20, 0), 90);
    const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, side: THREE.DoubleSide }), U, 'ibis', {
      vHead: 'attribute vec3 aFly; attribute vec3 aFlyN; attribute vec2 aW; attribute vec4 iA; attribute vec4 iB;\n',
      vNormal: /* glsl */`
        float sd = iB.x, mode = iB.z;
        float lift = (1.0 - mode) * smoothstep(sd * 0.45, sd * 0.45 + 0.3, uHcStrike);
        float fly = max(mode, smoothstep(0.0, 0.25, lift));
        vec3 base = iA.xyz; float yaw = iA.w;
        if (mode > 0.5) { float rad = abs(iB.w), dr = sign(iB.w), ang = sd * 6.283 + uHcTime * dr * 8.0 / rad;
          base += vec3(sin(ang), 0.0, cos(ang)) * rad * (1.0 + 0.12 * sin(ang * 2.0 + sd * 9.0)); base.y += sin(uHcTime * 0.3 + sd * 9.0) * 1.5; yaw = ang + dr * 1.5708; }
        else { vec3 ow = normalize(vec3(base.x, 0.0, base.z) + 0.001);
          base += vec3(0.0, 1.0, 0.0) * lift * (5.0 + sd * 13.0) + ow * lift * lift * (9.0 + sd * 15.0);
          float sa = lift * (0.7 + sd) * 1.1, sc2 = cos(sa), ss2 = sin(sa); base.xz = vec2(base.x * sc2 + base.z * ss2, -base.x * ss2 + base.z * sc2);
          yaw += lift * 3.0; }
        vec3 pp = mix(position, aFly, fly);
        float fl = fly * (mode > 0.5 ? smoothstep(-0.2, 0.6, sin(uHcTime * 0.6 + sd * 20.0)) : 1.0);
        pp.y += (sin(uHcTime * (mode > 0.5 ? 7.0 : 11.0) + sd * 30.0) * 0.36 * fl + 0.1 * fly) * aW.x;
        float pr = smoothstep(0.55, 1.0, sin(uHcTime * 0.8 + sd * 40.0)) * (1.0 - fly);
        pp.z += pr * aW.y * 0.05; pp.y -= pr * aW.y * 0.16;
        pp *= iB.y; float yc = cos(yaw), ys = sin(yaw);
        pp = vec3(pp.x * yc + pp.z * ys, pp.y, -pp.x * ys + pp.z * yc);
        vec3 nn = normalize(mix(objectNormal, aFlyN, fly));
        objectNormal = vec3(nn.x * yc + nn.z * ys, nn.y, -nn.x * ys + nn.z * yc);`,
      vBody: 'transformed = base + pp;',
      fLit: 'outgoingLight += diffuseColor.rgb * 0.1;',
    });
    const ibis = new THREE.Mesh(g, mat); ibis.name = 'ibis'; group.add(ibis);
  }
  await ctx.yield();

  // ================================================================= BELOW THE LINE
  const floorY = (x, z) => { const r = Math.hypot(x, z); return FLOOR - 0.03 + 0.55 * (1 - smoothstep(0, 26, r)) - 1.3 * smoothstep(27, 46, r) + 0.14 * noise.n2(x * 0.25, z * 0.25) * (1 - smoothstep(24, 30, r)); };
  const grassAt = (x, z) => noise.fbm2(x * 0.07 + 3, z * 0.07 - 5, 3) + 0.25 * Math.sin(x * 0.21 + z * 0.13);
  const nearNave = () => { let b = rng.pick(under); for (let i = 0; i < 2; i++) { const c = rng.pick(under); if (Math.abs(c.p.x) < Math.abs(b.p.x)) b = c; } return b; };
  // ---- sponges furring the roots (merged lumpy blobs)
  {
    const S = makeBuilder(), ico = icoIndexed(1), v = new V3(), c = new THREE.Color();
    const cols = [cGold.clone().lerp(new THREE.Color('#ff6a1a'), 0.6), new THREE.Color('#7b3fa8'), new THREE.Color('#e8b83a'), new THREE.Color('#c2477a'), new THREE.Color('#ff8a3a')];
    const n = Math.min(300, under.length);
    for (let k = 0; k < n; k++) {
      if ((k & 63) === 63) await ctx.yield();
      const u = nearNave(), a = rng.range(0, 6.283), el = rng.range(-0.5, 0.5), s = rng.range(0.09, 0.2) + u.r * 0.6;
      const tubeS = rng.chance(0.25), sx = s * rng.range(0.8, 1.3), sy = s * (tubeS ? rng.range(1.8, 2.8) : rng.range(0.7, 1.2)), sz = s * rng.range(0.8, 1.3);
      const ox = u.p.x + Math.cos(a) * (u.r + s * 0.45), oy = u.p.y + el * 0.5, oz = u.p.z + Math.sin(a) * (u.r + s * 0.45);
      const base = rng.pick(cols), b0 = S.pos.length / 3, sd = rng.range(0, 50);
      for (let q = 0; q < ico.idx.length; q++) S.idx.push(b0 + ico.idx[q]);
      for (let i = 0; i < ico.count; i++) {
        v.set(ico.pos[i * 3], ico.pos[i * 3 + 1], ico.pos[i * 3 + 2]);
        const d = 1 + 0.26 * Math.sin(v.x * 5 + sd) * Math.sin(v.y * 6 + sd * 1.3) + 0.2 * Math.sin(v.z * 7 + sd * 0.7) + (tubeS ? 0.25 * v.y : -0.15 * Math.abs(v.y));
        S.pos.push(ox + v.x * sx * d, oy + v.y * sy * d, oz + v.z * sz * d); S.nor.push(v.x, v.y, v.z);
        c.copy(base).multiplyScalar(0.55 + 0.4 * (d - 0.6) + 0.25 * Math.max(0, v.y)); S.col.push(c.r, c.g, c.b);
      }
    }
    await ctx.yield();
    const sponges = new THREE.Mesh(finish(S), patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), U, 'sponge', SPONGE_OPTS));
    sponges.name = 'sponges'; group.add(sponges);
  }
  await ctx.yield();
  // ---- algae beards on the roots + turtle grass on the sand: one swaying mesh
  {
    const G = makeBuilder(), c = [0, 0, 0];
    const strip = (x, y, z, dy, len, w0, w1, segs, ang, col0, col1, bend) => {
      const b0 = G.pos.length / 3, ph = rng.range(0, 6.283), cx = Math.cos(ang), sz = Math.sin(ang);
      for (let i = 0; i <= segs; i++) {
        const t = i / segs, w = lerp(w0, w1, t) * 0.5, yy = y + dy * len * t;
        for (const sd of [-1, 1]) {
          G.pos.push(x + cx * w * sd, yy, z + sz * w * sd); G.nor.push(-sz * 0.4, 0.9, cx * 0.4);
          tmpC.copy(col0).lerp(col1, t); c[0] = tmpC.r; G.col.push(tmpC.r, tmpC.g, tmpC.b); G.ext.push(t * t * len * bend, ph);
        }
        if (i < segs) { const p = b0 + i * 2; G.idx.push(p, p + 1, p + 2, p + 1, p + 3, p + 2); }
      }
    };
    const alA = new THREE.Color('#2f6a1e'), alB = new THREE.Color('#8fb83a'), grA = cShade.clone().multiplyScalar(0.7), grB = cLeaf.clone().multiplyScalar(0.85);
    for (let k = 0; k < 640 && under.length; k++) {
      if ((k & 127) === 127) await ctx.yield();
      const u = nearNave(), a = rng.range(0, 6.283);
      strip(u.p.x + Math.cos(a) * u.r * 0.8, u.p.y, u.p.z + Math.sin(a) * u.r * 0.8, -1, rng.range(0.8, 2.4), rng.range(0.14, 0.3), 0.02, 3, rng.range(0, 3.14), alA, alB, 0.55);
    }
    await ctx.yield();
    for (let k = 0, made = 0; k < 6000 && made < 900; k++) {
      if ((k & 255) === 255) await ctx.yield();
      const a = rng.range(0, 6.283), r = Math.sqrt(rng()) * 27, x = Math.cos(a) * r, z = Math.sin(a) * r;
      if (grassAt(x, z) < 0.05) continue;
      strip(x, floorY(x, z) - 0.05, z, 1, rng.range(0.5, 1.0), rng.range(0.1, 0.16), 0.03, 1, rng.range(0, 3.14), grA, grB, 0.5); made++;
    }
    await ctx.yield();
    const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, side: THREE.DoubleSide }), U, 'sway', SWAY_OPTS);
    const sway = new THREE.Mesh(await finishAsync(G, ctx, 'aSw', 2), mat); sway.name = 'algae-grass'; group.add(sway);
  }
  await ctx.yield();
  // ---- sand mound
  if (opts.floor !== false) {
    const F = makeBuilder(), rings = 22, segs = 44, sand = new THREE.Color('#E9DDB8').multiplyScalar(0.78), gcol = cShade.clone().lerp(sand, 0.35), deepC = cTurq.clone().multiplyScalar(0.22);
    for (let i = 0; i <= rings; i++) for (let j = 0; j <= segs; j++) {
      const r = Math.pow(i / rings, 0.85) * 46, a = (j / segs) * 6.283, x = Math.cos(a) * r, z = Math.sin(a) * r;
      F.pos.push(x, floorY(x, z), z); F.nor.push(0, 1, 0);
      tmpC.copy(sand).lerp(gcol, smoothstep(0.0, 0.25, grassAt(x, z)) * 0.7).lerp(deepC, smoothstep(27, 45, r) * (opts.floorFade ?? 1)); F.col.push(tmpC.r, tmpC.g, tmpC.b);
      if (i < rings && j < segs) { const p = i * (segs + 1) + j; F.idx.push(p, p + 1, p + segs + 1, p + 1, p + segs + 2, p + segs + 1); }
    }
    const g = finish(F); g.computeVertexNormals();
    const floor = new THREE.Mesh(g, patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }), U, 'floor',
      { fColor: 'diffuseColor.rgb *= 0.8 + 0.3 * hcNoise(vec3(vHcP.xz * 2.5 + sin(vHcP.zx * 0.7) * 1.5, 1.0)) + 0.12 * sin(vHcP.x * 9.0 + sin(vHcP.z * 2.0) * 2.0);' }));
    floor.name = 'sand'; group.add(floor);
  }
  await ctx.yield();

  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const camL = { value: new V3(0, 10, 80) };
  const FOG_ADD = /* glsl */`
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        col *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
      #endif
    #endif`;
  // ---- the bait ball: 5,000 silversides orbiting a breathing, lobed ball entirely in the vertex shader
  {
    // one silverside: an elongated diamond body with a forked tail in the vertical plane (2:7), plus one horizontal
    // sliver so the fish does not vanish when seen from above or below
    const g = new THREE.InstancedBufferGeometry();
    const N = [0.5, 0, 0], TF = [0.17, 0.14, 0], R1 = [-0.36, 0.035, 0], R2 = [-0.36, -0.035, 0], BF = [0.17, -0.125, 0], RM = [-0.34, 0, 0], T1 = [-0.52, 0.15, 0], T2 = [-0.52, -0.15, 0], C = [-0.44, 0, 0];
    g.setAttribute('position', new THREE.Float32BufferAttribute([...N, ...TF, ...R1, ...N, ...R1, ...R2, ...N, ...R2, ...BF, ...RM, ...T1, ...C, ...RM, ...C, ...T2,
      0.42, 0, 0, -0.26, 0, 0.06, -0.26, 0, -0.06], 3));
    g.setAttribute('aNrm', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1], 1));
    const aS = new Float32Array(nFish * 4); for (let i = 0; i < aS.length; i++) aS[i] = rng();
    g.setAttribute('aS', new THREE.InstancedBufferAttribute(aS, 4)); g.instanceCount = nFish;
    g.boundingSphere = new THREE.Sphere(ballC.clone(), 45);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...U, uSwirl: { value: swirl } }, fog: true, clipping: true, side: THREE.DoubleSide,
      vertexShader: HC_PARS + /* glsl */`
        #include <common>
        #include <fog_pars_vertex>
        #include <clipping_planes_pars_vertex>
        attribute vec4 aS; attribute float aNrm; uniform vec4 uHcBall; uniform float uSwirl; uniform float uHcBurst;
        varying vec3 vN; varying vec3 vV; varying float vFlash; varying vec3 vB; varying float vRnd;
        vec3 fishPos(float t, out float flash, out float roll){
          // most of the school rides the outer shell, so from inside it is a swirling wall and from outside a solid ball;
          // the inner shell is a second lane streaming the other way round
          float lat = asin(clamp(aS.y * 2.0 - 1.0, -1.0, 1.0)), shell = mix(0.66, 1.0, sqrt(aS.x)), lane = aS.x < 0.2 ? -1.0 : 1.0;
          float om = uSwirl * lane * (0.5 + 0.16 * sin(lat * 3.0)) / max(shell, 0.5);
          float th = aS.z * 6.2832 + t * om;
          float breathe = 1.0 + 0.13 * sin(t * 0.7) + 0.07 * sin(t * 1.9 + 1.0);
          float lobe = 1.0 + 0.18 * sin(th * 2.0 - t * 0.6 + lat * 2.0) + 0.07 * sin(th * 5.0 + t * 1.3);
          lat += 0.12 * sin(t * 0.8 + aS.w * 6.2832 + th);
          flash = smoothstep(0.1, 1.0, sin(th * 2.0 - t * 2.4 * uSwirl + lat * 3.0));
          roll = 0.62 * sin(th * 3.0 - t * 2.1 * uSwirl + lat * 4.0 + aS.w * 1.6);      // bands of the school roll their flanks to the light together
          return vec3(cos(lat) * cos(th), sin(lat) * 0.56, cos(lat) * sin(th)) * uHcBall.w * shell * breathe * lobe; }
        void main(){
          float f0, f1, r0, r1; vec3 p0 = fishPos(uHcTime, f0, r0), p1 = fishPos(uHcTime + 0.08, f1, r1);
          vec3 fw = normalize(p1 - p0 + vec3(1e-4, 0.0, 0.0));
          float hn = (aS.w - 0.5) * 0.62 + 0.17 * sin(uHcTime * 1.7 + aS.z * 50.0);        // every fish holds its own heading, +-18 degrees and wandering
          fw = normalize(fw + cross(vec3(0.0, 1.0, 0.0), fw) * hn + vec3(0.0, (aS.y - 0.5) * 0.3 * sin(uHcTime * 1.3 + aS.x * 40.0), 0.0) + vec3(1e-4, 0.0, 0.0));
          float burst = uHcBurst * (1.1 + 2.6 * aS.w);
          vec3 P = uHcBall.xyz + p0 * (1.0 + burst);
          fw = normalize(mix(fw, normalize(p0 + 1e-3), clamp(uHcBurst * 3.0, 0.0, 0.9)));
          // the hole round the lens is a tunnel along the line of travel (z): the school parts sideways and streams round it
          vec3 dv = P - uHcAvoid.xyz; dv.z *= 0.55; float dl = length(dv);
          P.xy += dv.xy / max(length(dv.xy), 1e-3) * max(0.0, uHcAvoid.w - dl) * 0.95;
          P.y = clamp(P.y, ${(FLOOR + 0.6).toFixed(1)}, -0.3);
          vec3 sd0 = normalize(cross(vec3(0.0, 1.0, 0.0), fw) + vec3(0.0, 0.0, 1e-4)), up0 = cross(fw, sd0);
          float rc = cos(r0), rs = sin(r0); vec3 sdv = sd0 * rc + up0 * rs, up = up0 * rc - sd0 * rs;
          float dcam = length((modelViewMatrix * vec4(P, 1.0)).xyz);
          float sz = 0.4 * (0.75 + 0.5 * aS.w) * (1.0 + 1.5 * smoothstep(22.0, 85.0, dcam));    // stay a pixel or two tall far off
          float wag = sin(uHcTime * 13.0 + aS.z * 40.0) * smoothstep(0.1, -0.5, position.x) * 0.16;
          vec3 pos = P + (fw * position.x + up * position.y + sdv * (position.z + wag)) * sz;
          vHcP = pos; vFlash = f0; vB = vec3(position.xy, aNrm); vRnd = aS.w;
          vN = normalMatrix * (aNrm > 0.5 ? up : sdv);
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0); vV = -mvPosition.xyz;
          gl_Position = projectionMatrix * mvPosition;
          #include <clipping_planes_vertex>
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        #include <clipping_planes_pars_fragment>
        ` + HC_FRAG + /* glsl */`
        varying vec3 vN; varying vec3 vV; varying float vFlash; varying vec3 vB; varying float vRnd;
        void main(){
          #include <clipping_planes_fragment>
          float dist = length(vV); vec3 N = normalize(vN), V = vV / max(dist, 1e-4); float nv = dot(N, V); if (nv < 0.0) N = -N;
          vec3 Lv = normalize((viewMatrix * vec4(uHcSun, 0.0)).xyz);
          // dark blue-green back, silver flank with a bright lateral stripe, pale belly, a dark eye
          float yb = vB.z > 0.5 ? (nv > 0.0 ? 0.9 : -0.9) : vB.y / 0.14;
          vec3 alb = mix(vec3(0.86, 0.9, 0.88), vec3(0.6, 0.72, 0.76), smoothstep(-0.9, -0.2, yb));
          alb = mix(alb, vec3(0.08, 0.2, 0.24), smoothstep(0.34, 0.72, yb));
          float stripe = smoothstep(0.2, 0.0, abs(yb - 0.08)) * step(vB.z, 0.5) * smoothstep(-0.36, -0.2, vB.x);
          alb = mix(alb, vec3(0.03, 0.05, 0.05), smoothstep(0.034, 0.02, length(vB.xy - vec2(0.37, 0.025))) * step(vB.z, 0.5));
          float diff = 0.3 + 0.7 * abs(dot(N, Lv));
          float spec = max(dot(reflect(-Lv, N), V), 0.0); spec = spec * spec; spec = spec * spec; spec = spec * spec * spec;
          float glance = 1.0 - abs(nv); glance = glance * glance;
          vec3 env = vec3(0.05, 0.12, 0.12);
          #ifdef USE_FOG
            env = fogColor * 1.7 + 0.04;                 // a silver fish mostly mirrors the water around it
          #endif
          vec3 col = alb * (uHcSunCol * 0.26 * diff + env * (0.6 + 0.4 * diff)) * (0.72 + 0.6 * vRnd);
          // a metallic flank whatever the light: silver-white below the lateral line, blue-green above it
          float flank = (1.0 - smoothstep(0.25, 0.7, yb)) * step(vB.z, 0.5);
          col = mix(col, vec3(0.5, 0.57, 0.58) * (0.6 + 0.55 * diff) * (0.8 + 0.4 * vRnd), flank * 0.78);
          col = mix(col, vec3(0.03, 0.05, 0.05), smoothstep(0.034, 0.02, length(vB.xy - vec2(0.37, 0.025))) * step(vB.z, 0.5));
          // the silver flash: the flank as a mirror for the light coming down through the surface; it fires in bands as the school rolls
          vec3 Ls = normalize((viewMatrix * vec4(normalize(uHcSun + vec3(0.0, 1.3, 0.0)), 0.0)).xyz);
          float mir = max(dot(reflect(-Ls, N), V), 0.0); mir *= mir; mir *= mir; mir = mir * mir * mir;      // ^12
          // the flash: a mirror flank catching the sun, strongest at glancing angles and where the school's wave passes
          vec3 glint = uHcSunCol * (spec * (0.5 + 3.0 * vFlash) + glance * vFlash * 0.7) * (0.35 + 0.65 * stripe)
                     + uHcSunCol * vFlash * vFlash * 0.35 * smoothstep(18.0, 60.0, dist)
                     + max(uHcSunCol, vec3(0.9)) * 1.25 * mir * (0.35 + 0.65 * vFlash) * step(vB.z, 0.5);
          // where the wave of the school rolls its flanks to the light, one fish in five is a blooming white blade
          float fire = smoothstep(0.5, 0.92, vFlash) * (0.55 + 0.45 * sin(uHcTime * 7.0 + vRnd * 61.0)) * mix(0.5, 1.0, smoothstep(2.5, 14.0, dist));
          glint += mix(vec3(1.0, 0.98, 0.9), vec3(0.85, 1.0, 0.97), vRnd) * 3.4 * fire * (0.3 + 0.7 * flank) * (0.45 + 0.55 * stripe + 0.3 * glance);
          col = hcApply(col, vec3(0.0), vHcP, dist);
          float ff = 0.0;
          #ifdef USE_FOG
            #ifdef FOG_EXP2
              ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
            #else
              ff = smoothstep(fogNear, fogFar, vFogDepth);
            #endif
            col = mix(col, fogColor, ff);
          #endif
          col += glint * (1.0 - 0.5 * ff) * (vHcP.y < 0.0 ? mix(vec3(1.0), uHcAbsorb, 0.35) : vec3(1.0));    // the glint cuts through half the haze
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const fish = new THREE.Mesh(g, mat); fish.name = 'bait-ball'; group.add(fish);
  }

  // ---- young lemon sharks circling the ball (two equal dorsal fins, blunt snout), sine-bend swimming
  {
    const S = makeBuilder(), top = new THREE.Color('#9c8a52'), belly = new THREE.Color('#d9d2b4'), finC = new THREE.Color('#7d6e40');
    const xs = [0.5, 0.47, 0.4, 0.28, 0.12, -0.05, -0.2, -0.33, -0.43, -0.5], hh = [0.012, 0.04, 0.062, 0.078, 0.085, 0.078, 0.062, 0.042, 0.026, 0.018], ww = [0.02, 0.05, 0.066, 0.07, 0.068, 0.058, 0.044, 0.028, 0.014, 0.008];
    const sides = 6;
    for (let i = 0; i < xs.length; i++) for (let j = 0; j <= sides; j++) {
      const a = (j / sides) * 6.283, cy = Math.cos(a), sz = Math.sin(a);
      S.pos.push(xs[i], cy * hh[i] * (cy < 0 ? 0.8 : 1), sz * ww[i]); S.nor.push(0, cy, sz);
      tmpC.copy(belly).lerp(top, smoothstep(-0.5, 0.2, cy)); S.col.push(tmpC.r, tmpC.g, tmpC.b);
      if (i < xs.length - 1 && j < sides) { const p = i * (sides + 1) + j; S.idx.push(p, p + 1, p + sides + 1, p + 1, p + sides + 2, p + sides + 1); }
    }
    const fin = (a, b, c, n) => { const b0 = S.pos.length / 3; S.pos.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) { S.nor.push(...n); S.col.push(finC.r, finC.g, finC.b); } S.idx.push(b0, b0 + 1, b0 + 2); };
    fin([0.16, 0.07, 0], [-0.02, 0.075, 0], [-0.03, 0.2, 0], [0, 0.3, 1]);            // first dorsal
    fin([-0.16, 0.06, 0], [-0.3, 0.045, 0], [-0.31, 0.16, 0], [0, 0.3, 1]);           // second dorsal, nearly as large
    for (const s of [-1, 1]) fin([0.26, -0.035, s * 0.06], [0.1, -0.04, s * 0.06], [0.06, -0.09, s * 0.27], [0, 1, 0]);
    for (const s of [-1, 1]) fin([-0.12, -0.05, s * 0.04], [-0.2, -0.045, s * 0.035], [-0.21, -0.08, s * 0.1], [0, 1, 0]);
    fin([-0.44, 0.02, 0], [-0.5, -0.02, 0], [-0.74, 0.21, 0], [0, 0.2, 1]);            // caudal, long upper lobe
    fin([-0.44, 0.0, 0], [-0.52, 0.0, 0], [-0.6, -0.1, 0], [0, 0.2, 1]);
    const base = finish(S), g = new THREE.InstancedBufferGeometry();
    g.index = base.index; for (const k of ['position', 'normal', 'color']) g.setAttribute(k, base.getAttribute(k));
    const iA = new Float32Array(nSharks * 4), iB = new Float32Array(nSharks * 2);
    for (let i = 0; i < nSharks; i++) {
      const rad = ballR + rng.range(1.2, 2.1);
      iA.set([rad, rng.range(-4.6, -1.3), rng.range(0, 6.283) + i, (rng.chance(0.75) ? -swirl : swirl) * rng.range(1.0, 1.6) / rad], i * 4);
      iB.set([rng.range(1.3, 1.8), rng()], i * 2);
    }
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 2));
    g.instanceCount = nSharks; g.boundingSphere = new THREE.Sphere(ballC.clone(), 16);
    const mat = patch(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, side: THREE.DoubleSide }), U, 'shark', {
      vHead: 'attribute vec4 iA; attribute vec2 iB; uniform vec4 uHcBall;\n',
      vNormal: /* glsl */`
        float ang = iA.z + uHcTime * iA.w * (1.0 + uHcStrike * 2.0), rad = iA.x * (1.0 + 0.1 * sin(ang * 2.0 + iB.y * 7.0));
        vec3 base = vec3(uHcBall.x + cos(ang) * rad, iA.y + 0.5 * sin(uHcTime * 0.25 + iB.y * 20.0), uHcBall.z + sin(ang) * rad);
        vec3 dv = base - uHcAvoid.xyz; float dl = length(dv); base += dv / max(dl, 1e-3) * max(0.0, uHcAvoid.w + 1.2 - dl);
        vec3 fw = vec3(-sin(ang), 0.0, cos(ang)) * sign(iA.w), zax = cross(fw, vec3(0.0, 1.0, 0.0));
        vec3 pl = position;
        pl.z += sin(uHcTime * 4.2 - pl.x * 5.0 + iB.y * 30.0) * 0.085 * smoothstep(0.35, -0.6, pl.x);
        pl *= iB.x;
        vec3 pw = fw * pl.x + vec3(0.0, pl.y, 0.0) + zax * pl.z;
        objectNormal = normalize(fw * objectNormal.x + vec3(0.0, objectNormal.y, 0.0) + zax * objectNormal.z);`,
      vBody: 'transformed = base + pw;',
    });
    const sharks = new THREE.Mesh(g, mat); sharks.name = 'sharks'; group.add(sharks);
  }

  // ---- slanting sun rays trailing through the root cage (additive, axial billboards)
  const rayDir = new V3(-sunDir.x * 0.7, -1, -sunDir.z * 0.7).normalize();
  {
    const n = 44, top = [], dat = [], idx = [];
    for (let i = 0; i < n; i++) {
      const a = rng.range(0, 6.283), r = Math.sqrt(rng()) * 21, x = Math.cos(a) * r, z = Math.sin(a) * r, w = rng.range(0.3, 0.9), sd = rng();
      for (const [s, t] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { top.push(x, 0, z); dat.push(s, t, w, sd); }
      idx.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(top, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(dat, 4)); g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new V3(0, -3, 0), 32);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...U, uCamL: camL, uRay: { value: rayDir } }, fog: true, clipping: true, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: HC_PARS + /* glsl */`
        #include <common>
        #include <fog_pars_vertex>
        #include <clipping_planes_pars_vertex>
        attribute vec4 aD; uniform vec3 uCamL; uniform vec3 uRay; varying vec4 vD;
        void main(){
          vec3 c = position + uRay * aD.y * 7.2 + vec3(sin(uHcTime * 0.3 + aD.w * 30.0), 0.0, cos(uHcTime * 0.23 + aD.w * 17.0)) * 0.5;
          vec3 sd = normalize(cross(uRay, uCamL - c));
          vec3 pos = c + sd * aD.x * aD.z * 0.6 * (1.0 + aD.y * 0.8);
          vHcP = pos; vD = aD;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <clipping_planes_vertex>
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        #include <clipping_planes_pars_fragment>
        ` + HC_FRAG + /* glsl */`
        varying vec4 vD;
        void main(){
          #include <clipping_planes_fragment>
          float ac = cos(clamp(vD.x, -1.0, 1.0) * 1.5708); ac *= ac; ac *= ac;
          float al = smoothstep(0.0, 0.25, vD.y) * (1.0 - smoothstep(0.5, 1.0, vD.y));
          float fl = 0.55 + 0.45 * sin(uHcTime * 1.1 + vD.w * 40.0 + vD.y * 3.0);
          float streak = 0.6 + 0.4 * hcNoise(vec3(vD.x * 4.0 + vD.w * 9.0, uHcTime * 0.4, vD.w * 5.0));
          vec3 col = uHcSunCol * vec3(0.75, 1.0, 0.85) * ac * al * fl * streak * (uHcCamY < 0.0 ? 0.085 : 0.04);
          ${FOG_ADD}
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const rays = new THREE.Mesh(g, mat); rays.name = 'rays'; rays.renderOrder = 3; group.add(rays);
  }

  // ---- preview lagoon surface (opts.water !== false): translucent, sky fresnel, glints, shade under the dome
  if (opts.water !== false) {
    const g = new THREE.CircleGeometry(400, 72); g.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: { ...fogU(), ...U, uCamL: camL, uTurq: { value: cTurq }, uHorizon: { value: cSky }, uZenith: { value: new THREE.Color('#2F7FD0') }, uTree: { value: cShade.clone().multiplyScalar(0.45) } },
      fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      vertexShader: HC_PARS + /* glsl */`
        #include <common>
        #include <fog_pars_vertex>
        void main(){ vHcP = position; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        ` + HC_FRAG + /* glsl */`
        uniform vec3 uCamL; uniform vec3 uTurq; uniform vec3 uHorizon; uniform vec3 uZenith; uniform vec3 uTree;
        void main(){
          vec3 p = vHcP, V = uCamL - p; float dist = length(V); V /= dist; float t = uHcTime; vec2 q = p.xz;
          float w1 = cos(q.x * 0.9 + q.y * 0.3 + t * 1.1), w2 = cos(q.y * 1.7 + q.x * 0.5 - t * 1.4);
          vec2 gr = 0.05 * w1 * vec2(1.0, 0.33) + 0.04 * w2 * vec2(0.3, 1.0);
          float n1 = hcNoise(vec3(q * 2.3, t * 0.6)), n2 = hcNoise(vec3(q * 2.3 + vec2(0.2, 0.0), t * 0.6)), n3 = hcNoise(vec3(q * 2.3 + vec2(0.0, 0.2), t * 0.6));
          gr += vec2(n2 - n1, n3 - n1) * 0.55; gr /= 1.0 + dist * 0.015;
          vec3 N = normalize(vec3(-gr.x, 1.0, -gr.y));
          float sh = hcShade(vec3(p.x, 0.0, p.z)), dome = 1.0 - smoothstep(13.0, 27.0, length(q));
          vec3 col; float alpha;
          if (V.y > 0.0) {
            float fr = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
            vec3 R = reflect(-V, N); R.y = abs(R.y);
            vec3 sky = mix(uHorizon, uZenith, pow(clamp(R.y, 0.0, 1.0), 0.5));
            sky = mix(sky, uTree, dome * 0.8 * (1.0 - 0.5 * smoothstep(0.9, 1.3, sh)));
            vec3 body = uTurq * (0.5 + 0.3 * sh);
            float glint = pow(max(dot(R, uHcSun), 0.0), 500.0) * 30.0 + smoothstep(0.93, 1.0, hcNoise(vec3(q * 7.0, t * 1.5))) * smoothstep(1.0, 1.25, sh) * 1.2;
            col = mix(body, sky, fr) + uHcSunCol * glint * sh;
            alpha = mix(mix(0.42, 0.97, fr), 1.0, smoothstep(50.0, 220.0, dist));
          } else {      // seen from below: silver mirror with a bright Snell's window overhead
            float win = smoothstep(0.62, 0.74, -V.y + (n1 - 0.5) * 0.12);
            col = mix(uTurq * 0.75 + vec3(0.1) * n1, mix(uHorizon, uZenith, 0.4) * 1.5 * (0.6 + 0.5 * sh), win);
            alpha = mix(0.92, 0.55, win);
          }
          gl_FragColor = vec4(col, alpha);
          #include <fog_fragment>
        }`,
    });
    const water = new THREE.Mesh(g, mat); water.name = 'preview-water'; water.renderOrder = 2; group.add(water);
  }

  // ================================================================= hand-off
  let triangles = 0;
  group.traverse((o) => { if (o.isMesh) { const g = o.geometry, n = (g.index ? g.index.count : g.getAttribute('position').count) / 3; triangles += n * (g.isInstancedBufferGeometry ? g.instanceCount : 1); } });
  const anchors = {
    waterY: 0, floorY: FLOOR, sunDir: sunDir.toArray(),
    reveal: [0, 0.25, 78],
    flyThrough: [[0, 0, 62], [0, 0, 42], [0, 0, 26], [0, -1.7, 17], [0, -1.9, 11], [0, -1.6, 0], [0, 0, -9], [0, 0, -28], [0, 0, -48]],
    duckRoot: { position: [0, 0.3, lintelZ + 0.3], clearBelow: -1.2, present: opts.lintel !== false },
    portalSeat: { position: [0, 0, -68], facing: [0, 0, 1] },
    baitBall: { center: ballC.toArray(), radius: ballR },
    crown: { center: [trunkTop.x, crownY + liftAll, trunkTop.z], radius: crownRad },
    trunkBase: [0, 7, 0],
    viewpoints: { front: [0, 0.25, 62], inside: [0, 0.25, 3], side: [58, 9, 14], under: [0, -1.8, 24] },
  };
  let avoidOverride = null, avoidR = 2.6;
  const _cam = new V3();
  const hero = {
    object: group, radius: 27, height: 41, center: new V3(0, 11, 0), anchors, ground: true, groundY: FLOOR - 1.45,
    uniforms: U, triangles: Math.round(triangles),
    // for a split render: meshes that only matter above / below the waterline (hide them in the other pass)
    baitBall: group.children.find((o) => o.name === 'bait-ball'), fishCount: nFish,      // geometry.instanceCount may be lowered when far away
    airOnly: group.children.filter((o) => ['crown-cores', 'leaves', 'ibis'].includes(o.name)),
    seaOnly: group.children.filter((o) => ['sponges', 'algae-grass', 'sand', 'bait-ball', 'sharks', 'rays'].includes(o.name)),
    // tell the shaders which eye the next pass uses without advancing anything (see SPLIT RENDER above)
    setEye(camera) { _cam.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(_cam); camL.value.copy(_cam); U.uHcCamY.value = _cam.y; if (!avoidOverride) U.uHcAvoid.value.set(_cam.x, _cam.y, _cam.z, avoidR); },
    update(dt, time, camera) {
      U.uHcTime.value = time;
      if (camera) {
        _cam.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(_cam);
        camL.value.copy(_cam); U.uHcCamY.value = _cam.y;
        if (!avoidOverride) U.uHcAvoid.value.set(_cam.x, _cam.y, _cam.z, avoidR);
      }
      if (avoidOverride) U.uHcAvoid.value.set(avoidOverride.x, avoidOverride.y, avoidOverride.z, avoidR);
    },
    // k lifts the ibis; burst (defaults to k) scatters the bait ball, so a world can let the ball re-form while the birds stay up
    setStrike(k, burst) { U.uHcStrike.value = clamp(k, 0, 1); U.uHcBurst.value = clamp(burst ?? k, 0, 1); },
    setProgress(k) { U.uHcStrike.value = U.uHcBurst.value = clamp(k, 0, 1); },
    setAvoid(v, radius) { avoidOverride = v ? new V3().copy(v) : null; if (radius !== undefined) avoidR = radius; },
    setLight(o = {}) {
      if (o.sunDir) { sunDir.copy(o.sunDir).normalize(); rayDir.set(-sunDir.x * 0.7, -1, -sunDir.z * 0.7).normalize(); }
      if (o.sunColor) U.uHcSunCol.value.copy(o.sunColor);
      if (o.absorb) U.uHcAbsorb.value.copy(o.absorb);
      if (o.haze) { U.uHcHaze.value.x = o.haze.r; U.uHcHaze.value.y = o.haze.g; U.uHcHaze.value.z = o.haze.b; }
      if (o.hazeDensity !== undefined) U.uHcHaze.value.w = o.hazeDensity;
    },
    dispose() {},
  };
  return hero;
}
