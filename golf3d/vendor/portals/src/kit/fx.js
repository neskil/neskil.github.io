// fx kit: particles, light effects, atmosphere, special materials, energy and magic.
// Pure factories. Everything returns { object, update(dt, time, camera), uniforms, ... } or a
// THREE.Material. No module state, no Math.random, no timers. See docs/kit/fx.md.
import * as THREE from 'three';
import { makeRng } from './core.js';

// =====================================================================================
// GLSL snippets (reusable by other modules and worlds)
// =====================================================================================

// Every snippet is wrapped in an include guard (#ifndef FX_GLSL_*), so pasting one twice is harmless. The function
// names are plain globals: do not combine them with another library that defines hash12 / vnoise / fbm / snoise / voronoi.

// hash11, hash12, hash13, hash22, hash33: cheap, sin-free hashes in [0,1)
// BROUGHT IN: these follow "Hash without Sine", Copyright (c)2014 David Hoskins, MIT License
// (https://www.shadertoy.com/view/4djSRW). The notice ships with the site in THIRD-PARTY-NOTICES.txt.
export const GLSL_HASH = /* glsl */`
#ifndef FX_GLSL_HASH
#define FX_GLSL_HASH
float hash11(float p){ p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
float hash12(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float hash13(vec3 p3){ p3=fract(p3*.1031); p3+=dot(p3,p3.zyx+31.32); return fract((p3.x+p3.y)*p3.z); }
vec2 hash22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
vec3 hash33(vec3 p3){ p3=fract(p3*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yxz+33.33); return fract((p3.xxy+p3.yxx)*p3.zyx); }
#endif
`;

// vnoise(vec2|vec3): smooth value noise in [0,1]
export const GLSL_VALUE_NOISE = /* glsl */`
#ifndef FX_GLSL_VALUE_NOISE
#define FX_GLSL_VALUE_NOISE
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash12(i),hash12(i+vec2(1,0)),f.x), mix(hash12(i+vec2(0,1)),hash12(i+vec2(1,1)),f.x), f.y); }
float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash13(i),hash13(i+vec3(1,0,0)),f.x), mix(hash13(i+vec3(0,1,0)),hash13(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(hash13(i+vec3(0,0,1)),hash13(i+vec3(1,0,1)),f.x), mix(hash13(i+vec3(0,1,1)),hash13(i+vec3(1,1,1)),f.x), f.y), f.z); }
#endif
`;

// snoise(vec2|vec3): simplex noise in ~[-1,1] (Ashima / McEwan, MIT)
// BROUGHT IN: webgl-noise, Copyright (C) 2011 by Ashima Arts (Simplex noise), MIT License
// (https://github.com/ashima/webgl-noise). The notice ships with the site in THIRD-PARTY-NOTICES.txt.
export const GLSL_SIMPLEX = /* glsl */`
#ifndef FX_GLSL_SIMPLEX
#define FX_GLSL_SIMPLEX
vec3 fxMod289(vec3 x){ return x-floor(x*(1./289.))*289.; }
vec4 fxMod289(vec4 x){ return x-floor(x*(1./289.))*289.; }
vec3 fxPermute(vec3 x){ return fxMod289(((x*34.)+1.)*x); }
vec4 fxPermute(vec4 x){ return fxMod289(((x*34.)+1.)*x); }
float snoise(vec2 v){
  const vec4 C=vec4(.211324865405187,.366025403784439,-.577350269189626,.024390243902439);
  vec2 i=floor(v+dot(v,C.yy)); vec2 x0=v-i+dot(i,C.xx);
  vec2 i1=(x0.x>x0.y)?vec2(1.,0.):vec2(0.,1.); vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
  i=fxMod289(vec3(i,0.)).xy; vec3 p=fxPermute(fxPermute(i.y+vec3(0.,i1.y,1.))+i.x+vec3(0.,i1.x,1.));
  vec3 m=max(.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.); m=m*m; m=m*m;
  vec3 x=2.*fract(p*C.www)-1.; vec3 h=abs(x)-.5; vec3 ox=floor(x+.5); vec3 a0=x-ox;
  m*=1.79284291400159-.85373472095314*(a0*a0+h*h);
  vec3 g; g.x=a0.x*x0.x+h.x*x0.y; g.yz=a0.yz*x12.xz+h.yz*x12.yw; return 130.*dot(m,g); }
float snoise(vec3 v){
  const vec2 C=vec2(1./6.,1./3.); const vec4 D=vec4(0.,.5,1.,2.);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy;
  i=fxMod289(i); vec4 p=fxPermute(fxPermute(fxPermute(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
  float n_=.142857142857; vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.*floor(p*ns.z*ns.z); vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.*x_);
  vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw); vec4 s0=floor(b0)*2.+1.; vec4 s1=floor(b1)*2.+1.; vec4 sh=-step(h,vec4(0.));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=1.79284291400159-.85373472095314*vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3));
  p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.); m=m*m;
  return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3))); }
#endif
`;

// fbm(vec2|vec3): 5 / 4 octaves of value noise in [0,1]; fbmLo(vec2): cheap 3 octave version (fbm3 is a
// deprecated alias: in kit/core.js "fbm3" means 3D); vnoised(vec2) / fbm3d(vec2): vec3(value, d/dx, d/dy) and
// vnoised(vec3): vec4(value, gradient), with analytic derivatives (for bump lighting)
export const GLSL_FBM = /* glsl */`
#ifndef FX_GLSL_FBM
#define FX_GLSL_FBM
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*vnoise(p); p=mat2(1.6,1.2,-1.2,1.6)*p+7.1; a*=.5; } return s/.96875; }
float fbmLo(vec2 p){ float a=.5, s=0.; for(int i=0;i<3;i++){ s+=a*vnoise(p); p=mat2(1.6,1.2,-1.2,1.6)*p+7.1; a*=.5; } return s/.875; }
float fbm3(vec2 p){ return fbmLo(p); }
vec3 vnoised(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f), du=6.*f*(1.-f);
  float a=hash12(i), b=hash12(i+vec2(1,0)), c=hash12(i+vec2(0,1)), d=hash12(i+vec2(1,1)), k=a-b-c+d;
  return vec3(a+(b-a)*u.x+(c-a)*u.y+k*u.x*u.y, du*(vec2(b-a,c-a)+k*u.yx)); }
vec4 vnoised(vec3 p){ vec3 i=floor(p), w=fract(p); vec3 u=w*w*(3.-2.*w), du=6.*w*(1.-w);
  float a=hash13(i), b=hash13(i+vec3(1,0,0)), c=hash13(i+vec3(0,1,0)), d=hash13(i+vec3(1,1,0)), e=hash13(i+vec3(0,0,1)), f=hash13(i+vec3(1,0,1)), g=hash13(i+vec3(0,1,1)), h=hash13(i+vec3(1,1,1));
  float k1=b-a, k2=c-a, k3=e-a, k4=a-b-c+d, k5=a-c-e+g, k6=a-b-e+f, k7=-a+b+c-d+e-f-g+h;
  return vec4(a+k1*u.x+k2*u.y+k3*u.z+k4*u.x*u.y+k5*u.y*u.z+k6*u.z*u.x+k7*u.x*u.y*u.z,
    du*vec3(k1+k4*u.y+k6*u.z+k7*u.y*u.z, k2+k5*u.z+k4*u.x+k7*u.z*u.x, k3+k6*u.x+k5*u.y+k7*u.x*u.y)); }
vec3 fbm3d(vec2 p){ float a=.5; vec3 s=vec3(0.); mat2 m=mat2(1.,0.,0.,1.); const mat2 M=mat2(1.6,1.2,-1.2,1.6);
  for(int i=0;i<3;i++){ vec3 n=vnoised(p); s.x+=a*n.x; s.yz+=a*(n.yz*m); p=M*p+7.1; m=M*m; a*=.5; } return s/.875; }
float fbm(vec3 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+vec3(7.1,3.3,5.7); a*=.5; } return s/.9375; }
#endif
`;

// voronoi(vec2) -> vec3(F1, edge distance, cell id)
export const GLSL_VORONOI = /* glsl */`
#ifndef FX_GLSL_VORONOI
#define FX_GLSL_VORONOI
vec3 voronoi(vec2 x){ vec2 n=floor(x), f=fract(x); vec2 mg, mr; float md=8., id=0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g=vec2(float(i),float(j)); vec2 o=hash22(n+g); vec2 r=g+o-f; float d=dot(r,r);
    if(d<md){ md=d; mr=r; mg=g; id=hash12(n+g+17.3); } }
  float me=8.;
  for(int j=-2;j<=2;j++) for(int i=-2;i<=2;i++){ vec2 g=mg+vec2(float(i),float(j)); vec2 o=hash22(n+g); vec2 r=g+o-f;
    if(dot(mr-r,mr-r)>.00001) me=min(me, dot(.5*(mr+r), normalize(r-mr))); }
  return vec3(sqrt(md), me, id); }
#endif
`;

// all noise in one string, in dependency order
export const GLSL_NOISE = GLSL_HASH + GLSL_VALUE_NOISE + GLSL_SIMPLEX + GLSL_FBM + GLSL_VORONOI;

// Fog helpers for ShaderMaterials created with `fog: true` and fogUniforms() merged in.
//   vertex:   GLSL_FOG_PARS_VERT at top, GLSL_FOG_VERT after `vec4 mvPosition = ...`
//   fragment: GLSL_FOG_PARS_FRAG at top, then `col = fxApplyFog(col);` (opaque / alpha blended)
//             or `col *= 1. - fxFog();` (additive), or fxFogMix(col, additive) for premultiplied mixes.
export const GLSL_FOG_PARS_VERT = /* glsl */`
#ifdef USE_FOG
varying float vFogDepth;
#endif
`;
export const GLSL_FOG_VERT = /* glsl */`
#ifdef USE_FOG
vFogDepth = -mvPosition.z;
#endif
`;
export const GLSL_FOG_PARS_FRAG = /* glsl */`
#ifdef USE_FOG
uniform vec3 fogColor; varying float vFogDepth;
#ifdef FOG_EXP2
uniform float fogDensity;
#else
uniform float fogNear; uniform float fogFar;
#endif
#endif
float fxFog(){
#ifdef USE_FOG
  #ifdef FOG_EXP2
  return 1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
  return smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#else
  return 0.;
#endif
}
vec3 fxApplyFog(vec3 c){
#ifdef USE_FOG
  return mix(c, fogColor, fxFog());
#else
  return c;
#endif
}
// for premultiplied colour c with coverage a
vec3 fxFogPremult(vec3 c, float a){
#ifdef USE_FOG
  return mix(c, fogColor*a, fxFog());
#else
  return c;
#endif
}
// additive = 1: fade to black; additive = 0: fade to the fog colour
vec3 fxFogMix(vec3 c, float additive){
#ifdef USE_FOG
  return mix(c, fogColor*(1.-additive), fxFog());
#else
  return c;
#endif
}
`;

// Procedural environment for shiny materials (uniforms come from makeEnv().uniforms):
//   fxEnv(dir, rough) what a surface sees (= fxEnvSky + fxEnvSun), fxAmbient(n), fxDiffuse(n) = ambient + sun, fxFresnel(ndv, f0)
export const GLSL_ENV = /* glsl */`
uniform vec3 uEnvSunDir, uEnvSunColor, uEnvSky, uEnvHorizon, uEnvGround; uniform float uEnvAmbient;
// what a surface "sees" in direction d (world space); rough 0 = mirror, 1 = fully blurred. fxEnv = fxEnvSky + fxEnvSun
vec3 fxEnvSun(vec3 d, float rough){
  float sd = max(dot(d, uEnvSunDir), 0.);
  return uEnvSunColor*(pow(sd, mix(900., 4., pow(rough, .35)))*mix(7., .5, rough) + pow(sd, 6.)*.14); }
vec3 fxEnvSky(vec3 d, float rough){
  float y = d.y, soft = mix(.025, .7, rough);
  vec3 sky = mix(uEnvHorizon, uEnvSky, pow(smoothstep(0., 1., max(y, 0.)), mix(.45, 1., rough)));
  vec3 gnd = mix(uEnvHorizon*.4, uEnvGround, smoothstep(0., .55, -y));
  vec3 c = mix(gnd, sky, smoothstep(-soft, soft, y));
  vec3 fd = normalize(vec3(-uEnvSunDir.z, .3, uEnvSunDir.x));
  c += uEnvSky*pow(max(dot(d, fd), 0.), mix(26., 3., rough))*.7*(1.-rough*.6);
  float st = sin(d.x*4.3 + d.z*2.1 + sin(d.y*6.)*1.3)*sin(d.z*3.7 - d.x*1.9 + d.y*4.);
  c *= 1. + .28*st*(1.-rough)*smoothstep(-.15, .25, y);
  return c; }
vec3 fxEnv(vec3 d, float rough){ return fxEnvSky(d, rough) + fxEnvSun(d, rough); }
vec3 fxAmbient(vec3 n){ return (mix(uEnvGround, uEnvSky, n.y*.5+.5) + uEnvHorizon*.3*(1.-abs(n.y)))*uEnvAmbient; }
vec3 fxDiffuse(vec3 n){ return fxAmbient(n) + uEnvSunColor*max(dot(n, uEnvSunDir), 0.); }
float fxFresnel(float ndv, float f0){ float x = 1.-ndv; float x2 = x*x; return f0 + (1.-f0)*x2*x2*x; }
`;

export const GLSL = {
  hash: GLSL_HASH, value: GLSL_VALUE_NOISE, simplex: GLSL_SIMPLEX, fbm: GLSL_FBM, voronoi: GLSL_VORONOI, noise: GLSL_NOISE,
  fogParsVert: GLSL_FOG_PARS_VERT, fogVert: GLSL_FOG_VERT, fogParsFrag: GLSL_FOG_PARS_FRAG, env: GLSL_ENV,
};

// =====================================================================================
// small helpers
// =====================================================================================

export function fogUniforms() { return THREE.UniformsUtils.clone(THREE.UniformsLib.fog); }

const toColor = (c, fallback) => {
  if (c == null) c = fallback;
  if (c && c.isColor) return c.clone();
  if (Array.isArray(c)) return new THREE.Color(c[0], c[1], c[2]);
  return new THREE.Color(c);
};
const toVec3 = (v, fallback) => {
  if (v == null) v = fallback;
  if (typeof v === 'number') return new THREE.Vector3(v, v, v);
  return v.isVector3 ? v.clone() : new THREE.Vector3(v[0], v[1], v[2]);
};
const toVec2 = (v, fallback) => {
  if (v == null) v = fallback;
  if (typeof v === 'number') return new THREE.Vector2(v, v);
  return v.isVector2 ? v.clone() : new THREE.Vector2(v[0], v[1]);
};
const getRng = (o) => (o && o.rng) || makeRng(1);
const timeUniform = (o) => (o && o.time && typeof o.time === 'object' ? o.time : { value: 0 });

// premultiplied "one, one-minus-src-alpha" blending: alpha = 0 gives additive, alpha = a gives normal
const PREMULT = {
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
  blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
};

function shader({ uniforms, vertexShader, fragmentShader, fog = true, ...rest }) {
  return new THREE.ShaderMaterial({
    uniforms: fog ? { ...fogUniforms(), ...uniforms } : uniforms,
    vertexShader, fragmentShader, fog, ...rest,
  });
}

// unit quad (2 triangles) set up for instancing
function quadGeometry(instances) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.instanceCount = instances;
  return g;
}
const iattr = (g, name, arr, size) => { const a = new THREE.InstancedBufferAttribute(arr, size); g.setAttribute(name, a); return a; };
function fxMesh(geometry, material, renderOrder = 2) {
  const m = new THREE.Mesh(geometry, material);
  m.frustumCulled = false; m.renderOrder = renderOrder; m.matrixAutoUpdate = true;
  return m;
}
// Effects that stay in one place get a hand-made bounding sphere (their vertices move in the shader) and normal culling.
// Culling starts after the mesh has been drawn once, so its program is compiled with the rest of the world on the first
// frame and not in mid-flight when it first swings into view. To opt out of culling set boundingSphere.radius = Infinity.
const NOOP = () => {};
function setBounds(mesh, center, radius) {
  const s = new THREE.Sphere(center.isVector3 ? center.clone() : new THREE.Vector3(center[0], center[1], center[2]), radius);
  mesh.geometry.boundingSphere = s; mesh.frustumCulled = false;
  mesh.onAfterRender = () => { mesh.frustumCulled = true; mesh.onAfterRender = NOOP; };
  return s;
}

// Runs several fx as one: const set = fxGroup([a, b]); scene.add(set.object); set.update(dt, time, camera)
export function fxGroup(items = []) {
  const object = new THREE.Group(); const list = [];
  const api = {
    object, items: list,
    add(item) { if (item) { list.push(item); if (item.object) object.add(item.object); } return item; },
    update(dt, time, camera) { for (const it of list) if (it.update) it.update(dt, time, camera); },
  };
  for (const it of items) api.add(it);
  return api;
}

// =====================================================================================
// PARTICLES
// =====================================================================================

const P_SHAPES = { disc: 0, flake: 1, bubble: 2, sparkle: 3, leaf: 4, petal: 5, streak: 6, ash: 7 };
const P_MODES = { billboard: 0, streak: 1, tumble: 2 };

export const PARTICLE_PRESETS = {
  snow: { count: 5000, box: [70, 46, 70], velocity: [1.2, -1.9, 0.4], velocityRandom: [0.8, 0.9, 0.8], turbulence: [0.55, 0.15, 0.7],
    size: [0.045, 0.14], colors: ['#ffffff', '#eaf2ff', '#d5e4f7'], intensity: 1.1, opacity: 0.92, additive: 0.15, shape: 'flake', near: [0.5, 3] },
  rain: { count: 6000, box: [50, 40, 50], velocity: [2.2, -24, 1], velocityRandom: [0.7, 6, 0.7], turbulence: [0, 0, 0], mode: 'streak', shape: 'streak',
    size: [0.014, 0.026], stretch: 0.04, colors: ['#b9c9dc', '#e2ecf7', '#9fb4cc'], intensity: 0.8, opacity: 0.34, additive: 0.6, near: [1.2, 5] },
  dust: { count: 2600, box: [34, 22, 34], velocity: [0.12, 0.03, 0.06], velocityRandom: [0.12, 0.08, 0.12], turbulence: [0.35, 0.25, 0.3],
    size: [0.02, 0.06], colors: ['#ffe9c2', '#fff6e0', '#ffd9a0'], intensity: 1.6, opacity: 0.75, additive: 1, shape: 'disc', twinkle: 0.7, near: [0.4, 2.5] },
  pollen: { count: 2000, box: [44, 26, 44], velocity: [0.35, 0.12, 0.15], velocityRandom: [0.3, 0.2, 0.3], turbulence: [0.9, 0.5, 0.35],
    size: [0.04, 0.11], colors: ['#fff3b0', '#ffe27a', '#fffbe6'], intensity: 1.5, opacity: 0.8, additive: 0.7, shape: 'disc', twinkle: 0.25, near: [0.6, 3] },
  embers: { count: 1500, box: [40, 30, 40], velocity: [0.6, 2.6, 0.2], velocityRandom: [1.2, 1.6, 1.2], turbulence: [1.1, 0.4, 1.1],
    size: [0.06, 0.2], colors: ['#ff6a1a', '#ffc04a', '#ff3a0c'], intensity: 3, opacity: 1, additive: 1, shape: 'disc', twinkle: 0.6, fadeUp: 0.9, near: [0.5, 2.5] },
  sparks: { count: 900, box: [30, 24, 30], velocity: [0.5, 5.5, 0.2], velocityRandom: [5, 5, 5], turbulence: [0.4, 0.2, 2.2], mode: 'streak', shape: 'streak',
    size: [0.012, 0.03], stretch: 0.07, colors: ['#ffc24a', '#fff0b8', '#ff7a1c'], intensity: 3, opacity: 1, additive: 1, twinkle: 0.5, fadeUp: 0.8, near: [0.5, 2.5] },
  fireflies: { count: 500, box: [64, 16, 64], velocity: [0.1, 0, 0.1], velocityRandom: [0.5, 0.1, 0.5], turbulence: [2.6, 1.1, 0.33],
    size: [0.11, 0.2], colors: ['#d9ff52', '#a6ff38', '#fff18a'], intensity: 2.8, opacity: 1, additive: 1, shape: 'disc', blink: 1.25, near: [0.8, 3.5], minAngle: 0.005 },
  bubbles: { count: 650, box: [46, 34, 46], velocity: [0.15, 1.3, 0.1], velocityRandom: [0.3, 0.9, 0.3], turbulence: [0.45, 0.1, 1.1],
    size: [0.05, 0.3], colors: ['#dff6ff', '#bfeaff', '#ffffff'], intensity: 1.5, opacity: 0.85, additive: 0.85, shape: 'bubble', near: [0.8, 3] },
  petals: { count: 1100, box: [44, 28, 44], velocity: [1.4, -0.95, 0.5], velocityRandom: [0.8, 0.5, 0.8], turbulence: [0.9, 0.3, 0.8], mode: 'tumble', shape: 'petal',
    size: [0.1, 0.2], spin: 2.2, aspect: 0.8, colors: ['#ffc4d6', '#ffe6ee', '#ff9dbb'], intensity: 0.9, opacity: 1, additive: 0, near: [0.6, 2.5] },
  leaves: { count: 700, box: [50, 30, 50], velocity: [1.8, -1.35, 0.6], velocityRandom: [1.1, 0.6, 1.1], turbulence: [1.3, 0.4, 0.7], mode: 'tumble', shape: 'leaf',
    size: [0.16, 0.32], spin: 2.6, aspect: 0.62, colors: ['#e2701a', '#c22f12', '#f0b429'], intensity: 0.75, opacity: 1, additive: 0, near: [0.8, 3] },
  ash: { count: 2400, box: [50, 34, 50], velocity: [0.7, -0.45, 0.25], velocityRandom: [0.5, 0.35, 0.5], turbulence: [0.8, 0.4, 0.5], mode: 'tumble', shape: 'ash',
    size: [0.03, 0.1], spin: 1.6, aspect: 1, colors: ['#8d8782', '#c9c2bb', '#4b4744'], intensity: 0.6, opacity: 0.9, additive: 0, near: [0.5, 2.5] },
  stars: { count: 4500, box: [520, 520, 520], velocity: [0, 0, 0], velocityRandom: [0, 0, 0], turbulence: [0, 0, 0],
    size: [0.25, 0.9], colors: ['#cfe0ff', '#ffffff', '#ffe2b8'], intensity: 2, core: 0.5, opacity: 1, additive: 1, shape: 'sparkle', twinkle: 0.55, near: [6, 30], minAngle: 0.0028, fog: false },
  plankton: { count: 4000, box: [44, 30, 44], velocity: [0.18, 0.05, 0.1], velocityRandom: [0.2, 0.15, 0.2], turbulence: [0.5, 0.4, 0.4],
    size: [0.03, 0.09], colors: ['#58ffe0', '#3aa8ff', '#b8ffb0'], intensity: 2.6, opacity: 1, additive: 1, shape: 'disc', blink: 0.55, twinkle: 0.3, near: [0.4, 2.5] },
  magic: { count: 1300, box: [46, 30, 46], velocity: [0.1, 0.55, 0.1], velocityRandom: [0.5, 0.5, 0.5], turbulence: [1.5, 0.8, 0.8],
    size: [0.05, 0.2], colors: ['#6fe8ff', '#ff7af0', '#ffe08a'], intensity: 2.2, opacity: 1, additive: 1, shape: 'sparkle', twinkle: 0.8, near: [0.8, 3.5], minAngle: 0.003 },
};

const P_VERT = /* glsl */`
uniform float uTime, uAhead, uStretch, uSpin, uBlink, uTwinkle, uMinAngle, uFadeUp, uAspect;
uniform vec3 uBox, uCenter, uFollow, uVel, uVelRand, uTurb;
uniform vec2 uSize, uNear;
attribute vec4 aSeed; attribute vec4 aRand;
varying vec2 vUv; varying vec4 vRand; varying float vAlpha; varying float vH; varying vec3 vN;
${GLSL_FOG_PARS_VERT}
void main(){
  vUv = uv; vRand = aRand; vN = vec3(0.,1.,0.);
  vec3 fwd = -vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
  vec3 c = mix(uCenter, cameraPosition + fwd*uAhead, uFollow);
  float t = uTime, ph = aSeed.w*6.2831853, f = uTurb.z;
  vec3 vel = uVel + (aRand.xyz-.5)*uVelRand;
  vec3 p = aSeed.xyz*uBox + vel*t;
  vec3 wob = vec3(sin(t*f*(.7+aRand.x*.6)+ph) + .5*sin(t*f*1.9+ph*1.7),
                  sin(t*f*(.6+aRand.y*.6)+ph*2.3) + .5*sin(t*f*1.6+ph*.7),
                  cos(t*f*(.8+aRand.z*.6)+ph*1.3) + .5*cos(t*f*2.1+ph*2.9));
  p += wob*uTurb.xyx;
  p = mod(p - c + .5*uBox, uBox) - .5*uBox;
  vec3 e = p/(.5*uBox); e *= e;
  float edge = 1. - smoothstep(.62, 1., sqrt(sqrt(dot(e,e))));
  vH = p.y/uBox.y + .5;
  vec3 world = c + p;
  vec4 mvPosition = viewMatrix*vec4(world,1.);
  float dist = length(mvPosition.xyz);
  float size = mix(uSize.x, uSize.y, aRand.w*aRand.w) * (1. - uFadeUp*vH*.75);
  float k = max(size, uMinAngle*dist);
  float aScale = (size*size)/(k*k);
#if MODE == 1
  vec3 vv = (viewMatrix*vec4(vel,0.)).xyz;
  vec3 ax = normalize(vv + vec3(0.,1e-4,0.));
  vec3 side = normalize(cross(ax, normalize(mvPosition.xyz)));
  float len = max(length(vel)*uStretch, k*2.);
  mvPosition.xyz += ax*position.y*len + side*position.x*k;
#elif MODE == 2
  vec3 ax = normalize(aRand.xyz*2.-1.+vec3(.001,.002,.003));
  float ang = t*uSpin*(.45+aRand.w) + ph + wob.x*.6;
  float ca = cos(ang), sa = sin(ang);
  vec3 lp = vec3(position.x*k*uAspect, position.y*k, 0.);
  lp = lp*ca + cross(ax,lp)*sa + ax*dot(ax,lp)*(1.-ca);
  vec3 n = vec3(0.,0.,1.); n = n*ca + cross(ax,n)*sa + ax*dot(ax,n)*(1.-ca);
  vN = n;
  mvPosition = viewMatrix*vec4(world + lp, 1.);
#else
  float ra = ph + uSpin*t*(aRand.x-.5)*2.;
  float cr = cos(ra), sr = sin(ra);
  mvPosition.xy += mat2(cr,sr,-sr,cr)*position.xy*k;
#endif
  float bl = 1.;
  if(uBlink > 0.){ float s = sin(t*uBlink*(.6+aRand.y*.8) + ph*3.) * sin(t*uBlink*.37*(.5+aRand.x) + ph); bl = smoothstep(-.15,.6,s); bl = mix(.02, 1., bl*bl); }
  bl *= 1. - uTwinkle*(.5+.5*sin(t*(2.5+aRand.z*8.)+ph*5.));
  vAlpha = edge * smoothstep(uNear.x, uNear.y, dist) * aScale * bl * (1. - uFadeUp*smoothstep(.35,1.,vH));
  gl_Position = projectionMatrix*mvPosition;
  if(vAlpha < .003) gl_Position = vec4(2.,2.,2.,1.);
  ${GLSL_FOG_VERT}
}`;

const P_FRAG = /* glsl */`precision highp float;
uniform vec3 uColorA, uColorB, uColorC, uLightDir;
uniform float uIntensity, uOpacity, uAdditive, uCore;
varying vec2 vUv; varying vec4 vRand; varying float vAlpha; varying float vH; varying vec3 vN;
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FOG_PARS_FRAG}
void main(){
  vec2 q = vUv*2.-1.; float r = length(q);
  float z = vRand.z;
  vec3 col = z < .5 ? mix(uColorA, uColorB, z*2.) : mix(uColorB, uColorC, z*2.-1.);
  float a = 0.;
#if SHAPE == 0
  float g = max(1.-r*r, 0.); a = g*g*g; col *= 1. + uCore*a*a;
#elif SHAPE == 1
  float rr = r*(1. + .1*cos(6.*atan(q.y,q.x)));
  a = smoothstep(1., .2, rr); a *= .55 + .45*smoothstep(.7, 0., rr);
#elif SHAPE == 2
  float rim = smoothstep(.55,.93,r)*smoothstep(1.,.95,r);
  float fill = .05*smoothstep(1.,.92,r);
  vec2 h1 = q - vec2(-.36,.42), h2 = q - vec2(.34,-.44);
  float hl = exp(-dot(h1,h1)*26.) + .35*exp(-dot(h2,h2)*40.);
  vec3 film = .55 + .45*cos(6.2831853*(r*1.2 + vRand.x + vec3(0.,.33,.67)));
  col = mix(col, col*film*1.6, .45*rim) + hl*1.5;
  a = rim*.5 + fill + hl;
#elif SHAPE == 3
  float g = max(1.-r*r, 0.); g = g*g*g;
  vec2 aq = abs(q);
  float sp = exp(-aq.x*22.)*exp(-aq.y*2.6) + exp(-aq.y*22.)*exp(-aq.x*2.6);
  a = (g*g*1.2 + sp*.9 + g*.25) * (1.-smoothstep(.7,1.,r)); col *= 1. + uCore*g*g;
#elif SHAPE == 4
  float w = .56*(1.-q.y*q.y)*(1.-.22*q.y);
  float d = abs(q.x) - w;
  a = smoothstep(.05,-.05,d);
  col *= .72 + .28*smoothstep(0.,.1,abs(q.x));
  col *= .9 + .1*sin((abs(q.x)*1.6 - q.y)*17.);
  col *= mix(.8, 1.15, vRand.x);
#elif SHAPE == 5
  float w = .66*sqrt(max(1.-q.y*q.y,0.))*(.72+.34*q.y) - .1*exp(-q.x*q.x*30.)*smoothstep(.6,1.,q.y);
  float d = abs(q.x) - w;
  a = smoothstep(.06,-.06,d);
  col = mix(min(col*1.25+.08, vec3(1.)), col, smoothstep(-1.,.5,q.y));
  col *= .93 + .07*sin(abs(q.x)*26.);
#elif SHAPE == 6
  float ac = max(1.-q.x*q.x,0.);
  a = ac*ac * pow(clamp(vUv.y,0.,1.), 1.6) * smoothstep(1.,.86,vUv.y);
  col *= 1. + uCore*a;
#else
  float n = vnoise(q*2.4 + vRand.xy*37.);
  a = smoothstep(.12,-.08, r - .38 - .55*n);
  col *= .7 + .6*vnoise(q*5. + vRand.yx*11.);
#endif
#if MODE == 2
  float nl = dot(normalize(vN), uLightDir);
  col *= .42 + .5*abs(nl) + .28*max(nl,0.);
#endif
  a *= vAlpha*uOpacity;
  if(a < .003) discard;
  col = fxFogMix(col*uIntensity, uAdditive);
  gl_FragColor = vec4(col*a, a*(1.-uAdditive));
}`;

// Endless particle field that wraps around the camera. One draw call, 2 triangles per particle.
export function makeParticles(opts = {}) {
  const rng = getRng(opts);
  const o = { ...(PARTICLE_PRESETS[opts.preset || 'dust'] || PARTICLE_PRESETS.dust), ...opts };
  const count = Math.max(1, Math.round(o.count * (o.density ?? 1)));
  const g = quadGeometry(count);
  const seed = new Float32Array(count * 4), rand = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) { seed[i] = rng(); rand[i] = rng(); }
  iattr(g, 'aSeed', seed, 4); iattr(g, 'aRand', rand, 4);
  const colors = opts.colors || (opts.color != null ? [opts.color, opts.color, opts.color] : o.colors) || ['#ffffff'];
  const follow = o.follow === false ? [0, 0, 0] : o.follow === 'xz' ? [1, 0, 1] : [1, 1, 1];
  const box = toVec3(o.box);
  const uniforms = {
    uTime: timeUniform(o),
    uBox: { value: box }, uCenter: { value: toVec3(o.center, [0, 0, 0]) }, uFollow: { value: new THREE.Vector3(...follow) },
    uAhead: { value: o.ahead ?? box.z * 0.3 },
    uVel: { value: toVec3(o.velocity, [0, 0, 0]) }, uVelRand: { value: toVec3(o.velocityRandom, [0, 0, 0]) },
    uTurb: { value: toVec3(o.turbulence, [0, 0, 0]) },
    uSize: { value: toVec2(o.size, [0.05, 0.1]) }, uNear: { value: toVec2(o.near, [0.5, 3]) },
    uStretch: { value: o.stretch ?? 0.04 }, uSpin: { value: o.spin ?? 0 }, uBlink: { value: o.blink ?? 0 }, uTwinkle: { value: o.twinkle ?? 0 },
    uMinAngle: { value: o.minAngle ?? 0.0022 }, uFadeUp: { value: o.fadeUp ?? 0 }, uAspect: { value: o.aspect ?? 1 },
    uColorA: { value: toColor(colors[0], '#ffffff') }, uColorB: { value: toColor(colors[1] ?? colors[0], '#ffffff') }, uColorC: { value: toColor(colors[2] ?? colors[0], '#ffffff') },
    uIntensity: { value: o.intensity ?? 1 }, uOpacity: { value: o.opacity ?? 1 }, uAdditive: { value: o.additive ?? 1 }, uCore: { value: o.core ?? 0.6 },
    uLightDir: { value: toVec3(o.lightDir, [0.4, 0.8, 0.45]).normalize() },
  };
  const material = shader({
    uniforms, vertexShader: P_VERT, fragmentShader: P_FRAG, fog: o.fog !== false,
    defines: { MODE: P_MODES[o.mode || 'billboard'] ?? 0, SHAPE: P_SHAPES[o.shape || 'disc'] ?? 0 },
    transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT,
  });
  const object = fxMesh(g, material, o.renderOrder ?? 3);
  // a box that does not follow the camera is culled like any other object (the sphere tracks uniforms.uCenter in update)
  const turb = uniforms.uTurb.value, bounds = o.follow === false
    ? setBounds(object, uniforms.uCenter.value, box.length() * 0.5 + (Math.abs(turb.x) + Math.abs(turb.y)) * 1.5 + uniforms.uSize.value.y * 2 + (o.mode === 'streak' ? uniforms.uVel.value.length() * uniforms.uStretch.value : 0)) : null;
  return {
    object, uniforms, material, count,
    update(dt, time) { uniforms.uTime.value = time; if (bounds) bounds.center.copy(uniforms.uCenter.value); },
    // at zero nothing is drawn, but the mesh stays in the render list so its program is compiled up front
    setOpacity(v) { uniforms.uOpacity.value = v; g.instanceCount = v > 0.002 ? count : 0; },
  };
}

// =====================================================================================
// LIGHT: glows, god rays, lightning, aurora, rainbow, flare
// =====================================================================================

const GLOW_VERT = /* glsl */`
uniform float uTime, uSize, uMinAngle, uFlicker, uDepthBias; uniform vec2 uNear;
attribute vec3 aPos; attribute vec4 aColor; attribute float aPhase;
varying vec2 vUv; varying vec3 vColor; varying float vA;
${GLSL_FOG_PARS_VERT}
void main(){
  vUv = uv; vColor = aColor.rgb;
  vec4 mvPosition = modelViewMatrix*vec4(aPos,1.);
  float dist = length(mvPosition.xyz);
  float size = uSize*aColor.a;
  float k = max(size, uMinAngle*dist);
  float fl = sin(uTime*(7.+aPhase*9.)+aPhase*40.)*sin(uTime*3.1+aPhase*17.) + .5*sin(uTime*23.+aPhase*90.);
  vA = max((size*size)/(k*k), .12) * (1. - uFlicker*(.5+.33*fl)) * smoothstep(uNear.x*size, uNear.y*size, dist);
  vec4 q = mvPosition; q.xy += position.xy*k;
  gl_Position = projectionMatrix*q;
  vec4 pb = projectionMatrix*(q + vec4(0.,0.,min(uDepthBias*size, dist*.5),0.));
  gl_Position.z = pb.z/pb.w*gl_Position.w;
  if(aColor.a <= 0.) gl_Position = vec4(2.,2.,2.,1.);
  ${GLSL_FOG_VERT}
}`;
const GLOW_FRAG = /* glsl */`precision highp float;
uniform float uIntensity, uRays, uSpikes, uHalo, uCore, uTime, uFogAmount;
varying vec2 vUv; varying vec3 vColor; varying float vA;
${GLSL_FOG_PARS_FRAG}
void main(){
  vec2 q = vUv*2.-1.; float r = length(q);
  float w = max(1.-r, 0.); w = w*w*(3.-2.*w);
  float core = exp(-r*r*70.)*uCore;
  float mid = exp(-r*6.5)*.55;
  float halo = w*w*uHalo*.22;
  float I = core + (mid + halo)*w;
  if(uRays > 0.){ float an = atan(q.y,q.x);
    float ry = pow(.5+.5*cos(an*uRays + sin(uTime*.3)*.4), 5.) + .6*pow(.5+.5*cos(an*uRays*2.3 + 1.7 - uTime*.11), 9.);
    I += ry*exp(-r*3.2)*w*.5; }
  if(uSpikes > 0.){ vec2 aq = abs(q); I += (exp(-aq.y*34.)*exp(-aq.x*2.4) + exp(-aq.x*34.)*exp(-aq.y*2.4))*w*uSpikes; }
  vec3 col = (vColor*I + vec3(core)*.6) * vA * uIntensity;
  col *= 1. - fxFog()*uFogAmount;
  gl_FragColor = vec4(col, 0.);
}`;

// Thousands of camera-facing glow sprites in one draw call (2 triangles each).
export function makeGlows(opts = {}) {
  const rng = getRng(opts);
  let positions = opts.positions;
  if (!positions) {
    const n = opts.count ?? 60, area = toVec3(opts.area, [80, 20, 80]);
    positions = []; for (let i = 0; i < n; i++) positions.push([(rng() - 0.5) * area.x, (rng() - 0.5) * area.y, (rng() - 0.5) * area.z]);
  }
  const flat = positions instanceof Float32Array;
  const count = flat ? positions.length / 3 : positions.length;
  const g = quadGeometry(count);
  const pos = new Float32Array(count * 3), col = new Float32Array(count * 4), ph = new Float32Array(count);
  const base = toColor(opts.color, '#ffd9a0'), tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    if (flat) { pos[i * 3] = positions[i * 3]; pos[i * 3 + 1] = positions[i * 3 + 1]; pos[i * 3 + 2] = positions[i * 3 + 2]; }
    else { const p = positions[i]; if (p.isVector3) { pos[i * 3] = p.x; pos[i * 3 + 1] = p.y; pos[i * 3 + 2] = p.z; } else { pos[i * 3] = p[0]; pos[i * 3 + 1] = p[1]; pos[i * 3 + 2] = p[2]; } }
    const c = opts.colors ? tmp.copy(toColor(Array.isArray(opts.colors) ? opts.colors[i % opts.colors.length] : opts.colors)) : tmp.copy(base);
    col[i * 4] = c.r; col[i * 4 + 1] = c.g; col[i * 4 + 2] = c.b;
    col[i * 4 + 3] = opts.sizes ? opts.sizes[i % opts.sizes.length] : 1 + (opts.sizeJitter ?? 0) * (rng() - 0.5) * 2;
    ph[i] = rng();
  }
  const aPos = iattr(g, 'aPos', pos, 3), aColor = iattr(g, 'aColor', col, 4); iattr(g, 'aPhase', ph, 1);
  const uniforms = {
    uTime: timeUniform(opts), uSize: { value: opts.size ?? 3 }, uIntensity: { value: opts.intensity ?? 2.2 },
    uMinAngle: { value: opts.minAngle ?? 0.004 }, uFlicker: { value: opts.flicker ?? 0 }, uDepthBias: { value: opts.depthBias ?? 0.25 },
    uNear: { value: toVec2(opts.near, [0.25, 1.5]) }, uRays: { value: opts.rays ?? 0 }, uSpikes: { value: opts.spikes ?? 0 },
    uHalo: { value: opts.halo ?? 1 }, uCore: { value: opts.core ?? 1 }, uFogAmount: { value: opts.fogAmount ?? 1 },
  };
  const material = shader({ uniforms, vertexShader: GLOW_VERT, fragmentShader: GLOW_FRAG, fog: opts.fog !== false,
    transparent: true, depthWrite: false, depthTest: opts.depthTest !== false, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 4);
  // culled by a sphere around the positions, padded by the largest sprite; setPosition / setSize keep it up to date
  const hull = new THREE.Sphere(), v = new THREE.Vector3(), box3 = new THREE.Box3();
  let maxMul = 0;
  for (let i = 0; i < count; i++) { box3.expandByPoint(v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])); maxMul = Math.max(maxMul, col[i * 4 + 3]); }
  box3.getBoundingSphere(hull);
  const bounds = setBounds(object, hull.center, hull.radius);
  const fit = () => { bounds.center.copy(hull.center); bounds.radius = hull.radius + uniforms.uSize.value * maxMul * 1.2 + 2; };
  fit();
  return {
    object, uniforms, material, count,
    update(dt, time) { uniforms.uTime.value = time; },
    setPosition(i, x, y, z) { if (x.isVector3) v.copy(x); else v.set(x, y, z); aPos.setXYZ(i, v.x, v.y, v.z); aPos.needsUpdate = true; hull.expandByPoint(v); fit(); },
    setColor(i, c) { const k = toColor(c); aColor.setXYZ(i, k.r, k.g, k.b); aColor.needsUpdate = true; },
    setSize(i, s) { aColor.setW(i, s); aColor.needsUpdate = true; if (s > maxMul) { maxMul = s; fit(); } },
  };
}

// One glow / halo. Move it with glow.object.position.
export function makeGlow(opts = {}) {
  const gl = makeGlows({ rays: 0, ...opts, positions: [[0, 0, 0]], colors: null, sizes: null });
  gl.object.position.copy(toVec3(opts.position, [0, 0, 0]));
  return gl;
}

// ---------- god rays ----------
const RAY_VERT = /* glsl */`
uniform vec3 uDir; uniform float uLength, uMinAngle; uniform vec2 uWidth, uNear, uFar;
attribute vec3 aOrigin; attribute vec4 aParam;
varying vec2 vUv; varying vec4 vParam; varying float vFade;
${GLSL_FOG_PARS_VERT}
void main(){
  vUv = uv; vParam = aParam;
  vec3 o = (modelMatrix*vec4(aOrigin,1.)).xyz;
  vec3 d = normalize(mat3(modelMatrix)*uDir);
  float s = uv.y, L = uLength*aParam.y;
  vec3 pc = o + d*s*L;
  vec3 toCam = cameraPosition - pc;
  vec3 side = normalize(cross(d, toCam));
  float w = mix(uWidth.x, uWidth.y, s)*aParam.x;
  float k = max(w, uMinAngle*length(toCam));               // never thinner than a few pixels: widen and dim instead
  vec3 world = pc + side*position.x*2.*k;
  vec3 oc = cameraPosition - o; float tt = clamp(dot(oc,d), 0., L);
  float dAxis = length(oc - d*tt);
  float wHere = mix(uWidth.x, uWidth.y, tt/L)*aParam.x;
  float along = abs(dot(d, normalize(cameraPosition - (o + d*L*.5))));
  vFade = smoothstep(uNear.x*wHere, uNear.y*wHere, dAxis) * (1. - smoothstep(.8, .985, along)) * (1. - smoothstep(uFar.x, uFar.y, dAxis)) * (w/k);
  vec4 mvPosition = viewMatrix*vec4(world,1.);
  gl_Position = projectionMatrix*mvPosition;
  ${GLSL_FOG_VERT}
}`;
const RAY_FRAG = /* glsl */`precision highp float;
uniform vec3 uColor; uniform float uIntensity, uTime, uFalloff, uSpeed, uFogAmount;
varying vec2 vUv; varying vec4 vParam; varying float vFade;
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_FOG_PARS_FRAG}
void main(){
  float x = vUv.x*2.-1., s = vUv.y, ph = vParam.z;
  float across = max(1.-x*x, 0.); across *= across;
  float along = smoothstep(0., .1, s) * pow(max(1.-s, 0.), uFalloff);
  float n = fbmLo(vec2(x*1.3 + ph*23., s*2.5 - uTime*uSpeed*.12 + ph*7.));
  float fine = vnoise(vec2(x*5. + ph*61., uTime*uSpeed*.22 + ph*13.));
  float shimmer = .7 + .3*sin(uTime*uSpeed*(.35+ph*.5) + ph*20.);
  float I = across*along*(.45 + .75*n)*(.75 + .5*fine)*shimmer*vParam.w*vFade*uIntensity;
  vec3 col = uColor*I*(1. - fxFog()*uFogAmount);
  gl_FragColor = vec4(col, 0.);
}`;

// Additive light shafts that leave a source patch along `direction`. One draw call, 2 triangles per shaft.
export function makeGodRays(opts = {}) {
  const rng = getRng(opts);
  const count = opts.count ?? 16, radius = opts.radius ?? 26;
  const dir = toVec3(opts.direction, [0.35, -1, 0.2]).normalize();
  const g = quadGeometry(count);
  const e1 = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(dir, e1).normalize();
  const org = new Float32Array(count * 3), par = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const a = rng() * Math.PI * 2, r = Math.sqrt(rng()) * radius;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    org[i * 3] = e1.x * x + e2.x * y; org[i * 3 + 1] = e1.y * x + e2.y * y; org[i * 3 + 2] = e1.z * x + e2.z * y;
    par[i * 4] = 0.5 + rng() * 1.1; par[i * 4 + 1] = 0.6 + rng() * 0.4; par[i * 4 + 2] = rng(); par[i * 4 + 3] = 0.35 + rng() * 0.65;
  }
  iattr(g, 'aOrigin', org, 3); iattr(g, 'aParam', par, 4);
  const uniforms = {
    uTime: timeUniform(opts), uDir: { value: dir }, uLength: { value: opts.length ?? 90 },
    uWidth: { value: toVec2(opts.width, [2.4, 8]) }, uNear: { value: toVec2(opts.near, [0.6, 3]) }, uFar: { value: toVec2(opts.far, [1e6, 2e6]) },
    uColor: { value: toColor(opts.color, '#ffe2b0') }, uIntensity: { value: opts.intensity ?? 0.3 },
    uFalloff: { value: opts.falloff ?? 1.3 }, uSpeed: { value: opts.speed ?? 1 }, uFogAmount: { value: opts.fogAmount ?? 0.6 }, uMinAngle: { value: opts.minAngle ?? 0.006 },
  };
  const material = shader({ uniforms, vertexShader: RAY_VERT, fragmentShader: RAY_FRAG, fog: opts.fog !== false,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 3);
  object.position.copy(toVec3(opts.position, [0, 60, 0]));
  const L = uniforms.uLength.value;
  setBounds(object, dir.clone().multiplyScalar(L * 0.5), L * 0.5 + radius + uniforms.uWidth.value.y * 3.4);
  return { object, uniforms, material, count, update(dt, time) { uniforms.uTime.value = time; } };
}

// ---------- lightning ----------
const BOLT_VERT = /* glsl */`
uniform float uActive, uFlash, uWidth, uMinAngle;
attribute vec3 aTan; attribute vec4 aInfo;
varying float vSide; varying float vBright;
${GLSL_FOG_PARS_VERT}
void main(){
  vSide = uv.x; vBright = aInfo.w;
  vec4 mvPosition = modelViewMatrix*vec4(position,1.);
  vec3 tv = normalize(mat3(modelViewMatrix)*aTan);
  vec3 side = normalize(cross(tv, normalize(mvPosition.xyz)));
  float w = max(aInfo.x*uWidth, uMinAngle*length(mvPosition.xyz)*aInfo.x) * 7.;
  mvPosition.xyz += side*uv.x*w;
  gl_Position = projectionMatrix*mvPosition;
  if(abs(aInfo.y-uActive) > .5 || uFlash < .004) gl_Position = vec4(2.,2.,2.,1.);
  ${GLSL_FOG_VERT}
}`;
const BOLT_FRAG = /* glsl */`precision highp float;
uniform vec3 uColor; uniform float uFlash, uIntensity, uFogAmount;
varying float vSide; varying float vBright;
${GLSL_FOG_PARS_FRAG}
void main(){
  float x = abs(vSide);
  float core = exp(-x*x*110.);
  float glow = exp(-x*5.5)*(1.-x)*.2;
  vec3 col = (vec3(1.)*core*2.2 + uColor*(glow + core*.8)) * vBright * uFlash * uIntensity;
  gl_FragColor = vec4(col*(1. - fxFog()*uFogAmount), 0.);
}`;

function boltPolyline(rng, a, b, levels, jag) {
  let pts = [a, b]; let disp = a.distanceTo(b) * jag;
  const dir = new THREE.Vector3().subVectors(b, a).normalize();
  const e1 = new THREE.Vector3().crossVectors(dir, Math.abs(dir.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(dir, e1);
  for (let l = 0; l < levels; l++) {
    const next = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const m = new THREE.Vector3().addVectors(pts[i], pts[i + 1]).multiplyScalar(0.5);
      m.addScaledVector(e1, (rng() - 0.5) * 2 * disp).addScaledVector(e2, (rng() - 0.5) * 2 * disp);
      next.push(m, pts[i + 1]);
    }
    pts = next; disp *= 0.5;
  }
  return pts;
}

// Branching bolts that flash on a seeded schedule, with a point light pulse. 2 draw calls while a bolt is lit, none between
// (after one warm-up frame).
// api.flash (0..1) is the current brightness: use it to pulse your sky / ambient light. The PointLight stays in the
// scene at intensity 0 between strikes, so the light count (and every lit material's program) never changes.
export function makeLightning(opts = {}) {
  const rng = getRng(opts);
  const from = toVec3(opts.from, [0, 220, 0]), to = toVec3(opts.to, [20, 0, 10]);
  const variants = opts.variants ?? 5, jag = opts.jaggedness ?? 0.13, nBranch = opts.branches ?? 5;
  const P = [], T = [], U = [], I = [], idx = [];
  const addLine = (pts, width, variant, bright, taper) => {
    const base = P.length / 3, n = pts.length, t = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      t.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
      const w = width * (taper ? 1 - 0.75 * (i / (n - 1)) : 1), br = bright * (taper ? 1 - 0.6 * (i / (n - 1)) : 1);
      for (const s of [-1, 1]) { P.push(pts[i].x, pts[i].y, pts[i].z); T.push(t.x, t.y, t.z); U.push(s, i / (n - 1)); I.push(w, variant, 0, br); }
      if (i < n - 1) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  };
  const len = from.distanceTo(to);
  for (let v = 0; v < variants; v++) {
    const r = rng.fork ? rng.fork('bolt' + v) : rng;
    const end = to.clone().add(new THREE.Vector3((r() - 0.5) * len * 0.3, 0, (r() - 0.5) * len * 0.3));
    const trunk = boltPolyline(r, from, end, 6, jag);
    addLine(trunk, 1, v, 1, false);
    for (let b = 0; b < nBranch; b++) {
      const i0 = Math.floor((0.08 + r() * 0.7) * (trunk.length - 1));
      const p0 = trunk[i0], rest = 1 - i0 / (trunk.length - 1);
      const d = new THREE.Vector3().subVectors(end, from).normalize();
      d.x += (r() - 0.5) * 1.5; d.z += (r() - 0.5) * 1.5; d.y *= 0.7 + r() * 0.5; d.normalize();
      const bl = len * rest * (0.22 + r() * 0.4);
      const bEnd = p0.clone().addScaledVector(d, bl);
      const br = boltPolyline(r, p0, bEnd, 4, jag * 1.5);
      addLine(br, 0.5, v, 0.5, true);
      if (r() < 0.6) {
        const j0 = Math.floor((0.3 + r() * 0.5) * (br.length - 1)), q0 = br[j0];
        const d2 = d.clone(); d2.x += (r() - 0.5) * 1.4; d2.z += (r() - 0.5) * 1.4; d2.normalize();
        addLine(boltPolyline(r, q0, q0.clone().addScaledVector(d2, bl * 0.45), 3, jag * 1.6), 0.3, v, 0.3, true);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aTan', new THREE.Float32BufferAttribute(T, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4));
  g.setIndex(idx);
  const color = toColor(opts.color, '#a9c4ff');
  const fogAmount = opts.fogAmount ?? 0.5;
  const uniforms = {
    uActive: { value: 0 }, uFlash: { value: 0 }, uWidth: { value: opts.width ?? len * 0.0022 }, uMinAngle: { value: 0.0011 },
    uColor: { value: color }, uIntensity: { value: opts.intensity ?? 6 }, uFogAmount: { value: fogAmount },
  };
  const material = shader({ uniforms, vertexShader: BOLT_VERT, fragmentShader: BOLT_FRAG, fog: opts.fog !== false, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const bolt = fxMesh(g, material, 5);
  const object = new THREE.Group(); object.add(bolt);
  const origin = toVec3(opts.position, [0, 0, 0]); object.position.copy(origin);
  const glow = makeGlows({ positions: [from, to.clone().lerp(from, 0.03)], color, sizes: [len * 0.9, len * 0.35], size: 1, intensity: 0, near: [0.02, 0.1], minAngle: 0, depthBias: 0.05, fog: opts.fog !== false, fogAmount });
  object.add(glow.object);
  let light = null;
  if (opts.light !== false) {
    light = new THREE.PointLight(color, 0, opts.lightDistance ?? len * 3, opts.lightDecay ?? 1.2);
    light.position.copy(from).lerp(to, 0.45); object.add(light);
  }
  const interval = opts.interval ?? 4.5, area = opts.area ?? 0, lightIntensity = opts.lightIntensity ?? 900;
  const seed = rng() * 1000;
  let warm = false; bolt.onAfterRender = () => { warm = true; bolt.onAfterRender = NOOP; };   // drawn once up front, so the first strike never compiles a shader
  const h = (k, j) => { const x = Math.sin(k * 127.1 + j * 311.7 + seed) * 43758.5453; return x - Math.floor(x); };
  const startOf = (k) => (k + 0.1 + 0.55 * h(k, 1)) * interval;       // schedule time at which strike k begins
  const api = {
    object, uniforms, material, light, bolt, glow, flash: 0, strike: 0, offset: opts.offset ?? 0, triangles: idx.length / 3,
    // world time of the first strike that starts at or after `time` (the schedule is a pure function of time + api.offset)
    nextStrike(time) {
      const tt = time + api.offset; let k = Math.floor(tt / interval) - 1;
      for (let i = 0; i < 4; i++, k++) { const t0 = startOf(k); if (t0 >= tt) return t0 - api.offset; }
      return time;
    },
    update(dt, time) {
      const tt = time + api.offset, k = Math.floor(tt / interval), d = tt - startOf(k);
      let f = 0;
      if (d >= 0 && d < 0.95) {                                        // 50 ms return stroke, then two fading restrikes
        const s2 = 0.14 + 0.08 * h(k, 2), s3 = s2 + 0.09 + 0.1 * h(k, 3);
        f = Math.exp(-Math.max(d - 0.05, 0) * 13);
        if (d > s2) f += 0.7 * Math.exp(-(d - s2) * 16);
        if (d > s3) f += 0.5 * Math.exp(-(d - s3) * 9);
        f = Math.min(1, f) * (0.88 + 0.12 * Math.sin(d * 140));
      }
      api.flash = f; api.strike = k;
      uniforms.uFlash.value = f; uniforms.uActive.value = Math.floor(h(k, 4) * variants);
      if (area > 0) { object.position.set(origin.x + (h(k, 5) - 0.5) * area, origin.y, origin.z + (h(k, 6) - 0.5) * area); object.rotation.y = h(k, 7) * Math.PI * 2; }
      glow.uniforms.uIntensity.value = f * (opts.glow ?? 0.5);
      if (light) light.intensity = f * lightIntensity;
      bolt.visible = glow.object.visible = f > 0.004 || !warm;         // never hide `object`: it holds the light
    },
  };
  return api;
}

// ---------- aurora ----------
const AURORA_VERT = /* glsl */`
uniform float uTime, uFold, uFollow, uSpeed;
attribute vec3 aNrm; attribute float aPhase;
varying vec2 vUv; varying float vPhase;
void main(){
  vUv = uv; vPhase = aPhase;
  float u = uv.x, t = uTime*uSpeed, ph = aPhase*6.2831853;
  float fold = sin(u*15. + t*.23 + ph) + .45*sin(u*33. - t*.37 + ph*2.1) + 1.5*sin(u*5.3 + t*.11 + ph*.7);
  vec3 p = position + aNrm*fold*uFold*(.55+.45*uv.y);
  p.y += sin(u*8. + t*.17 + ph)*uFold*.35;
  vec4 w = modelMatrix*vec4(p,1.); w.xyz += cameraPosition*uFollow;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const AURORA_FRAG = /* glsl */`precision highp float;
uniform vec3 uColorA, uColorB, uColorC; uniform float uTime, uIntensity, uSpeed, uRays;
varying vec2 vUv; varying float vPhase;
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}
void main(){
  float u = vUv.x, v = vUv.y, t = uTime*uSpeed, ph = vPhase*37.;
  float n1 = vnoise(vec2(u*uRays + t*.22 + ph, ph*.3 + t*.03));
  float n2 = vnoise(vec2(u*uRays*3.1 - t*.4 + ph*2., v*2. + ph));
  float n3 = vnoise(vec2(u*uRays*.31 + t*.07, ph + 3.));
  float slow = fbmLo(vec2(u*5. + t*.045 + ph, ph*.7 - t*.02));
  float curtain = (.3 + .7*n1*n1*1.6) * (.65 + .35*n2);
  float top = pow(max(1.-v, 0.), 2.6 - 1.7*n3)*smoothstep(1., .8, v);
  float lo = .03 + .1*n3 + .05*n1;
  float bottom = smoothstep(lo*.3, lo + .06, v);
  float ends = smoothstep(0., .1, u)*smoothstep(1., .9, u);
  float I = bottom*top*curtain*smoothstep(.22,.72,slow)*ends;
  vec3 col = mix(uColorA, uColorB, smoothstep(.12, .8, v + (n1-.5)*.35));
  col = mix(uColorC, col, smoothstep(lo*.3, lo + .14, v));
  gl_FragColor = vec4(col*I*uIntensity, 0.);
}`;

// Aurora curtains in the sky (follows the camera unless follow: false). One draw call, ~1k triangles.
export function makeAuroraRibbon(opts = {}) {
  const rng = getRng(opts);
  const count = opts.count ?? 3, SEG = opts.segments ?? 160;
  const radius = opts.radius ?? 1400, altitude = opts.altitude ?? 260, height = opts.height ?? 560;
  const arc = opts.arc ?? 2.6, heading = opts.heading ?? 0;
  const P = [], N = [], U = [], PH = [], idx = [];
  for (let c = 0; c < count; c++) {
    const r = radius * (0.72 + 0.56 * (count > 1 ? c / (count - 1) : 0.5)) * (0.94 + rng() * 0.12);
    const a0 = heading - arc / 2 + (rng() - 0.5) * 0.5, a1 = a0 + arc * (0.75 + rng() * 0.3);
    const w1 = rng() * 6.28, w2 = rng() * 6.28, alt = altitude * (0.85 + rng() * 0.4), hh = height * (0.75 + rng() * 0.5), ph = rng();
    const base = P.length / 3;
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG, a = a0 + (a1 - a0) * u;
      const rr = r * (1 + 0.1 * Math.sin(u * 5 + w1) + 0.05 * Math.sin(u * 13 + w2));
      const x = Math.sin(a) * rr, z = -Math.cos(a) * rr, y = alt * (1 + 0.25 * Math.sin(u * 3.1 + w2));
      for (let j = 0; j < 2; j++) { P.push(x * (1 - j * 0.08), y + j * hh, z * (1 - j * 0.08)); N.push(Math.sin(a), 0, -Math.cos(a)); U.push(u, j); PH.push(ph); }
      if (i < SEG) { const k = base + i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aNrm', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setAttribute('aPhase', new THREE.Float32BufferAttribute(PH, 1)); g.setIndex(idx);
  const colors = opts.colors || ['#3dff9a', '#8a4dff', '#ff6fa8'];
  const uniforms = {
    uTime: timeUniform(opts), uFold: { value: opts.fold ?? radius * 0.045 }, uFollow: { value: opts.follow === false ? 0 : 1 },
    uSpeed: { value: opts.speed ?? 1 }, uRays: { value: opts.rays ?? 70 }, uIntensity: { value: opts.intensity ?? 1.5 },
    uColorA: { value: toColor(colors[0]) }, uColorB: { value: toColor(colors[1]) }, uColorC: { value: toColor(colors[2] ?? colors[0]) },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: AURORA_VERT, fragmentShader: AURORA_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 0);
  return { object, uniforms, material, triangles: idx.length / 3, update(dt, time) { uniforms.uTime.value = time; } };
}

// ---------- rainbow ----------
const RAINBOW_VERT = /* glsl */`
uniform float uFollow; attribute float aBand; varying vec2 vUv; varying float vBand; varying float vY;
void main(){ vUv = uv; vBand = aBand; vY = normalize(mat3(modelMatrix)*position).y;
  vec4 w = modelMatrix*vec4(position,1.); w.xyz += cameraPosition*uFollow; gl_Position = projectionMatrix*viewMatrix*w; }`;
const RAINBOW_FRAG = /* glsl */`precision highp float;
uniform float uIntensity, uHorizon, uInner; varying vec2 vUv; varying float vBand; varying float vY;
vec3 spectrum(float x){
  return vec3(smoothstep(.42,.78,x) + .32*(1.-smoothstep(0.,.2,x)),
              smoothstep(.1,.42,x)*(1.-smoothstep(.7,.98,x)),
              1.-smoothstep(.28,.58,x)); }
void main(){
  float v = vUv.y; vec3 col; float a;
  if(vBand < .5){
    float x = (v-.62)/.3;
    float band = smoothstep(0.,.18,x)*smoothstep(1.,.8,x);
    col = spectrum(clamp(x,0.,1.))*band + vec3(.8,.9,1.)*uInner*smoothstep(0.,.72,v)*(1.-smoothstep(.72,.8,v))*v;
    a = 1.;
  } else {
    float x = (v-.1)/.8;
    col = spectrum(clamp(1.-x,0.,1.))*smoothstep(0.,.25,x)*smoothstep(1.,.75,x); a = .2;
  }
  a *= smoothstep(uHorizon-.02, uHorizon+.2, vY);
  gl_FragColor = vec4(col*a*uIntensity, 0.);
}`;

// Primary + secondary bow around the antisolar point. Follows the camera. One draw call, ~500 triangles.
export function makeRainbow(opts = {}) {
  const sun = toVec3(opts.sunDir, [0.3, 0.45, 0.8]).normalize();
  const axis = sun.clone().negate(), R = opts.radius ?? 2400, SEG = opts.segments ?? 128;
  const e1 = new THREE.Vector3().crossVectors(axis, Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(axis, e1).normalize();
  const P = [], U = [], B = [], idx = [], d = new THREE.Vector3(), DEG = Math.PI / 180;
  const band = (t0, t1, id) => {
    const base = P.length / 3;
    for (let i = 0; i <= SEG; i++) {
      const phi = (i / SEG) * Math.PI * 2;
      for (let j = 0; j < 2; j++) {
        const th = (j ? t1 : t0) * DEG;
        d.copy(axis).multiplyScalar(Math.cos(th)).addScaledVector(e1, Math.cos(phi) * Math.sin(th)).addScaledVector(e2, Math.sin(phi) * Math.sin(th));
        P.push(d.x * R, d.y * R, d.z * R); U.push(i / SEG, j); B.push(id);
      }
      if (i < SEG) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  };
  const w = opts.width ?? 1;
  band(42.4 - 9 * w, 42.4 + 0.75 * w, 0);
  if (opts.secondary !== false) band(51.5 - 2.2 * w, 51.5 + 2.2 * w, 1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setAttribute('aBand', new THREE.Float32BufferAttribute(B, 1)); g.setIndex(idx);
  const uniforms = { uIntensity: { value: opts.intensity ?? 0.22 }, uHorizon: { value: opts.horizon ?? 0 }, uInner: { value: opts.inner ?? 0.12 }, uFollow: { value: opts.follow === false ? 0 : 1 } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: RAINBOW_VERT, fragmentShader: RAINBOW_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 0);
  return { object, uniforms, material, triangles: idx.length / 3, update() {} };
}

// ---------- flare ----------
const FLARE_VERT = /* glsl */`
uniform vec3 uSun; uniform float uIsDir, uVisibility, uDepthBias; uniform vec4 uOcc[8];
attribute vec4 aGhost; attribute vec3 aTint;
varying vec2 vUv; varying vec3 vTint; varying float vI; varying float vShape;
void main(){
  vUv = uv; vTint = aTint; vShape = aGhost.z;
  vec3 toSun = uIsDir > .5 ? normalize(uSun) : uSun - cameraPosition;
  float sunDist = uIsDir > .5 ? 1e9 : length(toSun);
  vec3 sd = normalize(toSun);
  vec4 sv = viewMatrix*vec4(uIsDir > .5 ? cameraPosition + sd*1000. : uSun, 1.);
  vec4 sc = projectionMatrix*sv;
  vec2 ndc = sc.xy/max(sc.w, 1e-4);
  float front = step(0.001, sc.w);
  float vis = 1.;                                             // soft occlusion by up to 8 spheres on the way to the sun
  for(int i = 0; i < 8; i++){ vec4 o = uOcc[i];
    if(o.w > 0.){ vec3 oc = o.xyz - cameraPosition; float t = dot(oc, sd);
      if(t > 0. && t < sunDist) vis *= smoothstep(o.w*.7, o.w*1.3, length(oc - sd*t)); } }
  float aspect = projectionMatrix[1][1]/projectionMatrix[0][0];
  vec2 s = vec2(aGhost.y/aspect, aGhost.y)*2.;
  if(aGhost.z > 3.5) s.x *= 7.;
  if(aGhost.x < .01){
    // starburst and streak: a sprite at the sun's own depth, depth tested, so terrain and buildings hide it
    vI = aGhost.w*front*uVisibility*mix(1., vis, .7);
    float z = sc.w*.99996;
    if(uIsDir < .5){ vec4 pb = projectionMatrix*(sv + vec4(0., 0., min(uDepthBias, sunDist*.5), 0.)); z = pb.z/pb.w*sc.w; }
    gl_Position = vec4((ndc + position.xy*s)*sc.w, z, sc.w);
  } else {
    // ghosts: screen space, along the line from the sun through the screen centre
    float on = front*(1. - smoothstep(.8, 1.25, max(abs(ndc.x), abs(ndc.y))));
    vI = aGhost.w*on*uVisibility*vis*(1. - .45*min(length(ndc), 1.));
    gl_Position = vec4(ndc*(1.-aGhost.x) + position.xy*s, -.999, 1.);
  }
  if(vI < .002) gl_Position = vec4(2.,2.,2.,1.);
}`;
const FLARE_FRAG = /* glsl */`precision highp float;
uniform vec3 uColor; uniform float uIntensity;
varying vec2 vUv; varying vec3 vTint; varying float vI; varying float vShape;
void main(){
  vec2 q = vUv*2.-1.; float r = length(q); float w = max(1.-r,0.); float a;
  if(vShape < .5){ a = w*w*(3.-2.*w); a *= a; }
  else if(vShape < 1.5){ a = smoothstep(.55,.9,r)*smoothstep(1.,.92,r)*.8 + .12*w; }
  else if(vShape < 2.5){ float an = atan(q.y,q.x); float hx = cos(floor(.5+an/1.0472)*1.0472-an)*r; a = smoothstep(.92,.8,hx)*(.45+.55*hx); }
  else if(vShape < 3.5){ float an = atan(q.y,q.x);
    float st = pow(.5+.5*cos(an*6.),14.) + .5*pow(.5+.5*cos(an*14.+1.),20.);
    a = exp(-r*r*40.)*2. + exp(-r*5.)*.5*w + st*exp(-r*3.5)*w*.6; }
  else { a = exp(-q.y*q.y*160.)*pow(max(1.-abs(q.x),0.),2.)*.9; }
  gl_FragColor = vec4(uColor*vTint*a*vI*uIntensity, 0.);
}`;

// Simple flare for a sun direction or a world position: a starburst and streak drawn as a depth-tested sprite at the
// sun (opaque geometry hides it, later transparent things such as smoke draw over it) plus screen-space ghosts.
// occluders: up to 8 spheres [x, y, z, radius] that softly block the ghosts (and dim the burst). One draw call.
export function makeFlare(opts = {}) {
  const rng = getRng(opts);
  const ghosts = opts.ghosts ?? 7;
  const list = [[0, opts.size ?? 0.34, 3, 1, [1, 1, 1]]];
  if (opts.streak !== false) list.push([0, (opts.size ?? 0.34) * 0.8, 4, 0.6, [0.7, 0.85, 1]]);
  const tints = [[1, 0.75, 0.5], [0.6, 0.85, 1], [0.75, 1, 0.7], [1, 0.6, 0.8], [0.7, 0.7, 1]];
  for (let i = 0; i < ghosts; i++) {
    const t = 0.35 + (i / Math.max(1, ghosts - 1)) * 1.75 + (rng() - 0.5) * 0.15;
    list.push([t, 0.025 + rng() * rng() * 0.16, Math.min(2, Math.floor(rng() * 3)), 0.05 + rng() * 0.09, tints[i % tints.length]]);
  }
  const n = list.length, g = quadGeometry(n), gh = new Float32Array(n * 4), ti = new Float32Array(n * 3);
  list.forEach((l, i) => { gh.set([l[0], l[1], l[2], l[3]], i * 4); ti.set(l[4], i * 3); });
  iattr(g, 'aGhost', gh, 4); iattr(g, 'aTint', ti, 3);
  const isDir = !opts.position;
  const occ = Array.from({ length: 8 }, (_, i) => { const o = opts.occluders && opts.occluders[i]; return o ? new THREE.Vector4(o[0], o[1], o[2], o[3]) : new THREE.Vector4(0, 0, 0, 0); });
  const uniforms = {
    uSun: { value: isDir ? toVec3(opts.sunDir, [0.3, 0.45, 0.8]).normalize() : toVec3(opts.position) }, uIsDir: { value: isDir ? 1 : 0 },
    uColor: { value: toColor(opts.color, '#fff0d8') }, uIntensity: { value: opts.intensity ?? 1 }, uVisibility: { value: 1 },
    uDepthBias: { value: opts.depthBias ?? 1 }, uOcc: { value: occ },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: FLARE_VERT, fragmentShader: FLARE_FRAG, transparent: true, depthWrite: false, depthTest: opts.depthTest !== false, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 1);
  return {
    object, uniforms, material, update() {},
    setOccluder(i, x, y, z, r) { if (i >= 0 && i < 8) occ[i].set(x, y, z, r); },
  };
}

// =====================================================================================
// ATMOSPHERE: ground fog, mist, cloud puffs, smoke column, dust devil
// =====================================================================================

const GFOG_VERT = /* glsl */`
uniform float uFollow, uHalf;
attribute vec2 aLayer;
varying vec3 vWorld; varying vec2 vLayer; varying vec2 vR;
${GLSL_FOG_PARS_VERT}
void main(){
  vLayer = aLayer; vR = position.xz/uHalf;
  vec4 w = modelMatrix*vec4(position,1.); w.xz += cameraPosition.xz*uFollow;
  vWorld = w.xyz;
  vec4 mvPosition = viewMatrix*w;
  gl_Position = projectionMatrix*mvPosition;
  ${GLSL_FOG_VERT}
}`;
const GFOG_FRAG = /* glsl */`precision highp float;
uniform vec3 uColor, uSunDir, uSunColor; uniform vec2 uWind, uNear;
uniform float uTime, uScale, uOpacity, uCoverage, uSoft, uSoftGround, uScatter, uLayers;
varying vec3 vWorld; varying vec2 vLayer; varying vec2 vR;
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_FOG_PARS_FRAG}
void main(){
  // the cheap fades first: most of a sheet is faded out, and those fragments never pay for the noise
  float edge = 1. - smoothstep(.55, 1., length(vR));
  vec3 toP = vWorld - cameraPosition; float dist = length(toP);
  float a = uOpacity*edge * smoothstep(0., uSoft, abs(toP.y)) * smoothstep(uNear.x, uNear.y, dist) * smoothstep(0., uSoftGround, vLayer.y);
  a *= 1. - .45*vLayer.x/max(uLayers-1., 1.);
  if(a < .003) discard;
  vec2 p = vWorld.xz*uScale + uWind*uTime*uScale*(1.+vLayer.x*.35) + vLayer.x*vec2(13.7,7.3);
  p += (vec2(vnoise(p*.6 + 3.), vnoise(p*.6 + 11.)) - .5)*1.6;
  float n = fbmLo(p);
  float n2 = vnoise(vWorld.xz*uScale*.21 - uWind*uTime*uScale*.25 + vLayer.x*5.1);
  a *= smoothstep(.75-uCoverage*.5, 1.15-uCoverage*.5, n*.65 + n2*.45);
  if(a < .003) discard;
  vec3 V = toP/dist;
  float fs = pow(max(dot(V, uSunDir), 0.), 5.);
  vec3 col = uColor*(.86 + .28*n) + uSunColor*fs*uScatter;
  col = fxApplyFog(col);
  gl_FragColor = vec4(col*a, a);
}`;

// Layered drifting fog sheets. Flat and camera-following by default (10 triangles); with heightAt(x,z)
// the sheets are static, subdivided, and either pool in valleys ('pool') or hug the ground ('hug'). One draw call.
export function makeGroundFog(opts = {}) {
  const layers = opts.layers ?? 6, size = opts.size ?? 700, y0 = opts.y ?? 0, thick = opts.height ?? 12;
  const hAt = opts.heightAt, mode = opts.mode || 'pool', seg = hAt ? (opts.segments ?? 48) : 1;
  const center = toVec3(opts.center, [0, 0, 0]);
  const P = [], L = [], idx = [];
  let ground = null;                                           // terrain height per grid vertex, sampled once for all layers
  if (hAt) { ground = new Float32Array((seg + 1) * (seg + 1)); for (let j = 0, k = 0; j <= seg; j++) for (let i = 0; i <= seg; i++, k++) ground[k] = hAt((i / seg - 0.5) * size + center.x, (j / seg - 0.5) * size + center.z); }
  for (let l = 0; l < layers; l++) {
    const f = layers > 1 ? l / (layers - 1) : 0, ly = y0 + thick * (0.08 + 0.92 * f * f), base = P.length / 3;
    for (let j = 0, k = 0; j <= seg; j++) for (let i = 0; i <= seg; i++, k++) {
      const x = (i / seg - 0.5) * size, z = (j / seg - 0.5) * size;
      let y = ly, clear = 1e3;
      if (ground) { const g = ground[k]; if (mode === 'hug') y = g + (ly - y0) + (opts.lift ?? 0.6); else clear = Math.max(-thick, Math.min(thick * 2, ly - g)); }
      P.push(x, y, z); L.push(l, clear);
    }
    for (let j = 0; j < seg; j++) for (let i = 0; i < seg; i++) { const a = base + j * (seg + 1) + i, b = a + seg + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aLayer', new THREE.Float32BufferAttribute(L, 2)); g.setIndex(idx);
  const wind = toVec2(opts.wind, [1.6, 0.7]);
  const uniforms = {
    uTime: timeUniform(opts), uFollow: { value: (opts.follow ?? !hAt) ? 1 : 0 }, uHalf: { value: size / 2 },
    uColor: { value: toColor(opts.color, '#c9d3e2') }, uOpacity: { value: opts.opacity ?? 0.26 }, uCoverage: { value: opts.coverage ?? 0.5 },
    uScale: { value: opts.scale ?? 0.014 }, uWind: { value: wind }, uNear: { value: toVec2(opts.near, [3, 22]) },
    uSoft: { value: opts.soft ?? Math.max(1.5, thick * 0.35) }, uSoftGround: { value: opts.softGround ?? Math.max(1.5, thick * 0.6) },
    uSunDir: { value: toVec3(opts.sunDir, [0.4, 0.5, 0.6]).normalize() }, uSunColor: { value: toColor(opts.sunColor, '#ffd9a8') }, uScatter: { value: opts.scatter ?? 0.35 },
    uLayers: { value: layers },
  };
  const material = shader({ uniforms, vertexShader: GFOG_VERT, fragmentShader: GFOG_FRAG, fog: opts.fog !== false, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 2);
  if (hAt) object.position.set(center.x, 0, center.z);
  if (!uniforms.uFollow.value) { g.computeBoundingSphere(); setBounds(object, g.boundingSphere.center, g.boundingSphere.radius); }   // static sheets are culled normally
  return { object, uniforms, material, triangles: idx.length / 3, update(dt, time) { uniforms.uTime.value = time; } };
}

// ---------- soft puff billboards (mist, clouds, smoke, dust devils) ----------
// PUFF_LIT: sun-lit with bump detail. PUFF_CLUSTER: aOff places each puff inside its cluster so the whole cluster shades
// as one body. PUFF_SHARED: erosion noise is sampled in world space, continuous across all puffs of a cloud.
const PUFF_VERT = /* glsl */`
uniform float uTime, uFlatten, uRotSpeed, uRotRand, uRate, uHeight, uBend, uSpin, uSway, uNearCap, uSkirt, uBody, uImm;
uniform vec3 uArea, uCenter, uFollow, uDrift, uBase, uWind, uSunDir;
uniform vec2 uNear, uSize, uRadius;
attribute vec3 aPos; attribute vec4 aInfo;
#ifdef PUFF_CLUSTER
attribute vec4 aOff;
#endif
varying vec2 vUv; varying vec4 vInfo; varying float vA; varying float vT; varying vec3 vSunV; varying vec3 vUpV; varying vec3 vViewDir; varying vec2 vRot;
varying vec4 vOff; varying vec3 vWorld;
${GLSL_FOG_PARS_VERT}
void main(){
  vUv = uv; vInfo = aInfo; float t = uTime; float a = 1., sz, h = 0.; vec3 wc, anchor; vec4 off = vec4(0., 0., 0., 1.);
#if PUFF_MOTION == 1
  float age = fract(aInfo.z + t*uRate); h = pow(age, .85);
  float spread = mix(uRadius.x, uRadius.y, pow(h, .8));
  wc = uBase + vec3(0., h*uHeight, 0.) + uWind*(h*h)*uHeight*uBend;
  wc += aPos*vec3(spread, spread*.45, spread);
  wc.x += sin(h*9. + t*.7 + aInfo.z*40.)*spread*.3; wc.z += cos(h*7. - t*.6 + aInfo.z*23.)*spread*.3;
  sz = mix(uSize.x, uSize.y, pow(h, .7))*aInfo.x;
  a = smoothstep(0., .05, age)*(1.-smoothstep(.5, 1., age));
  float crad = spread + .5*sz;                                 // the column's real radius at this height
  off = vec4(vec3(aPos.x, aPos.y*.3, aPos.z)*(spread/crad), .5*sz/crad);
  anchor = wc;
#elif PUFF_MOTION == 2
  float skirt = step(1.-uSkirt, aPos.y);
  float age = fract(aInfo.z + t*uRate*(.6+aPos.y*.8)); h = mix(age, age*.08, skirt);
  float rad = mix(uRadius.x, uRadius.y, pow(h, 1.5))*(.55+.5*aPos.x) + skirt*uRadius.y*(.25+age*1.1);
  float ang = aPos.z*6.2831853 + t*uSpin*(1.7-h)*(.7+.6*aPos.x);
  wc = uBase + vec3(0., h*uHeight, 0.);
  wc.x += sin(h*3.2 + t*.9)*uSway*h; wc.z += cos(h*2.4 + t*.7)*uSway*h;
  wc.xz += vec2(cos(ang), sin(ang))*rad;
  sz = mix(uSize.x, uSize.y, max(h, skirt*.5))*aInfo.x;
  a = smoothstep(0., .1, age)*(1.-smoothstep(.6, 1., age))*mix(uBody, 1., skirt);
  off = vec4(cos(ang)*.9, 0., sin(ang)*.9, .6);
  anchor = wc;
#else
  vec3 p = aPos + uDrift*t;
  #ifdef PUFF_NOWRAP
  wc = p;
  #else
  vec3 c = mix(uCenter, cameraPosition, uFollow);
  p = mod(p - c + .5*uArea, uArea) - .5*uArea;
  vec3 e = abs(p)/(.5*uArea);
  a = 1. - smoothstep(.72, 1., max(e.x, e.z));
  wc = c + p;
  #endif
  wc.y += sin(t*.21 + aInfo.z*30.)*aInfo.x*.03;
  sz = aInfo.x;
  anchor = aPos;
  #ifdef PUFF_CLUSTER
  off = aOff;
  #endif
#endif
  vT = h;
  vec4 mvPosition = viewMatrix*vec4(wc,1.);
  float dist = length(mvPosition.xyz);
  float rot = aInfo.y*6.2831853*uRotRand + t*uRotSpeed*(aInfo.z-.5);
  float cr = cos(rot), sr = sin(rot); vRot = vec2(cr, sr);
  vec2 q = mat2(cr,sr,-sr,cr)*position.xy; q.y *= uFlatten;
  mvPosition.xy += q*sz;
  vec3 camR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), camU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vWorld = anchor + (camR*q.x + camU*q.y)*sz;
  vOff = vec4(mat3(viewMatrix)*off.xyz, off.w);
  // fades as the camera enters a puff; a puff that fills the view is also capped so stacked ones do not saturate
  vA = a * smoothstep(uNear.x*sz, uNear.y*sz, dist) * mix(uNearCap, 1., smoothstep(uNear.y*sz, 2.2*sz, dist));
  vA *= 1. - uImm*(1. - smoothstep(.6*sz, 2.4*sz, dist));       // inside a cloud the veil takes over from the puffs around the camera
  vSunV = normalize((viewMatrix*vec4(uSunDir,0.)).xyz); vUpV = (viewMatrix*vec4(0.,1.,0.,0.)).xyz;
  vViewDir = mvPosition.xyz;
  gl_Position = projectionMatrix*mvPosition;
  if(vA < .003) gl_Position = vec4(2.,2.,2.,1.);
  ${GLSL_FOG_VERT}
}`;
const PUFF_FRAG = /* glsl */`precision highp float;
uniform vec3 uColor, uShadow, uSunColor, uHot, uColorTop, uAmbient;
uniform float uTime, uOpacity, uFreq, uWFreq, uRagged, uSoftness, uBillow, uAdditive, uRim, uHotFalloff, uTopMix, uDetail, uVariation, uUnder, uFloorFade, uCluster, uScatter;
varying vec2 vUv; varying vec4 vInfo; varying float vA; varying float vT; varying vec3 vSunV; varying vec3 vUpV; varying vec3 vViewDir; varying vec2 vRot;
varying vec4 vOff; varying vec3 vWorld;
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_FOG_PARS_FRAG}
// value + softened gradient: octave gradients weighted like the amplitudes, so the bump lighting stays billowy
vec3 puffNoise(vec2 p){ float a=.5; vec3 s=vec3(0.); mat2 m=mat2(1.,0.,0.,1.); const mat2 M=mat2(1.6,1.2,-1.2,1.6), Rm=mat2(.8,.6,-.6,.8);
  for(int i=0;i<3;i++){ vec3 n=vnoised(p); s.x+=a*n.x; s.yz+=a*(n.yz*m); p=M*p+7.1; m=Rm*m; a*=.5; } return s/.875; }
void main(){
  vec2 q = vUv*2.-1.; float r = length(q);
  if(r > 1.) discard;
#ifdef PUFF_LIT
  #ifdef PUFF_SHARED
  // the shape comes from two octaves of world-space noise that every puff of the cloud shares; two finer octaves
  // are cheap per-sprite noise (they fade out with distance instead of aliasing)
  vec3 wp = vWorld*uWFreq; wp.y -= uTime*uBillow;
  vec4 n4 = vnoised(wp)*.5 + vnoised(wp*2.03 + vec3(7.1, 3.3, 5.7))*.25;
  vec2 np = q*(2.*uWFreq*vInfo.x) + vInfo.z*vec2(17.3, 31.7); np.y -= uTime*uBillow*4.;
  float lod = clamp(1.6 - fwidth(np.x)*5., 0., 1.);
  const mat2 Rm = mat2(.8, .6, -.6, .8);
  vec3 d1 = vnoised(np)*.125*lod, d2 = vnoised(Rm*np*2. + 7.1)*.0625*lod*clamp(1.6 - fwidth(np.x)*10., 0., 1.);
  float n = (n4.x + d1.x + d2.x + (1.-lod)*.09)/.9375;
  vec2 grad = ((viewMatrix*vec4(n4.yzw, 0.)).xy + mat2(vRot.x, vRot.y, -vRot.y, vRot.x)*(d1.yz + d2.yz*Rm))/.9375;
  #else
  vec2 np = q*uFreq + vInfo.z*vec2(17.3,31.7); np.y -= uTime*uBillow;
  vec3 nd = puffNoise(np); float n = nd.x; vec2 grad = mat2(vRot.x, vRot.y, -vRot.y, vRot.x)*nd.yz;
  #endif
#else
  vec2 np = q*uFreq + vInfo.z*vec2(17.3,31.7); np.y -= uTime*uBillow;
  float n = fbmLo(np);
#endif
  float d = 1. - r + (n-.5)*uRagged;
  float a = smoothstep(0., uSoftness, d)*(1.-smoothstep(.75,1.,r));
  a = pow(a, 1.5)*vA*uOpacity*mix(1., smoothstep(-.95, -.25, q.y), uFloorFade);
  if(a < .004) discard;
  vec3 base = mix(uColor, uColorTop, vT*uTopMix);
#ifdef PUFF_LIT
  vec2 qv = mat2(vRot.x, vRot.y, -vRot.y, vRot.x)*q;
  float zs = sqrt(max(1.-r*r, 0.));
  vec3 Ns = normalize(vec3(qv, .35 + zs));                    // this sprite as a sphere
  vec3 pm = vOff.xyz + vec3(qv, zs*.5)*vOff.w;                // the fragment's place in the whole cluster, in cluster radii
  float front = clamp(vSunV.z, 0., 1.);
  // light: mostly where the fragment sits along the sun's axis through the cluster, a little from the sprite's own roundness
  float nl = mix(dot(Ns, vSunV), dot(pm, vSunV)*1.2 + .3*dot(Ns, vSunV), uCluster);
  float up = mix(dot(qv, vUpV.xy), dot(pm, vUpV)*1.2, uCluster);
  float bump = -dot(grad, vSunV.xy)*.45;
  float lit = smoothstep(-.35, .55, .5*nl + bump*uDetail + (vInfo.w-.5)*uVariation + up*uUnder - front*(.62-n)*1.4);
  float behind = clamp(-vSunV.z, 0., 1.);
  lit *= 1. - .7*uCluster*behind*behind;                      // looking into the light we only see the shadowed side
  vec3 col = mix(uShadow, base, lit*mix(1., .4 + .6*smoothstep(0., .6, d), front));
  // against the light: the heart of the cluster is darkest, its fringe lets light through, and the silver lining
  // sits only on sprite edges that face out of the cluster
  float sdv = max(dot(normalize(vViewDir), vSunV), 0.);
  float thin = 1.-smoothstep(0., .6, d);
  float hull = length(pm.xy), fringe = mix(1., smoothstep(.3, 1., hull), uCluster);   // 0 at the heart, 1 at the silhouette
  float outw = mix(1., clamp(dot(pm.xy, qv)/max(hull*r, 1e-3)*.5 + .5, 0., 1.), uCluster);
  float sil = smoothstep(.55, 1.05, hull);                    // 1 only on the cluster's own outline
  float back = sdv*sdv;
  col *= 1. - .22*uCluster*(1.-front)*(1.-fringe);
  col += uSunColor*back*sdv*uRim*(thin*(1.-uCluster) + .12*fringe*fringe)*(.5+lit);
  col = mix(col, base, thin*.2*(1.-uCluster));
  // the lining itself is added on top of the alpha blend: a bright band just inside the eroded edge
  float band = smoothstep(0., .14, d)*(1.-smoothstep(.08, .45, d));
  vec3 lining = uSunColor*back*sdv*uRim*band*outw*outw*sil*(.1 + 1.9*sil)*uCluster*1.1;
  // light scattered forward through the whole body where it is thin, plus an ambient floor
  float dens = mix(smoothstep(0., .6, d), (1. - .7*fringe)*(.45 + .7*n)*(.65 + .35*smoothstep(0., .8, d)), uCluster);
  col += uSunColor*pow(sdv, 1.5)*uScatter*(1.-min(dens, 1.)) + uAmbient;
#else
  vec3 col = base*(.85 + .3*n)*(.85 + .3*vInfo.w), lining = vec3(0.);
#endif
  col += uHot*exp(-vT*uHotFalloff)*(.4 + 1.2*n);
  col = fxFogMix(col, uAdditive);
  gl_FragColor = vec4(col*a + lining*(vA*uOpacity*(1.-fxFog())), a*(1.-uAdditive));
}`;

function puffSystem(o, pos, info, defines, offs) {
  const count = info.length / 4, g = quadGeometry(count);
  const aPos = iattr(g, 'aPos', pos, 3), aInfo = iattr(g, 'aInfo', info, 4), aOff = offs ? iattr(g, 'aOff', offs, 4) : null;
  const follow = o.follow === true ? [1, 0, 1] : [0, 0, 0];
  const uniforms = {
    uTime: timeUniform(o), uFlatten: { value: o.flatten ?? 1 }, uRotSpeed: { value: o.rotSpeed ?? 0 }, uRotRand: { value: o.rotRandom ?? (o.rotSpeed ? 1 : 0) },
    uArea: { value: toVec3(o.area, [1e6, 1e6, 1e6]) }, uCenter: { value: toVec3(o.center, [0, 0, 0]) }, uFollow: { value: new THREE.Vector3(...follow) },
    uDrift: { value: toVec3(o.drift, [0, 0, 0]) }, uBase: { value: toVec3(o.position, [0, 0, 0]) }, uWind: { value: toVec3(o.wind, [1, 0, 0.3]) },
    uSunDir: { value: toVec3(o.sunDir, [0.4, 0.8, 0.45]).normalize() }, uNear: { value: toVec2(o.near, [0.25, 1.1]) }, uNearCap: { value: o.nearCap ?? 1 },
    uSize: { value: toVec2(o.sizeRange, [1, 1]) }, uRadius: { value: toVec2(o.radiusRange, [1, 1]) },
    uRate: { value: o.rate ?? 0.1 }, uHeight: { value: o.height ?? 40 }, uBend: { value: o.bend ?? 0.5 }, uSpin: { value: o.spin ?? 2 }, uSway: { value: o.sway ?? 2 },
    uSkirt: { value: o.skirt ?? 0.16 }, uBody: { value: o.body ?? 1 }, uImm: { value: 0 },
    uColor: { value: toColor(o.color, '#ffffff') }, uShadow: { value: toColor(o.shadowColor, '#7f8fb0') }, uColorTop: { value: toColor(o.colorTop ?? o.color, '#ffffff') }, uTopMix: { value: o.colorTop ? 1 : 0 },
    uSunColor: { value: toColor(o.sunColor, '#ffe8c8') }, uHot: { value: toColor(o.hot, '#000000') }, uHotFalloff: { value: o.hotFalloff ?? 12 }, uAmbient: { value: toColor(o.ambient, '#000000') },
    uOpacity: { value: o.opacity ?? 0.8 }, uFreq: { value: o.frequency ?? 1.7 }, uWFreq: { value: o.worldFrequency ?? 0.1 }, uRagged: { value: o.ragged ?? 0.9 }, uSoftness: { value: o.softness ?? 0.6 },
    uBillow: { value: o.billow ?? 0.03 }, uAdditive: { value: o.additive ?? 0 }, uRim: { value: o.rim ?? 0.35 }, uDetail: { value: o.detail ?? 2.4 }, uVariation: { value: o.variation ?? 0.5 }, uUnder: { value: o.under ?? 0.4 }, uFloorFade: { value: o.floorFade ?? 0 },
    uCluster: { value: o.cluster ?? 0.7 }, uScatter: { value: o.scatter ?? 0 },
  };
  const material = shader({ uniforms, vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, fog: o.fog !== false, defines,
    transparent: true, depthWrite: false, ...PREMULT });
  const object = fxMesh(g, material, o.renderOrder ?? 2);
  return { object, uniforms, material, count, aPos, aInfo, aOff, update(dt, time) { uniforms.uTime.value = time; } };
}
// bounding sphere of static puffs (positions + their size)
function puffBounds(sys, pos, info) {
  const box = new THREE.Box3(), v = new THREE.Vector3(), s = new THREE.Sphere(); let big = 0;
  for (let i = 0; i < info.length / 4; i++) { box.expandByPoint(v.set(pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2])); big = Math.max(big, info[i * 4]); }
  box.getBoundingSphere(s);
  return setBounds(sys.object, s.center, s.radius + big * 0.75 + 1);
}

// Soft drifting mist billboards in a box that wraps (optionally around the camera). One draw call.
export function makeMist(opts = {}) {
  const rng = getRng(opts);
  const o = { count: 70, area: [320, 8, 320], center: [0, 4, 0], size: [16, 38], color: '#d5deea', opacity: 0.2, drift: [0.9, 0, 0.35],
    flatten: 0.42, ragged: 1.1, softness: 0.8, frequency: 1.3, billow: 0.02, near: [0.3, 1.3], floorFade: 1, ...opts };
  const area = toVec3(o.area), c = toVec3(o.center), size = toVec2(o.size), n = o.positions ? o.positions.length : o.count;
  const pos = new Float32Array(n * 3), info = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    let x, y, z; const s = size.x + (size.y - size.x) * rng(), rest = s * o.flatten * 0.3;   // puffs rest on their level, not astride it
    if (o.positions) { const p = o.positions[i]; x = p.x ?? p[0]; y = p.y ?? p[1]; z = p.z ?? p[2]; }
    else { x = c.x + (rng() - 0.5) * area.x; z = c.z + (rng() - 0.5) * area.z; y = (o.heightAt ? o.heightAt(x, z) + (o.lift ?? 0.5) + rng() * area.y : c.y + (rng() - 0.5) * area.y) + rest; }
    pos.set([x, y, z], i * 3);
    info.set([s, rng(), rng(), rng()], i * 4);
  }
  const fixed = !!(o.heightAt || o.positions);
  if (fixed) o.drift = [0, 0, 0];
  const sys = puffSystem(o, pos, info, { PUFF_MOTION: 0, ...(fixed ? { PUFF_NOWRAP: '' } : {}) });
  if (fixed) puffBounds(sys, pos, info);
  else if (o.follow !== true) setBounds(sys.object, c, area.length() * 0.5 + size.y);
  return sys;
}

// full-screen veil shown while the camera is inside a cloud
const VEIL_VERT = /* glsl */`
uniform float uImmersion, uVeil; varying vec3 vDir;
void main(){
  gl_Position = uImmersion*uVeil > .004 ? vec4(position.xy, 0., 1.) : vec4(2., 2., 2., 1.);   // costs nothing outside a cloud
  vDir = vec3(position.x/projectionMatrix[0][0], position.y/projectionMatrix[1][1], -1.)*mat3(viewMatrix);
}`;
const VEIL_FRAG = /* glsl */`precision highp float;
uniform vec3 uColor, uShadow, uSunColor, uSunDir; uniform float uImmersion, uTime, uVeil, uRim;
varying vec3 vDir;
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}
void main(){
  vec3 d = normalize(vDir);
  float n = fbm(d*2.4 + cameraPosition*.05 + vec3(0., -uTime*.03, 0.));
  float sd = dot(d, uSunDir);
  float lit = clamp(.5 + .32*sd + .22*d.y + (n-.5)*.7, 0., 1.);
  vec3 col = mix(uShadow, uColor, lit) + uSunColor*pow(max(sd, 0.), 3.)*(.2 + uRim*.3);
  float a = smoothstep(0., 1., uImmersion*1.45 - n*.55*(1.-uImmersion))*uVeil;
  gl_FragColor = vec4(col*a, a);
}`;

// Lit cumulus built from puff clusters, for flying past and through. 2 draw calls (puffs + the fly-through veil, which
// is only drawn inside a cloud), sorted back to front on update. api.immersion (0..1) says how deep the camera is in a cloud.
// Wrapping: random clouds (`count`) wrap inside `area` around `center`. Explicit `clouds` stay exactly where you put them;
// if they drift they wrap inside their own bounding box (or inside `area` / `center` when you pass an area).
export function makeCloudPuffs(opts = {}) {
  const rng = getRng(opts);
  const o = { count: 16, puffs: 22, center: [0, 60, 0], size: [20, 44], spread: [1.5, 0.42, 1.1], color: '#f3eadf', shadowColor: '#7888ad',
    opacity: 0.92, drift: [2.2, 0, 0.6], flatten: 0.85, ragged: 1.5, softness: 0.45, frequency: 2.1, billow: 0.02, near: [0.12, 0.5], nearCap: 0.6,
    rim: 0.5, cluster: 0.85, scatter: 0.1, variation: 0.15, under: 0.3, detail: 2.0, veil: 0.92, ...opts };
  const size = toVec2(o.size), sp = toVec3(o.spread), drift = toVec3(o.drift), meanSize = (size.x + size.y) * 0.5;
  let c = toVec3(o.center), area = toVec3(o.area, [520, 50, 520]), wrap = true;
  const clouds = (o.clouds || Array.from({ length: o.count }, () => ({ position: [c.x + (rng() - 0.5) * area.x, c.y + (rng() - 0.5) * area.y, c.z + (rng() - 0.5) * area.z], scale: 0.7 + rng() * 0.8 })))
    .map((cl) => { const s = cl.scale ?? 1, base = meanSize * s; return { p: toVec3(cl.position), s, rx: base * sp.x, rz: base * sp.z, H: base * sp.y * 1.6, base }; });
  if (o.clouds && !o.area) {
    if (drift.lengthSq() === 0) wrap = false;                 // placed clouds that do not move: no wrapping, no edge fade
    else {                                                    // placed clouds that drift: wrap inside their own bounds
      const box = new THREE.Box3(); let big = 0;
      for (const cl of clouds) { box.expandByPoint(cl.p); big = Math.max(big, cl.rx, cl.rz); }
      box.expandByScalar(big * 2.2 + size.y); c = box.getCenter(new THREE.Vector3()); area = box.getSize(new THREE.Vector3());
    }
  }
  const P = Math.max(1, Math.round(o.puffs)), nb = Math.max(1, Math.round(P * 0.6)), n = clouds.length * P;
  const pos = new Float32Array(n * 3), info = new Float32Array(n * 4), offs = new Float32Array(n * 4);
  let k = 0;
  for (const cl of clouds) {
    for (let j = 0; j < P; j++, k++) {
      // body puffs fill a flat-based dome; the rest are small detail puffs on its surface
      const body = j < nb, a = rng() * 6.2832, rr = body ? Math.sqrt(rng()) * 0.8 : 0.2 + 0.6 * rng();
      const dome = Math.sqrt(Math.max(0, 1 - Math.min(rr, 1) * Math.min(rr, 1)));
      const fy = body ? Math.pow(rng(), 1.3) * dome : dome * (0.55 + 0.35 * rng());
      const s = body ? (size.x + (size.y - size.x) * (0.3 + 0.7 * rng())) * cl.s * (1 - 0.3 * rr) : (size.x + (size.y - size.x) * rng() * 0.6) * cl.s * (0.45 + 0.25 * rng());
      const ca = Math.cos(a), sa = Math.sin(a);
      pos.set([cl.p.x + ca * rr * cl.rx, cl.p.y + fy * cl.H, cl.p.z + sa * rr * cl.rz], k * 3);
      info.set([s, rng(), rng(), 0.35 + 0.65 * fy], k * 4);
      offs.set([ca * rr, fy * 1.25 - 0.4, sa * rr, s / (cl.rx + cl.rz)], k * 4);
    }
  }
  o.center = c; o.area = area; o.worldFrequency = o.worldFrequency ?? (2 * o.frequency) / meanSize;
  const sys = puffSystem(o, pos, info, { PUFF_MOTION: 0, PUFF_LIT: '', PUFF_CLUSTER: '', PUFF_SHARED: '', ...(wrap ? {} : { PUFF_NOWRAP: '' }) }, offs);
  if (!wrap) puffBounds(sys, pos, info);
  else if (o.follow !== true) setBounds(sys.object, c, area.length() * 0.5 + size.y * 1.6);
  const puffs = sys.object, U = sys.uniforms;
  // the veil: one clip-space triangle, tinted like the cloud
  const vg = new THREE.BufferGeometry(); vg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const veilUniforms = { uColor: U.uColor, uShadow: U.uShadow, uSunColor: U.uSunColor, uSunDir: U.uSunDir, uTime: U.uTime, uRim: U.uRim, uImmersion: { value: 0 }, uVeil: { value: o.veil === true ? 0.92 : (o.veil || 0) } };
  const veil = fxMesh(vg, new THREE.ShaderMaterial({ uniforms: veilUniforms, vertexShader: VEIL_VERT, fragmentShader: VEIL_FRAG, transparent: true, depthWrite: false, depthTest: false, ...PREMULT }), o.veilOrder ?? 30);
  sys.object = new THREE.Group(); sys.object.add(puffs, veil);
  sys.puffs = puffs; sys.veil = veil; sys.veilUniforms = veilUniforms; sys.immersion = 0; sys.clouds = clouds.length;

  const order = new Uint32Array(n), key = new Float32Array(n), sp0 = pos.slice(), si0 = info.slice(), so0 = offs.slice();
  const dr = U.uDrift.value, follow = U.uFollow.value, half = area.clone().multiplyScalar(0.5);
  const mod = (x, a) => ((x % a) + a) % a;
  const byDepth = (a, b) => key[b] - key[a];
  const doSort = o.sort !== false;
  sys.update = (dt, time, camera) => {
    U.uTime.value = time;
    if (!camera) return;
    const cam = camera.position, cx = follow.x ? cam.x : c.x, cy = c.y, cz = follow.z ? cam.z : c.z;
    // how deep the camera sits inside the nearest cloud (ellipsoid around each cluster)
    let im = 0;
    for (let i = 0; i < clouds.length; i++) {
      const cl = clouds[i]; let x = cl.p.x + dr.x * time, y = cl.p.y + dr.y * time, z = cl.p.z + dr.z * time;
      if (wrap) { x = mod(x - cx + half.x, area.x) - half.x + cx; y = mod(y - cy + half.y, area.y) - half.y + cy; z = mod(z - cz + half.z, area.z) - half.z + cz; }
      const ex = (cam.x - x) / (cl.rx + cl.base * 0.35), ey = (cam.y - (y + cl.H * 0.45)) / (cl.H * 0.55 + cl.base * 0.4), ez = (cam.z - z) / (cl.rz + cl.base * 0.35);
      let e = 1 - (Math.sqrt(ex * ex + ey * ey + ez * ez) - 0.45) / 0.6; e = e < 0 ? 0 : e > 1 ? 1 : e; e = e * e * (3 - 2 * e);
      if (wrap) { const fx_ = Math.abs(x - cx) / half.x, fz_ = Math.abs(z - cz) / half.z, f = Math.max(fx_, fz_); if (f > 0.72) e *= Math.max(0, 1 - (f - 0.72) / 0.28); }
      if (e > im) im = e;
    }
    sys.immersion = im; veilUniforms.uImmersion.value = im; U.uImm.value = im * Math.min(1, veilUniforms.uVeil.value * 1.1);
    if (!doSort) return;
    for (let i = 0; i < n; i++) {
      let x = sp0[i * 3] + dr.x * time, y = sp0[i * 3 + 1] + dr.y * time, z = sp0[i * 3 + 2] + dr.z * time;
      if (wrap) { x = mod(x - cx + half.x, area.x) - half.x + cx; y = mod(y - cy + half.y, area.y) - half.y + cy; z = mod(z - cz + half.z, area.z) - half.z + cz; }
      x -= cam.x; y -= cam.y; z -= cam.z;
      key[i] = x * x + y * y + z * z; order[i] = i;
    }
    order.sort(byDepth);
    const A = sys.aPos.array, I = sys.aInfo.array, O = sys.aOff.array;
    for (let i = 0; i < n; i++) {
      const s = order[i], i3 = i * 3, s3 = s * 3, i4 = i * 4, s4 = s * 4;
      A[i3] = sp0[s3]; A[i3 + 1] = sp0[s3 + 1]; A[i3 + 2] = sp0[s3 + 2];
      I[i4] = si0[s4]; I[i4 + 1] = si0[s4 + 1]; I[i4 + 2] = si0[s4 + 2]; I[i4 + 3] = si0[s4 + 3];
      O[i4] = so0[s4]; O[i4 + 1] = so0[s4 + 1]; O[i4 + 2] = so0[s4 + 2]; O[i4 + 3] = so0[s4 + 3];
    }
    sys.aPos.needsUpdate = true; sys.aInfo.needsUpdate = true; sys.aOff.needsUpdate = true;
  };
  return sys;
}

// Rising, billowing smoke plume animated on the GPU. One draw call.
export function makeSmokeColumn(opts = {}) {
  const rng = getRng(opts);
  const o = { count: 90, height: 70, radius: [1.2, 12], size: [4, 26], color: '#55505c', colorTop: '#8f8b98', shadowColor: '#25212c', ambient: '#0b0a10', hot: '#000000',
    opacity: 0.85, rate: 0.055, bend: 0.45, wind: [1, 0, 0.3], ragged: 1.1, softness: 0.7, frequency: 1.8, billow: 0.12, rotSpeed: 0.5, near: [0.3, 1.2],
    rim: 0.1, scatter: 0.22, cluster: 1, variation: 0.2, ...opts };
  o.sizeRange = toVec2(o.size); o.radiusRange = toVec2(o.radius);
  const n = o.count, pos = new Float32Array(n * 3), info = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const a = rng() * 6.283, r = Math.sqrt(rng());
    pos.set([Math.cos(a) * r, rng() * 2 - 1, Math.sin(a) * r], i * 3);
    info.set([0.7 + rng() * 0.6, rng(), (i + rng() * 0.6) / n, rng()], i * 4);
  }
  const sys = puffSystem(o, pos, info, { PUFF_MOTION: 1, PUFF_LIT: '' });
  const U = sys.uniforms; U.uWind.value.normalize();
  const H = U.uHeight.value, lean = new THREE.Vector3(0, H * 0.5, 0).addScaledVector(U.uWind.value, H * U.uBend.value * 0.5);
  const bounds = setBounds(sys.object, U.uBase.value.clone().add(lean), H * 0.5 * (1 + U.uBend.value) + o.radiusRange.y * 1.4 + o.sizeRange.y);
  sys.update = (dt, time) => { U.uTime.value = time; bounds.center.copy(U.uBase.value).add(lean); };
  return sys;
}

// ---------- dust devil: a twisted translucent funnel, a puff skirt and spiralling debris ----------
const DEVIL_PARS = /* glsl */`
uniform float uTime, uHeight, uSway, uSpin, uRate; uniform vec3 uBase; uniform vec2 uRadius;
vec3 devilAxis(float h){ return uBase + vec3(sin(h*3.2 + uTime*.9)*uSway*h, h*uHeight, cos(h*2.4 + uTime*.7)*uSway*h); }
float devilRadius(float h){ return mix(uRadius.x, uRadius.y, pow(h, 1.5)); }
`;
const FUNNEL_VERT = /* glsl */`
attribute vec3 aShell;
varying vec2 vUv; varying vec3 vN; varying vec3 vWorld; varying vec3 vShell;
${DEVIL_PARS}${GLSL_FOG_PARS_VERT}
void main(){
  float h = uv.y, ang = uv.x*6.2831853;
  float rad = devilRadius(h)*aShell.x*(1. + .14*sin(h*11. - uTime*1.7 + aShell.y*6.) + .08*sin(ang*2. + h*5. + uTime*uSpin*.6));
  vec3 dir = vec3(cos(ang), 0., sin(ang));
  vec3 w = devilAxis(h) + dir*rad;
  float slope = (uRadius.y - uRadius.x)*1.5*sqrt(max(h, .001))*aShell.x/uHeight;
  vN = normalize(dir - vec3(0., slope, 0.));
  vUv = uv; vShell = aShell; vWorld = w;
  vec4 mvPosition = viewMatrix*vec4(w, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${GLSL_FOG_VERT}
}`;
const FUNNEL_FRAG = /* glsl */`precision highp float;
uniform vec3 uColor, uColorTop, uShadow, uSunColor, uSunDir; uniform float uTime, uSpin, uRate, uOpacity, uTwist, uScatter;
varying vec2 vUv; varying vec3 vN; varying vec3 vWorld; varying vec3 vShell;
${GLSL_HASH}${GLSL_FOG_PARS_FRAG}
// value noise that repeats every 'per' cells in x, so the pattern closes around the funnel
float pnoise(vec2 p, float per){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); float x0 = mod(i.x, per), x1 = mod(i.x + 1., per);
  return mix(mix(hash12(vec2(x0, i.y)), hash12(vec2(x1, i.y)), f.x), mix(hash12(vec2(x0, i.y + 1.)), hash12(vec2(x1, i.y + 1.)), f.x), f.y); }
void main(){
  float h = vUv.y, t = uTime;
  vec3 N = normalize(vN), V = normalize(cameraPosition - vWorld);
  float ndv = abs(dot(N, V));
  // streaks wound round the funnel as a helix, scrolling with the spin and rising with the updraught
  float x = vUv.x + h*uTwist - t*uSpin*.16*(1.35 - .5*h) + vShell.y;
  float y = h*3. - t*uRate*1.6 + vShell.y*7.;
  float n = pnoise(vec2(x*6., y), 6.)*.55 + pnoise(vec2(x*12. + 3., y*2.3 + 1.7), 12.)*.3 + pnoise(vec2(x*24., y*5.1), 24.)*.15;
  float dn = smoothstep(.22, .8, n);
  float limb = smoothstep(0., .35, ndv)*(1.5 - .75*ndv);       // soft silhouette, denser toward the edges of the tube
  float a = uOpacity*vShell.z*(.25 + .75*dn)*limb*smoothstep(0., .07, h)*(1. - smoothstep(.5, 1., h));
  if(a < .004) discard;
  float wrap = dot(N, uSunDir)*.5 + .5;
  vec3 col = mix(uShadow, mix(uColor, uColorTop, h), smoothstep(.1, .9, wrap + (n - .5)*.6));
  col += uSunColor*pow(max(dot(-V, uSunDir), 0.), 2.)*uScatter*(1. - .5*dn);
  gl_FragColor = vec4(fxApplyFog(col)*a, a);
}`;
const DEBRIS_VERT = /* glsl */`
uniform float uDebrisSize; attribute vec4 aSeed;
varying vec2 vUv; varying float vA; varying float vShade;
${DEVIL_PARS}${GLSL_FOG_PARS_VERT}
void main(){
  vUv = uv; float t = uTime;
  float age = fract(aSeed.w + t*uRate*(.7 + .9*aSeed.z));
  float h = age*(.5 + .5*aSeed.x);
  float rad = devilRadius(h)*(.85 + .8*aSeed.y) + .3;
  float ang = aSeed.y*18.85 + t*uSpin*(2. - h)*(.7 + .6*aSeed.z);
  vec3 w = devilAxis(h) + vec3(cos(ang), 0., sin(ang))*rad;
  vec4 mvPosition = viewMatrix*vec4(w, 1.);
  float k = max(uDebrisSize*(.5 + aSeed.x), .0016*length(mvPosition.xyz));
  float ra = t*(3. + aSeed.z*6.) + aSeed.w*20.; float cr = cos(ra), sr = sin(ra);
  vec2 q = position.xy; q.x *= .3 + .7*abs(sin(ra*.7)); q = mat2(cr, sr, -sr, cr)*q;   // a tumbling fleck
  mvPosition.xy += q*k*2.;
  vA = smoothstep(0., .08, age)*(1. - smoothstep(.7, 1., age)); vShade = aSeed.x;
  gl_Position = projectionMatrix*mvPosition;
  ${GLSL_FOG_VERT}
}`;
const DEBRIS_FRAG = /* glsl */`precision highp float;
uniform vec3 uColor, uShadow; uniform float uOpacity; varying vec2 vUv; varying float vA; varying float vShade;
${GLSL_FOG_PARS_FRAG}
void main(){ vec2 q = vUv*2.-1.; float a = smoothstep(1., .55, length(q))*vA*uOpacity; if(a < .01) discard;
  gl_FragColor = vec4(fxApplyFog(mix(uShadow*.6, uColor*.8, vShade))*a, a); }`;

// Swirling dust funnel: a twisted translucent cone (2.7k triangles), a puff skirt at its foot and debris flecks.
// 3 draw calls. Move it with api.uniforms.uBase.value (shared by all three parts) or pass wander (metres).
export function makeDustDevil(opts = {}) {
  const rng = getRng(opts);
  const o = { count: 70, debris: 140, height: 34, radius: [0.8, 6.5], size: [2.4, 8], color: '#c9a777', colorTop: '#e3cba4', shadowColor: '#6a5238',
    opacity: 0.4, rate: 0.16, spin: 2.6, sway: 2.2, twist: 1.4, ragged: 1.1, softness: 0.65, frequency: 1.8, billow: 0.2, rotSpeed: 1.2, near: [0.4, 1.4],
    rim: 0.3, scatter: 0.2, cluster: 1, skirt: 0.6, body: 0.45, wander: 0, ...opts };
  o.sizeRange = toVec2(o.size); o.radiusRange = toVec2(o.radius);
  const funnelOpacity = o.opacity; o.opacity = opts.puffOpacity ?? Math.min(1, o.opacity * 1.2);
  const n = o.count, pos = new Float32Array(n * 3), info = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { pos.set([rng(), rng(), rng()], i * 3); info.set([0.6 + rng() * 0.8, rng(), rng(), rng()], i * 4); }
  const sys = puffSystem(o, pos, info, { PUFF_MOTION: 2, PUFF_LIT: '' });
  const U = sys.uniforms, puffs = sys.object; puffs.renderOrder = (o.renderOrder ?? 2) + 1;
  // funnel: two nested shells of a surface of revolution, displaced and textured in the shader
  const RINGS = 24, SEG = 28, P = [], UV = [], SH = [], idx = [];
  for (const [mul, op] of [[1, 1], [0.58, 0.8]]) {
    const base = P.length / 3, ph = rng();
    for (let j = 0; j <= RINGS; j++) for (let i = 0; i <= SEG; i++) { P.push(0, 0, 0); UV.push(i / SEG, j / RINGS); SH.push(mul, ph, op); }
    for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) { const a = base + j * (SEG + 1) + i, b = a + SEG + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); fg.setAttribute('aShell', new THREE.Float32BufferAttribute(SH, 3)); fg.setIndex(idx);
  const shared = { uTime: U.uTime, uHeight: U.uHeight, uSway: U.uSway, uSpin: U.uSpin, uRate: U.uRate, uBase: U.uBase, uRadius: U.uRadius };
  const funnelUniforms = { ...shared, uColor: U.uColor, uColorTop: U.uColorTop, uShadow: U.uShadow, uSunColor: U.uSunColor, uSunDir: U.uSunDir,
    uOpacity: { value: funnelOpacity }, uTwist: { value: o.twist }, uScatter: U.uScatter };
  const funnel = fxMesh(fg, shader({ uniforms: funnelUniforms, vertexShader: FUNNEL_VERT, fragmentShader: FUNNEL_FRAG, fog: o.fog !== false, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT }), o.renderOrder ?? 2);
  const object = new THREE.Group(); object.add(funnel, puffs);
  let debris = null;
  if (o.debris > 0) {
    const dg = quadGeometry(o.debris), seed = new Float32Array(o.debris * 4); for (let i = 0; i < seed.length; i++) seed[i] = rng();
    iattr(dg, 'aSeed', seed, 4);
    debris = fxMesh(dg, shader({ uniforms: { ...shared, uColor: U.uColor, uShadow: U.uShadow, uOpacity: { value: 0.85 }, uDebrisSize: { value: o.debrisSize ?? 0.14 } },
      vertexShader: DEBRIS_VERT, fragmentShader: DEBRIS_FRAG, fog: o.fog !== false, transparent: true, depthWrite: false, ...PREMULT }), (o.renderOrder ?? 2) + 2);
    object.add(debris);
  }
  const H = U.uHeight.value, reach = H * 0.5 + U.uRadius.value.y * 2.5 + o.sizeRange.y + U.uSway.value;
  const spheres = [funnel, puffs, debris].filter(Boolean).map((m) => setBounds(m, U.uBase.value, reach));
  const home = U.uBase.value.clone(), ph = rng() * 10;
  sys.object = object; sys.funnel = funnel; sys.puffs = puffs; sys.debris = debris; sys.funnelUniforms = funnelUniforms;
  sys.triangles = idx.length / 3 + n * 2 + o.debris * 2;
  sys.update = (dt, time) => {
    U.uTime.value = time;
    if (o.wander > 0) U.uBase.value.set(home.x + Math.sin(time * 0.21 + ph) * o.wander, home.y, home.z + Math.sin(time * 0.13 + ph * 2) * o.wander);
    for (const s of spheres) s.center.set(U.uBase.value.x, U.uBase.value.y + H * 0.5, U.uBase.value.z);
  };
  sys.update(0, U.uTime.value);
  return sys;
}

// =====================================================================================
// MATERIALS: a shared procedural "environment" (key light + sky/ground gradient that shiny
// things reflect, since there is no environment map) and special surface shaders.
// All are ShaderMaterials that write linear HDR, support fog, vertex colours and instancing.
// Animated ones read uniforms.uTime: pass a shared `time: { value: 0 }` and set it once per frame.
// =====================================================================================


// Shared lighting description for the fx materials. Pass the same env to every material in a world
// and they all follow env.setSun(dir, color).
export function makeEnv(opts = {}) {
  const sun = toColor(opts.sunColor, '#fff0da').multiplyScalar(opts.sunIntensity ?? 1.1);
  const uniforms = {
    uEnvSunDir: { value: toVec3(opts.sunDir, [0.4, 0.8, 0.45]).normalize() }, uEnvSunColor: { value: sun },
    uEnvSky: { value: toColor(opts.sky, '#7fa3d6') }, uEnvHorizon: { value: toColor(opts.horizon, '#e6d6c2') }, uEnvGround: { value: toColor(opts.ground, '#4a4038') },
    uEnvAmbient: { value: opts.ambient ?? 0.5 },
  };
  return {
    uniforms,
    setSun(dir, color, intensity = 1) { uniforms.uEnvSunDir.value.copy(toVec3(dir)).normalize(); if (color != null) uniforms.uEnvSunColor.value.copy(toColor(color)).multiplyScalar(intensity); },
    setColors(sky, horizon, ground) { if (sky != null) uniforms.uEnvSky.value.copy(toColor(sky)); if (horizon != null) uniforms.uEnvHorizon.value.copy(toColor(horizon)); if (ground != null) uniforms.uEnvGround.value.copy(toColor(ground)); },
  };
}

// Small equirect HDR texture of the same environment, for scene.environment / MeshStandardMaterial.envMap.
export function makeEnvMap(env = makeEnv(), opts = {}) {
  const w = opts.width ?? 64, h = w / 2, data = new Uint16Array(w * h * 4), U = env.uniforms;
  const sun = U.uEnvSunDir.value, sc = U.uEnvSunColor.value, sky = U.uEnvSky.value, hz = U.uEnvHorizon.value, gd = U.uEnvGround.value;
  const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const th = ((j + 0.5) / h) * Math.PI, ph = ((i + 0.5) / w) * Math.PI * 2 - Math.PI;
    const y = Math.cos(th), s = Math.sin(th), x = s * Math.sin(ph) * -1, z = s * Math.cos(ph) * -1;
    const k = Math.pow(ss(0, 1, Math.max(y, 0)), 0.6), g = ss(0, 0.55, -y), m = ss(-0.12, 0.12, y);
    const sd = Math.max(0, x * sun.x + y * sun.y + z * sun.z), sp = Math.pow(sd, 60) * 5 + Math.pow(sd, 6) * 0.15;
    const o = (j * w + i) * 4, ch = ['r', 'g', 'b'];
    for (let c = 0; c < 3; c++) {
      const a = ch[c], skyc = hz[a] + (sky[a] - hz[a]) * k, gnd = hz[a] * 0.4 + (gd[a] - hz[a] * 0.4) * g;
      data[o + c] = THREE.DataUtils.toHalfFloat(Math.min(60, gnd + (skyc - gnd) * m + sc[a] * sp));
    }
    data[o + 3] = THREE.DataUtils.toHalfFloat(1);
  }
  const tex = new THREE.DataTexture(data, w, h, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.mapping = THREE.EquirectangularReflectionMapping; tex.colorSpace = THREE.LinearSRGBColorSpace;
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.flipY = true; tex.needsUpdate = true;
  return tex;
}

const MAT_VERT = /* glsl */`
#include <common>
#include <color_pars_vertex>
uniform float uTime;
varying vec3 vWorldPos, vWorldNormal, vObjPos, vObjNormal; varying vec2 vUv;
${GLSL_HASH}${GLSL_FOG_PARS_VERT}
//PARS
void main(){
  vUv = uv;
  #include <color_vertex>
  #include <beginnormal_vertex>
  vObjNormal = objectNormal;
  #include <defaultnormal_vertex>
  #include <begin_vertex>
  //HOOK
  #include <project_vertex>
  vObjPos = position;
  vec4 wp = vec4(transformed, 1.);
  #ifdef USE_INSTANCING
  wp = instanceMatrix*wp;
  #endif
  wp = modelMatrix*wp;
  vWorldPos = wp.xyz;
  vWorldNormal = normalize(inverseTransformDirection(transformedNormal, viewMatrix));
  ${GLSL_FOG_VERT}
}`;
const MAT_FRAG = /* glsl */`precision highp float;
uniform float uTime;
varying vec3 vWorldPos, vWorldNormal, vObjPos, vObjNormal; varying vec2 vUv;
#if defined(USE_COLOR) || defined(USE_INSTANCING_COLOR)
varying vec3 vColor;
#endif
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_FOG_PARS_FRAG}${GLSL_ENV}
vec3 fxVertexColor(){
#if defined(USE_COLOR) || defined(USE_INSTANCING_COLOR)
  return vColor;
#else
  return vec3(1.);
#endif
}
vec3 fxNormal(){
#ifdef FACETED
  vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
  if(dot(n, cameraPosition - vWorldPos) < 0.) n = -n;
  return n;
#else
  vec3 n = normalize(vWorldNormal);
  return gl_FrontFacing ? n : -n;
#endif
}
float fxLuma(vec3 c){ return dot(c, vec3(.2126,.7152,.0722)); }
`;

function fxMat(o, { frag, uniforms, defines = {}, vertHook = '', vertPars = '', ...rest }) {
  const env = o.env || makeEnv();
  const m = shader({
    uniforms: { uTime: timeUniform(o), ...env.uniforms, ...uniforms },
    vertexShader: MAT_VERT.replace('//HOOK', vertHook).replace('//PARS', vertPars), fragmentShader: MAT_FRAG + frag,
    defines: { ...(o.faceted ? { FACETED: '' } : {}), ...defines },
    vertexColors: !!o.vertexColors, side: o.side ?? THREE.FrontSide, fog: o.fog !== false, ...rest,
  });
  m.userData.env = env;
  return m;
}
const U = (v) => ({ value: v });

// Faceted gem: fresnel reflection, fake internal refraction with depth-tinted absorption and inner glow.
export function crystalMaterial(o = {}) {
  return fxMat({ faceted: true, ...o }, {
    uniforms: { uColor: U(toColor(o.color, '#7fd8ff')), uGlow: U(toColor(o.glowColor ?? o.color, '#5fc8ff')), uGlowAmt: U(o.glow ?? 0.7), uIor: U(o.ior ?? 1.6),
      uSparkle: U(o.sparkle ?? 1), uPulse: U(o.pulse ?? 0.15), uDensity: U(o.density ?? 1.5), uReflect: U(o.reflect ?? 1) },
    frag: /* glsl */`
uniform vec3 uColor, uGlow; uniform float uGlowAmt, uIor, uSparkle, uPulse, uDensity, uReflect;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos);
  float ndv = max(dot(N,V), 0.);
  vec3 tint = uColor*fxVertexColor();
  float F = fxFresnel(ndv, .07);
  vec3 refl = fxEnv(reflect(-V,N), .03);
  vec3 T = refract(-V, N, 1./uIor);
  vec3 p = vObjPos*uDensity + V*1.4;
  vec3 jit = vec3(vnoise(p), vnoise(p+17.3), vnoise(p+31.7)) - .5;
  float facet = 1.;
#ifdef FACETED
  vec3 fid = floor(N*6. + .5);
  jit += (hash33(fid + 3.1) - .5)*.9; facet = .55 + .9*hash13(fid + 11.);
#endif
  vec3 T2 = normalize(reflect(T, normalize(N + jit*1.5)));
  vec3 inner = fxEnv(T2, .12) + fxEnv(-T2.zyx, .3)*.35;
  vec3 absorb = pow(max(tint, vec3(.03)), vec3(.7 + ndv*2.2));
  vec3 body = min(inner*absorb*1.5*facet, vec3(1.8));
  float n = vnoise(vObjPos*uDensity*.8 + T*1.3 + uTime*.07);
  float veil = smoothstep(.45,.9, vnoise(p*2.3 + 5.));
  vec3 glow = uGlow*uGlowAmt*(.12 + .88*ndv*ndv*ndv)*(.35 + n*n*1.2 + veil*.7)*facet*(1. + uPulse*sin(uTime*1.3 + vObjPos.y*.7));
  // glints: tiny 4-point stars, a few pixels across at any distance, on spots whose mirror direction lines up with the sun
  vec3 sc = vObjPos*uDensity*7., cell = floor(sc), fc = fract(sc) - .5;
  vec3 hh = hash33(cell + floor(N*9. + .5));
  float px = length(fwidth(sc));
  float al = max(dot(reflect(-V, normalize(N + (hh - .5)*.9)), uEnvSunDir), 0.);
  float rad = clamp(px*(1.2 + 2.2*hh.x), .02, .16);
  vec3 t1 = normalize(cross(N, vec3(.31, .9, .23))), t2 = cross(N, t1);
  vec2 gq = vec2(dot(fc, t1), dot(fc, t2))/rad;
  float star = exp(-dot(gq, gq)*1.6) + .7*exp(-abs(gq.x*gq.y)*30.)*exp(-dot(gq, gq)*.3);
  float sp = star*smoothstep(.6, .92, al)*step(.5, hh.z)*smoothstep(.35, .1, abs(dot(fc, N)))*(1. - smoothstep(.2, .5, px))*uSparkle;
  vec3 col = mix(body + glow, refl*uReflect, F) + refl*.1*uReflect + (uEnvSunColor + tint)*sp*2.2;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}` });
}

// Clear glass: fresnel reflection over a see-through body (alpha rises toward the silhouette).
export function glassMaterial(o = {}) {
  return fxMat(o, {
    uniforms: { uColor: U(toColor(o.color, '#cfeeff')), uOpacity: U(o.opacity ?? 0.14), uIor: U(o.ior ?? 1.5), uRough: U(o.roughness ?? 0.03), uReflect: U(o.reflect ?? 1) },
    transparent: true, depthWrite: false, ...PREMULT,
    frag: /* glsl */`
uniform vec3 uColor; uniform float uOpacity, uIor, uRough, uReflect;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos);
  float ndv = max(dot(N,V), 0.), F = fxFresnel(ndv, .05), edge = (1.-ndv)*(1.-ndv);
  vec3 refl = fxEnv(reflect(-V,N), uRough)*uReflect;
  vec3 trans = fxEnv(refract(-V, N, 1./uIor), uRough + .15)*uColor*fxVertexColor();
  float body = uOpacity + edge*.3;
  vec3 col = refl*F + trans*body;
  float a = clamp(body + F + fxLuma(refl)*F*.5, 0., 1.);
  gl_FragColor = vec4(fxFogPremult(col, a), a);
}` });
}

// Thin-film interference: soap film, beetle shell, oil slick, pearl. Opaque unless opacity < 1.
export function iridescentMaterial(o = {}) {
  const transparent = (o.opacity ?? 1) < 1;
  return fxMat(o, {
    uniforms: { uColor: U(toColor(o.color, '#2a2440')), uScale: U(o.scale ?? 1.1), uStrength: U(o.strength ?? 0.85), uRough: U(o.roughness ?? 0.15), uNoise: U(o.noise ?? 0.12),
      uFreq: U(o.frequency ?? 1.2), uShift: U(o.shift ?? 0), uOpacity: U(o.opacity ?? 1), uFlow: U(o.flow ?? 0.05) },
    ...(transparent ? { transparent: true, depthWrite: false, ...PREMULT } : {}),
    frag: /* glsl */`
uniform vec3 uColor; uniform float uScale, uStrength, uRough, uNoise, uFreq, uShift, uOpacity, uFlow;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos);
  float ndv = max(dot(N,V), 0.), F = fxFresnel(ndv, .08);
  float th = uShift + uScale*(1.-ndv) + uNoise*(fbm(vObjPos*uFreq + uTime*uFlow) - .5)*2.;
  vec3 film = .56 + .44*cos(6.2831853*(th + vec3(0.,.17,.4)));
  vec3 refl = fxEnv(reflect(-V,N), uRough);
  vec3 diff = uColor*fxVertexColor()*fxDiffuse(N);
  vec3 col = diff*(1. - .5*uStrength) + refl*film*uStrength*(.3 + 1.2*F) + film*fxDiffuse(N)*uStrength*.55;
  float a = clamp(uOpacity + F*(1.-uOpacity)*1.6 + fxLuma(refl)*.08*(1.-uOpacity), 0., 1.);
  gl_FragColor = vec4(fxApplyFog(col)*a, a);
}` });
}

// Cel shading with soft-edged bands, tinted shadows, rim and a hard highlight.
export function toonMaterial(o = {}) {
  return fxMat(o, {
    uniforms: { uColor: U(toColor(o.color, '#ff8f5a')), uShadowColor: U(toColor(o.shadowColor, '#5a4a8c')), uRimColor: U(toColor(o.rimColor, '#fff2d8')), uSteps: U(o.steps ?? 3),
      uRim: U(o.rim ?? 0.6), uSpec: U(o.specular ?? 0.5), uSoft: U(o.softness ?? 0.04) },
    frag: /* glsl */`
uniform vec3 uColor, uShadowColor, uRimColor; uniform float uSteps, uRim, uSpec, uSoft;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos), L = uEnvSunDir;
  float ndv = max(dot(N,V), 0.), nl = dot(N,L)*.5+.5;
  float st = nl*uSteps, band = (floor(st) + smoothstep(.5-uSoft, .5+uSoft, fract(st)))/uSteps;
  vec3 base = uColor*fxVertexColor();
  vec3 light = uEnvSunColor + fxAmbient(vec3(0.,1.,0.))*.6;
  vec3 col = base*mix(uShadowColor, vec3(1.), smoothstep(.0, 1., band))*light;
  float rim = smoothstep(.6, .66, (1.-ndv)*(.35+.65*nl));
  col += uRimColor*rim*uRim;
  float sp = smoothstep(.5-uSoft*2., .5+uSoft*2., pow(max(dot(N, normalize(L+V)), 0.), 48.));
  col += uRimColor*sp*uSpec;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}` });
}

// Inverted-hull outline to pair with toonMaterial: add a second mesh with the same geometry.
export function outlineMaterial(o = {}) {
  return fxMat({ ...o, side: THREE.BackSide }, {
    uniforms: { uColor: U(toColor(o.color, '#1a1420')), uThickness: U(o.thickness ?? 0.04) },
    vertPars: 'uniform float uThickness;', vertHook: 'transformed += normalize(objectNormal)*uThickness;',
    frag: /* glsl */`uniform vec3 uColor; void main(){ gl_FragColor = vec4(fxApplyFog(uColor), 1.); }` });
}

// Scan-lined, flickering projection. Additive and double sided.
export function hologramMaterial(o = {}) {
  return fxMat({ side: THREE.DoubleSide, ...o }, {
    uniforms: { uColor: U(toColor(o.color, '#39d8ff')), uColor2: U(toColor(o.rimColor, '#b8f4ff')), uLines: U(o.lines ?? 9), uSpeed: U(o.speed ?? 0.6), uIntensity: U(o.intensity ?? 0.4),
      uFlicker: U(o.flicker ?? 0.5), uOpacity: U(o.opacity ?? 1), uGlitch: U(o.glitch ?? 0.04) },
    transparent: true, depthWrite: false, ...PREMULT,
    vertPars: 'uniform float uGlitch;',
    vertHook: 'float gy = floor(position.y*7. + uTime*3.); float gt = floor(uTime*9.); transformed.x += step(.93, hash12(vec2(gy, gt)))*(hash12(vec2(gt, gy))-.5)*uGlitch*8.;',
    frag: /* glsl */`
uniform vec3 uColor, uColor2; uniform float uLines, uSpeed, uIntensity, uFlicker, uOpacity;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos);
  float ndv = abs(dot(N,V)), F = pow(1.-ndv, 2.2);
  float y = vWorldPos.y*uLines;
  float scan = pow(.5+.5*sin((y - uTime*uSpeed*uLines)*6.2831853), 2.5);
  scan = mix(.4, scan, 1.-smoothstep(.2, .55, fwidth(y)));
  float sweep = pow(.5+.5*sin(vWorldPos.y*.5 - uTime*1.9), 40.);
  float fl = 1. - uFlicker*(.5*step(.9, hash11(floor(uTime*18.))) + .12*sin(uTime*47.));
  float grain = .85 + .3*hash12(gl_FragCoord.xy + fract(uTime)*91.);
  vec3 col = mix(uColor, uColor2, F*.7)*(.04 + .4*scan + F*.9 + sweep*1.2)*uIntensity*fl*grain*uOpacity;
  col *= 1. - fxFog();
  gl_FragColor = vec4(col, 0.);
}` });
}

// Flowing molten rock: dark plates, glowing cracks that widen where the crust is thin.
// projection: 'triplanar' (default: any shape, object space so it sticks to moving things), 'xz' (world space:
// lakes, rivers, ground; cheapest) or 'uv' (the 0..1 range holds scale*10 cells). space: 'object' | 'world' overrides where the pattern is anchored.
// cool: [r0, r1] cools the lava to bare crust and then fades it out between those object-space radii, so a
// lake disc has no visible rim (the material becomes transparent: keep the disc just above the lake bed).
export function lavaMaterial(o = {}) {
  const proj = { xz: 0, uv: 1, triplanar: 2 }[o.projection || 'triplanar'] ?? 2;
  const objSpace = (o.space || (proj === 2 ? 'object' : 'world')) === 'object';
  return fxMat(o, {
    uniforms: { uCrust: U(toColor(o.crustColor, '#2a2220')), uHot1: U(toColor(o.colors?.[0], '#c21500')), uHot2: U(toColor(o.colors?.[1], '#ff6a00')), uHot3: U(toColor(o.colors?.[2], '#ffd866')),
      uScale: U(o.scale ?? 0.35), uSpeed: U(o.speed ?? 1), uGlow: U(o.glow ?? 2.4), uCrack: U(o.crack ?? 1), uFlow: U(toVec2(o.flow, [1, 0.3])), uHeat: U(o.heat ?? 0.5), uCool: U(toVec2(o.cool, [1e8, 2e8])),
      uRelief: U(o.relief ?? 0.12), uSheen: U(o.sheen ?? 1) },
    defines: { LAVA_PROJ: proj, ...(objSpace ? { LAVA_OBJECT: '' } : {}), ...(o.cool ? { LAVA_COOL: '' } : {}) },
    ...(o.cool ? { transparent: true, depthWrite: false, ...PREMULT } : {}),
    frag: /* glsl */`
uniform vec3 uCrust, uHot1, uHot2, uHot3; uniform float uScale, uSpeed, uGlow, uCrack, uHeat, uRelief, uSheen; uniform vec2 uFlow, uCool;
vec3 voro(vec2 x){ vec2 n=floor(x), f=fract(x); float f1=8., f2=8., id=0.;
  for(int j=-1;j<=1;j++) for(int i=-1;i<=1;i++){ vec2 g=vec2(float(i),float(j)); vec2 r=g+hash22(n+g)-f; float d=dot(r,r);
    if(d<f1){ f2=f1; f1=d; id=hash12(n+g+17.3); } else if(d<f2) f2=d; }
  return vec3(sqrt(f1), sqrt(f2)-sqrt(f1), id); }
// -> (heat, plate id, plate height, molten pool)
vec4 lava(vec2 p){
  float t = uTime*uSpeed;
  vec2 w = vec2(fbmLo(p*.6 + vec2(0., t*.05)), fbmLo(p*.6 + vec2(5.2, -t*.04)));
  vec2 q = p + (w-.5)*1.2 + uFlow*t*.06;
  vec3 v1 = voro(q), v2 = voro(q*2.6 + 3.1);
  float hm = fbmLo(p*.33 - uFlow*t*.02 + 9.) + (uHeat-.5)*.6;
  float wc = uCrack*(.35 + 2.4*smoothstep(.4,.85,hm));
  float c1 = 1.-smoothstep(0., wc*.1, v1.y);
  float c2 = (1.-smoothstep(0., wc*.07, v2.y))*.55*smoothstep(.3,.7,hm);
  float pool = smoothstep(.66,.95,hm)*(.55+.45*v2.x);
  float heat = max(max(c1, c2), pool);
  heat = max(heat, exp(-v1.y*12./max(wc,.05))*.3);
  // relief: flat plate tops that bevel down into the cracks, each plate tilted a little, small plates embossed on top
  float hgt = smoothstep(0., .2, v1.y)*(.7 + .3*smoothstep(0., .1, v2.y)) + (v1.z-.5)*.3*smoothstep(.04, .3, v1.y) + (w.x-.5)*.25;
  return vec4(clamp(heat,0.,1.), v1.z, hgt*(1.-pool), pool); }
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos);
#ifdef LAVA_OBJECT
  vec3 lp = vObjPos*uScale, ln = vObjNormal;
#else
  vec3 lp = vWorldPos*uScale, ln = vWorldNormal;
#endif
#if LAVA_PROJ == 1
  vec4 h = lava(vUv*uScale*10.);
#elif LAVA_PROJ == 2
  vec3 bw = pow(abs(normalize(ln)), vec3(4.)); bw /= bw.x+bw.y+bw.z;
  vec4 h = vec4(0.); float ws = 0.;
  if(bw.x > .03){ h += lava(lp.yz)*bw.x; ws += bw.x; }
  if(bw.y > .03){ h += lava(lp.xz)*bw.y; ws += bw.y; }
  if(bw.z > .03){ h += lava(lp.xy)*bw.z; ws += bw.z; }
  h /= ws;
#else
  vec4 h = lava(lp.xz);
#endif
  float heat = h.x, alpha = 1.;
#ifdef LAVA_COOL
  float cr = length(vObjPos.xz), cm = mix(uCool.x, uCool.y, .55);
  heat *= 1. - smoothstep(uCool.x, cm, cr); alpha = 1. - smoothstep(cm, uCool.y, cr);
#endif
  // bump the normal with the plate height (screen-space derivatives, so it works for every projection)
  vec3 dpx = dFdx(vWorldPos), dpy = dFdy(vWorldPos); float hx = dFdx(h.z), hy = dFdy(h.z);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  vec3 Nb = normalize(abs(det)*N - sign(det)*(hx*r1 + hy*r2)*(uRelief/uScale));
  float ndv = max(dot(Nb,V),0.);
  vec3 em = uHot1*smoothstep(0.,.35,heat); em = mix(em, uHot2, smoothstep(.25,.7,heat)); em = mix(em, uHot3, smoothstep(.65,1.,heat));
  float shimmer = 1. + .3*h.w*sin(uTime*2.3 + vnoise(lp*3.1 + uTime*.17)*14.);       // slow heat shimmer in the molten pools
  em *= uGlow*(.3 + .7*heat)*(.88 + .12*sin(uTime*1.7 + h.y*40.))*shimmer;
  float mottle = vnoise(lp*2.7 + h.y*17.), grit = vnoise(lp*11.);
  vec3 crust = uCrust*(.45 + 1.1*h.y)*(.5 + .9*mottle*mottle + .45*grit)*fxVertexColor();
  vec3 R = reflect(-V, Nb);
  vec3 col = crust*fxDiffuse(Nb) + (fxEnvSky(R, .5)*.4 + fxEnvSun(R, .4)*.3)*min(fxFresnel(ndv, .04), .28)*uSheen*(.5 + .9*mottle)*(1.-h.w);   // a dull sheen on the cooled plates
  col += uHot2*uGlow*.1*pow(1. - clamp(h.z, 0., 1.), 3.)*max(dot(Nb, N), 0.);        // the cracks light the plate edges from below
  col = mix(col, em, smoothstep(0., .3, heat)) + uHot1*uGlow*.04*(1.-heat);
  gl_FragColor = vec4(fxApplyFog(col)*alpha, alpha);
}` });
}

// Dew drop / water bead: inverted lens image, bright caustic crescent away from the light, hard highlight.
export function waterDropMaterial(o = {}) {
  return fxMat(o, {
    uniforms: { uColor: U(toColor(o.color, '#dff4ff')), uOpacity: U(o.opacity ?? 0.45), uCaustic: U(o.caustic ?? 1.4) },
    transparent: true, depthWrite: false, ...PREMULT,
    frag: /* glsl */`
uniform vec3 uColor; uniform float uOpacity, uCaustic;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos);
  float ndv = max(dot(N,V), 0.), F = fxFresnel(ndv, .03);
  vec3 T = refract(-V, N, .75);
  vec3 lens = fxEnv(normalize(-T + N*.35), .08)*uColor*fxVertexColor();
  float ca = pow(max(dot(N, -uEnvSunDir)*.5+.5, 0.), 5.)*smoothstep(0.,.35,ndv);
  vec3 refl = fxEnv(reflect(-V,N), .015);
  float body = clamp(uOpacity + (1.-uOpacity)*(1.-ndv)*(1.-ndv)*.8, 0., 1.);
  vec3 col = lens*(.3 + .7*smoothstep(0.,.5,ndv))*.85*body + uEnvSunColor*uColor*ca*uCaustic + refl*F*1.4;
  float a = clamp(body + F + ca*.7 + fxLuma(refl)*F, 0., 1.);
  gl_FragColor = vec4(fxFogPremult(col, a), a);
}` });
}

// Flowing lines of light over a dark body (conduits, runes, shields). axis: 'v' | 'u' | 'y' (object space).
export function energyMaterial(o = {}) {
  const additive = !!o.additive;
  return fxMat(o, {
    uniforms: { uColor: U(toColor(o.color, '#35e0ff')), uColor2: U(toColor(o.color2, '#d0fbff')), uBase: U(toColor(o.baseColor, '#06080d')), uLines: U(o.lines ?? 8), uSpeed: U(o.speed ?? 1),
      uIntensity: U(o.intensity ?? 2.6), uWarp: U(o.warp ?? 0.6), uRim: U(o.rim ?? 0.35), uStretch: U(o.stretch ?? 1) },
    defines: { ENERGY_AXIS: { v: 0, u: 1, y: 2 }[o.axis || 'v'] ?? 0, ...(additive ? { ENERGY_ADD: '' } : {}) },
    ...(additive ? { transparent: true, depthWrite: false, ...PREMULT } : {}),
    frag: /* glsl */`
uniform vec3 uColor, uColor2, uBase; uniform float uLines, uSpeed, uIntensity, uWarp, uRim, uStretch;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos);
  float ndv = max(dot(N,V), 0.);
#if ENERGY_AXIS == 1
  float c = vUv.x*uStretch, s = vUv.y;
#elif ENERGY_AXIS == 2
  float c = vObjPos.y*uStretch, s = atan(vObjPos.z, vObjPos.x)/6.2831853;
#else
  float c = vUv.y*uStretch, s = vUv.x;
#endif
  float t = uTime*uSpeed;
  float w = (fbmLo(vec2(s*uLines*.6, c*1.5 - t*.3)) - .5)*uWarp;
  float l = s*uLines + w;
  float line = pow(abs(cos(l*3.14159265)), 44.) + .25*pow(abs(cos(l*3.14159265)), 6.);
  float id = floor(l + .5);
  float pulse = pow(.5+.5*sin(c*5. - t*(2.+hash11(id)*2.) + hash11(id+7.)*6.2831853), 5.);
  float I = line*(.22 + 1.7*pulse) + .03;
  vec3 em = mix(uColor, uColor2, pulse*line)*I*uIntensity + uColor*pow(1.-ndv, 3.)*uRim;
#ifdef ENERGY_ADD
  gl_FragColor = vec4(em*(1.-fxFog()), 0.);
#else
  vec3 col = uBase*fxVertexColor()*fxDiffuse(N) + fxEnv(reflect(-V,N), .25)*fxFresnel(ndv,.04)*.5 + em;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
#endif
}` });
}

// Glazed white ceramic with soft wrapped light and an optional cobalt brush pattern.
export function porcelainMaterial(o = {}) {
  return fxMat(o, {
    uniforms: { uColor: U(toColor(o.color, '#e9ecf2')), uPattern: U(toColor(o.patternColor, '#1c3f9e')), uPatternAmt: U(o.pattern ?? 0.85), uPatternScale: U(o.patternScale ?? 1),
      uGloss: U(o.gloss ?? 1), uSubsurface: U(toColor(o.subsurface, '#ffd9c2')) },
    frag: /* glsl */`
uniform vec3 uColor, uPattern, uSubsurface; uniform float uPatternAmt, uPatternScale, uGloss;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos), L = uEnvSunDir;
  float ndv = max(dot(N,V), 0.), nl = dot(N,L);
  vec3 p = vObjPos*uPatternScale; float ang = atan(p.z, p.x), rad = max(length(p.xz), .25);
  float rows = p.y*.62, row = floor(rows), fy = fract(rows) - .5, nf = 7.;
  float fa = fract(ang/6.2831853*nf + .5*mod(row, 2.)) - .5;
  vec2 fp = vec2(fa*6.2831853/nf*rad, fy/.62);
  float fr = length(fp), ft = atan(fp.y, fp.x);
  float flower = smoothstep(.035, -.035, fr - (.3 + .15*cos(ft*5. + row*2.)))*(1. - .85*smoothstep(.1, .06, fr));
  float leaf = smoothstep(.03, -.03, abs(fp.y - .55*fp.x*sign(fp.x)) - .05*(1.-smoothstep(.45, .75, abs(fp.x))))*smoothstep(.4, .5, abs(fp.x))*smoothstep(.85, .7, abs(fp.x));
  float vine = smoothstep(.07, .03, abs(abs(fy) - .46 + .03*sin(ang*nf*2.)));
  float m = clamp(max(flower, leaf*.9) + vine, 0., 1.)*uPatternAmt*(.72 + .28*vnoise(p*13.));
  vec3 alb = mix(uColor, uPattern, m)*fxVertexColor();
  float wrap = max((nl + .4)/1.4, 0.);
  vec3 col = alb*(fxAmbient(N) + uEnvSunColor*wrap*wrap*1.05);
  col += alb*uSubsurface*uEnvSunColor*pow(max(1.-abs(nl), 0.), 3.)*.12;
  float F = fxFresnel(ndv, .05);
  col = col*(1.-F*.6) + fxEnv(reflect(-V,N), .05)*F*uGloss + fxEnv(reflect(-V,N), .4)*.03*uGloss;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}` });
}

// Matte paper with fibres and back-lit translucency. faceted: true gives crisp origami folds.
export function paperMaterial(o = {}) {
  return fxMat({ side: THREE.DoubleSide, ...o }, {
    uniforms: { uColor: U(toColor(o.color, '#f1e9da')), uTrans: U(toColor(o.translucentColor, '#ffcf9a')), uFiber: U(o.fiber ?? 1), uFiberScale: U(o.fiberScale ?? 6), uTranslucency: U(o.translucency ?? 0.6) },
    frag: /* glsl */`
uniform vec3 uColor, uTrans; uniform float uFiber, uFiberScale, uTranslucency;
void main(){
  vec3 N = fxNormal(), L = uEnvSunDir; float nl = dot(N,L);
  vec3 p = vObjPos*uFiberScale;
  float fib = vnoise(p*vec3(1.,7.,1.))*.45 + vnoise(p.zxy*vec3(1.,9.,1.) + 7.)*.3 + vnoise(p*5.)*.25;
  vec3 alb = uColor*fxVertexColor()*(1. - uFiber*.22*(fib-.5)*2.);
  vec3 col = alb*(fxAmbient(N)*1.1 + uEnvSunColor*max(nl, 0.)*.95);
  col += alb*uTrans*uEnvSunColor*max(-nl, 0.)*uTranslucency*(.8 + .4*fib);
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}` });
}

// Polished metal lit by the procedural environment. goldMaterial is this with gold defaults.
export function metalMaterial(o = {}) {
  return fxMat(o, {
    uniforms: { uColor: U(toColor(o.color, '#c9ccd4')), uRough: U(o.roughness ?? 0.2), uBump: U(o.bump ?? 0), uBumpScale: U(o.bumpScale ?? 6), uBrushed: U(o.brushed ?? 0), uEnvSat: U(o.envSaturation ?? 0.5) },
    frag: /* glsl */`
uniform vec3 uColor; uniform float uRough, uBump, uBumpScale, uBrushed, uEnvSat;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos);
  vec3 p = vObjPos*uBumpScale;
  if(uBump > 0.) N = normalize(N + (vec3(vnoise(p), vnoise(p+19.1), vnoise(p+41.7)) - .5)*uBump);
  if(uBrushed > 0.){ vec3 pb = vObjPos*vec3(3., 160., 3.); N = normalize(N + (vec3(vnoise(pb), 0., vnoise(pb+9.)) - vec3(.5,0.,.5))*uBrushed*.25); }
  float ndv = max(dot(N,V), 0.);
  vec3 base = uColor*fxVertexColor();
  vec3 F = base + (1.-base)*pow(1.-ndv, 5.);
  vec3 R = reflect(-V,N); float r2 = min(uRough + .4, 1.);
  // a strongly coloured sky times a coloured metal goes to one flat hue: reflect a partly desaturated sky, and keep
  // the sun highlight pale so the metal still reads as its own colour (gold under a red sunset stays gold)
  vec3 sky = mix(fxEnvSky(R, uRough), fxEnvSky(R, r2), .3); sky = mix(vec3(fxLuma(sky)), sky, uEnvSat);
  vec3 sun = mix(fxEnvSun(R, uRough), fxEnvSun(R, r2), .3); sun = mix(vec3(fxLuma(sun)), sun, .5 + .5*uEnvSat);
  vec3 col = sky*F + sun*mix(F, vec3(1.), .5) + base*fxDiffuse(N)*.06;
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}` });
}
export function goldMaterial(o = {}) { return metalMaterial({ color: '#ffc45a', roughness: 0.18, envSaturation: 0.2, ...o }); }

// Additive rim light: atmospheres, shields, ghosts, magic outlines.
export function fresnelGlowMaterial(o = {}) {
  return fxMat(o, {
    uniforms: { uColor: U(toColor(o.color, '#6fd0ff')), uPower: U(o.power ?? 2.5), uIntensity: U(o.intensity ?? 2.5), uInner: U(o.inner ?? 0.04), uPulse: U(o.pulse ?? 0) },
    transparent: true, depthWrite: false, ...PREMULT,
    frag: /* glsl */`
uniform vec3 uColor; uniform float uPower, uIntensity, uInner, uPulse;
void main(){
  vec3 N = fxNormal(), V = normalize(cameraPosition - vWorldPos);
  float f = pow(1.-abs(dot(N,V)), uPower);
  vec3 col = uColor*fxVertexColor()*(f + uInner)*uIntensity*(1. + uPulse*sin(uTime*2.));
  gl_FragColor = vec4(col*(1.-fxFog()), 0.);
}` });
}

// Cluster of hexagonal crystal shards (flat shaded, non-indexed, with position/normal/color).
// 3 * sides triangles per shard (18 with the default 6 sides).
export function crystalGeometry(opts = {}) {
  const rng = getRng(opts);
  const count = opts.count ?? 7, sides = opts.sides ?? 6, hr = opts.height ?? [1.5, 5], rr = opts.radius ?? [0.25, 0.7], spread = opts.spread ?? 0.9, tilt = opts.tilt ?? 0.55, lean = opts.lean ?? 0.25;
  const cols = (opts.colors || ['#ffffff']).map((c) => toColor(c));
  const P = [], C = [], tips = [];
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  const tri = (a, b, c, col, k0, k1, k2) => { for (const [p, k] of [[a, k0], [b, k1], [c, k2]]) { P.push(p.x, p.y, p.z); C.push(col.r * k, col.g * k, col.b * k); } };
  for (let i = 0; i < count; i++) {
    const big = i === 0 ? 1 : 0.45 + rng() * 0.55, h = (hr[0] + (hr[1] - hr[0]) * (i === 0 ? 1 : rng())) * big, r = (rr[0] + (rr[1] - rr[0]) * rng()) * (0.6 + 0.4 * big);
    const a = rng() * 6.283, d = i === 0 ? 0 : (0.3 + rng() * 0.7) * spread;
    const out = (d / Math.max(spread, 1e-4)) * lean;                 // outer shards lean away from the centre
    e.set((i === 0 ? 0.1 : tilt) * (rng() - 0.5) * 2 + Math.sin(a) * out, rng() * 6.283, (i === 0 ? 0.1 : tilt) * (rng() - 0.5) * 2 - Math.cos(a) * out);
    m.compose(v.set(Math.cos(a) * d, -0.15 * h, Math.sin(a) * d), q.setFromEuler(e), one);
    const col = cols[Math.floor(rng() * cols.length)], tip = 0.72 + rng() * 0.14, ring = [], top = [];
    const off = rng() * 0.4;
    for (let s = 0; s < sides; s++) {
      const an = (s / sides) * 6.283, rs = r * (0.85 + 0.3 * rng());
      ring.push(new THREE.Vector3(Math.cos(an) * rs, 0, Math.sin(an) * rs).applyMatrix4(m));
      top.push(new THREE.Vector3(Math.cos(an) * rs * 0.92, h * (tip - off * 0.1 * Math.sin(an)), Math.sin(an) * rs * 0.92).applyMatrix4(m));
    }
    const apex = new THREE.Vector3(r * 0.15 * (rng() - 0.5), h, r * 0.15 * (rng() - 0.5)).applyMatrix4(m);
    tips.push([apex.x, apex.y, apex.z]);
    for (let s = 0; s < sides; s++) {
      const n = (s + 1) % sides;
      tri(ring[s], top[s], ring[n], col, 0.55, 1, 0.55); tri(ring[n], top[s], top[n], col, 0.55, 1, 1); tri(top[s], apex, top[n], col, 1, 1.1, 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.computeVertexNormals();
  g.userData.tips = tips; g.userData.apex = tips[0];           // local-space shard tips (the main shard first): seat glows there
  return g;
}

// =====================================================================================
// ENERGY AND MAGIC: ribbons, vortex, orbit rings, shooting stars, fireworks, lanterns
// =====================================================================================

const RIBBON_VERT = /* glsl */`
uniform float uWidth, uTime, uWave, uMaxAngle; uniform vec2 uNear;
attribute vec3 aTan; attribute vec4 aInfo;
varying vec2 vUv; varying vec4 vInfo; varying float vFade; varying float vAspect;
${GLSL_FOG_PARS_VERT}
void main(){
  vUv = uv; vInfo = aInfo;
  vec3 p = position;
  p += vec3(sin(uv.x*17. + uTime*1.1 + aInfo.x*20.), cos(uv.x*13. - uTime*.9 + aInfo.x*33.), sin(uv.x*11. + uTime*.7 + aInfo.x*7.))*uWave;
  vec4 mvPosition = modelViewMatrix*vec4(p,1.);
  float dist = length(mvPosition.xyz);
  vec3 tv = normalize(mat3(modelViewMatrix)*aTan);
  vec3 side = normalize(cross(tv, normalize(mvPosition.xyz)));
  float taper = smoothstep(0., .14, uv.x)*smoothstep(1., .86, uv.x);
  float w = min(uWidth*aInfo.y*(.25 + .75*taper), uMaxAngle*dist);    // never wider than a set angle on screen
  mvPosition.xyz += side*(uv.y-.5)*w;
  vFade = smoothstep(uNear.x, uNear.y, dist);                          // fades out where it passes close to the camera
  vAspect = aInfo.z/max(w*.5, 1e-3);                                   // ribbon length in half-widths
  gl_Position = projectionMatrix*mvPosition;
  ${GLSL_FOG_VERT}
}`;
const RIBBON_FRAG = /* glsl */`precision highp float;
uniform vec3 uColorA, uColorB; uniform float uTime, uSpeed, uIntensity, uFreq, uTrail, uHeads;
varying vec2 vUv; varying vec4 vInfo; varying float vFade; varying float vAspect;
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_FOG_PARS_FRAG}
void main(){
  float u = vUv.x, v = vUv.y*2.-1., t = uTime*uSpeed, ph = vInfo.x;
  float n = fbmLo(vec2(u*uFreq - t*.6 + ph*10., v*1.3 + ph*3.));
  float st = vnoise(vec2(u*uFreq*.6 - t*1.3 + ph*5., v*5. + ph*20.));
  float ends = smoothstep(0., .07, u)*smoothstep(1., .93, u);
  float I;
  if(uTrail > 0.){
    // travelling pulses shaped like comets: a round head that tapers to a point along its tail
    float d = fract(t*.1 + ph - u*uHeads + 1.), ds = d > .5 ? d - 1. : d;   // 0 at a head; positive behind it
    float al = ds/uHeads*vAspect;                                            // distance to the head in half-widths
    float tl = clamp(d/uTrail, 0., 1.), hw = mix(.8, .1, tl);
    float tail = step(0., ds)*exp(-tl*3.2)*exp(-v*v/(hw*hw)*1.6);
    float head = exp(-(al*al + v*v)*2.2);
    I = tail*(.55 + 1.3*n*st) + head*3.;
  } else {
    float edge = max(1.-v*v, 0.); edge *= sqrt(edge);
    I = edge*(.18 + 1.5*n*st) + exp(-v*v*14.)*(.35 + .6*n);
  }
  vec3 col = mix(uColorA, uColorB, smoothstep(.25,.8,n))*I*ends*vFade*uIntensity*(1.-fxFog());
  gl_FragColor = vec4(col, 0.);
}`;

// Glowing ribbons along curves (camera facing). curves: array of THREE.Curve or point arrays.
// With no curves it makes `count` swirling ribbons. One draw call, 2 * segments triangles per ribbon.
export function makeRibbon(opts = {}) {
  const rng = getRng(opts);
  let curves = opts.curves || (opts.curve ? [opts.curve] : null) || (opts.points ? [opts.points] : null);
  if (!curves) {
    const n = opts.count ?? 3, R = opts.radius ?? 8, H = opts.height ?? 18; curves = [];
    for (let c = 0; c < n; c++) {
      const pts = [], a0 = rng() * 6.283, turns = 1.5 + rng() * 1.5, dir = rng() < 0.5 ? -1 : 1, K = 14;
      for (let i = 0; i <= K; i++) { const f = i / K, a = a0 + dir * f * turns * 6.283, r = R * (0.35 + 0.65 * Math.sin(f * Math.PI)) * (0.7 + rng() * 0.5); pts.push(new THREE.Vector3(Math.cos(a) * r, f * H + (rng() - 0.5) * H * 0.06, Math.sin(a) * r)); }
      curves.push(pts);
    }
  }
  const SEG = opts.segments ?? 120, P = [], T = [], UV = [], I = [], idx = [], p = new THREE.Vector3(), t = new THREE.Vector3();
  for (const cv of curves) {
    const curve = cv.isCurve ? cv : new THREE.CatmullRomCurve3(cv.map((q) => toVec3(q)), false, 'centripetal');
    const base = P.length / 3, ph = rng(), ws = 0.7 + rng() * 0.6, len = curve.getLength();
    for (let i = 0; i <= SEG; i++) {
      const f = i / SEG; curve.getPointAt(f, p); curve.getTangentAt(f, t);
      for (let j = 0; j < 2; j++) { P.push(p.x, p.y, p.z); T.push(t.x, t.y, t.z); UV.push(f, j); I.push(ph, ws, len, 0); }
      if (i < SEG) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aTan', new THREE.Float32BufferAttribute(T, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4)); g.setIndex(idx);
  const colors = opts.colors || ['#38d6ff', '#e8a6ff'];
  const uniforms = {
    uTime: timeUniform(opts), uWidth: { value: opts.width ?? 1.2 }, uWave: { value: opts.wave ?? 0.15 }, uSpeed: { value: opts.speed ?? 1 },
    uIntensity: { value: opts.intensity ?? 1.1 }, uFreq: { value: opts.frequency ?? 9 }, uTrail: { value: opts.trail ?? 0 }, uHeads: { value: opts.heads ?? 1 },
    uNear: { value: toVec2(opts.near, [2, 12]) }, uMaxAngle: { value: opts.maxAngle ?? 0.06 },
    uColorA: { value: toColor(colors[0]) }, uColorB: { value: toColor(colors[1] ?? colors[0]) },
  };
  const material = shader({ uniforms, vertexShader: RIBBON_VERT, fragmentShader: RIBBON_FRAG, fog: opts.fog !== false, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 3);
  object.position.copy(toVec3(opts.position, [0, 0, 0]));
  g.computeBoundingSphere(); setBounds(object, g.boundingSphere.center, g.boundingSphere.radius + uniforms.uWidth.value + uniforms.uWave.value * 2);
  return { object, uniforms, material, triangles: idx.length / 3, update(dt, time) { uniforms.uTime.value = time; } };
}

// ---------- vortex ----------
const VORTEX_VERT = /* glsl */`
varying vec2 vUv; varying vec2 vP;
${GLSL_FOG_PARS_VERT}
void main(){ vUv = uv; vP = position.xz; vec4 mvPosition = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mvPosition; ${GLSL_FOG_VERT} }`;
const VORTEX_FRAG = /* glsl */`precision highp float;
uniform vec3 uColorA, uColorB, uColorC; uniform float uTime, uSpeed, uArms, uTwist, uIntensity, uCore, uRadius;
varying vec2 vUv; varying vec2 vP;
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FBM}${GLSL_FOG_PARS_FRAG}
void main(){
  float r = vUv.y, a = atan(vP.y, vP.x), t = uTime*uSpeed;
  float tw = uTwist*log(r + .04) + t;
  float sw = a*uArms + tw*uArms;
  float ca = cos(tw), sa = sin(tw);
  vec2 q = mat2(ca, sa, -sa, ca)*(vP/uRadius);
  float n = fbmLo(q*3.2 + vec2(0., t*.1)), n2 = vnoise(q*9. - t*.2);
  float arms = pow(.5 + .5*cos(sw + (n-.5)*2.5), 2.2);
  float I = arms*(.3 + 1.2*n) + .25*n*n2;
  float rim = smoothstep(1., .62, r)*smoothstep(0., .06, r);
  vec3 col = mix(uColorB, uColorA, smoothstep(.05, .75, r))*I*rim*uIntensity + uColorC*exp(-r*r*26.)*uCore;
  gl_FragColor = vec4(col*(1.-fxFog()), 0.);
}`;
const VPART_VERT = /* glsl */`
uniform float uTime, uSpeed, uRadius, uDepth, uTwist, uSize;
attribute vec4 aSeed; varying vec2 vUv; varying float vA; varying float vMix;
${GLSL_FOG_PARS_VERT}
void main(){
  vUv = uv; float t = uTime*uSpeed;
  float s = fract(aSeed.w + t*.07*(.6+aSeed.z));
  float r = mix(1., .04, s*s*(3.-2.*s))*(.75+.25*aSeed.x);
  float ang = aSeed.y*6.2831853 - uTwist*log(r + .04) - t*(.4 + .5*aSeed.z);
  float fy = 1.-r; vec3 p = vec3(cos(ang)*r*uRadius, -uDepth*fy*fy*fy + (aSeed.x-.5)*uRadius*.06*r, sin(ang)*r*uRadius);
  vec4 mvPosition = modelViewMatrix*vec4(p,1.);
  mvPosition.xy += position.xy*uSize*(.5+aSeed.z)*(.4+.6*r);
  vA = smoothstep(0., .12, s)*(1.-smoothstep(.85, 1., s)); vMix = r;
  gl_Position = projectionMatrix*mvPosition;
  ${GLSL_FOG_VERT}
}`;
const VPART_FRAG = /* glsl */`precision highp float;
uniform vec3 uColorA, uColorB; uniform float uIntensity; varying vec2 vUv; varying float vA; varying float vMix;
${GLSL_FOG_PARS_FRAG}
void main(){ vec2 q = vUv*2.-1.; float g = max(1.-dot(q,q), 0.); g = g*g*g;
  gl_FragColor = vec4(mix(uColorB, uColorA, vMix)*g*(1.+2.*g)*vA*uIntensity*(1.-fxFog()), 0.); }`;

// Swirling funnel of light in the object's XZ plane (axis = +Y, funnel sinks to -Y), plus inward-spiralling motes.
// 2 draw calls, ~4k triangles.
export function makeVortex(opts = {}) {
  const rng = getRng(opts);
  const R = opts.radius ?? 20, depth = opts.depth ?? 10, RINGS = 26, SEG = 72, P = [], UV = [], idx = [];
  for (let j = 0; j <= RINGS; j++) for (let i = 0; i <= SEG; i++) {
    const r = j / RINGS, a = (i / SEG) * 6.2831853, f = 1 - r;
    P.push(Math.cos(a) * r * R, -depth * f * f * f, Math.sin(a) * r * R); UV.push(i / SEG, r);
  }
  for (let j = 0; j < RINGS; j++) for (let i = 0; i < SEG; i++) { const a = j * (SEG + 1) + i, b = a + SEG + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(idx);
  const colors = opts.colors || ['#5a4dff', '#35e6ff', '#ffffff'];
  const uTime = timeUniform(opts);
  const shared = { uTime, uSpeed: { value: opts.speed ?? 1 }, uTwist: { value: opts.twist ?? 2.4 }, uRadius: { value: R },
    uColorA: { value: toColor(colors[0]) }, uColorB: { value: toColor(colors[1] ?? colors[0]) }, uColorC: { value: toColor(colors[2] ?? '#ffffff') } };
  const uniforms = { ...shared, uArms: { value: opts.arms ?? 3 }, uIntensity: { value: opts.intensity ?? 1 }, uCore: { value: opts.core ?? 2 } };
  const material = shader({ uniforms, vertexShader: VORTEX_VERT, fragmentShader: VORTEX_FRAG, fog: opts.fog !== false, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const disc = fxMesh(g, material, opts.renderOrder ?? 3); g.computeBoundingSphere(); setBounds(disc, g.boundingSphere.center, g.boundingSphere.radius);
  const object = new THREE.Group(); object.add(disc);
  const n = opts.particles ?? 500;
  if (n > 0) {
    const pg = quadGeometry(n), seed = new Float32Array(n * 4); for (let i = 0; i < n * 4; i++) seed[i] = rng();
    iattr(pg, 'aSeed', seed, 4);
    const pm = shader({ uniforms: { ...shared, uDepth: { value: depth }, uSize: { value: opts.particleSize ?? R * 0.035 }, uIntensity: { value: (opts.intensity ?? 1) * 1.1 } },
      vertexShader: VPART_VERT, fragmentShader: VPART_FRAG, fog: opts.fog !== false, transparent: true, depthWrite: false, ...PREMULT });
    const motes = fxMesh(pg, pm, (opts.renderOrder ?? 3) + 1); setBounds(motes, [0, -depth * 0.5, 0], R * 1.1 + Math.abs(depth));
    object.add(motes);
  }
  object.position.copy(toVec3(opts.position, [0, 0, 0]));
  return { object, uniforms, material, triangles: idx.length / 3 + n * 2, update(dt, time) { uTime.value = time; } };
}

// ---------- orbit rings ----------
const ORBIT_VERT = /* glsl */`
uniform float uTime, uSpeed;
attribute vec4 aRing; attribute vec3 aAxis;
varying vec2 vUv; varying vec4 vRing;
${GLSL_FOG_PARS_VERT}
void main(){
  vUv = uv; vRing = aRing;
  float ang = uTime*uSpeed*aRing.z; float ca = cos(ang), sa = sin(ang);
  vec3 p = position*ca + cross(aAxis, position)*sa + aAxis*dot(aAxis, position)*(1.-ca);
  vec4 mvPosition = modelViewMatrix*vec4(p,1.);
  gl_Position = projectionMatrix*mvPosition;
  ${GLSL_FOG_VERT}
}`;
const ORBIT_FRAG = /* glsl */`precision highp float;
uniform vec3 uColorA, uColorB; uniform float uTime, uSpeed, uIntensity, uBands, uBeads;
varying vec2 vUv; varying vec4 vRing;
${GLSL_HASH}${GLSL_VALUE_NOISE}${GLSL_FOG_PARS_FRAG}
void main(){
  float v = vUv.y*2.-1., ph = vRing.x, uu = vUv.x + uTime*uSpeed*vRing.y*.03;
  float bands = .25 + .75*vnoise(vec2((v*.5+.5)*uBands + ph*30., ph*7.));
  bands *= smoothstep(1., .7, abs(v));
  float arc = .5 + .5*sin(uu*6.2831853*2. + ph*9.) ; arc = .3 + .7*arc*arc;
  float beads = pow(.5 + .5*sin(uu*6.2831853*floor(uBeads*(.5+ph))), 14.)*exp(-v*v*7.);
  float I = bands*arc + beads*1.6;
  vec3 col = mix(uColorA, uColorB, fract(ph*3.7))*I*vRing.w*uIntensity*(1.-fxFog());
  gl_FragColor = vec4(col, 0.);
}`;

// Thin glowing rings that spin and precess about a centre (planet rings, gyroscopes, magic circles).
// One draw call, 256 triangles per ring.
export function makeOrbitRings(opts = {}) {
  const rng = getRng(opts);
  const count = opts.count ?? 4, rr = opts.radius ?? [6, 12], width = opts.width ?? 0.9, SEG = 128, tilt = opts.tilt ?? 1;
  const P = [], UV = [], RG = [], AX = [], idx = [], v = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler(), ax = new THREE.Vector3();
  for (let c = 0; c < count; c++) {
    const r = rr[0] + (rr[1] - rr[0]) * (count > 1 ? c / (count - 1) : 0.5), w = width * (0.5 + rng()), base = P.length / 3;
    q.setFromEuler(e.set((rng() - 0.5) * 2.4 * tilt, rng() * 6.283, (rng() - 0.5) * 2.4 * tilt));
    ax.set((rng() - 0.5) * 0.8, 1, (rng() - 0.5) * 0.8).normalize();
    const ph = rng(), spd = (rng() < 0.5 ? -1 : 1) * (0.5 + rng()), pre = (rng() - 0.5) * 0.6, br = 0.6 + rng() * 0.6;
    for (let i = 0; i <= SEG; i++) {
      const a = (i / SEG) * 6.2831853;
      for (let j = 0; j < 2; j++) { const rad = r + (j - 0.5) * w; v.set(Math.cos(a) * rad, 0, Math.sin(a) * rad).applyQuaternion(q); P.push(v.x, v.y, v.z); UV.push(i / SEG, j); RG.push(ph, spd, pre, br); AX.push(ax.x, ax.y, ax.z); }
      if (i < SEG) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  g.setAttribute('aRing', new THREE.Float32BufferAttribute(RG, 4)); g.setAttribute('aAxis', new THREE.Float32BufferAttribute(AX, 3)); g.setIndex(idx);
  const colors = opts.colors || ['#ffd27a', '#7ad8ff'];
  const uniforms = { uTime: timeUniform(opts), uSpeed: { value: opts.speed ?? 1 }, uIntensity: { value: opts.intensity ?? 1.2 }, uBands: { value: opts.bands ?? 7 }, uBeads: { value: opts.beads ?? 24 },
    uColorA: { value: toColor(colors[0]) }, uColorB: { value: toColor(colors[1] ?? colors[0]) } };
  const material = shader({ uniforms, vertexShader: ORBIT_VERT, fragmentShader: ORBIT_FRAG, fog: opts.fog !== false, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 3);
  object.position.copy(toVec3(opts.position, [0, 0, 0]));
  setBounds(object, [0, 0, 0], Math.max(rr[0], rr[1]) + width * 1.5);
  return { object, uniforms, material, triangles: idx.length / 3, update(dt, time) { uniforms.uTime.value = time; } };
}

// ---------- shooting stars ----------
const SSTAR_VERT = /* glsl */`
uniform float uTime, uDuration, uRadius, uWidth;
attribute vec3 aDir; attribute vec3 aVel; attribute vec4 aParam;
varying vec2 vUv; varying float vI;
${GLSL_HASH}
void main(){
  vUv = uv;
  float cyc = uTime/aParam.x + aParam.y, k = floor(cyc);
  float s = fract(cyc)*aParam.x/uDuration;
  float ra = hash12(vec2(k, aParam.y*91.))*6.2831853; float cr = cos(ra), sr = sin(ra);
  mat3 rot = mat3(cr, 0., -sr, 0., 1., 0., sr, 0., cr);
  vec3 d0 = rot*aDir, vel = rot*aVel;
  float tail = aParam.z*.5*sin(3.14159265*clamp(s,0.,1.));
  vec3 p = normalize(d0 + vel*(aParam.z*s - (.5-position.y)*tail));
  vec4 mvPosition = viewMatrix*vec4(cameraPosition + p*uRadius, 1.);
  vec3 axv = normalize(mat3(viewMatrix)*vel);
  vec3 side = normalize(cross(axv, normalize(mvPosition.xyz)));
  mvPosition.xyz += side*position.x*uWidth*uRadius*(.4 + .6*uv.y);
  vI = pow(sin(3.14159265*clamp(s,0.,1.)), .6)*aParam.w*smoothstep(-.02, .12, p.y);
  gl_Position = projectionMatrix*mvPosition;
  if(s > 1. || vI < .003) gl_Position = vec4(2.,2.,2.,1.);
}`;
const SSTAR_FRAG = /* glsl */`precision highp float;
uniform vec3 uColor, uTail; uniform float uIntensity; varying vec2 vUv; varying float vI;
void main(){
  float x = vUv.x*2.-1., y = clamp(vUv.y,0.,1.);   // clamped: multisampling extrapolates a varying past its range on thin quads, and pow of a negative base is undefined
  float ac = exp(-x*x*7.);
  float a = ac*pow(y, 2.6) + exp(-((1.-y)*(1.-y))*900. - x*x*3.)*2.5;
  gl_FragColor = vec4(mix(uTail, uColor, pow(y, 3.))*a*vI*uIntensity, 0.);
}`;

// Meteors streaking across the sky dome (follows the camera). One draw call, 2 triangles each.
export function makeShootingStars(opts = {}) {
  const rng = getRng(opts);
  const n = opts.count ?? 14, g = quadGeometry(n), D = new Float32Array(n * 3), V = new Float32Array(n * 3), PR = new Float32Array(n * 4);
  const d = new THREE.Vector3(), v = new THREE.Vector3(), minE = opts.minElevation ?? 0.25, period = opts.period ?? [5, 14];
  for (let i = 0; i < n; i++) {
    const a = rng() * 6.283, y = minE + rng() * (0.95 - minE); const s = Math.sqrt(1 - y * y);
    d.set(Math.cos(a) * s, y, Math.sin(a) * s);
    v.set(rng() - 0.5, -(0.25 + rng() * 0.8), rng() - 0.5); v.addScaledVector(d, -v.dot(d)).normalize();
    D.set([d.x, d.y, d.z], i * 3); V.set([v.x, v.y, v.z], i * 3);
    PR.set([period[0] + (period[1] - period[0]) * rng(), rng(), 0.25 + rng() * 0.45, 0.5 + rng() * 0.5], i * 4);
  }
  iattr(g, 'aDir', D, 3); iattr(g, 'aVel', V, 3); iattr(g, 'aParam', PR, 4);
  const uniforms = { uTime: timeUniform(opts), uDuration: { value: opts.duration ?? 1.1 }, uRadius: { value: opts.radius ?? 1500 }, uWidth: { value: opts.width ?? 0.006 },
    uColor: { value: toColor(opts.color, '#ffffff') }, uTail: { value: toColor(opts.tailColor, '#7fb4ff') }, uIntensity: { value: opts.intensity ?? 5 } };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: SSTAR_VERT, fragmentShader: SSTAR_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 0);
  return { object, uniforms, material, count: n, update(dt, time) { uniforms.uTime.value = time; } };
}

// ---------- fireworks ----------
const FW_VERT = /* glsl */`
uniform float uTime, uPeriod, uRise, uRadius, uGravity, uSize, uTrail, uLaunch, uFlash, uCrackle, uRocket;
uniform vec3 uCenter, uArea; uniform vec3 uPal[5];
attribute vec4 aSpark; attribute vec4 aBurst;
varying vec2 vUv; varying vec3 vCol; varying float vI; varying float vFlash; varying float vHead;
${GLSL_HASH}${GLSL_FOG_PARS_VERT}
// where a spark is te seconds after its shell burst: drag-limited expansion plus gravity
vec3 fwPos(vec3 c, vec3 dir, float sp, float drag, float grav, float te){ return c + dir*sp*(1.-exp(-drag*te)) - vec3(0., grav*te*te*.5, 0.); }
void main(){
  vUv = uv; vFlash = 0.;
  float b = aBurst.x, cyc = uTime/uPeriod + aBurst.y, k = floor(cyc), tau = fract(cyc)*uPeriod;
  vec3 h = hash33(vec3(b*7.13 + 1., k*3.71 + 2., 1.7)), h2 = hash33(vec3(k*1.37 + 5., b*5.11 + 3., 9.2));
  vec3 centre = uCenter + (h-.5)*uArea;
  float type = floor(h2.x*3.999);                             // 0 peony, 1 ring, 2 willow, 3 chrysanthemum
  float ring = step(.5, type)*step(type, 1.5), willow = step(1.5, type)*step(type, 2.5), chrys = step(2.5, type);
  vec3 c1 = uPal[int(floor(h2.y*4.999))], c2 = uPal[int(floor(h.y*4.999))];
  vec3 posH, posT; float I, size = uSize;
  if(tau < uRise){
    // the rocket: a short streak climbing to the burst point
    float f = tau/uRise, fT = max(f - .1, 0.);
    vec3 launch = centre - vec3((h2.z-.5)*uLaunch*.25, uLaunch, (h.z-.5)*uLaunch*.2);
    vec3 jit = aSpark.xyz*aBurst.w*.4;
    posH = mix(launch, centre, 1.-(1.-f)*(1.-f)) + jit; posT = mix(launch, centre, 1.-(1.-fT)*(1.-fT)) + jit*2.5;
    I = step(aBurst.z, .06)*(.3 + .5*f)*smoothstep(0., .1, f)*step(0., aSpark.w)*uRocket;   // ~6% of the sparks share the rocket's light
    vCol = mix(vec3(1.,.75,.4), c1, .25); size *= .8;
  } else {
    float te = tau - uRise, life = uPeriod - uRise - .25, s = te/life;
    float drag = mix(1.3, 2.2, h2.z)*(1. - .35*willow), grav = uGravity*(1. + 1.3*willow);
    vec3 dir = aSpark.xyz;
    if(ring > .5){ vec3 nrm = normalize(h*2.-1.); dir = normalize(dir - nrm*dot(dir,nrm)*.94); }
    float inner = step(.72, aBurst.z)*(1.-ring);              // a smaller shell in the second colour
    float sp = uRadius*aSpark.w*mix(.6, 1.4, h.x)*(1. - .45*inner);
    float trail = uTrail*(1. + 1.5*willow + .8*chrys)*(.7 + .6*aBurst.w);
    posH = fwPos(centre, dir, sp, drag, grav, te); posT = fwPos(centre, dir, sp, drag, grav, max(te - trail, 0.));
    // glitter: late on, half the sparks flicker; crackle: a spark ends in a short white pop
    float tw = mix(1., step(.45, hash12(vec2(floor(uTime*14.), aBurst.w*77. + b))), smoothstep(.45, .85, s)*step(.5, aBurst.z));
    float pops = step(aBurst.z, .5)*uCrackle*(1.-willow), tc = life*(.5 + .4*aBurst.w), x = (te - tc)/.07;
    float pop = exp(-x*x)*pops;
    // sparks start packed into one point: they brighten as the shell opens, so the burst never stacks into a white blob
    float open = 1.-exp(-drag*te);
    I = pow(max(1.-s, 0.), mix(1.5, .8, willow))*min(open*open*2.5, 1.)*(1. + .3*exp(-te*2.))*tw*step(s, 1.);
    I = I*mix(1., exp(-max(te - tc, 0.)*7.), pops) + pop*.8;
    vec3 cc = mix(mix(c1, c2, inner), vec3(1.,.7,.28), max(willow, chrys*.6));
    vCol = mix(cc, vec3(1.), clamp(exp(-te*5.)*.8 + pop, 0., 1.));
    size *= (.6 + .7*aBurst.w)*(1. + pop);
    if(aSpark.w < 0.){ posH = centre; posT = centre; I = exp(-te*5.)*uFlash; vCol = mix(c1, vec3(1.), .5); size = uRadius*(.1 + .25*(1.-exp(-te*6.))); vFlash = 1.; }
  }
  vec4 mvH = viewMatrix*vec4(posH,1.), mvT = viewMatrix*vec4(posT,1.);
  vec4 mvPosition = mix(mvT, mvH, uv.y);
  float k2 = max(size, .0026*length(mvH.xyz));
  vec3 dv = mvH.xyz - mvT.xyz; float len = length(dv);
  vec3 ax = len > 1e-4 ? dv/len : vec3(0., 1., 0.);
  vec3 side = normalize(cross(ax, normalize(mvH.xyz)));
  // the quad spans the path the spark has just flown (head at uv.y = 1), padded by its radius so a spent spark is a dot
  if(vFlash > .5) mvPosition.xyz = mvH.xyz + vec3(position.xy*size*2., 0.);
  else mvPosition.xyz += ax*(uv.y*2.-1.)*k2 + side*position.x*k2*2.;
  vHead = k2/(len + 2.*k2);
  vI = I;
  gl_Position = projectionMatrix*mvPosition;
  if(I < .004) gl_Position = vec4(2.,2.,2.,1.);
  ${GLSL_FOG_VERT}
}`;
const FW_FRAG = /* glsl */`precision highp float;
uniform float uIntensity, uFogAmount; varying vec2 vUv; varying vec3 vCol; varying float vI; varying float vFlash; varying float vHead;
${GLSL_FOG_PARS_FRAG}
void main(){
  float x = vUv.x*2.-1., y = vUv.y, a;
  if(vFlash > .5){ vec2 q = vUv*2.-1.; float w = max(1.-length(q), 0.); a = w*w*w; }
  else {
    float hy = (y - (1.-vHead))/vHead;                        // -1..1 across the head dot
    float hr = hy*hy + x*x, head = exp(-hr*2.6)*max(1.-hr, 0.);   // reaches zero at the quad's edge
    float ty = clamp(y/(1.-vHead), 0., 1.), tw = .3 + .7*ty;  // the tail thins and dims toward its old end
    float tail = ty*ty*exp(-x*x/(tw*tw)*2.5)*(1.-x*x)*step(y, 1.-vHead*.5);
    a = head*1.4 + tail*.8;
  }
  gl_FragColor = vec4(vCol*a*vI*uIntensity*(1.-fxFog()*uFogAmount), 0.);
}`;

// Endless firework display on the GPU: rockets rise, burst (peony / ring / willow / chrysanthemum) with trails that follow
// each spark's real path, glitter, crackle and fade, then repeat. One draw call, bursts * sparks * 2 triangles.
export function makeFireworks(opts = {}) {
  const rng = getRng(opts);
  const B = opts.bursts ?? 6, S = opts.sparks ?? 320, n = B * S, g = quadGeometry(n), sp = new Float32Array(n * 4), bu = new Float32Array(n * 4);
  for (let b = 0; b < B; b++) {
    const ph = (b + rng() * 0.7) / B;
    for (let i = 0; i < S; i++) {
      const k = b * S + i, y = rng() * 2 - 1, a = rng() * 6.283, r = Math.sqrt(1 - y * y);
      sp.set([Math.cos(a) * r, y, Math.sin(a) * r, i === 0 ? -1 : 0.75 + 0.25 * Math.pow(rng(), 0.3)], k * 4);
      bu.set([b, ph, rng(), rng()], k * 4);
    }
  }
  iattr(g, 'aSpark', sp, 4); iattr(g, 'aBurst', bu, 4);
  const pal = (opts.colors || ['#ff4a5a', '#ffd24a', '#4ad0ff', '#b46bff', '#5aff9a']).map((c) => toColor(c)); while (pal.length < 5) pal.push(pal[pal.length % Math.max(1, pal.length - 1)].clone());
  const uniforms = {
    uTime: timeUniform(opts), uPeriod: { value: opts.period ?? 4.2 }, uRise: { value: opts.rise ?? 1.1 }, uRadius: { value: opts.radius ?? 42 }, uGravity: { value: opts.gravity ?? 4 },
    uSize: { value: opts.size ?? 0.32 }, uTrail: { value: opts.trail ?? 0.4 }, uLaunch: { value: opts.launchHeight ?? 70 },
    uFlash: { value: opts.flash ?? 0.2 }, uCrackle: { value: opts.crackle ?? 1 }, uRocket: { value: (opts.rocket ?? 1) * 5 / Math.max(1, 0.06 * S) },
    uCenter: { value: toVec3(opts.position, [0, 90, 0]) }, uArea: { value: toVec3(opts.area, [160, 40, 60]) }, uPal: { value: pal.slice(0, 5) },
    uIntensity: { value: opts.intensity ?? 3 }, uFogAmount: { value: opts.fogAmount ?? 0.5 },
  };
  const material = shader({ uniforms, vertexShader: FW_VERT, fragmentShader: FW_FRAG, fog: opts.fog !== false, transparent: true, depthWrite: false, side: THREE.DoubleSide, ...PREMULT });
  const object = fxMesh(g, material, opts.renderOrder ?? 4);
  const L = uniforms.uLaunch.value, bounds = setBounds(object, uniforms.uCenter.value, uniforms.uArea.value.length() * 0.5 + uniforms.uRadius.value * 1.5 + L * 0.75 + 40);
  return { object, uniforms, material, count: n, triangles: n * 2,
    update(dt, time) { uniforms.uTime.value = time; bounds.center.copy(uniforms.uCenter.value); bounds.center.y -= L * 0.35; } };
}

// ---------- floating lanterns ----------
const LANTERN_MOTION = /* glsl */`
uniform float uTime, uRise, uSway, uFloor, uClear; uniform vec3 uArea, uCenter, uWind;
#ifdef LANTERN_GROUND
uniform sampler2D uGround;
#endif
// fade: 0 at the faces of the box and just above the ground, 1 inside. Lanterns shrink with it instead of darkening.
vec3 lanternPos(vec3 home, vec4 rnd, out float fade){
  vec3 p = home*uArea + uWind*uTime;
  p.y += uTime*uRise*(.6+.8*rnd.z);
  p.x += sin(uTime*.3*(.5+rnd.y) + rnd.y*40.)*uSway; p.z += cos(uTime*.23*(.5+rnd.x) + rnd.x*31.)*uSway;
  p = mod(p, uArea) - .5*uArea;
  vec3 e = abs(p)/(.5*uArea);
  fade = (1.-smoothstep(.78, 1., e.y))*(1.-smoothstep(.85, 1., max(e.x, e.z)));
  vec3 w = uCenter + p;
  float ground = uFloor;
#ifdef LANTERN_GROUND
  ground = max(ground, texture2D(uGround, p.xz/uArea.xz + .5).r);
#endif
  fade *= smoothstep(ground + uClear*.15, ground + uClear, w.y);
  return w; }
`;
const LANTERN_VERT = /* glsl */`
uniform float uScale; attribute vec3 aHome; attribute vec4 aRand;
varying vec3 vN; varying vec3 vP; varying vec3 vView; varying vec4 vRand;
${LANTERN_MOTION}${GLSL_FOG_PARS_VERT}
void main(){
  vRand = aRand; float fade; vec3 c = lanternPos(aHome, aRand, fade);
  float tx = sin(uTime*.5 + aRand.x*20.)*.12, tz = cos(uTime*.43 + aRand.y*20.)*.12, yaw = aRand.w*6.2831853 + uTime*.1*(aRand.z-.5);
  float cy = cos(yaw), sy = sin(yaw);
  mat3 R = mat3(cy, 0., -sy, 0., 1., 0., sy, 0., cy)*mat3(1., tx, 0., -tx, 1., tz, 0., -tz, 1.);
  float s = (aRand.x*.6 + .7)*smoothstep(0., .7, fade);
  vP = position; vN = R*normal;
  vec3 w = c + R*(position*s*uScale);
  vec4 mvPosition = viewMatrix*vec4(w,1.); vView = -mvPosition.xyz;
  gl_Position = projectionMatrix*mvPosition;
  if(fade < .004) gl_Position = vec4(2.,2.,2.,1.);
  ${GLSL_FOG_VERT}
}`;
const LANTERN_FRAG = /* glsl */`precision highp float;
uniform vec3 uColorA, uColorB; uniform float uIntensity, uTime, uFogAmount;
varying vec3 vN; varying vec3 vP; varying vec3 vView; varying vec4 vRand;
${GLSL_FOG_PARS_FRAG}
void main(){
  float h = clamp(vP.y, 0., 1.);
  vec3 n = normalize(vN); vec3 nv = normalize((viewMatrix*vec4(n,0.)).xyz); float facing = abs(dot(nv, normalize(vView)));
  float flick = .85 + .15*sin(uTime*(6.+vRand.y*5.) + vRand.x*50.)*sin(uTime*2.3 + vRand.z*20.);
  float flame = exp(-h*3.)*1.2 + .45;
  float ribs = .82 + .18*smoothstep(.0, .25, abs(sin(atan(vP.z, vP.x)*4.)));
  float bandT = smoothstep(.9, .96, h), bandB = 1.-smoothstep(.03, .08, h);
  vec3 col = mix(uColorA, uColorB, vRand.w)*flame*ribs*(.55 + .45*facing)*flick;
  col = mix(col, col*.25, max(bandT, bandB))*uIntensity;
  gl_FragColor = vec4(mix(col, fxApplyFog(col), uFogAmount), 1.);   // a lit lantern sinks into the haze, it does not go black
}`;
const LGLOW_VERT = /* glsl */`
uniform float uGlowSize, uScale; attribute vec3 aHome; attribute vec4 aRand;
varying vec2 vUv; varying float vFade; varying vec4 vRand;
${LANTERN_MOTION}${GLSL_FOG_PARS_VERT}
void main(){
  vUv = uv; vRand = aRand; float fade; vec3 c = lanternPos(aHome, aRand, fade); vFade = fade;
  float s = (aRand.x*.6 + .7)*uScale;
  vec4 mvPosition = viewMatrix*vec4(c + vec3(0., .35*s*smoothstep(0., .7, fade), 0.), 1.);
  float dist = length(mvPosition.xyz);
  mvPosition.xy += position.xy*max(uGlowSize*s, .006*dist);
  vFade *= mix(.3, 1., smoothstep(4.*s, 30.*s, dist));
  gl_Position = projectionMatrix*mvPosition;
  if(fade < .004) gl_Position = vec4(2.,2.,2.,1.);
  ${GLSL_FOG_VERT}
}`;
const LGLOW_FRAG = /* glsl */`precision highp float;
uniform vec3 uColorA, uColorB; uniform float uGlow, uTime, uFogAmount; varying vec2 vUv; varying float vFade; varying vec4 vRand;
${GLSL_FOG_PARS_FRAG}
void main(){ vec2 q = vUv*2.-1.; float r = length(q), w = max(1.-r, 0.);
  float flick = .85 + .15*sin(uTime*(6.+vRand.y*5.) + vRand.x*50.)*sin(uTime*2.3 + vRand.z*20.);
  float a = (exp(-r*5.)*.7 + w*w*.25)*w;
  gl_FragColor = vec4(mix(uColorA, uColorB, vRand.w)*a*uGlow*flick*vFade*(1.-fxFog()*uFogAmount), 0.); }`;

// Sky lanterns that rise, sway and wrap inside a box. 2 draw calls, 120 triangles per lantern + glow quad.
// floor (a height) and / or heightAt(x, z) keep them above the ground: a lantern swells into view just above it,
// as if released there, and shrinks away at the top and sides of the box.
export function makeLanterns(opts = {}) {
  const rng = getRng(opts);
  const n = opts.count ?? 140;
  const lathe = new THREE.LatheGeometry([[0.2, 0], [0.34, 0.06], [0.47, 0.42], [0.5, 0.72], [0.43, 0.94], [0.3, 1.0], [0.001, 1.0]].map((p) => new THREE.Vector2(p[0], p[1])), 10);
  const g = new THREE.InstancedBufferGeometry();
  g.setIndex(lathe.index); g.setAttribute('position', lathe.attributes.position); g.setAttribute('normal', lathe.attributes.normal); g.instanceCount = n;
  const home = new Float32Array(n * 3), rnd = new Float32Array(n * 4);
  for (let i = 0; i < n * 3; i++) home[i] = rng(); for (let i = 0; i < n * 4; i++) rnd[i] = rng();
  const aHome = new THREE.InstancedBufferAttribute(home, 3), aRand = new THREE.InstancedBufferAttribute(rnd, 4);
  g.setAttribute('aHome', aHome); g.setAttribute('aRand', aRand);
  const colors = opts.colors || ['#ff8a2a', '#ffc45a'];
  const uTime = timeUniform(opts), area = toVec3(opts.area, [220, 90, 220]), center = toVec3(opts.center, [0, 50, 0]), size = opts.size ?? 1.6;
  const shared = {
    uTime, uRise: { value: opts.rise ?? 1.1 }, uSway: { value: opts.sway ?? 1.6 }, uArea: { value: area }, uCenter: { value: center },
    uWind: { value: toVec3(opts.wind, [0.5, 0, 0.2]) }, uScale: { value: size }, uColorA: { value: toColor(colors[0]) }, uColorB: { value: toColor(colors[1] ?? colors[0]) },
    uFogAmount: { value: opts.fogAmount ?? 0.7 }, uFloor: { value: opts.floor ?? -1e6 }, uClear: { value: opts.clearance ?? size * 4 },
  };
  const defines = {};
  if (opts.heightAt) {                                        // terrain heights under the box, baked into a small texture
    const N = opts.groundResolution ?? 32, data = new Uint16Array(N * N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) data[j * N + i] = THREE.DataUtils.toHalfFloat(opts.heightAt(center.x + ((i + 0.5) / N - 0.5) * area.x, center.z + ((j + 0.5) / N - 0.5) * area.z));
    const tex = new THREE.DataTexture(data, N, N, THREE.RedFormat, THREE.HalfFloatType);
    tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
    shared.uGround = { value: tex }; defines.LANTERN_GROUND = '';
  }
  const uniforms = { ...shared, uIntensity: { value: opts.intensity ?? 2 } };
  const material = shader({ uniforms, vertexShader: LANTERN_VERT, fragmentShader: LANTERN_FRAG, fog: opts.fog !== false, side: THREE.DoubleSide, defines });
  const bodies = fxMesh(g, material, 0);
  const object = new THREE.Group(); object.add(bodies);
  const gg = quadGeometry(n); gg.setAttribute('aHome', aHome); gg.setAttribute('aRand', aRand);
  const glowUniforms = { ...shared, uGlowSize: { value: opts.glowSize ?? 5 }, uGlow: { value: opts.glow ?? 1.3 } };
  const glowMat = shader({ uniforms: glowUniforms, vertexShader: LGLOW_VERT, fragmentShader: LGLOW_FRAG, fog: opts.fog !== false, transparent: true, depthWrite: false, defines, ...PREMULT });
  const glows = fxMesh(gg, glowMat, 4);
  object.add(glows);
  const reach = area.length() * 0.5 + shared.uSway.value + glowUniforms.uGlowSize.value * size * 1.3;
  const spheres = [setBounds(bodies, center, reach), setBounds(glows, center, reach)];
  return { object, uniforms, glowUniforms, material, count: n, triangles: n * (lathe.index.count / 3 + 2),
    update(dt, time) { uTime.value = time; for (const s of spheres) s.center.copy(center); } };
}
