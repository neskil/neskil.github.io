// HERO SET PIECE for "city-hung-below-its-net": the heart of a city that hangs under a net.
//
// WHAT IT IS
//   A patch of the great hemp net (lattice, cables, plank catwalks) and, under its middle, a cluster of sack-houses of
//   many sizes hung at different depths round a broad gondola terrace with a striped awning; a chandelier hangs beneath
//   the terrace over nothing; rope ladders, dumb-waiters, baskets on strings, trapezes and rings, showers, hammocks,
//   laundry and pots of trailing plants hang everywhere. Every thing hangs from a point and sways from that point in
//   the vertex shader (one gust wave crosses all of them), ropes are tubes of their own thickness in metres at any distance.
//
// THE KIT (what the world uses along the whole net)
//   makeNetFn(N)            the net as a function: a hammock slung from zA to zB (see NET_DEFAULT)
//   makeHungKit(ctx, o)     shared uniforms + materials + geometry makers; kit.add(kind, {...}) hangs a thing,
//                           kit.tube(...) lays a rope or cable, kit.glow(...) a lamp glow; kit.finish() makes the meshes
//   buildNet(kit, rng, o)   the net itself (lattice surface, cables, catwalks, posts and what is left on them)
//   buildHero(ctx, opts)    the heart cluster. opts.kit + opts.origin: add into a world kit (no meshes of its own).
//
// LOCAL SPACE (standalone)  origin under the lowest point of the cluster, +Y up; the net patch is at y ~ 78..92.
// LIGHT  self-lit ShaderMaterials: sun + sky/ground hemisphere + lamp glow, the net's lattice shadow worked out in the
//        fragment shader, scene-style exp2 fog from uniforms (kit.setLight).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// surface patterns understood by the shader
export const PAT = { PLAIN: 0, CANVAS: 1, WICKER: 2, WOOD: 3, METAL: 4, STRIPE: 5, LEAF: 6, WATER: 7, CLOTH: 8, ROPE: 9, CHAIN: 10, GLASS: 11, SKIN: 12 };

export const COLORS = {
  hemp: lin('#d9c8a0'), hempDark: lin('#a8946a'), iron: lin('#3b3f46'), tar: lin('#4a4034'),
  canvas: [lin('#a8522a'), lin('#d19a3a'), lin('#3d6b8f'), lin('#c9b68a'), lin('#8c4a3a'), lin('#5a8a9a'), lin('#b8763a')],
  wicker: lin('#8c6a43'), plank: lin('#7a5c3c'), plankPale: lin('#9c8460'), copper: lin('#b86a3c'), brass: lin('#c9a04a'),
  leaf: lin('#5a9a52'), leafDark: lin('#2a5a34'), lamp: lin('#ffcf7a'), cream: lin('#e8dcc0'), skin: lin('#5a3a28'),
};

export const NET_DEFAULT = { zA: 0, zB: -540, yA: 0, yB: 28, sag: 62, wA: 24, wM: 74, wB: 5, dish: 12, bow: 0, cell: 1.7, lanes: 2, cross: 12 };

// ---------------------------------------------------------------- the net as a function (mirrored in GLSL_NET)
export function makeNetFn(N0) {
  const N = { ...NET_DEFAULT, ...N0 }, L = N.zA - N.zB;
  const sOf = (z) => (N.zA - z) / L;
  const half = (s) => { const c = clamp(s, 0, 1), e = lerp(N.wA, N.wB, c); return e + (N.wM - e) * Math.pow(Math.max(Math.sin(Math.PI * c), 0), 0.7); };
  const cx = (s) => N.bow * Math.sin(Math.PI * clamp(s, 0, 1));
  const yC = (s) => lerp(N.yA, N.yB, s) - N.sag * 4 * s * (1 - s);
  const yST = (s, t) => yC(s) + N.dish * Math.sin(Math.PI * clamp(s, 0, 1)) * t * t;
  const tOf = (x, z) => { const s = clamp(sOf(z), 0, 1); return (x - cx(s)) / Math.max(half(s), 1); };
  const y = (x, z) => yST(clamp(sOf(z), 0, 1), tOf(x, z));
  const at = (s, t, out = [0, 0, 0]) => { out[0] = cx(s) + t * half(s); out[1] = yST(s, t); out[2] = N.zA - s * L; return out; };
  const inside = (x, z, m = 0) => { const s = sOf(z); if (s < 0 || s > 1) return false; return Math.abs(x - cx(s)) < half(s) - m; };
  // unit tangents of the surface at (s, t): along the net and across it
  const frame = (s, t) => {
    const a = at(s - 0.002, t), b = at(s + 0.002, t), c = at(s, t - 0.01), d = at(s, t + 0.01);
    const f = new THREE.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(), r = new THREE.Vector3(d[0] - c[0], d[1] - c[1], d[2] - c[2]).normalize();
    const up = new THREE.Vector3().crossVectors(r, f).normalize(); if (up.y < 0) up.negate();
    return { f, r, up };
  };
  const uniforms = () => ({
    uNetA: { value: new THREE.Vector4(N.zA, 1 / L, N.yA, N.yB) }, uNetB: { value: new THREE.Vector4(N.sag, N.wA, N.wM, N.wB) },
    uNetC: { value: new THREE.Vector4(N.dish, N.bow, N.wM / N.cell, L / N.cell) }, uNetD: { value: new THREE.Vector4(N.lanes, N.cross, L, N.cell) },
  });
  return { N, L, sOf, tOf, half, cx, yC, yST, y, at, inside, frame, uniforms };
}

// ---------------------------------------------------------------- the sway, in one table
// The shader's text below and the lane's test in the world file are both made from these numbers. The gust is a front
// on the clock: light air (gBase) everywhere and a band of gust that crosses the gulf with the wind; at a hang point
// it is gBase + gPeak x (the front's own strength, 0.55 to 1) x sin^2 over gWidth of each cycle, so its greatest value
// is gMax = gBase + gPeak. A thing swings about its hang point by (amp0 + ampG x gust) radians: 'along' times that
// along the wind, 'across' times that across it; the net heaves by heave0 + heaveG x gust metres; cloth and leaves
// flutter by (flut0 + flutG x gust) x 0.4 of their own measure; falling water leans (lean0 + leanG x gust) x depth^2.
export const SWAY = { amp0: 0.02, ampG: 0.055, along: 1.35, across: 0.45, heave0: 0.15, heaveG: 0.3, flut0: 0.45, flutG: 0.9, lean0: 0.012, leanG: 0.03, gBase: 0.16, gPeak: 0.84, gMax: 1, gWidth: 0.3 };
const gf = (x) => x.toFixed(4);
// ---------------------------------------------------------------- GLSL shared by every shader of the kit
const GLSL_COMMON = /* glsl */`
uniform float uTime, uPix;
uniform vec4 uGustF;                      // x fronts per metre along the wind, y fronts per second, z the drawn phase, w the fronts' seed
uniform vec4 uWind;                       // xy unit direction, z radians per metre, w radians per second
uniform vec4 uNetA, uNetB, uNetC, uNetD;  // see makeNetFn.uniforms
float hash11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i + vec2(1.,0.)), f.x), mix(hash12(i + vec2(0.,1.)), hash12(i + vec2(1.,1.)), f.x), f.y); }
float netS(float z){ return clamp((uNetA.x - z) * uNetA.y, 0., 1.); }
float netHalf(float s){ float e = mix(uNetB.y, uNetB.w, s); return e + (uNetB.z - e) * pow(clamp(sin(3.14159265 * s), 0., 1.), 0.7); }
float netCx(float s){ return uNetC.y * sin(3.14159265 * s); }
float netT(vec2 xz, float s){ return (xz.x - netCx(s)) / max(netHalf(s), 1.); }
float netY(vec2 xz){ float s = netS(xz.y); float t = clamp(netT(xz, s), -1.3, 1.3);
  return mix(uNetA.z, uNetA.w, s) - uNetB.x * 4. * s * (1. - s) + uNetC.x * sin(3.14159265 * s) * t * t; }
float gustPhase(vec2 xz){ return dot(xz, uWind.xy) * uWind.z - uTime * uWind.w; }
float gustF(vec2 xz){
  float c = dot(xz, uWind.xy) * uGustF.x - uTime * uGustF.y + uGustF.z, b = sin(3.14159265 * clamp(fract(c) / ${gf(SWAY.gWidth)}, 0., 1.));
  return ${gf(SWAY.gBase)} + ${gf(SWAY.gPeak)} * (0.55 + 0.45 * hash11(floor(c) + uGustF.w)) * b * b;
}
float heave(vec2 xz){ float ph = gustPhase(xz), sr = (uNetA.x - xz.y) * uNetA.y; return ((${gf(SWAY.heave0 - 0.05)} + ${gf(SWAY.heaveG)} * gustF(xz)) * sin(ph * 1.7 + 0.8) + 0.05 * sin(ph * 4.3 + uTime * 0.7)) * smoothstep(0., 0.07, sr) * (1. - smoothstep(0.93, 1., sr)); }
vec2 swayAng(vec3 pv, float seed){
  float ph = gustPhase(pv.xz);
  float g = 0.62 * sin(ph) + 0.38 * sin(ph * 0.43 + 1.7);
  float own = sin(uTime * (0.9 + 0.7 * fract(seed * 7.13)) + seed * 40.);
  float amp = ${gf(SWAY.amp0)} + ${gf(SWAY.ampG)} * gustF(pv.xz);
  return vec2(amp * (g + ${gf(SWAY.along - 1)} * own), amp * ${gf(SWAY.across)} * sin(ph * 0.71 + seed * 11. + uTime * 0.53));
}
vec3 rotAx(vec3 v, vec3 a, float t){ float c = cos(t), s = sin(t); return v * c + cross(a, v) * s + a * dot(a, v) * (1. - c); }
vec3 swayRot(vec3 v, vec2 ang){ v = rotAx(v, vec3(uWind.y, 0., -uWind.x), ang.x); return rotAx(v, vec3(uWind.x, 0., uWind.y), ang.y); }
vec3 qrot(vec4 q, vec3 v){ return v + 2. * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
// a train of lines at the integers, each 'duty' wide (in cells), seen through a box filter 'w' wide: exact, so no moire
float pulse(float x, float duty, float w){
  w = max(w, 1e-3); x += 0.5 * duty;
  float a = x - 0.5 * w, b = x + 0.5 * w;
  return clamp(((floor(b) * duty + min(fract(b), duty)) - (floor(a) * duty + min(fract(a), duty))) / w, 0., 1.);
}
// how much of the net covers point (s, t): fine diamond mesh, catwalk lanes, cross walks. blur in metres.
float netCover(float s, float t, float half_, float blur){
  float a = s * uNetC.w + t * uNetC.z, b = s * uNetC.w - t * uNetC.z;
  float bw = blur / uNetD.w;
  float mesh = max(pulse(a, 0.085, bw), pulse(b, 0.085, bw)) * 0.6;
  mesh = max(mesh, max(pulse(a * 0.5, 0.085, bw * 0.5), pulse(b * 0.5, 0.085, bw * 0.5)));
  float lane = pulse(t * uNetD.x, 1.7 * uNetD.x / max(half_, 1.), blur * uNetD.x / max(half_, 1.));
  float cross_ = pulse(s * uNetD.y, 1.7 * uNetD.y / uNetD.z, blur * uNetD.y / uNetD.z);
  float walks = max(lane, cross_) * 0.7;
  return max(mesh * 0.9, walks) * step(abs(t), 1.) ;
}
`;

const GLSL_LIGHT = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFogCol, uLampCol;
uniform float uFogDen, uLampK, uLantern;
uniform vec4 uMist;                        // rgb colour, a amount (the rare cloud through the city)
uniform float uShadeG[32];                 // the first mountain's shadow: the highest sun ray it cuts, on 32 lines across the sun's bearing
uniform vec4 uShadeP;                      // toward the sun in plan (x, z), tan of its elevation, 1 / the lines' spacing
uniform vec2 uShadeQ;                      // the first line's offset, the edge's softness (m)
uniform vec4 uHoles[4];                    // x, z, radius of the hatches through the mesh
// LIGHT BY PLACE. How far a point stands in the net's own shade: 0 in the open air, 1 well under the mesh and inside
// its outline (a rule of place in world space: the net and the town above cut the sky and half the sun)
float underNet(vec3 p){
  float sr = (uNetA.x - p.z) * uNetA.y, s = clamp(sr, 0., 1.), tt = netT(p.xz, s);
  float inside = smoothstep(0., 0.05, sr) * (1. - smoothstep(0.95, 1., sr)) * (1. - smoothstep(0.86, 1.04, abs(tt)));
  return inside * smoothstep(2., 10., netY(p.xz) - p.y);
}
// 1 where the sun's own ray to p comes down through a hatch: the shafts of sun in the town's shade
float shaftLit(vec3 p){
  float k = 1. / max(uSunDir.y, 0.25), t = (netY(p.xz) - p.y) * k; vec3 q = p + uSunDir * t; t += (netY(q.xz) - q.y) * k; q = p + uSunDir * t;
  float l = 0.; for (int i = 0; i < 4; i++) l = max(l, 1. - smoothstep(uHoles[i].z - 1.5, uHoles[i].z + 0.5, length(q.xz - uHoles[i].xy)));
  return l;
}
// 1 in the sun, 0 in the shade of the first mountain
float sunShadeW(vec3 p, float soft){
  float k = clamp((-p.x * uShadeP.y + p.z * uShadeP.x - uShadeQ.x) * uShadeP.w, 0., 30.999);
  int i = int(floor(k));
  float H = (p.x * uShadeP.x + p.z * uShadeP.y) * uShadeP.z + mix(uShadeG[i], uShadeG[i + 1], k - float(i));
  return smoothstep(-soft, soft, p.y - H);
}
float sunShade(vec3 p){ return sunShadeW(p, uShadeQ.y); }
// sun reaching a point under the net: the lattice's own shadow, softer with depth
float netShadow(vec3 p){
  float k = 1. / max(uSunDir.y, 0.25);
  float t = (netY(p.xz) - p.y) * k;
  vec3 q = p + uSunDir * t;
  t += (netY(q.xz) - q.y) * k;
  if (t < 0.15) return 1.;
  q = p + uSunDir * t;
  float s = netS(q.z), h = netHalf(s), tt = netT(q.xz, s);
  float edge = smoothstep(0., 0.04, s) * (1. - smoothstep(0.96, 1., s));
  float c = netCover(s, tt, h, 0.16 + t * 0.022);
  return 1. - 0.86 * c * edge;
}
vec3 applyFog(vec3 col, vec3 emis, vec3 w){
  float d = length(w - cameraPosition);
  float f = 1. - exp(-d * d * uFogDen * uFogDen);
  col = mix(col, uFogCol, clamp(f, 0., 1.));
  float m = uMist.a * (1. - exp(-d * 0.034)) * (0.8 + 0.2 * vnoise(vec2(w.x + w.z, w.y - uTime * 5.) * 0.07));
  col = mix(col, uMist.rgb, clamp(m, 0., 1.));
  return col + emis * (1. - 0.6 * clamp(f + m, 0., 1.));
}
`;

const VERT_SOLID = /* glsl */`
attribute vec4 color;          // rgb albedo, a = how much this vertex flutters (cloth, vines) or heaves (cables)
attribute vec4 aMat;           // x: 1 = the rope above the thing (unit length, stretched to the drop), y emissive, z thin-tube radius, w pattern
#ifdef HUNG
attribute vec3 iPivot;         // the point it sways from
attribute vec3 iAt;            // from the pivot to the thing's own top
attribute vec4 iQuat;
attribute vec4 iPar;           // rope length above the top, scale, seed, motion (0..1 travels up and down its string, <0 turns, >=2 walks)
attribute vec4 iTint;          // rgb tint, a = own swing
#endif
varying vec3 vW; varying vec3 vN; varying vec3 vO; varying vec4 vCol; varying vec4 vMat; varying vec4 vTint; varying float vSeed;
${GLSL_COMMON}
void main(){
  vec3 p = position, n = normal; float rad = aMat.z;
#ifdef HUNG
  float rope = iPar.x, sc = iPar.y, seed = iPar.z, mo = iPar.w;
  float trav = (mo > 0. && mo <= 1.) ? mo * (0.5 + 0.5 * sin(uTime * (0.2 + 0.22 * fract(seed * 3.7)) + seed * 50.)) : 0.;
  vec3 lp;
  if (aMat.x > 0.5) lp = vec3(0., p.y > 1. ? max(rope * (1. - trav) - (2. - p.y), 0.) : p.y * rope * (1. - trav), 0.);
  else { lp = p * sc; rad *= sc; }
  vO = lp;
  float fl = color.a;
  float G = gustF(iPivot.xz);
  if (fl > 0.) lp += fl * sc * (${gf(SWAY.flut0)} + ${gf(SWAY.flutG)} * G) * 0.4 * vec3(sin(uTime * 2.3 + p.y * 1.9 + seed * 20.), 0.25 * sin(uTime * 3.1 + p.x * 2.3 + seed * 7.), cos(uTime * 1.9 + p.y * 2.3 + p.x + seed * 31.));
  if (mo < 0.) { float a = uTime * -mo + seed * 6.28; float c = cos(a), s = sin(a); lp = vec3(c * lp.x + s * lp.z, lp.y, -s * lp.x + c * lp.z); n = vec3(c * n.x + s * n.z, n.y, -s * n.x + c * n.z); }
  if (iTint.a > 0.) { float a = iTint.a * sin(uTime * (1.2 + fract(seed * 5.3)) + seed * 17.); float c = cos(a), s = sin(a); lp = vec3(lp.x, c * lp.y - s * lp.z, s * lp.y + c * lp.z); n = vec3(n.x, c * n.y - s * n.z, s * n.y + c * n.z); }
  if (mo >= 2.) lp.x += (mo - 2.) * sin(uTime * 0.11 + seed * 30.);
  lp = qrot(iQuat, lp); n = qrot(iQuat, n);
  vec3 rel = iAt + vec3(0., rope * trav, 0.) + lp;
  if (aMat.w > 6.5 && aMat.w < 7.5) rel.xz += uWind.xy * (${gf(SWAY.lean0)} + ${gf(SWAY.leanG)} * G) * lp.y * lp.y;      // falling water leans downwind, more the farther it has fallen
  vec2 ang = swayAng(iPivot, seed);
  rel = swayRot(rel, ang); n = swayRot(n, ang);
  vec3 wc = iPivot + rel; wc.y += heave(iPivot.xz);
  vTint = iTint; vSeed = seed;
#else
  vO = p; vec3 wc = p; wc.y += heave(p.xz) * color.a; vTint = vec4(1.); vSeed = 0.;
#endif
  wc = (modelMatrix * vec4(wc, 1.)).xyz; n = normalize(mat3(modelMatrix) * n + vec3(0., 1e-6, 0.));
  if (rad > 0.) wc += n * rad;                                       // a rope is as thick as it is, at any distance
  vW = wc; vN = n; vCol = color; vMat = aMat;
  gl_Position = projectionMatrix * viewMatrix * vec4(wc, 1.);
}`;

const FRAG_SOLID = /* glsl */`
varying vec3 vW; varying vec3 vN; varying vec3 vO; varying vec4 vCol; varying vec4 vMat; varying vec4 vTint; varying float vSeed;
${GLSL_COMMON}
${GLSL_LIGHT}
float lineAA(float d, float hw, float px){ px = max(px, 1e-4); return clamp((hw - d) / px + 0.5, 0., 1.) * clamp(2. * hw / px, 0., 1.); }
void main(){
  vec3 V = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (dot(N, V) < 0.) N = -N;
  float pat = vMat.w; vec3 alb = vCol.rgb, tint = vTint.rgb; float spec = 0., gloss = 30., trans = 0., lantern = 0., rimK = 0.35, thru = 0., sheen = 0.;
  float px = clamp(length(fwidth(vO)), 1e-4, 4.);
#ifndef HUNG
  if ((pat > 0.5 && pat < 1.5) || (pat > 4.5 && pat < 5.5)) tint = vCol.rgb;       // a canvas or an awning of the static mesh carries its own colour
#endif
  if (pat < 0.5) { }
  else if (pat < 1.5) {                                   // stitched, patched canvas in gores
    float ang = atan(vO.z, vO.x + 1e-5), R = max(length(vO.xz), 0.05);
    float ga = ang / 6.2831853 * 8., pw = 6.2831853 * R / 8., gid = floor(ga + 100.);
    float h1 = hash11(gid * 1.37 + vSeed * 91.);
    alb = mix(tint, vec3(dot(tint, vec3(0.3, 0.5, 0.2))) * vec3(1.12, 1., 0.8), 0.24) * (0.86 + 0.2 * h1);
    alb = mix(alb, mix(vec3(0.56, 0.5, 0.37), tint * 0.6, hash11(gid * 5.7 + vSeed * 3.)), step(0.86, hash11(gid * 3.1 + vSeed * 17.)) * 0.6);
    vec2 pc = vec2(ga * 2., vO.y / max(pw * 0.5, 0.1)) + vSeed * 7.; vec2 ci = floor(pc), cf = fract(pc);
    float inP = step(0.8, hash12(ci)) * step(0.12, cf.x) * step(cf.x, 0.88) * step(0.15, cf.y) * step(cf.y, 0.85) * clamp(0.5 * pw / px, 0., 1.);
    vec3 pcol = hash12(ci + 3.7) < 0.22 ? mix(vec3(0.2, 0.32, 0.42), vec3(0.5, 0.27, 0.16), step(0.5, hash12(ci + 5.3))) : vec3(0.56, 0.5, 0.37);
    alb = mix(alb, pcol * (0.6 + 0.5 * hash12(ci + 9.1)), inP * 0.85);
    alb *= 1. - 0.35 * inP * (1. - step(0.17, cf.x) * step(cf.x, 0.83) * step(0.2, cf.y) * step(cf.y, 0.8)) * clamp(0.03 * 8. / px, 0., 1.);
    float ds = (0.5 - abs(fract(ga) - 0.5)) * pw;
    alb *= 1. - 0.5 * lineAA(ds, 0.04, px);
    float band = lineAA(abs(fract(vO.y * 0.31 + vSeed * 3.) - 0.5), 0.07, px * 0.31) * step(0.55, hash11(vSeed * 71.));
    alb = mix(alb, vec3(0.78, 0.7, 0.52), band * 0.6);
    alb *= 1. + (vnoise(vec2(ga * 70., vO.y * 16.)) - 0.5) * 0.3 * clamp(0.05 / px, 0., 1.);
    alb *= 0.8 + 0.3 * smoothstep(-7., 0., vO.y);
    trans = 0.45; lantern = 0.55 + 0.45 * h1;
  } else if (pat < 2.5) {                                 // wicker
    float ang = atan(vO.z, vO.x + 1e-5), R = max(length(vO.xz), 0.05);
    vec2 w = vec2(ang * R * 7., vO.y * 9.); float k = clamp(0.06 / px, 0., 1.);
    float wv = step(0.5, fract(w.x + 0.5 * step(0.5, fract(w.y))));
    alb *= 1. + (wv - 0.5) * 0.5 * k; alb *= 0.9 + 0.2 * hash11(vSeed * 13.);
  } else if (pat < 3.5) {                                 // weathered wood
    alb *= (0.8 + 0.4 * vnoise(vec2(vO.x * 2.1 + vSeed * 9., (vO.z + vO.y) * 22.))) * (0.85 + 0.3 * hash11(vSeed * 57.));
    alb = mix(alb, alb * tint, 0.4 + 0.5 * step(0.95, min(vCol.r, min(vCol.g, vCol.b)))); sheen = 0.35;
  } else if (pat < 4.5) {                                   // copper, brass; grey iron rusts in patches
    float iron = 1. - smoothstep(0.03, 0.09, max(vCol.r, max(vCol.g, vCol.b)) - min(vCol.r, min(vCol.g, vCol.b)));
    float rust = smoothstep(0.42, 0.7, vnoise(vO.xy * 2.7 + vO.z * 2.1 + vSeed * 20.) * 0.7 + 0.3 * vnoise(vO.yz * 11. + vO.x * 9.));
    alb = mix(alb, vec3(0.4, 0.19, 0.09) * (0.7 + 0.6 * vnoise(vO.xz * 13.)), rust * iron * 0.8);
    spec = 1.1 * (1. - 0.75 * rust * iron); gloss = 36.; alb *= 0.85 + 0.3 * vnoise(vO.xy * 9. + vO.z * 7.); sheen = 1.;
  }
  else if (pat < 5.5) {                                   // striped awning
    float st = pulse(vO.x * 0.8 + 0.25, 0.5, px * 0.8);
    alb = mix(tint, vec3(0.82, 0.76, 0.6), st) * (0.9 + 0.2 * vnoise(vO.xz * 5.)); trans = 0.6;
  } else if (pat < 6.5) {                                 // leaves
    alb *= 0.8 + 0.3 * vnoise(vO.xy * 5. + vO.z * 3. + vSeed * 30.); alb = mix(alb, alb.grb * vec3(0.9, 0.8, 0.5), 0.3 * hash11(vSeed * 37.)) * 1.25; trans = 0.45; thru = 0.6;
  } else if (pat < 7.5) {                                 // a shower: bright drops falling in a fan that widens and thins; no stipple
    float dep = clamp(-vO.y / 7., 0., 1.), ang = atan(vO.z, vO.x + 1e-5);
    vec2 dc = vec2(ang * 4.8, (vO.y + uTime * (5. + 2. * fract(vSeed * 3.1))) * 1.1 + vSeed * 9.), di = floor(dc), df = fract(dc);
    float drop = step(hash12(di + vSeed * 17.), 0.78 - 0.66 * dep) * step(abs(df.x - 0.5), 0.15 + 0.1 * dep) * step(0.08, df.y) * step(df.y, 0.8);
    if (drop * (1. - smoothstep(0.9, 1., dep)) < 0.5) discard;
    alb = vec3(0.82, 0.92, 1.) * (1.2 + 0.6 * df.y); spec = 2.; gloss = 12.; trans = 0.8;
  } else if (pat < 8.5) { trans = 0.7; alb *= 0.92 + 0.16 * vnoise(vO.xy * 30.) * clamp(0.04 / px, 0., 1.); alb = mix(alb, alb * tint, vTint.r < 0.999 || vTint.g < 0.999 ? 1. : 0.); }   // cloth
  else if (pat < 9.5) {                                   // hemp rope: a twist
    float tw = sin(dot(vO, vec3(17., 23., 17.)) + dot(N, vec3(4., 2., 5.)));
    alb *= 0.62 * (0.74 + 0.2 * tw * clamp(0.05 / px, 0., 1.)); rimK = 0.5; sheen = 0.55;
  } else if (pat < 10.5) {                                  // a chain seen as a line: links alternate, iron with rust
    float lk = step(0.5, fract(dot(vO, vec3(0.9, 0.9, 0.9)))), kk = clamp(0.6 / px, 0., 1.);
    alb = mix(alb * 1.5, vec3(0.4, 0.2, 0.1), 0.45 * vnoise(vO.xz * 1.7 + vO.y * 1.3)) * (0.8 + 0.45 * lk * kk); spec = 0.7; gloss = 24.; rimK = 0.6; sheen = 1.;
  }
  else if (pat < 11.5) { spec = 0.8; gloss = 60.; }       // glass
  else { spec = 0.35; gloss = 14.; alb *= 0.85 + 0.3 * vnoise(vO.xy * 6. + vO.z * 5.); }                 // skins of water
  float un = underNet(vW), shaft = shaftLit(vW);
  float ndl = dot(N, uSunDir), sh = netShadow(vW) * sunShade(vW) * mix(1., mix(0.58, 1.12, shaft), un);       // under the net: half the sun, the whole of it in a hatch's shaft
  float under = 0.6 + 0.4 * smoothstep(-0.8, 0.2, N.y);                 // every hung thing shades its own underside
  vec3 skyL = mix(uGndCol, uSkyCol, N.y * 0.5 + 0.5) * mix(vec3(1.), vec3(0.7, 0.86, 1.14), un);              // the net's shade is cooler than the open air
  vec3 light = uSunCol * clamp(ndl * 0.82 + 0.18, 0., 1.) * sh + skyL * under * (1. + thru) + uLampCol * un * (0.05 + 0.1 * uLantern);      // and the lamps' warm light fills it a little at every hour
  light += uSunCol * trans * clamp(-ndl, 0., 1.) * sh * 0.5;
  vec3 col = alb * light;
  // the sun from the side or behind catches the edge of sacks and the fibres of ropes
  float back = clamp(0.55 - 0.9 * dot(V, uSunDir), 0., 1.4), fres = 1. - clamp(dot(N, V), 0., 1.);
  col += uSunCol * (alb * 0.75 + 0.05) * (fres * fres * fres) * back * sh * (0.5 + trans) + uSunCol * alb * rimK * back * sh * 0.22;
  vec3 H = normalize(V + uSunDir);
  col += uSunCol * spec * pow(clamp(dot(N, H), 0., 1.), gloss) * sh * 0.5;
  col += alb * uSkyCol * pow(1. - clamp(dot(N, V), 0., 1.), 3.) * 0.3;
  // iron, chain, rope and wood take the sky's light: on their upper side, and as a rim at grazing angles (a rule of
  // the material, everywhere), so a chain or a ladder against the bright cloud has form and is never a flat dark shape
  col += uSkyCol * sheen * (0.16 * smoothstep(-0.1, 0.9, N.y) + (0.3 + 0.7 * smoothstep(-0.3, 0.5, N.y)) * fres * fres * 0.75);
  float flick = 0.86 + 0.14 * sin(uTime * (7. + 5. * fract(vSeed * 9.7)) + vSeed * 80.) * sin(uTime * 2.3 + vSeed * 31.);
  vec3 emis = uLampCol * vMat.y * uLampK * flick;
  emis += uLampCol * alb * lantern * uLantern * (0.7 + 0.6 * (1. - smoothstep(-5., -1., vO.y))) * flick;
  gl_FragColor = vec4(applyFog(col, emis, vW), 1.);
}`;

const VERT_NET = /* glsl */`
attribute vec2 aST;
varying vec2 vST; varying vec3 vW; varying vec3 vN;
${GLSL_COMMON}
void main(){
  vec3 wc = position; wc.y += heave(wc.xz);
  wc = (modelMatrix * vec4(wc, 1.)).xyz;
  vST = aST; vW = wc; vN = mat3(modelMatrix) * normal;
  gl_Position = projectionMatrix * viewMatrix * vec4(wc, 1.);
}`;

const FRAG_NET = /* glsl */`
varying vec2 vST; varying vec3 vW; varying vec3 vN;
uniform vec3 uHemp;
${GLSL_COMMON}
${GLSL_LIGHT}
void main(){
  float s = vST.x, t = vST.y;
  float a = s * uNetC.w + t * uNetC.z, b = s * uNetC.w - t * uNetC.z;
  vec2 wp = vec2(vnoise(vec2(a, b) * 0.19), vnoise(vec2(b, a) * 0.19 + 7.3)) - 0.5;
  a += wp.x * 1.05; b += wp.y * 1.05;
  vec2 wq = vec2(vnoise(vec2(a, b) * 0.61 + 3.1), vnoise(vec2(b, a) * 0.61 + 9.4)) - 0.5;      // no two cells alike
  a += wq.x * 0.32; b += wq.y * 0.32;
  float wa = clamp(fwidth(a), 1e-4, 8.), wb = clamp(fwidth(b), 1e-4, 8.);
  // THE NET IS ROPE: every strand sags between its knots (bowed, each by its own amount; nothing at the knots themselves),
  // the main ropes differ in thickness, and the fine strands are drawn a little soft so they never thin to a ruled hairline
  float a2 = a + (hash12(vec2(floor(a + 0.5), floor(b))) - 0.3) * 0.22 * sin(3.14159265 * fract(b));
  float b2 = b + (hash12(vec2(floor(a), floor(b + 0.5)) + 7.7) - 0.3) * 0.22 * sin(3.14159265 * fract(a));
  float ha = mix(0.18 + 0.95 * hash11(floor(a + 0.5) * 3.71), 0.66, clamp(wa * 1.5, 0., 1.)), hb = mix(0.18 + 0.95 * hash11(floor(b + 0.5) * 5.13 + 2.), 0.66, clamp(wb * 1.5, 0., 1.));
  float m = max(pulse(a2, 0.034, wa * 1.8) * ha, pulse(b2, 0.034, wb * 1.8) * hb);
  float mb = max(pulse(a2 * 0.5, 0.034 + 0.026 * hash11(floor(a * 0.5 + 0.5) * 1.9), wa * 0.5), pulse(b2 * 0.5, 0.034 + 0.026 * hash11(floor(b * 0.5 + 0.5) * 2.3 + 5.), wb * 0.5));
  float m2 = max(pulse(a2 * 4., 0.06, wa * 4.), pulse(b2 * 4., 0.06, wb * 4.));
  float knot = pulse(a * 0.5, 0.1, wa * 0.5) * pulse(b * 0.5, 0.1, wb * 0.5);
  float mend = smoothstep(0.6, 0.74, vnoise(vec2(a, b) * 0.055 + 3.7));        // patches where the mesh has been mended closer
  float cov = max(max(max(m * 0.85, mb), knot), m2 * (0.24 + 0.5 * mend));
  cov *= 0.72 + 0.28 * smoothstep(0.25, 0.6, vnoise(vec2(b, a) * 0.031 + 11.));
  for (int i = 0; i < 4; i++) cov *= smoothstep(uHoles[i].z, uHoles[i].z + 0.7, length(vW.xz - uHoles[i].xy));
  cov *= smoothstep(0., 0.012, s) * (1. - smoothstep(0.988, 1., s));
  if (cov < 0.004) discard;
  float up = step(0., dot(vN, cameraPosition - vW));
  cov = mix(clamp(cov * 1.25, 0., 1.), cov, up);
  vec3 Vn = normalize(cameraPosition - vW + vec3(0., 1e-5, 0.));
  float thru = clamp(dot(-Vn, uSunDir), 0., 1.); thru *= thru; thru *= thru;       // looking up toward the sun through the mesh
  vec3 light = uSunCol * mix(0.36 + 1.3 * thru, 0.62, up) * (0.12 + 0.88 * sunShade(vW)) + mix(uGndCol, uSkyCol, 0.5 + 0.5 * (up * 2. - 1.) * 0.7) * mix(0.75, 1., up);
  vec3 col = uHemp * mix(vec3(1.2, 0.82, 0.42), vec3(0.78, 0.62, 0.38), up) * light * (0.6 + 0.45 * vnoise(vec2(a, b) * 0.37)) * mix(0.64, 1., max(mb, knot));
  col *= mix(vec3(0.74, 0.66, 0.52), vec3(1.05), smoothstep(0.25, 0.75, vnoise(vec2(a, b) * 0.043 + 5.)));     // older, tarred stretches and newer ones
  gl_FragColor = vec4(applyFog(col, vec3(0.), vW), clamp(cov, 0., 1.));
}`;

const VERT_GLOW = /* glsl */`
attribute vec3 iPivot; attribute vec3 iAt; attribute vec4 iPar; attribute vec3 iCol;
varying vec2 vUv; varying vec3 vCol; varying float vFog;
${GLSL_COMMON}
uniform float uFogDen;
void main(){
  vec3 rel = swayRot(iAt, swayAng(iPivot, iPar.y));
  vec3 wc = iPivot + rel; wc.y += heave(iPivot.xz);
  vec4 mv = viewMatrix * modelMatrix * vec4(wc, 1.);
  float d = max(-mv.z, 0.1);
  float size = max(iPar.x, 2.2 * uPix / projectionMatrix[1][1] * d);   // never under 2.2 pixels of the lens that is drawing; the light borrowed is paid back in vCol
  mv.xy += position.xy * size; mv.z += min(0.5, d * 0.3);
  vUv = position.xy;
  float flick = 0.85 + 0.15 * sin(uTime * (7. + 5. * fract(iPar.y * 9.7)) + iPar.y * 80.) * sin(uTime * 2.3 + iPar.y * 31.);
  vCol = iCol * flick * (iPar.x / size) * (iPar.x / size) * clamp(d / 2.5 - 0.3, 0., 1.);
  vFog = exp(-d * d * uFogDen * uFogDen);
  gl_Position = projectionMatrix * mv;
}`;

const FRAG_GLOW = /* glsl */`
varying vec2 vUv; varying vec3 vCol; varying float vFog;
uniform float uLampK;
void main(){
  float r2 = clamp(dot(vUv, vUv), 0., 1.);
  float g = (exp(-r2 * 6.) * 0.55 + exp(-r2 * 46.) * 1.6) * (1. - r2) * (1. - r2);
  gl_FragColor = vec4(vCol * g * uLampK * (0.35 + 0.65 * vFog), 1.);
}`;

// smoke from the stovepipes: a ribbon that rises from the pipe (which sways with its house) and bends over downwind
// PLUME: the ribbon's own shape for the world's lane test, the same numbers as VERT_SMOKE below: its height for a
// scale and a seed; its greatest and least lean (the gust at its greatest and at light air); the point of its middle
// line at v in 0..1 for a lean ([metres up, metres down the wind] from the pipe's top); its half width there (the
// ribbon's own and its waver)
export const PLUME = {
  height: (sc, seed) => 6.5 * sc * (0.8 + 0.5 * ((seed * 3.3) % 1)),
  leanMax: (0.45 + 0.75 * (SWAY.gBase + SWAY.gPeak)) * 1.15, leanMin: (0.45 + 0.75 * SWAY.gBase) * 0.85,
  at: (H, lean, v) => [H * v * (1 - 0.22 * v * lean), lean * H * v * v],
  half: (sc, v) => sc * (0.14 + 1.25 * v) + 0.28 * sc * v,
};
const VERT_SMOKE = /* glsl */`
attribute vec3 iPivot; attribute vec3 iAt; attribute vec4 iPar;
varying vec2 vUv; varying float vSeed; varying vec3 vW;
${GLSL_COMMON}
void main(){
  float seed = iPar.y, v = position.y;
  vec3 base = iPivot + swayRot(iAt, swayAng(iPivot, seed)); base.y += heave(iPivot.xz);
  float H = 6.5 * iPar.x * (0.8 + 0.5 * fract(seed * 3.3));
  float lean = (0.45 + 0.75 * gustF(iPivot.xz)) * (0.85 + 0.3 * sin(gustPhase(iPivot.xz)));
  vec3 wd = vec3(uWind.x, 0., uWind.y);
  vec3 c = base + vec3(0., H * v * (1. - 0.22 * v * lean), 0.) + wd * (lean * H * v * v);
  c.xz += 0.28 * iPar.x * v * vec2(sin(uTime * 1.3 + v * 5. + seed * 40.), cos(uTime * 1.1 + v * 4. + seed * 23.));
  c = (modelMatrix * vec4(c, 1.)).xyz;
  vec3 tg = normalize(vec3(0., 1., 0.) + wd * (2. * lean * v));
  vec3 sd = normalize(cross(tg, normalize(cameraPosition - c)) + vec3(1e-5, 0., 0.));
  c += sd * position.x * iPar.x * (0.14 + 1.25 * v);
  vUv = vec2(position.x, v); vSeed = seed; vW = c;
  gl_Position = projectionMatrix * viewMatrix * vec4(c, 1.);
}`;
const FRAG_SMOKE = /* glsl */`
varying vec2 vUv; varying float vSeed; varying vec3 vW;
${GLSL_COMMON}
${GLSL_LIGHT}
void main(){
  float n = 0.4 + 0.6 * vnoise(vec2(vUv.x * 1.5 + vSeed * 10., vUv.y * 4.5 - uTime * 0.6 + vSeed * 3.));
  float e = clamp(1. - vUv.x * vUv.x, 0., 1.);
  float h = clamp(1. - vUv.y, 0., 1.);
  float a = e * e * smoothstep(0., 0.06, vUv.y) * h * sqrt(h) * n * 0.62 * (1. - uMist.a);
  vec3 col = (uSunCol * 0.5 * sunShade(vW) + uSkyCol + uGndCol * 0.6) * vec3(0.78, 0.79, 0.82) + uLampCol * 0.1 * uLantern * h;
  float d = length(vW - cameraPosition);
  col = mix(col, uFogCol, clamp(1. - exp(-d * d * uFogDen * uFogDen), 0., 1.));
  gl_FragColor = vec4(col, clamp(a, 0., 1.));
}`;

// ---------------------------------------------------------------- a small mesh builder
// Every vertex carries: position, normal, colour (+ flutter weight) and aMat. A "thin" vertex sits on the centre line of a
// rope with its normal as the radial direction and the radius in aMat.z; the shader pushes it out by that radius.
const _m4 = new THREE.Matrix4(), _v3 = new THREE.Vector3(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
class Geo {
  constructor() { this.P = []; this.N = []; this.C = []; this.M = []; this.I = []; this.col = [1, 1, 1]; this.flex = 0; this.pat = 0; this.emis = 0; this.isRope = 0; this.m = null; this.sc = 1; this.stack = []; }
  set(col, pat = 0, emis = 0) { this.col = col; this.pat = pat; this.emis = emis; return this; }
  push(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz, 'YXZ')), new THREE.Vector3(s, s, s));
    this.stack.push([this.m, this.sc]); this.m = this.m ? this.m.clone().multiply(m) : m; this.sc *= s; return this;
  }
  pop() { const t = this.stack.pop(); this.m = t[0]; this.sc = t[1]; return this; }
  v(x, y, z, nx, ny, nz, rad = 0, flex = this.flex) {
    if (this.m) {
      const e = this.m.elements, X = e[0] * x + e[4] * y + e[8] * z + e[12], Y = e[1] * x + e[5] * y + e[9] * z + e[13], Z = e[2] * x + e[6] * y + e[10] * z + e[14];
      const NX = e[0] * nx + e[4] * ny + e[8] * nz, NY = e[1] * nx + e[5] * ny + e[9] * nz, NZ = e[2] * nx + e[6] * ny + e[10] * nz, l = Math.hypot(NX, NY, NZ) || 1;
      x = X; y = Y; z = Z; nx = NX / l; ny = NY / l; nz = NZ / l; rad *= this.sc;
    }
    this.P.push(x, y, z); this.N.push(nx, ny, nz); this.C.push(this.col[0], this.col[1], this.col[2], flex); this.M.push(this.isRope, this.emis, rad, this.pat);
    return this.P.length / 3 - 1;
  }
  tri(a, b, c) { this.I.push(a, b, c); }
  quad(a, b, c, d) { this.I.push(a, b, c, a, c, d); }
  // surface of revolution about Y. prof: [[r, y], ...] from the top down. o.flute(angle, row) scales r, o.sx squashes x
  lathe(prof, segs, o = {}) {
    const rows = prof.length, ids = [];
    for (let i = 0; i < rows; i++) {
      const a = prof[Math.max(0, i - 1)], b = prof[Math.min(rows - 1, i + 1)], dr = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dr, dy) || 1, nr = -dy / l, ny = dr / l;
      for (let j = 0; j <= segs; j++) {
        const ang = j / segs * TAU, k = o.flute ? o.flute(ang, i) : 1, c = Math.cos(ang), s = Math.sin(ang);
        ids.push(this.v(c * prof[i][0] * k * (o.sx ?? 1), prof[i][1], s * prof[i][0] * k, c * nr, ny, s * nr));
      }
    }
    for (let i = 0; i < rows - 1; i++) for (let j = 0; j < segs; j++) { const a = ids[i * (segs + 1) + j], b = ids[i * (segs + 1) + j + 1], c = ids[(i + 1) * (segs + 1) + j + 1], d = ids[(i + 1) * (segs + 1) + j]; this.quad(a, b, c, d); }
    return this;
  }
  box(x0, y0, z0, x1, y1, z1, skip = '') {
    const f = (n, a, b, c, d) => { const i = [a, b, c, d].map((p) => this.v(p[0], p[1], p[2], n[0], n[1], n[2])); this.quad(i[0], i[1], i[2], i[3]); };
    if (!skip.includes('y')) f([0, -1, 0], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1]);
    if (!skip.includes('Y')) f([0, 1, 0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0]);
    if (!skip.includes('x')) f([-1, 0, 0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]);
    if (!skip.includes('X')) f([1, 0, 0], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]);
    if (!skip.includes('z')) f([0, 0, -1], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0]);
    if (!skip.includes('Z')) f([0, 0, 1], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]);
    return this;
  }
  // a swept tube. thin = true: centre-line encoding (ropes, cords, rungs); false: real thickness (poles, links)
  sweep(pts, rad, sides, thin, closed = false) {
    const n = pts.length, ids = [], T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)], p = pts[i];
      T.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      up.set(0, 1, 0); if (Math.abs(T.y) > 0.9) up.set(1, 0, 0);
      A.crossVectors(T, up).normalize(); B.crossVectors(T, A);
      const r = Array.isArray(rad) ? rad[i] : rad;
      for (let k = 0; k < sides; k++) {
        const an = k / sides * TAU, c = Math.cos(an), s = Math.sin(an), nx = A.x * c + B.x * s, ny = A.y * c + B.y * s, nz = A.z * c + B.z * s;
        ids.push(thin ? this.v(p[0], p[1], p[2], nx, ny, nz, r) : this.v(p[0] + nx * r, p[1] + ny * r, p[2] + nz * r, nx, ny, nz));
      }
    }
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) for (let k = 0; k < sides; k++) { const i2 = (i + 1) % n, k2 = (k + 1) % sides; this.quad(ids[i * sides + k], ids[i * sides + k2], ids[i2 * sides + k2], ids[i2 * sides + k]); }
    return this;
  }
  rope(pts, rad = 0.03, sides = 4) { return this.sweep(pts, rad, sides, true); }
  pole(pts, rad = 0.06, sides = 6) { return this.sweep(pts, rad, sides, false); }
  // the unit rope above a thing: from its top (0,0,0) up to (0,1,0); the shader stretches it to the instance's drop
  // (a y over 1 is a fixed length under the hang point: 2 is the hang point itself, 1.55 is 0.45 m below it: the knot)
  ropeUp(rad = 0.035, col = COLORS.hemp, sides = 4) { const c = this.col, p = this.pat, e = this.emis; this.set(col, PAT.ROPE); this.isRope = 1; this.rope([[0, 0, 0], [0, 1, 0]], rad, sides); this.sweep([[0, 1.55, 0], [0, 1.66, 0], [0, 2, 0]], [rad, rad * 2.2, rad * 2.2], sides, true); this.isRope = 0; this.set(c, p, e); return this; }
  disc(cx, cy, cz, r, segs, ny = 1) {
    const c = this.v(cx, cy, cz, 0, ny, 0), ids = [];
    for (let j = 0; j <= segs; j++) { const a = j / segs * TAU; ids.push(this.v(cx + Math.cos(a) * r, cy, cz + Math.sin(a) * r, 0, ny, 0)); }
    for (let j = 0; j < segs; j++) this.tri(c, ids[j], ids[j + 1]);
    return this;
  }
  ball(cx, cy, cz, rx, ry, rz, segs = 7, rings = 4) {
    const ids = [];
    for (let i = 0; i <= rings; i++) { const ph = i / rings * Math.PI, sp = Math.sin(ph), cp = Math.cos(ph);
      for (let j = 0; j <= segs; j++) { const a = j / segs * TAU, nx = Math.cos(a) * sp, nz = Math.sin(a) * sp; ids.push(this.v(cx + nx * rx, cy + cp * ry, cz + nz * rz, nx, cp, nz)); } }
    for (let i = 0; i < rings; i++) for (let j = 0; j < segs; j++) { const a = i * (segs + 1) + j; this.quad(ids[a], ids[a + 1], ids[a + segs + 2], ids[a + segs + 1]); }
    return this;
  }
  // a sheet of nu x nv quads; fn(u, v) -> [x, y, z, flex?]
  sheet(nu, nv, fn) {
    const ids = [], P = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) P.push(fn(i / nu, j / nv));
    const at = (i, j) => P[clamp(j, 0, nv) * (nu + 1) + clamp(i, 0, nu)];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const a = at(i - 1, j), b = at(i + 1, j), c = at(i, j - 1), d = at(i, j + 1), p = at(i, j);
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - c[0], vy = d[1] - c[1], vz = d[2] - c[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1;
      ids.push(this.v(p[0], p[1], p[2], nx / l, ny / l, nz / l, 0, p[3] ?? this.flex));
    }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i; this.quad(ids[a], ids[a + 1], ids[a + nu + 2], ids[a + nu + 1]); }
    return this;
  }
  // a disc in the XY plane facing +Z
  discZ(r, segs, z = 0) {
    const c = this.v(0, 0, z, 0, 0, 1), ids = [];
    for (let j = 0; j <= segs; j++) { const a = j / segs * TAU; ids.push(this.v(Math.cos(a) * r, Math.sin(a) * r, z, 0, 0, 1)); }
    for (let j = 0; j < segs; j++) this.tri(c, ids[j], ids[j + 1]);
    return this;
  }
  // a ring (torus) about the Y axis at height y
  ring(y, R, r, segs = 10, sides = 4, thin = false) { const pts = []; for (let j = 0; j < segs; j++) { const a = j / segs * TAU; pts.push([Math.cos(a) * R, y, Math.sin(a) * R]); } return this.sweep(pts, r, sides, thin, true); }
  get triangles() { return this.I.length / 3; }
  toGeometry() {
    const g = new THREE.BufferGeometry(), n = this.P.length / 3;
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 4)); g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.M, 4));
    g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1));
    return g;
  }
}

// ---------------------------------------------------------------- the things that hang. Local space: the hang point is the
// origin, the thing lies below it. Each maker returns { g: Geo, h (depth below the hang point), r (radius), ...points }.
const C = COLORS;

// a house made like a sack: a gathered neck on a bridle, a bulging stitched body, round lit windows, a stovepipe, a door with a step
export function sackGeo(rng, o = {}) {
  const g = new Geo(), H = o.H ?? 6, R = o.R ?? 2.4, segs = o.segs ?? 10, rows = o.rows ?? 9, nk = 0.9 + H * 0.08, rn = R * 0.2, shape = o.shape ?? 'pear', far = !!o.far;      // far: the plain form (same size and outline, fewer sides, no fittings)
  const f = (v) => {
    let k = Math.pow(Math.sin(Math.PI * Math.pow(v, shape === 'round' ? 1.25 : 1.7)), shape === 'round' ? 0.6 : 0.56);
    if (shape === 'gourd') k *= 1 - 0.3 * Math.exp(-(((v - 0.46) / 0.1) ** 2));
    return Math.max(k, v < 0.5 ? rn / R * (1 + 2 * v) : 0);
  };
  const lean = rng.range(-0.05, 0.05);
  g.ropeUp(o.small ? 0.05 : R > 4 ? 0.15 : 0.1, undefined, far ? 3 : 4);
  g.set(C.hemp, PAT.ROPE);
  const nb = far ? (o.small ? 0 : 3) : o.small ? 3 : 5;
  for (let i = 0; i < nb; i++) { const a = i / nb * TAU + 0.3; g.rope([[0, 0, 0], [Math.cos(a) * rn * 1.05, -nk, Math.sin(a) * rn * 1.05]], 0.045, 3); }
  g.set([1, 1, 1], PAT.CANVAS);
  const prof = []; for (let i = 0; i < rows; i++) { const v = i / (rows - 1); prof.push([R * f(v), -nk - v * H]); }
  prof[rows - 1][0] = 0;
  g.lathe(prof, segs, { flute: (a, i) => { const v = i / (rows - 1); return 1 + 0.11 * Math.cos(8 * a) * Math.pow(1 - v, 1.5) + lean * Math.cos(a + 1) * v + 0.035 * Math.cos(3 * a + v * 5) * v; } });
  if (!far) { g.set(C.hempDark, PAT.ROPE); g.ring(-nk - 0.05, rn * 1.12, 0.07, 5, 3); g.rope([[0, -nk - H, 0], [0.05, -nk - H - 0.7, 0.03]], 0.05, 3); }
  const surf = (v, a, out = 1.0) => { const r = R * f(v) * out; return [Math.cos(a) * r, -nk - v * H, Math.sin(a) * r]; };
  const windows = [], nw = o.windows ?? 2, a0 = rng.range(0, TAU);
  for (let i = 0; i < nw; i++) {
    const a = a0 + i * TAU / nw + rng.range(-0.4, 0.4), v = rng.range(0.52, 0.72), wr = (o.small ? 0.34 : 0.5) * rng.range(0.85, 1.2), p = surf(v, a, 0.985);
    g.push(p[0], p[1], p[2], -a + Math.PI / 2, 0);
    g.set(C.lamp, PAT.GLASS, 1.5); g.discZ(wr, far ? 6 : 8, 0.06);
    if (far) { g.pop(); windows.push([p[0] * 1.08, p[1], p[2] * 1.08]); continue; }
    g.set(C.plank, PAT.WOOD);
    // the frame: a flat ring facing out, and a cross
    const ids = []; for (let k = 0; k <= 8; k++) { const t = k / 8 * TAU, c = Math.cos(t), s = Math.sin(t); ids.push(g.v(c * wr, s * wr, 0.1, 0, 0, 1), g.v(c * (wr + 0.11), s * (wr + 0.11), 0.07, 0, 0, 1)); }
    for (let k = 0; k < 8; k++) g.quad(ids[k * 2], ids[k * 2 + 1], ids[k * 2 + 3], ids[k * 2 + 2]);
    g.box(-wr, -0.03, 0.07, wr, 0.03, 0.11, 'xXyY'); g.box(-0.03, -wr, 0.07, 0.03, wr, 0.11, 'xXyY');
    g.pop();
    windows.push([p[0] * 1.08, p[1], p[2] * 1.08]);
  }
  let smoke = null;
  if (!o.small) {                                                       // stovepipe
    const a = a0 + 1.3, p = surf(0.36, a, 0.9), d = [Math.cos(a), Math.sin(a)];
    g.set(C.iron, PAT.METAL);
    const top = [p[0] + d[0] * 0.75, p[1] + 1.55, p[2] + d[1] * 0.75];
    g.pole([p, [p[0] + d[0] * 0.7, p[1] + 0.35, p[2] + d[1] * 0.7], top], 0.11, far ? 3 : 5);
    if (!far) { g.push(top[0], top[1], top[2]); g.lathe([[0, 0.34], [0.27, 0.12], [0.27, 0.08]], 5, {}); g.pop(); }
    smoke = [top[0], top[1] + 0.3, top[2]];
  }
  let door = null;
  if (!o.small) {                                                       // a door, a step and a little awning
    const a = a0 + Math.PI + 0.5, p = surf(0.68, a, 0.97);
    g.push(p[0], p[1], p[2], -a + Math.PI / 2, 0.1);
    g.set(mulc(C.plank, 0.7), PAT.WOOD); g.box(-0.45, -0.75, 0, 0.45, 0.75, 0.1, 'z');
    if (!far) { g.set(C.plankPale, PAT.WOOD); g.box(-0.75, -0.86, 0.05, 0.75, -0.78, 1.0); g.set(C.hemp, PAT.ROPE); g.rope([[-0.72, -0.8, 0.95], [-0.5, 0.95, 0.05]], 0.02, 3); g.rope([[0.72, -0.8, 0.95], [0.5, 0.95, 0.05]], 0.02, 3); }
    g.pop();
    door = [p[0] * 1.3, p[1] - 0.85, p[2] * 1.3];
  }
  if (o.hoop && !far) { g.set(C.plank, PAT.WOOD); let vm = 0.5; for (let v = 0.4; v < 0.9; v += 0.02) if (f(v) > f(vm)) vm = v; g.ring(-nk - vm * H, R * f(vm) * 1.015, 0.06, segs, 3); }
  return { g, h: nk + H + 0.7, r: R * 1.08, windows, smoke, door, R, H, nk };
}

// a terrace like a gondola: an upturned plank hull under a striped awning, tables and lamps, hung by a bridle from one point
export function gondolaGeo(rng, o = {}) {
  const g = new Geo(), L = o.L ?? 12, B = o.B ?? 4.2, hang = o.hang ?? 8.5, grand = !!o.grand, y0 = -hang, far = !!o.far;
  const hw = (u) => B / 2 * Math.pow(Math.max(1 - Math.pow(Math.abs(u * 2 - 1), 2.3), 0), 0.6);
  const sheer = (u) => 1.0 + (grand ? 2.6 : 1.7) * Math.pow(Math.abs(u * 2 - 1), 3);
  const keel = (u) => -0.25 + 0.9 * Math.pow(Math.abs(u * 2 - 1), 2.4);
  const nu = grand ? 16 : far ? 6 : 10;
  g.ropeUp(grand ? 0.17 : 0.12, undefined, far ? 3 : 4);
  g.set(mixc(C.plank, C.plankPale, 0.55), PAT.WOOD);
  for (const sg of [-1, 1]) g.sheet(nu, 2, (u, v) => [(u - 0.5) * L, y0 + lerp(keel(u), sheer(u), v), sg * hw(u) * (0.45 + 0.55 * Math.sqrt(v))]);
  g.sheet(nu, 1, (u, v) => [(u - 0.5) * L, y0 + keel(u), (v * 2 - 1) * hw(u) * 0.45]);
  g.set(C.plankPale, PAT.WOOD);
  g.sheet(nu, 1, (u, v) => [(u - 0.5) * L, y0 + 0.5 + 0.5 * Math.pow(Math.abs(u * 2 - 1), 3), (v * 2 - 1) * hw(u) * 0.92]);
  const deck = y0 + 0.5;
  for (const sg of [-1, 1]) {                                            // curled prow and stern
    g.set(C.brass, PAT.METAL);
    const x = sg * L / 2, s = sheer(0);
    g.pole([[x * 0.97, y0 + s - 0.3, 0], [x * 1.03, y0 + s + 0.9, 0], [x * 1.0, y0 + s + 1.7, 0], [x * 0.94, y0 + s + 1.9, 0], [x * 0.92, y0 + s + 1.55, 0]], [0.16, 0.13, 0.11, 0.1, 0.12], far ? 3 : 5);
  }
  // rope rail on short posts
  g.set(C.hemp, PAT.ROPE);
  const np = grand ? 12 : 6;
  if (!far) for (const sg of [-1, 1]) { const top = [];
    for (let i = 0; i <= np; i++) { const u = 0.1 + 0.8 * i / np, x = (u - 0.5) * L, z = sg * hw(u) * 0.98, y = y0 + sheer(u); g.rope([[x, y - 0.1, z], [x, y + 0.75, z]], 0.035, 3); top.push([x, y + 0.75 - (i % 2 ? 0.0 : 0.06), z]); }
    g.rope(top, 0.025, 3); }
  // the bridle: ropes from the hang point through an iron ring to the gunwales
  const nr = grand ? 5 : far ? 2 : 3, ringY = -Math.min(2.2, hang * 0.25), ringR = grand ? 1.3 : 0.6;
  if (!far) { g.set(C.iron, PAT.METAL); g.ring(ringY, ringR, 0.06, 8, 3); }
  g.set(C.hemp, PAT.ROPE);
  for (const sg of [-1, 1]) for (let i = 0; i < nr; i++) {
    const u = 0.14 + 0.72 * i / (nr - 1), x = (u - 0.5) * L, z = sg * hw(u), a = Math.atan2(z, x);
    g.rope([[0, 0, 0], [Math.cos(a) * ringR, ringY, Math.sin(a) * ringR], [x, y0 + sheer(u) + 0.7, z]], grand ? 0.06 : 0.04, grand ? 4 : 3);
  }
  // striped awning slung between the bridle ropes
  const aw = grand ? 0.34 : 0.3, ah = grand ? 4.6 : 3.3;
  g.set([1, 1, 1], PAT.STRIPE);
  g.sheet(grand ? 12 : far ? 4 : 8, far ? 2 : 4, (u, v) => { const e = Math.abs(v * 2 - 1); return [(u - 0.5) * 2 * aw * L, deck + ah - 0.75 * e * e - 0.3 * Math.sin(u * Math.PI * (grand ? 4 : 3)) * (0.3 + e), (v * 2 - 1) * B * 0.56, 0.12 * e]; });
  // tables with a lamp, stools
  const tables = [], lamps = [], nt = grand ? 11 : 3;
  for (let i = 0; i < nt; i++) {
    const u = 0.2 + 0.6 * (i + 0.5) / nt, x = (u - 0.5) * L, z = (i % 2 ? 1 : -1) * hw(u) * (grand ? 0.5 : 0.35) * rng.range(0.6, 1), ty = deck + 0.05;
    g.set(C.plank, PAT.WOOD); g.push(x, ty, z);
    g.lathe(far ? [[0.62, 0.75], [0.07, 0.7], [0.07, 0.02]] : [[0.62, 0.78], [0.62, 0.72], [0.07, 0.7], [0.07, 0.04], [0.3, 0]], far ? 4 : 5, {});
    for (let k = 0; k < (grand ? 3 : far ? 0 : 2); k++) { const a = k * 2.1 + i; g.box(Math.cos(a) * 1.0 - 0.17, 0, Math.sin(a) * 1.0 - 0.17, Math.cos(a) * 1.0 + 0.17, 0.42, Math.sin(a) * 1.0 + 0.17, 'y'); }
    g.set(C.lamp, PAT.GLASS, 4.5); g.ball(0, 0.95, 0, 0.1, 0.14, 0.1, far ? 3 : 4, 2);
    g.pop(); tables.push([x, ty, z]); lamps.push([x, ty + 0.95, z, 1.5]);
  }
  // green boxes along the rail
  g.set(C.leaf, PAT.LEAF);
  for (let i = 0; i < (grand ? 10 : far ? 2 : 4); i++) { const u = rng.range(0.16, 0.84), sg = i % 2 ? 1 : -1; g.ball((u - 0.5) * L, y0 + sheer(u) + 0.55, sg * hw(u) * 0.97, 0.5, 0.36, 0.34, 5, 2); }
  return { g, h: hang + 0.5, r: L / 2 + 0.5, deck, L, B, lamps, tables, under: [0, y0 + keel(0.5), 0] };
}

// a hammock under a spreader bar, with a sleeper as a shape under a blanket
export function hammockGeo(rng, far = false) {
  const g = new Geo(), W = 2.7;
  g.ropeUp(0.04, undefined, far ? 3 : 4);
  g.set(C.hemp, PAT.ROPE); g.rope([[0, 0, 0], [-W / 2, -0.7, 0]], 0.025, 3); g.rope([[0, 0, 0], [W / 2, -0.7, 0]], 0.025, 3);
  g.set(C.plank, PAT.WOOD); g.pole([[-W / 2 - 0.1, -0.7, 0], [W / 2 + 0.1, -0.7, 0]], 0.05, 4);
  g.set(C.cream, PAT.CLOTH);
  g.sheet(far ? 4 : 6, far ? 1 : 2, (u, v) => { const s = Math.sin(Math.PI * u); return [(u - 0.5) * W, -0.75 - 0.85 * s - 0.2 * (1 - (v * 2 - 1) ** 2) * s, (v - 0.5) * 0.95 * Math.sqrt(s + 0.02), 0.03]; });
  g.set([1, 1, 1], PAT.CLOTH); g.flex = 0; g.ball(0.1, -1.52, 0, 0.82, 0.24, 0.3, far ? 4 : 6, far ? 2 : 3);
  if (!far) { g.set([0.5, 0.36, 0.27], PAT.PLAIN); g.ball(-0.78, -1.42, 0, 0.14, 0.13, 0.13, 5, 3); }
  return { g, h: 1.9, r: 1.5 };
}

// a rope ladder
export function ladderGeo(len = 12, far = false) {
  const g = new Geo(), w = 0.23;
  g.set(C.hemp, PAT.ROPE);
  g.rope([[-w, 0, 0], [-w, -len, 0]], 0.028, 3); g.rope([[w, 0, 0], [w, -len, 0]], 0.028, 3);
  g.set(C.plankPale, PAT.WOOD);
  for (let y = -0.5; y > -len; y -= far ? 1 : 0.5) g.rope([[-w, y, 0], [w, y, 0]], 0.022, 3);
  return { g, h: len, r: 0.4 };
}

// a wicker basket on a string
export function basketGeo(rng, far = false) {
  const g = new Geo();
  g.ropeUp(0.04, undefined, far ? 3 : 4);
  g.set(C.wicker, PAT.WICKER); g.lathe(far ? [[0.48, -0.5], [0.4, -0.86], [0, -1.0]] : [[0.46, -0.5], [0.5, -0.56], [0.4, -0.86], [0.3, -1.0], [0, -1.0]], far ? 5 : 7, {});
  g.set(C.hempDark, PAT.ROPE); g.rope(far ? [[-0.46, -0.5, 0], [0, 0, 0], [0.46, -0.5, 0]] : [[-0.46, -0.5, 0], [-0.3, -0.18, 0], [0, 0, 0], [0.3, -0.18, 0], [0.46, -0.5, 0]], 0.022, 3);
  g.set([1, 1, 1], PAT.CLOTH); g.ball(0, -0.56, 0, 0.42, 0.2, 0.42, far ? 4 : 6, 2);
  return { g, h: 1.0, r: 0.5 };
}

// a brass chandelier: a turned stem, tiers of arms with candles, hanging drops
export function chandelierGeo(rng, o = {}) {
  const far = !!o.far, g = new Geo(), grand = !!o.grand, tiers = grand ? [[-2.2, 10, 2.4], [-3.6, 6, 1.5]] : [[-1.3, 6, 1.1]], hb = grand ? -4.6 : -2.0, lamps = [];
  g.ropeUp(grand ? 0.06 : 0.04, C.iron);
  g.set(C.brass, PAT.METAL);
  g.lathe(grand ? [[0.05, 0], [0.22, -0.4], [0.08, -0.9], [0.34, -2.1], [0.12, -2.6], [0.3, -3.6], [0.1, -4.1], [0.24, -4.4], [0, hb]] : [[0.04, 0], [0.14, -0.3], [0.05, -0.7], [0.2, -1.3], [0.07, -1.6], [0.15, -1.85], [0, hb]], grand ? 7 : 5, {});
  for (const [y, n, r] of tiers) for (let i = 0; i < n; i++) {
    const a = i / n * TAU + y, c = Math.cos(a), s = Math.sin(a);
    g.set(C.brass, PAT.METAL);
    g.rope([[c * 0.15, y, s * 0.15], [c * r * 0.5, y - 0.38, s * r * 0.5], [c * r * 0.9, y - 0.2, s * r * 0.9], [c * r, y + 0.22, s * r]], grand ? 0.035 : 0.025, 3);
    g.push(c * r, y + 0.22, s * r); if (!far) g.lathe([[0.13, 0.08], [0.09, 0], [0.03, -0.06]], 5, {});
    if (!far) { g.set(C.cream, PAT.PLAIN); g.pole([[0, 0.02, 0], [0, 0.3, 0]], 0.035, 4); }
    g.set(C.lamp, PAT.GLASS, 6); g.ball(0, 0.42, 0, 0.055, 0.12, 0.055, far ? 3 : 4, 2);
    if (!far) { g.set([0.9, 0.95, 1], PAT.GLASS, 0.5); g.ball(0, -0.42, 0, 0.05, 0.11, 0.05, 4, 2); }
    g.pop();
    lamps.push([c * r, y + 0.64, s * r, grand ? 0.55 : 0.6]);
  }
  g.set([0.9, 0.95, 1], PAT.GLASS, 0.5); g.ball(0, hb - 0.2, 0, 0.14, 0.24, 0.14, 5, 3);
  return { g, h: -hb + 0.5, r: tiers[0][2] + 0.2, lamps };
}

// a copper pot of trailing plants on three cords
export function potGeo(rng, o = {}) {
  const far = !!o.far, g = new Geo(), nv = far ? 3 : o.vines ?? 4;
  g.ropeUp(0.04, undefined, far ? 3 : 4);
  g.set(C.hemp, PAT.ROPE);
  for (let i = 0; i < (far ? 0 : 3); i++) { const a = i / 3 * TAU; g.rope([[0, 0, 0], [Math.cos(a) * 0.36, -0.5, Math.sin(a) * 0.36]], 0.022, 3); }
  g.set(C.copper, PAT.METAL); g.lathe(far ? [[0.37, -0.5], [0.3, -0.82], [0, -0.95]] : [[0.36, -0.5], [0.38, -0.57], [0.3, -0.82], [0.2, -0.95], [0, -0.95]], far ? 4 : 5, {});
  g.set(mixc(C.leafDark, C.leaf, 0.6), PAT.LEAF); g.ball(0, -0.46, 0, 0.46, 0.3, 0.46, far ? 4 : 5, 2);
  for (let i = 0; i < nv; i++) {
    const a = i / nv * TAU + rng.range(-0.4, 0.4), len = rng.range(1.4, 4.2) * (o.long ?? 1), c = Math.cos(a), s = Math.sin(a), w = 0.38;
    const nl = far ? Math.max(2, Math.round(len / 1.3)) : Math.max(3, Math.round(len / 0.56));
    for (let k = 0; k < nl; k++) {
      const v0 = k / nl, v1 = (k + 1.25) / nl, at = (v) => { const out = 0.36 + 0.16 * Math.sin(v * 2.2); return [c * out, -0.5 + 0.12 * Math.sin(v * 3.1) - len * v * v * 0.6 - len * v * 0.4, s * out]; };
      const a0 = at(v0), a1 = at(Math.min(v1, 1.05)), tw = rng.range(-1, 1), wx = (-s * Math.cos(tw) + c * Math.sin(tw) * 0.5) * w * 0.5, wz = (c * Math.cos(tw) + s * Math.sin(tw) * 0.5) * w * 0.5, wy = Math.sin(tw) * w * 0.3;
      g.set(mixc(C.leafDark, C.leaf, rng.range(0.45, 1)), PAT.LEAF);
      const m = [(a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2, (a0[2] + a1[2]) / 2], f0 = 0.1 + 0.5 * v0, f1 = 0.1 + 0.5 * v1;
      const i0 = g.v(a0[0], a0[1], a0[2], c, 0.3, s, 0, f0), i1 = g.v(m[0] - wx, m[1] - wy, m[2] - wz, c, 0.3, s, 0, (f0 + f1) / 2), i2 = g.v(a1[0], a1[1], a1[2], c, 0.3, s, 0, f1), i3 = g.v(m[0] + wx, m[1] + wy, m[2] + wz, c, 0.3, s, 0, (f0 + f1) / 2);
      g.quad(i0, i1, i2, i3);
    }
  }
  return { g, h: 1.0 + 3.2 * (o.long ?? 1), r: 0.6 };
}

const LAUNDRY = ['#f2efe6', '#e8dcc0', '#a8522a', '#3d6b8f', '#d19a3a', '#f2efe6', '#7fa6b8', '#c96a4a', '#e8e2d2'].map(lin);
// washing on a pole: sheets, shirts and trousers, flapping
export function laundryGeo(rng, o = {}) {
  const g = new Geo(), W = o.W ?? 3.8, py = -0.8;
  g.ropeUp(0.04);
  g.set(C.hemp, PAT.ROPE); g.rope([[0, 0, 0], [-W / 2, py, 0]], 0.02, 3); g.rope([[0, 0, 0], [W / 2, py, 0]], 0.02, 3);
  g.set(C.plank, PAT.WOOD); g.pole([[-W / 2 - 0.15, py, 0], [W / 2 + 0.15, py, 0]], 0.04, 4);
  let x = -W / 2 + 0.1;
  while (x < W / 2 - 0.5) {
    const kind = rng.int(0, 3), w = kind === 0 ? rng.range(0.9, 1.4) : rng.range(0.5, 0.7), h = kind === 0 ? rng.range(1.2, 2.0) : rng.range(0.7, 1.1), x0 = x;
    g.set(rng.pick(LAUNDRY), PAT.CLOTH);
    if (kind === 2) for (const k of [0, 1]) g.sheet(1, 3, (u, v) => [x0 + (k * 0.55 + u * 0.4) * w, py - v * h * 1.3, 0.03, v * 0.5]);
    else g.sheet(2, 3, (u, v) => [x0 + u * w, py - v * h, 0.02 * Math.sin(u * 6), v * 0.55]);
    if (kind === 1) for (const k of [-1, 1]) g.sheet(1, 1, (u, v) => [x0 + w / 2 + k * (w / 2 + u * 0.32), py - 0.05 - v * 0.3 - u * 0.14, 0.02, 0.3]);
    x += w + rng.range(0.12, 0.4);
  }
  return { g, h: 2.9, r: W / 2 + 0.2 };
}

// a row of water skins on a pole
export function skinsGeo(rng, far = false) {
  const g = new Geo(), W = 2.6, py = -0.7;
  g.ropeUp(0.04, undefined, far ? 3 : 4);
  g.set(C.hemp, PAT.ROPE); g.rope([[0, 0, 0], [-W / 2, py, 0]], 0.02, 3); g.rope([[0, 0, 0], [W / 2, py, 0]], 0.02, 3);
  g.set(C.plank, PAT.WOOD); g.pole([[-W / 2 - 0.1, py, 0], [W / 2 + 0.1, py, 0]], 0.04, 4);
  for (let i = 0; i < 5; i++) {
    const x = -W / 2 + 0.25 + i * (W - 0.5) / 4, k = rng.range(0.8, 1.15);
    g.set(mulc(C.skin, rng.range(0.8, 1.3)), PAT.SKIN); g.push(x, py - 0.12, 0, rng.range(0, 3), 0, 0, k);
    g.lathe(far ? [[0.03, 0], [0.2, -0.45], [0.25, -0.8], [0, -1.04]] : [[0.03, 0], [0.07, -0.16], [0.2, -0.45], [0.26, -0.75], [0.17, -0.98], [0, -1.04]], far ? 3 : 5, {});
    g.pop();
  }
  return { g, h: 2.0, r: W / 2 + 0.2 };
}

// a hung lantern with a gas flame
export function lampGeo(far = false) {
  const g = new Geo();
  g.ropeUp(0.04, C.iron, far ? 3 : 4);
  g.set(C.iron, PAT.METAL); g.lathe(far ? [[0.02, 0], [0.2, -0.16]] : [[0.02, 0], [0.2, -0.14], [0.2, -0.17]], far ? 4 : 6, {});
  g.set(C.lamp, PAT.GLASS, 5); g.lathe(far ? [[0.16, -0.17], [0.11, -0.5]] : [[0.15, -0.17], [0.17, -0.34], [0.11, -0.5]], far ? 4 : 6, {});
  if (!far) { g.set(C.iron, PAT.METAL); g.lathe([[0.12, -0.5], [0, -0.57]], 6, {}); }
  return { g, h: 0.6, r: 0.25, lamps: [[0, -0.33, 0, 1.25]] };
}

// a trapeze and a pair of rings for the children's games (they swing from their own top)
export function trapezeGeo() {
  const g = new Geo();
  g.ropeUp(0.04);
  g.set(C.hemp, PAT.ROPE); g.rope([[0, 0, 0], [-0.55, -0.5, 0]], 0.03, 3); g.rope([[0, 0, 0], [0.55, -0.5, 0]], 0.03, 3);
  g.rope([[-0.55, -0.5, 0], [-0.55, -3.4, 0]], 0.03, 3); g.rope([[0.55, -0.5, 0], [0.55, -3.4, 0]], 0.03, 3);
  g.set(C.plankPale, PAT.WOOD); g.rope([[-0.7, -3.4, 0], [0.7, -3.4, 0]], 0.03, 4);
  return { g, h: 3.5, r: 0.8 };
}
export function ringsGeo() {
  const g = new Geo();
  g.ropeUp(0.04);
  g.set(C.hemp, PAT.ROPE); g.rope([[0, 0, 0], [-0.4, -0.5, 0]], 0.03, 3); g.rope([[0, 0, 0], [0.4, -0.5, 0]], 0.03, 3);
  for (const sx of [-0.4, 0.4]) {
    g.set(C.hemp, PAT.ROPE); g.rope([[sx, -0.5, 0], [sx, -2.6, 0]], 0.03, 3);
    g.set(C.brass, PAT.METAL); const pts = []; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; pts.push([sx + Math.cos(a) * 0.17, -2.77 + Math.sin(a) * 0.17, 0]); } g.sweep(pts, 0.022, 3, true, true);
  }
  return { g, h: 3.0, r: 0.6 };
}

// a shower: a copper tank with a rose, and a fan of bright drops that falls 6 m, widening, and leans with the wind
export function showerGeo() {
  const g = new Geo();
  g.ropeUp(0.04);
  g.set(C.copper, PAT.METAL); g.lathe([[0.05, 0], [0.36, -0.12], [0.38, -0.72], [0.1, -0.88], [0.1, -1.0], [0.3, -1.12], [0, -1.12]], 6, {});
  g.set([0.8, 0.9, 1], PAT.WATER); g.lathe([[0.26, -1.14], [0.5, -2.6], [0.85, -4.6], [1.3, -7]], 8, {});
  return { g, h: 1.2, r: 0.45 };
}

// a dumb-waiter: an open cupboard that rides its rope
export function dumbWaiterGeo() {
  const g = new Geo();
  g.ropeUp(0.04);
  g.set(C.plank, PAT.WOOD);
  g.box(-0.55, -1.5, -0.45, 0.55, -1.42, 0.45); g.box(-0.55, -0.3, -0.45, 0.55, -0.22, 0.45); g.box(-0.55, -0.9, -0.45, 0.55, -0.85, 0.45);
  g.box(-0.55, -1.5, -0.45, -0.5, -0.22, 0.45); g.box(0.5, -1.5, -0.45, 0.55, -0.22, 0.45); g.box(-0.55, -1.5, -0.45, 0.55, -0.22, -0.4);
  g.set(C.iron, PAT.METAL); g.rope([[0, 0, 0], [0, -0.22, 0]], 0.03, 3);
  g.set([1, 1, 1], PAT.CLOTH); g.ball(-0.15, -0.72, 0, 0.22, 0.14, 0.22, 5, 2); g.set(C.copper, PAT.METAL); g.ball(0.2, -1.28, 0.05, 0.16, 0.16, 0.16, 5, 3);
  return { g, h: 1.5, r: 0.7 };
}

// a cable car: a wicker cabin with a canvas roof under a two-wheeled truck (the origin rides the cable), a lantern at
// each end and lamp-lit paper screens in its fore half
export function cableCarGeo() {
  const g = new Geo(), y0 = -3.6;
  g.set(C.iron, PAT.METAL);
  for (const sx of [-0.45, 0.45]) { g.push(sx, 0.16, 0, 0, Math.PI / 2); g.lathe([[0, 0.05], [0.2, 0.05], [0.2, -0.05], [0, -0.05]], 8, {}); g.pop(); }
  g.pole([[-0.45, 0.1, 0], [0, -0.5, 0], [0.45, 0.1, 0]], 0.05, 4); g.pole([[0, -0.5, 0], [0, y0 + 1.95, 0]], 0.05, 4);
  g.set(C.wicker, PAT.WICKER);
  g.box(-1.3, y0, -0.75, 1.3, y0 + 0.75, 0.75, 'Y'); g.set(C.plank, PAT.WOOD);
  for (const sx of [-1.26, 0, 1.26]) for (const sz of [-0.71, 0.71]) g.box(sx - 0.04, y0 + 0.75, sz - 0.04, sx + 0.04, y0 + 1.7, sz + 0.04, 'yY');
  g.set([1, 1, 1], PAT.STRIPE); g.sheet(4, 2, (u, v) => [(u - 0.5) * 3.0, y0 + 1.72 + 0.28 * (1 - (v * 2 - 1) ** 2), (v - 0.5) * 1.8, 0]);
  g.set(C.lamp, PAT.GLASS, 4.5); for (const sx of [-1.38, 1.38]) g.ball(sx, y0 + 1.5, 0, 0.13, 0.18, 0.13, 5, 2);        // a lantern at each end
  g.set(C.lamp, PAT.GLASS, 1.5); for (const sz of [-0.72, 0.72]) g.box(0.08, y0 + 0.8, sz - 0.02, 1.2, y0 + 1.62, sz + 0.02);      // lit as the houses are: lamp-lit paper screens between the posts of its fore half
  g.set([0.36, 0.3, 0.42], PAT.CLOTH); g.ball(-0.5, y0 + 0.95, 0, 0.22, 0.32, 0.2, 5, 3); g.set([0.5, 0.36, 0.27], PAT.PLAIN); g.ball(-0.5, y0 + 1.36, 0, 0.12, 0.12, 0.12, 5, 3);
  return { g, h: 3.6, r: 1.6, lamps: [[1.38, y0 + 1.5, 0, 1.3], [-1.38, y0 + 1.5, 0, 1.3]] };
}

// a bicycle hung up by its front wheel
export function bicycleGeo() {
  const g = new Geo(), R = 0.34, wheel = (cx, cy) => { const pts = []; for (let k = 0; k < 12; k++) { const a = k / 12 * TAU; pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0]); } g.set(C.iron, PAT.METAL); g.sweep(pts, 0.022, 3, true, true);
    g.set([0.6, 0.6, 0.62], PAT.METAL); for (let k = 0; k < 3; k++) { const a = k / 3 * Math.PI; g.rope([[cx + Math.cos(a) * R, cy + Math.sin(a) * R, 0], [cx - Math.cos(a) * R, cy - Math.sin(a) * R, 0]], 0.006, 3); } };
  g.ropeUp(0.04, C.iron);
  // hanging nose up: the front wheel is at the top
  const F = [0, -R, 0], Bk = [0.25, -R - 1.02, 0], seat = [0.5, -R - 0.62, 0], head = [0.42, -R - 0.12, 0], crank = [0.42, -R - 0.75, 0];
  wheel(F[0], F[1]); wheel(Bk[0], Bk[1]);
  g.set(lin('#7a2f24'), PAT.METAL);
  g.rope([F, head], 0.018, 3); g.rope([head, seat], 0.018, 3); g.rope([head, crank], 0.018, 3); g.rope([seat, crank], 0.018, 3); g.rope([crank, Bk], 0.018, 3); g.rope([seat, Bk], 0.014, 3);
  g.set(C.iron, PAT.METAL); g.rope([[head[0] + 0.12, head[1] + 0.05, -0.26], [head[0] + 0.12, head[1] + 0.05, 0.26]], 0.014, 3); g.rope([head, [head[0] + 0.12, head[1] + 0.05, 0]], 0.014, 3);
  g.set(C.skin, PAT.SKIN); g.box(seat[0] + 0.02, seat[1] - 0.12, -0.06, seat[0] + 0.1, seat[1] + 0.12, 0.06);
  return { g, h: 1.75, r: 0.6 };
}

// a plain small figure (no face): a robe, a head, sometimes a hat. The origin is at the feet.
export function figureGeo(rng, hat) {
  const g = new Geo();
  g.set([1, 1, 1], PAT.CLOTH); g.lathe([[0.1, 1.42], [0.2, 1.3], [0.22, 0.9], [0.3, 0.05], [0, 0.05]], 6, {});
  g.set([0.5, 0.36, 0.27], PAT.PLAIN); g.ball(0, 1.56, 0, 0.12, 0.13, 0.12, 5, 3);
  if (hat) { g.set(C.wicker, PAT.WICKER); g.lathe([[0, 1.8], [0.34, 1.64], [0.34, 1.62]], 6, {}); }
  return { g, h: 0, r: 0.4 };
}

// a plank tie of a catwalk (origin at its middle), a post with an arm for things to hang from (origin at its foot)
export function plankGeo() { const g = new Geo(); g.set([1, 1, 1], PAT.WOOD); g.box(-0.82, -0.035, -0.16, 0.82, 0.035, 0.16, 'xX'); return { g, h: 0, r: 0.9 }; }
// a plank of the far catwalks: one two-sided board (the near ones have thickness)
export function plankFarGeo() {
  const g = new Geo(); g.set([1, 1, 1], PAT.WOOD);
  g.quad(g.v(-0.82, 0.03, -0.16, 0, 1, 0), g.v(-0.82, 0.03, 0.16, 0, 1, 0), g.v(0.82, 0.03, 0.16, 0, 1, 0), g.v(0.82, 0.03, -0.16, 0, 1, 0));
  return { g, h: 0, r: 0.9 };
}
export function postGeo() {
  const g = new Geo();
  g.set(C.plank, PAT.WOOD); g.rope([[0, -0.3, 0], [0, 3.3, 0]], 0.06, 4); g.rope([[-0.1, 3.05, 0], [1.6, 3.05, 0]], 0.045, 4); g.rope([[0, 2.2, 0], [0.9, 3.05, 0]], 0.03, 3);
  g.set(C.hemp, PAT.ROPE); g.rope([[0, 0.15, 0], [0.4, -0.2, 0.3]], 0.03, 3); g.rope([[0, 0.15, 0], [-0.4, -0.2, -0.3]], 0.03, 3);
  return { g, h: 0, r: 1.8, arm: [1.5, 3.0, 0] };
}
// one link of a great anchor chain, lying along X (origin at its middle)
export function linkGeo() {
  const g = new Geo(), L = 1.05, W = 0.55, pts = [];
  for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 + k / 2 * Math.PI; pts.push([L - W + Math.cos(a) * W, 0, Math.sin(a) * W]); }
  for (let k = 0; k < 3; k++) { const a = Math.PI / 2 + k / 2 * Math.PI; pts.push([-L + W + Math.cos(a) * W, 0, Math.sin(a) * W]); }
  g.set(lin('#6a6058'), PAT.METAL); g.sweep(pts, 0.19, 4, false, true);
  return { g, h: 0, r: 1.1 };
}
// a pennant on a cord, a bare string, and a pigeon
export function pennantGeo() { const g = new Geo(); g.set([1, 1, 1], PAT.CLOTH); g.sheet(3, 1, (u, v) => [0.04 + u * 1.5, -0.06 - v * 0.62 * (1 - u) - u * 0.31 + 0.31 * u * 0, 0, 0.15 + 0.85 * u]); return { g, h: 0.7, r: 1.5 }; }
export function stringGeo() { const g = new Geo(); g.ropeUp(0.022); g.set(C.iron, PAT.METAL); g.ball(0, -0.1, 0, 0.08, 0.1, 0.08, 4, 2); return { g, h: 0.2, r: 0.1 }; }
export function pigeonGeo() {
  const g = new Geo(); g.set([0.55, 0.57, 0.62], PAT.PLAIN); g.ball(0, 0.11, 0, 0.16, 0.1, 0.09, 5, 3); g.ball(0.14, 0.2, 0, 0.055, 0.055, 0.05, 4, 2);
  g.set([0.36, 0.38, 0.44], PAT.PLAIN); g.sheet(1, 1, (u, v) => [-0.12 - u * 0.16, 0.1 - u * 0.04, (v - 0.5) * 0.1]);
  return { g, h: 0, r: 0.25 };
}

// THE GREAT HALL of the city (round 5): a sack-hall about three times a common house in every measure: 17 m of body,
// 17 m through, three storeys of round lit windows, a gallery round its belly with a rail and lamps, a great door with a
// striped awning, awnings round the gallery, stovepipes, a great lantern under it. Local space as every thing: the hang
// point is the origin (an iron ring, where its mooring cables meet), the hall lies below it; the door faces +X.
export function hallGeo(rng) {
  const g = new Geo(), H = 17, R = 8.4, segs = 22, rows = 14, nk = 2.8, rn = R * 0.2, lamps = [];
  const f = (v) => Math.max(Math.pow(Math.sin(Math.PI * Math.pow(clamp(v, 0, 1), 1.7)), 0.56), v < 0.5 ? rn / R * (1 + 2 * v) : 0);
  g.set(C.iron, PAT.METAL); g.ring(-0.1, 0.7, 0.14, 8, 4);
  g.set(C.hemp, PAT.ROPE);
  for (let i = 0; i < 8; i++) { const a = i / 8 * TAU + 0.2; g.rope([[0, 0, 0], [Math.cos(a) * rn * 1.05, -nk, Math.sin(a) * rn * 1.05]], 0.09, 4); }
  // a great striped roof over its shoulders like a tent's, from under the ring down and out past the neck
  g.set([1, 1, 1], PAT.STRIPE);
  g.lathe([[0.3, -0.5], [1.3, -1.5], [3.3, -nk - 0.3], [6.3, -nk - 2.1], [6.7, -nk - 2.7]], 16, { flute: (a) => 1 + 0.05 * Math.cos(8 * a) });
  g.set(C.hempDark, PAT.ROPE); g.ring(-nk - 2.7, 6.7, 0.09, 16, 3);
  g.set([1, 1, 1], PAT.CANVAS);
  const prof = []; for (let i = 0; i < rows; i++) { const v = i / (rows - 1); prof.push([R * f(v), -nk - v * H]); }
  prof[rows - 1][0] = 0;
  g.lathe(prof, segs, { flute: (a, i) => { const v = i / (rows - 1); return 1 + 0.07 * Math.cos(11 * a) * Math.pow(1 - v, 1.5) + 0.02 * Math.cos(3 * a + v * 5) * v; } });
  g.set(C.hempDark, PAT.ROPE); g.ring(-nk - 0.1, rn * 1.12, 0.14, 8, 4);
  const surf = (v, a, out = 1) => { const r = R * f(v) * out; return [Math.cos(a) * r, -nk - v * H, Math.sin(a) * r]; };
  let vm = 0.5; for (let v = 0.4; v < 0.9; v += 0.02) if (f(v) > f(vm)) vm = v;      // the widest row: the gallery's
  for (const [v, n, wr, half] of [[0.33, 8, 0.8, 0], [0.48, 12, 1.05, 0.5], [0.84, 8, 0.75, 0]]) for (let i = 0; i < n; i++) {
    const a = (i + half) / n * TAU + 0.26 + rng.range(-0.05, 0.05), p = surf(v, a, 0.995), dr = (R * f(v + 0.02) - R * f(v - 0.02)) / (0.04 * H);
    g.push(p[0], p[1], p[2], -a + Math.PI / 2, -Math.atan(dr));
    g.set(C.lamp, PAT.GLASS, 2.4); g.discZ(wr, 8, 0.1);
    g.set(C.plank, PAT.WOOD);
    const ids = []; for (let k = 0; k <= 8; k++) { const t = k / 8 * TAU, c = Math.cos(t), s = Math.sin(t); ids.push(g.v(c * wr, s * wr, 0.16, 0, 0, 1), g.v(c * (wr + 0.15), s * (wr + 0.15), 0.1, 0, 0, 1)); }
    for (let k = 0; k < 8; k++) g.quad(ids[k * 2], ids[k * 2 + 1], ids[k * 2 + 3], ids[k * 2 + 2]);
    g.box(-wr, -0.04, 0.1, wr, 0.04, 0.17, 'xXyY'); g.box(-0.04, -wr, 0.1, 0.04, wr, 0.17, 'xXyY');
    g.pop();
  }
  // the gallery: a plank deck round the belly, a rail on posts, a lamp on every third post
  const yG = -nk - vm * H, rG0 = R * f(vm) - 0.4, rG1 = rG0 + 2.4;
  g.set(C.plankPale, PAT.WOOD);
  { const A = [], B = [], D = [], E = [];
    for (let j = 0; j <= segs; j++) { const a = j / segs * TAU, c = Math.cos(a), s = Math.sin(a); A.push(g.v(c * rG0, yG, s * rG0, 0, 1, 0)); B.push(g.v(c * rG1, yG, s * rG1, 0, 1, 0)); D.push(g.v(c * rG1, yG, s * rG1, c, 0, s)); E.push(g.v(c * rG1, yG - 0.4, s * rG1, c, 0, s)); }
    for (let j = 0; j < segs; j++) { g.quad(A[j], B[j], B[j + 1], A[j + 1]); g.quad(D[j], E[j], E[j + 1], D[j + 1]); } }
  for (let j = 0; j < segs; j++) {
    const a = (j + 0.5) / segs * TAU, c = Math.cos(a), s = Math.sin(a);
    g.set(C.plank, PAT.WOOD); g.rope([[c * rG1, yG - 0.2, s * rG1], [c * rG1, yG + 1.2, s * rG1]], 0.055, 3);
    if (j % 2 === 1) { g.set(C.lamp, PAT.GLASS, 5); g.ball(c * rG1, yG + 1.5, s * rG1, 0.17, 0.24, 0.17, 4, 2); lamps.push([c * rG1, yG + 1.5, s * rG1, 1.7]); }
  }
  g.set(C.hemp, PAT.ROPE); g.ring(yG + 1.15, rG1, 0.04, segs, 3, true);
  // the great door at the gallery, lit from within, under a striped awning; three more awnings round the gallery
  g.push(R * f(vm - 0.06) * 0.99, yG + 1.75, 0, Math.PI / 2, 0);
  g.set(mulc(C.plank, 0.7), PAT.WOOD); g.box(-1.05, -1.75, 0, 1.05, 1.45, 0.3, 'z');
  g.set(C.lamp, PAT.GLASS, 1.6); g.box(-1.05, 1.45, 0, 1.05, 2.1, 0.26, 'z');
  g.pop();
  for (let k = 0; k < 4; k++) {
    const a = k * TAU / 4, c = Math.cos(a), s = Math.sin(a), w = k ? 4.4 : 6.6, r0 = R * f(vm - 0.1) * 0.97, y0 = yG + (k ? 3.3 : 4.4);
    g.set([1, 1, 1], PAT.STRIPE);
    g.sheet(4, 2, (u, v) => { const r = r0 + v * (rG1 - r0 + 0.3), q = (u - 0.5) * w; return [c * r - s * q, y0 - v * 1.25 - 0.22 * Math.sin(Math.PI * u) * v, s * r + c * q, 0.1 * v]; });
    g.set(C.plank, PAT.WOOD);
    for (const sg of [-1, 1]) { const q = sg * w / 2; g.rope([[c * rG1 - s * q, yG + 1.2, s * rG1 + c * q], [c * (rG1 + 0.3) - s * q, y0 - 1.25, s * (rG1 + 0.3) + c * q]], 0.045, 3); }
  }
  // stovepipes, and one plume
  let smoke = null;
  for (let k = 0; k < 3; k++) {
    const a = 0.9 + k * 2.2, p = surf(0.2, a, 0.92), d = [Math.cos(a), Math.sin(a)], top = [p[0] + d[0] * 1.2, p[1] + 3.2, p[2] + d[1] * 1.2];
    g.set(C.iron, PAT.METAL); g.pole([p, [p[0] + d[0] * 1.1, p[1] + 0.6, p[2] + d[1] * 1.1], top], 0.2, 5);
    g.push(top[0], top[1], top[2]); g.lathe([[0, 0.6], [0.48, 0.2], [0.48, 0.12]], 5, {}); g.pop();
    if (!k) smoke = [top[0], top[1] + 0.5, top[2]];
  }
  // the great lantern under it
  const yL = -nk - H;
  g.set(C.hemp, PAT.ROPE); g.rope([[0, yL, 0], [0, yL - 1.3, 0]], 0.07, 3);
  g.set(C.iron, PAT.METAL); g.lathe([[0.05, yL - 1.2], [0.7, yL - 1.5], [0.7, yL - 1.56]], 6, {});
  g.set(C.lamp, PAT.GLASS, 5); g.lathe([[0.55, yL - 1.56], [0.62, yL - 2.1], [0.36, yL - 2.6]], 6, {});
  lamps.push([0, yL - 2.1, 0, 3.4]);
  return { g, h: nk + H + 2.7, r: rG1 + 0.4, R, H, nk, lamps, smoke, gallery: yG, galR: rG1 };
}

// a goat for the crag's ledges (the origin at its feet, facing +X)
export function goatGeo() {
  const g = new Geo();
  g.set([0.84, 0.82, 0.76], PAT.PLAIN); g.ball(0, 0.56, 0, 0.42, 0.25, 0.19, 6, 3); g.ball(0.44, 0.8, 0, 0.16, 0.13, 0.1, 4, 2);
  g.set([0.3, 0.27, 0.24], PAT.PLAIN);
  for (const [x, z] of [[0.26, 0.1], [0.26, -0.1], [-0.27, 0.1], [-0.27, -0.1]]) g.rope([[x, 0.42, z], [x * 1.05, 0, z]], 0.04, 3);
  g.rope([[0.46, 0.9, 0.05], [0.36, 1.06, 0.08]], 0.02, 3); g.rope([[0.46, 0.9, -0.05], [0.36, 1.06, -0.08]], 0.02, 3);
  return { g, h: 0, r: 0.6 };
}

// ---------------------------------------------------------------- the kit: shared uniforms, the kinds of thing, instancing
const KIND_MAKERS = {
  sackA: (r) => sackGeo(r, { H: 6.2, R: 2.5, shape: 'pear', windows: 2 }),
  sackB: (r) => sackGeo(r, { H: 5.2, R: 2.7, shape: 'round', windows: 2 }),
  sackC: (r) => sackGeo(r, { H: 7.4, R: 2.3, shape: 'gourd', windows: 2 }),
  bigA: (r) => sackGeo(r, { H: 10.5, R: 4.3, shape: 'pear', windows: 3, segs: 14, rows: 11, hoop: true }),
  bigB: (r) => sackGeo(r, { H: 9, R: 4.6, shape: 'round', windows: 3, segs: 14, rows: 10, hoop: true }),
  pouchA: (r) => sackGeo(r, { H: 3.1, R: 1.35, shape: 'pear', windows: 1, segs: 8, rows: 6, small: true }),
  pouchB: (r) => sackGeo(r, { H: 2.6, R: 1.5, shape: 'round', windows: 1, segs: 8, rows: 6, small: true }),
  gondola: (r) => gondolaGeo(r, {}), gondolaB: (r) => gondolaGeo(r, { L: 9, B: 3.6, hang: 7 }),
  terrace: (r) => gondolaGeo(r, { grand: true, L: 42, B: 15.5, hang: 20 }),
  hammock: (r) => hammockGeo(r), ladder: () => ladderGeo(12), ladderLong: () => ladderGeo(24), basket: (r) => basketGeo(r),
  chandelier: (r) => chandelierGeo(r, {}), chandelierGrand: (r) => chandelierGeo(r, { grand: true }),
  pot: (r) => potGeo(r, {}), potLong: (r) => potGeo(r, { long: 1.8, vines: 5 }),
  laundryA: (r) => laundryGeo(r, {}), laundryB: (r) => laundryGeo(r, { W: 5 }), skins: (r) => skinsGeo(r), lamp: () => lampGeo(),
  trapeze: () => trapezeGeo(), rings: () => ringsGeo(), shower: () => showerGeo(), dumbWaiter: () => dumbWaiterGeo(), cableCar: () => cableCarGeo(),
  bicycle: () => bicycleGeo(), figure: (r) => figureGeo(r, false), figureHat: (r) => figureGeo(r, true), plank: () => plankGeo(), post: () => postGeo(),
  link: () => linkGeo(), pennant: () => pennantGeo(), string: () => stringGeo(), pigeon: () => pigeonGeo(),
  plankFar: () => plankFarGeo(),
  // the plain forms (round 5): same size and outline as their kinds, fewer sides, no fittings; hung where a string's
  // hang point is farther from the route's line than the world states (see hangString's 'far')
  sackAFar: (r) => sackGeo(r, { H: 6.2, R: 2.5, shape: 'pear', windows: 2, segs: 8, rows: 6, far: true }),
  sackBFar: (r) => sackGeo(r, { H: 5.2, R: 2.7, shape: 'round', windows: 2, segs: 8, rows: 6, far: true }),
  sackCFar: (r) => sackGeo(r, { H: 7.4, R: 2.3, shape: 'gourd', windows: 2, segs: 8, rows: 7, far: true }),
  bigAFar: (r) => sackGeo(r, { H: 10.5, R: 4.3, shape: 'pear', windows: 3, segs: 10, rows: 7, far: true }),
  bigBFar: (r) => sackGeo(r, { H: 9, R: 4.6, shape: 'round', windows: 3, segs: 10, rows: 7, far: true }),
  pouchAFar: (r) => sackGeo(r, { H: 3.1, R: 1.35, shape: 'pear', windows: 1, segs: 6, rows: 5, small: true, far: true }),
  pouchBFar: (r) => sackGeo(r, { H: 2.6, R: 1.5, shape: 'round', windows: 1, segs: 6, rows: 5, small: true, far: true }),
  gondolaFar: (r) => gondolaGeo(r, { far: true }), gondolaBFar: (r) => gondolaGeo(r, { L: 9, B: 3.6, hang: 7, far: true }),
  potFar: (r) => potGeo(r, { far: true }), potLongFar: (r) => potGeo(r, { long: 1.8, far: true }),
  lampFar: () => lampGeo(true), basketFar: (r) => basketGeo(r, true), skinsFar: (r) => skinsGeo(r, true),
  ladderFar: () => ladderGeo(12, true), ladderLongFar: () => ladderGeo(24, true), chandelierFar: (r) => chandelierGeo(r, { far: true }), hammockFar: (r) => hammockGeo(r, true),
  hall: (r) => hallGeo(r), goat: () => goatGeo(),
};
const FAR_OF = {}; for (const k of Object.keys(KIND_MAKERS)) if (k.endsWith('Far') && k !== 'plankFar') FAR_OF[k.slice(0, -3)] = k;

// a kind's TRUE reach, from its own vertices (the cord above it left out): its height, and for every metre of depth
// its greatest radius about its own axis, with the cord's thickness, the flutter at the gust's full value and the lean
// of falling water at the gust's full value (at the largest scale a shower is given) counted in; zMax: its greatest
// reach across its own long axis (a boat's true half beam)
const reachOf = (g) => {
  const prof = []; let h = 0, rMax = 0, zMax = 0;
  for (let i = 0; i < g.P.length / 3; i++) {
    if (g.M[i * 4] > 0.5) continue;
    const x = g.P[i * 3], y = g.P[i * 3 + 1], z = g.P[i * 3 + 2], d = Math.max(0, -y), k = Math.floor(d);
    let r = Math.hypot(x, z) + g.M[i * 4 + 2] + g.C[i * 4 + 3] * (SWAY.flut0 + SWAY.flutG * SWAY.gMax) * 0.4 * 1.45;
    if (g.M[i * 4 + 3] === PAT.WATER) r += (SWAY.lean0 + SWAY.leanG * SWAY.gMax) * y * y * 1.3;
    h = Math.max(h, d); rMax = Math.max(rMax, r); zMax = Math.max(zMax, Math.abs(z) + r - Math.hypot(x, z));
    while (prof.length <= k) prof.push(0);
    prof[k] = Math.max(prof[k], r);
  }
  return { h, prof, rMax, zMax };
};

export function makeHungKit(ctx, o = {}) {
  const rng = (o.rng || ctx.rng).fork('hung-kit');
  const net = o.net || makeNetFn({});
  const U = {
    uTime: { value: 0 }, uGustF: { value: new THREE.Vector4(1 / 180, 1 / 11, 0, 0) }, uPix: { value: 2 / 450 }, uWind: { value: new THREE.Vector4(1, 0, 0.028, 0.9) },
    ...net.uniforms(),
    uSunDir: { value: new THREE.Vector3(0.74, 0.57, 0.36).normalize() }, uSunCol: { value: new THREE.Color(1.05, 0.97, 0.82) },
    uSkyCol: { value: new THREE.Color(0.25, 0.34, 0.5) }, uGndCol: { value: new THREE.Color(0.2, 0.24, 0.3) },
    uFogCol: { value: new THREE.Color(0.62, 0.78, 0.95) }, uLampCol: { value: new THREE.Color().setRGB(C.lamp[0], C.lamp[1], C.lamp[2]) },
    uFogDen: { value: 0.0006 }, uLampK: { value: 1 }, uLantern: { value: 0 }, uMist: { value: new THREE.Vector4(1, 1, 1, 0) },
    uShadeG: { value: new Float32Array(32).fill(-1e5) }, uShadeP: { value: new THREE.Vector4(0, 1, 0.5, 0.025) }, uShadeQ: { value: new THREE.Vector2(-620, 5) },
    uHoles: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, 1e5, 0, 0)) }, uHemp: { value: new THREE.Color().setRGB(C.hemp[0], C.hemp[1], C.hemp[2]) },
  };
  const matHung = new THREE.ShaderMaterial({ defines: { HUNG: 1 }, uniforms: U, vertexShader: VERT_SOLID, fragmentShader: FRAG_SOLID, side: THREE.DoubleSide });
  const matStatic = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_SOLID, fragmentShader: FRAG_SOLID, side: THREE.DoubleSide });
  const matNet = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_NET, fragmentShader: FRAG_NET, side: THREE.DoubleSide, transparent: true, depthWrite: false });
  const matGlow = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_GLOW, fragmentShader: FRAG_GLOW, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const matSmoke = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VERT_SMOKE, fragmentShader: FRAG_SMOKE, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const kinds = new Map(), glows = [], smokes = [], stat = new Geo();
  // every kind's stream, in one fixed order; the plain forms (new in round 5) have streams of their own made from the world's seed and their name, so no older stream is dealt anew
  const kindRng = {}; for (const name of Object.keys(KIND_MAKERS)) kindRng[name] = FAR_OF[name.slice(0, -3)] === name || name === 'hall' || name === 'goat' ? ctx.core.makeRng(ctx.core.hashSeed('kind-' + name + ':' + ctx.seed)) : rng.fork('kind-' + name);
  const kindOf = (name) => {
    let k = kinds.get(name);
    if (!k) { const made = KIND_MAKERS[name](kindRng[name]); made.reach = reachOf(made.g); k = { name, info: made, geo: made.g, piv: [], at: [], quat: [], par: [], tint: [], n: 0 }; kinds.set(name, k); }
    return k;
  };
  const v = new THREE.Vector3(), q = new THREE.Quaternion(), e = new THREE.Euler();
  const kit = {
    uniforms: U, net, kinds, static: stat, materials: { hung: matHung, static: matStatic, net: matNet, glow: matGlow, smoke: matSmoke }, count: 0, glowCount: 0, smokeCount: 0,
    info: (name) => kindOf(name).info,
    // hang a thing. o: pivot [x,y,z] (what it sways from), rope (m of rope above its top), at (from the pivot to its top; default straight down the rope),
    // yaw / pitch / roll or quat, scale, tint [r,g,b], seed, motion (0..1 rides its string, <0 turns, >=2 walks), swing (own swing, rad)
    add(name, o) {
      const k = kindOf(name), rope = o.rope ?? 0, sc = o.scale ?? 1, at = o.at || [0, -rope, 0], seed = o.seed ?? rng();
      if (o.quat) q.copy(o.quat); else q.setFromEuler(e.set(o.pitch ?? 0, o.yaw ?? 0, o.roll ?? 0, 'YXZ'));
      const tint = o.tint || [1, 1, 1];
      k.piv.push(o.pivot[0], o.pivot[1], o.pivot[2]); k.at.push(at[0], at[1], at[2]); k.quat.push(q.x, q.y, q.z, q.w);
      k.par.push(rope, sc, seed, o.motion ?? 0); k.tint.push(tint[0], tint[1], tint[2], o.swing ?? 0); k.n++; kit.count++;
      if (k.info.lamps && o.glow !== false && (o.motion ?? 0) < 0) {       // a thing that turns: one soft glow for all its candles
        let my = 0; for (const L of k.info.lamps) my += L[1] / k.info.lamps.length;
        kit.glow(o.pivot, [at[0], at[1] + my * sc, at[2]], k.info.r * sc * 1.7 * (o.glow ?? 1), mulc(C.lamp, 0.4), seed);
      } else if (k.info.lamps && o.glow !== false) for (const L of k.info.lamps) {
        v.set(L[0] * sc, L[1] * sc, L[2] * sc).applyQuaternion(q);
        kit.glow(o.pivot, [at[0] + v.x, at[1] + v.y, at[2] + v.z], L[3] * sc * (o.glow ?? 1), null, seed);
      }
      if (k.info.smoke && o.smoke !== false && (o.smoke === true || (seed * 7.31) % 1 < 0.66)) {      // two houses in three have the stove lit
        v.set(k.info.smoke[0] * sc, k.info.smoke[1] * sc, k.info.smoke[2] * sc).applyQuaternion(q);
        smokes.push(o.pivot[0], o.pivot[1], o.pivot[2], at[0] + v.x, at[1] + v.y, at[2] + v.z, sc, seed); kit.smokeCount++;
      }
      return { top: [o.pivot[0] + at[0], o.pivot[1] + at[1], o.pivot[2] + at[2]], bottom: [o.pivot[0] + at[0], o.pivot[1] + at[1] - k.info.h * sc, o.pivot[2] + at[2]], info: k.info, sc };
    },
    glow(pivot, at, size, col, seed = 0) { const c = col || C.lamp; glows.push(pivot[0], pivot[1], pivot[2], at[0], at[1], at[2], size, seed, c[0], c[1], c[2]); kit.glowCount++; },
    // a rope, cable or chain laid through points (it heaves with the net by 'heave'); pat PAT.ROPE or PAT.CHAIN
    cable(pts, rad, col = C.hemp, pat = PAT.ROPE, heave = 1, sides = 5) { stat.set(col, pat); stat.flex = heave; stat.rope(pts, rad, sides); stat.flex = 0; },
    setLight(L) {
      if (L.sunDir) U.uSunDir.value.copy(L.sunDir).normalize(); if (L.sunCol) U.uSunCol.value.copy(L.sunCol); if (L.sky) U.uSkyCol.value.copy(L.sky);
      if (L.ground) U.uGndCol.value.copy(L.ground); if (L.fog) U.uFogCol.value.copy(L.fog); if (L.fogDensity != null) U.uFogDen.value = L.fogDensity;
      if (L.lampK != null) U.uLampK.value = L.lampK; if (L.lantern != null) U.uLantern.value = L.lantern; if (L.hemp) U.uHemp.value.copy(L.hemp);
    },
    async finish() {
      const group = new THREE.Group(); let triangles = 0, calls = 0;
      for (const k of kinds.values()) {
        if (!k.n) continue;
        const src = k.geo.toGeometry(), g = new THREE.InstancedBufferGeometry();
        g.index = src.index; for (const name of ['position', 'normal', 'color', 'aMat']) g.setAttribute(name, src.getAttribute(name));
        g.setAttribute('iPivot', new THREE.InstancedBufferAttribute(new Float32Array(k.piv), 3)); g.setAttribute('iAt', new THREE.InstancedBufferAttribute(new Float32Array(k.at), 3));
        g.setAttribute('iQuat', new THREE.InstancedBufferAttribute(new Float32Array(k.quat), 4)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array(k.par), 4));
        g.setAttribute('iTint', new THREE.InstancedBufferAttribute(new Float32Array(k.tint), 4)); g.instanceCount = k.n;
        const m = new THREE.Mesh(g, matHung); m.frustumCulled = false; m.name = 'hung-' + k.name; group.add(m);
        triangles += k.geo.triangles * k.n; calls++; k.mesh = m;
        await ctx.yield();
      }
      if (stat.triangles) { const m = new THREE.Mesh(stat.toGeometry(), matStatic); m.frustumCulled = false; m.name = 'net-static'; group.add(m); triangles += stat.triangles; calls++; }
      if (kit.glowCount) {
        const n = kit.glowCount, g = new THREE.InstancedBufferGeometry(), A = new Float32Array(glows), piv = new Float32Array(n * 3), at = new Float32Array(n * 3), par = new Float32Array(n * 4), col = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const b = i * 11; piv.set(A.subarray(b, b + 3), i * 3); at.set(A.subarray(b + 3, b + 6), i * 3); par[i * 4] = A[b + 6]; par[i * 4 + 1] = A[b + 7]; col.set(A.subarray(b + 8, b + 11), i * 3); }
        g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
        g.setAttribute('iPivot', new THREE.InstancedBufferAttribute(piv, 3)); g.setAttribute('iAt', new THREE.InstancedBufferAttribute(at, 3));
        g.setAttribute('iPar', new THREE.InstancedBufferAttribute(par, 4)); g.setAttribute('iCol', new THREE.InstancedBufferAttribute(col, 3)); g.instanceCount = n;
        const m = new THREE.Mesh(g, matGlow); m.frustumCulled = false; m.renderOrder = 5; m.name = 'glows'; group.add(m); triangles += n * 2; calls++;
      }
      if (kit.plumeTest) {                                            // the world's own test of each plume (its lane): a house whose plume fails has none
        let n = 0;
        for (let i = 0; i < kit.smokeCount; i++) { const b = i * 8; if (!kit.plumeTest(smokes[b], smokes[b + 1], smokes[b + 2], smokes[b + 3], smokes[b + 4], smokes[b + 5], smokes[b + 6], smokes[b + 7])) continue; if (n !== i) for (let j = 0; j < 8; j++) smokes[n * 8 + j] = smokes[b + j]; n++; }
        smokes.length = n * 8; kit.smokeCount = n;
      }
      if (kit.smokeCount) {
        const n = kit.smokeCount, NS = 7, g = new THREE.InstancedBufferGeometry(), A = new Float32Array(smokes), piv = new Float32Array(n * 3), at = new Float32Array(n * 3), par = new Float32Array(n * 4), pos = [], idx = [];
        for (let j = 0; j <= NS; j++) pos.push(-1, j / NS, 0, 1, j / NS, 0);
        for (let j = 0; j < NS; j++) idx.push(j * 2, j * 2 + 1, j * 2 + 3, j * 2, j * 2 + 3, j * 2 + 2);
        for (let i = 0; i < n; i++) { const b = i * 8; piv.set(A.subarray(b, b + 3), i * 3); at.set(A.subarray(b + 3, b + 6), i * 3); par[i * 4] = A[b + 6]; par[i * 4 + 1] = A[b + 7]; }
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
        g.setAttribute('iPivot', new THREE.InstancedBufferAttribute(piv, 3)); g.setAttribute('iAt', new THREE.InstancedBufferAttribute(at, 3)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(par, 4)); g.instanceCount = n;
        const m = new THREE.Mesh(g, matSmoke); m.frustumCulled = false; m.renderOrder = 4; m.name = 'chimney-smoke'; group.add(m); triangles += n * NS * 2; calls++;
      }
      kit.triangles = triangles; kit.calls = calls;
      return group;
    },
    _size: new THREE.Vector2(),
    update(dt, time, camera) {
      U.uTime.value = time;
      const h = ctx.renderer ? ctx.renderer.getDrawingBufferSize(kit._size).y : 450;
      U.uPix.value = 2 / Math.max(h, 1);                              // one pixel as a share of the picture's half height (the lamp glows' floor)
    },
  };
  return kit;
}

// ---------------------------------------------------------------- the net: lattice surface, great cables, catwalks, posts
// o: { path (camera route, kept clear), holes [[x, z, r], ...] (hatches through the mesh, at most 4), density, far (min distance of figures from the path),
// plain (things on the posts farther than this from the path are hung in their plain forms) }
export async function buildNet(kit, rng, o = {}) {
  const pause = o.yield || (async () => {});
  const net = kit.net, N = net.N, L = net.L, den = o.density ?? 1, path = o.path || null, holes = o.holes || [];
  holes.forEach((h, i) => { if (i < 4) kit.uniforms.uHoles.value[i].set(h[0], h[1], h[2], 0); });
  const inHole = (x, z, m = 0) => holes.some((h) => Math.hypot(x - h[0], z - h[1]) < h[2] + m);
  // --- the lattice surface
  const NS = 150, NT = 24, pos = [], nor = [], st = [], idx = [], p3 = [0, 0, 0];
  for (let i = 0; i <= NS; i++) {
    if (i % 50 === 49) await pause();
    for (let j = 0; j <= NT; j++) {
      const s = i / NS, t = j / NT * 2 - 1; net.at(s, t, p3); pos.push(p3[0], p3[1], p3[2]); st.push(s, t);
      const f = net.frame(clamp(s, 0.003, 0.997), t); nor.push(f.up.x, f.up.y, f.up.z);
    }
  }
  for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) { const a = i * (NT + 1) + j, b = a + NT + 1; idx.push(a, b, b + 1, a, b + 1, a + 1); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); sg.setAttribute('aST', new THREE.Float32BufferAttribute(st, 2)); sg.setIndex(idx);
  const surface = new THREE.Mesh(sg, kit.materials.net); surface.frustumCulled = false; surface.renderOrder = 3; surface.name = 'net-lattice';
  await pause();
  // --- great cables along the net and cross cables
  const lanesT = []; for (let k = -N.lanes; k <= N.lanes; k++) lanesT.push(k / N.lanes);
  // no cable lies across a hatch: one whose line would pass by the hatch's middle ENDS on the rim's rope at both sides, in
  // an iron ring (so nothing curves round the hole beside the route); one that only clips the hole is led round the rim.
  // ledRound returns the cable as one run or two.
  const ledRound = (raw, rad) => {
    const fine = [];
    for (let i = 0; i < raw.length; i++) {
      fine.push(raw[i]); if (i === raw.length - 1) break;
      const a = raw[i], b = raw[i + 1], len = Math.hypot(b[0] - a[0], b[2] - a[2]);
      if (!holes.some((h) => Math.hypot((a[0] + b[0]) / 2 - h[0], (a[2] + b[2]) / 2 - h[1]) < h[2] + 1 + len)) continue;
      const n = Math.max(1, Math.ceil(len / 1.4)); for (let k = 1; k < n; k++) { const x = lerp(a[0], b[0], k / n), z = lerp(a[2], b[2], k / n); fine.push([x, net.y(x, z), z]); }
    }
    // a run of points inside a hatch is replaced by the shorter way round its rim
    let out = []; const runs = [out], inH = (q) => holes.find((h) => Math.hypot(q[0] - h[0], q[2] - h[1]) < h[2] + 0.55) || null;
    const rimAt = (h, q) => { const d = Math.hypot(q[0] - h[0], q[2] - h[1]) || 1, x = h[0] + (q[0] - h[0]) / d * (h[2] + 0.3), z = h[1] + (q[2] - h[1]) / d * (h[2] + 0.3), p = [x, net.y(x, z) + 0.2, z];
      const S = kit.static; S.flex = 1; S.set(C.iron, PAT.METAL); S.push(p[0], p[1] - 0.1, p[2], 0, 0, 0, 1); S.ring(0, 0.42, 0.09, 8, 4); S.pop(); S.flex = 0; return p; };
    for (let i = 0; i < fine.length; i++) {
      const h = inH(fine[i]);
      if (!h) { out.push([fine[i][0], fine[i][1] + rad * 0.5, fine[i][2]]); continue; }
      let k = i; while (k + 1 < fine.length && inH(fine[k + 1]) === h) k++;
      const a = fine[Math.max(i - 1, 0)], b = fine[Math.min(k + 1, fine.length - 1)], r = h[2] + 0.55, mid = fine[(i + k) >> 1];
      if (Math.hypot(mid[0] - h[0], mid[2] - h[1]) < h[2] * 0.5) { out.push(rimAt(h, a)); out = [rimAt(h, b)]; runs.push(out); i = k; continue; }
      const a0 = Math.atan2(a[2] - h[1], a[0] - h[0]); let da = Math.atan2(b[2] - h[1], b[0] - h[0]) - a0;
      while (da > Math.PI) da -= TAU; while (da <= -Math.PI) da += TAU;
      const n = Math.max(2, Math.ceil(Math.abs(da) * r / 1.3));
      for (let m = 0; m <= n; m++) { const an = a0 + da * m / n, x = h[0] + Math.cos(an) * r, z = h[1] + Math.sin(an) * r; out.push([x, net.y(x, z) + rad * 0.5, z]); }
      i = k;
    }
    return runs.filter((r) => r.length > 1);
  };
  const along = (t, off, rad, col, pat, sides = 5) => { const pts = []; for (let i = 0; i <= 90; i++) { const s = i / 90, h = net.half(s); net.at(s, t + off / Math.max(h, 1), p3); pts.push([p3[0], p3[1], p3[2]]); } for (const run of ledRound(pts, rad)) kit.cable(run, rad, col, pat, 1, sides); };
  for (const t of lanesT) {
    if (Math.abs(t) > 0.99) along(t, 0, 0.36, C.hemp, PAT.ROPE, 6);
    else { along(t, -0.95, 0.13, C.hemp, PAT.ROPE, 4); along(t, 0.95, 0.13, C.hemp, PAT.ROPE, 4); }
  }
  await pause();
  for (let k = 0; k < N.lanes * 2; k++) { const t = (k + 0.5) / N.lanes - 1; along(t, 0, 0.17, k % 2 ? C.hemp : mixc(C.hemp, C.hempDark, 0.45), PAT.ROPE, 4); }
  const across = (s, rad, col) => { const pts = [], h = net.half(s), n = Math.max(4, Math.round(h / 3.5)); for (let j = 0; j <= n; j++) { net.at(s, j / n * 2 - 1, p3); pts.push([p3[0], p3[1] + rad * 0.5, p3[2]]); } for (const run of ledRound(pts, rad)) kit.cable(run, rad, col, PAT.ROPE, 1, 4); };
  for (let j = 1; j < N.cross * 2; j++) { const s = j / (N.cross * 2); across(s, j % 2 ? 0.08 : 0.11, j % 2 ? C.hempDark : C.hemp); }
  await pause();
  // --- catwalks: plank ties with gaps, along the lanes and across at the cross walks
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), X = new THREE.Vector3(), Z = new THREE.Vector3(), walks = [];
  const plank = (s, t, lengthwise, jit) => {
    net.at(s, t, p3); if (inHole(p3[0], p3[2], 1.2)) return;
    const f = net.frame(clamp(s, 0.003, 0.997), t);
    if (lengthwise) X.copy(f.r); else X.copy(f.f);
    X.applyAxisAngle(f.up, jit); Z.crossVectors(X, f.up); qq.setFromRotationMatrix(m4.makeBasis(X, f.up, Z));
    const k = rng.range(0.62, 1.12), pale = rng.chance(0.12);
    kit.add(path && path.distanceTo(p3[0], p3[1], p3[2]) > 36 ? 'plankFar' : 'plank', { pivot: [p3[0] + f.up.x * 0.16, p3[1] + f.up.y * 0.16, p3[2] + f.up.z * 0.16], quat: qq, scale: rng.range(0.92, 1.08), tint: pale ? mulc(C.plankPale, 1.15) : mulc(C.plank, k) });
  };
  const sEnd0 = o.s0 ?? 0.012, sEnd1 = o.s1 ?? 0.988, step = 0.66;
  for (const t of lanesT) {
    if (Math.abs(t) > 0.99) continue;
    for (let d = sEnd0 * L, k = 0; d < sEnd1 * L; d += step, k++) { if ((k & 255) === 255) await pause(); if (rng.chance(0.035)) continue; plank(d / L, t, true, rng.range(-0.07, 0.07)); }
    walks.push({ t, lengthwise: true });
    await pause();
  }
  for (let j = 2; j < N.cross; j += 2) {
    const s = j / N.cross, h = net.half(s);
    for (let d = -h + 1; d < h - 1; d += step) { if (rng.chance(0.035)) continue; const t = d / h; if (lanesT.some((lt) => Math.abs(lt) < 0.99 && Math.abs(t - lt) * h < 1.0)) continue; plank(s, t, false, rng.range(-0.07, 0.07)); }
    walks.push({ s, lengthwise: false });
  }
  await pause();
  // --- hand ropes on stanchions beside the lane walks
  for (const t of lanesT) {
    if (Math.abs(t) > 0.99) continue;
    for (const side of [-1, 1]) {
      const top = []; let run = [];
      for (let d = sEnd0 * L; d <= sEnd1 * L; d += 5.5) {
        const s = d / L, h = net.half(s); net.at(s, t + side * 1.05 / Math.max(h, 1), p3);
        if (inHole(p3[0], p3[2], 0.5)) { if (run.length > 1) top.push(run); run = []; continue; }
        const f = net.frame(clamp(s, 0.003, 0.997), t), a = [p3[0], p3[1], p3[2]], b = [p3[0] + f.up.x * 1.15, p3[1] + f.up.y * 1.15, p3[2] + f.up.z * 1.15];
        kit.cable([a, b], 0.04, C.plank, PAT.WOOD, 1, 3);
        if (run.length) { const pr = run[run.length - 1]; run.push([(pr[0] + b[0]) / 2, (pr[1] + b[1]) / 2 - 0.16, (pr[2] + b[2]) / 2]); }
        run.push(b);
      }
      if (run.length > 1) top.push(run);
      for (const r of top) kit.cable(r, 0.03, C.hemp, PAT.ROPE, 1, 3);
    }
  }
  await pause();
  // --- rope rings round the hatches
  for (const h of holes) { const pts = [], nk = h[2] > 6 ? 44 : 20; for (let k = 0; k <= nk; k++) { const a = k / nk * TAU, x = h[0] + Math.cos(a) * (h[2] + 0.3), z = h[1] + Math.sin(a) * (h[2] + 0.3); pts.push([x, net.y(x, z) + 0.2, z]); } kit.cable(pts, 0.16, C.hemp, PAT.ROPE, 1, 5); }
  // --- posts with an arm beside the walks, and what people have left hanging on them
  const posts = [], canv = C.canvas;
  const nearPath = (x, y, z) => (path ? path.distanceTo(x, y, z) : 99);
  for (const t of lanesT) {
    if (Math.abs(t) > 0.99) continue;
    let k = 0;
    for (let d = sEnd0 * L + rng.range(4, 14); d < sEnd1 * L - 4; d += rng.range(13, 22) / den, k++) {
      const s = d / L, h = net.half(s), side = k % 2 ? 1 : -1; net.at(s, t + side * 1.5 / Math.max(h, 1), p3);
      if (inHole(p3[0], p3[2], 2.5)) continue;
      const base = [p3[0], p3[1], p3[2]], yaw = (side > 0 ? 0 : Math.PI) + rng.range(-0.5, 0.5), cy = Math.cos(yaw), sy = Math.sin(yaw);
      const tip = [1.5 * cy, 3.0, -1.5 * sy];
      if (nearPath(base[0] + tip[0], base[1] + 2, base[2] + tip[2]) < 2.6) continue;
      kit.add('post', { pivot: base, at: [0, 0, 0], yaw, seed: rng() });
      posts.push({ base, tip, s, t });
      const plain = path && o.plain && nearPath(base[0], base[1], base[2]) > o.plain;      // the plain forms beyond the world's stated distance from the route
      const r = rng(), hang = (name, rope, extra = {}) => kit.add(plain && FAR_OF[name] ? FAR_OF[name] : name, { pivot: base, at: [tip[0], tip[1] - rope, tip[2]], rope, yaw: yaw + rng.range(-0.4, 0.4), seed: rng(), ...extra });
      if (r < 0.34) hang('lamp', rng.range(0.3, 0.6), { glow: 1 });
      else if (r < 0.56) hang(rng.chance(0.5) ? 'laundryA' : 'laundryB', 0.25, { yaw: yaw + Math.PI / 2 + rng.range(-0.3, 0.3) });
      else if (r < 0.68) hang('skins', 0.25, { yaw: yaw + Math.PI / 2 });
      else if (r < 0.76) hang('bicycle', 0.3, { yaw: yaw + Math.PI / 2 });
      else if (r < 0.88) hang('pot', rng.range(0.3, 0.8));
      else hang('basket', rng.range(0.4, 1.0));
      if (rng.chance(0.5)) kit.add('pennant', { pivot: base, at: [0, 3.3, 0], yaw: rng.range(0, TAU), tint: rng.pick(canv), seed: rng() });
    }
  }
  await pause();
  // --- far figures on the walks and pigeons on the hand ropes
  const nFig = Math.round((o.figures ?? 46) * den);
  for (let i = 0, tries = 0; i < nFig && tries < nFig * 30; tries++) {
    const w = rng.pick(walks), s = w.lengthwise ? rng.range(0.06, 0.94) : w.s, t = w.lengthwise ? w.t : rng.range(-0.9, 0.9);
    net.at(s, t, p3); if (inHole(p3[0], p3[2], 2) || nearPath(p3[0], p3[1] + 1, p3[2]) < (o.far ?? 34)) continue;
    const f = net.frame(clamp(s, 0.003, 0.997), t), yaw = Math.atan2(-(w.lengthwise ? f.f.z : f.r.z), w.lengthwise ? f.f.x : f.r.x);
    kit.add(rng.chance(0.4) ? 'figureHat' : 'figure', { pivot: [p3[0], p3[1] + 0.2, p3[2]], yaw, scale: rng.range(0.9, 1.1), tint: mulc(rng.pick(canv), rng.range(0.6, 1.1)), motion: rng.chance(0.6) ? 2 + rng.range(1.5, 5) : 0, seed: rng() });
    i++;
  }
  const nPig = Math.round((o.pigeons ?? 60) * den);
  for (let i = 0; i < nPig; i++) {
    const t = rng.pick(lanesT.filter((x) => Math.abs(x) < 0.99)), s = rng.range(0.05, 0.95), h = net.half(s), side = rng.chance(0.5) ? 1 : -1;
    net.at(s, t + side * 1.05 / Math.max(h, 1), p3); if (inHole(p3[0], p3[2], 1)) continue;
    const f = net.frame(clamp(s, 0.003, 0.997), t);
    kit.add('pigeon', { pivot: [p3[0] + f.up.x * 1.17, p3[1] + f.up.y * 1.17 - 0.08, p3[2] + f.up.z * 1.17], yaw: rng.range(0, TAU), scale: rng.range(0.9, 1.2), seed: rng() });
  }
  return { surface, posts, lanesT, inHole };
}

// ---------------------------------------------------------------- what hangs from one point of the net: a string of things
const tintJ = (rng, c) => { const k = rng.range(0.78, 1.12), d = rng.range(-0.04, 0.04); return [clamp(c[0] * k + d, 0.02, 0.95), clamp(c[1] * k, 0.02, 0.95), clamp(c[2] * k - d, 0.02, 0.95)]; };
const BELOW = [['pot', 3], ['potLong', 2], ['basket', 3], ['lamp', 3], ['ladder', 2], ['pouch', 2.4], ['hammock', 1.6], ['laundry', 1.6], ['trapeze', 0.6], ['rings', 0.5], ['skins', 0.7], ['shower', 0.1], ['chandelier', 0.3], ['dumbWaiter', 0.4]];
const SOLO = [['basket', 3], ['lamp', 3], ['pot', 2], ['potLong', 2], ['laundry', 2], ['hammock', 2], ['skins', 1], ['shower', 0.14], ['dumbWaiter', 0.8], ['trapeze', 0.8], ['rings', 0.7], ['chandelier', 0.5], ['pouch', 3]];
const pickW = (rng, list) => { let t = 0; for (const e of list) t += e[1]; let r = rng() * t; for (const e of list) { r -= e[1]; if (r <= 0) return e[0]; } return list[0][0]; };

// the lane's test of one thing by its TRUE reach: its top hangs 'top' metres under the hang point P (dx, dz aside) on
// 'rope' metres of cord; swing: its own swing (rad); rides: it travels up and down its cord
export const reachClear = (info, lane, P, dx, dz, top, rope, sc, swing = 0, rides = false) => {
  const RT = info.reach, great = (info.H || 0) * sc >= 9 ? info.H * sc : 0, off = Math.hypot(dx, dz);      // a great house: its body 9 m tall or more
  for (let k = 0; k <= rope; k += 2) if (!lane(P[0] + dx, P[1] - top + k, P[2] + dz, rides ? RT.rMax * sc : 0.2, Math.hypot(off, top - k), 0)) return false;
  for (let k = 0; k < RT.prof.length; k++) {
    const rr = RT.prof[k] * sc + (swing ? (k + 1) * sc * swing : 0), dep = top + (k + 0.5) * sc;
    if (!lane(P[0] + dx, P[1] - dep, P[2] + dz, Math.hypot(rr, 0.5 * sc), Math.hypot(off, dep), great)) return false;
  }
  return true;
};
// P: [x, y, z] on the net. o: { depth (how far below the net this string may reach), kind ('house' | 'big' | 'gondola' | 'small' | 'solo'),
// clear(x, y, z, r) -> false where the camera flies, tint(rng) -> canvas colour, yaw,
// strict (the first thing is hung at the given depth or nothing is hung), far (the whole string is hung in the plain forms),
// lane(x, y, z, r, arm, great) -> false where a ball of radius r whose centre rests there, 'arm' metres under its hang
// point, would come into the lane at the gust's full swing; great: a house's body height where it is 9 m or more }.
// Every thing is tested with its TRUE reach (info.reach): a ball for every metre of its depth, its cord every 2 m (as
// wide as the thing where the thing rides its cord), its own swing counted. Returns what was hung: [{ name, top, bottom, info, sc }]
export function hangString(kit, rng, P, o = {}) {
  const depthMax = o.depth ?? 40, out = [], tint = o.tint || (() => tintJ(rng, rng.pick(C.canvas)));
  const ok = (x, y, z, r) => !o.clear || o.clear(x, y, z, r);
  let y = o.start ?? 0;
  const put = (name, rope, ex = {}) => {
    if (o.far && FAR_OF[name]) name = FAR_OF[name];
    const info = kit.info(name), sc = ex.scale ?? 1, h = info.h * sc, r = info.r * sc, dx = ex.dx ?? 0, dz = ex.dz ?? 0, top = (ex.depth ?? y) + rope;
    if (top + h > depthMax && !ex.force) return null;
    for (let k = 0; k <= rope; k += 2.5) if (!ok(P[0] + dx, P[1] - top + k, P[2] + dz, 0.4)) return null;
    for (let k = 0; k <= h + 0.01; k += Math.max(r, 1.2)) if (!ok(P[0] + dx, P[1] - top - Math.min(k + r * 0.5, h), P[2] + dz, r)) return null;
    if (o.lane && !reachClear(info, o.lane, P, dx, dz, top, rope, sc, ex.swing, ex.motion > 0 && ex.motion <= 1)) return null;
    const res = kit.add(name, { pivot: P, at: [dx, -top, dz], rope, yaw: ex.yaw ?? rng.range(0, TAU), scale: sc, tint: ex.tint, motion: ex.motion, swing: ex.swing, seed: rng(), glow: ex.glow, smoke: ex.smoke });
    res.name = name; res.depth = top + h; res.rope = rope; out.push(res);
    if (ex.depth == null) y = top + h;
    return res;
  };
  const small = (name, rope, ex = {}) => {
    switch (name) {
      case 'pot': case 'potLong': return put(name, rope, { scale: rng.range(0.9, 1.5), ...ex });
      case 'basket': return put('basket', rope + 2, { scale: rng.range(1, 1.6), tint: tintJ(rng, rng.pick(LAUNDRY)), motion: rng.chance(0.6) ? rng.range(0.4, 0.8) : 0, ...ex });
      case 'lamp': return put('lamp', rope, { scale: rng.range(1.1, 1.7), ...ex });
      case 'ladder': return put(rng.chance(0.3) ? 'ladderLong' : 'ladder', 0, { scale: rng.range(0.7, 1.1), ...ex });
      case 'pouch': return put(rng.chance(0.5) ? 'pouchA' : 'pouchB', rope, { scale: rng.range(0.85, 1.3), tint: tint(rng), ...ex });
      case 'hammock': return put('hammock', rope, { scale: rng.range(1, 1.25), tint: tintJ(rng, rng.pick(LAUNDRY)), ...ex });
      case 'laundry': return put(rng.chance(0.5) ? 'laundryA' : 'laundryB', rope, { scale: rng.range(0.9, 1.2), ...ex });
      case 'trapeze': return put('trapeze', rope, { swing: rng.range(0.3, 0.55), ...ex });
      case 'rings': return put('rings', rope, { swing: rng.range(0.2, 0.4), ...ex });
      case 'skins': return put('skins', rope, { scale: rng.range(0.9, 1.2), ...ex });
      case 'shower': return put('shower', rope, { scale: rng.range(1, 1.3), ...ex });
      case 'chandelier': return put('chandelier', rope + 1, { scale: rng.range(1, 1.5), motion: -rng.range(0.15, 0.4), ...ex });
      case 'dumbWaiter': return put('dumbWaiter', rope + 6, { motion: rng.range(0.6, 0.85), ...ex });
      default: return null;
    }
  };
  const chain = (n) => { for (let i = 0; i < n; i++) { if (!small(pickW(rng, BELOW), rng.range(0.8, 5))) break; } };
  const kind = o.kind || 'house';
  if (kind === 'house' || kind === 'big') {
    const big = kind === 'big', name = big ? rng.pick(['bigA', 'bigB']) : rng.pick(['sackA', 'sackB', 'sackC']), sc = big ? rng.range(0.85, 1.15) : rng.range(0.8, 1.25);
    const rope = o.rope ?? rng.range(big ? 5 : 2.5, Math.max(big ? 9 : 5, depthMax * (big ? 0.35 : 0.55)));
    const r = put(name, rope, { scale: o.scale ?? sc, tint: tint(rng), yaw: o.yaw, smoke: o.smoke });
    if (!r) return o.strict ? out : hangString(kit, rng, P, { ...o, kind: big ? 'house' : 'small', rope: undefined });
    const I = r.info, mid = r.depth - 0.7 * r.sc - I.H * r.sc * 0.58, rad = I.R * r.sc * 1.0 + 0.42;
    for (let i = 0, n = big ? rng.int(2, 4) : rng.int(0, 2); i < n; i++) { const a = rng.range(0, TAU); small(rng.chance(0.6) ? 'pot' : 'lamp', 0, { depth: mid - rng.range(0, 1.2), dx: Math.cos(a) * rad, dz: Math.sin(a) * rad }); }
    y = r.depth - 0.25;
    chain(rng.chance(big ? 0.9 : 0.72) ? rng.int(1, big ? 3 : 2) : 0);
  } else if (kind === 'gondola') {
    const name = rng.chance(0.6) ? 'gondola' : 'gondolaB', rope = o.rope ?? rng.range(3, Math.max(4, depthMax * 0.45));
    const r = put(name, rope, { tint: tint(rng), yaw: o.yaw, scale: o.scale });
    if (!r) return o.strict ? out : hangString(kit, rng, P, { ...o, kind: 'house', rope: undefined });
    y = r.depth + 0.2; chain(rng.int(0, 2));
  } else if (kind === 'small') {
    if (small('pouch', o.rope ?? rng.range(2, Math.max(3, depthMax * 0.6)))) chain(rng.chance(0.5) ? 1 : 0);
  } else {
    const name = pickW(rng, SOLO), info = kit.info(name === 'pouch' ? 'pouchA' : name === 'laundry' ? 'laundryA' : name === 'ladder' ? 'ladder' : name);
    small(name, o.rope ?? rng.range(2, clamp(depthMax - info.h * 1.6 - 3, 3, 12)));      // a single small thing hangs on 2 to 12 m of rope at most
    if (rng.chance(0.3)) chain(1);
  }
  return out;
}

// the net's shadow where it falls on the cloud tops far below: a level sheet at height y that works the shadow out per pixel
export function makeShadowSheet(kit, y, size, o = {}) {
  const U = { ...kit.uniforms, uShade: { value: new THREE.Vector4(o.color ? o.color[0] : 0.3, o.color ? o.color[1] : 0.38, o.color ? o.color[2] : 0.56, o.strength ?? 1) } };
  const mat = new THREE.ShaderMaterial({ uniforms: U, transparent: true, depthWrite: false,
    vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec3 vW; uniform vec4 uShade;
${GLSL_COMMON}
${GLSL_LIGHT}
void main(){
  float k = 1. / max(uSunDir.y, 0.12);
  // the shadow falls on billows: its place is shifted by their form, and its depth is broken by them
  vec2 bq = vW.xz * (1. / 150.), bq2 = vW.xz * (1. / 45.);
  vec3 pw = vW + vec3((vnoise(bq + 3.1) - .5) * 44. + (vnoise(bq2 + 9.7) - .5) * 16., 0., (vnoise(bq + 17.3) - .5) * 44. + (vnoise(bq2 + 4.1) - .5) * 16.);
  float t = (netY(pw.xz) - pw.y) * k; vec3 q = pw + uSunDir * t;
  t += (netY(q.xz) - q.y) * k; q = pw + uSunDir * t;
  t += (netY(q.xz) - q.y) * k; q = pw + uSunDir * t;
  t += (netY(q.xz) - q.y) * k; q = pw + uSunDir * t;
  float sr = (uNetA.x - q.z) * uNetA.y, s = clamp(sr, 0., 1.), h = netHalf(s), tt = netT(q.xz, s);
  float inside = smoothstep(-0.01, 0.05, sr) * (1. - smoothstep(0.95, 1.01, sr)) * (1. - smoothstep(0.9, 1.1, abs(tt)));
  float lat = netCover(s, tt, h, 11.);       // the mesh as a soft tone and the walks as soft bands: the shadow of the net's mass, with no grid of strands
  float bil = 0.6 * vnoise(vW.xz * (1. / 70.) + 2.7) + 0.4 * vnoise(vW.xz * (1. / 23.) + 8.1);
  float city = pow(clamp(sin(3.14159265 * s), 0., 1.), 0.8) * clamp(1. - tt * tt, 0., 1.);
  float d = length(vW - cameraPosition), f = exp(-d * d * uFogDen * uFogDen * 0.5);
  float a = inside * (0.14 + 0.3 * lat + 0.55 * city) * (0.5 + 0.85 * bil) * uShade.a * f;
  // the first mountain's long shadow on the cloud: it falls on billows, so its line is shifted by their form (in plan and in height) and is soft
  vec3 bp = vec3(vW.x + (vnoise(bq + 3.1) - .5) * 60. + (vnoise(bq2 + 9.7) - .5) * 20., vW.y + (vnoise(vW.xz * (1. / 260.) + 5.3) - .5) * 90. + (vnoise(vW.xz * (1. / 90.) + 1.9) - .5) * 30., vW.z + (vnoise(bq + 17.3) - .5) * 60. + (vnoise(bq2 + 4.1) - .5) * 20.);
  a = max(a, (1. - sunShadeW(bp, 30.)) * step(vW.z, 40.) * 0.55 * uShade.a * f);
  gl_FragColor = vec4(uShade.rgb, clamp(a, 0., 0.9));
}` });
  const g = new THREE.PlaneGeometry(size, size, 1, 1).rotateX(-Math.PI / 2);
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2.5; mesh.name = 'net-shadow';
  const sd = kit.uniforms.uSunDir.value, N = kit.net.N, cz = (N.zA + N.zB) / 2, cy = (N.yA + N.yB) / 2 - N.sag, kk = (cy - y) / Math.max(sd.y, 0.12);
  mesh.position.set(-sd.x * kk, y, cz - sd.z * kk);
  return mesh;
}

// a cable car on its own cable from A to B (a catenary with 'sag'); the car is one small mesh moved along it
export function makeCableCar(kit, A, B, sag = 9, o = {}) {
  const pts = [], n = 28, at = (t, out = [0, 0, 0]) => { out[0] = lerp(A[0], B[0], t); out[1] = lerp(A[1], B[1], t) - sag * 4 * t * (1 - t); out[2] = lerp(A[2], B[2], t); return out; };
  for (let i = 0; i <= n; i++) pts.push(at(i / n).slice());
  kit.cable(pts, 0.11, mixc(C.hemp, C.hempDark, 0.55), PAT.ROPE, 0, 5);      // a hawser one can see, with lay
  const info = kit.info('cableCar'), src = info.g.toGeometry(), g = new THREE.InstancedBufferGeometry();
  g.index = src.index; for (const name of ['position', 'normal', 'color', 'aMat']) g.setAttribute(name, src.getAttribute(name));
  const tint = o.tint || C.canvas[0];
  g.setAttribute('iPivot', new THREE.InstancedBufferAttribute(new Float32Array(3), 3)); g.setAttribute('iAt', new THREE.InstancedBufferAttribute(new Float32Array(3), 3));
  g.setAttribute('iQuat', new THREE.InstancedBufferAttribute(new Float32Array([0, 0, 0, 1]), 4)); g.setAttribute('iPar', new THREE.InstancedBufferAttribute(new Float32Array([0, 1, o.seed ?? 0.37, 0]), 4));
  g.setAttribute('iTint', new THREE.InstancedBufferAttribute(new Float32Array([tint[0], tint[1], tint[2], 0]), 4)); g.instanceCount = 1;
  const mesh = new THREE.Mesh(g, kit.materials.hung); mesh.frustumCulled = false; mesh.name = 'cable-car';
  const p = [0, 0, 0], yaw = Math.atan2(-(B[2] - A[2]), B[0] - A[0]);
  mesh.rotation.y = yaw;
  // t in 0..1 along the cable
  const place = (t) => { at(clamp(t, 0, 1), p); mesh.position.set(p[0], p[1], p[2]); const e = 0.01, a = at(clamp(t - e, 0, 1)).slice(), b = at(clamp(t + e, 0, 1)); mesh.rotation.z = Math.atan2(b[1] - a[1], Math.hypot(b[0] - a[0], b[2] - a[2])) * 0.25; };
  place(0.5);
  return { mesh, place, at, triangles: info.g.triangles };
}

// ---------------------------------------------------------------- the heart of the city
export const TERRACE_ROPE = 7;       // metres of rope from the net down to the terrace's bridle ring
// opts: { kit, origin: [x, z] (add into a world kit at that point of its net, no meshes of its own), clear(x,y,z,r), lane (see hangString), density, yaw (of the terrace) }
export async function buildHero(ctx, opts = {}) {
  const rng = opts.rng || ctx.rng.fork('heart'), own = !opts.kit, den = opts.density ?? 1;
  const HN = { zA: 78, zB: -78, yA: 62, yB: 62, sag: 4.5, wA: 58, wM: 64, wB: 58, dish: 3, bow: 0, cell: 1.7, lanes: 2, cross: 4 };
  const kit = opts.kit || makeHungKit(ctx, { net: makeNetFn(HN) }), net = kit.net;
  const [ox, oz] = opts.origin || [0, 0], clear = opts.clear || null, lane = opts.lane || null;
  const group = new THREE.Group();
  const NP = (dx, dz) => [ox + dx, net.y(ox + dx, oz + dz), oz + dz];
  let netBits = null;
  if (own) { netBits = await buildNet(kit, rng.fork('patch'), { density: 1, figures: 14, pigeons: 20, far: 0, holes: [[26, 30, 4.5]], yield: ctx.yield }); group.add(netBits.surface); await ctx.yield(); }
  // --- the terrace like a broad gondola, on one rope, and the chandelier beneath it over nothing
  const tYaw = opts.yaw ?? 0.3, TP = NP(0, 0), tRope = TERRACE_ROPE, T = kit.info('terrace'), cyw = Math.cos(tYaw), syw = Math.sin(tYaw);
  const tLocal = (lx, ly, lz) => [lx * cyw + lz * syw, ly, -lx * syw + lz * cyw];
  kit.add('terrace', { pivot: TP, rope: tRope, yaw: tYaw, tint: opts.awning || C.canvas[0], seed: rng() });
  const deckDepth = tRope - T.deck, keelDepth = tRope - T.under[1];
  kit.add('chandelierGrand', { pivot: TP, at: [0, -(keelDepth + 3.6), 0], rope: 3.6, scale: 2.2, motion: -0.22, seed: rng(), glow: 1 });
  const hw = (u) => T.B / 2 * Math.pow(Math.max(1 - Math.pow(Math.abs(u * 2 - 1), 2.3), 0), 0.6);
  for (let i = 0; i < 16; i++) {                                       // pots and lamps slung outboard of the rail, all the way round
    const u = 0.1 + 0.8 * ((i >> 1) + 0.5) / 8, sg = i % 2 ? 1 : -1, q = tLocal((u - 0.5) * T.L, 0, sg * (hw(u) + 0.55)), rope = rng.range(0.3, 1.4);
    const lamp = i % 5 === 2;
    kit.add(lamp ? 'lamp' : rng.chance(0.5) ? 'potLong' : 'pot', { pivot: TP, at: [q[0], -(deckDepth - 1.5 + rope), q[2]], rope, scale: lamp ? 1.6 : rng.range(1.1, 1.7), yaw: rng.range(0, TAU), seed: rng() });
  }
  for (const sg of [-1, 1]) {                                          // rope ladders from the net to both ends of the deck, a dumb-waiter at each side
    const q = tLocal(sg * (T.L / 2 - 2.2), 0, 0), P = NP(q[0], q[2]);
    kit.add('ladderLong', { pivot: P, at: [0, 0, 0], rope: 0, scale: (deckDepth + (TP[1] - P[1]) * -1) / 24 * 1.0, yaw: tYaw + Math.PI / 2, seed: rng() });
    const d = tLocal(sg * 4.5, 0, -sg * (T.B / 2 + 1.6)), D = NP(d[0], d[2]);
    kit.add('dumbWaiter', { pivot: D, rope: deckDepth - 1.2, motion: 0.82, yaw: tYaw, seed: rng() });
    // daily life for scale: a basket going up and down beside each ladder, washing hung out over the rail
    const b = tLocal(sg * (T.L / 2 - 4.4), 0, sg * 1.3), B = NP(b[0], b[2]);
    kit.add('basket', { pivot: B, rope: deckDepth - 2.5, scale: 1.5, tint: C.canvas[sg > 0 ? 3 : 5], motion: 0.8, seed: rng() });
    const w = tLocal(sg * T.L * 0.2, 0, -sg * (hw(0.5 + sg * 0.2) + 0.9));
    kit.add('laundryB', { pivot: TP, at: [w[0], -(deckDepth - 2.4), w[2]], rope: 0, yaw: tYaw, scale: 1.3, seed: rng() });
  }
  await ctx.yield();
  // --- rings of sack-houses of many sizes at different depths round it
  const inTerrace = (dx, dz, r) => { const lx = dx * cyw - dz * syw, lz = dx * syw + dz * cyw; return Math.abs(lx) < T.L / 2 + r + 1.5 && Math.abs(lz) < T.B / 2 + r + 1.5; };
  const strings = [], placed = [];
  // the terrace hangs in a clearing of its own: along both its sides only the net's short fringe hangs, and the
  // houses gather at its two ends and beyond the clearing
  const inSlot = (dx, dz) => { const lx = dx * cyw - dz * syw, lz = dx * syw + dz * cyw; return Math.abs(lx) < T.L / 2 + 5 && Math.abs(lz) < T.B / 2 + 22; };
  const tryString = (dx, dz, o) => {
    if (inSlot(dx, dz)) { if (o.kind !== 'solo') return null; o = { ...o, depth: Math.min(o.depth, 9) }; }
    const rr = o.kind === 'big' ? 5.5 : o.kind === 'gondola' ? 7 : o.kind === 'house' ? 3.4 : 1.8;
    if (inTerrace(dx, dz, rr * 0.8)) return null;
    for (const p of placed) if (Math.hypot(p[0] - dx, p[1] - dz) < p[2] + rr) return null;
    const res = hangString(kit, rng, NP(dx, dz), { clear, lane, tint: opts.tint, ...o });
    if (res && res.length) { placed.push([dx, dz, rr]); strings.push(...res); }
    return res;
  };
  const ringOf = (r0, r1, n, kinds, depth) => { for (let i = 0, tries = 0; i < n && tries < n * 12; tries++) { const a = rng.range(0, TAU), r = rng.range(r0, r1); if (tryString(Math.cos(a) * r, Math.sin(a) * r, { kind: rng.pick(kinds), depth: depth() })) i++; } };
  ringOf(20, 30, Math.round(3 * den), ['big'], () => rng.range(34, 46));
  ringOf(16, 27, Math.round(10 * den), ['house', 'house', 'small'], () => rng.range(22, 50));
  await ctx.yield();
  ringOf(27, 38, Math.round(4 * den), ['big', 'gondola'], () => rng.range(30, 44));
  ringOf(25, 38, Math.round(18 * den), ['house', 'house', 'small', 'solo'], () => rng.range(16, 44));
  await ctx.yield();
  ringOf(36, 48, Math.round(24 * den), ['house', 'small', 'small', 'solo', 'solo'], () => rng.range(10, 34));
  ringOf(10, 46, Math.round(18 * den), ['solo'], () => rng.range(8, 40));
  await ctx.yield();
  // --- children's trapezes and rings, showers trickling into the void, hammocks: under the nearest houses
  const houses = strings.filter((s) => /^(sack|big)/.test(s.name));
  for (let i = 0; i < houses.length; i++) {
    const h = houses[i], piv = [h.top[0], h.top[1] + (h.depth - h.info.h * h.sc), h.top[2]];
    const r = rng();
    const name = i < 3 ? 'trapeze' : i < 5 ? 'rings' : i < 8 ? 'shower' : r < 0.2 ? 'hammock' : r < 0.3 ? 'trapeze' : null;
    if (!name) continue;
    const info = kit.info(name), rope = rng.range(1.2, 3), a = rng.range(0, TAU), dx = Math.cos(a) * h.info.R * h.sc * 0.5, dz = Math.sin(a) * h.info.R * h.sc * 0.5, top = h.depth - h.info.H * h.sc * 0.2 + rope;
    if (clear && !clear(piv[0] + dx, piv[1] - top - info.h * 0.5, piv[2] + dz, info.h * 0.5 + 1)) continue;
    if (lane && !reachClear(info, lane, piv, dx, dz, top, rope, 1, name === 'trapeze' ? 0.5 : name === 'rings' ? 0.3 : 0)) continue;
    kit.add(name, { pivot: piv, at: [h.top[0] - piv[0] + dx, -top, h.top[2] - piv[2] + dz], rope, yaw: rng.range(0, TAU), swing: name === 'trapeze' ? 0.5 : name === 'rings' ? 0.3 : 0, seed: rng() });
  }
  // --- a cable car crossing just north of the terrace (standalone only: the world strings its own cables)
  let car = null;
  if (own) {
    const A = NP(-56, 30), B = NP(56, 6); A[1] -= 14; B[1] -= 22;
    car = makeCableCar(kit, A, B, 7, { tint: C.canvas[2] }); group.add(car.mesh);
  }
  if (own) group.add(await kit.finish());
  const centre = new THREE.Vector3(TP[0], TP[1] - deckDepth + 3, TP[2]);
  return {
    object: group, radius: 30, height: 64, center: own ? new THREE.Vector3(0, 34, 0) : centre, ground: false,
    kit, net, strings, car,
    anchors: { terrace: centre, hang: new THREE.Vector3(TP[0], TP[1], TP[2]), deckDepth, keelDepth, chandelier: new THREE.Vector3(TP[0], TP[1] - keelDepth - 8, TP[2]), radius: 48 },
    update(dt, time, camera) { if (own) { kit.update(dt, time, camera); if (car) car.place(0.5 + 0.48 * Math.sin(time * 0.09)); } },
    dispose() {},
  };
}

// ============================================================ the face of the rock (round 2)
// The two mountains are looked at from 30 to 600 m. The kit's terrain material carries the ground up close; this adds
// what a crag shows from afar, all of it a solid texture in world space, so nothing stretches whatever the slope:
// level beds with ledges, two sets of upright joints that cut the beds into blocks (each block its own tone and its
// own facet to the light), ribs and gullies down the fall line, snow lying on the ledges and in the gullies, mist at
// the foot. faceRock(material, o) wraps the kit material's shader once, in build().
const ROCK_PARS = /* glsl */`
uniform vec4 uCitySnow;   // ledge snow from (m), full by (m), open snow from (m), full by (m)
uniform vec4 uCityFoot;   // mist full below (m), none above (m), amount, relief of the face
uniform vec3 uCityMist, uCityFill, uCityFillDir, uCityLampCol;
uniform vec4 uCityLamp;   // where the lamps of the anchorage hang (m), and how far their light reaches (m)
vec3 gCityN = vec3(0.); float gCityAO = 1., gCityFoot = 0., gCityFillK = 1., gCityLampK = 0., gCitySun = 1., gCityCrag = 0., gCityBounceK = 0.;
uniform vec3 uCityBounce;
uniform float uCityShadeG[32]; uniform vec4 uCityShadeP; uniform vec2 uCityShadeQ;      // the first mountain's shadow (see sunShade in the kit's shaders)
float citySun(vec3 p){
  float k = clamp((-p.x * uCityShadeP.y + p.z * uCityShadeP.x - uCityShadeQ.x) * uCityShadeP.w, 0., 30.999);
  int i = int(floor(k));
  float H = (p.x * uCityShadeP.x + p.z * uCityShadeP.y) * uCityShadeP.z + mix(uCityShadeG[i], uCityShadeG[i + 1], k - float(i));
  return smoothstep(-uCityShadeQ.y, uCityShadeQ.y, p.y - H);
}
float cityHash(vec3 p) { return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
// a family of parallel cuts one unit apart: x = how far into the dark of the cut, y = which side of it (-1..1)
vec2 cityCut(float c, float wide, float fw) {
  float f = fract(c) - .5, d = .5 - abs(f);
  return vec2((1. - smoothstep(wide * .35, wide + fw + 1e-4, d)) * (1. - smoothstep(.14, .5, fw)), -sign(f) * (1. - smoothstep(0., wide * 3. + fw + 1e-4, d)));
}
`;
const ROCK_MAIN = /* glsl */`
{ vec3 wp = vTWorld; vec3 n0 = normalize(vTNormal);
  vec3 aw = abs(n0); aw *= aw; aw *= aw; aw /= max(aw.x + aw.y + aw.z, 1e-4);
  float face = 1. - smoothstep(.74, .94, n0.y);                       // the steep rock; level ground keeps the kit's look
  float sinB = sqrt(clamp(1. - n0.y * n0.y, .03, 1.));
  // ---- ribs and gullies down the fall line (side projections drawn out in height), and a middle layer at 40 m
  const vec2 sB = vec2(1. / 118., 1. / 310.);
  vec4 bx = texture2D(tDetail, wp.zy * sB + vec2(.13, .71)), bz = texture2D(tDetail, wp.xy * sB + vec2(.57, .29)), by = texture2D(tDetail, wp.xz * (1. / 150.));
  float hB = bx.r * aw.x + by.r * aw.y + bz.r * aw.z;
  vec3 gB = aw.x * vec3(0., (bx.b - .5) * .38, bx.g - .5) + aw.y * vec3(by.g - .5, 0., by.b - .5) + aw.z * vec3(bz.g - .5, (bz.b - .5) * .38, 0.);
  const float sM = 1. / 43.;
  vec4 mx = texture2D(tDetail, wp.zy * sM), mz = texture2D(tDetail, wp.xy * sM + vec2(.31, .47)), my = texture2D(tDetail, wp.xz * sM + vec2(.7, .2));
  float hM = mx.r * aw.x + my.r * aw.y + mz.r * aw.z, vein = mx.a * aw.x + my.a * aw.y + mz.a * aw.z;
  vec3 gM = aw.x * vec3(0., mx.b - .5, mx.g - .5) + aw.y * vec3(my.g - .5, 0., my.b - .5) + aw.z * vec3(mz.g - .5, mz.b - .5, 0.);
  float wob = (hB - .5) * 2.;
  // ---- beds: level, gently dipping, wavy, of uneven thickness; they fade before they get thinner than two pixels
  float sy = wp.y + wob * 4.5 + (hM - .5) * 1.6 + (wp.x * .8 + wp.z * .6) * .07 + 5. * sin(wp.x * .021 + wp.z * .017) + 3. * sin(wp.z * .052 - wp.x * .043 + 2.);      // the beds undulate slowly along the face
  float bs = sy * (1. / 8.5); bs += .3 * sin(bs * 2.1) + .12 * sin(bs * 4.7 + 1.3) + .05 * sin(bs * 9.3 + 4.) + .45 * sin(bs * .9 + wp.x * .013 + wp.z * .009);      // and pinch and swell
  float bW = fwidth(bs), bK = face * (1. - smoothstep(.14, .5, bW));
  float bi = floor(bs), bf = bs - bi, hb = cityHash(vec3(bi, 3., 7.)), hb2 = cityHash(vec3(bi, 11., 5.));
  // ---- joints: master joints through every bed (the buttresses), block joints set off from bed to bed
  vec2 jq = vec2(wp.x * .8 + wp.z * .6, -wp.x * .6 + wp.z * .8);
  vec2 jT = sqrt(clamp(1. - vec2(n0.x * .8 + n0.z * .6, -n0.x * .6 + n0.z * .8) * vec2(n0.x * .8 + n0.z * .6, -n0.x * .6 + n0.z * .8), .0, 1.));   // how squarely each set meets this face
  vec2 jK = smoothstep(.3, .62, jT) * face;
  vec2 jw = vec2(hM - .5, .5 - hM) * 3.2 + wob * 3.;
  // joints wander in slow bends (150 to 330 m long, 4 to 6 m to either side): no straight ruled lines and no scribble
  vec2 jS = vec2(6. * sin(wp.y * .043 + wp.x * .019) + 4. * sin(wp.z * .031 - wp.y * .019 + 1.7), 5. * sin(wp.y * .037 - wp.z * .023 + 4.1) + 4. * sin(wp.x * .029 + wp.y * .021 + .6));
  vec2 mj = (jq + jw * 1.7 + jS * 1.6 + wp.y * vec2(.2, -.15)) * vec2(1. / 37., 1. / 49.);
  vec2 sj0 = (jq + jw + jS) * vec2(1. / 8.4, 1. / 11.6), sjW = fwidth(sj0), sj = sj0 + vec2(hb, hb2) * 7.;
  sj += .3 * sin(sj * 2.3 + vec2(hb2, hb) * 40.) + .1 * sin(sj * 6.1 + 2.);
  vec2 mjW = fwidth(mj);
  vec2 m1 = cityCut(mj.x, .028 * jT.x, mjW.x), m2 = cityCut(mj.y, .024 * jT.y, mjW.y);
  vec2 s1 = cityCut(sj.x, .05 * jT.x, sjW.x), s2 = cityCut(sj.y, .045 * jT.y, sjW.y);
  float sK = bK * (1. - smoothstep(.12, .45, max(sjW.x, sjW.y))) * smoothstep(.46, .62, by.a);      // block joints only in patches: massive rock between
  s1.x *= step(.62, cityHash(vec3(floor(sj.x + .5), bi, 1.))); s2.x *= step(.62, cityHash(vec3(floor(sj.y + .5), bi, 2.)));   // not every joint is open
  s1.y *= step(.62, cityHash(vec3(floor(sj.x + .5), bi, 1.))); s2.y *= step(.62, cityHash(vec3(floor(sj.y + .5), bi, 2.)));
  vec3 idM = vec3(floor(mj), floor(bs * .25)), idS = vec3(floor(sj), bi);
  float tM2 = cityHash(idM), tS = cityHash(idS);
  vec3 facM = vec3(cityHash(idM + 3.1), cityHash(idM + 7.7), cityHash(idM + 1.3)) - .5, facS = vec3(cityHash(idS + 5.3), cityHash(idS + 9.1), cityHash(idS + 2.9)) - .5;
  vec3 axQ = vec3(.8, 0., .6), axR = vec3(-.6, 0., .8);
  float mK = smoothstep(.36, .56, bx.a * aw.x + by.a * aw.y + bz.a * aw.z);      // master joints open in zones of the face only (drawn out in height): massive rock between
  m1 *= mK; m2 *= mK;
  float cut = max(max(m1.x * jK.x, m2.x * jK.y), max(s1.x * jK.x, s2.x * jK.y) * sK * .8);
  // ---- seam under each bed, ledge on top of the bed below
  float dB = min(bf, 1. - bf);
  float hbS = cityHash(vec3(floor(bs + .5), 5., 1.));                 // one value per seam: some are deep, most are hairlines
  float seam = (1. - smoothstep(.02 * sinB, (.03 + .07 * hbS) * sinB + bW, dB)) * bK * (.25 + .75 * hbS * hbS);
  float hard = step(.6, hb);                                           // hard beds stand proud and carry the wide ledges
  float ledW = (.06 + .3 * hard * hb2) * sinB + bW * .5;
  float led = (1. - smoothstep(ledW * .55, ledW, bf)) * bK * (.2 + .8 * hard);
  // ---- AT THE SCALE OF A METRE (round 5): thin beds 1 to 3 m thick inside the great ones, each with a line of shade
  // under its lip and a lighter top; short upright cracks 2 to 4 m apart; the rock's own grain. Worked out in world
  // space in three dimensions (side projections weighted by the face's own normal: nothing is drawn out down the
  // face); every part fades before it gets thinner than two pixels, so it never shimmers
  const float sF = 1. / 6.7;
  vec4 fqx = texture2D(tDetail, wp.zy * sF + vec2(.37, .11)), fqz = texture2D(tDetail, wp.xy * sF + vec2(.83, .59)), fqy = texture2D(tDetail, wp.xz * sF + vec2(.21, .9));
  float hF = fqx.r * aw.x + fqy.r * aw.y + fqz.r * aw.z;
  vec3 gF = aw.x * vec3(0., fqx.b - .5, fqx.g - .5) + aw.y * vec3(fqy.g - .5, 0., fqy.b - .5) + aw.z * vec3(fqz.g - .5, fqz.b - .5, 0.);
  float ts = (sy + (hF - .5) * 1.1) * (1. / 1.9); ts += .28 * sin(ts * 1.7 + wp.x * .11) + .1 * sin(ts * 5.3 + 2.);
  float tW = fwidth(ts), tK = face * (1. - smoothstep(.12, .42, tW));
  float ti = floor(ts), tf = ts - ti, th = cityHash(vec3(ti, 17., 3.));
  float tSeam = (1. - smoothstep(0., .05 + .1 * th + tW, min(tf, 1. - tf))) * tK * (.3 + .7 * th);
  float tLed = (1. - smoothstep(.08, .2 + .25 * th + tW * .5, tf)) * tK * step(.45, th);
  vec2 cq0 = (jq + (hF - .5) * 1.6 + jw * .5) * vec2(1. / 2.7, 1. / 3.4), cW = fwidth(cq0), cq = cq0 + vec2(th, cityHash(vec3(ti, 2., 9.))) * 5.;
  vec2 c1 = cityCut(cq.x, .05 * jT.x, cW.x), c2 = cityCut(cq.y, .05 * jT.y, cW.y);
  float cK = tK * (1. - smoothstep(.1, .4, max(cW.x, cW.y)));
  c1 *= step(.55, cityHash(vec3(floor(cq.x + .5), ti, 4.))); c2 *= step(.6, cityHash(vec3(floor(cq.y + .5), ti, 6.)));
  float crack = max(c1.x * jK.x, c2.x * jK.y) * cK;
  // ---- gullies and ribs
  float gul = (1. - smoothstep(.27, .47, hB)) * face, rib = smoothstep(.52, .76, hB) * face;
  // ---- colour: each block its tone, some beds warm, some dark, lichen in the veins; cuts and gullies dark
  vec3 c = diffuseColor.rgb;
  float rk = face * (1. - gTSnow);
  c *= 1. + rk * (.26 * (tM2 - .5) + .13 * (tS - .5) * sK + .2 * (hb - .5) * bK);
  c = mix(c, c * vec3(1.2, 1.03, .78), rk * bK * .75 * smoothstep(.72, .8, hb2));
  c = mix(c, c * vec3(.6, .64, .72), rk * bK * .8 * (1. - smoothstep(.1, .16, hb2)));
  c = mix(c, c * vec3(.9, .96, .7), rk * .5 * smoothstep(.5, .9, vein) * smoothstep(.45, .6, hM));
  c *= 1. + rk * ((hM - .5) * .5 + .16 * rib);
  c *= 1. - rk * (.42 * cut + .34 * seam + .3 * gul);
  c *= 1. + rk * .3 * led * (1. - seam);
  c *= (1. - rk * (.3 * tSeam + .36 * crack)) * (1. + rk * (.22 * tLed * (1. - tSeam) + (hF - .5) * .34));
  // BY THE CRAG: the far crag is another stone than the first mountain, tawny: gold where the sun strikes it, and its
  // shade takes the sky's blue the more (a rule of the rock by which mountain it is, at every hour)
  gCityCrag = 1. - smoothstep(-340., -240., wp.z);
  c = mix(c, c * vec3(1.34, 1.08, .7), gCityCrag * .85);
  // ---- snow: on the ledges, in the gullies, and over everything that is not too steep high up
  float alt = wp.y + wob * 46. + (hM - .5) * 34.;
  float sLed = smoothstep(uCitySnow.x, uCitySnow.y, alt), sOpen = smoothstep(uCitySnow.z, uCitySnow.w, alt);
  float thr = .66 - .56 * sLed;
  float snL = led * step(.001, sLed) * smoothstep(thr, thr + .14, hM + (vein - .3) * .25) * smoothstep(-.25, .15, n0.y);
  float snG = (1. - smoothstep(.21, .37, hB)) * face * smoothstep(uCitySnow.x + 30., uCitySnow.y + 90., alt) * smoothstep(.38, .5, hM + .25 * sLed);
  float snO = sOpen * smoothstep(.12, .5, n0.y + (hM - .5) * .7 + (hB - .5) * .8 + .3 * sOpen);
  float snT = tLed * smoothstep(.56 - .4 * sLed, .7 - .4 * sLed, hF + (hM - .5) * .4) * (.3 + .7 * smoothstep(-60., 120., alt)) * smoothstep(-.25, .15, n0.y);      // snow lying on the thin beds' tops
  float snow = clamp(max(max(max(snL, snT), snG), snO), 0., 1.) * (1. - gTSnow);
  c = mix(c, uTSnow * mix(vec3(.74, .85, 1.04), vec3(1.), vTShade.x) * (1. + (hM - .5) * .14), snow);
  diffuseColor.rgb = c; gTSnow = max(gTSnow, snow);
  // ---- the light: every block turns its own facet to the sun, cuts are bevelled, ribs and gullies lean, ledges look up
  float rel = uCityFoot.w * rk * (1. - .85 * snow);
  gCityN = rel * (gB * 2.2 + gM * 1.3 + facM * .46 + facS * .3 * sK
    + axQ * (m1.y * .5 * jK.x + s1.y * .34 * jK.x * sK) + axR * (m2.y * .5 * jK.y + s2.y * .34 * jK.y * sK)
    + vec3(0., (seam * .6 - led * .75) * (.6 + .4 * hard), 0.)
    + gF * .95 + axQ * (c1.y * .3 * jK.x * cK) + axR * (c2.y * .3 * jK.y * cK) + vec3(0., tSeam * .5 - tLed * .6, 0.));
  gCityN.y -= .5 * snL * face;
  gCityAO = 1. - rk * (1. - snow) * (.34 * gul + .3 * cut + .25 * seam + .2 * tSeam + .24 * crack);
  gCityAO *= 1. + .25 * rk * rib;
  gCitySun = mix(1., citySun(wp), 1. - smoothstep(-260., -200., wp.z));      // the far crag only: the first mountain does not shade itself by this function
  // ---- the sky's bounce from the side away from the sun, and the lamps of the anchorage
  vec3 nW = normalize(n0 - gCityN);
  gCityFillK = (.62 + .38 * dot(nW, uCityFillDir)) * (.55 + .45 * gCityAO);
  gCityBounceK = gCityCrag * (.6 - .4 * nW.y) * (.45 + .55 * gCityAO);      // the cloud sea's light from below on the crag by the city
  vec3 dl = uCityLamp.xyz - wp; float d2 = dot(dl, dl) / (uCityLamp.w * uCityLamp.w);
  gCityLampK = (.35 + .65 * clamp(dot(nW, dl * inversesqrt(max(dot(dl, dl), 1e-4))), 0., 1.)) / ((1. + d2) * (1. + d2));
  // ---- the foot: one soft, level band of mist (its edge wanders gently along the face, never down it)
  gCityFoot = 1. - smoothstep(uCityFoot.x, uCityFoot.y, wp.y + (by.r - .5) * 44. + (my.r - .5) * 14.); gCityFoot *= gCityFoot * (3. - 2. * gCityFoot) * uCityFoot.z;
}
`;
export function faceRock(material, o = {}) {
  const uniforms = {
    uCitySnow: { value: new THREE.Vector4(...(o.snow || [10, 250, 150, 420])) },
    uCityFoot: { value: new THREE.Vector4(o.footLow ?? -250, o.footHigh ?? -120, o.footAmount ?? 0.9, o.relief ?? 1) },
    uCityMist: { value: new THREE.Color(o.mist ?? '#dfeaf6') },
    uCityFill: { value: new THREE.Color(o.fill ?? '#000000') }, uCityFillDir: { value: new THREE.Vector3(...(o.fillDir || [0, 1, 0])).normalize() },
    uCityLamp: { value: new THREE.Vector4(0, 0, 0, 1) }, uCityLampCol: { value: new THREE.Color(o.lampColor ?? '#000000') }, uCityBounce: { value: new THREE.Color(o.bounce ?? '#000000') },
    uCityShadeG: { value: o.shadeG || new Float32Array(32).fill(-1e5) }, uCityShadeP: { value: new THREE.Vector4(...(o.shadeP || [0, 1, 0.5, 0.025])) }, uCityShadeQ: { value: new THREE.Vector2(...(o.shadeQ || [-620, 5])) },
  };
  const kitCompile = material.onBeforeCompile;
  material.onBeforeCompile = (shader, renderer) => {
    kitCompile.call(material, shader, renderer);
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\n' + ROCK_PARS)
      .replace('float dR = mix(.5, tD.r, midF)', 'float dR = mix(.5, tD.r, midF * flatK)')
      .replace('#include <roughnessmap_fragment>', ROCK_MAIN + '\n#include <roughnessmap_fragment>')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = normalize(normal - (viewMatrix * vec4(gCityN, 0.)).xyz);')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n  reflectedLight.directDiffuse *= gCityAO * gCitySun; reflectedLight.directSpecular *= gCitySun; reflectedLight.indirectDiffuse *= .35 + .65 * gCityAO;\n  reflectedLight.indirectDiffuse += diffuseColor.rgb * uCityFill * gCityFillK;\n  reflectedLight.indirectDiffuse *= mix(vec3(1.), vec3(.8, .95, 1.24), gCityCrag * (1. - gTSnow)); reflectedLight.directDiffuse *= mix(vec3(1.), vec3(1.12, 1.02, .86), gCityCrag * (1. - gTSnow));\n  reflectedLight.indirectDiffuse += diffuseColor.rgb * (uCityLampCol * gCityLampK + uCityBounce * gCityBounceK);')
      .replace('#include <fog_fragment>', '#include <fog_fragment>\n  gl_FragColor.rgb = mix(gl_FragColor.rgb, uCityMist, gCityFoot);');
  };
  material.customProgramCacheKey = () => 'city-hung-below-its-net-rock-r5';
  return uniforms;
}
