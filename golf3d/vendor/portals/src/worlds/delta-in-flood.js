// THE FLOOD COMES TO THE DELTA
// The Okavango at peak flood. World space is the hero's local space (src/parts/delta-in-flood.js): bed y = 0,
// water y = 0.3, the flight heads +Z, the sun stands on +X (our left), the herd runs +Z on our left.
//
// Flight (u): 0.00 level at 26 m over the papyrus swamp: thousands of round umbels lit on their sun side, the
// blue-black channel running up the entry axis to the first palm island, the herd's spray to the left of it
// -> 0.08-0.20 the stoop to 2.2 m -> 0.20-0.47 THE CHANNEL: papyrus walls 6 m tall 10 m either side, the left
// one backlit and throwing its shadow across the water, both mirrored in it; a kingfisher's plunge 6 m ahead
// (0.2435), the hippo bay on the right (surfacing, blow 0.2975, yawn 0.29-0.353), the fish eagle calling from
// the snag on the crocodile's bar (0.33-0.40), the crocodile and its V wake (0.354 on), saddle-billed storks
// on the left while egrets and ducks go up from the margins 24-34 m ahead of us (0.36-0.47, a dozen egrets
// in the frame at 0.40) -> 0.47-0.57 THE BURST onto the plain, elephants wading on the right, the curtain
// ahead-left -> 0.49-0.885 THE PACE 20 m off the herd's flank, gaze turned 33 degrees left into the light:
// dark lechwe against a billowed wall of white-gold spray (for an ordinary visit the herd's clock is nudged
// so that two or three rams stand whole between the left third and the centre at u 0.70) -> 0.80-0.878 the
// hippos' road from the pool, one yawning, the fish eagle's strike 11 m ahead (0.835) -> 0.86-1 a right turn
// and the climb over the exit island into the portal between two leaning fan palms; the eagle lands on one
// (0.932). Rare visit: the herd wheels right across our line and we fly through its curtain in a gold veil
// (u ~0.73-0.82). pace(u): slower over the swamp at the entry and beside the herd, quicker down the channel.
//
// Colour: the grade (ACES, saturation, contrast) drops anything under about 0.05 linear to black and takes
// the blue out of dark greens with it. So papyrus, canopy and sedge carry a small constant floor of light
// (papFloor per look): shade stays dark olive, never black, and the greens stay soft.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import * as SKY from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/delta-in-flood.js';

const PALETTE = ['#B9B45A', '#6E9440', '#1F4E7A', '#9CC3E0', '#FFF1CF', '#A85A2A', '#22301F'];
const TAU = Math.PI * 2, WY = 0.3, DURATION = 42;
const C = (h) => new THREE.Color(h);
const WYS = WY.toFixed(2);

// ---------------------------------------------------------------------------------------------------------
// The looks. The sun keeps its bearing (square on the left); only its height and colour change.
// curtain / crown: how hard the sun burns in the herd's spray; hide: fill on the animals' shadow side.
const LOOKS = {
  afternoon: { preset: 'day', sunEl: 24, sun: '#fff0cc', sunI: 3.5, zenith: '#3d7cc4', mid: '#8bb3d8', horizon: '#d6cab0', ground: '#74845e', scatter: '#ffe6c0', scatterK: 0.22, scatterPow: 7,
    fog: '#bfcad0', fogD: 0.00072, amb: '#9cc0e4', ambI: 0.95, groundLight: '#8c9460', exposure: 1.0, bloom: 0.22, sat: 1.12, contrast: 1.09, tint: '#fffaf0', shadowTint: '#06101c',
    cloud: 0.36, cloudLit: '#fff6e6', cloudShade: '#8ea2bd', papGold: '#908f4e', papFloor: [0.05, 0.06, 0.062], mirror: '#8fbde2', mirrorK: 0.86, spray: 1.0, glit: 1.0, curtain: 0.46, crown: 0.8, sunDisc: 10 },
  golden: { preset: 'goldenHour', sunEl: 9, sun: '#ffbe74', sunI: 3.0, zenith: '#4470ac', mid: '#9aa6ba', horizon: '#e8b47c', ground: '#86744f', scatter: '#ffa864', scatterK: 0.6, scatterPow: 5,
    fog: '#d4ae84', fogD: 0.00105, amb: '#8fa5cf', ambI: 0.95, groundLight: '#9a8050', exposure: 1.02, bloom: 0.46, sat: 1.1, contrast: 1.08, tint: '#fff2e0', shadowTint: '#0a0e20',
    cloud: 0.42, cloudLit: '#ffd9a8', cloudShade: '#8c88a4', papGold: '#948e4e', papFloor: [0.062, 0.068, 0.068], mirror: '#93a2c6', mirrorK: 0.8, spray: 0.92, glit: 1.2, curtain: 0.56, crown: 0.85, sunDisc: 9 },
  dawn: { preset: 'dawn', sunEl: 7, sun: '#ffb9a2', sunI: 2.3, zenith: '#6d86b6', mid: '#aba8c4', horizon: '#e4b9b0', ground: '#868090', scatter: '#ffae9a', scatterK: 0.55, scatterPow: 5,
    fog: '#c6b2b9', fogD: 0.00115, amb: '#a3acd0', ambI: 1.0, groundLight: '#8f8890', exposure: 1.08, bloom: 0.42, sat: 1.04, contrast: 1.07, tint: '#fff4f2', shadowTint: '#0c1024',
    cloud: 0.3, cloudLit: '#ffd6cc', cloudShade: '#8a8eae', papGold: '#908f56', papFloor: [0.056, 0.064, 0.066], mirror: '#a2aad2', mirrorK: 0.82, spray: 0.95, glit: 0.9, curtain: 0.7, crown: 1.1, sunDisc: 8, mist: 1 },
  night: { preset: 'night', sunEl: 32, sun: '#a9bde6', sunI: 0.8, zenith: '#030816', mid: '#0a1836', horizon: '#16305c', ground: '#060c18', scatter: '#5f7fc0', scatterK: 0, scatterPow: 5,
    fog: '#101d3a', fogD: 0.0011, amb: '#3a5aa8', ambI: 2.9, groundLight: '#1c2a52', exposure: 1.75, bloom: 0.5, sat: 0.96, contrast: 1.06, tint: '#eef2ff', shadowTint: '#02040c',
    cloud: 0.25, cloudLit: '#8398cc', cloudShade: '#182446', papGold: '#8fa2c8', papFloor: [0.02, 0.026, 0.036], mirror: '#2a4a86', mirrorK: 1.0, spray: 1.25, glit: 1.6, curtain: 1.1, crown: 1.6, sunDisc: 0, night: 1 },
};

// ---------------------------------------------------------------------------------------------------------
// GLSL shared by every material of this world: value noise, the one cloud shadow, and the shadow the papyrus
// walls throw (a baked map of how high the shade stands above the water at every point of the swamp).
const NOISE_GLSL = /* glsl */`
float dh21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float dvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(dh21(i), dh21(i + vec2(1., 0.)), f.x), mix(dh21(i + vec2(0., 1.)), dh21(i + vec2(1., 1.)), f.x), f.y); }
float dfbm(vec2 p){ return dvn(p) * .55 + dvn(p * 2.13 + 7.1) * .3 + dvn(p * 4.31 - 3.7) * .15; }
uniform vec4 uCloud;   // x 1/size, y z drift (m), w strength
uniform vec4 uBox;     // x0, z0, 1/width, 1/depth of the baked rectangle
uniform sampler2D uShade;
float cloudSh(vec2 xz){ vec2 q = (xz + uCloud.yz) * uCloud.x; return 1. - uCloud.w * smoothstep(.5, .7, dvn(q) * .62 + dvn(q * 2.2 + 3.) * .38); }
// the sun that reaches a point: cloud shadow times the papyrus walls' shadow (which stands a known height above the water)
float sunAt(vec3 w){
  vec2 muv = (w.xz - uBox.xy) * uBox.zw; vec2 e = step(vec2(0.), muv) * step(muv, vec2(1.));
  float h = mix(-1., textureLod(uShade, clamp(muv, .003, .997), 0.).r * 9. - 1., e.x * e.y);
  return cloudSh(w.xz) * smoothstep(h - .9, h + .9, w.y - ${WYS});
}
`;
const FOG_V = '#include <common>\n#include <fog_pars_vertex>\n', FOG_F = '#include <common>\n#include <fog_pars_fragment>\n';
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// ---------------------------------------------------------------------------------------------------------
// Papyrus atlas (1024 x 1024, v = 0 at the top row): [0..0.5]^2 one umbel of fine rays, the right half of the
// top a solid block for the culms, the bottom half two stands of culms and mops for the cards further back.
async function papyrusTexture(rng, pause) {
  const S = 1024, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.clearRect(0, 0, S, S);
  const umbel = (cx, cy, R, n, lw, core) => {
    const gr = g.createRadialGradient(cx, cy, 0, cx, cy, R * 0.6); gr.addColorStop(0, `rgba(92,92,92,${core})`); gr.addColorStop(0.3, `rgba(124,124,124,${core * 0.6})`); gr.addColorStop(0.65, `rgba(156,156,156,${core * 0.22})`); gr.addColorStop(1, 'rgba(190,190,190,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R * 0.6, 0, TAU); g.fill();
    g.lineCap = 'round';
    const lobes = rng.int(8, 11), lph = rng() * TAU;                                  // the rays stand in bundles: a starburst, not a disc
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + rng.range(-0.06, 0.06), lobe = Math.pow(0.5 + 0.5 * Math.cos(a * lobes + lph), 0.6);
      const len = R * (0.5 + 0.5 * lobe) * rng.range(0.74, 1) * (0.88 + 0.12 * Math.sin(a)), droop = R * 0.2 * rng.range(0.3, 1), v = Math.round(rng.range(150, 255) * (0.8 + 0.2 * lobe));
      const ex = cx + Math.cos(a) * len, ey = cy - Math.sin(a) * len * 0.92 + droop;
      g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = lw * rng.range(0.7, 1.2);
      g.beginPath(); g.moveTo(cx, cy); g.quadraticCurveTo(cx + Math.cos(a) * len * 0.55, cy - Math.sin(a) * len * 0.62, ex, ey); g.stroke();
    }
  };
  umbel(256, 244, 240, 120, 4.2, 0.62);
  await pause();
  g.fillStyle = '#ffffff'; g.fillRect(516, 4, 504, 504);
  // stands: a dark dense foot, then culms fanning out, each carrying its own round mop against the sky
  for (let half = 0; half < 2; half++) {
    const x0 = half * 512, base = S - 1;
    const gr = g.createLinearGradient(0, base, 0, base - 250); gr.addColorStop(0, 'rgba(66,66,66,1)'); gr.addColorStop(0.3, 'rgba(80,80,80,0.8)'); gr.addColorStop(0.55, 'rgba(90,90,90,0.34)'); gr.addColorStop(1, 'rgba(96,96,96,0)');
    g.fillStyle = gr; g.fillRect(x0 + 20, base - 250, 472, 251);
    const tops = [];
    for (let i = 0; i < 11; i++) {
      const bx = x0 + 70 + ((i + rng()) / 11) * 372, lean = rng.range(-80, 80), h = rng.range(270, 430), tx = clamp(bx + lean, x0 + 78, x0 + 434), ty = base - h, v = Math.round(rng.range(74, 118));
      g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = rng.range(8, 12); g.lineCap = 'butt';
      g.beginPath(); g.moveTo(bx, base); g.quadraticCurveTo(bx + lean * 0.2, base - h * 0.6, tx, ty); g.stroke();
      tops.push([tx, ty]);
    }
    tops.sort((a, b) => a[1] - b[1]);
    for (const [tx, ty] of tops) { umbel(tx, Math.max(ty, 512 + 78), rng.range(56, 74), 40, 5.0, 0.7); await pause(); }
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return tex;
}

// one clump of culms with mop heads (near the path), and the crossed cards used further back
function papyrusGeometries(rng) {
  const mk = () => ({ p: [], uv: [], w: [], c: [], idx: [] });
  const fin = (G) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(G.p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(G.uv, 2)); g.setAttribute('aW', new THREE.Float32BufferAttribute(G.w, 4)); g.setAttribute('aC', new THREE.Float32BufferAttribute(G.c, 3)); g.setIndex(G.idx); return g; };
  const V = (G, x, y, z, u, v, sway, kind, ph, lit, cx = 0, cy = 1, cz = 0) => { G.p.push(x, y, z); G.uv.push(u, v); G.w.push(sway, kind, ph, lit); G.c.push(cx, cy, cz); return G.p.length / 3 - 1; };
  const quad = (G, a, b, c, d) => G.idx.push(a, b, c, a, c, d);
  const clump = (n) => {
    const G = mk();
    for (let k = 0; k < n; k++) {
      const a = (k / n) * TAU + rng.range(-0.4, 0.4), outer = k === 0 ? 0 : rng.range(0.35, 1), br = 0.55 * outer, lean = 0.06 + 0.3 * outer * rng.range(0.5, 1.2), h = rng.range(4.1, 5.1) * (1 - 0.1 * outer), ph = rng();
      const bx = Math.cos(a) * br, bz = Math.sin(a) * br, dx = Math.cos(a) * Math.sin(lean), dz = Math.sin(a) * Math.sin(lean);
      const at = (t) => [bx + dx * h * t * (0.45 + 0.55 * t), h * t * Math.cos(lean * t), bz + dz * h * t * (0.45 + 0.55 * t)];
      const rows = [];
      [0, 0.55, 1].forEach((t, ri) => {
        const c = at(t), r = [0.066, 0.05, 0.028][ri], row = [];
        for (let j = 0; j < 3; j++) { const b = a + (j / 3) * TAU; row.push(V(G, c[0] + Math.cos(b) * r, c[1], c[2] + Math.sin(b) * r, 0.75, 0.25, t * t, 0, ph, 0.25 + 0.75 * t)); }
        rows.push(row);
      });
      for (let ri = 0; ri < 2; ri++) for (let j = 0; j < 3; j++) quad(G, rows[ri][j], rows[ri][(j + 1) % 3], rows[ri + 1][(j + 1) % 3], rows[ri + 1][j]);
      const top = at(1), s = rng.range(0.6, 0.82), cy = top[1] + s * 0.05, ya = rng() * TAU;
      for (let q = 0; q < 3; q++) {
        const ids = [];
        for (const [ux, uy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          let x, y, z, rx, ry, rz;
          if (q < 2) { const b = ya + q * Math.PI * 0.5; rx = Math.cos(b) * ux; rz = Math.sin(b) * ux; ry = uy; }
          else { rx = ux * 0.92; rz = uy * 0.92; ry = 0.08; }
          x = top[0] + rx * s; z = top[2] + rz * s; y = cy + ry * s;
          ids.push(V(G, x, y, z, 0.25 + ux * 0.232, 0.238 - uy * 0.232, 1, 1, ph, 1, rx, ry, rz));
        }
        quad(G, ids[0], ids[1], ids[2], ids[3]);
      }
    }
    return fin(G);
  };
  const card = () => {
    const G = mk(), W = 3.4, H = 6.4;
    for (let q = 0; q < 2; q++) {
      const b = q * Math.PI * 0.5 + 0.3, cx = Math.cos(b) * W, cz = Math.sin(b) * W, u0 = q * 0.5, ph = rng();
      const ids = [V(G, -cx, 0, -cz, u0 + 0.01, 0.998, 0, 2, ph, 0), V(G, cx, 0, cz, u0 + 0.49, 0.998, 0, 2, ph, 0), V(G, cx, H, cz, u0 + 0.49, 0.502, 1, 2, ph, 1), V(G, -cx, H, -cz, u0 + 0.01, 0.502, 1, 2, ph, 1)];
      quad(G, ids[0], ids[1], ids[2], ids[3]);
    }
    return fin(G);
  };
  return { clumpA: clump(8), clumpB: clump(7), card: card() };
}

// papyrus material: sway and slipstream in the vertex shader; every mop is shaded as a ball (lit on its sun side,
// olive in its own shade) and glows gold when the sun stands behind it. Seen from high above, the cards sink
// under the canopy sheet, which then carries the beds.
const PAP_VERT = FOG_V + /* glsl */`
attribute vec4 aW, iP, iQ;                 // aW: sway 0..1, kind (0 culm 1 head 2 card), phase, height light | iP: x z yaw scale | iQ: seed tint heightK -
attribute vec3 aC;                         // heads: where this corner lies on its mop, from the mop's centre (-1..1)
uniform float uTime, uHigh; uniform vec4 uWind;   // uWind: x dir x, y dir z, z strength, w gust speed | uHigh: 1 when the eye is far above the beds
uniform vec4 uSlip;                        // xyz: a point just behind the eye, w strength
varying vec2 vUv; varying vec3 vWorld, vRel; varying vec4 vInfo;
void main(){
  float c = cos(iP.z), s = sin(iP.z);
  vec3 p = position * vec3(iP.w, iP.w * iQ.z, iP.w);
  if(aW.y > 1.5) p.y *= 1. - .34 * uHigh;
  p.xz = vec2(p.x * c + p.z * s, p.z * c - p.x * s);
  vec3 w = vec3(iP.x, ${WYS} - .12, iP.y) + p;
  float sw = aW.x, ph = aW.z * 6.283 + iQ.x * 40.;
  float gust = sin(dot(w.xz, uWind.xy) * .055 - uTime * uWind.w * 1.25 + sin(w.z * .021 + w.x * .013) * 2.) * .5 + .5;
  float amp = uWind.z * (.25 + .75 * gust * gust);
  vec2 d = uWind.xy * amp * (.38 + .16 * sin(uTime * 1.7 + ph)) + vec2(sin(uTime * 2.3 + ph), cos(uTime * 1.9 + ph * 1.3)) * (.07 + .09 * amp);
  vec2 away = w.xz - uSlip.xz; float ad = length(away);
  d += away / max(ad, .5) * uSlip.w * exp(-ad * ad * .0042) * (1. - smoothstep(4., 12., abs(w.y - uSlip.y)));
  w.xz += d * sw * iP.w; w.y -= dot(d, d) * sw * .12;
  vUv = uv; vWorld = w; vInfo = vec4(aW.y, aW.w, iQ.x, iQ.y);
  vRel = vec3(aC.x * c + aC.z * s, aC.y, aC.z * c - aC.x * s);
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// uCulm, uGreen, uGold are albedos: the culm's olive, a mop in shade, a mop in the sun (straw gold-green).
// uFloor is the light that is always there inside a stand (sky through the gaps, green off the neighbours): the
// grade crushes anything darker to black and takes the blue out of the greens with it.
const PAP_LIGHT = /* glsl */`
vec3 papShade(vec3 fill, vec3 sun){ return (mix(fill, vec3(dot(fill, vec3(.3, .5, .2))), .5) * 2.2 + mix(sun, vec3(dot(sun, vec3(.3, .5, .2))), .55) * .25) * .3183; }`;
const PAP_FRAG = FOG_F + NOISE_GLSL + PAP_LIGHT + /* glsl */`
uniform sampler2D uMap; uniform vec3 uSunDir, uSunCol, uSkyCol, uCulm, uGreen, uGold, uFloor;
varying vec2 vUv; varying vec3 vWorld, vRel; varying vec4 vInfo;
void main(){
  vec4 t = texture2D(uMap, vUv);
  vec3 Vp = cameraPosition - vWorld; float dist = length(Vp);
  if(t.a < mix(.4, .15, smoothstep(10., 70., dist))) discard;
  vec3 V = Vp / max(dist, 1e-3);
  float kind = vInfo.x, cl = sunAt(vWorld), toSun = max(dot(-V, uSunDir), 0.), side = dot(V.xz, uSunDir.xz) * .5 + .5;
  float tone = .82 + .36 * dh21(vec2(vInfo.z * 91.7, 3.1)), lum = .52 + .6 * t.r * t.r;
  vec3 shL = papShade(uSkyCol, uSunCol), sunL = uSunCol * .3183 * cl;
  float trans = toSun * (.25 + 1.5 * toSun * toSun);                         // forward light through the fine rays
  vec3 c;
  if(kind < .5){                                   // culm: olive where the sun reaches it, dark green in the foot of the stand
    c = uCulm * tone * (shL * (.26 + .74 * vInfo.y) + sunL * (.1 + .7 * side) * (.25 + .75 * vInfo.y) * .8);
  } else if(kind < 1.5){                           // a mop of rays, shaded as a ball
    vec3 N = normalize(vRel + vec3(0., .3, 0.));
    float k = smoothstep(-.35, .75, dot(N, uSunDir));
    vec3 alb = mix(uGreen, uGold, k) * tone * lum;
    c = alb * (shL * (.78 + .22 * N.y) + sunL * (.08 + k * .72 + trans * .75)) + uGold * sunL * trans * .3 * lum;
  } else {                                         // a stand on a card
    float h = 1. - smoothstep(.52, .98, vUv.y), mop = smoothstep(.25, .8, h) * smoothstep(.35, .75, t.r);
    float st = dvn(vec2(vUv.x * 110. + (1. - vUv.y) * 5., vInfo.z * 37.));   // the stand is culms, light and dark, with air between them higher up: never a slab
    if(mop < .3 && st < .56 * smoothstep(.1, .55, h) * (1. - smoothstep(30., 70., dist))) discard;
    tone *= .62 + .76 * st;
    vec3 alb = mix(mix(uCulm, uGreen * .8, .2 + .5 * h), mix(uGreen, uGold, .2 + .6 * side), mop) * tone * lum;
    c = alb * (shL * (.42 + .58 * h) + sunL * (.12 + .74 * side) * (.3 + .7 * h) * .8 + sunL * trans * mop * .75) + uGold * sunL * trans * mop * .26 * lum;
  }
  gl_FragColor = vec4(c + uFloor, 1.);
  #include <fog_fragment>
}`;

// the top of the papyrus beds seen from above: thousands of round rayed umbels 0.8 m apart, each lit on its sun
// side, a lower storey showing between them with parallax, dark olive between; on a sheet at mop height cut out
// by the bed mask. Where a head would be smaller than a few pixels the pattern melts to its mean.
const MASK_GLSL = /* glsl */`
uniform sampler2D uMask;   // r water depth / 4 m, g papyrus signed distance (-16..16 m), b grass on the plain, a lily rafts; plain defaults outside
vec4 maskAt(vec2 p){
  vec2 muv = (p - uBox.xy) * uBox.zw; vec4 m = texture2D(uMask, clamp(muv, .003, .997));
  vec2 e = smoothstep(vec2(0.), vec2(.02), muv) * (1. - smoothstep(vec2(.98), vec2(1.), muv));
  return mix(vec4(.075, 0., .8, 0.), m, e.x * e.y);
}
float sdLod(vec2 p){ vec2 muv = (p - uBox.xy) * uBox.zw; return textureLod(uMask, clamp(muv, .003, .997), 0.).g * 32. - 16.; }`;
const CANOPY_VERT = FOG_V + /* glsl */`
varying vec3 vWorld;
void main(){ vWorld = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CANOPY_FRAG = FOG_F + NOISE_GLSL + MASK_GLSL + PAP_LIGHT + /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uCulm, uGreen, uGold, uFloor; uniform float uTime; uniform vec4 uWind;
varying vec3 vWorld;
// one round umbel in its cell: returns how surely this point is on it; nrm is the dome's normal, info = (hash, ray, r / R)
float mopAt(vec2 q, float so, float soft, out vec3 nrm, out vec3 info){
  vec2 ci = floor(q), cf = fract(q) - .5; float hs = dh21(ci + so);
  vec2 a = cf - (vec2(dh21(ci + so + 1.3), dh21(ci + so + 8.1)) - .5) * .36;
  float R = .35 + .13 * hs, r = length(a);
  float ang = atan(a.y, a.x + (abs(a.x) + abs(a.y) < 1e-5 ? 1e-4 : 0.));
  float ray = .5 + .5 * sin(ang * 11. + hs * 40.);
  float edge = R * (.78 + .22 * ray * (1. - soft)), k = clamp(r / R, 0., 1.), dome = sqrt(max(1. - k * k, 0.));
  nrm = normalize(vec3(a.x, R * (.22 + dome), a.y));
  info = vec3(hs, ray, k);
  return 1. - smoothstep(edge - .05 - .12 * soft, edge + .04 * soft, r);
}
void main(){
  vec2 p = vWorld.xz; float sd = maskAt(p).g * 32. - 16.;
  if(sd - 2.4 + 2.2 * (dvn(p * .37) - .5) < 0.) discard;
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  float gust = sin(dot(p, uWind.xy) * .055 - uTime * uWind.w * 1.25 + sin(p.y * .021 + p.x * .013) * 2.) * .5 + .5;
  vec2 warp = (vec2(dvn(p * .17), dvn(p * .17 + 7.3)) - .5) * 3.2 + (vec2(dvn(p * .71 + 3.1), dvn(p * .71 + 11.)) - .5) * .7;   // no rows: the lattice is bent out of sight
  vec2 q = p * 1.25 + uWind.xy * gust * .2 + warp;
  vec2 dqx = dFdx(q), dqy = dFdy(q); float fa = length(dqx), fb = length(dqy), px = sqrt(max(fa, fb) * min(fa, fb) + 1e-8);   // cells to a pixel: the mean of the footprint's long and short axes, so the heads last out to a hundred metres
  float soft = smoothstep(.1, .4, px), melt = max(max(smoothstep(.34, .95, px), smoothstep(1.3, 2.6, max(fa, fb))), smoothstep(80., 135., dist));
  vec2 pb = p - V.xz / max(V.y, .3) * .5, qb0 = pb * 1.25 + uWind.xy * gust * .14 + warp;   // the lower storey, half a metre down
  vec2 qb = vec2(qb0.x * .8 - qb0.y * .6, qb0.x * .6 + qb0.y * .8) * 1.07 + vec2(.5, 17.3);
  vec3 nA, nB, iA, iB; float cA = mopAt(q, 2.7, soft, nA, iA), cB = mopAt(qb, 31.4, soft, nB, iB);
  float cl = cloudSh(p), toSun = max(dot(-V, uSunDir), 0.), back = toSun * toSun * .5;
  vec3 shL = papShade(uSkyCol, uSunCol), sunL = uSunCol * .3183 * cl;
  float kA = smoothstep(-.6, .5, dot(nA, uSunDir)), kB = smoothstep(-.6, .5, dot(nB, uSunDir));
  float tus = dvn(p * .27 + 5.), tusk = .78 + .44 * tus;                                 // tussocks: the bed stands in clumps a few metres across
  vec3 hA = mix(uGreen, uGold, kA) * (.86 + .28 * iA.x) * (1. - .34 * iA.y * iA.z * (1. - soft)) * (.62 + .38 * smoothstep(0., .34, iA.z)) * (shL * (.75 + .25 * nA.y) + sunL * (.08 + kA * .72 + back));
  vec3 hB = mix(uGreen, uGold, kB) * (.86 + .28 * iB.x) * (1. - .34 * iB.y * iB.z * (1. - soft)) * (shL * (.5 + .2 * nB.y) + sunL * (.04 + kB * .4 + back * .6));
  vec3 gap = mix(uCulm, uGreen, .4) * (shL * .42 + sunL * .05);
  float lean = smoothstep(.35, 1., tus);                                                // the tall middle of a tussock closes over its gaps
  vec3 c = mix(mix(gap, hB, max(cB, lean * .6)), hA, cA);
  float kM = smoothstep(-.6, .5, uSunDir.y * .7 + .12);
  vec3 mean = mix(gap, mix(uGreen, uGold, kM * .8) * (shL * .9 + sunL * (.08 + kM * .56 + back * .9)), .8) * (.9 + .2 * dvn(p * .9 + 2.) * (1. - smoothstep(110., 190., dist)));
  c = (mix(c, mean, melt) * tusk * (.86 + .28 * dvn(p * .06 + 4.)) * (.94 + .12 * gust) + uFloor);
  if(!gl_FrontFacing) c = mix(uCulm, uGreen, .3) * shL * .5 + uFloor;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// the flood itself: one sheet. Looking down: clear tea-gold water over rippled white sand, dark weed combed by
// the current and the drowned meadow, all seen at their true depth (they slide under the lily pads as we pass);
// near-black blue in the deep channels. At grazing angles a sky mirror in which the papyrus walls stand (found
// by marching the baked distance field), with their shadow lying across the channel; lily rafts, grass tips on
// the plain, the sun's glitter road, wind cat's paws and cloud shadows.
const WATER_VERT = FOG_V + /* glsl */`
varying vec3 vWorld;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WATER_FRAG = FOG_F + NOISE_GLSL + MASK_GLSL + PAP_LIGHT + /* glsl */`
uniform vec3 uFill, uMirror;   // the sky fill that lights the papyrus; the colour of the low sky in the mirror
uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizon, uDeep, uBed, uGrassA, uGrassB, uCulm, uGreen, uGold, uPapFloor, uFloor, uPadA, uPadB, uPetal;
uniform float uTime; uniform vec4 uWind, uWater, uWall;   // uWater: x ruffle, y glitter, z grass gain, w mirror brightness | uWall: x wall height m, y -, z -, w no walls beyond this z
varying vec3 vWorld;
// the papyrus wall a ray leaving the water meets: x 1 if it meets one, y distance m
vec2 wallMarch(vec2 p, vec2 dh){
  float tt = 0., hit = 0.;
  for(int i = 0; i < 7; i++){
    float sd = sdLod(p + dh * tt);
    if(sd > -.35){ hit = 1.; break; }
    tt += max(-sd * .9, .6);
  }
  return vec2(hit, tt);
}
// lily pads in one grid: rgb colour, a cover
vec4 padsAt(vec2 lp, float lily, float so, vec3 light, vec3 sky){
  vec2 ci = floor(lp), cf = fract(lp) - .5; float hs = dh21(ci + 5.3 + so);
  vec2 a = cf - (vec2(dh21(ci + 1.7 + so), dh21(ci + 9.2 + so)) - .5) * .3;
  float r = length(a), rad = .26 + .17 * hs;
  float ang = atan(a.y, a.x + (abs(a.x) + abs(a.y) < 1e-5 ? 1e-4 : 0.));
  float notch = smoothstep(0., .2, abs(mod(ang - hs * 6.283 + 9.4248, 6.2832) - 3.1416));
  float pad = (1. - smoothstep(rad - .04, rad, r)) * mix(1., notch, smoothstep(.04, .09, r)) * step(1. - lily, dh21(ci + 13.1 + so));
  float vein = .9 + .1 * sin(ang * 14. + hs * 9.);
  vec3 pc = mix(uPadA, uPadB, hs) * (.7 + .3 * (1. - smoothstep(0., rad, r))) * vein * mix(vec3(1.), vec3(1.25, .8, .55), smoothstep(rad - .07, rad - .01, r) * .6);
  pc = pc * light + sky * .08;
  float fl = step(.84, dh21(ci + 21.7 + so)) * (1. - smoothstep(.07, .12, length(a - vec2(.05, -.03))));     // an open flower on some
  pc = mix(pc, uPetal * light * 1.5, fl);
  return vec4(pc, max(pad, fl * step(1. - lily, dh21(ci + 13.1 + so))));
}
void main(){
  vec2 p = vWorld.xz; float t = uTime;
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  vec4 m = maskAt(p);
  float depth = m.r * 4., papSd = m.g * 32. - 16., grassK = m.b, lily = m.a;
  float sunK = sunAt(vec3(p.x, ${WYS}, p.y));
  float fineK = 1. - smoothstep(6., 22., dist), grainK = 1. - smoothstep(3., 10., dist);
  float paw = smoothstep(.45, .8, dvn(p * .035 + uWind.xy * t * .12) * .65 + dvn(p * .11 - uWind.xy * t * .2) * .35);
  float calm = smoothstep(-3., 2., papSd), deepK = smoothstep(.45, 1.9, depth);
  // ---- the surface
  float amp = (.026 + .05 * paw + .08 * uWater.x) * (1. - .7 * calm) / (1. + dist * .012);
  vec2 rp = vec2(sin(p.x * 1.3 + t * 1.1 + 2. * sin(p.y * .7 - t * .6)), sin(p.y * 1.7 - t * 1.3 + 2. * sin(p.x * .9 + t * .5)));
  rp = rp * .4 + 2.2 * (vec2(dvn(p * 2.7 + t * .4), dvn(p * 2.7 + 17. - t * .35)) - .5) + .7 * (vec2(dvn(p * .8 - t * .3), dvn(p * .8 + 31. + t * .25)) - .5);
  rp += 2.6 * fineK * (vec2(dvn(p * 7.3 + vec2(t * .9, -t * .6)), dvn(p * 7.3 + 23. - vec2(t * .7, t * .8))) - .5);      // small wind ripples under the eye
  vec3 N = normalize(vec3(rp.x * amp, 1., rp.y * amp));
  float nv = max(dot(N, V), 0.), fres = .04 + .96 * pow(clamp(1. - nv, 0., 1.), 4.);
  fres = mix(fres, .05 + .95 * (1. - nv) * (1. - nv), .85 * smoothstep(uWall.w - 50., uWall.w + 15., p.y));   // out on the plain the shallow flood is a mirror from much steeper angles: the sky lies on it
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  float rl = max(length(R.xz), 1e-3), sl = R.y / rl; vec2 rh = R.xz / rl;
  vec3 skyc = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3, .5, .2))), .24);
  vec2 sunh = uSunDir.xz / max(length(uSunDir.xz), 1e-3); float toS = max(dot(rh, sunh), 0.), roadK = toS * toS * toS;
  // a sky-blue mirror at grazing angles (the low sky, not the white of the horizon); warm only down the sun's road
  vec3 sky = mix(mix(mix(uHorizon, uMirror, .9), uHorizon, roadK * .3) * uWater.w, mix(skyc, uMirror, .25), smoothstep(-.02, .5, R.y));
  float cr = smoothstep(.5, .76, dfbm((p + rh * (700. / max(sl, .14))) * .0009 + uWind.xy * t * .004));              // clouds in the mirror
  sky = mix(sky, uHorizon * 1.05 * uWater.w, cr * .5 * min(uCloud.w * 2.2, 1.) * smoothstep(.03, .3, R.y));
  sky *= 1. + deepK * .22 * (dvn(vec2(p.x * .9, p.y * .13 - t * .3)) - .5) - .16 * paw * uWater.x;                   // the slow current drawing lines down the channel
  float wallK = 0.;
  if(p.y < uWall.w){
    vec2 wm = wallMarch(p, rh); vec2 hp = p + rh * wm.y; float hh = sl * wm.y;
    float Ht = uWall.x * (.82 + .3 * dvn(hp * .5) + .14 * dvn(hp * 1.9 + 3.));
    wallK = wm.x * (1. - smoothstep(Ht - .7, Ht + .2, hh));
    float f = clamp(hh / max(Ht, .5), 0., 1.), mopZ = smoothstep(.5, .8, f), along = dot(hp, vec2(rh.y, -rh.x));
    float toW = dot(rh, sunh);
    float wsun = sunAt(vec3(hp.x, ${WYS} + hh, hp.y)) * smoothstep(-.3, .6, -toW);
    vec3 walb = mix(uCulm * (.55 + .9 * dvn(vec2(along * 4.5, hh * .35))), mix(uGreen, uGold, clamp(wsun * .7 + .3 * dvn(hp * 1.3 + hh), 0., 1.)) * (.7 + .6 * dvn(hp * 2.3 - hh * .7)), mopZ);
    vec3 wc = walb * (papShade(uFill, uSunCol) * (.3 + .7 * f) + uSunCol * .3183 * wsun * (.12 + .6 * f)) + uGold * uSunCol * cloudSh(hp) * mopZ * smoothstep(.15, .9, toW) * .1 + uFloor;
    sky = mix(sky, wc * .9, wallK * .94);
  }
  float sr = max(dot(R, uSunDir), 0.), s8 = sr * sr; s8 *= s8; s8 *= s8; float s64 = s8 * s8; s64 *= s64; s64 *= s64;
  float spark = dvn(p * 5. + vec2(t * 1.3, -t)) * dvn(p * 9. - vec2(t, t * 1.7));
  float s16 = s8 * s8, fineS = dvn(p * 19. + vec2(t * 2.1, -t * 1.6)) * dvn(p * 31. - vec2(t * 1.5, t * 2.3));
  float road = s16 * (smoothstep(.42, .54, fineS) * 1.5 / (1. + dist * .03) + .05);                                    // the glitter road: a broad lane of sparks toward the sun
  float glit = (s64 * s64 * smoothstep(.3, .5, spark) * .9 + s8 * s8 * s8 * .025 + road * .34) * uWater.y * sunK * (1. - wallK);
  // ---- looking down through it: the ray is bent at the surface and meets the bed further on
  float vl = max(length(V.xz), 1e-4), sT = min(vl, .999) / 1.33;
  vec2 bp = p - V.xz / vl * depth * sT / sqrt(1. - sT * sT) + N.xz * min(depth, 1.2) * 2.2;
  vec2 bw = bp + .1 * min(depth, 1.5) * vec2(sin(bp.y * 1.1 + t * .8), sin(bp.x * 1.3 - t * .7));
  // sand: ripple marks a hand apart, bent by a slow warp, and grain
  float warp = dvn(bw * .33) * 9. + dvn(bw * 1.07 + 4.) * 3.;
  float rip = sin(dot(bw, vec2(.62, .78)) * 24. + warp) * .5 + .5; rip = rip * rip * (3. - 2. * rip);
  float grain = dvn(bw * 21.) * .6 + dvn(bw * 43. + 7.) * .4;
  vec3 sandC = uBed * (.88 + .24 * dvn(bw * .6 + 3.)) * mix(1., .6 + .52 * rip, fineK) * mix(1., .84 + .32 * grain, grainK);
  // weed: dark beds with frayed edges, and loose strands combed out along the current
  vec2 cu = vec2(dot(bw, vec2(.34, .94)), dot(bw, vec2(.94, -.34)));
  float st1 = dvn(vec2(cu.x * 1.4 + sin(t * .5) * .1, cu.y * 9.)), st2 = dvn(vec2(cu.x * 2.6, cu.y * 23.) + 11.);
  float wb = dvn(bw * .21 + 9.) * .5 + dvn(bw * .83 + vec2(sin(t * .5) * .15, 0.)) * .32 + dvn(bw * 2.9) * .18;
  float weed = smoothstep(.5, .68, wb + (st1 - .5) * .3);
  float fronds = smoothstep(.6, .82, st1 * .6 + st2 * .4) * fineK;
  vec3 bed = mix(sandC, uBed * vec3(.16, .25, .1) * (.7 + .6 * st2), clamp(weed * .8 + fronds * .55, 0., .92));
  // the drowned meadow: blades lying downwind under the surface, sand showing between the tussocks
  float meadow = grassK * (1. - smoothstep(.5, 1.3, depth));
  vec2 gw = vec2(dot(bw, uWind.xy), dot(bw, vec2(-uWind.y, uWind.x)));
  float bl = dvn(vec2(gw.x * 2.3, gw.y * 25.)) * .6 + dvn(vec2(gw.x * 4.1 + 5., gw.y * 13. + gw.x * 3.)) * .4;
  float tus = smoothstep(.3, .62, dvn(bw * 1.25 + 2.) * .6 + dvn(bw * .37) * .4);
  vec3 turf = mix(uGrassB * vec3(.2, .23, .16), mix(uGrassB, uGrassA, .35) * .62, mix(.4, smoothstep(.42, .7, bl), fineK));
  bed = mix(bed, turf, meadow * (.12 + .7 * tus * tus));
  float c1 = dvn(bw * 2.3 + vec2(t * .35, -t * .22)), c2 = dvn(bw * 3.1 - vec2(t * .27, t * .31));
  float caust = pow(clamp(1. - abs(c1 + c2 - 1.) * 2.4, 0., 1.), 4.);                                            // a bright net of light on the bed
  bed *= (uSunCol * max(uSunDir.y, .06) * sunK * (.66 + .8 * caust * mix(.3, 1., fineK) * (1. - .8 * deepK)) + uSkyCol * .5) * .3183;
  vec3 T = exp(-depth * vec3(.75, .5, .62));
  bed = bed * T * vec3(1., .95, .8) + mix(uDeep, vec3(.05, .12, .09), .55) * (.5 + .15 * sunK) * (uSkyCol.b + .25) * (1. - T.g) * 1.6;
  vec3 c = mix(bed, sky, fres) + uSunCol * glit;
  // the dark floor of the papyrus beds
  c = mix(c, uPapFloor * (uSkyCol * .9 + uSunCol * (.03 + sunK * .14)) * (.55 + .9 * dvn(p * .9)) * .3183 + uFloor, smoothstep(-.4, 1.4, papSd));
  // lily rafts: two sizes of pad, some in flower
  if(lily > .02){
    vec3 light = (uSkyCol * 1.1 + uSunCol * (.06 + sunK * max(uSunDir.y, .1) * 1.7)) * .3183;
    vec4 pa = padsAt(p * 1.55, lily, 0., light, sky), pb = padsAt(p * .93 + 7.7, lily * .8, 40., light, sky);
    float fade = smoothstep(16., 60., dist);
    c = mix(c, pa.rgb, mix(pa.a, lily * .5, fade) * .96);
    c = mix(c, pb.rgb, pb.a * (1. - fade) * .96);
  }
  // grass and sedge tips standing through the sheet: meadows and open leads
  float gn = dvn(p * .017 + 3.) * .5 + dvn(p * .06) * .3 + dvn(p * .19) * .2;
  float tips = mix(smoothstep(.4, .68, dvn(p * vec2(13., 9.)) * .5 + dvn(p * vec2(31., 37.)) * .5), .64, smoothstep(6., 50., dist));
  float cover = clamp((.25 + .75 * smoothstep(.3, .58, gn)) * tips * (.55 + 1.45 * (1. - nv) * (1. - nv)), 0., .96) * grassK * (1. - deepK) * uWater.z;
  cover *= mix(.45, 1., smoothstep(5., 26., dist));               // under the eye the standing tufts are real; these are the stragglers
  float toSun = max(dot(-V, uSunDir), 0.);
  vec3 sunc2 = mix(uSunCol, vec3(dot(uSunCol, vec3(.3, .5, .2))), .5);
  vec3 grass = mix(uGrassB, uGrassA, smoothstep(.3, .8, dvn(p * .31 + 5.))) * (uSkyCol * .55 + sunc2 * sunK * .34 + uSunCol * sunK * .7 * toSun * toSun) * .3183;
  c = mix(c, grass, cover);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// islands: salt-white sand rim, tawny grass, dark thicket shade under the palms
const ISLE_VERT = FOG_V + /* glsl */`
attribute vec3 aIsle;                      // x radius fraction 0..1, y island radius m, z seed
varying vec3 vWorld, vN, vIsle;
void main(){ vWorld = position; vN = normal; vIsle = aIsle; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const ISLE_FRAG = FOG_F + NOISE_GLSL + /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uSand, uSalt, uTurf, uTurfB, uUnder, uFloor;
varying vec3 vWorld, vN, vIsle;
void main(){
  vec2 p = vWorld.xz; vec3 N = normalize(vN + vec3(0., 1e-4, 0.));
  float n1 = dvn(p * .33 + vIsle.z * 17.), n2 = dvn(p * 1.7), n3 = dvn(p * 6.3), rf = vIsle.x + .1 * (n1 - .5);
  float dist = distance(cameraPosition, vWorld), fine = mix(n3, .5, smoothstep(12., 50., dist));
  float n4 = dvn(p * 23.) * .6 + dvn(p * 61.) * .4; fine = mix(fine * .7 + n4 * .3, fine, smoothstep(4., 22., dist));   // sand grain and litter up close
  vec3 sand = mix(uSand, uSalt, smoothstep(.8, .93, rf) * (.55 + .45 * n2)) * (.86 + .28 * fine);
  float turf = (1. - smoothstep(.62, .84, rf)) * smoothstep(.25, .5, n1 * .6 + n2 * .4);
  vec3 alb = mix(sand, mix(uTurf, uTurfB, n2) * (.7 + .6 * fine), turf);
  alb = mix(alb, uUnder, (1. - smoothstep(.2, .55, rf)) * (.4 + .4 * n1));                   // shade and litter under the trees
  alb = mix(alb, uUnder * 1.25, smoothstep(.5, .75, dvn(vec2(atan(p.y - vIsle.y, p.x) * 9., vIsle.z * 5.) + n2)) * smoothstep(.86, .9, rf) * (1. - smoothstep(.93, .97, rf)) * .55);   // a drift line of reed litter
  alb *= .78 + .22 * smoothstep(${WY.toFixed(2)}, ${(WY + 0.35).toFixed(2)}, vWorld.y);    // wet at the waterline
  float cl = cloudSh(p);
  vec3 c = alb * (uSkyCol * .55 + uSunCol * cl * max(dot(N, uSunDir) * .8 + .2, 0.)) * .3183 + uFloor * .8;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------------------------------------------------
// Fan palm (Hyphaene): grey ringed trunk with a swelling halfway up, a crown of stiff pleated fans on long
// petioles, a skirt of dead ones. Built with the flora kit's vertex layout so it takes the shared wind material.
function floraGeo() {
  const P = [], Nn = [], Cc = [], Wd = [], UV = [], I = [];
  return { I,
    v(p, n, c, sway = 0, fl = 0, leaf = 0) { P.push(p[0], p[1], p[2]); Nn.push(n[0], n[1], n[2]); Cc.push(c.r, c.g, c.b); Wd.push(sway, fl, leaf, 0); UV.push(0.875, 0.75); return P.length / 3 - 1; },
    build(ud) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
      g.setAttribute('wind', new THREE.Float32BufferAttribute(Wd, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
      g.computeBoundingSphere(); g.computeBoundingBox();
      g.userData = { triangles: I.length / 3, height: g.boundingBox.max.y, radius: Math.max(g.boundingBox.max.x, -g.boundingBox.min.x, g.boundingBox.max.z, -g.boundingBox.min.z), glowColor: null, ...ud };
      return g;
    } };
}
function fanPalmGeometry(rng, o = {}) {
  const G = floraGeo(), H = o.height ?? 18, segs = o.segs ?? 10, sides = o.sides ?? 7, lean = o.lean || [rng.range(-1.6, 1.6), rng.range(-1.6, 1.6)], nf = o.fans ?? 14, K = o.pleats ?? 8;
  const bark = C('#9a948a'), barkD = C('#625c54'), green = C(o.leaf || '#74905a'), greenL = C(o.leafLight || '#a9b77c'), greenD = C('#3c5232'), dry = C('#a8946a'), stem = C('#6f7a4a');
  const ctr = (t) => [lean[0] * Math.pow(t, 1.7), H * t, lean[1] * Math.pow(t, 1.7)];
  const rows = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, c = ctr(t), q = (t - 0.56) / 0.13, r = H * 0.0165 * (1 + 0.6 * Math.exp(-t * 10)) * (1 + 0.5 * Math.exp(-q * q)) * (1 - 0.22 * t), row = [];
    for (let j = 0; j < sides; j++) { const a = (j / sides) * TAU, cs = Math.cos(a), sn = Math.sin(a); row.push(G.v([c[0] + cs * r, c[1], c[2] + sn * r], [cs, 0, sn], (i % 2 ? bark : barkD).clone().multiplyScalar(0.8 + 0.3 * rng()), 0.03 * H * t * t)); }
    rows.push(row);
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; G.I.push(rows[i][j], rows[i + 1][j], rows[i + 1][j1], rows[i][j], rows[i + 1][j1], rows[i][j1]); }
  const top = ctr(1), swTop = 0.03 * H, sc = H / 18;
  let az = rng() * TAU;
  for (let k = 0; k < nf; k++) {
    const t = k / (nf - 1), old = smoothstep(0.72, 1, t), el = lerp(1.2, -0.75, Math.pow(t, 0.85)) + rng.range(-0.12, 0.12); az += 2.4 + rng.range(-0.3, 0.3);
    const d = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)], sd = [-Math.sin(az), 0, Math.cos(az)], up = [sd[1] * d[2] - sd[2] * d[1], sd[2] * d[0] - sd[0] * d[2], sd[0] * d[1] - sd[1] * d[0]];
    const Lp = sc * rng.range(1.3, 1.9), Rf = sc * rng.range(1.5, 2.0) * (1 - 0.2 * old), hub = [top[0] + d[0] * Lp, top[1] + d[1] * Lp, top[2] + d[2] * Lp];
    const cA = green.clone().lerp(dry, old * 0.9), cB = greenL.clone().lerp(dry, old), cH = greenD.clone().lerp(dry, old * 0.6), w = 0.06 * sc;
    // petiole
    const a0 = G.v([top[0] - sd[0] * w, top[1], top[2] - sd[2] * w], up, stem, swTop), a1 = G.v([top[0] + sd[0] * w, top[1], top[2] + sd[2] * w], up, stem, swTop);
    const hv = G.v(hub, up, cH, swTop + 0.1 * sc, 0.3, 1);
    G.I.push(a0, a1, hv);
    // pleated blade: a fan of K gores round the hub, alternate rim points lifted (pleats) and drawn in (teeth)
    let prev = -1;
    for (let j = 0; j <= K; j++) {
      const th = lerp(-1.9, 1.9, j / K), odd = j % 2, rr = Rf * (odd ? 0.82 : 1) * (0.9 + 0.1 * Math.cos(th)), pl = (odd ? 0.11 : -0.05) * Rf, dr = -(0.12 + 0.3 * old) * Rf * (1 - Math.cos(th)) * 0.6;
      const ct = Math.cos(th) * rr, st = Math.sin(th) * rr;
      const p = [hub[0] + d[0] * ct + sd[0] * st + up[0] * pl, hub[1] + d[1] * ct + sd[1] * st + up[1] * pl + dr, hub[2] + d[2] * ct + sd[2] * st + up[2] * pl];
      const n = [up[0] + sd[0] * (odd ? 0 : Math.sign(th) * 0.5), up[1] + 0.2, up[2] + sd[2] * (odd ? 0 : Math.sign(th) * 0.5)], nl = Math.hypot(n[0], n[1], n[2]) || 1;
      const id = G.v(p, [n[0] / nl, n[1] / nl, n[2] / nl], (odd ? cA : cB).clone().multiplyScalar(0.85 + 0.3 * rng()), swTop + 0.16 * sc, 1, 1);
      if (prev >= 0) G.I.push(hv, prev, id);
      prev = id;
    }
  }
  return G.build({ kind: 'fanPalm' });
}
// termite spire: a lumpy grey cone, 3.5 m
function spireGeometry(rng, H = 3.5) {
  const G = floraGeo(), rings = 7, sides = 8, a = C('#9a8f80'), b = C('#6e655a'), rows = [], ph = rng() * TAU;
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, row = [], rad = H * (0.27 * Math.pow(1 - t, 0.75) + 0.035) * (1 + 0.16 * Math.sin(t * 9 + ph));
    for (let j = 0; j < sides; j++) { const an = (j / sides) * TAU, r = rad * (1 + 0.2 * Math.sin(an * 3 + t * 5 + ph) + 0.1 * rng()), cs = Math.cos(an), sn = Math.sin(an);
      row.push(G.v([cs * r + 0.12 * H * t * t, H * t, sn * r], [cs * 0.9, 0.42, sn * 0.9], a.clone().lerp(b, rng() * 0.8 + 0.2 * (1 - t)).multiplyScalar(0.75 + 0.25 * t))); }
    rows.push(row);
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; G.I.push(rows[i][j], rows[i + 1][j], rows[i + 1][j1], rows[i][j], rows[i + 1][j1], rows[i][j1]); }
  const tip = G.v([0.12 * H, H * 1.04, 0], [0, 1, 0], a); for (let j = 0; j < sides; j++) G.I.push(rows[rings][j], tip, rows[rings][(j + 1) % sides]);
  return G.build({ kind: 'spire' });
}
// islands: low domes on the plain. isleR / isleH are shared with everything that stands on them.
const isleR = (I, a) => I.r * (1 + 0.1 * Math.sin(2 * a + I.ph) + 0.06 * Math.sin(3 * a + I.ph * 2.3) + 0.035 * Math.sin(5 * a + I.ph * 0.7));
const isleH = (I, x, z) => { const dx = x - I.x, dz = z - I.z, f = Math.hypot(dx, dz) / isleR(I, Math.atan2(dz, dx)); return f >= 1.1 ? -1 : lerp(-0.2, I.h, 1 - smoothstep(0.5, 1.08, f)) + (f < 0.9 ? 0.25 * I.h * Math.sin(dx * 0.31 + I.ph) * Math.sin(dz * 0.27) * (1 - f) : 0); };
function islandsGeometry(list) {
  const P = [], A = [], I = [], FR = [0, 0.3, 0.52, 0.7, 0.84, 0.94, 1.02, 1.1], NA = 22;
  for (const isl of list) {
    const base = P.length / 3;
    P.push(isl.x, isleH(isl, isl.x, isl.z), isl.z); A.push(0, isl.r, isl.ph);
    for (let k = 1; k < FR.length; k++) for (let j = 0; j < NA; j++) {
      const a = (j / NA) * TAU, R = isleR(isl, a) * FR[k], x = isl.x + Math.cos(a) * R, z = isl.z + Math.sin(a) * R;
      P.push(x, k === FR.length - 1 ? -0.25 : isleH(isl, x, z), z); A.push(FR[k], isl.r, isl.ph);
    }
    for (let j = 0; j < NA; j++) I.push(base, base + 1 + (j + 1) % NA, base + 1 + j);
    for (let k = 1; k < FR.length - 1; k++) for (let j = 0; j < NA; j++) { const a = base + 1 + (k - 1) * NA + j, b = base + 1 + (k - 1) * NA + (j + 1) % NA, c = a + NA, d = b + NA; I.push(a, b, d, a, d, c); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aIsle', new THREE.Float32BufferAttribute(A, 3)); g.setIndex(I);
  g.computeVertexNormals(); g.computeBoundingSphere();
  return g;
}


// ---------------------------------------------------------------------------------------------------------
// Hippo. Model space: nose +Z, up +Y, y = 0 at the waterline when it lies awash. aAnim.z: 1 skull and upper
// jaw, 2 lower jaw, 3 ear. A barrel body, a narrow-waisted skull behind a broad square muzzle, a deep lower jaw
// with the great canines, a pink mouth. One geometry for all; who surfaces, blows and yawns is decided per
// instance in the shader. The yawn lifts the forequarters, throws the upper jaw to the sky and lets the lower
// jaw lie along the water.
function hippoGeometry() {
  const g = new F.Geo(), hide = C('#58585e'), back = C('#45464c'), pink = C('#80706e'), mouth = C('#d1868c'), gum = C('#dba0a0'), throat = C('#521a22'), ivory = C('#efe6c8'), dark = C('#1c1716');
  g.loft([{ z: -2.0, y: -0.5, rx: 0, ry: 0 }, { z: -1.8, y: -0.52, rx: 0.46, ry: 0.52 }, { z: -1.2, y: -0.56, rx: 0.84, ry: 0.76 }, { z: -0.4, y: -0.6, rx: 0.95, ry: 0.82 }, { z: 0.35, y: -0.6, rx: 0.9, ry: 0.8 },
    { z: 0.9, y: -0.56, rx: 0.72, ry: 0.68 }, { z: 1.25, y: -0.5, rx: 0.58, ry: 0.56 }, { z: 1.45, y: -0.48, rx: 0, ry: 0 }], { sides: 12, top: back, belly: pink, shade: [-1.1, -0.5] });
  g.blob(0, -0.52, 1.3, 0.34, 0.26, 0.2, throat, throat, 8, 4);                          // seen only when the jaws part
  const h0 = g.n;
  const head = g.loft([{ z: 0.98, y: -0.4, rx: 0, ry: 0 }, { z: 1.08, y: -0.38, rx: 0.5, ry: 0.44 }, { z: 1.42, y: -0.33, rx: 0.52, ry: 0.45 }, { z: 1.72, y: -0.36, rx: 0.44, ry: 0.33 }, { z: 2.05, y: -0.35, rx: 0.57, ry: 0.31 },
    { z: 2.38, y: -0.36, rx: 0.6, ry: 0.29 }, { z: 2.52, y: -0.38, rx: 0.52, ry: 0.24 }, { z: 2.58, y: -0.4, rx: 0, ry: 0 }], { sides: 12, top: hide, belly: mouth, shade: [-0.8, -0.45], flat: 0.5, square: 0.35 });
  g.paint(head, (x, y, z, c) => { if (y > -0.25 && z > 2.0) c.lerp(pink, 0.3); if (y < -0.5) c.lerp(throat, 0.85 * (1 - smoothstep(1.2, 1.8, z))); });   // the palate darkens into the throat
  for (const sx of [-1, 1]) {
    g.blob(sx * 0.33, 0.06, 1.42, 0.13, 0.12, 0.17, hide, pink, 6, 4);                    // eye turret
    g.blob(sx * 0.41, 0.09, 1.46, 0.05, 0.05, 0.05, dark, dark, 5, 3);
    g.blob(sx * 0.24, -0.08, 2.36, 0.11, 0.07, 0.12, back, back, 6, 3);                   // nostril
    g.tube([[sx * 0.44, -0.5, 2.18], [sx * 0.46, -0.66, 2.2], [sx * 0.45, -0.78, 2.17]], [0.055, 0.045, 0], 5, ivory, ivory);     // upper canine
    g.tube([[sx * 0.14, -0.5, 2.46], [sx * 0.14, -0.63, 2.5]], [0.04, 0], 4, ivory, ivory);
  }
  g.anim([h0, g.n], () => [1, 0, 1, 0]); g.pivot([h0, g.n], 0, -0.52, 1.12);
  const e0 = g.n;
  for (const sx of [-1, 1]) g.fan([[sx * 0.36, 0.04, 1.16], [sx * 0.56, 0.2, 1.1], [sx * 0.5, 0.3, 1.15], [sx * 0.36, 0.26, 1.2], [sx * 0.3, 0.14, 1.2]], hide, pink);
  g.anim([e0, g.n], (x) => [Math.sign(x), 0, 3, 0]); g.pivot([e0, g.n], 0, -0.52, 1.12);
  const j0 = g.n;
  g.loft([{ z: 1.02, y: -0.74, rx: 0, ry: 0 }, { z: 1.16, y: -0.75, rx: 0.46, ry: 0.27 }, { z: 1.7, y: -0.74, rx: 0.42, ry: 0.27 }, { z: 2.05, y: -0.72, rx: 0.56, ry: 0.28 }, { z: 2.38, y: -0.71, rx: 0.59, ry: 0.27 },
    { z: 2.5, y: -0.71, rx: 0.5, ry: 0.22 }, { z: 2.56, y: -0.71, rx: 0, ry: 0 }], { sides: 12, top: mouth, belly: hide, shade: [0.35, 0.75], square: 0.35 });
  g.paint([j0, g.n], (x, y, z, c) => { if (y > -0.7) c.lerp(throat, 0.85 * (1 - smoothstep(1.2, 1.8, z))); });
  g.blob(0, -0.45, 1.75, 0.3, 0.07, 0.5, gum, gum, 8, 4);                                  // tongue
  for (const sx of [-1, 1]) {
    g.tube([[sx * 0.43, -0.5, 2.24], [sx * 0.47, -0.34, 2.3], [sx * 0.46, -0.2, 2.3], [sx * 0.43, -0.12, 2.26]], [0.075, 0.065, 0.045, 0], 6, ivory, ivory);   // the great lower canines
    g.tube([[sx * 0.15, -0.5, 2.4], [sx * 0.16, -0.4, 2.54], [sx * 0.16, -0.34, 2.62]], [0.05, 0.04, 0], 5, ivory, ivory);                                    // incisors, pointing forward
  }
  g.anim([j0, g.n], () => [1, 0, 2, 0]); g.pivot([j0, g.n], 0, -0.52, 1.12);
  for (let i = h0; i < g.n; i++) g.p[i * 3 + 2] = 1.12 + (g.p[i * 3 + 2] - 1.12) * 0.8;      // a head a quarter of the animal, not a third
  const geo = g.build(); geo.userData.triangles = g.triangles;
  return geo;
}
const HIPPO_COMMON = /* glsl */`
attribute vec4 iA, iB;                      // iA: x z yaw scale | iB: phase, period s, mode (0 ambient 1 surfacer 2 yawner) + 10 * group, seed
uniform float uTime, uLive; uniform vec4 uKey;   // uKey: xy = group 0 (surface, yawn) zw = group 1, driven by u
vec3 hippoState(){                          // x up 0..1, y yawn 0..1, z cycle 0..1
  float mode = mod(iB.z, 10.), grp = floor(iB.z / 10. + .01); vec2 key = grp < .5 ? uKey.xy : uKey.zw;
  float cyc = fract(uTime / iB.y + iB.x), up = smoothstep(0., .1, cyc) * (1. - smoothstep(.42, .8, cyc));
  float c2 = fract(uTime / (iB.y * 1.9) + iB.x * 3.7), yawn = mode > 1.5 ? smoothstep(.5, .58, c2) * (1. - smoothstep(.76, .86, c2)) : 0.;
  if(mode > 1.5){ yawn = mix(yawn, key.y, uLive); up = max(up * .7, yawn); }
  else if(mode > .5) up = mix(up, key.x, uLive);
  return vec3(up, yawn, cyc);
}`;
const HIPPO_VERT = FOG_V + HIPPO_COMMON + /* glsl */`
attribute vec4 aAnim; attribute vec3 aPivot;
varying vec3 vColor, vN, vWorld;
vec2 rot(vec2 yz, float a){ float c = cos(a), s = sin(a); return vec2(yz.x * c + yz.y * s, yz.y * c - yz.x * s); }
void main(){
  vec3 st = hippoState(), p = position, n = normal; float up = st.x, yawn = st.y, part = aAnim.z;
  if(part > 2.5){ vec3 e = vec3(aAnim.x * .36, .1, 1.16), d = p - e; float a = sin(uTime * 17. + iB.w * 40.) * (.2 + .9 * up * (1. - smoothstep(.12, .3, st.z))); float c = cos(a), s = sin(a); d.xz = vec2(d.x * c - d.z * s, d.x * s + d.z * c); p = e + d; }
  if(part > .5){
    float sway = .04 * sin(uTime * 1.9 + iB.w * 30.) * yawn;
    float a = (part > 1.5 && part < 2.5) ? -(.22 * yawn - sway) : (.08 * up + .74 * yawn + sway);
    vec3 d = p - aPivot; d.yz = rot(d.yz, a); n.yz = rot(n.yz, a); p = aPivot + d;
  }
  float pitch = .09 * up + .32 * yawn + .02 * sin(uTime * .9 + iB.w * 9.);                 // the forequarters come up; the rump stays down
  p.yz = rot(vec2(p.y + .5, p.z + .6), pitch) + vec2(-.5, -.6); n.yz = rot(n.yz, pitch);
  p.y += mix(-.6, .14, up) + .34 * yawn + .03 * sin(uTime * 1.3 + iB.w * 20.);
  p *= iA.w;
  float c = cos(iA.z), s = sin(iA.z);
  vec3 w = vec3(iA.x + p.x * c + p.z * s, ${WYS} + p.y, iA.y + p.z * c - p.x * s);
  vN = vec3(n.x * c + n.z * s, n.y, n.z * c - n.x * s); vWorld = w; vColor = color * (.88 + .24 * fract(iB.w * 7.3));
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// matte hide, wet sheen only at the waterline, a mid-toned shadow side (sky and the bright water under it), a
// warm rim when the sun is beyond it, and a mouth lining that takes the light
const HIPPO_FRAG = FOG_F + NOISE_GLSL + /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizon;
varying vec3 vColor, vN, vWorld;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
  float ndl = dot(N, uSunDir), sunK = sunAt(vWorld), wet = 1. - smoothstep(.0, .5, vWorld.y - ${WYS});
  float pinkK = smoothstep(.02, .12, vColor.r - vColor.g * 1.4);
  vec3 alb = vColor * (1. - .3 * wet * (1. - pinkK));
  vec3 hemi = mix(uHorizon * .8, uSkyCol, N.y * .5 + .5) * (1.25 + .3 * pinkK);
  vec3 c = alb * (hemi + uSunCol * sunK * (max(ndl * .7 + .3, 0.) * .85 + .1 + .12 * pinkK)) * .3183;
  float fr = 1. - max(dot(N, V), 0.); fr *= fr * fr;
  vec3 Hv = normalize(V + uSunDir + vec3(0., 1e-4, 0.)); float sp = max(dot(N, Hv), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  c += uSunCol * sunK * sp * (.05 + .22 * wet) + mix(uHorizon, uSkyCol, .5) * fr * (.05 + .2 * wet);
  c += uSunCol * sunK * (.25 + alb) * fr * smoothstep(-.5, .3, ndl) * max(dot(-V, uSunDir), 0.) * .3;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
// the blown mist of a surfacing hippo: one soft V of spray per animal, born as it comes up
const BLOW_VERT = FOG_V + HIPPO_COMMON + /* glsl */`
uniform vec2 uBlow;                         // age 0..1 of the scripted surfacer's blow, per group
varying vec2 vP; varying vec3 vWorld; varying float vAge;
void main(){
  vec3 st = hippoState(); float mode = mod(iB.z, 10.), grp = floor(iB.z / 10. + .01);
  float age = st.z < .06 ? 1. : clamp((st.z - .06) / .2, 0., 1.);
  if(uLive > .5 && mode > .5) age = mode < 1.5 ? (grp < .5 ? uBlow.x : uBlow.y) : 1.;
  float c = cos(iA.z), s = sin(iA.z), sz = iA.w * (1.7 + 3.1 * age);
  vec3 o = vec3(iA.x + 2.1 * iA.w * s, ${WYS} + .3, iA.y + 2.1 * iA.w * c);
  vec2 tc = cameraPosition.xz - o.xz; tc /= max(length(tc), 1e-3);
  vec3 w = o + vec3(tc.y, 0., -tc.x) * position.x * sz + vec3(0., position.y * sz * 1.1, 0.);
  vP = vec2(position.x * 2., position.y); vWorld = w; vAge = age;
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BLOW_FRAG = FOG_F + NOISE_GLSL + /* glsl */`
uniform vec3 uSunDir, uSunCol, uSprayCol; uniform float uTime;
varying vec2 vP; varying vec3 vWorld; varying float vAge;
void main(){
  float a0 = 1. - vAge; if(a0 < .01) discard;
  float lean = abs(vP.x) - vP.y * .55, plume = exp(-lean * lean * 12.) * smoothstep(0., .12, vP.y) * (1. - smoothstep(.45, 1., vP.y));
  float n = dvn(vP * 5. + vec2(0., -uTime * 1.5)) * .6 + dvn(vP * 11. - uTime) * .4;
  float a = plume * (.4 + .9 * n) * a0 * (.3 + .7 * a0) * .9;
  if(a < .004) discard;
  vec3 ray = normalize(vWorld - cameraPosition + vec3(0., 1e-5, 0.)); float fs = max(dot(ray, uSunDir), 0.); fs = .12 + fs * fs;
  gl_FragColor = vec4(uSprayCol * .6 + uSunCol * fs * .5, min(a, .75));
  #include <fog_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

// rings on the water: hippos (timed with their surfacing), and the kingfisher's and eagle's strikes (keyed to u)
const RING_VERT = FOG_V + /* glsl */`
attribute vec4 iR, iS;                      // iR: x z size phase | iS: mode (0 looping, 1 event), period s or event u, speed m/s, life s
uniform float uTime, uU;
varying vec2 vP; varying vec3 vWorld; varying vec3 vInfo;
void main(){
  float age = iS.x < .5 ? fract(uTime / iS.y + iR.w) * iS.y : (uU - iS.y) * ${DURATION.toFixed(1)};
  float show = step(0., age) * step(age, iS.w);
  vec3 w = vec3(iR.x + position.x * iR.z * show, ${(WY + 0.03).toFixed(2)}, iR.y + position.z * iR.z * show);
  vP = position.xz * iR.z; vWorld = w; vInfo = vec3(age, iS.z, iS.w);
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RING_FRAG = FOG_F + /* glsl */`
uniform vec3 uSkyCol, uHorizon, uSunDir, uSunCol;
varying vec2 vP; varying vec3 vWorld; varying vec3 vInfo;
float crest(float r, float age, float sp, float k){ float a = age - k * .55, rk = max(a, 0.) * sp + .3, w = .1 + .05 * max(a, 0.); float q = (r - rk) / w; return a < 0. ? 0. : exp(-q * q) / (1. + .5 * max(a, 0.)); }
void main(){
  float r = length(vP), age = vInfo.x, sp = vInfo.y;
  float c = crest(r, age, sp, 0.) + crest(r, age, sp, 1.) + crest(r, age, sp, 2.) + crest(r, age, sp, 3.);
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.)); float graze = 1. - max(V.y, 0.); graze *= graze;
  float a = clamp(c * (.1 + .34 * graze) * (1. - smoothstep(vInfo.z * .55, vInfo.z, age)), 0., .8);
  if(a < .004) discard;
  vec3 ray = -V; float fs = max(dot(reflect(ray, vec3(0., 1., 0.)), uSunDir), 0.); fs *= fs; fs *= fs;
  gl_FragColor = vec4(mix(uHorizon, uSkyCol, .4) * 1.1 + uSunCol * fs * .5, a);
  #include <fog_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;


// a crown of water thrown up where something hits the surface (kingfisher, eagle, a surfacing hippo): keyed to u
const SPLASH_VERT = FOG_V + /* glsl */`
attribute vec4 iR, iS;                      // iR: x z size seed | iS: event u, life s, -, -
uniform float uU;
varying vec2 vP; varying vec3 vWorld; varying vec3 vInfo;
void main(){
  float age = (uU - iS.x) * ${DURATION.toFixed(1)}, show = step(0., age) * step(age, iS.y);
  vec3 o = vec3(iR.x, ${WYS}, iR.y); float W = iR.z * 3.4, H = iR.z * 2.2;
  vec2 tc = cameraPosition.xz - o.xz; tc /= max(length(tc), 1e-3);
  vec3 w = o + (vec3(tc.y, 0., -tc.x) * position.x * W + vec3(0., position.y * H, 0.)) * show;
  vP = vec2(position.x * W, position.y * H); vWorld = w; vInfo = vec3(age, iR.w, iR.z);
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SPLASH_FRAG = FOG_F + NOISE_GLSL + /* glsl */`
uniform vec3 uSunDir, uSunCol, uSprayCol;
varying vec2 vP; varying vec3 vWorld; varying vec3 vInfo;
// round drops: one soft disc to a cell of launch space, a third of the cells empty
float drops1(vec2 p){ vec2 i = floor(p), f = fract(p) - .5; vec2 o = (vec2(dh21(i + 3.7), dh21(i + 11.3)) - .5) * .56; float rad = .07 + .11 * dh21(i + 5.1);
  return (1. - smoothstep(rad * .45, rad, length(f - o))) * step(.5, dh21(i + 17.9)); }
void main(){
  float t = max(vInfo.x, .02), seed = vInfo.y, sz = max(vInfo.z, .1), v0 = 4.4 * sqrt(sz);
  vec3 Vv = cameraPosition - vWorld; float dist = length(Vv), down = clamp(Vv.y / max(dist, 1e-3), 0., 1.);
  vec2 vel = vec2(vP.x, vP.y + 4.9 * t * t) / t;
  float sp = length(vel) / v0, an = atan(vel.x, max(vel.y, 1e-3));
  float rim = .66 + .3 * dvn(vec2(an * 2.1 + seed * 17., seed * 3.)) + .09 * dvn(vec2(an * 7.3, seed * 9.)), fan = 1. - smoothstep(.8, 1.25, abs(an));
  float sheet = (1. - smoothstep(rim - .4, rim, sp)) * fan, flung = smoothstep(rim - .2, rim, sp) * (1. - smoothstep(rim + .05, rim + .55, sp)) * fan;
  vec2 q = vel * 1.1 + seed * 13.;
  float lig = dvn(q * vec2(1.7, .8)) * .5 + dvn(q * 3.9 + 3.) * .3 + dvn(q * 9.1 - 7.) * .2, tear = smoothstep(.04, .6, t);
  float body = smoothstep(mix(.1, .42, tear), mix(.5, .8, tear), lig);
  float near = 1. - smoothstep(16., 42., dist);
  float beads = drops1(q * 3.1 + 5.) * (.35 + .65 * tear) * near, drops = drops1(q * 2.2 + 9.) * flung * near + flung * .1 * (1. - near);
  vec2 fq = vec2(vP.x / (.45 * sz + 1.3 * t), (vP.y - .05) / (.16 * sz + .5 * t));                              // froth: a low torn mound on the water, no dome
  float froth = exp(-dot(fq, fq) * 1.9) * (1. - smoothstep(.08, .55, t)) * (.35 + .65 * lig) * (1. - .75 * smoothstep(.2, .55, down));
  float a = clamp(((sheet * (body * .75 + beads * .9) + drops) * (1. - smoothstep(.5, 1., t)) + froth * .4) * .8, 0., .8) * smoothstep(0., .3, vP.y + .12 * lig);
  a *= (1. - smoothstep(.8, 1., abs(vP.x) / (1.7 * sz))) * (1. - smoothstep(.85, 1., vP.y / (2.2 * sz)));
  if(a < .004) discard;
  vec3 ray = normalize(vWorld - cameraPosition + vec3(0., 1e-5, 0.)); float fs = max(dot(ray, uSunDir), 0.); fs = .14 + .6 * fs * fs;
  gl_FragColor = vec4(uSprayCol * .6 + uSunCol * fs * (.5 + .35 * (beads + drops)), a);
  #include <fog_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;

// ---------------------------------------------------------------------------------------------------------
// A posed bird (fish eagle, kingfisher): the world moves the mesh, the shader beats, raises and folds the wings.
// Model: beak +Z, up +Y, wings along X. aAnim: x side, y span 0..1, z part (1 wing, 2 head, 3 legs).
function birdGeometry(o) {
  const g = new F.Geo(), L = o.len, S = o.span, body = C(o.body), belly = C(o.belly), head = C(o.head), wing = C(o.wing), wingTip = C(o.tip), tail = C(o.tail), beak = C(o.beak), leg = C(o.leg);
  g.loft([{ z: -0.5 * L, y: 0, rx: 0, ry: 0 }, { z: -0.36 * L, y: 0, rx: 0.1 * L, ry: 0.1 * L }, { z: -0.05 * L, y: -0.01 * L, rx: 0.17 * L, ry: 0.17 * L }, { z: 0.22 * L, y: 0.01 * L, rx: 0.15 * L, ry: 0.15 * L, top: head, belly: head },
    { z: 0.36 * L, y: 0.03 * L, rx: 0.09 * L, ry: 0.09 * L, top: head, belly: head }], { sides: 8, top: body, belly });
  const h0 = g.n;
  g.blob(0, 0.07 * L, 0.45 * L, 0.095 * L, 0.095 * L, 0.12 * L, head, head, 7, 4);
  g.tube([[0, 0.07 * L, 0.54 * L], [0, 0.06 * L, 0.54 * L + o.bill * 0.6], [0, 0.02 * L, 0.54 * L + o.bill]], [0.045 * L, 0.035 * L, 0], 5, beak, beak);
  for (const sx of [-1, 1]) g.blob(sx * 0.075 * L, 0.09 * L, 0.5 * L, 0.02 * L, 0.02 * L, 0.02 * L, C('#111111'), C('#111111'), 4, 3);
  g.anim([h0, g.n], () => [0, 0, 2, 0]); g.pivot([h0, g.n], 0, 0.02 * L, 0.3 * L);
  g.fan([[0, 0.02 * L, -0.34 * L], [-0.2 * L, 0.02 * L, -0.74 * L], [-0.07 * L, 0.02 * L, -0.8 * L], [0.07 * L, 0.02 * L, -0.8 * L], [0.2 * L, 0.02 * L, -0.74 * L]], body, tail);
  const l0 = g.n;
  for (const sx of [-1, 1]) g.tube([[sx * 0.07 * L, -0.12 * L, -0.06 * L], [sx * 0.08 * L, -0.3 * L, 0.0], [sx * 0.08 * L, -0.34 * L, 0.1 * L]], [0.035 * L, 0.022 * L, 0.012 * L], 4, belly, leg);
  g.anim([l0, g.n], () => [0, 0, 3, 0]); g.pivot([l0, g.n], 0, -0.1 * L, -0.06 * L);
  // one wing: leading and trailing edge over five stations, fingered tip
  const w0 = g.n, xs = [0.06, 0.3, 0.55, 0.8, 1.0], lead = [], trail = [], cl = [], ct = [];
  xs.forEach((t) => { const x = 0.08 * L + t * S, ch = o.chord * (1 - 0.45 * t * t), sweep = -0.1 * S * t * t; lead.push([x, 0.02 * L, 0.2 * L + sweep + 0.03 * S * Math.sin(t * 3)]); trail.push([x, 0.0, 0.2 * L + sweep - ch]); cl.push(wing.clone().lerp(o.shoulder ? C(o.shoulder) : wing, 1 - smoothstep(0.1, 0.45, t))); ct.push(wing.clone().lerp(wingTip, smoothstep(0.3, 1, t))); });
  g.strip(lead, trail, cl, ct);
  g.anim([w0, g.n], (x) => [1, clamp((x - 0.08 * L) / S, 0, 1), 1, 0]); g.pivot([w0, g.n], 0.08 * L, 0.02 * L, 0.1 * L);
  g.mirror([w0, g.n], 0); for (let i = w0; i < g.n; i++) g.a[i * 4] = Math.sign(g.p[i * 3]) || 1;
  const geo = g.build(); geo.userData.triangles = g.triangles;
  return geo;
}
const BIRD_VERT = FOG_V + /* glsl */`
attribute vec4 aAnim; attribute vec3 aPivot;
uniform vec4 uWing;                         // x raise rad, y flap amplitude rad, z fold 0..1, w phase
uniform vec2 uPose;                         // x head thrown back rad, y legs forward rad
varying vec3 vColor, vN, vWorld;
void main(){
  vec3 p = position, n = normal; float part = aAnim.z;
  if(part > .5 && part < 1.5){
    float sd = aAnim.x, s = aAnim.y, x0 = aPivot.x, th = uWing.x + uWing.y * (sin(uWing.w) * (1. - .35 * s) + .5 * s * sin(uWing.w - 1.1));
    float dx = (p.x - x0) * (1. - .84 * uWing.z), c = cos(th), sn = sin(th);
    p.z -= abs(p.x - x0) * uWing.z * .95; p.y += abs(dx) * sn - .04 * uWing.z; p.x = x0 + dx * c;
    n = normalize(vec3(n.x * c - sd * n.y * sn, n.y * c + sd * n.x * sn, n.z) + vec3(0., 1e-4, 0.));
  } else if(part > 1.5){
    float a = part < 2.5 ? uPose.x : uPose.y; vec3 d = p - aPivot; float c = cos(a), sn = sin(a);
    d.yz = vec2(d.y * c + d.z * sn, d.z * c - d.y * sn); n.yz = vec2(n.y * c + n.z * sn, n.z * c - n.y * sn); p = aPivot + d;
  }
  vec4 wp = modelMatrix * vec4(p, 1.);
  vWorld = wp.xyz; vN = mat3(modelMatrix) * n; vColor = color;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = FOG_F + /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizon;
varying vec3 vColor, vN, vWorld;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
  float ndl = dot(N, uSunDir), fr = 1. - max(dot(N, V), 0.); fr *= fr;
  vec3 c = vColor * (mix(uHorizon * .7, uSkyCol, N.y * .5 + .5) * .8 + uSunCol * (max(ndl, 0.) * .85 + .12)) * .3183;
  c += uSunCol * (.15 + vColor) * fr * max(dot(-V, uSunDir), 0.) * .35;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;


// the flush: egrets and ducks that burst up out of the margins ahead of us and fly on down the channel. One small
// modelled bird (about 230 triangles): a round body, the neck drawn back in its S with the bulge under the chin,
// head and dagger bill, arched cambered wings whose tips lag the beat, tail, black legs trailing behind. The
// shader flies it; a duck is the same bird with its neck out straight, no long legs, shorter wings and its own colours.
const FLUSH_VERT = FOG_V + /* glsl */`
attribute vec4 aAnim; attribute vec3 aStart; attribute vec4 aRnd, aDir;   // aAnim: wing span 0..1, part | aDir: heading x z, kind (0 egret 1 duck), launch delay s
uniform float uTime, uT;                         // uT: seconds since the first bird went up (from u)
varying vec3 vCol, vWorld, vN; varying float vKind;
vec3 track(float p){
  vec2 h = aDir.xy, sd = vec2(h.y, -h.x); float kind = aDir.z, sp = mix(11.5, 15., kind) * (.9 + .25 * aRnd.y);
  float run = sp * (p - (1. - exp(-p * 1.3)) / 1.3);
  float lift = (mix(4.4, 3.0, kind) + 3.2 * aRnd.z) * (1. - exp(-p * .8)) + .5 * p;
  float veer = (aRnd.w - .5) * 2.; veer = veer * (1.3 + .9 * p) + sign(veer) * (max(p - 3.2, 0.) * max(p - 3.2, 0.) * 1.8 + kind * 1.6 * p);   // ducks peel away from our line at once
  vec3 q = aStart + vec3(h.x * run + sd.x * veer, lift, h.y * run + sd.y * veer);
  q += vec3(sin(p * 2.1 + aRnd.x * 30.), .6 * cos(p * 2.7 + aRnd.y * 30.), sin(p * 1.7 + aRnd.z * 30.)) * .5 * min(p, 1.);
  return q;
}
void main(){
  float p = max(uT - aDir.w, 0.), kind = aDir.z, up = smoothstep(0., .3, p), part = aAnim.y, s = aAnim.x;
  vec3 c = track(p), f = normalize(track(p + .05) - c + vec3(aDir.x, 0., aDir.y) * 1e-3);
  vec3 r = normalize(cross(f, vec3(0., 1., 0.)) + vec3(1e-5, 0., 0.)), u = cross(r, f);
  float ph = uTime * mix(12.5, 25., kind) + aRnd.w * 40., sx = position.x < 0. ? -1. : 1.;
  vec3 l = position, n = normal, col = color;
  if(part > 2.5 && part < 3.5){
    // the arm beats from the shoulder, the hand lags and bends down on the upstroke: an arched wing, never a flat board
    float beat = sin(ph - s * .9), ang = ((beat * (.5 + .25 * s) + .12) * mix(1., .72, kind) - s * s * (.22 + .16 * cos(ph - .9))) * up;
    float dx = (abs(l.x) - .07) * mix(.22, 1., up), ca = cos(ang), sa = sin(ang) * sx;
    l.x = sx * (.07 + dx * ca); l.y += dx * sin(ang) - .05 * s * s * (1. - up);
    n = vec3(n.x * ca - n.y * sa, n.x * sa + n.y * ca, n.z);
    col *= .8 + .2 * smoothstep(0., .22, s);                                              // the wing root lies in the body's shade
  }
  if(kind > .5){
    col = vec3(.3, .17, .085);                                                           // chestnut body
    if(part > 4.5){ l.z = -.3 + (l.z + .3) * .2; col = vec3(.06, .05, .05); }               // ducks carry no long legs
    else if(part > 3.5) col = vec3(.05, .045, .04);
    else if(part > 2.5) col = mix(vec3(.34, .22, .13), vec3(.16, .115, .085), s);
    else if(part > 1.5) col = vec3(.08, .08, .09);
    else if(part > .5){ col = position.z > .425 && position.y > .055 ? vec3(.86, .85, .8) : (position.z > .36 ? vec3(.05, .045, .04) : vec3(.34, .18, .08)); }   // the white face, black nape, chestnut neck
    if(part > .5 && part < 2.5){ l.y = mix(l.y, .04 + (l.y - .04) * .5, smoothstep(.24, .4, l.z)) + .03 * smoothstep(.24, .44, l.z); l.z = .25 + (l.z - .25) * .7; }   // the neck out straight
    l *= vec3(.72, 1.15, .84);
  }
  float sc = mix(1.2, .84, kind) * (.9 + .22 * aRnd.x) * smoothstep(0., .14, p);          // out of the reeds, not out of thin air
  vec3 wp = c + (r * l.x + u * l.y + f * l.z) * sc;
  vN = r * n.x + u * n.y + f * n.z; vWorld = wp; vCol = col; vKind = kind;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// white that stays white: the sky and the bright water fill the shade to a blue-white, the sun lights the rest
const FLUSH_FRAG = FOG_F + /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol;
varying vec3 vCol, vWorld, vN; varying float vKind;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if(!gl_FrontFacing) N = -N;
  float ndl = dot(N, uSunDir), wrap = max(ndl * .75 + .25, 0.);
  vec3 skyD = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3, .5, .2))), .3);
  vec3 amb = skyD * mix(3.7, 2.2, vKind) * (.7 + .3 * N.y) * .3183;                   // undersides and far wings fall to a blue-grey: the bird has a form
  vec3 c = vCol * (amb + uSunCol * .3183 * (wrap * .8 + max(-ndl, 0.) * .2 * (1. - vKind)));
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
function flushGeometry(N) {
  const g = new F.Geo(), white = C('#f1efe6'), bill = C('#f2b01c'), leg = C('#141210');
  const part = (r, k) => g.anim(r, () => [0, k, 0, 0]);
  part(g.loft([{ z: -0.3, y: 0.01, rx: 0, ry: 0 }, { z: -0.21, y: 0.015, rx: 0.068, ry: 0.058 }, { z: -0.03, y: 0, rx: 0.125, ry: 0.108 }, { z: 0.13, y: 0, rx: 0.118, ry: 0.105 }, { z: 0.25, y: 0.02, rx: 0.07, ry: 0.07 }, { z: 0.31, y: 0.035, rx: 0, ry: 0 }], { sides: 8, top: white, belly: white }), 0);
  part(g.tube([[0, 0.03, 0.22], [0, -0.04, 0.33], [0, -0.03, 0.42], [0, 0.045, 0.45], [0, 0.085, 0.41]], [0.052, 0.046, 0.04, 0.034, 0.034], 6, white, white), 1);
  part(g.blob(0, 0.098, 0.465, 0.038, 0.04, 0.068, white, white, 6, 4), 1);
  part(g.tube([[0, 0.098, 0.52], [0, 0.09, 0.62], [0, 0.08, 0.73]], [0.022, 0.015, 0], 4, bill, bill), 2);
  // one wing: leading edge, a raised mid-chord, trailing edge over five stations; the tip swept back
  const st = [[0.07, 0.03, 0.15, -0.15, 0], [0.27, 0.058, 0.2, -0.2, 0.22], [0.5, 0.064, 0.2, -0.21, 0.48], [0.71, 0.046, 0.15, -0.21, 0.72], [0.87, 0.012, 0.06, -0.19, 0.9], [0.95, -0.012, -0.04, -0.15, 0.98], [0.97, -0.02, -0.1, -0.12, 1]];   // x, y, leading z, trailing z, span
  const greyW = C('#c4c8cc'), midW = C('#e6e6e0');
  const w0 = g.n, lead = st.map((a) => [a[0], a[1], a[2]]), mid = st.map((a) => [a[0], a[1] + 0.03 * (1 - a[4] * 0.6), a[2] * 0.45 + a[3] * 0.55 + 0.1]), trail = st.map((a) => [a[0], a[1] - 0.012, a[3]]);
  g.strip(lead, mid, white, midW); g.strip(mid, trail, midW, greyW);
  g.anim([w0, g.n], (x) => [clamp((x - 0.07) / 0.9, 0, 1), 3, 0, 0]);
  const wm = g.mirror([w0, g.n], 0); g.anim(wm, (x) => [clamp((-x - 0.07) / 0.9, 0, 1), 3, 0, 0]);
  part(g.fan([[0, 0.02, -0.25], [0.065, 0.02, -0.4], [0, 0.012, -0.45], [-0.065, 0.02, -0.4]], white), 4);
  part(g.tube([[0, -0.03, -0.2], [0, -0.04, -0.5], [0, -0.045, -0.8], [0, -0.05, -0.88]], [0.026, 0.022, 0.024, 0.03], 4, leg, leg, { flatten: 1.5 }), 5);
  const base = g.build(), ig = new THREE.InstancedBufferGeometry();
  ig.index = base.index; for (const k of ['position', 'normal', 'color', 'aAnim']) ig.setAttribute(k, base.attributes[k]);
  ig.instanceCount = N; ig.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  ig.userData.triangles = g.triangles;
  return ig;
}

// the crocodile's wake: a ribbon laid along its S-shaped course; a clear V opens behind wherever the head is:
// two bright crests with a dark trough inside each, and the churn of the tail between them
const WAKE_VERT = FOG_V + /* glsl */`
attribute vec2 aSV;                         // arc length m, across -1..1
varying vec2 vSV; varying vec3 vWorld;
void main(){ vSV = aSV; vWorld = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WAKE_FRAG = FOG_F + NOISE_GLSL + /* glsl */`
uniform vec3 uSkyCol, uHorizon; uniform float uHead, uTime, uHalf;
varying vec2 vSV; varying vec3 vWorld;
void main(){
  float back = uHead - vSV.x; if(back < 0. || back > 34.) discard;
  float x = abs(vSV.y) * uHalf + .12 * sin(back * 1.3 + uTime * 1.1), arm = .16 + .23 * back, w = .1 + .03 * back;
  float q = (x - arm) / w, q2 = (x - arm * .5) / (w * 1.3), qt = (x - arm + w * 1.7) / (w * 1.1);
  float feather = smoothstep(.15, .85, .5 + .5 * sin(back * 4.6 + x * 7. - uTime * 4.5));   // the cusp wavelets of a ship's wake
  float crest = (exp(-q * q) + .45 * exp(-q2 * q2)) * feather;
  float trough = exp(-qt * qt) * step(.6, back);
  float churn = (1. - smoothstep(0., arm * .5, x)) * (1. - smoothstep(0., 6., back)) * (.4 + .6 * dvn(vWorld.xz * 4. + uTime));
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.)); float graze = 1. - max(V.y, 0.); graze *= graze;
  float life = (1. - smoothstep(11., 26., back)) * smoothstep(0., 1.2, back + .4);
  float brk = .35 + .65 * dvn(vec2(back * 1.6 - uTime * 1.4, x * 3.));
  float aC = clamp((crest * (.12 + .32 * graze) * brk + churn * .22) * life, 0., .52), aT = clamp(trough * (.12 + .14 * graze) * life, 0., .35) * (1. - aC);
  float a = aC + aT;
  if(a < .004) discard;
  gl_FragColor = vec4((mix(uSkyCol, uHorizon, .6) * aC + mix(uSkyCol, vec3(.02, .04, .05), .7) * .5 * aT) / max(a, 1e-3), a);
  #include <fog_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
}`;
// The crocodile: a broad flat trunk and a long keeled tail, the skull table, eyes and nostrils the only things
// well clear of the water; rows of raised scutes down the back. Its scales are drawn in the shader.
function crocGeometry() {
  const g = new F.Geo(), olive = C('#7c7e4a'), darkc = C('#474a2a'), pale = C('#aaa478'), eyeC = C('#1a1a12');
  const R = [[-2.3, -0.02, 0, 0], [-1.95, -0.03, 0.032, 0.1], [-1.45, -0.05, 0.065, 0.14], [-0.95, -0.08, 0.13, 0.17], [-0.5, -0.1, 0.24, 0.19], [-0.05, -0.11, 0.33, 0.2], [0.42, -0.11, 0.34, 0.2], [0.78, -0.1, 0.27, 0.17],
    [1.0, -0.08, 0.2, 0.13], [1.17, -0.05, 0.2, 0.115], [1.33, -0.05, 0.18, 0.1], [1.5, -0.075, 0.13, 0.064], [1.75, -0.085, 0.1, 0.05], [1.9, -0.08, 0.096, 0.052], [1.97, -0.085, 0, 0]];
  g.loft(R.map((r) => ({ z: r[0], y: r[1], rx: r[2], ry: r[3] })), { sides: 12, top: olive, belly: pale, shade: [-0.5, 0.1], flat: 0.4 });
  const backY = (x, z) => { let i = 0; while (i < R.length - 2 && z > R[i + 1][0]) i++; const a = R[i], b = R[i + 1], t = clamp((z - a[0]) / (b[0] - a[0]), 0, 1), rx = lerp(a[2], b[2], t), ry = lerp(a[3], b[3], t), k = clamp(x / Math.max(rx, 1e-3), -1, 1); return lerp(a[1], b[1], t) + ry * Math.sqrt(1 - k * k); };
  const scute = (x, z, h, len) => { const y = backY(x, z) - 0.012; g.fan([[x, y, z - len * 0.5], [x, y + h, z + len * 0.05], [x, y, z + len * 0.5]], darkc, olive); };
  for (let z = -2.12; z < 0.96; z += 0.125) {
    if (z < -1.35) scute(0, z, 0.085 * Math.min(1, (z + 2.3) / 0.5), 0.13);                              // the single crest of the tail
    else { const sp = z < -0.5 ? lerp(0.03, 0.085, (z + 1.35) / 0.85) : 0.09; scute(sp, z, 0.06, 0.125); scute(-sp, z, 0.06, 0.125);
      if (z > -0.45 && z < 0.85) { scute(0.2, z + 0.06, 0.035, 0.12); scute(-0.2, z + 0.06, 0.035, 0.12); } }
  }
  for (const sx of [-1, 1]) {
    g.blob(sx * 0.105, 0.045, 1.25, 0.05, 0.05, 0.075, olive, darkc, 6, 4);                              // the eye turret
    g.blob(sx * 0.125, 0.06, 1.265, 0.022, 0.024, 0.03, eyeC, eyeC, 5, 3);
    g.blob(sx * 0.035, -0.035, 1.9, 0.028, 0.022, 0.04, darkc, darkc, 5, 3);                             // nostrils
  }
  g.anim([0, g.n], (x, y, z) => [clamp((0.6 - z) / 2.9, 0, 1), 0, 0, 0]);
  const geo = g.build(); geo.userData.triangles = g.triangles;
  return geo;
}
const CROC_VERT = FOG_V + /* glsl */`
attribute vec4 aAnim; uniform float uTime, uSwim; varying vec3 vColor, vN, vWorld, vLocal;
void main(){ vec3 p = position; vLocal = position; p.x += sin(p.z * 1.9 + uTime * 5.5) * .2 * aAnim.x * uSwim; vec4 wp = modelMatrix * vec4(p, 1.); vWorld = wp.xyz; vN = mat3(modelMatrix) * normal; vColor = color;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CROC_FRAG = FOG_F + NOISE_GLSL + /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uHorizon;
varying vec3 vColor, vN, vWorld, vLocal;
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if(!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
  // square scutes in rows down the back, each with a paler keel and a dark groove round it
  vec2 sq = vec2(vLocal.x * 12., vLocal.z * 8.5), cf = fract(sq) - .5; float cell = dh21(floor(sq) + 3.);
  float topK = smoothstep(-.3, .45, N.y), groove = smoothstep(.3, .5, max(abs(cf.x), abs(cf.y))) * topK, keel = (1. - smoothstep(0., .2, abs(cf.x))) * topK;
  float band = smoothstep(.35, .65, dvn(vec2(vLocal.z * 2.6, 1.7)));                                    // faint dark saddles
  vec3 alb = vColor * (.8 + .34 * cell) * (1. - .5 * groove) * (1. + .2 * keel) * (1. - .28 * band * topK);
  float sunK = sunAt(vWorld), ndl = dot(N, uSunDir), wet = 1. - smoothstep(0., .25, vWorld.y - ${WYS});
  vec3 skyD = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3, .5, .2))), .4);
  vec3 c = alb * (1. - .25 * wet) * (skyD * (.7 + .4 * N.y) + uSunCol * sunK * max(ndl * .75 + .25, 0.) * .8) * .3183;
  vec3 Hv = normalize(V + uSunDir + vec3(0., 1e-4, 0.)); float sp = max(dot(N, Hv), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  float fr = 1. - max(dot(N, V), 0.); fr *= fr * fr;
  c += uSunCol * sunK * sp * (.05 + .3 * wet) * (.5 + keel) + mix(uHorizon, uSkyCol, .5) * fr * (.04 + .16 * wet);
  float under = smoothstep(0., .28, ${WYS} - vWorld.y);                                                // it sinks into the tea-dark water
  c = mix(c, vec3(.035, .06, .05) * (uSkyCol.b + .25), under * .88);
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;


// ---------------------------------------------------------------------------------------------------------
// Sedge: the flooded grass along our line. Crossed cards of fine blades standing 0.2 to 0.6 m out of the water,
// combed by the wind, backlit gold on the sun side; with MIRROR the same cards are laid on the water as their
// own reflection (each vertex is put where the eye would see its mirror image), strong at grazing angles.
function sedgeTexture(rng) {
  const S = 256, cv = document.createElement('canvas'); cv.width = cv.height = S;
  const g = cv.getContext('2d'); g.clearRect(0, 0, S, S);
  for (let i = 0; i < 30; i++) {
    const bx = S * (0.5 + rng.range(-0.32, 0.32)), lean = rng.range(-0.3, 0.3) * S + (bx - S / 2) * 0.55, h = S * rng.range(0.45, 0.98), w = rng.range(7, 12), v = Math.round(rng.range(150, 255));
    const tx = clamp(bx + lean, 6, S - 6), ty = S - h, mx = bx + lean * 0.3, my = S - h * 0.55;
    g.fillStyle = `rgb(${v},${v},${v})`; g.beginPath(); g.moveTo(bx - w / 2, S); g.quadraticCurveTo(mx - w * 0.32, my, tx, ty); g.quadraticCurveTo(mx + w * 0.32, my, bx + w / 2, S); g.closePath(); g.fill();
  }
  const tex = new THREE.CanvasTexture(cv);
  tex.flipY = false; tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.anisotropy = 4;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return tex;
}
function sedgeGeometry() {
  const P = [], UV = [], I = [];
  for (let q = 0; q < 2; q++) {
    const b = q * Math.PI * 0.5 + 0.4, cx = Math.cos(b) * 0.5, cz = Math.sin(b) * 0.5, n = P.length / 3;
    P.push(-cx, 0, -cz, cx, 0, cz, cx, 1, cz, -cx, 1, -cz); UV.push(0.02, 0.99, 0.98, 0.99, 0.98, 0.02, 0.02, 0.02); I.push(n, n + 1, n + 2, n, n + 2, n + 3);
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  return g;
}
const SEDGE_VERT = FOG_V + /* glsl */`
attribute vec4 iP, iQ;                     // iP: x z yaw width | iQ: seed, tint, height m, -
uniform float uTime; uniform vec4 uWind;
varying vec2 vUv; varying vec3 vWorld; varying vec3 vInfo;   // seed, tint, height above the water
void main(){
  float c = cos(iP.z), s = sin(iP.z);
  vec3 p = vec3(position.x * iP.w, position.y * iQ.z, position.z * iP.w);
  p.y *= 1. - smoothstep(105., 150., distance(cameraPosition.xz, iP.xy));          // far tufts sink away instead of popping
  p.xz = vec2(p.x * c + p.z * s, p.z * c - p.x * s);
  vec3 w = vec3(iP.x, ${WYS} - .12, iP.y) + p;
  float gust = sin(dot(w.xz, uWind.xy) * .09 - uTime * uWind.w * 1.6 + sin(w.z * .05 + w.x * .03) * 2.) * .5 + .5;
  float sw = position.y * position.y;
  vec2 d = uWind.xy * uWind.z * (.1 + .32 * gust) + vec2(sin(uTime * 2.7 + iQ.x * 40.), cos(uTime * 2.2 + iQ.x * 31.)) * .035;
  w.xz += d * sw * iQ.z * 1.6; w.y -= dot(d, d) * sw * iQ.z * .8;
  float hgt = w.y - ${WYS};
#ifdef MIRROR
  float hh = max(hgt, 0.), camH = max(cameraPosition.y - ${WYS}, .05), k = camH / (camH + hh);
  w.xz = cameraPosition.xz + (w.xz - cameraPosition.xz) * k;
  w.xz += hh * .12 * vec2(sin(w.z * 5.3 + uTime * 2.1), sin(w.x * 4.7 - uTime * 1.8));
  w.y = ${WYS} + .012;
#endif
  vUv = uv; vWorld = w; vInfo = vec3(iQ.x, iQ.y, hgt);
  vec4 mvPosition = viewMatrix * vec4(w, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SEDGE_FRAG = FOG_F + NOISE_GLSL + /* glsl */`
uniform sampler2D uMap; uniform vec3 uSunDir, uSunCol, uSkyCol, uRoot, uTip, uFloor;
varying vec2 vUv; varying vec3 vWorld; varying vec3 vInfo;
void main(){
  if(vInfo.z < 0.) discard;                                       // the part under water
  vec4 t = texture2D(uMap, vUv);
  vec3 Vp = cameraPosition - vWorld; float dist = length(Vp);
  if(t.a < mix(.42, .14, smoothstep(8., 60., dist))) discard;
  vec3 V = Vp / max(dist, 1e-3);
  float h = 1. - vUv.y, cl = cloudSh(vWorld.xz), toSun = max(dot(-V, uSunDir), 0.);
  vec3 alb = mix(uRoot, uTip, h * h) * (.75 + .5 * t.r) * (.82 + .36 * vInfo.y);
  vec3 sunc = mix(uSunCol, vec3(dot(uSunCol, vec3(.3, .5, .2))), .5);
  vec3 c = alb * (uSkyCol * .8 + sunc * cl * (.34 + .3 * h) + uSunCol * cl * toSun * toSun * (.45 + .7 * h)) * .3183 + uFloor * (.8 + .5 * h);   // the floor: light off the water all round, so the shade side stays olive, never black
#ifdef MIRROR
  float fres = .04 + .96 * pow(clamp(1. - V.y, 0., 1.), 4.);
  gl_FragColor = vec4(c * .55, fres * .9);
  #include <fog_fragment>
  gl_FragColor.rgb *= gl_FragColor.a;
#else
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
#endif
}`;

// the far woods: a dark riverine tree line beyond the herd for the spray to stand against (a ribbon whose top
// is cut into crowns; real palms are planted along it)
const WOODS_VERT = FOG_V + /* glsl */`
attribute vec2 aSV;                         // metres along, 0..1 up
varying vec2 vSV; varying vec3 vWorld;
void main(){ vSV = aSV; vWorld = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WOODS_FRAG = FOG_F + NOISE_GLSL + /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uDark, uLeaf, uFloor;
varying vec2 vSV; varying vec3 vWorld;
void main(){
  float x = vSV.x, y = vSV.y;
  float crown = dvn(vec2(x * .045, 3.)) * .5 + dvn(vec2(x * .13, 7.)) * .36 + dvn(vec2(x * .41, 1.)) * .14;
  float top = .4 + .56 * crown;
  if(y > top) discard;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-5, 0.));
  float back = max(dot(-V, uSunDir), 0.), lump = dvn(vec2(x * .22, y * 5.)) * .6 + dvn(vec2(x * .7, y * 11.)) * .4;
  float face = smoothstep(-.4, .6, dot(V.xz, uSunDir.xz));            // sunlit when we stand between it and the sun
  vec3 alb = mix(uDark, uLeaf, lump * (.35 + .65 * face)) * (.55 + .45 * smoothstep(0., .5, y));
  vec3 c = alb * (uSkyCol * .5 + uSunCol * cloudSh(vWorld.xz) * (.08 + .5 * face * lump)) * .3183;
  c += uLeaf * uSunCol * back * back * smoothstep(top - .1, top, y) * .05;      // the lit fringe of the crowns against the light
  c += uFloor * (1.1 + .5 * y);                                                    // far off and against the light: the dark green of the palette, not black
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

export default {
  id: 'delta-in-flood',
  name: 'The Flood Comes to the Delta',
  category: 'wilderness',
  weirdness: 0.05,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, noise = ctx.noise, detail = ctx.quality?.detail ?? 1;
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const scene = new THREE.Scene();

    // ----- which visit is this: hour, weather, season, cast -----
    const vr = rng.fork('look'), hr = (vr() * 4) % 1;
    const hour = { dawn: 'dawn', day: 'afternoon', golden: 'golden', night: 'night' }[vary.hour] || (hr < 0.28 ? 'golden' : hr < 0.5 ? 'dawn' : hr < 0.58 ? 'night' : 'afternoon');
    const wr = vr(), weather = hour === 'afternoon' ? (wr >= 0.5 ? 'clear' : wr >= 0.25 ? 'haze' : 'wind') : (hour === 'golden' && wr < 0.25 ? 'wind' : 'clear');
    const season = vr.pick(['flood', 'flood', 'may', 'august']), buffalo = vr.chance(0.14), sitatunga = vr.chance(0.4), rare = !!vary.rare;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), night = hour === 'night';
    const L = { ...LOOKS[hour] };
    let cloudK = night ? 0.3 : 0.5, windK = rng.range(0.8, 1.15), ruffle = 0.12;
    if (weather === 'haze') { L.fog = '#d3bd9c'; L.fogD *= 2.0; L.sun = '#ffc68a'; L.sunI *= 0.74; L.zenith = '#7c9cbe'; L.mid = '#b0b8ba'; L.horizon = '#dcc29a'; L.scatter = '#ffb880'; L.scatterK = 0.7; L.scatterPow = 4; L.cloud = 0.12; L.glit *= 0.6; cloudK = 0; L.papGold = '#9a8c4c'; L.sunDisc = 7; L.curtain *= 0.9; }
    if (weather === 'wind') { windK = 2.4; ruffle = 0.85; L.cloud += 0.14; cloudK += 0.1; }
    const elR = (L.sunEl * Math.PI) / 180, azJ = rng.range(-0.1, 0.1);
    const sunDir = new THREE.Vector3(Math.cos(elR) * Math.cos(azJ), Math.sin(elR), Math.cos(elR) * Math.sin(azJ));   // on +X: square on our left
    const windXZ = new THREE.Vector2(-0.55, 0.83).rotateAround(new THREE.Vector2(), rng.range(-0.4, 0.4));

    // ----- sky, fog, light -----
    const cloudOpts = { coverage: L.cloud, softness: 0.26, scale: 1.7, opacity: 0.9, detail: 0.6, lit: L.cloudLit, shade: L.cloudShade, wind: [windXZ.x * 0.012 * windK, windXZ.y * 0.012 * windK], haze: 0.3 };
    const sky = SKY.makeSky(night
      ? { rng, preset: 'night', milkyWay: 0.3, stars: 0.85, bodyOverrides: { 0: { elevation: L.sunEl, azimuth: 90 + (azJ * 180) / Math.PI, size: 2.1, glow: 0.12 } }, clouds: cloudOpts, fogColor: L.fog, bake: true, renderer: ctx.renderer }
      : { rng, preset: L.preset, zenith: L.zenith, mid: L.mid, horizon: L.horizon, ground: L.ground, horizonPow: 4.2, scatterColor: L.scatter, scatter: L.scatterK, scatterPow: L.scatterPow,
        sunDirection: sunDir, sunColor: L.sun, sunSize: 1.5, sunIntensity: L.sunDisc, sunGlow: weather === 'haze' ? 1.0 : 0.6, clouds: cloudOpts, clouds2: false,
        moon: { elevation: 37, azimuth: -84, size: 1.5, phase: 0.6, phaseAngle: 110, intensity: 0.55, texture: 0.5 },
        lightColor: L.sun, lightIntensity: L.sunI, ambientColor: L.amb, groundLight: L.groundLight, ambientIntensity: L.ambI, lightElevationMin: 9, fogColor: L.fog, cloudLit: L.cloudLit, cloudShade: L.cloudShade,
        bake: true, renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(C(L.fog), L.fogD);
    const rig = SKY.makeLightRig(sky, { intensity: 1, ambient: 1, bounce: 0.45 });
    scene.add(rig.object);
    const sunCol = C(L.sun).multiplyScalar(L.sunI), fillCol = C(L.amb).multiplyScalar(L.ambI * 0.9), horizonCol = C(L.horizon), skyRef = night ? C('#1a3a72') : C(L.zenith).lerp(C(L.mid), 0.45);
    // uniforms shared by every material of this world (one clock, one sun, one cloud shadow, one wind, one wall shadow)
    const SH = {
      uTime: { value: 0 }, uCloud: { value: new THREE.Vector4(1 / 310, 0, 0, cloudK) }, uSunDir: { value: sunDir.clone() }, uSunCol: { value: sunCol }, uSkyCol: { value: fillCol }, uHorizon: { value: horizonCol },
      uWind: { value: new THREE.Vector4(windXZ.x, windXZ.y, 0.55 * windK, 0.8 + 0.25 * windK) }, uSlip: { value: new THREE.Vector4(0, 100, 0, 1.25) },
      uShade: { value: null }, uBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uHigh: { value: 1 },
    };
    const mat = (vs, fs, uniforms, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...uniforms }, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
    const lit = () => ({ uSunDir: SH.uSunDir, uSunCol: SH.uSunCol, uSkyCol: SH.uSkyCol, uCloud: SH.uCloud, uShade: SH.uShade, uBox: SH.uBox });
    await ctx.yield();

    // ----- the hero: the herd and its wall of spray (world space = its local space) -----
    const poolD = rng.range(-6, 2), WHEEL = { z: -35, sigma: 42, amp: 31 }, wheelAtPool = rare ? WHEEL.amp * Math.exp(-(((40 - WHEEL.z) / WHEEL.sigma) ** 2)) : 0;
    const hero = await buildHero(ctx, { palette: PALETTE, hour, weather, season, cast: buffalo ? 'buffalo' : 'lechwe', water: 'wake', duration: DURATION,
      count: Math.round(clamp((buffalo ? 270 : 400) * density, 250, 520)), sunDir: sunDir.toArray(), pool: { z: 40, d: poolD + wheelAtPool, radius: 20 }, wheel: rare ? WHEEL : undefined, nearLanes: rare ? 5 : 3, nearMax: rare ? 172 : 150,
      curtainGain: L.curtain, crownGain: L.crown, curtainHeight: buffalo ? 13 : 12, curtainNear: -11 });   // the wall of spray stands behind the three flank lanes: they run clear in front of it
    scene.add(hero.object);
    hero.setLight({ sunColor: sunCol });
    hero.uniforms.uSprayCol.value.multiplyScalar(L.spray);
    { const HP = hero.parts, hu = HP.herdMat.uniforms; if (rare) HP.uCurt.value.w *= 0.8;                                    // the rare flight passes through it
      hu.uSkyCol = { value: hu.uSkyCol.value.clone().multiplyScalar(night ? 1.5 : hour === 'afternoon' ? 1.0 : 1.3) }; hu.uBounce = { value: hu.uBounce.value.clone().multiplyScalar(night ? 2.6 : hour === 'afternoon' ? 1.25 : 1.7).add(C('#6a5a3a').multiplyScalar(night ? 0.1 : 0.2)) }; }   // dark chestnut on the shadow side, cut out against the lit spray
    const A = hero.anchors, fl = hero.flankX, pace = A.paceLine, seat = new THREE.Vector3(...A.portalSeat.position);
    const pool = { x: A.pool.position[0], z: A.pool.position[2], r: A.pool.radius };
    await ctx.yield();

    // ----- the path -----
    const z0 = -690 + rng.range(-12, 10), zA = -330, xA = fl(zA) - 44, sl = rng.range(-0.055, -0.015);
    const mA = rng.range(5.2, 6.8) * rng.sign(), mk = Math.PI / rng.range(70, 80), mph = rng.range(0, TAU);
    const chanX = (z) => xA + sl * (z - zA) + mA * Math.sin(mk * (z - zA) + mph) * smoothstep(z0 + 80, z0 + 180, z) * (1 - smoothstep(zA - 46, zA, z));
    const ptsP = [[chanX(z0), 26.3, z0], [chanX(z0 + 36), 26.3, z0 + 36], [chanX(z0 + 72), 26, z0 + 72], [chanX(z0 + 104), 20.2, z0 + 104], [chanX(z0 + 136), 11.2, z0 + 136], [chanX(z0 + 163), 5.2, z0 + 163], [chanX(z0 + 188), 2.95, z0 + 188]];
    for (let z = z0 + 222; z < zA - 18; z += 34) ptsP.push([chanX(z), WY + 2.2, z]);                       // low between the walls: their tops stand well above the eye
    ptsP.push([xA, WY + 2.5, zA], [fl(-270) - 24, WY + 3.3, -270]);
    const riseAt = (z) => (rare ? 1.9 * smoothstep(-150, -95, z) * (1 - smoothstep(12, 50, z)) : 0);        // the rare flight goes over the wheeling herd, not through it
    const PD = [14.5, 11, 9.5, 9.5, 9.5, 11, 14.5];                                                      // the pace: metres outside the flank lane
    pace.forEach((p, i) => ptsP.push([fl(p[2]) - (PD[i] ?? 13), p[1] + riseAt(p[2]), p[2]]));
    const fT = A.flyThrough, nF = fT.length, dirE = new THREE.Vector3(seat.x - fT[nF - 2][0], seat.y - fT[nF - 2][1], seat.z - fT[nF - 2][2]).normalize();
    ptsP.push([fT[nF - 4][0], fT[nF - 4][1] + riseAt(35), fT[nF - 4][2]], [fT[nF - 3][0], fT[nF - 3][1] + riseAt(70), fT[nF - 3][2]]);
    const lead = new THREE.Vector3(...fT[nF - 2]);
    ptsP.push(lead.toArray(), lead.clone().lerp(seat, 0.5).toArray(), seat.toArray());
    const path = makePath(ptsP);
    await ctx.yield();
    const frame = (u) => { const p = path.pointAt(u), t = path.tangentAt(u); t.y = 0; t.normalize(); return { p, t, l: new THREE.Vector3(t.z, 0, -t.x) }; };   // l = our left (+X when heading +Z)
    const at = (u, left = 0, fwd = 0, y = null) => { const f = frame(u), q = f.p.clone().addScaledVector(f.l, left).addScaledVector(f.t, fwd); if (y !== null) q.y = y; return q; };
    const uOfZ = (z) => { let lo = 0, hi = 1; for (let i = 0; i < 24; i++) { const m = (lo + hi) / 2; if (path.pointAt(m).z < z) lo = m; else hi = m; } return (lo + hi) / 2; };
    const uPace0 = uOfZ(pace[0][2]), uPace1 = uOfZ(pace[pace.length - 1][2]);
    hero.setRun({ zStart: pace[0][2] + 60 - A.herd.travel * uPace0 });
    await ctx.yield();
    // x of the path for every z (the channel is cut along it)
    const XT0 = Math.floor(z0) - 240, XTN = 760, xTab = new Float32Array(XTN);
    { let u = 0; for (let i = 0; i < XTN; i++) { if ((i & 63) === 0) await ctx.yield();   // a slice at a time
      const z = XT0 + i; if (z <= z0) { xTab[i] = chanX(z0) + (z - z0) * (path.startTangent.x / Math.max(path.startTangent.z, 0.2)); continue; } while (u < 1 && path.pointAt(u).z < z) u += 0.0012; xTab[i] = path.pointAt(Math.min(u, 1)).x; } }
    const pathX = (z) => { const f = clamp(z - XT0, 0, XTN - 1.001), i = Math.floor(f); return lerp(xTab[i], xTab[i + 1], f - i); };
    await ctx.yield();

    // ----- the lie of the land: channel, bay, pool, veins, islands, papyrus beds -----
    const zMouth = -306 + rng.range(-5, 5), uMouth = uOfZ(zMouth), mph2 = rng.range(0, TAU);
    const I1 = { ...(() => { const q = at(0.405, 37); return { x: q.x, z: q.z }; })(), r: 25, h: 1.7, ph: rng.range(0, TAU), near: true, name: 'first' };
    const exitC = seat.clone().addScaledVector(new THREE.Vector3(dirE.x, 0, dirE.z).normalize(), 9), IX = { x: exitC.x, z: exitC.z, r: 33, h: 1.5, ph: rng.range(0, TAU), near: true, name: 'exit' };
    const bay = (() => { const q = at(0.321, -14.5); return { x: q.x, z: q.z, r: 10 }; })();
    const bar = { ...(() => { const q = at(0.384, 10.8); return { x: q.x, z: q.z }; })(), r: 4.6, h: 0.42, ph: 1.3, bare: true };
    const side = [at(0.262, -9), at(0.262, -62, 46), at(0.445, 9), at(0.445, 44, 30)].map((q) => [q.x, q.z]);            // two side channels cut into the beds
    // the hippos' road from the pool across our line: the yawner lies in it ahead-left of the eagle's strike
    const uStrike = 0.835, strikeP = rare ? at(uStrike, -2.6, 11) : at(uStrike, 2.2, 10), yawnQ = rare ? at(uStrike, -6.6, 14.5) : at(uStrike, 7.0, 13);   // the rare herd wheels over the left: then the pool's bull lies on our right
    const lobe = (() => { const a = rare ? strikeP : yawnQ, b = rare ? yawnQ : strikeP, ex = b.x - a.x, ez = b.z - a.z, el = Math.hypot(ex, ez) || 1; return [[pool.x, pool.z], [a.x, a.z], [b.x, b.z], [b.x + (ex / el) * 8, b.z + (ez / el) * 8]]; })();
    const veins = [{ x: pathX(-200) - rng.range(75, 95), a: 16, f: 0.021, p: rng.range(0, TAU), w: 6.5, z0: -330, z1: 700 }, { x: rng.range(95, 120), a: 22, f: 0.016, p: rng.range(0, TAU), w: 8, z0: -200, z1: 900 },
      { x: -rng.range(200, 240), a: 30, f: 0.012, p: rng.range(0, TAU), w: 9, z0: -250, z1: 900 }];
    const segD = (x, z, a, b, c, d) => { const vx = c - a, vz = d - b, t = clamp(((x - a) * vx + (z - b) * vz) / (vx * vx + vz * vz), 0, 1); return Math.hypot(x - a - vx * t, z - b - vz * t); };
    const arcK = hero.uniforms.uLane.value.x, laneD = (x, z) => x - 0.5 * arcK * z * z;      // lateral position in the herd's band
    // islands: the two the flight meets, then a scatter at three distances
    const isles = [I1, IX, bar];
    { const ir = rng.fork('isles'), eleC = at(0.555, -22);
      const ok = (x, z, r) => {
        if (path.nearestXZ(x, z).dist < r + 46) return false;
        if (z < 330 && Math.abs(laneD(x, z)) < 52 + r) return false;
        if (Math.hypot(x - pool.x, z - pool.z) < 50 + r || Math.hypot(x - eleC.x, z - eleC.z) < 40 + r) return false;
        if (z < zMouth + 30 + r && x < fl(Math.min(z, 0)) - 4 + r) return false;                                         // not in the swamp
        for (const q of isles) if (Math.hypot(x - q.x, z - q.z) < q.r + r + 55) return false;
        return true;
      };
      const ring = (n, d0, d1, r0, r1) => { for (let i = 0, tries = 0; i < n && tries < 400; tries++) { const u = ir.range(0.42, 1.25), f = frame(Math.min(u, 1)), sgn = ir.sign(), lat = ir.range(d0, d1) * sgn, r = ir.range(r0, r1);
        const x = f.p.x + f.l.x * lat + f.t.x * (u > 1 ? (u - 1) * path.length : 0), z = f.p.z + f.l.z * lat + f.t.z * (u > 1 ? (u - 1) * path.length * 1.6 : 0);
        if (!ok(x, z, r)) continue; isles.push({ x, z, r, h: ir.range(1.2, 1.9), ph: ir.range(0, TAU), near: d1 < 260 }); i++; } };
      ring(5, 62, 150, 15, 26); await ctx.yield(); ring(8, 170, 420, 22, 40); await ctx.yield(); ring(11, 480, 1250, 30, 45);
    }
    await ctx.yield();
    const hwAt = (z) => 10.6 - 1.6 * smoothstep(zMouth - 60, zMouth - 8, z);
    const SDR = 16;                                                                             // the baked distance field reaches this far from the bed edge
    const papSdAt = (x, z) => {
      const px = pathX(z);
      let sd = Math.abs(x - px) - hwAt(z);
      sd = Math.min(sd, zMouth + 6 * Math.sin(x * 0.09 + mph2) + 3.5 * Math.sin(x * 0.23) - z, fl(Math.min(z, 0)) - 17 + 5 * Math.sin(z * 0.05 + mph2) - x, x - (px - 255 - 30 * Math.sin(z * 0.011)), z - (z0 - 205));
      if (sd <= -SDR) return -SDR;
      sd = Math.min(sd, Math.hypot(x - bay.x, z - bay.z) - bay.r, Math.hypot(x - I1.x, z - I1.z) - I1.r * 1.1 - 2.5, Math.hypot(x - bar.x, z - bar.z) - bar.r - 1.5);
      sd = Math.min(sd, segD(x, z, side[0][0], side[0][1], side[1][0], side[1][1]) - 3.6, segD(x, z, side[2][0], side[2][1], side[3][0], side[3][1]) - 3.2);
      return Math.max(sd, -SDR);
    };
    const depthAt = (x, z) => {
      let d = 0.3;
      const cd = hwAt(z) - Math.abs(x - pathX(z));
      if (cd > 0 && z < zMouth + 60) d = Math.max(d, 0.3 + 2.9 * smoothstep(0.5, 6.5, cd) * (1 - smoothstep(zMouth + 6, zMouth + 60, z)));      // the channel shoals onto the plain
      const bd = bay.r - Math.hypot(x - bay.x, z - bay.z); if (bd > 0) d = Math.max(d, 0.3 + 2.4 * smoothstep(0, 5, bd));
      const pd = pool.r - Math.hypot(x - pool.x, z - pool.z) + 1.6 * Math.sin(x * 0.4) * Math.sin(z * 0.33); if (pd > -3) d = Math.max(d, 0.3 + 2.9 * smoothstep(-3, 3, pd));
      if (Math.abs(z - yawnQ.z) < 60) { let ls = 1e9; for (let s = 0; s < 3; s++) ls = Math.min(ls, segD(x, z, lobe[s][0], lobe[s][1], lobe[s + 1][0], lobe[s + 1][1])); const ld = 5.5 - ls + Math.sin(x * 0.3 + z * 0.2); if (ld > -2) d = Math.max(d, 0.3 + 2.2 * smoothstep(-2, 2.5, ld)); }
      for (const s of [0, 2]) { const sdd = 3.4 - segD(x, z, side[s][0], side[s][1], side[s + 1][0], side[s + 1][1]); if (sdd > 0) d = Math.max(d, 0.3 + 1.6 * smoothstep(0, 2.5, sdd)); }
      for (const v of veins) if (z > v.z0 && z < v.z1) { const vd = v.w - Math.abs(x - v.x - v.a * Math.sin(z * v.f + v.p) - 0.35 * v.a * Math.sin(z * v.f * 2.7 + v.p)); if (vd > 0) d = Math.max(d, 0.3 + 2 * smoothstep(0, 3.5, vd) * smoothstep(v.z0, v.z0 + 60, z)); }
      return d;
    };
    const lilyK = season === 'august' ? 1.5 : 1;
    // lily rafts lie across our line every twenty metres or so, and along both margins
    const raftZ = [0.213, 0.238, 0.262, 0.287, 0.312, 0.337, 0.362, 0.39, 0.415, 0.44, 0.465].map((u) => path.pointAt(u).z + rng.range(-3, 3));
    const lilyAt = (x, z, psd, dep) => {
      if (dep < 0.5 || psd > 0.5) return 0;
      const patch = 0.5 + 0.5 * Math.sin(x * 0.33 + Math.sin(z * 0.19) * 2) * Math.sin(z * 0.21 + Math.sin(x * 0.13) * 2), cd = hwAt(z) - Math.abs(x - pathX(z));
      let k = 0;
      if (cd > 0 && z < zMouth + 40) {
        let raft = 0; for (let ri = 0; ri < raftZ.length; ri++) { const lane = ri % 2 ? 1 : smoothstep(1.5, 4.5, Math.abs(x - pathX(z) + (ri % 4 ? 2.5 : -2.5))); raft = Math.max(raft, (1 - smoothstep(2.4, 5.6, Math.abs(z - raftZ[ri] + 3 * Math.sin(x * 0.3)))) * lane); }   // every other raft leaves a lead of open water
        k = Math.max((1 - smoothstep(2.6, 5.2, cd)) * smoothstep(0.25, 0.5, patch), raft * smoothstep(0.3, 0.55, patch + 0.22));
      }
      const bd = Math.hypot(x - bay.x, z - bay.z) / bay.r; if (bd < 1) k = Math.max(k, smoothstep(0.55, 0.9, bd) * patch);
      const pd = Math.hypot(x - pool.x, z - pool.z) / pool.r; if (pd < 1.05) k = Math.max(k, smoothstep(0.72, 0.95, pd) * smoothstep(0.35, 0.6, patch) * 0.8);
      return clamp(k * lilyK, 0, 1);
    };
    const grassAt = (x, z, psd, dep) => {
      if (psd > -1.5 || dep > 0.55) return 0;
      let k = 1;
      for (const q of isles) { const dx = x - q.x, dz = z - q.z, rr = q.r + 4; if (dx * dx + dz * dz < rr * rr) k = Math.min(k, smoothstep(0.4, 3, Math.sqrt(dx * dx + dz * dz) - q.r)); }
      if (Math.abs(laneD(x, z)) < 36 && z < 260) k *= 0.55;                     // trampled where the herd runs
      return k;
    };
    // bake it: r depth / 4, g papyrus signed distance, b grass, a lilies; and beside it how high the shadow of the papyrus walls stands
    const MW = 384, MH = 832, BX0 = -345, BZ0 = z0 - 232, BW = 610, BH = 1350, mdata = new Uint8Array(MW * MH * 4);
    for (let j = 0; j < MH; j++) {
      const z = BZ0 + ((j + 0.5) / MH) * BH;
      for (let i = 0; i < MW; i++) {
        if ((i & 63) === 0) await ctx.yield();   // a few dozen samples at a time: asking is free
        const x = BX0 + ((i + 0.5) / MW) * BW, k = (j * MW + i) * 4, psd = papSdAt(x, z), dep = depthAt(x, z);
        mdata[k] = Math.min(255, Math.round((dep / 4) * 255)); mdata[k + 1] = Math.round(clamp((psd + SDR) / (2 * SDR), 0, 1) * 255); mdata[k + 2] = Math.round(grassAt(x, z, psd, dep) * 255); mdata[k + 3] = Math.round(lilyAt(x, z, psd, dep) * 255);
      }
    }
    const maskTex = new THREE.DataTexture(mdata, MW, MH, THREE.RGBAFormat, THREE.UnsignedByteType);
    maskTex.magFilter = maskTex.minFilter = THREE.LinearFilter; maskTex.wrapS = maskTex.wrapT = THREE.ClampToEdgeWrapping; maskTex.needsUpdate = true;
    await ctx.yield();
    const WALL_H = 5.8, sdata = new Uint8Array(MW * MH), dxm = BW / MW, tanEl = Math.tan(Math.max(elR, 0.06));
    for (let j = 1; j < MH - 1; j++) {
      let h = -1;
      for (let i = MW - 2; i > 0; i--) {                                    // the sun stands on +X: shadows run toward -X
        const k = j * MW + i; h = Math.max(h - dxm * tanEl, -1); sdata[k] = Math.round(clamp((h + 1) / 9, 0, 1) * 255);
        if (mdata[k * 4 + 1] > 134) h = WALL_H;
      }
      if ((j & 31) === 0) await ctx.yield();
    }
    const shadeTex = new THREE.DataTexture(sdata, MW, MH, THREE.RedFormat, THREE.UnsignedByteType);
    shadeTex.magFilter = shadeTex.minFilter = THREE.LinearFilter; shadeTex.wrapS = shadeTex.wrapT = THREE.ClampToEdgeWrapping; shadeTex.needsUpdate = true;
    SH.uShade.value = shadeTex; SH.uBox.value.set(BX0, BZ0, 1 / BW, 1 / BH);
    const MU = { uMask: { value: maskTex } };
    const lilyBaked = (x, z) => { const i = clamp(Math.floor(((x - BX0) / BW) * MW), 0, MW - 1), j = clamp(Math.floor(((z - BZ0) / BH) * MH), 0, MH - 1); return mdata[(j * MW + i) * 4 + 3] / 255; };
    const shadeAt = (x, z) => { const i = clamp(Math.floor(((x - BX0) / BW) * MW), 0, MW - 1), j = clamp(Math.floor(((z - BZ0) / BH) * MH), 0, MH - 1); return (sdata[j * MW + i] / 255) * 9 - 1; };   // m of shadow above the water

    // ----- the water -----
    const gA = C(season === 'may' ? '#b8a860' : season === 'august' ? '#8fa24c' : '#a8a458'), gB = C(season === 'may' ? '#8f8a4c' : season === 'august' ? '#587f3c' : '#647e3e');
    { const su = hero.parts.sheet?.material?.uniforms; if (su) { su.uBed.value.multiplyScalar(0.6); su.uGrassA.value = gA; su.uGrassB.value = gB; } }
    const papFloor = new THREE.Color().fromArray(L.papFloor), papGreen = C(night ? '#7f9a78' : '#80a854'), papCulm = C('#69734a'), papGold = C(L.papGold);   // albedos: a mop in shade, the culms' olive, a mop in the sun
    const waterMat = mat(WATER_VERT, WATER_FRAG, { ...MU, ...lit(), uTime: SH.uTime, uWind: SH.uWind,
      uSkyCol: { value: skyRef }, uHorizon: { value: horizonCol.clone().multiplyScalar(0.96) }, uDeep: { value: C(PALETTE[2]) }, uBed: { value: C('#cdbb8c') }, uGrassA: { value: gA }, uGrassB: { value: gB },
      uCulm: { value: papCulm }, uGreen: { value: papGreen }, uGold: { value: papGold }, uFloor: { value: papFloor }, uPapFloor: { value: C('#465a2c') }, uPetal: { value: C('#ece8fb') },
      uPadA: { value: C('#3d7436') }, uPadB: { value: C('#86a84a') }, uWater: { value: new THREE.Vector4(ruffle, L.glit, season === 'may' ? 1.2 : 1, L.mirrorK) }, uFill: SH.uSkyCol, uMirror: { value: C(L.mirror) }, uWall: { value: new THREE.Vector4(6.2, 0, 0, zMouth + 30) } });
    const water = new THREE.Mesh(new THREE.PlaneGeometry(9600, 9600).rotateX(-Math.PI / 2), waterMat);
    water.position.set(-40, WY, -100); water.frustumCulled = false; water.name = 'flood'; scene.add(water);
    await ctx.yield();

    // ----- islands -----
    const isleMat = mat(ISLE_VERT, ISLE_FRAG, { ...lit(), uFloor: { value: new THREE.Color().fromArray(L.papFloor) }, uSand: { value: C('#cdbb98') }, uSalt: { value: C('#ece6d6') }, uTurf: { value: C('#a39a55') }, uTurfB: { value: C('#6f8040') }, uUnder: { value: C('#4b4a30') } });
    const isleMesh = new THREE.Mesh(islandsGeometry(isles), isleMat); isleMesh.name = 'islands'; isleMesh.frustumCulled = false; scene.add(isleMesh);
    const groundY = (x, z) => { let y = WY - 0.3; for (const q of isles) { const dx = x - q.x, dz = z - q.z; if (dx * dx + dz * dz < q.r * q.r * 1.3) y = Math.max(y, isleH(q, x, z)); } return y; };
    await ctx.yield();

    // ----- papyrus: two ranks of tall clumps along the water's edge, cards behind, a canopy of mop heads seen from above -----
    const papTex = await papyrusTexture(rng.fork('ptex'), ctx.yield);
    await ctx.yield();
    const PG = papyrusGeometries(rng.fork('pgeo')), pr = rng.fork('pap');
    await ctx.yield();
    const papMat = mat(PAP_VERT, PAP_FRAG, { ...lit(), uTime: SH.uTime, uWind: SH.uWind, uSlip: SH.uSlip, uHigh: SH.uHigh, uMap: { value: papTex }, uCulm: { value: papCulm }, uGreen: { value: papGreen }, uGold: { value: papGold }, uFloor: { value: papFloor } }, { side: THREE.DoubleSide });
    const papGroup = new THREE.Group(); papGroup.name = 'papyrus'; scene.add(papGroup);
    const NB = 6, zB0 = z0 - 205, zBw = (zMouth + 14 - zB0) / NB, mkB = () => Array.from({ length: NB }, () => ({ p: [], q: [] }));
    const bkA = mkB(), bkB = mkB(), bkC = mkB();
    const put = (bk, x, z, sc, hk) => { const b = bk[clamp(Math.floor((z - zB0) / zBw), 0, NB - 1)]; b.p.push(x, z, pr() * TAU, sc); b.q.push(pr(), pr(), hk, 0); };
    const cl0 = [];                                                                             // every clump first: one that stands alone is dropped
    const clump = (x, z, hk = 1.2, back = 0) => { if (papSdAt(x, z) < 0.25 || path.nearestXZ(x, z).dist < 9.4) return; cl0.push([x, z, hk, back]); };
    for (let z = z0 + 104; z < zMouth + 8; z += 2.0) for (const sgn of [-1, 1]) {
      if (sgn < 0) await ctx.yield();
      const zz = z + pr.range(-0.6, 0.6), px = pathX(zz), hw = hwAt(zz);
      clump(px + sgn * (hw + 0.45 + pr.range(0, 1.0)), zz, 1.26);
      if (pr.chance(0.9 * detail)) clump(px + sgn * (hw + 2.5 + pr.range(0, 1.5)), zz + 1.0, 1.44);                 // the rank behind stands taller: no sky between the culms
    }
    const rim = (cx, cz, r, step) => { for (let a = 0; a < TAU; a += step / r) { const rr = r + pr.range(0.3, 1.5); clump(cx + Math.cos(a) * rr, cz + Math.sin(a) * rr, 1.2, 1); } };
    await ctx.yield();
    rim(bay.x, bay.z, bay.r, 1.8); rim(I1.x, I1.z, I1.r * 1.1 + 2.5, 2.6); rim(bar.x, bar.z, bar.r + 1.5, 2.2);
    // the mouth: three ranks thinning out onto the plain, cards behind them
    for (let x = -70; x < 70; x += 2.2) { const xx = pathX(zMouth) + x + pr.range(-0.7, 0.7); if (Math.abs(x) > hwAt(zMouth) + 0.4) for (let k = 0; k < 3; k++) clump(xx + pr.range(-0.5, 0.5), zMouth + 6 * Math.sin(xx * 0.09 + mph2) + 3.5 * Math.sin(xx * 0.23) - 0.6 - k * 2.0 - pr(), 1.05 + 0.17 * k, 1); }
    for (const s of [0, 2]) for (let t = 0.04; t < 1; t += 0.05) for (const sgn of [-1, 1]) { const dx = side[s + 1][0] - side[s][0], dz = side[s + 1][1] - side[s][1], l = Math.hypot(dx, dz); clump(side[s][0] + dx * t + (-dz / l) * sgn * (4.2 + pr()), side[s][1] + dz * t + (dx / l) * sgn * (4.2 + pr()), 1.15, 1); }
    await ctx.yield();
    const cardAt = (x, z, min) => { if (papSdAt(x, z) < min) return; put(bkC, x, z, pr.range(0.9, 1.15), pr.range(0.9, 1.08)); };
    { // a clump needs company: two neighbours within 3 m, or it would stand in the open like a dandelion
      const cell = new Map(), key = (x, z) => Math.floor(x / 3) + ':' + Math.floor(z / 3);
      for (const c of cl0) { const k = key(c[0], c[1]); if (!cell.has(k)) cell.set(k, []); cell.get(k).push(c); }
      for (let i = 0; i < cl0.length; i++) {
        if ((i & 31) === 0) await ctx.yield();
        const c = cl0[i], cx = Math.floor(c[0] / 3), cz = Math.floor(c[1] / 3); let nb = 0;
        for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const list = cell.get((cx + dx) + ':' + (cz + dz)); if (list) for (const o of list) if (o !== c && Math.hypot(o[0] - c[0], o[1] - c[1]) < 3) nb++; }
        if (nb < 2) continue;
        put(pr.chance(0.55) ? bkA : bkB, c[0], c[1], pr.range(0.92, 1.12), c[2] * pr.range(0.92, 1.08));
        if (c[3]) { const a = pr() * TAU, bx = c[0] + Math.cos(a) * 1.3, bz = c[1] + Math.sin(a) * 1.3; if (papSdAt(bx, bz) > 0.25 && path.nearestXZ(bx, bz).dist > 9.4) put(bkB, bx, bz, pr.range(0.82, 1.0), c[2] * pr.range(0.9, 1.1)); }   // rims and the mouth: a second clump behind, so no stalk stands bare
      }
    }
    await ctx.yield();
    for (let z = z0 - 30; z < zMouth + 8; z += 3.3) for (const sgn of [-1, 1]) for (let lat = 5.2; lat < 17; lat += 3.0 + lat * 0.03) cardAt(pathX(z) + sgn * (hwAt(z) + lat + pr.range(-0.9, 0.9)), z + pr.range(-1.3, 1.3), 2.2);
    await ctx.yield();
    for (const s of [0, 2]) for (let t = 0.04; t < 1; t += 0.03) for (const sgn of [-1, 1]) { const dx = side[s + 1][0] - side[s][0], dz = side[s + 1][1] - side[s][1], l = Math.hypot(dx, dz); cardAt(side[s][0] + dx * t + (-dz / l) * sgn * (5.4 + pr()), side[s][1] + dz * t + (dx / l) * sgn * (5.4 + pr()), 1.4); }
    let papTris = 0;
    const papMesh = (base, bk) => bk.forEach((b, bi) => {
      const n = b.p.length / 4; if (!n) return;
      const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
      g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(b.p), 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(new Float32Array(b.q), 4)); g.instanceCount = n;
      let x0 = 1e9, x1 = -1e9; for (let i = 0; i < n; i++) { x0 = Math.min(x0, b.p[i * 4]); x1 = Math.max(x1, b.p[i * 4]); }
      const zc = zB0 + (bi + 0.5) * zBw; g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, 3.5, zc), Math.hypot((x1 - x0) / 2 + 6, zBw / 2 + 6, 9));
      const m = new THREE.Mesh(g, papMat); m.name = base === PG.card ? 'papyrus-cards' : 'papyrus-clumps'; papGroup.add(m); papTris += n * (base.index.count / 3);
    });
    papMesh(PG.clumpA, bkA); papMesh(PG.clumpB, bkB); papMesh(PG.card, bkC);
    await ctx.yield();
    { // canopy sheet
      const P = [], I = [], CS = 9, yAt = (x, z) => 5.5 + 0.5 * noise.n2(x * 0.045, z * 0.045);
      for (let z = z0 - 205; z < zMouth + 12; z += CS) for (let x = -345; x < 140; x += CS) {
        if (x === -345) await ctx.yield();
        if (papSdAt(x + CS / 2, z + CS / 2) < -5) continue;
        const b = P.length / 3; P.push(x, yAt(x, z), z, x + CS, yAt(x + CS, z), z, x + CS, yAt(x + CS, z + CS), z + CS, x, yAt(x, z + CS), z + CS); I.push(b, b + 2, b + 1, b, b + 3, b + 2);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeBoundingSphere();
      const canopy = new THREE.Mesh(g, mat(CANOPY_VERT, CANOPY_FRAG, { ...lit(), ...MU, uTime: SH.uTime, uWind: SH.uWind, uCulm: { value: papCulm }, uGreen: { value: papGreen }, uGold: { value: papGold }, uFloor: { value: papFloor } }, { side: THREE.DoubleSide }));
      canopy.name = 'papyrus-canopy'; scene.add(canopy); papTris += I.length / 3;
    }
    await ctx.yield();

    // ----- island trees: fan palms, date thickets, a fig, a termite spire; the leadwood snag; the two portal palms -----
    const wind = flora.makeWind({ direction: [windXZ.x, windXZ.y], strength: 0.85 * windK, speed: 1 });
    await ctx.yield();
    const treeMat = flora.windMaterial({ wind, backlight: 0.75, backlightTint: '#e6ee9a' });
    await ctx.yield();
    const tr = rng.fork('trees'), figLeaf = { leaf: '#35602c', leafLight: '#6f9a40', leafDark: '#1c3a1c', bark: '#6a5a48', barkDark: '#3a3028' }, dateLeaf = { leaf: '#557f38', leafLight: '#a6c060', leafDark: '#2a4a26', coconuts: false };
    const nearVar = [], farVar = [];                                      // one tree at a time, in this order
    nearVar.push(fanPalmGeometry(tr, { height: 19 })); await ctx.yield();
    nearVar.push(fanPalmGeometry(tr, { height: 16.5, fans: 13 })); await ctx.yield();
    nearVar.push(fanPalmGeometry(tr, { height: 21.5, fans: 15 })); await ctx.yield();
    nearVar.push(flora.palmGeometry({ rng: tr, height: 4.3, detail: 0, fronds: 9, curve: 0.5, ...dateLeaf })); await ctx.yield();
    nearVar.push(flora.oakGeometry({ rng: tr, height: 9.5, detail: 1, fullness: 1.15, ...figLeaf })); await ctx.yield();
    nearVar.push(spireGeometry(tr)); await ctx.yield();
    farVar.push(fanPalmGeometry(tr, { height: 19, segs: 5, sides: 5, fans: 9, pleats: 6 })); await ctx.yield();
    farVar.push(fanPalmGeometry(tr, { height: 16.5, segs: 5, sides: 5, fans: 8, pleats: 6 })); await ctx.yield();
    farVar.push(fanPalmGeometry(tr, { height: 21.5, segs: 5, sides: 5, fans: 9, pleats: 6 })); await ctx.yield();
    farVar.push(flora.palmGeometry({ rng: tr, height: 4.3, detail: 0, fronds: 6, curve: 0.5, ...dateLeaf })); await ctx.yield();
    farVar.push(flora.oakGeometry({ rng: tr, height: 9.5, detail: 0, fullness: 1.15, ...figLeaf }), nearVar[5]);
    await ctx.yield();
    const tpts = [], eF = { t: new THREE.Vector3(dirE.x, 0, dirE.z).normalize() }; eF.l = new THREE.Vector3(eF.t.z, 0, -eF.t.x);
    const plant = (x, z, v, sc) => { const nn = path.nearestXZ(x, z); tpts.push({ x, y: groundY(x, z), z, s: sc, rot: tr() * TAU, d: nn.dist, u: nn.u, v }); };
    for (const q of isles) {
      if (q.bare) continue;
      const exit = q === IX, np = q.near ? 3 + Math.round(q.r / 6) : 2 + Math.round(q.r / 10), toPath = Math.atan2(path.pointAt(path.nearestXZ(q.x, q.z).u).z - q.z, path.pointAt(path.nearestXZ(q.x, q.z).u).x - q.x);
      const spot = (f0, f1, clear) => { for (let k = 0; k < 30; k++) { const a = q === I1 ? toPath + tr.range(-1.9, 1.9) : tr() * TAU, f = tr.range(f0, f1), x = q.x + Math.cos(a) * q.r * f, z = q.z + Math.sin(a) * q.r * f; if (!exit || Math.abs((x - seat.x) * eF.l.x + (z - seat.z) * eF.l.z) > clear) return [x, z]; } return null; };
      for (let i = 0; i < np; i++) { const s = spot(0.08, 0.7, 14); if (s) plant(s[0], s[1], tr.int(0, 2), tr.range(0.82, 1.14)); }
      for (let i = 0, n = q.near ? tr.int(2, 4) : 1; i < n; i++) { const s = spot(0.35, 0.82, 9.5); if (s) for (let k = 0, m = tr.int(2, 3); k < m; k++) plant(s[0] + tr.range(-1.6, 1.6), s[1] + tr.range(-1.6, 1.6), 3, tr.range(0.75, 1.3)); }
      if (q.r > 17) { const s = spot(0.1, 0.45, 16); if (s) plant(s[0], s[1], 4, tr.range(0.8, 1.2)); }
      if (q.near && !exit) { const s = spot(0.5, 0.8, 9); if (s) plant(s[0], s[1], 5, tr.range(0.8, 1.15)); }
    }
    { const sp = seat.clone().addScaledVector(eF.l, -9.5).addScaledVector(eF.t, -15); plant(sp.x, sp.z, 5, 1.05);                    // the spire and the date thicket the last climb passes over
      for (const [lt, fw] of [[10.5, -21], [12.5, -19], [-11, -9], [-13.5, -11.5], [9.8, -7]]) { const q = seat.clone().addScaledVector(eF.l, lt).addScaledVector(eF.t, fw); plant(q.x, q.z, 3, tr.range(0.9, 1.35)); } }
    await ctx.yield();
    // the far woods: a dark riverine tree line beyond the herd for the spray to stand against, and a paler one across the plain
    const woodsMat = (dark, leaf) => mat(WOODS_VERT, WOODS_FRAG, { ...lit(), uFloor: { value: papFloor }, uDark: { value: C(dark) }, uLeaf: { value: C(leaf) } }, { side: THREE.DoubleSide });
    const woods = (xAt, zA0, zA1, hgt, y0, m, name) => {
      const P = [], SV = [], I = [], N = 96;
      for (let i = 0; i <= N; i++) { const z = lerp(zA0, zA1, i / N), x = xAt(z), s = (i / N) * (zA1 - zA0), tp = smoothstep(0, 0.1, i / N) * (1 - smoothstep(0.9, 1, i / N)); P.push(x, y0, z, x, y0 + hgt * tp, z); SV.push(s, 0, s, 1); if (i < N) { const b = i * 2; I.push(b, b + 1, b + 3, b, b + 3, b + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aSV', new THREE.Float32BufferAttribute(SV, 2)); g.setIndex(I); g.computeBoundingSphere();
      const me = new THREE.Mesh(g, m); me.name = name; scene.add(me); return g;
    };
    const wr2 = rng.fork('woods'), wOff = wr2.range(0, 300), wx = (z) => 0.5 * arcK * z * z + 150 + 22 * Math.sin(z * 0.006 + wOff) + 10 * Math.sin(z * 0.017 + wOff * 2);
    const lowSun = hour === 'golden' || hour === 'dawn', woodsG = [woods(wx, -560, 640, lowSun ? 25 : 42, WY - 0.2, woodsMat('#131f17', '#3d5a2a'), 'far-woods'), woods((z) => wx(z) + 34 + 10 * Math.sin(z * 0.011), -600, 700, lowSun ? 33 : 52, WY - 0.2, woodsMat('#16241b', '#35502a'), 'far-woods'),
      woods((z) => pathX(clamp(z, -300, 400)) - 620 - 60 * Math.sin(z * 0.004 + wOff), -200, 900, 20, WY - 0.2, woodsMat('#22321f', '#4a6a30'), 'far-woods')];
    for (let i = 0; i < 46; i++) { const z = wr2.range(-520, 600), x = wx(z) + wr2.range(-10, 26); plant(x, z, wr2.int(0, 2), wr2.range(0.9, 1.3)); }
    await ctx.yield();
    const trees = flora.makeScatter({ rng: rng.fork('tsc'), points: tpts, variants: nearVar, farVariants: farVar, farDistance: 170, path, material: treeMat, heightAt: (x, z) => Math.max(groundY(x, z), WY + 0.03),
      tint: 0.14, hue: 0.03, sink: 0.005, tilt: 0.03, groundShadow: night ? undefined : { sunDir, strength: 0.42, stretch: 2.2, size: 1.1, color: '#1b2a3a' } });
    scene.add(trees.object);
    await ctx.yield();
    const portalPalms = [];
    for (const sg of [1, -1]) {
      const base = seat.clone().addScaledVector(eF.l, sg * 10.6).addScaledVector(eF.t, 0.6); base.y = groundY(base.x, base.z) - 0.1;
      const g = fanPalmGeometry(tr, { height: 19.4 + sg * 0.7, fans: 16, sides: 9, segs: 14, pleats: 10, lean: [-eF.l.x * sg * 5.6 - eF.t.x * 1.4, -eF.l.z * sg * 5.6 - eF.t.z * 1.4] });
      const m = new THREE.Mesh(g, treeMat); m.position.copy(base); m.name = 'portal-palm'; scene.add(m);
      portalPalms.push({ mesh: m, crown: base.clone().add(new THREE.Vector3(-eF.l.x * sg * 5.6 - eF.t.x * 1.4, g.userData.height * 0.93, -eF.l.z * sg * 5.6 - eF.t.z * 1.4)) });
      await ctx.yield();
    }
    // the leadwood snag stands on the sandbar, close by our left: the calling eagle's perch against the sky
    const snagG = flora.deadTreeGeometry({ rng: tr, height: 7.0, detail: 1 });
    const snagPos = at(0.3805, 9.0); snagPos.y = groundY(snagPos.x, snagPos.z) - 0.15;
    const snag = new THREE.Mesh(snagG, treeMat); snag.position.copy(snagPos); snag.name = 'leadwood-snag'; scene.add(snag);
    const perch = snagPos.clone(); { const pa = snagG.attributes.position; let by = -1; for (let i = 0; i < pa.count; i++) if (pa.getY(i) > by) { by = pa.getY(i); perch.set(snagPos.x + pa.getX(i), snagPos.y + by, snagPos.z + pa.getZ(i)); } }
    await ctx.yield();

    // ----- lilies with open flowers across our line; sedge standing through the sheet; dry grass on the islands -----
    const lr = rng.fork('lily'), padCol = { pad: '#3d7436', padLight: '#86a84a', rim: '#6a5a2a', heart: '#f0c648' };
    const padVar = [];
    padVar.push(flora.lilyPadGeometry({ rng: lr, size: 0.6, ...padCol })); await ctx.yield();
    padVar.push(flora.lilyPadGeometry({ rng: lr, size: 0.48, ...padCol })); await ctx.yield();
    padVar.push(flora.lilyPadGeometry({ rng: lr, size: 0.58, flower: true, petal: '#f1effa', petalTip: '#cfcbf5', ...padCol })); await ctx.yield();
    padVar.push(flora.lilyPadGeometry({ rng: lr, size: 0.55, flower: true, petal: '#cdc8f6', petalTip: '#9f99e8', ...padCol })); await ctx.yield();
    const pads = flora.makeLilyPads({ rng: lr, path, uRange: [0.19, uMouth + 0.03], radius: 11, corridor: 0, falloff: 0, count: Math.round(430 * lilyK * (0.6 + 0.4 * detail)), waterY: WY, spacing: 0.62, scale: [0.62, 1.15], material: treeMat,
      variants: padVar,
      shade: (x, z) => (shadeAt(x, z) > 0.15 ? 0.78 : 1), density: (x, z) => (lilyBaked(x, z) > 0.3 ? 1 : 0) });   // read from the baked mask: the kit asks thousands of times in one go
    scene.add(pads.object);
    await ctx.yield();
    const gWind = flora.makeWind({ direction: [windXZ.x, windXZ.y], strength: 1.3 * windK, speed: 1.15, gustScale: 0.04, gustiness: 0.7 });
    const tmpC = new THREE.Color(), gMat = { ambient: 1.1, leafAmbient: 1.25, wrap: 0.5, backlight: 0.95, sheen: 0.7, detail: 0 };
    // the flooded sedge: thick under the eye, thinning with distance; each chunk is culled on its own, the near ones lie mirrored on the water
    const sedgeTex = sedgeTexture(rng.fork('sedge'));
    await ctx.yield();
    const sedgeG = sedgeGeometry(), sr = rng.fork('sg'), sedgeChunks = [];
    const SU = { ...lit(), uTime: SH.uTime, uWind: SH.uWind, uMap: { value: sedgeTex }, uFloor: { value: papFloor }, uRoot: { value: gB.clone().multiplyScalar(0.7) }, uTip: { value: gA.clone().lerp(C('#d8c470'), 0.4) } };
    const sedgeMat = mat(SEDGE_VERT, SEDGE_FRAG, SU, { side: THREE.DoubleSide });
    const mirrorMat = mat(SEDGE_VERT, SEDGE_FRAG, SU, { side: THREE.DoubleSide, transparent: true, depthWrite: false, premultipliedAlpha: true, defines: { MIRROR: 1 } });
    let sedgeTris = 0;
    { const uS0 = uMouth - 0.016, uS1 = 0.975, NCH = 10, bk = Array.from({ length: NCH }, () => ({ p: [], q: [], mp: [], mq: [] }));
      const nNear = Math.round(14500 * detail * (0.85 + 0.15 * density)), nMid = Math.round(15000 * detail * (0.85 + 0.15 * density)), fq = new THREE.Vector3();
      for (let i = 0; i < nNear + nMid; i++) {
        if ((i & 31) === 0) await ctx.yield();   // a few dozen tufts at a time
        const near = i < nNear, u = sr.range(uS0, uS1), lat = near ? sr.range(-9.5, 9.5) : sr.sign() * (9 + 53 * Math.pow(sr(), 1.7));
        const f = frame(u); fq.copy(f.p).addScaledVector(f.l, lat); const x = fq.x, z = fq.z, yaw = sr() * TAU, wd = sr.range(0.55, 1.0) * (near ? 1 : 1.25), hg = sr.range(0.5, 0.95) * (near ? 1 : 1.12), sd = sr(), keep = sr();
        if (z < zMouth + 4 && papSdAt(x, z) > -1.5) continue;
        if (depthAt(x, z) > 0.55 || groundY(x, z) > 0.04) continue;
        if (Math.abs(laneD(x, z) + hero.wheelAt(z)) < 34 && keep > 0.4) continue;                       // trampled where the herd runs
        const b = bk[clamp(Math.floor(((u - uS0) / (uS1 - uS0)) * NCH), 0, NCH - 1)], tint = clamp(0.5 + 0.9 * noise.n2(x * 0.021, z * 0.021) + (sd - 0.5) * 0.5, 0, 1);
        b.p.push(x, z, yaw, wd); b.q.push(sd, tint, hg, 0);
        if (near && keep < 0.55) { b.mp.push(x, z, yaw, wd); b.mq.push(sd, tint, hg, 0); }
      }
      const mk = (P, Q, m, mirror) => {
        const n = P.length / 4; if (!n) return null;
        const g = new THREE.InstancedBufferGeometry(); g.index = sedgeG.index; for (const k in sedgeG.attributes) g.setAttribute(k, sedgeG.attributes[k]);
        g.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(P), 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(new Float32Array(Q), 4)); g.instanceCount = n;
        if (mirror) g.setDrawRange(0, 6);
        let x0 = 1e9, x1 = -1e9, zz0 = 1e9, zz1 = -1e9; for (let i = 0; i < n; i++) { x0 = Math.min(x0, P[i * 4]); x1 = Math.max(x1, P[i * 4]); zz0 = Math.min(zz0, P[i * 4 + 1]); zz1 = Math.max(zz1, P[i * 4 + 1]); }
        g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, WY, (zz0 + zz1) / 2), Math.hypot((x1 - x0) / 2 + 2, (zz1 - zz0) / 2 + 2) + 1);
        const me = new THREE.Mesh(g, m); me.name = mirror ? 'sedge-mirror' : 'sedge'; if (mirror) me.renderOrder = 2; scene.add(me); sedgeTris += n * (mirror ? 2 : 4);
        sedgeChunks.push({ mesh: me, c: g.boundingSphere.center, r: g.boundingSphere.radius, reach: mirror ? 60 : 150 });
        return g;
      };
      for (const b of bk) { await ctx.yield(); mk(b.p, b.q, sedgeMat, false); mk(b.mp, b.mq, mirrorMat, true); }
    }
    await ctx.yield();
    const dryC = C('#a8975a'), dryCol = () => tmpC.copy(dryC);
    const isleGrass = [];
    for (const [i, q] of [IX, I1].entries()) { isleGrass.push(await flora.makeGrassAsync({ rng: rng.fork('ig' + i), bounds: [q.x - q.r, q.z - q.r, q.x + q.r, q.z + q.r], count: Math.round((i ? 2200 : 3600) * detail), width: [0.7, 1.3], height: [0.4, 0.8], cards: 2,
      heightAt: groundY, heightStep: 2.5, groundColor: dryCol, wind: gWind, map: treeMat.map, ...(i ? { material: isleGrass[0].material } : { materialOptions: gMat }), flowers: 0, chunks: 1, density: (x, z) => smoothstep(WY + 0.25, WY + 0.6, groundY(x, z)) }, ctx.yield));
      await ctx.yield(); }
    for (const g of isleGrass) scene.add(g.object);
    await ctx.yield();

    // ----- hippos: six in the bay of the channel, nine in the pool on the plain; in each a bull that yawns at us and one that surfaces and blows -----
    const hr2 = rng.fork('hippo'), hA = [], hB = [], rgR = [], rgS = [], spR = [], spS = [];
    const UK = { surfA: [0.283, 0.3, 0.335, 0.362], yawnA: [0.29, 0.303, 0.338, 0.353], blowA: 0.2975, surfB: [0.8, 0.818, 0.868, 0.89], yawnB: [0.8, 0.818, 0.862, 0.878], blowB: 0.8265 };
    const splash = (x, z, size, uEv, life = 1.2) => { spR.push(x, z, size, hr2()); spS.push(uEv, life, 0, 0); };
    const hippo = (x, z, yaw, sc, mode, grp) => {
      const ph = hr2(), per = hr2.range(9, 15); hA.push(x, z, yaw, sc); hB.push(ph, per, mode + 10 * grp, hr2());
      const fx2 = x + Math.sin(yaw) * 1.1 * sc, fz2 = z + Math.cos(yaw) * 1.1 * sc;
      if (mode === 0) { rgR.push(fx2, fz2, 10, ph); rgS.push(0, per, 0.75, per * 0.6); }
      else { const uEv = mode === 1 ? (grp ? UK.surfB[0] : UK.surfA[0]) : (grp ? UK.yawnB[0] : UK.yawnA[0]); rgR.push(fx2, fz2, 14, 0); rgS.push(1, uEv, 1.15, 9); splash(fx2, fz2, mode === 1 ? 1.3 : 1.2, uEv + 0.006, 1.0); }
    };
    const faceTo = (x, z, tx, tz) => Math.atan2(tx - x, tz - z);
    const bayY = at(0.3195, -8.0), bayS = at(0.3175, -12.6);
    { const eye = at(0.31);
      hippo(bayY.x, bayY.z, faceTo(bayY.x, bayY.z, eye.x, eye.z) + 0.42, 1.4, 2, 0); hippo(bayS.x, bayS.z, faceTo(bayS.x, bayS.z, eye.x, eye.z) - 0.5, 1.15, 1, 0);          // the gape opens toward the eye, a quarter turned
      const placed = [[bayY.x, bayY.z], [bayS.x, bayS.z]];
      for (let i = 0, tries = 0; i < 4 && tries < 200; tries++) { const a = hr2() * TAU, r = Math.sqrt(hr2()) * (bay.r - 2.2), x = bay.x + Math.cos(a) * r, z = bay.z + Math.sin(a) * r; if (path.nearestXZ(x, z).dist < 10 || placed.some((q) => Math.hypot(q[0] - x, q[1] - z) < 3.8)) continue; placed.push([x, z]); hippo(x, z, hr2() * TAU, hr2.range(0.85, 1.1), 0, 0); i++; } }
    const poolS = (() => { if (rare) return at(uStrike, -10.5, 19.5); const dx = pool.x - yawnQ.x, dz = pool.z - yawnQ.z, l = Math.hypot(dx, dz) || 1; return new THREE.Vector3(yawnQ.x + (dx / l) * 5.6, 0, yawnQ.z + (dz / l) * 5.6); })();
    { const eye = at(0.84);
      hippo(yawnQ.x, yawnQ.z, faceTo(yawnQ.x, yawnQ.z, eye.x, eye.z) + (rare ? 0.42 : -0.42), 1.4, 2, 1); hippo(poolS.x, poolS.z, faceTo(poolS.x, poolS.z, eye.x, eye.z) + (rare ? -0.5 : 0.5), 1.15, 1, 1);
      const placed = [];
      for (let i = 0, tries = 0; i < 7 && tries < 200; tries++) { const a = hr2() * TAU, r = Math.sqrt(hr2()) * (pool.r - 4), x = pool.x + Math.cos(a) * r, z = pool.z + Math.sin(a) * r; if (placed.some((q) => Math.hypot(q[0] - x, q[1] - z) < 4) || Math.hypot(x - poolS.x, z - poolS.z) < 4) continue; placed.push([x, z]); hippo(x, z, hr2() * TAU, hr2.range(0.85, 1.12), 0, 1); i++; } }
    const instGeo = (base, attrs, n) => { const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]); for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(attrs[k]), 4)); g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -200), 1e4); return g; };
    const quadXY = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]); return g; })();
    const quadXZ = (() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, -0.5, 0.5, 0, -0.5, 0.5, 0, 0.5, -0.5, 0, 0.5], 3)); g.setIndex([0, 2, 1, 0, 3, 2]); return g; })();
    await ctx.yield();
    const hippoG = hippoGeometry(), HU = { uTime: SH.uTime, uLive: { value: 0 }, uKey: { value: new THREE.Vector4() }, uBlow: { value: new THREE.Vector2(1, 1) } };
    const hippos = new THREE.Mesh(instGeo(hippoG, { iA: hA, iB: hB }, hA.length / 4), mat(HIPPO_VERT, HIPPO_FRAG, { ...lit(), uHorizon: SH.uHorizon, ...HU }, { side: THREE.DoubleSide, vertexColors: true }));
    hippos.name = 'hippos'; hippos.frustumCulled = false; scene.add(hippos);
    const soft = { transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide };
    const blows = new THREE.Mesh(instGeo(quadXY, { iA: hA, iB: hB }, hA.length / 4), mat(BLOW_VERT, BLOW_FRAG, { ...lit(), ...HU, uSprayCol: hero.uniforms.uSprayCol }, soft));
    blows.name = 'hippo-blow'; blows.frustumCulled = false; blows.renderOrder = 3; scene.add(blows);
    await ctx.yield();

    // ----- the fish eagles and the kingfisher -----
    const birdMat = () => mat(BIRD_VERT, BIRD_FRAG, { uSunDir: SH.uSunDir, uSunCol: SH.uSunCol, uSkyCol: SH.uSkyCol, uHorizon: SH.uHorizon, uWing: { value: new THREE.Vector4(0, 0, 0, 0) }, uPose: { value: new THREE.Vector2(0, 0) } }, { side: THREE.DoubleSide, vertexColors: true });
    const eagleG = birdGeometry({ len: 0.8, span: 1.02, chord: 0.44, bill: 0.1, body: '#2e1c12', belly: '#8a4a22', head: '#efebe0', wing: '#241710', tip: '#120c08', shoulder: '#9a5426', tail: '#efebe0', beak: '#e6b62e', leg: '#e0ae2a' });
    await ctx.yield();
    const kfG = birdGeometry({ len: 0.3, span: 0.25, chord: 0.12, bill: 0.1, body: '#22262c', belly: '#ecece6', head: '#1c2026', wing: '#3a3e44', tip: '#101216', shoulder: '#d8d8d2', tail: '#deded8', beak: '#14161a', leg: '#333333' });
    const mkBird = (g, sc, name) => { const m = new THREE.Mesh(g, birdMat()); m.scale.setScalar(sc); m.name = name; m.frustumCulled = false; scene.add(m); return m; };
    const eagleA = mkBird(eagleG, 1.85, 'fish-eagle-calling'), eagleB = mkBird(eagleG, 1.6, 'fish-eagle-stooping'), kf = mkBird(kfG, 3.0, 'pied-kingfisher');
    const fishG = (() => { const g = new F.Geo(); g.blob(0, 0, 0, 0.05, 0.085, 0.2, C('#aeb6b8'), C('#e4e6e2'), 5, 4); g.fan([[0, 0, -0.19], [0, 0.09, -0.3], [0, -0.09, -0.3]], C('#8a9294')); return g.build(); })();
    const fish = new THREE.Mesh(fishG, eagleB.material); fish.position.set(0, -0.36, 0.06); fish.visible = false; eagleB.add(fish);
    const strike = strikeP.clone().setY(WY + 0.5), leftCrown = portalPalms[0].crown.clone().add(new THREE.Vector3(0, 0.9, 0));
    const eKeys = (() => { const f = frame(uStrike), S = strike, k = (u, p) => ({ u, p });
      return [k(0.77, at(0.805, -40, 40, 26)), k(0.805, S.clone().addScaledVector(f.l, -17).addScaledVector(f.t, -4).setY(9.5)), k(0.825, S.clone().addScaledVector(f.l, -6).addScaledVector(f.t, -2.5).setY(3.4)), k(uStrike, S),
        k(0.847, S.clone().addScaledVector(f.l, 4).addScaledVector(f.t, 15).setY(4.2)), k(0.88, S.clone().lerp(leftCrown, 0.5).setY(15)), k(0.915, leftCrown.clone().addScaledVector(eF.t, -7).setY(leftCrown.y + 3.2)), k(0.932, leftCrown)]; })();
    const keyAt = (u, out) => {
      const n = eKeys.length; if (u <= eKeys[0].u) return out.copy(eKeys[0].p); if (u >= eKeys[n - 1].u) return out.copy(eKeys[n - 1].p);
      let i = 0; while (i < n - 2 && u > eKeys[i + 1].u) i++;
      const t = (u - eKeys[i].u) / (eKeys[i + 1].u - eKeys[i].u), p0 = eKeys[Math.max(i - 1, 0)].p, p1 = eKeys[i].p, p2 = eKeys[i + 1].p, p3 = eKeys[Math.min(i + 2, n - 1)].p, t2 = t * t, t3 = t2 * t;
      const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (3 * b - a - 3 * c + d) * t3);
      return out.set(cr(p0.x, p1.x, p2.x, p3.x), cr(p0.y, p1.y, p2.y, p3.y), cr(p0.z, p1.z, p2.z, p3.z));
    };
    // the kingfisher hovers over the channel just left of our line, plunges as we come, and is up out of its crown of water as we reach it
    const KF = { dive0: 0.2345, hit: 0.2435, out: 0.2468 }, kfHover = at(0.2575, 2.5, 0, WY + 4.6);
    rgR.push(kfHover.x, kfHover.z, 8, 0, strike.x, strike.z, 12, 0); rgS.push(1, KF.hit, 1.3, 5, 1, uStrike, 1.7, 5.5);
    splash(kfHover.x, kfHover.z, 0.85, KF.hit, 1.3); splash(strike.x, strike.z, 1.6, uStrike, 1.5);
    await ctx.yield();

    // ----- the flush: egrets from the margins, white-faced ducks off the water, going up a dozen metres ahead of us -----
    const fr = rng.fork('flush'), uFlush = 0.36, NF = 100, LEADM = 24, LEADD = 34, fS = new Float32Array(NF * 3), fR = new Float32Array(NF * 4), fD = new Float32Array(NF * 4);
    for (let i = 0; i < NF; i++) {
      // the first fourteen egrets stand where the frame at u 0.40 finds them 8 to 16 m ahead with their wings out; nothing starts within 6 m of our line
      const duck = i >= 44, u = i < 14 ? 0.4025 + i * 0.0011 : fr.range(0.392, 0.474), f = frame(u), sgn = i < 14 ? (i % 2 ? 1 : -1) : fr.sign(), lat = sgn * (duck ? fr.range(7.4, 9.4) : fr.range(6.6, 9.4)), p = f.p.clone().addScaledVector(f.l, lat);
      const f2 = frame(Math.min(u + 48 / path.length, 0.6)), hd = f2.p.clone().addScaledVector(f2.l, lat + sgn * (duck ? 7 : 3.5)).sub(p).setY(0).normalize();   // the channel bends: aim along it, drifting outward
      fS.set([p.x, WY + (duck ? 0.1 : 0.35), p.z], i * 3); fR.set([fr(), fr(), fr(), sgn > 0 ? fr.range(0.56, 1) : fr.range(0, 0.44)], i * 4);
      fD.set([hd.x, hd.z, duck ? 1 : 0, Math.max(0, (u - (duck ? LEADD : LEADM) / path.length - uFlush) * DURATION) + fr() * 0.2], i * 4);                 // each goes up when we are 24 m short of it
    }
    const flushG = flushGeometry(NF);
    await ctx.yield();
    flushG.setAttribute('aStart', new THREE.InstancedBufferAttribute(fS, 3)); flushG.setAttribute('aRnd', new THREE.InstancedBufferAttribute(fR, 4)); flushG.setAttribute('aDir', new THREE.InstancedBufferAttribute(fD, 4));
    const flush = new THREE.Mesh(flushG, mat(FLUSH_VERT, FLUSH_FRAG, { uTime: SH.uTime, uT: { value: 0 }, uSunDir: SH.uSunDir, uSunCol: SH.uSunCol, uSkyCol: SH.uSkyCol }, { side: THREE.DoubleSide, vertexColors: true }));
    flush.name = 'flush'; flush.frustumCulled = false; scene.add(flush);
    await ctx.yield();

    // ----- the crocodile: off its sandbar under the snag and away in an S across our bows, read by its wake -----
    const crocCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(bar.x, WY, bar.z), at(0.397, 6.2, 0, WY), at(0.412, -1.5, 0, WY), at(0.427, -6.4, 0, WY), at(0.443, -2.5, 0, WY), at(0.461, 4.5, 0, WY)], false, 'centripetal');
    const crocLen = crocCurve.getLength(), crocMat = mat(CROC_VERT, CROC_FRAG, { ...lit(), uHorizon: SH.uHorizon, uTime: SH.uTime, uSwim: { value: 0 } }, { side: THREE.DoubleSide, vertexColors: true });
    const croc = new THREE.Mesh(crocGeometry(), crocMat); croc.scale.setScalar(1.3); croc.name = 'crocodile'; croc.frustumCulled = false; scene.add(croc);
    await ctx.yield();
    { const q = crocCurve.getPointAt(0.07); splash(q.x, q.z, 1.2, 0.3585, 1.3); rgR.push(q.x, q.z, 10, 0); rgS.push(1, 0.3585, 1.3, 5); }
    const wakeG = (() => { const N = 64, P = [], SV = [], I = [], q = new THREE.Vector3(), tg = new THREE.Vector3();
      for (let i = 0; i <= N; i++) { crocCurve.getPointAt(i / N, q); crocCurve.getTangentAt(i / N, tg); const lx = tg.z, lz = -tg.x; P.push(q.x - lx * 6, WY + 0.035, q.z - lz * 6, q.x + lx * 6, WY + 0.035, q.z + lz * 6); SV.push((i / N) * crocLen, -1, (i / N) * crocLen, 1); if (i < N) { const b = i * 2; I.push(b, b + 1, b + 3, b, b + 3, b + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aSV', new THREE.Float32BufferAttribute(SV, 2)); g.setIndex(I); g.computeBoundingSphere(); return g; })();
    const wake = new THREE.Mesh(wakeG, mat(WAKE_VERT, WAKE_FRAG, { ...lit(), uTime: SH.uTime, uHead: { value: 0 }, uHalf: { value: 6 }, uSkyCol: { value: skyRef }, uHorizon: SH.uHorizon }, { ...soft, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    wake.name = 'croc-wake'; wake.renderOrder = 1; scene.add(wake);
    // rings and crowns of water for every strike, plunge and surfacing: all keyed to u
    const rings = new THREE.Mesh(instGeo(quadXZ, { iR: rgR, iS: rgS }, rgR.length / 4), mat(RING_VERT, RING_FRAG, { uTime: SH.uTime, uU: { value: 0 }, uSkyCol: { value: skyRef }, uHorizon: SH.uHorizon, uSunDir: SH.uSunDir, uSunCol: SH.uSunCol },
      { ...soft, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }));
    rings.name = 'rings'; rings.frustumCulled = false; rings.renderOrder = 1; scene.add(rings);
    const splashes = new THREE.Mesh(instGeo(quadXY, { iR: spR, iS: spS }, spR.length / 4), mat(SPLASH_VERT, SPLASH_FRAG, { ...lit(), uU: { value: 0 }, uSprayCol: hero.uniforms.uSprayCol }, soft));
    splashes.name = 'splashes'; splashes.frustumCulled = false; splashes.renderOrder = 4; scene.add(splashes);
    await ctx.yield();

    // ----- the rest of the cast, from the kit -----
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene), range: 520 }), far2 = rng.fork('fauna');
    const eleC = at(0.552, -27), elephants = fauna.add(F.makeHerd({ rng: far2, species: 'elephant', count: 5, sizes: [1.2, 1.12, 1.05, 0.95, 0.6], center: [eleC.x, 0, eleC.z], radius: 10, y: 0, path, clear: 15, coat: '#58544f', belly: '#4a4642', legs: '#3e3a36', fill: 0.42, blobShadow: false }), { always: true });
    await ctx.yield();
    const storkAt = [at(0.4185, 10.6), at(0.4245, 12.4), at(0.431, 10.2)].map((q) => [q.x, WY, q.z]);
    fauna.add(F.makeWaders({ rng: far2, species: 'stork', positions: storkAt, count: 3, size: 1.45, level: WY, depth: 0.3, heightAt: groundY, facing: Math.atan2(-eF.l.x, -eF.l.z), scatterYaw: 0.7, active: 0.7,
      body: '#f4f2ea', belly: '#ffffff', wing: '#17171b', neckC: '#16161a', cap: '#16161a', beakC: '#d8301c', legC: '#2c2623' }));
    await ctx.yield();
    const egAt = []; for (let i = 0; i < 9; i++) { const q = at(0.205 + i * 0.021 + far2.range(-0.006, 0.006), far2.sign() * far2.range(7.2, 9.2)); if (papSdAt(q.x, q.z) < 1.5 && Math.hypot(q.x - bayY.x, q.z - bayY.z) > 5) egAt.push([q.x, WY, q.z]); }
    for (let i = 0; i < 6; i++) { const a = far2() * TAU, q = [pool.x + Math.cos(a) * (pool.r + 3), WY, pool.z + Math.sin(a) * (pool.r + 3)]; if (path.nearestXZ(q[0], q[2]).dist > 7 && Math.abs(laneD(q[0], q[2]) + hero.wheelAt(q[2])) > 40) egAt.push(q); }
    if (egAt.length) fauna.add(F.makeWaders({ rng: far2, species: 'egret', positions: egAt, count: egAt.length, size: 1.05, level: WY, depth: 0.22 }));
    await ctx.yield();
    const crAt = [at(0.618, -15.5), at(0.624, -18)].map((q) => [q.x, WY, q.z]);
    fauna.add(F.makeWaders({ rng: far2, species: 'crane', positions: crAt, count: 2, size: 1.15, level: WY, depth: 0.25, body: '#b9bcc0', belly: '#f4f4f0', neckC: '#f4f4f0', wing: '#3a3c42', cap: '#b02a22', beakC: '#c8b078' }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: far2, species: 'gulls', count: 16, size: 1.25, speed: 10, body: '#f8f8f2', belly: '#ffffff', wingC: '#f4f4ee', tip: '#ecece6', head: '#f8f8f2', beak: '#f0b428', spread: [16, 2.5, 26],
      cross: { path, u: 0.055, lead: 62, height: -15, angle: 58, side: 1, span: 320, duration: DURATION } }));
    await ctx.yield();
    fauna.add(F.makeFlock({ rng: far2, species: 'swifts', count: Math.round(26 * (0.6 + 0.4 * detail)), center: [seat.x, seat.y + 9, seat.z], radius: 17, height: 5, body: '#2a2622', wingC: '#3a342c' }));
    await ctx.yield();
    if (season === 'august') fauna.add(F.makeFlock({ rng: far2, species: 'parrots', count: 18, size: 0.7, body: '#d83a4e', belly: '#f0607a', wingC: '#c82c44', tip: '#1e1a22', head: '#2a8a86', tailC: '#b02038', beak: '#1a1a1a', spread: [7, 2.4, 20],
      along: { path, side: -11, up: 0.5, lead: 30, from: uPace0 - 0.02, to: 0.86, drift: 8 } }));
    await ctx.yield();
    fauna.add(F.makeDragonflies({ rng: far2, count: Math.round(26 * (0.5 + 0.5 * detail)), size: 2.1, path, uFrom: 0.2, uTo: uMouth, clear: 2.6, spread: 8, lift: [-2.2, 0.2] }));
    await ctx.yield();
    if (sitatunga) { const q = at(0.357, -9.6); fauna.add(F.makeHerd({ rng: far2, species: 'antelope', count: 2, size: 0.95, center: [q.x, 0, q.z], radius: 3, y: 0, path, clear: 7.5, coat: '#5e4a36', belly: '#8a765c', legs: '#4a3a2a', pattern: 'none', blobShadow: false })); }
    await ctx.yield();

    // ----- air: motes in the light, mist at dawn, fireflies at night, and the gold veil of the rare pass -----
    const air = fx.fxGroup(); scene.add(air.object);
    if (night) air.add(fx.makeParticles({ rng: rng.fork('ff'), preset: 'fireflies', count: Math.round(420 * detail), box: [70, 9, 70], follow: 'xz', center: [0, WY + 3.4, 0], time: SH.uTime }));
    else air.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', count: Math.round(1500 * detail), box: [40, 14, 46], colors: [L.sun, '#fff4d8', L.papGold], intensity: hour === 'afternoon' ? 0.75 : 1.1, opacity: 0.6, time: SH.uTime }));
    await ctx.yield();
    if (L.mist) air.add(fx.makeGroundFog({ time: SH.uTime, y: WY + 0.05, height: 2.1, layers: 5, size: 760, color: '#f0dcd4', opacity: 0.19, coverage: 0.55, scale: 0.011, wind: [windXZ.x * 0.7, windXZ.y * 0.7], sunDir, sunColor: L.sun, scatter: 0.5 }));
    await ctx.yield();
    // the gold swell of the rare pass: light, not paint. One sheet multiplies what is there (dst x (1 + gold)), so the
    // darks stay dark and the lit spray burns; a second adds a thin gold haze. Both swell from the sun's side (our left).
    const veilGeo = new THREE.PlaneGeometry(2, 2), veilU = { uAmt: { value: 0 }, uTime: SH.uTime, uCloud: SH.uCloud, uBox: SH.uBox, uShade: SH.uShade, uCol: { value: C(L.sun).lerp(C('#ffc45e'), 0.6) } };
    const veilVS = 'uniform float uAmt; varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy * step(.002, uAmt), 0., 1.); }';    // no pixels at all while it rests
    const veilFS = (add) => NOISE_GLSL + /* glsl */`uniform float uAmt, uTime; uniform vec3 uCol; varying vec2 vUv;
      void main(){ vec2 p = vUv * vec2(3.4, 2.); float n = dfbm(p + vec2(uTime * 1.7, -uTime * .9)), s = dvn(vUv * vec2(60., 34.) + vec2(uTime * 23., uTime * 9.));
        float left = 1.25 - .95 * smoothstep(0., 1., vUv.x), a = uAmt * (.55 + .7 * n) * left * (1.1 - .35 * vUv.y);
        gl_FragColor = vec4(uCol * ${add ? 'a * .16 + uCol * uAmt * smoothstep(.74, .95, s) * .22 * left' : 'a * 1.5'}, 1.); }`;
    const veilMat = (add) => new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, uniforms: veilU, vertexShader: veilVS, fragmentShader: veilFS(add),
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: add ? THREE.OneFactor : THREE.DstColorFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor });
    const veil = new THREE.Group(); veil.name = 'gold-veil';
    if (rare) for (const add of [0, 1]) { const m = new THREE.Mesh(veilGeo, veilMat(add)); m.frustumCulled = false; m.renderOrder = 40 + add; veil.add(m); }
    scene.add(veil);
    const uVeil = uOfZ(-76), uVeilOut = uOfZ(6);
    await ctx.yield();

    // ----- where the eye goes -----
    const UP0 = new THREE.Vector3(0, 1, 0), gz = new THREE.Vector3(), bayP = bayY.clone().setY(WY + 0.9), eagleP = perch.clone().add(new THREE.Vector3(0, -0.6, 0)), midP = new THREE.Vector3(storkAt[1][0], WY + 2.5, storkAt[1][2]), poolP = yawnQ.clone().setY(WY + 0.9);
    const uPoiP = uPace0 - 0.07;
    const pois = [
      { at: bayP, from: 0.268, to: 0.347, weight: 0.6 },
      { at: eagleP, from: 0.338, to: 0.392, weight: 0.5 },
      { at: midP, from: 0.395, to: 0.452, weight: 0.3 },
      { at: (time, u) => { const uu = clamp(u, 0, 1), p = path.pointAt(uu), t = path.tangentAt(uu), k = rare ? 0.5 + 0.5 * (1 - smoothstep(uVeil - 0.03, uVeil + 0.01, uu) * (1 - smoothstep(uVeilOut, uVeilOut + 0.03, uu))) : 1;
        const a0 = 20 + 14 * (1 - smoothstep(uPoiP + 0.02, uPace0 + 0.05, uu)) + 12 * smoothstep(0.795, 0.88, uu), ah = lerp(30, a0, (k - 0.5) * 2), lf = 22 * k;       // the gaze turns about 33 degrees into the light: the flank rams run between the left third and the centre, 12 to 17 m off, the wall of spray behind them
        return gz.set(p.x + (t.z * lf + t.x * ah), WY + 2.6, p.z + (-t.x * lf + t.z * ah)); }, from: uPoiP, to: rare ? 0.815 : 0.885, weight: 0.7, fade: 0.2 },
      { at: poolP, from: 0.795, to: 0.885, weight: rare ? 0.62 : 0.5 },
    ];
    // Compose the hero frame. The herd's place at every u is fixed (its clock is u), so slide it a few metres along its
    // lanes until, at u 0.70, the most rams stand between the left third and the centre of the picture and none is cut by
    // its left edge. The gaze is worked out exactly as the engine does it.
    const probe = { shift: 0, rams: 0, cut: 0 };
    const TX = Math.tan((31 * Math.PI) / 180) * (16 / 9), lookV = new THREE.Vector3(), lookR = new THREE.Vector3(), lookQ = new THREE.Vector3(), lookP = new THREE.Vector3(), an = {};
    const herdFrame = (uH, zs, list) => {                         // who stands where in the picture at uH if the herd's run starts at zs
      path.pointAt(uH, lookP); path.posAtDist(uH * path.length + 24, lookV).sub(lookP).normalize();
      for (const poi of pois) { const w = bell(uH, poi.from ?? 0, poi.to ?? 1, poi.fade ?? 0.3) * (poi.weight ?? 0.5); if (w <= 0.001) continue; lookQ.copy(typeof poi.at === 'function' ? poi.at(0, uH) : poi.at).sub(lookP).normalize(); lookV.multiplyScalar(1 - w).addScaledVector(lookQ, w).normalize(); }
      lookR.crossVectors(lookV, UP0).normalize();
      let good = 0, fair = 0, cut = 0;
      for (let i = 0; i < hero.nearCount; i++) {
        hero.nearAt(i, zs + A.herd.travel * uH, an); if (an.inside < 3) continue;
        lookQ.set(an.x - lookP.x, WY + 0.9 - lookP.y, an.z - lookP.z); const f = lookQ.dot(lookV); if (f < 2) continue;
        const nx = lookQ.dot(lookR) / f / TX, hgt = ((an.ram ? 1.95 : 1.3) * an.sc) / (lookQ.length() * 1.2);
        if (an.ram && hgt > 0.088 && nx > -0.37 && nx < 0.05) good++; else if (hgt > 0.07 && nx > -0.62 && nx < 0.3) fair++;
        if (nx < -0.82 && nx > -1.22 && hgt > 0.075) cut++;
        if (list && Math.abs(nx) < 1.25 && hgt > 0.05) list.push([+nx.toFixed(2), +hgt.toFixed(3), an.ram ? 1 : 0]);
      }
      return { good, fair, cut };
    };
    if (!rare) {
      const zs0 = hero.zStartNow(); let best = -1e9;
      for (let sh = 0; sh < 9; sh += 0.25) {
        const r = herdFrame(0.7, zs0 + sh), sc = Math.min(r.good, 3) * 2 + Math.min(r.fair, 3) * 0.4 - r.cut * 2.5 - sh * 0.01;
        if (sc > best) { best = sc; probe.shift = sh; probe.rams = r.good; probe.cut = r.cut; }
      }
      hero.setRun({ zStart: zs0 + probe.shift });
    }

    // ----- per-frame state: everything is a pure function of (time, u) -----
    const trap = (u, k) => smoothstep(k[0], k[1], u) * (1 - smoothstep(k[2], k[3], u)), UP = UP0;
    const vx = new THREE.Vector3(), vy = new THREE.Vector3(), vz = new THREE.Vector3(), M4 = new THREE.Matrix4(), pA = new THREE.Vector3(), pB = new THREE.Vector3(), cq = new THREE.Vector3(), ct = new THREE.Vector3(), fwdV = new THREE.Vector3();
    const orient = (m, p, f, roll = 0) => { vz.copy(f).normalize(); vx.crossVectors(UP, vz); if (vx.lengthSq() < 1e-6) vx.set(1, 0, 0); vx.normalize(); vy.crossVectors(vz, vx); M4.makeBasis(vx, vy, vz); m.quaternion.setFromRotationMatrix(M4); if (roll) m.rotateZ(roll); m.position.copy(p); };
    const toChan = at(0.368).sub(perch).setY(0).normalize(), perchF = toChan.clone().multiplyScalar(0.5).add(new THREE.Vector3(0, 0.87, 0));
    const crownF = eF.t.clone().multiplyScalar(-0.5).add(new THREE.Vector3(0, 0.87, 0)), kfSplash = kfHover.clone().setY(WY), kfOut = eF.t.clone();
    { const f = frame(0.262); kfOut.copy(f.t).multiplyScalar(0.85).addScaledVector(f.l, 0.34).add(new THREE.Vector3(0, 0.26, 0)).normalize(); }
    const toKf = (() => { const f = frame(0.2575); return f.l.clone().multiplyScalar(-1); })();
    const setScene = (dt, time, camera, u) => {
      SH.uTime.value = time; SH.uCloud.value.y = windXZ.x * time * 3.2 * windK; SH.uCloud.value.z = windXZ.y * time * 3.2 * windK;
      const e = camera.matrixWorld.elements, ex = e[12], ez = e[14];                                       // read only: the portal camera's matrices are set by hand
      fwdV.set(-e[8], -e[9], -e[10]); SH.uSlip.value.set(ex - fwdV.x * 4, e[13], ez - fwdV.z * 4, SH.uSlip.value.w); SH.uHigh.value = smoothstep(7.5, 13, e[13]);
      hero.setProgress(u); hero.update(dt, time, camera);
      sky.update(dt, time, camera); rig.update(dt, time, camera);
      trees.update(dt, time, camera); pads.update(dt, time, camera); for (const g of isleGrass) g.update(dt, time, camera);
      for (const s of sedgeChunks) s.mesh.visible = Math.hypot(s.c.x - ex, s.c.z - ez) < s.r + s.reach;
      fauna.update(dt, time, camera, u); air.update(dt, time, camera);
      // hippos
      HU.uLive.value = smoothstep(0.0, 0.02, u); HU.uKey.value.set(trap(u, UK.surfA), trap(u, UK.yawnA), trap(u, UK.surfB), trap(u, UK.yawnB));
      HU.uBlow.value.set(u < UK.blowA ? 1 : clamp(((u - UK.blowA) * DURATION) / 2.4, 0, 1), u < UK.blowB ? 1 : clamp(((u - UK.blowB) * DURATION) / 2.4, 0, 1));
      rings.material.uniforms.uU.value = u; splashes.material.uniforms.uU.value = u;
      // the calling eagle on its snag: head thrown back, wings half open
      { const call = trap(u, [0.33, 0.345, 0.39, 0.4]), W = eagleA.material.uniforms; orient(eagleA, perch, perchF); eagleA.position.y += 0.6;
        W.uWing.value.set(0.05 + 0.1 * call, 0, 1 - 0.18 * call, 0); W.uPose.value.set(call * (0.75 + 0.35 * Math.sin(time * 8.5)), -1.0); }
      // the stooping eagle
      { const W = eagleB.material.uniforms, de = 0.0016; keyAt(u - de, pA); keyAt(u + de, pB); keyAt(u, cq);
        const landed = smoothstep(0.922, 0.934, u), stoop = smoothstep(0.81, 0.831, u) * (1 - smoothstep(0.837, 0.847, u)), climb = smoothstep(0.837, 0.851, u) * (1 - landed), glide = 1 - Math.max(stoop, climb, landed);
        ct.subVectors(pB, pA); if (ct.lengthSq() < 1e-8) ct.copy(eF.t); ct.normalize(); if (stoop > 0) ct.y = lerp(ct.y, 0.28, stoop * smoothstep(0.825, 0.835, u)); ct.lerp(crownF, landed);
        orient(eagleB, cq, ct, glide * 0.25 * Math.sin(time * 0.6)); if (landed > 0) eagleB.position.y += 0.3 * landed;
        const mantle = landed * (1 - smoothstep(0.95, 0.975, u));
        W.uWing.value.set(0.12 * glide + 0.3 * stoop + 0.1 * climb + 0.5 * mantle, 0.07 * glide + 0.16 * stoop + 0.72 * climb + 0.26 * mantle, landed * (1 - 0.62 * mantle), time * (climb > 0.3 ? 17 : 6.5));
        W.uPose.value.set(landed * 0.25, 1.25 * stoop - 1.0 * landed + 0.25 * climb); fish.visible = u > uStrike && u < 0.99; eagleB.visible = u > 0.755; }
      // the kingfisher
      { const W = kf.material.uniforms, drop = clamp((u - KF.dive0) / (KF.hit - KF.dive0), 0, 1), out = clamp((u - KF.out) / 0.05, 0, 1);
        if (u < KF.hit) { cq.copy(kfHover); cq.y = lerp(kfHover.y + 0.12 * Math.sin(time * 5.2), WY - 0.1, drop * drop); cq.x += 0.1 * Math.sin(time * 3.1) * (1 - drop); ct.copy(toKf).multiplyScalar(1 - drop).add(vy.set(0, 0.75 - 1.9 * drop, 0)); orient(kf, cq, ct);
          W.uWing.value.set(0.15, 1.05 * (1 - drop), 0.9 * smoothstep(0.1, 0.5, drop), time * 52); W.uPose.value.set(-0.9 * (1 - drop), 0); kf.visible = true; }
        else { cq.copy(kfSplash).addScaledVector(kfOut, out * 30); cq.y = WY + 0.3 + out * 7.5 * (0.7 + 0.3 * out); orient(kf, cq, kfOut); W.uWing.value.set(0.1, 0.95, 0, time * 44); W.uPose.value.set(0, 0); kf.visible = u > KF.out && out < 1; } }
      flush.material.uniforms.uT.value = (u - uFlush) * DURATION;
      // the crocodile
      { const s = smoothstep(0.354, 0.466, u) * 0.5 + 0.5 * clamp((u - 0.361) / 0.105, 0, 1), sw = smoothstep(0.356, 0.371, u); crocCurve.getPointAt(clamp(s, 0, 0.999), cq); crocCurve.getTangentAt(clamp(s, 0.001, 0.999), ct);
        orient(croc, cq, ct); croc.position.y = WY + 0.03 + (1 - sw) * (bar.h * 0.75) - 0.09 * sw; crocMat.uniforms.uSwim.value = sw; wake.material.uniforms.uHead.value = s * crocLen; }
      // the gold veil
      if (rare) { const a = smoothstep(uVeil - 0.012, uVeil + 0.004, u) * (0.1 + 0.9 * (1 - smoothstep(uVeil + 0.006, uVeil + 0.034, u))) * (1 - smoothstep(uVeilOut - 0.02, uVeilOut + 0.01, u)); veilU.uAmt.value = a; }
    };

    await sky.prewarm?.(ctx.renderer, null, scene);
    return {
      scene, path, duration: DURATION,
      // linger beside the herd, hurry the stoop and the channel a little; an easy entry, an unhurried approach
      pace: (u) => 1.1 - 0.2 * (1 - smoothstep(0.04, 0.14, u)) - 0.27 * smoothstep(uPace0 - 0.04, uPace0 + 0.03, u) * (1 - smoothstep(0.8, 0.88, u)),
      _probe: (u) => { const list = [], r = herdFrame(u ?? 0.7, hero.zStartNow(), list); return { ...probe, u: u ?? 0.7, ...r, list: list.sort((x, y) => x[0] - y[0]) }; },
      camera: { fov: 62, near: 0.4, far: 4600, lookAhead: 24, sway: 0.8, bank: 0.8 },
      pois,
      portal: { shape: 'circle', radius: A.portalSeat.radius || 7, color: night ? '#cfe0ff' : '#fff0c8', glow: 1.2, revealDistance: 420 },
      post: { exposure: L.exposure, bloom: { strength: L.bloom, radius: 0.6, threshold: 0.92 }, grade: { saturation: L.sat, contrast: L.contrast ?? 1.06, tint: L.tint, shadowTint: L.shadowTint, vignette: 0.3, grain: 0.02 } },
      ride: 'great-bird',
      update(dt, time, camera, u) { setScene(dt, time, camera, u); },
      dispose() {
        sky.dispose?.(); hero.dispose?.(); maskTex.dispose(); shadeTex.dispose(); papTex.dispose(); sedgeTex.dispose();
        for (const g of [...nearVar, ...farVar, ...woodsG, PG.clumpA, PG.clumpB, PG.card, quadXY, quadXZ, hippoG, sedgeG, wakeG, flushG, eagleG, kfG, fishG, snagG, veilGeo]) g.dispose?.();
      },
    };
  },
};
