// FIRST TRACKS (snow-ghosts): a north face after a metre of new snow, skied from the summit ridge to a well
// in the cloud sea. World space == the hero's local space: origin at the centre of the ghost-forest glade,
// uphill +Z, fall line -Z, wind to +X. The ridge is at z > 348, the bowl 150..340, the ghost apron
// 150..-150, the cliff lip at z = -165, the cloud well ~190 m further out and ~75 m lower.
//
// Looks (by seed, or ctx.vary.hour): bluebird morning, first light (rose), late gold (sun from the other
// side, 40 m shadows), full moon (stars, silver powder). Weather: sun-snow on some visits. Rare event: a
// powder avalanche runs down the horned island peak during the float.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { makeSky, makeCloudField, makeLightRig, skyDirection } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/snow-ghosts.js';

const TAU = Math.PI * 2;
const PAL = ['#1B55B8', '#F8FBFF', '#7EA4DE', '#DDE8F3', '#FFF0D2', '#2A323D', '#D9352B'];

// el / az of the key light (az: 0 = down the fall line, negative = skier's left)
// veil: how hard powder between us and the light ignites (low suns are capped harder so the fan keeps its structure)
const LOOKS = {
  day: { preset: 'day', el: 24, az: -75, sunCol: '#FFF0D2', sunI: 0.86, shade: '#7195D2', fill: '#4674C6', zenith: '#1045A6', mid: '#2E66C2', horizon: '#DDE8F3',
    fog: '#DDE8F3', exposure: 0.95, stars: 0, sparkle: 1, veil: 1.3, moonAz: 52, title: 'First Tracks', portal: '#fff3d6' },
  dawn: { preset: 'dawn', el: 8.5, az: -64, sunCol: '#FF9C94', sunI: 1.0, shade: '#4460C0', fill: '#3450B0', zenith: '#123690', mid: '#5470C4', horizon: '#F2B0B4',
    fog: '#E4BCC4', exposure: 1.05, stars: 0.25, sparkle: 0.8, veil: 0.55, moonAz: 58, title: 'First Tracks, First Light', portal: '#ffd0c0' },
  golden: { preset: 'goldenHour', el: 11.5, az: 76, sunCol: '#FFB84E', sunI: 1.02, shade: '#6485D2', fill: '#3F62BC', zenith: '#2A62B8', mid: '#5C8CD2', horizon: '#FBE2A8',
    fog: '#F0DDB8', exposure: 1.0, stars: 0, sparkle: 0.9, veil: 0.55, moonAz: -56, title: 'Last Run', portal: '#ffe0a8' },
  night: { preset: 'night', el: 40, az: -62, sunCol: '#C4D4FF', sunI: 0.5, shade: '#42569E', fill: '#2B3F86', zenith: '#040A22', mid: '#0B1840', horizon: '#22386E',
    fog: '#1C2E5E', exposure: 1.3, stars: 1, sparkle: 2.4, veil: 0.8, moonAz: -62, title: 'Full Moon Powder', portal: '#cfe0ff' },
};

// ---------------------------------------------------------------- small self-lit material (rig, cairn, peaks, hare)
// Uses the hero's light uniforms so everything shares one sun and one blue fill; no scene lights needed.
function litMaterial(U, o = {}) {
  const defines = {};
  if (o.shadow) defines.USE_SHMAP = 1;
  if (o.flag) defines.FLAG = 1;
  if (o.far) defines.FAR = 1;
  if (o.rock) defines.ROCK = 1;
  return new THREE.ShaderMaterial({
    fog: true, vertexColors: true, uniforms: U, defines, side: o.side ?? THREE.FrontSide,
    vertexShader: /* glsl */ `
      uniform float uTime;
      varying vec3 vN, vC, vW;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position; vec3 n = normal;
        #ifdef FLAG
        // uv.x = distance from the hoist: the fly end snaps in the wind
        float k = uv.x, ph = uTime * 9. - uv.x * 7. + uv.y * 3.;
        p += normal * (k * 0.16 * sin(ph) + k * 0.07 * sin(ph * 2.3 + 1.)); p.y += k * 0.06 * cos(ph * 1.3);
        n = normalize(n + vec3(0., 0.5, 0.5) * k * cos(ph));
        #endif
        vec4 wp = modelMatrix * vec4(p, 1.);
        vW = wp.xyz; vN = normalize(mat3(modelMatrix) * n); vC = color;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSun, uSunCol, uShade, uSky; uniform float uSunI;
      #ifdef USE_SHMAP
      uniform sampler2D uShadow; uniform vec4 uShRect;
      #endif
      varying vec3 vN, vC, vW;
      #include <common>
      #include <fog_pars_fragment>
      #ifdef ROCK
      uniform float uCloudY;
      float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
      #endif
      void main(){
        vec3 N = normalize(vN);
        #ifdef FLAG
        if (!gl_FrontFacing) N = -N;
        #endif
        float ndl = dot(N, uSun), sh = 0.;
        #ifdef USE_SHMAP
        vec2 suv = (vW.xz - uShRect.xy) / uShRect.zw;
        sh = smoothstep(0.08, 0.8, texture2D(uShadow, suv).r) * 0.9 * step(0.002, suv.x) * step(suv.x, 0.998) * step(0.002, suv.y) * step(suv.y, 0.998);
        #endif
        float lit = smoothstep(-0.12, 0.65, ndl) * (1. - sh);
        vec3 l = uSunCol * uSunI * 1.15 * lit + uShade * (0.55 + 0.35 * N.y) + vec3(0.30, 0.33, 0.40) * (0.75 - 0.35 * N.y) * (0.35 + uSunI);
        #ifdef USE_SHMAP
        l *= 1. - 0.34 * sh;                                              // shadow stripes read on the dark topsheets too
        #endif
        #ifdef FAR
        // far rock: the sky's blue fill plus the neutral light the snow and the cloud throw back, so shade is slate, not ultramarine
        l = uSunCol * uSunI * 1.05 * smoothstep(-0.05, 0.5, ndl) + uShade * (0.62 + 0.3 * N.y)
          + vec3(0.30, 0.33, 0.40) * (0.75 - 0.35 * N.y) * (0.35 + uSunI) + vec3(0.5, 0.54, 0.6) * max(0.3 - N.y, 0.) * 0.5;
        #endif
        vec3 alb = vC;
        #ifdef ROCK
        // a rock stack standing in cloud. vC = (baked snow, tone, height 0..1). Tilted beds, gullies, snow on every ledge,
        // rime plastered up the windward and mountain-facing walls, and a foot that dissolves into the cloud.
        float w1 = vn(vW.xz * 0.045 + 3.);
        float bed = vW.y * 0.38 + 2.4 * w1 + 0.03 * (vW.x + vW.z);
        float st = vn(vec2(bed, 1.7)) * 0.6 + vn(vec2(bed * 3.3, 4.4 + 0.06 * (vW.x - vW.z))) * 0.4;
        float gul = vn(vec2((vW.x + vW.z) * 0.36, vW.y * 0.05 + (vW.x - vW.z) * 0.36 + 9.));
        float n2 = vn(vec2(vW.x * 0.17 + vW.z * 0.12, vW.y * 0.15)) * 0.6 + vn(vec2(vW.z * 0.5 - vW.x * 0.37, vW.y * 0.55)) * 0.4;
        float rimeDir = clamp(-N.x * 0.6 + N.z * 0.6, -1., 1.);
        float rime = smoothstep(0.5, 0.66, n2 + 0.2 * rimeDir + 0.2 * (vC.b - 0.5)) * (1. - 0.7 * smoothstep(0.45, 0.9, N.y));
        float cf = step(vC.b, 0.);                                    // a small outcrop near the run: finer ledges, darker stone
        float lb = vW.y * mix(0.11, 0.42, cf) + 0.5 * w1, lf = fract(lb);
        float ledge = smoothstep(0.24, 0.15, lf) * smoothstep(0.0, 0.04, lf) * smoothstep(0.25, 0.5, vn(vW.xz * 0.21 + floor(lb) * 7.3));
        float scour = smoothstep(0.42, 0.56, vn(vW.xz * 0.3 + 5.) * 0.65 + 0.35 * vn(vW.zx * 0.83 + 1.7));     // the wind keeps part of every crown bare
        float snowA = clamp(max(max(vC.r * scour, 0.92 * rime), max(0.9 * ledge, scour * smoothstep(0.5 + 0.22 * step(vC.b, 0.), 0.78 + 0.16 * step(vC.b, 0.), N.y + 0.2 * (n2 - 0.5)))), 0., 1.);
        float fineK = 1. - smoothstep(30., 120., length(vW - cameraPosition));
        float st3 = vn(vec2(vW.y * 4.6 + 4. * w1 + 0.4 * (vW.x + vW.z), (vW.x - vW.z) * 0.7)) * 0.6 + vn(vec2(vW.x * 2.9 + vW.y * 1.3, vW.z * 2.9 - vW.y * 1.7)) * 0.4;
        vec3 rockC = vec3(0.135, 0.150, 0.185) * (0.4 + 1.0 * st) * (0.7 + 0.6 * gul) * (0.75 + 0.5 * vC.g) * mix(1., 0.6, cf) * (1. + fineK * 0.9 * (st3 - 0.5));
        alb = mix(rockC, vec3(0.74, 0.77, 0.82) * (0.9 + 0.2 * n2), snowA);
        N = normalize(N + (1. - snowA) * (0.55 * vec3(gul - 0.5, st - 0.5, n2 - 0.5) + fineK * 0.5 * vec3(st3 - 0.5, 0.5 - st3, st - 0.5)));
        ndl = dot(N, uSun);
        l = uSunCol * uSunI * 1.05 * smoothstep(-0.05, 0.5, ndl) * (0.55 + 0.45 * smoothstep(0.2, 0.6, gul + 0.6 * snowA)) + uShade * (0.62 + 0.3 * N.y)
          + vec3(0.30, 0.33, 0.40) * (0.75 - 0.35 * N.y) * (0.35 + uSunI) + vec3(0.5, 0.54, 0.6) * max(0.3 - N.y, 0.) * 0.5;
        #endif
        gl_FragColor = vec4(alb * l, 1.);
        #ifdef ROCK
        float foot = smoothstep(uCloudY + 3., uCloudY - 6., vW.y + 6. * (n2 - 0.5));
        vec3 cloudC = uShade * 0.6 + vec3(0.46, 0.47, 0.49) * (0.3 + uSunI) * (0.75 + 0.25 * smoothstep(-0.2, 0.6, dot(normalize(vN), uSun)));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, cloudC, 0.9 * foot);
        #endif
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- soft powder sprites (spindrift, slough, bow wave, face-shot, well, avalanche)
// Per instance: aO origin, aV velocity, aP (phase | birth, life, size, rnd), aK kind (0..5).
// Per kind: uKA (wind scale, gravity, growth, alpha), uKB (mode 0 loop / 1 orbit / 2 driven, spin, near fade m, lit),
// uGate (opacity), uDrive (clock of driven kinds), uAnchor (moving origin).
function puffMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, uniforms: U, transparent: true, depthWrite: false,
    vertexShader: /* glsl */ `
      attribute vec3 aO, aV; attribute vec4 aP; attribute float aK;
      uniform float uTime; uniform vec3 uCamP, uSunP, uWindP;
      uniform vec4 uKA[6], uKB[6], uKC[6]; uniform float uGate[6], uDrive[6]; uniform vec3 uAnchor[6];
      varying vec2 vUv, vSunXY; varying float vA, vScat, vR, vK, vLit, vTint; varying vec4 vEm;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        int ki = int(aK + 0.5);
        vec4 ka = uKA[ki], kb = uKB[ki];
        float life = max(aP.y, 0.01), k, alive = 1.;
        if (kb.x < 0.5) k = fract(uTime / life + aP.x);
        else if (kb.x < 1.5) k = 0.35 + 0.1 * sin(uTime * 0.2 + aP.w * 40.);
        else { k = (uDrive[ki] - aP.x) / life; alive = step(0., k) * step(k, 1.); k = clamp(k, 0., 1.); }
        float age = k * life;
        vec3 o = aO;
        if (kb.x > 0.5 && kb.x < 1.5) { float a = uTime * kb.y * (0.7 + 0.6 * aP.w); float c = cos(a), s = sin(a); o = vec3(c * o.x - s * o.z, o.y + 0.5 * sin(uTime * 0.3 + aP.w * 20.), s * o.x + c * o.z); }
        float d = (1. - exp(-1.3 * age)) / 1.3;
        vec3 p = uAnchor[ki] + o + aV * (kb.x > 1.5 ? age : d) + uWindP * ka.x * (age + 0.3 * age * age);
        p.y -= ka.y * age * age;
        p += (0.12 + 0.2 * ka.x) * min(age, 3.) * vec3(sin(uTime * 1.3 + aP.w * 40.), sin(uTime * 1.7 + aP.w * 23.), cos(uTime * 1.1 + aP.w * 31.));
        float size = aP.z * (1. - ka.z + 2. * ka.z * sqrt(k));
        float alpha = (kb.x > 0.5 && kb.x < 1.5) ? 1. : smoothstep(0., 0.08, k) * pow(1. - k, 1.5);
        alpha *= alive * uGate[ki] * ka.w;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        mvPosition.xy += position.xy * size * step(0.002, alpha);
        gl_Position = projectionMatrix * mvPosition;
        vec3 toP = p - uCamP; float dl = length(toP);
        float ct = dot(toP / max(dl, 1e-3), uSunP);
        float fs = max(ct, 0.); fs *= fs;
        vScat = min(fs * fs * fs * 2.0 + fs * 0.5, 1.5) * kb.w;
        vec2 sxy = (modelViewMatrix * vec4(uSunP, 0.)).xy; vSunXY = sxy / max(length(sxy), 0.2);
        vLit = 0.5 - 0.5 * ct;
        vTint = (kb.x > 0.5 && kb.x < 1.5) ? 0.2 : 1.;               // cloud (the well) takes less of the sun's colour than powder
        vUv = position.xy; vR = aP.w; vK = k; vEm = uKC[ki];
        vA = alpha * smoothstep(kb.z * 0.25, kb.z, dl);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunCol, uShade; uniform float uTime, uSunI;
      varying vec2 vUv, vSunXY; varying float vA, vScat, vR, vK, vLit, vTint; varying vec4 vEm;
      #include <common>
      #include <fog_pars_fragment>
      float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
        return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
      void main(){
        float r2 = dot(vUv, vUv);
        if (r2 > 1. || vA < 0.004) discard;
        vec2 w = vUv * 2.3 + vR * 17.;
        float n = vn(w + vec2(0., -uTime * 0.35)) * 0.5 + vn(w * 2.3 + 3.) * 0.32 + vn(w * 5.3 + vec2(7., -uTime * 0.6)) * 0.18;
        float body = 1. - r2;
        // the veil thins where it ignites: a lit fan with a blue core, never a white-out
        float a = body * smoothstep(0.05 + 0.3 * vK, 0.7, n * 0.7 + body * 0.6) * vA * (1. - 0.5 * min(vScat, 1.));
        float core = body * (0.5 + 0.5 * n);
        float lit = clamp(0.42 + 0.75 * dot(vUv, vSunXY) + 0.25 * vUv.y + 0.3 * (n - 0.5), 0., 1.) * (0.35 + 0.65 * vLit) + 0.2 * (1. - core);
        vec3 litC = vec3(0.84, 0.84, 0.82) * (0.25 + 0.8 * uSunI) * mix(vec3(1.), uSunCol, 0.6 * vTint);
        litC = mix(litC, uSunCol * uSunI * 1.1 + uShade * 0.4, step(0.5, vTint));    // powder in the sun is brighter than the snow it flies over, never grey
        vec3 c = mix(uShade * (1.0 - 0.1 * vTint) + 0.05 - 0.03 * vTint, litC, smoothstep(0.15, 0.85, clamp(lit, 0., 1.)) * (1. - vEm.w));
        c += uSunCol * uSunI * min(vScat, 0.7) * (0.4 + 0.8 * (1. - core)) * (1. - vEm.w);
        c += vEm.rgb * (0.35 + 0.65 * body);                              // kinds that carry a light of their own (the well's throat)
        gl_FragColor = vec4(c, clamp(a, 0., 1.));
        #include <fog_fragment>
      }`,
  });
}

// builds one instanced puff mesh from a list of { o, v, p, k }
function puffMesh(list, mat) {
  const n = list.length, O = new Float32Array(n * 3), V = new Float32Array(n * 3), P = new Float32Array(n * 4), K = new Float32Array(n);
  list.forEach((q, i) => { O.set(q.o, i * 3); V.set(q.v, i * 3); P.set(q.p, i * 4); K[i] = q.k; });
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(O, 3));
  g.setAttribute('aV', new THREE.InstancedBufferAttribute(V, 3));
  g.setAttribute('aP', new THREE.InstancedBufferAttribute(P, 4));
  g.setAttribute('aK', new THREE.InstancedBufferAttribute(K, 1));
  g.instanceCount = n;
  const m = new THREE.Mesh(g, mat);
  m.frustumCulled = false; m.renderOrder = 3;
  return m;
}

function puffUniforms(heroU) {
  const v4 = () => new THREE.Vector4(0, 0, 0.5, 1), arr = (f) => [0, 1, 2, 3, 4, 5].map(f);
  return {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
    uTime: heroU.uTime, uSunCol: heroU.uSunCol, uShade: heroU.uShade, uSunI: heroU.uSunI,
    uCamP: { value: new THREE.Vector3() }, uSunP: { value: new THREE.Vector3(0, 1, 0) }, uWindP: { value: new THREE.Vector3() },
    uKA: { value: arr(v4) }, uKB: { value: arr(() => new THREE.Vector4(0, 0, 3, 1)) }, uKC: { value: arr(() => new THREE.Vector4(0, 0, 0, 0)) },
    uGate: { value: arr(() => 1) }, uDrive: { value: arr(() => 0) }, uAnchor: { value: arr(() => new THREE.Vector3()) },
  };
}

// paints a geometry with one linear colour (optionally shaded by height) and drops what the lit shader does not use
function paint(g, color, o = {}) {
  if (g.index) g = g.toNonIndexed();
  if (!o.keepUv) g.deleteAttribute('uv');
  const n = g.attributes.position.count, a = new Float32Array(n * 3), c = new THREE.Color(color);
  for (let i = 0; i < n; i++) { const k = o.jit ? 1 + o.jit * (Math.sin(i * 12.9898) * 0.5) : 1; a[i * 3] = c.r * k; a[i * 3 + 1] = c.g * k; a[i * 3 + 2] = c.b * k; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}

// one island peak standing out of the cloud sea: a ridged cone with snow caps baked into vertex colours
function peakGeometry(noise, o) {
  const NR = o.rings, NS = o.segs, nv = NR * NS + 1;
  const pos = new Float32Array(nv * 3), idx = [];
  const sd = o.seed, RP = o.stack ? 0.8 : 1.35;                    // stacks keep their rings on the walls, peaks near the summit
  const hAt = (px, pz) => {
    const r = Math.hypot(px, pz) / o.R, c = Math.max(1 - r, 0);
    const rid = noise.ridged2(px / o.R * 1.6 + sd, pz / o.R * 1.6 - sd, 4);
    let h = Math.pow(c, 1.3) * (0.5 + 0.62 * rid) + 0.1 * c * noise.fbm2(px / o.R * 5 + sd, pz / o.R * 5, 3);
    if (o.stack) {                                                  // a rock stack: sheer walls, a broken crown
      // a tower, narrower along one axis, with a lower pinnacle standing against it on that side
      const ca = Math.cos(o.rot), sa = Math.sin(o.rot), qx = px * ca + pz * sa, qz = -px * sa + pz * ca;
      const c1 = Math.max(1 - Math.hypot(qx * o.ex, qz) / o.R, 0);
      const cw = Math.max(c1 + Math.min(c1 * 8, 1) * (0.06 * noise.n2(px / o.R * 2.3 + sd, pz / o.R * 2.3 - sd) + 0.075 * noise.n2(px / o.R * 6.1 - sd, pz / o.R * 6.1 + sd)), 0);   // the wall line wanders: buttresses, bays and gullies
      h = Math.pow(Math.min(cw * 2.5, 1), 0.55) * (0.93 + 0.07 * rid) + 0.05 * Math.max(cw - 0.4, 0);          // sheer at the foot, leaning in to a shoulder and a crown
      { const hs = h * 6 + 0.8 * noise.n2(px / o.R * 1.7 + sd, pz / o.R * 1.7), fl = Math.floor(hs), fr = hs - fl; h += 0.5 * ((fl + smoothstep(0.62, 1, fr) - 0.8 * noise.n2(px / o.R * 1.7 + sd, pz / o.R * 1.7)) / 6 - h) * Math.min(cw * 10, 1); }   // ledges: the wall climbs in steps
      const c2 = Math.max(1 - Math.hypot(qx - 0.55 * o.R, qz - 0.1 * o.R) / (0.42 * o.R), 0);
      h = Math.max(h, Math.pow(Math.min(c2 * 2.5, 1), 0.55) * o.sub * (0.95 + 0.05 * rid));
    }
    if (o.twin) { const hx = px / o.R, hz = pz / o.R; h += 0.3 * Math.exp(-((hx + 0.2) * (hx + 0.2) * 26 + hz * hz * 40)) + 0.24 * Math.exp(-((hx - 0.24) * (hx - 0.24) * 30 + (hz - 0.05) * (hz - 0.05) * 46)); }
    if (o.horn) { const hx = px / o.R - 0.06, hz = pz / o.R + 0.03; h += 0.42 * Math.exp(-(hx * hx * 30 + hz * hz * 90)) + 0.2 * Math.exp(-((hx + 0.22) * (hx + 0.22) * 60 + hz * hz * 80)); }
    return h;
  };
  let hMax = 0;
  for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) hMax = Math.max(hMax, hAt(Math.cos(i / NS * TAU) * o.R * Math.pow((j + 1) / NR, RP), Math.sin(i / NS * TAU) * o.R * Math.pow((j + 1) / NR, RP)));
  hMax = Math.max(hMax, hAt(0, 0));
  const sc = (o.top - o.base) / hMax;
  pos[0] = o.x; pos[1] = o.base + hAt(0, 0) * sc; pos[2] = o.z;
  let v = 1;
  for (let j = 0; j < NR; j++) {
    const rr = o.R * Math.pow((j + 1) / NR, RP);
    for (let i = 0; i < NS; i++) {
      const a = (i + (j & 1) * 0.5) / NS * TAU, px = Math.cos(a) * rr, pz = Math.sin(a) * rr;
      pos[v * 3] = o.x + px; pos[v * 3 + 1] = o.base + hAt(px, pz) * sc; pos[v * 3 + 2] = o.z + pz; v++;
    }
  }
  if (o.stack) for (let i = 0; i < nv; i++) { const up = pos[i * 3 + 1] - o.base; pos[i * 3] += o.lx * up; pos[i * 3 + 2] += o.lz * up; }   // no tower stands quite plumb
  for (let i = 0; i < NS; i++) idx.push(0, 1 + (i + 1) % NS, 1 + i);
  for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NS; i++) {
    const a = 1 + j * NS + i, b = 1 + j * NS + (i + 1) % NS, c = a + NS, d = b + NS;
    idx.push(a, b, c, b, d, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx); g.computeVertexNormals();
  const nor = g.attributes.normal, col = new Float32Array(nv * 3);
  const snow = new THREE.Color('#dfe6f2'), rock = new THREE.Color(o.stack ? '#6a7485' : PAL[5]);
  for (let i = 0; i < nv; i++) {
    const h01 = (pos[i * 3 + 1] - o.base) / (o.top - o.base), n = noise.n2(pos[i * 3] * 0.004 + sd, pos[i * 3 + 2] * 0.004);
    let s = smoothstep(0.18, 0.42, h01 + 0.14 * n) * smoothstep(0.5, 0.8, nor.getY(i) + 0.12 * n + 0.25 * h01);
    let k = 0.75 + 0.5 * (0.5 + 0.5 * noise.n2(pos[i * 3 + 1] * 0.02, sd + i * 0.01));
    if (o.stack) {                                                // near rock: the shader paints beds, ledges and rime; here only (crown snow, tone, height)
      const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
      s = Math.max(s, 0.85 * smoothstep(0.05, 0.5, noise.n2(x * 0.11 + sd, y * 0.17 - z * 0.11)) * smoothstep(0.45, 0.95, h01));
      col[i * 3] = s; col[i * 3 + 1] = 0.5 + 0.5 * noise.n2(x * 0.05 + sd, z * 0.05 + y * 0.03); col[i * 3 + 2] = clamp(h01, 0, 1);
      continue;
    }
    col[i * 3] = lerp(rock.r * k, snow.r, s); col[i * 3 + 1] = lerp(rock.g * k, snow.g, s); col[i * 3 + 2] = lerp(rock.b * k, snow.b, s);
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.userData.heightAt = (dx, dz) => o.base + hAt(dx, dz) * sc;
  return g;
}

export default {
  id: 'snow-ghosts',
  name: 'First Tracks',
  category: 'wilderness',
  weirdness: 0.1,
  media: ['snow'],
  async build(ctx) {
    const { rng, noise } = ctx;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = ctx.quality?.detail ?? 1;
    const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
    await ctx.yield();
    const scene = new THREE.Scene();
    const C = (h) => new THREE.Color(h);

    // ---------------------------------------------------------------- the look of this visit
    const hourKey = LOOKS[vary.hour] ? vary.hour : rng.pick(['day', 'dawn', 'day', 'golden', 'day', 'dawn', 'day', 'golden', 'night']);
    const look = LOOKS[hourKey];
    const sunSnow = rng.chance(hourKey === 'day' ? 0.4 : 0.25);       // weather: fat flakes out of a clear sky
    const rare = !!vary.rare;
    const sunAz = look.az + rng.range(-5, 5), sunEl = look.el + rng.range(-1, 1.5);
    const SUN = skyDirection(sunEl, sunAz).clone().normalize();
    const sunLeft = SUN.x < 0;

    const sky = makeSky({
      rng, preset: look.preset, bake: true, renderer: ctx.renderer,
      zenith: look.zenith, mid: look.mid, horizon: look.horizon, ground: look.horizon, clouds: false, clouds2: false, horizonPow: 9, midPow: 2.2,
      cloudLit: hourKey === 'night' ? '#aab8dc' : '#f4f6fb', cloudShade: look.shade,
      stars: look.stars, scatter: hourKey === 'day' ? 0.12 : 0.3,
      ...(hourKey === 'night'
        ? { bodyOverrides: { 0: { elevation: sunEl, azimuth: sunAz, size: 2.3 } } }
        : { sunElevation: sunEl, sunAzimuth: sunAz, sunColor: look.sunCol,
            bodies: [{ elevation: rng.range(26, 38), azimuth: look.moonAz + rng.range(-8, 8), size: 1.25, phase: 0.5, phaseAngle: sunLeft ? 200 : -20, color: '#eef2fb', intensity: 0.9 }] }),
    });
    scene.add(sky.object);
    await ctx.yield();
    const fogCol = C(look.fog), fogBase = 0.00015 * (hourKey === 'dawn' ? 1.5 : hourKey === 'golden' ? 1.3 : 1);
    scene.fog = new THREE.FogExp2(fogCol.clone(), fogBase);
    const rig3 = makeLightRig(sky, { bounce: 0.5 }); scene.add(rig3.object);   // only for guests (rides, companions); the world is self-lit

    // ---------------------------------------------------------------- the mountain: one height function
    const ZL = -165;                                                  // cliff lip
    const lam = rng.range(60, 70), A1 = rng.range(6.2, 8.2), ph = rng.range(0, TAU), ph2 = rng.range(0, TAU), A2 = rng.range(3, 6.5);
    const lamB = rng.range(116, 132), AB = rng.range(17, 22), sgB = rng.sign();
    const gF = (z) => A1 * Math.sin(TAU * z / lam + ph) + A2 * Math.sin(TAU * z / 270 + ph2);
    const gB = (z) => sgB * AB * smoothstep(340, 285, z) * Math.sin(TAU * (340 - z) / lamB);
    const xL = gF(-128);
    const gx = (z) => lerp(lerp(gB(z), gF(z), smoothstep(192, 150, z)), xL, smoothstep(-110, -142, z));

    const slope = (z) => {
      let s = 0.448 + 0.00056 * clamp(z, ZL, 150);                    // apron easing 28 -> 20 degrees
      s = lerp(s, 0.625, smoothstep(150, 195, z));                    // the bowl, 32 degrees
      s = lerp(s, 0.02, smoothstep(322, 347, z));                     // roll-over onto the summit ridge
      s = lerp(s, -0.105, smoothstep(-137, -163, z));                 // the wind lip that launches us
      return s;
    };
    const PZ0 = ZL, PZ1 = 690, PN = (PZ1 - PZ0) * 2;
    const prof = new Float32Array(PN + 1);
    { let acc = 0; for (let i = 1; i <= PN; i++) { acc += slope(PZ0 + (i - 0.5) * 0.5) * 0.5; prof[i] = acc; } const y0 = prof[Math.round(-PZ0 * 2)]; for (let i = 0; i <= PN; i++) prof[i] -= y0; }
    const profAt = (z) => { const f = clamp((z - PZ0) * 2, 0, PN - 0.001), i = Math.floor(f); return prof[i] + (prof[i + 1] - prof[i]) * (f - i); };
    const halfW = (z) => lerp(lerp(2.2, 78, smoothstep(352, 262, z)), 132, smoothstep(215, 120, z));
    const ox = rng.range(-50, 50), oz = rng.range(-50, 50);
    const yLip = profAt(ZL);
    const Hgen = (x, z, fine) => {
      const zc = Math.max(z, ZL), ax = Math.abs(x), w = halfW(zc), d = Math.max(ax - w, 0);
      let y = profAt(zc);
      const ribK = bell(zc, 128, 346, 0.22);
      if (ribK > 0) { const q = (ax - w - 3) / 9; y += 13 * Math.exp(-q * q) * ribK * (fine ? 0.75 + 0.45 * noise.n2(z * 0.045, x > 0 ? 7.3 : -4.1) : 0.85); }
      let drop = d * (0.95 + 0.0016 * d);
      if (fine) {
        drop *= 1 + 0.22 * noise.n2(x * 0.017 + 3, z * 0.017);
        y += (1.5 * noise.fbm2(x * 0.011 + ox, z * 0.011 + oz, 3) + 0.35 * noise.n2(x * 0.045 - oz, z * 0.045 + ox)) * (1 - smoothstep(318, 346, z)) * smoothstep(ZL, ZL + 30, zc);
        y += 5 * noise.n2(x * 0.03, z * 0.03 + 11) * smoothstep(4, 40, d);
      }
      y -= drop + smoothstep(335, 352, z) * (x > 0 ? Math.min(d, 10) * 0.8 : 0);
      if (z < ZL) {
        const c = ZL - z, wall = smoothstep(0, 9, c);
        y -= 62 * wall + 0.5 * Math.max(c - 9, 0);
        if (fine) y += wall * (1 - smoothstep(9, 40, c)) * 3.5 * noise.n2(x * 0.07, y * 0.09);
      }
      return y;
    };
    const H = (x, z) => Hgen(x, z, true), Hs = (x, z) => Hgen(x, z, false);

    // ---------------------------------------------------------------- the camera path
    const pts = [];
    const Z_IN = 412;
    for (let z = Z_IN; z > 350; z -= 10.4) pts.push([0, H(0, z) + 1.5, z]);
    for (let z = 349; z > ZL + 3; z -= 6) { const x = gx(z); pts.push([x, H(x, z) + 1.5, z]); }
    const yEye = H(xL, ZL) + 1.5;
    pts.push([xL, yEye, ZL]);
    for (const [dz, dy] of [[-15, 1.6], [-35, 3.2], [-60, 4.2], [-85, 3.8], [-107, 2.3]]) pts.push([xL, yEye + dy, ZL + dz]);
    const zF = ZL - 123, yF = yEye, RA = 45;
    pts.push([xL, yF, zF]);
    for (const deg of [15, 30, 45]) { const a = deg * Math.PI / 180; pts.push([xL, yF - RA * (1 - Math.cos(a)), zF - RA * Math.sin(a)]); }
    const zS = zF - RA * Math.sin(Math.PI / 3), yS = yF - RA * 0.5;
    for (let k = 0; k <= 4; k++) pts.push([xL, yS - 0.866 * 15 * k, zS - 0.5 * 15 * k]);
    await ctx.yield();
    const path = makePath(pts, { samples: 640 });
    const END = path.end.clone(), LEN = path.length, DUR = 42;
    const U_ROLL = path.nearestXZ(0, 338).u, U_FOREST = path.nearestXZ(gx(150), 150).u, U_LIP = path.nearestXZ(xL, ZL).u;
    const cloudTop = END.y - 5;                                       // puff tops of the cloud sea round the well
    await ctx.yield();

    // ---------------------------------------------------------------- drowned outliers: rock stacks standing out of the cloud
    // Rime-crusted stacks along the float and in a crescent beyond the well, each crowned with snow ghosts, so the last
    // third has dark shapes, white figures and long blue shadows lying on the cloud. (Own rng: nothing else is reshuffled.)
    const xr = ctx.core.makeRng('sg-outliers:' + ctx.seed);
    const stacks = [], stackGeos = [], stackGhosts = [];
    {
      const defs = [   // [dz beyond the well, lateral, R, top above the cloud]: a crescent round the well, then a line of drowned outliers receding ahead
        [-12, -31, 12.5, 18], [-38, 4, 14, 26], [-10, 32, 12, 16],
        [-98, -74, 20, 40], [-165, 92, 17, 62], [-215, -165, 15, 48], [-270, -22, 30, 58], [-345, 200, 26, 90], [-430, -220, 40, 76], [-540, 70, 34, 84],
      ];
      // One rule for every stack of the table, on every seed: the upright plane we float and dive in (x = xL) keeps a lane
      // of open cloud, so no rock stands behind the companion or the well. The lane's half-width is LANE metres at the well
      // plus LANE_SHARE of the distance beyond it (a lane of one width would close to nothing with distance, and the far
      // stacks would still stand behind the well). A stack whose flank would stand inside the lane is moved straight
      // sideways, on the side it already stands on, until its flank is on the lane's edge. None is dropped.
      const LANE = 6, LANE_SHARE = 0.1;
      const sFlip = xr.sign();
      for (const [dz, lat, R0, up] of defs) {
        const R = R0 * xr.range(0.9, 1.12), x0 = xL + sFlip * lat * xr.range(0.9, 1.12) + xr.range(-2, 2), z = END.z + dz * xr.range(0.94, 1.08);
        const clear = R + LANE + LANE_SHARE * Math.max(END.z - z, 0), x = Math.abs(x0 - xL) < clear ? xL + (x0 < xL ? -clear : clear) : x0;
        const top = cloudTop + up * xr.range(0.92, 1.12);
        const o = { x, z, base: cloudTop - 0.25 * up - 6, top, R, stack: true, rings: 22, segs: 40, seed: xr.range(0, 40),
          rot: xr.range(0, TAU), ex: xr.range(1.15, 1.6), sub: xr.range(0.5, 0.82), lx: xr.range(-0.1, 0.1), lz: xr.range(-0.08, 0.08) };
        if (path.distanceTo(x, o.top, z) < 0.75 * R + 10) continue;   // never near the line of flight
        const g = peakGeometry(noise, o); o.heightAt = g.userData.heightAt;
        stacks.push(o); stackGeos.push(g);
        const nG = R > 28 ? 5 : R > 18 ? 4 : 3, a0 = xr.range(0, TAU), nearby = stacks.length <= 3;
        for (let k = 0; k < nG; k++) {
          const a = a0 + k / nG * TAU + xr.range(-0.4, 0.4), rr = R * (k === 0 ? 0.05 : xr.range(0.16, 0.3)), dx = Math.cos(a) * rr, dzz = Math.sin(a) * rr;
          const gy = o.heightAt(dx, dzz) - 1.3, upg = gy + 1.3 - o.base;
          stackGhosts.push({ x: x + dx + o.lx * upg, y: gy, z: z + dzz + o.lz * upg, scale: xr.range(0.8, 1.1) * (k === 0 ? 1.15 : 1) * (R > 28 ? 1.25 : 1), hi: nearby });
        }
        await ctx.yield();
      }
    }
    // dark outcrops in the bowl (built further down; listed here so the hero can bake their shadows)
    const crags = [];
    // Thirteen strata down the bowl take one outcrop each from the outlier stream. That stream goes on to deal the
    // slough's lumps and the mist in the well's throat, so no more outcrops are drawn from it than these thirteen.
    for (let i = 0; i < 13; i++) {
      const z = 178 + (i + xr.range(0.1, 0.9)) * (150 / 13), side = i & 1 ? 1 : -1, x = gx(z) + side * (17 + 36 * Math.pow(xr(), 1.3)), r = xr.range(1.6, 3.4);
      if (Math.abs(x) > halfW(z) - 9) continue;
      crags.push({ x, z, r, h: r * xr.range(0.8, 1.25), yaw: xr.range(0, TAU) });
    }
    // Nine more, one to each of nine strata of the same bowl, on alternate sides and further out from the line. They are
    // dealt from a stream of their own, so they shift no draw of the outlier stream.
    const nCragsBase = crags.length, xc = ctx.core.makeRng('sg-crags:' + ctx.seed);
    for (let i = 0; i < 9; i++) {
      const z = 176 + (i + xc.range(0.1, 0.9)) * (156 / 9), side = i & 1 ? -1 : 1, x = gx(z) + side * (23 + 48 * Math.pow(xc(), 1.2)), r = xc.range(1.6, 3.4);
      if (Math.abs(x) > halfW(z) - 9) continue;
      crags.push({ x, z, r, h: r * xc.range(0.8, 1.25), yaw: xc.range(0, TAU) });
    }

    // ---------------------------------------------------------------- the hero: ghosts, tracks, companion, plumes
    const hero = await buildHero(ctx, {
      palette: PAL, heightAt: H, glade: gx, snow: false, density: clamp(vary.density, 0.75, 1.25), sunDir: SUN,
      speed: 22, trackTop: 404, trackBottom: ZL + 1.2, plumeScale: (z) => smoothstep(352, 322, z),
      // the whole apron, rib to rib, holds figures; the first outliers stand in the lower bowl, and the forest runs to
      // the lip, where it stops at a line of sky
      count: 900, width: 260, spacing: 10, near: 116, thin: 15, top: 232, keep: (x, z) => Math.abs(x) < halfW(z) - 7 && z < 232,
      extra: stackGhosts, casters: crags,
    });
    scene.add(hero.object);
    hero.setLight({ sunColor: look.sunCol, sky: look.fill, shade: look.shade, intensity: look.sunI });
    const HU = hero.uniforms;
    HU.uSparkle.value = look.sparkle; HU.uRock.value.set('#5d6779'); HU.uPlumeA.value = 0.9; HU.uScat.value = look.veil;
    await ctx.yield();

    // ---------------------------------------------------------------- terrain mesh (shares the hero's snow shader and shadow map)
    let snowMat = null, flagMat = null;
    {
      const NX = 150, x0s = new Float32Array(NX + 1);
      for (let i = 0; i <= NX; i++) { const t = (i / NX) * 2 - 1, a = Math.abs(t); x0s[i] = Math.sign(t) * 350 * (0.25 * a + 0.75 * Math.pow(a, 2.2)); }
      const zs = [];                                                  // coarse rows behind the entry, 2 m rows along the run
      for (let z = 676; z > 432; z -= 6) zs.push(z);
      for (let z = 432; z >= -262; z -= 2) zs.push(z);
      const NZ = zs.length - 1, nv = (NX + 1) * (NZ + 1);
      const pos = new Float32Array(nv * 3), rs = new Float32Array(nv * 2), idx = new Uint32Array(NX * NZ * 6);
      let v = 0;
      for (let j = 0; j <= NZ; j++) {
        const z = zs[j];
        const gz = clamp(z, ZL, 420) === z ? gx(z) : (z > 420 ? 0 : xL);
        for (let i = 0; i <= NX; i++) {
          const x = x0s[i] + gz * (1 - Math.min(1, Math.abs(x0s[i]) / 200));     // the fine columns follow the glade
          pos[v * 3] = x; pos[v * 3 + 1] = H(x, z); pos[v * 3 + 2] = z; v++;
        }
        if ((j & 15) === 15) await ctx.yield();
      }
      let q = 0;
      for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const a = j * (NX + 1) + i, b = a + 1, c = a + NX + 1, d = c + 1; idx[q++] = a; idx[q++] = b; idx[q++] = c; idx[q++] = b; idx[q++] = d; idx[q++] = c; }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      await ctx.yield();
      // normals straight from the grid (central differences), in slices, so no single step is long
      const nrm = new Float32Array(nv * 3), W1 = NX + 1;
      for (let j = 0; j <= NZ; j++) {
        const j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, NZ);
        for (let i = 0; i <= NX; i++) {
          const a = (j * W1 + Math.max(i - 1, 0)) * 3, b = (j * W1 + Math.min(i + 1, NX)) * 3, c = (j0 * W1 + i) * 3, d = (j1 * W1 + i) * 3;
          const ax = pos[b] - pos[a], ay = pos[b + 1] - pos[a + 1], az = pos[b + 2] - pos[a + 2];
          const bx = pos[d] - pos[c], by = pos[d + 1] - pos[c + 1], bz = pos[d + 2] - pos[c + 2];
          const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, nl = Math.hypot(nx, ny, nz) || 1, o = (j * W1 + i) * 3;
          nrm[o] = nx / nl; nrm[o + 1] = ny / nl; nrm[o + 2] = nz / nl;
        }
        if ((j & 63) === 63) await ctx.yield();
      }
      g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
      await ctx.yield();
      const sh = Math.hypot(SUN.x, SUN.z) || 1e-3, sdx = SUN.x / sh, sdz = SUN.z / sh, sty = SUN.y / sh;
      const STEPS = [5, 11, 19, 30, 46, 70, 105, 150];
      for (let i = 0; i < nv; i++) {
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2], ny = nrm[i * 3 + 1];
        let rock = smoothstep(0.78, 0.6, ny);
        if (z < ZL) rock = Math.max(rock, smoothstep(0.5, 6, ZL - z) * 1.2);
        const w = halfW(Math.max(z, ZL)), qr = (Math.abs(x) - w - 3) / 7;
        rock = Math.max(rock, 0.9 * Math.exp(-qr * qr) * bell(z, 128, 346, 0.22) * smoothstep(0.93, 0.8, ny));
        if (z > 338 && x > 0.4 && x < 5) rock *= 1 - smoothstep(338, 347, z);   // the crest under the root of the cornice stays snow
        rs[i * 2] = rock;
        let s = 0;
        if (Math.abs(x) < 200 && z < 380) {
          const y0 = Hs(x, z);
          for (let k = 0; k < STEPS.length; k++) { const t = STEPS[k]; s = Math.max(s, smoothstep(0, 1.5 + 0.06 * t, Hs(x + sdx * t, z + sdz * t) - (y0 + sty * t) - 0.4)); }
        }
        rs[i * 2 + 1] = s;
        if ((i & 511) === 511) await ctx.yield();
      }
      g.setAttribute('aRS', new THREE.BufferAttribute(rs, 2));
      await ctx.yield();
      const terrain = new THREE.Mesh(g, hero.makeSnowMaterial());
      terrain.name = 'mountain'; terrain.frustumCulled = false; scene.add(terrain); snowMat = terrain.material;

      // the cornice: a curled lip of wind-packed snow hanging over the lee side of the ridge
      // the root starts inside the ridge and comes out of it just above the crest, so no seam or rock shows along the edge
      const prf = [[1.2, -0.4], [1.32, 0.035], [3.2, 0.32], [5.0, 0.44], [6.2, 0.1], [6.5, -0.7], [6.1, -1.7], [5.1, -2.6], [3.9, -3.1], [2.6, -3.3]];
      const nseg = 130, cp = [], crs = [], ci = [];
      for (let j = 0; j <= nseg; j++) {
        const z = 346 + (676 - 346) * (j / nseg), k = (0.75 + 0.35 * noise.n2(z * 0.05, 3.3)) * smoothstep(344, 356, z), yb = profAt(z);
        for (let i = 0; i < prf.length; i++) {
          cp.push(2.0 + (prf[i][0] - 1.2) * k, yb + prf[i][1] * k, z); crs.push(0, i > 5 ? 0.9 : 0);
          if (j < nseg && i < prf.length - 1) { const a = j * prf.length + i, b = a + 1, c = a + prf.length, d = c + 1; ci.push(a, c, b, b, c, d); }
        }
      }
      const cg = new THREE.BufferGeometry();
      cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cp), 3));
      cg.setAttribute('aRS', new THREE.BufferAttribute(new Float32Array(crs), 2));
      cg.setIndex(ci); cg.computeVertexNormals();
      const cornice = new THREE.Mesh(cg, terrain.material); cornice.frustumCulled = false; scene.add(cornice);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- island peaks and the cloud sea
    const time = { value: 0 };
    const peakDefs = [
      { az: 29, D: 2700, h: 900, R: 1050, horn: true, rings: 32, segs: 80 },
      { az: -36, D: 3500, h: 620, R: 1300 }, { az: -8, D: 4300, h: 1040, R: 1800, twin: true, rings: 30, segs: 72 }, { az: 50, D: 3900, h: 520, R: 1200 },
      { az: -63, D: 2500, h: 400, R: 900 }, { az: 74, D: 3300, h: 470, R: 1000 },
    ];
    const peaks = [], peakGeos = [];
    for (const d of peakDefs) {
      const az = (d.az + rng.range(-4, 4)) * Math.PI / 180, D = d.D * rng.range(0.93, 1.08), h = d.h * rng.range(0.9, 1.12);
      const o = { x: Math.sin(az) * D, z: -Math.cos(az) * D, base: cloudTop - 90, top: cloudTop + h, R: d.R, horn: !!d.horn, twin: !!d.twin, rings: d.rings || 24, segs: d.segs || 60, seed: rng.range(0, 40) };
      const g = peakGeometry(noise, o); o.heightAt = g.userData.heightAt;
      peaks.push(o); peakGeos.push(g);
      await ctx.yield();
    }
    const peakMesh = new THREE.Mesh(mergeGeometries(peakGeos, false), litMaterial(hero.shareUniforms(), { far: true }));
    peakMesh.name = 'island-peaks'; peakMesh.frustumCulled = false; scene.add(peakMesh);
    await ctx.yield();
    if (stackGeos.length) {                                           // the stacks wear their own rock shader: beds, ledges, rime, a foot lost in cloud
      const sU = hero.shareUniforms(); sU.uCloudY = { value: cloudTop };
      const stackMesh = new THREE.Mesh(mergeGeometries(stackGeos, false), litMaterial(sU, { rock: true }));
      stackMesh.name = 'cloud-stacks'; stackMesh.frustumCulled = false; scene.add(stackMesh);
    }
    for (const g of peakGeos) g.dispose();
    for (const g of stackGeos) g.dispose();
    const horn = peaks[0];
    await ctx.yield();

    const sea = makeCloudField({
      rng, mode: 'sea', sky, altitude: cloudTop - 7, relief: 82, spacing: 74, towers: 0.12, opacity: 0.9,
      bottomColor: C(look.shade).multiplyScalar(0.85),                // lit crests over properly blue troughs
      avoid: [[END.x, END.y + 2, END.z, 30], [END.x, END.y + 34, END.z + 20, 22], [0, 215, 160, 12, cloudTop - 4, 345],
        ...peaks.map((p) => [p.x, p.top, p.z, 12, cloudTop, p.R * 0.86]),
        ...stacks.slice(0, 7).map((p) => [p.x, p.top, p.z, p.R * 0.6, cloudTop - 12, p.R * 0.9])],
    });
    scene.add(sea.object);
    await ctx.yield();
    // swells: long low banks of cloud heaped on the sea under the float, each with a lit flank and a blue one, and a
    // collar of cloud lapping the foot of every stack (same kit puffs, so they belong to the sea)
    const swellSpots = [];
    {
      const sr = ctx.core.makeRng('sg-swells:' + ctx.seed);
      for (const st of stacks) swellSpots.push([st.x + sr.range(-0.2, 0.2) * st.R, cloudTop - 0.5 * st.R - 2, st.z + sr.range(-0.2, 0.2) * st.R, st.R * 2.9]);
      for (let i = 0, tries = 0; i < 15 && tries < 200; tries++) {
        const z = lerp(ZL - 70, END.z - 520, Math.pow(sr(), 0.8)), x = xL + sr.range(-1, 1) * (140 + 0.55 * (ZL - z)), w = sr.range(110, 210) * (1 + 0.0012 * (ZL - z));
        const top = cloudTop + 0.2 * w;
        if (Math.hypot(x - END.x, z - END.z) < 70 + 0.6 * w) continue;                        // the well stays a hollow
        if (path.distanceTo(x, top, z) < 0.4 * w + 24) continue;                              // nothing reaches the line of flight
        let ok = true;
        for (const q of swellSpots) if (Math.hypot(q[0] - x, q[2] - z) < 0.45 * (q[3] + w)) { ok = false; break; }
        if (!ok) continue;
        swellSpots.push([x, cloudTop - 0.1 * w, z, w]); i++;
        if (sr.chance(0.7)) { const a = Math.atan2(SUN.x, -SUN.z) + sr.range(-0.5, 0.5); swellSpots.push([x + Math.cos(a) * 0.55 * w, cloudTop - 0.1 * w, z + Math.sin(a) * 0.55 * w, w * 0.72]); }   // drawn out into a ridge across the light
      }
    }
    const swells = makeCloudField({
      rng: ctx.core.makeRng('sg-swellfield:' + ctx.seed), sky, at: swellSpots, puffs: Math.round(30 * (0.6 + 0.4 * detail)), height: 0.2, wind: [0.5, 0, 0.14], opacity: 0.92, noiseTexture: sea.noiseTexture, renderOrder: 2.1,
      bottomColor: C(look.shade).multiplyScalar(0.85), farFade: [2200, 3200],
      avoid: [[END.x, END.y + 2, END.z, 34], ...stacks.map((p) => [p.x, p.top, p.z, p.R * 0.5, cloudTop - 14, p.R * 0.82])].slice(0, 16),
    });
    scene.add(swells.object);
    // the cloud is shaded as if the light skimmed it (a third of the sun's real height): every swell then has a lit flank and
    // a blue one instead of the whole sea facing the sun, and the crests stay under white
    for (const f of [sea, swells]) {
      f.uniforms.uSunDir.value.set(SUN.x, SUN.y * 0.3, SUN.z).normalize();
      f.uniforms.uLit.value.multiplyScalar(0.9);
    }
    await ctx.yield();
    // each stack lays a long blue shadow on the cloud, away from the sun
    {
      const hl = Math.hypot(SUN.x, SUN.z) || 1e-3, dx = -SUN.x / hl, dz = -SUN.z / hl, px = -dz, pz = dx;
      const sp = [], sa = [], si = [], NSEG = 12;
      for (const st of stacks) {
        // wide, soft, and wandering a little from side to side, as a shadow does that lies over swells
        const len = clamp((st.top - cloudTop) * hl / Math.max(SUN.y, 0.1) * 1.25, 60, 300), w0 = st.R * 1.4, b = sp.length / 3, wph = st.seed * 3.1;
        for (let j = 0; j <= NSEG; j++) {
          const t = j / NSEG, d0 = st.R * 0.1 + t * len, w = w0 * (1 - 0.5 * t), al = Math.pow(1 - t, 0.7) * smoothstep(0, 0.1, t + 0.07);
          const wob = 0.22 * w0 * Math.sin(t * 9 + wph) * t, lift = 2.5 * Math.sin(t * 7 + wph * 1.7);
          for (let i = -2; i <= 2; i++) { sp.push(st.x + dx * d0 + px * (w * i * 0.5 + wob), cloudTop + 5 + lift, st.z + dz * d0 + pz * (w * i * 0.5 + wob)); sa.push(Math.abs(i) === 2 ? 0 : i ? al * 0.8 : al); }
          if (j < NSEG) for (let i = 0; i < 4; i++) { const q = b + j * 5 + i; si.push(q, q + 1, q + 5, q + 1, q + 6, q + 5); }
        }
      }
      {                                                               // the mountain's own shade on the cloud under the cliff: the lip becomes an edge
        const b = sp.length / 3, NB = 24, zr = [ZL - 24, ZL - 60, ZL - 130, ZL - 215], ar = [0.0, 0.8, 0.55, 0.0];
        for (let j = 0; j <= NB; j++) {
          const x = xL - 420 + 840 * (j / NB), ed = smoothstep(0, 0.2, j / NB) * smoothstep(1, 0.8, j / NB), wv = 10 * Math.sin(j * 1.3 + ph);
          for (let i = 0; i < 4; i++) { sp.push(x, cloudTop + 6, zr[i] - (i ? wv + 0.12 * Math.abs(x - xL) : 0)); sa.push(ar[i] * ed); }
          if (j < NB) for (let i = 0; i < 3; i++) { const q = b + j * 4 + i; si.push(q, q + 1, q + 4, q + 1, q + 5, q + 4); }
        }
      }
      if (si.length) {
        const sg = new THREE.BufferGeometry();
        sg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(sp), 3));
        sg.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(sa), 1));
        sg.setIndex(si);
        const sm = new THREE.Mesh(sg, new THREE.ShaderMaterial({
          transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uC: { value: C(look.shade).multiplyScalar(0.36) } },
          vertexShader: 'attribute float aA; varying float vA; void main(){ vA = aA; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
          fragmentShader: 'uniform vec3 uC; varying float vA; void main(){ float a = clamp(vA, 0., 1.); gl_FragColor = vec4(uC, 0.85 * a * a * (3. - 2. * a)); }',
        }));
        sm.name = 'stack-shadows'; sm.frustumCulled = false; sm.renderOrder = 2.2; scene.add(sm);
      }
    }
    await ctx.yield();

    // our two shadows sliding across the cloud during the float: soft blue ovals, drawn out along the light
    const skShU = { uC: { value: C(look.shade).multiplyScalar(0.4) }, uA: { value: 0 } }, skSh = [];
    // Eye heights over the cloud top, in metres. The swells' crests stand about a fifth of their width over it: 24 m the
    // smallest, some 50 m the largest under the float. At SH_WHOLE the eye is still up at the crests of the large ones;
    // at SH_GONE it is below the crest of the smallest, down in the cloud.
    const SH_WHOLE = 45, SH_GONE = 20;
    {
      const hl = Math.hypot(SUN.x, SUN.z) || 1e-3, g = new THREE.CircleGeometry(1, 20), k = Math.min(1 / Math.max(SUN.y, 0.2), 3.2);
      g.rotateX(-Math.PI / 2); g.scale(k, 1, 1); g.rotateY(Math.atan2(SUN.z / hl, -SUN.x / hl));
      const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: skShU,
        vertexShader: 'varying float vR; void main(){ vR = length(uv - 0.5) * 2.; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform vec3 uC; uniform float uA; varying float vR; void main(){ float a = clamp(1. - vR, 0., 1.); gl_FragColor = vec4(uC, uA * a * a * (3. - 2. * a)); }' });
      for (let i = 0; i < 2; i++) { const q = new THREE.Mesh(g, m); q.frustumCulled = false; q.renderOrder = 2.25; q.scale.setScalar(i ? 4 : 5); q.position.set(xL, cloudTop + 7, ZL - 150); scene.add(q); skSh.push(q); }
    }
    await ctx.yield();

    // a hut on a far island: one glint of window and a thread of smoke
    const fxs = fx.fxGroup(); scene.add(fxs.object);
    {
      const p = peaks[4], hx = p.R * 0.2, hz = p.R * 0.16 + 40, hy = p.heightAt(hx, hz) + 6;
      fxs.add(fx.makeGlow({ position: [p.x + hx, hy, p.z + hz], color: '#ffd28a', size: 26, intensity: hourKey === 'day' ? 2.0 : 3.0, flicker: 0.25, time }));
      fxs.add(fx.makeSmokeColumn({ rng: rng.fork('hut'), time, position: [p.x + hx + 6, hy + 4, p.z + hz], height: 190, radius: [5, 34], size: [16, 64],
        color: '#cfd6e2', colorTop: '#e8edf5', shadowColor: look.shade, ambient: look.fill, opacity: 0.5, sunDir: SUN.toArray(), sunColor: look.sunCol, wind: [1, 0, 0.25] }));
    }
    if (sunSnow) fxs.add(fx.makeParticles({ rng: rng.fork('flakes'), preset: 'snow', density: 0.32 * detail, time, intensity: hourKey === 'night' ? 0.8 : 1.5 }));

    await ctx.yield();
    // ---------------------------------------------------------------- the cloud well and its glowing rim
    const frame = path.frameAt(true, new THREE.Matrix4(), true);
    const rimU = { uTime: HU.uTime, uCol: { value: C(look.portal) }, uAxis: { value: path.tangentAt(1).clone().normalize() } };
    const rim = new THREE.Mesh(new THREE.RingGeometry(7.1, 17, 72, 2), new THREE.ShaderMaterial({
      uniforms: rimU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vP; varying vec3 vW; void main(){ vP = position.xy; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
      fragmentShader: /* glsl */ `uniform float uTime; uniform vec3 uCol, uAxis; varying vec2 vP; varying vec3 vW;
        void main(){ float r = length(vP), a = atan(vP.y, vP.x + 1e-5);
          float k = clamp((r - 7.1) / 9.9, 0., 1.), f = (1. - k); f *= f * f;
          f *= 0.75 + 0.25 * sin(a * 5. - uTime * 0.6) * sin(a * 3. + uTime * 0.37);
          vec3 vd = vW - cameraPosition;                                           // seen edge-on the ring fades away
          float face = abs(dot(vd / max(length(vd), 1e-3), uAxis));
          float hot = exp(-max(r - 7.3, 0.) / 1.25);                                  // the lip of the opening burns with the next world
          gl_FragColor = vec4(uCol * (1.7 * f * f + 1.4 * hot) * smoothstep(0., 0.025, k) * smoothstep(0.3, 0.75, face), 1.); }`,
    }));
    rim.applyMatrix4(frame); rim.renderOrder = 2.6; rim.frustumCulled = false; scene.add(rim);
    // the well itself: a funnel of cloud with blue walls, turning very slowly
    {
      // a dish that feathers out into the cloud sea at its rim and closes under the portal as a glowing floor
      const NA = 72, NRr = 18, fp = [], fpol = [], fi = [];
      for (let j = 0; j <= NRr; j++) for (let i = 0; i <= NA; i++) {
        const r = lerp(0.5, 50, Math.pow(j / NRr, 1.15)), a = (i / NA) * TAU;
        fp.push(END.x + Math.cos(a) * r, END.y - 14.5 + 14 * smoothstep(8, 46, r) - 5 * (1 - smoothstep(0, 9, r)), END.z + Math.sin(a) * r); fpol.push(r, a);
        if (j < NRr && i < NA) { const q0 = j * (NA + 1) + i, q1 = q0 + 1, q2 = q0 + NA + 1, q3 = q2 + 1; fi.push(q0, q2, q1, q1, q2, q3); }
      }
      const fg = new THREE.BufferGeometry();
      fg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fp), 3));
      fg.setAttribute('aPol', new THREE.BufferAttribute(new Float32Array(fpol), 2));
      fg.setIndex(fi); fg.computeVertexNormals();
      const wellU = hero.shareUniforms(); wellU.uCol = rimU.uCol;
      const well = new THREE.Mesh(fg, new THREE.ShaderMaterial({
        fog: true, uniforms: wellU, side: THREE.DoubleSide, transparent: true, depthWrite: false,
        vertexShader: /* glsl */ `attribute vec2 aPol; varying vec2 vPol; varying vec3 vN;
          #include <common>
          #include <fog_pars_vertex>
          void main(){ vPol = aPol; vN = normal; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */ `uniform vec3 uSun, uSunCol, uShade, uCol; uniform float uSunI, uTime; varying vec2 vPol; varying vec3 vN;
          #include <common>
          #include <fog_pars_fragment>
          float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
          float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
            return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
          void main(){
            float r = vPol.x, a = vPol.y + uTime * 0.12 + 22. / (r + 6.);            // the spiral winds tighter toward the eye
            vec2 d = vec2(cos(a), sin(a));
            float n = vn(d * 2.6 + r * 0.09 + 7.) * 0.55 + vn(d * 6.3 - r * 0.22) * 0.3 + vn(d * 13. + r * 0.5) * 0.15;
            float arm = 0.5 + 0.5 * sin(a * 3. + 1.3 * (n - 0.5));                    // three arms of cloud being drawn down the throat
            n = clamp(n * (0.62 + 0.76 * arm), 0., 1.);
            float edge = 1. - smoothstep(24., 49., r);
            float alpha = smoothstep(n * 0.9, n * 0.9 + 0.35, edge);                 // feathers into the sea, no cut edge
            float wall = smoothstep(8., 36., r);
            vec3 N = normalize(vN); if (N.y < 0.) N = -N;
            N = normalize(N + 0.9 * vec3(d.x, 0., d.y) * (n - 0.5));
            float lit = smoothstep(-0.1, 0.7, dot(N, uSun)) * (0.25 + 0.75 * wall) * (0.35 + 1.3 * smoothstep(0.25, 0.75, n));
            // a pit: the wall under the sun lies in its own shade, only the far wall takes the light
            float sunSide = dot(vec2(cos(vPol.y), sin(vPol.y)), normalize(uSun.xz + vec2(1e-4)));
            float pit = 1. - smoothstep(16., 42., r);
            lit *= mix(1., 0.12 + 0.88 * smoothstep(0.3, -0.6, sunSide), pit);
            lit = mix(lit, 0.72 + 0.28 * n, 0.5 * smoothstep(20., 44., r));          // toward the rim it is the sea's own lit cloud
            vec3 c = mix(mix(uShade * (0.16 + 0.42 * wall + 0.3 * n), vec3(0.8), 0.3 * wall * wall * wall), vec3(0.9) * mix(vec3(1.), uSunCol, 0.2) * (0.25 + 0.8 * uSunI), clamp(lit, 0., 1.));
            c = mix(c, uShade * 0.7 * (0.55 + 0.6 * n), 0.6 * smoothstep(9., 14., r) * (1. - smoothstep(24., 36., r)) * (1. - 0.6 * clamp(lit, 0., 1.)));   // a blue wall round the bright opening
            float spoke = 0.5 + 0.5 * sin(vPol.y * 7. - uTime * 0.21 + 2.5 * n); spoke *= spoke * spoke;
            c += uCol * 0.55 * spoke * exp(-max(r - 8., 0.) / 8.5) * smoothstep(7., 10., r);                  // light fanning up the wall from below
            c += uCol * (1.0 + 0.6 * smoothstep(5., 8., r)) * exp(-max(r - 8., 0.) / 2.8) * (0.7 + 0.5 * n);   // the throat glows with the next world
            gl_FragColor = vec4(c, alpha);
            #include <fog_fragment>
          }`,
      }));
      well.frustumCulled = false; well.renderOrder = 2.3; scene.add(well);   // after the cloud sea, which would otherwise paint its floor over the funnel
    }

    await ctx.yield();
    // ---------------------------------------------------------------- summit cairn and its line of faded flags
    {
      const cx = -4.6, cz = 386, cy = H(cx, cz), parts = [];
      const rr = rng.fork('cairn');
      for (let i = 0; i < 18; i++) {
        const t = i / 17, r = (1 - t) * 0.62, a = rr.range(0, TAU);
        const g = new THREE.IcosahedronGeometry(lerp(0.42, 0.2, t) * rr.range(0.8, 1.2), 0);
        g.scale(1.25, 0.6, 1); g.rotateY(rr.range(0, TAU)); g.translate(cx + Math.cos(a) * r * rr(), cy + 0.1 + t * 1.45, cz + Math.sin(a) * r * rr());
        parts.push(paint(g, C(PAL[5]).multiplyScalar(rr.range(0.7, 1.5))));
        if (i % 3 === 0) { const sgeo = new THREE.SphereGeometry(0.3, 7, 5); sgeo.scale(1.2, 0.35, 1.1); sgeo.translate(cx + Math.cos(a) * r * 0.7, cy + 0.32 + t * 1.45, cz + Math.sin(a) * r * 0.7); parts.push(paint(sgeo, '#d9e0ea')); }
      }
      await ctx.yield();
      const pole = new THREE.CylinderGeometry(0.03, 0.04, 2.6, 6); pole.translate(cx, cy + 2.4, cz); parts.push(paint(pole, '#4a3d33'));
      const top = new THREE.Vector3(cx, cy + 3.6, cz), foot = new THREE.Vector3(cx + 0.9, H(cx + 0.9, cz - 8.5) + 0.35, cz - 8.5);
      const peg = new THREE.IcosahedronGeometry(0.3, 0); peg.scale(1.2, 0.7, 1); peg.translate(foot.x, foot.y - 0.2, foot.z); parts.push(paint(peg, C(PAL[5]).multiplyScalar(1.2)));
      const line = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(top, top.clone().lerp(foot, 0.5).add(new THREE.Vector3(0.5, -0.9, 0)), foot), 14, 0.016, 4);
      parts.push(paint(line, '#3a3530'));
      await ctx.yield();
      const cragParts = [];
      for (let ci = 0; ci < crags.length; ci++) {                     // dark outcrops breaking the bowl's snow
        const c = crags[ci], y0 = H(c.x, c.z), cr = ci < nCragsBase ? xr : xc;   // each outcrop's tone comes from the stream that placed it
        for (let k = 0; k < 3; k++) {
          const f = [1, 0.62, 0.5][k], a = c.yaw + k * 2.2, off = k ? c.r * 0.62 : 0;
          const g = new THREE.IcosahedronGeometry(1, 1), gp = g.attributes.position;
          for (let q = 0; q < gp.count; q++) { const m = 1 + 0.3 * noise.n3(gp.getX(q) * 1.6 + c.x, gp.getY(q) * 1.6 + k * 7, gp.getZ(q) * 1.6 + c.z); gp.setXYZ(q, gp.getX(q) * m, gp.getY(q) * m, gp.getZ(q) * m); }
          g.computeVertexNormals();                                   // broken, faceted rock
          g.scale(c.r * 1.05 * f, c.h * 0.78 * f, c.r * 0.82 * f); g.rotateY(c.yaw + k * 1.3); g.rotateZ(0.25 * (k - 1));
          g.translate(c.x + Math.cos(a) * off, y0 + c.h * 0.3 * f, c.z + Math.sin(a) * off);
          cragParts.push(paint(g, new THREE.Color(0, cr.range(0.25, 0.9), -1.2)));   // b < 0: bare rock, snow only where it can lie
        }
      }
      await ctx.yield();
      if (cragParts.length) {                                         // bedded rock with snow on its ledges, like the stacks (no cloud at its foot)
        const cU = hero.shareUniforms(); cU.uCloudY = { value: -1e5 };
        const cm = new THREE.Mesh(mergeGeometries(cragParts, false), litMaterial(cU, { rock: true }));
        cm.name = 'bowl-crags'; cm.frustumCulled = false; scene.add(cm);
      }
      await ctx.yield();
      const stat = new THREE.Mesh(mergeGeometries(parts, false), litMaterial(hero.shareUniforms()));
      await ctx.yield();
      stat.frustumCulled = false; scene.add(stat);
      const flags = [], fcol = ['#c2584c', '#e6e4da', '#6c8cc6', '#e6e4da', '#c2584c', '#d8c98e', '#6c8cc6', '#e6e4da'];
      const curve = new THREE.QuadraticBezierCurve3(top, top.clone().lerp(foot, 0.5).add(new THREE.Vector3(0.5, -0.9, 0)), foot);
      for (let i = 0; i < 8; i++) {
        const a = curve.getPoint(0.1 + i * 0.1), b = curve.getPoint(0.1 + i * 0.1 + 0.075);
        const g = new THREE.PlaneGeometry(1, 1, 3, 4), gp = g.attributes.position, guv = g.attributes.uv;
        for (let k = 0; k < gp.count; k++) {
          const s = gp.getX(k) + 0.5, t = 0.5 - gp.getY(k);              // s along the line, t down from it
          guv.setXY(k, t, s);
          gp.setXYZ(k, lerp(a.x, b.x, s) + 0.42 * t, lerp(a.y, b.y, s) - 0.42 * t, lerp(a.z, b.z, s));   // blown out to lee
        }
        g.computeVertexNormals();
        flags.push(paint(g, fcol[i], { keepUv: true }));
      }
      await ctx.yield();
      const fm = new THREE.Mesh(mergeGeometries(flags, false), litMaterial(hero.shareUniforms(), { flag: true, side: THREE.DoubleSide }));
      fm.frustumCulled = false; scene.add(fm); flagMat = fm.material;
    }
    await ctx.yield();

    // ---------------------------------------------------------------- the lip: buried krummholz pillows and hoar-feathered grass heads
    // The forest stops, a last row of smooth pillows and dry grass stands on the wind lip, and beyond it there is only sky.
    {
      const lr = rng.fork('lip'), pg = [];
      for (let i = 0; i < 46; i++) {
        const side = i & 1 ? 1 : -1, x = xL + side * (4.6 + 72 * Math.pow(lr(), 1.4)), z = ZL + lr.range(1.2, 15);
        const rx = lr.range(0.9, 2.2), ry = rx * lr.range(0.32, 0.5), rz = rx * lr.range(0.7, 1.1);
        const g = new THREE.SphereGeometry(1, 10, 6, 0, TAU, 0, Math.PI * 0.62); g.scale(rx, ry, rz); g.rotateY(lr.range(0, TAU)); g.translate(x, H(x, z) - 0.12 * ry, z);
        g.deleteAttribute('uv'); pg.push(g);
      }
      await ctx.yield();
      const bq = new THREE.Quaternion(), bUp = new THREE.Vector3(0, 1, 0), bN = new THREE.Vector3();
      const br = rng.fork('bowl');                                    // wind pillows over buried rocks, scattered down the open bowl
      for (let i = 0; i < 112; i++) {
        const z = br.range(172, 328), side = br.sign(), x = gx(z) + side * (9 + 62 * Math.pow(br(), 1.2));
        const rx = br.range(1.6, 4.2), ry = rx * br.range(0.16, 0.3), rz = rx * br.range(0.7, 1.2), yaw = br.range(0, TAU);
        if (Math.abs(x) > halfW(z) - 8) continue;
        const g = i < 44 ? new THREE.SphereGeometry(1, 12, 6, 0, TAU, 0, Math.PI * 0.6) : new THREE.SphereGeometry(1, 9, 5, 0, TAU, 0, Math.PI * 0.6); g.scale(rx, ry, rz); g.rotateY(yaw);
        g.applyQuaternion(bq.setFromUnitVectors(bUp, bN.set(H(x - 1, z) - H(x + 1, z), 2, H(x, z - 1) - H(x, z + 1)).normalize()));   // lies on the slope
        g.translate(x, H(x, z) - 0.1 * ry, z);
        g.deleteAttribute('uv'); pg.push(g);
        if ((i & 15) === 15) await ctx.yield();
      }
      for (const c of crags) {                                        // each outcrop wears a cap of wind-packed snow, drifted to lee
        const y0 = H(c.x, c.z);
        const g = new THREE.SphereGeometry(1, 10, 5, 0, TAU, 0, Math.PI * 0.55); g.scale(c.r * 1.0, c.r * 0.36, c.r * 0.86); g.rotateY(c.yaw); g.translate(c.x + 0.25 * c.r, y0 + 0.86 * c.h, c.z);
        g.deleteAttribute('uv'); pg.push(g);
        const t = new THREE.SphereGeometry(1, 9, 5, 0, TAU, 0, Math.PI * 0.6); t.scale(c.r * 1.9, c.r * 0.32, c.r * 0.9); t.translate(c.x + 1.7 * c.r, H(c.x + 1.7 * c.r, c.z) - 0.05, c.z);
        t.deleteAttribute('uv'); pg.push(t);
      }
      await ctx.yield();
      const pm = mergeGeometries(pg, false);
      await ctx.yield();
      pm.setAttribute('aRS', new THREE.BufferAttribute(new Float32Array(pm.attributes.position.count * 2), 2));
      const pil = new THREE.Mesh(pm, snowMat); pil.name = 'lip-pillows'; pil.frustumCulled = false; scene.add(pil);
      for (const g of pg) g.dispose();
      await ctx.yield();

      const pos = [], nor = [], uv = [], col = [], idx = [];
      const straw = C('#a48c58'), hoar = C('#e9eef5'), cc = new THREE.Color();
      const vtx = (x, y, z, nx, nz, t, phs, k) => { pos.push(x, y, z); nor.push(nx, 0, nz); uv.push(t * 0.45, phs); cc.copy(straw).lerp(hoar, k); col.push(cc.r, cc.g, cc.b); return pos.length / 3 - 1; };
      for (let i = 0; i < 96; i++) {
        const side = i & 1 ? 1 : -1, x0 = xL + side * (2.6 + 46 * Math.pow(lr(), 1.3)), z0 = ZL + lr.range(0.4, 7);
        for (let b = 0; b < 5; b++) {
          const x = x0 + lr.range(-0.25, 0.25), z = z0 + lr.range(-0.25, 0.25), y = H(x, z) - 0.04;
          const h = lr.range(0.55, 1.15), a = lr.range(0, TAU), lean = lr.range(0.1, 0.5), phs = lr() * 3, dx = Math.cos(a), dz = Math.sin(a);
          let prev = -1;
          for (let k = 0; k <= 3; k++) {
            const t = k / 3, ww = 0.034 * (1 - 0.45 * t), px = x + lean * h * t * t, py = y + h * t;
            const v0 = vtx(px - dz * ww, py, z + dx * ww, dx, dz, t, phs, 0.25 + 0.5 * t); vtx(px + dz * ww, py, z - dx * ww, dx, dz, t, phs, 0.25 + 0.5 * t);
            if (prev >= 0) idx.push(prev, prev + 1, v0, prev + 1, v0 + 1, v0);
            prev = v0;
          }
          const tx = x + lean * h, ty = y + h, hw = lr.range(0.05, 0.085), hh = lr.range(0.18, 0.3);     // the feathered head
          const b0 = vtx(tx, ty - 0.02, z, dx, dz, 1, phs, 0.9); vtx(tx - dz * hw + 0.03, ty + hh * 0.4, z + dx * hw, dx, dz, 1, phs, 1); vtx(tx + dz * hw + 0.03, ty + hh * 0.4, z - dx * hw, dx, dz, 1, phs, 1); vtx(tx + 0.08, ty + hh, z, dx, dz, 1, phs, 1);
          idx.push(b0, b0 + 1, b0 + 2, b0 + 1, b0 + 3, b0 + 2);
        }
      }
      const gg = new THREE.BufferGeometry();
      gg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
      gg.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(nor), 3));
      gg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2));
      gg.setAttribute('color', new THREE.BufferAttribute(new Float32Array(col), 3));
      gg.setIndex(idx);
      const grass = new THREE.Mesh(gg, flagMat); grass.name = 'hoar-grass'; grass.frustumCulled = false; scene.add(grass);
    }

    // ---------------------------------------------------------------- powder in the air (world space)
    const wind = hero.anchors.wind.clone();
    const PU = puffUniforms(HU);
    PU.uWindP.value.copy(wind); PU.uSunP.value.copy(SUN);
    const setKind = (U, k, a, b) => { U.uKA.value[k].set(...a); U.uKB.value[k].set(...b); U.uKB.value[k].w *= look.veil; };
    setKind(PU, 0, [2.4, 0.04, 0.6, 0.5], [0, 0, 6, 0.8]);        // spindrift
    setKind(PU, 1, [0.25, 1.1, 0.6, 0.85], [0, 0, 6, 0.8]);        // slough
    setKind(PU, 2, [0, 0, 0, 0.85], [1, 0.11, 7, 0.5]);           // the well
    setKind(PU, 3, [0, 0, 0.75, 0.95], [2, 0, 60, 1]);            // avalanche
    setKind(PU, 4, [0, 0, 0, 0.34], [1, 0.17, 7, 0.3]);           // glowing mist in the well's throat
    setKind(PU, 5, [0.25, 1.3, 0.5, 1.0], [0, 0, 6, 0]);           // the slough's shadowed body
    { const pc = C(look.portal); PU.uKC.value[4].set(pc.r * 0.6, pc.g * 0.6, pc.b * 0.6, 0.85); PU.uKC.value[5].set(-0.07, -0.11, -0.17, 0.9); }
    PU.uAnchor.value[4].copy(END);
    PU.uAnchor.value[2].copy(END);
    const wp = [], pr = rng.fork('puffs');
    const spin = (x, y, z, n, sz, r = pr) => { for (let i = 0; i < n; i++) wp.push({ o: [x + r.range(-1, 1), y + r.range(0, 0.5), z + r.range(-1.5, 1.5)], v: [wind.x * r.range(3, 7), r.range(0.5, 2.4), wind.z * 5 + r.range(-0.6, 0.6)], p: [r(), r.range(2.4, 4.2), sz * r.range(0.7, 1.3), r()], k: 0 }); };
    for (let z = 350; z < 540; z += 1.7) spin(6.0, profAt(z) + 0.3, z, 1, 3.3);                       // off the cornice
    const ridgeAt = wp.length;                                        // the ridge's own sheet of spindrift is dealt at the end of this block and takes its place here
        for (let z = 150; z < 335; z += 5.5) for (const s of [-1, 1]) { const x = s * (halfW(z) + 3); spin(x, H(x, z) + 0.6, z, 1, 3.2); }   // the ribs
    for (let x = -150; x < 150; x += 5.5) spin(x, H(x, ZL + 0.5) + 0.3, ZL + 0.5, 1, 2.8);            // the cliff lip
    const lump = (r, i) => {                                                                          // the slough: a low tumbling river, lumps in their own blue shade
      const dz = 30 * Math.pow(r(), 1.5), big = 1 - dz / 30, head = i % 9 === 0, w = 1.2 + 2.2 * Math.sqrt(big);
      wp.push({ o: [r.range(-w, w), 0.6 * dz + r.range(0, 0.3), dz * (head ? 0.12 : 1)], v: [r.range(-1, 1), head ? r.range(1.6, 3) : r.range(0.5, 1.6), r.range(-3.5, -0.5)],
        p: [r(), r.range(0.45, 0.95) * (head ? 1.6 : 1), (head ? r.range(1.2, 1.8) : r.range(0.6, 1.1)) * (0.7 + 0.5 * big), r()], k: i % 3 === 1 ? 5 : 1 });
    };
    // The outlier stream deals the first 150 lumps, then (further down) the mist in the well's throat. The river's other
    // lumps are dealt at the end of this block from a fork of their own, so they shift nothing, and take their place here.
    const nLumpsBase = Math.round(150 * detail), nLumps = Math.round(210 * detail);
    for (let i = 0; i < nLumpsBase; i++) lump(xr, i);
    const sloughAt = wp.length;
    for (let i = 0; i < 110; i++) {                                                                   // the well: a slow wheel of cloud that hides its rim
      // 30 small ones wheel round the throat, 80 large ones lie on the rim where the dish meets the sea
      const inner = i < 30, f = inner ? (i + 0.5) / 30 : (i - 29.5) / 80;
      const a = f * TAU * (inner ? 1 : 3) + pr.range(-0.15, 0.15), r = inner ? pr.range(40, 54) : 33 + 20 * Math.pow(f, 0.9), up = -3.5 + 7 * smoothstep(12, 40, r);
      wp.push({ o: [Math.cos(a) * r, pr.range(-2.5, 0.5) + up, Math.sin(a) * r], v: [0, 0, 0], p: [pr(), 1, (inner ? 5 : lerp(8, 14, (r - 25) / 25)) * pr.range(0.85, 1.25), pr()], k: 2 });
    }
    for (let i = 0; i < 20; i++) {                                                                    // the throat: mist lit by the next world
      const a = (i / 20) * TAU + xr.range(-0.12, 0.12), r = xr.range(9, 12.5);
      wp.push({ o: [Math.cos(a) * r, xr.range(-11, -6), Math.sin(a) * r], v: [0, 0, 0], p: [xr(), 1, xr.range(2.2, 3.4), xr()], k: 4 });
    }
    if (rare) {                                                                                       // powder avalanche on the horned peak
      const toUs = new THREE.Vector3(-horn.x, 0, -horn.z).normalize(), sideV = new THREE.Vector3(-toUs.z, 0, toUs.x);
      for (let i = 0; i < 80; i++) {
        const f = Math.pow(pr(), 0.8), run = 60 + f * horn.R * 0.62, lat = pr.range(-1, 1) * (40 + 190 * f);
        const dx = toUs.x * run + sideV.x * lat, dz = toUs.z * run + sideV.z * lat;
        wp.push({ o: [horn.x + dx, horn.heightAt(dx, dz) + 20, horn.z + dz], v: [toUs.x * 260 + sideV.x * pr.range(-90, 90), pr.range(20, 110) * (0.4 + f), toUs.z * 260 + sideV.z * pr.range(-90, 90)],
          p: [0.05 + 0.5 * f + pr.range(0, 0.05), 1.1, pr.range(70, 150) * (0.5 + 0.8 * f), pr()], k: 3 });
      }
    }
    {
      // Two groups dealt from forks of their own, each fork taken after the last draw of its parent stream, so that neither
      // shifts a draw of the puffs, lumps and mist above. Each then takes its place among the sprites (the later place
      // first, so the earlier mark still holds).
      const sm = xr.fork('slough-more'), n0 = wp.length;
      for (let i = nLumpsBase; i < nLumps; i++) lump(sm, i);                                          // the rest of the slough's lumps
      wp.splice(sloughAt, 0, ...wp.splice(n0));
      const rs = pr.fork('ridge-sheet'), n1 = wp.length;
      for (let z = 351; z < 416; z += 2.1) spin(rs.range(3, 7.5), profAt(z) + 0.4, z, 1, 3.6, rs);    // a sheet of spindrift smoking off the ridge beside us
      wp.splice(ridgeAt, 0, ...wp.splice(n1));
    }
    const worldPuffs = puffMesh(wp, puffMaterial(PU)); worldPuffs.name = 'powder-world'; scene.add(worldPuffs);
    await ctx.yield();

    // ---------------------------------------------------------------- wildlife
    const fl = { sunDir: SUN.clone(), sunColor: C(look.sunCol), sunIntensity: 1.5 * look.sunI + 0.3, sky: C(look.shade), skyIntensity: 1.1, ground: C('#cbd8ee'), groundIntensity: 0.6 + 0.3 * look.sunI };
    const fauna = F.makeFauna(scene, { light: fl, range: 4000 });
    await ctx.yield();
    const nCh = rng.int(7, 11), chough = { body: '#0b0c0f', belly: '#0b0c0f', wingC: '#101216', tip: '#08090b', head: '#0b0c0f', beak: '#f0be18' };
    // (the clear air round the line, 14 Oct: the choughs' ring dealt a bird 0.61 m from the flown line and the escort 0.79 m. Both hand the kit
    // their own clearing now. The escort's wander is steadied first, because the kit clears a member's whole roam and a wandering escort would
    // be thrown ten metres out of the frame; steadied, its choughs keep their place beside the eye.)
    fauna.add(F.makeFlock({ rng: rng.fork('ch1'), species: 'crows', count: nCh, size: 0.85, speed: 5.5, glide: 0.85, center: [5, profAt(366) + 8, 366], radius: 15, height: 4, ...chough, keepClear: { path, dist: 2, each: true } }));
    fauna.add(F.makeFlock({ rng: rng.fork('ch2'), species: 'crows', count: nCh, size: 0.85, glide: 0.8, spread: [9, 3, 14], wander: [0.9, 0.5, 0.9, 0.8], along: { path, side: sunLeft ? 8 : -8, up: 0.8, lead: 22, from: U_LIP - 0.04, to: 0.97, drift: 5 }, ...chough, keepClear: { path, dist: 2, each: true } }));
    fauna.add(F.makeFlock({ rng: rng.fork('eagle'), species: 'eagles', count: 1, size: 1.7, center: [xL + rng.range(-70, 70), cloudTop + 34, ZL - 120], soarRadius: 46, body: '#2a2118', wingC: '#33281c', head: '#b89a5a' }));
    const U_PT = lerp(U_FOREST, U_LIP, 0.56);
    fauna.add(F.makeFlock({ rng: rng.fork('ptarmigan'), species: 'gulls', count: 12, size: 0.48, speed: 17, flap: 8, glide: 0.05, spread: [5, 1.5, 7],
      body: '#f3f6fb', belly: '#ffffff', wingC: '#eef2f8', tip: '#f3f6fb', head: '#f3f6fb', tailC: '#14161b', beak: '#22242a',
      cross: { path, u: U_PT, lead: 20, angle: 16, side: rng.sign(), height: -0.2, span: 130, rise: 9, duration: DUR } }));

    await ctx.yield();
    // the hare: long bounds across the bowl, a dotted track left behind (other visits: nobody is home)
    const hasHare = rng.chance(0.75);
    const U_H0 = lerp(U_ROLL, U_FOREST, 0.3), U_H1 = lerp(U_ROLL, U_FOREST, 0.72);
    const hareG = new THREE.Group(); hareG.visible = false; scene.add(hareG);
    const hz0 = path.pointAt(lerp(U_H0, U_H1, 0.55)).z - 34, hs = rng.sign();
    const hareA = new THREE.Vector3(hs * 64, 0, hz0 + 16), hareB = new THREE.Vector3(-hs * 66, 0, hz0 - 22), HOPS = 46;
    let dots = null;
    if (hasHare) {
      const hp = [], wht = '#e9edf5';
      const bl = (r, sx, sy, sz, x, y, z, c) => { const g = new THREE.SphereGeometry(r, 9, 7); g.scale(sx, sy, sz); g.translate(x, y, z); hp.push(paint(g, c)); };
      bl(0.2, 1, 1, 1.7, 0, 0.26, 0, wht); bl(0.11, 1, 1, 1.25, 0, 0.42, 0.34, wht); bl(0.07, 1, 1, 1, 0, 0.3, -0.36, wht);
      for (const s of [-1, 1]) { bl(0.03, 1, 3.6, 1.2, s * 0.045, 0.6, 0.27, wht); bl(0.031, 1, 1.1, 1.2, s * 0.045, 0.71, 0.27, '#17181c'); bl(0.05, 1, 1, 3.2, s * 0.1, 0.08, -0.12, wht); }
      const hm = new THREE.Mesh(mergeGeometries(hp, false), litMaterial(hero.shareUniforms()));
      hm.scale.setScalar(1.7); hm.frustumCulled = false; hareG.add(hm);
      const dg = new THREE.CircleGeometry(0.16, 8); dg.rotateX(-Math.PI / 2);
      dots = new THREE.InstancedMesh(dg, new THREE.MeshBasicMaterial({ color: C(look.shade).multiplyScalar(0.55), fog: true }), HOPS * 2);
      const m4 = new THREE.Matrix4(), nrm = new THREE.Vector3(), qd = new THREE.Quaternion(), upY = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), pd = new THREE.Vector3();
      for (let i = 0; i < HOPS * 2; i++) {
        const k = (Math.floor(i / 2) + 0.5) / HOPS, x = lerp(hareA.x, hareB.x, k) + (i & 1 ? 0.12 : -0.12), z = lerp(hareA.z, hareB.z, k) + (i & 1 ? 0.25 : 0);
        nrm.set(H(x - 0.5, z) - H(x + 0.5, z), 1, H(x, z - 0.5) - H(x, z + 0.5)).normalize(); qd.setFromUnitVectors(upY, nrm);
        m4.compose(pd.set(x, H(x, z) + 0.05, z).addScaledVector(nrm, 0.04), qd, one); dots.setMatrixAt(i, m4);
      }
      dots.count = 0; dots.frustumCulled = false; scene.add(dots);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- our own gear: ski tips, mittens, poles (rides the camera)
    const rig = new THREE.Group(); rig.name = 'ski-rig'; rig.visible = false; scene.add(rig);
    const rigMat = litMaterial(hero.shareUniforms(), { shadow: true });
    rigMat.transparent = true;                                        // drawn after every powder sprite: tips, mittens and poles stay solid
    const skis = [], arms = [];
    {
      const seg = (a, b, r0, r1, col, n = 7) => {
        const d = new THREE.Vector3().subVectors(b, a), len = d.length(), g = new THREE.CylinderGeometry(r1, r0, len, n);
        g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
        g.translate((a.x + b.x) / 2, (a.y + b.y) / 2, (a.z + b.z) / 2); return paint(g, col);
      };
      const V = (x, y, z) => new THREE.Vector3(x, y, z);
      const charcoal = C('#465062'), red = C(PAL[6]).multiplyScalar(1.15), slate = C('#464f5e'), sleeve = C('#626b7a');
      const lift = (t) => t * t * 0.15;
      for (const s of [-1, 1]) {
        const parts = [];
        const ski = new THREE.BoxGeometry(0.128, 0.024, 2.0, 2, 1, 16), sp = ski.attributes.position;
        for (let i = 0; i < sp.count; i++) { const t = clamp((-sp.getZ(i) - 0.62) / 0.38, 0, 1); sp.setY(i, sp.getY(i) + lift(t)); sp.setX(i, sp.getX(i) * (1 - 0.6 * smoothstep(0.72, 1, t))); }
        ski.computeVertexNormals(); parts.push(paint(ski, charcoal));
        const band = new THREE.BoxGeometry(0.13, 0.012, 0.1); band.rotateX(0.42); band.translate(0, 0.014 + lift(0.6), -0.85); parts.push(paint(band, red));
        const rr = rng.fork('skisnow' + s);
        for (let i = 0; i < 4; i++) { const g = new THREE.SphereGeometry(rr.range(0.012, 0.018), 8, 5); g.scale(1.2, 0.3, rr.range(5, 9)); g.translate((i & 1 ? 1 : -1) * rr.range(0.03, 0.045), 0.013, rr.range(-0.5, 0.5)); parts.push(paint(g, '#8798b8')); }   // a dusting riding the topsheet, never a lump at the frame edge
        const m = new THREE.Mesh(mergeGeometries(parts, false), rigMat); m.frustumCulled = false; m.renderOrder = 7; rig.add(m); skis.push(m);

        const ap = [];
        const mit = new THREE.SphereGeometry(0.066, 14, 10); mit.scale(1, 0.85, 1.4); ap.push(paint(mit, slate));
        const th = new THREE.SphereGeometry(0.03, 9, 6); th.scale(1, 1, 1.6); th.translate(-s * 0.06, 0.012, -0.04); ap.push(paint(th, slate));
        ap.push(seg(V(0, -0.01, 0.055), V(s * 0.1, -0.2, 0.55), 0.066, 0.09, sleeve, 12));
        const tip = V(s * 0.08, -0.74, -1.02), dirP = tip.clone().normalize();
        ap.push(seg(dirP.clone().multiplyScalar(-0.1), dirP.clone().multiplyScalar(0.08), 0.022, 0.022, C('#15181d')));
        ap.push(seg(dirP.clone().multiplyScalar(0.08), tip, 0.016, 0.012, C('#c8d0dc'), 6));
        const bk = new THREE.CylinderGeometry(0.055, 0.055, 0.008, 9); bk.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirP)); bk.translate(tip.x * 0.93, tip.y * 0.93, tip.z * 0.93); ap.push(paint(bk, C('#15181d')));
        const am = new THREE.Mesh(mergeGeometries(ap, false), rigMat); am.frustumCulled = false; am.renderOrder = 7; rig.add(am); arms.push(am);
      }
    }
    await ctx.yield();
    // spray that belongs to us: bow wave at the tips, edge spray on turns, snow smoking off the skis in the air, face-shots
    const RU = puffUniforms(HU);
    setKind(RU, 0, [0, 2.2, 0.6, 0.3], [0, 0, 0.9, 1]);
    setKind(RU, 1, [0, 2.6, 0.7, 0.45], [0, 0, 0.9, 1]);
    setKind(RU, 2, [0, 2.6, 0.7, 0.45], [0, 0, 0.9, 1]);
    setKind(RU, 3, [0, -0.3, 0.6, 0.36], [0, 0, 0.8, 1]);
    setKind(RU, 4, [0, 0, 0.5, 0.95], [2, 0, 0.5, 0.6]);
    {
      const rp = [], r4 = rng.fork('rigpuffs');
      for (let i = 0; i < 40; i++) { const s = i & 1 ? 1 : -1; rp.push({ o: [s * 0.21 + r4.range(-0.12, 0.12), -0.98, r4.range(-2.9, -2.2)], v: [s * r4.range(0.6, 2.2), r4.range(0.4, 1.5), r4.range(3, 6)], p: [r4(), r4.range(0.3, 0.55), r4.range(0.1, 0.21), r4()], k: 0 }); }   // the bow wave breaks ahead of the tips and parts round them
      const edgeSpray = (r, i) => { const s = i & 1 ? 1 : -1; rp.push({ o: [s * 0.52, -0.98, r.range(-1.5, -0.7)], v: [s * r.range(2.5, 6.5), r.range(0.7, 2.4), r.range(3, 7)], p: [r(), r.range(0.3, 0.6), r.range(0.11, 0.3), r()], k: s < 0 ? 1 : 2 }); };   // edge spray: behind the red band, outboard
      for (let i = 0; i < 32; i++) edgeSpray(r4, i);                  // the first 32 from this stream; the other 24 are dealt last, from a fork of their own
      const edgeAt = rp.length;
      for (let i = 0; i < 26; i++) { const s = i & 1 ? 1 : -1; rp.push({ o: [s * 0.21 + r4.range(-0.05, 0.05), -0.9, r4.range(-2.4, -1.4)], v: [r4.range(-0.3, 0.3), r4.range(0.1, 0.5), r4.range(3, 6)], p: [r4(), r4.range(0.4, 0.8), r4.range(0.1, 0.22), r4()], k: 3 }); }
      for (let i = 0; i < 9; i++) rp.push({ o: [r4.range(-1.3, 1.3), r4.range(-1.7, -1.1), r4.range(-2.6, -1.5)], v: [r4.range(-0.5, 0.5), r4.range(2.4, 3.6), r4.range(0.6, 1.6)], p: [r4.range(0, 0.3), 0.7, r4.range(0.9, 1.5), r4()], k: 4 });
      // forked after this stream's last draw, so the 24 shift no draw of the smoke off the skis or of the face-shot sprites; then put with the rest of the spray
      { const em = r4.fork('edge-more'), n0 = rp.length; for (let i = 32; i < 56; i++) edgeSpray(em, i); rp.splice(edgeAt, 0, ...rp.splice(n0)); }
      const m = puffMesh(rp, puffMaterial(RU)); m.name = 'powder-rig'; m.renderOrder = 5; rig.add(m);
    }
    await ctx.yield();

    // ---------------------------------------------------------------- scripted beats, all keyed to u
    const bowlApexU = (n) => { const z = 340 - lamB * (0.25 + 0.5 * n); return path.nearestXZ(gx(z), z).u + 0.012; };
    const FACE = [bowlApexU(0), bowlApexU(2), lerp(U_FOREST, U_LIP, 0.7)], FACE_W = 0.5 / DUR;
    const U_SL0 = U_ROLL + 0.012, U_SL1 = lerp(U_ROLL, U_FOREST, 0.86);
    const U_BOMB = lerp(U_FOREST, U_LIP, 0.3);
    let bombGate = 0;
    { const pz = path.pointAt(U_BOMB + 18 / LEN).z; let best = 1e9; hero.anchors.gates.forEach((g, i) => { const dd = Math.abs(g.position.z - pz); if (dd < best) { best = dd; bombGate = i; } }); }
    const dLip = U_LIP * LEN, LEAD = 26;
    const offLip = hero.anchors.trackPoint(1).x - xL;
    const faceCol = C('#F8FBFF').multiplyScalar(0.3 + 0.7 * Math.min(1, look.sunI + 0.1));

    const tA = new THREE.Vector3(), tB = new THREE.Vector3(), pA = new THREE.Vector3(), pB = new THREE.Vector3(), qInv = new THREE.Quaternion();
    const tS = new THREE.Vector3(), camS = new THREE.Vector3(), tC = new THREE.Vector3(), tD = new THREE.Vector3();
    const hareDir = new THREE.Vector3().subVectors(hareB, hareA).normalize();
    let edgeS = 0;

    const update = (dt, t, camera, u) => {
      time.value = t;
      const d = u * LEN;
      // companion: 25 m ahead on the snow, then in the air, then gone through the well
      const dc = d + LEAD;
      if (dc < dLip - 0.4) { path.posAtDist(dc, pA); hero.setProgress(hero.progressAtZ(pA.z)); }
      else {
        hero.setProgress(1);
        path.posAtDist(Math.min(dc, LEN + 6), pA); path.tangentAtDist(Math.min(dc, LEN), tA);
        pA.x += offLip; pA.y -= 1.45;
        hero.setCompanionPose(pA, tA, dc < LEN - 1, smoothstep(dLip, dLip + 14, dc));
      }
      const tb = (u - U_BOMB) * DUR;
      hero.setBomb(bombGate, tb > 0 && tb < 2.6 ? tb : -1);
      hero.update(dt, t, camera);

      // face-shots: an eased veil of fog and a few big sprites, three in the whole run
      let face = 0, fdrive = -1;
      for (const fu of FACE) { const f = (u - fu) / FACE_W; if (f > 0 && f < 1) { fdrive = f; const sn = Math.sin(Math.PI * f); face = sn * sn; } }
      scene.fog.density = fogBase + 0.045 * face;
      scene.fog.color.copy(fogCol).lerp(faceCol, Math.min(1, face * 1.5));
      RU.uDrive.value[4] = fdrive;

      // the ski rig follows whichever camera is flying the path (hidden while we are only seen through a portal)
      const on = u > 1e-5;
      rig.visible = on;
      if (on) {
        camera.matrixWorld.decompose(rig.position, rig.quaternion, camS);    // the flying camera's world matrix, not its local fields
        path.tangentAtDist(d, tA); path.tangentAtDist(d + 10, tB);
        const air = smoothstep(U_LIP - 0.001, U_LIP + 0.004, u), run = smoothstep(U_ROLL - 0.03, U_ROLL + 0.035, u);
        const edge = clamp(-(tA.z * tB.x - tA.x * tB.z) * 2.2, -1, 1) * (1 - air);
        edgeS += (edge - edgeS) * Math.min(1, dt * 7);
        const chat = (1 - air) * run * 0.012;
        // pole plants: the arm on the inside of the turn that is coming swings forward and plants, the other trails
        path.tangentAtDist(d + 8, tC); path.tangentAtDist(d + 18, tD);
        const edgeN = clamp(-(tC.z * tD.x - tC.x * tD.z) * 2.2, -1, 1), swing = clamp((edgeN - edge) * 1.25, -1, 1) * (1 - air) * run;
        for (let i = 0; i < 2; i++) {
          const s = i ? 1 : -1, ski = skis[i], arm = arms[i];
          // in the air the skis part and sink a little, so the well shows between the tips
          ski.position.set(s * (0.21 + 0.27 * air) + edgeS * 0.05, -0.95 + chat * Math.sin(t * 23 + i * 2.1) + chat * 0.7 * Math.sin(t * 37 + i) - 0.06 * air, -1.5 - s * edgeS * 0.11);
          ski.rotation.set(0.015 * Math.sin(t * 5.3 + i * 1.7) * run - 0.05 * air + 0.02 * air * Math.sin(t * 0.9 + i * 2.6), -0.035 * s * air - edgeS * 0.03, -edgeS * 0.4 + 0.05 * s * air * Math.sin(t * 0.7 + i));
          const pole = (1 - run) * 0.42 * Math.sin(d * 0.52 + i * Math.PI);                    // poling along the ridge
          const plant = Math.max(s * swing, 0), trail = Math.max(-s * swing, 0);
          arm.position.set(s * (0.6 + 0.1 * air) + edgeS * 0.03 - s * 0.05 * plant, -0.5 + 0.02 * Math.sin(t * 2.3 + i * 1.3) - 0.05 * Math.abs(edgeS) + 0.03 * air + 0.05 * plant - 0.03 * trail, -0.82 + 0.05 * s * edgeS - 0.13 * plant + 0.06 * trail);
          arm.rotation.set(0.07 * run + pole + s * edgeS * 0.32 + 0.05 * Math.sin(t * 1.7 + i * 2.) + 0.5 * plant - 0.3 * trail + 0.16 * air + 0.07 * air * Math.sin(t * 0.8 + i * 2.2),
            s * 0.1 * plant, -s * 0.04 - edgeS * 0.16 - s * 0.38 * air + s * 0.12 * trail);
        }
        RU.uGate.value[0] = (1 - air) * (0.25 + 0.75 * run);
        RU.uGate.value[1] = Math.max(edgeS, 0) * run; RU.uGate.value[2] = Math.max(-edgeS, 0) * run;
        RU.uGate.value[3] = air * (1 - smoothstep(0.93, 0.99, u));
        RU.uSunP.value.copy(SUN).applyQuaternion(qInv.copy(rig.quaternion).invert());
      }

      // the slough: lets go beside us in the bowl, runs with us, then falls behind
      const sg = smoothstep(U_SL0, U_SL0 + 0.012, u) * (1 - smoothstep(U_SL1 - 0.04, U_SL1, u));
      PU.uGate.value[1] = sg; PU.uGate.value[5] = sg;
      if (sg > 0) {
        // 8 m off on the sun's side and a little ahead, so its powder head runs in frame beside the tips, lit from behind
        path.posAtDist(d + 24 - 54 * smoothstep(lerp(U_SL0, U_SL1, 0.55), U_SL1, u), pB); path.tangentAtDist(d, tS);
        const hl = Math.hypot(tS.x, tS.z) || 1, sl = sunLeft ? -10.5 : 10.5, sx = pB.x - tS.z / hl * sl, sz = pB.z + tS.x / hl * sl;
        PU.uAnchor.value[1].set(sx, H(sx, sz) + 0.2, sz); PU.uAnchor.value[5].copy(PU.uAnchor.value[1]);
      }
      PU.uDrive.value[3] = clamp((u - 0.7) / 0.27, 0, 1);
      // our shadow and the companion's, thrown down the light onto the cloud. They come in once we are off the cliff lip and
      // they go by the eye's height over the cloud, not by the distance flown: whole while it rides above the swells, fading
      // as the dive takes it down among them, gone before it is in the cloud round the well
      path.posAtDist(d, tB);
      skShU.uA.value = 0.6 * smoothstep(U_LIP + 0.005, U_LIP + 0.04, u) * smoothstep(SH_GONE, SH_WHOLE, tB.y - cloudTop);
      for (let i = 0; i < 2; i++) {
        const q = skSh[i]; if (i) tB.copy(hero.anchors.companion);
        const k = Math.max(tB.y - (cloudTop + 7), 0) / Math.max(SUN.y, 0.1);
        q.position.set(tB.x - SUN.x * k, cloudTop + 7, tB.z - SUN.z * k);
      }
      camera.getWorldPosition(PU.uCamP.value);

      // the hare
      if (hasHare) {
        const k = (u - U_H0) / (U_H1 - U_H0), vis = k > 0 && k < 1;
        hareG.visible = vis;
        if (vis) {
          const f = (k * HOPS) % 1, x = lerp(hareA.x, hareB.x, k), z = lerp(hareA.z, hareB.z, k);
          hareG.position.set(x, H(x, z) + 0.85 * 4 * f * (1 - f), z);
          hareG.rotation.set(0, Math.atan2(hareDir.x, hareDir.z), 0); hareG.children[0].rotation.x = (2 * f - 1) * 0.55;
        }
        dots.count = Math.max(0, Math.min(HOPS, Math.floor(clamp(k, 0, 1) * HOPS))) * 2;
      }

      sky.update(dt, t, camera); rig3.update(dt, t, camera); sea.update(dt, t, camera); swells.update(dt, t, camera);
      fauna.update(dt, t, camera, u); fxs.update(dt, t, camera);
    };

    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();
    const look1 = new THREE.Vector3();
    // the brief's speed table (5, 11, 25, 22, 25, 17, 22 m/s): slow along the ridge, flat out down the bowl, a last
    // schuss to the lip, then the float, where time stretches, and an unhurried dive
    const pace = (u) => {
      let p = lerp(0.35, 0.6, smoothstep(U_ROLL - 0.05, U_ROLL - 0.004, u));
      p = lerp(p, 1.25, smoothstep(U_ROLL, lerp(U_ROLL, U_FOREST, 0.55), u));
      p = lerp(p, 1.1, smoothstep(U_FOREST - 0.03, U_FOREST + 0.03, u));
      p = lerp(p, 1.25, smoothstep(U_LIP - 0.07, U_LIP - 0.012, u));
      p = lerp(p, 0.8, smoothstep(U_LIP + 0.015, U_LIP + 0.085, u));
      return lerp(p, 1.05, smoothstep(0.87, 0.925, u));
    };
    return {
      scene, path, duration: DUR, pace, title: look.title,
      ride: 'none', companion: 'none',
      camera: { fov: 68, near: 0.3, far: 9000, lookAhead: 24, sway: 0.5, bank: 1.15 },
      pois: [
        // keep the gaze down the fall line (and the horizon in frame) while the path pitches down the face
        { at: (tt, u) => { path.pointAt(u, look1); const z = Math.max(look1.z - 60, ZL - 40); return look1.set(gx(Math.max(z, ZL)), look1.y - 6, z); }, from: U_ROLL - 0.035, to: U_LIP + 0.03, weight: 0.5, fade: 0.1 },
        { at: END, from: U_LIP - 0.01, to: 0.94, weight: 0.3 },
        ...(rare ? [{ at: [horn.x, cloudTop + 260, horn.z], from: 0.73, to: 0.92, weight: 0.3 }] : []),
      ],
      portal: { shape: 'circle', radius: 7, color: look.portal, glow: 1, tilt: true, revealDistance: 420 },
      post: { exposure: look.exposure, bloom: { strength: 0.42, radius: 0.6, threshold: 0.9 },
        grade: { saturation: hourKey === 'night' ? 0.94 : 1.1, contrast: 1.1, vignette: 0.28, grain: 0.015 } },
      update,
      dispose() { hero.dispose(); sky.dispose(); },
    };
  },
};
