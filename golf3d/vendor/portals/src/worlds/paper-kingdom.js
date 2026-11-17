// THE PAPER KINGDOM: a desk-top world folded from one sheet. White faceted paper hills with visible creases, a
// river of ink with folded boats, a quilled forest whose spirals uncurl as the camera passes, and the great pop-up
// book (src/parts/paper-kingdom.js) whose city unfolds in a wave before a thousand cranes pour through the hole
// cut in its standing page (the exit portal).
//
// Everything is self-lit paper: one flat-shading routine shared with the hero (a warm desk-lamp key from the upper
// left, lavender shade, warm transmission on back-lit faces), no real-time lights, no shadow maps.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, craneGeometry, GLSL_PAPER_LIGHT, FLY_THROUGH } from '../parts/paper-kingdom.js';

const BASE_PALETTE = ['#f4ecdc', '#e6dcc6', '#c9bda2', '#8a8272', '#2a2a3a', '#1f3fa8', '#e23a2a'];
const WATER_Y = -1.5;

const GLSL_NOISE = /* glsl */`
  float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float vnoise(vec3 p){
    vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    float n = i.x + i.y * 57. + i.z * 113.;
    return mix(mix(mix(h11(n), h11(n + 1.), f.x), mix(h11(n + 57.), h11(n + 58.), f.x), f.y),
               mix(mix(h11(n + 113.), h11(n + 114.), f.x), mix(h11(n + 170.), h11(n + 171.), f.x), f.y), f.z);
  }
`;

// ---------------------------------------------------------------------------------------------------------------
// the shared paper material. Variants (defines): CREASE (hairline along triangle edges from aBary), QUILL (coiled
// strips that uncurl), DEER (neck nod), SHADOW (the same animated shape flattened along the lamp's rays onto the
// ground under each instance: a true paper shadow). Sway (aAnim.x metres at unit scale) is always on.
// ---------------------------------------------------------------------------------------------------------------
function paperMaterial(U, defines = {}) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, vertexColors: true, defines,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uU: U.uU, uLightDir: U.uLightDir, uSun: U.uSun,
      uAmbSky: U.uAmbSky, uAmbShade: U.uAmbShade, uWarm: U.uWarm, uWind: U.uWind, uCloudT: U.uTime, uShadowCol: U.uShadowCol },
    vertexShader: /* glsl */`
      attribute vec3 aBary; attribute vec4 aAnim;
      #ifdef SHADOW
        attribute vec3 aGn; uniform vec3 uLightDir;
      #endif
      #ifdef QUILL
        attribute vec4 aQ, aQ2; attribute float aU;
      #endif
      uniform float uTime, uU, uWind;
      varying vec3 vView, vCol, vBary, vWorld;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position; vec3 col = color; float sw = aAnim.x, seed = 0., scl = 1.;
        #ifdef USE_INSTANCING
          seed = fract(instanceMatrix[3].x * .137 + instanceMatrix[3].z * .291);
          scl = length(instanceMatrix[1].xyz);
        #endif
        #ifdef USE_INSTANCING_COLOR
          col *= instanceColor;
        #endif
        #ifdef QUILL
          float open = smoothstep(aU - .13, aU - .025, uU);
          open = clamp(open * .94 + .06 + .06 * sin(uTime * .8 + seed * 40.), 0., 1.);
          if (aQ2.w > .5) {
            float s = mix(.6, 1., open), curl = mix(1., .40, open);
            float th = aQ.w - (1. - aQ.x) * aQ2.x * curl;
            float r = aQ.z * s * (.10 + .90 * aQ.x);
            vec2 c = aQ2.yz - aQ.z * s * vec2(cos(aQ.w), sin(aQ.w));
            p = vec3(c + r * vec2(cos(th), sin(th)), aQ.y);
          }
          sw = p.y * p.y * .035;
        #endif
        #ifdef DEER
          float graze = smoothstep(.5, .9, sin(uTime * .23 + seed * 30.));
          float ang = aAnim.y * (.10 * sin(uTime * .6 + seed * 17.) + graze * .9);
          vec2 q = p.yz - vec2(.95, .45); float cs = cos(ang), sn = sin(ang);
          p.yz = vec2(cs * q.x - sn * q.y, sn * q.x + cs * q.y) + vec2(.95, .45);
          p.x += aAnim.z * sin(uTime * 2.3 + seed * 9.) * .04;
        #endif
        vec4 wp = vec4(p, 1.);
        #ifdef USE_INSTANCING
          wp = instanceMatrix * wp;
        #endif
        wp = modelMatrix * wp;
        float ws = sw * scl * uWind;
        wp.x += ws * (sin(uTime * 1.15 + wp.x * .045 + wp.z * .03 + seed * 6.) + .4 * sin(uTime * 2.7 + wp.z * .11));
        wp.z += ws * .7 * cos(uTime * .93 + wp.z * .05 + seed * 4.);
        #ifdef SHADOW
          vec3 O = instanceMatrix[3].xyz + aGn * .5;
          vec3 Ls = normalize(vec3(uLightDir.x, max(uLightDir.y, .5), uLightDir.z));
          wp.xyz -= Ls * (dot(wp.xyz - O, aGn) / max(dot(Ls, aGn), .3));
        #endif
        vec4 mvPosition = viewMatrix * wp;
        vView = mvPosition.xyz; vWorld = wp.xyz; vCol = col; vBary = aBary;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vView, vCol, vBary, vWorld;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_PAPER_LIGHT}
      uniform vec3 uShadowCol;
      void main(){
      #ifdef SHADOW
        gl_FragColor = vec4(mix(uShadowCol, vec3(4.), smoothstep(380., 640., -vView.z)), 1.);   // MIN-blended: never darkens twice
      #else
        vec3 alb = vCol;
        vec3 fp = vWorld * vec3(.33, .9, .33);
        alb *= .93 + .11 * (vnoise(fp) * .6 + vnoise(fp * 4.3 + 11.) * .4);
        #ifdef CREASE
          float ed = min(min(vBary.x, vBary.y), vBary.z), aa = fwidth(ed) + 1e-5;
          float line = (1. - smoothstep(aa * .5, aa * 1.5, ed)) * (1. - smoothstep(.05, .22, aa));
          line *= mix(1., .4, smoothstep(250., 1400., -vView.z));
          alb *= 1. - .05 * (1. - smoothstep(0., .10, ed));          // the sheet darkens a little into each fold
          alb = mix(alb, alb * vec3(.64, .63, .76), line * .75);
        #endif
        vec3 n;
        gl_FragColor = vec4(paperLight(alb * .8, vView, 1., 1., n) * 1.06 + alb * vec3(.065, .065, .095), 1.);
      #endif
        #include <fog_fragment>
      }`,
  });
}

function shadowMaterial(U, defines) {
  const m = paperMaterial(U, { ...defines, SHADOW: '' });
  m.transparent = true; m.depthWrite = false; m.blending = THREE.CustomBlending; m.blendEquation = THREE.MinEquation; m.blendSrc = THREE.OneFactor; m.blendDst = THREE.OneFactor;
  m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2;
  return m;
}

// triangle soup with paper attributes. A vertex is [x, y, z, sway = 0, nod = 0, flick = 0].
function soup() {
  const P = [], C = [], B = [], A = [];
  const push = (v, col, bx, by, bz) => { P.push(v[0], v[1], v[2]); C.push(col.r, col.g, col.b); B.push(bx, by, bz); A.push(v[3] || 0, v[4] || 0, v[5] || 0, 0); };
  const S = {
    count: 0,
    tri(a, b, c, col) { push(a, col, 1, 0, 0); push(b, col, 0, 1, 0); push(c, col, 0, 0, 1); S.count++; },
    // quad a,b,c,d (in order round the outline): the diagonal is not drawn as a crease
    quad(a, b, c, d, col) {
      push(a, col, 1, 1, 0); push(b, col, 0, 1, 0); push(c, col, 0, 1, 1);
      push(a, col, 1, 1, 0); push(c, col, 0, 1, 1); push(d, col, 0, 1, 0); S.count += 2;
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aBary', new THREE.Float32BufferAttribute(B, 3));
      g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4));
      return g;
    },
  };
  return S;
}

// ---------------------------------------------------------------------------------------------------------------
// sky: a sheet of cream paper with fibres, a red tissue sun, pinholes with light behind. Centred on whichever
// camera is rendering (rotation only), so it is portal safe without any follow code.
// ---------------------------------------------------------------------------------------------------------------
function makeSky(U, sky, sunDir, sunCol, pinCol) {
  const sd2 = sunDir.clone().add(new THREE.Vector3(0.022, 0.03, -0.012)).normalize();
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTime: U.uTime, uSky: { value: sky }, uSunDir: { value: sunDir }, uSunDir2: { value: sd2 }, uSunCol: { value: sunCol }, uPin: { value: pinCol } },
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main(){ vDir = position; vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSky, uSunDir, uSunDir2, uSunCol, uPin; uniform float uTime; varying vec3 vDir;
      ${GLSL_NOISE}
      void main(){
        vec3 d = normalize(vDir); float el = asin(clamp(d.y, -1., 1.)), az = atan(d.z, d.x);
        vec3 col = uSky * mix(1.07, .86, smoothstep(-.05, .95, d.y));
        float f1 = vnoise(vec3(az * 16., el * 240., 1.)), f2 = vnoise(vec3(az * 170. + el * 110., el * 34., 5.)), f3 = vnoise(vec3(d * 7.));
        col *= .93 + .07 * f1 + .05 * f2 + .05 * f3;
        // pinholes
        vec2 g = vec2(az, el) * 57.2958 / 3.2, id = floor(g), f = fract(g) - .5;
        float h = h21(id); vec2 off = (vec2(h21(id + 7.3), h21(id + 3.1)) - .5) * .7;
        float r = length((f - off) * vec2(cos(el), 1.));
        float pin = step(.80, h) * (1. - smoothstep(.02, .05, r)) * smoothstep(.16, .42, d.y);
        col += uPin * pin * (1.9 + 1.5 * sin(uTime * (1. + h * 3.) + h * 50.));
        // tissue sun: a paler ragged sheet behind a red disc
        float ang = acos(clamp(dot(d, uSunDir), -1., 1.)), ang2 = acos(clamp(dot(d, uSunDir2), -1., 1.));
        float R = .108, aa = fwidth(ang) + 1e-4;
        float wob = (vnoise(d * 46.) - .5) * .010;
        float disc = 1. - smoothstep(R - aa, R + aa, ang + wob * .4);
        float disc2 = 1. - smoothstep(R * 1.26 - aa, R * 1.26 + aa, ang2 + wob * 2.);
        col = mix(col, mix(col, uSunCol * 1.25, .26), disc2);
        col += uSunCol * .35 * exp(-ang * ang / .05) * (1. - disc);
        vec3 tissue = uSunCol * (.84 + .16 * vnoise(d * 150.) + .12 * vnoise(d * 30.));        // below 1: stays tissue red, no clip to orange
        col = mix(col, tissue, disc);
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), mat);
  m.frustumCulled = false; m.renderOrder = -10; m.name = 'paper-sky';
  return m;
}

// three layers of torn-paper cloud flats sliding sideways round the camera like stage scenery, each with a
// crisp paper shadow on the sky sheet behind it
function makeClouds(rng, U, sky, tones) {
  const quad = new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', quad.getAttribute('position')); g.setIndex(quad.getIndex());
  const C = [], S = [], T = [];
  const dir = rng.chance(0.5) ? 1 : -1;
  const layers = [{ r: 2700, y: [240, 560], w: [700, 1300], sp: 0.006, n: rng.int(7, 10) }, { r: 2250, y: [460, 820], w: [520, 1000], sp: -0.0105, n: rng.int(6, 9) }, { r: 1850, y: [640, 1050], w: [380, 760], sp: 0.017, n: rng.int(5, 8) }];
  layers.forEach((L, li) => {
    for (let i = 0; i < L.n; i++) {
      const a = (i + rng.range(0.1, 0.9)) / L.n * Math.PI * 2, y = rng.range(L.y[0], L.y[1]), w = rng.range(L.w[0], L.w[1]), sd = rng();
      const tone = tones[(li + (rng.chance(0.25) ? 1 : 0)) % 3];
      for (const sh of [1, 0]) { C.push(a, y, L.r + sh * 12, w); S.push(L.sp * dir, sd, sh, li); T.push(tone.r, tone.g, tone.b); }
    }
  });
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(C), 4));
  g.setAttribute('aS', new THREE.InstancedBufferAttribute(new Float32Array(S), 4));
  g.setAttribute('aTone', new THREE.InstancedBufferAttribute(new Float32Array(T), 3));
  g.instanceCount = C.length / 4;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: false,
    uniforms: { uTime: U.uTime, uSky: { value: sky } },
    vertexShader: /* glsl */`
      attribute vec4 aC, aS; attribute vec3 aTone; uniform float uTime;
      varying vec2 vUv; varying vec4 vS; varying vec3 vTone;
      void main(){
        float a = aC.x + uTime * aS.x;
        vec3 ctr = vec3(cameraPosition.x + cos(a) * aC.z, aC.y, cameraPosition.z + sin(a) * aC.z);
        vec3 tang = vec3(-sin(a), 0., cos(a));
        vec3 p = ctr + tang * position.x * aC.w + vec3(0., position.y * aC.w * .40, 0.);
        p += aS.z * (tang * aC.w * .012 - vec3(0., aC.w * .016, 0.));
        vUv = vec2(position.x + .5, position.y); vS = aS; vTone = aTone;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSky; varying vec2 vUv; varying vec4 vS; varying vec3 vTone;
      ${GLSL_NOISE}
      void main(){
        float x = vUv.x, y = vUv.y, s = vS.y;
        float env = pow(max(sin(3.14159 * x), 0.), .55);
        float lob = max(abs(sin(x * 7. + s * 31.)), abs(sin(x * 11.3 + s * 17.)) * .8);
        float tear = (vnoise(vec3(vUv * vec2(70., 28.), s * 9.)) - .5) * .028;
        float top = .10 + env * (.30 + .55 * lob) + tear, bottom = .10 + .025 * sin(x * 23. + s * 9.) - tear;
        if (y < bottom || y > top || x < .015 || x > .985) discard;
        vec3 col = vTone * (.95 + .07 * vnoise(vec3(vUv * vec2(260., 40.), s)));
        col = mix(col, col * 1.10, 1. - smoothstep(0., .035, top - y));       // the torn edge shows the white core
        col *= mix(.90, 1., smoothstep(0., .30, y - bottom));
        if (vS.z > .5) col = uSky * vec3(.80, .79, .86);
        gl_FragColor = vec4(col, 1.);
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = -5; m.name = 'paper-clouds';
  return m;
}

// drifting paper scraps: tumbling instanced quads in a box that wraps round the rendering camera
function makeConfetti(rng, U, count, cols) {
  const quad = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', quad.getAttribute('position')); g.setIndex(quad.getIndex());
  const P = new Float32Array(count * 3), S = new Float32Array(count * 4), K = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    P.set([rng(), rng(), rng()], i * 3); S.set([rng(), rng(), rng(), rng.range(0.26, 0.62)], i * 4);
    const c = rng.chance(0.09) ? cols[1] : rng.chance(0.05) ? cols[2] : cols[0]; K.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 3)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 4));
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(K, 3)); g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uCloudT: U.uTime, uLightDir: U.uLightDir, uSun: U.uSun, uAmbSky: U.uAmbSky, uAmbShade: U.uAmbShade, uWarm: U.uWarm,
      uBox: { value: new THREE.Vector3(150, 80, 150) }, uDrift: { value: new THREE.Vector2(rng.range(-2.4, 2.4), rng.range(-2.4, 2.4)) } },
    vertexShader: /* glsl */`
      attribute vec3 aP, aCol; attribute vec4 aS; uniform float uTime; uniform vec3 uBox; uniform vec2 uDrift;
      varying vec3 vView, vCol;
      #include <fog_pars_vertex>
      void main(){
        vec3 base = aP * uBox;
        base.y -= uTime * (.9 + aS.x * 1.5);
        base.x += sin(uTime * .5 + aS.y * 40.) * 3. + uTime * uDrift.x; base.z += cos(uTime * .41 + aS.z * 40.) * 3. + uTime * uDrift.y;
        vec3 rel = mod(base - cameraPosition + uBox * .5, uBox) - uBox * .5;
        float a = uTime * (1.4 + aS.x * 2.6) + aS.y * 60., b = uTime * (1.0 + aS.z * 2.) + aS.x * 30.;
        vec3 ax = normalize(vec3(cos(a), sin(b) * .8, sin(a) * cos(b) + .2));
        vec3 ay = normalize(cross(ax, vec3(sin(b * .7), cos(a * .6) + .3, .3)));
        vec3 q = abs(rel) / (uBox * .5);
        float fade = smoothstep(2., 6., length(rel)) * (1. - smoothstep(.85, 1., max(q.x, max(q.y, q.z))));
        vec3 wp = cameraPosition + rel + (ax * position.x * 1.7 + ay * position.y) * aS.w * fade;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.);
        vView = mvPosition.xyz; vCol = aCol;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vView, vCol;
      #include <fog_pars_fragment>
      ${GLSL_PAPER_LIGHT}
      void main(){ vec3 n; gl_FragColor = vec4(paperLight(vCol * .82, vView, 1., 1., n), 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'paper-scraps';
  return m;
}

// ---------------------------------------------------------------------------------------------------------------
// the ink river: a flat ribbon, toon-shaded in three tones of ink with streaks that flow downstream
// ---------------------------------------------------------------------------------------------------------------
function makeRiver(U, R, ink, paper, half) {
  const n = R.n, P = new Float32Array((n + 1) * 6), UV = new Float32Array((n + 1) * 4), idx = [];
  for (let i = 0; i <= n; i++) {
    const w = half * (1 + 1.6 * smoothstep(900, 2200, Math.hypot(R.x[i] - 230, R.z[i] - 80))) + R.w[i];
    P.set([R.x[i] - R.nx[i] * w, WATER_Y, R.z[i] - R.nz[i] * w, R.x[i] + R.nx[i] * w, WATER_Y, R.z[i] + R.nz[i] * w], i * 6);
    UV.set([-1, i * R.step, 1, i * R.step], i * 4);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.BufferAttribute(UV, 2)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uInk: { value: ink }, uPaper: { value: paper }, uSkyC: U.uSkyC },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vView;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); vView = mvPosition.xyz; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uInk, uPaper, uSkyC; uniform float uTime; varying vec2 vUv; varying vec3 vView;
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        float x = vUv.x, v = vUv.y;
        float bend = sin(v * .021) * .5 + sin(v * .008 + 1.7) * .4;
        float n1 = vnoise(vec3(x * 2.2 + bend, v * .028 - uTime * .30, 1.));
        float n2 = vnoise(vec3(x * 6.5 + bend * 2., v * .075 - uTime * .62, 7.));
        float n3 = vnoise(vec3(x * 22., v * .26 - uTime * 1.3, 3.));
        vec3 deep = uInk * .26, mid = uInk * .56, pale = mix(uInk, uPaper, .50);
        vec3 col = mix(deep, mid, smoothstep(.47, .50, n1));
        col = mix(col, uInk * .92, smoothstep(.66, .68, n2) * .8);
        float streak = smoothstep(.77, .785, n3) * smoothstep(.44, .50, n2);
        col = mix(col, pale, streak * .85);
        // ink soaking into the paper banks: a pale wavering shore line, then a darker bleed
        float e = 1. - abs(x), wv = .035 * sin(v * .31 + uTime * 1.2) + .02 * sin(v * .83 - uTime * .9);
        col = mix(col, deep, (1. - smoothstep(.10, .22, e + wv)) * .6);
        col = mix(col, pale, 1. - smoothstep(.035, .05, e + wv * .5));
        float fres = pow(1. - abs(dot(normalize(vView), normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz))), 4.);
        col = mix(col, uSkyC * .9, fres * .45);
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'ink-river';
  return m;
}

// ---------------------------------------------------------------------------------------------------------------
// little folded things (unit sized; instances scale them)
// ---------------------------------------------------------------------------------------------------------------
function boatGeometry(white, shade, wake) {
  const S = soup();
  const bow = [0, 0.44, 0.52], stern = [0, 0.44, -0.52], kf = [0, -0.03, 0.24], kb = [0, -0.03, -0.24];
  for (const s of [-1, 1]) {
    const gm = [s * 0.25, 0.30, 0];
    S.tri(bow, kf, gm, s > 0 ? white : shade); S.tri(kf, kb, gm, s > 0 ? white : shade); S.tri(kb, stern, gm, s > 0 ? white : shade);
    S.tri([s * 0.045, 0.27, 0.2], [s * 0.045, 0.27, -0.2], [0, 0.70, 0], s > 0 ? shade : white);     // the centre peak
    S.tri([s * 0.10, 0.012, -0.50], [s * 0.42, 0.012, -1.55], [s * 0.20, 0.012, -1.40], wake);      // wake chevrons on the ink
    S.tri([s * 0.06, 0.012, 0.50], [s * 0.34, 0.012, -0.30], [s * 0.24, 0.012, -0.40], wake);
  }
  return S.geometry();
}

function deerGeometry(col, dark, stag) {
  const S = soup();
  for (const s of [-1, 1]) {
    const c = s > 0 ? col : dark;
    S.quad([0, 1.0, -0.6], [0, 1.05, 0.5], [s * 0.2, 0.62, 0.5], [s * 0.2, 0.6, -0.56], c);                   // folded body
    S.tri([s * 0.2, 0.64, 0.5], [s * 0.2, 0.64, 0.3], [s * 0.15, 0, 0.44], dark);                             // legs
    S.tri([s * 0.2, 0.62, -0.34], [s * 0.2, 0.62, -0.56], [s * 0.15, 0, -0.5], dark);
    S.tri([0, 1.05, 0.38], [s * 0.13, 0.72, 0.5], [0, 1.62, 0.86, 0, 1], c);                                   // neck
    S.tri([0, 1.62, 0.86, 0, 1], [s * 0.085, 1.5, 0.9, 0, 1], [0, 1.44, 1.22, 0, 1], c);                       // head
    S.tri([s * 0.07, 1.6, 0.86, 0, 1], [s * 0.24, 1.8, 0.78, 0, 1, s], [s * 0.05, 1.67, 0.8, 0, 1], dark);     // ear (flicks)
    S.tri([0, 1.0, -0.6], [0, 0.82, -0.72, 0, 0, 1], [s * 0.05, 0.95, -0.58], col);                            // tail
    if (stag) {
      S.tri([s * 0.05, 1.63, 0.84, 0, 1], [s * 0.34, 2.2, 0.66, 0, 1], [s * 0.11, 1.72, 0.8, 0, 1], dark);
      S.tri([s * 0.2, 1.9, 0.76, 0, 1], [s * 0.42, 2.02, 0.96, 0, 1], [s * 0.25, 1.99, 0.73, 0, 1], dark);
      S.tri([s * 0.27, 2.05, 0.7, 0, 1], [s * 0.2, 2.36, 0.5, 0, 1], [s * 0.31, 2.14, 0.68, 0, 1], dark);
    }
  }
  return S.geometry();
}

// stacked folded cones on a stick
function coneTreeGeometry(white) {
  const S = soup(), sides = 6;
  const tiers = [[0.22, 0.62, 0.36], [0.46, 0.84, 0.27], [0.68, 1.0, 0.17]];
  for (const [y0, y1, r] of tiers) for (let i = 0; i < sides; i++) {
    const a0 = (i / sides) * Math.PI * 2, a1 = ((i + 1) / sides) * Math.PI * 2, k = i % 2 ? 0.93 : 1;
    const sw0 = y0 * y0 * 0.02, sw1 = y1 * y1 * 0.03;
    S.tri([Math.cos(a0) * r, y0, Math.sin(a0) * r, sw0], [Math.cos(a1) * r, y0, Math.sin(a1) * r, sw0], [0, y1, 0, sw1], white.clone().multiplyScalar(k));
  }
  S.quad([-0.03, 0, 0], [0.03, 0, 0], [0.03, 0.3, 0], [-0.03, 0.3, 0], white.clone().multiplyScalar(0.7));
  S.quad([0, 0, -0.03], [0, 0, 0.03], [0, 0.3, 0.03], [0, 0.3, -0.03], white.clone().multiplyScalar(0.7));
  return S.geometry();
}

// a pleated fan on a stick
function fanTreeGeometry(white) {
  const S = soup(), n = 12, hub = [0, 0.42, 0];
  for (let i = 0; i < n; i++) {
    const a0 = Math.PI * (-0.08 + 1.16 * i / n), a1 = Math.PI * (-0.08 + 1.16 * (i + 1) / n);
    const z0 = i % 2 ? 0.05 : -0.05, z1 = i % 2 ? -0.05 : 0.05, r = 0.58;
    const p0 = [Math.cos(a0) * r, 0.42 + Math.sin(a0) * r, z0, 0.03 + 0.03 * Math.sin(a0)], p1 = [Math.cos(a1) * r, 0.42 + Math.sin(a1) * r, z1, 0.03 + 0.03 * Math.sin(a1)];
    S.tri(hub, p0, p1, white.clone().multiplyScalar(i % 2 ? 0.92 : 1));
  }
  S.quad([-0.025, 0, 0], [0.025, 0, 0], [0.025, 0.44, 0], [-0.025, 0.44, 0], white.clone().multiplyScalar(0.7));
  return S.geometry();
}

// fringe-cut grass: a strip slit into pointed blades that curl outwards
function tuftGeometry(white) {
  const S = soup(), n = 7;
  for (let i = 0; i < n; i++) {
    const x0 = -0.5 + i / n, x1 = x0 + 1 / n, xm = (x0 + x1) / 2, lean = (xm) * 0.5, h = 0.75 + 0.25 * Math.sin(i * 2.4);
    S.tri([x0, 0, 0], [x1, 0, 0], [xm + lean, h, 0.12 * Math.sin(i * 1.7), 0.10], white.clone().multiplyScalar(i % 2 ? 0.94 : 1));
  }
  return S.geometry();
}

// a cut-paper flower on a strip stem
function flowerGeometry(white, stem) {
  const S = soup(), n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, b = a + 0.38, c = a - 0.38, r = 0.30;
    S.tri([0, 1.0, 0, 0.12], [Math.cos(c) * r * 0.6, 1.07, Math.sin(c) * r * 0.6, 0.13], [Math.cos(a) * r, 1.17, Math.sin(a) * r, 0.15], white.clone().multiplyScalar(0.95));
    S.tri([0, 1.0, 0, 0.12], [Math.cos(a) * r, 1.17, Math.sin(a) * r, 0.15], [Math.cos(b) * r * 0.6, 1.07, Math.sin(b) * r * 0.6, 0.13], white);
  }
  S.tri([-0.022, 0, 0], [0.022, 0, 0], [0, 1.0, 0, 0.12], stem);
  S.tri([0, 0.3, 0, 0.01], [0.26, 0.52, 0.05, 0.04], [0.03, 0.5, 0, 0.03], stem);
  return S.geometry();
}

// a quilled tree: a strip trunk carrying five coiled strips. The coils are generated in the vertex shader from
// (t, depth, radius, end angle | winding, attach point), so they can uncurl.
function quillTreeGeometry(white, tip) {
  const P = [], C = [], B = [], Q = [], Q2 = [];
  const depth = 0.075, segs = 28;
  const put = (x, y, z, col, b, q, q2) => { P.push(x, y, z); C.push(col.r, col.g, col.b); B.push(...b); Q.push(...q); Q2.push(...q2); };
  const strip = (pts) => {       // pts: [{ x, y, col, q, q2 }] along the strip; extruded in z
    for (let i = 0; i + 1 < pts.length; i++) {
      const a = pts[i], b = pts[i + 1];
      const v = (p, z, bb) => put(p.x, p.y, z, p.col, bb, [p.q[0], z, p.q[2], p.q[3]], p.q2);
      v(a, -depth, [1, 1, 0]); v(b, -depth, [0, 1, 0]); v(b, depth, [0, 1, 1]);
      v(a, -depth, [1, 1, 0]); v(b, depth, [0, 1, 1]); v(a, depth, [0, 1, 0]);
    }
  };
  const trunkCol = white.clone().multiplyScalar(0.86);
  strip([0, 0.3, 0.62, 1.0].map((y) => ({ x: 0.012 * Math.sin(y * 9), y, col: trunkCol, q: [0, 0, 0, 0], q2: [0, 0, 0, 0] })));
  // attach (x, y), radius, end angle, winding sign
  const coils = [[0, 1.0, 0.36, -Math.PI / 2, 1, 3.3], [0, 0.82, 0.29, 0, -1, 3.0], [0, 0.82, 0.27, Math.PI, 1, 3.0], [0, 0.55, 0.21, 0.2, -1, 2.6], [0, 0.52, 0.19, Math.PI - 0.2, 1, 2.6]];
  for (const [ax, ay, R, th1, sgn, turns] of coils) {
    const pts = [];
    for (let i = 0; i <= segs; i++) { const t = i / segs; pts.push({ x: ax, y: ay, col: white.clone().lerp(tip, Math.pow(1 - t, 2.2)), q: [t, 0, R, th1], q2: [sgn * turns * Math.PI * 2, ax, ay, 1] }); }
    strip(pts);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aBary', new THREE.Float32BufferAttribute(B, 3)); g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 4)); g.setAttribute('aQ2', new THREE.Float32BufferAttribute(Q2, 4));
  g.userData.tris = P.length / 9;
  return g;
}

// free-flying origami cranes (the hero's fold) circling wide loops: life before the book is reached
function makeCranes(rng, U, flocks, paper, red) {
  const base = craneGeometry();
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(base.P, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(base.W, 3));
  const C = [], R = [], O = [];
  for (const f of flocks) for (let i = 0; i < f.count; i++) {
    C.push(f.center[0], f.center[1], f.center[2]);
    R.push(f.rx, f.rz, f.speed, f.phase + (f.stream ? (i / f.count) * Math.PI * 2 : rng.gauss() * 0.16));
    O.push(rng.gauss() * f.spread, rng.gauss() * f.spread * 0.4, rng.gauss() * f.spread, rng() + (rng.chance(0.08) ? 2 : 0) + (f.size > 1.9 ? 4 : 0));
  }
  g.setAttribute('iC', new THREE.InstancedBufferAttribute(new Float32Array(C), 3)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(new Float32Array(R), 4));
  g.setAttribute('iO', new THREE.InstancedBufferAttribute(new Float32Array(O), 4)); g.instanceCount = C.length / 3;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: U.uTime, uCloudT: U.uTime, uLightDir: U.uLightDir, uSun: U.uSun, uAmbSky: U.uAmbSky, uAmbShade: U.uAmbShade, uWarm: U.uWarm,
      uPaper: { value: paper }, uRed: { value: red } },
    vertexShader: /* glsl */`
      attribute vec3 aWing, iC; attribute vec4 iR, iO; uniform float uTime;
      varying vec3 vView; varying float vRed, vShade;
      #include <fog_pars_vertex>
      vec2 rot(vec2 v, float a){ float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }
      vec3 loop(float a, float sd){ float amp = min(1., iR.x / 60.); return iC + vec3(cos(a) * iR.x, (sin(a * 2. + sd * 6.) * 7. + sin(a * 3. + sd) * 3.) * amp, sin(a) * iR.y) + iO.xyz; }
      void main(){
        float rnd = fract(iO.w), flag = floor(iO.w + .001), big = step(3.5, flag);
        float a = iR.w + uTime * iR.z;
        vec3 q0 = loop(a, rnd), q1 = loop(a + .01 * sign(iR.z), rnd);
        vec3 fwd = normalize(q1 - q0), right = normalize(cross(vec3(0., 1., 0.), fwd)), up = cross(fwd, right);
        float fl = uTime * (5.5 + rnd * 2.5) + rnd * 50.;
        float glide = smoothstep(.55, .9, sin(uTime * .31 + rnd * 40.));
        float a1 = mix(.12 + .78 * sin(fl), .32, glide), a2 = mix(.5 * sin(fl - 1.1), .08, glide);
        vec3 p = position;
        if (aWing.y > .5) {
          float s = aWing.x; vec2 root = vec2(s * .12, .12), mid = vec2(s * .85, .2), q = p.xy;
          if (aWing.y > 1.5) q = mid + rot(q - mid, s * a2);
          p.xy = root + rot(q - root, s * a1);
        }
        float camD = length((viewMatrix * vec4(q0, 1.)).xyz);
        p *= mix(2.3, 3.4, big) * (.8 + .45 * fract(rnd * 7.31)) * smoothstep(7., 22., camD);
        vec4 mvPosition = viewMatrix * vec4(q0 + right * p.x + up * p.y + fwd * p.z, 1.);
        vView = mvPosition.xyz; vRed = step(1.5, mod(flag, 4.)); vShade = aWing.z;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uRed, uPaper; varying vec3 vView; varying float vRed, vShade;
      #include <fog_pars_fragment>
      ${GLSL_PAPER_LIGHT}
      void main(){ vec3 n; gl_FragColor = vec4(paperLight(mix(uPaper, uRed, vRed) * vShade * .82, vView, 1., 1., n), 1.);
        #include <fog_fragment>
      }`,
  });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'paper-wild-cranes';
  return m;
}

// sky / sun / amb / shade / disc are LINEAR colours (the post divides by 0.6 before ACES, so paper sits near 0.6-1.0)
const MOODS = [
  { name: 'noon',    sky: [0.725, 0.595, 0.40], ink: '#1f3fa8', sun: [1.19, 0.97, 0.67], amb: [0.24, 0.25, 0.37], shade: [0.13, 0.14, 0.34], el: 0.72, sunEl: 0.15, disc: [0.64, 0.085, 0.06], tint: '#fff1dc', warm: 0.0 },
  { name: 'evening', sky: [0.745, 0.495, 0.335], ink: '#34268e', sun: [1.24, 0.865, 0.54], amb: [0.23, 0.22, 0.37], shade: [0.14, 0.125, 0.36], el: 0.38, sunEl: 0.115, disc: [0.66, 0.07, 0.045], tint: '#ffe6cc', warm: 0.5 },
  { name: 'morning', sky: [0.70, 0.635, 0.475], ink: '#15509a', sun: [1.145, 0.995, 0.735], amb: [0.25, 0.265, 0.385], shade: [0.14, 0.16, 0.35], el: 0.82, sunEl: 0.17, disc: [0.76, 0.25, 0.22], tint: '#fff4e0', warm: -0.3 },
];

export default {
  id: 'paper-kingdom',
  name: 'The Paper Kingdom',
  category: 'bizarre',
  weirdness: 0.8,
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise;
    const scene = new THREE.Scene();
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

    // ---- per-seed character: mood (noon / evening / morning), accent set, lamp height, wind, weather ----
    const mood = rng.pick(MOODS);
    const accentRoll = rng(), gold = accentRoll < 0.16, indigoQuill = !gold && accentRoll < 0.32;
    const palette = BASE_PALETTE.slice(); palette[5] = mood.ink; if (gold) palette[6] = '#e8481f';      // vermilion-and-gold visits
    const pal = palette.map((h) => new THREE.Color(h));
    const white = new THREE.Color(1, 1, 1), mixc = (a, b, t) => a.clone().lerp(b, t);
    const goldC = new THREE.Color('#e9a92c');
    const paperW = pal[0].clone(), red = pal[6], ink = pal[5];
    const el = mood.el + rng.range(-0.05, 0.05);
    const L = V3(-0.6, el, 0.4 + rng.range(-0.12, 0.12)).normalize();
    const skyC = new THREE.Color(mood.sky[0], mood.sky[1], mood.sky[2]);
    const windy = rng.range(0.7, 1.5);
    const scraps = rng.pick([350, 600, 600, 1000, 1500]);                 // weather: how much paper is in the air

    // ---- the flight: down the ink river, through the quilled forest, in over the book's right-hand page as the
    //      city rises beneath, a left turn down onto the avenue under both bridges, the climb past the tower,
    //      84 m straight into the hole ----
    const j = () => rng.range(-7, 7), rj = (a) => rng.range(-a, a);
    const e0 = [560 + j(), 35, 62 + j()];
    // the entry looks straight down the far reach of the ink river, and the tissue sun hangs low over its vanishing
    // point: that is the picture the previous world's portal shows (a red disc over a blue ribbon)
    const rFar = [-820, 410 + rj(50)];
    const sunAz = Math.atan2(rFar[1] - e0[2], rFar[0] - e0[0]), hd0 = sunAz - 0.03 + rj(0.012);
    const sunDir = V3(Math.cos(sunAz), mood.sunEl + rng.range(-0.01, 0.015), Math.sin(sunAz)).normalize();
    const pre = [e0, [e0[0] + Math.cos(hd0) * 68, 34, e0[2] + Math.sin(hd0) * 68], [440, 36, 130], [385, 16, 166], [322, 19, 186], [252, 27, 176]];
    // the ink widens into a pool where the river leaves the entry axis, 150 m ahead and straight under the sun
    const poolC = [e0[0] + Math.cos(hd0) * 150, e0[2] + Math.sin(hd0) * 150];
    const pool = (x, z) => 15 * Math.exp(-((x - poolC[0]) ** 2 + (z - poolC[1]) ** 2) / 5600);
    const fly = FLY_THROUGH.map((p) => V3(p[0], p[1], p[2]));
    const path = makePath([...pre, ...fly]);
    await ctx.yield();
    const uOf = (x, z) => path.nearestXZ(x, z).u;
    const uCorner = uOf(152, 124), uTurn = uOf(18, 84);
    // the wave front runs 150 m ahead of the camera: the first rows rise while it is still over the forest, the front
    // is at the gutter as it crosses the fore-edge, and from 20 m inside the fore-edge the front draws away at nearly
    // twice the camera's pace: it has run the length of the avenue by the time the camera turns onto it
    const sCorner = uCorner * path.length, waveLead = 150, waveRun = 20, waveGain = 0.9;
    const waveAt = (u) => { const s = u * path.length - sCorner; return s + waveLead + waveGain * Math.max(0, s - waveRun); };
    // waveAt read the other way: the path fraction at which the front is d metres along
    const uWave = (d) => { const s = d - waveLead; return (sCorner + (s > waveRun ? waveRun + (s - waveRun) / (1 + waveGain) : s)) / path.length; };
    // the camera's corridor over the page: what stands under it must stay 9 m below
    const ceiling = (x, z, reach = 22) => { const np = path.nearestXZ(x, z); return np.u < uTurn + 0.004 && np.dist < reach ? np.y - 9 + Math.max(0, np.dist - 8) * 0.9 : 1e9; };

    // ---- the hero ----
    const hero = await buildHero(ctx, { palette, lightDir: [L.x, L.y, L.z], cranes: rng.int(850, 1100), holeFill: false, confetti: 1200, ceiling, craneAccent: gold ? '#e9a92c' : null });
    hero.uniforms.uSun.value.setRGB(...mood.sun); hero.uniforms.uAmbSky.value.setRGB(...mood.amb); hero.uniforms.uAmbShade.value.setRGB(...mood.shade);
    scene.add(hero.object);
    const A = hero.anchors;
    // the cranes' clock starts when the tower's fold begins (the hero gives the wave distance at which the tower is
    // hauled up) and has run out where the climb past the tower levels off over the avenue, 36 m beyond the tower
    // on the way to the hole
    const uLift = uWave(A.tower.wave), uPour = uOf(0, -44);
    await ctx.yield();

    const shadowCol = new THREE.Color(pal[0].r * (0.85 * mood.amb[0] + 0.065), pal[0].g * (0.85 * mood.amb[1] + 0.065), pal[0].b * (0.85 * mood.amb[2] + 0.095)).multiplyScalar(0.92);
    const U = { uTime: { value: 0 }, uU: { value: 0 }, uWind: { value: windy }, uSkyC: { value: skyC }, uShadowCol: { value: shadowCol },
      uLightDir: hero.uniforms.uLightDir, uSun: hero.uniforms.uSun, uAmbSky: hero.uniforms.uAmbSky, uAmbShade: hero.uniforms.uAmbShade, uWarm: hero.uniforms.uWarm };

    // ---- the river: under the first part of the flight, then away to the left toward the sun ----
    const rc = [[1900, -480], [1350, -330 + rj(60)], [950, -150 + rj(40)], [730, -30 + rj(14)], [pre[0][0] - Math.cos(hd0) * 4, pre[0][2] - Math.sin(hd0) * 4], [pre[1][0], pre[1][2]], [pre[0][0] + Math.cos(hd0) * 132, pre[0][2] + Math.sin(hd0) * 132], [398, 158], [352, 232], [300 + rj(10), 294], [208, 340 + rj(10)], [70, 356 + rj(14)],
      [-110, 340 + rj(20)], [-300, 304 + rj(30)], [-540, 330 + rj(40)], rFar, [-1250, 450 + rj(80)], [-1900, 560]];
    const rcurve = new THREE.CatmullRomCurve3(rc.map((p) => V3(p[0], 0, p[1])), false, 'centripetal');
    const RN = 440, rpts = rcurve.getSpacedPoints(RN);
    const R = { n: RN, x: new Float32Array(RN + 1), z: new Float32Array(RN + 1), nx: new Float32Array(RN + 1), nz: new Float32Array(RN + 1), step: rcurve.getLength() / RN };
    for (let i = 0; i <= RN; i++) {
      const a = rpts[Math.max(0, i - 1)], b = rpts[Math.min(RN, i + 1)], tx = b.x - a.x, tz = b.z - a.z, tl = Math.hypot(tx, tz) || 1;
      R.x[i] = rpts[i].x; R.z[i] = rpts[i].z; R.nx[i] = -tz / tl; R.nz[i] = tx / tl;
    }
    R.w = new Float32Array(RN + 1); for (let i = 0; i <= RN; i++) R.w[i] = pool(R.x[i], R.z[i]);
    const riverNear = (x, z) => { let best = 1e12, bi = 0; for (let i = 0; i <= RN; i++) { const dx = R.x[i] - x, dz = R.z[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } } riverNear.i = bi; return Math.sqrt(best); };
    // the ink's entry reach, as river samples: from the bend where the river comes in under the entry to the bend
    // where it leaves the entry's line for the pool
    riverNear(rc[4][0], rc[4][1]); const reachA = riverNear.i; riverNear(rc[6][0], rc[6][1]); const reachB = riverNear.i;

    // ---- the deer's ridge ----
    const dU = rng.range(0.13, 0.17), dP = path.pointAt(dU), dT = path.tangentAt(dU); dT.y = 0; dT.normalize();
    const dSide = rng.chance(0.75) ? 1 : -0.9;                       // right of the path (away from the river) on most visits
    const dR = V3(-dT.z, 0, dT.x).multiplyScalar(Math.sign(dSide)), ridge = { x: dP.x + dR.x * 80, z: dP.z + dR.z * 80, top: dP.y + (dSide > 0 ? 4 : -10) };

    // ---- the land ----
    const CX = 230, CZ = 80;
    let lastRiverD = 0;
    const H = (x, z) => {
      const rd = riverNear(x, z) - pool(x, z); lastRiverD = rd;
      const dB = Math.max(Math.abs(x) - 156, Math.abs(z) - 158);
      const valley = Math.min(rd - 22, dB - 10);
      const m = smoothstep(50, 560, valley), hill = smoothstep(8, 170, valley);
      let h = 1.2 + (noise.fbm2(x * 0.02, z * 0.02, 2) * 0.5 + 0.5) * 1.6;
      h += hill * (noise.fbm2(x * 0.0085 + 3, z * 0.0085, 3) * 0.5 + 0.5) * 36;
      if (m > 0) { const r = noise.ridged2(x * 0.0015 + 7, z * 0.0015 - 3, 3); h += Math.pow(m, 1.25) * (30 + 430 * Math.pow(r, 1.4)); }
      const ex = x - ridge.x, ez = z - ridge.z, la = ex * dR.x + ez * dR.z, al = ex * dT.x + ez * dT.z;
      const prof = Math.exp(-(la / 19) * (la / 19)) * smoothstep(78, 30, Math.abs(al));
      if (prof > 0.003) h = lerp(h, Math.max(h, ridge.top + 3 * Math.sin(al * 0.09)), prof);
      // a notch in the ranges where the river runs out to the sun
      const sdx = x - e0[0], sdz = z - e0[2], sd = Math.hypot(sdx, sdz);
      if (sd > 200) {
        let da = Math.atan2(sdz, sdx) - sunAz; da = Math.atan2(Math.sin(da), Math.cos(da));
        const lim2 = 34 + sd * 0.028 + 900 * smoothstep(0.07, 0.26, Math.abs(da)); if (h > lim2) h = lim2;
      }
      const np = path.nearestXZ(x, z), lim = np.y - 11 + Math.max(0, np.dist - 12) * 0.75;
      if (h > lim) h = lim;
      const wC = 17 + 70 * smoothstep(650, 1700, Math.hypot(x - CX, z - CZ));
      if (rd < wC + 16) h = lerp(-5, h, smoothstep(wC, wC + 16, rd));
      if (dB < 14) h = lerp(-0.4, h, smoothstep(0, 14, dB));
      return h;
    };
    const normalAt = (x, z, out) => out.set(H(x - 2, z) - H(x + 2, z), 4, H(x, z - 2) - H(x, z + 2)).normalize();

    const matPaper = paperMaterial(U, { CREASE: '' });
    {
      const N = 176, N1 = N + 1, warp = (s) => s * (900 + 1700 * Math.pow(s, 6));
      const vx = new Float32Array(N1 * N1), vy = new Float32Array(N1 * N1), vz = new Float32Array(N1 * N1), vd = new Float32Array(N1 * N1);
      const tr = rng.fork('terrain');
      for (let jz = 0; jz <= N; jz++) {
        for (let ix = 0; ix <= N; ix++) {
          const edge = ix === 0 || jz === 0 || ix === N || jz === N ? 0 : 0.62;
          const x = CX + warp(-1 + 2 * (ix + (tr() - 0.5) * edge) / N), z = CZ + warp(-1 + 2 * (jz + (tr() - 0.5) * edge) / N), k = jz * N1 + ix;
          vx[k] = x; vz[k] = z; vy[k] = H(x, z); vd[k] = lastRiverD;
        }
        if (jz < 8 || jz % 6 === 5) await ctx.yield();       // the first rows run cold: hand back after each
      }
      const nT = N * N * 2, P = new Float32Array(nT * 9), C = new Float32Array(nT * 9), B = new Float32Array(nT * 9);
      const base = pal[0].clone(), floor = mixc(pal[0], pal[1], 0.55), bank = mixc(pal[1], pal[2], 0.6), snow = mixc(pal[0], white, 0.7);
      const col = new THREE.Color(); let o = 0;
      const face = (a, b, c) => {
        const y = (vy[a] + vy[b] + vy[c]) / 3, d = (vd[a] + vd[b] + vd[c]) / 3, spread = Math.max(vy[a], vy[b], vy[c]) - Math.min(vy[a], vy[b], vy[c]);
        col.copy(base).lerp(floor, 1 - smoothstep(3, 12, y)).lerp(snow, smoothstep(200, 330, y)).lerp(bank, (1 - smoothstep(26, 44, d)) * 0.8);
        col.multiplyScalar(1 + (tr() - 0.5) * 0.08 - 0.05 * smoothstep(4, 30, spread));
        if (tr() < 0.07) { col.r *= 0.93; col.g *= 0.93; }
        put(a, 0); put(b, 1); put(c, 2);
      };
      const put = (k, bi) => { P[o] = vx[k]; P[o + 1] = vy[k]; P[o + 2] = vz[k]; C[o] = col.r; C[o + 1] = col.g; C[o + 2] = col.b; B[o + bi] = 1; o += 3; };
      await ctx.yield();
      for (let jz = 0; jz < N; jz++) {
        for (let ix = 0; ix < N; ix++) {
          const a = jz * N1 + ix, b = a + 1, c = a + N1, d = c + 1;
          if (tr() < 0.5) { face(a, c, b); face(b, c, d); } else { face(a, c, d); face(a, d, b); }
        }
        if (jz < 4 || (jz & 7) === 7) await ctx.yield();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('aBary', new THREE.BufferAttribute(B, 3));
      const land = new THREE.Mesh(g, matPaper); land.frustumCulled = false; land.name = 'paper-land'; scene.add(land);
    }
    await ctx.yield();

    scene.add(makeRiver(U, R, ink, paperW, 19));
    await ctx.yield();
    scene.add(makeSky(U, skyC, sunDir, new THREE.Color(mood.disc[0], mood.disc[1], mood.disc[2]), new THREE.Color(1.0, 0.72, 0.36)));
    scene.add(makeClouds(rng.fork('clouds'), U, skyC, [mixc(skyC, white, 0.72), mixc(skyC, white, 0.42), skyC.clone().multiplyScalar(1.10)]));
    scene.fog = new THREE.FogExp2(skyC.clone().multiplyScalar(1.04), 0.00040);
    scene.background = skyC.clone();
    await ctx.yield();

    // ---- scattering helpers ----
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), Sv = V3(1, 1, 1), Pv = V3(0, 0, 0), up = V3(0, 1, 0);
    const instanced = (geo, mat, list, name) => {
      const m = new THREE.InstancedMesh(geo, mat, Math.max(1, list.length)); m.count = list.length;
      list.forEach((o, i) => { M.compose(Pv.set(o.x, o.y, o.z), Q.setFromEuler(E.set(o.tilt || 0, o.yaw || 0, 0, 'YXZ')), Sv.set(o.s, o.sy || o.s, o.s)); m.setMatrixAt(i, M); m.setColorAt(i, o.col); });
      m.frustumCulled = false; m.name = name; scene.add(m); return m;
    };
    const inBook = (x, z, pad) => Math.abs(x) < 156 + pad && Math.abs(z) < 158 + pad;
    const tP = V3(0, 0, 0), tT = V3(0, 0, 0);
    // a point beside the path at fraction u, `lat` metres to the right (negative: left)
    const beside = (u, lat) => { path.pointAt(u, tP); path.tangentAt(u, tT); tT.y = 0; tT.normalize(); return { x: tP.x - tT.z * lat, z: tP.z + tT.x * lat }; };
    const paperTone = (r) => { const t = r(); return t < 0.45 ? paperW.clone() : t < 0.8 ? mixc(pal[0], white, 0.1) : pal[1].clone(); };
    const nrm = V3(0, 1, 0);
    const addShadow = () => {};
    // paper shadows: each caster's own (animated) shape again, flattened along the lamp's rays onto its patch of ground
    const castShadow = (geo, defines, list, name, aU) => {
      const near = []; list.forEach((o, i) => { if (path.nearestXZ(o.x, o.z).dist < 150) near.push(i); });
      if (!near.length) return;
      const g = geo.clone(), gn = new Float32Array(near.length * 3);
      const m = new THREE.InstancedMesh(g, shadowMaterial(U, defines), near.length);
      near.forEach((k, i) => {
        const o = list[k]; M.compose(Pv.set(o.x, o.y, o.z), Q.setFromEuler(E.set(o.tilt || 0, o.yaw || 0, 0, 'YXZ')), Sv.set(o.s, o.sy || o.s, o.s)); m.setMatrixAt(i, M);
        normalAt(o.x, o.z, nrm); gn[i * 3] = nrm.x; gn[i * 3 + 1] = nrm.y; gn[i * 3 + 2] = nrm.z;
      });
      g.setAttribute('aGn', new THREE.InstancedBufferAttribute(gn, 3));
      if (aU) g.setAttribute('aU', new THREE.InstancedBufferAttribute(new Float32Array(near.map((k) => aU[k])), 1));
      m.frustumCulled = false; m.renderOrder = 1; m.name = name; scene.add(m);
    };

    // ---- the quilled forest (its coils uncurl as the camera comes) and lone quills up the valley ----
    {
      const fr = rng.fork('forest'), list = [], us = [];
      const tryTree = (u, lat, s) => {
        const p = beside(u, lat); if (inBook(p.x, p.z, 18)) return;
        const y = H(p.x, p.z); if (lastRiverD < 36) return;
        const np = path.nearestXZ(p.x, p.z); if (np.dist < 10 + 0.62 * s) return;
        // both banks of the ink's entry reach stay clear for 52 m (H left the nearest river sample in riverNear.i)
        if (lastRiverD < 52 && riverNear.i >= reachA && riverNear.i <= reachB) return;
        for (const o of list) if (Math.hypot(o.x - p.x, o.z - p.z) < (o.s + s) * 0.33) return;
        const v = beside(Math.max(0, np.u - 0.07), 0), yaw = Math.atan2(p.x - v.x, p.z - v.z) + (fr.chance(0.5) ? 1 : -1) * fr.range(0.4, 0.95);
        list.push({ x: p.x, y: y - 0.3, z: p.z, s, yaw, col: fr.chance(0.05) ? mixc(red, white, 0.16) : paperTone(fr) }); us.push(np.u);
        addShadow(p.x, y, p.z, s * 0.4);
      };
      for (let i = 0; i < 520; i++) { const side = fr.chance(0.5) ? 1 : -1, lat = side * (14 + 110 * Math.pow(fr(), 1.3)); tryTree(fr.range(0.265, 0.60), lat, fr.range(15, 27) + Math.abs(lat) * 0.1); if ((i & 63) === 63) await ctx.yield(); }
      for (let i = 0; i < 60; i++) tryTree(fr.range(0.02, 0.26), (fr.chance(0.5) ? 1 : -1) * fr.range(42, 140), fr.range(13, 22));
      const g = quillTreeGeometry(white, indigoQuill ? mixc(ink, white, 0.18) : mixc(pal[2], pal[1], 0.7));
      await ctx.yield();
      castShadow(g, { QUILL: '' }, list, 'quill-shadows', us);
      await ctx.yield();
      g.setAttribute('aU', new THREE.InstancedBufferAttribute(new Float32Array(us), 1));
      instanced(g, paperMaterial(U, { CREASE: '', QUILL: '' }), list, 'quilled-forest');
    }
    await ctx.yield();

    // ---- fans, cones, fringe grass, cut-paper flowers ----
    {
      const fr = rng.fork('flora'), fans = [], cones = [], tufts = [], flowers = [];
      // about 8% red and 3% indigo on every visit (the extra share is hashed from the place, so the layout's own
      // random stream is untouched)
      const accent = (x, z) => {
        if (fr.chance(0.045)) return indigoQuill && fr.chance(0.5) ? mixc(ink, white, 0.3) : gold && fr.chance(0.4) ? goldC.clone() : mixc(red, white, 0.12);
        const base = paperTone(fr), hh = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
        return hh < 0.037 ? mixc(red, white, 0.12) : hh < 0.068 ? mixc(ink, white, 0.25) : base;
      };
      const tryFan = (x, z, s) => {
        if (inBook(x, z, 12)) return; const y = H(x, z); if (lastRiverD < 32) return;
        const np = path.nearestXZ(x, z); if (np.dist < 10 + 0.6 * s) return;
        const v = beside(Math.max(0, np.u - 0.05), 0);
        fans.push({ x, y: y - 0.2, z, s, yaw: Math.atan2(v.x - x, v.z - z) + fr.range(-0.5, 0.5), col: accent(x, z) }); addShadow(x, y, z, s * 0.3);
      };
      for (let i = 0; i < 90; i++) {       // a loose ring of fans round the book
        const t = fr() * 4, pad = fr.range(14, 70), side = Math.floor(t), f = (t - side) * 2 - 1;
        const x = side === 0 ? 156 + pad : side === 1 ? -156 - pad : f * (156 + pad), z = side === 2 ? 158 + pad : side === 3 ? -158 - pad : f * (158 + pad);
        tryFan(x, z, fr.range(9, 19));
      }
      await ctx.yield();
      for (let i = 0; i < 130; i++) { const p = beside(fr.range(0.03, 0.66), (fr.chance(0.5) ? 1 : -1) * fr.range(18, 130)); tryFan(p.x, p.z, fr.range(8, 16)); }
      for (let i = 0; i < 1100; i++) {
        if ((i & 127) === 127) await ctx.yield();
        const x = CX + fr.range(-780, 700), z = CZ + fr.range(-720, 660); if (inBook(x, z, 12)) continue;
        if (noise.n2(x * 0.006 + 40, z * 0.006) < -0.12) continue;
        const y = H(x, z); if (lastRiverD < 30 || y > 150) continue;
        const s = fr.range(7, 16), np = path.nearestXZ(x, z); if (np.dist < 12 + 0.4 * s) continue;
        cones.push({ x, y: y - 0.3, z, s, sy: s * fr.range(1.15, 1.8), yaw: fr() * 6.28, col: accent(x, z) }); addShadow(x, y, z, s * 0.34);
      }
      await ctx.yield();
      const tryTuft = (x, z) => {
        if (inBook(x, z, 3)) return; const y = H(x, z); if (lastRiverD < 22) return;
        const s = fr.range(2.4, 5); tufts.push({ x, y: y - 0.1, z, s, sy: s * fr.range(0.7, 1.4), yaw: fr() * 6.28, tilt: fr.range(-0.2, 0.2), col: fr.chance(0.025) ? red.clone() : paperTone(fr) });
      };
      for (let i = 0; i < 3000; i++) { const p = beside(fr.range(0, 0.70), (fr.chance(0.5) ? 1 : -1) * (4 + 90 * Math.pow(fr(), 1.6))); tryTuft(p.x, p.z); if ((i & 255) === 255) await ctx.yield(); }
      for (let i = 0; i < 700; i++) {
        const t = fr() * 4, pad = fr.range(3, 46), side = Math.floor(t), f = (t - side) * 2 - 1;
        tryTuft(side === 0 ? 156 + pad : side === 1 ? -156 - pad : f * (156 + pad), side === 2 ? 158 + pad : side === 3 ? -158 - pad : f * (158 + pad));
        if ((i & 255) === 255) await ctx.yield();
      }
      await ctx.yield();
      for (let i = 0; i < 420; i++) {
        const p = beside(fr.range(0.06, 0.68), (fr.chance(0.5) ? 1 : -1) * fr.range(7, 64)); if (inBook(p.x, p.z, 4)) continue;
        const y = H(p.x, p.z); if (lastRiverD < 24) continue;
        const t = fr(); flowers.push({ x: p.x, y: y - 0.1, z: p.z, s: fr.range(3.4, 7), yaw: fr() * 6.28, tilt: fr.range(-0.12, 0.12), col: t < 0.3 ? mixc(red, white, 0.1) : gold && t < 0.52 ? goldC.clone() : t < 0.92 ? paperW.clone() : mixc(ink, white, 0.3) });
      }
      await ctx.yield();
      const fanG = fanTreeGeometry(white), coneG = coneTreeGeometry(white);
      castShadow(fanG, {}, fans, 'fan-shadows'); castShadow(coneG, {}, cones, 'cone-shadows');
      await ctx.yield();
      instanced(fanG, matPaper, fans, 'paper-fans');
      instanced(coneG, matPaper, cones, 'paper-cones');
      await ctx.yield();
      instanced(tuftGeometry(white), matPaper, tufts, 'paper-fringe');
      instanced(flowerGeometry(white, mixc(pal[3], white, 0.35)), matPaper, flowers, 'paper-flowers');
    }
    await ctx.yield();

    // ---- six origami deer on their ridge ----
    const deerAt = V3(ridge.x, ridge.top + 6, ridge.z);
    {
      const dr = rng.fork('deer'), n = dr.int(5, 7), stags = [], does = [], gap = dr.range(13, 17);
      const dcol = mixc(pal[3], pal[4], dr.range(0.1, 0.4)), away = Math.atan2(dT.x, dT.z);
      for (let i = 0; i < n; i++) {
        const al = (i - (n - 1) / 2) * gap + dr.range(-3, 3), la = dr.range(-2.5, 2.5), x = ridge.x + dT.x * al + dR.x * la, z = ridge.z + dT.z * al + dR.z * la, y = H(x, z);
        const s = i === n - 1 ? dr.range(4.2, 5) : dr.range(6.4, 8.2), o = { x, y: y - 0.15, z, s, yaw: away + (dr.chance(0.3) ? Math.PI : 0) + dr.range(-0.5, 0.5), col: white.clone() };
        (i === 1 || (i === n - 2 && dr.chance(0.5)) ? stags : does).push(o); addShadow(x, y, z, s * 0.55);
      }
      const matDeer = paperMaterial(U, { CREASE: '', DEER: '' });
      const stagG = deerGeometry(dcol, dcol.clone().multiplyScalar(0.72), true), doeG = deerGeometry(dcol, dcol.clone().multiplyScalar(0.72), false);
      castShadow(stagG, { DEER: '' }, stags, 'stag-shadows'); castShadow(doeG, { DEER: '' }, does, 'doe-shadows');
      instanced(stagG, matDeer, stags, 'paper-stags');
      instanced(doeG, matDeer, does, 'paper-does');
    }

    // ---- folded boats sailing the ink ----
    riverNear(770, -40); const sA = riverNear.i * R.step; riverNear(-200, 338); const sB = riverNear.i * R.step, span = sB - sA;
    const nBoats = rng.int(9, 14), boats = [];
    {
      const br = rng.fork('boats'), list = [];
      for (let i = 0; i < nBoats; i++) {
        boats.push({ off: (i + br.range(0.1, 0.9)) / nBoats * span, speed: br.range(3, 5.6), lat: br.range(-9, 9), s: br.range(13, 18), ph: br() * 20 });
        list.push({ x: 0, y: -50, z: 0, s: 1, col: i % 5 === 2 ? mixc(red, white, 0.06) : i % 7 === 4 ? mixc(ink, white, 0.3) : paperW.clone() });
      }
      boats.mesh = instanced(boatGeometry(white, white.clone().multiplyScalar(0.9), mixc(ink, white, 0.6)), matPaper, list, 'paper-boats');
    }
    const placeBoats = (time) => {
      for (let i = 0; i < nBoats; i++) {
        const b = boats[i], d = (b.off + time * b.speed) % span, f = (sA + d) / R.step, k = Math.min(RN - 1, Math.floor(f)), t = f - k;
        const nx = lerp(R.nx[k], R.nx[k + 1], t), nz = lerp(R.nz[k], R.nz[k + 1], t);
        const fade = smoothstep(0, 60, d) * smoothstep(0, 60, span - d), s = b.s * fade;
        Pv.set(lerp(R.x[k], R.x[k + 1], t) + nx * b.lat, WATER_Y - 0.02 * b.s + Math.sin(time * 1.3 + b.ph) * 0.15, lerp(R.z[k], R.z[k + 1], t) + nz * b.lat);
        E.set(Math.sin(time * 0.8 + b.ph * 2) * 0.05, Math.atan2(nz, -nx) + Math.sin(time * 0.3 + b.ph) * 0.12, Math.sin(time * 1.1 + b.ph) * 0.07, 'YXZ');
        M.compose(Pv, Q.setFromEuler(E), Sv.set(s, s, s)); boats.mesh.setMatrixAt(i, M);
      }
      boats.mesh.instanceMatrix.needsUpdate = true;
    };
    placeBoats(0);

    // ---- cranes on the wing before the book, and paper scraps on the air ----
    {
      const cr = rng.fork('wild'), dir = cr.chance(0.5) ? 1 : -1;
      const flocks = [
        { center: [pre[3][0] - 30, 42, pre[3][2] + 24], rx: 112, rz: 70, speed: 0.11 * dir, phase: cr() * 6.28, count: cr.int(14, 26), spread: 9, size: 1.7 },
        { center: [-260, 150, 520], rx: 330, rz: 180, speed: -0.05 * dir, phase: cr() * 6.28, count: cr.int(24, 40), spread: 24, size: 2.6 },
        { center: [pre[1][0] - 50, 98, pre[1][2] - 110], rx: 110, rz: 70, speed: -0.09 * dir, phase: cr() * 6.28, count: cr.int(9, 18), spread: 8, size: 1.7 },
      ];
      flocks.push({ center: [pre[2][0] + 20, 66, pre[2][2] + 6], rx: 92, rz: 58, speed: 0.10 * dir, phase: cr() * 6.28, count: cr.int(8, 16), spread: 7, size: 1.7 });
      // a long procession crossing the sky between the forest and the book, and one that flies the avenue at roof height
      flocks.push({ center: [150, 72, 140], rx: 150, rz: 100, speed: 0.075 * dir, phase: cr() * 6.28, count: cr.int(36, 50), spread: 4, size: 2.6, stream: true });
      flocks.push({ center: [0, 37, 30], rx: 22, rz: 125, speed: 0.12 * dir, phase: cr() * 6.28, count: 40, spread: 2.2, size: 1.7, stream: true });
      // and its mirror, so cranes pass the camera on both sides toward the hole over the last stretch. Where its
      // column starts on the loop is drawn from a fork of its own, taken after the scraps' fork: no other flock and
      // no scrap is dealt differently for it
      const sr = rng.fork('scraps'), mr = rng.fork('wild-mirror');
      flocks.push({ center: [0, 38.5, -28], rx: 15, rz: 97, speed: -0.12 * dir, phase: mr() * 6.28, count: 36, spread: 2.0, size: 1.7, stream: true });
      scene.add(makeCranes(cr, U, flocks, paperW, gold ? goldC : red));
      scene.add(makeConfetti(sr, U, scraps, [paperW, red, mixc(ink, white, 0.2)]));
    }
    await ctx.yield();

    const portalPos = A.portalSeat.position.clone();
    return {
      scene, path,
      duration: 48,
      style: 'none',                                   // the world has its own paper look: no lens on top
      camera: { fov: 62, near: 0.5, far: 4400, lookAhead: 26, sway: 0.6, bank: 0.4 },
      pois: [
        { at: deerAt, from: 0.04, to: 0.20, weight: 0.3 },
        { at: V3(40, 18, 60), from: 0.33, to: uCorner - 0.08, weight: 0.45 },            // the book and its standing page, over the forest
        { at: V3(0, 14, 60), from: uCorner - 0.08, to: uTurn - 0.13, weight: 0.45 },    // the city rising on the page ahead
        { at: V3(-15, 42, -60), from: uTurn - 0.15, to: uTurn + 0.03, weight: 0.6 },     // a point in the air between the tower's top and the hole in the standing page
        { at: portalPos, from: uTurn + 0.01, to: uTurn + 0.16, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7.5, color: '#ffe2b0', glow: 1.1, revealDistance: 300 },
      post: {
        exposure: 1.06,
        bloom: { strength: 0.42, radius: 0.6, threshold: 1.08 },
        grade: { saturation: 1.06, contrast: 1.05, tint: mood.tint, shadowTint: '#141226', vignette: 0.30, grain: 0.035, aberration: 0 },
      },
      update(dt, time, camera, u) {
        U.uTime.value = time; U.uU.value = u;
        hero.update(dt, time, camera);
        hero.setWave(waveAt(u));
        hero.setCranes((u - uLift) / (uPour - uLift));
        placeBoats(time);
      },
      dispose() { hero.dispose(); },
    };
  },
};
