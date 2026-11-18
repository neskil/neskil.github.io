// THE HAIL CATHEDRAL
// A vertical ascent as a newborn hailstone, in three culled acts that hand over inside thick cloud:
//   act one   low over streaming wheat under the turning wall cloud of a supercell (herd, headlights, swifts, rain);
//   act two   the updraft nave (hero: src/parts/hail-cathedral.js): the camera spirals up while the vault is slid
//             down past it, so 900 m of real climb plays as the 2.7 km of the nave at about 110 m/s; the Great
//             Illumination is keyed to u at mid-climb;
//   act three above the anvil: cobalt sky, a rippling cream plain, sprites and a jet in the east, and the portal
//             eclipsing the low sun inside its 22-degree halo.
// Variation by seed (and ctx.vary): hour (afternoon, dawn, night), season / storm type (ripe, spring, stubble and
// dust, dry sculpted storm), the cast (bison, pronghorn or horses; swifts or a kettle of hawks; research aircraft
// or weather balloon), the handedness of the climb, and the rare gigantic jet.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath } from '../kit/core.js';
import { makeSky, makeCloudField, skyDirection } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/hail-cathedral.js';

const DEG = Math.PI / 180;
const PALETTE = ['#1d2e2c', '#2b2547', '#6a5aa8', '#9fe0d0', '#0b1c52', '#fff3da', '#ff5a3c'];
const DOME_H = 330, DOME_R = 760;                    // the overshooting dome: a hill of cloud on the anvil, about 3 km across
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };

const HOURS = {
  afternoon: {
    slit: '#e8a23c', haze: '#7a5a30', amb1: '#a9b8a4', gloom: '#3c5a4a', under: '#1d2e2c', lowSun: '#ffcf8a', sunI: 1.0,
    sky: { preset: 'sunset', zenith: '#020618', mid: '#0b1c52', horizon: '#1f3a8c', ground: '#16224e', scatterColor: '#ffa62c', scatter: 0.38, scatterPow: 9, scatterHigh: 0.02, scatterFall: 5.5, sunGlow: 0.7, stars: 0.3, sunColor: '#fff0d0' },
    anvilLit: '#fff0d2', anvilShade: '#1c3480', anvilHaze: '#2f4c9c', halo: '#fff4e0', portal: '#fff3da', spriteGain: 1.0, wallGain: 1.0, cream: 0.8,
    pearl: '#6f7498', creamCol: '#fff3da', plum: '#3d3a5c',
  },
  dawn: {
    slit: '#f08a6a', haze: '#7c4f48', amb1: '#aeaab0', gloom: '#3d5350', under: '#1f2c30', lowSun: '#ffb89a', sunI: 0.9,
    sky: { preset: 'dawn', zenith: '#02030e', mid: '#191c5a', horizon: '#6a5aa8', ground: '#33305c', scatterColor: '#ff8f7a', scatter: 0.7, stars: 0.28, sunColor: '#ffe0c8' },
    anvilLit: '#ffd0b0', anvilShade: '#4a4692', anvilHaze: '#7c6aae', halo: '#ffe6d8', portal: '#ffd9c4', spriteGain: 1.15, wallGain: 1.0, cream: 0.78,
    pearl: '#b88aa2', creamCol: '#ffc4a2', plum: '#4c3154',
  },
  night: {
    slit: '#7f9cf0', haze: '#33466e', amb1: '#8098bc', gloom: '#3f6a64', under: '#182a2c', lowSun: '#8aa2e0', sunI: 0.45,
    sky: { preset: 'night', zenith: '#00010a', mid: '#040a24', horizon: '#16264e', ground: '#0a1228', stars: 1.0 },
    anvilLit: '#9db4e6', anvilShade: '#0c163c', anvilHaze: '#16244c', halo: '#dfe8ff', portal: '#cfe0ff', spriteGain: 1.35, wallGain: 0.85, cream: 0.42,
    pearl: '#3a4a80', creamCol: '#9db4e6', plum: '#23264a',
  },
};
const SEASONS = {
  ripe: { root: '#8a6c2c', tip: '#d8b560', ground: '#a8893e', tall: [0.85, 1.25], rain: 1, dust: 0.25, chaff: 1, veil: true, nave: 1, drops: 1, stri: 0.22 },
  spring: { root: '#2f4e1e', tip: '#8fb04c', ground: '#4f6a2c', tall: [0.7, 1.05], rain: 1.4, dust: 0.0, chaff: 0.5, veil: true, nave: 1.15, drops: 1.6, stri: 0.2 },
  stubble: { root: '#6e5a34', tip: '#c2a468', ground: '#93794a', tall: [0.28, 0.5], rain: 0.5, dust: 1.5, chaff: 1.6, veil: true, nave: 1, drops: 0.7, stri: 0.24 },
  dry: { root: '#8f702a', tip: '#e2ba5c', ground: '#ad8c40', tall: [0.8, 1.2], rain: 0.08, dust: 0.9, chaff: 1.2, veil: false, nave: 0.72, drops: 0.2, stri: 0.36 },
};

// ---------- the route: a level run over the wheat, a helix up the nave that flattens above the anvil, a straight run-in ----------
function buildRoute(hand) {
  const R = 80, CZ = -70, UP0 = 50, HOLD = 400, DOWN = 125, EASE = 90, STEEP = 58, RUN = 3.5, STEP = 25;
  const pts = [[0, 4.2, 0], [0, 4.2, -24], [0, 4.25, -48]];
  const slopeAt = (a) => {
    const s = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };
    if (a < UP0) return STEEP * s(a / UP0);
    if (a < UP0 + HOLD - 25) return STEEP;
    return STEEP + (RUN - STEEP) * s((a - UP0 - HOLD + 25) / EASE);     // levels off from the eruption point on
  };
  let y = 4.3, yOut = 0;
  const total = UP0 + HOLD + DOWN;
  for (let a = 0; a <= total + 1e-6; a += STEP) {
    pts.push([hand * R * (1 - Math.cos(a * DEG)), y, CZ - R * Math.sin(a * DEG)]);
    if (Math.abs(a - (UP0 + HOLD - 25)) < 1e-6) yOut = y;
    for (let k = 0; k < 25; k++) y += R * DEG * Math.tan(slopeAt(a + k + 0.5) * DEG);   // one degree of turn at a time
  }
  const aE = total * DEG, last = pts[pts.length - 1];
  const tx = hand * Math.sin(aE), tz = -Math.cos(aE);
  for (const d of [60, 120, 180, 240, 300, 360]) pts.push([last[0] + tx * d, last[1] + Math.tan(RUN * DEG) * d, last[2] + tz * d]);
  const path = makePath(pts, { samples: 480 });
  const p = new THREE.Vector3();
  const uAtY = (yy) => { let lo = 0, hi = 1; for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (path.pointAt(m, p).y < yy) lo = m; else hi = m; } return (lo + hi) / 2; };
  return { path, axis: new THREE.Vector3(hand * R, 0, CZ), R, uIn: uAtY(120), uOut: uAtY(yOut), yOut, uAtY, endDir: new THREE.Vector3(tx, 0, tz), uRun: 1 - 360 / path.length };
}

// ---------- act one: the underside of the supercell, drawn on one dome ----------
const STORM_FRAG = /* glsl */`
  ${fx.GLSL_NOISE}
  uniform vec3 uCam, uUnder, uGloom, uHaze, uSlit, uFogCol, uBoltCol;
  uniform vec2 uCentre, uSlitXZ;
  uniform float uTime, uMurk, uRain, uSlitAz, uNight;
  varying vec3 vDir;
  vec2 rot2(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }
  float pulse(float t, float period, float ph){ float x = fract(t / period + ph) * period; return smoothstep(0.0, 0.3, x) * (1.0 - smoothstep(0.3, 1.1, x)); }
  // one tier of the lowering wall cloud: a ragged, turning disc at height h. rgb + coverage
  vec4 tier(vec2 dxz, float h, float rad, float dark, float spin){
    vec2 q = uCam.xz + dxz * max(h - uCam.y, 9.0) - uCentre;
    float r = length(q);
    vec2 qw = rot2(q, uTime * spin);
    float n = fbm(qw * 0.0052), nb = vnoise(qw * 0.021 + uTime * 0.05), sc = fbm(qw * 0.017 + 3.0);
    float edge = rad * (1.0 + 0.3 * (n - 0.5)) + 110.0 * (sc - 0.5);                 // ragged scud round the rim
    float cov = 1.0 - smoothstep(edge - 46.0, edge + 14.0, r);
    float rim = smoothstep(edge - 210.0, edge, r) * cov;
    float toSlit = dot(q / max(r, 1.0), uSlitXZ);                                    // +1 on the edge nearest the horizon light
    float band = 0.75 + 0.25 * sin(r / 46.0 + n * 9.0);                             // striations following its rim
    vec3 c = mix(uUnder * 0.7, uGloom, clamp(0.12 + 0.75 * n * (0.45 + nb), 0.0, 1.0)) * dark * band;
    c += uGloom * 0.8 * rim * (0.4 + nb);                                           // the paler lip of its lower edge
    c += uSlit * rim * (0.1 + 1.05 * smoothstep(-0.2, 0.9, toSlit)) * (0.45 + nb);  // lit amber where it faces the horizon slit
    return vec4(c, cov);
  }
  void main(){
    vec3 d = normalize(vDir + vec3(0.0, 1e-5, 0.0));
    float el = d.y, az = atan(d.x, -d.z + 1e-6);
    float elc = max(el, 0.012);
    vec2 dxz = d.xz / elc;
    // main base: striation plates wound in a spiral about an off-centre, lopsided core, turning
    float h1 = max(300.0 - uCam.y, 14.0);
    vec2 p1 = uCam.xz + dxz * h1, q0 = p1 - uCentre - vec2(0.0, -420.0);
    vec2 q1 = q0 + 300.0 * (vec2(vnoise(q0 * 0.0008), vnoise(q0 * 0.0008 + 17.3)) - 0.5);
    q1 = vec2(q1.x * 0.8 + q1.y * 0.14, q1.y * 1.12);
    float r1 = length(q1);
    vec2 qr = rot2(q1, uTime * 0.06 * 900.0 / (r1 + 500.0));
    float n1 = fbm(qr * 0.0014), n1b = fbm(qr * 0.0062 + 7.0), n1c = vnoise(qr * 0.034 + n1b * 2.0);
    float ang = atan(qr.y, qr.x + 1e-4) / 6.2832;
    float pl = r1 * (1.0 + 0.3 * (n1 - 0.5)) / 235.0 + ang, pf = mix(0.45, fract(pl), smoothstep(110.0, 420.0, r1));
    float far1 = exp(-r1 / 4600.0);
    float lip = smoothstep(0.0, 0.16, pf) * (1.0 - 0.82 * pf);
    float tex = 0.5 + 1.0 * n1b * (0.55 + 0.9 * n1c);
    float shade = mix(0.5, 0.2 + 1.1 * lip, far1) * tex;
    vec3 col = mix(uUnder * 0.55, uGloom, clamp(shade, 0.0, 1.5));
    float lowBand = smoothstep(0.07, 0.16, el) * (1.0 - smoothstep(0.36, 0.55, el));        // 5 to 25 degrees up: what the entry axis sees
    col += uSlit * (0.14 + 0.3 * lowBand) * lip * far1 * tex;                              // plate lips catch the horizon light
    col *= 1.0 - 0.38 * lowBand * (1.0 - lip) * far1;                                       // and the plates between them sink back
    col += uGloom * vec3(0.4, 1.0, 0.7) * 0.22 * exp(-r1 / 900.0) * tex;                   // hail-green core over the updraft
    // wall cloud: two darker tiers hanging under the base, the lower one smaller, turning at their own rates
    float up = step(0.0, el);
    vec4 t2 = tier(dxz, 218.0, 560.0, 0.8, 0.08), t3 = tier(dxz, 150.0, 440.0, 0.55, 0.12);
    col = mix(col, t2.rgb, t2.a * up); col = mix(col, t3.rgb, t3.a * up);
    // slow, eased glows crawling in the base (never flashes)
    float b1 = pulse(uTime, 3.7, 0.0), b2 = pulse(uTime, 5.3, 0.41);
    vec2 bp1 = uCentre + vec2(420.0, 260.0), bp2 = uCentre + vec2(-760.0, -340.0);
    col += uBoltCol * (b1 * exp(-dot(p1 - bp1, p1 - bp1) / 5.0e5) + b2 * exp(-dot(p1 - bp2, p1 - bp2) / 8.0e5)) * (0.35 + 0.9 * n1) * (0.35 + 0.65 * lip + 0.5 * n1b) * 0.9;
    // distance: everything sinks into the haze towards the horizon
    float hz = exp(-max(el, 0.0) * 16.0);
    col = mix(col, uHaze, hz);
    // the slit of light along the horizon, strongest on the sun side
    float da = az - uSlitAz; da = atan(sin(da), cos(da));
    float west = 0.22 + 0.78 * exp(-da * da / 1.1);
    float se = (el - 0.03) / (el > 0.03 ? 0.034 : 0.022); float sl = exp(-se * se) * west;
    col += uSlit * sl * (1.9 - 0.7 * uNight) * (0.85 + 0.25 * vnoise(vec2(az * 9.0, uTime * 0.05)));
    // rain shafts hanging in front of the slit, just right of it, and a thinner one to the left
    float dr = az - (uSlitAz + 0.52); dr = atan(sin(dr), cos(dr));
    float dl = az - (uSlitAz - 0.8); dl = atan(sin(dl), cos(dl));
    float sway = 0.05 * sin(el * 9.0 - uTime * 0.4);
    float rmask = (exp(-(dr + sway) * (dr + sway) / 0.05) + 0.55 * exp(-(dl - sway) * (dl - sway) / 0.016)) * uRain * smoothstep(0.42, 0.02, el) * up;
    float streak = fbm(vec2(az * 30.0 + el * 5.0, el * 2.2 - uTime * 0.3));
    vec3 rcol = mix(uHaze, uGloom * 0.9 + vec3(0.03), 0.7) * (0.4 + 0.7 * streak);
    col = mix(col, rcol, clamp(rmask * (0.55 + 0.6 * streak), 0.0, 0.92));
    // below the horizon the dome is the fog the ground fades into
    col = mix(col, uHaze, smoothstep(0.0, -0.02, el));
    col = mix(col, uFogCol, uMurk);
    gl_FragColor = vec4(col, 1.0);
  }
`;
const DOME_VERT = /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; }`;

function makeStormDome(H, season, T) {
  const uniforms = {
    uTime: T, uCam: { value: new THREE.Vector3() }, uCentre: { value: new THREE.Vector2(-120, -940) }, uMurk: { value: 0 },
    uUnder: { value: lin(H.under) }, uGloom: { value: lin(H.gloom, 0.6) }, uHaze: { value: lin(H.haze) }, uSlit: { value: lin(H.slit) },
    uFogCol: { value: new THREE.Color() }, uBoltCol: { value: lin('#8f7fe0', H === HOURS.night ? 2.6 : 0.7) }, uRain: { value: Math.min(1, season.rain) },
    uSlitAz: { value: -22 * DEG }, uSlitXZ: { value: new THREE.Vector2(Math.sin(-22 * DEG), -Math.cos(-22 * DEG)) }, uNight: { value: H === HOURS.night ? 1 : 0 },
  };
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 40, 20), new THREE.ShaderMaterial({ uniforms, vertexShader: DOME_VERT, fragmentShader: STORM_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
  mesh.renderOrder = -2; mesh.frustumCulled = false; mesh.name = 'supercell-underside';
  return { mesh, uniforms };
}

// light crawling through the cloud we are inside while act one hands over to act two: wisps streaming down past the
// lens and slow violet swells, added over everything so the swap of acts behind it is never seen
function makeMurkGlow(T, night) {
  const uniforms = { uTime: T, uAmt: { value: 0 }, uWisp: { value: lin('#49b09c', night ? 0.4 : 0.55) }, uBolt: { value: lin('#8a72f0', night ? 2.6 : 2.2) }, uGaze: { value: new THREE.Vector3(0, 1, 0) }, uSurge: { value: 0 }, uSun: { value: new THREE.Vector3() }, uSunDir: { value: new THREE.Vector3(0, 1, 0) } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.BackSide,
    vertexShader: DOME_VERT,
    fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
      uniform float uTime, uAmt, uSurge; uniform vec3 uWisp, uBolt, uSun, uSunDir, uGaze; varying vec3 vDir;
      float swell(float t, float period, float ph){ float x = fract(t / period + ph) * period; return smoothstep(0.0, 0.7, x) * (1.0 - smoothstep(0.9, 2.6, x)); }
      void main(){
        vec3 d = normalize(vDir + vec3(0.0, 1e-5, 0.0));
        vec3 q = d * 3.2 + vec3(0.0, uTime * 0.9, uTime * 0.12);
        float w = vnoise(q) * 0.6 + vnoise(q * 2.3 + 5.0) * 0.4;
        float wisps = smoothstep(0.38, 0.8, w);
        float a = uTime * 0.13;
        vec3 c1 = normalize(vec3(cos(a), 0.55, sin(a))), c2 = normalize(vec3(cos(a * 0.7 + 2.4), -0.1, sin(a * 0.7 + 2.4))), c3 = normalize(vec3(cos(2.0 - a), 0.9, sin(2.0 - a)));
        float g = swell(uTime, 4.1, 0.0) * exp(-(1.0 - dot(d, c1)) * 9.0) + swell(uTime, 5.3, 0.45) * exp(-(1.0 - dot(d, c2)) * 9.0) + swell(uTime, 4.7, 0.8) * exp(-(1.0 - dot(d, c3)) * 7.0);
        float sd = max(dot(d, uSunDir), 0.0), s2 = sd * sd;
        float gz = max(dot(d, uGaze), 0.0), w2 = vnoise(q * 0.7 + 11.0);
        float w3 = vnoise(q * 4.6 + 3.0);
        float surge = uSurge * (exp(-(1.0 - gz) * 9.0) * (0.12 + 1.1 * w * w2 + 0.5 * w * w3) + 0.22 * exp(-(1.0 - gz) * 30.0));   // the first slow discharge, deep in the cloud ahead
        vec3 col = uWisp * wisps * (0.55 + 0.45 * d.y) + uBolt * (g * (0.45 + 1.1 * w) + surge) + uSun * (s2 * s2 * s2 * s2 * s2 * s2 * s2 * s2 + 0.07 * sd) * (0.3 + 1.4 * w * w2 + 0.4 * w3) + uSun * wisps * 0.1;
        gl_FragColor = vec4(col * uAmt, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12), mat);
  mesh.renderOrder = 9; mesh.frustumCulled = false; mesh.name = 'murk-glow';
  return { mesh, uniforms };
}

// the wheat plain: one lit plane whose colour carries the chequerboard of fields, the wind waves and the section road
function makeGround(season, T, roadZ) {
  const mat = new THREE.MeshLambertMaterial({ color: season.ground });
  const rc = new THREE.Color(season.root), gc = new THREE.Color(season.ground), v3 = (c, k) => `vec3(${(c.r * k).toFixed(4)}, ${(c.g * k).toFixed(4)}, ${(c.b * k).toFixed(4)})`;
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = T;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWp = (modelMatrix * vec4(position, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWp; uniform float uTime;\n' + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        vec2 fq = vWp.xz / 800.0 + vec2(0.37, 0.21);
        float tone = 0.72 + 0.5 * hash12(floor(fq));
        vec2 fb = abs(fract(fq) - 0.5);
        float border = smoothstep(0.494, 0.499, max(fb.x, fb.y));
        float dist = length(vWp.xz - cameraPosition.xz);
        float w = vnoise(vec2(vWp.x * 0.018, vWp.z * 0.045 + uTime * 1.1)) * vnoise(vec2(vWp.x * 0.07 + 3.0, vWp.z * 0.16 + uTime * 2.3));
        float wave = mix(1.0, 0.55 + 2.2 * w, exp(-dist / 500.0));
        // rows of laid stalks streaming with the wind: fine under the blade cards, coarser out across the field
        float s1 = vnoise(vec2(vWp.x * 6.0, vWp.z * 0.7 + uTime * 1.5)), s2 = vnoise(vec2(vWp.x * 1.3 + 9.0, vWp.z * 0.16 + uTime * 1.1));
        float nearK = exp(-dist / 75.0), midK = exp(-dist / 420.0);
        vec3 field = diffuseColor.rgb * tone * wave * mix(1.0, 0.72 + 0.56 * s2, midK);
        vec3 under = ${v3(rc, 0.72)} * tone * (0.8 + 0.4 * s1) * (0.8 + 0.4 * s2) * (0.75 + 0.5 * w);
        diffuseColor.rgb = mix(field, under, nearK * 0.9);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.35, border);
        float rd = abs(vWp.z - (${roadZ.toFixed(1)}));
        float gravel = 0.6 * vnoise(vWp.xz * 1.3) + 0.4 * vnoise(vWp.xz * 5.0 + 11.0);
        diffuseColor.rgb = mix(diffuseColor.rgb, ${v3(gc, 0.8)} * (0.8 + 0.4 * gravel), (1.0 - smoothstep(2.2, 4.5, rd + 0.9 * (s2 - 0.5))) * 0.85);   // pale dusty shoulders
        vec3 roadCol = vec3(0.2, 0.16, 0.115) * (0.7 + 0.6 * gravel) * (1.0 + 0.22 * exp(-(abs(rd - 1.0) * abs(rd - 1.0)) / 0.12));        // gravel, paler in the wheel tracks
        float drift = smoothstep(0.42, 0.66, vnoise(vWp.xz * vec2(0.035, 0.05) + 4.0) * 0.7 + 0.3 * vnoise(vWp.xz * 0.17));                 // dust and chaff drifted across it
        diffuseColor.rgb = mix(diffuseColor.rgb, roadCol, (1.0 - smoothstep(1.9, 3.0, rd + 0.6 * (gravel - 0.5) + 0.8 * drift)) * (1.0 - 0.8 * drift));`);
  };
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000, 1, 1).rotateX(-Math.PI / 2), mat);
  mesh.name = 'wheat-plain';
  return mesh;
}

// ---------- act three: the anvil, a cream plain rippling outward from the overshooting dome ----------
function makeAnvil(H, T, sunDir, RMAX) {
  const NR = 108, NS = 96, pos = new Float32Array((NR + 1) * NS * 3), idx = new Uint16Array(NR * NS * 6);
  for (let i = 0; i <= NR; i++) {
    const r = RMAX * Math.pow(i / NR, 2.6);
    for (let j = 0; j < NS; j++) { const a = (j / NS) * Math.PI * 2, k = (i * NS + j) * 3; pos[k] = Math.cos(a) * r; pos[k + 1] = 0; pos[k + 2] = Math.sin(a) * r; }
  }
  for (let i = 0, k = 0; i < NR; i++) for (let j = 0; j < NS; j++) {
    const a = i * NS + j, b = i * NS + (j + 1) % NS, c = a + NS, d = b + NS;
    idx[k++] = a; idx[k++] = b; idx[k++] = c; idx[k++] = b; idx[k++] = d; idx[k++] = c;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setIndex(new THREE.BufferAttribute(idx, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), RMAX * 1.1);
  const sx = new THREE.Vector2(sunDir.x, sunDir.z).normalize();
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: T,
    uDomeH: { value: DOME_H }, uDomeR: { value: DOME_R }, uEdge: { value: RMAX * 0.62 },
    uSunDir: { value: sunDir.clone() }, uSunXZ: { value: sx }, uLit: { value: lin(H.anvilLit, 0.86) }, uShade: { value: lin(H.anvilShade, 0.8) },
    uHaze: { value: lin(H.anvilHaze, 0.6) }, uSunCol: { value: lin(H.lowSun, H.sunI) },
    uRed: { value: lin(PALETTE[6]) }, uTle: { value: new THREE.Vector3() },                 // where the sprites stand (x, z, glow)
  };
  // the rings: three trains of waves running outward from the dome, the same in the vertex and the fragment shader
  const COMMON = /* glsl */`
    uniform float uTime, uDomeH, uDomeR;
    float domeAt(float r){ return uDomeH * exp(-r * r / (uDomeR * uDomeR)); }
    vec3 ringPh(float r){ return vec3(r / 150.0 - uTime * 1.2, r / 420.0 - uTime * 0.52 + 1.3, r / 1100.0 - uTime * 0.25 + 0.4); }
    float ringEnv(float r){ return exp(-r / 5200.0) * smoothstep(300.0, 1200.0, r) * (1.0 - smoothstep(3600.0, 8500.0, r)); }`;
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, side: THREE.DoubleSide,
    vertexShader: COMMON + /* glsl */`
      varying vec3 vWp; varying vec2 vQ;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position; float r = length(p.xz);
        vec3 ph = ringPh(r);
        p.y += domeAt(r) - r * r * 3.2e-7 + ringEnv(r) * (12.0 * sin(ph.x) * (1.0 - smoothstep(2500.0, 5000.0, r)) + 34.0 * sin(ph.y) + 48.0 * sin(ph.z));
        vQ = p.xz;
        vec4 wp = modelMatrix * vec4(p, 1.0); vWp = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: fx.GLSL_NOISE + COMMON + /* glsl */`
      uniform vec3 uSunDir, uLit, uShade, uHaze, uSunCol, uRed, uTle; uniform vec2 uSunXZ; uniform float uEdge;
      varying vec3 vWp; varying vec2 vQ;
      #include <fog_pars_fragment>
      void main(){
        float r = length(vQ); vec2 rd = vQ / max(r, 1.0);
        float dist = length(vWp - cameraPosition);
        vec3 n1 = fbm3d(vQ * 0.0009 + 3.1), n2 = fbm3d(vQ * 0.0052 + vec2(uTime * 0.006, 0.0)), n3 = fbm3d(vQ * 0.028 + vec2(0.0, uTime * 0.02));
        vec3 n0 = fbm3d(vQ * 0.0004 + vec2(uTime * 0.0015, 7.7));                      // broad billows
        // rings racing out across the anvil like rings in a pond: slope for the light, height for the crests
        vec3 ph = ringPh(r); ph.x += (n0.x - 0.5) * 1.2;
        float env = ringEnv(r), k1 = exp(-dist / 7000.0), k2 = exp(-dist / 13000.0), k3 = exp(-dist / 22000.0);
        float g = env * (0.3 * cos(ph.x) * k1 + 0.24 * cos(ph.y) * k2 + 0.12 * cos(ph.z) * k3);
        float crest = env * (0.5 * sin(ph.x) * k1 + 0.4 * sin(ph.y) * k2 + 0.25 * sin(ph.z) * k3);
        float nearK = exp(-dist / 1500.0), midK = 0.3 + 0.7 * exp(-dist / 11000.0);
        vec2 grad = rd * (g - 2.0 * r / (uDomeR * uDomeR) * domeAt(r)) + n0.yz * 0.2 + n1.yz * 0.13 * midK + n2.yz * 0.11 * midK * midK + n3.yz * 0.1 * nearK;
        vec3 n = normalize(vec3(-grad.x, 1.0, -grad.y));
        float nl = dot(n, uSunDir);
        float lit = smoothstep(-0.13, 0.15, nl);                                             // a cream plain: only the lee slopes go cobalt
        vec3 nb = fbm3d(vQ * 0.00011 + 1.7);                                                // the biggest lumps, all that is left far off
        float farK = smoothstep(4500.0, 17000.0, dist);
        lit = mix(lit, 0.76 + 0.6 * (nb.x - 0.5) + 0.12 * (n0.x - 0.5) + 0.3 * crest, farK);   // no fine bands at grazing angles: far off it is one pale plain
        float occ = mix(0.84 + 0.2 * n2.x * midK + 0.14 * (n1.x - 0.5) + 0.18 * (n0.x - 0.5) + 0.24 * crest, 0.92 + 0.16 * (nb.x - 0.5), farK);
        vec3 v = normalize(vWp - cameraPosition);
        float fd = max(dot(v, uSunDir), 0.0), fw = fd * fd * fd; float fs = fd * fd; fs = fs * fs * fs;
        vec3 shadeC = mix(uShade, uLit * 0.6 + uSunCol * 0.22, 0.62 * fw);                  // towards the sun the light comes through the cloud: gold, not cobalt
        vec3 col = mix(shadeC, uLit, clamp(lit, 0.0, 1.0)) * occ;
        col += uSunCol * 0.22 * smoothstep(0.1, 0.5, nl) * (0.6 + 0.4 * n2.x);              // gold on what faces the low sun
        col += uSunCol * (fs * 0.42 + fw * 0.2) * (0.4 + 0.6 * lit);
        // beyond the anvil's edge: lower decks, and to the east the storm's own shadow lying across them
        float east = dot(rd, -uSunXZ);
        float edge = smoothstep(uEdge * 0.72, uEdge, r + 3200.0 * (n1.x - 0.5));
        vec3 low = mix(uHaze * 0.85, uShade * 0.5, smoothstep(0.1, 0.9, east));
        col = mix(col, low * (0.85 + 0.3 * n1.x), edge);
        float shadowK = smoothstep(0.62, 0.97, east + 0.08 * (n1.x - 0.5)) * smoothstep(900.0, 3800.0, r) * (1.0 - edge);
        col = mix(col, uShade * (0.35 + 0.5 * occ), 0.92 * shadowK);                   // in the storm's shadow the cloud is lit by the sky alone: cobalt
        vec2 dq = vQ - uTle.xy;
        col += uRed * uTle.z * exp(-dot(dq, dq) / 1.6e7) * (0.5 + 0.8 * n1.x);            // the sprites' glow on the cloud under them
        col = mix(col, uHaze * (1.0 + 0.5 * fw) + uSunCol * (fs * 0.3 + fw * 0.22), 1.0 - exp(-dist * dist / 3.2e8));   // the horizon melts into the sky over the last ten kilometres
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.name = 'anvil';
  const heightAt = (r) => DOME_H * Math.exp(-r * r / (DOME_R * DOME_R)) - r * r * 3.2e-7;
  return { mesh, uniforms, heightAt };
}

// ---------- the boiling crown: turrets of the overshooting dome as soft puffs that rise, swell and subside ----------
// turrets: [{ x, z, w (width), h (height of the tower above the cloud), surf (y of the cloud there) }]
function makeBoil(rng, H, T, sunDir, turrets, axis, anvilY) {
  const rows = [];
  for (const t of turrets) {
    const n = Math.round(6 + t.h / (0.22 * t.w));
    for (let i = 0; i < n; i++) {
      const l = n > 1 ? i / (n - 1) : 0, a = rng.range(0, Math.PI * 2), rr = Math.sqrt(rng()) * 0.32 * t.w * (1 - 0.5 * l);
      const s = 0.5 * t.w * rng.range(0.75, 1.15) * (1 - 0.3 * l), lift = s * rng.range(0.25, 0.7) + (l > 0.6 ? s * 0.5 : 0);
      rows.push([t.x + Math.cos(a) * rr, t.surf + l * t.h + 0.25 * s, t.z + Math.sin(a) * rr, s, rng(), rng.range(5, 10), lift, rng(), Math.cos(a) * 0.3 * s, Math.sin(a) * 0.3 * s, l]);
    }
  }
  const N = rows.length, STR = 11, master = new Float32Array(N * STR), live = new Float32Array(N * STR);
  rows.forEach((r, i) => master.set(r, i * STR)); live.set(master);
  const geo = new THREE.InstancedBufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); geo.setIndex([0, 1, 2, 0, 2, 3]);
  const buf = new THREE.InstancedInterleavedBuffer(live, STR); buf.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('aA', new THREE.InterleavedBufferAttribute(buf, 4, 0)); geo.setAttribute('aB', new THREE.InterleavedBufferAttribute(buf, 4, 4)); geo.setAttribute('aC', new THREE.InterleavedBufferAttribute(buf, 3, 8));
  geo.instanceCount = N; geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(axis.x, anvilY, axis.z), 1e5);
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: T, uSunDir: { value: sunDir.clone() }, uLit: { value: lin(H.anvilLit, 0.9) },
    uShade: { value: lin(H.anvilShade, 0.9).lerp(lin(H.anvilLit, 0.8), 0.38) }, uSunCol: { value: lin(H.lowSun, H.sunI) },
    uAxis: { value: new THREE.Vector2(axis.x, axis.z) }, uSurf: { value: anvilY }, uDomeH: { value: DOME_H }, uDomeR2: { value: DOME_R * DOME_R },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, fog: true, transparent: true, depthWrite: false,
    vertexShader: /* glsl */`
      attribute vec4 aA; attribute vec4 aB; attribute vec3 aC;
      uniform float uTime;
      varying vec2 vUv; varying vec3 vK; varying vec3 vWp; varying vec3 vR; varying vec3 vU; varying vec3 vB; varying vec3 vCl;
      #include <fog_pars_vertex>
      void main(){
        float t = fract(uTime / aB.y + aB.x);
        float f = smoothstep(0.0, 0.38, t) * (1.0 - smoothstep(0.5, 1.0, t));           // up quickly, subsiding slowly
        float s = aA.w * (0.78 + 0.3 * f);
        vec3 c = aA.xyz;
        c.y += aB.z * f - 0.25 * aA.w * (1.0 - f);
        c.xz += aC.xy * f + vec2(sin(uTime * 0.21 + aB.w * 40.0), cos(uTime * 0.17 + aB.w * 23.0)) * aA.w * 0.05;
        vR = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); vU = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]); vB = vec3(viewMatrix[0][2], viewMatrix[1][2], viewMatrix[2][2]);
        vWp = c + (vR * position.x + vU * position.y) * s;
        float d = distance(c, cameraPosition);
        vUv = position.xy; vK = vec3(aB.w, smoothstep(0.55 * s, 1.5 * s, d), s);
        vCl = normalize(vec3(aC.x / (0.3 * aA.w), 0.4 + aC.z, aC.y / (0.3 * aA.w)));              // which way this puff faces in its turret
        vec4 mvPosition = viewMatrix * vec4(vWp, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
      uniform vec3 uSunDir, uLit, uShade, uSunCol; uniform vec2 uAxis; uniform float uTime, uSurf, uDomeH, uDomeR2;
      varying vec2 vUv; varying vec3 vK; varying vec3 vWp; varying vec3 vR; varying vec3 vU; varying vec3 vB; varying vec3 vCl;
      #include <fog_pars_fragment>
      void main(){
        vec2 q = vUv; float r = length(q);
        float n = vnoise(q * 1.7 + vK.x * 19.0 + vec2(0.0, -uTime * 0.06)) * 0.62 + vnoise(q * 4.3 + vK.x * 37.0 + vec2(uTime * 0.05, 0.0)) * 0.38;
        float body = 1.0 - r - 0.5 * (1.0 - n);                                             // a disc eaten away by noise
        float a = smoothstep(0.0, 0.34, body);
        vec3 nv = normalize(vec3(q * (0.8 + 0.6 * n), 0.35 + sqrt(max(1.0 - r * r, 0.0))));
        vec3 N = normalize(vR * nv.x + vU * nv.y + vB * nv.z + vCl * 0.9);                  // the turret is lit as one body
        float nl = dot(N, uSunDir);
        float lit = clamp(smoothstep(-0.6, 0.65, nl) * (0.75 + 0.4 * n), 0.0, 1.0);
        vec3 col = mix(uShade, uLit, lit) * mix(0.72, 1.0, smoothstep(-0.9, 0.2, q.y));    // lit by the low sun, darker toward its foot
        col += uSunCol * 0.2 * smoothstep(0.35, 0.9, nl);
        vec3 v = normalize(vWp - cameraPosition);
        float fs = max(dot(v, uSunDir), 0.0); fs *= fs; fs *= fs;
        col += uSunCol * fs * ((1.0 - smoothstep(0.0, 0.3, body)) * 0.6 + 0.28);              // against the sun: light through the body, a silver lining
        vec2 dq = vWp.xz - uAxis; float rr = dot(dq, dq);
        float surf = uSurf + uDomeH * exp(-rr / uDomeR2) - rr * 3.2e-7;
        a *= smoothstep(-0.05, 0.4, (vWp.y - surf) / vK.z);                                 // melts into the cloud it stands on
        gl_FragColor = vec4(col, a * vK.y);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 2.5; mesh.name = 'boiling-crown';
  // back to front each frame, so the soft puffs lay over one another correctly
  const order = Array.from({ length: N }, (_, i) => i), key = new Float32Array(N);
  let sx = 1e9, sy = 0, sz = 0;
  const update = (camW) => {
    const mx = camW.x - sx, my = camW.y - sy, mz = camW.z - sz;
    if (mx * mx + my * my + mz * mz < 900) return;                 // puffs only change order when the camera has moved
    sx = camW.x; sy = camW.y; sz = camW.z;
    for (let i = 0; i < N; i++) { const k = i * STR, dx = master[k] - camW.x, dy = master[k + 1] - camW.y, dz = master[k + 2] - camW.z; key[i] = dx * dx + dy * dy + dz * dz; }
    order.sort((p, q) => key[q] - key[p]);
    for (let i = 0; i < N; i++) { const k = order[i] * STR, o = i * STR; for (let j = 0; j < STR; j++) live[o + j] = master[k + j]; }
    buf.needsUpdate = true;
  };
  return { mesh, uniforms, update, count: N };
}

// ---------- ice optics: 22-degree halo, parhelia, upper tangent arc and pillar around the low sun (or moon) ----------
function makeHalo(H, T, sunDir, portalPos, portalR) {
  const right = new THREE.Vector3().crossVectors(sunDir, new THREE.Vector3(0, 1, 0)).normalize();
  const up = new THREE.Vector3().crossVectors(right, sunDir).normalize();
  const D = 2000, geo = new THREE.CircleGeometry(D * Math.tan(36 * DEG), 40);
  const uniforms = {
    uTime: T, uSun: { value: sunDir.clone() }, uRight: { value: right }, uUp: { value: up }, uCol: { value: lin(H.halo) },
    uAmt: { value: 0 }, uDogs: { value: 0 }, uPortal: { value: portalPos.clone() }, uPortalR: { value: portalR },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vDir = wp.xyz - cameraPosition; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
      uniform vec3 uSun, uRight, uUp, uCol, uPortal; uniform float uTime, uAmt, uDogs, uPortalR;
      varying vec3 vDir;
      float ringAt(float t){ return smoothstep(-1.5, 0.3, t) * exp(-max(t, 0.0) / 2.4); }
      void main(){
        vec3 d = normalize(vDir);
        float th = acos(clamp(dot(d, uSun), -1.0, 1.0)) * 57.2958;
        float xd = asin(clamp(dot(d, uRight), -1.0, 1.0)) * 57.2958, yd = asin(clamp(dot(d, uUp), -1.0, 1.0)) * 57.2958;
        vec3 ring = vec3(ringAt(th - 21.6), ringAt(th - 21.9), ringAt(th - 22.2)) * vec3(1.0, 0.94, 0.92);
        float dx = abs(xd) - 22.9;
        float dogCore = exp(-dx * dx / 1.5 - yd * yd / 6.0), dogTail = step(0.0, dx) * exp(-dx / 5.5) * exp(-yd * yd / 4.0) * (1.0 - smoothstep(5.0, 10.5, dx));
        vec3 dogs = dogCore * mix(vec3(1.3, 0.55, 0.3), vec3(1.0, 1.0, 0.95), smoothstep(-1.2, 0.6, dx)) * 1.5 + dogTail * vec3(0.55, 0.75, 1.0) * 0.6;
        float ya = 22.0 + 0.028 * xd * xd, ta = exp(-(yd - ya) * (yd - ya) / 1.3) * exp(-xd * xd / 150.0);
        float pil = exp(-xd * xd / 2.0) * (yd > 0.0 ? exp(-yd / 12.0) : 1.7 * exp(yd / 9.0));       // the pillar under the eclipsed sun marks the ring from afar
        float sh = 0.78 + 0.44 * vnoise(vec2(xd * 0.8 + uTime * 0.9, yd * 0.8 - uTime * 0.6));
        float ang = atan(yd, xd + 1e-4);
        float tw = 0.8 + 0.4 * vnoise(vec2(ang * 40.0, uTime * 1.5)) * vnoise(vec2(ang * 9.0 - uTime * 0.4, th * 0.7 + uTime * 0.8)) * 2.0;   // crystals tumbling: the arcs glitter along their length
        vec3 col = uCol * ((ring * 0.26 + dogs * 0.8 * uDogs) * tw + ta * 0.36 * uDogs * (0.7 + 0.6 * vnoise(vec2(xd * 0.5 - uTime * 1.1, 3.0))) + pil * (0.12 + 0.3 * uDogs)) * sh;
        col *= 1.0 - smoothstep(31.0, 35.0, th);                                              // nothing reaches the edge of the disc it is drawn on
        // the portal disc occludes it
        vec3 tp = uPortal - cameraPosition; float dp = max(length(tp), 0.01); tp /= dp;
        float along = dot(d, tp), off = length(cross(d, tp)) * dp / max(along, 1e-3);
        float mask = along > 0.0 ? smoothstep(uPortalR * 0.97, uPortalR * 1.12, off) : 1.0;
        gl_FragColor = vec4(col * uAmt * mask, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 12; mesh.frustumCulled = false; mesh.name = 'ice-halo';
  const update = (camW) => { mesh.position.copy(camW).addScaledVector(sunDir, D); mesh.lookAt(camW); };
  return { mesh, uniforms, update };
}

// ---------- transient luminous events: sprites, a blue jet and (rarely) a gigantic jet, as additive tendril cards ----------
function makeTLE(rng, H, T, origin, east, anvilY, rare) {
  const north = new THREE.Vector3(-east.z, 0, east.x);
  const P = [], UV = [], A = [], I = [];
  const card = (dist, lat, y0, w, h, kind, period, phase) => {
    const c = origin.clone().addScaledVector(east, dist).addScaledVector(north, lat), b = P.length / 3, seed = rng();
    for (const [u, v] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
      P.push(c.x + north.x * (u - 0.5) * w, y0 + v * h, c.z + north.z * (u - 0.5) * w); UV.push(u, v); A.push(kind, seed, period, phase);
    }
    I.push(b, b + 1, b + 2, b, b + 2, b + 3);
  };
  const n = rng.int(9, 13);
  for (let i = 0; i < n; i++) card(rng.range(10000, 14500), rng.range(-5200, 5200), anvilY + rng.range(900, 2400), rng.range(1300, 2300) * rng.range(0.6, 1.5), rng.range(2300, 3900), 0, rng.range(5, 8), rng());
  card(rng.range(7000, 9000), rng.range(-2600, 2600), anvilY - 100, 1500, rng.range(2600, 3600), 1, rng.range(5, 7), rng());
  if (rare) card(9500, rng.range(-900, 900), anvilY - 150, 7200, 9000, 2, 1, 0);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
  geo.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4)); geo.setIndex(I);
  geo.boundingSphere = new THREE.Sphere(origin.clone(), 60000);
  const uniforms = { uTime: T, uRed: { value: lin(PALETTE[6]) }, uGain: { value: H.spriteGain }, uGiant: { value: 0 }, uShow: { value: 0 } };
  const mat = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`attribute vec4 aP; varying vec2 vUv; varying vec4 vP; void main(){ vUv = uv; vP = aP; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`
      uniform float uTime, uGain, uGiant, uShow; uniform vec3 uRed;
      varying vec2 vUv; varying vec4 vP;
      void main(){
        float x = vUv.x * 2.0 - 1.0, y = vUv.y, seed = vP.y * 37.0;
        float border = smoothstep(1.0, 0.8, abs(x)) * smoothstep(0.0, 0.04, y) * smoothstep(1.0, 0.9, y);
        float soft = smoothstep(1.0, 0.35, abs(x)) * smoothstep(0.0, 0.04, y) * smoothstep(1.0, 0.6, y);
        vec3 col = vec3(0.0);
        if (vP.x < 0.5) {
          // sprite: a diffuse red head over a skirt of tendrils, blooming and fading like a slow jellyfish
          float t = fract(uTime / vP.z + vP.w) * vP.z;
          float e = smoothstep(0.0, 0.4, t) * (1.0 - smoothstep(1.2, 3.8, t));
          // every one its own: where the head sits, how wide it is, how far its tendrils reach, an outline bent by noise
          float s1 = fract(seed * 0.173), s2 = fract(seed * 0.411), s3 = fract(seed * 0.737);
          float xw = x + 0.2 * (vnoise(vec2(y * 3.0 + seed, seed)) - 0.5) + 0.07 * sin(y * 7.0 + seed);
          float hy = 0.62 + 0.12 * s1, low = 0.03 + 0.3 * s2;
          float head = exp(-(xw * xw / (0.12 + 0.16 * s2) + (y - hy) * (y - hy) / (0.012 + 0.02 * s3)));
          float fil = vnoise(vec2(xw * (5.0 + 5.0 * s3) + seed, y * 1.3 + seed)); fil = fil * fil * fil * 3.0;
          float beads = 0.6 + 0.6 * vnoise(vec2(xw * 7.0 + seed, y * 22.0 - uTime * 0.6));
          float skirt = fil * beads * smoothstep(low, low + 0.4, y) * (1.0 - smoothstep(hy - 0.12, hy + 0.04, y)) * exp(-xw * xw / (0.2 + 0.25 * s1));
          float hair = exp(-xw * xw / 0.16) * smoothstep(hy, hy + 0.08, y) * (1.0 - smoothstep(hy + 0.08, 0.98, y)) * 0.35;
          vec3 c = mix(vec3(0.45, 0.3, 1.1), uRed * 1.5, smoothstep(0.15, hy - 0.1, y));
          col = c * (head * 1.3 + skirt * 1.2 + hair) * e * uGain * soft / max(border, 1e-3);
        } else if (vP.x < 1.5) {
          // blue jet: a narrow cone leaping from the anvil's flank
          float t = fract(uTime / vP.z + vP.w) * vP.z;
          float e = smoothstep(0.0, 0.45, t) * (1.0 - smoothstep(0.9, 2.8, t));
          float w = 0.05 + 0.4 * y * y, xs = x / w;
          float fil = 0.4 + 1.3 * vnoise(vec2(xs * 2.5 + seed, y * 5.0 - uTime * 0.8));
          float tip = 1.0 - smoothstep(0.25 + 0.75 * smoothstep(0.0, 0.6, t), 1.0, y);
          col = mix(vec3(0.25, 0.5, 1.6), vec3(0.6, 0.4, 1.3), y) * exp(-xs * xs * 1.4) * fil * tip * e * (0.95 + 0.6 * uGain);
        } else {
          // gigantic jet: blue at its root, branching, red at its crown at the edge of space
          float w = 0.012 + 0.66 * pow(max(y, 0.0), 1.45), xs = x / w;
          float f1 = vnoise(vec2(xs * 3.2 + seed, y * 5.0)), f2 = vnoise(vec2(xs * 9.0 - seed, y * 13.0 - uTime * 0.25));
          float fil = pow(f1, 3.0) * 3.2 + pow(f2, 4.0) * 2.0 * smoothstep(0.3, 0.7, y);
          float body = exp(-xs * xs * 1.3) * (0.2 + 0.95 * fil) * (1.0 - smoothstep(0.86, 0.99, y));
          float trunk = exp(-x * x / 0.00012) * (1.0 - smoothstep(0.0, 0.4, y)) * 1.6;
          float crown = exp(-x * x / 0.3) * exp(-(y - 0.86) * (y - 0.86) / 0.012) * 0.5;
          vec3 c = mix(vec3(0.3, 0.55, 1.7), uRed * 1.5, smoothstep(0.38, 0.78, y));
          float climb = 1.0 - smoothstep(uGiant * 1.25 - 0.25, uGiant * 1.25, y);
          col = (c * (body + crown) + vec3(0.7, 0.8, 1.6) * trunk) * climb * (0.86 + 0.14 * sin(uTime * 2.1 + y * 9.0)) * (0.8 + 0.3 * uGain) * min(uGiant * 3.0, 1.0);
        }
        gl_FragColor = vec4(col * border * uShow, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.renderOrder = 6; mesh.frustumCulled = false; mesh.name = 'sprites-and-jets';
  return { mesh, uniforms };
}

// ---------- vehicles in the nave ----------
const BODY_VERT = /* glsl */`varying vec3 vN; varying vec3 vV;
  #include <fog_pars_vertex>
  void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(position, 1.0); vV = cameraPosition - wp.xyz;
    vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const BODY_FRAG = /* glsl */`uniform vec3 uLow, uHigh, uRim; varying vec3 vN; varying vec3 vV;
  #include <fog_pars_fragment>
  void main(){ vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
    float f = 1.0 - abs(dot(n, normalize(vV + vec3(1e-4))));
    vec3 col = mix(uLow, uHigh, n.y * 0.5 + 0.5) + uRim * f * f * f;
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }`;
const bodyMat = (low, high, rim) => new THREE.ShaderMaterial({
  uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLow: { value: lin(low) }, uHigh: { value: lin(high) }, uRim: { value: lin(rim) } },
  fog: true, side: THREE.DoubleSide, vertexShader: BODY_VERT, fragmentShader: BODY_FRAG,
});
// a ribbon along a list of points, as two crossed strips; uv.x runs along it
function ribbonGeo(pts, w0, w1) {
  const P = [], UV = [], I = [], n = pts.length;
  for (const axis of [new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)]) {
    const b = P.length / 3;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1), w = w0 + (w1 - w0) * t, p = pts[i];
      P.push(p.x - axis.x * w, p.y - axis.y * w, p.z, p.x + axis.x * w, p.y + axis.y * w, p.z); UV.push(t, 0, t, 1);
      if (i < n - 1) { const k = b + i * 2; I.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  return g;
}
const TRAIL_FRAG = fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + /* glsl */`uniform vec3 uCol; uniform float uTime, uGain; varying vec2 vUv; varying float vKind;
  #include <fog_pars_fragment>
  void main(){
    vec3 col;
    if (vKind > 0.5) {                                             // propeller disc fringed with St Elmo's fire
      vec2 q = vUv * 2.0 - 1.0; float r = length(q), a = atan(q.y, q.x);
      float fr = smoothstep(0.55, 0.95, r) * (1.0 - smoothstep(0.95, 1.0, r)) * (0.5 + 0.9 * vnoise(vec2(a * 5.0 + uTime * 9.0, uTime * 3.0)));
      col = vec3(0.55, 0.35, 1.5) * (fr * 2.6 + 0.12 * (1.0 - r));
    } else {                                                       // vapour, sliding back along the spiral
      float e = sin(3.14159 * vUv.y), puff = 0.45 + 0.75 * vnoise(vec2(vUv.x * 46.0 - uTime * 1.6, vUv.y * 2.0));
      col = uCol * e * puff * smoothstep(0.0, 0.03, vUv.x) * (1.0 - vUv.x) * (1.0 - vUv.x) * uGain;
    }
    gl_FragColor = vec4(col, 1.0);
    #ifdef USE_FOG
      gl_FragColor.rgb *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);   // additive: fade to nothing, not to the fog colour
    #endif
  }`;
const TRAIL_VERT = /* glsl */`attribute float aKind; varying vec2 vUv; varying float vKind;
  #include <fog_pars_vertex>
  void main(){ vUv = uv; vKind = aKind; vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const withKind = (g, k) => { g.setAttribute('aKind', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(k), 1)); return g; };
const strip = (g) => { const o = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(o.attributes)) if (!['position', 'normal', 'uv', 'aKind'].includes(k)) o.deleteAttribute(k); return o; };

const bare = (g) => { const o = strip(g); if (o.attributes.normal) o.deleteAttribute('normal'); return o; };

function makeAircraft(rng, T) {
  const group = new THREE.Group(); group.name = 'research-aircraft';
  const parts = [];
  const add = (g, x, y, z, rx = 0, rz = 0) => { g.rotateX(rx); g.rotateZ(rz); g.translate(x, y, z); parts.push(strip(g)); };
  add(new THREE.CylinderGeometry(0.85, 0.6, 11, 10), 0, 0, 0.5, Math.PI / 2);                 // fuselage along z (nose at -z)
  add(new THREE.ConeGeometry(0.85, 2.6, 10), 0, 0, -6.3, -Math.PI / 2);
  add(new THREE.ConeGeometry(0.6, 3.2, 10), 0, 0.25, 7.5, Math.PI / 2);
  add(new THREE.BoxGeometry(18, 0.22, 2.0), 0, 0.55, -0.6);                                   // 18 m wing
  add(new THREE.BoxGeometry(6.4, 0.14, 1.2), 0, 0.5, 7.6);
  add(new THREE.BoxGeometry(0.16, 2.4, 1.6), 0, 1.6, 7.7);
  for (const s of [-1, 1]) { add(new THREE.CylinderGeometry(0.5, 0.4, 3.2, 8), s * 3.1, 0.3, -1.3, Math.PI / 2); add(new THREE.CylinderGeometry(0.09, 0.09, 1.4, 5), s * 0.9, -1.2, -1.5); }
  const body = new THREE.Mesh(mergeGeometries(parts), bodyMat('#0a1216', '#7d98a0', '#9fe0d0')); for (const g of parts) g.dispose();
  group.add(body);
  // propeller discs + the vapour spiral the updraft bends upward
  const glowParts = [];
  for (const s of [-1, 1]) glowParts.push(withKind(bare(new THREE.CircleGeometry(1.5, 20).translate(s * 3.1, 0.3, -3.0)), 1));
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 60; i++) { const z = i * 5.5, a = z * 0.085 + s, rr = 0.4 + z * 0.02; pts.push(new THREE.Vector3(s * 8.8 + Math.cos(a) * rr * s, 0.5 + Math.sin(a) * rr + 0.0019 * z * z, z)); }
    glowParts.push(withKind(bare(ribbonGeo(pts, 0.5, 5.5)), 0));
  }
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: T, uCol: { value: lin('#9fe0d0', 0.42) }, uGain: { value: 1 } };
  const glow = new THREE.Mesh(mergeGeometries(glowParts), new THREE.ShaderMaterial({ uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexShader: TRAIL_VERT, fragmentShader: TRAIL_FRAG }));
  for (const g of glowParts) g.dispose();
  glow.renderOrder = 3; glow.frustumCulled = false; group.add(glow);
  const strobes = fx.makeGlows({ rng, time: T, positions: [[-9, 0.6, -0.6], [9, 0.6, -0.6], [0, 2.9, 7.7]], colors: ['#ff5a4a', '#7dffb0', '#ffffff'], size: 5, intensity: 2.6, fogAmount: 0.35, halo: 1.2 });
  group.add(strobes.object);
  group.scale.setScalar(1.7);
  const update = (time, dir) => {
    group.rotation.set(0, Math.atan2(-dir.x, -dir.z), 0.12 * Math.sin(time * 0.5), 'YXZ');
    for (let i = 0; i < 3; i++) { const s = 0.5 + 0.5 * Math.sin(time * 2.4 + i * 2.1); strobes.setSize(i, 0.35 + 1.1 * s * s); }   // soft, slow pulses, never a flash
  };
  return { object: group, update, strobes };
}

function makeBalloon(rng, T) {
  const group = new THREE.Group(); group.name = 'weather-balloon';
  const env = new THREE.Mesh(strip(new THREE.SphereGeometry(8, 24, 16).scale(1, 1.12, 1)), bodyMat('#3c4a58', '#e9efe8', '#9fe0d0'));
  const neck = strip(new THREE.ConeGeometry(1.6, 3, 10).translate(0, -9.6, 0));
  const box = strip(new THREE.BoxGeometry(2.2, 2.6, 2.2).translate(0, -62, 0)), vane = strip(new THREE.BoxGeometry(5.5, 0.12, 0.8).translate(0, -60.4, 0));
  const kit = new THREE.Mesh(mergeGeometries([neck, box, vane]), bodyMat('#0c1216', '#aab6b8', '#9fe0d0')); neck.dispose(); box.dispose(); vane.dispose();
  const pts = []; for (let i = 0; i <= 12; i++) pts.push(new THREE.Vector3(0, 0, i * 4.25));
  const tetherGeo = withKind(ribbonGeo(pts, 0.22, 0.22), 0).rotateX(Math.PI / 2).translate(0, -10, 0);
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: T, uCol: { value: lin('#cfe6e0', 0.9) }, uGain: { value: 4 } };
  const tether = new THREE.Mesh(tetherGeo, new THREE.ShaderMaterial({ uniforms, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexShader: TRAIL_VERT, fragmentShader: TRAIL_FRAG }));
  tether.frustumCulled = false;
  const strobes = fx.makeGlows({ rng, time: T, positions: [[0, -63.6, 0], [0, 9.4, 0]], colors: ['#ff5a4a', '#bfffe6'], size: 6, intensity: 2.6, fogAmount: 0.35 });
  group.add(env, kit, tether, strobes.object);
  group.scale.setScalar(1.5);
  const update = (time) => {
    group.rotation.set(0.1 * Math.sin(time * 0.7), time * 0.15, 0.13 * Math.sin(time * 0.53 + 1.0));
    const s = 0.5 + 0.5 * Math.sin(time * 2.0); strobes.setSize(0, 0.35 + 1.1 * s * s); strobes.setSize(1, 0.5 + 0.3 * Math.sin(time * 1.3));
  };
  return { object: group, update, strobes };
}

// the airliner skirting the storm: a pinprick and a short contrail
function makeAirliner(rng, T, H) {
  const group = new THREE.Group(); group.name = 'airliner';
  const pts = []; for (let i = 0; i <= 24; i++) pts.push(new THREE.Vector3(0, 0, i * 190));
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: T, uCol: { value: lin(H.anvilLit, 1.5) }, uGain: { value: 1 } };
  const trail = new THREE.Mesh(withKind(ribbonGeo(pts, 22, 120), 0), new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, vertexShader: TRAIL_VERT, fragmentShader: TRAIL_FRAG, fog: true }));
  trail.frustumCulled = false; trail.renderOrder = 3;
  const light = fx.makeGlows({ rng, time: T, positions: [[0, 0, -30]], colors: ['#fff6e0'], size: 130, intensity: 3.0, fogAmount: 0 });
  group.add(trail, light.object);
  return { object: group, light };
}

// one camera-following shell between the sky dome and the world: the cloud we are inside while the acts change over
function makeShell() {
  const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: THREE.BackSide, fog: false });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), mat);
  mesh.renderOrder = -0.5; mesh.frustumCulled = false; mesh.name = 'cloud-shell';
  return { mesh, mat };
}

export default {
  id: 'hail-cathedral',
  name: 'The Hail Cathedral',
  category: 'sky',
  weirdness: 0.2,
  media: ['air'],
  async build(ctx) {
    const { rng, core } = ctx, { clamp, lerp, smoothstep } = core;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const detail = ctx.quality?.detail ?? 1, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const DUR = 44;

    // ---- which visit is this ----
    const vr = rng.fork('visit180');                          // its own generator, equal weights
    const seedHour = vr.pick(['afternoon', 'dawn', 'night']);
    const hourName = vary.hour === 'dawn' ? 'dawn' : vary.hour === 'night' ? 'night' : (vary.hour === 'day' || vary.hour === 'golden') ? 'afternoon' : seedHour;
    const H = HOURS[hourName], night = hourName === 'night';
    const seasonName = vr.pick(['ripe', 'spring', 'stubble', 'dry']), S = SEASONS[seasonName];
    const grazer = vr.pick(['bison', 'antelope', 'horse']);
    const birdKind = vr.pick(['swifts', 'hawks']);
    const vehicleKind = vr.pick(['aircraft', 'balloon']);
    const hand = rng() < 0.5 ? -1 : 1;
    const rare = !!vary.rare;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    const T = { value: 0 };
    const route = buildRoute(hand), path = route.path, { uIn, uOut, axis, uRun } = route, span2 = uOut - uIn;
    const E = path.pointAt(uOut), P0 = new THREE.Vector3();
    const sunAz = Math.atan2(route.endDir.x, -route.endDir.z) / DEG, sunEl = 4;
    const sunDir = skyDirection(sunEl, sunAz).clone();
    const east = new THREE.Vector3(-sunDir.x, 0, -sunDir.z).normalize();
    const north = new THREE.Vector3(-east.z, 0, east.x); if (north.z < 0) north.negate();     // the side the turn above the anvil passes through
    const slitDir = skyDirection(8, -22).clone();

    scene.fog = new THREE.FogExp2(H.haze, 0.0016);
    const hemi = new THREE.HemisphereLight(H.amb1, '#2a251a', 2.2);
    const key = new THREE.DirectionalLight(H.slit, 2.8 * H.sunI);
    key.position.copy(slitDir).multiplyScalar(100);
    scene.add(hemi, key, key.target);
    const LIGHTS = [
      { sky: new THREE.Color(H.amb1), ground: new THREE.Color(night ? '#141c2c' : '#2a251a'), hi: night ? 5.0 : 2.2, key: new THREE.Color(H.slit), ki: night ? 3.6 : 2.8 * H.sunI, dir: slitDir },
      { sky: new THREE.Color('#2f7a74'), ground: new THREE.Color(PALETTE[1]), hi: 2.2, key: new THREE.Color(PALETTE[3]), ki: 0.9, dir: new THREE.Vector3(0.2, 1, 0.1).normalize() },
      { sky: new THREE.Color(H.anvilHaze), ground: new THREE.Color(H.anvilLit).multiplyScalar(0.6), hi: night ? 1.4 : 2.0, key: new THREE.Color(H.lowSun), ki: 3.2 * H.sunI, dir: sunDir },
    ];
    let actNow = -1;
    const setAct = (a) => {
      if (a === actNow) return; actNow = a; const L = LIGHTS[a];
      hemi.color.copy(L.sky); hemi.groundColor.copy(L.ground); hemi.intensity = L.hi; key.color.copy(L.key); key.intensity = L.ki; key.position.copy(L.dir).multiplyScalar(100);
    };

    // =================== ACT ONE: the plain ===================
    const act1 = new THREE.Group(); act1.name = 'act-one'; scene.add(act1);
    const ROADZ = -58;
    await ctx.yield();
    const storm = makeStormDome(H, S, T); scene.add(storm.mesh);
    const murkGlow = makeMurkGlow(T, night); scene.add(murkGlow.mesh);
    act1.add(makeGround(S, T, ROADZ));
    const set1 = fx.fxGroup(), set2 = fx.fxGroup(), set3 = fx.fxGroup();
    act1.add(set1.object); scene.add(set2.object, set3.object);

    const wind = flora.makeWind({ direction: [0.12 * hand, -1], strength: 3.2, speed: 1.9, gustiness: 0.85, gustScale: 0.03 });
    const fopts = { wind, backlight: 0.8, backlightTint: H.slit };
    await ctx.yield();
    await flora.prepareLeafTexture(fopts, ctx.yield);          // the leaf atlas, in short steps
    const fmat = flora.windMaterial(fopts);
    await ctx.yield();
    const wheat = await flora.makeGrassAsync({
      rng: rng.fork('wheat'), bounds: [hand > 0 ? -30 : -46, -150, hand > 0 ? 46 : 30, 10], count: Math.round(40000 * detail * clamp(dens, 0.85, 1.15)), wind, map: fmat.map,
      root: S.root, tip: S.tip, dryAmount: 0, density: (x, z) => (Math.abs(z - ROADZ) < 4.6 ? 0 : 1), height: S.tall, width: [1.3, 2.2], flowers: 0, fade: [105, 150], tint: 0.16,
      materialOptions: { backlight: night ? 1.4 : 0.9, backlightTint: H.slit, sheen: 0.8 },
    }, ctx.yield);
    act1.add(wheat.object);
    await ctx.yield();

    // the shelterbelt: twelve thrashing cottonwoods and one lit window under them
    {
      const trng = rng.fork('trees'), vars = [];
      for (let i = 0; i < 3; i++) { vars.push(flora.oakGeometry({ rng: trng, height: trng.range(15, 21), detail: 1, flex: 4, fullness: 0.9, leaf: night ? '#22352a' : '#3d5a34', leafLight: '#7f9a56', bark: '#3a332c' })); await ctx.yield(); }
      const parts = [];
      for (let i = 0; i < 12; i++) {
        const g = vars[i % 3].clone(), s = trng.range(0.85, 1.2);
        g.rotateY(trng.range(0, 6.28)); g.scale(s * 0.75, s * 1.3 * trng.range(0.95, 1.15), s * 0.75);
        g.rotateX(-trng.range(8, 12) * DEG); g.rotateZ(-hand * trng.range(0, 3) * DEG);      // cottonwoods leaning downwind
        g.translate(-hand * (62 + i * 14.5 + trng.range(-3, 3)), 0, -236 - i * 5.5 + trng.range(-4, 4)); parts.push(g);
        await ctx.yield();
      }
      const belt = new THREE.Mesh(mergeGeometries(parts), fmat); belt.name = 'shelterbelt';
      for (const g of parts) g.dispose(); for (const g of vars) g.dispose();
      act1.add(belt);
    }
    const herdGeo = F.quadrupedGeometry({ ...F.HERD_PRESETS[grazer] });       // the grazer's body, the one makeHerd would model itself: built here so the herd's own step is shorter
    await ctx.yield();
    // window + two storm chasers on the section road (lights only)
    const lampPos = [[-hand * 128, 2.6, -252]]; for (let i = 0; i < 8; i++) lampPos.push([0, 0.9, ROADZ]);
    const lamps = set1.add(fx.makeGlows({ rng, time: T, positions: lampPos, colors: ['#ffc060', '#f2f5ff', '#f2f5ff', '#ff2a18', '#ff2a18', '#f2f5ff', '#f2f5ff', '#ff2a18', '#ff2a18'],
      size: 4.2, intensity: night ? 4.5 : 2.6, flicker: 0.12, rays: 0.25, fogAmount: 0.45 }));
    const carDir = rng() < 0.5 ? -1 : 1, carGap = rng.range(46, 80), carPhase = rng.range(0, 200);
    const placeCars = (time) => {
      for (let c = 0; c < 2; c++) {
        const x = (((time * 19 + carPhase - c * carGap) % 560) + 560) % 560 - 280, xx = x * carDir, fade = smoothstep(280, 215, Math.abs(x));
        for (let k = 0; k < 2; k++) {
          const zz = ROADZ + (k ? 0.8 : -0.8) + carDir * 1.4;
          lamps.setPosition(1 + c * 4 + k, xx + carDir * 2.3, 0.85, zz); lamps.setSize(1 + c * 4 + k, fade * 0.55);
          lamps.setPosition(3 + c * 4 + k, xx - carDir * 2.3, 0.95, zz); lamps.setSize(3 + c * 4 + k, fade * 0.3);
        }
      }
    };
    placeCars(0);
    await ctx.yield();

    // the herd crossing the horizon light, the birds feeding in the inflow
    const faunaLight = { sunDir: slitDir, sunColor: H.slit, sunIntensity: night ? 3.4 : 3.5 * H.sunI, sky: H.gloom, skyIntensity: night ? 0.6 : 0.4, ground: '#17130c', groundIntensity: 0.25 };
    const fauna = F.makeFauna(scene, { light: faunaLight });
    await ctx.yield();
    const gp = makePath([[0, 0, 0], [0, 0, -200], [0, 0, -400]]), HERDZ = 104;
    const herdN = Math.round(dens * (grazer === 'bison' ? 96 : grazer === 'antelope' ? 76 : 46));
    const herd = fauna.add(F.makeHerd({
      rng: rng.fork('herd'), species: grazer, geometry: herdGeo, count: herdN, mode: 'migrate', gait: 'run', y: 0, light: faunaLight, fill: 0.12,
      size: grazer === 'bison' ? 1.6 : 1.75, rim: 1.6,
      // right to left across the horizon light: the middle of the herd stands on the slit's azimuth as the world opens
      cross: { path: gp, u: 0.03, lead: HERDZ - 0.03 * 400, offset: -76, angle: 90, side: -1, span: 640, height: 0, window: 0.34, bow: 0 }, spread: [24, 104],
    }));
    await ctx.yield();
    const birdAt = path.pointAt(route.uAtY(72));
    const birds = fauna.add(birdKind === 'swifts'
      ? F.makeFlock({ rng: rng.fork('birds'), species: 'swifts', count: Math.round(80 * dens), size: 2.0, light: faunaLight, spread: [46, 26, 70],
        cross: { path, u: route.uAtY(60), lead: 24, angle: 70, side: hand, height: 4, span: 340, duration: DUR } })
      : F.makeFlock({ rng: rng.fork('birds'), species: 'eagles', count: Math.round(11 * dens), size: 2.4, light: faunaLight, center: [birdAt.x - hand * 46, birdAt.y + 6, birdAt.z - 30], radius: 26, soarRadius: 30, soarLift: 16 }));
    await ctx.yield();

    // dust torn off behind the herd, chaff lifting with the camera, the rain veil at the base
    const dust = set1.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time: T, follow: false, center: [-40, 5, -HERDZ - 6], box: [560, 12, 64], count: Math.round(900 * (0.5 + S.dust) * detail),
      size: [1.6, 5.5], colors: night ? ['#3a4c80', '#2a3658', '#5a6890'] : [H.slit, H.haze, '#c8a878'], intensity: night ? 0.25 : 0.55, opacity: 0.12 + 0.1 * S.dust, additive: 0.35, velocity: [-2.5, 0.8, -6], velocityRandom: [2, 0.6, 2], turbulence: [3, 1, 3], twinkle: 0, near: [4, 14] }));
    const chaff = set1.add(fx.makeParticles({ rng: rng.fork('chaff'), preset: 'leaves', time: T, count: Math.round(900 * S.chaff * detail), box: [46, 30, 46],
      velocity: [0.6 * hand, 10, -11], velocityRandom: [3, 4, 3], turbulence: [2.4, 1.6, 2], size: [0.09, 0.26], aspect: 0.35, spin: 5, colors: [S.tip, S.root, S.root], intensity: 0.5 }));
    await ctx.yield();
    const rain = set1.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time: T, count: Math.round(5200 * detail), velocity: [1.5 * hand, -22, -5], colors: ['#8fa6a8', '#c9d8d6', '#7f96a0'] }));
    rain.setOpacity(0);
    await ctx.yield();

    // =================== ACT TWO: the nave ===================
    const hero = await buildHero(ctx, { palette: PALETTE, scrollSpeed: 55 });
    scene.add(hero.object);
    const wallGain0 = H.wallGain * (seasonName === 'dry' ? 1.12 : 1);
    hero.uniforms.uWallGain.value = wallGain0;
    // the hour and the storm type show inside the nave too: what pours down the throat, the stones' ambient, the striation
    const ocU = hero.object.getObjectByName('oculus').material.uniforms;
    {
      const hu = hero.uniforms, oc = ocU;
      hu.uStri.value = S.stri;
      if (hourName === 'dawn') {
        hu.uCream.value.copy(lin('#ffb894')); oc.uIn.value.copy(lin('#ffb08a', 2.5)); oc.uOut.value.copy(lin('#e08a8a', 0.62));
        hu.uPurple.value.copy(lin('#472a52')); hu.uAmbHi.value.lerp(lin('#ffb49c', 0.75), 0.4); hu.uAmbLo.value.lerp(lin('#5a2c50', 0.7), 0.4);
        hu.uTopAt.value = 0.5;
      } else if (!night) {
        hu.uCream.value.copy(lin('#ffdcae', 0.85)); oc.uOut.value.copy(lin('#ffdcae', 0.5));       // afternoon: the light down the throat is gold, and the wall under it stays darker than the oculus
      }
      if (night) {
        hu.uCream.value.copy(lin('#6f8fe0', 0.42)); oc.uIn.value.copy(lin('#b4c8ff', 1.5)); oc.uOut.value.copy(lin('#6f8fe0', 0.26));       // the oculus rim meets the pale top of the wall without an edge
        hu.uPurple.value.copy(lin('#15173a')); hu.uAmbHi.value.multiplyScalar(0.72).lerp(lin('#5a78c8', 0.6), 0.35); hu.uAmbLo.value.multiplyScalar(0.6); hu.uRim.value.multiplyScalar(0.75);
        for (const c of hu.uHeadCol.value) c.multiplyScalar(1.7);            // only the teal glow and the crawling lightning
      }
    }
    const shellParts = hero.object.children.filter((c) => ['vault-wall', 'vault-veil', 'oculus', 'murk-floor'].includes(c.name));
    const veilMesh = hero.object.getObjectByName('vault-veil');
    const ocIn0 = ocU.uIn.value.clone(), ocOut0 = ocU.uOut.value.clone(), dimTop = night ? 0.2 : 0.5;
    await ctx.yield();
    const wallAng = rng.range(0, Math.PI * 2), wallDir = new THREE.Vector3(Math.cos(wallAng), 0, Math.sin(wallAng));
    const localY = (u) => lerp(70, 2760, clamp((u - uIn) / span2, 0, 1.04));
    const driftAt = (u) => { const s = Math.sin(Math.PI * clamp(((u - uIn) / span2 - 0.1) / 0.8, 0, 1)); return 500 * s * s; };
    const uE0 = uIn + 0.42 * span2, uE1 = uIn + 0.8 * span2;          // the channel is born at about u 0.425 and hangs to about u 0.5
    hero.setFocus(localY(uE0 + 0.42 * (uE1 - uE0)));
    const droplets = set2.add(fx.makeParticles({ rng: rng.fork('drops'), preset: 'rain', time: T, count: Math.round(1700 * detail * S.drops), box: [44, 44, 44],
      velocity: [0, 34, 0], velocityRandom: [1.2, 9, 1.2], size: [0.016, 0.034], stretch: 0.035, colors: [PALETTE[3], '#e8fff8', '#8fb8d8'], intensity: 1.1, opacity: 0.32, additive: 0.85 }));
    droplets.setOpacity(0);

    const vehicle = vehicleKind === 'aircraft' ? makeAircraft(rng.fork('plane'), T) : makeBalloon(rng.fork('balloon'), T);
    scene.add(vehicle.object);
    // it crosses where the camera is looking: dead ahead of the gaze (and above it) 40% of the way through its window
    const uV0 = uIn + 0.26 * span2, uV1 = uIn + 0.5 * span2, uVa = uV0 + 0.4 * (uV1 - uV0), vAnchor = path.pointAt(uVa);
    const vSide = path.pointAt(uVa + 0.004).sub(path.pointAt(uVa - 0.004)).setY(0).normalize(), vDir = new THREE.Vector3(-vSide.z, 0, vSide.x).multiplyScalar(rng() < 0.5 ? -1 : 1);
    const vehPos = new THREE.Vector3();
    const vehAt = (u, out) => {
      const s = (u - uV0) / (uV1 - uV0), y = path.pointAt(clamp(u, 0, 1), P0).y;
      if (vehicleKind === 'aircraft') out.copy(vAnchor).addScaledVector(vSide, 330).addScaledVector(vDir, (s - 0.4) * 640).setY(y + lerp(330, 150, s));
      else out.copy(vAnchor).addScaledVector(vSide, 170).addScaledVector(vDir, (s - 0.4) * 70).setY(y + lerp(190, 30, s));
      return out;
    };
    // the anvil is modelled here (no random draws), so the sky below starts a step of its own and the cloud field's step is shorter
    const anvilY = E.y - DOME_H - 30, anvil = makeAnvil(H, T, sunDir, 34000);
    anvil.mesh.position.set(axis.x, anvilY, axis.z);
    await ctx.yield();

    // =================== ACT THREE: above the anvil ===================
    const act3 = new THREE.Group(); act3.name = 'act-three'; scene.add(act3);
    const skyOpts = night
      ? { ...H.sky, bodyOverrides: { 0: { elevation: sunEl, azimuth: sunAz, size: 1.1, phase: 1, glow: 1.0 } } }
      : { ...H.sky, sunElevation: sunEl, sunAzimuth: sunAz, sunSize: 1.0, sunIntensity: 12 };
    const sky = makeSky({ rng, clouds: false, clouds2: false, bake: true, renderer: ctx.renderer, cloudLit: H.anvilLit, cloudShade: H.anvilShade, cloudLightColor: H.lowSun, ...skyOpts });
    scene.add(sky.object);
    await ctx.yield();
    act3.add(anvil.mesh);
    await ctx.yield();
    // turrets of the overshooting dome, fountaining round the place we erupt
    const at = [], crng = rng.fork('crown');
    for (let i = 0; i < 60 && at.length < 11; i++) {
      const a = crng.range(0, Math.PI * 2), r = crng.range(640, 1500), w = crng.range(170, 320) * (0.75 + r / 1700);
      const x = axis.x + Math.cos(a) * r, z = axis.z + Math.sin(a) * r, by = anvilY + anvil.heightAt(r) - w * 0.2;
      if (path.distanceTo(x, by + w * 0.4, z) < w * 0.85 + 30) continue;
      at.push([x, by, z, w]);
    }
    // a few low crowns further out, so the plain has a middle distance (kept off the line to the sun and the portal)
    for (let i = 0; i < 40 && at.length < 22; i++) {
      const a = crng.range(0, Math.PI * 2), r = crng.range(2000, 4200), w = crng.range(380, 620);
      const x = axis.x + Math.cos(a) * r, z = axis.z + Math.sin(a) * r, dx = x - E.x, dz = z - E.z, dl = Math.hypot(dx, dz);
      if ((dx * sunDir.x + dz * sunDir.z) / dl > 0.955) continue;
      at.push([x, anvilY + anvil.heightAt(r) - w * 0.3, z, w]);
    }
    // three towers standing close beside the run-in, alternating sides, so cloud passes close on the way to the portal
    {
      const side = new THREE.Vector3(-route.endDir.z, 0, route.endDir.x), s0 = crng() < 0.5 ? -1 : 1;
      [0.28, 0.55, 0.8].forEach((k, i) => {
        const pp = path.pointAt(uRun + (1 - uRun) * k), w = crng.range(170, 210), lat = (i % 2 ? -s0 : s0) * (0.5 * w + crng.range(18, 26));
        at.push([pp.x + side.x * lat, pp.y + 30 - 1.15 * w, pp.z + side.z * lat, w]);     // tops above the path: the camera flies a canyon of cloud
      });
    }
    const keepOut = [];                                       // the run-in itself stays open: a tube of clear air 13 m in radius
    for (let i = 0; i < 16; i++) { const pp = path.pointAt(uRun - 0.02 + (1.02 - uRun) * (i / 15)); keepOut.push([pp.x, pp.y, pp.z, 13]); }
    await ctx.yield();
    const crown = makeCloudField({ rng, sky, at, avoid: keepOut, height: 0.8, puffs: 40, altitudeJitter: 0, wind: [0.5 * east.x, 0, 0.5 * east.z], silver: 2.2, bump: 1.1 });
    act3.add(crown.object);
    await ctx.yield();
    // the boiling crown round the place we erupt: small turrets rising and subsiding on all sides of the turn
    const turrets = [], brng = rng.fork('boil'), surfAt = (x, z) => anvilY + anvil.heightAt(Math.hypot(x - axis.x, z - axis.z));
    const clearOf = (x, z, w, h, surf) => [0.3, 0.7, 1.1].every((k) => path.distanceTo(x, surf + h * k, z) > 0.75 * w + 40);
    for (let i = 0, want = Math.round(30 * (0.5 + 0.5 * detail)); i < 240 && turrets.length < want; i++) {
      const a = brng.range(0, Math.PI * 2), r = brng.range(130, 580), w = brng.range(60, 130), h = w * brng.range(0.3, 0.85);
      const x = axis.x + Math.cos(a) * r, z = axis.z + Math.sin(a) * r, surf = surfAt(x, z);
      if (clearOf(x, z, w, h, surf)) turrets.push({ x, z, w, h, surf });
    }
    await ctx.yield();
    const boil = makeBoil(brng, H, T, sunDir, turrets, axis, anvilY); act3.add(boil.mesh);
    await ctx.yield();
    const halo = makeHalo(H, T, sunDir, path.end, 7); act3.add(halo.mesh);
    await ctx.yield();
    const tle = makeTLE(rng.fork('tle'), H, T, E, east, anvilY, rare); act3.add(tle.mesh);
    const airliner = makeAirliner(rng.fork('liner'), T, H); act3.add(airliner.object);
    const linerDir = east.clone().multiplyScalar(-1), linerBase = E.clone().addScaledVector(north, 7400).addScaledVector(east, -9000).setY(E.y + 1150);
    airliner.object.rotation.y = Math.atan2(-linerDir.x, -linerDir.z);
    airliner.object.position.copy(linerBase);
    const glitter = set3.add(fx.makeParticles({ rng: rng.fork('glitter'), preset: 'magic', time: T, count: Math.round(4200 * detail), box: [58, 40, 58],
      velocity: [2.2 * east.x, -1.2, 2.2 * east.z], velocityRandom: [1.2, 0.8, 1.2], turbulence: [0.8, 0.5, 0.8], size: [0.07, 0.21], colors: ['#ffffff', H.halo, '#bfe6ff'], intensity: 2.2, twinkle: 0.95 }));
    glitter.setOpacity(0);
    await ctx.yield();
    const shell = makeShell(); scene.add(shell.mesh);
    // where the gaze goes as we erupt: low enough that the anvil's far flank lies under the sprites
    const eastPoint = E.clone().addScaledVector(east, 11000).setY(E.y + (rare ? 2700 : 1050));
    const nwPoint = E.clone().addScaledVector(north, 3600).addScaledVector(east, -5200).setY(anvilY + 260);     // out across the plain, north of the sun
    const tleAt = E.clone().addScaledVector(east, 12200).sub(anvil.mesh.position);
    anvil.uniforms.uTle.value.set(tleAt.x, tleAt.z, 0);

    // ---- the cloud we fly inside: fog density (log scale) and colour keyed to u; the acts hand over where it is thickest ----
    const C = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
    const DM = 0.015, uLift = route.uAtY(14), nv = S.nave;
    const murk = C(night ? '#1c3432' : '#2f4f47'), purple = C(H.plum, night ? 0.8 : 1), pearl = C(H.pearl, H.cream), cream = C(H.creamCol, H.cream), haze3 = C(H.anvilHaze, 0.6);
    const teal = C('#235e5a', night ? 0.8 : 1);
    const KEYS = [
      [0, 0.0016, C(H.haze)], [uLift, 0.0017, C(H.haze)], [uIn - 0.03, 0.005, murk.clone().lerp(C(H.haze), 0.3)], [uIn - 0.006, DM, murk], [uIn + 0.003, DM, murk.clone().lerp(teal, 0.4)],
      [uIn + 0.018, 0.0013 * nv, teal], [uIn + 0.04, 0.0009 * nv, C('#2b5a66').lerp(purple, 0.4)],
      [uIn + 0.26 * span2, 0.001 * nv, purple], [uIn + 0.45 * span2, 0.0007 * nv, purple.clone().lerp(C('#2a5a66'), 0.35)], [uIn + 0.66 * span2, 0.0008 * nv, purple.clone().lerp(pearl, 0.45)], [uIn + 0.86 * span2, 0.0005 * nv, pearl],
      [uOut - 0.02, 0.0012, pearl.clone().lerp(cream, 0.4)], [uOut - 0.006, 0.0016, pearl.clone().lerp(cream, 0.6)], [uOut - 0.001, 0.03, cream.clone().multiplyScalar(0.46)], [uOut + 0.0005, 0.03, cream.clone().multiplyScalar(0.46)], [uOut + 0.016, 2.4e-5, haze3], [1.01, 2.4e-5, haze3],
    ];
    const fogC = scene.fog.color;
    const evalFog = (u) => {
      let i = 0; while (i < KEYS.length - 2 && u >= KEYS[i + 1][0]) i++;
      const A = KEYS[i], B = KEYS[i + 1], t = smoothstep(0, 1, clamp((u - A[0]) / Math.max(1e-6, B[0] - A[0]), 0, 1));
      scene.fog.density = Math.exp(lerp(Math.log(A[1]), Math.log(B[1]), t)); fogC.lerpColors(A[2], B[2], t);
    };

    const camP = new THREE.Vector3(), camW = new THREE.Vector3(), V0 = new THREE.Vector3();
    const wispLo = murkGlow.uniforms.uWisp.value.clone(), boltLo = murkGlow.uniforms.uBolt.value.clone(), wispHi = lin(H.creamCol, 0.42 * Math.max(H.cream, 0.6)), sunHi = lin(H.lowSun, 1.15 * Math.max(H.sunI, 0.75));
    const headCol0 = hero.uniforms.uHeadCol.value.map((c) => c.clone()), ambLo0 = hero.uniforms.uAmbLo.value.clone(), ambHi0 = hero.uniforms.uAmbHi.value.clone(), gazeDir = new THREE.Vector3();
    const rim0 = hero.uniforms.uRim.value.clone(), lookDown = new THREE.Vector3(), lookAhead = new THREE.Vector3(), LA = new THREE.Vector3();
        function update(dt, time, camera, u) {
      T.value = time;
      camera.getWorldPosition(camW);                 // behind a portal only the world matrix is set
      const s2 = (u - uIn) / span2, a = u < uIn ? 0 : u < uOut ? 1 : 2;
      setAct(a); evalFog(u);

      // act one
      const on1 = a === 0;
      act1.visible = on1; storm.mesh.visible = on1;
      if (on1) {
        storm.mesh.position.copy(camW); storm.uniforms.uCam.value.copy(camW);
        storm.uniforms.uFogCol.value.copy(fogC); storm.uniforms.uMurk.value = smoothstep(uIn - 0.045, uIn - 0.004, u);
        const leave = 1 - smoothstep(uIn - 0.02, uIn - 0.002, u);
        placeCars(time); wheat.update(dt, time, camera);
        chaff.setOpacity((0.4 + 0.6 * smoothstep(uLift * 0.4, uLift, u)) * leave);
        rain.setOpacity(Math.min(1, S.rain) * smoothstep(uLift, uIn * 0.8, u) * leave);
        set1.update(dt, time, camera);
      }
      fauna.update(dt, time, camera, u, on1);
      // the cloud between the acts: wisps and slow violet swells, on both sides of the swap
      // (and again at the top, as cream wisps with the low sun already glowing through them)
      const mgLo = smoothstep(uIn - 0.05, uIn - 0.012, u) * (1 - smoothstep(uIn + 0.02, uIn + 0.07, u));
      const mgHi = smoothstep(uOut - 0.055, uOut - 0.02, u) * (1 - smoothstep(uOut + 0.001, uOut + 0.012, u)), mg = Math.max(mgLo, mgHi);
      murkGlow.mesh.visible = mg > 0.003; murkGlow.uniforms.uAmt.value = mg;
      if (mg > 0.003) {
        const top = mgHi > mgLo, mu = murkGlow.uniforms;
        mu.uWisp.value.copy(top ? wispHi : wispLo); mu.uBolt.value.copy(top ? V0 : boltLo); mu.uSun.value.copy(top ? sunHi : V0);
        // the first slow discharge: a violet swell deep in the cloud ahead, rising as we enter and handed on to the wall as it clears
        camera.getWorldDirection(gazeDir); mu.uGaze.value.copy(gazeDir).lerp(V0.set(0, 1, 0), 0.25).normalize(); V0.set(0, 0, 0);
        mu.uSunDir.value.copy(gazeDir).multiplyScalar(0.45).add(V0.set(0, 1, 0)).normalize(); V0.set(0, 0, 0);   // the cloud top is brightest overhead
        mu.uSurge.value = top ? 0 : smoothstep(uIn - 0.03, uIn + 0.004, u) * (1 - smoothstep(uIn + 0.012, uIn + 0.05, u)) * (0.8 + 0.2 * Math.sin(time * 1.3));
        murkGlow.mesh.position.copy(camW); murkGlow.mesh.scale.setScalar(camera.far * 0.5);
      }

      // act two: the vault is slid down past the climbing camera, so the nave plays at full height.
      // The first pea-sized stones and the droplets are already round the lens before the walls arrive.
      const on2 = a === 1, stonesOn = (u > uIn - 0.03 && u < uOut + 0.02);
      hero.object.visible = stonesOn;
      for (const m of shellParts) m.visible = on2 && (m !== veilMesh || S.veil);
      if (stonesOn) {
        path.pointAt(u, camP);
        const m = driftAt(u);
        hero.object.position.set(axis.x - wallDir.x * m, camP.y - localY(u), axis.z - wallDir.z * m);
        hero.setProgress(clamp((u - uE0) / (uE1 - uE0), 0, 1));
        hero.setGrowth(0.2 + 0.8 * clamp(s2 / 0.82, 0, 1));                 // peas big enough to glint beside the lens from the first moment
        hero.setFall(smoothstep(0.9, 1.0, s2));                                // the herd stalls and falls away while the gaze tips down to watch
        hero.uniforms.uRim.value.copy(rim0).multiplyScalar(lerp(2.4, 1, smoothstep(0.0, 0.14, s2)));   // the first peas glint round the lens
        const fx1 = (s2 - 0.11) / 0.085, first = 1 + 1.05 * Math.exp(-fx1 * fx1);         // the first slow discharge shows the scale of the vault
        for (let i = 2; i < 5; i++) hero.uniforms.uHeadCol.value[i].copy(headCol0[i]).multiplyScalar(first);
        const high = smoothstep(0.62, 0.86, s2);                                // against the cream light the stones stand darker, as silhouettes
        hero.uniforms.uAmbLo.value.copy(ambLo0).multiplyScalar(1 - 0.34 * high); hero.uniforms.uAmbHi.value.copy(ambHi0).multiplyScalar(1 - 0.16 * high);
        ocU.uIn.value.copy(ocIn0).multiplyScalar(lerp(1, 0.3, smoothstep(0.58, 0.9, s2)));
        hero.uniforms.uWallGain.value = wallGain0 * lerp(1.9, 1, smoothstep(0, 0.22, s2)) * (1 - dimTop * high);
        ocU.uOut.value.copy(ocOut0).multiplyScalar(1 - dimTop * high);                 // the rim of the oculus still meets the top of the wall without an edge   // the glow carries through what fog is left; the pale throat stays darker than the light   // close under the oculus its swirl must read, not clip
        hero.uniforms.uBack.value.set(fogC.r, fogC.g, fogC.b);
        hero.update(dt, time, camera);
      }
      const dropsOn = u > uIn - 0.03 && u < uOut + 0.02;
      set2.object.visible = dropsOn;
      if (dropsOn) { droplets.setOpacity(smoothstep(uIn - 0.03, uIn, u) * (1 - smoothstep(uOut + 0.002, uOut + 0.02, u))); set2.update(dt, time, camera); }
      const sv = (u - uV0) / (uV1 - uV0), vOn = on2 && sv > -0.7 && sv < 1.9;
      vehicle.object.visible = vOn;
      if (vOn) { vehAt(u, vehicle.object.position); vehicle.update(time, vDir); }

      // act three
      const on3 = a === 2;
      act3.visible = on3; sky.object.visible = on3; set3.object.visible = on3;
      const so = on3 ? 1 - smoothstep(uOut + 0.0005, uOut + 0.012, u) : 0;
      shell.mesh.visible = so > 0.003;
      if (on3) {
        sky.update(dt, time, camera);
        shell.mat.opacity = so; shell.mat.color.copy(fogC); shell.mesh.position.copy(camW); shell.mesh.scale.setScalar(camera.far * 0.8);
        halo.update(camW); halo.uniforms.uAmt.value = 0.3 * smoothstep(uOut + 0.02, uOut + 0.08, u) + 0.7 * smoothstep(uOut + 0.08, uRun + 0.09, u);   // the ring first ...
        halo.uniforms.uDogs.value = smoothstep(uRun + 0.03, uRun + 0.13, u);                       // ... then the dogs, the arc and the pillar
        tle.uniforms.uShow.value = smoothstep(uOut + 0.006, uOut + 0.035, u); tle.uniforms.uGiant.value = smoothstep(uOut + 0.004, uOut + 0.09, u);
        crown.update(dt, time, camera); boil.update(camW);
        anvil.uniforms.uTle.value.z = (night ? 0.16 : 0.4) * tle.uniforms.uShow.value * (0.65 + 0.35 * Math.sin(time * 0.8));
        airliner.object.position.copy(linerBase).addScaledVector(linerDir, (u - uOut) * 36000 + time * 12);   // it reaches the sun dog at about u 0.9 and flies on into the halo
        glitter.setOpacity(smoothstep(uOut + 0.02, uOut + 0.08, u) * (0.45 + 0.55 * smoothstep(uRun + 0.04, uRun + 0.13, u)));   // diamond dust thickens into the eclipse
        set3.update(dt, time, camera);
      }
    }

    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    // speed against the average: slow over the wheat, a surge as the ground lets go, a held breath for the Illumination,
    // quick through the turn above the anvil, unhurried into the portal
    const bump = (u, c, w) => { const x = (u - c) / w; return Math.exp(-x * x); };
    const pace = (u) => 0.95 - 0.2 * (1 - smoothstep(uLift * 0.6, uLift * 1.3, u)) + 0.55 * bump(u, (uLift + uIn) * 0.5 + 0.01, 0.045)
      - 0.24 * bump(u, uE0 + 0.5 * (uE1 - uE0), 0.09) + 0.45 * bump(u, uOut + 0.1, 0.06) + 0.28 * smoothstep(uOut + 0.03, uOut + 0.1, u) * (1 - smoothstep(0.82, 0.9, u)) + 0.05 * smoothstep(0.85, 0.9, u);

    return {
      scene, path, duration: DUR, pace,
      ride: 'none',
      camera: { fov: 62, near: 0.4, nearThrough: 0.4, far: 42000, lookAhead: 30, sway: 0.8, bank: 0.6 },
      pois: [
        { at: (time, u) => vehAt(u, vehPos), from: uV0, to: uV1, weight: 0.66 },
        // the herd stalls: the gaze tips down across the throat to watch it arc outward and fall
        { at: (time, u) => { path.pointAt(u, LA); return lookDown.set(axis.x + (axis.x - LA.x) * 2.2, LA.y - 300, axis.z + (axis.z - LA.z) * 2.2); }, from: uOut - 0.08, to: uOut - 0.006, weight: 0.7, fade: 0.4 },
        { at: eastPoint, from: uOut - 0.012, to: uOut + 0.075, weight: 0.9, fade: 0.25 },
        // through the turn the gaze lies level along the heading, on the plain two and a half kilometres out
        { at: (time, u) => { path.pointAt(u, LA); path.pointAt(Math.min(1, u + 0.012), lookAhead).sub(LA).setY(0).normalize().multiplyScalar(2500).add(LA); lookAhead.y = anvilY + 120; return lookAhead; }, from: uOut + 0.045, to: uRun - 0.02, weight: 0.74, fade: 0.3 },
        { at: nwPoint, from: uRun - 0.07, to: uRun + 0.05, weight: 0.7, fade: 0.35 },
        { at: airliner.object.position, from: uOut + 0.07, to: uRun + 0.04, weight: 0.3 },
        { at: path.end, from: uRun + 0.03, to: 0.9, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, color: H.portal, glow: 1.8, revealDistance: 300 },
      post: {
        exposure: 1.0, bloom: { strength: 0.55, radius: 0.7, threshold: 0.9 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#05081a', vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { sky.dispose(); },
    };
  },
};
