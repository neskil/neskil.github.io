// THE MOTHER GLOBE: hero set piece of "beaded-sea" (The Beaded Sea).
//
// 500 m of seawater hanging in bright air. What is built here, all procedural:
//   * the Mother (R 250): heaving skin, ripple trains, sun glint, fresnel rim, the sky and seabed held
//     upside down in her (true ball-lens deflection), colour deepening with chord length to a teal core;
//   * her coral heart: a glowing coral planetoid 200 m across (staghorn thickets, table corals, sea fans,
//     brain corals on a lumpy rock ball; inside a globe "down" is toward the centre, so coral grows outward
//     all round), swaying, staining the deep water amber, with three bait balls wheeling round it;
//   * twelve outrigger boats on her equator (a great circle tipped 20 degrees, low side toward +X, the
//     path side), masts pointing straight out of the water, crab-claw sails, V wakes drawn on the skin;
//   * the Lantern (R 30) 15 m off her skin: 900 banded orange reef fish in schools, a bommie, sun shafts
//     and bubbles; from inside, its skin is a hazy bright window (teal-silver mirror beyond 48 degrees);
//   * the liquid bridge from the Mother to the Daughter (R 60), which thins, necks and parts into eleven
//     true spheres one after another, with 30 satellite droplets, while its two stubs recoil into the
//     globes as travelling bulges;
//   * on the plain: her periwinkle shadow down the sun line with a writhing gold-green caustic pool.
//
// FRAME    Local space = the brief's world coordinates minus (-330, 0, 560): put `object` at
//          (-330, 0, 560) with NO rotation and everything in the brief lines up. Origin is the seabed
//          under the Mother's centre, +Y up. The camera side is +X (travel toward +Z); the piece has no
//          back, it is finished all round.
// SIZE     radius 300 / height 690 describe the Mother (centre (0,430,0), `center`). The Lantern, bridge
//          and Daughter reach out to about x 390, z 500.
// OPTS     palette  : 7 hex strings, brief order [turquoise, deep teal, pale aqua, cream, coral, gold, indigo]
//          detail   : 0.6..1 thins coral count and bait fish only (never boats, Lantern fish, beads)
//          groundFx : false to leave out the shadow + caustic quad (it lies at y 0.5; do so if your seabed
//                     has relief there and draw them in the seabed shader from anchors.shadowCentre)
//          boats    : 6..12 boats on the equator (default 12);  sail : hex colour of the sails (default cream)
//          timing   : { thin:[u0,u1], bead:[u0,u1], recoil:[u0,u1] } windows in path u (defaults follow
//                     the brief: thin .60-.72, bead .70-.765, recoil .74-.86)
// HOOKS    setProgress(u)   : REQUIRED each frame with the path u; drives the bridge break-up (never time)
//          setSun(dirVec3)  : direction TOWARD the sun (default the brief's, 52 degrees up in the ESE)
//          setBoatOffset(r) : shift all boats along their circle (radians) to phase a boat past the lens;
//          boatPosition(i, time, out) gives boat i's local position; boats move 6 m/s toward -Z on the +X side
//          uniforms         : shared uniforms (uSkyZen, uSkyMid, uSkyHaze, uGroundSun, uGroundShade, uSunCol,
//                             uShallow, uDeep, uPale, uCoral): set these Colors to match your sky dome so the
//                             upside-down sky inside the globes is YOUR sky. skyCol() in GLSL_COMMON is the
//                             analytic sky the globes refract; copy it for the dome and for other globes.
// ANCHORS  motherCentre/Radius, heartCentre/Radius, lanternCentre/Radius, bommieCentre, daughterCentre/Radius,
//          bridgeA, bridgeB (bridge axis ends on the two skins);
//          flyThrough: 11 points, a camera line with >= 30 m clearance from the Mother (closest at point 2,
//            `closestPass`, ~40 m off the skin), through the Lantern's centre (points 3-5; the fish part round
//            the lens), along the bridge's right side 24 m off its axis closing to 16, then round the Daughter
//            14 m off her skin; lanternEntry / lanternExit are the skin crossings on that line;
//          viewpoints: reveal, skin, beads, belly ({ name, position, lookAt });
//          portalSeat: { position, facing, direction }: the Pearl's centre from the brief, where the 14 m
//            portal sits (the Pearl itself is NOT built here), facing back down the path, 3 degree climb;
//          shadowCentre, causticRadius, sunDirection, boatCircle { centre, u, v, pole, radius, angularSpeed, phases }.
// COST     about 130k triangles, 15 draw calls, ~200 ms build, no lights, no textures, no render targets.
// LIGHT    Self-lit by its own shaders from uSun and the sky uniforms: scene lights are ignored. Scene fog
//          (Fog or FogExp2) is honoured in every pass. Sun glints reach ~10 and the heart ~2: they bloom.
//          Bright mid-morning is the home lighting; for other hours change the sky uniforms and setSun().
// DRAW ORDER  back shells (opaque, renderOrder 1-3) -> contents -> front skins (premultiplied, 20-22).
//          Transparent world objects that must show in FRONT of the Mother need renderOrder > 22.
import * as THREE from 'three';
import { smoothstep as sstep, clamp, lerp } from '../kit/core.js';

const DEFAULT_PALETTE = ['#19B5B0', '#0E6F8E', '#BFF3EA', '#F4F1E6', '#FF8A5C', '#F7D774', '#3B4A7A'];

// Layout in local space (= the brief's world coordinates minus (-330, 0, 560)).
const MOTHER_C = new THREE.Vector3(0, 430, 0), MOTHER_R = 250;
const LANTERN_C = new THREE.Vector3(235, 394, 175), LANTERN_R = 30;
// The bridge leaves the Mother 28 degrees east of north (radially), 320 m long; the Daughter hangs on its far end.
const DAUGHTER_C = new THREE.Vector3(295.3, 399.8, 555.7), DAUGHTER_R = 60;
const BRIDGE_A = new THREE.Vector3(117.2, 418, 220.5), BRIDGE_B = new THREE.Vector3(267.2, 402.6, 502.7);
const MOON_C = new THREE.Vector3(268, 345, -410), MOON_R = 36;                                              // the Moon: (-62, 345, 150) in the brief

// ---------------------------------------------------------------------------------------------
// GLSL shared by every pass: hash/noise, the analytic sky + seabed the globes hold upside down,
// the wobble function (also ridden by the boats) and analytic water fog.
// ---------------------------------------------------------------------------------------------
export const GLSL_COMMON = /* glsl */`
uniform float uTime;
uniform vec3 uSun, uSunCol, uSkyZen, uSkyMid, uSkyHaze, uGroundSun, uGroundShade;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm2(vec2 p){ return vn(p) * .55 + vn(p * 2.03 + 7.1) * .28 + vn(p * 4.1 + 3.7) * .17; }
// Analytic sky: zenith blue -> aqua -> cream haze, six combs of cirrus, a small gold sun, and below
// the horizon the white seabed dotted with periwinkle globe shadows. d must be normalised.
vec3 skyCol(vec3 d){
  float y = d.y;
  vec3 c = mix(uSkyMid, uSkyZen, smoothstep(0.04, 0.7, y));
  c = mix(uSkyHaze, c, smoothstep(-0.01, 0.2, y));
  vec2 p = d.xz / max(y, 0.07);
  float comb = smoothstep(0.45, 0.95, sin(p.y * 1.15 + vn(p * 0.6) * 2.2) * .5 + .5);
  float ci = fbm2(vec2(p.x * 0.36 + uTime * 0.006, p.y * 3.4)) * comb;
  float wisp = fbm2(vec2(p.x * 1.9 + uTime * 0.011, p.y * 10.) + vn(p * 0.9) * 1.6);
  ci = smoothstep(0.2, 0.66, ci * (0.5 + 1.0 * wisp)) * smoothstep(0.05, 0.28, y) * (1. - smoothstep(0.86, 0.99, y));
  c = mix(c, uSkyHaze * 1.06 + uSunCol * 0.05, ci * 0.62);
  float s = max(dot(d, uSun), 0.);
  float s2 = s * s; float s8 = s2 * s2 * s2 * s2; float s64 = s8 * s8 * s8 * s8 * s8 * s8 * s8 * s8;
  c += uSunCol * (s64 * s64 * s64 * s64 * 1.5 + s8 * s8 * 0.10);
  vec2 g = d.xz / max(-y, 0.03) * 380.;
  float blot = smoothstep(0.36, 0.94, vn(g * 0.011 + 3.3)) * 0.5 + smoothstep(0.4, 0.95, vn(g * 0.035 + 9.1)) * 0.3;      // soft-edged: the plain seen in a lens is never a cut-out
  float crack = (1. - smoothstep(0.0, 0.08, abs(vn(g * 0.05) - 0.5))) * 0.12;
  vec3 gr = mix(uGroundSun, uGroundShade, clamp(blot, 0., 1.)) * (1. - crack);
  gr = mix(gr, uSkyHaze, exp(min(y, 0.) * 9.));
  return mix(c, gr, (1. - smoothstep(-0.015, 0.0, y)));
}
// Wobble: three low lobes travelling over the unit sphere. w = (amplitude as fraction of R, speed, seed, -)
float wobf(vec3 n, vec4 w, float t){
  float tt = t * w.y + w.z;
  return w.x * (sin(n.x * 2.1 + n.y * 1.3 + tt) * .46 + sin(n.z * 2.7 - n.x * 1.2 + tt * 1.37 + 1.7 + w.z)
    * .32 + sin(n.y * 3.4 + n.z * 1.9 - tt * 0.81 + 4.1) * .22 + sin(dot(n, vec3(4.7, -3.9, 5.3)) + tt * 1.9) * .1);
}
// Length of the segment a->b that lies inside the sphere (c, r): how much water the eye looks through.
float waterPath(vec3 a, vec3 b, vec3 c, float r){
  vec3 d = b - a; float L = max(length(d), 1e-4); d /= L;
  vec3 oc = a - c; float bq = dot(oc, d); float h = bq * bq - (dot(oc, oc) - r * r);
  if (h <= 0.) return 0.;
  h = sqrt(h);
  return max(min(L, -bq + h) - max(0., -bq - h), 0.);
}
`;

// A unit icosphere built straight into typed arrays (position + index only; the water shaders need no
// normals or uvs). Same triangle count as THREE.IcosahedronGeometry(1, detail) at a fraction of the build time.
export function icoGeo(detail) {
  const n = detail + 1, t = (1 + Math.sqrt(5)) / 2;
  const V = [-1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0, 0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1];
  const F = [0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11, 1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8, 3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9, 4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1];
  const per = (n + 1) * (n + 2) / 2, pos = new Float32Array(20 * per * 3), idx = new Uint16Array(20 * n * n * 3);
  let pi = 0, ii = 0;
  for (let f = 0; f < 20; f++) {
    const a = F[f * 3] * 3, b = F[f * 3 + 1] * 3, c = F[f * 3 + 2] * 3, base = f * per;
    for (let i = 0; i <= n; i++) for (let j = 0; j <= n - i; j++) {
      const k = n - i - j, x = V[a] * k + V[b] * i + V[c] * j, y = V[a + 1] * k + V[b + 1] * i + V[c + 1] * j, z = V[a + 2] * k + V[b + 2] * i + V[c + 2] * j;
      const l = 1 / Math.sqrt(x * x + y * y + z * z); pos[pi++] = x * l; pos[pi++] = y * l; pos[pi++] = z * l;
    }
    const off = (i) => base + i * (n + 1) - i * (i - 1) / 2;
    for (let i = 0; i < n; i++) for (let j = 0; j < n - i; j++) {
      const p0 = off(i) + j, p1 = off(i + 1) + j;
      idx[ii++] = p0; idx[ii++] = p1; idx[ii++] = p0 + 1;
      if (j < n - i - 1) { idx[ii++] = p1; idx[ii++] = p1 + 1; idx[ii++] = p0 + 1; }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.15);
  return g;
}

// Uniforms shared (by reference) between all passes of the piece.
function makeShared(pal) {
  const C = (h) => new THREE.Color(h);
  return {
    uTime: { value: 0 },
    uSun: { value: new THREE.Vector3(0.567, 0.788, -0.234).normalize() },
    uSunCol: { value: C(pal[5]).multiplyScalar(1.6) },
    uSkyZen: { value: C('#5C86C4') },
    uSkyMid: { value: C(pal[2]) },
    uSkyHaze: { value: C(pal[3]).multiplyScalar(0.92) },
    uGroundSun: { value: C('#D8D4C6') },
    uGroundShade: { value: C('#8E9CC6') },
    uShallow: { value: C(pal[0]) },
    uDeep: { value: C(pal[1]) },
    uPale: { value: C(pal[2]) },
    uCoral: { value: C(pal[4]) },
    uProgress: { value: 0 },
  };
}

// ---------------------------------------------------------------------------------------------
// WATER. One shader family, three modes:
//   back  : BackSide, opaque. The whole body of water as seen through it: the sky and seabed held
//           upside down (true ball-lens deflection), tinted by chord length, the focused-sun
//           crescent on the far side, the heart's amber stain. Contents are drawn in front of it.
//   front : FrontSide, premultiplied alpha. Only what the skin adds: fresnel rim of sky, sun glint,
//           ripples, boat wakes.
//   solid : FrontSide, opaque. Both of the above in one pass, for bodies with nothing inside
//           (the bridge, its beads, the Daughter, droplets).
// ---------------------------------------------------------------------------------------------
export const FOG_FRAG = (premult) => /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogF = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor${premult ? ' * gl_FragColor.a' : ''}, fogF);
#endif
`;

export const GLOBE_VERT = /* glsl */`
uniform vec4 uWob; uniform vec4 uBulge; uniform float uBulgeK; uniform float uShrink;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vR; varying vec3 vCen;
#include <fog_pars_vertex>
${GLSL_COMMON}
vec3 dispG(vec3 n){
  float b = uBulge.w * exp(-(1. - dot(n, uBulge.xyz)) * uBulgeK);
  return n * (uShrink + wobf(n, uWob, uTime) + b);
}
void main(){
  vec3 n = normalize(position);
  vec3 t1 = normalize(cross(n, abs(n.y) < .9 ? vec3(0., 1., 0.) : vec3(1., 0., 0.)));
  vec3 t2 = cross(n, t1);
  vec3 p0 = dispG(n), p1 = dispG(normalize(n + t1 * .03)), p2 = dispG(normalize(n + t2 * .03));
  vec3 nl = normalize(cross(p1 - p0, p2 - p0));
  mat4 mm = modelMatrix;
  #ifdef USE_INSTANCING
    mm = modelMatrix * instanceMatrix;
  #endif
  vec4 w = mm * vec4(p0, 1.);
  vW = w.xyz; vN = normalize(mat3(mm) * nl); vL = n;
  vR = max(length(mm[0].xyz), 1e-3); vCen = mm[3].xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const WATER_FRAG = /* glsl */`
uniform vec3 uShallow, uDeep, uPale, uCoral;
uniform float uAbs, uRip, uInside, uFleck, uGhost, uTiMax, uBodyGain, uThinTeal, uSpec, uFres, uStand, uFlip;
uniform vec4 uNear;             // near clarity: x, y = skin distance range (m), z = strength, w = see-through floor
uniform vec4 uWin;              // inside view: xyz = direction of the round window (out through the far skin), w = cos of its half angle
#ifdef CUT
uniform vec4 uCutA, uCutB, uCutWobA, uCutWobB, uCutBulgeA, uCutBulgeB; uniform float uCutKA, uCutKB;
#endif
uniform vec4 uHeart;            // x = stain radius (m), w = intensity
uniform mat3 uGC;               // great-circle frame of the boats (columns: u, v, pole)
uniform float uBoatPh[12]; uniform float uBoatW; uniform float uBoatN;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vR; varying vec3 vCen;
#include <fog_pars_fragment>
${GLSL_COMMON}
// slope of three scrolling ripple trains (globe-local metres) -> xyz gradient
vec3 ripG(vec3 p, float far){
  vec3 k1 = vec3(0.21, 0.52, 0.33), k2 = vec3(-0.71, 0.33, 0.62), k3 = vec3(0.9, -1.3, 1.1);
  float w = vn(p.xz * 0.02 + p.y * 0.013) * 0.7 + 0.5;
  float w2 = vn(p.xz * 0.085 + p.y * 0.07 + 11.);            // breaks the trains into unequal dashes: sun glitter, never a woven grid
  vec3 k0 = vec3(0.05, 0.11, -0.07);
  return (k0 * cos(dot(p, k0) - uTime * 0.7) * 5. + k1 * cos(dot(p, k1) - uTime * 1.3 + w * 4. + w2 * 5.) * 1.5 * sqrt(max(far, 1e-6)) + k2 * cos(dot(p, k2) + uTime * 1.9 + w * 6. - w2 * 7.) * 0.5 * far
        + k3 * cos(dot(p, k3) - uTime * 2.7 + w * 9.) * 0.22 * far * far) * w;
}
void main(){
  vec3 D = normalize(vW - cameraPosition);
  vec3 Ng = normalize(vN);
  float dist = length(vW - cameraPosition);
  float far = 1. / (1. + dist * 0.012);
#ifdef CUT
  // the bridge's buried ends: nothing of it is drawn inside the two globes it runs into
  { vec3 dm = vW - uCutA.xyz; float lm = max(length(dm), 1e-3); vec3 nn = dm / lm;
    if (lm < uCutA.w * (1. + wobf(nn, uCutWobA, uTime) + uCutBulgeA.w * exp(-(1. - dot(nn, uCutBulgeA.xyz)) * uCutKA)) - 0.6) discard;
    dm = vW - uCutB.xyz; lm = max(length(dm), 1e-3); nn = dm / lm;
    if (lm < uCutB.w * (1. + wobf(nn, uCutWobB, uTime) + uCutBulgeB.w * exp(-(1. - dot(nn, uCutBulgeB.xyz)) * uCutKB)) - 0.6) discard; }
#endif
  float dSkin = max(length(cameraPosition - vCen) - vR, 0.);
  float nearK = (1. - smoothstep(uNear.x, uNear.y, dSkin)) * uNear.z;
  float facing = smoothstep(0.02, 0.4, abs(dot(D, Ng)));
  vec3 pr = vL * vR;
  vec3 g = ripG(pr, far) * uRip * facing * (1. + 0.9 * nearK);
  // close to the lens: two short crossing trains, so the near skin is plainly moving water
  float cl = nearK * (1. - smoothstep(60., 190., dist));
  vec3 k4 = vec3(1.7, 2.3, -1.9), k5 = vec3(-2.9, 1.1, 2.6);
  float chop = vn(pr.xz * 0.11 + pr.y * 0.07 + uTime * 0.05);
  g += (k4 * cos(dot(pr, k4) - uTime * 3.1 + chop * 7.) * 0.10 + k5 * cos(dot(pr, k5) + uTime * 3.7 + chop * 11.) * 0.06) * uRip * facing * cl * (0.4 + chop);
  float foam = 0.;
#ifdef WAKES
  // V wakes behind twelve boats on the tipped equator; lon/lat in the great-circle frame
  vec3 q = vL * uGC;
  float lat = asin(clamp(q.z, -1., 1.)) * vR;
  float lon = atan(q.y, abs(q.x) < 1e-5 ? 1e-5 : q.x);
  float wkn = vn(pr.xz * 0.23 + pr.y * 0.17 + 3.) * 9., wkf = 1. - smoothstep(110., 240., dist);       // wakes are never a ruled grid, and far off they are foam only
  for (int i = 0; i < 12; i++) {
    float s = mod(uBoatPh[i] + uBoatW * uTime - lon, 6.2831853) * vR;      // metres astern
    float fade = exp(-s / 55.) * smoothstep(0., 6., s) * step(float(i) + .5, uBoatN);
    float arm = abs(lat) - s * 0.33 - 1.5;
    float ridge = exp(-arm * arm / (0.5 + s * 0.03));
    float inner = (1. - smoothstep(-8., 0., arm)) * (0.5 + 0.5 * sin(s * 0.9 - abs(lat) * 0.6 + wkn));
    g += vec3(sin(s * 1.7 + wkn), cos(lat * 1.3 - wkn * 0.7), sin(lat * 0.9 + s + wkn * 1.3)) * (ridge * 0.9 + inner * 0.25) * fade * wkf;
    foam += (ridge * 0.45 * (0.8 + 0.2 * sin(s * 0.21 - uTime * 0.9)) + (1. - smoothstep(0.6, 3.2, abs(lat))) * exp(-s / 30.) * 0.85) * fade;
  }
#endif
  vec3 N = normalize(Ng + (g - Ng * dot(g, Ng)));
  vec3 col = vec3(0.); float alpha = 1.;
#ifdef BODY
  #ifdef SURF
    float cs = clamp(dot(-D, Ng), 0., 1.); vec3 Nb = Ng + 2. * cs * D; vec3 Nf = Ng;
    vec3 Nx = mix(Ng, N, 0.5);
  #else
    float cs = clamp(dot(D, Ng), 0., 1.); vec3 Nb = Ng; vec3 Nf = Ng - 2. * cs * D;
    vec3 Nx = mix(Ng, normalize(Ng - (g - Ng * dot(g, Ng))), 0.35);
  #endif
  vec3 ev = Nx - dot(Nx, D) * D; float b = min(length(ev), 0.999); vec3 e = ev / max(length(ev), 1e-4);
  float del = 2. * (asin(b) - asin(b / 1.333));
  vec3 Dr = normalize(D * cos(del) - e * sin(del));
  // Close to the lens a wall of water shows the lens-true image only as haze: there the sky is held plainly upside
  // down (ground above, the cream horizon at eye level, zenith blue beneath), swimming with the ripples.
  vec3 Df = vec3(D.x, -(D.y + g.y * 0.35) * 1.3 - 0.02, D.z);
  Dr = normalize(mix(Dr, Df, nearK * uFlip) + vec3(0., 1e-4, 0.));
  vec3 sky = skyCol(Dr);
  float hb = Dr.y * 11.; hb = exp(-hb * hb);                       // the cream line of the horizon, held in the water
  sky = mix(sky, sky * (0.55 + 0.45 * smoothstep(-0.25, 0.0, Dr.y)), nearK) + uSkyHaze * hb * 0.9 * nearK;
  float cirN;
  { vec2 cq2 = Dr.xz / (abs(Dr.y) + 0.3);                  // streaks of cirrus under the held horizon, and the sky deepening below them
    cirN = smoothstep(0.5, 0.8, vn(vec2(cq2.x * 1.3 + cq2.y * 0.9 + uTime * 0.01, Dr.y * 17.))) * smoothstep(0.03, 0.2, Dr.y) * (1. - smoothstep(0.5, 0.8, Dr.y));
    sky = sky * mix(1., 0.8, nearK * smoothstep(0.05, 0.45, Dr.y)) + (uSkyHaze * 0.5 + uSunCol * 0.04) * cirN * nearK * 0.55; }
  sky = mix(sky, sky * (uPale * 0.55 + uShallow * 0.25), (1. - smoothstep(-0.06, 0.06, Dr.y))) * 0.9;
  float chord = 2. * vR * cs;
  chord = mix(chord, max(chord, vR * 0.5), nearK);        // close to: the glancing edge is still deep water, teal and not a grey film
  float T = exp(-chord * uAbs);
  float lit = 0.66 + 0.34 * dot(Nf, uSun);
  vec3 scat = mix(mix(mix(uPale * 0.62, uShallow * 0.5, uThinTeal), uShallow * 0.42, smoothstep(0.0, 0.4, 1. - T)), uDeep * 0.24, smoothstep(0.35, 0.95, 1. - T));
  scat = scat * lit * uBodyGain + uGroundSun * 0.10 * max(-Nf.y, 0.);
  // near water is plainly water: turquoise at the limb deepening to teal, a net of light playing inside the near skin
  vec3 scatN = mix(uShallow * 0.8, uShallow * 0.42 + uDeep * 0.42, smoothstep(0.12, 0.95, 1. - T)) * lit * uBodyGain + uGroundSun * 0.08 * max(-Nf.y, 0.);
  vec2 cq = (Nf.xz + Nf.y * 0.4) * (4. + vR * 0.09);
  float cnet = 1. - smoothstep(0., 0.24, abs(vn(cq + uTime * 0.13) - vn(cq * 1.6 - uTime * 0.09 + 3.)));
  scatN += (uShallow * 0.5 + uPale * 0.2) * cnet * 0.16 * (0.4 + 0.6 * max(dot(Nf, uSun), 0.));
  scat = mix(scat, scatN, nearK);
  float Ti = min(T + (1. - T) * uGhost, uTiMax);
  Ti = mix(Ti, max(Ti, uNear.w), nearK);               // close to the lens the water clears: the sky is held in it upside down
  vec3 tintT = mix(vec3(Ti * Ti, Ti, mix(Ti, 1., 0.1)), vec3(Ti * (0.55 + 0.45 * Ti), Ti, mix(Ti, 1., 0.1)), nearK);
  col = sky * mix(vec3(1.), uPale * 1.05, 0.55 * (1. - T)) * tintT + scat * (1. - Ti);
  col += (uSkyHaze * hb * 0.22 + (uSkyHaze * 0.5 + uSunCol * 0.04) * cirN * 0.16) * nearK;       // the held horizon and its cirrus stay plain in deep water
#ifdef CLEAR
  #ifndef CUT
  { // Clear water a few metres thick: the glass river, its beads and the bulbs at its ends, the droplets of the necklace.
    // What it holds is the world upside down: the cream plain with its blue shadows above, the bright line of the
    // horizon, and below it the sky deepening to its zenith blue at the lower edge, streaked with cirrus. Turquoise
    // only through the core of the unbroken river (nk 1); a bead, a bulb or a droplet is clearer yet.
  #ifdef CUT
    float nk = vNeck;
  #else
    float nk = 0.;
  #endif
    float core = smoothstep(0.2, 0.9, cs), deep = smoothstep(0.3, 0.9, 1. - T);
    float TiN = mix(0.92, mix(mix(0.74, 0.44, nk), 0.34, deep), core);
    vec3 skyN = sky * mix(vec3(1.), uPale * 0.95 + uShallow * 0.15, core * (0.5 + 0.5 * nk));
    col = skyN * TiN + mix(uPale * 0.7, mix(uShallow * 0.75 + uPale * 0.2, uShallow * 0.9, max(nk, deep)), core) * lit * (1. - TiN);
  }
  #endif
#endif
  float standIn = mix(1., smoothstep(70., 190., dSkin), uStand);      // painted stand-ins are never seen close
  // focused sunlight gathered on the far inner side: a net of caustic light, seen as a crescent
  float fo = smoothstep(0.55, 1.0, dot(Nb, -uSun)); fo *= fo * (1. - 0.8 * nearK);
  vec2 cp = (Nb.xz + Nb.y * 0.37) * 26.;
  float net = (1. - smoothstep(0.0, 0.16, abs(vn(cp + uTime * 0.11) - vn(cp * 1.7 - uTime * 0.07 + 5.))));
  col += (uShallow * 0.7 + uPale * 0.12) * fo * (0.6 + 0.4 * net) * 0.6;
  // coral heart: amber stain through the deep water
  vec3 oc = vCen - cameraPosition; float qd = length(cross(D, oc));
  float hg = exp(-qd * qd / max(uHeart.x * uHeart.x, 1.));
  float hw = exp(-qd * qd / max(uHeart.x * uHeart.x * 3.2, 1.));
  vec3 amber = uCoral * vec3(1., 0.85, 0.55);
  float hk = uHeart.w * standIn;
  col = mix(col, amber * 0.6, clamp(hg * 0.7, 0., 1.) * min(hk, 1.)) + amber * (hg * hg * 0.25 + hw * 0.05) * hk;
  // far globes: fish as drifting flecks turning together
  vec2 fp = vec2(atan(vL.z, abs(vL.x) < 1e-5 ? 1e-5 : vL.x) * 14., vL.y * 16.) + vec2(uTime * 0.25, sin(uTime * 0.2));
  float fl = step(0.93, h21(floor(fp))) * (1. - smoothstep(0.1, 0.42, length(fract(fp) - .5))) * (1. - T) * uFleck * standIn;
  col = mix(col, uDeep * 0.35 + vec3(0.5) * step(0.985, h21(floor(fp) + 3.)), fl);
  // camera inside the globe: Snell's window. Beyond 48 degrees the skin is a teal-silver mirror.
  // camera inside the globe: one round bright window on the far skin where the lens will leave; everywhere else the
  // skin is a teal-silver mirror that darkens with distance (total internal reflection)
  float wd = dot(D, uWin.xyz);
  float win = max(smoothstep(uWin.w - 0.05, uWin.w + 0.035, wd), 1. - smoothstep(1.5, 7., dist));
  float ring = smoothstep(uWin.w - 0.09, uWin.w - 0.02, wd) * (1. - smoothstep(uWin.w - 0.02, uWin.w + 0.05, wd));
  float mn = vn(vL.xz * 9. + vL.y * 7. + uTime * 0.3);
  vec3 mirror = mix(uDeep * 0.5, uShallow * 0.62, mn * mn) * (0.6 + 0.4 * exp(-dist / 30.)) * (0.8 + 0.3 * D.y)
    + uSunCol * 0.10 * smoothstep(0.2, 1., dot(D, uSun)) + (uPale * 0.5 + uSunCol * 0.08) * ring;
  float clear = exp(-dist / 40.);
  vec3 haze = (uShallow * 0.6 + uPale * 0.34) * (0.86 + 0.3 * D.y) + uSunCol * 0.16 * smoothstep(0.3, 1., dot(D, uSun));
  col = mix(col, mix(mirror, haze, win), uInside);
  alpha = 1. - uInside * win * (0.55 + 0.45 * clear) * 0.94;
#endif
#ifdef SURF
  float nv = clamp(dot(-D, N), 0., 1.);
  float om = 1. - nv; float F = (0.02 + 0.98 * om * om * om * om * om) * uFres;
  F = min(F + 0.10 * nearK * om, 1. - 0.45 * nearK);
  vec3 Rf = reflect(D, N);
  vec3 refl = skyCol(normalize(Rf + vec3(0., 1e-4, 0.))) * 1.15 + uPale * om * om * om * 0.3;
  float sd = max(dot(Rf, uSun), 1e-4);
  float sd4 = sd * sd; sd4 *= sd4; float sd32 = sd4 * sd4; sd32 *= sd32 * sd32;
  float gl = vn(pr.xz * 0.31 + pr.y * 0.23 + vec2(uTime * 0.5, -uTime * 0.35)) * vn(pr.zy * 0.53 - uTime * 0.45 + 7.);
  float glit = smoothstep(0.1, 0.4, gl);                  // glitter: the broad lobe shows only where a facet happens to face the sun
  vec3 spec = uSunCol * (pow(sd, 1800.) * 9. + (pow(sd, 220.) * 0.35 + sd32 * sd32 * (0.10 + 0.5 * cl)) * (0.25 + 2.2 * glit)) * uSpec;
  foam = clamp(foam, 0., 1.);
  #ifdef BODY
    col = mix(col, refl, F) + spec; col = mix(col, (uSkyHaze * 0.95 + uSunCol * 0.06), foam * 0.6);
  #else
    col = refl * F + spec + (uSkyHaze * 0.95 + uSunCol * 0.06) * foam * 0.55; alpha = clamp(F + foam * 0.55, 0., 1.);
  #endif
#endif
  gl_FragColor = vec4(col, alpha);
  FOGCODE
}`;

export function makeWaterMat(S, mode, o = {}) {
  const defs = {};
  if (mode !== 'front') defs.BODY = 1;
  if (mode !== 'back') defs.SURF = 1;
  if (o.wakes) defs.WAKES = 1;
  if (o.cut) defs.CUT = 1;
  if (o.cut || o.clear) defs.CLEAR = 1;       // clear small water: the river and its beads (cut), or any droplet (clear)
  const premult = mode === 'front';
  const m = new THREE.ShaderMaterial({
    defines: defs, fog: true,
    uniforms: {
      ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),
      uTime: S.uTime, uSun: S.uSun, uSunCol: S.uSunCol, uSkyZen: S.uSkyZen, uSkyMid: S.uSkyMid, uSkyHaze: S.uSkyHaze,
      uGroundSun: S.uGroundSun, uGroundShade: S.uGroundShade, uShallow: S.uShallow, uDeep: S.uDeep, uPale: S.uPale, uCoral: S.uCoral,
      uWob: { value: o.wob || new THREE.Vector4(0.02, 0.3, 0, 0) },
      uBulge: { value: o.bulge || new THREE.Vector4(0, 1, 0, 0) }, uBulgeK: { value: o.bulgeK || 40 },
      uShrink: { value: o.shrink ?? 1 }, uAbs: { value: o.abs ?? 1 / 150 }, uRip: { value: o.rip ?? 0.1 },
      uInside: { value: 0 }, uFleck: { value: o.fleck ?? 0 }, uGhost: { value: o.ghost ?? 0.15 }, uTiMax: { value: o.tiMax ?? 0.74 }, uBodyGain: { value: o.bodyGain ?? 1 }, uThinTeal: { value: o.thinTeal ?? 0 }, uSpec: { value: o.spec ?? 1 }, uFres: { value: o.fres ?? 1 },
      uHeart: { value: new THREE.Vector4(o.heartR || 100, 0, 0, o.heart || 0) },
      uStand: { value: o.stand ?? 0 }, uFlip: { value: o.flip ?? 0.85 }, uNear: { value: new THREE.Vector4(o.nearA ?? 40, o.nearB ?? 240, o.near ?? 0, o.nearTi ?? 0.5) },
      uWin: { value: o.win || new THREE.Vector4(0, 0, 1, 0.9) },
      uGC: { value: o.gc || new THREE.Matrix3() }, uBoatPh: { value: o.boatPh || new Array(12).fill(0) },
      uBoatW: { value: o.boatW || 0 }, uBoatN: { value: o.boatN || 0 },
    },
    vertexShader: o.vertexShader || GLOBE_VERT,
    fragmentShader: WATER_FRAG.replace('FOGCODE', FOG_FRAG(premult)),
    side: mode === 'back' ? THREE.BackSide : THREE.FrontSide,
    transparent: premult || !!o.transparent, depthWrite: !premult,
    premultipliedAlpha: premult,
  });
  return m;
}

// ---------------------------------------------------------------------------------------------
// Small indexed mesh builder: position, colour, aSway (0 = rooted, 1 = free tip) and aGlow.
// ---------------------------------------------------------------------------------------------
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _t = new THREE.Vector3(), _q = new THREE.Vector3();
class MB {
  constructor() { this.p = []; this.c = []; this.s = []; this.i = []; this.n = 0; }
  v(x, y, z, col, sw = 0, glow = 1) { this.p.push(x, y, z); this.c.push(col.r, col.g, col.b); this.s.push(sw, glow); return this.n++; }
  tri(a, b, c) { this.i.push(a, b, c); }
  quad(a, b, c, d) { this.i.push(a, b, c, a, c, d); }
  // tapered tube through pts (Vector3[]) with radii rad[]; colFn(t)->Color, swFn(t)->sway; flat squashes one axis
  tube(pts, rad, sides, colFn, swFn, flat = 1, glow = 1) {
    const n = pts.length, base = this.n;
    for (let k = 0; k < n; k++) {
      _t.copy(pts[Math.min(k + 1, n - 1)]).sub(pts[Math.max(k - 1, 0)]).normalize();
      _a.set(0, 0, 1); if (Math.abs(_t.z) > 0.9) _a.set(1, 0, 0);
      _a.cross(_t).normalize(); _b.crossVectors(_t, _a);
      const t = k / (n - 1), col = colFn(t), sw = swFn ? swFn(t) : 0, r = rad[k];
      for (let j = 0; j < sides; j++) {
        const th = j / sides * Math.PI * 2, cx = Math.cos(th) * r, sy = Math.sin(th) * r * flat;
        this.v(pts[k].x + _a.x * cx + _b.x * sy, pts[k].y + _a.y * cx + _b.y * sy, pts[k].z + _a.z * cx + _b.z * sy, col, sw, glow);
      }
    }
    for (let k = 0; k < n - 1; k++) for (let j = 0; j < sides; j++) {
      const a = base + k * sides + j, b = base + k * sides + (j + 1) % sides;
      this.quad(a, b, b + sides, a + sides);
    }
    const tip = this.v(pts[n - 1].x, pts[n - 1].y, pts[n - 1].z, colFn(1), swFn ? swFn(1) : 0, glow);
    for (let j = 0; j < sides; j++) this.tri(base + (n - 1) * sides + j, base + (n - 1) * sides + (j + 1) % sides, tip);
  }
  // lathe a profile [[r, y], ...] about +Y, placed by matrix M; rimFn(theta, t) scales radius
  lathe(prof, sides, M, colFn, swFn, rimFn, glow = 1) {
    const base = this.n, n = prof.length;
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1), sw = swFn ? swFn(t) : 0;
      for (let j = 0; j < sides; j++) {
        const th = j / sides * Math.PI * 2, r = prof[k][0] * (rimFn ? rimFn(th, t) : 1), col = colFn(t, th, j);
        _q.set(Math.cos(th) * r, prof[k][1], Math.sin(th) * r).applyMatrix4(M);
        this.v(_q.x, _q.y, _q.z, col, sw, glow);
      }
    }
    for (let k = 0; k < n - 1; k++) for (let j = 0; j < sides; j++) {
      const a = base + k * sides + j, b = base + k * sides + (j + 1) % sides;
      this.quad(a, a + sides, b + sides, b);
    }
  }
  geo() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aSway', new THREE.Float32BufferAttribute(this.s, 2));
    g.setIndex(this.i); g.computeVertexNormals();
    return g;
  }
  // the same geometry (area-weighted vertex normals, as computeVertexNormals makes them) built in slices, so a
  // hundred thousand triangles never hold the page: pause() hands the frame back
  async geoA(pause) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array(this.p);
    await pause();
    const col = new Float32Array(this.c), sw = new Float32Array(this.s);
    await pause();
    const idx = this.n > 65535 ? new Uint32Array(this.i) : new Uint16Array(this.i), nor = new Float32Array(pos.length);
    await pause();
    for (let f = 0; f < idx.length; f += 3) {
      const a = idx[f] * 3, b = idx[f + 1] * 3, c = idx[f + 2] * 3;
      const cx = pos[c] - pos[b], cy = pos[c + 1] - pos[b + 1], cz = pos[c + 2] - pos[b + 2], ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
      const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax;
      nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
      if (f % 24000 === 23997) await pause();
    }
    await pause();
    for (let i = 0; i < nor.length; i += 3) { const l = Math.hypot(nor[i], nor[i + 1], nor[i + 2]) || 1; nor[i] /= l; nor[i + 1] /= l; nor[i + 2] /= l; }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.setAttribute('aSway', new THREE.BufferAttribute(sw, 2)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    return g;
  }
}

// ---- coral forms, all written into an MB in reef-local metres -------------------------------
function staghorn(mb, rng, M, size, cBase, cTip) {
  const col = new THREE.Color();
  const grow = (p0, dir, len, r, depth, h0) => {
    const bend = new THREE.Vector3(rng.range(-1, 1), rng.range(0, 0.6), rng.range(-1, 1)).multiplyScalar(len * 0.16);
    const p1 = p0.clone().addScaledVector(dir, len * 0.5).add(bend), p2 = p0.clone().addScaledVector(dir, len).add(bend.multiplyScalar(0.4));
    const h1 = h0 + (1 - h0) * (depth === 0 ? 1 : 0.55);
    const pts = (depth === 0 ? [p0, p2] : [p0, p1, p2]).map((p) => p.clone().applyMatrix4(M));
    mb.tube(pts, depth === 0 ? [r, r * 0.3] : [r, r * 0.8, r * 0.62], depth === 0 ? 3 : 4,
      (t) => col.copy(cBase).lerp(cTip, Math.pow(lerp(h0, h1, t), 1.6)), (t) => lerp(h0, h1, t) * lerp(h0, h1, t));
    if (depth === 0) return;
    const kids = depth > 1 ? 3 : 2 + (rng() < 0.4 ? 1 : 0);
    const ph = rng.range(0, 6.28);
    for (let i = 0; i < kids; i++) {
      const a = ph + i / kids * 6.28 + rng.range(-0.4, 0.4), sp = rng.range(0.45, 0.8);
      const d = new THREE.Vector3(Math.cos(a) * sp, 1, Math.sin(a) * sp).applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)).normalize();
      d.y += 0.25; d.normalize();
      grow(i === 0 ? p2 : p1.clone().lerp(p2, rng.range(0.2, 1)), d, len * rng.range(0.6, 0.8), r * 0.6, depth - 1, h1);
    }
  };
  grow(new THREE.Vector3(0, -size * 0.05, 0), new THREE.Vector3(rng.range(-0.2, 0.2), 1, rng.range(-0.2, 0.2)).normalize(), size * 0.42, size * 0.075, 2, 0);
}
function tableCoral(mb, rng, M, size, cBase, cTip) {
  // two tiers on a stem: each a disc with a shaded underside and a lit rim, so a table reads as a table from 150 m
  const col = new THREE.Color(), w = size * 0.5, h = size * rng.range(0.28, 0.45);
  const lobes = rng.int(5, 9), ph = rng.range(0, 6.28), tilt = rng.range(0.03, 0.12), up = 0.8 + (lobes - 5) * 0.06;
  const prof = [[w * 0.16, -h * 0.1], [w * 0.09, h * 0.5], [w * 0.62, h * 0.82], [w, h * 0.96], [w * 0.97, h * 1.08], [w * 0.4, h * 1.1], [w * 0.2, h * (1.1 + 0.3 * up)],
    [w * 0.58, h * (1.1 + 0.52 * up)], [w * 0.56, h * (1.1 + 0.62 * up)], [0.01, h * (1.1 + 0.6 * up)]];
  const shade = [0.5, 0.42, 0.4, 0.62, 1.3, 0.92, 0.4, 0.55, 1.25, 0.95], tip = [0, 0.1, 0.25, 0.6, 1, 0.8, 0.3, 0.5, 1, 0.85];
  mb.lathe(prof, 12, M, (t, th, j) => { const k = Math.round(t * 9); return col.copy(cBase).lerp(cTip, tip[k]).multiplyScalar(shade[k] * (j % 2 ? 1 : 0.9)); }, (t) => t * 0.25,
    (th, t) => 1 + (t > 0.15 ? (Math.sin(th * 2 + ph) * 0.1 + Math.sin(th * 3 + ph * 2) * 0.07 + tilt) : 0));
}
function seaFan(mb, rng, M, size, cBase, cTip) {
  const col = new THREE.Color(), ribs = rng.int(7, 10), spread = rng.range(0.9, 1.25);
  for (let i = 0; i < ribs; i++) {
    const a = (i / (ribs - 1) - 0.5) * 2 * spread, L = size * (1 - 0.25 * Math.abs(a / spread) ** 2) * rng.range(0.85, 1);
    const pts = [];
    for (let k = 0; k <= 3; k++) { const t = k / 3, aa = a * (0.35 + 0.65 * t); pts.push(new THREE.Vector3(Math.sin(aa) * L * t, Math.cos(aa) * L * t, Math.sin(t * 2.5 + i) * size * 0.03).applyMatrix4(M)); }
    const r = size * 0.03;
    mb.tube(pts, [r * 1.5, r * 1.15, r * 0.8, r * 0.3], 3, (t) => col.copy(cBase).lerp(cTip, t * t), (t) => t * t, 0.35);
    if (i < ribs - 1) { // lacy cross-webs between neighbouring ribs
      const a2 = ((i + 1) / (ribs - 1) - 0.5) * 2 * spread;
      for (let k = 1; k <= 2; k++) {
        const t = k / 2.6 + 0.12, q0 = a * (0.35 + 0.65 * t), q1 = a2 * (0.35 + 0.65 * t), Lw = L * t;
        const w0 = new THREE.Vector3(Math.sin(q0) * Lw, Math.cos(q0) * Lw, 0).applyMatrix4(M), w1 = new THREE.Vector3(Math.sin(q1) * Lw, Math.cos(q1) * Lw * 1.04, 0).applyMatrix4(M);
        mb.tube([w0, w1], [r * 0.8, r * 0.8], 2, () => col.copy(cBase).lerp(cTip, t * 0.7), () => t * t, 0.4);
      }
    }
  }
}
function brainCoral(mb, rng, M, size, cBase, cTip, noise) {
  const col = new THREE.Color(), g = BRAIN_GEO, pa = g.attributes.position, base = mb.n, o = rng.range(0, 50);
  for (let i = 0; i < pa.count; i++) {
    _q.fromBufferAttribute(pa, i);
    const gr = noise.n3(_q.x * 2.3 + o, _q.y * 2.3, _q.z * 2.3), up = _q.y;
    const r = size * 0.5 * (1 + gr * 0.22) * (up < -0.2 ? 0.8 : 1);
    col.copy(cBase).lerp(cTip, clamp(0.5 + gr * 1.4 + up * 0.3, 0, 1));
    _q.set(_q.x * r, Math.max(_q.y, -0.35) * r * 0.72, _q.z * r).applyMatrix4(M);
    mb.v(_q.x, _q.y, _q.z, col, 0, 0.8);
  }
  const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) mb.tri(base + ix[i], base + ix[i + 1], base + ix[i + 2]);
}
let BRAIN_GEO = null;

// ---------------------------------------------------------------------------------------------
// Living reef: a coral planetoid (inside a globe "down" is toward the centre, so coral grows outward
// all round a lumpy rock ball). One merged mesh, one draw call. Emissive, swaying, fogged by the
// length of water between it and the eye.
// ---------------------------------------------------------------------------------------------
const REEF_VERT = /* glsl */`
attribute vec2 aSway;
uniform float uTime, uSwayAmp, uSwayK;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vGlow; varying vec3 vP;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  float ph = uTime * 0.8 + dot(p, vec3(0.9, 0.7, 1.1)) * uSwayK;
  p += vec3(sin(ph), cos(ph * 0.83 + 1.3), sin(ph * 1.21 + 2.1)) * aSway.x * uSwayAmp;
  vP = position;
  vec4 w = modelMatrix * vec4(p, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.)); vCol = color; vGlow = aSway.y;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const REEF_FRAG = /* glsl */`
uniform vec4 uGlobe; uniform vec3 uWater; uniform float uGlowI, uFogK, uGrain;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vGlow; varying vec3 vP;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  vec3 out3 = vP / max(length(vP), 1e-3);
  float lit = 0.5 + 0.5 * dot(N, out3);
  float sun = max(dot(N, uSun), 0.);
  float g1 = vn(vP.xz * uGrain + vP.y * uGrain * 0.7), g2 = vn(vP.yx * uGrain * 2.3 + vP.z * uGrain * 1.9 + 5.);
  float spots = smoothstep(0.5, 0.8, vn(vP.xy * uGrain * 5. + vP.z * uGrain * 4.) * 0.6 + g2 * 0.5);
  float grain = 0.62 + 0.55 * g1 + 0.25 * g2;
  float key = 0.5 + 0.5 * dot(N, uSun);
  vec3 alb = vCol + vec3(0.3, 0.16, 0.05) * spots * (0.4 + g1);
  vec3 col = alb * (uGlowI * (0.25 + 0.75 * vGlow) * (0.3 + 0.7 * lit) * (0.45 + 0.55 * key * key) * grain) + vCol * sun * 0.5 + vCol * uSkyMid * 0.2;
  float d = waterPath(cameraPosition, vW, uGlobe.xyz, uGlobe.w);
  float f = exp(-d * uFogK);
  col = mix(uWater + vCol * 0.10, col, f);
  gl_FragColor = vec4(col, 1.);
  ${FOG_FRAG(false)}
}`;

async function buildReef(rng, noise, S, pal, o, pause = async () => {}) {
  const mb = new MB(), Rm = o.rock, sc = o.scale;
  if (!BRAIN_GEO) BRAIN_GEO = new THREE.SphereGeometry(1, 10, 7);
  const coral = new THREE.Color(pal[4]).offsetHSL(o.hue, 0, 0), gold = new THREE.Color(pal[5]);
  const rose = coral.clone().offsetHSL(-0.012, 0.0, -0.22), deepc = coral.clone().offsetHSL(-0.02, -0.05, -0.4);
  const no = rng.range(0, 100);
  const surfR = (d) => Rm * (1 + 0.2 * noise.fbm3(d.x * 1.5 + no, d.y * 1.5, d.z * 1.5, 3) + 0.07 * noise.n3(d.x * 5 + no, d.y * 5, d.z * 5));
  // rock ball
  { const g = new THREE.SphereGeometry(1, o.rockSeg || 40, Math.round((o.rockSeg || 40) * 0.6)), pa = g.attributes.position, base = mb.n, col = new THREE.Color(), d = new THREE.Vector3();
    for (let i = 0; i < pa.count; i++) { d.fromBufferAttribute(pa, i).normalize(); const r = surfR(d), h = (r / Rm - 0.8) / 0.4;
      col.copy(deepc).lerp(rose, clamp(h, 0, 1)); mb.v(d.x * r, d.y * r, d.z * r, col, 0, 0.35 + 0.4 * clamp(h, 0, 1));
      if (i % 160 === 159) await pause(); }
    await pause();
    const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) mb.tri(base + ix[i], base + ix[i + 1], base + ix[i + 2]);
    g.dispose(); }
  await pause();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Q2 = new THREE.Quaternion(), P = new THREE.Vector3(), d = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
  const cB = new THREE.Color(), cT = new THREE.Color();
  const N = o.count;
  for (let i = 0; i < N; i++) {
    const y = 1 - 2 * (i + 0.5) / N, rr = Math.sqrt(1 - y * y), a = i * 2.39996 + rng.range(-0.25, 0.25);
    d.set(Math.cos(a) * rr, y + rng.range(-0.05, 0.05), Math.sin(a) * rr).normalize();
    const sr = surfR(d); P.copy(d).multiplyScalar(sr * 0.96);
    Q.setFromUnitVectors(UP, d); Q2.setFromAxisAngle(UP, rng.range(0, 6.28)); Q.multiply(Q2);
    M.compose(P, Q, ONE);
    const tn = noise.n3(d.x * 2.1 + 40 + no, d.y * 2.1, d.z * 2.1), k = rng(), hill = sr / Rm;
    const hj = rng.range(-0.035, 0.03), lj = rng.range(-0.05, 0.06);
    cB.copy(rose).offsetHSL(hj, 0, lj * 0.5); cT.copy(coral).lerp(gold, rng.range(0.05, 0.4)).offsetHSL(hj, 0, lj);
    if (tn > 0.18) staghorn(mb, rng, M, sc * rng.range(26, 40) * (0.8 + 0.4 * hill), cB, cT);
    else if (tn < -0.28) { if (k < 0.75) seaFan(mb, rng, M, sc * rng.range(18, 30), cB, cT.lerp(new THREE.Color(pal[2]), 0.15)); else brainCoral(mb, rng, M, sc * rng.range(9, 16), cB, cT, noise); }
    else if (k < 0.5) tableCoral(mb, rng, M, sc * rng.range(15, 26), cB, cT);
    else if (k < 0.72) brainCoral(mb, rng, M, sc * rng.range(8, 17), cB, cT, noise);
    else if (k < 0.88) staghorn(mb, rng, M, sc * rng.range(18, 28), cB, cT);
    else seaFan(mb, rng, M, sc * rng.range(16, 24), cB, cT);
    if (i % 6 === 5) await pause();        // the build never holds the page for long
  }
  await pause();
  // one material per globe the reef stands in (the same program): oo overrides fogK, glow, warm, waterGain
  const mkMat = (oo = {}) => new THREE.ShaderMaterial({
    fog: true, vertexColors: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uSun: S.uSun, uSunCol: S.uSunCol, uSkyZen: S.uSkyZen,
      uSkyMid: S.uSkyMid, uSkyHaze: S.uSkyHaze, uGroundSun: S.uGroundSun, uGroundShade: S.uGroundShade,
      uGlobe: { value: new THREE.Vector4(0, 0, 0, 1) }, uWater: { value: new THREE.Color(pal[1]).multiplyScalar(oo.waterGain ?? o.waterGain ?? 0.5).lerp(new THREE.Color(pal[4]).multiplyScalar(0.5), oo.warm ?? o.warm ?? 0.3) },
      uGlowI: { value: oo.glow ?? o.glow ?? 2.5 }, uFogK: { value: oo.fogK ?? o.fogK }, uSwayAmp: { value: 1.3 * sc }, uSwayK: { value: 0.06 / sc }, uGrain: { value: 0.9 / sc } },
    vertexShader: REEF_VERT, fragmentShader: REEF_FRAG,
  });
  const mat = mkMat();
  await pause();
  const geo = await mb.geoA(pause);
  await pause();
  const mesh = new THREE.Mesh(geo, mat);
  return { mesh, mat, geo, mkMat, tris: mb.i.length / 3 };
}

// ---------------------------------------------------------------------------------------------
// Outrigger boats. Local frame: +Z bow, +Y up (out of the water, away from the globe's centre),
// float to port (-X). aSway = (billow weight, part id): 0 timber, 1..2 sail (1 + position across
// the sail, for the stripe), 3 net, 4 rope / pennant.
// ---------------------------------------------------------------------------------------------
function loft(mb, rings, colFn, part) {
  const base = mb.n, m = rings[0].length;
  rings.forEach((ring, k) => ring.forEach((p, j) => mb.v(p.x, p.y, p.z, colFn(k / (rings.length - 1), j / m), 0, part)));
  for (let k = 0; k < rings.length - 1; k++) for (let j = 0; j < m; j++) {
    const a = base + k * m + j, b = base + k * m + (j + 1) % m; mb.quad(a, b, b + m, a + m);
  }
}
function buildBoatGeo(rng, pal, sailHex) {
  const mb = new MB(), V = (x, y, z) => new THREE.Vector3(x, y, z), col = new THREE.Color();
  const timber = new THREE.Color('#7A5236'), dark = new THREE.Color('#3E2C2A'), trim = new THREE.Color(pal[4]).multiplyScalar(0.85);
  const cream = new THREE.Color(sailHex || pal[3]).multiplyScalar(0.8), rope = new THREE.Color('#CDBE9A'), netc = new THREE.Color(pal[6]);
  // main hull: 11 stations, upswept prows, a recessed deck
  const rings = [], NS = 11;
  for (let k = 0; k < NS; k++) {
    const t = k / (NS - 1) * 2 - 1, z = t * 7, a = Math.abs(t);
    const w = 0.95 * Math.pow(Math.max(1 - Math.pow(a, 2.4), 0), 0.7) + 0.02, gy = 0.75 + 1.5 * Math.pow(a, 3.2), ky = -0.75 + 1.2 * Math.pow(a, 3.5);
    const dk = Math.min(gy - 0.28, gy - 0.28 * w), wi = Math.max(w - 0.14, 0.005);
    rings.push([V(-w, gy, z), V(-w * 0.86, (gy + ky) * 0.4, z), V(0, ky, z), V(w * 0.86, (gy + ky) * 0.4, z), V(w, gy, z), V(wi, gy, z), V(wi * 0.9, dk, z), V(-wi * 0.9, dk, z), V(-wi, gy, z)]);
  }
  loft(mb, rings, (t, j) => (j > 0.5 ? col.copy(timber).lerp(rope, 0.35) : (j < 0.05 || (j > 0.4 && j < 0.5)) ? col.copy(trim) : col.copy(timber).lerp(dark, 0.55 + 0.3 * Math.abs(j - 0.22) * 3)), 0);
  // float (ama) and the two curved booms carrying it
  const fx = -4.8, fl = [];
  for (let k = 0; k <= 6; k++) { const t = k / 6 * 2 - 1; fl.push(V(fx, 0.05 + 0.75 * Math.pow(Math.abs(t), 3), t * 4.6)); }
  mb.tube(fl, [0.06, 0.27, 0.36, 0.38, 0.36, 0.27, 0.06], 6, (t) => col.copy(timber).lerp(trim, Math.abs(t - 0.5) > 0.38 ? 0.9 : 0.1), null, 1, 0);
  for (const bz of [2.3, -2.3]) {
    const bp = []; for (let k = 0; k <= 5; k++) { const t = k / 5; bp.push(V(0.6 + (fx - 0.6) * t, 0.95 + 0.85 * Math.sin(t * Math.PI * 0.85) - 0.55 * t * t, bz * (1 - 0.12 * t))); }
    mb.tube(bp, [0.13, 0.12, 0.11, 0.1, 0.1, 0.11], 4, () => col.copy(timber).lerp(dark, 0.25), null, 1, 0);
  }
  // lashed platform between the booms, with heaped nets
  for (let i = 0; i < 3; i++) { const x = -0.9 - i * 0.62; mb.tube([V(x, 1.42 - i * 0.03, 2.2), V(x, 1.42 - i * 0.03, -2.2)], [0.26, 0.26], 4, () => col.copy(timber).lerp(rope, 0.2 + 0.2 * i), null, 0.2, 0); }
  const M = new THREE.Matrix4();
  for (const [x, z, s] of [[-1.5, -0.9, 1], [-1.2, 1.1, 0.7], [0, -3.2, 0.62]]) {
    M.makeTranslation(x, z < -3 ? 0.62 : 1.45, z);
    mb.lathe([[0.9 * s, 0], [0.84 * s, 0.22 * s], [0.5 * s, 0.5 * s], [0.02, 0.58 * s]], 7, M, (t) => col.copy(netc).lerp(rope, 0.15 + 0.3 * t), null, (th) => 1 + 0.18 * Math.sin(th * 3 + x * 5), 3);
  }
  // mast, steering oar
  mb.tube([V(0, 0.5, 1.6), V(0.03, 6, 1.5), V(0, 11.6, 1.35)], [0.17, 0.13, 0.07], 5, (t) => col.copy(timber).lerp(rope, 0.25 + 0.3 * t), null, 1, 0);
  mb.tube([V(0.75, 1.6, -4.6), V(0.95, 0.6, -6.2), V(1.1, -0.9, -7.6)], [0.06, 0.07, 0.3], 4, () => col.copy(timber).lerp(dark, 0.3), null, 0.3, 0);
  // crab-claw sail: two curved spars from the tack at the bow, a membrane with a hollow leech
  const sparU = (a) => V(0.25, 1.3 + 11.2 * Math.pow(a, 0.85), 6.2 - 8.2 * a - 1.6 * Math.sin(a * Math.PI) * 0.5);
  const sparL = (a) => V(0.25, 1.3 + 2.4 * a + 1.6 * a * a, 6.2 - 13.6 * a);
  for (const sp of [sparU, sparL]) { const pts = []; for (let k = 0; k <= 5; k++) pts.push(sp(k / 5)); mb.tube(pts, [0.12, 0.11, 0.1, 0.09, 0.07, 0.04], 4, () => col.copy(timber).lerp(rope, 0.4), null, 1, 0); }
  const NA = 9, NB = 7, sb = mb.n;
  for (let i = 0; i <= NA; i++) for (let j = 0; j <= NB; j++) {
    const b = j / NB, a = (i / NA) * (1 - 0.3 * Math.sin(Math.PI * b)), pu = sparU(a), pl = sparL(a), p = pu.lerp(pl, b);
    mb.v(p.x, p.y, p.z, cream, Math.sin(Math.PI * b) * Math.sqrt(a), 1 + b);
  }
  for (let i = 0; i < NA; i++) for (let j = 0; j < NB; j++) { const a = sb + i * (NB + 1) + j; mb.quad(a, a + 1, a + NB + 2, a + NB + 1); }
  // stays (ribbons wide enough to hold a pixel at 40 m) and a pennant at the masthead
  for (const e of [V(0, 2.2, 6.9), V(0, 2.2, -6.9), V(fx, 0.5, 0)]) mb.tube([V(0, 11.4, 1.35), e], [0.045, 0.045], 3, () => rope, null, 1, 4);
  const pb = mb.n;
  for (let k = 0; k <= 5; k++) { const t = k / 5; mb.v(0, 11.7 + 0.28 * (1 - t), 1.3 - t * 2.6, trim, t, 4.5); mb.v(0, 11.7 - 0.28 * (1 - t), 1.3 - t * 2.6, trim, t, 4.5); }
  for (let k = 0; k < 5; k++) mb.quad(pb + k * 2, pb + k * 2 + 1, pb + k * 2 + 3, pb + k * 2 + 2);
  return mb.geo();
}
const BOAT_VERT = /* glsl */`
attribute vec2 aSway; attribute float aPh;
uniform mat3 uGC; uniform float uBoatW, uR, uScale; uniform vec4 uWob;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vPart; varying vec3 vP;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  float lon = aPh + uBoatW * uTime;
  vec3 n = uGC * vec3(cos(lon), sin(lon), 0.), f = uGC * vec3(-sin(lon), cos(lon), 0.), r = cross(n, f);
  vec3 p = position; vec3 nr = normal;
  float sail = step(0.5, aSway.y) * step(aSway.y, 2.5), flag = step(4.25, aSway.y);
  float bil = aSway.x * (1.25 + 0.16 * sin(uTime * 2.3 + p.y * 0.9 + aPh * 7.) * aSway.x);
  p.x -= bil * sail; nr = normalize(nr + vec3(0., 0.25, -0.2) * bil * sail + vec3(1e-5, 0., 0.));
  p.x += flag * aSway.x * 0.5 * sin(uTime * 6. - p.z * 2.4 + aPh * 3.);
  float roll = 0.07 * sin(uTime * 0.9 + aPh * 5.), pit = 0.045 * sin(uTime * 0.7 + aPh * 9.);
  p.xy = mat2(cos(roll), sin(roll), -sin(roll), cos(roll)) * p.xy; nr.xy = mat2(cos(roll), sin(roll), -sin(roll), cos(roll)) * nr.xy;
  p.yz = mat2(cos(pit), sin(pit), -sin(pit), cos(pit)) * p.yz; nr.yz = mat2(cos(pit), sin(pit), -sin(pit), cos(pit)) * nr.yz;
  float h = uR * (1. + wobf(n, uWob, uTime));
  p *= uScale;
  vec3 lp = n * (h + p.y) + r * p.x + f * p.z;
  vec4 w = modelMatrix * vec4(lp, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * (n * nr.y + r * nr.x + f * nr.z) + vec3(0., 1e-5, 0.)); vCol = color; vPart = aSway.y; vP = position;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BOAT_FRAG = /* glsl */`
uniform vec3 uStripe;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying float vPart; varying vec3 vP;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  vec3 alb = vCol; float nl = dot(N, uSun);
  float isSail = step(0.5, vPart) * step(vPart, 2.5);
  float b = vPart - 1.;
  float stripe = smoothstep(0.30, 0.325, b) * (1. - smoothstep(0.475, 0.50, b));
  float seam = (1. - smoothstep(0.0, 0.035, abs(fract(b * 7.) - 0.5) - 0.44)) * 0.12;
  alb = mix(alb, mix(alb, uStripe, stripe) * (1. - seam), isSail);
  float plank = (1. - smoothstep(0.0, 0.06, abs(fract(vP.y * 3.1) - 0.5) - 0.4)) * 0.22 + (vn(vP.zy * vec2(1.3, 9.)) - 0.5) * 0.25;
  alb *= 1. - plank * step(vPart, 0.5);
  float net = (1. - smoothstep(0.0, 0.1, abs(fract((vP.x + vP.z) * 5.) - 0.5) - 0.3)) + (1. - smoothstep(0.0, 0.1, abs(fract((vP.x - vP.z) * 5. + vP.y * 3.) - 0.5) - 0.3));
  alb *= 1. + (net * 0.45 - 0.3) * step(2.5, vPart) * step(vPart, 3.5);
  float dif = mix(max(nl, 0.), abs(nl) * 0.75 + 0.25, isSail);     // sails glow when backlit
  vec3 amb = mix(uGroundSun * 0.35 + uSkyMid * 0.25, uSkyZen * 0.55 + uSkyMid * 0.3, N.y * 0.5 + 0.5);
  vec3 col = alb * (vec3(1.0, 0.95, 0.85) * 1.5 * dif + amb);
  gl_FragColor = vec4(col, 1.);
  ${FOG_FRAG(false)}
}`;

// ---------------------------------------------------------------------------------------------
// The liquid bridge: one tube of revolution on a straight axis whose profile is computed in the
// vertex shader. uThin drains the span, uBead (0..1) runs the Rayleigh-Plateau break-up cell by cell
// away from the Mother: a cosine swell grows until the necks close, then each swell's rings slide
// onto a true sphere. The two end stubs retract into the globes with uRecoil.
// ---------------------------------------------------------------------------------------------
const BR_X0 = 84, BR_X1 = 82, BR_STAG = 0.07;       // the eleven cells are 14 m long and hang in the middle of the span, well short of either globe
const cellProg = (p, i) => clamp(p * (1 + 10 * BR_STAG) - i * BR_STAG, 0, 1);
const BRIDGE_VERT = /* glsl */`
uniform vec3 uA, uB; uniform float uBeadR[11]; uniform float uThin, uBead, uRecoil, uRecA; uniform vec4 uWob;
varying vec3 vW; varying vec3 vN; varying vec3 vL; varying float vR; varying vec3 vCen;
#include <fog_pars_vertex>
${GLSL_COMMON}
float smax(float a, float b, float k){ return 0.5 * (a + b + sqrt((a - b) * (a - b) + k * k + 1e-8)); }
// the free end of a stub: a retracting thread gathers into a round bulb. d = metres in from the tip, rt = thread radius
float stubEnd(float d, float rt){
  d = max(d - 1., 0.);                                  // (the last ring before the tip always closes it)
  float Rt = rt * 1.7, c = 1. - min(d / Rt, 1.);
  float q = (d - Rt) / (1.3 * Rt);
  return (1. + 0.7 * exp(-q * q)) * sqrt(max(1. - c * c, 1e-6));
}
void shape(float x, float L, out float ax, out float rad, out float cx){
  float xa = max(x, 0.), xb = max(L - x, 0.);
  float base = 9. + 11. * exp(-xa / 26.) + 2. * exp(-xb / 8.) + 16. * exp(-xa / 6.);
  float bellS = smoothstep(0., 60., x) * smoothstep(0., 24., L - x);
  float rt = base * (1. - uThin * 0.6 * bellS) * (1. + 0.035 * sin(x * 0.21 - uTime * 1.1) * bellS);
  float lam = (L - ${BR_X0}. - ${BR_X1}.) / 11.;
  float xi = (x - ${BR_X0}.) / lam;
  float pp = uBead * ${(1 + 10 * BR_STAG).toFixed(2)};
  if (xi < 0.) {
    float m0 = smoothstep(0.1, 0.3, pp);                // the Mother's end parts from the string first
    rad = rt * mix(1., stubEnd(-xi * lam, rt), m0) * (1. + 0.5 * uRecA) * (1. - smoothstep(0.72, 1., uRecA)); ax = x * (1. - uRecA); cx = 0.;
  } else if (xi >= 11.) {
    float m1 = smoothstep(0.1, 0.3, pp - 10. * ${BR_STAG});
    rad = rt * mix(1., stubEnd((xi - 11.) * lam, rt), m1) * (1. + 0.35 * uRecoil) * (1. - smoothstep(0.72, 1., uRecoil)); ax = L - (L - x) * (1. - uRecoil); cx = L;
  } else {
    float fi = min(floor(xi), 10.); int i = int(fi);
    float fr = xi - fi - 0.5, s = fr * lam;
    float a = clamp(pp - fi * ${BR_STAG}, 0., 1.);
    float k = smoothstep(0.5, 1., a);
    float Rb = uBeadR[i]; cx = ${BR_X0}. + (fi + 0.5) * lam;
    float wob = k * 0.11 * sin(uTime * 2.4 + fi * 1.7) * (0.4 + 0.6 * (1. - smoothstep(0.9, 1., uBead)));
    // beads on a string: in each cell a ball swells (radius Rs) while the thread either side of it thins to nothing;
    // then the cell's rings slide along the axis onto the ball (sp), every ring staying on the one true profile, so
    // nothing is ever pointed and the strip spanning the gap to the next bead is a line of no width
    float Rs = mix(rt, Rb, smoothstep(0., 0.6, a));
    // the string's two free ends: the half cell next to each stub lets go early, and its ball is the round end of the string
    float freeEnd = 1. - max((1. - step(0.5, fi)) * (1. - step(0., fr)) * smoothstep(0.1, 0.3, pp), step(9.5, fi) * step(0., fr) * smoothstep(0.1, 0.3, pp - 10. * ${BR_STAG}));
    float thr = rt * (1. - smoothstep(0.05, 0.75, a)) * freeEnd;
    float kk = 0.3 * rt * smoothstep(0., 0.2, a) * (1. - smoothstep(0.55, 0.8, a)) * freeEnd;
    float phS = clamp(fr * 1.3, -0.5, 0.5) * 3.14159265;
    float sp = mix(s, Rb * sin(phS), k);
    ax = cx + sp * (1. - 1.6 * wob);
    rad = smax(sqrt(max(Rs * Rs - sp * sp, 1e-6)), thr, kk) * (1. + wob);
  }
}
void main(){
  vec3 axd = uB - uA; float L = length(axd); axd /= L;
  vec3 U = normalize(cross(axd, vec3(0., 1., 0.))), Wv = cross(U, axd);
  float x = position.z * (L + 16.) - 8.;
  float ax, rad, cx, ax2, rad2, cx2;
  shape(x, L, ax, rad, cx); shape(x + 0.35, L, ax2, rad2, cx2);
  vec3 rd = U * position.x + Wv * position.y;
  vec3 lp = uA + axd * ax + rd * rad;
  vec3 nl = normalize(rd * (abs(ax2 - ax) + 1e-3) - axd * (rad2 - rad));
  vec4 w = modelMatrix * vec4(lp, 1.);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * nl);
  vR = max(rad * 1.6, 2.5); vL = lp / vR; vCen = (modelMatrix * vec4(uA + axd * cx, 1.)).xyz;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
function buildBridgeGeo(NR, NS, z0 = 0.14, z1 = 0.86) {
  // rings crowd into the middle stretch (z0..z1 of the length), where the beads form: twenty rings to a bead
  const p = new Float32Array((NR + 1) * NS * 3), idx = [];
  const zm = (t) => t < 0.14 ? t / 0.14 * z0 : t < 0.86 ? z0 + (t - 0.14) / 0.72 * (z1 - z0) : z1 + (t - 0.86) / 0.14 * (1 - z1);
  for (let k = 0; k <= NR; k++) for (let j = 0; j < NS; j++) {
    const th = j / NS * Math.PI * 2, o = (k * NS + j) * 3; p[o] = Math.cos(th); p[o + 1] = Math.sin(th); p[o + 2] = zm(k / NR);
  }
  for (let k = 0; k < NR; k++) for (let j = 0; j < NS; j++) { const a = k * NS + j, b = k * NS + (j + 1) % NS; idx.push(a, b + NS, b, a, a + NS, b + NS); }     // wound so the outside is the front face
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------------------------------------
// Fish. One shader for the Lantern's reef fish and the Mother's bait balls: every fish rides a small
// tilted orbit (aOrb) about a centre that itself rides a big orbit (aCtr); the body undulates, and
// fish closer than uAvoid metres to the lens slide aside.
// ---------------------------------------------------------------------------------------------
function buildFishGeo(simple) {
  const mb = new MB(), body = new THREE.Color(1, 1, 1), fin = new THREE.Color(0.45, 0.4, 0.45), band = new THREE.Color(1.5, 1.5, 1.4), belly = new THREE.Color(1.15, 1.1, 1.0);
  if (simple) { // 6 triangles: a flat diamond and a forked tail
    const a = mb.v(0, 0, 0.5, body), b = mb.v(0, 0.17, 0.1, body), c = mb.v(0, -0.15, 0.1, belly), d = mb.v(0, 0, -0.32, body);
    const e = mb.v(0, 0.16, -0.52, fin), f = mb.v(0, -0.16, -0.52, fin), g = mb.v(0.07, 0, 0.1, body), h = mb.v(-0.07, 0, 0.1, body);
    mb.tri(a, b, g); mb.tri(a, g, c); mb.tri(a, h, b); mb.tri(a, c, h); mb.tri(b, d, g); mb.tri(d, e, f);
    return mb.geo();
  }
  // 22 triangles: nose, two body rings, peduncle, forked tail, dorsal, ventral and two pectoral fins
  const n = mb.v(0, 0.01, 0.5, body), pd = mb.v(0, 0, -0.32, body);
  const A = [[0, 0.17], [0.085, 0.0], [0, -0.15], [-0.085, 0.0]].map(([x, y], j) => mb.v(x, y, 0.2, j === 2 ? belly : body));
  const B = [[0, 0.15], [0.062, 0.0], [0, -0.12], [-0.062, 0.0]].map(([x, y], j) => mb.v(x, y, -0.09, j === 2 ? belly : body));
  for (let j = 0; j < 4; j++) { const k = (j + 1) % 4; mb.tri(n, A[k], A[j]); mb.quad(A[j], A[k], B[k], B[j]); mb.tri(B[j], B[k], pd); }
  const p2 = mb.v(0, 0, -0.3, body), tu = mb.v(0, 0.25, -0.57, fin), tm = mb.v(0, 0.0, -0.43, fin), td = mb.v(0, -0.25, -0.57, fin);
  mb.tri(p2, tu, tm); mb.tri(p2, tm, td);
  mb.tri(mb.v(0, 0.16, 0.18, body), mb.v(0, 0.14, -0.1, body), mb.v(0, 0.34, -0.14, fin));
  mb.tri(mb.v(0, -0.13, 0.1, belly), mb.v(0, -0.28, -0.08, fin), mb.v(0, -0.11, -0.1, belly));
  for (const sx of [1, -1]) mb.tri(mb.v(0.08 * sx, -0.02, 0.2, body), mb.v(0.22 * sx, -0.11, 0.0, fin), mb.v(0.075 * sx, -0.07, 0.07, body));
  return mb.geo();
}
const FISH_VERT = /* glsl */`
attribute vec4 aOrb; attribute vec4 aCtr; attribute vec3 aMisc;
uniform float uCtrW, uAvoid; uniform vec3 uTintA, uTintB;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vP;
#include <fog_pars_vertex>
${GLSL_COMMON}
vec3 rotO(vec3 p, float tilt, float node){
  p.xy = mat2(cos(tilt), sin(tilt), -sin(tilt), cos(tilt)) * p.xy;
  p.xz = mat2(cos(node), sin(node), -sin(node), cos(node)) * p.xz;
  return p;
}
void main(){
  float th = aOrb.w + aMisc.x * uTime, tc = aCtr.w + uCtrW * uTime;
  vec3 c = rotO(vec3(cos(th), 0., sin(th)), aOrb.y, aOrb.z) * aOrb.x + rotO(vec3(cos(tc), 0., sin(tc)), aCtr.y, aCtr.z) * aCtr.x;
  float sg = aMisc.x < 0. ? -1. : 1.;
  vec3 f = rotO(vec3(-sin(th), 0., cos(th)), aOrb.y, aOrb.z) * sg, up = rotO(vec3(0., 1., 0.), aOrb.y, aOrb.z), rt = cross(up, f);
  vec3 p = position; float tail = (0.5 - p.z);
  p.x += sin(uTime * 9. + aOrb.w * 31. - p.z * 5.) * 0.10 * tail * tail;
  vec4 wc = modelMatrix * vec4(c, 1.);
  vec3 dc = wc.xyz - cameraPosition; float d = length(dc);
  vec3 push = dc / max(d, 1e-3) * max(0., uAvoid - d) * 0.85;
  vec3 lp = c + (rt * p.x + up * p.y + f * p.z) * aMisc.y;
  vec4 w = modelMatrix * vec4(lp, 1.); w.xyz += push;
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * (rt * normal.x + up * normal.y + f * normal.z) + vec3(0., 1e-5, 0.));
  vCol = color * mix(uTintA, uTintB, aMisc.z); vP = position;
  vec4 mvPosition = viewMatrix * w;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FISH_FRAG = /* glsl */`
uniform vec4 uGlobe; uniform vec3 uWater; uniform float uFogK, uSelf, uPaint;
varying vec3 vW; varying vec3 vN; varying vec3 vCol; varying vec3 vP;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  float dif = 0.5 + 0.5 * dot(N, uSun);
  vec3 alb = vCol;
  float band = max((1. - smoothstep(0.025, 0.045, abs(vP.z - 0.19))), (1. - smoothstep(0.018, 0.035, abs(vP.z + 0.12))));
  float edge = max((1. - smoothstep(0.05, 0.075, abs(vP.z - 0.19))), (1. - smoothstep(0.04, 0.06, abs(vP.z + 0.12)))) - band;
  float eye = (1. - smoothstep(0.024, 0.034, length(vec2(vP.z - 0.37, vP.y - 0.035))));
  alb = mix(alb, vec3(0.85, 0.86, 0.8), band * uPaint); alb *= 1. - (edge * 0.6 + eye * 0.92) * uPaint;
  alb *= 1. + (1. - smoothstep(-0.14, 0.02, vP.y)) * 0.3 - smoothstep(0.1, 0.2, vP.y) * 0.25;
  vec3 col = alb * (dif * dif * 1.25 + 0.3 + uSelf);
  float d = waterPath(cameraPosition, vW, uGlobe.xyz, uGlobe.w);
  col = mix(uWater, col, exp(-d * uFogK));
  gl_FragColor = vec4(col, 1.);
  ${FOG_FRAG(false)}
}`;
// groups: [{ n, ctr:[R,tilt,node,phase], rMin, rMax, tiltSpread, size:[a,b], speed:[a,b], school }]
function buildFish(rng, S, pal, o) {
  const geo = buildFishGeo(o.simple), N = o.groups.reduce((a, g) => a + g.n, 0);
  const orb = new Float32Array(N * 4), ctr = new Float32Array(N * 4), misc = new Float32Array(N * 3);
  let i = 0;
  for (const g of o.groups) {
    const dir = rng.sign();
    for (let k = 0; k < g.n; k++, i++) {
      const lead = g.school ? Math.pow(rng(), 0.6) * g.school : rng.range(0, 6.28), r = rng.range(g.rMin, g.rMax);
      orb.set([r, g.tilt + rng.gauss() * g.tiltSpread, g.node + rng.gauss() * g.tiltSpread, g.phase + lead + rng.gauss() * 0.02], i * 4);
      ctr.set(g.ctr, i * 4);
      const v = rng.range(g.speed[0], g.speed[1]);
      misc.set([dir * v / Math.max(r, 1), rng.range(g.size[0], g.size[1]), rng()], i * 3);
    }
  }
  const mat = new THREE.ShaderMaterial({
    fog: true, vertexColors: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uSun: S.uSun, uSunCol: S.uSunCol, uSkyZen: S.uSkyZen,
      uSkyMid: S.uSkyMid, uSkyHaze: S.uSkyHaze, uGroundSun: S.uGroundSun, uGroundShade: S.uGroundShade,
      uGlobe: { value: new THREE.Vector4(0, 0, 0, 1) }, uWater: { value: o.water }, uFogK: { value: o.fogK }, uSelf: { value: o.self || 0 }, uPaint: { value: o.simple ? 0 : 1 },
      uCtrW: { value: o.ctrW || 0 }, uAvoid: { value: o.avoid || 0 }, uTintA: { value: o.tintA }, uTintB: { value: o.tintB } },
    vertexShader: FISH_VERT, fragmentShader: FISH_FRAG,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  geo.setAttribute('aOrb', new THREE.InstancedBufferAttribute(orb, 4));
  geo.setAttribute('aCtr', new THREE.InstancedBufferAttribute(ctr, 4));
  geo.setAttribute('aMisc', new THREE.InstancedBufferAttribute(misc, 3));
  return { mesh, mat };
}

// ---------------------------------------------------------------------------------------------
// Lantern interior: sun shafts (additive ribbons turned to the lens) and rising bubbles. One mesh.
// position = anchor point (Lantern-local), aQ = (along 0..1 | corner x, side -1..1 | corner y,
// width | size, seed), aKind = 0 shaft, 1 bubble; shafts also carry aEnd.
// ---------------------------------------------------------------------------------------------
function buildLanternFx(rng, S, pal, sun) {
  const pos = [], q = [], end = [], kind = [], idx = []; let n = 0;
  const quad = (a, e, k, w, seed) => {
    for (const [u, v] of [[0, -1], [1, -1], [1, 1], [0, 1]]) { pos.push(a.x, a.y, a.z); end.push(e.x, e.y, e.z); q.push(u, v, w, seed); kind.push(k); }
    idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4;
  };
  const a = new THREE.Vector3(), e = new THREE.Vector3();
  for (let i = 0; i < 14; i++) {
    a.copy(sun).add(new THREE.Vector3(rng.range(-0.75, 0.75), rng.range(-0.3, 0.3), rng.range(-0.75, 0.75))).normalize().multiplyScalar(LANTERN_R * 0.97);
    e.copy(a).addScaledVector(sun, -rng.range(34, 52));
    quad(a, e, 0, rng.range(1.2, 3.6), rng.range(0, 6.28));
  }
  for (let i = 0; i < 200; i++) {
    const r = Math.sqrt(rng()) * 23, th = rng.range(0, 6.28);
    a.set(Math.cos(th) * r, Math.sqrt(LANTERN_R * LANTERN_R - r * r) * 0.92, Math.sin(th) * r);
    quad(a, a, 1, rng.range(0.05, 0.2), rng.range(0, 6.28));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aEnd', new THREE.Float32BufferAttribute(end, 3));
  g.setAttribute('aQ', new THREE.Float32BufferAttribute(q, 4)); g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: S.uTime, uFade: { value: 0 }, uShaft: { value: new THREE.Color(pal[5]).lerp(new THREE.Color(pal[0]), 0.45) }, uBub: { value: new THREE.Color(pal[2]) } },
    vertexShader: /* glsl */`
attribute vec3 aEnd; attribute vec4 aQ; attribute float aKind;
uniform float uTime; varying vec4 vQ; varying float vKind;
void main(){
  vQ = aQ; vKind = aKind; vec3 lp;
  if (aKind < 0.5) {
    vec3 a = (modelMatrix * vec4(position, 1.)).xyz, b = (modelMatrix * vec4(aEnd, 1.)).xyz, c = mix(a, b, aQ.x);
    vec3 sd = cross(b - a, c - cameraPosition); sd /= max(length(sd), 1e-4);
    lp = c + sd * aQ.y * aQ.z * (0.7 + aQ.x * 0.9);
  } else {
    float ext = position.y, sp = 0.6 + 0.8 * fract(aQ.w * 3.7);
    float y = (fract(aQ.w + uTime * sp / (2. * ext)) * 2. - 1.) * ext;
    vec3 c = (modelMatrix * vec4(position.x + sin(uTime * 1.7 + aQ.w * 9.) * 0.25, y, position.z + cos(uTime * 1.3 + aQ.w * 5.) * 0.25, 1.)).xyz;
    vec3 rt = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    lp = c + (rt * (aQ.x * 2. - 1.) + up * aQ.y) * aQ.z;
  }
  gl_Position = projectionMatrix * viewMatrix * vec4(lp, 1.);
}`,
    fragmentShader: /* glsl */`
uniform float uTime, uFade; uniform vec3 uShaft, uBub; varying vec4 vQ; varying float vKind;
void main(){
  vec3 col;
  if (vKind < 0.5) {
    float e = 1. - vQ.y * vQ.y, t = vQ.x;
    float a = e * e * smoothstep(0., 0.12, t) * (1. - t) * (1. - t) * (0.65 + 0.35 * sin(uTime * 0.8 + vQ.w + t * 5.));
    col = uShaft * a * 0.95 * (0.12 + 0.88 * uFade);
  } else {
    vec2 p = vec2(vQ.x * 2. - 1., vQ.y); float r = length(p);
    float rim = (1. - smoothstep(0.82, 1., r)) * smoothstep(0.5, 0.9, r) + (1. - smoothstep(0.0, 0.3, length(p - vec2(-0.35, 0.4)))) * 0.9;
    col = uBub * rim * 1.3 * (0.25 + 0.75 * uFade);
  }
  gl_FragColor = vec4(col, 1.);
}`,
  });
  return { mesh: new THREE.Mesh(g, mat), mat };
}

// ---------------------------------------------------------------------------------------------
// What the Mother throws on the plain: a soft periwinkle shadow down the sun line with a writhing
// net of gold-green caustics at its centre, warmed by the heart. One premultiplied quad.
// ---------------------------------------------------------------------------------------------
function buildGroundFx(S, pal) {
  const mat = new THREE.ShaderMaterial({
    fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uShade: S.uGroundShade, uGold: { value: new THREE.Color(pal[5]) }, uAqua: { value: new THREE.Color(pal[0]) },
      uCoral: S.uCoral, uStretch: { value: new THREE.Vector3(1, 0, 1.27) }, uK: { value: new THREE.Vector4(0.62, 1, 1, 0) } },   // shade, radius scale, net gain, coral warmth
    vertexShader: /* glsl */`
varying vec2 vP;
#include <fog_pars_vertex>
void main(){ vP = position.xy; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`,
    fragmentShader: /* glsl */`
uniform float uTime; uniform vec3 uShade, uGold, uAqua, uCoral, uStretch; uniform vec4 uK; varying vec2 vP;
#include <fog_pars_fragment>
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec2 p = vec2(vP.x, vP.y / max(uStretch.z, 1e-3)) / max(uK.y, 1e-3);                 // metres, sun-line squash removed
  float r = length(p);
  float sh = (1. - smoothstep(185., 285., r)) * uK.x;
  vec2 q = p * 0.045 + vec2(vn(p * 0.012 + uTime * 0.05), vn(p * 0.012 - uTime * 0.04 + 7.)) * 1.6;
  float n1 = abs(vn(q + uTime * 0.07) - vn(q * 1.63 - uTime * 0.05 + 3.1));
  float n2 = abs(vn(q * 2.1 - uTime * 0.09 + 11.) - vn(q * 3.3 + uTime * 0.06));
  float net = (1. - smoothstep(0.0, 0.11, n1)) + (1. - smoothstep(0.0, 0.09, n2)) * 0.5;
  float pool = 1. - smoothstep(30., 165., r);
  vec3 cau = mix(uAqua * 0.7 + uGold * 0.5, uGold * 0.9 + uCoral * (0.4 + uK.w), 1. - smoothstep(0., 110., r)) * (net * 1.25 + 0.16) * pool * uK.z;
  vec3 col = uShade * 0.62 * sh + cau; float a = sh;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogF = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    col *= 1. - fogF; a *= 1. - fogF;
  #endif
  gl_FragColor = vec4(col, a);
}`,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(640, 640 * 1.27), mat);
  return { mesh, mat };
}


export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('mother-globe') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const S = makeShared(pal);
  await ctx.yield?.();
  const root = new THREE.Group(); root.name = 'mother-globe';
  const add = (m, order) => { m.frustumCulled = false; if (order !== undefined) m.renderOrder = order; root.add(m); return m; };

  // great circle of the boats: the Mother's equator tipped 20 degrees, low side toward the path (+X)
  const tipAz = rng.range(-0.25, 0.25);
  const pole = new THREE.Vector3(Math.sin(0.35) * Math.cos(tipAz), Math.cos(0.35), Math.sin(0.35) * Math.sin(tipAz)).normalize();
  const gu = new THREE.Vector3(0, 0, 1).cross(pole).normalize().negate(); // u roughly +X... see boats
  const gv = new THREE.Vector3().crossVectors(pole, gu).normalize();
  const gc = new THREE.Matrix3().set(gu.x, gv.x, pole.x, gu.y, gv.y, pole.y, gu.z, gv.z, pole.z);
  const NBOAT = 12, boatPh = [];
  const NB = Math.round(clamp(opts.boats ?? NBOAT, 6, NBOAT));   // boats really sailing (six to twelve)
  for (let i = 0; i < NBOAT; i++) boatPh.push((i + rng.range(-0.3, 0.3)) / NB * Math.PI * 2);
  const boatW = 6 / MOTHER_R; // 6 m/s along the skin, travelling toward -Z on the near (+X) side

  const wobM = new THREE.Vector4(0.021, 0.31, rng.range(0, 6.28), 0);
  const wobL = new THREE.Vector4(0.022, 1.25, rng.range(0, 6.28), 0);
  const wobD = new THREE.Vector4(0.024, 0.8, rng.range(0, 6.28), 0);

  // ---- the Mother ----
  const geoHi = icoGeo(31);
  await ctx.yield?.();
  const geoMid = icoGeo(15), geoLo = icoGeo(7);
  await ctx.yield?.();
  const mBack = makeWaterMat(S, 'back', { wob: wobM, shrink: 0.996, abs: 1 / 150, rip: 0.05, heart: 1, heartR: 92, near: 1, nearA: 45, nearB: 215, nearTi: 0.3 });
  const mFront = makeWaterMat(S, 'front', { wob: wobM, rip: 0.11, wakes: true, gc, boatPh, boatW, boatN: NB, near: 1, nearA: 45, nearB: 215 });
  const motherBack = add(new THREE.Mesh(geoMid, mBack), 1), motherFront = add(new THREE.Mesh(geoHi, mFront), 20);
  for (const m of [motherBack, motherFront]) { m.position.copy(MOTHER_C); m.scale.setScalar(MOTHER_R); }
  await ctx.yield?.();

  // ---- the Lantern ----
  const lanWin = new THREE.Vector4(0, 0.2, 0.98, 0.9);       // the round window seen from inside: direction (world) and cos of its half angle
  const lBack = makeWaterMat(S, 'back', { wob: wobL, shrink: 0.99, abs: 1 / 80, rip: 0.04, transparent: true, thinTeal: 0.5, win: lanWin });
  const lFront = makeWaterMat(S, 'front', { wob: wobL, rip: 0.09 });
  const lanternBack = add(new THREE.Mesh(geoLo, lBack), 2), lanternFront = add(new THREE.Mesh(geoMid, lFront), 21);
  for (const m of [lanternBack, lanternFront]) { m.position.copy(LANTERN_C); m.scale.setScalar(LANTERN_R); }

  // ---- the Daughter ----
  // back shell, real contents, front skin (as the Lantern): four boats circle her on their own tipped great circle
  const rx = (ctx.core && ctx.core.makeRng) ? ctx.core.makeRng((((ctx.seed ?? 1) * 7919 + 104729) >>> 0) || 1) : rng;       // new things draw from their own stream
  const poleD = new THREE.Vector3(-0.42, 0.86, 0.29).normalize();
  const guD = new THREE.Vector3(0, 0, 1).cross(poleD).normalize().negate(), gvD = new THREE.Vector3().crossVectors(poleD, guD).normalize();
  const gcD = new THREE.Matrix3().set(guD.x, gvD.x, poleD.x, guD.y, gvD.y, poleD.y, guD.z, gvD.z, poleD.z);
  const NBD = 4, boatPhD = [], boatWD = 3.2 / DAUGHTER_R;
  for (let i = 0; i < 12; i++) boatPhD.push((i + rx.range(-0.2, 0.2)) / NBD * Math.PI * 2);
  const dBack = makeWaterMat(S, 'back', { wob: wobD, shrink: 0.992, abs: 1 / 95, rip: 0.05, thinTeal: 0.4, bulgeK: 30, near: 1, nearA: 150, nearB: 330, nearTi: 0.42 });
  const dFront = makeWaterMat(S, 'front', { wob: wobD, rip: 0.1, bulgeK: 30, wakes: true, gc: gcD, boatPh: boatPhD, boatW: boatWD, boatN: NBD, near: 1, nearA: 150, nearB: 330 });
  const daughter = add(new THREE.Mesh(geoLo, dBack), 2), daughterFront = add(new THREE.Mesh(geoMid, dFront), 21);
  for (const m of [daughter, daughterFront]) { m.position.copy(DAUGHTER_C); m.scale.setScalar(DAUGHTER_R); }
  // ---- the Moon (passed 17 m off at the start): the same build, a reef and a turning school inside ----
  const wk = opts.breeze ? 1.7 : 0.55;
  const wobO = new THREE.Vector4(0.02 * wk, 0.7 * (opts.breeze ? 1.3 : 1), rx.range(0, 6.28), 0);
  const oBack = makeWaterMat(S, 'back', { wob: wobO, shrink: 0.992, abs: 1 / 85, rip: 0.05, thinTeal: 0.4, near: 1, nearA: 15, nearB: 200, nearTi: 0.42 });
  const oFront = makeWaterMat(S, 'front', { wob: wobO, rip: 0.1, near: 1, nearA: 15, nearB: 200 });
  const moonBack = add(new THREE.Mesh(geoLo, oBack), 2), moonFront = add(new THREE.Mesh(geoMid, oFront), 21);
  for (const m of [moonBack, moonFront]) { m.position.copy(MOON_C); m.scale.setScalar(MOON_R); }

  // ---- coral heart (Mother) and bommie (Lantern) ----
  const noise = ctx.noise || ctx.core.makeNoise(7);
  const reefHue = rng.range(-0.035, 0.03);
  const pause = async () => { await ctx.yield?.(); };
  const heart = await buildReef(rng, noise, S, pal, { rock: 64, scale: 1, count: Math.round(185 * (0.7 + 0.3 * detail)), hue: reefHue, fogK: 1 / 210, glow: 1.9, warm: 0.4 }, pause);
  add(heart.mesh, 5); heart.mesh.position.copy(MOTHER_C);
  await ctx.yield?.();
  const BOMMIE_C = LANTERN_C.clone().add(new THREE.Vector3(0, -13, 0));
  const bommie = await buildReef(rng, noise, S, pal, { rock: 4.6, scale: 0.1, count: 58, rockSeg: 26, warm: 0, hue: reefHue + 0.02, fogK: 1 / 60, glow: 1.6, waterGain: 1.4 }, pause);
  add(bommie.mesh, 5); bommie.mesh.position.copy(BOMMIE_C);
  await ctx.yield?.();
  const globeU = [[heart.mat.uniforms.uGlobe.value, MOTHER_C, MOTHER_R], [bommie.mat.uniforms.uGlobe.value, LANTERN_C, LANTERN_R]];
  // a second small reef, stood in the Moon and (larger) in the Daughter
  const reefB = await buildReef(rx, noise, S, pal, { rock: 4.4, scale: 0.105, count: 40, rockSeg: 20, warm: 0.05, hue: reefHue - 0.012, fogK: 1 / 95, glow: 2.1, waterGain: 1.3 }, pause);
  add(reefB.mesh, 5); reefB.mesh.position.copy(MOON_C).add(new THREE.Vector3(8, -4, 9)); reefB.mesh.scale.setScalar(1.25); reefB.mesh.rotation.set(0.4, 1.1, 0.2);
  const reefDm = reefB.mkMat({ fogK: 1 / 125, glow: 2.3, warm: 0.15 });
  const reefD = add(new THREE.Mesh(reefB.geo, reefDm), 5);
  reefD.position.copy(DAUGHTER_C).add(new THREE.Vector3(17, -10, -8)); reefD.scale.setScalar(2.5); reefD.rotation.set(-0.5, 2.6, 0.9);
  globeU.push([reefB.mat.uniforms.uGlobe.value, MOON_C, MOON_R], [reefDm.uniforms.uGlobe.value, DAUGHTER_C, DAUGHTER_R]);
  await ctx.yield?.();

  // ---- twelve outrigger boats on the Mother's tipped equator ----
  const boatGeo = buildBoatGeo(rng, pal, opts.sail);
  const stripeCol = new THREE.Color(rng.pick([pal[4], pal[4], pal[5], pal[6]])).multiplyScalar(0.85);
  const mkBoatMat = (G, w, R, wb, sc) => new THREE.ShaderMaterial({
    fog: true, vertexColors: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: S.uTime, uSun: S.uSun, uSunCol: S.uSunCol, uSkyZen: S.uSkyZen,
      uSkyMid: S.uSkyMid, uSkyHaze: S.uSkyHaze, uGroundSun: S.uGroundSun, uGroundShade: S.uGroundShade,
      uGC: { value: G }, uBoatW: { value: w }, uR: { value: R }, uWob: { value: wb }, uStripe: { value: stripeCol }, uScale: { value: sc } },
    vertexShader: BOAT_VERT, fragmentShader: BOAT_FRAG,
  });
  const BOAT_SCALE = 3.0;            // 30 m hulls: a boat reads as a boat from the flight line
  const boatMat = mkBoatMat(gc, boatW, MOTHER_R, wobM, BOAT_SCALE);
  const boats = add(new THREE.InstancedMesh(boatGeo, boatMat, NBOAT), 6);
  boatGeo.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(boatPh), 1));
  boats.position.copy(MOTHER_C); boats.count = NB;
  // four more circle the Daughter: the same hull (shared vertex data, their own phases)
  const boatGeoD = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'color', 'aSway']) boatGeoD.setAttribute(k, boatGeo.attributes[k]);
  boatGeoD.setIndex(boatGeo.index); boatGeoD.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(boatPhD), 1));
  const boatsD = add(new THREE.InstancedMesh(boatGeoD, mkBoatMat(gcD, boatWD, DAUGHTER_R, wobD, 0.8), NBD), 6);
  boatsD.position.copy(DAUGHTER_C);
  await ctx.yield?.();

  // ---- the liquid bridge, its eleven beads and their satellite droplets ----
  // radii in metres for 14 m cells: no two neighbours touch. The lens comes up beside the seventh (the largest) with
  // four more strung out beyond it toward the Daughter; the sixth, abeam of the lens then, is a droplet
  const beadR = [5.4, 3.0, 6.3, 2.4, 5.8, 1.4, 0.01, 3.6, 5.0, 2.4, 4.0], BEAD6_R = 8;        // (the seventh is its own clear globe: see below)
  { const k = rng.int(0, 10), fl = rng.chance(0.5), i1 = rng.int(0, 10), i2 = rng.int(0, 10);        // (the same four draws as ever)
    const near = beadR.slice(0, 5); for (let i = 0; i < k % 5; i++) near.push(near.shift()); if (fl) near.reverse();
    for (let i = 0; i < 5; i++) beadR[i] = near[i];
    for (const i of [i1, i2]) if (i > 6) beadR[i] *= 0.93; }
  const brMat = makeWaterMat(S, 'solid', { wob: wobD, abs: 1 / 34, ghost: 0.3, tiMax: 0.8, bodyGain: 1.1, thinTeal: 0.85, spec: 1.3, fres: 0.9, rip: 0.06, vertexShader: BRIDGE_VERT, cut: true });
  Object.assign(brMat.uniforms, { uA: { value: BRIDGE_A }, uB: { value: BRIDGE_B }, uBeadR: { value: beadR }, uThin: { value: 0 }, uBead: { value: 0 }, uRecoil: { value: 0 }, uRecA: { value: 0 } });
  const brAxis = BRIDGE_B.clone().sub(BRIDGE_A), brLen = brAxis.length(); brAxis.normalize();
  const bridge = add(new THREE.Mesh(buildBridgeGeo(272, 24, (BR_X0 - 12 + 8) / (brLen + 16), (brLen - BR_X1 + 12 + 8) / (brLen + 16)), brMat), 4);
  const brLam = (brLen - BR_X0 - BR_X1) / 11;
  const NSAT = 30, satMat = makeWaterMat(S, 'solid', { wob: new THREE.Vector4(0.05, 3.1, 1, 0), abs: 1 / 6, ghost: 0.25, tiMax: 0.42, bodyGain: 1.25, thinTeal: 0.85, rip: 0 });
  const sats = add(new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), satMat, NSAT), 4);
  const satInfo = [];
  for (let i = 0; i < NSAT; i++) {
    const neck = i % 12, ang = rng.range(0, 6.28), off = rng.range(0, 1) ** 2 * 2.2;
    satInfo.push({ neck, x: BR_X0 + neck * brLam + rng.range(-3.2, 3.2), ang, off, r: rng.range(0.35, 1.1) * (i < 12 ? 1.25 : 0.8), drift: rng.range(0.3, 1), ph: rng.range(0, 6.28) });
  }
  const brU = new THREE.Vector3().crossVectors(brAxis, new THREE.Vector3(0, 1, 0)).normalize(), brW = new THREE.Vector3().crossVectors(brU, brAxis);
  const satM = new THREE.Matrix4(), satP = new THREE.Vector3(), satQ = new THREE.Quaternion(), satS = new THREE.Vector3();
  const bulgeM = new THREE.Vector4().copy({ ...BRIDGE_A.clone().sub(MOTHER_C).normalize(), w: 0 });
  const bulgeD = new THREE.Vector4().copy({ ...BRIDGE_B.clone().sub(DAUGHTER_C).normalize(), w: 0 });
  mBack.uniforms.uBulge.value = bulgeM; mFront.uniforms.uBulge.value = bulgeM; dBack.uniforms.uBulge.value = bulgeD; dFront.uniforms.uBulge.value = bulgeD;
  mFront.uniforms.uBulgeK = mBack.uniforms.uBulgeK; dFront.uniforms.uBulgeK = dBack.uniforms.uBulgeK;        // one uniform object per globe
  mBack.uniforms.uBulgeK.value = 260; dBack.uniforms.uBulgeK.value = 26;
  // the bridge is not drawn inside the two globes (world-space centres are refreshed in update)
  const cutA = new THREE.Vector4(0, 0, 0, MOTHER_R), cutB = new THREE.Vector4(0, 0, 0, DAUGHTER_R);
  Object.assign(brMat.uniforms, { uCutA: { value: cutA }, uCutB: { value: cutB }, uCutWobA: { value: wobM }, uCutWobB: { value: wobD },
    uCutBulgeA: { value: bulgeM }, uCutBulgeB: { value: bulgeD }, uCutKA: mBack.uniforms.uBulgeK, uCutKB: dBack.uniforms.uBulgeK });
  // the seventh bead is a globe in its own right (clear water you look into, a school of fish caught in it when the
  // string parted): a shell and a skin that swell out of the thread where the bridge's own seventh cell empties
  const beadC = BRIDGE_A.clone().addScaledVector(brAxis, BR_X0 + 6.5 * brLam);
  const wobB = new THREE.Vector4(0.03, 2.1, rng.range(0, 6.28) * 0 + 1.7, 0);
  const bBackM = makeWaterMat(S, 'back', { wob: wobB, shrink: 0.985, abs: 1 / 30, rip: 0.05, thinTeal: 0.6, near: 1, nearA: 12, nearB: 150, nearTi: 0.5 });
  const bFrontM = makeWaterMat(S, 'front', { wob: wobB, rip: 0.1, near: 1, nearA: 12, nearB: 150 });
  const beadBack = add(new THREE.Mesh(geoLo, bBackM), 2), beadFront = add(new THREE.Mesh(icoGeo(10), bFrontM), 21);
  for (const m of [beadBack, beadFront]) m.position.copy(beadC);
  let beadFishMesh = null, beadReef = null;
  const timing = Object.assign({ thin: [0.60, 0.72], bead: [0.70, 0.765], recoil: [0.74, 0.86] }, opts.timing || {});
  const lin = (a, b, x) => clamp((x - a) / (b - a), 0, 1);
  function updateBridge(u, time) {
    const thin = sstep(timing.thin[0], timing.thin[1], u), bead = lin(timing.bead[0], timing.bead[1], u), rec = lin(timing.recoil[0], timing.recoil[1], u);
    brMat.uniforms.uThin.value = thin; brMat.uniforms.uBead.value = bead;
    brMat.uniforms.uRecoil.value = sstep(0, 0.45, rec);
    // the Mother's end is cut loose first (the beads part from her side) and runs home while the row is still forming
    const recA = sstep(0.18, 0.62, bead); brMat.uniforms.uRecA.value = recA;
    // the recoiling ends run into the globes as bulges that swell, spread and die away
    const sw = Math.sin(Math.PI * Math.min(rec * 1.15, 1)) * (1 - 0.5 * rec), swA = Math.sin(Math.PI * Math.min(recA * 1.15, 1)) * (1 - 0.5 * recA);
    bulgeM.w = 0.012 * swA; mBack.uniforms.uBulgeK.value = lerp(420, 60, recA);
    bulgeD.w = 0.085 * sw; dBack.uniforms.uBulgeK.value = lerp(40, 6, rec);
    for (let i = 0; i < NSAT; i++) {
      const s = satInfo[i], a = cellProg(bead, Math.min(s.neck, 10)), born = sstep(0.5, 0.75, a), age = sstep(0.5, 1, a) + bead;
      const rr = s.off + age * s.drift * 1.6, bob = Math.sin(time * 0.9 + s.ph) * 0.4;
      satP.copy(BRIDGE_A).addScaledVector(brAxis, s.x + bob * 0.5).addScaledVector(brU, Math.cos(s.ang) * rr).addScaledVector(brW, Math.sin(s.ang) * rr + bob);
      satS.setScalar(Math.max(s.r * born, 1e-4)); satM.compose(satP, satQ, satS); sats.setMatrixAt(i, satM);
    }
    sats.instanceMatrix.needsUpdate = true;
    const a6 = cellProg(bead, 6), sc6 = lerp(2.2, BEAD6_R, sstep(0.05, 0.62, a6)) * (1 + 0.012 * Math.sin(time * 2.4 + 1.7) * sstep(0.5, 1, a6));
    beadBack.scale.setScalar(sc6); beadFront.scale.setScalar(sc6); if (beadFishMesh) beadFishMesh.scale.setScalar(sc6 / BEAD6_R); if (beadReef) beadReef.scale.setScalar(sc6 / BEAD6_R);
  }
  updateBridge(0, 0);
  await ctx.yield?.();

  // ---- 900 orange reef fish in the Lantern (never thinned), three bait balls wheeling round the heart ----
  const lanGroups = [];
  for (let g = 0; g < 15; g++) {
    const big = g < 5;
    const inner = g >= 11;
    lanGroups.push({ n: 60, ctr: inner ? [15, 0, 0, 1.5708] : [0, 0, 0, 0], rMin: big ? 14 : inner ? 4 : 6, rMax: big ? 26 : inner ? 9.5 : 15, tilt: rng.range(-0.7, 0.7), node: rng.range(0, 6.28), phase: rng.range(0, 6.28),
      tiltSpread: inner ? 0.2 : 0.07, size: inner ? [0.7, 1.0] : [0.55, 0.85], speed: [1.6, 2.6], school: rng.range(0.5, 1.3) * (inner ? 4.5 : 1) });
  }
  const lanFish = buildFish(rng, S, pal, { groups: lanGroups, water: new THREE.Color(pal[0]).multiplyScalar(0.42).lerp(new THREE.Color(pal[1]).multiplyScalar(0.6), 0.35), fogK: 1 / 46, avoid: 3.6, self: 0.5,
    tintA: new THREE.Color(pal[4]).multiplyScalar(1.1), tintB: new THREE.Color(pal[4]).lerp(new THREE.Color(pal[5]), 0.55) });
  add(lanFish.mesh, 5); lanFish.mesh.position.copy(LANTERN_C);
  await ctx.yield?.();
  const baitGroups = [];
  const baitNode = rng.range(0, 6.28);
  for (let g = 0; g < 3; g++) for (let h = 0; h < 6; h++) {
    baitGroups.push({ n: Math.round(50 * (0.6 + 0.4 * detail)), ctr: [128, 0.35 + g * 0.5, baitNode + g * 2.1, g * 2.09], rMin: 3, rMax: 15, tilt: rng.range(-1.5, 1.5), node: rng.range(0, 6.28), phase: rng.range(0, 6.28),
      tiltSpread: 0.16, size: [2.2, 3.4], speed: [7, 11], school: 0 });
  }
  const bait = buildFish(rng, S, pal, { groups: baitGroups, simple: true, water: new THREE.Color(pal[1]).multiplyScalar(0.4).lerp(new THREE.Color(pal[4]).multiplyScalar(0.5), 0.35), fogK: 1 / 260, ctrW: 0.09,
    tintA: new THREE.Color(0.62, 0.68, 0.72), tintB: new THREE.Color(pal[1]).multiplyScalar(0.75).lerp(new THREE.Color(0.8, 0.82, 0.8), 0.4) });
  add(bait.mesh, 5); bait.mesh.position.copy(MOTHER_C);
  globeU.push([lanFish.mat.uniforms.uGlobe.value, LANTERN_C, LANTERN_R], [bait.mat.uniforms.uGlobe.value, MOTHER_C, MOTHER_R]);
  await ctx.yield?.();
  // ---- living water at every close pass: a turning school in the Moon and in the Daughter, and seven schools of reef
  //      fish along the Mother's eastern flank, 10-30 m inside the skin the lens flies beside ----
  const tA = new THREE.Color(pal[4]).multiplyScalar(1.15), tB = new THREE.Color(pal[4]).lerp(new THREE.Color(pal[5]), 0.6), wFog = new THREE.Color(pal[0]).multiplyScalar(0.5);
  const school = (n, rMin, rMax, size, speed, ctr = [0, 0, 0, 0], spread = 0.07) => ({ n, ctr, rMin, rMax, tilt: rx.range(-0.6, 0.6), node: rx.range(0, 6.28), phase: rx.range(0, 6.28),
    tiltSpread: spread, size, speed, school: rx.range(0.7, 1.5) });
  const moonGroups = [school(70, 22, 31, [1.5, 2.3], [3, 4.5]), school(60, 17, 25, [1.2, 1.9], [2.5, 4]), school(60, 26, 35, [1.4, 2.2], [3, 4.5]), school(50, 13, 19, [1.0, 1.6], [2, 3])];
  const moonFish = buildFish(rx, S, pal, { groups: moonGroups, water: wFog, fogK: 1 / 75, self: 0.4, tintA: tA, tintB: tB });
  add(moonFish.mesh, 5); moonFish.mesh.position.copy(MOON_C); moonFish.mesh.scale.setScalar(MOON_R / 45);
  const dGroups = [school(70, 30, 42, [1.9, 2.9], [3.5, 5]), school(60, 24, 34, [1.6, 2.5], [3, 4.5]), school(60, 36, 47, [1.8, 2.8], [3.5, 5]), school(50, 19, 27, [1.4, 2.1], [2.5, 3.5])];
  const dFish = buildFish(rx, S, pal, { groups: dGroups, water: wFog, fogK: 1 / 100, self: 0.4, tintA: tA, tintB: tB });
  add(dFish.mesh, 5); dFish.mesh.position.copy(DAUGHTER_C);
  await ctx.yield?.();
  // flank schools: centres stand on an arc of the Mother's east side (tilt -0.25 puts the arc under the flight line)
  const flGroups = [];
  for (let g = 0; g < 7; g++) {
    const ph = -0.86 + g * 0.2 + rx.range(-0.04, 0.04);                    // z from about -190 m to +75 m of her centre
    const sc = school(66, 8, 19, [2.8, 4.4], [4, 6.5], [rx.range(204, 222), -0.25 + rx.range(-0.13, 0.1), 0, ph], 0.55);
    flGroups.push(sc);
  }
  const flFish = buildFish(rx, S, pal, { groups: flGroups, water: new THREE.Color(pal[0]).multiplyScalar(0.36).lerp(new THREE.Color(pal[1]).multiplyScalar(0.5), 0.4), fogK: 1 / 150, self: 0.3, ctrW: 0,
    tintA: new THREE.Color(pal[4]).multiplyScalar(1.05), tintB: new THREE.Color(pal[4]).lerp(new THREE.Color(pal[5]), 0.35) });
  add(flFish.mesh, 5); flFish.mesh.position.copy(MOTHER_C);
  globeU.push([moonFish.mat.uniforms.uGlobe.value, MOON_C, MOON_R], [dFish.mat.uniforms.uGlobe.value, DAUGHTER_C, DAUGHTER_R], [flFish.mat.uniforms.uGlobe.value, MOTHER_C, MOTHER_R]);
  { // the school caught in the seventh bead
    const bGroups = [school(26, 4.2, 6.3, [1.5, 2.1], [2.4, 3.4], [0, 0, 0, 0], 0.3), school(18, 3.3, 4.6, [1.1, 1.6], [1.7, 2.5], [0, 0, 0, 0], 0.45)];
    const bFish = buildFish(rx, S, pal, { groups: bGroups, water: wFog, fogK: 1 / 45, self: 0.5, tintA: tA, tintB: tB });
    add(bFish.mesh, 5); bFish.mesh.position.copy(beadC); beadFishMesh = bFish.mesh;
    globeU.push([bFish.mat.uniforms.uGlobe.value, beadC, BEAD6_R]);
    // and a knot of coral carried off with it
    const reefK = await buildReef(rx, noise, S, pal, { rock: 1.7, scale: 0.05, count: 18, rockSeg: 14, warm: 0.05, hue: reefHue + 0.01, fogK: 1 / 45, glow: 2.2, waterGain: 1.3 }, pause);
    add(reefK.mesh, 5); reefK.mesh.position.copy(beadC).add(new THREE.Vector3(0.4, -1.6, 0)); reefK.mesh.rotation.set(0.3, 2.0, -0.2); beadReef = reefK.mesh;
    globeU.push([reefK.mat.uniforms.uGlobe.value, beadC, BEAD6_R]); }
  await ctx.yield?.();

  // ---- Lantern shafts and bubbles; the Mother's shadow and caustic pool on the plain ----
  const lanFx = buildLanternFx(rng, S, pal, S.uSun.value);
  add(lanFx.mesh, 22); lanFx.mesh.position.copy(LANTERN_C);
  let groundFx = null;
  const shadowC = new THREE.Vector3();
  const placeGroundFx = () => {
    const sun = S.uSun.value, k = MOTHER_C.y / Math.max(sun.y, 0.15);
    shadowC.set(MOTHER_C.x - sun.x * k, 0.5, MOTHER_C.z - sun.z * k);
    if (!groundFx) return;
    groundFx.mesh.position.copy(shadowC);
    groundFx.mesh.rotation.set(-Math.PI / 2, 0, Math.atan2(sun.x, -sun.z) + Math.PI, 'YXZ');
    groundFx.mat.uniforms.uStretch.value.z = 1 / Math.max(sun.y, 0.15);
    groundFx.mesh.scale.set(1, 1 / Math.max(sun.y, 0.15) / 1.27, 1);
  };
  if (opts.groundFx !== false) {
    groundFx = buildGroundFx(S, pal); add(groundFx.mesh, 0);
    // the heart's own light falls out of her belly: a wide writhing net straight beneath her, whatever the hour
    const belly = buildGroundFx(S, pal); belly.mat.uniforms.uK.value.set(0.3, 1, opts.bellyGain ?? 1.25, 0.5); belly.mat.uniforms.uStretch.value.z = 1;
    add(belly.mesh, 0.05); belly.mesh.position.set(MOTHER_C.x + 30, 0.7, MOTHER_C.z); belly.mesh.rotation.x = -Math.PI / 2; belly.mesh.scale.set(1.5, 1.5, 1);
  }
  placeGroundFx();

  // ---- anchors (local space) ----
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const exitDir = V3(0.61, 0.052, 0.79).normalize();
  const anchors = {
    motherCentre: MOTHER_C.clone(), motherRadius: MOTHER_R, heartCentre: MOTHER_C.clone(), heartRadius: 100,
    lanternCentre: LANTERN_C.clone(), lanternRadius: LANTERN_R, bommieCentre: BOMMIE_C.clone(),
    daughterCentre: DAUGHTER_C.clone(), daughterRadius: DAUGHTER_R, moonCentre: MOON_C.clone(), moonRadius: MOON_R, boatScale: BOAT_SCALE,
    bridgeA: BRIDGE_A.clone(), bridgeB: BRIDGE_B.clone(),
    // a safe camera line: up the eastern flank (closest 40 m off the skin at point 2), through the Lantern's
    // centre, then along the bridge on its right-hand side (24 m off the axis closing to 16), round the Daughter
    flyThrough: [V3(300, 368, -300), V3(294, 384, -150), V3(288, 396, -20), V3(266, 398, 95), V3(235, 398, 175),
      V3(235, 409, 274), V3(268, 408, 324), V3(298, 406, 370), V3(372, 405, 392), V3(405, 407, 450), V3(455, 411, 505)],
    closestPass: V3(288, 396, -20), lanternEntry: V3(244, 398, 147), lanternExit: V3(235, 400, 205),
    viewpoints: [
      { name: 'reveal', position: V3(300, 345, -500), lookAt: MOTHER_C.clone() },       // the whole Mother, boats on her limb
      { name: 'skin', position: V3(288, 396, -20), lookAt: V3(232, 372, 60) },           // the wall of water, boats passing
      { name: 'beads', position: V3(262, 408, 315), lookAt: V3(240, 411, 325) },         // beside the neck as it parts
      { name: 'belly', position: V3(120, 120, -260), lookAt: V3(-200, 0, 80) },          // caustic pool under her
    ],
    // where the brief hangs the Pearl and the 14 m portal (NOT built here), and the path's final heading
    portalSeat: { position: V3(580, 420, 550), facing: exitDir.clone().negate(), direction: exitDir },
    shadowCentre: shadowC, causticRadius: 150, sunDirection: S.uSun.value,
    boatCircle: { centre: MOTHER_C.clone(), u: gu.clone(), v: gv.clone(), pole: pole.clone(), radius: MOTHER_R, angularSpeed: boatW, phases: boatPh },
  };
  // position of boat i at a given time (local space); lets the world phase a boat past the lens
  let fleetKeyed = false;
  const boatPosition = (i, time, out = new THREE.Vector3()) => {
    const lo = boatPh[i % NBOAT] + (fleetKeyed ? 0 : boatW * time);
    return out.copy(gu).multiplyScalar(Math.cos(lo)).addScaledVector(gv, Math.sin(lo)).multiplyScalar(MOTHER_R).add(MOTHER_C);
  };
  const setBoatOffset = (rad) => {
    const at = boatGeo.attributes.aPh;
    for (let i = 0; i < NBOAT; i++) { boatPh[i] = boatPh0[i] + rad; at.setX(i, boatPh[i]); }
    at.needsUpdate = true;
  };
  const boatPh0 = boatPh.slice();
  // key the whole fleet to a longitude of your own (a function of path u): the clock no longer moves the boats
  const setFleetLongitude = (rad) => {
    if (!fleetKeyed) { fleetKeyed = true; boatMat.uniforms.uBoatW.value = 0; mFront.uniforms.uBoatW.value = 0; }
    setBoatOffset(rad);
  };
  const setSun = (dir) => { S.uSun.value.copy(dir).normalize(); placeGroundFx(); };


  let progress = 0;
  const camL = new THREE.Vector3();
  function update(dt, time, camera) {
    S.uTime.value = time;
    S.uProgress.value = progress;
    if (camera) {
      camera.getWorldPosition(camL); root.worldToLocal(camL);
      const dl = camL.distanceTo(LANTERN_C);
      const inside = 1 - sstep(LANTERN_R * 0.96, LANTERN_R * 1.03, dl);
      lBack.uniforms.uInside.value = inside; lanternFront.visible = inside < 0.5; lanFx.mat.uniforms.uFade.value = inside;
    }
    root.updateWorldMatrix(true, false);
    for (const [v4, c, r] of globeU) { camL.copy(c).applyMatrix4(root.matrixWorld); v4.set(camL.x, camL.y, camL.z, r); }
    camL.copy(MOTHER_C).applyMatrix4(root.matrixWorld); cutA.set(camL.x, camL.y, camL.z, MOTHER_R);
    camL.copy(DAUGHTER_C).applyMatrix4(root.matrixWorld); cutB.set(camL.x, camL.y, camL.z, DAUGHTER_R);
    updateBridge(progress, time);
  }
  return {
    object: root, radius: 300, height: 690, center: MOTHER_C.clone(),
    anchors, update, setProgress(u) { progress = clamp(u, 0, 1); }, setSun, setBoatOffset, setFleetLongitude, boatPosition, dispose() {},
    // the round window seen from inside the Lantern: world direction from her centre to where the lens leaves, and its half angle
    setLanternWindow(dir, halfAngle = 0.45) { lanWin.set(dir.x, dir.y, dir.z, Math.cos(halfAngle)); },
    ground: true, groundY: 0, uniforms: S,
  };
}
