// THE TURNED COUNTRY. A country made on a lathe: every hill, tree, cloud and creature is a lacquered solid of
// revolution, only what spins can stand, and its black-and-gold mountain unscrews like a nest of dolls.
// Everything is one lacquer shader (src/parts/turned-country.js) laid in polar coordinates round each
// solid's own axis; the plain is itself a lathe profile 1,400 m in radius whose nine annuli turn alternately
// and carry their groves, villages and spindle grass round with them. No fog, no lights, no textures.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { buildHero, Prof, turn, aim, MO, cells, LACQUER_FRAG } from '../parts/turned-country.js';

const TAU = Math.PI * 2;
const S1 = new THREE.Color(-1, 0, 0), S2 = new THREE.Color(-2, 0, 0);     // sentinel colours: per-instance slots 1 and 2

// Instanced lacquer: the hero's fragment shader, fed per instance. iC1/iC2 fill the sentinel colour slots,
// iSpin = (spin rate rad/s, angle offset, orbit rate about the mountain axis, 1 = sink out of the entry lane; 2 = only
// where a hill stands; 3 = far sprigs, which also keep out of the lane on the level run),
// uniform scale is read from the instance matrix so friezes keep their size in metres.
const INST_VERT = /* glsl */`
attribute vec4 aBand, aFx; attribute vec3 aCol, aCol2, iC1, iC2; attribute vec4 iSpin; attribute float iWedge;
uniform float uTime, uOrbT, uSpinT; uniform vec3 uHill[16];
varying vec2 vUv; varying vec4 vBand, vFx; varying vec3 vCol, vCol2, vN, vP; varying float vR, vSpinA, vSpinW;
void main(){
  vCol = aCol.r < -1.5 ? iC2 : (aCol.r < -0.5 ? iC1 : aCol);
  vCol2 = aCol2.r < -1.5 ? iC2 : (aCol2.r < -0.5 ? iC1 : aCol2);
  #ifdef USE_INSTANCING
    mat4 im = instanceMatrix;
  #else
    mat4 im = mat4(1.0);
  #endif
  float sc = length(im[1].xyz);
  vUv = vec2(uv.x, uv.y * sc); vBand = vec4(aBand.x * sc, aBand.y * sc, aBand.z, aBand.w); vFx = aFx;
  vR = length(position.xz) * sc;
  float w = iSpin.x * (aFx.x == 0.0 ? 1.0 : aFx.x);            // a band's own factor lets collars counter-turn
  vSpinW = w;
  vSpinA = mod(iSpin.y * (aFx.x == 0.0 ? 1.0 : aFx.x) + w * uTime * uSpinT, 6.2832);
  vec4 wp = modelMatrix * im * vec4(position, 1.0);
  vec3 wn = mat3(modelMatrix) * mat3(im) * normal;
  vec4 base = modelMatrix * im * vec4(0.0, 0.0, 0.0, 1.0);
  // orbit with the annulus. iWedge > 0: the instance lives in a wedge of that angle about the entry lane and wraps
  // round inside it (+100: no fade at the edges, a far copy takes over there); iWedge < 0: a far copy, hidden inside the wedge
  float a0 = atan(base.x, abs(base.z) < 1e-4 ? 1e-4 : base.z), oa = iSpin.z * uOrbT, kw = 1.0;
  if (iWedge > 0.0) {
    float dW = iWedge > 100.0 ? iWedge - 100.0 : iWedge, a1 = mod(a0 + oa + 0.5 * dW, dW) - 0.5 * dW; oa = a1 - a0;
    if (iWedge < 100.0) kw = 1.0 - smoothstep(0.4 * dW, 0.5 * dW, abs(a1));
  } else if (iWedge < 0.0) { float a1 = mod(a0 + oa + 3.14159, 6.28318) - 3.14159; kw = step(-0.5 * iWedge, abs(a1)); }
  float co = cos(oa), so = sin(oa);
  wp.xz = vec2(wp.x * co + wp.z * so, -wp.x * so + wp.z * co);
  wn.xz = vec2(wn.x * co + wn.z * so, -wn.x * so + wn.z * co);
  base.xz = vec2(base.x * co + base.z * so, -base.x * so + base.z * co);
  float k = kw * mix(1.0, max(smoothstep(8.0, 15.0, abs(base.x)), 1.0 - step(40.0, base.z)), step(0.5, iSpin.w) * (1.0 - step(1.5, iSpin.w)));
  if (iSpin.w > 0.5) for (int i = 0; i < 16; i++) k *= smoothstep(uHill[i].z * 0.9, uHill[i].z * 1.12 + 2.0, length(base.xz - uHill[i].xy));   // and where a hill stands
  if (iSpin.w > 2.5) k *= max(smoothstep(14.0, 19.0, abs(base.x)), 1.0 - step(318.0, base.z));   // far sprigs keep out of the level lane
  wp.xyz = base.xyz + (wp.xyz - base.xyz) * k;                 // tall things screw down as they cross the lane
  vP = wp.xyz; vN = normalize(wn + vec3(0.0, 1e-5, 0.0));
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
// the plain: the hero's shader, but each annulus turns at its own steady rate (aFx.x) on the orbit clock
const GROUND_VERT = /* glsl */`
attribute vec4 aBand, aFx; attribute vec3 aCol, aCol2;
uniform float uOrbT, uOrbW;
varying vec2 vUv; varying vec4 vBand, vFx; varying vec3 vCol, vCol2, vN, vP; varying float vR, vSpinA, vSpinW;
void main(){
  vUv = uv; vBand = aBand; vFx = aFx; vCol = aCol; vCol2 = aCol2; vR = length(position.xz);
  vSpinW = aFx.x * uOrbW; vSpinA = mod(-aFx.x * uOrbT, 6.2832);   // same sense as the instances that ride it
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;
const FRAG = LACQUER_FRAG.replace('#include <fog_pars_fragment>', '').replace('#include <fog_fragment>', '');

// soft shadow discs, multiplied onto the plain, riding the same orbit as their solids
const DISC_VERT = /* glsl */`
attribute vec4 iDisc, iOrb;                                    // x, z, radius, strength | orbit rate, sink, y, wedge
uniform float uOrbT; uniform vec2 uStretch; uniform vec3 uHill[16];
varying vec2 vQ; varying float vK;
void main(){
  float a0 = atan(iDisc.x, abs(iDisc.y) < 1e-4 ? 1e-4 : iDisc.y), oa = iOrb.x * uOrbT, kw = 1.0, wg = iOrb.w;
  if (wg > 0.0) {
    float dW = wg > 100.0 ? wg - 100.0 : wg, a1 = mod(a0 + oa + 0.5 * dW, dW) - 0.5 * dW; oa = a1 - a0;
    if (wg < 100.0) kw = 1.0 - smoothstep(0.4 * dW, 0.5 * dW, abs(a1));
  } else if (wg < 0.0) { float a1 = mod(a0 + oa + 3.14159, 6.28318) - 3.14159; kw = step(-0.5 * wg, abs(a1)); }
  float co = cos(oa), so = sin(oa);
  vec2 b = vec2(iDisc.x * co + iDisc.y * so, -iDisc.x * so + iDisc.y * co);
  float k = kw * mix(1.0, max(smoothstep(8.0, 15.0, abs(b.x)), 1.0 - step(40.0, b.y)), step(0.5, iOrb.y) * (1.0 - step(1.5, iOrb.y)));
  if (iOrb.y > 0.5) for (int i = 0; i < 16; i++) k *= smoothstep(uHill[i].z * 0.9, uHill[i].z * 1.12 + 2.0, length(b - uHill[i].xy));
  if (iOrb.y > 2.5) k *= max(smoothstep(14.0, 19.0, abs(b.x)), 1.0 - step(318.0, b.y));
  vQ = position.xy; vK = iDisc.w * k;
  vec2 q = position.xy * iDisc.z * k;
  q += uStretch * (dot(q, normalize(uStretch + vec2(1e-4, 0.0))) * length(uStretch) + iDisc.z * 0.6);   // late light: ovals, thrown downsun
  gl_Position = projectionMatrix * viewMatrix * vec4(b.x + q.x, iOrb.z, b.y + q.y, 1.0);   // the disc quad lies in xz
}`;
const DISC_FRAG = /* glsl */`
varying vec2 vQ; varying float vK;
void main(){ float a = (1.0 - smoothstep(0.5, 1.0, length(vQ))) * vK; gl_FragColor = vec4(mix(vec3(1.0), vec3(0.58, 0.47, 0.40), a), 1.0); }`;

// strings: camera-facing ribbons between two points, never thinner than two pixels
const STR_VERT = /* glsl */`
attribute vec3 iA, iB; attribute float iW;
uniform float uPix;
void main(){
  vec4 a = viewMatrix * vec4(iA, 1.0), b = viewMatrix * vec4(iB, 1.0);
  b = mix(a, b, 1.0 - smoothstep(105.0, 165.0, -a.z));          // far strings reel in to nothing: no poles on the horizon
  vec4 p = mix(a, b, position.y);
  vec2 d = b.xy - a.xy; float dl = length(d); d = dl > 1e-4 ? d / dl : vec2(0.0, 1.0);
  float w = max(iW, 1.6 * uPix * max(-p.z, 0.1));
  p.xy += vec2(-d.y, d.x) * position.x * w;
  gl_Position = projectionMatrix * p;
}`;
const STR_FRAG = /* glsl */`uniform vec3 uCol; void main(){ gl_FragColor = vec4(uCol, 1.0); }`;

// the sky: the inside of a vast turned bowl, nine lathe bands round the zenith pole, the sun a soft boss
const SKY_VERT = /* glsl */`varying vec3 vD; void main(){ vD = position; vec4 p = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uLo, uHi, uSun, uSunCol, uUnder; uniform float uTime, uBoss;
varying vec3 vD;
void main(){
  vec3 d = normalize(vD + vec3(0.0, 1e-5, 0.0));
  float y = clamp(d.y, -1.0, 1.0);
  vec3 c = mix(uLo, uHi, smoothstep(0.02, 0.5, y)); c = mix(c, uHi * vec3(0.9, 0.95, 1.0), smoothstep(0.45, 1.0, y) * 0.5);
  float zen = 1.0 - y;                                          // 0 at the pole
  float a = atan(d.z, abs(d.x) < 1e-5 ? 1e-5 : d.x) + uTime * 0.02618;   // one turn in 240 s
  float rr = zen * 11.0 + 0.045 * sin(a * 3.0) + 0.02 * sin(a * 7.0 + 1.0);
  float fr = fract(rr), band = smoothstep(0.0, 0.06, fr) * (1.0 - smoothstep(0.42, 0.5, fr));
  float chat = 0.5 + 0.5 * sin(a * 96.0 + floor(rr) * 2.4);    // faint chatter marks so the turning shows
  c *= 1.0 - (0.028 + 0.012 * chat) * band * step(rr, 9.6) * smoothstep(0.02, 0.2, y);
  c *= 1.0 - 0.05 * (1.0 - smoothstep(0.0, 0.012, abs(fr - 0.03))) * step(rr, 9.6) * smoothstep(0.02, 0.2, y);
  float cs = dot(d, uSun);
  float boss = smoothstep(cos(0.0436 * uBoss), cos(0.036 * uBoss), cs);          // 5 degrees wide
  float halo = max(cs, 0.0); halo *= halo; halo *= halo; halo *= halo; halo *= halo;
  c += uSunCol * (boss * 2.2 + halo * halo * 0.35 + halo * 0.06);
  c *= 1.0 + 0.18 * smoothstep(cos(0.066 * uBoss), cos(0.058 * uBoss), cs) * (1.0 - boss);  // a turned bead round the boss
  c = mix(c, uUnder, 1.0 - smoothstep(-0.08, 0.0, y));
  gl_FragColor = vec4(c, 1.0);
}`;

// birch shavings: curled ribbons that spiral down round the camera, the world's snow
const SHAV_VERT = /* glsl */`
attribute vec4 iSeed;
uniform float uTime, uFall; uniform vec3 uCam, uSun;
varying float vL; varying float vF;
void main(){
  float box = 90.0, hbox = 60.0;
  vec3 o = vec3(iSeed.x, iSeed.y, iSeed.z) * vec3(box, hbox, box);
  float t = uTime * (0.6 + 0.5 * iSeed.w);
  o.y -= t * 3.2 * uFall; o.x += sin(t * 0.9 + iSeed.w * 30.0) * 2.5; o.z += cos(t * 0.7 + iSeed.w * 17.0) * 2.5;
  o = mod(o - uCam + vec3(box, hbox, box) * 0.5, vec3(box, hbox, box)) - vec3(box, hbox, box) * 0.5;
  float fade = (1.0 - smoothstep(box * 0.36, box * 0.5, length(o.xz))) * (1.0 - smoothstep(hbox * 0.38, hbox * 0.5, abs(o.y)));
  vec3 wo = o + uCam; fade *= smoothstep(0.0, 1.5, wo.y) * smoothstep(5.0, 11.0, length(o));
  // tumble: rotate the curl about a seeded axis
  float a1 = t * 2.3 + iSeed.w * 40.0, a2 = iSeed.x * 6.28 + t * 0.6;
  vec3 p = position * (0.5 + 0.7 * iSeed.w) * fade, n = normal;
  float c1 = cos(a1), s1 = sin(a1); p.xy = vec2(p.x * c1 - p.y * s1, p.x * s1 + p.y * c1); n.xy = vec2(n.x * c1 - n.y * s1, n.x * s1 + n.y * c1);
  float c2 = cos(a2), s2 = sin(a2); p.yz = vec2(p.y * c2 - p.z * s2, p.y * s2 + p.z * c2); n.yz = vec2(n.y * c2 - n.z * s2, n.y * s2 + n.z * c2);
  vL = abs(dot(n, uSun)); vF = uv.x;
  gl_Position = projectionMatrix * viewMatrix * vec4(wo + p, 1.0);
}`;
const SHAV_FRAG = /* glsl */`
uniform vec3 uCol, uUmber; varying float vL; varying float vF;
void main(){ vec3 c = uCol * mix(0.66, 1.06, smoothstep(0.1, 0.6, vL)); c = mix(c, uUmber, 0.35 * step(0.5, fract(vF * 6.0)) * 0.5);
  gl_FragColor = vec4(c, 1.0); }`;

// ---------- sixteen lathe profiles (metres; instances scale them). S1 / S2 are per-instance colours ----------
function treeProfile(kind, K, lod) {
  const P = new Prof(), st = lod ? 9 : 0.9, G = { c: K.gold, mo: MO.GOLD };
  if (kind === 0) {                                             // skittle tree, 10 m
    P.at(0.55, 0).band({ c: K.birch, mo: MO.GRAIN, gloss: 0, step: st }, lod ? [[0.34, 2.7]] : [[0.42, 0.4], [0.34, 2.7]]);
    if (!lod) P.bead(G, 0.5, 3.1, 0.28);
    if (lod) P.band({ c: S1, step: st }, [[2.2, 5.0], [1.05, 7.7]]); else P.band({ c: S1, c2: S2, mo: MO.BERRY, n: 7, hl: 1, step: st }, [[1.55, 3.7], [2.25, 5.3], [1.95, 6.9], [1.05, 7.7]]);
    if (!lod) { P.cove({ c: S2, mo: MO.REED, n: 18 }, 0.95, 8.15, 0.14); P.bead({ c: S2, c2: K.gold, mo: MO.DOTS, n: 9, spin: -3 }, 0.6, 8.95, 0.5); P.bead(G, 0, 9.9, 0.28); }
    else P.band({ c: S2, step: st }, [[1.1, 8.5], [0, 9.9]]);
  } else if (kind === 1) {                                      // baluster tree, 12 m
    P.at(0.6, 0).band({ c: K.birch, mo: MO.GRAIN, gloss: 0, step: st }, lod ? [[0.4, 2.4]] : [[0.45, 0.5], [0.4, 2.0]]);
    if (!lod) P.bead({ c: S2, c2: K.gold, mo: MO.DOTS, n: 8, spin: 2.5 }, 0.5, 2.9, 0.5);
    if (lod) P.band({ c: S1, step: st }, [[1.9, 4.2], [0.62, 8.0]]); else P.band({ c: S1, c2: S2, mo: MO.COMMA, n: 6, hl: 1, step: st }, [[1.7, 3.6], [1.95, 4.8], [1.1, 6.6], [0.62, 8.0]]);
    if (!lod) { P.bead(G, 0.62, 8.5, 0.3); P.band({ c: S1, c2: K.gold, mo: MO.PETAL, n: 5, step: st }, [[1.25, 9.1], [1.4, 10.0], [0.9, 10.9], [0.3, 11.3]]); P.bead(G, 0, 12.1, 0.3); }
    else P.band({ c: S2, step: st }, [[1.4, 9.6], [0, 12.1]]);
  } else {                                                      // bead tree, 8 m: three balls and a finial
    P.at(0.5, 0).band({ c: K.birch, mo: MO.GRAIN, gloss: 0, step: st }, lod ? [[0.3, 1.8]] : [[0.36, 0.4], [0.3, 1.8]]);
    if (!lod) {
      P.bead({ c: S1, c2: S2, mo: MO.LEAF, n: 6, hl: 1 }, 0.5, 4.4, 1.55); P.band(G, [[0.45, 4.7]]);
      P.bead({ c: S2, c2: K.gold, mo: MO.DOTS, n: 8, spin: 3 }, 0.4, 6.3, 1.0); P.band(G, [[0.36, 6.55]]);
      P.bead({ c: S1, c2: S2, mo: MO.BERRY, n: 5 }, 0.2, 7.5, 0.55); P.bead(G, 0, 8.1, 0.22);
    } else P.band({ c: S1 }, [[1.9, 3.1], [0.5, 4.5]]).band({ c: S2 }, [[1.3, 5.5], [0, 8.1]]);
  }
  return P;
}
function solidProfile(name, K, o = {}) {
  const P = new Prof(), G = { c: K.gold, mo: MO.GOLD }, B = { c: K.birch, mo: MO.GRAIN, gloss: 0 };
  switch (name) {
    case 'hill':                                                // half-sunk ogee dome, radius 1
      P.at(1.02, -0.04).band({ c: S1, c2: S2, mo: o.mo || MO.LEAF, n: 9, hl: 1, step: 0.07 }, [[1.0, 0.06], [0.93, 0.22], [0.78, 0.36], [0.6, 0.45]]);
      P.bead(G, 0.55, 0.5, 0.035).band({ c: S2, c2: K.gold, mo: MO.DOTS, n: 14, hl: 0, step: 0.07 }, [[0.42, 0.56], [0.24, 0.6], [0.12, 0.62]]);
      P.bead({ c: S1, c2: K.gold, mo: MO.DOTS, n: 6, spin: 2 }, 0.05, 0.74, 0.07).bead(G, 0, 0.82, 0.03); break;
    case 'top':                                                 // pear top, height 1
      P.at(0, 0).band(G, [[0.05, 0.12]]);
      P.band({ c: S1, c2: S2, mo: o.mo || MO.PETAL, n: 5, hl: 1, step: 0.2 }, [[0.2, 0.22], [0.35, 0.4], [0.385, 0.56], [0.3, 0.7]]);
      P.bead(G, 0.27, 0.745, 0.03).band({ c: S2, c2: K.gold, mo: MO.DOTS, n: 9, step: 0.06 }, [[0.17, 0.8], [0.085, 0.83]]);
      P.band(G, [[0.06, 0.95]]).band(G, [[0.075, 1.0], [0, 1.04]]); break;
    case 'hummer':                                              // humming top, 6 m tall, 5 m across
      P.at(0, 0).band(G, [[0.1, 0.12], [0.16, 0.4]]);
      P.band({ c: S1, c2: S2, mo: MO.DOTS, n: 16, step: 0.3 }, [[0.9, 0.9], [1.9, 1.5]]);
      P.bead(G, 2.1, 1.85, 0.12);
      P.band({ c: S1, c2: S2, mo: MO.PETAL, n: 8, hl: 1, step: 0.25 }, [[2.42, 2.3], [2.5, 2.9], [2.36, 3.5]]);
      P.bead(G, 2.2, 3.75, 0.12).cove({ c: S1, mo: MO.REED, n: 46 }, 1.3, 4.3, 0.16);
      P.bead({ c: K.gold, c2: K.black, mo: MO.DOTS, n: 9, hl: 4 }, 0.5, 4.75, 0.34);      // the pierced crown bead
      P.band(B, [[0.3, 4.85], [0.24, 5.6]]).bead(B, 0.2, 5.75, 0.16).bead(G, 0, 6.05, 0.1); break;
    case 'peg': P.at(0.16, 0).band({ c: S1, step: 9 }, [[0.13, 0.55]]).band({ c: S2, step: 9 }, [[0.2, 0.62], [0.17, 0.82], [0, 0.95]]); break;
    case 'acorn': P.at(0.1, 0).band(B, [[0.08, 0.4]]).band({ c: S1, step: 9 }, [[0.26, 0.46], [0.27, 0.62]]).band({ c: S2, step: 9 }, [[0.21, 0.66], [0.15, 0.9], [0, 1.02]]); break;
    case 'flower': P.at(0.05, 0).band(B, [[0.04, 0.72]]).band({ c: S1, c2: K.gold, mo: MO.DOTS, n: 6, step: 9 }, [[0.2, 0.78], [0.27, 0.96], [0.18, 1.12], [0, 1.18]]); break;
    case 'mushroom': P.at(0.17, 0).band(B, [[0.12, 0.2], [0.11, 0.5]]).band({ c: K.birch, mo: MO.RINGS, n: 0.05, gloss: 0 }, [[0.44, 0.5]]).band({ c: S1, c2: K.cream, mo: MO.DOTS, n: 7, step: 9 }, [[0.5, 0.58], [0.38, 0.74], [0.16, 0.84], [0, 0.86]]); break;
    case 'sprig': P.at(0.13, 0).band({ c: S1, step: 9 }, [[0.21, 0.3], [0.09, 0.56]]).band({ c: S2, step: 9 }, [[0.18, 0.72], [0, 0.95]]); break;   // far spindle grass: a ninepin, belly and bead
    case 'bobbin':                                              // cloud spool: radius 1, 0.62 tall, seen from below
      P.at(0, 0).band({ c: K.cream, mo: MO.RINGS, n: 0.09, gloss: 0, step: 0.4 }, [[0.5, 0.0], [0.93, 0.02]]);
      P.bead({ c: K.cream }, 0.93, 0.14, 0.07).band({ c: K.cream, step: 0.4 }, [[0.5, 0.17]]);
      P.cove({ c: K.blue, c2: K.cream, mo: MO.DOTS, n: 10, hl: 0 }, 0.5, 0.45, 0.12).band({ c: K.cream, step: 0.4 }, [[0.93, 0.48]]);
      P.bead({ c: K.cream }, 0.93, 0.6, 0.07).band({ c: K.cream, step: 0.4 }, [[0.2, 0.64]]).bead(G, 0, 0.78, 0.09); break;
    case 'plate':                                               // cloud plate: a wide shallow dish with a foot
      P.at(0, -0.1).band({ c: K.cream, mo: MO.RINGS, n: 0.07, gloss: 0, step: 0.4 }, [[0.3, -0.1]]).bead({ c: K.blue }, 0.38, -0.02, 0.05);
      P.band({ c: K.cream, c2: K.blue, mo: MO.COMMA, n: 9, hl: 1, step: 0.2 }, [[0.7, 0.0], [0.95, 0.08]]);
      P.bead(G, 0.95, 0.15, 0.05).band({ c: K.cream, step: 0.3 }, [[0.6, 0.08], [0, 0.06]]); break;
    case 'yoyo':                                                // radius 1.5, axis along y
      P.at(0, -0.62).band({ c: S2, c2: K.gold, mo: MO.DOTS, n: 6, step: 0.3 }, [[0.5, -0.6]]);
      P.band({ c: S1, c2: S2, mo: MO.PETAL, n: 7, hl: 1, step: 0.3 }, [[1.1, -0.52], [1.42, -0.42]]);
      P.bead(G, 1.42, -0.16, 0.1).band({ c: K.birch, mo: MO.RINGS, n: 0.12, gloss: 0, step: 0.5 }, [[0.16, -0.1]]).band({ c: K.birch, gloss: 0 }, [[0.16, 0.1]]);
      P.band({ c: K.birch, mo: MO.RINGS, n: 0.12, gloss: 0, step: 0.5 }, [[1.42, 0.16]]).bead(G, 1.42, 0.42, 0.1);
      P.band({ c: S1, c2: S2, mo: MO.PETAL, n: 7, hl: 1, step: 0.3 }, [[1.1, 0.52], [0.5, 0.6]]).band({ c: S2, c2: K.gold, mo: MO.DOTS, n: 6, step: 0.3 }, [[0, 0.62]]); break;
    case 'diabolo':                                             // 2 m hourglass, axis along y
      P.at(0, -1).band({ c: K.birch, mo: MO.RINGS, n: 0.1, gloss: 0, step: 0.4 }, [[0.6, -1]]).bead(G, 0.68, -0.86, 0.07);
      P.band({ c: S1, c2: S2, mo: MO.COMMA, n: 5, hl: 0, step: 0.16 }, [[0.52, -0.6], [0.26, -0.26], [0.13, -0.06]]).bead(G, 0.13, 0.06, 0.05);
      P.band({ c: S2, c2: S1, mo: MO.COMMA, n: 5, hl: 0, step: 0.16 }, [[0.26, 0.26], [0.52, 0.6], [0.68, 0.86]]).bead(G, 0.6, 1, 0.07);
      P.band({ c: K.birch, mo: MO.RINGS, n: 0.1, gloss: 0, step: 0.4 }, [[0, 1]]); break;
    case 'ball':                                                // cup-and-ball: the ball, with a gold plug at each pole and a raised gold equator
      P.at(0, -1.0).band(G, [[0.1, -0.97], [0.13, -0.88], [0.08, -0.8]]);
      P.band({ c: S1, c2: S2, mo: MO.BERRY, n: 5, hl: 0, step: 0.3 }, [[0.31, -0.74], [0.57, -0.57], [0.74, -0.31], [0.8, -0.07]]).bead(G, 0.8, 0.07, 0.07);
      P.band({ c: S2, c2: S1, mo: MO.DOTS, n: 7, step: 0.3 }, [[0.74, 0.31], [0.57, 0.57], [0.31, 0.74], [0.08, 0.8]]).band(G, [[0.13, 0.88], [0.1, 0.97], [0, 1.0]]); break;
    case 'house':                                               // peg house, 3 m: birch body, ogee roof, bead chimney
      P.at(0.86, 0).band({ c: K.birch, c2: K.black, mo: MO.DOTS, n: 5, gloss: 0.3, step: 9 }, [[0.8, 1.5]]).band({ c: S1, step: 9 }, [[1.12, 1.52]]);
      P.band({ c: S1, c2: K.gold, mo: MO.DOTS, n: 7, step: 9 }, [[1.0, 1.9], [0.5, 2.3], [0.2, 2.8]]).band(G, [[0.26, 2.95], [0, 3.2]]); break;
    case 'onion':                                               // village spindle, 9 m
      P.at(0.7, 0).band(B, [[0.5, 0.5], [0.42, 3.4]]).bead(G, 0.5, 3.9, 0.3);
      P.band({ c: S1, c2: K.gold, mo: MO.COMMA, n: 7, hl: 1, step: 0.5 }, [[1.5, 4.4], [1.75, 5.3], [1.1, 6.6], [0.4, 7.4]]).bead(G, 0.2, 7.9, 0.22);
      P.band(G, [[0.1, 8.3], [0, 9]]); break;
    case 'bird':                                                // top-bird: a wingless teardrop twice as long as wide, beak up the axis
      P.at(0, -0.4).band({ c: S1, step: 9 }, [[0.1, -0.385], [0.2, -0.3]]);
      P.band({ c: S1, c2: S2, mo: MO.DOTS, n: 5, hl: 2, step: 9 }, [[0.255, -0.16], [0.235, 0.02], [0.16, 0.2]]);
      P.band({ c: S2, step: 9 }, [[0.085, 0.36]]).band(G, [[0.05, 0.44], [0.035, 0.5], [0, 0.66]]); break;
  }
  return P;
}

// The spindle grass that stands nearest the eye: each piece has a bead, a cove, a finial and a painted band, and a round
// outline. A thin stem turned at six sides and a head at eleven or twelve are merged, so the roundness is paid for
// only where it shows.
function hiGrass(name, K) {
  const G = { c: K.gold, mo: MO.GOLD, step: 9 }, B = { c: K.birch, mo: MO.GRAIN, gloss: 0, step: 9 }, lo = new Prof(), hi = new Prof();
  let sl = 6, sh = 9;
  if (name === 'peg') {
    lo.at(0.17, 0).band({ c: S1, step: 9 }, [[0.12, 0.14], [0.1, 0.4]]);
    hi.at(0.1, 0.4).band(G, [[0.2, 0.48]]).band({ c: S2, c2: K.gold, mo: MO.DOTS, n: 6, step: 0.1 }, [[0.28, 0.6], [0.26, 0.75], [0.14, 0.86]]);   // step 0.1: the bead is resampled round
    hi.band({ c: S1, step: 9 }, [[0.1, 0.9]]).band(G, [[0.09, 0.96], [0, 1.06]]);
  } else if (name === 'acorn') {
    lo.at(0.1, 0).band(B, [[0.08, 0.4]]);
    hi.at(0.08, 0.4).band({ c: S1, c2: K.gold, mo: MO.DOTS, n: 7, step: 0.1 }, [[0.25, 0.44], [0.3, 0.56], [0.26, 0.66]]).band(G, [[0.22, 0.69]]);
    hi.band({ c: S2, step: 9 }, [[0.2, 0.81], [0.11, 0.94]]).band(G, [[0.05, 0.98], [0, 1.06]]);
  } else if (name === 'flower') {
    sl = 5; sh = 9;
    lo.at(0.05, 0).band(B, [[0.035, 0.7]]);
    hi.at(0.035, 0.7).band({ c: S2, step: 9 }, [[0.12, 0.74]]).band({ c: S1, c2: K.gold, mo: MO.DOTS, n: 6, step: 0.1 }, [[0.25, 0.82], [0.3, 0.95], [0.22, 1.08]]);
    hi.band(G, [[0.08, 1.15], [0, 1.24]]);
  } else {                                                     // mushroom
    sh = 10;
    lo.at(0.17, 0).band(B, [[0.12, 0.2], [0.11, 0.5]]);
    hi.at(0.11, 0.5).band({ c: K.birch, mo: MO.RINGS, n: 0.05, gloss: 0, step: 9 }, [[0.46, 0.5]]).band({ c: S1, c2: K.cream, mo: MO.DOTS, n: 7, step: 0.14 }, [[0.52, 0.58], [0.42, 0.73], [0.2, 0.84]]);
    hi.band(G, [[0.06, 0.9], [0, 0.97]]);
  }
  const a = turn(lo, sl, 1), b = turn(hi, sh, 1), g = mergeGeometries([a, b], false);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.6, 0), 1.4); g.boundingBox = new THREE.Box3(new THREE.Vector3(-0.6, 0, -0.6), new THREE.Vector3(0.6, 1.3, 0.6));
  a.dispose(); b.dispose();
  return g;
}

// one InstancedMesh fed by set(i, matrix, c1, c2, spinRate, angle, orbitRate, sink)
function makeInst(geo, mat, count, name) {
  const n = Math.max(1, count), mesh = new THREE.InstancedMesh(geo, mat, n);
  const c1 = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3), c2 = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
  const sp = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4), wg = new THREE.InstancedBufferAttribute(new Float32Array(n), 1);
  geo.setAttribute('iC1', c1); geo.setAttribute('iC2', c2); geo.setAttribute('iSpin', sp); geo.setAttribute('iWedge', wg);
  mesh.frustumCulled = false; mesh.name = name; mesh.count = count;
  return {
    mesh, count, spin: sp,
    set(i, m, a, b, rate = 0, ang = 0, orb = 0, sink = 0, wedge = 0) {
      mesh.setMatrixAt(i, m); c1.setXYZ(i, a.r, a.g, a.b); c2.setXYZ(i, b.r, b.g, b.b); sp.setXYZW(i, rate, ang, orb, sink); wg.setX(i, wedge);
    },
  };
}

const LACQUER_SETS = [
  { name: 'black, vermilion and gold', pal: ['#15110E', '#D33B22', '#E4B23F', '#EBDAB6', '#7E9F6B', '#D2E2E4', '#9C6B45'], cream: '#F1ECE0' },
  { name: 'cream and cherry', pal: ['#1B1613', '#EADFC2', '#C2283A', '#EBDAB6', '#4F8A4B', '#D8E0D4', '#9C6B45'], cream: '#F3EEDF' },
  { name: 'cobalt and silver', pal: ['#1D3C8C', '#EFEDE6', '#C3CAD3', '#EBDAB6', '#86AAD6', '#D2E2E4', '#8E7458'], cream: '#F4F3EE' },
];
const LIGHTS = [
  { name: 'morning window', sun: [-0.42, 0.81, 0.41], key: '#FFFAF0', lo: '#F4E9D0', hi: '#C9DDE2', win: [0.16, 0.22, 0, 0.03], winK: [1.6, 1, 0], boss: 1, sunCol: '#FFE9C0', stretch: 0, exposure: 1 },
  { name: 'overcast skylight', sun: [-0.2, 0.95, 0.24], key: '#F3F4F1', lo: '#E6E4DB', hi: '#A7B5BE', win: [0.36, 0.3, 0, 0.16], winK: [0.5, 0, 0], boss: 3.2, sunCol: '#B9B4A8', stretch: 0, exposure: 1.03 },
  // late: a low amber sun, an amber-gold horizon under a deeper blue-grey bowl, a warm key, long slanted panes and oval shadows
  { name: 'late amber window', sun: [-0.74, 0.36, 0.57], key: '#FFEDCE', lo: '#F3C888', hi: '#8DA4BA', win: [0.1, 0.36, 0.55, 0.03], winK: [1.7, 1, 0], boss: 1.35, sunCol: '#FFBE6A', stretch: 1.25, exposure: 0.97 },
];

export default {
  id: 'turned-country',
  name: 'The Turned Country',
  category: 'bizarre',
  weirdness: 0.85,
  media: ['air', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = clamp(ctx.quality?.detail ?? 1, 0.5, 1), density = clamp(vary.density ?? 1, 0.7, 1.3);
    const scene = new THREE.Scene();

    // ---------- the seeded look: lacquer set, light, season, cast ----------
    const vr = rng.fork('visit-1326');                               // (label chosen so the test seeds show three different visits: 3 morning, 8 late amber, 21 cobalt)
    const set = LACQUER_SETS[vr() < 0.44 ? 0 : (vr() < 0.5 ? 1 : 2)];
    let li = vr() < 0.44 ? 0 : (vr() < 0.5 ? 1 : 2);
    if (vary.hour === 'golden' || vary.hour === 'night') li = 2; else if (vary.hour === 'dawn') li = 0; else if (vary.hour === 'day' && li === 2) li = 0;   // 2 = late amber
    const light = LIGHTS[li];
    const season = vr.pick(['light', 'heavy', 'blossom']);          // light shavings | a heavy fall | none, berries swapped for blossom
    const rare = !!vary.rare;                                        // the country goes back on the lathe at u 0.5
    const cast = { tops: Math.round(clamp(vr.range(40, 90) * density, 40, 90)), hummer2: vr.chance(0.4), cupBall: vr.chance(0.4) };
    const sunDir = new THREE.Vector3(...light.sun).normalize();

    // ---------- the hero: the Nesting Mountain at the origin, front toward +Z ----------
    const hero = await buildHero(ctx, { palette: set.pal, detail: detail * 0.62, sunDir, keyColor: light.key, skyLow: light.lo, skyHigh: light.hi, portalGlow: false, groundShadows: false });
    scene.add(hero.object);
    const U = hero.uniforms, K = hero.colors, A = hero.anchors;
    K.cream = aim(set.cream);
    U.uWin.value.set(...light.win); U.uWinK.value.set(...light.winK);
    const orb = { uOrbT: { value: 0 }, uOrbW: { value: 1 }, uHill: { value: Array.from({ length: 16 }, () => new THREE.Vector3(1e5, 1e5, 1)) } };
    const instMat = (spinT) => new THREE.ShaderMaterial({ uniforms: Object.assign({}, U, orb, { uSpinT: { value: spinT } }), vertexShader: INST_VERT, fragmentShader: FRAG });
    const matSpin = instMat(1), matCpu = instMat(0);                 // spin angle from time | from the CPU each frame
    await ctx.yield();

    // ---------- the flight: the hero's own line ----------
    // the hero's line, with the end of the spiral and the closing turn lifted onto the dive's own 25 degree slope,
    // so the ring in its bowl is seen over the rims all the way in (a sight line over the 31 m outer rim)
    const pts = A.flyThrough.map((p) => p.clone()), nP = pts.length;
    for (let i = 6; i <= 16 && i < nP - 7; i++) pts[i].y = 86 - (86 - pts[i].y) * 0.85;
    if (nP >= 24) {
      const lift = [49, 55, 59, 61.2];
      for (let k = 0; k < 4; k++) pts[nP - 7 + k].y = lift[k];
      [1, 0.86, 0.82, 0.92].forEach((q, k) => { pts[nP - 7 + k].x *= q; pts[nP - 7 + k].z *= q; });   // close the turn tighter: the ring is larger, sooner
      pts[nP - 3].set(0.6, A.portalSeat.position.y + Math.tan(THREE.MathUtils.degToRad(25)) * 82, 82);
    }
    pts.splice(1, 0, new THREE.Vector3(0, 8.4, 470));               // hold the entry run level past the top-birds (the spline sagged to 5 m)
    const path = makePath(pts);
    const summit = new THREE.Vector3(), TABLEAU = new THREE.Vector3(-8, 58, -6);
    const gaze = (time, u) => {
      const s = A.summits; let y = s[s.length - 1].y;
      for (let i = 0; i < s.length - 1; i++) if (u < s[i + 1].u) { y = lerp(s[i].y, s[i + 1].y, smoothstep(s[i].u, s[i + 1].u, u)); break; }
      if (u < s[0].u) y = s[0].y;
      y = Math.max(12, y * (u < 0.3 ? 0.62 : 0.8));
      const lift = smoothstep(0.49, 0.56, u) * (1 - smoothstep(0.62, 0.69, u));          // look across at the hanging bells while the gold one rises
      // the tableau: from u 0.55 the gaze drops to the gold bell's shoulder and swings a little left of the axis, so the three
      // settled bells hang across the top of the frame, the gold one rises below them and the rims and plain fill the bottom
      const tab = smoothstep(0.545, 0.595, u) * (1 - smoothstep(0.63, 0.68, u));
      return summit.set(0, lerp(y, 96, lift), 0).lerp(TABLEAU, tab);
    };

    // ---------- sky: the inside of a turned bowl ----------
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
      uniforms: { uLo: { value: aim(light.lo) }, uHi: { value: aim(light.hi) }, uSun: { value: sunDir }, uSunCol: { value: new THREE.Color(light.sunCol) },
        uUnder: { value: aim('#C9A77C') }, uTime: U.uTime, uBoss: { value: light.boss } },
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(3000, 48, 24), skyMat);
    sky.renderOrder = -1; sky.frustumCulled = false; sky.name = 'sky-bowl'; scene.add(sky);

    // ---------- the plain: one lathe profile, rim to mountain, nine annuli that turn alternately ----------
    const gr = rng.fork('ground');
    const ANN = [], FIELDS = [];                                   // annuli, and the flat sub-bands things may stand on
    {
      const R_OUT = 1400, R_IN = 46, wsum = [], types = [];
      const order = gr.shuffle(['birch', 'sage', 'verm', 'moat']);
      for (let i = 0; i < 9; i++) { wsum.push(gr.range(90, 220)); types.push(order[i % 4]); }
      const tot = wsum.reduce((a, b) => a + b, 0), kW = (R_OUT - 64) / tot;
      { // under the crown (the close pass looks straight down on it) the set's strong field; under the climb a lacquer field
        const pin = (i, want) => { if (types[i] === want) return; for (let j = 8; j > i; j--) if (types[j] === want) { types[j] = types[i]; types[i] = want; return; } };
        pin(0, 'verm'); pin(1, 'sage');
      }
      { // the herd and the Hummer cross on a painted field with rows standing in it, never over a moat: trade that annulus's type inward
        const pH = path.pointAt(0.15), rH = Math.hypot(pH.x, pH.z); let ro = R_OUT, iH = 0;
        for (let i = 8; i >= 0; i--) { const ri = i === 0 ? 64 : ro - wsum[i] * kW; if (rH <= ro && rH > ri) iH = i; ro = ri; }
        if (types[iH] === 'moat') { const j = iH > 2 ? iH - 1 : iH + 1; types[iH] = types[j]; types[j] = 'moat'; }
      }
      let P = new Prof(); const GR = 8, profs = [P];                                // GR: the tool-groove flag
      const G = { c: K.gold, mo: MO.GOLD }, blos = season === 'blossom';
      // the strong painted field of each lacquer set: vermilion; cherry with cream strokes; deep cobalt with white blossoms
      // (in the cherry and cobalt sets the "vermilion" slot is the pale ground coat, which would leave the plain white on white)
      const si0 = LACQUER_SETS.indexOf(set), FV = si0 === 1 ? K.gold : si0 === 2 ? K.black : K.verm, FS = si0 === 0 ? (blos ? K.cream : K.black) : K.verm;
      // the table rim, bead and cove in black and gold
      P.at(1486, 30).bead(G, 1464, 42, 6);
      P.band({ c: K.black, c2: K.verm, mo: MO.COMMA, n: cells(1450, 20, 1.2), hl: 1, step: 40 }, [[1452, 31], [1440, 15]]);
      P.cove({ c: K.black, mo: MO.REED, n: 1400 }, 1420, 6, 3.5).bead(G, 1400, 0, 2.6);
      let r = R_OUT;
      for (let i = 8; i >= 0; i--) {                               // outermost annulus first: the profile runs inward
        const w = wsum[i] * kW, rIn = i === 0 ? 64 : r - w, type = types[i], rmid = (r + rIn) / 2;
        const rate = (i % 2 ? -1 : 1) * Math.min(THREE.MathUtils.degToRad(gr.range(0.2, 1.2)), 5.5 / rmid);
        const ann = { rOut: r, rIn, type, rate }; ANN.push(ann);
        const f = (o) => ({ step: 400, spin: rate, seed: gr(), ...o });
        if (profs.length === 1 && r < 720) { P.band({ c: K.gold, mo: MO.GOLD, step: 400 }, [[r - 3, -0.25]]); P = new Prof(); P.at(r, 0); profs.push(P); }   // coarse outer mesh tucks under the fine inner one
        if (i < 8) {                                               // the bead ridge that parts it from its neighbour
          const rw = gr.range(5, 9), rb = gr.range(1.1, 2.8), dark = i % 2 === 0;
          P.band(f({ c: K.gold, mo: MO.GOLD }), [[r - 0.8, 0.25]]);
          P.band(f({ c: dark ? K.black : FV, c2: si0 === 1 ? K.verm : K.gold, mo: MO.DOTS, n: cells(r, rw * 0.9, 1.3) }), [[r - 0.8 - rw * 0.2, 0.25 + rb * 0.7], [r - 0.8 - rw * 0.5, 0.25 + rb], [r - 0.8 - rw * 0.8, 0.25 + rb * 0.7], [r - 0.8 - rw, 0.25]]);
          P.band(f({ c: K.gold, mo: MO.GOLD }), [[r - 1.6 - rw, 0]]);
          r -= 1.6 + rw;
        }
        let alt = 0;
        while (r > rIn + 0.5) {
          let w2 = Math.min(r - rIn, gr.range(11, 20)); if (r - rIn - w2 < 4) w2 = r - rIn;
          const r2 = r - w2, flat = [[r2, 0]]; let stand = true;
          if (type === 'birch') {
            const bc = alt % 4 === 1 ? FV : (alt % 4 === 3 ? K.black : K.sage);
            if (alt % 2 === 1) P.band(f({ c: K.birch, c2: bc, mo: alt % 4 === 3 ? MO.COMMA : (blos ? MO.PETAL : MO.BERRY), n: cells(r, w2, 1.4), gloss: 0.3, hl: 1 + GR }), flat);
            else P.band(f({ c: K.birch, mo: MO.RINGS, n: gr.range(0.22, 0.4), gloss: 0, hl: 1 + GR }), flat);
          } else if (type === 'sage') {
            const mo = alt % 2 ? gr.pick([MO.LEAF, MO.COMMA]) : MO.DOTS;
            P.band(f({ c: K.sage, c2: mo === MO.DOTS ? K.gold : K.cream, mo, n: cells(r, w2, mo === MO.DOTS ? 0.5 : 1.25), hl: 1 + GR, gloss: 0.7 }), flat);
          } else if (type === 'verm') {
            const mo = blos ? MO.PETAL : (alt % 3 === 1 ? MO.COMMA : MO.BERRY);
            P.band(f({ c: FV, c2: FS, mo: si0 === 0 ? mo : (alt % 3 === 1 ? MO.COMMA : MO.PETAL), n: cells(r, w2, 1.3), hl: 1 + GR, gloss: 0.7 }), flat);
          } else if (alt % 2 === 0 && r - rIn > 9) {                // moat country: blue-grey coves between birch walks
            w2 = Math.min(r - rIn, gr.range(9, 14)); stand = false;
            const wave = { c: K.blue, c2: K.cream, mo: MO.COMMA, n: cells(r, w2 * 0.5, 1.1) };
            P.band(f({ c: K.gold, mo: MO.GOLD }), [[r - 0.9, 0.12]]).band(f({ ...wave, seed: 0.13 }), [[r - 0.9 - (w2 - 1.8) * 0.25, -0.42], [r - w2 * 0.5, -0.6]]);
            P.band(f({ ...wave, seed: 0.63 }), [[r - w2 + 0.9 + (w2 - 1.8) * 0.25, -0.42], [r - w2 + 0.9, 0.12]]).band(f({ c: K.gold, mo: MO.GOLD }), [[r - w2, 0]]);
          } else P.band(f({ c: K.birch, mo: MO.RINGS, n: gr.range(0.2, 0.34), gloss: 0, hl: GR }), flat);
          if (stand) FIELDS.push({ rOut: r - 0.6, rIn: r - w2 + 0.6, rate, type, ann });
          r -= w2; alt++;
        }
        r = rIn;
      }
      P.band({ c: K.gold, mo: MO.GOLD, step: 400 }, [[62, 0.4]]).band({ c: K.birch, mo: MO.RINGS, n: 0.3, gloss: 0, step: 400 }, [[R_IN, 0.4]]);
      const gmat = new THREE.ShaderMaterial({ uniforms: Object.assign({}, U, orb, { uWin: { value: new THREE.Vector4(0.3, 0.3, 0, 0.7) }, uWinK: { value: new THREE.Vector3(0.14, 0, 0) } }),
        vertexShader: GROUND_VERT, fragmentShader: FRAG });   // no window on the ground: a broad soft sheen only
      for (let k = 0; k < profs.length; k++) {
        await ctx.yield();
        const seg = Math.round((profs.length > 1 && k === 0 ? 64 : 120) * (0.7 + 0.3 * detail) / 4) * 4;
        const ground = new THREE.Mesh(turn(profs[k], seg, 1), gmat); ground.name = 'turned-plain-' + k; ground.frustumCulled = false; scene.add(ground);
      }
    }
    await ctx.yield();

    // ---------- flora and villages: placement lists first, instanced meshes after ----------
    const fr = rng.fork('flora');
    const pairs = [[K.sage, K.verm], [K.black, K.verm], [K.verm, K.black], [K.sage, K.cream], [K.black, K.gold], [K.verm, K.cream]];
    const L = { treeN: [[], [], []], treeF: [[], [], []], treeG: [[], [], []], pegH: [], acornH: [], flowerH: [], mushroomH: [], hill: [], house: [], onion: [], peg: [], acorn: [], flower: [], mushroom: [], sprig: [], well: [] };
    const discs = [];
    const put = (list, a, r, s, c, spin, rate, sink, wedge, discR, y = 0) => {
      list.push({ a, r, s, c, spin, rate, sink, wedge, y });
      if (discR > 0) discs.push({ x: Math.sin(a) * r, z: Math.cos(a) * r, rad: discR * s * 1.15, k: 1, rate, sink, y: y + 0.16, wedge });
    };
    const treeW = [2.25, 1.95, 2.05];
    const village = (a0, r0, rate, wedge, n, y = 0, ringR = 0, k = 1) => {       // peg houses round an onion spindle
      const cx = Math.sin(a0) * r0, cz = Math.cos(a0) * r0, R = (ringR || fr.range(9, 13)) * k, roof = fr.pick([K.verm, K.verm, K.sage, K.black]);
      const at = (x, z) => [Math.atan2(x, z), Math.hypot(x, z)];
      put(L.onion, a0, r0, fr.range(0.9, 1.15) * k, [roof, K.gold], fr.range(0.3, 0.6) * fr.sign(), rate, 1, wedge, 1.75, y);
      for (let j = 0; j < n; j++) {
        const ring = j % 3 === 2 ? 1.55 : 1, b = (j / n) * TAU + fr.range(-0.08, 0.08), [a, r] = at(cx + Math.sin(b) * R * ring, cz + Math.cos(b) * R * ring);
        put(L.house, a, r, fr.range(0.75, 1.3) * k, [fr.chance(0.8) ? roof : K.black, K.gold], fr.range(0.2, 0.5) * fr.sign(), rate, 1, wedge, 1.12, y);
      }
      for (let j = 0; j < 22; j++) { const b = (j / 22) * TAU, [a, r] = at(cx + Math.sin(b) * R * 2.0, cz + Math.cos(b) * R * 2.0); put(L.peg, a, r, 1.5 * k, [K.birch, roof], 0.6, rate, 0, wedge, 0.2, y); }
      const [aw, rw] = at(cx + R * 0.45, cz + R * 0.3); put(L.well, aw, rw, 1.3 * k, [K.cream, K.cream], 1.5, rate, 0, wedge, 0.95, y + 0.1);
    };
    let laneVillage = true, farVillages = 0;                          // the lane village is placed by hand below, where the entry sees it
    for (const ann of ANN) {
      await ctx.yield();
      const flds = FIELDS.filter((f) => f.ann === ann && f.rOut - f.rIn > 6); if (!flds.length) continue;
      const rmid = (ann.rOut + ann.rIn) / 2, mode = rmid < 190 ? 'all' : (ann.rIn < 690 ? 'wedge' : 'far');
      const M = Math.max(2, Math.round(TAU * rmid / 190)), dW = TAU / M, span = mode === 'wedge' ? dW : TAU;
      const groves = mode === 'all' ? 4 : mode === 'wedge' ? 2 : Math.round(fr.int(4, 5) * detail * Math.min(1, density));
      for (let g = 0; g < groves; g++) {
        const f = fr.pick(flds), kind = fr.int(0, 2), pr = fr.pick(pairs), a0 = (g + fr.range(0.1, 0.6)) / groves * span - span / 2;
        const n = mode === 'far' ? fr.int(4, 6) : fr.int(4, 5), rows = f.rOut - f.rIn > 9 ? 2 : 1;
        for (let j = 0; j < n; j++) for (let q = 0; q < rows; q++) {
          const r = lerp(f.rIn, f.rOut, rows === 1 ? 0.5 : 0.25 + 0.5 * q) , a = a0 + (j + q * 0.5) * fr.range(11, 13) / r, s = fr.range(0.62, 1.2);
          const spin = TAU / fr.range(20, 60) * fr.sign(), c = fr.chance(0.75) ? pr : fr.pick(pairs);
          if (mode !== 'far') put(L.treeN[kind], a, r, s, c, spin, ann.rate, 1, mode === 'wedge' ? 100 + dW : 0, treeW[kind]);
          if (mode === 'wedge') { for (let k = 1; k < M; k++) if (k % 2 === 1 && (detail > 0.9 || k % 3)) put(L.treeF[kind], a + k * dW, r, s, c, spin, ann.rate, 1, -dW, treeW[kind]); }
          if (mode === 'far') put(L.treeF[kind], a, r, s, c, spin, ann.rate, 0, 0, treeW[kind]);
        }
      }
      // hills: only where the path is far above or far away
      if (mode !== 'wedge' && ann.type !== 'moat') {
        const nh = mode === 'all' ? 3 : fr.int(2, 4);
        for (let h = 0; h < nh; h++) {
          const f = fr.pick(flds), s = mode === 'all' ? fr.range(5, Math.min(11, (f.rOut - f.rIn) * 0.7)) : fr.range(16, 38);
          const a = mode === 'all' ? Math.PI + fr.range(-2.2, 2.2) : fr.range(0, TAU);
          put(L.hill, a, (f.rIn + f.rOut) / 2, s, fr.pick(pairs), fr.range(0.05, 0.12) * fr.sign(), ann.rate, 0, 0, 1.0);
        }
      }
      // villages: one that keeps to the entry lane, the rest scattered on the outer rings
      if (mode === 'wedge' && !laneVillage && rmid > 300 && ann.type !== 'moat') { laneVillage = true; village(30 / rmid, rmid, ann.rate, TAU / Math.round(TAU * rmid / 150), 34); }
      else if (mode === 'far' && farVillages < 4 && ann.rIn < 1250) { farVillages++; village(fr.range(-0.5, 0.5) + (farVillages % 2 ? 0.25 : -0.3), rmid, ann.rate, 0, fr.int(30, 38)); if (farVillages < 4 && fr.chance(0.6)) { farVillages++; village(Math.PI + fr.range(-1.2, 1.2), rmid, ann.rate, 0, fr.int(30, 38)); } }
    }
    // the gate: two groves of baluster, skittle and bead trees either side of the entry line, receding toward the mountain
    // (they keep their place; the plain turns under them). The right grove stays wide of the lane village.
    const GATE = [[-11.5, 548, 1.2, 1], [-13.5, 531, 1.12, 0], [-18.5, 540, 1.0, 2], [-15, 510, 1.16, 1], [-22, 519, 1.05, 0], [-19, 490, 1.1, 2], [-27.5, 499, 1.2, 1], [-24, 470, 1.0, 0],
      [11.5, 547, 1.18, 0], [14.5, 533, 1.1, 1], [19.5, 542, 1.0, 2], [24, 529, 1.2, 1], [28, 520, 1.05, 0], [31, 538, 1.15, 1], [36, 524, 1.0, 2]];
    GATE.forEach(([x0, z0, s0, kind], j) => {
      const x = x0 + fr.range(-0.6, 0.6) * (Math.abs(x0) > 12 ? 1 : 0), z = z0 + fr.range(-2, 2);
      put(L.treeG[kind], Math.atan2(x, z), Math.hypot(x, z), s0 * fr.range(0.94, 1.06), pairs[(j + (x0 > 0 ? 1 : 0)) % pairs.length], TAU / fr.range(18, 30) * Math.sign(x0), 0, 0, 0, treeW[kind]);
    });
    // the middle scale: ogee hills 16 to 38 m with banded crowns and finials, standing still while the annuli turn under
    // them. Five are set where the entry frame wants them; the rest are scattered round the country for the spiral.
    const HILLS = [[-78, 430, 30], [80, 262, 34], [-64, 262, 30], [-135, 250, 38], [150, 380, 26], [100, 392, 28], [-111, -115, 20]];
    const hillAt = [];
    for (const [x, z, s] of HILLS) hillAt.push({ x, z, s });
    for (let i = 0, guard = 0; i < 7 && guard < 400; guard++) {
      const a = fr.range(0.5, TAU - 0.5), r = lerp(160, 660, Math.sqrt(fr())), s = fr.range(16, 38), x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (r - s < 134 || hillAt.some((h) => Math.hypot(h.x - x, h.z - z) < h.s + s + 14)) continue;
      if (Math.abs(x) < s + 96 && z > 280 && z < 385) continue;                    // the herd's crossing
      hillAt.push({ x, z, s }); i++;
    }
    hillAt.slice(0, 16).forEach((h, i) => orb.uHill.value[i].set(h.x, h.z, h.s));
    hillAt.forEach((h, i) => put(L.hill, Math.atan2(h.x, h.z), Math.hypot(h.x, h.z), h.s, pairs[(i * 2 + 1) % pairs.length], fr.range(0.05, 0.12) * fr.sign(), 0, 0, 0, 1.0));
    // the lane village, 44 m to starboard between gate and mountain, and two more out in the country: all large enough to read
    village(Math.atan2(44, 440), Math.hypot(44, 440), 0, 0, 34, 0, 10, 1.5);
    for (let i = 0, guard = 0; i < 2 && guard < 200; guard++) {
      const a = (i ? -1 : 1) * fr.range(1.2, 2.7), r = fr.range(210, 380), x = Math.sin(a) * r, z = Math.cos(a) * r;
      if (hillAt.some((h) => Math.hypot(h.x - x, h.z - z) < h.s + 50)) continue;
      village(a, r, 0, 0, 26, 0, 11, 1.7); i++;
    }
    // two villages perch on the outer dish rim, clear of the dive
    { const rim = A.rims[0];
      for (const a0 of [1.9 + fr.range(-0.2, 0.2), -2.2 + fr.range(-0.2, 0.2)]) for (let j = 0; j < 14; j++) {
        const a = a0 + (j - 6.5) * 0.052;
        if (j === 7) put(L.onion, a, rim.radius * 0.94, 0.4, [K.verm, K.gold], 0.5, 0, 0, 0, 0, rim.y - 2.4);
        else put(L.house, a, rim.radius * 0.94, fr.range(0.42, 0.62), [fr.pick([K.verm, K.sage, K.birch]), K.gold], 0.4, 0, 0, 0, 0, rim.y - 2.4);
      } }
    // the foot grove: lacquered trees with their shadow discs in even slots, 14 m apart, round the innermost field of the
    // innermost annulus, turning with it as the plain does (no sink, no wedge). Its dice come from a stream of its own, made
    // without a draw from any other; every slot's dice are drawn before its test, and a slot within 5 m of a standing tree
    // of that annulus, or inside one of its hills, stays empty.
    {
      const gv = ctx.core.makeRng(ctx.core.hashSeed('turned-country-foot-grove:' + ctx.seed));
      const f = FIELDS.filter((q) => q.ann === ANN[ANN.length - 1]).pop();
      if (f) {
        const r = (f.rIn + f.rOut) / 2, n = Math.floor(TAU * r / 14), a0 = gv.range(0, TAU);
        const stood = [...L.treeN, ...L.treeF, ...L.treeG].flat().filter((t) => t.rate === f.rate), hills = L.hill.filter((h) => h.rate === f.rate);
        const within = (t, a, d) => Math.hypot(Math.sin(t.a) * t.r - Math.sin(a) * r, Math.cos(t.a) * t.r - Math.cos(a) * r) < d;
        for (let j = 0; j < n; j++) {
          const a = a0 + (j + gv.range(-0.2, 0.2)) / n * TAU, kind = gv.int(0, 2), s = gv.range(0.62, 1.2), c = gv.pick(pairs), spin = TAU / gv.range(20, 60) * gv.sign();
          if (stood.some((t) => within(t, a, 5)) || hills.some((h) => within(h, a, 1.02 * h.s + treeW[kind] * s))) continue;
          put(L.treeN[kind], a, r, s, c, spin, f.rate, 0, 0, treeW[kind]);
        }
      }
    }
    // spindle grass: concentric rows that keep to the entry lane as the annuli turn beneath it
    {
      const nearK = ['peg', 'acorn', 'flower', 'mushroom'];
      const gcol = { birch: [[K.verm, K.gold], [K.sage, K.verm], [K.black, K.gold], [K.verm, K.black]], sage: [[K.verm, K.gold], [K.cream, K.verm], [K.black, K.gold]],
        verm: [[K.black, K.gold], [K.cream, K.sage], [K.sage, K.gold]], moat: [[K.verm, K.gold], [K.black, K.verm], [K.sage, K.cream]] };
      // in the cherry and cobalt sets "vermilion" is a pale coat: plant the rows in that set's dark and bright paints instead
      const si = LACQUER_SETS.indexOf(set);
      if (si === 1) { const g = [[K.gold, K.black], [K.sage, K.gold], [K.black, K.gold], [K.gold, K.verm]]; gcol.birch = gcol.sage = gcol.verm = gcol.moat = g; }
      if (si === 2) { const g = [[K.black, K.gold], [K.sage, K.black], [K.black, K.verm], [K.sage, K.verm], [K.black, K.sage]]; gcol.birch = gcol.sage = gcol.verm = gcol.moat = g; }
      for (const f of FIELDS) {
        if (f.rOut < 150 || f.rIn > 645) continue;
        await ctx.yield();
        const cols = gcol[f.type] || gcol.birch, rowKind = fr.int(0, 3);
        for (let r = f.rIn + 0.9, row = 0; r < Math.min(f.rOut - 0.5, 662); r += (r < 335 ? 3.4 : 4.6), row++) {   // closer rows where the climb looks down on them
          const hiL = r > 330 && r < 604;                         // the level run: these pass within 15 m of the eye
          const nN = 8, dN = 28 / r;                             // near kinds: eight to a 28 m arc, 1.4 to 2.6 m tall
          for (let j = 0; j < nN; j++) {
            if (fr() > 0.45 + 0.2 * Math.min(1, density)) continue;
            const kind = nearK[(rowKind + (row >> 1) + (fr.chance(0.25) ? 1 : 0)) % 4];
            put(L[hiL ? kind + 'H' : kind], (j + 0.5 + fr.range(-0.2, 0.2)) / nN * dN - dN / 2 + (row % 2) * 0.5 * dN / nN, r + fr.range(-0.3, 0.3), fr.range(1.5, 2.7) * (hiL ? 1.22 : 1), fr.pick(cols), fr.range(1, 3) * fr.sign(), f.rate, 0, dN, kind === 'mushroom' ? 0.5 : 0.27);
          }
          const nS = Math.round((hiL ? 6 : 11) * detail), dS = 96 / r;       // far sprigs out to 48 m either side
          for (let j = 0; j < nS; j++) { if (fr() > 0.7) continue; put(L.sprig, (j + fr.range(0.2, 0.8)) / nS * dS - dS / 2, r + fr.range(-0.5, 0.5), fr.range(1.6, 3.4), fr.pick(cols), 0, f.rate, hiL ? 3 : 2, dS, 0.22); }
        }
      }
    }
    await ctx.yield();

    const M4 = new THREE.Matrix4(), Q0 = new THREE.Quaternion(), V0 = new THREE.Vector3(), VS = new THREE.Vector3();
    const flush = (list, geo, name) => {
      if (!list.length) { geo.dispose(); return null; }
      const I = makeInst(geo, matSpin, list.length, name);
      for (let i = 0; i < list.length; i++) {
        const t = list[i];
        M4.compose(V0.set(Math.sin(t.a) * t.r, t.y, Math.cos(t.a) * t.r), Q0, VS.setScalar(t.s));
        I.set(i, M4, t.c[0], t.c[1], t.spin, 0, t.rate, t.sink, t.wedge);
      }
      scene.add(I.mesh); return I;
    };
    for (let k = 0; k < 3; k++) {
      flush(L.treeN[k], turn(treeProfile(k, K, false), 8, 2.4), 'trees-near-' + k); await ctx.yield();
      flush(L.treeF[k], turn(treeProfile(k, K, true), 4, 1), 'trees-far-' + k); await ctx.yield();
      { const tp = treeProfile(k, K, false); for (const b of tp.bands) if (b.step === 99) b.step = 0.42; flush(L.treeG[k], turn(tp, 16, 1.4), 'trees-gate-' + k); } await ctx.yield();   // the gate groves fill a third of the first frame: round outlines
    }
    flush(L.hill, turn(solidProfile('hill', K), 16, 3.5), 'hills');
    await ctx.yield();
    flush(L.house, turn(solidProfile('house', K), 5, 1), 'houses');
    await ctx.yield();
    flush(L.onion, turn(solidProfile('onion', K), 10, 1), 'village-spindles');
    await ctx.yield();
    flush(L.well, turn(solidProfile('bobbin', K), 10, 3), 'well-heads');
    // (the plain kinds stand under the climb, seen from 15 m and more: five or six sides; the near kinds are hiGrass)
    for (const k of ['peg', 'acorn', 'flower', 'mushroom']) { flush(L[k], turn(solidProfile(k, K), k === 'acorn' || k === 'flower' ? 6 : 5, 1), 'grass-' + k); await ctx.yield(); flush(L[k + 'H'], hiGrass(k, K), 'grass-near-' + k); await ctx.yield(); }   // beads stand nearest the eye: rounder
    await ctx.yield();
    flush(L.sprig, turn(solidProfile('sprig', K), 4, 1), 'grass-sprigs');
    await ctx.yield();

    // shadow discs: one instanced quad per standing solid, multiplied onto the plain
    const stretch = new THREE.Vector2(-sunDir.x, -sunDir.z).normalize().multiplyScalar(light.stretch);
    const discMat = () => new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
      uniforms: { uOrbT: orb.uOrbT, uHill: orb.uHill, uStretch: { value: stretch } }, vertexShader: DISC_VERT, fragmentShader: DISC_FRAG,
    });
    const discMesh = (n, name) => {
      const g = new THREE.InstancedBufferGeometry(); g.copy(new THREE.PlaneGeometry(2, 2)); g.instanceCount = n;
      const d = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, n) * 4), 4), o = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, n) * 4), 4);
      g.setAttribute('iDisc', d); g.setAttribute('iOrb', o);
      const m = new THREE.Mesh(g, discMat()); m.frustumCulled = false; m.renderOrder = 2; m.name = name; scene.add(m);
      return { mesh: m, d, o };
    };
    await ctx.yield();
    { const D = discMesh(discs.length, 'shadow-discs');
      discs.forEach((s, i) => { D.d.setXYZW(i, s.x, s.z, s.rad, s.k); D.o.setXYZW(i, s.rate, s.sink, s.y, s.wedge); }); }
    await ctx.yield();

    await ctx.yield();
    // ---------- the cast: clouds, tops, the Hummer, top-birds, yo-yos, diabolos ----------
    const cr = rng.fork('cast');
    const RIGHT = new THREE.Vector3(1, 0, 0), P15 = path.pointAt(0.15), tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3();
    // cloud-bobbins and plates, spinning flat; four plates hang over the climb for the yo-yos
    const yoyoU = [0.235, 0.265, 0.3, 0.335], yoyos = [];
    {
      const bob = [], plate = [];
      for (const u of yoyoU) {
        const p = path.pointAt(u), R = cr.range(7, 10);
        const x = p.x - 14, z = p.z - 4, top = p.y + cr.range(30, 38), px = p.x - 34 - 7 * plate.length;   // plates stand wide to port, clear of the mountain's outline
        plate.push({ x: px, y: top, z, s: R, c: [K.cream, K.blue], spin: cr.range(0.5, 0.9) * cr.sign() });
        yoyos.push({ x, px, z, top, y0: p.y + 1.5, u, ph: cr.range(0, TAU), c: cr.pick(pairs) });
      }
      const nC = Math.round(27 * (0.5 + 0.5 * detail));
      for (let i = 0, guard = 0; i < nC && guard < 600; guard++) {
        const a = cr.range(0, TAU), r = lerp(170, 950, Math.pow(cr(), 1.4)), y = cr.range(70, 160), s = cr.range(6, 20);
        const x = Math.sin(a) * r, z = Math.cos(a) * r;
        if (path.distanceTo(x, y, z) < s + 34) continue;
        if (A.hang.concat(A.hangEarly || []).some((h) => Math.hypot(h.position.x - x, h.position.z - z) < h.radius + s + 24)) continue;
        if (Math.abs(x) < 60 && z > 0 && y < 120) continue;        // keep the entry picture's sky clear over the mountain
        (i % 2 ? plate : bob).push({ x, y, z, s, c: [K.cream, K.blue], spin: cr.range(0.25, 0.8) * cr.sign() }); i++;
      }
      const mk = (list, geo, name) => {
        const I = makeInst(geo, matSpin, list.length, name);
        list.forEach((t, i) => { M4.compose(V0.set(t.x, t.y, t.z), Q0, VS.setScalar(t.s)); I.set(i, M4, t.c[0], t.c[1], t.spin, 0, 0, 0, 0); });
        scene.add(I.mesh);
      };
      mk(bob, turn(solidProfile('bobbin', K), 11, 2), 'cloud-bobbins'); await ctx.yield(); mk(plate, turn(solidProfile('plate', K), 12, 2), 'cloud-plates');
    }
    await ctx.yield();
    const yoI = makeInst(turn(solidProfile('yoyo', K), 20, 1), matCpu, yoyos.length, 'yo-yos'); scene.add(yoI.mesh);

    // diabolos (or cup-and-ball balls) tossed from sling to sling across the climb
    const tossU = [0.262, 0.274, 0.286, 0.298, 0.31, 0.322], tosses = [], PER = cast.cupBall ? 5 : 6;
    for (const u of tossU) {
      const p = path.pointAt(u), t = path.tangentAt(u), side = new THREE.Vector3(-t.z, 0, t.x).normalize();
      tosses.push({ a: p.clone().addScaledVector(side, -26).add(V0.set(0, 0.5, 0)), b: p.clone().addScaledVector(side, 26).add(V0.set(0, 0.5, 0)), h: 7.4, ph: cr(), side });
    }
    const diaI = makeInst(turn(solidProfile(cast.cupBall ? 'ball' : 'diabolo', K), cast.cupBall ? 12 : 8, cast.cupBall ? 1 : 3), matCpu, tosses.length * PER, 'diabolos'); scene.add(diaI.mesh);
    await ctx.yield();
    const slingI = makeInst(turn(solidProfile('plate', K), 9, 3), matSpin, tosses.length * 4, 'slings'); scene.add(slingI.mesh);
    tosses.forEach((t, i) => { for (let e = 0; e < 2; e++) { const p = e ? t.b : t.a; M4.compose(V0.set(p.x, p.y - 1.7, p.z), Q0, VS.setScalar(1.7)); slingI.set(i * 4 + e, M4, K.cream, K.verm, 2.2 * (e ? 1 : -1), 0, 0, 0, 0);
      M4.compose(V0.set(p.x + (e ? 9 : -9), p.y + 22, p.z), Q0, VS.setScalar(5)); slingI.set(i * 4 + 2 + e, M4, K.cream, K.blue, 0.7 * (e ? 1 : -1), 0, 0, 0, 0); } });
    const diaCol = Array.from({ length: tosses.length * PER }, () => cr.pick(pairs));

    await ctx.yield();
    // the herd of pear tops, the Hummer, and the tiring top beside it
    const NT = cast.tops, tops = [], humAvoid = [];
    const herdZ = P15.z - 27, hum = [{ x: P15.x - 5.7, z: P15.z - 10.5, c: [K.sage, K.verm], w: 44 }];   // the close pass: 5.7 m to port, half the frame
    if (cast.hummer2) hum.push({ x: P15.x + 12.5, z: P15.z - 38, c: [K.black, K.gold], w: -38 });
    for (let i = 0; i < NT; i++) {
      const big = i < 8;
      tops.push({ ox: cr.range(-26, 26) * (big ? 0.6 : 1), oz: big ? 15.5 + 0.3 * cr.range(-11, 11) : cr.range(-11, 11) - cr.range(0, 14), s: big ? cr.range(2.9, 3.4) : cr.range(1.5, 2.6),   // the eight big tops lead the herd, 8 to 15 m ahead of the eye
        ph: (i * 0.618 + cr.range(0, 0.1)) % 1,
        c: cr.chance(0.55) ? [K.verm, K.black] : (cr.chance(0.6) ? [K.black, K.verm] : [K.verm, K.cream]), w1: cr.range(0.25, 0.5), w2: cr.range(0.13, 0.3), p1: cr.range(0, TAU), p2: cr.range(0, TAU),
        l1: cr.range(3, 7), l2: cr.range(1.5, 4), dir: cr.sign(), prec: cr.range(1.2, 2.2) });
    }
    tops.push({ tiring: true, x: P15.x + 2.4, z: P15.z - 13.5, s: 3.8, c: [K.verm, K.cream], dir: 1, prec: 1.6 });
    humAvoid.push(...hum, { x: P15.x + 2.4, z: P15.z - 13.5 });
    const topI = makeInst(turn(solidProfile('top', K, { mo: season === 'blossom' ? MO.PETAL : cr.pick([MO.BERRY, MO.PETAL]) }), 8, 2.4), matCpu, tops.length, 'tops'); scene.add(topI.mesh);
    await ctx.yield();
    const humI = makeInst(turn(solidProfile('hummer', K), 32, 1), matCpu, hum.length, 'hummers'); scene.add(humI.mesh);
    const castDisc = discMesh(tops.length + hum.length, 'cast-shadows');
    castDisc.d.setUsage(THREE.DynamicDrawUsage);
    await ctx.yield();
    // top-birds: wingless teardrops that fly because they spin, two flocks
    const NB = Math.round(156 * detail), birds = [];
    const birdI = makeInst(turn(solidProfile('bird', K), 6, 1), matSpin, NB, 'top-birds'); scene.add(birdI.mesh);
    const bcol = [[K.verm, K.black], [K.black, K.gold], [K.sage, K.verm], [K.verm, K.gold]];
    for (let i = 0; i < NB; i++) {
      const f = i % 2, g = cr.gauss() * 0.5, c = bcol[(f * 2 + (cr.chance(0.3) ? 1 : 0) + (cr.chance(0.15) ? 2 : 0)) % 4];
      birds.push({ f, ox: clamp(g, -1, 1) * 13 + cr.range(-3, 3), oy: cr.range(-2.6, 2.6), oz: cr.range(-2.6, 2.6), ph: cr.range(0, TAU), s: cr.range(0.95, 1.4) });
      M4.identity(); birdI.set(i, M4, c[0], c[1], 24 * (f ? 1 : -1), 0, 0, 0, 0);
    }
    const flocks = [0.094, 0.094].map((uc, f) => {
      const pc = path.pointAt(uc).addScaledVector(path.tangentAt(uc), f ? 14.5 : 11) .add(new THREE.Vector3(0, f ? -3.3 : -4.1, 0));   // low: the crossing passes under the mountain's foot
      return { uc, pc, d: new THREE.Vector3(f ? -0.7 : 0.7, 0, -0.714).normalize(), b: 0, ro: f ? 168 : 138, yo: f ? 84 : 62, dir: f ? -1 : 1, ph: cr.range(0, TAU) };
    });
    const flockAt = (fl, time, u, out) => {
      out.copy(fl.pc).addScaledVector(fl.d, (u - fl.uc) * 47 * 42);        // 30 m/s forward with the camera, 29 m/s across it
      const th = fl.dir * time * 0.13 + fl.ph, b = smoothstep(fl.uc + 0.04, fl.uc + 0.17, u);
      fl.b = b;
      if (b > 0) { tmpP.set(Math.sin(th) * fl.ro, fl.yo + 10 * Math.sin(th * 2), Math.cos(th) * fl.ro); out.lerp(tmpP, b); }
      return out;
    };

    await ctx.yield();
    // strings: whip strings for the tops, yo-yo strings, sling strings
    const NSTR = tops.length + yoyos.length + tosses.length * 2;
    const strGeo = new THREE.InstancedBufferGeometry(); strGeo.copy(new THREE.PlaneGeometry(1, 1).translate(0, 0.5, 0)); strGeo.instanceCount = NSTR;
    const sA = new THREE.InstancedBufferAttribute(new Float32Array(NSTR * 3), 3), sB = new THREE.InstancedBufferAttribute(new Float32Array(NSTR * 3), 3), sW = new THREE.InstancedBufferAttribute(new Float32Array(NSTR), 1);
    sA.setUsage(THREE.DynamicDrawUsage); sB.setUsage(THREE.DynamicDrawUsage);
    strGeo.setAttribute('iA', sA); strGeo.setAttribute('iB', sB); strGeo.setAttribute('iW', sW);
    for (let i = 0; i < NSTR; i++) sW.setX(i, i < tops.length ? 0.07 : 0.09);
    const strings = new THREE.Mesh(strGeo, new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: { uPix: U.uPix, uCol: { value: aim('#8A6240') } }, vertexShader: STR_VERT, fragmentShader: STR_FRAG }));
    strings.frustumCulled = false; strings.name = 'strings'; scene.add(strings);
    tosses.forEach((t, i) => { for (let e = 0; e < 2; e++) { const p = e ? t.b : t.a, k = tops.length + yoyos.length + i * 2 + e; sA.setXYZ(k, p.x, p.y - 1.4, p.z); sB.setXYZ(k, p.x + (e ? 9 : -9), p.y + 22, p.z); } });

    await ctx.yield();
    // birch shavings, the world's snow
    const NSH = Math.round((season === 'heavy' ? 720 : season === 'light' ? 380 : 0) * detail * (0.8 + 0.2 * density));
    let shavU = null;
    if (NSH > 0) {
      const pos = [], nor = [], uv = [], idx = [], SEGS = 6;
      for (let i = 0; i <= SEGS; i++) {
        const t = i / SEGS, a = t * TAU * 1.4, rad = 0.2 + 0.1 * t, cx = Math.cos(a) * rad, cy = Math.sin(a) * rad, z = (t - 0.5) * 0.5;
        pos.push(cx, cy, z - 0.09, cx, cy, z + 0.09); nor.push(Math.cos(a), Math.sin(a), 0, Math.cos(a), Math.sin(a), 0); uv.push(t, 0, t, 1);
        if (i < SEGS) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
      }
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
      const sd = new Float32Array(NSH * 4); for (let i = 0; i < sd.length; i++) sd[i] = cr();
      g.setAttribute('iSeed', new THREE.InstancedBufferAttribute(sd, 4)); g.instanceCount = NSH;
      shavU = { uTime: U.uTime, uFall: { value: season === 'heavy' ? 1.25 : 0.9 }, uCam: { value: new THREE.Vector3() }, uSun: { value: sunDir }, uCol: { value: K.birch.clone().multiplyScalar(1.02) }, uUmber: { value: K.umber } };
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ side: THREE.DoubleSide, uniforms: shavU, vertexShader: SHAV_VERT, fragmentShader: SHAV_FRAG }));
      m.frustumCulled = false; m.name = 'shavings'; scene.add(m);
    }
    await ctx.yield();

    // ---------- animation ----------
    const W0 = 30, CYC = 12;
    const wn = (p) => (p < 0.5 ? 1 : p < 0.78 ? lerp(1, 0.015, smoothstep(0.5, 0.78, p)) : p < 0.9 ? 0.015 : lerp(0.015, 1, smoothstep(0.9, 0.955, p)));
    const FT = new Float32Array(65); for (let i = 1; i <= 64; i++) FT[i] = FT[i - 1] + wn((i - 0.5) / 64) / 64;
    const Fp = (p) => { const x = clamp(p, 0, 1) * 64, i = Math.min(63, Math.floor(x)); return lerp(FT[i], FT[i + 1], x - i); };
    // rare event: the country goes back on the lathe at u 0.5 for four seconds
    const latheAt = (u) => (rare ? smoothstep(0.497, 0.52, u) * (1 - smoothstep(0.555, 0.59, u)) : 0);
    const LT = new Float32Array(101); for (let i = 1; i <= 100; i++) LT[i] = LT[i - 1] + latheAt((i - 0.5) / 100) * 0.47 * 16;   // extra orbit seconds
    const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), ax = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), c0 = new THREE.Vector3(), c1 = new THREE.Vector3(), dirV = new THREE.Vector3();
    const qSide = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI / 2);
    tops.forEach((t, i) => topI.set(i, M4.identity(), t.c[0], t.c[1]));
    hum.forEach((h, i) => humI.set(i, M4.identity(), h.c[0], h.c[1]));
    yoyos.forEach((y, i) => yoI.set(i, M4.identity(), y.c[0], y.c[1]));
    diaCol.forEach((c, i) => diaI.set(i, M4.identity(), c[0], c[1]));
    for (const I of [topI, humI, yoI, diaI, birdI]) I.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    function update(dt, time, camera, u) {
      u = clamp(u ?? 0, 0, 1);
      const lathe = latheAt(u), lx = u * 100, li0 = Math.min(99, Math.floor(lx));
      U.uLathe.value = lathe; orb.uOrbW.value = 1 + lathe * 16;
      orb.uOrbT.value = time + lerp(LT[li0], LT[li0 + 1], lx - li0);
      hero.setProgress(u); hero.update(dt, time, camera);
      if (camera) { sky.position.setFromMatrixPosition(camera.matrixWorld); if (shavU) shavU.uCam.value.copy(sky.position); }   // matrixWorld: the camera behind a portal is posed by matrix

      // tops: wander, precess, tire, flower, lie down, and are whipped upright by a string from the sky
      const hx = -50 + 100 * clamp((u - 0.08) / 0.14, 0, 1);
      for (let i = 0; i < tops.length; i++) {
        const t = tops[i]; let x, z, p, cyc = 0;
        if (t.tiring) { x = t.x; z = t.z; p = 0.5 + 0.5 * clamp((u - 0.09) / 0.075, 0, 1); if (p >= 1) p = (time / CYC) % 0.45; }
        else {
          x = hx + t.ox + t.l1 * Math.sin(t.w1 * time + t.p1) + t.l2 * Math.sin(t.w2 * 2.3 * time + t.p2);
          z = herdZ + t.oz + t.l1 * Math.cos(t.w1 * 0.8 * time + t.p1) + t.l2 * Math.sin(t.w2 * 1.7 * time + t.p2 * 2);
          const tc = time / CYC + t.ph; cyc = Math.floor(tc); p = tc - cyc;
          for (const h of humAvoid) { const dx = x - h.x, dz = z - h.z, d = Math.hypot(dx, dz); if (d < 5.6) { const k = 5.6 / Math.max(d, 0.01); x = h.x + dx * k; z = h.z + dz * k; } }
        }
        const w = W0 * wn(p) * t.dir, ang = (W0 * CYC * (cyc * FT[64] + Fp(p)) * t.dir) % TAU;
        const up = 1 - smoothstep(0.9, 0.95, p);
        const lean = (0.035 + 0.4 * smoothstep(0.5, 0.78, p) + 1.1 * smoothstep(0.775, 0.82, p)) * up + 0.035 * (1 - up);
        const pr = t.prec * time * (1 + 1.5 * smoothstep(0.5, 0.78, p)) * (p > 0.8 && p < 0.9 ? 0.25 : 1);
        ax.set(Math.cos(pr), 0, Math.sin(pr)); qa.setFromAxisAngle(ax, lean);
        const lie = smoothstep(0.9, 1.5, lean), y = 0.34 * t.s * lie;
        M4.compose(V0.set(x, y, z), qa, VS.setScalar(t.s)); topI.mesh.setMatrixAt(i, M4);
        topI.spin.setXYZW(i, w, ang, 0, 0);
        castDisc.d.setXYZW(i, x, z, t.s * (0.46 + 0.3 * lie), 1); castDisc.o.setXYZW(i, 0, 0, 0.17, 0);
        // the whip string: drops while the top lies, pulls taut, flies off
        const sOn = p > 0.855 && p < 0.985;
        if (sOn) {
          c0.set(0, t.s * 0.98, 0).applyQuaternion(qa).add(V0);
          const drop = smoothstep(0.855, 0.895, p), fly = smoothstep(0.95, 0.985, p);
          // the string comes down slanting from outside the lane, so none hangs across the mountain's silhouette
          const sd = c0.x >= P15.x - 2 ? 1 : -1, bx = c0.x + sd * (12 + 2 * Math.sin(time * 0.9 + i)), by = c0.y + 22, bz = c0.z + 2;
          sA.setXYZ(i, lerp(bx, c0.x, drop) + fly * 4 * Math.cos(pr), lerp(by, c0.y, drop) + fly * 22, lerp(bz, c0.z, drop) + fly * 4 * Math.sin(pr));
          sB.setXYZ(i, bx, by + fly * 22, bz);
        } else { sA.setXYZ(i, 0, -50, 0); sB.setXYZ(i, 0, -50, 0); }
      }
      hum.forEach((h, i) => {
        const pr = time * 0.9 + i * 2, x = h.x + 0.5 * Math.sin(time * 0.6 + i), z = h.z + 0.5 * Math.cos(time * 0.47 + i);
        qa.setFromAxisAngle(ax.set(Math.cos(pr), 0, Math.sin(pr)), 0.045);
        M4.compose(V0.set(x, 0.02, z), qa, VS.setScalar(1)); humI.mesh.setMatrixAt(i, M4);
        humI.spin.setXYZW(i, h.w, (h.w * time) % TAU, 0, 0);
        const k = tops.length + i; castDisc.d.setXYZW(k, x, z, 3.1, 1); castDisc.o.setXYZW(k, 0, 0, 0.17, 0);
      });
      topI.mesh.instanceMatrix.needsUpdate = true; topI.spin.needsUpdate = true; humI.mesh.instanceMatrix.needsUpdate = true; humI.spin.needsUpdate = true;
      castDisc.d.needsUpdate = true; castDisc.o.needsUpdate = true;
      // yo-yos run down and up their strings from the cloud plates; they meet the camera as it climbs past
      yoyos.forEach((yy, i) => {
        const phs = (u - yy.u) * 60 + 0.5 * Math.sin(time * 0.6 + yy.ph), y = Math.min(yy.top - 4, yy.y0 + 8 * Math.sin(phs) + 0.5 * Math.sin(time * 1.3 + yy.ph));
        qa.setFromAxisAngle(UP, time * 0.4 + yy.ph).multiply(qSide);
        const xx = lerp(yy.x, yy.px, clamp((y - yy.y0 + 8) / (yy.top - yy.y0 + 8), 0, 1));   // it runs along its slanted string
        M4.compose(V0.set(xx, y, yy.z), qa, VS.setScalar(1)); yoI.mesh.setMatrixAt(i, M4);
        yoI.spin.setXYZW(i, 6 + 16 * Math.abs(Math.cos(phs)), (y * 2.6) % TAU, 0, 0);
        const k = tops.length + i; sA.setXYZ(k, xx, y + 0.2, yy.z); sB.setXYZ(k, yy.px, yy.top, yy.z);
      });
      // diabolos arc from sling to sling
      for (let k = 0; k < tosses.length; k++) {
        const ts = tosses[k];
        for (let j = 0; j < PER; j++) {
          const q = (time / 2.9 + j / PER + ts.ph) % 1, fwd = j % 2 === 0, e = fwd ? q : 1 - q, i = k * PER + j;
          V0.lerpVectors(ts.a, ts.b, e); V0.y += ts.h * 4 * q * (1 - q) + (j % 2) * 0.9;
          ax.crossVectors(ts.side, UP).normalize(); qa.setFromUnitVectors(UP, ax);
          qb.setFromAxisAngle(ts.side, 0.25 * Math.sin(time * 2.1 + i)); qa.premultiply(qb);
          M4.compose(V0, qa, VS.setScalar(cast.cupBall ? 1.7 : 1.45)); diaI.mesh.setMatrixAt(i, M4);
          diaI.spin.setXYZW(i, fwd ? 13 : -13, (time * 13 + i) % TAU, 0, 0);
        }
      }
      // top-birds
      for (let f = 0; f < 2; f++) {
        const fl = flocks[f]; flockAt(fl, time, u, c0); flockAt(fl, time + 0.2, u + 0.2 / 47, c1);
        dirV.subVectors(c1, c0); if (dirV.lengthSq() < 1e-6) dirV.set(0, 0, -1); dirV.normalize();
        const sw = 0.35 * Math.sin(time * 0.22 * fl.dir), cs = Math.cos(sw), sn = Math.sin(sw), swag = 1 - fl.b;
        for (let i = f; i < NB; i += 2) {
          const b = birds[i], wob = Math.sin(time * 1.4 + b.ph);
          V0.set(c0.x + b.ox * cs + b.oz * sn + 0.5 * Math.cos(time * 0.9 + b.ph), c0.y + b.oy * (1 - 0.7 * swag) + 0.4 * wob, c0.z - b.ox * sn + b.oz * cs);
          // the swag: each bird rides a shallow U across the lane, under the mountain's foot in the middle, up either side of it
          const xs = clamp(V0.x, -15, 15); V0.y += 0.058 * xs * xs * swag;
          tmpT.set(dirV.x, dirV.y + 0.116 * xs * dirV.x * swag * (Math.abs(V0.x) < 15 ? 1 : 0), dirV.z).normalize();
          qa.setFromUnitVectors(UP, tmpT);
          qb.setFromAxisAngle(RIGHT, 0.2 * Math.cos(time * 1.4 + b.ph)).premultiply(qa);
          M4.compose(V0, qb, VS.setScalar(b.s)); birdI.mesh.setMatrixAt(i, M4);
        }
      }
      for (const I of [yoI, diaI]) { I.mesh.instanceMatrix.needsUpdate = true; I.spin.needsUpdate = true; }
      birdI.mesh.instanceMatrix.needsUpdate = true; sA.needsUpdate = true; sB.needsUpdate = true;
    }
    await ctx.yield();
    update(0, 0, null, 0);
    await ctx.yield();

    const humPoi = new THREE.Vector3(hum[0].x + 1.2, 3.2, hum[0].z);
    return {
      scene, path, duration: 47,
      // linger beside the Hummer and under the hanging bells; the last tenth is flown at the plain pace
      pace: (u) => { const a = (u - 0.148) / 0.034, b = (u - 0.6) / 0.05; return 1 - 0.3 * Math.exp(-a * a) - 0.18 * Math.exp(-b * b); },
      title: 'The Turned Country',
      camera: { fov: 62, near: 0.3, far: 4000, bank: 0.8, sway: 0.6 },
      pois: [
        { at: humPoi, from: 0.1, to: 0.172, weight: 0.45 },
        { at: gaze, from: 0.19, to: 0.5, weight: 0.6, fade: 0.14 },
        { at: gaze, from: 0.45, to: 0.975, weight: 0.78, fade: 0.09 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#FFDf9a', glow: 0.5, tilt: true, revealDistance: 470 },
      post: { exposure: light.exposure, bloom: { strength: 0.15, radius: 0.5, threshold: 1.1 },
        grade: { saturation: 1.12, contrast: 1.06, tint: '#ffffff', shadowTint: '#000000', vignette: 0.1, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none',
      update,
      dispose() { hero.dispose(); },
    };
  },
};
