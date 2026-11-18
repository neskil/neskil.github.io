// CRANE HARBOUR: "The Morning Lift". A giant container port at steel-blue dawn. The camera starts in a canyon of
// stacked boxes, is hoisted by a ship-to-shore crane, rides its trolley out over a 400 m ship, slides off the boom
// end into a wide orbit that shows the working herd whole, runs down the ship's flank and round her bow, climbs past
// the six idle cranes as they raise their booms in a wave, and dives between two of them into the nave.
// The exit ring stands under crane 11 with crane 12 and the sun behind it; pace() lingers on the hoist, the trolley and the crest.
// An open plaza lies behind the entry so the camera that shows this world through the previous portal never stands inside a stack.
// World coordinates are the brief's: +X east along the quay (toward the sun), +Z water, quay edge z = 0, quay top y = 0.
// Every sun look has a banked sky (lit cumulus over the gradient) and a fan of soft rays round the low sun that the crane frames cut into beams;
// the ship's shell plating has its own light (hero opts.hull). The arriving ship keeps a lane to seaward of the sun's bearing (ARZ).
// Looks by seed / ctx.vary.hour: dawn (default), predawn (floods on, rain), dusk (floods come on), fog (a pale morning: thin low
// banks of sea fog lie far out and toward the sun, gold where it lights them, open steel-blue water under ship and cranes). Rare event: the ship casts off, the working booms rise in salute, the whistle blows.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as Water from '../kit/water.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, Geo, makeBoxMaterial, lcg } from '../parts/crane-harbour.js';   // lcg: private streams for late additions

const TAU = Math.PI * 2, SHIPDECK = 19.2, ARZ = 205;   // ARZ: the arriving ship's lane, clear to seaward of the sun's bearing from the flank run
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
const PALETTE = ['#1B2740', '#3F5873', '#8C9FB2', '#14181F', '#FF9A2E', '#FFE2A8', '#C8321E'];

// yard grid: blocks 19.5 m wide (8 rows) on a 34 m pitch, the camera aisle is centred on x = 450
const YARD = { x0: 467, pitch: 34, k0: -10, k1: 17, zTop: -80, bays: 24, bayPitch: 12.5, mastZ0: -136.25, mastPitch: 100 };
const QUAY = { x0: -700, x1: 1120, zS: -1500 };

// ---------- looks ----------
const LOOKS = {
  dawn: {
    title: 'The Morning Lift',
    sky: { preset: 'dawn', zenith: '#1B2740', mid: '#3F5873', horizon: '#8C9FB2', ground: '#27313f', horizonPow: 2.4, midPow: 1.2,
      scatterColor: '#FF9A2E', scatter: 1.0, scatterPow: 7, scatterHigh: 0.04, scatterFall: 8, sunColor: '#FFE2A8', sunSize: 0.8, sunIntensity: 13,
      sunGlow: 1.0, sunGlowTight: 0.55, stars: 0.02, clouds: { coverage: 0.43, softness: 0.3, scale: 1.2, opacity: 0.9, detail: 0.6, silver: 1.6, absorb: 1.6, haze: 0.3, lit: '#ffb884', shade: '#34446a', wind: [0.016, 0.005] }, cloudLightColor: '#ff9a4e', clouds2: false,
      lightColor: '#ffb062', lightIntensity: 2.7, ambientColor: '#52709a', groundLight: '#2a3340', ambientIntensity: 1.25, lightElevationMin: 5 },
    sunEl: [2, 5], fog: '#6F8296', density: 0.0011, flood: 2.3, floodMode: 'off', shadow: 1, glint: 1, wet: 1, haze: 0.2, exposure: 1.08,
    amb: '#33475f', hero: 0.3, floodBox: 1.25, deck: 0.3, cone: 0.02, streak: 0.3, lampK: 0.45, head: 0.5, poi: [850, 104, 44], particles: 'dust', grade: { tint: '#f4f7fb', shadowTint: '#06101f', saturation: 1.05 }, portal: '#ffc27a', seaDeep: '#22364a',
    craneFlood: 0.5, mute: 0, boomLamps: 0.7,
  },
  predawn: {
    title: 'The Night Shift',
    sky: { preset: 'blueHour', zenith: '#0a1226', mid: '#172644', horizon: '#3a5078', ground: '#0d131d', horizonPow: 3.2, midPow: 1.4,
      scatterColor: '#b8702e', scatter: 0.3, scatterPow: 9, scatterHigh: 0.01, scatterFall: 13, sunIntensity: 0, sunGlow: 0.2, stars: 0.03, bodies: [],
      clouds: { coverage: 0.74, softness: 0.72, scale: 1.3, opacity: 0.8, silver: 0.2, lit: '#4a4248', shade: '#111a2c', haze: 0.6, detail: 0.4 }, clouds2: false,
      lightColor: '#7f9ccc', lightIntensity: 0.42, ambientColor: '#3a4d72', groundLight: '#3a2a1c', ambientIntensity: 0.5, lightElevationMin: 30, key: 'sun' },
    sunEl: [-5, -3], fog: '#1a2538', density: 0.0015, hullSky: 1.5, hullSea: 1.0, flood: 3.7, floodMode: 'on', shadow: 0, glint: 0.85, wet: 1.15, haze: 0.05, exposure: 1.18,
    amb: '#2c3e5e', hero: 0.27, hullGlow: 0.22, floodBox: 2.0, deck: 1.1, cone: 0.12, streak: 1.0, lampK: 1.0, head: 0.45, poi: [770, 72, 8], particles: 'rain', grade: { tint: '#f1f5ff', shadowTint: '#040a16', saturation: 0.96 }, portal: '#ffb060', seaDeep: '#2a3d5c', seaAmb: '#a9bcd8', seaSky: { horizon: '#526a94', mid: '#2a4068', zenith: '#182646' },
    craneFlood: 2.6, mute: 0.55, boomLamps: 2.0,
  },
  dusk: {
    title: 'The Evening Lift',
    sky: { preset: 'blueHour', zenith: '#101a36', mid: '#2a4170', horizon: '#7183a8', ground: '#182030', horizonPow: 4, midPow: 1.3,
      scatterColor: '#f0a04a', scatter: 0.4, scatterPow: 9, scatterHigh: 0.008, scatterFall: 9, sunIntensity: 0, sunGlow: 0.4, stars: 0.1, bodies: [],
      clouds: { coverage: 0.42, softness: 0.3, scale: 1.2, opacity: 0.88, detail: 0.6, silver: 1.3, absorb: 1.6, haze: 0.3, lit: '#d98a66', shade: '#26345a', wind: [0.016, 0.005] }, cloudLightColor: '#ff8a4e', clouds2: false,
      lightColor: '#ff9a66', lightIntensity: 0.8, ambientColor: '#4a6298', groundLight: '#2c2a30', ambientIntensity: 0.9, lightElevationMin: 8, key: 'sun' },
    sunEl: [-1, -3], fog: '#42567c', density: 0.00115, hullSky: 0.8, hullSea: 0.8, flood: 3.0, floodMode: 'wave-on', shadow: 0, glint: 0.25, wet: 1, haze: 0.1, exposure: 1.2,
    amb: '#34486e', hero: 0.3, hullGlow: 0.2, floodBox: 1.7, deck: 0.8, cone: 0.05, streak: 0.8, lampK: 0.9, head: 1.2, poi: [780, 76, 10], particles: 'dust', grade: { tint: '#f3f6ff', shadowTint: '#070c1e', saturation: 1.0 }, portal: '#ffa868', seaDeep: '#243a5c', seaAmb: '#7d94bd', seaSky: { horizon: '#8496b6', mid: '#3a5384', zenith: '#1a284a' },
    craneFlood: 2.0, mute: 0.55, boomLamps: 1.8,
  },
  fog: {
    title: 'Lift Out of the Fog',
    sky: { preset: 'goldenHour', zenith: '#24508a', mid: '#6f95c2', horizon: '#f0c592', ground: '#8f9aa4', horizonPow: 3.4, midPow: 1.3,
      scatterColor: '#ff9a3c', scatter: 0.95, scatterPow: 5, scatterHigh: 0.07, scatterFall: 5, sunColor: '#ffdca8', sunSize: 0.9, sunIntensity: 13, sunGlow: 0.6, sunGlowTight: 0.6, stars: 0, bodies: [],
      clouds: { coverage: 0.46, softness: 0.3, scale: 1.15, opacity: 0.92, detail: 0.6, silver: 1.5, absorb: 1.5, haze: 0.3, lit: '#ffdcae', shade: '#566c94', wind: [0.016, 0.005] },
      clouds2: false, cloudLightColor: '#ffb870',
      lightColor: '#ffd29a', lightIntensity: 2.1, ambientColor: '#8fa6c4', groundLight: '#7c858e', ambientIntensity: 1.0, lightElevationMin: 9 },
    sunEl: [5, 8], fog: '#a9b2c0', density: 0.0007, hullSky: 0.3, hullSun: 2.4, hullSea: 1.0, fogLow: 0.0021, fogTop: 22, bankTop: 9, flood: 1.6, floodMode: 'on', shadow: 0.35, glint: 0.5, wet: 1, haze: 0.12,
    exposure: 0.98, amb: '#65758a', hero: 0.36, floodBox: 1, deck: 0.4, cone: 0.07, streak: 0.6, lampK: 0.9, head: 0.5, poi: [770, 62, 10], particles: 'mist', grade: { tint: '#f7f9fb', shadowTint: '#0c1620', saturation: 0.98 }, portal: '#ffd9a0', seaDeep: '#2c4358', seaSky: { horizon: '#aebdca', mid: '#7090ae', zenith: '#4a6a8c' },
    craneFlood: 0.6, mute: 0.1, boomLamps: 0.9,
  },
};

// ---------- additive lamp sprites: HDR, blink, switch-off wave along x ----------
function makeLampSet(cap, front) {
  const pos = new Float32Array(cap * 3), col = new Float32Array(cap * 3), par = new Float32Array(cap * 4);
  let n = 0;
  const quad = new THREE.PlaneGeometry(1, 1), g = new THREE.InstancedBufferGeometry();
  g.index = quad.index; g.setAttribute('position', quad.getAttribute('position'));
  const aPos = new THREE.InstancedBufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const aCol = new THREE.InstancedBufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iPos', aPos); g.setAttribute('iCol', aCol); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(par, 4));
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uFront: { value: new THREE.Vector2() }, uGain: { value: 1 } }]),
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec3 iCol; attribute vec4 iPar;   // size, blink rate (0 steady), phase, 1 = obeys the flood wave
      uniform float uTime, uGain; uniform vec2 uFront; varying vec2 vUv; varying vec3 vCol;
      #include <fog_pars_vertex>
      void main(){
        vec4 mvPosition = modelViewMatrix * vec4(iPos, 1.0);
        float size = max(iPar.x, -mvPosition.z * 0.0045);
        float k = mix(1.0, min(1.0, iPar.x / size), 0.55);
        float bl = 1.0;
        if (iPar.y > 0.0) { float s = sin(uTime * iPar.y + iPar.z); bl = 0.06 + 0.94 * smoothstep(0.35, 0.95, s); }
        if (iPar.w > 0.5) bl *= clamp((iPos.x - uFront.x) * uFront.y / 40.0, 0.0, 1.0);
        vCol = iCol * bl * k * uGain; vUv = position.xy * 2.0;
        mvPosition.xy += position.xy * size;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying vec3 vCol;
      #include <fog_pars_fragment>
      void main(){
        float r2 = dot(vUv, vUv);
        float a = exp(-r2 * 26.0) + 0.28 * exp(-r2 * 4.5) * (1.0 - smoothstep(0.6, 1.0, r2));
        vec3 c = vCol * a;
        #ifdef USE_FOG
          float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          c *= 1.0 - 0.75 * ff;
        #endif
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  mat.uniforms.uFront.value = front;
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5;
  return {
    mesh, mat, pos, col,
    add(x, y, z, c, k, size, rate = 0, phase = 0, wave = 0) {
      if (n >= cap) return n - 1;
      pos.set([x, y, z], n * 3); col.set([c.r * k, c.g * k, c.b * k], n * 3); par.set([size, rate, phase, wave], n * 4);
      return n++;
    },
    move(i, x, y, z) { const o = i * 3; pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; },
    finish() { g.instanceCount = n; aPos.needsUpdate = true; aCol.needsUpdate = true; },
    touch() { aPos.needsUpdate = true; },
    setColor(i, c, k) { const o = i * 3; col[o] = c.r * k; col[o + 1] = c.g * k; col[o + 2] = c.b * k; aCol.needsUpdate = true; },
  };
}

// ---------- wet asphalt: sky mirror, puddles, paint, analytic crane shadows, flood pools ----------
const GLSL_N = /* glsl */`
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
  float fb(vec2 p){ return 0.55*vn(p) + 0.3*vn(p*2.13+3.7) + 0.15*vn(p*4.31+9.1); }
`;
function makeGroundMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: /* glsl */`
      varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uZen, uHor, uScat, uAmb, uFlood; uniform vec2 uFront; uniform vec4 uGrid, uHead;
      uniform float uTime, uTanE, uShadow, uWet, uGlint, uRain, uLampK; uniform float uCr[12]; uniform vec2 uXM[4];
      varying vec3 vW;
      #include <fog_pars_fragment>
      ${GLSL_N}
      vec3 skyCol(vec3 r){
        float y = max(r.y, 0.0); vec3 c = mix(uHor, uZen, pow(y, 0.45));
        float s = max(dot(normalize(vec2(r.x, r.z) + 1e-5), normalize(uSunDir.xz)), 0.0);
        return c + uScat * pow(s, 9.0) * exp(-y * 7.0);
      }
      void main(){
        vec2 p = vW.xz; vec3 V = cameraPosition - vW; float dist = length(V); V /= dist;
        float n1 = fb(p * 0.07), n2 = fb(p * 0.6 + 7.0);
        float fw = fwidth(p.x) + fwidth(p.y);
        float apron = step(-80.0, p.y), yard = step(p.y, -80.0) * step(-381.0, p.y);
        vec3 alb = mix(vec3(0.04, 0.046, 0.056), vec3(0.075, 0.082, 0.094), n2);
        alb *= 1.0 + 0.45 * apron;
        // joints in the apron slabs
        float jt = min(abs(fract(p.x / 19.0 + 0.5) - 0.5) * 19.0, abs(fract(p.y / 16.0 + 0.5) - 0.5) * 16.0);
        alb *= 1.0 - 0.35 * apron * (1.0 - smoothstep(0.05, 0.12 + fw, jt));
        // paint: apron lanes, quay edge, block outlines, aisle centre dashes
        float lz = abs(fract((p.y + 42.0) / 5.0 + 0.5) - 0.5) * 5.0;
        float paint = (1.0 - smoothstep(0.1, 0.1 + fw, lz)) * step(fract(p.x / 24.0), 0.62) * step(-78.0, p.y) * step(p.y, -41.0);
        float bx = abs(fract((p.x - uGrid.x) / uGrid.y + 0.5) - 0.5) * uGrid.y;
        paint = max(paint, ((1.0 - smoothstep(0.12, 0.12 + fw, abs(bx - 10.5))) + (1.0 - smoothstep(0.09, 0.09 + fw, abs(bx - 17.0))) * step(fract(p.y / 8.0), 0.5)) * yard);
        paint = max(paint, 1.0 - smoothstep(0.2, 0.2 + fw, abs(p.y + 3.4)));
        paint *= (0.5 + 0.5 * n2) * (1.0 - smoothstep(120.0, 380.0, dist));
        // the nave between the crane rails: lane edges, centre dashes, hatched keep-clear boxes under each crane
        float fade = 1.0 - smoothstep(140.0, 420.0, dist), nave = step(-34.0, p.y) * step(p.y, -6.0);
        float nl = (1.0 - smoothstep(0.11, 0.11 + fw, abs(abs(p.y + 20.0) - 9.2))) + (1.0 - smoothstep(0.1, 0.1 + fw, abs(p.y + 20.0))) * step(fract(p.x / 14.0), 0.45);
        paint = max(paint, nl * nave * (0.55 + 0.45 * n2) * fade);
        alb = mix(alb, vec3(0.42, 0.29, 0.05), paint * 0.75);
        // crane tracks: a paler concrete beam with joints, a dark steel-lined slot down its middle
        float rs = min(abs(p.y + 5.0), abs(p.y + 35.0));
        float band = (1.0 - smoothstep(1.55, 1.65 + fw, rs)) * fade;
        alb = mix(alb, vec3(0.105, 0.108, 0.112) * (0.75 + 0.5 * n2), band * 0.8);
        alb *= 1.0 - 0.4 * band * (1.0 - smoothstep(0.04, 0.1 + fw, abs(fract(p.x / 6.0 + 0.5) - 0.5) * 6.0));
        alb = mix(alb, vec3(0.018, 0.02, 0.024), (1.0 - smoothstep(0.42, 0.5 + fw, rs)) * fade);
        float rail = 1.0 - smoothstep(3.0, 4.2, abs(p.y + 420.0));
        alb = mix(alb, vec3(0.05, 0.043, 0.038), rail);
        float grass = smoothstep(-430.0, -446.0, p.y) * smoothstep(0.3, 0.55, fb(p * 0.03 + 3.0));
        alb = mix(alb, vec3(0.10, 0.105, 0.058) * (0.7 + 0.6 * n2), grass * 0.85);
        float pud = smoothstep(0.5, 0.64, n1 + 0.22 * fb(p * 0.19 + 11.0));
        // the aisles between the stacks: long pools in the wheel ruts, a dark wet band at the container feet, tyre tracks
        float ax = abs(bx - 17.0), feet = yard * smoothstep(5.5, 6.9, ax);
        float rut = (1.0 - smoothstep(0.45, 1.0, abs(ax - 4.7))) * yard;
        pud = max(pud, yard * smoothstep(0.47, 0.6, fb(vec2(p.x * 0.33, p.y * 0.075) + 23.0) * (0.72 + 0.5 * rut) + 0.2 * feet));
        pud *= (1.0 - grass) * (1.0 - rail);
        alb *= 1.0 - yard * (0.38 * feet + 0.2 * rut * (0.5 + 0.5 * vn(vec2(p.x * 3.0, p.y * 0.4))));
        float wet = mix(0.34, 1.0, pud) * uWet * (1.0 - 0.7 * grass) * (1.0 - 0.45 * band);
        vec2 rp = p * 1.7 + uTime * vec2(0.35, 0.22), rq = p * 5.5 - uTime * vec2(0.6, 0.9);
        float rip = 0.045 + 0.1 * uRain;
        vec2 nn = (vec2(vn(rp), vn(rp + 17.0)) - 0.5) * rip * pud + (vec2(vn(rq), vn(rq + 9.0)) - 0.5) * rip * 0.6 * pud * (0.3 + uRain)
          + (vec2(vn(p * 9.0), vn(p * 9.0 + 5.0)) - 0.5) * 0.13 * (1.0 - pud);
        vec3 N = normalize(vec3(nn.x, 1.0, nn.y));
        // shadows of the crane line (the sun is on the quay axis): leg bands on the rails, bars from portal beams and upper works
        float sh = 0.0;
        if (uShadow > 0.0) {
          sh = yard * 0.92;
          float zb = max(1.0 - smoothstep(1.3, 2.8, abs(p.y + 5.0)), 1.0 - smoothstep(1.3, 2.8, abs(p.y + 35.0)));
          float zN = smoothstep(-37.0, -35.0, p.y) * (1.0 - smoothstep(-5.0, -3.0, p.y));
          float zG = smoothstep(-63.0, -59.0, p.y) * (1.0 - smoothstep(-3.0, -1.0, p.y));
          for (int i = 0; i < 12; i++) {
            float cx = uCr[i];
            sh = max(sh, zb * step(p.x, cx + 14.5) * smoothstep(cx - 58.0 / uTanE - 60.0, cx - 58.0 / uTanE, p.x));
            for (int s = 0; s < 2; s++) {
              float bxs = cx + (s == 0 ? -13.5 : 13.5), x0 = bxs - 1.0 - 24.2 / uTanE, x1 = bxs + 1.0 - 23.4 / uTanE;
              sh = max(sh, zN * smoothstep(x0 - 3.0, x0 + 3.0, p.x) * (1.0 - smoothstep(x1 - 3.0, x1 + 3.0, p.x)) * 0.9);
            }
            float u0 = cx - 9.0 - 58.0 / uTanE, u1 = cx + 9.0 - 55.6 / uTanE;
            sh = max(sh, zG * smoothstep(u0 - 8.0, u0 + 8.0, p.x) * (1.0 - smoothstep(u1 - 8.0, u1 + 8.0, p.x)) * 0.8);
          }
          sh *= uShadow;
        }
        vec3 col = alb * (uAmb * (1.0 - 0.3 * sh) + uSunCol * (0.05 + 0.5 * max(uSunDir.y, 0.0)) * (1.0 - sh));
        // flood pools
        float on = clamp((p.x - uFront.x) * uFront.y / 40.0, 0.0, 1.0);
        vec2 q = vec2((fract((p.x - uGrid.x) / uGrid.y + 0.5) - 0.5) * uGrid.y, (fract((p.y - uGrid.z) / uGrid.w + 0.5) - 0.5) * uGrid.w);
        float fl = on * (0.14 + 0.86 / (1.0 + dot(q, q) / 420.0)) * smoothstep(-52.0, -84.0, p.y) * smoothstep(-470.0, -400.0, p.y);
        col += alb * uFlood * fl * 0.9 * (1.0 - 0.38 * yard);
        // the straddle carrier's work lights: a pool that travels down the aisle with it
        vec2 hq = (p - uHead.xy) / vec2(9.0, uHead.z);
        float hp = uHead.w / (1.0 + dot(hq, hq) * dot(hq, hq));
        col += alb * vec3(1.0, 0.6, 0.26) * hp * 3.0 * (1.0 - 0.3 * yard);
        // mirror of the sky, dimmer down in the canyons, and the sun's glitter
        vec3 R = reflect(-V, N); R.y = abs(R.y);
        float fres = 0.035 + 0.965 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
        vec3 sky = skyCol(R) * mix(1.0, mix(0.7, 1.25, pud), yard) * (1.0 - mix(0.4, 0.7, apron) * sh);
        // the four apron masts: an amber pool each and its mirror in the wet
        { float xm = 0.0, xs = 0.0, pwm = mix(40.0, 300.0, pud);
          for (int i = 0; i < 4; i++) {
            float onm = clamp((uXM[i].x - uFront.x) * uFront.y / 40.0, 0.0, 1.0);
            vec3 Lm = vec3(uXM[i].x, 39.0, uXM[i].y) - vW; float dm2 = dot(Lm.xz, Lm.xz), d3 = dot(Lm, Lm);
            xm += onm / (1.0 + dm2 / 520.0);
            xs += onm * pow(max(dot(R, Lm * inversesqrt(d3)), 0.0), pwm) / (1.0 + d3 / 9000.0);
          }
          col += alb * uFlood * xm * 0.85 * (1.0 - 0.3 * yard) + vec3(1.0, 0.34, 0.03) * xs * wet * mix(0.5, 1.6, pud) * uLampK * 2.0; }
        col = mix(col, sky, clamp(fres * wet, 0.0, 1.0));
        col += (uFlood * fl * (0.03 + fres) * wet * 0.16 + vec3(1.0, 0.6, 0.26) * hp * (0.02 + fres) * wet * 0.5) * (1.0 - 0.72 * pud * yard);
        // the straddle carrier's lamps mirrored in the wet: a streak that runs down the aisle toward the eye
        { vec3 Lh = vec3(uHead.x, 13.5, uHead.y + 16.0) - vW; float dh = dot(Lh, Lh);
          col += vec3(1.0, 0.62, 0.3) * pow(max(dot(R, Lh * inversesqrt(max(dh, 1e-3))), 0.0), mix(60.0, 520.0, pud)) * wet * mix(0.5, 2.2, pud) * min(uHead.w, 1.0) * 5.0 / (1.0 + dh / 6000.0) * yard; }
        float sd = max(dot(R, uSunDir), 0.0);
        float spec = pow(sd, mix(90.0, 1200.0, pud)) * mix(0.5, 1.5, pud) + pow(sd, 12.0) * 0.05;
        col += uSunCol * spec * wet * (1.0 - sh) * uGlint;
        // the crane floods mirrored in the wet: long amber streaks that run toward the eye, sharp in the puddles
        if (uLampK > 0.0 && p.y > -70.0) {
          float ls = 0.0, pw = mix(55.0, 420.0, pud);
          for (int i = 0; i < 12; i++) {
            for (int s = 0; s < 4; s++) {
              vec3 Lp = vec3(uCr[i] + (s < 2 ? -12.2 : 12.2), 21.75, (s == 0 || s == 2) ? -12.0 : -28.0) - vW;
              float d2 = dot(Lp, Lp);
              ls += pow(max(dot(R, Lp * inversesqrt(d2)), 0.0), pw) / (1.0 + d2 / 5200.0);
            }
          }
          col += vec3(1.0, 0.34, 0.03) * ls * wet * mix(0.5, 1.6, pud) * uLampK * 2.6;
        }
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- small animated cloth (flags, windsock) ----------
function makeClothMaterial(time, color, color2) {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uA: { value: new THREE.Color(color) }, uB: { value: new THREE.Color(color2) }, uLight: { value: new THREE.Color(1, 1, 1) } },
    vertexShader: /* glsl */`
      uniform float uTime; varying vec2 vUv; varying float vSh;
      #include <fog_pars_vertex>
      void main(){
        vUv = uv; vec3 p = position; float a = uv.x;
        float w = sin(a * 7.0 - uTime * 6.0 + position.y) * 0.5 + sin(a * 3.1 - uTime * 3.7) * 0.5;
        p.z += w * a * 0.55; p.y -= a * a * 0.5 + w * a * 0.12; vSh = 0.75 + 0.25 * cos(a * 7.0 - uTime * 6.0);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uA, uB, uLight; varying vec2 vUv; varying float vSh;
      #include <fog_pars_fragment>
      void main(){
        vec3 c = mix(uA, uB, step(0.5, fract(vUv.y * 1.5 + 0.25)));
        gl_FragColor = vec4(c * uLight * vSh, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---------- wakes and prop wash: one ribbon quad per boat, foam drawn in the shader ----------
function makeWakeMaterial(time, fogColor) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uCol: { value: new THREE.Color('#c9d6df') } },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying vec3 vW;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vec4 lp = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          lp = instanceMatrix * lp;
        #endif
        vec4 w = modelMatrix * lp; vW = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uCol; varying vec2 vUv; varying vec3 vW;
      #include <fog_pars_fragment>
      ${GLSL_N}
      void main(){
        float along = vUv.x, across = abs(vUv.y - 0.5) * 2.0;              // along: 0 at the stern, 1 at the tail
        float spread = 0.12 + 0.88 * along;
        float n = fb(vW.xz * 0.35 + vec2(uTime * 0.25, 0.0)) * 0.6 + fb(vW.xz * 1.3 - uTime * 0.4) * 0.4;
        float core = (1.0 - smoothstep(0.0, spread * 0.55, across)) * (1.0 - along) * (1.0 - along);
        float arms = (1.0 - smoothstep(0.03, 0.14, abs(across - spread * 0.9))) * (1.0 - along);
        float a = clamp(core * 1.5 + arms * 0.8, 0.0, 1.0) * smoothstep(0.25, 0.7, n + core * 0.5) * smoothstep(0.0, 0.03, along);
        gl_FragColor = vec4(uCol, a * 0.85);
        #include <fog_fragment>
      }`,
  });
}

// ---------- mirrors on the water: the hull, the crane legs, the quay wall. One quad per thing, laid on the surface from its
// foot outward (uv.y 0 at the foot), its colour broken into bars by the ripples, more broken the further out ----------
function makeMirrorMaterial(time) {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, vertexColors: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time },
    vertexShader: /* glsl */`
      attribute float aA; varying vec2 vUv; varying vec3 vW, vC; varying float vA;
      #include <fog_pars_vertex>
      void main(){ vUv = uv; vC = color; vA = aA; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec2 vUv; varying vec3 vW, vC; varying float vA;
      #include <fog_pars_fragment>
      ${GLSL_N}
      void main(){
        float n = 0.6 * vn(vec2(vW.x * 0.11 + uTime * 0.2, vW.z * 0.9 - uTime * 0.7)) + 0.4 * vn(vec2(vW.x * 0.37 - uTime * 0.3, vW.z * 2.3 + uTime * 1.1));
        float far = clamp(vUv.y, 0.0, 1.0), ends;
        float wob = (vn(vec2(vW.z * 0.31 + uTime * 0.5, vW.x * 0.05)) - 0.5) * 0.45 * (0.25 + far);     // the edges wander with the ripples
        ends = smoothstep(0.0, 0.2, vUv.x + wob) * (1.0 - smoothstep(0.8, 1.0, vUv.x + wob));
        float brk = smoothstep(0.26 + 0.42 * far, 0.56 + 0.4 * far, n + 0.3 * (1.0 - far));
        vec3 Vd = normalize(cameraPosition - vW);
        float a = vA * (1.0 - far) * (1.0 - 0.45 * far) * brk * ends * mix(1.0, 0.12, smoothstep(0.22, 0.6, Vd.y));
        gl_FragColor = vec4(vC, a);
        #include <fog_fragment>
      }`,
  });
}

// ---------- vehicles and props (flat-shaded vertex-coloured soup from the hero's Geo builder) ----------
// straddle carrier: origin on the ground, travels along z, 15 m tall, carries a box 9 m up
function buildStraddle(rng, C) {
  const G = new Geo(rng), X = 4.7, body = C.yellow, dark = C.dark;
  for (const sx of [-1, 1]) {
    G.beam([sx * X, 1.7, -5.6], [sx * X, 1.7, 5.6], 1.0, 1.1, body, { ch: 0.2, grime: 0.25 });
    for (const z of [-4.3, -1.5, 1.5, 4.3]) G.cyl([sx * X - 0.45, 0.85, z], [sx * X + 0.45, 0.85, z], 0.85, 0.85, 10, dark, { k: 0.75 });
    for (const z of [-3.3, 3.3]) G.beam([sx * X, 2.2, z], [sx * X, 14.2, z], 0.75, 0.85, body, { ch: 0.15, caps: false, grime: 0.15 });
    G.beam([sx * X, 14.4, -4.6], [sx * X, 14.4, 4.6], 0.9, 1.0, body, { ch: 0.2 });
    G.beam([sx * X, 3.0, -3.3], [sx * X, 8.0, 3.3], 0.3, 0.3, body, { ch: 0.2, caps: false, k: 0.85 });
    G.box(sx * (X + 0.2), 3.2, 0, 0.9, 1.4, 2.6, C.grey, { k: 0.8 });
  }
  for (const z of [-3.3, 3.3]) G.beam([-X, 14.4, z], [X, 14.4, z], 0.8, 0.9, body, { ch: 0.2 });
  G.box(2.6, 13.2, 5.4, 2.4, 2.2, 2.0, C.white, { ch: 0.08 });                      // cab hung under the front
  G.box(2.6, 13.3, 6.42, 2.0, 1.0, 0.06, dark, { k: 0.7 });
  G.box(0, 12.1, 0, 2.7, 0.45, 12.4, body, { ch: 0.1, k: 0.85 });                   // spreader over the carried box
  for (const sx of [-1, 1]) for (const z of [-3.3, 3.3]) G.beam([sx * 1.1, 12.3, z], [sx * 2.2, 14.2, z], 0.12, 0.12, dark, { ch: 0, caps: false });
  return G.build();
}
// rail-mounted yard gantry: origin on the ground at the block centre, spans x
function buildRMG(rng, C) {
  const G = new Geo(rng), X = 11.6, col = C.gantry, dark = C.dark;
  for (const sx of [-1, 1]) {
    G.beam([sx * X, 1.3, -8], [sx * X, 1.3, 8], 1.1, 1.3, col, { ch: 0.2, grime: 0.25 });
    for (const z of [-6, 6]) { G.beam([sx * X, 1.9, z], [sx * X, 23.2, z * 0.55], 1.0, 1.2, col, { ch: 0.12, caps: false }); G.box(sx * X, 0.6, z, 0.8, 1.0, 2.6, dark); }
    G.beam([sx * X, 12, -4.6], [sx * X, 12, 4.6], 0.5, 0.6, col, { ch: 0.2, caps: false, k: 0.9 });
    G.beam([sx * X, 23.6, -4], [sx * X, 23.6, 4], 1.0, 1.2, col, { ch: 0.15 });
  }
  for (const z of [-3, 3]) G.beam([-X - 2.5, 24.2, z], [X + 2.5, 24.2, z], 1.1, 1.6, col, { ch: 0.12 });
  G.box(0, 25.6, 0, 6.0, 0.25, 7.4, C.grey, { k: 0.8 });
  G.box(X - 2.2, 26.6, 0, 3.6, 2.2, 5.2, C.white, { ch: 0.05 });
  return G.build();
}
// trolley + spreader of the yard gantry (slides along x under the girders)
function buildRMGTrolley(rng, C) {
  const G = new Geo(rng);
  G.box(0, 23.0, 0, 4.4, 1.2, 5.4, C.grey, { ch: 0.1 }); G.box(1.6, 21.6, 2.2, 1.6, 1.8, 1.6, C.white, { ch: 0.08 });
  G.box(0, 15.2, 0, 2.6, 0.5, 12.3, C.yellow, { ch: 0.1 });
  for (const sx of [-1, 1]) for (const z of [-2, 2]) G.beam([sx * 1.0, 15.4, z * 1.5], [sx * 1.6, 22.4, z], 0.1, 0.1, C.dark, { ch: 0, caps: false });
  return G.build();
}
// driverless flat truck: origin on the ground, long axis x
function buildTruck(rng, C) {
  const G = new Geo(rng);
  G.box(0, 1.25, 0, 14.6, 0.5, 2.9, C.white, { ch: 0.2, k: 0.7 });
  for (const e of [-7, 7]) G.box(e, 1.05, 0, 0.6, 0.7, 2.7, C.yellow);
  for (const wx of [-5.2, -3.9, 3.9, 5.2]) for (const s of [-1, 1]) G.cyl([wx, 0.6, s * 0.95], [wx, 0.6, s * 1.45], 0.6, 0.6, 8, C.dark, { k: 0.7 });
  G.box(0, 0.8, 0, 6.5, 0.5, 1.4, C.dark, { k: 1.2 });
  G.cyl([6.6, 1.5, 1.0], [6.6, 2.1, 1.0], 0.12, 0.12, 5, C.dark);
  return G.build();
}
// harbour tug: origin at the waterline, bow toward +x
function buildTug(rng, C) {
  const G = new Geo(rng), hull = C.tugHull;
  G.beam([-13, 0.6, 0], [7, 0.9, 0], 9.0, 4.4, hull, { ch: 0.22, up: [0, 1, 0] });
  G.beam([7, 0.9, 0], [15, 1.6, 0], 9.0, 4.4, hull, { w2: 1.6, h2: 3.6, ch: 0.22, up: [0, 1, 0] });
  G.beam([-13.2, 2.9, 0], [8, 3.3, 0], 9.4, 0.5, C.tugBand, { ch: 0.1, up: [0, 1, 0], k: 0.9 });
  G.box(1.5, 4.9, 0, 9.0, 2.8, 6.2, C.white, { ch: 0.06, k: 0.9 });
  G.box(3.0, 7.6, 0, 5.2, 2.6, 5.0, C.white, { ch: 0.08 });
  G.box(5.63, 7.9, 0, 0.06, 1.0, 4.2, C.dark, { k: 0.7 });
  for (const s of [-1, 1]) G.cyl([-2.6, 6.3, s * 1.7], [-3.0, 10.4, s * 1.7], 0.75, 0.6, 8, C.tugBand);
  G.cyl([3, 8.9, 0], [3, 13.5, 0], 0.16, 0.08, 5, C.grey);
  G.box(-8.5, 3.6, 0, 2.2, 1.0, 2.8, C.dark, { k: 1.3 });
  for (let k = 0; k < 7; k++) for (const s of [-1, 1]) G.cyl([-10 + k * 3.2, 2.2, s * 4.5], [-10 + k * 3.2, 2.2, s * 4.9], 0.75, 0.75, 7, C.dark, { k: 0.6 });
  // later additions (private stream): a dark working deck inside the bulwark band, wheelhouse glass all round, funnel caps, towing winch and hook, bow fender
  { const r0 = G.rng; G.rng = lcg(5521);
    G.beam([-12.4, 3.42, 0], [7.6, 3.6, 0], 8.2, 0.2, C.dark, { ch: 0, up: [0, 1, 0], k: 1.7 });
    for (const s of [-1, 1]) G.box(3.0, 7.9, s * 2.53, 4.4, 1.0, 0.06, C.dark, { k: 0.7 });
    G.box(0.37, 7.9, 0, 0.06, 1.0, 4.2, C.dark, { k: 0.7 }); G.box(3.0, 9.0, 0, 5.8, 0.25, 5.6, C.white, { k: 0.75 });
    for (const s of [-1, 1]) G.cyl([-3.0, 10.4, s * 1.7], [-3.05, 11.0, s * 1.7], 0.66, 0.62, 8, C.dark, { k: 0.8 });
    G.cyl([-6.2, 4.4, -1.3], [-6.2, 4.4, 1.3], 0.9, 0.9, 8, C.grey); G.box(-6.2, 3.9, 0, 2.0, 0.9, 3.4, C.dark, { k: 1.6 });
    G.beam([-10.5, 3.6, 0], [-10.5, 5.2, 0], 0.5, 0.5, C.yellow, { ch: 0.2 });
    G.cyl([14.2, 2.4, -1.4], [14.2, 2.4, 1.4], 1.0, 1.0, 8, C.dark, { k: 0.6 });
    G.rng = r0; }
  return G.build();
}
// the ship arriving off the east end: origin at the waterline amidships, bow toward -x (she is coming in)
function buildArrival(rng, C, kind, mosaic, lamps) {
  const G = new Geo(rng), L = kind === 'cruise' ? 290 : 300, B = kind === 'cruise' ? 38 : 44;
  const fb = kind === 'carrier' ? 34 : kind === 'cruise' ? 15 : 19, hull = kind === 'cruise' ? C.white : kind === 'carrier' ? C.carrier : C.dark;
  const h2 = L / 2;
  G.beam([h2, fb / 2 - 3, 0], [-h2 + 46, fb / 2 - 3, 0], B, fb + 6, hull, { ch: 0.06, up: [0, 1, 0], k: kind === 'cruise' ? 0.8 : 1.2 });
  G.beam([-h2 + 46, fb / 2 - 3, 0], [-h2, fb / 2 - 1.5, 0], B, fb + 6, hull, { w2: 1.5, h2: fb + 3, ch: 0.06, up: [0, 1, 0], k: kind === 'cruise' ? 0.8 : 1.2 });
  const tops = [];
  if (kind === 'container') {
    for (let b = 0; b < 19; b++) {
      const x = -h2 + 34 + b * 13.2; if (b === 14) continue;
      const tiers = b < 2 ? 3 : rng.int(5, 8);
      for (let t = 0; t < tiers; t++) for (let c = 0; c < 3; c++) G.box(x, fb + 1.3 + t * 2.6, (c - 1) * 13.5, 12.2, 2.55, 13.2, rng.pick(mosaic), { ch: 0, k: rng.range(0.5, 0.85) });
    }
    const bx = -h2 + 34 + 14 * 13.2;
    G.box(bx, fb + 17, 0, 11, 34, B - 2, C.white, { ch: 0.03, k: 0.75 }); G.box(bx, fb + 35.5, 0, 8, 3, B + 14, C.white, { k: 0.8 });
    G.beam([h2 - 34, fb, 0], [h2 - 35, fb + 30, 0], 8, 11, hull, { w2: 6, h2: 9, ch: 0.25, k: 1.6 });
    tops.push([bx, fb + 38, 0], [h2 - 35, fb + 30, 0]);
    for (let k = 0; k < 7; k++) lamps.push([bx - 5.6, fb + 6 + k * 4, rng.range(-16, 16), 1]);
  } else if (kind === 'carrier') {
    G.box(8, fb + 1.6, 0, L - 56, 3.2, B - 1, hull, { ch: 0.04, k: 1.25 });
    G.box(-h2 + 62, fb + 5.4, 0, 12, 4.4, B + 8, C.white, { ch: 0.05, k: 0.85 });
    G.box(0, fb * 0.45, B / 2 + 0.05, L - 80, 2.2, 0.1, C.white, { k: 0.7 }); G.box(0, fb * 0.45, -B / 2 - 0.05, L - 80, 2.2, 0.1, C.white, { k: 0.7 });
    G.beam([h2 - 30, fb + 3, 8], [h2 - 31, fb + 13, 8], 5, 6, C.dark, { w2: 4, h2: 5, ch: 0.25, k: 1.5 });
    tops.push([-h2 + 62, fb + 8, 0], [h2 - 31, fb + 13, 8]);
    for (let k = 0; k < 6; k++) lamps.push([-h2 + 55.8, fb + 5.6, -18 + k * 7.2, 1]);
  } else {
    for (let d = 0; d < 8; d++) {
      const x0 = -h2 + 52 + d * 6, x1 = h2 - 20 - d * 9, w = B - 2 - d * 1.6;
      G.box((x0 + x1) / 2, fb + 1.7 + d * 3.4, 0, x1 - x0, 3.4, w, C.white, { ch: 0.03, k: 0.78 + 0.08 * (d % 2) });
      for (let k = 0; k < 16; k++) if (rng() < 0.75) for (const s of [-1, 1]) lamps.push([x0 + 6 + (k / 15) * (x1 - x0 - 12), fb + 1.9 + d * 3.4, s * (w / 2 + 0.3), 0]);
    }
    G.beam([24, fb + 27, 0], [30, fb + 41, 0], 13, 16, C.tugBand, { w2: 9, h2: 12, ch: 0.3 });
    G.cyl([-h2 + 90, fb + 27, 0], [-h2 + 90, fb + 40, 0], 0.5, 0.2, 6, C.white);
    tops.push([-h2 + 90, fb + 40, 0], [30, fb + 41, 0]);
  }
  return { geo: G.build(), tops, L, B, fb };
}
// cormorant drying its wings, cruciform: origin at the feet, facing +x
function buildCormorant(rng, C) {
  const G = new Geo(rng), k = new THREE.Color('#0d1014'), k2 = new THREE.Color('#1c2126');
  G.beam([0, 0.05, 0], [0.12, 0.62, 0], 0.26, 0.3, k, { w2: 0.2, h2: 0.22, ch: 0.3 });
  G.beam([0.12, 0.6, 0], [0.2, 0.9, 0], 0.1, 0.1, k, { w2: 0.07, h2: 0.07, ch: 0.3, caps: false });
  G.beam([0.18, 0.9, 0], [0.42, 0.95, 0], 0.08, 0.09, k2, { w2: 0.02, h2: 0.03, ch: 0.2 });
  for (const s of [-1, 1]) {
    G.quad([0.08, 0.56, s * 0.1], [0.02, 0.62, s * 0.55], [-0.2, 0.2, s * 0.62], [-0.1, 0.22, s * 0.1], G.tint(k2));
    G.quad([-0.1, 0.22, s * 0.1], [-0.2, 0.2, s * 0.62], [0.02, 0.62, s * 0.55], [0.08, 0.56, s * 0.1], G.tint(k2));
  }
  G.quad([-0.1, 0.12, -0.08], [-0.34, 0.0, -0.1], [-0.34, 0.0, 0.1], [-0.1, 0.12, 0.08], G.tint(k));
  return G.build();
}

// a gull sitting on a box top: origin at the feet, facing +x
function buildSeatedGull(rng) {
  const G = new Geo(rng), w = new THREE.Color('#c4cad0'), g = new THREE.Color('#6f7a86'), y = new THREE.Color('#c9981e'), k = new THREE.Color('#15181c');
  G.beam([-0.17, 0.17, 0], [0.2, 0.21, 0], 0.2, 0.19, w, { w2: 0.15, h2: 0.16, ch: 0.3 });
  G.beam([-0.4, 0.22, 0], [-0.08, 0.27, 0], 0.07, 0.05, g, { w2: 0.21, h2: 0.09, ch: 0.25 });
  G.beam([-0.5, 0.2, 0], [-0.36, 0.22, 0], 0.05, 0.03, k, { ch: 0 });
  G.beam([0.15, 0.25, 0], [0.24, 0.42, 0], 0.11, 0.11, w, { w2: 0.1, h2: 0.1, ch: 0.3 });
  G.beam([0.27, 0.4, 0], [0.4, 0.37, 0], 0.045, 0.045, y, { w2: 0.012, h2: 0.012, ch: 0 });
  for (const s of [-1, 1]) G.beam([0.02, 0, s * 0.045], [0.02, 0.1, s * 0.045], 0.025, 0.025, y, { ch: 0, caps: false });
  return G.build();
}

// static props in one mesh: flood masts, quay walls beyond the hero, mooring dolphins, sheds, bollards
async function buildProps(rng, C, masts, dolphins, pause) {
  const G = new Geo(rng);
  masts.forEach((m, i) => {
    const r0 = G.rng; if (i >= masts.length - 4) G.rng = lcg(311 + i);      // the four apron masts came later: private stream
    G.cyl([m[0], 0, m[1]], [m[0], 40.5, m[1]], 0.62, 0.3, 6, C.dark, { k: 1.6, caps: false });
    G.cyl([m[0], 40.5, m[1]], [m[0], 43.0, m[1]], 0.06, 0.04, 4, C.dark, { k: 1.5, caps: false });
    G.box(m[0], 1.0, m[1], 1.6, 2.0, 1.6, C.concrete, { k: 0.7 });
    for (let q = 0; q < 7; q++) G.rng();                                    // the seeded stream stays where the old head left it
    G.rng = r0;
  });
  await pause();
  // ring heads: a flat 7 m carriage with six rectangular floods slung under its rim (drawn from a private stream)
  { const r0 = G.rng; G.rng = lcg(9173); let mi = 0;
    for (const m of masts) {
      if ((++mi & 15) === 0) await pause();
      G.cyl([m[0], 39.75, m[1]], [m[0], 40.0, m[1]], 3.6, 3.6, 12, C.dark, { k: 1.4 });
      G.cyl([m[0], 38.9, m[1]], [m[0], 39.75, m[1]], 0.9, 0.9, 6, C.dark, { k: 1.2, caps: false });
      for (let k = 0; k < 6; k++) { const a = k * 1.0472 + 0.52, ca = Math.cos(a), sa = Math.sin(a), px = m[0] + ca * 3.3, pz = m[1] + sa * 3.3;
        G.beam([px + sa * 0.85, 39.3, pz - ca * 0.85], [px - sa * 0.85, 39.3, pz + ca * 0.85], 0.75, 0.5, C.dark, { ch: 0.15, k: 2.0 });
        G.beam([m[0] + ca * 0.9, 39.6, m[1] + sa * 0.9], [px, 39.6, pz], 0.14, 0.14, C.dark, { ch: 0, caps: false, k: 1.6 }); }
    }
    // three flat trucks queued, empty, in the waiting lane between the two herds
    for (const tx of [566, 584.5, 603]) { const z = -47;
      G.box(tx, 1.25, z, 14.6, 0.5, 2.9, C.white, { ch: 0.2, k: 0.7 });
      for (const e of [-7, 7]) G.box(tx + e, 1.05, z, 0.6, 0.7, 2.7, C.yellow);
      for (const wx of [-5.2, -3.9, 3.9, 5.2]) for (const sg of [-1, 1]) G.cyl([tx + wx, 0.6, z + sg * 0.95], [tx + wx, 0.6, z + sg * 1.45], 0.6, 0.6, 8, C.dark, { k: 0.7 });
      G.box(tx, 0.8, z, 6.5, 0.5, 1.4, C.dark, { k: 1.2 });
      G.cyl([tx + 6.6, 1.5, z + 1.0], [tx + 6.6, 2.1, z + 1.0], 0.12, 0.12, 5, C.dark); }
    G.rng = r0; }
  await pause();
  // quay face outside the hero's 950 m, and the east end of the quay
  const face = (x0, x1) => { for (let x = x0; x < x1; x += 40) { const xb = Math.min(x1, x + 40);
    G.quad([x, 0, 0], [xb, 0, 0], [xb, -2.2, 0], [x, -2.2, 0], G.tint(C.concrete, 0.6)); G.quad([x, -2.2, 0], [xb, -2.2, 0], [xb, -7, 0], [x, -7, 0], G.tint(C.concrete, 0.28)); } };
  face(QUAY.x0, 105); face(1055, QUAY.x1);
  for (let z = -1500; z < 0; z += 60) { const zb = Math.min(0, z + 60);
    G.quad([QUAY.x1, 0, zb], [QUAY.x1, 0, z], [QUAY.x1, -7, z], [QUAY.x1, -7, zb], G.tint(C.concrete, 0.45)); }
  for (let x = 1066; x < QUAY.x1; x += 21.5) G.cyl([x, 0, -1.2], [x, 1.1, -1.2], 0.5, 0.4, 8, C.yellow, { k: 0.7 });
  for (let z = -30; z > -400; z -= 24) G.cyl([QUAY.x1 - 1.2, 0, z], [QUAY.x1 - 1.2, 1.1, z], 0.5, 0.4, 8, C.yellow, { k: 0.7 });
  // mooring dolphins: pile clusters with a cap
  for (const d of dolphins) {
    for (let k = 0; k < 5; k++) { const a = k * 1.2566 + d[2]; G.cyl([d[0] + Math.cos(a) * 1.9, -7, d[1] + Math.sin(a) * 1.9], [d[0] + Math.cos(a) * 1.3, 3.1, d[1] + Math.sin(a) * 1.3], 0.5, 0.5, 7, C.dark, { k: 1.1, caps: false }); }
    G.cyl([d[0], 3.0, d[1]], [d[0], 3.7, d[1]], 2.6, 2.6, 10, C.concrete, { k: 0.6 });
    G.cyl([d[0] + 0.6, 3.7, d[1]], [d[0] + 0.6, 4.5, d[1]], 0.35, 0.28, 7, C.yellow, { k: 0.7 });
  }
  await pause();
  // sheds behind the rail line
  for (let x = -40; x < 1150; x += 170) {
    const w = rng.range(110, 150), h = rng.range(12, 18), d = rng.range(50, 80), z = -500 - d / 2 - rng.range(0, 30), col = rng.pick([C.shedA, C.shedB, C.shedA]);
    G.box(x + w / 2, h / 2, z, w, h, d, col, { ch: 0, k: rng.range(0.8, 1.1) });
    G.beam([x, h, z], [x + w, h, z], d + 2, 0.4, C.dark, { ch: 0, k: 2.0, up: [0, 1, 0] });
    G.beam([x, h + 2.4, z], [x + w, h + 2.4, z], d * 0.2, 0.4, C.dark, { ch: 0, k: 2.2, up: [0, 1, 0] });
    for (let k = 0; k < 5; k++) G.box(x + 12 + k * (w - 24) / 4, 3, z + d / 2 + 0.06, 7, 6, 0.1, C.dark, { k: 1.4 });
  }
  await pause();
  return G.build();
}

// far layer: haze-flattened silhouettes with no scene fog; colours are mixed toward the sky in their own azimuth
function buildFar(rng, sky, look, lamps, far) {
  const G = new Geo(rng), eye = new THREE.Vector3(600, 30, -20), d3 = new THREE.Vector3(), hz = new THREE.Color();
  G.jit = 0.03;
  const sil = new THREE.Color(look.sil || '#141b26');
  const tone = (x, y, z, dark = 1) => {
    d3.set(x - eye.x, 0, z - eye.z); const dist = d3.length(); d3.y = dist * 0.012; d3.normalize();
    sky.colorAt(d3, hz); const k = Math.min(0.9, 1 - Math.exp(-dist / 2300)) * (1 - 0.25 * (dark - 1));
    return new THREE.Color().copy(sil).lerp(hz, sat(k + (look.farHaze || 0)));
  };
  const strip = (pts, h0, h1, seed) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1], n = Math.max(2, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 260));
      for (let j = 0; j < n; j++) {
        const t0 = j / n, t1 = (j + 1) / n, x0 = mix(a[0], b[0], t0), z0 = mix(a[1], b[1], t0), x1 = mix(a[0], b[0], t1), z1 = mix(a[1], b[1], t1);
        const ya = h0 + (h1 - h0) * hash1(seed + i * 17 + j), yb = h0 + (h1 - h0) * hash1(seed + i * 17 + j + 1), c = tone((x0 + x1) / 2, 0, (z0 + z1) / 2);
        G.quad([x0, -3, z0], [x1, -3, z1], [x1, yb, z1], [x0, ya, z0], [c.r, c.g, c.b]);
      }
    }
  };
  // north bank, east shore beyond the bridge, south headland with the refinery
  strip([[-5200, 2300], [-2400, 2900], [-200, 3150], [1500, 2900], [2250, 1900], [2500, 1500]], 14, 34, 1);
  strip([[4800, 1500], [6000, 1450], [6900, 1700]], 16, 40, 2);
  strip([[QUAY.x1 + 900, -260], [3000, -420], [4600, -520], [6800, -640]], 10, 26, 3);
  // poplars: a comb of dark strokes on the north bank
  for (let i = 0; i < 70; i++) {
    const x = -900 + i * 36 + rng.range(-8, 8), z = 3120 - Math.abs(x - 300) * 0.12, h = rng.range(36, 54), w = rng.range(7, 10), c = tone(x, 0, z, 1.25);
    const col = [c.r, c.g, c.b];
    G.quad([x - w / 2, 14, z], [x + w / 2, 14, z], [x + w * 0.3, 14 + h * 0.75, z], [x - w * 0.3, 14 + h * 0.75, z], col);
    G._tri([x - w * 0.3, 14 + h * 0.75, z], [x + w * 0.3, 14 + h * 0.75, z], [x, 14 + h, z], col);
  }
  // suspension bridge
  const bz = 1500, t0 = 3050, t1 = 4250, deckY = 62, topY = 205;
  { const c = tone(3650, 0, bz, 1.15);
    G.box(3650, deckY, bz, 2300, 9, 30, c, { ch: 0 });
    for (const tx of [t0, t1]) { for (const s of [-1, 1]) G.box(tx, topY / 2, bz + s * 17, 16, topY, 9, c, { ch: 0 }); for (const y of [deckY + 40, topY - 8]) G.box(tx, y, bz, 13, 9, 34, c, { ch: 0 }); }
    const cab = (xa, ya, xb, yb, sag) => { const n = 14; for (let i = 0; i < n; i++) { const a = i / n, b = (i + 1) / n;
      const pa = [mix(xa, xb, a), mix(ya, yb, a) - sag * 4 * a * (1 - a), bz], pb = [mix(xa, xb, b), mix(ya, yb, b) - sag * 4 * b * (1 - b), bz];
      G.beam(pa, pb, 6, 6, c, { ch: 0, caps: false }); } };
    cab(t0, topY, t1, topY, topY - deckY - 12); cab(2500, deckY + 4, t0, topY, 18); cab(t1, topY, 4800, deckY + 4, -18 * -1);
    for (let x = t0 + 100; x < t1; x += 100) { const a = (x - t0) / (t1 - t0), y = topY - (topY - deckY - 12) * 4 * a * (1 - a); G.box(x, (y + deckY) / 2, bz, 3.5, y - deckY, 3.5, c, { ch: 0 }); }
    for (let x = 2560; x < 4800; x += 110) lamps.push([x, deckY + 8, bz - 16, 0.9, 0]);
    for (const tx of [t0, t1]) lamps.push([tx, topY + 6, bz, 1.6, 1]);
  }
  // refinery on the south headland: tanks, columns, stacks and one flare
  { const rx = 3300, rz = -470;
    for (let i = 0; i < 9; i++) { const x = rx - 520 + i * 105 + rng.range(-20, 20), r = rng.range(22, 38), h = rng.range(16, 26), c = tone(x, 0, rz); G.cyl([x, 0, rz], [x, h, rz], r, r, 10, c, { caps: true }); }
    for (let i = 0; i < 16; i++) { const x = rx + 80 + i * 44 + rng.range(-12, 12), h = rng.range(45, 120), r = rng.range(3, 6), c = tone(x, 0, rz, 1.2);
      G.cyl([x, 0, rz - 40], [x, h, rz - 40], r, r * 0.8, 6, c); if (rng() < 0.6) lamps.push([x, h + 2, rz - 40, 1.1, rng() < 0.4 ? 1 : 0]); }
    const c = tone(rx + 500, 0, rz); G.box(rx + 420, 22, rz - 30, 520, 44, 60, c, { ch: 0 });
    for (let i = 0; i < 14; i++) lamps.push([rx + 180 + rng() * 480, 8 + rng() * 36, rz + 6, 0.8, 0]);
    const fxp = rx + 860; G.cyl([fxp, 0, rz], [fxp, 150, rz], 3.5, 2.2, 6, tone(fxp, 0, rz, 1.2));
    far.flare = [fxp, 156, rz];
  }
  // anchored ships in the estuary, silhouettes with riding lights
  far.ships = [];
  for (let i = 0; i < 8; i++) {
    const ang = mix(-0.5, 1.05, (i + rng.range(0.1, 0.9)) / 8), dist = rng.range(900, 2100) + (i % 2) * 300;
    const x = 500 + Math.sin(ang) * dist, z = 260 + Math.cos(ang) * dist * 0.85, L = rng.range(170, 300), c = tone(x, 0, z, 1.1), yaw = rng.range(-0.25, 0.25);
    const cs = Math.cos(yaw), sn = Math.sin(yaw), P = (lx, y, lz) => [x + lx * cs - lz * sn, y, z + lx * sn + lz * cs];
    const fbd = rng.range(9, 15);
    G.beam(P(-L / 2, fbd / 2 - 3, 0), P(L / 2 - 30, fbd / 2 - 3, 0), 34, fbd + 6, c, { ch: 0, up: [0, 1, 0] });
    G.beam(P(L / 2 - 30, fbd / 2 - 3, 0), P(L / 2, fbd / 2 - 2, 0), 34, fbd + 6, c, { ch: 0, w2: 2, up: [0, 1, 0] });
    const sx = -L / 2 + rng.range(22, 40);
    G.beam(P(sx - 7, fbd, 0), P(sx + 7, fbd, 0), 30, 44, c, { ch: 0, up: [0, 1, 0], caps: true });
    { const a = P(sx - 7, fbd + 11, 0), b = P(sx + 7, fbd + 11, 0); G.beam(a, b, 30, 22, c, { ch: 0, up: [0, 1, 0] }); }
    if (rng() < 0.6) { const a = P(-L / 2 + 60, fbd + 7, 0), b = P(L / 2 - 40, fbd + 7 - rng.range(0, 5), 0); G.beam(a, b, 30, 14, c, { ch: 0, up: [0, 1, 0] }); }
    else for (let k = 0; k < 4; k++) { const a = P(-L / 2 + 70 + k * (L - 130) / 3, fbd, 0), b = [a[0], fbd + 20, a[2]]; G.beam(a, b, 2.5, 2.5, c, { ch: 0 }); }
    const m0 = P(sx, fbd + 30, 0), m1 = P(L / 2 - 12, fbd + 12, 0);
    lamps.push([m0[0], m0[1], m0[2], 1.2, 0], [m1[0], m1[1], m1[2], 1.2, 0]);
    for (let k = 0; k < 3; k++) { const q = P(sx + 8, fbd + 4 + k * 5, 15.2); lamps.push([q[0], q[1], q[2], 0.8, 2]); }
    far.ships.push([x, z]);
  }
  return G.build();
}

// ---------- cones of lit air under the high-mast floods (rain and haze catch the light) ----------
function makeCones(masts, time, front, color, gain) {
  const g = new THREE.ConeGeometry(1, 1, 12, 1, true).translate(0, -0.5, 0); g.deleteAttribute('uv');
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uFront: { value: front }, uCol: { value: color.clone().multiplyScalar(gain) } },
    vertexShader: /* glsl */`
      uniform vec2 uFront; varying vec3 vW; varying vec3 vN; varying float vH, vOn;
      #include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz; vH = -position.y;
        vN = normalize(vec3(position.x, 0.38, position.z) + vec3(0.0, 1e-3, 0.0));
        vOn = clamp((instanceMatrix[3].x - uFront.x) * uFront.y / 40.0, 0.0, 1.0);
        vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; uniform float uTime; varying vec3 vW; varying vec3 vN; varying float vH, vOn;
      #include <fog_pars_fragment>
      ${GLSL_N}
      void main(){
        vec3 V = normalize(cameraPosition - vW);
        float e = abs(dot(normalize(vN), V)); e = e * e * (3.0 - 2.0 * e);
        float a = e * (1.0 - smoothstep(0.55, 1.0, vH)) * smoothstep(0.0, 0.05, vH) / (0.35 + 2.2 * vH);
        a *= 0.75 + 0.5 * vn(vec2(vW.x * 0.05 + vW.z * 0.07, vW.y * 0.12 + uTime * 0.6));
        vec3 c = uCol * a * vOn;
        #ifdef USE_FOG
          float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          c *= 1.0 - 0.8 * ff;
        #endif
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.InstancedMesh(g, mat, masts.length), M = new THREE.Matrix4();
  masts.forEach((m, i) => { M.makeScale(17, 39, 17).setPosition(m[0], 39.2, m[1]); mesh.setMatrixAt(i, M); });
  mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

// ---------- lamps mirrored in the water: one shimmering streak per lamp, laid on the surface toward the eye ----------
function makeStreaks(list, time, level, gain) {
  const n = list.length, pos = new Float32Array(n * 3), col = new Float32Array(n * 4);
  list.forEach((l, i) => { pos.set([l[0], l[1], l[2]], i * 3); col.set([l[3].r * l[4], l[3].g * l[4], l[3].b * l[4], l[5]], i * 4); });
  const quad = new THREE.PlaneGeometry(1, 1, 1, 12), g = new THREE.InstancedBufferGeometry();
  g.index = quad.index; g.setAttribute('position', quad.getAttribute('position')); g.setAttribute('uv', quad.getAttribute('uv'));
  const aPos = new THREE.InstancedBufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  g.setAttribute('iPos', aPos); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(col, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uLevel: { value: level + 0.32 }, uGain: { value: gain } },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec4 iCol; uniform float uLevel, uGain;
      varying vec3 vCol; varying vec2 vQ; varying float vS, vT, vSeed;
      #include <fog_pars_vertex>
      void main(){
        vec2 d = cameraPosition.xz - iPos.xz; float D = max(length(d), 1.0); d /= D;
        float hL = max(iPos.y - uLevel, 0.5), hC = max(cameraPosition.y - uLevel, 1.5);
        float tS = D * hL / (hL + hC), t0 = tS * 0.42, t1 = tS + (D - tS) * 0.62;
        float t = mix(t0, t1, uv.y);
        vS = t < tS ? (t - tS) / max(tS - t0, 0.5) : (t - tS) / max(t1 - tS, 0.5);
        float w = iCol.w * 0.012 * (D - t) + 0.25;
        vec2 q = iPos.xz + d * t + vec2(-d.y, d.x) * (uv.x - 0.5) * 2.0 * w;
        vQ = vec2((uv.x - 0.5) * 2.0, t); vT = t; vSeed = fract(iPos.x * 0.137 + iPos.z * 0.291) * 40.0;
        vCol = iCol.rgb * uGain * (0.35 + 0.65 * smoothstep(1.5, 12.0, cameraPosition.y - uLevel));
        vec4 mvPosition = viewMatrix * vec4(q.x, uLevel, q.y, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; varying vec3 vCol; varying vec2 vQ; varying float vS, vT, vSeed;
      #include <fog_pars_fragment>
      ${GLSL_N}
      void main(){
        float x = vQ.x, a = exp(-x * x * 3.2) * (1.0 - x * x);
        a *= vS < 0.0 ? smoothstep(-1.0, -0.15, vS) : 1.0 - smoothstep(0.05, 1.0, vS);
        float n = 0.6 * vn(vec2(vT * 0.42 - uTime * 0.8 + vSeed, x * 1.3 + vSeed)) + 0.4 * vn(vec2(vT * 1.25 + uTime * 1.1, x * 2.6 - vSeed));
        a *= smoothstep(0.3, 0.72, n) * 1.7;
        vec3 c = vCol * a;
        #ifdef USE_FOG
          float ff = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          c *= 1.0 - 0.85 * ff;
        #endif
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return { mesh, move(i, x, y, z) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; aPos.needsUpdate = true; } };
}

// ---------- weeds in the crane-rail slots and rank grass along the sidings: crossed blades that shiver in the wind ----------
function makeWeeds(rng, time, light) {
  const list = [];
  for (const z of [-5, -35]) for (let x = 470; x < 1040; x += 0.55) {
    if (hash1(Math.floor(x / 7) * 3.3 + z) < 0.45) continue;
    list.push(x + rng.range(-0.2, 0.2), 0.06, z + rng.pick([-1, 1]) * rng.range(0.34, 0.6), rng.range(0.22, 0.6), rng.range(0, 6.28), rng.range(0, 1));
  }
  for (let i = 0; i < 2400; i++) { const zz = rng.chance(0.5) ? rng.range(-416.5, -412) : rng.range(-437, -424.5);
    list.push(rng.range(-250, 1110), 0, zz, rng.range(0.5, 1.25), rng.range(0, 6.28), rng.range(0, 1)); }
  const n = list.length / 6, pos = new Float32Array(n * 3), par = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { pos.set(list.slice(i * 6, i * 6 + 3), i * 3); par.set(list.slice(i * 6 + 3, i * 6 + 6), i * 3); }
  const P = [], U = [], I = [];
  for (let q = 0; q < 2; q++) { const cx = q ? 0 : 0.5, cz = q ? 0.5 : 0, b = q * 4;
    P.push(-cx, 0, -cz, cx, 0, cz, cx, 1, cz, -cx, 1, -cz); U.push(0, 0, 1, 0, 1, 1, 0, 1); I.push(b, b + 1, b + 2, b, b + 2, b + 3); }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(pos, 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(par, 3)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: time, uLight: { value: light } },
    vertexShader: /* glsl */`
      attribute vec3 iPos; attribute vec3 iPar; uniform float uTime; varying vec2 vUv; varying float vHue;
      #include <fog_pars_vertex>
      void main(){
        float cs = cos(iPar.y), sn = sin(iPar.y), h = iPar.x;
        vec3 p = vec3(position.x * cs - position.z * sn, position.y, position.x * sn + position.z * cs) * vec3(h * 0.9, h, h * 0.9);
        float k = uv.y * uv.y * h;
        float gust = sin(uTime * 1.7 + iPos.x * 0.21 + iPar.y) * 0.16 + sin(uTime * 0.6 + iPos.x * 0.05) * 0.14 + sin(uTime * 13.0 + iPar.y * 7.0) * 0.03;
        p.x += gust * k; p.z += gust * 0.5 * k;
        vUv = uv; vHue = iPar.z;
        vec4 mvPosition = modelViewMatrix * vec4(iPos + p, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uLight; varying vec2 vUv; varying float vHue;
      #include <fog_pars_fragment>
      void main(){
        float blades = abs(fract(vUv.x * 5.0 + vHue * 3.0) - 0.5) * 2.0;
        float cut = 0.35 + 0.65 * fract(floor(vUv.x * 5.0 + vHue * 3.0) * 0.618 + vHue);
        if (blades < 0.25 + 0.55 * vUv.y || vUv.y > cut) discard;
        vec3 c = mix(vec3(0.05, 0.065, 0.035), mix(vec3(0.2, 0.22, 0.1), vec3(0.3, 0.27, 0.15), vHue), vUv.y);
        gl_FragColor = vec4(c * uLight, 1.0);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

export default {
  id: 'crane-harbour',
  name: 'The Morning Lift',
  category: 'city',
  media: ['cable', 'air', 'open'],
  weirdness: 0,
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, vr = rng.fork('ch-variant');
    const pickLook = vr.pick(['dawn', 'dawn', 'predawn', 'dusk', 'fog']), winter = vr.chance(0.3), arrivalKind = vr.pick(['container', 'carrier', 'cruise']);
    const hour = vary.hour || 'any';
    const lookId = hour === 'dawn' ? 'dawn' : hour === 'night' ? 'predawn' : hour === 'golden' ? 'dusk' : hour === 'day' ? 'fog' : pickLook;
    const look = LOOKS[lookId], rare = !!vary.rare, detail = ctx.quality?.detail ?? 1, density = (vary.density ?? 1) * detail, duration = 50;   // detail thins gulls, trucks and motes on phones
    const hasSun = look.sunEl[1] > 0;
    const H = (h) => new THREE.Color(h);
    const scene = new THREE.Scene();
    const T = { value: 0 };

    // ----- sky, light, fog -----
    const sky = makeSky({ rng, ...look.sky, sunElevation: look.sunEl[0], sunAzimuth: 90, renderer: ctx.renderer });
    // The kit's dome is two 16-triangle fans whose apexes sit exactly overhead and underfoot. In straight, level flight
    // toward +X (the whole nave) every one of those triangles has a vertex in the camera's own plane (clip w = 0) and
    // the whole sky comes out not-a-number. A finely divided sphere keeps such triangles 90 degrees off-axis, out of frame.
    { const th = Math.acos(-0.045), low = sky.object.children[0];
      sky.object.geometry.dispose(); sky.object.geometry = new THREE.SphereGeometry(1, 40, 14, 0.137, Math.PI * 2, 0, th);
      if (low && low.isMesh) { low.geometry.dispose(); low.geometry = new THREE.SphereGeometry(1, 40, 8, 0.137, Math.PI * 2, th, Math.PI - th); } }
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(H(look.fog), look.density);
    const rig = makeLightRig(sky, { bounce: 0.25 }); scene.add(rig.object);
    await ctx.yield();

    // ----- hero: the herd at the water -----
    const FROST = { value: winter ? 1 : 0 };
    const CRF = { value: H(PALETTE[4]).multiplyScalar(look.craneFlood) }, MUTE = { value: look.mute }, GLINT = { value: sky.horizonColor.clone().multiplyScalar(hasSun ? 0.5 : 0.7).add(H(PALETTE[4]).multiplyScalar(hasSun ? 0.05 : 0.12 * look.deck)) };
    // the shell plating's own light: sky fill, the low sun raking along the plates, the sea's light rippling up from the waterline
    const HULL = { sky: { value: sky.horizonColor.clone().lerp(sky.zenithColor, 0.4).multiplyScalar(look.hullSky ?? 0.5) }, sun: { value: H(look.sky.sunColor || '#FFE2A8').lerp(H(PALETTE[4]), 0.35).multiplyScalar(hasSun ? (look.hullSun ?? 1.6) : 0) },
      sunDir: { value: sky.sunDirection }, time: T, sea: { value: (hasSun ? H('#ffd9a8') : H(PALETTE[4]).lerp(H('#8fa6d0'), 0.5)).multiplyScalar(look.hullSea ?? 0.5) } };
    const hero = await buildHero(ctx, { hull: HULL, palette: PALETTE, apron: false, fill: look.hero, journeySeconds: 40, moored: !rare, frost: FROST, craneFlood: CRF, mute: MUTE, glint: GLINT, boomLamps: look.boomLamps, hullGlow: look.hullGlow ?? 0.1 });
    hero.object.position.set(580, 0, 0); scene.add(hero.object);
    const HL = hero.look, OFF = 580, A = hero.anchors;
    await ctx.yield();

    // ----- the flight: canyon, hoist, trolley, swoop, bow, nave -----
    // canyon (70 m), a hoist that swings out east as it rises, round the landward side of crane 5's east frame, so that
    // at the top nothing of our own crane stands between the lens and the sun, the rising booms and crane 6's box
    // (the spreader that lifted us travels alongside, 23 m to the west),
    // the trolley run, the swoop round the bow, and a nave that dips and lifts under five cranes to the ring under crane 11
    // The trolley run is flown at 49 m, 23 m east of the ridden spreader, so the deck is a landscape below and not a grazing plane.
    // Off the boom end the camera banks left in a wide arc out over the basin, looking into the turn at the working herd (the
    // lowered booms over the hull and the box cliff, whole), comes round toward the ship and runs east down her seaward flank
    // under the boom ends to the bow and the cormorants. Then it climbs east past the raised booms, 30 m and more to seaward of
    // their hinges, crests at 56 m and dives through the gap between cranes 9 and 10 (x 775..815 above the bogies), under
    // crane 10's portal beam and down 75 m of nave to the ring. Down her flank the camera sinks to 10 m beside the waterline, a tug and the channel buoys.
    const TY = 49, so = rare ? 12 : 0;
    const sw = [48.5, 47, 45, 42, 38, 34, 30, 25, 16, 11, 10, 11, 11, 19];   // down her flank the camera sinks to 10 m: hull, waterline and wake beside it, boom ends overhead
    const pts = [[450, 2.5, -142], [450, 2.5, -112], [450, 2.5, -84], [450, 3.0, -58], [450.5, 11, -54.5], [454, 24, -50.5], [461, 36, -47.5], [470, 45.5, -42.5], [472.9, TY, -29],
      [473, TY, -8], [473, TY, 14], [473, TY, 36], [473.6, TY, 58],
      [470, sw[0], 92 + so], [448, sw[1], 124 + so], [410, sw[2], 140 + so], [368, sw[3], 138 + so], [340, sw[4], 120 + so], [332, sw[5], 100 + so], [346, sw[6], 84 + so], [376, sw[7], 79 + so], [425, sw[8], 80 + so],
      [480, sw[9], 82 + so], [530, sw[10], 80 + so], [566, sw[11], 66 + so * 0.5], [586, sw[12], 46], [614, sw[13], 42],
      [655, 39, 40], [712, 56, 31], [766, 47, 14], [797, 25, -8], [826, 10.5, -18.6], [856, 9, -20], [900, 9, -20]];
    const path = makePath(pts);
    let uFoot = 0, uTop = 0, uEnd = 0, uNave = 0, uQuay = 0, uBow = 0, uA = 0, uC = 0, uCrest = 0, uTurn = 0, uEast = 0, zPass = -110, uPass = 0.045; const tp = new THREE.Vector3();
    for (let i = 0; i <= 800; i++) {
      const uu = i / 800; path.pointAt(uu, tp);
      if (!uFoot && tp.z > -58.5) uFoot = uu; if (!uTop && tp.y > TY - 0.3) uTop = uu; if (!uEnd && tp.z > 59.5) uEnd = uu; if (!uQuay && uTop && tp.z > -14) uQuay = uu;
      if (!uTurn && uEnd && tp.x < 337) uTurn = uu; if (!uEast && uTurn && tp.x > 380) uEast = uu;
      if (!uBow && uEast && tp.x > 584) uBow = uu; if (!uA && uBow && tp.x > 620) uA = uu; if (!uCrest && tp.x > 712) uCrest = uu; if (!uC && tp.x > 760) uC = uu;
      if (!uNave && uEnd && tp.x > 822 && tp.z < -15) uNave = uu;
    }
    uPass = uFoot * 0.48; zPass = path.pointAt(uPass, tp).z;
    // the boom wave in the hero's own seconds (crane 7 starts at 8, each 2.5 s after its neighbour, 9 s to rise), keyed to the
    // flight: the first two necks rise during the trolley run, the wave all but waits while the camera looks west at the working
    // herd, and from the bow on it runs east beside the camera, so the boom abeam is three quarters up and the ones ahead stand in a fan
    const WAVE = [[0, 6.2], [uFoot, 7], [uTop, 9.5], [uEnd, 14], [uEast, 15], [uA, 17.5], [uC, 20], [1, 30]];
    const waveAt = (u) => { let k = 1; while (k < WAVE.length - 1 && u > WAVE[k][0]) k++; const a = WAVE[k - 1], b = WAVE[k]; return mix(a[1], b[1], sat((u - a[0]) / Math.max(1e-4, b[0] - a[0]))); };

    // The orbit's gaze. From the middle of the trolley run it leaves the rising booms in the east and comes round by the south
    // (crane 6, the lit yard, the deck under crane 5's boom) to the working herd, then holds on it while the camera pulls away
    // north and arcs west. It never passes through the open north, and it is the whole gaze (weight 1), so the opposite pull of
    // the direction of travel cannot tip it at the water.
    const uG0 = uEnd - 0.062, gP = new THREE.Vector3(), gA = new THREE.Vector3(...look.poi), gB = new THREE.Vector3(335, 34, 36);
    const herdGaze = (time, u) => {
      path.pointAt(u, gP);
      const k = sstep(uEnd - 0.034, uEnd + 0.05, u), ax = gA.x - gP.x, az = gA.z - gP.z, bx = gB.x - gP.x, bz = gB.z - gP.z;
      const ya = Math.atan2(az, ax); let yb = Math.atan2(bz, bx); if (yb > ya) yb -= TAU;          // always round by the south (decreasing angle)
      const pa = Math.atan2(gA.y - gP.y, Math.hypot(ax, az)), pb = Math.atan2(gB.y - gP.y, Math.hypot(bx, bz));
      const y = mix(ya, yb, k), p = mix(pa, pb, k) - 0.09 * Math.sin(Math.PI * k);                 // dips a little over the deck on the way round
      return gP.set(gP.x + 120 * Math.cos(y) * Math.cos(p), gP.y + 120 * Math.sin(p), gP.z + 120 * Math.sin(y) * Math.cos(p));
    };

    // ----- shared uniforms -----
    const sodium = H(PALETTE[4]), cream = H(PALETTE[5]);
    const uFlood = { value: sodium.clone().multiplyScalar(look.flood) }, uFront = { value: new THREE.Vector2(60, 1) };
    const uGrid = { value: new THREE.Vector4(YARD.x0, YARD.pitch, YARD.mastZ0, YARD.mastPitch) };
    const sunCol = hasSun ? H(look.sky.sunColor || '#FFE2A8').lerp(sodium, lookId === 'dawn' ? 0.45 : 0.1).multiplyScalar(3.2) : new THREE.Color(0, 0, 0);
    const GU = {
      uSunDir: { value: sky.sunDirection }, uSunCol: { value: sunCol }, uZen: { value: sky.zenithColor.clone() }, uHor: { value: sky.horizonColor.clone() },
      uScat: { value: H(look.sky.scatterColor).multiplyScalar(look.sky.scatter * (hasSun ? 1.5 : 0.8)) }, uAmb: { value: H(look.amb).multiplyScalar(1.6) },
      uFlood, uFront, uGrid, uTime: T, uTanE: { value: 0.05 }, uShadow: { value: look.shadow }, uWet: { value: look.wet }, uGlint: { value: look.glint },
      uRain: { value: lookId === 'predawn' ? 1 : 0 }, uLampK: { value: look.lampK }, uHead: { value: new THREE.Vector4(450, -90, 30, look.head) }, uXM: { value: [new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2()] }, uCr: { value: A.cranes.map((c) => c.x + OFF) },
    };
    const C = {
      dark: H('#14181F').lerp(H('#3F5873'), 0.12), grey: H('#566270'), white: H('#b4bec8'), yellow: H('#c9871e').multiplyScalar(0.8), concrete: H('#6f7780'),
      gantry: H(rng.pick(['#3b5f8a', '#7a8a96', '#a8501e'])), tugHull: H('#161b22'), tugBand: H(rng.pick(['#b8421e', '#c8851e', '#2d5e86'])), carrier: H('#5b6f86'),
      shedA: H('#59636e'), shedB: H('#46566a'),
    };
    const fillMat = (m) => { m.onBeforeCompile = (sh) => { sh.uniforms.uFill = HL.FILL;
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uFill;')
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += diffuseColor.rgb * uFill;'); }; return m; };
    const steel = fillMat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.08 }));
    const front = uFront.value, lamps = makeLampSet(1600, front);
    const uFloodBox = { value: uFlood.value.clone().multiplyScalar(look.floodBox) };
    HL.DECK.flood.value.copy(sodium).multiplyScalar(look.deck);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), S1 = new THREE.Vector3(1, 1, 1), YA = new THREE.Vector3(0, 1, 0), E = new THREE.Euler();

    // ----- ground -----
    const groundG = new THREE.PlaneGeometry(QUAY.x1 - QUAY.x0, -QUAY.zS, 1, 1).rotateX(-Math.PI / 2).translate((QUAY.x0 + QUAY.x1) / 2, 0, QUAY.zS / 2);
    const groundMat = makeGroundMaterial(GU), ground = new THREE.Mesh(groundG, groundMat); ground.frustumCulled = false; scene.add(ground);
    // Seen through the previous portal the camera's near plane stands at the opening, tens of metres ahead, and cuts the
    // asphalt away below the horizon: without these sheets the opening would show the sea that lies under the quay.
    for (const y of [-2.2, -8, -20]) { const sub = new THREE.Mesh(groundG, groundMat); sub.position.y = y; sub.frustumCulled = false; scene.add(sub); }

    // ----- container yard: one instance per stack, tiers drawn by the hero's box shader -----
    const shift = rng.int(0, 1), rmgK = [-5 + shift, 2 + shift, 9 + shift, 16 + shift], aisleK = rng.shuffle([-8, -3, 4, 6, 11, 13].map((k) => k + shift)).slice(0, 5);
    const cols = [], masts = [], blockTop = {};
    for (let k = YARD.k0; k <= YARD.k1; k++) {
      const cx = YARD.x0 + k * YARD.pitch, isRmg = rmgK.includes(k), nearCam = k === -1 || k === 0;
      for (const b of [4, 12, 20]) masts.push([cx, YARD.zTop - 6.25 - b * YARD.bayPitch]);
      let top = 0;
      for (let b = 0; b < YARD.bays; b++) {
        const z = YARD.zTop - 6.25 - b * YARD.bayPitch, base = 4.3 + 1.4 * ctx.noise.n2(k * 0.41 + 3.1, b * 0.17) + (nearCam ? 1.0 : 0);
        const hole = ctx.noise.n2(k * 0.9 + 40, b * 0.33 + 7) < -0.62 && !nearCam, plaza = z < -143 && Math.abs(cx - 450) < 70;
        for (let r = 0; r < 8; r++) {
          if ((b === 4 || b === 12 || b === 20) && (r === 3 || r === 4)) continue;
          let t = Math.round(base + rng.range(-1.0, 0.8)); if (hole) t -= 3;
          t = Math.min(isRmg ? 4 : 6, t); if (nearCam && (r === 0 || r === 7)) t = Math.max(t, 5);
          // the canyon steps down toward its mouth, so crane 5's red frame and boom stand over it on the entry axis
          if (nearCam && b < 3) t = Math.min(t, b === 2 ? 4 : 3);
          if (t < 1 || plaza) continue;
          cols.push([cx + (r - 3.5) * 2.44, z, t, k * 97.3 + b * 7.31 + r * 1.77]); top = Math.max(top, t);
        }
      }
      blockTop[k] = top * 2.591;
    }
    // four more masts on the landward edge of the apron: two flank the canyon mouth, two light the gap between the herds
    const XM = [[436.5, -76.5], [463.5, -76.5], [569, -77.2], [637, -77.2]];
    for (let i = 0; i < 4; i++) { masts.push(XM[i]); GU.uXM.value[i].set(XM[i][0], XM[i][1]); }
    const NTR = Math.round(14 * Math.min(1.2, density)), NSC = 6, NDYN = NSC + NTR + 4, NY = cols.length + NDYN, DYN0 = cols.length;
    const boxG = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0); boxG.deleteAttribute('uv');
    const aDim = new Float32Array(NY * 3), aSeed = new Float32Array(NY);
    const yardMat = makeBoxMaterial(HL.mosaic, HL.dom, HL.domW, HL.FILL, { frost: FROST, flood: uFloodBox, front: uFront, grid: uGrid, mute: MUTE, glint: GLINT, head: GU.uHead });
    const yard = new THREE.InstancedMesh(boxG, yardMat, NY); yard.frustumCulled = false;
    Q.setFromAxisAngle(YA, Math.PI / 2);
    for (let i = 0; i < NY; i++) {
      const c = cols[i];
      if (c) { M.compose(V.set(c[0], 0, c[1]), Q, S1); aDim.set([12.19, c[2] * 2.591, 2.44], i * 3); aSeed[i] = c[3]; }
      else { M.makeScale(1e-4, 1e-4, 1e-4); aDim.set([12.19, 2.591, 2.44], i * 3); aSeed[i] = rng() * 900; }
      yard.setMatrixAt(i, M);
    }
    boxG.setAttribute('aDim', new THREE.InstancedBufferAttribute(aDim, 3)); boxG.setAttribute('aSeed', new THREE.InstancedBufferAttribute(aSeed, 1));
    scene.add(yard);
    const setBox = (i, x, y, z, yaw) => { Q.setFromAxisAngle(YA, yaw); M.compose(V.set(x, y, z), Q, S1); yard.setMatrixAt(DYN0 + i, M); };
    await ctx.yield();

    // ----- static props, flood heads -----
    const dolphins = [[578, 62, 0.3], [586, 55, 1.1], [594, 48, 2.0]];
    await ctx.yield();
    const propsG = await buildProps(rng, C, masts, dolphins, () => ctx.yield());
    await ctx.yield();
    const props = new THREE.Mesh(propsG, steel); scene.add(props);
    await ctx.yield();
    const lampHead = cream.clone().lerp(sodium, 0.45);
    for (const m of masts) {
      lamps.add(m[0], 39.1, m[1], sodium, 1.1, 5.6, 0, 0, 1);
      for (let k = 0; k < 6; k++) { const a = k * 1.0472 + 0.52; lamps.add(m[0] + Math.cos(a) * 3.3, 38.95, m[1] + Math.sin(a) * 3.3, lampHead, 5.2, 1.05, 0, 0, 1); }
    }
    for (const tx of [566, 584.5, 603]) lamps.add(tx + 6.6, 2.35, -46, sodium, 6, 1.2, 4.2, tx * 0.37);
    const cones = makeCones(masts, T, front, sodium, look.cone); scene.add(cones);
    for (let x = 20; x < 1150; x += 85) lamps.add(x, 11, -497, sodium, 2.6, 2.4, 0, 0, 0);

    await ctx.yield();
    // ----- straddle carriers: #0 rolls over the camera in the canyon, the rest work their aisles -----
    const scMesh = new THREE.InstancedMesh(buildStraddle(rng, C), steel, NSC); scMesh.frustumCulled = false; scene.add(scMesh);
    const scs = [{ x: 450, hero: true }];
    for (const k of aisleK) scs.push({ x: YARD.x0 + k * YARD.pitch + 17, ph: rng.range(0, TAU), rate: rng.range(0.035, 0.055), box: rng.chance(0.75) });
    for (const s of scs) { s.l0 = lamps.add(0, 0, 0, sodium, 5.5, 1.5, 5.2, rng.range(0, TAU)); s.l1 = lamps.add(0, 0, 0, sodium, 5.5, 1.5, 5.2, rng.range(0, TAU)); s.l2 = lamps.add(0, 0, 0, cream, 2.4, 1.6); }

    // ----- yard gantries -----
    const rmgMesh = new THREE.InstancedMesh(buildRMG(rng, C), steel, 4), rmgTro = new THREE.InstancedMesh(buildRMGTrolley(rng, C), steel, 4);
    rmgMesh.frustumCulled = false; rmgTro.frustumCulled = false; scene.add(rmgMesh, rmgTro);
    const rmgs = rmgK.map((k) => ({ x: YARD.x0 + k * YARD.pitch, ph: rng.range(0, TAU), rate: rng.range(0.022, 0.034), l0: lamps.add(0, 0, 0, sodium, 6, 2.2, 2.6, rng.range(0, TAU)), l1: lamps.add(0, 0, 0, cream, 2.2, 1.8) }));

    await ctx.yield();
    // ----- driverless trucks on two racetracks either side of the camera aisle -----
    const trMesh = new THREE.InstancedMesh(buildTruck(rng, C), steel, NTR); trMesh.frustumCulled = false; scene.add(trMesh);
    const trucks = [];
    for (let i = 0; i < NTR; i++) {
      const east = i % 3 !== 0, xa = east ? 486 : 112, xb = east ? 1048 : 414, per = 2 * (xb - xa) + TAU * 5;
      trucks.push({ xa, xb, per, s0: rng() * per, v: rng.range(7.5, 10.5), box: rng.chance(0.62), l: lamps.add(0, 0, 0, sodium, 6, 1.2, 4.2, rng.range(0, TAU)) });
    }
    const truckPose = (t, time, o) => {
      const r = 5, L = t.xb - t.xa; let s = (t.s0 + time * t.v) % t.per;
      if (s < L) { o.x = t.xa + s; o.z = -62; o.a = 0; return; } s -= L;
      if (s < Math.PI * r) { const th = s / r; o.x = t.xb + r * Math.sin(th); o.z = -67 + r * Math.cos(th); o.a = th; return; } s -= Math.PI * r;
      if (s < L) { o.x = t.xb - s; o.z = -72; o.a = Math.PI; return; } s -= L;
      const th = Math.PI + s / r; o.x = t.xa + r * Math.sin(th); o.z = -67 + r * Math.cos(th); o.a = th;
    };

    await ctx.yield();
    // ----- the double-stack freight train drawing out eastward along z = -420 -----
    const train = new THREE.Group(); train.position.set(-400, 0, -420); scene.add(train);
    { const NC = 72, tg = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0); tg.deleteAttribute('uv');
      const td = new Float32Array(NC * 3), ts = new Float32Array(NC), tm = new THREE.InstancedMesh(tg, yardMat, NC), G = new Geo(rng);
      for (let i = 0; i < NC; i++) {
        const t = rng() < 0.12 ? 0 : rng() < 0.75 ? 2 : 1;
        if (t) M.makeTranslation(i * 14.2, 1.25, 0); else M.makeScale(1e-4, 1e-4, 1e-4);
        tm.setMatrixAt(i, M); td.set([12.19, Math.max(1, t) * 2.591, 2.44], i * 3); ts[i] = rng() * 900;
        G.box(i * 14.2, 1.0, 0, 13.6, 0.5, 2.7, C.dark, { ch: 0, k: 1.5 });
        for (const e of [-5, 5]) G.box(i * 14.2 + e, 0.45, 0, 2.4, 0.7, 2.3, C.dark, { ch: 0, k: 0.9 });
      }
      for (let l = 0; l < 2; l++) { const x = NC * 14.2 + 6 + l * 23;
        G.box(x, 2.6, 0, 21, 3.6, 3.0, l ? C.gantry : C.tugBand, { ch: 0.08, k: 0.8 }); G.box(x, 0.5, 0, 20, 0.9, 2.6, C.dark, { ch: 0 }); G.box(x + 7.5, 4.7, 0, 4.5, 0.9, 2.9, C.grey, { ch: 0.1 }); }
      tg.setAttribute('aDim', new THREE.InstancedBufferAttribute(td, 3)); tg.setAttribute('aSeed', new THREE.InstancedBufferAttribute(ts, 1));
      tm.frustumCulled = false; train.add(tm, new THREE.Mesh(G.build(), steel)); train.children[1].frustumCulled = false;
      train.userData.len = NC * 14.2 + 52; }
    const trainLamp = lamps.add(0, 0, 0, cream, 7, 2.2), trainLamp2 = lamps.add(0, 0, 0, H('#ff3a2a'), 3, 1.4, 3.1, 0);
    await ctx.yield();

    // ----- water, boats, wakes -----
    const L = Water.waterLight(sky, look.seaSky || {});
    const ocean = Water.makeOcean({ rng, light: L, preset: 'calm', level: -2.5, radius: 3600, deep: look.seaDeep, scatter: '#4a6676', glint: 0.4, glitter: 0.8,
      ...(hasSun ? {} : { ambient: look.seaAmb }) });      // night water keeps a body colour: the sky model alone leaves it black
    scene.add(ocean.object);
    const NB = 5, tugMesh = new THREE.InstancedMesh(buildTug(rng, C), steel, NB); tugMesh.frustumCulled = false; scene.add(tugMesh);
    const wakeG = new THREE.BufferGeometry();
    wakeG.setAttribute('position', new THREE.Float32BufferAttribute([-11, 0.35, -11, -11, 0.35, 11, -100, 0.35, 11, -100, 0.35, -11], 3));
    wakeG.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 0, 1, 1, 1, 1, 0], 2)); wakeG.setIndex([0, 1, 2, 0, 2, 3]);
    const wakes = new THREE.InstancedMesh(wakeG, makeWakeMaterial(T), NB + 1); wakes.frustumCulled = false; wakes.renderOrder = 2; scene.add(wakes);
    wakes.material.uniforms.uCol.value.copy(sky.horizonColor).lerp(H('#ffffff'), 0.35).multiplyScalar(lookId === 'predawn' ? 0.5 : 0.95);
    const boats = [];
    for (let i = 0; i < NB; i++) boats.push({ ph: rng.range(0, TAU), off: rng.range(0, 900), l0: lamps.add(0, 0, 0, cream, 4, 1.4), l1: lamps.add(0, 0, 0, i % 2 ? H('#35ff7a') : H('#ff3a2a'), 3, 1.1) });
    const bp = { x: 0, z: 0, a: 0, s: 1 };
    // channel buoys off the berth, red and green by turns, each with its light: they nod in the chop
    const BUOYS = [[392, 118], [468, 124], [545, 117], [628, 96], [700, 104], [790, 92]], buoyC = [H('#b52a1c'), H('#1f7a48')];
    const buoyMesh = (() => { const G = new Geo(lcg(8821)), w = H('#ffffff');
      G.cyl([0, -0.5, 0], [0, 1.0, 0], 1.7, 1.5, 10, w, { k: 0.9 }); G.cyl([0, 1.0, 0], [0, 4.6, 0], 1.1, 0.35, 6, w, { caps: false }); G.cyl([0, 4.6, 0], [0, 5.5, 0], 0.55, 0.55, 6, w, { k: 1.15 });
      const m = new THREE.InstancedMesh(G.build(), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6 }), BUOYS.length); m.frustumCulled = false;
      BUOYS.forEach((b, i) => m.setColorAt(i, buoyC[i % 2])); return m; })();
    scene.add(buoyMesh);
    const buoyL = BUOYS.map((b, i) => lamps.add(b[0], 3.4, b[1], i % 2 ? H('#35ff7a') : H('#ff3a2a'), 5, 1.3, 2.6, i * 1.7));
    // the arriving ship off the east end, a tug at each quarter, a lit funnel plume
    const arrLamps = [], arr = buildArrival(rng, C, arrivalKind, HL.mosaic, arrLamps);
    const arrival = new THREE.Mesh(arr.geo, steel); arrival.position.set(1800, -2.5, ARZ); scene.add(arrival);
    const arrIdx = arrLamps.map((l) => lamps.add(0, 0, 0, l[3] ? sodium : cream, arrivalKind === 'cruise' ? 3.2 : 4.5, arrivalKind === 'cruise' ? 1.6 : 2.2));
    const arrTop = arr.tops.map((t) => lamps.add(0, 0, 0, cream, 6, 2.4));
    const smokeSun = { sunDir: sky.sunDirection.clone().setY(Math.max(0.12, sky.sunDirection.y)).normalize(), sunColor: hasSun ? '#ffc890' : '#6a7fa8' };
    const plume = fx.makeSmokeColumn({ rng: rng.fork('plume'), time: T, position: [1800, 40, ARZ], height: 64, radius: [2, 9], size: [8, 26], count: 70,
      color: lookId === 'predawn' ? '#2a3140' : '#4a4e58', colorTop: lookId === 'predawn' ? '#465066' : '#8a8f9c', opacity: hasSun ? 0.3 : 0.5, wind: [3.4, 0, 0.6], bend: 1.7, rim: 0.3, scatter: 0.25, ...smokeSun });
    scene.add(plume.object);
    await ctx.yield();

    // ----- far layer: banks, poplars, bridge, refinery and flare, anchored ships -----
    const farLamps = [], farInfo = {};
    const farMesh = new THREE.Mesh(buildFar(rng.fork('far'), sky, look, farLamps, farInfo), new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide }));
    farMesh.frustumCulled = false; scene.add(farMesh);
    await ctx.yield();
    // sea fog: ships at anchor close in on the sun side, of which only bridges, funnels and masts stand through the white floor
    if (look.fogLow) {
      const G = new Geo(lcg(5099)), r = lcg(2203), hz = new THREE.Color(), dv = new THREE.Vector3(); G.jit = 0.04;
      const spots = [[905, 200], [1010, 330], [1150, 170], [1290, 420], [1420, 250], [760, 400], [1560, 520]];
      spots.forEach(([x, z], i) => {
        dv.set(x - 600, 12, z).normalize(); sky.colorAt(dv, hz);
        const c = new THREE.Color('#1c2530').lerp(hz, 0.22 + 0.1 * r()), Lh = 70 + r() * 60, yaw = (r() - 0.5) * 0.7, cs = Math.cos(yaw), sn = Math.sin(yaw);
        const P = (lx, y, lz) => [x + lx * cs - lz * sn, y, z + lx * sn + lz * cs], top = 40 + r() * 9;
        G.beam(P(-Lh, 15, 0), P(Lh, 15, 0), 26, 9, c, { ch: 0.1, up: [0, 1, 0] });                         // hull, under the floor
        G.beam(P(-Lh + 16, 10, 0), P(-Lh + 16, top, 0), 13, 26, c, { ch: 0.06, w2: 11, h2: 24 });           // bridge island
        G.beam(P(-Lh + 16, top - 2.5, -19), P(-Lh + 16, top - 2.5, 19), 6, 2.2, c, { ch: 0.1, up: [0, 1, 0] });   // bridge wings
        G.cyl(P(-Lh + 16, top, 0), P(-Lh + 16, top + 13, 0), 1.1, 0.5, 5, c);
        G.beam(P(-Lh + 30, 12, 0), P(-Lh + 31.5, top - 6, 0), 6, 8, c, { ch: 0.25, w2: 4.6, h2: 6 });        // funnel
        for (const m of [-0.1, 0.45, 0.85]) { const mh = 34 + r() * 14, mx = Lh * m;
          G.cyl(P(mx, 12, 0), P(mx, mh, 0), 1.2, 0.6, 5, c); G.beam(P(mx, mh - 5, -6), P(mx, mh - 5, 6), 0.9, 0.9, c, { ch: 0, caps: false });
          if (i % 2 === 0) G.beam(P(mx, 26, 0), P(mx + 20, 36, 0), 1.1, 1.1, c, { ch: 0, caps: false }); }  // a derrick boom
        const q = P(-Lh + 16, top + 13.5, 0), q2 = P(Lh * 0.85, 49, 0);
        lamps.add(q[0], q[1], q[2], cream, 5, 2.2); lamps.add(q2[0], q2[1], q2[2], sodium, 4, 1.8, 0, 0);
      });
      const fm = new THREE.Mesh(G.build(), new THREE.MeshBasicMaterial({ vertexColors: true, fog: true })); fm.frustumCulled = false; scene.add(fm);
      await ctx.yield();
    }
    const lampCols = [cream, H('#ff4a30'), sodium];
    for (const l of farLamps) lamps.add(l[0], l[1], l[2], lampCols[l[4] || 0], 9 * l[3], 3.2 * l[3], l[4] === 1 ? 2.1 : 0, rng.range(0, TAU));
    const flareCol = H('#ff8a2a');
    const flareIdx = lamps.add(farInfo.flare[0], farInfo.flare[1], farInfo.flare[2], H('#ff8a2a'), 12, 46);
    const hazeIdx = lamps.add(0, 0, 0, H('#FFB65C'), look.haze, 720);
    // lamps mirrored in the basin: crane floods, the ship's deck lights, riding lights, the bridge towers, the flare, the arriving ship
    const stk = [];
    for (const c of A.cranes) { stk.push([c.x + OFF - 12.2, 21.75, -12, sodium, 1.5, 1.7]); stk.push([c.x + OFF + 12.2, 21.75, -12, sodium, 1.5, 1.7]); }
    const stkDeck = stk.length; for (let k = 0; k < 8; k++) stk.push([OFF - 390 + (3 + k * 3) * 13 + 6.5, 33.6, 60.5, sodium, 1.3, 1.5]);
    for (const sh of farInfo.ships) stk.push([sh[0], 26, sh[1], cream, 1.5, 0.75]);
    stk.push([3050, 211, 1500, lampCols[1], 1.6, 0.5], [4250, 211, 1500, lampCols[1], 1.6, 0.5], [farInfo.flare[0], farInfo.flare[1], farInfo.flare[2], flareCol, 2.4, 1.3]);
    const stkArr = stk.length; stk.push([1800, 40, ARZ, cream, 1.6, 1.2]);
    const streaks = makeStreaks(stk, T, -2.5, look.streak * (hasSun ? 0.6 : 1)); scene.add(streaks.mesh);

    await ctx.yield();
    // ----- life on the ship and the dolphins: flags, windsock, funnel smoke, whistle, cormorants -----
    const deco = new THREE.Group(); scene.add(deco);
    const lit = H(look.amb).multiplyScalar(4).add(sunCol.clone().multiplyScalar(0.25));
    const flagG = new THREE.PlaneGeometry(7, 4, 14, 3).translate(3.5, 0, 0);
    const flagM = makeClothMaterial(T, rng.pick(['#b8281e', '#1f4e79', '#d8d8d2']), rng.pick(['#e8e4d8', '#c8a41e', '#b8281e'])), sockM = makeClothMaterial(T, '#ff7a1e', '#f0ece4');
    flagM.uniforms.uLight.value.copy(lit); sockM.uniforms.uLight.value.copy(lit);
    const addCloth = (mat, x, y, z, sc, ry) => { const m = new THREE.Mesh(flagG, mat); m.position.set(x, y, z); m.scale.setScalar(sc); m.rotation.y = ry; m.frustumCulled = false; deco.add(m); };
    addCloth(flagM, A.bridgeTop.x + OFF, A.bridgeTop.y - 2.6, A.bridgeTop.z, 1.5, -2.0);
    addCloth(flagM, A.sternTip.x + OFF + 0.4, A.sternTip.y + 5.2, A.sternTip.z, 1.0, -2.0);
    addCloth(sockM, HL.lay.foremast[0] + OFF, HL.lay.foremast[1] - 1.2, HL.lay.foremast[2], 0.9, -2.0);
    { const G = new Geo(rng);                                                        // staffs on the bridge wings: house flag to port, windsock to starboard
      for (const sgn of [-1, 1]) { const wx = A.bridgeTop.x + OFF, wy = HL.lay.bridgeY + 2.8, wz = A.bridgeTop.z + sgn * 31;
        G.cyl([wx, wy, wz], [wx, wy + 8.5, wz], 0.12, 0.07, 5, C.white);
        addCloth(sgn < 0 ? flagM : sockM, wx, wy + 6.4, wz, sgn < 0 ? 1.1 : 1.0, -2.0); }
      if (rare) for (const tx of [246, 474]) { G.beam([tx, 0.8, 78], [tx, SHIPDECK, 64.6], 0.2, 0.2, C.white, { ch: 0, caps: false, k: 0.8 }); }   // tow lines to the straining tugs
      deco.add(new THREE.Mesh(G.build(), steel)); }
    // mirrors: the hull's dark flank and red boot-topping, the idle cranes' legs and sills, the quay wall; a radar that turns
    { const mirror = (quads) => { const mp = [], mu = [], mc = [], ma = [], mi = []; let nq = 0;
        for (const [x0, x1, z0, z1, c, a] of quads) {
          mp.push(x0, -2.16, z0, x1, -2.16, z0, x1, -2.16, z1, x0, -2.16, z1); mu.push(0, 0, 1, 0, 1, 1, 0, 1);
          for (let k = 0; k < 4; k++) { mc.push(c.r, c.g, c.b); ma.push(a); } mi.push(nq, nq + 2, nq + 1, nq, nq + 3, nq + 2); nq += 4; }
        const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); mg.setAttribute('uv', new THREE.Float32BufferAttribute(mu, 2));
        mg.setAttribute('color', new THREE.Float32BufferAttribute(mc, 3)); mg.setAttribute('aA', new THREE.Float32BufferAttribute(ma, 1)); mg.setIndex(mi);
        const m = new THREE.Mesh(mg, mirrorMat); m.frustumCulled = false; m.renderOrder = 2; return m; };
      const mirrorMat = makeMirrorMaterial(T);
      const hullD = HL.C.hull.clone().multiplyScalar(0.55).add(H(look.seaDeep).multiplyScalar(0.25)), bootC = HL.C.antifoul.clone().multiplyScalar(hasSun ? 0.9 : 0.5);
      const redC = HL.C.red.clone().multiplyScalar(hasSun ? 0.55 : 0.3), wallC = H('#39424c').multiplyScalar(hasSun ? 0.8 : 0.5);
      deco.add(mirror([[168, 540, 64.3, 104, hullD, 0.9], [176, 532, 64.3, 69.5, bootC, 0.6]]));
      const qs = [[560, QUAY.x1, 0.2, 9, wallC, 0.8]];
      for (const c of A.cranes) { const x = c.x + OFF; if (c.working) continue;
        for (const sx of [-13.5, 13.5]) qs.push([x + sx - 2.6, x + sx + 2.6, 0.4, 48, redC, 0.8]);
        qs.push([x - 15, x + 15, 0.4, 26, redC, 0.5]); }
      scene.add(mirror(qs)); }
    const radar = new THREE.Mesh(new THREE.BoxGeometry(7.5, 0.5, 0.7), new THREE.MeshStandardMaterial({ color: '#c8ced4', roughness: 0.6 }));
    radar.position.set(A.bridgeTop.x + OFF + 1.4, A.bridgeTop.y - 4.4, A.bridgeTop.z); deco.add(radar);
    const weedLight = H(look.amb).multiplyScalar(3.2).add(sunCol.clone().multiplyScalar(0.3)).add(sodium.clone().multiplyScalar(lookId === 'predawn' || lookId === 'dusk' ? 0.9 : 0.15));
    scene.add(makeWeeds(rng.fork('weeds'), T, weedLight));
    const funnelW = new THREE.Vector3(A.funnelTop.x + OFF, A.funnelTop.y, A.funnelTop.z), whistleW = new THREE.Vector3(A.whistle.x + OFF, A.whistle.y, A.whistle.z);
    const funnelSmoke = fx.makeSmokeColumn({ rng: rng.fork('funnel'), time: T, position: funnelW.toArray(), height: 55, radius: [1.6, 13], size: [5, 26], count: 54,
      color: '#3a3f4a', colorTop: '#727988', opacity: winter ? 0.75 : 0.5, wind: [-1.2, 0, 0.5], bend: 0.7, rim: 0.4, scatter: 0.5, ...smokeSun });
    scene.add(funnelSmoke.object);
    const whistle = fx.makeSmokeColumn({ rng: rng.fork('whistle'), time: T, position: whistleW.toArray(), height: 38, radius: [0.5, 9], size: [2.5, 18], count: 46, rate: 0.16,
      color: '#cfd8e2', colorTop: '#f2f5f8', shadowColor: '#7a8898', ambient: '#3a4658', opacity: 0, wind: [-2.2, 0, 0.8], bend: 1.1, rim: 0.6, scatter: 0.7, ...smokeSun });
    scene.add(whistle.object);
    const corm = new THREE.InstancedMesh(buildCormorant(rng, C), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.55 }), 6); corm.frustumCulled = false; scene.add(corm);
    const corms = [];
    for (let i = 0; i < 6; i++) { const d = dolphins[i >> 1], a = d[2] + (i & 1) * 2.6 + 0.8; corms.push({ x: d[0] + Math.cos(a) * 1.5, y: 3.7, z: d[1] + Math.sin(a) * 1.5, yaw: rng.range(-0.5, 0.5), ph: rng.range(0, TAU), sc: rng.range(1.6, 2.0) }); }

    // gulls sitting out the shift on the stepped box tops east of the ridden trolley (a private stream: the seeded layout stays)
    const NSG = 40, sgR = lcg(6151), sgs = [];
    { const cand = HL.shipCols.filter((c) => c.x + OFF > 468 && c.x + OFF < 506 && c.z > 8 && c.z < 60);
      for (let i = 0; i < NSG && cand.length; i++) { const c = cand[Math.floor(sgR() * cand.length)];
        sgs.push({ x: c.x + OFF + (sgR() - 0.5) * 10.5, y: c.y + c.t * 2.591 + 0.02, z: c.z + (sgR() - 0.5) * 1.5, yaw: -0.4 + sgR() * 1.3, ph: sgR() * TAU, sc: 1.7 + sgR() * 0.5 }); } }
    const sgMesh = new THREE.InstancedMesh(buildSeatedGull(lcg(77)), fillMat(new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, emissive: hasSun ? H('#000000') : sodium.clone().multiplyScalar(0.09).add(H('#31425e').multiplyScalar(0.5)) })), Math.max(1, sgs.length)); sgMesh.frustumCulled = false; deco.add(sgMesh);
    await ctx.yield();
    // ----- gulls, backlit, in loose clouds over the deck, the yard, the bow and the tug -----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene, hasSun ? undefined : { ground: sodium.clone().multiplyScalar(lookId === 'predawn' ? 1.5 : 1.1), sky: H('#8fa6d0').multiplyScalar(lookId === 'predawn' ? 0.8 : 1.0) }) });
    // (flock cure: the gulls' preset wander, taken when none is handed, swings a bird 7.5 m to the side, 2.5 m up and down and 4 m along, about a place dealt by
    // a bell curve with no bound, and eight of these nine calls could so put a gull on the lens. Each of the eight now hands the kit a small wander of its own
    // (two fifths of the preset's), a bound of three scatters on its deal, and keepClear with the flown path and each: the courses stay where they were laid and
    // only a gull whose own reach would come within 2 m of the flown line is moved, by what it alone lacks. The far loop over the roads (the fourth) could not
    // come within 25 m and is as it was. Each call stands in a build step of its own; the path is handed in steps of 2 m, its sag counted. The three wheels and
    // the escort whose make was the long step of a cold page are made by the kit's stepped maker: the same flock to the bit, its clearing handed back in slices)
    const off = { wander: [2, 1, 1.6, 0.35], maxSigma: 3, keepClear: { path, each: true, step: 2 } };
    const gullOpts = (center, radius, count, spreadY = 8, near = off) => ({ rng, species: 'gulls', count: Math.max(6, Math.round(count * density)), center, radius, lod: 'low', size: 1.7,
      spread: [radius * 0.75, spreadY, radius * 0.75], ...near });
    const gulls = (...a) => fauna.add(F.makeFlock(gullOpts(...a))), gullsInSlices = async (...a) => fauna.add(await F.makeFlockAsync(gullOpts(...a), ctx.yield));
    await gullsInSlices([548, 40, 28], 46, 90); await ctx.yield(); await gullsInSlices([770, 36, -140], 95, 90, 12); await ctx.yield(); await gullsInSlices([604, 24, 72], 40, 56); await ctx.yield(); gulls([790, 9, 172], 60, 26, 4, {}); gulls([451, 17, -84], 16, 34, 4); await ctx.yield();
    gulls([522, 52, 30], 20, 48, 5); await ctx.yield();
    fauna.add(F.makeFlock({ rng, species: 'gulls', count: Math.max(10, Math.round(46 * density)), lod: 'high', size: 1.5, spread: [18, 7, 28], duration, ...off,
      cross: { path, u: (uTop + uEnd) / 2, lead: 46, span: 190, angle: 78, side: 1, height: 6, rise: 16, duration } })); await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng, species: 'gulls', count: Math.round(13 * density), lod: 'high', size: 1.6, ...off, along: { path, side: -12, up: 5, lead: 60, from: uBow - 0.02, to: 1.08, drift: 8 } }, ctx.yield)); await ctx.yield();
    gulls([372, 15, 112], 30, 30, 5);
    await ctx.yield();
    // vapour lifting off the wet asphalt: in the canyon and down the nave
    const mistOpt = { time: T, color: hasSun ? '#c9b7a0' : '#8fa0b8', flatten: 0.5, ...smokeSun };
    const mistA = fx.makeMist({ rng: rng.fork('mistA'), ...mistOpt, count: 26, center: [450, 2.6, -92], area: [13, 4, 130], size: [7, 13], opacity: look.fogLow ? 0.25 : 0.2, drift: look.fogLow ? [0.4, 0, 3.2] : [0.3, 0, 2.4] });
    const mistB = fx.makeMist({ rng: rng.fork('mistB'), ...mistOpt, count: 54, center: [800, 3, -34], area: [470, 5, 80], size: [14, 30], opacity: look.fogLow ? 0.26 : 0.12, drift: look.fogLow ? [3.2, 0, 0.8] : [1.6, 0, 0.4] });
    scene.add(mistA.object, mistB.object);

    await ctx.yield();
    // ----- air: drifting motes, rain or mist -----
    const air = look.particles === 'rain' ? fx.makeParticles({ rng: rng.fork('air'), preset: 'rain', time: T, count: Math.round(5600 * detail), stretch: 0.041, size: [0.012, 0.034], opacity: 0.25, intensity: 1.3, velocityRandom: [0.9, 9, 0.9], colors: ['#ffc888', '#9fb6d6', '#cfd9e6'] })
      : look.particles === 'mist' ? fx.makeParticles({ rng: rng.fork('air'), preset: 'dust', time: T, count: Math.round(2600 * detail), size: [0.02, 0.06], opacity: 0.55, colors: ['#ffe2b0', '#ffd08a', '#fff2dc'], box: [50, 30, 50], near: [1.5, 6] })
        : fx.makeParticles({ rng: rng.fork('air'), preset: 'dust', time: T, count: Math.round(1900 * density), box: [56, 34, 56], size: [0.025, 0.08], opacity: 0.6, colors: ['#ffd29a', '#b9c8da', '#fff0d0'], near: [1.5, 6] });
    scene.add(air.object);

    await ctx.yield();
    // ----- sea fog look: low banks (1 to 9 m) that lie beyond 230 m of the eye, in patches, thicker toward the sun -----
    let deck = null;
    if (look.fogLow) {
      // six sheets over the top 10 m: low sheets are nearly solid, the upper ones exist only where a billow stands that tall,
      // so the floor has relief (sun-warmed crests, cool troughs) and no hard lid; crane shadows lie across it
      const NL = 6, parts = [], lay = [], di = [];
      for (let i = 0; i < NL; i++) { const y = look.bankTop - 8 + i * 1.6; parts.push(-4500, y, -4500, 4500, y, -4500, 4500, y, 4500, -4500, y, 4500); lay.push(i / (NL - 1), i / (NL - 1), i / (NL - 1), i / (NL - 1));
        di.push(i * 4, i * 4 + 2, i * 4 + 1, i * 4, i * 4 + 3, i * 4 + 2); }
      const dg = new THREE.BufferGeometry();
      dg.setAttribute('position', new THREE.Float32BufferAttribute(parts, 3)); dg.setAttribute('aLay', new THREE.Float32BufferAttribute(lay, 1)); dg.setIndex(di);
      deck = new THREE.Mesh(dg, new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, side: THREE.DoubleSide,
        uniforms: { uTime: T, uCol: { value: H('#e2ddd4') }, uCool: { value: H('#5f7a9f') }, uSunC: { value: H('#fff0d2') }, uHor: { value: sky.horizonColor.clone() }, uSunDir: { value: sky.sunDirection },
          uCr: GU.uCr, uTanE: GU.uTanE, uUnder: { value: 0 } },
        vertexShader: 'attribute float aLay; varying vec3 vW; varying float vLay; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vLay = aLay; gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: /* glsl */`
          uniform float uTime, uTanE, uUnder; uniform vec3 uCol, uCool, uSunC, uHor, uSunDir; uniform float uCr[12]; varying vec3 vW; varying float vLay;
          ${GLSL_N}
          float billow(vec2 p){ return 0.62 * fb(p * 0.0052 + uTime * vec2(0.03, 0.008)) + 0.38 * fb(p * 0.021 - uTime * vec2(0.02, 0.045) + 3.1); }
          void main(){
            vec2 p = vW.xz; float b = billow(p), bs = billow(p + vec2(55.0, 0.0));
            float wisp = fb(p * 0.085 + uTime * vec2(0.09, 0.03));                 // close-to texture: wisps and ragged crests
            b += 0.1 * (wisp - 0.5) + 0.05 * (vn(p * 0.31 - uTime * 0.11) - 0.5);
            float h = b * 2.5 - 0.72;                                       // billow height in sheet units: about -0.2 .. 1.3
            float a = smoothstep(vLay - 0.3, vLay + 0.08, h);
            vec3 dv = vW - cameraPosition; float d = length(dv.xz);
            a *= smoothstep(0.4, 5.0, abs(dv.y)) * mix(0.8, 0.6, vLay);
            // banks, not a floor: patches that lie well away from the eye, thicker toward the sun and far out, open water between
            float sunw = dot(normalize(dv.xz + vec2(1e-4)), normalize(uSunDir.xz + vec2(1e-4)));
            float cov = smoothstep(0.5, 0.66, fb(p * 0.0017 + vec2(uTime * 0.004, 7.3)) + 0.1 * max(sunw, 0.0) + 0.16 * smoothstep(900.0, 2600.0, d));
            a *= cov * smoothstep(230.0, 620.0, d) * (1.0 - 0.75 * smoothstep(-40.0, -110.0, p.y) * (1.0 - smoothstep(500.0, 900.0, d)));
            a = mix(a, 0.6, smoothstep(1500.0, 3600.0, d) * (1.0 - 0.6 * vLay));
            // seen from underneath the sheets are only a far veil: nothing cuts a line across the crane legs or the water
            a *= mix(1.0, smoothstep(80.0, 360.0, d) * 0.85, uUnder);
            float lit = clamp(0.4 + (b - bs) * 16.0, 0.0, 1.0);
            vec3 c = mix(uCool, uCol, lit * (0.35 + 0.65 * vLay)) * (0.56 + 0.4 * vLay) * mix(0.45, 1.15, smoothstep(0.3, 0.7, b)) * (0.8 + 0.4 * wisp);
            // long sun-warmed streaks lying toward the sun, and a bright path under it
            float sunward = max(sunw, 0.0);
            float stk = smoothstep(0.42, 0.68, fb(vec2(p.x * 0.0013 - uTime * 0.012, p.y * 0.012 + 5.0)));
            c = mix(c, uSunC * 1.12, stk * (0.12 + 0.4 * sunward * sunward * sunward) * (0.5 + 0.5 * vLay));

            // shadows of the crane line thrown west across the fog top by the low sun
            float sh = 0.0, drop = max(54.0 - vW.y, 0.0) / max(uTanE, 0.02), dl = max(58.0 - vW.y, 0.0) / max(uTanE, 0.02);
            float zb = smoothstep(-6.0, 2.0, p.y) * (1.0 - smoothstep(64.0, 74.0, p.y));
            float zl = max(1.0 - smoothstep(1.5, 4.5, abs(p.y + 5.0)), 1.0 - smoothstep(1.5, 4.5, abs(p.y + 35.0)));
            for (int i = 0; i < 12; i++) {
              float cx = uCr[i];
              sh = max(sh, zb * (1.0 - smoothstep(4.0, 11.0, abs(p.x - (cx - drop)))));
              sh = max(sh, zl * step(p.x, cx + 15.0) * smoothstep(cx - dl - 30.0, cx - dl + 10.0, p.x) * 0.8);
            }
            c *= 1.0 - 0.6 * sh * (gl_FrontFacing ? 1.0 : 0.0);
            if (!gl_FrontFacing) c *= 0.82;
            c = mix(c, uSunC * vec3(1.0, 0.86, 0.62), 0.75 * pow(max(dot(normalize(dv), uSunDir), 0.0), 4.0));
            c = mix(c, uHor, smoothstep(1500.0, 4300.0, d));
            gl_FragColor = vec4(c, a);
          }`,
      }));
      deck.frustumCulled = false; deck.renderOrder = 3; scene.add(deck);
    }
    // ----- the low sun's rays: a fan of soft shafts round the sun, standing far behind everything, so the crane frames, the
    // booms and the ship's upper works cut it into beams; it turns slowly and breathes -----
    let rays = null;
    if (hasSun) {
      rays = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
        uniforms: { uTime: T, uCol: { value: H(look.sky.sunColor || '#FFE2A8').lerp(sodium, 0.3).multiplyScalar(look.rays ?? 0.2) } },
        vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: /* glsl */`
          uniform float uTime; uniform vec3 uCol; varying vec2 vQ;
          ${GLSL_N}
          void main(){
            float r = length(vQ); vec2 d = vQ / max(r, 1e-4);
            float s = 0.6 * vn(d * 4.2 + vec2(uTime * 0.013, 3.0)) + 0.4 * vn(d * 10.5 - vec2(uTime * 0.021, 1.0));
            float shaft = smoothstep(0.42, 0.78, s);
            float fall = exp(-r * 3.4) * (1.0 - smoothstep(0.62, 1.0, r)) * smoothstep(0.0, 0.07, r);
            float low = 1.0 - 0.75 * smoothstep(0.0, -0.25, vQ.y);                      // weaker below the horizon, over the water
            gl_FragColor = vec4(uCol * (0.25 + 1.5 * shaft) * fall * low, 1.0);
          }`,
      }));
      rays.frustumCulled = false; rays.renderOrder = 1; rays.scale.setScalar(1900); scene.add(rays);
    }
    lamps.finish(); scene.add(lamps.mesh);
    await ctx.yield();

    // ----- per-frame -----
    const cp = new THREE.Vector3(), cw = new THREE.Vector3(), poiV = new THREE.Vector3(), poiW = new THREE.Vector3(), tr = { x: 0, z: 0, a: 0 }, sm = (t) => t * t * (3 - 2 * t);
    const DEG = Math.PI / 180, boomMax = HL.boomMax;
    const boatPose = (i, time, dz, o) => {
      const b = boats[i]; o.s = 1;
      if (rare && i < 2) { o.x = (i ? 474 : 246) + Math.sin(time * 0.31 + b.ph) * 1.5; o.z = 64 + dz + 27 + Math.sin(time * 0.23 + b.ph) * 0.5; o.a = -Math.PI / 2 + Math.sin(time * 0.17 + b.ph) * 0.06; return; }
      if (i === 0) { o.x = 652 - (tugU - uBow) * 430 + 3 * Math.sin(time * 0.15 + b.ph); o.z = 66 + 26 * (uBow - tugU) + 2.5 * Math.sin(time * 0.11 + b.ph); o.a = Math.PI + 0.06 + 0.03 * Math.sin(time * 0.11 + b.ph); }
      else if (i === 1) { o.x = 420 + (tugU - uTurn) * 850 + 3 * Math.sin(time * 0.13 + b.ph); o.z = 103 + 2 * Math.sin(time * 0.09 + b.ph); o.a = -0.04 * Math.cos(time * 0.09 + b.ph); }
      else if (i === 2) { o.x = 1560 - ((time * 13 + b.off * 2) % 2300); o.z = 128 + 10 * Math.sin(time * 0.07 + b.ph); o.a = Math.PI; o.s = 0.55; }
      else { o.x = arrival.position.x + 96; o.z = arrival.position.z + (i === 3 ? -1 : 1) * (arr.B / 2 + 9); o.a = Math.PI + (i === 3 ? -0.12 : 0.12); }
    };
    let tugU = 0;
    function update(dt, time, camera, u) {
      T.value = time; tugU = u;
      path.pointAt(u, cp);
      // the sun climbs; shadows shorten; water glints follow
      const el = mix(look.sunEl[0], look.sunEl[1], u) * DEG;
      sky.sunDirection.set(Math.cos(el), Math.sin(el), 0);
      GU.uTanE.value = Math.tan(Math.max(el, 1.6 * DEG));
      if (hasSun) L.sunDir.copy(sky.sunDirection);
      // the flood wave: off toward the sunrise (dawn), on from the east (dusk), or steady
      if (look.floodMode === 'off') front.set(mix(60, 1180, sat((u - 0.15) / 0.27)), 1);
      else if (look.floodMode === 'wave-on') front.set(mix(1180, 40, sat((u - 0.1) / 0.3)), 1);
      else front.set(-1e5, 1);
      // hero: boom wave, the ride under crane 5's spreader, the rare salute
      hero.setProgress(waveAt(u) / 40);
      hero.setCycle(5, Math.max(0, 3.19 + (u - uTop) / (uEnd - uTop) * 0.46));          // crane 6's box flies out and sinks into a cell during the trolley run
      // at the foot the spreader hangs 13 m ahead and a little higher, so the look up through the frame has it whole; it is overhead by the top
      const lead = 13 * (1 - sstep(uFoot + 0.022, uFoot + 0.05, u));
      if (u < uEnd) hero.setRide(Math.min(60, Math.max(-57.5, cp.z + lead)), Math.min(48.4, cp.y + 5.2 + 0.5 * lead) + (u < uFoot ? 24 * Math.pow(1 - u / uFoot, 1.4) : 0)); else hero.setRide(null);
      let dz = 0;
      if (rare) {
        hero.setSalute(sstep(uEnd + 0.015, uEnd + 0.06, u));
        for (let i = 0; i < 6; i++) hero.setBoom(i, boomMax * 0.94 * sm(sat((u - uEnd - 0.06 - i * 0.008) / 0.2)));
        dz = 19 * sstep(uEnd - 0.03, 0.92, u);
        hero.setShipOffset(dz); deco.position.z = dz;
        for (let k = 0; k < 8; k++) streaks.move(stkDeck + k, OFF - 390 + (3 + k * 3) * 13 + 6.5, 33.6, 60.5 + dz);
        funnelSmoke.uniforms.uBase.value.z = funnelW.z + dz; whistle.uniforms.uBase.value.z = whistleW.z + dz;
        if (whistle.uniforms.uOpacity) whistle.uniforms.uOpacity.value = 0.85 * sstep(uEnd - 0.06, uEnd, u) * (1 - sstep(0.8, 0.95, u));
      }
      hero.update(dt, time, camera);
      // straddle carriers
      for (let i = 0; i < NSC; i++) {
        const s = scs[i]; let z;
        if (s.hero) z = zPass - (u - uPass) * duration * 6.5 - Math.sin(time * 0.6) * 0.4;
        else z = -232 + 132 * Math.sin(time * s.rate + s.ph);
        M.makeTranslation(s.x, 0, z); scMesh.setMatrixAt(i, M);
        if (s.hero || s.box) setBox(i, s.x, 9.2, z, Math.PI / 2);
        if (s.hero) GU.uHead.value.y = z - 14;
        lamps.move(s.l0, s.x - 4.7, 15.4, z + 4.2); lamps.move(s.l1, s.x + 4.7, 15.4, z - 4.2); lamps.move(s.l2, s.x + 2.6, 12.0, z + 6.7);
      }
      scMesh.instanceMatrix.needsUpdate = true;
      // yard gantries and their trolleys
      for (let j = 0; j < 4; j++) {
        const g = rmgs[j], z = -230 + 112 * Math.sin(time * g.rate + g.ph), tx = 7 * Math.sin(time * 0.19 + g.ph * 2.3);
        M.makeTranslation(g.x, 0, z); rmgMesh.setMatrixAt(j, M); M.makeTranslation(g.x + tx, 0, z); rmgTro.setMatrixAt(j, M);
        setBox(NSC + NTR + j, g.x + tx, 12.55, z, Math.PI / 2);
        lamps.move(g.l0, g.x + 9.4, 28.2, z); lamps.move(g.l1, g.x + tx, 22.2, z + 2.8);
      }
      rmgMesh.instanceMatrix.needsUpdate = true; rmgTro.instanceMatrix.needsUpdate = true;
      // trucks
      for (let i = 0; i < NTR; i++) {
        const t = trucks[i]; truckPose(t, time, tr);
        Q.setFromAxisAngle(YA, tr.a); M.compose(V.set(tr.x, 0, tr.z), Q, S1); trMesh.setMatrixAt(i, M);
        if (t.box) setBox(NSC + i, tr.x, 1.5, tr.z, tr.a);
        lamps.move(t.l, tr.x + 6.6 * Math.cos(tr.a) + Math.sin(tr.a), 2.35, tr.z - 6.6 * Math.sin(tr.a) + Math.cos(tr.a));
      }
      trMesh.instanceMatrix.needsUpdate = true; yard.instanceMatrix.needsUpdate = true;
      // train
      const tl = train.userData.len, tx0 = -1700 + ((time * 7 + 1150) % 3100);
      train.position.x = tx0; lamps.move(trainLamp, tx0 + tl + 0.5, 3.4, -420); lamps.move(trainLamp2, tx0 - 7, 2.6, -420);
      // arriving ship, boats, wakes
      const ax = 1420 + 400 * Math.exp(-time / 80), ab = Math.sin(time * 0.35) * 0.25;
      arrival.position.set(ax, -2.5 + ab, ARZ);
      for (let i = 0; i < arrIdx.length; i++) { const l = arrLamps[i]; lamps.move(arrIdx[i], ax + l[0], l[1] - 2.5, ARZ + l[2]); }
      for (let i = 0; i < arrTop.length; i++) { const l = arr.tops[i]; lamps.move(arrTop[i], ax + l[0], l[1], ARZ + l[2]); }
      { const f = arr.tops[arr.tops.length - 1]; plume.uniforms.uBase.value.set(ax + f[0], f[1] - 2, ARZ + f[2]); streaks.move(stkArr, ax + arr.tops[0][0], arr.tops[0][1], ARZ); }
      for (let i = 0; i < NB; i++) {
        boatPose(i, time, dz, bp);
        const bob = -2.5 + 0.18 * Math.sin(time * 0.9 + i * 2.1), b = boats[i];
        E.set(0.03 * Math.sin(time * 0.8 + i), bp.a, 0.025 * Math.sin(time * 1.1 + i * 1.7), 'YXZ'); Q.setFromEuler(E);
        M.compose(V.set(bp.x, bob, bp.z), Q, S1.set(bp.s, bp.s, bp.s)); tugMesh.setMatrixAt(i, M);
        Q.setFromAxisAngle(YA, bp.a); const ws = rare && i < 2 ? 1.5 : bp.s * (i === 2 ? 1.7 : 1);
        M.compose(V.set(bp.x, -2.5, bp.z), Q, S1.set(ws, 1, ws * (i === 2 ? 0.6 : 1))); wakes.setMatrixAt(i, M);
        const ca = Math.cos(bp.a), sa = Math.sin(bp.a);
        lamps.move(b.l0, bp.x + 3 * ca * bp.s, bob + 14 * bp.s, bp.z - 3 * sa * bp.s); lamps.move(b.l1, bp.x + (3 * ca + 3 * sa) * bp.s, bob + 9.4 * bp.s, bp.z + (-3 * sa + 3 * ca) * bp.s);
      }
      S1.set(1, 1, 1);
      for (let i = 0; i < BUOYS.length; i++) { const b = BUOYS[i];
        E.set(0.09 * Math.sin(time * 1.1 + i * 2.3), i, 0.08 * Math.sin(time * 0.83 + i * 1.3)); Q.setFromEuler(E);
        M.compose(V.set(b[0], -2.5 + 0.2 * Math.sin(time * 0.9 + i * 1.9), b[1]), Q, S1); buoyMesh.setMatrixAt(i, M); }
      buoyMesh.instanceMatrix.needsUpdate = true;
      Q.setFromAxisAngle(YA, Math.PI); M.compose(V.set(ax + 60, -2.5, ARZ), Q, cp.set(3.2, 1, 3.6)); wakes.setMatrixAt(NB, M);
      path.pointAt(u, cp);
      tugMesh.instanceMatrix.needsUpdate = true; wakes.instanceMatrix.needsUpdate = true;
      radar.rotation.y = time * 2.4;
      // cormorants shiver and shuffle
      for (let i = 0; i < 6; i++) {
        const c = corms[i];
        E.set(0.07 * Math.sin(time * 1.3 + c.ph) + 0.05 * Math.sin(time * 9 + c.ph) * Math.max(0, Math.sin(time * 0.5 + c.ph * 3)), c.yaw + 0.25 * Math.sin(time * 0.21 + c.ph), 0.05 * Math.sin(time * 0.9 + c.ph * 2), 'YXZ');
        Q.setFromEuler(E); M.compose(V.set(c.x, c.y, c.z), Q, S1.set(c.sc, c.sc, c.sc)); corm.setMatrixAt(i, M);
      }
      for (let i = 0; i < sgs.length; i++) {                 // seated gulls: heads turn, a shuffle now and then, a ruffle in the wind
        const c = sgs[i], fid = Math.max(0, Math.sin(time * 0.37 + c.ph * 5.0) - 0.8) * 5;
        E.set(0.05 * Math.sin(time * 1.7 + c.ph) + 0.12 * fid * Math.sin(time * 11 + c.ph), c.yaw + 0.5 * Math.sin(time * 0.33 + c.ph) + 0.25 * Math.sin(time * 0.9 + c.ph * 2.0), 0.06 * Math.sin(time * 2.3 + c.ph * 3.0), 'YXZ');
        Q.setFromEuler(E); M.compose(V.set(c.x, c.y + 0.05 * fid, c.z), Q, S1.set(c.sc, c.sc, c.sc)); sgMesh.setMatrixAt(i, M);
      }
      sgMesh.instanceMatrix.needsUpdate = true;
      S1.set(1, 1, 1); corm.instanceMatrix.needsUpdate = true;
      // refinery flare flicker, gold haze toward the sun
      lamps.setColor(flareIdx, flareCol, 10 + 2.5 * Math.sin(time * 5.1) + 1.8 * Math.sin(time * 8.7 + 1.3));
      cw.setFromMatrixPosition(camera.matrixWorld);          // the camera behind a portal has its world matrix set directly
      lamps.move(hazeIdx, cw.x + sky.sunDirection.x * 460, cw.y + sky.sunDirection.y * 460 + 4, cw.z);
      lamps.mat.uniforms.uTime.value = time; lamps.touch();
      if (rays) { rays.position.set(cw.x + sky.sunDirection.x * 3000, cw.y + sky.sunDirection.y * 3000, cw.z + sky.sunDirection.z * 3000); rays.quaternion.setFromRotationMatrix(camera.matrixWorld); }
      // sea fog: dense below the deck, clear above it
      if (deck) {
        scene.fog.density = mix(look.fogLow, look.density, sstep(look.fogTop - 11, look.fogTop + 3, cw.y));
        deck.position.set(cw.x, 0, cw.z);
        deck.material.uniforms.uUnder.value = 1 - sstep(look.bankTop + 1, look.bankTop + 9, cw.y);   // in or under the fog the floor near us thins to veils
      }
      sky.update(dt, time, camera); rig.update(dt, time, camera); ocean.update(dt, time, camera);
      fauna.update(dt, time, camera, u);
      plume.update(dt, time, camera); funnelSmoke.update(dt, time, camera); whistle.update(dt, time, camera); air.update(dt, time, camera); mistA.update(dt, time, camera); mistB.update(dt, time, camera);
    }
    { const c0 = new THREE.PerspectiveCamera(62, ctx.aspect || 1.78, 0.3, 8000); path.pointAt(0, c0.position); c0.lookAt(450, 2.5, 0); c0.updateMatrixWorld(); update(0, 0, c0, 0); }
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    return {
      scene, path, duration,
      // linger on the hoist and the trolley (the reveal) and on the look back at the herd, hurry the swoop, slow over the crest
      // of the climb where the necks stand in a fan, and fly the dive and the last tenth at the average speed
      pace: (u) => { const a = sstep(uTop - 0.05, uTop, u), h = sstep(uFoot - 0.03, uFoot + 0.012, u) * (1 - a), t = sstep(uQuay - 0.03, uQuay + 0.02, u) * (1 - sstep(uEnd - 0.01, uEnd + 0.04, u));
        return 1 - 0.55 * h - 0.3 * t + 0.14 * sstep(uEnd + 0.03, uEnd + 0.08, u) * (1 - sstep(uBow - 0.03, uBow + 0.04, u)) - 0.32 * sstep(uTurn - 0.05, uTurn - 0.01, u) * (1 - sstep(uEast - 0.01, uEast + 0.03, u))
          - 0.27 * sstep(uA, uA + 0.05, u) * (1 - sstep(uC - 0.01, uC + 0.04, u)); },
      title: look.title + (rare ? ': Casting Off' : ''),
      ride: 'none',
      camera: { fov: 62, near: 0.3, far: 8000, lookAhead: 24, sway: 0.9, bank: 0.12 },
      pois: [
        { at: [451, 33, -6], from: uFoot - 0.035, to: uFoot + 0.04, weight: 0.85, fade: 0.3 },   // up through crane 5 from the canyon mouth: spreader and trolley overhead between the legs
        { at: look.poi, from: uFoot + 0.02, to: uG0 + 0.03, weight: 0.8, fade: 0.14 },      // the rising booms and the sun, from the hoist and the trolley
        { at: herdGaze, from: uG0, to: uTurn + 0.012, weight: 1, fade: 0.12 },   // the orbit: the gaze comes round by the south to the lowered booms over the hull and holds the herd whole
        { at: (time, u) => { path.pointAt(u, poiW); return poiW.set(poiW.x + 80, poiW.y + 17, poiW.z - 20); }, from: uEast + 0.01, to: uBow - 0.05, weight: 0.5, fade: 0.3 },    // down the flank: boom ends overhead, the idle herd lifting its necks beyond the bow
        { at: [640, 12, 78], from: uBow - 0.11, to: uBow + 0.02, weight: 0.5, fade: 0.3 },        // the bow and the cormorants
        { at: (time, u) => { path.pointAt(u, poiV); return poiV.set(poiV.x + 150, 84, 8); }, from: uBow - 0.01, to: uCrest - 0.005, weight: 0.6, fade: 0.25 },
        { at: [778, 46, -20], from: uCrest - 0.05, to: uCrest + 0.035, weight: 0.62, fade: 0.3 },      // at the crest: crane 9 near and large, its frame and machinery, the yard beyond   // the necks ahead, rising against the sun
        { at: [900, 9, -20], from: uCrest + 0.02, to: 1, weight: 0.45, fade: 0.2 },
      ],
      portal: { shape: 'circle', radius: 8.2, color: look.portal, glow: 1.25 },
      post: {
        exposure: look.exposure,
        bloom: { strength: 0.46, radius: 0.7, threshold: 0.95 },
        grade: { saturation: look.grade.saturation, contrast: 1.06, tint: look.grade.tint, shadowTint: look.grade.shadowTint, vignette: 0.36, grain: 0.03, aberration: 0 },
      },
      update,
      dispose() { sky.dispose?.(); hero.dispose?.(); },
    };
  },
};
