// The Chandelier City. A city of inhabited chandeliers hangs from the underside of an endless cloud over a
// lavender sea; rain rises in gold shafts; koi swim in the ceiling; we cross it by bell-gondola, slung from
// station to station on a sagging cable, and leave through the lowest pendant of the Grand Chandelier.
//
// World space == the hero's local space: sea at y = 0, cloud floor at y = 600, Grand Chandelier axis at x = z = 0,
// the final approach comes in along +Z travelling -Z, the portal hangs at (0, 410, 0).
//
// Looks by seed (ctx.vary.hour honoured): HOUR sunrise (coral sun 30 deg left of the portal) | rose-gold sunset
// (sun on the other side) | blue hour (every window and candle up, koi glowing). WEATHER still | breezy (wider
// sway, streaming petals) | rainy (more and thicker rain pillars). SEASON wisteria | autumn gold | blossom.
// CAST festival (more kite-ferries, flag strings) and / or a flock of white doves. RARE (ctx.vary.rare): a
// cloud-koi leaps out of the ceiling beside the gondola on the second swing and falls back up.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/chandelier-city.js';

const TAU = Math.PI * 2, CLOUD = 600;
const PAL = ['#FBF1E1', '#F3B9A6', '#E8C7D6', '#B9B4E6', '#8E8CC9', '#FFE2A6', '#FF7A59'];
const col = (h) => new THREE.Color(h);
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const HOURS = {
  sunrise: { az: -30, el: 4, sun: '#FFB48A', sunI: 1.5, disc: '#FF7A59', fog: '#9C9AD0', haze: '#FFE2A6', lit: '#FBF1E1', warm: '#F3B9A6', shade: '#B6A8DA',
    up: 0.78, dn: 0.86, glow: 1, exposure: 1.0, sea: '#9A97D4', seaScat: '#D6C8EE', portal: '#FFE2A6', bloom: 0.5, warmBase: 0.3, pathC: '#FFD0A0', pathI: 1, poolI: 0.42, koiE: 0.3,
    upMix: ['#F3B9A6', 0.25], dnMix: ['#8E8CC9', 0.2] },
  sunset: { az: 150, el: 5, sun: '#FF9478', sunI: 1.7, disc: '#FF6A52', fog: '#D9A0B4', haze: '#FFB88A', lit: '#FFE0D0', warm: '#F8A48E', shade: '#CF9CBE',
    up: 0.78, dn: 0.84, glow: 1.3, exposure: 1.05, sea: '#B888B8', seaScat: '#FFC0B0', portal: '#FFD2A0', bloom: 0.52, warmBase: 0.62, pathC: '#FFB090', pathI: 1, poolI: 0.5, koiE: 0.35,
    upMix: ['#F8A48E', 0.6], dnMix: ['#D79AB8', 0.6] },
  // blue hour: deep blue-violet air, ceiling and sea (fog, hzn, lit, warm, shade, sea; down to a deep indigo, by the designer's leave for this look only; no sky scatter);
  // the city is lit by its own candles (the warm up / dn bounce; amb is the kit's ambient: its light rig and its ocean; the fauna keeps lit), every light a small gold point with a tight halo (glow, bloom, bloomR, bloomT);
  // the sea carries each chandelier's pool of gold, broken into long dashes laid along the swell (pool, poolI, poolBrk), under a horizon that can be told (edge); gold rain (rain, rainS, rainK)
  bluehour: { az: -30, el: 3, sun: '#8E9CFF', sunI: 0.6, disc: null, fog: '#30347C', haze: '#7A84E2', hzn: '#383E8E', amb: '#C4B0C0', lit: '#434A9E', warm: '#5458B0', shade: '#272B70',
    up: 0.45, dn: 0.55, glow: 1.25, exposure: 1.0, sea: '#3C44AA', seaScat: '#5860B8', portal: '#FFE2A6', bloom: 0.5, bloomR: 0, bloomT: 1.2, warmBase: 0.3, pathC: '#B0B8FF', pathI: 0.3, poolI: 0.7, poolBrk: 1, pool: '#FFCE7A', koiE: 1.5,
    edge: 1, scatter: 0, rain: '#FFBC58', rainS: 1.3, rainK: 0.6, upMix: ['#F6DDB8', 0.7], dnMix: ['#FFD8A0', 0.8] },
};
const SEASONS = {
  wisteria: { a: '#B9B4E6', b: '#E8C7D6', c: '#9F92DC', petals: ['#C9C0F0', '#F0D0E0', '#FBF1E1'] },
  autumn: { a: '#F2C46A', b: '#F3A86E', c: '#E8D08A', petals: ['#FFD27A', '#F6A860', '#FFE2A6'] },
  blossom: { a: '#FBE6EA', b: '#F6BFD0', c: '#FFF6F0', petals: ['#FFF4F2', '#F8C6D6', '#FFE9E0'] },
};

// ---------------------------------------------------------------- shared GLSL (same light model as the hero)
const G_COMMON = /* glsl */`
uniform float uTime, uGlow, uBreeze;
uniform vec3 uSunDir, uSunCol, uSkyUp, uSkyDn, uHaze;
float h11(float n){ return fract(sin(n*12.9898)*43758.5453); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
// sway about the ceiling pivot: a shear growing with depth below the cloud, lower parts lagging
vec3 swayP(vec3 p, float ph, float amp){
  float d = 600.0 - p.y;
  float a = amp*uBreeze;
  p.x += d*a*sin(uTime*0.262 - d*0.006 + ph);
  p.z += d*a*0.7*sin(uTime*0.217 + 1.3 - d*0.006 + ph*1.7);
  return p;
}
vec3 envCol(vec3 d){
  vec3 c = mix(uHaze, uSkyUp, smoothstep(0.0, 0.55, d.y));
  c = mix(c, uSkyDn, smoothstep(0.0, -0.45, d.y));
  float s = max(dot(d, uSunDir), 0.0);
  float s2 = s*s; float s6 = s2*s2*s2;
  c += uSunCol*(s6*0.35 + s6*s6*s6*s6*1.2);
  return c;
}
vec3 shade(vec3 alb, vec3 N, vec3 V, float metal, float gloss){
  vec3 amb = mix(uSkyDn, uSkyUp, N.y*0.5 + 0.5);
  float wrap = clamp((dot(N, uSunDir) + 0.45)/1.45, 0.0, 1.0);
  vec3 dif = alb*(amb*0.78 + uSunCol*wrap*wrap*0.5);
  vec3 R = reflect(-V, N);
  float fr = 1.0 - clamp(dot(N, V), 0.0, 1.0); fr = fr*fr*fr;
  vec3 env = envCol(R);
  vec3 c = dif*(1.0 - 0.5*metal) + env*alb*metal*0.62*gloss;
  c += env*fr*(0.06 + 0.16*gloss);
  float sp = max(dot(R, uSunDir), 0.0); sp *= sp; sp *= sp; sp *= sp; sp *= sp*sp;
  c += uSunCol*sp*gloss*(0.25 + 0.75*metal)*0.55;
  return c;
}
`;
const G_VNOISE = /* glsl */`
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;

function sharedUniforms(H, extra) {
  const U = H.uniforms;
  return { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uGlow: U.uGlow, uSunDir: U.uSunDir, uSunCol: U.uSunCol,
    uSkyUp: U.uSkyUp, uSkyDn: U.uSkyDn, uHaze: U.uHaze, uBreeze: H.breeze, ...extra };
}

// ---------------------------------------------------------------- growable attribute bag for merged meshes
function makeBag() {
  const P = [], N = [], C = [], S = [], I = [];
  const v = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3();
  return {
    P, N, C, S, I,
    // sw = [phase, amp, material kind, extra]; kinds: 0 gilt, 1 glass, 2 cream plaster, 3 cloth, 4 emissive, 5 rope
    add(geo, m, c, sw) {
      const p = geo.attributes.position, gn = geo.attributes.normal, base = P.length / 3;
      if (m) nm.getNormalMatrix(m);
      for (let i = 0; i < p.count; i++) {
        v.fromBufferAttribute(p, i); n.fromBufferAttribute(gn, i);
        if (m) { v.applyMatrix4(m); n.applyMatrix3(nm).normalize(); }
        P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z); C.push(c.r, c.g, c.b); S.push(sw[0], sw[1], sw[2], sw[3]);
      }
      if (geo.index) for (let i = 0; i < geo.index.count; i++) I.push(base + geo.index.getX(i));
      else for (let i = 0; i < p.count; i++) I.push(base + i);
      geo.dispose();
    },
    // surface of revolution about a vertical axis at (x, z); prof = [[r, y, kind, colour], ...] top to bottom
    lathe(x, z, prof, seg, ph, amp) {
      const base = P.length / 3, np = prof.length;
      for (let j = 0; j < np; j++) {
        const a = prof[Math.max(0, j - 1)], b = prof[Math.min(np - 1, j + 1)], q = prof[j];
        let nr = -(b[1] - a[1]), ny = (b[0] - a[0]); const l = Math.hypot(nr, ny) || 1; nr /= l; ny /= l;
        for (let i = 0; i <= seg; i++) {
          const t = i / seg * TAU, s = Math.sin(t), c = Math.cos(t);
          P.push(x + q[0] * s, q[1], z + q[0] * c); N.push(nr * s, ny, nr * c);
          C.push(q[3].r, q[3].g, q[3].b); S.push(ph, amp, q[2], t);
        }
      }
      for (let j = 0; j < np - 1; j++) for (let i = 0; i < seg; i++) {
        const a = base + j * (seg + 1) + i, b = a + seg + 1;
        I.push(a, b, a + 1, a + 1, b, b + 1);
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aSw', new THREE.Float32BufferAttribute(S, 4));
      g.setIndex(I);
      return g;
    },
  };
}

// one material for stems, finials, cable hardware, gondolas and kites. Vertex colours, aSw = phase, amp, kind, extra.
// defines: SWAY (apply tower sway), USE_INSTANCING comes from three for InstancedMesh.
function solidMaterial(H, defines = {}) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, defines, uniforms: sharedUniforms(H, { uNearCut: { value: 0 }, uEmis: { value: 0 }, uCloudC: H.cloudC, uPix: H.pix }),
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
${G_COMMON}
attribute vec3 color; attribute vec4 aSw;
#ifdef INST_SWAY
attribute vec2 aIs;
#endif
uniform float uPix;
varying vec3 vN, vW, vC; varying float vKind, vX;
void main(){
  vec3 p = position; vec3 n = normal;
#ifdef KOI
  {
#ifdef USE_INSTANCING
    float kp = instanceMatrix[3].x*0.05 + instanceMatrix[3].z*0.031;
#else
    float kp = 0.0;
#endif
    float tail = smoothstep(5.0, -15.0, p.z);
    p.x += sin(uTime*1.7 + p.z*0.24 + kp)*(0.35 + 1.5*tail);
  }
#endif
  if (aSw.z > 2.5 && aSw.z < 3.5) {                       // cloth: flutter, pinned where extra = 0
    p += n*sin(uTime*3.1 + p.x*1.7 + p.y*2.3 + aSw.x)*0.22*aSw.w;
  }
#ifdef USE_INSTANCING
  vec4 w = modelMatrix*instanceMatrix*vec4(p, 1.0); n = normalize(mat3(modelMatrix)*mat3(instanceMatrix)*n);
#else
  vec4 w = modelMatrix*vec4(p, 1.0);
#endif
#ifdef INST_SWAY
  w.xyz = swayP(w.xyz, aIs.x, aIs.y);
#elif defined(SWAY)
  w.xyz = swayP(w.xyz, aSw.x, aSw.y);
#endif
  if (aSw.z > 5.5) {                                      // the ridden cable: a brass line never thinner than ~2 px
    float dist = distance(w.xyz, cameraPosition);
    w.xyz += n*max(0.0, dist*uPix*1.1 - 0.04);
  } else if (aSw.z > 4.5) {                               // ropes and rods never thinner than ~1.5 px
    float dist = distance(w.xyz, cameraPosition);
    w.xyz += vec3(n.x, 0.0, n.z)*max(0.0, dist*0.0008 - 0.10);
  }
  vN = n; vW = w.xyz; vC = color; vKind = aSw.z; vX = aSw.w;
  vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${G_COMMON}
uniform float uNearCut, uEmis; uniform vec3 uCloudC;
varying vec3 vN, vW, vC; varying float vKind, vX;
void main(){
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  if (dist < uNearCut) discard;
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 c;
  if (vKind < 0.5) { float fl = 0.86 + 0.14*sin(vX*12.0); c = shade(vC*fl, N, V, 1.0, 0.9);                    // fluted gilt
    float up = smoothstep(548.0, 600.0, vW.y);                                                                  // roses and upper stems dissolve into the cloud
    float rim = 1.0 - abs(dot(N, V)); c = mix(c, uCloudC*(0.86 + 0.3*rim*rim), up*0.72); }
  else if (vKind < 1.5) { c = shade(vC, N, V, 0.35, 1.0) + envCol(reflect(-V, N))*0.35;                          // glass teardrop
    float fr = 1.0 - abs(dot(N, V)); c += uSunCol*fr*fr*0.6 + vC*0.25*uGlow; }
  else if (vKind < 2.5) c = shade(vC, N, V, 0.0, 0.25);                                                         // plaster
  else if (vKind < 3.5) { c = shade(vC, N, V, 0.0, 0.1); float bl = max(dot(-N, uSunDir), 0.0); c += vC*uSunCol*bl*0.45 + vC*0.12; } // cloth, back-lit
  else if (vKind < 4.5) c = vC*(2.6 + 1.6*uGlow)*(0.85 + 0.15*sin(uTime*7.0 + vW.x + vW.z*1.3));              // lanterns
  else if (vKind < 5.5) c = shade(vC, N, V, 0.6, 0.6);                                                          // rope
  else c = shade(vC, N, V, 1.0, 0.8) + vC*0.6;                                                                  // the brass cable we ride
  c += vC*uEmis;
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`,
  });
}

// ---------------------------------------------------------------- the cloud ceiling (the "ground" the city grows from)
function makeCeiling(H, hour, density) {
  const R = 5600, rings = 56, segs = 96, pos = [], idx = [];
  for (let j = 0; j <= rings; j++) { const r = R * Math.pow(j / rings, 1.9); for (let i = 0; i <= segs; i++) { const a = i / segs * TAU; pos.push(Math.sin(a) * r, CLOUD, Math.cos(a) * r); } }
  for (let j = 0; j < rings; j++) for (let i = 0; i < segs; i++) { const a = j * (segs + 1) + i, b = a + segs + 1; idx.push(a, a + 1, b, a + 1, b + 1, b); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx);
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, CLOUD, 0), R + 50);
  const G_H = /* glsl */`
uniform float uTime;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
${G_VNOISE}
float cloudH(vec2 p){
  vec2 q = p + vec2(uTime*1.3, uTime*0.6);
  float n = vn(q*0.0042)*0.62 + vn(q*0.0105 + 7.3)*0.38;
  float r = length(p);
  return 613.0 - 19.0*n + 9.0*smoothstep(130.0, 50.0, r);
}`;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uTime: H.uniforms.uTime, uSunDir: H.uniforms.uSunDir, uSunCol: H.uniforms.uSunCol, uLit: { value: col(hour.lit) }, uWarm: { value: col(hour.warm) },
      uShade: { value: col(hour.shade) }, uFog: { value: col(hour.fog) }, uHazeC: { value: col(hour.haze) }, uDensity: { value: density }, uKoiGlow: { value: Math.max(0, hour.koiE - 0.3)*0.5 },
      uWarmBase: { value: hour.warmBase }, uKoiCol: { value: col('#FFD9A0') }, uKoi: H.koi, uDimp: H.dimp },
    vertexShader: G_H + /* glsl */`
varying vec3 vW;
void main(){ vec3 p = position; p.y = cloudH(p.xz); vW = p; gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0); }`,
    fragmentShader: G_H + /* glsl */`
uniform vec3 uSunDir, uSunCol, uLit, uWarm, uShade, uFog, uHazeC, uKoiCol; uniform float uDensity, uWarmBase, uKoiGlow;
uniform vec4 uKoi[9]; uniform vec3 uDimp[2];
varying vec3 vW;
float fine(vec2 p){ vec2 q = p + vec2(uTime*1.3, uTime*0.6); return vn(q*0.031 + 3.1)*4.5 + vn(q*0.083)*1.6; }
void main(){
  vec3 V = vW - cameraPosition; float dist = length(V); V /= max(dist, 1e-4);
  float e = 5.0 + dist*0.012, k = clamp(1.0 - dist/2600.0, 0.0, 1.0);
  float h0 = cloudH(vW.xz) - fine(vW.xz)*k, hx = cloudH(vW.xz + vec2(e, 0.)) - fine(vW.xz + vec2(e, 0.))*k, hz = cloudH(vW.xz + vec2(0., e)) - fine(vW.xz + vec2(0., e))*k;
  vec3 N = normalize(vec3((hx - h0)*2.4, -e, (hz - h0)*2.4));
  vec2 sxz = normalize(uSunDir.xz + vec2(1e-5, 0.));
  float lit = clamp((dot(N.xz, sxz)*1.9 + 0.5), 0.0, 1.0);
  float hollow = smoothstep(596.0, 611.0, h0);
  vec3 c = mix(uShade, uLit, 0.34 + 0.66*lit);
  c = mix(c, uShade, hollow*0.3);
  float sunward = dot(V.xz/max(length(V.xz), 1e-4), sxz);
  float reach = smoothstep(150.0, 2400.0, dist);
  c = mix(c, uWarm, (uWarmBase + 0.55*smoothstep(-0.3, 1.0, sunward))*(0.25 + 0.75*reach)*(0.45 + 0.55*lit));
  float s2 = max(sunward, 0.0); s2 *= s2; s2 *= s2; s2 *= s2;
  c += uSunCol*s2*reach*0.32*lit;
  c *= 0.9;
  // the koi that swim in the cloud: ring dimples round each back and a long V wake trailing behind it
  float wk = 0.0, kg = 0.0;
  for (int i = 0; i < 9; i++) {
    vec2 r = vW.xz - uKoi[i].xy; float d2 = dot(r, r);
    if (d2 < 12100.0) {
      float d = sqrt(d2), al = dot(r, uKoi[i].zw), ac = abs(r.x*uKoi[i].w - r.y*uKoi[i].z), back = max(-al, 0.0);
      float ring = (0.5 + 0.5*sin(d*0.40 - uTime*2.2))*exp(-d*0.05)*smoothstep(5.0, 13.0, d);
      float vq = (ac - back*0.30)/(2.2 + back*0.07);
      float vee = exp(-vq*vq)*smoothstep(8.0, 20.0, back)*smoothstep(84.0, 34.0, back);
      wk += ring*0.75 + vee*0.8; kg += exp(-d2/700.0);
    }
  }
  for (int i = 0; i < 2; i++) {
    float d = distance(vW.xz, uDimp[i].xy);
    wk += uDimp[i].z*(0.5 + 0.5*sin(d*0.30 - uTime*3.0))*exp(-d*0.022);
    kg += uDimp[i].z*exp(-d*d/900.0)*0.6;
  }
  wk = clamp(wk, 0.0, 1.0);
  c = mix(c, uWarm*0.74, wk*0.62) + uLit*wk*wk*0.05;
  c += uKoiCol*kg*(0.10 + uKoiGlow);
  float f = 1.0 - exp(-uDensity*uDensity*dist*dist);
  vec3 fogC = mix(uFog, uHazeC, 0.25 + 0.6*s2);
  c = mix(c, fogC, f);
  float a = 1.0 - smoothstep(0.80, 0.985, f);
  gl_FragColor = vec4(c, a);
}`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 2; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- ring-terraces (instanced, parametric radius)
const RING_HI = [[0.72, -1.0], [1.0, -1.0, 0], [1.13, -0.8, 0], [1.0, -0.62, 0], [1.0, 0.55, 1], [1.2, 0.68, 0], [1.2, 0.82, 0], [0.86, 1.15, 2], [0, 1.52, 2],
  [-0.86, 1.15, 2], [-1.2, 0.82, 2], [-1.2, 0.68, 0], [-1.0, 0.55, 0], [-1.0, -0.62, 1], [-1.13, -0.8, 0], [-1.0, -1.0, 0], [-0.72, -1.0, 0], [0.72, -1.0, 3]];
const RING_LO = [[1.0, -1.0], [1.0, 0.6, 1], [1.2, 0.8, 0], [0, 1.5, 2], [-1.2, 0.8, 2], [-1.0, 0.6, 0], [-1.0, -1.0, 1], [1.0, -1.0, 3]];
function ringGeometry(prof, seg) {
  const P = [], N = [], UV = [], I = [];
  for (let j = 1; j < prof.length; j++) {
    const a = prof[j - 1], b = prof[j], m = b[2];
    let nr = (b[1] - a[1]), ny = -(b[0] - a[0]); const l = Math.hypot(nr, ny) || 1; nr /= l; ny /= l;
    const base = P.length / 3;
    for (let i = 0; i <= seg; i++) {
      const t = i / seg * TAU;
      P.push(t, a[0], a[1], t, b[0], b[1]); N.push(nr, ny, 0, nr, ny, 0); UV.push(m, 0, m, 1);
    }
    for (let i = 0; i < seg; i++) { const q = base + i * 2; I.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  return g;
}
function ringMaterial(H, gold) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: sharedUniforms(H, { uGold: { value: gold }, uCream: { value: col(PAL[0]) }, uRose: { value: col(PAL[1]) }, uLilac: { value: col(PAL[3]) }, uLitShare: { value: H.litShare } }),
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
${G_COMMON}
attribute vec4 aRing, aSw;
varying vec3 vN, vW; varying vec2 vUv; varying float vA, vSeed, vBays;
void main(){
  float a = position.x, s = aSw.w, r = aRing.w + position.y*s;
  vec3 w = vec3(aRing.x + r*sin(a), aRing.y + position.z*s, aRing.z + r*cos(a));
  w = swayP(w, aSw.x, aSw.y);
  vN = vec3(normal.x*sin(a), normal.y, normal.x*cos(a)); vW = w; vUv = uv; vA = a; vSeed = aSw.z;
  vBays = max(8.0, floor(aRing.w*6.2832/(1.25*s)));
  vec4 mvPosition = viewMatrix*vec4(w, 1.0); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${G_COMMON}
uniform vec3 uGold, uCream, uRose, uLilac; uniform float uLitShare;
varying vec3 vN, vW; varying vec2 vUv; varying float vA, vSeed, vBays;
void main(){
  vec3 V = normalize(cameraPosition - vW), N = normalize(vN); if (!gl_FrontFacing) N = -N;
  float m = vUv.x, v = vUv.y, bu = vA/6.2832*vBays, u = fract(bu), id = floor(bu), x = abs(u - 0.5)*2.0;
  vec3 c;
  if (m < 0.5) c = shade(uGold, N, V, 1.0, 0.9);
  else if (m < 1.5) {
    float top = 0.60 + 0.24*sqrt(max(0.0, 1.0 - (x/0.56)*(x/0.56)));
    float win = step(x, 0.56)*step(0.16, v)*step(v, top);
    float hsh = h21(vec2(id, vSeed*91.0));
    vec3 wall = mix(uCream, uRose, 0.18 + 0.2*h11(vSeed*7.0))*0.8;
    c = shade(wall, N, V, 0.0, 0.2);
    if (x > 0.84) c = shade(uGold, N, V, 1.0, 0.8);
    vec3 lit = mix(vec3(1.0, 0.62, 0.26), vec3(1.0, 0.86, 0.56), hsh)*(1.7 + 1.9*hsh)*uGlow*(0.9 + 0.1*sin(uTime*(1.0 + hsh*3.0) + hsh*40.0));
    vec3 dark = vec3(0.40, 0.38, 0.66) + envCol(reflect(-V, N))*0.25;
    c = mix(c, mix(dark, lit, step(hsh, uLitShare)), win);
  } else if (m < 2.5) {
    float st = step(0.5, fract(bu*0.5 + 0.25));
    vec3 roof = mix(mix(uRose, uLilac, step(0.6, h11(vSeed*3.0))), uCream, st*0.75)*0.8;
    c = shade(roof, N, V, 0.0, 0.3);
  } else {
    c = shade(mix(uCream, uRose, 0.4)*0.72, N, V, 0.0, 0.2);
    float lamp = smoothstep(0.34, 0.0, x)*smoothstep(0.5, 0.2, abs(v - 0.5));
    c += vec3(1.0, 0.74, 0.4)*lamp*2.6*uGlow;
  }
  // a slow band of prismatic colour over stone near the Grand Chandelier
  float prox = exp(-length(vW.xz)/650.0);
  float band = 0.5 + 0.5*sin(dot(vW, vec3(0.021, 0.034, 0.015)) - uTime*0.4); band *= band; band *= band; band *= band;
  vec3 hue = 0.5 + 0.5*cos(6.2832*(dot(vW, vec3(0.004, 0.007, 0.003)) + vec3(0.0, 0.33, 0.67)));
  c += hue*band*prox*0.3;
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`,
  });
}

// ---------------------------------------------------------------- bead / flame / pennant impostors (instanced quads)
function spriteMaterial(H) {
  return new THREE.ShaderMaterial({
    fog: true, uniforms: sharedUniforms(H, { uPix: H.pix }),
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
${G_COMMON}
uniform float uPix;
attribute vec4 aPos, aSw; attribute vec3 aCol;
varying vec2 vQ; varying vec3 vC, vW; varying float vKind, vSeed;
void main(){
  vec3 w = swayP(aPos.xyz, aSw.x, aSw.y);
  float k = aSw.z, size = aPos.w;
  if (k > 2.5) w.x += sin(uTime*2.3 + aSw.w*30.0)*0.25;
  vec4 mvPosition = viewMatrix*vec4(w, 1.0);
  float dist = -mvPosition.z;
  size = max(size, dist*uPix*(k > 1.5 && k < 2.5 ? 2.2 : 1.5));
  vec2 q = position.xy;
  if (k > 2.5) q.x += sin(uTime*4.0 + aSw.w*50.0 + q.y*1.5)*0.25*(0.5 - q.y*0.5);
  mvPosition.xy += q*size;
  vQ = position.xy; vC = aCol; vW = w; vKind = k; vSeed = aSw.w;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${G_COMMON}
varying vec2 vQ; varying vec3 vC, vW; varying float vKind, vSeed;
void main(){
  float d2 = dot(vQ, vQ); vec3 c;
  vec3 V = normalize(cameraPosition - vW);
  if (vKind < 1.5) {
    if (d2 > 1.0) discard;
    vec3 nv = vec3(vQ, sqrt(max(0.0, 1.0 - d2)));
    vec3 N = normalize((vec4(nv, 0.0)*viewMatrix).xyz);
    c = shade(vC, N, V, vKind < 0.5 ? 0.35 : 1.0, 1.0);
    if (vKind < 0.5) c += vC*0.10;
  } else if (vKind < 2.5) {
    if (d2 > 1.0) discard;
    float fl = 0.8 + 0.2*sin(uTime*(6.0 + vSeed*5.0) + vSeed*60.0);
    c = vC*(0.9 + 6.0*exp(-d2*3.5))*fl*uGlow;
  } else {
    if (abs(vQ.x) > 0.5*(vQ.y + 1.0)) discard;
    c = vC*(mix(uSkyDn, uSkyUp, 0.6)*0.9 + uSunCol*0.35);
  }
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`,
  });
}

// ---------------------------------------------------------------- hanging flora: wisteria falls and willow curtains
function strandMaterial(H, season) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: sharedUniforms(H, { uA: { value: col(season.a) }, uB: { value: col(season.b) }, uC: { value: col(season.c) }, uLean: H.lean }),
    vertexShader: /* glsl */`
#include <fog_pars_vertex>
${G_COMMON}
uniform vec2 uLean;
attribute vec4 aPos, aSw;
varying vec3 vW; varying vec2 vQ; varying float vSeed, vLen;
void main(){
  float t = -position.y, len = aPos.w, seed = aSw.z;
  vec3 a = swayP(aPos.xyz, aSw.x, aSw.y);
  float sw = t*t*len*0.085*uBreeze;
  vec3 p = a + vec3(0.0, -t*len, 0.0);
  p.x += sw*sin(uTime*0.52 + seed*6.28 - t*1.4) + uLean.x*t*t*len;
  p.z += sw*sin(uTime*0.43 + seed*9.4 - t*1.1) + uLean.y*t*t*len;
  p.x += sin(uTime*1.7 + seed*20.0 + t*9.0)*0.35*t;
  vec3 side = normalize(cross(vec3(0., 1., 0.), cameraPosition - p) + vec3(1e-4, 0., 0.));
  p += side*position.x*aSw.w*(1.0 - 0.6*t);
  vW = p; vQ = vec2(position.x, t); vSeed = seed; vLen = len;
  vec4 mvPosition = viewMatrix*vec4(p, 1.0); gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
#include <fog_pars_fragment>
${G_COMMON}
${G_VNOISE}
uniform vec3 uA, uB, uC;
varying vec3 vW; varying vec2 vQ; varying float vSeed, vLen;
void main(){
  vec2 p = vec2(vQ.x*5.0 + vSeed*37.0, vQ.y*vLen*0.55 + vSeed*11.0);
  float n = vn(p)*0.65 + vn(p*2.7)*0.35;
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  float nearK = smoothstep(18.0, 5.0, dist);                // at the lens a fall opens into lace and lets the view through, never a flat cut-out
  n = mix(n, n*0.72 + vn(p*6.3 + 2.1)*0.28, nearK);
  if (n < 0.30 + abs(vQ.x)*0.95 + vQ.y*0.12 + nearK*0.42) discard;
  vec3 alb = mix(mix(uA, uB, smoothstep(0.2, 0.9, vQ.y + (vn(p*0.6) - 0.5)*0.6)), uC, step(0.7, h11(vSeed*5.0))*0.6)*(0.62 + 0.38*n);
  vec3 N = normalize(vec3(V.x, 0.25, V.z));
  vec3 c = shade(alb, N, V, 0.0, 0.1);
  float back = max(dot(-V, uSunDir), 0.0);
  c += alb*uSunCol*(0.18 + 0.5*back*back);
  gl_FragColor = vec4(c, 1.0);
  #include <fog_fragment>
}`,
  });
}

// ---------------------------------------------------------------- rising rain: gold streaks climbing from sea to cloud
function makeRain(H, rng, pillars, perPillar, hour, density) {
  const n = pillars.length * perPillar, aPos = new Float32Array(n * 4), aSeed = new Float32Array(n * 2);
  let k = 0;
  for (const p of pillars) for (let i = 0; i < perPillar; i++, k++) {
    const a = rng() * TAU, r = Math.sqrt(rng()) * p.r;
    aPos.set([p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, rng(), rng.range(7, 18)], k * 4); aSeed.set([rng.range(0.75, 1.35), rng()], k * 2);
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 4)); geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 2));
  geo.instanceCount = n;
  const rainCol = hour.rain ? col(hour.rain) : col(hour.haze).lerp(col('#FFC36B'), 0.45);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uTime: H.uniforms.uTime, uPix: H.pix, uCol: { value: hour.rainS ? rainCol.clone().multiplyScalar(hour.rainS) : rainCol }, uDensity: { value: density }, uGlow: H.uniforms.uGlow },
    vertexShader: /* glsl */`
uniform float uTime, uPix, uDensity;
attribute vec4 aPos; attribute vec2 aSeed;
varying vec2 vQ; varying float vA;
void main(){
  float y = fract(aPos.z + uTime*9.0*aSeed.x/600.0)*600.0;
  vec3 p = vec3(aPos.x, y, aPos.y);
  float dist = distance(p, cameraPosition);
  vec3 side = normalize(cross(vec3(0., 1., 0.), cameraPosition - p) + vec3(1e-4, 0., 0.));
  float w = max(0.07, dist*uPix*1.1);
  p += side*position.x*w; p.y += position.y*aPos.w*0.5;
  vQ = position.xy;
  float f = exp(-uDensity*uDensity*dist*dist);
  vA = f*smoothstep(1.5, 9.0, dist)*smoothstep(0.0, 30.0, y)*smoothstep(606.0, 575.0, y)*(0.45 + 0.55*aSeed.y)*min(1.0, 0.07/max(dist*uPix*1.1, 1e-4) + 0.25);
  gl_Position = projectionMatrix*viewMatrix*vec4(p, 1.0);
}`,
    fragmentShader: /* glsl */`
uniform vec3 uCol; uniform float uGlow;
varying vec2 vQ; varying float vA;
void main(){ float a = (1.0 - vQ.x*vQ.x)*(1.0 - vQ.y*vQ.y)*vA; gl_FragColor = vec4(uCol*a*(1.5 + 0.5*uGlow), 1.0); }`,
  });
  const streaks = new THREE.Mesh(geo, mat); streaks.frustumCulled = false; streaks.renderOrder = 4;

  // the soft gold column each shaft stands in, with a mist ring on the sea
  const P = [], N = [], I = [], seg = 28;
  for (const p of pillars) {
    const base = P.length / 3;
    for (let j = 0; j <= 1; j++) for (let i = 0; i <= seg; i++) {
      const a = i / seg * TAU; P.push(p.x + Math.sin(a) * p.r, j * 612, p.z + Math.cos(a) * p.r); N.push(Math.sin(a), 0, Math.cos(a));
    }
    for (let i = 0; i < seg; i++) { const a = base + i, b = a + seg + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
    const b2 = P.length / 3;
    for (let i = 0; i <= seg; i++) { const a = i / seg * TAU; P.push(p.x, 3, p.z, p.x + Math.sin(a) * p.r * 2.2, 3, p.z + Math.cos(a) * p.r * 2.2); N.push(0, 1, 0, 0, 0.999, 0); }
    for (let i = 0; i < seg; i++) { const a = b2 + i * 2; I.push(a, a + 1, a + 3); }
  }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); cg.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); cg.setIndex(I);
  const cm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: H.uniforms.uTime, uCol: { value: hour.rainK ? rainCol.clone().multiplyScalar(hour.rainK) : rainCol }, uDensity: { value: density } },
    vertexShader: /* glsl */`varying vec3 vN, vW; void main(){ vN = normal; vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
uniform float uTime, uDensity; uniform vec3 uCol; varying vec3 vN, vW;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
${G_VNOISE}
void main(){
  vec3 V = cameraPosition - vW; float dist = length(V); V /= max(dist, 1e-4);
  float f = exp(-uDensity*uDensity*dist*dist), a;
  if (vN.y > 0.5) { float e = (1.0 - vN.y)*1000.0; a = e*(1.0 - e)*4.0*(0.35 + 0.65*vn(vW.xz*0.06 + uTime*0.15))*0.22; }
  else {
    float nv = abs(dot(normalize(vN), V));
    float st = vn(vec2(atan(vN.x, vN.z)*9.0, vW.y*0.012 - uTime*0.22));
    a = nv*nv*(0.05 + 0.10*st)*smoothstep(0.0, 60.0, vW.y)*smoothstep(612.0, 560.0, vW.y)*smoothstep(4.0, 40.0, dist);
  }
  gl_FragColor = vec4(uCol*a*f, 1.0);
}`,
  });
  const cols = new THREE.Mesh(cg, cm); cols.frustumCulled = false; cols.renderOrder = 3;
  return { streaks, cols };
}

// ---------------------------------------------------------------- city layout
function layoutTowers(rng, path, pillars, density, fixed) {
  const towers = fixed.slice();
  const ok = (x, z, R) => {
    const r0 = Math.hypot(x, z); if (r0 < 335 + R || r0 > 1750) return false;
    if (Math.abs(x) < 70 + R && z > 0 && z < 520) return false;                       // keep the approach lane open
    if (path.nearestXZ(x, z).dist < R + 24) return false;
    for (const p of pillars) if (Math.hypot(x - p.x, z - p.z) < R + p.r + 14) return false;
    for (const t of towers) if (Math.hypot(x - t.x, z - t.z) < R + t.R + 55) return false;
    return true;
  };
  const make = (x, z, R, near) => {
    const tiers = rng.int(3, 6), len = near ? rng.range(215, 330) : rng.range(110, 400), top = CLOUD - rng.range(38, 90);
    return { x, z, R, tiers, len, top, near, ph: rng.range(0, TAU), amp: rng.range(0.011, 0.018), seed: rng(), widest: rng.int(0, 1) };
  };
  // towers that line the route
  for (let tries = 0, got = 0; tries < 400 && got < Math.round(13 * density); tries++) {
    const p = path.pointAt(rng.range(0.03, 0.8)), a = rng() * TAU, d = rng.range(45, 190), R = rng.range(15, 30);
    const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
    if (ok(x, z, R)) { towers.push(make(x, z, R, true)); got++; }
  }
  // districts: clusters of three to seven
  const want = Math.round(66 * density);
  for (let c = 0; c < 60 && towers.length < want; c++) {
    const a = rng() * TAU, r = 380 + Math.sqrt(rng()) * 1250, cx = Math.sin(a) * r, cz = Math.cos(a) * r, m = rng.int(3, 7);
    for (let i = 0, tries = 0; i < m && tries < 30 && towers.length < want; tries++) {
      const b = rng() * TAU, d = rng.range(60, 230), R = rng.range(15, 45), x = cx + Math.cos(b) * d, z = cz + Math.sin(b) * d;
      if (ok(x, z, R)) { towers.push(make(x, z, R, false)); i++; }
    }
  }
  for (const t of towers) {
    t.pd = path.nearestXZ(t.x, t.z).dist; t.hi = t.pd < 200; t.far = t.pd > 600; t.rings = [];
    t.cell = Math.floor((t.x + 3600) / 900) + '_' + Math.floor((t.z + 3600) / 900);
    const bottom = CLOUD - t.len, fin = Math.min(20, 8 + t.R * 0.3), span = (bottom + fin + 14) - t.top;
    for (let k = 0; k < t.tiers; k++) {
      const f = t.tiers > 1 ? k / (t.tiers - 1) : 0, w = t.widest === 0 ? 1 - 0.58 * f : (k === 0 ? 0.7 : 1 - 0.6 * (f - 1 / (t.tiers - 1)));
      const R = Math.max(9, t.R * w);
      t.rings.push({ y: t.top + span * f, R, s: Math.min(3.3, Math.max(1.9, R * 0.1)) });
    }
    if (t.ringAt) { const k = t.ringAt.k; const dy = t.ringAt.y - t.rings[k].y; for (const r of t.rings) r.y += dy; t.top += dy; t.len -= dy; }
    t.bottom = CLOUD - t.len; t.fin = fin;
  }
  return towers;
}

function catenary(a, b, sag, n, out = []) {
  for (let i = 0; i <= n; i++) { const t = i / n; out.push(new THREE.Vector3().lerpVectors(a, b, t).setY(a.y + (b.y - a.y) * t - 4 * sag * t * (1 - t))); }
  return out;
}

// builds every tower: one merged trunk mesh, two instanced ring meshes, instanced arms, impostor beads and flames, strands
async function buildCity(H, rng, towers, path, season, opts) {
  const gold = H.gold, goldC = gold.clone(), cream = col(PAL[0]).multiplyScalar(0.85), pearl = col('#F6EDE6'), flame = col('#FFC878');
  const finCols = [col(PAL[1]), col(PAL[3]), col(PAL[5]), col(PAL[2])];
  const group = new THREE.Group(), arms = [];
  // towers are bucketed by 900 m cell so that each cell's meshes can be frustum-culled
  const buckets = new Map();
  const bucket = (key) => { let b = buckets.get(key); if (!b) { b = { trunk: makeBag(), rHi: [], rLo: [], sHi: [], sLo: [], sp: [], spS: [], spC: [], st: [], stS: [], towers: [] }; buckets.set(key, b); } return b; };
  let cur = null;
  const m4 = new THREE.Matrix4(), box = () => new THREE.BoxGeometry(1, 1, 1);
  const bead = (p, size, c, kind, t) => { cur.sp.push(p.x, p.y, p.z, size); cur.spS.push(t.ph, t.amp, kind, rng()); cur.spC.push(c.r, c.g, c.b); };
  const A = new THREE.Vector3(), B = new THREE.Vector3();
  let ti = 0;
  for (const t of towers) {
    if ((ti++ & 3) === 0) await opts.pause();
    cur = bucket(t.cell); cur.towers.push(t);
    const { trunk, rHi, rLo, sHi, sLo, st, stS } = cur;
    const stR = 1.1 + t.R * 0.035, rr = 7 + t.R * 0.32, prof = [[rr, 607, 0, goldC], [rr * 0.92, 600.5, 0, goldC], [rr * 0.5, 597, 0, goldC], [rr * 0.22, 591, 0, goldC], [stR, 583, 0, goldC]];
    for (const r of t.rings) prof.push([stR, r.y + 6, 0, goldC], [stR * 2.3, r.y + 3.2, 0, goldC], [stR * 1.25, r.y + 0.5, 0, goldC], [stR * 2.0, r.y - 2.2, 0, goldC], [stR, r.y - 5, 0, goldC]);
    const y0 = t.bottom + t.fin, fc = rng.pick(finCols), fl = t.fin;
    prof.push([stR, y0 + 6, 0, goldC], [stR * 2.4, y0 + 3, 0, goldC], [stR * 0.8, y0 + 0.6, 0, goldC],
      [0.5, y0, 1, fc], [fl * 0.15, y0 - fl * 0.3, 1, fc], [fl * 0.2, y0 - fl * 0.55, 1, fc], [fl * 0.13, y0 - fl * 0.8, 1, fc], [0.02, y0 - fl, 1, fc]);
    trunk.lathe(t.x, t.z, prof, t.hi ? 8 : t.far ? 5 : 6, t.ph, t.amp);
    t.rings.forEach((r, k) => {
      (t.hi ? rHi : rLo).push(t.x, r.y, t.z, r.R); (t.hi ? sHi : sLo).push(t.ph, t.amp, t.seed + k * 0.13, r.s);
      const a0 = rng() * TAU, nSp = t.hi ? 6 : t.far ? 3 : 4, inner = r.R - r.s;
      for (let i = 0; i < nSp; i++) {
        const a = a0 + i / nSp * TAU;
        m4.makeRotationY(a).multiply(new THREE.Matrix4().makeTranslation(0, 0, inner / 2)).multiply(new THREE.Matrix4().makeScale(0.5, 0.7, inner)); m4.setPosition(t.x + Math.sin(a) * inner / 2, r.y + 0.4 * r.s, t.z + Math.cos(a) * inner / 2);
        trunk.add(box(), m4, goldC, [t.ph, t.amp, 0, 0]);
        // gold bead chain from the knop above down to the ring
        A.set(t.x, r.y + Math.min(26, r.R * 0.6) + 6, t.z); B.set(t.x + Math.sin(a) * inner, r.y + 1.2 * r.s, t.z + Math.cos(a) * inner);
        const step = t.hi ? 3.0 : t.far ? 8.5 : 6.0, nb = Math.max(3, Math.round(A.distanceTo(B) / step));
        for (let j = 1; j < nb; j++) bead(new THREE.Vector3().lerpVectors(A, B, j / nb), t.hi ? 0.66 : t.far ? 1.4 : 1.15, goldC, 1, t);
      }
      // candle cups round the rim (real S-arms only on rings close to the route)
      const withArms = t.pd < 150 && path.distanceTo(t.x, r.y, t.z) - r.R < 78;
      const nc = Math.max(6, Math.round(r.R * TAU / (t.hi ? 8 : t.far ? 17 : 13))), rc = r.R + 2.6 * r.s;
      for (let i = 0; i < nc; i++) {
        const a = a0 + (i + 0.5) / nc * TAU;
        const fr = withArms ? r.R + 3.99 * r.s : rc, fy = withArms ? r.y + 2.05 * r.s : r.y + 0.75 * r.s;
        bead(A.set(t.x + Math.sin(a) * fr, fy, t.z + Math.cos(a) * fr), withArms ? 0.3 * r.s : t.hi ? 0.75 : t.far ? 1.35 : 1.15, flame, 2, t);
        if (withArms) arms.push(t.x + Math.sin(a) * (r.R + r.s), r.y - 0.5 * r.s, t.z + Math.cos(a) * (r.R + r.s), a, r.s, t.ph, t.amp);
      }
      // pearl swags to the next tier
      if (k + 1 < t.rings.length) {
        const q = t.rings[k + 1], ns = t.hi ? 6 : t.far ? 3 : 4, tw = rng.range(0.25, 0.6);
        for (let i = 0; i < ns; i++) {
          const a = a0 + i / ns * TAU;
          A.set(t.x + Math.sin(a) * (r.R + r.s), r.y - r.s, t.z + Math.cos(a) * (r.R + r.s)); B.set(t.x + Math.sin(a + tw) * (q.R + q.s), q.y + 0.6 * q.s, t.z + Math.cos(a + tw) * (q.R + q.s));
          const d = A.distanceTo(B), nb = Math.max(4, Math.round(d / (t.hi ? 2.5 : t.far ? 8.0 : 6.0)));
          catenary(A, B, d * 0.16, nb).forEach((p, j) => { if (j > 0 && j < nb) bead(p, (t.hi ? 0.74 : t.far ? 1.5 : 1.25) * (j % 5 === 2 ? 1.5 : 1), j % 5 === 2 ? goldC : pearl, j % 5 === 2 ? 1 : 0, t); });
        }
      }
      // wisteria falls
      const nw = t.hi ? Math.round(r.R * 0.55 * opts.lush) : t.far ? 3 : 4;
      for (let i = 0; i < nw; i++) {
        const a = rng() * TAU, rw = r.R + (rng.chance(0.75) ? 0.9 : -0.9) * r.s, len = t.hi ? rng.range(16, 44) : rng.range(22, 50);
        st.push(t.x + Math.sin(a) * rw, r.y - 0.9 * r.s, t.z + Math.cos(a) * rw, len); stS.push(t.ph, t.amp, rng(), rng.range(4.5, 8.5) * (t.hi ? 1 : 1.5));
      }
    });
  }
  await opts.pause();
  // willows rooted in the cloud floor
  cur = bucket('misc'); const { st, stS } = cur;
  for (let i = 0, tries = 0; i < Math.round(46 * opts.lush) && tries < 600; tries++) {
    const p = path.pointAt(rng.range(0, 1)), a = rng() * TAU, d = rng.range(45, 520), x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
    if (Math.hypot(x, z) < 300 || path.nearestXZ(x, z).dist < 42) continue;
    let bad = false; for (const t of towers) if (Math.hypot(x - t.x, z - t.z) < t.R * 0.4 + 16) { bad = true; break; }
    if (bad) continue;
    i++; const n = rng.int(9, 14), rw = rng.range(5, 11), ph = rng.range(0, TAU);
    for (let j = 0; j < n; j++) { const b = j / n * TAU + rng.range(-0.2, 0.2), rr = rw * rng.range(0.3, 1); st.push(x + Math.cos(b) * rr, 606, z + Math.sin(b) * rr, rng.range(30, 52)); stS.push(ph, 0, rng(), rng.range(6, 10)); }
  }
  await opts.pause();
  // festival flag strings between neighbouring towers
  if (opts.flags) {
    const fc = [col(PAL[6]), col(PAL[5]), col(PAL[3]), col(PAL[0]), col(PAL[1])];
    const near = towers.filter((t) => t.pd < 420);
    for (let i = 0; i < near.length; i++) for (let j = i + 1; j < near.length; j++) {
      const a = near[i], b = near[j], d = Math.hypot(a.x - b.x, a.z - b.z); if (d > 230) continue;
      const ra = a.rings[Math.min(1, a.rings.length - 1)], rb = b.rings[Math.min(1, b.rings.length - 1)], ux = (b.x - a.x) / d, uz = (b.z - a.z) / d;
      A.set(a.x + ux * ra.R, ra.y + ra.s, a.z + uz * ra.R); B.set(b.x - ux * rb.R, rb.y + rb.s, b.z - uz * rb.R);
      const L = A.distanceTo(B), nb = Math.round(L / 3.2), pts = catenary(A, B, L * 0.1, nb);
      let hit = false; for (const p of pts) if (path.distanceTo(p.x, p.y, p.z) < 12) { hit = true; break; }
      if (hit) continue;
      pts.forEach((p, k) => { if (k > 0 && k < nb) { cur.sp.push(p.x, p.y - 1.1, p.z, 1.1); cur.spS.push((a.ph + b.ph) / 2, 0.006, 3, rng()); const c = fc[k % fc.length]; cur.spC.push(c.r, c.g, c.b); } });
    }
  }

  await opts.pause();
  // ---- meshes: one set per cell, sharing four materials
  const solidM = solidMaterial(H, { SWAY: 1 }), rm = ringMaterial(H, gold), spM = spriteMaterial(H), stM = strandMaterial(H, season);
  const gHi = ringGeometry(RING_HI, 20), gLo = ringGeometry(RING_LO, 14);
  const sP = [], sI = [], SEG = 4;
  for (let j = 0; j <= SEG; j++) sP.push(-0.5, -j / SEG, 0, 0.5, -j / SEG, 0);
  for (let j = 0; j < SEG; j++) { const a = j * 2; sI.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const counts = { rings: 0, ringsHi: 0, sprites: 0, strands: 0, arms: arms.length / 7, cells: buckets.size };
  for (const [key, b] of buckets) {
    await opts.pause();
    // bounding sphere of the cell: its towers with their rings, sway, swags and falls (y 180..615)
    let sphere = null;
    if (key !== 'misc' && b.towers.length) {
      let cx = 0, cz = 0; for (const t of b.towers) { cx += t.x; cz += t.z; } cx /= b.towers.length; cz /= b.towers.length;
      let rh = 0; for (const t of b.towers) rh = Math.max(rh, Math.hypot(t.x - cx, t.z - cz) + t.R + 75);
      sphere = new THREE.Sphere(new THREE.Vector3(cx, 398, cz), Math.hypot(rh, 222));
    }
    const put = (m) => { if (sphere) { m.geometry.boundingSphere = sphere.clone(); m.frustumCulled = true; } else m.frustumCulled = false; group.add(m); return m; };
    if (b.trunk.P.length) put(new THREE.Mesh(b.trunk.build(), solidM));
    const ringMesh = (src, R, S) => {
      const g = new THREE.InstancedBufferGeometry().copy(src);
      g.setAttribute('aRing', new THREE.InstancedBufferAttribute(new Float32Array(R), 4)); g.setAttribute('aSw', new THREE.InstancedBufferAttribute(new Float32Array(S), 4));
      g.instanceCount = R.length / 4; put(new THREE.Mesh(g, rm));
    };
    if (b.rHi.length) ringMesh(gHi, b.rHi, b.sHi);
    if (b.rLo.length) ringMesh(gLo, b.rLo, b.sLo);
    if (b.sp.length) {
      const sg = new THREE.InstancedBufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); sg.setIndex([0, 1, 2, 0, 2, 3]);
      sg.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(b.sp), 4)); sg.setAttribute('aSw', new THREE.InstancedBufferAttribute(new Float32Array(b.spS), 4));
      sg.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(b.spC), 3)); sg.instanceCount = b.sp.length / 4;
      put(new THREE.Mesh(sg, spM));
    }
    if (b.st.length) {
      const tg = new THREE.InstancedBufferGeometry(); tg.setAttribute('position', new THREE.Float32BufferAttribute(sP, 3)); tg.setIndex(sI);
      tg.setAttribute('aPos', new THREE.InstancedBufferAttribute(new Float32Array(b.st), 4)); tg.setAttribute('aSw', new THREE.InstancedBufferAttribute(new Float32Array(b.stS), 4)); tg.instanceCount = b.st.length / 4;
      put(new THREE.Mesh(tg, stM));
    }
    counts.rings += (b.rHi.length + b.rLo.length) / 4; counts.ringsHi += b.rHi.length / 4; counts.sprites += b.sp.length / 4; counts.strands += b.st.length / 4;
  }
  gHi.dispose(); gLo.dispose();
  return { group, arms, counts };
}

// ---------------------------------------------------------------- small geometries
function armGeometry() {                                   // S-curved brass arm with a candle cup; origin at the ring, +Z outward
  const bag = makeBag(), g = col('#D9A04A'), c = col('#F8ECD8'), lip = col(PAL[1]).lerp(col(PAL[0]), 0.35);
  const pts = [[0, 0, 0], [0, -0.75, 0.8], [0, -0.55, 1.75], [0, 0.35, 2.3], [0, 0.95, 2.6]].map((p) => new THREE.Vector3(...p));
  bag.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 5, 0.12, 3, false), null, g, [0, 0, 0, 0]);
  // the cup: a gold foot, a cream tulip bowl, a gold band and a flared, scalloped rose lip (the flame is an impostor inside it)
  const base = bag.P.length / 3, seg = 6;
  bag.lathe(0, 2.6, [[0.1, 0.9, 0, g], [0.4, 1.02, 0, g], [0.5, 1.4, 2, c], [0.68, 1.88, 2, c], [0.72, 2.0, 0, g], [0.9, 2.3, 2, lip]], seg, 0, 0);
  const row = base + 5 * (seg + 1);
  for (let i = 0; i <= seg; i++) { const k = (row + i) * 3, even = i % 2 === 0; bag.P[k + 1] += even ? 0.1 : -0.14; if (!even) { bag.P[k] *= 0.9; bag.P[k + 2] = 2.6 + (bag.P[k + 2] - 2.6) * 0.9; } }
  return bag.build();
}
function bellProfile(y0, g, c) {
  return [[0.05, y0, 0, g], [0.5, y0 - 0.15, 0, g], [0.75, y0 - 0.6, 0, g], [1.3, y0 - 1.1, 0, g], [1.85, y0 - 2.0, 0, g], [2.05, y0 - 2.5, 2, c], [2.15, y0 - 3.3, 2, c],
    [2.2, y0 - 3.5, 0, g], [2.45, y0 - 4.3, 0, g], [2.75, y0 - 4.8, 0, g], [2.6, y0 - 4.9, 0, g]];
}
function gondolaGeometry(rope) {                           // bell cabin; origin at the pivot (rope > 0) or at the cable grip
  const bag = makeBag(), g = col('#E2A94C'), c = col('#F7E4C4'), lamp = col('#FFC878'), rc = col('#CDBBD8');
  const top = rope > 0 ? -rope : -1.9;
  bag.lathe(0, 0, bellProfile(top, g, c), 12, 0, 0);
  bag.add(new THREE.SphereGeometry(0.42, 6, 5), new THREE.Matrix4().makeTranslation(0, top - 5.0, 0), lamp, [0, 0, 4, 0]);
  bag.add(new THREE.TorusGeometry(2.1, 0.09, 4, 12).rotateX(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, top - 2.9, 0), lamp, [0, 0, 4, 0]);
  if (rope > 0) bag.add(new THREE.CylinderGeometry(0.07, 0.07, rope, 5, 1, true), new THREE.Matrix4().makeTranslation(0, -rope / 2, 0), rc, [0, 0, 5, 0]);
  else {
    bag.add(new THREE.CylinderGeometry(0.07, 0.07, 1.9, 5, 1, true), new THREE.Matrix4().makeTranslation(0, -0.95, 0), g, [0, 0, 0, 0]);
    bag.add(new THREE.TorusGeometry(0.34, 0.1, 5, 10).rotateY(Math.PI / 2), new THREE.Matrix4().makeTranslation(0, 0.34, 0), g, [0, 0, 0, 0]);
  }
  return bag.build();
}
function kiteGeometry() {                                  // a kite-ferry: paper sail, slim hull, lantern string; nose toward -Z
  const bag = makeBag(), M = (x, y, z, sx = 1, sy = sx, sz = sx, rx = 0) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, 0)), new THREE.Vector3(sx, sy, sz));
  const hull = col('#E9C9A0'), g = col('#D9A04A'), lamp = col('#FFC070'), rc = col('#CDBBD8');
  bag.add(new THREE.SphereGeometry(1, 8, 4, 0, TAU, Math.PI / 2, Math.PI / 2), M(0, 0, 0, 1.5, 1.3, 5.2), hull, [0, 0, 2, 0]);
  bag.add(new THREE.TorusGeometry(1, 0.07, 4, 12).rotateX(Math.PI / 2), M(0, 0, 0, 1.5, 1, 5.2), g, [0, 0, 0, 0]);
  // the sail: a diamond in four coloured panels, leaning back
  const cs = [col(PAL[6]).lerp(col(PAL[1]), 0.5), col(PAL[0]), col(PAL[3]), col(PAL[5])], T = new THREE.Matrix4().compose(new THREE.Vector3(0, 11, 1.5), new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.5, 0, 0)), new THREE.Vector3(1, 1, 1));
  const corners = [[0, 7.5], [5.2, 1.5], [0, -6.5], [-5.2, 1.5]];
  for (let i = 0; i < 4; i++) {
    const a = corners[i], b = corners[(i + 1) % 4], tri = new THREE.BufferGeometry();
    tri.setAttribute('position', new THREE.Float32BufferAttribute([0, 1.5, 0.6, a[0], a[1], 0, b[0], b[1], 0], 3)); tri.computeVertexNormals();
    bag.add(tri, T, cs[i], [i * 1.3, 0, 3, 0.6]);
  }
  for (let i = 0; i < 7; i++) {                             // tail of bows
    bag.add(new THREE.PlaneGeometry(1.5, 0.9), M(0, 6.2 - i * 1.25, 6.4 + i * 1.5, 1, 1, 1, -0.5), cs[i % 4], [i * 2.1, 0, 3, 1.5 + i * 0.5]);
  }
  for (const [x, z] of [[0, -4.4], [0, 4.4], [-1.5, 0], [1.5, 0]]) {
    const A = new THREE.Vector3(x, 0.2, z), B = new THREE.Vector3(x * 2.2, 8.5, 1.5 + z * 0.5), d = B.clone().sub(A), L = d.length();
    const m = new THREE.Matrix4().compose(A.clone().add(B).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, L, 1));
    bag.add(new THREE.CylinderGeometry(0.03, 0.03, 1, 4, 1, true), m, rc, [0, 0, 5, 0]);
  }
  for (let i = 0; i < 5; i++) bag.add(new THREE.SphereGeometry(0.42, 6, 5), M((i % 2 ? 1 : -1) * 1.7, -0.9 - 0.25 * Math.sin(i * 2.1), -3.6 + i * 1.8), lamp, [0, 0, 4, 0]);
  return bag.build();
}

function koiGeometry(rng) {                                 // a 22 m golden cloud-koi with coral patches; nose toward +Z
  const bag = makeBag(), gold = col('#FFE2A6'), coral = col('#FF7A59'), white = col('#FFF6EA'), fin = col('#FFD0A0');
  const body = new THREE.SphereGeometry(1, 14, 10), p = body.attributes.position, cols = [];
  for (let i = 0; i < p.count; i++) {
    const z = p.getZ(i), w = z > 0 ? Math.sqrt(Math.max(0, 1 - z * z * 0.55)) : 0.25 + 0.75 * Math.pow(1 + z, 0.8) * (1 - 0.2 * z * z);
    const k = z > 0 ? 1 : w;
    p.setXYZ(i, p.getX(i) * 2.3 * k, p.getY(i) * 3.0 * k, z * 10.5);
    const n = Math.sin(z * 7.3 + p.getX(i) * 1.9 + rng.range(-0.4, 0.4)) + Math.sin(z * 3.1 - p.getY(i) * 1.3);
    const c = n > 0.75 ? coral : n < -1.1 ? white : gold; cols.push(c.r, c.g, c.b);
  }
  body.computeVertexNormals();
  const base = bag.P.length / 3; bag.add(body, null, gold, [0, 0, 2, 0]);
  for (let i = 0; i < cols.length; i++) bag.C[base * 3 + i] = cols[i];
  const tri = (a, b, c2, c, w) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c2], 3)); g.computeVertexNormals(); bag.add(g, null, c, [rng() * 6, 0, 3, w]); };
  tri([0, 0, -9.5], [0, 5.5, -16], [0, 0, -13], coral, 2.5); tri([0, 0, -9.5], [0, 0, -13], [0, -5.5, -16], fin, 2.5);       // tail
  tri([0, 2.6, 3], [0, 5.6, -2], [0, 2.2, -5], coral, 1.2);                                                                   // dorsal
  for (const sx of [-1, 1]) { tri([sx * 2, -1, 4], [sx * 6.5, -2.5, 0], [sx * 2, -1.4, 0.5], fin, 1.5); tri([sx * 1.4, -2, -3], [sx * 4, -4, -6], [sx * 1.2, -2, -5.5], fin, 1.2); }
  return bag.build();
}

// the camera's cable, the return cable beside it and the three hanging stations
function buildRig(H, path, stations, rightSide) {
  const g = col('#D9A04A'), rc = col('#C4B0D2'), cream = col('#F4E6D2'), lamp = col('#FFC878');
  const up = new THREE.Vector3(0, 1, 0), p = new THREE.Vector3(), t = new THREE.Vector3(), r = new THREE.Vector3();
  const tube = (pts, rad, c, kind = 5) => {
    const P = [], N = [], C = [], S = [], I = [], K = 5;
    for (let i = 0; i < pts.length; i++) {
      t.subVectors(pts[Math.min(pts.length - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize(); r.crossVectors(t, up).normalize(); const u2 = new THREE.Vector3().crossVectors(r, t);
      for (let k = 0; k < K; k++) { const a = k / K * TAU, nx = r.x * Math.cos(a) + u2.x * Math.sin(a), ny = r.y * Math.cos(a) + u2.y * Math.sin(a), nz = r.z * Math.cos(a) + u2.z * Math.sin(a);
        P.push(pts[i].x + nx * rad, pts[i].y + ny * rad, pts[i].z + nz * rad); N.push(nx, ny, nz); C.push(c.r, c.g, c.b); S.push(0, 0, kind, 0); }
    }
    for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < K; k++) { const a = i * K + k, b = i * K + (k + 1) % K; I.push(a, b, a + K, b, b + K, a + K); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('aSw', new THREE.Float32BufferAttribute(S, 4)); geo.setIndex(I); return geo;
  };
  // our cable: 1.636 m above the eye line, from behind the entry to the portal's crown
  const own = [];
  for (let i = 0; i <= 460; i++) { path.posAtDist(-90 + (path.length + 90) * i / 460, p); own.push(new THREE.Vector3(p.x, p.y + 1.636, p.z)); }
  const cableMat = solidMaterial(H); cableMat.uniforms.uNearCut.value = 5.5;
  // brass, faintly self-lit, never thinner than 2 px, with a clamp and a small lantern every 25 m
  const brass = col('#E0A850'), cb = makeBag();
  cb.add(tube(own, 0.04, brass, 6), null, brass, [0, 0, 6, 0]);
  for (let d = 14; d < path.length - 18; d += 25) {
    path.posAtDist(d, p);
    cb.add(new THREE.CylinderGeometry(0.1, 0.1, 0.34, 5, 1), new THREE.Matrix4().makeTranslation(p.x, p.y + 1.636 - 0.13, p.z), g, [0, 0, 0, 0]);
    cb.add(new THREE.SphereGeometry(0.24, 6, 4), new THREE.Matrix4().makeTranslation(p.x, p.y + 1.636 - 0.52, p.z), lamp, [0, 0, 4, 0]);
  }
  const cable = new THREE.Mesh(cb.build(), cableMat); cable.frustumCulled = false;
  const retMat = solidMaterial(H);
  // return cable: spans between the stations' outer sheaves
  const ends = stations.map((s) => new THREE.Vector3(s.pos.x + s.right.x * rightSide, s.pos.y + 1.636, s.pos.z + s.right.z * rightSide));
  const spans = [];
  for (let i = 0; i + 1 < ends.length; i++) spans.push(catenary(ends[i], ends[i + 1], 25, 40));
  const bag = makeBag(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), bells = [];
  const rod = (a, b, w, c, kind) => { const d = b.clone().sub(a), L = d.length(); M.compose(a.clone().add(b).multiplyScalar(0.5), Q.setFromUnitVectors(up, d.normalize()), new THREE.Vector3(1, L, 1)); bag.add(new THREE.CylinderGeometry(w, w, 1, 5, 1, true), M, c, [0, 0, kind, 0]); };
  for (const s of stations) {
    const o = s.pos, R = s.right, at = (k, y) => new THREE.Vector3(o.x + R.x * k, o.y + y, o.z + R.z * k);
    rod(at(-3.5, 7.0), at(rightSide + 3.5, 7.0), 0.28, g, 0);
    for (const k of [0, rightSide]) {
      rod(at(k, 7.0), at(k, 2.5), 0.07, g, 0);
      M.compose(at(k, 2.05), Q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), R), new THREE.Vector3(1, 1, 1)); bag.add(new THREE.TorusGeometry(0.4, 0.09, 5, 12), M, g, [0, 0, 0, 0]);
    }
    const apex = at(rightSide / 2, 30);
    rod(at(-3.5, 7.0), apex, 0.08, rc, 5); rod(at(rightSide + 3.5, 7.0), apex, 0.08, rc, 5); rod(apex, new THREE.Vector3(apex.x, 608, apex.z), 0.1, rc, 5);
    bag.lathe(apex.x, apex.z, [[0.1, apex.y + 2.4, 0, g], [0.9, apex.y + 0.8, 0, g], [0.1, apex.y - 0.8, 0, g]], 8, 0, 0);
    // scalloped canopy, the station bell and a lantern
    const mid = at(rightSide / 2 + 1.5, 7.6);
    bag.lathe(mid.x, mid.z, [[0.1, mid.y + 3.4, 0, g], [1.6, mid.y + 2.2, 2, col(PAL[1])], [3.6, mid.y + 0.9, 2, cream], [4.3, mid.y + 0.5, 0, g], [4.1, mid.y + 0.2, 0, g]], 12, 0, 0);
    bells.push(new THREE.Vector3(mid.x, mid.y - 0.5, mid.z));
    // the release cradle: a brass hook hanging beside the cable, a keeper bar and a lamp
    const hk = [at(-2.3, 7.0), at(-2.3, 4.4), at(-2.42, 3.6), at(-2.8, 3.2), at(-3.2, 3.5), at(-3.22, 4.1)];
    bag.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(hk), 12, 0.09, 4, false), null, g, [0, 0, 0, 0]);
    rod(at(-2.3, 5.2), at(-0.5, 2.5), 0.05, g, 0); rod(at(-3.5, 7.0), at(-3.5, 6.4), 0.05, g, 0);
    bag.add(new THREE.SphereGeometry(0.2, 6, 4), new THREE.Matrix4().makeTranslation(at(-2.8, 3.0).x, o.y + 2.9, at(-2.8, 3.0).z), lamp, [0, 0, 4, 0]);
    bag.add(new THREE.SphereGeometry(0.45, 6, 5), new THREE.Matrix4().makeTranslation(at(rightSide + 3.5, 6.0).x, o.y + 6.0, at(rightSide + 3.5, 6.0).z), lamp, [0, 0, 4, 0]);
    bag.add(new THREE.SphereGeometry(0.45, 6, 5), new THREE.Matrix4().makeTranslation(at(-3.5, 6.0).x, o.y + 6.0, at(-3.5, 6.0).z), lamp, [0, 0, 4, 0]);
  }
  const rig = new THREE.Mesh(bag.build(), solidMaterial(H)); rig.frustumCulled = false;
  const flat = []; for (const sp of spans) for (const q of sp) flat.push(q);
  const ret = new THREE.Mesh(tube(flat, 0.03, rc), retMat); ret.frustumCulled = false;
  // the station bells: hung from a pivot so that they can swing
  const bb = makeBag();
  bb.lathe(0, 0, bellProfile(0, g, g).map((q) => [q[0] * 0.46, q[1] * 0.46 - 0.2, 0, g]), 10, 0, 0);
  bb.add(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 4, 1), new THREE.Matrix4().makeTranslation(0, -0.08, 0), g, [0, 0, 0, 0]);
  bb.add(new THREE.SphereGeometry(0.2, 6, 4), new THREE.Matrix4().makeTranslation(0, -2.35, 0), lamp, [0, 0, 4, 0]);
  const bellMesh = new THREE.InstancedMesh(bb.build(), solidMaterial(H), bells.length); bellMesh.frustumCulled = false;
  return { cable, ret, rig, spans, bells, bellMesh };
}

// ---------------------------------------------------------------- the sea's surface light: swell lines, the sun's glitter path, glow pools under the city
function makeSeaLight(H, hour, towers, sunAt, density) {
  const N = 256, SPAN = 4200, data = new Uint8Array(N * N), acc = new Float32Array(N * N);
  const splat = (x, z, rad, k) => {
    const cx = (x / SPAN + 0.5) * N, cz = (z / SPAN + 0.5) * N, rr = Math.max(1.6, rad / SPAN * N), r = Math.ceil(rr * 2);
    for (let j = Math.max(0, Math.floor(cz - r)); j <= Math.min(N - 1, Math.ceil(cz + r)); j++) for (let i = Math.max(0, Math.floor(cx - r)); i <= Math.min(N - 1, Math.ceil(cx + r)); i++) {
      const d2 = ((i + 0.5 - cx) * (i + 0.5 - cx) + (j + 0.5 - cz) * (j + 0.5 - cz)) / (rr * rr); acc[j * N + i] += k * Math.exp(-d2 * 1.6);
    }
  };
  for (const t of towers) splat(t.x, t.z, 1.6 * t.R + 34, 0.5 + 0.0012 * t.len);
  splat(0, 0, 300, 1.0);
  for (let a = 0; a < 40; a++) splat(Math.sin(a / 40 * TAU) * 215, Math.cos(a / 40 * TAU) * 215, 70, 0.1);
  for (let i = 0; i < N * N; i++) data[i] = Math.min(255, Math.round(acc[i] * 190));
  const map = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.UnsignedByteType); map.magFilter = map.minFilter = THREE.LinearFilter; map.needsUpdate = true;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8,
    uniforms: { uTime: H.uniforms.uTime, uMap: { value: map }, uDensity: { value: density }, uSwell: { value: col(hour.seaScat) }, uPathC: { value: col(hour.pathC) }, uPool: { value: col(hour.pool || '#FFE2A6') },
      uSun: { value: new THREE.Vector2(sunAt.x, sunAt.z).normalize() }, uPathI: { value: hour.pathI }, uPoolI: { value: hour.poolI }, uPoolBrk: { value: hour.poolBrk || 0 }, uSpan: { value: SPAN }, uPix: H.pix },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
uniform float uTime, uDensity, uPathI, uPoolI, uPoolBrk, uSpan, uPix; uniform vec3 uSwell, uPathC, uPool; uniform vec2 uSun; uniform sampler2D uMap;
varying vec3 vW;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
${G_VNOISE}
// pin-point glints: one twinkling dot in about every other cell, the cell kept a few pixels wide at any distance
float spark(vec2 p){ vec2 i = floor(p), f = fract(p); float r = h21(i), r2 = h21(i + 17.3);
  float tw = 0.5 + 0.5*sin(uTime*(1.6 + r*4.0) + r2*40.0); tw *= tw; tw *= tw;
  float d = length(f - 0.5 - (vec2(r, r2) - 0.5)*0.56);
  return smoothstep(0.26, 0.05, d)*tw*step(0.42, fract(r2*7.31 + r)); }
float glit(vec2 xz, float cell){ float l = log2(max(cell, 0.05)), l0 = floor(l), t = l - l0;
  return mix(spark(xz/exp2(l0)), spark(xz/exp2(l0 + 1.0) + 17.3), t); }
void main(){
  vec3 V = vW - cameraPosition; float dist = length(V), hd = max(length(V.xz), 1e-3);
  float f = exp(-uDensity*uDensity*dist*dist);
  vec2 p = vW.xz;
  // long slow swell lines: three trains of slightly bent crests, each with a thin bright crest line
  float b1 = vn(p*0.0019 + 1.7)*2.6, b2 = vn(p*0.0027 + 8.3)*2.4;
  float w1 = sin(dot(p, vec2(0.0152, 0.0074)) + uTime*0.34 + b1);
  float w2 = sin(dot(p, vec2(-0.0068, 0.0231)) - uTime*0.29 + b2);
  float w3 = sin(dot(p, vec2(0.041, 0.027)) + uTime*0.62 + b1*1.7 + b2);
  float nearK = smoothstep(1900.0, 500.0, dist);
  float sw = smoothstep(0.2, 1.0, w1)*0.62 + smoothstep(0.35, 1.0, w2)*0.42 + smoothstep(0.55, 1.0, w3)*0.2*nearK;
  float crest = smoothstep(0.9, 1.0, w1)*0.5 + smoothstep(0.92, 1.0, w2)*0.35;
  float lull = 0.45 + 0.55*vn(p*0.0012 + 3.7);
  vec3 c = uSwell*(sw*0.24 + crest*0.16*nearK)*lull;
  // the sun's glitter path: a soft sheen in a narrow wedge toward the sun, crowded with pin-point glints that bloom
  float al = dot(V.xz/hd, uSun), x = max(1.0 - al, 0.0);
  float core = exp(-x/0.010), wide = exp(-x/0.07);
  float reachK = smoothstep(90.0, 600.0, hd);
  float cell = dist*uPix*5.5/sqrt(max(-V.y/dist, 0.03));
  float g1 = glit(p, cell), g2 = glit(p*1.37 + 91.0, cell);
  float onCrest = 0.55 + 0.45*smoothstep(-0.2, 0.8, w3)*nearK + 0.3*sw;
  c += uPathC*uPathI*reachK*(core*(0.16 + 0.10*sw) + wide*0.035 + (core*1.0 + wide*0.22)*(g1 + g2)*4.5*onCrest);
  // warm pools of reflected candle-light under every chandelier, breathing with the ripples and pricked with glints
  float pool = texture2D(uMap, p/uSpan + 0.5).r;
  float rip = 0.5 + 0.5*vn(p*0.021 + vec2(uTime*0.32, -uTime*0.21));
  // a look may break each pool into long dashes of gold, dark between them: three drifting noise fields laid along the crest direction of the first swell train (uPoolBrk 0: the whole pool, as ever)
  float brk = 1.0;
  if (uPoolBrk > 0.0) {
    vec2 pc = vec2(dot(p, vec2(0.899, 0.438)), dot(p, vec2(-0.438, 0.899)));                            // across the first swell train's crests, along them
    float d1 = vn(vec2(pc.x*0.062 + uTime*0.30 + b1, pc.y*0.0115)), d2 = vn(vec2((pc.x + pc.y*0.22)*0.095 - uTime*0.41, pc.y*0.019 + 5.3 + b2));
    float d3 = vn(vec2((pc.x - pc.y*0.15)*0.21 + uTime*0.6, pc.y*0.043 + 2.9));
    brk = mix(1.0, 0.08 + (1.3*smoothstep(0.50, 0.84, d1) + 1.0*smoothstep(0.54, 0.88, d2))*(0.35 + 1.1*smoothstep(0.3, 0.8, d3)), uPoolBrk);
  }
  c += uPool*uPoolI*pool*(0.5 + 0.5*rip + 0.25*sw + 3.0*g2)*brk;
  gl_FragColor = vec4(c*f, 1.0);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(11000, 11000).rotateX(-Math.PI / 2), mat);
  mesh.position.y = 4; mesh.renderOrder = 1.2; mesh.frustumCulled = false;
  return mesh;
}

// a soft band of haze where sea, sky and cloud meet, so the horizon is a glow and no line; a look may ask for a told horizon (row key edge) (follows the camera)
function makeHorizonHaze(hour, sunAt) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    uniforms: { uHaze: { value: col(hour.haze) }, uTop: { value: col(hour.haze).lerp(col('#FBF1E1'), hour.disc ? 0.7 : 0.25) }, uFog: { value: col(hour.fog) }, uSun: { value: new THREE.Vector2(sunAt.x, sunAt.z).normalize() },
      uA: { value: hour.disc ? 0.9 : 0.7 }, uEdge: { value: hour.edge || 0 } },
    vertexShader: /* glsl */`varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }`,
    fragmentShader: /* glsl */`
uniform vec3 uHaze, uTop, uFog; uniform vec2 uSun; uniform float uA, uEdge; varying vec3 vD;
void main(){
  float hd = max(length(vD.xz), 1.0), el = atan(vD.y/hd)*57.2958;
  float s = max(dot(vD.xz/hd, uSun), 0.0), q = (el + 1.3)/mix(3.3, 4.3, s);
  float g = exp(-q*q);
  vec3 c = mix(uHaze, uTop, smoothstep(-1.0, 5.0, el)*0.75);
  c = mix(c, mix(uFog, uHaze, 0.55), smoothstep(-1.5, -7.0, el)*0.7);
  c *= 1.0 + 0.22*s*s*s;
  c = mix(c, uFog, (1.0 - smoothstep(-0.9, 0.15, el))*uEdge);   // uEdge 1: under the sea's far line the band is the deep air, the glow lies only above it, so the horizon is told (0: a glow and no line, as ever)
  gl_FragColor = vec4(c, g*uA*(0.72 + 0.28*s));
}`,
  });
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(4800, 4800, 2400, 48, 12, true), mat);
  mesh.renderOrder = 1.6; mesh.frustumCulled = false;
  return mesh;
}

// a puff of vapour where the leaping koi leaves the cloud and where it falls back up into it
function makeSplash(rng, hour, pts) {
  const per = 22, n = pts.length * per, aPos = new Float32Array(n * 4), aDir = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const k = Math.floor(i / per), a = rng() * TAU, p = pts[k];
    aPos.set([p.x, p.y, p.z, k], i * 4); aDir.set([Math.cos(a), rng.range(0.25, 1), Math.sin(a), rng()], i * 4);
  }
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
  geo.setAttribute('aPos', new THREE.InstancedBufferAttribute(aPos, 4)); geo.setAttribute('aDir', new THREE.InstancedBufferAttribute(aDir, 4)); geo.instanceCount = n;
  const uK = { value: new THREE.Vector2(0, 0) };
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uK, uCol: { value: col(hour.lit).lerp(col(hour.warm), 0.15) } },
    vertexShader: /* glsl */`
uniform vec2 uK; attribute vec4 aPos, aDir; varying vec2 vQ; varying float vA;
void main(){
  float k = aPos.w < 0.5 ? uK.x : uK.y, r = aDir.w;
  float e = 1.0 - (1.0 - k)*(1.0 - k);
  vec3 p = aPos.xyz + vec3(aDir.x, 0.0, aDir.z)*(4.0 + (16.0 + 26.0*r)*e);
  p.y += -(10.0 + 26.0*aDir.y)*4.0*k*(1.0 - k)*(0.4 + 0.6*r) + 3.0;
  vec4 mv = viewMatrix*vec4(p, 1.0);
  vQ = position.xy; vA = smoothstep(0.0, 0.08, k)*(1.0 - smoothstep(0.55, 1.0, k))*(0.5 + 0.5*r);
  mv.xy += position.xy*(5.0 + (9.0 + 12.0*r)*e)*step(0.0005, vA);          // collapsed to nothing while idle (always drawn: no late compile)
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: /* glsl */`
uniform vec3 uCol; varying vec2 vQ; varying float vA;
void main(){ float d = dot(vQ, vQ); float a = (1.0 - smoothstep(0.1, 1.0, d))*vA*0.55; gl_FragColor = vec4(uCol, a); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return { mesh, uK };
}

// ================================================================ the world
export default {
  id: 'chandelier-city',
  name: 'The Chandelier City',
  category: 'bizarre',
  weirdness: 0.85,
  media: ['cable', 'air'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 }, vr = rng.fork('cc-variant');
    const detail = (ctx.quality && ctx.quality.detail) || 1, density = Math.min(1.3, Math.max(0.7, vary.density || 1)), dens = Math.min(density, 1.1);
    const pickHour = vr.pick(['sunrise', 'sunset', 'bluehour']);
    const hourId = vary.hour === 'night' ? 'bluehour' : vary.hour === 'golden' ? 'sunset' : (vary.hour === 'dawn' || vary.hour === 'day') ? 'sunrise' : pickHour;
    const hour = HOURS[hourId], weather = vr.pick(['still', 'breezy', 'rainy']), seasonId = vr.pick(['wisteria', 'wisteria', 'autumn', 'blossom']), season = SEASONS[seasonId];
    const festival = vr.chance(0.4), doves = vr.chance(0.5), rare = !!vary.rare, breezy = weather === 'breezy', rainy = weather === 'rainy';
    const FOG_D = 0.000383 * (rainy ? 1.5 : 1), DUR = 46;
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(col(hour.fog), FOG_D);

    // ---- the flight: out from under the cloud, two sagging swings between stations, the lane under the corona
    const path = makePath([[276, 570, 786], [242, 569, 757], [211, 557, 731], [165, 521, 693], [119, 477, 654], [81, 449, 622], [58, 442, 603],
      [25, 424, 575], [-13, 415, 543], [-52, 425, 510], [-88, 442, 478], [-78, 434, 450], [-44, 414, 385], [-16, 428, 325], [-2, 439, 292],
      [0, 436, 262], [0, 428, 190], [0, 419, 110], [0, 412, 55], [0, 410, 0]]);
    const frameAt = (x, z) => { const n = path.nearestXZ(x, z), pos = path.pointAt(n.u), tg = path.tangentAt(n.u); return { u: n.u, pos, right: new THREE.Vector3(-tg.z, 0, tg.x).normalize() }; };
    const stA = frameAt(58, 603), stB = frameAt(-88, 478), stC = frameAt(-2, 292), low1 = frameAt(-13, 543), low2 = frameAt(-44, 385);

    // ---- light
    const d2r = Math.PI / 180, sunDir = new THREE.Vector3(Math.sin(hour.az * d2r) * Math.cos(hour.el * d2r), Math.sin(hour.el * d2r), -Math.cos(hour.az * d2r) * Math.cos(hour.el * d2r));
    const hero = await buildHero(ctx, { palette: PAL, sunDir, sunColor: hour.sun, sunIntensity: hour.sunI, sway: breezy ? 2.2 : 1, crystalDensity: 0.75 * detail });
    const HU = hero.uniforms, cCream = col(PAL[0]), cRose = col(PAL[1]), cLilac = col(PAL[3]), cPeri = col(PAL[4]);
    HU.uSkyUp.value.copy(cCream).lerp(col(hour.upMix[0]), hour.upMix[1]).multiplyScalar(hour.up); HU.uSkyDn.value.copy(cLilac).lerp(col(hour.dnMix[0]), hour.dnMix[1]).multiplyScalar(hour.dn);
    void cRose; void cPeri;
    HU.uHaze.value.set(hour.haze).multiplyScalar(0.9); HU.uGlow.value = hour.glow;
    scene.add(hero.object);
    const koiU = []; for (let i = 0; i < 9; i++) koiU.push(new THREE.Vector4(0, 9e4, 0, 1));
    const H = { uniforms: HU, breeze: { value: breezy ? 2.2 : 1 }, lean: { value: new THREE.Vector2(breezy ? 0.0052 : 0.0008, breezy ? 0.002 : 0.0003) }, pix: { value: 0.001 },
      cloudC: { value: col(hour.lit).lerp(col(hour.warm), 0.18).multiplyScalar(0.9) }, koi: { value: koiU }, dimp: { value: [new THREE.Vector3(0, 9e4, 0), new THREE.Vector3(0, 9e4, 0)] },
      litShare: { value: hourId === 'bluehour' ? 0.93 : hourId === 'sunset' ? 0.8 : 0.66 }, gold: HU.uGold.value };
    await ctx.yield();

    // sea, sky and cloud all dissolve into the same horizon colour; a soft haze band is laid over the join
    const hzn = hour.hzn ? col(hour.hzn) : col(hour.fog).lerp(col(hour.haze), 0.5), hznHex = '#' + hzn.getHexString();
    const sky = makeSky({ rng, preset: 'dawn', zenith: hour.fog, mid: hour.fog, horizon: hznHex, ground: hznHex, horizonPow: 4.5, groundFalloff: 1.2, sunElevation: hour.disc ? 1.3 : -5, sunAzimuth: hour.az,
      sunColor: hour.disc || '#8088ff', sunSize: 2.4, sunIntensity: 0, sunGlow: 0, scatterColor: hour.haze, scatter: hour.scatter ?? 0.5, clouds: false, clouds2: false, stars: 0, bodies: [],
      lightColor: hour.sun, lightIntensity: 1.5, ambientColor: hour.amb || hour.lit, groundLight: PAL[3], ambientIntensity: 1.05, fogColor: hour.fog });
    scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky, { bounce: 0.5 }); scene.add(rig.object);
    const sea = Water.makeOcean({ rng, sky, preset: 'swell', deep: hour.sea, scatter: hour.seaScat, radius: 5200, rings: 60, segments: 96, foam: 0, glitter: 1, glint: hourId === 'bluehour' ? 0.35 : 1,
      fogColor: hznHex, horizonColor: hznHex });
    scene.add(sea.object);
    await ctx.yield();
    const ceiling = makeCeiling(H, hour, FOG_D); scene.add(ceiling);
    await ctx.yield();
    // the sun: a coral disc on the horizon band (our own sprite: it follows whichever camera draws it)
    let sunDisc = null; const sunAt = new THREE.Vector3(Math.sin(hour.az * d2r), Math.sin(1.7 * d2r), -Math.cos(hour.az * d2r)).normalize();
    if (hour.disc) {
      sunDisc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        uniforms: { uCol: { value: col(hour.disc) } },
        vertexShader: 'varying vec2 vQ; void main(){ vQ = uv*2.0 - 1.0; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0); }',
        // premultiplied: the coral core covers the haze behind it (so it stays coral, never clipped white), the glow only adds
        fragmentShader: 'uniform vec3 uCol; varying vec2 vQ; void main(){ float d = length(vQ); float disc = smoothstep(0.30, 0.265, d); float g = exp(-d*4.5)*(1.0 - smoothstep(0.6, 1.0, d)); float limb = 0.82 + 0.18*smoothstep(0.30, 0.05, d); gl_FragColor = vec4((uCol*1.25 + vec3(0.22, 0.10, 0.04))*disc*limb + uCol*g*0.55*(1.0 - disc*0.7), disc*0.94); }',
      }));
      sunDisc.scale.setScalar(2300); sunDisc.renderOrder = 1.7; sunDisc.frustumCulled = false; scene.add(sunDisc);
    }
    const haze = makeHorizonHaze(hour, sunAt); scene.add(haze);
    await ctx.yield();

    // ---- rain pillars: one stands across the second swing
    const pillars = [{ x: low2.pos.x, z: low2.pos.z, r: rainy ? 34 : 30 }], nPil = rainy ? 12 : 6;
    if (rainy) pillars.push({ x: low1.pos.x + low1.right.x * 105, z: low1.pos.z + low1.right.z * 105, r: 36 });   // a second shaft close beside the first swing
    for (let tries = 0; pillars.length < nPil && tries < 300; tries++) {
      const a = rng() * TAU, r = rng.range(430, 1500), x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (path.nearestXZ(x, z).dist < 110 || (Math.abs(x) < 110 && z > 0)) continue;
      if (pillars.some((p) => Math.hypot(p.x - x, p.z - z) < 230)) continue;
      pillars.push({ x, z, r: rng.range(26, 34) * (rainy ? 1.25 : 1) });
    }
    const rain = makeRain(H, rng.fork('rain'), pillars, Math.round((rainy ? 620 : 480) * detail), hour, FOG_D);
    scene.add(rain.cols, rain.streaks);
    await ctx.yield();

    // ---- the city
    const cR = 24, cOff = cR + 19;
    const closeTower = { x: low1.pos.x - low1.right.x * cOff, z: low1.pos.z - low1.right.z * cOff, R: cR, tiers: 4, len: 285, top: CLOUD - 60, near: true, ph: rng.range(0, TAU), amp: 0.005,
      seed: rng(), widest: 1, ringAt: { k: 1, y: low1.pos.y - 0.5 } };
    const gp = path.posAtDist(195), gt = path.tangentAtDist(195);                 // a tower that greets the entry view (and the portal preview)
    const greetTower = { x: gp.x - gt.z * 42, z: gp.z + gt.x * 42, R: 21, tiers: 5, len: 300, top: CLOUD - 50, near: true, ph: rng.range(0, TAU), amp: 0.008, seed: rng(), widest: 0 };
    // long towers hanging beside and far below the entry dive, so the downward view has layers above the sea
    const fixed = [closeTower, greetTower], dr = rng.fork('dive');
    [0.07, 0.115, 0.16, 0.205].forEach((uu, i) => {
      const p = path.pointAt(uu), tg = path.tangentAt(uu).setY(0).normalize(), R = dr.range(19, 26);
      for (const side of (i % 2 ? [1, -1] : [-1, 1])) {
        const off = (R + dr.range(46, 72)) * side, x = p.x - tg.z * off + tg.x * 60, z = p.z + tg.x * off + tg.z * 60;
        if (fixed.some((t) => Math.hypot(t.x - x, t.z - z) < t.R + R + 46) || path.nearestXZ(x, z).dist < R + 30) continue;
        fixed.push({ x, z, R, tiers: 6, len: dr.range(345, 398), top: CLOUD - dr.range(40, 60), near: true, ph: dr.range(0, TAU), amp: dr.range(0.009, 0.013), seed: dr(), widest: i % 2 });
        break;
      }
    });
    const towers = layoutTowers(rng.fork('towers'), path, pillars, dens, fixed);
    await ctx.yield();
    const city = await buildCity(H, rng.fork('city'), towers, path, season, { lush: dens, flags: festival, pause: () => ctx.yield() });
    await ctx.yield();
    const seaLight = makeSeaLight(H, hour, towers, sunAt, FOG_D); scene.add(seaLight);
    scene.add(city.group);
    await ctx.yield();
    if (city.arms.length) {
      const n = city.arms.length / 7, ag = armGeometry(), ais = new Float32Array(n * 2), am = new THREE.InstancedMesh(ag, solidMaterial(H, { INST_SWAY: 1 }), n);
      const m = new THREE.Matrix4(), q = new THREE.Quaternion(), yAxis = new THREE.Vector3(0, 1, 0), v = new THREE.Vector3(), sc = new THREE.Vector3();
      for (let i = 0; i < n; i++) {
        const o = i * 7, s = city.arms[o + 4] * 1.15;
        m.compose(v.set(city.arms[o], city.arms[o + 1], city.arms[o + 2]), q.setFromAxisAngle(yAxis, city.arms[o + 3]), sc.set(s, s, s)); am.setMatrixAt(i, m);
        ais[i * 2] = city.arms[o + 5]; ais[i * 2 + 1] = city.arms[o + 6];
      }
      ag.setAttribute('aIs', new THREE.InstancedBufferAttribute(ais, 2)); am.frustumCulled = false; scene.add(am);
    }

    await ctx.yield();
    // ---- the cable we ride, the return cable and the stations
    const RS = 16, rigs = buildRig(H, path, [stA, stB, stC], RS);
    scene.add(rigs.cable, rigs.ret, rigs.rig, rigs.bellMesh);
    await ctx.yield();
    const stU = [stA.u, stB.u, stC.u];
    const cabGeo = gondolaGeometry(0), nCab = rigs.spans.length * 3, cabins = new THREE.InstancedMesh(cabGeo, solidMaterial(H), nCab); cabins.frustumCulled = false; scene.add(cabins);
    const cabPhase = []; for (let i = 0; i < nCab; i++) cabPhase.push((i % 3) / 3 + rng.range(-0.08, 0.08));

    await ctx.yield();
    // ---- bell-gondolas swinging on 185 m ropes from the cloud
    const ROPE = 180, pend = [], gr = rng.fork('gondolas');
    for (let tries = 0; pend.length < Math.round(19 * density) && tries < 1500; tries++) {
      if ((tries & 31) === 31) await ctx.yield();
      const p = path.pointAt(gr.range(0.04, 0.92)), a = gr() * TAU, d = gr.range(55, 430), x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d, az = gr() * TAU;
      let bad = pend.some((g) => Math.hypot(g.x - x, g.z - z) < 60);
      for (let s = -100; s <= 100 && !bad; s += 20) {
        const bx = x + Math.cos(az) * s, bz = z - Math.sin(az) * s, by = CLOUD - Math.sqrt(185 * 185 - s * s);
        if (Math.hypot(bx, bz) < 300 || path.distanceTo(bx, by, bz) < 26 || path.nearestXZ(bx, bz).dist < 9) bad = true;
        for (const t of towers) if (Math.hypot(bx - t.x, bz - t.z) < t.R + 14) { bad = true; break; }
      }
      if (!bad) pend.push({ x, z, az, ph: gr() * TAU, T: 27.3 * gr.range(0.97, 1.03) });
    }
    const pendMesh = new THREE.InstancedMesh(gondolaGeometry(ROPE), solidMaterial(H), Math.max(1, pend.length)); pendMesh.frustumCulled = false; pendMesh.count = pend.length; scene.add(pendMesh);

    await ctx.yield();
    // ---- kite-ferries circling the districts
    const kr = rng.fork('kites'), kites = [], hosts = towers.filter((t) => t.pd > t.R + 85 && t.pd < 800);
    for (let i = 0; i < Math.round((festival ? 16 : 9) * density) && hosts.length; i++) {
      const t = hosts[kr.int(0, hosts.length - 1)];
      kites.push({ x: t.x, z: t.z, r: t.R + kr.range(30, 44), y: kr.range(430, 545), ph: kr() * TAU, dir: kr.chance(0.5) ? 1 : -1, sp: kr.range(4.5, 7.5), s: kr.range(1.3, 1.9) });
    }
    { const e = path.posAtDist(330), tg = path.startTangent, ex = path.start.x + tg.x * 330, ez = path.start.z + tg.z * 330; void e;
      kites.push({ x: ex + tg.z * 60, z: ez - tg.x * 60, r: 62, y: 574, ph: Math.atan2(-tg.z, tg.x) + Math.PI, dir: 1, sp: 5, s: 2.2 }); }
    const kiteMesh = new THREE.InstancedMesh(kiteGeometry(), solidMaterial(H), Math.max(1, kites.length)); kiteMesh.frustumCulled = false; kiteMesh.count = kites.length; scene.add(kiteMesh);
    await ctx.yield();

    // ---- creatures
    const fl = { sunDir, sunColor: hour.sun, sunIntensity: 1.5, sky: hour.lit, skyIntensity: 1.0, ground: PAL[3], groundIntensity: 0.95 };
    const fauna = F.makeFauna(scene, { light: fl });
    const swiftCol = { body: '#6A66B0', belly: '#B9B4E6', wingC: '#5E5AA6', tailC: '#5E5AA6', head: '#6A66B0' };
    fauna.add(F.makeFlock({ rng, species: 'swifts', count: Math.round(170 * density * detail), lod: 'high', spread: [16, 10, 36], ...swiftCol, along: { path, side: 24, up: 5, lead: 44, from: 0.08, to: 0.46, drift: 10 } }), { always: true });
    await ctx.yield();
    const sHosts = towers.filter((t) => t.pd > 60 && t.pd < 380);
    for (let i = 0; i < 2 && sHosts.length; i++) {
      const t = sHosts[rng.int(0, sHosts.length - 1)], r = t.rings[Math.min(1, t.rings.length - 1)];
      // (the clear air round the line, 14 Oct: one swift of this wide scatter was dealt 0.21 m from the flown line, and the ring
      // travels on the clock, so the pass could fall on any visit. The ring stays where it is; the few too near are held off by their own offsets.)
      fauna.add(F.makeFlock({ rng, species: 'swifts', count: Math.round(520 * density * detail), lod: 'low', spread: [44, 26, 60], ...swiftCol, center: [t.x, Math.min(540, r.y - 30), t.z], radius: t.R + 55, height: 30, speed: 22, keepClear: { path, dist: 2, each: true } }), { always: true });
      await ctx.yield();
    }
    fauna.add(F.makeFlock({ rng, species: 'gulls', count: Math.round(46 * density), size: 2.6, spread: [160, 20, 160], center: [low2.pos.x * 0.5, 55, 420], radius: 260, height: 25 }), { always: true });
    await ctx.yield();
    if (doves) fauna.add(F.makeFlock({ rng, species: 'gulls', count: 34, size: 1.3, body: '#FFFFFF', belly: '#FFF6EE', wingC: '#F6EEF6', tip: '#E8DCEB', cross: { path, u: 0.63, lead: 55, height: 12, angle: 70, span: 320, duration: DUR } }), { always: true });
    await ctx.yield();
    // nine golden cloud-koi swim in the ceiling, belly-up to us: their backs, dorsal fins and tails hang through its underside
    // and each drags ring dimples and a long V wake across the cloud (drawn by the ceiling shader from the same positions)
    const kr2 = rng.fork('cloud-koi'), koiGeo = koiGeometry(rng.fork('koi')), koiMat = solidMaterial(H, { KOI: 1 }); koiMat.uniforms.uEmis.value = hour.koiE;
    const koiMesh = new THREE.InstancedMesh(koiGeo, koiMat, 9); koiMesh.frustumCulled = false; scene.add(koiMesh);
    const loops = [], pA = path.pointAt(0.42), pB = path.pointAt(0.6), pC = path.pointAt(0.72), pD = path.pointAt(0.22);
    const clearLoop = (cx, cz, r) => { if (Math.hypot(cx, cz) - r < 150) return false;
      for (const t of towers) { const d = Math.abs(Math.hypot(t.x - cx, t.z - cz) - r); if (d < 9 + t.R * 0.2) return false; } return true; };
    const wantLoops = [[pA.x, pA.z, 150, 2], [low2.pos.x, low2.pos.z, 120, 2], [pC.x + 40, pC.z, 135, 2], [pD.x, pD.z, 200, 2], [pB.x - 120, pB.z + 60, 260, 1]];
    for (const [x0, z0, r0, n] of wantLoops) {
      let best = null;
      for (let tries = 0; tries < 60 && !best; tries++) { const a = kr2() * TAU, d = r0 * kr2.range(0.55, 1.0) + tries * 1.5, r = r0 * kr2.range(0.85, 1.2), cx = x0 + Math.cos(a) * d * (r / r0), cz = z0 + Math.sin(a) * d * (r / r0); if (clearLoop(cx, cz, r)) best = { cx, cz, r }; }
      if (!best) best = { cx: x0 + r0, cz: z0, r: r0 };
      const dir = kr2.chance(0.5) ? 1 : -1, ph = kr2() * TAU;
      for (let i = 0; i < n; i++) loops.push({ ...best, dir, ph: ph + i * (Math.PI * kr2.range(0.8, 1.2)), sp: kr2.range(4.4, 5.6), roll: kr2() * TAU, s: kr2.range(0.82, 1.0) });
    }
    await ctx.yield();
    // rare: a cloud-koi leaps out of the ceiling beside the gondola on the second swing and falls back up
    let leaper = null, splash = null;
    if (rare) {
      const lc = path.pointAt(0.575), lt = path.tangentAt(0.575).setY(0).normalize(), lr = new THREE.Vector3(-lt.z, 0, lt.x);
      const lm = solidMaterial(H, { KOI: 1 }); lm.uniforms.uEmis.value = hour.koiE + 0.1;
      leaper = new THREE.Mesh(koiGeometry(rng.fork('koi')), lm); leaper.frustumCulled = false; leaper.position.set(0, 9e4, 0); leaper.scale.setScalar(1.2); scene.add(leaper);
      const c = lc.clone().addScaledVector(lr, -20).addScaledVector(lt, 30);
      const p0 = c.clone().addScaledVector(lt, -75).setY(604), p1 = c.clone().addScaledVector(lt, 75).setY(604);
      leaper.userData = { c, t: lt, prev: new THREE.Vector3(), p0, p1 };
      splash = makeSplash(rng.fork('splash'), hour, [p0, p1]); scene.add(splash.mesh);
    }

    await ctx.yield();
    // ---- air: petals and wisps under the ceiling
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    set.add(fx.makeParticles({ rng: rng.fork('petals'), preset: seasonId === 'autumn' ? 'leaves' : 'petals', time, colors: season.petals, count: Math.round((seasonId === 'blossom' ? 1700 : 1150) * (breezy ? 2 : 1) * density * detail),
      box: [64, 40, 64], size: [0.14, 0.3], velocity: breezy ? [8.2, -0.45, 3.0] : [0.55, -1.05, 0.25], lightDir: [sunDir.x, 0.5, sunDir.z] }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: rng.fork('wisps'), time, count: 26, area: [520, 22, 520], center: [215, 590, 735], size: [45, 100], color: hour.lit, opacity: 0.2, drift: [1.4, 0, 0.6] }));
    await ctx.yield();

    // ---- per-frame
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), P = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), SK = new THREE.Vector3();
    const Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1), X = new THREE.Vector3(1, 0, 0), size = new THREE.Vector2();
    const KP = new THREE.Vector3(), KT = new THREE.Vector3(), Q3 = new THREE.Quaternion();
    const animate = (t, u) => {
      for (let i = 0; i < loops.length; i++) {
        const k = loops[i], a = k.ph + k.dir * t * k.sp / k.r, sx = Math.sin(a), cz = Math.cos(a);
        KP.set(k.cx + sx * k.r, 594.5 + 1.6 * Math.sin(t * 0.23 + k.roll), k.cz + cz * k.r); KT.set(cz * k.dir, 0, -sx * k.dir);
        const yaw = Math.atan2(KT.x, KT.z) + 0.07 * Math.sin(t * 0.9 + k.roll);
        Q.setFromAxisAngle(Y, yaw).multiply(Q2.setFromAxisAngle(Z, Math.PI + 0.42 * Math.sin(t * 0.31 + k.roll))).multiply(Q3.setFromAxisAngle(X, 0.05 * Math.sin(t * 0.4 + k.roll * 2)));
        M.compose(KP, Q, SK.set(k.s, k.s, k.s)); koiMesh.setMatrixAt(i, M);
        koiU[i].set(KP.x, KP.z, KT.x, KT.z);
      }
      koiMesh.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < rigs.bells.length; i++) {
        const near = Math.exp(-Math.pow((u - stU[i]) / 0.035, 2)), tg = path.tangentAt(stU[i]);
        Q.setFromAxisAngle(KT.set(tg.x, 0, tg.z).normalize(), (0.1 + 0.42 * near) * Math.sin(t * 2.6 + i * 1.7));
        M.compose(rigs.bells[i], Q, S1); rigs.bellMesh.setMatrixAt(i, M);
      }
      rigs.bellMesh.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < pend.length; i++) {
        const g = pend[i], th = 0.55 * Math.cos(TAU * t / g.T + g.ph);
        Q.setFromAxisAngle(Y, g.az).multiply(Q2.setFromAxisAngle(Z, th)); M.compose(P.set(g.x, CLOUD + 1, g.z), Q, S1); pendMesh.setMatrixAt(i, M);
      }
      pendMesh.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < nCab; i++) {
        const sp = rigs.spans[Math.floor(i / 3)], n = sp.length - 1, f = (1 - ((cabPhase[i] + t * 0.012) % 1)) * n, k = Math.min(n - 1, Math.floor(f)), a = sp[k], b = sp[k + 1];
        P.lerpVectors(a, b, f - k);
        Q.setFromAxisAngle(Y, Math.atan2(b.x - a.x, b.z - a.z)).multiply(Q2.setFromAxisAngle(X, 0.06 * Math.sin(t * 0.9 + i * 2.1)));
        M.compose(P, Q, S1); cabins.setMatrixAt(i, M);
      }
      cabins.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < kites.length; i++) {
        const k = kites[i], a = k.ph + k.dir * t * k.sp / k.r;
        P.set(k.x + Math.sin(a) * k.r, k.y + Math.sin(t * 0.4 + k.ph * 3) * 3.5, k.z + Math.cos(a) * k.r);
        Q.setFromAxisAngle(Y, a + (k.dir > 0 ? -Math.PI / 2 : Math.PI / 2)).multiply(Q2.setFromAxisAngle(Z, 0.12 * Math.sin(t * 0.7 + k.ph)));
        M.compose(P, Q, SK.set(k.s, k.s, k.s)); kiteMesh.setMatrixAt(i, M);
      }
      kiteMesh.instanceMatrix.needsUpdate = true;
    };
    const leap = (u, t) => {
      if (!leaper) return;
      const s = (u - 0.47) / 0.16, d = leaper.userData, dm = H.dimp.value;
      const out = s > 0 && s < 1;                             // never hidden (no shader made mid-flight): parked far above the cloud instead
      // vapour where it leaves the cloud and where it falls back up into it, with rings spreading across the ceiling
      const k0 = Math.min(1, Math.max(0, (s + 0.02) / 0.42)), k1 = Math.min(1, Math.max(0, (s - 0.9) / 0.5));
      splash.uK.value.set(k0, k1);
      dm[0].set(d.p0.x, d.p0.z, ss(0, 0.06, k0) * (1 - ss(0.5, 1, k0))); dm[1].set(d.p1.x, d.p1.z, ss(0, 0.06, k1) * (1 - ss(0.5, 1, k1)));
      if (!out) { leaper.position.set(0, 9e4, 0); return; }
      const at = (q, out) => out.copy(d.c).addScaledVector(d.t, (q - 0.5) * 150).setY(616 - 188 * 4 * q * (1 - q));
      at(s, leaper.position); at(s + 0.01, d.prev);
      M.lookAt(d.prev, leaper.position, Y); leaper.quaternion.setFromRotationMatrix(M);
      leaper.rotateZ(0.9 * Math.sin(s * 7) + 0.15 * Math.sin(t * 3)); leaper.rotateY(0.12 * Math.sin(t * 5));
    };
    animate(0, 0);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration: DUR,
      title: hourId === 'bluehour' ? 'The Chandelier City, Blue Hour' : hourId === 'sunset' ? 'The Chandelier City at Sunset' : 'The Chandelier City',
      ride: 'gondola', style: 'none',
      camera: { fov: 62, near: 0.5, far: 9000, lookAhead: 26, sway: 0.5, bank: 0.25 },
      pois: [
        { at: [0, 505, 0], from: 0.03, to: 0.5, weight: 0.6 },
        { at: [0, 480, 0], from: 0.44, to: 0.8, weight: 0.5 },
        { at: [0, 410, 0], from: 0.74, to: 1, weight: 0.7 },
      ],
      portal: { shape: 'circle', radius: 7, color: hour.portal, glow: 0.75, revealDistance: 430 },
      post: { exposure: hour.exposure, bloom: { strength: hour.bloom, radius: hour.bloomR ?? 0.8, threshold: hour.bloomT ?? 0.9 },
        grade: { saturation: 1.06, contrast: 0.97, tint: '#fff7f0', shadowTint: '#26265a', vignette: 0.22, grain: 0.02, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        if (camera && camera.projectionMatrix) {
          const h = (ctx.renderer && ctx.renderer.getDrawingBufferSize) ? (ctx.renderer.getDrawingBufferSize(size).y || 1080) : 1080;
          H.pix.value = 2 / (camera.projectionMatrix.elements[5] * h);
        }
        hero.update(dt, t, camera); hero.setProgress(0.55*ss(0.76, 1, u || 0));
        sky.update(dt, t, camera); rig.update(dt, t, camera); sea.update(dt, t, camera);
        fauna.update(dt, t, camera, u); set.update(dt, t, camera);
        haze.position.setFromMatrixPosition(camera.matrixWorld);
        if (sunDisc) { sunDisc.position.setFromMatrixPosition(camera.matrixWorld).addScaledVector(sunAt, 8000); sunDisc.quaternion.setFromRotationMatrix(camera.matrixWorld); }
        animate(t, u || 0); leap(u || 0, t);
      },
      dispose() { if (sky.dispose) sky.dispose(); if (hero.dispose) hero.dispose(); },
    };
  },
};
