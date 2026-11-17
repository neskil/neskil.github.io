// Seabed Street: the sea as a solid with a section.
// The sea is level at y 0 on every side and stands sheer on the planes z -20 and z +20 from the beach
// (x 0) to the island (x 1000). Between the planes is dry air down to the seabed. ONE GLSL chunk holds
// the whole sea (where water is, the swell, the length of water looked through, the colour of a thing
// in water, the light net on the dry street) and every material of the world includes it.
import * as THREE from 'three';

export const HALF = 20;          // half width of the slot (m): the faces are the planes z = -HALF and z = +HALF
export const SLOT_END = 1000;    // the island's rock

// ---- the seabed: depth D(x) under the level sea, a smooth curve through the surveyed depths ----
const BED_X = [0, 100, 200, 400, 600, 800, 1000];
const BED_D = [0, 8, 12, 18, 22, 22, 14];
const BED_M = BED_X.map((x, i) => {
  if (i === 0) return (BED_D[1] - BED_D[0]) / (BED_X[1] - BED_X[0]);
  if (i === BED_X.length - 1) return (BED_D[i] - BED_D[i - 1]) / (BED_X[i] - BED_X[i - 1]);
  const a = (BED_D[i] - BED_D[i - 1]) / (BED_X[i] - BED_X[i - 1]), b = (BED_D[i + 1] - BED_D[i]) / (BED_X[i + 1] - BED_X[i]);
  return a * b <= 0 ? 0 : (a + b) / 2;
});
export function bedD(x) {
  if (x <= 0) return 0;
  if (x >= 1000) return 14;
  let i = 0; while (x > BED_X[i + 1]) i++;
  const h = BED_X[i + 1] - BED_X[i], s = (x - BED_X[i]) / h, s2 = s * s, s3 = s2 * s;
  return (2 * s3 - 3 * s2 + 1) * BED_D[i] + (s3 - 2 * s2 + s) * h * BED_M[i] + (-2 * s3 + 3 * s2) * BED_D[i + 1] + (s3 - s2) * h * BED_M[i + 1];
}

// ---- the dealt sea states: three waves each (amplitude, length), absorption per metre, glow colours ----
export const SEA_STATES = {
  calm:   { A: [0.12, 0.06, 0.03], L: [38, 17, 7], K: [0.17, 0.05, 0.035], g: ['#C6F4EA', '#34BFB6', '#0B5A7A'], horses: 0.0, lip: 1.6 },
  breeze: { A: [0.28, 0.16, 0.08], L: [26, 11, 5], K: [0.19, 0.06, 0.07], g: ['#BFF2DC', '#2FB79A', '#0B5A6A'], horses: 1.0, lip: 1.0 },
  swell:  { A: [0.50, 0.14, 0.05], L: [64, 21, 8], K: [0.20, 0.08, 0.04], g: ['#B4E6F2', '#2A9CC0', '#083F78'], horses: 0.35, lip: 0.8 },
};
const WAVE_TH = [35, 50, 20].map((d) => d * Math.PI / 180);   // each wave's bearing, degrees north of east (north is -z)

export const SEA_GLSL = /* glsl */`
uniform float uT;          // the world's clock (s)
uniform vec3 uSun;         // unit vector toward the sun
uniform vec3 uSunC, uFill, uBounce, uHaze;
uniform vec3 uK;           // absorption of the water per metre
uniform vec3 uG0, uG1, uG2; // the water's own glow at the surface, at 6 m and at 22 m
uniform vec4 uWv[3];       // each wave: xy = k * direction, z = omega, w = amplitude
uniform float uSS;         // the three amplitudes summed
uniform float uHorses;     // white horses on top: 0 calm .. 1 breeze
uniform float uLip;        // how much higher the swell stands where it meets the cut (a wave against a sheer edge heaps up)
const float HALF = 20.;
const float HEEL = 0.10;   // the greatest slope a floating thing takes from the swell (rise over run)
// small tools: a hash and a smooth noise of place (no texture), used for the grain of sand, stone, rock and weed
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm2(vec2 p){ return 0.5 * vnoise(p) + 0.25 * vnoise(p * 2.03 + 7.1) + 0.125 * vnoise(p * 4.1 + 3.3) + 0.0625 * vnoise(p * 8.3 + 1.7); }
// the seabed's depth under the level sea, by straight reaches between the surveyed depths (for small things and far shapes)
float bedLin(float x){ return x < 100. ? max(x, 0.) * 0.08 : x < 200. ? 8. + (x - 100.) * 0.04 : x < 400. ? 12. + (x - 200.) * 0.03 : x < 600. ? 18. + (x - 400.) * 0.02 : x < 800. ? 22. : 22. - (min(x, 1000.) - 800.) * 0.04; }
// the heaping of the swell toward a lip: 1 far out at sea, 1 + uLip on the face's own plane
float lipGain(vec2 q){ return 1. + uLip * exp(-max(abs(q.y) - HALF, 0.) / 7.); }
// the foam that lies along a lip (s = -1 the north lip, +1 the south): 0 where its line is broken, 1 where it stands thick; it creeps along the lip
float lipFoam(float x, float s){
  float a = vnoise(vec2(x * 0.42 + uT * 0.21, s * 3.7 + uT * 0.06));
  float b = vnoise(vec2(x * 1.9 - uT * 0.55, s * 9.1 + 4.));
  return smoothstep(0.36, 0.7, 0.62 * a + 0.38 * b);
}
// where along a lip the swell is slopping over at this moment: in bursts some metres long, never the whole lip at once
float slopGust(float x, float s){
  return smoothstep(0.48, 0.7, vnoise(vec2(x * 0.31 + s * 17., uT * 0.45 + s * 5.)));
}

// (2) THE SWELL: one function of place and time
float eta(vec2 q){
  float e = 0.;
  for (int i = 0; i < 3; i++) e += uWv[i].w * sin(dot(uWv[i].xy, q) - uWv[i].z * uT);
  return e * lipGain(q);
}
vec2 etaSlope(vec2 q){
  vec2 g = vec2(0.);
  for (int i = 0; i < 3; i++) g += uWv[i].xy * (uWv[i].w * cos(dot(uWv[i].xy, q) - uWv[i].z * uT));
  return g * lipGain(q);
}
// the swell's own curvature, -1..1 (crests bright: they gather the light)
float etaCurve(vec2 q){
  float c = 0., n = 1e-4;
  for (int i = 0; i < 3; i++) { float kk = dot(uWv[i].xy, uWv[i].xy) * uWv[i].w; c += kk * sin(dot(uWv[i].xy, q) - uWv[i].z * uT); n += kk; }
  return c / n;
}
// (1) WHERE WATER IS: outside the two planes and under the swell (the bed and the rock are solid things)
float inWater(vec3 p){
  return step(HALF, abs(p.z)) * step(p.y, eta(p.xz));
}
// (3) LENGTH OF WATER LOOKED THROUGH from the eye E to a point P in water
float waterLen(vec3 P, vec3 E){
  float s = P.z < 0. ? -1. : 1.;
  float fFace = s * E.z < HALF ? (abs(P.z) - HALF) / max(abs(P.z) - s * E.z, 0.01) : 1.;
  float fTop = E.y > 0. ? -P.y / max(E.y - P.y, 0.01) : 1.;
  return length(P - E) * clamp(min(fFace, fTop), 0., 1.);
}
// the water's own colour at depth d; the south water is lit from behind and carries leaning shafts (k: how much of the shafts
// shows, 1 whole, 0 their mean: far off through the water they run together into one glow, and the level's underside carries none)
vec3 seaGlowK(float d, vec3 P, float k){
  vec3 g = d < 6. ? mix(mix(uG0, uG1, 0.5), uG1, clamp(d / 6., 0., 1.)) : mix(uG1, uG2, clamp((d - 6.) / 16., 0., 1.));
  float south = step(0., P.z);
  if (k <= 0.) return g * 0.66 * mix(1., 1.26, south);               // (their mean alone)
  float sx = P.x + P.y * 0.40;                                       // along a shaft: they lean 68 degrees
  sx += 7. * (vnoise(vec2(sx * 0.045, 2.)) - 0.5);                   // unevenly spaced: no two gaps alike
  float sh = 0.9 + 0.13 * sin(sx * 0.35 + P.z * 0.21 + uT * 0.21) + 0.09 * sin(sx * 1.3 - P.z * 0.6 - uT * 0.33) + 0.07 * sin(sx * 2.9 + P.z * 1.1 + uT * 0.5) * sin(sx * 0.21 - uT * 0.13);
  sh *= 1. + 0.22 * exp(-d * 0.12) * (vnoise(vec2(sx * 0.9 + uT * 0.25, P.z * 0.4)) - 0.5);          // finer and livelier near the top, where the light comes in
  return g * 0.66 * mix(1., mix(1.26, 1.4 * sh, k), south);
}
vec3 seaGlow(float d, vec3 P){ return seaGlowK(d, P, 1.); }
// how much of the shafts is left after W metres of water looked through
float shaftK(float W){ return exp(-W / 90.); }
// the deep water far behind a face, where sight ends: its own colour at depth, lighter and darker reaches of it drifting west on the stream
// (the reaches gather with depth: under the level itself the deep water is one colour)
vec3 deepSeaK(vec3 P, float k){
  float reachW = fbm2(vec2((P.x + 1.2 * uT) * 0.035, P.y * 0.09 + 3.));
  return seaGlowK(max(-P.y, 0.) + 9., P, k) * 0.9 * mix(1., 0.8 + 0.42 * reachW, smoothstep(0.5, 9., -P.y));
}
// (8) THE LIGHT NET at the place q of the surface where a ray of sun came in: bright running lines
float seaNet(vec2 q){
  float c = etaCurve(q);
  vec2 w = q + 0.9 * vec2(sin(q.y * 0.83 + uT * 0.7), sin(q.x * 0.71 - uT * 0.6)) + c * 0.8;
  float a = 1. - abs(sin(w.x * 1.07 + w.y * 0.61 + uT * 0.9));
  float b = 1. - abs(sin(w.x * -0.66 + w.y * 1.21 - uT * 0.75));
  float e = 1. - abs(sin(w.x * 0.37 - w.y * 0.45 + uT * 0.4));
  float l = a * a * a + b * b * b + 0.6 * e * e * e;
  return clamp(l * (0.75 + 0.6 * c), 0., 2.2);
}
// the sun on a dry point of the slot: plain, or come down through the southern water as the net
vec3 slotSun(vec3 P){
  float run = (HALF - P.z) / max(uSun.z, 0.05);          // along the ray toward the sun to the plane z +20
  vec3 H = P + uSun * run;
  float under = step(P.y, 2.) * step(abs(P.z), HALF) * (1. - smoothstep(-0.35, 0.15, H.y - eta(H.xz)));
  float wl = clamp(-H.y, 0., 40.) / max(uSun.y, 0.2);    // the length of water the ray crossed
  vec2 q = H.xz + uSun.xz * wl;
  vec3 through = exp(-uK * wl * 0.6) * (0.45 + 0.8 * seaNet(q));
  return mix(vec3(1.), through, under);
}
// (4) COLOUR OF A THING: dry in the air, or in water by the length of water looked through
vec3 seaShade(vec3 alb, vec3 P, vec3 N, vec3 E){
  float ndl = dot(N, uSun);
  float up = 0.5 + 0.5 * N.y;
  vec3 amb = uFill * (0.6 + 0.4 * N.y) + uBounce * (1. - up);
  vec3 dry = alb * (uSunC * max(ndl, 0.) * slotSun(P) + amb);
  float d = max(-P.y, 0.);
  vec2 q = P.xz + uSun.xz * (d / max(uSun.y, 0.2));
  // the sky's light, too, is taken by the water on its way down: what stands deep stands in a dimmer, bluer light
  vec3 lit = alb * (uSunC * (0.3 + 0.7 * max(ndl, 0.)) * exp(-d * uK / 0.93) * (0.88 + 0.26 * seaNet(q)) + amb * 0.9 * exp(-d * uK * 1.5));
  float W = waterLen(P, E);
  // the north water is lit from the front and keeps a thing's colours deep into it; the south water, lit from behind, takes them sooner
  vec3 T = exp(-W * mix(uK, vec3(uK.g), 0.5) * mix(0.42, 1., step(0., P.z)));
  // a long sight through water gathers the deeper colour: the glow is read some way below the thing's own depth
  vec3 wet = lit * T + seaGlowK(d + 0.3 * W, P, shaftK(W)) * (1. - T);
  wet = mix(wet, deepSeaK(P, shaftK(W)), smoothstep(HALF + 15., HALF + 29., abs(P.z)));          // far behind a face sight ends in the deep water's own colour
  vec3 col = mix(dry, wet, inWater(P));
  float air = length(P - E);
  return mix(col, uHaze, 1. - exp(-air * 0.00058));
}
`;

// ---- colours as linear triples ----
const _c = new THREE.Color();
export function C(hex, k = 1) { _c.set(hex); return [_c.r * k, _c.g * k, _c.b * k]; }
// a chain's link, in shares of the chain's `thick` (see Geo.chain), and the rust some links wear
// (far: the distance from the flown line, in metres, past which a chain is FAR and built lighter; pixel: the angle one pixel
// covers at the middle of the largest picture the site draws, 8.4 million pixels, 2,174 high at 16 to 9 with the field at 62
// degrees (toward its edge a pixel covers less, 0.40 of it at a corner); dot: the share of such a pixel that a face's longer
// side times its cosine over its distance must pass from some place of the line for it to be built: see Geo.chain)
export const CHAIN = { long: 1.8, wide: 0.85, bar: 0.42, deep: 0.2, step: 2.3, rust: C('#7A4326', 1.0), far: 30, pixel: 0.000553, dot: 0.25 };

// ---- a small builder of merged meshes: place, normal, colour and a law of motion for every corner ----
// The law of motion (aMove): x, z = a pivot in the mesh's own space; kind 0 at rest, 1 rides the swell at its pivot,
// 2 sways like weed (w = height above the root), 3 flaps like cloth (w = how free), 4 treads (w = how far down the leg),
// 5 an oar, 6 a kite on its string (w = share of the string's height, then metres down the tail past 1), 7 a swimmer going round
// a fixed place (w = seconds a round, signed), 8 a ball tossed to and fro along x (w = half the throw), 9 a far sail making way
// round a long closed loop about its pivot (w = half the loop's length east and west in metres, signed for the way round),
// 10 the great jellyfish (w = minus the metres a corner hangs below the bell's rim; the kind's fraction is its own phase of the ripple),
// 12 a seal hauled out on dry rock (w = how far toward its nose a corner lies from its shoulders, 0 to 1; under 0 = how far out along a fore flipper that waves).
export class Geo {
  constructor() { this.p = []; this.n = []; this.c = []; this.m = []; this.M = new THREE.Matrix4(); this.mv = [0, 0, 0, 0]; this.wfn = null; this._v = new THREE.Vector3(); this._nm = new THREE.Matrix3(); this.line = null; }
  at(x = 0, y = 0, z = 0, ry = 0, rz = 0, rx = 0) { this.M.makeRotationFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')).setPosition(x, y, z); this._nm.getNormalMatrix(this.M); return this; }
  move(ax = 0, az = 0, kind = 0, w = 0, wfn = null) { this.mv = [ax, az, kind, w]; this.wfn = wfn; return this; }
  _vert(x, y, z, nx, ny, nz, col) {
    const v = this._v.set(x, y, z);
    const w = this.wfn ? this.wfn(x, y, z) : this.mv[3];
    v.applyMatrix4(this.M); this.p.push(v.x, v.y, v.z);
    v.set(nx, ny, nz).applyMatrix3(this._nm).normalize(); this.n.push(v.x, v.y, v.z);
    this.c.push(col[0], col[1], col[2]); this.m.push(this.mv[0], this.mv[1], this.mv[2], w);
  }
  tri(a, b, c, col, na, nb, nc) {
    if (!na) {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
      na = nb = nc = [nx / l, ny / l, nz / l];
    }
    this._vert(a[0], a[1], a[2], na[0], na[1], na[2], col); this._vert(b[0], b[1], b[2], nb[0], nb[1], nb[2], col); this._vert(c[0], c[1], c[2], nc[0], nc[1], nc[2], col);
  }
  quad(a, b, c, d, col) { this.tri(a, b, c, col); this.tri(a, c, d, col); }
  // a box by its centre and sizes
  box(cx, cy, cz, sx, sy, sz, col, top = null) {
    const x0 = cx - sx / 2, x1 = cx + sx / 2, y0 = cy - sy / 2, y1 = cy + sy / 2, z0 = cz - sz / 2, z1 = cz + sz / 2;
    this.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], col);
    this.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], col);
    this.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], col);
    this.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], col);
    this.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], top || col);
    this.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], col);
    return this;
  }
  // a skin over a grid of points (rows of equal length), smooth; wrap closes each row on itself
  skin(rows, col, wrap = false, flip = false) {
    const R = rows.length, N = rows[0].length, nor = [];
    for (let i = 0; i < R; i++) {
      nor.push([]);
      for (let j = 0; j < N; j++) {
        const a = rows[Math.max(i - 1, 0)][j], b = rows[Math.min(i + 1, R - 1)][j];
        const c = rows[i][wrap ? (j + N - 1) % N : Math.max(j - 1, 0)], d = rows[i][wrap ? (j + 1) % N : Math.min(j + 1, N - 1)];
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
        let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = (Math.hypot(nx, ny, nz) || 1) * (flip ? -1 : 1);
        nor[i].push([nx / l, ny / l, nz / l]);
      }
    }
    const M = wrap ? N : N - 1;
    for (let i = 0; i < R - 1; i++) for (let j = 0; j < M; j++) {
      const j1 = (j + 1) % N, cc = typeof col === 'function' ? col(i, j) : col;
      const a = rows[i][j], b = rows[i + 1][j], c = rows[i + 1][j1], d = rows[i][j1];
      if (flip) { this.tri(a, c, b, cc, nor[i][j], nor[i + 1][j1], nor[i + 1][j]); this.tri(a, d, c, cc, nor[i][j], nor[i][j1], nor[i + 1][j1]); }
      else { this.tri(a, b, c, cc, nor[i][j], nor[i + 1][j], nor[i + 1][j1]); this.tri(a, c, d, cc, nor[i][j], nor[i + 1][j1], nor[i][j1]); }
    }
    return this;
  }
  // a round bar from a to b, radius ra to rb
  bar(a, b, ra, rb, col, sides = 6) {
    const ax = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
    const u = new THREE.Vector3(0, 1, 0); if (Math.abs(ax.y) > 0.9) u.set(1, 0, 0);
    const s = new THREE.Vector3().crossVectors(ax, u).normalize(), t = new THREE.Vector3().crossVectors(s, ax);
    const ring = (p, r) => { const o = []; for (let j = 0; j < sides; j++) { const an = j / sides * 6.2832, cs = Math.cos(an) * r, sn = Math.sin(an) * r; o.push([p[0] + s.x * cs + t.x * sn, p[1] + s.y * cs + t.y * sn, p[2] + s.z * cs + t.z * sn]); } return o; };
    return this.skin([ring(a, ra), ring(b, rb)], col, true, false);
  }
  // a turned shape about the y axis: profile = [[radius, y], ...] from the bottom up
  turn(cx, cy, cz, profile, col, sides = 10, sx = 1, sz = 1) {
    const rows = profile.map(([r, y]) => { const o = []; for (let j = 0; j < sides; j++) { const an = j / sides * 6.2832; o.push([cx + Math.cos(an) * r * sx, cy + y, cz + Math.sin(an) * r * sz]); } return o; });
    return this.skin(rows, col, true, false);
  }
  ball(cx, cy, cz, rx, ry, rz, col, sides = 8, rings = 5) {
    const prof = []; for (let i = 0; i <= rings; i++) { const a = -1.5708 + 3.1416 * i / rings; prof.push([Math.max(Math.cos(a), 0.02), Math.sin(a) * ry]); }
    return this.turn(cx, cy, cz, prof, col, sides, rx, rz);
  }
  // a chain from a to b, hanging by a sag: true links, each a flat six-sided ring of bar, by turns at a right angle to the
  // last and threaded through it (CHAIN, in shares of `thick`: a link's half length and half width, its bar's width at
  // the sides, half its bar's depth, and the step from link to link). The links stand at even steps ALONG THE HANGING
  // CURVE'S OWN LENGTH, so they reach into each other at its steep end as at its flat one; the first and the last reach
  // past the chain's two ends. Each link takes its own shade of the iron and, about two links in five, some rust: by
  // its number along the chain, nothing is dealt.
  // A FAR CHAIN IS BUILT LIGHTER, to keep the world's count of triangles. Where the builder has been given the flown line (line:
  // the route's places, x y z by turns, about 2 m apart) and no point of this chain's hanging curve, walked in 96 pieces, lies
  // nearer to any of those places than CHAIN.far and a link's half length (30.45 m; at 30 m the bar of a link, 10.5 cm, is one
  // pixel broad in a still 360 high and six in the largest picture the site draws), a face of a link is built only if some
  // place of the route can see it: if from there the face, turned as it is to that sight, is more than CHAIN.dot (a quarter) of
  // a pixel across its thin way, reckoned by its longer side and by the pixel at the middle of the largest picture (at 30 m
  // that pixel covers 1.66 cm). A face that is turned away from every place of the route, or that every place sees so nearly
  // edge on or from so far that it stays under that, is not built: mostly the flats and the rims that look away from the
  // street. The link's other faces stand as they did, so from no place of the flight does its outer outline move by more than
  // a little over a quarter of that pixel (0.26). What changes besides is seen only through a link's own hole: the inner sides
  // of the flat and of the rims that look away showed there as a band no broader than the bar, at a slant up to about a fifth
  // of what the link covers, and the water behind shows now. It is settled once, at the build, by where the chain and the
  // route lie: never by where the lens looks, a seed, the flight's progress or the clock. A chain nearer than that is built as
  // it always was, to the triangle.
  chain(a, b, col, thick = 0.25, sag = 0) {
    const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    const at0 = (f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f - sag * 4 * f * (1 - f), a[2] + (b[2] - a[2]) * f];
    // the curve's length, walked in 96 pieces; pt(f) is the point at the share f of that length
    const K = 96, run = [0]; for (let k = 1, p0 = at0(0); k <= K; k++) { const p1 = at0(k / K); run.push(run[k - 1] + Math.hypot(p1[0] - p0[0], p1[1] - p0[1], p1[2] - p0[2])); p0 = p1; }
    const n = Math.max(2, Math.ceil(run[K] / (thick * CHAIN.step)));          // (never a longer step than CHAIN.step: at that step each link's end lies clear inside the next one's hole)
    const pt = (f) => { const want = f * run[K]; let k = 1; while (k < K && run[k] < want) k++; return at0((k - 1 + (want - run[k - 1]) / Math.max(run[k] - run[k - 1], 1e-9)) / K); };
    const hl = thick * CHAIN.long, hw = thick * CHAIN.wide, bar = thick * CHAIN.bar, hd = thick * CHAIN.deep;
    const hex = (l, w) => [[-l, 0], [-l * 0.5, w], [l * 0.5, w], [l, 0], [l * 0.5, -w], [-l * 0.5, -w]];
    const outer = hex(hl, hw), inner = hex(hl - bar * 1.25, hw - bar);
    const L = this.line, own = (q) => { const v = this._v.set(q[0], q[1], q[2]).applyMatrix4(this.M); return [v.x, v.y, v.z]; };
    let far = !!L;
    for (let k = 0, lim = (CHAIN.far + hl) * (CHAIN.far + hl); far && k <= K; k++) { const q = own(at0(k / K)); for (let s = 0; s < L.length; s += 3) { const x = L[s] - q[0], y = L[s + 1] - q[1], z = L[s + 2] - q[2]; if (x * x + y * y + z * z <= lim) { far = false; break; } } }
    // (does any place of the route see the face through A that looks along n more than CHAIN.dot of a pixel across its thin way?
    // a face of longer side ls and shorter side ss whose normal makes the cosine c with the sight from r off is ls * c / r
    // across its thin way when it is seen along its length, ss * c / r when across it, and no more than 1.06 times ls * c / r
    // at any slant between (the root of 1 + (ss / ls)^2); c is (the place's height over the face's plane) / r)
    const seen = (A, nx, ny, nz, ls) => {
      const q = own(A), m = this._v.set(nx, ny, nz).applyMatrix3(this._nm).normalize(), lim = CHAIN.dot * CHAIN.pixel / ls;
      for (let s = 0; s < L.length; s += 3) { const x = L[s] - q[0], y = L[s + 1] - q[1], z = L[s + 2] - q[2]; if (x * m.x + y * m.y + z * m.z > lim * (x * x + y * y + z * z)) return true; }
      return false;
    };
    const T = new THREE.Vector3(), U = new THREE.Vector3(), V = new THREE.Vector3(), up = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const p = pt(i / n), q = pt((i + 1) / n), mid = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2];
      T.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]).normalize();
      up.set(0, 1, 0); if (Math.abs(T.y) > 0.9) up.set(1, 0, 0);
      U.crossVectors(T, up).normalize(); V.crossVectors(T, U);
      const W = i % 2 ? U : V, N = i % 2 ? V : U;                  // the link's own plane holds T and W; N is across it
      const at = ([l, w], d) => [mid[0] + T.x * l + W.x * w + N.x * d, mid[1] + T.y * l + W.y * w + N.y * d, mid[2] + T.z * l + W.z * w + N.z * d];
      const h = Math.abs(Math.sin(i * 12.9898 + len * 3.7) * 43758.5453) % 1, rust = h > 0.62 ? (h - 0.62) * 1.6 : 0, k = 0.95 + 0.5 * ((h * 7.3) % 1);
      const c = [(col[0] * (1 - rust) + CHAIN.rust[0] * rust) * k, (col[1] * (1 - rust) + CHAIN.rust[1] * rust) * k, (col[2] * (1 - rust) + CHAIN.rust[2] * rust) * k];
      // a face whichever way its corners run: it is turned to look out along `out`
      const face = (A, B, Cc, D, out) => {
        const nx = (B[1] - A[1]) * (Cc[2] - A[2]) - (B[2] - A[2]) * (Cc[1] - A[1]), ny = (B[2] - A[2]) * (Cc[0] - A[0]) - (B[0] - A[0]) * (Cc[2] - A[2]), nz = (B[0] - A[0]) * (Cc[1] - A[1]) - (B[1] - A[1]) * (Cc[0] - A[0]);
        const sg = nx * out[0] + ny * out[1] + nz * out[2] >= 0 ? 1 : -1;
        if (far && !seen(A, nx * sg, ny * sg, nz * sg, Math.max(Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), Math.hypot(D[0] - A[0], D[1] - A[1], D[2] - A[2])))) return;
        if (sg > 0) this.quad(A, B, Cc, D, c); else this.quad(D, Cc, B, A, c);
      };
      for (let j = 0; j < 6; j++) {
        const j1 = (j + 1) % 6, o0 = outer[j], o1 = outer[j1], i0 = inner[j], i1 = inner[j1];
        face(at(o0, hd), at(o1, hd), at(i1, hd), at(i0, hd), [N.x, N.y, N.z]);                       // the one flat
        face(at(o0, -hd), at(o1, -hd), at(i1, -hd), at(i0, -hd), [-N.x, -N.y, -N.z]);                // the other
        const ml = (o0[0] + o1[0]) / 2, mw = (o0[1] + o1[1]) / 2, out = [T.x * ml + W.x * mw, T.y * ml + W.y * mw, T.z * ml + W.z * mw];
        face(at(o0, hd), at(o1, hd), at(o1, -hd), at(o0, -hd), out);                                 // the rim
      }
    }
    return this;
  }
  // a rope from a to b, bellying toward -x with the stream so it never reads as a pole
  rope(a, b, col, r = 0.05, belly = 1.2, n = 7) {
    const pt = (f) => [a[0] + (b[0] - a[0]) * f - belly * 4 * f * (1 - f), a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
    for (let i = 0; i < n; i++) this.bar(pt(i / n), pt((i + 1) / n), r, r, col, 4);
    return this;
  }
  // the same, made a piece at a time for a large mesh, the page's turn handed back between the pieces
  async geometrySlow(ctx) {
    const g = new THREE.BufferGeometry();
    for (const [name, arr, size] of [['position', this.p, 3], ['normal', this.n, 3], ['color', this.c, 3], ['aMove', this.m, 4]]) { g.setAttribute(name, new THREE.BufferAttribute(new Float32Array(arr), size)); await ctx.yield(); }
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(500, 0, 0), 6000);
    return g;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.p), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.n), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(this.c), 3));
    g.setAttribute('aMove', new THREE.BufferAttribute(new Float32Array(this.m), 4));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(500, 0, 0), 6000);          // the whole world: nothing here is culled by its own bounds
    return g;
  }
}

// ---- THE LION'S MANE: one great jellyfish (the motion law's kind 10). bell: the bell's radius at rest; high: its height; mane: how
// far its hair hangs below its rim; beat: the seconds of one beat of the bell; rise: how far a beat lifts it; drift: it wanders
// about its station east and west by drift[0] m in drift[1] s, north and south by drift[2] m in drift[3] s. All by the world's clock ----
export const JELLY = { bell: 1.5, high: 1.25, mane: 11, beat: 5.2, rise: 0.35, drift: [1.5, 71, 0.3, 97] };
// the beat (0 to 1) at a share bt of one beat's time: the bell draws in quickly and opens slowly; and the lift it gives
const jellyBeat = (bt) => { const a = Math.min(1, Math.max(0, bt / 0.26)), b = Math.min(1, Math.max(0, (bt - 0.26) / 0.69)); return a * a * (3 - 2 * a) * (1 - b * b * (3 - 2 * b)); };
// where the bell is at a moment of the clock, from its station, and how far it is drawn in: [east, up, south, beat]
export function jellyAt(t) {
  const b0 = (((t / JELLY.beat) % 1) + 1) % 1, a = Math.min(1, Math.max(0, (b0 - 0.1) / 0.35)), b = Math.min(1, Math.max(0, (b0 - 0.45) / 0.55));
  return [JELLY.drift[0] * Math.sin(6.2832 * t / JELLY.drift[1] + 1.3), JELLY.rise * (a * a * (3 - 2 * a) * (1 - b * b * (3 - 2 * b)) - 0.4), JELLY.drift[2] * Math.sin(6.2832 * t / JELLY.drift[3]), jellyBeat(b0)];
}

// ---- the vertex law every solid thing shares: where a corner is at this moment of the clock ----
export const SOLID_VERT = /* glsl */`
attribute vec4 aMove;
varying vec3 vP, vN, vC, vQ;
vec3 moved(vec3 wp, inout vec3 wn, vec4 mv, mat4 mm){
  float kind = mv.z;
  vec3 piv = (mm * vec4(mv.x, 0., mv.y, 1.)).xyz;
  if (kind > 0.5 && kind < 1.5) {                       // rides the swell at its mooring, tilting with the slope
    vec2 g = etaSlope(piv.xz) * mv.w; vec3 r = wp - piv;
    g *= min(1., HEEL / max(length(g), 1e-4));          // a moored thing heels with the slope, never past HEEL (its keel and its mooring hold it)
    wp.y += eta(piv.xz) * mv.w + dot(g, r.xz); wp.xz -= g * r.y;
    wn = normalize(wn + vec3(-g.x * wn.y, dot(g, wn.xz), -g.y * wn.y));
  } else if (kind > 1.5 && kind < 2.5) {                // weed: leans west with the stream and sways
    float ph = piv.x * 0.37 + piv.z * 0.53, per = 5. + 4. * fract(ph * 0.61);
    float h = mv.w;
    wp.x -= h * (0.16 + 0.012 * h) + 0.07 * h * sin(uT * 6.2832 / per + ph + h * 0.25);
    wp.z += 0.035 * h * sin(uT * 6.2832 / (per * 1.3) + ph * 1.7 + h * 0.2);
    wp.y -= 0.01 * h * h;
  } else if (kind > 2.5 && kind < 3.5) {                // cloth in the breeze
    wp.y += mv.w * 0.11 * sin(uT * 5.2 + wp.x * 1.7 + wp.z * 1.3);
    wp.x += mv.w * 0.05 * sin(uT * 3.9 + wp.z * 2.1);
  } else if (kind > 3.5 && kind < 4.5) {                // a bather: bobs on the swell, legs treading
    wp.y += eta(piv.xz) * 0.8;
    float sw = sin(uT * 6.2832 / 1.1 + piv.x * 1.9);
    wp.x += mv.w * 0.5 * sw; wp.y += abs(mv.w) * 0.18 * (0.5 + 0.5 * sw * sign(mv.w));
  } else if (kind > 4.5 && kind < 5.5) {                // an oar: rides with its boat, the blade dipping and sweeping
    wp.y += eta(piv.xz) + mv.w * 0.55 * sin(uT * 2.1 + piv.x);
    wp.x += mv.w * 0.8 * cos(uT * 2.1 + piv.x);
  } else if (kind > 6.5 && kind < 7.5) {                // a swimmer going round and round a fixed place at the sea's top: w = the seconds of one round (its sign the way round)
    float a = 6.2832 * uT / mv.w + piv.x * 0.7 + piv.z * 0.4, c = cos(a), s = sin(a);
    vec3 r = wp - piv;
    wp.xz = piv.xz + vec2(c * r.x + s * r.z, c * r.z - s * r.x);
    wn = vec3(c * wn.x + s * wn.z, wn.y, c * wn.z - s * wn.x);
    wp.y += eta(wp.xz) * 0.9;
  } else if (kind > 8.5 && kind < 9.5) {                // a far sail making way round a long closed loop about its pivot: w = half the loop's length east and west (m; its sign the way round); the loop is 12 m wide north and south
    float A = abs(mv.w), ph = piv.x * 0.7 + piv.z * 0.4;
    float a = sign(mv.w) * 1.5 * (1.6 + fract(ph * 0.37)) / A * uT + ph;      // 2.4 to 3.9 m/s along the long sides, slow round the ends where she goes about
    vec2 c = piv.xz + vec2(A * cos(a), 6. * sin(a));
    vec2 f = normalize(vec2(-A * sin(a), 6. * cos(a))) * sign(mv.w);     // her head lies along her course
    vec3 r = wp - piv;
    wp.xz = c + f * r.x + vec2(-f.y, f.x) * r.z;
    wn = vec3(f.x * wn.x - f.y * wn.z, wn.y, f.y * wn.x + f.x * wn.z);
    wp.y += eta(c) * 0.9;
  } else if (kind > 11.5) {                             // a seal hauled out on dry rock: w = how far toward its nose a corner lies from its shoulders (the pivot), 0 to 1: for something under half of every 13 to 22 seconds it lifts its head and looks slowly round, each seal at its own moment; w under 0 = how far out along a fore flipper that waves
    float ph = piv.x * 0.7 + piv.z * 0.4, per = 13. + 9. * fract(ph * 0.61);
    float lift = smoothstep(0.25, 0.85, sin(uT * 6.2832 / per + ph * 3.));
    if (mv.w > 0.) {
      float k = mv.w, a = 0.45 * k * lift * sin(uT * 6.2832 / (per * 0.31) + ph), c = cos(a), s = sin(a);
      vec3 r = wp - piv;
      wp.xz = piv.xz + vec2(c * r.x + s * r.z, c * r.z - s * r.x);
      wn = vec3(c * wn.x + s * wn.z, wn.y, c * wn.z - s * wn.x);
      wp.y += 0.3 * k * k * lift;
    } else if (mv.w < 0.) {
      float burst = smoothstep(0.3, 0.8, sin(uT * 6.2832 / (per * 0.7) + ph * 5.));
      wp.y += -mv.w * burst * (0.22 + 0.14 * sin(uT * 4.4 + ph));
    }
  } else if (kind > 9.5) {                              // the great jellyfish (JELLY): its bell beats, drawing in at the rim; what hangs from it takes the beat a moment later and streams west, rippling; the whole of it rides its beat and wanders about its station. w = minus the metres a corner hangs below the bell's rim (0 on the bell)
    float h = max(-mv.w, 0.);
    vec2 rr = wp.xz - piv.xz; float s = min(length(rr) / ${JELLY.bell.toFixed(2)}, 1.);
    float bt = fract((uT - 0.22 * h) / ${JELLY.beat.toFixed(2)});
    float p = smoothstep(0., 0.26, bt) * (1. - smoothstep(0.26, 0.95, bt)) * exp(-h / 3.5);
    wp.xz = piv.xz + rr * (1. - 0.26 * pow(s, 1.5) * p);
    wp.y += p * (0.2 * (1. - s) - 0.24 * s);
    float ph = (kind - 10.) * 16., hh = pow(h, 0.7);         // (each hair and each arm ripples as one: its own phase rides in the kind's fraction)
    wp.x -= 0.10 * h + 0.004 * h * h - 0.15 * hh * sin(uT * 0.9 - 0.42 * h + ph);
    wp.z += 0.11 * hh * sin(uT * 0.7 - 0.37 * h + ph * 1.7);
    float b0 = fract(uT / ${JELLY.beat.toFixed(2)});
    wp.y += ${JELLY.rise.toFixed(2)} * (smoothstep(0.1, 0.45, b0) * (1. - smoothstep(0.45, 1., b0)) - 0.4);
    wp.x += ${JELLY.drift[0].toFixed(2)} * sin(6.2832 * uT / ${JELLY.drift[1].toFixed(1)} + 1.3); wp.z += ${JELLY.drift[2].toFixed(2)} * sin(6.2832 * uT / ${JELLY.drift[3].toFixed(1)});
  } else if (kind > 7.5) {                              // a ball tossed to and fro along a lip: w = half the throw (m); it rises 1.2 m on the way
    float sn = sin(uT * 1.7 + piv.x * 1.3);
    wp.x += mv.w * sn; wp.y += 1.2 * (1. - sn * sn);
  } else if (kind > 5.5) {                              // a kite on its string: it weaves about its station, more the higher up the string; its tail streams and ripples
    float ph = piv.x * 0.9 + piv.z * 1.3, f = min(mv.w, 1.), tail = max(mv.w - 1., 0.);
    f *= f;
    wp.x += f * (1.5 * sin(uT * 0.52 + ph) + 0.6 * sin(uT * 1.31 + ph * 2.));
    wp.z += f * 1.3 * sin(uT * 0.41 + ph * 1.7);
    wp.y += f * 0.9 * sin(uT * 0.67 + ph * 0.6) + tail * 0.15 * sin(uT * 4.6 - tail * 2.4 + ph);
    wp.z += tail * 0.11 * sin(uT * 3.7 - tail * 2.1 + ph);
  }
  return wp;
}
`;
const SOLID_FRAG_HEAD = /* glsl */`
varying vec3 vP, vN, vC, vQ;
`;

// ---- THE SECOND PAINTING OF WHAT FLOATS ----
// From the dry street a hull's topsides, a buoy's top or a bather's head stand in air behind a lip and are seen from low in the
// street only through the level's underside. Where the window (the sea top's from-under branch) closes that underside to the sky
// it would close it to them too, and a boat would be a mast over the lip and a keel under it with nothing between. So the afloat
// cast and the steamer are painted a second time, after the sea's top and before the faces' film: only their parts out of the
// water, only for a sight that meets the face under its lip (one that passes over the lip sees them in the air as they are), and
// as strongly as makes up what the sea top's law let through of a thing above the level before there was a window (0.94 within 4 m
// behind the face's plane, fading out by 15 m, less what the water on the way takes; the ceiling's facets aside, and the sight's
// way out of the water reckoned at the level, y 0, not at the swell's own height). It is untrue to light, as that clearness always
// was: a level seen low from below is a mirror. It goes by what a thing is and where it and the eye are: never by where the lens
// looks, the flight's progress, a seed or the clock.
const OVER_TEST = /* glsl */`
        // THE SECOND PAINTING's law, first of all (what it does not paint costs no more than this)
        float overA;
        { vec3 E = cameraPosition; float sg = P.z < 0. ? -1. : 1.;
          // F: where the sight from the eye to this point meets the plane of the face before it
          float tF = clamp((HALF - sg * E.z) / max(abs(P.z) - sg * E.z, 1e-3), 0., 1.); vec3 F = E + (P - E) * tF;
          // Only a sight that meets the face under its lip; only a point out of the water. (0.3 m is allowed at the lip, and under the
          // swell's own height at the point for a sight that rises to it: the top's skin is laid in panels some metres long and does
          // not follow the swell to the centimetre, and a seam of ceiling would show along every waterline. A sight that falls to
          // the point has no such allowance: what it finds under the swell's height lies under the top, seen from above.)
          if (abs(P.z) <= HALF || F.y >= eta(F.xz) + 0.3 || P.y <= eta(P.xz) - (P.y > E.y ? 0.3 : 0.)) discard;
          // X: where the sight leaves the water by the underside, reckoned at the level (y 0) and never before the face's plane (for an
          // eye in the swell's own height the lip's crest may stand in the sight: there X is F)
          vec3 X = E + (P - E) * (P.y > E.y ? clamp(-E.y / (P.y - E.y), tF, 1.) : tF);
          float behind = max(abs(X.z) - HALF, 0.); if (X.x < -8. || X.x > ${SLOT_END.toFixed(1)}) discard;   // (the see-through strip of the top)
          vec3 T = exp(-waterLen(X, E) * uK);
          float v = 0.94 * (1. - smoothstep(4., 15., behind)) * T.g;                 // what was let through before the window
          float win = smoothstep(0.20, 0.50, abs(P.y - E.y) / length(P - E));       // the window's own figures, for the same sight
          overA = v * (1. - win) / max(1. - v * win, 1e-3);                         // (the window's share and this one together make v)
          if (overA < 0.004) discard; }`;
const OVER_FRAG = /* glsl */`
        gl_FragColor.a = overA;`;
// The triangles of a built thing that the swell can bare: the same vertices, an index of their own. A triangle is taken when one
// of its corners rests higher than 5 cm under the level less what the swell can bare of that corner (bare: the sea's own law,
// makeSea's; zOf: the corner's own z where the thing is built about its own middle)
export function overGeometry(geo, bare, zOf = (z) => z) {
  const p = geo.attributes.position.array, m = geo.attributes.aMove.array, idx = [];
  const up = (v) => { const z = zOf(p[v * 3 + 2]), zp = zOf(m[v * 4 + 1]);
    return p[v * 3 + 1] > -0.05 - bare(Math.round(m[v * 4 + 2]), m[v * 4 + 3], Math.hypot(p[v * 3] - m[v * 4], p[v * 3 + 2] - m[v * 4 + 1]), Math.abs(z) < Math.abs(zp) ? z : zp); };
  for (let a = 0; a < p.length / 3; a += 3) if (up(a) || up(a + 1) || up(a + 2)) idx.push(a, a + 1, a + 2);
  const g = new THREE.BufferGeometry(); for (const k in geo.attributes) g.setAttribute(k, geo.attributes[k]);
  g.setIndex(idx); g.boundingSphere = geo.boundingSphere;
  return g;
}
// ---- the sea: its uniforms, the material every solid thing wears, the top, the two faces, the backdrops ----
export function makeSea(ctx, opts = {}) {
  const st = SEA_STATES[opts.state || 'calm'];
  const sun = opts.sun || new THREE.Vector3(0, 0.866, 0.5);
  const lin = (h, k = 1) => new THREE.Color(h).multiplyScalar(k);
  const wv = st.A.map((A, i) => {
    const k = 6.2832 / st.L[i], th = WAVE_TH[i];
    return new THREE.Vector4(k * Math.cos(th), -k * Math.sin(th), Math.sqrt(9.81 * k), A);
  });
  const S = st.A[0] + st.A[1] + st.A[2];
  const uniforms = {
    uT: { value: 0 }, uSun: { value: sun.clone().normalize() },
    uSunC: { value: lin('#FFF6E4', 1.3) }, uFill: { value: lin('#8CC8EE', 0.52) }, uBounce: { value: lin('#D9C29A', 0.34) },
    uHaze: { value: lin('#CFE6F2') }, uK: { value: new THREE.Vector3(st.K[0] * 0.45, st.K[1] * 0.65, st.K[2] * 0.75) },
    uG0: { value: lin(st.g[0]) }, uG1: { value: lin(st.g[1]) }, uG2: { value: lin(st.g[2]) },
    uWv: { value: wv }, uSS: { value: S }, uHorses: { value: st.horses }, uLip: { value: st.lip },
    uSkyZ: { value: lin('#3F8FD8') }, uSkyH: { value: lin('#A9D2EE') },
    uMole: { value: new THREE.Vector3(opts.mole ? opts.mole[0] : -9000, opts.mole ? opts.mole[1] : 1, opts.mole ? opts.mole[2] : 1) },   // the breakwater: its middle x, half its width, how far it runs out to either side
  };
  // WHAT THE SWELL CAN BARE of a floating thing's corner: how far under its resting waterline it can stand out of the water (metres),
  // by its law of motion (aMove's kind and its weight w), its distance r from its pivot and its place z (the nearer to a face of
  // the corner and its pivot). fall = the swell's reach there (its three heights together, heaped toward a lip); sg = the steepest
  // slopes of its three waves added, heaped likewise: no slope of the three together passes it. What rides the swell whole
  // (kind 1, w 1: a boat, a buoy, the raft) is bared only as the water falls away along its length: by r times that slope and a
  // tenth more, and never by more than twice the fall and the greatest heel over r. What rides by a share w (the steamer, 0.12):
  // by that share of the same, by its own tilt over r, and by the fall for the rest. A bather (kind 4) rides 0.8 of the swell and
  // treads (0.18 w), with a tenth of a metre for his own reach; an oar (kind 5) rides and dips (0.55 w); a swimmer on his round
  // (kind 7) rides 0.9 of the swell where he is at each moment, not at his pivot: by the whole fall, more than he needs. (Tried
  // against 3,000,000 chances in each sea, tools of the round: nothing that rides was bared past this law; the most came to 0.94,
  // 0.89 and 0.80 of it for what rides whole and to the whole of it for the steamer's share at her pivot. A bather's arm's end in
  // a breeze can be bared 3 cm past it: inside the 5 cm overGeometry keeps in hand.)
  // NOT PAINTED AGAIN, to keep the world's count of triangles: what a trough bares of a thing at rest (kind 0: a chain's top links,
  // the first metre of a fisher's line; what of them rests above the level is painted again like the rest), and the regatta's far
  // sails (kind 9: 224 m and more behind the south face).
  const SLOPE = st.A.reduce((s, A, i) => s + A * 6.2832 / st.L[i], 0);
  const bare = (kind, w, r, z) => {
    const G = 1 + st.lip * Math.exp(-Math.max(Math.abs(z) - HALF, 0) / 7), fall = S * G, sg = SLOPE * G;
    if (kind === 1) return w > 0.99 ? Math.min(1.1 * sg * r, 2 * fall + 0.10 * r) : w * Math.min(sg * r, 2 * fall) + Math.min(w * sg, 0.10) * r + (1 - w) * fall;
    if (kind === 4) return 0.2 * fall + 0.18 * Math.abs(w) + 0.1;
    if (kind === 5) return Math.min(1.1 * sg * r, 2 * fall + 0.10 * r) + 0.55 * Math.abs(w);
    return kind === 7 ? fall : kind === 9 ? -1e9 : 0;
  };
  // the material of every solid thing; head = extra vertex declarations, place = GLSL that sets wp and wn, albedo = GLSL that may change alb;
  // over = the second painting of what floats (above): drawn with the see-through things, writing no depth; it meets the first painting's
  // own depth (the same vertices by the same law), with the least step of depth in hand and none by the slope, so that nothing lying behind
  // a skin is painted through it
  const solid = (o = {}) => new THREE.ShaderMaterial({
    uniforms: Object.assign({}, uniforms), side: THREE.DoubleSide, vertexColors: true,
    ...(o.over ? { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: 0, polygonOffsetUnits: -1 } : {}),
    vertexShader: SEA_GLSL + SOLID_VERT + (o.head || '') + /* glsl */`
      void main(){
        vec3 wp = (modelMatrix * vec4(position, 1.)).xyz; vec3 wn = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.)); vec3 col = color;
        ${o.place || 'wp = moved(wp, wn, aMove, modelMatrix);'}
        vP = wp; vN = wn; vC = col; vQ = position;
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: SEA_GLSL + SOLID_FRAG_HEAD + /* glsl */`
      void main(){
        vec3 N = vN / max(length(vN), 1e-4); vec3 alb = vC; vec3 P = vP; vec3 Q = vQ;
        ${o.over ? OVER_TEST : ''}
        // every skin has a grain of its own, read at the thing's resting place so it rides with what moves
        vec2 gq = abs(N.y) > 0.6 ? Q.xz : (abs(N.x) > abs(N.z) ? Q.zy : Q.xy);
        float grain = vnoise(gq * 5.) * 0.6 + vnoise(gq * 19.) * 0.4;
        float nearG = 1. / (1. + length(P - cameraPosition) * 0.03);
        ${o.albedo || 'alb *= 1. + (grain - 0.5) * 0.22 * nearG;'}
        vec3 c = seaShade(alb, P, N, cameraPosition);
        ${o.after || ''}
        // where the sea's top meets a thing the water clings to it: a broken line of foam that comes and goes with the swell
        float etaP = eta(P.xz);
        float lap = 0.35 + 0.65 * smoothstep(0.3, 0.7, vnoise(vec2(P.x + P.z, P.x - P.z) * 1.7 + vec2(uT * 0.6, -uT * 0.45)));
        float line = step(HALF, abs(P.z)) * (1. - smoothstep(0.02, 0.10 + 0.1 * lap, abs(P.y - etaP))) * lap * ${o.noLine ? '0.' : '1.'};
        gl_FragColor = vec4(mix(c, vec3(1.25), line * 0.8), 1.);
        ${o.over ? OVER_FRAG : ''}
      }`,
  });
  return { uniforms, solid, bare, sun: uniforms.uSun.value };
}

// ---- the sea's top: a level skin riding the swell, with the slot left out of it ----
// Seen from above it is the summer sea; seen from under (through a face) it is the bright silver ceiling.
export async function buildSeaTop(ctx, sea, depthAt) {
  const xs = [], zs = [];
  for (let x = -8; x <= SLOT_END + 0.01; x += 2) xs.push(x);
  for (let x = SLOT_END + 3, s = 3; x < 4200; s *= 1.45, x += s) xs.push(x);
  for (let z = HALF; z <= 60.01; z += 2.5) zs.push(z);
  for (let z = 64, s = 4; z < 4200; s *= 1.5, z += s) zs.push(z);
  const nx = xs.length, nz = zs.length, pos = [], dep = [], idx = [], near = [];
  const nearRows = zs.filter((z) => z < HALF + 30 - 0.01).length;
  for (const side of [-1, 1]) {
    const base = pos.length / 3;
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { pos.push(xs[i], 0, side * zs[j]); dep.push(depthAt(xs[i], side * zs[j])); }
    for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const a = base + j * nx + i, b = a + 1, c = a + nx, d = c + 1;
      const into = j < nearRows && xs[i] >= -8 && xs[i] < SLOT_END ? near : idx;
      if (side > 0) into.push(a, c, b, b, c, d); else into.push(a, b, c, b, d, c);
    }
    await ctx.yield();
  }
  // the sea beyond the island, between the planes
  const i0 = xs.findIndex((x) => x > SLOT_END + 60), base = pos.length / 3;
  for (let i = i0; i < nx; i++) { pos.push(xs[i], 0, -HALF, xs[i], 0, HALF); dep.push(20, 20); }
  for (let i = 0; i < nx - i0 - 1; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('aDepth', new THREE.BufferAttribute(new Float32Array(dep), 1));
  g.setIndex(new THREE.BufferAttribute(new Uint32Array(idx), 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(500, 0, 0), 6000);
  const g2 = new THREE.BufferGeometry();
  g2.setAttribute('position', g.getAttribute('position')); g2.setAttribute('aDepth', g.getAttribute('aDepth'));
  g2.setIndex(new THREE.BufferAttribute(new Uint32Array(near), 1)); g2.boundingSphere = g.boundingSphere;
  const mk = (see) => new THREE.ShaderMaterial({
    uniforms: Object.assign({}, sea.uniforms, { uSee: { value: see } }), side: THREE.DoubleSide, transparent: see > 0, depthWrite: see === 0,
    vertexShader: SEA_GLSL + /* glsl */`
      attribute float aDepth; varying vec3 vP; varying float vD;
      void main(){ vec3 wp = position; wp.y = eta(wp.xz); vP = wp; vD = aDepth; gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.); }`,
    fragmentShader: SEA_GLSL + /* glsl */`
      uniform vec3 uSkyZ, uSkyH; uniform vec3 uMole; uniform float uSee; varying vec3 vP; varying float vD;
      float rip(vec2 q, float t){ return sin(q.x * 1.9 + q.y * 0.7 + t * 1.3) + sin(q.x * -0.8 + q.y * 2.3 - t * 1.1) + 0.6 * sin(q.x * 3.7 - q.y * 2.9 + t * 1.9); }
      void main(){
        vec3 E = cameraPosition; vec3 P = vP; vec3 V = (E - P) / max(length(E - P), 1e-3);
        float dist = length(E - P);
        vec2 g = etaSlope(P.xz);
        float fade = 1. / (1. + dist * 0.05);
        vec2 rg = vec2(rip(P.xz + vec2(0.3, 0.), uT) - rip(P.xz - vec2(0.3, 0.), uT), rip(P.xz + vec2(0., 0.3), uT) - rip(P.xz - vec2(0., 0.3), uT)) * 0.055 * fade;
        vec3 N = normalize(vec3(-g.x - rg.x, 1., -g.y - rg.y));
        float e = eta(P.xz);
        float horse = uHorses * smoothstep(0.45 * uSS, 0.95 * uSS, e + 0.25 * uSS * rip(P.xz * 0.6, uT * 0.5) * 0.4) * (0.55 + 0.45 * sin(P.x * 2.3 + P.z * 3.1 + rip(P.xz, uT)));
        horse *= smoothstep(0.3, 0.72, vnoise(P.xz * vec2(0.5, 0.85) + vec2(uT * 0.35, -uT * 0.2)));          // the white breaks in patches, not in bands
        // seen near, a patch of white is small flecks and short curls of foam sliding on the ripples; further off it is broken water; far off one soft patch
        vec2 fpx = fwidth(P.xz); float span = max(fpx.x, fpx.y);                  // how much sea one dot of the picture covers here
        vec2 fq = P.xz + 0.22 * vec2(rip(P.zx * 1.3 + 2., uT * 0.8), rip(P.xz * 1.1, uT * 0.7));
        float env = clamp(horse, 0., 1.);
        float fl = 0.6 * vnoise(fq * vec2(3.4, 4.6) + vec2(uT * 0.3, 0.)) + 0.4 * vnoise(fq * 10.5 - vec2(0., uT * 0.45)) * (1. - smoothstep(0.03, 0.14, span));
        float thr = mix(0.74, 0.57, env);
        float lace = 1. - smoothstep(0.012, 0.05, abs(fl - 0.47));                       // thin curls of foam along the ripples
        float fleck = max(smoothstep(thr, thr + 0.1, fl), 0.75 * lace * smoothstep(0.2, 0.6, env)) * smoothstep(0.04, 0.3, env);
        float broke = smoothstep(0.36, 0.5, vnoise(fq * vec2(1.1, 1.7) + vec2(uT * 0.3, -uT * 0.15))) * sqrt(env);
        horse = mix(env, mix(broke, fleck, 1. - smoothstep(0.07, 0.4, span)), 1. - smoothstep(0.25, 1.4, span));
        vec3 col; float alpha = 1.;
        if (gl_FrontFacing) {
          // (a ruffled sea seen low and far shows the sky from well up, not the pale rim of it: its small faces lean toward the eye)
          float cosv = clamp(dot(N, V), 0., 1.); float f = 1. - cosv; float fres = min(0.03 + 0.97 * f * f * f * f * f, 0.62);
          vec3 R = reflect(-V, N); float up = clamp(R.y + 0.2, 0., 1.);
          vec3 sky = mix(uSkyH, uSkyZ, sqrt(up));
          float dd = clamp(vD, 0., 30.);
          vec3 body = mix(uG1 * 0.74, uG2 * 0.92, smoothstep(0.6, 10., dd)) * (0.5 + 0.25 * cosv);          // deep water's own colour, from a metre of depth on
          body = mix(body, vec3(0.62, 0.55, 0.36) * exp(-uK * dd * 2.) + uG1 * 0.5, (1. - smoothstep(0.1, 1.4, dd)) * 0.7);
          float sp = clamp(dot(R, uSun), 0., 1.); float sp2 = sp * sp; sp2 *= sp2; sp2 *= sp2; sp2 *= sp2; sp2 *= sp2; sp2 *= sp2;
          col = mix(body, sky, fres) + uSunC * sp2 * sp2 * 2.2;
          col = mix(col, vec3(1.15), clamp(horse, 0., 1.) * 0.85);
          // along each lip a shoulder of lit water 1.4 m broad: the light comes in through the face there as well, so the top is paler and
          // greener; where the lip's foam is broken the dark top and the face then do not meet in a ruled seam
          float shl = (1. - smoothstep(0.05, 1.4, abs(P.z) - HALF)) * step(-1., P.x) * step(P.x, 1001.);
          col = mix(col, uG1 * 0.9 + 0.3 * sky, 0.6 * shl);
          // the white along each lip: foam, not a ruled line: its breadth and its strength change along the lip and it is broken in places
          float sgn = P.z < 0. ? -1. : 1., lf = lipFoam(P.x, sgn);
          float lw = 0.05 + 0.5 * lf * (0.35 + 0.65 * vnoise(vec2(P.x * 3.3 - uT * 0.7, sgn * 2. + uT * 0.3)));
          float lip = step(-1., P.x) * step(P.x, 1001.) * (1. - smoothstep(lw * 0.4, lw, abs(P.z) - HALF));
          col = mix(col, vec3(1.2), lip * (0.25 + 0.6 * lf) * (0.6 + 0.4 * smoothstep(0.3 * uSS, 0.9 * uSS, e)));
          col = mix(col, uHaze, 1. - exp(-dist * 0.00058));
          // close to a lip the water is seen into from above, a little: a keel, a chain's first links
          // where the sea washes the breakwater's stone: broken foam along both its sides and round its ends, broader toward a lip (within
          // 10 m of it), where the swell that runs along the stone piles into the corner and breaks
          vec2 md = abs(P.xz - vec2(uMole.x, 0.)) - uMole.yz;
          float mdist = length(max(md, 0.)) + min(max(md.x, md.y), 0.);
          float nearLip = 1. - smoothstep(1., 10., abs(P.z) - HALF);
          float wash = (1. - smoothstep(0.1, 1.7 + 4.2 * nearLip + 1.3 * rip(P.xz * 0.45, uT * 0.8) * 0.3, mdist)) * step(0., mdist) * step(HALF, abs(P.z));
          wash *= smoothstep(-1.4, 1.2, rip(P.xz * 1.9, uT * 1.4) + 1.5 * (1. - mdist));
          // the same white round the seal reef's rock, by the rock's plan (it thins away inward over the low rim the crests wash)
          float rkr = length(vec2((P.x - 875.) / 30., (P.z + 35.) / 12.)), rkd = (rkr - 0.56) * 14.;
          float rwash = (1. - smoothstep(0.1, 1.5 + 1.3 * rip(P.xz * 0.45, uT * 0.8) * 0.3, rkd)) * smoothstep(-3.5, -1.5, rkd);
          rwash *= smoothstep(-1.4, 1.2, rip(P.xz * 1.9, uT * 1.4) + 1.5 * (1. - rkd));
          wash = max(wash, rwash);
          col = mix(col, vec3(1.15), clamp(wash, 0., 1.) * 0.8);
          float seeIn = (1. - fres) * (1. - smoothstep(HALF + 4., HALF + 13., abs(P.z))) * (1. - clamp(horse, 0., 1.)) * (1. - lip) * (1. - clamp(wash, 0., 1.));
          // ONE LAW FOR THE WHOLE TOP, wherever a lip stands: seen from above, a level is clear only where the sight meets it steeply; met
          // low it is the sea's own face. V.y is the sine of the sight's angle to the level: at 0.14 (8 degrees) and under, the top is
          // closed; from 0.38 (22 degrees) up it is as clear as it was; between, it eases. Reckoned from the eye's place and this point
          // alone: never from where the lens looks, the flight or the clock. The window from below is the other branch and is untouched.
          seeIn *= smoothstep(0.14, 0.38, V.y);
          alpha = 1. - 0.5 * seeIn * (1. - clamp(sp2 * sp2 * 2., 0., 1.));
        } else {
          // from under: the water's own colour, gathered along the sight, with the swell's slopes running through it as soft light.
          // Near a face the sight through the water is short, so where the sight is steep (the window, below) the sky and a hull's
          // topsides show through it, tinted; further in the water closes over them.
          float W = waterLen(P, E);
          vec3 T = exp(-W * uK);
          // the underside is level water in small facets: each tips a little light or a little dark toward the eye as the ripples run,
          // finer and closer together toward the far lip, so it lies flat and level
          float facet = rip(P.xz * 1.45 + 3., uT * 1.1) * 0.075 + rip(P.xz * 3.7, uT * 1.6) * 0.04 * fade * 4.;
          float dap = clamp(0.88 + 0.26 * seaNet(P.xz * 0.8) + 1.6 * dot(g, uSun.xz) + facet, 0.55, 1.6);
          col = seaGlowK(0.5 + 0.3 * W, P, 0.) * dap;
          // further behind the face the underside is lost in the deep water's own colour, as everything there is
          col = mix(col, deepSeaK(vec3(P.x, 0., P.z), 0.), smoothstep(HALF + 7., HALF + 28., abs(P.z)));
          col = mix(col, uHaze, 1. - exp(-dist * 0.00058));                          // (the air between, as on the backdrop it meets and on every thing)
          float clear = 1. - smoothstep(4., 15., abs(P.z) - HALF);
          // THE WINDOW: from below a level is clear only where the sight meets it steeply, and a mirror where it meets it low. The
          // underside is as clear as it was where the sight from the eye to this point rises more than 30 degrees (its sine 0.50), closed to
          // the silver ceiling (but for its darker facets, up to 13.5 parts in 100 clear, as they were) where it rises less than about
          // 12 (sine 0.20), and even between: so far down the street no sky stands in the walls, and what stands steeply over the
          // eye is seen through. It is reckoned from the eye's place and this point alone, as light is: never from where the lens looks,
          // the flight's progress or the clock; the same on every seed and at every pace. (What floats is painted again through the
          // closed ceiling: THE SECOND PAINTING, above.)
          float win = smoothstep(0.20, 0.50, abs(V.y));
          alpha = clamp(1. - 0.94 * clear * T.g * win + 0.3 * (dap - 1.), 0.05, 1.);
        }
        gl_FragColor = vec4(col, mix(1., alpha, uSee));
      }`,
  });
  const group = new THREE.Group(); group.name = 'sea-top';
  const far = new THREE.Mesh(g, mk(0)); far.frustumCulled = false; group.add(far);
  const strip = new THREE.Mesh(g2, mk(1)); strip.frustumCulled = false; strip.renderOrder = 4; group.add(strip);
  return group;
}

// ---- the two faces (one thin film each) and the deep-water backdrops 30 m behind them ----
export async function buildFaces(ctx, sea) {
  const group = new THREE.Group();
  const film = (z, cols, rows, backdrop) => {
    const pos = [], top = [], idx = [];
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= cols; i++) {
      const x = (backdrop ? -8 : 0) + (SLOT_END + (backdrop ? 68 : 0)) * i / cols, f = j / rows;
      pos.push(x, -bedD(x) * (1 - f) - (backdrop ? 0.5 * (1 - f) : 0), z); top.push(f);
    }
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const a = j * (cols + 1) + i, b = a + 1, c = a + cols + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
    g.setAttribute('aTop', new THREE.BufferAttribute(new Float32Array(top), 1));
    g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(500, -10, z), 600);
    return g;
  };
  const vert = SEA_GLSL + /* glsl */`
    attribute float aTop; varying vec3 vP;
    void main(){ vec3 wp = position; float e = eta(wp.xz); wp.y += e * aTop * aTop; vP = wp; gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.); }`;
  // the deep water 30 m behind a face: the water's own colour, and standing in it far off the dim shapes of a forest of weed
  // and the rise of the wild bed, swaying a little: they slide behind the near things as the eye moves
  const back = new THREE.ShaderMaterial({ uniforms: sea.uniforms, side: THREE.DoubleSide, vertexShader: vert,
    fragmentShader: SEA_GLSL + /* glsl */`
      varying vec3 vP;
      float weed(vec2 p, float sc, float hmax, float sd){
        float xs = (p.x + 0.15 * p.y + 0.03 * p.y * sin(uT * 0.45 + p.x * 0.21 + sd)) * sc;
        float i = floor(xs), r = h21(vec2(i, sd)), f = abs(fract(xs) - 0.5 + (r - 0.5) * 0.5);
        float hgt = hmax * (0.3 + 0.7 * r) * step(0.3, h21(vec2(i, sd + 3.)));
        float w = 0.09 + 0.13 * (0.5 + 0.5 * sin(p.y * 2.1 + i * 5.));
        return (1. - smoothstep(w * 0.45, w, f)) * (1. - smoothstep(hgt * 0.75, hgt + 0.01, p.y));
      }
      void main(){
        float D = bedLin(vP.x); float hb = max(vP.y + D, 0.);
        vec3 c = deepSeaK(vP, smoothstep(0.3, 4., -vP.y) * shaftK(waterLen(vP, cameraPosition)));   // the shafts begin under the level and run together far off through the water
        float rise = 1. - smoothstep(0., 1., hb - 1.2 - 3.2 * fbm2(vec2(vP.x * 0.045, 4.)));
        float grove = smoothstep(0.36, 0.62, fbm2(vec2(vP.x * 0.045, 9.)));                    // it stands in groves, open water between
        float far = (weed(vec2(vP.x, hb), 0.55, 0.62 * D, 1.) * 0.26 + weed(vec2(vP.x + 40., hb), 0.9, 0.42 * D, 7.) * 0.16) * grove;
        c *= (1. - min(far, 0.45)) * (1. - 0.14 * rise);
        gl_FragColor = vec4(mix(c, uHaze, 1. - exp(-length(vP - cameraPosition) * 0.00058)), 1.);
      }` });
  const face = new THREE.ShaderMaterial({ uniforms: sea.uniforms, side: THREE.DoubleSide, transparent: true, depthWrite: false, vertexShader: vert,
    fragmentShader: SEA_GLSL + /* glsl */`
      uniform vec3 uMole; varying vec3 vP;
      void main(){
        vec3 P = vP; float e = eta(P.xz); float d = max(e - P.y, 0.);
        float sgn = P.z < 0. ? -1. : 1., lf = lipFoam(P.x, sgn);
        float nick = 0.5 + 0.5 * smoothstep(0.3, 0.6, vnoise(vec2(P.x * 1.3 - uT * 0.5, sgn * 5.)));
        float men = (1. - smoothstep(0.02, 0.05 + 0.22 * lf * nick, d)) * (0.4 + 0.6 * lf * nick);   // the bright edge at the lip: a thread here, a hand's breadth there, broken in places
        float SL = uSS * (1. + uLip);                                           // the swell's reach on the face's own plane
        float high = smoothstep(0.45 * SL, 0.9 * SL, e);
        // the foam a crest carries under the lip: a short ragged fringe that slides down and breaks up
        float rag = vnoise(vec2(P.x * 4.3 + uT * 0.4, d * 7. - uT * 1.3));
        float foam = high * (1. - smoothstep(0.08, 0.2 + (0.2 + 0.35 * uHorses) * lf, d)) * smoothstep(0.34, 0.62, rag);
        // the wet roots of the showers: fine threads of white water running a little way down the face, only where the lip is slopping
        float thread = smoothstep(0.66, 0.86, vnoise(vec2(P.x * 8.5, d * 1.3 - uT * 2.4))) * smoothstep(0.35, 0.6, vnoise(vec2(P.x * 1.7 + 9., d * 2.2 - uT * 1.3)));
        float slop = smoothstep(0.5 * SL, 0.85 * SL, e) * slopGust(P.x, sgn) * (1. - smoothstep(0.2, 1.5, d)) * thread * 0.45;
        float veil = mix(0.04, 0.10, clamp(-P.y / 22., 0., 1.));
        // where a face ends against the breakwater's stone the swell breaks on it: white water runs back down the face's upper part in
        // falling threads, for 7 to 9.5 m along from the stone, deepest next the stone (as far as 7 m down) and 2.2 m at its far end,
        // so each of the four corners of the cut sea at the stone stands in broken water
        float mx = abs(P.x - uMole.x) - uMole.y;
        float run = 0.5 + 0.5 * sin(P.y * 2.3 + uT * 2.1 + 3. * sin(P.x * 1.9 + uT * 0.7));
        float fallT = 0.6 * vnoise(vec2(P.x * 4.5, d * 0.8 - uT * 2.6)) + 0.4 * vnoise(vec2(P.x * 11., d * 2.4 - uT * 4.));
        float nearC = 1. - smoothstep(0.5, 7. + 2.5 * run, mx);
        float broke = step(0., mx) * nearC * (1. - smoothstep(0.6, 2.2 + 4.8 * nearC * (0.6 + 0.4 * run), d)) * (0.3 + 0.7 * smoothstep(0.3, 0.7, fallT));
        float white = clamp(max(max(men * 0.8, broke * 0.8), max(foam * 0.75, slop)), 0., 0.85);
        vec3 col = mix(seaGlow(max(-P.y, 0.), P), vec3(1.15, 1.2, 1.18), white / max(white + veil, 1e-3));
        gl_FragColor = vec4(col, max(white, veil));
      }` });
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(film(s * HALF, 500, 6, false), face); f.renderOrder = 5; f.name = 'face'; group.add(f);
    const b = new THREE.Mesh(film(s * (HALF + 30), 120, 4, true), back); b.name = 'backdrop'; group.add(b);
    await ctx.yield();
  }
  return group;
}

// ---- boats: every hull is ONE thing, top and bottom; the sea's rule cuts it at the waterline per fragment ----
// A hull in its own axes: bow toward +x, waterline at y 0. o: L length, B beam, free freeboard, draft, full (0 fine .. 1 full
// ended), hull and bottom colours, keel (depth of a fin keel under the hull, 0 none).
export function addHull(g, o) {
  const L = o.L, B = o.B, n = o.n || 12, m = o.m || 8, rows = [];
  for (let i = 0; i <= n; i++) {
    const s = -1 + 2 * i / n, a = Math.abs(s);
    const bw = (B / 2) * Math.pow(Math.max(1 - Math.pow(a, s > 0 ? 1.7 : 2.6 + 3 * (o.full || 0)), 0), 0.75) + 0.02;
    const sheer = o.free * (1 + 0.35 * s * s + (s > 0 ? 0.25 * s : 0));
    const dr = o.draft * Math.pow(Math.max(1 - Math.pow(a, 3), 0), 0.6) + 0.02;
    // girth stations: two on the topside, one at the boot top, one exactly on the waterline, m across the bottom
    const f = o.full || 0, e1 = 1.1 - 0.75 * f, e2 = 0.9 - 0.4 * f;
    const thOf = (y) => Math.asin(Math.pow(Math.min(1, Math.max(0, (sheer - y) / (sheer + dr))), 1 / e2));
    const tB = thOf(0.16), tW = thOf(0), ang = [0, tB * 0.5, tB, tW];
    for (let k = 1; k < m; k++) ang.push(tW + (Math.PI - 2 * tW) * k / m);
    ang.push(Math.PI - tW, Math.PI - tB, Math.PI - tB * 0.5, Math.PI);
    const row = ang.map((th) => { const sn = Math.sin(th), cs = Math.cos(th); return [s * L / 2, sheer - (sheer + dr) * Math.pow(sn, e2), -bw * Math.sign(cs) * Math.pow(Math.abs(cs), e1)]; });
    rows.push(row);
  }
  const last = m + 6;
  g.skin(rows, (i, j) => (j < 2 || j >= last - 2 ? o.hull : (j === 2 || j === last - 3 ? o.boot || o.hull : o.bottom)), false, false);
  // the deck
  const deck = rows.map((r) => [[r[0][0], r[0][1] - 0.05, r[0][2]], [r[last][0], r[last][1] - 0.05, r[last][2]]]);
  g.skin(deck, o.deck || C('#C9B28A', 0.8), false, true);
  if (o.keel) {
    const k0 = -o.draft * 0.9, k1 = -o.draft - o.keel, kc = o.bottom;
    g.skin([[[-L * 0.16, k0, 0], [-L * 0.08, k1, 0]], [[-L * 0.02, k0, 0.16], [-L * 0.0, k1, 0.22]], [[L * 0.14, k0, 0], [L * 0.08, k1, 0]]], kc);
    g.skin([[[-L * 0.16, k0, 0], [-L * 0.08, k1, 0]], [[-L * 0.02, k0, -0.16], [-L * 0.0, k1, -0.22]], [[L * 0.14, k0, 0], [L * 0.08, k1, 0]]], kc, false, true);
    g.box(-L * 0.42, -o.draft * 0.55, 0, L * 0.07, o.draft * 1.5 + o.keel * 0.5, 0.08, kc);   // the rudder
  }
  return g;
}
// A whole boat at (x, z), heading ry, riding the swell at its mooring. kind: 'sloop' | 'yawl' | 'fisher' | 'row' | 'dinghy' | 'launch'
export function addBoat(g, kind, x, z, ry, o = {}) {
  const white = C('#F4FBF7', 0.82), red = C('#C8432B', 0.75), wood = C('#8A5A32', 0.8), spar = C('#D8B880', 0.8);
  const hullC = o.hull || C('#EFE6CC', 0.8), bot = o.bottom || red;
  g.at(x, 0, z, ry).move(o.pivot ? o.pivot[0] : x, o.pivot ? o.pivot[1] : z, 1, o.ride ?? 1);
  if (kind === 'sloop' || kind === 'yawl') {
    const L = kind === 'yawl' ? 11 : 9.5, mast = kind === 'yawl' ? 11.5 : 11;
    addHull(g, { L, B: 2.9, free: 0.85, draft: 0.75, keel: kind === 'yawl' ? 2.0 : 1.9, hull: hullC, bottom: bot, boot: white, full: 0.2 });
    g.box(-0.4, 1.05, 0, L * 0.34, 0.5, 1.5, white, C('#E2D8C0', 0.8));
    g.bar([L * 0.12, 0.8, 0], [L * 0.12, mast, 0], 0.09, 0.06, spar, 6);
    g.bar([L * 0.12, 1.9, 0], [-L * 0.36, 1.9, 0], 0.07, 0.06, spar, 5);
    if (o.sails) {
      g.move(x, z, 1, o.ride ?? 1);
      g.quad([L * 0.12 - 0.1, 2.1, 0.02], [-L * 0.34, 2.1, 0.35], [-L * 0.1, mast * 0.6, 0.3], [L * 0.12 - 0.1, mast - 0.3, 0.02], white);
      g.tri([L * 0.16, mast - 1.5, 0], [L * 0.5, 1.0, 0], [L * 0.2, 1.3, -0.5], white);
    } else g.bar([L * 0.1, 2.05, 0], [-L * 0.34, 2.05, 0], 0.16, 0.13, white, 6);          // the sail furled along the boom
    if (kind === 'yawl') { g.bar([-L * 0.43, 0.8, 0], [-L * 0.43, 5.6, 0], 0.06, 0.04, spar, 5); g.bar([-L * 0.43, 1.7, 0], [-L * 0.62, 1.7, 0], 0.05, 0.04, spar, 5); }
  } else if (kind === 'fisher') {
    addHull(g, { L: 10.5, B: 3.6, free: 1.2, draft: 1.5, hull: hullC, bottom: bot, boot: white, full: 0.7 });
    g.box(-1.6, 2.15, 0, 2.6, 2.1, 2.2, white, C('#C8432B', 0.7));
    g.bar([2.2, 1.2, 0], [2.2, 6.2, 0], 0.09, 0.06, spar, 6); g.bar([2.2, 4.2, 0], [5.6, 6.0, 0], 0.06, 0.05, spar, 5);
    g.box(-4.9, -1.25, 0, 0.7, 1.1, 0.07, bot); g.at(x, 0, z, ry);
  } else if (kind === 'launch') {
    addHull(g, { L: 7, B: 2.3, free: 0.75, draft: 0.6, hull: hullC, bottom: bot, boot: white, full: 0.5 });
    g.box(0.8, 1.0, 0, 2.0, 0.7, 1.5, white);
  } else {                                                                              // open boats: 'row' and 'dinghy'
    const L = kind === 'row' ? 4.6 : 3.6;
    addHull(g, { L, B: 1.5, free: 0.45, draft: 0.28, hull: hullC, bottom: bot, deck: wood, full: 0.5 });
    g.box(0, 0.42, 0, 0.3, 0.06, 1.3, wood); g.box(-1.0, 0.42, 0, 0.3, 0.06, 1.1, wood);
    // one plain figure sitting at the oars or the tiller
    g.ball(-0.1, 0.95, 0, 0.26, 0.5, 0.2, o.shirt || C('#C8432B', 0.75), 6, 4); g.ball(-0.1, 1.6, 0, 0.14, 0.16, 0.14, C('#E0B090', 0.8), 6, 4);
  }
  g.at().move();
  return g;
}

// an anchor on the sand with its chain up to a point at the waterline (things that measure the depth)
export function addChain(g, top, foot, o = {}) {
  const iron = o.col || C('#3A3F44', 0.9);
  g.at().move();
  g.chain(top, foot, o.col || C('#4A5055', 1.0), o.thick || 0.25, o.sag ?? 0.8);     // the chain's iron is about twice as light as the anchor's: each link takes its own shade and rust from it
  if (o.block) g.box(foot[0], foot[1] + 0.45, foot[2], 1.3, 0.9, 1.3, C('#8D8A80', 0.8));
  else {                                                   // an anchor: shank, stock and two flukes dug in the sand
    g.bar([foot[0], foot[1] + 0.1, foot[2]], [foot[0] + 1.5, foot[1] + 0.35, foot[2]], 0.09, 0.09, iron, 5);
    g.bar([foot[0] + 1.5, foot[1] + 0.3, foot[2] - 0.8], [foot[0] + 1.5, foot[1] + 0.3, foot[2] + 0.8], 0.07, 0.07, iron, 5);
    g.tri([foot[0], foot[1] + 0.1, foot[2]], [foot[0] + 0.5, foot[1] + 0.9, foot[2] - 0.5], [foot[0] + 0.5, foot[1] + 0.1, foot[2] - 0.6], iron);
    g.tri([foot[0], foot[1] + 0.1, foot[2]], [foot[0] + 0.5, foot[1] + 0.9, foot[2] + 0.5], [foot[0] + 0.5, foot[1] + 0.1, foot[2] + 0.6], iron);
  }
  return g;
}

// a ship's plating, read in her own axes: strakes laid in and out and the butts between her long plates, a row of ports in her side,
// rust weeping down the white and a run of it under every port, a dark boot-topping at the waterline, weed under it, old scars on the
// red bottom and the red darker under the turn of the bilge
const SHIP_ALBEDO = /* glsl */`
  float sideS = step(abs(N.y), 0.75);
  vec2 pl = vec2(Q.x / 5.2 + floor(Q.y / 1.05) * 0.37, Q.y / 1.05);
  vec2 pf = abs(fract(pl) - 0.5);
  float seam = max(0.45 * smoothstep(0.485, 0.5, pf.x), smoothstep(0.43, 0.5, pf.y)) * sideS * min(nearG * 2.2, 1.);
  float isRed = step(alb.g * 2.5, alb.r) * step(Q.y, 0.6);
  float isWhite = step(0.45, alb.b) * step(0.45, alb.r) * step(Q.y, 3.1);
  alb *= 1. - 0.3 * clamp(seam, 0., 1.) * max(isRed, isWhite);
  alb *= 1. - 0.09 * mod(floor(Q.y / 1.05), 2.) * sideS * max(isRed, isWhite);
  alb *= 1. + (grain - 0.5) * 0.14 * nearG;
  float port = (1. - smoothstep(0.17, 0.22, length(vec2((fract(Q.x / 2.3) - 0.5) * 2.3, Q.y - 1.45)))) * step(abs(Q.x - 1.), 17.5);
  float ring = (1. - smoothstep(0.24, 0.28, length(vec2((fract(Q.x / 2.3) - 0.5) * 2.3, Q.y - 1.45)))) * step(abs(Q.x - 1.), 17.5);
  float weep = smoothstep(0.6, 0.9, vnoise(vec2(Q.x * 1.3, 1.))) * (1. - smoothstep(0.3, 2.3, Q.y)) * step(0., Q.y);
  float pxr = (fract(Q.x / 2.3) - 0.5) * 2.3;
  float run = (1. - smoothstep(0.05, 0.2 + 0.1 * vnoise(vec2(Q.x * 0.7, 3.)), abs(pxr))) * smoothstep(0.35, 0.8, Q.y) * (1. - smoothstep(0.9, 1.3, Q.y)) * step(abs(Q.x - 1.), 17.5) * (0.4 + 0.6 * vnoise(vec2(floor(Q.x / 2.3) * 3.7, 5.)));
  alb = mix(alb, vec3(0.52, 0.27, 0.12), isWhite * sideS * clamp(weep * 0.5 + run * 0.75, 0., 0.85));
  alb = mix(alb, vec3(0.72, 0.5, 0.2), isWhite * sideS * ring);
  alb = mix(alb, vec3(0.03, 0.07, 0.1), isWhite * sideS * port);
  alb = mix(alb, vec3(0.03, 0.04, 0.05), isWhite * sideS * (1. - smoothstep(0.5, 0.56, Q.y)));
  float slime = smoothstep(-1.7, -0.15, Q.y) * (0.45 + 0.55 * vnoise(vec2(Q.x * 0.9, Q.y * 2.2)));
  alb = mix(alb, vec3(0.15, 0.28, 0.11), isRed * clamp(slime * 0.5 + 0.55 * smoothstep(-0.75, -0.05, Q.y) * (0.55 + 0.45 * vnoise(vec2(Q.x * 2.1, 7.))), 0., 0.9));
  alb *= mix(1., 0.62, isRed * (1. - smoothstep(-4.3, -2.4, Q.y)));
  alb *= mix(1., 0.8 + 0.36 * fbm2(vec2(Q.x * 0.33, Q.y * 0.8)), isRed);
`;
// ---- THE KEEPER: the island steamer, 44 m, stemming the stream; built about her own middle, bow toward +x ----
export function buildSteamer(sea) {
  const g = new Geo(), white = C('#F4FBF7', 0.84), red = [0.72, 0.07, 0.035], buff = C('#D9A85A', 0.85), black = C('#1E2226', 1), wood = C('#B89868', 0.8);
  g.move(0, 0, 1, 0.12);
  // hull: stern 21 m astern of the middle, stem 23 m ahead; 8 m beam; 4.6 m draught
  g.at(1, 0, 0);
  addHull(g, { L: 44, B: 8, free: 2.9, draft: 4.6, hull: white, bottom: red, boot: black, full: 0.85, n: 26, m: 12, deck: wood });
  g.at();
  for (const s of [-1, 1]) g.box(1, -3.7, s * 3.3, 20, 0.12, 0.7, red);                  // bilge keels
  g.box(-21.2, -2.4, 0, 1.4, 3.8, 0.18, red);                                           // rudder
  g.bar([-19.2, -3.1, 0], [-15.0, -3.1, 0], 0.22, 0.34, red, 6);                         // the shaft's boss
  const glass = C('#27506A', 1), roof = C('#E8E2D2', 0.8), dark = C('#27404E', 1);
  g.box(-1, 4.3, 0, 24, 2.4, 6.0, white, roof);                                          // the deck house, the promenade deck round it
  g.box(3.5, 6.6, 0, 10, 2.2, 4.8, white, roof);                                         // the boat deck's house
  g.box(7.6, 8.5, 0, 3.4, 1.6, 5.6, white, buff);                                        // the bridge and its wings
  g.box(9.32, 8.75, 0, 0.04, 0.7, 5.2, glass); for (const s of [-1, 1]) g.box(7.6, 8.75, s * 2.82, 2.6, 0.7, 0.04, glass);
  for (let i = -6; i <= 5; i++) for (const s of [-1, 1]) g.box(-1 + i * 1.9, 4.55, s * 3.02, 0.9, 0.8, 0.04, glass);   // saloon windows
  for (let i = -2; i <= 2; i++) for (const s of [-1, 1]) g.box(3.5 + i * 1.8, 6.8, s * 2.42, 0.8, 0.7, 0.04, glass);
  // rails round the promenade deck and the boat deck: posts and two wires, stout enough to be seen
  for (const s of [-1, 1]) {
    for (const [x0, x1, y, z] of [[-13, 11, 5.5, 3.0], [-1.5, 8.5, 7.7, 2.4]]) { for (const h of [0.5, 1.0]) g.bar([x0, y + h, s * z], [x1, y + h, s * z], 0.035, 0.035, white, 4); for (let x = x0; x <= x1 + 0.01; x += 2) g.bar([x, y, s * z], [x, y + 1.0, s * z], 0.035, 0.035, white, 4); }
    // lifeboats in their davits
    for (const bx of [-7.5, -3.6]) { g.at(bx, 7.0, s * 2.75); addHull(g, { L: 3.4, B: 1.1, free: 0.35, draft: 0.3, hull: white, bottom: wood, n: 6, m: 5 }); g.at(); for (const dx of [-1.3, 1.3]) { g.bar([bx + dx, 5.5, s * 2.9], [bx + dx, 7.9, s * 2.9], 0.05, 0.05, buff, 4); g.bar([bx + dx, 7.9, s * 2.9], [bx + dx, 7.9, s * 2.5], 0.05, 0.05, buff, 4); } }
    g.box(21.2, 1.9, s * 0.75, 0.9, 0.9, 0.12, black);                                   // her anchors at the hawse
  }
  // the striped awning over the after deck, on stanchions; the people of the island boat under it and along her rail
  for (let i = 0; i < 8; i++) { const x0 = -20 + i * 0.95; g.quad([x0, 5.3, -3.0], [x0, 5.3, 3.0], [x0 + 0.95, 5.3, 3.0], [x0 + 0.95, 5.3, -3.0], i % 2 ? red : white); }
  for (const s of [-1, 1]) for (const x of [-20, -16.2, -12.4]) g.bar([x, 3.0, s * 2.9], [x, 5.3, s * 2.9], 0.05, 0.05, white, 4);
  const coats = ['#C8432B', '#F4FBF7', '#0B5A7A', '#D9A85A', '#2F6B4A', '#E8B8A0'].map((h) => C(h, 0.8));
  for (let i = 0; i < 26; i++) { const aft = i < 12, x = aft ? -19.5 + (i % 6) * 1.25 : -10 + (i - 12) * 1.45, z = (i % 2 ? 1 : -1) * (aft ? 1.0 + (i % 3) * 0.75 : 3.25), y = aft ? 3.0 : 3.05; g.ball(x, y + 1.15, z, 0.2, 0.36, 0.15, coats[i % 6], 5, 3); g.ball(x, y + 1.65, z, 0.12, 0.13, 0.12, C('#D9A07A', 0.85), 5, 3); g.bar([x, y + 0.85, z], [x, y, z], 0.13, 0.1, coats[(i + 3) % 6], 4); }
  // the funnel (top y 11.6) with its steam pipe, four cowls, two masts with their crosstrees
  g.turn(-1.5, 7.7, 0, [[1.25, 0], [1.2, 2.5], [1.2, 2.55], [1.2, 3.3], [1.22, 3.31], [1.22, 3.9]], (i) => (i >= 4 ? black : (i === 2 ? white : buff)), 14);
  g.bar([-0.2, 7.7, 0], [-0.2, 11.2, 0], 0.07, 0.07, buff, 5);
  for (const [vx, vz] of [[2.2, 1.5], [2.2, -1.5], [-4.4, 1.4], [-4.4, -1.4]]) { g.bar([vx, 7.7, vz], [vx, 9.0, vz], 0.2, 0.2, white, 6); g.ball(vx + 0.2, 9.1, vz, 0.36, 0.36, 0.36, white, 6, 4); g.box(vx + 0.5, 9.1, vz, 0.05, 0.5, 0.5, red); }
  for (const [mx, top] of [[14, 12], [-13, 10.5]]) { g.bar([mx, 3.3, 0], [mx, top, 0], 0.14, 0.08, buff, 6); g.bar([mx, top - 2.6, -1.3], [mx, top - 2.6, 1.3], 0.05, 0.05, buff, 4); g.bar([mx, top - 0.4, 0], [mx + (mx > 0 ? -5.5 : 5.5), 5.6 + (mx > 0 ? 2.2 : 0), 0], 0.035, 0.035, dark, 4); }
  g.box(15.5, 3.4, 0, 2.2, 0.7, 2.4, wood); g.box(18.6, 3.5, 0, 1.0, 0.8, 1.6, dark);       // fore hatch, windlass
  g.at(); g.move();
  const hull = new THREE.Mesh(g.geometry(), sea.solid({ albedo: SHIP_ALBEDO })); hull.frustumCulled = false; hull.name = 'steamer';
  // the screw: four bronze blades 3 m across on the shaft's end, turning ahead
  const p = new Geo(), bronze = [1.25, 0.62, 0.13];             // bright new bronze: it must stay gold under the green of the water
  p.ball(0, 0, 0, 0.45, 0.4, 0.4, bronze, 8, 4);
  for (let b = 0; b < 4; b++) {
    const a = b * 1.5708, c = Math.cos(a), s = Math.sin(a), pitch = 0.42;
    const P = (r, w, x) => [x + w * pitch, c * r - s * w, s * r + c * w];
    const rows = [[P(0.3, -0.18, 0), P(0.3, 0.18, 0)], [P(0.9, -0.55, 0), P(0.9, 0.5, 0)], [P(1.3, -0.5, 0), P(1.3, 0.55, 0)], [P(1.5, -0.12, 0), P(1.5, 0.2, 0)]];
    p.skin(rows, bronze);
  }
  const screw = new THREE.Mesh(p.geometry(), sea.solid({ noLine: true })); screw.position.set(-19.6, -3.1, 0); screw.name = 'screw'; screw.frustumCulled = false;
  // (what the swell can bare of her is painted a second time through the closed ceiling: THE SECOND PAINTING; she is built about her
  // own middle and lies with it 10 m behind the north face: the world's SHIP.z)
  const over = new THREE.Mesh(overGeometry(hull.geometry, sea.bare, (z) => z - HALF - 10), sea.solid({ albedo: SHIP_ALBEDO, over: true })); over.frustumCulled = false; over.renderOrder = 4.5; over.name = 'steamer-over';
  const group = new THREE.Group(); group.add(hull, screw, over);
  return { group, screw };
}

// ---- a bather treading water at (x, z): head and shoulders above the level, the legs working under it ----
export function addBather(g, x, z, ry, suit, skin = C('#D9A07A', 0.85)) {
  g.at(x, 0, z, ry).move(x, z, 4, 0);
  g.ball(0, 0.28, 0, 0.13, 0.15, 0.13, skin, 6, 4);
  g.ball(0, -0.32, 0, 0.21, 0.42, 0.15, suit, 6, 4);
  for (const s of [-1, 1]) {
    g.bar([0, -0.05, s * 0.2], [0.25, -0.12, s * 0.62], 0.055, 0.045, skin, 5);                       // arms sculling
    const w = (y) => s * Math.min(1, Math.max(0, (-0.65 - y) / 0.9));
    g.move(x, z, 4, 0, (px, py) => w(py));
    g.bar([0, -0.65, s * 0.1], [0.05, -1.1, s * 0.12], 0.085, 0.07, skin, 5);
    g.bar([0.05, -1.1, s * 0.12], [0, -1.55, s * 0.12], 0.07, 0.05, skin, 5);
    g.move(x, z, 4, 0);
  }
  g.at().move();
  return g;
}
// the lion's mane at (x, z), its bell's rim y under the level at rest: a shallow bell of eight lobes, amber at the crown and pale
// at the rim; under it the dark hollow and ten frilled arms; from under the rim eight bunches of eight hairs, half to all but the
// whole of JELLY.mane long (the longest 10.4 m). Its colours are bright ones: the south water takes a thing's red sooner than its
// green. Nothing is dealt
export function addJelly(g, x, y, z) {
  const R = JELLY.bell, H = JELLY.high, N = 32, TAU = 6.2832, hash = (n) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;
  const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const crown = [1.15, 0.26, 0.07], rim = [1.6, 0.8, 0.36], hollow = [0.6, 0.11, 0.05], arm = [1.25, 0.2, 0.06], armPale = [1.55, 0.55, 0.2], hair = [1.3, 0.52, 0.17], hairTip = [0.95, 0.27, 0.09];
  const hang = (px, py) => Math.min(py, 0);
  g.at(x, y, z).move(x, z, 10, 0, hang);
  // the bell, from its rim up to its crown: its lobes die away upward; darker rays run up it between the lobes
  const B = 6, lobe = (th, k) => 1 + 0.08 * Math.cos(8 * th) * k * k * k, ring = (r, yy, k) => { const o = []; for (let j = 0; j < N; j++) { const th = j / N * TAU; o.push([Math.cos(th) * r * lobe(th, k), yy, Math.sin(th) * r * lobe(th, k)]); } return o; };
  const dome = []; for (let i = 0; i <= B; i++) { const a = (1 - i / B) * 1.5708; dome.push(ring(Math.max(R * Math.sin(a), 0.02), H * Math.cos(a), 1 - i / B)); }
  g.skin(dome, (i, j) => { const c = mix3(rim, crown, Math.min(1, (i + 0.5) / B * 1.25)), ray = j % 4 === 2 ? 0.72 : 1; return [c[0] * ray, c[1] * ray, c[2] * ray]; }, true, false);
  // the hollow under it, from the rim in and up
  const cup = []; for (let i = 0; i <= 3; i++) cup.push(ring(R * (1 - i / 3.2), 0.5 * H * (i / 3), 1 - i / 3));
  g.skin(cup, (i) => mix3(rim, hollow, Math.min(1, (i + 1) / 2.2)), true, true);
  // ten frilled arms hanging from the hollow's middle: ribbons that turn about themselves as they fall
  for (let k = 0; k < 10; k++) {
    const th = k / 10 * TAU + 0.3, r0 = R * (0.14 + 0.26 * (k % 2) + 0.08 * hash(k + 3)), L = 3.4 + 2.2 * hash(k + 11), S = 16;
    g.move(x, z, 10 + 0.39 * hash(k + 60.5), 0, hang);                                 // (the arm's own phase of the ripple, in the kind's fraction)
    const at = (t, sd) => { const yy = 0.3 - t * (L + 0.3), tw = th + 1.57 + 3.3 * t + 0.5 * Math.sin(t * 9 + k), w = (0.34 - 0.24 * t) * (1 + 0.35 * Math.sin(t * 17 + k * 2.1)), r = r0 * (1 - 0.35 * t) + 0.1 * Math.sin(t * 7 + k); return [Math.cos(th) * r + Math.cos(tw) * w * sd, yy, Math.sin(th) * r + Math.sin(tw) * w * sd]; };
    for (let i = 0; i < S; i++) { const t0 = i / S, t1 = (i + 1) / S; g.quad(at(t0, -1), at(t0, 1), at(t1, 1), at(t1, -1), mix3(armPale, arm, Math.min(1, 0.25 + 1.1 * t0) * (0.85 + 0.15 * hash(k * 7 + i)))); }
  }
  // eight bunches of eight hairs from under the rim, between the lobes: each a crossed pair of narrow ribbons, plumb at rest (the law
  // streams them: each hair ripples as one, and the hairs of a bunch nearly together)
  for (let c = 0; c < 8; c++) for (let q = 0; q < 8; q++) {
    const n = c * 8 + q, th = (c + 0.5) / 8 * TAU + (q - 3.5) * 0.075, r = R * (0.6 + 0.32 * hash(n + 0.5)), L = JELLY.mane * (0.5 + 0.5 * hash(n + 40.5) * (1 - Math.abs(q - 3.5) / 9)), S = 12;
    const cx = Math.cos(th) * r, cz = Math.sin(th) * r, a0 = th + hash(n + 80.5) * 1.5, pull = (t) => 1 - 0.45 * t * (2 - t) * (L / JELLY.mane);
    g.move(x, z, 10 + 0.33 * hash(c + 120.5) + 0.05 * hash(n + 140.5), 0, hang);       // (the bunch's phase of the ripple, and a little of the hair's own)
    for (let i = 0; i < S; i++) {
      const t0 = i / S, t1 = (i + 1) / S, y0 = -0.03 - t0 * L, y1 = -0.03 - t1 * L, w0 = 0.04 - 0.026 * t0, w1 = 0.04 - 0.026 * t1, col = mix3(hair, hairTip, t0);
      const k0 = pull(t0), k1 = pull(t1);
      for (const a of [a0, a0 + 1.5708]) { const dx = Math.cos(a), dz = Math.sin(a); g.quad([cx * k0 - dx * w0, y0, cz * k0 - dz * w0], [cx * k0 + dx * w0, y0, cz * k0 + dz * w0], [cx * k1 + dx * w1, y1, cz * k1 + dz * w1], [cx * k1 - dx * w1, y1, cz * k1 - dz * w1], col); }
    }
  }
  g.at().move();
  return g;
}
// the bathing raft at (x, z): planks on four drums, its chain down to a block on the sand
export function addRaft(g, x, z, bedY) {
  const wood = C('#C9A46A', 0.8), drum = C('#C8432B', 0.75);
  g.at(x, 0, z).move(x, z, 1, 1);
  g.box(0, 0.42, 0, 4.2, 0.14, 3.2, wood);
  for (const sx of [-1.5, 1.5]) for (const sz of [-1.1, 1.1]) g.bar([sx - 0.6, 0.05, sz], [sx + 0.6, 0.05, sz], 0.38, 0.38, drum, 7);
  g.bar([1.9, 0.5, 1.4], [1.9, 2.3, 1.4], 0.05, 0.05, wood, 5); g.move(x, z, 3, 0.6);
  g.tri([1.9, 2.3, 1.4], [1.9, 1.75, 1.4], [1.0, 2.0, 1.4], C('#C8432B', 0.8));
  return addChain(g, [x, -0.2, z], [x + 0.6, bedY, z + 0.4], { block: true, sag: 0.3 });
}
// a round buoy at (x, z) on its chain to a sinker on the sand
export function addBuoy(g, x, z, bedY, col = C('#C8432B', 0.85)) {
  g.at(x, 0, z).move(x, z, 1, 1);
  g.turn(0, 0, 0, [[0.05, -0.75], [0.7, -0.35], [0.85, 0.15], [0.55, 0.7], [0.14, 0.95], [0.1, 1.9]], col, 9);
  g.ball(0, 2.05, 0, 0.2, 0.2, 0.2, C('#F4FBF7', 0.85), 6, 4);
  return addChain(g, [x, -0.7, z], [x - 0.8, bedY, z + 0.3], { block: true, sag: 0.6 });
}

// ---- fish: silver, 0.45 m, turning in shoals about fixed centres ----
// shoals: [{ c: [x, y, z], r: [rx, ry, rz] reach of the ball, n, period (s, signed for the sense of turning), rng: the stream that deals this shoal's fish }]
export function buildFish(sea, shoals) {
  const g = new Geo(), silver = C('#C9D6D8', 0.95), dark = C('#5E7A86', 0.9);
  g.tri([0.24, 0, 0], [-0.08, 0.09, 0], [-0.08, -0.09, 0], silver, [0, 0.3, 1], [0, 1, 0.5], [0, -1, 0.5]);
  g.tri([-0.08, 0.09, 0], [0.24, 0, 0], [-0.08, 0, 0.035], dark, [0, 1, 0], [0, 1, 0], [0, 1, 0]);
  g.tri([-0.08, 0.02, 0], [-0.22, 0.09, 0], [-0.22, -0.09, 0], silver, [0, 0, 1], [0, 0, 1], [0, 0, 1]);
  const base = g.geometry(), ig = new THREE.InstancedBufferGeometry();
  ig.setAttribute('position', base.getAttribute('position')); ig.setAttribute('normal', base.getAttribute('normal')); ig.setAttribute('color', base.getAttribute('color'));
  let total = 0; for (const s of shoals) total += s.n;
  const cen = new Float32Array(total * 4), orb = new Float32Array(total * 4), rch = new Float32Array(total * 3);
  let k = 0;
  for (const s of shoals) for (let i = 0, rng = s.rng; i < s.n; i++, k++) {                    // (each shoal brings the stream that deals it: four numbers to a fish) 
    const rr = 0.35 + 0.65 * Math.sqrt(rng());
    cen.set([s.c[0], s.c[1], s.c[2], s.period], k * 4);
    orb.set([rr, rng() * 6.2832, (rng() * 2 - 1) * (1 - 0.5 * rr), rng()], k * 4);
    rch.set(s.r, k * 3);
  }
  ig.setAttribute('aCen', new THREE.InstancedBufferAttribute(cen, 4)); ig.setAttribute('aOrb', new THREE.InstancedBufferAttribute(orb, 4)); ig.setAttribute('aReach', new THREE.InstancedBufferAttribute(rch, 3));
  ig.instanceCount = total;
  const mat = sea.solid({ noLine: true, head: 'attribute vec4 aCen, aOrb; attribute vec3 aReach;', place: /* glsl */`
    float an = aOrb.y + 6.2832 * uT / aCen.w + 0.25 * sin(uT * 0.9 + aOrb.w * 40.);
    float sn = sin(an), cs = cos(an), dirn = sign(aCen.w);
    vec3 off = vec3(cs * aOrb.x * aReach.x, aOrb.z * aReach.y + 0.3 * sin(uT * 0.7 + aOrb.w * 30.), sn * aOrb.x * aReach.z);
    vec3 fw = normalize(vec3(-sn * aReach.x, 0., cs * aReach.z)) * dirn; vec3 sd = vec3(-fw.z, 0., fw.x);
    vec3 lp = position; lp.z += 0.05 * sin(uT * 9. + aOrb.w * 50. + lp.x * 9.) * step(lp.x, 0.);
    wp = aCen.xyz + off + fw * lp.x + vec3(0., lp.y, 0.) + sd * lp.z;
    wn = normalize(fw * normal.x + vec3(0., normal.y, 0.) + sd * normal.z + vec3(0., 1e-4, 0.));
    float flash = smoothstep(0.2, 0.9, sin(an * 2. + aOrb.w * 2.5 + uT * 0.6));
    col = mix(color * 0.32, color * 1.7, flash);` });
  const mesh = new THREE.Mesh(ig, mat); mesh.frustumCulled = false; mesh.name = 'fish';
  return mesh;
}

// ---- weed: one plant rooted at (x, bedY, z) in water h metres deep to its crown, leaning west with the stream ----
// Three kinds that differ in outline: 0 RIBBONS (a few long straps that stream up from one root), 1 a tall bare STIPE with a
// float and a crown of drooping blades at its top, 2 low bushy WRACK on a stone. Olive, amber and brown, dark at the root and
// paler toward the light. No plant reaches more than 2.27 m sideways of its root as it is built (ribbons 1.30; a stipe's
// winding 0.31 and its crown's blades 1.86 beyond that, 2.17 together; wrack 1.58); the sway law adds 0.51 at the most.
// (kelpDealt: the plant this world grew before took 122 numbers from the visit's main stream; they are still taken, so that
// every thing dealt after the weed stands where it stood. The plants themselves are dealt by a stream of their own.)
export function kelpDealt(rng) { for (let i = 0; i < 122; i++) rng(); }
const KELP_TONES = [['#34400F', '#8C9A2C'], ['#5C3C0E', '#C8922C'], ['#2E210C', '#80602A']].map(([a, b]) => [C(a, 0.95), C(b, 1.0)]);
const KELP_STONE = ['#6E6A5E', '#5A574E', '#7C7566'].map((h) => C(h, 0.85)), KELP_STEM = C('#3A2C12', 0.95);
export function addKelp(g, x, z, bedY, h, rng, kind = 0) {
  const pickTone = rng(), tone = KELP_TONES[kind === 0 ? (pickTone < 0.7 ? 1 : 0) : kind === 1 ? (pickTone < 0.6 ? 0 : 2) : (pickTone < 0.6 ? 2 : 0)], lo = tone[0], hi = tone[1];
  const mix = (f) => [lo[0] + (hi[0] - lo[0]) * f, lo[1] + (hi[1] - lo[1]) * f, lo[2] + (hi[2] - lo[2]) * f];
  const ry = rng() * 6.28;
  if (kind === 0) {
    g.at(x, bedY, z, ry).move(x, z, 2, 0, (px, py) => py);
    const n = 3 + Math.floor(rng() * 3), seg = 8;
    for (let k = 0; k < n; k++) {
      const a = k * 6.2832 / n + rng.range(-0.4, 0.4), L = h * rng.range(0.5, 1.0), wd = rng.range(0.16, 0.27), out = rng.range(0.3, 0.85), tw = rng.range(-1.6, 1.6), ph = rng() * 6.28, ca = Math.cos(a), sa = Math.sin(a);
      let pl = null, pr = null;
      for (let i = 0; i <= seg; i++) {
        const f = i / seg, lat = out * Math.sin(f * 1.5708) + 0.14 * Math.sin(f * 9 + ph) * f, y = L * f, hw = wd * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, 0.06 + f * 0.94))), 0.55) * (i % 2 ? 1.12 : 0.9) + 0.012;
        const wa = a + 1.5708 + tw * f, cx = ca * lat, cz = sa * lat, l = [cx - Math.cos(wa) * hw, y, cz - Math.sin(wa) * hw], r = [cx + Math.cos(wa) * hw, y, cz + Math.sin(wa) * hw];
        if (i) g.quad(pl, pr, r, l, mix(Math.min(1, 0.15 + 0.85 * (i - 0.5) / seg)));
        pl = l; pr = r;
      }
    }
  } else if (kind === 1) {
    const hk = h * rng.range(0.55, 1.0), tw = rng() * 6.28, wind = rng.range(0.25, 0.6), r0 = rng.range(0.07, 0.1), seg = 4;
    const axis = (y) => [0.11 * (Math.sin(y * wind + tw) - Math.sin(tw)), y, 0.11 * (Math.cos(y * wind * 0.8 + tw) - Math.cos(tw))];
    g.at(x, bedY, z, ry).move(x, z, 2, 0, (px, py) => py);
    for (let i = 0; i < seg; i++) g.bar(axis(hk * i / seg), axis(hk * (i + 1) / seg), r0 * (1 - 0.1 * i), r0 * (1 - 0.1 * (i + 1)), KELP_STEM, 3);
    const top = axis(hk);
    g.ball(top[0], top[1], top[2], 0.17, 0.2, 0.17, mix(0.35), 4, 2);
    const nb = 6 + Math.floor(rng() * 3);
    for (let k = 0; k < nb; k++) {
      const a = k * 6.2832 / nb + rng.range(-0.3, 0.3), len = rng.range(1.2, 1.85), wd = rng.range(0.13, 0.2), rise = rng.range(0.1, 0.43), dx = Math.cos(a), dz = Math.sin(a), sx = -dz * wd, sz = dx * wd, col = mix(rng.range(0.45, 1));
      const m = [top[0] + dx * len * 0.5, top[1] + rise * len, top[2] + dz * len * 0.5], e = [top[0] + dx * len, top[1] + rise * len * 0.4 - 0.3 * len, top[2] + dz * len];
      g.tri(top, [m[0] + sx, m[1], m[2] + sz], [m[0] - sx, m[1], m[2] - sz], col);
      g.quad([m[0] - sx, m[1], m[2] - sz], [m[0] + sx, m[1], m[2] + sz], [e[0] + sx * 0.5, e[1], e[2] + sz * 0.5], [e[0] - sx * 0.5, e[1], e[2] - sz * 0.5], col);
    }
  } else {
    const rs = rng.range(0.45, 0.8), stone = rng.pick(KELP_STONE);
    g.at(x, bedY, z, ry).move();
    g.turn(0, -0.1, 0, [[rs * 1.15, 0], [rs, rs * 0.45], [rs * 0.5, rs * 0.75], [0.02, rs * 0.8]], stone, 5, 1.2, 0.9);
    g.move(x, z, 2, 0, (px, py) => Math.max(0, py - rs * 0.5) * 0.55);
    const nf = 10 + Math.floor(rng() * 5);
    for (let k = 0; k < nf; k++) {
      const a = rng() * 6.28, r1 = rs * rng.range(0.1, 0.8), len = Math.min(rng.range(0.7, 1.5), Math.max(h, 0.7)), lean = rng.range(0.15, 0.6), wd = rng.range(0.1, 0.18), dx = Math.cos(a), dz = Math.sin(a), col = mix(rng.range(0.1, 0.9)), px = -dz, pz = dx;
      const b = [dx * r1, rs * 0.55, dz * r1], m = [b[0] + dx * lean * len * 0.6, b[1] + len * 0.6, b[2] + dz * lean * len * 0.6];
      g.tri([b[0] - px * wd * 0.5, b[1], b[2] - pz * wd * 0.5], [b[0] + px * wd * 0.5, b[1], b[2] + pz * wd * 0.5], m, col);
      for (const sgn of [-1, 1]) g.tri([m[0] - px * wd * 0.6, m[1] - 0.1, m[2] - pz * wd * 0.6], [m[0] + px * wd * 0.6, m[1] - 0.1, m[2] + pz * wd * 0.6], [m[0] + dx * lean * len * 0.4 + sgn * px * 0.22 * len, m[1] + len * 0.4, m[2] + dz * lean * len * 0.4 + sgn * pz * 0.22 * len], col);
    }
  }
  g.at().move();
}

// ---- seals, 2.9 m from nose to the ends of the hind flippers, each swimming its own closed loop: loops = [{ c: [x,y,z], r: [rx, ry, rz], period, phase }] ----
// A seal's own shape: a thick spindle of a body, a round blunt head on a short thick neck, a short fore flipper held back along
// each side, and the two hind flippers held together behind as one narrow upright paddle that sweeps from side to side. No fin
// on the back, nothing level or forked behind. Grey or brown above, pale under, dappled.
export function buildSeals(sea, loops) {
  const g = new Geo(), back = C('#5E6468', 0.9), flank = C('#868A86', 0.9), belly = C('#CFCBBB', 0.92), dark = C('#3A3D40', 0.9);
  const prof = [[1.19, 0.035], [1.15, 0.10], [1.05, 0.165], [0.9, 0.195], [0.74, 0.19], [0.6, 0.215], [0.35, 0.30], [0.0, 0.37], [-0.4, 0.34], [-0.75, 0.24], [-1.0, 0.14], [-1.15, 0.085]];
  const N = 8, rows = prof.slice().reverse().map(([x, r]) => { const o = []; for (let j = 0; j < N; j++) { const a = (j + 0.5) / N * 6.2832; o.push([x, Math.sin(a) * r * 0.92 - 0.04 * (1 - x * x / 1.44), Math.cos(a) * r * 1.06]); } return o; });
  g.skin(rows, (i, j) => { const up = Math.sin((j + 1) / N * 6.2832); return up > 0.5 ? back : up < -0.5 ? belly : flank; }, true, false);
  // the hind flippers, sole to sole: one narrow paddle standing upright behind the ankles, round ended
  const pad = [[-1.12, 0.075, 0.07], [-1.3, 0.13, 0.05], [-1.48, 0.18, 0.04], [-1.62, 0.14, 0.03], [-1.72, 0.03, 0.012]];
  g.skin(pad.map(([x, h, t]) => [[x, h, 0], [x, 0, t], [x, -h, 0], [x, 0, -t]]), dark, true, false);
  // the fore flippers: short, laid back along the sides
  for (const s of [-1, 1]) g.quad([0.5, -0.1, s * 0.27], [0.3, -0.21, s * 0.3], [0.0, -0.3, s * 0.37], [0.12, -0.17, s * 0.38], dark);
  const base = g.geometry(), ig = new THREE.InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'color']) ig.setAttribute(k, base.getAttribute(k));
  const cen = new Float32Array(loops.length * 4), rad = new Float32Array(loops.length * 4);
  loops.forEach((l, i) => { cen.set([l.c[0], l.c[1], l.c[2], l.period], i * 4); rad.set([l.r[0], l.r[1], l.r[2], l.phase], i * 4); });
  ig.setAttribute('aCen', new THREE.InstancedBufferAttribute(cen, 4)); ig.setAttribute('aRad', new THREE.InstancedBufferAttribute(rad, 4));
  ig.instanceCount = loops.length;
  const mat = sea.solid({ noLine: true, head: 'attribute vec4 aCen, aRad;', place: /* glsl */`
    float an = aRad.w + 6.2832 * uT / aCen.w;
    vec3 c = aCen.xyz + vec3(cos(an) * aRad.x, sin(2. * an) * aRad.y, sin(an) * aRad.z);
    vec3 fw = normalize(vec3(-sin(an) * aRad.x, 2. * cos(2. * an) * aRad.y, cos(an) * aRad.z) * sign(aCen.w) + vec3(1e-4, 0., 0.));
    vec3 sd = normalize(vec3(-fw.z, 0., fw.x) + vec3(0., 0., 1e-4)); vec3 upv = cross(sd, fw);
    vec3 lp = position; lp.z += 0.11 * sin(uT * 3.1 + aRad.w * 9. + lp.x * 2.) * clamp(0.15 - lp.x * 0.75, 0., 1.4);   // the hind end sweeps from side to side, as a seal swims
    wp = c + fw * lp.x + upv * lp.y + sd * lp.z;
    wn = normalize(fw * normal.x + upv * normal.y + sd * normal.z + vec3(0., 1e-4, 0.));
    col = mix(color, color * vec3(1.12, 0.9, 0.7), step(0.5, fract(aRad.w * 1.7)));`,                                   // some are brown
    albedo: 'alb *= (0.8 + 0.4 * smoothstep(0.4, 0.62, vnoise(Q.xy * 7. + Q.z * 5.))) * (1. + (grain - 0.5) * 0.2 * nearG);' });   // dappled
  const mesh = new THREE.Mesh(ig, mat); mesh.frustumCulled = false; mesh.name = 'seals';
  return mesh;
}

// ---- gulls, each wheeling on a closed curve of its own inside a dealt box: boxes = [{ c, r: [rx, ry, rz], period, phase }] ----
export function buildGulls(sea, loops) {
  const g = new Geo(), white = C('#F4FBF7', 0.9), tip = C('#3A3F44', 1);
  g.tri([0.28, 0, 0], [-0.3, 0.03, 0.07], [-0.3, 0.03, -0.07], white); g.tri([0.28, 0, 0], [-0.3, -0.05, 0], [-0.3, 0.03, 0.07], white); g.tri([0.28, 0, 0], [-0.3, 0.03, -0.07], [-0.3, -0.05, 0], white);
  for (const s of [-1, 1]) { g.quad([0.12, 0.02, s * 0.05], [-0.12, 0.02, s * 0.05], [-0.16, 0.02, s * 0.4], [0.1, 0.02, s * 0.4], white); g.tri([0.1, 0.02, s * 0.4], [-0.16, 0.02, s * 0.4], [-0.1, 0.02, s * 0.72], tip); }
  const base = g.geometry(), ig = new THREE.InstancedBufferGeometry();
  for (const k of ['position', 'normal', 'color']) ig.setAttribute(k, base.getAttribute(k));
  const cen = new Float32Array(loops.length * 4), rad = new Float32Array(loops.length * 4);
  loops.forEach((l, i) => { cen.set([l.c[0], l.c[1], l.c[2], l.period], i * 4); rad.set([l.r[0], l.r[1], l.r[2], l.phase], i * 4); });
  ig.setAttribute('aCen', new THREE.InstancedBufferAttribute(cen, 4)); ig.setAttribute('aRad', new THREE.InstancedBufferAttribute(rad, 4));
  ig.instanceCount = loops.length;
  const mat = sea.solid({ noLine: true, head: 'attribute vec4 aCen, aRad;', place: /* glsl */`
    float an = aRad.w + 6.2832 * uT / aCen.w;
    vec3 c = aCen.xyz + vec3(cos(an) * aRad.x, sin(an * 2. + aRad.w) * aRad.y, sin(an) * aRad.z);
    vec3 fw = normalize(vec3(-sin(an) * aRad.x, 0., cos(an) * aRad.z) * sign(aCen.w) + vec3(1e-4, 0., 0.));
    vec3 sd = vec3(-fw.z, 0., fw.x);
    vec3 lp = position * 1.5; float reach = abs(lp.z);
    lp.y += reach * 0.55 * sin(uT * 5.5 + aRad.w * 7.) * step(0.5, fract(uT * 0.11 + aRad.w)) + reach * 0.12;
    wp = c + fw * lp.x + vec3(0., lp.y, 0.) + sd * lp.z;
    wn = vec3(0., 1., 0.);` });
  const mesh = new THREE.Mesh(ig, mat); mesh.frustumCulled = false; mesh.name = 'gulls';
  return mesh;
}

// ---- the small things, one cloud of points: motes on the stream, the slop's showers, the screw's bubbles, funnel smoke ----
// ship = Vector4 (the steamer's station x, its swing in m, the swing's period in s, her z)
export function buildSpecks(ctx, sea, o) {
  const rng = o.rng, mote = o.motes, A = [], B = [];
  const nMote = Math.round(4200 * o.detail);                 // (the motes' count follows the quality tier: o.motes, a stream of their own, deals them)
  for (let i = 0; i < nMote; i++) { A.push(mote() * 1000, 0.04 + 0.92 * mote(), (mote() < 0.5 ? -1 : 1) * (HALF + 0.3 + 11.7 * mote() * mote()), mote()); B.push(0.6 + mote(), 0, 0, 0); }
  // the slop's spray: ten drops to every 4 m of both lips (each falls from a new place within its 4 m every time)
  for (let c = 0; c < 250; c++) for (const s of [-1, 1]) for (let j = 0; j < 10; j++) { A.push(c * 4 + 2 + (rng() - 0.5) * 1.6, s, rng(), (j + rng()) / 10); B.push(0.7 + 0.6 * rng(), 0, 0, 1); }
  // the rope of bubbles from the screw, and other risers: o.risers = [[x, y, z, height], ...] fixed places where bubbles rise
  for (let i = 0; i < 420; i++) { A.push(rng(), rng() * 6.2832, 0.15 + 1.25 * rng(), rng()); B.push(0.6 + rng(), 0, 0, 2); }
  for (const r of o.risers || []) for (let i = 0; i < 26; i++) { A.push(r[0], r[1], r[2], rng()); B.push((0.6 + rng()) * (r[4] || 1), r[3], rng() * 6.28, 4); }
  for (let i = 0; i < 46; i++) { A.push(i / 46, rng(), rng(), rng()); B.push(0.7 + 0.6 * rng(), 0, 0, 3); }
  const g = new THREE.BufferGeometry(), n = A.length / 4;
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  g.setAttribute('aA', new THREE.BufferAttribute(new Float32Array(A), 4)); g.setAttribute('aB', new THREE.BufferAttribute(new Float32Array(B), 4));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(500, 0, 0), 1200);
  const uniforms = Object.assign({}, sea.uniforms, { uPx: { value: 450 }, uShip: { value: o.ship }, uShipT: { value: o.shipT || 0 } });
  const mat = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false,
    vertexShader: SEA_GLSL + /* glsl */`
      attribute vec4 aA, aB; uniform float uPx; uniform vec4 uShip; uniform float uShipT; varying vec4 vCol;
      float shipX(float t){ return uShip.x + uShip.y * sin(6.2832 * (t + uShipT) / uShip.z); }
      void main(){
        vec3 p; float size = 0.06; vec4 col = vec4(1.);
        float kind = aB.w;
        if (kind < 0.5) {                                   // a mote, drifting west with all the water
          float x = mod(aA.x - 1.2 * uT, 1000.);
          p = vec3(x, -aA.y * max(bedLin(x) - 0.6, 0.) - 0.15, aA.z);
          p.y += 0.15 * sin(uT * 0.5 + aA.w * 30.);
          vec3 T = exp(-waterLen(p, cameraPosition) * uK * 1.4);
          float edge = smoothstep(0., 12., x) * (1. - smoothstep(988., 1000., x));
          col = vec4(vec3(0.85, 1., 0.95) * (0.6 + 1.1 * step(0., p.z)), 0.95 * T.g * edge); size = 0.065 * aB.x;
        } else if (kind < 1.5) {                            // a drop of slop thrown off a lip into the slot's air: fine spray with a short fall, each time from a new place of the lip
          float cyc = uT / 1.3 + aA.w + aA.z, tau = fract(cyc) * 1.3, turn = floor(cyc);
          float jx = h21(vec2(aA.w * 91.7 + 0.37, turn * 0.173 + aA.z));
          vec2 foot = vec2(aA.x + (jx - 0.5) * 4.2, aA.y * HALF);
          float e = eta(foot); float SL = uSS * (1. + uLip);
          float str = smoothstep(0.5 * SL, 0.85 * SL, e) * slopGust(foot.x, aA.y);
          float thrown = 0.12 + (0.25 + 0.5 * aA.z) * tau;
          p = vec3(foot.x - 0.5 * tau * (aB.x - 1.), e - 0.1 - 0.5 * tau - 4.9 * tau * tau, aA.y * (HALF - thrown));
          float live = step(2., bedLin(aA.x)) * step(0.2 - bedLin(foot.x), p.y);
          float spent = 1. - tau / 1.3;
          col = vec4(vec3(1.05, 1.12, 1.1), 0.85 * str * live * spent * spent); size = 0.06 * aB.x * (1. + 0.6 * tau);
        } else if (kind < 2.5) {                            // a bubble in the screw's wake, left astern on the stream
          float age = fract(uT / 9. + aA.x) * 9.;
          float born = uT - age;
          float sp = aA.z * (0.4 + 0.25 * age);
          p = vec3(shipX(born) - 19.6 - (1.2 + 2.2 * exp(-age * 0.6)) * age, -3.1 + sin(aA.y + born * 8.8) * sp + 0.22 * age, uShip.w + cos(aA.y + born * 8.8) * sp);
          p.y = min(p.y, -0.15);
          vec3 T = exp(-waterLen(p, cameraPosition) * uK);
          col = vec4(vec3(0.95, 1.05, 1.0) * (0.6 + 0.7 * T.g), 0.85 * (1. - age / 9.)); size = 0.17 * aB.x;
        } else if (kind < 3.5) {                            // funnel smoke: thin, lying to the north-east
          float age = fract(uT / 12. + aA.x) * 12.;
          float born = uT - age;
          p = vec3(shipX(born) - 1.5 + 2.6 * age, 11.8 + 1.1 * sqrt(age) + (aA.y - 0.5) * 0.25 * age, uShip.w - 1.5 * age + (aA.z - 0.5) * 0.3 * age);
          col = vec4(vec3(0.62, 0.62, 0.64), 0.22 * (1. - age / 12.) * smoothstep(0., 0.6, age)); size = (0.9 + 0.55 * age) * aB.x;
        } else {                                            // bubbles rising from a fixed place under water
          float age = fract(uT / 7. + aA.w) * 7.;
          p = vec3(aA.x + 0.25 * sin(aB.z + age * 2.), aA.y + aB.y * age / 7., aA.z + 0.25 * cos(aB.z + age * 1.7));
          vec3 T = exp(-waterLen(p, cameraPosition) * uK);
          col = vec4(vec3(0.95, 1.05, 1.0) * (0.5 + 0.7 * T.g), 0.75); size = 0.07 * aB.x * (1. + age * 0.15);
        }
        vec4 mv = viewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mv;
        // a speck too far off to be seen at its own size thins away with it, so a far reach of them never packs into a veil
        float px = size * projectionMatrix[1][1] * uPx * 0.5 / max(-mv.z, 0.3);
        float thin = clamp(px / 1.5, 0., 1.);
        vCol = vec4(col.rgb, col.a * thin * thin);
        gl_PointSize = clamp(px, 1.5, 90.);
      }`,
    fragmentShader: /* glsl */`
      varying vec4 vCol;
      void main(){ vec2 d = gl_PointCoord - 0.5; float a = 1. - smoothstep(0.2, 0.5, length(d)); gl_FragColor = vec4(vCol.rgb, vCol.a * a); }` });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 6; pts.name = 'specks';
  return { object: pts, uniforms };
}

// ---- a drift net hung in the water at z, from x0 to x1, its head rope sagging in swags between floats ----
// One film, slack: it bellies in folds that grow toward its foot and stir on the stream. The mesh of the net is drawn by its own
// place, fine, and thins to its mean tone with distance; the head rope and the leaded foot rope are drawn stouter.
export function buildNet(sea, x0, x1, z, depth, swag) {
  const g = new THREE.BufferGeometry(), n = 48, rows = 10, pos = [], uv = [], idx = [];
  for (let j = 0; j <= rows; j++) for (let i = 0; i <= n; i++) {
    const x = x0 + (x1 - x0) * i / n, v = j / rows, top = -0.15 - 0.9 * Math.abs(Math.sin((x - x0) / swag * Math.PI));
    const foot = top - depth + 0.7 * Math.abs(Math.sin((x - x0) / swag * Math.PI * 1.5 + 0.8));
    pos.push(x, top + (foot - top) * v, z); uv.push((x - x0), v);
  }
  for (let j = 0; j < rows; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i, b = a + 1, c = a + n + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3)); g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, -depth / 2, z), (x1 - x0));
  const mat = new THREE.ShaderMaterial({ uniforms: sea.uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: SEA_GLSL + /* glsl */`varying vec3 vP; varying vec2 vUv; varying float vFold;
      void main(){ vec3 p = position; float v = uv.y;
        float fold = sin(p.x * 0.62 + 2.4 * v + 0.35 * sin(uT * 0.43 + p.x * 0.2)) + 0.45 * sin(p.x * 1.7 - 1.1 * v + uT * 0.31);
        p.z -= (0.2 + 0.8 * v) * 0.8 * fold + 1.2 * v;               // its folds, and its foot trailing away from the face
        p.x -= 0.5 * v * (1. - v) * 4. * (0.6 + 0.15 * sin(uT * 0.37 + p.x * 0.4));   // its middle bellies down the stream
        vP = p; vUv = uv; vFold = fold; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.); }`,
    fragmentShader: SEA_GLSL + /* glsl */`
      varying vec3 vP; varying vec2 vUv; varying float vFold;
      void main(){
        vec2 m = vec2(vUv.x, vUv.y * ${depth.toFixed(1)});
        vec2 q = vec2(m.x + m.y, m.x - m.y) * 2.6;
        vec2 fw = fwidth(q);
        vec2 f = abs(fract(q) - 0.5); vec2 w = fw * 1.1 + 0.05;
        float line = max(1. - smoothstep(0., w.x, f.x), 1. - smoothstep(0., w.y, f.y));
        float far = clamp(length(fw) * 1.5, 0., 1.);
        float ropes = max(1. - smoothstep(0.004, 0.012, vUv.y), 1. - smoothstep(0.004, 0.012, 1. - vUv.y));
        float leads = (1. - smoothstep(0.012, 0.03, 1. - vUv.y)) * step(0.72, fract(m.x * 1.1));
        float a = max(mix(line * 0.75, 0.16, far), max(ropes, leads) * 0.95);
        // twine: tarred brown, paler where a fold turns to the light
        vec3 twine = mix(vec3(0.13, 0.10, 0.06), vec3(0.62, 0.50, 0.30), clamp(0.5 + 0.34 * vFold, 0., 1.));
        twine = mix(twine, vec3(0.62, 0.55, 0.40), ropes); twine = mix(twine, vec3(0.30, 0.31, 0.33), leads);
        vec3 c = seaShade(twine, vP, vec3(0., 0.3, 0.95), cameraPosition);
        gl_FragColor = vec4(c, a);
      }` });
  const m = new THREE.Mesh(g, mat); m.renderOrder = 3; m.name = 'net'; m.frustumCulled = false;
  return m;
}
