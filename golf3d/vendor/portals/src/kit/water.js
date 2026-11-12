// Kit: water in all forms. Ocean, lake, river, waterfall, underwater kit, ice.
// Pure factories: every make*() takes an options object and returns { object, update(dt,time,camera), uniforms, ... }.
// All materials write linear HDR, honour scene fog and animate on the GPU. See docs/kit/water.md.
import * as THREE from 'three';
import { makeRng, hashSeed } from './core.js';

const TAU = Math.PI * 2, GRAV = 9.81;
const kitRng = (opts, label) => (opts.rng ?? makeRng(hashSeed('kit-water'))).fork(label);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const toV3 = (v, d) => (!v ? new THREE.Vector3(d[0], d[1], d[2]) : v.isVector3 ? v.clone() : new THREE.Vector3(v[0], v[1], v[2]));
const toCol = (c, d) => (c == null ? new THREE.Color(d) : c.isColor ? c.clone() : new THREE.Color(c));
const setCol = (out, c) => (c.isColor ? out.copy(c) : out.set(c));
const setV3 = (out, v) => (v.isVector3 ? out.copy(v) : out.set(v[0], v[1], v[2]));

// ---------------------------------------------------------------- lighting
// The sky model is the one kit/sky.js draws: zenith -> mid -> horizon gradient plus a warm wash toward the sun.
// sunColor follows the DirectionalLight convention (colour x intensity).
const LIGHTS = {
  noon:     { sunDir: [0.32, 0.78, -0.54], sunColor: '#fff3df', sunIntensity: 3.0, zenith: '#1a4fae', mid: '#4d86cd', horizon: '#a5c6e4', scatterColor: '#fff3dc', scatter: 0.3, scatterPow: 5, horizonPow: 4, midPow: 1.5 },
  sunset:   { sunDir: [-0.22, 0.105, -0.97], sunColor: '#ffab66', sunIntensity: 2.8, zenith: '#14235a', mid: '#57488a', horizon: '#d98a66', scatterColor: '#ff8a2a', scatter: 0.95, scatterPow: 3.5, horizonPow: 4.2, midPow: 1.6, scatterHigh: 0.07, scatterFall: 4 },
  sunrise:  { sunDir: [0.42, 0.13, -0.9], sunColor: '#ffc09a', sunIntensity: 2.6, zenith: '#25468c', mid: '#7b85be', horizon: '#f0b6a6', scatterColor: '#ffc68c', scatter: 0.65, scatterPow: 5, horizonPow: 3.4, midPow: 1.5 },
  night:    { sunDir: [-0.28, 0.42, -0.86], sunColor: '#a9c4ff', sunIntensity: 0.9, zenith: '#040a1c', mid: '#0a1836', horizon: '#16305c', scatterColor: '#000000', scatter: 0, scatterPow: 5, horizonPow: 3.4, midPow: 1.5 },
  overcast: { sunDir: [0.3, 0.67, -0.68], sunColor: '#e4e8f0', sunIntensity: 1.1, zenith: '#8b959e', mid: '#99a2a9', horizon: '#b3babf', scatterColor: '#d6d2c6', scatter: 0.25, scatterPow: 3, horizonPow: 2.5, midPow: 1.5, glint: 0.12 },
  storm:    { sunDir: [0.14, 0.42, -0.9], sunColor: '#b4c0cc', sunIntensity: 1.3, zenith: '#36414a', mid: '#525e66', horizon: '#84929a', scatterColor: '#c4b272', scatter: 0.5, scatterPow: 8, horizonPow: 3, midPow: 1.5, scatterHigh: 0.02, scatterFall: 6, glint: 0.22 },
};
export const WATER_LIGHTS = Object.keys(LIGHTS);
const isSky = (s) => !!(s && s.zenithColor && s.horizonColor && (s.lightDirection || s.sunDirection));
const LIGHT_KEYS = ['sunDir', 'scatDir', 'sunColor', 'zenith', 'mid', 'horizon', 'scatterColor', 'ambient', 'fogColor', 'cloudLit', 'cloudShade', 'skyP', 'skyQ', 'cloud'];

function fillLight(L, light, over = {}) {
  let o = typeof light === 'string' ? { preset: light } : isSky(light) ? { sky: light } : light || {};
  const f = o.isWaterLight ? {} : { ...o };
  for (const k in over) if (over[k] != null) f[k] = over[k];
  let derive = true;
  if (o.isWaterLight) { if (o !== L) for (const k of LIGHT_KEYS) L[k].copy(o[k]); derive = false; }
  else if (isSky(f.sky)) {
    // pair with kit/sky.js: glints follow the visible key body, colours the directional light, the gradient the dome
    const s = f.sky, so = s.options || {}, U = s.uniforms || {};
    L.sunDir.copy(s.keyDirection || s.lightDirection || s.sunDirection); L.scatDir.copy(s.sunDirection || L.sunDir);
    L.sunColor.copy(s.lightColor || s.sunColor).multiplyScalar(s.lightIntensity ?? 1);
    L.zenith.copy(s.zenithColor); L.horizon.copy(s.horizonColor);
    if (U.uMid) L.mid.copy(U.uMid.value); else L.mid.copy(L.zenith).lerp(L.horizon, 0.38);
    if (U.uScatterColor) L.scatterColor.copy(U.uScatterColor.value); else L.scatterColor.set(so.scatterColor ?? '#fff3dc');
    const hidden = (so.key === 'sun' || so.key == null) && (so.sunIntensity ?? 1) <= 0;
    L.skyP.set(so.midPow ?? 1.5, so.horizonPow ?? 4, so.scatter ?? 0.3, so.scatterPow ?? 5);
    L.skyQ.set(so.scatterHigh ?? 0.14, so.scatterFall ?? 3, hidden ? 0.15 : 1, 0);
    L.fogColor.copy(s.fogColor || s.horizonColor);
    const c = so.clouds && !so.clouds.stretch ? so.clouds : null;
    if (c) { L.cloud.set(c.coverage ?? 0.5, Math.max(0.08, c.softness ?? 0.22), (c.scale ?? 1) * 1.1, c.opacity ?? 0.96); L.cloudLit.copy(s.cloudLit || L.horizon); L.cloudShade.copy(s.cloudShade || L.mid); }
    else L.cloud.set(0.5, 0.2, 1, 0);
  } else {
    const P = LIGHTS[f.preset] || LIGHTS.sunset;
    L.sunDir.fromArray(P.sunDir); L.sunColor.set(P.sunColor).multiplyScalar(P.sunIntensity);
    L.zenith.set(P.zenith); L.mid.set(P.mid); L.horizon.set(P.horizon); L.scatterColor.set(P.scatterColor);
    L.skyP.set(P.midPow, P.horizonPow, P.scatter, P.scatterPow); L.skyQ.set(P.scatterHigh ?? 0.14, P.scatterFall ?? 3, P.glint ?? 1, 0);
    L.scatDir.copy(L.sunDir); L.fogColor.set(0, 0, 0); L.cloud.set(0.5, 0.2, 1, 0); L.cloudLit.set('#f6f2ea'); L.cloudShade.set('#7d8eac');
    f._fog = true;
  }
  // explicit overrides
  if (f.sunDir) { setV3(L.sunDir, f.sunDir); if (!f.scatDir && derive) L.scatDir.copy(L.sunDir); }
  if (f.scatDir) setV3(L.scatDir, f.scatDir);
  if (f.sunColor != null) { setCol(L.sunColor, f.sunColor); L.sunColor.multiplyScalar(f.sunIntensity ?? 1); }
  else if (f.sunIntensity != null && !isSky(f.sky) && derive) L.sunColor.set((LIGHTS[f.preset] || LIGHTS.sunset).sunColor).multiplyScalar(f.sunIntensity);
  const midGiven = f.mid != null;
  if (f.zenith != null) setCol(L.zenith, f.zenith);
  if (f.horizon != null) setCol(L.horizon, f.horizon);
  if (midGiven) setCol(L.mid, f.mid); else if ((f.zenith != null || f.horizon != null) && derive) L.mid.copy(L.zenith).lerp(L.horizon, 0.38);
  if (f.scatterColor != null) setCol(L.scatterColor, f.scatterColor);
  // (a factory's own `scatter` option may be its crest COLOUR, makeOcean's for one: only a number is a glow strength here;
  // anything else is a plain zero, which is what a colour string in this slot always drew as)
  if (f.scatter != null) L.skyP.z = typeof f.scatter === 'number' && isFinite(f.scatter) ? f.scatter : 0;
  if (f.glint != null) L.skyQ.z = f.glint;
  if (f.clouds === false) L.cloud.w = 0;
  else if (f.clouds && typeof f.clouds === 'object') {
    const c = f.clouds; L.cloud.set(c.coverage ?? 0.5, c.softness ?? 0.22, c.scale ?? 1, c.opacity ?? 0.9);
    if (c.lit != null) setCol(L.cloudLit, c.lit); if (c.shade != null) setCol(L.cloudShade, c.shade);
  }
  L.sunDir.normalize(); if (L.sunDir.y < 0.02) { L.sunDir.y = 0.02; L.sunDir.normalize(); }
  L.scatDir.normalize();
  if (derive || f.zenith != null || f.horizon != null || midGiven || f.clouds != null) {
    // sky radiance averaged over the dome: what water bodies and foam are lit by
    const A = L.ambient, cov = sstep(0.25, 0.95, L.cloud.x) * L.cloud.w;
    A.setRGB(L.zenith.r * 0.3 + L.mid.r * 0.4 + L.horizon.r * 0.3, L.zenith.g * 0.3 + L.mid.g * 0.4 + L.horizon.g * 0.3, L.zenith.b * 0.3 + L.mid.b * 0.4 + L.horizon.b * 0.3);
    A.r += (L.cloudLit.r * 0.45 + L.cloudShade.r * 0.55 - A.r) * cov * 0.8; A.g += (L.cloudLit.g * 0.45 + L.cloudShade.g * 0.55 - A.g) * cov * 0.8; A.b += (L.cloudLit.b * 0.45 + L.cloudShade.b * 0.55 - A.b) * cov * 0.8;
  }
  if (f._fog) L.fogColor.copy(L.horizon).lerp(L.mid, 0.12);
  if (f.ambient != null) setCol(L.ambient, f.ambient);
  if (f.fogColor != null) setCol(L.fogColor, f.fogColor);
  return L;
}

// Resolve a light. `light` is a preset name, a kit/sky.js sky object, another waterLight, or
// { preset | sky, sunDir, sunColor, sunIntensity, zenith, mid, horizon, scatterColor, scatter, glint, ambient, fogColor, clouds }.
// The result holds live Vector3 / Color instances: factories given the same waterLight share them, so
// light.set('night') (or mutating a field) relights every water object built from it.
export function waterLight(light = 'sunset', over = {}) {
  const L = { isWaterLight: true, sunDir: new THREE.Vector3(), scatDir: new THREE.Vector3(), sunColor: new THREE.Color(), zenith: new THREE.Color(), mid: new THREE.Color(),
    horizon: new THREE.Color(), scatterColor: new THREE.Color(), ambient: new THREE.Color(), fogColor: new THREE.Color(), cloudLit: new THREE.Color(), cloudShade: new THREE.Color(),
    skyP: new THREE.Vector4(), skyQ: new THREE.Vector4(), cloud: new THREE.Vector4() };
  L.set = (l, o) => fillLight(L, l, o);
  return fillLight(L, light, over);
}
const OVER_KEYS = ['sunDir', 'sunColor', 'sunIntensity', 'zenith', 'mid', 'horizon', 'scatterColor', 'scatter', 'glint', 'ambient', 'fogColor', 'clouds'];
// Light for a factory: the caller's waterLight by reference when nothing overrides it, otherwise a private one.
function factoryLight(opts) {
  const over = {}; let any = false;
  for (const k of OVER_KEYS) if (opts[k] != null) { over[k] = opts[k]; any = true; }
  if (opts.skyZenith != null) { over.zenith = opts.skyZenith; any = true; }
  if (opts.skyHorizon != null) { over.horizon = opts.skyHorizon; any = true; }
  const src = opts.light ?? opts.sky ?? 'sunset';
  return src && src.isWaterLight && !any ? src : waterLight(src, over);
}
const lightUniforms = (L) => ({ uSunDir: { value: L.sunDir }, uScatDir: { value: L.scatDir }, uSunColor: { value: L.sunColor }, uZenith: { value: L.zenith }, uMid: { value: L.mid },
  uHorizon: { value: L.horizon }, uScatterCol: { value: L.scatterColor }, uAmbient: { value: L.ambient }, uCloudLit: { value: L.cloudLit }, uCloudShade: { value: L.cloudShade },
  uSkyP: { value: L.skyP }, uSkyQ: { value: L.skyQ }, uCloud: { value: L.cloud }, uTime: { value: 0 } });
const fogUniforms = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// ---------------------------------------------------------------- shared GLSL
const GLSL_COMMON = /* glsl */`
uniform vec3 uSunDir, uScatDir, uSunColor, uZenith, uMid, uHorizon, uScatterCol, uAmbient, uCloudLit, uCloudShade;
uniform vec4 uSkyP, uSkyQ, uCloud;
uniform float uTime;
const float TAU = 6.2831853;
float h21(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 h22(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
// gradient noise with analytic derivatives, remapped to about 0..1: (value, d/dx, d/dy). No lattice-aligned creases.
vec3 noised(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*f*(f*(f*6.-15.)+10.), du=30.*f*f*(f*(f-2.)+1.);
  vec2 ga=h22(i)*2.-1., gb=h22(i+vec2(1.,0.))*2.-1., gc=h22(i+vec2(0.,1.))*2.-1., gd=h22(i+vec2(1.,1.))*2.-1.;
  float va=dot(ga,f), vb=dot(gb,f-vec2(1.,0.)), vc=dot(gc,f-vec2(0.,1.)), vd=dot(gd,f-vec2(1.,1.)), k=va-vb-vc+vd;
  return vec3(.5+.72*(va+u.x*(vb-va)+u.y*(vc-va)+u.x*u.y*k), .72*(ga+u.x*(gb-ga)+u.y*(gc-ga)+u.x*u.y*(ga-gb-gc+gd)+du*(u.yx*k+vec2(vb,vc)-va))); }
// cheap value noise for masks and modulators (domains are rotated per octave so the lattice never lines up)
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1.,0.)),f.x), mix(h21(i+vec2(0.,1.)),h21(i+vec2(1.,1.)),f.x), f.y); }
const mat2 KROT = mat2(1.616,1.178,-1.178,1.616);     // rotate 36 degrees, scale 2
float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=KROT*p+3.1; a*=.5; } return s*1.0667; }
float fbm3(vec2 p){ float a=.5, s=0.; for(int i=0;i<3;i++){ s+=a*vnoise(p); p=KROT*p+3.1; a*=.5; } return s*1.143; }
float fbm2(vec2 p){ return vnoise(p)*.667+vnoise(KROT*p+3.1)*.333; }
mat2 rot2(float a){ float c=cos(a), s=sin(a); return mat2(c,s,-s,c); }
// cellular noise: (distance to the nearest point, gap to the second nearest). kitCell searches 3x3 cells,
// kitCell4 only the 2x2 around the nearest corner (points keep to the middle of their cells): less than half the cost.
vec2 kitCell(vec2 p){ vec2 i=floor(p), f=fract(p); float d1=8., d2=8.;
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 r=g+h22(i+g)-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d; }
  d1=sqrt(d1); return vec2(d1, sqrt(d2)-d1); }
vec2 kitCell4(vec2 p){ p-=.5; vec2 i=floor(p), f=fract(p); float d1=8., d2=8.;
  for(int y=0;y<=1;y++) for(int x=0;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 r=g+(h22(i+g)-.5)*.72-f; float d=dot(r,r);
    if(d<d1){ d2=d1; d1=d; } else if(d<d2) d2=d; }
  d1=sqrt(d1); return vec2(d1, sqrt(d2)-d1); }
// foam lace at one scale. m = foam amount 0..1: round holes open around the cell points as it thins, leaving
// walls that are thick at the junctions and break up into flecks; fr = pixel footprint in cell units.
float kitLace(vec2 p, float m, float fr){ float mean = m*m*(3.-2.*m);
  if(fr>1.6) return mean;
  p += .13*sin(p.yx*4.7+vec2(1.3,4.1))+.06*sin(p.yx*11.3+2.);
  vec2 c = kitCell(p); float r = .74*(1.-m), aa = .04+.09*(1.-m)+fr*.6;      // thin foam has soft, dissolving edges
  float v = c.x+.07*sin(p.x*17.+p.y*13.)*sin(p.y*19.-p.x*7.);
  return mix(smoothstep(r-aa, r+aa, v), mean, smoothstep(.7,1.6,fr)); }
// clear-sky gradient, identical to kit/sky.js atmosphere()
vec3 kitAtmo(vec3 d){ float inv=1.-clamp(d.y,0.,1.); vec3 c=mix(uZenith,uMid,pow(inv,uSkyP.x)); c=mix(c,uHorizon,pow(inv,uSkyP.y));
  float sc=pow(.5+.5*dot(d,uScatDir),uSkyP.w)*mix(uSkyQ.x,1.,pow(inv,uSkyQ.y)); return mix(c,uScatterCol,clamp(sc*uSkyP.z,0.,1.)); }
// sky radiance for reflections: gradient, soft sun halo and (optional) a cloud layer
vec3 kitSky(vec3 d){ vec3 c=kitAtmo(d); float sd=max(dot(d,uSunDir),0.);
  c+=uSunColor*uSkyQ.z*(pow(sd,6.)*.03+pow(sd,48.)*.09)*(1.-.5*max(d.y,0.));
  if(uCloud.w>.001){ vec2 p=d.xz/(max(d.y,0.)+.2)*uCloud.z+uTime*vec2(.004,.0015); float n=fbm3(p*1.4)*1.3-.15;
    float lo=1.-uCloud.x; float a=smoothstep(lo-uCloud.y-.08,lo+uCloud.y+.08,n)*uCloud.w*.8*smoothstep(.02,.3,d.y);
    c=mix(c, mix(uCloudLit,uCloudShade,smoothstep(lo,lo+.45,n)*.8), a); }
  return c; }
vec3 kitAmbient(){ return uAmbient; }
float pow5(float x){ x=clamp(x,0.,1.); float x2=x*x; return x2*x2*x; }
float ggxD(float ndh, float a){ float a2=a*a; float d=ndh*ndh*(a2-1.)+1.; return a2/(3.14159*d*d); }
// sun highlight on a water facet: GGX lobe, Schlick fresnel, Kelemen visibility. Stretches into a sun path at grazing angles.
vec3 kitSunSpec(vec3 N, vec3 V, float alpha, float cap){
  vec3 H=normalize(V+uSunDir); float ndh=max(dot(N,H),0.), vdh=max(dot(V,H),0.), ndl=max(dot(N,uSunDir),0.);
  float F=.02+.98*pow5(1.-vdh);
  return uSunColor*uSkyQ.z*min(ggxD(ndh,max(alpha,.012))*F*.25/max(vdh*vdh,.08)*ndl, cap); }
// twinkling glitter cells
float kitSparkle(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 r=h22(i);
  float tw=.5+.5*sin(uTime*(2.+r.x*5.)+r.y*40.); float d=length(f-.5-(r-.5)*.7);
  return smoothstep(.34,.04,d)*tw*tw*tw*tw*step(.45,fract(r.y*7.31+r.x)); }
float kitGlitter(vec2 xz, float cell){ float l=log2(max(cell,.02)), l0=floor(l), t=l-l0;
  return mix(kitSparkle(rot2(.6)*xz/exp2(l0)), kitSparkle(rot2(1.9)*xz/exp2(l0+1.)+17.3), t); }
// angular size of one pixel (radians), from the projection: independent of resolution, pixel ratio and fov
varying vec3 vPixK;
float kitPix(){ return max(fwidth(vPixK.x/vPixK.y)*vPixK.z, 1e-5); }
`;
const GLSL_PIX_VERT = /* glsl */`vPixK = vec3(gl_Position.y, gl_Position.w, 1./projectionMatrix[1][1]);`;
// fog helpers: opaque surfaces use the stock chunk; additive / premultiplied layers fade out with kitFog()
const GLSL_FOG_FRAG = /* glsl */`
#include <fog_pars_fragment>
float kitFog(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1.-exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      return smoothstep(fogNear,fogFar,vFogDepth);
    #endif
  #else
    return 0.;
  #endif
}`;
// The water surface seen from below: Snell's window with the sky inside, a mirror of the deep outside.
// D = view ray (camera -> surface), N = surface normal pointing down at the viewer, dist in metres.
const GLSL_UNDERSIDE = /* glsl */`
uniform vec3 uUwWater, uUwDeep; uniform float uUwSunDisc;
vec3 kitUnderside(vec3 D, vec3 N, float dist, float net){
  vec3 T = refract(D,N,1.333); float inside = step(.0001,dot(T,T));
  vec3 Tr = refract(D,N,1.316), Tb = refract(D,N,1.35);
  vec3 win = vec3(step(.0001,dot(Tr,Tr)), inside, step(.0001,dot(Tb,Tb)));
  T = normalize(T+vec3(0.,1e-4,0.)); float ct = max(T.y,0.);
  float trans = 1.-pow(clamp(1.-ct,0.,1.),3.);
  float sd = max(dot(T,uSunDir),0.);
  vec3 sky = kitSky(T)+uSunColor*uSkyQ.z*(pow(sd,220.)*2.5+smoothstep(.9990,.9998,sd)*30.)*uUwSunDisc;
  vec3 wn = uUwWater/max(max(uUwWater.r,uUwWater.g),max(uUwWater.b,.001));
  vec3 R = reflect(D,N);
  // total internal reflection: the mirror shows the water volume, never darker than half of it
  vec3 mirror = mix(uUwWater*1.12, max(uUwDeep,uUwWater*.5), clamp(-R.y*1.4-.05,0.,1.))*(.82+.55*net);
  vec3 col = mix(mirror, sky*(.3+.7*wn), win*trans);
  col += uUwWater*(.35*pow(clamp((1.-abs(N.y))*12.,0.,1.),2.))*(1.-inside);            // glints sliding over the mirror
  return col; }
`;
const _lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
// Colour of the water volume under a light (fog, background, the mirror outside Snell's window). Returns its brightness.
function waterVolume(L, water, deep, minB, volume, deepCol) {
  const A = L.ambient, la = Math.max(1e-4, _lum(A)), k = la * 2.3 + _lum(L.sunColor) * L.skyQ.z * 0.3 * Math.max(0.25, L.sunDir.y);
  const kv = k / (1 + 0.55 * k) + minB, tr = (A.r / la) * 0.25 + 0.75, tg = (A.g / la) * 0.25 + 0.75, tb = (A.b / la) * 0.25 + 0.75;
  volume.setRGB(water.r * tr * kv, water.g * tg * kv, water.b * tb * kv); deepCol.setRGB(deep.r * tr * kv, deep.g * tg * kv, deep.b * tb * kv);
  return kv;
}

// ================================================================== OCEAN
const OCEAN_PRESETS = {
  calm:   { height: 0.16, wavelength: 24, steepness: 0.30, spread: 0.9, foam: 0.0, detail: 0.5, speed: 0.8, contrast: 0.15 },
  breeze: { height: 0.55, wavelength: 46, steepness: 0.55, spread: 0.7, foam: 0.12, detail: 0.85, speed: 1, contrast: 0.3 },
  swell:  { height: 1.7, wavelength: 110, steepness: 0.55, spread: 0.35, foam: 0.16, detail: 0.75, speed: 1, contrast: 0.55 },
  choppy: { height: 1.25, wavelength: 36, steepness: 0.9, spread: 0.85, foam: 0.55, detail: 1.15, speed: 1.1, contrast: 0.6 },
  storm:  { height: 4.4, wavelength: 95, steepness: 0.95, spread: 0.55, foam: 1.0, detail: 1.35, speed: 1.15, contrast: 1, deep: '#2a6a70', scatter: '#8fd4c0' },
};
export const OCEAN_PRESET_NAMES = Object.keys(OCEAN_PRESETS);
const NW = 8, NF = 18, NS = 8; // geometry waves, total shaded waves, shallow discs

// Wave set: uWA[i] = (dirX, dirZ, k, omega), uWB[i] = (amplitude, Q, phase, wavelength).
// 0..NW-1 are Gerstner waves that move vertices; the rest are short ripples that only tilt the shading normal.
function buildWaves(rng, P, windAngle) {
  const A = [], B = [];
  let sum = 0; const raw = [];
  for (let i = 0; i < NW; i++) { const L = P.wavelength * Math.pow(2, 1.0 - i * 0.6) * rng.range(0.9, 1.1), a = Math.pow(L, 0.75); raw.push([L, a]); sum += a; }
  for (let i = 0; i < NW; i++) {
    const [L, a] = raw[i], k = TAU / L, amp = (a / sum) * P.height * 1.35;
    // neighbouring wavelengths lean to opposite sides of the wind, so crests cross into short-crested water instead of lining up
    const ang = windAngle + (i % 2 ? 1 : -1) * (0.3 + 0.75 * Math.abs(rng.gauss())) * P.spread * (0.3 + 0.7 * Math.min(1, i / NW));
    A.push(new THREE.Vector4(Math.cos(ang), Math.sin(ang), k, Math.sqrt(GRAV * k) * P.speed));
    B.push(new THREE.Vector4(amp, Math.min(1, P.steepness) / (k * amp * NW), rng.range(0, TAU), L));
  }
  const hi = Math.min(9, Math.max(2.6, P.wavelength * 0.085)), lo = 0.85, ND = NF - NW;
  for (let j = 0; j < ND; j++) {
    const L = hi * Math.pow(lo / hi, j / (ND - 1)) * rng.range(0.85, 1.15), k = TAU / L, ka = 0.085 * rng.range(0.7, 1.3);
    const ang = windAngle + rng.gauss() * (0.75 + 0.4 * P.spread);
    A.push(new THREE.Vector4(Math.cos(ang), Math.sin(ang), k, Math.sqrt(GRAV * k) * P.speed));
    B.push(new THREE.Vector4(ka / k, 0, rng.range(0, TAU), L));
  }
  return { A, B };
}

function radialGrid(radius, rings, segs, k) {
  const pos = new Float32Array((rings * segs + 1) * 3), idx = [];
  const r0 = radius / (Math.exp(k) - 1);
  let p = 3;
  for (let i = 1; i <= rings; i++) {
    const r = r0 * (Math.exp((k * i) / rings) - 1), off = (i % 2) * 0.5;
    for (let j = 0; j < segs; j++) { const a = ((j + off) / segs) * TAU; pos[p++] = Math.cos(a) * r; pos[p++] = 0; pos[p++] = Math.sin(a) * r; }
  }
  for (let j = 0; j < segs; j++) idx.push(0, 1 + ((j + 1) % segs), 1 + j);
  for (let i = 1; i < rings; i++) {
    const a = 1 + (i - 1) * segs, b = 1 + i * segs;
    for (let j = 0; j < segs; j++) { const j1 = (j + 1) % segs; idx.push(a + j, a + j1, b + j, a + j1, b + j1, b + j); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius * 1.1);
  return { geometry: g, r0, spacing: Math.max(TAU / segs, k / rings) };
}

// shoals: discs and / or a baked depth map. Returns (0 at the waterline .. 1 in open water, band width in metres)
const GLSL_SHOAL = /* glsl */`
uniform vec4 uShallow[${NS}];
#ifdef KIT_DEPTHMAP
uniform sampler2D uDepthTex; uniform vec4 uDepthRect; uniform vec2 uShoal; uniform float uLand;
#endif
vec2 kitShoal(vec2 xz){ float sd = 1e3, w = 30.;
  for(int i=0;i<${NS};i++){ vec4 s=uShallow[i]; if(s.w<=0.) continue; float d=(length(xz-s.xy)-s.z)/s.w; if(d<sd){ sd=d; w=s.w; } }
  #ifdef KIT_DEPTHMAP
    vec2 uv=(xz-uDepthRect.xy)*uDepthRect.zw; vec2 e=min(uv,1.-uv);
    if(min(e.x,e.y)>0.){ float d=mix(1e3, texture2D(uDepthTex,uv).r/uShoal.x, smoothstep(0.,.05,min(e.x,e.y))); if(d<sd){ sd=d; w=uShoal.y; } }
  #endif
  return vec2(sd,w); }
`;

const OCEAN_VERT = /* glsl */`
#define NW ${NW}
uniform vec4 uWA[${NF}], uWB[${NF}];
uniform float uTime, uSpacing, uR0, uRadius, uAmp, uShoreDamp;
varying vec3 vWorld; varying vec2 vXZ; varying float vH; varying vec3 vPixK;
${GLSL_SHOAL}
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix*vec4(position,1.);
  vec2 xz = wp.xz; float r = length(position.xz);
  float sp = (r+uR0)*uSpacing;
  vec3 d = vec3(0.);
  for(int i=0;i<NW;i++){ vec4 a=uWA[i], b=uWB[i];
    float f = smoothstep(2.,4.5,b.w/sp);
    float th = a.z*dot(a.xy,xz)-a.w*uTime+b.z; float c=cos(th), s=sin(th);
    d.xz += a.xy*(b.y*b.x*c*f); d.y += b.x*s*f; }
  d *= 1.-smoothstep(.3*uRadius,.8*uRadius,r);
  d *= mix(uShoreDamp, 1., smoothstep(0.,1.,kitShoal(xz).x));       // waves lose height over shoals
  wp.xyz += d; vXZ = xz; vWorld = wp.xyz; vH = d.y/uAmp;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;

const OCEAN_FRAG = /* glsl */`
#define NF ${NF}
#define NW ${NW}
${GLSL_COMMON}
uniform vec4 uWA[NF], uWB[NF];
uniform vec3 uDeep, uScatter, uFoamColor, uGlow, uHorizonColor, uShallowColor;
uniform float uFoamT, uFoam, uDetail, uRough, uFadeA, uFadeB, uGlitter, uReflect, uSteep, uContrast, uHorizonMix;
varying vec3 vWorld; varying vec2 vXZ; varying float vH;
${GLSL_SHOAL}
${GLSL_FOG_FRAG}
${GLSL_UNDERSIDE}
const mat2 R1 = mat2(.7986,.6018,-.6018,.7986), R2 = mat2(-.3256,.9455,-.9455,-.3256);      // 37 and 109 degrees
void main(){
  vec3 toCam = cameraPosition-vWorld; float dist = length(toCam); vec3 V = toCam/dist;
  float foot = dist*kitPix()/max(abs(V.y),.03);           // pixel footprint along the view direction (m)
  #ifdef KIT_DEPTHMAP
    // sea that the depth map puts well under the land is never shaded (it is hidden by the terrain anyway)
    vec2 duv = (vXZ-uDepthRect.xy)*uDepthRect.zw;
    if(gl_FrontFacing && min(min(duv.x,duv.y),min(1.-duv.x,1.-duv.y))>0. && texture2D(uDepthTex,duv).r<-uLand) discard;
  #endif
  vec2 slope = vec2(0.); float q = 0., lost = 0.; vec3 j0 = vec3(0.), j1 = vec3(0.), j2 = vec3(0.);
  vec2 wq = vec2(vnoise(R2*vXZ*.05+uTime*.03), vnoise(R1*vXZ*.14-uTime*.05))-.5;       // bends the ripple crests
  float wq2 = vnoise(R2*vXZ*.41+uTime*.09)-.5;
  float gust = .5+vnoise(vXZ*.0065+uTime*.012)+.4*(wq.x+.5);                           // wind patches: rougher and smoother water
  int nf = gl_FrontFacing ? NF : NW+4;                    // the underside needs fewer ripples
  for(int i=0;i<NF;i++){ if(i>=nf) break; vec4 a=uWA[i], b=uWB[i];
    float ka = a.z*b.x, f0 = smoothstep(1.2,4.,b.w/foot), g = i<NW ? 1. : gust*uDetail;
    if(f0<=0.){ lost += ka*ka*.5*g*g; continue; }
    float th = a.z*dot(a.xy,vXZ)-a.w*uTime+b.z;
    int m3 = i-(i/3)*3; float e = m3==0 ? wq.x : m3==1 ? wq.y : -wq.x-wq.y;        // wave groups: crests are short, not endless lines
    if(i>=NW){ float ee = i<NW+3 ? wq.x : (i<NW+6 ? wq.y : wq2); if((i&1)==1) ee = -ee;      // each ripple train lives in its own patches, a few wavelengths across
      th += ((i&1)==0 ? wq.x : wq.y)*6.+((i&2)==0 ? wq2 : wq.y-wq2)*min(a.z*1.3,7.);       // crests wander: no ruled lines
      g *= .12+1.8*smoothstep(-.28,.28,ee); }
    else if(i>=3){ float sm = smoothstep(16.,6.,b.w);                                // short geometry waves break into groups too
      th += ((i&1)==0 ? wq.x : wq.y)*mix(1.2,5.,sm); g *= clamp(1.+mix(1.9,3.4,sm)*e,mix(.3,.08,sm),2.)*mix(1.,smoothstep(.55,1.5,gust)*1.5,sm); }   // and leave glassy slicks between the gusts
    float c=cos(th), s=sin(th), f=f0*g;
    slope += a.xy*(ka*c*f); lost += (1.-f0*f0)*ka*ka*.5*g*g;
    if(i<NW){ float qa=b.y*ka*f, qs=qa*s; q += qs; vec3 dd=vec3(a.x*a.x,a.y*a.y,a.x*a.y);
      j0 += dd*qs; j1 += dd*(qa*(s*.7648+c*.6442)); j2 += dd*(qa*(s*.0707+c*.9975)); } }      // fold now, .7 and 1.5 rad ago
  // micro ripples close to the eye
  float f1 = smoothstep(.6,3.,.9/foot), f2 = smoothstep(.6,3.,.28/foot);
  if(f1>0.){ vec3 n1 = noised(R1*vXZ*1.1+uTime*vec2(.4,.25)), n2 = noised(R2*vXZ*3.6-uTime*vec2(.55,-.4)+n1.x*1.2);
    slope += uDetail*gust*((n1.yz*R1)*.15*f1+(n2.yz*R2)*.11*f2); }
  lost += uDetail*uDetail*gust*gust*((1.-f1)*.004+(1.-f2)*.0025);
  vec3 N = normalize(vec3(-slope.x, 1.-q, -slope.y));
  if(!gl_FrontFacing){                                   // seen from below
    float net = pow(1.-min(abs(slope.x-slope.y)*3.,1.),3.);
    vec3 uc = kitUnderside(-V, -N, dist, net);
    uc = mix(uc, uUwWater, max(smoothstep(0.,.8,kitFog()), 1.-smoothstep(0.,.09,abs(V.y))));      // the far underside melts into the murk: no seam
    gl_FragColor = vec4(uc,1.);
    #include <fog_fragment>
    return; }
  float alpha = sqrt(uRough*uRough+2.*max(lost,0.));
  float ndv = max(dot(N,V),0.);
  // reflection of the sky; rough far water tilts the mean reflection upward
  vec3 R = reflect(-V,N); R.y = abs(R.y); R = normalize(R+vec3(0.,alpha*.9,0.));
  vec3 refl = kitSky(R)*uReflect;
  float F = .02+.98*pow5(1.-ndv); F *= 1./(1.+alpha*1.6);
  // body colour: deep water lit by sky and sun, dark troughs, light scattering through the crests
  vec3 amb = kitAmbient(); float ndl = max(dot(N,uSunDir),0.);
  float crest = smoothstep(-.35,1.,vH);
  float toward = pow(clamp(dot(-V,uSunDir)*.5+.5,0.,1.),3.);
  vec3 body = uDeep*(amb*.9+uSunColor*(.08+.24*ndl));
  body *= mix(1., .5+.5*smoothstep(-1.,.25,vH), uContrast);
  body += uScatter*(amb*(.16+.2*uContrast)+uSunColor*(.04+.3*toward))*crest*crest*(.4+.6*clamp((1.-N.y)*14.,0.,1.))*(.3+.7*exp(-dist*.004));
  vec2 sh = kitShoal(vXZ); float shal = 1.-smoothstep(0.,1.,sh.x);
  float ft = fbm2(R1*vXZ*.33+vec2(uTime*.05,0.));
  float ring = 0.;
  if(sh.x<.6){ float lap = sin(sh.x*sh.y*.55+uTime*1.1+ft*7.)*.5+.5;                    // swash running up the shore
    ring = (1.-smoothstep(0.,.55,sh.x))*smoothstep(-.1,.04,sh.x)*smoothstep(.45,.95,lap*.6+ft*.75+(1.-smoothstep(0.,.2,sh.x))*.4); }
  body = mix(body, uShallowColor*(amb+uSunColor*(.1+.26*ndl)), shal*.62);
  vec3 col = mix(body, refl, F);
  // sun: sharp glints up close, a glittering path far away
  vec3 spec = kitSunSpec(N,V,alpha,60.);
  float gl = kitGlitter(vXZ, dist*kitPix()*3./sqrt(max(V.y,.03)));
  spec *= mix(1., .2+9.*gl, uGlitter*smoothstep(.0,.06,alpha));
  // foam: born where the surface folds (jacobian of the gerstner displacement), ageing into lace behind the crest
  float fa = 0.;
  float J0 = (1.-j0.x)*(1.-j0.y)-j0.z*j0.z, J1 = (1.-j1.x)*(1.-j1.y)-j1.z*j1.z, J2 = (1.-j2.x)*(1.-j2.y)-j2.z*j2.z, fT = uFoamT-.25*uSteep;
  float m = max(smoothstep(uFoamT,fT,J0), max(smoothstep(uFoamT,fT,J1)*.62, smoothstep(uFoamT,fT,J2)*.36))*uFoam;
  vec2 wd = uWA[0].xy; vec2 ws = vec2(dot(vXZ,wd),dot(vXZ,vec2(-wd.y,wd.x)));
  m += uFoam*.3*smoothstep(.6,1.,crest)*smoothstep(.95,1.5,gust);                        // whitecaps flicker in the gusts
  float row = 1.-abs(2.*vnoise(ws*vec2(.014,.2)+vec2(uTime*.02,ft*1.5))-1.);              // wind rows in heavy seas
  m += uFoam*uFoam*.42*pow(row,6.)*smoothstep(-.5,.5,vH);
  m = max(m, ring);
  if(m>.004){
    vec2 fp = vXZ+wd*uTime*.3, wv = vec2(ft-.5, wq.y)*1.2;
    float mm = clamp(m*(.5+1.1*fbm2(ws*vec2(.045,.15)+vec2(uTime*.02,3.)+wv)),0.,.94);     // patchy, drawn out along the wind
    float cov = max(kitLace(fp*.42+wv, mm, foot*.42), kitLace(R1*fp*1.5+wv*2., mm*.9, foot*1.5));
    float dense = smoothstep(.3,.9,mm), lt = smoothstep(.5,2.5,.4/foot), lt2 = smoothstep(.5,2.5,.12/foot);
    // thick foam is marbled: wind-drawn veins of green water open through it, so a breaking crest is never a flat white sheet
    float lt0 = smoothstep(.5,2.5,2.4/foot), mar = 1.-abs(2.*fbm2(ws*vec2(.085,.3)+wv*2.2+vec2(uTime*.05,7.))-1.);
    float mar2 = 1.-abs(2.*vnoise(R1*fp*.55+wv*3.+4.)-1.);
    cov *= max(0., 1.-dense*lt0*(.8*smoothstep(.66,.95,mar)+.45*smoothstep(.72,.97,mar2)*lt));   // never below zero: where both veins cross in dense foam the cover went negative (a few dark pixels along a surf line)
    float bub = mix(.5, kitCell4(R2*fp*2.3+wv).x*1.6, lt);                                 // bubble clusters: thick foam is never a flat sheet
    float tex = (.84+.16*bub)*(.8+.4*mix(.5, fbm2(R1*fp*1.3+wv*3.), lt))*(.94+.12*mix(.5, vnoise(R1*fp*9.), lt2))*(.84+.16*crest);
    fa = cov*(.7+.3*dense)*(.9+.1*mix(1.,bub*1.6,dense));
    fa *= mix(1., mix(min(.3+1.1*fbm2(R2*fp*2.7+wv*2.),1.), 1., dense), lt);                       // flecks are ragged and uneven, not paper cut-outs
    vec3 fc = mix(mix(uScatter,uFoamColor,.5), uFoamColor, dense)*(amb+uSunColor*(.05+.2*mix(ndl,uSunDir.y,.65)))*tex;
    col = mix(col, fc, fa); }
  col += spec*(1.-fa);
  col += uGlow*(fa*1.5+pow(crest,4.)*.25);
  // horizon: dissolve into the sky seen in that direction
  float hf = smoothstep(uFadeA,uFadeB,length(vWorld.xz-cameraPosition.xz)); hf = hf*hf*(3.-2.*hf);
  vec3 hz = mix(kitAtmo(normalize(vec3(-V.x,.004,-V.z))), uHorizonColor, uHorizonMix);
  col = mix(col, hz, hf);
  gl_FragColor = vec4(col,1.);
  #ifdef USE_FOG
    gl_FragColor.rgb = mix(col, mix(fogColor, hz, hf), kitFog());
  #endif
}`;
// instanced camera-facing quads. fill(i, a, b) writes two vec4 per instance (aA, aB).
function spriteGeometry(count, fill) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const a = new Float32Array(count * 4), b = new Float32Array(count * 4), ta = [0, 0, 0, 0], tb = [0, 0, 0, 0];
  for (let i = 0; i < count; i++) { fill(i, ta, tb); a.set(ta, i * 4); b.set(tb, i * 4); }
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(a, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(b, 4));
  g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
// spindrift: sprites that only exist on breaking crests and stream downwind
const SPRAY_VERT = /* glsl */`
#define NW ${NW}
attribute vec4 aA, aB;  // aA = (tile x, tile z, phase, rate)  aB = (size, lift, seed, drift)
uniform vec4 uWA[${NF}], uWB[${NF}];
uniform float uTime, uRange, uAmp, uLevel; uniform vec2 uWindDir;
varying vec2 vQ; varying float vI, vSeed; varying vec3 vWorld; varying vec3 vPixK;
#include <fog_pars_vertex>
void main(){
  float tt = uTime*aA.w+aA.z, life = fract(tt), cyc = floor(tt);
  vec2 p0 = aA.xy+uRange*fract(vec2(.6180,.4142)*cyc+aB.z*7.);
  vec2 c = mod(p0-cameraPosition.xz+uRange*.5,uRange)-uRange*.5; float dc = length(c)/(uRange*.5); c += cameraPosition.xz;
  vec3 d = vec3(0.); float q = 0.;
  for(int i=0;i<NW;i++){ vec4 a=uWA[i], b=uWB[i]; float th=a.z*dot(a.xy,c)-a.w*uTime+b.z; float cs=cos(th), s=sin(th);
    d.xz += a.xy*(b.y*b.x*cs); d.y += b.x*s; q += b.y*a.z*b.x*s; }
  float crest = smoothstep(.16,.42,q)*smoothstep(.05,.45,d.y/uAmp);
  float e = 1.-(1.-life)*(1.-life);
  vec3 w = vec3(c.x+d.x, uLevel+d.y, c.y+d.z);
  w.xz += uWindDir*(aB.w*e); w.y += aB.y*e*(1.-.5*e)+aB.x*.2;
  float sz = aB.x*(.4+.9*e);
  vI = crest*sin(life*3.14159)*(1.-smoothstep(.65,1.,dc))*smoothstep(2.,8.,length(w-cameraPosition));
  vQ = position.xy; vSeed = aB.z; vWorld = w;
  vec4 mvPosition = viewMatrix*vec4(w,1.); mvPosition.xy += position.xy*vec2(1.7,.75)*sz*step(.004,vI);
  gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;
const SPRAY_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uFoamColor; uniform float uOpacity;
varying vec2 vQ; varying float vI, vSeed; varying vec3 vWorld;
${GLSL_FOG_FRAG}
void main(){
  float r = length(vQ); if(r>1.||vI<=.004) discard;
  float n = fbm3(vQ*vec2(1.2,2.4)+vSeed*31.+vec2(-uTime*.6,0.));
  float puff = 1.-smoothstep(.05,1.,r+(n-.5)*.9);
  vec3 d = normalize(vWorld-cameraPosition);
  float back = pow(clamp(dot(d,uSunDir)*.5+.5,0.,1.),3.);
  vec3 col = uFoamColor*(kitAmbient()*(.75+.3*n)+uSunColor*(.05+.2*back));
  #ifdef USE_FOG
    col = mix(col, fogColor, kitFog());
  #endif
  gl_FragColor = vec4(col, puff*(.35+.65*puff)*min(vI*1.6,1.)*uOpacity);
}`;

// One row of an ocean's depth map: depthAt read at the middle of each of its n cells, clamped to -8..200 m, as half floats.
function depthRow(opts, data, n, j) {
  const [x0, z0, x1, z1] = opts.depthRect;
  for (let i = 0; i < n; i++) data[j * n + i] = THREE.DataUtils.toHalfFloat(Math.max(-8, Math.min(200, opts.depthAt(x0 + ((i + 0.5) / n) * (x1 - x0), z0 + ((j + 0.5) / n) * (z1 - z0)))));
}
// The depth map makeOcean bakes from depthAt, made ahead IN SLICES (since s0x): the same numbers read in the same order, handed back
// to the page after every `rows` rows (y is the world's ctx.yield), so that a large map over a costly ground is no one build step.
// Hand what it returns to makeOcean as depthData, beside the same depthRect and depthRes: the sea is the same to the bit.
// opts: { depthAt, depthRect, depthRes }.
export async function oceanDepthAsync(opts = {}, y, rows = 8) {
  const n = Math.max(8, opts.depthRes ?? 64), data = new Uint16Array(n * n), w = typeof y === 'function' ? y : async () => {}, k = Math.max(1, rows | 0);
  for (let j = 0; j < n; j++) { depthRow(opts, data, n, j); if ((j + 1) % k === 0 && j + 1 < n) await w(); }
  return { data, res: n };
}

// Endless animated sea. opts: { rng, preset, level, radius, windAngle, light | sky, deep, scatter, foamColor, shallows, depthAt, ... }
export function makeOcean(opts = {}) {
  const rng = kitRng(opts, 'ocean'), P = { ...(OCEAN_PRESETS[opts.preset] || OCEAN_PRESETS.breeze) };
  for (const k of ['height', 'wavelength', 'steepness', 'spread', 'foam', 'detail', 'speed', 'contrast']) if (opts[k] != null) P[k] = opts[k];
  const radius = opts.radius ?? 3600, level = opts.level ?? 0;
  const windAngle = opts.windAngle ?? rng.range(0, TAU);
  const { A, B } = buildWaves(rng.fork('waves'), P, windAngle);
  const grid = radialGrid(radius, opts.rings ?? 132, opts.segments ?? 160, 7.5);
  const L = factoryLight(opts), lu = lightUniforms(L);
  const shallows = Array.from({ length: NS }, (_, i) => { const s = (opts.shallows || [])[i]; return s ? new THREE.Vector4(s.x, s.z, s.radius ?? 40, Math.max(0.01, s.falloff ?? (s.radius ?? 40) * 0.9)) : new THREE.Vector4(0, 0, 0, 0); });
  const water = toCol(opts.underColor, '#0d7fa0'), deepW = toCol(opts.underDeep, '#04283f');
  const uniforms = {
    ...fogUniforms(), ...lu,
    uWA: { value: A }, uWB: { value: B }, uSpacing: { value: grid.spacing }, uR0: { value: grid.r0 }, uRadius: { value: radius },
    uAmp: { value: Math.max(0.05, P.height) }, uSteep: { value: Math.min(1, P.steepness) }, uContrast: { value: P.contrast },
    uDeep: { value: toCol(opts.deep, P.deep ?? '#0a4a78') }, uScatter: { value: toCol(opts.scatter, P.scatter ?? '#38c9b4') },
    uFoamColor: { value: toCol(opts.foamColor, '#f2f7fa') }, uGlow: { value: toCol(opts.glow, '#000000') },
    uShallowColor: { value: toCol(opts.shallowColor, '#3fd6c2') }, uShallow: { value: shallows }, uShoreDamp: { value: opts.shoreDamp ?? 0.35 },
    uHorizonColor: { value: toCol(opts.horizonColor, '#000000') }, uHorizonMix: { value: opts.horizonColor != null ? 1 : 0 },
    uFoamT: { value: 1 - Math.min(1, P.steepness) * (0.7 - 0.45 * P.foam) }, uFoam: { value: P.foam > 0 ? 0.35 + 0.65 * P.foam : 0 },
    uDetail: { value: P.detail }, uRough: { value: opts.roughness ?? 0.035 },
    uFadeA: { value: radius * (opts.fadeStart ?? 0.5) }, uFadeB: { value: radius * (opts.fadeEnd ?? 0.97) },
    uGlitter: { value: opts.glitter ?? 1 }, uReflect: { value: opts.reflectivity ?? 1 },
    uUwWater: { value: new THREE.Color() }, uUwDeep: { value: new THREE.Color() }, uUwSunDisc: { value: 1 },
  };
  const defines = {};
  // optional depth map: any coastline gets shallows, swash foam and smaller waves
  // (depthData: the same map made ahead by oceanDepthAsync, taken as it is when it has this map's size; else depthAt is read here)
  const dn = Math.max(8, opts.depthRes ?? 64), made = opts.depthData && opts.depthData.res === dn && opts.depthData.data && opts.depthData.data.length === dn * dn ? opts.depthData.data : null;
  if ((opts.depthAt || made) && opts.depthRect) {
    const [x0, z0, x1, z1] = opts.depthRect, n = dn, data = made || new Uint16Array(n * n);
    if (!made) for (let j = 0; j < n; j++) depthRow(opts, data, n, j);
    const tex = new THREE.DataTexture(data, n, n, THREE.RedFormat, THREE.HalfFloatType);
    tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
    uniforms.uDepthTex = { value: tex }; uniforms.uDepthRect = { value: new THREE.Vector4(x0, z0, 1 / (x1 - x0), 1 / (z1 - z0)) };
    uniforms.uShoal = { value: new THREE.Vector2(opts.shoalDepth ?? 7, opts.shoalWidth ?? 30) }; uniforms.uLand = { value: Math.max(1.5, P.height * 0.6) }; defines.KIT_DEPTHMAP = 1;
  }
  const material = new THREE.ShaderMaterial({ uniforms, defines, vertexShader: OCEAN_VERT, fragmentShader: OCEAN_FRAG, fog: true, side: THREE.DoubleSide });
  const surface = new THREE.Mesh(grid.geometry, material);
  surface.frustumCulled = false; surface.name = 'kit-ocean-surface';
  surface.renderOrder = opts.renderOrder ?? 1;                // after the other opaque meshes: sea hidden behind land costs nothing
  const object = new THREE.Group(); object.name = 'kit-ocean'; object.position.y = level; object.add(surface);
  // spindrift
  let spray = null;
  const sprayN = opts.spray === false ? 0 : typeof opts.spray === 'number' ? opts.spray : (opts.spray === true || P.foam >= 0.9) ? 520 : 0;
  if (sprayN > 0) {
    const range = opts.sprayRange ?? 300, sr = rng.fork('spray'), s0 = Math.max(1, P.height * 0.55);
    const sg = spriteGeometry(sprayN, (i, a, b) => { a[0] = sr.range(0, range); a[1] = sr.range(0, range); a[2] = sr(); a[3] = sr.range(0.35, 0.8);
      b[0] = s0 * sr.range(0.7, 1.9); b[1] = s0 * sr.range(0.3, 1.3); b[2] = sr(); b[3] = s0 * sr.range(3, 9); });
    const su = { ...fogUniforms(), ...lu, uTime: uniforms.uTime, uWA: uniforms.uWA, uWB: uniforms.uWB, uAmp: uniforms.uAmp, uRange: { value: range }, uLevel: { value: level },
      uWindDir: { value: new THREE.Vector2(Math.cos(windAngle), Math.sin(windAngle)) }, uFoamColor: uniforms.uFoamColor, uOpacity: { value: opts.sprayOpacity ?? 0.6 } };
    spray = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: su, vertexShader: SPRAY_VERT, fragmentShader: SPRAY_FRAG, fog: true, transparent: true, depthWrite: false }));
    spray.frustumCulled = false; spray.renderOrder = 3; spray.name = 'kit-ocean-spray'; spray.position.y = -level; object.add(spray);
  }
  // CPU mirror of the vertex shader (full-detail waves, no LOD fade, no shoal damping)
  const wa = A.slice(0, NW).map((v) => [v.x, v.y, v.z, v.w]), wb = B.slice(0, NW).map((v) => [v.x, v.y, v.z]);
  // heightAt: five steps towards the point whose wave lands on (x, z), then the height there. The steps need only the
  // two horizontal sums (cosines) and the height needs only the vertical one (sines): each sum is made of the same
  // terms in the same order as when all three were summed in every pass, so a height that is a number is the same to the
  // last bit (and where the old form gave not-a-number, so does this).
  const heightAt = (x, z, time) => {
    let px = x, pz = z;
    for (let it = 0; it < 5; it++) {
      let dx = 0, dz = 0;
      for (let i = 0; i < NW; i++) { const a = wa[i], b = wb[i], th = a[2] * (a[0] * px + a[1] * pz) - a[3] * time + b[2], c = Math.cos(th), qa = b[1] * b[0] * c; dx += a[0] * qa; dz += a[1] * qa; }
      px += (x - dx - px) * 0.85; pz += (z - dz - pz) * 0.85;
    }
    let dy = 0;
    for (let i = 0; i < NW; i++) { const a = wa[i], b = wb[i], th = a[2] * (a[0] * px + a[1] * pz) - a[3] * time + b[2]; dy += b[0] * Math.sin(th); }
    return level + dy;
  };
  const normalAt = (x, z, time, out = new THREE.Vector3()) => {
    const e = 0.6, h = heightAt(x, z, time);
    return out.set(h - heightAt(x + e, z, time), e, h - heightAt(x, z + e, time)).normalize();
  };
  let linked = false;
  const api = {
    object, surface, spray, material, uniforms, light: L, preset: P, level, windAngle, heightAt, normalAt,
    // makeUnderwater({ ocean }) calls this so the underside of the waves is shaded with its water colours
    linkUnderwater(volume, deepCol, sunDisc = 1) { uniforms.uUwWater.value = volume; uniforms.uUwDeep.value = deepCol; uniforms.uUwSunDisc.value = sunDisc; linked = true; },
    setLight: (light, over) => { L.set(light, over); },
    update(dt, time, camera) {
      uniforms.uTime.value = time;
      if (!linked) waterVolume(L, water, deepW, 0.06, uniforms.uUwWater.value, uniforms.uUwDeep.value);
      if (camera) { surface.position.x = camera.position.x; surface.position.z = camera.position.z; }
    },
  };
  return api;
}

// ================================================================== flat surfaces (lake, ice)
// Grid in the XZ plane with per-vertex water depth (aDepth) and horizontal distance to the shore (aShore).
// opts: center, radius | width+depth, segments, depthAt(x,z)
function surfaceGeometry(opts, defaultSlope, defaultSegs) {
  const c = opts.center || [0, 0], cx = c[0], cz = c.length > 2 ? c[2] : c[1];
  const disc = opts.width == null, R = opts.radius ?? 120;
  const w = disc ? R * 2 : opts.width, d = disc ? R * 2 : (opts.depth ?? opts.width);
  const n = opts.segments ?? defaultSegs, nz = Math.max(2, Math.round((n * d) / w));
  const g = new THREE.PlaneGeometry(w, d, n, nz); g.rotateX(-Math.PI / 2);
  const pos = g.attributes.position, dep = new Float32Array(pos.count), shore = new Float32Array(pos.count);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + cx, z = pos.getZ(i) + cz;
    pos.setX(i, x); pos.setZ(i, z);
    dep[i] = opts.depthAt ? opts.depthAt(x, z) : disc ? (R - Math.hypot(x - cx, z - cz)) * defaultSlope : 50;
  }
  const sx = w / n, sz = d / nz, W1 = n + 1;
  for (let j = 0; j <= nz; j++) for (let i = 0; i <= n; i++) {
    const k = j * W1 + i, i0 = Math.max(0, i - 1), i1 = Math.min(n, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(nz, j + 1);
    const gx = (dep[j * W1 + i1] - dep[j * W1 + i0]) / ((i1 - i0) * sx), gz = (dep[j1 * W1 + i] - dep[j0 * W1 + i]) / ((j1 - j0) * sz);
    shore[k] = Math.max(-50, Math.min(500, dep[k] / Math.max(0.03, Math.hypot(gx, gz))));
  }
  g.setAttribute('aDepth', new THREE.BufferAttribute(dep, 1)); g.setAttribute('aShore', new THREE.BufferAttribute(shore, 1));
  const src = g.index.array, wet = [];                        // triangles that are dry at all three corners are never drawn
  for (let i = 0; i < src.length; i += 3) if (dep[src[i]] > 0 || dep[src[i + 1]] > 0 || dep[src[i + 2]] > 0) wet.push(src[i], src[i + 1], src[i + 2]);
  g.setIndex(wet);
  g.computeBoundingSphere();
  return g;
}
function ensureShore(geometry, slope) {
  if (!geometry.attributes.aShore && geometry.attributes.aDepth) { const d = geometry.attributes.aDepth.array, s = new Float32Array(d.length); for (let i = 0; i < d.length; i++) s[i] = d[i] / slope; geometry.setAttribute('aShore', new THREE.BufferAttribute(s, 1)); }
  return geometry;
}
const FLAT_VERT = /* glsl */`
attribute float aDepth, aShore; varying vec3 vWorld; varying float vDepth, vShore; varying vec3 vPixK;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix*vec4(position,1.); vWorld = wp.xyz; vDepth = aDepth; vShore = aShore;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;

const LAKE_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uDeep, uShallow, uFoamColor, uBandColor, uBandTop;
uniform float uRipple, uRippleScale, uRough, uShoreFoam, uFoamWidth, uClarity, uBandH, uBandSoft, uBandAmt, uBandHaze, uEdge, uReflect, uGlitter;
uniform vec2 uWind, uCenter;
#ifdef KIT_SKYLINE
uniform sampler2D uSkyline;
#endif
varying vec3 vWorld; varying float vDepth, vShore;
${GLSL_FOG_FRAG}
const mat2 R1 = mat2(.7986,.6018,-.6018,.7986), R2 = mat2(-.3256,.9455,-.9455,-.3256), R3 = mat2(.3420,-.9397,.9397,.3420);
void main(){
  if(vDepth<=0.) discard;
  vec3 toCam = cameraPosition-vWorld; float dist = length(toCam); vec3 V = toCam/dist;
  float pix = kitPix(), foot = dist*pix/max(V.y,.03);
  vec2 p = vWorld.xz*uRippleScale; float inv = 1./(uRippleScale*foot);
  float f1 = smoothstep(1.,4.,5.*inv), f2 = smoothstep(1.,4.,1.4*inv), f3 = smoothstep(1.,4.,.4*inv);
  vec3 n1 = noised(R1*p*.2+uWind*uTime*.1), n2 = noised(R2*p*.7-uWind.yx*uTime*.17+n1.x), n3 = noised(R3*p*2.6+uWind*uTime*.33+n2.x);
  float gust = .25+.75*smoothstep(.3,.7,vnoise(vWorld.xz*.011+uWind*uTime*.015)*.6+vnoise(R1*vWorld.xz*.031-uWind*uTime*.02)*.4);   // cat's paws
  vec2 slope = uRipple*gust*((n1.yz*R1)*.05*f1+(n2.yz*R2)*.05*f2+(n3.yz*R3)*.035*f3);
  float lost = uRipple*uRipple*gust*gust*((1.-f1)*.0004+(1.-f2)*.0004+(1.-f3)*.0002);
  vec3 N = normalize(vec3(-slope.x,1.,-slope.y));
  float alpha = sqrt(uRough*uRough+2.*lost), ndv = max(dot(N,V),0.);
  vec3 R = reflect(-V,N); R.y = abs(R.y);
  vec3 amb = kitAmbient(); float ndl = max(dot(N,uSunDir),0.);
  vec3 refl = kitSky(R);
  // reflection of the far shore: a skyline whose edge wobbles with the ripples
  float rh = max(length(R.xz),1e-3), az = atan(R.z,R.x);
  #ifdef KIT_SKYLINE
    vec4 s0 = texture2D(uSkyline, vec2(az/TAU+.5,.25)); vec3 top = texture2D(uSkyline, vec2(az/TAU+.5,.75)).rgb;
    float dd = max(s0.y-dot(vWorld.xz-uCenter,R.xz/rh), s0.y*.3);         // the ridge is nearer or further from this spot than from the centre
    float elev = s0.x*s0.y/dd;
  #else
    float elev = uBandH*(.55+.9*vnoise(vec2(az*5.,1.7))+.35*vnoise(vec2(az*23.,9.2))), dd = 400.; vec3 top = uBandTop;
  #endif
  float tt = (R.y/rh)/max(elev,1e-4), soft = uBandSoft/max(elev,.02);
  float facing = .5-.5*dot(R.xz/rh, normalize(uSunDir.xz+1e-4));                      // slopes that face the sun are lit, backlit ridges are silhouettes
  vec3 land = mix(uBandColor, top, smoothstep(.2,.7,tt))*(amb*.4+uSunColor*(.01+.15*facing*facing));
  land = mix(land, amb*.6, 1.-exp(-dd*uBandHaze));
  float bandM = uBandAmt*smoothstep(1.+soft,1.-soft,tt)*step(1e-4,elev);
  refl = mix(refl, land, bandM);
  float F = .02+.98*pow5(1.-ndv);
  float dk = 1.-exp(-vDepth*uClarity);
  vec3 body = mix(uShallow,uDeep,dk)*(amb*1.05+uSunColor*(.07+.16*ndl));
  vec3 col = mix(body, refl*uReflect, F);
  vec3 spec = kitSunSpec(N,V,alpha,60.)*(1.-bandM);
  spec *= mix(1., .3+6.*kitGlitter(vWorld.xz, dist*pix*3./sqrt(max(V.y,.03))), uGlitter*smoothstep(0.,.05,alpha));
  // shoreline foam: a broken fringe at the water's edge and soft bands lapping toward it
  float w = max(uFoamWidth, 2.2*foot), sh = 1.-smoothstep(0.,w,vShore);
  float fn = fbm2(R1*vWorld.xz*.45+uTime*.03), fq = vnoise(R2*vWorld.xz*2.3-uTime*.05);
  float bands = mix(.5+.5*sin((vShore/uFoamWidth*2.4+uTime*.32+fn*2.2)*TAU), .32, smoothstep(.25,.9,foot*2.4/uFoamWidth));
  float fringe = smoothstep(.34*w,.02*w,vShore+(fn-.5)*.35*w);
  float fm = clamp(fringe*(.55+.45*fq)+sh*sh*smoothstep(.45,.95,bands*(.55+.6*fn))*(.35+.65*fq), 0., 1.)*uShoreFoam*min(1.,uFoamWidth/w*1.6);
  col += spec*(1.-fm);
  col = mix(col, uFoamColor*(amb*.9+uSunColor*(.05+.2*ndl)), fm);
  float a = smoothstep(0.,uEdge,vDepth)*mix(clamp(.3+dk*1.1,0.,1.),1.,max(F,fm));
  gl_FragColor = vec4(col,a);
  #include <fog_fragment>
}`;

// Far-shore silhouette for a lake's fake reflection: 2 x N half-float texture, row 0 = (tan elevation, distance), row 1 = colour.
// sk: (azimuth) => elevation (rad) | { elevation, distance, color }, or { heightAt(x,z), colorAt(x,y,z), near, far, steps, samples }.
function bakeSkyline(sk, cx, cz, level, radius, topColor) {
  const fn = typeof sk === 'function' ? sk : null, N = (fn ? 128 : sk.samples) ?? 128, data = new Uint16Array(N * 8), H = THREE.DataUtils.toHalfFloat, c = new THREE.Color();
  const near = (!fn && sk.near) || radius, far = (!fn && sk.far) || 900, steps = (!fn && sk.steps) || 24;
  for (let i = 0; i < N; i++) {
    const az = ((i + 0.5) / N - 0.5) * TAU, dx = Math.cos(az), dz = Math.sin(az);
    let te = 0, dist = far; c.copy(topColor);
    if (fn) { const r = fn(az); if (typeof r === 'number') te = Math.tan(Math.max(0, r)); else if (r) { te = Math.tan(Math.max(0, r.elevation ?? 0)); dist = r.distance ?? far; if (r.color != null) setCol(c, r.color); } }
    else {
      let bx = 0, bz = 0, by = level;
      for (let j = 0; j < steps; j++) { const d = near * Math.pow(far / near, j / (steps - 1)), x = cx + dx * d, z = cz + dz * d, y = sk.heightAt(x, z), t = (y - level) / d; if (t > te) { te = t; dist = d; bx = x; bz = z; by = y; } }
      if (te > 0 && sk.colorAt) { const col = sk.colorAt(bx, by, bz); if (col != null) setCol(c, col); }
    }
    data.set([H(Math.min(te, 8)), H(dist), 0, H(1)], i * 4); data.set([H(c.r), H(c.g), H(c.b), H(1)], (N + i) * 4);
  }
  const tex = new THREE.DataTexture(data, N, 2, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

// Calm mirror water with a shoreline. opts: { rng, level, center, radius | width+depth, depthAt, light | sky, skyline, band:{...} }
export function makeLake(opts = {}) {
  if (opts.frozen) return makeIce(opts);
  const rng = kitRng(opts, 'lake'), band = opts.band === false ? { amount: 0 } : (opts.band || {});
  const wa = opts.windAngle ?? rng.range(0, TAU), level = opts.level ?? 0;
  const c = opts.center || [0, 0], cx = c[0], cz = c.length > 2 ? c[2] : c[1], radius = opts.radius ?? (opts.width ? opts.width * 0.5 : 120);
  const L = factoryLight(opts), topCol = toCol(band.top, '#77806f');
  const uniforms = {
    ...fogUniforms(), ...lightUniforms(L),
    uDeep: { value: toCol(opts.deep, '#083a52') }, uShallow: { value: toCol(opts.shallow, '#6fd0c2') }, uFoamColor: { value: toCol(opts.foamColor, '#f2f7fa') },
    uBandColor: { value: toCol(band.color, '#22342c') }, uBandTop: { value: topCol }, uBandH: { value: band.height ?? 0.12 }, uBandSoft: { value: band.softness ?? 0.03 },
    uBandAmt: { value: band.amount ?? (opts.skyline ? 1 : 0.9) }, uBandHaze: { value: band.haze ?? 0.0005 }, uCenter: { value: new THREE.Vector2(cx, cz) },
    uRipple: { value: opts.ripple ?? 1 }, uRippleScale: { value: opts.rippleScale ?? 1 }, uRough: { value: opts.roughness ?? 0.02 },
    uShoreFoam: { value: opts.shoreFoam ?? 0.85 }, uFoamWidth: { value: opts.foamWidth ?? 3.5 }, uClarity: { value: opts.clarity ?? 0.38 }, uEdge: { value: opts.edgeSoftness ?? 0.12 },
    uReflect: { value: opts.reflectivity ?? 1 }, uGlitter: { value: opts.glitter ?? 0.8 }, uWind: { value: new THREE.Vector2(Math.cos(wa), Math.sin(wa)) },
  };
  const defines = {};
  if (opts.skyline) { uniforms.uSkyline = { value: bakeSkyline(opts.skyline, cx, cz, level, radius, topCol) }; defines.KIT_SKYLINE = 1; }
  const geometry = opts.geometry ? ensureShore(opts.geometry, opts.shoreSlope ?? 0.12) : surfaceGeometry(opts, opts.shoreSlope ?? 0.12, 72);
  const material = new THREE.ShaderMaterial({ uniforms, defines, vertexShader: FLAT_VERT, fragmentShader: LAKE_FRAG, fog: true, transparent: true, depthWrite: false });
  const object = new THREE.Mesh(geometry, material); object.position.y = level; object.name = 'kit-lake';
  return { object, material, uniforms, light: L, level, heightAt: () => level,
    setLight: (light, over) => { L.set(light, over); }, update(dt, time) { uniforms.uTime.value = time; } };
}

const ICE_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uIce, uDeep, uCrack, uSnow, uGlow;
uniform float uScale, uThick, uSnowAmt, uRough, uCrackAmt, uFrost;
varying vec3 vWorld; varying float vDepth;
${GLSL_FOG_FRAG}
// (gap between the two nearest cells: 0 on the borders, cell hash, hash shared by the two cells either side of a border)
vec3 cells(vec2 p){ vec2 i=floor(p), f=fract(p); float d1=8., d2=8.; vec2 o1=vec2(0.), o2=vec2(0.);
  for(int y=-1;y<=1;y++) for(int x=-1;x<=1;x++){ vec2 g=vec2(float(x),float(y)); vec2 o=h22(i+g); vec2 r=g+o-f; float d=dot(r,r);
    if(d<d1){ d2=d1; o2=o1; d1=d; o1=o; } else if(d<d2){ d2=d; o2=o; } }
  return vec3(sqrt(d2)-sqrt(d1), o1.x, fract((o1.x+o2.x)*7.13+o1.y*o2.y*3.7)); }
// one family of long cracks in cell units: (surface line, fracture plane seen at depth). par = parallax per unit depth
vec2 crackSet(vec2 p, vec2 par, float ang, float freq, float seed, float w, float thick){
  vec2 n = vec2(cos(ang), sin(ang)), t = vec2(-n.y, n.x);
  float u = dot(p,n)*freq+seed, v = dot(p,t)*freq;
  u += .3*sin(v*.53+seed*3.)+.1*sin(v*1.71+seed)+.035*sin(v*6.3+seed*5.);
  float id = floor(u), fu = fract(u)-.5, h = h21(vec2(id, seed));
  float seg = vnoise(vec2(v*.45+h*91., id*.37+seed));                          // where along its length the crack exists
  float on = smoothstep(.4,.56,seg)*step(.3,h);
  float line = (1.-smoothstep(0., w*freq*(.4+on), abs(fu)))*on;
  float off = dot(par,n)*thick*freq; off = abs(off)<1e-4 ? 1e-4 : off;
  float s = fu/off;                                                            // 0 at the surface, 1 at the bottom of the plane
  float cur = (s>0.&&s<1.) ? (1.-s)*(1.-s)*(.3+.7*vnoise(vec2(v*5.+h*17., s*2.5+h*9.))) : 0.;
  return vec2(line, cur*on*smoothstep(0.,.08,abs(off))); }
const mat2 R1 = mat2(.7986,.6018,-.6018,.7986), R2 = mat2(-.3256,.9455,-.9455,-.3256);
void main(){
  if(vDepth<=0.) discard;
  vec3 toCam = cameraPosition-vWorld; float dist = length(toCam); vec3 V = toCam/dist;
  float foot = dist*kitPix()/max(V.y,.03);
  vec2 p = vWorld.xz, par = V.xz/sqrt(1.72-dot(V.xz,V.xz));     // refracted into the ice (n = 1.31)
  float lod = smoothstep(.5,3.,uScale*.06/foot);
  // surface: gentle undulation + pressure ridges
  vec3 n1 = noised(R1*p*.05), n2 = noised(R2*p*.9+n1.x*2.);
  vec3 N = normalize(vec3(-((n1.yz*R1).x*.02+(n2.yz*R2).x*.035*lod),1.,-((n1.yz*R1).y*.02+(n2.yz*R2).y*.035*lod)));
  float ndv = max(dot(N,V),0.);
  // milky frozen-in clouds and wind-packed snow first: under snow, and far away, the cracks are never evaluated
  float cloud = fbm3((p-par*.5*uThick)*.11); float cloud2 = fbm2((p-par*.2*uThick)*.6+7.);
  float milk = smoothstep(.35,.75,cloud)*.75+cloud2*.25*uFrost;
  float sn = fbm3(p*vec2(.035,.09)+vec2(0.,cloud*1.5))+.25*fbm2(p*.5)-.12;
  float snow = smoothstep(1.-uSnowAmt-.07,1.-uSnowAmt+.07,sn+.1+smoothstep(.6,0.,vDepth)*.6);
  vec3 amb = kitAmbient(); float ndl = max(dot(N,uSunDir),0.);
  float grain = vnoise(p*7.)*.5+vnoise(R1*p*23.)*.5;
  vec3 col = uSnow*(amb*.85+uSunColor*(.05+.19*ndl))*(.86+.14*grain);
  col += uSunColor*uSkyQ.z*kitGlitter(p*14.,1.)*pow(max(dot(reflect(-V,vec3(0.,1.,0.)),uSunDir),0.),4.)*2.5*lod;
  if(snow<.995){
    vec3 crack = vec3(0.); float veil = 0.;
    if(lod>.002){
    // cracks: families of long, gently curved fractures that start and stop, each with a pale fracture plane hanging
    // below it (seen through the ice by refracted parallax), plus a sparse polygon network and patches of crazing
    vec2 pu = p/uScale;
    vec2 bend = (vec2(vnoise(R1*pu*.37+3.1), vnoise(R2*pu*.37+17.7))-.5)*1.5+(vec2(vnoise(pu*2.1), vnoise(pu*2.1+9.3))-.5)*.2;
    vec2 pb = pu+bend*.45; float w = (.009+foot*.5)/uScale;
    float thinG = min(1., .05/(w*uScale));                                          // hairlines fade with distance instead of fattening
    vec2 cs = crackSet(pb, par, .31, .47, 1.7, w, uThick/uScale)+crackSet(pb, par, 1.45, .73, 5.3, w, uThick/uScale)
      +crackSet(pb, par, 2.38, 1.15, 9.1, w, uThick/uScale*.7)+crackSet(pb, par, 2.93, .29, 13.9, w*1.5, uThick/uScale*1.4);
    crack += uCrack*(cs.x*thinG+cs.y*.55*lod); veil += cs.x*thinG;
    vec2 wob = .17*vec2(sin(pu.y*4.3+bend.x*6.), sin(pu.x*3.7+bend.y*6.))+.05*vec2(sin(pu.y*13.+bend.y*9.), sin(pu.x*11.-bend.x*9.));
    vec3 c = cells((pu-par*.03*uThick/uScale)*.62+bend*.8+wob+11.3);     // edges wander: no ruler-straight polygon sides
    float keep = step(.66,c.z), wi = w*.62*(.35+1.3*vnoise(pu*2.7+5.));
    float line = (1.-smoothstep(0.,wi,c.x))*keep;
    crack += uCrack*(line*.7*thinG+smoothstep(.22,0.,c.x)*step(.8,c.z)*.12); veil += line*.6*thinG;
    float craze = smoothstep(.5,.7,vnoise(R1*pu*.9+4.));                          // patches of fine crazing
    if(craze>0.){ vec3 cm = cells(pu*4.3+bend*2.+3.1); crack += uCrack*(1.-smoothstep(0.,w*6.,cm.x))*.2*lod*craze; }
    // columns of frozen bubbles: the same discs repeated at three depths
    float bub = 0.;
    for(int i=0;i<3;i++){ float fi = float(i); vec2 q = R1*(p-par*(.12+fi*.2)*uThick)*2.6+fi*7.31; vec2 id = floor(q), f = fract(q)-.5; vec2 h = h22(id);
      float on = smoothstep(.6,.74,vnoise(id*.23+7.)*.7+vnoise(id*.71+3.)*.3+.04)*step(.58,h.x), br = .018+.1*h.y*h.y*h.y;     // tight clusters, mostly tiny, a few large
      // sub-pixel bubbles melt into a faint haze instead of fattening into dots
      bub += on*(1.-smoothstep(.0,.04+.06*h.y+foot*2.6,length(f-(h-.5)*.72)-br))*(1.-fi*.3)*min(1.,(br+.03)/(.03+foot*4.)); }
    crack += mix(uCrack,uIce,.3)*bub*.3*lod;
    crack *= uCrackAmt*lod;
    }
    // body: clear dark ice, polished reflection
    vec3 light = amb+uSunColor*(.1+.22*ndl);
    float toward = pow(clamp(dot(-V,uSunDir)*.5+.5,0.,1.),2.);
    vec3 body = mix(uDeep, uIce, clamp(milk*uFrost+.08,0.,1.))*light;
    body += uIce*uSunColor*toward*.10*(.3+milk);
    body += crack*light*(.6+1.2*toward)+uGlow*(veil*.6+milk*.15);
    vec3 R = reflect(-V,N); R.y = abs(R.y);
    float F = .025+.975*pow5(1.-ndv);
    float alpha = uRough+.05*cloud2;
    vec3 ic = mix(body, kitSky(normalize(R+vec3(0.,alpha,0.))), F*(1.-.25*milk));
    ic += kitSunSpec(N,V,alpha,4.)*(1.-.6*milk);
    col = mix(ic, col, snow);
  }
  gl_FragColor = vec4(col,1.);
  #include <fog_fragment>
}`;

// Frozen surface with deep parallax cracks, milky inclusions and drifted snow. opts as makeLake plus
// { endless, ice, deep, crackColor, snowColor, snow, crackScale, thickness, frost, cracks, glow }
export function makeIce(opts = {}) {
  const endless = !!opts.endless, radius = opts.radius ?? (endless ? 3600 : 120), L = factoryLight(opts);
  const uniforms = {
    ...fogUniforms(), ...lightUniforms(L),
    uIce: { value: toCol(opts.ice, '#9fdcf0') }, uDeep: { value: toCol(opts.deep, '#06324f') }, uCrack: { value: toCol(opts.crackColor, '#e8f8ff') },
    uSnow: { value: toCol(opts.snowColor, '#eef3f8') }, uGlow: { value: toCol(opts.glow, '#000000') },
    uScale: { value: opts.crackScale ?? 7 }, uThick: { value: opts.thickness ?? 1 }, uSnowAmt: { value: opts.snow ?? 0.38 }, uRough: { value: opts.roughness ?? 0.09 },
    uCrackAmt: { value: opts.cracks ?? 1 }, uFrost: { value: opts.frost ?? 1 },
  };
  let geometry = opts.geometry;
  if (!geometry) {
    if (endless) { geometry = radialGrid(radius, 24, 48, 6).geometry; const n = geometry.attributes.position.count; geometry.setAttribute('aDepth', new THREE.BufferAttribute(new Float32Array(n).fill(50), 1)); geometry.setAttribute('aShore', new THREE.BufferAttribute(new Float32Array(n).fill(500), 1)); }
    else geometry = surfaceGeometry({ ...opts, radius }, opts.shoreSlope ?? 0.12, 56);
  } else ensureShore(geometry, opts.shoreSlope ?? 0.12);
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: FLAT_VERT, fragmentShader: ICE_FRAG, fog: true });
  const object = new THREE.Mesh(geometry, material); object.position.y = opts.level ?? 0; object.name = 'kit-ice';
  if (endless) { object.frustumCulled = false; object.renderOrder = opts.renderOrder ?? 1; }
  return { object, material, uniforms, light: L, level: opts.level ?? 0, heightAt: () => opts.level ?? 0,
    setLight: (light, over) => { L.set(light, over); },
    update(dt, time, camera) { uniforms.uTime.value = time; if (endless && camera) { object.position.x = camera.position.x; object.position.z = camera.position.z; } } };
}

// ================================================================== RIVER
const RIVER_VERT = /* glsl */`
attribute vec3 aSide; attribute vec3 aFlow;   // aFlow = (slope, half width, 0)
uniform float uTime, uBow, uChop;
varying vec3 vWorld, vSide; varying vec2 vUv; varying vec2 vFlow; varying vec3 vPixK;
#include <fog_pars_vertex>
void main(){
  vec3 pos = position; float a = uv.x, s = uv.y, x = a*aFlow.y, mid = 1.-a*a, rapid = smoothstep(.03,.28,aFlow.x);
  // crowned cross-section; standing waves on fast water stay put while the flow runs through them
  pos.y += uBow*mid+uChop*mid*(.2+rapid)*(sin(s*1.1+abs(x)*.9+sin(x*.7)*1.3)*.5+sin(s*2.3-x*1.7+1.3)*.3+sin(s*.37+x*.5+uTime*.6)*.2);
  vec4 wp = modelMatrix*vec4(pos,1.); vWorld = wp.xyz; vUv = uv; vFlow = aFlow.xy;
  vSide = normalize(mat3(modelMatrix)*aSide);
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;
const RIVER_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uDeep, uShallow, uFoamColor, uWet;
uniform float uSpeed, uFoam, uBankFoam, uRough, uRipple, uOpacity, uLen, uBankFade;
varying vec3 vWorld, vSide; varying vec2 vUv; varying vec2 vFlow;
${GLSL_FOG_FRAG}
// Flowing detail in (across, along) metres: streamlines drawn out 12:1, surges, fine fibres.
// Returns (foam driver 0..1, d/across, d/along, fibre lines).
vec4 flowTex(vec2 q){
  q.x += .6*sin(q.y*.11+1.7)+.25*sin(q.y*.31);                            // the streaks meander
  vec3 a = noised(vec2(q.x*1.5, q.y*.13));
  vec3 b = noised(vec2(q.x*.9+a.x*1.2, q.y*.11)+7.3);
  vec3 c = noised(vec2(q.x*4.2+b.x*1.5, q.y*.38)+3.1);
  float la = 1.-abs(2.*a.x-1.), lc = 1.-abs(2.*c.x-1.);
  return vec4(a.x*.4+b.x*.38+c.x*.22, a.y*.63+b.y*.34+c.y*.7, a.z*.055+b.z*.045+c.z*.09, la*la*la*.6+lc*lc*lc*.4); }
void main(){
  float a = vUv.x, s = vUv.y, hw = vFlow.y, slope = vFlow.x, x = a*hw;
  vec3 toCam = cameraPosition-vWorld; float dist = length(toCam); vec3 V = toCam/dist;
  float foot = dist*kitPix()/max(abs(V.y),.05), lod = smoothstep(.5,3.,.5/foot), aa = clamp(foot*.8,.015,.3);
  float rapid = smoothstep(.03,.28,slope);
  // white water: a lot of foam on a fast current. Exactly 0 for foam <= .7 or speed <= 4.4, and every term it scales is
  // then left as it was, so calmer rivers are untouched.
  float wild = smoothstep(.7,.8,uFoam)*smoothstep(4.4,5.6,uSpeed);
  float v = uSpeed*(1.-.6*a*a)*(1.+rapid*2.2);                        // fastest mid-stream and on steps
  // two phase-shifted layers hide the shear between fast and slow lanes
  float ph = uTime*.2, p0 = fract(ph), p1 = fract(ph+.5), cyc = 5.;
  vec2 q = vec2(x, s);
  vec4 t0 = flowTex(q-vec2(0.,v*(p0-.5)*cyc+uTime*uSpeed*.35)), t1 = flowTex(q+vec2(13.7,31.1)-vec2(0.,v*(p1-.5)*cyc+uTime*uSpeed*.35));
  vec4 t = mix(t0,t1,abs(1.-2.*p0));
  // the surge field for white water, with the contrast the cross-fade takes out put back so its bands do not swell and thin every cycle
  float wq = abs(1.-2.*p0), tx = .5+(t.x-.5)*inversesqrt(1.-2.*wq*(1.-wq));
  // standing waves and chevrons: fixed to the bed
  float sp = s*1.25+abs(x)*.95+2.2*sin(x*.35+s*.07), sq = s*2.6-x*1.9+1.3+1.5*sin(s*.19);
  float stA = (.1+.9*rapid)*.2;
  vec2 st = stA*(vec2(.95*sign(x), 1.25)*cos(sp)*.6+vec2(-1.9,2.6)*cos(sq)*.2);
  vec3 T = normalize(cross(vSide, vec3(0.,1.,0.)));
  vec2 sl = (t.yz*(.35+rapid*.8)+st)*uRipple*lod;
  vec3 N = normalize(vec3(0.,1.,0.)-vSide*sl.x-T*sl.y);
  float ndv = max(dot(N,V),0.), ndl = max(dot(N,uSunDir),0.);
  vec3 R = reflect(-V,N); R.y = abs(R.y);
  vec3 amb = kitAmbient();
  // depth follows a thalweg that swings from bank to bank
  float c0 = (.5*sin(s*.045+1.7)+.2*sin(s*.11+.4))*.6, u = (a-c0)/(a>c0 ? 1.-c0 : 1.+c0), depth = 1.-u*u;
  vec3 body = mix(uShallow,uDeep,smoothstep(0.,.85,depth))*(amb*1.05+uSunColor*(.07+.16*ndl));
  // aerated water is milky: lifted toward the shallow colour everywhere and more under the foam, so the deep channel
  // only shades it and nothing between the foam goes black in a dim light
  body = mix(body, mix(uShallow,uFoamColor,.15)*(amb*1.05+uSunColor*(.07+.16*ndl)), wild*(.22+.38*mix(.45,smoothstep(.4,.62,tx),lod)));
  float F = .03+.97*pow5(1.-ndv);
  vec3 col = mix(body, kitSky(R), F);
  // foam: fibrous white water on steep runs, thin lines riding the current, lace in the bank eddies
  float bd = (1.-abs(a))*hw;                                          // metres from the edge
  float wthr = mix(.8,.36,rapid);
  float white = smoothstep(wthr-aa, wthr+aa+.12, t.x+t.w*.22)*smoothstep(.0,.35,rapid);
  float streak = smoothstep(.72-aa,.9+aa,t.w+(t.x-.5)*.6)*uFoam*.55;
  // white water: the fibres above are hard-edged at this opacity, thinner than a pixel and they strobe at this speed.
  // Soft bands that follow the surges (a smooth field) take their place; the filter widens unevenly so that their
  // mean cover (.27) is the same at every distance, and they settle on it far away.
  streak = mix(streak, mix(.27,smoothstep(.46-.7*aa,.61+1.3*aa,tx),lod)*uFoam, wild);
  float bank = smoothstep(uBankFade*2.6,uBankFade*.7,bd)*smoothstep(.5-aa,.72+aa,t.x+t.w*.25+(1.-smoothstep(0.,uBankFade*1.2,bd))*.18)*uBankFoam;
  float fm = clamp(white+streak+bank,0.,1.)*(.55+.45*lod);
  float fib = mix(t.w, tx*.6, wild);                                 // white water: sheen and foam shade follow the surges, not the fibres
  col += kitSunSpec(N,V,uRough+.06+.05*rapid+.04*(1.-lod)+.08*wild,6.)*(1.-fm)*(.45+.6*fib);      // a sheen along the current, not salt-and-pepper glints
  col = mix(col, uFoamColor*(amb*.9+uSunColor*(.05+.2*mix(ndl,uSunDir.y,.5)))*(.74+.3*fib), fm);
  // banks: the sheet thins over a metre of wet margin instead of ending in a cut line
  float edge = smoothstep(0.,uBankFade,bd+(t.x-.5)*.5*uBankFade);
  col = mix(uWet*amb, col, smoothstep(.15,.9,edge));
  float al = edge*smoothstep(0.,6.,s)*smoothstep(0.,3.,uLen-s);
  al *= mix(uOpacity,1.,max(max(F,fm),max(smoothstep(0.,.7,depth)*.8,wild*.8)))*mix(.75,1.,smoothstep(.15,.9,edge));
  gl_FragColor = vec4(col,al);
  #include <fog_fragment>
}`;

// Ribbon of flowing water along a curve. opts: { rng, points | curve, width, segments, across, speed, light | sky, deep, shallow, foam }
// foam 0..1 scales the thin foam lines that ride the current; speed is in m/s. foam above 0.7 together with speed above 4.4
// (in full from foam 0.8 and speed 5.6) is white water: soft bands of foam over aerated, milky water in place of the lines.
export function makeRiver(opts = {}) {
  const pts = (opts.points || [[-60, 0, 0], [-20, 0, 14], [20, 0, -10], [60, 0, 4]]).map((p) => (p.isVector3 ? p.clone() : new THREE.Vector3(p[0], p[1], p[2])));
  const curve = opts.curve || new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const length = curve.getLength();
  const n = opts.segments ?? Math.min(500, Math.max(8, Math.round(length / 1.6))), m = opts.across ?? 10;
  const widthAt = typeof opts.width === 'function' ? opts.width : () => opts.width ?? 14;
  const pos = [], uvs = [], side = [], flow = [], idx = [];
  const P = new THREE.Vector3(), T = new THREE.Vector3(), S = new THREE.Vector3();
  for (let i = 0; i <= n; i++) {
    const t = i / n; curve.getPointAt(t, P); curve.getTangentAt(t, T);
    const slope = Math.max(0, -T.y) / Math.max(0.2, Math.hypot(T.x, T.z));
    S.set(-T.z, 0, T.x).normalize();
    const hw = widthAt(t) * 0.5;
    for (let j = 0; j <= m; j++) {
      const a = (j / m) * 2 - 1;
      pos.push(P.x + S.x * hw * a, P.y + (opts.lift ?? 0), P.z + S.z * hw * a); uvs.push(a, t * length);
      side.push(S.x, 0, S.z); flow.push(slope, hw, 0);
    }
    if (i < n) for (let j = 0; j < m; j++) { const a0 = i * (m + 1) + j, b0 = a0 + m + 1; idx.push(a0, a0 + 1, b0, a0 + 1, b0 + 1, b0); }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 3)); geometry.setAttribute('aFlow', new THREE.Float32BufferAttribute(flow, 3));
  geometry.setIndex(idx); geometry.computeBoundingSphere();
  const L = factoryLight(opts);
  const uniforms = {
    ...fogUniforms(), ...lightUniforms(L),
    uDeep: { value: toCol(opts.deep, '#0b4c5c') }, uShallow: { value: toCol(opts.shallow, '#62b8b0') }, uFoamColor: { value: toCol(opts.foamColor, '#f2f7fa') }, uWet: { value: toCol(opts.wetColor, '#2c2a26') },
    uSpeed: { value: opts.speed ?? 3 }, uFoam: { value: opts.foam ?? 0.6 }, uBankFoam: { value: opts.bankFoam ?? 0.8 }, uRough: { value: opts.roughness ?? 0.03 },
    uRipple: { value: opts.ripple ?? 1 }, uOpacity: { value: opts.opacity ?? 0.55 }, uLen: { value: length }, uBankFade: { value: opts.bankFade ?? 1.2 },
    uBow: { value: opts.bow ?? 0.05 }, uChop: { value: opts.chop ?? 0.1 },
  };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: RIVER_VERT, fragmentShader: RIVER_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const object = new THREE.Mesh(geometry, material); object.name = 'kit-river';
  return { object, material, uniforms, light: L, curve, length,
    sampleAt(t, out = {}) { out.position = curve.getPointAt(t, out.position || new THREE.Vector3()); out.tangent = curve.getTangentAt(t, out.tangent || new THREE.Vector3()); out.width = widthAt(t); return out; },
    setLight: (light, over) => { L.set(light, over); }, update(dt, time) { uniforms.uTime.value = time; } };
}

// ================================================================== WATERFALL
const FALL_VERT = /* glsl */`
attribute vec3 aFall;   // (seconds since the lip, layer, edge 0..1)
varying vec3 vWorld, vFace; varying vec2 vUv; varying vec3 vFall; varying vec3 vPixK;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix*vec4(position,1.); vWorld = wp.xyz; vUv = uv; vFall = aFall; vFace = normalize(mat3(modelMatrix)*normal);
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;
const FALL_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uColor, uTint; uniform float uSpeed, uGlowAmt, uDensity, uHeight;
varying vec3 vWorld, vFace; varying vec2 vUv; varying vec3 vFall;
${GLSL_FOG_FRAG}
void main(){
  float x = vUv.x, tau = vUv.y, layer = vFall.y, veil = step(8.5,layer), lx = x+layer*17.3;
  vec3 toCam = cameraPosition-vWorld; float dist = length(toCam); vec3 V = toCam/dist;
  float fine = smoothstep(.5,2.5,.12*max(abs(dot(V,normalize(vFace))),.2)/(dist*kitPix()));
  // z is constant for a parcel of water, so every feature stretches as it accelerates down the fall
  float z = vFall.x-uTime*uSpeed*.62+max(tau,0.)*.4;       // (negative on the lip: the river arriving at the brink)
  float a = fbm2(vec2(lx*.33, z*.75+layer*3.));                                  // surges
  float b = noised(vec2(lx*1.3+a*1.6, z*1.9+layer*7.)).x;                        // strands
  float f1 = 1.-abs(2.*vnoise(vec2(lx*6.+b*2.4, z*2.4+layer*5.))-1.);            // filaments: thin white cores
  float f2 = 1.-abs(2.*vnoise(vec2(lx*17.+a*4., z*3.7+layer*9.))-1.);
  float fil = f1*f1*f1*.7+f2*f2*f2*.5*fine;
  vec2 hc = kitCell4(vec2(lx*.95+a, z*1.25+layer*2.));                            // comet heads leading the strands
  float head = smoothstep(.36,.04,length(vec2(hc.x, hc.x*.3)))*smoothstep(.1,.45,tau);
  float dens = a*.5+b*.4+fil*.2+head*.28+(1.-vFall.z)*.13*(1.-layer*.3);         // fuller down the middle
  float aer = smoothstep(-.005,.2,tau);                       // glassy at the lip, white once it breaks up
  float ragged = vFall.z+(a-.5)*.6+(b-.5)*.35;
  float edge = 1.-smoothstep(.58,1.,ragged);
  float thin = tau*(.17+.1*layer)-uDensity*.2;                // sheets tear open lower down
  float body = smoothstep(.42+thin, .62+thin, dens)*edge;
  float core = smoothstep(.55,.95,dens+fil*.5);
  float lipA = (1.-smoothstep(.7,1.,vFall.z))*smoothstep(-.03,-.008,tau);
  float al = mix(lipA*.92, body*mix(.5+.5*core, .62+.38*core, 1.-fine), aer)*(1.-smoothstep(.93,1.,tau)*.6);
  vec3 N = normalize(vFace+vec3((b-.5)*1.1,.25,(fil-.4)*.5)); if(dot(N,V)<0.) N = -N;
  vec3 amb = kitAmbient(); float ndl = dot(N,uSunDir)*.5+.5;
  float back = pow(clamp(dot(-V,uSunDir)*.5+.5,0.,1.),2.5);
  // thick strands are white and self-shadowed, thin spray lets the sun through
  vec3 lit = amb*(.62+.3*core)+uSunColor*(.04+.17*ndl*ndl*(.45+.55*core)+uGlowAmt*.26*back*(1.-.7*core));
  vec3 up = vec3(0.,1.,0.); float Fl = .03+.97*pow5(1.-max(V.y,0.));
  vec3 glass = mix(uTint*(amb*1.05+uSunColor*.12), kitSky(reflect(-V,up)), Fl);        // the lip is the feeding water bending over the brink
  vec3 col = mix(glass, mix(mix(uTint,uColor,.55),uColor,core)*lit*(.72+.28*core), aer);
  col += uSunColor*uSkyQ.z*uGlowAmt*pow(core,3.)*smoothstep(.55,.95,fil)*.3*ndl;       // sunlit sparkle on the thickest strands
  // spray veil: a wide soft curtain around the sheets
  float va = fbm2(vec2(x*.35+3., z*1.1))*fbm2(vec2(x*1.3, z*2.3+9.));
  float vAl = smoothstep(.1,.5,va)*(1.-smoothstep(.3,1.,vFall.z))*smoothstep(.03,.4,tau)*(1.-smoothstep(.85,1.,tau)*.5)*.3;
  vec3 vCol = uColor*(amb*.85+uSunColor*(.04+uGlowAmt*.26*back));
  col = mix(col, vCol, veil); al = mix(al, vAl, veil);
  gl_FragColor = vec4(col, clamp(al,0.,1.));
  #include <fog_fragment>
}`;
const MIST_VERT = /* glsl */`
attribute vec4 aA, aB;  // aA = (x across, z out, phase, rate)  aB = (size, rise, drift, seed)
uniform float uTime, uRise, uOut, uHeight;
varying vec2 vQ; varying float vLife, vSeed, vKind, vHt; varying vec3 vWorld; varying vec3 vPixK;
#include <fog_pars_vertex>
void main(){
  float life = fract(uTime*aA.w+aA.z); vLife = life; vSeed = aB.w; vQ = position.xy; vKind = step(.5,aB.y);
  float e = 1.-(1.-life)*(1.-life);
  float sz = aB.x*(.45+.8*e), sy = sz*mix(1.5,1.,vKind);                    // the boil at the foot is drawn out upward
  // waterfall-local: x across, z outward. Boil hugs the foot, clouds billow up and out.
  vec3 c = vec3(aA.x*(1.+e*.7)+sin(uTime*.3+aB.w*20.)*e*1.4, -uHeight+uRise*aB.y*e+sy*.3, uOut+aA.y+e*aB.z);
  vHt = c.y+uHeight+position.y*sy;
  vec4 mvPosition = modelViewMatrix*vec4(c,1.); mvPosition.xy += position.xy*vec2(sz,sy);
  vWorld = (modelMatrix*vec4(c,1.)).xyz; gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;
const MIST_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uColor; uniform float uOpacity, uRainbow, uGlowAmt, uCut;
varying vec2 vQ; varying float vLife, vSeed, vKind, vHt; varying vec3 vWorld;
${GLSL_FOG_FRAG}
void main(){
  float r = length(vQ); if(r>1.) discard;
  float n = fbm3(vQ*1.5+vSeed*37.+vec2(0.,-uTime*.18));
  float puff = 1.-smoothstep(.0,1.,r+(n-.42)*1.15);
  float al = puff*puff*sin(vLife*3.14159)*uOpacity*mix(1.5,.75,vKind)*smoothstep(-.2,uCut,vHt);       // dissolves into the pool instead of slicing it
  vec3 d = normalize(vWorld-cameraPosition);
  float back = pow(clamp(dot(d,uSunDir)*.5+.5,0.,1.),3.);
  vec3 col = uColor*(kitAmbient()*(.95+.3*n)+uSunColor*(.03+uGlowAmt*.1*back));       // lit by the sky: white, never sun-coloured mud
  // rainbow in the spray, 42 degrees around the antisolar point
  float th = acos(clamp(dot(d,-uSunDir),-1.,1.)); float k = (th-.733)/.034;
  vec3 bow = clamp(vec3(1.-abs(k-.65)*1.2, 1.-abs(k)*1.2, 1.-abs(k+.65)*1.2),0.,1.);
  col += bow*bow*uSunColor*uSkyQ.z*uRainbow*.4*step(0.,uSunDir.y);
  #ifdef USE_FOG
    col = mix(col, fogColor, kitFog());
  #endif
  gl_FragColor = vec4(col, al);
}`;
const POOL_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uColor; varying vec3 vWorld; varying vec2 vUv; varying vec3 vFall;
${GLSL_FOG_FRAG}
void main(){
  vec2 q = vUv*2.-1.; float r = length(q*vec2(1.,1.25)-vec2(0.,-.1));
  float foot = length(cameraPosition-vWorld)*kitPix()*2.;
  vec2 fp = vWorld.xz-normalize(q+.001)*uTime*.8;                       // churned foam spreading from the impact
  float ring = .5+.5*sin(r*15.-uTime*2.4+vnoise(vWorld.xz*.5)*5.);
  float m = clamp(smoothstep(1.,.12,r)*(.55+.75*fbm2(fp*.35))+ring*.12*r,0.,1.);
  float fm = max(kitLace(fp*.5, m, foot*.5), kitLace(mat2(.8,.6,-.6,.8)*fp*1.6, m*.9, foot*1.6));
  vec3 col = uColor*(kitAmbient()*.9+uSunColor*(.05+.2*uSunDir.y))*(.8+.25*vnoise(fp*2.7));
  gl_FragColor = vec4(col, fm*(1.-smoothstep(.75,1.,r)));
  #include <fog_fragment>
}`;

// Tall falling sheets with mist and a churned pool. opts: { rng, top:[x,y,z], height, width, dir, launch, layers, light | sky, tint, mist, pool }
export function makeWaterfall(opts = {}) {
  const rng = kitRng(opts, 'waterfall');
  const H = opts.height ?? 60, Wd = opts.width ?? 14, layers = opts.layers ?? 3, launch = opts.launch ?? 2.6;
  const top = toV3(opts.top, [0, H, 0]);
  const d = opts.dir ? (opts.dir.isVector3 ? opts.dir : new THREE.Vector3(opts.dir[0], 0, opts.dir.length > 2 ? opts.dir[2] : opts.dir[1])) : new THREE.Vector3(0, 0, 1);
  const dir = new THREE.Vector3(d.x, 0, d.z).normalize();
  const L = factoryLight(opts), lu = lightUniforms(L), fu = fogUniforms();
  // sheets: one merged mesh, each layer a grid following the ballistic curve; the first rows are the lip, upstream of the brink
  const nx = 12, ny = opts.rows ?? 28, lip = 3, lipLen = opts.lipLength ?? 3;
  const pos = [], nor = [], uvs = [], fall = [], idx = [];
  const tEnd = Math.sqrt((2 * H) / GRAV);
  const WF = [1, 0.6, 0.4, 0.5, 0.3], XO = [0, -0.2, 0.26, 0.33, -0.36];
  for (let l = 0; l <= layers; l++) {
    const veil = l === layers;                                  // last grid is the wide spray veil
    const w = Wd * 0.5 * (veil ? 1.7 : WF[l % 5]), zo = veil ? 1.4 : l * 0.55, xo = veil || l === 0 ? 0 : XO[l % 5] * Wd * rng.range(0.7, 1.2), base = pos.length / 3;
    for (let j = 0; j <= ny + lip; j++) {
      const up = j < lip ? (j - lip) / lip : 0, tau = j < lip ? up * 0.03 : Math.pow((j - lip) / ny, 1.35);
      const drop = Math.max(0, tau) * H, tf = Math.sqrt((2 * drop) / GRAV);
      const z = (j < lip ? up * lipLen : launch * tf * (1 + (veil ? 0.3 : l * 0.16))) + (j < lip ? zo * (1 + up) : zo), spreadW = 1 + (veil ? 0.5 : 0.3) * Math.max(0, tau);
      const slope = tau <= 0 ? 0 : (launch / Math.max(0.4, GRAV * tf));           // dz/dy of the arc
      for (let i = 0; i <= nx; i++) {
        const a = (i / nx) * 2 - 1, bow = (1 - a * a) * 0.6;
        pos.push(a * w * spreadW + xo, -drop + (j < lip ? 0.04 * (1 + up) : 0), z + bow * (j < lip ? 1 + up : 1));
        nor.push(0, slope > 0 ? Math.min(0.6, slope) : 1, tau <= 0 ? 0.2 : 1);
        uvs.push(a * w + xo, tau); fall.push(tau < 0 ? (up * lipLen) / 3 : tf, veil ? 9 : l, Math.abs(a));
      }
      if (j < ny + lip) for (let i = 0; i < nx; i++) { const a0 = base + j * (nx + 1) + i, b0 = a0 + nx + 1; idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setAttribute('aFall', new THREE.Float32BufferAttribute(fall, 3)); geo.setIndex(idx);
  const uniforms = { ...fu, ...lu, uColor: { value: toCol(opts.color, '#eef6fb') }, uTint: { value: toCol(opts.tint, '#0f5464') },
    uSpeed: { value: opts.speed ?? 1 }, uGlowAmt: { value: opts.glow ?? 1 }, uDensity: { value: opts.density ?? 0.5 }, uHeight: { value: H } };
  const sheetMat = new THREE.ShaderMaterial({ uniforms, vertexShader: FALL_VERT, fragmentShader: FALL_FRAG, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const sheets = new THREE.Mesh(geo, sheetMat); sheets.name = 'kit-waterfall-sheets'; sheets.renderOrder = 2;
  const object = new THREE.Group(); object.name = 'kit-waterfall';
  object.position.copy(top); object.rotation.y = Math.atan2(dir.x, dir.z); object.add(sheets);
  const out = launch * tEnd, basePos = new THREE.Vector3(top.x + dir.x * out, top.y - H, top.z + dir.z * out);
  let mist = null, pool = null;
  if (opts.pool !== false) {
    const pr = Wd * (opts.poolSize ?? 1.5);
    const pg = new THREE.PlaneGeometry(pr * 2, pr * 2, 1, 1); pg.rotateX(-Math.PI / 2);
    pg.setAttribute('aFall', new THREE.BufferAttribute(new Float32Array(12), 3));
    pool = new THREE.Mesh(pg, new THREE.ShaderMaterial({ uniforms: { ...fu, ...lu, uTime: uniforms.uTime, uColor: uniforms.uColor }, vertexShader: FALL_VERT, fragmentShader: POOL_FRAG, fog: true, transparent: true, depthWrite: false }));
    pool.position.set(0, -H + (opts.poolLift ?? 0.08), out + pr * 0.2); pool.renderOrder = 1; pool.name = 'kit-waterfall-pool'; object.add(pool);
  }
  if (opts.mist !== false) {
    const count = opts.mistCount ?? 220, mr = rng.fork('mist');
    const mg = spriteGeometry(count, (i, a, b) => {
      const boil = i % 5 < 3;                                   // dense boil at the foot / slow billowing clouds
      a[0] = mr.range(-0.55, 0.55) * Wd; a[1] = mr.range(-0.12, 0.22) * Wd; a[2] = mr(); a[3] = boil ? mr.range(0.2, 0.42) : mr.range(0.035, 0.08);
      b[0] = Wd * (boil ? mr.range(0.13, 0.28) : mr.range(0.3, 0.62)); b[1] = boil ? mr.range(0.05, 0.22) : mr.range(0.5, 1); b[2] = (boil ? mr.range(0, 0.3) : mr.range(0.3, 1.5)) * Wd; b[3] = mr();
    });
    const mu = { ...fu, ...lu, uTime: uniforms.uTime, uColor: { value: toCol(opts.mistColor, '#eaf4fb') }, uOpacity: { value: opts.mistOpacity ?? 0.2 }, uRainbow: { value: opts.rainbow ?? 0.5 },
      uGlowAmt: uniforms.uGlowAmt, uRise: { value: opts.mistRise ?? Math.min(H * 0.45, Wd * 2.2) }, uOut: { value: out }, uHeight: uniforms.uHeight, uCut: { value: opts.mistCut ?? Wd * 0.09 } };
    mist = new THREE.Mesh(mg, new THREE.ShaderMaterial({ uniforms: mu, vertexShader: MIST_VERT, fragmentShader: MIST_FRAG, fog: true, transparent: true, depthWrite: false }));
    mist.frustumCulled = false; mist.renderOrder = 3; mist.name = 'kit-waterfall-mist';
    object.add(mist);
  }
  return { object, sheets, mist, pool, uniforms, light: L, base: basePos, top, height: H,
    setLight: (light, over) => { L.set(light, over); }, update(dt, time) { uniforms.uTime.value = time; } };
}

// ================================================================== UNDERWATER
// caustic light network (after David Hoskins' tileable water caustic), two drifting layers
const GLSL_CAUSTIC = /* glsl */`
uniform float uCausTime, uCausScale, uCausSurf, uCausInt, uCausFade; uniform vec3 uCausDir, uCausColor;
float kitCausLayer(vec2 uv, float t){ vec2 p = mod(uv*6.2831853,6.2831853)-250.; vec2 i = p; float c = 1.;
  for(int n=0;n<3;n++){ float tt = t*(1.-3.5/float(n+1)); i = p+vec2(cos(tt-i.x)+sin(tt+i.y), sin(tt-i.y)+cos(tt+i.x));
    c += 1./length(vec2(p.x/(sin(i.x+tt)/.005), p.y/(cos(i.y+tt)/.005))); }
  c = 1.17-pow(c/3.,1.4); return pow(abs(c),6.5); }
// light arriving at world point P with world normal N (zero above the surface)
vec3 kitCaustics(vec3 P, vec3 N){
  float depth = uCausSurf-P.y; if(depth<=0.) return vec3(0.);
  vec2 uv = (P.xz-uCausDir.xz/uCausDir.y*(P.y-uCausSurf))/uCausScale;
  float a = kitCausLayer(uv, uCausTime), b = kitCausLayer(uv*mat2(.8,.6,-.6,.8)*.73+.37, uCausTime*.83+4.);
  float c = min(a,b)*2.4+a*b*1.4+(a+b)*.07;                       // bright where the two nets cross: a web, not dapples
  float facing = clamp(dot(N,-uCausDir)*1.2+.25,0.,1.);
  vec3 tint = mix(uCausColor, vec3(1.), clamp(c*.5,0.,1.));
  return tint*c*uCausInt*facing*smoothstep(0.,1.5,depth)*exp(-depth*uCausFade);
}`;
const UW_SURF_VERT = /* glsl */`
varying vec3 vWorld; varying vec3 vPixK;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix*vec4(position,1.); vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;
const UW_SURF_FRAG = /* glsl */`
${GLSL_COMMON}
uniform float uChop;
varying vec3 vWorld;
${GLSL_FOG_FRAG}
${GLSL_UNDERSIDE}
const mat2 R1 = mat2(.7986,.6018,-.6018,.7986), R2 = mat2(-.3256,.9455,-.9455,-.3256);
void main(){
  if(cameraPosition.y>vWorld.y) discard;
  vec3 D = vWorld-cameraPosition; float dist = length(D); D /= dist;
  vec2 p = vWorld.xz; float foot = dist*kitPix()/max(abs(D.y),.05);
  float l2 = smoothstep(.6,3.,2.7/foot), l3 = smoothstep(.6,3.,.9/foot), l4 = smoothstep(.6,3.,.3/foot);
  vec3 n1 = noised(R1*p*.11+uTime*vec2(.12,.07)), n2 = noised(R2*p*.37-uTime*vec2(.2,-.13)+n1.x*2.);
  vec3 n3 = noised(R1*p*1.1+uTime*vec2(-.3,.36)+n2.x*2.), n4 = noised(R2*p*3.3+uTime*vec2(.5,.4)+n3.x);
  vec2 sl = uChop*((n1.yz*R1)*.2+(n2.yz*R2)*.18*l2+(n3.yz*R1)*.13*l3+(n4.yz*R2)*.1*l4);
  vec3 N = normalize(vec3(sl.x,-1.,sl.y));
  float net = pow(1.-abs(n2.x*2.-1.),3.)*.6*l2+pow(1.-abs(n3.x*2.-1.),4.)*.5*l3;
  vec3 col = kitUnderside(D, N, dist, net);
  col = mix(col, uUwWater, max(smoothstep(0.,.8,kitFog()), 1.-smoothstep(0.,.09,abs(D.y))));          // no bright seam where the mirror meets the murk
  gl_FragColor = vec4(col,1.);
  #include <fog_fragment>
}`;
const RAY_VERT = /* glsl */`
attribute vec4 aA, aB;  // aA = (x, z, length, width)  aB = (phase, rate, intensity, seed)
uniform float uTime, uRange, uSurf; uniform vec3 uRayDir;
varying vec2 vQ; varying float vI, vSeed; varying vec3 vPixK;
#include <fog_pars_vertex>
void main(){
  vec2 home = aA.xy+3.5*sin(uTime*.06+aB.w*vec2(40.,71.));                       // shafts wander slowly
  vec2 c = mod(home-cameraPosition.xz+uRange*.5,uRange)-uRange*.5;
  float along = position.y*.5+.5;
  vec3 top = vec3(c.x+cameraPosition.x,uSurf,c.y+cameraPosition.z);
  vec3 mid = top+uRayDir*aA.z*.5;
  vec3 side = normalize(cross(uRayDir, cameraPosition-mid));
  vec3 wp = top+uRayDir*(aA.z*along)+side*(position.x*aA.w*(.45+1.1*along));
  float dxz = length(c)/(uRange*.5);
  float flick = .6+.4*sin(uTime*aB.y+aB.x*6.2831)*sin(uTime*aB.y*.37+aB.w*40.);
  float near = smoothstep(1.5,10.,length(cross(cameraPosition-top,uRayDir)));
  vI = aB.z*flick*(1.-smoothstep(.6,1.,dxz))*near*smoothstep(0.,6.,uSurf-cameraPosition.y+4.);
  vQ = vec2(position.x,along); vSeed = aB.w;
  vec4 mvPosition = viewMatrix*vec4(wp,1.); gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;
const RAY_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uRayColor;
varying vec2 vQ; varying float vI, vSeed;
${GLSL_FOG_FRAG}
void main(){
  // two or three soft lobes that slide across the shaft, so no two shafts are the same bar
  float x = vQ.x, t = uTime;
  float a = (x-.42*sin(t*.31+vSeed*9.))/.34, b = (x+.5*cos(t*.23+vSeed*17.))/.2, c = (x-.6*sin(t*.17+vSeed*29.))/.13;
  float prof = (exp(-a*a)+.7*exp(-b*b)+.45*exp(-c*c)*step(.4,vSeed))*(1.-x*x)*(1.-x*x);
  float len = smoothstep(0.,.16,vQ.y)*pow(clamp(1.-vQ.y,0.,1.),2.4);                       // tops melt into the surface glow
  gl_FragColor = vec4(uRayColor*prof*len*vI*(1.-kitFog()),1.);
}`;
const SPECK_VERT = /* glsl */`
attribute vec4 aA, aB;  // aA = (pos xyz, size)  aB = (drift xyz, seed)
uniform float uTime, uRange, uSurf;
varying vec2 vQ; varying float vI, vSeed; varying vec3 vPixK;
#include <fog_pars_vertex>
void main(){
  vec3 p = aA.xyz+aB.xyz*uTime; p.xz += .35*sin(uTime*.5+aB.w*vec2(31.,57.));
  vec3 c = mod(p-cameraPosition+uRange*.5,uRange)-uRange*.5; float d = length(c);
  vec3 w = c+cameraPosition;
  vec4 mvPosition = viewMatrix*vec4(w,1.); mvPosition.xy += position.xy*aA.w;
  vI = (1.-smoothstep(.3,.5,d/uRange))*smoothstep(.4,2.,d)*smoothstep(0.,.6,uSurf-w.y)*(.55+.45*sin(uTime*(1.+aB.w*2.)+aB.w*90.));
  vQ = position.xy; vSeed = aB.w;
  gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;
const SPECK_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uSpeck, uSpeckGlow; uniform float uGlowFrac;
varying vec2 vQ; varying float vI, vSeed;
${GLSL_FOG_FRAG}
void main(){
  float r = dot(vQ,vQ); if(r>1.) discard;
  float core = exp(-r*5.);
  vec3 lit = uSpeck*(kitAmbient()*.8+uSunColor*.22);
  vec3 col = mix(lit, uSpeckGlow, step(1.-uGlowFrac,vSeed));
  gl_FragColor = vec4(col*core*vI*(1.-kitFog()),1.);
}`;
const BUBBLE_VERT = /* glsl */`
attribute vec4 aA, aB;  // aA = (source xyz, size)  aB = (phase, speed, wobble, seed)
uniform float uTime, uSurf;
varying vec2 vQ; varying float vI; varying vec3 vPixK;
#include <fog_pars_vertex>
void main(){
  float span = max(uSurf-aA.y,1.); float life = fract(uTime*aB.y/span+aB.x);
  float spread = .25+life*aB.z*2.2;
  vec3 w = aA.xyz+vec3(sin(uTime*2.1+aB.w*40.)*.18+cos(aB.w*17.)*spread, life*span, cos(uTime*1.7+aB.w*23.)*.18+sin(aB.w*29.)*spread);
  vec4 mvPosition = viewMatrix*vec4(w,1.); mvPosition.xy += position.xy*aA.w*(.6+.9*life);
  vI = smoothstep(0.,.04,life)*(1.-smoothstep(.93,1.,life));
  vQ = position.xy; gl_Position = projectionMatrix*mvPosition;
  ${GLSL_PIX_VERT}
  #include <fog_vertex>
}`;
const BUBBLE_FRAG = /* glsl */`
${GLSL_COMMON}
uniform vec3 uBubble;
varying vec2 vQ; varying float vI;
${GLSL_FOG_FRAG}
void main(){
  float r = length(vQ); if(r>1.) discard;
  float rim = smoothstep(.5,.95,r)*(1.-smoothstep(.95,1.,r));
  float hi = smoothstep(.34,.0,length(vQ-vec2(-.35,.42)))*1.8+smoothstep(.2,.0,length(vQ-vec2(.3,-.45)))*.5;
  vec3 col = uBubble*(kitAmbient()*.9+uSunColor*.35)*(rim*.9+hi+.07);
  gl_FragColor = vec4(col*vI*(1.-kitFog()),1.);
}`;
const FLOOR_FRAG = /* glsl */`
${GLSL_COMMON}
${GLSL_CAUSTIC}
varying vec3 vWorld;
${GLSL_FOG_FRAG}
void main(){ vec3 c = kitCaustics(vWorld, vec3(0.,1.,0.))*uSunColor*.3;
  gl_FragColor = vec4(c*(1.-kitFog()),1.); }`;
// Waterline: while the eye crosses the surface the near plane cuts a hole in it; this fills the hole with the
// medium on the other side and draws the meniscus, so the crossing reads as a wipe instead of a glitch.
const LINE_VERT = /* glsl */`
varying vec3 vRay; varying vec3 vPixK;
void main(){ gl_Position = vec4(position.xy,0.,1.);
  vec4 v = inverse(projectionMatrix)*vec4(position.xy,-1.,1.); vRay = transpose(mat3(viewMatrix))*(v.xyz/v.w);
  vPixK = vec3(position.y, 1., 1./projectionMatrix[1][1]); }`;
const LINE_FRAG = /* glsl */`
${GLSL_COMMON}
uniform float uSurfH, uNearD; uniform vec3 uUwWater;
varying vec3 vRay;
void main(){
  vec3 d = normalize(vRay); float h = uSurfH-cameraPosition.y;
  float t = h/(abs(d.y)>1e-4 ? d.y : 1e-4);
  t *= 1.+.12*sin(d.x*23.+uTime*4.)*sin(d.z*31.-uTime*3.);
  if(t<=0.||t>uNearD*1.7) discard;
  float hit = 1.-smoothstep(uNearD*1.2,uNearD*1.7,t), rim = smoothstep(uNearD*.9,uNearD*1.4,t)*hit;
  // looking down into the water, or up at its underside: sky only inside Snell's window, the water volume elsewhere
  vec2 hp = cameraPosition.xz+d.xz*t; float rp = sin(hp.x*7.+uTime*2.1+sin(hp.y*5.-uTime*1.3)*1.4)*sin(hp.y*9.-uTime*1.7);
  vec3 col = mix(uUwWater*(1.05+.22*rp), kitSky(vec3(d.x,abs(d.y),d.z))*.75, h>0. ? smoothstep(.66,.8,d.y) : 0.);
  col += (kitAmbient()*.36+uSunColor*.05)*rim;
  gl_FragColor = vec4(col, hit*.96);
}`;

// Everything for a scene below the surface. opts: { rng, ocean, surfaceY, floorY, light | sky, water, deep, rays, particles, bubbles, caustics, floor }
export function makeUnderwater(opts = {}) {
  const rng = kitRng(opts, 'underwater'), ocean = opts.ocean || null;
  const surfaceY = opts.surfaceY ?? (ocean ? ocean.level : 0), floorY = opts.floorY ?? surfaceY - 45, depth = surfaceY - floorY;
  const L = opts.light == null && opts.sky == null && ocean ? ocean.light : factoryLight(opts);
  const lu = lightUniforms(L), fu = fogUniforms();
  const water = toCol(opts.water, '#0d7fa0'), deep = toCol(opts.deep, '#04283f');
  const wm = Math.max(water.r, water.g, water.b, 1e-4), wr = water.r / wm, wg = water.g / wm, wb = water.b / wm;
  // colour of the water volume under the current light; used for fog, background and the mirror outside Snell's window
  const volume = new THREE.Color(), deepCol = new THREE.Color(), rayDir = new THREE.Vector3(), rayColor = new THREE.Color(), absorb = new THREE.Color();
  const fog = new THREE.FogExp2(0x000000, opts.fogDensity ?? 0.013), background = new THREE.Color();
  const cOpt = opts.caustics || {}, causInt = cOpt.intensity ?? 2.4;
  const causticUniforms = { uCausTime: { value: 0 }, uCausScale: { value: cOpt.scale ?? 7 }, uCausSurf: { value: surfaceY }, uCausInt: { value: causInt },
    uCausFade: { value: cOpt.fade ?? 0.02 }, uCausDir: { value: rayDir }, uCausColor: { value: toCol(cOpt.color, '#7fe8ff') } };
  const refresh = () => {                                    // cheap; runs every update so a shared light can change freely
    const kv = waterVolume(L, water, deep, opts.minBrightness ?? 0.06, volume, deepCol);
    // light direction under water (refracted, pointing down)
    const S = L.sunDir, h = Math.hypot(S.x, S.z), sinT = h / 1.333, cosT = Math.sqrt(1 - sinT * sinT);
    rayDir.set(h > 1e-5 ? (-S.x / h) * sinT : 0, -cosT, h > 1e-5 ? (-S.z / h) * sinT : 0);
    const rk = (Math.max(kv, 0.35) * 0.75 + _lum(L.sunColor) * L.skyQ.z * 0.2) * (opts.rayIntensity ?? 1);
    rayColor.setRGB((wr * 0.7 + 0.3) * rk, (wg * 0.7 + 0.3) * rk, (wb * 0.7 + 0.3) * rk);
    absorb.setRGB(wr * 0.88 + 0.12, wg * 0.88 + 0.12, wb * 0.88 + 0.12);
    causticUniforms.uCausInt.value = causInt * (0.3 + 0.7 * Math.min(1, L.skyQ.z)) * 0.8 / Math.max(S.y, 0.35);     // a low sun still paints the floor
    fog.color.copy(volume); background.copy(volume);
  };
  const object = new THREE.Group(); object.name = 'kit-underwater';
  // --- surface seen from below (with an ocean, the ocean's own waves are shaded from below instead)
  const radius = opts.radius ?? 700;
  let surface = null;
  const uwU = { uUwWater: { value: volume }, uUwDeep: { value: deepCol }, uUwSunDisc: { value: opts.sunDisc ?? 1 } };
  if (ocean) ocean.linkUnderwater(volume, deepCol, opts.sunDisc ?? 1);
  else {
    surface = new THREE.Mesh(radialGrid(radius, 20, 40, 5).geometry, new THREE.ShaderMaterial({ uniforms: { ...fu, ...lu, ...uwU, uChop: { value: opts.chop ?? 1 } }, vertexShader: UW_SURF_VERT, fragmentShader: UW_SURF_FRAG, fog: true, side: THREE.DoubleSide }));
    surface.position.y = surfaceY - 0.02; surface.frustumCulled = false; surface.name = 'kit-underwater-surface'; object.add(surface);
  }
  const add = (geo, vs, fs, uniforms, order) => {
    const m = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: { ...fu, ...lu, ...uniforms }, vertexShader: vs, fragmentShader: fs, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    m.frustumCulled = false; m.renderOrder = order; m.matrixAutoUpdate = false; object.add(m); return m;
  };
  // --- god rays
  const rOpt = opts.rays === false ? { count: 0 } : (opts.rays || {}), rayRange = rOpt.range ?? 260;
  let rays = null;
  if ((rOpt.count ?? 64) > 0) {
    const rr = rng.fork('rays');
    const g = spriteGeometry(rOpt.count ?? 64, (i, a, b) => {
      a[0] = rr.range(0, rayRange); a[1] = rr.range(0, rayRange); a[2] = (rOpt.length ?? Math.min(depth * 1.7, 110)) * rr.range(0.6, 1); a[3] = (rOpt.width ?? 3.2) * rr.range(0.65, 2.8);
      b[0] = rr(); b[1] = rr.range(0.25, 0.8); b[2] = rr.range(0.3, 1) * 0.5; b[3] = rr();
    });
    rays = add(g, RAY_VERT, RAY_FRAG, { uRange: { value: rayRange }, uSurf: { value: surfaceY }, uRayDir: { value: rayDir }, uRayColor: { value: rayColor } }, 4);
    rays.name = 'kit-underwater-rays';
  }
  // --- drifting particles
  const pOpt = opts.particles === false ? { count: 0 } : (opts.particles || {}), pRange = pOpt.range ?? 44;
  let particles = null;
  if ((pOpt.count ?? 700) > 0) {
    const pr = rng.fork('particles');
    const g = spriteGeometry(pOpt.count ?? 700, (i, a, b) => {
      a[0] = pr.range(0, pRange); a[1] = pr.range(0, pRange); a[2] = pr.range(0, pRange); a[3] = (pOpt.size ?? 0.05) * pr.range(0.4, 1.8) * (pr() < 0.05 ? 1.7 : 1);
      b[0] = pr.range(-0.12, 0.12); b[1] = pr.range(-0.1, 0.02); b[2] = pr.range(-0.12, 0.12); b[3] = pr();
    });
    particles = add(g, SPECK_VERT, SPECK_FRAG, { uRange: { value: pRange }, uSurf: { value: surfaceY }, uSpeck: { value: toCol(pOpt.color, '#cfeee6') },
      uSpeckGlow: { value: toCol(pOpt.glowColor, '#5dffd0').multiplyScalar(pOpt.glowIntensity ?? 2.5) }, uGlowFrac: { value: pOpt.glowFraction ?? 0.12 } }, 5);
    particles.name = 'kit-underwater-particles';
  }
  // --- bubble columns
  const bOpt = opts.bubbles === false ? { count: 0 } : (opts.bubbles || {});
  let bubbles = null;
  if ((bOpt.count ?? 160) > 0) {
    const br = rng.fork('bubbles');
    const src = (bOpt.sources || Array.from({ length: bOpt.columns ?? 6 }, () => [br.range(-50, 50), floorY, br.range(-50, 50)])).map((s) => (s.isVector3 ? [s.x, s.y, s.z] : s));
    const g = spriteGeometry(bOpt.count ?? 160, (i, a, b) => {
      const s = src[i % src.length];
      a[0] = s[0]; a[1] = s[1]; a[2] = s[2]; a[3] = (bOpt.size ?? 0.12) * br.range(0.4, 1.7);
      b[0] = br(); b[1] = br.range(1.6, 3.2); b[2] = br.range(0.2, 1); b[3] = br();
    });
    bubbles = add(g, BUBBLE_VERT, BUBBLE_FRAG, { uSurf: { value: surfaceY }, uBubble: { value: toCol(bOpt.color, '#d8f6ff') } }, 6);
    bubbles.name = 'kit-underwater-bubbles';
  }
  // --- optional flat caustic plane for a level sea bed
  let floor = null;
  if (opts.floor) {
    const size = opts.floor.size ?? 500, g = new THREE.PlaneGeometry(size, size); g.rotateX(-Math.PI / 2);
    floor = add(g, UW_SURF_VERT, FLOOR_FRAG, causticUniforms, 1); floor.position.y = (opts.floor.y ?? floorY) + 0.05; floor.name = 'kit-underwater-floor';
  }
  // --- waterline overlay for the moment of crossing
  const lineU = { ...lu, uSurfH: { value: surfaceY }, uNearD: { value: 0.3 }, uUwWater: uwU.uUwWater };
  const waterline = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ uniforms: lineU, vertexShader: LINE_VERT, fragmentShader: LINE_FRAG, transparent: true, depthTest: false, depthWrite: false, fog: false }));
  waterline.frustumCulled = false; waterline.renderOrder = 50; waterline.visible = false; waterline.name = 'kit-underwater-waterline'; object.add(waterline);
  refresh();
  // Add caustic light to any lit three.js material (Standard, Physical, Lambert, Phong, Toon). Returns the material.
  const applyCaustics = (material) => {
    const prev = material.onBeforeCompile, prevKey = material.customProgramCacheKey ? material.customProgramCacheKey() : '';
    material.onBeforeCompile = (shader, renderer) => {
      if (prev) prev.call(material, shader, renderer);
      Object.assign(shader.uniforms, causticUniforms, { uKitSun: lu.uSunColor, uKitAbsorb: { value: absorb }, uKitAbsorbK: { value: opts.absorption ?? 0.09 } });
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vKitWorld;')
        .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 kw = vec4(transformed,1.);\n#ifdef USE_INSTANCING\n kw = instanceMatrix*kw;\n#endif\n vKitWorld = (modelMatrix*kw).xyz; }');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vKitWorld; uniform vec3 uKitSun, uKitAbsorb; uniform float uKitAbsorbK;\n' + GLSL_CAUSTIC)
        .replace('#include <color_fragment>', '#include <color_fragment>\n diffuseColor.rgb *= mix(vec3(1.), uKitAbsorb, 1.-exp(-max(uCausSurf-vKitWorld.y,0.)*uKitAbsorbK));')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb*uKitSun*.3183*kitCaustics(vKitWorld, inverseTransformDirection(normal, viewMatrix));');
    };
    material.customProgramCacheKey = () => prevKey + '|kit-water-caustics';
    material.needsUpdate = true;
    return material;
  };
  const surfaceAt = opts.surfaceAt || (ocean ? ocean.heightAt : () => surfaceY);
  const air = { captured: false, hadFog: false, color: new THREE.Color(), density: 0, near: 1, far: 1000, background: null };
  let lastTime = 0;
  const deep3 = [rays, particles, bubbles, floor];
  return {
    object, surface, rays, particles, bubbles, floor, waterline, fog, background, volumeColor: volume, causticUniforms, applyCaustics, surfaceY, surfaceAt,
    uniforms: lu, light: L, rayDir,
    isSubmerged: (camera) => camera.position.y < surfaceAt(camera.position.x, camera.position.z, lastTime),
    // Per-frame scene switch. Blends scene.fog from air to water as the eye passes the (wavy) surface, swaps the
    // background, shows the kit while submerged and restores the scene's own fog and background above water.
    // `airOpt` = { color, density, background } overrides what was captured on the first call. Returns true when submerged.
    applyTo(scene, camera, airOpt = {}) {
      let f = scene.fog;
      if (!air.captured) { air.captured = true; air.hadFog = !!f; air.background = scene.background; if (f) { air.color.copy(f.color); air.density = f.density ?? 0; air.near = f.near ?? 1; air.far = f.far ?? 1000; } }
      const h = surfaceAt(camera.position.x, camera.position.z, lastTime), d = h - camera.position.y;
      const s = sstep(0, 0.3, d), sub = d > 0;                  // density thickens over the first 30 cm below the surface
      if (!air.hadFog) { scene.fog = sub ? fog : null; f = null; }            // a scene without fog borrows the kit's while submerged
      if (f) {
        f.color.copy(airOpt.color || air.color).lerp(volume, sstep(0, 0.06, d));
        if (f.isFogExp2) { const a = airOpt.density ?? air.density; f.density = a + (fog.density - a) * s; }
        else { f.near = air.near * (1 - s); f.far = air.far + (3 / fog.density - air.far) * s; }
      }
      scene.background = sub ? background : (airOpt.background !== undefined ? airOpt.background : air.background);
      for (const m of deep3) if (m) m.visible = s > 0;
      if (surface) surface.visible = s > 0;
      const near = camera.near ?? 0.3;
      waterline.visible = Math.abs(d) < near * 2.2;
      lineU.uSurfH.value = h; lineU.uNearD.value = near;
      return sub;
    },
    setLight: (light, over) => { L.set(light, over); refresh(); },
    update(dt, time, camera) {
      lastTime = time; lu.uTime.value = time; lineU.uTime.value = time; causticUniforms.uCausTime.value = time * (cOpt.speed ?? 0.55);
      refresh();
      if (camera) { if (surface) { surface.position.x = camera.position.x; surface.position.z = camera.position.z; } if (floor) { floor.position.x = camera.position.x; floor.position.z = camera.position.z; floor.updateMatrix(); } }
    },
  };
}

// ================================================================== SEA = ocean + underwater + the dive between them
// opts: { rng, light | sky, level, ocean: {makeOcean opts}, underwater: {makeUnderwater opts}, hideBelow: [Object3D], air: { color, density, background } }
// update(dt, time, camera, scene) animates both, runs the dive switch on `scene` and hides `hideBelow` (sky dome, clouds) while submerged.
export function makeSea(opts = {}) {
  const L = factoryLight(opts), level = opts.level ?? 0, rng = opts.rng ?? makeRng(hashSeed('kit-water'));
  const ocean = makeOcean({ rng, ...(opts.ocean || {}), light: L, level });
  const underwater = makeUnderwater({ rng, ...(opts.underwater || {}), light: L, ocean, surfaceY: level });
  const object = new THREE.Group(); object.name = 'kit-sea'; object.add(ocean.object, underwater.object);
  const hide = opts.hideBelow || [];
  const sea = {
    object, ocean, underwater, light: L, level, submerged: false, heightAt: ocean.heightAt, normalAt: ocean.normalAt, applyCaustics: underwater.applyCaustics,
    setLight: (light, over) => { L.set(light, over); },
    update(dt, time, camera, scene) {
      ocean.update(dt, time, camera); underwater.update(dt, time, camera);
      if (scene && camera) { sea.submerged = underwater.applyTo(scene, camera, opts.air); for (const o of hide) o.visible = !sea.submerged; if (ocean.spray) ocean.spray.visible = !sea.submerged; }
      return sea.submerged;
    },
  };
  return sea;
}
