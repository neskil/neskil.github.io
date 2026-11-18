// Hero set piece for "chains-turned-to-stone" (What the Chains Decided), after Antoni Gaudi, 1852 to 1926.
// THE HALL AND THE MODEL IT WAS FOUND FROM. Above the water: 36 leaning sandstone trunks (never plumb) that fork
// twice into 432 twigs holding a ruled brick vault pierced by 24 great and 16 lesser hyperboloid star throats.
// Below the water, exactly beneath, the cause: the same network as pale hanging chains pinned to the surface,
// an ochre sack of shot under every twig head, and 24 blue discs 63 m down.  (Header continues at the end of file:
// see "HAND-OFF" for exports, anchors, opts, cost.)
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

// ---------------------------------------------------------------------------------------------------------------
// LAYOUT (hero-local metres; origin = centre of the hall at water level; the camera enters from -Z and flies +Z,
// so the world sets hero.object.position = (0, 0, 310) with no rotation)
export const HALL = {
  rowsX: [-45, -15, 15, 45], nZ: 9, pitchZ: 36, z0: -144,          // trunk feet
  thrX: [-56, -30, 0, 30, 56], thrZ0: -126, nThrZ: 8,               // throat axes (|x| = 56: lesser throats)
  aGreat: 6.5, aLess: 4.0, bLow: 2.2, bLowLess: 1.75, bUp: 8.0,     // hyperboloid necks and shape
  neckY: 66, collarY: 72, halfX: 64, halfZ: 162,                    // vault footprint
  fork1: 30, fork2: 44, deep: -66,
};
export const PALETTE = ['#C9B28A', '#F2EEE3', '#1E4FA3', '#2FA6A0', '#E3A72F', '#C8452B', '#23201E'];

const H = HALL;
const thrIndexX = (x) => clamp(Math.round(x / 30), -2, 2);
const thrCx = (i) => (Math.abs(i) === 2 ? Math.sign(i) * 56 : i * 30);
const thrIndexZ = (z) => clamp(Math.round((z - H.thrZ0) / 36), 0, H.nThrZ - 1);
const thrCz = (k) => H.thrZ0 + 36 * k;
const lowOf = (cx, cz, x, z) => {
  const less = Math.abs(cx) > 50, a = less ? H.aLess : H.aGreat, b = less ? H.bLowLess : H.bLow;
  const r2 = ((x - cx) * (x - cx) + (z - cz) * (z - cz)) / (a * a);
  return H.neckY - b * Math.sqrt(Math.max(r2 - 1, 0));
};
/** Underside of the vault at (x, z): the highest of the neighbouring hyperboloid skirts (creases fall over the trunks). */
export function soffitY(x, z) {
  const i0 = thrIndexX(x), k0 = thrIndexZ(z); let y = -1e9;
  for (let i = Math.max(-2, i0 - 1); i <= Math.min(2, i0 + 1); i++)
    for (let k = Math.max(0, k0 - 1); k <= Math.min(H.nThrZ - 1, k0 + 1); k++) y = Math.max(y, lowOf(thrCx(i), thrCz(k), x, z));
  return y;
}
/** Top of the lime-washed roof skin at (x, z): humps between 64.5 and 70, rising to a 72 m collar round each throat. */
export function roofY(x, z) {
  const base = 67.3 + 1.5 * Math.sin(x * 0.19 + 0.7) * Math.cos(z * 0.115) + 0.9 * Math.sin(z * 0.27 + x * 0.06) + 0.6 * Math.cos(x * 0.41 - z * 0.05);
  const cx = thrCx(thrIndexX(x)), cz = thrCz(thrIndexZ(z)), a = Math.abs(cx) > 50 ? H.aLess : H.aGreat;
  const r = Math.hypot(x - cx, z - cz) / a;
  const top = lerp(H.collarY, base + 0.9 * Math.exp(-Math.pow(ridgeDist(x, z) / 1.5, 2)), smoothstep(1.3, 2.3, r));
  const dP = Math.min(H.halfX - Math.abs(x), H.halfZ - Math.abs(z));          // the roof comes down to the scalloped edge
  return lerp(soffitY(x, z) + 1.4, top, smoothstep(0, 9, dP));
}
/** Distance to the nearest crest line of the roof (the cell borders between throats): shards run along these. */
export function ridgeDist(x, z) {
  const ax = Math.abs(x), dx = Math.min(Math.abs(ax - 15), Math.abs(ax - 45));
  const zz = z - H.thrZ0 - 18, dz = Math.abs(zz - 36 * clamp(Math.round(zz / 36), 0, H.nThrZ - 2));
  return Math.min(dx + 0.8 * Math.sin(z * 0.21), dz + 0.8 * Math.sin(x * 0.17)) ;
}

// ---------------------------------------------------------------------------------------------------------------
// EXACT COLOUR under the kept tone map: display-linear colour -> scene value (inverse of exposure/0.6 -> ACES).
const M_IN = [0.59719, 0.076, 0.0284, 0.35458, 0.90834, 0.13383, 0.04823, 0.01566, 0.83777];
const M_OUT = [1.60475, -0.10208, -0.00327, -0.53108, 1.10813, -0.07276, -0.07367, -0.00605, 1.07602];
const m3inv = (e) => new THREE.Matrix3().fromArray(e).invert().elements;
const IN_I = m3inv(M_IN), OUT_I = m3inv(M_OUT);
const f6 = (a) => a.map((v) => v.toFixed(6)).join(',');
/** JS twin of the GLSL toScene: THREE.Color (display-linear) -> THREE.Color (scene value), exposure 1. */
export function toScene(c, exposure = 1) {
  const mul = (m, v) => [m[0] * v[0] + m[3] * v[1] + m[6] * v[2], m[1] * v[0] + m[4] * v[1] + m[7] * v[2], m[2] * v[0] + m[5] * v[1] + m[8] * v[2]];
  const y = mul(OUT_I, [c.r, c.g, c.b].map((v) => clamp(v, 0, 0.95))).map((v) => clamp(v, 0.0004, 0.97));
  const v = y.map((q) => { const A = 0.983729 * q - 1, B = 0.432951 * q - 0.0245786, C = 0.238081 * q + 0.000090537; return (-B - Math.sqrt(Math.max(B * B - 4 * A * C, 0))) / (2 * A); });
  const o = mul(IN_I, v).map((q) => Math.max(q, 0) * 0.6 / exposure);
  return new THREE.Color(o[0], o[1], o[2]);
}

/** Uniforms shared by every material of the world (one object each; pass `shared` to the factories). */
export function makeShared(palette = PALETTE) {
  const P = palette.map((h) => new THREE.Color(h));
  return {
    uTime: { value: 0 }, uU: { value: 0 },
    uSun: { value: new THREE.Vector3(0.6489, 0.7037, -0.2895).normalize() },  // toward the sun: 44.7 deg up, to port and behind, on the throat lattice (45 m across, 18 m along), so each great throat's disc crosses the trunk row 45 m off between 9 and 27 m up and lands on the water of the next aisle
    uSunOn: { value: 1 },                                                     // 0 = white sky after rain: no discs
    uOrigin: { value: new THREE.Vector3() },                                  // world position of the hero origin
    uCamL: { value: new THREE.Vector3(0, 30, -300) },                         // camera in hero-local space
    uExposure: { value: 1 }, uShade: { value: 0.55 },                         // stone in shade = pigment x uShade (0.8 under a white sky)
    uSand: { value: P[0] }, uWhite: { value: P[1] }, uCobalt: { value: P[2] }, uGreen: { value: P[3] },
    uOchre: { value: P[4] }, uRed: { value: P[5] }, uIron: { value: P[6] },
    uGlazeMix: { value: new THREE.Vector4(1, 1, 1, 1) },
    uLamp: { value: 0.6 },                                                    // the lanterns' warm pool on the stone round them
    uSteep: { value: 0 },                                                    // 0 level gaze .. 1 looking straight down: the image in the water gives way to what hangs in it
    uMir: { value: 1 },                                                       // -1 on the mirror copies: the same meshes drawn upside down under the water
    uSkyZen: { value: P[2].clone() }, uSkyHor: { value: P[2].clone().lerp(P[1], 0.5) },   // the sky the water mirrors (the world sets them)
    uShift: { value: new THREE.Vector4(0, 0, 0, 144) },                       // web shift x, z (m) and its centre x, z
    uClear: { value: new THREE.Vector4(H.halfX + 12, -320, 290, 26) },             // where the water is clear: half x, z0, z1, fade                      // colourway: cobalt, green, ochre, red on/off
  };
}

// ---------------------------------------------------------------------------------------------------------------
// STYLE_GLSL: the one shading routine of the world. Everything is worked out in display-linear colour (palette
// pigments times the light rule) and passed through toScene() last, so sunlit sand lands on #C9B28A on screen.
//   sunVis(pL)            1 in sun, 0 in shade: analytic, the ray to the sun must cross the vault inside a star throat
//   gaudiLight(alb,n,pL,ao)  the light rule: sunlit = pigment; shade = pigment at 55 % leaned to cobalt; never black
//   brickAt(pL, pxw)      ruled brick courses along both generator families of the nearest hyperboloid throat
//   shardAt(uv, fw, ...)  trencadis: uncut 3 to 7 sided chips, unsorted glaze colours, pale grout, own tilt per chip
export const STYLE_GLSL = /* glsl */`
  uniform float uTime, uU, uSunOn, uExposure, uShade, uMir, uSteep, uLamp;
  // THE MIRROR: the water is a dark mirror. Each mesh is drawn a second time upside down under the surface (uMir -1,
  // flipped in the vertex shader after the light is worked out, so the image is lit exactly as the thing), sunk toward
  // the iron black the deeper it lies; the chains hang through the heart of each mirrored trunk.
  uniform vec3 uSun, uOrigin, uCamL, uSand, uWhite, uCobalt, uGreen, uOchre, uRed, uIron;
  uniform vec4 uGlazeMix, uClear;
  vec3 mirTone(vec3 D, float y){ return uMir > 0. ? D : mix(mix(uIron*1.15, uCobalt, 0.22*uSteep), D, mix(0.74, 0.5, smoothstep(0., 66., y))*(1. - 0.62*uSteep)); }
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p + 34.345); return fract(p.x*p.y); }
  vec2 hash22(vec2 p){ float n = hash21(p); return vec2(n, hash21(p + n*17.13 + 3.7)); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
    return mix(mix(hash21(i), hash21(i + vec2(1, 0)), f.x), mix(hash21(i + vec2(0, 1)), hash21(i + vec2(1, 1)), f.x), f.y); }
  vec3 toScene(vec3 D){
    vec3 y = clamp(mat3(${f6(OUT_I)})*clamp(D, 0., 0.95), 0.0004, 0.97);
    vec3 A = 0.983729*y - 1., B = 0.432951*y - 0.0245786, Cc = 0.238081*y + 0.000090537;
    vec3 v = (-B - sqrt(max(B*B - 4.*A*Cc, 0.)))/(2.*A);
    return max(mat3(${f6(IN_I)})*v, 0.)*(0.6/max(uExposure, 0.05));
  }
  // nearest throat of the lattice: xy = axis (x, z), z = neck radius, w = 1 for a lesser throat
  vec4 throatAt(vec2 q){
    float i = clamp(floor(q.x/30. + 0.5), -2., 2.), k = clamp(floor((q.y + 126.)/36. + 0.5), 0., 7.);
    float less = step(1.5, abs(i));
    return vec4(mix(i*30., sign(i)*56., less), -126. + 36.*k, mix(${H.aGreat.toFixed(1)}, ${H.aLess.toFixed(1)}, less), less);
  }
  float sunDisc(vec3 p){                      // only the light that comes down a star throat
    vec2 q = p.xz + uSun.xz*((${H.neckY.toFixed(1)} - p.y)/max(uSun.y, 0.05));
    vec4 th = throatAt(q);
    vec2 e = abs(q) - vec2(${(H.halfX + 2).toFixed(1)}, ${(H.halfZ + 2).toFixed(1)});
    return uSunOn*(1. - smoothstep(th.z - 0.22, th.z + 0.22, length(q - th.xy)))*step(max(e.x, e.y), 0.);
  }
  float sunVis(vec3 p){
    float sy = max(uSun.y, 0.05);
    vec2 q = p.xz + uSun.xz*((${H.neckY.toFixed(1)} - p.y)/sy);
    vec4 th = throatAt(q);
    float inHole = 1. - smoothstep(th.z - 0.22, th.z + 0.22, length(q - th.xy));
    // the hall is open sided: a ray that leaves the footprint below the vault edge is in sun
    vec2 e = abs(p.xz + uSun.xz*(clamp(60. - p.y, 0., 12.)/sy)) - vec2(${H.halfX.toFixed(1)}, ${H.halfZ.toFixed(1)});
    float outside = smoothstep(-0.3, 0.3, max(e.x, e.y));
    float above = step(${(H.neckY - 0.5).toFixed(1)}, p.y);
    float cl = 1. - 0.45*smoothstep(0.46, 0.62, vnoise(p.xz*0.024 + vec2(uTime*0.17, uTime*0.04)));   // cloud shadows cross the hall, the roof and the discs
    return uSunOn*cl*max(above, max(inHole, outside*(1. - step(60., p.y))));
  }
  vec3 gaudiLight(vec3 alb, vec3 n, vec3 p, float ao){
    float ndl = dot(n, uSun);
    float lit = smoothstep(0.02, 0.26, ndl)*sunVis(p);
    vec3 fillD = vec3(-uSun.x, 0.25, -uSun.z); fillD /= max(length(fillD), 1e-3);
    vec3 shade = mix(alb*uShade, uCobalt, 0.2)*(0.76 + 0.1*n.y + 0.36*dot(n, fillD));
    // light thrown up from the water: slow bright nets that climb the stone and die out by the forks
    float cz = vnoise(vec2(p.x + p.z, p.y*1.6)*0.55 + vec2(uTime*0.5, -uTime*0.33)), cy = vnoise(vec2(p.x - p.z, p.y*1.6)*0.6 + vec2(-uTime*0.41, uTime*0.27) + 9.);
    float net = (1. - smoothstep(0.02, 0.1, abs(cz - cy)))*(1. - smoothstep(4., 30., p.y))*smoothstep(-0.2, 0.3, 0.25 - n.y)*uSunOn;
    shade += alb*vec3(1.05, 1., 0.86)*0.13*net;
    vec3 sunC = alb*vec3(1.06, 1., 0.9)*(0.9 + 0.22*ndl);
    // a lantern hangs from an iron palm leaf on every trunk, 3.7 m toward the aisle, 13 m up: its pool on the stone
    float ax = abs(p.x), lx = ax < 30. ? 12.5 : 39.0, lz = -144. + 36.*clamp(floor((p.z + 144.)/36. + 0.5), 0., 8.);
    vec3 ld = vec3(sign(p.x)*lx, 11.8, lz) - p; float l2 = dot(ld, ld);
    float pool = uLamp*exp(-l2/22.)*(0.35 + 0.65*clamp(dot(n, ld)/sqrt(max(l2, 1e-4)), 0., 1.));
    return mix(shade*mix(0.72, 1., ao), sunC, lit*mix(0.8, 1., ao)) + alb*vec3(1.1, 0.86, 0.5)*pool;
  }
  // ruled brick: both families of straight generators of the hyperboloid round the nearest throat axis. Three
  // levels so the ruling is countable at every distance: single courses (0.3 m), then every 4th line of both
  // families (diamonds in two tones), then every 16th; each hands over to the next before it nears 3 pixels.
  vec3 brickLvl(float g1, float g2, float w, vec2 seed, vec3 a, vec3 b, vec3 mor){
    vec2 c = floor(vec2(g1, g2));
    float chk = mod(c.x + c.y, 2.), h = hash21(c*0.73 + seed);
    vec3 col = mix(a, b, mix(chk, step(0.5, h), 0.35))*(0.95 + 0.1*h);
    float d = 0.5 - max(abs(fract(g1) - 0.5), abs(fract(g2) - 0.5));
    return mix(col, mor, (1. - smoothstep(0.03, 0.031 + w*1.5, d))*0.8);
  }
  vec3 brickAt(vec3 p){
    vec4 th = throatAt(p.xz); vec2 d = p.xz - th.xy;
    float r = max(length(d), th.z), t = sqrt(max(r*r/(th.z*th.z) - 1., 0.));
    float phi = atan(d.y, d.x + 1e-5), up = sign(p.y - ${H.neckY.toFixed(1)});
    float hsh = hash21(th.xy*0.37);
    float band = t < 1.25 ? 1. : (t < 2.7 ? 2. : 4.);                       // more courses as the skirt widens
    float N = 16.*floor(mix(7.8, 9.4, hsh)*mix(1., 0.62, th.w) + 0.5)*band;
    float tw = atan(t)*up;
    float f1 = N*(phi - tw)/6.2831853 + floor(hsh*16.), f2 = N*(phi + tw)/6.2831853 + floor(hsh*48.);
    f1 += 0.18*sin(phi*7. + tw*3. + hsh*40.); f2 += 0.18*sin(phi*5. - tw*2.);   // the hand drifts
    float w1 = fwidth(f1), w2 = fwidth(f2);
    w1 = w1 > 0.4*N ? 0.02 : w1; w2 = w2 > 0.4*N ? 0.02 : w2;              // the atan seam
    float k2 = 4.;
    float l1 = smoothstep(0.86 - w1*2., 0.86, abs(fract(f1) - 0.5)*2.);
    float l2 = 0.7*smoothstep(0.95 - w2*2./k2, 0.95, abs(fract(f2/k2) - 0.5)*2.);
    float tone = hash21(vec2(floor(f1), floor(f2/k2)) + th.xy);
    vec3 a = mix(uSand, uRed, 0.30), b = mix(uSand, uRed, 0.10)*1.04, mor = mix(uSand, uWhite, 0.5);
    vec3 brick = mix(a, b, step(0.5, tone))*(0.93 + 0.14*hash21(vec2(floor(f1), floor(f2/k2))*1.7));
    vec3 mean = mix(mix(a, b, 0.5), mor, 0.15);
    float sold = (1. - smoothstep(0.03, 0.05, abs(t - 1.25)))+(1. - smoothstep(0.04, 0.07, abs(t - 2.7)));
    brick = mix(brick, a*0.9, clamp(sold, 0., 1.));
    vec3 c = mix(brick, mor, max(l1, l2)*0.8);
    float w = max(w1, w2);
    vec3 L1 = brickLvl(f1/4., f2/4., w/4., th.xy, a, b, mor), L2 = brickLvl(f1/16., f2/16., w/16., th.xy + 3.1, a, b, mor);
    c = mix(c, L1, smoothstep(0.16, 0.34, w));
    c = mix(c, L2, smoothstep(0.7, 1.4, w));
    return mix(c, mean, smoothstep(4.5, 9., w));
  }
  // trencadis. uv in chip units (one chip about 1 across), fw = fwidth(uv) taken by the caller, sel picks the
  // colourway of the band (0 all five glazes, 1 green and ochre rim). Returns colour, a = glaze (1) or grout (0);
  // tilt is the chip's own lean for the highlight.
  vec3 shardCol(float h, float sel){
    vec4 gm = uGlazeMix;
    if (sel < 0.5) return h < 0.34 ? uWhite : h < 0.54 ? mix(uWhite, uCobalt, gm.x) : h < 0.73 ? mix(uWhite, uGreen, gm.y) : h < 0.92 ? mix(uWhite, uOchre, gm.z) : mix(uWhite, uRed, gm.w);
    return h < 0.42 ? mix(uWhite, uGreen, gm.y) : h < 0.78 ? mix(uWhite, uOchre, gm.z) : h < 0.92 ? uWhite : mix(uWhite, uRed, gm.w);
  }
  vec4 shardAt(vec2 uv, vec2 fw, float sel, out vec3 tilt){
    vec2 ip = floor(uv), fp = fract(uv); float d1 = 9., d2 = 9.; vec2 id = vec2(0.);
    for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j)), o = hash22(ip + g); o = 0.5 + 0.46*(o - 0.5)*2.*0.9;
      vec2 r = g + o - fp; float d = dot(r, r);
      if (d < d1) { d2 = d1; d1 = d; id = ip + g; } else if (d < d2) { d2 = d; }
    }
    float edge = sqrt(d2) - sqrt(d1);
    float h = hash21(id + 5.3), h2 = hash21(id*1.31 + 9.1);
    vec4 gm = uGlazeMix;
    vec3 col = shardCol(h, sel);
    col *= 0.9 + 0.2*h2;
    // one chip in twenty keeps a stripe from the plate it was
    float stripe = step(0.95, h2)*step(0.5, fract((uv.x*cos(h*6.28) + uv.y*sin(h*6.28))*3.2));
    col = mix(col, mix(uWhite, uCobalt, step(0.5, h)), stripe*0.8);
    float px = max(fw.x, fw.y);
    float grout = 1. - smoothstep(0.07, 0.07 + px*1.5 + 0.03, edge);
    vec3 groutC = uWhite*0.80;
    tilt = (vec3(hash22(id + 2.), h2) - 0.5)*0.22;
    vec3 mean = (sel < 0.5 ? (uWhite*0.34 + mix(uWhite, uCobalt, gm.x)*0.2 + mix(uWhite, uGreen, gm.y)*0.19 + mix(uWhite, uOchre, gm.z)*0.19 + mix(uWhite, uRed, gm.w)*0.08)
                           : (mix(uWhite, uGreen, gm.y)*0.42 + mix(uWhite, uOchre, gm.z)*0.36 + uWhite*0.14 + mix(uWhite, uRed, gm.w)*0.08))*0.93;
    float far = smoothstep(0.3, 0.62, px);
    // far off the chips are gone but the crest keeps its patches: handfuls from the same broken plate lie together
    vec2 cu = uv*0.3 + 0.8*vec2(vnoise(uv*0.4), vnoise(uv*0.4 + 7.3));
    mean = mix(mean, shardCol(hash21(floor(cu) + 11.7), sel)*0.95, 0.5*(1. - smoothstep(1.2, 2.4, px)));
    // and farther still the crest is banded in armfuls of one colour, so tile reads as tile from across the water
    vec2 cv = uv*0.07 + 0.5*vec2(vnoise(uv*0.09 + 3.1), vnoise(uv*0.09 + 9.7));
    mean = mix(mean, shardCol(hash21(floor(cv) + 4.3), sel)*0.95, 0.5*smoothstep(0.5, 1.2, px)*(1. - smoothstep(5., 10., px)));
    tilt *= 1. - far;
    return vec4(mix(mix(col, groutC, grout), mean, far), (1. - grout)*(1. - far) + far*0.7);
  }
  // glaze over the light rule: broad sun lobe, narrowing close by; returns display colour
  vec3 glazeLight(vec4 sh, vec3 tilt, vec3 n, vec3 p, float ao){
    vec3 nn = n + tilt; nn /= max(length(nn), 1e-3);
    vec3 c = gaudiLight(min(sh.rgb*1.22, vec3(0.95)), nn, p, ao)/1.22 + sh.rgb*0.2*sh.a;   // glaze keeps its colour in shade
    vec3 v = uCamL - p; float dist = max(length(v), 1e-3); v /= dist;
    vec3 hv = v + uSun; hv /= max(length(hv), 1e-3);
    float nh = max(dot(nn, hv), 0.), e = mix(60., 14., smoothstep(10., 40., dist));
    float spec = pow(nh, e)*sunVis(p)*sh.a;
    return c + uWhite*spec*mix(0.5, 0.18, smoothstep(10., 60., dist));
  }
`;

// ---------------------------------------------------------------------------------------------------------------
// THE SOLVER. One rope network feeds both scenes: per tree a pinned foot, a first fork, four second forks and
// twelve twig heads held by the vault. Fork positions are relaxed to equilibrium (force densities, Gauss-Seidel
// passes); flipped they are the thrust lines the stone is swept along, unflipped below y 0 they are the chains.
const Q_TRUNK = 2.2, Q_BRANCH = 1.6, Q_TWIG = 1.0;
export function solveTrees(rng) {
  const trees = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < H.nZ; c++) {
    const fx = H.rowsX[r] + rng.range(-0.6, 0.6), fz = H.z0 + H.pitchZ * c + rng.range(-0.6, 0.6);
    const outer = r === 0 || r === 3, side = Math.sign(H.rowsX[r]);
    const lean = (outer ? rng.range(9, 12) : rng.range(5.6, 8.6)) * Math.PI / 180;
    // outer rows lean in under the vault, inner rows lean away from the aisle: pairs scissor, the aisle opens upward
    const zAlt = ((c + r) % 2 ? 1 : -1) * rng.range(0.35, 0.9);
    let dx = (outer ? -side : side), dz = zAlt; const dl = Math.hypot(dx, dz); dx /= dl; dz /= dl;
    const off = H.fork1 * Math.tan(lean) / 0.655;
    const C = { x: fx + dx * off, z: fz + dz * off };
    const a0 = rng.range(-0.2, 0.2), heads = [], f2 = [];
    for (let j = 0; j < 4; j++) {
      const ang = Math.PI / 4 + j * Math.PI / 2 + a0 + rng.range(-0.16, 0.16), row = [];
      for (let k = -1; k <= 1; k++) {
        const a = ang + k * rng.range(0.42, 0.6), R = (k === 0 ? rng.range(11, 13) : rng.range(7.5, 9.5));
        let x = clamp(C.x + Math.cos(a) * R, -H.halfX + 2.5, H.halfX - 2.5), z = clamp(C.z + Math.sin(a) * R, -H.halfZ + 2.5, H.halfZ - 2.5);
        { // no twig lands on a throat's neck: the stars are flown through, and their rims stay clear all round
          const cx = thrCx(thrIndexX(x)), cz = thrCz(thrIndexZ(z)), ra = (Math.abs(cx) > 50 ? H.aLess : H.aGreat) * 1.8, r = Math.hypot(x - cx, z - cz);
          if (r < ra) { const k = ra / Math.max(r, 0.01); x = clamp(cx + (x - cx) * k, -H.halfX + 2.5, H.halfX - 2.5); z = clamp(cz + (z - cz) * k, -H.halfZ + 2.5, H.halfZ - 2.5); } }
        row.push(new THREE.Vector3(x, soffitY(x, z) + 0.25, z));
      }
      heads.push(row);
      f2.push(new THREE.Vector3(C.x, H.fork2 + rng.range(-1.6, 1.6), C.z));
    }
    trees.push({ r, c, foot: new THREE.Vector3(fx, 0, fz), f1: new THREE.Vector3(C.x, H.fork1 + rng.range(-1.5, 1.5), C.z), f2, heads,
      phase: rng.range(0, 6.283), seed: rng() });
  }
  for (let pass = 0; pass < 150; pass++) for (const t of trees) {
    let sx = Q_TRUNK * t.foot.x, sz = Q_TRUNK * t.foot.z;
    for (const b of t.f2) { sx += Q_BRANCH * b.x; sz += Q_BRANCH * b.z; }
    t.f1.x = sx / (Q_TRUNK + 4 * Q_BRANCH); t.f1.z = sz / (Q_TRUNK + 4 * Q_BRANCH);
    for (let j = 0; j < 4; j++) {
      let bx = Q_BRANCH * t.f1.x, bz = Q_BRANCH * t.f1.z;
      for (const h of t.heads[j]) { bx += Q_TWIG * h.x; bz += Q_TWIG * h.z; }
      t.f2[j].x = bx / (Q_BRANCH + 3 * Q_TWIG); t.f2[j].z = bz / (Q_BRANCH + 3 * Q_TWIG);
    }
  }
  for (const t of trees) {                      // the build asserts no trunk within 4 degrees of plumb
    let ox = t.f1.x - t.foot.x, oz = t.f1.z - t.foot.z, l = Math.hypot(ox, oz);
    const min = t.f1.y * Math.tan(5 * Math.PI / 180);
    if (l < min) { const k = min / Math.max(l, 1e-3), sx = l < 1e-3 ? min : ox * k, sz = l < 1e-3 ? 0 : oz * k; t.f1.x = t.foot.x + sx; t.f1.z = t.foot.z + sz; }
    t.lean = Math.atan2(Math.hypot(t.f1.x - t.foot.x, t.f1.z - t.foot.z), t.f1.y) * 180 / Math.PI;
    // the trunk as a weighted rope: steeper at the pin, leaning more toward the fork
    t.trunk = [];
    for (let i = 0; i <= 22; i++) { const s = i / 22, y = lerp(0, t.f1.y, s), q = clamp(y / t.f1.y, 0, 1), w = 0.72 * q + 0.28 * q * q;
      t.trunk.push(new THREE.Vector3(lerp(t.foot.x, t.f1.x, w), y, lerp(t.foot.z, t.f1.z, w))); }
  }
  return trees;
}

// ---------------------------------------------------------------------------------------------------------------
// STONE SWEEP. A member is swept along a polyline with a faceted section (flat normals: every arris is a cut edge).
// star: { depth(s01), twist(s01) } gives the double-twist column (two star prisms turned opposite ways, intersected).
// out = { pos: [], att: [] } (att = s metres along, seed, ao). Exported so the viaduct columns are the same stone.
const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Vector3();
const tri01 = (x) => 1 - Math.abs((x - Math.floor(x)) - 0.5) * 2;
export function sweepMember(out, P, radius, nRad, star, seed, aoFn, collar) {
  const n = P.length, rings = [];
  let Ltot = 0; for (let i = 1; i < n; i++) Ltot += P[i].distanceTo(P[i - 1]);
  const KK = star ? Math.min(Math.round(Ltot * 4), 999) + 1000 * Math.round(Math.abs(star.twist(1)) * 8 / Math.PI * 10) : 0;      // length (quarter metres) + 1000 x the second star's shift in points x 10
  let s = 0; _n.set(1, 0, 0.0001);
  for (let i = 0; i < n; i++) {
    const a = P[Math.max(i - 1, 0)], b = P[Math.min(i + 1, n - 1)];
    _t.subVectors(b, a).normalize();
    _n.addScaledVector(_t, -_n.dot(_t)).normalize(); _b.crossVectors(_t, _n);
    if (i > 0) s += P[i].distanceTo(P[i - 1]);
    const s01 = i / (n - 1), R = radius(s01, s), dep = star ? star.depth(s01) : 0, tw = star ? star.twist(s01) : 0, ring = [];
    for (let j = 0; j < nRad; j++) {
      const base = j / nRad, ang = base * Math.PI * 2 + tw;
      let rr = R;
      if (star) rr = R * Math.min(1 - dep * tri01(base * 8), 1 - dep * tri01((ang + tw) * 8 / (Math.PI * 2)));
      const cx = Math.cos(ang) * rr, sy = Math.sin(ang) * rr;
      ring.push(P[i].x + _n.x * cx + _b.x * sy, P[i].y + _n.y * cx + _b.y * sy, P[i].z + _n.z * cx + _b.z * sy);
    }
    rings.push({ ring, s, ao: KK + 0.5 * clamp(aoFn ? aoFn(P[i], s01) : 1, 0, 1) });
  }
  const pos = out.pos, att = out.att, sI = Math.floor(seed * 100) * 8 + (nRad >= 16 ? 6 : nRad >= 8 ? 3 : 2);
  for (let i = 0; i < n - 1; i++) {
    const A = rings[i], B = rings[i + 1];
    for (let j = 0; j < nRad; j++) {
      const j1 = (j + 1) % nRad, a = j * 3, b = j1 * 3;
      pos.push(A.ring[a], A.ring[a + 1], A.ring[a + 2], A.ring[b], A.ring[b + 1], A.ring[b + 2], B.ring[b], B.ring[b + 1], B.ring[b + 2],
        A.ring[a], A.ring[a + 1], A.ring[a + 2], B.ring[b], B.ring[b + 1], B.ring[b + 2], B.ring[a], B.ring[a + 1], B.ring[a + 2]);
      const sC = sI + (collar && i >= collar[0] && i < collar[1] ? collar[2] : 0), sa = sC + j / nRad * 0.999, sb = sC + (j + 1) / nRad * 0.999;
      att.push(A.s, sa, A.ao, A.s, sb, A.ao, B.s, sb, B.ao, A.s, sa, A.ao, B.s, sb, B.ao, B.s, sa, B.ao);
    }
  }
}
export function sweepGeometry(out) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(out.pos, 3));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(out.att, 3));
  g.computeVertexNormals();
  return g;
}
const seg = (a, b, n) => { const p = []; for (let i = 0; i <= n; i++) p.push(a.clone().lerp(b, i / n)); return p; };
const knot = (s, at, w) => Math.exp(-((s - at) / w) * ((s - at) / w));
/** All 36 trees as one stone geometry (about 59k triangles). Async: yields between trees. */
// flat normals for a run of non-indexed triangles (what computeVertexNormals gives them), as a typed chunk
function flatChunk(out) {
  const pos = new Float32Array(out.pos), att = new Float32Array(out.att), nor = new Float32Array(pos.length);
  for (let i = 0; i < pos.length; i += 9) {
    const ax = pos[i + 3] - pos[i], ay = pos[i + 4] - pos[i + 1], az = pos[i + 5] - pos[i + 2], bx = pos[i + 6] - pos[i], by = pos[i + 7] - pos[i + 1], bz = pos[i + 8] - pos[i + 2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    for (let k = 0; k < 9; k += 3) { nor[i + k] = nx; nor[i + k + 1] = ny; nor[i + k + 2] = nz; }
  }
  return { pos, att, nor };
}
async function buildStone(ctx, trees, skip) {
  const chunks = [], aoY = (p) => 1 - 0.5 * smoothstep(40, 61, p.y);
  for (const t of trees) {
    if (skip && skip(t)) continue;
    const out = { pos: [], att: [] }, L = t.f1.y;
    // trunk: 4.2 m thick at the water, 3 m at the fork, a plinth swelling into the water and a knot at the fork
    sweepMember(out, t.trunk, (u, s) => lerp(2.65, 1.8, u) + 0.35 * knot(s, 0, 2.2) + 0.55 * knot(s, L, 2.4) - 0.2 * knot(s, L - 4.6, 1.6), 32,
      { depth: (u) => 0.4 * (1 - smoothstep(0.84, 0.99, u)), twist: (u) => u * Math.PI / 4 * (t.seed > 0.5 ? 1 : -1) }, t.seed, (p) => 1 - 0.3 * smoothstep(22, 31, p.y), [20, 22, 1]);
    chunks.push(flatChunk(out)); out.pos.length = 0; out.att.length = 0;
    await ctx.yield();
    for (let j = 0; j < 4; j++) {
      const b = t.f2[j], Lb = b.distanceTo(t.f1);
      sweepMember(out, seg(t.f1, b, 7), (u, s) => lerp(1.25, 0.92, u) + 0.42 * knot(s, 0, 2.4) + 0.34 * knot(s, Lb, 1.5) - 0.1 * knot(s, Lb - 3, 1.2), 8, null, t.seed + j * 0.07, aoY, [6, 7, 1]);
      for (let k = 0; k < 3; k++) {
        const h = t.heads[j][k], Lt = h.distanceTo(b);
        sweepMember(out, seg(b, h, 4), (u, s) => lerp(0.7, 0.46, u) + 0.2 * knot(s, 0, 1.4) + 0.32 * knot(s, Lt, 1.5), 6, null, t.seed + j * 0.07 + k * 0.013, aoY);
      }
    }
    chunks.push(flatChunk(out));
    await ctx.yield();
  }
  let n = 0; for (const c of chunks) n += c.pos.length;
  const pos = new Float32Array(n), att = new Float32Array(n), nor = new Float32Array(n); let o = 0, i = 0;
  for (const c of chunks) { pos.set(c.pos, o); att.set(c.att, o); nor.set(c.nor, o); o += c.pos.length; if (++i % 8 === 0) await ctx.yield(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aS', new THREE.BufferAttribute(att, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 30, 0), 190);
  await ctx.yield();
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// THE VAULT: per throat cell a polar patch of soffit (hyperboloid skirts, creased where cells meet), the upper
// throat to its collar, a rounded lip and the roof skin; a bulged fascia round the open sides. aM = (material, v):
// 0 soffit, 1 upper throat, 2 roof, 3 fascia.
function pushGrid(G, rings, mat, want) {
  const base = G.pos.length / 3, n = rings[0].length;
  for (let m = 0; m < rings.length; m++) for (let j = 0; j < n; j++) { const v = rings[m][j]; G.pos.push(v[0], v[1], v[2]); G.am.push(mat, v[3] ?? m / (rings.length - 1)); }
  // orientation: test one triangle against the wanted outward direction
  const a = rings[0][0], b = rings[0][1], c = rings[1][0];
  const nx = (b[1] - a[1]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[1] - a[1]), ny = (b[2] - a[2]) * (c[0] - a[0]) - (b[0] - a[0]) * (c[2] - a[2]), nz = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const flip = nx * want[0] + ny * want[1] + nz * want[2] < 0;
  for (let m = 0; m < rings.length - 1; m++) for (let j = 0; j < n - 1; j++) {
    const p = base + m * n + j, q = p + 1, r = p + n, s = r + 1;
    if (flip) G.idx.push(p, r, q, q, r, s); else G.idx.push(p, q, r, q, s, r);
  }
}
// what computeVertexNormals does (area-weighted, per index), 10k triangles a step
async function vertexNormalsInSteps(g, pause) {
  const pos = g.getAttribute('position').array, idx = g.index.array, n = new Float32Array(pos.length);
  for (let o = 0; o < idx.length; o += 30000) {
    const e = Math.min(o + 30000, idx.length);
    for (let i = o; i < e; i += 3) {
      const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
      const cx = pos[c] - pos[b], cy = pos[c + 1] - pos[b + 1], cz = pos[c + 2] - pos[b + 2], ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
      const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
      n[a] += nx; n[a + 1] += ny; n[a + 2] += nz; n[b] += nx; n[b + 1] += ny; n[b + 2] += nz; n[c] += nx; n[c + 1] += ny; n[c + 2] += nz;
    }
    await pause();
  }
  for (let o = 0; o < n.length; o += 90000) {
    const e = Math.min(o + 90000, n.length);
    for (let i = o; i < e; i += 3) { const l = Math.hypot(n[i], n[i + 1], n[i + 2]) || 1; n[i] /= l; n[i + 1] /= l; n[i + 2] /= l; }
    await pause();
  }
  g.setAttribute('normal', new THREE.BufferAttribute(n, 3));
}
async function buildVault(ctx, skipCell) {
  const G = { pos: [], am: [], idx: [] };
  const xb = [-H.halfX, -45, -15, 15, 45, H.halfX];
  for (let ii = 0; ii < 5; ii++) for (let k = 0; k < H.nThrZ; k++) {
    const i = ii - 2, cx = thrCx(i), cz = thrCz(k), less = Math.abs(i) === 2, a = less ? H.aLess : H.aGreat;
    if (skipCell && skipCell(i, k)) continue;
    const x0 = xb[ii], x1 = xb[ii + 1], z0 = k === 0 ? -H.halfZ : cz - 18, z1 = k === H.nThrZ - 1 ? H.halfZ : cz + 18;
    const angs = []; const NA = less ? 22 : 28;
    for (let j = 0; j < NA; j++) angs.push(-Math.PI + (j + 0.5) / NA * Math.PI * 2);
    for (const [px, pz] of [[x0, z0], [x1, z0], [x1, z1], [x0, z1]]) angs.push(Math.atan2(pz - cz, px - cx));
    angs.sort((p, q) => p - q); angs.push(angs[0] + Math.PI * 2);
    const rmax = (ang) => { const c = Math.cos(ang), s = Math.sin(ang);
      return Math.min(c > 1e-6 ? (x1 - cx) / c : c < -1e-6 ? (x0 - cx) / c : 1e9, s > 1e-6 ? (z1 - cz) / s : s < -1e-6 ? (z0 - cz) / s : 1e9); };
    const ring = (f) => angs.map((ang) => f(ang, Math.cos(ang), Math.sin(ang), rmax(ang)));
    // soffit: rings evenly in the hyperboloid parameter t, so the near-vertical neck is tessellated
    const W = [0, 0.1, 0.24, 0.42, 0.62, 0.82, 1], sof = W.map((w) => ring((ang, c, s, rm) => {
      const tm = Math.sqrt(Math.max(rm * rm / (a * a) - 1, 0)), t = tm * w, r = w === 1 ? rm : a * Math.sqrt(1 + t * t), x = cx + c * r, z = cz + s * r;
      return [x, w === 0 ? H.neckY : soffitY(x, z), z]; }));
    pushGrid(G, sof, 0, [0, -1, 0]);
    const up = [0, 0.25, 0.5, 0.75].map((t) => ring((ang, c, s) => { const r = a * Math.sqrt(1 + t * t); return [cx + c * r, H.neckY + H.bUp * t, cz + s * r]; }));
    pushGrid(G, up, 1, [cx - up[0][0][0], 0.3, cz - up[0][0][2]]);
    const RW = [-2, -1, 1.3, 1.62, 2.0, 2.4], roof = [];
    for (const q of RW) roof.push(ring((ang, c, s) => { const r = a * (q === -2 ? 1.25 : q === -1 ? 1.28 : q), x = cx + c * r, z = cz + s * r;
      return [x, q === -2 ? H.collarY : q === -1 ? H.collarY + 0.32 : roofY(x, z), z]; }));
    for (const w of [0.4, 0.8, 1]) roof.push(ring((ang, c, s, rm) => { const r = lerp(2.4 * a, rm, w), x = cx + c * r, z = cz + s * r; return [x, roofY(x, z), z]; }));
    pushGrid(G, roof, 2, [0, 1, 0]);
    // fascia on the open sides: where the last ring lies on the perimeter, join soffit edge to roof edge with a bulge
    const sEdge = sof[sof.length - 1], rEdge = roof[roof.length - 1], per = (v) => Math.abs(v[0]) > H.halfX - 0.01 || Math.abs(v[2]) > H.halfZ - 0.01;
    for (let j = 0; j < angs.length - 1; j++) {
      if (!per(sEdge[j]) || !per(sEdge[j + 1])) continue;
      const mx = (sEdge[j][0] + sEdge[j + 1][0]) / 2, mz = (sEdge[j][2] + sEdge[j + 1][2]) / 2;
      const ox = Math.abs(mx) > H.halfX - 0.01 ? Math.sign(mx) : 0, oz = ox === 0 ? Math.sign(mz) : 0;
      const col = (jj) => [0, 0.3, 0.7, 1].map((v) => { const e = sEdge[jj], t = rEdge[jj], bulge = Math.sin(v * Math.PI) * 0.9;
        return [e[0] + ox * bulge, lerp(e[1], t[1], v), e[2] + oz * bulge, v]; });
      const A = col(j), B = col(j + 1);
      pushGrid(G, [0, 1, 2, 3].map((m) => [A[m], B[m]]), 3, [ox, 0, oz]);
    }
    if (k % 2) await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  await ctx.yield();
  g.setAttribute('position', new THREE.Float32BufferAttribute(G.pos, 3)); await ctx.yield();
  g.setAttribute('aM', new THREE.Float32BufferAttribute(G.am, 2));
  g.setIndex(G.idx); await ctx.yield();
  await vertexNormalsInSteps(g, () => ctx.yield());
  return g;
}

// ---------------------------------------------------------------------------------------------------------------
// MATERIALS (all unlit ShaderMaterials writing scene-linear values; `shared` = makeShared()).
const VERT_STD = /* glsl */`
  uniform vec3 uOrigin;
  varying vec3 vP, vN;
  uniform float uMir, uTime;
  void stdVert(){ vec4 w = modelMatrix*vec4(position, 1.); vP = w.xyz - uOrigin; vN = normalize(mat3(modelMatrix)*normal + vec3(0., 1e-6, 0.));
    if (uMir < 0.) { float h = max(vP.y, 0.);                              // the image under the water, trembling a little more the deeper it lies
      w.y = uOrigin.y - vP.y;
      w.xz += (0.05 + 0.006*h)*vec2(sin(h*1.9 + uTime*1.7 + w.z*0.21), sin(h*1.3 - uTime*1.3 + w.x*0.17)); }
    gl_Position = projectionMatrix*viewMatrix*w; }
`;
/** Sandstone for anything swept with sweepMember (attribute aS = s metres along, seed, ao): drum joints every
 *  1.2 m, a tone per drum, wet band at the water, the light rule. Use for trunks, viaduct columns, wall copings. */
export function stoneMaterial(shared, mirror) {
  return new THREE.ShaderMaterial({
    uniforms: mirror ? { ...shared, uMir: { value: -1 } } : shared, side: mirror ? THREE.BackSide : THREE.FrontSide,
    vertexShader: VERT_STD + /* glsl */`
      attribute vec3 aS; varying vec3 vS;
      void main(){ vS = aS; stdVert(); }`,
    fragmentShader: /* glsl */`
      varying vec3 vP, vN, vS;
      ${STYLE_GLSL}
      void main(){
        vec3 n = vN/max(length(vN), 1e-3);
        float d = vS.x/1.2, w = fwidth(d), jd = abs(fract(d + 0.5) - 0.5);
        float joint = (1. - smoothstep(0.012, 0.014 + w, jd))*(1. - smoothstep(0.2, 0.45, w));
        float sI = floor(vS.y), th = fract(vS.y)/0.999, nB = mod(sI, 8.), drum = floor(d + 0.5);
        float bv = th*nB + hash21(vec2(drum, sI))*3., wv = fwidth(bv); wv = wv > 1. ? 0.01 : wv;
        float jv = (1. - smoothstep(0.012, 0.016 + wv, abs(fract(bv + 0.5) - 0.5)))*(1. - smoothstep(0.2, 0.45, wv));
        joint = max(joint, 0.2*jv*step(2.5, nB));
        float tone = mix(hash21(vec2(drum, sI)), hash21(vec2(drum*7. + floor(bv + 0.5), sI)), 0.15);
        float grain = vnoise(vP.xz*2.3 + vP.y*vec2(1.7, 2.9)) - 0.5;
        float bed = sin((vS.x + grain*0.6)*26.)*0.5;                       // sedimentary bedding, a few cm
        float px = length(fwidth(vP));
        float sgn = mod(drum, 2.) < 0.5 ? 1. : -1.;
        float tool = sin((th*11.3 + sgn*vS.x)*120. + grain*3.)*(1. - smoothstep(0.012, 0.035, px));   // chisel strokes, turned drum by drum
        vec3 alb = uSand*(0.95 + 0.07*tone + 0.07*grain + 0.03*bed*(1. - smoothstep(0.03, 0.09, px)) + 0.035*tool);
        alb = mix(alb, uSand*vec3(1.04, 0.97, 0.9), step(0.8, tone)*0.5);
        alb *= 1. - 0.24*joint;
        // the arrises, ruled: the two star prisms of the double twist cut a groove each way round the column, and the
        // flanks either side of a groove take the light differently
        float aoS = fract(vS.z)*2., kk = floor(vS.z), Lm = mod(kk, 1000.)*0.25, shf = floor(kk/1000.)*0.1;
        if (Lm > 0.5) {
          float u01 = clamp(vS.x/Lm, 0., 1.), sg = floor(sI/8.) >= 50. ? 1. : -1.;
          float a1 = th*8., a2 = th*8. + sg*shf*u01, w1 = fwidth(a1), w2 = fwidth(a2);
          w1 = w1 > 0.5 ? 0.02 : w1; w2 = w2 > 0.5 ? 0.02 : w2;
          float g1 = (1. - smoothstep(0.045, 0.05 + w1*1.5, abs(fract(a1) - 0.5)))*(1. - smoothstep(0.25, 0.6, w1));
          float g2 = (1. - smoothstep(0.045, 0.05 + w2*1.5, abs(fract(a2) - 0.5)))*(1. - smoothstep(0.25, 0.6, w2));
          float fade = 1. - smoothstep(0.72, 0.97, u01);
          float flank = mix(0.5, step(0.5, fract(a1)), 1. - smoothstep(0.25, 0.6, w1))*0.6 + mix(0.5, step(0.5, fract(a2)), 1. - smoothstep(0.25, 0.6, w2))*0.4;
          alb *= (1. - 0.42*max(g1, g2)*fade)*(1. + (flank - 0.5)*0.26*fade);
        }
        alb *= mix(0.6, 1., smoothstep(0.15, 0.85, vP.y + grain*0.5));     // wet at the waterline
        if (uMir < 0. && vP.y < 0.02) discard;
        vec3 D = gaudiLight(alb, n, vP, aoS);
        // broken tile where he put it on a column: a skirt at the water under a green and ochre hem, and the knot
        // under each fork (nB 7 the trunk's, 4 a branch's), so the colour of the roof comes down into the hall
        float circ = nB > 5.5 ? 12.5 : nB < 0.5 ? 6.5 : 5.6;
        float sgnH = mod(floor(sI/8.), 2.) < 0.5 ? 1. : -1.;
        float via = step(1.5, shf)*step(shf, 1.7);                          // a viaduct column keeps its shard skirt; a trunk only a hem at the water
        float hem = (nB > 5.5 ? mix(0.9, 4.2, via) : 3.2) + (nB > 5.5 ? mix(0.3, 0.8, via) : 0.8)*sin(th*18.85 + sI) + 0.2*sin(th*44. + sI*1.7);
        float skirt = 1. - smoothstep(hem + 0.7, hem + 0.76, vP.y);
        float knotB = (abs(nB - 7.) < 0.5 || abs(nB - 4.) < 0.5) ? 1. : 0.;
        // and two ribbons of it wound up each column the way its arrises turn: the double twist, in colour
        float hel = fract(th*2. + vS.x*0.09*sgnH + 0.25);
        float ribbon = 0.*hel;
        if (max(max(skirt, knotB), ribbon) > 0.5) {
          float selS = knotB > 0.5 ? (nB < 5. ? 1. : 0.) : skirt > 0.5 ? step(hem, vP.y) : step(0.5, fract(th + vS.x*0.045*sgnH + 0.125));
          vec2 suv = vec2(th*circ, vS.x)/0.24;
          vec3 tilt; vec4 sh = shardAt(suv, vec2(w*6.5), selS, tilt);
          sh.rgb *= mix(0.72, 1., smoothstep(0.1, 0.9, vP.y + grain*0.5));
          D = glazeLight(sh, tilt, n, vP, aoS);
        }
        gl_FragColor = vec4(toScene(mirTone(D, vP.y)), 1.);
      }`,
  });
}
/** The vault: ruled brick on soffit, throats and fascia (courses along both generator families), lime wash on
 *  the roof, trencadis only on throat rims, collars, roof crests and the fascia crest. Attribute aM = (mat, v). */
export function vaultMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: VERT_STD + /* glsl */`
      attribute vec2 aM; varying vec2 vM;
      void main(){ vM = aM; stdVert(); }`,
    fragmentShader: /* glsl */`
      varying vec3 vP, vN; varying vec2 vM;
      ${STYLE_GLSL}
      float ridgeD(vec2 q){
        float ax = abs(q.x), dx = min(abs(ax - 15.), abs(ax - 45.));
        float zz = q.y + 108., dz = abs(zz - 36.*clamp(floor(zz/36. + 0.5), 0., 6.));
        return min(dx + 0.8*sin(q.y*0.21), dz + 0.8*sin(q.x*0.17));
      }
      void main(){
        vec3 n = vN/max(length(vN), 1e-3);
        vec4 th = throatAt(vP.xz); vec2 dd = vP.xz - th.xy;
        float r = length(dd), ra = r/th.z, phi = atan(dd.y, dd.x + 1e-5);
        float px = length(fwidth(vP))/0.2;
        float mat = floor(vM.x + 0.5);
        vec3 alb; float band = 0., sel = 0., ao = 1., roofLit = -1.; vec2 suv = vP.xz/0.2;
        if (mat < 1.5) {                                   // soffit and upper throat: ruled brick, shard rims
          alb = brickAt(vP);
          float y = vP.y + 0.25*sin(phi*5. + th.x);
          float rim = smoothstep(${(H.neckY - 1.4).toFixed(1)}, ${(H.neckY - 1.2).toFixed(1)}, y)*(1. - smoothstep(${(H.neckY + 0.6).toFixed(1)}, ${(H.neckY + 0.8).toFixed(1)}, y));
          float col = smoothstep(${(H.collarY - 1.7).toFixed(1)}, ${(H.collarY - 1.4).toFixed(1)}, y);
          rim = max(rim, (1. - step(0.5, mat))*(1. - smoothstep(1.17, 1.19, ra + 0.035*sin(phi*9. + th.y) + 0.02*sin(phi*23.))));      // green and ochre at the neck, all five glazes round it
          band = max(rim, col); sel = (rim > col && ra < 1.2) ? 1. : 0.;
          suv = vec2(phi*th.z, vP.y - (r - th.z)*(1. - step(0.5, mat)))/0.2;
          ao = mix(0.55, 1.15, smoothstep(57., 66., vP.y));                 // sky pours in at the throats
        } else if (mat < 2.5) {                            // roof: lime wash; shards on collars and crest lines
          float wash = vnoise(vP.xz*0.7)*0.6 + vnoise(vP.xz*3.1)*0.4;
          // sand brick in ruled courses, as the vault under it (the two families of straight lines round each star), the
          // old lime wash worn back to patches in the hollows
          alb = mix(brickAt(vP), uSand, 0.42)*(1.0 + 0.06*wash);
          alb = mix(alb, uWhite*0.94, 0.42*smoothstep(0.5, 0.78, vnoise(vP.xz*0.13 + 7.) + 0.25*(wash - 0.5)));
          float crest = 1. - smoothstep(0.78, 0.98, abs(ridgeD(vP.xz)) + 0.3*vnoise(vP.xz*0.9));
          float col = 1. - smoothstep(1.86, 1.98, ra + 0.06*sin(phi*7.));
          band = max(crest*smoothstep(2.0, 2.3, ra), col);
          suv = vP.xz/0.3; px *= 0.667;
          // the humps' own slope, exact per pixel, so each hump shows one hard edge of sun and shade
          float x = vP.x, z = vP.z;
          vec2 g = vec2(0.285*cos(x*0.19 + 0.7)*cos(z*0.115) + 0.054*cos(z*0.27 + x*0.06) - 0.246*sin(x*0.41 - z*0.05),
                        -0.1725*sin(x*0.19 + 0.7)*sin(z*0.115) + 0.243*cos(z*0.27 + x*0.06) + 0.03*sin(x*0.41 - z*0.05));
          vec3 nA = vec3(-g.x, 1., -g.y); nA /= max(length(nA), 1e-3);
          float dP = min(${H.halfX.toFixed(1)} - abs(x), ${H.halfZ.toFixed(1)} - abs(z));
          n = mix(n, nA, smoothstep(2.3, 2.9, ra)*smoothstep(4., 9., dP));
          roofLit = smoothstep(0.842*uSun.y, 0.9*uSun.y, dot(n, uSun))*sunVis(vP);
                } else {                                           // fascia: brick with a shard crest
          alb = brickAt(vP);
          band = smoothstep(0.72, 0.78, vM.y + 0.04*sin((vP.x + vP.z)*0.9));
          suv = vec2(vP.x + vP.z, vP.y)/0.2;
          ao = 0.9;
        }
        vec3 D;
        if (band > 0.5) { vec3 tilt; vec4 sh = shardAt(suv, vec2(px), sel, tilt); D = glazeLight(sh, tilt, n, vP, min(ao, 1.)); }
        else if (roofLit >= 0.) D = mix(mix(alb*(uShade + 0.09), uCobalt, 0.12), alb*vec3(1.04, 1., 0.93), roofLit);        // lime wash: two tones, sun and sky
        else D = gaudiLight(alb, n, vP, min(ao, 1.))*max(ao, 1.)*(mat < 0.5 ? 1.22 : 1.);          // the soffit takes the water's light
        gl_FragColor = vec4(toScene(D), 1.);
      }`,
  });
}

// ---------------------------------------------------------------------------------------------------------------
// THE HANGING MODEL: chains (camera-facing ribbons, links drawn in the shader, never thinner than 1.5 px), sacks,
// blue discs. THE MEDIUM MOVES: every tree of chain swings as a pendulum from its pin at the surface, each strand
// wobbles as a rope, each sack swings on its own phase; 0.15 m at rest, up to 0.9 m within 60 m of the camera.
export const SWAY_GLSL = /* glsl */`
  uniform float uTime; uniform vec3 uCamL; uniform vec4 uShift;
  vec3 swayAt(vec3 p, float treePhase, float dirAng){
    float depth = max(-p.y, 0.), f = depth/66.;
    float amp = mix(0.22, 0.9, 1. - smoothstep(18., 70., length(p.xz - uCamL.xz)));
    vec2 dir = vec2(cos(dirAng), sin(dirAng));
    float a = sin(uTime*(0.80 + 0.35*fract(treePhase*3.7)) + treePhase), b = sin(uTime*(0.6 + 0.3*fract(treePhase*5.1)) + treePhase*1.7);
    vec3 web = vec3(uShift.x, 0., uShift.y)*(f*(1. - smoothstep(30., 150., length(p.xz - uShift.zw))));   // the rare event: one more sack, the whole web shifts
    return vec3(dir.x*a - dir.y*b*0.5, 0., dir.y*a + dir.x*b*0.5)*(amp*f) + web;
  }
  vec3 ropeAt(vec3 p, float s01, float strandPhase, float dirAng){
    float amp = mix(0.22, 0.9, 1. - smoothstep(18., 70., length(p.xz - uCamL.xz)));
    return vec3(-sin(dirAng), 0., cos(dirAng))*(sin(3.14159*clamp(s01, 0., 1.))*amp*0.5*sin(uTime*1.9 + strandPhase));
  }
`;
/** Chain ribbons from strands: [{ pts: Vector3[] (already below the water), tree: phase, dir: angle, w: width m }]. */
export function chainGeometry(strands, rng) {
  const pos = [], tan = [], ac = [], ad = [], idx = [];
  for (const st of strands) {
    const P = st.pts, n = P.length, sp = rng.range(0, 6.283), base = pos.length / 3; let s = 0, L = 0;
    for (let i = 1; i < n; i++) L += P[i].distanceTo(P[i - 1]);
    for (let i = 0; i < n; i++) {
      if (i > 0) s += P[i].distanceTo(P[i - 1]);
      _t.subVectors(P[Math.min(i + 1, n - 1)], P[Math.max(i - 1, 0)]).normalize();
      for (const side of [-1, 1]) {
        pos.push(P[i].x, P[i].y, P[i].z); tan.push(_t.x, _t.y, _t.z);
        ac.push(side * (st.w ?? 1), s, sp, st.tree); ad.push(st.pin === false ? 0 : s / Math.max(L, 1e-3), st.dir);
      }
      if (i < n - 1) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(tan, 3));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(ac, 4));
  g.setAttribute('aD', new THREE.Float32BufferAttribute(ad, 2));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -33, 0), 400);
  return g;
}
const DEPTH_GLSL = /* glsl */`
  // the style's distance rule under water: a pale thing blues, then sinks toward the iron black, fathom by fathom
  // (white at the surface, cobalt by 30 m, nearly gone by 66 m), so the eye reads how deep it hangs
  vec3 sink(vec3 c, float y){ float d = clamp(-y/66., 0., 1.);
    c = mix(c, mix(c, uCobalt, 0.6)*0.86, smoothstep(0., 0.45, d));
    return mix(c, mix(uIron, uCobalt, 0.3), 0.82*smoothstep(0.18, 1., d)); }
`;
export function chainMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: shared, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${SWAY_GLSL}
      attribute vec3 aT; attribute vec4 aC; attribute vec2 aD;
      varying vec3 vUV; varying vec3 vP; varying float vStar;
      void main(){
        vStar = step(30., aD.y);
        vec3 p = position + swayAt(position, aC.w, aD.y) + ropeAt(position, aD.x, aC.z, aD.y);
        vec4 w = modelMatrix*vec4(p, 1.);
        vec3 v = cameraPosition - w.xyz; float dist = max(length(v), 1e-3);
        vec3 side = cross(aT, v/dist); side /= max(length(side), 1e-3);
        float wgt = abs(aC.x);
        float real = 0.085*wgt, drawn = max(real, dist*mix(0.0037, 0.0027, smoothstep(90., 340., dist))*(0.55 + 0.45*wgt));
        w.xyz += side*sign(aC.x)*drawn;
        vUV = vec3(sign(aC.x), aC.y/(0.34*max(wgt, 1.)), real/drawn); vP = p;
        gl_Position = projectionMatrix*viewMatrix*w;
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vUV; varying vec3 vP; varying float vStar;
      ${STYLE_GLSL}
      ${DEPTH_GLSL}
      void main(){
        float fy = fwidth(vUV.y), x = vUV.x, y = fract(vUV.y), odd = step(1., mod(vUV.y, 2.));
        // links: flat oval rings alternate with links seen edge-on
        vec2 q = vec2(x, (y - 0.5)*2.);
        float ring = abs(length(q*vec2(1., 0.92)) - 0.72);
        float flat_ = 1. - smoothstep(0.2, 0.3, ring), edge = (1. - smoothstep(0.24, 0.34, abs(x)))*step(abs(q.y), 0.98);
        float link = mix(flat_, edge, odd);
        float far = smoothstep(0.18, 0.4, fy);
        float cover = mix(link, 0.62, far);
        if (cover < 0.35 && far < 0.5) discard;
        float tone = 0.86 + 0.14*mix(1. - abs(x)*0.6, 1., far) - 0.1*odd*(1. - far);
        float sunny = 0.80 + 0.2*sunVis(vec3(vP.x, 0., vP.z));
        float disc = sunDisc(vec3(vP.x, 0.01, vP.z)), dp = clamp(-vP.y/66., 0., 1.);
        dp *= mix(1., 0.6, disc)*mix(1., 0.62, vStar);                      // under a sun ellipse the chains are lit deeper; the stars found by hanging keep some light
        vec3 c = uWhite*tone*sunny;
        c = mix(c, mix(uCobalt, uWhite, 0.3)*tone, smoothstep(0.02, 0.42, dp));     // white at the surface, paling to cobalt,
        c = mix(c, mix(uIron, uCobalt, 0.34), 0.86*smoothstep(0.24, 1., dp));        // then into the black by 66 m
        c = mix(c, mix(uSand, uWhite, 0.6), 0.5*disc*(1. - dp));
        c = mix(uIron, c, mix(1., vUV.z*0.22 + 0.78, far));                 // a widened far ribbon keeps its true weight
        gl_FragColor = vec4(toScene(c), 1.);
      }`,
  });
}
/** A canvas sack of shot on its string: 54 triangles, hangs from its origin down -Y. */
function sackGeometry() {
  const prof = [[0.03, 0.0], [0.16, -0.08], [0.09, -0.18], [0.36, -0.48], [0.43, -0.9], [0.25, -1.26], [0.0, -1.34]];
  const pts = prof.map(([r, y]) => new THREE.Vector2(Math.max(r, 0.001), y));
  const g = new THREE.LatheGeometry(pts, 6);
  return g;
}
export function sackMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: shared,
    vertexShader: /* glsl */`
      ${SWAY_GLSL}
      attribute vec4 aI; attribute vec4 aJ;      // aI: attach point xyz, size; aJ: tree phase, tree dir, own phase, tint
      varying vec3 vL, vN, vP; varying float vTint;
      void main(){
        float amp = mix(0.22, 0.9, 1. - smoothstep(18., 70., length(aI.xz - uCamL.xz)));
        float th = amp*0.6*sin(uTime*(1.5 + 0.5*fract(aJ.z*2.3)) + aJ.z), ph = aJ.z*3.1;
        vec3 ax = vec3(cos(ph), 0., sin(ph));
        vec3 l = position*aI.w;
        // swing about the attach point (Rodrigues, axis horizontal)
        vec3 r = l*cos(th) + cross(ax, l)*sin(th) + ax*dot(ax, l)*(1. - cos(th));
        vec3 nn = normal*cos(th) + cross(ax, normal)*sin(th) + ax*dot(ax, normal)*(1. - cos(th));
        vec3 p = aI.xyz + swayAt(aI.xyz, aJ.x, aJ.y) + r;
        vL = position; vN = nn; vP = p; vTint = aJ.w;
        gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(p, 1.);
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vL, vN, vP; varying float vTint;
      ${STYLE_GLSL}
      ${DEPTH_GLSL}
      void main(){
        vec3 n = vN/max(length(vN), 1e-3);
        float string_ = 0., tie = step(-0.2, vL.y);
        float px = fwidth(vL.y);
        float weave = 0.5 + 0.5*sin(vL.y*70.)*(1. - smoothstep(0.02, 0.06, px));
        vec3 canvas = mix(uOchre, uSand, 0.25 + 0.3*vTint)*(0.9 + 0.1*weave);
        vec3 alb = mix(canvas, uWhite*0.9, max(string_, tie*0.0));
        alb = mix(alb, uIron, tie*0.7);
        float lightTop = 0.62 + 0.38*clamp(n.y*0.5 + 0.5 + 0.35*n.x, 0., 1.);
        float sunny = 0.82 + 0.18*sunVis(vec3(vP.x, 0., vP.z));
        gl_FragColor = vec4(toScene(sink(alb*lightTop*sunny*(1. + 0.25*sunDisc(vec3(vP.x, 0.01, vP.z))), vP.y*0.8)), 1.);
      }`,
  });
}
/** The blue discs of the model: what the stars are, found by hanging. Attribute aK = phase, dir, rim 0..1. */
export function discMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: shared, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${SWAY_GLSL}
      attribute vec3 aK; varying vec3 vP; varying float vR;
      void main(){ vec3 p = position + swayAt(position, aK.x, aK.y); vP = p; vR = aK.z;
        gl_Position = projectionMatrix*viewMatrix*modelMatrix*vec4(p, 1.); }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; varying float vR;
      ${STYLE_GLSL}
      ${DEPTH_GLSL}
      void main(){
        float wr = fwidth(vR) + 1e-4;
        vec3 c = mix(uCobalt*1.12, uWhite, 0.06 + 0.2*smoothstep(0.35, 1., vR));
        c = mix(c, uWhite, 0.6*smoothstep(0.86 - wr, 0.86 + wr, vR));           // the glazed rim, found too
        c *= 0.94 + 0.06*vnoise(vP.xz*0.8 + uTime*0.05);
        gl_FragColor = vec4(toScene(sink(c, vP.y*0.16)), 1.);
      }`,
  });
}
/** The dark mirror. The image of the hall is real geometry under it (the stone drawn again upside down, a ruled
 *  sheet for the vault, the world's mirrored sky on the box below), with the chains hanging through the heart of each
 *  mirrored trunk: cause and image in one. This plane is only the surface: a thin dark veil that thickens at grazing
 *  angles, the sun ellipses, and the wind's pale dashes. opts.mirror false leaves the image out. */
export function waterMaterial(shared) {
  return new THREE.ShaderMaterial({
    uniforms: shared, transparent: true, depthWrite: false,
    vertexShader: VERT_STD + /* glsl */`void main(){ stdVert(); }`,
    fragmentShader: /* glsl */`
      varying vec3 vP, vN;
      uniform vec3 uSkyZen, uSkyHor;
      ${STYLE_GLSL}
      // the wind's strokes at scale s: cells 0.55 m across the wind and 7 m along it, drifting to starboard
      float windN(vec2 p, float s, float k){ return vnoise(vec2(p.x*0.2, p.y*1.8)/s + vec2(uTime*0.21/s + k, -uTime*0.035 + s*7.3 + k*1.7)); }
      float glitN(vec2 p, float s){ return vnoise(vec2(p.x*2.4, p.y*5.2)/s + vec2(uTime*0.9, -uTime*0.6) + s*3.1); }
      void main(){
        vec3 v = uCamL - vP; float dist = max(length(v), 1e-3); v /= dist;
        float c = clamp(abs(v.y), 0., 1.), fres = (1. - c)*(1. - c)*(1. - c);
        float ex = abs(vP.x) - uClear.x, ez = max(uClear.y - vP.z, vP.z - uClear.z);
        float outside = smoothstep(0., max(uClear.w, 0.1), max(ex, ez));
        vec2 wob = 0.8*(vec2(vnoise(vP.xz*0.6 + uTime*0.9), vnoise(vP.zx*0.6 - uTime*0.77)) - 0.5);   // the disc's edge trembles on the water
        // the ellipse's edge on the water is not a line: the ripples break it into slivers lying along the wind
        float rag = vnoise(vec2(vP.x*0.16 + uTime*0.3, vP.z*2.3 - uTime*0.2)) - 0.5, rag2 = vnoise(vec2(vP.x*0.5 - uTime*0.4, vP.z*5.1)) - 0.5;
        float sunny = sunDisc(vec3(vP.x + wob.x + 5.5*rag + 1.6*rag2, 0.01, vP.z + wob.y + 0.5*rag2))*(1. - outside);
        float core = sunDisc(vec3(vP.x + wob.x, 0.01, vP.z + wob.y))*(1. - outside);
        // THE SHEEN: the sky's colour and nothing else (no cloud, no hall, no trunk). Looked down into, the water is the
        // iron black and clear to the model; seen along, from some 30 m off, it rises to the dome's cobalt at half strength
        float graze = 1. - smoothstep(0.03, 0.42, c);
        float sheen = max(graze*smoothstep(6., 30., dist), 0.10*smoothstep(10., 60., dist));
        vec3 skyC = mix(uSkyZen, uSkyHor, 0.55*graze*graze);
        vec3 sheenC = mix(uIron, skyC, 0.5 + 0.14*graze);
        vec3 col = mix(uIron, sheenC, smoothstep(0., 0.3, sheen));
        float a = max(mix(0.07, 0.2, fres), 0.86*sheen);
        // THE WIND: short strokes lying along it, pale cobalt and black, each drawn at the scale that keeps it some
        // 3 pixels thick (two neighbouring scales cross-faded), so they are strokes at every distance and never shimmer
        vec2 fz = fwidth(vP.xz); float fp = max(max(fz.y, fz.x*0.12), 1e-4);
        float lod = clamp(log2(fp/0.065), 0., 8.), l0 = floor(lod), lf = lod - l0, s0 = exp2(l0), s1 = s0*2.;
        float th = mix(0.73, 0.6, smoothstep(20., 320., dist));
        float lull = 0.3 + 0.7*smoothstep(0.3, 0.62, vnoise(vP.xz*0.03 + uTime*vec2(0.02, 0.013)));      // wind lanes
        float pale = mix(smoothstep(th - 0.045, th + 0.045, windN(vP.xz, s0, 0.)), smoothstep(th - 0.045, th + 0.045, windN(vP.xz, s1, 0.)), lf);
        float dark = mix(smoothstep(th - 0.045, th + 0.045, windN(vP.xz, s0, 37.3)), smoothstep(th - 0.045, th + 0.045, windN(vP.xz, s1, 37.3)), lf);
        float along = mix(0.6, 1., graze)*smoothstep(5., 16., dist);
        pale *= lull*along; dark *= (1.3 - lull)*along*(1. - pale);
        col = mix(col, mix(uIron, uCobalt, 0.12)*0.9, 0.8*dark*smoothstep(0.1, 0.5, sheen));
        col = mix(col, mix(skyC, uWhite, 0.12 + 0.3*graze), 0.8*pale);
        a = max(a, 0.72*pale);
        // THE SUN ON THE WATER: not a tan patch but glitter, dense short strokes of sand-white, and the water under
        // them left clear so the chains show lit beneath
        float gth = 0.52 + 0.1*c;
        float gl = mix(smoothstep(gth - 0.08, gth + 0.08, glitN(vP.xz, s0)), smoothstep(gth - 0.08, gth + 0.08, glitN(vP.xz, s1)), lf);
        gl *= 0.7 + 0.3*smoothstep(0.35, 0.6, windN(vP.xz*1.7, s1*2., 11.));
        float warm = max(0.45*core, 0.3*sunny);
        col = mix(col, mix(uIron, mix(uSand, uOchre, 0.2), 0.6), warm);
        col = mix(col, mix(uSand, uWhite, 0.72), sunny*gl);
        a = max(a, max(warm*(0.5 + 0.3*graze), sunny*gl));
        col = mix(col, mix(uIron*1.15, uSkyHor, 0.7), outside);
        gl_FragColor = vec4(toScene(col), clamp(mix(a, 1., outside), 0., 1.));
      }`,
  });
}
/** The vault's image in the water: one flat sheet at the depth of the stars, ruled with the same brick courses, open
 *  where the stars are (the blue discs of the model hang there), green and ochre round each rim. */
export function ceilingMirrorMaterial(shared, open) {
  return new THREE.ShaderMaterial({
    uniforms: { ...shared, uOpen: { value: open ? 1 : 0 } }, side: THREE.DoubleSide,
    vertexShader: VERT_STD + /* glsl */`void main(){ stdVert(); }`,
    fragmentShader: /* glsl */`
      varying vec3 vP, vN;
      uniform float uOpen;
      ${STYLE_GLSL}
      void main(){
        vec3 p = vec3(vP.x, 59., vP.z);
        vec4 th = throatAt(p.xz); vec2 dd = p.xz - th.xy;
        float ra = length(dd)/max(th.z, 0.1), phi = atan(dd.y, dd.x + 1e-5);
        if (ra < 1.02) discard;
        if (uOpen > 0.5 && abs(p.x) < 15. && p.z > 108.) discard;
        // scalloped edge, as the hall's own
        vec2 e = vec2(${H.halfX.toFixed(1)}, ${H.halfZ.toFixed(1)}) - abs(p.xz);
        if (min(e.x + 1.6*cos(p.z*0.1745), e.y + 1.6*cos(p.x*0.2094)) < 0.) discard;
        vec3 alb = brickAt(p);
        float rim = 1. - smoothstep(1.46, 1.5, ra + 0.07*sin(phi*9. + th.y) + 0.04*sin(phi*23.));
        float hsh = hash21(floor(vec2(phi*5.5, ra*9.)) + th.xy);
        vec3 rimC = ra < 1.2 ? (hsh < 0.42 ? mix(uWhite, uGreen, uGlazeMix.y) : hsh < 0.78 ? mix(uWhite, uOchre, uGlazeMix.z) : uWhite) : shardCol(hsh, 0.);
        float px = length(fwidth(vP));
        rimC = mix(rimC, mix(uWhite, mix(uGreen, uOchre, 0.45), 0.8*uGlazeMix.y), smoothstep(0.25, 0.7, px));
        vec3 D = mix(mix(alb*uShade, uCobalt, 0.06)*1.12, rimC*0.8, rim);
        D *= 0.8 + 0.2*sunVis(vec3(p.x, 30., p.z));
        gl_FragColor = vec4(toScene(mix(mix(uIron*1.15, uCobalt, 0.22*uSteep), D, 0.56*(1. - 0.72*uSteep))), 1.);
      }`,
  });
}
function discGeometry(rng) {
  const pos = [], ak = [], idx = [], out = [];
  for (let i = -1; i <= 1; i++) for (let k = 0; k < H.nThrZ; k++) {
    const cx = i * 30, cz = thrCz(k), y = -H.neckY + 2.5 + rng.range(-0.8, 0.8), ph = rng.range(0, 6.283), dir = rng.range(0, 6.283), base = pos.length / 3;
    const tx = rng.range(-0.04, 0.04), tz = rng.range(-0.04, 0.04), ring = [];
    pos.push(cx, y, cz); ak.push(ph, dir, 0);
    for (let j = 0; j <= 24; j++) { const a = j / 24 * Math.PI * 2, x = Math.cos(a) * H.aGreat, z = Math.sin(a) * H.aGreat, yy = y + x * tx + z * tz;
      pos.push(cx + x, yy, cz + z); ak.push(ph, dir, 1); ring.push(new THREE.Vector3(cx + x, yy + 0.05, cz + z));
      if (j < 24) idx.push(base, base + 1 + j, base + 2 + j); }
    out.push({ pts: ring, tree: ph, dir, pin: false, w: 1.5 });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(ak, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -63, 0), 200);
  return { geometry: g, rings: out };
}

// ---------------------------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const shared = opts.shared ?? makeShared(opts.palette ?? PALETTE);
  const way = opts.colourway ?? 'all';             // 'all' | 'whiteCobalt' | 'white'
  shared.uGlazeMix.value.set(way === 'white' ? 0 : 1, way === 'all' ? 1 : 0, way === 'all' ? 1 : 0, way === 'all' ? 1 : 0);
  const object = new THREE.Group(); object.name = 'hall-and-hanging-model';

  const trees = solveTrees(rng.fork ? rng.fork('trees') : rng);
  await ctx.yield();
  const unbuilt = !!opts.unbuilt, isUnbuilt = (t) => unbuilt && t.c === H.nZ - 1 && (t.r === 1 || t.r === 2);   // the rare event: the last two trunks are chains only
  const stone = new THREE.Mesh(await buildStone(ctx, trees, isUnbuilt), stoneMaterial(shared)); stone.name = 'stone';
  object.add(stone);
  const stoneM = new THREE.Mesh(stone.geometry, stoneMaterial(shared, true)); stoneM.name = 'stone-mirror'; stoneM.frustumCulled = false;
  if (opts.mirror !== false) object.add(stoneM);
  await ctx.yield();
  const vault = new THREE.Mesh(await buildVault(ctx, unbuilt ? (i, k) => i === 0 && k === H.nThrZ - 1 : null), vaultMaterial(shared)); vault.name = 'vault';
  object.add(vault);
  await ctx.yield();

  // the hanging model: the same nodes, unflipped, below the water
  const crng = rng.fork ? rng.fork('chains') : rng, strands = [], sackI = [], sackJ = [];
  const mir = (v) => new THREE.Vector3(v.x, -Math.max(v.y, 0), v.z);
  const sagSeg = (a, b, n, sag) => seg(a, b, n).map((p, i) => { p.y -= sag * Math.sin(Math.PI * i / n); return p; });
  for (const t of trees) {
    const dir = crng.range(0, 6.283), S = (pts, w, pin) => strands.push({ pts, tree: t.phase, dir, w, pin });
    S(t.trunk.filter((_, i) => i % 2 === 0).map(mir), 4.0, false);
    const f1 = mir(t.f1);
    for (let j = 0; j < 4; j++) {
      const f2 = mir(t.f2[j]); S(sagSeg(f1, f2, 5, 0.5), 2.4, true);
      for (let k = 0; k < 3; k++) {
        const h = mir(t.heads[j][k]), pts = sagSeg(f2, h, 4, 0.35), end = new THREE.Vector3(h.x, h.y - 0.8, h.z);
        pts.push(end); S(pts, 1.5, true);
        sackI.push(end.x, end.y, end.z, crng.range(2.4, 3.4)); sackJ.push(t.phase, dir, crng.range(0, 6.283), crng());
      }
      // the vault found by hanging: garlands from head to head
      const hs = t.heads[j].map(mir), nx = mir(t.heads[(j + 1) % 4][0]);
      S(sagSeg(hs[0], hs[1], 5, 1.4), 0.8, true); S(sagSeg(hs[1], hs[2], 5, 1.4), 0.8, true);
      if (detail > 0.7 || j % 2 === 0) S(sagSeg(hs[2], nx, 5, 1.8), 0.8, true);
    }
  }
  await ctx.yield();
  for (const st of opts.extraStrands ?? []) strands.push(st);                    // the world's own chains (viaduct, door)
  for (const k of opts.extraSacks ?? []) { sackI.push(k.x, k.y, k.z, k.size ?? 3); sackJ.push(k.phase ?? 0, k.dir ?? 0, k.own ?? 0, k.tint ?? 0.5); }
  const disc = discGeometry(crng);
  for (const r of disc.rings) strands.push({ ...r, dir: r.dir + 62.83185307 });      // dir + 10 turns marks the stars found by hanging (the shader keeps them a little lighter in the deep)
  for (const r of disc.rings) {                    // the star found by hanging: two families of straight strings from each disc's ring out to the heads' level
    const c = new THREE.Vector3(); for (let j = 0; j < 24; j++) c.add(r.pts[j]); c.multiplyScalar(1 / 24);
    const NB = detail > 0.7 ? 20 : 14, tt = 2.3, R1 = H.aGreat * Math.sqrt(1 + tt * tt);
    for (let j = 0; j < NB; j++) for (const sg of [-1, 1]) {
      const a = (j + (sg > 0 ? 0.5 : 0)) / NB * Math.PI * 2, b = a + sg * Math.atan(tt), p0 = new THREE.Vector3(c.x + Math.cos(a) * H.aGreat, c.y, c.z + Math.sin(a) * H.aGreat), p1 = new THREE.Vector3(c.x + Math.cos(b) * R1, c.y + 4.6, c.z + Math.sin(b) * R1);
      strands.push({ pts: [p0, p0.clone().lerp(p1, 0.5), p1], tree: r.tree, dir: r.dir + 62.83185307, pin: false, w: 0.75 });
    }
  }
  await ctx.yield();
  const chainMat = chainMaterial(shared), nPart = Math.max(1, Math.ceil(strands.length / 450));          // in parts, so no step is long
  for (let i = 0; i < nPart; i++) {
    const chains = new THREE.Mesh(chainGeometry(strands.slice(Math.floor(i * strands.length / nPart), Math.floor((i + 1) * strands.length / nPart)), crng), chainMat);
    chains.name = 'chains'; chains.frustumCulled = false; object.add(chains);
    await ctx.yield();
  }
  await ctx.yield();
  const sg = sackGeometry(), ig = new THREE.InstancedBufferGeometry();
  ig.index = sg.index; ig.setAttribute('position', sg.getAttribute('position')); ig.setAttribute('normal', sg.getAttribute('normal'));
  ig.setAttribute('aI', new THREE.InstancedBufferAttribute(new Float32Array(sackI), 4));
  ig.setAttribute('aJ', new THREE.InstancedBufferAttribute(new Float32Array(sackJ), 4));
  ig.instanceCount = sackI.length / 4;
  const sacks = new THREE.Mesh(ig, sackMaterial(shared)); sacks.name = 'sacks'; sacks.frustumCulled = false;
  object.add(sacks);
  const discs = new THREE.Mesh(disc.geometry, discMaterial(shared)); discs.name = 'discs'; discs.frustumCulled = false;
  object.add(discs);
  // the dark the model hangs in (an open box so no sky shows through the water), and the black mirror over it
  if (opts.clear) shared.uClear.value.set(opts.clear.x ?? H.halfX + 12, opts.clear.z0 ?? -320, opts.clear.z1 ?? 290, opts.clear.fade ?? 26);
  const cl = shared.uClear.value;
  const abyss = new THREE.Mesh(new THREE.BoxGeometry(2 * (cl.x + cl.w + 2), 78, cl.z - cl.y + 2 * (cl.w + 2)),
    opts.abyssMaterial ?? new THREE.MeshBasicMaterial({ color: toScene(shared.uIron.value.clone().multiplyScalar(0.97)), side: THREE.BackSide, fog: false }));
  abyss.frustumCulled = false;
  if (opts.mirror !== false) {
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(2 * H.halfX + 4, 2 * H.halfZ + 4).rotateX(-Math.PI / 2), ceilingMirrorMaterial(shared, unbuilt));
    ceil.position.y = -64.3; ceil.name = 'vault-mirror'; ceil.frustumCulled = false; object.add(ceil);
  }
  abyss.position.set(0, -39.4, (cl.y + cl.z) / 2); abyss.name = 'abyss'; object.add(abyss);
  let water = null;
  if (opts.water !== false) {
    water = new THREE.Mesh(new THREE.PlaneGeometry(opts.waterSize ?? 5000, opts.waterSize ?? 5000).rotateX(-Math.PI / 2), waterMaterial(shared));
    water.name = 'water'; water.renderOrder = 3; object.add(water);
  }
  await ctx.yield();

  // clearance: distance from a local point to the nearest stone member (capsules) or the vault shell
  const caps = [];
  for (const t of trees) {
    if (isUnbuilt(t)) continue;
    caps.push([t.foot, t.f1, 2.85]);
    for (let j = 0; j < 4; j++) { caps.push([t.f1, t.f2[j], 1.5]); for (const h of t.heads[j]) caps.push([t.f2[j], h, 0.9]); }
  }
  const clearance = (x, y, z) => {
    let best = 1e9; _q.set(x, y, z);
    for (const [a, b, r] of caps) {
      _t.subVectors(b, a); const l2 = _t.lengthSq(), u = clamp(_n.subVectors(_q, a).dot(_t) / l2, 0, 1);
      best = Math.min(best, _n.copy(a).addScaledVector(_t, u).distanceTo(_q) - r);
    }
    if (Math.abs(x) < H.halfX && Math.abs(z) < H.halfZ) {
      const cx = thrCx(thrIndexX(x)), cz = thrCz(thrIndexZ(z)), a = Math.abs(cx) > 50 ? H.aLess : H.aGreat, r = Math.hypot(x - cx, z - cz);
      if (r < a * 1.25 && y > 56) best = Math.min(best, a - r); else best = Math.min(best, y < 64 ? soffitY(x, z) - y : y - roofY(x, z));
    }
    return best;
  };
  const hero = trees[1 * H.nZ + 1];                // the trunk at x -15, z -108 (world z 202): the helix (the great throat at x 30 throws its disc on it)
  const axisAt = (t, y) => { const q = clamp(y / t.f1.y, 0, 1), w = 0.72 * q + 0.28 * q * q; return new THREE.Vector3(lerp(t.foot.x, t.f1.x, w), y, lerp(t.foot.z, t.f1.z, w)); };
  const sun0 = shared.uSun.value.clone(), _o = new THREE.Vector3(), _c = new THREE.Vector3();
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    worldOffset: V(0, 0, 310),
    entry: V(0, 8, -160), exitGap: V(0, 8, 162),
    portalSeat: { position: V(0, 8, 270), facing: V(0, 0, -1) },
    heroTrunk: { foot: hero.foot.clone(), fork: hero.f1.clone(), lean: hero.lean, axisAt: (y) => axisAt(hero, y) },
    upThroat: { axis: V(-30, H.neckY, -90), radius: H.aGreat }, downThroat: { axis: V(0, H.neckY, 18), radius: H.aGreat },
    flyThrough: [V(0, 8, -160), V(5, 10, -125), V(4, 12, -92), V(0, 40, -76), V(0, 66, -54), V(0, 76, -34), V(-7, 75, -8), V(0, 78, 6), V(0, 66, 18), V(0, 30, 37), V(0, 5, 62), V(0, 5, 150), V(0, 8, 270)],
    viewpoints: { level: { from: V(4, 10, -128), to: V(4, 14, -40) }, helix: { from: axisAt(hero, 22).add(V(-10, 0, 0)), to: axisAt(hero, 24) }, dive: { from: V(0, 60, 22), to: V(0, 0, 42) } },
    throats: [], roofCrests: { ridgeDist, roofY }, trees, clearance, soffitY, roofY, shared,
  };
  for (let i = -2; i <= 2; i++) for (let k = 0; k < H.nThrZ; k++) anchors.throats.push({ x: thrCx(i), z: thrCz(k), radius: Math.abs(i) === 2 ? H.aLess : H.aGreat, neckY: H.neckY, collarY: H.collarY, great: Math.abs(i) < 2 });

  return {
    object, radius: 178, height: 72, center: V(0, 14, 0),
    anchors, shared, trees, ground: false, groundY: 0,
    /** u = 0..1 along the world's path: the sun turns 7 degrees, the ellipses slide. */
    setProgress(u) { shared.uU.value = u; shared.uSun.value.copy(sun0).applyAxisAngle(THREE.Object3D.DEFAULT_UP, -u * 7 * Math.PI / 180); },
    update(dt, time, camera) {
      shared.uTime.value = time;
      object.getWorldPosition(_o); shared.uOrigin.value.copy(_o);
      if (camera) { _c.setFromMatrixPosition(camera.matrixWorld); shared.uCamL.value.copy(_c).sub(_o);
        const fy = -camera.matrixWorld.elements[9]; shared.uSteep.value = smoothstep(0.42, 0.85, -fy); }
    },
    dispose() {},
  };
}

// ---------------------------------------------------------------------------------------------------------------
// HAND-OFF
// SIZE  footprint 128 x 324 m (x -64..64, z -162..162), vault 58..66, roof to 72, model to -66. radius 178,
//       height 72. Local frame: origin = hall centre at water level, camera enters at -Z and flies +Z; put
//       hero.object.position at world (0, 0, 310), no rotation, no scale (the shaders use uOrigin, not a matrix).
// COST  about 145k triangles, 7 draw calls (stone, vault, chains, sacks, discs, abyss box, water), no lights,
//       no textures, build about 250 ms in yielded steps.
// OPTS  unbuilt true (rare event: last two inner trunks and the bay over them left out, chains stay), extraStrands / extraSacks
//       (the world's own chains and sacks, merged into the same two meshes), palette (7 hex, brief order), detail 0.6..1 (thins garlands only), colourway 'all' | 'whiteCobalt' |
//       'white', water false to leave the water plane out, waterSize, clear { x, z0, z1, fade } = the box in
//       which the water is see-through (default x +-76, z -320..290 local, so viaduct and door chains show),
//       shared = your own makeShared() result.
// HOOKS hero.setProgress(u): the sun turns 7 degrees with u and the ellipses slide. hero.update(dt, time, camera)
//       every frame: sets uTime, uOrigin, uCamL (the chain sway envelope follows the camera).
//       shared.uSunOn 0 = white sky after rain (no discs); shared.uSun = unit vector toward the sun (local);
//       shared.uGlazeMix = colourway; shared.uExposure must equal post.exposure (toScene uses it).
// STYLE EXPORTS (shade the whole world with these; all take the same `shared`)
//   makeShared(palette)   the uniforms; HALL / soffitY / roofY / ridgeDist: the layout as numbers
//   STYLE_GLSL            toScene (display-linear -> scene, exact pigments under ACES), sunVis / sunDisc (analytic
//                         sun through the star throats), gaudiLight (sunlit = pigment, shade = 55 % leaned to
//                         cobalt), brickAt (ruled courses of the nearest hyperboloid), shardAt + glazeLight
//                         (trencadis). Fragment shaders get hero-local position as vP = world - uOrigin.
//   stoneMaterial + sweepMember + sweepGeometry   any leaning stone member (viaduct columns, door jambs)
//   vaultMaterial         brick / lime wash / shards by attribute aM = (0 soffit, 1 throat, 2 roof, 3 fascia; v)
//   chainMaterial + chainGeometry + SWAY_GLSL     more chains (viaduct, the door's one chain with seven sacks)
//   sackMaterial, discMaterial, waterMaterial, toScene (JS twin), solveTrees
// ANCHORS (hero-local; add anchors.worldOffset for world space)
//   entry, exitGap        aisle points at the hall's two faces, y 8
//   portalSeat            { position (0, 8, 270), facing -Z }: the door in the wave wall, 14 m portal
//   heroTrunk             { foot, fork, lean, axisAt(y) }: the trunk at x 15, z -72 for the helix (radius 10
//                         round axisAt(y), it leans so follow the axis)
//   upThroat, downThroat  { axis, radius 6.5 }: the two throats flown (x 0, z -54 and z 18), neck at y 66
//   flyThrough            ordered key points of the brief's line; check yours with anchors.clearance(x, y, z)
//                         (metres to the nearest trunk, branch, twig or vault shell)
//   viewpoints            level, helix, dive: { from, to }
//   throats               all 40 { x, z, radius, neckY, collarY, great }: swift gates, chimney groups on the lips
//   trees                 the solved network (foot, f1, f2[4], heads[4][3], lean): mooring rings, barges
// EXPECTS AROUND IT  a cobalt sky dome, the kit-free water beyond (the hero's plane is 5 km and opaque outside the
//       clear box), chimneys seated with roofY, swifts, barges. No fog, no scene lights needed.
