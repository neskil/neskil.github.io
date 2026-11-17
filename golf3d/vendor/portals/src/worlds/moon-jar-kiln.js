// FIRE OF THE MOON JARS: from a snowbound Joseon pottery yard of raw white jars, in at the firebox of a climbing
// kiln, uphill through twelve chambers of porcelain moon jars lighting like lanterns under a river of flame, once
// round the largest jar as its glaze melts, and out up the flue into the weather. Built 20 x life size for a
// sparrow-sized camera. The kiln, its jars and its fire are the hero (src/parts/moon-jar-kiln.js); this file
// builds the yard (snowfield, drying boards with 36 raw jars, the thatched shed climbing the hill, the wall of
// split pine, the persimmon tree, far pines, grass, birds, snow, steam), routes the flight and keys the fire.
//
// World space = the hero's local space: origin at the fire mouth's sill, the yard toward +z, the kiln toward -z.
//
// Flight (u = fraction of the 930 m path; every moment inside the kiln is keyed to the u of the path's own control
// points, sampled at build, so the numbers below move with the path):
//   0-0.09    the yard at 9 m, slow: the aisle between two drying boards, raw jars 7 m either side at belly
//             height, sparrows hopping jar to jar ahead of us, dead ahead the fire mouth in its lit brick front
//             (stacked pine, the wicket's door bricks, a stone step, a stoking pole)
//   0.047-0.088 the magpie leaves the wood stack and crosses the path 30 m ahead
//   0.061-0.11 snow slides off the eave as we pass under it; 0.091-0.145 the sparrows peel away up and left
//   0.124     the fire mouth: the bed's flames part to the sides, chamber 1 shows through the first arch
//   0.09      two more raw jars on sawn stumps stand either side of the aisle's end and frame the fire mouth: the
//             sparrows' last perch before they peel away
//   0.161-0.19 chamber 1, low, the gaze tilted up at the river of flame on the crown
//   0.19-0.212 the arch into chamber 2: the gaze steeply up at the long licks wandering along the crown, jar tops
//             along the bottom of the frame
//   0.215-0.28 chamber 2 and the wide arch into chamber 3 are flown low, at the height of the jars: the gaze goes left
//             down chamber 3's left-hand rank, where the melt line is crossing the jars (gold nearest, half-melted
//             next, chalk beyond), the river above them, the next arch to the right; then round onto them side-on
//             (a pine split comes in through the stoke port above that rank, in the air, catching, 0.225-0.261)
//   0.28-0.32 the arch into chamber 4, high on the left: the gaze right, across its right-hand rank and the cold shaft
//   0.32-0.39 chamber 4's upper half and chamber 5, the gaze ahead: nested arches, the second pine split falling
//             through the chalk ranks on the left (in the air 0.313-0.35); the arch into chamber 6 is taken high,
//             the gaze over a gold rank to the great jar
//   0.39-0.435 chamber 6: nested arches, the great jar chalk-white in the last of them under cold shafts
//   0.435     the great chamber (101 m wide, 58 m high), at a third of the speed; the great jar's melt line starts
//             at the lip, stands on the shoulder at 0.459, lantern by 0.570; the turn 0.459-0.607 is a rising spiral
//             (cones bow at 0.489, 0.507, 0.524): out over the right-hand rank to the uphill corner 23 m up, where at
//             0.50-0.54 the whole chamber lies below (the jar white-hot at the shoulder, both ranks, the shafts, the
//             arch of the fired kiln), down the left side, and at 0.59-0.64 the jar close and whole, a crazed gold
//             lantern against the upper wall with the flame coming over it; 0.64-0.68 the upper arch square in the frame
//   0.545     RARE (ctx.vary.rare): the fifth jar of the first rank on the left folds at the waist (0.533-0.579) and
//             goes down into a glowing puddle with a dark crust, in a burst of flame and a fan of sparks; the gaze
//             follows it 0.510-0.612
//   0.685     the upper arch; 0.69-0.725 chamber 8, low on the left, the gaze well round to the right and up: its
//             rank of gold lanterns from below their shoulders; 0.73-0.775 chamber 9, the gaze left and a little up,
//             side-on to its gold lanterns, the tongues of arch 9 over them;
//             0.772-0.82 the gaze swings left onto the first rank of chamber 10 as the front goes over it (near
//             jars gold and mid-melt, far ranks chalk); about 0.81 we pass the front, which stalls at d = 464.
//   0.835-0.931 the quiet hall: chambers 11 and 12 with no wall between them, flown 17 to 27 m up so that the two
//             ranks are seen over their terraces: chalk moon jars and small ware turn about on their setters,
//             ember-red on the belly and cool on the shoulder, the terraces' cut faces red, two slants of cold
//             daylight crossing under the flue's soot-black bell, the sky's square in the middle
//   0.931-1   the flue at 40 degrees: a bell of fire brick with ember joints, then soot in long streaks with runs of
//             ash glass and only a few seams still glowing, then a frosted rim that takes the sky's colour; snow (or leaves) coming down, sparks going up
//             with us to the portal
// Looks by seed: snowfall by day | bright morning after the storm (low sun, long blue shadows, icicles, glitter)
// | late-autumn dusk before the snow (frost, falling leaves, forty persimmons) | clear night after snow (stars,
// flame jets at the spy holes, no sparrows). Each look also sets the kiln's inside: the fire's colour (dusk redder,
// night paler), the haze, and how far down the chambers the flue's light reaches (night: a long blue reach). The
// hero varies its cast per seed: which ranks are jars, saggar stacks or tiers of bowls.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, hashSeed } from '../kit/core.js';
import { makeSky, skyDirection } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, latheGeometry, jarProfile } from '../parts/moon-jar-kiln.js';

const PI = Math.PI, TAU = PI * 2, V3 = THREE.Vector3;
const PALETTE = ['#EDF3F9', '#8097B4', '#1A1210', '#FFF2C4', '#FF9B30', '#A6261A', '#6E4B38'];
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---- the four looks. Light values are linear; sky = light from above, gnd = light from below.
const LOOKS = [
  { name: 'snowfall', snow: 1, sky: { preset: 'overcast', zenith: '#dfe8f2', mid: '#bccbdd', horizon: '#8da3bf', ground: '#8097B4', sunIntensity: 0, sunGlow: 0, veil: 0, scatter: 0, clouds: false, clouds2: false },
    fog: '#b9c8da', fogD: 0.0040, skyC: [0.80, 0.88, 1.0], gndC: [0.44, 0.52, 0.66], sunC: [0.10, 0.10, 0.09], sunDir: skyDirection(55, -150), fire: [3.4, 1.6, 0.52], shadow: 0, sparkle: 0.15, drift: [0.12, 1],
    flue: '#a4c0ec', jets: 0, sparrows: 5, fruit: 6, exposure: 1.0, portal: '#d8e8ff', warmth: 0, haze: 1, reach: 160 },
  { name: 'morning', snow: 1, sky: { preset: 'day', zenith: '#4f86c8', mid: '#9cc0e6', horizon: '#f2dcc0', ground: '#c9d6e6', sunElevation: 19, sunAzimuth: -150, sunColor: '#ffe2b0', sunIntensity: 9, sunGlow: 0.6, scatterColor: '#ffd9a8', scatter: 0.4, clouds: false, clouds2: { coverage: 0.3, stretch: 1, opacity: 0.5 } },
    fog: '#d3deeb', fogD: 0.0024, skyC: [0.42, 0.56, 0.86], gndC: [0.36, 0.42, 0.56], sunC: [1.0, 0.80, 0.52], sunDir: skyDirection(19, -150), fire: [2.2, 1.05, 0.36], shadow: 1, sparkle: 1, drift: [0.45, 0.55],
    flue: '#d6e6ff', jets: 0, sparrows: 5, fruit: 6, exposure: 0.96, portal: '#cfe6ff', warmth: -0.5, haze: 0.8, reach: 185 },
  { name: 'dusk', snow: 0.16, sky: { preset: 'sunset', zenith: '#5d6688', mid: '#9a8798', horizon: '#dba392', ground: '#6b6470', sunElevation: -5, sunAzimuth: 30, sunIntensity: 0, sunGlow: 0.25, scatterColor: '#ff9e86', scatter: 0.5, clouds: false, clouds2: { coverage: 0.42, stretch: 1, opacity: 0.7, lit: '#f6b9a6', shade: '#7a6c86' } },
    fog: '#a98f97', fogD: 0.0034, skyC: [0.50, 0.44, 0.56], gndC: [0.32, 0.25, 0.26], sunC: [0.30, 0.16, 0.12], sunDir: skyDirection(8, 30), fire: [2.9, 1.35, 0.45], shadow: 0, sparkle: 0.3, drift: [0.5, 0],
    flue: '#c394d6', jets: 0.35, sparrows: 5, fruit: 40, exposure: 1.05, portal: '#ffd6c8', warmth: 0.75, haze: 1.4, reach: 160 },
  { name: 'night', snow: 1, sky: { preset: 'night', zenith: '#040917', mid: '#0a1430', horizon: '#1a2a4c', ground: '#0d1526', bodies: [], stars: 1.15, twinkle: 0.9, milkyWay: 0.55, clouds: false, clouds2: false },
    fog: '#0c1426', fogD: 0.0030, skyC: [0.085, 0.13, 0.26], gndC: [0.035, 0.05, 0.10], sunC: [0.05, 0.07, 0.13], sunDir: skyDirection(40, -120), fire: [4.2, 1.9, 0.6], shadow: 0, sparkle: 0.8, drift: [0.5, 0.85],
    flue: '#3d62e6', jets: 1, sparrows: 0, fruit: 6, exposure: 1.08, portal: '#9fb8ff', warmth: -0.85, haze: 0.66, reach: 270 },
];
const HOURS = { day: 0, dawn: 1, golden: 2, night: 3 };

// ---- yard geometry writer: position, normal, uv (metres), color, aAux (material, snow weight, sway), in a frame
class YB {
  constructor(two = false) { this.p = []; this.n = []; this.uv = []; this.c = []; this.a = []; this.i = []; this.c2 = two ? [] : null; this.count = 0; this.fr = [0, 0, 0, 1, 0]; this.col2 = [0, 0, 0]; }
  at(x = 0, y = 0, z = 0, yaw = 0) { this.fr = [x, y, z, Math.cos(yaw), Math.sin(yaw)]; return this; }
  v(x, y, z, nx, ny, nz, u, v, col, mat, snow = 1, sway = 0) {
    const f = this.fr, c = f[3], s = f[4];
    this.p.push(f[0] + x * c + z * s, f[1] + y, f[2] - x * s + z * c); this.n.push(nx * c + nz * s, ny, -nx * s + nz * c);
    this.uv.push(u, v); this.c.push(col[0], col[1], col[2]); this.a.push(mat, snow, sway); if (this.c2) this.c2.push(this.col2[0], this.col2[1], this.col2[2]);
    return this.count++;
  }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // a flat quad from four corners (counter-clockwise seen from its normal side), uv given per corner
  face(P, uvs, col, mat, snow = 1, sway = 0) {
    const ux = P[1][0] - P[0][0], uy = P[1][1] - P[0][1], uz = P[1][2] - P[0][2], vx = P[3][0] - P[0][0], vy = P[3][1] - P[0][1], vz = P[3][2] - P[0][2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const id = P.map((q, k) => this.v(q[0], q[1], q[2], nx, ny, nz, uvs[k][0], uvs[k][1], Array.isArray(col[0]) ? col[k] : col, mat, Array.isArray(snow) ? snow[k] : snow, Array.isArray(sway) ? sway[k] : sway));
    this.quad(id[0], id[1], id[2], id[3]);
  }
  // box centred at (cx,cy,cz), turned by yaw; grain (uv.x) runs along its longest horizontal axis; taper narrows the top
  box(cx, cy, cz, sx, sy, sz, yaw, col, mat, snow = 1, taper = 1, endMat = mat) {
    const c = Math.cos(yaw), s = Math.sin(yaw), hx = sx / 2, hy = sy / 2, hz = sz / 2, o = cx * 3.7 + cz * 1.9 + cy;
    const P = (x, y, z) => { const t = y > 0 ? taper : 1; return [cx + x * t * c + z * t * s, cy + y, cz - x * t * s + z * t * c]; };
    const longX = sx >= sz, dark = mul(col, 0.62);
    const F = (a, b, d, e, uvs, m, cc = col) => this.face([a, b, d, e], uvs, cc, m, snow);
    const L = longX ? sx : sz, W = longX ? sz : sx;
    const uvTop = longX ? [[o, 0], [o + L, 0], [o + L, W], [o, W]] : [[o, 0], [o, W], [o + L, W], [o + L, 0]];
    F(P(-hx, hy, hz), P(hx, hy, hz), P(hx, hy, -hz), P(-hx, hy, -hz), longX ? uvTop : [[o, 0], [o, W], [o + L, W], [o + L, 0]], mat);
    F(P(-hx, -hy, -hz), P(hx, -hy, -hz), P(hx, -hy, hz), P(-hx, -hy, hz), uvTop, mat, dark);
    const sideX = [[o, W], [o + L, W], [o + L, W + sy], [o, W + sy]], endUv = [[-W / 2, -hy], [W / 2, -hy], [W / 2, hy], [-W / 2, hy]];
    F(P(-hx, -hy, hz), P(hx, -hy, hz), P(hx, hy, hz), P(-hx, hy, hz), longX ? sideX : endUv, longX ? mat : endMat);
    F(P(hx, -hy, -hz), P(-hx, -hy, -hz), P(-hx, hy, -hz), P(hx, hy, -hz), longX ? sideX : endUv, longX ? mat : endMat);
    F(P(hx, -hy, hz), P(hx, -hy, -hz), P(hx, hy, -hz), P(hx, hy, hz), longX ? endUv : sideX, longX ? endMat : mat);
    F(P(-hx, -hy, -hz), P(-hx, -hy, hz), P(-hx, hy, hz), P(-hx, hy, -hz), longX ? endUv : sideX, longX ? endMat : mat);
  }
  // tapered tube from a to b (arrays), uv.x along its length; sway weights at both ends; rings > 1 bends it by `bow`
  tube(a, b, r0, r1, seg, col, mat, snow = 1, sw0 = 0, sw1 = 0, caps = false, col1 = col) {
    const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], len = Math.hypot(dx, dy, dz) || 1, ax = [dx / len, dy / len, dz / len];
    let ux = ax[1], uy = -ax[0], uz = 0; if (Math.abs(ax[2]) > 0.9 || Math.hypot(ux, uy) < 0.2) { ux = 0; uy = ax[2]; uz = -ax[1]; }
    const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
    const wx = ax[1] * uz - ax[2] * uy, wy = ax[2] * ux - ax[0] * uz, wz = ax[0] * uy - ax[1] * ux, base = this.count, o = a[0] * 1.3 + a[2] * 0.7;
    for (let e = 0; e < 2; e++) for (let k = 0; k <= seg; k++) {
      const th = k / seg * TAU, cs = Math.cos(th), sn = Math.sin(th), r = e ? r1 : r0, q = e ? b : a;
      const nx = ux * cs + wx * sn, ny = uy * cs + wy * sn, nz = uz * cs + wz * sn;
      this.v(q[0] + nx * r, q[1] + ny * r, q[2] + nz * r, nx, ny, nz, o + e * len, th * Math.max(r0, r1), e ? col1 : col, mat, snow, e ? sw1 : sw0);
    }
    for (let k = 0; k < seg; k++) { const p = base + k, q = p + seg + 1; this.i.push(p, q, p + 1, p + 1, q, q + 1); }
    if (caps) for (let e = 0; e < 2; e++) {
      const q = e ? b : a, r = e ? r1 : r0, sgn = e ? 1 : -1, cb = this.count;
      this.v(q[0], q[1], q[2], ax[0] * sgn, ax[1] * sgn, ax[2] * sgn, 0, 0, e ? col1 : col, caps === true ? mat : caps, snow, e ? sw1 : sw0);
      for (let k = 0; k <= seg; k++) { const th = k / seg * TAU, cs = Math.cos(th), sn = Math.sin(th); this.v(q[0] + (ux * cs + wx * sn) * r, q[1] + (uy * cs + wy * sn) * r, q[2] + (uz * cs + wz * sn) * r, ax[0] * sgn, ax[1] * sgn, ax[2] * sgn, cs * r, sn * r, e ? col1 : col, caps === true ? mat : caps, snow, e ? sw1 : sw0); }
      for (let k = 0; k < seg; k++) { if (e) this.i.push(cb, cb + 1 + k, cb + 2 + k); else this.i.push(cb, cb + 2 + k, cb + 1 + k); }
    }
  }
  // ellipsoid; colFn(nx, ny, nz) -> colour (and sets this.col2 for birds); aux = [mat, snow, sway]
  blob(cx, cy, cz, rx, ry, rz, seg, rings, colFn, mat, snow = 1, sway = 0, lump = null) {
    const base = this.count;
    for (let r = 0; r <= rings; r++) for (let k = 0; k <= seg; k++) {
      const ph = r / rings * PI, th = k / seg * TAU, ny = Math.cos(ph), nr = Math.sin(ph), nx = nr * Math.cos(th), nz = nr * Math.sin(th);
      const d = lump ? lump(nx, ny, nz) : 1, col = typeof colFn === 'function' ? colFn(nx, ny, nz) : colFn;
      this.v(cx + nx * rx * d, cy + ny * ry * d, cz + nz * rz * d, nx / rx, ny / ry, nz / rz, th * rx, ph * ry, col, mat, snow, sway);
    }
    for (let r = 0; r < rings; r++) for (let k = 0; k < seg; k++) { const p = base + r * (seg + 1) + k, q = p + seg + 1; this.i.push(p, p + 1, q, p + 1, q + 1, q); }
  }
  steps(g) {
    return [
      () => g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)), () => g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)),
      () => g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)), () => g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)),
      () => { g.setAttribute('aAux', new THREE.Float32BufferAttribute(this.a, 3)); if (this.c2) g.setAttribute('color2', new THREE.Float32BufferAttribute(this.c2, 3)); },
      () => g.setIndex(this.i), () => g.computeBoundingSphere(),
    ];
  }
  build() { const g = new THREE.BufferGeometry(); for (const step of this.steps(g)) step(); return g; }
  // the same geometry, handing the page back between its attributes (the two big yard meshes)
  async buildSlowly(ctx) { const g = new THREE.BufferGeometry(); for (const step of this.steps(g)) { step(); await ctx.yield(); } return g; }
  get triangles() { return this.i.length / 3; }
}

// ---- GLSL shared by the yard's two shaders
const GLSL_YARD = /* glsl */`
uniform vec3 uSkyC, uGndC, uSunC, uSunDir, uFogC, uFireC, uSnowC;
uniform float uFogD, uTime, uSnow, uSpark;
uniform vec2 uDrift;             // depth of the smoke's wandering shadow, amount of spindrift
float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash21(i), hash21(i+vec2(1.,0.)), f.x), mix(hash21(i+vec2(0.,1.)), hash21(i+vec2(1.,1.)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a*vnoise(p); p = p*2.03+vec2(17.1, 9.2); a *= .5; } return s; }
float fireFlicker(){ return .84+.16*sin(uTime*7.3)*sin(uTime*4.1+1.)+.06*sin(uTime*13.7); }
// the fire mouth as a light: an apricot fan thrown out over the yard
vec3 fireLight(vec3 P, vec3 N){
  vec3 tf = vec3(0., 8., 1.)-P; float df = max(length(tf), 1e-3);
  float fan = smoothstep(-4., 8., P.z)*smoothstep(-.25, .55, -tf.z/df);
  // and a glow that hugs the kiln front: embers, sparks and hot clay light whatever stands against the face
  float hug = .11*exp(-max(abs(P.x)-8., 0.)/17.)*smoothstep(19., 4., P.z)*step(-1., P.z)*smoothstep(44., 8., P.y)*(.6+.4*N.z);
  return uFireC*fireFlicker()*(fan*max(dot(N, tf/df)*.75+.25, 0.)/(1.+df*df/620.)+hug);
}
// the kiln's smoke going over on the wind: its shadow wanders across everything the sun (or moon) reaches
float smokeShade(vec3 P){
  vec2 q = P.xz-uSunDir.xz/max(uSunDir.y, .2)*P.y;
  float s = fbm(vec2(q.x*.021-uTime*.24, q.y*.027+uTime*.05));
  return 1.-uDrift.x*smoothstep(.36, .66, s);
}
vec3 yardFog(vec3 col, float dist){ return mix(col, uFogC, 1.-exp(-uFogD*uFogD*dist*dist)); }
`;

// ---- yard props: wood, thatch, raw jars, end grain, bark, birds, fruit, ice, snow; snow settles on whatever faces up
const PROP_VERT = /* glsl */`
attribute vec3 color; attribute vec3 aAux;
#ifdef BIRD
attribute vec3 color2; attribute vec4 aBird;
#endif
uniform float uTime;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vCol; varying vec3 vAux; varying vec2 vUv; varying float vDist;
void main(){
  vec3 p = position, n = normal, col = color, aux = aAux;
  #ifdef BIRD
    float wing = aAux.y, tail = aAux.z, spread = aBird.y;
    col = mix(color, color2, aBird.x);
    if (abs(wing) > .5){
      vec3 sh = vec3(wing*.13, .07, .08), r = p-sh;
      float a = wing*1.42*(1.-spread), ca = cos(a), sa = sin(a);
      r = vec3(r.x*ca+r.z*sa, r.y, -r.x*sa+r.z*ca)*mix(.8, 1., spread);
      float b = wing*aBird.z*spread, cb = cos(b), sb = sin(b);
      r = vec3(r.x*cb-r.y*sb, r.x*sb+r.y*cb, r.z);
      p = sh+r; n = vec3(0., 1., 0.);
    }
    if (tail > .5){ float back = max(-.24-p.z, 0.); p.z -= back*.85*aBird.x; p.y += back*(1.+.85*aBird.x)*aBird.w; }
    aux = vec3(6., 0., 0.);
  #endif
  vL = p;
  vec4 wp = vec4(p, 1.);
  #ifdef USE_INSTANCING
    wp = instanceMatrix*wp; n = mat3(instanceMatrix)*n;
  #endif
  wp = modelMatrix*wp;
  float sw = aux.z;
  wp.x += sw*(sin(uTime*2.1+wp.x*.31+wp.z*.17)*.6+sin(uTime*5.3+wp.z*.9+wp.y*.4)*.3);
  wp.z += sw*sin(uTime*1.7+wp.x*.23+wp.y*.3)*.45;
  vW = wp.xyz; vN = n; vCol = col; vAux = aux; vUv = uv;
  vec4 mv = viewMatrix*wp; vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const PROP_FRAG = /* glsl */`
${GLSL_YARD}
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying vec3 vCol; varying vec3 vAux; varying vec2 vUv; varying float vDist;
void main(){
  vec3 N = normalize(vN+vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  float mat = vAux.x, emis = 0., gloss = 0., dimK = 1., fireK = 1.;
  vec3 glowAdd = vec3(0.);
  vec3 alb = vCol;
  if (mat < .5){
    alb *= .78+.44*fbm(vW.xz*.45+vW.y*.37);
  } else if (mat < 1.5){
    // sawn pine: grain along uv.x, plank seams, knots
    float g = vnoise(vec2(vUv.x*.16, vUv.y*4.2)), g2 = vnoise(vec2(vUv.x*.7, vUv.y*15.));
    vec2 kc = vec2(vUv.x*.09, vUv.y*.55); float knot = smoothstep(.16, .05, length(fract(kc)-.5))*step(.72, hash21(floor(kc)));
    float seam = smoothstep(.07, .0, abs(fract(vUv.y/3.3)-.5));
    alb *= (.6+.5*g+.22*g2)*(1.-.55*seam)*(1.-.5*knot);
    alb = mix(alb, alb*vec3(.72, .78, .9), smoothstep(.55, .8, fbm(vUv*.08))*.5);      // weathered grey
  } else if (mat < 2.5){
    // a raw, unfired jar: matt chalk with throwing rings, the seam at the waist, damp patches near the foot
    float t = vL.y; vec2 dir = normalize(vL.xz+vec2(1e-5, 0.));
    float n1 = vnoise(dir*2.6+vW.xz*.11), n2 = vnoise(vec2(dir.x*9.+dir.y*5., t*14.));
    float rings = sin(t*150.+n1*4.)*.55+sin(t*61.+n1*9.)*.45;
    N = normalize(N+vec3(0., rings*.07*smoothstep(90., 12., vDist)*smoothstep(.02, .2, t), 0.));
    float seam = smoothstep(.016, .0, abs(t-.5+.004*(n2-.5)));
    float damp = smoothstep(.34, .0, t+(n1-.5)*.3);
    alb *= (.9+.14*n2)*(1.-.16*seam)*(1.-.07*rings*smoothstep(60., 10., vDist))*mix(vec3(1.), vec3(.78, .76, .74), damp*.7);
    alb *= 1.-.10*smoothstep(.55, .9, vnoise(vec2(dir.x*5.+dir.y*3., t*7.)+vW.xz*.2));
    alb *= mix(.7, 1., smoothstep(.0, .42, t));
  } else if (mat < 3.5){
    // end grain of split pine: rings round the heart, checks, a bark rim
    float r = length(vUv), an = atan(vUv.y, vUv.x+1e-4);
    float ring = .5+.5*sin(r*11.+vnoise(vUv*1.7+vW.yz*.3)*5.);
    float chk = smoothstep(.9, 1., sin(an*7.+hash21(floor(vW.yz*.4))*6.))*smoothstep(.2, 1.2, r);
    alb *= (.74+.3*ring)*(1.-.45*chk)*(.85+.3*vnoise(vW.yz*.9));
    alb = mix(alb, alb*vec3(1.1, .78, .5), smoothstep(.0, .7, r)*.25);
  } else if (mat < 4.5){
    // thatch: straw running down the slope (uv.y), laid in courses
    float s1 = vnoise(vec2(vUv.x*4.5, vUv.y*.3)), s2 = vnoise(vec2(vUv.x*13., vUv.y*.9+3.));
    float course = fract(vUv.y/3.4);
    alb *= (.5+.45*s1+.3*s2)*(.55+.45*smoothstep(.0, .3, course))*(1.-.3*smoothstep(.9, 1., course));
  } else if (mat < 5.5){
    // bark: furrows along the limb, plates across
    float f = vnoise(vec2(vUv.x*.14, vUv.y*2.4)), pl = vnoise(vec2(vUv.x*.55, vUv.y*5.5)), fib = vnoise(vec2(vUv.x*.05, vUv.y*11.));
    float fur = smoothstep(.42, .5, f)*(1.-smoothstep(.5, .6, f));
    alb *= (.42+.8*f)*(.74+.4*pl)*(.8+.35*fib)*(1.-.5*fur);
    N = normalize(N+vec3(0., (pl-.5)*.5, 0.)+N*(f-.5)*.6);
  } else if (mat < 6.5){
    gloss = .35;
  } else if (mat < 7.5){
    emis = .55; gloss = .5;
  } else if (mat < 8.5){
    gloss = 1.4; emis = .25;
  } else if (mat < 9.5){
    alb = uSnowC;
  } else {
    // the kiln's clay skin: hand-daubed lumps, drying cracks, streaks; the fire licks the arch's edge
    float lump = fbm(vUv*.42), fine = vnoise(vUv*2.3);
    // pats of clay pressed on by hand: pillowed cells; the drying cracks open along some of their joints
    vec2 cu = vUv*.24+vec2(fbm(vUv*.11)*1.3, fbm(vUv*.11+9.)*1.3), ci = floor(cu), cf = fract(cu);
    float m1 = 9., m2 = 9.;
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++){
      vec2 g = vec2(float(i), float(j)), o = vec2(hash21(ci+g), hash21(ci+g+7.3));
      vec2 r = g+o-cf; float dd = dot(r, r);
      if (dd < m1){ m2 = m1; m1 = dd; } else if (dd < m2){ m2 = dd; }
    }
    float ed = sqrt(m2)-sqrt(m1);
    float open_ = smoothstep(.38, .62, vnoise(vUv*.085+vec2(3., 7.)));
    float crack = smoothstep(.05+.10*open_, .0, ed)*(.35+.65*open_);
    float pat = smoothstep(.0, .45, ed);
    float streak = vnoise(vec2(vUv.x*.7, vUv.y*.045));
    alb *= (.55+.55*lump+.16*fine)*(.72+.28*pat)*(1.-.8*crack)*(.80+.3*streak)*.95;
    dimK = .5;
    if (vW.z > .6){
      // the face round the fire mouth: soot-black at the arch and in a fan climbing above it; the fire is inside,
      // so the face itself takes none of its light, only a thin lick at the arch's edge
      float ad = (vW.y < 12. ? abs(vW.x)-8. : length(vec2(vW.x, vW.y-12.))-8.);
      float upK = smoothstep(8., 30., vW.y);
      float reach = 3.2+upK*(15.+7.*fbm(vec2(vW.x*.16, vW.y*.05)))*smoothstep(15., 3., abs(vW.x)-upK*5.);
      float soot = smoothstep(1., .15, max(ad, 0.)/reach);
      // under its daub the face is laid in clay brick: the courses show where the daub has fallen away
      vec2 bu = vW.xy/vec2(3.4, 1.3); bu.x += .5*mod(floor(bu.y), 2.); vec2 bf = fract(bu);
      float bm = smoothstep(.0, .05, bf.x)*smoothstep(1., .95, bf.x)*smoothstep(.0, .11, bf.y)*smoothstep(1., .89, bf.y);
      float bh = hash21(floor(bu)), bt = .62+.7*bh, bn = fbm(vW.xy*.07+3.), bare = smoothstep(.44, .60, bn);
      // bricks of every firing: plum, tan, a few burnt blue-black, their faces pitted
      vec3 brick = mix(vec3(.30, .17, .11), vec3(.34, .23, .15), step(.72, hash21(floor(bu)+5.)))*bt*(.3+.7*bm)*(.7+.6*lump);
      brick = mix(brick, vec3(.07, .065, .075)*(.6+.8*fine), step(.88, hash21(floor(bu)+9.))*bm);
      // the daub that still clings is paler than the brick under it, and throws a line of shadow where it has broken away
      alb = mix(alb*vec3(1.25, 1.18, 1.05), brick, .10+.86*bare)*(1.-.5*smoothstep(.04, .0, abs(bn-.50)));
      alb = mix(alb*.9, vec3(.022, .018, .016)*(.6+.8*lump)*(.5+.5*bm), soot*.96);
      // the mouth's light lies on the jambs and the arch ring and dies away within a few metres: beyond it the face keeps the sky's light
      float spill = exp(-max(ad, 0.)/4.6)*smoothstep(40., 8., vW.y)+.16*exp(-max(ad, 0.)/15.)*smoothstep(30., 0., vW.y);
      glowAdd = (vec3(1., .40, .10)*.30*exp(-max(ad, 0.)/.9)+alb*uFireC*spill*.85)*fireFlicker();
      dimK = 1.25; fireK = .12;
    }
  }
  float sn = fbm(vW.xz*.23+vW.y*.11);
  float cap = vAux.y*uSnow*smoothstep(.36, .68, N.y+(sn-.5)*.5);
  if (mat > 8.5 && mat < 9.5) cap = max(cap, uSnow);
  alb = mix(alb, uSnowC*(.9+.12*sn), cap);
  // light: sky above, snow bounce below, a weak or low sun, the fire mouth
  float up = N.y*.5+.5;
  vec3 L = mix(uGndC, uSkyC, up)*(.55+.45*smoothstep(-.2, .5, N.y+.3*cap))*dimK;
  float nl = max(dot(N, uSunDir), 0.);
  L += uSunC*nl*smokeShade(vW);
  L += fireLight(vW, N)*fireK;
  vec3 V = normalize(cameraPosition-vW);
  float ndv = clamp(dot(N, V), 0., 1.);
  vec3 col = alb*L+glowAdd;
  col += alb*emis*(uSkyC*.6+uSunC*.5+vec3(.12, .06, .02));
  col += (uSkyC*.5+uSunC*pow(max(dot(reflect(-V, N), uSunDir), 0.), 24.)*1.6)*gloss*pow(1.-ndv, 3.)*.5;
  // sparkle on snow
  vec2 sc = floor(vW.xz*3.+vW.y*2.); float sp = step(.985, hash21(sc))*step(.5, cap);
  col += (uSunC+uSkyC*.3)*sp*uSpark*pow(max(sin(uTime*2.+hash21(sc+7.)*40.+dot(V.xz, vec2(9., 7.))), 0.), 6.)*smoothstep(70., 15., vDist)*1.4;
  gl_FragColor = vec4(yardFog(col, vDist), 1.);
}`;

// ---- the ground: snow with drifts, hollows, a trodden line of prints, bare earth under the shed, the fire's fan
const NB = 7, NJ = 14;
const GROUND_VERT = /* glsl */`
varying vec3 vW; varying vec3 vN; varying float vDist;
void main(){
  vW = position; vN = normal;
  vec4 mv = modelViewMatrix*vec4(position, 1.); vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const GROUND_FRAG = /* glsl */`
${GLSL_YARD}
uniform vec4 uBoard[${NB}];      // centre x, centre z, half length, yaw
uniform vec4 uJar[${NJ}];        // x, z, foot height, top height (the fourteen jars of the aisle)
uniform vec2 uTrail[5];
uniform vec3 uShOff;             // shadow offset in x and z per metre of height, strength of cst shadows
uniform float uLeaves;
varying vec3 vW; varying vec3 vN; varying float vDist;
float segDist(vec2 p, vec2 a, vec2 b, out float along){
  vec2 ab = b-a; float l = max(length(ab), 1e-3); vec2 d = ab/l; along = clamp(dot(p-a, d), 0., l);
  return dot(p-a, vec2(-d.y, d.x));
}
void main(){
  vec2 p = vW.xz;
  float n1 = fbm(p*.028), n2 = fbm(p*.17+7.), n3 = vnoise(p*1.4), n4 = fbm(p*.17+31.);
  // where the snow lies: not under the shed roof, not in the wet band the kiln has melted
  float roofed = smoothstep(58., 48., abs(p.x)+(n2-.5)*9.)*smoothstep(24., 12., p.y+(n1-.5)*16.);
  float snowK = clamp(mix(smoothstep(1.-uSnow*1.6, 1.15-uSnow, n2*.6+n3*.4), 1., step(.99, uSnow)), 0., 1.)*(1.-roofed);
  // the trodden line: a trough of packed snow with oval prints left and right
  float lat = 99., s = 0., acc = 0., al;
  for (int i = 0; i < 4; i++){
    float d = segDist(p, uTrail[i], uTrail[i+1], al);
    float seg = length(uTrail[i+1]-uTrail[i]);
    float e = length(p-(uTrail[i]+normalize(uTrail[i+1]-uTrail[i]+vec2(1e-4, 0.))*al));
    if (e < abs(lat)){ lat = sign(d+1e-4)*e; s = acc+al; }
    acc += seg;
  }
  float k = floor(s/7.), side = mod(k, 2.)*2.-1.;
  vec2 q = vec2(fract(s/7.)*7.-3.5, lat-side*2.1);
  float pr = length(q/vec2(3.3, 1.4));
  float print = smoothstep(1., .7, pr);
  float trough = smoothstep(8., 3., abs(lat))*.22;
  // stray prints round the boards
  vec2 cg = floor(p/9.); vec2 cq = fract(p/9.)*9.-4.5-vec2(hash21(cg)-.5, hash21(cg+3.)-.5)*4.;
  float ca = hash21(cg+9.)*6.28; cq = vec2(cq.x*cos(ca)+cq.y*sin(ca), -cq.x*sin(ca)+cq.y*cos(ca));
  float stray = smoothstep(1., .6, length(cq/vec2(2.6, 1.05)))*step(.62, hash21(cg+5.))*smoothstep(75., 30., abs(p.x))*smoothstep(-5., 20., p.y);
  print = max(print*step(abs(lat), 6.), stray);
  // drifts
  vec3 N = normalize(vN+vec3((n2-.5)*.5+(n3-.5)*.12, 0., (n4-.5)*.5)*snowK+vec3(0., 1e-4, 0.));
  N = normalize(N+vec3(0., -.35, 0.)*print*snowK);
  float hol = smoothstep(.6, .28, n2)*(.6+.4*smoothstep(.35, .6, n1));
  vec3 snowAlb = uSnowC*(.93+.09*n3)*mix(vec3(1.), vec3(.56, .68, .9), clamp(hol*.7+trough+print*.9, 0., .95))*(1.-.22*print);
  // earth: trodden clay and sand, wet and dark close to the kiln
  float wet = smoothstep(26., 2., p.y)*smoothstep(60., 30., abs(p.x));
  vec3 earth = mix(vec3(.21, .15, .105), vec3(.30, .235, .16), smoothstep(.4, .7, n2))*(.62+.6*n3)*mix(1., .45, wet*(.5+.5*n1));
  earth = mix(earth, earth*vec3(.75, .9, 1.25)+.035, uSnow*.25*smoothstep(.5, .8, n3));    // frost on the clods
  vec2 eg = floor(p/1.3); vec2 eq = fract(p/1.3)-.5-(vec2(hash21(eg+11.), hash21(eg+12.))-.5)*.5; float ea = hash21(eg+13.)*6.28;
  eq = vec2(eq.x*cos(ea)+eq.y*sin(ea), -eq.x*sin(ea)+eq.y*cos(ea)); float eh = hash21(eg+14.);
  float chip = smoothstep(.5, .38, max(abs(eq.x)*(1.2+2.*eh), abs(eq.y)*3.4))*step(.62, eh);
  earth = mix(earth, mix(vec3(.46, .33, .2), vec3(.62, .5, .34), hash21(eg+15.))*(.7+.4*n3), chip*.85);       // bark and wood chips
  float peb = smoothstep(.3, .18, length(fract(p/.8+vec2(hash21(eg), .3))-.5))*step(.8, hash21(floor(p/.8)+3.));
  earth = mix(earth, vec3(.2, .19, .18)*(.6+.8*eh), peb*.7);
  earth *= 1.-.45*print*(1.-.6*smoothstep(.55, .75, pr));
  // fallen leaves (late autumn)
  vec2 lg = floor(p/2.6); vec2 lq = fract(p/2.6)-.5-(vec2(hash21(lg+1.), hash21(lg+2.))-.5)*.5;
  float leaf = smoothstep(.34, .22, length(lq*vec2(1., 1.7+hash21(lg+4.))))*step(1.-uLeaves*(.25+.5*smoothstep(110., 30., length(p-vec2(66., 44.)))), hash21(lg));
  vec3 alb = mix(earth, snowAlb, snowK);
  alb = mix(alb, mix(vec3(.62, .22, .05), vec3(.75, .42, .08), hash21(lg+8.))*(.7+.5*n3), leaf);
  // shade under the drying boards (and their cst shadows when the sun is low), the jars' long shadows
  float shade = 0.;
  for (int i = 0; i < ${NB}; i++){
    vec4 b = uBoard[i]; vec2 r = p-b.xy-uShOff.xy*4.2; float c = cos(b.w), sn = sin(b.w);
    vec2 l = vec2(r.x*c-r.y*sn, r.x*sn+r.y*c);
    shade = max(shade, smoothstep(6.5, 3.2, abs(l.x))*smoothstep(b.z+2., b.z-2., abs(l.y)));
  }
  float cst = 0.;
  #ifdef JAR_SHADOWS
  for (int i = 0; i < ${NJ}; i++){
    vec4 j = uJar[i]; vec2 a = j.xy+uShOff.xy*(j.z+1.5), b = j.xy+uShOff.xy*j.w; float al2;
    vec2 ab = b-a; float h = clamp(dot(p-a, ab)/max(dot(ab, ab), 1e-3), 0., 1.);
    float d = length(p-a-ab*h);
    cst = max(cst, smoothstep(4.7, 3.3, d+h*.8)*(1.-.35*h));
  }
  cst *= uShOff.z;
  #endif
  shade = max(shade*mix(.62, .9, uShOff.z), cst*.85);
  // posts of the shed front
  shade = max(shade, .6*exp(-min(min(dot(p-vec2(13., 16.), p-vec2(13., 16.)), dot(p-vec2(-13., 16.), p-vec2(-13., 16.))), min(dot(p-vec2(39., 16.), p-vec2(39., 16.)), dot(p-vec2(-39., 16.), p-vec2(-39., 16.))))/26.));
  float up = N.y*.5+.5;
  vec3 amb = mix(uGndC, uSkyC, up);
  vec3 sun = uSunC*max(dot(N, uSunDir), 0.)*smokeShade(vW);
  vec3 L = amb*mix(1., .44, shade)*mix(vec3(1.), vec3(.66, .8, 1.1), shade)+sun*(1.-shade)*(1.-roofed*.9);
  L *= 1.-.55*roofed*smoothstep(30., -40., p.y);
  L += fireLight(vW, N)*1.25;
  vec3 col = alb*L;
  // spindrift: snow dust snaking low over the snow on the wind, left to right
  float sdr = fbm(vec2(p.x*.05-uTime*.62, p.y*.21+uTime*.07)+n1*2.);
  float veil = smoothstep(.47, .7, sdr)*snowK*uDrift.y*smoothstep(150., 40., vDist);
  col = mix(col, uSnowC*(amb*1.12+sun+fireLight(vW, vec3(0., 1., 0.))), veil*.62);
  vec3 V = normalize(cameraPosition-vW);
  vec2 sc = floor(p*2.6); float sp = step(.988, hash21(sc))*snowK;
  col += (uSunC*(1.-shade)+uSkyC*.35)*sp*uSpark*pow(max(sin(uTime*1.7+hash21(sc+7.)*40.+dot(V.xz, vec2(11., 8.))), 0.), 8.)*smoothstep(90., 12., vDist)*1.6;
  gl_FragColor = vec4(yardFog(col, vDist), 1.);
}`;

// ---- yard layout
const WOOD = lin('#8f6f4c'), WOOD_P = lin('#b89468'), PINE_END = lin('#dcbd8e'), BARK = lin('#4a3628'), POST = lin('#6b5848'), THATCH = lin('#a68c5e'), CHALK = [0.74, 0.70, 0.645];
const STONE = lin('#77726c'), OCHRE = lin('#b48a3a'), NEEDLE = lin('#1c3226');
const BOARDS = [   // centre x, centre z, half length, yaw, jars
  [-11.5, 70, 42, 0, 7], [11.5, 70, 42, 0, 7], [-48, 84, 31, 0.6, 5], [-74, 30, 26, -0.35, 4], [58, 122, 31, -0.5, 5], [-96, 96, 25, 1.35, 4], [88, 66, 25, 1.2, 4]];
const BOARD_Y = 4.5, JAR_S = 9;
const TIERS = [{ z0: 20, z1: -40, h: 30 }, { z0: -36, z1: -124, h: 54 }, { z0: -120, z1: -204, h: 78 }, { z0: -200, z1: -290, h: 110 }];
const RW = 52, RISE = 32, THK = 5;
const roofY = (x, h) => h + RISE * (1 - Math.abs(x) / RW);
const STACK = { x0: 26, x1: 40, z0: 34, z1: 94, cell: 2.6, rowH: 2.5 };
const TREE = [66, 44];

function buildBoards(B, rng, jarsNear, jarsFar) {
  BOARDS.forEach((bd, bi) => {
    const [cx, cz, half, yaw, nJ] = bd, c = Math.cos(yaw), s = Math.sin(yaw);
    B.at(cx, 0, cz, yaw);
    for (let k = -1; k <= 1; k++) { const t = rng.range(0.82, 1.12); B.box(k * 3.35, BOARD_Y - 0.36, rng.range(-0.8, 0.8), 3.2, 0.72, half * 2 + rng.range(-1.6, 1.6), 0, mul(k ? WOOD : WOOD_P, t), 1, 1, 1, 3); }
    const nT = Math.max(3, Math.round(half * 2 / 13));
    for (let t = 0; t < nT; t++) {
      const z = -half + 3.5 + t * (half * 2 - 7) / (nT - 1), tone = rng.range(0.8, 1.05);
      B.box(0, BOARD_Y - 1.05, z, 10.6, 0.7, 1.1, 0, mul(WOOD, tone * 0.9), 1, 1, 1, 3);
      for (const sx of [1, -1]) for (const sz of [1, -1]) B.tube([sx * 5.6, 0, z + sz * 2.2], [sx * 3.6, BOARD_Y - 1.3, z + sz * 0.25], 0.5, 0.4, 6, mul(WOOD, tone * 0.8), 1, 0.4);
      for (const sx of [1, -1]) B.tube([sx * 4.9, 1.5, z + 1.5], [sx * 4.9, 1.5, z - 1.5], 0.26, 0.26, 5, mul(WOOD, tone * 0.7), 1, 0.4);
      B.tube([-4.6, 1.9, z], [4.6, 1.9, z], 0.3, 0.3, 5, mul(WOOD, tone * 0.7), 1, 0.4);
    }
    for (let k = 0; k < nJ; k++) {
      const lz = -half + 8 + k * (half * 2 - 16) / (nJ - 1), lx = rng.range(-0.35, 0.35), S = JAR_S * rng.range(0.95, 1.03);
      (bi < 2 ? jarsNear : jarsFar).push({ x: cx + lx * c + lz * s, y: BOARD_Y, z: cz - lx * s + lz * c, S, yaw: rng() * TAU, tx: rng.range(-0.035, 0.035), tz: rng.range(-0.035, 0.035),
        sx: rng.range(0.975, 1.025), sy: rng.range(0.94, 1.04), sz: rng.range(0.975, 1.025) });
    }
  });
  B.at();
}

// the thatched shed: four roof tiers climbing the hill over the kiln, the gable front with its posts and tie beam
function buildShed(B, rng, noise, look, groundY) {
  const snowy = look.snow > 0.5, dark = mul(THATCH, 0.22);
  TIERS.forEach((T, ti) => {
    const nX = 8, nZ = ti === 0 ? 6 : 5, xo = RW + 3;
    for (const sx of [1, -1]) {
      const base = B.count, sl = RISE / RW, nl = Math.hypot(1, sl);
      for (let r = 0; r <= nZ; r++) for (let k = 0; k <= nX; k++) {
        const x = sx * xo * k / nX, z = lerp(T.z0 + 2.5, T.z1, r / nZ), nn = noise.n2(x * 0.06 + ti * 9, z * 0.06);
        const y = roofY(x, T.h) + (snowy ? 1.6 + 1.3 * nn : 0.25 * nn) - (r === 0 ? 1.1 : 0) - (k === nX ? 1.0 : 0);
        const t = 0.85 + 0.25 * noise.n2(x * 0.2, z * 0.2 + 5);
        B.v(x, y, z, sx * sl / nl, 1 / nl, r === 0 ? 0.5 : 0, z, Math.abs(x) * nl, snowy ? [0.9, 0.93, 0.98] : mul(THATCH, t), snowy ? 9 : 4, 1);
      }
      for (let r = 0; r < nZ; r++) for (let k = 0; k < nX; k++) { const a = base + r * (nX + 1) + k, b = a + nX + 1; if (sx > 0) B.i.push(a, b, a + 1, a + 1, b, b + 1); else B.i.push(a, a + 1, b, a + 1, b + 1, b); }
      // gable front: the snow lip, then the cut ends of the thatch, in strips that follow the slope
      for (let k = 0; k < nX; k++) {
        const xa = sx * xo * k / nX, xb = sx * xo * (k + 1) / nX, ya = roofY(xa, T.h), yb = roofY(xb, T.h), z = T.z0 + 2.5, d1 = k === nX - 1 ? 0.6 : 0;
        if (snowy) B.face([[xa, ya - 0.6, z + 0.5], [xb, yb - 0.6 - d1, z + 0.5], [xb, yb + 1.4 - d1, z - 0.4], [xa, ya + 1.4, z - 0.4]], [[xa, 0], [xb, 0], [xb, 2], [xa, 2]], [0.86, 0.9, 0.96], 9, 1);
        B.face([[xa, ya - THK, z], [xb, yb - THK, z], [xb, yb - (snowy ? 0.5 : 0), z], [xa, ya - (snowy ? 0.5 : 0), z]], [[xa * 3, 0], [xb * 3, 0], [xb * 3, 40], [xa * 3, 40]], mul(THATCH, 0.8), 4, 0);
      }
      // underside and the eave's edge
      B.face([[0, T.h + RISE - THK, T.z0 + 2.5], [sx * xo, roofY(xo, T.h) - THK, T.z0 + 2.5], [sx * xo, roofY(xo, T.h) - THK, T.z1], [0, T.h + RISE - THK, T.z1]], [[0, 0], [0, 60], [80, 60], [80, 0]], dark, 4, 0);
      B.face([[sx * xo, roofY(xo, T.h) - THK, T.z0 + 2.5], [sx * xo, roofY(xo, T.h) - THK, T.z1], [sx * xo, roofY(xo, T.h) + (snowy ? 0.4 : 0), T.z1], [sx * xo, roofY(xo, T.h) + (snowy ? 0.4 : 0), T.z0 + 2.5]], [[0, 0], [90, 0], [90, 40], [0, 40]], mul(THATCH, 0.7), 4, 0);
      // purlins under the thatch, wall plate, posts down the side
      for (const px of [14, 27, 39]) B.tube([sx * px, roofY(px, T.h) - THK - 0.9, T.z0 + 3.2], [sx * px, roofY(px, T.h) - THK - 0.9, T.z1], 1.0, 1.0, 6, mul(POST, 0.55), 5, 0, 0, 0, 3);
      if (ti < 3) for (let z = T.z0 - 4; z > T.z1 + 6; z -= 26) {
        if (ti === 0 && z > 10) continue;
        const gy = groundY(sx * 39, z), top = roofY(39, T.h) - THK - 1.6;
        B.tube([sx * 39, gy - 1, z], [sx * 39, top, z], 2.0, 1.6, 9, mul(POST, 0.8), 5, 0);
      }
    }
    // rafters along the gable and the tie beam
    const z = T.z0 + 1.2;
    for (const sx of [1, -1]) B.tube([0, T.h + RISE - THK - 1.4, z], [sx * (RW + 1), T.h - THK - 0.6, z], 1.3, 1.1, 7, mul(POST, 0.7), 5, 0);
    B.tube([-RW + 1, T.h - 1.2, z - 0.4], [RW - 1, T.h - 1.2, z - 0.4], 1.7, 1.7, 8, mul(POST, 0.75), 5, 0, 0, 0, 3);
    B.tube([0, T.h, z - 0.4], [0, T.h + RISE - THK - 2, z - 0.4], 1.4, 1.2, 7, mul(POST, 0.7), 5, 0);
    for (const sx of [1, -1]) B.tube([sx * 4, T.h, z - 0.4], [sx * 26, T.h + RISE * 0.5 - THK - 1, z - 0.4], 1.0, 0.9, 6, mul(POST, 0.65), 5, 0);
  });
  // the four front posts on stone footings, 26 m apart: the flight passes between the middle two
  for (const x of [-39, -13, 13, 39]) {
    B.tube([x, 1.2, 16], [x, TIERS[0].h - 2.6, 16], 2.05, 1.7, 12, POST, 5, 0);
    B.blob(x, 0.5, 16, 3.6, 1.5, 3.6, 10, 4, mul(STONE, rng.range(0.8, 1.1)), 0, 1, 0, (nx, ny, nz) => 1 + 0.12 * noise.n3(nx * 2 + x, ny * 2, nz * 2));
    for (const y of [9, 20]) B.tube([x, y, 16], [x, y + 0.8, 16], 2.02 - y * 0.012, 2.0 - y * 0.012, 12, mul(THATCH, 0.7), 4, 0);   // straw rope lashings
    B.tube([x - 4.5, TIERS[0].h - 5.5, 16.2], [x + 4.5, TIERS[0].h - 5.5, 16.2], 0.9, 0.9, 6, mul(POST, 0.8), 5, 0, 0, 0, 3);        // bracket
  }
  // icicles along the front eave (the morning after the storm)
  if (look.name === 'morning') for (let k = 0; k < 46; k++) {
    const x = rng.range(-RW, RW), y = roofY(x, TIERS[0].h) - THK + 0.3, len = rng.range(2, 7) * (0.6 + 0.4 * rng());
    B.tube([x, y, 22.6 + rng.range(-0.3, 0.3)], [x + rng.range(-0.2, 0.2), y - len, 22.6], 0.42, 0.03, 5, [0.75, 0.86, 0.98], 8, 0);
  }
}

// the wall of split pine: quarter-round splits stacked end-on to the path, pale end grain showing
async function buildStack(ctx, B, rng) {
  const S = STACK, nC = Math.round((S.z1 - S.z0) / S.cell), R = 2.52, tops = [];
  for (let c = 0; c < nC; c++) {
    const rows = 12 - (rng.chance(0.3) ? 1 : 0) - (c < 2 || c > nC - 3 ? rng.int(1, 3) : 0);
    for (let r = 0; r < rows; r++) {
      // laid like bricks, each split filling its place: a full quarter with a swollen bark side, heart to one corner
      const zc = S.z0 + (c + 0.5) * S.cell + ((r & 1) ? S.cell * 0.5 : 0), yc = 0.2 + r * S.rowH, rot = rng.int(0, 3) * PI / 2 + rng.range(-0.09, 0.09), tone = rng.range(0.75, 1.1);
      const xa = S.x0 + rng.range(-0.55, 0.5), xb = S.x1 + rng.range(-0.5, 0.55);
      // cross-section in (z, y): the heart at one corner of the cell, the bark arc opposite
      const pts = [[0, 0]]; for (let k = 0; k <= 4; k++) { const a = k / 4 * PI / 2; pts.push([Math.pow(Math.cos(a), 0.62) * R, Math.pow(Math.sin(a), 0.62) * R]); }
      const P = pts.map((q) => { const cs = Math.cos(rot), sn = Math.sin(rot), z = q[0] - R * 0.5, y = q[1] - R * 0.5; return [zc + z * cs - y * sn, yc + 1.25 + z * sn + y * cs, q[0], q[1]]; });
      for (let k = 0; k < P.length; k++) {
        const a = P[k], b = P[(k + 1) % P.length], bark = k >= 1 && k <= 4;
        B.face([[xa, a[1], a[0]], [xb, a[1], a[0]], [xb, b[1], b[0]], [xa, b[1], b[0]]], [[xa + c * 3, k * 2], [xb + c * 3, k * 2], [xb + c * 3, k * 2 + 2], [xa + c * 3, k * 2 + 2]], bark ? mul(BARK, tone) : mul(PINE_END, tone * 0.6), bark ? 5 : 1, 1);
      }
      for (const x of [xa, xb]) for (let k = 1; k < P.length - 1; k++)
        B.face([[x, P[0][1], P[0][0]], [x, P[k][1], P[k][0]], [x, P[k + 1][1], P[k + 1][0]], [x, P[k + 1][1], P[k + 1][0]]], [[0, 0], [P[k][2], P[k][3]], [P[k + 1][2], P[k + 1][3]], [P[k + 1][2], P[k + 1][3]]], mul(PINE_END, tone), 3, 0.3);
    }
    // the dark heart of the stack behind the log ends, so the gaps between splits never show the sky
    B.box((S.x0 + S.x1) / 2, rows * S.rowH / 2 - 0.3, S.z0 + (c + 0.5) * S.cell + S.cell * 0.25, S.x1 - S.x0 - 1.5, rows * S.rowH - 0.6, S.cell * 1.5 + 0.05, 0, [0.085, 0.058, 0.04], 0, 0);
    tops.push(0.2 + rows * S.rowH);
    await ctx.yield();
  }
  for (const z of [S.z0 - 1.2, S.z1 + 1.2]) for (const x of [S.x0 + 2, S.x1 - 2]) B.tube([x, 0, z], [x + rng.range(-0.6, 0.6), 33, z], 0.9, 0.7, 7, mul(POST, 0.8), 5, 0.6);
  return tops;
}

// the bare persimmon: black boughs with snow along every one, a few fruit left on the top twigs for the magpies
async function buildTree(ctx, B, rng, look) {
  const tips = [], v = new V3(), w = new V3(), ax = new V3();
  const grow = async (p, dir, len, r, depth) => {
    const mid = p.clone().addScaledVector(dir, len * 0.5).add(v.set(rng.range(-1, 1), rng.range(-0.3, 0.6), rng.range(-1, 1)).multiplyScalar(len * 0.07));
    const end = p.clone().addScaledVector(dir, len).add(v.set(rng.range(-1, 1), rng.range(0, 1), rng.range(-1, 1)).multiplyScalar(len * 0.08));
    const seg = depth < 2 ? 9 : depth < 4 ? 6 : 5, s0 = 0.03 * depth * depth, s1 = 0.03 * (depth + 0.5) * (depth + 0.5), s2 = 0.03 * (depth + 1) * (depth + 1);
    const tone = 0.8 + 0.3 * rng();
    B.tube(p.toArray(), mid.toArray(), r, r * 0.84, seg, mul(BARK, tone), 5, 1, s0, s1);
    B.tube(mid.toArray(), end.toArray(), r * 0.84, r * 0.68, seg, mul(BARK, tone), 5, 1, s1, s2);
    if (depth >= 5) { tips.push(end); return; }
    const n = depth < 2 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      ax.set(rng.range(-1, 1), rng.range(-0.2, 0.2), rng.range(-1, 1)).cross(dir).normalize();
      w.copy(dir).applyAxisAngle(ax, rng.range(0.45, 0.95)).applyAxisAngle(dir, k * TAU / n + rng.range(-0.5, 0.5));
      w.x -= 0.16; w.y += 0.22 - 0.05 * depth; w.z -= 0.10; w.normalize();          // up, and leaning over the shed
      await grow(end, w.clone(), len * rng.range(0.64, 0.82), r * 0.66, depth + 1);
      if (depth < 4) await ctx.yield();
    }
  };
  await grow(new V3(TREE[0], -1, TREE[1]), new V3(-0.1, 1, -0.05).normalize(), 36, 5.2, 0);
  for (let k = 0; k < 7; k++) { const a = k / 7 * TAU + rng.range(-0.3, 0.3); B.tube([TREE[0] + Math.cos(a) * 11, -0.6, TREE[1] + Math.sin(a) * 11], [TREE[0] + Math.cos(a) * 3, 5, TREE[1] + Math.sin(a) * 3], 1.0, 3.2, 6, BARK, 5, 1); }
  tips.sort((a, b) => b.y - a.y);
  const nF = Math.min(look.fruit, tips.length), orange = lin('#f07c12');
  for (let k = 0; k < nF; k++) {
    if ((k & 3) === 3) await ctx.yield();
    const t = look.fruit > 10 ? tips[Math.floor(k * tips.length / nF)] : tips[k * 2], r = rng.range(0.7, 0.82);
    B.tube([t.x, t.y, t.z], [t.x + rng.range(-0.5, 0.5), t.y - 1.4, t.z + rng.range(-0.5, 0.5)], 0.22, 0.18, 4, BARK, 5, 0, 0.7, 0.75);
    B.blob(t.x, t.y - 2.0, t.z, r, r * 0.86, r, 9, 6, (nx, ny) => mixc(mul(orange, 0.75 + 0.3 * ny), lin('#ffb24a'), Math.max(ny, 0) * 0.4), 7, 1, 0.75);
    B.blob(t.x, t.y - 2.0 + r * 0.8, t.z, r * 0.5, r * 0.16, r * 0.5, 6, 3, mul(BARK, 0.7), 5, 1, 0.75);
  }
  return tips;
}

// far pines dissolving in the haze, dead grass and seed heads, the A-frame, the bowl
function buildPines(B, rng, groundY, density) {
  const n = Math.round(18 * density);
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, x = side * rng.range(125, 340), z = rng.range(-300, 150), H = rng.range(170, 300), gy = groundY(x, z) - 4, R = H * rng.range(0.16, 0.2);
    B.tube([x, gy, z], [x + rng.range(-4, 4), gy + H * 0.5, z], H * 0.022, H * 0.012, 6, mul(BARK, 0.8), 5, 0);
    const nT = 7;
    for (let t = 0; t < nT; t++) {
      const f = t / (nT - 1), y0 = gy + H * (0.22 + 0.66 * f), r = R * (1 - 0.8 * f) * rng.range(0.85, 1.1), h = H * 0.2 * (1 - 0.45 * f);
      B.tube([x + rng.range(-2, 2), y0 - h * 0.12, z + rng.range(-2, 2)], [x, y0 + h, z], r, r * 0.08, 9, mul(NEEDLE, rng.range(0.7, 1.1)), 0, 0.62, 0.1 * f, 0.5 * f);
    }
  }
}
async function buildGrass(ctx, B, rng, groundY, density) {
  const spots = [];
  for (let k = 0; k < 46; k++) { const sx = k % 2 ? 1 : -1; spots.push([sx * rng.range(55, 63), rng.range(-34, 24)]); }
  for (let k = 0; k < 16; k++) spots.push([STACK.x0 - rng.range(0.6, 3), rng.range(STACK.z0, STACK.z1)]);
  for (let k = 0; k < 10; k++) spots.push([rng.range(STACK.x0, STACK.x1), STACK.z1 + rng.range(1.5, 5)]);
  for (const x of [-39, 39]) for (let k = 0; k < 5; k++) spots.push([x + rng.range(-6, 6), 16 + rng.range(2, 7)]);
  for (let k = 0; k < 60; k++) { const x = rng.range(-130, 130), z = rng.range(-10, 150); if (Math.abs(x) > 21 && !(x > 22 && x < 44 && z > 30 && z < 98) && !(Math.abs(x) < 54 && z < 24)) spots.push([x, z]); }
  const n = Math.round(spots.length * clamp(density, 0.6, 1.3));
  for (let s = 0; s < n; s++) {
    if ((s & 7) === 7) await ctx.yield();
    const [cx, cz] = spots[s % spots.length], gy = groundY(cx, cz) - 0.2, stalks = rng.int(4, 7);
    for (let k = 0; k < stalks; k++) {
      const x = cx + rng.range(-1.6, 1.6), z = cz + rng.range(-1.6, 1.6), h = rng.range(3.5, 8), lx = rng.range(-1.6, 1.6), lz = rng.range(-1.2, 1.2), yaw = rng() * PI, c = Math.cos(yaw) * 0.3, sn = Math.sin(yaw) * 0.3;
      const col = mul(mixc(OCHRE, lin('#8a6a34'), rng()), rng.range(0.7, 1.15)), m = [x + lx * 0.35, gy + h * 0.55, z + lz * 0.35], t = [x + lx, gy + h, z + lz];
      B.face([[x - c, gy, z - sn], [x + c, gy, z + sn], [m[0] + c * 0.7, m[1], m[2] + sn * 0.7], [m[0] - c * 0.7, m[1], m[2] - sn * 0.7]], [[0, 0], [1, 0], [1, 1], [0, 1]], [mul(col, 0.6), mul(col, 0.6), col, col], 0, 0, [0, 0, 0.2, 0.2]);
      B.face([[m[0] - c * 0.7, m[1], m[2] - sn * 0.7], [m[0] + c * 0.7, m[1], m[2] + sn * 0.7], [t[0] + c * 0.35, t[1], t[2] + sn * 0.35], [t[0] - c * 0.35, t[1], t[2] - sn * 0.35]], [[0, 1], [1, 1], [1, 2], [0, 2]], col, 0, 0, [0.2, 0.2, 0.6, 0.6]);
      if (rng.chance(0.55)) B.face([[t[0] - c * 2.2, t[1] - 0.3, t[2] - sn * 2.2], [t[0] + c * 2.2, t[1] - 0.3, t[2] + sn * 2.2], [t[0] + c * 0.5 + lx * 0.25, t[1] + 2.3, t[2] + sn * 0.5], [t[0] - c * 0.5 + lx * 0.25, t[1] + 2.3, t[2] - sn * 0.5]], [[0, 0], [1, 0], [1, 1], [0, 1]], mul(col, 0.8), 0, 0.5, [0.6, 0.6, 0.85, 0.85]);
    }
  }
}
function buildProps(B, rng, stackTops) {
  // the pine-carrying A-frame leaning on the right-hand post, two splits still on its prongs
  const px = 16.6;
  for (const dz of [-2.6, 2.6]) B.tube([px + 5.2, 0, 16 + dz * 1.5], [px - 0.9, 23, 16 + dz * 0.45], 0.5, 0.36, 6, WOOD, 1, 0.5);
  for (const y of [6, 11.5, 17]) { const t = y / 23, x = px + 5.2 - 6.1 * t, hw = lerp(3.9, 1.17, t); B.tube([x, y, 16 - hw], [x, y, 16 + hw], 0.3, 0.3, 5, mul(WOOD, 0.8), 1, 0.5); }
  for (const dz of [-2.1, 2.1]) B.tube([px + 3.2, 7.4, 16 + dz], [px + 8.6, 9.6, 16 + dz * 1.1], 0.36, 0.26, 5, mul(WOOD, 0.9), 1, 0.5);
  B.box(px + 2.4, 13.5, 16, 0.5, 6.5, 4.2, 0.26, mul(THATCH, 0.9), 4, 0.3);
  for (let k = 0; k < 2; k++) B.box(px + 6.4 + k * 0.4, 9.6 + k * 1.5, 16, 1.6, 1.4, 12.5, 0.08 * (k ? 1 : -1), mul(PINE_END, 0.85), 1, 1, 0.85, 3);
  // a bowl left steaming on the wood pile
  const bz = 61, by = stackTops[Math.round((bz - STACK.z0) / STACK.cell)] || 30, bx = STACK.x0 + 1.6;
  B.tube([bx, by + 0.1, bz], [bx, by + 0.35, bz], 0.75, 0.8, 12, [0.78, 0.8, 0.82], 6, 0);
  B.tube([bx, by + 0.35, bz], [bx, by + 1.35, bz], 0.8, 1.65, 12, [0.8, 0.82, 0.84], 6, 0);
  B.tube([bx, by + 1.05, bz], [bx, by + 1.06, bz], 1.3, 0.01, 12, [0.36, 0.2, 0.1], 6, 0);
  return [bx, by + 1.6, bz];
}

// the kiln front: what stands against the clay face either side of the fire mouth and catches its light. Stacks of
// split pine laid end-on to the yard, a stone step and a sill before the mouth, the door bricks of the wicket piled
// where they were pulled away, a stoking pole leaning on the face
function buildFront(B, rng) {
  const BRICK = lin('#8a5237');
  for (const sx of [-1, 1]) {
    const x0 = sx < 0 ? 17 : 24.5, nC = sx < 0 ? 7 : 4, nR = sx < 0 ? 5 : 3;
    for (let c = 0; c < nC; c++) {
      const rows = Math.max(1, nR - (c === nC - 1 ? 2 : 0) - (rng.chance(0.3) ? 1 : 0));
      for (let r = 0; r < rows; r++) {
        const x = sx * (x0 + c * 2.5 + ((r & 1) ? 1.25 : 0) + rng.range(-0.2, 0.2)), y = 1.25 + r * 2.2, tone = rng.range(0.75, 1.1), za = 4.4 + rng.range(0, 0.6), zb = 12.2 + rng.range(-1.2, 0.8);
        B.tube([x, y, za], [x, y, zb], 1.2, 1.2, 9, mul(BARK, tone * 1.15), 5, 0.8, 0, 0, 3, mul(PINE_END, tone));
      }
    }
    // two stakes hold the stack
    B.tube([sx * (x0 - 1.6), 0, 6], [sx * (x0 - 1.9), nR * 2.2 + 3, 6], 0.5, 0.4, 6, mul(POST, 0.8), 5, 0.6);
    B.tube([sx * (x0 - 1.6), 0, 10.6], [sx * (x0 - 1.9), nR * 2.2 + 2.2, 10.6], 0.5, 0.4, 6, mul(POST, 0.8), 5, 0.6);
    // the wicket's door bricks, pulled away and piled either side of the mouth
    for (let k = 0; k < 13; k++) {
      const lay = k < 6 ? 0 : k < 10 ? 1 : 2, i = lay === 0 ? k : lay === 1 ? k - 6 : k - 10, tone = rng.range(0.7, 1.15);
      B.box(sx * (10.4 + (i % 3) * 1.25 + lay * 0.5 + rng.range(-0.12, 0.12)), 0.5 + lay * 1.0, 4.6 + Math.floor(i / 3) * 2.5 + lay * 0.7 + rng.range(-0.15, 0.15), 1.15, 0.95, 2.3, rng.range(-0.12, 0.12), mul(BRICK, tone), 0, 0.5);
    }
  }
  // the sill and one broad step of field stone before the mouth
  B.box(0, 0.3, 6.2, 21, 0.6, 5.2, 0, mul(STONE, 0.8), 0, 0.6);
  B.box(0, 0.75, 4.6, 18, 0.5, 2.4, 0, mul(STONE, 0.95), 0, 0.5);
  // the stoking pole, leaning on the face
  B.tube([-12.6, 0, 7.5], [-10.2, 23, 3.4], 0.3, 0.24, 6, mul(WOOD, 0.7), 1, 0.3);
}

// one bird for both kinds: colour = sparrow, color2 = magpie; aAux = (-, wing side, tail weight). Unit length, facing +z
function buildBird() {
  const B = new YB(true), S = { back: lin('#7a5230'), buff: lin('#d6c8b0'), cap: lin('#6b3418'), cheek: lin('#ece6da'), black: lin('#16110e'), bar: lin('#e8dcc6') };
  const M = { black: [0.012, 0.013, 0.02], white: [0.92, 0.93, 0.95], gloss: lin('#0e4a4c'), blue: lin('#1a3a8a') };
  B.blob(0, 0, 0, 0.15, 0.15, 0.3, 9, 7, (nx, ny, nz) => {
    B.col2 = ny < -0.12 && nz < 0.4 ? M.white : (Math.abs(nx) > 0.5 && ny > -0.1 && nz < 0.35 && nz > -0.45 ? M.white : M.black);
    return nz > 0.55 && ny < 0.25 ? S.black : ny < -0.05 ? S.buff : mul(S.back, 0.8 + 0.4 * ((Math.round(nx * 9) & 1) ? 0.4 : 1));
  }, 6, 0, 0);
  B.blob(0, 0.1, 0.3, 0.115, 0.11, 0.125, 8, 6, (nx, ny, nz) => { B.col2 = M.black; return ny > 0.35 ? S.cap : (Math.abs(nx) > 0.45 && ny > -0.3 ? (ny < 0.05 && nz < 0.4 ? S.black : S.cheek) : (nz > 0.4 && ny < 0 ? S.black : S.cheek)); }, 6, 0, 0);
  B.col2 = M.black; B.tube([0, 0.09, 0.4], [0, 0.07, 0.53], 0.036, 0.004, 5, lin('#2a2420'), 6, 0, 0);
  // tail
  B.col2 = M.gloss;
  for (const up of [1, -1]) { const y = 0.02 * up, id = [[-0.045, -0.24], [0.045, -0.24], [0.07, -0.62], [-0.07, -0.62]].map((q) => B.v(q[0], 0.01 + y * 0.2, q[1], 0, up, 0, 0, 0, mul(S.back, 0.55), 6, 0, 1)); B.quad(id[0], id[1], id[2], id[3]); }
  // wings: three stations out from the shoulder
  for (const w of [1, -1]) {
    const st = [[0.13, 0.22, -0.2], [0.44, 0.2, -0.17], [0.74, 0.05, -0.1]], ids = [];
    st.forEach((q, k) => { for (const e of [0, 1]) { B.col2 = k === 0 ? M.blue : (k === 2 && e === 0 ? M.black : M.white); ids.push(B.v(w * q[0], 0.075, e ? q[2] : q[1], 0, 1, 0, 0, 0, k === 1 ? (e ? S.bar : S.back) : mul(S.back, e ? 0.6 : 0.9), 6, w, 0)); } });
    B.quad(ids[0], ids[1], ids[3], ids[2]); B.quad(ids[2], ids[3], ids[5], ids[4]);
  }
  return B.build();
}
function lumpGeometry(noise) {
  const B = new YB();
  B.blob(0, 0, 0, 1, 0.8, 1, 8, 6, [0.9, 0.93, 0.98], 9, 1, 0, (nx, ny, nz) => 1 + 0.28 * noise.n3(nx * 1.7, ny * 1.7 + 3, nz * 1.7));
  return B.build();
}

export default {
  id: 'moon-jar-kiln',
  name: 'Fire of the Moon Jars',
  category: 'interior',
  weirdness: 0.15,
  media: ['air', 'tiny', 'interior', 'snow'],
  async build(ctx) {
    const rng = ctx.rng.fork('moon-jar-world'), noise = ctx.noise, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1, density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const look = LOOKS[vary.hour && HOURS[vary.hour] !== undefined ? HOURS[vary.hour] : hashSeed('kiln-look:' + ctx.seed) % 4];
    const T = { value: 0 };

    // ---- scene and sky. No real lights: the kiln lights itself, the yard is lit by one small analytic rig
    const scene = new THREE.Scene(), fogC = new THREE.Color(look.fog);
    scene.fog = new THREE.FogExp2(fogC, look.fogD); scene.background = fogC.clone();
    const sky = makeSky({ rng: rng.fork('sky'), ...look.sky, bake: look.name === 'night', renderer: ctx.renderer });
    scene.add(sky.object);
    await ctx.yield();

    // ---- the hero: the whole kiln. Its fire is keyed to places on the flight (the hero's marks), set once the path
    // is known: see `keys` below
    const hero = await buildHero(ctx, { palette: PALETTE, rare, spyJets: look.jets, flueLight: look.flue, flueReach: look.reach, warmth: look.warmth, haze: look.haze, exteriorBack: false });
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors, path = makePath(A.flyThrough), L = path.length;
    await ctx.yield();
    const tmp = new V3();
    // u at which the flight passes each of the path's control points
    const uPt = [];
    {
      const N = 1800, sx = new Float32Array(N + 1), sy = new Float32Array(N + 1), sz = new Float32Array(N + 1);
      for (let i = 0; i <= N; i++) { path.pointAt(i / N, tmp); sx[i] = tmp.x; sy[i] = tmp.y; sz[i] = tmp.z; if ((i & 255) === 255) await ctx.yield(); }
      let j = 0;
      for (const c of A.flyThrough) {
        let best = 1e9, bi = j;
        for (let i = j; i <= Math.min(N, j + 260); i++) { const dx = sx[i] - c.x, dy = sy[i] - c.y, dz = sz[i] - c.z, dd = dx * dx + dy * dy + dz * dz; if (dd < best) { best = dd; bi = i; } }
        uPt.push(bi / N); j = bi;
      }
    }
    const MK = A.marks, uW = MK.walls.map((i) => uPt[i]), uM = uPt[MK.mouth], uO0 = uPt[MK.orbit[0]], uO1 = uPt[MK.orbit[1]], uT = uPt[MK.throat];
    const uOr = (f) => lerp(uO0, uO1, f), mid = (a, b) => (uW[a] + uW[b]) / 2;
    // the fire front (metres into the kiln) against the flight. It runs a chamber and a half ahead through chambers
    // 1 and 2, lets us catch it up along the left-hand rank in 3 and 4 (the jars beside us are mid-melt), pulls away
    // again, crosses the great chamber during the orbit, and stalls at the foot of chamber 10, where we fly up through
    // its tongues and leave it behind: chambers 11 and 12 are cold, ember-red below and cool above
    const frontKeys = [[0, 30], [uM * 0.75, 34], [uM, 44], [uW[0], 96], [uW[1], 116], [uW[2], 131], [mid(2, 3), 146], [uW[3], 165], [mid(3, 4), 185], [uW[4], 211], [mid(4, 5), 258], [uW[5], 286],
      [uW[6], 300], [uO0, 310], [uOr(0.5), 332], [uO1, 362], [uW[7], 398], [mid(7, 8), 414], [uW[8], 428], [mid(8, 9), 434], [uW[9], 446], [uW[9] + 0.02, 460], [1, 464]];
    // the great jar's melt: the line starts at the lip as we enter, stands on the shoulder as the orbit begins, and
    // the body is a lantern, white-hot at the shoulder, before the orbit is three quarters round
    const greatMeltKeys = [[uW[6] - 0.02, 0], [uW[6], 0.2], [uO0, 0.42], [uOr(0.2), 0.52], [uOr(0.4), 0.64], [uOr(0.6), 0.82], [uOr(0.75), 1]];
    scene.userData.marks = { uM, uW, uO0, uO1, uT, L };
    hero.setKeys({ frontKeys, greatMeltKeys, coneAt: [uOr(0.2), uOr(0.32), uOr(0.44)], collapseAt: uOr(0.58) });
    // the two thrown splits: each is in the air, catching, as we come through the wall below its chamber
    const logAt = [uW[2] - 0.026, uW[4] - 0.030];

    // ---- the ground: the yard, the hill the kiln lies up
    const groundY = (x, z) => {
      const ax = Math.abs(x), kil = hero.floorY(Math.max(-z, 0)), face = smoothstep(4, -12, z), inK = smoothstep(62, 46, ax);
      const out = clamp(smoothstep(125, 210, ax) + smoothstep(165, 240, z), 0, 1);
      return kil * face - 3 * face * inK + (1 - inK) * face * (5 + 0.05 * Math.max(ax - 60, 0)) + out * (7 * noise.fbm2(x * 0.006, z * 0.006, 3) + 0.045 * Math.max(ax - 125, 0) + 4);
    };
    const yard = new THREE.Group(); yard.name = 'yard'; scene.add(yard);
    const YU = {
      uSkyC: { value: new V3(...look.skyC) }, uGndC: { value: new V3(...look.gndC) }, uSunC: { value: new V3(...look.sunC) }, uSunDir: { value: look.sunDir.clone().normalize() },
      uFogC: { value: new V3(fogC.r, fogC.g, fogC.b) }, uFireC: { value: new V3(...look.fire) }, uSnowC: { value: new V3(0.86, 0.9, 0.96) },
      uFogD: { value: look.fogD }, uTime: T, uSnow: { value: look.snow }, uSpark: { value: look.sparkle }, uDrift: { value: new THREE.Vector2(look.drift[0], look.drift[1]) },
    };
    const propMat = new THREE.ShaderMaterial({ uniforms: YU, vertexShader: PROP_VERT, fragmentShader: PROP_FRAG, side: THREE.DoubleSide });
    const birdMat = new THREE.ShaderMaterial({ uniforms: YU, vertexShader: PROP_VERT, fragmentShader: PROP_FRAG, side: THREE.DoubleSide, defines: { BIRD: 1 } });
    {
      const NX = 110, NZ = 110, pos = new Float32Array((NX + 1) * (NZ + 1) * 3), idx = [];
      for (let r = 0; r <= NZ; r++) {
        for (let c = 0; c <= NX; c++) { const x = -440 + 880 * c / NX, z = -440 + 700 * r / NZ, k = (r * (NX + 1) + c) * 3; pos[k] = x; pos[k + 1] = groundY(x, z); pos[k + 2] = z; }
        await ctx.yield();       // every row
      }
      for (let r = 0; r < NZ; r++) for (let c = 0; c < NX; c++) { const a = r * (NX + 1) + c, b = a + NX + 1; idx.push(a, b, a + 1, a + 1, b, b + 1); }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(idx);
      await ctx.yield();
      g.computeVertexNormals();
      await ctx.yield();
      g.computeBoundingSphere();
      await ctx.yield();
      const sd = look.sunDir, uBoard = BOARDS.map((b) => new THREE.Vector4(b[0], b[1], b[2], b[3]));
      const groundMat = new THREE.ShaderMaterial({
        uniforms: { ...YU, uBoard: { value: uBoard }, uJar: { value: [] }, uTrail: { value: [[2.5, 128], [-1.5, 84], [1.8, 44], [10, 18], [34, 2]].map((q) => new THREE.Vector2(q[0], q[1])) },
          uShOff: { value: look.shadow ? new V3(-sd.x / sd.y, -sd.z / sd.y, 1) : new V3(0, 0, 0) }, uLeaves: { value: look.name === 'dusk' ? 1 : 0 } },
        vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, defines: look.shadow ? { JAR_SHADOWS: 1 } : {},
      });
      const ground = new THREE.Mesh(g, groundMat); ground.name = 'snow-ground'; yard.add(ground); yard.userData.groundMat = groundMat;
    }
    await ctx.yield();
    const ext = hero.object.getObjectByName('kiln-exterior');
    if (ext) {
      const g = ext.geometry, n = g.getAttribute('position').count, aux = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) aux[i * 3] = 10;
      g.deleteAttribute('aAux'); g.deleteAttribute('aMat'); g.setAttribute('aAux', new THREE.BufferAttribute(aux, 3));
      ext.material.dispose(); ext.material = propMat;
    }

    // ---- everything standing in the yard, merged into two meshes
    const jarsNear = [], jarsFar = [];
    const B1 = new YB(), yr = rng.fork('yard');
    buildBoards(B1, yr, jarsNear, jarsFar); await ctx.yield();
    // two more raw jars past the ends of the boards, each on a sawn stump with a wedge under it: they stand either
    // side of the aisle's end and frame the fire mouth; the sparrows' last perch
    for (const sx of [-1, 1]) {
      const gx = sx * 10.7, gz = 24.6;
      B1.tube([gx, -0.6, gz], [gx, BOARD_Y - 0.5, gz], 3.5, 3.15, 14, mul(BARK, 1.15), 5, 0.5, 0, 0, 3, mul(BARK, 0.95));
      B1.tube([gx, BOARD_Y - 0.5, gz], [gx, BOARD_Y, gz], 2.5, 2.35, 12, mul(WOOD_P, 0.9), 1, 0.4, 0, 0, 3);
      for (let k = 0; k < 3; k++) { const a = k * 2.1 + sx; B1.box(gx + Math.cos(a) * 2.9, BOARD_Y - 0.28, gz + Math.sin(a) * 2.9, 1.5, 0.5, 0.8, -a, mul(WOOD, 0.8), 1, 0.4, 1, 3); }
      jarsNear.push({ x: gx, y: BOARD_Y, z: gz, S: JAR_S * 1.03, yaw: 1.3 + sx, tx: 0.015 * sx, tz: -0.01, sx: 1.01, sy: 1.0, sz: 0.99 });
    }
    const stackTops = await buildStack(ctx, B1, yr); await ctx.yield();
    const bowl = buildProps(B1, yr, stackTops); await ctx.yield();
    buildFront(B1, rng.fork('front')); await ctx.yield();
    await buildGrass(ctx, B1, yr, groundY, density * detail); await ctx.yield();
    const B2 = new YB();
    buildShed(B2, yr, noise, look, groundY); await ctx.yield();
    const tips = await buildTree(ctx, B2, yr, look); await ctx.yield();
    buildPines(B2, yr, groundY, density); await ctx.yield();
    const near = new THREE.Mesh(await B1.buildSlowly(ctx), propMat);
    const far = new THREE.Mesh(await B2.buildSlowly(ctx), propMat); near.name = 'yard-near'; far.name = 'yard-far'; yard.add(near, far);
    await ctx.yield();

    // ---- the raw jars on their boards: fourteen along the aisle at full detail, twenty-two beyond
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(0, 0, 0, 'YXZ'), P = new V3(), SC = new V3();
    const jarGeo = (nBowl, segs) => {
      const g = latheGeometry(jarProfile(nBowl, 2, false), segs), n = g.getAttribute('position').count, col = new Float32Array(n * 3), aux = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { col.set(CHALK, i * 3); aux.set([2, 1, 0], i * 3); }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3)); g.setAttribute('aAux', new THREE.BufferAttribute(aux, 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
      g.deleteAttribute('aPart');
      return g;
    };
    const jarMesh = (list, g, name) => {
      const m = new THREE.InstancedMesh(g, propMat, list.length);
      list.forEach((j, k) => { E.set(j.tx, j.yaw, j.tz); Q.setFromEuler(E); m.setMatrixAt(k, M4.compose(P.set(j.x, j.y, j.z), Q, SC.set(j.S * j.sx, j.S * j.sy, j.S * j.sz))); });
      m.instanceMatrix.needsUpdate = true; m.computeBoundingSphere(); m.name = name; yard.add(m); return m;
    };
    jarMesh(jarsNear, jarGeo(10, Math.round(40 * (0.7 + 0.3 * detail))), 'raw-jars-aisle'); await ctx.yield();
    jarMesh(jarsFar, jarGeo(5, 20), 'raw-jars-far');
    yard.userData.groundMat.uniforms.uJar.value = jarsNear.slice(0, NJ).map((j) => new THREE.Vector4(j.x, j.z, BOARD_Y, BOARD_Y + 0.985 * j.S * j.sy));
    await ctx.yield();

    // ---- birds (five sparrows of our own size, three magpies) and the snow that slides off the eave
    const NBIRD = 8, birdGeo = buildBird(), aBird = new Float32Array(NBIRD * 4), aBirdAttr = new THREE.InstancedBufferAttribute(aBird, 4);
    aBirdAttr.setUsage(THREE.DynamicDrawUsage); birdGeo.setAttribute('aBird', aBirdAttr);
    const birds = new THREE.InstancedMesh(birdGeo, birdMat, NBIRD); birds.name = 'birds'; birds.frustumCulled = false; birds.instanceMatrix.setUsage(THREE.DynamicDrawUsage); yard.add(birds);
    const setBird = (i, x, y, z, yaw, pitch, roll, S, kind, spread, flap, tail) => {
      E.set(pitch, yaw, roll); Q.setFromEuler(E); birds.setMatrixAt(i, M4.compose(P.set(x, y, z), Q, SC.set(S, S, S)));
      aBird[i * 4] = kind; aBird[i * 4 + 1] = spread; aBird[i * 4 + 2] = flap; aBird[i * 4 + 3] = tail;
    };
    const LEADS = [19.4, 29.6, 21.7, 32.4, 39.8], NMAX = [7, 7, 7, 7, 6], PITCHZ = (104 - 36) / 6;
    const perch = (i, n, out) => {
      const side = i % 2 ? 1 : -1, j = n > 6 ? jarsNear[side < 0 ? 14 : 15] : jarsNear[(side < 0 ? 0 : 7) + (6 - n)], a = (i - 2) * 0.55;
      return out.set(j.x - side * 1.75 * Math.cos(a), BOARD_Y + 0.985 * j.S * j.sy + 0.55, j.z + 1.75 * Math.sin(a));
    };
    const stackTopY = stackTops[Math.round((66 - STACK.z0) / STACK.cell)] || 30;
    const MAG = [new V3(STACK.x0 + 1.4, stackTopY + 1.5, 66), new V3(0, 6, 30), new V3(-62, 36, 8)];
    const RIDGE = [[-10, roofY(10, 30) + (look.snow > 0.5 ? 2.9 : 0.6) + 1.3, 19, 0.6], [15, roofY(15, 30) + (look.snow > 0.5 ? 2.9 : 0.6) + 1.3, 17.5, -0.9]];
    const NL = 44, lumps = new THREE.InstancedMesh(lumpGeometry(noise), propMat, NL), lumpData = [], lr = rng.fork('lumps');
    lumps.name = 'eave-snow'; lumps.frustumCulled = false; lumps.instanceMatrix.setUsage(THREE.DynamicDrawUsage); yard.add(lumps);
    for (let i = 0; i < NL; i++) {
      const x = (i % 2 ? 1 : -1) * lr.range(9, 47), small = i >= 26;
      lumpData.push({ x, y: roofY(x, 30) + 0.6, z: 22.4 + lr.range(-0.6, 0.4), r: small ? lr.range(0.5, 1.1) : lr.range(1.4, 3.2), delay: lr.range(0, 0.42) + (small ? 0.1 : 0), vx: lr.range(-1, 1), vz: lr.range(0.5, 2.5), spin: lr.range(-2, 2) });
    }
    lumps.visible = look.snow > 0.5;
    await ctx.yield();

    // ---- air: what falls in the yard (and down the flue), steam off the thatch and the wet clay, embers and sparks in the kiln
    const dq = detail * density;
    const FALL = {
      snowfall: { preset: 'snow', count: Math.round(5200 * dq), box: [84, 52, 84], size: [0.12, 0.34], velocity: [1.7, -2.6, 0.3], opacity: 0.95 },
      morning: { preset: 'snow', count: Math.round(800 * dq), box: [80, 50, 80], size: [0.07, 0.2], velocity: [0.25, -0.3, 0.1], velocityRandom: [0.3, 0.2, 0.3], shape: 'sparkle', twinkle: 1, colors: ['#fff4d8', '#ffffff', '#ffe0a8'], intensity: 2.4, additive: 1 },
      dusk: { preset: 'leaves', count: Math.round(900 * dq), box: [90, 50, 90], size: [0.8, 1.7], velocity: [2.2, -2.4, 0.6], colors: ['#c2501a', '#e08a1e', '#8a3a12'], lightDir: look.sunDir.toArray() },
      night: { preset: 'snow', count: Math.round(2600 * dq), box: [90, 54, 90], size: [0.08, 0.3], velocity: [0.3, -0.35, 0.1], velocityRandom: [0.5, 0.3, 0.5], turbulence: [1.2, 0.5, 0.6], shape: 'sparkle', twinkle: 1, colors: ['#cfe0ff', '#ffffff', '#ffc890'], intensity: 2.6, additive: 1 },
    }[look.name];
    const fall = fx.makeParticles({ rng: rng.fork('fall'), time: T, ...FALL }); scene.add(fall.object);
    const steamCol = { snowfall: '#e9eff6', morning: '#ffe9c4', dusk: '#dcbfb8', night: '#56607c' }[look.name];
    const steam = fx.makeMist({ rng: rng.fork('steam'), time: T, count: Math.round(34 * dq), center: [0, 50, -24], area: [124, 22, 96], size: [15, 32], color: steamCol, opacity: 0.2, drift: [1.5, 0, 0.35] });
    const bowlSteam = fx.makeMist({ rng: rng.fork('bowl'), time: T, positions: [[bowl[0], bowl[1] + 0.6, bowl[2]], [bowl[0] + 0.5, bowl[1] + 2.6, bowl[2] - 0.3], [bowl[0] + 1.3, bowl[1] + 5, bowl[2] - 0.8]], size: [2.2, 4.2], color: steamCol, opacity: 0.3 });
    yard.add(steam.object, bowlSteam.object);
    const embers = fx.makeParticles({ rng: rng.fork('embers'), time: T, preset: 'embers', count: Math.round(1000 * dq), box: [52, 36, 64], velocity: [0, 3.2, -5.5], size: [0.1, 0.38], intensity: 2.6, fog: false });
    const sparks = fx.makeParticles({ rng: rng.fork('sparks'), time: T, preset: 'sparks', count: Math.round(320 * dq), box: [46, 32, 60], velocity: [0, 6, -11], velocityRandom: [4, 4, 6], size: [0.035, 0.08], intensity: 2.8, fog: false });
    // the draught of the quiet chambers and the flue: big slow embers going up with us
    const motes = fx.makeParticles({ rng: rng.fork('motes'), time: T, preset: 'embers', count: Math.round(520 * dq), box: [44, 30, 52], velocity: [0, 3.4, -4.2], velocityRandom: [1.4, 1.2, 1.6], turbulence: [1.6, 0.8, 0.5], size: [0.16, 0.42], near: [2, 8], intensity: 2.4, fadeUp: 0, twinkle: 0.6, fog: false });
    embers.setOpacity(0); sparks.setOpacity(0); motes.setOpacity(0);
    scene.add(embers.object, sparks.object, motes.object);
    // sparks that the draught carries out of the fire mouth and up past the gable
    const mouthSparks = fx.makeParticles({ rng: rng.fork('mouth'), time: T, preset: 'embers', follow: false, center: [0, 24, 13], box: [34, 48, 26], count: Math.round(420 * dq), velocity: [0.5, 5, 1.2], velocityRandom: [1.6, 2, 1.4], size: [0.12, 0.4], intensity: 2.8, fadeUp: 0.7 });
    yard.add(mouthSparks.object);
    await ctx.yield();

    // ---- flight: speed per beat, gaze
    const pace = (u) => 0.6 + 0.62 * smoothstep(uM - 0.035, uW[0] + 0.01, u) - 0.68 * smoothstep(uW[6] - 0.012, uO0 + 0.012, u) + 0.68 * smoothstep(uO1, uO1 + 0.055, u) - 0.22 * smoothstep(uT - 0.06, uT - 0.02, u);
    const G = A.greatJar, jarC = G.center.clone().setY(G.center.y + 0.2), cj = rare && A.collapseJar ? A.collapseJar.clone() : null, cjK = new V3();
    const lookBack = cj ? (time, u) => cjK.copy(cj).setY(cj.y - 3 * smoothstep(uOr(0.62), uOr(0.86), u)) : new V3(1, G.floorY + 12, G.center.z + 13);
    const a9 = A.arches[9];
    const upK = new V3(), upK2 = new V3(), sideK = new V3(), rankK = new V3(), rankK2 = new V3(), rank3K = new V3(), wkP = new V3();
    const wallK = (u) => { path.pointAt(u, wkP); let wk = 99; for (const a of A.arches) wk = Math.min(wk, Math.abs(-wkP.z - a.d)); return smoothstep(5, 17, wk); };
    // a point 30 m from the eye, `az` radians left of straight up the kiln and `el` above level
    const rel = (u, az, el, out) => { path.pointAt(u, out); const ch = Math.cos(el); return out.set(out.x - 30 * Math.sin(az) * ch, out.y + 30 * Math.sin(el), out.z - 30 * Math.cos(az) * ch); };
    const pois = [
      // chambers 1 and 2: low among the jars, the gaze up and a little right at the river of flame on the crown, seen
      // aslant so that its licks run past us and the first arch stands left of centre
      // (through a wall it is only tilted up: an arch's jambs stand close either side)
      { at: (time, u) => { const wk = wallK(u); path.pointAt(Math.min(u + 0.05, 1), upK); return upK.set(13 * wk, upK.y + (upK.z > -92 ? 25 + 3 * wk : 8 + 20 * wk), upK.z); }, from: uM + 0.004, to: uW[1] + 0.004, weight: 0.7 },
      // into chamber 2: from inside its arch the gaze goes steeply up at the long licks on the crown, the tops of
      // the jars along the bottom of the frame
      { at: (time, u) => rel(u, 0.06, 0.93, upK2), from: uW[1] - 0.03, to: uW[1] + 0.024, weight: 0.86 },
      // chamber 2's upper half and the wide arch into chamber 3, low and at the height of the jars: the gaze goes left
      // down the left-hand rank where the melt line is crossing it (gold nearest, half-melted next, chalk beyond), the
      // river on the crown above them and the next arch to the right; once through, round onto the rank side-on
      { at: (time, u) => { const k = smoothstep(uW[2] + 0.002, uW[2] + 0.014, u) * (1 - smoothstep(uW[2] + 0.02, uW[2] + 0.03, u)); const near = smoothstep(uW[2] - 0.017, uW[2] - 0.001, u); return rel(u, lerp(lerp(0.22, 0.5, near), 0.95, k), lerp(lerp(0.33, 0.37, near), 0.2, k), rank3K); }, from: uW[1] + 0.012, to: uW[3] - 0.017, weight: 0.86, fade: 0.25 },
      // the arch into chamber 4, taken high on the left: the gaze goes right and a little down, across the shoulders
      // and mouths of its right-hand rank and the cold shaft beyond them
      { at: (time, u) => rel(u, -0.36, 0.1, rankK), from: uW[3] - 0.021, to: uW[3] + 0.022, weight: 0.8 },
      // the great chamber: the jar whole in the middle of the frame, all the way round
      { at: jarC, from: uW[5] - 0.034, to: rare ? uOr(0.48) : uOr(0.9), weight: 0.85, fade: 0.12 },
      // the look back from the uphill side: the jar's globe left of the arch of the fired kiln pouring flame (on a
      // rare visit: the jar that folds, on the aisle's edge to our left, until its puddle has crusted)
      { at: lookBack, from: rare ? uOr(0.34) : uOr(0.46), to: rare ? uOr(1.03) : uOr(0.72), weight: rare ? 0.85 : 0.22 },
      // round to the downhill side again: the jar, now a lantern, against the upper arch as the fire pours through it
      { at: jarC, from: rare ? uOr(0.96) : uOr(0.42), to: uO1 + 0.045, weight: 0.85, fade: rare ? 0.3 : 0.2 },
      { at: new V3(0, A.arches[7].sillY + 13, -A.arches[7].d), from: uO1 + 0.03, to: uW[7] - 0.004, weight: 0.75, fade: 0.25 },
      { at: A.portalSeat.position.clone(), from: uW[7] - 0.02, to: 0.9, weight: 0.4 },
      // chamber 8: low on the left, the gaze well round to the right and up: the right-hand rank of gold lanterns from
      // below their shoulders, the river streaming up the crown over them
      { at: (time, u) => rel(u, -1.0, 0.3, rankK2), from: uW[7] + 0.002, to: uW[8] - 0.011, weight: 0.84 },
      // chamber 9: the gaze left, side-on to its gold lanterns and a little up, the tongues that pour through the arch
      // head streaming over them along the vault; then on to the first rank beyond arch 9, which is going over as we come through
      { at: (time, u) => rel(u, 0.62, 0.27, rankK), from: uW[8] - 0.006, to: uW[9] - 0.012, weight: 0.84, fade: 0.3 },
      { at: (time, u) => { path.pointAt(Math.min(u + 0.014, 1), sideK); const z = Math.min(sideK.z, -(a9.d + 11)); return sideK.set(-17, hero.floorY(-z) + 7, z); }, from: uW[9] - 0.012, to: uW[9] + 0.036, weight: 0.7 },
    ].filter((p) => p.weight > 0);

    await sky.prewarm(ctx.renderer, null, scene);

    // ---- per-frame state
    const pA = new V3(), pB = new V3(), pC = new V3();
    let yardOn = true, skyOn = true, lumpK = -1;
    const lerpAngle = (a, b, t) => a + (b - a) * t;
    const updateBirds = (time, u) => {
      const s = u * 862.4, nS = look.sparrows;
      for (let i = 0; i < 5; i++) {
        if (i >= nS) { setBird(i, 0, -50, 0, 0, 0, 0, 0.001, 0, 0, 0, 0); continue; }
        const side = i % 2 ? 1 : -1, f = (LEADS[i] + s - 16) / PITCHZ, fl = Math.floor(f), n0 = clamp(fl, 0, NMAX[i]), h = fl < NMAX[i] ? smoothstep(0.68, 1, f - fl) : 0;
        perch(i, n0, pA); perch(i, Math.min(n0 + 1, NMAX[i]), pB);
        const hb = Math.sin(PI * h), fid = Math.pow(Math.abs(Math.sin(time * 1.3 + i * 2.1)), 14);
        let x = lerp(pA.x, pB.x, h), y = lerp(pA.y, pB.y, h) + hb * 3.4 + fid * 0.7 * (1 - hb), z = lerp(pA.z, pB.z, h);
        let yaw = lerpAngle(-side * 1.0 + 0.5 * Math.sin(time * 0.8 + i * 1.9) + 0.4 * Math.sin(time * 2.9 + i), -side * 2.7, hb), pitch = -0.25 * hb + 0.2 * fid, spread = Math.pow(hb, 0.6) + fid * 0.6;
        let flap = Math.sin(time * 36 + i * 1.7), S = 2.8;
        const kF = smoothstep(0.098 + 0.007 * i, 0.155 + 0.007 * i, u);
        if (kF > 0) {
          const dx = -72 - 7 * i, dy = 44 + 5 * i, dz = -22 + 9 * i, e = Math.pow(kF, 1.25);
          x += dx * e; y += dy * e + 9 * Math.sin(PI * kF); z += dz * e + Math.sin(time * 3 + i) * 1.5 * kF;
          const g = smoothstep(0, 0.12, kF); yaw = lerpAngle(yaw, Math.atan2(dx, dz), g); pitch = lerp(pitch, -0.5, g); spread = Math.max(spread, g); flap = Math.sin(time * 30 + i * 2.3);
          if (kF >= 1) S = 0.001;
        }
        setBird(i, x, y, z, yaw, pitch, 0, S, 0, clamp(spread, 0, 1), flap, 0.3 * Math.pow(Math.max(Math.sin(time * 2.3 + i * 1.7), 0), 6));
      }
      for (let k = 0; k < 2; k++) {
        const r = RIDGE[k];
        setBird(5 + k, r[0], r[1] + 0.25 * Math.pow(Math.abs(Math.sin(time * 0.7 + k * 2)), 10), r[2], r[3] + 0.5 * Math.sin(time * 0.31 + k * 4), 0.13 * Math.sin(time * 1.4 + k * 2.2), 0, 9, 1, 0.06 * Math.pow(Math.max(Math.sin(time * 0.53 + k), 0), 8), Math.sin(time * 9), 0.35 * Math.pow(Math.max(Math.sin(time * 0.9 + k * 3), 0), 4));
      }
      // the third magpie: bobbing on the wood stack, then across the path 30 m ahead
      const km = clamp((u - 0.05) / 0.045, 0, 1);
      if (km <= 0) setBird(7, MAG[0].x, MAG[0].y + 0.3 * Math.pow(Math.abs(Math.sin(time * 1.1)), 8), MAG[0].z, -1.9 + 0.4 * Math.sin(time * 0.5), 0.16 * Math.sin(time * 1.9), 0, 9, 1, 0.1 * Math.pow(Math.max(Math.sin(time * 0.8), 0), 6), Math.sin(time * 9), 0.4 * Math.pow(Math.max(Math.sin(time * 1.3), 0), 4));
      else {
        const t = km * km * (3 - 2 * km) * 0.35 + km * 0.65, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
        pC.set(a * MAG[0].x + b * MAG[1].x + c * MAG[2].x, a * MAG[0].y + b * MAG[1].y + c * MAG[2].y, a * MAG[0].z + b * MAG[1].z + c * MAG[2].z);
        const tx = 2 * (1 - t) * (MAG[1].x - MAG[0].x) + 2 * t * (MAG[2].x - MAG[1].x), ty = 2 * (1 - t) * (MAG[1].y - MAG[0].y) + 2 * t * (MAG[2].y - MAG[1].y), tz = 2 * (1 - t) * (MAG[1].z - MAG[0].z) + 2 * t * (MAG[2].z - MAG[1].z);
        const fl2 = Math.sin(time * 13);
        setBird(7, pC.x, pC.y + 0.5 * fl2, pC.z, Math.atan2(tx, tz), -Math.atan2(ty, Math.hypot(tx, tz)) * 0.8, 0.25, km >= 1 ? 0.001 : 9, 1, smoothstep(0, 0.08, km), fl2 * 0.95, 0.05);
      }
      birds.instanceMatrix.needsUpdate = true; aBirdAttr.needsUpdate = true;
    };
    const updateLumps = (u) => {
      const k = clamp((u - 0.066) / 0.052, -0.01, 1.8);
      if (k === lumpK) return; lumpK = k;
      for (let i = 0; i < NL; i++) {
        const d = lumpData[i], kk = clamp((k - d.delay) / 0.55, 0, 1.6), t = Math.max(kk - 0.2, 0) * 2.6;
        let y = d.y - 4.9 * t * t, sy = 0.8, sx = 1; const fy = d.r * 0.3;
        if (y < fy) { y = fy; sy = 0.42; sx = 1.35; }
        E.set(d.spin * t, d.spin * 0.7 * t + i, 0); Q.setFromEuler(E);
        lumps.setMatrixAt(i, M4.compose(P.set(d.x + d.vx * t, y, d.z + Math.min(kk / 0.2, 1) * 2.6 + d.vz * t), Q, SC.set(d.r * sx, d.r * sy, d.r * sx)));
      }
      lumps.instanceMatrix.needsUpdate = true;
    };
    updateBirds(0, 0); updateLumps(0);

    return {
      scene, path, duration: 44, pace,
      camera: { fov: 62, near: 0.4, far: 3200, lookAhead: 30, sway: 0.8, bank: 0.06 },
      pois,
      portal: { shape: 'rect', width: 14, height: 14, color: look.portal, glow: 1, tilt: true, revealDistance: 300 },
      post: { exposure: look.exposure, bloom: { strength: 0.13, radius: 0.55, threshold: 1.22 }, grade: { saturation: 1.06, contrast: 1.05, tint: '#ffffff', shadowTint: '#06080e', vignette: 0.3, grain: 0.02 } },
      ride: 'none',
      update(dt, time, camera, u) {
        T.value = time;
        const uy = u * L / 862.4;        // the yard's moments were timed on a flight of 862 m: keep them where they were
        hero.setProgress(u);
        for (let i = 0; i < logAt.length; i++) hero.setLogDrop(i, (u - logAt[i]) / 0.036);
        hero.update(dt, time, camera);
        const inYard = u < 0.3, showSky = u < 0.2 || u > 0.6;
        if (inYard !== yardOn) { yardOn = inYard; yard.visible = inYard; }
        if (showSky !== skyOn) { skyOn = showSky; sky.object.visible = showSky; }
        if (inYard) { updateBirds(time, uy); updateLumps(uy); steam.update(dt, time, camera); bowlSteam.update(dt, time, camera); mouthSparks.update(dt, time, camera); }
        const inFlue = smoothstep(uT - 0.02, uT + 0.008, u) * (look.name === 'dusk' ? 0.8 : 1);
        fall.setOpacity(Math.max(1 - smoothstep(0.096, 0.121, uy), inFlue) * (FALL.opacity ?? 1));
        const hot = smoothstep(0.125, 0.16, uy);
        embers.setOpacity(hot);
        sparks.setOpacity(hot);
        motes.setOpacity(smoothstep(0.62, 0.7, u));
        fall.update(dt, time, camera); embers.update(dt, time, camera); sparks.update(dt, time, camera); motes.update(dt, time, camera);
        if (showSky) sky.update(dt, time, camera);
      },
      dispose() { hero.dispose(); sky.dispose(); },
    };
  },
};
