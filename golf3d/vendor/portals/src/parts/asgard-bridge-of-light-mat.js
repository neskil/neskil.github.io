// THE GOLDEN CITY AND ITS BRIDGE: the materials everything of ours is drawn with, and the light they share.
// THE LIGHT (night): the sky's cool light from above; one warm key, high in the north-west (so the palace's front, which faces
// the rim, catches it); the city's own warm light on whatever stands on the island; the bridge's
// rainbow light on whatever stands beside it. Polished gold also holds the sky as a sheen and the key as a bright streak.
// IMAGES: each solid material carries a second one (userData.image) for the same thing drawn turned over about the sea's sheet.
// SINCE ROUND TWO the city and the gate house draw with their own materials (they take LIGHT_GLSL, twin and bridgeMat from here):
// solid and fallMat are kept as they were, but no part uses them now.
import * as THREE from 'three';
import * as fx from '../kit/fx.js';
import { BRIDGE, CITY, HOUSE, MIRROR_GLSL, spikeAt } from './asgard-bridge-of-light-plan.js';

const F1 = (v) => v.toFixed(1);
// uGlowP: the three places whose light the mist beyond the rim takes: the gate house's globe, and the beam 250 m and 900 m out from the spike's point
export function makeShared(fog) {
  return { uTime: { value: 0 }, uFogColor: { value: fog.color }, uFogDensity: { value: fog.density },
    uGlowP: { value: [new THREE.Vector3(HOUSE.x, HOUSE.y, HOUSE.z), new THREE.Vector3(...spikeAt(HOUSE.spike + 250)), new THREE.Vector3(...spikeAt(HOUSE.spike + 900))] } };
}

export const LIGHT_GLSL = /* glsl */`
uniform float uTime, uFogDensity; uniform vec3 uFogColor;
${MIRROR_GLSL}
vec3 abFog(vec3 c, vec3 w){ float d = length(w - cameraPosition)*uFogDensity; return mix(uFogColor, c, exp(-d*d)); }
const vec3 AB_KEY = vec3(-.418, .518, -.746);      // the key light: high in the north-west, so the faces toward the bridge are lit
vec3 abBridge(vec3 w, vec3 n){      // the bridge's light on a thing beside it: the colours that are passing that stretch of it
  float z = clamp(w.z, ${F1(BRIDGE.z1)}, ${F1(BRIDGE.z0)}); vec3 t = vec3(0., ${F1(BRIDGE.y)}, z) - w; float d2 = dot(t, t);
  return abHue(z*.0031 - uTime*.11)*(.4 + .6*max(dot(n, t*inversesqrt(d2 + 1.)), 0.))*120./(d2 + 400.);
}
vec3 abLight(vec3 w, vec3 n){
  float city = 1. - smoothstep(${F1(CITY.r * 0.9)}, ${F1(CITY.r + 260)}, length(w.xz - vec2(${F1(CITY.x)}, ${F1(CITY.z)})));
  return vec3(.10, .14, .27)*(.6 + .4*n.y) + vec3(1., .86, .62)*1.1*max(dot(n, AB_KEY), 0.) + vec3(1., .70, .36)*.30*city*(1. - .45*n.y) + abBridge(w, n);
}
`;

const VERT = /* glsl */`
varying vec3 vW, vN; varying vec2 vUv;
void main(){
  vec4 p = vec4(position, 1.); vec3 n = normal;
  #ifdef USE_INSTANCING
  p = instanceMatrix*p; n = mat3(instanceMatrix)*n;
  #endif
  vec4 w = modelMatrix*p; vW = w.xyz; vN = mat3(modelMatrix)*n; vUv = uv;
  gl_Position = projectionMatrix*viewMatrix*w;
}`;
const FRAG = /* glsl */`
precision highp float;
varying vec3 vW, vN; varying vec2 vUv; uniform vec3 uColA, uColB; uniform vec2 uRib;
${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}
${LIGHT_GLSL}
void main(){
  vec3 w = vW, n = normalize(vN), cam = cameraPosition;
  #ifdef MIRROR
  float mk = abMirror(w); if(mk < .01) discard;
  w.y = -w.y; n.y = -n.y; cam.y = -cam.y;      // an image is lit as the thing itself is
  #endif
  vec3 v = normalize(cam - w), alb, emit = vec3(0.); float gloss = 0.;
  #if KIND == 0
  // the island's rock: beds one over another, each of its own tone, stained; the terraces' flat tops are paved pale gold
  float bed = w.y*.13 + .9*vnoise(w.xz*.021) + .5*vnoise(vec2(dot(w.xz, vec2(.07, .05)), w.y*.2)), bt = hash11(floor(bed)*7.31);
  alb = mix(uColB, uColA, .3 + .5*bt)*(.6 + .7*vnoise(vec2(dot(w.xz, vec2(.05, .03)), w.y*.07)));
  alb *= .8 + .2*smoothstep(0., .14, fract(bed))*smoothstep(0., .1, 1. - fract(bed));
  float brg = atan(w.x - ${F1(CITY.x)}, w.z - ${F1(CITY.z)});
  alb *= .5 + .5*smoothstep(.22, .46, vnoise(vec2(brg*70., w.y*.035 + 3.)));      // upright clefts down the cliffs
  float lvl = smoothstep(.8, .97, n.y); vec2 pv = fract(w.xz/7.);
  alb = mix(alb, vec3(.56, .46, .28)*(.75 + .25*smoothstep(0., .05, pv.x)*smoothstep(0., .05, pv.y)), lvl);
  #elif KIND == 1
  // polished gold, fluted round if the thing is a tube
  alb = uColA*(uRib.x > 0. ? .8 + .2*cos(vUv.x*uRib.x*6.2832) : 1.); gloss = 1.;
  #elif KIND == 2
  // pale gold walls with rows of tall openings, some of them lit
  float along = abs(n.x) > abs(n.z) ? w.z : w.x; vec2 cell = vec2(along/5., w.y/7.), ci = floor(cell), cf = fract(cell);
  float win = step(.32, cf.x)*step(cf.x, .68)*step(.2, cf.y)*step(cf.y, .82)*step(abs(n.y), .5), lit = step(.42, hash11(ci.x*17.3 + ci.y*71.7 + 3.));
  alb = uColA*(.8 + .25*vnoise(vec2(along, w.y)*.21)); alb = mix(alb, uColB, win*(1. - lit)*.85);
  emit = vec3(1., .72, .34)*win*lit*1.25; gloss = .25;
  #else
  // gold in ribbed plates: seams between the plates, a rib down each
  vec2 pc = vUv*uRib, pf = fract(pc);
  float seam = smoothstep(0., .05, pf.x)*smoothstep(0., .05, 1. - pf.x)*smoothstep(0., .08, pf.y)*smoothstep(0., .08, 1. - pf.y);
  alb = uColA*(.5 + .5*seam)*(.82 + .18*cos(pf.x*6.2832))*(.85 + .3*hash11(floor(pc.x) + floor(pc.y)*37.)); gloss = .9;
  #endif
  vec3 col = alb*(abLight(w, n) + vec3(1., .8, .5)*.16*step(.01, gloss));      // gold keeps a little light of its own by night
  #if KIND == 0
  col = mix(col, vec3(dot(col, vec3(.3, .5, .2)))*vec3(.82, .92, 1.14), .6);      // stone stays cool grey under the city's warm light
  #endif
  vec3 r = reflect(-v, n);
  vec3 env = mix(vec3(.36, .26, .13), vec3(.07, .10, .23), smoothstep(-.15, .6, r.y)) + vec3(.9, .7, .4)*1.5*pow(max(dot(r, AB_KEY), 0.), 22.);
  col += alb*env*gloss*(.35 + .65*pow(1. - max(dot(n, v), 0.), 3.))*1.3 + vec3(1., .92, .74)*1.2*gloss*pow(max(dot(r, AB_KEY), 0.), 90.) + emit;
  col = abFog(col, vW);
  #ifdef MIRROR
  gl_FragColor = vec4(col*.85, .62*mk);
  #else
  gl_FragColor = vec4(col, 1.);
  #endif
}`;
const KINDS = { rock: 0, gold: 1, wall: 2, plate: 3 };
// solid({ kind, a, b, rib }): a lit surface of ours. rib: for gold, the count of flutes round a tube (0: none); for plates, the count of plates round and up
export function solid(shared, o) {
  const make = (mirror) => new THREE.ShaderMaterial({ name: 'abSolid-' + o.kind + (mirror ? '-image' : ''), vertexShader: VERT, fragmentShader: FRAG,
    defines: mirror ? { KIND: KINDS[o.kind], MIRROR: 1 } : { KIND: KINDS[o.kind] }, transparent: mirror, side: o.side ?? THREE.FrontSide,
    uniforms: { ...shared, uColA: { value: new THREE.Color(o.a) }, uColB: { value: new THREE.Color(o.b || '#000000') }, uRib: { value: new THREE.Vector2(...(o.rib || [0, 0])) } } });
  const m = make(false); m.userData.image = make(true); return m;
}
// the same thing a second time for its image in the sea (the caller puts it under a group turned over about y 0)
export function twin(mesh, image = mesh.material.userData.image) {
  const m = mesh.isInstancedMesh ? new THREE.InstancedMesh(mesh.geometry, image, mesh.count) : new THREE.Mesh(mesh.geometry, image);
  if (mesh.isInstancedMesh) m.instanceMatrix = mesh.instanceMatrix;
  m.position.copy(mesh.position); m.quaternion.copy(mesh.quaternion); m.scale.copy(mesh.scale); m.renderOrder = 0.3; m.frustumCulled = false; return m;
}

// THE BRIDGE: clear crystal with fine threads of every colour inside it, the rainbow lying across its width. The threads are
// continuous: each wanders a little as it runs, none is a ruled lane; packets of soft light race along them toward the rim (92 and
// 61 m a second, 64 and 150 m long: a place brightens less than twice a second). A second, dimmer set lies 0.9 m deeper and shifts
// against the first as the eye moves; in the slab's sides the threads lie one above another. On each thread a white-hot glint
// with a short tail races toward the rim. The body is clear and pale: the stars under it show through its top, its long edges
// and sides are bright. Every thread is filtered by the pixel's footprint: far off they melt into one soft pale band.
// `seed` (the world's own stream's number) shifts the threads' places.
export function bridgeMat(shared, seed, mirror = false) {
  return new THREE.ShaderMaterial({ name: 'abBridge' + (mirror ? '-image' : ''), transparent: mirror, defines: mirror ? { MIRROR: 1 } : {}, uniforms: { ...shared, uSeed: { value: seed } },
    vertexShader: VERT, fragmentShader: /* glsl */`precision highp float; varying vec3 vW, vN; varying vec2 vUv; uniform float uSeed;
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}
      ${LIGHT_GLSL}
      float abH2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
      float abStarsBelow(vec3 d){      // the stars that lie under the crystal (in open space, or held by the sea), seen through it
        vec2 g = vec2(atan(d.z, d.x + 1e-5*step(abs(d.x) + abs(d.z), 1e-5))*70., d.y*110.), c = floor(g), f = fract(g) - .5;
        vec2 o = (vec2(abH2(c + 7.3), abH2(c + 3.1)) - .5)*.6;
        return step(.9, abH2(c))*(1. - smoothstep(.05, .2, length(f - o)))*(.4 + .6*abH2(c + 1.7));
      }
      float abLine(float u, float w0){ float fu = fwidth(u), w = w0 + fu, dd = abs(fract(u) - .5);      // one thread in each unit of u, filtered by the footprint
        return (1. - smoothstep(w*.4, w, dd))*min(w0/w*1.6, 1.)*clamp(1.6 - fu*1.6, 0., 1.); }
      vec2 abThread(vec2 p, float sd){      // the light at a place (across, along; metres): x the threads' coloured light, y their white-hot glints
        float wob = vnoise(vec2(p.x*.35 + sd, p.y*.011)) - .5;                      // each thread wanders half a metre or so as it runs
        float u1 = (p.x + wob*1.3)*1.9 + sd, u2 = (p.x - wob*.9)*4.7 + sd*1.3;      // threads half a metre apart, and finer ones between
        float i1 = floor(u1), i2 = floor(u2), h1 = hash11(i1*7.3 + 1.), h2 = hash11(i2*3.1 + 5.);      // no two threads alike
        float run = .75*smoothstep(.30, .80, vnoise(vec2(p.x*.9 + sd, (p.y + uTime*92.)/64.))) + .65*smoothstep(.35, .85, vnoise(vec2(p.x*.37 + 5., (p.y + uTime*61.)/150.)));
        float l1 = abLine(u1, .06), l2 = abLine(u2, .08), melt = clamp(fwidth(u1)*1.6 - .6, 0., 1.);
        // a glint on each thread: a white-hot head with a short tail, racing toward the rim (70 to 130 m a second, one every 90 to 210 m: a place sees at most 1.5 a second)
        float s1 = fract((p.y + uTime*(70. + 60.*h1))/(90. + 120.*hash11(i1*1.3 + 4.)) + h1*7.), s2 = fract((p.y + uTime*(80. + 50.*h2))/(110. + 100.*hash11(i2*2.1 + 9.)) + h2*5.);
        float g1 = smoothstep(0., .012, s1)*(1. - smoothstep(.012, .16, s1)), g2 = smoothstep(0., .015, s2)*(1. - smoothstep(.015, .14, s2));
        float seen = clamp(1.5 - fwidth(p.y)*.05, 0., 1.);                          // a glint is lost where a pixel is longer than it
        return vec2((l1*(.35 + .65*h1) + .6*l2*(.2 + .8*h2))*(.2 + 1.6*run) + .2*run*melt + .015*run, (l1*g1 + .5*l2*g2)*seen + .015*melt*run);      // far off the threads melt into the packets' soft light
      }
      void main(){
        #ifdef MIRROR
        float mk = abMirror(vW);
        #endif
        vec3 ev = cameraPosition - vW, n = vN*inversesqrt(max(dot(vN, vN), 1e-8)), vd = ev*inversesqrt(max(dot(ev, ev), 1e-8)); float top = step(.5, abs(n.y)), ndv = abs(dot(n, vd)), ay = abs(vW.y);
        float across = mix(clamp((ay - ${F1(BRIDGE.y - BRIDGE.t)})/${F1(BRIDGE.t)}, 0., 1.), vW.x/${F1(BRIDGE.w)} + .5, top);      // the rainbow lies across the top; in a side, through its thickness
        vec2 p = mix(vec2(ay*5. + 40., vW.z), vW.xz, top);
        vec2 deep = vW.xz - vd.xz/max(abs(vd.y), .12)*.9;      // the place 0.9 m under the top where the sight line passes
        vec2 t1 = abThread(p, uSeed), t2 = top*abThread(deep, uSeed + 4.3);
        vec3 hue = abHue(across*.85 + .03*sin(vW.z*.013 + across*9.)), pale = mix(hue, vec3(1.), .15);      // light in crystal is paler than paint
        float rim = mix(1., smoothstep(${F1(BRIDGE.w / 2 - 0.8)}, ${F1(BRIDGE.w / 2)}, abs(vW.x)), top);      // its long edges and its sides catch the light
        vec3 col = vec3(.022, .032, .058) + vec3(.8, .88, 1.)*abStarsBelow(-vd)*.9*top      // the clear body: what lies under it shows through, stars among it
          + pale*(.03 + 1.7*t1.x + .6*t2.x) + vec3(1., .97, .92)*(2.4*t1.y + .9*t2.y)      // the threads' light and their white-hot glints
          + (pale*.45 + vec3(.10, .13, .20))*rim*.55 + vec3(.045, .06, .10)*pow(clamp(1. - ndv, 0., 1.), 3.)*top;      // bright edges; the sky's sheen on its top at a low angle
        col = abFog(col, vW);
        #ifdef MIRROR
        gl_FragColor = vec4(col*.8, .6*mk); if(mk < .01) discard;      // the discard comes last, after every derivative
        #else
        gl_FragColor = vec4(col, 1.);
        #endif
      }` });
}
// THE CITY'S FALLS: white water by night running down, warmed a little by the city's light
export function fallMat(shared) {
  return new THREE.ShaderMaterial({ name: 'abFall', transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...shared },
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: VERT, fragmentShader: /* glsl */`precision highp float; varying vec3 vW, vN; varying vec2 vUv;
      ${fx.GLSL_HASH}${fx.GLSL_VALUE_NOISE}
      ${LIGHT_GLSL}
      void main(){ float t = vW.x + vW.z, s1 = vnoise(vec2(t*.9, vW.y*.12 + uTime*1.5)), s2 = vnoise(vec2(t*2.3 + 5., vW.y*.3 + uTime*2.6));
        float a = smoothstep(0., .22, vUv.x)*smoothstep(0., .22, 1. - vUv.x)*(.45 + .55*smoothstep(.3, .7, .6*s1 + .4*s2))*smoothstep(0., .06, 1. - vUv.y);
        vec3 col = abFog(vec3(.46, .54, .70)*(.55 + .6*s2) + vec3(1., .75, .4)*.10, vW); gl_FragColor = vec4(col*a, a); }` });
}
