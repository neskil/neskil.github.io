// THE RED WEED: what every piece of this world shares. One set of uniforms (the dusk: sky colours, the afterglow's
// direction, key and fill light, fog, mist, the weed's three colours), one GLSL chunk (noise, the sky as a function
// of direction, fog, the mist that lies on the water, the shading of the weed) and a small mesh accumulator.
// The sky is a FUNCTION here (rwSky) so that the water, the metal of the engines and the dome all show the same
// evening: a reflection is the sky's own colour in that direction, never an approximation of it.
import * as THREE from 'three';

export const DEG = Math.PI / 180;
export const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const fract = (x) => x - Math.floor(x);

// ---------------------------------------------------------------- colours as they will be SEEN
// The film's last pass (src/core/post.js: exposure, a filmic curve, saturation, contrast, shadow tint) crushes
// every dark saturated colour: a slate blue of the brief's own numbers comes out pure blue, a carmine pure red,
// anything under about 0.035 black. So this world names its colours as they must look on the screen and asks
// shown() for the scene colour that the last pass turns into exactly that.
const fitc = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
const srgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);
function tone(x, P, tint) {
  const e = P.exposure / 0.6, r = Math.max(x[0], 0) * e, g = Math.max(x[1], 0) * e, b = Math.max(x[2], 0) * e;
  const f0 = fitc(0.59719 * r + 0.35458 * g + 0.04823 * b), f1 = fitc(0.076 * r + 0.90834 * g + 0.01566 * b), f2 = fitc(0.0284 * r + 0.13383 * g + 0.83777 * b);
  let o = [clamp(1.60475 * f0 - 0.53108 * f1 - 0.07367 * f2, 0, 1), clamp(-0.10208 * f0 + 1.10813 * f1 - 0.00605 * f2, 0, 1), clamp(-0.00327 * f0 - 0.07276 * f1 + 1.07602 * f2, 0, 1)];
  const l = 0.2126 * o[0] + 0.7152 * o[1] + 0.0722 * o[2], sh = 0.5 * (1 - sstep(0, 0.6, l));
  return o.map((v, k) => srgb(clamp((l + (v - l) * P.saturation - 0.5) * P.contrast + 0.5 + tint[k] * sh, 0, 1)));
}
export const POST = { exposure: 1.15, saturation: 1.06, contrast: 1.05, shadowTint: '#070B18' };
// the scene colour (linear) that reaches the screen as `hex`; `gain` scales the result
export function shown(hex, P = POST, gain = 1) {
  const t = new THREE.Color(hex), tc = new THREE.Color(P.shadowTint ?? '#000000'), tint = [tc.r, tc.g, tc.b], T = [srgb(t.r), srgb(t.g), srgb(t.b)];
  const err = (x) => { const f = tone(x, P, tint); return (f[0] - T[0]) ** 2 + (f[1] - T[1]) ** 2 + (f[2] - T[2]) ** 2; };
  let x = [t.r * 0.6 + 0.04, t.g * 0.6 + 0.04, t.b * 0.6 + 0.04], e = err(x), step = 0.06;
  for (let it = 0; it < 260 && step > 2e-5; it++) {
    let best = -1, be = e;
    for (let k = 0; k < 6; k++) { const y = x.slice(); y[k >> 1] = Math.max(0, y[k >> 1] + (k & 1 ? -step : step)); const ey = err(y); if (ey < be) { be = ey; best = k; } }
    if (best < 0) step *= 0.5; else { x[best >> 1] = Math.max(0, x[best >> 1] + (best & 1 ? -step : step)); e = be; }
  }
  return new THREE.Color(x[0] * gain, x[1] * gain, x[2] * gain);
}

// The evening, as numbers. `P` (optional) overrides any field: the seeded hours of the world file do that.
// Every hex here is a colour AS SEEN (see shown()), except the key light's.
export function makeShared(P = {}) {
  const glowAz = (P.glowAz ?? -12) * DEG;                        // azimuth of the afterglow: 0 = -Z, +90 = +X
  const gd = new THREE.Vector3(Math.sin(glowAz), 0, -Math.cos(glowAz));
  const keyEl = (P.keyEl ?? 8) * DEG;
  const keyDir = new THREE.Vector3(gd.x * Math.cos(keyEl), Math.sin(keyEl), gd.z * Math.cos(keyEl));
  const post = { ...POST, ...(P.post || {}) }, S = (hex, gain = 1) => shown(hex, post, gain);
  const U = {
    uTime: { value: 0 },
    uSkyZen: { value: S(P.zenith ?? '#16223F') }, uSkyMid: { value: S(P.mid ?? '#2C3F63') },
    uSkyLow: { value: S(P.low ?? '#3A4A6C') }, uSkyRose: { value: S(P.rose ?? '#D97C83', P.roseGain ?? 1) },
    uSkyAmber: { value: S(P.amber ?? '#E9A15B', P.amberGain ?? 1.12) }, uSkyGnd: { value: S(P.ground ?? '#262E46') },
    uGlow: { value: new THREE.Vector4(gd.x, P.bandH ?? 1, gd.z, P.glow ?? 1) },      // xz: toward the afterglow; y: height of the bands (1 = 5 and 14 degrees); w: strength
    uCloud: { value: new THREE.Vector4(P.cloud ?? 0, P.cloudBase ?? 0.13, P.cloudSoft ?? 0.1, 0) },   // a slate deck above the band (the clearing storm): amount, sine of its lower edge, softness
    uCloudCol: { value: S(P.cloudCol ?? '#2A3246') },
    uKeyDir: { value: keyDir }, uKeyCol: { value: C(P.keyCol ?? '#F0B27A', P.keyI ?? 0.5) },                 // the afterglow as a light: soft and low (there is no sun)
    uHemiSky: { value: S(P.hemiSky ?? '#66708E', P.hemiI ?? 1) }, uHemiGnd: { value: S(P.hemiGnd ?? '#3A3742', P.hemiI ?? 1) },   // a white card under the open sky, and one facing the ground
    uFogCol: { value: S(P.fog ?? '#2A3552') }, uFogDen: { value: P.fogDen ?? 0.0009 },
    uMist: { value: new THREE.Vector4(P.mistTop ?? 3.2, P.mistDen ?? 0.0017, 0, 0) },      // top of the mist on the water (m), density per metre
    uMistCol: { value: S(P.mistCol ?? '#767482', P.mistGain ?? 1) },
    uWeedA: { value: S(P.weed ?? '#96152A') },                  // lit faces: deep matt carmine
    uWeedD: { value: S(P.weedShade ?? '#470C1B') },             // shade: wine, never black
    uWeedG: { value: S(P.weedGlow ?? '#CC2740') },              // the light that comes through a frond
    uWeedS: { value: S(P.weedSick ?? '#B6ABA4') },              // the sick weed lit: chalk and grey-pink
    uWeedSD: { value: S(P.weedSickShade ?? '#5C5762') }, uWeedSG: { value: S(P.weedSickGlow ?? '#DCD1C3') },
    // least widths go by distance alone: a rod or rope is never drawn thinner than 0.8 x 0.0018 of its distance from
    // the eye's place (1 m at 700 m), a flake never under 1.1 x 0.0018; thinner than that a line breaks into dots
    uPx: { value: 0.0018 },
    uFire: { value: new THREE.Vector4(400, 60, -1500, 0) },      // where the far wood burns (the world sets it), and how strongly its glow reaches the valley
    uFireCol: { value: C(P.fireCol ?? '#FF7A2E', 1) },
  };
  return { U, glowDir: gd, keyDir, glowAz, post, shown: S };
}

// ---------------------------------------------------------------- GLSL shared by every shader of this world
export const RW_GLSL = /* glsl */`
uniform float uTime, uFogDen, uPx;
uniform vec3 uSkyZen, uSkyMid, uSkyLow, uSkyRose, uSkyAmber, uSkyGnd, uKeyDir, uKeyCol, uHemiSky, uHemiGnd, uFogCol, uMistCol, uWeedA, uWeedD, uWeedG, uWeedS, uWeedSD, uWeedSG, uCloudCol;
uniform vec4 uGlow, uMist, uCloud, uFire; uniform vec3 uFireCol;
float rwH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float rwH3(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
float rwN(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(rwH(i), rwH(i + vec2(1.,0.)), f.x), mix(rwH(i + vec2(0.,1.)), rwH(i + vec2(1.,1.)), f.x), f.y);
}
float rwN3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  float a = mix(mix(rwH3(i), rwH3(i + vec3(1.,0.,0.)), f.x), mix(rwH3(i + vec3(0.,1.,0.)), rwH3(i + vec3(1.,1.,0.)), f.x), f.y);
  float b = mix(mix(rwH3(i + vec3(0.,0.,1.)), rwH3(i + vec3(1.,0.,1.)), f.x), mix(rwH3(i + vec3(0.,1.,1.)), rwH3(i + vec3(1.,1.,1.)), f.x), f.y);
  return mix(a, b, f.z);
}
float rwF(vec2 p){ return 0.55*rwN(p) + 0.28*rwN(p*2.03 + 17.3) + 0.17*rwN(p*4.1 + 31.7); }
// lobed pads: xy = the vector to the nearest pad's middle, z = distance from the pad's edge, w = the pad's own number
vec4 rwPad(vec2 p){
  vec2 i = floor(p), f = fract(p); float d1 = 8.0, d2 = 8.0, id = 0.0; vec2 v1 = vec2(0.0);
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), o = vec2(rwH(i + g), rwH(i + g + 71.3)), r = g + 0.14 + 0.72*o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; v1 = r; id = o.x; } else if (d < d2) d2 = d;
  }
  return vec4(v1, sqrt(max(d2, 0.0)) - sqrt(max(d1, 0.0)), id);
}
// the evening sky in direction d (unit): slate blue deepening to the zenith; toward the afterglow a rose band and,
// on the horizon, an amber one; below the horizon the far country's haze
vec3 rwSky(vec3 d){
  float y = d.y, h = clamp(y, 0.0, 1.0);
  vec2 hd = d.xz/max(length(d.xz), 1e-4);
  float az = clamp(0.5 + 0.5*dot(hd, uGlow.xz), 0.0, 1.0);
  vec3 c = mix(uSkyMid, uSkyZen, smoothstep(0.10, 0.80, h));
  c = mix(uSkyLow, c, smoothstep(0.0, 0.26, h));
  float el = abs(y)/max(uGlow.y, 0.2);
  float e1 = el/0.16, e2 = el/0.095;
  float rose = exp(-min(e1*sqrt(max(e1, 0.0)), 40.0))*az*az*(0.35 + 0.65*az);
  float amb = exp(-min(e2*sqrt(max(e2, 0.0)), 40.0))*az*az*az;
  c = mix(c, uSkyRose, clamp(rose*0.9*uGlow.w, 0.0, 1.0));
  c = mix(c, uSkyAmber, clamp(amb*uGlow.w, 0.0, 1.0));
  c = mix(c, uCloudCol*(1.0 + 0.5*rose), uCloud.x*smoothstep(uCloud.y, uCloud.y + uCloud.z, h));
  c = mix(c, uSkyGnd + 0.25*c, 1.0 - smoothstep(-0.10, 0.0, y));
  return c;
}
vec3 rwAmb(vec3 n){ return mix(uHemiGnd, uHemiSky, 0.5 + 0.5*n.y); }
// distance fog (the scene's FogExp2) and the mist that lies on the water: cam = eye, p = the point seen
vec3 rwAir(vec3 col, vec3 p, vec3 cam){
  vec3 dv = p - cam; float dist = length(dv), dy = dv.y;
  float y0 = clamp(cam.y, -1.0, uMist.x), y1 = clamp(p.y, -1.0, uMist.x);
  float fr = abs(dy) > 0.02 ? abs(y1 - y0)/max(abs(dy), 0.02) : step(cam.y, uMist.x);
  float od = uMist.y*dist*min(fr, 1.0);
  vec2 hd = dv.xz/max(length(dv.xz), 1e-4);
  float az = clamp(0.5 + 0.5*dot(hd, uGlow.xz), 0.0, 1.0);
  vec3 mc = uMistCol*mix(vec3(0.78, 0.86, 1.0), vec3(1.42, 1.0, 0.84), az*az);
  col = mix(col, mc, 1.0 - exp(-clamp(od, 0.0, 40.0)));
  float f = 1.0 - exp(-min(uFogDen*uFogDen*dist*dist, 40.0));
  return mix(col, uFogCol, f);
}
// THE WEED. n: normal, v: unit vector from the point to the eye, thin: 0 a thick fleshy core .. 1 a frond's edge,
// sick: 0 carmine .. 1 bleached, ao: 1 open .. 0 buried. It is painted between three colours as they will be seen:
// shade (wine, never black), lit (a deep matt carmine) and, where the afterglow stands behind a thin frond, the
// light that comes through it; nothing can come out brighter or purer than that third colour, so nothing is neon.
vec3 rwWeed(vec3 n, vec3 v, float thin, float sick, float ao){
  float ndl = dot(n, uKeyDir);
  float keyL = clamp((ndl + 0.25)/1.25, 0.0, 1.0), skyL = 0.5 + 0.5*n.y;
  float lit = clamp((0.95*keyL*keyL + 0.42*skyL)*ao, 0.0, 1.0);
  vec3 col = mix(mix(uWeedD, uWeedSD, sick), mix(uWeedA, uWeedS, sick), lit);
  col *= mix(vec3(1.0), vec3(1.1, 1.0, 0.9), keyL*keyL*0.6);                     // the side toward the glow is a little warmer
  float toward = clamp(dot(-v, uKeyDir), 0.0, 1.0);                             // 1: the eye looks into the afterglow through the frond
  float thr = thin*(0.08 + 0.92*toward*toward)*clamp(0.85 - ndl, 0.0, 1.0)*(0.35 + 0.65*ao);
  return mix(col, mix(uWeedG, uWeedSG, sick), clamp(thr, 0.0, 1.0));
}
`;

// uniforms of a material = the shared set (by reference) + its own
export const withShared = (U, own = {}) => ({ ...U, ...own });

// ---------------------------------------------------------------- a small mesh accumulator
// position, normal, colour (rgb) and one free vec4 per vertex (each builder says what it means)
export class Acc {
  constructor() { this.p = []; this.n = []; this.c = []; this.e = []; this.i = []; this.count = 0; this.col = [1, 1, 1]; this.ex = [0, 0, 0, 0]; this.m = null; }
  color(r, g, b) { if (r.isColor) this.col = [r.r, r.g, r.b]; else this.col = [r, g, b]; return this; }
  extra(a = 0, b = 0, c = 0, d = 0) { this.ex = [a, b, c, d]; return this; }
  xf(m) { this.m = m; return this; }                              // a Matrix4 applied to what follows (null = none)
  v(x, y, z, nx, ny, nz, e) {
    if (this.m) {
      const a = this.m.elements, X = a[0] * x + a[4] * y + a[8] * z + a[12], Y = a[1] * x + a[5] * y + a[9] * z + a[13], Z = a[2] * x + a[6] * y + a[10] * z + a[14];
      const NX = a[0] * nx + a[4] * ny + a[8] * nz, NY = a[1] * nx + a[5] * ny + a[9] * nz, NZ = a[2] * nx + a[6] * ny + a[10] * nz, l = Math.hypot(NX, NY, NZ) || 1;
      x = X; y = Y; z = Z; nx = NX / l; ny = NY / l; nz = NZ / l;
    }
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.c.push(this.col[0], this.col[1], this.col[2]);
    const ex = e || this.ex; this.e.push(ex[0], ex[1], ex[2], ex[3]);
    return this.count++;
  }
  tri(a, b, c) { this.i.push(a, b, c); }
  quadI(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // a flat quad from four corners (counter-clockwise seen from the normal's side)
  quad(a, b, c, d) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.v(a[0], a[1], a[2], nx, ny, nz), i1 = this.v(b[0], b[1], b[2], nx, ny, nz), i2 = this.v(c[0], c[1], c[2], nx, ny, nz), i3 = this.v(d[0], d[1], d[2], nx, ny, nz);
    this.quadI(i0, i1, i2, i3);
  }
  // an axis-aligned box: centre, half sizes; faces: which of the six to make (default all)
  box(cx, cy, cz, hx, hy, hz, skip = '') {
    const x0 = cx - hx, x1 = cx + hx, y0 = cy - hy, y1 = cy + hy, z0 = cz - hz, z1 = cz + hz;
    if (!skip.includes('+z')) this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    if (!skip.includes('-z')) this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0]);
    if (!skip.includes('+x')) this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]);
    if (!skip.includes('-x')) this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    if (!skip.includes('+y')) this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0]);
    if (!skip.includes('-y')) this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
  }
  // a tube from a to b with radii ra, rb; caps: 0 none, 1 both. exf(angleIndex, end, nx, ny, nz) may return the vec4
  tube(a, b, ra, rb, sides = 8, caps = 0, exf = null) {
    const ax = b[0] - a[0], ay = b[1] - a[1], az = b[2] - a[2], L = Math.hypot(ax, ay, az) || 1, tx = ax / L, ty = ay / L, tz = az / L;
    let ux = 0, uy = 1, uz = 0; if (Math.abs(ty) > 0.9) { ux = 1; uy = 0; }
    let sx = ty * uz - tz * uy, sy = tz * ux - tx * uz, sz = tx * uy - ty * ux; const sl = Math.hypot(sx, sy, sz) || 1; sx /= sl; sy /= sl; sz /= sl;
    const wx = ty * sz - tz * sy, wy = tz * sx - tx * sz, wz = tx * sy - ty * sx;
    const sl2 = (ra - rb) / L, base = this.count;
    for (let k = 0; k <= sides; k++) {
      const an = (k / sides) * Math.PI * 2, c = Math.cos(an), s = Math.sin(an);
      let nx = c * sx + s * wx + tx * sl2, ny = c * sy + s * wy + ty * sl2, nz = c * sz + s * wz + tz * sl2; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      const rx = c * sx + s * wx, ry = c * sy + s * wy, rz = c * sz + s * wz;
      this.v(a[0] + rx * ra, a[1] + ry * ra, a[2] + rz * ra, nx, ny, nz, exf ? exf(k, 0, rx * ra, ry * ra, rz * ra) : null);
      this.v(b[0] + rx * rb, b[1] + ry * rb, b[2] + rz * rb, nx, ny, nz, exf ? exf(k, 1, rx * rb, ry * rb, rz * rb) : null);
    }
    for (let k = 0; k < sides; k++) { const q = base + k * 2; this.i.push(q, q + 3, q + 1, q, q + 2, q + 3); }
    if (caps) {
      for (const end of [0, 1]) {
        const p = end ? b : a, r = end ? rb : ra, sg = end ? 1 : -1, c0 = this.v(p[0], p[1], p[2], tx * sg, ty * sg, tz * sg, exf ? exf(0, end, 0, 0, 0) : null), b0 = this.count;
        for (let k = 0; k <= sides; k++) { const an = (k / sides) * Math.PI * 2, c = Math.cos(an), s = Math.sin(an); const rx = c * sx + s * wx, ry = c * sy + s * wy, rz = c * sz + s * wz; this.v(p[0] + rx * r, p[1] + ry * r, p[2] + rz * r, tx * sg, ty * sg, tz * sg, exf ? exf(k, end, rx * r, ry * r, rz * r) : null); }
        for (let k = 0; k < sides; k++) { if (end) this.i.push(c0, b0 + k, b0 + k + 1); else this.i.push(c0, b0 + k + 1, b0 + k); }
      }
    }
  }
  // a sphere (or an ellipsoid: r may be [rx, ry, rz])
  ball(cx, cy, cz, r, seg = 10, rings = 7) {
    const R = Array.isArray(r) ? r : [r, r, r], base = this.count;
    for (let j = 0; j <= rings; j++) {
      const ph = (j / rings) * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph);
      for (let k = 0; k <= seg; k++) { const th = (k / seg) * Math.PI * 2, nx = sp * Math.cos(th), ny = cp, nz = sp * Math.sin(th); this.v(cx + nx * R[0], cy + ny * R[1], cz + nz * R[2], nx, ny, nz); }
    }
    for (let j = 0; j < rings; j++) for (let k = 0; k < seg; k++) { const a = base + j * (seg + 1) + k, b = a + seg + 1; this.i.push(a, a + 1, b + 1, a, b + 1, b); }
  }
  // a surface of revolution about the Y axis through (cx, cz): profile [[r, y], ...] from bottom to top
  lathe(cx, cz, prof, seg = 20, exf = null) {
    const base = this.count, n = prof.length;
    for (let j = 0; j < n; j++) {
      const a = prof[Math.max(0, j - 1)], b = prof[Math.min(n - 1, j + 1)]; let dr = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dr, dy) || 1; dr /= l; dy /= l;
      for (let k = 0; k <= seg; k++) { const th = (k / seg) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th); this.v(cx + c * prof[j][0], prof[j][1], cz + s * prof[j][0], c * dy, -dr, s * dy, exf ? exf(k / seg, j, prof[j]) : null); }
    }
    for (let j = 0; j < n - 1; j++) for (let k = 0; k < seg; k++) { const a = base + j * (seg + 1) + k, b = a + seg + 1; this.i.push(a, b, b + 1, a, b + 1, a + 1); }
  }
  geometry(extraName = 'aE', withColor = true) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    if (withColor) g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    if (extraName) g.setAttribute(extraName, new THREE.Float32BufferAttribute(this.e, 4));
    g.setIndex(this.count > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    g.computeBoundingSphere();
    return g;
  }
  get triangles() { return this.i.length / 3; }
}
