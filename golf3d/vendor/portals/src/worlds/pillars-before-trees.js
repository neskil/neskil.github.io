// Pillars Before Trees · 400 million years ago (early Devonian, the Old Red continent; today the Gaspé peninsula).
// A river plain where no plant stands higher than the waist, and thirty bone-pale Prototaxites pillars that begin
// to smoke with golden spores when the sea fog slides off.  Everything is built here from code; the hero (the Elder)
// and the pillar kit come from ../parts/pillars-before-trees.js.
//
// Polish 2: the mist is a thin low layer that lifts by u 0.34 (sky, sun and the mountains are in view from the first frame),
// the water mirrors sky, mountain wall, bank and the nearest pillars, and each pillar smokes a short rising gold plume.
// Layout (world metres): entry at the origin heading -Z along stream A; the sun 25 degrees left of that heading;
// the route swings 30 degrees right over the fallen pillar (stream B), curves 120 degrees left round the Elder and
// leaves heading -X down the avenue (stream C) to the ring between two gateposts.  Water level is y = WATER,
// land about y = -0.05, so the hero's flat shadows (y = 0.05) lie on it.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, makePillarField, swardMaterial, dirFog } from '../parts/pillars-before-trees.js';

const TAU = Math.PI * 2, D2R = Math.PI / 180;
const WATER = -0.4;
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return new THREE.Vector3(c.r * k, c.g * k, c.b * k); };
const linS = (hex, k, sat) => { const v = lin(hex), l = v.x * 0.3 + v.y * 0.55 + v.z * 0.15; return v.set(l + (v.x - l) * sat, l + (v.y - l) * sat, l + (v.z - l) * sat).multiplyScalar(k); };
const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

// ------------------------------------------------------------------------------------------------
// The route: heading integrated from a curvature profile (degrees per metre, + = right), 460 m.
// ------------------------------------------------------------------------------------------------
// Polish 3: the flight stays one to two metres above the ground among the groves (entry over the stream, across the bar,
// down the avenue's water), with one slow rise round the Elder (to 9 m) that shows the whole field against the mountains.
const RING_Y = 5.3, RING_R = 5.5;                       // the ring: its height on the route and its radius (the portal's own, below)
const Y_KEYS = [[-10, 0.62], [38, 0.62], [58, 0.85], [80, 1.75], [100, 1.6], [140, 1.3], [182, 1.45], [206, 2.0], [240, 4.0], [266, 6.6], [287, 7.0], [320, 3.0], [342, 1.7], [372, 1.55], [400, RING_Y], [470, RING_Y]];
function routeY(d) {
  for (let i = 0; i < Y_KEYS.length - 1; i++) {
    const a = Y_KEYS[i], b = Y_KEYS[i + 1];
    if (d <= b[0]) return lerp(a[1], b[1], smoothstep(a[0], b[0], d));
  }
  return Y_KEYS[Y_KEYS.length - 1][1];
}
function routeCurv(d) {
  let k = (30 / 22) * smoothstep(60, 66, d) * (1 - smoothstep(82, 88, d));
  const a = smoothstep(180, 236, d);
  k -= (0.55 + 1.5 * a * a) * smoothstep(180, 190, d) * (1 - smoothstep(236, 244, d)) * 0.961;
  k -= (180 / Math.PI / 47) * smoothstep(236, 244, d) * (1 - smoothstep(282, 292, d)) * 0.964;
  return k;
}
// the avenue is flown as one long S: the heading swings 14 degrees toward the sun and then 14 toward the mountains, the
// route returning to the avenue's own line (the swing is odd about its middle), so that every pair of pillars is met
// from another side and height
function routeDev(d) {
  const t = clamp((d - 292) / 100, 0, 1), s = Math.sin(Math.PI * t);
  const t2 = clamp((d - 98) / 84, 0, 1), s2 = Math.sin(Math.PI * t2);          // and the bar is flown as a weave between its pillars
  return 22 * Math.sin(TAU * t) * s * s - 19 * Math.sin(TAU * t2) * s2 * s2;
}
function makeRoute() {
  const pts = [], step = 0.25; let x = 0, z = 0, az = 0, n = 0;
  for (let d = 0; d <= 460 + 1e-6; d += step, n++) {
    if (n % 32 === 0 || d > 460 - step * 0.5) pts.push([x, routeY(d), z]);
    const h = (az + routeDev(d)) * D2R; x += Math.sin(h) * step; z -= Math.cos(h) * step; az += routeCurv(d) * step;
  }
  const l = pts[pts.length - 1]; l[0] = Math.round(l[0] * 10) / 10; pts[pts.length - 2][2] = l[2]; pts[pts.length - 3][2] = l[2];
  return makePath(pts, { samples: 460 });
}

// ------------------------------------------------------------------------------------------------
// Streams and the water-distance map W (metres to the nearest water edge: negative in a channel,
// positive on land, capped at WCAP).  One grid serves the ground, the water, the plants and the cast.
// ------------------------------------------------------------------------------------------------
const MAP = { cx: -50, cz: -180, size: 640, n: 320, cap: 28 };
const AVE_Z = -243.7;                                   // the avenue runs along this z, heading -X
const aveStreamZ = (x) => AVE_Z + 9 * Math.sin(TAU * (x + 146) / 50);
// n4: THE BRIDGE.  The design's journey names the place: the fallen pillar's ringed end at one fifth of its 460 m (route metre
// 92), then its length (8 m: the design's space) under the lens.  Everything of the bridge is given from this one station:
// the trunk, channel B under its middle, the two giants on B's banks, its fish, its plants, the walker and the look at it.
const JOURNEY = 460, BRIDGE_S = 0.2 * JOURNEY, BRIDGE_L = 8, LOOK_AHEAD = 18;      // LOOK_AHEAD: the camera's own lookAhead (live's 18 m; the camera's line is live's, letter for letter), named because the groves' series and the looks reckon by it
function bridgeOf(path) {
  const a = path.posAtDist(BRIDGE_S, new THREE.Vector3()), b = path.posAtDist(BRIDGE_S + BRIDGE_L, new THREE.Vector3()), l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  const dir = [(b.x - a.x) / l, (b.z - a.z) / l];
  return { s0: BRIDGE_S, s1: BRIDGE_S + BRIDGE_L, sMid: BRIDGE_S + BRIDGE_L / 2, a, b, dir, right: [-dir[1], dir[0]], mid: [(a.x + b.x) / 2, (a.z + b.z) / 2] };
}
// the route station (metres) nearest a place and the plan distance to it, to 5 cm (path.nearestXZ answers by the path's metre samples)
function stationOf(path, x, z) {
  const c = path.nearestXZ(x, z).u * path.length, P = new THREE.Vector3(); let best = Infinity, bs = c;
  for (let d = Math.max(0, c - 1.1); d <= Math.min(path.length, c + 1.1); d += 0.05) { path.posAtDist(d, P); const q = (P.x - x) * (P.x - x) + (P.z - z) * (P.z - z); if (q < best) { best = q; bs = d; } }
  return { s: bs, dist: Math.sqrt(best) };
}
// the distance in space from a point to the route's line (the lens's own line), to 5 cm
function lensDist(path, x, y, z) {
  const c = path.nearestXZ(x, z).u * path.length, P = new THREE.Vector3(); let best = Infinity;
  for (let d = Math.max(0, c - 2); d <= Math.min(path.length, c + 2); d += 0.05) { path.posAtDist(d, P); const q = (P.x - x) * (P.x - x) + (P.y - y) * (P.y - y) + (P.z - z) * (P.z - z); if (q < best) best = q; }
  return Math.sqrt(best);
}
function streamLines(path, BR) {
  const cr = (pts, per = 10) => {                      // Catmull-Rom through [x, z, halfWidth] points
    const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[2], p[1])), false, 'centripetal');
    const out = [], n = pts.length * per, v = new THREE.Vector3();
    for (let i = 0; i <= n; i++) { c.getPoint(i / n, v); out.push([v.x, v.z, v.y]); }
    return out;
  };
  const A = cr([[-4, 150, 5], [-2, 70, 5], [-1.2, 30, 4.6], [-1.6, -4, 4.6], [-1.4, -26, 4.4], [1.2, -48, 3.3], [0.5, -61, 3.6], [-9, -76, 3.4], [-30, -86, 3.2], [-70, -92, 3.8], [-130, -80, 4.2], [-200, -96, 4], [-290, -84, 4.5], [-380, -100, 5]], 14);
  // n4: channel B runs square under the middle of the bridge, for the trunk's own length on either side of it (it crossed the
  // route 12 m earlier, under the place an older round had laid the trunk); it comes from the right (upstream) as before
  const [bmx, bmz] = BR.mid, [brx, brz] = BR.right, bl = BRIDGE_L;
  const B = cr([[230, -40, 4], [140, -44, 3.6], [80, -56, 3.2], [38, -68, 2.8], [bmx + brx * bl, bmz + brz * bl, 2.7], [bmx, bmz, 2.7], [bmx - brx * bl, bmz - brz * bl, 2.8], [-17, -101, 3], [-45, -130, 3.4], [-78, -160, 3.2], [-120, -178, 3], [-190, -170, 3.4], [-280, -190, 3.6], [-380, -180, 4]], 12);
  const cPts = [];
  for (let x = -372; x <= 6; x += 3) cPts.push([x, aveStreamZ(x), 3.6 + 1.1 * Math.sin(x * 0.11) + 0.6 * Math.sin(x * 0.043 + 2)]);
  const C2 = cr([[6, aveStreamZ(6), 3.6], [24, -251, 3.8], [46, -263, 3.6], [80, -272, 3.4], [124, -268, 3.8], [180, -250, 4], [260, -262, 4.4]], 12);
  const D = cr([[24, -251, 2.2], [2, -268, 2.6], [-40, -276, 3], [-90, -269, 2.6], [-140, -278, 3.2], [-200, -271, 2.8], [-262, -256, 2.6], [-300, AVE_Z - 2, 3]], 12);
  const Eb = cr([[-45, -130, 2], [-52, -165, 2.2], [-40, -196, 2.4], [-30, -222, 2.2], [-21, aveStreamZ(-21), 2.6]], 12);   // B's braid down to the avenue
  const Fb = cr([[-120, -178, 2], [-150, -205, 2.4], [-190, -222, 2.6], [-232, AVE_Z + 6, 2.6]], 12);
  const G = cr([[38, -68, 2], [49, -104, 2.2], [41, -134, 2.5], [53, -156, 2.4], [66, -176, 2.5], [84, -196, 2.6], [82, -238, 2.4], [80, -272, 2.6]], 12);          // a side channel that keeps the route company into the fog
  const H = cr([[78.6, -190, 1.6], [73, -201, 2.0], [60, -208, 2.2], [48, -213, 2.2], [37, -221, 2.0], [27, -236, 2.0], [24, -251, 2.2]], 12);
  // n4: braid K still leaves B's far bank on the upstream side of the crossing: its first point lies on B's own line, as far
  // from the route as its next point already keeps (so it sets out along the bar beside the route, as it did)
  const kLat = path.nearestXZ(18.5, -100).dist;
  const K = cr([[bmx + brx * kLat, bmz + brz * kLat, 1.3], [18.5, -100, 1.9], [24.5, -112, 2.3], [27.5, -123, 2.0], [33.5, -133, 2.3], [42, -137, 2.2]], 12);      // a braid that keeps the weave over the bar company: the pillars stand in it
  // polish 4: a braid that leaves G under the route at path metre 196 and runs down the sun's own bearing to H: the pass along the water, pillars and sun mirrored
  const M = cr([[66, -176, 1.5], [62.6, -181.5, 2.3], [58.6, -189.5, 2.9], [54.6, -198.5, 2.7], [50.5, -207, 2.5], [48, -213, 2.2]], 12);
  return { A, B, C: cPts, C2, D, Eb, Fb, G, H, K, M };
}

async function makeWaterMap(ctx, lines) {
  const { n, size, cap } = MAP, cell = size / n, x0 = MAP.cx - size / 2, z0 = MAP.cz - size / 2;
  const W = new Float32Array(n * n).fill(cap);
  let work = 0;
  for (const key of Object.keys(lines)) {
    const L = lines[key];
    for (let i = 0; i < L.length - 1; i++) {
      // one stamp per segment with the true distance to it (cheaper than a row of round stamps along it)
      const a = L[i], b = L[i + 1], ex = b[0] - a[0], ez = b[1] - a[1], l2 = Math.max(ex * ex + ez * ez, 1e-6), R = cap + Math.max(a[2], b[2]);
      const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - R - x0) / cell)), i1 = Math.min(n - 1, Math.ceil((Math.max(a[0], b[0]) + R - x0) / cell));
      const j0 = Math.max(0, Math.floor((Math.min(a[1], b[1]) - R - z0) / cell)), j1 = Math.min(n - 1, Math.ceil((Math.max(a[1], b[1]) + R - z0) / cell));
      for (let j = j0; j <= j1; j++) {
        const qz = z0 + (j + 0.5) * cell - a[1], row = j * n;
        for (let ii = i0; ii <= i1; ii++) {
          const qx = x0 + (ii + 0.5) * cell - a[0], t = Math.min(1, Math.max(0, (qx * ex + qz * ez) / l2)), dx = qx - ex * t, dz = qz - ez * t;
          const w = Math.sqrt(dx * dx + dz * dz) - (a[2] + (b[2] - a[2]) * t);
          if (w < W[row + ii]) W[row + ii] = w;
        }
      }
      if (++work % 12 === 0) await ctx.yield();
    }
  }
  const at = (x, z) => {
    const fx = (x - x0) / cell - 0.5, fz = (z - z0) / cell - 0.5;
    if (fx < 0 || fz < 0 || fx > n - 1.001 || fz > n - 1.001) return cap;
    const i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * n + i;
    return lerp(lerp(W[k], W[k + 1], u), lerp(W[k + n], W[k + n + 1], u), v);
  };
  const half = new Uint16Array(n * n);
  for (let i = 0; i < n * n; i++) { half[i] = THREE.DataUtils.toHalfFloat(W[i]); if (i % 20000 === 19999) await ctx.yield(); }
  const tex = new THREE.DataTexture(half, n, n, THREE.RedFormat, THREE.HalfFloatType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true;
  return { W, at, tex, x0, z0 };
}

// height of the ground: channels 0.3-0.55 m deep, a shelving shore, low bars
function makeHeight(map, noise) {
  return (x, z) => {
    const w = map.at(x, z), n = noise.fbm2(x * 0.07, z * 0.07, 2);
    if (w > 0) return WATER + 0.3 * smoothstep(0, 1.0, w) + 0.04 * n * smoothstep(1, 6, w) + 0.07 * smoothstep(6, 22, w) + 0.012 * noise.n2(x * 1.7, z * 1.7);
    return WATER - (0.36 + 0.14 * n) * smoothstep(0, 2.4, -w) + 0.015 * noise.n2(x * 1.7, z * 1.7) * smoothstep(0, 1, -w);
  };
}

// ------------------------------------------------------------------------------------------------
// GLSL shared by the sky, the water and the ground: value noise, the sky as a function of direction
// (warm fog that opens to a milk-blue sky as uClear rises), and the water map lookup.
// ------------------------------------------------------------------------------------------------
const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm2(vec2 p){ return .5 * vn2(p) + .3 * vn2(p * 2.1 + 7.3) + .2 * vn2(p * 4.3 + 13.1); }
`;
const GLSL_SKY = /* glsl */`
uniform vec3 uSunDir, uFogSun, uFogAway, uZen, uHor, uSunTint, uLow;
uniform float uClear, uTime, uCum;
float clearAt(float h){ return clamp(uClear * 1.55 - (1. - smoothstep(0., .3, h)) * .55, 0., 1.); }
// n4 (J): the glow round the sun, as the sky draws it: in the fog (toward the sun's side) and in the clear sky.  skyCol adds
// these two and nothing else as its glow; the water mirrors the same two (sunLobe), so its road of light is the sky's own.
vec3 glowFog(float side, float g2, float g8, float g64){ return uSunTint * (.05 + .95 * side) * (.06 + .15 * g2 + .32 * g8 + .7 * g64); }
vec3 glowSky(float g2, float g8, float g64){ return uSunTint * (.05 * g2 + .22 * g8 + .9 * g64); }
// the lobe of that glow alone (its two tight terms: the broad ones are already in the mirrored sky) in direction d
vec3 sunLobe(vec3 d){
  float h = max(d.y, 0.);
  vec2 sh = uSunDir.xz / max(length(uSunDir.xz), 1e-4), dh = d.xz / max(length(d.xz), 1e-4);
  float side = .5 + .5 * dot(dh, sh), g = max(dot(d, uSunDir), 0.), g2 = g * g, g8 = g2 * g2; g8 *= g8; float g64 = g8 * g8; g64 *= g64; g64 *= g64;
  return mix(glowFog(side, 0., g8, g64) - glowFog(side, 0., 0., 0.), glowSky(0., g8, g64), clearAt(h));
}
vec3 skyCol(vec3 d, float disc){
  float h = max(d.y, 0.);
  vec2 sh = uSunDir.xz / max(length(uSunDir.xz), 1e-4), dh = d.xz / max(length(d.xz), 1e-4);
  float side = .5 + .5 * dot(dh, sh), cs = dot(d, uSunDir);
  float g = max(cs, 0.), g2 = g * g, g8 = g2 * g2; g8 *= g8; float g64 = g8 * g8; g64 *= g64; g64 *= g64;
  vec2 bq = d.xz * 2.3 / (.4 + h) + vec2(uTime * .085, uTime * .05);
  bq += .55 * vec2(vn2(bq * .7 + 3.), vn2(bq * .7 + 9.));                   // the billows roll: a slow warp
  float bil = smoothstep(.22, .78, vn2(bq) * .62 + vn2(bq * 2.3 + 5.) * .38);                    // slow billows drifting through the fog
  float bil2 = smoothstep(.25, .75, vn2(bq * .37 + 11. + vec2(uTime * .012, 0.)));
  vec3 fog = mix(uFogAway, uFogSun, side * mix(side, 1., .35)) * mix(.88, 1.08, sqrt(h)) * (1. + .62 * (bil - .5) + .5 * (bil2 - .5));
  fog += glowFog(side, g2, g8, g64) * mix(.55, 1., bil);
  vec3 sky = mix(uHor, uZen, smoothstep(0., .5, h));
  sky = mix(sky, uHor * 1.04, .5 * side * side * (1. - h));
  sky = mix(sky, uSunTint * vec3(.98, .9, .74) * .9, .5 * side * side * side * (1. - smoothstep(0., .34, h)));      // gold low haze toward the sun, blue away from it
  sky *= mix(vec3(.9, .93, 1.02), vec3(1.), max(side, smoothstep(0., .5, h) * .5));
  sky += glowSky(g2, g8, g64);
  // high combed cloud: long streaks lying level, in a few patches
  float az = atan((d.x - d.z) * .7071 + 1e-5, -(d.x + d.z) * .7071);
  vec2 cp = vec2(az * 2.2 + uTime * .003, h * 11.);
  float comb = (.6 * vn2(vec2(cp.x * 1.3, cp.y * 5.)) + .4 * vn2(vec2(cp.x * 3.1 + 5., cp.y * 11.))) * smoothstep(.5, .8, vn2(vec2(cp.x * .5 + 2., cp.y * .6)));
  comb = smoothstep(.34, .7, comb) * smoothstep(.12, .32, h) * (1. - smoothstep(.55, .85, h)) * (1. - smoothstep(2.5, 3.1, abs(az)));
  sky = mix(sky, mix(vec3(.95, .93, .9), uSunTint, .45) * (1.05 + .5 * g8), comb * .5);
  vec2 uq = d.xz / (.16 + h) * 1.25 + vec2(uTime * .012, uTime * .004);
  uq = vec2(uq.x * .8 - uq.y * .6, (uq.x * .6 + uq.y * .8) * .5);                 // n3: drawn out along the wind into shoals (a lone round puff high in the sky read as a smudge)
  float cu = smoothstep(.5, .72, fbm2(uq + .5 * vec2(vn2(uq * .6), vn2(uq * .6 + 7.)))) * uCum * smoothstep(.03, .2, h) * (1. - .85 * smoothstep(.3, .5, h) * (1. - uCum));
  sky = mix(sky, mix(vec3(.6, .65, .75), vec3(1.06, 1.03, .97), smoothstep(.3, .85, fbm2(uq * 1.9 + 3.) + .35 * g2)), cu * .88);     // heaped cloud with lit heads and grey bases
  float c = clearAt(h);
  vec3 col = mix(fog, sky, c);
  float sd = smoothstep(.99905, .99955, cs);                 // the disc: soft and pale gold in fog, hard after
  col += disc * uSunTint * sd * mix(1.1, 5., c);
  return mix(col, uLow, (1. - smoothstep(-.07, 0., d.y)));
}
`;
const GLSL_MAP = /* glsl */`
uniform sampler2D uMap; uniform vec4 uMapRect;             // x0, z0, 1/size, cap
float waterDist(vec2 p){
  vec2 uv = (p - uMapRect.xy) * uMapRect.z;
  vec2 e = abs(uv - .5);
  float w = texture2D(uMap, clamp(uv, .002, .998)).r;
  return mix(w, uMapRect.w, smoothstep(.47, .5, max(e.x, e.y)));
}
`;

function makeSkyDome(E) {
  const mat = new THREE.ShaderMaterial({
    uniforms: E.U, depthWrite: false, depthTest: false, side: THREE.BackSide,
    vertexShader: /* glsl */`
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p.xyww;
}`,
    fragmentShader: /* glsl */`
varying vec3 vDir;
${GLSL_NOISE}
${GLSL_SKY}
void main(){
  vec3 d = normalize(vDir + vec3(0., 1e-5, 0.));
  vec3 col = skyCol(d, 1.);
  col += (h21(gl_FragCoord.xy) - .5) * .006;
  gl_FragColor = vec4(max(col, 0.), 1.);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 4), mat);
  mesh.frustumCulled = false; mesh.renderOrder = -10; mesh.name = 'sky';
  return mesh;
}

// The young mountains: a far wall of bare slate-violet rock on the -X side, 900 m high, its own haze.
async function makeMountains(ctx, E, rng, noise, o) {
  const N = 480, ROWS = 7, pos = [], dat = [], idx = [], R = o.R, cx = -50, cz = -180, s0 = rng.range(0, 100), SPAN = 350, KS = SPAN / 156;
  const ENV = [[0, 1], [35, 1], [58, 0.82], [80, 0.76], [106, 0.72], [128, 0.52], [150, 0.28], [166, 0.1], [175, 0]];      // polish 4: the wall runs on round the plain's head, lower, so that a dark range stands behind the pillars from the first frame
  const envAt = (a) => { for (let i = 0; i < ENV.length - 1; i++) if (a <= ENV[i + 1][0]) return lerp(ENV[i][1], ENV[i + 1][1], smoothstep(ENV[i][0], ENV[i + 1][0], a)); return 0; };
  for (let i = 0; i <= N; i++) {
    const t0 = i / N, t = (t0 - 0.5) * KS + 0.5, ph = (t0 - 0.5) * SPAN * D2R, dx = -Math.cos(ph), dz = Math.sin(ph);          // phi 0 looks down -X
    const env = envAt(Math.abs(t0 - 0.5) * SPAN);
    const massif = 0.72 + 0.5 * smoothstep(-0.35, 0.45, noise.n2(t * 2.4 + s0, 9.3));                 // a few great massifs with saddles between, not a saw
    const top = (o.base + o.amp * massif * (0.66 * noise.ridged2(t * o.freq + s0, 1.7, 2) + 0.3 * (0.5 + 0.5 * noise.fbm2(t * o.freq * 2.1 + s0, 3.1, 2)) + 0.03 * noise.n2(t * 41, s0))) * env;
    for (let j = 0; j <= ROWS; j++) {
      const v = j / ROWS;
      pos.push(cx + dx * R, -30 + top * v, cz + dz * R); dat.push(t * 60, v, top);
    }
    if (i % 80 === 79) await ctx.yield();
  }
  await ctx.yield();
  for (let i = 0; i < N; i++) for (let j = 0; j < ROWS; j++) { const a = i * (ROWS + 1) + j, b = a + ROWS + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aM', new THREE.Float32BufferAttribute(dat, 3));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...E.U, uHaze: { value: new THREE.Vector2(o.haze0, o.haze1) } }, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec3 aM; varying vec3 vM; varying vec3 vWp;
void main(){ vM = aM; vWp = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
    fragmentShader: /* glsl */`
uniform vec3 uRock, uSunCol; uniform float uMtn, uSun; uniform vec2 uHaze;
varying vec3 vM; varying vec3 vWp;
${GLSL_NOISE}
${GLSL_SKY}
void main(){
  float y = vM.y * vM.z;                                     // metres above the plain
  vec2 p = vec2(vM.x, y * .012);
  // ribs and gullies: ridged noise falling with height gives lit and shaded faces
  float r1 = abs(vn2(p * vec2(1.1, .9)) - .5) * 2., r2 = abs(vn2(p * vec2(3.3, 1.7) + 9.) - .5) * 2., r3 = vn2(p * vec2(9., 5.) + 3.);
  vec2 rp = vec2(p.x * 2.6 + p.y * .45, p.y * .28);
  float ra = vn2(rp), rb = vn2(rp * vec2(2.7, 1.6) + 4.);
  float face = clamp(.5 + (vn2(rp + vec2(.1, 0.)) - ra) * 7. + (vn2(rp * vec2(2.7, 1.6) + vec2(4.1, 4.)) - rb) * 4., 0., 1.);
  // great buttresses and valleys, a tenth of the view wide, leaning a little as they rise: sun on one flank, violet shade on the other
  float bx = p.x * .3 + p.y * .05 + .35 * vn2(vec2(p.x * .11, p.y * .3 + 5.));
  float b0 = vn2(vec2(bx, 2.7)), b1 = vn2(vec2(bx + .25, 2.7));
  float butt = smoothstep(.2, .8, .5 + (b1 - b0) * 4.6);
  float vall = 1. - smoothstep(.0, .3, b0);                                                   // the valley floors lie deepest in shade
  face = clamp(mix(butt, face, .2) - vall * .25, 0., 1.);
  vec3 rock = uRock * mix(.62, 1.18, r3 * .4 + r1 * .6) * mix(vec3(.88, .9, 1.06), vec3(1.1, 1.02, .9), face);
  float crest = smoothstep(.5, 1., vM.y) * smoothstep(.35, .95, butt) * (.75 + .25 * r3);        // only the crests' sunward shoulders reach into the low sun: broad soft shapes
  vec3 lit = rock * (crest * .55 * mix(uSunCol, vec3(1., .86, .74), .5) * mix(.35, 1.2, uSun) + vec3(.15, .16, .3) * mix(.82, 1.3, face));
  lit *= mix(.72, 1., smoothstep(0., 300., y));
  vec3 d = normalize(vWp - cameraPosition + vec3(0., 1e-5, 0.));
  vec3 haze = mix(skyCol(vec3(d.x, .03, d.z), 0.), uRock * vec3(2.1, 2.4, 3.3), .62 * uClear);
  float hz = mix(uHaze.x, uHaze.y, smoothstep(0., 520., y));    // nearer the foot the air is thicker
  hz = mix(hz, 1., (1. - uClear) * 1.5 * (1. - smoothstep(60., 430., y)));   // in the morning mist the feet are lost and the crests stand above it
  hz = clamp(hz, 0., 1.);
  vec3 col = mix(lit, haze, hz);
  gl_FragColor = vec4(col, uMtn);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = o.order; mesh.name = 'mountains';
  return mesh;
}

// ------------------------------------------------------------------------------------------------
// Ground: one shader (rounded gravel in ochre, slate and rust, dark microbial crust on the dry bars,
// a damp green band along every water edge, the stream bed under moving caustics) on a fine ribbon
// under the route, a 5 m grid over the mapped plain and a flat skirt out to the mountain foot.
// ------------------------------------------------------------------------------------------------
const GLSL_FOGGED = /* glsl */`
float fogAmount(float depth){
  #ifdef USE_FOG
    return 1. - exp(-fogDensity * fogDensity * depth * depth);
  #else
    return 0.;
  #endif
}`;
async function makeGround(ctx, E) {
  const { path, height, map } = E, group = new THREE.Group(); group.name = 'ground';
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...E.U }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
varying vec3 vWp;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSunCol, uSky, uFill, uWarm, uGreen, uRust, uDark;
uniform float uSun, uCloud, uWetAll, uRipe, uWindSpeed; uniform vec3 uAxis; uniform sampler2D uCover;
varying vec3 vWp;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_SKY}
${GLSL_MAP}
${GLSL_FOGGED}
vec3 pebble(vec2 p, float k){                       // one rounded stone per cell: colour key, dome shade, mask
  vec2 c = floor(p); float h = h21(c + k * 17.3), h2 = h21(c + k * 5.1 + 40.);
  vec2 f = fract(p) - .5 - (vec2(h, h2) - .5) * .34;
  float d = length(f * vec2(1., .78 + .44 * h2));
  return vec3(h, 1. - d * 1.7, 1. - smoothstep(.3, .41, d));
}
float hgt(vec2 p){                                 // the small relief of the plain: swales, ripple marks, lumps (lit by the low sun)
  return vn2(p * .4) * 1.6 + vn2(p * 1.3 + 7.) * .3 + .11 * sin(p.x * 3.7 + p.y * 2.1 + 5. * vn2(p * .23 + 3.)) * smoothstep(.35, .65, vn2(p * .07 + 31.));      // n2: water-laid ripple marks in patches: the raking sun picks them out from the rise
}
vec2 crackle(vec2 p){                              // x: distance to the nearest cell wall (mud cracks), y: a tone per plate
  vec2 i = floor(p), f = fract(p); float d1 = 9., d2 = 9., id = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = vec2(h21(i + g), h21(i + g + 31.7)); vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; id = o.x; } else if (d < d2) d2 = d;
  }
  return vec2(sqrt(d2) - sqrt(d1), id);
}
void main(){
  vec2 p = vWp.xz; float w = waterDist(p);
  vec3 ray = vWp - cameraPosition; float dist = length(ray); ray /= max(dist, 1e-4);
  float nearK = 1. / (1. + dist * .08), midK = 1. / (1. + dist * .006), farK = 1. / (1. + dist * .02);
  vec2 pw = p + .2 * vec2(vn2(p * 1.7), vn2(p * 1.7 + 5.)) + .05 * vec2(vn2(p * 9.), vn2(p * 9. + 8.));
  vec3 a = pebble(pw * 9.5, 1.), b = pebble(mat2(.8, .6, -.6, .8) * pw * 17. + 3.7, 2.), c = pebble(mat2(.6, -.8, .8, .6) * pw * 5.6 + 9.1, 3.);
  c.z *= step(.7, h21(floor(mat2(.6, -.8, .8, .6) * pw * 5.6 + 9.1) + 3.3));          // cobbles are sparse
  vec3 pb = c.z > .5 ? c : (a.z > .5 ? a : b); float on = max(c.z, max(a.z, b.z));
  vec3 ochre = vec3(.46, .38, .25), slate = vec3(.29, .29, .33);
  vec3 stone = pb.x < .5 ? ochre : (pb.x < .9 ? slate : vec3(.37, .22, .13));
  stone *= mix(.72, 1.12, fract(pb.x * 7.));
  float big = fbm2(p * .045 + 2.);
  // three grounds in long shapes that follow the water: bars of rounded gravel, flats of pale cracked mud, mats of dark crust
  float flatM = smoothstep(.44, .56, fbm2(p * vec2(.05, .034) + 9.) + .12 * (vn2(p * .37) - .5) - .06 * smoothstep(8., 20., w)) * smoothstep(-.3, .6, w);
  vec3 grit = mix(vec3(.25, .225, .2), vec3(.39, .345, .285), big);
  vec3 gravel = mix(grit, mix(grit * .8, mix(grit, stone, .7) * (.7 + .4 * pb.y), on), .25 + .75 * nearK) * mix(vec3(1.), vec3(1.05, .93, .82), smoothstep(.5, .8, vn2(p * .12 + 21.)));
  vec2 ck = crackle(pw * mix(3.2, 4.6, vn2(p * .2 + 3.)));
  float nearC = 1. - smoothstep(3.5, 9., dist);                                              // plates a hand or two across, drawn only where a plate is several pixels wide
  float crackLine = (1. - smoothstep(.0, .07, ck.x)) * nearC; ck.y = mix(.5, ck.y, nearC);
  // polish 4: the flats crack into plates a stride across as well, which hold at a distance (so the plain is never a smear)
  vec2 ckB = crackle(pw * mix(.75, 1.05, vn2(p * .05 + 17.)) + 31.);
  float farC = smoothstep(2.5, 7., dist) * (1. - smoothstep(60., 130., dist));
  float lineB = (1. - smoothstep(.0, mix(.035, .1, smoothstep(8., 70., dist)), ckB.x)) * farC;
  vec3 fineSt = b.x < .5 ? ochre * 1.12 : (b.x < .88 ? slate * 1.25 : vec3(.4, .23, .14));
  vec3 mud = mix(vec3(.4, .365, .305), fineSt * (.7 + .45 * b.y), b.z * (.3 + .6 * nearK)) * mix(1., mix(.86, 1.1, ckB.y), farC * .7) * mix(.93, 1.07, vn2(p * 2.7 + 5.)) * mix(vec3(1.05, 1., .9), vec3(.9, .95, 1.08), vn2(p * .07 + 13.));      // k1: the flats are finer rounded gravel (the brief has no mud), paler, in drifts of ochre and slate
  vec3 alb = mix(gravel, mud, flatM);
  alb *= mix(.88, 1.1, vn2(p * .21 + 11.)) * mix(.9, 1.08, big);
  // the dark microbial crust: a leathery skin in mats with lobed edges, slate-violet where dry, olive where damp, curling at the cracks
  float crust = smoothstep(.47, .6, fbm2(p * .13 + 3.) + .2 * (vn2(p * 1.1) - .5) + .05 * (vn2(p * 5.) - .5) + .1 * flatM) * smoothstep(2.5, 7., w);
  crust *= 1. - .55 * lineB * flatM;                      // the plates are the crust's own cracking
  vec3 crustC = mix(vec3(.085, .075, .1), vec3(.1, .11, .06), smoothstep(12., 4., w) * .7 + .3 * vn2(p * .6)) * mix(.8, 1.35, vn2(p * 4.1 + 1.)) * (1. + .5 * ck.y * flatM);
  crustC = mix(crustC, crustC * 2.1 + vec3(.03, .02, .0), crackLine * flatM * .6);                 // pale curled rims
  crust *= mix(1., smoothstep(.3, .5, ckB.y + .5 * (vn2(p * .23 + 2.) - .5)), farC * .85);                    // the mats break up along the cracks into plates
  alb = mix(alb, crustC * 1.5 + vec3(.01, .008, .014), crust * .78 * mix(1., .7, on * nearK * (1. - flatM)));
  alb *= mix(vec3(1.), mix(vec3(1.12, .98, .8), vec3(.84, .9, 1.06), smoothstep(.35, .65, vn2(p * .043 + 51.))), .55 * (1. - crust));      // drifts of ochre and of slate gravel, a few strides across
  // the dense band of the sward along every water edge
  vec2 cuv = clamp((p - uMapRect.xy) * uMapRect.z, .002, .998);
  float cov = texture2D(uCover, cuv + (vec2(vn2(p * .9), vn2(p * .9 + 4.)) - .5) * .004 + (vec2(vn2(p * 3.3 + 7.), vn2(p * 3.3 + 2.)) - .5) * .0016).r;
  float green = smoothstep(.02, .3, cov + .1 * (vn2(p * 2.1 + 9.) - .5)) * smoothstep(.1, .6, w) * mix(.85, 1., vn2(p * .7 + 3.));
  float thk = vn2(p * 6.3) * .6 + vn2(p * 14.) * .4;                              // the thicket's own grain: wiry, not a lawn
  // n2: under and between the clumps the ground is a mat of low shoots, drawn as tufts a hand across, each with its own tone
  // and a dark gap round it (never bare soil in squares, never a smooth lawn); far off they melt into one olive
  vec2 tf = crackle(pw * 17. + 11.); float tuftK = 1. - smoothstep(3., 11., dist);
  float tone = mix(.5, tf.y, tuftK);
  vec3 gcol = mix(uGreen * vec3(.6, .72, .6), uGreen * vec3(1., 1.02, .6), smoothstep(.3, .9, tone + .3 * (vn2(p * .31 + 5.) - .5))) * mix(.6, 1.08, thk);
  gcol = mix(gcol, uRust * .5, clamp((.06 + uRipe * .12) * (.4 + 1.2 * vn2(p * .23 + 19.)) + .22 * step(.86, tone) * tuftK, 0., 1.));          // a little russet litter and ripe tufts
  gcol *= mix(1., .55 + .45 * smoothstep(.0, .3, tf.x), tuftK);                     // the shade between tufts
  vec2 wd = uAxis.xz; float wl = length(wd); wd = wl > 1e-3 ? wd / wl : vec2(1., 0.);
  float run = dot(p, wd) * .35 - uTime * uWindSpeed * .45;
  gcol *= 1. + .2 * (sin(run) * .6 + sin(run * 2.3 + p.x * .7) * .4);           // wind waves running through the sward
  gcol *= mix(1., .8, nearK);                                          // in the stems' own shade
  alb = mix(alb, gcol, green * mix(.95, .9, nearK));
  float wet = max((1. - smoothstep(-.1, 1.6, w)) * smoothstep(-1.2, -.1, w), uWetAll * .5);
  alb *= mix(1., .5, wet);
  alb = mix(alb, alb * vec3(.66, .72, .5), (1. - smoothstep(-1.4, -.1, w)));                 // the bed under water is darker and greener than the dry bar
  // light: the low sun rakes the small relief
  float cloud = 1. - uCloud * smoothstep(.42, .7, fbm2(p * .0045 + vec2(uTime * .004, uTime * .011)));
  vec2 e2 = vec2(.22, 0.); float h0 = hgt(p);
  vec2 gradH = vec2(hgt(p + e2) - h0, hgt(p + e2.yx) - h0) / .22;
  vec2 sh2 = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
  float rake = clamp(1. + dot(gradH, sh2) * .4 * (.25 + .75 * farK) * (1. - green * .7), .6, 1.4);
  float relief = rake * mix(1., mix(.62, 1.22, pb.y), on * nearK * (1. - flatM));
  vec3 sun = uSunCol * max(uSunDir.y, .36) * 1.15 * uSun * cloud;
  vec3 amb = (uSky * .8 + uFill * .35) + uWarm * .45;
  vec3 col = alb * (sun * relief + amb * mix(1., .8 + .3 * pb.y, on * nearK));
  col += wet * uSunCol * uSun * cloud * .05 * pb.y * on * nearK;
  // standing water in the hollows of the flats and a wet sheen beside every channel: the sky lies in them
  float pudN = fbm2(p * .13 + 40.) + .08 * (vn2(p * 1.1) - .5);
  float pud = uWetAll * smoothstep(.5, .57, pudN) * smoothstep(1.5, 4., w) * (1. - green);       // sheet water lies on the flats after rain
  // n2: and in every weather thin films stand in the hollows of the bare flats (never in the sward), each with a dark wet rim:
  // the sky lies on the plain in long shapes, so no flat is a smear from the rise
  float filmN = fbm2(p * vec2(.06, .095) + 71.) + .1 * (vn2(p * .9 + 3.) - .5) + .03 * (vn2(p * 4.3) - .5);
  float filmOk = smoothstep(4.5, 8., w) * (1. - green) * smoothstep(.2, .6, flatM + .35);
  float film = smoothstep(.535, .56, filmN) * filmOk, rimW = smoothstep(.45, .535, filmN) * filmOk;
  col *= 1. - .5 * rimW * (1. - film);
  pud = max(pud, film * .92);
  float sheen = (1. - smoothstep(.1, 2.2, w)) * smoothstep(-.3, .1, w) * .5 * (1. - green * .8);
  vec3 Rr = normalize(vec3(ray.x + gradH.x * .02, abs(ray.y) + .03, ray.z + gradH.y * .02)); float pfr = 1. - abs(ray.y); pfr = pfr * pfr * pfr;
  float sdr = max(dot(Rr, uSunDir), 0.); float sd8 = sdr * sdr; sd8 *= sd8; sd8 *= sd8; sd8 *= sd8; sd8 *= sd8;
  vec3 mir = min(skyCol(Rr, 0.) * .62, vec3(.8)) + uSunCol * uSun * sd8 * sd8 * 2.;
  col = mix(col, mir, max(pud * (.35 + .6 * pfr), sheen * (.1 + .9 * pfr)));
  // under water: the bed seen through clear water, with caustics running downstream
  float depth = max(${WATER.toFixed(2)} - vWp.y, 0.);
  float sub = smoothstep(0., .05, depth);
  vec2 cq = p * 3.3 + .35 * vec2(vn2(p * 1.9 + uTime * .1), vn2(p * 1.9 + 7. - uTime * .08)) + vec2(uTime * .13, uTime * .31);
  float c1 = abs(vn2(cq) - .5), c2 = abs(vn2(mat2(.8, .6, -.6, .8) * cq * 1.7 - uTime * .21 + 4.) - .5);
  float caus = ((1. - smoothstep(.0, .16, c1)) + (1. - smoothstep(.0, .14, c2))) * .6;
  col = mix(col, col * vec3(.56, .68, .56) * mix(1., .62, smoothstep(0., .5, depth)) + alb * caus * sub * (uSunCol * uSun * .5 + uWarm * .22) * midK, sub);
  vec3 fogc = skyCol(normalize(vec3(ray.x, .02, ray.z)), 0.);
  gl_FragColor = vec4(mix(col, fogc, fogAmount(vFogDepth)), 1.);
}`,
  });
  // 1. the ribbon under the route
  const lat = [0, 0.45, 0.95, 1.5, 2.15, 2.9, 3.8, 4.9, 6.2, 7.8, 9.8, 12.3, 15.3, 18.8, 22.8, 27];
  const offs = [...lat.slice(1).reverse().map((v) => -v), ...lat], NC = offs.length, S0 = -46, S1 = 506, RS = 1.5, NR = Math.round((S1 - S0) / RS);
  const pos = new Float32Array((NR + 1) * NC * 3), idx = [], P = new THREE.Vector3(), T = new THREE.Vector3();
  for (let r = 0; r <= NR; r++) {
    path.posAtDist(S0 + r * RS, P); path.tangentAtDist(S0 + r * RS, T);
    const lx = T.z, lz = -T.x, ll = Math.hypot(lx, lz) || 1;
    for (let c = 0; c < NC; c++) {
      const x = P.x + lx / ll * offs[c], z = P.z + lz / ll * offs[c], o = (r * NC + c) * 3;
      pos[o] = x; pos[o + 1] = height(x, z) - (c === 0 || c === NC - 1 ? 0.7 : 0); pos[o + 2] = z;
    }
    if (r % 24 === 23) await ctx.yield();
  }
  for (let r = 0; r < NR; r++) for (let c = 0; c < NC - 1; c++) { const a = r * NC + c, b = a + NC; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  // polish 4: the height of this ribbon AS MESHED at (path metre, metres to the side): plants stand on the mesh, not on the exact
  // height function (the mesh cuts the corner of every bank, and clumps set on the function sank or floated along its edges in rows)
  E.ribbonY = (s, lat) => {
    const f0 = (s - S0) / RS; if (!(f0 >= 0) || f0 >= NR || Math.abs(lat) >= 22.7) return null;
    const r = Math.floor(f0), fr = f0 - r; let c = 0; while (c < NC - 2 && offs[c + 1] <= lat) c++;
    const fc = (lat - offs[c]) / (offs[c + 1] - offs[c]), o = (r * NC + c) * 3 + 1;
    const y00 = pos[o], y10 = pos[o + NC * 3], y01 = pos[o + 3], y11 = pos[o + NC * 3 + 3];
    return fr + fc <= 1 ? y00 + fr * (y10 - y00) + fc * (y01 - y00) : y11 + (1 - fr) * (y01 - y11) + (1 - fc) * (y10 - y11);
  };
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setIndex(idx);
  const strip = new THREE.Mesh(sg, mat); strip.frustumCulled = false; group.add(strip);
  await ctx.yield();
  // 2. the plain at 5 m, sunk under the ribbon and dipped under every channel (the water's own edge is per pixel)
  const N = 104, cell = MAP.size / N, cp = new Float32Array((N + 1) * (N + 1) * 3), ci = [];
  for (let j = 0; j <= N; j++) {
    for (let i = 0; i <= N; i++) {
      const x = map.x0 + i * cell, z = map.z0 + j * cell, o = (j * (N + 1) + i) * 3, w = map.at(x, z);
      let y = Math.min(height(x, z), w < 3.5 ? WATER - 0.3 * smoothstep(3.5, 0.5, w) : 9);
      if (path.nearestXZ(x, z).dist < 21) y -= 1.4;
      if (i === 0 || j === 0 || i === N || j === N) y = -0.12;
      cp[o] = x; cp[o + 1] = y; cp[o + 2] = z;
    }
    if (j % 6 === 5) await ctx.yield();
  }
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const a = j * (N + 1) + i, b = a + N + 1; ci.push(a, b, a + 1, b, b + 1, a + 1); }
  const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(cp, 3)); cg.setIndex(ci);
  const coarse = new THREE.Mesh(cg, mat); coarse.frustumCulled = false; group.add(coarse);
  // 3. the skirt
  const h = MAP.size / 2, o = 2800, sq = (r) => [[MAP.cx - r, MAP.cz - r], [MAP.cx + r, MAP.cz - r], [MAP.cx + r, MAP.cz + r], [MAP.cx - r, MAP.cz + r]];
  const kp = [], ki = [];
  for (const [x, z] of [...sq(h), ...sq(o)]) kp.push(x, -0.12, z);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; ki.push(i, i + 4, j, j, i + 4, j + 4); }
  const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute(kp, 3)); kg.setIndex(ki);
  const skirt = new THREE.Mesh(kg, mat); skirt.frustumCulled = false; skirt.renderOrder = -1; group.add(skirt);
  return group;
}

// ------------------------------------------------------------------------------------------------
// Water: one sheet at y = WATER whose edge is cut per pixel from the map; clear over the gravel close
// by, a mirror of the sky at a glancing angle, ripples running downstream, sun glitter scaled by uSun.
// ------------------------------------------------------------------------------------------------
function makeWater(E) {
  const g = new THREE.PlaneGeometry(MAP.size, MAP.size, 1, 1); g.rotateX(-Math.PI / 2); g.translate(MAP.cx, WATER, MAP.cz);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...E.U }, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
varying vec3 vWp;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.); vWp = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSunCol, uWarm, uSky, uFill, uBone, uRock; uniform float uSun, uGlint, uMtn, uWetAll; uniform vec4 uPil[24]; uniform vec4 uSea[3], uSeaK[3], uLog; uniform float uRain, uSq;
varying vec3 vWp;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_SKY}
${GLSL_MAP}
${GLSL_FOGGED}
// one glint to a cell, the grid sized to the pixel (two octaves blended so it never pops): soft round sparks that twinkle
float sparkle(vec2 p, float px, float t){
  float lv = log2(clamp(px, 1e-4, 50.) * 3.4), l0 = floor(lv), fr = lv - l0, acc = 0.;
  for (int i = 0; i < 2; i++) {
    float s = exp2(l0 + float(i)), wgt = i == 0 ? 1. - fr : fr;
    vec2 g = mat2(.8, .6, -.6, .8) * p / s + float(i) * 37.1, c = floor(g), f = fract(g) - .5;
    float h = h21(c), h2 = h21(c + 71.3);
    float d = length(f - (vec2(h, h2) - .5) * .56);
    float tw = max(sin(t * (2. + 4. * h2) + h * 40.), 0.); tw *= tw; tw *= tw;
    acc += wgt * tw * (1. - smoothstep(.07, .3, d)) * step(.4, h2);
  }
  return acc;
}
void main(){
  vec2 p = vWp.xz;
  float w = waterDist(p) + (vn2(p * 1.3) - .5) * .5 + (vn2(p * 5.) - .5) * .12;
  float a0 = (1. - smoothstep(-.14, .06, w));
  float px = max(length(dFdx(p)), length(dFdy(p)));                     // metres of water under one pixel (taken before any loop or discard)
  if (a0 < .004) discard;
  vec3 V = cameraPosition - vWp; float dist = length(V); V /= max(dist, 1e-4);
  float k = 1. / (1. + dist * .02);
  // ripples: a slow swell under two trains of fine wavelets (fine under the lens, so that near water is crisp, not a blur)
  float kn = 1. / (1. + dist * .22);
  vec2 q1 = p * 1.3 + vec2(uTime * .2, uTime * .5), q2 = p * 3.9 + vec2(-uTime * .5, uTime * .9), q3 = mat2(.8, .6, -.6, .8) * p * 8.5 + vec2(uTime * 1.1, uTime * 1.9), e = vec2(.12, 0.);
  float n1 = vn2(q1), n2 = vn2(q2), n3 = vn2(q3);
  vec2 gr0 = vec2(vn2(q1 + e) - n1, vn2(q1 + e.yx) - n1) * .9 + vec2(vn2(q2 + e) - n2, vn2(q2 + e.yx) - n2) * .7;      // the slow swell alone: the sun's road is laid on this
  vec2 gr = gr0 + mat2(.8, -.6, .6, .8) * vec2(vn2(q3 + e) - n3, vn2(q3 + e.yx) - n3) * .5 * smoothstep(.2, .5, kn);      // n3: one train of fine wavelets, turned off the lattice of the others, only where a pixel can hold it
  // n2: the current's own structure: long slicks of smooth water lying along the banks (they follow the lines of equal distance
  // from the edge and slide downstream), where the sky and the pillars stand mirrored, between ruffled lanes
  float flow = vn2(vec2(w * 1.5 + 2.2 * vn2(p * .21 + 3.), dot(p, vec2(.11, .09)) - uTime * .1));
  float slick = smoothstep(.42, .7, flow);
  gr *= mix(1.15, .3, slick);
  // n2: the animals lie IN the water: a ring of ripples spreads from each sea scorpion's flanks, a V of wake trails behind it
  // while it rows, and its own dark side stands mirrored in the water round it
  // n4 (J): the rings and the wake are drawn FINE: a ring every 14 cm (it was 21), a wake line every 18 cm (it was 29), and
  // the noise that bent their phase by most of a wave (which broke every ring into soft lit patches) now only wanders
  // them by a quarter of one; a wave too fine for the pixel that would hold it is not drawn (fineK, as the wavelets' law)
  float fineK = smoothstep(.2, .45, kn);
  vec2 wg = vec2(0.); float hull = 0., crest = 0.;
  for (int i = 0; i < 3; i++) {
    vec4 sp = uSea[i]; float sc = max(uSeaK[i].x, .1), sw = uSeaK[i].y;
    vec2 d = p - sp.xy; float al = dot(d, sp.zw), ac = d.x * sp.w - d.y * sp.z;
    float t = clamp(al, -.8 * sc, .85 * sc); vec2 rl = vec2(al - t, ac); float dd = length(rl), dh = dd - .19 * sc + (vn2(p * 3.1 + uTime * .2) - .5) * .16;
    vec2 rdir = (sp.zw * rl.x + vec2(sp.w, -sp.z) * rl.y) / max(dd, 1e-3);
    float wob = .6 + .8 * vn2(p * 2.6 + uTime * vec2(.3, -.2));
    float ring = exp(-max(dh, 0.) * 2.4) * smoothstep(.0, .1, dh) * (.45 + .55 * sw) * wob;
    float ph = (dd - .19 * sc) * 44. - uTime * 6.5 + 1.5 * vn2(p * 1.7);
    wg += rdir * cos(ph) * ring * .34 * fineK; crest += smoothstep(.8, 1., sin(ph)) * ring * .22 * fineK;
    float back = max(-al - .2 * sc, 0.), arm = abs(ac) - back * .34 - .16 * sc;
    float vee = exp(-arm * arm / (.012 + .05 * back)) * (1. - exp(-back * 3.)) * exp(-back * .62) * sw * wob;
    float ph2 = arm * 35. + back * 3. - uTime * 4. + 1.5 * vn2(p * 1.3 + 5.);
    wg += vec2(sp.w, -sp.z) * (ac < 0. ? -1. : 1.) * cos(ph2) * vee * .5 * fineK; crest += smoothstep(.6, 1., sin(ph2)) * vee * .6 * fineK;
    hull = max(hull, 1. - smoothstep(-.1 * sc, .34 * sc, dh));
  }
  // k1b: the fallen pillar lies in the stream: the current piles against it, curls round it in standing ripples and slides
  // under it dark
  { vec2 la = uLog.xy, lab = uLog.zw - la; float lt = clamp(dot(p - la, lab) / max(dot(lab, lab), 1e-4), 0., 1.);
    vec2 ld = p - (la + lab * lt); float dl = length(ld), dh = dl - .46;
    float lip = exp(-max(dh, 0.) * 2.0) * smoothstep(-.05, .08, dh);
    float lph = dh * 22. - uTime * 3.4 + 3. * vn2(p * 1.9 + uTime * .15);
    wg += ld / max(dl, 1e-3) * cos(lph) * lip * .45; crest += smoothstep(.5, 1., sin(lph)) * lip * .55;
    hull = max(hull, (1. - smoothstep(-.1, .55, dh)) * .95); }
  // k1: while the fog lasts a fine drizzle falls: rings spread where the drops strike (two sizes of cell, each ring born, widening, gone)
  float rain = clamp(uRain, 0., 1.) * smoothstep(.12, .6, kn + .25);
  if (rain > .01) {
    for (int i = 0; i < 2; i++) {
      float sc = i == 0 ? .95 : 1.7; vec2 cp = mat2(.8, .6, -.6, .8) * p * sc + float(i) * 17.3, ci = floor(cp), cf = fract(cp) - .5;      // n3: rings a hand to two feet across (they were too fine to see from the lens's height)
      float hh = h21(ci + 3.7), life = fract(uTime * (.55 + .3 * hh) + hh * 9.);
      vec2 o = (vec2(h21(ci + floor(uTime * (.55 + .3 * hh) + hh * 9.) * 7.1), h21(ci + floor(uTime * (.55 + .3 * hh) + hh * 9.) * 3.3 + 5.)) - .5) * .5;
      vec2 dv = cf - o; float dl = length(dv), rr = .04 + .34 * life;
      float band = exp(-(dl - rr) * (dl - rr) * 420.) * (1. - life) * (1. - life) * step(.3, hh);
      wg += dv / max(dl, 1e-3) * band * sin((dl - rr) * 40.) * .8 * rain; crest += band * .9 * rain;
    }
  }
  gr += wg;
  vec3 N = normalize(vec3(-gr.x * (.2 + .6 * k), 1., -gr.y * (.2 + .6 * k)));
  float ndv = max(dot(N, V), 0.), f = 1. - ndv, f2 = f * f, F = .03 + .97 * f2 * f2 * f;
  float shallow = smoothstep(-1.1, -.05, w);                                   // the water thins to nothing at its edge
  F = max(F, .2 + .26 * smoothstep(5., 26., dist));                                 // far braids keep a sheen of sky
  F *= 1. - .5 * shallow;
  vec3 R = reflect(-V, N); R.y = abs(R.y) + .02; R = normalize(R);
  vec3 refl = skyCol(normalize(vec3(R.x, R.y * 1.6 + .16 * uClear, R.z)), 0.) * mix(1., .8, uClear);      // the upper sky, not the bright horizon
  vec2 Rh = R.xz; float rl = max(length(Rh), 1e-4); vec2 Rn = Rh / rl;
  // what stands in the water: the mountain wall, the nearest pillars (a vertical post each), the bank and its thicket
  float mt = smoothstep(.1, .55, -Rn.x) * (1. - smoothstep(.22, .46, R.y / rl)) * uMtn;
  refl = mix(refl, mix(uRock * .62, uHor, .2 + .45 * (1. - uClear)), mt * .9);
  float pm = 0.;
  for (int i = 0; i < 24; i++) {
    vec4 q = uPil[i]; vec2 dF = q.xy - p; float th = dot(dF, Rh) / (rl * rl);
    float dl = length(dF - Rh * th), y = R.y * th, r = q.w * (1. - .42 * clamp(y / max(q.z, .1), 0., 1.));
    pm = max(pm, step(0., th) * (1. - smoothstep(r * .6, r * 1.15 + .012 * max(th, 0.), dl + (n2 - .5) * .25 * r)) * (1. - smoothstep(q.z * .92, q.z * 1.03, y)));
  }
  vec3 amb = uSky + uFill * .8 + uWarm;
  vec2 sh2 = uSunDir.xz / max(length(uSunDir.xz), 1e-4);
  refl = mix(refl, uBone * (amb * .42 + uSunCol * uSun * .5 * smoothstep(.3, -.5, dot(Rn, sh2))), pm * .92);       // toward the sun we see their shaded faces
  float bank = smoothstep(-2.7, -.15, w + (n1 - .5) * .8) * smoothstep(.72, .96, f);
  refl = mix(refl, vec3(.075, .09, .045) * (amb + uSunCol * uSun * .3), bank * .85);      // the sward of both banks stands mirrored along the water's edges
  refl *= clamp(1. + dot(gr, sh2) * 2.2 * (.12 + .88 * k), .8, 1.25);
  refl += (uSky * .9 + uSunCol * uSun * .35) * min(crest, 1.5) * .5;                // sky on the crests of its ripples
  // n3: the glitter.  It was the sharp sun lobe on the finest value-noise wavelets (a lattice: each cell flashed whole, as a
  // square flake).  Now the sun's road is a soft streak laid on the slow swell alone, and on it lie points of light: one spark
  // to a cell of a grid sized to the pixel (sparkle()), so the glints are fine at every distance and never square.
  vec3 Ns = normalize(vec3(-gr0.x * (.2 + .6 * k), 1., -gr0.y * (.2 + .6 * k))); vec3 Rs = reflect(-V, Ns); Rs.y = abs(Rs.y) + .02; Rs /= max(length(Rs), 1e-4);
  float sd = max(dot(Rs, uSunDir), 0.);
  float spk = sparkle(p, px, uTime), spark = clamp(spk * 1.6, 0., 1.);
  vec3 glint = uSunCol * uSun * uGlint * (exp((sd - 1.) * 40.) * (.5 + 3.4 * spk) + exp((sd - 1.) * 9.) * (.05 + 1.2 * spk));

  vec2 vh = -V.xz / max(length(V.xz), 1e-4);
  float lane = smoothstep(.5, .97, dot(vh, sh2));
  glint += uSunCol * uSun * uGlint * spk * (.6 * smoothstep(.6, .95, dot(vh, sh2)) * (.25 + .75 * k) * (1. - .7 * slick) + lane * lane * 1.4 * smoothstep(5., 16., dist));      // twinkles on the sun's side
  // n4 (J): THE SUN'S ROAD IS THE SKY'S OWN GLOW, MIRRORED.  The round's own terms were switched by (1 - uClear): a soft
  // glittering path and a gold road that the clearing air put out.  Now the water mirrors the lobe of the glow the sky
  // function itself draws round the sun (sunLobe: fog's and clear sky's, mixed as the sky mixes them), once on the slow
  // swell (a soft path, twinkling) and once on every ripple (the road, broken into lit facets); no factor of its own.
  // Where an animal, the trunk or the rain stirs the water (stir) the facets are too steep and too small to hold a slab
  // of gold: there the road is carried by the points of the glitter alone, so rings and wake stay crisp lines and sparks.
  float stir = clamp(length(wg) * 4., 0., 1.);
  glint += sunLobe(Rs) * .36 * mix(.3, 1.7, spark) * (1. - .5 * slick);
  { float kk = 1.1 + 1.5 * k; vec3 Ng = normalize(vec3(-gr.x * kk, 1., -gr.y * kk)); vec3 Rg = reflect(-V, Ng); Rg.y = abs(Rg.y) + .02; Rg /= max(length(Rg), 1e-4);
    float azs = max(dot(vh, sh2), 0.);
    float chop = smoothstep(.3, .78, n2 * .5 + n3 * .3 + n1 * .25);
    glint += sunLobe(Rg) * vec3(1.08, .88, .56) * smoothstep(.7, .985, azs) * mix(.2, 2.0, chop) * (1. - .4 * slick) * .44 * mix(1., .12 + 2.6 * spark, stir); }
  glint *= 1. - .6 * shallow;
  float deep = (1. - smoothstep(-2.6, 0., w));
  vec3 body = mix(vec3(.04, .055, .04), vec3(.085, .09, .05), shallow) * (amb + uSunCol * uSun * .4) * 1.5;      // the water's own colour: dark, clear, a little tea-green, paler over the shelving edge
  float ab = (.5 + .42 * deep) * (1. - .75 * shallow) * mix(.45, 1., smoothstep(1.2, 5., dist)) * mix(.5, 1., smoothstep(.3, .85, f));     // under the lens, and wherever we look down into it, it is clear to the bed and what swims over it
  float alpha = ab + (1. - ab) * F;
  vec3 col = (refl * F + glint + body * ab * (1. - F)) * (1. - .38 * hull * hull);      // n2: the water is darker close round an animal lying in it (its flank mirrored, its shade on the bed): no edge
  col += refl * smoothstep(.0, .1, w + .14) * (1. - smoothstep(.1, .2, w + .14)) * .08;       // a bright wet lip at the edge
  float fg = fogAmount(vFogDepth);
  vec3 fogc = skyCol(normalize(vec3(-V.x, .02, -V.z)), 0.);
  col = mix(col, fogc * alpha, fg);
  gl_FragColor = vec4(col * a0, alpha * a0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 0.5; mesh.name = 'water';
  return mesh;
}

// ------------------------------------------------------------------------------------------------
// The sward, as camera-facing ribbons in the hero's format (position = centre line, aTan = tangent +
// side, aK = half width, 0 stem / 1 tassel, height 0-1, random) so that its own material draws them.
// Psilophyton (forking wiry stems, paired rust tassels), Sawdonia (spiny, croziers at the tips),
// Drepanophycus (bottle-brushes of thorn leaves), Pertica (a metre high, whorls of four, fuzzy balls)
// and a far tuft of a dozen triangles for the country beyond 14 m.
// ------------------------------------------------------------------------------------------------
function ribbonBuilder(height) {
  const pos = [], tan = [], k = [], idx = [];
  const seg = (a, b, wa, wb, kind, rnd, hk = 1) => {
    const t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], l = Math.hypot(t[0], t[1], t[2]) || 1, v = pos.length / 3;
    for (const [q, w] of [[a, wa], [b, wb]]) for (const s of [-1, 1]) { pos.push(q[0], q[1], q[2]); tan.push(t[0] / l, t[1] / l, t[2] / l, s); k.push(w, kind, clamp(q[1] / height, 0, 1.3) * hk, rnd); }
    idx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
  };
  const build = () => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 4));
    g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 4));
    g.setIndex(idx); g.userData.triangles = idx.length / 3;
    return g;
  };
  return { seg, build };
}
const dirOf = (a, tilt) => [Math.cos(a) * Math.sin(tilt), Math.cos(tilt), Math.sin(a) * Math.sin(tilt)];
const along = (p, d, l) => [p[0] + d[0] * l, p[1] + d[1] * l, p[2] + d[2] * l];

function psilophytonLight(rng, tassels = 1) {
  const H = 0.62, B = ribbonBuilder(H);
  for (let s = 0; s < 3; s++) {
    const rnd = rng(), a = rng() * TAU, d0 = dirOf(a, rng.range(0.08, 0.35)), base = [Math.cos(a) * 0.05, -0.03, Math.sin(a) * 0.05];
    const p1 = along(base, d0, H * rng.range(0.4, 0.52)); B.seg(base, p1, 0.008, 0.0065, 0, rnd);
    const fa = rng() * TAU;
    for (const sg of [-1, 1]) {
      const d1 = dirOf(fa + (sg > 0 ? 0 : Math.PI), rng.range(0.35, 0.6)), p2 = along(p1, [d1[0] + d0[0] * 0.5, d1[1], d1[2] + d0[2] * 0.5], H * rng.range(0.22, 0.3));
      B.seg(p1, p2, 0.0062, 0.005, 0, rnd);
      const fb = rng() * TAU;
      for (const s2 of [-1, 1]) {
        const d2 = dirOf(fb + (s2 > 0 ? 0 : Math.PI), rng.range(0.5, 0.95)), p3 = along(p2, d2, H * rng.range(0.13, 0.2));
        B.seg(p2, p3, 0.005, 0.004, 0, rnd);
        if (rng() < tassels) { const L = rng.range(0.055, 0.085) * 1.5, hx = d2[0] * 0.022, hz = d2[2] * 0.022;      // k1b: a pendant: it hangs from just under the down-turned tip and tapers to its free end like a drop (never a spike standing on the tip)
          B.seg([p3[0] + hx, p3[1] - 0.008, p3[2] + hz], [p3[0] + hx + d2[0] * L * 0.2, p3[1] - 0.008 - L, p3[2] + hz + d2[2] * L * 0.2], 0.019, 0.005, 1, rnd); }
      }
    }
  }
  return B.build();
}
function sawdonia(rng) {
  const H = 0.34, B = ribbonBuilder(H / 0.62);            // heights scaled so that it shades darker than Psilophyton
  for (let s = 0; s < 4; s++) {
    const rnd = rng(), a = rng() * TAU, d0 = dirOf(a, rng.range(0.15, 0.5)), base = [Math.cos(a) * 0.06, -0.02, Math.sin(a) * 0.06];
    const p1 = along(base, d0, H * rng.range(0.45, 0.6)); B.seg(base, p1, 0.011, 0.009, 0, rnd, 0.62);
    for (const sg of [-1, 1]) {
      const d1 = dirOf(a + sg * rng.range(0.6, 1.4), rng.range(0.25, 0.6)); let p = p1, d = d1;
      const p2 = along(p, d, H * rng.range(0.3, 0.42)); B.seg(p, p2, 0.009, 0.007, 0, rnd, 0.62); p = p2;
      // the crozier: the tip curls over in three short turns
      for (let c = 0; c < 2; c++) { const cu = 0.9 + c * 1.3, q = [p[0] + (d[0] * Math.cos(cu) + 0) * 0.028, p[1] + Math.cos(cu) * 0.03 - 0.004 * c, p[2] + d[2] * Math.cos(cu) * 0.028 + 0]; B.seg(p, q, 0.007, 0.006, 0.18, rnd, 0.62); p = q; }
    }
  }
  return B.build();
}
function drepanophycus(rng) {
  const H = 0.3, B = ribbonBuilder(0.5);
  for (let s = 0; s < 3; s++) {
    const rnd = rng(), a = rng() * TAU, r = 0.04 + 0.09 * s, base = [Math.cos(a) * r, -0.02, Math.sin(a) * r], d0 = dirOf(a, rng.range(0.03, 0.2)), h = H * rng.range(0.7, 1.1);
    const tip = along(base, d0, h); B.seg(base, tip, 0.0075, 0.005, 0, rnd, 0.8);             // a thin axis; the brush is its thorn leaves
    for (let t = 0; t < 9; t++) { const f = 0.14 + 0.095 * t, q = along(base, d0, h * f), ta = t * 2.4 + rnd * 9, L = 0.03 * (1 - 0.4 * f); B.seg(q, [q[0] + Math.cos(ta) * L, q[1] + L * 0.7, q[2] + Math.sin(ta) * L], 0.0045, 0.0015, 0, rnd, 0.9); }
    if (s === 0) B.seg(base, [base[0] + Math.cos(a + 2) * 0.22, 0.0, base[2] + Math.sin(a + 2) * 0.22], 0.012, 0.01, 0, rnd, 0.3);   // the creeping runner
  }
  return B.build();
}
function pertica(rng) {
  const H = 1.0, B = ribbonBuilder(H), rnd = rng(), top = [rng.range(-0.04, 0.04), H, rng.range(-0.04, 0.04)];
  B.seg([0, -0.03, 0], top, 0.014, 0.007, 0, rnd);
  for (let wl = 0; wl < 5; wl++) {
    const f = 0.28 + 0.15 * wl, y = H * f, a0 = rng() * TAU, len = 0.26 * (1 - 0.5 * f / 1);
    for (let b = 0; b < 4; b++) {
      const a = a0 + b * TAU / 4, c = [top[0] * f, y, top[2] * f], e = [c[0] + Math.cos(a) * len, y + len * 0.55, c[2] + Math.sin(a) * len];
      B.seg(c, e, 0.006, 0.004, 0, rnd);
      B.seg([e[0], e[1] - 0.022, e[2]], [e[0], e[1] + 0.03, e[2]], 0.026, 0.02, 0.8, rnd);       // the fuzzy ball of spore cases
    }
  }
  return B.build();
}
// A patch = a few plants merged (two geometries per kind of patch keep it from repeating).
function mergeRibbons(parts) {
  const pos = [], tan = [], k = [], idx = [];
  for (const { g, x, z, s, ry } of parts) {
    const P = g.attributes.position, T = g.attributes.aTan, K = g.attributes.aK, I = g.index, base = pos.length / 3, c = Math.cos(ry), sn = Math.sin(ry);
    for (let i = 0; i < P.count; i++) {
      const px = P.getX(i) * s, pz = P.getZ(i) * s, tx = T.getX(i), tz = T.getZ(i);
      pos.push(px * c + pz * sn + x, P.getY(i) * s, -px * sn + pz * c + z);
      tan.push(tx * c + tz * sn, T.getY(i), -tx * sn + tz * c, T.getW(i));
      k.push(K.getX(i) * s, K.getY(i), K.getZ(i) * Math.min(s, 1.15), K.getW(i));
    }
    for (let i = 0; i < I.count; i++) idx.push(I.getX(i) + base);
    g.dispose();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aTan', new THREE.Float32BufferAttribute(tan, 4));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 4));
  g.setIndex(idx); g.userData.triangles = idx.length / 3;
  return g;
}

async function makeSward(ctx, E, rng) {
  const { path, map, height, noise, detail, V } = E, group = new THREE.Group(); group.name = 'sward';
  const mat = swardMaterial(E.shared), tas = V.ripe ? 1 : 0.62, dummy = new THREE.Object3D();
  let triangles = 0;
  const band = (x, z) => lerp(3, 11, smoothstep(-0.35, 0.35, noise.fbm2(x * 0.017 + 7, z * 0.017, 2)));
  const blocked = (x, z, r) => { for (const p of E.feet) if (Math.hypot(x - p.x, z - p.z) < p.r + r) return true; return false; };
  // near patches: three or four plants in a square metre
  const nearGeos = [];
  for (let v = 0; v < 3; v++) {
    const parts = [], n = v === 2 ? 3 : 4;
    for (let i = 0; i < n; i++) {
      const kind = v === 2 ? (i === 0 ? 2 : 1) : (i < 3 ? 0 : 1 + (v & 1));
      const g = kind === 0 ? psilophytonLight(rng, tas) : kind === 1 ? sawdonia(rng) : drepanophycus(rng);
      parts.push({ g, x: rng.range(-0.55, 0.55), z: rng.range(-0.55, 0.55), s: rng.range(0.8, 1.25), ry: rng() * TAU });
    }
    nearGeos.push(mergeRibbons(parts));
  }
  await ctx.yield();
  const perticaGeo = pertica(rng);
  // buckets: [geometry, chunk] -> matrices
  const buckets = new Map();
  const put = (geo, key, x, z, s, tiltX = 0, gy = null, R = rng) => {
    const id = geo.uuid + key; let b = buckets.get(id); if (!b) { b = { geo, m: [] }; buckets.set(id, b); }
    dummy.position.set(x, (gy ?? height(x, z)) - 0.01, z); dummy.rotation.set(tiltX, R() * TAU, 0); dummy.scale.setScalar(s); dummy.updateMatrix();
    for (let i = 0; i < 16; i++) b.m.push(dummy.matrix.elements[i]);
  };
  const P = new THREE.Vector3(), T = new THREE.Vector3();
  const wantNear = Math.round(250 * detail * clamp(E.density, 0.85, 1.0)); let made = 0;
  for (let tries = 0; made < wantNear && tries < wantNear * 14; tries++) {
    const s = tries % 3 === 0 ? rng.range(104, 200) : rng.range(-30, 478), t = rng.range(-1, 1), lat = Math.sign(t) * (0.9 + Math.abs(t) * Math.abs(t) * 9.5), keep = rng(), sc = rng.range(0.8, 1.3), vi = rng.int(0, 2);
    path.posAtDist(s, P); path.tangentAtDist(s, T);
    const x = P.x + T.z * lat, z = P.z - T.x * lat, w = map.at(x, z);
    if (tries % 200 === 199) await ctx.yield();
    if (w < 0.3 || w > band(x, z) + (s > 104 && s < 200 ? 3 : 0) || keep > 0.35 + 0.65 * smoothstep(-0.3, 0.2, noise.fbm2(x * 0.11, z * 0.11 + 5, 2)) || blocked(x, z, 0.5)) continue;
    if (Math.hypot(x - E.elder.x, z - E.elder.z) < 9.4) continue;
    if (P.y - height(x, z) < 1.25 && Math.abs(lat) < 1.6) continue;
    put(nearGeos[vi], 'n' + Math.floor((s + 30) / 46), x, z, sc * (1 - 0.3 * smoothstep(-0.3, 1.2, -w + 1.2)), 0, E.ribbonY(s, lat));
    made++;
  }
  await ctx.yield();
  // Pertica: rare, a metre high, only at the water
  const wantP = Math.round(26 * detail); made = 0;
  for (let tries = 0; made < wantP && tries < wantP * 60; tries++) {
    const s = rng.range(0, 470), lat = rng.sign() * rng.range(2.5, 15), sc = rng.range(0.75, 1.05);
    path.posAtDist(s, P); path.tangentAtDist(s, T);
    const x = P.x + T.z * lat, z = P.z - T.x * lat, w = map.at(x, z);
    if (w < 0.25 || w > 1.6 || blocked(x, z, 1.2) || path.distanceTo(x, height(x, z) + 0.9, z) < 2.2) continue;
    put(perticaGeo, 'p' + Math.floor(s / 240), x, z, sc, 0, E.ribbonY(s, lat)); made++;
  }
  await ctx.yield();
  // Drepanophycus has rooted on the fallen pillar's back and flanks (bottle-brushes on creeping runners), thickest toward its
  // broken end.  n4: ten small patches by a rule along the trunk (0.25 m from the break, then ever further apart, none beyond
  // 4.2 m: the bare back beyond is the walker's), each set on the back's own height field within 0.3 m of its ridge, every
  // draw from the stream 'pbt-logplants' (it was makeRng(977): the same on every seed); a patch is no taller than leaves its
  // top 0.62 m under the lens's line at its own station.
  if (E.logBack && E.logBack.has) {
    const lr = E.own('pbt-logplants'), L = E.logBack, parts = [], Q = new THREE.Vector3();
    for (let i = 0; i < 3; i++) parts.push({ g: drepanophycus(lr), x: lr.range(-0.1, 0.1), z: lr.range(-0.1, 0.1), s: lr.range(0.55, 0.8), ry: lr() * TAU });
    const logGeo = mergeRibbons(parts); logGeo.computeBoundingBox(); const gh = Math.max(logGeo.boundingBox.max.y, 0.05);
    for (let i = 0; i < 10; i++) {
      const a = 0.25 + 7.2 * Math.pow(i / 14, 1.5) + lr.range(0, 0.25), lt = L.lat(a) + lr.range(-0.3, 0.3), sc = lr.range(0.7, 1.0);
      L.world(a, lt, Q); if (Q.y < -8) continue;
      path.posAtDist(E.BR.s0 + a, P);
      const ps = Math.min(sc, (P.y - 0.62 - Q.y) / gh); (L.plants ??= []).push({ a, x: Q.x, z: Q.z, top: Q.y - 0.01 + ps * gh, lens: P.y });      // (the list is read by the proofs only)
      put(logGeo, 'log', Q.x, Q.z, ps, 0, Q.y - 0.01, lr);
    }
  }
  const cards = await makeTuftCards(ctx, E, rng, band); group.add(cards.mesh); triangles += cards.triangles;
  // mend 1: the plants of arm's reach are drawn wherever the renderer's own frustum holds them (as in live): nothing here
  // is switched by the lens's place (the first n4 hid each stretch of them beyond 100 m of the lens: plants came up in view)
  for (const b of buckets.values()) {
    const n = b.m.length / 16, mesh = new THREE.InstancedMesh(b.geo, mat, n);
    mesh.instanceMatrix.array.set(b.m); mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere();
    group.add(mesh); triangles += n * b.geo.userData.triangles;
  }
  return { object: group, triangles };
}

// ------------------------------------------------------------------------------------------------
// Where the thirty stand.  Returns items for makePillarField (hero-local = world - elder) and the
// list of feet (world) that plants and animals keep clear of.
// ------------------------------------------------------------------------------------------------
// Polish 3: the pillars stand massed in groves along the water (the entry stream, the bar, round the Elder, the avenue, the
// gate), from young stubs to giants 8.8 m high and 1.3 m thick, with broken stumps and clusters of two to four touching.
// Anchors are [path metre, metres to the side (+ = right), height, thickness (0 = by height), top].
const ANCHORS = [
  // the entry stream: both banks
  [15, -8.6, 6.2], [21.5, -6.7, 8.5, 1.25], [30, -9.6, 7.6], [35.5, -6.5, 2.9, 1.15, 'hollow'], [41, -7.3, 8.7, 1.3], [48.5, -5.6, 6.9], [55, -8.2, 7.9, 1.1], [61, -11.5, 5.6],
  [15.5, 7.6, 4.8], [19.5, 9.8, 7.3], [31, 7.1, 8.3, 1.2], [37.5, 9.6, 6.1], [44, 6.7, 7.1], [51.5, 8.6, 8.6, 1.25], [57.5, 6.4, 5.3],
  // the swing over the second stream, beside the fallen one
  [69, -6.6, 7.5], [77, -8.4, 5.7], [79, -3.7, 8.6, 1.3], [84.5, 4.4, 8.2, 1.2], [86, -5.2, 8.3, 1.2], [88.5, 6.2, 7.9], [93, 10, 6.5], [96, -9.5, 6.9],
  // the bar: the weave
  [104, 4.3, 8.5, 1.25], [108.5, -7.2, 6.9], [116, -4.1, 7.7], [120.5, 8.2, 5.5], [133, -4.5, 8.7, 1.3], [139.5, 6.3, 7.1], [146, 3.9, 8.1, 1.15],
  [150.5, -8.2, 6.1], [158, -4.3, 7.3], [163.5, 5.1, 8.6, 1.25], [170, -6.6, 5.9], [176.5, 4.5, 6.7], [181.5, -4.7, 8.1],
  // the curve in on the Elder and the rise
  [192, 5.6, 7.5], [196, -8.4, 7.1], [207, 7.4, 6.3], [211, -5.8, 7.9, 1.15], [222, 5.3, 8.3, 1.2], [227, -10.5, 6.9], [238, 8, 7.2], [262, 7, 7.7], [274, -8.5, 8.2, 1.2], [283, 8.5, 6.8],
  // the avenue: low along its water
  [299, -9, 7.1], [304, 7.2, 8.3, 1.2], [311.5, -10.2, 6.2], [318, 5.6, 7.5], [326, -5.1, 8.5, 1.25], [333, 6.6, 6.7], [338.5, -7.2, 7.9], [345, 4.3, 8.7, 1.3],
  [352, -4.5, 7.3], [358, 9.2, 6.5], [364, -6.2, 8.3, 1.2], [368.5, 4.7, 7.7], [375, -4.1, 8.5, 1.25], [381, 7.2, 6.9], [388, -8.2, 7.5], [394.5, 3.7, 8.7, 1.3],
  // the gate
  [402, -6.7, 7.9], [412, 7.7, 8.3, 1.2], [414.5, -9.8, 6.3], [424, -7.4, 8.5, 1.2], [428.5, 8.7, 7.1], [437, -10.5, 5.9], [439, 11.5, 6.5], [452, -7.7, 8.7, 1.3], [452, 7.7, 8.4, 1.25],
];
// n4 (L, K7; mend 2): what a trunk is drawn with is decided once, at build, by how far its foot stands from the route's
// line: within NEAR_M (8 m) it carries a near mesh that is shown while the lens is within 19 m of it: within arm's length
// (ARM_M, the ring's own half width, 5.5 m) the full one (20 sides, three rows a drum, about 2,100 triangles), from there to
// 8 m one of 16 sides and two rows a drum (about 1,100: mend 2); within MID_M (12 m) its standing mesh has ten sides (no
// trunk that the lens passes within 12 m is ever drawn as a seven-sided prism whose outline steps); beyond, the far
// field's seven sides.  The sizes of each step off the round are in parts (pillarGeometrySteps).
const ARM_M = RING_R, NEAR_M = 8, MID_M = 12;
const SIGHT_ARM = RING_R, SIGHT_RUN = 0.5, GROVE_STEP = 1.8, GROVE_OUT = 4;          // the sight line to the Elder (see layoutPillars): arm's length of the route, and the share of the Elder's height a trunk at arm's length may stand before it
async function layoutPillars(ctx, E, rng) {
  const { path, map, V } = E, ex = E.elder.x, ez = E.elder.z, items = [], feet = [{ x: ex, z: ez, r: 1.2 }];
  for (const y of E.young ?? []) feet.push({ x: ex + y.x, z: ez + y.z, r: 0.45 });
  const posts = [{ x: ex, z: ez, h: 8.8, r: 0.65 }], still = V.rare, P = new THREE.Vector3(), T = new THREE.Vector3();
  const thickOf = (h) => (0.3 + 0.1 * h), tally = { anchors: 0, company: 0, ranks: 0, late: 0, groveMembers: 0, young: 0, elderGrove: 0, far: 0, bridge: 0 };
  // n4: no table of sample poses.  Rules that hold along the whole route, in world metres:
  // (1) clearance: no foot nearer the route's centre line than `clear` (path.nearestXZ, the same at every metre: 3.3 to 3.6 m for
  //     companions and ranks, the anchor's own written distance less 0.3 m for an anchor);
  // (2) THE SIGHT LINE TO THE ELDER (mend 2).  On the flat between the bar's last water (E.sBar) and the Elder's own station
  //     (E.sEld) the Elder stands ahead on the left, and from every eye of that stretch (every 0.5 m of route) a sight line runs
  //     to it.  A trunk STANDS BEFORE THE ELDER at an eye when the two outlines overlap in plan: its foot nearer than the Elder
  //     and within its own half girth, at the thickest it can be dealt, plus the Elder's half width (0.65 m) scaled to the
  //     trunk's distance, of that eye's line.  Two cases, by where the trunk stands in the world:
  //     (a) beyond arm's length of the route (its foot more than SIGHT_ARM from the route's line: 5.5 m, the ring's own radius,
  //         the strip the lens itself flies through): it may stand before the Elder from NO eye.  A trunk deep in the ground the
  //         sight lines sweep moves with the Elder in the view and stays before it; that ground is kept clear of trunks.
  //     (b) within arm's length it crosses the Elder as a near post crosses a far tower for a walker, in two to four metres of
  //         route; it may stand before it for no more than half the Elder's own height of route in a row (SIGHT_RUN x 8.8 m =
  //         4.4 m: where the Elder is close a trunk at arm's length would stand before it for longer, and there the Elder
  //         stands free).  The half was chosen on seeds 1 to 40 at eyes every 0.5 m with the counts written (NOTES.md, Mend 2:
  //         with the whole height 12.7 % of eyes have the Elder wholly behind a trunk, with half 12.1 %; live 13.8 %).
  //     The first n4 laid 8.8 m along each line from the EYE (it emptied the strip at arm's length and left the deep trunks);
  //     mend 1 allowed any trunk a run of 8.8 m (the Elder stood behind a trunk at 22 % of the eyes, in live at 14 %).
  //     A grove whose giant would stand before the Elder by this rule stands on the route's other side or steps out from the
  //     route (see the groves); a far grove drawn into that ground is drawn again; an anchor or a rank trunk it refuses is
  //     stood again across the route from the swept ground (see `late`).
  const reach = E.elderH * SIGHT_RUN, eHalf = E.elderR, EY = [];
  for (let d = E.sBar; d <= E.sEld; d += 0.5) { path.posAtDist(d, P); EY.push(P.x, P.z); }
  const awkward = (x, z, r) => {
    let run = 0, lim = -1;
    for (let i = 0; i < EY.length; i += 2) {
      const qx = EY[i], qz = EY[i + 1], ax = ex - qx, az = ez - qz, al = Math.hypot(ax, az) || 1, vx = x - qx, vz = z - qz, t = (vx * ax + vz * az) / al;
      if (t > 0 && t < al && Math.abs(vx * az - vz * ax) / al < r + eHalf * t / al) {
        if (lim < 0) lim = path.nearestXZ(x, z).dist <= SIGHT_ARM ? reach : 0;
        run += 0.5; if (run > lim) return true;
      } else run = 0;
    }
    return false;
  };
  const late = []; let sight = null;                  // sight: the place the sight-line rule refused last (so the caller can stand the trunk again behind the swept ground)
  // place one: on dry ground, clear of the route and of the others (sep: centre to centre)
  const place = (x, z, o, sep = 2.4, clear = 3.3, R = rng) => {
    if (map.at(x, z) < 0.45 || Math.hypot(x - ex, z - ez) < 2.6) return false;
    if (awkward(x, z, (o.thick ?? thickOf(o.height) * 1.1) * 0.5)) { sight = { x, z }; return false; }      // its half girth at the thickest it can be dealt
    const pd = path.nearestXZ(x, z).dist; if (pd < clear) return false;
    for (const p of feet) if (Math.hypot(x - p.x, z - p.z) < Math.max(sep, p.r)) return false;
    const h = o.height, th = o.thick ?? thickOf(h) * R.range(0.92, 1.1), near = pd < 16;
    // n3 (from k1b): the veils slant away downwind as long thin pennants (they were short rising plumes); the far field trails
    // shorter, fainter ones: the long ones belong to the pillars beside us
    const veil = o.veil ?? (o.top === 'hollow' && h < 4 ? 0 : (still ? R.range(6.5, 9.5) : R.range(7, 11) * 4.6) * clamp(h / 6, 0.35, 1.1));
    items.push({ x: x - ex, z: z - ez, y: -0.07, delay: R(), gain: (pd < 9 ? 1.5 : near ? 1.2 : 0.8) * (h < 4.2 ? 0.4 : 1), ...o, lod: o.lod >= 2 ? o.lod : pd < ARM_M ? 1 : pd < NEAR_M ? 0.5 : pd < MID_M ? 0 : -1, thick: th, veil: near ? veil : veil * 0.45, pd });
    feet.push({ x, z, r: 0.3 + 0.55 * th }); posts.push({ x, z, h, r: th * 0.5 });
    return true;
  };
  const at = (d, lat) => { path.posAtDist(d, P); path.tangentAtDist(d, T); const l = Math.hypot(T.x, T.z) || 1; return [P.x - T.z / l * lat, P.z + T.x / l * lat]; };
  // companions: one to three more standing against an anchor, shorter, some of them touching it
  const company = (x, z, h, n) => {
    for (let k = 0, t = 0; k < n && t < 24; t++) {
      const a = rng() * TAU, r = rng.range(1.0, 2.6), hh = h * rng.range(0.32, 0.86), stump = rng() < 0.22;
      if (place(x + Math.cos(a) * r, z + Math.sin(a) * r, stump ? { height: rng.range(1.2, 2.8), thick: rng.range(0.9, 1.25), top: 'hollow' } : { height: hh }, 0.95, 3.6)) k++;
    }
  };
  place(4.8, -25, { height: 7.4, lod: 2, top: 'slant', thick: 1.12 });                      // the Sentinel
  // n4: THE BRIDGE (B).  The fallen pillar lies along the route from its ringed broken end at the bridge's station (route metre
  // 92) for its 8 m, channel B square under its middle.  Its lean and bow come from a stream of its own and are capped (lean
  // 0.6 to 2.2 degrees: the far end at most 0.31 m off the line; bow -0.15 to 0.25): its height is then fitted to the lens's
  // line in build() (the top of the mesh 0.9 m under it), so no seed can lift its back into the lens.
  const BR = E.BR, bR = E.own('pbt-bridge'), f0 = BR.a.clone(), fallenDir = BR.dir;
  items.push({ x: f0.x - ex, z: f0.z - ez, y: -0.26, height: BRIDGE_L, thick: 1.1, lod: 2, fallen: true, rotY: Math.atan2(-fallenDir[1], fallenDir[0]), lean: bR.range(0.6, 2.2), leanAz: bR.range(0, TAU), curve: bR.range(-0.15, 0.25) });
  for (let k = -1; k <= 9; k++) feet.push({ x: f0.x + fallenDir[0] * k, z: f0.z + fallenDir[1] * k, r: 0.75 });
  // its two giants: one on each bank of B, 4.4 m either side of the route (a giant's own half height: they stand as the posts
  // of the bridge, their feet outside the lens's picture of the trunk), each where a line beside the route first stands a
  // full metre from the water's edge on the water map (the top of the shelving shore): the one at lateral +4.4 on the bank
  // of the approach (searched back from the bridge's middle), the one at lateral -4.4 on the far bank beyond (searched on)
  for (const [sd, h, th] of [[-1, 8.6, 1.3], [1, 8.2, 1.2]]) {
    for (let k = 0; k <= 40; k++) {
      const [x, z] = at(BR.sMid + sd * -0.25 * k, sd * 4.4);
      if (map.at(x, z) >= 1 && place(x, z, { height: h, thick: th, lean: bR.range(2.5, 5.5) }, 2.2, 3.3, bR)) { tally.bridge++; break; }
    }
  }
  let close = null, n = 0, mark = items.length;
  for (const [d, lat, h, th, top] of ANCHORS) {
    let done = false, miss = null;
    for (let k = 0; k < 7 && !done; k++) {
      const [x, z] = at(d, lat + Math.sign(lat) * k * 1.3), o = { height: h, thick: th || undefined, top, lean: h > 8 ? rng.range(2.5, 5.5) : undefined };
      sight = null; done = place(x, z, o, 2.2, Math.min(Math.abs(lat) - 0.3, 6));
      if (!done && sight && !miss) miss = { x, z, o, sep: 2.2, clear: Math.min(Math.abs(lat) - 0.3, 6) };
      if (done) { tally.anchors++; if (d === 412) close = { x, z, h }; company(x, z, h, rng() < 0.6 ? rng.int(1, 2) : 0); }
    }
    if (!done && miss) late.push(miss);                 // an anchor the sight line refused at every try: stood again behind the swept ground, below
    if (++n % 8 === 0) await ctx.yield();
  }
  tally.company = items.length - mark - tally.anchors; mark = items.length;
  // the ranks beside the route: one every few metres on alternate sides, so that from the low lens they overlap and tower
  for (let d = 13, k = 0; d < 457; d += rng.range(4.6, 6.4), k++) {
    const side = k % 2 ? 1 : -1, q = rng(), h = q < 0.45 ? rng.range(7, 8.8) : q < 0.8 ? rng.range(4.4, 7) : q < 0.88 ? rng.range(1.3, 2.9) : rng.range(1, 2.4);
    const o = q >= 0.8 && q < 0.88 ? { height: h, thick: rng.range(0.9, 1.25), top: 'hollow' } : { height: h, thick: h > 8 ? rng.range(1.1, 1.3) : undefined };
    let stood = false, miss = null;
    for (const sd of [side, -side]) { const [x, z] = at(d, sd * rng.range(3.7, 6.4)); sight = null; if (place(x, z, o, 2.7, 3.5)) { stood = true; break; } if (sight && !miss) miss = sight; }
    if (!stood && miss) late.push({ x: miss.x, z: miss.z, o, sep: 2.7, clear: 3.5 });      // refused by the sight line on a side and not stood on the other: it is stood again behind the swept ground, below
    if (k % 12 === 11) await ctx.yield();
  }
  tally.ranks = items.length - mark; mark = items.length;
  // n4: THE GROVES (A).  One series over the whole land route, by distance along it, from a stream of its own ('pbt-groves'):
  // the first station lies one look-ahead (the lens rests its gaze 18 m down the route) before the place where the route
  // leaves the entry stream's water (found on the water map), plus a draw over one mean step (0 to 22 m: every place of the
  // land is as likely as any other to carry a grove); then one every 13 to 31 m (22 m in the mean, the wide band so that no
  // beat can be counted), as far as the ring's approach: twice the ring's own width (4 x 5.5 m) short of the last pair of
  // live's anchors, which frame the ring.  A grove is a giant with seven against it (live's own table of members), its centre
  // 5.5 to 8 m off the route, two in three on the sun's side.  It stands only where the land allows:
  //   its centre at least 2.5 m from a channel's bank (the giant and the three against it then stand on dry gravel);
  //   in the avenue (from the station where the avenue's stream begins) outside the ranks: the ranks stand to 6.4 m off the
  //     route, so there a centre lies that much further out;
  //   no nearer the Elder than its own ground (7 m) and half a grove (3.6 m): the Elder stands alone;
  //   no trunk in the ring's cylinder: within 5.5 m of the route from where the route has reached the ring's height to the ring;
  //   not where its giant would stand before the Elder by the sight line's rule (mend 2); a member the sight line refuses
  //     is not stood (the grove has one fewer).
  // The sunward side is tried first, then the other.  Where neither allows at the grove's own distance, the grove steps
  // OUT from the route a quarter of its own width at a time (GROVE_STEP 1.8 m), either side again at each step, as far as
  // its own width (GROVE_OUT 4 steps, 7.2 m): on the bank the near water lies on one side of the route and the Elder's
  // sight line on the other, and the series would break there for a hundred metres; stepped out, its groves stand
  // across the channel or beyond the sight line's wedge.  Where no step allows, that station has no grove.
  // ON THE BANK (stations between the bar's last water and the Elder) the Elder's side goes first, through all its steps,
  // and only then the other: from the bar the view is turned to the Elder, the bank's groves gather on its side of the
  // route, behind the ground its sight lines sweep, and the channel's far side takes a grove only where that side has
  // no room (it takes the stations past 185 m, where the swept ground is wider than a grove may step).
  const groves = [];
  { const sx = -Math.sin(25 * D2R), sz = -Math.cos(25 * D2R), A = new THREE.Vector3(), gr = E.own('pbt-groves');
    let sLand = 0; for (let d = 0; d < path.length; d += 0.5) { path.posAtDist(d, P); if (map.at(P.x, P.z) > 0) { sLand = d; break; } }
    let sLevel = path.length; for (let d = path.length; d > 0; d -= 0.5) { path.posAtDist(d, P); if (P.y < RING_Y - 0.02) break; sLevel = d; }
    const inRing = (x, z) => { const q = path.nearestXZ(x, z); return q.u * path.length > sLevel && q.dist < RING_R; };
    const sEnd = E.sGate - 4 * RING_R, mem = [[0, 0, 1, 1.3], [1.5, 0.9, 0.84, 0], [-1.3, 1.7, 0.68, 0], [0.5, -1.9, 0.52, 0], [2.7, -0.7, 0, 1.15, 'hollow'], [-2.3, -1.2, -1, 0], [3.4, 2.4, 0.93, 1.15], [-3.6, 0.8, 0.42, 0]];
    for (let d = sLand - E.lookAhead + gr.range(0, 22), k = 0; d < sEnd; d += gr.range(13, 31), k++) {
      const pref = k % 3 === 2 ? -1 : 1, la = gr.range(5.5, 8) + (d >= E.sAve ? 6.4 : 0), h0 = gr.range(7.6, 8.8);
      if (d < 0) continue;
      path.posAtDist(d, P); path.posAtDist(Math.min(d + 6, path.length), A).sub(P); A.y = 0; A.normalize();
      const dx = A.x, dz = A.z, px = -dz, pz = dx, sun = (px * sx + pz * sz >= 0 ? 1 : -1) * pref;
      const eld = (ex - P.x) * px + (ez - P.z) * pz >= 0 ? 1 : -1, bank = d > E.sBar && d < E.sEld, tries = [];
      if (bank) { for (const sg of [eld, -eld]) for (let out = 0; out <= GROVE_OUT; out++) tries.push([sg, out]); }
      else for (let out = 0; out <= GROVE_OUT; out++) for (const sg of [sun, -sun]) tries.push([sg, out]);
      for (const [sg, out] of tries) {
        const lo = la + out * GROVE_STEP, cx = P.x + px * sg * lo, cz = P.z + pz * sg * lo, before = items.length; let giant = null;
        if (map.at(cx, cz) < 2.5 || Math.hypot(cx - ex, cz - ez) < 10.6 || inRing(cx, cz) || awkward(cx, cz, 0.65)) continue;
        if (out && Math.abs(path.nearestXZ(cx, cz).dist - lo) > GROVE_STEP) continue;      // stepped out past a bend of the route it would stand beside another stretch of it
        for (const [a, b, hk, th, top] of mem) {
          const jx = gr.range(-0.3, 0.3), jz = gr.range(-0.3, 0.3), h = hk > 0 ? h0 * hk : hk < 0 ? 1.6 : 2.3;
          const x = cx + dx * (a + jx) + px * sg * (b + jz + 0.6), z = cz + dz * (a + jx) + pz * sg * (b + jz + 0.6), o = { height: h, thick: th || undefined, top };
          if (inRing(x, z)) continue;
          const ok = place(x, z, o, 0.95, 3.4, gr);
          if (ok && (!giant || h > giant.height)) giant = items[items.length - 1];      // the tallest of the grove as it stands (the look at a grove aims at its top)
        }
        if (items.length > before) { groves.push({ d, x: cx, z: cz, h: h0, side: sg, out, members: items.length - before, giant }); tally.groveMembers += items.length - before; break; }
      }
      if (k % 4 === 3) await ctx.yield();
    }
    await ctx.yield(); }
  mark = items.length;
  // the young ones: five pale thumbs one to two metres high, in a huddle beside the route on the bar
  for (const [fa, la, h] of [[0, -4.2, 1.9], [1.5, -5.6, 1.25], [-1.3, -5.9, 2.25], [2.9, -4.0, 1.05], [0.5, -7.4, 1.6]]) {
    const [x, z] = at(126 + fa, la); place(x, z, { height: h, lod: 1, veil: still ? 2.5 : 3.5, delay: 0.3 + 0.1 * fa, gain: 0.5 }, 0.9, 3.2);
  }
  tally.young = items.length - mark; mark = items.length;
  // round the Elder: its own grove on the far side from the pass
  path.posAtDist(250, P);
  { const ax = ex - P.x, az = ez - P.z, l = Math.hypot(ax, az) || 1, ux = ax / l, uz = az / l;
    for (const [f, sd, h, th] of [[4.6, -3.8, 7.2, 0], [7.5, 2.6, 8.0, 1.15], [3.2, 5.4, 5.4, 0], [9.6, -2.2, 6.4, 0], [6.0, -8.2, 7.6, 0], [11.5, 6, 7.0, 0], [5.4, 9.6, 3.0, 1.1]])
      place(ex + ux * f - uz * sd, ez + uz * f + ux * sd, { height: h, thick: th || undefined, top: h < 3.5 ? 'hollow' : undefined }, 1.6, 6.5); }
  tally.elderGrove = items.length - mark; mark = items.length;
  await ctx.yield();
  // behind the ring and out over the plain: groves of three to six, to the horizon
  const total = clamp(Math.round(V.pillars), 24, 36), want = Math.round(lerp(18, 25, (total - 24) / 12)); let made = 0;      // polish 4: more groves out over the plain: from the rise the field is massed to the mountain foot
  for (let tries = 0; made < want && tries < 900; tries++) {
    const d = rng.range(-10, 500), sd = rng.sign(), lat = sd * (13 + 62 * rng() * rng()), k = rng.int(3, 6), h0 = rng.range(5.6, 8.6);
    const [cx, cz] = d > 462 ? [at(459, lat)[0] - (d - 459), at(459, lat)[1]] : at(d, lat);
    if (tries % 30 === 29) await ctx.yield();
    if (map.at(cx, cz) < 1.2 || map.at(cx, cz) > 16 || path.nearestXZ(cx, cz).dist < 11 || awkward(cx, cz, 0.65)) continue;      // (mend 2: a far grove drawn into the ground the Elder's sight lines sweep is drawn again)
    let ok = true; for (const p of feet) if (Math.hypot(cx - p.x, cz - p.z) < 9) { ok = false; break; }
    if (!ok) continue;
    for (let j = 0; j < k; j++) { const a = rng() * TAU, r = j ? rng.range(1.1, 5.5) : 0; place(cx + Math.cos(a) * r, cz + Math.sin(a) * r, { height: j ? h0 * rng.range(0.3, 0.95) : h0 }, 1.0, 10.5); }
    made++;
  }
  tally.far = items.length - mark; tally.farGroves = made; mark = items.length;
  await ctx.yield();
  // n4 (E, mend 2): an anchor or a rank trunk the sight line refused is stood again JUST BEHIND THE SWEPT GROUND: every
  // sight line starts on the route, so the ground across the route's line is behind every eye's line.  It stands at the same
  // station and the same distance from the route on the other side, or as little further out as the land and its
  // neighbours allow (a quarter metre at a time, four metres at most); its own draws come from 'pbt-late'.  (Mend 1 stood
  // them again toward the route, at arm's length on the Elder's side: one more trunk to cross the Elder each.)
  { const lr = E.own('pbt-late');
    for (const q of late) {
      const nu = path.nearestXZ(q.x, q.z).u; path.posAtDist(nu * path.length, P);
      const ox = P.x - q.x, oz = P.z - q.z, ol = Math.hypot(ox, oz) || 1, far = Math.max(ol, q.clear + 0.05);
      for (let k = 0; k <= 16; k++) if (place(P.x + ox / ol * (far + 0.25 * k), P.z + oz / ol * (far + 0.25 * k), q.o, q.sep, q.clear, lr)) break;
    } }
  tally.late = items.length - mark; tally.refused = late.length; tally.trunks = items.length - 1; tally.groves = groves.length;
  return { items, feet, fallen: f0, fallenDir, posts, close, groves, tally };
}

// ------------------------------------------------------------------------------------------------
// A small mesh builder for the animals: lofted rings, jointed tubes and flat plates, with linear
// vertex colours and a per-vertex part record aPart = (part id, pivot x, pivot y, pivot z).
// ------------------------------------------------------------------------------------------------
function Mesher() {
  const pos = [], col = [], part = [], idx = []; let cur = [0, 0, 0, 0];
  const M = {
    part(id, px = 0, py = 0, pz = 0) { cur = [id, px, py, pz]; },
    v(p, c) { pos.push(p[0], p[1], p[2]); col.push(c.r, c.g, c.b); part.push(cur[0], cur[1], cur[2], cur[3]); return pos.length / 3 - 1; },
    tri(a, b, c) { idx.push(a, b, c); },
    // rings: [{ pts: [[x,y,z]...], cols: [Color...] }] all with the same count; closed round
    loft(rings, capA, capB) {
      const n = rings[0].pts.length, base = [];
      for (const r of rings) { base.push(pos.length / 3); r.pts.forEach((p, i) => M.v(p, r.cols[i] ?? r.cols[0])); }
      for (let k = 0; k < rings.length - 1; k++) for (let i = 0; i < n; i++) { const a = base[k] + i, b = base[k] + (i + 1) % n, c = base[k + 1] + i, d = base[k + 1] + (i + 1) % n; idx.push(a, c, b, b, c, d); }
      const cap = (r, b0, flip) => { const m = r.pts.reduce((s, p) => [s[0] + p[0] / n, s[1] + p[1] / n, s[2] + p[2] / n], [0, 0, 0]), ci = M.v(m, r.cols[0]); for (let i = 0; i < n; i++) flip ? idx.push(ci, b0 + (i + 1) % n, b0 + i) : idx.push(ci, b0 + i, b0 + (i + 1) % n); };
      if (capA) cap(rings[0], base[0], false);
      if (capB) cap(rings[rings.length - 1], base[rings.length - 1], true);
    },
    // a jointed limb: points with radii, round section of `sides`
    tube(pts, radii, sides, c, flat = 1) {
      const rings = [];
      for (let k = 0; k < pts.length; k++) {
        const a = pts[Math.max(k - 1, 0)], b = pts[Math.min(k + 1, pts.length - 1)], t = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
        const up = Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0), s = new THREE.Vector3().crossVectors(t, up).normalize(), u2 = new THREE.Vector3().crossVectors(s, t);
        const ring = [];
        for (let i = 0; i < sides; i++) { const an = i / sides * TAU, cx = Math.cos(an) * radii[k], cy = Math.sin(an) * radii[k] * flat; ring.push([pts[k][0] + s.x * cx + u2.x * cy, pts[k][1] + s.y * cx + u2.y * cy, pts[k][2] + s.z * cx + u2.z * cy]); }
        rings.push({ pts: ring, cols: [c] });
      }
      M.loft(rings, true, true);
    },
    plate(pts, c) { const b = pts.map((p) => M.v(p, c)); for (let i = 1; i < b.length - 1; i++) idx.push(b[0], b[i], b[i + 1]); },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 4));
      g.setIndex(idx); g.computeVertexNormals(); g.userData.triangles = idx.length / 3;
      return g;
    },
  };
  return M;
}
// a flat-bellied ring at z: half width hw, back height top, belly depth bot, `tri` 0 dome .. 1 ridge
function bodyRing(z, hw, top, bot, n, tri, cTop, cBelly, y0 = 0) {
  const pts = [], cols = [];
  for (let i = 0; i < n; i++) {
    const a = i / n * TAU, c = Math.cos(a), s = Math.sin(a);
    const y = s >= 0 ? top * lerp(Math.pow(s, 0.75), 1 - Math.abs(c), tri) : bot * s;
    pts.push([hw * c, y0 + y, z]); cols.push(s > 0.12 ? cTop : cBelly);
  }
  return { pts, cols };
}

// ------------------------------------------------------------------------------------------------
// Cephalaspids: jawless armoured fish a hand long.  A flat horseshoe head shield with a backswept
// horn at each rear corner, two eyes close together on top with a pale spot between, a body
// triangular in section, one small back fin, flap fins behind the horns, upper tail lobe the longer.
// They grub nose-down in the gravel and fan away from the sea scorpion (uScare).
// ------------------------------------------------------------------------------------------------
function cephalaspidGeometry() {
  const M = Mesher(), shield = new THREE.Color('#4a3820'), rim = new THREE.Color('#b59a5c'), dark = new THREE.Color('#2c2216'), belly = new THREE.Color('#D8CDB0'), body = new THREE.Color('#947d50'), fin = new THREE.Color('#a8935f');
  // the head shield: a low dome with a flat brim, so that from above it is a broad horseshoe with a pale edge
  const S = (z, hw, top) => {
    const pts = [], cols = [], n = 10;
    for (let i = 0; i < n; i++) { const a = i / n * TAU, c = Math.cos(a), sn = Math.sin(a); pts.push([hw * c, sn >= 0 ? top * Math.pow(sn, 1.7) + 0.003 * sn : 0.004 * sn, z]); cols.push(sn < -0.1 ? belly : Math.abs(c) > 0.8 ? rim : shield); }
    return { pts, cols };
  };
  const R = (z, hw, top, tri, c) => bodyRing(z, hw, top, 0.004, 10, tri, c, belly);
  M.loft([S(0.125, 0.004, 0.002), S(0.12, 0.03, 0.008), S(0.108, 0.048, 0.014), S(0.09, 0.061, 0.019), S(0.068, 0.068, 0.023), S(0.046, 0.071, 0.026), S(0.039, 0.052, 0.028),
    R(0.036, 0.027, 0.03, 0.45, shield), R(0.02, 0.022, 0.03, 0.85, body), R(-0.02, 0.018, 0.027, 1, body), R(-0.06, 0.012, 0.021, 1, body), R(-0.095, 0.006, 0.013, 1, body), R(-0.11, 0.003, 0.007, 1, dark)], true, true);
  const eye = new THREE.Color('#080705');
  for (const s of [-1, 1]) {
    M.plate([[s * 0.054, 0.009, 0.058], [s * 0.071, 0.007, 0.046], [s * 0.093, 0.004, -0.03], [s * 0.074, 0.005, -0.004], [s * 0.05, 0.009, 0.032]], shield);    // the backswept horn at the rear corner
    M.plate([[s * 0.03, 0.006, 0.036], [s * 0.052, 0.003, 0.008], [s * 0.03, 0.004, -0.002]], fin);                                    // the flap fin behind it
    M.plate([[s * 0.0125, 0.0215, 0.094], [s * 0.005, 0.0225, 0.086], [s * 0.0125, 0.0235, 0.078], [s * 0.02, 0.022, 0.086]], eye);    // eyes close together on top
  }
  M.plate([[0, 0.0235, 0.092], [-0.0035, 0.0238, 0.087], [0, 0.024, 0.082], [0.0035, 0.0238, 0.087]], new THREE.Color('#efe4c0'));        // the pale spot between them
  M.plate([[0, 0.028, -0.032], [0, 0.037, -0.056], [0, 0.022, -0.066]], fin);                                                         // one small back fin
  M.plate([[0, 0.011, -0.1], [0, 0.036, -0.142], [0, 0.011, -0.123], [0, -0.003, -0.127], [0, 0.0, -0.104]], fin);                    // tail, upper lobe longer
  const g = M.build(), P = g.attributes.position, bend = new Float32Array(P.count);
  for (let i = 0; i < P.count; i++) bend[i] = clamp((0.03 - P.getZ(i)) / 0.17, 0, 1);
  g.setAttribute('aBend', new THREE.BufferAttribute(bend, 1));
  return g;
}

function makeFish(E, rng, spots) {
  const geo = cephalaspidGeometry(), n = spots.length;
  const A = new Float32Array(n * 4), B = new Float32Array(n * 4);
  spots.forEach((s, i) => { A.set([s.x, s.z, s.y, s.r], i * 4); B.set([rng(), s.big ? rng.range(1.95, 2.45) : rng.range(1.0, 1.4), rng.sign(), rng.range(0.6, 1.4)], i * 4); });
  const ig = new THREE.InstancedBufferGeometry(); ig.index = geo.index;
  for (const k of ['position', 'normal', 'color', 'aBend']) ig.setAttribute(k, geo.attributes[k]);
  ig.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); ig.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4));
  ig.instanceCount = n;
  const FISH_POSE = /* glsl */`
uniform float uTime; uniform vec3 uScare;
attribute vec4 iA, iB;
void fishPose(out vec2 pos, out vec2 hd, out float sc){
  float t = uTime * iB.w * .2 * iB.z + iB.x * 6.283;
  pos = iA.xy + iA.w * vec2(cos(t), sin(t));
  hd = vec2(-sin(t), cos(t)) * iB.z;
  vec2 away = pos - uScare.xy; float d = length(away); away /= max(d, 1e-3);
  sc = uScare.z * (1. - smoothstep(.7, 3.4, d));
  pos += away * sc * 1.7;
  hd = mix(hd, away, min(sc * 1.4, .92)); hd /= max(length(hd), 1e-3);
}`;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...E.U }, fog: true, side: THREE.DoubleSide, transparent: true,
    vertexShader: /* glsl */`
attribute vec3 color; attribute float aBend;
varying vec3 vCol, vN, vWp, vLp;
#include <fog_pars_vertex>
${FISH_POSE}
void main(){
  vec2 pos, hd; float sc; fishPose(pos, hd, sc);
  float burst = max(smoothstep(.1, .7, sin(uTime * .9 + iB.x * 40.)), sc);
  vec3 p = position * iB.y, n = normal;
  float bend = aBend * aBend;
  p.x += sin(uTime * 18.85 - aBend * 3.4 + iB.x * 30.) * .034 * bend * (.25 + .75 * burst) * iB.y;
  float pitch = .2 * (1. - sc) * (.55 + .45 * sin(uTime * 1.3 + iB.x * 20.));
  float cp = cos(pitch), sp = sin(pitch);
  p.yz = vec2(p.y * cp - p.z * sp, p.z * cp + p.y * sp); n.yz = vec2(n.y * cp - n.z * sp, n.z * cp + n.y * sp);
  p.y += (.03 + sp * .125) * iB.y + sc * .07;
  vec3 rt = vec3(-hd.y, 0., hd.x), fw = vec3(hd.x, 0., hd.y);
  vec3 wp = vec3(pos.x, iA.z, pos.y) + rt * p.x + vec3(0., p.y, 0.) + fw * p.z;
  vN = rt * n.x + vec3(0., n.y, 0.) + fw * n.z; vCol = color; vWp = wp; vLp = position;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSunDir, uSunCol, uSky, uFill, uWarm; uniform float uSun, uTime;
varying vec3 vCol, vN, vWp, vLp;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
  float top = smoothstep(-.1, .5, N.y);
  float spk = smoothstep(.58, .78, vn2(vLp.xz * 210.)) * step(.04, vLp.z);                     // ochre speckle on the shield
  float rows = .78 + .22 * smoothstep(-.3, .3, sin(vLp.z * 520.)) ;                          // vertical rows of scales behind it
  vec3 alb = mix(vCol, vec3(.62, .43, .17), spk * .75 * top) * mix(1., rows, step(vLp.z, .04));
  alb *= mix(.75, 1., top);
  vec2 cq = vWp.xz * 2.1 + vec2(uTime * .13, uTime * .31);
  float caus = 1. - smoothstep(0., .11, abs(vn2(cq) - .5));
  vec3 col = alb * (uSunCol * uSun * (max(dot(N, uSunDir), 0.) * .8 + caus * .5 * top) + mix(uFill, uSky, .5 + .5 * N.y) * 1.1 + uWarm * (.5 + .3 * caus * top));
  col *= vec3(.9, .95, .86);
  gl_FragColor = vec4(col, .86);
  #include <fog_fragment>
}`,
  });
  const mesh = new THREE.Mesh(ig, mat); mesh.frustumCulled = false; mesh.name = 'cephalaspids'; mesh.renderOrder = 0.6;      // drawn after the water: the shallows are clear to the bed
  // the silt each one raises where its nose works the gravel
  const qg = new THREE.InstancedBufferGeometry(); qg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); qg.setIndex([0, 2, 1, 0, 3, 2]);
  qg.setAttribute('iA', ig.attributes.iA); qg.setAttribute('iB', ig.attributes.iB); qg.instanceCount = n;
  const puff = new THREE.Mesh(qg, new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...E.U }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
varying vec2 vC; varying float vA;
#include <fog_pars_vertex>
${FISH_POSE}
void main(){
  vec2 pos, hd; float sc; fishPose(pos, hd, sc);
  float cyc = fract(uTime * .35 + iB.x * 7.), sz = (.07 + .2 * cyc) * iB.y;
  vec2 c = pos + hd * (.1 * iB.y - cyc * .06);
  vec3 wp = vec3(c.x, iA.z + .03 + cyc * .09, c.y) + position * sz;
  vC = position.xz; vA = (1. - cyc) * smoothstep(0., .15, cyc) * (1. - sc) * smoothstep(.1, .7, sin(uTime * .9 + iB.x * 40.) + .4);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uWarm, uSunCol; uniform float uSun;
varying vec2 vC; varying float vA;
#include <common>
#include <fog_pars_fragment>
void main(){
  float f = clamp(1. - dot(vC, vC), 0., 1.);
  gl_FragColor = vec4(vec3(.5, .42, .3) * (uWarm * 2. + uSunCol * uSun * .5), f * f * vA * .5);
  #include <fog_fragment>
}`,
  }));
  puff.frustumCulled = false; puff.renderOrder = 0.3; puff.name = 'silt';
  return { mesh, puff, triangles: n * geo.userData.triangles };
}

// ------------------------------------------------------------------------------------------------
// Pterygotus, the sea scorpion, 1.7 m (the lead is drawn at 2.2 m, the size of the largest early Devonian pterygotids), riding half awash so that its back,
// claw arms and oar blades break the surface: flat and low; a half-round head shield with oval eyes at its
// front corners, two claw arms held forward ending in toothed pincers, four pairs of thin walking
// legs, one pair of oar paddles, twelve tapering segments and a broad flat tail plate with a keel.
// Parts: 0 body, 1 paddles, 3 legs, 4 claw arms (aPart.yzw = the joint each swings about).
// ------------------------------------------------------------------------------------------------
function pterygotusGeometry() {
  const M = Mesher(), olive = new THREE.Color('#3f4124'), dark = new THREE.Color('#15160b'), pale = new THREE.Color('#77754a'), cream = new THREE.Color('#E1D7B4'), limb = new THREE.Color('#2b2a18'), blade = new THREE.Color('#4a4a2a');
  const R = (z, hw, top, c, tri = 0, bot = 0.02) => bodyRing(z, hw, top, bot, 16, tri, c, cream);
  const head = new THREE.Color('#5d5a33'), rimC = new THREE.Color('#9a9160'), armC = new THREE.Color('#4d4526');
  // the head shield: half-round, smooth, a pale rim all round and a pinched neck behind it
  const rings = [R(0.9, 0.014, 0.006, rimC), R(0.886, 0.078, 0.02, rimC), R(0.86, 0.128, 0.036, head), R(0.82, 0.166, 0.05, head), R(0.77, 0.188, 0.058, head), R(0.71, 0.197, 0.061, head), R(0.655, 0.191, 0.057, head), R(0.628, 0.176, 0.05, rimC), R(0.61, 0.142, 0.046, dark)];
  const z0 = 0.6, segL = 0.096;
  for (let i = 0; i < 12; i++) {
    const hw = i <= 3 ? lerp(0.152, 0.175, i / 3) : lerp(0.175, 0.06, Math.pow((i - 3) / 8, 0.9)), top = lerp(0.056, 0.03, i / 11), bot = lerp(0.024, 0.012, i / 11), za = z0 - i * segL;
    rings.push(R(za - segL * 0.04, hw * 0.93, top * 0.84, dark, 0, bot), R(za - segL * 0.3, hw, top, dark, 0, bot), R(za - segL * 0.5, hw, top * 1.02, olive, 0, bot), R(za - segL * 0.97, hw * 0.99, top * 1.04, pale, 0, bot));
  }
  // the tail plate: a broad rounded paddle with a low keel, no sting
  const T = [[-0.555, 0.052, 0.027, dark, 0.3], [-0.58, 0.08, 0.024, olive, 0.4], [-0.62, 0.104, 0.021, olive, 0.4], [-0.67, 0.118, 0.019, olive, 0.4], [-0.72, 0.12, 0.017, olive, 0.4], [-0.765, 0.11, 0.014, olive, 0.4], [-0.805, 0.088, 0.011, rimC, 0.4], [-0.835, 0.055, 0.008, rimC, 0.4], [-0.85, 0.018, 0.004, rimC, 0.4]];
  for (const [z, hw, top, c, tri] of T) rings.push(R(z, hw, top, c, tri, 0.006));
  M.loft(rings, true, true);
  M.tube([[0, 0.027, -0.57], [0, 0.026, -0.66], [0, 0.021, -0.76], [0, 0.011, -0.838]], [0.004, 0.006, 0.005, 0.002], 5, pale, 0.8);          // the keel: a thin raised line
  const black = new THREE.Color('#050604'), white = new THREE.Color('#fff6dc');
  for (const s of [-1, 1]) {
    M.part(0);
    M.tube([[s * 0.118, 0.04, 0.772], [s * 0.134, 0.064, 0.792], [s * 0.14, 0.066, 0.828], [s * 0.128, 0.046, 0.85]], [0.008, 0.035, 0.035, 0.008], 8, black, 0.7);       // the large oval eye at the shield's front corner
    M.plate([[s * 0.15, 0.084, 0.818], [s * 0.16, 0.079, 0.802], [s * 0.158, 0.078, 0.828]], white);
    // claw arm: stout, three joints, a swollen hand and an open pincer of two toothed fingers as long as the head shield
    M.part(4, s * 0.06, 0.0, 0.86);
    const wr = [s * 0.128, 0.04, 1.16];
    M.tube([[s * 0.06, 0.0, 0.86], [s * 0.135, 0.03, 0.98], [s * 0.122, 0.04, 1.08], wr], [0.03, 0.027, 0.03, 0.046], 6, armC);
    M.tube([wr, [s * 0.186, 0.04, 1.25], [s * 0.196, 0.04, 1.35], [s * 0.158, 0.04, 1.455]], [0.046, 0.036, 0.024, 0.006], 6, dark, 0.6);
    M.tube([wr, [s * 0.07, 0.04, 1.25], [s * 0.062, 0.04, 1.35], [s * 0.104, 0.04, 1.455]], [0.04, 0.03, 0.02, 0.006], 6, armC, 0.6);
    for (let t = 0; t < 5; t++) {
      const f = 0.1 + 0.19 * t, zz = lerp(1.25, 1.43, f), xo = lerp(0.158, 0.15, f), xi = lerp(0.094, 0.11, f);
      M.plate([[s * xo, 0.052, zz - 0.014], [s * xo, 0.052, zz + 0.014], [s * (xo - 0.026), 0.052, zz]], cream);
      M.plate([[s * xi, 0.052, zz - 0.014], [s * xi, 0.052, zz + 0.014], [s * (xi + 0.022), 0.052, zz]], cream);
    }
    // four pairs of walking legs, longer toward the back
    for (let i = 0; i < 4; i++) {
      const zb = 0.78 - i * 0.048, L = 0.22 + 0.047 * i, an = (22 - 21 * i) * D2R, ox = Math.cos(an) * s, oz = Math.sin(an), b = [s * 0.13, -0.008, zb];
      M.part(3, b[0], b[1], b[2]);
      M.tube([b, [b[0] + ox * L * 0.42, 0.034, zb + oz * L * 0.42], [b[0] + ox * L * 0.78, 0.0, zb + oz * L * 0.78], [b[0] + ox * L, -0.06, zb + oz * L]], [0.012, 0.01, 0.008, 0.003], 4, limb);
    }
    // the oar: a short arm and a broad flat blade with a pale rim (a wider cream plate lies just under the dark one)
    M.part(1, s * 0.13, 0.012, 0.6);
    M.tube([[s * 0.13, 0.012, 0.6], [s * 0.21, 0.02, 0.56], [s * 0.275, 0.018, 0.515]], [0.024, 0.02, 0.022], 6, limb);
    const bl = [[s * 0.265, 0.018, 0.52], [s * 0.315, 0.018, 0.47], [s * 0.37, 0.018, 0.405], [s * 0.415, 0.018, 0.345], [s * 0.44, 0.018, 0.3]];
    M.tube(bl, [0.022, 0.08, 0.1, 0.08, 0.016], 8, blade, 0.12);
    M.tube(bl.map((q) => [q[0], q[1] - 0.007, q[2]]), [0.03, 0.094, 0.116, 0.095, 0.026], 8, cream, 0.04);
  }
  return M.build();
}

function scorpionGeometry() {                      // the land scorpion (drawn large, as the big scorpions of the Old Red were): dark glossy amber, on the fallen pillar
  const M = Mesher(), amber = new THREE.Color('#4a2c10'), deep = new THREE.Color('#1c1006'), pale = new THREE.Color('#7a5220');
  const R = (z, hw, top, c) => bodyRing(z, hw, top, 0.003, 8, 0, c, deep, 0.006);
  const rings = [R(0.036, 0.004, 0.003, amber), R(0.03, 0.011, 0.007, amber), R(0.016, 0.013, 0.008, amber)];
  for (let i = 0; i < 7; i++) rings.push(R(0.012 - i * 0.0052, 0.0135 - 0.0007 * i, 0.0085, i % 2 ? amber : deep));
  rings.push(R(-0.024, 0.005, 0.005, deep));
  M.loft(rings, true, true);
  M.tube([[0, 0.009, -0.022], [0, 0.014, -0.04], [0, 0.03, -0.05], [0, 0.046, -0.042], [0, 0.052, -0.024], [0, 0.047, -0.012], [0, 0.038, -0.008]], [0.004, 0.0038, 0.0036, 0.0034, 0.0045, 0.003, 0.0006], 5, amber);   // the tail, curled over the back
  for (const s of [-1, 1]) {
    M.part(4, s * 0.008, 0.008, 0.03);
    M.tube([[s * 0.008, 0.008, 0.03], [s * 0.021, 0.01, 0.042], [s * 0.017, 0.009, 0.057]], [0.0026, 0.0024, 0.0045], 5, amber);
    M.tube([[s * 0.017, 0.009, 0.057], [s * 0.02, 0.009, 0.066], [s * 0.015, 0.009, 0.076]], [0.0042, 0.003, 0.0006], 4, pale);
    M.tube([[s * 0.017, 0.009, 0.057], [s * 0.011, 0.009, 0.066], [s * 0.013, 0.009, 0.076]], [0.003, 0.002, 0.0006], 4, pale);
    for (let i = 0; i < 4; i++) {
      const zb = 0.02 - i * 0.008, dz = (1 - i) * 0.006, b = [s * 0.01, 0.008, zb];
      M.part(3, b[0], b[1], b[2]);
      M.tube([b, [s * 0.022, 0.017, zb + dz], [s * 0.034, 0.0, zb + dz * 1.7]], [0.0016, 0.0014, 0.0007], 4, amber);
    }
  }
  return M.build();
}

function arthropodMaterial(E, o) {
  return new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...E.U, uSwim: { value: 0 }, uBend: { value: 0 }, uPh: { value: 0 }, uFoot: { value: [0, 0, 0, 0, 0, 0, 0, 0] }, uWave: { value: o.wave }, uLeg: { value: new THREE.Vector3(o.legHz, o.legAmp, o.legK) }, uGloss: { value: o.gloss }, uScaleN: { value: o.grain } },
    fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec3 color; attribute vec4 aPart;
uniform float uSwim, uBend, uPh, uWave, uTime, uFoot[8]; uniform vec3 uLeg;
varying vec3 vCol, vN, vWp, vLp;
#include <fog_pars_vertex>
vec3 rotY(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z); }
vec3 rotZ(vec3 v, float a){ float c = cos(a), s = sin(a); return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z); }
void main(){
  vec3 p = position, n = normal, pv = aPart.yzw; float id = aPart.x, s = pv.x < 0. ? -1. : 1.;
  if (id > .5) {
    vec3 q = p - pv; float ay = 0., az = 0.;
    if (id < 2.5) {                                              // the oars: a long pull back with the blade low, a quick return
      ay = (sin(uPh) * .6 + .15) * uSwim + sin(uTime * 2.3 + s) * .12 * (1. - uSwim);
      az = -cos(uPh) * .22 * uSwim;
    } else if (id < 3.5) {                                       // legs: stepping on the bank, trailed when it swims
      float lp = uTime * uLeg.x + pv.z * uLeg.z + s * 1.5708;
      ay = .85 * uSwim + sin(lp) * uLeg.y * (1. - .7 * uSwim);
      az = max(cos(lp), 0.) * uLeg.y * .6 * (1. - uSwim);
    } else { ay = sin(uTime * .7 + s * 1.3) * .07 - .05; }      // claw arms weave slowly
    q = rotZ(rotY(q, s * ay), s * az); n = rotZ(rotY(n, s * ay), s * az);
    p = pv + q;
  }
  float tw = (1. - smoothstep(-.85, .7, p.z));
  p.y += sin(uPh - p.z * 5.5) * uWave * tw * (.12 + .88 * uSwim) + sin(uTime * 1.1) * uWave * .06;
  p.x += uBend * p.z * p.z * .5;
  // n4: an animal on a round, stepped back: each of its eight legs reaches down (or draws up) to the surface under its own
  // foot (uFoot: the tip's way down, least at the hip, all of it at the tip; 0 for the swimmers)
  if (id > 2.5 && id < 3.5) { float k = clamp((abs(p.x) - .01) / .024, 0., 1.); p.y -= uFoot[int(clamp(floor((.02 - pv.z) / .008 + .5), 0., 3.)) + (s > 0. ? 4 : 0)] * k * k; }
  vec4 wp = modelMatrix * vec4(p, 1.);
  vN = mat3(modelMatrix) * n; vCol = color; vWp = wp.xyz; vLp = position;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSunDir, uSunCol, uSky, uFill, uWarm, uFogSun; uniform float uSun, uGloss, uScaleN;
varying vec3 vCol, vN, vWp, vLp;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 V = cameraPosition - vWp; V /= max(length(V), 1e-4);
  float tub = vn2(vLp.xz * uScaleN), fine = vn2(vLp.xz * uScaleN * 3.7 + 9.);
  vec3 alb = vCol * mix(.7, 1.15, tub) * mix(.86, 1.08, fine);
  alb *= 1. - .35 * smoothstep(.72, .9, fine) * step(.3, N.y);                                // tubercles on the back
  float ndl = max(dot(N, uSunDir), 0.);
  vec3 col = alb * (uSunCol * uSun * (ndl + .3 * max(N.y, 0.)) + mix(uFill * 1.1, uSky * 1.25, .5 + .5 * N.y) + uWarm * (.35 + .45 * max(N.y, 0.)));
  vec3 Hv = uSunDir + V; Hv /= max(length(Hv), 1e-3);
  float sp = max(dot(N, Hv), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
  float fres = 1. - max(dot(N, V), 0.); fres *= fres;
  vec3 Hf = uSunDir * vec3(1., .55, 1.) + V; Hf /= max(length(Hf), 1e-3);                    // in fog the glow round the sun still lays a soft wet streak on the shell
  float spB = max(dot(N, Hf), 0.); spB *= spB; spB *= spB; spB *= spB; spB *= spB; spB *= spB; spB *= spB;
  col += uGloss * (uSunCol * uSun * sp * .9 + uFogSun * (fres * .1 * max(N.y + .3, 0.) + spB * .55 * (1. - .6 * uSun)));          // wet shell: a glint and the sky on its back
  col *= mix(vec3(.8, .9, .82), vec3(1.), smoothstep(${(WATER - 0.03).toFixed(2)}, ${(WATER + 0.01).toFixed(2)}, vWp.y));
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`,
  });
}

// ------------------------------------------------------------------------------------------------
// The fog bank: forty soft cards over the middle of the plain that slide off downwind (uBank = slide in
// metres, opacity, wind x, wind z), fading near the lens and toward their edges; a last low shelf in the
// mountain's shade behind the ring; and a rank of ten that fades in downwind of the avenue as the bank
// withdraws (uWall), the low cream wall with a torn sunlit top that stays on our right to the end.
// ------------------------------------------------------------------------------------------------
function makeFogBank(E, rng) {
  const { V, path } = E, n = 86, P = new Float32Array(n * 4), S = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    const shelf = i >= 70 && i < 76, wall = i >= 76;
    let x, z, tries = 0;
    do { x = shelf ? rng.range(-560, -380) : rng.range(-330, 150); z = shelf ? rng.range(-360, -130) : rng.range(-380, 20); } while (!shelf && (path.nearestXZ(x, z).dist < 19 || path.nearestXZ(x, z).dist > (i < 44 ? 62 : 150)) && ++tries < 60);
    const low = V.mood === 'rain';
    P.set([x, shelf ? -1 : -2, z, shelf ? 1 : 0], i * 4);
    S.set([shelf ? rng.range(70, 120) : rng.range(42, 78), shelf ? rng.range(9, 15) : (low ? rng.range(3, 6) : rng.range(4.5, 9)), rng(), shelf ? 0 : rng.range(0.85, 1.2) + smoothstep(-330, -200, z) * 0.35], i * 4);
    // the wall the bank becomes as it withdraws: a rank of ten standing downwind of the avenue (on our right after the turn), held to the end
    if (wall) { P.set([-420 + (i - 76) * 54 + rng.range(-12, 12), -2, -520 + rng.range(-30, 30), 0], i * 4); S.set([rng.range(64, 88), low ? rng.range(11, 15) : rng.range(26, 36), rng(), -1], i * 4); }
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(S, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...E.U }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
attribute vec4 iP, iS; uniform vec4 uBank; uniform vec3 uAxis; uniform float uTime, uWindSpeed, uWall;
varying vec2 vC; varying vec3 vWp; varying vec3 vK; varying float vTw;
#include <fog_pars_vertex>
void main(){
  vec2 wd = uBank.zw;
  float tw = fract(uTime * uWindSpeed * .0035 + iS.z * 7.3);                    // mist drifts downwind and is renewed upwind
  float wall = step(iS.w, -.5);
  vec3 c = iP.xyz + vec3(wd.x, 0., wd.y) * (uBank.x * max(iS.w, 0.) + uBank.x * .1 * wall + (tw - .5) * 150. * step(iP.w, .5) * (1. - wall));
  vec3 toC = cameraPosition - c; toC.y = 0.; float l = length(toC);
  vec3 rt = l > 1e-3 ? vec3(toC.z, 0., -toC.x) / l : vec3(1., 0., 0.);
  vec3 wp = c + rt * position.x * iS.x + vec3(0., (position.y * .5 + .5) * iS.y, 0.);
  vC = position.xy; vWp = wp; vK = vec3(iS.z, iP.w, iS.x / max(iS.y, 1.)); vTw = mix(mix(sin(tw * 3.14159), 1., step(.5, iP.w)), uWall, wall);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec4 uBank; uniform vec3 uSunCol, uRock; uniform float uSun;
varying vec2 vC; varying vec3 vWp; varying vec3 vK; varying float vTw;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_SKY}
${GLSL_FOGGED}
void main(){
  float x = vC.x, y = vC.y * .5 + .5, sd = vK.x * 37.;
  float torn = fbm2(vec2(x * 2.2 * vK.z * .35 + sd + uTime * .03, sd * .3));
  float topY = .5 + .42 * torn;
  float ex = 1. - x * x; ex *= ex;
  float body = ex * smoothstep(0., .14, y) * (1. - smoothstep(topY - .22, topY, y));
  float wisp = fbm2(vec2(x * 2.6 * vK.z * .35 - uTime * .17 + sd, y * 2.2 + sd + uTime * .05));
  vec3 ray = vWp - cameraPosition; float dist = length(ray); ray /= max(dist, 1e-4);
  float a = body * smoothstep(.12, .7, wisp + .28) * smoothstep(7., 34., dist) * mix(uBank.y, .5, vK.y) * .92 * vTw;
  vec3 base = skyCol(normalize(vec3(ray.x, .06, ray.z)), 0.);
  float lit = smoothstep(topY - .5, topY, y);
  vec3 col = base * mix(.8, 1.14, lit) * mix(.9, 1.08, wisp) + (uSunCol * uSun * .4 + uSunTint * .07) * lit * lit * (1. - vK.y);
  col = mix(col, mix(base, uRock * 1.6, .4) * .82, vK.y);                 // the shelf lies in the mountain's shade
  col = mix(col, base, fogAmount(vFogDepth) * .6);
  gl_FragColor = vec4(col * a, a);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5; mesh.name = 'fogBank';
  return mesh;
}

// Motes carried with the lens: drizzle that becomes drifting spores after the breakthrough, and the
// rust dust the tassels shed (uMote = spore 0-1, dust 0-1, amount; uMoteOff = integrated drift).
function makeMotes(E, rng) {
  const n = Math.round(1900 * E.detail), A = new Float32Array(n * 4);
  for (let i = 0; i < n * 4; i++) A[i] = rng();
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...E.U }, transparent: true, depthWrite: false, depthTest: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
attribute vec4 iA; uniform vec3 uMote, uMoteOff, uSunDir; uniform float uTime; uniform vec2 uRes;
varying vec2 vC; varying vec4 vK;
void main(){
  vec3 box = vec3(22., 9., 22.);
  vec3 c = cameraPosition + (fract(iA.xyz + (uMoteOff - cameraPosition) / box) - .5) * box;
  c += vec3(sin(uTime * .9 + iA.w * 40.), cos(uTime * .7 + iA.w * 31.), sin(uTime * .8 + iA.w * 17.)) * .06 * (.3 + uMote.x);
  vec4 mv = viewMatrix * vec4(c, 1.); float d = -mv.z;
  float dust = step(iA.w, uMote.y * .5);
  float sz = max(mix(.012, .016, uMote.x) * (1. + dust), d * 1.6 / max(uRes.y, 1.) * .85);
  mv.xy += position.xy * sz * vec2(1., mix(2.2, 1., max(uMote.x, dust)));               // n4 (K6, mend 1): drizzle falls as fine short flecks: a drop's fleck is its own breadth (3.3 cm in the mean) and what it falls in one frame of film (2.4 m/s for a sixtieth of a second: 4 cm) long, 2.2 to 1 (it was 3.2: long dashes; the first n4's 1.7 read as dots)
  float tw = .5 + .5 * sin(uTime * (2. + 3. * iA.w) + iA.x * 50.); tw *= tw;
  float a = smoothstep(.35, 1.4, d) * (1. - smoothstep(8., 13., d)) * uMote.z * mix(.45, 1., uMote.x) * min(1., mix(.012, .016, uMote.x) / sz * 3.2);
  // mend 1: a drop is lit by the sun: one that falls between the lens and the sun's quarter of the sky shines (the glow comes
  // through it), at every place and in every direction by the same law (vK.w: how near the sun's own direction it stands)
  vec3 toD = c - cameraPosition; float sw = max(dot(toD / max(length(toD), 1e-4), uSunDir), 0.);
  vC = position.xy; vK = vec4(uMote.x * (1. - dust), dust, a * mix(.5, .35 + .65 * tw, uMote.x), sw * sw);
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: /* glsl */`
uniform vec3 uGold, uSunCol, uFogSun, uRust; uniform float uSun;
varying vec2 vC; varying vec4 vK;
void main(){
  float f = clamp(1. - dot(vC, vC), 0., 1.); f *= f;
  // mend 1 (K6): the shower's flecks are SHORT (2.2 to 1 above) and as bright as n3's and live's drizzle (the first n4 had
  // shortened AND dimmed them to 0.62: against the shower's own bright sky they were gone); toward the sun they take its gold
  vec3 drizzle = uFogSun * 1.5 + uSunCol * (.25 + .55 * clamp(vK.w, 0., 1.)), spore = uGold * uSunCol * (1.2 + 2.2 * uSun), dustc = uRust * (uFogSun + uSunCol * uSun) * 1.4;
  vec3 col = mix(mix(drizzle, spore, vK.x), dustc, vK.y);
  float a = f * vK.z * mix(.95, .95, max(vK.x, vK.y));
  gl_FragColor = vec4(col * a, a * mix(.9, .25, vK.x));
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 8; mesh.name = 'motes';
  return mesh;
}

const PACE = [[0, 0.44], [0.085, 0.5], [0.14, 0.9], [0.3, 1.4], [0.5, 0.6], [0.62, 0.8], [0.74, 0.95], [0.9, 1], [1, 1]];
function paceAt(u) {
  for (let i = 0; i < PACE.length - 1; i++) if (u <= PACE[i + 1][0]) return lerp(PACE[i][1], PACE[i + 1][1], smoothstep(PACE[i][0], PACE[i + 1][0], u));
  return 1;
}

// ------------------------------------------------------------------------------------------------
// The three weathers (seeded) and the world itself.
// ------------------------------------------------------------------------------------------------
const MOODS = {
  // warm mid-morning sea fog lifting
  fog: { elev: 21, sun: ['#FFE2B0', 1.3], fogSun: '#F4E2BA', fogAway: '#D0C2A6', zen: '#4F8CC4', hor: '#BFD3DA', tint: '#FFE8BC', gold: '#F2C566', rho0: 0.0046, bank: 0.0012, rho1: 0.0011, clear0: 0.78, mtn0: 0.96, sun0: 0.7, wet: 0, exposure: 0.95 },
  // a low amber sun: thirty-metre shadows, copper veils
  amber: { elev: 12, sun: ['#FFB76E', 1.3], fogSun: '#EFCB98', fogAway: '#C9B7A3', zen: '#5687C0', hor: '#E6C79C', tint: '#FFCF8C', gold: '#E39A4E', rho0: 0.0046, bank: 0.0012, rho1: 0.0013, clear0: 0.74, mtn0: 0.96, sun0: 0.7, wet: 0, exposure: 0.97 },
  // just after rain: wet dark-streaked pillars, air washed clear to the mountains, fog only a low sheet on the water
  rain: { elev: 27, sun: ['#FFE8C4', 1.2], fogSun: '#E2DED0', fogAway: '#BFC4C4', zen: '#5E94C2', hor: '#C6D9DE', tint: '#FFEFD0', gold: '#F2C566', rho0: 0.0021, bank: 0.0012, rho1: 0.0009, clear0: 0.88, mtn0: 0.96, sun0: 0.75, wet: 1, exposure: 0.95 },
};

export default {
  id: 'pillars-before-trees',
  name: 'Pillars Before Trees',
  category: 'prehistoric',
  weirdness: 0.5,
  media: ['open', 'water'],
  async build(ctx) {
    const scene = new THREE.Scene(), noise = ctx.noise, detail = ctx.quality?.detail ?? 1, vary = ctx.vary ?? {};
    const fork = (name) => (ctx.rng.fork ? ctx.rng.fork(name) : ctx.rng);
    // ---- what kind of morning ----
    const vr = fork('morning'), roll = vr(), hour = vary.hour ?? 'any';
    const V = {
      mood: hour === 'golden' || hour === 'dawn' ? 'amber' : hour === 'day' ? (roll < 0.6 ? 'fog' : 'rain') : (roll < 0.42 ? 'fog' : roll < 0.72 ? 'amber' : 'rain'),
      ripe: vr.chance(0.45), pair: vr() > 0.6, shoal: vr.range(0.4, 1), pillars: vr.int(24, 36), fallenOld: vr.chance(0.5), rare: !!vary.rare,
    };
    const density = vary.density ?? 1, Mo = MOODS[V.mood];
    const path = makeRoute();
    await ctx.yield();
    const P240 = path.posAtDist(250, new THREE.Vector3()), T240 = path.tangentAtDist(250, new THREE.Vector3());
    const elder = { x: P240.x + T240.z * 6.4, z: P240.z - T240.x * 6.4 };       // ahead on the left all through the curve, passed at 6 m with the lens under its veil
    const windXZ = new THREE.Vector2(-0.25, -0.95).normalize();
    const sunDir = new THREE.Vector3(-Math.sin(25 * D2R) * Math.cos(Mo.elev * D2R), Math.sin(Mo.elev * D2R), -Math.cos(25 * D2R) * Math.cos(Mo.elev * D2R));

    // ---- the hero: the Elder, with the shared light and weather uniforms everything else reads ----
    const palette = ['#E6DCC3', '#EADFC6', Mo.gold, V.ripe ? '#74824F' : '#6B8660', V.ripe ? '#B5683A' : '#A9643A', '#5B5A6B', '#3A3B33'];
    const hero = await buildHero(ctx, { palette, detail, swardCount: 36, veilLength: V.rare ? 10 : 52, light: { sunDir, sunColor: lin(Mo.sun[0], Mo.sun[1]) } });
    hero.object.position.set(elder.x, 0, elder.z); scene.add(hero.object);
    hero.setWind(windXZ.x, windXZ.y, V.rare ? 1.1 : 2.6, V.rare ? 0.97 : 0.12);
    hero.setState({ sun: Mo.sun0, sunDown: Mo.sun0, smoke: 0, wet: Mo.wet });
    const shared = hero.shared; shared.uVeilGain.value = V.rare ? 1.9 : 1.5; shared.uVeilEven.value = V.rare ? 1 : 0;
    await ctx.yield();

    const BR = bridgeOf(path), lines = streamLines(path, BR);
    const map = await makeWaterMap(ctx, lines);
    const height = makeHeight(map, noise);
    shared.uMap.value = map.tex; shared.uMapRect.value.set(map.x0, map.z0, 1 / MAP.size, MAP.cap);
    const U = {
      ...shared,
      uFogSun: { value: linS(Mo.fogSun, 0.76, 1.45) }, uFogAway: { value: linS(Mo.fogAway, 0.4, 1.1).multiply(new THREE.Vector3(0.94, 0.97, 1.1)) }, uZen: { value: lin(Mo.zen) }, uHor: { value: lin(Mo.hor) },
      uSunTint: { value: lin(Mo.tint) }, uCum: { value: V.mood === 'rain' ? 1 : 0.3 }, uLow: { value: linS(Mo.fogAway, 0.8, 1.4) }, uClear: { value: Mo.clear0 },
      uMap: { value: map.tex }, uMapRect: { value: new THREE.Vector4(map.x0, map.z0, 1 / MAP.size, MAP.cap) },
      uCloud: { value: 0 }, uWetAll: { value: Mo.wet }, uRipe: { value: V.ripe ? 1 : 0 }, uGlint: { value: 1 },
      uRock: { value: lin('#5B5A6B') }, uMtn: { value: Mo.mtn0 }, uScare: { value: new THREE.Vector3(0, 0, 0) },
      uBank: { value: new THREE.Vector4(0, 1, windXZ.x, windXZ.y) }, uShaft: { value: 0 }, uWall: { value: 0 }, uCurtain: { value: 0 },
      uSea: { value: [0, 1, 2].map(() => new THREE.Vector4(1e5, 1e5, 0, 1)) }, uSeaK: { value: [0, 1, 2].map(() => new THREE.Vector4(1, 0, 0, 0)) },      // the sea scorpions as the water knows them: x, z, heading; size, rowing
      uLog: { value: new THREE.Vector4(1e5, 1e5, 1e5 + 1, 1e5) }, uRain: { value: 0 }, uSq: { value: 0 }, uWisp: { value: 0 }, uTear: { value: 0 },      // the fallen pillar's line in the water; the shower (rain rings, wet pillars) and the mist bank of the middle stretch
      uPil: { value: Array.from({ length: 24 }, () => new THREE.Vector4(1e5, 1e5, 0.01, 0.01)) },      // the ten pillars that stand in the water's reflections: x, z, height above the water, radius
      uMote: { value: new THREE.Vector3(0, 0, 1) }, uMoteOff: { value: new THREE.Vector3() }, uRes: { value: new THREE.Vector2(800, 450) },
    };
    const COV = 512, cover = new Uint8Array(COV * COV), coverTex = new THREE.DataTexture(cover, COV, COV, THREE.RedFormat, THREE.UnsignedByteType);
    coverTex.magFilter = coverTex.minFilter = THREE.LinearFilter; coverTex.wrapS = coverTex.wrapT = THREE.ClampToEdgeWrapping; coverTex.needsUpdate = true;
    U.uCover = { value: coverTex };
    const E = { path, map, height, noise, detail, density, V, shared, U, elder, feet: [], young: hero.anchors.young, cover, coverTex, COV };
    // n4: every new consumer of chance has a named stream of its own (a new fork of ctx.rng would re-roll every fork after it;
    // none is forked from a live stream): 'pbt-bridge', 'pbt-groves', 'pbt-late', 'pbt-logplants', 'pbt-wisps', 'pbt-fish', 'pbt-walker'
    const own = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // THE STATIONS (route metres), each found in the world, none typed:
    //   sEld  the Elder's own station: the place of the route nearest its foot;
    //   sBar  where braid K's last water runs out on the bar: the place of the route nearest the braid's last point;
    //   sAve  where the avenue's stream begins: the place of the route nearest that stream's head;
    //   sGate the last pair of live's anchors (they frame the ring): read from the list.
    const kEnd = lines.K[lines.K.length - 1], cHead = lines.C[lines.C.length - 1];
    const sEld = stationOf(path, elder.x, elder.z).s, sBar = stationOf(path, kEnd[0], kEnd[1]).s, sAve = stationOf(path, cHead[0], cHead[1]).s, sGate = ANCHORS[ANCHORS.length - 1][0];
    Object.assign(E, { own, BR, sEld, sBar, sAve, sGate, elderH: hero.height ?? 8.8, elderR: 0.65, lookAhead: LOOK_AHEAD });
    if (shared.uCover) shared.uCover.value = coverTex;
    scene.fog = new THREE.FogExp2(new THREE.Color().setRGB(0.6, 0.58, 0.5), Mo.rho0);

    // ---- the other pillars ----
    await ctx.yield();
    const lay = await layoutPillars(ctx, E, fork('pillars')); E.feet = lay.feet;
    await ctx.yield();
    // the pillars that stand in the water's reflections: the two dozen nearest the lens of those near a channel, chosen each frame
    const mirrored = lay.posts.filter((q) => map.at(q.x, q.z) < 8 && q.h > 2.5), mirD = new Float32Array(mirrored.length), mirI = new Int32Array(mirrored.length);
    const setMirrors = (cx, cz) => {
      for (let i = 0; i < mirrored.length; i++) { const q = mirrored[i]; mirD[i] = (q.x - cx) * (q.x - cx) + (q.z - cz) * (q.z - cz); mirI[i] = i; }
      mirI.sort((a, b) => mirD[a] - mirD[b]);
      for (let i = 0; i < 24; i++) { const q = mirrored[mirI[i]]; if (q) U.uPil.value[i].set(q.x, q.z, q.h + 0.3, (q.r ?? 0.5) * 0.9); else U.uPil.value[i].set(1e5, 1e5, 0.01, 0.01); }
    };
    setMirrors(0, 0);
    await ctx.yield();
    const field = await makePillarField(ctx, shared, lay.items, { rng: fork('field'), noise, detail, variants: 9, nearRadius: 19 });
    field.object.position.set(elder.x, 0, elder.z); scene.add(field.object);
    const fallen = field.specs.find((s) => s.item.fallen);
    const fDir = new THREE.Vector3(lay.fallenDir[0], 0, lay.fallenDir[1]);
    // n4 (B): THE TRUNK UNDER THE LENS.  The mesh as built (its capped lean and bow, its lobes and drums) is laid by measure, in
    // the world: its far end rests on the far bank (6 cm into the gravel there), and it is then set at the height at which
    // the highest point of its back, at eyes every 0.5 m of route over its whole length, is 0.9 m under the lens's own line.
    // The back's height is kept as a field (10 cm along, 4 cm across, every upward face of the mesh) for its plants and its walker.
    const BK = { na: 96, nl: 45, da: 0.1, dl: 0.04, a0: -0.5, l0: -0.88, top: new Float32Array(96 * 45).fill(-9), ridge: new Float32Array(96), ridgeY: new Float32Array(96).fill(-9) };
    if (fallen) {
      const fm = fallen.mesh, fPos = fm.geometry.attributes.position, fIdx = fm.geometry.index.array, fv = new THREE.Vector3(), W3 = new Float32Array(fPos.count * 3), ry = fm.rotation.y;
      fm.material.uniforms.uTan = { value: lin('#CDC3A8', 0.86) }; fm.material.uniforms.uWaterY.value = WATER; fm.material.uniforms.uLie.value = 1; fm.material.uniforms.uFlutes.value = 84;      // fine fluting: 84 flutes round 3.4 m of girth, 4 cm each
      U.uLog.value.set(lay.fallen.x, lay.fallen.z, lay.fallen.x + fDir.x * BRIDGE_L, lay.fallen.z + fDir.z * BRIDGE_L);
      const eyes = []; for (let d = BR.s0 - 1; d <= BR.s1 + 1.5; d += 0.5) { const c = path.posAtDist(d, new THREE.Vector3()); eyes.push({ a: (c.x - lay.fallen.x) * fDir.x + (c.z - lay.fallen.z) * fDir.z, y: c.y }); }
      // and where the walker goes (from 0.25 m before its near end to the tip) the back lies deep enough for the animal on it:
      // 0.7 m of air over its top, its own height (its curled tail: 0.192 m), a leg's fold (4 cm) and 2 cm
      const LOG_CLEAR = 0.9, WALK_CLEAR = 0.7 + 0.0565 * 3.4 + 0.04 + 0.02, WALK_FROM = 4.6 - 0.25, fit = (m) => Math.min(m.minC - LOG_CLEAR, m.minW - WALK_CLEAR);
      const toLine = () => {                               // every vertex as (metres along the trunk from its broken end, height, metres across)
        fm.updateMatrix();
        for (let i = 0; i < fPos.count; i++) {
          fv.fromBufferAttribute(fPos, i).applyMatrix4(fm.matrix); const x = fv.x + elder.x - lay.fallen.x, z = fv.z + elder.z - lay.fallen.z;
          W3[i * 3] = x * fDir.x + z * fDir.z; W3[i * 3 + 1] = fv.y; W3[i * 3 + 2] = -x * fDir.z + z * fDir.x;
        }
      };
      const measure = () => {
        toLine(); let minC = Infinity, minW = Infinity, gap = Infinity;
        for (const e of eyes) { let top = -9; for (let i = 0; i < fPos.count; i++) if (Math.abs(W3[i * 3] - e.a) <= 0.25 && W3[i * 3 + 1] > top) top = W3[i * 3 + 1]; if (top > -8) { minC = Math.min(minC, e.y - top); if (e.a >= WALK_FROM) minW = Math.min(minW, e.y - top); } }
        for (let i = 0; i < fPos.count; i++) {
          const a = W3[i * 3]; if (a < BRIDGE_L - 1.4 || a > BRIDGE_L - 0.2) continue;
          const l = W3[i * 3 + 2], g = height(lay.fallen.x + fDir.x * a - fDir.z * l, lay.fallen.z + fDir.z * a + fDir.x * l); gap = Math.min(gap, W3[i * 3 + 1] - g);
        }
        return { minC, minW, gap };
      };
      let pitch = 0.03; const setPitch = (q) => { pitch = clamp(q, -0.06, 0.09); fm.rotation.set(0, ry, -Math.PI / 2 + pitch, 'YXZ'); };
      for (let it = 0; it < 3; it++) {
        let m = measure(); fm.position.y += fit(m); await ctx.yield(); m = measure(); await ctx.yield();
        const q0 = pitch; setPitch(q0 + 0.01); const m1 = measure(), dg = (m1.gap - m.gap) / 0.01;
        setPitch(Math.abs(dg) > 0.5 ? q0 + (-0.06 - m.gap) / dg : q0);
        await ctx.yield();
      }
      { const m = measure(); fm.position.y += fit(m); }
      toLine(); fm.updateMatrix();
      fm.material.uniforms.uAxis.value.set(0, 1, 0).transformDirection(fm.matrix);      // the trunk's own axis as it lies (for its flutes)
      await ctx.yield();
      for (let t = 0; t < fIdx.length; t += 3) {            // the back as a height field
        const a = fIdx[t] * 3, b = fIdx[t + 1] * 3, c = fIdx[t + 2] * 3;
        const ax = W3[a], al = W3[a + 2], bx = W3[b], bl = W3[b + 2], cx = W3[c], cl = W3[c + 2], den = (bl - cl) * (ax - cx) + (cx - bx) * (al - cl);
        if (Math.abs(den) < 1e-9) continue;
        const i0 = Math.max(0, Math.ceil((Math.min(ax, bx, cx) - BK.a0) / BK.da)), i1 = Math.min(BK.na - 1, Math.floor((Math.max(ax, bx, cx) - BK.a0) / BK.da));
        const j0 = Math.max(0, Math.ceil((Math.min(al, bl, cl) - BK.l0) / BK.dl)), j1 = Math.min(BK.nl - 1, Math.floor((Math.max(al, bl, cl) - BK.l0) / BK.dl));
        for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
          const qa = BK.a0 + i * BK.da, ql = BK.l0 + j * BK.dl, w0 = ((bl - cl) * (qa - cx) + (cx - bx) * (ql - cl)) / den, w1 = ((cl - al) * (qa - cx) + (ax - cx) * (ql - cl)) / den, w2 = 1 - w0 - w1;
          if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
          const y = w0 * W3[a + 1] + w1 * W3[b + 1] + w2 * W3[c + 1]; if (y > BK.top[i * BK.nl + j]) BK.top[i * BK.nl + j] = y;
        }
        if (t % 9000 === 8997) await ctx.yield();
      }
      for (let i = 0; i < BK.na; i++) { let bj = -1, by = -9; for (let j = 0; j < BK.nl; j++) if (BK.top[i * BK.nl + j] > by) { by = BK.top[i * BK.nl + j]; bj = j; } BK.ridge[i] = bj < 0 ? 0 : BK.l0 + bj * BK.dl; BK.ridgeY[i] = by; }
      for (let k = 0; k < 4; k++) for (let i = 1; i < BK.na - 1; i++) if (BK.ridgeY[i - 1] > -8 && BK.ridgeY[i + 1] > -8) BK.ridge[i] = (BK.ridge[i - 1] + 2 * BK.ridge[i] + BK.ridge[i + 1]) / 4;      // the ridge of its back: the pillar lies a little bowed, off the route's line
    }
    // height of the trunk's back at (metres along it from the broken end, metres across): -9 where there is no trunk
    BK.at = (a, l) => {
      const fi = clamp((a - BK.a0) / BK.da, 0, BK.na - 1.001), fj = clamp((l - BK.l0) / BK.dl, 0, BK.nl - 1.001), i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, k = i * BK.nl + j, T = BK.top;
      if (T[k] < -8 || T[k + 1] < -8 || T[k + BK.nl] < -8 || T[k + BK.nl + 1] < -8) return -9;
      return lerp(lerp(T[k], T[k + 1], v), lerp(T[k + BK.nl], T[k + BK.nl + 1], v), u);
    };
    BK.lat = (a) => { const fi = clamp((a - BK.a0) / BK.da, 0, BK.na - 1.001), i = Math.floor(fi); return lerp(BK.ridge[i], BK.ridge[i + 1], fi - i); };
    BK.world = (a, l, out) => out.set(lay.fallen.x + fDir.x * a - fDir.z * l, BK.at(a, l), lay.fallen.z + fDir.z * a + fDir.x * l);
    E.logBack = BK; BK.has = !!fallen; BK.x = lay.fallen.x; BK.z = lay.fallen.z; BK.fDir = fDir;
    if (fallen && V.fallenOld) {                        // old and crusted: its own darker, greener bone
      fallen.mesh.material.uniforms.uBone = { value: lin('#C9C2A6', 0.8) };
      fallen.mesh.material.uniforms.uWet = { value: 0.7 };
    }
    await ctx.yield();

    // ---- sky, mountains, ground, water ----
    const sky = makeSkyDome(E); scene.add(sky);
    await ctx.yield();
    scene.add(await makeMountains(ctx, E, fork('mountains'), noise, { R: 2250, base: 380, amp: 620, freq: 5.2, haze0: 0.38, haze1: 0.14, order: -9 }));
    await ctx.yield();
    scene.add(await makeMountains(ctx, E, fork('foothills'), noise, { R: 1800, base: 110, amp: 330, freq: 6.5, haze0: 0.3, haze1: 0.08, order: -8 }));
    await ctx.yield();
    scene.add(await makeGround(ctx, E));
    await ctx.yield();
    scene.add(makeWater(E));
    const sward = await makeSward(ctx, E, fork('sward')); scene.add(sward.object);
    await ctx.yield();
    scene.add(makeFogBank(E, fork('bank')));
    scene.add(makeShafts(E, fork('shafts')));
    scene.add(makeWisps(E, own('pbt-wisps')));
    scene.add(makeCurtain(E, path.posAtDist(460, new THREE.Vector3())));
    const carried = new THREE.Group(); carried.name = 'carried'; carried.add(makeMotes(E, fork('motes'))); scene.add(carried);
    await ctx.yield();

    // ---- the fish: the entry shallows, the channel under the fallen pillar, the avenue's stream ----
    const fr = fork('fish'), spots = [], shoal = clamp(V.shoal * density, 0.4, 1);
    // n4 (D): THE LENS'S TUBE.  The one rule that keeps a fish out of the lens: no fish's water reaches into a tube of 0.6 m
    // round the route's own line, in space (its seat, as high as it ever rises over the bed (0.2 m), less its circle and
    // the half length of its kind).  It replaces n3's cleared strip 2 m either side of the line along the whole entry and live's two
    // typed bands of z.  The front shoal is not asked: it lies right under the lens in the first picture, as in live.
    // No fish is tried more than 40 times: one that finds no water in forty draws is left out.
    // Mend 2: each fish is asked with ITS OWN water: its own circle and the half length of its own kind (the big fish of
    // the entry grow to 2.45 times the mesh's 0.134 m half length: 0.33 m; the others to 1.4 times: 0.19 m).  Mend 1 asked
    // every fish with the widest circle (0.5 m) and 0.35 m, so the tube stood 0.85 m wider than any small fish's water
    // and the water beside the lens was thinner than live's.  A fish seated where the widest circle would reach into the
    // tube keeps a circle that fits (drawn between the least circle, 0.12 m, and the room it has); only where even the
    // least circle would reach in is the seat refused.
    const FISH_HALF = 0.134, roomAt = (x, y, z, big) => lensDist(path, x, y + 0.2, z) - 0.6 - FISH_HALF * (big ? 2.45 : 1.4);
    const tryFish = (x, z, wMax, R = fr) => {
      if (map.at(x, z) >= wMax) return false;
      const y = height(x, z), big = z > -50 && Math.abs(x) < 6 && z < 0, room = roomAt(x, y, z, big); if (room < 0.12) return false;
      spots.push({ x, z, y, r: R.range(0.12, Math.min(0.5, room)), big }); return true;
    };
    const seat = (n, draw, wMax, R = fr) => { let made = 0; for (let i = 0; i < n; i++) for (let t = 0; t < 40; t++) { const q = draw(i, R); if (tryFish(q[0], q[1], wMax, R)) { made++; break; } } return made; };
    const nEntry = Math.max(detail < 0.8 ? 48 : 72, Math.round(76 * shoal * (detail < 0.8 ? 0.75 : 1))), nB = Math.round(28 * shoal * detail), nC = Math.round(22 * shoal * detail), fishN = {};
    fishN.entry = seat(nEntry, (i) => { const near = i < nEntry * 0.75, z = near ? fr.range(-5, -21) : fr.range(-18, -47), x = near ? fr.range(-2.6, 2.1) : fr.range(-4.5, 4.5); return [x, z]; }, -0.9);
    // the front shoal: twenty-five right under the lens in the first frame (and in the portal picture), 2.2 to 6 m ahead
    fishN.front = 0;
    for (let i = 0; i < 25; i++) for (let t = 0; t < 40; t++) { const k = i % 5, row = (i / 5) | 0, x = (-2.0 + 0.95 * k + fr.range(-0.3, 0.3) + row % 2 * 0.4) * (1 + 0.12 * row), z = -3.7 - 0.85 * row - fr.range(0, 0.45); if (map.at(x, z) < -0.7) { spots.push({ x, z, y: height(x, z), r: fr.range(0.08, 0.22), big: true }); fishN.front++; break; } }
    // channel B's shoal: under and beside the bridge, 10 m up and down the channel from the trunk's middle (the channel runs
    // straight and square to the trunk that far), across its whole water
    const [bmx, bmz] = BR.mid, [brx, brz] = BR.right, [bdx, bdz] = BR.dir;
    fishN.B = seat(nB, () => { const a = fr.range(-10, 10), b = fr.range(-2.6, 2.6); return [bmx + brx * a + bdx * b, bmz + brz * a + bdz * b]; }, -0.7);
    fishN.C = seat(nC, () => { const x = fr.range(-150, 22); return [x, aveStreamZ(x) + fr.range(-3, 3)]; }, -0.7);
    // n4: and fish of the bridge's own, from the stream 'pbt-fish', sized by the water they stand in (mend 2; mend 1 had three
    // numbers, 12, 14 and a quarter of the entry's shoal once more, the last to make up for the tube's width: the tube now
    // asks each fish with its own water and that third shoal is gone):
    //   beside the fallen pillar, working the gravel 0.8 to 3.6 m from its axis on either side: three fish for every two
    //   metres of the trunk (FISH_BRIDGE 1.5 a metre: twelve on its 8 m);
    //   along the entry stream's own line for as long as the stream runs with the lens (n4b: both ends are the stream's
    //   own, found by stationOf on the channel's line as streamLines gives it): from the channel's first water beside the
    //   route (its first point that has a place of the route abreast of it: the water upstream of the entry lies behind
    //   the lens) to where the channel has swung further from the route's line than arm's length (ARM_M, 5.5 m: the strip
    //   the lens itself flies through, the trunks' own measure of near; beyond it the stream has left the lens): as many
    //   to the metre of that channel as n4 had and as live's far entry band carries (FISH_SWING 0.65 a metre: a quarter
    //   of its 72 to 76 fish on the 29 m of that band).  n4 began and ended this shoal at the two typed ends of live's
    //   far entry band (z -18, and 36 m of channel past z -47); live's own line above keeps them, this loop reads none.
    { const xr = own('pbt-fish'), FISH_BRIDGE = 1.5, FISH_SWING = 0.65;
      fishN.bridge = seat(Math.round(FISH_BRIDGE * BRIDGE_L * detail), (i, R) => { const a = R.sign() * R.range(0.8, 3.6), b = R.range(-2.1, 2.1); return [bmx + brx * a + bdx * b, bmz + brz * a + bdz * b]; }, -0.5, xr);
      const A = lines.A, swing = []; let acc = 0, s0 = 0, s1 = 0;
      for (let i = 0; i < A.length - 1; i++) { const so = stationOf(path, A[i][0], A[i][1]); if (!(so.s > 0)) continue; if (so.dist > ARM_M) break; if (!swing.length) s0 = so.s; s1 = so.s; swing.push(A[i]); acc += Math.hypot(A[i + 1][0] - A[i][0], A[i + 1][1] - A[i][1]); }
      E.shoal = { from: s0, to: s1, channel: acc, points: swing.length };      // (for the proofs: the shoal's first and last station of the route, its metres of channel)
      fishN.swing = swing.length ? seat(Math.round(FISH_SWING * acc * detail), (i, R) => { const q = swing[Math.floor(R() * swing.length) % swing.length], a = R() * TAU, r = R.range(0, 2.4); return [q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r]; }, -0.9, xr) : 0; }
    await ctx.yield();
    const fish = makeFish(E, fr, spots); scene.add(fish.mesh, fish.puff);
    await ctx.yield();

    // ---- the sea scorpion (or a pair): resting half awash at the Sentinel's foot, then rowing down the channel ----
    const seaGeo = pterygotusGeometry();
    await ctx.yield();
    const makeSeaScorpion = (pts, scale, u0, phase, rate = 0) => {
      const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], 0, p[1])), false, 'centripetal'), len = curve.getLength();
      const mat = arthropodMaterial(E, { wave: 0.045, legHz: 3, legAmp: 0.07, legK: 40, gloss: 1, grain: 90 });
      const mesh = new THREE.Mesh(seaGeo, mat); mesh.scale.setScalar(scale); mesh.rotation.order = 'YXZ'; mesh.frustumCulled = false; mesh.name = 'pterygotus';
      const pos = new THREE.Vector3(), tan = new THREE.Vector3(), ahead = new THREE.Vector3(), dir = new THREE.Vector2(0, 1), sw = { v: 0 };
      const update = (u, time) => {
        const du = Math.max(0, u - u0), s = Math.min(rate > 0 ? Math.max(0, 460 * Math.min(u, 0.115) + 2.9 + 3.6 * Math.exp(-u / 0.022) - 6.3 * smoothstep(0.092, 0.125, u) + rate * Math.max(0, u - 0.115) - 6.5) : 76.7 * du * du / (du + 0.01), len - 2), swim = rate > 0 ? 1 : smoothstep(0, 0.018, du);
        curve.getPointAt(s / len, pos); curve.getTangentAt(s / len, tan); curve.getPointAt(Math.min(1, (s + 0.75 * scale) / len), ahead);
        const yaw = Math.atan2(tan.x, tan.z), rx = Math.cos(yaw), rz = -Math.sin(yaw);
        mesh.position.set(pos.x, WATER + lerp(0.036, 0.004, swim) * scale, pos.z);
        mesh.rotation.set(lerp(0.07, 0, swim), yaw, 0);
        const lx = (ahead.x - pos.x) * rx + (ahead.z - pos.z) * rz;
        mat.uniforms.uBend.value = clamp(2 * lx / (0.5625 * scale * scale) / scale, -0.9, 0.9) * swim;
        mat.uniforms.uSwim.value = swim; mat.uniforms.uPh.value = time * (rate > 0 ? 1.9 : 1.2) * TAU + phase;
        dir.set(tan.x, tan.z); if (dir.lengthSq() > 1e-6) dir.normalize(); else dir.set(0, 1); sw.v = swim;
        return swim;
      };
      scene.add(mesh);
      return { mesh, pos, update, dir, sw, scale };
    };
    // the lead rows ahead of us from the first frame, keeping just ahead of the slow lens until it tires
    const scorps = [makeSeaScorpion([[0.5, -6.5], [0.55, -9], [0.75, -13], [0.35, -19], [-0.55, -25], [-0.85, -31], [-0.3, -37], [0.7, -43], [1.1, -49], [0.6, -57], [-3, -68], [-9, -76], [-30, -86], [-70, -92], [-130, -80]], 1.3, -0.02, 0, 200)];
    // and one waits in the avenue's stream and rows up it toward us on the low pass (a pair of them in some seeds), so the animals return after the turn
    { const pts = []; for (let x = -20.6; x <= 10; x += 3) pts.push([x, aveStreamZ(x)]); scorps.push(makeSeaScorpion(pts, 1.45, 0.668, 2.1)); }
    if (V.pair) { const pts = []; for (let x = -26.5; x <= 6; x += 3) pts.push([x, aveStreamZ(x) + 1.3]); scorps.push(makeSeaScorpion(pts, 1.0, 0.672, 4.4)); }
    const gazeSea = new THREE.Vector3(0.5, WATER, -6.5), gazeAve = new THREE.Vector3(-20.6, WATER, aveStreamZ(-20.6));
    const closeTop = lay.close ? new THREE.Vector3(lay.close.x, lay.close.h * 0.72, lay.close.z) : path.posAtDist(385, new THREE.Vector3());
    // n4 (F, mend 2): what a look at a grove would aim at and from where (the choice and the sizes follow the walker's look, below)
    const lookOf = (q) => { const sp = q.giant ? field.specs.find((x) => x.item === q.giant) : null;
      const top = sp && sp.top ? new THREE.Vector3(sp.top[0] + elder.x, sp.top[1], sp.top[2] + elder.z) : new THREE.Vector3(q.x, q.h, q.z);
      const a = stationOf(path, top.x, top.z), f = sp ? stationOf(path, q.giant.x + elder.x, q.giant.z + elder.z) : a;
      const _v1 = path.posAtDist(q.d, new THREE.Vector3()), _v2 = path.posAtDist(q.d + 6, new THREE.Vector3()).sub(_v1);
      return { q, top, s: Math.min(a.s, f.s), off: Math.min(a.dist, f.dist), elderSide: (_v2.x * (q.z - _v1.z) - _v2.z * (q.x - _v1.x)) * (_v2.x * (elder.z - _v1.z) - _v2.z * (elder.x - _v1.x)) > 0 }; };
    await ctx.yield();

    // ---- the scorpion on the fallen pillar ----
    const landMat = arthropodMaterial(E, { wave: 0, legHz: 11, legAmp: 0.34, legK: 392, gloss: 1.6, grain: 900 });
    const land = new THREE.Mesh(scorpionGeometry(), landMat); land.rotation.order = 'YXZ'; land.scale.setScalar(3.4); land.frustumCulled = false; land.name = 'scorpion'; scene.add(land);
    await ctx.yield();
    // n4 (C): THE WALKER walks by the clock, never by the lens.  Its speed is 0.2 m a second: its legs step 1.75 times a
    // second (live's 11 rad/s) and swing 0.34 rad either way on a reach of 8.2 cm, so a foot on the trunk travels 5.6 cm in
    // the half step it stands: 0.2 m/s is the speed at which its feet do not slide (two lengths of a 10 cm animal a
    // second: a scorpion's unhurried walk).  It walks to and fro along the ridge of the trunk's back between two ends given
    // from the trunk's own ends: no nearer the broken end than 4.6 m (0.4 m beyond the last place a plant may root) and no
    // nearer the tip than 0.9 m, and within those only where the back carries it (below), turning about in 1.4 s at each
    // end; where on that beat it is at the world's clock 0 comes from the stream 'pbt-walker'.
    const WALK = { v: 0.2, lo: 4.6, hi: BRIDGE_L - 0.9, turn: 1.4, scale: 3.4, reachX: 0.034 * 3.4, feetZ: [0.0302, 0.012, -0.0062, -0.0244].map((z) => z * 3.4) };
    // its two ends by the trunk's own back: the walker goes only where the back stays broader than its turning circle
    // (0.16 m round its centre: its feet reach 0.116 m) and, across it, within 14 cm of the ridge's height (a leg's
    // reach down, 16 cm, less 2 cm: the back is lobed, a furrow either side of each crest), measured on the height field every 10 cm
    { const broad = (a) => { const lt = BK.lat(a), top = BK.at(a, lt); for (let da = -0.16; da < 0.17; da += 0.08) for (let l = -0.16; l < 0.17; l += 0.08) { const y = BK.at(a + da, lt + l); if (y < -8 || (da > -0.01 && da < 0.01 && y < top - 0.14)) return false; } return true; };
      // its beat is the longest stretch of such back between the two ends given above (stations every 10 cm)
      let best = [WALK.lo, WALK.lo], run = null;
      for (let a = WALK.lo; a <= WALK.hi + 1e-9; a += 0.1) { if (broad(a)) { run = run ? [run[0], a] : [a, a]; if (run[1] - run[0] > best[1] - best[0]) best = run; } else run = null; }
      WALK.near = WALK.lo; WALK.lo = best[0]; WALK.hi = best[1]; }
    WALK.leg = (WALK.hi - WALK.lo) / WALK.v; WALK.period = 2 * (WALK.leg + WALK.turn); WALK.phase = own('pbt-walker')() * WALK.period;
    const walkAt = (time, out) => {                       // metres along the trunk and heading (0 = toward the tip), from the clock alone
      let t = (time + WALK.phase) % WALK.period; if (t < 0) t += WALK.period;
      if (t < WALK.leg) { out.a = WALK.lo + WALK.v * t; out.yaw = 0; }
      else if (t < WALK.leg + WALK.turn) { out.a = WALK.hi; out.yaw = Math.PI * smoothstep(0, 1, (t - WALK.leg) / WALK.turn); }
      else if (t < 2 * WALK.leg + WALK.turn) { out.a = WALK.hi - WALK.v * (t - WALK.leg - WALK.turn); out.yaw = Math.PI; }
      else { out.a = WALK.lo; out.yaw = Math.PI * (1 + smoothstep(0, 1, (t - 2 * WALK.leg - WALK.turn) / WALK.turn)); }
      return out;
    };
    const gazeLand = new THREE.Vector3(), wk = { a: 0, yaw: 0 }, wg = { a: 0, yaw: 0 }, fYaw = Math.atan2(fDir.x, fDir.z);
    // where the walker is at a clock time: the poi's own function (the gaze takes the walker where it is, at any clock)
    const walkerAt = (time) => { walkAt(time, wg); return BK.world(wg.a, BK.lat(wg.a), gazeLand); };
    // it stands on the trunk's surface: its body rides on the highest of the back under its length (six places along it), pitched
    // and rolled to the slope there, and each of its eight feet is set on the surface under that foot (uFoot: measured on the
    // height field through the animal's own matrix; a leg reaches at most 16 cm down and draws at most 4 cm up)
    const footL = new THREE.Vector3(), LEG_DOWN = 0.16 / WALK.scale, LEG_UP = 0.04 / WALK.scale;
    const placeLand = (time) => {
      walkAt(time, wk);
      const lt = BK.lat(wk.a), th = fYaw + wk.yaw, cy = Math.cos(wk.yaw), sy = Math.sin(wk.yaw);
      // the animal's forward and right in the trunk's own frame (along, across)
      const fa = cy, fl = -sy, ra = -sy, rl = -cy, h = (mx, mz) => BK.at(wk.a + ra * mx + fa * mz, lt + rl * mx + fl * mz);
      const c0 = h(0, -0.08), c2 = h(0, 0.12), gz = (c2 - c0) / 0.2;
      let y0 = -9; for (let z = -0.08; z < 0.125; z += 0.04) y0 = Math.max(y0, h(0, z) - gz * z);
      let hl = 0, hr = 0; for (const z of WALK.feetZ) { hl += (h(-WALK.reachX, z) - gz * z) / 4; hr += (h(WALK.reachX, z) - gz * z) / 4; }
      const gx = (hr - hl) / (2 * WALK.reachX);
      BK.world(wk.a, lt, land.position); land.position.y = y0;
      land.rotation.set(-Math.atan(gz), th, Math.atan(gx)); land.updateMatrix();
      const me = land.matrix.elements, upY = Math.max(0.5, me[5] / WALK.scale), F = landMat.uniforms.uFoot.value;
      for (let k = 0; k < 8; k++) {
        F[k] = 0;
        for (let it = 0; it < 6; it++) {                   // (the tip moves along the animal's own tilted axis: the surface is read again where it comes down)
          footL.set((k < 4 ? -1 : 1) * WALK.reachX / WALK.scale, -F[k], WALK.feetZ[k % 4] / WALK.scale).applyMatrix4(land.matrix);
          const dx = footL.x - BK.x, dz = footL.z - BK.z, sy0 = BK.at(dx * fDir.x + dz * fDir.z, -dx * fDir.z + dz * fDir.x);
          if (sy0 < -8) { F[k] = LEG_DOWN; break; }
          F[k] += (footL.y - sy0) / (WALK.scale * upY);
        }
      }
      // a foot that would have to be drawn up further than a leg folds lifts the whole animal by the rest
      const lift = Math.max(0, -Math.min(...F) - LEG_UP);
      if (lift > 0) land.position.y += lift * WALK.scale * upY;
      for (let k = 0; k < 8; k++) F[k] = Math.min(F[k] + lift, LEG_DOWN);
    };
    placeLand(0);
    const LENS_OVER = 0.9, WALK_FROM = BR.s0 - 1.5 * LOOK_AHEAD, WALK_TO = BR.s0 + WALK.lo - LENS_OVER, WALK_FADE = 2 * LENS_OVER / (WALK_TO - WALK_FROM);      // the walker's look (see pois): 0.9 m is the design's height of the lens over the trunk's back
    // n4 (F, G; mend 2): THE LOOK AT A GROVE.  The grove looked at is the last of the series that stands on the Elder's side
    // of the route no later than one look-ahead before the Elder's own station (n4b: sGroveBy = sEld - LOOK_AHEAD, 232.0 m, a
    // place of the land: from there on the rest of the lens's own gaze, one look-ahead down the route, lies on the Elder's
    // station or past it, and the view is the Elder's.  n4 read this bound from the shares of the flight typed in live's
    // Elder look, 195.6 m: verify-n4b/pair.mjs sets the two side by side), with at least one look-ahead between the walker's
    // look and its own end.  On the Elder's side, because the look that follows is the Elder's and the route turns that way:
    // a look to the other side swings the view across the route and back (seed 17: 39.7 degrees a second).  The last one,
    // because the route bends away from that side as it comes off the bar (125 to 150 m): a look released into that bend
    // adds its return to the bend's own turn (36 to 39 degrees a second on the seeds whose only such grove stood at 141
    // to 148 m); the groves of the bank therefore stand on the Elder's side wherever the land allows (see the groves),
    // and on every seed of 1-100 the look's giant stands at 150.7 m or later.  The look aims at the top of that grove's
    // giant, where it stands and as high as it stands (its mesh's own broken top).  Its window, in metres of route from
    // the giant's own station (groveS: the place abreast of its foot or its top, whichever comes first):
    //   it ends GROVE_END (1 m: the giant's half girth, 0.65 m, and a hand) before that station;
    //   at its full length it holds for one look-ahead (18 m: live's second at full weight takes 17 m at the bar's pace)
    //   between two ramps of a look-ahead and three eighths each (24.75 m: mend 1's own, kept);
    //   it never begins before the walker's look has ended (WALK_TO: mend 1 let the two overlap on seeds whose grove stands
    //   early, which halved the dip at the walker): where the grove stands too early for the full length the hold shortens
    //   first, then the ramps, and the look's WEIGHT is the share of the full length (67.5 m) that is left: a look that has
    //   less room takes less of the gaze, so a look with a short hold close to its grove never turns the view faster
    //   than a full one (NOTES.md, Mend 2: with the whole gaze at every length seed 93 turned 31.8 degrees a second).
    const GROVE_END = 1, GROVE_FULL = LOOK_AHEAD, GROVE_RAMP = 1.375 * LOOK_AHEAD, sGroveBy = sEld - LOOK_AHEAD;
    const lookable = lay.groves.map(lookOf).filter((k) => k.elderSide && k.q.d <= sGroveBy && k.s - GROVE_END - LOOK_AHEAD > WALK_TO);
    const gl = lookable.at(-1) ?? null, gv = gl ? gl.q : null, groveTop = gl ? gl.top : closeTop, groveS = gl ? gl.s : sBar;
    const GROVE_TO = groveS - GROVE_END, GROVE_FROM = Math.max(GROVE_TO - GROVE_FULL - 2 * GROVE_RAMP, Math.min(WALK_TO, GROVE_TO - LOOK_AHEAD)), GROVE_ROOM = GROVE_TO - GROVE_FROM;
    const GROVE_W = gl ? Math.min(1, GROVE_ROOM / (GROVE_FULL + 2 * GROVE_RAMP)) : 0, GROVE_FADE = Math.min(GROVE_RAMP, GROVE_ROOM / 2) / GROVE_ROOM;
    await ctx.yield();

    // ---- weather over the flight ----
    const fogA = new THREE.Color().setRGB(...U.uFogAway.value.toArray()).lerp(new THREE.Color().setRGB(...U.uFogSun.value.toArray()), 0.5);
    const fogB = new THREE.Color().setRGB(...lin(Mo.hor, 0.97).toArray());
    const amb0 = { sky: shared.uSky.value.clone().multiply(new THREE.Vector3(0.86, 0.96, 1.16)), fill: shared.uFill.value.clone().multiply(new THREE.Vector3(0.74, 0.84, 1.2)), warm: shared.uWarm.value.clone().multiplyScalar(1.0) };
    const amb1 = { sky: lin('#BFD3D6', 0.64), fill: lin('#8A86A6', 0.6), warm: lin(Mo.fogSun, 0.18) };
    const amb2 = { sky: lin('#BFD3D6', 0.56), fill: lin('#8A86A6', 0.52), warm: lin(Mo.fogSun, 0.21) };      // after the shower the key is a fifth stronger and the fill lower: gold lit sides, violet shade, to the ring
    const size = new THREE.Vector2(), camPos = new THREE.Vector3(), moteV = new THREE.Vector3(), lowTone = new THREE.Vector3(0.15, 0.135, 0.095);
    const elderTop = hero.anchors.top.clone().add(hero.object.position); elderTop.y *= 0.5;
    shared.uFogS.value.copy(U.uFogSun.value).multiplyScalar(1.05); shared.uFogA.value.copy(U.uFogAway.value).multiplyScalar(1.25); shared.uFogG.value.copy(U.uSunTint.value);
    const veilGain = V.rare ? 1.9 : 1.3, cum0 = U.uCum.value;
    // The golden opening is the live one (v is u moved on, so its keys keep their order: light down the drums, smoke, the bank
    // sliding off): every line of live's weather below that reads v or u is live's own, called as it stands.
    // n4 (I): THE TURN OF THE WEATHER hangs on two stations of the land and on nothing else: sBar (where braid K's last water
    // runs out on the bar) and sEld (the Elder's own station).  Between them lies the bank (sEld - sBar).  What the rain
    // does is given in shares of that bank (its fringe is a quarter of it: a shower's edge is as deep as a quarter of
    // its body, so that half the bank is full rain); what the sun does is given by the design's journey, in its own
    // distances before and after the pass of the Elder:
    //   J1 36.8 m before the pass the fog begins to slide;   J2 9.2 m before it sunlight walks down the rings and the top
    //   starts to smoke;   J3 27.6 m past it the turn opens the plain;   (36.8 m past it the bank is gone: live's own uBank lines, untouched).
    // The ramps, in route metres m (their ends on seed 7 stand in NOTES.md, THE WEATHER'S ENDS):
    //   rainUp   sBar .. sBar + fringe                     the shower comes on over its fringe
    //   rainDown sEld - J1 .. sEld - J1 + fringe           it goes as the fog begins to slide, over the same fringe
    //   sunBack  sEld - J1 .. sEld - J2                    the sun returns from the fog's first slide to the light on the rings
    //   tear     half a fringe before sEld - J1 .. half a fringe after: the bank tears open ahead before it leaves the lens
    //   smokeOff half a fringe before sBar .. half a fringe after: tops ahead of the lens stop smoking as the front crosses
    //   dry      sEld - J2 .. half way down the avenue ((sAve + sGate) / 2): drums dry in the sun through the turn
    //   lightDown sEld - J1 .. sEld                        the light walks down the drums and is at the foot at the pass
    //   shaftsOff sEld .. sEld + J3                        shafts stand in the torn bank and are gone where the plain opens
    //   sheet    half a fringe after sBar .. one fringe more   the gravel is wet through where the rain has come to half its strength (the
    //            middle of its fringe); from there the water gathers in the hollows over one fringe more, the depth of ground the shower
    //            itself took to come on; it stays (mend 1: one reason, written before its ends were computed; they fall where it puts them)
    //   drizzle  sBar .. half a fringe after (the first drops); back to spores with rainDown
    // THE EARLY SMOKE (a named departure from the journey): the journey has the top START to smoke 9.2 m before the pass;
    // here smoke and veil gain rise with the sun's return (sunBack), so every top smokes fully 9.2 m before the pass.
    const VKEY = [[0, 0.5], [0.1, 0.6], [0.4, 0.7], [0.6, 0.78], [1, 1]];
    const vOf = (u) => { for (let i = 0; i < VKEY.length - 1; i++) if (u <= VKEY[i + 1][0]) return lerp(VKEY[i][1], VKEY[i + 1][1], (u - VKEY[i][0]) / (VKEY[i + 1][0] - VKEY[i][0])); return 1; };
    const bankM = sEld - sBar, fringe = bankM / 4, J1 = 0.08 * JOURNEY, J2 = 0.02 * JOURNEY, J3 = 0.06 * JOURNEY;
    const WX = {
      rainUp: [sBar, sBar + fringe], rainDown: [sEld - J1, sEld - J1 + fringe], sunBack: [sEld - J1, sEld - J2], tear: [sEld - J1 - fringe / 2, sEld - J1 + fringe / 2],
      smokeOff: [sBar - fringe / 2, sBar + fringe / 2], dry: [sEld - J2, (sAve + sGate) / 2], lightDown: [sEld - J1, sEld], shaftsOff: [sEld, sEld + J3],
      sheet: [sBar + fringe / 2, sBar + fringe / 2 + fringe], drizzle: [sBar, sBar + fringe / 2],
    };
    const ramp = (k, m) => smoothstep(WX[k][0], WX[k][1], m);
    const weather = (u0) => {
      const u = clamp(u0, 0, 1), v = vOf(u), m = u * path.length;
      const rainUp = ramp('rainUp', m), rainDown = ramp('rainDown', m), sunBack = ramp('sunBack', m);
      const sq = rainUp * (1 - rainDown), bt = sunBack, tear = ramp('tear', m);
      const wetK = rainUp * (1 - 0.7 * ramp('dry', m)), smokeK = (1 - ramp('smokeOff', m)) + sunBack;
      const br = smoothstep(0.43, 0.59, v), clear = lerp(Mo.clear0, 1, smoothstep(0.0, 0.16, u)) * (1 - 0.44 * sq), inBank = smoothstep(0.05, 0.14, u) * (1 - br);
      hero.setState({ sun: lerp(Mo.sun0, 1, br) * lerp(1, 0.56, sq) * lerp(1, 1.2, bt), sunDown: Math.max(Mo.sun0 * 1.2, smoothstep(0.43, 0.56, v)) * (1 - 0.7 * rainUp * (1 - ramp('lightDown', m))),
        smoke: smoothstep(0.44, 0.6, v) * clamp(smokeK, 0, 1), wet: Math.max(Mo.wet * (1 - 0.3 * br), 0.95 * wetK) });
      shared.uVeilGain.value = veilGain * (V.rare ? 1 : lerp(0.5, 1, sunBack)); shared.uVeilLow.value = V.rare ? 0 : sunBack;        // thin pennants through the opening, the full veils with the sun's return: short, sinking, lying low (K1)
      U.uClear.value = clear; U.uMtn.value = lerp(Mo.mtn0, 1, smoothstep(0.42, 0.56, v));
      scene.fog.density = lerp(Mo.rho0 + Mo.bank * inBank, Mo.rho1, smoothstep(0.43, 0.6, v)) + 0.0046 * sq;
      scene.fog.color.copy(fogA).lerp(fogB, clear); shared.uFogK.value = sq;
      U.uLow.value.set(scene.fog.color.r, scene.fog.color.g, scene.fog.color.b).multiplyScalar(0.5).add(lowTone);
      shared.uSky.value.copy(amb0.sky).lerp(amb1.sky, br).lerp(amb2.sky, bt).multiplyScalar(1 + 0.22 * sq);
      shared.uFill.value.copy(amb0.fill).lerp(amb1.fill, br).lerp(amb2.fill, bt).multiplyScalar(1 + 0.1 * sq);
      shared.uWarm.value.copy(amb0.warm).lerp(amb1.warm, br).lerp(amb2.warm, bt).multiplyScalar(1 - 0.3 * sq);
      U.uCloud.value = 0.12 * smoothstep(0.56, 0.7, v);
      U.uBank.value.x = V.rare ? 20 * br : 60 * smoothstep(0.43, 0.63, v);
      U.uBank.value.y = V.rare ? 1 - 0.6 * smoothstep(0.44, 0.62, v) : 1 - 0.35 * smoothstep(0.5, 0.7, v);
      U.uCurtain.value = 260 * smoothstep(0.5, 0.66, v);
      U.uWall.value = smoothstep(0.44, 0.57, v) * (V.rare ? 0.7 : 1);
      U.uShaft.value = (V.mood === 'rain' ? 0.1 : 0.24) * (1 - smoothstep(0.5, 0.66, v)) + 0.46 * tear * (1 - ramp('shaftsOff', m));
      U.uRain.value = sq; U.uSq.value = sq; U.uWisp.value = 0.85 * sq; U.uTear.value = tear;
      U.uWetAll.value = Math.max(Mo.wet, 0.85 * ramp('sheet', m));                              // the flats keep their sheet water after the shower
      U.uCum.value = lerp(cum0, 1, 0.75 * sq);
      const spore = smoothstep(0.45, 0.54, v) * (1 - ramp('drizzle', m) * (1 - rainDown));
      U.uMote.value.set(spore, 0, 1 + 0.9 * sq);
      return spore;
    };
    // every fogged material fades to the fog's colour in its own direction while the shower lasts (cream and gold toward the sun, putty away)
    scene.traverse((o) => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) dirFog(m, shared); });
    weather(0);

    // what the proofs under verify-n4/ read (nothing in the flight reads this)
    scene.userData.n4 = { stations: { sBar, sEld, sAve, sGate, bridge: BR.s0, bridgeEnd: BR.s1 }, WX, groves: lay.groves, grove: gv, groveTop, looks: { groveS, lead: groveS - GROVE_FROM, end: GROVE_END, from: GROVE_FROM, to: GROVE_TO, weight: GROVE_W, off: gl ? gl.off : 0, lookable, all: lay.groves.map(lookOf), sGroveBy, walkFrom: WALK_FROM, walkTo: WALK_TO }, tally: lay.tally, fishN, shoal: E.shoal, spots, BK, WALK, walkAt, walkerAt, land, landMat, fallen: fallen ? fallen.mesh : null, elder, feet: lay.feet, posts: lay.posts, items: lay.items };
    return {
      scene, path, duration: 44, pace: paceAt,
      title: 'Pillars Before Trees · 400 million years ago',
      ride: 'none', companion: 'none',
      camera: { fov: 62, near: 0.2, nearThrough: 0.3, far: 3200, sway: 0.2, bank: 0.5, lookAhead: 18 },
      pois: [
        { at: () => gazeSea, from: 0.0, to: 0.1, weight: 0.88 },
        // n4 (C, mend 1): the look at the walker, in metres from the trunk's own ends.  The trunk lies in the route's own line,
        // so this look cannot turn the view aside as live's did (live's trunk lay beside the route): it can only draw it DOWN,
        // and only when the animal is near.  From one and a half look-aheads (27 m) before the broken end (the end then
        // comes into the gaze's own rest, 18 m down the route) to one lens height (0.9 m, the lens's height over the back)
        // before the near end of the walker's own beat: there the animal stands 45 degrees under the lens's level at the
        // nearest, and no weight is left when the lens could be over it.  The weight is the strongest any standing look of
        // live has (the Elder's top, 0.85), held until two lens heights before the window's end (WALK_FADE: its ramps are
        // 1.8 m each), so the view dips onto the trunk's back as the lens comes over the broken end.  Its target is the
        // walker where it is, at any clock.
        { at: (time) => walkerAt(time), from: WALK_FROM / path.length, to: WALK_TO / path.length, weight: 0.85, fade: WALK_FADE },
        // n4 (F, G; mend 2): the look at the grove's giant (see GROVE_END above)
        { at: groveTop, from: GROVE_FROM / path.length, to: GROVE_TO / path.length, weight: GROVE_W, fade: GROVE_FADE },
        { at: elderTop, from: 0.36, to: 0.575, weight: 0.85 },
        { at: () => gazeAve, from: 0.645, to: 0.74, weight: 0.4 },
        { at: closeTop, from: 0.8, to: 0.905, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 5.5, color: '#BFE9E4', glow: 1, revealDistance: 150 },
      post: { exposure: Mo.exposure, bloom: { strength: 0.35, radius: 0.6, threshold: 0.92 }, grade: { saturation: 1.06, contrast: 1.07, tint: '#fffdf8', shadowTint: '#0c0a14', vignette: 0.2, grain: 0.02 } },
      update(dt, time, camera, u) {
        const br = weather(u);
        hero.update(dt, time, camera);
        camPos.setFromMatrixPosition(camera.matrixWorld); field.update(camPos.x - elder.x, camPos.z - elder.z); setMirrors(camPos.x, camPos.z);
        let sw = 0;
        for (const sc of scorps) sw = Math.max(sw, sc.update(u, time) * (sc === scorps[0] ? 1 : 0));
        const lead = scorps[0];
        U.uScare.value.set(lead.pos.x, lead.pos.z, sw);
        for (let i = 0; i < scorps.length && i < 3; i++) { const sc = scorps[i]; U.uSea.value[i].set(sc.pos.x, sc.pos.z, sc.dir.x, sc.dir.y); U.uSeaK.value[i].set(sc.scale, 0.35 + 0.65 * sc.sw.v, 0, 0); }
        gazeSea.set(lead.pos.x, WATER, lead.pos.z); gazeAve.set(scorps[1].pos.x, WATER, scorps[1].pos.z);
        placeLand(time);
        // drizzle falls and drifts; spores ride the wind
        moteV.set(windXZ.x * lerp(0.5, 1.5, br), lerp(-2.4, 0.12, br), windXZ.y * lerp(0.5, 1.5, br));
        if (V.rare) moteV.set(0.02, lerp(-2.4, 0.3, br), 0.02);
        U.uMoteOff.value.addScaledVector(moteV, Math.min(dt, 0.1));
        ctx.renderer.getDrawingBufferSize(size); U.uRes.value.copy(size);
        carried.visible = u > 0 && !ctx.through;
      },
      dispose() { hero.dispose(); seaGeo.dispose(); },
    };
  },
};

// ------------------------------------------------------------------------------------------------
// The mass of the sward beyond arm's reach: one camera-facing card per clump (two triangles), on
// which a fan of forking leafless stems with rust tassels is drawn and cut out per pixel; stems widen
// to a pixel with distance so that far clumps hold together as a knee-high thicket.
// ------------------------------------------------------------------------------------------------
// n4 (H): where the cover stands wide.  This is live's own typed line, letter for letter (the bar and the Elder's flat, and
// the low pass down the avenue within 22 m of the route), held in ONE function and called by the clumps and by the mats.
const coverWide = (s, lat) => (s > 58 && s < 282) || (s > 300 && s < 400 && Math.abs(lat) < 22);
async function makeTuftCards(ctx, E, rng, band) {
  const { path, map, height, noise, detail, V } = E, want = Math.round(11500 * detail * clamp(E.density, 0.85, 1.08)), wantR = Math.round(13500 * detail * clamp(E.density, 0.85, 1.08)), wantM = Math.round(8000 * detail * clamp(E.density, 0.85, 1.08));
  const T = new Float32Array((want + wantR + wantM) * 4), R = new Float32Array((want + wantR + wantM) * 4); let n = 0;
  const Pp = new THREE.Vector3(), Tp = new THREE.Vector3(), tab = new Float32Array(502 * 5);       // the route every metre: point and heading (cheaper than asking the path 100,000 times)
  for (let i = 0; i < 502; i++) { path.posAtDist(i - 30, Pp); path.tangentAtDist(i - 30, Tp); tab.set([Pp.x, Pp.y, Pp.z, Tp.x, Tp.z], i * 5); if (i % 100 === 99) await ctx.yield(); }
  // distance to the route on a 4 m grid; the exact call is kept for the few candidates close to it
  const GX = 127, GZ = 120, gx0 = -332, gz0 = -402, gd = new Float32Array(GX * GZ);
  for (let j = 0; j < GZ; j++) {
    for (let i = 0; i < GX; i++) {
      const x = gx0 + i * 4, z = gz0 + j * 4; let best = 1e9, bk = 0;
      for (let k = 0; k < 502; k += 6) { const dx = tab[k * 5] - x, dz = tab[k * 5 + 2] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bk = k; } }
      for (let k = Math.max(0, bk - 6), k1 = Math.min(501, bk + 6); k <= k1; k++) { const dx = tab[k * 5] - x, dz = tab[k * 5 + 2] - z, d = dx * dx + dz * dz; if (d < best) best = d; }
      gd[j * GX + i] = Math.sqrt(best);
    }
    if (j % 4 === 3) await ctx.yield();
  }
  // the pillars' feet as flat arrays: some 280 feet are asked about for every card that gets this far
  const NF = E.feet.length, FF = new Float32Array(NF * 3); E.feet.forEach((p, i) => FF.set([p.x, p.z, (p.r + 0.35) * (p.r + 0.35)], i * 3));
  // n3: the feet sorted into the 4 m cells they can reach, so a card asks only the few feet of its own cell (the answer is the same)
  const cellFeet = new Array(GX * GZ), offGrid = [];
  for (let i = 0; i < NF * 3; i += 3) {
    const rr = Math.sqrt(FF[i + 2]), i0 = Math.floor((FF[i] - rr - gx0) / 4), i1 = Math.floor((FF[i] + rr - gx0) / 4), j0 = Math.floor((FF[i + 1] - rr - gz0) / 4), j1 = Math.floor((FF[i + 1] + rr - gz0) / 4);
    for (let j = j0; j <= j1; j++) for (let ii = i0; ii <= i1; ii++) {
      if (ii < 0 || ii >= GX || j < 0 || j >= GZ) { if (!offGrid.includes(i)) offGrid.push(i); continue; }
      const key = j * GX + ii; (cellFeet[key] || (cellFeet[key] = [])).push(i);
    }
  }
  const onFoot = (x, z) => {
    const ex = x - E.elder.x, ez = z - E.elder.z; if (ex * ex + ez * ez <= 4) return true;
    const ci = Math.floor((x - gx0) / 4), cj = Math.floor((z - gz0) / 4), a = ci < 0 || ci >= GX || cj < 0 || cj >= GZ ? offGrid : cellFeet[cj * GX + ci]; if (!a) return false;
    for (let q = 0; q < a.length; q++) { const i = a[q], dx = x - FF[i], dz = z - FF[i + 1]; if (dx * dx + dz * dz < FF[i + 2]) return true; }
    return false;
  };
  const distAt = (x, z) => {
    const fx = clamp((x - gx0) / 4, 0, GX - 1.001), fz = clamp((z - gz0) / 4, 0, GZ - 1.001), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * GX + i;
    return lerp(lerp(gd[k], gd[k + 1], u), lerp(gd[k + GX], gd[k + GX + 1], u), v);
  };
  for (let tries = 0; n < want && tries < want * 14; tries++) {
    const x = rng.range(-330, 170), z = rng.range(-400, 70), keep = rng(), sz = rng.range(0.55, 0.95), hs = rng.range(0.7, 1.05), seed = rng(), kind = rng();
    if (tries % 45 === 44) await ctx.yield();
    const w = map.at(x, z);
    const fe = (seed * 7.31) % 1, fo = (seed * 13.7) % 1;                    // k1b: the cover's margins are feathered: it thins to scattered outliers toward the water and toward the bare bar, no line
    if (w < 0.12 + 1.1 * fe * fe || w > 13.75 || w > band(x, z) * (0.7 + 0.55 * fo)) continue;      // (13.75: the band is never wider; spares the noise call for most of the plain)
    let pdist = distAt(x, z);
    if (pdist < 12) pdist = path.nearestXZ(x, z).dist;
    if (pdist < 4.5 || pdist > 190 || keep > 1.08 - smoothstep(6, 190, pdist) * 0.93) continue;
    if (keep * 0.7 > 0.3 + smoothstep(-0.35, 0.15, noise.fbm2(x * 0.09, z * 0.09 + 5, 2))) continue;
    if (onFoot(x, z)) continue;
    const far = 1 + smoothstep(25, 170, pdist) * 0.16, edge = 1 - 0.5 * smoothstep(1.5, 0.15, w);
    let gy = null;
    if (pdist < 22.6) {                                 // on the ribbon: path metre and side of this spot, then the meshed height
      let best = 1e9, bk = 0;
      for (let k = 0; k < 502; k += 4) { const dx = tab[k * 5] - x, dz = tab[k * 5 + 2] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bk = k; } }
      for (let k = Math.max(0, bk - 4), k1 = Math.min(501, bk + 4); k <= k1; k++) { const dx = tab[k * 5] - x, dz = tab[k * 5 + 2] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bk = k; } }
      const o = bk * 5, dx = x - tab[o], dz = z - tab[o + 2], tx = tab[o + 3], tz = tab[o + 4];
      gy = E.ribbonY(bk - 30 + dx * tx + dz * tz, dx * tz - dz * tx);
    }
    T.set([x, (gy ?? height(x, z)) - 0.03, z, sz * far * edge], n * 4); R.set([seed, hs, kind, 0], n * 4); n++;
  }
  // a second population close along the route: every water edge in view of the lens carries a continuous band,
  // and the bar the route crosses in the fog (path metres 96 to 215) is thicket from side to side
  for (let tries = 0, made = 0; made < wantR && tries < wantR * 10; tries++) {
    const s = rng.range(-30, 470), t = rng.range(-1, 1), lat = Math.sign(t) * (0.4 + Math.pow(Math.abs(t), 1.6) * 44), sz = rng.range(0.55, 0.95), hs = rng.range(0.7, 1.05), seed = rng(), kind = rng();
    if (tries % 45 === 44) await ctx.yield();
    const ti = Math.min(500, Math.floor(s + 30)), tf = s + 30 - ti, o = ti * 5;
    Pp.set(lerp(tab[o], tab[o + 5], tf), lerp(tab[o + 1], tab[o + 6], tf), lerp(tab[o + 2], tab[o + 7], tf)); Tp.set(lerp(tab[o + 3], tab[o + 8], tf), 0, lerp(tab[o + 4], tab[o + 9], tf));
    const x = Pp.x + Tp.z * lat, z = Pp.z - Tp.x * lat, w = map.at(x, z), inFog = coverWide(s, lat);      // and the low pass down the avenue
    const fe = (seed * 7.31) % 1, fo = (seed * 13.7) % 1;
    if (w < 0.12 + 1.1 * fe * fe || w > 18.75 || w > (band(x, z) + (inFog ? 4 : 0)) * (0.7 + 0.55 * fo)) continue;
    if (w > 3 && noise.fbm2(x * 0.055, z * 0.055 + 5, 2) < (inFog ? -0.38 : -0.22)) continue;                 // bare bars of crusted gravel show between
    if (Math.abs(lat) < 1.2 + 2.6 * (0.5 + 0.5 * noise.n2(x * 0.45, z * 0.45)) && Pp.y - height(x, z) < 1.18) continue;      // the clear strip under a low lens has a ragged edge: no track
    if (onFoot(x, z)) continue;
    T.set([x, (E.ribbonY(s, lat) ?? height(x, z)) - 0.03, z, sz * (1 - 0.5 * smoothstep(1.5, 0.15, w))], n * 4); R.set([seed, hs, kind, 0], n * 4); n++; made++;
  }
  const bare = [];
  // n2: the low mats: a third population within 16 m of the route, between and under the clumps, so the band is closed growth
  // from the water's edge to its ragged outer rim (same rules of place as the clumps: at the water only, never on a foot)
  for (let tries = 0, made = 0; made < wantM && tries < wantM * 10; tries++) {
    const s = rng.range(-30, 470), t = rng.range(-1, 1), lat = Math.sign(t) * (0.5 + Math.pow(Math.abs(t), 1.3) * 17), sz = rng.range(0.6, 1.0), hs = rng.range(0.7, 1.05), seed = rng(), kind = rng() * 0.7;
    if (tries % 45 === 44) await ctx.yield();
    const ti = Math.min(500, Math.floor(s + 30)), tf = s + 30 - ti, o = ti * 5;
    Pp.set(lerp(tab[o], tab[o + 5], tf), lerp(tab[o + 1], tab[o + 6], tf), lerp(tab[o + 2], tab[o + 7], tf)); Tp.set(lerp(tab[o + 3], tab[o + 8], tf), 0, lerp(tab[o + 4], tab[o + 9], tf));
    const x = Pp.x + Tp.z * lat, z = Pp.z - Tp.x * lat, w = map.at(x, z), inFog = coverWide(s, lat);
    if (w < 0.08 + 0.5 * ((seed * 7.31) % 1) || w > 19.5 || w > (band(x, z) + (inFog ? 4.6 : 0.6)) * (0.75 + 0.5 * ((seed * 13.7) % 1))) continue;      // k1b: the mats creep out as runners past the clumps on both margins
    if (w > 3 && noise.fbm2(x * 0.055, z * 0.055 + 5, 2) < (inFog ? -0.42 : -0.26)) continue;
    if (Math.abs(lat) < 0.8 + 1.6 * (0.5 + 0.5 * noise.n2(x * 0.45, z * 0.45)) && Pp.y - height(x, z) < 0.95) { if (bare.length < 6000) bare.push(x, z); continue; }      // no card under a low lens, but the ground there is still the mat
    if (onFoot(x, z)) continue;
    T.set([x, (E.ribbonY(s, lat) ?? height(x, z)) - 0.03, z, sz * (1 - 0.3 * smoothstep(1.0, 0.2, w))], n * 4); R.set([seed, hs, kind, 1], n * 4); n++; made++;
  }
  // the cover map: where clumps stand, the ground under them is dark and green (one byte per 1.25 m, bilinear splats)
  { const C = E.cover, N = E.COV, k = N / MAP.size;
    for (let i = 0, nb = bare.length / 2; i < n + nb; i++) {
      const bx = i < n ? T[i * 4] : bare[(i - n) * 2], bz = i < n ? T[i * 4 + 2] : bare[(i - n) * 2 + 1];
      const fx = (bx - map.x0) * k - 0.5, fz = (bz - map.z0) * k - 0.5, ix = Math.floor(fx), iz = Math.floor(fz), ux = fx - ix, uz = fz - iz;
      if (ix < 1 || iz < 1 || ix > N - 3 || iz > N - 3) continue;
      for (const [dx, dz, wgt] of [[0, 0, (1 - ux) * (1 - uz)], [1, 0, ux * (1 - uz)], [0, 1, (1 - ux) * uz], [1, 1, ux * uz]]) { const o = (iz + dz) * N + ix + dx; C[o] = Math.min(255, C[o] + 230 * wgt); }
      if (i % 1500 === 1499) await ctx.yield();
    }
    // n2: soften it (two passes of a 3x3 tent), so the green on the ground never ends on a texel's straight edge
    const tmp = new Uint8Array(N * N);
    for (let pass = 0; pass < 2; pass++) {
      for (let j = 1; j < N - 1; j++) {
        for (let i = 1, o = j * N + 1; i < N - 1; i++, o++) tmp[o] = (C[o] * 4 + (C[o - 1] + C[o + 1] + C[o - N] + C[o + N]) * 2 + C[o - N - 1] + C[o - N + 1] + C[o + N - 1] + C[o + N + 1] + 8) >> 4;
        if (j % 64 === 63) await ctx.yield();
      }
      C.set(tmp);
    }
    E.coverTex.needsUpdate = true; }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-2, 0, 0, 2, 0, 0, 0, 2, 0], 3)); g.setIndex([0, 1, 2]);      // n3: one triangle that holds the card's square (x -1..1, y 0..1); what lies outside is discarded: half the triangles, the same picture
  g.setAttribute('iT', new THREE.InstancedBufferAttribute(T.subarray(0, n * 4), 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(R.subarray(0, n * 4), 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...E.U, uTassel: { value: V.ripe ? 0.92 : 0.56 } }, fog: true, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 iT, iR; uniform vec3 uAxis; uniform float uTime, uWindSpeed; uniform vec2 uRes;
varying vec2 vC; varying vec3 vWp; varying vec4 vK;
#include <fog_pars_vertex>
void main(){
  vec3 c = iT.xyz; vec3 toC = cameraPosition - c; float dist = length(toC); toC.y = 0.; float l = length(toC);
  vec3 rt = l > 1e-3 ? vec3(toC.z, 0., -toC.x) / l : vec3(1., 0., 0.);
  float ya = (fract(iR.x * 37.7) - .5) * 1.5, yc = cos(ya), ys = sin(ya);            // polish 4: every clump stands at its own angle to the lens, so the stand never lines up in rows
  rt = vec3(rt.x * yc - rt.z * ys, 0., rt.x * ys + rt.z * yc);
  float mat = step(.5, iR.w);                                           // n2: the low mats between the clumps (young shoots, spiny Sawdonia): half the height, wider
  float w = iT.w * .95 * mix(1., 1.3, mat), h = iT.w * iR.y * .84 * mix(1., .5, mat);
  vec2 wd = uAxis.xz; float wl = length(wd); wd = wl > 1e-3 ? wd / wl : vec2(1., 0.);
  float run = dot(c.xz, wd) * .35 - uTime * uWindSpeed * .45;
  float gust = sin(run) * .6 + sin(run * 2.3 + c.x * .7) * .4;
  // n2: seen from above a clump leans its top away from the lens (it turns its face up to us), so that a stand looked down on
  // from one or two metres closes into a thicket and the soil never shows between upright cards as rows
  float el = clamp((cameraPosition.y - c.y) / max(dist, 1e-3), 0., .8) * (1. - smoothstep(30., 70., dist));
  vec3 away = l > 1e-3 ? -toC / l : vec3(0.);
  vec3 wp = c + rt * position.x * w + vec3(0., position.y * h * (1. - .25 * el), 0.) + away * position.y * h * el * 1.25;
  float y2 = position.y;                                              // linear, so the triangle carries exactly what the square's top edge had at y = 1
  wp.xz += wd * (.1 + .24 * gust) * y2 * h * min(uWindSpeed, 3.) * .7 + vec2(-wd.y, wd.x) * sin(uTime * 2.1 + c.x * 3. + iR.x * 20.) * .035 * y2;
  vC = vec2(position.x, position.y); vWp = wp;
  vK = vec4(iR.x, iR.z + 2. * mat, gust * y2, dist * 1.25 / max(uRes.y, 1.) / w);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSunDir, uSunCol, uSky, uFill, uWarm, uGreen, uRust, uSpore; uniform float uSun, uTassel;
varying vec2 vC; varying vec3 vWp; varying vec4 vK;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
float sdSeg(vec2 p, vec2 a, vec2 b){ vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0., 1.)); }
// Psilophyton drawn on the card: a wiry leafless stem that forks in a Y, each arm forking again, and a pair of
// drooping spindle tassels at each of the four tips.  q = (metres-ish from the foot, 0-1 of the plant's height).
vec3 forkPlant(vec2 q, float sd, float lw, float ys){
  float r1 = h21(vec2(sd, 1.)), r2 = h21(vec2(sd, 2.)), r3 = h21(vec2(sd, 3.)), r4 = h21(vec2(sd, 4.));
  q.x += (r1 - .5) * .08 * q.y;
  float h0 = .2 + .12 * r2, s1 = .11 + .05 * r3, s2 = .06 + .03 * r4;
  float d = sdSeg(q, vec2(0.), vec2(0., h0));
  float sg = q.x < 0. ? -1. : 1.;
  float h1 = h0 + .32 + .09 * sg * (r1 - .5) * 2.;
  vec2 p = vec2(abs(q.x), q.y);
  d = min(d, sdSeg(p, vec2(0., h0), vec2(s1, h1)));
  float sg2 = p.x < s1 ? -1. : 1.;
  float h2 = min(1., h1 + .24 + .08 * sg2 * (r3 - .5) * 2.);
  p = vec2(abs(p.x - s1), p.y);
  d = min(d, sdSeg(p, vec2(0., h1), vec2(s2, h2)));
  p = vec2(abs(p.x - s2), p.y);
  // k1b: no bloom on top.  Each tip forks a last time into two short branchlets that arch over (the crown of the plant is bare
  // green stem), and from the down-turned end of each hangs one spindle of spore cases: a pair of drooping tassels under every
  // tip, clear of it, never an upturned head (p.x is folded: one on each side)
  vec2 cr = vec2(.022, h2 - .004 * ys), hk = vec2(.04, h2 - .06 * ys);
  d = min(d, min(sdSeg(p, vec2(0., h2 - .05 * ys), cr), sdSeg(p, cr, hk)));
  vec2 ta = hk, tb = vec2(.047, hk.y - .2 * ys);
  float t = sdSeg(p, ta, tb), tl = clamp((ta.y - p.y) / max(ta.y - tb.y, 1e-4), 0., 1.);
  return vec3(step(d, lw) * step(q.y, 1.02), step(t, lw * .4 + .0095 * sin(3.1416 * tl * sqrt(tl))) * step(p.y, hk.y), sg * .5 + sg2 * .25 + .75);
}
// Drepanophycus on the card: an upright bottle-brush of short thorn leaves, half the height of the forking stems
vec3 brushPlant(vec2 q, float sd, float lw){
  float r1 = h21(vec2(sd, 5.)), r2 = h21(vec2(sd, 6.));
  float xx = q.x - (r1 - .5) * .1 * q.y * q.y, top = .32 + .4 * r2, keep = step(.4, h21(vec2(sd, 7.)));   // uneven heights and gaps: a wild stand, not a planted row
  float br = .027 * (.55 + .45 * step(.5, fract(q.y * 15. + sd))) * smoothstep(.0, .06, q.y) * (1. - smoothstep(top - .07, top, q.y));      // a cylinder of thorn leaves with a round tip, not a cone
  return vec3(step(abs(xx), lw * .6 + max(br, 0.)) * step(q.y, top) * keep, 0., .6 + .3 * r1);
}
// Sawdonia on the card: a short stem furred with spines that forks in a Y, each tip coiled over like a crozier
vec2 sawPlant(vec2 q, float sd, float lw){
  float r1 = h21(vec2(sd, 11.)), r2 = h21(vec2(sd, 12.));
  q.x += (r1 - .5) * .12 * q.y;
  float h0 = .26 + .2 * r2, sp = .14 + .06 * r1, h1 = .84, rr = .045;
  float fur = lw * (1. + .7 * step(.55, fract(q.y * 9. + sd)));
  float d = sdSeg(q, vec2(0.), vec2(0., h0));
  vec2 p = vec2(abs(q.x), q.y);
  d = min(d, sdSeg(p, vec2(0., h0), vec2(sp, h1)));
  float ring = abs(length((p - vec2(sp - rr, h1)) * vec2(1., .8)) - rr);
  float on = max(step(d, fur), step(ring, lw * .9) * step(h1 - rr * .4, p.y + step(sp - rr, p.x) * 9.));
  return vec2(on * step(q.y, 1.02), r1);
}
void main(){
  if (abs(vC.x) > 1. || vC.y > 1.) discard;                           // outside the card's square
  float x = clamp(vC.x, -1., 1.), y = clamp(vC.y, 0., 1.), seed = clamp(vK.x, 0., 1.) * 91.;
  float isMat = step(1.5, vK.y), kind = clamp(vK.y - 2. * isMat, 0., 1.), px = clamp(vK.w, 0., 1.);
  float lw = max(.014, px * 1.2);
  float edge = 1. - .3 * x * x;                                       // a little lower toward the clump's rim, never a dome
  float c1 = x * 2.1 + seed, i1 = floor(c1), g1 = h21(vec2(i1, seed)), t1 = edge * (.62 + .38 * g1);      // k1: two or three plants across a clump, each a wide candelabra of forks: at a glance a wiry forking bush, never a tuft of blades
  float c2 = x * 2.9 + seed * 1.7 + .37, i2 = floor(c2), g2 = h21(vec2(i2, seed + 9.)), t2 = edge * (.5 + .4 * g2);
  bool brush = kind > .74;
  vec3 f1, f2;
  if (isMat > .5) {                                     // the low mats: Sawdonia with its croziers, and bottle-brushes on their runners
    f1 = vec3(sawPlant(vec2((fract(c1) - .5) / 2., y / t1), i1 * 7.3 + seed, lw * 1.6).x, 0., .45);
    if (g2 > .45) f2 = vec3(brushPlant(vec2((fract(c2) - .5) / 4., y / t2 * .7), i2 * 5.1 + seed + 40., lw * .6).x, 0., .7);
    else f2 = vec3(sawPlant(vec2((fract(c2) - .5) / 2., y / t2), i2 * 5.1 + seed + 40., lw * 1.6).x, 0., .4);
  } else if (brush) {
    f1 = brushPlant(vec2((fract(c1 * 1.7) - .5) / 2.7, y / t1), floor(c1 * 1.7) * 7.3 + seed, lw);
    f2 = brushPlant(vec2((fract(c2 * 1.6) - .5) / 3.4, y / t2), floor(c2 * 1.6) * 5.1 + seed + 40., lw);
  } else {
    f1 = forkPlant(vec2((fract(c1) - .5) / 2., y / t1), i1 * 7.3 + seed, lw, 1. / t1);
    f2 = forkPlant(vec2((fract(c2) - .5) / 2.3, y / t2), i2 * 5.1 + seed + 40., lw, 1. / t2);
  }
  float patchN = vn2(vWp.xz * .09 + 3.), patchR = vn2(vWp.xz * .06 + 9.);
  float tk = uTassel * mix(1., .5, smoothstep(.008, .04, px)) * mix(.5, 1.3, smoothstep(.3, .75, patchR));
  f1.y *= step(h21(vec2(i1, seed + 3.) + floor(f1.z * 4.)), tk * .8); f2.y *= step(h21(vec2(i2, seed + 4.)), tk);
  float on1 = max(f1.x, f1.y), on2 = max(f2.x, f2.y);
  // k1: the foot of every clump is Sawdonia and Drepanophycus, never a blade: two ranks of short forked stems with crozier
  // tips and upright bottle-brushes, as many and as high as the fringe of shoots they replace
  float lwS = max(.026, px * 2.2);
  float uc = x * 5.3 + seed * 3.1, ui = floor(uc);
  float uh = (.2 + .2 * h21(vec2(ui, seed + 2.)) + .08 * vn2(vec2(x * 2.3 + seed, 1.))) * edge * (1. - .4 * x * x);
  float und = sawPlant(vec2((fract(uc) - .5) / 2., y / max(uh, .03)), ui * 3.7 + seed, lwS).x;
  float uc2 = x * 3.7 + seed * 5.7 + .5, ui2 = floor(uc2);
  float uh2 = (.26 + .24 * h21(vec2(ui2, seed + 6.))) * edge * (1. - .5 * x * x);
  vec2 q2 = vec2((fract(uc2) - .5) / 2., y / max(uh2, .03));
  float und2 = h21(vec2(ui2, seed + 8.)) > .5 ? sawPlant(q2, ui2 * 5.3 + seed, lwS * .8).x : brushPlant(vec2(q2.x * .5, q2.y * .7), ui2 * 5.3 + seed, lwS * .4).x;
  und = max(und, und2) * step(abs(x), .97);
  if (max(max(on1, on2), und) * step(.012, vC.y) < .5) discard;
  float low = und * (1. - max(on1, on2));
  float front = on1, hsh = mix(g2, g1, front), tas = mix(f2.y, f1.y, front);
  float hgt = clamp(mix(y / t2, y / t1, front), 0., 1.) * mix(.72, 1., front);
  vec3 green = uGreen * vec3(.76, .9, .98) * mix(.7, 1.05, smoothstep(.25, .7, patchN)) * mix(.66, 1.08, hgt) * mix(.78, 1.16, hsh) * mix(vec3(1.), vec3(.94, .98, .8), step(.72, kind)) * mix(vec3(1.), vec3(1.1, 1.04, .82), step(kind, .2));
  green = mix(green, uSpore * vec3(.7, .75, .6) + green * .45, uTassel * .38 * smoothstep(.012, .05, px) * smoothstep(.3, 1., hgt) * (1. - isMat) * smoothstep(.3, .75, patchR));      // k1b: far off the ripe tops are a soft russet bloom on the green, not a speckle
  green = mix(green, uGreen * vec3(.6, .78, .62) * mix(.7, 1.1, hgt), isMat * (1. - step(.6, mix(f2.z, f1.z, front))));          // Sawdonia is the darker green
  vec3 alb = mix(green, mix(uSpore * vec3(.74, .56, .45), green, .1 + .62 * smoothstep(.01, .07, px)), tas);          // far off the tassels are a russet haze in the green, not dots
  alb = mix(alb, uGreen * vec3(.52, .7, .56) * mix(.55, 1.05, clamp(y / max(uh2, .05), 0., 1.)) * mix(.8, 1.2, h21(vec2(ui, seed))), low);
  vec3 ray = normalize(vWp - cameraPosition + vec3(0., 1e-5, 0.));
  float back = max(dot(ray, uSunDir), 0.); back *= back;
  vec3 col = alb * (uSunCol * uSun * (.3 + .6 * back) * mix(.55, 1., hgt) + (uSky + uFill) * .8 + uWarm * (.35 + .3 * hgt));
  gl_FragColor = vec4(col * mix(.9, 1., hgt) * (1. + .42 * clamp(vK.z, -1.5, 1.5)), 1.);
  #include <fog_fragment>
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.name = 'swardCards';
  return { mesh, triangles: n };
}

// ------------------------------------------------------------------------------------------------
// Sun shafts: a dozen pale slanting bars of light standing in the fog, all parallel to the sun's
// direction (the sun is far: nothing fans from a point), each a ribbon turned to the lens about that
// axis, drifting slowly downwind and breathing.  uShaft = amount.  One draw call, additive.
// ------------------------------------------------------------------------------------------------
function makeShafts(E, rng) {
  const { path } = E, n = 16, A = new Float32Array(n * 4), B = new Float32Array(n * 4), P = new THREE.Vector3(), T = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    const d = 30 + (i / n) * 300 + rng.range(-8, 8), lat = (i % 2 ? 1 : -1) * rng.range(16, 60) * (i % 4 < 2 ? 1 : 0.6);
    path.posAtDist(d, P); path.tangentAtDist(d, T);
    A.set([P.x - T.z * lat, 0, P.z + T.x * lat, rng.range(2.2, 6.5)], i * 4); B.set([rng.range(46, 80), rng(), rng.range(0.6, 1), 0], i * 4);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...E.U }, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
attribute vec4 iA, iB; uniform vec3 uSunDir; uniform vec4 uBank; uniform float uTime, uWindSpeed;
varying vec2 vC; varying vec3 vK;
void main(){
  float tw = fract(uTime * uWindSpeed * .004 + iB.y);
  vec3 base = vec3(iA.x, -1., iA.z) + vec3(uBank.z, 0., uBank.w) * (tw - .5) * 60.;
  vec3 c = base + uSunDir * position.y * iB.x;
  vec3 toC = cameraPosition - c; vec3 sd = cross(uSunDir, toC); float sl = length(sd);
  sd = sl > 1e-3 ? sd / sl : vec3(1., 0., 0.);
  vec3 wp = c + sd * position.x * iA.w * (1. + .5 * position.y);
  vC = vec2(position.x, position.y);
  float dist = length(cameraPosition - (base + uSunDir * iB.x * .35));
  vK = vec3(iB.z * sin(tw * 3.14159) * smoothstep(9., 30., dist) * (1. - smoothstep(150., 260., dist)), iB.y * 40., iA.w);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSunTint; uniform float uShaft, uTime;
varying vec2 vC; varying vec3 vK;
${GLSL_NOISE}
void main(){
  float x = clamp(vC.x, -1., 1.), y = clamp(vC.y, 0., 1.), e = 1. - x * x; e *= e;
  float streak = .55 + .45 * vn2(vec2(x * 2.4 + vK.y, y * 1.3 - uTime * .05 + vK.y));
  float a = e * smoothstep(0., .1, y) * (1. - smoothstep(.45, 1., y)) * streak * clamp(vK.x, 0., 2.) * uShaft;
  gl_FragColor = vec4(uSunTint * a, 0.);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5.5; mesh.name = 'shafts';
  return mesh;
}

// ------------------------------------------------------------------------------------------------
// The curtain: one thick fold of the bank standing before the ring on every line of sight from the
// first half of the route, the colour of the fog behind it, so that the way out is not given away
// before the turn.  It writes depth (the ring is drawn by the engine) and slides off with the bank.
// ------------------------------------------------------------------------------------------------
function makeCurtain(E, ring) {
  const cx = ring.x + 0.8 * 45, cz = ring.z + 0.6 * 45, hw = 52, H = 19, pos = [], uv = [], idx = [], NX = 12;
  for (let i = 0; i <= NX; i++) {
    const t = i / NX * 2 - 1, bow = 9 * (1 - t * t);                     // bowed toward the viewer's side
    for (const y of [0, 1]) { pos.push(cx - 0.6 * hw * t + 0.8 * bow, -1.5 + y * H, cz + 0.8 * hw * t + 0.6 * bow); uv.push(t, y); }
  }
  for (let i = 0; i < NX; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...E.U }, fog: true, transparent: true, depthWrite: true, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
uniform vec4 uBank; uniform float uCurtain; varying vec2 vC; varying vec3 vWp;
#include <fog_pars_vertex>
void main(){
  vec3 wp = position + vec3(uBank.z, 0., uBank.w) * uCurtain;
  vC = uv; vWp = wp;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec4 uBank; uniform vec3 uSunCol; uniform float uSun, uCurtain;
varying vec2 vC; varying vec3 vWp;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_SKY}
${GLSL_FOGGED}
void main(){
  float x = vC.x, y = vC.y;
  float torn = fbm2(vec2(x * 5. + uTime * .01, 3.7));
  float topY = .78 + .2 * torn;
  float a = (1. - smoothstep(.8, 1., abs(x))) * (1. - smoothstep(topY - .1, topY, y)) * smoothstep(0., .05, y);
  vec3 ray = vWp - cameraPosition; float dist = length(ray); ray /= max(dist, 1e-4);
  a *= smoothstep(20., 60., dist) * (1. - smoothstep(40., 150., uCurtain));
  if (a < .03) discard;
  vec3 base = skyCol(normalize(vec3(ray.x, .05, ray.z)), 0.);
  float lit = smoothstep(topY - .45, topY, y);
  vec3 col = base * mix(.94, 1.06, lit) + (uSunCol * uSun * .3) * lit * lit;
  col = mix(col, base, fogAmount(vFogDepth) * .7);
  gl_FragColor = vec4(col * a, a);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; mesh.name = 'curtain';
  return mesh;
}

// ------------------------------------------------------------------------------------------------
// n3 (from k1b's makeWisps): low mist beside the route, most of it over water: soft cards a few metres
// high that drift downwind and are renewed upwind, fading near the lens and toward their edges.  In the
// shower of the middle stretch they swell into a luminous bank (uSq) and tear open as it clears (uTear).
// uWisp = amount.  One draw call.
// ------------------------------------------------------------------------------------------------
function makeWisps(E, rng) {
  const { path, map } = E, n = Math.round(64 * Math.max(E.detail, 0.7)), A = new Float32Array(n * 4), B = new Float32Array(n * 4), P = new THREE.Vector3(), T = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    let x = 0, z = 0;
    for (let t = 0; t < 12; t++) {
      const d = (i + rng()) / n * 480 - 5, lat = rng.sign() * rng.range(10, 48);
      path.posAtDist(clamp(d, 0, 460), P); path.tangentAtDist(clamp(d, 0, 460), T);
      x = P.x - T.z * lat; z = P.z + T.x * lat;
      if (map.at(x, z) < 7 || t > 8) break;                                   // most of them over or beside water
    }
    A.set([x, -0.5, z, rng.range(9, 21)], i * 4); B.set([rng.range(1.7, 3.6), rng(), rng.range(0.55, 1), rng.range(0.6, 1.4)], i * 4);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4)); g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU(), ...E.U }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
attribute vec4 iA, iB; uniform vec4 uBank; uniform float uTime, uWindSpeed, uSq;
varying vec2 vC; varying vec3 vWp; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  float tw = fract(uTime * uWindSpeed * .006 * iB.w + iB.y);
  vec3 c = iA.xyz + vec3(uBank.z, 0., uBank.w) * (tw - .5) * 46.;
  vec3 toC = cameraPosition - c; toC.y = 0.; float l = length(toC);
  vec3 rt = l > 1e-3 ? vec3(toC.z, 0., -toC.x) / l : vec3(1., 0., 0.);
  float sq = clamp(uSq, 0., 1.);
  vec3 wp = c + rt * position.x * iA.w * (1. + .5 * sq) + vec3(0., position.y * iB.x * (1. + 1.3 * sq), 0.);      // n3: in the shower the wisps swell into a low bank, three to eight metres high
  vC = position.xy; vWp = wp; vK = vec3(iB.y * 53., iB.z * sin(tw * 3.14159), iA.w / max(iB.x, .5));
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform vec3 uSunCol; uniform float uSun, uWisp, uTear;
varying vec2 vC; varying vec3 vWp; varying vec3 vK;
#include <common>
#include <fog_pars_fragment>
${GLSL_NOISE}
${GLSL_SKY}
${GLSL_FOGGED}
void main(){
  float x = clamp(vC.x, -1., 1.), y = clamp(vC.y, 0., 1.), sd = clamp(vK.x, 0., 60.), kz = clamp(vK.z, 0., 40.);
  float torn = fbm2(vec2(x * .3 * kz + sd + uTime * .02, sd * .3));
  float topY = .4 + .58 * torn;
  float ex = 1. - x * x; ex *= ex;
  float body = ex * smoothstep(0., .22, y) * (1. - smoothstep(topY - .4, topY, y));
  float wisp = fbm2(vec2(x * .45 * kz - uTime * .05 + sd, y * 1.7 + sd + uTime * .03));
  vec3 ray = vWp - cameraPosition; float dist = length(ray); ray /= max(dist, 1e-4);
  float tear = clamp(uTear, 0., 1.);                                   // n3: as it clears the bank is eaten from inside: holes open and widen, the rest thins
  float a = body * smoothstep(.1 + .5 * tear, .75 + .2 * tear, wisp + .22) * smoothstep(7., 22., dist) * (1. - smoothstep(60., 130., dist)) * clamp(vK.y, 0., 1.) * uWisp;
  if (a < .004) discard;
  vec3 base = skyCol(normalize(vec3(ray.x, .05, ray.z)), 0.);
  float lit = smoothstep(topY - .55, topY, y);
  vec2 sh2 = uSunDir.xz / max(length(uSunDir.xz), 1e-4); float toSun = max(dot(ray.xz / max(length(ray.xz), 1e-4), sh2), 0.);
  vec3 col = base * mix(.82, 1.1, lit) * mix(.92, 1.08, wisp) + uSunCol * (.25 + uSun) * (.1 + .5 * toSun * toSun) * lit;
  col = mix(col, base, fogAmount(vFogDepth) * .6);
  gl_FragColor = vec4(clamp(col, 0., 8.) * a, a);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 5.2; mesh.name = 'wisps';
  return mesh;
}
