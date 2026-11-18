// The Inside-Out World: morning inside a spinning ring habitat (radius 2 km, width 1.2 km).
//
// The hero (src/parts/inside-out-world.js) is the far ring: the land that climbs both horizons and meets
// overhead, the glass side walls, the hub with its sun-mirrors and the elevator spokes. This file builds the
// near 1.4 km of the ring as real scenery inside the hero's open arc and flies a river through it.
//
// Geometry. The ring's axis is world X and its lowest point is the origin, so the near floor is an ordinary
// height field: y = R - sqrt(R^2 - z^2) + land(x, a), where `a` is arc length along the direction of travel
// (-Z) and land() is height above the floor. Nothing is warped in a shader. Trees, the village, the bridge,
// the viaduct and the boats stand on the local radial (their up tilts with the floor, 13 degrees at either
// end of the flight); only the exit aqueduct is plumb to world Y so that its central arch frames the portal.
// The heavens (stars, a blue-white planet) are a camera-centred group that turns about the ring's axis.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as S from '../kit/structures.js';
import * as fx from '../kit/fx.js';
import { makeCloudField } from '../kit/sky.js';
import { buildHero } from '../parts/inside-out-world.js';

const RR = 2000, TAU = Math.PI * 2;
const PAL = ['#0a1030', '#7fb6ff', '#dff1ff', '#4f9a56', '#2f6f9a', '#c9b68a', '#ffcf6a'];
const OPEN = 500, FADE = 215;                 // arc the hero leaves open either side of the low point, and its fade
const A0 = -450, A1 = 450;                    // travel arc of the camera path; the aqueduct stands at A1
const DUR = 46;
const C = (h) => new THREE.Color(h);
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const bump = (x, c, w) => { const t = clamp(1 - Math.abs(x - c) / w, 0, 1); return t * t * (3 - 2 * t); };
// a function of the arc, tabulated every metre (the ground asks for the river's place and width a few hundred thousand times)
const tab = (f, lo = -770, hi = 770, st = 1) => {
  const n = Math.round((hi - lo) / st), T = new Float64Array(n + 2); for (let i = 0; i <= n + 1; i++) T[i] = f(lo + i * st);
  return (a) => { const q = (a - lo) / st; if (!(q >= 0 && q < n)) return f(a); const i = q | 0; return T[i] + (T[i + 1] - T[i]) * (q - i); };
};
const hash2 = (i, j, k = 0) => { const s = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return s - Math.floor(s); };
const zOfA = (a) => -RR * Math.sin(a / RR);
const aOfZ = (z) => -RR * Math.asin(clamp(z / RR, -0.95, 0.95));
const floorY = (z) => RR - Math.sqrt(RR * RR - z * z);

// ---------------------------------------------------------------- the heavens: stars and a planet that wheel past the windows
const HEAVEN_VERT = /* glsl */`
varying vec3 vD;
void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const HEAVEN_FRAG = /* glsl */`
uniform vec3 uSpace, uBand, uAxis; uniform float uSeed;
varying vec3 vD;
float h13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z); }
void main(){
  vec3 d = normalize(vD);
  float bx = dot(d, uAxis) / 0.26, b = exp(-bx * bx);
  float n = 0.6 * vn(d * 5.0 + uSeed) + 0.4 * vn(d * 13.0 + uSeed * 2.0);
  float dust = smoothstep(0.35, 0.8, vn(d * 9.0 + 40.0 + uSeed));
  vec3 col = uSpace * (0.75 + 0.5 * vn(d * 2.0)) + uBand * b * (0.25 + 1.3 * n * n) * (1.0 - 0.55 * dust * b);
  gl_FragColor = vec4(col, 1.0);
}`;
const STAR_VERT = /* glsl */`
attribute vec3 aCol; varying vec3 vC; varying vec2 vUv;
void main(){ vC = aCol; vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const STAR_FRAG = /* glsl */`
varying vec3 vC; varying vec2 vUv;
void main(){ float r = length(vUv); float a = exp(-r * r * 5.5) * (1.0 - smoothstep(0.8, 1.0, r)); gl_FragColor = vec4(vC * a, 1.0); }`;
const PLANET_VERT = /* glsl */`
uniform vec3 uSun;
varying vec3 vL; varying vec3 vN; varying vec3 vW; varying vec3 vLs;
void main(){ vL = normalize(position); vN = normalize(mat3(modelMatrix) * normal); vLs = mat3(modelMatrix) * uSun;
  vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const PLANET_FRAG = /* glsl */`
uniform vec3 uOcean, uLand, uSeed; uniform float uTime, uShell;
varying vec3 vL; varying vec3 vN; varying vec3 vW; varying vec3 vLs;
float h13(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z); }
float fbm(vec3 p){ return 0.5 * vn(p) + 0.25 * vn(p * 2.1 + 3.7) + 0.125 * vn(p * 4.3 + 9.1) + 0.0625 * vn(p * 8.7 + 1.3); }
void main(){
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  vec3 Ls = normalize(vLs);
  float ndl = dot(N, Ls), day = smoothstep(-0.12, 0.35, ndl);
  if (uShell > 0.5) {                                   // thin air seen edge-on, just outside the limb
    float g = smoothstep(0.0, 0.3, abs(dot(N, V)));
    gl_FragColor = vec4(vec3(0.25, 0.5, 1.0) * g * g * (0.15 + 0.85 * smoothstep(-0.3, 0.4, ndl)) * 0.9, 1.0);
    return;
  }
  vec3 p = vL * 2.3 + uSeed;
  float land = smoothstep(0.50, 0.58, fbm(p));
  vec3 col = mix(uOcean, uLand * (0.7 + 0.6 * vn(p * 5.0)), land);
  col = mix(col, vec3(0.9), smoothstep(0.78, 0.9, abs(vL.y) + 0.12 * vn(p * 6.0)));
  vec3 q = vL * 3.2 + uSeed.zxy + vec3(uTime * 0.006, 0.0, uTime * 0.003);
  q += 0.5 * vec3(vn(q * 1.7), vn(q * 1.7 + 5.0), vn(q * 1.7 + 11.0));
  float cl = smoothstep(0.46, 0.72, fbm(q * vec3(1.0, 2.2, 1.0)));
  col = mix(col, vec3(1.0), cl * 0.92);
  float rim = pow(max(1.0 - max(dot(N, V), 0.0), 1e-4), 2.5);
  vec3 lit = col * (0.03 + 1.05 * day * max(ndl, 0.0) + 0.25 * day) + vec3(0.3, 0.55, 1.0) * rim * (0.1 + 0.9 * day) * 0.9;
  lit += vec3(1.0, 0.95, 0.85) * pow(max(dot(reflect(-Ls, N), V), 1e-4), 40.0) * (1.0 - land) * (1.0 - cl) * 0.6;
  gl_FragColor = vec4(lit, 1.0);
}`;

function makeHeavens(rng, opts) {
  const group = new THREE.Group(); group.name = 'heavens';
  const axis = V3(rng.range(-0.3, 0.3), rng.range(0.4, 1), rng.range(-1, 1)).normalize();
  const bg = new THREE.Mesh(new THREE.SphereGeometry(5300, 28, 18), new THREE.ShaderMaterial({
    vertexShader: HEAVEN_VERT, fragmentShader: HEAVEN_FRAG, side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uSpace: { value: C(PAL[0]).multiplyScalar(opts.space ?? 1) }, uBand: { value: new THREE.Color(0.05, 0.075, 0.15) }, uAxis: { value: axis }, uSeed: { value: rng.range(1, 60) } },
  }));
  bg.renderOrder = 0.9; bg.frustumCulled = false; group.add(bg);
  // stars: small quads on the sphere, so their size is angular and holds at any resolution
  const n = opts.stars ?? 2200, pos = new Float32Array(n * 12), uv = new Float32Array(n * 8), col = new Float32Array(n * 12), idx = new Uint32Array(n * 6);
  const d = V3(), t1 = V3(), t2 = V3(), up = V3(0, 1, 0), alt = V3(1, 0, 0), cc = new THREE.Color();
  for (let i = 0; i < n; i++) {
    d.set(rng.gauss(), rng.gauss(), rng.gauss()).normalize();
    if (rng() < 0.45) d.addScaledVector(axis, -d.dot(axis) * rng.range(0.5, 0.95)).normalize();      // thicker along the band
    t1.crossVectors(d, Math.abs(d.y) > 0.9 ? alt : up).normalize(); t2.crossVectors(d, t1);
    const mag = Math.pow(rng(), 7), r = 5000 * lerp(0.0019, 0.0058, mag), k = lerp(0.8, 3.4, mag) * rng.range(0.7, 1.2);
    cc.setHSL(rng.pick([0.6, 0.62, 0.58, 0.1, 0.07, 0.55]), rng.range(0.15, 0.6), 0.72);
    for (let c = 0; c < 4; c++) {
      const sx = c & 1 ? 1 : -1, sy = c & 2 ? 1 : -1, o = i * 12 + c * 3;
      pos[o] = d.x * 5000 + (t1.x * sx + t2.x * sy) * r; pos[o + 1] = d.y * 5000 + (t1.y * sx + t2.y * sy) * r; pos[o + 2] = d.z * 5000 + (t1.z * sx + t2.z * sy) * r;
      uv[i * 8 + c * 2] = sx; uv[i * 8 + c * 2 + 1] = sy;
      col[o] = cc.r * k; col[o + 1] = cc.g * k; col[o + 2] = cc.b * k;
    }
    idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3], i * 6);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  sg.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); sg.setIndex(new THREE.BufferAttribute(idx, 1));
  const stars = new THREE.Mesh(sg, new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, side: THREE.DoubleSide,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
  stars.renderOrder = -1; stars.frustumCulled = false; group.add(stars);
  // the planet the ring orbits: seen through the right-hand wall, drifting as the ring turns
  const pd = opts.planetDir.clone().normalize(), prad = opts.planetRadius ?? 640;
  const side = V3().crossVectors(pd, V3(1, 0, 0)).normalize();
  const sun = V3().addScaledVector(pd, -0.35).addScaledVector(side, opts.phase ?? 0.8).addScaledVector(V3(1, 0, 0), -0.45).normalize();
  const pu = { uSun: { value: sun }, uOcean: { value: new THREE.Color(0.05, 0.17, 0.5) }, uLand: { value: new THREE.Color(0.22, 0.3, 0.14) },
    uSeed: { value: V3(rng.range(0, 30), rng.range(0, 30), rng.range(0, 30)) }, uTime: { value: 0 }, uShell: { value: 0 } };
  const pg = new THREE.SphereGeometry(prad, 48, 32);
  const planet = new THREE.Mesh(pg, new THREE.ShaderMaterial({ vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG, uniforms: pu, fog: false }));
  planet.position.copy(pd).multiplyScalar(4300); planet.rotation.set(0.4, rng.range(0, 6), 0.3); planet.renderOrder = -0.9; planet.frustumCulled = false; group.add(planet);
  const shell = new THREE.Mesh(pg, new THREE.ShaderMaterial({ vertexShader: PLANET_VERT, fragmentShader: PLANET_FRAG, side: THREE.BackSide, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false, fog: false, uniforms: { ...pu, uShell: { value: 1 } } }));
  shell.position.copy(planet.position); shell.rotation.copy(planet.rotation); shell.scale.setScalar(1.05); shell.renderOrder = -0.8; shell.frustumCulled = false; group.add(shell);
  const spin = opts.spin ?? 0.02, phase0 = opts.phase0 ?? 0;
  return { object: group, update(dt, time, camera) { pu.uTime.value = time; group.rotation.x = phase0 + spin * time; if (camera) group.position.setFromMatrixPosition(camera.matrixWorld); } };
}

// ---------------------------------------------------------------- the patchwork of fields, per pixel (see build(): "the patchwork")
const FIELD_PARS = /* glsl */`
uniform sampler2D tField, tShadow; uniform vec3 uCrop[8]; uniform vec4 uRoad; uniform vec3 uHedgeC, uRoadC, uShTint; uniform vec2 uShOff;
varying float vFld; varying vec2 vGnd;
float ioH(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float ioN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(ioH(i), ioH(i + vec2(1.0, 0.0)), f.x), mix(ioH(i + vec2(0.0, 1.0)), ioH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
// Ground that is not farmland, per pixel: pasture (grazed lawns against longer grass, worn tracks, bushes with their shadows, stones, drifts
// of flowers), the floor of the woods (leaf litter, dappled), and the rice terraces (a dark riser line at every step, a sheen of sky on the flats).
const WILD_MAIN = /* glsl */`
  { vec2 pw = vec2(gx, ga);
    float k1 = 1.0 - smoothstep(6.0, 18.0, gpx), k2 = 1.0 - smoothstep(1.5, 5.0, gpx), k3 = 1.0 - smoothstep(0.35, 1.2, gpx);
    float n1 = ioN(pw * 0.09), n2 = ioN(pw * 0.41 + 7.0), n3 = ioN(pw * 1.9 + 19.0);
    vec3 pc = base * (1.0 + 0.3 * (n1 - 0.5) * k1 + 0.3 * (n2 - 0.5) * k2 + 0.34 * (n3 - 0.5) * k3);
    // grazed lawn against long grass: two tones with a crisp, ragged edge
    float lw = ioN(pw * 0.037 + 3.0) + 0.22 * (n2 - 0.5) * k2;
    float lawn = smoothstep(0.5, 0.5 + 0.012 + gpx * 0.012, lw);
    pc *= mix(vec3(0.84, 0.9, 0.8), vec3(1.14, 1.1, 0.92), lawn * (0.4 + 0.6 * k1));
    // worn tracks
    float tf = pw.x * 0.019 + 1.4 * sin(pw.y * 0.017 + 0.5 * sin(pw.x * 0.011));
    float td = abs(fract(tf) - 0.5) / max(fwidth(tf), 1e-4) * gpx, tw = max(0.45, gpx * 0.55);
    float track = (1.0 - smoothstep(tw, tw + max(gpx, 0.3), td)) * smoothstep(0.5, 0.56, ioN(pw * 0.011 + 40.0)) * (1.0 - smoothstep(4.0, 10.0, gpx));
    pc = mix(pc, uRoadC * 0.82, track * 0.62);
    // bushes and the shadows they throw
    vec2 bq = pw / 11.0, bi = floor(bq); float bh = ioH(bi + 5.0);
    vec2 bo = (bq - bi - 0.25 - 0.5 * vec2(ioH(bi + 11.0), ioH(bi + 23.0))) * 11.0;
    float br = 0.8 + 1.5 * fract(bh * 7.0), bon = step(0.74, bh) * (1.0 - smoothstep(5.0, 12.0, gpx));
    float bush = bon * (1.0 - smoothstep(br, br + max(gpx, 0.25), length(bo + 0.5 * (n3 - 0.5))));
    pc *= 1.0 - 0.4 * bon * (1.0 - smoothstep(br * 0.9, br * 0.9 + max(gpx, 0.5), length(bo - uShOff * 0.8))) * (1.0 - bush);
    pc = mix(pc, uHedgeC * (0.75 + 0.7 * n3), bush);
    // stones
    vec2 sq = pw / 17.0, si = floor(sq); float sh = ioH(si + 41.0);
    float sr = 0.35 + 0.6 * fract(sh * 13.0), sdist = length((sq - si - 0.3 - 0.4 * vec2(ioH(si + 3.0), ioH(si + 29.0))) * 17.0);
    pc = mix(pc, vec3(0.42, 0.41, 0.37), step(0.7, sh) * (1.0 - smoothstep(sr, sr + max(gpx, 0.15), sdist)) * (1.0 - smoothstep(1.5, 4.0, gpx)));
    // drifts of flowers
    vec2 fq = pw / 0.85, fi = floor(fq); float fh1 = ioH(fi + 3.0);
    float fdot = step(0.84, fh1) * (1.0 - smoothstep(0.16, 0.3 + gpx * 0.5, length(fq - fi - 0.5))) * smoothstep(0.5, 0.66, ioN(pw * 0.028 + 60.0)) * (1.0 - smoothstep(0.45, 1.5, gpx));
    pc = mix(pc, mix(vec3(0.9, 0.78, 0.2), vec3(0.92, 0.92, 0.86), step(0.5, fract(fh1 * 31.0))), fdot * 0.85);
    // under the trees: leaf litter, darker, dappled where the sun gets through
    float wd = smoothstep(0.3, 0.75, vGnd.y);
    float dap = smoothstep(0.42, 0.6, ioN(pw * 0.33 + 31.0)) * k2;
    pc = mix(pc, base * vec3(0.7, 0.7, 0.56) * (0.72 + 0.6 * dap) * (1.0 + 0.4 * (n3 - 0.5) * k3), wd * 0.85);
    // rice terraces: one dark line along the middle of every riser, the flats a pale sheet of water with the young rice in it
    float hgt = 2000.0 - length(vec2(2000.0 - gp.y, gp.z));
    float tl = abs(fract(hgt / 3.4) - 0.5) * 3.4 / max(fwidth(hgt), 1e-4);
    float tid = ioH(vec2(floor(hgt / 3.4), 5.0));                          // each terrace at its own stage: young rice in water, or grown
    vec3 tc = mix(vec3(0.13, 0.33, 0.07), vec3(0.3, 0.46, 0.1), tid) * (0.86 + 0.3 * n1 * k1 + 0.2 * (n2 - 0.5) * k2);
    vec2 rq = pw / 0.8; float rice = 1.0 - smoothstep(0.2, 0.34 + gpx * 0.4, length(fract(rq) - 0.5));
    float wet = step(0.55, tid) * smoothstep(0.45, 0.6, ioN(pw * 0.06 + 13.0));
    tc = mix(tc, vec3(0.34, 0.5, 0.52), wet * (0.75 - 0.5 * rice * k3));    // sky in the flooded ones, the rice standing in it in rows
    tc = mix(tc, vec3(0.07, 0.14, 0.05), 1.0 - smoothstep(0.6, 1.5, tl));
    tc = mix(tc, vec3(0.36, 0.5, 0.16), (1.0 - smoothstep(1.7, 2.8, tl)) * smoothstep(0.7, 1.7, tl) * 0.7);   // the grassy bund along the lip
    pc = mix(pc, tc, smoothstep(0.2, 0.5, vGnd.x) * smoothstep(2.6, 4.2, hgt) * (1.0 - smoothstep(16.0, 40.0, gpx)));
    gcol = mix(pc, gcol, smoothstep(0.12, 0.5, vFld));
  }`;
const FIELD_MAIN_RAW = /* glsl */`
{ vec3 gp = vTWorld; float gx = gp.x, ga = -2000.0 * asin(clamp(gp.z / 2000.0, -0.95, 0.95));
  float gpx = length(fwidth(gp.xz)) + 0.001;                       // metres per pixel
  vec3 base = diffuseColor.rgb;
  vec2 fw = vec2(gx + 13.0 * sin(ga * 0.0131 + 1.7) + 6.0 * sin(ga * 0.031 + gx * 0.011 + 4.1), ga + 12.0 * sin(gx * 0.0117 + 0.6) + 6.0 * sin(gx * 0.027 - ga * 0.009 + 2.3));
  vec2 fsz = vec2(58.0, 76.0), fc = fw / fsz, ci = floor(fc), cf = fc - ci;
  vec4 ft = textureLod(tField, (ci + 16.5) / 32.0, 0.0);
  float tr = floor(ft.r * 255.0 + 0.5), tg = floor(ft.g * 255.0 + 0.5), tb = floor(ft.b * 255.0 + 0.5);
  float mode = floor(tg / 80.0), frac = (tg - mode * 80.0) / 79.0;
  float isX = step(0.5, mode) * (1.0 - step(1.5, mode)), isA = step(1.5, mode);
  float sub = isX * step(frac, cf.x) + isA * step(frac, cf.y);
  float dSplit = mix(mix(99.0, abs(cf.x - frac) * fsz.x, isX), abs(cf.y - frac) * fsz.y, isA);
  float crop = mix(tr - 8.0 * floor(tr / 8.0), floor(tr / 8.0), sub);
  float dir = mix(tb - 2.0 * floor(tb / 2.0), floor(tb / 2.0) - 2.0 * floor(tb / 4.0), sub);
  float jit = mix(floor(tb / 4.0) - 8.0 * floor(tb / 32.0), floor(tb / 32.0), sub) / 7.0;
  float e = min(min(cf.x, 1.0 - cf.x) * fsz.x, min(cf.y, 1.0 - cf.y) * fsz.y);
  float c1 = step(0.5, crop) * step(crop, 1.5), c2 = step(1.5, crop) * step(crop, 2.5), c3 = step(2.5, crop) * step(crop, 3.5), c7 = step(6.5, crop);
  vec3 fcol = mix(base * 1.05, uCrop[int(crop + 0.5)], step(0.5, crop) * 0.92) * (0.88 + 0.24 * jit);
  // drilled rows and furrows, then the tramlines the machines leave
  float ru = mix(fw.y, fw.x, dir);
  fcol *= 1.0 - (0.16 * c1 + 0.09 * c2 + 0.26 * c3 + 0.12 * c7) * (0.5 + 0.5 * sin(ru * 2.4)) * (1.0 - smoothstep(0.7, 1.9, gpx));
  float tram = 1.0 - smoothstep(0.3, 0.3 + gpx, abs(fract(ru / 13.0 + jit) - 0.5) * 13.0);
  fcol *= 1.0 - 0.24 * tram * (c1 + c2 + c7) * (1.0 - smoothstep(2.5, 6.0, gpx));
  // the grass baulk where a field is split
  fcol = mix(fcol, base * 1.12, (1.0 - smoothstep(0.5, 0.5 + gpx, dSplit)) * 0.8 * (1.0 - smoothstep(3.0, 8.0, gpx)));
  // hedges: a dark ragged line and the shadow it throws down-sun
  float hwd = max(1.05 + 0.45 * sin(fw.x * 0.83 + fw.y * 1.21) * sin(fw.x * 0.37 - fw.y * 0.53), gpx * 0.62);
  float hedge = 1.0 - smoothstep(hwd, hwd + max(gpx, 0.4), e);
  vec2 cf2 = fract((fw - uShOff) / fsz);
  float e2 = min(min(cf2.x, 1.0 - cf2.x) * fsz.x, min(cf2.y, 1.0 - cf2.y) * fsz.y);
  fcol *= 1.0 - 0.4 * (1.0 - smoothstep(0.6, 2.6 + gpx, e2)) * (1.0 - smoothstep(4.0, 10.0, gpx)) * (1.0 - hedge);
  fcol = mix(fcol, uHedgeC * (0.82 + 0.36 * sin(fw.x * 2.1) * sin(fw.y * 1.7)), hedge * (1.0 - 0.45 * smoothstep(6.0, 16.0, gpx)));
  vec3 gcol = fcol;
#WILD#
  // the road to the village: pale gravel between darker verges
  vec2 rp = vec2(gx, ga) - uRoad.xy, rs = uRoad.zw - uRoad.xy;
  float rd = length(rp - rs * clamp(dot(rp, rs) / max(dot(rs, rs), 1e-3), 0.0, 1.0)), rw = max(1.7, gpx * 0.7);
  gcol *= 1.0 - 0.22 * (1.0 - smoothstep(rw + 0.5, rw + 1.8 + gpx, rd));
  gcol = mix(gcol, uRoadC * (0.93 + 0.14 * sin(ga * 0.7 + gx * 0.4)), 1.0 - smoothstep(rw, rw + max(gpx, 0.3), rd));
  // tree shadows
  float tsh = textureLod(tShadow, vec2((gx + 600.0) / 1200.0, (ga + 700.0) / 1400.0), 0.0).r;
  diffuseColor.rgb = gcol * mix(vec3(1.0), uShTint, tsh);
}`;

const FIELD_MAIN = FIELD_MAIN_RAW.replace('#WILD#', WILD_MAIN);
// the bluff's rock: level beds a metre or two thick, each its own tone, thin courses inside them, a dark joint between beds, damp streaks down the face
const ROCK_PARS = /* glsl */`
uniform float uLift; uniform vec3 uPlanet;
float rkH(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float rkN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(rkH(i), rkH(i + vec2(1.0, 0.0)), f.x), mix(rkH(i + vec2(0.0, 1.0)), rkH(i + vec2(1.0, 1.0)), f.x), f.y); }`;
const ROCK_MAIN = /* glsl */`
{ vec3 rp = vTWorld; float rpx = length(fwidth(rp)) + 0.001;
  float steep = 1.0 - smoothstep(0.45, 0.8, abs(normalize(vTNormal + vec3(0.0, 1e-5, 0.0)).y));
  float along = rp.x * 0.8 + rp.z * 0.6;
  float by = rp.y - 0.045 * along + 0.5 * sin(along * 0.13) + 0.35 * rkN(vec2(along * 0.22, rp.y * 0.3));
  float bed = by / 1.9, bi = floor(bed), bf = bed - bi, b1 = rkH(vec2(bi, 3.0)), b2 = rkH(vec2(floor(by / 0.38), 7.0));
  float joint = (1.0 - smoothstep(max(0.07, rpx * 0.55), max(0.07, rpx * 0.55) + max(rpx, 0.05), (0.5 - abs(bf - 0.5)) * 1.9)) * (1.0 - smoothstep(1.2, 3.5, rpx));
  float thin = 1.0 - smoothstep(0.4, 1.4, rpx);
  vec3 rc = diffuseColor.rgb * mix(0.78, 1.2, b1) * (1.0 + 0.2 * (b2 - 0.5) * thin);
  rc = mix(rc, rc * vec3(1.1, 1.0, 0.86), step(0.6, b1) * 0.6);          // some beds are warmer stone
  rc *= 1.0 - 0.55 * joint;
  rc *= 1.0 + 0.22 * smoothstep(0.75, 0.98, bf) * thin;                  // a lit arris along the top of each bed
  float streak = smoothstep(0.56, 0.8, rkN(vec2(along * 0.7, rp.y * 0.045))) * (0.6 + 0.4 * rkN(vec2(along * 2.3, rp.y * 0.2)));
  rc *= 1.0 - 0.3 * streak * (1.0 - smoothstep(3.0, 9.0, rpx));
  diffuseColor.rgb = mix(diffuseColor.rgb, rc, steep) * uLift;
}`;

// ---------------------------------------------------------------- small geometry helpers
// project uvs from world-ish position so one stone texture tiles evenly over extrusions and boxes
function stoneUV(g, scale) {
  const p = g.attributes.position, n = g.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (az >= ax && az >= ay) { uv[i * 2] = p.getX(i) * scale; uv[i * 2 + 1] = p.getY(i) * scale; }
    else if (ax >= ay) { uv[i * 2] = p.getZ(i) * scale; uv[i * 2 + 1] = p.getY(i) * scale; }
    else { uv[i * 2] = p.getX(i) * scale; uv[i * 2 + 1] = p.getZ(i) * scale; }
  }
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); return g;
}
// A tree crown for the far woods and the hedgerows in 46 triangles: a dark lumpy core wrapped in alpha-cut leaf-cluster cards from the
// kit's leaf atlas, on a short trunk (drawn with the kit's wind material, so it sways and takes the light like the detailed trees).
function crownGeometry(rng, cards = 11) {
  const P = [], Nn = [], Cc = [], Wd = [], Uv = [], cell = flora.LEAF_CELLS.cluster, SU = 0.875, SV = 0.75;
  const lo = [0.018, 0.062, 0.022], mid = [0.05, 0.19, 0.035], hi = [0.3, 0.5, 0.09];
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const put = (p, n, c, sway, fl, leaf, u, v) => { P.push(p[0], p[1], p[2]); Nn.push(n[0], n[1], n[2]); Cc.push(c[0], c[1], c[2]); Wd.push(sway, fl, leaf, 0); Uv.push(u, v); };
  const cy = 0.95, v = V3(), w = V3(), t1 = V3(), t2 = V3();
  // trunk: three sides
  for (let k = 0; k < 3; k++) {
    const a0 = k * TAU / 3, a1 = (k + 1) * TAU / 3, bc = [0.09, 0.07, 0.05], q = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r], n = [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)];
    for (const [a, r, y] of [[a0, 0.11, -0.1], [a1, 0.11, -0.1], [a1, 0.07, cy], [a0, 0.11, -0.1], [a1, 0.07, cy], [a0, 0.07, cy]]) put(q(a, r, y), n, bc, 0.02 * Math.max(0, y), 0, 0, SU, SV);
  }
  // core: a squashed, lumpy icosahedron, dark, so the gaps between the leaf cards read as depth
  const ico = new THREE.IcosahedronGeometry(1, 0), ip = ico.attributes.position, ph = [rng() * TAU, rng() * TAU, rng() * TAU];
  for (let i = 0; i < ip.count; i++) {
    v.fromBufferAttribute(ip, i).normalize();
    const s = 0.6 * (1 + 0.22 * Math.sin(v.x * 3.1 + ph[0]) + 0.18 * Math.sin(v.z * 2.7 + ph[1]) + 0.14 * Math.sin(v.y * 3.3 + ph[2]));
    const p = [v.x * s, cy + v.y * s * (v.y < 0 ? 0.62 : 0.85), v.z * s], sh = 0.5 + 0.5 * v.y;
    put(p, [v.x, v.y * 0.8 + 0.25, v.z], mix(lo, mid, sh * 0.8).map((c) => c * 0.75), 0.05, 0.6, 1, SU, SV);
  }
  ico.dispose();
  // leaf shell: cards lying over the core like shingles; they carry the light and make the silhouette
  const off = rng() * TAU;
  for (let k = 0; k < cards; k++) {
    const yy = 1 - (k + 0.5) / cards * 1.62, rr = Math.sqrt(Math.max(0, 1 - yy * yy)), th = off + k * 2.39996 + rng.range(-0.3, 0.3);
    v.set(Math.cos(th) * rr + rng.range(-0.12, 0.12), yy + rng.range(-0.12, 0.12), Math.sin(th) * rr + rng.range(-0.12, 0.12)).normalize();
    const sz = rng.range(0.5, 0.74), out = rng.range(0.6, 0.78), c = [v.x * out, cy + v.y * out * 0.8, v.z * out];
    w.set(rng() - 0.5, rng() - 0.5, rng() - 0.5); t1.crossVectors(v, w).normalize();
    w.set(v.x * 0.6 + t1.x * 0.7, v.y * 0.6 + t1.y * 0.7 - 0.2, v.z * 0.6 + t1.z * 0.7).normalize(); t2.crossVectors(w, v).normalize();
    const s = 0.5 + 0.5 * v.y, col = (s < 0.55 ? mix(lo, mid, s / 0.55) : mix(mid, hi, (s - 0.55) / 0.45)).map((q) => q * rng.range(0.85, 1.15)), tip = mix(col, hi, 0.3), base = col.map((q) => q * 0.85);
    const nr = [v.x + rng.range(-0.25, 0.25), v.y + rng.range(-0.1, 0.3), v.z + rng.range(-0.25, 0.25)], nl = Math.hypot(nr[0], nr[1], nr[2]); nr[0] /= nl; nr[1] /= nl; nr[2] /= nl;
    const fx = rng() < 0.5, ua = fx ? cell[2] : cell[0], ub = fx ? cell[0] : cell[2];
    const corner = (su, sv) => [c[0] + (w.x * su + t2.x * sv) * sz, c[1] + (w.y * su + t2.y * sv) * sz, c[2] + (w.z * su + t2.z * sv) * sz];
    const q0 = corner(-1, -1), q1 = corner(-1, 1), q2 = corner(1, 1), q3 = corner(1, -1);
    put(q0, nr, base, 0.06, 0.6, 1, ua, cell[3]); put(q1, nr, base, 0.06, 0.6, 1, ub, cell[3]); put(q2, nr, tip, 0.06, 1.5, 1, ub, cell[1]);
    put(q0, nr, base, 0.06, 0.6, 1, ua, cell[3]); put(q2, nr, tip, 0.06, 1.5, 1, ub, cell[1]); put(q3, nr, tip, 0.06, 1.5, 1, ua, cell[1]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('wind', new THREE.Float32BufferAttribute(Wd, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(Uv, 2));
  g.computeBoundingSphere(); g.userData = { triangles: P.length / 9, height: 1.7, radius: 1 };
  return g;
}

// ashlar: one tile is 4 x 4 m, eight courses of half a metre, blocks 0.7-1.4 m long (the first block of the top row is 0.9 m, plain:
// the voussoirs take their face from it)
async function stoneTexture(rng, pause) {
  const S = 512, cv = document.createElement('canvas'); cv.width = S; cv.height = S; const c = cv.getContext('2d');
  c.fillStyle = '#8f897c'; c.fillRect(0, 0, S, S);
  const rows = 8, rh = S / rows;
  for (let r = 0; r < rows; r++) {
    let x = r === 0 ? 0 : -rng.range(0.2, 0.9) * S / 4;
    while (x < S) {
      const w = (r === 0 && x === 0 ? 0.9 : rng.range(0.7, 1.4)) * S / 4, v = 222 + Math.floor(rng.range(-20, 16)), t = Math.floor(rng.range(-6, 8));
      c.fillStyle = `rgb(${v + t},${v},${v - t - 5})`; c.fillRect(x + 1.5, r * rh + 1.5, w - 3, rh - 3);
      c.fillStyle = 'rgba(255,252,240,0.16)'; c.fillRect(x + 1.5, r * rh + 1.5, w - 3, 2.5);          // a lit arris along the top of each block
      c.fillStyle = 'rgba(60,54,46,0.14)'; c.fillRect(x + 1.5, (r + 1) * rh - 5, w - 3, 3.5);         // and a shaded one along the bottom
      x += w;
    }
    if (r % 3 === 2) await pause();
  }
  await pause();
  for (let i = 0; i < 2600; i++) { if (i % 900 === 899) await pause(); c.fillStyle = `rgba(${rng() < 0.55 ? '70,66,60' : '255,255,250'},${rng.range(0.03, 0.09)})`; c.fillRect(rng() * S, rng() * S, rng.range(1, 5), rng.range(1, 12)); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

export default {
  id: 'inside-out-world',
  name: 'The Inside-Out World',
  category: 'alien',
  media: ['air', 'open'],
  weirdness: 0.4,
  async build(ctx) {
    const N = ctx.noise, R = ctx.rng.fork('ring');
    const scene = new THREE.Scene();
    const time = { value: 0 };

    // ---------- per-seed character ----------
    // The ring's day. Each visit has its hour: morning, noon, evening (lamps coming on) or the night side, when this valley is in the
    // ring's shaded sector under stars and planet-light while the land overhead is in full sun. ctx.vary.hour is honoured.
    const vary = ctx.vary || {}, DENS = clamp(vary.density ?? 1, 0.7, 1.3), RARE = !!vary.rare, QD = clamp((ctx.quality && ctx.quality.detail) || 1, 0.5, 1);
    let mood = R.pick(['morning', 'morning', 'morning', 'noon', 'evening']);
    if (vary.hour === 'dawn') mood = 'morning'; else if (vary.hour === 'day') mood = 'noon'; else if (vary.hour === 'golden') mood = 'evening';
    else if (vary.hour === 'night' || (vary.hour !== 'clock' && (vary.mood ?? 0) > 0.86)) mood = 'night';
    const NIGHT = mood === 'night';
    const autumn = R.chance(0.3);
    const M = {
      morning: { el: R.range(26, 33), sun: '#ffe3b8', key: 3.8, sky: '#8fb4ff', gnd: '#8a8f62', fill: 0.95, fog: '#9ec4f2', haze: R.range(0.00054, 0.00066), mist: R.range(0.16, 0.26), night: 0.12,
        hSun: [1.2, 1.02, 0.8], hAmb: [0.15, 0.23, 0.42], shade: R.range(1.95, 2.45), tint: '#fffaf1' },
      noon: { el: R.range(40, 48), sun: '#fff5e4', key: 3.8, sky: '#97b9ff', gnd: '#8f9468', fill: 1.0, fog: '#a6caf5', haze: R.range(0.0006, 0.00072), mist: R.range(0.05, 0.1), night: 0,
        hSun: [1.14, 1.08, 0.96], hAmb: [0.16, 0.25, 0.43], shade: R.range(2.3, 2.8), tint: '#fbfcff' },
      evening: { el: R.range(17, 22), sun: '#ffc98e', key: 3.5, sky: '#8ea2f2', gnd: '#8a7a66', fill: 0.9, fog: '#aab8ee', haze: R.range(0.00044, 0.00054), mist: R.range(0.2, 0.3), night: 0.5,
        hSun: [1.3, 0.92, 0.62], hAmb: [0.17, 0.2, 0.44], shade: R.range(1.45, 1.85), tint: '#fff4ea' },
      night: { el: 27, sun: '#b4c8ff', key: 2.1, sky: '#6a82d6', gnd: '#4a5888', fill: 0.95, fog: '#22335f', haze: 0.00046, mist: 0.2, night: 1,
        hSun: [1.22, 1.04, 0.84], hAmb: [0.15, 0.22, 0.44], shade: 0, tint: '#eef2ff' },
    }[mood];
    const V = {
      trees: R.int(250, 300), canopy: Math.round(R.int(800, 1050) * 0.62), maple: autumn ? R.range(0.45, 0.65) : R.range(0.12, 0.3), houses: R.int(18, 26),
      boats: R.int(4, 7), deer: R.int(6, 11), gliders: R.int(2, 4), birds: R.int(46, 68), geese: R.chance(0.25),
      clouds: R.int(3, 5), cover: R.range(0.3, 0.52), wind: R.range(0.8, 1.4), fall: R.range(20, 25),
      spin: R.range(0.017, 0.024) * R.sign(), o: Array.from({ length: 12 }, () => R.range(0, 90)),
    };
    const az = R.range(20, 38) * Math.PI / 180, el = M.el * Math.PI / 180;
    const DAYSUN = V3(-Math.cos(el) * Math.cos(az), Math.sin(el), Math.cos(el) * Math.sin(az)).normalize();    // toward the light: left, a little behind the camera
    const SUN = NIGHT ? V3(0.8, 0.5, -0.33).normalize() : DAYSUN;      // (on the night side the key is planet-light, from the planet's window on the right)
    const sunCol = C(M.sun);

    // ---------- the hero: the far ring ----------
    const VA = -207 + R.range(-12, 12), BA = VA - 20;                // village and bridge arcs (u ~ 0.27 / 0.25)
    // layout that changes with the seed (its own fork, so the character above is undisturbed): which bank carries the village, its spoke,
    // the deer and the first orchard (VS = +1 right; the monorail takes the other bank), and how the river wanders. The waterfall bluff
    // is always on the right bank (FS), where its face takes the sun.
    const LR = ctx.rng.fork('layout');
    const VS = LR.sign(), FS = 1, mph = LR.range(0, TAU), mph2 = LR.range(0, TAU);
    const mdr = (a) => (18 * Math.sin(a / 140 + mph) + 8 * Math.sin(a / 63 + mph2)) * smoothstep(-520, -440, a) * (1 - smoothstep(240, 330, a)) * (1 - 0.75 * bump(a, BA, 55));
    const hero = await buildHero({ ...ctx, rng: R.fork('hero') }, {
      palette: PAL, openArc: OPEN, openFade: FADE, shadeCentre: TAU - M.shade, cloudCover: V.cover, fogMax: 0.18,
      nearSpoke: (riverX) => ({ s: -(A0 - 40), x: clamp(riverX(-VA) + mdr(VA) + VS * 125, -400, 400) + VS * 58 }),   // (its foot stands behind the flight's first metre: a tower that size beside the town was always cut by the frame's edge)
    });
    await ctx.yield();
    scene.add(hero.object);
    hero.uniforms.uSunDir.value.copy(DAYSUN);
    { const ge = clamp(M.el * 0.4, 8, 13) * Math.PI / 180, ga = 58 * Math.PI / 180;      // where the sun stands behind the left wall: low, a little ahead of abeam
      hero.uniforms.uGlowDir.value.set(-Math.cos(ge) * Math.sin(ga), Math.sin(ge), -Math.cos(ge) * Math.cos(ga)).normalize(); hero.uniforms.uGlowAmt.value = NIGHT ? 0 : mood === 'noon' ? 0.8 : 1; }
    hero.uniforms.uSunCol.value.setRGB(M.hSun[0], M.hSun[1], M.hSun[2]);
    hero.uniforms.uAmb.value.setRGB(M.hAmb[0], M.hAmb[1], M.hAmb[2]);
    const ring = (a, x, h, p = V3(), up = V3()) => { hero.ringPoint(-a, x, h, p, up); return p; };
    await ctx.yield();

    await ctx.yield();
    // ---------- the river and the lie of the land ----------
    const o = V.o;
    const xh = (a) => hero.riverX(-a), xExit = xh(A1);
    const WA = 318 + (R.range(258, 286) - 258) * 0.57;               // the waterfall bluff: its upstream face is ahead on the right from u ~ 0.66 and passed at u ~ 0.84
    const rv = tab((a) => lerp(xh(a) + mdr(a), xExit, smoothstep(WA - 166, WA - 64, a) * (1 - smoothstep(468, 548, a))));   // meanders, then runs straight past the bluff's pool and under the aqueduct
    // half width of the river: it swells and narrows, pools under the fall and is pinched under the aqueduct
    await ctx.yield();
    const hw = tab((a) => 12.5 + 3.4 * N.n2(a * 0.006 + o[11], 3.3) + 1.5 * N.n2(a * 0.027 + o[10], 7.1) + 5 * bump(a, WA, 60) - 4.5 * bump(a, A1, 60) - 2.5 * bump(a, BA, 45));
    // The bluff stands on the right bank. Seen from above it is a wedge: one face along the river, one cut back diagonally upstream
    // (so it looks at the approaching camera), a turf top that slopes away downstream. The stream crosses the top and leaps from a notch in
    // the diagonal face into a pool, a bay of the river. Bluff coordinates: u1 metres from the river face into the bluff, u2 metres downstream.
    const HW0 = hw(WA), LEAN = 0.36;               // Coriolis: the water falls 21 degrees off the local vertical, against the spin
    // the pool: a bay of the river that fills the angle between the bank and the diagonal face (how far the right bank stands back at arc a)
    const PB = tab((a) => { const u2 = a - WA; return clamp(7 - u2, 0, 60) * smoothstep(-62, -42, u2) * (1 - smoothstep(-2, 7, u2)) + 9 * smoothstep(-37, -29, u2) * (1 - smoothstep(-12, -5, u2)); });
    // the fall stands in an alcove of the face: S0 is the lip along the face (u1 on the bluff line), ALC the alcove (it is wider on the side the water leans to)
    const S0 = 18.5, ALC = [S0 - 10, S0 + 13], REC = 7.5;
    const alcove = (u1, u2) => { const q = (u1 - u2) * 0.5; return REC * smoothstep(ALC[0] - 2.2, ALC[0] + 0.8, q) * (1 - smoothstep(ALC[1] - 0.8, ALC[1] + 2.2, q)); };
    const bu1 = (x, a) => FS * (x - rv(a)) - (HW0 + 5), bu2 = (a) => a - WA;
    const RIV = (u2) => 0.9 * Math.max(0, u2);      // downstream of its river corner the bluff's other face stands back from the water, further with every metre: a prow, passed wide
    const LP = [S0 + 7.25, -S0 + 7.25], SP = [LP[0] + 31, LP[1] + 31], SDIR = [(LP[0] - SP[0]) / Math.hypot(LP[0] - SP[0], LP[1] - SP[1]), (LP[1] - SP[1]) / Math.hypot(LP[0] - SP[0], LP[1] - SP[1])];   // spring, lip, flow direction (u1, u2)
    const streamDist = (u1, u2) => { const t = clamp((u1 - SP[0]) * SDIR[0] + (u2 - SP[1]) * SDIR[1], 0, 64); return Math.hypot(u1 - SP[0] - SDIR[0] * t, u2 - SP[1] - SDIR[1] * t); };
    const bluffAt = (x, a) => {                                        // 0..1: how much of the bluff's height stands at (x, a)
      const u1 = bu1(x, a), u2 = bu2(a); if (u1 < -3 || u1 > 130 || u2 < -90 || u2 > 74) return 0;
      const wob = 1.6 * Math.sin(u1 * 0.21 + 1.3) + 1.1 * Math.sin(u2 * 0.33);
      const v = (u1 + u2) * 0.7071;                                     // metres in from the diagonal face
      return smoothstep(-2, 2.5, u1 - RIV(u2)) * smoothstep(-2, 2.5, v + wob - alcove(u1, u2)) * (1 - smoothstep(6, 34, u2 - 0.3 * u1)) * (1 - smoothstep(56, 96, v)) * (1 - smoothstep(70, 126, u1)) * smoothstep(-88, -64, u2);
    };
    await ctx.yield();
    // the monorail keeps the left bank, opposite the bluff (when the village stands there too it runs in along the quay, between the river and the houses)
    const monoOff = tab((a) => -(112 + 50 * smoothstep(230, 420, a) * (1 - smoothstep(520, 660, a))) + (VS < 0 ? 70 * bump(a, VA, 260) : 0));
    const VX = clamp(rv(VA) + VS * 125, -400, 400);
    R.range(-40, 40); R.range(62, 80);                               // (two draws kept so older seeds keep their character)
    const DA = LR.range(-332, -302), DX = rv(DA) + VS * LR.range(42, 52);   // deer meadow on the village bank, in the opening image and passed low at u ~ 0.1
    const OR = [[VA + 34, VX - VS * 74], [R.range(318, 348) + LR.range(-22, 8), xExit - VS * R.range(64, 76)]];   // orchards (a, x)
    // gravel bars on the inside of the three sharpest bends
    const bars = [];
    {
      const cand = [];
      for (let a = -400; a <= 215; a += 12) { const c = rv(a + 20) + rv(a - 20) - 2 * rv(a); if (Math.abs(a - BA) > 60 && Math.abs(c) > 0.35) cand.push([Math.abs(c), a, Math.sign(c)]); }
      cand.sort((p, q) => q[0] - p[0]);
      for (const c of cand) if (bars.length < 3 && bars.every((b) => Math.abs(b.a - c[1]) > 110)) bars.push({ a: c[1], sd: c[2], len: LR.range(32, 46) });
    }
    const woodMask = (x, a) => smoothstep(0.1, 0.32, N.fbm2(x * 0.0058 + o[4], a * 0.0058 + o[5], 2));
    const terrMask = (x, a, d) => smoothstep(0.12, 0.4, N.n2(x * 0.0035 + o[6], a * 0.0035 + o[7])) * smoothstep(45, 100, d) * (1 - smoothstep(OPEN - 170, OPEN - 90, Math.abs(a)));
    const STEP = 3.4, FALL = V.fall + 18.5;                            // (7.5 m taller than it was: the flight now comes to it from the monorail's bank and is further off at u 0.70)
    function land(x, a) {
      const rx = rv(a), dx = x - rx, d = Math.abs(dx), aa = Math.abs(a);
      let h = 1.3 + Math.max(0, 16 + 21 * N.fbm2(x * 0.0041 + o[0], a * 0.0041 + o[1], 3) + 3.5 * N.n2(x * 0.014 + o[2], a * 0.014 + o[3])) * smoothstep(15, 175, d);
      const tm = d > 45 && aa < OPEN - 90 ? terrMask(x, a, d) : 0;   // rice terraces
      if (tm > 0.01) { const q = h / STEP, fl = Math.floor(q); h = lerp(h, (fl + smoothstep(0.72, 1, q - fl)) * STEP, tm); }
      const dv = Math.hypot(x - VX, a - VA);                         // the village's hill
      if (dv < 130) h = lerp(h, 13.5 + 1.5 * N.n2(x * 0.02, a * 0.02), smoothstep(128, 58, dv));
      const dm = Math.abs(dx - monoOff(a));                          // the monorail's cutting
      if (dm < 42) h = lerp(h, Math.min(h, 22), 1 - smoothstep(8, 42, dm));
      if (Math.abs(a - BA) < 12) { const ramp = 6.4 * (1 - smoothstep(4.5, 12, Math.abs(a - BA))) * smoothstep(21, 29, d) * (1 - smoothstep(55, 105, d)); if (ramp > h) h = ramp; }   // bridge causeway
      const qa = 1 - smoothstep(18, a > A1 ? 40 : 70, Math.abs(a - A1));   // open ground under the aqueduct (the land behind it keeps its hills)
      if (qa > 0) h = lerp(h, Math.min(h, 2.2 + Math.max(0, d - 60) * 0.3), qa);
      h = lerp(h, 0.8, smoothstep(515, 585, Math.abs(x)));           // promenade under the glass
      h = lerp(h, 0.25, smoothstep(OPEN - 90, OPEN + FADE - 30, aa));   // flatten toward the hero's painted land
      h = lerp(h, -2.2, smoothstep(OPEN + FADE - 24, OPEN + FADE + 2, aa));   // and slip under it where it has become opaque, so no edge shows
      const w = hw(a) + (dx * FS > 0 ? PB(a) : 0); h = lerp(h, -2.6, 1 - smoothstep(w - 2.5, w + 4.5, d));   // river channel (and the pool under the fall)
      if (dx * FS > 0) {                                             // the bluff the waterfall drops from: it stands in its own pool
        const bw = bluffAt(x, a);
        if (bw > 0) { h = lerp(h, Math.max(h, FALL + 0.8 * N.n2(x * 0.03 + 9, a * 0.03)), bw); h -= 2.0 * bw * (1 - smoothstep(3.2, 7.5, streamDist(bu1(x, a), bu2(a)))); }
      }
      for (let i = 0; i < bars.length; i++) {                           // gravel bars: the bed shoals up out of the water on the inside of a bend
        const b = bars[i], t = bump(a, b.a, b.len);
        if (t > 0) h = Math.max(h, -2.6 + 3.55 * smoothstep(0, 0.55, t) * smoothstep(w - 10.5 - 3 * t, w - 3.5, dx * b.sd) * (1 - smoothstep(w + 2, w + 8, dx * b.sd)));
      }
      return h;
    }
    const H = (x, z) => { const zc = clamp(z, -1500, 1500), a = -RR * Math.asin(zc / RR); return RR - Math.sqrt(RR * RR - zc * zc) + land(x, a) / Math.cos(a / RR); };
    // local frame standing on the ring floor at arc a, across x: +Y is the radial up there
    const frameAt = (a, x, h = 0) => {
      const g = new THREE.Group(), up = V3(); ring(a, x, h, g.position, up); g.rotation.x = a / RR;
      const s = Math.sin(a / RR), c = Math.cos(a / RR), P = g.position.clone();
      g.userData.heightAt = (lx, lz) => { let ly = 0; for (let k = 0; k < 3; k++) ly = (H(P.x + lx, P.z + ly * s + lz * c) - P.y + lz * s) / c; return ly; };
      return g;
    };

    await ctx.yield();
    // ---------- ground colour: meadow, field patchwork with hedges, woods floor, paddies, banks ----------
    const G = { mA: C('#4c783a'), mB: C('#6b9048'), crop: C('#7da547'), wheat: C(autumn ? '#c8a650' : '#b4ae5a'), plough: C('#84684a'), rape: C(autumn ? '#b98f3c' : '#cdbf3c'),
      pale: C('#92aa58'), wood: C('#3a552b'), paddy: C('#7fae8e'), sand: C('#b3a47c'), bed: C('#24464a'), stone: C('#b4b0a4'), road: C('#b09c76'), hedge: C('#3b5a2a'),
      gravel: C('#b9b09a'), sheen: C('#a9cdd0'), rockA: C('#9c917e'), rockB: C('#6b6257'), damp: C('#6f6a52') };
    const roadA = [BA, rv(BA) + VS * 30], roadB = [VA, VX - VS * 44];
    const segDist = (x, a, p, q) => { const vx = q[1] - p[1], va = q[0] - p[0], t = clamp(((x - p[1]) * vx + (a - p[0]) * va) / (vx * vx + va * va), 0, 1); return Math.hypot(x - p[1] - vx * t, a - p[0] - va * t); };
    const tmpR = new THREE.Color();
    function tint(x, a, h, out) {
      const rx = rv(a), d = Math.abs(x - rx), w = hw(a) + ((x - rx) * FS > 0 ? PB(a) * (1 - bluffAt(x, a)) : 0);
      const n1 = N.n2(x * 0.006 + o[8], a * 0.006 + o[9]), n2 = N.n2(x * 0.031 + 3, a * 0.031 + 7);
      out.copy(G.mA).lerp(G.mB, clamp(0.5 + 0.6 * n1, 0, 1));
      const wm = woodMask(x, a), dv = Math.hypot(x - VX, a - VA);
      out.lerp(G.wood, smoothstep(0.3, 0.8, wm) * 0.8);
      const tm = terrMask(x, a, d);
      if (tm > 0.2) {                                                  // paddies: a pale sheen of sky on the flats, dark earth on the risers
        const q = h / STEP, f = q - Math.floor(q), up = smoothstep(3, 5, h);
        out.lerp(G.paddy, tm * 0.35 * up);
      }
      out.lerp(G.road, (1 - smoothstep(3, 5, Math.abs(a - BA))) * smoothstep(20, 26, d) * (1 - smoothstep(30, 36, d)));
      out.lerp(G.stone, smoothstep(40, 60, 100 - dv) * 0.35);
      out.multiplyScalar(1 + 0.11 * n2);
      // banks: a ragged margin of damp earth and sand that comes and goes, never a ruled line
      const nb = 0.5 + 0.5 * N.n2(x * 0.045 + 31, a * 0.021 + 17), nc = 0.5 + 0.5 * N.n2(a * 0.011 + 3, x * 0.02 + 40);
      out.lerp(G.damp, (1 - smoothstep(w + 2.5, w + 7 + 9 * nb, d)) * 0.5);
      out.lerp(G.sand, (1 - smoothstep(w + 1.5, w + 3 + 7 * nb * nc, d)) * (0.35 + 0.65 * nc));
      out.lerp(G.bed, 1 - smoothstep(w - 3, w + 1.5, d));
      if (d < w + 3 && h > -0.5) out.lerp(G.gravel, smoothstep(-0.3, 0.45, h) * (1 - smoothstep(w, w + 3, d)) * (0.8 + 0.2 * n2));   // gravel bars
      out.lerp(G.stone, smoothstep(566, 578, Math.abs(x)));
      const u1 = bu1(x, a), u2 = bu2(a);
      if (u1 > -8 && u1 < 134 && u2 > -94 && u2 < 80 && (x - rx) * FS > 0) {   // the bluff: dark wet rock on its faces (the cliff meshes stand in front of them), stones along the stream
        const sl = Math.hypot(land(x + 1.6, a) - land(x - 1.6, a), land(x, a + 1.6) - land(x, a - 1.6)) / 3.2, rk = smoothstep(1.0, 1.9, sl);
        const nearFace = (1 - smoothstep(6, 13, Math.min((u1 + u2) * 0.7071 - alcove(u1, u2), u1 - RIV(u2)))) * (1 - smoothstep(56, 68, u1));   // (only under the cliffs: the bluff's long back slopes stay turf)
        if (rk > 0 && nearFace > 0) out.lerp(tmpR.copy(G.rockB).multiplyScalar(0.62 + 0.2 * n2), rk * 0.92 * nearFace);
        const ds = streamDist(u1, u2), on = bluffAt(x, a);
        out.lerp(G.gravel, (1 - smoothstep(4.5, 8 + 3 * nb, ds)) * on * 0.8); out.lerp(G.bed, (1 - smoothstep(2.2, 4.2, ds)) * on * 0.6);
      }
      return out;
    }
    await ctx.yield();
    // ---------- the patchwork ----------
    // Fields are too fine for vertex colour (the mesh is 6-12 m coarse under the high middle of the flight), so they are drawn per pixel:
    // a warped grid of 58 x 76 m cells, most of them split in two, each half with its own crop, furrow direction and tone from one small
    // table that the ground shader, the grass and the hedge planter all read. fieldMask() says where farmland is (0 by the river, in
    // woods, on the village hill, the bluff and the paddies).
    const FW = 58, FH = 76, FT = 32;
    const fwx = (x, a) => x + 13 * Math.sin(a * 0.0131 + 1.7) + 6 * Math.sin(a * 0.031 + x * 0.011 + 4.1);
    const fwa = (x, a) => a + 12 * Math.sin(x * 0.0117 + 0.6) + 6 * Math.sin(x * 0.027 - a * 0.009 + 2.3);
    const CROPS = [null, C('#6f9e3e'), C(autumn ? '#c8a650' : '#bdb45c'), C('#7d5f44'), C(autumn ? '#b98f3c' : '#d2c33a'), C('#9fb563'), C('#3f7a3c'), C('#b9a878')];
    const fieldData = new Uint8Array(FT * FT * 4);
    {
      const fr0 = ctx.rng.fork('fields'), pickCrop = () => { const k = fr0(); return k < 0.2 ? 0 : k < 0.37 ? 1 : k < 0.55 ? 2 : k < 0.67 ? 3 : k < 0.74 ? 4 : k < 0.84 ? 5 : k < 0.93 ? 6 : 7; };
      for (let i = 0; i < FT * FT; i++) {
        const ca = pickCrop(); let cb = pickCrop(); if (cb === ca) cb = (ca + 1 + fr0.int(0, 5)) % 8;
        const mode = fr0() < 0.2 ? 0 : fr0() < 0.5 ? 1 : 2;
        fieldData[i * 4] = ca + 8 * cb; fieldData[i * 4 + 1] = mode ? mode * 80 + Math.round(fr0.range(0.3, 0.7) * 79) : 0;
        fieldData[i * 4 + 2] = fr0.int(0, 1) + 2 * fr0.int(0, 1) + 4 * fr0.int(0, 7) + 32 * fr0.int(0, 7); fieldData[i * 4 + 3] = 255;
      }
    }
    const fld = { crop: 0, e: 0, split: 99, jit: 0 };
    const fieldAt = (x, a) => {                                        // which field (x, a) lies in: crop, tone, metres to the hedge and to the split
      const fx = fwx(x, a) / FW, fa = fwa(x, a) / FH, ix = Math.floor(fx), ia = Math.floor(fa), cx = fx - ix, ca = fa - ia;
      const k = ((ix + 16) & 31) + ((ia + 16) & 31) * FT, r = fieldData[k * 4], g = fieldData[k * 4 + 1], b = fieldData[k * 4 + 2];
      const mode = Math.floor(g / 80), frac = (g - mode * 80) / 79; let sub = 0; fld.split = 99;
      if (mode === 1) { sub = cx >= frac ? 1 : 0; fld.split = Math.abs(cx - frac) * FW; } else if (mode === 2) { sub = ca >= frac ? 1 : 0; fld.split = Math.abs(ca - frac) * FH; }
      fld.crop = sub ? r >> 3 : r & 7; fld.jit = (sub ? b >> 5 : (b >> 2) & 7) / 7;
      fld.e = Math.min(cx * FW, (1 - cx) * FW, ca * FH, (1 - ca) * FH);
      return fld;
    };
    const fieldMask = (x, a) => {
      const rx = rv(a), d = Math.abs(x - rx), dv = Math.hypot(x - VX, a - VA), wm = woodMask(x, a);
      const bl = (x - rx) * FS > 0 ? smoothstep(0, 0.3, bluffAt(x, a)) : 0;   // the bluff top stays meadow
      return smoothstep(26, 46, d) * (1 - smoothstep(0.25, 0.6, wm)) * smoothstep(52, 70, dv) * (1 - bl) * (1 - smoothstep(0.15, 0.4, terrMask(x, a, d))) * (1 - smoothstep(540, 566, Math.abs(x)));
    };
    for (let k = 0; k < FT * FT; k++) {                                // whole fields: a half-cell whose middle is not farmland is pasture, so no crop fades out half way across
      const ix = (k % FT) - 16, ia = Math.floor(k / FT) - 16, g = fieldData[k * 4 + 1], mode = Math.floor(g / 80), frac = (g - mode * 80) / 79;
      for (let h = 0; h < 2; h++) {
        const u = mode === 1 ? (h ? (1 + frac) / 2 : frac / 2) : 0.5, v = mode === 2 ? (h ? (1 + frac) / 2 : frac / 2) : 0.5, X = (ix + u) * FW, A = (ia + v) * FH;
        let x = X, a = A; for (let it = 0; it < 3; it++) { const nx = X - (fwx(x, a) - x), na = A - (fwa(x, a) - a); x = nx; a = na; }
        if (Math.abs(x) < 620 && Math.abs(a) < 740 && fieldMask(x, a) < 0.5) fieldData[k * 4] = h ? (fieldData[k * 4] & 7) : (fieldData[k * 4] & 56);
        if (!mode) break;
      }
    }
    const roadDist = (x, a) => { const d = Math.abs(x - rv(a)); return Math.min(segDist(x, a, roadA, roadB), Math.abs(a - BA) + (d > 20 && d < 36 ? 0 : 99)); };
    const tmpC = new THREE.Color();
    // the colour the ground shows at a point, patchwork and roads included (grass tufts take it at their feet)
    const groundColor = (x, z, y) => {
      const a = aOfZ(z); tint(x, a, (y - floorY(z)) * Math.cos(a / RR), tmpC);
      const fm = smoothstep(0.12, 0.5, fieldMask(x, a));
      if (fm > 0.01) {
        const f = fieldAt(x, a), cc = CROPS[f.crop];
        if (cc) tmpC.lerp(cc, fm * 0.9); tmpC.multiplyScalar(1 + 0.16 * (f.jit - 0.5) * fm);
        tmpC.lerp(G.hedge, (1 - smoothstep(1.2, 2.6, f.e)) * fm * 0.85);
      }
      return tmpC.lerp(G.road, 1 - smoothstep(1.6, 2.6, roadDist(x, a)));
    };

    await ctx.yield();
    // ---------- the flight ----------
    const pathA = [A0, -380, -300, -225, -150, -75, 0, 75, 150, 225, 290, 306, 322, 341, 360, 372, 410, A1];
    // It climbs over the village and the farmland, looks up the arch from the top, and while the gaze is up it comes down the left bank
    // to run beside the monorail viaduct, a train alongside, a few metres over the rail; then on at that height to the fall and the aqueduct.
    const pathY = [70.2, 73, 76, 78, 76.5, 66, 50.5, 46.5, 65, 68.5, 62.4, 61.2, 60.2, 59, 58, 57.4, 60.4, 62.6];
    const RAILSIDE = 27;                                             // how far the flight keeps from the track on the river's side
    const pts = pathA.map((a, i) => {
      const k = 1 - 0.32 * bump(a, 20, 330), swing = { 225: 46, 290: 21, 306: 14.35, 322: 7.8, 341: 3.9 }[a] || 0;   // (it swings wide over the far bank before the bluff, so the fall is seen aslant against the plumb trees, and eases back so that the gaze comes round at an even rate; it is on the river line from a 360, and from a 372 the last 78 m are straight and level)
      const tow = { [-225]: 0.14, [-150]: 0.42, [-75]: 0.72, 0: 0.94, 75: 1, 150: 0.75 }[a] || 0;   // (it drifts over to the viaduct's bank all the way from the village, so no bend is needed to reach it)
      const xr = a >= 290 ? xExit - FS * swing : rv(a) * k + (1 - k) * 0.5 * (rv(a - 90) + rv(a + 90)) * 0.6 - FS * swing;
      return [lerp(xr, rv(a) + monoOff(a) + RAILSIDE, tow), pathY[i], zOfA(a)];
    });
    const zEnd = zOfA(A1), yBase = floorY(zEnd);
    pts[pts.length - 1][1] = yBase + 12.2; pts[pts.length - 2][1] = yBase + 12.2 - 2.4; pts[pts.length - 3][1] = yBase + 12.2 - 5.2;
    const path = makePath(pts);

    await ctx.yield();
    // ---------- light and air ----------
    scene.background = C(PAL[0]).multiplyScalar(0.5);
    scene.fog = new THREE.FogExp2(C(M.fog), M.haze);
    const hemi = new THREE.HemisphereLight(C(M.sky), C(M.gnd), M.fill); scene.add(hemi);
    const key = new THREE.DirectionalLight(sunCol, M.key); key.position.copy(SUN).multiplyScalar(900); scene.add(key, key.target);
    await ctx.yield();
    const heavens = makeHeavens(R.fork('heavens'), { stars: NIGHT ? 3400 : 2200, space: NIGHT ? 1.3 : 1, planetDir: V3(0.47, R.range(0.34, 0.5), -0.8), spin: V.spin, phase0: 0, phase: R.range(0.6, 1.1), planetRadius: R.range(560, 720) });
    scene.add(heavens.object);
    await ctx.yield();
    // the ring's own air, seen from inside: a faint blue glow over black space, thickest in the plane of the ring and low down,
    // thinning to nothing toward the side windows so the stars there stay crisp. Additive, camera-centred, behind everything.
    const air = new THREE.Mesh(new THREE.SphereGeometry(5200, 24, 16), new THREE.ShaderMaterial({ vertexShader: HEAVEN_VERT, side: THREE.BackSide, transparent: true,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, uniforms: { uCol: { value: C(M.fog).multiplyScalar(mood === 'evening' ? 0.12 : 0.17) } },
      fragmentShader: `uniform vec3 uCol; varying vec3 vD;
        void main(){ vec3 d = normalize(vD); float side = 1.0 - smoothstep(0.2, 0.93, abs(d.x)); float lw = 1.0 - abs(d.y), low = 0.34 + 0.66 * lw * lw;
          gl_FragColor = vec4(uCol * (0.08 + 0.92 * side) * low, 1.0); }` }));
    air.renderOrder = -2; air.frustumCulled = false; air.name = 'air'; scene.add(air);
    const L = Water.waterLight('noon', { sunDir: SUN, sunColor: sunCol, sunIntensity: M.key, zenith: NIGHT ? '#0b1434' : '#55789a', mid: NIGHT ? '#1d2d5c' : '#93b3cb', horizon: NIGHT ? '#3b5290' : '#e3edf5', fogColor: C(M.fog), clouds: false });

    await ctx.yield();
    // ---------- terrain ----------
    const ZB = 706;
    const terrain = await T.makeTerrainAsync({
      rng: R.fork('terrain'), noise: N, path, height: H, biome: 'meadow', bounds: [-624, -720, 624, 720],
      cell: 3, near: 40, levels: 4, maxTriangles: 48000, sunDir: SUN, corridor: { clearance: 8, width: 12 },
      color: (x, z, h, ny, out) => { const a = aOfZ(z); return tint(x, a, (h - floorY(z)) * Math.cos(a / RR), out); },
      palette: { rockSlope: [0.4, 0.58], clouds: 0.22, cloudSize: 400, cloudSpeed: 7, patchAmount: 0.12, tufts: 0.5, rock: '#5f584b', rockB: '#453f35', strata: 0.25 },
    }, ctx.yield);
    scene.add(terrain.object);
    await ctx.yield();
    // the patchwork, the village road and the tree shadows, drawn per pixel into the terrain's own material (before its detail layers)
    const SW = 1024, SH = 1152, shadowData = new Uint8Array(SW * SH);
    const shadowTex = new THREE.DataTexture(shadowData, SW, SH, THREE.RedFormat, THREE.UnsignedByteType);
    shadowTex.minFilter = shadowTex.magFilter = THREE.LinearFilter; shadowTex.generateMipmaps = false; shadowTex.unpackAlignment = 1; shadowTex.needsUpdate = true;
    const fieldTex = new THREE.DataTexture(fieldData, FT, FT, THREE.RGBAFormat, THREE.UnsignedByteType);
    fieldTex.minFilter = fieldTex.magFilter = THREE.NearestFilter; fieldTex.generateMipmaps = false; fieldTex.wrapS = fieldTex.wrapT = THREE.RepeatWrapping; fieldTex.needsUpdate = true;
    {
      const tp = terrain.geometry.attributes.position, fa = new Float32Array(tp.count), ga = new Float32Array(tp.count * 2);
      for (let i = 0; i < tp.count; i++) {
        const x = tp.getX(i), a = aOfZ(tp.getZ(i)); fa[i] = fieldMask(x, a);
        ga[i * 2] = terrMask(x, a, Math.abs(x - rv(a))); ga[i * 2 + 1] = woodMask(x, a) * smoothstep(52, 70, Math.hypot(x - VX, a - VA));
        if (i % 1500 === 1499) await ctx.yield();
      }
      terrain.geometry.setAttribute('aFld', new THREE.BufferAttribute(fa, 1)); terrain.geometry.setAttribute('aGnd', new THREE.BufferAttribute(ga, 2));
      const hl = Math.hypot(SUN.x, SUN.z) || 1;
      const gU = { tField: { value: fieldTex }, tShadow: { value: shadowTex }, uCrop: { value: CROPS.map((c) => c || new THREE.Color(0, 0, 0)) },
        uRoad: { value: new THREE.Vector4(roadA[1], roadA[0], roadB[1], roadB[0]) }, uHedgeC: { value: G.hedge.clone().multiplyScalar(0.8) }, uRoadC: { value: G.road.clone().multiplyScalar(1.12) },
        uShOff: { value: new THREE.Vector2(-SUN.x / hl * 2.4, SUN.z / hl * 2.4) }, uShTint: { value: NIGHT ? new THREE.Color(0.62, 0.68, 0.8) : new THREE.Color(0.36, 0.44, 0.62) } };
      const tm = terrain.material, kitCompile = tm.onBeforeCompile;
      tm.onBeforeCompile = (shader, renderer) => {
        kitCompile(shader, renderer); Object.assign(shader.uniforms, gU);
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute float aFld; attribute vec2 aGnd; varying float vFld; varying vec2 vGnd;')
          .replace('#include <begin_vertex>', '#include <begin_vertex>\n vFld = aFld; vGnd = aGnd;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + FIELD_PARS)
          .replace('#include <color_fragment>', '#include <color_fragment>\n' + FIELD_MAIN);
      };
      tm.customProgramCacheKey = () => 'inside-out-ground';
      tm.userData.fieldMap = fieldTex; tm.userData.shadowMap = shadowTex;
    }
    await ctx.yield();
    // the seam: the hero's painted land draped over the real terrain ahead, fading in with arc, so ground turns to map without an edge
    {
      const NA = 30, NX = 80, pos = new Float32Array((NA + 1) * (NX + 1) * 3), th = new Float32Array((NA + 1) * (NX + 1)), idx = [];
      for (let i = 0, k = 0; i <= NA; i++) for (let j = 0; j <= NX; j++, k++) {
        const a = lerp(OPEN - 4, OPEN + FADE + 4, i / NA), x = lerp(-598, 598, j / NX), z = Math.max(zOfA(a), -ZB + 0.5);
        const sy = terrain.surfaceAt(x, z), hy = H(x, z);
        pos[k * 3] = x; pos[k * 3 + 1] = (Number.isFinite(sy) ? Math.max(sy, hy) : hy) + 1.5; pos[k * 3 + 2] = z; th[k] = TAU - a / RR;
        if (i < NA && j < NX) { const p0 = i * (NX + 1) + j, p1 = p0 + NX + 1; idx.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aTheta', new THREE.BufferAttribute(th, 1)); g.setIndex(idx);
      const lm = hero.landMaterial;
      const seam = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: lm.vertexShader, fragmentShader: lm.fragmentShader, uniforms: lm.uniforms, fog: true, transparent: true,
        side: THREE.FrontSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
      seam.renderOrder = 1; seam.name = 'seam'; scene.add(seam);
    }

    // ---------- water: the river, the stream on the bluff and its sideways fall ----------
    const flat = (r) => { const f = r.object.geometry.getAttribute('aFlow'); for (let i = 0; i < f.count; i++) f.setX(i, 0.012); f.needsUpdate = true; };
    const PE = (a) => { const p = PB(a); return p + 14 * smoothstep(0, 12, p); };   // (one ribbon, widened both ways on this straight reach: it runs on under the bluff and under the far bank's turf, so its edge never shows in the pool)
    const rpts = []; for (let a = -705; a <= 705; a += 11.75) rpts.push(ring(a, rv(a), 0.3));
    const river = Water.makeRiver({ rng: R.fork('river'), points: rpts, width: (t) => { const a = lerp(-705, 705, t); return 2 * (hw(a) + 1.5 + PE(a)); }, segments: 470, across: 8, speed: 2.4, light: L,
      deep: '#1f4f6a', shallow: '#7fb2c0', foam: 0.3, bankFoam: 0.42, opacity: 0.82, bankFade: 2.4 });
    flat(river); scene.add(river.object);
    await ctx.yield();
    // bluff (u1, u2) -> ring (x, arc)
    const bx = (u1, u2) => rv(WA + u2) + FS * (HW0 + 5 + u1), bw3 = (u1, u2, lift = 0) => { const x = bx(u1, u2), z = zOfA(WA + u2); return V3(x, H(x, z) + lift, z); };
    const spts = []; for (let k = 0; k <= 16; k++) { const t = k / 16; spts.push(bw3(lerp(SP[0], LP[0], t), lerp(SP[1], LP[1], t), 0.5)); }
    const stream = Water.makeRiver({ rng: R.fork('stream'), points: spts, width: (t) => lerp(4.5, 8.5, smoothstep(0, 0.4, t)), speed: 3.2, light: L, deep: '#1f4f6a', shallow: '#8cc3cf', foam: 0.3, bankFoam: 0.5, opacity: 0.8 });
    flat(stream); scene.add(stream.object);
    await ctx.yield();
    const aL = WA + LP[1], lipX = bx(LP[0], LP[1]), zW = zOfA(aL), lipY = spts[16].y, fallH = lipY - (floorY(zW) + 0.3);
    const FDIR = V3(FS * SDIR[0], 0, -SDIR[1]).normalize(), LAUNCH = 4.2;        // the leap: along the stream, out of the diagonal face
    const reach = LAUNCH * Math.sqrt(2 * fallH / 9.81);
    const footA = aL + SDIR[1] * reach - fallH * Math.tan(LEAN), footX = lipX + FS * SDIR[0] * reach;   // where the leaning sheet meets the pool
    // The bow in the spray. The light here comes in through the side window and off the hub's mirrors, so it has no single bearing;
    // the spray takes the bearing (at the key light's own height, always from the window side) that stands its rainbow, 42 degrees
    // round the anti-solar point, across the foot of the fall for as long as the flight is coming down on it.
    const FSUN = SUN.clone(), bowAt = ring(footA, footX, 7), bowD = V3(), bowE = Math.asin(clamp(SUN.y, 0.2, 0.9));
    const aimBow = (cam) => {
      const d = bowD.copy(bowAt).sub(cam).normalize(), rho = Math.hypot(d.x, d.z) || 1e-6;
      const psi = Math.min(2.05, Math.atan2(d.x, -d.z) + Math.acos(clamp((Math.cos(0.733) + Math.sin(bowE) * d.y) / (Math.cos(bowE) * rho), -1, 1)));   // the anti-solar bearing, right of forward
      return FSUN.set(-Math.cos(bowE) * Math.sin(psi), Math.sin(bowE), Math.cos(bowE) * Math.cos(psi)).normalize();
    };
    aimBow(path.pointAt(0.76));
    const fall = Water.makeWaterfall({ rng: R.fork('fall'), top: [lipX, lipY, zW], height: fallH / Math.cos(LEAN), width: 13, dir: [FDIR.x, 0, FDIR.z], launch: LAUNCH, light: L, sunDir: FSUN,
      tint: '#2a6f92', pool: false, mistCount: Math.round(300 * lerp(0.7, 1, (QD - 0.5) / 0.5)), mistOpacity: NIGHT ? 0.12 : 0.2, rainbow: NIGHT ? 0.14 : 1.2, density: 0.66 });
    fall.object.rotation.x = aL / RR - LEAN;
    scene.add(fall.object);
    {                                                                 // churned white water where it lands, trailing off toward the river
      const fg = new THREE.CircleGeometry(1, 28); fg.rotateX(-Math.PI / 2); fg.scale(13, 1, 19);
      const foam = new THREE.Mesh(fg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { uT: time, uC: { value: C('#f4f8fc').lerp(C('#f4f8fc').multiply(C(M.sun)), 0.3).multiplyScalar(NIGHT ? 0.5 : 1.08) } },
        vertexShader: 'varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float uT; uniform vec3 uC; varying vec2 vP;
          float h2(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
          void main(){ vec2 q = vP / vec2(13.0, 19.0); q.y = q.y * 0.5 + 0.5; float r = length(vec2(q.x, (q.y - 0.3) * (q.y < 0.3 ? 2.2 : 0.95)));
            float n = 0.6 * vn(vP * 0.55 + vec2(0.0, uT * 1.5)) + 0.4 * vn(vP * 1.4 + vec2(uT * 0.4, uT * 2.3));
            float a = (1.0 - smoothstep(0.1, 1.0, r)) * smoothstep(0.25, 0.7, n + 0.75 * (1.0 - smoothstep(0.0, 0.55, r)));
            gl_FragColor = vec4(uC, a * 0.85); }` }));
      const up = V3(); ring(footA, footX, 0.5, foam.position, up); foam.rotation.set(footA / RR, FS * 0.6, 0, 'XYZ');
      foam.renderOrder = 2; foam.name = 'foam'; scene.add(foam);
    }
    await ctx.yield();
    // the faces of the bluff: bedded cliffs with ledges, fractures and a turf cap that overhangs, either side of the fall and along the
    // river; boulders from half a metre to four metres half sunk at their feet and in the pool; stones along the stream
    let rockMat = null;
    {
      const rr = R.fork('rocks'), cr2 = ctx.rng.fork('cliffs'), parts = [], e = new THREE.Euler(), q = new THREE.Quaternion(), m4 = new THREE.Matrix4(), sc = V3(), pp = V3(), one = V3(1, 1, 1);
      const strip = (g) => { for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k); return g.index ? g.toNonIndexed() : g; };
      const put = (x, z, r, sink = 0.3, y = null) => { const g = T.rockGeometry({ rng: rr, kind: rr.chance(0.6) ? 'boulder' : 'rock', radius: 1, detail: r > 2.4 ? 2 : 1, color: '#948b7a', colorB: '#665f55' });
        e.set(rr.range(-0.3, 0.3), rr.range(0, TAU), rr.range(-0.3, 0.3)); q.setFromEuler(e); sc.set(r * rr.range(0.9, 1.3), r * rr.range(0.6, 0.95), r * rr.range(0.9, 1.3));
        g.applyMatrix4(m4.compose(pp.set(x, (y ?? H(x, z)) + r * (0.5 - sink), z), q, sc)); parts.push(strip(g)); };
      // a cliff along the bluff line from (u1, u2) p0 to p1, facing out; wet (dark) within `wet` metres of the lip
      const face = (mu1, mu2, nx, na, len, height, depth, bend = 0, taper = 0.2) => {   // one cliff, its middle at bluff (mu1, mu2), facing (nx, na)
        const a = WA + mu2, x = bx(mu1, mu2), z = zOfA(a);
        const g = T.cliffGeometry({ rng: cr2, noise: N, length: len, height, depth, bend, segments: [Math.max(10, Math.round(len / 1.9)), 14], ledges: 7, ragged: 0.1, taper, sink: 5,
          color: '#9a8f78', colorB: '#6a6256', colorTop: '#566f33' });
        e.set(a / RR, Math.atan2(FS * nx, -na), 0, 'XYZ'); q.setFromEuler(e);   // local +Z (the face) -> world (FS nx, 0, -na)
        g.applyMatrix4(m4.compose(pp.set(x, floorY(z) + 0.4, z), q, one));
        const P = g.attributes.position, Cc = g.attributes.color;      // wet rock by the fall: darker, cooler
        for (let i = 0; i < P.count; i++) { const dd = Math.hypot(P.getX(i) - lipX, P.getZ(i) - zW), k = lerp(0.46, 1, smoothstep(6, 22, dd)); Cc.setXYZ(i, Cc.getX(i) * k, Cc.getY(i) * k, Cc.getZ(i) * (k + (1 - k) * 0.25)); }
        parts.push(strip(g));
      };
      // a cliff along the bluff line from (u1, u2) p0 to p1, facing out (to the left of the run), standing `out` metres in front of the line
      const wall = (p0, p1, height, depth, out = 3.2, taper = 0.2) => {
        const len = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]); if (len < 5) return;
        const tx = (p1[0] - p0[0]) / len, ta = (p1[1] - p0[1]) / len, nx = -ta, na = tx;
        face((p0[0] + p1[0]) / 2 + nx * out, (p0[1] + p1[1]) / 2 + na * out, nx, na, len + 5, height, depth, 0, taper);
      };
      const dg = (q) => [q, -q], BK = -(3.2 + 1.6);                    // (a point on the bluff line; how far back the alcove's wall stands)
      wall(dg(62), dg(ALC[1] + 1.5), FALL + 3, 6);                     // the diagonal face beyond the alcove
      await ctx.yield();
      wall(dg(87), dg(61), FALL * 0.62, 4.5, 3.2, 0.72);               // and its far end, stepping down into the hill
      await ctx.yield();
      face(0.6, 0, -0.9997, -0.026, 18, FALL + 2.6, 5, -1.5);          // the river corner: one face bent round the prow
      await ctx.yield();
      wall([RIV(6), 6], [RIV(21), 21], FALL + 1.2, 4.5);               // and the downstream face, standing back from the river and losing height
      wall([RIV(19), 19], [RIV(37), 37], FALL * 0.56, 3.6, 3.2, 0.62);
      await ctx.yield();
      wall(dg(ALC[1] + 2.5), dg(S0 + 7.8), FALL + 1.6, 3.2, BK);       // the back of the alcove, either side of the lip
      await ctx.yield();
      wall(dg(S0 - 6.5), dg(ALC[0] - 2.5), FALL + 1.6, 3.2, BK);
      wall(dg(S0 + 9.5), dg(S0 - 8), FALL - 11, 3.2, BK);              // and low under the lip, behind the sheet: always wet
      await ctx.yield();
      const lipA = WA + LP[1];
      for (let k = 0; k < 7; k++) { const s = lerp(ALC[0], ALC[1], (k + rr()) / 7); put(bx(s + 4.2, -s + 4.2), zOfA(WA - s + 4.2), rr.range(1.8, 3.2), 0.2, floorY(zOfA(WA - s)) + rr.range(0.08, 0.78) * FALL); if (k % 3 === 2) await ctx.yield(); }   // ledges behind the sheet
      for (const sd of [-1, 1]) { const s = S0 + sd * rr.range(4.6, 5.4); put(bx(s + 7.6, -s + 7.6), zOfA(WA - s + 7.6), rr.range(1.5, 2.2)); }                // two stand at the brink
      await ctx.yield();
      for (let k = 0; k < 9; k++) { const t = (k + rr()) / 9, sd = rr.sign() * rr.range(4.2, 6.5); put(bx(lerp(SP[0], LP[0] + 6, t) - SDIR[1] * sd, lerp(SP[1], LP[1] + 6, t) + SDIR[0] * sd), zOfA(WA + lerp(SP[1], LP[1] + 6, t) + SDIR[0] * sd), rr.range(0.5, 1.4)); }   // along the stream
      await ctx.yield();
      for (let k = 0; k < 3; k++) put(bx(SP[0] + rr.range(1, 5), SP[1] + (k - 1) * rr.range(2.5, 4)), zOfA(WA + SP[1] + (k - 1) * 3), rr.range(1.1, 1.8));   // the spring rises among stones
      for (let k = 0; k < 26; k++) {                                  // fallen blocks in the pool and along the foot of both faces
        const s = rr.range(-2, 60), out = rr.range(5, 15) - alcove(s, -s) * 0.8, u1 = s - out * 0.7071, u2 = -s - out * 0.7071, x = bx(u1, u2), a = WA + u2, z = zOfA(a);
        if (Math.hypot(x - footX, a - footA) < 5.5) continue;
        put(x, z, rr.range(0.5, 1) * rr.range(0.9, 3.9), rr.range(0.3, 0.55), Math.max(H(x, z), floorY(z) + 0.1));
        if (k % 4 === 3) await ctx.yield();
      }
      for (let k = 0; k < 12; k++) { const u2 = rr.range(1, 38), u1 = RIV(u2) - rr.range(4.5, 9.5), x = bx(u1, u2), z = zOfA(WA + u2); put(x, z, rr.range(0.7, 2.4), 0.45, Math.max(H(x, z), floorY(z) + 0.1)); }
      await ctx.yield();
      for (let k = 0; k < 10; k++) { const u2 = rr.range(-30, 60), u1 = rr.range(16, 70), x = bx(u1, u2), a = WA + u2; if (bluffAt(x, a) > 0.9 && streamDist(u1, u2) > 9) put(x, zOfA(a), rr.range(0.6, 1.6), 0.4); }   // stones lying out on the turf
      await ctx.yield();
      rockMat = T.makeRockMaterial({ terrain, strata: 0.3, top: '#55702f', topAmount: 0.5, topSlope: [0.66, 0.92], contact: [0.45, 0, 0] });
      {                                                               // beds, joints and wet streaks drawn per pixel on every steep face (the faces are one material with the boulders)
        const kitRock = rockMat.onBeforeCompile, rU = { uLift: { value: NIGHT ? 1.5 : 1 }, uPlanet: { value: NIGHT ? new THREE.Color(0.3, 0.4, 0.62) : new THREE.Color(0, 0, 0) } };
        rockMat.onBeforeCompile = (shader, renderer) => {
          kitRock(shader, renderer); Object.assign(shader.uniforms, rU);
          shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\n' + ROCK_PARS).replace('#include <color_fragment>', '#include <color_fragment>\n' + ROCK_MAIN)
            .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * uPlanet * (0.55 + 0.45 * normalize(vTNormal + vec3(0.0, 1e-5, 0.0)).y);');   // planet-light, on the Night Side: no face of the bluff is black
        };
        rockMat.customProgramCacheKey = () => 'inside-out-rock';
      }
      const rocks = new THREE.Mesh(mergeGeometries(parts, false), rockMat); parts.forEach((g) => g.dispose());
      rocks.name = 'rocks'; scene.add(rocks);
    }
    await ctx.yield();

    // ---------- trees: oak and maple woods, cherry orchards, cypress avenues, riverside willows ----------
    const wind = flora.makeWind({ direction: [0.55, -0.83], strength: V.wind, speed: 1 });
    const leafMap = flora.makeLeafTexture({});                       // (the kit keeps the drawing: one call, then the material is free)
    await ctx.yield();
    const leafMat = flora.windMaterial({ wind, map: leafMap });
    await ctx.yield();
    const fr = R.fork('trees');
    const mapleCol = autumn ? {} : { leaf: '#5f9438', gold: '#8fae3c', crimson: '#4f8a34' };
    const cherryCol = autumn ? { leaf: '#d9843a', leafLight: '#efb04a', leafDark: '#a8522a' } : {};
    const kinds = async (detail) => {                                  // (one tree a step: each is a single kit call)
      const out = [];
      for (const make of [
        () => flora.oakGeometry({ rng: fr, detail, height: 13 }), () => flora.oakGeometry({ rng: fr, detail, height: 11, fullness: 1.15 }),
        () => flora.mapleGeometry({ rng: fr, detail, height: 11, ...mapleCol }), () => flora.cherryGeometry({ rng: fr, detail, height: 7.5, ...cherryCol }),
        () => flora.cypressGeometry({ rng: fr, detail, height: 13, leaf: '#3a6a3c', leafLight: '#86a858', leafDark: '#1d3a28' }), () => flora.willowGeometry({ rng: fr, detail, height: 11 }),
      ]) { out.push(make()); await ctx.yield(); }
      return out;
    };
    const nearKinds = await kinds(1);
    const farKinds = await kinds(0);
    const tpts = [], placed = [], reedKinds = [];
    const freeSpot = (x, a, gap) => { for (let i = placed.length - 1; i >= 0; i--) { const q = placed[i]; if ((q[0] - x) * (q[0] - x) + (q[1] - a) * (q[1] - a) < gap * gap) return false; } return true; };
    const plant = (x, a, v, s, gap = 0) => {
      if (Math.abs(x) > 556 || (gap && !freeSpot(x, a, gap))) return false;
      const z = zOfA(a), y = H(x, z), n = path.nearestXZ(x, z);
      if (n.dist < 15 && n.y - y < 34) return false;
      placed.push([x, a]); tpts.push({ x, y, z, s, rot: fr() * TAU, d: Math.hypot(n.dist, Math.max(0, n.y - y) * 0.75), u: n.u, v });
      return true;
    };
    const nearBluffEdge = (x, a) => {                                 // the pool, the foot and brink of both faces, the stream: no trees
      const u1 = bu1(x, a), u2 = bu2(a); if (u1 < -14 || u1 > 116 || u2 < -96 || u2 > 76) return false;
      return (u1 + u2) * 0.7071 - alcove(u1, u2) < 11 || u1 - RIV(u2) < 11 || streamDist(u1, u2) < 9;
    };
    const inOrchard = (x, a) => OR.some((q) => Math.abs(a - q[0]) < 40 && Math.abs(x - q[1]) < 40);
    const blocked = (x, a, d) => d < 31 || Math.hypot(x - VX, a - VA) < 84 || Math.abs(x - rv(a) - monoOff(a)) < 11 || (Math.abs(a - A1) < 18 && d < 118)
      || Math.hypot(x - DX, a - DA) < 44 || inOrchard(x, a) || nearBluffEdge(x, a) || segDist(x, a, roadA, roadB) < 8;
    const NT = Math.round(V.trees * 0.62);
    for (let i = 0, n = 0; i < 16000 && n < NT; i++) {                  // woods: real trees within ~175 m of the flight, canopy domes beyond
      const a = fr.range(-OPEN - 20, OPEN + 30), x = rv(a) + fr.range(-176, 176), d = Math.abs(x - rv(a));
      const wm = woodMask(x, a); if (fr() > wm * wm + 0.006 || blocked(x, a, d)) continue;
      if (fr() > smoothstep(OPEN + 30, OPEN - 90, Math.abs(a))) continue;
      if (plant(x, a, fr() < V.maple ? 2 : fr.int(0, 1), fr.range(1.0, 1.7), 6.5)) n++;
    }
    for (const q of OR) {                                             // orchards: rows of blossom
      const rot = fr.range(0, 1.2), cs = Math.cos(rot), sn = Math.sin(rot);
      for (let i = -3; i <= 3; i++) for (let j = -2; j <= 2; j++) {
        const lx = i * 9.5 + fr.range(-0.8, 0.8), la = j * 10.5 + fr.range(-0.8, 0.8), x = q[1] + lx * cs - la * sn, a = q[0] + lx * sn + la * cs;
        if (Math.abs(x - rv(a)) > 30) plant(x, a, 3, fr.range(0.9, 1.25));
      }
    }
    {                                                                 // cypress avenue up to the village
      const vx = roadB[1] - roadA[1], va = roadB[0] - roadA[0], len = Math.hypot(vx, va), nx = -va / len, na = vx / len;
      for (let t = 6; t < len - 4; t += 10) for (const sd of [-1, 1]) plant(roadA[1] + vx * t / len + nx * 5.5 * sd, roadA[0] + va * t / len + na * 5.5 * sd, 4, fr.range(0.8, 1.1));
    }
    for (let a = 236; a < 432; a += 14.5) for (const sd of [-1, 1]) if (sd !== FS || a < WA - 72 || a > WA + 22) plant(rv(a) + sd * (hw(a) + 15.5), a + fr.range(-1.5, 1.5), 4, fr.range(0.95, 1.3));   // and along the last reach
    for (let a = -442; a < -250; a += fr.range(22, 40)) { const sd = fr.sign(), x = rv(a) + sd * (hw(a) + fr.range(9, 13)); if (Math.hypot(x - DX, a - DA) > 34) plant(x, a, 5, fr.range(0.9, 1.25)); }   // willows at the entry
    for (const b of bars) plant(rv(b.a) + b.sd * (hw(b.a) + fr.range(8, 11)), b.a + fr.range(-12, 12), 5, fr.range(0.85, 1.1), 7);   // and one leaning over each gravel bar
    for (let k = 0; k < 5; k++) plant(rv(WA) + FS * (HW0 + 5 + SP[0] + 9 + fr.range(-3, 16)), WA + SP[1] + fr.range(-13, 13), k < 2 ? 5 : fr.int(0, 1), fr.range(0.95, 1.3), 5);   // a copse over the spring
    for (let a = 150; a < 235; a += fr.range(28, 44)) plant(rv(a) + fr.sign() * (hw(a) + fr.range(9, 13)), a, 5, fr.range(0.9, 1.2));
    {                                                                 // woods and single trees behind the aqueduct: what the side arches look through to
      const hb = ctx.rng.fork('behind');
      for (let k = 0; k < 34; k++) { const a = hb.range(A1 + 26, A1 + 125), x = xExit + hb.sign() * hb.range(15, 118); plant(x, a, hb() < V.maple ? 2 : hb() < 0.2 ? 4 : hb.int(0, 1), hb.range(0.95, 1.5), 6.5); }
    }
    await ctx.yield();
    const forest = flora.makeScatter({ rng: fr, points: tpts, variants: nearKinds, farVariants: farKinds, farDistance: 28, material: leafMat, chunks: 3, cullDistance: Infinity, tilt: 0.03 });
    const onRadial = (meshes) => {                                    // stand every plant on the local radial
      const m = new THREE.Matrix4(), rot = new THREE.Matrix4(), p = V3();
      for (const mesh of meshes) {
        for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, m); p.setFromMatrixPosition(m); m.setPosition(0, 0, 0); m.premultiply(rot.makeRotationX(aOfZ(p.z) / RR)); m.setPosition(p); mesh.setMatrixAt(i, m); }
        mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 4;
      }
    };
    onRadial(forest.meshes);
    scene.add(forest.object);
    // reeds in clumps on the gravel bars and the quiet inside banks, so the water's edge is broken by something growing
    let reeds = null;
    {
      const rp = [], rr = R.fork('reeds');
      const clump = (a0, sd, n, spread) => { for (let k = 0; k < n; k++) { const a = a0 + rr.range(-spread, spread), x = rv(a) + sd * (hw(a) + rr.range(0.2, 3.4)), z = zOfA(a), y = H(x, z);
        if (y > floorY(z) - 0.6) rp.push({ x, y: Math.max(y, floorY(z) + 0.2), z, s: rr.range(1.25, 1.9), rot: rr() * TAU, d: 30, u: 0, v: rr.int(0, 1) }); } };
      for (const b of bars) clump(b.a, b.sd, 15, b.len * 0.6);
      for (let a = A1 - 112; a < A1 - 9; a += 17) for (const sd of [-1, 1]) if (sd !== FS || a > WA + 60) clump(a + (sd > 0 ? 8 : 0), sd, 5, 5);
      for (let a = -430; a < 425; a += rr.range(44, 80)) if (Math.abs(a - BA) > 22 && Math.abs(a - A1) > 30 && Math.abs(a) > 150) clump(a, rr.sign(), rr.int(5, 9), 6);
      if (rp.length) {
        const rk = [flora.reedGeometry({ rng: rr }), flora.reedGeometry({ rng: rr, height: 2.6 })];
        reeds = flora.makeScatter({ rng: rr, points: rp, variants: rk, material: leafMat, chunks: 1, cullDistance: Infinity, tilt: 0.06 });
        onRadial(reeds.meshes); scene.add(reeds.object); reedKinds.push(...rk);
      }
    }
    await ctx.yield();
    // the mass of the woods: leafy crowns (one instanced leaf-card geometry, the trees' own material) fill in between and beyond the
    // detailed trees and carry the woodland on up into the fade where the painted land takes over; the same crowns, smaller, stand
    // as hedgerow trees along the field boundaries
    const canopy = [];
    {
      const br = R.fork('canopy'), NC = Math.round(V.canopy * lerp(0.8, 1.06, (DENS - 0.7) / 0.6) * lerp(0.7, 1, (QD - 0.5) / 0.5));
      for (let i = 0; i < 30000 && canopy.length < NC; i++) {
        const x = br.range(-548, 548), a = br.range(-OPEN + 30, OPEN + 130), d = Math.abs(x - rv(a));
        const wm = woodMask(x, a); if (wm < 0.3 || br() > wm * 1.15 || d < 46 || blocked(x, a, d)) continue;
        if (br() > smoothstep(OPEN + 135, OPEN + 20, a) || !freeSpot(x, a, 6.2)) continue;
        const z = zOfA(a), y = H(x, z), n = path.nearestXZ(x, z);
        if (a < 545 && Math.hypot(n.dist, n.y - y) < 158) continue;
        placed.push([x, a]); canopy.push({ x, y, z, a, r: br.range(3.4, 5.4) * lerp(1, 0.75, smoothstep(OPEN, OPEN + 130, a)), k: br(), k2: br(), rot: br() * TAU, hedge: 0 });
        if (i % 600 === 599) await ctx.yield();
      }
      await ctx.yield();
      // hedgerow trees: on the field boundaries, thick near the flight and thinning away from it
      const hr = ctx.rng.fork('hedgerow'), NH = Math.round(215 * Math.min(DENS, 1.1) * QD);
      for (let i = 0, n = 0; i < 14000 && n < NH; i++) {
        const a = hr.range(-OPEN + 20, OPEN + 60), x = rv(a) + hr.range(-330, 330); if (Math.abs(x) > 540) continue;
        const f = fieldAt(x, a); if (f.e > 1.3) continue;
        const d = Math.abs(x - rv(a)); if (fieldMask(x, a) < 0.6 || blocked(x, a, d) || !freeSpot(x, a, 7.5)) continue;
        const z = zOfA(a), y = H(x, z), pn = path.nearestXZ(x, z); if (pn.dist < 22 && pn.y - y < 30) continue;
        placed.push([x, a]); canopy.push({ x, y, z, a, r: hr.range(1.7, 3.1), k: hr(), k2: hr(), rot: hr() * TAU, hedge: 1 }); n++;
        if (i % 700 === 699) await ctx.yield();
      }
      {                                                               // bushes rooted in the cracks and on the ledges of the bluff's faces
        const kr = ctx.rng.fork('cracks');
        for (let i = 0; i < 22; i++) {
          const onRiver = i % 4 === 3, t = kr(), up = kr.range(0.2, 0.88), off = 4.9 - 3.2 * up, q = lerp(34, 60, t);
          const ud = lerp(7, 20, t), u1 = onRiver ? RIV(ud) - off * 0.743 : q - off * 0.7071, u2 = onRiver ? ud + off * 0.669 : -q - off * 0.7071, x = bx(u1, u2), a = WA + u2, z = zOfA(a);
          canopy.push({ x, y: floorY(z) + up * FALL, z, a, r: kr.range(0.8, 1.5), k: kr(), k2: 1, rot: kr() * TAU, hedge: 0, crack: 1 });
        }
      }
      await ctx.yield();
      const g = crownGeometry(br);
      const im = new THREE.InstancedMesh(g, leafMat, canopy.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sc = V3(), pp = V3(), cc = new THREE.Color();
      const gold = autumn ? [3.3, 1.55, 0.6] : [1.5, 1.2, 0.7], red = autumn ? [3.9, 0.85, 0.55] : [0.85, 0.95, 0.9];
      canopy.forEach((b, i) => {
        e.set(b.a / RR, b.rot, 0, 'XYZ'); q.setFromEuler(e);
        const s = b.r * 1.05; sc.set(s * lerp(0.9, 1.15, b.k), s * lerp(0.95, 1.3, b.k2) * (b.hedge ? 1.15 : 1), s * lerp(1.15, 0.9, b.k));
        pp.set(b.x, b.y - 0.25, b.z); im.setMatrixAt(i, m4.compose(pp, q, sc));
        const v = lerp(0.8, 1.2, b.k); cc.setRGB(v, v, v * 0.95);
        if (b.k2 < V.maple) { const t = b.k < 0.5 ? gold : red; cc.setRGB(v * lerp(1, t[0], 0.75), v * lerp(1, t[1], 0.75), v * lerp(1, t[2], 0.75)); }
        im.setColorAt(i, cc);
      });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.frustumCulled = false; im.name = 'canopy'; scene.add(im);
    }
    await ctx.yield();
    // every tree throws a shadow away from the sun wall: rasterised once into a small map the ground shader reads (crisp at any mesh density)
    {
      const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oa = SUN.z / hl;     // down-sun in (x, arc)
      const lng = clamp(1 / Math.tan(el), 1.1, 2.6), rad = [4.6, 4.6, 4.2, 3.2, 1.7, 3.8], D = shadowData;
      const blot = (x, a, r, len, k) => {                              // an ellipse r wide, r * len long, lying down-sun from the foot
        const cx = x + ox * r * len * 0.75, ca = a + oa * r * len * 0.75, R1 = r * (len + 0.6);
        const i0 = Math.max(0, Math.floor((cx - R1 + 600) / 1200 * SW)), i1 = Math.min(SW - 1, Math.ceil((cx + R1 + 600) / 1200 * SW));
        const j0 = Math.max(0, Math.floor((ca - R1 + 700) / 1400 * SH)), j1 = Math.min(SH - 1, Math.ceil((ca + R1 + 700) / 1400 * SH));
        for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
          const dx = (i + 0.5) / SW * 1200 - 600 - cx, da = (j + 0.5) / SH * 1400 - 700 - ca, al = dx * ox + da * oa, ac = dx * oa - da * ox;
          const q2 = (al * al) / (r * r * len * len) + (ac * ac) / (r * r); if (q2 >= 1) continue;
          const v = 255 * k * Math.min(1, (1 - q2) * 2.2), n = j * SW + i; if (v > D[n]) D[n] = v;
        }
      };
      let c = 0;
      for (const t of tpts) { const a = aOfZ(t.z), r = rad[t.v] * t.s * (t.v === 4 ? 1.3 : 0.95); blot(t.x, a, r, t.v === 4 ? lng * 2.2 : lng, 0.9); if (++c % 150 === 0) await ctx.yield(); }
      for (const b of canopy) { if (b.crack) continue; blot(b.x, b.a, b.r * 1.05, lng * (b.hedge ? 1.25 : 1), 0.88); if (++c % 150 === 0) await ctx.yield(); }
      shadowTex.needsUpdate = true;
    }
    await ctx.yield();
    // grass and flowers on the banks where the flight is low: the first and last fifth
    const grassOpts = { path, heightAt: H, wind, map: leafMat.map, groundColor, radius: 44, bias: 1.25, width: [0.5, 0.85], height: [0.3, 0.55], fade: [90, 135], chunks: 2, flowers: autumn ? 0.02 : 0.07,
      density: (x, z) => { const a = aOfZ(z), dx = x - rv(a);
        if (Math.abs(dx) < hw(a) + 3.5) return 0;
        if (fieldMask(x, a) > 0.5) { const f = fieldAt(x, a); if (f.crop !== 0 && f.crop !== 5 && f.e > 1.5) return f.crop === 3 ? 0 : 0.3; }
        if (dx * FS > 0 && Math.abs(a - WA) < 84) {                     // on the bluff: none in the stream, none on its rock faces
          if (Math.abs(dx) < hw(a) + PB(a) + 3.5 || streamDist(bu1(x, a), bu2(a)) < 7) return 0;
          if (Math.hypot(land(x + 1.6, a) - land(x - 1.6, a), land(x, a + 1.6) - land(x, a - 1.6)) / 3.2 > 1.35) return 0;
        }
        return 1; } };
    const grassIn = await flora.makeGrassAsync({ ...grassOpts, rng: R.fork('grassIn'), uRange: [0, 0.17], count: Math.round(6200 * Math.min(DENS, 1.12) * QD) }, ctx.yield);
    await ctx.yield();
    const grassOut = await flora.makeGrassAsync({ ...grassOpts, rng: R.fork('grassOut'), uRange: [0.7, 1.02], count: Math.round(14500 * Math.min(DENS, 1.12) * QD) }, ctx.yield);
    scene.add(grassIn.object, grassOut.object);
    await ctx.yield();

    // ---------- the built world ----------
    const mats = S.makeMaterials({ night: M.night, lit: 0.5, glow: 2.4 });
    mats.setSky({ top: NIGHT ? '#0b1436' : '#2f5fae', horizon: NIGHT ? '#2b3c70' : '#cfe4fb', sun: M.sun, sunDir: SUN.toArray() });
    // hill village with its dome, standing on the radial
    const vFrame = frameAt(VA, VX);
    const village = S.makeVillage({ rng: R.fork('village'), mats, center: [0, 0], radius: 60, count: V.houses, heightAt: vFrame.userData.heightAt,
      styles: ['mediterranean'], landmark: 'dome', lamps: M.night > 0.3, maxSlope: 0.5, detail: 0.8 });
    vFrame.add(village.object); scene.add(vFrame);
    await ctx.yield();
    // low stone bridge
    const bFrame = frameAt(BA, rv(BA), 6.5);
    const bridge = S.makeBridge({ rng: R.fork('bridge'), mats, type: 'arch', length: 60, width: 6.5, spans: 3, height: 7, below: 4 });
    bFrame.add(bridge.object); scene.add(bFrame);
    await ctx.yield();

    // the aqueduct: nine arches 18 m wide and 24 m tall, plumb to world Y; the portal stands in the middle one. Fine ashlar (half-metre
    // courses), a ring of voussoirs and a keystone round every arch, dentils under the cornice, cutwaters on the river piers; the shader
    // adds what age adds: dark streaks under the cornice, damp at the feet, cool shade inside the arches.
    const stoneTex = await stoneTexture(R.fork('stone'), ctx.yield);
    await ctx.yield();
    const stoneMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: '#f3efe6', roughness: 0.92, metalness: 0, vertexColors: true, emissive: C('#fff0da'), emissiveMap: stoneTex, emissiveIntensity: NIGHT ? 0.03 : 0.07 });
    stoneMat.onBeforeCompile = (shader) => {
      shader.vertexShader = 'varying vec3 vAqP; varying vec3 vAqN;\n' + shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n vAqP = position; vAqN = normal;');
      shader.fragmentShader = 'varying vec3 vAqP; varying vec3 vAqN;\nfloat aqH(float n){ return fract(sin(n * 12.9898) * 43758.5453); }\n'
        + 'float aqN(float x){ float i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f); return mix(aqH(i), aqH(i + 1.0), f); }\n'
        + shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>
        { float face = step(0.5, abs(vAqN.z)), top = 30.0 - vAqP.y;
          float n1 = aqN(vAqP.x * 0.9 + 3.0), n2 = aqN(vAqP.x * 3.3 + 17.0), n3 = aqN(vAqP.x * 0.21 + vAqP.y * 0.17);
          float streak = smoothstep(0.38, 0.8, 0.6 * n1 + 0.4 * n2) * (1.0 - smoothstep(0.5, 9.0 + 7.0 * n1, top)) * step(0.0, top);
          float under = (1.0 - smoothstep(0.0, 5.0, top)) * step(0.0, top);
          vec3 c = diffuseColor.rgb * (0.9 + 0.2 * n3);
          c *= 1.0 - face * (0.36 * streak + 0.14 * under);
          float damp = 1.0 - smoothstep(-1.5, 2.5 + 2.5 * n2, vAqP.y);
          c = mix(c, c * vec3(0.46, 0.53, 0.45), damp * 0.85);
          float soffit = (1.0 - face) * step(-8.7, vAqP.y) * step(vAqP.y, 24.6) * step(abs(vAqP.z), 3.21);
          c *= mix(vec3(1.0), vec3(0.5, 0.58, 0.78), soffit);
          diffuseColor.rgb = c; }`);
    };
    {
      const PITCH = 22.5, PIER = 4.5, half = (9 * PITCH + PIER) / 2, top = 30, parts = [];
      const white = (g, k = 1) => { const n = g.attributes.position.count, col = new Float32Array(n * 3).fill(k); g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; };
      const sh = new THREE.Shape(); sh.moveTo(-half, -9); sh.lineTo(half, -9); sh.lineTo(half, top); sh.lineTo(-half, top); sh.lineTo(-half, -9);
      for (let i = 0; i < 9; i++) {
        const cx = (i - 4) * PITCH, hole = new THREE.Path();
        hole.moveTo(cx - 9, -8.5); hole.lineTo(cx + 9, -8.5); hole.lineTo(cx + 9, 15); hole.absarc(cx, 15, 9, 0, Math.PI, false); hole.lineTo(cx - 9, -8.5);
        sh.holes.push(hole);
      }
      const wall = new THREE.ExtrudeGeometry(sh, { depth: 6.4, bevelEnabled: false, curveSegments: 14 }); wall.translate(0, 0, -3.2); parts.push([wall, 1]);
      await ctx.yield();
      const box = (w, h, d, x, y, z = 0, k = 1) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); parts.push([g, k]); };
      box(half * 2 + 2.2, 0.7, 7.6, 0, top + 0.35); box(half * 2 + 3.6, 0.6, 9.0, 0, top + 1.0, 0, 1.04);                      // cornice, in two steps
      box(half * 2 + 1.6, 2.2, 0.9, 0, top + 2.4, 3.3); box(half * 2 + 1.6, 2.2, 0.9, 0, top + 2.4, -3.3);                    // channel walls
      box(half * 2 + 2.0, 0.35, 1.3, 0, top + 3.65, 3.3, 1.05); box(half * 2 + 2.0, 0.35, 1.3, 0, top + 3.65, -3.3, 1.05);    // and their coping
      for (let x = -half + 0.6; x < half; x += 1.5) box(0.55, 0.5, 0.45, x, top - 0.25, 3.42, 0.97);                           // dentils under the cornice
      for (let i = 0; i <= 9; i++) {
        const px = (i - 4.5) * PITCH;
        box(PIER + 1.0, 0.8, 7.4, px, 15.2, 0, 1.03); box(PIER + 0.4, 0.4, 6.9, px, 14.6);                                     // impost in two steps
        box(PIER + 1.6, 9, 8.4, px, -4.5, 0, 0.94); box(PIER + 0.9, 0.5, 7.5, px, 0.25, 0, 0.98);                             // plinth and its cap
        box(1.9, top - 15.6, 7.2, px, 15.6 + (top - 15.6) / 2);                                                              // pilaster
        box(2.5, 0.5, 7.5, px, top - 0.9, 0, 1.03);                                                                           // its capital
      }
      for (const i of [4, 5]) {                                        // cutwaters on the two piers that stand in the river
        const px = (i - 4.5) * PITCH, cw = new THREE.CylinderGeometry(2.5, 3.2, 7.6, 3, 1); cw.scale(1, 1, 1.15); cw.translate(px, -4.9, 4.1); parts.push([cw, 0.9]);
      }
      const geos = [];
      for (let i = 0; i < parts.length; i++) { const [g, k] = parts[i], n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose(); geos.push(white(stoneUV(n, 1 / 4), k)); if (i % 20 === 19) await ctx.yield(); }
      await ctx.yield();
      // voussoirs: seventeen wedges round each arch, standing a hand proud of the wall, and a taller keystone
      {
        const P = [], Nn = [], U = [], Cl = [], NV = 17, z0 = 3.2, z1 = 3.46, ar = R.fork('voussoirs');
        const quad = (a, b, c, d, n, k) => { for (const q of [a, b, c, a, c, d]) { P.push(q[0], q[1], q[2]); Nn.push(n[0], n[1], n[2]); Cl.push(k, k, k * 0.985); } U.push(0.03, 0.9, 0.19, 0.9, 0.19, 0.98, 0.03, 0.9, 0.19, 0.98, 0.03, 0.98); };
        for (let i = 0; i < 9; i++) {
          const cx = (i - 4) * PITCH;
          for (let v = 0; v < NV; v++) {
            const key = v === (NV - 1) / 2, g0 = 0.012, t0 = Math.PI * v / NV + g0, t1 = Math.PI * (v + 1) / NV - g0, r0 = 9, r1 = key ? 11.4 : 10.45, zz = key ? z1 + 0.16 : z1, k = ar.range(0.93, 1.07) * (key ? 1.05 : 1);
            const pt = (t, r, z) => [cx + Math.cos(t) * r, 15 + Math.sin(t) * r, z], tm = (t0 + t1) / 2;
            quad(pt(t0, r0, zz), pt(t0, r1, zz), pt(t1, r1, zz), pt(t1, r0, zz), [0, 0, 1], k);                                  // face
            quad(pt(t0, r1, z0), pt(t1, r1, z0), pt(t1, r1, zz), pt(t0, r1, zz), [Math.cos(tm), Math.sin(tm), 0], k * 0.9);     // back of the wedge
            quad(pt(t0, r0, z0), pt(t0, r1, z0), pt(t0, r1, zz), pt(t0, r0, zz), [Math.sin(t0), -Math.cos(t0), 0], k * 0.62);   // the two joints: in shade
            quad(pt(t1, r0, zz), pt(t1, r1, zz), pt(t1, r1, z0), pt(t1, r0, z0), [-Math.sin(t1), Math.cos(t1), 0], k * 0.62);
          }
          for (const sd of [-1, 1]) for (let q = 0; q < 12; q++) {    // jamb stones below the springing, alternately long and short
            const y0 = -8.5 + q * 1.95, w = q % 2 ? 1.0 : 1.7, xa = cx + sd * 9, xb = cx + sd * (9 + w), k = ar.range(0.94, 1.06);
            quad([Math.min(xa, xb), y0 + 0.04, z1 - 0.1], [Math.max(xa, xb), y0 + 0.04, z1 - 0.1], [Math.max(xa, xb), y0 + 1.91, z1 - 0.1], [Math.min(xa, xb), y0 + 1.91, z1 - 0.1], [0, 0, 1], k);
          }
        }
        const vg = new THREE.BufferGeometry();
        vg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); vg.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
        vg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); vg.setAttribute('color', new THREE.Float32BufferAttribute(Cl, 3)); geos.push(vg);
      }
      await ctx.yield();
      const geo = mergeGeometries(geos, false); geos.forEach((g) => g.dispose());
      const aq = new THREE.Mesh(geo, stoneMat); aq.position.set(xExit, yBase, zEnd); aq.name = 'aqueduct'; scene.add(aq);
    }
    await ctx.yield();
    {                                                                 // a thread of water spilling from the channel beside the central arch: it too falls aslant
      const N2 = 18, P = [], U = [], tx = xExit - clamp(hw(A1 - 18.8) - 2.6, 3.5, 7.9), drop = 30.2, zAt = (d) => 4.0 + 3.4 * Math.sqrt(d / drop) + (fallHAq(d));
      function fallHAq(d) { return drop * Math.tan(LEAN) * Math.pow(d / drop, 1.5); }
      for (let i = 0; i <= N2; i++) { const d = drop * (i / N2) * (i / N2), w = lerp(0.22, 0.5, i / N2); for (const sd of [-1, 1]) { P.push(tx + sd * w, yBase + 30.6 - d, zEnd + zAt(d)); U.push(sd * 0.5 + 0.5, d / 3); } }
      const idx = []; for (let i = 0; i < N2; i++) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      const b = P.length / 3, fz = zEnd + zAt(drop);                    // and the ring of foam it makes in the river
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(tx + sx * 2.3, yBase + 0.62, fz + sz * 2.3); U.push(sx, -2 - sz); }
      idx.push(b, b + 2, b + 1, b, b + 3, b + 2);
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(idx);
      const thread = new THREE.Mesh(g, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: time, uC: { value: C('#eef6ff').multiply(C(M.sun)).multiplyScalar(NIGHT ? 0.45 : 1.1) } },
        vertexShader: 'varying vec2 vU; void main(){ vU = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform float uT; uniform vec3 uC; varying vec2 vU;
          float h1(vec2 p){ p = fract(p * vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.y); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h1(i), h1(i + vec2(1, 0)), f.x), mix(h1(i + vec2(0, 1)), h1(i + vec2(1, 1)), f.x), f.y); }
          void main(){
            if (vU.y < -0.5) {                                          // the foam ring: (vU.x, vU.y + 2) in -1..1
              vec2 q = vec2(vU.x, vU.y + 2.0); float r = length(q), n = vn(q * 4.0 + vec2(0.0, uT * 1.3));
              float ring = (1.0 - smoothstep(0.75, 1.0, r)) * smoothstep(0.1, 0.5, n + 0.7 * (1.0 - r)) * (0.6 + 0.4 * sin(r * 14.0 - uT * 5.0));
              gl_FragColor = vec4(uC, clamp(ring, 0.0, 1.0) * 0.8); return; }
            float e = 1.0 - abs(vU.x - 0.5) * 2.0, n = vn(vec2(vU.x * 5.0, vU.y * 1.6 - uT * 5.5)) * 0.6 + vn(vec2(vU.x * 11.0, vU.y * 4.0 - uT * 9.0)) * 0.4;
            float a = smoothstep(0.0, 0.5, e) * smoothstep(0.3, 0.7, n + 0.4 * e) * smoothstep(0.0, 0.25, vU.y);
            gl_FragColor = vec4(uC * (0.8 + 0.5 * n), a * 0.7); }` }));
      thread.renderOrder = 2; thread.name = 'spill'; scene.add(thread);
    }
    // the monorail: a slender white viaduct along the bank opposite the village, and two trains running with the flight
    const monoX = (a) => rv(a) + monoOff(a), TRACK = 30;
    const whiteMat = new THREE.MeshStandardMaterial({ color: '#c2c8d0', roughness: 0.6, metalness: 0.05, emissive: '#7f90ac', emissiveIntensity: 0.2 });   // pale concrete, a tone under the trains so they read against it
    const railPts = [];
    {
      const pos = [], nor = [], idx = [], parts = [], p = V3(), up = V3(), q = new THREE.Quaternion(), Y = V3(0, 1, 0), m4 = new THREE.Matrix4(), one = V3(1, 1, 1);
      const HWB = 1.25, DEP = 1.9, faces = [[-1, 0, 1, 0, 0, 1], [1, 0, 1, 1, 1, 0], [1, 1, -1, 1, 0, -1], [-1, 1, -1, 0, -1, 0]];   // corner a (x, down), corner b (x, down), normal (x, up)
      let row = 0;
      for (let a = -690; a <= 690.01; a += 7.5, row++) {
        ring(a, monoX(a), TRACK, p, up);
        if (row % 2 === 0) railPts.push(p.clone());
        for (const f of faces) for (let k = 0; k < 2; k++) {
          pos.push(p.x + f[k * 2] * HWB, p.y - up.y * DEP * f[k * 2 + 1], p.z - up.z * DEP * f[k * 2 + 1]);
          nor.push(f[4], up.y * f[5], up.z * f[5]);
        }
        if (row > 0) for (let f = 0; f < 4; f++) { const b0 = (row - 1) * 8 + f * 2, b1 = row * 8 + f * 2; idx.push(b0, b0 + 1, b1, b0 + 1, b1 + 1, b1); }
        if (row % 6 === 3) {                                          // a pier every 45 m
          const x = monoX(a), foot = land(x, a) - 2.5, len = TRACK - DEP - foot;
          const col = new THREE.CylinderGeometry(0.85, 1.35, len, 8, 1, true); col.translate(0, foot + len / 2, 0);
          const cap = new THREE.BoxGeometry(4.2, 1.1, 2.4); cap.translate(0, TRACK - DEP - 0.55, 0);
          ring(a, x, 0, p, up); q.setFromUnitVectors(Y, up); m4.compose(p, q, one);
          for (const g of [col, cap]) { g.applyMatrix4(m4); g.deleteAttribute('uv'); const n = g.toNonIndexed(); g.dispose(); parts.push(n); }
        }
      }
      const beam = new THREE.BufferGeometry();
      beam.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); beam.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); beam.setIndex(idx);
      const bn = beam.toNonIndexed(); beam.dispose(); parts.push(bn);
      const via = new THREE.Mesh(mergeGeometries(parts, false), whiteMat); parts.forEach((g) => g.dispose()); via.material.side = THREE.DoubleSide; via.name = 'viaduct'; scene.add(via);
    }
    await ctx.yield();
    // Both trains run with the flight and are keyed to u. The first is on the viaduct in the opening image and draws away up the valley;
    // the second overtakes slowly from behind, comes into view as the gaze drops from the arch (u ~ 0.6) and leads the eye to the aqueduct.
    const railD = [0]; for (let i = 1; i < railPts.length; i++) railD.push(railD[i - 1] + railPts[i].distanceTo(railPts[i - 1]));
    const dOfA = (a) => { const f = (a + 690) / 15, n = railD.length - 1; if (f <= 0) return f * 15; if (f >= n) return railD[n] + (f - n) * 15; const i = Math.floor(f); return lerp(railD[i], railD[i + 1], f - i); };
    const trainRng = R.fork('train');
    const mkTrain = (cars) => { const tr = S.makeTrain({ rng: trainRng, mats, points: railPts, type: 'bullet', cars, speed: 1, loop: false, beam: false, fade: 30, palette: { body: '#f6f7f8', coach: '#f6f7f8', roof: '#f2f4f6', trim: '#e2573a' } }); scene.add(tr.object); return tr; };
    const train = mkTrain(3); await ctx.yield();
    const train2 = mkTrain(4);
    // metres along the track for path progress u. The first train is level with the flight in the opening image, draws ahead, keeps its lead
    // while the gaze is on the arch and runs just ahead as the flight comes down beside the viaduct (u 0.47-0.58), then pulls away to the aqueduct.
    const LEAD = [[0, -90], [0.3, 66], [0.42, 84], [0.5, 120], [0.56, 132], [0.66, 224], [0.8, 330], [1.001, 520]];   // (a three-car train, and far enough ahead at u 0.52 that it is whole in the frame, its tail clear of the corner the beam comes in by)
    const leadAt = (u) => { let i = 0; while (i < LEAD.length - 2 && u > LEAD[i + 1][0]) i++; const p = LEAD[i], q = LEAD[i + 1]; return lerp(p[1], q[1], smoothstep(p[0], q[0], u)); };
    const aCam = new Float32Array(101); { const q = V3(); for (let i = 0; i <= 100; i++) aCam[i] = aOfZ(path.pointAt(i / 100, q).z); }   // where the flight really is at each u (its line is longer on some seeds than on others), so the lead is the same on every seed
    const aCamAt = (u) => { const f = clamp(u, 0, 1) * 100, i = Math.min(99, Math.floor(f)); return lerp(aCam[i], aCam[i + 1], f - i); };
    const trainAt = (u) => dOfA(aCamAt(u) + leadAt(u));
    const train2At = (u, t) => dOfA(lerp(A0, A1, u) + 255 + 900 * u + (u <= 0 ? 60 * Math.sin(t * 0.05) : 0));   // (it creeps while the world is only seen through a portal)
    await ctx.yield();
    // sailboats: one instanced fleet, sailed along the river by hand so they follow the ring
    const fleet = S.makeBoats({ rng: R.fork('boats'), mats, count: V.boats, types: ['sailboat'], variants: 1, positions: Array.from({ length: V.boats }, () => [0, 0, 0]), moving: false, lit: 1 });
    await ctx.yield();
    scene.add(fleet.object);
    const boatMeshes = fleet.object.children.filter((c) => c.isInstancedMesh);
    const boats = Array.from({ length: V.boats }, (_, i) => ({ a0: lerp(-470, 60, (i + R.range(0.15, 0.85)) / V.boats), v: R.range(1.8, 3.4) * (R.chance(0.7) ? 1 : -1), off: R.range(-0.38, 0.38), ph: R.range(0, TAU) }));
    boats[0].a0 = A0 + 85; boats[0].v = Math.abs(boats[0].v) * 0.6;   // one sail in the opening image
    const bM = new THREE.Matrix4(), bP = V3(), bU = V3(), bX = V3(), bZ = V3();
    const sailBoats = (t) => {
      for (let i = 0; i < boats.length; i++) {
        // each boat beats up and down its own 240 m reach (it never comes under the low ends of the flight or into the portal's arch)
        const b = boats[i], ph = b.v * t / 120, a = b.a0 + 120 * Math.sin(ph), w = hw(a) - 3.5;
        const x = rv(a) + b.off * w, dir = Math.sign(b.v) * (Math.cos(ph) >= 0 ? 1 : -1);
        ring(a, x, 0.32 + 0.07 * Math.sin(t * 1.3 + b.ph), bP, bU);
        bX.set((rv(a + 4) - rv(a - 4)) / 8, bU.z, -bU.y).multiplyScalar(dir).normalize();   // bow: along the river, in the floor's tangent plane
        bZ.crossVectors(bX, bU).normalize(); bU.addScaledVector(bZ, 0.07 * Math.sin(t * 0.9 + b.ph) + 0.06).normalize(); bZ.crossVectors(bX, bU).normalize();
        bM.makeBasis(bX, bU, bZ).setPosition(bP);
        for (const m of boatMeshes) m.setMatrixAt(i, bM);
      }
      for (const m of boatMeshes) m.instanceMatrix.needsUpdate = true;
    };
    sailBoats(0);
    await ctx.yield();

    // ---------- lamps (evening and the night side): the avenue, the bridge road, the aqueduct, the viaduct, the promenades under the glass, farms ----------
    let lamps = null; const lampU = { uT: time, uH: { value: 450 }, uC: { value: C('#ffc477') } };
    if (M.night > 0.3) {
      const lr = ctx.rng.fork('lamps'), P = [], Cn = [], Sd = [], idx = [], p = V3(), up = V3();
      const lamp = (x, a, h, size) => { ring(a, x, land(x, a) + h, p, up); const b = P.length / 3, s = lr();
        for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(p.x, p.y, p.z); Cn.push(cx * size, cy * size); Sd.push(s); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); };
      { const vx = roadB[1] - roadA[1], va = roadB[0] - roadA[0], len = Math.hypot(vx, va); for (let t = 4; t < len; t += 12) lamp(roadA[1] + vx * t / len, roadA[0] + va * t / len, 3.6, 0.55); }
      for (let d = 22; d < 100; d += 13) for (const sd of [-1, 1]) lamp(rv(BA) + sd * d, BA, d < 34 ? 8.2 : 3.6, 0.55);
      for (let a = -690; a <= 690; a += 45) { const x = monoX(a); if (Math.abs(x) < 560) lamp(x, a + 15, TRACK - land(x, a + 15) + 1.6, 0.7); }
      for (let a = -640; a <= 660; a += 26) for (const sd of [-1, 1]) lamp(sd * 583, a, 5, 0.8);
      for (const [a, sd, off] of [[WA - 78, FS, 9], [WA - 30, -FS, 8], [WA + 6, -FS, 8], [WA + 40, -FS, 8]]) lamp(rv(a) + sd * (hw(a) + off), a, 3.2, 0.62);   // round the fall's pool
      for (let k = 0; k < Math.round(46 * DENS); k++) { const a = lr.range(-430, 520), x = rv(a) + lr.sign() * lr.range(70, 380); if (Math.abs(x) < 540 && fieldMask(x, a) > 0.5) lamp(x, a, 3, 0.6); }
      for (let i = 0; i <= 9; i++) for (const zz of [4.6, -4.6]) { const b = P.length / 3, s = lr(), x = xExit + (i - 4.5) * 22.5;     // on the aqueduct's cornice, over every pier
        for (const [cx, cy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(x, yBase + 35.2, zEnd + zz); Cn.push(cx * 0.7, cy * 0.7); Sd.push(s); } idx.push(b, b + 1, b + 2, b, b + 2, b + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aCorner', new THREE.Float32BufferAttribute(Cn, 2));
      g.setAttribute('aSeed', new THREE.Float32BufferAttribute(Sd, 1)); g.setIndex(idx); g.boundingSphere = new THREE.Sphere(V3(0, 200, 0), 1400);
      lamps = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: lampU, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
        vertexShader: `attribute vec2 aCorner; attribute float aSeed; uniform float uT, uH; varying vec2 vQ; varying float vK;
          void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float pxw = -mv.z * 2.0 / (projectionMatrix[1][1] * uH), sz = length(aCorner) * 0.7071, k = max(1.0, pxw * 1.7 / sz);   // never under ~3.5 pixels across
            mv.xy += aCorner * k; vQ = sign(aCorner);
            vK = (0.8 + 0.2 * sin(uT * (1.3 + 2.6 * aSeed) + aSeed * 40.0)) / (k * k) * (1.0 + 0.6 * min(k - 1.0, 3.0));
            gl_Position = projectionMatrix * mv; }`,
        fragmentShader: `uniform vec3 uC; varying vec2 vQ; varying float vK;
          void main(){ float r2 = dot(vQ, vQ), a = exp(-r2 * 5.0) * (1.0 - smoothstep(0.7, 1.0, r2)); gl_FragColor = vec4(uC * (5.5 * a + 0.9 * exp(-r2 * 1.6) * (1.0 - smoothstep(0.6, 1.0, r2))) * vK, 1.0); }` }));
      lamps.renderOrder = 2.5; lamps.name = 'lamps'; scene.add(lamps);
    }
    // ---------- the rare day: the balloon regatta. Balloons go up from the meadows and climb toward the axis where weight falls away;
    // the spin bends their track, so the string of them leans across the sky the way the waterfall leans ----------
    let balloons = null;
    if (RARE) {
      const br = ctx.rng.fork('balloons'), NB = Math.round(48 * lerp(0.75, 1, (QD - 0.5) / 0.5)), P = [], Nn = [], Pt = [];
      const prof = [[0, 0.02], [0.18, 0.2], [0.42, 0.52], [0.66, 0.86], [0.86, 1], [1.02, 0.94], [1.16, 0.7], [1.24, 0.36], [1.27, 0]];   // (height, radius) of the envelope, mouth to crown
      const SEG = 12, tri = (a, b, c, part) => { const n = V3().subVectors(b, a).cross(V3().subVectors(c, a)).normalize(); for (const q of [a, b, c]) { P.push(q.x, q.y, q.z); Nn.push(n.x, n.y, n.z); Pt.push(part); } };
      for (let s = 0; s < SEG; s++) for (let k = 0; k < prof.length - 1; k++) {
        const a0 = s / SEG * TAU, a1 = (s + 1) / SEG * TAU, q = (a, j) => V3(Math.cos(a) * prof[j][1] * 7, 5 + prof[j][0] * 14, Math.sin(a) * prof[j][1] * 7), part = k === 0 ? 3 : s % 2;
        tri(q(a0, k), q(a0, k + 1), q(a1, k + 1), part); if (k > 0 || true) tri(q(a0, k), q(a1, k + 1), q(a1, k), part);
      }
      { const bx0 = new THREE.BoxGeometry(1.7, 1.3, 1.7).toNonIndexed(), bp = bx0.attributes.position, bn = bx0.attributes.normal; for (let i = 0; i < bp.count; i++) { P.push(bp.getX(i), bp.getY(i) + 0.65, bp.getZ(i)); Nn.push(bn.getX(i), bn.getY(i), bn.getZ(i)); Pt.push(2); } bx0.dispose(); }
      for (let k = 0; k < 4; k++) { const a = k / 4 * TAU + 0.78, c = Math.cos(a), s = Math.sin(a), w = 0.09, A = V3(c * 0.8, 1.3, s * 0.8), B = V3(c * 1.5, 5.4, s * 1.5), o = V3(-s * w, 0, c * w);   // four lines to the mouth
        tri(A.clone().sub(o), A.clone().add(o), B.clone().add(o), 2); tri(A.clone().sub(o), B.clone().add(o), B.clone().sub(o), 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(Pt, 1));
      const bm = new THREE.ShaderMaterial({ side: THREE.DoubleSide, fog: true, uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uT: time, uSun: { value: SUN }, uSunC: { value: sunCol.clone().multiplyScalar(M.key * 0.33) },
          uAmb: { value: C(M.sky).multiplyScalar(M.fill * 0.42) }, uLit: { value: NIGHT ? 1 : M.night > 0.3 ? 0.4 : 0.1 } },
        vertexShader: `#include <common>
          #include <fog_pars_vertex>
          attribute float aPart; uniform float uT; varying vec3 vN; varying vec3 vC; varying float vPart, vY, vF;
          void main(){ vPart = aPart; vY = position.y;
            #ifdef USE_INSTANCING_COLOR
              vC = instanceColor;
            #else
              vC = vec3(1.0);
            #endif
            vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
            vF = 0.75 + 0.25 * sin(uT * 2.3 + instanceMatrix[3][0] * 0.37) * sin(uT * 0.9 + instanceMatrix[3][2] * 0.21);
            vec4 mvPosition = modelViewMatrix * instanceMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `#include <common>
          #include <fog_pars_fragment>
          uniform vec3 uSun, uSunC, uAmb; uniform float uLit; varying vec3 vN; varying vec3 vC; varying float vPart, vY, vF;
          void main(){ vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
            vec3 alb = vPart < 0.5 ? vC : vPart < 1.5 ? mix(vC, vec3(0.92, 0.9, 0.84), 0.82) : vPart < 2.5 ? vec3(0.2, 0.13, 0.08) : vC * 0.7;
            float nl = max(dot(N, uSun), 0.0), wrap = 0.5 + 0.5 * dot(N, uSun);
            vec3 col = alb * (uSunC * (0.75 * nl + 0.25 * wrap * wrap) + uAmb * (0.7 + 0.3 * N.y));
            float mouth = 1.0 - smoothstep(5.0, 15.0, vY);                 // the burner lights the envelope from inside, strongest at the mouth
            if (vPart < 1.5 || vPart > 2.5) col += alb * vec3(1.0, 0.62, 0.25) * (uLit * (0.35 + 1.5 * mouth) + 0.5 * mouth * mouth) * vF;
            gl_FragColor = vec4(col, 1.0);
            #include <fog_fragment>
          }` });
      const im = new THREE.InstancedMesh(g, bm, NB), cols = ['#e2573a', '#ffcf6a', '#2f6f9a', '#f2f0e6', '#c9463c', '#4f9a56', '#e88a3a', '#7fb6ff'], cc = new THREE.Color();
      const list = [];
      for (let i = 0; i < NB; i++) {
        const near = i < 9;                                            // nine drift low round the flight; the rest are the climbing string
        list.push({ a0: near ? lerp(-380, 400, (i + br.range(0.2, 0.8)) / 9) : br.range(-260, 330), x0: br.sign() * (near ? br.range(52, 150) : br.range(50, 280)), h0: near ? br.range(34, 120) : 1150 * Math.pow((i - 9 + br()) / (NB - 9), 1.5),
          near, rise: near ? br.range(0.15, 0.35) : br.range(2.2, 4.2), ph: br.range(0, TAU), s: br.range(0.85, 1.25) * (near ? 1 : 1.25), spin: br.range(-0.12, 0.12) });
        cc.set(br.pick(cols)); im.setColorAt(i, cc);
      }
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.frustumCulled = false; im.name = 'balloons'; scene.add(im);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = V3(), up = V3(), sc = V3(), sgn = -Math.sign(V.spin);
      // ---------- the flight's lane is kept free of balloons. A balloon's LINE is every place its body can be at
      // any clock: its climb (the nine: up from where they are dealt, for good; the string: from the ground toward the
      // axis, lap after lap), the 3 m it bobs along that climb, and its slide of 9 m either way along the ring beside the
      // river. Where that line would come within BCLEAR of the flown route, the balloon has gone up from another
      // place across the ring instead: x0 is moved straight across the ring to the nearer side on which the whole line
      // is clear (to the other side where the nearer one would set it as near to the rail). No draw is made here;
      // arc, height, rise, phase, size and colour stay as dealt (size but for the loop's last line, which the
      // place cannot reach).
      // BCLEAR is one number, each part from this place: the envelope's half width at the largest scale dealt
      // (7 x 1.25 x 1.25 = 10.94) + the sway across the ring (7) + the tilt of the body about its basket (0.04 +
      // 0.04 rad on BRING, the 17.04 m up to the envelope's widest ring, at that scale = 2.13) + 2 m of clear air between
      // the body and the flown route's line (the camera's sway turns the gaze only) + the steps of this test (1.5:
      // the route and the climb are read every metre).
      const BRING = 17.04;                                             // the envelope's widest ring over the basket's foot (5 + 0.86 x 14)
      const BCLEAR = 7 * 1.25 * 1.25 + 7 + 0.08 * BRING * 1.25 * 1.25 + 2 + 1.5;
      // the flown route every metre (from a metre before the entry to the first whole metre past the exit) and the
      // rail's line every metre (the rail is laid from arc -690 to 690), in the ring's own measures: [arc, across,
      // height over the bare floor]
      const lane = [], rail = [], lq = V3();
      for (let d = -1; d <= path.length + 1; d++) {
        path.posAtDist(d, lq);
        lane.push([RR * Math.atan2(-lq.z, RR - lq.y), lq.x, RR - Math.hypot(RR - lq.y, lq.z)]);
      }
      for (let a = -690; a <= 690; a++) rail.push([a, monoX(a), TRACK]);
      // a basket higher than laneTop is further than BCLEAR over every metre of the route (and of the rail)
      const laneTop = lane.reduce((m, r) => Math.max(m, r[2]), 0) + BCLEAR;
      // lineOff: [is the balloon's line nearer than BCLEAR to any of pts, metres across to be clear of them all
      // on the -x side, on the +x side]
      const lineOff = (b, pts) => {
        const top = BRING * b.s, reach = BCLEAR + 9 + 520 * (laneTop / 1000) ** 2;
        const by = pts.filter((r) => Math.abs(r[0] - b.a0) * (1 - r[2] / RR) < reach);
        let hit = false, toL = 0, toR = 0;
        for (let h = (b.near ? b.h0 : 8) - 3; h < laneTop; h++) {
          const k = h / 1000; let ap = 0, xp = 0;
          for (let j = -9; j <= 9; j++) {
            // (a and x as update() below places the balloon, with update()'s own numbers: a change there is
            // owed here; its 7 m of sway across is in BCLEAR)
            const a = b.a0 + sgn * 520 * k * k + j;
            const x = clamp(rv(clamp(a, -700, 700)) * (1 - k) + b.x0 * (1 - 0.5 * k), -470, 470);
            // the metre of slide from the last place to this one: along the ring the balloon may be anywhere
            // in it, across anywhere between its two ends
            if (j > -9) for (const r of by) {
              const f = 1 - r[2] / RR, d0 = (r[0] - ap) * f, d1 = (r[0] - a) * f;
              const da = d0 * d1 < 0 ? 0 : Math.min(Math.abs(d0), Math.abs(d1));
              const dh = Math.max(0, h - r[2], r[2] - h - top), w2 = BCLEAR * BCLEAR - da * da - dh * dh;
              if (w2 <= 0) continue;
              const w = Math.sqrt(w2), lo = Math.min(xp, x) - r[1], hi = Math.max(xp, x) - r[1];
              if (lo < w && hi > -w) hit = true;
              toL = Math.max(toL, (w + hi) / (1 - 0.5 * k)); toR = Math.max(toR, (w - lo) / (1 - 0.5 * k));
            }
            ap = a; xp = x;
          }
        }
        return [hit, toL, toR];
      };
      for (const b of list) {
        await ctx.yield();                                             // the build is handed back between balloons
        const [hit, toL, toR] = lineOff(b, lane); if (!hit) continue;
        // the nearer side first (a centimetre over, for the arithmetic)
        const x0 = b.x0, across = toL < toR ? [-toL - 0.01, toR + 0.01] : [toR + 0.01, -toL - 0.01];
        b.x0 = x0 + across[0];
        if (lineOff(b, rail)[0]) b.x0 = x0 + across[1];                // not set onto the rail
        // still not clear (only if the ring's own clamp at 470 m across held the moved line, which the river and
        // the route, under about 350 m from the middle, do not reach): it is not seen this visit, drawn at a
        // thousandth wherever its climb puts it, as the string's are on the ground
        if (lineOff(b, lane)[0]) b.s = 0;
      }
      balloons = { update(t) {
        for (let i = 0; i < NB; i++) {
          const b = list[i], hh = b.near ? b.h0 + b.rise * t : (b.h0 + b.rise * t) % 1180, h = (b.near ? hh : 8 + hh) + 3 * Math.sin(t * 0.21 + b.ph), k = h / 1000;
          const grow = b.near ? 1 : smoothstep(0, 26, hh) * (1 - smoothstep(1120, 1180, hh));       // they fill on the ground and are lost to sight at the axis
          const a = b.a0 + sgn * 520 * k * k + 9 * Math.sin(t * 0.07 + b.ph), x = clamp(rv(clamp(a, -700, 700)) * (1 - k) + b.x0 * (1 - 0.5 * k) + 7 * Math.sin(t * 0.09 + b.ph * 2), -470, 470);
          ring(a, x, h, p, up); e.set(a / RR + 0.04 * Math.sin(t * 0.4 + b.ph), b.ph + b.spin * t, 0.04 * Math.cos(t * 0.33 + b.ph), 'XYZ'); q.setFromEuler(e);
          im.setMatrixAt(i, m4.compose(p, q, sc.setScalar(Math.max(b.s * grow, 0.001))));
        }
        im.instanceMatrix.needsUpdate = true; } };
      balloons.update(0);
    }
    await ctx.yield();

    // ---------- creatures ----------
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene), rng: R.fork('fauna') });
    const white = { body: '#f6f5f0', belly: '#ffffff', wingC: '#eceae4', tip: V.geese ? '#2a2a2e' : '#cfd3da', head: '#ffffff', tailC: '#f2f0ea', neckC: '#fbfaf6' };
    // the flock that lifts off the river as the camera climbs past the village (keyed to u)
    fauna.add(F.makeFlock({ rng: R.fork('flock'), species: V.geese ? 'geese' : 'gulls', count: V.geese ? Math.round(V.birds * 0.5) : V.birds, size: V.geese ? 1.5 : 1.9, ...white,
      ...(V.geese ? {} : { spread: [46, 9, 70] }), cross: { path, u: 0.33, lead: 85, angle: 22, side: R.sign(), height: -36, rise: 46, span: 380, offset: R.range(-12, 12), duration: DUR } }));
    await ctx.yield();
    // swifts round the aqueduct, so the approach is alive
    fauna.add(F.makeFlock({ rng: R.fork('swifts'), species: 'swifts', count: R.int(12, 20), size: 2.4, center: [xExit + R.range(-25, 25), yBase + 44, zEnd + 30], radius: 48, height: 10 }));
    await ctx.yield();
    // deer in a riverside meadow on the village bank: in the opening image, then passed close and low at u ~ 0.1
    const zD = zOfA(DA);
    fauna.add(F.makeHerd({ rng: R.fork('deer'), species: 'deer', count: V.deer, size: 1.85, heightAt: H, center: [DX, H(DX, zD), zD], radius: 22, varieties: 0.3 }));
    await ctx.yield();
    // gliders: slow white wings circling high toward the axis, where weight falls away
    const gl = hero.ringPoint(-R.range(140, 260), xh(200) * 0.3 + R.range(-120, 120), R.range(300, 420));
    fauna.add(F.makeFlock({ rng: R.fork('gliders'), species: 'eagles', count: V.gliders, size: R.range(9, 12), center: gl.position.toArray(), radius: 130, soarRadius: 90, soarLift: 14, speed: 13,
      flap: 0.25, amp: 0.06, glide: 1, body: '#f2f3f6', belly: '#ffffff', wingC: '#eef0f4', tip: '#e2573a', head: '#f2f3f6', tailC: '#e2573a' }), { always: true });
    await ctx.yield();

    // ---------- weather: cloud puffs inside the ring, valley mist, blossom on the wind ----------
    const cl = [], cr = R.fork('clouds');
    for (let i = 0; i < V.clouds; i++) {
      const a = lerp(-250, 520, (i + cr.range(0.1, 0.9)) / V.clouds), sd = i % 2 ? 1 : -1, x = clamp(rv(a) - cr.range(270, 430) * (sd > 0 ? 0.3 : 0.72), -330, 100), w = cr.range(80, 150) * 0.62;
      const p = ring(a, x, cr.range(150, 260)); cl.push([p.x, p.y, p.z, w]);
    }
    for (let i = 0; i < 2; i++) {                                     // two small ones hung in mid-air between the camera and the arch: something to measure it by
      const a = cr.range(250, 380) + i * 190, p = ring(a, clamp(rv(a) - cr.range(70, 190) * (i ? 1 : 0.5), -330, 100), cr.range(175, 235)); cl.push([p.x, p.y, p.z, cr.range(54, 80)]);
    }
    await ctx.yield();
    const clouds = makeCloudField({ rng: cr, mode: 'cumulus', at: cl, puffs: 40, sunDirection: SUN, sunColor: sunCol, litColor: NIGHT ? C('#5d6fa6') : C('#fff8ee').lerp(sunCol, 0.3), shadeColor: NIGHT ? '#1d2848' : '#8ea4cf',
      hazeColor: C(M.fog), wind: [0.5 * Math.sign(V.spin), 0, -1.1], opacity: 0.8, fogFade: 0.5, renderOrder: 4 });
    scene.add(clouds.object);
    await ctx.yield();
    const fxs = fx.fxGroup(); scene.add(fxs.object);
    const mp = [], mr = R.fork('mist');
    for (let i = 0; i < 64; i++) {
      const a = mr.range(-430, 600), onRiver = mr.chance(0.6), x = onRiver ? rv(a) + mr.range(-34, 34) * 0.5 : mr.range(-420, 420), z = zOfA(a), y = H(x, z);
      if (!onRiver || (a > -300 && a < 395)) continue;   // (only low on the water at the two low ends: seen from above a puff on a hillside is a grey smear)
      const n = path.nearestXZ(x, z); if (n.dist < 40 && n.y - y < 30) continue;
      mp.push([x, Math.max(y, floorY(z) + 0.3) + mr.range(3, 8), z]);
    }
    await ctx.yield();
    {                                                                 // a bank of mist where the valley starts its climb: the ground becomes the map behind it
      const sp = [];
      for (let i = 0; i < 44; i++) { const a = mr.range(OPEN + 30, OPEN + FADE - 20), x = mr.range(-540, 540), z = zOfA(a); sp.push([x, H(x, z) + mr.range(5, 16), z]); }
      fxs.add(fx.makeMist({ rng: mr, time, positions: sp, size: [70, 130], color: C('#eaf3ff').lerp(sunCol, 0.18), opacity: 0.012 + M.mist * 0.06, flatten: 0.3 }));   // (a veil: the fields show through it)
    }
    {                                                                 // spray carried off sideways from the fall, the way the sheet leans
      const fp = [], sg = -1, xr = footX - FS * 3;
      for (let i = 0; i < 9; i++) { const k = i / 8, a = footA + sg * lerp(-3, 16, k) , x = xr + mr.range(-7, 9), z = zOfA(a); fp.push([x, floorY(z) + lerp(3, 12, k) + mr.range(0, 4), z]); }
      fp.push(...mp);                                                 // (the low mist on the river's two ends rides in the same draw)
      fxs.add(fx.makeMist({ rng: mr, time, positions: fp, size: [13, 26], color: C('#f2f8ff').lerp(sunCol, 0.2), opacity: NIGHT ? 0.08 : 0.2, flatten: 0.6 }));
    }
    fxs.add(fx.makeParticles({ rng: R.fork('petals'), preset: autumn ? 'leaves' : 'petals', time, count: Math.round((autumn ? 150 : 240) * QD),
      colors: autumn ? ['#d98a2e', '#c8521e', '#e6b84a'] : ['#ffdbe8', '#fff3f6', '#f8bdd2'], lightDir: SUN.toArray(), near: [4, 10] }));   // (none close enough to the lens to be a blot)
    await ctx.yield();

    const bowCam = V3(), bowU = fall.mist ? fall.mist.material.uniforms.uRainbow : { value: 0 }, BOW0 = bowU.value;
    const bufSize = new THREE.Vector2();
    // ---------- gaze ----------
    const domeAt = ring(VA, VX, 26);
    const archAt = ring(1.3 * RR, rv(0) * 0.4, 0), railAt = V3(), poiUp = V3(), domeLook = V3(), lvA = V3(), lvB = V3(), valeAt = ring(-40, rv(-40) - 30, 24);     // a point on the ring 37 degrees above the forward horizon
    const fallAt = V3(lipX - FS * 4, lipY - fallH * 0.55, zOfA((aL + footA) / 2)), fallLook = V3();
    path.pointAt(0.7, lvA); path.posAtDist(0.7 * path.length + 38, lvB);
    const fallGap = Math.abs(Math.atan2(fallAt.x - lvA.x, lvA.z - fallAt.z) - Math.atan2(lvB.x - lvA.x, lvA.z - lvB.z));   // at u 0.70: the angle between the way ahead and the fall
    const fallEase = clamp(2 * (1 - 0.5236 / Math.max(fallGap, 0.01)), 0, 1);
    const pois = [
      { at: (t, u) => { const d = u * path.length; path.posAtDist(d, lvA); path.posAtDist(d + 38, lvB); lvB.y = lvA.y; return lvB; }, from: 0.56, to: 0.72, weight: 0.55 },   // the climb from the rail to the height the fall is seen from: the flight rises, the gaze stays near level (first in the list: it only levels the look-ahead, the others then pull as before)
      { at: (t, u) => domeLook.copy(domeAt).lerp(valeAt, smoothstep(0.16, 0.285, u)), from: 0.05, to: 0.33, weight: 0.5, fade: 0.25 },   // the domed town, whole, at u 0.16; then the gaze slides off it down the valley before the town is abeam
      { at: archAt, from: 0.29, to: 0.535, weight: 0.66, fade: 0.4 },      // the look up the arch; the near land and the whole aqueduct stay in the bottom of the frame
      { at: (t, u) => { const a = lerp(A0, A1, u) + 62; return ring(a, rv(a) + monoOff(a), TRACK + 2, railAt, poiUp); }, from: 0.47, to: 0.63, weight: 0.42, fade: 0.4 },   // the train alongside
      { at: (t, u) => {                                                // the fall. Round u 0.70 the pull is eased (fallEase) so that the fall stands 30 degrees right of the gaze, tall in the frame, whatever the river's line on this seed
          const k = 1 - (1 - fallEase) * smoothstep(0.62, 0.7, u) * (1 - smoothstep(0.7, 0.775, u)); if (k > 0.999) return fallAt;
          const d = u * path.length; path.posAtDist(d, lvA); path.posAtDist(d + 38, lvB); lvB.sub(lvA).normalize();
          return fallLook.copy(fallAt).sub(lvA).normalize().lerp(lvB, 1 - k).multiplyScalar(100).add(lvA);
        }, from: 0.6, to: 0.84, weight: 0.5 },   // (it comes in late: at u 0.70 the gaze still runs down the valley and the fall stands tall in the right of the frame)
    ];

    return {
      scene, path, duration: DUR,
      title: RARE ? 'The Inside-Out World, Regatta Day' : NIGHT ? 'The Inside-Out World, Night Side' : mood === 'evening' ? 'The Inside-Out World, Evening' : 'The Inside-Out World',
      ...(RARE ? { ride: 'balloon-basket' } : {}),
      camera: { fov: 62, near: 0.5, far: 6000, lookAhead: 38, sway: 0.8, bank: 0.22 },
      pois,
      portal: { shape: 'arch', width: 16, height: 22, color: '#fff2d2', glow: 1.25, revealDistance: 400 },
      post: { exposure: NIGHT ? 1.45 : mood === 'evening' ? 1.06 : 1.0, bloom: { strength: NIGHT ? 0.5 : 0.36, radius: 0.6, threshold: 0.95 },
        grade: { saturation: 0.99, contrast: 1.05, tint: M.tint, shadowTint: '#050a1c', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        hero.setProgress(u); hero.update(dt, t, camera);
        heavens.update(dt, t, camera); if (camera) air.position.setFromMatrixPosition(camera.matrixWorld);
        terrain.update(dt, t);
        river.update(dt, t, camera); stream.update(dt, t, camera); fall.update(dt, t, camera);
        if (camera && u > 0.5 && u < 0.9) { fall.light.sunDir.copy(aimBow(bowCam.setFromMatrixPosition(camera.matrixWorld))); bowU.value = BOW0 * (1.7 - 0.7 * smoothstep(0.7, 0.79, u)); }   // (the bow is drawn stronger while the fall is still far off)
        forest.update(dt, t, camera); if (reeds) reeds.update(dt, t, camera);
        grassIn.object.visible = u < 0.36; grassOut.object.visible = u > 0.5;
        if (grassIn.object.visible) grassIn.update(dt, t, camera);
        if (grassOut.object.visible) grassOut.update(dt, t, camera);
        train.update(dt, trainAt(u)); train2.update(dt, train2At(u, t));   // metres along the track (speed 1), keyed to progress
        mats.update(dt, t); village.update(dt, t);
        sailBoats(t);
        fauna.update(dt, t, camera, u);
        clouds.update(dt, t, camera);
        fxs.update(dt, t, camera);
        if (lamps && ctx.renderer) lampU.uH.value = ctx.renderer.getDrawingBufferSize(bufSize).y;
        if (balloons) balloons.update(t);
      },
      dispose() {
        hero.dispose();
        leafMap.dispose();
        fieldTex.dispose(); shadowTex.dispose();       // given to the ground's shader only in its compile hook, where the engine's clearing cannot see them
        for (const g of [...nearKinds, ...farKinds, ...reedKinds]) g.dispose();       // source tree geometries (the scatter may keep its own merged copies)
        if (typeof fauna.dispose === 'function') fauna.dispose();
      },
    };
  },
};
