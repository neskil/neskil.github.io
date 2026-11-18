// THE GROUNDSWELL (groundswell-country): a green hill country that moves like the open sea. Meadow swells
// 80 m tall travel toward +Z at 20 m/s; copses and erratics ride them at their moorings, daisy whitecaps
// form on the crests, a herd of crest-runners gallops to stay on one crest, and the land breaks in a surf
// of turf and petals against the one thing that holds still: the Stillstone (src/parts/groundswell-country.js).
//
// ONE FUNCTION. swell(p0, tw) exists once in JS (makeSwell) and once in GLSL (GLSL_SWELL) with the same
// uniform table: three trochoidal trains (+ an optional solitary "rogue" hump) displaced from REST space.
// Rooted things (ground, grass, flowers, erratics, trees) carry a rest anchor and are displaced in the
// vertex shader; travellers (herd, cranes, camera) know their world xz and invert by fixed-point steps.
// The wave clock tw is a table of rail distance, eased toward it by wall time times the flight's own rate (the rate taken
// as at least 0.4), so the land still travels when the camera is held still and keeps step when the flight is hurried.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeCloudField } from '../kit/sky.js';
import { buildHero } from '../parts/groundswell-country.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const TOR = { x: -1100, z: 1290 };
const RAIL = 1680, STRAIGHT = 190;
const TW_S = [0, 170, 562, 788, 1049, 1361, 1680], TW_T = [0, 5, 12, 20, 25.5, 36, 46];
const BOW = { r: 168, w: 80, h0: 25, h1: 9 };          // the heap of land standing against the tor's upstream side
const RUNUP = 0.12;                                    // extra height of the swell where it runs up the tor's upstream side
const TORK = 0.78, TORK_R = [300, 640];                // the open country's swell is taller than the one that breaks on the tor: heights are scaled by TORK inside TORK_R[0] m of it, by 1 beyond TORK_R[1]
const FAR = { x: -450, z: 900, r0: 1000, r1: 2600, k: 0 };      // k 0: the far swells are no taller than the near ones (the brief's 80-115 m); they stack by tone, a bright rim over a cool face
const CREST0 = 292;                                   // z of crest C0 at tw 0 (it travels +Z at 20 m/s)

// wave clock from rail distance (monotone piecewise-linear table, corners rounded by sampling it smoothed)
function twRaw(s) {
  if (s <= 0) return s / 34;
  for (let i = 1; i < TW_S.length; i++) if (s <= TW_S[i]) return lerp(TW_T[i - 1], TW_T[i], (s - TW_S[i - 1]) / (TW_S[i] - TW_S[i - 1]));
  return 46 + (s - RAIL) / 32;
}
const twAt = (s) => (twRaw(s - 30) + 2 * twRaw(s) + twRaw(s + 30)) / 4;

// ---------------------------------------------------------------- the swell: JS twin
// trains: [{ dx, dz, k, A, om, ph }]; rogue: { A, zc(tw), W, x, S, P } or null (zc: where its crest line stands at clock tw)
function makeSwell(trains, rogue) {
  const o = { x: 0, y: 0, z: 0, nx: 0, ny: 1, nz: 0, J: 1 }, SH = { hs: 1, ys: 1, nf: 1, bow: 0, dbr: 0, ux: 0, uz: 0 };
  const shape = (x0, z0) => {                          // the tor's influence, a function of rest position
    const ex = x0 - TOR.x, ez = z0 - TOR.z, r = Math.hypot(ex, ez);
    const up = smoothstep(-0.2, 0.5, -ez / Math.max(r, 1));
    const near = 1 - smoothstep(180, 300, r), lee = (1 - up) * (1 - smoothstep(180, 620, r));
    const q = Math.max(r - BOW.r, 0) / BOW.w, g = smoothstep(0.5, 0.92, -ez / Math.max(r, 1)) * Math.exp(-q * q);
    SH.hs = smoothstep(200, 330, r); SH.ys = (1 + RUNUP * near * up) * (1 - 0.6 * lee) * lerp(TORK, 1, smoothstep(TORK_R[0], TORK_R[1], r)) * (FAR.k ? 1 + FAR.k * smoothstep(FAR.r0, FAR.r1, Math.hypot(x0 - FAR.x, z0 - FAR.z)) : 1); SH.nf = 0.4 + 0.6 * smoothstep(260, 520, r); SH.bow = g; SH.dbr = -2 * q / BOW.w * g; SH.ux = ex / Math.max(r, 1); SH.uz = ez / Math.max(r, 1);   // while FAR.k is 0 its factor is 1 + 0 * (0 to 1) = 1 exactly (NaN only where the position is NaN, and there r and the product before it are NaN already), so the far country's distance is not worked out
    return SH;
  };
  let rT = NaN, rZ = 0;
  const rz = (tw) => { if (tw !== rT) { rT = tw; rZ = rogue.zc(tw); } return rZ; };
  const rogueY = (x0, z0, tw) => {
    if (!rogue) return 0;
    const q = (z0 - rz(tw)) / rogue.W, l = (x0 - rogue.x) / (x0 < rogue.x ? rogue.S * rogue.P : rogue.S);
    return rogue.A * Math.exp(-q * q - l * l);
  };
  // displaced position of rest point (x0, z0); far = 0..1 fades trains 2 and 3
  const at = (x0, z0, tw, out = o) => {
    const sh = shape(x0, z0); let ox = 0, oz = 0, y = 0, J = 1, sx = 0, sz = 0, c0 = 1;
    for (let i = 0; i < 3; i++) {
      const t = trains[i], th = t.k * (t.dx * x0 + t.dz * z0) - t.om * tw - t.ph, s = Math.sin(th), c = Math.cos(th); if (i === 0) c0 = c;
      const A = i ? t.A * sh.nf : t.A;
      ox -= t.dx * A * s; oz -= t.dz * A * s; y += A * c; J -= t.k * A * c; sx += t.dx * t.k * A * s; sz += t.dz * t.k * A * s;
    }
    let ry = 0;
    if (rogue) { ry = rogueY(x0, z0, tw); const q = (z0 - rz(tw)) / rogue.W; sz += 2 * q / rogue.W * ry; const Sx = x0 < rogue.x ? rogue.S * rogue.P : rogue.S; sx += 2 * (x0 - rogue.x) / (Sx * Sx) * ry; }
    const bh = BOW.h0 - BOW.h1 * c0, gx = sx * sh.ys - sh.dbr * bh * sh.ux, gz = sz * sh.ys - sh.dbr * bh * sh.uz;
    out.x = x0 + ox * sh.hs; out.z = z0 + oz * sh.hs; out.y = y * sh.ys + ry + sh.bow * bh; out.J = J;
    const l = Math.hypot(gx, J, gz) || 1; out.nx = gx / l; out.ny = J / l; out.nz = gz / l;
    return out;
  };
  // at's own sums, term for term and in at's order, for the callers that read less of it (a change to at's loop is a change here too):
  // yAt the height alone, xzAt the displaced xz alone, left in XZ (the fixed-point steps read nothing else); neither works out the normal
  const yAt = (x0, z0, tw) => {
    const sh = shape(x0, z0); let y = 0, c0 = 1;
    for (let i = 0; i < 3; i++) { const t = trains[i], th = t.k * (t.dx * x0 + t.dz * z0) - t.om * tw - t.ph, c = Math.cos(th); if (i === 0) c0 = c; const A = i ? t.A * sh.nf : t.A; y += A * c; }
    let ry = 0;
    if (rogue) ry = rogueY(x0, z0, tw);
    const bh = BOW.h0 - BOW.h1 * c0;
    return y * sh.ys + ry + sh.bow * bh;
  };
  const XZ = new Float64Array(2);
  const xzAt = (x0, z0, tw) => {
    const sh = shape(x0, z0); let ox = 0, oz = 0;
    for (let i = 0; i < 3; i++) { const t = trains[i], th = t.k * (t.dx * x0 + t.dz * z0) - t.om * tw - t.ph, s = Math.sin(th); const A = i ? t.A * sh.nf : t.A; ox -= t.dx * A * s; oz -= t.dz * A * s; }
    XZ[0] = x0 + ox * sh.hs; XZ[1] = z0 + oz * sh.hs;
  };
  // rest point whose displaced xz is the world point (x, z): five fixed-point steps
  const inv = (x, z, tw, out = o) => {
    let x0 = x, z0 = z;
    for (let n = 0; n < 5; n++) { xzAt(x0, z0, tw); x0 += x - XZ[0]; z0 += z - XZ[1]; }
    at(x0, z0, tw, out); out.x0 = x0; out.z0 = z0; return out;
  };
  const height = (x, z, tw) => { let x0 = x, z0 = z; for (let n = 0; n < 5; n++) { xzAt(x0, z0, tw); x0 += x - XZ[0]; z0 += z - XZ[1]; } return yAt(x0, z0, tw); };
  const quick = (x, z, tw) => { let x0 = x, z0 = z; for (let n = 0; n < 2; n++) { xzAt(x0, z0, tw); x0 += x - XZ[0]; z0 += z - XZ[1]; } return yAt(x0, z0, tw); };   // for things in the air: near enough
  return { at, inv, height, quick, yAt, trains, rogue };
}

// ---------------------------------------------------------------- the swell: GLSL twin
// uniforms: uTr[3] = (dx, dz, k, A), uTo[3] = (omega, phase), uTw, uRogue = (A, z0, c, 1/W), uRogue2 = (x, 1/S)
const GLSL_SWELL = /* glsl */`
uniform vec4 uTr[3]; uniform vec2 uTo[3]; uniform float uTw; uniform vec4 uRogue; uniform vec2 uRogue2;
vec4 gsShape(vec2 p0, out vec2 ur, out float nf){
  vec2 e = p0 - vec2(${TOR.x.toFixed(1)}, ${TOR.z.toFixed(1)}); float r = length(e); ur = e / max(r, 1.); nf = 0.4 + 0.6 * smoothstep(260., 520., r);
  float up = smoothstep(-0.2, 0.5, -ur.y);
  float near = 1. - smoothstep(180., 300., r), lee = (1. - up) * (1. - smoothstep(180., 620., r));
  float q = max(r - ${BOW.r.toFixed(1)}, 0.) / ${BOW.w.toFixed(1)}, g = smoothstep(0.5, 0.92, -ur.y) * exp(-min(q * q, 40.));
  return vec4(smoothstep(200., 330., r), (1. + ${RUNUP.toFixed(3)} * near * up) * (1. - 0.6 * lee) * mix(${TORK.toFixed(3)}, 1., smoothstep(${TORK_R[0].toFixed(1)}, ${TORK_R[1].toFixed(1)}, r)) * (1. + ${FAR.k.toFixed(2)} * smoothstep(${FAR.r0.toFixed(1)}, ${FAR.r1.toFixed(1)}, length(p0 - vec2(${FAR.x.toFixed(1)}, ${FAR.z.toFixed(1)})))), g, -2. * q / ${BOW.w.toFixed(1)} * g);
}
// displacement of rest point p0 at clock tw: xyz = offset (add xz to p0), far fades trains 2 and 3
vec3 gsOff(vec2 p0, float tw, float far, out vec3 nrm, out float J){
  vec2 ur; float nf; vec4 sh = gsShape(p0, ur, nf); vec2 o = vec2(0.), sl = vec2(0.); float y = 0., c0 = 1.; J = 1.;
  for (int i = 0; i < 3; i++) {
    vec4 t = uTr[i]; float f = i == 0 ? 1. : far * nf;
    float th = t.z * dot(t.xy, p0) - uTo[i].x * tw - uTo[i].y, s = sin(th), c = cos(th), a = t.w * f; if (i == 0) c0 = c;
    o -= t.xy * a * s; y += a * c; J -= t.z * a * c; sl += t.xy * t.z * a * s;
  }
  float rS = p0.x < uRogue2.x ? uRogue2.y * ${(1 / 3.2).toFixed(4)} : uRogue2.y;
  float q = (p0.y - uRogue.y - uRogue.z * tw) * uRogue.w, l = (p0.x - uRogue2.x) * rS;
  float ry = uRogue.x * exp(-min(q * q + l * l, 40.));
  float bh = ${BOW.h0.toFixed(1)} - ${BOW.h1.toFixed(1)} * c0;
  sl *= sh.y; sl += vec2(2. * l * rS, 2. * q * uRogue.w) * ry; sl -= ur * sh.w * bh;
  nrm = normalize(vec3(sl.x, max(J, 0.05), sl.y));
  return vec3(o.x * sh.x, y * sh.y + ry + sh.z * bh, o.y * sh.x);
}
// rest point of a world xz (three fixed-point steps)
vec2 gsInv(vec2 p, float tw){
  vec2 p0 = p; vec3 n; float J;
  for (int i = 0; i < 3; i++) { vec3 d = gsOff(p0, tw, 1., n, J); p0 += p - (p0 + d.xz); }
  return p0;
}
`;

// shared light, cloud-shadow and haze helpers for every shader in this world
const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFogCol; uniform float uFogDen, uMist, uShHue; uniform sampler2D uCloud; uniform vec4 uCloudX, uShK; uniform vec2 uMistY;
float gsCloud(vec2 p){ return 1. - uCloudX.w * smoothstep(0.3, 0.5, texture2D(uCloud, (p - uCloudX.xy) * uCloudX.z).r); }
// haze (exp2, the scene fog) plus dawn mist that pools low, so it lies in the troughs and travels with them
float gsMistN = 0.8; vec3 gsMistC = vec3(1.);       // the ground sets these: wisps (0..1.6) and the glow toward the sun
vec3 gsFog(vec3 c, float d, float y){
  float f = 1. - exp(-uFogDen * uFogDen * d * d);
  float mh = 1. - smoothstep(uMistY.x, uMistY.y, y); mh *= sqrt(mh);                 // it lies in the bottom of the troughs
  float m = min(uMist * mh * (1. - exp(-d * d / 400000.)) * (0.03 + 0.2 * smoothstep(0.55, 1.6, gsMistN)), 0.2 + 0.2 * clamp(gsMistC.r - 1.1, 0., 0.4));   // brightest toward the sun   // a veil, never a lid: the trough's land, stream and shadows show through it   // strands and holes: the land shows between them
  c = mix(c, uFogCol * gsMistC * mix(vec3(1.1, 1.1, 1.12), vec3(0.94, 1.0, 1.1), smoothstep(0.08, 0.2, m)), m);   // wisps: luminous where thin, cool where it lies deep
  return mix(c, uFogCol, clamp(f, 0., 1.));
}
// sun (shadowed by sh) + sky/ground hemisphere; tr = translucency (leaves and blades glow against the sun)
vec3 gsLit(vec3 alb, vec3 n, float sh, float tr){
  float nl = dot(n, uSunDir);
  float dif = max(nl, 0.) + tr * max(-nl, 0.) * 0.7;
  vec3 hemi = mix(uGndCol, uSkyCol, n.y * 0.5 + 0.5);
  hemi *= mix(vec3(0.6, 0.72, 0.9), vec3(1.), clamp((sh - 1.) / max(uCloudX.w, 0.05) + 1., 0., 1.));   // under a cloud the fill cools and drops too
  float wsk = uShK.w * (1. - smoothstep(0.1, 0.45, sh)); hemi = hemi * (1. + 1.1 * wsk) + uSunCol * vec3(0.05, 0.055, 0.06) * wsk;   // + a little light thrown back by the sunlit backs                                        // a swell's own shadow lies under open sky: luminous blue shade
  vec3 r = alb * (uSunCol * dif * sh + hemi);
  r = mix(r, (dot(alb, vec3(0.3, 0.5, 0.2)) + 0.02) * uSkyCol * 1.7, 0.2 * wsk * uShHue);
  r = mix(r, dot(r, vec3(0.3, 0.5, 0.2)) * uSkyCol / max(dot(uSkyCol, vec3(0.3, 0.5, 0.2)), 1e-3), 0.5 * wsk * uShHue);   // in a swell's shadow the tone keeps its brightness and takes half its hue from the sky: straw goes violet-grey, green goes blue-green, never brown (uShHue: by the hour)
  r *= 1. - 0.4 * wsk * smoothstep(0.07, 0.2, dot(r, vec3(0.3, 0.5, 0.2)));   // and a pale sward (straw, a flowered crest) in that shadow is a clear step darker than where the sun reaches it: a shadow, never a second pale ground
  return r;
}
// drifts: the season's flowers lie in long torn bands, 6-12 m across and several times as long, along the swell; plain grass between
float gsDrift(sampler2D nzt, vec2 a0){ return smoothstep(0.59, 0.69, texture2D(nzt, a0 * vec2(0.00071, 0.0025) + 0.31).g * 0.8 + texture2D(nzt, a0 * vec2(0.0041, 0.0113) + 0.6).b * 0.2); }
vec3 gsHold(vec3 c){ return c * min(1., 0.88 / max(max(c.r, c.g), max(c.b, 1e-3))); }   // daisy white and lit rims stay under the bloom threshold
// the sea's tones, one function for the ground, the tufts and the far cards: a multiplier for the meadow's albedo.
// rel: -1 on the faces ahead of the crests ... +1 on their sunlit backs; hN: 0 in the trough ... 1 on the crest.
// uSeaK = (lift of the backs, depth of the faces, depth of the trough band), set by the hour
uniform vec3 uSeaK;
vec3 gsSea(float rel, float hN, float dist){
  float frontF = smoothstep(0.04, 0.7, -rel), backF = smoothstep(0.02, 0.65, rel), trough = 1. - smoothstep(0.04, 0.46, hN);
  float farK = 0.45 + 0.55 * smoothstep(50., 300., dist);                       // underfoot the face keeps its detail; it deepens as it falls away
  float v = (1. + uSeaK.x * backF * (1. - 0.6 * trough)) * mix(1., uSeaK.y, frontF * farK) * mix(1., uSeaK.z, trough * farK);
  v *= 1. + 0.22 * min(1., uSeaK.x * 3.4) * smoothstep(0.55, 0.95, hN) * (1. - frontF);
  vec3 hue = mix(vec3(1.), vec3(0.7, 0.96, 1.26), max(frontF, 0.8 * trough) * farK);
  hue = mix(hue, vec3(1.12, 1.06, 0.7), 0.55 * min(1., uSeaK.x * 3.4) * backF * (1. - trough));
  return v * hue;
}
`;

// under a low sun every swell throws a shadow down its own face and into the trough ahead of it. The swell is a
// function, so the shadow is too: walk from the rest point toward the sun and ask whether the land stands above the ray.
// uShK = (unit xz toward the sun, tan of the sun's elevation, strength 0..1); lift = metres above the ground (tree tops catch the light)
const GLSL_SHADE = /* glsl */`
float gsWaveH(vec2 q, float tw){ float h = 0.; for (int j = 0; j < 3; j++) h += uTr[j].w * cos(uTr[j].z * dot(uTr[j].xy, q) - uTo[j].x * tw - uTo[j].y); return h; }
float gsWaveSh(vec2 p0, float lift, float tw){
  if (uShK.w < 0.01) return 1.;
  float y0 = gsWaveH(p0, tw) + lift, sh = 0.;
  for (int i = 1; i <= 7; i++) {
    float s = float(i * i) * 6.5;
    sh = max(sh, smoothstep(0., 4. + 0.04 * s, gsWaveH(p0 + uShK.xy * s, tw) - y0 - s * uShK.z));
  }
  return 1. - uShK.w * sh;
}
`;

// ---------------------------------------------------------------- variations (hour, sea state, season, cast)
const HOURS = {
  day: { elev: 38, sun: '#FFF4DE', sunI: 3.1, sky: '#8FC7E8', skyI: 0.62, gnd: '#4d6b3a', gndI: 0.28, zenith: '#2f77c6', mid: '#7fb9e6', horizon: '#dfeaf1', fog: '#b9d6ea', fogDen: 0.00033, mist: 0,
    cloudShadow: 0.65, exposure: 1.0, tint: '#ffffff', shadowTint: '#0a1420', sat: 1.08, preset: 'day' },
  golden: { elev: 12, sun: '#FFC27A', sunI: 3.4, sky: '#7fa2e0', skyI: 0.5, gnd: '#4a5a52', gndI: 0.25, zenith: '#3a69b4', mid: '#9fb4d6', horizon: '#f6d9b0', fog: '#d9c8b8', fogDen: 0.00034, mist: 0.12,
    cloudShadow: 0.6, exposure: 1.05, tint: '#fff3e2', shadowTint: '#0c1630', sat: 1.1, preset: 'goldenHour' },
  dawn: { elev: 9, sun: '#FFB89A', sunI: 2.6, sky: '#9db4e6', skyI: 0.6, gnd: '#566a6c', gndI: 0.3, zenith: '#5d86c8', mid: '#b9c4e0', horizon: '#f7d6c8', fog: '#e6d5d6', fogDen: 0.00029, mist: 0.85,
    cloudShadow: 0.55, exposure: 1.02, tint: '#fff0ee', shadowTint: '#141a34', sat: 1.02, preset: 'dawn' },
};
const SEAS = {
  long: [[600, 46, 20, 0], [370, 8, 16, 22], [210, 3.5, 12, -31]],
  cross: [[600, 37, 20, 0], [440, 12, 17, 38], [330, 8, 15, -44]],
  glassy: [[600, 40, 20, 0], [410, 2.5, 16, 18], [230, 1, 12, -27]],
};
const SEASONS = {
  //         grass      dark       lime       cap        accent     crown      crownLit   blossom
  summer: ['#5FA052', '#2F6B45', '#C9DC7A', '#F5F3EA', '#D9609A', '#2F6B45', '#8fc24e', 0],
  spring: ['#63AC4E', '#2F7240', '#D3E272', '#F3DC5A', '#F0A0C2', '#3f7d45', '#F9BFD3', 1],
  autumn: ['#B8952F', '#6B5B27', '#E8C552', '#F1E7CF', '#A8456E', '#9C4A22', '#E08A2E', 0.55],
};
function chooseLook(ctx) {
  const rng = ctx.rng.fork ? ctx.rng.fork('look24588') : ctx.rng, v = ctx.vary || {};
  let hour = v.hour === 'day' ? 'day' : v.hour === 'golden' || v.hour === 'night' ? 'golden' : v.hour === 'dawn' ? 'dawn' : null;
  const r = rng(); if (!hour) hour = r < 0.42 ? 'day' : r < 0.74 ? 'golden' : 'dawn';
  const r2 = rng(), sea = r2 < 0.5 ? 'long' : r2 < 0.78 ? 'cross' : 'glassy';
  const r3 = rng(), season = r3 < 0.5 ? 'summer' : r3 < 0.77 ? 'spring' : 'autumn';
  return { hour, sea, season, H: HOURS[hour], S: SEASONS[season], rare: !!v.rare, density: clamp(v.density ?? 1, 0.7, 1.3),
    dapple: rng() < 0.4, secondHerd: rng() < 0.45, swallows: rng() < 0.35, runners: Math.round(lerp(120, 200, rng())) };
}

// ---------------------------------------------------------------- the rail, baked from the swell
// xz: headings (degrees toward -X from +Z) integrated over 1,490 m, then the hero's 190 m straight.
function bakeRail(swell, seat, travel) {
  const hB = 18.0841, hD = 26.1933, N = RAIL;
  const head = (s) => 25 + (hB - 25) * smoothstep(150, 330, s) + (45 - hB) * smoothstep(500, 600, s) + (hD - 45) * smoothstep(790, 900, s) + (57.99 - hD) * smoothstep(1000, 1120, s);
  const X = new Float32Array(N + 1), Z = new Float32Array(N + 1), Y = new Float32Array(N + 1), G = new Float32Array(N + 1), TWs = new Float32Array(N + 1), G0 = new Float32Array(N + 1);
  const S0 = N - STRAIGHT, ch = Math.hypot(travel.x, travel.z);
  for (let s = 1; s <= S0; s++) { const h = head(s - 0.5) * DEG; X[s] = X[s - 1] - Math.sin(h); Z[s] = Z[s - 1] + Math.cos(h); }
  const ex = seat.x - travel.x * STRAIGHT - X[S0], ez = seat.z - travel.z * STRAIGHT - Z[S0];      // close the (sub-metre) gap smoothly
  for (let s = 0; s <= S0; s++) { const w = smoothstep(S0 - 400, S0, s); X[s] += ex * w; Z[s] += ez * w; }
  for (let s = S0 + 1; s <= N; s++) { X[s] = seat.x - travel.x * (N - s); Z[s] = seat.z - travel.z * (N - s); }
  const y0 = seat.y - travel.y * STRAIGHT;
  for (let s = 0; s <= N; s += 2) {
    const tw = twAt(s); TWs[s] = tw;
    const g0 = swell.height(X[s], Z[s], tw);
    let gm = Math.max(g0, swell.height(X[s], Z[s], tw - 0.9), swell.height(X[s], Z[s], tw + 0.9));
    if (s < 140) gm = Math.max(gm, swell.height(X[s], Z[s], tw + 2), swell.height(X[s], Z[s], tw + 3.4), swell.height(X[s], Z[s], tw - 1.6));
    if (s > 196 && s < 440) gm = g0 - 1.7;                    // low among the runners on the swell's back: a back only falls away as the clock runs on
    G[s] = gm; G0[s] = g0;
    // entry high over the trough, then low up the swell's back among the runners (3.5 m, the lead's standing decision), up to the
    // masthead as crest C0 comes under us, down to the lip beside the herd, and from there one even line 7 m over the face to the last straight
    const clr = lerp(36, 3.5, smoothstep(40, 166, s)) + 31 * smoothstep(436, 512, s) - 15 * smoothstep(524, 590, s) - 12.4 * smoothstep(552, 612, s);
    let y = Math.max(g0 + clr, gm + 5);
    const yS = s < S0 ? y0 : y0 + (s - S0) * travel.y;
    y = lerp(y, yS, smoothstep(S0 - 100, S0, s));
    Y[s] = s > S0 ? Math.max(yS, s < N - 70 ? gm + 5 : -1e9) : y;
  }
  for (let s = 1; s < N; s += 2) { Y[s] = (Y[s - 1] + Y[s + 1]) / 2; G[s] = (G[s - 1] + G[s + 1]) / 2; TWs[s] = (TWs[s - 1] + TWs[s + 1]) / 2; G0[s] = (G0[s - 1] + G0[s + 1]) / 2; }
  const yEntry = Y[0]; for (let s = 0; s <= 60; s++) Y[s] = yEntry;
  const box = (R, to) => { const T = Y.slice(); for (let s = 0; s <= to; s++) { let a = 0, n = 0; for (let j = -R; j <= R; j += 2) { const q = clamp(s + j, 0, N); a += T[q]; n++; } Y[s] = a / n; } };
  const SM = N - 110;                                                                             // the last 110 m stay exactly straight
  box(20, SM); box(20, SM);
  for (let it = 0; it < 3; it++) { for (let s = 0; s <= SM; s++) Y[s] = Math.max(Y[s], G[s] + 4.6); box(8, SM); }
  let minClr = 1e9; for (let s = 0; s <= SM; s++) { if (Y[s] < G[s] + 4.2) Y[s] = G[s] + 4.2; minClr = Math.min(minClr, Y[s] - G[s]); }
  for (let s = 0; s <= 50; s++) Y[s] = Math.max(Y[s], lerp(Y[0], Y[50], smoothstep(0, 50, s)));
  // the tested guard: over the land as it stands when the camera is there the rail is never under 3.5 m (the smoothed part of the rail;
  // the last 110 m are the hero's straight, held 5 m clear above). If the bake ever falls short the rail is lifted, never left low.
  const MINCLR = 3.5; minClr = 1e9;
  for (let s = 0; s <= SM; s++) { if (Y[s] < G0[s] + MINCLR) Y[s] = G0[s] + MINCLR; minClr = Math.min(minClr, Y[s] - G0[s]); }
  const pts = []; for (let s = 0; s < N - 8; s += 14) pts.push(new THREE.Vector3(X[s], Y[s], Z[s]));
  pts.push(new THREE.Vector3(seat.x, seat.y, seat.z));
  return { X, Z, Y, G, TWs, pts, minClr, N };
}

// soft blobs of cloud shadow written once into a small 8-bit texture (red = shadow amount)
function makeCloudShadowTexture(clouds, span, cx, cz, extra) {
  const S = 512, d = new Uint8Array(S * S), acc = new Float32Array(S * S);
  for (const c of clouds) for (const b of c.blobs) {
    const px = (c.x + b[0] - cx) / span * S + S / 2, py = (c.z + b[1] - cz) / span * S + S / 2, r = b[2] / span * S;
    for (let y = Math.max(0, Math.floor(py - r)); y <= Math.min(S - 1, Math.ceil(py + r)); y++) for (let x = Math.max(0, Math.floor(px - r)); x <= Math.min(S - 1, Math.ceil(px + r)); x++) {
      const q = Math.hypot(x + 0.5 - px, y + 0.5 - py) / r; if (q < 1) acc[y * S + x] += 0.85 * (1 - smoothstep(0.15, 1, q));
    }
  }
  if (extra) for (let n = 0; n < 120; n++) {
    const px = extra() * S, py = extra() * S, rx = (80 + 190 * extra()) / span * S, ry = rx * (0.5 + 0.5 * extra()), k = 0.5 + 0.4 * extra();
    for (let y = Math.max(0, Math.floor(py - ry)); y <= Math.min(S - 1, Math.ceil(py + ry)); y++) for (let x = Math.max(0, Math.floor(px - rx)); x <= Math.min(S - 1, Math.ceil(px + rx)); x++) {
      const q = Math.hypot((x + 0.5 - px) / rx, (y + 0.5 - py) / ry); if (q < 1) acc[y * S + x] += k * (1 - smoothstep(0.2, 1, q));
    }
  }
  for (let i = 0; i < S * S; i++) d[i] = Math.round(255 * Math.min(1, acc[i]));
  const tex = new THREE.DataTexture(d, S, S, THREE.RedFormat, THREE.UnsignedByteType); tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

export default {
  id: 'groundswell-country', name: 'The Groundswell', category: 'alien', weirdness: 0.65, media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1);
    const look = chooseLook(ctx), H = look.H, SP = look.S;
    const scene = new THREE.Scene();
    const col = (h) => new THREE.Color(h);
    const pal = { grass: col(SP[0]), dark: col(SP[1]), lime: col(SP[2]), cap: col(SP[3]), accent: col(SP[4]), crown: col(SP[5]), crownLit: col(SP[6]), granite: col('#7C8791'), blossom: look.season === 'spring' ? 1 : 0, drift: look.season === 'autumn' ? 0.8 : 1 };

    // ---- the swell for this visit
    const trains = SEAS[look.sea].map(([L, A, c, ang], i) => {
      const a = ang * DEG, k = TAU / L;
      return { dx: -Math.sin(a), dz: Math.cos(a), k, A, om: k * c, ph: i === 0 ? k * CREST0 : rng.range(0, TAU) };
    });
    // rare: a solitary rogue crest crossing to port; it reaches the tor's upstream foot at tw 33 and is gone by 40
    // It stands ahead and to port as a long ridge from the masthead on (drifting at 9 m/s), then gathers speed, crosses the tor and is gone.
    const rogue = look.rare ? { A: 172, W: 165, x: TOR.x - 370, S: 320, P: 3.2 } : null;
    if (rogue) {
      const RT = [-20, 0, 18, 33, 40, 46, 70], RZ = [520, 700, 862, TOR.z - 180, TOR.z + 60, TOR.z + 270, TOR.z + 1100];
      const raw = (t) => { if (t <= RT[0]) return RZ[0]; for (let i = 1; i < RT.length; i++) if (t <= RT[i]) return lerp(RZ[i - 1], RZ[i], (t - RT[i - 1]) / (RT[i] - RT[i - 1])); return RZ[RZ.length - 1]; };
      rogue.zc = (t) => (raw(t - 1.5) + 2 * raw(t) + raw(t + 1.5)) / 4;
      rogue.cAt = (t) => rogue.zc(t + 0.5) - rogue.zc(t - 0.5);
    }
    const swell = makeSwell(trains, rogue);
    const U = {
      uTr: { value: trains.map((t) => new THREE.Vector4(t.dx, t.dz, t.k, t.A)) }, uTo: { value: trains.map((t) => new THREE.Vector2(t.om, t.ph)) },
      uTw: { value: 0 }, uTime: { value: 0 },
      uRogue: { value: rogue ? new THREE.Vector4(rogue.A, rogue.zc(0), 0, 1 / rogue.W) : new THREE.Vector4(0, 0, 0, 1) },   // y, z are set each frame: the crest line's tangent at the clock
      uRogue2: { value: rogue ? new THREE.Vector2(rogue.x, 1 / rogue.S) : new THREE.Vector2(0, 1) },
      uSunDir: { value: new THREE.Vector3() }, uSunCol: { value: col(H.sun).multiplyScalar(H.sunI / Math.PI) },
      uSkyCol: { value: col(H.sky).multiplyScalar(H.skyI * 0.8) }, uGndCol: { value: col(H.gnd).multiplyScalar(H.gndI * 0.85) },
      uFogCol: { value: col(H.fog) }, uFogDen: { value: H.fogDen }, uMist: { value: H.mist }, uMistY: { value: new THREE.Vector2(-trains[0].A * 0.95, -trains[0].A * 0.2) },
      uCloud: { value: null }, uCloudX: { value: new THREE.Vector4(0, 0, 1 / 7000, H.cloudShadow) }, uShK: { value: new THREE.Vector4(0, -1, 1, 0) },
      uShHue: { value: look.hour === 'golden' ? 1 : 0 },   // the sky's hue in a swell's shadow: the evening the brief asks for ('troughs in blue shadow'); at dawn the shaded meadow keeps its own green, as on the live site
    };
    // sun: elev above the horizon, 125 degrees from +Z toward -X (abeam to port all flight, never ahead, never behind the portal)
    const ce = Math.cos(H.elev * DEG);
    const sunDir = U.uSunDir.value.set(-Math.sin(125 * DEG) * ce, Math.sin(H.elev * DEG), Math.cos(125 * DEG) * ce).normalize();
    { const sh = Math.hypot(sunDir.x, sunDir.z) || 1; U.uShK.value.set(sunDir.x / sh, sunDir.z / sh, Math.tan(H.elev * DEG), H.elev < 25 ? 0.8 : 0); }

    // ---- the hero
    const hero = await buildHero(ctx, { palette: [SP[0], SP[1], SP[2], SP[3], '#7C8791', H.sky, SP[4]], detail, skirt: false });
    hero.object.position.set(TOR.x, 0, TOR.z); hero.object.rotation.y = Math.PI; scene.add(hero.object);
    const toWorld = (v) => new THREE.Vector3(TOR.x - v.x, v.y, TOR.z - v.z);
    const seat = toWorld(hero.anchors.portalSeat.position), tv = hero.anchors.portalSeat.travel, travel = new THREE.Vector3(-tv.x, tv.y, -tv.z).normalize();
    const bay = toWorld(hero.anchors.bay);
    hero.setGroundSampler((xl, zl, tw) => {
      const x = TOR.x - xl, z = TOR.z - zl;
      return xl * xl + zl * zl < 198 * 198 ? swell.yAt(x, z, tw) : swell.height(x, z, tw);
    });
    hero.setLight(sunDir, U.uSunCol.value.clone().multiplyScalar(2.6), U.uSkyCol.value.clone().multiplyScalar(2.2));
    { const k = U.uShK.value;                              // the JS twin of gsWaveSh: the comber stands in the same swell shadow as the meadow round it
      const waveH = (x, z, tw) => { let h = 0; for (let j = 0; j < 3; j++) { const t = trains[j]; h += t.A * Math.cos(t.k * (t.dx * x + t.dz * z) - t.om * tw - t.ph); } return h; };
      hero.setShade?.((xl, zl, lift, tw) => {
        if (k.w < 0.01) return 1;
        const x = TOR.x - xl, z = TOR.z - zl, y0 = waveH(x, z, tw) + lift; let sh = 0;
        for (let i = 1; i <= 7; i++) { const d = i * i * 6.5; sh = Math.max(sh, smoothstep(0, 4 + 0.04 * d, waveH(x + k.x * d, z + k.y * d, tw) - y0 - d * k.z)); }
        return 1 - sh;
      }); }
    await ctx.yield();

    // ---- the rail
    const rail = bakeRail(swell, seat, travel);
    await ctx.yield();
    const path = makePath(rail.pts);
    await ctx.yield();
    const TWU = new Float32Array(257);                    // wave clock by engine u
    { let si = 0; const p = new THREE.Vector3();
      for (let i = 0; i <= 256; i++) {
        path.pointAt(i / 256, p);
        for (;;) { const d0 = (rail.X[si] - p.x) ** 2 + (rail.Z[si] - p.z) ** 2, s1 = Math.min(si + 1, rail.N), d1 = (rail.X[s1] - p.x) ** 2 + (rail.Z[s1] - p.z) ** 2; if (s1 > si && d1 <= d0) si = s1; else break; }
        TWU[i] = rail.TWs[si];
      } }
    const twOfU = (u) => { const f = clamp(u, 0, 1) * 256, i = Math.min(255, Math.floor(f)); return lerp(TWU[i], TWU[i + 1], f - i); };
    const railAtTw = (tw) => { let s = 0; while (s < rail.N && rail.TWs[s] < tw) s += 2; return Math.min(s, rail.N); };
    await ctx.yield();

    // ---- sky, light, clouds
    const sky = makeSky({ rng, preset: H.preset, zenith: H.zenith, mid: H.mid, horizon: H.horizon, ground: H.fog, sunDirection: sunDir.clone(),
      sunColor: H.sun, sunSize: 1.1, clouds: false, clouds2: { coverage: 0.34, stretch: 1, opacity: 0.4, scale: 1.4, wind: [0.001, -0.006] }, fogColor: H.fog });
    scene.add(sky.object);
    await ctx.yield();
    scene.fog = new THREE.FogExp2(U.uFogCol.value.clone(), H.fogDen);
    const sunLight = new THREE.DirectionalLight(col(H.sun), H.sunI); sunLight.position.copy(sunDir).multiplyScalar(1000); scene.add(sunLight, sunLight.target);
    scene.add(new THREE.HemisphereLight(col(H.sky).multiplyScalar(H.skyI * 0.85), col(H.gnd).multiplyScalar(H.gndI * 0.9), Math.PI));
    const fill = new THREE.DirectionalLight(col(H.sky).lerp(col('#ffffff'), 0.35), 1.15 * H.skyI / 0.62); fill.position.set(800, 450, -400); scene.add(fill, fill.target);
    const cr = rng.fork ? rng.fork('clouds') : rng, cloudList = [];
    for (let i = 0, tries = 0; cloudList.length < 16 && tries < 600; tries++) {
      const x = cr.range(-3100, 1500), z = cr.range(-300, 4300), w = cr.range(400, 900);
      if (cloudList.some((c) => Math.hypot(c.x - x, c.z - z) < (c.w + w) * 0.62)) continue;
      const blobs = []; for (let b = 0; b < 5; b++) blobs.push([cr.range(-0.3, 0.3) * w, cr.range(-0.22, 0.22) * w, w * cr.range(0.28, 0.42)]);
      cloudList.push({ x, z, w, blobs }); i++;
    }
    const WIND_Z = -9, cloudBase = 700;
    const clouds = makeCloudField({ rng, mode: 'cumulus', sky, at: cloudList.map((c) => [c.x, cloudBase, c.z, c.w]), height: 0.6, puffs: 30,
      wind: [0, 0, WIND_Z], opacity: 0.9, farFade: [9000, 14000], fogFade: 0.55 });
    scene.add(clouds.object);
    await ctx.yield();
    const CL = { span: 7000, cx: -700, cz: 1800 };
    U.uCloud.value = makeCloudShadowTexture(cloudList, CL.span, CL.cx, CL.cz, ctx.core.makeRng(((ctx.seed | 0) ^ 0x51ab) + 9173));
    const shOff = (cloudBase + 150) / Math.tan(Math.max(H.elev, 22) * DEG), sh2 = Math.hypot(sunDir.x, sunDir.z);
    const cloudOrigin = { x: CL.cx - CL.span / 2 - sunDir.x / sh2 * shOff, z: CL.cz - CL.span / 2 - sunDir.z / sh2 * shOff };
    await ctx.yield();

    // ---- shared tiling noise (4 independent channels, mipmapped)
    const nz = (() => {
      const S = 128, d = new Uint8Array(S * S * 4), nr = rng.fork ? rng.fork('noise') : rng;
      for (let c = 0; c < 4; c++) {
        const g = new Float32Array(S * S); for (let i = 0; i < S * S; i++) g[i] = nr();
        for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {       // one blur pass keeps it soft but grainy
          const a = g[y * S + x], b = g[y * S + (x + 1) % S], c2 = g[((y + 1) % S) * S + x], e = g[((y + 1) % S) * S + (x + 1) % S];
          d[(y * S + x) * 4 + c] = Math.round(clamp((a * 0.4 + (b + c2) * 0.22 + e * 0.16 - 0.5) * 1.7 + 0.5, 0, 1) * 255);
        }
      }
      const t = new THREE.DataTexture(d, S, S, THREE.RGBAFormat); t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.minFilter = THREE.LinearMipmapLinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = true; t.anisotropy = Math.min(8, ctx.renderer?.capabilities?.getMaxAnisotropy?.() || 1); t.needsUpdate = true; return t;
    })();
    U.uNoise = { value: nz };
    await ctx.yield();
    U.uCamRest = { value: new THREE.Vector2() };
    U.uHerd = { value: new THREE.Vector4(0, 400, 12.8, 1) };           // head x now, length along the crest, speed toward -X, on
    U.uGrass = { value: pal.grass }; U.uDarkG = { value: pal.dark }; U.uLime = { value: look.hour === 'day' ? pal.lime.clone().lerp(pal.grass, 0.45).multiplyScalar(0.92) : pal.lime }; U.uCap = { value: pal.cap.clone().multiplyScalar(0.8) }; U.uAccent = { value: pal.accent };
    U.uDrift = { value: pal.drift }; U.uEye = { value: look.season === 'summer' ? new THREE.Color(0.85, 0.6, 0.08) : look.season === 'spring' ? new THREE.Color(0.62, 0.8, 0.3) : new THREE.Color(0.55, 0.45, 0.3) };   // the daisy's gold eye; a cowslip's pale green throat; thistledown's seed
    U.uStreak = { value: look.sea === 'glassy' ? 0.55 : 1 }; U.uRelK = { value: look.hour === 'day' ? 0.42 : 0.24 }; U.uSeaK = { value: look.hour === 'day' ? new THREE.Vector3(0.1, 0.4, 0.55) : new THREE.Vector3(0.3, 0.72, 0.68) };
    U.uSkyRefl = { value: col(H.zenith).lerp(col(H.horizon), 0.45) };
    { const sh = Math.hypot(sunDir.x, sunDir.z) || 1; U.uBackDir = { value: new THREE.Vector2(sunDir.x / sh * 0.45, sunDir.z / sh * 0.45 - 0.55).normalize() }; }   // the way the swells' backs face: toward the sun and astern

    // ---- the ground: a camera-centred polar grid in REST space, displaced by the swell
    const NA = 148, NR = 140;
    const terrain = (() => {
      const pos = new Float32Array(NA * NR * 3), idx = new Uint32Array(NA * (NR - 1) * 6);
      for (let j = 0; j < NR; j++) {
        const r = j === 0 ? 0 : 70 * (Math.exp(0.03247 * j) - 1) * (0.55 + 0.45 * smoothstep(0, 40, j));
        for (let i = 0; i < NA; i++) { const a = (i + (j & 1) * 0.5) / NA * TAU, o = (j * NA + i) * 3; pos[o] = Math.cos(a) * r; pos[o + 2] = Math.sin(a) * r; }
      }
      let q = 0;
      for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NA; i++) {
        const a = j * NA + i, b = j * NA + (i + 1) % NA, c = a + NA, d = b + NA;
        if (j & 1) { idx[q++] = a; idx[q++] = d; idx[q++] = b; idx[q++] = a; idx[q++] = c; idx[q++] = d; }
        else { idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d; }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
      const mat = new THREE.ShaderMaterial({
        uniforms: U, side: THREE.DoubleSide,
        vertexShader: GLSL_SWELL + /* glsl */`
uniform vec2 uCamRest; varying vec2 vP0; varying vec3 vW;
void main(){
  vec2 p0 = uCamRest + position.xz; float far = 1. - smoothstep(2000., 3000., length(position.xz));
  vec3 n; float J; vec3 d = gsOff(p0, uTw, far, n, J);
  vP0 = p0; vW = vec3(p0.x + d.x, d.y, p0.y + d.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`,
        fragmentShader: GLSL_SWELL + GLSL_LIGHT + GLSL_SHADE + /* glsl */`
uniform vec2 uCamRest, uCapJ; uniform sampler2D uNoise; uniform float uTime, uDrift, uStreak, uRelK; uniform vec4 uHerd;
uniform vec3 uGrass, uDarkG, uLime, uCap, uAccent, uSkyRefl; uniform vec2 uBackDir;
varying vec2 vP0; varying vec3 vW;
void main(){
  vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
  float far = 1. - smoothstep(2000., 3000., length(vP0 - uCamRest));
  vec3 n; float J; gsOff(vP0, uTw, far, n, J);
  float n1 = texture2D(uNoise, vP0 * 0.0027).r, n2 = texture2D(uNoise, vP0 * 0.017 + 0.37).g;
  float n3 = texture2D(uNoise, vP0 * 0.13).b, n4 = texture2D(uNoise, vP0 * vec2(1.7, 0.9)).a, n5 = texture2D(uNoise, vP0 * 0.61 + 0.11).r;
  float nearF = 1. - smoothstep(25., 150., dist), midF = 1. - smoothstep(150., 1100., dist);
  vec3 alb = mix(uGrass, uLime, 0.15 + 0.45 * n1 + 0.22 * smoothstep(-5., 42., vW.y));
  float fb = n1 * 0.45 + texture2D(uNoise, vP0 * 0.0071 + 0.19).b * 0.33 + n2 * 0.22;
  alb = mix(alb, uDarkG, 0.5 * smoothstep(0.3, 0.75, fb) * (0.5 + 0.5 * midF));
  float hN = smoothstep(-1., 0.95, vW.y / max(uTr[0].w, 1.));                 // 0 in the trough, 1 on the crest
  float th = uTr[0].z * dot(uTr[0].xy, vP0) - uTo[0].x * uTw - uTo[0].y, thw = mod(th + 3.14159265, 6.2831853) - 3.14159265;
  float rel = clamp(dot(n.xz, uBackDir) * 3.4, -1., 1.), frontF = smoothstep(0.04, 0.7, -rel), backF = max(rel, 0.);   // -1 on the faces ahead of the crests, +1 on their sunlit backs
  alb *= (0.8 + 0.4 * mix(0.5, n3, midF)) * (0.74 + 0.52 * mix(0.5, n4, nearF));
  alb = mix(alb, uLime, 0.3 * smoothstep(0.6, 1., hN) * (1. - frontF) + 0.2 * backF);
  alb = mix(alb, uDarkG, 0.18 * max(frontF, 1. - smoothstep(0.04, 0.46, hN)) * smoothstep(50., 300., dist));
  alb *= gsSea(rel, hN, dist);
  vec2 urB; float nfB; float bowB = gsShape(vP0, urB, nfB).z;
  // the crest line of the swell we are on (and the heap against the tor), seen from its face: a lit rim with a torn white streak
  float rimN = max(smoothstep(0.9, 0.985, cos(th)) * smoothstep(0.55, 0.9, hN), smoothstep(0.5, 0.9, bowB)) * smoothstep(45., 150., dist) * (1. - smoothstep(420., 1000., dist));
  alb *= 1. + 0.35 * rimN; alb = mix(alb, uLime, 0.4 * rimN);
  { float rim = smoothstep(0.5, 0.97, cos(th)) * (1. - smoothstep(0.02, 0.3, thw)), farW = smoothstep(380., 1000., dist);
    alb *= 1. + 0.32 * rim * farW; alb = mix(alb, uLime, 0.25 * farW * rim); }
  // under the tufts and the far cards the ground is the shade between blades
  alb *= mix(1., 0.7, 1. - smoothstep(260., 1500., dist));
  float nT = texture2D(uNoise, vP0 * 0.037 + 0.71).a, nS = texture2D(uNoise, vec2(dot(vP0, vec2(0.95, 0.25)) * 0.045, dot(vP0, vec2(-0.25, 0.95)) * 0.006)).r;
  alb *= (0.87 + 0.26 * nT) * (0.86 + 0.28 * nS); alb = mix(alb, uLime, 0.18 * smoothstep(0.55, 0.85, nS));
  float sheen = smoothstep(0.52, 0.8, texture2D(uNoise, vP0 * vec2(0.0035, 0.0105) + vec2(0.011, -0.034) * uTime).g);
  alb = mix(alb, uLime * 1.08, 0.3 * sheen * (0.4 + 0.6 * midF));
  // flowers: flecks that thicken in patches; whitecaps where the trochoid crowds the land (J small)
  float pch = smoothstep(0.35, 0.7, n2 * 0.6 + n1 * 0.5);
  float fl = smoothstep(0.7, 0.82, n5) * (0.2 + 0.5 * pch) * nearF + 0.04 * pch * n3 * (1. - nearF) * midF;                 // between the drifts the grass is plain
  float loosen = 0.1 * smoothstep(150., 900., dist);
  float w = 1. - smoothstep(uCapJ.x + loosen, uCapJ.y + loosen, J + (n2 - 0.5) * 0.10 + (n1 - 0.5) * 0.06);
  float rq = (vP0.y - uRogue.y - uRogue.z * uTw) * uRogue.w, rl = (vP0.x - uRogue2.x) * (vP0.x < uRogue2.x ? uRogue2.y * ${(1 / 3.2).toFixed(4)} : uRogue2.y);
  w = max(w, step(1., uRogue.x) * smoothstep(0.45, 0.9, exp(-min(rq * rq + rl * rl, 40.)) + (n2 - 0.5) * 0.3) * smoothstep(-0.9, 0.4, rq));
  float wbr = smoothstep(0.3, 0.62, texture2D(uNoise, vP0 * vec2(0.0021, 0.0103) + 0.57).b * 0.6 + n2 * 0.4);          // the cap is torn along the crest, in rags
  float cap = clamp(fl * 0.55 + w * wbr * (0.2 + 0.62 * mix(mix(n3, 0.8, smoothstep(200., 800., dist)), n5, nearF)), 0., 1.);
  // far whitecaps: ragged streaks 60-200 m long lying just behind the crest lines of the long swell
  { float crN = floor(th / 6.2831853 + 0.5), along = dot(vec2(-uTr[0].y, uTr[0].x), vP0);
    float brk = texture2D(uNoise, vec2(along * 0.00013 + crN * 0.37, crN * 0.19 + 0.05)).g * 0.7 + texture2D(uNoise, vec2(along * 0.0006, crN * 0.41 + 0.3)).r * 0.3;
    float wdt = 0.09 + 0.26 * smoothstep(0.45, 0.72, brk) + 0.1 * (n2 - 0.5);
    float band = (1. - smoothstep(wdt * 0.5, wdt, abs(thw + 0.1))) * smoothstep(0.43, 0.52, brk) * smoothstep(0.22, 0.42, n2 * 0.6 + n1 * 0.5);
    cap = max(cap, uStreak * band * smoothstep(230., 460., dist) * (1. - smoothstep(3600., 5200., dist)) * (0.72 + 0.28 * n3));
    vec2 urT; float nfT; float bowG = gsShape(vP0, urT, nfT).z;                                   // and on the heap of land against the tor
    cap = max(cap, smoothstep(0.5, 0.86, bowG + (n2 - 0.5) * 0.5 + (n1 - 0.5) * 0.3) * (0.3 + 0.6 * mix(n3, 0.7, smoothstep(150., 500., dist))) * smoothstep(0.42, 0.6, brk + n1 * 0.3)); }
  float acc = smoothstep(0.74, 0.86, texture2D(uNoise, vP0 * 0.47 + 0.63).a) * (0.25 + 0.5 * pch) * mix(midF * 0.12, 1., nearF);
  float farF = 1. - smoothstep(1500., 4500., dist);
  float dr1 = gsDrift(uNoise, vP0), dr2 = gsDrift(uNoise, vP0 + vec2(517., 263.)) * smoothstep(0.35, 0.6, n2 * 0.6 + n1 * 0.5);
  cap = clamp(cap + uDrift * dr1 * (0.24 + 0.3 * nT) * (0.35 + 0.65 * n3) * farF * (1. - 0.5 * nearF), 0., 1.);   // a drift is a flecked pale band, never a painted patch
  acc = clamp(acc + dr2 * 0.3 * smoothstep(0.52, 0.72, n5) * (0.55 + 0.45 * n3) * farF * (1. - 0.6 * nearF) * (1. - smoothstep(250., 700., dist)), 0., 1.);   // campion drifts are flecks among the grass, never a painted band
  cap = max(cap, step(1., uRogue.x) * smoothstep(0.5, 0.86, exp(-min(rq * rq * 2.5 + rl * rl * 0.5, 40.)) + (n2 - 0.5) * 0.25) * (0.5 + 0.4 * n3));   // the rogue: white along its whole crest
  cap = max(cap, step(1., uRogue.x) * smoothstep(0.5, 0.8, exp(-min(rq * rq * 5., 40.)) * (1. - smoothstep(1.0, 1.7, abs(rl))) + (n2 - 0.5) * 0.3) * wbr * (0.55 + 0.4 * n3));   // a torn streak the length of its crest line
  cap = max(cap, rimN * smoothstep(0.3, 0.5, texture2D(uNoise, vP0 * vec2(0.0016, 0.019) + 0.23).b * 0.7 + n2 * 0.3) * (0.7 + 0.3 * n3));   // the torn streak of the season's flowers along the crest we ride
  // CAMPION DRIFTS IN THE GRASS: the campion's own drift field, a function of the rest place alone (the field the heads stand in and the
  // flecks are painted by). A drift is flowers, never a wash: clumps a stride or two across, crowded in the drift's core (nearly two fifths of the ground there) and thinning to none at its
  // edge (0.6: only the upper part of the field bears them), each clump small flecks with live's grass between. A fleck is the campion's own hue at its full strength: a place is grass or it is flower, and nothing is darkened or dulled. The caps and flecks go on over it as before
  { float drC = gsDrift(uNoise, vP0 + vec2(517., 263.)); alb = mix(alb, uAccent / max(uAccent.r, max(uAccent.g, uAccent.b)), smoothstep(0.44, 0.56, 0.3 * nT + 0.35 * n2 + 0.35 * texture2D(uNoise, vP0 * 0.0083 + 0.57).r - 0.04 - 0.6 * (1. - drC)) * smoothstep(0.42, 0.58, 0.45 * n5 + 0.55 * n3 + 0.06)); }
  alb = mix(alb, uCap, cap); alb = mix(alb, uAccent, acc * 0.7 * (1. - 0.6 * w));
  // the herd's trodden wake: darker, flattened grass behind crest C0 where the runners have passed
  float age = (${CREST0.toFixed(1)} + 20. * uTw - vP0.y) / 20., hx = uHerd.x + uHerd.z * age;
  float tread = uHerd.w * smoothstep(-0.25, 0.1, age) * exp(-max(age, 0.) / 4.5) * smoothstep(hx - 14., hx + 4., vP0.x) * (1. - smoothstep(hx + uHerd.y - 4., hx + uHerd.y + 14., vP0.x));
  alb = mix(alb, uDarkG * 0.8, tread * (0.45 + 0.3 * n4));
  // streams lying in the troughs of the long swell, travelling with them
  float dz = (mod(th, 6.2831853) - 3.14159265) / uTr[0].z + (sin(vP0.x * 0.0113 + 1.3) * 16. + sin(vP0.x * 0.0291) * 7. + sin(vP0.x * 0.071 + 2.) * 2.5);
  float pres = smoothstep(-0.75, -0.4, sin(vP0.x * 0.0031 + floor(th / 6.2831853) * 2.4));
  pres *= 1. - step(1., uRogue.x) * smoothstep(0.02, 0.1, exp(-min(rq * rq + rl * rl, 40.)));           // a stream lies in its trough: it stops at the foot of the rogue crest, never climbs it
  float wd = 2.2 + 3.2 * n1 + dist * 0.005, stream = pres * (1. - smoothstep(wd, wd + 1.2 + dist * 0.004, abs(dz)));
  n = normalize(n + vec3(n3 - 0.5, 0., n4 - 0.5) * (0.5 * nearF + 0.12) * (1. - stream));
  float sh = gsCloud(vW.xz) * gsWaveSh(vP0, 0., uTw);
  vec3 c = gsLit(alb, n, sh, 0.) + alb * uSkyCol * 0.3 * frontF + alb * uSunCol * 0.7 * rimN * gsCloud(vW.xz);                              // faces in shade are blue-green, never black
  float back = max(dot(-V, uSunDir), 0.); c += alb * uLime * uSunCol * sh * back * back * 0.55 * (1. - cap);        // blades glow against the sun
  vec3 R = reflect(-V, vec3(0., 1., 0.)); float gl = max(dot(R, uSunDir), 0.); gl *= gl; gl *= gl; gl *= gl; gl *= gl;
  float rip = texture2D(uNoise, vP0 * 0.09 + vec2(uTime * 0.05, 0.)).r;
  c = gsHold(c);
  vec3 water = uSkyRefl * (0.45 + 0.5 * (1. - max(V.y, 0.))) + uSunCol * sh * gl * (1.5 + 6. * rip);
  c = mix(c, water, stream);
  // dawn mist: slow wisps lying along the troughs, thin enough for the land to show through, glowing toward the sun
  { vec2 mp = vP0 + vec2(0.9, -0.4) * uTime * 3.;
    gsMistN = clamp(0.1 + 2.1 * texture2D(uNoise, mp * 0.00021).a * texture2D(uNoise, mp * vec2(0.0011, 0.0029) + 0.4).g * 2. * (0.8 + 0.4 * texture2D(uNoise, mp * vec2(0.004, 0.011) + 0.2).r) + 0.5 * (n1 - 0.5), 0.04, 1.7);
    float sunw = max(dot(normalize(vec3(-V.x, 0.02, -V.z)), normalize(vec3(uSunDir.x, 0.02, uSunDir.z))), 0.);
    gsMistC = vec3(1.02) + uSunCol * (0.1 + 0.45 * sunw * sunw); }
  gl_FragColor = vec4(gsFog(c, dist, vW.y), 1.);
}` });
      const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.name = 'ground'; return m;
    })();
    scene.add(terrain);
    await ctx.yield();

    const tick = [], disposables = [U.uCloud.value, nz];

    // ---- rooted things: a rest anchor per instance, displaced and tilted onto the land in the vertex shader
    const GLSL_ROOT = /* glsl */`
// world position of a vertex 'l' (local, +Y up) of something rooted at rest point a0; lean = how far it tilts with the slope
vec3 gsRoot(vec2 a0, vec3 l, float tw, float lean, out vec3 gn, out float J, out vec3 base){
  vec3 d = gsOff(a0, tw, 1., gn, J); base = vec3(a0.x + d.x, d.y, a0.y + d.z);
  vec3 up = normalize(mix(vec3(0., 1., 0.), gn, lean));
  vec3 tx = normalize(vec3(up.y, -up.x, 0.)), tz = cross(tx, up);
  return base + tx * l.x + up * l.y + tz * l.z;
}`;
    // closest approach of a rooted thing (rest x0, z0, top height h) to the rail at the moments the camera passes
    const railGap = (x0, z0, h) => {
      let best = 1e9; const o = {};
      for (let s = 0; s <= rail.N; s += 6) {
        const dx = rail.X[s] - x0, dz = rail.Z[s] - z0; if (dx * dx + dz * dz > 110 * 110) continue;
        for (let k = -1; k <= 1; k++) {
          swell.at(x0, z0, rail.TWs[s] + k * 0.9, o);
          const hx = o.x - rail.X[s], hz = o.z - rail.Z[s], dy = Math.max(0, rail.Y[s] - (o.y + h), o.y - rail.Y[s]);
          best = Math.min(best, Math.hypot(hx, hz, dy));
        }
      }
      return best;
    };
    U.uRain = { value: 0 };
    U.uWin = { value: new THREE.Vector2() };
    { const jm = 1 - trains.reduce((a, t) => a + t.k * t.A, 0); U.uCapJ = { value: look.sea === 'glassy' ? new THREE.Vector2(jm - 0.03, jm + 0.07) : new THREE.Vector2(jm + 0.10, jm + 0.26) }; }
    const instGeo = (base, count, attrs) => {
      const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
      for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k].a, attrs[k].n));
      g.instanceCount = count; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(TOR.x / 2, 0, TOR.z / 2), 9000); return g;
    };

    // ---- meadow grass: tufts of two crossed cards, each card a dozen alpha-cut blades with pale seed heads,
    // wrapped in a 120 m rest-space window ahead of the camera
    const GLSL_TINT = /* glsl */`
// the meadow's broad tones, the same fields the ground shader paints: dark cool troughs, bright crests, patches,
// and where daisy caps (fl.x) and campion drifts (fl.y) lie
uniform float uDrift, uRelK; uniform vec2 uBackDir;
vec3 gsTint(vec2 a0, float y, float J, vec2 nxz, float dist, out vec2 fl){
  float n1 = texture2D(uNoise, a0 * 0.0027).r, n2 = texture2D(uNoise, a0 * 0.017 + 0.37).g, nT = texture2D(uNoise, a0 * 0.037 + 0.71).a;
  float fb = n1 * 0.45 + texture2D(uNoise, a0 * 0.0071 + 0.19).b * 0.33 + n2 * 0.22;
  float hN = smoothstep(-1., 0.95, y / max(uTr[0].w, 1.));
  float rel = clamp(dot(nxz, uBackDir) * 3.4, -1., 1.);
  vec3 t = gsSea(rel, hN, dist) * (1. - 0.28 * smoothstep(0.3, 0.75, fb)) * (0.9 + 0.2 * nT);
  float w = 1. - smoothstep(uCapJ.x + 0.04, uCapJ.y + 0.04, J + (n2 - 0.5) * 0.10 + (n1 - 0.5) * 0.06);
  float dr1 = gsDrift(uNoise, a0), dr2 = gsDrift(uNoise, a0 + vec2(517., 263.));
  fl = vec2(clamp(w * 0.9 + uDrift * dr1 * 0.8, 0., 1.), dr2 * 0.6 * (1. - w));
  return t;
}
`;
    const WIN = 120; let grassFrag = '';
    const makeTufts = (WIN, uW, nT, gr, name) => {
      const pos = [], blade = [];
      for (let c = 0; c < 2; c++) {
        const a = c * Math.PI / 2 + 0.3, dx = Math.cos(a) * 0.75, dz = Math.sin(a) * 0.75;
        const q = [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]];
        for (const [sx, t] of q) { pos.push(dx * sx, t * 1.2, dz * sx); blade.push(t, sx * 0.5 + 0.5 + c * 1.7); }
      }
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); base.setAttribute('aBlade', new THREE.Float32BufferAttribute(blade, 2));
      const off = new Float32Array(nT * 4); for (let i = 0; i < nT; i++) { off[i * 4] = gr() * WIN; off[i * 4 + 1] = gr() * WIN; off[i * 4 + 2] = gr(); off[i * 4 + 3] = gr(); }
      const mat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
        vertexShader: GLSL_SWELL + GLSL_LIGHT + GLSL_SHADE + /* glsl */`
attribute vec2 aBlade; attribute vec4 aOff; uniform vec2 ${uW}, uCapJ; uniform float uTime; uniform sampler2D uNoise;
varying vec3 vC; varying vec2 vT; varying vec3 vW; varying vec3 vN; varying float vSh; varying vec3 vTint; varying vec2 vFl;
varying float vDr;                                                                   // the campion drift at this blade's rest place, 0..1 (CAMPION DRIFTS IN THE GRASS)
// the meadow's broad tones, the same fields the ground shader paints: dark cool troughs, bright crests, patches,
// and where daisy caps (fl.x) and campion drifts (fl.y) lie
uniform float uDrift, uRelK; uniform vec2 uBackDir;
vec3 gsTint(vec2 a0, float y, float J, vec2 nxz, float dist, out vec2 fl){
  float n1 = texture2D(uNoise, a0 * 0.0027).r, n2 = texture2D(uNoise, a0 * 0.017 + 0.37).g, nT = texture2D(uNoise, a0 * 0.037 + 0.71).a;
  float fb = n1 * 0.45 + texture2D(uNoise, a0 * 0.0071 + 0.19).b * 0.33 + n2 * 0.22;
  float hN = smoothstep(-1., 0.95, y / max(uTr[0].w, 1.));
  float rel = clamp(dot(nxz, uBackDir) * 3.4, -1., 1.);
  vec3 t = gsSea(rel, hN, dist) * (1. - 0.28 * smoothstep(0.3, 0.75, fb)) * (0.9 + 0.2 * nT);
  float w = 1. - smoothstep(uCapJ.x + 0.04, uCapJ.y + 0.04, J + (n2 - 0.5) * 0.10 + (n1 - 0.5) * 0.06);
  float dr1 = gsDrift(uNoise, a0), dr2 = gsDrift(uNoise, a0 + vec2(517., 263.));
  fl = vec2(clamp(w * 0.9 + uDrift * dr1 * 0.8, 0., 1.), dr2 * 0.6 * (1. - w));
  return t;
}
void main(){
  vec2 a0 = ${uW} + mod(aOff.xy - ${uW}, ${WIN.toFixed(1)}) - ${(WIN / 2).toFixed(1)};
  float edge = 1. - smoothstep(${(WIN * 0.36).toFixed(1)}, ${(WIN * 0.49).toFixed(1)}, length(a0 - ${uW}));
  float t = aBlade.x, card = step(1.6, aBlade.y), sc = (0.75 + 0.55 * aOff.w) * edge;
  float lu = (aBlade.y - card * 1.7 - 0.5) * 1.5;                                  // metres along the card
  // wind: gusts combing across the swells, the grass flattening on the crowded lips
  float gust = texture2D(uNoise, a0 * vec2(0.0035, 0.0105) + vec2(0.011, -0.034) * uTime).g;
  vec3 gn0; float J0; vec3 d0 = gsOff(a0, uTw, 1., gn0, J0);
  float flt = 1. - smoothstep(uCapJ.x, uCapJ.y + 0.1, J0);
  float bend = (0.2 + 0.85 * gust + 0.7 * flt) * t + 0.08 * sin(uTime * 3.1 + aOff.z * 40. + a0.x * 0.4) * t;
  float wa = (aOff.w - 0.5) * 1.5; vec2 wd = vec2(0.25 * cos(wa) + 0.95 * sin(wa), -0.95 * cos(wa) + 0.25 * sin(wa));
  vec3 gn = gn0; float J = J0; vec3 b = vec3(a0.x + d0.x, d0.y, a0.y + d0.z);
  // the two cards of a tuft stand either side of broadside to the eye and, seen from above, lean back to face it:
  // a tuft is a feathery clump from every height, never a cross
  vec3 Vc = cameraPosition - b; float cd = max(length(Vc), 1e-3); Vc /= cd; float hl = length(Vc.xz); vec2 hd = hl > 1e-3 ? Vc.xz / hl : vec2(0., 1.);
  float ja = (aOff.z - 0.5) * 1.0 + (card - 0.5) * 1.05, cj = cos(ja), sj = sin(ja);
  vec2 sd = vec2(-hd.y * cj - hd.x * sj, -hd.y * sj + hd.x * cj);
  vec3 upF = cross(vec3(sd.x, 0., sd.y), Vc); if (upF.y < 0.) upF = -upF;
  vec3 up = normalize(mix(normalize(gn + vec3(0., 0.5, 0.)), upF, 0.66 * smoothstep(0.08, 0.45, Vc.y)));
  float hgt = t * 1.2 * sc;
  vec3 w = b + vec3(sd.x, 0., sd.y) * lu * sc + up * hgt * (1. - 0.4 * bend) + vec3(wd.x, 0., wd.y) * bend * hgt - up * 0.1;
  vW = w; vT = vec2(t, aBlade.y); vN = normalize(gn + vec3(0., 0.6, 0.)); vSh = gsCloud(w.xz) * gsWaveSh(a0, 0., uTw);
  vC = vec3(aOff.w, 0., aOff.z);
  vec2 fl0; vTint = gsTint(a0, d0.y, J0, gn0.xz, distance(vec3(a0.x + d0.x, d0.y, a0.y + d0.z), cameraPosition), fl0); vFl = vec2(0.);
  vDr = gsDrift(uNoise, a0 + vec2(517., 263.));                                      // the campion's drift where this tuft is rooted: its rest place alone
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`,
        fragmentShader: GLSL_LIGHT + /* glsl */`
uniform vec3 uGrass, uDarkG, uLime, uCap, uAccent; uniform sampler2D uNoise;
varying vec3 vC; varying vec2 vT; varying vec3 vW; varying vec3 vN; varying float vSh; varying vec3 vTint; varying vec2 vFl;
varying float vDr;                                                                   // the campion drift at this blade's rest place, 0..1 (CAMPION DRIFTS IN THE GRASS)
void main(){
  float dist = length(cameraPosition - vW);
  float x = vT.y * 6. + vC.z * 31., i = floor(x), f = fract(x) - 0.5;
  vec2 hk = texture2D(uNoise, vec2((i + 0.5) / 128., vC.x)).rg;
  float h = 0.42 + 0.58 * hk.x, r = vT.x / h;
  f += (hk.y - 0.5) * 1.1 * vT.x * vT.x;
  float seedHead = smoothstep(0.72, 0.85, r) * (1. - smoothstep(0.95, 1., r)) * step(0.45, hk.y);
  float wdt = 0.34 * (1. - r) + 0.17 * seedHead + 0.2 * smoothstep(18., 70., dist) * (1. - r);
  if (r > 1. || abs(f) > wdt) discard;
  float rs = mix(r, 0.55 + 0.45 * r, vC.y);                                          // far cards: less dark at the root, so no dashes
  vec3 alb = mix(mix(uDarkG, uGrass, 0.5) * 0.92, mix(uGrass, uLime, 0.3 + 0.5 * vC.x), smoothstep(0., 0.55, rs));
  float drB = smoothstep(0.5, 0.78, r) * step(0.5, texture2D(uNoise, vec2((i + 0.5) / 128., vC.x)).b - 0.1 - 0.6 * (1. - vDr)); alb = mix(alb, uAccent / max(uAccent.r, max(uAccent.g, uAccent.b)), drB);   // in a campion drift a blade is grass or it flowers, blade by blade (one in three in the drift's core, none at its edge), and a flowering blade's top is the campion's own hue at its full strength, nothing darkened; laid UNDER the seed heads, the caps and the campion heads, which go on over it below exactly as they do outside a drift
  alb = mix(alb, mix(uLime, uCap, 0.5) * 0.95, seedHead * 0.85);
  alb *= (0.85 + 0.3 * hk.x) * vTint;
  float fw = step(0.35, hk.y) * smoothstep(0.5, 0.78, r);                          // far flowers: the heads themselves whiten or redden
  alb = mix(alb, uCap, min(vFl.x, 1.) * max(fw, clamp(vFl.x - 1., 0., 1.) * smoothstep(0.15, 0.45, r))); alb = mix(alb, uAccent, vFl.y * fw * step(0.55, hk.x));   // vFl.x over 1: the whole blade whitens (the comber's peeling line)
  vec3 V = normalize(cameraPosition - vW);
  vec3 c = gsLit(alb, vN, vSh, 1.) * (0.74 + 0.26 * rs) * (1. + 0.1 * vC.y);
  float back = max(dot(-V, uSunDir), 0.); c += alb * uLime * uSunCol * vSh * back * back * 0.9 * r;
  c += uAccent * (vec3(0.05, 0.04, 0.09) + uSkyCol * 0.3) * drB * (1. - seedHead * 0.85) * (1. - min(vFl.x, 1.) * max(fw, clamp(vFl.x - 1., 0., 1.) * smoothstep(0.15, 0.45, r)));   // as the heads do, a rose blade top keeps its colour in shade; none of it on a pale seed head or a whitened top (the same weights as the two lines that lay them on)
  gl_FragColor = vec4(gsFog(gsHold(c), dist, vW.y), 1.);
}` });
      const m = new THREE.Mesh(instGeo(base, nT, { aOff: { a: off, n: 4 } }), mat); m.frustumCulled = false; m.name = name; scene.add(m);
      grassFrag = mat.fragmentShader;
    };
    makeTufts(WIN, 'uWin', Math.round(6400 * detail * clamp(look.density, 0.8, 1.15)), rng.fork ? rng.fork('grass') : rng, 'grass');
    await ctx.yield();
    // a second, denser ring of the same tufts within 22 m of the lens: head-high on the swell's back the sward is continuous, blades overlapping
    U.uWin0 = { value: new THREE.Vector2() };
    { const gf = grassFrag; makeTufts(46, 'uWin0', Math.round(4800 * detail), ctx.core.makeRng(((ctx.seed | 0) ^ 0x19c3) + 733), 'grass-near'); grassFrag = gf; }
    await ctx.yield();
    // ---- the meadow beyond the tufts: broad single cards of the same blades in a 460 m window, turned broadside
    // to the camera, so from 50 m out to 330 m the land is still grass (and its skylines are ragged with it)
    const WIN2 = 460;
    U.uWin2 = { value: new THREE.Vector2() }; U.uFwd = { value: new THREE.Vector2(0, 1) };
    {
      const nC = Math.round(8400 * detail * clamp(look.density, 0.85, 1.1)), gr = ctx.core.makeRng(((ctx.seed | 0) ^ 0x2f1d) + 4421);
      const base = new THREE.BufferGeometry();
      base.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
      const off = new Float32Array(nC * 4); for (let i = 0; i < nC; i++) { off[i * 4] = gr() * WIN2; off[i * 4 + 1] = gr() * WIN2; off[i * 4 + 2] = gr(); off[i * 4 + 3] = gr(); }
      const mat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
        vertexShader: GLSL_SWELL + GLSL_LIGHT + GLSL_SHADE + /* glsl */`
attribute vec4 aOff; uniform vec2 uWin2, uFwd, uCapJ; uniform float uTime; uniform sampler2D uNoise;
varying vec3 vC; varying vec2 vT; varying vec3 vW; varying vec3 vN; varying float vSh; varying vec3 vTint; varying vec2 vFl;
varying float vDr;                                                                   // the campion drift at this blade's rest place, 0..1 (CAMPION DRIFTS IN THE GRASS)
// the meadow's broad tones, the same fields the ground shader paints: dark cool troughs, bright crests, patches,
// and where daisy caps (fl.x) and campion drifts (fl.y) lie
uniform float uDrift, uRelK; uniform vec2 uBackDir;
vec3 gsTint(vec2 a0, float y, float J, vec2 nxz, float dist, out vec2 fl){
  float n1 = texture2D(uNoise, a0 * 0.0027).r, n2 = texture2D(uNoise, a0 * 0.017 + 0.37).g, nT = texture2D(uNoise, a0 * 0.037 + 0.71).a;
  float fb = n1 * 0.45 + texture2D(uNoise, a0 * 0.0071 + 0.19).b * 0.33 + n2 * 0.22;
  float hN = smoothstep(-1., 0.95, y / max(uTr[0].w, 1.));
  float rel = clamp(dot(nxz, uBackDir) * 3.4, -1., 1.);
  vec3 t = gsSea(rel, hN, dist) * (1. - 0.28 * smoothstep(0.3, 0.75, fb)) * (0.9 + 0.2 * nT);
  float w = 1. - smoothstep(uCapJ.x + 0.04, uCapJ.y + 0.04, J + (n2 - 0.5) * 0.10 + (n1 - 0.5) * 0.06);
  float dr1 = gsDrift(uNoise, a0), dr2 = gsDrift(uNoise, a0 + vec2(517., 263.));
  fl = vec2(clamp(w * 0.9 + uDrift * dr1 * 0.8, 0., 1.), dr2 * 0.6 * (1. - w));
  return t;
}
void main(){
  vec2 a0 = uWin2 + mod(aOff.xy - uWin2, ${WIN2.toFixed(1)}) - ${(WIN2 / 2).toFixed(1)};
  float edge = 1. - smoothstep(${(WIN2 * 0.3).toFixed(1)}, ${(WIN2 * 0.48).toFixed(1)}, length(a0 - uWin2));
  vec3 gn; float J; vec3 d = gsOff(a0, uTw, 1., gn, J);
  vec3 b = vec3(a0.x + d.x, d.y, a0.y + d.z);
  float cd = distance(b, cameraPosition);
  edge *= smoothstep(34., 62., cd);                                            // the real tufts take over near the camera
  float t = position.y, ja = (aOff.z - 0.5) * 1.1, ca = cos(ja), sa = sin(ja);
  vec3 Vc = (cameraPosition - b) / max(cd, 1e-3); float hl = length(Vc.xz); vec2 hd = hl > 1e-3 ? Vc.xz / hl : vec2(0., 1.);
  vec2 side = vec2(-hd.y, hd.x); side = vec2(side.x * ca - side.y * sa, side.x * sa + side.y * ca);
  vec2 urB; float nfB; float bowB = gsShape(a0, urB, nfB).z;
  float rimC = max(smoothstep(0.9, 0.985, cos(uTr[0].z * dot(uTr[0].xy, a0) - uTo[0].x * uTw - uTo[0].y)) * smoothstep(0.55, 0.9, smoothstep(-1., 0.95, d.y / max(uTr[0].w, 1.))), smoothstep(0.5, 0.9, bowB)) * smoothstep(45., 150., cd);
  float wid = (1.9 + 1.5 * aOff.w) * (1. + cd * 0.004), hgt = (1.25 + 0.6 * aOff.w) * edge * (1. + cd * 0.0022) * (1. + 0.6 * rimC);
  float gust = texture2D(uNoise, a0 * vec2(0.0035, 0.0105) + vec2(0.011, -0.034) * uTime).g;
  float flt = 1. - smoothstep(uCapJ.x, uCapJ.y + 0.1, J);
  float bend = (0.2 + 0.85 * gust + 0.7 * flt) * t + 0.07 * sin(uTime * 3.1 + aOff.z * 40. + a0.x * 0.4) * t;
  vec3 upF = cross(vec3(side.x, 0., side.y), Vc); if (upF.y < 0.) upF = -upF;      // seen from above the cards lean back to face the eye
  vec3 up = normalize(mix(normalize(gn + vec3(0., 0.4, 0.)), upF, 0.72));
  vec3 w = b + vec3(side.x, 0., side.y) * position.x * wid + up * t * hgt * (1. - 0.4 * bend) + vec3(0.25, 0., -0.95) * bend * t * hgt - up * 0.15;
  vW = w; vT = vec2(t, (position.x * 0.5 + 0.5) * 1.5); vN = normalize(gn + vec3(0., 0.6, 0.)); vSh = gsCloud(w.xz) * gsWaveSh(a0, 0., uTw);
  vC = vec3(aOff.w, 1., aOff.z);
  vTint = gsTint(a0, d.y, J, gn.xz, cd, vFl); vFl *= smoothstep(40., 75., cd);
  vTint *= 1. + 1.0 * rimC; vFl.x = max(vFl.x, rimC * (0.8 + 1.0 * step(0.45, aOff.z)));
  vDr = gsDrift(uNoise, a0 + vec2(517., 263.));                                      // the campion's drift where this card is rooted: its rest place alone
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`,
        fragmentShader: grassFrag });
      const m = new THREE.Mesh(instGeo(base, nC, { aOff: { a: off, n: 4 } }), mat); m.frustumCulled = false; m.name = 'far-grass'; scene.add(m);
    }
    await ctx.yield();
    // ---- the comber's grass: the meadow's own cards, shader and tones planted on the hero's lip (its grass side comes as
    // a texture of positions), so where the land stands up against the tor it is still the same meadow, tufted to its outline
    {
      const LIP = hero.lip, nL = 5800, lr = ctx.core.makeRng(((ctx.seed | 0) ^ 0x6b1f) + 1231);
      const base = new THREE.BufferGeometry();
      base.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 1, 1, 0, -1, 0, 0, 1, 1, 0, -1, 1, 0], 3));
      const aLp = new Float32Array(nL * 4);
      for (let i = 0; i < nL; i++) {
        const a = clamp(lr.gauss() * 1.05, -2.3, 2.3);
        const cls = lr();                                                                       // two fifths on the rising face, a sixth along the crest where it turns over, the rest on top of the thrown lip
        aLp[i * 4] = ((a / TAU) % 1 + 1) % 1 * LIP.segments; aLp[i * 4 + 1] = cls < 0.4 ? lr.range(0.15, 6.0) : cls < 0.56 ? lr.range(6.0, 10.5) : lr.range(8.0, LIP.rows - 1.2); aLp[i * 4 + 2] = lr(); aLp[i * 4 + 3] = lr();
        if (cls >= 0.56) aLp[i * 4] += 1000;                                                    // the thrown lip wears its meadow on top: the far side of the sheet
      }
      const mat = new THREE.ShaderMaterial({ uniforms: { ...U, uLip: { value: LIP.texture } }, side: THREE.DoubleSide,
        vertexShader: GLSL_SWELL + GLSL_LIGHT + GLSL_SHADE + /* glsl */`
attribute vec4 aLp; uniform sampler2D uLip, uNoise; uniform vec2 uCapJ; uniform float uTime;
varying vec3 vC; varying vec2 vT; varying vec3 vW; varying vec3 vN; varying float vSh; varying vec3 vTint; varying vec2 vFl;
varying float vDr;                                                                   // the campion drift at this blade's rest place, 0..1 (CAMPION DRIFTS IN THE GRASS)
` + GLSL_TINT + /* glsl */`
vec4 gsLipT(float i, float v){ return texture2D(uLip, vec2((i + 0.5) / ${LIP.segments.toFixed(1)}, (v + 0.5) / ${LIP.rows.toFixed(1)})); }
void main(){
  float soilS = step(500., aLp.x), ax = aLp.x - 1000. * soilS;
  float i0 = floor(ax), fi = ax - i0, v0 = floor(aLp.y), fv = aLp.y - v0;
  vec4 A = gsLipT(i0, v0), B = gsLipT(i0 + 1., v0), C = gsLipT(i0, v0 + 1.), D = gsLipT(i0 + 1., v0 + 1.);
  vec4 P = mix(mix(A, B, fi), mix(C, D, fi), fv);
  vec3 nn = cross(B.xyz - A.xyz, C.xyz - A.xyz); float nl = length(nn);
  vec3 Nl = nl > 1e-4 ? nn / nl : vec3(0., 1., 0.);
  float tt = aLp.y < 7. ? 0.45 * aLp.y / 7. : 0.45 + 0.55 * (aLp.y - 7.) / 14.;                 // 0 at the foot, 0.45 where it peels, 1 at the torn tip
  // sods on the soil side: through the sheet (its thickness thins toward the tip), in rags
  float hang = smoothstep(-0.3, -0.65, Nl.y) * (1. - soilS);                                      // the grass side where it hangs face down: the hollow, bare soil and roots
  P.xyz -= Nl * soilS * (0.5 + (2.4 * pow(max(1. - tt, 0.), 0.8) + 3.4 * smoothstep(0.25, 0.55, tt) * (1. - smoothstep(0.82, 1., tt))) * min(1., P.w * 2.2)); Nl = mix(Nl, -Nl, soilS);
  vec3 b = (modelMatrix * vec4(P.xyz, 1.)).xyz, wn = normalize(mat3(modelMatrix) * Nl);
  float ragN = texture2D(uNoise, vec2(ax * 0.021, aLp.y * 0.043)).r;
  float show = smoothstep(0.04, 0.2, P.w) * mix(1., 0.8 + 0.2 * ragN, soilS) * (1. - 0.5 * smoothstep(0.93, 1., tt)) * (1. - hang);
  vec2 a0 = b.xz; vec3 gn; float J; vec3 d = gsOff(a0, uTw, 1., gn, J);
  float cd = distance(b, cameraPosition); vec3 Vc = (cameraPosition - b) / max(cd, 1e-3);
  // blades grow out of the sod and turn up toward the light; the card stands broadside to the eye along that line
  vec3 G = normalize(wn * 0.8 + vec3(0., 0.55, 0.));
  vec3 sdv = cross(G, Vc); float sl = length(sdv);
  if (sl > 0.05) sdv /= sl; else { sdv = cross(vec3(0., 1., 0.), Vc); sdv = length(sdv) > 1e-3 ? normalize(sdv) : vec3(1., 0., 0.); }
  vec3 upF = cross(Vc, sdv); if (dot(upF, G) < 0.) upF = -upF;
  vec3 up = normalize(mix(G, upF, 0.7));
  float t = position.y, wid = (1.7 + 1.4 * aLp.z) * (1. + cd * 0.004), hgt = (1.25 + 0.7 * aLp.z) * show * (1. + cd * 0.0022);
  float gust = texture2D(uNoise, a0 * vec2(0.0035, 0.0105) + vec2(0.011, -0.034) * uTime).g;
  float bend = (0.3 + 0.8 * gust) * t + 0.07 * sin(uTime * 3.1 + aLp.w * 40. + a0.x * 0.4) * t;
  vec3 w = b + wn * 0.15 + sdv * position.x * wid * show + up * t * hgt * (1. - 0.3 * bend) + vec3(0.25, 0., -0.95) * bend * t * hgt * 0.6;
  vW = w; vT = vec2(t, (position.x * 0.5 + 0.5) * 1.5); vN = normalize(gn + vec3(0., 0.6, 0.));
  vSh = gsCloud(w.xz) * gsWaveSh(a0, max(w.y - d.y, 0.), uTw);
  vC = vec3(aLp.z, 1., aLp.w);
  vTint = gsTint(a0, d.y, J, gn.xz, cd, vFl);
  vTint *= 1. + 0.25 * soilS;                                                                   // the crest catches the light
  // the crest line: the torn streak of the season's flowers runs the whole length of the comber. On top of the thrown lip it is the
  // leading third of the sheet (and torn patches behind it); on the rising face it is where the sheet stands upright and turns over.
  // It is broken card by card (aLp.w) and by a fine noise along the lip, never by gaps longer than a few metres
  float peelN = texture2D(uNoise, vec2(ax * 0.11, 0.31)).g * 0.5 + 0.5 * aLp.w;
  float peel = soilS * max(smoothstep(0.62, 0.74, tt) * smoothstep(0.14, 0.3, peelN), smoothstep(0.5, 0.6, tt) * smoothstep(0.42, 0.58, peelN));
  float crestC = (1. - soilS) * smoothstep(0.34, 0.42, tt) * (1. - smoothstep(-0.25, -0.5, Nl.y)) * smoothstep(0.16, 0.32, peelN);
  vTint *= 1. + 0.35 * crestC;
  vFl = vec2(max(max(vFl.x, max(peel, crestC) * 1.9), 0.6 * step(0.62, aLp.w)), vFl.y);
  vDr = 0.;                                                                          // no drift on the comber: its grass stays as it is
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`,
        fragmentShader: grassFrag });
      const m = new THREE.Mesh(instGeo(base, nL, { aLp: { a: aLp, n: 4 } }), mat); m.frustumCulled = false; m.name = 'lip-grass'; hero.object.add(m);
      hero.setMeadow(new THREE.Color(0.62, 0.66, 0.6));
    }
    await ctx.yield();

    const GLSL_BASIS = /* glsl */`
mat3 gsBasis(vec2 a0, float tw, float lean, out vec3 gn, out float J, out vec3 base){
  vec3 d = gsOff(a0, tw, 1., gn, J); base = vec3(a0.x + d.x, d.y, a0.y + d.z);
  vec3 up = normalize(mix(vec3(0., 1., 0.), gn, lean)); vec3 tx = normalize(vec3(up.y, -up.x, 0.));
  return mat3(tx, up, cross(tx, up));
}`;
    // ---- flower heads: daisies (caps open and whiten where the land crowds) and campion streaming above the grass
    {
      const nF = Math.round(11000 * detail * look.density), fr = rng.fork ? rng.fork('flowers') : rng;
      const base = new THREE.BufferGeometry();
      base.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
      const off = new Float32Array(nF * 4); for (let i = 0; i < nF; i++) { off[i * 4] = fr() * WIN; off[i * 4 + 1] = fr() * WIN; off[i * 4 + 2] = fr(); off[i * 4 + 3] = fr(); }
      const mat = new THREE.ShaderMaterial({ uniforms: U,
        vertexShader: GLSL_SWELL + GLSL_LIGHT + GLSL_SHADE + /* glsl */`
attribute vec4 aOff; uniform vec2 uWin, uCapJ; uniform float uTime; uniform sampler2D uNoise;
varying vec2 vUv; varying vec4 vK; varying vec3 vW; varying float vSh;
void main(){
  vec2 a0 = uWin + mod(aOff.xy - uWin, ${WIN.toFixed(1)}) - ${(WIN / 2).toFixed(1)};
  float edge = 1. - smoothstep(${(WIN * 0.36).toFixed(1)}, ${(WIN * 0.49).toFixed(1)}, length(a0 - uWin));
  float pch = texture2D(uNoise, a0 * 0.017 + 0.37).g * 0.6 + texture2D(uNoise, a0 * 0.0027).r * 0.5;
  vec3 gn; float J; vec3 d = gsOff(a0, uTw, 1., gn, J);
  float w = 1. - smoothstep(uCapJ.x, uCapJ.y + 0.02, J);
  float campion = step(0.86, aOff.w);
  float dr1 = gsDrift(uNoise, a0), dr2 = gsDrift(uNoise, a0 + vec2(517., 263.));
  float keep = mix(smoothstep(0.2, 0.6, dr1 + w * 0.5 + aOff.z * 0.15), smoothstep(0.2, 0.6, dr2 + aOff.z * 0.15), campion);   // heads lie in drifts and on the caps
  float gust = texture2D(uNoise, a0 * vec2(0.0035, 0.0105) + vec2(0.011, -0.034) * uTime).g;
  float h = mix(0.75 + 0.5 * aOff.z, 1.45 + 0.4 * aOff.z, campion);
  vec3 p = vec3(a0.x + d.x, d.y, a0.y + d.z) + gn * h;
  float sway = (0.3 + 0.9 * gust) * mix(0.5, 1., campion) + 0.12 * sin(uTime * (2.6 + aOff.z) + aOff.z * 50.);
  p.xz += vec2(0.25, -0.95) * sway * h * 0.55;
  vec4 mv = viewMatrix * vec4(p, 1.); float dist = -mv.z;
  float s = mix(0.13 + 0.11 * w, 0.19, campion) * (0.75 + 0.5 * aOff.z);
  // between the drifts, within a stone's throw of the eye, campion still stands above the grass (two heads in five) and a lone daisy
  // here and there: flowers in the near grass always, plain grass farther off
  keep = max(keep, step(mix(0.9, 0.6, campion), fract(aOff.z * 7.13)) * (1. - smoothstep(24., 44., dist)));
  s = min(max(s, min(dist, 70.) * 0.0042), max(dist, 0.5) * 0.011) * edge * keep;      // heads stay a few pixels across out to the window's edge, and none fills more than a fiftieth of the frame at the lens
  mv.xy += position.xy * s;
  vUv = position.xy; vK = vec4(campion, aOff.z, w, dist); vW = p; vSh = gsCloud(p.xz) * gsWaveSh(a0, 1., uTw);
  gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: GLSL_LIGHT + /* glsl */`
uniform vec3 uCap, uAccent, uEye; varying vec2 vUv; varying vec4 vK; varying vec3 vW; varying float vSh;
void main(){
  float r = length(vUv), ang = atan(vUv.y, abs(vUv.x) < 1e-4 ? 1e-4 : vUv.x) + vK.y * 6.283;
  float lobes = mix(11., 5., vK.x), pet = 0.74 + 0.26 * cos(ang * lobes) * mix(0.6, 1., vK.x);
  if (r > pet) discard;
  vec3 alb = mix(uCap, uAccent * (0.75 + 0.5 * vK.y), vK.x);
  float eye = 1. - smoothstep(0.2, 0.3, r);
  alb = mix(alb, mix(uEye, vec3(0.95, 0.85, 0.75), vK.x), eye * (1. - 0.6 * vK.x));
  alb *= 0.82 + 0.18 * smoothstep(0.2, 0.9, r);
  vec3 n = normalize(vec3(vUv.x * 0.5, 1., vUv.y * 0.5));
  vec3 c = gsLit(alb, n, vSh, 0.6) + alb * (vec3(0.05, 0.04, 0.09) + uSkyCol * 0.3);   // a lilac shadow side; a head keeps its colour in shade
  gl_FragColor = vec4(gsFog(gsHold(c), vK.w, vW.y), 1.);
}` });
      const m = new THREE.Mesh(instGeo(base, nF, { aOff: { a: off, n: 4 } }), mat); m.frustumCulled = false; m.name = 'flowers'; scene.add(m);
    }

    await ctx.yield();
    // ---- erratics: lichened granite boulders half sunk in the meadow, riding their circles
    {
      const er = rng.fork ? rng.fork('erratics') : rng, want = Math.round(290 * Math.max(detail, 0.75));
      const rock = (dt) => { const ico = new THREE.IcosahedronGeometry(1, dt).toNonIndexed(), P = ico.attributes.position;
      for (let i = 0; i < P.count; i++) {
        const x = P.getX(i), y = P.getY(i), z = P.getZ(i);
        const k = 1 + 0.26 * ctx.noise.n3(x * 1.3 + 7, y * 1.3, z * 1.3) + 0.1 * ctx.noise.n3(x * 3.1, y * 3.1 + 5, z * 3.1);
        const q = (v) => Math.sign(v) * Math.pow(Math.abs(v), 0.8);              // squarer, like jointed blocks
        P.setXYZ(i, q(x) * k, q(y) * k * 0.72, q(z) * k);
      }
      ico.computeVertexNormals();
      { const Nn = ico.attributes.normal, q = new THREE.Vector3(), r = new THREE.Vector3(); for (let i = 0; i < P.count; i++) { q.fromBufferAttribute(Nn, i); r.fromBufferAttribute(P, i).normalize(); q.lerp(r, 0.55).normalize(); Nn.setXYZ(i, q.x, q.y, q.z); } }
      return ico; };
      const ico = rock(1), icoFar = rock(0);                               // erratics never nearer than 70 m to the rail are built of a quarter of the triangles
      const anc = [], rs = [], ancF = [], rsF = [];
      for (let tries = 0; (anc.length + ancF.length) / 2 < want && tries < want * 12; tries++) {
        if (tries % 60 === 59) await ctx.yield();
        const s = Math.floor(er.range(0, rail.N - 150)), side = er() < 0.5 ? -1 : 1, lat = 8 + 420 * Math.pow(er(), 2.2), ahead = er.range(-30, 60);
        const h = Math.atan2(rail.X[Math.min(s + 4, rail.N)] - rail.X[s], rail.Z[Math.min(s + 4, rail.N)] - rail.Z[s]);
        const wx = rail.X[s] + Math.cos(h) * lat * side + Math.sin(h) * ahead, wz = rail.Z[s] - Math.sin(h) * lat * side + Math.cos(h) * ahead;
        if (Math.hypot(wx - TOR.x, wz - TOR.z) < 215) continue;
        const r0 = swell.inv(wx, wz, rail.TWs[s], {}), size = er.range(1, 4) * (er() < 0.12 ? 1.5 : 1) * 0.55;
        if (railGap(r0.x0, r0.z0, size * 1.2) < 7.5 + size) continue;
        (lat > 70 ? ancF : anc).push(r0.x0, r0.z0); (lat > 70 ? rsF : rs).push(er.range(0, TAU), size * er.range(0.8, 1.3), size * er.range(0.7, 1.2), er());
      }
      // four big lichened erratics set beside the rail on the swell's back and on the face, passed at 12-18 m
      const setOnes = [[262, -27, 2.6], [330, 26, 3.2], [374, -31, 3.4], [1085, 14, 2.4]];
      for (let k = 0; k < 15; k++) setOnes.push([132 + k * 26, (k % 2 ? 1 : -1) * (k % 3 === 0 ? 9.5 : k % 3 === 1 ? 15 : 21), 1.1 + 0.9 * ((k * 0.37) % 1)]);                 // up the climb: one every 26 m, passed at 8-20 m
      for (let k = 0; k < 12; k++) setOnes.push([1060 + k * 27, (k % 2 ? 1 : -1) * (k % 3 === 0 ? 10 : k % 3 === 1 ? 17 : 26), 1.0 + 1.0 * ((k * 0.43) % 1)]);                  // and along the surf line
      for (const [s, lat, size] of setOnes) {
        const h = Math.atan2(rail.X[s + 4] - rail.X[s], rail.Z[s + 4] - rail.Z[s]), r0 = swell.inv(rail.X[s] + Math.cos(h) * lat, rail.Z[s] - Math.sin(h) * lat, rail.TWs[s], {});
        if (railGap(r0.x0, r0.z0, size * 1.2) < 5.5 + size) continue;
        anc.push(r0.x0, r0.z0); rs.push(s * 1.7, size, size * 0.9, (s % 7) / 7);
      }
      const n = anc.length / 2;
      const mat = new THREE.ShaderMaterial({ uniforms: U,
        vertexShader: GLSL_SWELL + GLSL_LIGHT + GLSL_SHADE + GLSL_BASIS + /* glsl */`
attribute vec2 aAnc; attribute vec4 aRS; varying vec3 vN; varying vec3 vL; varying vec3 vW; varying vec2 vSh;
void main(){
  float c = cos(aRS.x), s = sin(aRS.x);
  vec3 l = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c) * vec3(aRS.y, aRS.z, aRS.y);
  vec3 nl = vec3(normal.x * c - normal.z * s, normal.y, normal.x * s + normal.z * c);
  vec3 gn; float J; vec3 base; mat3 B = gsBasis(aAnc, uTw, 1., gn, J, base);
  l.y += aRS.z * 0.22;
  vW = base + B * l; vN = B * nl; vL = position * aRS.y + aRS.w * 37.; vSh = vec2(gsCloud(vW.xz) * gsWaveSh(aAnc, 1., uTw), smoothstep(-0.1, 0.5, l.y / max(aRS.z, 0.1)));
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`,
        fragmentShader: GLSL_LIGHT + /* glsl */`
uniform sampler2D uNoise; uniform vec3 uLime, uGrass; varying vec3 vN; varying vec3 vL; varying vec3 vW; varying vec2 vSh;
void main(){
  vec3 n = normalize(vN);
  float a = texture2D(uNoise, vL.xz * 0.21 + vL.y * 0.13).r, b = texture2D(uNoise, vL.xy * 0.9 + vL.z * 0.31).g, c2 = texture2D(uNoise, vL.zy * 0.33).b;
  vec3 alb = vec3(0.4, 0.42, 0.43) * (0.65 + 0.7 * a) * (0.8 + 0.4 * b);
  float c3 = texture2D(uNoise, vL.xz * 0.11 + vL.y * 0.07 + 0.3).a;
  alb = mix(alb, vec3(0.5, 0.52, 0.44), smoothstep(0.45, 0.6, c3) * 0.6);                                      // pale grey-green crust
  alb = mix(alb, vec3(0.5, 0.37, 0.1), smoothstep(0.46, 0.6, c2) * smoothstep(-0.1, 0.6, n.y) * 0.85);       // ochre lichen in patches
  alb *= 0.9 + 0.25 * texture2D(uNoise, vL.xy * 2.3 + vL.z * 1.7).r;                                           // grain
  alb = mix(alb, uGrass * 0.6, (1. - vSh.y) * 0.8);                                                         // moss and turf at the foot
  alb *= 0.5 + 0.5 * vSh.y;
  vec3 c = gsLit(alb, n, vSh.x, 0.) + alb * (uSunCol * vec3(0.07, 0.11, 0.05) + uSkyCol * 0.4 * (0.6 + 0.4 * n.y));   // shade on granite is slate, not black
  gl_FragColor = vec4(gsFog(c, length(cameraPosition - vW), vW.y), 1.);
}` });
      const m = new THREE.Mesh(instGeo(ico, n, { aAnc: { a: new Float32Array(anc), n: 2 }, aRS: { a: new Float32Array(rs), n: 4 } }), mat);
      m.frustumCulled = false; m.name = 'erratics'; scene.add(m);
      if (!ancF.length) { ancF.push(anc[0], anc[1]); rsF.push(0, 1, 1, 0.5); }
      const mF = new THREE.Mesh(instGeo(icoFar, ancF.length / 2, { aAnc: { a: new Float32Array(ancF), n: 2 }, aRS: { a: new Float32Array(rsF), n: 4 } }), mat);
      mF.frustumCulled = false; mF.name = 'erratics-far'; scene.add(mF); disposables.push(ico, icoFar);
    }
    await ctx.yield();

    // ---- copses: round-crowned trees on pads of roots and bracken, leaning with the slope, crowns lagging their trunks
    // level 2: the copses we fly over and through; 1: copses within about 150 m of the rail; 0: far copses.
    // A crown is built of rounded leaf clumps (each a ball of leaf-spray cards that shades as one form, lit on
    // one side, blue on the other) round a dark core, with branches showing in the gaps between them.
    const makeTreeGeo = async (level, tr) => {
      const hi = level === 2;
      const pos = [], nor = [], part = [], uv = [], shd = [], M = new THREE.Matrix4(), v = new THREE.Vector3(), nv = new THREE.Vector3(), N3 = new THREE.Matrix3();
      const push = (g, m, id, crownFn, uvFn, shFn) => {
        const ng = g.index ? g.toNonIndexed() : g, P = ng.attributes.position, Nn = ng.attributes.normal; N3.getNormalMatrix(m);
        for (let i = 0; i < P.count; i++) {
          v.fromBufferAttribute(P, i).applyMatrix4(m); nv.fromBufferAttribute(Nn, i).applyMatrix3(N3).normalize();
          pos.push(v.x, v.y, v.z); nor.push(nv.x, nv.y, nv.z); part.push(crownFn(v), id); shd.push(shFn ? shFn(v, nv) : 1);
          const q = uvFn ? uvFn(i) : [0, 0]; uv.push(q[0], q[1]);
        }
        ng.dispose(); if (ng !== g) g.dispose();
      };
      const finish = () => {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
        g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 2)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        g.setAttribute('aSh', new THREE.Float32BufferAttribute(shd, 1));
        g.userData.clumps = clumps; return g;
      };
      const TH = 9.5, lag = (p) => smoothstep(3, 14, p.y), CC = new THREE.Vector3(0, 13.2, 0), CR = new THREE.Vector3(5.7, 4.3, 5.7);
      const trunk = new THREE.CylinderGeometry(0.34, 0.62, TH + 1.5, hi ? 8 : level ? 6 : 5, hi ? 4 : level ? 3 : 2, true); trunk.translate(0, (TH + 1.5) / 2 - 0.3, 0);
      { const P = trunk.attributes.position; for (let i = 0; i < P.count; i++) { const y = P.getY(i), f = 1 + 1.3 * Math.pow(1 - clamp(y / 3, 0, 1), 3); P.setX(i, P.getX(i) * f + 0.25 * Math.sin(y * 0.5)); P.setZ(i, P.getZ(i) * f); } trunk.computeVertexNormals(); }
      push(trunk, M.identity(), 0, lag);
      // clump centres: a shell of the crown's ellipsoid plus a few inner ones
      const nCl = level === 2 ? 24 : level === 1 ? 11 : 6, clumps = [];
      for (let i = 0, t = 0; i < nCl && t < 400; t++) {
        const th = tr.range(0, TAU), cy = tr.range(-0.5, 1), sr = Math.sqrt(Math.max(0, 1 - cy * cy)), rf = i % 5 === 4 ? tr.range(0.45, 0.65) : tr.range(0.82, 1.02);
        const c = new THREE.Vector3(CC.x + Math.cos(th) * sr * CR.x * rf, CC.y + cy * CR.y * rf, CC.z + Math.sin(th) * sr * CR.z * rf);
        const cr = level === 2 ? tr.range(1.45, 2.15) : level === 1 ? tr.range(1.9, 2.7) : tr.range(2.5, 3.4);
        if (clumps.some((k) => k.c.distanceTo(c) < (k.r + cr) * 0.62)) continue;
        clumps.push({ c, r: cr, rf, out: c.clone().sub(CC).divide(CR) }); i++;
      }
      await ctx.yield();
      { const core = new THREE.IcosahedronGeometry(1, 0); for (let i = 0; i < core.attributes.position.count; i++) core.attributes.normal.setXYZ(i, core.attributes.position.getX(i), core.attributes.position.getY(i), core.attributes.position.getZ(i));
        if (level) push(core, M.makeScale(3.2, 2.5, 3.2).setPosition(CC.x, CC.y, CC.z), 1, lag, null, () => 0.26); else core.dispose(); }
      if (level) for (let i = 0; i < clumps.length && i < (hi ? 8 : 5); i++) {              // branches from the fork to the outer clumps, seen in the gaps
        const c = clumps[i].c, a = new THREE.Vector3(0, TH - 0.6, 0), d = c.clone().sub(a), L = d.length();
        const g = new THREE.CylinderGeometry(0.07, 0.2, L, 4, 1, true); g.translate(0, L / 2, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
        push(g, M.compose(a, q, new THREE.Vector3(1, 1, 1)), 0, lag);
      }
      const quadUv = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]], sgn = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]];
      const d = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3(), f = new THREE.Vector3(), cn = new THREE.Vector3(), UP = new THREE.Vector3(0.21, 0.97, 0.13);
      const GRID = level === 2 ? 7 : level === 1 ? 5 : 6, nCard = level === 2 ? 10 : level === 1 ? 6 : 2;
      for (let ci = 0; ci < clumps.length; ci++) {
        const k = clumps[ci], outer = clamp(k.out.length(), 0, 1.1), occ = 0.42 + 0.62 * smoothstep(0.35, 1, outer);      // inner clumps sit in the crown's own shade
        if (!level) {                                                         // far: the clump is one lumpy ball
          const g = new THREE.IcosahedronGeometry(1, 0), P = g.attributes.position;
          for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i), kk = 1 + 0.3 * ctx.noise.n3(x * 1.7 + k.c.x, y * 1.7 + k.c.y, z * 1.7); P.setXYZ(i, x * kk, y * kk * 0.85, z * kk); g.attributes.normal.setXYZ(i, x, y, z); }
          push(g, M.makeScale(k.r, k.r, k.r).setPosition(k.c.x, k.c.y, k.c.z), 1, lag, null, (pv, n) => occ * (0.78 + 0.3 * n.y));
        }
        for (let j = 0; j < nCard; j++) {
          const th = tr.range(0, TAU), cy = tr.range(-0.55, 1), sr = Math.sqrt(Math.max(0, 1 - cy * cy));
          d.set(Math.cos(th) * sr, cy, Math.sin(th) * sr);
          f.copy(d).lerp(v.set(tr.range(-1, 1), tr.range(-0.3, 1), tr.range(-1, 1)).normalize(), 0.4).normalize();          // the spray's own facing
          t1.crossVectors(f, UP).normalize(); t2.crossVectors(f, t1);
          const sz = k.r * tr.range(0.95, 1.35) * (level ? 1 : 1.25), rr = k.r * (level ? tr.range(0.6, 0.9) : 0.95);
          cn.copy(d).multiplyScalar(0.72).addScaledVector(k.out, 0.5).normalize();                                          // shades as part of the clump's ball and of the crown
          const sh = occ * (0.74 + 0.34 * (0.5 + 0.5 * d.y)) * (0.8 + 0.3 * smoothstep(-0.2, 0.8, d.dot(k.out) / Math.max(outer, 0.2)));
          for (let q = 0; q < 6; q++) {
            v.copy(k.c).addScaledVector(d, rr).addScaledVector(t1, sgn[q][0] * sz * 0.5).addScaledVector(t2, sgn[q][1] * sz * 0.5);
            pos.push(v.x, v.y, v.z); nor.push(cn.x, cn.y, cn.z); part.push(lag(v), 2 + (GRID - 5) * 0.1); shd.push(sh); uv.push(quadUv[q][0] * GRID, quadUv[q][1] * GRID); k.reach = Math.max(k.reach || 0, v.distanceTo(k.c));
          }
        }
        if (ci % 6 === 5) await ctx.yield();
      }
      if (!hi) return finish();
      const pad = new THREE.ConeGeometry(3.4, 0.9, 10, 1, true); pad.translate(0, 0.25, 0); push(pad, M.identity(), 3, () => 0);
      for (let i = 0; i < 14; i++) {                                  // bracken fronds arching off the pad
        const a = i / 14 * TAU + tr.range(-0.2, 0.2), r = tr.range(1.6, 3.6), g = new THREE.PlaneGeometry(1.5, 2.2, 1, 2), P = g.attributes.position;
        for (let k = 0; k < P.count; k++) { const y = P.getY(k) + 1.1; P.setY(k, y * (1 - 0.18 * y)); P.setZ(k, 0.3 * y * y); }
        g.computeVertexNormals();
        push(g.toNonIndexed(), M.makeRotationY(a).setPosition(Math.sin(a) * r, 0.15, Math.cos(a) * r), 4, () => 0, (k) => [[0, 0], [1, 0], [0, 0.5], [1, 0], [1, 0.5], [0, 0.5], [0, 0.5], [1, 0.5], [0, 1], [1, 0.5], [1, 1], [0, 1]][k % 12]);
      }
      return finish();
    };
    const treeMat = new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
      vertexShader: GLSL_SWELL + GLSL_LIGHT + GLSL_SHADE + GLSL_BASIS + /* glsl */`
attribute vec2 aPart; attribute vec2 aAnc; attribute vec4 aRS; attribute float aSh; uniform float uTime;
varying vec3 vN; varying vec3 vW; varying vec4 vK; varying vec2 vUv; varying vec3 vL; varying float vSh; varying vec3 vCn;
void main(){
  float c = cos(aRS.x), s = sin(aRS.x);
  vec3 l = vec3(position.x * c - position.z * s, position.y, position.x * s + position.z * c) * aRS.y;
  vec3 nrm0 = normal;
  vec3 nl = vec3(nrm0.x * c - nrm0.z * s, nrm0.y, nrm0.x * s + nrm0.z * c);
  vec3 gn; float J; vec3 b0; mat3 B0 = gsBasis(aAnc, uTw, 0.85, gn, J, b0);
  vec3 g1; float J1; vec3 b1; mat3 B1 = gsBasis(aAnc, uTw - 0.45, 0.85, g1, J1, b1);
  float lag = aPart.x, leaf = step(0.5, aPart.y) * step(aPart.y, 2.5);
  // leaves flutter; whole crowns breathe in the gusts
  float fl = sin(uTime * 2.3 + l.x * 0.7 + aRS.w * 30.) * 0.2 + sin(uTime * 5.1 + l.y * 1.3 + l.z) * 0.16 * step(1.5, aPart.y);
  l.xz += vec2(0.25, -0.95) * (0.35 + fl * 2.) * lag * leaf; l.y += fl * 0.8 * lag * leaf * step(1.5, aPart.y);
  vec3 w0 = B0 * l, w1 = b1 - b0 + B1 * l;
  vW = b0 + mix(w0, w1, lag * 0.8); vN = normalize(mix(B0 * nl, B1 * nl, lag * 0.8));
  { vec3 cl = (position - vec3(0., 13.2, 0.)) / vec3(5.7, 4.3, 5.7) + vec3(0., 0.12, 0.); cl /= max(length(cl), 1e-3); vCn = B0 * vec3(cl.x * c - cl.z * s, cl.y, cl.x * s + cl.z * c); }   // the crown's own rounded form: the way out from its middle
  vK = vec4(aPart.y, aRS.z, gsCloud(vW.xz) * gsWaveSh(aAnc, l.y, uTw), aRS.w); vUv = uv; vL = position; vSh = aSh;
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`,
      fragmentShader: GLSL_LIGHT + /* glsl */`
uniform sampler2D uNoise; uniform vec3 uCrown, uCrownLit, uGrass, uDarkG, uLime; uniform float uTime, uBlossom;
varying vec3 vN; varying vec3 vW; varying vec4 vK; varying vec2 vUv; varying vec3 vL; varying float vSh; varying vec3 vCn;
void main(){
  float id = vK.x; vec3 n = normalize(vN); if (!gl_FrontFacing && (id < 1.5 || id > 2.5)) n = -n;
  vec3 V = normalize(cameraPosition - vW); float tr = 0.; vec3 alb;
  float nA = texture2D(uNoise, vL.xz * 0.27 + vL.y * 0.19).r, nB = texture2D(uNoise, vL.xy * 0.9 + vL.z * 0.4).g, leafV = 1., hxL = -1.;
  float dcam = length(cameraPosition - vW), lod = smoothstep(20., 62., dcam), nearK = smoothstep(3., 15., dcam);   // nearK: leaves shrink to nothing inside 3 m of the lens
  if (id > 0.5 && id < 2.5 && dcam < 3.) discard;
  if (id < 0.5) {                                                        // bark: ridged, lichen-green on the weather side
    float ridge = texture2D(uNoise, vec2(atan(vL.z, abs(vL.x) < 1e-4 ? 1e-4 : vL.x) * 1.3, vL.y * 0.09)).b;
    float rd2 = texture2D(uNoise, vec2(atan(vL.z, abs(vL.x) < 1e-4 ? 1e-4 : vL.x) * 3.1, vL.y * 0.035)).r;
    alb = vec3(0.27, 0.215, 0.16) * (0.3 + 0.75 * ridge + 0.75 * smoothstep(0.35, 0.65, rd2)); alb = mix(alb, uDarkG * 0.5, 0.35 * nA);
  } else if (id < 2.5) {
    if (id > 1.5) {                                                      // leaf sprays: alpha-tested clusters
      float keep = 0., hx = 0.5, ly = 1.;                                // two leaf lattices, turned against each other, so no dot screen shows
      // a spray is a rounded, lumpy tuft, never a square plate: cut to a wobbling radius round the card's middle
      { float G = 5. + floor((id - 2.) * 10. + 0.5); vec2 cq = vUv / G - 0.5; float wob = texture2D(uNoise, cq * 0.13 + vK.w * 7.3 + vL.yz * 0.011).g;
        if (length(cq) * 2. > 0.6 + 0.52 * wob) discard;
        if (texture2D(uNoise, vL.xy * 0.19 + vL.z * 0.13 + vK.w * 3.).a < 0.2 * lod) discard; }                    // a few sky holes in a far crown
      for (int q = 0; q < 2; q++) {
        vec2 uq = q == 0 ? vUv : vec2(vUv.x * 0.8 - vUv.y * 0.53, vUv.x * 0.53 + vUv.y * 0.8) * 0.87 + 3.37;
        vec2 ci = floor(uq), cf = fract(uq) - 0.5;
        vec4 hh = textureLod(uNoise, (ci * 7. + 0.5 + floor(vK.w * 97.) + float(q) * 31.) / 128., 0.);
        cf -= (hh.xy - 0.5) * 0.42; float la = hh.z * 12.566, lc = cos(la), ls = sin(la), sz = max((0.7 + 0.5 * hh.w) * (1. + 1.5 * lod) * nearK, 1e-3);
        vec2 lr = vec2(cf.x * lc - cf.y * ls, cf.x * ls + cf.y * lc);
        if (lr.x * lr.x / (0.2 * sz) + lr.y * lr.y / (0.1 * sz) <= 1. && hh.w > 0.2 && nearK > 0.03) { keep = 1.; hx = hh.x; ly = abs(lr.y); }
      }
      if (keep < 0.5) discard;
      leafV = mix(0.75 + 0.5 * hx - 0.25 * (1. - smoothstep(0.0, 0.02, ly)), 1., 0.75 * lod); hxL = hx;
    }
    float nC = texture2D(uNoise, vL.zy * 0.47 + vL.x * 0.23).b, nD = texture2D(uNoise, vL.xz * 1.9 + vL.y * 1.1).a;
    if (id < 1.5 && abs(dot(n, V)) < 0.5 * (0.2 + nB * 0.7 + nD * 0.5)) discard;                 // ragged, leafy silhouette
    n = normalize(n * 2.4 + (vec3(nA, nC, nB) - 0.5) * 1.0 + (vec3(nD, nB, nD) - 0.5) * 0.4);
    vec3 cn3 = vCn / max(length(vCn), 1e-3); n = normalize(mix(n, cn3, 0.3 + 0.5 * lod));                       // from far off a crown shades as one rounded mass: a lit top and sunward side, a shaded underside
    alb = mix(uCrown, uCrownLit, (0.06 + 0.5 * nA * nC + 0.3 * vK.y) * (1. - uBlossom)) * mix(0.5 + 0.5 * nB + 0.4 * nD, 0.95, 0.6 * lod) * leafV;
    alb *= mix(vec3(0.92, 1.02, 0.9), vec3(1.1, 0.98, 0.9), vK.y);                // every tree its own cast

    alb = mix(alb, uCrownLit * (0.8 + 0.3 * nB), uBlossom * (hxL < 0. ? smoothstep(0.4, 0.62, nD * 0.55 + nA * 0.55 + 0.12 * vK.y) : mix(step(hxL, 0.5 + 0.45 * nA), smoothstep(0.38, 0.6, nA * 1.1 + 0.12 * vK.y), lod)));   // near: each leaf is blossom or leaf, whole     // spring: blossom in drifts over the leaves
    alb = mix(alb, uLime * 0.85, smoothstep(0.1, -0.6, n.y) * 0.45);          // lime undersides
    // the inner crown is shade seen between sprays: dark toward the centre, darker in the gaps between leaf clusters
    alb *= id < 1.5 ? vSh * (0.62 + 0.6 * smoothstep(0.35, 0.65, nD)) : vSh * 1.08;
    alb *= mix(1., 0.62 + 0.5 * smoothstep(-0.55, 0.45, cn3.y), 0.35 + 0.65 * lod);
    tr = 0.3;
  } else if (id < 3.5) { alb = mix(vec3(0.13, 0.1, 0.07), uDarkG * 0.7, 0.35 + 0.5 * nA); }                    // root pad
  else { float e = abs(vUv.x - 0.5) * 2.; if (e > 1. - 0.75 * vUv.y + 0.18 * sin(vUv.y * 40.) ) discard; alb = mix(uDarkG, uGrass, vUv.y) * (0.7 + 0.5 * nB); tr = 0.6; }
  vec3 c = gsLit(alb, n, vK.z, tr);
  float back = max(dot(-V, uSunDir), 0.); c += alb * uLime * uSunCol * vK.z * back * back * tr * 0.8;
  if (id < 0.5) c += alb * (uSkyCol * 0.25 + uSunCol * 0.12);                       // trunks keep their brown in shade
  float leafy = step(0.5, id) * step(id, 2.5);
  c *= mix(1., 0.72 + 0.28 * smoothstep(8., 16., vL.y), leafy);
  // sky and sun seen through the canopy: undersides glow lime, with flecks of direct sun
  float under = smoothstep(0.25, -0.5, n.y) * leafy, fleck = smoothstep(0.6, 0.78, texture2D(uNoise, vL.xz * 0.9 + vL.y * 0.7 + uTime * 0.02).a);
  c += alb * (uSkyCol * 0.9 + uLime * uSunCol * vK.z * (0.25 + 1.1 * fleck)) * under;                             // shade inside the crown's underside
  gl_FragColor = vec4(gsFog(c, length(cameraPosition - vW), vW.y), 1.);
}` });
    U.uCrown = { value: pal.crown }; U.uCrownLit = { value: pal.crownLit }; U.uBlossom = { value: pal.blossom };
    const treeAnchors = [];
    {
      const tr = rng.fork ? rng.fork('trees') : rng, o = {};
      const hiA = [], hiR = [], loA = [], loR = [], midA = [], midR = [], drop = [];
      const railDist = (x0, z0) => { let b = 1e9; for (let q = 0; q <= rail.N; q += 8) { const dx = rail.X[q] - x0, dz = rail.Z[q] - z0, dd = dx * dx + dz * dz; if (dd < b) b = dd; } return Math.sqrt(b); };
      const headAt = (s) => Math.atan2(rail.X[Math.min(s + 6, rail.N)] - rail.X[s], rail.Z[Math.min(s + 6, rail.N)] - rail.Z[s]);
      const restOf = (wx, wz, s) => { swell.inv(wx, wz, rail.TWs[s], o); return [o.x0, o.z0]; };
      // the entry copse: riding the trough under the first 60 m, crowns 8 m below the camera
      // (its trees are drawn from the copse's own stream, so its gap from the rail never deals the country's other trees)
      { const s0 = 84, c = restOf(rail.X[s0], rail.Z[s0], s0), er = ctx.core.makeRng(((ctx.seed | 0) ^ 0x4e21) + 77);   // a stream of its own, made without a draw from the world's
        for (let i = 0, t = 0; i < 13 && t < 300; t++) {
          if (t % 8 === 7) await ctx.yield();
          const a = er.range(0, TAU), r = 24 * Math.sqrt(er()), x0 = c[0] + Math.cos(a) * r, z0 = c[1] + Math.sin(a) * r - 4, sc = er.range(1.22, 1.42);
          let ok = railGap(x0, z0, 17.4 * sc) > 12.5; for (let k = 0; k < hiA.length; k += 2) if (Math.hypot(hiA[k] - x0, hiA[k + 1] - z0) < 6.5) ok = false;   // room round the crowns as we pass over them
          if (!ok) continue; hiA.push(x0, z0); hiR.push(er.range(0, TAU), sc, er(), er()); i++;
        } }
      await ctx.yield();
      // the wayside copse at the foot of the swell's back: six trees 14-34 m from the rail where it comes down to the grass, passed at crown height
      { const s0 = 196, h = headAt(s0), fx = Math.sin(h), fz = Math.cos(h), wr = ctx.core.makeRng(((ctx.seed | 0) ^ 0x7a31) + 611);
        const cx = rail.X[s0] - fz * 27, cz = rail.Z[s0] + fx * 27;
        for (let i = 0, t = 0; i < 6 && t < 200; t++) {
          if (t % 8 === 7) await ctx.yield();
          const a = wr.range(0, TAU), r = 15 * Math.sqrt(wr()), c = restOf(cx + Math.cos(a) * r, cz + Math.sin(a) * r * 1.5, s0), sc = wr.range(1.12, 1.34);
          let ok = railGap(c[0], c[1], 17.4 * sc) > 10.5; for (let k = 0; k < hiA.length; k += 2) if (Math.hypot(hiA[k] - c[0], hiA[k + 1] - c[1]) < 7) ok = false;
          if (!ok) continue; hiA.push(c[0], c[1]); hiR.push(wr.range(0, TAU), sc, wr(), wr()); i++;
        } }
      await ctx.yield();
      // the drop-through copse on the dark face (the journey's own beat): two files of tall trunks 11 m apart, crowns closing overhead
      { const s0 = 924, h = headAt(s0), fx = Math.sin(h), fz = Math.cos(h);
        for (let row = 0; row < 3; row++) for (let i = -3; i <= 3; i++) for (const side of [-1, 1]) {
          if (row === 2 && (i + 3) % 2) continue;
          const along = i * 8.5 + tr.range(-2, 2), lat = side * (row === 0 ? tr.range(5.6, 6.6) : row === 1 ? tr.range(13, 17) : tr.range(22, 28));
          const sA = clamp(Math.round(s0 + along), 0, rail.N), wx = rail.X[sA] + fz * lat, wz = rail.Z[sA] - fx * lat, c = restOf(wx, wz, sA), sc = tr.range(1.16, 1.3);
          if (railGap(c[0], c[1], 9.5 * sc) < 4.8) continue;
          drop.push(hiA.length, sA); hiA.push(c[0], c[1]); hiR.push(tr.range(0, TAU), sc, tr(), tr());
        } }
      await ctx.yield();
      // one of the country's copses is moored on this swell's back by a rule of the swell: a rest place drawn along crest C0's line as it
      // stands at clock 0 (z CREST0), up to one crest-to-crest (600 m) either way along the crest from the country's meridian x 0 and from the
      // crest down its back as far as the trough (0 to half a crest-to-crest, 300 m): it leans and rights itself as the swell runs on under it
      { const wr = ctx.core.makeRng(((ctx.seed | 0) ^ 0x3c57) + 97), L0 = TAU / trains[0].k, cx = wr.range(-L0, L0), cz = CREST0 - wr.range(0, L0 / 2);
        for (let i = 0, t = 0; i < 7 && t < 200; t++) {
          const a = wr.range(0, TAU), r = 15 * Math.sqrt(wr()), c = [cx + Math.cos(a) * r, cz + Math.sin(a) * r], sc = wr.range(1.0, 1.25);
          let ok = railGap(c[0], c[1], 17.4 * sc) > 26; for (let k = 0; k < midA.length; k += 2) if (Math.hypot(midA[k] - c[0], midA[k + 1] - c[1]) < 7) ok = false;
          if (!ok) continue; midA.push(c[0], c[1]); midR.push(wr.range(0, TAU), sc, wr(), wr()); i++;
        } }
      await ctx.yield();
      // twelve copses in sight of the rail, then far ones out to the horizon
      const copse = (cx, cz, n, rad) => {
        for (let i = 0, t = 0; i < n && t < n * 8; t++) {
          const a = tr.range(0, TAU), r = rad * 0.8 * Math.sqrt(tr()), x0 = cx + Math.cos(a) * r, z0 = cz + Math.sin(a) * r, sc = tr.range(0.85, 1.2);
          if (Math.hypot(x0 - TOR.x, z0 - TOR.z) < 270 || railGap(x0, z0, 18.5 * sc) < 60) continue;
          const near = railDist(x0, z0) < 190; (near ? midA : loA).push(x0, z0); (near ? midR : loR).push(tr.range(0, TAU), sc, tr(), tr()); i++;
        }
      };
      const mids = [[140, -1, 90], [230, 1, 150], [330, -1, 230], [420, 1, 70], [520, -1, 180], [610, 1, 260], [700, -1, 60], [800, 1, 190], [1010, -1, 140], [1100, 1, 90], [1230, 1, 330], [1320, -1, 150], [1190, 1, 150], [1310, 1, 215]];
      for (const [s, side, lat] of mids) { const h = headAt(s), L = lat * tr.range(0.85, 1.25) * side; copse(rail.X[s] + Math.cos(h) * L, rail.Z[s] - Math.sin(h) * L, tr.int(8, 16), tr.range(17, 26)); await ctx.yield(); }
      // three copses moored in the slack water beyond the tor's left shoulder, in the frame through the long approach
      for (const [cx, cz, n] of [[TOR.x + 250, TOR.z + 235, 9], [TOR.x + 165, TOR.z + 375, 11], [TOR.x - 150, TOR.z + 460, 10]]) { copse(cx, cz, n, 22); await ctx.yield(); }
      // two more copses moored in the open country round the tor: places by seeded draw, a bearing all round it and a distance from it
      { const c2 = ctx.core.makeRng(((ctx.seed | 0) ^ 0x2b6d) + 1907);
        for (const n of [10, 12]) { const a = c2.range(0, TAU), r = c2.range(330, 520); copse(TOR.x + Math.cos(a) * r, TOR.z - Math.sin(a) * r, n, 20); await ctx.yield(); } }
      if (rogue) for (const cx of [rogue.x + 190, rogue.x - 110, rogue.x - 430]) { copse(cx, rogue.zc(15) + tr.range(-12, 12), 10, 24); await ctx.yield(); }
      const nFar = Math.round(9 * detail * look.density);
      for (let i = 0, t = 0; i < nFar && t < 400; t++) {
        const cx = tr.range(-3400, 1500), cz = tr.range(150, 3900); let d = 1e9;
        for (let s = 0; s <= rail.N; s += 40) d = Math.min(d, Math.hypot(rail.X[s] - cx, rail.Z[s] - cz));
        if (d < 380) continue; copse(cx, cz, tr.int(8, 14), tr.range(18, 30)); i++; await ctx.yield();
      }
      await ctx.yield();
      const hiG = await makeTreeGeo(2, tr); await ctx.yield();
      // EVERY NEAR TREE IS KEPT OFF THE LENS BY PLACE, AT BUILD (lead's amendment, 9 Oct 2026): at the moments the lens passes, with the wave clock anywhere within 0.9 s of
      // its table, no trunk or branch pole of a full-detail tree stands within 2.0 m of the flown path, no crown's core within 3.5 m, no leaf card (its flutter added) within
      // 3.0 m. A tree that fails keeps its drawn turn and is stepped straight away from the rail in plan (a tree of the drop-through copse from its own rail point, along its
      // lateral; any other from the rail's nearest point), 0.5 m at a time to 14 m, to the first place that passes and stands 4.2 m from every other near tree; if none does
      // it is not planted. No die is drawn or dropped: the trees are drawn above as they always were, and the tree's model (clumps and poles, from the trees' stream) is not
      // drawn until the line above, so the test stands here. It is laid against the world's own path, clock table and swell, as railGap is; nothing reads the lens while the
      // world runs. The bound, with 0.4 m in hand for bark, 0.3 m for the core and 0.2 m for leaves for its steps (lens places 0.5 m apart; the clock on every tenth of a second within the span and on its two ends): trunk and
      // poles as the lines between the posed ends of their frusta (makeTreeGeo's own numbers), the core by a plane across its posed corners less 0.393 m of sway, each leaf
      // clump as a ball of its cards' reach swept between its least and greatest lag plus 0.7636 m of flutter; posed as the trees' shader poses them (turn, scale, lean 0.85,
      // the stand 0.45 s ago mixed in by 0.8 lag).
      { const KB = 2.4, KC = 3.8, KL = 3.2, lagOf = (y) => 0.8 * smoothstep(3, 14, y), v3 = new THREE.Vector3(), PL = [], P = [], S = [], o0 = {}, o1 = {}, R2 = [0, 0];
        for (let d = 0; d <= path.length; d += 0.5) { path.posAtDist(d, v3); PL.push(v3.x, v3.y, v3.z, twOfU(d / path.length)); }
        // the model: points [x, y, z, 0.8 lag, drift] and lines [point, point, radius by scale, radius, threshold]: trunk rows, fork and pole ends, the core's corners, each clump twice
        for (let k = 0; k < 5; k++) { const y = -0.3 + 2.75 * k; P.push(0.25 * Math.sin(0.5 * y), y, 0, lagOf(y), 0); if (k < 4) S.push(k, k + 1, (0.62 - 0.07 * k) * (1 + 1.3 * (1 - clamp(y / 3, 0, 1)) ** 3), 0, KB); }
        P.push(0, 8.9, 0, lagOf(8.9), 0); hiG.userData.clumps.slice(0, 8).forEach((k, i) => { P.push(k.c.x, k.c.y, k.c.z, lagOf(k.c.y), 0); S.push(5, 6 + i, 0.2, 0.12, KB); });
        const iCore = P.length / 5, gr = (1 + Math.sqrt(5)) / 2, gl = Math.hypot(1, gr); let cr = 0;
        for (const [a, b, c] of [[-1, gr, 0], [1, gr, 0], [-1, -gr, 0], [1, -gr, 0], [0, -1, gr], [0, 1, gr], [0, -1, -gr], [0, 1, -gr], [gr, 0, -1], [gr, 0, 1], [-gr, 0, -1], [-gr, 0, 1]]) { const y = 13.2 + 2.5 * b / gl; P.push(3.2 * a / gl, y, 3.2 * c / gl, lagOf(y), 0.35 * lagOf(y) / 0.8); }
        for (const k of hiG.userData.clumps) { const i = P.length / 5; P.push(k.c.x, k.c.y, k.c.z, lagOf(k.c.y - k.reach), 0.35, k.c.x, k.c.y, k.c.z, lagOf(k.c.y + k.reach), 0.35); S.push(i, i + 1, k.reach, 0.7636, KL); cr = Math.max(cr, Math.hypot(k.c.x, k.c.y - 13.2, k.c.z) + k.reach); }
        const nP = P.length / 5, nS = S.length / 5, nL = PL.length / 4, NG = Math.ceil(PL[PL.length - 1] * 20) + 128, LX = new Float64Array(nP * 3), W = new Float64Array(nP * 3), ST = new Int32Array(nL * 21 * 4), TB = new Float64Array((NG + nL * 4) * 12), stamp = new Int32Array(NG);
        const RT = Math.max(KL + 0.7636, KB, KC), sp = 1.12 * trains.reduce((a, t) => a + t.A * t.om, 0) + 6, far = 0.36 * sp, wide = trains.reduce((a, t) => a + t.A, 0) + far + RT + 0.35;   // sp: no point of a tree travels faster (the land's own speed and the lean's turning); far: the most a lagging part stands from its unlagged place; wide, with the tree's own reach: the farthest in plan from its rest place that the lens can matter
        let nST = 0, worst = 0, cur = 0, sx = 0, sy = 0, sz = 0, ex = 0, ey = 0, ez = 0, a0 = 0, a1 = 0;
        // the tree's stand at a clock: base and basis (the shader's gsBasis, lean 0.85), 12 numbers at TB[k]; on the clock's grid of a twentieth of a second it is worked out once a tree place
        const stand = (x0, z0, tw, k) => { swell.at(x0, z0, tw, o0); let ux = o0.nx * 0.85, uy = 0.15 + o0.ny * 0.85, uz = o0.nz * 0.85; const ul = Math.hypot(ux, uy, uz); ux /= ul; uy /= ul; uz /= ul; let tx = uy, ty = -ux; const tl = Math.hypot(tx, ty); tx /= tl; ty /= tl;
          TB[k] = o0.x; TB[k + 1] = o0.y; TB[k + 2] = o0.z; TB[k + 3] = tx; TB[k + 4] = ty; TB[k + 5] = 0; TB[k + 6] = ux; TB[k + 7] = uy; TB[k + 8] = uz; TB[k + 9] = ty * uz; TB[k + 10] = -tx * uz; TB[k + 11] = tx * uy - ty * ux; return k; };
        const grid = (x0, z0, j) => (stamp[j + 64] === cur ? (j + 64) * 12 : (stamp[j + 64] = cur, stand(x0, z0, j * 0.05, (j + 64) * 12)));
        // how near the lens at place p comes to the trunk's line (the stand at a) and to the crown's middle, taken along the line between where the stands at a and at b carry it; less than 0: within reach
        const reach = (p, a, b, sc) => { const bx = TB[a] - PL[p], by = TB[a + 1] - PL[p + 1], bz = TB[a + 2] - PL[p + 2], ly = 13.2 * sc, t = clamp(-(bx * TB[a + 6] + by * TB[a + 7] + bz * TB[a + 8]), 0, 10.7 * sc);
          const cx = bx + TB[a + 6] * ly, cy = by + TB[a + 7] * ly, cz = bz + TB[a + 8] * ly, fx = TB[b] - TB[a] + (TB[b + 6] - TB[a + 6]) * ly, fy = TB[b + 1] - TB[a + 1] + (TB[b + 7] - TB[a + 7]) * ly, fz = TB[b + 2] - TB[a + 2] + (TB[b + 8] - TB[a + 8]) * ly;
          const u = clamp(-(cx * fx + cy * fy + cz * fz) / (fx * fx + fy * fy + fz * fz || 1), 0, 1); R2[0] = Math.hypot(bx + TB[a + 6] * t, by + TB[a + 7] * t, bz + TB[a + 8] * t) - 1.8 * sc - far - KB; R2[1] = Math.hypot(cx + fx * u, cy + fy * u, cz + fz * u) - cr * sc - 0.35 - RT; };
        const put = (p, a, b, sc) => { reach(p, a, b, sc); if (R2[0] < 0 || R2[1] < 0) { const q = nST++ * 4; ST[q] = p; ST[q + 1] = a; ST[q + 2] = b; ST[q + 3] = R2[1] < 0 ? 1 : 0; } };
        // the states of a tree standing at rest (x0, z0): [lens place, stand now, stand 0.45 s ago, crown within reach], kept where trunk or crown is within reach
        const states = (x0, z0, sc) => { nST = 0; cur++; const w2 = (wide + (13.2 + cr) * sc) ** 2;
          for (let p = 0; p < PL.length; p += 4) { if ((PL[p] - x0) ** 2 + (PL[p + 2] - z0) ** 2 > w2) continue; const tw = PL[p + 3], j0 = Math.round(tw * 20); let near = false;
            for (let j = -18; j <= 18 && !near; j += 9) { const a = grid(x0, z0, j0 + j); reach(p, a, a, sc); near = R2[0] < 0.28 * sp || R2[1] < far + 0.28 * sp; }   // five clocks of the span: nothing travels more than 0.28 sp between one of them and any clock of the span
            if (!near) continue;
            for (let j = Math.ceil((tw - 0.9) * 10); j <= (tw + 0.9) * 10; j++) put(p, grid(x0, z0, j * 2), grid(x0, z0, j * 2 - 9), sc);
            for (let e = 0; e < 2; e++) { const k = (NG + p + e * 2) * 12; put(p, stand(x0, z0, tw + e * 1.8 - 0.9, k), stand(x0, z0, tw + e * 1.8 - 1.35, k + 12), sc); } } };
        const pose = (i0, i1) => { for (let i = i0; i < i1; i++) { const lx = LX[i * 3], ly = LX[i * 3 + 1], lz = LX[i * 3 + 2], g = P[i * 5 + 3];
            const ax = TB[a0 + 3] * lx + TB[a0 + 6] * ly + TB[a0 + 9] * lz, ay = TB[a0 + 4] * lx + TB[a0 + 7] * ly + TB[a0 + 10] * lz, az = TB[a0 + 5] * lx + TB[a0 + 8] * ly + TB[a0 + 11] * lz;
            const bx = ex + TB[a1 + 3] * lx + TB[a1 + 6] * ly + TB[a1 + 9] * lz, by = ey + TB[a1 + 4] * lx + TB[a1 + 7] * ly + TB[a1 + 10] * lz, bz = ez + TB[a1 + 5] * lx + TB[a1 + 8] * ly + TB[a1 + 11] * lz;
            W[i * 3] = sx + ax + (bx - ax) * g; W[i * 3 + 1] = sy + ay + (by - ay) * g; W[i * 3 + 2] = sz + az + (bz - az) * g; } };
        const segs = (s0, s1, sc) => { for (let k = s0; k < s1; k++) { const i = S[k * 5] * 3, j = S[k * 5 + 1] * 3, qx = W[j] - W[i], qy = W[j + 1] - W[i + 1], qz = W[j + 2] - W[i + 2], qq = qx * qx + qy * qy + qz * qz;
            const u = qq > 0 ? clamp(-(W[i] * qx + W[i + 1] * qy + W[i + 2] * qz) / qq, 0, 1) : 0, d = Math.hypot(W[i] + qx * u, W[i + 1] + qy * u, W[i + 2] + qz * u) - S[k * 5 + 2] * sc - S[k * 5 + 3] - S[k * 5 + 4]; if (d < worst) worst = d; } };
        // does the tree, turned rot, stand clear in every state last made?
        const clear = (rot, sc) => { const c = Math.cos(rot), s = Math.sin(rot); worst = 1e9;
          for (let i = 0; i < nP; i++) { const x = P[i * 5], z = P[i * 5 + 2], dr = P[i * 5 + 4]; LX[i * 3] = sc * (x * c - z * s) + 0.25 * dr; LX[i * 3 + 1] = sc * P[i * 5 + 1]; LX[i * 3 + 2] = sc * (x * s + z * c) - 0.95 * dr; }
          for (let q = 0; q < nST * 4 && worst > 0; q += 4) { const p = ST[q]; a0 = ST[q + 1]; a1 = ST[q + 2]; sx = TB[a0] - PL[p]; sy = TB[a0 + 1] - PL[p + 1]; sz = TB[a0 + 2] - PL[p + 2]; ex = TB[a1] - TB[a0]; ey = TB[a1 + 1] - TB[a0 + 1]; ez = TB[a1 + 2] - TB[a0 + 2];
            pose(0, 6); segs(0, 4, sc);
            if (ST[q + 3]) { pose(6, nP); segs(4, nS, sc); let mx = 0, my = 0, mz = 0, h = -1e9; for (let i = iCore; i < iCore + 12; i++) { mx += W[i * 3]; my += W[i * 3 + 1]; mz += W[i * 3 + 2]; } const ml = Math.hypot(mx, my, mz) || 1;
              for (let i = iCore; i < iCore + 12; i++) h = Math.max(h, -(W[i * 3] * mx + W[i * 3 + 1] * my + W[i * 3 + 2] * mz) / ml); worst = Math.min(worst, -h - 0.393 - KC); } }
          return worst > 0; };
        for (let i = hiA.length - 2, j = drop.length - 2; i >= 0; i -= 2) { const sc = hiR[i * 2 + 1]; let s = 0, ok = false;   // last planted first, so that a tree not planted leaves the others' numbers in the lists as they are
          if (j >= 0 && drop[j] === i) { s = drop[j + 1]; j -= 2; } else for (let q = 0, b = 1e9; q <= rail.N; q++) { const d = (rail.X[q] - hiA[i]) ** 2 + (rail.Z[q] - hiA[i + 1]) ** 2; if (d < b) { b = d; s = q; } }
          swell.at(hiA[i], hiA[i + 1], rail.TWs[s], o1); const wx = o1.x, wz = o1.z, dl = Math.hypot(wx - rail.X[s], wz - rail.Z[s]) || 1, ux = (wx - rail.X[s]) / dl, uz = (wz - rail.Z[s]) / dl;   // where it stands as its rail point is passed, and the way straight out from that point
          for (let n = 0; n <= 28 && !ok; n++) { await ctx.yield(); const c = n ? restOf(wx + ux * 0.5 * n, wz + uz * 0.5 * n, s) : [hiA[i], hiA[i + 1]]; let room = true;
            if (n) { swell.at(c[0], c[1], rail.TWs[s], o1); const fx = o1.x, fy = o1.y, fz = o1.z; for (let k = 0; k < hiA.length && room; k += 2) if (k !== i) { swell.at(hiA[k], hiA[k + 1], rail.TWs[s], o1); room = Math.hypot(o1.x - fx, o1.y - fy, o1.z - fz) >= 4.2; } }
            if (room) { states(c[0], c[1], sc); if (clear(hiR[i * 2], sc)) { ok = true; if (n) { hiA[i] = c[0]; hiA[i + 1] = c[1]; } } } }
          if (!ok) { hiA.splice(i, 2); hiR.splice(i * 2, 4); } } }
      for (let i = 0; i < hiA.length; i += 2) treeAnchors.push(hiA[i], hiA[i + 1], hiR[i * 2 + 1]);
      for (let i = 0; i < midA.length; i += 2) treeAnchors.push(midA[i], midA[i + 1], midR[i * 2 + 1]);
      for (let i = 0; i < loA.length; i += 2) treeAnchors.push(loA[i], loA[i + 1], loR[i * 2 + 1]);
      const midG = await makeTreeGeo(1, tr); await ctx.yield(); const loG = await makeTreeGeo(0, tr); await ctx.yield();
      if (!midA.length) { midA.push(loA[0] ?? 0, loA[1] ?? 0); midR.push(0, 1, 0.5, 0.5); }
      const mid = new THREE.Mesh(instGeo(midG, midA.length / 2, { aAnc: { a: new Float32Array(midA), n: 2 }, aRS: { a: new Float32Array(midR), n: 4 } }), treeMat);
      mid.frustumCulled = false; mid.name = 'copses-mid'; scene.add(mid); disposables.push(midG);
      const hi = new THREE.Mesh(instGeo(hiG, hiA.length / 2, { aAnc: { a: new Float32Array(hiA), n: 2 }, aRS: { a: new Float32Array(hiR), n: 4 } }), treeMat);
      const lo = new THREE.Mesh(instGeo(loG, loA.length / 2, { aAnc: { a: new Float32Array(loA), n: 2 }, aRS: { a: new Float32Array(loR), n: 4 } }), treeMat);
      hi.frustumCulled = lo.frustumCulled = false; hi.name = 'copses-near'; lo.name = 'copses-far'; scene.add(hi, lo);
      disposables.push(hiG, loG);
    }
    await ctx.yield();

    // ---- crest-runners: built facing +Z; legs, mane and tail are posed in the vertex shader from the stride phase
    // aB = (kind, p1, p2): 0 body, 1 neck and head, 2 leg (leg id, metres down the leg), 3 mane (along, height), 4 tail (along, side)
    const makeRunnerGeo = (hi) => {
      const pos = [], nor = [], aB = [], v = new THREE.Vector3(), nv = new THREE.Vector3(), M = new THREE.Matrix4(), N3 = new THREE.Matrix3();
      const push = (g, m, fn) => {
        const ng = g.index ? g.toNonIndexed() : g, P = ng.attributes.position, Nn = ng.attributes.normal; N3.getNormalMatrix(m);
        for (let i = 0; i < P.count; i++) {
          const raw = v.fromBufferAttribute(P, i).clone(); v.applyMatrix4(m); nv.fromBufferAttribute(Nn, i).applyMatrix3(N3).normalize();
          const k = fn(v, raw); pos.push(v.x, v.y, v.z); nor.push(nv.x, nv.y, nv.z); aB.push(k[0], k[1], k[2]);
        }
        ng.dispose(); if (ng !== g) g.dispose();
      };
      // body: deep narrow chest tapering to the loin
      { const g = new THREE.SphereGeometry(1, hi ? 10 : 6, hi ? 8 : 5); g.rotateX(Math.PI / 2); const P = g.attributes.position;
        for (let i = 0; i < P.count; i++) { const z = P.getZ(i), f = 0.78 + 0.3 * smoothstep(-0.6, 0.7, z), y = P.getY(i); P.setXYZ(i, P.getX(i) * 0.55 * f, (y < 0 ? y * (0.56 + 0.26 * smoothstep(-0.3, 0.8, z)) : y * 0.46) * f + 0.06 * z, z * 1.32); }
        g.computeVertexNormals(); push(g, M.makeTranslation(0, 2.0, 0), () => [0, 0, 0]); }
      // neck (long and low) and a small tapering head with back-swept ears
      { const g = new THREE.CylinderGeometry(0.2, 0.39, 1.75, hi ? 7 : 4, hi ? 3 : 1, true); g.translate(0, 0.875, 0);
        push(g, M.makeRotationX(1.02).setPosition(0, 2.2, 0.95), () => [1, 0, 0]);
        const h = new THREE.ConeGeometry(0.27, 0.95, hi ? 7 : 4, 1); h.rotateX(Math.PI / 2); h.scale(0.85, 1.05, 1);
        push(h, M.makeRotationX(0.25).setPosition(0, 3.2, 2.62), () => [1, 1, 0]);
        for (const sx of [-1, 1]) { const e = new THREE.BufferGeometry(); e.setAttribute('position', new THREE.Float32BufferAttribute([sx * 0.1, 3.33, 2.36, sx * 0.13, 3.25, 2.22, sx * 0.2, 3.62, 1.88], 3)); e.computeVertexNormals(); push(e, M.identity(), () => [1, 2, 0]); } }
      // four two-jointed legs: stored as cross-sections round the leg axis; the shader bends them at hip and hock
      for (let id = 0; id < 4; id++) {
        const g = new THREE.CylinderGeometry(1, 1, 1.7, hi ? 5 : 3, hi ? 4 : 2, true);
        push(g, M.identity(), (p) => { const s = 0.85 - p.y, r = (0.17 - 0.055 * s) * (1 + 0.35 * Math.exp(-((s - 0.85) ** 2) * 30)) * (s > 1.6 ? 1.3 : 1); const o = [2, id, s]; p.set(p.x * r, 0, p.z * r); return o; });
      }
      // mane: a standing strip from poll to withers; tail: a plume of crossed strips
      { const n = hi ? 8 : 3;
        for (let i = 0; i < n; i++) { const t0 = i / n, t1 = (i + 1) / n, P0 = [0, 3.12 - 0.86 * t0, 2.3 - 1.36 * t0], P1 = [0, 3.12 - 0.86 * t1, 2.3 - 1.36 * t1];
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...P0, ...P1, ...P1, ...P0, ...P1, ...P0], 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([1, 0.3, 0, 1, 0.3, 0, 1, 0.3, 0, 1, 0.3, 0, 1, 0.3, 0, 1, 0.3, 0], 3));
          let k = 0; const hs = [0, 0, 1, 0, 1, 1], ts = [t0, t1, t1, t0, t1, t0]; push(g, M.identity(), () => { const o = [3, ts[k], hs[k]]; k++; return o; }); }
        const m = hi ? 5 : 3;
        for (let c = 0; c < (hi ? 2 : 1); c++) for (let i = 0; i < m; i++) { const t0 = i / m, t1 = (i + 1) / m;
          const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(new Array(18).fill(0), 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute([1, 0.4, 0, 1, 0.4, 0, 1, 0.4, 0, 1, 0.4, 0, 1, 0.4, 0, 1, 0.4, 0], 3));
          let k = 0; const ss = [-1, -1, 1, -1, 1, 1], ts = [t0, t1, t1, t0, t1, t0]; push(g, M.identity(), (p) => { const o = [4, ts[k], ss[k] * (c ? 0.5 : 1)]; p.set(c, 0, 0); k++; return o; }); }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 3));
      return g;
    };
    const HERD_VERT = GLSL_SWELL + GLSL_LIGHT + /* glsl */`
attribute vec3 aB; attribute vec4 aRun; uniform vec4 uHerdK; uniform vec2 uHd; uniform float uTime;
varying vec3 vN; varying vec3 vW; varying vec4 vK; varying vec3 vL;
void main(){
  float kind = aB.x, sc = aRun.w, seed = aRun.z, calf = step(sc, 0.8);
  float stride = uHerdK.z * (1. + 0.08 * (seed - 0.5)) + seed * 7.; float ph = fract(stride);
  vec3 l = position; vec3 nl = normal;
  float th = 0.1 * sin(6.2832 * ph + 0.8), bob = 0.14 * sin(12.566 * ph + 1.) + 0.06;
  bob += calf * 1.5 * max(0., sin(3.14159 * clamp(fract(stride / 5.) * 5., 0., 1.)));          // calves pronk every fifth stride
  if (kind < 0.5) { l.y += l.z * th; }
  else if (kind < 1.5) { l.y += 0.9 * th - (l.z - 0.9) * th * 1.3; l.z += 0.06 * sin(6.2832 * ph); }
  else if (kind < 2.5) {
    float id = aB.y, s = aB.z, fore = step(1.5, id), side = mod(id, 2.) * 2. - 1.;
    float o = id < 0.5 ? 0. : id < 1.5 ? 0.1 : id < 2.5 ? 0.5 : 0.6, f = fract(ph + o);
    float p = f < 0.35 ? f / 0.35 : 1. - (f - 0.35) / 0.65;
    float al = 0.66 * cos(3.14159 * p) + mix(-0.12, 0.14, fore);
    float sw = sin(3.14159 * clamp((f - 0.35) / 0.65, 0., 1.)); sw *= sw;
    float a2 = al - (0.12 + 1.5 * sw);
    vec3 hip = vec3(side * 0.2, 1.74 + mix(-0.85, 0.9, fore) * th, mix(-0.85, 0.9, fore));
    l = hip + vec3(0., -cos(al), sin(al)) * min(s, 0.85) + vec3(0., -cos(a2), sin(a2)) * max(s - 0.85, 0.) + position;
  } else if (kind < 3.5) {
    float w = aB.z; l.y += 0.9 * th - (l.z - 0.9) * th * 1.3;
    l += vec3(0.16 * sin(uTime * 9. + aB.y * 5. + seed * 20.), 0.2 + 0.1 * sin(uTime * 7. + aB.y * 9.), -0.62) * w * (1. + calf * 0.5);
  } else {
    float t = aB.y, wv = sin(uTime * 8. - t * 4.5 + seed * 30.);
    vec3 c = vec3(0.26 * t * wv, 2.18 - l.z * th + 0.28 * t - 0.5 * t * t + 0.1 * t * sin(uTime * 6. - t * 3.), -1.25 - 1.85 * t);
    float wd = 0.07 + 0.3 * sin(3.14159 * min(t * 1.25, 1.)) ; l = c + mix(vec3(0., wd * aB.z, 0.), vec3(wd * aB.z * 2., 0., 0.), position.x);
  }
  l.y += bob;
  vec2 xz = vec2(uHerdK.x + aRun.x + 3. * (1. - uHerdK.w) * sin(uTime * 0.23 + seed * 17.), uHerdK.y + aRun.y + 1.4 * sin(uTime * 0.31 + seed * 29.));
  vec2 p0 = gsInv(xz, uTw); vec3 gn; float J; vec3 d = gsOff(p0, uTw, 1., gn, J);
  vec3 up = normalize(mix(vec3(0., 1., 0.), gn, 0.7)), hd = vec3(uHd.x, 0., uHd.y);
  vec3 fw = normalize(hd - up * dot(hd, up)), rt = cross(up, fw);
  mat3 B = mat3(rt, up, fw);
  // heads turn to watch the camera as it comes by: the neck swings round from the withers, the mane with it
  if ((kind > 0.5 && kind < 1.5) || (kind > 2.5 && kind < 3.5)) {
    vec3 toC = cameraPosition - vec3(xz.x, d.y + 2.6 * sc, xz.y); float cdl = max(length(toC), 1e-3), lx = dot(toC, rt), lz = dot(toC, fw);
    float ya = clamp(atan(lx, lz + (abs(lx) + abs(lz) < 1e-3 ? 1e-2 : 0.)), -1.2, 1.2) * smoothstep(0.02, 0.3, abs(lx) / cdl) * (1. - smoothstep(26., 60., cdl)) * step(0.22, seed);
    ya *= smoothstep(0.8, 2.0, l.z); float cy = cos(ya), sy = sin(ya); vec2 q = l.xz - vec2(0., 0.95);
    l.xz = vec2(0., 0.95) + vec2(q.x * cy + q.y * sy, -q.x * sy + q.y * cy); nl.xz = vec2(nl.x * cy + nl.z * sy, -nl.x * sy + nl.z * cy);
  }
  float fm = 1. + 0.8 * smoothstep(140., 330., distance(vec3(xz.x, d.y, xz.y), cameraPosition));   // far runners drawn a little large, so a herd on a skyline reads as a frieze
  vW = vec3(xz.x, d.y, xz.y) + B * (l * sc * fm); vN = B * nl; vL = position;
  vK = vec4(kind, aB.y, aB.z, seed);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`;
    const HERD_FRAG = GLSL_LIGHT + /* glsl */`
uniform sampler2D uNoise; uniform vec3 uAccent; uniform float uDapple;
varying vec3 vN; varying vec3 vW; varying vec4 vK; varying vec3 vL;
void main(){
  vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
  float kind = vK.x; vec3 cream = vec3(0.70, 0.655, 0.55), alb = cream; float tr = 0.;
  float spots = texture2D(uNoise, vL.zy * 0.33 + vK.w * 3.).r;
  if (kind < 1.5) {
    alb = mix(cream, vec3(0.42, 0.44, 0.45), uDapple * smoothstep(0.45, 0.62, spots) * 0.8);
    alb = mix(alb, vec3(0.30, 0.36, 0.30), 0.45 * (1. - smoothstep(0.03, 0.1, abs(vL.x))) * smoothstep(2.15, 2.3, vL.y) * step(kind, 0.5));     // dorsal stripe
    alb *= (0.52 + 0.48 * smoothstep(1.35, 2.25, vL.y)) * (0.86 + 0.26 * vK.w);
    alb = mix(alb, cream * 1.12, 0.5 * smoothstep(2.12, 2.42, vL.y) * step(kind, 0.5) * smoothstep(0.08, 0.2, abs(vL.x)));              // pale saddle: a back that reads from the masthead
    alb = mix(alb, vec3(0.2, 0.17, 0.15), step(0.5, kind) * smoothstep(2.82, 3.0, vL.z));                                           // dark muzzle
  } else if (kind < 2.5) { alb = mix(cream * 0.92, vec3(0.085, 0.075, 0.07), smoothstep(0.8, 1.02, vK.z)); }                        // stockings
  else if (kind < 3.5) { alb = mix(vec3(0.62, 0.52, 0.25), vec3(0.85, 0.76, 0.45), vK.z); tr = 0.8; }
  else { alb = mix(vec3(0.75, 0.66, 0.4), uAccent, smoothstep(0.45, 0.75, vK.y)); tr = 0.8; }
  vec3 c = gsLit(alb, n, gsCloud(vW.xz), tr) + alb * (uSunCol * vec3(0.07, 0.09, 0.06) + vec3(0.02, 0.02, 0.04));
  gl_FragColor = vec4(gsFog(c, length(cameraPosition - vW), vW.y), 1.);
}`;
    const herds = [], LOOK = {};
    {
      const hr = rng.fork ? rng.fork('herd') : rng, hiG = makeRunnerGeo(true); await ctx.yield(); const loG = makeRunnerGeo(false); disposables.push(hiG, loG); await ctx.yield();
      const LH = 400, sT = railAtTw(13), tailX13 = rail.X[sT] - 5;
      // one herd: adults strung along the lip, calves on the sheltered side; the tail (where the camera surfs) is built fine
      const makeHerd = (nAd, nCalf, hiTail, bMin, bMax) => {
        const hi = [], lo = [];
        for (let i = 0; i < nAd + nCalf; i++) {
          const calf = i >= nAd, a = calf ? LH - 150 * hr() * hr() - 4 : LH * (1 - Math.pow(hr(), 1.25)), b = calf ? hr.range(bMax - 1, bMax + 6) : hr.range(bMin, bMax) + 2.5 * hr.gauss();
          (a > LH - hiTail ? hi : lo).push(a, b, hr(), calf ? hr.range(0.5, 0.62) : hr.range(0.92, 1.08));
        }
        const K = { value: new THREE.Vector4() }, grp = new THREE.Group();
        const mat = new THREE.ShaderMaterial({ uniforms: { ...U, uHerdK: K, uHd: { value: new THREE.Vector2(-0.539, 0.842) }, uDapple: { value: look.dapple ? 1 : 0 } }, vertexShader: HERD_VERT, fragmentShader: HERD_FRAG, side: THREE.DoubleSide });
        for (const [arr, g] of [[hi, hiG], [lo, loG]]) { if (!arr.length) continue; const m = new THREE.Mesh(instGeo(g, arr.length / 4, { aRun: { a: new Float32Array(arr), n: 4 } }), mat); m.frustumCulled = false; grp.add(m); }
        grp.name = 'herd'; scene.add(grp); return K;
      };
      const nA = Math.round(look.runners * (0.55 + 0.45 * detail));          // one herd: at most 200 adults and 40 calves on crest C0 and 52 in the file up its back (292, under live's 302)
      const KA = makeHerd(nA, 40, 56, 1, 9);
      herds.push((t, time) => { const hx = tailX13 - LH - 12.8 * (t - 13); KA.value.set(hx, CREST0 + 20 * t, time * 2.4, 0); U.uHerd.value.set(hx, LH, 12.8, 1); });
      // the file: a long loose file of the herd's stragglers galloping up the swell's back to rejoin it (the lead's standing decision,
      // counted inside the herd). The rail runs up through the middle of them for the whole climb, one every 8 m of rail on alternate
      // hands, so all the way up a few are close and whole, and their heads turn as we come by
      { const BV = 26, bh = 21 * DEG, vx = -Math.sin(bh) * BV, vz = Math.cos(bh) * BV;
        const list = [], NB = 42;
        for (let i = 0, t = 0; i < NB + 10 && t < 1400; t++) {
          const calf = i >= NB, sI = Math.round(calf ? hr.range(170, 450) : 124 + (i / NB) * 356 + hr.range(-7, 7)), side = calf ? (hr() < 0.5 ? -1 : 1) : (i % 2 ? 1 : -1);
          const lat = side * (calf ? hr.range(13, 22) : (i % 4 === 3 ? hr.range(17, 28) : hr.range(8.4, 13.5)));
          const h = Math.atan2(rail.X[sI + 6] - rail.X[sI], rail.Z[sI + 6] - rail.Z[sI]), tI = rail.TWs[sI];
          const a = rail.X[sI] + Math.cos(h) * lat - vx * tI, b = rail.Z[sI] - Math.sin(h) * lat - vz * tI; let ok = true;   // where it stands at wave time 0: it draws level with the rail at station sI
          for (let k = 0; k < list.length; k += 4) if (Math.hypot(list[k] - a, list[k + 1] - b) < 5.2) ok = false;
          if (!ok) continue; list.push(a, b, hr(), calf ? hr.range(0.5, 0.62) : hr.range(0.96, 1.12)); i++;
        }
        const KS = { value: new THREE.Vector4() };
        const mat = new THREE.ShaderMaterial({ uniforms: { ...U, uHerdK: KS, uHd: { value: new THREE.Vector2(vx / BV, vz / BV) }, uDapple: { value: look.dapple ? 1 : 0 } }, vertexShader: HERD_VERT, fragmentShader: HERD_FRAG, side: THREE.DoubleSide });
        const m = new THREE.Mesh(instGeo(hiG, list.length / 4, { aRun: { a: new Float32Array(list), n: 4 } }), mat); m.frustumCulled = false; m.name = 'herd-band'; scene.add(m);
        const q = {};
        herds.push((t, time) => { KS.value.set(vx * t, vz * t, time * 2.6 + 0.21, 0.72); });
        const vU = new THREE.Vector3(), vH = new THREE.Vector3(), ux = -Math.sin(7 * DEG), uz = Math.cos(7 * DEG);
        // straight up the swell's back, a little to starboard of the rail's heading: the skyline of the crest lies level and the file of runners fills the frame
        LOOK.up = (u) => {
          path.pointAt(u, vU); swell.inv(vU.x, vU.z, twOfU(u), q); let dx = -q.nx, dz = -q.nz; const dl = Math.hypot(dx, dz);
          if (dl > 0.05 && dz > 0) { dx = dx / dl * 0.8 + ux * 0.2; dz = dz / dl * 0.8 + uz * 0.2; } else { dx = ux; dz = uz; }      // the fall line of the land under us
          return vU.set(vU.x + dx * 60, vU.y + 9, vU.z + dz * 60);
        };
        const vS = new THREE.Vector3(), vE = new THREE.Vector3();                          // the trough ahead of the masthead, toward the tor: holds the gaze down on the sea
        LOOK.entry = (u) => { path.pointAt(Math.min(u + 0.03, 1), vE); vE.y -= 13; return vE; };     // a gentle dip of the gaze toward the copse riding the trough under the entry
        LOOK.sea = (u) => { path.pointAt(u, vS); const dx = TOR.x - vS.x, dz = TOR.z - vS.z, dl = Math.hypot(dx, dz) || 1; return vS.set(vS.x + dx / dl * 420, -30, vS.z + dz / dl * 420); };
        LOOK.herd = (u) => { const t = twOfU(u), x = tailX13 - 12.8 * (t - 13) - 95, z = CREST0 + 20 * t; return vH.set(x, swell.height(x, z, t) + 2, z); };
      }
      // rare: a herd rides the rogue crest above the horizon
      if (rogue) { const KR = makeHerd(Math.round(70 * detail), 0, 0, -4, 6); herds.push((t, time) => KR.value.set(rogue.x - 330 - 3 * (t - 25), rogue.zc(t) - 2, time * 2.9 + 0.5, 0)); }
      tick.push((dt, time, camera, u, t) => { for (const h of herds) h(t, time); });
    }
    await ctx.yield();

    // ---- far ranges: three blue silhouettes beyond the moving horizon that lift and sink like islands
    {
      const SEG = 180, pos = [], ak = [], idx = [], rr = rng.fork ? rng.fork('ranges') : rng;
      [7000, 10000, 14000].forEach((R, k) => {
        const ph = rr.range(0, 100), b0 = pos.length / 3;
        for (let i = 0; i <= SEG; i++) {
          const a = i / SEG * TAU, ax = Math.cos(a) * 3 + ph, az = Math.sin(a) * 3;
          const h = (0.35 + 0.65 * Math.abs(ctx.noise.fbm2(ax, az, 4)) + 0.5 * Math.max(0, ctx.noise.n2(ax * 0.4 + 9, az * 0.4))) * (260 + 190 * k);
          pos.push(Math.cos(a) * R, -250, Math.sin(a) * R, Math.cos(a) * R, h, Math.sin(a) * R); ak.push(k, 0, k, 1);
          if (i < SEG) { const o = b0 + i * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
        }
      });
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(ak, 2)); g.setIndex(idx);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
attribute vec2 aK; uniform float uTw; varying vec2 vK; varying float vY;
void main(){
  vec3 p = position; p.xz += cameraPosition.xz;
  p.y += aK.y * 110. * sin(0.0026 * p.x - uTw * 0.12 + aK.x * 2.1) + 60. * sin(0.0011 * p.z + uTw * 0.09 + aK.x) - 30.;
  vK = aK; vY = p.y; gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.);
}`,
        fragmentShader: /* glsl */`
uniform vec3 uFogCol, uSkyCol, uSunCol; varying vec2 vK; varying float vY;
void main(){
  vec3 c = mix(vec3(0.22, 0.42, 0.62), vec3(0.3, 0.5, 0.72), vK.x * 0.5) * (0.55 + 0.5 * dot(uSunCol, vec3(0.33))) ;
  c = mix(c, uFogCol, 0.62 + 0.12 * vK.x + 0.2 * (1. - smoothstep(-50., 260., vY)));
  gl_FragColor = vec4(c, 1.);
}` }));
      m.frustumCulled = false; m.renderOrder = -0.5; m.name = 'ranges'; scene.add(m);
    }

    await ctx.yield();
    // ---- cranes: white, 2.2-2.6 m span, in seven flocks (the lead's amendment of the brief's three) that lift off a crest as it peaks and settle on the next (see THE CYCLE below)
    {
      const pos = [], aw = [];
      const tri = (a, b, c, wa, wb, wc) => { pos.push(...a, ...b, ...c); aw.push(...wa, ...wb, ...wc); };
      // aW = (span coordinate -1..1, part: 0 body, 1 wing, 3 neck and head, 4 bill, 5 legs, chord 0 leading .. 1 trailing). Built flying, facing +Z.
      const ring = (z, r, y, n = 5) => { const o = []; for (let k = 0; k < n; k++) { const a = k / n * TAU + 0.3; o.push([Math.cos(a) * r, y + Math.sin(a) * r * 0.85, z]); } return o; };
      const band = (A, Bq, pa, pb) => { const n = A.length; for (let k = 0; k < n; k++) { const k1 = (k + 1) % n; tri(A[k], A[k1], Bq[k], [0, pa, 0], [0, pa, 0], [0, pb, 0]); tri(A[k1], Bq[k1], Bq[k], [0, pa, 0], [0, pb, 0], [0, pb, 0]); } };
      const body = [ring(-0.52, 0.012, 0.02), ring(-0.3, 0.085, 0.0), ring(0.0, 0.15, -0.02), ring(0.28, 0.125, 0.01), ring(0.44, 0.055, 0.05)];
      for (let k = 0; k < body.length - 1; k++) band(body[k], body[k + 1], 0, 0);
      const neck = [ring(0.42, 0.05, 0.05, 4), ring(0.82, 0.03, 0.08, 4), ring(1.2, 0.028, 0.1, 4), ring(1.29, 0.05, 0.11, 4), ring(1.37, 0.03, 0.11, 4)];   // a long neck carried straight out, a small head
      for (let k = 0; k < neck.length - 1; k++) band(neck[k], neck[k + 1], 3, 3);
      for (let k = 0; k < 4; k++) tri(neck[4][k], neck[4][(k + 1) % 4], [0, 0.1, 1.62], [0, 4, 0], [0, 4, 0], [0, 4, 0]);     // the bill
      const legs = [ring(-0.3, 0.03, -0.05, 3), ring(-1.22, 0.014, -0.03, 3)]; band(legs[0], legs[1], 5, 5);                   // trailing well behind the tail
      for (const sx of [-1, 1]) {                                                    // long wings bent at the wrist: a broad arm, a tapering hand of dark primaries
        const T = [0, 0.18, 0.36, 0.5, 0.64, 0.78, 0.9, 1], ZL = [0.2, 0.27, 0.31, 0.32, 0.28, 0.2, 0.1, -0.02], ZT = [-0.2, -0.25, -0.25, -0.23, -0.2, -0.17, -0.13, -0.1];
        for (let k = 0; k < T.length - 1; k++) {
          const a = T[k], b = T[k + 1], la = [sx * a * 1.1, 0.03, ZL[k]], lb = [sx * b * 1.1, 0.03, ZL[k + 1]], ta = [sx * a * 1.1, 0.03, ZT[k]], tb = [sx * b * 1.1, 0.03, ZT[k + 1]];
          tri(la, lb, tb, [sx * a, 1, 0], [sx * b, 1, 0], [sx * b, 1, 1]); tri(la, tb, ta, [sx * a, 1, 0], [sx * b, 1, 1], [sx * a, 1, 1]);
        }
      }
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); base.setAttribute('aW', new THREE.Float32BufferAttribute(aw, 3));
      const swallows = look.swallows, nPer = Math.round((swallows ? 46 : 40) * (0.6 + 0.4 * detail)), size = swallows ? 0.5 : 1.0;
      const N = nPer * 7, P = new Float32Array(N * 4), Q = new Float32Array(N * 4), birds = [];
      const gi = instGeo(base, N, { aP: { a: P, n: 4 }, aQ: { a: Q, n: 4 } });
      gi.attributes.aP.setUsage(THREE.DynamicDrawUsage); gi.attributes.aQ.setUsage(THREE.DynamicDrawUsage);
      const m = new THREE.Mesh(gi, new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
        vertexShader: GLSL_LIGHT + /* glsl */`
attribute vec3 aW; attribute vec4 aP, aQ; varying vec3 vC; varying vec3 vW; varying vec3 vNb; varying vec3 vG;
void main(){
  vec3 l = position; float sp = abs(aW.x), fl = aQ.y, st = 1. - fl;             // fl: 0 standing, wings shut .. 1 flying
  float op = smoothstep(0.0, 0.28, fl), shut = 1. - op;                          // the wings snap open as the bird leaves the grass: never half-open on the ground
  float a1 = ((0.5 + 0.35 * (1. - fl)) * sin(aQ.x) + 0.08 + 0.3 * (1. - fl)) * op - shut * 1.45, a2 = (0.55 * sin(aQ.x - 0.9) - 0.32) * op - shut * 2.95;
  vec3 nb = vec3(position.x, position.y - 0.02, 0.); nb /= max(length(nb), 1e-3);
  if (aW.y < 0.5) l.xy *= 1.35;                                                  // a full white body
  float inner = min(sp, 0.5), outer = max(sp - 0.5, 0.);
  if (aW.y > 0.5 && aW.y < 2.5) {                                              // wings: arm and hand hinged at the wrist; shut, they lie doubled along the flank
    float sx = sign(aW.x), r1 = 1.1, ang = sp > 0.5 ? a1 + a2 : a1; l.x = sx * (0.1 * shut + r1 * (inner * cos(a1) + outer * cos(a1 + a2))); l.y += r1 * (inner * sin(a1) + outer * sin(a1 + a2));
    l.z = mix(l.z, l.z * 0.8 - 0.1, shut) * 1.2; l.y += 0.035 * sin(3.14159 * aW.z) * op;      // a little camber
    nb = normalize(vec3(-sx * sin(ang), cos(ang), 0.25 - 0.5 * aW.z));
  } else if (aW.y > 2.5 && aW.y < 4.5) {                                       // neck and bill: straight out in flight, raised when standing
    float an = st * 1.05 - 0.05 * fl * sin(aQ.x + 0.7), cn = cos(an), sn = sin(an); vec2 q = l.zy - vec2(0.42, 0.05);
    l.zy = vec2(0.42, 0.05) + vec2(q.x * cn - q.y * sn, q.x * sn + q.y * cn);
  } else if (aW.y > 4.5) {                                                     // legs: trailing in flight, straight down when standing
    float an = -st * 1.5, cn = cos(an), sn = sin(an); vec2 q = l.zy - vec2(-0.2, -0.06);
    l.zy = vec2(-0.2, -0.06) + vec2(q.x * cn + q.y * sn, -q.x * sn + q.y * cn); l.x += st * sign(position.x + 1e-4) * 0.05;
  }
  { float bp = st * 0.42, cb = cos(bp), sb = sin(bp); if (aW.y < 4.5) l.zy = vec2(l.z * cb - l.y * sb, l.z * sb + l.y * cb); }   // standing birds carry the body tilted up
  l *= aQ.w; l.y += fl * 0.07 * sin(aQ.x + 1.6) + st * 0.86 * aQ.w;
  float c = cos(aP.w), s = sin(aP.w), bk = aQ.z, cb2 = cos(bk), sb2 = sin(bk);
  l.xy = vec2(l.x * cb2 - l.y * sb2, l.x * sb2 + l.y * cb2); nb.xy = vec2(nb.x * cb2 - nb.y * sb2, nb.x * sb2 + nb.y * cb2);
  vW = aP.xyz + vec3(l.x * c + l.z * s, l.y, -l.x * s + l.z * c); vNb = vec3(nb.x * c + nb.z * s, nb.y, -nb.x * s + nb.z * c);
  vec3 alb = aW.y > 4.5 ? vec3(0.07, 0.065, 0.07) : aW.y > 3.5 ? vec3(0.5, 0.36, 0.1) : vec3(0.8, 0.79, 0.76);
  if (aW.y > 2.5 && aW.y < 3.5) alb = mix(alb, vec3(0.1, 0.09, 0.1), smoothstep(1.02, 1.16, position.z) * 0.85);       // a dark face and throat
  ${swallows ? 'alb = aW.y > 0.5 && aW.y < 2.5 ? vec3(0.06, 0.08, 0.16) : aW.y < 0.5 ? vec3(0.5, 0.45, 0.4) : vec3(0.08, 0.09, 0.15);' : ''}
  vC = alb; vG = vec3(sp, aW.z, aW.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`,
        fragmentShader: GLSL_LIGHT + /* glsl */`
varying vec3 vC; varying vec3 vW; varying vec3 vNb; varying vec3 vG;
void main(){
  vec3 alb = vC;
  if (vG.z > 0.5 && vG.z < 2.5) {                                              // the hand of the wing: black primaries, fingered at the tip
    if (vG.x > 0.84 && fract(vG.y * 4. + 0.15) < 0.4 * (vG.x - 0.84) / 0.16) discard;
    alb = mix(alb, ${swallows ? 'alb' : 'vec3(0.06, 0.06, 0.08)'}, smoothstep(0.6, 0.66, vG.x + 0.16 * vG.y));
    alb *= 0.9 + 0.1 * smoothstep(0.1, 0.6, vG.y);
  }
  vec3 V = normalize(cameraPosition - vW), n = vNb / max(length(vNb), 1e-3); if (dot(n, V) < 0.) n = -n;
  float dif = mix(0.4, 1., smoothstep(-0.25, 0.7, dot(n, uSunDir)));                 // the shaded side is still a white bird: warm light thrown up by the meadow
  vec3 c = alb * (uSunCol * dif * (0.45 + 0.55 * gsCloud(vW.xz)) + uSkyCol * (0.85 + 0.35 * n.y) + uGndCol * 0.8 * (0.5 - 0.5 * n.y) + uSunCol * vec3(0.06, 0.065, 0.08));   // a lit side and a luminous blue-grey shaded side
  c *= min(1., 0.88 / max(max(c.r, c.g), max(c.b, 1e-3)));                    // white, never above the bloom threshold
  gl_FragColor = vec4(gsFog(c, length(cameraPosition - vW), vW.y), 1.);
}` }));
      m.frustumCulled = false; m.name = 'cranes'; scene.add(m);
      // THE CYCLE. A flock is a skein strung along a crest line at seeded rest places. Each bird stands (rooted, riding its circle) until
      // the crest of the long swell peaks under it, lifts, flies HOP_D m against the swell's travel on the flock's own seeded course,
      // settles on the face of the next crest a few seconds before that one peaks, and lifts again when it does: one hop every
      // HOP_P seconds of the wave clock, for ever, so at any moment most of the country's cranes are in the air somewhere and the
      // rail meets them where its line crosses theirs. Where a bird is comes from the wave clock and its own seeded place alone.
      // One meeting is the journey's own (the brief: forty cranes lift off the lip 20 m ahead as we top the climb): flock 0 stands
      // on crest C0 where the rail comes over it. Flocks 1 to 6 stand at places drawn by seed in the country ahead.
      const HOP_D = 190, HOP_P = (600 - HOP_D) / 20, o2 = {}, o3 = {}, RP = { x: 0, z: 0 };
      const place = (b, n) => {                                     // the bird's standing place for hop n (rest space), kept off the tor
        let x = b.x0 + n * b.hx, z = b.z0 - n * HOP_D; const ex = x - TOR.x, ez = z - TOR.z, r = Math.hypot(ex, ez);
        if (r < 320) { const k = 320 / Math.max(r, 1); x = TOR.x + ex * k; z = TOR.z + ez * k; }
        RP.x = x; RP.z = z;
      };
      const birdAt = (b, t, time, out) => {
        const ph = (t - b.T0) / HOP_P, n = Math.floor(ph), tq = (ph - n) * HOP_P;
        if (n !== b.n) { b.n = n; place(b, n); swell.at(RP.x, RP.z, b.T0 + n * HOP_P, o2); b.Sx = o2.x; b.Sy = o2.y; b.Sz = o2.z; place(b, n + 1); b.Lx = RP.x; b.Lz = RP.z; }
        swell.at(b.Lx, b.Lz, t, o2);                               // where it will settle, as that place stands now
        if (tq >= b.F) { out.x = o2.x; out.y = o2.y + 0.1; out.z = o2.z; out.fly = 0; out.yaw = b.yaw0; return out; }
        const sq = tq / b.F, e = 0.5 * sq + 0.5 * sq * sq * (3 - 2 * sq), fly = smoothstep(0, 1.2, tq) * (1 - smoothstep(b.F - 1.3, b.F - 0.15, tq));
        const cx = o2.x - b.Sx, cz = o2.z - b.Sz, cl = Math.hypot(cx, cz) || 1, wob = 1.3 * Math.sin(time * 0.4 + b.seed * 40) * fly;
        const x = b.Sx + cx * e + cz / cl * wob, z = b.Sz + cz * e - cx / cl * wob;
        const alt = b.cap * Math.pow(Math.max(Math.sin(Math.PI * sq), 0), 0.75) + 0.8 * Math.sin(time * 0.7 + b.seed * 20) * fly;
        out.x = x; out.z = z; out.y = Math.max(swell.quick(x, z, t) + 0.1 + 0.45 * Math.max(alt, 0), b.Sy + (o2.y - b.Sy) * sq + alt);   // high across the trough from crest to crest, never under the land
        const ya = Math.atan2(cx, cz), dy = ((ya - b.yaw0 + Math.PI * 3) % TAU) - Math.PI, k = smoothstep(0, 0.8, tq) * (1 - smoothstep(b.F - 0.9, b.F, tq));
        out.fly = fly; out.yaw = b.yaw0 + dy * k + 0.12 * Math.sin(time * 0.5 + b.seed * 90) * fly;
        return out;
      };
      // the lip where the rail comes over crest C0: the first rail station that stands within 20 m of the crest line
      let sLip = 300; while (sLip < rail.N - 200 && rail.Z[sLip] < CREST0 + 20 * rail.TWs[sLip] - 20) sLip += 2;
      const cq = ctx.core.makeRng(((ctx.seed | 0) ^ 0x5d0f) + 3301);
      for (let f = 0; f < 7; f++) {
        // flocks 1 to 6: a seeded place in the country's own coordinates, anywhere on the floor of the valley that crest C0 sweeps between the
        // masthead (x -190, z 490) and the tor (TOR): in x from the tor's centre to the masthead, in z from the masthead one valley's width on
        // (crest to crest, 600 m, which ends at the tor's upstream foot), so the crest we ride puts them up as it reaches them
        const hx = cq.range(-70, 70), MAST = { x: -190, z: 490 }, VALE = TAU / trains[0].k;
        const cx0 = f === 0 ? 0 : cq.range(TOR.x, MAST.x), cz0 = f === 0 ? 0 : cq.range(MAST.z, MAST.z + VALE), half = 80, zLip = CREST0 + 20 * rail.TWs[sLip];
        for (let i = 0; i < nPer; i++) {
          // flock 0, the journey's own meeting: forty stand strung along our line up the last of the swell's back, where the crest peaks
          // 0.4 to 3.6 s before it carries us over the lip; each lifts as it peaks under it, a little way ahead of us, and beats back downwind
          let bx = cx0 + cq.range(-half, half), bz = cz0 + clamp(cq.gauss() * 8, -18, 18), cap = cq.range(7, 24);
          if (f === 0) { bz = zLip - 20 * cq.range(0.4, 3.6); let sq = sLip; while (sq > 200 && rail.Z[sq] > bz) sq -= 2; bx = rail.X[sq] + cq.range(-22, 22); cap = cq.range(10, 26); }
          const b = { x0: bx, z0: bz, hx, F: cq.range(15.4, 17.4), cap, seed: cq(), yaw0: cq.range(0, TAU), n: NaN, T0: 0, Sx: 0, Sy: 0, Sz: 0, Lx: 0, Lz: 0 };
          for (let tries = 0; tries < 8; tries++) {                   // no bird's course comes within 7 m of the eye: tested from every second metre of the rail, at the wave clock of that metre
            b.T0 = (b.z0 - CREST0) / 20; b.n = NaN; let clear = true;
            for (let sc = 0; sc <= rail.N && clear; sc += 2) { const t = rail.TWs[sc]; birdAt(b, t, t, o3); if (Math.abs(o3.x - rail.X[sc]) < 7 && Math.abs(o3.z - rail.Z[sc]) < 7 && Math.hypot(o3.x - rail.X[sc], o3.y - rail.Y[sc], o3.z - rail.Z[sc]) < 7) clear = false; }
            if (clear) break; b.x0 += 7.5;
          }
          b.n = NaN; birds.push(b);
          await ctx.yield();
        }
      }
      tick.push((dt, time, camera, u, t) => {
        for (let i = 0; i < N; i++) {
          const b = birdAt(birds[i], t, time, o3), o4 = i * 4, sd = birds[i].seed;
          P[o4] = b.x; P[o4 + 1] = b.y; P[o4 + 2] = b.z; P[o4 + 3] = b.yaw;
          Q[o4] = time * (swallows ? 16 : 7.5) * (0.9 + 0.2 * sd) + sd * 30; Q[o4 + 1] = b.fly; Q[o4 + 2] = (0.3 * Math.sin(sd * 77) + 0.16 * Math.sin(time * 0.6 + sd * 9)) * b.fly; Q[o4 + 3] = size * (1.0 + 0.18 * sd);
        }
        gi.attributes.aP.needsUpdate = true; gi.attributes.aQ.needsUpdate = true;
      });
    }
    await ctx.yield();

    // ---- motes: petals blown off the whitecaps, blue butterflies and bumblebees over the flowers (one draw call)
    {
      const mr = rng.fork ? rng.fork('motes') : rng, nP = Math.round(1500 * detail), nB = Math.round(260 * detail), nBee = Math.round(220 * detail), N = nP + nB + nBee;
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
      const A = new Float32Array(N * 4), K = new Float32Array(N * 2);
      for (let i = 0; i < N; i++) { A[i * 4] = mr() * 100; A[i * 4 + 1] = mr() * 100; A[i * 4 + 2] = mr(); A[i * 4 + 3] = mr(); K[i * 2] = i < nP ? 0 : i < nP + nB ? 1 : 2; K[i * 2 + 1] = mr(); }
      const m = new THREE.Mesh(instGeo(base, N, { aOff: { a: A, n: 4 }, aK: { a: K, n: 2 } }), new THREE.ShaderMaterial({ uniforms: U, side: THREE.DoubleSide,
        vertexShader: GLSL_SWELL + GLSL_LIGHT + /* glsl */`
attribute vec4 aOff; attribute vec2 aK; uniform vec2 uWin, uCapJ; uniform float uTime, uRain;
varying vec2 vUv; varying vec4 vK; varying vec3 vW;
void main(){
  float kind = aK.x, sd = aK.y, W = kind < 0.5 ? (uRain > 0.01 ? 40. : 100.) : 56.;
  vec2 drift = kind < 0.5 ? vec2(0.25, -0.95) * (7. + 4. * sd) * uTime : vec2(sin(uTime * 0.31 + sd * 40.), cos(uTime * 0.27 + sd * 23.)) * 2.5;
  vec2 ctr = (kind < 0.5 && uRain > 0.01) ? mix(cameraPosition.xz, uWin, 0.3) : uWin;
  vec2 a0 = ctr + mod(aOff.xy * W * 0.01 + drift - ctr, W) - W * 0.5;
  float edge = 1. - smoothstep(W * 0.36, W * 0.49, length(a0 - ctr));
  vec3 gn; float J; vec3 d = gsOff(a0, uTw, 1., gn, J);
  float cap = 1. - smoothstep(uCapJ.x, uCapJ.y + 0.06, J), life = fract(uTime * (0.16 + 0.1 * aOff.z) + aOff.w), s, h;
  if (kind < 0.5) { h = 0.7 + 4.5 * life * (0.4 + aOff.z) + 0.5 * sin(uTime * 2. + sd * 30.); s = (0.06 + 0.05 * sd) * sin(3.14159 * life) * (0.04 + 0.96 * cap); }
  else if (kind < 1.5) { h = 1.3 + 1.6 * aOff.z + 0.5 * sin(uTime * 1.7 + sd * 50.); s = 0.11 + 0.05 * sd; }
  else { h = 0.9 + 1.2 * aOff.z + 0.25 * sin(uTime * 3.3 + sd * 70.); s = 0.045; }
  vec3 p = vec3(a0.x + d.x, d.y + h, a0.y + d.z);
  if (kind < 0.5 && uRain > 0.) {                                                   // the rain: falling through the air round the camera
    float fall = fract(aOff.w + uTime * (0.16 + 0.1 * aOff.z));
    p.y = mix(p.y, cameraPosition.y + 13. - 26. * fall + 2. * sin(uTime + sd * 9.), min(uRain * 4., 1.));
    s = mix(s, (0.27 + 0.2 * sd) * sin(3.14159 * fall) * step(aOff.z, 0.5), uRain);
  }
  vec4 mv = viewMatrix * vec4(p, 1.); float dist = -mv.z;
  s = max(s, dist * 0.0022 * step(0.001, s)) * edge;
  if (kind < 0.5) s *= smoothstep(2.6, 4.6, length(mv.xyz));
  vec2 q = position.xy; float rot = kind < 0.5 ? uTime * (2. + 4. * sd) + sd * 20. : 0.6 * sin(uTime * 0.9 + sd * 12.);
  if (kind > 0.5 && kind < 1.5) q.x *= abs(sin(uTime * 13. + sd * 30.)) * 0.9 + 0.1;            // butterfly wings closing
  if (kind < 0.5) q.y *= 0.45 + 0.55 * abs(sin(uTime * 3. + sd * 11.));                        // petals tumbling
  q = vec2(q.x * cos(rot) - q.y * sin(rot), q.x * sin(rot) + q.y * cos(rot));
  mv.xy += q * s;
  vUv = position.xy; vK = vec4(kind, sd, gsCloud(p.xz), dist); vW = p;
  gl_Position = projectionMatrix * mv;
}`,
        fragmentShader: GLSL_LIGHT + /* glsl */`
uniform vec3 uCap, uAccent; varying vec2 vUv; varying vec4 vK; varying vec3 vW;
void main(){
  float r = length(vUv); vec3 alb; float kind = vK.x;
  if (kind < 0.5) { if (abs(vUv.x) > 0.62 * (1. - vUv.y * vUv.y) * (0.8 + 0.25 * vUv.y) + 0.04) discard; alb = mix(uCap * 1.15, uAccent, step(0.9, vK.y)) * (0.78 + 0.22 * vUv.y + 0.12 * vUv.x); }
  else if (kind < 1.5) { vec2 q = abs(vUv); if (q.x * q.x * 0.8 + (q.y - 0.25 * q.x) * (q.y - 0.25 * q.x) * 1.6 > 0.8 || q.x < 0.06) discard; alb = mix(vec3(0.12, 0.3, 0.85), vec3(0.45, 0.7, 1.), 1. - r) ; alb = mix(alb, vec3(0.03), smoothstep(0.75, 0.95, r)); }
  else { if (r > 0.9) discard; alb = mix(vec3(0.55, 0.38, 0.05), vec3(0.04), step(0.35, abs(vUv.y))); }
  vec3 c = alb * (uSunCol * (0.6 + 0.4 * vK.z) * 1.05 + uSkyCol);
  gl_FragColor = vec4(gsFog(c, vK.w, vW.y), 1.);
}` }));
      m.frustumCulled = false; m.name = 'motes'; scene.add(m);
    }

    await ctx.yield();
    // ---- tree shadows: soft decals rooted with each tree, lying 20 m down the slope away from the sun
    if (treeAnchors.length) {
      const NXs = 4, NZs = 2, pos = [], idx = [];
      for (let j = 0; j <= NZs; j++) for (let i = 0; i <= NXs; i++) pos.push(i / NXs, 0, j / NZs * 2 - 1);
      for (let j = 0; j < NZs; j++) for (let i = 0; i < NXs; i++) { const a = j * (NXs + 1) + i, b = a + 1, c = a + NXs + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); base.setIndex(idx);
      const sl = Math.min(13 / Math.tan(H.elev * DEG), 46) + 5, sh = Math.hypot(sunDir.x, sunDir.z);
      const m = new THREE.Mesh(instGeo(base, treeAnchors.length / 3, { aAnc: { a: new Float32Array(treeAnchors), n: 3 } }), new THREE.ShaderMaterial({
        uniforms: { ...U, uShDir: { value: new THREE.Vector3(-sunDir.x / sh, sl, -sunDir.z / sh) } }, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: GLSL_SWELL + GLSL_LIGHT + GLSL_SHADE + /* glsl */`
attribute vec3 aAnc; uniform vec3 uShDir; varying vec2 vUv; varying vec3 vW; varying float vLit;
void main(){
  vec2 dir = uShDir.xz, prp = vec2(-dir.y, dir.x); float w = 5.2 * aAnc.z;
  vec2 a0 = aAnc.xy + dir * (position.x * uShDir.y * aAnc.z - 3.) + prp * position.z * w * (1. - 0.2 * position.x);
  vec3 gn; float J; vec3 d = gsOff(a0, uTw, 1., gn, J);
  vW = vec3(a0.x + d.x, d.y + 0.35, a0.y + d.z); vUv = vec2(position.x, position.z); vLit = (gsWaveSh(aAnc.xy, 6., uTw) - (1. - uShK.w)) / max(uShK.w, 0.01);
  gl_Position = projectionMatrix * viewMatrix * vec4(vW, 1.);
}`,
        fragmentShader: GLSL_LIGHT + /* glsl */`
uniform vec3 uDarkG; varying vec2 vUv; varying vec3 vW; varying float vLit;
void main(){
  float x = vUv.x, core = smoothstep(0., 0.12, x) * (1. - smoothstep(0.55, 1., x)), a = core * (1. - smoothstep(0.35, 1., abs(vUv.y))) * 0.62 * gsCloud(vW.xz);
  float dist = length(cameraPosition - vW); a *= 1. - (1. - exp(-uFogDen * uFogDen * dist * dist));
  { float mh = 1. - smoothstep(uMistY.x, uMistY.y, vW.y); a *= clamp(vLit, 0., 1.) * (1. - min(uMist * mh * sqrt(mh) * (1. - exp(-dist * dist / 400000.)) * 1.5, 1.)); }   // no shadow drawn on the mist, or inside a swell's shadow
  gl_FragColor = vec4(uDarkG * vec3(0.16, 0.2, 0.27) + uSkyCol * 0.03, a * 0.92);
}` }));
      m.frustumCulled = false; m.renderOrder = 1; m.name = 'tree-shadows'; scene.add(m);
    }
    await ctx.yield();
    tick.push((dt, time, camera, u, t) => { U.uRain.value = Math.max(rogue ? smoothstep(33, 37, t) : 0, 0.85 * smoothstep(0.86, 0.92, u)); });
    // ==== TAIL ====
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();
    let tw = 0, started = false, lastU = 0, lastTime = 0;
    const herdLook = new THREE.Vector3(), camP = new THREE.Vector3(), camRest = {}, fwd = new THREE.Vector3(), torLook = new THREE.Vector3(TOR.x, 120, TOR.z), breakLook = new THREE.Vector3(TOR.x - 30, 70, TOR.z - 200);   // the break itself: the crest of the comber on the tor's upstream foot
    return {
      scene, path, duration: 46,
      pace: (u) => 0.93 + 0.34 * smoothstep(0.07, 0.14, u) - 0.5 * smoothstep(0.2, 0.27, u) + 0.52 * smoothstep(0.44, 0.5, u) - 0.47 * smoothstep(0.59, 0.65, u) + 0.12 * smoothstep(0.8, 0.9, u),
      camera: { fov: 62, near: 0.5, far: 16000, lookAhead: 40, sway: 0.8, bank: 0.3 },
      pois: [
        { at: (time, u) => LOOK.entry(u), from: 0, to: 0.055, weight: 0.4, fade: 0.3 },
        { at: (time, u) => LOOK.up(u), from: 0.05, to: 0.305, weight: 0.8, fade: 0.25 },
        { at: (time, u) => LOOK.herd(u), from: 0.28, to: 0.315, weight: 0.4, fade: 0.3 },
        { at: torLook, from: 0.27, to: 0.33, weight: 0.4 },
        { at: (time, u) => LOOK.sea(u), from: 0.285, to: 0.335, weight: 0.45, fade: 0.3 },
        { at: (time, u) => herdLook, from: 0.3, to: 0.5, weight: 0.68, fade: 0.25 },
        { at: torLook, from: 0.46, to: 0.62, weight: 0.4 },
        { at: torLook, from: 0.6, to: 0.76, weight: 0.3 },
        { at: breakLook, from: 0.77, to: 0.96, weight: 0.3, fade: 0.32 },     // F: one target for the whole of the break, eased in over three seconds and out again on the last straight
      ],
      portal: { shape: 'circle', radius: 7, color: '#FFF2CF', glow: 1, revealDistance: 700, tilt: true },
      post: { exposure: H.exposure, bloom: { strength: 0.32, radius: 0.6, threshold: 0.93 },
        grade: { saturation: H.sat, contrast: 1.05, tint: H.tint, shadowTint: H.shadowTint, vignette: 0.26, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, time, camera, u) {
        // the wave clock: the table of rail distance, eased toward it by wall time times the flight's rate (taken as at least 0.4), so the land never stops travelling and keeps step with a hurried flight
        const target = twOfU(u);
        if (u <= 0) { tw = target + 1.3 * Math.sin(time * 0.42); started = true; }
        else if (!started || Math.abs(u - lastU) > 0.012 * Math.max(1, ctx.flight ? ctx.flight.rate : 1) || time < lastTime - 0.01 || target - tw > 3 || tw - target > 3.6) { tw = target; started = true; }
        else { const r = Math.max(0.4, ctx.flight ? ctx.flight.rate : 1), n = Math.min(32, Math.max(1, Math.round(r))); for (let k = 1; k <= n; k++) { const x = tw - (k < n ? twOfU(lastU + (u - lastU) * k / n) : target); tw += dt / n * r * (x > 0 ? Math.exp(-x / 0.7) : 1 + Math.min(3, -x * 1.5)); } }
        lastU = u; lastTime = time;
        U.uTw.value = tw; U.uTime.value = time;
        if (rogue) { const c = rogue.cAt(tw); U.uRogue.value.z = c; U.uRogue.value.y = rogue.zc(tw) - c * tw; }
        camera.getWorldPosition(camP);
        swell.inv(camP.x, camP.z, tw, camRest);
        U.uCamRest.value.set(camRest.x0, camRest.z0);
        camera.getWorldDirection(fwd); const fl = Math.hypot(fwd.x, fwd.z) || 1;
        U.uWin.value.set(camRest.x0 + fwd.x / fl * 44, camRest.z0 + fwd.z / fl * 44); U.uWin0.value.set(camRest.x0 + fwd.x / fl * 13, camRest.z0 + fwd.z / fl * 13);
        U.uWin2.value.set(camRest.x0 + fwd.x / fl * 150, camRest.z0 + fwd.z / fl * 150); U.uFwd.value.set(fwd.x / fl, fwd.z / fl);
        U.uCloudX.value.x = cloudOrigin.x; U.uCloudX.value.y = cloudOrigin.z + WIND_Z * time;
        herdLook.set(camP.x - 21, camP.y - 5, CREST0 + 20 * tw + 3);
        hero.setProgress(tw); hero.update(dt, time, camera);
        for (let i = 0; i < tick.length; i++) tick[i](dt, time, camera, u, tw);
        sky.update(dt, time, camera); clouds.update(dt, time, camera);
      },
      dispose() { sky.dispose(); hero.dispose(); for (const d of disposables) d.dispose?.(); },
    };
  },
};
