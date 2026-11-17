// AFTER THE SIXTH SUN: the land. One analytic height function that exists twice (JavaScript and GLSL, the same
// arithmetic), the field layout as small tables both sides read, the ground mesh and its shader (fields, drilled rows,
// gust sheen, roads, verges, torch pools, lit by the four lights' values) and the shadow decals: one strip per caster
// per sun, multiplied over the ground as 1 minus that sun's share of the light, so each sun's shadow has its own tint.
import * as THREE from 'three';

const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const mix = (a, b, t) => a + (b - a) * t;

export const LAKE_Y = 0, RIVER_Y = -1.1, CREST_Z = -345, KNOLL = [66, -345];
export const FARM = [140, 290];      // the stone farm and its windmill, east of the avenue's south end
// the road: the avenue's line from the south, over the bridge, then three zigzags up the ridge east of the flight path
// how many pools of lamplight the ground can take: every lamp on the road has one (the last is the world's: the firelight in the observatory's door)
export const NPOOL = 96;
// (cost only, C1) THE POOLS' TWO BOXES. Each frame, from the lamps' own places and nothing else: the box on the ground that holds every lit pool
// with its reach on the road south of the bridge's far end (ROAD[3]), and the box that holds every lit pool beyond it (the hill, the terrace, the
// door). A point outside both is out of every pool's reach, so the shaders skip the sum there and no picture changes. pools: x, z, strength,
// 1 / reach squared; boxes: two Vector4 (least x, least z, greatest x, greatest z), empty when no pool on that side is lit.
export function poolBoxes(pools, boxes) {
  for (const b of boxes) b.set(1e9, 1e9, -1e9, -1e9);
  for (const q of pools) { if (!(q.z > 0) || !(q.w > 0)) continue;
    const r = 1 / Math.sqrt(q.w), b = boxes[q.y > ROAD[3][1] ? 0 : 1];
    b.x = Math.min(b.x, q.x - r); b.y = Math.min(b.y, q.y - r); b.z = Math.max(b.z, q.x + r); b.w = Math.max(b.w, q.y + r); }
}
// the test in a shader's words, for a ground point v (a vec2 of x and z): is it inside either box
export const IN_POOL_BOX = (v) => `(all(greaterThan(${v}, uPoolBox[0].xy)) && all(lessThan(${v}, uPoolBox[0].zw))) || (all(greaterThan(${v}, uPoolBox[1].xy)) && all(lessThan(${v}, uPoolBox[1].zw)))`;
export const ROAD = [[0, 900], [0, 250], [0, 50], [0, -100], [14, -131], [80, -164], [150, -200], [100, -234], [50, -262], [84, -290], [112, -312], [88, -327], [72, -331]];
const NSTRIP = 40, STRIP = 66;

// ---------------------------------------------------------------- height (JavaScript)
const farShoreZ = (x) => -2300 + 420 * Math.exp(-((x - 1250) / 700) * ((x - 1250) / 700));
export function landH(x, z) {
  let h = 0.9 * Math.sin(x * 0.011 + 1.3) * Math.sin(z * 0.009 + 0.4) + 0.5 * Math.sin(x * 0.031 + z * 0.023);
  const rz = z + 35 - 7 * Math.sin(x * 0.0075 + 0.6);
  h = mix(h, -3.4, 1 - sstep(19, 31, Math.abs(rz)));
  const hc = 70 + 11 * (1 - sstep(-40, 22, x)) + 5 * Math.sin(x * 0.011 + 2.0) * (1 - sstep(-220, -70, x));
  const east = (1 - sstep(125, 290, x)) * sstep(-440, -290, x);
  const t = z > CREST_Z ? sat((z - CREST_Z) / 225) : sat((CREST_Z - z) / 150);
  const prof = 0.5 + 0.5 * Math.cos(Math.PI * t);
  let ridge = hc * east * prof;
  ridge += 2.2 * Math.sin(x * 0.043 + z * 0.021) * Math.sin(z * 0.052 - x * 0.012) * prof * (1 - prof) * 4 * east;
  const kd = Math.hypot(x - KNOLL[0], z - KNOLL[1]);
  ridge += 4 * (1 - sstep(16, 62, kd));
  h += ridge;
  const zf = farShoreZ(x);
  const lake = (1 - sstep(-535, -472, z)) * sstep(zf - 35, zf + 35, z);
  h = mix(h, -5, lake);
  const cd = Math.hypot(x - 1250, z + 2100);
  h += 12 * (1 - sstep(120, 520, cd)) * (1 - lake);
  // a range of low hills behind the far shore: the lake ends against a skyline, not against a ruled line
  h += sstep(40, 620, zf - z) * sstep(380, 760, cd) * (62 + 46 * Math.sin(x * 0.0037 + 1.1) * Math.sin(x * 0.0013 + 0.4) + 24 * Math.sin(x * 0.0091 + 2.3) + 14 * Math.sin(x * 0.021 + z * 0.004));
  const far = sstep(2600, 5600, Math.hypot(x, z + 300)) * (1 - lake);      // low hills round the whole plain, far off
  h += far * (70 + 55 * Math.sin(x * 0.0011 + 1.0) * Math.sin(z * 0.0013 + 2.0) + 35 * Math.sin(x * 0.0023 + z * 0.0017));
  return h;
}
export const LAND_GLSL = /* glsl */`
float landH(vec2 p){
  float x = p.x, z = p.y;
  float h = 0.9*sin(x*0.011 + 1.3)*sin(z*0.009 + 0.4) + 0.5*sin(x*0.031 + z*0.023);
  float rz = z + 35.0 - 7.0*sin(x*0.0075 + 0.6);
  h = mix(h, -3.4, 1.0 - smoothstep(19.0, 31.0, abs(rz)));
  float hc = 70.0 + 11.0*(1.0 - smoothstep(-40.0, 22.0, x)) + 5.0*sin(x*0.011 + 2.0)*(1.0 - smoothstep(-220.0, -70.0, x));
  float east = (1.0 - smoothstep(125.0, 290.0, x))*smoothstep(-440.0, -290.0, x);
  float t = z > -345.0 ? clamp((z + 345.0)/225.0, 0.0, 1.0) : clamp((-345.0 - z)/150.0, 0.0, 1.0);
  float prof = 0.5 + 0.5*cos(3.14159265*t);
  float ridge = hc*east*prof;
  ridge += 2.2*sin(x*0.043 + z*0.021)*sin(z*0.052 - x*0.012)*prof*(1.0 - prof)*4.0*east;
  float kd = length(p - vec2(66.0, -345.0));
  ridge += 4.0*(1.0 - smoothstep(16.0, 62.0, kd));
  h += ridge;
  float fx = (x - 1250.0)/700.0;
  float zf = -2300.0 + 420.0*exp(-fx*fx);
  float lake = (1.0 - smoothstep(-535.0, -472.0, z))*smoothstep(zf - 35.0, zf + 35.0, z);
  h = mix(h, -5.0, lake);
  float cd = length(p - vec2(1250.0, -2100.0));
  h += 12.0*(1.0 - smoothstep(120.0, 520.0, cd))*(1.0 - lake);
  h += smoothstep(40.0, 620.0, zf - z)*smoothstep(380.0, 760.0, cd)*(62.0 + 46.0*sin(x*0.0037 + 1.1)*sin(x*0.0013 + 0.4) + 24.0*sin(x*0.0091 + 2.3) + 14.0*sin(x*0.021 + z*0.004));
  float far = smoothstep(2600.0, 5600.0, length(p + vec2(0.0, 300.0)))*(1.0 - lake);
  h += far*(70.0 + 55.0*sin(x*0.0011 + 1.0)*sin(z*0.0013 + 2.0) + 35.0*sin(x*0.0023 + z*0.0017));
  return h;
}`;

// PLACES ON THE ROUTE, in metres from the entry. Every window in this world (the sky's clock, fades, gaze, pace, birds) is
// given in metres from one of these, or between two of them; each is found from the land, never typed.
//   AH, AE  the avenue's first and last pair of trees; AM half-way between them
//   B1, B2  the river's near and far bank under the bridge
//   FT      the road's first bend at the foot of the ridge, where the climb begins
//   CR      the saddle on the crest, abeam of the dome
//   SH      the lake's shore
export function routePlaces(path, o = {}) {
  const L = path.length, P = new THREE.Vector3();
  const mAtZ = (z) => { let a = 0, b = L; for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if (path.posAtDist(m, P).z > z) a = m; else b = m; } return (a + b) / 2; };
  // the first route metre after m0 where the land under us is below the level y
  const wetFrom = (m0, y) => { for (let m = m0; m < L; m += 0.5) { path.posAtDist(m, P); if (landH(P.x, P.z) < y) return m; } return L; };
  const dryFrom = (m0, y) => { for (let m = m0; m < L; m += 0.5) { path.posAtDist(m, P); if (landH(P.x, P.z) >= y) return m; } return L; };
  const av = o.avenue || [243, 47], AH = mAtZ(av[0]), AE = mAtZ(av[1]);
  const B1 = wetFrom(AE, RIVER_Y + 0.4), B2 = dryFrom(B1 + 1, RIVER_Y + 0.4);
  const FT = mAtZ(ROAD[4][1]), CR = mAtZ(CREST_Z), SH = wetFrom(CR, LAKE_Y + 0.3);
  // (fix round 3) abreast of the road's first hairpin (H1) and its second (H2); and the brow (CV): the first place past the ridge foot where the eye
  // stands above the ridge's top, trees and all, on the city's bearing, so that the far city first comes in sight
  const H1 = mAtZ(ROAD[6][1]), H2 = mAtZ(ROAD[8][1]);
  let CV = CR; for (let m = FT; m < CR; m += 0.5) { path.posAtDist(m, P); if (skylineEl(Math.atan2(CITY[0] - P.x, P.z - CITY[1]) * 180 / Math.PI, P) <= 0) { CV = m; break; } }
  return { L, mAtZ, AH, AM: (AH + AE) / 2, AE, B1, B2, FT, H1, H2, CV, CR, SH };
}
export const CITY = [1250, -2100];      // the far city's middle (the land's rise under it and the glow on the sky use the same place)

// the belt of dark trees on the skyline: how tall they stand at x (0 in the saddle where the road and the flight cross, and on the knoll)
export const beltH = (x) => (15 + 4 * (1 - sstep(-30, 10, x))) * Math.max(1 - sstep(8, 22, x) * (1 - sstep(96, 122, x)), 0) * (1 - sstep(150, 250, x)) * sstep(-420, -330, x);
// the lake's edge due north of the crest at x: the first z, going down the far slope, where the land is under the water
export function lakeShoreZ(x) { for (let z = CREST_Z; z > CREST_Z - 400; z -= 0.5) if (landH(x, z) < LAKE_Y + 0.3) return z; return CREST_Z - 400; }
// the gap in the skyline's trees beside the observatory (the one way over the ridge): its middle, between the last tree of the belt and the terrace
// (the terrace's edge stands 27 m west of the dome's middle)
export const GAP_X = (() => { const e = KNOLL[0] - 27; let w = e; while (w > e - 100 && beltH(w - 1) < 1) w -= 1; return (w + e) / 2; })();
// elevation (degrees) of the land's skyline seen from P toward azimuth az: the ridge with its trees, or the level horizon
export function skylineEl(az, P) {
  const dz = P.z - CREST_Z; if (dz < 30 || Math.abs(az) > 75) return 0;
  const x = P.x + Math.tan(az * Math.PI / 180) * dz, d = dz / Math.cos(az * Math.PI / 180);
  const top = landH(x, CREST_Z) + beltH(x);
  return Math.max(0, Math.atan2(top - P.y, d) * 180 / Math.PI);
}

// the reaping rule (GROUND_FS and reapedAt() share it): across the rows of a wheat field, sin(rc * REAP_K + tint * 40) over REAP_AT is cut
const REAP_K = '0.05', REAP_AT = '0.2';
// ---------------------------------------------------------------- the fields: tables both the shader and the builders read
// Strips run along z. Boundary i stands at xb[i]; strip i lies between xb[i] and xb[i+1]; each strip is cut across every
// len[i] metres from off[i]. kind: 0 ripe wheat, 1 stubble, 2 green fodder, 3 plough, 4 young green corn.
export function makeFields(rng, season) {
  const xb = new Float32Array(NSTRIP + 1), len = new Float32Array(NSTRIP), off = new Float32Array(NSTRIP);
  // the avenue stands in a strip of its own, 32 m wide (boundary 19 on its left, 20 on its right)
  for (let i = 0; i <= NSTRIP; i++) xb[i] = i <= 19 ? (i - 19) * STRIP - 16 + (i < 19 ? (rng() - 0.5) * 34 : 0) : (i - 20) * STRIP + 16 + (i > 20 ? (rng() - 0.5) * 34 : 0);
  for (let i = 0; i < NSTRIP; i++) { len[i] = 150 + 110 * rng(); off[i] = rng() * len[i]; }
  const data = new Uint8Array(64 * 64 * 4);
  const mixes = [[0.58, 0.8, 0.95, 1, 1], [0, 0.05, 0.3, 0.52, 1], [0.12, 0.72, 0.84, 1, 1]][season];      // cumulative shares of the five kinds
  for (let j = 0; j < 64; j++) for (let i = 0; i < 64; i++) {
    const r = rng(); let kind = 0; while (kind < 4 && r > mixes[kind]) kind++;
    const o = (j * 64 + i) * 4; data[o] = kind * 40; data[o + 1] = Math.floor(rng() * 256); data[o + 2] = rng() < 0.22 ? 255 : 0; data[o + 3] = Math.floor(rng() * 256);
  }
  const tex = new THREE.DataTexture(data, 64, 64, THREE.RGBAFormat); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.needsUpdate = true;
  const stripOf = (x) => { let i = Math.floor((x + 33) / STRIP) + 19; i = Math.max(0, Math.min(NSTRIP - 1, i)); if (x < xb[i] && i > 0) i--; else if (x > xb[i + 1] && i < NSTRIP - 1) i++; return i; };
  // field at (x, z): { i, j, kind, tint, cross (rows run across), edge (metres to the nearest boundary) }
  const at = (x, z) => {
    const i = stripOf(x), fz = (z + off[i]) / len[i], j = Math.floor(fz), o = ((((j % 64) + 64) % 64) * 64 + (i % 64)) * 4;
    const ex = Math.min(x - xb[i], xb[i + 1] - x), ez = Math.min(fz - j, 1 - (fz - j)) * len[i];
    return { i, j, kind: Math.round(data[o] / 40), tint: data[o + 1] / 255, cross: data[o + 2] > 127, edge: Math.min(ex, ez), wall: data[o + 3] / 255 };
  };
  // reaping (the shader's rule): is the corn at (x, z) cut? and edgeNear(x, z): the nearest wall of standing corn across the rows from (x, z), as
  // { rc (its place across the rows), side (+1 or -1: the cut side), cross (the rows run along x) }, or null where no ripe wheat stands
  const RK = Number(REAP_K), RA = Number(REAP_AT), E0 = Math.asin(RA);
  // (in the harvest season a field already all stubble counts as cut: its sheaves stand on it too; in the stubble season the older rule of the sheaves has them)
  const reapedAt = (x, z) => { const f = at(x, z); return (f.kind === 1 && season === 0) || (f.kind === 0 && Math.sin((f.cross ? z : x) * RK + f.tint * 40) > RA + 0.025); };
  const edgeNear = (x, z) => { const f = at(x, z); if (f.kind !== 0) return null;
    const rc = f.cross ? z : x, th = rc * RK + f.tint * 40, n = Math.round(th / 6.2832); let best = null;
    for (let k = n - 1; k <= n + 1; k++) for (const [e, side] of [[E0 + 6.2832 * k, 1], [Math.PI - E0 + 6.2832 * k, -1]]) if (!best || Math.abs(e - th) < Math.abs(best.e - th)) best = { e, side };
    return { rc: (best.e - f.tint * 40) / RK, side: best.side, cross: f.cross }; };
  return { xb, len, off, tex, at, stripOf, season, NSTRIP, STRIP, reapedAt, edgeNear };
}

// ---------------------------------------------------------------- shared uniforms of everything that lies on the land
export function landUniforms(fields) {
  return {
    uHemiSky: { value: new THREE.Color(1, 1, 1) }, uHemiGround: { value: new THREE.Color(0.3, 0.3, 0.3) },
    uDirDir: { value: [0, 1, 2].map(() => new THREE.Vector3(0, 1, 0)) }, uDirCol: { value: [0, 1, 2].map(() => new THREE.Color(0, 0, 0)) },
    uFogCol: { value: new THREE.Color(0.8, 0.8, 0.8) }, uFogDen: { value: 0.00035 }, uTime: { value: 0 }, uPx: { value: 0.0025 },
    uWind: { value: new THREE.Vector4(0.8, 0.6, 0.6, 1) }, uSeason: { value: fields.season }, uNight: { value: 0 }, uRim: { value: 0.25 },
    uXB: { value: Array.from(fields.xb) }, uSL: { value: Array.from(fields.len) }, uSO: { value: Array.from(fields.off) }, tField: { value: fields.tex },
    uRoad: { value: ROAD.map((p) => new THREE.Vector2(p[0], p[1])) },
    uTorch: { value: Array.from({ length: NPOOL }, () => new THREE.Vector4(0, 0, 0, 0)) }, uPoolBox: { value: [new THREE.Vector4(1e9, 1e9, -1e9, -1e9), new THREE.Vector4(1e9, 1e9, -1e9, -1e9)] }, uBlaze: { value: new THREE.Vector4(0, 0, 0, 0.002) },
  };
}

const GROUND_VS = /* glsl */`
varying vec3 vW;
void main(){ vW = position; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.0); }`;
const GROUND_FS = /* glsl */`
${LAND_GLSL}
uniform vec3 uHemiSky, uHemiGround, uFogCol;
uniform vec3 uDirDir[3];
uniform vec3 uDirCol[3];
uniform float uFogDen, uTime, uPx, uSeason, uNight, uRim;
uniform vec4 uWind;
uniform float uXB[41];
uniform float uSL[40];
uniform float uSO[40];
uniform sampler2D tField;
uniform vec2 uRoad[13];
uniform vec4 uTorch[${NPOOL}];
uniform vec4 uPoolBox[2];
uniform vec4 uBlaze;         // a big fire: x, z, strength, 1 / reach^2
varying vec3 vW;
float gH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float gN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(gH(i), gH(i + vec2(1.0, 0.0)), f.x), mix(gH(i + vec2(0.0, 1.0)), gH(i + vec2(1.0, 1.0)), f.x), f.y); }
float roadDist(vec2 p){
  float d = 1e5;
  for (int i = 0; i < 12; i++) { vec2 a = uRoad[i], ba = uRoad[i + 1] - a, pa = p - a; float h = clamp(dot(pa, ba)/max(dot(ba, ba), 1e-4), 0.0, 1.0); d = min(d, length(pa - ba*h)); }
  return d;
}
void main(){
  vec2 p = vW.xz;
  vec3 V = vW - cameraPosition; float dist = length(V); V /= max(dist, 1e-3);
  float e = 0.5 + dist*0.004;
  float h0 = landH(p), hx = landH(p + vec2(e, 0.0)), hz = landH(p + vec2(0.0, e));
  vec3 N = normalize(vec3(h0 - hx, e, h0 - hz));
  float fpx = dist*uPx/max(abs(V.y), 0.05);                    // metres of ground one pixel covers
  float n1 = gN(p/37.0), n2 = gN(p/8.3 + 11.0), n3 = gN(p/1.9 + 3.0);

  // ---- which field
  float gi = clamp(floor((p.x + 33.0)/66.0) + 19.0, 0.0, 39.0);
  int i = int(gi);
  float b0 = uXB[i], b1 = uXB[i + 1];
  if (p.x < b0 && i > 0) { i -= 1; b1 = b0; b0 = uXB[i]; } else if (p.x > b1 && i < 39) { i += 1; b0 = b1; b1 = uXB[i + 1]; }
  float L = uSL[i], fz = (p.y + uSO[i])/L, j = floor(fz);
  float edge = min(min(p.x - b0, b1 - p.x), min(fz - j, 1.0 - (fz - j))*L);
  vec4 fd = textureLod(tField, (vec2(float(i), mod(j, 64.0)) + 0.5)/64.0, 0.0);
  float kind = floor(fd.r*255.0/40.0 + 0.5), tint = fd.g;
  vec3 alb = vec3(0.45, 0.3, 0.085); float rowC = 0.12, crop = 1.0, sheenK = 1.0;
  if (kind > 3.5) { alb = vec3(0.19, 0.34, 0.075); rowC = 0.2; sheenK = 0.8; }
  else if (kind > 2.5) { alb = vec3(0.17, 0.105, 0.065); rowC = 0.4; crop = 0.0; sheenK = 0.0; }
  else if (kind > 1.5) { alb = vec3(0.1, 0.175, 0.06); rowC = 0.07; crop = 0.6; sheenK = 0.5; }
  else if (kind > 0.5) { alb = vec3(0.47, 0.4, 0.23); rowC = 0.13; crop = 0.4; sheenK = 0.0; }
  alb *= 0.82 + 0.36*tint;
  float rc = fd.b > 0.5 ? p.y : p.x;
  float fw = fwidth(rc) + 1e-4;                                 // metres across the rows that one pixel covers
  float rk = 6.9813/(0.82 + 0.4*tint);                          // every field is drilled at a spacing of its own
  float rw = rc + 0.15*(n3 - 0.5) + 0.4*(n2 - 0.5);             // and no row is ruled: they wander a little
  float rf = 1.0 - smoothstep(0.1, 0.3, fw*rk/6.2832), rm = 1.0 - smoothstep(0.12, 0.34, fw/7.5), rs = 1.0 - smoothstep(0.12, 0.34, fw/4.4);
  float row = sin(rw*rk), land8 = sin(rc*0.8378 + 2.0*n1);
  alb *= 1.0 + rowC*(row*0.5 - 0.1)*rf + 0.04*land8*rm;
  float rowN = cos(rw*rk)*rowC*1.6*rf;
  // Where the reapers have been the corn is down. They cut along the rows, a swathe at a time, so the standing corn ends in a straight wall: bands
  // across the rows, 126 m from one to the next, about two fifths of each band cut (REAP_K, REAP_AT: the same rule in JavaScript, reapedAt(), puts
  // the stooks on the stubble and the gangs at the wall). The cut part is pale stubble with the straw lying in windrows; the standing part is deep
  // gold, mottled with its ears, and its wall throws a dark line on the stubble.
  float rb = sin(rc*${REAP_K} + tint*40.0), wheat = step(kind, 0.5);
  float reaped = smoothstep(${REAP_AT}, ${REAP_AT} + 0.05, rb)*wheat;
  float wallSh = (smoothstep(${REAP_AT}, ${REAP_AT} + 0.03, rb) - smoothstep(${REAP_AT} + 0.05, ${REAP_AT} + 0.13, rb))*wheat;
  float windrow = smoothstep(0.55, 0.95, sin(rc*1.428 + 1.1*n2 + 6.0*tint))*rs;
  float ears = gN(p*2.3 + 7.0), earK = (1.0 - smoothstep(0.12, 0.5, fpx))*wheat*(1.0 - reaped);
  alb *= 1.0 + 0.3*(ears - 0.5)*earK + 0.16*(n3 - 0.5)*wheat*(1.0 - reaped);
  alb = mix(alb, vec3(0.5, 0.43, 0.25)*(0.85 + 0.3*n3), reaped*0.9);
  alb = mix(alb, vec3(0.66, 0.55, 0.3), reaped*windrow*0.5);
  alb *= 1.0 - 0.42*wallSh;
  sheenK *= 1.0 - 0.9*reaped; crop *= 1.0 - 0.5*reaped; rowN *= 1.0 - 0.6*reaped;
  alb *= 0.84 + 0.2*n1 + 0.14*n2 + 0.1*(n3 - 0.5)*rf;
  alb = mix(alb, alb.grb*vec3(0.9, 1.0, 0.8), 0.18*(n2 - 0.5)*crop);
  // verges along every boundary: rough grass
  float verge = 1.0 - smoothstep(0.8, 2.4 + 0.8*n2, edge);
  vec3 grass = vec3(0.115, 0.17, 0.055)*(0.7 + 0.5*n2 + 0.25*n3);
  alb = mix(alb, grass, verge); crop *= 1.0 - verge; rowN *= 1.0 - verge;

  // ---- meadow by the river, pasture beyond it, the ridge, the shores
  float rz = p.y + 35.0 - 7.0*sin(p.x*0.0075 + 0.6);
  float fieldZone = smoothstep(22.0, 34.0, rz + 6.0*(n1 - 0.5));
  vec3 pasture = mix(vec3(0.12, 0.19, 0.06), vec3(0.22, 0.24, 0.085), n1)*(0.75 + 0.5*n2);
  float ridgeK = 1.0 - smoothstep(-175.0, -112.0, p.y);
  vec3 rough = mix(vec3(0.12, 0.16, 0.06), vec3(0.3, 0.27, 0.13), n1*0.7 + 0.3*n2)*(0.7 + 0.5*n3);
  vec3 rock = vec3(0.24, 0.215, 0.185)*(0.7 + 0.5*n2);
  pasture = mix(pasture, mix(rough, rock, 1.0 - smoothstep(0.72, 0.86, N.y)), ridgeK);
  float nearK = 1.0 - smoothstep(0.25, 0.9, fpx);               // detail that only the near ground shows
  vec2 tw2 = vec2(dot(p, uWind.xy), dot(p, vec2(-uWind.y, uWind.x)));
  float tus = gN(vec2(tw2.x*0.55, tw2.y*1.9)), tus2 = gN(vec2(tw2.x*0.16, tw2.y*0.6) + 9.0);      // tussocks, combed along the wind
  pasture *= 1.0 + (0.5*(tus - 0.5)*nearK + 0.45*(tus2 - 0.5))*(0.4 + 0.6*ridgeK);
  vec2 sc = floor(p/3.3), sf = fract(p/3.3) - 0.5; float sh = gH(sc);
  vec2 sq = sf - (vec2(gH(sc + 3.1), gH(sc + 7.7)) - 0.5)*0.5; sq = vec2(sq.x + 0.35*sq.y, sq.y*(1.2 + 0.8*gH(sc + 5.5)));      // (no two the same shape)
  float stone = step(0.8, sh)*(1.0 - smoothstep(0.05 + 0.1*sh, 0.1 + 0.13*sh, length(sq) + 0.03*gN(p*2.3)))*nearK*ridgeK;
  pasture = mix(pasture, vec3(0.3, 0.29, 0.275)*(0.55 + 0.6*gH(sc + 1.3))*(0.75 + 0.5*smoothstep(-0.1, 0.1, sq.y - sq.x)), stone);
  alb = mix(pasture, alb, fieldZone); crop = mix(0.5, crop, fieldZone); rowN *= fieldZone; sheenK = mix(0.5, sheenK, fieldZone);
  float wet = 1.0 - smoothstep(-1.3, 0.2, h0);
  alb = mix(alb, vec3(0.13, 0.105, 0.075)*(0.7 + 0.6*n3), wet*step(-200.0, p.y));
  float shore = (1.0 - smoothstep(0.3, 1.6, h0))*(1.0 - step(-430.0, p.y));
  alb = mix(alb, mix(vec3(0.1, 0.11, 0.07), vec3(0.4, 0.37, 0.31), smoothstep(-1500.0, -800.0, p.y))*(0.75 + 0.5*n3), shore);
  alb *= 1.0 - 0.45*(1.0 - smoothstep(-2600.0, -2000.0, p.y));      // the far hills are dark heath and wood
  float cd = length(p - vec2(1250.0, -2100.0));
  alb = mix(alb, vec3(0.42, 0.4, 0.36), 1.0 - smoothstep(250.0, 560.0, cd));

  // ---- the road, and the pale floor of the avenue
  float grassK = 1.0;
  if (abs(p.x - 60.0) < 130.0 && p.y > -345.0) {
    float rd = roadDist(p), w = p.y > -76.0 ? 3.5 : 2.5;
    float allee = (1.0 - smoothstep(9.0, 11.5 + 1.5*n2, abs(p.x)))*smoothstep(40.0, 52.0, p.y)*(1.0 - smoothstep(250.0, 264.0, p.y));
    vec3 earth = vec3(0.47, 0.4, 0.29)*(0.78 + 0.3*n2 + 0.2*n3);
    alb = mix(alb, mix(earth, grass*1.2, smoothstep(0.55, 0.8, n2*0.6 + n3*0.4)*0.6), allee*0.9);
    float vg = (1.0 - smoothstep(w + 0.8, w + 3.2, rd))*(1.0 - allee);
    alb = mix(alb, grass*1.1, vg*0.85);
    float rmk = 1.0 - smoothstep(w - 0.7 + 0.5*n3, w + 0.2 + 0.5*n3, rd);
    vec3 road = vec3(0.7, 0.62, 0.48)*(0.8 + 0.25*n2 + 0.2*n3);
    road *= 1.0 - 0.22*(1.0 - smoothstep(0.25, 0.6, abs(abs(rd) - 1.15)))*(1.0 - smoothstep(0.3, 1.2, fpx));      // ruts
    alb = mix(alb, road, rmk);
    grassK = 1.0 - max(allee, rmk);
    float cl = max(max(allee, vg), rmk); crop *= 1.0 - cl; rowN *= 1.0 - cl; sheenK *= 1.0 - cl;
  }

  // ---- gusts: bands of pale sheen travelling over the crop
  float gt = uTime*uWind.w, ph = dot(p, uWind.xy)*0.05 - gt*1.3, cr = dot(p, vec2(-uWind.y, uWind.x))*0.05;
  float gust = 0.5*sin(ph + 1.3*sin(cr*0.7 + gt*0.31)) + 0.28*sin(ph*2.7 + cr*1.9 + 1.3) + 0.07*sin(ph*6.1 - cr*3.3 + gt*0.9)*rm;
  float paws = gN((p - uWind.xy*(gt*7.0))/64.0 + 3.0)*0.65 + gN((p - uWind.xy*(gt*9.0))/23.0)*0.35;      // each gust is a patch that runs with the wind, not a ruled band
  float sheen = smoothstep(0.05, 0.7, gust)*smoothstep(0.38, 0.62, paws)*min(uWind.z, 1.8)*sheenK*1.25;
  // (standing corn MOVES: where a gust runs the ears bow and the field flashes pale, and the trough behind it is dark; stubble and bare earth do not)
  alb = mix(alb, alb*1.5 + vec3(0.08, 0.075, 0.05), 0.6*sheen);
  alb *= 1.0 - 0.24*(1.0 - smoothstep(-0.7, -0.1, gust))*sheenK*(0.35 + 0.65*smoothstep(0.3, 0.6, paws));

  // By starlight the eye sees no colour and little contrast: grass, stubble and corn are dark, close in value (no mottle), the road and bare stone
  // paler; everything about half of what it was before fix round 2 and well under the white dome.
  vec3 albL = alb;      // (second hand mend, N2a) what the ground is under a lamp: its own colour at every hour, whatever the sky does
  { float lum = clamp(dot(alb, vec3(0.3, 0.55, 0.15)), 0.0, 1.0); alb = mix(alb, (0.06 + 0.12*lum)*vec3(0.9, 0.97, 1.14), 0.94*uNight); }
  // ---- light: hemisphere and three directionals, as the trees get them; crops glow when seen against a low sun
  if (fd.b > 0.5) N.z += rowN; else N.x += rowN;
  N.xz += (vec2(tus, tus2) - 0.5)*(0.55*(1.0 - fieldZone) + 0.45*ridgeK)*(0.4 + 0.6*nearK)*(1.0 - 0.8*uNight);      // rough ground has relief (by starlight the eye cannot make it out)
  N = normalize(N);
  vec3 light = mix(uHemiGround, uHemiSky, N.y*0.5 + 0.5), back = vec3(0.0), rim = vec3(0.0);
  float graze = 1.0 - clamp(dot(N, -V), 0.0, 1.0); graze *= graze; graze *= graze;
  vec2 vh = V.xz/max(length(V.xz), 1e-4);
  for (int k = 0; k < 3; k++) {
    vec3 Ld = uDirDir[k];
    light += uDirCol[k]*max(dot(N, Ld), 0.0);
    float tow = max(dot(vh, Ld.xz/max(length(Ld.xz), 1e-4)), 0.0);
    back += uDirCol[k]*(tow*tow*tow*(1.0 - abs(V.y))*smoothstep(-0.02, 0.06, Ld.y));
    rim += uDirCol[k]*(tow*tow*graze*smoothstep(-0.02, 0.06, Ld.y));      // ground seen edge-on against a low sun takes a rim of its light
  }
  vec3 col = alb*light*0.3183 + alb*back*(crop*0.085) + alb*rim*uRim;
  vec3 tl = vec3(0.0);
  // (second hand mend, N2a; the last thing, Q1) EVERY lamp lights the ground round it, and only a little of it: a torch is a small flame that lights
  // the steps round its bearer and no more. A pool reaches 2 m at the most (down to a fifth by 1.5 m) and never half-way to the next lamp, so two
  // pools do not meet (w: 1 / the pool's reach squared, set by whoever places the lamp). The pool is the lamp's own at every hour: light added to
  // the ground's own colour, with no share of the sky's state, the clock or the eye in it (under the suns it is drowned).
  // (cost only, C1) outside the two boxes that hold every lit pool with its reach the sum is nothing, so it is not made there (see poolBoxes)
  if (${IN_POOL_BOX('p')}) {
    for (int k = 0; k < ${NPOOL}; k++) { vec2 dd = p - uTorch[k].xy; float a = max(0.0, 1.0 - dot(dd, dd)*uTorch[k].w); tl += vec3(1.0, 0.5, 0.14)*(uTorch[k].z*a*a); }
  }
  // and it is weak: under a lamp the pale road stays well under the observatory's lit stone, which is the brightest thing on the ground in the dark
  { vec3 fl = albL*tl*0.8; float fm = max(fl.r, max(fl.g, fl.b)); col += fl*(0.1/(0.1 + fm)); }
  { vec2 dd = p - uBlaze.xy; col += alb*vec3(1.0, 0.4, 0.09)*(uBlaze.z*exp(-dot(dd, dd)*uBlaze.w)*1.5); }
  // the cold sheen of starlight on the blades of the nearer grass
  { float bl = gN(vec2(tw2.x*1.3, tw2.y*7.5) + 5.0); col += vec3(0.55, 0.7, 1.0)*(0.016*uNight*smoothstep(0.55, 0.92, bl)*(0.3 + 0.7*graze)*(0.3 + 0.7*nearK)*grassK); }
  float f = 1.0 - exp(-uFogDen*uFogDen*dist*dist);
  gl_FragColor = vec4(mix(col, uFogCol, clamp(f, 0.0, 1.0)), 1.0);
}`;

// lines of a stretched grid: dense between lo and hi, growing by a fifth each step out to `far` on both sides
function gridLines(lo, hi, step, farLo, farHi) {
  const out = []; for (let v = lo; v <= hi + 1e-3; v += step) out.push(v);
  let s = step, v = hi; while (v < farHi) { s *= 1.2; v += s; out.push(Math.min(v, farHi)); }
  s = step; v = lo; while (v > farLo) { s *= 1.2; v -= s; out.unshift(Math.max(v, farLo)); }
  return out;
}
export async function makeGround(U, yieldFn) {
  const xs = gridLines(-140, 140, 5, -7000, 7000), zs = gridLines(-540, 600, 5.2, -7500, 6500), nx = xs.length, nz = zs.length;
  const pos = new Float32Array(nx * nz * 3), idx = new Uint32Array((nx - 1) * (nz - 1) * 6);
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) { const o = (j * nx + i) * 3; pos[o] = xs[i]; pos[o + 1] = landH(xs[i], zs[j]); pos[o + 2] = zs[j]; }
    if (j % 40 === 39) await yieldFn();
  }
  let k = 0;
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const a = j * nx + i, b = a + 1, c = a + nx, d = c + 1; idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d; }
  await yieldFn();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 12000);
  const m = new THREE.ShaderMaterial({ uniforms: U, vertexShader: GROUND_VS, fragmentShader: GROUND_FS, fog: false });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false;
  return { object: mesh, triangles: idx.length / 3 };
}

// ---------------------------------------------------------------- shadow decals
// casters: [{ x, z, hc (height of the crown's middle), r (crown radius), tr (trunk radius), kind (0 tree, 1 solid block: r is its half width, hc its height) }]
const DECAL_VS = /* glsl */`
${LAND_GLSL}
attribute vec4 aBase;       // x, z, crown centre height, crown radius
attribute vec4 aQ;          // sun, trunk radius, kind, seed
uniform vec2 uAway[6];
uniform float uCot[6];
uniform float uStr[6];
uniform vec3 uShare[6];
varying vec2 vAB; varying vec4 vP; varying vec3 vShare; varying vec3 vQ; varying vec2 vHD;
void main(){
  int si = int(aQ.x + 0.5);
  vec3 sh = uShare[si];
  float ac = min(aBase.z*uCot[si], 112.0), st = uStr[si];
  float len = ac + aBase.w*st*1.15 + 2.0, hw = aBase.w*1.25 + 0.7;
  float a = -1.5 + position.x*len;
  vec2 aw = uAway[si];
  vec2 xz = aBase.xy + aw*a + vec2(-aw.y, aw.x)*(position.y*hw);
  float h = landH(xz);
  vec3 wp = vec3(xz.x, h + 0.12, xz.y);
  float dist = distance(wp, cameraPosition);
  wp.y += 0.0012*dist;
  vAB = vec2(a, position.y*hw); vP = vec4(ac, aBase.w, st, aQ.y); vShare = sh; vQ = vec3(aQ.x, aQ.z, aQ.w); vHD = vec2(h, dist);
  gl_Position = projectionMatrix*viewMatrix*vec4(wp, 1.0);
  if (max(sh.r, max(sh.g, sh.b)) < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;
const DECAL_FS = /* glsl */`
uniform float uFogDen, uTime, uHard;
uniform vec4 uFleck;        // the dark body's offset from the sun in the fleck's frame (sun radii), strength, -
varying vec2 vAB; varying vec4 vP; varying vec3 vShare; varying vec3 vQ; varying vec2 vHD;
float dH(vec2 p){ p = fract(p*vec2(0.1031, 0.1030)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y)*p.x); }
float dN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0 - 2.0*f);
  return mix(mix(dH(i), dH(i + vec2(1.0, 0.0)), f.x), mix(dH(i + vec2(0.0, 1.0)), dH(i + vec2(1.0, 1.0)), f.x), f.y); }
void main(){
  float a = vAB.x, b = vAB.y, ac = vP.x, r = max(vP.y, 0.1), st = clamp(vP.z, 1.0, 4.0);
  float soft = (0.1 + 0.004*a)*mix(1.0, 0.4, uHard*step(4.5, vQ.x)), m;
  if (vQ.y > 0.5) {      // a solid block: a bar from its foot to where its top falls
    m = (1.0 - smoothstep(r - 0.3, r + 0.3 + 0.02*a, abs(b)))*smoothstep(-0.6, 0.3, a)*(1.0 - smoothstep(ac - 0.5, ac + 1.0 + 0.03*a, a));
  } else {
    vec2 e = vec2((a - ac)/(r*st), b/r);
    float rr = length(e) + 0.3*(dN(vec2(a/st, b)*0.55 + vQ.z*31.0) - 0.5) + 0.12*(dN(vec2(a/st, b)*1.7 + vQ.z*7.0) - 0.5);
    float crown = 1.0 - smoothstep(1.0 - soft, 1.0 + soft, rr);
    float tw = vP.w*0.7;
    float trunk = (1.0 - smoothstep(tw, tw + 0.22 + 0.012*a, abs(b)))*smoothstep(-0.4, 0.2, a)*(1.0 - smoothstep(ac - 1.0, ac + 0.5, a));
    if (vQ.x > 4.5 && uFleck.z > 0.001) {      // under the red sun the crown's shade is pierced by images of the sun: coins, bitten coins, parings
      vec2 g = vec2((a - ac)/st, b)/1.15 + vQ.z*17.0;
      vec2 ci = floor(g), cf = fract(g) - 0.5;
      float hh = dH(ci);
      vec2 off = (vec2(dH(ci + 3.3), dH(ci + 8.1)) - 0.5)*0.38 + 0.03*vec2(sin(uTime*2.3 + hh*40.0), cos(uTime*1.9 + hh*23.0));
      vec2 q = (cf - off)/(0.22 + 0.12*hh);
      float sun = 1.0 - smoothstep(0.82, 1.06, length(q));
      float body = 1.0 - smoothstep(4.86, 5.1, length(q - uFleck.xy));
      crown *= 1.0 - 0.95*sun*(1.0 - body)*step(0.22, hh)*uFleck.z*(1.0 - smoothstep(0.75, 1.08, rr));
    }
    m = max(crown*0.94, trunk);
  }
  m *= smoothstep(-1.7, -0.9, vHD.x);                           // nothing lies on the river
  m *= exp(-uFogDen*uFogDen*vHD.y*vHD.y);
  gl_FragColor = vec4(1.0 - vShare*m, 1.0);
}`;

export function makeDecals(casters, U) {
  const n = casters.length * 6, base = new Float32Array(n * 4), q = new Float32Array(n * 4);
  casters.forEach((c, k) => { for (let s = 0; s < 6; s++) { const o = (k * 6 + s) * 4; base[o] = c.x; base[o + 1] = c.z; base[o + 2] = c.hc; base[o + 3] = c.r; q[o] = s; q[o + 1] = c.tr ?? 0.5; q[o + 2] = c.kind ?? 0; q[o + 3] = (k * 0.6180339) % 1; } });
  const SEG = 8, pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) { pos.push(i / SEG, -1, 0, i / SEG, 1, 0); }
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(base, 4)); g.setAttribute('aQ', new THREE.InstancedBufferAttribute(q, 4)); g.instanceCount = n;
  const DU = {
    uAway: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector2(0, 1)) }, uCot: { value: [3, 3, 3, 3, 3, 3] }, uStr: { value: [2, 2, 2, 2, 2, 2] },
    uShare: { value: [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector3()) }, uFogDen: U.uFogDen, uTime: U.uTime, uFleck: { value: new THREE.Vector4(3, -3, 0, 0) }, uHard: { value: 0 },
  };
  const m = new THREE.ShaderMaterial({ uniforms: DU, vertexShader: DECAL_VS, fragmentShader: DECAL_FS, transparent: true, depthWrite: false, fog: false, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
  const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.renderOrder = -2;
  return {
    object: mesh, uniforms: DU, count: n, triangles: n * SEG * 2,
    update(st) {
      for (let i = 0; i < 6; i++) {
        DU.uAway.value[i].copy(st.away[i]); DU.uCot.value[i] = st.cot[i]; DU.uShare.value[i].copy(st.share[i]);
        DU.uStr.value[i] = Math.min(4, 1 / Math.sin(Math.max(i === 5 ? st.el5 : st.suns[i].el, 8) * Math.PI / 180));
      }
      // the image of the eclipsed sun inside each fleck: the dark body (5 sun radii) stands (4 + what is left) radii from the sun's centre
      DU.uHard.value = st.hard * (1 - st.night);
      const D = (7.2 + st.thick) / 1.8;
      DU.uFleck.value.set(0.694 * D, -0.72 * D, sstep(12.5, 15.5, st.turn) * sstep(0, 0.02, st.thick), 0);
    },
  };
}
