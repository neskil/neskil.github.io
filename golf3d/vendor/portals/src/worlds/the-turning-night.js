// THE TURNING NIGHT: an impasto night valley under the Sky Wheel (hero: src/parts/the-turning-night.js).
// World space == hero space: the origin is the far-hill crest under the moon portal, the camera
// flies from +Z toward -Z. The river surface is at y = -78, the valley is laid out along z:
// cypress knoll 1190..1090, wheat 1090..730, river + village 700..370, bridge 353, far hill 310..0.
// Two layers everywhere: opaque painted base meshes (PAINT shader: world-anchored stroke pattern)
// and instanced alpha-tested capsule strokes (STROKE shader) in the hero's own relief/gallery-light style.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { buildHero } from '../parts/the-turning-night.js';

const TAU = Math.PI * 2, RIVER = -78, T14 = Math.tan(14 * Math.PI / 180);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const HEX = { ultra: '#0B1A4A', cobalt: '#2348A8', cer: '#7FB2E5', yel: '#F6D54A', vir: '#1E4E5A', cyp: '#14261E', org: '#F08A24' };

const GLSL_COMMON = /* glsl */`
float tnHash1(float n){ return fract(sin(n*12.9898)*43758.5453); }
float tnProf(float a, float id){ float a2 = a*a; return (1.0-a2*a2)*0.55 + 0.22*cos(a*9.0+id*37.0) + 0.23*smoothstep(0.5,0.9,abs(a)); }
float tnSlope(float a, float id){ return (tnProf(a+0.1,id)-tnProf(a-0.1,id))*5.0; }
vec3 tnGallery(vec3 alb, vec3 emis, vec3 nv, float mask){
  vec3 L = normalize(vec3(-0.6,0.6,0.5));
  float d = clamp(dot(nv,L), 0.0, 1.0);
  float shade = 0.62 + 0.75*d;
  float spec = pow(max(dot(nv, normalize(L+vec3(0.0,0.0,1.0))), 0.0), 40.0)*mask;
  return alb*shade + spec*vec3(0.30,0.36,0.50) + emis*(0.75+0.45*d);
}
// canvas tooth: a weave fixed to the screen (k radians per pixel), so it never swims
float tnWeave(float k){ return 0.93 + 0.07*sin(gl_FragCoord.x*k)*sin(gl_FragCoord.y*k); }`;

// ---------------- instanced strokes ----------------
// aP: xyz centre/base, w kind.  aD: xyz direction*halfLen or parameters, w half width.
// aC: rgb pigment, a emissive.  aX: xyz axis or parameters, w switch (0 always on, s>0 lights when
// uSwitch passes s, s<0 goes dark when uSwitch passes -s).  aH: hash, parameter.
// kinds: 0 static/creeping  1 wheat  2 cypress flame  3 orbiting (olive knots, moths, star rings)
//        4 smoke ribbon  5 lamp reflection dash  6 falling dash (rain, flecks)  7 ring on water
const STROKE_VS = /* glsl */`
attribute vec4 aP, aD, aC, aX; attribute vec2 aH;
uniform float uTime, uSwitch, uDrain, uRain, uRare, uFlame, uMinW;
uniform vec4 uWind; uniform vec2 uFade;
varying vec2 vUv; varying vec4 vCol; varying float vId; varying vec3 vSideV, vAxisV;
#include <fog_pars_vertex>
vec3 flameP(float t, float H, float R, float a0, float hs, vec3 base){
  float r = R*pow(max(1.0-t, 0.0), 0.8)*(0.5+0.5*smoothstep(0.0,0.16,t))*aX.y;
  float an = a0 + aX.z*1.5*t + 0.22*sin(t*9.0 + uTime*1.4 + hs*6.0);
  vec3 p = base + vec3(cos(an)*r, t*H, sin(an)*r);
  float t2 = t*t;
  p.xz += uWind.xy*(0.03 + uWind.w*0.16)*H*t2;
  p.x += sin(uTime*1.7 + t*5.0 + base.x)*0.03*H*t2*t;
  p.z += cos(uTime*1.3 + t*4.0 + base.z)*0.03*H*t2*t;
  return p;
}
vec3 smokeP(float t, float R, float hs, vec3 base){
  vec3 p = base + vec3(0.0, t*R, 0.0);
  p.xz += uWind.xy*t*t*R*(0.35 + 0.9*uWind.z);
  p.x += sin(t*7.0 + hs*6.0 + uTime*0.5)*t*3.5;
  p.z += cos(t*6.0 + hs*9.0 + uTime*0.4)*t*3.5;
  p += uDrain*t*t*vec3(-base.x*0.12, 16.0, -55.0);
  return p;
}
void main(){
  float kind = aP.w, l = position.x, hw = aD.w, hs = aH.x, par = aH.y, sc = 1.0, flatS = 0.0;
  vec3 C = (modelMatrix*vec4(aP.xyz,1.0)).xyz, P, ax, fside = vec3(1.0,0.0,0.0);
  if (kind < 0.5){
    vec3 d = mat3(modelMatrix)*aD.xyz; float hl = max(length(d), 1e-4); ax = d/hl;
    C += ax*sin(uTime*(0.5+hs) + hs*40.0)*par;
    P = C + ax*l*hl;
  } else if (kind < 1.5){
    float w = sin(dot(C.xz, uWind.xy)*0.157 - uTime*1.7 + hs*1.2)*0.5+0.5;
    float g = sin(uTime*2.3 + hs*30.0)*0.07;
    vec2 lean = uWind.xy*(uWind.w*1.6 + uWind.z*(0.15+0.85*w)) + vec2(g,-g);
    vec2 dc = C.xz - cameraPosition.xz; float dd = length(dc);
    lean += dc/max(dd,0.5)*1.3*smoothstep(15.0,3.0,dd)*step(abs(cameraPosition.y-C.y), 14.0);
    float L = max(length(aD.xyz), 1e-3);
    vec3 tip = normalize(aD.xyz + vec3(lean.x,0.0,lean.y)*L)*L;
    ax = tip/L; P = C + tip*(l*0.5+0.5);
  } else if (kind < 2.5){
    float H = aD.z, t = fract(aD.y + uTime*uFlame/H*(0.7+0.6*hs));
    float tt = clamp(t + l*aX.x/H, 0.0, 0.995);
    P = flameP(tt, H, par, aD.x, hs, C);
    ax = normalize(flameP(tt+0.012, H, par, aD.x, hs, C) - P + vec3(0.0,1e-4,0.0));
    sc = smoothstep(0.0,0.05,t)*(1.0-smoothstep(0.88,0.99,t));
  } else if (kind < 3.5){
    vec3 n = normalize(aX.xyz + vec3(1e-4,0.0,0.0));
    vec3 e1 = normalize(cross(n, vec3(0.31,0.87,0.38)) + vec3(0.0,0.0,1e-4)), e2 = cross(n, e1);
    float an = aD.x + uTime*par + l*aD.z, r = aD.y*(1.0 + 0.1*sin(uTime*2.6 + hs*50.0));
    P = C + (e1*cos(an) + e2*sin(an))*r + n*sin(uTime*1.9 + hs*33.0)*r*0.08;
    ax = normalize(e2*cos(an) - e1*sin(an));
  } else if (kind < 4.5){
    float R = aD.z, t = fract(aD.x + uTime*0.055*(0.8+0.4*aD.y)), tt = clamp(t + l*0.045, 0.0, 1.05);
    P = smokeP(tt, R, aD.y, C);
    ax = normalize(smokeP(tt+0.02, R, aD.y, C) - P + vec3(0.0,1e-4,0.0));
    sc = smoothstep(0.0,0.08,t)*(1.0-smoothstep(0.75,1.0,t));
    hw *= 0.6 + 1.0*t;
  } else if (kind < 5.5){
    vec2 dc = cameraPosition.xz - C.xz; float D = max(length(dc), 1.0); vec2 d2 = dc/D;
    float hc = max(cameraPosition.y - C.y, 1.0), s0 = D*aD.z/(aD.z + hc);
    float span = min(par, 0.22*D + 3.0);
    float s = s0 + (aD.x - 0.35)*2.0*span;
    float shv = sin(uTime*(2.0+3.0*hs) + aD.x*23.0);
    P = C + vec3(d2.x,0.0,d2.y)*s;
    ax = vec3(-d2.y, 0.0, d2.x);
    float nearK = clamp((D - s)/45.0, 0.3, 1.0);          // keep the dashes nearest the lens from flooding the frame
    P += ax*(shv*0.25 + l*aD.y*(0.7+0.3*shv)*nearK);
    fside = vec3(d2.x,0.0,d2.y); flatS = 1.0; hw *= (0.55 + 0.03*span)*nearK;
    sc = step(1.0, s)*smoothstep(700.0, 400.0, D);
  } else if (kind < 6.5){
    vec3 box = vec3(140.0, 90.0, 140.0);
    vec3 p = aP.xyz; p.y -= uTime*aD.x; p.xz += uWind.xy*uTime*aD.x*aD.z;
    P = cameraPosition + mod(p - cameraPosition + box*0.5, box) - box*0.5;
    ax = normalize(vec3(uWind.x*aD.z, -1.0, uWind.y*aD.z));
    P += ax*l*aD.y;
    sc = (par < 0.5 ? uRain : uRare)*smoothstep(2.0, 6.0, length(P - cameraPosition));
  } else {
    float t = fract(aD.y + uTime*0.45), r = 0.3 + t*aD.z, an = aD.x;
    vec3 rad = vec3(cos(an), 0.0, sin(an));
    ax = vec3(-rad.z, 0.0, rad.x);
    P = C + rad*r + ax*l*r*0.19;
    fside = rad; flatS = 1.0; sc = uRare*(1.0-t*t)*smoothstep(0.0,0.08,t);
  }
  vec3 toC = cameraPosition - P; float dist = max(length(toC), 1e-3);
  vec3 side = flatS > 0.5 ? fside : normalize(cross(ax, toC/dist) + vec3(1e-5,0.0,0.0));
  hw = max(hw, dist*uMinW);
  sc *= 1.0 - smoothstep(uFade.x, uFade.y, dist);
  P += side*position.y*hw*sc;
  vec4 mvPosition = viewMatrix*vec4(P,1.0);
  gl_Position = sc < 0.01 ? vec4(2.0,2.0,2.0,1.0) : projectionMatrix*mvPosition;
  float sw = aX.w, on = sw > 0.0 ? smoothstep(sw-0.004, sw+0.004, uSwitch) : (sw < 0.0 ? 1.0 - smoothstep(-sw-0.004, -sw+0.004, uSwitch) : 1.0);
  float em = aC.a*on*(0.8 + 0.2*sin(uTime*(3.0+7.0*hs) + hs*90.0));
  vec3 c = aC.rgb*(aC.a > 0.05 ? 0.25 + 0.75*on : 1.0);
  vUv = position.xy; vCol = vec4(c, em); vId = hs;
  vSideV = mat3(viewMatrix)*side; vAxisV = mat3(viewMatrix)*ax;
  #include <fog_vertex>
}`;
const STROKE_FS = /* glsl */`
varying vec2 vUv; varying vec4 vCol; varying float vId; varying vec3 vSideV, vAxisV;
uniform float uGain, uWeave;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float a = vUv.y, al = abs(vUv.x);
  float en = 1.0 - 0.28*tnHash1(floor(a*4.0+4.0) + vId*71.0);
  float q = al/en;
  if (al > en || abs(a) > 1.0 - 0.45*q*q*q*q*q) discard;
  vec3 sv = normalize(vSideV + vec3(1e-5,0.0,0.0)), nf = normalize(cross(sv, normalize(vAxisV + vec3(0.0,1e-5,0.0))) + vec3(0.0,0.0,1e-5));
  if (nf.z < 0.0) nf = -nf;
  nf = normalize(mix(nf, vec3(0.0,0.0,1.0), 0.5));
  vec3 nv = normalize(nf - sv*tnSlope(a, vId)*0.9);
  float pr = tnProf(a, vId);
  vec3 emis = vCol.rgb*vCol.a*(0.6+0.5*pr);
  gl_FragColor = vec4(tnGallery(vCol.rgb, emis, nv, 1.0)*uGain*tnWeave(uWeave), 1.0);
  #include <fog_fragment>
}`;

// ---------------- painted base meshes ----------------
const PAINT_VS = /* glsl */`
attribute vec3 color;
varying vec3 vW, vN, vC;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix*vec4(position,1.0); vW = wp.xyz;
  vN = normalize(mat3(modelMatrix)*normal + vec3(0.0,1e-5,0.0)); vC = color;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const PAINT_FS = /* glsl */`
varying vec3 vW, vN, vC;
uniform float uTime, uGain, uCreep, uWeave;
uniform vec4 uWind;
#include <fog_pars_fragment>
${GLSL_COMMON}
// one layer of brick-laid dashes, sx m scale along and sy across: returns (pigment hash, across, along)
vec3 tnDash(vec2 uv, float sx, float sy, out float h2){
  vec2 q = uv/vec2(2.6*sx, 0.6*sy);
  float row = floor(q.y), sd = sx + sy*3.0;
  q.x += tnHash1(row*1.37 + sd)*9.0 + uTime*uCreep*(tnHash1(row*0.71)-0.3)/sx;
  float cell = floor(q.x);
  float h = tnHash1(cell*7.31 + row*3.17 + sd*5.0);
  h2 = tnHash1(cell*1.93 + row*9.41 + sd);
  return vec3(h, fract(q.y)*2.0-1.0, fract(q.x)*2.0-1.0);
}
vec3 tnTone(vec3 base, vec3 d, float h2){
  vec3 c = base*(0.72 + 0.56*d.x);
  c *= mix(vec3(1.0), vec3(0.72,0.95,1.4), step(h2, 0.18));
  c *= mix(vec3(1.0), vec3(1.3,1.15,0.7), step(0.86, h2));
  float en = 1.0 - 0.3*tnHash1(floor(d.y*3.0+3.0) + d.x*71.0);
  if (abs(d.z) > en || abs(d.y) > 0.9) c = base*0.5;
  return c;
}
// dashes at length scale sx whose rows are r times that scale (r from the footprint, cross-faded by octave)
vec3 tnRows(vec2 uv, float sx, float r0, float g, vec3 base, out float slope){
  float h; vec3 d = tnDash(uv, sx, sx*r0, h);
  vec3 col = tnTone(base, d, h); slope = tnSlope(d.y, d.x);
  if (g > 0.0){
    vec3 e = tnDash(uv, sx, sx*r0*2.0, h);
    col = mix(col, tnTone(base, e, h), g); slope = mix(slope, tnSlope(e.y, e.x), g);
  }
  return col;
}
// a coat of dashes laid along uv.x. fp = pixel footprint (along the dash, across the rows) in metres.
// Length and row height are scaled separately, so that on screen a dash is never under ~10 pixels long
// nor a row under ~5 pixels high: at grazing angles the paint stays in strokes instead of hairline stripes.
vec3 tnCoat(vec2 uv, vec2 fp, float dist, vec3 base, out float slope){
  float b0 = max(dist/28.0, 1.0), wx = max(b0, 3.8*fp.x), wy = max(b0, 8.0*fp.y);
  float lx = log2(wx), sx = exp2(floor(lx)), f = smoothstep(0.55, 1.0, fract(lx));
  float lr = log2(wy/wx), r0 = exp2(floor(lr)), g = smoothstep(0.55, 1.0, fract(lr));
  float sa, sb; vec3 col = mix(tnRows(uv, sx, r0, g, base, sa), tnRows(uv, sx*2.0, r0, g, base, sb), f);
  slope = mix(sa, sb, f);
  float rr = fp.y/(0.6*sx*r0), k = smoothstep(0.3, 0.7, rr);  // what is still too fine goes to the mean tone,
  col = mix(col, base*0.9, k);
  slope *= 1.0 - smoothstep(0.06, 0.2, rr);                     // and bristle ridges only show where a row is 5+ pixels high
  return col;
}
void main(){
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  float hl = length(n.xz), dist = length(vW - cameraPosition);
  vec3 dWx = dFdx(vW), dWy = dFdy(vW);
  bool wall = abs(n.y) < 0.5;
  // sloping ground and walls: dashes follow the contour (16 directions)
  float ang = atan(n.x, -n.z + 1e-6);
  ang = floor(ang/0.3927 + 0.5)*0.3927;
  vec2 t2 = vec2(cos(ang), sin(ang)), p2 = vec2(-t2.y, t2.x);
  vec2 uv = vec2(dot(vW.xz, t2), wall ? vW.y : dot(vW.xz, p2));
  vec2 fa = abs(vec2(dot(dWx.xz, t2), dot(dWy.xz, t2)));
  vec2 fb = wall ? abs(vec2(dWx.y, dWy.y)) : abs(vec2(dot(dWx.xz, p2), dot(dWy.xz, p2)));
  float slope; vec3 col = tnCoat(uv, vec2(max(fa.x, fa.y), max(fb.x, fb.y)), dist, vC, slope);
  vec3 tW = vec3(t2.x, 0.0, t2.y);
  // flat ground: one continuous, gently curving field laid with the wind (no cells, no seams)
  float flatK = 1.0 - smoothstep(0.07, 0.2, hl);
  if (flatK > 0.0){
    vec2 w2 = normalize(uWind.xy + vec2(1e-4, 0.0)), q2 = vec2(-w2.y, w2.x);
    vec2 pw = vW.xz + 18.0*vec2(sin(vW.z*0.019 + 1.3), sin(vW.x*0.016));
    vec2 ga = abs(vec2(dot(dWx.xz, w2), dot(dWy.xz, w2))), gb = abs(vec2(dot(dWx.xz, q2), dot(dWy.xz, q2)));
    float sl2; vec3 c2 = tnCoat(vec2(dot(pw, w2), dot(pw, q2)), vec2(max(ga.x, ga.y), max(gb.x, gb.y))*1.3, dist, vC, sl2);
    col = mix(col, c2, flatK); slope = mix(slope, sl2, flatK);
    tW = normalize(mix(tW, vec3(w2.x, 0.0, w2.y), flatK) + vec3(1e-4, 0.0, 0.0));
  }
  vec3 bW = normalize(cross(n, tW) + vec3(0.0,1e-4,0.0));
  vec3 nv = mat3(viewMatrix)*n; nv = normalize(mix(nv, vec3(0.0,0.0,1.0), 0.55));
  nv = normalize(nv - (mat3(viewMatrix)*bW)*slope*0.55);
  gl_FragColor = vec4(tnGallery(col, vec3(0.0), nv, 0.22)*uGain*tnWeave(uWeave), 1.0);
  #include <fog_fragment>
}`;

// accumulates stroke instances and turns them into one mesh
function makeSet() {
  const P = [], D = [], C = [], X = [], H = [];
  const set = {
    count: 0,
    // kind, centre, dir/params, half width, colour, emissive, hash, param, axis/params, switch
    add(kind, px, py, pz, dx, dy, dz, hw, col, em, hs, par = 0, ax = 0, ay = 1, az = 0, sw = 0, j = 1) {
      P.push(px, py, pz, kind); D.push(dx, dy, dz, hw); C.push(col.r * j, col.g * j, col.b * j, em);
      X.push(ax, ay, az, sw); H.push(hs, par); set.count++;
    },
    mesh(material, segs, dynamic) {
      const base = new THREE.PlaneGeometry(2, 2, segs, 1);
      const geo = new THREE.InstancedBufferGeometry();
      geo.index = base.index; geo.setAttribute('position', base.getAttribute('position'));
      const mk = (arr, n) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(arr), n); if (dynamic) a.setUsage(THREE.DynamicDrawUsage); return a; };
      geo.setAttribute('aP', mk(P, 4)); geo.setAttribute('aD', mk(D, 4)); geo.setAttribute('aC', mk(C, 4));
      geo.setAttribute('aX', mk(X, 4)); geo.setAttribute('aH', mk(H, 2));
      geo.instanceCount = set.count;
      const m = new THREE.Mesh(geo, material); m.frustumCulled = false;
      return m;
    },
  };
  return set;
}
function tinted(geo, col, mat) {
  const g = geo.index ? geo.toNonIndexed() : geo;
  if (mat) g.applyMatrix4(mat);
  const n = g.getAttribute('position').count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = col.r; a[i * 3 + 1] = col.g; a[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  g.deleteAttribute('uv');
  return g;
}
function distSeg(px, pz, ax, az, bx, bz) {
  const dx = bx - ax, dz = bz - az, t = Math.min(1, Math.max(0, ((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(px - ax - dx * t, pz - az - dz * t);
}

export default {
  id: 'the-turning-night',
  name: 'The Turning Night',
  category: 'sky',
  weirdness: 0.45,
  media: ['air'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const vary = ctx.vary || {};
    const detail = (ctx.quality && ctx.quality.detail) || 1;
    const dens = Math.min(1.3, Math.max(0.7, vary.density || 1)) * detail;
    // ---------- which night is it ----------
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'dawn' ? 'dawn' : vary.hour === 'golden' ? 'dusk'
      : rng.pick(['night', 'night', 'dusk', 'dawn']);
    const weather = rng.pick(['clear', 'clear', 'mistral', 'rain']);
    const season = rng.pick(['summer', 'summer', 'spring', 'winter']);
    const swifts = rng.chance(0.35), skiffs = rng.chance(0.4), lamplighter = hour !== 'dawn' && rng.chance(0.4);
    const rare = !!vary.rare;
    const mistral = weather === 'mistral', rain = weather === 'rain';
    const windA = rng.range(-0.5, 0.5) + (rng.chance(0.5) ? 0 : Math.PI);
    const wind = new THREE.Vector4(Math.cos(windA), Math.sin(windA) * 0.6, mistral ? 1.0 : 0.38, mistral ? 0.55 : 0.0);
    { const l = Math.hypot(wind.x, wind.y); wind.x /= l; wind.y /= l; }
    const timeK = mistral ? 2.0 : 1.0;

    const scene = new THREE.Scene();
    const fogCol = new THREE.Color(hour === 'dawn' ? '#1C3A7A' : hour === 'dusk' ? '#1A2A70' : '#142C78');
    scene.background = new THREE.Color('#0B1A4A');
    scene.fog = new THREE.FogExp2(fogCol, rain ? 0.0012 : 0.00085);

    // ---------- hero: the sky, the moon gate, the mirror ----------
    const heroPal = hour === 'dawn' ? ['#10225A', '#2C56B0', '#8FC2EA', '#F2E060', '#6E9A3C', '#14261E', '#F09A3A']
      : hour === 'dusk' ? ['#161A54', '#2A48A8', '#86B0E0', '#F6D04A', '#2A4E5A', '#14261E', '#F08A24']
        : ['#0B1A4A', '#2348A8', '#7FB2E5', '#F6D54A', '#1E4E5A', '#14261E', '#F08A24'];
    const hero = await buildHero(ctx, { palette: heroPal, mirror: false, gateGlow: 0.62 });
    scene.add(hero.object);
    hero.uniforms.uGain.value = hour === 'dawn' ? 1.02 : 1.15;
    const A = hero.anchors;
    await ctx.yield();

    // ---------- pigments ----------
    const K = {}; for (const k in HEX) K[k] = new THREE.Color(HEX[k]);
    const hsl = rng.range(-0.015, 0.015);
    const mix = (a, b, t, s = 1) => a.clone().lerp(b, t).multiplyScalar(s);
    const white = new THREE.Color(0.78, 0.82, 0.74), ochre = new THREE.Color('#B8892A').offsetHSL(hsl, 0, 0);
    const lamp = new THREE.Color('#F6C84A'), winterW = new THREE.Color('#B8CCE8');
    const winter = season === 'winter', spring = season === 'spring';

    // ---------- the flight ----------
    const line = (D) => [0, 13 - Math.sin(14 * Math.PI / 180) * D, Math.cos(14 * Math.PI / 180) * D];
    const sx = rng.range(-1, 1);
    const path = makePath([
      // a level entry 37 m from the hero cypress, then a slow brush up its flank 3 m from the strokes
      [5, -45.5, 1186], [3.2, -44.2, 1167], [1.6, -38, 1155], [0, -28, 1146.5], [1.0, -17.5, 1128], [1, -9.5, 1088], [0, -6.5, 1022], [0, -6, 950],
      [0, -38, 884], [-2 + sx * 3, -65, 824], [-8 + sx * 4, -69.5, 762], [-33, -59.5, 690], [-15, -67, 612],
      [0, -74.6, 536], [0, -74.8, 446], [0, -75, 376],
      line(330), line(270), line(200), line(130), line(60), line(0),
    ]);
    const duration = 42, LEN = path.length;
    // the x of the flight line at each z (5 m steps): wheat, olives, rings and boats are laid along it
    const pxTab = new Float32Array(245).fill(1e9);
    { const q = new THREE.Vector3(); for (let i = 0; i <= 900; i++) { path.pointAt(i / 900, q); const k = Math.round(q.z / 5); if (k >= 0 && k < 245) pxTab[k] = q.x; }
      for (let k = 1; k < 245; k++) if (pxTab[k] > 1e8) pxTab[k] = pxTab[k - 1] > 1e8 ? 0 : pxTab[k - 1]; if (pxTab[0] > 1e8) pxTab[0] = 0; }
    const pathX = (z) => pxTab[Math.min(244, Math.max(0, Math.round(z / 5)))];

    // ---------- shared uniforms and materials ----------
    const SU = {
      uTime: { value: 0 }, uSwitch: { value: 0 }, uDrain: { value: 0 }, uRain: { value: rain ? 1 : 0 }, uRare: { value: 0 },
      uFlame: { value: mistral ? 3.4 : 2.0 }, uMinW: { value: 0.0021 }, uWind: { value: wind }, uGain: { value: 1.15 },
      uCreep: { value: mistral ? 0.5 : 0.25 }, uWeave: hero.uniforms.uWeave,
    };
    const bufSize = new THREE.Vector2();
    const mats = [];
    const strokeMat = (fade, fog = true) => {
      const m = new THREE.ShaderMaterial({
        uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), SU, { uFade: { value: new THREE.Vector2(fade[0], fade[1]) } }),
        vertexShader: STROKE_VS, fragmentShader: STROKE_FS, side: THREE.DoubleSide, fog,
      });
      mats.push(m); return m;
    };
    const paintMat = new THREE.ShaderMaterial({
      uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), SU),
      vertexShader: PAINT_VS, fragmentShader: PAINT_FS, fog: true, side: THREE.DoubleSide,
    });
    const nearMat = strokeMat([620, 820]), farMat = strokeMat([1500, 2000]), skyMat = strokeMat([5000, 6000], false);
    skyMat.depthWrite = false;

    // ---------- terrain ----------
    const RV = [[720, 1420], [430, 1010], [170, 800], [30, 715], [0, 650], [0, 372], [-25, 332], [-130, 300], [-330, 255],
      [-520, 120], [-640, -150], [-700, -600], [-720, -1300]];
    const dRiver = (x, z) => { let d = 1e9; for (let i = 0; i < RV.length - 1; i++) d = Math.min(d, distSeg(x, z, RV[i][0], RV[i][1], RV[i + 1][0], RV[i + 1][1])); return d; };
    const nseed = rng.range(0, 500);
    const KN = { x: -12, z: 1135 };
    function ground(x, z, carve = true) {
      const ax = Math.abs(x);
      let h = RIVER + 2.6 + sstep(700, 1100, z) * 6.5 + noise.fbm2(x * 0.008 + nseed, z * 0.008, 3) * 1.6;
      h += 18 * Math.exp(-((x - KN.x) ** 2 + (z - KN.z) ** 2) / 2900);
      const n = 0.5 + 0.5 * noise.fbm2(x * 0.0016 + nseed, z * 0.0016 - nseed, 4), rn = noise.ridged2(x * 0.0021 - nseed, z * 0.0021, 3);
      const fl = sstep(400, 950, ax), F = 300 * fl * (0.5 + 0.3 * n + 0.25 * rn) + 26 * sstep(160, 420, ax) * n;
      const Aa = 125 * sstep(-560, -1250, z) * (0.55 + 0.5 * n), B = 230 * sstep(1330, 1750, z) * (0.6 + 0.4 * n);
      h += F + (1 - fl) * (Aa + B);
      const t = Math.hypot(x * 0.62, z) / 330;
      if (t < 1.25) h = Math.max(h, RIVER + 78 * (1 - t) - 4 * (1 - sstep(0, 0.16, t)) + noise.fbm2(x * 0.02, z * 0.02 + nseed, 2) * 1.2 * sstep(0, 0.2, t));
      const d = dRiver(x, z), vil = z > 340 && z < 705 && ax < 130;
      const gap = 1 - sstep(60, 320, d) * 1;
      if (d < 320 && h > RIVER + 4 && t > 1.0) h = lerp(h, RIVER + 4 + (h - RIVER - 4) * (1 - gap * 0.85), 1);
      h = lerp(RIVER - 2.6, h, vil ? sstep(44, 46.5, d) : sstep(40, 64, d));
      if (carve && ax < 70) {
        const nn = path.nearestXZ(x, z);
        if (nn.dist < 26) h = Math.min(h, lerp(nn.y - 8, h, sstep(12, 26, nn.dist)));
      }
      return h;
    }
    {
      const NX = 150, NZ = 236, Z0 = -1900, Z1 = 2000;
      const pos = new Float32Array((NX + 1) * (NZ + 1) * 3), col = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = [];
      const cField = winter ? mix(winterW, K.cobalt, 0.35, 0.42) : new THREE.Color('#6A5416').offsetHSL(hsl, 0, 0);
      const cMeadow = mix(K.vir, K.cyp, 0.3, 1.5), cHill = mix(K.cyp, K.vir, 0.45, 1.9), cBed = mix(K.ultra, K.vir, 0.3, 0.8);
      const cQuay = new THREE.Color('#27325A'), cFlankLo = mix(K.ultra, K.cobalt, 0.45, 1.25), cFlankHi = mix(K.cobalt, K.cer, 0.3, 0.8);
      const c = new THREE.Color();
      let o = 0;
      for (let j = 0; j <= NZ; j++) {
        const z = lerp(Z0, Z1, j / NZ);
        for (let i = 0; i <= NX; i++) {
          const s = i / NX * 2 - 1, x = 1750 * (0.24 * s + 0.76 * s * s * s);
          const h = ground(x, z), d = dRiver(x, z), ax = Math.abs(x);
          pos[o] = x; pos[o + 1] = h; pos[o + 2] = z;
          const hillT = Math.hypot(x * 0.62, z) / 330;
          const inField = z > 722 && z < 1095 && ax < 190 && d > 52;
          if (h < RIVER) c.copy(cBed);
          else if (z > 340 && z < 705 && ax < 130 && d < 80) c.copy(cQuay);
          else if (hillT < 1.05 && h > RIVER + 3) c.copy(cHill).lerp(cMeadow, 0.5 + 0.5 * noise.n2(x * 0.03, z * 0.03));
          else if (inField) c.copy(cField);
          else { c.copy(cMeadow).lerp(cFlankLo, sstep(RIVER + 8, RIVER + 60, h)).lerp(cFlankHi, sstep(RIVER + 90, RIVER + 330, h)); }
          if (winter && h > RIVER + 3) c.lerp(winterW, 0.22 * (0.5 + 0.5 * noise.n2(x * 0.02, z * 0.02)));
          col[o] = c.r; col[o + 1] = c.g; col[o + 2] = c.b; o += 3;
        }
        if (j % 4 === 3) await ctx.yield();
      }
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, e = a + NX + 1, f = e + 1; idx.push(a, e, b, b, e, f); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.setIndex(idx); g.computeVertexNormals();
      const terrain = new THREE.Mesh(g, paintMat); terrain.frustumCulled = false; terrain.name = 'valley'; scene.add(terrain);
    }
    await ctx.yield();
    // the river: the hero's mirror of the sky, broken into shivering dashes
    {
      const g = new THREE.PlaneGeometry(1700, 3400); g.rotateX(-Math.PI / 2);
      const water = new THREE.Mesh(g, hero.makeMirrorMaterial({ dim: rain ? 0.5 : 0.6, rowHeight: 0.011 }));
      water.position.set(-100, RIVER, 300); water.name = 'river-mirror'; scene.add(water);
    }

    const bases = [];                       // opaque base pieces, merged into one painted mesh
    const M = new THREE.Matrix4(), M2 = new THREE.Matrix4(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
    const jit = () => rng.range(0.82, 1.18);
    // a stroke given in the local space of matrix m
    const put = (set, m, lx, ly, lz, dx, dy, dz, hw, col, em = 0, sw = 0, par = 0) => {
      v1.set(lx, ly, lz).applyMatrix4(m); v2.set(lx + dx, ly + dy, lz + dz).applyMatrix4(m).sub(v1);
      set.add(0, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, hw, col, em, rng(), par, 0, 1, 0, sw, em > 0 ? 1 : jit());
    };

    // ---------- cypresses: slow black-green fire ----------
    const cypSet = makeSet();
    const cypCols = [mix(K.vir, K.cer, 0.04, 0.72), mix(K.vir, K.cyp, 0.5, 0.85), mix(K.cyp, K.ultra, 0.15, 0.75), mix(K.vir, K.cobalt, 0.3, 0.55), ochre.clone().multiplyScalar(0.42)];
    const cypBase = mix(K.cyp, K.vir, 0.15, 0.7);
    function cypress(x, z, Hh, R, n, big) {
      const y = ground(x, z) - 0.6, tw = rng.sign();
      const cg = new THREE.ConeGeometry(R * 0.78, Hh * 0.96, 10, 8), cp = cg.getAttribute('position'), lk = (0.03 + wind.w * 0.16) * Hh;
      for (let i = 0; i < cp.count; i++) { const t = cp.getY(i) / Hh + 0.5; cp.setX(i, cp.getX(i) + wind.x * lk * t * t); cp.setZ(i, cp.getZ(i) + wind.y * lk * t * t); }   // the body leans with its flames
      cg.computeVertexNormals();
      bases.push(tinted(cg, cypBase, M.makeTranslation(x, y + Hh * 0.48, z)));
      for (let i = 0; i < n; i++) {
        const r = rng(), col = r < 0.2 ? cypCols[0] : r < 0.52 ? cypCols[1] : r < 0.83 ? cypCols[2] : r < 0.94 ? cypCols[3] : cypCols[4];
        cypSet.add(2, x, y, z, rng.range(0, TAU), rng(), Hh, big * rng.range(0.2, 0.36), col, 0, rng(), R,
          big * rng.range(0.7, 1.5), rng.range(0.82, 1.08), tw, 0, jit());
      }
    }
    cypress(-5, 1150, 35, 5.2, Math.round(5200 * detail), 1);
    cypress(-16, 1126, 28, 4.3, Math.round(2400 * detail), 0.95);
    cypress(-9.5, 1101, 22, 3.4, Math.round(1700 * detail), 0.9);
    await ctx.yield();

    // ---------- wheat (or winter furrows) and poppies ----------
    const fieldSet = makeSet();
    {
      const N = Math.round(30000 * dens);
      const wc = winter ? [mix(winterW, K.cer, 0.3, 0.7), mix(winterW, K.cobalt, 0.4, 0.55), white.clone().multiplyScalar(0.8), mix(K.cobalt, K.vir, 0.5, 0.8)]
        : [K.yel.clone().multiplyScalar(0.62), ochre.clone().multiplyScalar(0.85), ochre.clone().multiplyScalar(0.5), mix(K.yel, white, 0.4, 0.7)];
      const furrowD = mix(K.cobalt, K.vir, 0.4, 0.5);
      let made = 0;
      for (let i = 0; i < N * 3 && made < N; i++) {
        if (i % 500 === 499) await ctx.yield();   // before the `continue`, so a rejected try cannot skip it
        const z = rng.range(724, 1094), near = rng.chance(0.75);
        const x = near ? pathX(z) + rng.gauss() * 26 : rng.range(-190, 190);
        if (Math.abs(x) > 190 || dRiver(x, z) < 54) continue;
        const y = ground(x, z) - 0.25, L = winter ? rng.range(0.4, 0.8) : rng.range(0.9, 1.6);
        const r = rng(), col = r < 0.45 ? wc[0] : r < 0.75 ? wc[1] : r < 0.9 ? wc[2] : wc[3];
        if (winter && i % 5 !== 0) {          // winter: frosted furrows, flat dashes laid along the rows and creeping, with stubble between
          const hl = rng.range(0.8, 1.7), dv = rng.range(-0.12, 0.12);
          fieldSet.add(0, x, y + 0.55, z, (wind.x - wind.y * dv) * hl, rng.range(-0.04, 0.04) * hl, (wind.y + wind.x * dv) * hl, rng.range(0.2, 0.36), r > 0.86 ? furrowD : col, 0, rng(), 0.3, 0, 1, 0, 0, jit());
          made++;
          continue;
        }
        fieldSet.add(1, x, y, z, rng.range(-0.15, 0.15) * L, L, rng.range(-0.15, 0.15) * L, rng.range(0.08, 0.135), col, 0, rng(), 0, 0, 1, 0, 0, jit());
        made++;
      }
      const NP = Math.round((spring ? 1100 : 520) * dens);
      for (let i = 0; i < NP; i++) {
        const z = rng.range(730, 1090), x = pathX(z) + rng.gauss() * 40;
        if (Math.abs(x) > 180 || dRiver(x, z) < 54) continue;
        fieldSet.add(1, x, ground(x, z) + 0.35, z, 0, rng.range(0.45, 0.7), 0, rng.range(0.14, 0.2), K.org, 0.15, rng(), 0, 0, 1, 0, 0, jit());
      }
    }
    await ctx.yield();

    // ---------- the village ----------
    const townSet = makeSet(), smokeSet = makeSet();
    const cWall = [mix(K.ultra, K.cyp, 0.3, 1.9), K.cobalt.clone().multiplyScalar(0.5), mix(K.vir, K.ultra, 0.4, 1.3), mix(K.ultra, K.cobalt, 0.3, 1.5)];
    const cRoof = winter ? [winterW.clone().multiplyScalar(0.75), mix(winterW, K.cer, 0.4, 0.6), white.clone().multiplyScalar(0.7)]
      : [K.cobalt.clone().multiplyScalar(0.95), mix(K.cobalt, K.cer, 0.35, 0.7), mix(K.ultra, K.cobalt, 0.5, 1.7)];
    const cWallBase = mix(K.ultra, K.cyp, 0.3, 1.25), cRoofBase = winter ? mix(winterW, K.cobalt, 0.4, 0.45) : K.cobalt.clone().multiplyScalar(0.55);
    const smokeCol = mix(K.cer, K.cobalt, 0.35, 0.5);
    const litFrac = hour === 'dusk' ? 0.5 : hour === 'dawn' ? 0.32 : 0.72;
    let switchLeft = 5, chimneys = 0;
    const prism = (d, h, w) => { const g = new THREE.BoxGeometry(d, h, w); const p = g.getAttribute('position'); for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setX(i, p.getX(i) * 0.03); g.computeVertexNormals(); return g; };
    function wallStrokes(m, d, h, w, n, cols, y0 = 0) {
      for (let i = 0; i < n; i++) {
        const f = rng.int(0, 3), hl = rng.range(0.6, 1.3), yy = y0 + rng.range(hl * 0.6, Math.max(hl, h - hl * 0.6)), col = rng.pick(cols);
        const tilt = rng.range(-0.25, 0.25) * hl;
        if (f < 2) put(townSet, m, (f ? 1 : -1) * (d / 2 + 0.12), yy, rng.range(-w / 2, w / 2), 0, hl, tilt, rng.range(0.24, 0.38), col);
        else put(townSet, m, rng.range(-d / 2, d / 2), yy, (f === 2 ? 1 : -1) * (w / 2 + 0.12), tilt, hl, 0, rng.range(0.24, 0.38), col);
      }
    }
    function house(x, z, side) {
      const y = ground(x, z) - 0.4, d = rng.range(6, 8.5), w = rng.range(6, 9.5);
      let wh = rng.range(4, 7), rh = rng.range(2.4, 4);
      const nn = path.nearestXZ(x, z); if (nn.dist < 18) wh = Math.min(wh, nn.y - 7.5 - y - rh);
      if (wh < 2.5) return;
      const m = new THREE.Matrix4().makeTranslation(x, y, z).multiply(M.makeRotationY(rng.range(-0.16, 0.16) + (rng.chance(0.3) ? Math.PI / 2 : 0)))
        .multiply(M2.makeShear(0, 0, rng.range(-0.09, 0.09), rng.range(-0.07, 0.07), 0, 0));
      bases.push(tinted(new THREE.BoxGeometry(d, wh, w), cWallBase, M.copy(m).multiply(M2.makeTranslation(0, wh / 2, 0))));
      bases.push(tinted(prism(d * 1.12, rh, w * 1.06), cRoofBase, M.copy(m).multiply(M2.makeTranslation(0, wh + rh / 2, 0))));
      wallStrokes(m, d, wh, w, 22, cWall);
      for (let i = 0; i < 18; i++) {                         // roof strokes run up the slope
        const s = rng.sign(), t = rng.range(0.12, 0.8), hl = rng.range(0.7, 1.2);
        const sl = Math.hypot(d * 0.56, rh), ux = -s * d * 0.56 / sl, uy = rh / sl;
        put(townSet, m, s * d * 0.56 * (1 - t) + s * 0.1, wh + rh * t + 0.14, rng.range(-w / 2, w / 2), ux * hl, uy * hl, rng.range(-0.2, 0.2), rng.range(0.26, 0.4), rng.pick(cRoof));
      }
      const nw = rng.int(2, 3);
      for (let i = 0; i < nw; i++) {                         // window strokes
        const lit = rng.chance(litFrac); let sw = 0;
        if (switchLeft > 0 && rng.chance(0.09)) { sw = (lit ? -1 : 1) * rng.range(0.3, 0.8); switchLeft--; }
        const em = (lit || sw > 0) ? rng.range(2.0, 3.4) : 0, col = em > 0 ? K.org : cWall[1];
        const f = rng.chance(0.6) ? 0 : rng.int(1, 2), yy = rng.range(1.6, Math.max(1.7, wh - 1.2));
        if (f === 0) put(townSet, m, -side * (d / 2 + 0.22), yy, rng.range(-w / 2 + 1, w / 2 - 1), 0, 0.5, 0, 0.3, col, em, sw);
        else put(townSet, m, rng.range(-d / 2 + 1, d / 2 - 1), yy, (f === 1 ? 1 : -1) * (w / 2 + 0.22), 0, 0.5, 0, 0.3, col, em, sw);
      }
      if (chimneys < 25 && rng.chance(0.5)) {
        chimneys++;
        const cx = rng.range(-d * 0.3, d * 0.3), cz = rng.range(-w * 0.3, w * 0.3), top = wh + rh + 0.8;
        bases.push(tinted(new THREE.BoxGeometry(0.9, 2.4, 0.9), cWallBase, M.copy(m).multiply(M2.makeTranslation(cx, top - 1.2, cz))));
        v1.set(cx, top, cz).applyMatrix4(m);
        const R = rng.range(26, 40), ph = rng();
        for (let k = 0; k < 12; k++) smokeSet.add(4, v1.x, v1.y, v1.z, ph + k / 12, rng(), R, rng.range(0.2, 0.34), smokeCol, 0, rng(), 0, 0, 1, 0, 0, jit());
      }
    }
    const CH = { x: -64, z: 640 };
    for (let i = 0; i < 20; i++) {
      const z = 692 - i * 16.6 + rng.range(-2, 2);
      for (const [xx, sd] of [[-rng.range(52, 57), -1], [-rng.range(70, 82), -1], [rng.range(52, 57), 1]]) {
        if (Math.hypot(xx - CH.x, z - CH.z) < 19) continue;
        house(xx, z, sd);
      }
      if (i % 7 === 6) await ctx.yield();
    }
    {                                                         // the church and its needle
      const y = ground(CH.x, CH.z) - 0.4, m = new THREE.Matrix4().makeTranslation(CH.x, y, CH.z);
      bases.push(tinted(new THREE.BoxGeometry(11, 9, 22), cWallBase, M.makeTranslation(CH.x, y + 4.5, CH.z + 6)));
      bases.push(tinted(prism(12, 5.5, 23), cRoofBase, M.makeTranslation(CH.x, y + 11.7, CH.z + 6)));
      bases.push(tinted(new THREE.BoxGeometry(7, 17, 7), cWallBase, M.makeTranslation(CH.x, y + 8.5, CH.z - 8)));
      bases.push(tinted(new THREE.ConeGeometry(4.3, 29, 4, 1).rotateY(Math.PI / 4), cRoofBase, M.makeTranslation(CH.x, y + 31.5, CH.z - 8)));
      wallStrokes(M.makeTranslation(CH.x, y, CH.z + 6), 11, 9, 22, 70, cWall);
      wallStrokes(M.makeTranslation(CH.x, y, CH.z - 8), 7, 17, 7, 70, cWall);
      for (let i = 0; i < 110; i++) {
        const t = rng.range(0.02, 0.9), a = rng.int(0, 3) * Math.PI / 2 + rng.range(-0.6, 0.6), r = 3.3 * (1 - t) + 0.15;
        put(townSet, m, Math.cos(a) * r, 17 + 29 * t, -8 + Math.sin(a) * r, -Math.cos(a) * 0.12, rng.range(0.8, 1.5), -Math.sin(a) * 0.12, rng.range(0.22, 0.36), rng.pick(cRoof));
      }
      for (let i = 0; i < 5; i++) put(townSet, m, 5.75, rng.range(3, 6.5), -1 + i * 4, 0, 1.1, 0, 0.36, K.org, hour === 'dawn' && i > 1 ? 0 : 2.4);
      put(townSet, m, 3.75, 13, -8, 0, 0.8, 0, 0.4, K.yel, 2.6);
      for (let i = 0; i < 7; i++) {                           // small cypresses round the churchyard and quays
        const a = rng.range(0, TAU), rr = rng.range(17, 30), x = i < 5 ? CH.x + Math.cos(a) * rr - 8 : rng.range(60, 80), z = i < 5 ? CH.z + Math.sin(a) * rr : rng.range(400, 660);
        if (path.nearestXZ(x, z).dist > 14 && dRiver(x, z) > 52) cypress(x, z, rng.range(12, 19), rng.range(1.7, 2.3), Math.round(260 * detail), 1.15);
      }
    }
    await ctx.yield();

    // ---------- quay lamps, their reflections and moths ----------
    const lampSet = makeSet();
    const postCol = mix(K.ultra, K.cyp, 0.5, 1.6), mothCol = mix(white, K.yel, 0.3, 0.9);
    function addLamp(x, yFoot, z, footX, sw, postH = 4.2) {
      const yTop = yFoot + postH;
      lampSet.add(0, x, yFoot + postH / 2, z, 0, postH / 2, 0, 0.11, postCol, 0, rng(), 0, 0, 1, 0, 0, 1);
      lampSet.add(0, x, yTop + 0.3, z, 0, 0.36, 0, 0.3, lamp, 5.2, rng(), 0, 0, 1, 0, sw, 1);
      const n = rain ? 14 : rng.int(8, 12);
      for (let k = 0; k < n; k++) lampSet.add(5, footX, RIVER + 0.07, z, (k + rng.range(-0.3, 0.3)) / n, rng.range(0.45, 1.15), yTop - RIVER,
        rng.range(0.28, 0.4), lamp, rain ? rng.range(0.9, 1.5) : rng.range(1.1, 2.0), rng(), rain ? 18 : 12.5, 0, 1, 0, sw, 1);
      for (let k = 0; k < 6; k++) {
        v1.set(rng.gauss(), rng.gauss(), rng.gauss()).normalize();
        lampSet.add(3, x, yTop + 0.3, z, rng.range(0, TAU), rng.range(0.5, 0.95), 0.22, 0.06, mothCol, 0.9, rng(), rng.sign() * rng.range(3, 6), v1.x, v1.y, v1.z, sw, 1);
      }
    }
    for (let i = 0; i < 11; i++) for (const s of [-1, 1]) {
      const z = 690 - i * 30, x = s * 48.2;
      let sw = 0;
      if (hour === 'dawn') sw = -rng.range(0.18, 0.9);
      else if (lamplighter && s < 0) sw = 0.3 + 0.5 * (i + 0.5) / 11;
      addLamp(x, ground(x, z) - 0.2, z, s * 45.2, sw);
    }

    // ---------- the bridge: a humped back, three arches, cutwaters, voussoirs ----------
    const BZ = 353, DECK = RIVER + 17;
    const deckY = (x) => DECK - 7 + 6.5 * (1 - (x / 68) * (x / 68));       // top of the roadway
    {
      const sh = new THREE.Shape();
      sh.moveTo(-68, RIVER - 3); sh.lineTo(68, RIVER - 3); sh.lineTo(68, DECK - 6.1); sh.quadraticCurveTo(0, DECK + 6.9, -68, DECK - 6.1); sh.closePath();
      const arch = (cx, r) => { const h = new THREE.Path(); h.moveTo(cx - r, RIVER - 2.5); h.lineTo(cx - r, RIVER + 1); h.absarc(cx, RIVER + 1, r, Math.PI, 0, true); h.lineTo(cx + r, RIVER - 2.5); h.closePath(); return h; };
      const ARCH = [[0, 13], [-30.5, 9.5], [30.5, 9.5]];
      for (const [cx, r] of ARCH) sh.holes.push(arch(cx, r));
      const g = new THREE.ExtrudeGeometry(sh, { depth: 7, bevelEnabled: false, curveSegments: 12 });
      const stone = new THREE.Color('#2C3760'), stoneD = new THREE.Color('#222A4C');
      bases.push(tinted(g, stone, M.makeTranslation(0, 0, BZ - 3.5)));
      for (const x of [-42.5, -17, 17, 42.5]) for (const sd of [-1, 1]) {      // cutwater piers, an edge to the current
        const cg = new THREE.CylinderGeometry(0.9, 2.7, 13, 4, 1); cg.rotateY(Math.PI / 4);
        bases.push(tinted(cg, stoneD, M.makeTranslation(x, RIVER + 3.5, BZ + sd * 3.6)));
        for (let i = 0; i < 16; i++) { const t = rng(), R = lerp(2.7, 0.9, (3.3 + 9 * t) / 13), w = R * rng.range(-0.8, 0.8); townSet.add(0, x + w, RIVER + 0.3 + t * 9, BZ + sd * (3.72 + R - Math.abs(w)), rng.range(-0.1, 0.1), rng.range(0.6, 1.1), 0, rng.range(0.3, 0.45), rng.chance(0.3) ? mix(K.cobalt, K.cer, 0.3, 0.75) : mix(K.ultra, K.cobalt, 0.4, 1.3), 0, rng(), 0, 0, 1, 0, 0, jit()); }
      }
      const cs = [K.cobalt.clone().multiplyScalar(0.55), mix(K.ultra, K.cer, 0.15, 1.9), mix(K.cer, K.vir, 0.4, 0.36), ochre.clone().multiplyScalar(0.3), mix(K.ultra, K.cobalt, 0.5, 1.4), mix(K.cobalt, K.vir, 0.4, 0.7)];
      const vous = [mix(K.cobalt, K.cer, 0.45, 0.85), mix(K.cobalt, K.cer, 0.2, 0.8), mix(K.cer, white, 0.2, 0.6), ochre.clone().multiplyScalar(0.45)];
      const inHole = (x, y) => (Math.hypot(x, y - RIVER - 1) < 14.6 || Math.hypot(Math.abs(x) - 30.5, y - RIVER - 1) < 11.1 || ((Math.abs(x) < 13.6 || Math.abs(Math.abs(x) - 30.5) < 10.1) && y < RIVER + 1));
      for (let i = 0; i < 2300; i++) {
        const x = rng.range(-66, 66), y = lerp(RIVER, deckY(x) + 0.7, Math.sqrt(rng())), f = rng.sign();
        if (inHole(x, y)) continue;
        // strokes follow the arch they sit over, and the back of the bridge near the parapet
        const cx = Math.abs(x) < 21 ? 0 : Math.sign(x) * 30.5, dx = x - cx, dy = Math.max(0.5, y - RIVER - 1), l = Math.hypot(dx, dy), hl = rng.range(0.7, 1.4);
        const top = deckY(x) - y < 1.6, near = !top && l < 20;
        townSet.add(0, x, y, BZ + f * 3.62, near ? dy / l * hl : hl, near ? -dx / l * hl : (top ? -x * 0.0028 * hl : rng.range(-0.1, 0.1)), 0, rng.range(0.35, 0.55), top ? rng.pick(vous) : rng.pick(cs), 0, rng(), 0, 0, 1, 0, 0, jit());
      }
      for (const [cx, r] of ARCH) {
        const nv = Math.round(60 * r / 13);
        for (const f of [-1, 1]) for (let i = 0; i < nv; i++) {               // voussoirs: radial strokes round each arch rim
          const an = (i + rng.range(0.2, 0.8)) / nv * Math.PI, ca = Math.cos(an), sa = Math.sin(an), rr = r + 0.75;
          townSet.add(0, cx + ca * rr, RIVER + 1 + sa * rr, BZ + f * 3.68, ca * 0.72, sa * 0.72, 0, rng.range(0.3, 0.42), rng.pick(vous), 0, rng(), 0, 0, 1, 0, 0, jit());
        }
        const ns = Math.round(95 * r / 13);
        for (let i = 0; i < ns; i++) {                                         // the soffit, seen from below
          const an = rng.range(0.12, Math.PI - 0.12), ca = Math.cos(an), sa = Math.sin(an), rr = r - 0.14, along = rng.chance(0.5), hl = rng.range(0.7, 1.2);
          townSet.add(0, cx + ca * rr, RIVER + 1 + sa * rr, BZ + rng.range(-2.6, 2.6), along ? 0 : -sa * hl, along ? 0 : ca * hl, along ? hl : 0, rng.range(0.34, 0.5), rng.chance(0.25) ? rng.pick(vous) : rng.pick(cs), 0, rng(), 0, 0, 1, 0, 0, jit());
        }
      }
      for (const x of [-52, -22, 22, 52]) for (const sd of [-1, 1]) if ((x > 0) === (sd > 0) || Math.abs(x) < 30) addLamp(x, deckY(x) + 0.7, BZ + sd * 3.2, x, 0, 2.6);
    }
    await ctx.yield();

    // ---------- barges or fishing skiffs, drifting toward the camera ----------
    const fleet = new THREE.Group(); fleet.name = 'fleet'; scene.add(fleet);
    {
      const set = makeSet(), hulls = [];
      const hullCol = mix(K.ultra, K.cyp, 0.5, 1.5), plank = [mix(K.ultra, K.cyp, 0.4, 2.2), ochre.clone().multiplyScalar(0.32), K.cobalt.clone().multiplyScalar(0.45), mix(K.vir, K.cyp, 0.5, 1.8)];
      const sail = [ochre.clone().multiplyScalar(0.9), ochre.clone().multiplyScalar(0.6), mix(ochre, white, 0.4, 0.7)];
      // placed so that, with the drift, the camera passes between the leading pair at u ~ 0.6
      const boats = skiffs ? [[-11, 487, 0.6], [12, 468, 0.55], [-19, 430, 0.55], [15, 520, 0.5], [-12, 398, 0.55], [22, 590, 0.55]] : [[-12, 487, 1], [13, 463, 1]];
      for (const [bx, bz, s] of boats) {
        const g = new THREE.BoxGeometry(5.2 * s, 2.3 * s, 22 * s, 1, 1, 6), p = g.getAttribute('position');
        for (let i = 0; i < p.count; i++) { const t = Math.abs(p.getZ(i)) / (11 * s); p.setX(i, p.getX(i) * (1 - 0.8 * t * t * t) * (p.getY(i) < 0 ? 0.7 : 1)); p.setY(i, p.getY(i) + t * t * 0.9 * s); }
        g.computeVertexNormals();
        const yaw = rng.range(-0.08, 0.08), m = new THREE.Matrix4().makeTranslation(bx, RIVER + 0.75 * s, bz).multiply(M.makeRotationY(yaw));
        hulls.push(tinted(g, hullCol, m));
        for (let i = 0; i < 70; i++) { const f = rng.sign(), z = rng.range(-9, 9) * s, t = Math.abs(z) / (11 * s); put(set, m, f * (2.68 * s * (1 - 0.8 * t * t * t)), rng.range(-0.6, 1.1) * s + t * t * 0.9 * s, z, 0, rng.range(-0.1, 0.1), rng.range(0.7, 1.4) * s, rng.range(0.2, 0.32) * Math.max(0.7, s), rng.pick(plank)); }
        for (let i = 0; i < 24; i++) put(set, m, rng.range(-1.8, 1.8) * s, 1.22 * s, rng.range(-8, 8) * s, 0, 0, rng.range(0.8, 1.4) * s, 0.3 * s, rng.pick(plank));
        put(set, m, 0, 6.5 * s, 2 * s, 0, 5.4 * s, 0, 0.15, plank[0]);                                  // mast
        for (let i = 0; i < 40; i++) { const t = rng.range(-1, 1); put(set, m, rng.range(-0.45, 0.45), (8.0 + t * 1.5 + rng.range(-0.7, 0.7)) * s, (2 + t * 5.8) * s, 0, 0.25 * s, rng.range(0.8, 1.4) * s, rng.range(0.32, 0.5) * Math.max(0.75, s), rng.pick(sail)); }
        const lan = skiffs ? [[0, 2.6, 6]] : [[0, 3.0, 10], [0, 11.6, 2], [0.5, 2.8, -9.5]];
        for (const [lx, ly, lz] of lan) {
          put(set, m, lx, ly * s, lz * s, 0, 0.34, 0, 0.3, K.org, 6, 0, 0.12);
          v1.set(lx, 0, lz * s).applyMatrix4(m);
          for (let k = 0; k < 8; k++) set.add(5, v1.x, RIVER + 0.07, v1.z, (k + rng.range(-0.3, 0.3)) / 8, rng.range(0.35, 0.8), ly * s + 0.8, 0.3, K.org, rng.range(1.4, 2.4), rng(), 7, 0, 1, 0, 0, 1);
        }
      }
      fleet.add(new THREE.Mesh(mergeGeometries(hulls), paintMat));
      fleet.add(set.mesh(farMat, 1));
      for (const c of fleet.children) c.frustumCulled = false;
    }

    // ---------- the far hill: olive (or almond) knots and creeping contour strokes ----------
    const hillSet = makeSet();
    {
      const leaf = spring ? [new THREE.Color('#F2D6DC').multiplyScalar(0.85), white.clone(), new THREE.Color('#E8A8B8').multiplyScalar(0.8), mix(K.vir, white, 0.3, 0.8)]
        : [mix(K.vir, white, 0.35, 0.95), mix(K.cyp, K.vir, 0.4, 3.0), mix(K.vir, K.cer, 0.3, 1.3), mix(K.vir, K.yel, 0.2, 1.1)];
      const blob = mix(K.cyp, K.vir, 0.3, 1.0), trunk = mix(K.cyp, K.ultra, 0.3, 1.6);
      // an avenue of knots lining the climb (two loose rows 13-19 m either side of the line), the rest scattered
      const NO = Math.round(70 * Math.min(1.2, dens / detail)), spots = [];
      for (let i = 0; i < 17; i++) for (const sd of [-1, 1]) spots.push([sd * rng.range(13, 19), 296 - i * 17.5 + rng.range(-5, 5)]);
      for (let i = 0; i < 900 && spots.length < NO + 40; i++) spots.push([rng.gauss() * 32, rng.range(-30, 300)]);
      let made = 0;
      for (const [x, z] of spots) {
        if (made >= NO) break;
        if (Math.abs(x) < 11.5 || Math.abs(x) > 150 || Math.hypot(x * 0.62, z) / 330 > 0.93 || dRiver(x, z) < 60) continue;
        let clash = false; for (let k = 0; k < made; k++) if (Math.hypot(spots[k][2] - x, spots[k][3] - z) < 6.5) { clash = true; break; }
        if (clash) continue;
        spots[made][2] = x; spots[made][3] = z;
        const y = ground(x, z), R = rng.range(2.6, 3.6), cy = y + R + 1.1, spin = rng.sign() * rng.range(0.5, 0.9);
        bases.push(tinted(new THREE.IcosahedronGeometry(R * 0.6, 1), blob, M.makeTranslation(x, cy, z)));
        hillSet.add(0, x + 0.2, y + 1.1, z, rng.range(-0.3, 0.3), 1.4, 0, 0.26, trunk, 0, rng(), 0, 0, 1, 0, 0, 1);
        v2.set(rng.range(-0.35, 0.35), rng.range(0.2, 0.6), 1).normalize();
        const ns = Math.round(66 * detail), sdx = x > 0 ? -1 : 1;
        for (let k = 0; k < ns; k++) {
          // two swirls per knot: one facing down the valley, one turned toward the flight line, so it is a ball from any side
          const r = R * rng.range(0.12, 1), off = R * 0.6 * rng.range(0.8, 1.3), nx = k % 3 ? v2.x : sdx * 0.86, ny = k % 3 ? v2.y : 0.36, nz = k % 3 ? v2.z : 0.36;
          hillSet.add(3, x + nx * off, cy + ny * off, z + nz * off, rng.range(0, TAU), r, Math.min(0.9, rng.range(0.4, 0.75) / r), rng.range(0.18, 0.3),
            rng.pick(leaf), 0, rng(), spin / (0.6 + r * 0.5), nx, ny, nz, 0, jit());
        }
        made++;
      }
      await ctx.yield();
      const gc = [mix(K.vir, K.cer, 0.1, 1.7), mix(K.cyp, K.vir, 0.3, 2.4), mix(K.cyp, K.vir, 0.6, 2.0), mix(K.vir, K.yel, 0.12, 1.2), mix(K.vir, K.cobalt, 0.4, 1.0), winter ? winterW.clone().multiplyScalar(0.6) : mix(K.vir, K.ultra, 0.5, 1.6)];
      const fleck = [ochre.clone().multiplyScalar(0.62), mix(K.cer, K.cobalt, 0.25, 0.75), mix(K.vir, K.yel, 0.35, 1.0), winter ? winterW.clone().multiplyScalar(0.75) : ochre.clone().multiplyScalar(0.45)];
      const NH = Math.round(7000 * dens), NB = Math.round(1600 * dens);
      for (let i = 0; i < NH + NB; i++) {
        const hill = i < NH, z = hill ? rng.range(-50, 325) : rng.range(700, 1190), x = rng.gauss() * (hill ? 58 : 45) + (hill ? 0 : (rng.chance(0.5) ? -150 : 150) * (z < 1090 ? 1 : 0));
        if (dRiver(x, z) < 50) continue;
        const y = ground(x, z), gx = ground(x + 2, z) - y, gz = ground(x, z + 2) - y;
        let tx = -gz, tz = gx; const gl = Math.hypot(tx, tz);
        if (gl < 0.05) { const a = rng.range(0, TAU); tx = Math.cos(a); tz = Math.sin(a); } else { tx /= gl; tz /= gl; }
        if (hill) {               // the contour strokes curl: they swing off the contour in slow eddies, like the sky
          const cu = 0.75 * noise.n2(x * 0.021 + nseed, z * 0.021) + 0.35 * Math.sin(x * 0.07 + z * 0.045), cc = Math.cos(cu), sc = Math.sin(cu), ux = tx * cc - tz * sc;
          tz = tx * sc + tz * cc; tx = ux;
        }
        const hl = hill ? rng.range(1.4, 2.6) : rng.range(0.9, 1.9);
        hillSet.add(0, x, y + 0.45, z, tx * hl, (tx * gx + tz * gz) / 2 * hl, tz * hl, hill ? rng.range(0.28, 0.46) : rng.range(0.22, 0.38), rng.chance(hill ? 0.16 : 0.05) ? rng.pick(fleck) : rng.pick(gc), 0, rng(), 0.5, 0, 1, 0, 0, jit());
        if (i % 1200 === 1199) await ctx.yield();
      }
      // dry-stone terraces: dark rows at fixed heights round the hill, each capped with a paler course
      const wallC = [mix(K.ultra, K.cyp, 0.4, 1.5), mix(K.ultra, K.cobalt, 0.3, 1.2), mix(K.cyp, K.vir, 0.3, 1.3)], capC = [mix(K.cer, K.vir, 0.45, 0.62), mix(K.cobalt, K.cer, 0.4, 0.7), ochre.clone().multiplyScalar(0.5)];
      let tcount = 0;
      for (const hh of [13, 25, 37, 48, 58, 67]) {
        const tt = 1 - hh / 78, rz = 330 * tt, rx = rz / 0.62, da = 1.9 / Math.max(60, rx);
        for (let an = 0.12 + rng() * da; an < Math.PI - 0.12; an += da * rng.range(0.85, 1.15)) {
          const wob = 1 + 0.035 * Math.sin(an * 9 + hh), x = Math.cos(an) * rx * wob, z = Math.sin(an) * rz * wob;
          if (Math.abs(x) > 230 || dRiver(x, z) < 58) continue;
          if (rng.chance(0.12)) { an += da * rng.range(1, 4); continue; }          // gaps where the wall has fallen
          const y = ground(x, z), tx2 = -Math.sin(an) * rx, tz2 = Math.cos(an) * rz, tl = Math.hypot(tx2, tz2), ex = tx2 / tl, ez = tz2 / tl;
          const y2 = ground(x + ex * 2, z + ez * 2), hl = rng.range(0.85, 1.2);
          hillSet.add(0, x, y + 0.75, z, ex * hl, (y2 - y) / 2 * hl, ez * hl, rng.range(0.55, 0.75), rng.pick(wallC), 0, rng(), 0, 0, 1, 0, 0, jit());
          if (rng.chance(0.7)) hillSet.add(0, x + ex * 0.3, y + 1.5, z + ez * 0.3 + 0.12, ex * hl * 0.8, (y2 - y) / 2 * hl * 0.8, ez * hl * 0.8, rng.range(0.2, 0.3), rng.pick(capC), 0, rng(), 0, 0, 1, 0, 0, jit());
          if (++tcount % 500 === 499) await ctx.yield();
        }
      }
    }
    await ctx.yield();

    // ---------- strokes at infinity: dusk streak, dawn band and the morning star ----------
    const skyGroup = new THREE.Group(); skyGroup.name = 'sky-strokes'; scene.add(skyGroup);
    const skySet = makeSet(), SR = 4500;
    const azel = (az, el, out) => { const a = az * Math.PI / 180, e = el * Math.PI / 180; return out.set(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)); };
    if (hour === 'dusk') {
      const west = rng.sign() > 0 ? 95 : -110, rose = new THREE.Color('#E0604A');
      for (let i = 0; i < 380; i++) {
        const az = west + rng.gauss() * 26, t = Math.pow(rng(), 1.6), el = 7 + t * 15, a = az * Math.PI / 180, hl = rng.range(90, 230) * (1 - 0.4 * t);
        azel(az, el, v1).multiplyScalar(SR);
        const col = rng.chance(0.6) ? K.org : rng.chance(0.5) ? K.yel : rose;
        skySet.add(0, v1.x, v1.y, v1.z, Math.cos(a) * hl, rng.range(-0.12, 0.12) * hl, Math.sin(a) * hl, rng.range(16, 30), col, (1.5 - t) * rng.range(0.7, 1.2), rng(), 6, 0, 1, 0, 0, 1);
      }
    }
    if (hour === 'dawn') {
      const yg = mix(K.yel, new THREE.Color('#9CCB4A'), 0.55);
      for (let i = 0; i < 320; i++) {
        const az = rng.gauss() * 55, t = Math.pow(rng(), 1.5), el = 1.5 + t * 9.5, a = az * Math.PI / 180, hl = rng.range(90, 220);
        azel(az, el, v1).multiplyScalar(SR);
        skySet.add(0, v1.x, v1.y, v1.z, Math.cos(a) * hl, rng.range(-0.1, 0.1) * hl, Math.sin(a) * hl, rng.range(15, 28), rng.chance(0.7) ? yg : K.yel, (1.25 - t) * rng.range(0.4, 0.65), rng(), 6, 0, 1, 0, 0, 1);
      }
      azel(rng.sign() * rng.range(26, 36), rng.range(27, 33), v1);          // one huge morning star
      const cx = v1.x * SR, cy = v1.y * SR, cz = v1.z * SR;
      for (let j = 0; j < 4; j++) {
        const nd = 12 + 6 * j, r = SR * (1.7 + 1.5 * j) * Math.PI / 180, sp = (j % 2 ? -1 : 1) * 0.42 / (1 + 0.3 * j);
        for (let k = 0; k < nd; k++) skySet.add(3, cx, cy, cz, k / nd * TAU + rng.range(-0.1, 0.1), r * rng.range(0.94, 1.06), 0.55 * Math.PI / nd, rng.range(20, 30),
          (j + k) % 3 ? K.yel : white, 2.8 - 0.5 * j, rng(), sp, -v1.x, -v1.y, -v1.z, 0, 1);
      }
      for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI; skySet.add(0, cx, cy, cz, Math.cos(a) * 75, Math.sin(a) * 75, 0, 34, k % 2 ? white : K.yel, 5, rng(), 0, 0, 1, 0, 0, 1); }
    }
    if (skySet.count) { const m = skySet.mesh(skyMat, 1); m.renderOrder = -0.5; skyGroup.add(m); }

    // ---------- rain; the rare event's falling flecks and their rings on the river ----------
    const airSet = makeSet();
    if (rain) {
      const rc = mix(K.cer, white, 0.5, 0.5);
      for (let i = 0; i < Math.round(1500 * detail); i++) airSet.add(6, rng.range(0, 140), rng.range(0, 90), rng.range(0, 140), rng.range(26, 38), rng.range(1.2, 2.3), 0.4, 0.035, rc, 0, rng(), 0, 0, 1, 0, 0, jit());
    }
    if (rare) {
      for (let i = 0; i < 620; i++) airSet.add(6, rng.range(0, 140), rng.range(0, 90), rng.range(0, 140), rng.range(8, 14), rng.range(0.5, 0.9), 0.15, 0.3, K.yel, 3.4, rng(), 1, 0, 1, 0, 0, 1);
      for (let i = 0; i < 64; i++) {                         // where a fleck lands: a ring of twelve dashes opening on the water
        const z = rng.range(372, 624), x = pathX(z) + rng.range(-25, 25), ph = rng(), R = rng.range(5, 9), a0 = rng.range(0, TAU);
        for (let k = 0; k < 12; k++) airSet.add(7, x, RIVER + 0.12, z, a0 + k / 12 * TAU, ph, R, 0.35, k % 4 === 3 ? white : K.yel, 3, rng(), 0, 0, 1, 0, 0, 1);
      }
    }

    // ---------- things moved on the CPU: crows (or swifts), heron, cart (or lamplighter), windmill ----------
    const dyn = makeSet(), NC = 90;
    // each bird: two hinged wing strokes in near-black and a short cerulean stroke along its back (the rim that
    // lifts it off the ultramarine)
    const crowCol = mix(K.ultra, K.cyp, 0.5, swifts ? 0.2 : 0.12), crowRim = mix(K.cer, K.cobalt, 0.35, swifts ? 0.5 : 0.42), dark = mix(K.ultra, K.cyp, 0.5, 1.3);
    for (let i = 0; i < NC; i++) {
      for (let k = 0; k < 2; k++) dyn.add(0, 0, -500, 0, 0, 0.1, 0, swifts ? 0.13 : 0.2, crowCol, 0, rng(), 0, 0, 1, 0, 0, 1);
      dyn.add(0, 0, -500, 0, 0, 0.1, 0, 0.08, crowRim, 0, rng(), 0, 0, 1, 0, 0, 1);
    }
    const heronCol = new THREE.Color(0.6, 0.64, 0.62);
    const hI = dyn.count; for (let i = 0; i < 4; i++) dyn.add(0, 0, -500, 0, 0, 0.1, 0, i === 0 ? 0.24 : i === 3 ? 0.13 : 0.4, heronCol, 0.22, rng(), 0, 0, 1, 0, 0, 1);
    const cI = dyn.count; for (let i = 0; i < 3; i++) dyn.add(0, 0, -500, 0, 0, 0.1, 0, i === 2 ? 0.4 : 0.9, dark, 0, rng(), 0, 0, 1, 0, 0, 1);
    dyn.add(0, 0, -500, 0, 0, 0.3, 0, 0.36, lamp, 7, 0.5, 0, 0, 1, 0, 0, 1);
    const mI = dyn.count; for (let i = 0; i < 4; i++) dyn.add(0, 0, -500, 0, 0, 1, 0, 1.5, mix(white, ochre, 0.4, 0.6), 0, rng(), 0, 0, 1, 0, 0, 1);
    const dynMesh = dyn.mesh(farMat, 1, true), aPd = dynMesh.geometry.getAttribute('aP'), aDd = dynMesh.geometry.getAttribute('aD');
    const setS = (i, px, py, pz, dx, dy, dz, hw) => { const a = aPd.array, d = aDd.array, o = i * 4; a[o] = px; a[o + 1] = py; a[o + 2] = pz; d[o] = dx; d[o + 1] = dy; d[o + 2] = dz; if (hw !== undefined) d[o + 3] = hw; };
    // the eruption: the flock is hidden in the wheat along the flight line; each bird bursts up as the lens
    // comes within ~35 m of it, skims ahead with the camera, and is then lifted into the eddy of its star
    const UE = 0.30, LAUNCH = 0.028;
    let stars = A.stars.filter((s) => s.dir[1] > 0.2 && s.dir[1] < 0.75 && s.dir[2] < -0.25);
    if (stars.length < 2) stars = A.stars.filter((s) => s.dir[1] > 0.22 && s.dir[2] < 0.35);
    if (stars.length < 2) stars = A.stars;
    const starFrames = stars.map((s) => { const d = new THREE.Vector3(...s.dir), e1 = new THREE.Vector3(0, 1, 0).cross(d).normalize(), e2 = d.clone().cross(e1); return { s, d, e1, e2 }; });
    const crows = [];
    for (let i = 0; i < NC; i++) {
      const du = rng.range(LAUNCH, 0.075), hp = path.pointAt(UE + du, v1), hx = hp.x + rng.sign() * (2.4 + Math.abs(rng.gauss()) * 6.5), hz = hp.z;
      crows.push({ u0: UE + du - LAUNCH, hx, hy: ground(hx, hz) + 0.4, hz, f: rng.pick(starFrames), r: rng.range(7, 44), a0: rng.range(0, TAU), w: rng.range(0.7, 1.3), f0: rng(), ph: rng.range(0, TAU),
        sx: rng.gauss() * 4, lift: rng.range(2.5, 11), dur: rng.range(4, 7), run: rng.range(17, 27) });
    }
    const seat = new THREE.Vector3(...A.portalSeat.position), axB = new THREE.Vector3(...A.portalSeat.normal), eyP = new THREE.Vector3(0, Math.cos(14 * Math.PI / 180), Math.sin(14 * Math.PI / 180));
    function crowAt(c, time, s, drain, cam, out) {
      // wheeling: 120 m off toward the bird's star, turning with that whirlpool, nearly locked to the lens so
      // the birds cross the star's bright rings
      const F = c.f, st = F.s, a = c.a0 + st.spin * time * TAU / st.period * c.w * 1.5;
      const ca = Math.cos(a) * c.r, sa = Math.sin(a) * c.r;
      let x = cam.x * 0.92 + F.d.x * 120 + F.e1.x * ca + F.e2.x * sa, y = cam.y + Math.max(20, F.d.y * 120) + F.e1.y * ca + F.e2.y * sa, z = cam.z * 0.92 - 10 + F.d.z * 120 + F.e1.z * ca + F.e2.z * sa;
      if (drain > 0) {
        const f = (((c.f0 - time * 0.03) % 1) + 1) % 1, Dd = 30 + 430 * f, rad = 12 + 30 * f, an = c.a0 + time * 0.8 + f * 9, k = sstep(0.1, 0.9, drain);
        const tx = seat.x + axB.x * Dd + Math.cos(an) * rad, ty = seat.y + axB.y * Dd + eyP.y * Math.sin(an) * rad, tz = seat.z + axB.z * Dd + eyP.z * Math.sin(an) * rad;
        x = lerp(x, tx, k); y = lerp(y, ty, k); z = lerp(z, tz, k);
      }
      const e = sstep(0.9, c.dur, s), b = sstep(0, 0.8, s) * (1 - e), run = c.run * s * (1 - e);
      return out.set(lerp(c.hx - run * 0.12, x, e) + c.sx * b * Math.min(1, s * 0.6), lerp(c.hy, y, e) + c.lift * b + Math.sin(s * 5 + c.ph) * 0.5 * b, lerp(c.hz - run, z, e));
    }
    const WM = { x: 565, z: 640 }; WM.y = ground(WM.x, WM.z);
    bases.push(tinted(new THREE.CylinderGeometry(2.6, 4.4, 18, 8), mix(K.cobalt, K.cer, 0.35, 0.6), M.makeTranslation(WM.x, WM.y + 9, WM.z)));
    bases.push(tinted(new THREE.ConeGeometry(3.4, 4.5, 8), mix(K.ultra, K.cobalt, 0.4, 1.4), M.makeTranslation(WM.x, WM.y + 20.2, WM.z)));
    const HR = { x: -24, z: 556, y: RIVER };       // the heron stands in a reed bed in the shallows, 20 m left of the line
    {
      const reed = [mix(K.vir, K.yel, 0.25, 1.1), ochre.clone().multiplyScalar(0.55), mix(K.cyp, K.vir, 0.5, 1.6), mix(K.vir, K.cer, 0.2, 1.2)];
      for (let i = 0; i < 90; i++) {
        const a = rng.range(0, TAU), r = 1.2 + Math.abs(rng.gauss()) * 2.6, L = rng.range(1.0, 2.3);
        fieldSet.add(1, HR.x + Math.cos(a) * r * 1.5, RIVER - 0.1, HR.z + Math.sin(a) * r, rng.range(-0.2, 0.2) * L, L, rng.range(-0.2, 0.2) * L, rng.range(0.07, 0.11), rng.pick(reed), 0, rng(), 0, 0, 1, 0, 0, jit());
      }
    }

    // ---------- assemble ----------
    const baseMesh = new THREE.Mesh(mergeGeometries(bases), paintMat); baseMesh.frustumCulled = false; baseMesh.name = 'painted-bases'; scene.add(baseMesh);
    for (const g of bases) g.dispose();
    await ctx.yield();
    scene.add(cypSet.mesh(farMat, 4), fieldSet.mesh(nearMat, 1), townSet.mesh(farMat, 1), smokeSet.mesh(farMat, 4), lampSet.mesh(farMat, 1), hillSet.mesh(farMat, 1), dynMesh);
    if (airSet.count) scene.add(airSet.mesh(nearMat, 1));
    await ctx.yield();

    const wheelDir = new THREE.Vector3(A.wheelDir[0], A.wheelDir[1] * 0.5, A.wheelDir[2]).normalize(), poiV = new THREE.Vector3(), poiC = new THREE.Vector3(), camP = new THREE.Vector3(), c0 = new THREE.Vector3(), c1 = new THREE.Vector3();
    const pois = [
      // the opening: turn into the hero cypress as the camera brushes up its flank, so the frame is all strokes
      { at: (time, u) => { path.pointAt(u, poiC); return poiC.set(-5, poiC.y + 3, 1150); }, from: 0.01, to: 0.046, weight: 0.8 },
      { at: (time, u) => path.pointAt(u, poiV).addScaledVector(wheelDir, 600), from: 0.06, to: 0.28, weight: 0.85 },
      { at: [-30, -66, 520], from: 0.32, to: 0.47, weight: 0.3 },
    ];
    const bell = (x, a, b, w) => sstep(a, a + w, x) * (1 - sstep(b - w, b, x));
    const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

    return {
      scene, path, duration,
      // linger on the cypress, sweep the valley, ease into the approach
      pace: (u) => 0.42 + 0.72 * sstep(0.02, 0.1, u) - 0.14 * sstep(0.72, 0.9, u),
      title: hour === 'dawn' ? 'The Turning Night, before dawn' : hour === 'dusk' ? 'The Turning Night, last of dusk' : 'The Turning Night',
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.5, far: 6500, lookAhead: 28, sway: 0.6, bank: 0.8 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#F6D54A', glow: 1, tilt: true, revealDistance: 320 },
      post: {
        exposure: hour === 'dawn' ? 1.0 : 1.12,
        bloom: { strength: 0.4, radius: 0.55, threshold: 0.95 },
        grade: { saturation: 1.1, contrast: 1.05, tint: '#fff3dc', shadowTint: '#050a24', vignette: 0.36, grain: 0.035, aberration: 0 },
      },
      update(dt, time, camera, u) {
        camP.setFromMatrixPosition(camera.matrixWorld); if (camP.lengthSq() === 0) camP.copy(camera.position);
        const rem = (1 - u) * LEN, drain = sstep(0.70, 0.93, u), rareAmt = rare ? bell(u, 0.46, 0.72, 0.05) : 0;
        // seconds of drain behind us, as a pure function of u: the rings spin up the same at any flight speed
        const dx = clamp((u - 0.70) / 0.23, 0, 1), accum = (0.23 * (dx * dx * dx - 0.5 * dx * dx * dx * dx) + Math.max(0, u - 0.93)) * duration;
        hero.setDrain(drain, accum); hero.setArrive(sstep(175, 18, rem));
        if (rare) { hero.setSync(rareAmt); hero.uniforms.uBump.value = 0.85 + 0.5 * rareAmt; }
        hero.update(dt, time * timeK + (rare ? 9 * sstep(0.46, 0.72, u) : 0), camera);
        ctx.renderer.getDrawingBufferSize(bufSize);
        SU.uWeave.value = 1.5708 * Math.min(1, 1080 / Math.max(1, bufSize.y));      // a thread of ~4 pixels at 1080p, never finer
        SU.uTime.value = time; SU.uDrain.value = drain; SU.uSwitch.value = u; SU.uRare.value = rareAmt;
        skyGroup.position.copy(camP);
        fleet.position.set(0, Math.sin(time * 0.7) * 0.1, -30 + 60 * u); fleet.rotation.z = Math.sin(time * 0.45) * 0.008;
        // crows: hidden in the wheat, erupt round the lens, wheel round their star, then drain toward the moon
        const hz = swifts ? 5 : 3, hlMin = swifts ? 0.75 : 0.9, hwMin = swifts ? 0.13 : 0.2;
        for (let i = 0; i < NC; i++) {
          const c = crows[i], s = (u - c.u0) * duration, o = i * 3;
          if (s <= 0) { setS(o, 0, -500, 0, 0, 0.1, 0); setS(o + 1, 0, -500, 0, 0, 0.1, 0); setS(o + 2, 0, -500, 0, 0, 0.1, 0); continue; }
          crowAt(c, time, s, drain, camP, c0); crowAt(c, time + 0.08, s + 0.08, drain, camP, c1);
          c1.sub(c0); const fl = Math.hypot(c1.x, c1.z) || 1, sxn = -c1.z / fl, szn = c1.x / fl, vl = c1.length() || 1;
          const dist = c0.distanceTo(camP), hl = Math.max(hlMin, dist * 0.02), hw = Math.max(hwMin, dist * 0.004);
          const fa = Math.sin(time * TAU * hz + c.ph) * 0.9, cf = Math.cos(fa) * hl, sf = Math.sin(fa) * hl;
          setS(o, c0.x + sxn * cf * 0.5, c0.y + sf * 0.5, c0.z + szn * cf * 0.5, sxn * cf * 0.5, sf * 0.5, szn * cf * 0.5, hw);
          setS(o + 1, c0.x - sxn * cf * 0.5, c0.y + sf * 0.5, c0.z - szn * cf * 0.5, -sxn * cf * 0.5, sf * 0.5, -szn * cf * 0.5, hw);
          const bl = hl * 0.42 / vl;
          setS(o + 2, c0.x, c0.y + hw * 0.35, c0.z, c1.x * bl, c1.y * bl, c1.z * bl, hw * 0.5);
        }
        {                                                     // the heron lifts off ahead as the camera drops to the river
          const hs = Math.max(0, (u - 0.44) * duration), k = hs * hs / (hs + 1.5), t = sstep(0, 1.2, hs);
          const x = HR.x + k * 2.2, y = HR.y + 1.0 + k * 1.6, z = HR.z - k * 12;
          setS(hI, x, y + 0.3, z, lerp(0.1, 0.15, t), lerp(0.8, 0.1, t), lerp(0, -0.8, t));
          setS(hI + 3, x + lerp(0.15, 0.2, t), y + lerp(1.35, 0.45, t), z - lerp(0.1, 1.15, t), lerp(0.1, 0.05, t), lerp(0.45, 0.08, t), lerp(-0.15, -0.45, t));
          const fa = Math.sin(time * TAU * 1.3) * 0.75 * t, wl = lerp(0.1, 3.2, t);
          for (const sd of [-1, 1]) setS(hI + (sd > 0 ? 1 : 2), x + sd * Math.cos(fa) * wl * 0.5 * t, y + 0.35 + Math.sin(fa) * wl * 0.5, z, sd * Math.cos(fa) * wl * 0.5 + (1 - t) * 0.02, Math.sin(fa) * wl * 0.5 + (1 - t) * 0.3, 0);
        }
        if (lamplighter) {                                    // a light walking the left quay, lighting lamps
          const z = lerp(690, 390, clamp((u - 0.3) / 0.5, 0, 1)), x = -46.9, y = ground(x, z, false) + 1.2, bob = Math.abs(Math.sin(time * 5)) * 0.1;
          setS(cI, x, y + bob, z, 0, 1.15, 0.12, 0.42); setS(cI + 1, 0, -500, 0, 0, 0.1, 0, 0.4); setS(cI + 2, x, y + 3.0, z - 0.6, 0, 2.1, -0.6, 0.14);
          setS(cI + 3, x, y + 5.3 + bob, z - 1.25, 0, 0.36, 0, 0.34);
        } else {                                              // the horse cart crossing the bridge, over the central arch as the camera passes under
          const x = clamp((u - 0.67) * 110, -60, 60), y = deckY(x) + 0.9, bob = Math.sin(time * 6) * 0.1, sw = Math.sin(time * 2.2);
          setS(cI, x + 4.7, y + 2.3 + bob, BZ, 2.3, 0.27, 0, 0.9); setS(cI + 1, x - 2.9, y + 2.0, BZ, 2.9, 0, 0, 0.9); setS(cI + 2, x + 7.4, y + 4.0 + bob, BZ, 0.63, 1.1, 0, 0.4);
          setS(cI + 3, x + 0.7, y + 5.1 + sw * 0.15, BZ + sw * 0.4, 0, 0.42, 0, 0.36);
        }
        for (let k = 0; k < 4; k++) {                         // windmill sails, one turn every 8 s
          const a = time * TAU / 8 * (mistral ? 1.6 : 1) + k * Math.PI / 2, cy = Math.cos(a), sz = Math.sin(a);
          setS(mI + k, WM.x - 4.6, WM.y + 17 + cy * 8, WM.z + sz * 8, 0, cy * 7.5, sz * 7.5);
        }
        aPd.needsUpdate = true; aDd.needsUpdate = true;
      },
      dispose() { hero.dispose(); },
    };
  },
};
