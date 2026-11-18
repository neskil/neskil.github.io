// THE IRON TIDE
// A lacquer-black mirror sea of magnetic fluid under a sky of gold leaf. A chain of levitating lodestone
// barges drags a travelling range of liquid spikes toward the Crown (src/parts/iron-tide.js).
//
// The sea is a MIRROR: wherever it is not disturbed it gives the leaf sky back whole (squares, seams, tarnish), with
// the spikes, the barges and the Crown standing upside down in it, shaded as themselves; ripple rings run out from
// under every lodestone, and lacquer black shows only on the back of a ripple and in the images of dark things.
// The sky is a VAULT with one light in it: leaf squares large overhead and tiny at the horizon, a band of deeper
// bronze at its foot, a low white-gold disc ahead to one side; the leaf is brightest round it and tarnishes to red
// bronze away from it, and the mirror gives all of it back: a long path of light toward the eye, lacquer away from it.
// Far off other chains drag their own ranges toward the Crown, small dark shapes on the horizon line.
// Second colour: the field column on the Crown's axis (a teal shaft from the mirror through the Great Lodestone into the
// vault, its image in the sea, a cool pool round the Crown), verdigris low on the dark side of the vault, and every hull
// lit from below by the gold the mirror throws back (keel, ribs, port lights), so a slab overhead is never a black shape.
// The flight: arrival low over the mirror behind the last barge -> through the fresh teal bloom -> low beside the
// travelling range with a barge whole overhead -> in under the lead barge of the chain (lamps, hanging field lines,
// its slab overhead) -> rise for the wide reveal of the Crown and its reflection -> over the rim, looking down into
// the Crown past the barges moored there -> level across it at the Great Lodestone -> a banked turn-in past the harbour
// barge (a great slab with a hanging pagoda, moored high over the wall) with the sea falling away below -> the climbing half-turn up the field lines to the Great Lodestone and the portal beneath it.
//
// Layout (world space = hero space): the Crown stands at the origin, the camera flies toward -Z from
// z = 1650. The barge chain runs 18 m to starboard (+X) of the camera lane, the black-sand island lies
// to port. Everything keyed to the flight (chain travel, fog opening, the arm crossing, the rare field
// reversal) is driven by u; ambient motion runs on time.
//
// Variations (seed, ctx.vary): the sky has no hours, so its looks are metals: cold pale gold, red-gold
// leaf with white lamps, silver-leaf nocturne with blue-steel film. Weather: calm, iron rain (spikelets
// popping on the mirror), field storm (every bloom and needle leans, the dust arcs whip). Cast swaps:
// compass-eels or skimmer-rays, needle-birds or compass-jellies, the chain or one giant pagoda barge.
// Rare (ctx.vary.rare): a field reversal during the reveal: the Great Lodestone rolls over, every spike
// in the world drops flat for two seconds and springs back, and the needle-birds swing half a turn.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import {
  buildHero, IRON_TIDE_SKY_GLSL, IRON_TIDE_FOG_GLSL, IRON_TIDE_ARM_GLSL, IRON_TIDE_SPIRE_FRAG,
  IRON_TIDE_SOLID_VERT, IRON_TIDE_SOLID_FRAG, IRON_TIDE_FILING_FRAG, IRON_TIDE_RIBBON_FRAG,
} from '../parts/iron-tide.js';

const TAU = Math.PI * 2;
const NMAG = 10;
const SPACING = 9;            // bloom lattice spacing, metres
const FLOAT_Y = 20;           // barge slab centre is FLOAT_Y + 2 above the sea

const LOOKS = {
  gold: { palette: ['#EFE2B0', '#D9B95A', '#9A8440', '#D4D7DC', '#1B1A17', '#0A0A0C', '#2FD6C0'], lamp: '#2FD6C0', bole: '#5e1f10', tint: '#fff8e6', title: 'The Iron Tide' },
  rose: { palette: ['#F1D3B4', '#CF9468', '#8C5438', '#E6DAD2', '#1C1716', '#0B0909', '#35D8C4'], lamp: '#F4F6FF', bole: '#4a1420', tint: '#fff1e8', title: 'The Iron Tide, Red-Gold Leaf' },
  silver: { palette: ['#C9D1DC', '#66748C', '#49556B', '#F1F5FB', '#15181D', '#08090C', '#5AA6F0'], lamp: '#8CC4FF', bole: '#101a36', tint: '#eef3ff', title: 'The Iron Tide, Silver Nocturne' },
};

// ---------------------------------------------------------------- shared GLSL
// Summed field of the barges. uMag[k] = (x, z, strength, size); strength < 0 = moored (symmetric bloom).
// The falloff is steep on the side a barge is travelling toward (-Z) and long behind it, so each bloom
// reads as a wake. Returns (field, sharpness, freshness, 0); capM = height limit under a slab.
const MAGNET_GLSL = /* glsl */`
uniform vec4 uMag[${NMAG}];
uniform float uField;
vec4 itBloom(vec2 p, out float capM, out float qMin){
  float F = 0.0, S = 0.0, fr = 0.0;
  capM = 200.0; qMin = 1000.0;
  for (int k = 0; k < ${NMAG}; k++) {
    vec4 m = uMag[k];
    float st = abs(m.z);
    float sym = step(m.z, 0.0);
    vec2 d = (p - m.xy) / max(m.w, 0.1);
    float ahead = -d.y, lat = d.x;
    float gl = exp(-lat * lat / 2700.0);
    float ef = ahead / 36.0, eb = max(-ahead, 0.0) / mix(42.0, 30.0, sym);
    float lon = ahead > 0.0 ? exp(-ef * ef) : exp(-eb * sqrt(eb));
    float h = st * gl * lon;
    float sk = mix(ahead > -8.0 ? 1.0 : max(0.6, exp((ahead + 8.0) / 80.0)), 0.85, sym);
    F += h; S += h * sk;
    float e2 = (ahead - 33.0) / 10.0;
    fr += st * gl * exp(-e2 * e2) * (1.0 - sym);
    float q = length(vec2(lat, ahead * 0.5));
    if (st > 0.001) { capM = min(capM, mix(8.0 * m.w, 200.0, smoothstep(7.0, 24.0, q))); qMin = min(qMin, q * m.w); }
  }
  return vec4(F, S / max(F, 1e-4), fr, 0.0);
}
`;

const SKY_VERT = /* glsl */`
varying vec3 vD;
void main(){
  vD = position;
  vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  if (abs(p.w) < 1e-4) p.w = 1e-4;
  gl_Position = p;
}
`;
const SKY_FRAG = /* glsl */`
varying vec3 vD;
${IRON_TIDE_SKY_GLSL}
void main(){
  vec3 d = normalize(vD);
  vec3 col = itSky(d, 1.0);
  if (d.y < 0.0) col *= 0.9;
  gl_FragColor = vec4(col, 1.0);
}
`;

// One flat mirror plane. Reflects the leaf sky with fresnel; hexagonal dimples where a field is weak
// but not zero (round the Crown's rim and at the edges of each bloom), a soft dark patch under every
// slab, and in the iron rain a spikelet that rises and sinks wherever a drop lands.
const SEA_VERT = /* glsl */`
varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const SEA_FRAG = /* glsl */`
uniform vec3 uBlack, uChrome, uTeal;
uniform float uRim, uLatK, uDir, uBloomK, uRain, uTime, uLaneX, uBeam;
varying vec3 vW;
${IRON_TIDE_SKY_GLSL}
${IRON_TIDE_ARM_GLSL}
${IRON_TIDE_FOG_GLSL}
${MAGNET_GLSL}
vec2 hexGrad(vec2 p, float k){
  vec2 k1 = vec2(1.0, 0.0) * k, k2 = vec2(0.5, 0.8660254) * k, k3 = vec2(-0.5, 0.8660254) * k;
  return -(k1 * sin(dot(k1, p)) + k2 * sin(dot(k2, p)) + k3 * sin(dot(k3, p)));
}
void main(){
  vec3 V = normalize(cameraPosition - vW);
  vec2 p = vW.xz;
  float r = length(p);
  float fwp = max(fwidth(p.x), fwidth(p.y));
  vec2 g = vec2(0.0);
  // the Crown's lattice runs out past the rim
  float mask = (1.0 - smoothstep(uRim - 20.0, uRim + 190.0, r)) * uField;
  vec2 arm = itArm(atan(p.x, p.y + 1e-4) * uDir, r);
  float fw = fwp * uLatK;
  g += hexGrad(p, uLatK) * mask * mask * (0.12 + 0.75 * arm.x) / (1.0 + fw * fw * 6.0);
  // the blooms' weak fringe
  float capM, qMin;
  vec4 b = itBloom(p, capM, qMin);
  float fringe = smoothstep(0.004, 0.05, b.x) * (1.0 - 0.5 * smoothstep(0.1, 0.4, b.x)) * uField;
  // under a bloom the whole surface is drawn up and ruffled, and gives the sky back: a pool of gold on the lacquer
  float pool = smoothstep(0.02, 0.5, b.x) * clamp(uField, 0.0, 1.0);
  float fb = fwp * uBloomK;
  g += hexGrad(p - vec2(uLaneX, 0.0), uBloomK) * fringe * 0.16 / (1.0 + fb * fb * 6.0);
  // iron rain: every drop raises a spikelet that sinks again
  vec2 q = p / 1.9;
  vec2 id = floor(q), f = fract(q) - 0.5;
  float h = itHash(id);
  float ph = fract(uTime * (0.7 + 0.5 * h) + h * 9.0);
  vec2 dd = f - (vec2(itHash(id + 1.7), itHash(id + 5.3)) - 0.5) * 0.5;
  float fq = fwp / 1.9;
  float drop = exp(-dot(dd, dd) * 130.0) * sin(ph * 3.14159) * step(h, 0.7) * uRain / (1.0 + fq * fq * 40.0);
  g += dd * drop * 34.0;
  // field reversal: the fluid the Crown has let go of rings outward across the mirror
  float calm = 1.0 - clamp(uField, 0.0, 1.0);
  float rp = r * 0.12 - uTime * 6.0;
  float fr2 = fwp * 0.12;
  float ringK = calm / (1.0 + fr2 * fr2 * 6.0);
  g += (p / max(r, 1.0)) * (cos(rp) * 0.12 + cos(rp * 3.7 + 1.3) * 0.04) * ringK;
  float crest = 0.5 + 0.5 * sin(rp);
  // travelling ripple rings: every lodestone that passes tugs the mirror, and the rings run out from under it
  vec2 gr = vec2(0.0);
  for (int k = 0; k < ${NMAG}; k++) {
    vec4 m = uMag[k];
    vec2 dv = p - m.xy;
    float dl = length(dv);
    float ph = dl * 0.5 - uTime * 2.6 + float(k) * 1.7;
    float amp = abs(m.z) * m.w * exp(-dl / 150.0) * smoothstep(3.0, 26.0, dl);
    gr += dv / max(dl, 1.0) * (sin(ph) + 0.35 * sin(ph * 2.3 + 1.0)) * amp;
  }
  float fwr = fwp * 0.5;
  gr *= 0.05 / (1.0 + fwr * fwr * 5.0);
  // and a long slow swell, so the leaf squares in the mirror are never quite still
  gr += vec2(sin(p.y * 0.043 + uTime * 0.5 + sin(p.x * 0.021) * 2.0), cos(p.x * 0.037 - uTime * 0.4)) * 0.006 / (1.0 + fwp * fwp * 0.02);
  g += gr;
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  float F = clamp(itSeaFresnel(dot(N, V)) + crest * crest * crest * ringK * 0.5 + pool * 0.2, 0.0, 1.0);
  vec3 R = reflect(-V, N);
  R.y = abs(R.y) + 1e-4;
  // the mirror gives back the whole leaf sky, squares and seams and all
  // (the big squares of the high vault come back soft at the camera's feet, so ripples never marble them)
  vec3 sky = itSkyMirror(R, mix(1.0, 0.4, smoothstep(0.3, 0.8, R.y))) * 0.96;
  // the one light lays a long path on the mirror, from the horizon under it toward the eye, broken by every ripple
  vec2 sxz = normalize(uSkySun.xz + vec2(0.0, -1e-4));
  float daz = 1.0 - dot(normalize(R.xz + vec2(1e-5, 0.0)), sxz);
  float glit = 0.6 + 0.4 * sin(p.x * 0.83 + p.y * 1.27 + uTime * 2.3 + sin(p.y * 0.21 - uTime * 0.9) * 3.0) / (1.0 + fwp * fwp * 3.0);
  float sunPath = (exp(-daz * 1500.0) * 1.5 + exp(-daz * 110.0) * 0.3) * exp(-R.y * 2.4) * glit;
  sky += vec3(1.0, 0.9, 0.68) * sunPath;
  // away from the light the mirror keeps less of the sky: lacquer
  // (a broad river of gold under the light, lacquer either side of it, even at a glance)
  F *= mix(0.36, 1.0, itNearSun(R)) * mix(1.0, 0.6, smoothstep(0.15, 0.7, R.y)) * mix(0.34, 1.0, exp(-daz * 4.5));
  // lacquer shows on the back of a ripple, the side that leans away from the eye
  float back = dot(gr, normalize(V.xz + vec2(1e-5, 0.0)));
  F *= 1.0 - 0.6 * smoothstep(0.012, 0.07, -back);
  // no cast shadows in this world except the soft dark patch under a levitating slab
  sky *= 1.0 - 0.3 * exp(-qMin * qMin / 260.0);
  vec3 col = uBlack * 0.6 * (1.0 - F) + sky * F;
  // the lacquer carries the leaf: what the mirror does not keep of the vault (1 - F) still gives back the leaf's seams and
  // its glints whole, thin gold lines and single lit squares on the black, by the same reflected ray (so every ripple
  // breaks them like the rest of the image, and the high vault comes back soft at the feet as it does above); the flat
  // tone between them stays lacquer. One rule on every bearing: where the mirror keeps the vault (F near 1) it adds nothing
  vec2 leafLn = itLeafLines(R) * mix(1.0, 0.4, smoothstep(0.3, 0.8, R.y));
  col += mix(uSkyHor, uSkyTop, 0.62) * (leafLn.x + leafLn.y) * (1.0 - F) * (1.0 - 0.3 * exp(-qMin * qMin / 260.0));
  // the fresh film lights the mirror round the feet of the spikes it stands on
  col += uTeal * (clamp(b.z, 0.0, 1.0) * 0.3 * pool + arm.y * mask * mask * 0.2) * clamp(uField, 0.0, 1.0);
  col += uChrome * drop * drop * 0.5;
  // the field column on the Crown's axis lays a cool pool on the mirror round the Crown, broken by every ripple
  col += uTeal * (0.5 * exp(-r * r / 160000.0) + 0.1 * exp(-r / 800.0)) * (0.55 + 0.45 * glit) * clamp(uField, 0.0, 1.0) * uBeam * mix(0.35, 1.0, F);
  // far off the mirror goes into the haze at the foot of the vault in that direction: bronze and verdigris on the dark
  // side, bright under the light, so the horizon is a line in the picture and never a blank pale band
  #ifdef USE_FOG
    vec3 foot = itSky(normalize(vec3(-V.x, 0.035, -V.z) + vec3(1e-5, 0.0, 0.0)), 0.0);
    col = mix(col, mix(fogColor, min(foot, vec3(1.6)), 0.7), itFog());
  #endif
  gl_FragColor = vec4(col, 1.0);
}
`;

// Bloom spikes: instanced flared cones on a fixed hex lattice; height, sharpness and freshness from the
// magnet sum. Zero-height cells collapse to nothing. Shaded by the Crown's own spire fragment shader.
const SPIKE_VERT = /* glsl */`
attribute vec4 aC;   // x, z, seed, height limit from the camera corridor
uniform float uFlip, uPixH, uTime, uHmax, uR0;
uniform vec3 uLean;  // xz direction, y amount
varying vec3 vN, vW;
varying float vFresh, vT, vS, vSeed;
#include <fog_pars_vertex>
${MAGNET_GLSL}
float prof(float t, float s){
  float dome = 0.88 * sqrt(max(1.0 - t * t, 0.0)) + 0.12 * exp(-t * 14.0);
  float nd = 0.52 * pow(max(1.0 - t, 0.0), 3.4) + 0.48 * (1.0 - t) * exp(-t * 10.0);
  return mix(dome, nd, s);
}
void main(){
  float t = position.y;
  float a = 0.5235988 + position.x * 6.2831853;
  float capM, qMin;
  vec4 b = itBloom(aC.xy, capM, qMin);
  float rnd = 0.6 + 0.4 * fract(aC.z * 7.31);
  float breathe = 1.0 + 0.08 * sin(uTime * (1.1 + aC.z) + aC.z * 40.0);
  float H = uHmax * pow(min(b.x, 1.3), 1.35) * rnd * breathe - 1.3;
  H = min(min(H, capM), aC.w) * uField;
  float live = step(0.3, H);
  H = max(H, 0.3);
  float s = clamp(b.y * (0.62 + 0.38 * smoothstep(1.5, 13.0, H)), 0.0, 1.0);
  float fresh = clamp(b.z * 0.85, 0.0, 1.0) * smoothstep(0.5, 6.0, H) * clamp(uField, 0.0, 1.0);
  float t0 = min(t, 0.985);
  float R0 = uR0 * mix(0.42, 1.0, smoothstep(2.0, 17.0, H)) * smoothstep(0.3, 2.5, H);
  float r = prof(t, s) * R0;
  float dr = (prof(t0 + 0.012, s) - prof(t0, s)) * R0 / 0.012;
  float hx = 0.8660254 / cos(mod(a + 0.5235988, 1.0471976) - 0.5235988);
  r *= mix(hx, 0.9, smoothstep(0.0, 0.22, t));
  vec3 dir = vec3(sin(a), 0.0, cos(a));
  vec3 lp = vec3(aC.x, t * H, aC.y) + dir * r;
  lp.xz += uLean.xz * (uLean.y * t * t * H);
  vec3 n = normalize(vec3(dir.x * H, -dr, dir.z * H) + vec3(0.0, 1e-4, 0.0));
  lp.y *= uFlip; n.y *= uFlip;
  vec4 wp = vec4(lp, 1.0);
  vec4 cp0 = projectionMatrix * viewMatrix * wp;
  float pix = cp0.w / (projectionMatrix[1][1] * uPixH * 0.5);
  float want = max(r, 0.45 * pix * step(t, 0.999));
  wp.xyz += dir * (want - r);
  if (live < 0.5) wp.xyz = vec3(aC.x, -3.0, aC.y);
  vW = wp.xyz;
  vN = n;
  vFresh = fresh; vT = t; vS = s; vSeed = aC.z;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

// Black sand: matte, wind-combed, with a few chrome grains. uFlip = -1 draws the mirror image.
const SAND_VERT = /* glsl */`
uniform float uFlip;
varying vec3 vN, vW;
#include <fog_pars_vertex>
void main(){
  vec3 lp = position; lp.y *= uFlip;
  vec4 wp = modelMatrix * vec4(lp, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * vec3(normal.x, normal.y * uFlip, normal.z));
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const SAND_FRAG = /* glsl */`
uniform vec3 uBlack, uMatte, uChrome;
uniform float uFlip, uTime;
varying vec3 vN, vW;
${IRON_TIDE_SKY_GLSL}
${IRON_TIDE_FOG_GLSL}
void main(){
  if (vW.y * uFlip < 0.03) discard;
  vec3 V = normalize(cameraPosition - vW);
  vec3 N = normalize(vN);
  float up = abs(N.y);
  float hemi = 0.3 + 0.7 * (up * 0.5 + 0.5);
  float fwr = max(fwidth(vW.x), fwidth(vW.z));
  float rip = sin(vW.x * 2.1 + sin(vW.z * 0.31) * 2.4 + abs(vW.y) * 5.0);
  rip *= 1.0 / (1.0 + fwr * fwr * 6.0);
  vec3 col = uMatte * (2.3 + 0.9 * rip) * hemi * uSkyHor;
  float nv = clamp(abs(dot(N, V)), 0.0, 1.0);
  col += itSky(reflect(-V, N), 0.0) * 0.07 * pow(1.0 - nv, 3.0);
  vec2 gid = floor(vW.xz * 5.0);
  float gh = itHash(gid);
  float tw = step(0.988, gh) * pow(0.5 + 0.5 * sin(uTime * (2.0 + gh * 5.0) + gh * 80.0 + dot(V.xz, vec2(31.0, 17.0))), 6.0);
  col += uChrome * tw * 0.9 / (1.0 + fwr * fwr * 30.0);
  if (uFlip < 0.0) {
    float F = itSeaFresnel(abs(V.y));
    vec3 behind = itSky(vec3(V.x, abs(V.y), V.z) * -1.0, 0.0);
    gl_FragColor = vec4(itMirrorFog(col * 0.6, vec3(0.0), behind, uBlack * 0.6, F, cameraPosition.y, vW.y), 1.0);
  } else {
    gl_FragColor = vec4(itApplyFog(col), 1.0);
  }
}
`;

// Filing-murmurations: dust arcs from barge to barge (chain-local space; the whole arcade travels
// with the chain). A = (z0, z1, height, plane angle), Y = (y0, y1).
const CHAIN_ARC_GLSL = /* glsl */`
uniform float uWhip, uTime;
vec3 chArc(float u, vec4 A, vec2 Y, float seed){
  float sn = pow(max(sin(u * 3.14159265), 0.0), 0.8);
  vec3 p = vec3(0.0, mix(Y.x, Y.y, u), mix(A.x, A.y, u));
  p.x += sin(A.w) * A.z * sn; p.y += cos(A.w) * A.z * sn;
  p.x += sin(uTime * 1.3 + u * 5.0 + seed * 6.0) * uWhip * sn * 14.0;
  p.y += cos(uTime * 1.7 + u * 4.0 + seed * 9.0) * uWhip * sn * 5.0;
  return p;
}
`;
const DUST_VERT = /* glsl */`
attribute vec4 aA;
attribute vec2 aY;
attribute vec4 aB;   // phase, speed, size, seed
uniform float uPixH;
varying vec2 vUv;
varying float vI, vSeed;
#include <fog_pars_vertex>
${CHAIN_ARC_GLSL}
void main(){
  float u = fract(aB.x + uTime * aB.y);
  float sd = aB.w;
  vec3 p = chArc(u, aA, aY, floor(sd * 8.0) / 8.0);
  vec3 j = vec3(sin(sd * 91.7 + uTime * 0.6), sin(sd * 57.3 + uTime * 0.45), cos(sd * 33.1 + uTime * 0.5));
  p += j * (0.8 + 3.2 * fract(sd * 7.31)) * sin(u * 3.14159);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  float pix = -mvPosition.z / (projectionMatrix[1][1] * uPixH * 0.5);
  float size = max(aB.z, 1.25 * pix);
  float dim = clamp((aB.z * aB.z) / (size * size), 0.2, 1.0);
  mvPosition.xy += position.xy * size;
  vUv = position.xy;
  float tw = pow(0.5 + 0.5 * sin(uTime * (5.0 + 9.0 * fract(sd * 3.7)) + sd * 100.0), 5.0);
  vI = (0.3 + 2.6 * tw) * dim * smoothstep(0.0, 0.07, u) * smoothstep(1.0, 0.93, u) * smoothstep(0.6, 4.0, -mvPosition.z);
  vSeed = sd;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const ARCLINE_VERT = /* glsl */`
attribute vec4 aA;
attribute vec2 aY;
attribute vec3 aU;   // u along the arc, side, seed
uniform float uPixH;
varying float vU, vSide, vSeed;
#include <fog_pars_vertex>
${CHAIN_ARC_GLSL}
void main(){
  vec3 p = chArc(aU.x, aA, aY, aU.z), p2 = chArc(aU.x + 0.012, aA, aY, aU.z);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 tg = normalize(p2 - p + vec3(0.0, 0.0, 1e-5));
  vec3 vd = normalize(cameraPosition - wp.xyz);
  vec3 sdir = normalize(cross(tg, vd) + vec3(1e-5, 0.0, 0.0));
  vec4 cp0 = projectionMatrix * viewMatrix * wp;
  float pix = cp0.w / (projectionMatrix[1][1] * uPixH * 0.5);
  wp.xyz += sdir * aU.y * max(0.3, 1.0 * pix);
  vU = aU.x; vSide = aU.y; vSeed = aU.z;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

// Compass-eels (chrome ribbons leaping from spike tip to spike tip) or skimmer-rays (uRay = 1).
const EEL_VERT = /* glsl */`
attribute vec4 aE;   // lateral offset, start z, speed, seed
attribute vec2 aF;   // hops in a chain, lane wobble
uniform float uTime, uPixH, uRay, uHop, uBaseY, uHopH, uBody;
varying float vS, vSide, vSeed, vY;
#include <fog_pars_vertex>
vec3 eelAt(float ph, float N){
  // eels leap; rays lift off and settle over three hops, so their kite stays near level
  float ew = mix(0.5, 3.0, uRay);
  float env = smoothstep(0.0, ew, ph) * (1.0 - smoothstep(N - ew, N, ph));
  float y = (uBaseY + uHopH * pow(abs(sin(ph * 3.14159265)), 0.8)) * env - 3.0 * (1.0 - env);
  return vec3(aE.x + sin(ph * 0.9 + aE.w * 20.0) * aF.y, y, aE.y - ph * uHop);
}
void main(){
  float N = aF.x, s = position.x, side = position.y;
  float ph = mod(uTime * aE.z + aE.w * 37.0, N + 2.0) - 1.0 - s * uBody;
  vec3 p = eelAt(ph, N), p2 = eelAt(ph + 0.03, N);
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 tg = normalize(p2 - p + vec3(0.0, 0.0, -1e-5));
  vec3 vd = normalize(cameraPosition - wp.xyz);
  // a ray keeps its wings level even when it leaps, so it is always a kite and never a blade on edge
  vec3 th = normalize(vec3(tg.x, 0.0, tg.z) + vec3(0.0, 0.0, -1e-4));
  vec3 sdir = normalize(mix(cross(tg, vd), cross(th, vec3(0.0, 1.0, 0.0)), uRay) + vec3(1e-5, 0.0, 0.0));
  vec4 cp0 = projectionMatrix * viewMatrix * wp;
  float pix = cp0.w / (projectionMatrix[1][1] * uPixH * 0.5);
  float sn = max(sin(s * 3.14159265), 0.0);
  float w = mix(max(0.34 * sqrt(sn) + 0.05, 0.8 * pix), 3.0 * sn * sqrt(sn) + 0.04, uRay);
  wp.xyz += sdir * side * w;
  wp.y += uRay * abs(side) * sin(uTime * 3.2 + aE.w * 30.0 - s * 2.0) * w * 0.45;
  vS = s; vSide = side; vSeed = aE.w; vY = wp.y;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const EEL_FRAG = /* glsl */`
uniform vec3 uBlack, uChrome, uSkyHor, uTeal;
uniform float uTime, uRay;
varying float vS, vSide, vSeed, vY;
${IRON_TIDE_FOG_GLSL}
void main(){
  if (vY < 0.05) discard;
  float glint = pow(0.5 + 0.5 * sin(vS * 18.0 - uTime * 9.0 + vSeed * 40.0), 6.0);
  float edge = abs(vSide);
  vec3 eel = uBlack * 0.4 + uSkyHor * 0.45 * (1.0 - edge * edge) + uChrome * (0.3 + 1.5 * glint) * (1.0 - 0.6 * edge);
  vec3 ray = uBlack * 0.55 + uSkyHor * 0.05 * (1.0 - edge) + (uChrome * 0.6 + uSkyHor * 0.7) * smoothstep(0.8, 1.0, edge)
    + uTeal * (1.4 * glint + 0.25) * (1.0 - smoothstep(0.0, 0.16, edge));
  gl_FragColor = vec4(itApplyFog(mix(eel, ray, uRay)), 1.0);
}
`;

// Needle-birds or compass-jellies: sheets of hoverers that all point the same way. A bird is a lacquer-black compass
// needle (raised spine, keel, swept vanes, tail fin) with a bright edge and a teal marked end; a jelly is a dark glossy
// bell with a teal rim over the needle it carries.
const BIRD_VERT = /* glsl */`
attribute vec4 aP;   // offset in the sheet, seed
attribute float aS;  // sheet index
uniform vec4 uSheet[9];   // centre, yaw
uniform float uTime, uPixH, uJelly;
varying vec3 vW;
varying vec2 vMark;    // bird: x = 1 on the outline, y = 1 on the spine; jelly: x = 1 on the bell's rim, y = 1 on the needle it carries
varying float vAlong;  // place along the body: the nose is at -z
#include <fog_pars_vertex>
void main(){
  vec4 sh = uSheet[int(aS + 0.5)];
  float seed = aP.w;
  float yaw = sh.w + (seed - 0.5) * 0.3 + 0.1 * sin(uTime * 1.3 + seed * 30.0);
  vec2 f = vec2(sin(yaw), cos(yaw));
  vec3 c = sh.xyz + aP.xyz;
  c.y += sin(uTime * (0.7 + seed) + seed * 50.0) * 0.6;
  c.xz += vec2(sin(uTime * 0.31 + seed * 17.0), cos(uTime * 0.27 + seed * 23.0)) * 0.8;
  vec4 cp0 = projectionMatrix * viewMatrix * vec4(c, 1.0);
  float pix = cp0.w / (projectionMatrix[1][1] * uPixH * 0.5);
  // the sheets over the Crown fly close past the lens: larger there
  float sc = max(1.0 + mix(1.7, 0.9, uJelly) * step(3.5, aS), 2.2 * pix) * (0.8 + 0.5 * fract(seed * 9.1));
  vec3 lp = position;
  float pulse = 1.0 + 0.2 * sin(uTime * 2.2 + seed * 40.0);
  lp.xz *= mix(1.0, mix(1.0, pulse, step(0.0, lp.y)), uJelly);
  lp *= sc;
  vec3 wp = c + vec3(-f.y, 0.0, f.x) * lp.x + vec3(0.0, 1.0, 0.0) * lp.y - vec3(f.x, 0.0, f.y) * lp.z;
  vW = wp;
  vMark = uv;
  vAlong = position.z;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uBlack, uChrome, uTeal;
uniform float uJelly;
varying vec3 vW;
varying vec2 vMark;
varying float vAlong;
${IRON_TIDE_SKY_GLSL}
${IRON_TIDE_FOG_GLSL}
void main(){
  vec3 dx = dFdx(vW), dy = dFdy(vW);
  vec3 N = normalize(cross(dx, dy) + vec3(0.0, 1e-6, 0.0));
  vec3 V = normalize(cameraPosition - vW);
  if (dot(N, V) < 0.0) N = -N;
  float nv = clamp(dot(N, V), 0.0, 1.0), fr = 1.0 - nv;
  // a made thing of this world: lacquer black with a mirror sheen that gives the gold vault back, facet by facet
  vec3 R = reflect(-V, N);
  float sg = max(dot(R, uSkySun), 0.0), sg4 = sg * sg * sg * sg;
  vec3 col = uBlack * 0.3 + itSky(R, 0.0) * (0.06 + 0.5 * fr * fr * fr) + uChrome * 0.9 * sg4 * sg4 * sg4;
  // a fine bright edge all round and a thinner line down the spine (never wider than a sixth of a facet, so a far
  // bird stays a dark dart)
  vec2 fw = fwidth(vMark);
  float rim = smoothstep(1.0 - clamp(2.2 * fw.x, 0.05, 0.17), 1.0, vMark.x);
  float spine = smoothstep(1.0 - clamp(1.6 * fw.y, 0.03, 0.1), 1.0, vMark.y);
  // the marked end of the needle: teal, lit from inside like the lamps
  float tip = 1.0 - smoothstep(-1.08, -0.84, vAlong);
  vec3 edgeCol = uSkyHor * 0.75 + uChrome * 0.45;
  vec3 bird = col + edgeCol * (0.85 * rim + 0.4 * spine * (1.0 - rim));
  bird = mix(bird, uTeal * (0.9 + 1.5 * fr + 1.2 * rim), tip);
  // the jelly: a dark glossy bell with a teal rim that glows up into the glass, and under it the needle it carries
  // (black, a bright edge, its marked end teal)
  float lipJ = smoothstep(0.55, 1.0, vMark.x);
  vec3 bell = col + uTeal * (1.7 * lipJ * lipJ + 0.3 * vMark.x * fr);
  vec3 needle = mix(col + edgeCol * 0.5 * smoothstep(0.6, 1.0, vMark.x), uTeal * (1.2 + 1.2 * fr), 1.0 - smoothstep(-0.9, -0.3, vAlong));
  vec3 jelly = mix(bell, needle, step(0.5, vMark.y));
  gl_FragColor = vec4(itApplyFog(mix(bird, jelly, uJelly)), 1.0);
}
`;

// Filing-grass: one triangle per needle, aligned in the vertex shader to the summed field direction.
const GRASS_VERT = /* glsl */`
attribute vec4 aG;   // base x, y, z, seed
uniform float uTime, uPixH, uFloatY;
uniform vec3 uLean;
uniform vec4 uMag[${NMAG}];
varying vec3 vW, vD;
varying float vT;
#include <fog_pars_vertex>
void main(){
  vec3 base = aG.xyz;
  float seed = aG.w;
  vec3 f = vec3(0.0, 1e-4, 0.0);
  for (int k = 0; k < ${NMAG}; k++) {
    vec4 m = uMag[k];
    vec3 d = vec3(m.x, uFloatY * m.w, m.y) - base;
    f += abs(m.z) * d / (dot(d, d) + 500.0);
  }
  f /= max(length(f), 1e-5);
  vec3 D = f + vec3(0.0, 0.2, 0.0) + vec3(uLean.x, 0.0, uLean.z) * uLean.y * 3.0;
  D += vec3(sin(uTime * 2.3 + seed * 60.0), 0.0, cos(uTime * 1.9 + seed * 47.0)) * (0.05 + 0.25 * uLean.y);
  D += (vec3(fract(seed * 13.7), fract(seed * 29.3), fract(seed * 41.1)) - 0.5) * 0.22;
  D = normalize(D);
  D.y = abs(D.y) + 0.06; D = normalize(D);
  float len = 0.7 + 1.0 * fract(seed * 5.3);
  float t = position.y;
  vec3 wp = base + D * (len * t);
  vec3 vd = normalize(cameraPosition - wp);
  vec3 sdir = normalize(cross(D, vd) + vec3(1e-5, 0.0, 0.0));
  vec4 cp0 = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  float pix = cp0.w / (projectionMatrix[1][1] * uPixH * 0.5);
  wp += sdir * position.x * max(0.035, 0.6 * pix) * (1.0 - t);
  vW = wp; vD = D; vT = t;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const GRASS_FRAG = /* glsl */`
uniform vec3 uBlack, uMatte, uChrome, uSkyHor, uSkySun;
varying vec3 vW, vD;
varying float vT;
${IRON_TIDE_FOG_GLSL}
void main(){
  vec3 V = normalize(cameraPosition - vW);
  vec3 Hh = normalize(V + uSkySun);
  float dh = dot(normalize(vD), Hh);
  float spec = pow(max(1.0 - dh * dh, 0.0), 36.0);
  vec3 col = uBlack * 0.5 + uMatte * uSkyHor * (1.0 + 2.6 * vT) + uChrome * spec * (0.25 + 0.75 * vT) * 0.85;
  gl_FragColor = vec4(itApplyFog(col), 1.0);
}
`;

// Rust-flowers: dull-gold oxide rosettes that open flat while a lodestone is near and fold when it has gone.
const FLOWER_VERT = /* glsl */`
attribute vec4 aG;   // x, y, z, seed
uniform vec4 uMag[${NMAG}];
uniform float uTime;
varying float vR, vOpen;
#include <fog_pars_vertex>
void main(){
  float open = 0.0;
  for (int k = 0; k < ${NMAG}; k++) {
    vec2 d = uMag[k].xy - aG.xz;
    open += abs(uMag[k].z) * exp(-dot(d, d) / 4200.0);
  }
  open = clamp(open * 1.4 + 0.08 * sin(uTime * 0.9 + aG.w * 40.0), 0.0, 1.0);
  float rad = length(position.xz);
  float sz = 0.55 + 0.5 * fract(aG.w * 7.7);
  float ca = cos(aG.w * 6.28), sa = sin(aG.w * 6.28);
  vec3 lp = vec3(position.x * ca - position.z * sa, 0.0, position.x * sa + position.z * ca);
  lp.xz *= mix(0.3, 1.0, open);
  lp.y = rad * rad * mix(1.7, 0.16, open) + 0.12;
  vec3 wp = aG.xyz + lp * sz;
  vR = rad; vOpen = open;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FLOWER_FRAG = /* glsl */`
uniform vec3 uSkySeam, uSkyHor;
varying float vR, vOpen;
${IRON_TIDE_FOG_GLSL}
void main(){
  vec3 col = uSkySeam * (0.5 + 0.75 * vR) * (0.6 + 0.6 * vOpen) * mix(vec3(1.0), uSkyHor, 0.5);
  gl_FragColor = vec4(itApplyFog(col), 1.0);
}
`;

// Far chains and ranges: small dark shapes standing on the horizon line with their images. aK = (0 foot .. 1 tip, lamp).
const FAR_VERT = /* glsl */`
attribute vec2 aK;
uniform float uFlip, uField;
varying vec2 vK;
varying vec3 vWp;
#include <fog_pars_vertex>
void main(){
  // (a tip is a spike's: in the field reversal it drops flat with every other spike in the world)
  vec3 lp = position; lp.y *= uFlip * mix(1.0, clamp(uField, 0.02, 1.3), step(0.99, aK.x));
  vec4 wp4 = modelMatrix * vec4(lp, 1.0);
  vWp = wp4.xyz;
  vec4 mvPosition = viewMatrix * wp4;
  vK = aK;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const FAR_FRAG = /* glsl */`
uniform vec3 uBlack, uSkyTop, uSkyHor, uSkySun, uLamp, uTeal;
uniform float uFlip;
varying vec2 vK;
varying vec3 vWp;
${IRON_TIDE_FOG_GLSL}
void main(){
  float k = clamp(vK.x, 0.0, 1.0), k2 = k * k;
  // lacquer black, the leaf's gold caught toward every tip
  vec3 col = uBlack * 0.7 + uSkyTop * uSkyTop * 0.3 * k2 + uSkyHor * 0.5 * k2 * k2 * k2 * k2;
  // every facet is lacquer: gold where it turns away from the eye, a hot line where it faces the light
  vec3 N = normalize(cross(dFdx(vWp), dFdy(vWp)) + vec3(0.0, 1e-6, 0.0));
  vec3 V = normalize(cameraPosition - vWp);
  float nv = abs(dot(N, V)), rim = 1.0 - nv;
  float toSun = max(dot(N, uSkySun) * sign(dot(N, V) + 1e-6), 0.0);
  col += (uSkyTop * 0.9 * rim * rim * rim + uSkyHor * 0.8 * toSun * toSun * toSun * toSun) * mix(0.3, 1.0, smoothstep(0.1, 0.5, k));
  float film = clamp(vK.y, 0.0, 0.5) * 2.0 * step(vK.y, 0.6);
  col += uTeal * film * (0.25 + 0.9 * rim * rim);
  col = mix(col, uLamp * 3.6, step(0.9, vK.y));
  if (uFlip < 0.0) col *= 0.6;
  #ifdef USE_FOG
    // they stand a kilometre off: the haze takes them slowly, so they stay shapes on the horizon line
    col = mix(col, fogColor, itFogAt(vFogDepth * 0.4) * 0.9);
  #endif
  gl_FragColor = vec4(col, 1.0);
}
`;

// ---------------------------------------------------------------- geometry helpers
function coneLattice(radial, ts) {
  const pos = [], idx = [], rows = ts.length;
  for (let j = 0; j < rows; j++) for (let i = 0; i < radial; i++) pos.push(i / radial, ts[j], 0);
  for (let j = 0; j < rows - 1; j++) for (let i = 0; i < radial; i++) {
    const a = j * radial + i, b = j * radial + (i + 1) % radial, c = a + radial, d = b + radial;
    if (j === rows - 2) idx.push(a, b, c); else idx.push(a, b, c, b, d, c);
  }
  return { pos, idx };
}
function spikeGeometry(lat, cells, zc, zr) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(lat.pos, 3));
  g.setIndex(lat.idx);
  const aC = new Float32Array(cells.length * 4);
  for (let k = 0; k < cells.length; k++) { const c = cells[k]; aC.set([c.x, c.z, c.seed, c.cap], k * 4); }
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(aC, 4));
  g.instanceCount = cells.length;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cells.cx, 0, zc), zr);
  return g;
}

// Collects triangles for the Crown's "solid" material: aGlow (teal emissive), aTone (0 matte magnetite ..
// 1 mirror fluid) and aSw (sway direction * weight, phase).
function solidBuilder() {
  const P = [], G = [], T = [], S = [], v = new THREE.Vector3();
  return {
    add(geo, m4, glow, tone, sway, warp) {
      const g = geo.index ? geo.toNonIndexed() : geo, pa = g.attributes.position;
      for (let i = 0; i < pa.count; i++) {
        v.fromBufferAttribute(pa, i);
        if (m4) v.applyMatrix4(m4);
        if (warp) warp(v);
        P.push(v.x, v.y, v.z);
        G.push(glow);
        T.push(typeof tone === 'function' ? tone(Math.floor(i / 3)) : tone);
        const sw = sway ? sway(v) : null;
        if (sw) S.push(sw[0], sw[1], sw[2], sw[3]); else S.push(0, 0, 0, 0);
      }
      if (g !== geo) g.dispose();
      geo.dispose();
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aGlow', new THREE.Float32BufferAttribute(G, 1));
      g.setAttribute('aTone', new THREE.Float32BufferAttribute(T, 1));
      g.setAttribute('aSw', new THREE.Float32BufferAttribute(S, 4));
      g.computeVertexNormals();
      g.computeBoundingSphere();
      return g;
    },
  };
}

// A lodestone barge in its own space: slab centre at the origin, nose toward -Z, sea level at y = -(FLOAT_Y + 2).
// Returns the geometry and the lamp positions (for glow sprites).
async function bargeGeometry(rng, noise, giant, pause, moor = false) {
  const B = solidBuilder(), M = new THREE.Matrix4(), lamps = [];
  const at = (x, y, z) => M.makeTranslation(x, y, z);
  const hang = (v) => { const w = Math.max(0, (-v.y - 2) / 7) * 0.22; return [w, 0, w * 0.35, 0]; };
  const hsh = (i) => { const s = Math.sin(i * 127.1 + 31.7) * 43758.5453; return s - Math.floor(s); };
  // rough magnetite slab with a few cleavage facets that glint
  B.add(new THREE.BoxGeometry(10, 4, 30, 5, 2, 14), null, 0, (t) => (hsh(t) > 0.92 ? 0.85 : 0.04 + 0.2 * hsh(t + 9)), null, (v) => {
    const k = Math.abs(v.z) / 15, k3 = k * k * k, nose = v.z < 0 ? 0.5 : 0.28;
    v.x *= 1 - nose * k3; v.y *= 1 - 0.3 * k3;
    const n = noise.n3(v.x * 0.23 + 9.1, v.y * 0.3, v.z * 0.23), n2 = noise.n3(v.x * 0.7, v.y * 0.7 + 4, v.z * 0.7);
    const l = Math.hypot(v.x, v.y * 2.5, v.z * 0.33) || 1;
    const d = n * 0.6 + n2 * 0.22;
    v.x += (v.x / l) * d; v.y += (v.y * 2.5 / l) * d * 0.6; v.z += (v.z * 0.33 / l) * d;
  });
  await pause();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(new THREE.BoxGeometry(0.3, 3.4, 0.3), at(sx * 1.9, -3.5, sz * 3.0), 0, 0.9, hang);
  // the hull seen from below: a polished keel with a lit strip either side of it, ribs out to the flanks and a port
  // light at the end of every rib, so the slab overhead is a worked thing with its own lights and never a blank shape
  B.add(new THREE.BoxGeometry(0.8, 0.7, 25), at(0, -2.55, 0.5), 0, 0.82, null);
  for (const sx of [-1, 1]) B.add(new THREE.BoxGeometry(0.14, 0.14, 21), at(sx * 0.62, -2.8, 0.5), 1, 0.3, null);
  for (let i = 0; i < 7; i++) {
    const z = -11 + i * 3.7, k = Math.abs(z) / 15, w = 4.3 * (1 - (z < 0 ? 0.5 : 0.28) * k * k * k);
    B.add(new THREE.BoxGeometry(w * 2, 0.5, 0.42), at(0, -2.5, z), 0, 0.7, null);
    for (const sx of [-1, 1]) B.add(new THREE.OctahedronGeometry(0.24), at(sx * (w - 0.1), -2.9, z), 2.2, 0.5, null);
  }
  if (!giant) {
    B.add(new THREE.BoxGeometry(4.4, 3, 7.5), at(0, -6.5, 0), 0, 0.3, hang);
    B.add(new THREE.BoxGeometry(5.3, 0.3, 8.5), at(0, -4.95, 0), 0, 0.75, hang);
    B.add(new THREE.BoxGeometry(4.9, 0.25, 8.0), at(0, -8.1, 0), 0, 0.75, hang);
    for (const sx of [-1, 1]) for (const z of [-2.4, 0, 2.4]) B.add(new THREE.BoxGeometry(0.1, 0.55, 1.5), at(sx * 2.21, -6.4, z), 1, 0.3, hang);
    for (const sz of [-1, 1]) B.add(new THREE.BoxGeometry(1.7, 0.55, 0.1), at(0, -6.4, sz * 3.76), 1, 0.3, hang);
    for (const z of [-2.6, 0, 2.6]) { B.add(new THREE.OctahedronGeometry(0.42), at(0, -8.8, z), 2, 0.5, hang); lamps.push([0, -8.8, z]); }
  } else {
    // one enormous barge carries a hanging pagoda instead of a cabin
    const rot = new THREE.Matrix4().makeRotationY(Math.PI / 4);
    for (let i = 0; i < 3; i++) {
      const w = 5.6 - 1.3 * i, y = -5.7 - 1.75 * i;
      B.add(new THREE.BoxGeometry(w, 1.1, w), at(0, y, 0), 0, 0.3, hang);
      B.add(new THREE.BoxGeometry(w + 0.08, 0.3, w + 0.08), at(0, y, 0), 1, 0.3, hang);
      B.add(new THREE.CylinderGeometry(w * 0.98, w * 0.5, 0.55, 4, 1), at(0, y - 0.82, 0).multiply(rot), 0, 0.75, hang);
      if (i === 0) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
        B.add(new THREE.OctahedronGeometry(0.3), at(sx * w * 0.7, y - 1.2, sz * w * 0.7), 2, 0.5, hang); lamps.push([sx * w * 0.7, y - 1.2, sz * w * 0.7]);
      }
    }
    B.add(new THREE.ConeGeometry(0.5, 1.7, 4), at(0, -11.4, 0).multiply(new THREE.Matrix4().makeRotationX(Math.PI)), 0, 0.9, hang);
  }
  // hanging field lines: threads of lit filings that leave the slab's flanks, bow outward and come down on the spikes
  await pause();
  {
    const seaY0 = -(FLOAT_Y + 2);
    for (const sx of [-1, 1]) for (const z0 of [-10.5, -3.5, 3.5, 10.5]) {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const q = (i / 12) * Math.PI / 2;
        pts.push(new THREE.Vector3(sx * (4.0 + 8.5 * Math.sin(q)), -1.6 + (seaY0 + 9.6) * (1 - Math.cos(q)), z0 * (1 + 0.3 * Math.sin(q)) + 4 * Math.sin(q)));
      }
      const fsway = (v) => { const w = Math.min(1, Math.max(0, (-v.y - 2) / 14)); return [w * 0.25, 0, w * 0.7, z0 * 0.4 + sx]; };
      B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 9, 0.09, 3), null, 0.13, 0.9, fsway);
    }
  }
  // tether from the stern to the sea, its weighted tip, and the file of spikelets it draws
  await pause();
  if (moor) return { geometry: B.build(), lamps };      // a barge moored high over the Crown trails no tether
  const seaY = -(FLOAT_Y + 2), pts = [];
  for (let i = 0; i <= 10; i++) { const s = i / 10; pts.push(new THREE.Vector3(0, -2 + (seaY + 2.4) * (1 - Math.pow(1 - s, 1.8)), 14.5 + 40 * s)); }
  const tsway = (v) => { const s = Math.min(1, Math.max(0, (v.z - 14.5) / 40)); return [Math.sin(s * Math.PI) * 0.6, 0, 0, 1.3]; };
  B.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, 0.17, 4), null, 0, 0.85, tsway);
  B.add(new THREE.OctahedronGeometry(0.42), at(0, seaY + 0.5, 54.6), 1.2, 1, null);
  for (let i = 0; i < 12; i++) {
    const h = 4.4 * (1 - i / 13) * rng.range(0.8, 1.15);
    B.add(new THREE.ConeGeometry(0.34, h, 5, 1, true), at(rng.range(-0.15, 0.15), seaY + h / 2, 57.2 + i * 3.1), 0, 1, null);
  }
  // the tether is a made thing: a braid and a string of lights, both placed by metres along the tether itself (no random
  // draw; in the barge's own space, so the giant carries them at the giant's own scale) and swaying with it
  {
    const curve = new THREE.CatmullRomCurve3(pts), len = curve.getLength();
    // (a) one chrome strand wound round it, one turn every 6 tether widths (6 x 0.34 = 2.04 m, the lay of a laid rope:
    // the strand crosses the tether at about 28 degrees, so it reads as a winding and neither as rings nor as a stripe);
    // a flat band 0.1 m wide lying on the tether, six steps to the turn
    const PITCH = 6 * 0.34, nSeg = Math.round(len / PITCH * 6), fr = curve.computeFrenetFrames(nSeg, false);
    const SP = [], cen = [], out = [], c = new THREE.Vector3(), wd = new THREE.Vector3();
    for (let i = 0; i <= nSeg; i++) {
      const th = (i / nSeg) * len / PITCH * TAU;
      out.push(fr.normals[i].clone().multiplyScalar(Math.cos(th)).addScaledVector(fr.binormals[i], Math.sin(th)));
      cen.push(curve.getPointAt(i / nSeg).addScaledVector(out[i], 0.2));
    }
    const edge = [];
    for (let i = 0; i <= nSeg; i++) {
      wd.subVectors(cen[Math.min(i + 1, nSeg)], cen[Math.max(i - 1, 0)]).cross(out[i]).normalize().multiplyScalar(0.05);
      edge.push([cen[i].clone().sub(wd), cen[i].clone().add(wd)]);
    }
    for (let i = 0; i < nSeg; i++) for (const v of [edge[i][0], edge[i][1], edge[i + 1][0], edge[i][1], edge[i + 1][1], edge[i + 1][0]]) SP.push(v.x, v.y, v.z);
    const sg = new THREE.BufferGeometry();
    sg.setAttribute('position', new THREE.Float32BufferAttribute(SP, 3));
    B.add(sg, null, 0, 2, tsway);
    // (b) port lights of the hull's own kind (the same octahedron, tone and glow as on the ribs) threaded on it every
    // 3.7 m from the stern to the tip: the pitch of the hull's own ribs, so the hull's row of lights runs on down the tether
    for (let k = 1; k * 3.7 < len; k++) {
      curve.getPointAt(k * 3.7 / len, c);
      B.add(new THREE.OctahedronGeometry(0.24), at(c.x, c.y, c.z), 2.2, 0.5, tsway);
    }
  }
  await pause();
  return { geometry: B.build(), lamps };
}

// A low island of black sand: height function and a grid mesh.
function makeIsland(noise, o) {
  const h = (x, z) => {
    const ex = (x - o.cx) / o.hw, ez = (z - o.cz) / o.hl;
    const base = 1 - (ex * ex + ez * ez) - 0.22 * noise.n2(x / 70 + o.cx, z / 70);
    if (base <= 0) return base * 5;
    const s = Math.min(1, base / 0.6), ss = s * s * (3 - 2 * s);
    return o.peak * ss * (0.74 + 0.26 * noise.n2(x / 26 + 3, z / 26)) + 0.35 * Math.sin(x * 0.42 + z * 0.13) * ss;
  };
  const g = new THREE.PlaneGeometry(o.hw * 2.5, o.hl * 2.4, o.nx, o.nz);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i) + o.cx, z = p.getZ(i) + o.cz; p.setXYZ(i, x, Math.max(h(x, z), -0.8), z); }
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return { h, geometry: g };
}

function quadInstances(n) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.instanceCount = n;
  return g;
}
const iattr = (g, name, arr, size) => g.setAttribute(name, new THREE.InstancedBufferAttribute(arr, size));

// The far fleet: chains of barges (slab, cabin, lamp row) each over its wake of spikes, and lone ranges. One geometry.
function farFleetGeometry(rng, chains, ranges) {
  const P = [], K = [];
  const tri = (a, b, c, ka, kb, kc, lamp) => { P.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]); K.push(ka, lamp, kb, lamp, kc, lamp); };
  const cone = (x, z, r, h, film = 0) => {
    for (let i = 0; i < 5; i++) {
      const a0 = (i / 5) * TAU, a1 = ((i + 1) / 5) * TAU;
      tri([x + Math.cos(a0) * r, 0, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, 0, z + Math.sin(a1) * r], [x, h, z], 0, 0, 1, film);
    }
  };
  const box = (cx, cy, cz, hx, hy, hz, tone, lamp, nose = 1) => {
    const c = [];
    for (let i = 0; i < 8; i++) { const sz = i & 4 ? 1 : -1; c.push([cx + (i & 1 ? hx : -hx) * (sz < 0 ? nose : 1), cy + (i & 2 ? hy : -hy), cz + sz * hz]); }
    for (const q of [[0, 1, 3, 2], [4, 6, 7, 5], [0, 4, 5, 1], [2, 3, 7, 6], [0, 2, 6, 4], [1, 5, 7, 3]]) {
      tri(c[q[0]], c[q[1]], c[q[2]], tone, tone, tone, lamp); tri(c[q[0]], c[q[2]], c[q[3]], tone, tone, tone, lamp);
    }
  };
  const wake = (x, z, s, n, len) => {
    for (let i = 0; i < n; i++) {
      const a = Math.abs(s), dz = rng.range(-0.45, 1) * len * s, dx = rng.gauss() * 13 * a;
      let h = (7 + 36 * Math.exp(-(dz * dz) / (2600 * a * a))) * a * rng.range(0.55, 1.1) * Math.exp(-(dx * dx) / (700 * a * a));
      if (Math.abs(dx) < 8 * a && Math.abs(dz) < 20 * a) h = Math.min(h, 9 * a);
      if (h > 2) cone(x + dx, z + dz, (2.2 + h * 0.09) * 1.3, h, dz * Math.sign(s) < -0.1 * len * Math.abs(s) ? 0.45 : 0.08);
    }
  };
  for (const ch of chains) for (const z of ch.zs) {
    const s = ch.s * rng.range(0.9, 1.1), dir = ch.dir;
    box(ch.x, 22 * s, z, 5 * s, 2 * s, 15 * s, 0.16, 0, 0.55);
    box(ch.x, 15.6 * s, z, 2.2 * s, 1.5 * s, 3.8 * s, 0.1, 0);
    box(ch.x, 13.2 * s, z, 0.7 * s, 0.7 * s, 3.0 * s, 0, 1);
    for (const e of [-1, 1]) box(ch.x, 24.3 * s, z + e * 13.5 * s, 0.5 * s, 0.4 * s, 0.5 * s, 0, 1);      // a riding lamp at nose and stern
    // the rings it tugs out of the mirror, seen from above as lacquer lines
    for (const rr of [34, 52, 76]) {
      const r0 = rr * s, r1 = r0 + (1.2 + rr * 0.03) * s;
      for (let i = 0; i < 20; i++) {
        const a0 = (i / 20) * TAU, a1 = ((i + 1) / 20) * TAU, zc = z + dir * 10 * s;
        const p = (r, a) => [ch.x + Math.cos(a) * r * 0.8, 0.4, zc + Math.sin(a) * r];
        tri(p(r0, a0), p(r1, a0), p(r1, a1), 0, 0, 0, 0); tri(p(r0, a0), p(r1, a1), p(r0, a1), 0, 0, 0, 0);
      }
    }
    wake(ch.x, z + dir * 6 * s, s * dir, 34, 84);
  }
  for (const r of ranges) wake(r.x, r.z, r.s, r.n, 70);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2));
  g.computeBoundingSphere();
  return g;
}

// ---------------------------------------------------------------- the world
export default {
  id: 'iron-tide',
  name: 'The Iron Tide',
  category: 'alien',
  weirdness: 0.75,
  media: ['air', 'open'],
  async build(ctx) {
    const { rng, noise } = ctx, { clamp, lerp, smoothstep } = ctx.core, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;

    // ---- which visit is this
    const vr = rng.fork('look');
    let lookId = vr.pick(['gold', 'gold', 'gold', 'rose', 'rose', 'rose', 'silver', 'silver']);
    if (vary.hour === 'day') lookId = 'gold';
    else if (vary.hour === 'golden' || vary.hour === 'dawn') lookId = 'rose';
    else if (vary.hour === 'night') lookId = 'silver';
    const weather = vr.pick(['calm', 'calm', 'rain', 'storm']);
    const rays = vr.chance(0.4), jellies = vr.chance(0.35), giant = vr.chance(0.28);
    const L = LOOKS[lookId];
    const duration = 44;

    const scene = new THREE.Scene();
    const fogCol = new THREE.Color(L.palette[0]).lerp(new THREE.Color(L.palette[1]), 0.8).multiplyScalar(0.62);
    if (weather === 'rain') fogCol.multiplyScalar(0.9);          // the iron rain greys the haze
    const fogNear = weather === 'calm' ? 0.0019 : 0.0022, fogOpen = 0.00064;
    scene.fog = new THREE.FogExp2(fogCol, fogNear);
    scene.background = fogCol.clone();

    // ---- the Crown
    await ctx.yield();
    const hero = await buildHero(ctx, { palette: L.palette, bole: L.bole, sky: false, sea: false });
    scene.add(hero.object);
    const A = hero.anchors, HU = hero.skyUniforms;
    await ctx.yield();

    // ---- the flight
    const laneX = A.lattice.laneX, xc = laneX + 18;      // camera lane, chain line
    const path = makePath([
      [xc - 8.5, 2.2, 1650], [xc - 8.5, 2.2, 1592], [xc - 4.5, 2.6, 1553], [xc - 1.5, 3.2, 1518], [xc - 4, 4.2, 1482],
      [xc - 11, 5.4, 1442], [xc - 17, 7.5, 1398],
      [xc - 15, 9.5, 1338], [xc - 17.5, 9, 1270], [xc - 19, 8.5, 1185], [xc - 18.5, 10.5, 1095],
      // in under the lead barge, 7 m to port of its keel line between the cabin and the curtain of hanging field lines, then up for the reveal
      [xc - 16.5, 12.5, 1005], [xc - 9.5, 10.5, 915], [xc - 7, 9.5, 845], [xc - 7, 9.8, 770], [xc - 9.5, 12.5, 728], [xc - 15, 19, 690],
      ...A.flyThrough.slice(1),
    ], { samples: 640 });
    await ctx.yield();
    const uLane = path.nearestXZ(A.lanePoint.x, A.lanePoint.z).u;
    const tmpV = new THREE.Vector3();
    const uAtZ = (z) => { for (let i = 0; i <= 400; i++) if (path.pointAt(i / 400, tmpV).z <= z) return i / 400; return 1; };
    const uRim = uAtZ(500);

    // ---- the chain: offsets behind the lead barge (chain-local +Z), all travelling toward -Z with u
    const chainTravel = 8 * duration;
    const LEAD0 = 940, leadZ = (u) => LEAD0 - chainTravel * u;
    const barges = [];
    if (giant) barges.push({ o: 0, s: 1 }, { o: 148, s: 1 }, { o: 200, s: 2.4 }, { o: 410, s: 1 }, { o: 600, s: 1 });
    else { const OFF = [0, 66, 152, 218, 282, 348, 410];
      for (let i = 0; i < 7; i++) barges.push({ o: OFF[i] + (i ? rng.range(-7, 7) * 0.5 : 0), s: 1 }); barges.push({ o: 600, s: 1 }); }
    const uLead = (LEAD0 - 1650) / (chainTravel - path.length) ;      // roughly where the camera passes the lead barge
    const uRev0 = clamp(uLead + 0.05, 0.4, uRim - 0.085);              // rare field reversal starts here

    // ---- islands
    await ctx.yield();
    const isle = makeIsland(noise, { cx: laneX - 96, cz: 1175, hw: 36, hl: 125, peak: 6, nx: 30, nz: 84 });
    await ctx.yield();
    const farIsle = makeIsland(noise, { cx: laneX + 540, cz: rng.range(820, 1000), hw: rng.range(60, 85), hl: rng.range(170, 230), peak: rng.range(7, 11), nx: 14, nz: 34 });
    await ctx.yield();
    const jz = 1180 + rng.range(-25, 25);
    let shoreX = laneX - 96;
    while (isle.h(shoreX, jz) > 0.3 && shoreX < laneX - 40) shoreX += 0.5;
    const moored = [{ x: shoreX + 10, z: jz - 6 }, { x: shoreX + 27, z: jz + 9 }];

    // ---- shared uniforms
    const mags = []; for (let i = 0; i < NMAG; i++) mags.push(new THREE.Vector4(0, 0, 0, 1));
    const stormDir = rng.range(0, TAU);
    const MU = {
      uMag: { value: mags }, uLean: { value: new THREE.Vector3(Math.sin(stormDir), 0, Math.cos(stormDir)) },
      uWhip: { value: 0 }, uRain: { value: weather === 'rain' ? 1 : 0 }, uFloatY: { value: FLOAT_Y + 2 },
    };
    const lampCol = new THREE.Color(L.lamp);
    const glintCol = new THREE.Color(L.palette[0]).lerp(new THREE.Color('#ffffff'), 0.35);
    const mk = (vs, fs, extra = {}, params = {}) => new THREE.ShaderMaterial({
      vertexShader: vs, fragmentShader: fs, fog: true,
      uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...HU, ...MU, ...extra }, ...params,
    });
    const add = (m, order = 0, cull = false) => { m.frustumCulled = cull; m.renderOrder = order; scene.add(m); return m; };

    // ---- sky dome and mirror sea
    const sky = add(new THREE.Mesh(new THREE.SphereGeometry(4200, 32, 16), new THREE.ShaderMaterial({
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, uniforms: HU, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false })), -1);
    {
      const g = new THREE.CircleGeometry(4300, 64); g.rotateX(-Math.PI / 2);
      add(new THREE.Mesh(g, mk(SEA_VERT, SEA_FRAG, {
        uRim: { value: hero.radius }, uLatK: { value: 4 * Math.PI / (Math.sqrt(3) * A.lattice.spacing) }, uDir: { value: A.spin.dir },
        uBloomK: { value: 4 * Math.PI / (Math.sqrt(3) * SPACING) }, uLaneX: { value: xc },
      }, { depthWrite: false })), -0.5);
    }

    await ctx.yield();
    // ---- island meshes with their mirror images
    const sandMat = mk(SAND_VERT, SAND_FRAG, { uFlip: { value: 1 } });
    const sandMirror = mk(SAND_VERT, SAND_FRAG, { uFlip: { value: -1 } }, { side: THREE.DoubleSide });
    for (const g of [isle.geometry, farIsle.geometry]) { add(new THREE.Mesh(g, sandMat), 0, true); add(new THREE.Mesh(g, sandMirror), -0.4, true); }

    // ---- solid things: jetty, barges (the Crown's magnetite material, lamps in this look's colour)
    const solidU = () => ({ uGrain: { value: 0.45 }, uGlowAmp: { value: 3.2 }, uTeal: { value: lampCol }, uBounce: { value: 1.0 } });
    const solidMat = mk(IRON_TIDE_SOLID_VERT, IRON_TIDE_SOLID_FRAG, { uRefl: { value: 0 }, ...solidU() }, { side: THREE.DoubleSide });
    const solidMirror = mk(IRON_TIDE_SOLID_VERT, IRON_TIDE_SOLID_FRAG, { uRefl: { value: 1 }, ...solidU() }, { side: THREE.DoubleSide });
    const twin = (mesh, parent) => {       // mirror image below the sea plane
      const m = new THREE.Mesh(mesh.geometry, solidMirror);
      m.position.copy(mesh.position); m.position.y *= -1; m.scale.copy(mesh.scale); m.scale.y *= -1;
      m.renderOrder = -0.4; parent.add(m); return m;
    };
    {
      const B = solidBuilder(), M = new THREE.Matrix4();
      const hsh = (i) => { const s = Math.sin(i * 91.3 + 7.7) * 43758.5453; return s - Math.floor(s); };
      for (let i = 0; i < 10; i++) for (const side of [-1, 1]) {
        const hgt = rng.range(6.4, 8.6), x = shoreX - 3 + i * 4.5 + rng.range(-0.3, 0.3), z = jz + side * 2.7 + rng.range(-0.3, 0.3);
        B.add(new THREE.CylinderGeometry(0.62, 0.78, hgt, 6, 1), M.makeTranslation(x, hgt / 2, z), 0, (t) => 0.04 + 0.22 * hsh(t + i * 31));
      }
      const jetty = new THREE.Mesh(B.build(), solidMat);
      scene.add(jetty); twin(jetty, scene);
    }
    await ctx.yield();
    const pause = () => ctx.yield();
    const bargeN = await bargeGeometry(rng.fork('barge'), noise, false, pause);
    await ctx.yield();
    const bargeG = giant ? await bargeGeometry(rng.fork('giant'), noise, true, pause) : null;
    await ctx.yield();
    const chain = new THREE.Group();
    scene.add(chain);
    const bargeMeshes = [], lampPos = [], lampColors = [], lampSizes = [];
    const pushLamps = (list, bx, by, bz, s, out, gain = 1) => {
      for (const l of list) for (const flip of [1, -1]) {
        out.push([bx + l[0] * s, (by + l[1] * s) * flip, bz + l[2] * s]);
        lampColors.push(lampCol.clone().multiplyScalar((flip > 0 ? 1 : 0.5) * gain)); lampSizes.push((s > 1 ? 1.7 : 1) * (gain > 1 ? 1.25 : 1));
        // a white-gold glint at the heart of every lamp
        out.push([bx + l[0] * s, (by + l[1] * s) * flip, bz + l[2] * s]);
        lampColors.push(glintCol.clone().multiplyScalar(flip > 0 ? 2.2 : 1.1)); lampSizes.push(0.3 * (s > 1 ? 1.7 : 1));
      }
    };
    for (const b of barges) {
      const src = b.s > 1 ? bargeG : bargeN;
      const m = new THREE.Mesh(src.geometry, solidMat);
      m.position.set(0, (FLOAT_Y + 2) * b.s, b.o); m.scale.setScalar(b.s);
      chain.add(m);
      bargeMeshes.push({ mesh: m, mirror: twin(m, chain), y: m.position.y, ph: rng.range(0, TAU) });
      // the last barge is only ever seen from close behind at arrival, where its image would hang at the lens as a second dark hull: its lamps' glow on the mirror is enough
      if (b === barges[barges.length - 1]) bargeMeshes[bargeMeshes.length - 1].mirror.visible = false;
      pushLamps(src.lamps, 0, m.position.y, b.o, b.s, lampPos, b === barges[barges.length - 1] ? 1.8 : 1);
    }
    const time = { value: 0 };
    const chainGlows = fx.makeGlows({ rng: rng.fork('lamps'), positions: lampPos, colors: lampColors.slice(), sizes: lampSizes.slice(), size: 2.4, intensity: 2.2, flicker: 0.22, time });
    chainGlows.object.frustumCulled = false;
    chain.add(chainGlows.object);
    await ctx.yield();
    const mooredPos = []; lampColors.length = 0; lampSizes.length = 0;
    for (const mb of moored) {
      const m = new THREE.Mesh(bargeN.geometry, solidMat);
      m.position.set(mb.x, FLOAT_Y + 2, mb.z); m.rotation.y = rng.range(-0.12, 0.12);
      scene.add(m);
      bargeMeshes.push({ mesh: m, mirror: twin(m, scene), y: m.position.y, ph: rng.range(0, TAU), moored: true });
      pushLamps(bargeN.lamps, mb.x, FLOAT_Y + 2, mb.z, 1, mooredPos);
    }
    // ---- barges moored over the Crown's rim, either side of the lane in: big ones, hanging above the outer spires
    {
      const rr = rng.fork('rim');
      for (const [dx, y, z, s] of [[-44, 80, 386, 2.2], [43, 84, 380, 2.2], [-122, 106, 322, 2.0], [124, 103, 328, 2.0]]) {
        const m = new THREE.Mesh(bargeN.geometry, solidMat);
        m.position.set(laneX + dx, y, z); m.scale.setScalar(s); m.rotation.y = rr.range(-0.2, 0.2) + (dx > 0 ? -0.25 : 0.25);
        scene.add(m);
        bargeMeshes.push({ mesh: m, mirror: new THREE.Object3D(), y, ph: rr.range(0, TAU), moored: true });
        for (const l of bargeN.lamps) {
          const c = Math.cos(m.rotation.y), sn = Math.sin(m.rotation.y);
          mooredPos.push([m.position.x + (l[0] * c + l[2] * sn) * s, y + l[1] * s, z + (-l[0] * sn + l[2] * c) * s]);
          lampColors.push(lampCol.clone().multiplyScalar(1.4)); lampSizes.push(2.2);
        }
      }
      // and the harbour barge of the Crown: a great slab with a hanging pagoda, moored high outside the turn-in, level
      // with the lodestone's foot; the flight banks in past it with the sea falling away below
      const pg = await bargeGeometry(rr.fork('pagoda'), noise, true, pause, true);
      await ctx.yield();
      {
        const s = 3.4, y = 290, m = new THREE.Mesh(pg.geometry, solidMat);
        m.position.set(A.orbit * 178, y, 104); m.scale.setScalar(s); m.rotation.y = A.orbit * 0.5;
        scene.add(m);
        bargeMeshes.push({ mesh: m, mirror: new THREE.Object3D(), y, ph: rr.range(0, TAU), moored: true });
        const c = Math.cos(m.rotation.y), sn = Math.sin(m.rotation.y);
        for (const l of pg.lamps) {
          mooredPos.push([m.position.x + (l[0] * c + l[2] * sn) * s, y + l[1] * s, m.position.z + (-l[0] * sn + l[2] * c) * s]);
          lampColors.push(lampCol.clone().multiplyScalar(1.6)); lampSizes.push(2.6);
        }
      }
    }
    // ---- the far fleet: other chains dragging their ranges toward the Crown from every side, and lone ranges. Two
    // flocks (this side of the Crown and beyond it), each one mesh and its mirror image; they travel with u.
    const farNear = new THREE.Group(), farBeyond = new THREE.Group();
    {
      const fr = rng.fork('far'), o = A.orbit;
      const zs = (z0, n, gap) => { const out = []; let z = z0; for (let i = 0; i < n; i++) { out.push(z); z += gap * fr.range(0.8, 1.25); } return out; };
      const lone = (n, x0, x1, z0, z1) => { const out = []; for (let i = 0; i < n; i++) out.push({ x: fr.range(x0, x1), z: fr.range(z0, z1), s: fr.range(1.2, 2.2), n: 16 }); return out; };
      const gNear = farFleetGeometry(fr, [
        { x: o * 640, zs: zs(-210, 5, 150), s: 3.0, dir: 1 }, { x: -o * 780, zs: zs(430, 6, 96), s: 1.9, dir: 1 },
      ], [...lone(4, o * 380, o * 1000, 500, 1500), ...lone(4, -o * 420, -o * 1100, 900, 1700)]);
      await ctx.yield();
      const gBeyond = farFleetGeometry(fr, [
        { x: o * 430, zs: zs(-1280, 6, 104), s: 2.0, dir: -1 }, { x: -o * 540, zs: zs(-1400, 6, 110), s: 2.1, dir: -1 },
      ], [...lone(4, -900, 900, -1900, -1000), ...lone(3, o * 700, o * 1200, -700, -100)]);
      const fu = () => ({ uLamp: { value: lampCol } });
      const farMat = mk(FAR_VERT, FAR_FRAG, { uFlip: { value: 1 }, ...fu() }, { side: THREE.DoubleSide });
      const farMirror = mk(FAR_VERT, FAR_FRAG, { uFlip: { value: -1 }, ...fu() }, { side: THREE.DoubleSide });
      for (const [grp, g] of [[farNear, gNear], [farBeyond, gBeyond]]) {
        const a = new THREE.Mesh(g, farMat), b = new THREE.Mesh(g, farMirror);
        a.frustumCulled = b.frustumCulled = false; b.renderOrder = -0.4;
        grp.add(a, b); scene.add(grp);
      }
    }
    await ctx.yield();
    const mooredGlows = fx.makeGlows({ rng: rng.fork('lamps2'), positions: mooredPos, colors: lampColors, sizes: lampSizes, size: 2.4, intensity: 2.2, flicker: 0.22, time });
    scene.add(mooredGlows.object);
    await ctx.yield();

    // ---- the blooms: instanced cones on a fixed hex lattice along the chain's corridor, in z chunks
    const Z0 = 470, Z1 = 1700, NCH = 6, chunkLen = (Z1 - Z0) / NCH;
    const chunks = [];
    {
      const S = SPACING, col = S * 0.8660254, jMax = Math.ceil(88 / col);
      const near = [], far = [];
      for (let c = 0; c < NCH; c++) { near.push([]); far.push([]); }
      const iLo = Math.floor(Z0 / S);
      for (let j = -jMax; j <= jMax; j++) for (let i = iLo; i <= Math.ceil(Z1 / S); i++) {
        if (i === iLo) await ctx.yield();
        const x = xc + j * col, z = (i + (j & 1 ? 0.5 : 0)) * S;
        if (z < Z0 || z >= Z1) continue;
        if (isle.h(x, z) > -0.7) continue;
        if (x > shoreX - 5 && x < shoreX + 44 && Math.abs(z - jz) < 5.5) continue;      // the jetty stands here
        const n = path.nearestXZ(x, z);
        let cap = 200;
        if (n.y < 60) { if (n.dist < 8.5) continue; // beside the lens a spike stays under eye level; from 15 m out the range stands as tall as its field lifts it
          // (and out to 35 m it rises more gently, so no spike is a thin strip cut by the top edge right beside the lens)
          cap = n.dist < 15 ? (n.dist - 8.5) * 3 + 0.5 : n.dist < 35 ? 20 + (n.dist - 15) * 2.6 : Math.min(200, 72 + (n.dist - 35) * 5); }
        const cell = { x, z, seed: rng(), cap };
        const c = Math.min(NCH - 1, Math.floor((z - Z0) / chunkLen));
        (n.dist < 27 ? near[c] : far[c]).push(cell);
      }
      await ctx.yield();
      const latNear = coneLattice(10, [0, 0.04, 0.12, 0.26, 0.5, 0.75, 0.93, 1]);
      const latFar = coneLattice(6, [0, 0.1, 0.45, 0.85, 1]);
      const latMir = coneLattice(4, [0, 0.12, 0.5, 1]);
      const spikeU = { uHmax: { value: 38 }, uR0: { value: S / Math.sqrt(3) }, uSheen: { value: 0.5 } };
      const spikeMat = mk(SPIKE_VERT, IRON_TIDE_SPIRE_FRAG, { uFlip: { value: 1 }, uRefl: { value: 0 }, ...spikeU });
      const spikeMirror = mk(SPIKE_VERT, IRON_TIDE_SPIRE_FRAG, { uFlip: { value: -1 }, uRefl: { value: 1 }, ...spikeU }, { side: THREE.DoubleSide });
      for (let c = 0; c < NCH; c++) {
        const zc = Z0 + (c + 0.5) * chunkLen, rad = Math.hypot(110, chunkLen / 2 + 10, 50);
        const all = near[c].concat(far[c]);
        near[c].cx = far[c].cx = all.cx = xc;
        const meshes = [];
        if (near[c].length) meshes.push(add(new THREE.Mesh(spikeGeometry(latNear, near[c], zc, rad), spikeMat), 0, true));
        if (far[c].length) meshes.push(add(new THREE.Mesh(spikeGeometry(latFar, far[c], zc, rad), spikeMat), 0, true));
        if (all.length) meshes.push(add(new THREE.Mesh(spikeGeometry(latMir, all, zc, rad), spikeMirror), -0.4, true));
        chunks.push({ a: Z0 + c * chunkLen, b: Z0 + (c + 1) * chunkLen, meshes });
        await ctx.yield();
      }
    }
    await ctx.yield();

    // ---- filing-murmurations: an arcade of dust arcs from barge to barge
    {
      const arcs = [];
      for (let k = 0; k + 1 < barges.length; k++) {
        const a = barges[k], b = barges[k + 1], gap = b.o - a.o;
        const nArc = Math.round(9 * Math.min(1.25, Math.max(0.8, gap / 90)));
        for (let i = 0; i < nArc; i++) {
          const psi = lerp(-1.08, 1.08, (i + rng.range(0.15, 0.85)) / nArc);
          const hgt = rng.range(58, 90) * Math.pow(gap / 78, 0.55) * (0.75 + 0.25 * Math.cos(psi));
          arcs.push({ A: [a.o + 7 * a.s, b.o - 7 * b.s, hgt, psi], Y: [(FLOAT_Y + 4) * a.s, (FLOAT_Y + 4) * b.s], seed: rng() });
        }
      }
      const per = Math.round(72 * density * detail), N = arcs.length * per;
      const g = quadInstances(N), aA = new Float32Array(N * 4), aY = new Float32Array(N * 2), aB = new Float32Array(N * 4);
      for (let k = 0; k < N; k++) {
        const arc = arcs[k % arcs.length];
        aA.set(arc.A, k * 4); aY.set(arc.Y, k * 2);
        aB.set([rng(), -(0.05 + 0.035 * arc.seed) * rng.range(0.85, 1.15), rng.range(0.4, 0.95) * (rng.chance(0.08) ? 2.1 : 1), (Math.floor(arc.seed * 8) + rng()) / 8], k * 4);
      }
      iattr(g, 'aA', aA, 4); iattr(g, 'aY', aY, 2); iattr(g, 'aB', aB, 4);
      const dust = new THREE.Mesh(g, mk(DUST_VERT, IRON_TIDE_FILING_FRAG, {}, { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
      dust.frustumCulled = false; dust.renderOrder = 3; chain.add(dust);
      await ctx.yield();
      const SEG = 30, P = [], AA = [], YY = [], UU = [], I = [];
      for (const arc of arcs) {
        const b = P.length / 3, sd = Math.floor(arc.seed * 8) / 8;
        for (let k = 0; k <= SEG; k++) for (const side of [-1, 1]) { P.push(0, 0, 0); AA.push(...arc.A); YY.push(...arc.Y); UU.push(k / SEG, side, sd); }
        for (let k = 0; k < SEG; k++) { const o = b + k * 2; I.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
      }
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      lg.setAttribute('aA', new THREE.Float32BufferAttribute(AA, 4));
      lg.setAttribute('aY', new THREE.Float32BufferAttribute(YY, 2));
      lg.setAttribute('aU', new THREE.Float32BufferAttribute(UU, 3));
      lg.setIndex(I);
      const lines = new THREE.Mesh(lg, mk(ARCLINE_VERT, IRON_TIDE_RIBBON_FRAG, {}, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      lines.frustumCulled = false; lines.renderOrder = 2; chain.add(lines);
    }

    await ctx.yield();
    // ---- compass-eels or skimmer-rays, keeping pace with the blooms
    {
      const N = Math.round((rays ? 40 : 72) * density), SEGS = 12, P = [], I = [];
      for (let k = 0; k <= SEGS; k++) for (const side of [-1, 0, 1]) P.push(k / SEGS, side, 0);
      for (let k = 0; k < SEGS; k++) { const o = k * 3; I.push(o, o + 1, o + 3, o + 1, o + 4, o + 3, o + 1, o + 2, o + 4, o + 2, o + 5, o + 4); }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.instanceCount = N;
      const aE = new Float32Array(N * 4), aF = new Float32Array(N * 2);
      // eels travel in trains of six, one hop apart on the same line of spike tips, 15-25 m off the camera lane
      // (the lane is 18 m to port of the chain line); rays skim in loose pairs
      const er = rng.fork('eels'), TRAIN = rays ? 2 : 6;
      let lead = null;
      for (let k = 0; k < N; k++) {
        const j = k % TRAIN;
        if (j === 0) {
          const port = er.chance(0.62);
          const x = rays ? (port ? er.range(-84, -52) : er.range(16, 48)) : (port ? er.range(-44, -33) : er.range(9, 17));
          lead = [x, er.range(90, 640), er.range(0.5, 0.8), er(), er.int(8, 12), rays ? er.range(2, 6) : er.range(0.5, 2)];
        }
        // phase = time * speed + seed * 37, so a seed 1/37 behind is exactly one hop behind
        aE.set([lead[0] + (rays ? j * 7 : 0), lead[1], lead[2], lead[3] - j * (rays ? 0.011 : 1 / 37)], k * 4);
        aF.set([lead[4], lead[5]], k * 2);
      }
      iattr(g, 'aE', aE, 4); iattr(g, 'aF', aF, 2);
      const eels = new THREE.Mesh(g, mk(EEL_VERT, EEL_FRAG, {
        uRay: { value: rays ? 1 : 0 }, uHop: { value: rays ? 24 : 18 }, uBaseY: { value: rays ? 31 : 21 }, uHopH: { value: rays ? 4 : 10 }, uBody: { value: rays ? 0.22 : 0.34 },
      }, { side: THREE.DoubleSide }));
      eels.frustumCulled = false; chain.add(eels);
    }

    await ctx.yield();
    // ---- needle-birds or compass-jellies: six sheets of hoverers
    const sheets = [
      { c: [laneX - 36, 23, 1248], crown: false }, { c: [laneX - 78, 27, 1085], crown: false }, { c: [xc + 62, 38, 1000], crown: false },
      // out over the flank at the turn-in (beside the lens), then the big close ones: over the rim, level with the lodestone view, in the half-turn, up to the portal, and across the reveal
      { c: [A.orbit * 112, 231, 129], crown: true }, { c: [laneX - 9, 76, 432], crown: true }, { c: [laneX + 11, 197, 268], crown: true },
      { c: [A.orbit * 86, 262, 4], crown: true }, { c: [-A.orbit * 12, 306, -30], crown: true }, { c: [laneX - 30, 30, 600], crown: true },
    ];
    const sheetU = sheets.map((s) => new THREE.Vector4(s.c[0], s.c[1], s.c[2], 0));
    {
      const P = [], UV = [];
      const tri = (a, b, c) => { for (const v of [a, b, c]) { P.push(v[0], v[1], v[2]); UV.push(v[3], v[4]); } };
      if (!jellies) {
        // a compass needle that flies: a long black lozenge with a raised spine, a pair of swept vanes and a tail fin.
        // uv = (1 on the outline, 1 on the spine)
        const nose = [0, 0, -1.45, 1, 1], tail = [0, 0, 1.0, 1, 1], sl = [-0.26, 0, -0.2, 1, 0], sr = [0.26, 0, -0.2, 1, 0], back = [0, 0.2, -0.25, 0, 1];
        tri(nose, sl, back); tri(nose, back, sr); tri(sl, tail, back); tri(back, tail, sr);   // the two-faced upper side
        const nl = [0, 0, -1.45, 1, 0], tl = [0, 0, 1.0, 1, 0], keel = [0, -0.11, -0.25, 0, 0];
        tri(nl, sl, keel); tri(nl, keel, sr); tri(sl, tl, keel); tri(keel, tl, sr);           // the shallow keel beneath
        for (const sx of [-1, 1]) tri([sx * 0.1, 0.04, 0.12, 0, 0], [sx * 0.86, 0.2, 1.16, 1, 0], [sx * 0.07, 0.04, 0.84, 1, 0]);   // swept vanes
        tri([0, 0.12, 0.36, 0, 0], [0, 0.56, 1.18, 1, 0], [0, 0.05, 0.96, 1, 0]);             // tail fin
      } else {
        // uv = (1 on the bell's lower rim, 1 on the needle)
        const R = 0.75, n = 7;
        for (let i = 0; i < n; i++) {
          const a0 = (i / n) * TAU, a1 = ((i + 1) / n) * TAU;
          const ring = (a, r, y) => [Math.cos(a) * r, y, Math.sin(a) * r, y < 0.1 ? 1 : 0, 0];
          tri([0, 0.55, 0, 0, 0], ring(a0, R * 0.7, 0.36), ring(a1, R * 0.7, 0.36));
          tri(ring(a0, R * 0.7, 0.36), ring(a0, R, 0.02), ring(a1, R, 0.02));
          tri(ring(a0, R * 0.7, 0.36), ring(a1, R, 0.02), ring(a1, R * 0.7, 0.36));
        }
        tri([-0.07, -0.25, 0.7, 1, 1], [0.07, -0.25, 0.7, 1, 1], [0, -0.25, -1.5, 0.5, 1]);       // the compass needle it carries
        tri([0, -0.18, 0.7, 1, 1], [0, -0.32, 0.7, 1, 1], [0, -0.25, -1.5, 0.5, 1]);
      }
      const per = Math.round(50 * density), N = per * sheets.length;
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.instanceCount = N;
      const aP = new Float32Array(N * 4), aS = new Float32Array(N);
      for (let k = 0; k < N; k++) {
        const s = k % sheets.length;
        const ax = rng.range(-4, 4), ay = rng.range(-9, 9) * (1 + 0.3 * rng.gauss() * 0.3), az = rng.range(-24, 24), wide = s >= 4;
      aP.set([wide ? az : ax, ay, wide ? ax * 2 : az, rng()], k * 4); aS[k] = s;
      }
      iattr(g, 'aP', aP, 4); iattr(g, 'aS', aS, 1);
      add(new THREE.Mesh(g, mk(BIRD_VERT, BIRD_FRAG, { uSheet: { value: sheetU }, uJelly: { value: jellies ? 1 : 0 } }, { side: THREE.DoubleSide })));
    }
    await ctx.yield();

    // ---- filing-grass and rust-flowers on the port island
    {
      const N = Math.round(30000 * Math.min(1, density) * detail), aG = new Float32Array(N * 4);
      const gr = rng.fork('grass');
      let k = 0, guard = 0;
      while (k < N && guard++ < N * 6) {
        const x = laneX - 96 + gr.range(-46, 46), z = 1175 + gr.range(-150, 150), y = isle.h(x, z);
        if (y < 0.12) continue;
        aG.set([x, y - 0.05, z, gr()], k * 4); k++;
        if ((guard & 4095) === 0) await ctx.yield();
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, 0, 1, 0], 3));
      iattr(g, 'aG', aG, 4); g.instanceCount = k;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(laneX - 96, 3, 1175), 165);
      add(new THREE.Mesh(g, mk(GRASS_VERT, GRASS_FRAG, {}, { side: THREE.DoubleSide })), 0, true);
      await ctx.yield();

      const NF = Math.round(340 * density), fG = new Float32Array(NF * 4), P = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * TAU, w = 0.42, pt = (ang, r) => [Math.cos(ang) * r, 0, Math.sin(ang) * r];
        P.push(0, 0, 0, ...pt(a - w, 0.6), ...pt(a, 1), 0, 0, 0, ...pt(a, 1), ...pt(a + w, 0.6));
      }
      let f = 0; guard = 0;
      while (f < NF && guard++ < NF * 40) {
        const x = laneX - 96 + gr.range(-10, 46), z = 1175 + gr.range(-140, 140), y = isle.h(x, z);
        if (y < 0.35 || y > 4.2) continue;
        fG.set([x, y, z, gr()], f * 4); f++;
      }
      const fg = new THREE.InstancedBufferGeometry();
      fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      iattr(fg, 'aG', fG, 4); fg.instanceCount = f;
      fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(laneX - 96, 3, 1175), 165);
      add(new THREE.Mesh(fg, mk(FLOWER_VERT, FLOWER_FRAG, {}, { side: THREE.DoubleSide })), 0, true);
    }
    await ctx.yield();

    // ---- drifting filings in the air; in the iron rain, falling ones
    const motes = fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, count: Math.round(2400 * detail * density), box: [80, 36, 120],
      size: [0.035, 0.11], colors: [L.palette[3], L.palette[0], L.lamp], intensity: 1.5, velocity: [0.3, 0.05, 0.6] });
    scene.add(motes.object);
    await ctx.yield();
    let rain = null;
    if (weather === 'rain') {
      rain = fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, count: Math.round(5200 * detail), box: [70, 44, 90],
        colors: ['#15161a', '#2b2c31', L.palette[3]], additive: 0.1, opacity: 0.85, intensity: 0.7, size: [0.02, 0.04], velocity: [1.2, -30, 0.6] });
      scene.add(rain.object);
    }

    await ctx.yield();
    // ---- per-frame
    const nChain = barges.length;
    const strength = barges.map((b) => (b.s > 1 ? 1.25 : rng.range(0.86, 1.08)));
    const size = new THREE.Vector2(), camW = new THREE.Vector3();
    const period = A.spin.period, arms = A.spin.arms, REV = 0.042;
    let spin = A.spin.phi0, spinInit = false;
    // the wheel is steered twice: an arm sweeps the lane as we come in over the rim, and an arm front is beside
    // the camera, on the attendant columns, in the middle of the climbing half-turn
    const uTurn = uAtZ(150), uArm = Math.min(0.9, uTurn + 0.1), uSwitch = uTurn - 0.02;
    path.pointAt(uArm, tmpV);
    const phiClimb = Math.atan2(tmpV.x, tmpV.z) * A.spin.dir + A.spin.twist * 36 + 0.02 * TAU / arms;
    const storm = weather === 'storm';

    function update(dt, t, camera, u = 0) {
      time.value = t;
      const lz = leadZ(u);
      chain.position.set(xc, 0, lz);
      farNear.position.z = -chainTravel * u; farBeyond.position.z = chainTravel * u;

      // rare: the field reverses during the reveal
      let field = 1, turn = 0;
      if (rare) {
        const x = (u - (uRev0 + REV)) / 0.012;
        field = x > 0 ? 1 - Math.exp(-3 * x) * Math.cos(5 * x) : 1 - smoothstep(uRev0, uRev0 + 0.006, u);
        turn = smoothstep(uRev0 - 0.008, uRev0 + REV, u);
      }
      HU.uField.value = field;

      // magnets
      for (let i = 0; i < NMAG; i++) {
        if (i < nChain) mags[i].set(xc, lz + barges[i].o, strength[i], barges[i].s > 1 ? 1.7 : 1);
        else if (i < nChain + 2) mags[i].set(moored[i - nChain].x, moored[i - nChain].z, -0.5, 1);
        else mags[i].set(0, 0, 0, 1);
      }
      MU.uLean.value.y = storm ? 0.52 + 0.07 * Math.sin(t * 0.7) + 0.04 * Math.sin(t * 2.3) : 0.02 * Math.sin(t * 0.5);
      MU.uWhip.value = storm ? 1.6 : 0.14;

      // barges drift and sway; their mirror images follow
      for (const b of bargeMeshes) {
        const m = b.mesh, k = b.moored ? 0.6 : 1;
        m.rotation.z = 0.028 * k * Math.sin(t * 0.5 + b.ph);
        m.rotation.x = 0.013 * k * Math.sin(t * 0.37 + b.ph * 2);
        m.position.y = b.y + 0.25 * Math.sin(t * 0.6 + b.ph);
        b.mirror.rotation.set(-m.rotation.x, m.rotation.y, -m.rotation.z);
        b.mirror.position.y = -m.position.y;
      }

      // only the stretches of lattice that a bloom is standing on are drawn
      for (const ch of chunks) {
        let vis = false;
        for (let i = 0; i < nChain + 2 && !vis; i++) { const m = mags[i]; vis = m.y - 85 * m.w < ch.b && m.y + 145 * m.w > ch.a; }
        for (const m of ch.meshes) m.visible = vis;
      }

      // the Crown's wheel: free-running, steered so that an arm sweeps across the lane as the camera gets there
      const want = u < uSwitch
        ? A.spin.phiLane + (u - uLane) * TAU * duration / period
        : phiClimb + (u - uArm) * TAU * duration / period;
      if (!spinInit || dt > 0.5 || dt < 0) { spin = want; spinInit = true; }
      else {
        const mod = TAU / arms;
        const err = ((((want - spin) % mod) + mod * 1.5) % mod) - mod * 0.5;
        spin += dt * (TAU / period) * clamp(1 + err * 1.6, 0.6, 1.9);
      }
      hero.setSpin(spin);
      hero.update(dt, t, camera);
      // the Crown's fine meshes are lost in the haze until we are well up the chain
      const fine = u > 0.2;
      for (const m of hero.detailMeshes) m.visible = fine;
      // the lodestone's mirror image belongs to the reveal; before it, it would only punch a hole in the blooms' gold
      if (hero.lodestoneReflection) hero.lodestoneReflection.visible = u > uLead - 0.13;
      ctx.renderer.getDrawingBufferSize(size);
      HU.uPixH.value = size.y;
      HU.uSkyShift.value.x += t * 0.16;            // the leaf tiles catch and lose the light even when we hold still
      if (hero.lodestone) hero.lodestone.rotation.z = turn * Math.PI;
      if (hero.lodestoneReflection) hero.lodestoneReflection.rotation.z = -turn * Math.PI;

      // hoverers: every sheet points down the local field, and swings as a barge or an arm goes by
      for (let s = 0; s < sheets.length; s++) {
        const c = sheets[s].c;
        let yaw;
        if (sheets[s].crown) {
          const rad = Math.hypot(c[0], c[2]);
          const q = (Math.atan2(c[0], c[2]) * A.spin.dir + A.spin.twist * rad - spin) * arms / TAU;
          const n = Math.floor(q);
          yaw = -(n + smoothstep(0.3, 0.7, q - n)) * (Math.PI / 2) * A.spin.dir;
        } else {
          let sx = 0, sz = 0;
          for (let i = 0; i < nChain + 2; i++) {
            const dx = mags[i].x - c[0], dz = mags[i].y - c[2], d2 = dx * dx + dz * dz + 400;
            const w = Math.abs(mags[i].z) / (d2 * d2);
            sx += dx * w; sz += dz * w;
          }
          yaw = Math.atan2(sx, sz - 1e-9);
        }
        sheetU[s].w = yaw + turn * Math.PI;
      }

      scene.fog.density = lerp(fogNear, fogOpen, smoothstep(uLead - 0.21, uLead - 0.035, u));
      sky.position.copy(camera.getWorldPosition(camW));
      motes.update(dt, t, camera);
      if (rain) rain.update(dt, t, camera);
    }

    const lastBarge = barges[nChain - 1];
    const uJetty = uAtZ(jz);
    const tmpP = new THREE.Vector3();
    // where the camera is `short` metres short of a barge
    const uShort = (b, short) => { for (let i = 0; i <= 400; i++) { path.pointAt(i / 400, tmpP); if (tmpP.z <= leadZ(i / 400) + b.o + short) return i / 400; } return 0.34; };
    const bargePois = [];
    let uBarge = 0.34;
    {
      const list = giant ? [[barges[2], 140, 50, 0.05, 0.75, 0.06], [barges[1], 42, 17, 0.035, 0.7, 0.02]] : [[barges[Math.min(2, nChain - 1)], 42, 17, 0.055, 0.7, 0.02]];
      for (const [b, short, y, lead, weight, hold] of list) {
        const ub = clamp(uShort(b, short), 0.15, 0.5), v = new THREE.Vector3();
        bargePois.push({ at: (t, u) => v.set(xc - 2, y, leadZ(u) + b.o - 4), from: ub - lead, to: ub + hold, weight });
        uBarge = ub;
      }
    }
    const uUnder = clamp(uShort(barges[0], 4), 0.36, 0.5);
    const rangeFrom = giant ? bargePois[0].to - 0.01 : uJetty - 0.03, rangeTo = bargePois[bargePois.length - 1].from + 0.01;
    // a soft halo in the lamp colour where the portal hangs, so the gap under the lodestone glows from afar
    const seat = A.portalSeat.position, seatV = new THREE.Vector3();
    const halo = fx.makeGlows({ rng: rng.fork('halo'), positions: [[seat.x, seat.y, seat.z]], color: L.lamp, size: 20, intensity: 0.55, core: 0.15, flicker: 0.12, time });
    scene.add(halo.object);
    await ctx.yield();
    return {
      scene, path, duration,
      // linger over the reveal of the Crown and its reflection, make up the time on the run in over the rim
      pace: (u) => 1 - 0.28 * smoothstep(0.37, 0.45, u) * (1 - smoothstep(0.53, 0.6, u)) + 0.22 * smoothstep(0.58, 0.65, u) * (1 - smoothstep(0.7, 0.78, u)),
      title: L.title,
      ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.4, far: 9000, lookAhead: 38, bank: 0.45 },
      pois: [
        { at: (t, u) => tmpV.set(xc, 13, leadZ(u) + lastBarge.o), from: 0.012, to: 0.08, weight: 0.4 },
        { at: [shoreX + 12, 15, jz], from: uJetty - 0.1, to: uJetty - 0.035, weight: 0.4 },
        // the travelling range, beside the camera
        { at: (t, u) => path.pointAt(Math.min(1, u + 0.035), tmpP).set(xc + 4, 15, tmpP.z), from: rangeFrom, to: rangeTo, weight: rangeTo > rangeFrom + 0.02 ? 0.5 : 0 },
        // the chain, near: lamps, hanging field lines, the spikes reaching up to it
        ...bargePois,
        // under the lead barge: up at its cabin, lamps and the slab overhead
        { at: (t, u) => tmpV.set(xc - 1.5, 17, leadZ(u) - 3), from: uUnder - 0.07, to: uUnder - 0.004, weight: 0.62, fade: 0.35 },
        // the reveal
        { at: [0, 70, 0], from: uUnder - 0.01, to: 0.575, weight: 0.5 },
        // over the rim: down into the Crown, the mirror at its feet and the barges moored round it
        { at: [laneX * 0.5, 50, 160], from: 0.55, to: 0.665, weight: 0.85 },
        // level across the Crown at the Great Lodestone, the horizon and the low light behind it
        { at: [0, 270, 0], from: 0.635, to: 0.755, weight: 0.8 },
        // the turn-in: out over the flank to the open sea falling away below, a far chain and its range on the mirror
        { at: [A.orbit * 178, 262, 104], from: 0.725, to: 0.835, weight: 0.78, fade: 0.35 },
        { at: A.lodestoneCenter.clone(), from: 0.8, to: 0.9, weight: 0.6 },
        // the gaze rides a little above the opening on the last climb, so the Great Lodestone hangs whole over its portal
        { at: (t, u) => seatV.set(seat.x, seat.y + (76 * smoothstep(0.83, 0.87, u) - 30 * smoothstep(0.885, 0.945, u)) * (1 - smoothstep(0.955, 0.99, u)), seat.z), from: 0.8, to: 1, weight: 0.85, fade: 0.12 },
        ...(rare ? [{ at: A.lodestoneCenter.clone(), from: uRev0 - 0.01, to: uRev0 + REV + 0.02, weight: 0.5 }] : []),
      ],
      portal: { shape: 'circle', radius: 7, color: L.lamp, glow: 1.6, tilt: true, revealDistance: 320 },
      post: {
        exposure: lookId === 'silver' ? 0.88 : 0.94,
        bloom: { strength: 0.32, radius: 0.6, threshold: 1.0 },
        grade: { saturation: 1.1, contrast: 1.1, tint: L.tint, shadowTint: '#0a0907', vignette: 0.3, grain: 0.02, aberration: 0 },
      },
      update,
      dispose() { if (bargeG) bargeG.geometry.dispose(); },
    };
  },
};
