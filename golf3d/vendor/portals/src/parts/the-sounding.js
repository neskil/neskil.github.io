// HERO SET PIECE for "the-sounding": the wreck of a four-funnelled ocean liner, drawn only by sonar.
//
// WHAT IT IS
//   A 270 m liner broken amidships, as a pure line drawing on black. The BOW SECTION (140 m) stands upright with its
//   knife-edge stem 30 m tall at local z = +150: anchors, chains, rusticle curtains, forecastle gear, foremast with
//   shrouds, ratlines and a dangling aerial, bridge with overhanging wings, promenade stanchions, ~700 porthole and
//   window rings, davits and a few surviving boats, staircase dome, funnels 1 and 2 with stays. Its torn aft face
//   (z = +10) shows nine sagging decks over a row of boiler fronts. Across a 55 m debris field (boilers, plates,
//   girders) lies the STERN SECTION (106 m), yawed 13..19 degrees so that its torn forward face looks back at a
//   camera coming down the +X side of the bow section. That face is the finale, drawn as a hull section on a dark
//   bulkhead (faint stipple, so lines carry it): flat keel and double bottom bared by a scour pit, the turn of the
//   bilge, sides leaning in, a ragged top; nine evenly spaced sagging decks (whole below and above, torn back to the
//   lip beside the well) with pillars between them, four web frames closing in on the well, amber colonies along the
//   deck edges, and 13 elliptical frames receding round the open 16 m well (the lost grand staircase) in which the
//   portal hangs. setCut lights outline, decks (outermost first) with the web frames, then the well's frames.
//   Amber colonies (their own rng) also sit in portholes and windows, on rails, foremast shrouds and stem rusticles.
//   Behind it: funnels 3 and 4, mainmast, poop gear, counter stern, rudder and three half-buried propellers.
//   A sediment apron with drifts and scour (contour lines + points) seats both halves (opts.seabed = false drops it).
//
// STYLE (how the look is done, so the world can match it)
//   Nothing is lit. Three self-lit ShaderMaterials share one uniform set (hero.sonar.uniforms) and one GLSL function
//   (exported SONAR_GLSL, `vec3 sonar(vec3 worldPos, float vis, float floorAmt)`):
//     for each of 8 emitters  x = speed*age - distance(worldPos, emitter)        (metres behind the shell)
//       wavefront  = strength * exp(-(x / (band/2))^2)                           -> pale colour * gain.x (HDR ~5)
//       afterglow  = strength * exp(-2.2 * (x/speed) / tail), cut off at ~tail   -> cyan, cooling to deep blue
//     + a constant violet floor (gain.z) that never reaches zero. Hue is range-coded from cameraPosition:
//       cyan inside uRange.x, deep blue at uRange.y, violet beyond.
//   1 LINES: every feature edge is a quad ribbon widened in screen space (world width, never under uMinPx = 1.5 px,
//     dimmed when clamped), additive, depth-tested, pulled 0.3 % toward the eye so it wins over its own surface.
//   2 OCCLUDER: one black depth-writing mesh (hull, decks, houses, funnels, seabed) hides far-side lines. It also
//     carries the "point cloud": hashed dots of constant pixel size, LOD-ed by distance, lit by the same sonar().
//     The seabed part adds height contours of constant pixel width (fwidth), fading to points where they crowd.
//   3 RINGS: portholes / windows as surface quads with an fwidth ring or rectangle that collapses to a dot when
//     small; kind 2 = self-lit amber points (living growth: the only non-sonar light, twinkling).
//   Water between features stays absolute black: use black fog (or none) and a black background.
//
// LOCAL SPACE
//   Origin on the ledge under the hull (y = 0 sediment), +Y up, bow toward +Z. The camera is meant to come in from
//   +Z, pass down the +X (starboard-of-view) side and leave through the stern section's face. The world flies +z,
//   so rotate the hero by PI about Y (anchors are local: transform them with hero.object.matrixWorld).
//   Extents: z -150..+150, x -45..+30, masts to y = 72. radius is reported as 120 for framing.
//
// ANCHORS (local space; THREE.Vector3 unless noted)
//   portalSeat   { position, facing, radius }  centre of the open well in the stern face; facing is level and points
//                back up the approach line. A 14 m portal (radius 7) fits with >= 1.5 m to the nearest steel.
//   flyThrough   ordered points: off the bow low -> up the stem -> along the promenade 9 m off the hull, outboard of
//                the davits and below/outboard of the bridge wing -> sinking past the portholes -> over the break ->
//                straight and almost level for the last 70 m into portalSeat. >= 6 m from all steel (debris < 6 m high).
//   pingOrigins  five points on flyThrough where the sub is when setProgress fires its pings (27, 30, 33, 36, 39 s).
//   viewpoints   { bowLow, promenade, overBreak, sternQuarter, high }: good places to look from.
//   lookAts      { stem, bridge, funnels, cutFace, props }: points worth a gaze poi.
//   bowTip, bridgeWing, foremastTop, breakBow, breakStern, sternPivot, octopusPerch (above the bridge), davitGap.
//
// OPTS
//   palette      7 hex strings in the brief's order (black, navy, violet floor/far, deep blue, cyan, pale front, amber)
//   sonar        a uniforms object from another buildHero/your own material to SHARE emitters with ({uEmit,uEmitB,..})
//   range        [near, far] metres for hue coding (default [100, 300]; the stand-alone demo widens it)
//   seabed       false to drop the sediment apron (default true)      life: false drops the amber points
//   yaw, list    stern section yaw (rad, default per seed 0.23..0.33) and list (rad, default per seed +-0.09)
//   revealSeconds  nominal length of setProgress 0..1 (default 14 = the brief's 26..40 s)
//
// DRIVING IT
//   Left alone (the part viewer) it demos itself: a ping from the camera every 3 s plus a slow secondary emitter,
//   and the cut-face wave on a loop. As soon as the world calls one of these the demo stops for good:
//   setProgress(u)   u 0..1 over the reveal (map the world's path u for 26 s..40 s onto it). Pure function of u:
//                    emitter slots 0..2 fire from pingOrigins at u = 1/14, 4/14, 7/14, 10/14, 13/14 (27..39 s) and the
//                    cut face lights from the hull inward once the third shell arrives, then stays lit round the portal.
//   setEmitter(i, worldPos, age, speed = 150, strength = 1, band = 6, tail = 5)   write emitter slot i (0..7)
//                    directly; age < 0 switches it off. Use it (or share opts.sonar) for the world's own pings.
//   setCut(c)        cut-face wave by hand: -0.2 dark .. 1 reached the well .. >= 1.6 settled.
//   cutEnd           the ring value of the innermost line of the cut face, the last one the wave lights (about 1.57).
//   sonar.uniforms   uGain (front, afterglow, floor), uRange, uMinPx, colours: tune to taste.
//
// COST  ~53k triangles (12k line quads, 700 ring quads, 28k occluder + seabed), 3 draw calls, no lights, no textures,
//       ~160 ms build. Without the seabed: ~27k triangles.
// GATE   sonar.uniforms.uGate (xyz, radius): everything drawn with the hero's materials is dark beyond that sphere, so the
//        world can make the wreck appear only as its first shell reaches it (default radius 1e6 = always visible).
// EXPORTS SHADERS (the six shader strings), makeBuilders() (line / occluder / ring geometry builders), SONAR_GLSL; hero.materials, hero.makeMaterial(vs, fs, extra).
// LIGHT It ignores scene lights. Wants black water, black or no fog, strong bloom (threshold ~0.8, strength ~0.8).
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#02040C', '#071A3A', '#3A2A7A', '#0F4C81', '#19C8E6', '#B8FFF4', '#FFB347'];
const HP = Math.PI / 2, TAU = Math.PI * 2;

// ---------------------------------------------------------------- shared sonar term (fragment)
export const SONAR_GLSL = /* glsl */`
uniform vec4 uEmit[8];    // xyz world position, w speed (m/s)
uniform vec4 uEmitB[8];   // x age (s, <0 off), y strength, z band width (m), w afterglow tail (s)
uniform vec3 uCFront, uCNear, uCDeep, uCFar, uGain;
uniform vec2 uRange;
uniform vec4 uGate;   // xyz centre, w radius: hero surfaces farther than this from the centre stay dark (the reveal shell)
float gate(vec3 wp) { return smoothstep(-9., -3., uGate.w - distance(wp, uGate.xyz)); }
vec3 sonar(vec3 wp, float vis, float fl) {
  float front = 0., fresh = 0., old = 0.;
  for (int i = 0; i < 8; i++) {
    vec4 e = uEmit[i], b = uEmitB[i];
    if (b.x < 0.) continue;
    float x = e.w * b.x - distance(wp, e.xyz);
    float f = x / (b.z * 0.5);
    front += b.y * exp(-f * f);
    float s = max(x, 0.) / e.w;
    float g = step(0., x) * b.y * exp(-s * 2.2 / b.w) * (1. - smoothstep(b.w * 0.8, b.w * 1.15, s));
    fresh += g * exp(-s * 1.3); old += g;
  }
  float rg = distance(wp, cameraPosition);
  float k1 = smoothstep(uRange.x, uRange.y, rg), k2 = smoothstep(uRange.y, uRange.y * 1.7, rg);
  vec3 cn = mix(mix(uCNear, uCDeep, k1 * 0.85), uCFar, k2 * 0.8);
  vec3 cold = mix(uCDeep, uCFar, max(k1 * 0.5, k2));
  return (uCFront * front * uGain.x * mix(1., 0.45, k1) * mix(0.5, 1., smoothstep(4., 28., rg)) + (cn * fresh + cold * (old - fresh) * 0.85) * uGain.y) * vis
       + uCFar * uGain.z * fl;
}
`;

const FOG_OUT = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogF = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    float fogF = smoothstep(fogNear, fogFar, vFogDepth);
  #endif
  col *= 1. - fogF;
#endif
`;

const LINE_VS = /* glsl */`
attribute vec3 aOther; attribute vec4 aA; attribute vec2 aB;
uniform float uTime, uViewH, uMinPx;
varying vec3 vW; varying float vAcross, vHW, vBr, vRing, vDim;
#include <fog_pars_vertex>
vec3 sway(vec3 p, float a) {
  return a * vec3(sin(uTime * 1.05 + p.z * 0.31 + p.y * 0.23), 0.2 * sin(uTime * 1.3 + p.x * 0.4), cos(uTime * 0.85 + p.x * 0.27 + p.y * 0.19));
}
void main() {
  vec3 p0 = position + sway(position, aA.z), p1 = aOther + sway(aOther, aA.w);
  vec4 w0 = modelMatrix * vec4(p0, 1.); vW = w0.xyz;
  vec4 v0 = viewMatrix * w0, v1 = modelViewMatrix * vec4(p1, 1.);
  v0.xyz *= 0.997; v1.xyz *= 0.997;
  float nz = -0.4;
  if (v0.z > nz && v1.z < nz) v0 = mix(v1, v0, (nz - v1.z) / (v0.z - v1.z));
  else if (v1.z > nz && v0.z < nz) v1 = mix(v0, v1, (nz - v0.z) / (v1.z - v0.z));
  vec4 c0 = projectionMatrix * v0, c1 = projectionMatrix * v1;
  float asp = projectionMatrix[1][1] / projectionMatrix[0][0];
  vec2 d = (c1.xy / c1.w - c0.xy / c0.w) * vec2(asp, 1.);
  float dl = length(d); d = dl > 1e-6 ? d / dl : vec2(1., 0.);
  vec2 n = vec2(-d.y, d.x);
  float px = aA.y * projectionMatrix[1][1] * uViewH * 0.5 / max(c0.w, 0.05);
  float hw = min(max(px, uMinPx), 7.) * 0.5;
  vDim = clamp(px / uMinPx, 0.27, 1.);
  float sd = sign(aA.x), g = hw + 1.;
  c0.xy += n * sd * g * (2. / uViewH) * vec2(1. / asp, 1.) * c0.w;
  gl_Position = c0;
  vAcross = sd * g; vHW = hw; vBr = aB.x; vRing = aB.y;
  vec4 mvPosition = v0;
  #include <fog_vertex>
}`;

const LINE_FS = /* glsl */`
uniform float uCut;
varying vec3 vW; varying float vAcross, vHW, vBr, vRing, vDim;
#include <fog_pars_fragment>
${SONAR_GLSL}
void main() {
  float a = clamp(vHW + 1. - abs(vAcross), 0., 1.);
  vec3 col;
  if (vRing >= 0.) {                                  // torn-deck lines: lit by the cut wave, hull inward
    float x = uCut - vRing;
    float band = exp(-x * x * 70.);
    float held = smoothstep(0., 0.05, x) * (0.7 + 0.3 * exp(-x * 2.5));
    col = sonar(vW, vBr * 0.3, 1.) + (uCFront * band * uGain.x * 0.9 + uCNear * held * uGain.y * 1.1) * vBr;
  } else col = sonar(vW, vBr, 1.);
  col = min(col, vec3(1.9)) * a * vDim * gate(vW) * (0.92 + 0.08 * sin(gl_FragCoord.y * 2.0944));
  ${FOG_OUT}
  gl_FragColor = vec4(col, 1.);
}`;

const OCC_VS = /* glsl */`
attribute vec2 aF;
varying vec3 vP, vW, vV; varying vec2 vF;
#include <fog_pars_vertex>
void main() {
  vP = position; vF = aF;
  vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz;
  vec4 mvPosition = viewMatrix * w; vV = mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const OCC_FS = /* glsl */`
varying vec3 vP, vW, vV; varying vec2 vF;
#include <fog_pars_fragment>
${SONAR_GLSL}
vec2 h22(vec2 p) { vec3 q = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); q += dot(q, q.yzx + 33.33); return fract((q.xx + q.yz) * q.zy); }
float dots(vec2 q, float cell, float r) {
  vec2 g = q / cell, id = floor(g), h = h22(id);
  float d = length(fract(g) - (0.12 + 0.76 * h)) * cell;
  return (1. - smoothstep(r * 0.55, r * 1.1, d)) * step(0.35, fract(h.x * 7.3 + h.y * 3.1));
}
void main() {
  vec3 col = vec3(0.);
  float gt = max(gate(vW), step(0.5, vF.y));                      // the sediment is never gated
  if (gt < 0.003) discard;                                        // steel the reveal shell has not reached is not there yet
  if (vF.x > 0.001) {
    vec3 n = abs(normalize(cross(dFdx(vP), dFdy(vP))));
    vec2 q = (n.x > n.y && n.x > n.z) ? vP.zy : ((n.y > n.z) ? vP.xz : vP.xy);
    float dist = length(vV);
    float pxw = max(length(dFdx(vV)), length(dFdy(vV)));          // world size of one pixel here
    float lod = max(0., log2(max(dist, 1.) / 70.)), l0 = floor(lod), lf = lod - l0;
    float r = max(0.04, pxw * 0.72);
    float pts = mix(dots(q, 0.42 * exp2(l0), r), dots(q + 17.3, 0.42 * exp2(l0 + 1.), r), lf);
    float m = pts * 0.5;
    if (vF.y > 0.5) {                                              // seabed: height contours of constant pixel width
      float f = vP.y / 0.45, w = fwidth(f);
      float ln = 1. - smoothstep(0.35, 1.0, abs(fract(f - 0.5) - 0.5) / max(w, 1e-4));
      m = max(m, ln * (1. - smoothstep(0.25, 0.6, w)) * 0.42);
    }
    col = sonar(vW, m * vF.x, 0.) * gt + uCFar * uGain.z * m * vF.x * 0.8 * mix(0.6, 1., gt);
    col *= 0.92 + 0.08 * sin(gl_FragCoord.y * 2.0944);
  }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const RING_VS = /* glsl */`
attribute vec3 aT, aBi, aK; attribute vec2 aUV;
uniform float uTime, uViewH;
varying vec3 vW, vK; varying vec2 vUV; varying float vSc;
#include <fog_pars_vertex>
void main() {
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  float pxw = max(-mvPosition.z, 0.1) * 2. / (projectionMatrix[1][1] * uViewH);
  float r = length(aT), sc = max(1., (aK.x > 1.5 ? 1.5 : 1.7) * pxw / r);
  if (aK.x > 1.5) mvPosition.xy += aUV * r * sc;
  else mvPosition = modelViewMatrix * vec4(position + (aT * aUV.x + aBi * aUV.y) * sc, 1.);
  mvPosition.xyz *= 0.996;
  vW = (modelMatrix * vec4(position, 1.)).xyz; vK = aK; vUV = aUV; vSc = sc;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const RING_FS = /* glsl */`
uniform float uTime; uniform vec3 uCAmber;
varying vec3 vW, vK; varying vec2 vUV; varying float vSc;
#include <fog_pars_fragment>
${SONAR_GLSL}
void main() {
  vec3 col;
  if (vK.x > 1.5) {                                               // living amber point: self-lit, twinkling
    float l = dot(vUV, vUV);
    float tw = 0.55 + 0.45 * sin(uTime * (0.8 + vK.z * 1.7) + vK.z * 40.);
    col = uCAmber * exp(-l * 3.2) * (1. - smoothstep(0.7, 1., l)) * vK.y * (1.2 + 3.2 * tw * tw) / pow(vSc, 0.6);
  } else {
    float l = vK.x < 0.5 ? length(vUV) : max(abs(vUV.x), abs(vUV.y));
    float w = fwidth(l) + 1e-4;
    float ring = 1. - smoothstep(0.07, 0.07 + w, abs(l - 0.85));
    float dotm = 1. - smoothstep(0.15, 1., l);
    float a = mix(ring, dotm / pow(vSc, 0.9), smoothstep(1., 1.5, vSc));
    col = sonar(vW, vK.y, 1.) * a;
  }
  col *= gate(vW) * (0.92 + 0.08 * sin(gl_FragCoord.y * 2.0944));
  ${FOG_OUT}
  gl_FragColor = vec4(col, 1.);
}`;

export const SHADERS = { LINE_VS, LINE_FS, OCC_VS, OCC_FS, RING_VS, RING_FS };

// ---------------------------------------------------------------- geometry builders (all share the transform X)
export function makeBuilders() {
  const X = { m: new THREE.Matrix4(), on: false, ringFn: null };
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const tf = (v) => (X.on ? v.applyMatrix4(X.m) : v);
  // run fn with an extra local matrix (composed with whatever is current)
  const withM = (mat, fn) => { const prev = X.m.clone(), on = X.on; if (on) X.m.multiply(mat); else X.m.copy(mat); X.on = true; fn(); X.m.copy(prev); X.on = on; };

  // --- line ribbons
  const lp = [], lo = [], lA = [], lB = [];
  const L = {
    n: 0,
    seg(ax, ay, az, bx, by, bz, w = 0.1, br = 1, sa = 0, sb = 0) {
      const ring = X.ringFn ? X.ringFn((ax + bx) * 0.5, (ay + by) * 0.5, (az + bz) * 0.5) : -1;
      tf(a.set(ax, ay, az)); tf(b.set(bx, by, bz));
      lp.push(a.x, a.y, a.z, a.x, a.y, a.z, b.x, b.y, b.z, b.x, b.y, b.z);
      lo.push(b.x, b.y, b.z, b.x, b.y, b.z, a.x, a.y, a.z, a.x, a.y, a.z);
      lA.push(1, w, sa, sb, -1, w, sa, sb, -1, w, sb, sa, 1, w, sb, sa);
      lB.push(br, ring, br, ring, br, ring, br, ring);
      L.n++;
    },
    // polyline through a flat [x,y,z,...] array; sway ramps from s0 at the first point to s1 at the last
    pl(p, w = 0.1, br = 1, closed = false, s0 = 0, s1 = 0) {
      const n = p.length / 3, m = closed ? n : n - 1;
      for (let i = 0; i < m; i++) {
        const j = (i + 1) % n, t0 = i / Math.max(1, n - 1), t1 = (i + 1) / Math.max(1, n - 1);
        L.seg(p[i * 3], p[i * 3 + 1], p[i * 3 + 2], p[j * 3], p[j * 3 + 1], p[j * 3 + 2], w, br, lerp(s0, s1, t0), lerp(s0, s1, t1));
      }
    },
    // ellipse / arc in the plane (U, V)
    ring(cx, cy, cz, U, V, ru, rv, n = 16, w = 0.1, br = 1, a0 = 0, a1 = TAU) {
      let px = 0, py = 0, pz = 0;
      for (let i = 0; i <= n; i++) {
        const t = a0 + (a1 - a0) * (i / n), cu = Math.cos(t) * ru, sv = Math.sin(t) * rv;
        const x = cx + U[0] * cu + V[0] * sv, y = cy + U[1] * cu + V[1] * sv, z = cz + U[2] * cu + V[2] * sv;
        if (i > 0) L.seg(px, py, pz, x, y, z, w, br);
        px = x; py = y; pz = z;
      }
    },
    // the 12 edges of an axis-aligned box
    box(x0, y0, z0, x1, y1, z1, w = 0.1, br = 1, bottom = true) {
      const e = (ax, ay, az, bx, by, bz) => L.seg(ax, ay, az, bx, by, bz, w, br);
      e(x0, y1, z0, x1, y1, z0); e(x1, y1, z0, x1, y1, z1); e(x1, y1, z1, x0, y1, z1); e(x0, y1, z1, x0, y1, z0);
      e(x0, y0, z0, x0, y1, z0); e(x1, y0, z0, x1, y1, z0); e(x1, y0, z1, x1, y1, z1); e(x0, y0, z1, x0, y1, z1);
      if (bottom) { e(x0, y0, z0, x1, y0, z0); e(x1, y0, z0, x1, y0, z1); e(x1, y0, z1, x0, y0, z1); e(x0, y0, z1, x0, y0, z0); }
    },
    geometry() {
      const g = new THREE.BufferGeometry(), n = L.n;
      g.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3));
      g.setAttribute('aOther', new THREE.Float32BufferAttribute(lo, 3));
      g.setAttribute('aA', new THREE.Float32BufferAttribute(lA, 4));
      g.setAttribute('aB', new THREE.Float32BufferAttribute(lB, 2));
      const idx = new Uint32Array(n * 6);
      for (let i = 0; i < n; i++) { const k = i * 4, o = i * 6; idx[o] = k; idx[o + 1] = k + 1; idx[o + 2] = k + 2; idx[o + 3] = k + 1; idx[o + 4] = k + 3; idx[o + 5] = k + 2; }
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      return g;
    },
  };

  // --- black occluder (also carries the point cloud); f = (stipple gain, 1 = seabed contours)
  const op = [], of = [], oi = [];
  const O = {
    n: 0,
    v(x, y, z, g = 1, k = 0) { tf(a.set(x, y, z)); op.push(a.x, a.y, a.z); of.push(g, k); return O.n++; },
    quad(i0, i1, i2, i3) { oi.push(i0, i1, i2, i0, i2, i3); },
    // fn(s, t) -> [x, y, z, gain?]
    grid(nu, nv, fn, g = 1, k = 0) {
      const base = O.n;
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const p = fn(i / nu, j / nv); O.v(p[0], p[1], p[2], p[3] ?? g, k); }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const q = base + j * (nu + 1) + i; O.quad(q, q + 1, q + nu + 2, q + nu + 1); }
    },
    box(x0, y0, z0, x1, y1, z1, g = 1) {
      const q = (p) => { const i = O.v(p[0], p[1], p[2], g), j = O.v(p[3], p[4], p[5], g), k = O.v(p[6], p[7], p[8], g), l = O.v(p[9], p[10], p[11], g); O.quad(i, j, k, l); };
      q([x0, y1, z0, x1, y1, z0, x1, y1, z1, x0, y1, z1]); q([x0, y0, z0, x0, y1, z0, x0, y1, z1, x0, y0, z1]);
      q([x1, y0, z0, x1, y1, z0, x1, y1, z1, x1, y0, z1]); q([x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0]);
      q([x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1]);
    },
    geometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(op, 3));
      g.setAttribute('aF', new THREE.Float32BufferAttribute(of, 2));
      g.setIndex(oi);
      return g;
    },
  };

  // --- ring quads: kind 0 round ring, 1 rectangle, 2 amber point. t / bi are the half-axes (length = radius).
  const rp = [], rT = [], rB = [], rK = [], rU = [];
  const R = {
    n: 0,
    add(cx, cy, cz, tx, ty, tz, bx, by, bz, kind = 0, br = 1, ph = 0) {
      a.set(cx, cy, cz); b.set(cx + tx, cy + ty, cz + tz); c.set(cx + bx, cy + by, cz + bz);
      tf(a); tf(b).sub(a); tf(c).sub(a);
      for (let i = 0; i < 4; i++) {
        rp.push(a.x, a.y, a.z); rT.push(b.x, b.y, b.z); rB.push(c.x, c.y, c.z); rK.push(kind, br, ph);
        rU.push(i === 0 || i === 3 ? -1 : 1, i < 2 ? -1 : 1);
      }
      R.n++;
    },
    geometry() {
      const g = new THREE.BufferGeometry(), n = R.n;
      g.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(rT, 3));
      g.setAttribute('aBi', new THREE.Float32BufferAttribute(rB, 3));
      g.setAttribute('aK', new THREE.Float32BufferAttribute(rK, 3));
      g.setAttribute('aUV', new THREE.Float32BufferAttribute(rU, 2));
      const idx = new Uint32Array(n * 6);
      for (let i = 0; i < n; i++) { const k = i * 4, o = i * 6; idx[o] = k; idx[o + 1] = k + 1; idx[o + 2] = k + 2; idx[o + 3] = k; idx[o + 4] = k + 2; idx[o + 5] = k + 3; }
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      return g;
    },
  };
  return { X, L, O, R, withM };
}

// ---------------------------------------------------------------- hull form (ship space: bow +Z, keel buried 3 m)
const KEEL = -3, LS = -120, LEN = 270;
const Z_BOW_CUT = 10, Z_STERN_CUT = -14;                 // where the two halves were torn apart
const SUP_A = -62, SUP_F = 78;                           // superstructure span
const uOf = (z) => (z - LS) / LEN;
const sheer = (u) => 23 + 7 * Math.pow(Math.max(0, (u - 0.52) / 0.48), 2.1) + 2.2 * Math.pow(Math.max(0, (0.28 - u) / 0.28), 2);
const hb = (u, h) => {                                   // half breadth at station u, height fraction h
  const fb = clamp((1 - u) / 0.33, 0, 1), fs = clamp(u / 0.17, 0, 1), sb = Math.sin(fb * HP), ss = Math.sin(fs * HP);
  const deck = Math.pow(sb, 0.6) * Math.pow(1 - (1 - fs) * (1 - fs), 0.5), low = Math.pow(sb, 1.7) * Math.pow(ss, 2.0);
  const tumble = u < 0.44 ? 0.12 * smoothstep(0.4, 1, h) : 0;                              // the stern half's sides lean in a little (tumblehome)
  return 14 * lerp(low, deck, Math.pow(smoothstep(0.1, 1, h), 0.8)) * Math.pow(Math.min(1, 0.45 + h * 4), 0.5) * (1 - tumble);
};
const hz = (u, h) => LS + LEN * u + 16 * Math.pow(1 - h, 1.3) * Math.pow(Math.max(0, 1 - u / 0.2), 2) - 4 * Math.pow(1 - h, 1.5) * Math.pow(Math.max(0, (u - 0.8) / 0.2), 2);
const hy = (u, h) => lerp(KEEL, sheer(u), h);
const DECK_N = 9;                                        // decks seen in the cut: 0..7 in the hull, 8 = promenade
const deckY = (i, u) => (i <= 7 ? lerp(1.4, sheer(u), i / 7) : sheer(u) + 3.1 * (i - 7));
const hOfY = (y, u) => clamp((y - KEEL) / (sheer(u) - KEEL), 0, 1);
// half breadth at a height in metres, including the superstructure tiers above the sheer
const bAtY = (y, u) => { const s = sheer(u); return y <= s ? hb(u, hOfY(y, u)) : hb(u, 1) - (y > s + 3.1 ? 1.0 : 0.25); };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const { X, L, O, R, withM } = makeBuilders();

  // ---- per-seed character
  const yaw = opts.yaw ?? rng.range(0.23, 0.33);
  const list = opts.list ?? rng.range(0.03, 0.09) * rng.sign();
  const pitch = -rng.range(0.006, 0.024);
  const jagSeed = rng.range(0, 50);
  const tornFunnel = rng.chance(0.4) ? 2 : -1;            // funnel 3 may have lost its top over the break
  const funnelLean = [0, 1, 2, 3].map(() => [rng.range(-0.035, 0.035), rng.range(-0.03, 0.03)]);
  const mainmastBroken = rng.chance(0.5);
  const boatMask = Array.from({ length: 16 }, () => rng.chance(0.3));
  const chainSide = rng.sign();
  const rust = rng.range(0.75, 1.25);

  const PIV = new THREE.Vector3(24.2 - Math.tan(yaw) * 63, 0, -45);
  const MS = new THREE.Matrix4().makeTranslation(PIV.x, PIV.y, PIV.z)
    .multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeRotationZ(list))
    .multiply(new THREE.Matrix4().makeRotationX(pitch)).multiply(new THREE.Matrix4().makeTranslation(0, 0, -Z_STERN_CUT));

  // jagged tear: the plating always retreats from the cut plane
  const cutU = (h, side, bow) => {
    const j = Math.abs(noise.n2(h * 5 + jagSeed, side * 3.1 + (bow ? 0 : 9))) * 0.016 + Math.abs(noise.n2(h * 21 + jagSeed, side * 5 + 2)) * 0.007;
    return bow ? uOf(Z_BOW_CUT) + j : uOf(Z_STERN_CUT) - j;
  };
  const P = (u, h, side, off = 0) => [side * (hb(u, h) + off), hy(u, h), hz(u, h)];

  // ================================================================ one half of the ship
  // sec: { bow: bool, z0, z1 } in ship space. Everything below tests `has(z)` before it builds.
  function hullShell(sec) {
    const bow = sec.bow, uEnd = bow ? 1 : 0, nu = bow ? 58 : 46, nv = 12, lenM = bow ? 140 : 106;
    const uu = (s, h, side) => lerp(cutU(h, side, bow), uEnd, s);
    for (const side of [-1, 1]) {
      O.grid(nu, nv, (s, t) => { const h = 0.05 + 0.95 * t, p = P(uu(s, h, side), h, side); p.push(bow ? 1 : lerp(0.4, 1, smoothstep(0.04, 0.34, s))); return p; }, 1);
      // strakes (plate seams) and the sheer line
      const ns = Math.ceil(lenM / 3);
      for (let j = 2; j <= 9; j++) {
        const h = j / 9, top = j === 9;
        let prev = P(uu(0, h, side), h, side, 0.1);
        for (let i = 1; i <= ns; i++) {
          const p = P(uu(i / ns, h, side), h, side, 0.1);
          if (top || rng() > 0.05) L.seg(prev[0], prev[1], prev[2], p[0], p[1], p[2], top ? 0.22 : 0.09, top ? 1.0 : 0.26 + 0.1 * (j % 2));
          prev = p;
        }
      }
      // staggered butt seams
      for (let j = 2; j < 9; j++) {
        const h0 = j / 9, h1 = (j + 1) / 9, nb = Math.floor(lenM / 5.5);
        for (let i = 1; i < nb; i++) {
          const s = (i + (j % 2) * 0.5 + rng.range(-0.1, 0.1)) / nb; if (s > 0.985) continue;
          const p = P(uu(s, h0, side), h0, side, 0.1), q = P(uu(s, h1, side), h1, side, 0.1);
          L.seg(p[0], p[1], p[2], q[0], q[1], q[2], 0.07, 0.2);
        }
      }
      // torn edge: bright, jagged, with hanging plates
      const edge = [];
      for (let k = 0; k <= 30; k++) { const h = 0.09 + 0.91 * (k / 30); edge.push(...P(cutU(h, side, bow), h, side, 0.12)); }
      L.pl(edge, 0.18, 0.8);
      // portholes: three full rows and a sparse fourth
      const rows = [0.5, 0.635, 0.77, 0.9];
      for (let r = 0; r < rows.length; r++) {
        const h = rows[r], n = Math.floor(lenM / 3.05);
        for (let i = 1; i < n; i++) {
          const u = uu((i + 0.5) / n, h, side);
          if (u > 0.975 || u < 0.03) continue;
          if (rng() < (r === 3 ? 0.55 : 0.1) || noise.n2(u * 40, r * 3.7 + side) > 0.55) continue;
          const p = P(u, h, side, 0.14), q = P(u + 0.004, h, side, 0.14), w = P(u, h + 0.03, side, 0.14);
          let tx = q[0] - p[0], ty = q[1] - p[1], tz = q[2] - p[2]; const tl = 0.36 / Math.hypot(tx, ty, tz);
          let bx = w[0] - p[0], by = w[1] - p[1], bz = w[2] - p[2]; const bl = 0.36 / Math.hypot(bx, by, bz);
          R.add(p[0], p[1], p[2], tx * tl, ty * tl, tz * tl, bx * bl, by * bl, bz * bl, 0, 1.25);
        }
      }
    }
    // weather deck cap
    O.grid(nu, 1, (s, t) => { const u = lerp(uOf(bow ? Z_BOW_CUT : Z_STERN_CUT), uEnd, s); return [(t * 2 - 1) * hb(u, 1), sheer(u) - 0.05, hz(u, 1), bow ? 0.8 : lerp(0.3, 0.8, smoothstep(0.04, 0.34, s))]; }, 0.8);
    // deck seams
    for (const side of [-1, 1]) for (let k = 0; k < 6; k++) {
      const x = side * (1.1 + k * 2.3), n = Math.ceil(lenM / 7); let pz = null, py = 0;
      for (let i = 0; i <= n; i++) {
        const u = lerp(uOf(bow ? Z_BOW_CUT : Z_STERN_CUT), uEnd, i / n), z = hz(u, 1), y = sheer(u) + 0.03;
        const ok = Math.abs(x) < hb(u, 1) - 0.6 && (z > SUP_F + 0.5 || z < SUP_A - 0.5);
        if (ok && pz !== null) L.seg(x, py, pz, x, y, z, 0.06, 0.17);
        pz = ok ? z : null; py = y;
      }
    }
    // stem (bow) or sternpost + counter knuckle (stern)
    if (bow) {
      const st = []; for (let k = 0; k <= 8; k++) { const h = 0.1 + 0.9 * (k / 8); st.push(0, hy(1, h), hz(1, h) + 0.15); }
      st.push(0, sheer(1) + 1.2, 150.2);
      L.pl(st, 0.34, 1.5);
    } else {
      const st = []; for (let k = 0; k <= 5; k++) { const h = 0.1 + 0.42 * (k / 5); st.push(0, hy(0, h), hz(0, h) - 0.15); }
      L.pl(st, 0.2, 0.7);
    }
  }

  const useLife = opts.life !== false;
  const life = (x, y, z, s = 1) => { if (useLife) R.add(x, y, z, 0.26 * s, 0, 0, 0, 0.26 * s, 0, 2, rng.range(0.6, 1.2), rng()); };
  const bd = (z) => sheer(uOf(z)) + 6.2;                  // boat deck height
  const xDeck = (z) => hb(uOf(z), 1);

  // a long house following the ship: walls at +-xFn(z) from y0Fn(z) to y1Fn(z), roof, optional end walls,
  // edge lines, window rings and stanchions
  function house(z0, z1, xFn, y0Fn, y1Fn, o = {}) {
    const n = Math.max(1, Math.ceil((z1 - z0) / 6.5)), zt = (s) => lerp(z0, z1, s), gz = (z) => (o.gain ?? 0.9) * (o.gainZ ? o.gainZ(z) : 1);
    for (const side of [-1, 1]) {
      O.grid(n, 1, (s, t) => { const z = zt(s); return [side * xFn(z), lerp(y0Fn(z), y1Fn(z), t), z, gz(z)]; }, o.gain ?? 0.9);
      const top = [], bot = [];
      for (let i = 0; i <= n; i++) { const z = zt(i / n), x = side * (xFn(z) + 0.08); top.push(x, y1Fn(z) + 0.04, z); bot.push(x, y0Fn(z) + 0.04, z); }
      L.pl(top, o.wTop ?? 0.14, o.brTop ?? 0.9);
      if (o.brBot) L.pl(bot, 0.09, o.brBot);
      if (o.posts) {
        const m = Math.floor((z1 - z0) / o.posts);
        for (let i = 0; i <= m; i++) { const z = z0 + (z1 - z0) * (i / m), x = side * (xFn(z) + 0.08); L.seg(x, y0Fn(z), z, x, y1Fn(z), z, 0.09, o.brPost ?? 0.45); }
        if (o.midRail) { const mid = []; for (let i = 0; i <= n; i++) { const z = zt(i / n); mid.push(side * (xFn(z) + 0.08), y0Fn(z) + o.midRail, z); } L.pl(mid, 0.07, 0.32); }
      }
      if (o.win) {
        const m = Math.floor((z1 - z0) / o.win.step);
        for (let i = 0; i < m; i++) {
          if (rng() < (o.win.skip ?? 0.08)) continue;
          const z = z0 + (z1 - z0) * ((i + 0.5) / m);
          const round = o.win.round && i % o.win.round === 0, x = side * (xFn(z) + 0.12), y = y0Fn(z) + o.win.dy;
          if (round) { R.add(x, y + 0.05, z, 0, 0, 0.27, 0, 0.27, 0, 0, o.win.br ?? 0.8); continue; }
          R.add(x, y, z, 0, 0, o.win.w, 0, o.win.h, 0, o.win.kind ?? 1, o.win.br ?? 0.8);
          if (o.win.frame) { L.seg(x, y - o.win.h, z, x, y + o.win.h, z, 0.04, 0.5); L.seg(x, y - o.win.h - 0.12, z - o.win.w - 0.1, x, y - o.win.h - 0.12, z + o.win.w + 0.1, 0.06, 0.55); }
        }
      }
      if (o.seams) { const m = Math.floor((z1 - z0) / o.seams); for (let i = 1; i < m; i++) { const z = z0 + (z1 - z0) * ((i + (rng() - 0.5) * 0.2) / m), x = side * (xFn(z) + 0.08); L.seg(x, y0Fn(z) + 0.05, z, x, y1Fn(z), z, 0.045, 0.15 + 0.1 * rng()); } }
      if (o.waist) { const q = []; for (let i = 0; i <= n; i++) { const z = zt(i / n); q.push(side * (xFn(z) + 0.1), y0Fn(z) + o.waist, z); } L.pl(q, 0.05, 0.3); }
      if (o.doors) {
        const m = Math.floor((z1 - z0) / o.doors);
        for (let i = 0; i < m; i++) {
          if (rng() < 0.3) continue;
          const z = z0 + (z1 - z0) * ((i + 0.5) / m) + 1.2, x = side * (xFn(z) + 0.13), y = y0Fn(z) + 0.12, ajar = rng() < 0.35 ? rng.range(0.25, 0.7) : 0;
          L.pl([x, y, z - 0.42, x, y + 1.75, z - 0.42, x, y + 1.95, z - 0.2, x, y + 1.95, z + 0.2, x, y + 1.75, z + 0.42, x, y, z + 0.42], 0.07, 0.75);
          L.seg(x, y, z - 0.55, x, y, z + 0.55, 0.09, 0.6);
          if (ajar) L.pl([x, y, z + 0.42, x + side * ajar, y, z + 0.42 - 0.84 * (1 - ajar * 0.5), x + side * ajar, y + 1.8, z + 0.42 - 0.84 * (1 - ajar * 0.5), x, y + 1.85, z + 0.42], 0.06, 0.6);
          else { R.add(x, y + 1.35, z, 0, 0, 0.15, 0, 0.15, 0, 0, 0.9); L.seg(x, y + 0.95, z + 0.28, x, y + 1.1, z + 0.28, 0.07, 0.8); }
        }
      }
    }
    O.grid(n, 1, (s, t) => { const z = zt(s); return [(t * 2 - 1) * xFn(z), y1Fn(z), z, gz(z)]; }, o.gain ?? 0.9);
    for (const [flag, z] of [[o.capBack, z0], [o.capFront, z1]]) {
      if (!flag) continue;
      const x = xFn(z), y0 = y0Fn(z), y1 = y1Fn(z);
      O.quad(O.v(-x, y0, z), O.v(x, y0, z), O.v(x, y1, z), O.v(-x, y1, z));
      const zz = z + (z === z1 ? 0.08 : -0.08);
      L.seg(-x, y1, zz, x, y1, zz, 0.14, o.brTop ?? 0.9); L.seg(-x, y0, zz, -x, y1, zz, 0.11, 0.7); L.seg(x, y0, zz, x, y1, zz, 0.11, 0.7);
      if (o.win) { const m = Math.floor((2 * x) / o.win.step); for (let i = 0; i < m; i++) R.add(-x + 2 * x * ((i + 0.5) / m), y0 + o.win.dy, zz, o.win.w, 0, 0, 0, o.win.h, 0, 1, 0.9); }
    }
  }

  // open rail: posts, top rail, mid wire; gaps where it has rotted away; growth on what is left
  function rail(z0, z1, xFn, yFn, zFn = null, step = 0.8, gaps = 0.14) {
    const n = Math.max(2, Math.round(Math.abs(z1 - z0) / step));
    for (const side of [-1, 1]) {
      let px = 0, py = 0, pz = 0, pOk = false;
      for (let i = 0; i <= n; i++) {
        const zz = lerp(z0, z1, i / n), x = side * (xFn(zz) - 0.1), y = yFn(zz), z = zFn ? zFn(zz) : zz;
        const ok = noise.n2(zz * 0.09 + side * 7.7, 3.3 + jagSeed) < 0.5 - gaps;
        if (ok) {
          L.seg(x, y, z, x, y + 1.1, z, 0.06, 0.42);
          if (pOk) { L.seg(px, py + 1.1, pz, x, y + 1.1, z, 0.09, 0.8); L.seg(px, py + 0.55, pz, x, y + 0.55, z, 0.05, 0.28); }
          if (rng() < 0.045) life(x, y + 1.15, z);
          if (rng() < 0.03) whip(x, y + 1.1, z, side);
          else if (rng() < 0.012) sponge(x, y + 1.1, z);
        }
        px = x; py = y; pz = z; pOk = ok;
      }
    }
  }
  // sea whip: a 3-4 m swaying line, tip alive
  function whip(x, y, z, side) {
    const len = rng.range(2.2, 4.4), lx = side * rng.range(0.1, 0.5), lz = rng.range(-0.3, 0.3), p = [];
    for (let k = 0; k <= 4; k++) { const t = k / 4; p.push(x + lx * len * t * t, y + len * t * (1 - 0.15 * t), z + lz * len * t); }
    L.pl(p, 0.06, 0.6, false, 0, 0.95);
  }
  // glass sponge: a little lace vase
  function sponge(x, y, z) {
    const h = rng.range(0.7, 1.3), U = [1, 0, 0], V = [0, 0, 1];
    L.ring(x, y + h, z, U, V, 0.42, 0.42, 7, 0.05, 0.6); L.ring(x, y + h * 0.5, z, U, V, 0.3, 0.3, 7, 0.04, 0.4);
    for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU; L.seg(x + Math.cos(a) * 0.14, y, z + Math.sin(a) * 0.14, x + Math.cos(a) * 0.42, y + h, z + Math.sin(a) * 0.42, 0.04, 0.45); }
  }

  function funnel(zc, idx) {
    const yb = bd(zc) + 2.9, torn = idx === tornFunnel, H = torn ? 19 * rng.range(0.42, 0.6) : 19, rx = 3.1, rz = 3.9;
    const m = new THREE.Matrix4().makeTranslation(0, yb, zc)
      .multiply(new THREE.Matrix4().makeRotationX(-0.165 + funnelLean[idx][0] + (torn ? 0.12 : 0)))
      .multiply(new THREE.Matrix4().makeRotationZ(funnelLean[idx][1] * (torn ? 3 : 1)));
    const U = [1, 0, 0], V = [0, 0, 1];
    const topY = (a) => (torn ? H + 1.9 * noise.n2(Math.cos(a) * 0.9 + idx * 5, Math.sin(a) * 0.9 + jagSeed) + 0.9 * noise.n2(Math.cos(a) * 3.1, Math.sin(a) * 3.1 + jagSeed) : H);
    withM(m, () => {
      O.grid(18, 1, (s, t) => { const a = s * TAU; return [Math.cos(a) * rx, t * topY(a), Math.sin(a) * rz]; }, 0.9);
      L.ring(0, 0.05, 0, U, V, rx + 0.35, rz + 0.35, 22, 0.14, 0.85); L.ring(0, 0.7, 0, U, V, rx + 0.12, rz + 0.12, 22, 0.07, 0.5);
      // painted bands and riveted strakes instead of a lat-long cage: three band rings, four faint seams
      const hTop = torn ? H - 2.4 : H;
      for (const f of [0.2, 0.41, 0.62]) if (f * 19 < hTop) L.ring(0, f * 19, 0, U, V, rx + 0.07, rz + 0.07, 24, f > 0.6 ? 0.11 : 0.08, f > 0.6 ? 0.6 : 0.42);
      for (let k = 0; k < 4; k++) { const a = ((k + 0.5) / 4) * TAU + 0.3, x = Math.cos(a) * (rx + 0.06), z = Math.sin(a) * (rz + 0.06); L.seg(x, 0.7, z, x, Math.min(topY(a), hTop), z, 0.06, 0.2); }
      // ladder up the outboard flank (alternating sides so one always faces the promenade pass)
      { const la = 0.1 + idx * 0.22, n = Math.floor((hTop * 0.78) / 0.85), r0 = 0.12;
        const lp = (da, y) => [Math.cos(la + da) * (rx + r0), y, Math.sin(la + da) * (rz + r0)];
        for (const da of [-0.075, 0.075]) L.seg(...lp(da, 0.4), ...lp(da, n * 0.85 + 0.4), 0.06, 0.6);
        for (let k = 1; k <= n; k++) L.seg(...lp(-0.075, k * 0.85), ...lp(0.075, k * 0.85), 0.045, 0.5); }
      // waste-steam pipe up the after side, cranked over at its head
      if (!torn) L.pl([0, 0, -rz - 0.4, 0, H * 0.86, -rz - 0.4, 0, H * 0.9, -rz - 0.75, 0, H * 0.92, -rz - 1.2], 0.11, 0.7);
      if (torn) {
        const p = []; for (let k = 0; k < 28; k++) { const a = (k / 28) * TAU; p.push(Math.cos(a) * (rx + 0.08), topY(a), Math.sin(a) * (rz + 0.08)); }
        L.pl(p, 0.18, 1.25, true);
        for (let k = 0; k < 5; k++) { const a = rng.range(0, TAU), x = Math.cos(a) * rx, z = Math.sin(a) * rz, y = topY(a); L.pl([x, y, z, x * 1.15, y - 2, z * 1.15, x * 1.2, y - 4.5, z * 1.2], 0.06, 0.5, false, 0, 0.5); }
      } else {
        L.ring(0, H, 0, U, V, rx + 0.1, rz + 0.1, 26, 0.2, 1.3); L.ring(0, H - 0.35, 0, U, V, rx * 0.9, rz * 0.92, 26, 0.1, 0.7);
        L.ring(0, H * 0.79, 0, U, V, rx + 0.1, rz + 0.1, 24, 0.13, 0.9);
        L.ring(0, H * 0.79 + 0.05, 0, U, V, rx + 0.75, rz + 0.75, 24, 0.07, 0.6);
        for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, c = Math.cos(a), sn = Math.sin(a); L.seg(c * (rx + 0.75), H * 0.79 + 0.05, sn * (rz + 0.75), c * (rx + 0.08), H * 0.79 - 0.7, sn * (rz + 0.08), 0.05, 0.4); }
        L.ring(0, H + 0.3, 0, U, V, rx + 0.32, rz + 0.32, 26, 0.09, 0.95); L.ring(0, H + 0.05, 0, U, V, rx * 0.62, rz * 0.66, 18, 0.07, 0.45);
        for (let k = 0; k < 6; k++) { const a = ((k + 0.5) / 6) * TAU; L.seg(Math.cos(a) * rx * 0.62, H + 0.05, Math.sin(a) * rz * 0.66, Math.cos(a) * rx * 0.9, H - 0.35, Math.sin(a) * rz * 0.92, 0.05, 0.4); }
        for (const sx of [-0.55, 0.55]) L.seg(sx, 0, rz + 0.45, sx, H * 0.93, rz + 0.45, 0.1, 0.7);
        L.ring(0, H * 0.6, rz + 0.6, U, [0, 1, 0], 0.5, 0.5, 8, 0.07, 0.8);
        for (let k = 0; k < 8; k++) { const a = ((k + 0.5) / 8) * TAU, c = Math.cos(a), s = Math.sin(a); L.seg(c * rx, H * 0.7, s * rz, c * 7.6, -2.6, s * 10.5, 0.055, 0.42); }
        for (let k = 0; k < 4; k++) if (rng() < 0.6) { const a = rng.range(0, TAU); life(Math.cos(a) * rx, H + 0.1, Math.sin(a) * rz); }
      }
    });
  }

  // mast with shrouds, ratlines, crow's nest, derrick and stays. o: { H, dir (+1 gear forward / -1 aft), nest, broken, stays: [[x,y,z]..] local }
  function mast(zc, o) {
    const yb = sheer(uOf(zc)), H = o.H, top = o.broken ? 0.52 : 1;
    const m = new THREE.Matrix4().makeTranslation(0, yb, zc).multiply(new THREE.Matrix4().makeRotationX(-0.07));
    withM(m, () => {
      L.seg(0, 0, 0, 0, 0.45 * H, 0, 0.62, 1.1);
      if (!o.broken) { L.seg(0, 0.45 * H, 0, 0, 0.8 * H, 0, 0.44, 1.1); L.seg(0, 0.8 * H, 0, 0, H, 0, 0.26, 1.1); L.ring(0, H, 0, [1, 0, 0], [0, 0, 1], 0.3, 0.3, 6, 0.1, 1.2); life(0, H + 0.4, 0, 1.3); } else {
        L.seg(0, 0.45 * H, 0, 0, 0.52 * H, 0, 0.44, 1.1);
        L.pl([0, 0.52 * H, 0, 3, 0.47 * H, -0.2 * H, 5.5, 0.3 * H, -0.36 * H], 0.36, 1.0);     // the toppled upper mast
        for (let k = 0; k < 4; k++) { const t = rng.range(0.2, 1), x = 5.5 * t, y = lerp(0.52, 0.3, t) * H, z = -0.36 * H * t; L.pl([x, y, z, x + 0.3, y - 3, z, x + 0.5, y - 6.5, z + 0.4], 0.055, 0.45, false, 0, 0.6); }
      }
      if (o.nest) {
        const y = 0.4 * H; L.ring(0, y, 0.5, [1, 0, 0], [0, 0, 1], 0.95, 0.95, 12, 0.1, 1.0); L.ring(0, y + 1.3, 0.5, [1, 0, 0], [0, 0, 1], 1.0, 1.0, 12, 0.12, 1.1);
        for (let k = 0; k < 6; k++) { const a = (k / 6) * TAU; L.seg(Math.cos(a) * 0.95, y, 0.5 + Math.sin(a) * 0.95, Math.cos(a), y + 1.3, 0.5 + Math.sin(a), 0.06, 0.6); }
      }
      const ya = 0.62 * H * (o.broken ? 0.8 : 1);
      for (const side of [-1, 1]) {
        const feet = [];
        for (let k = 0; k < 4; k++) { const z = -1.2 - k * 1.9, x = side * (xDeck(zc + z) - 0.35); feet.push([x, 0.1 * z, z]); L.seg(side * 0.25, ya, 0, x, 0.1 * z, z, 0.07, 0.6); }
        for (let y = 2; y < ya - 2; y += 0.95) {
          const t = 1 - y / ya, a = feet[0], b = feet[2];
          L.seg(lerp(side * 0.25, a[0], t), lerp(ya, a[1], t), a[2] * t, lerp(side * 0.25, b[0], t), lerp(ya, b[1], t), b[2] * t, 0.05, 0.3);
        }
        if (rng() < 0.7) life(side * 0.25, ya * rng.range(0.5, 0.95), 0);
      }
      // derrick boom and topping lift
      const bz = 15 * o.dir; L.seg(0, 2.5, 0.4 * o.dir, 0, 8.5, bz, 0.3, 0.8); L.seg(0, 8.5, bz, 0, 0.5 * H * top + 2, 0, 0.055, 0.4); L.pl([0, 8.5, bz, 0.1, 5.5, bz, 0.1, 3.2, bz + 0.2], 0.06, 0.45, false, 0, 0.35);
      for (const s of o.stays || []) L.seg(0, 0.93 * H * top, 0, s[0], s[1], s[2], 0.065, 0.5);
    });
    return new THREE.Vector3(0, yb + H * Math.cos(0.07), zc - H * Math.sin(0.07));
  }

  // one boat station: two quadrant davits swung out, falls, and sometimes the boat still on its chocks
  function boatStation(zc, side, hasBoat) {
    const xe = xDeck(zc) - 1.0, yb = bd(zc);
    for (const dz of [-4.2, 4.2]) {
      const z = zc + dz, s = side;
      L.pl([s * xe, yb, z, s * (xe + 0.05), yb + 1.9, z, s * (xe + 0.5), yb + 3.1, z, s * (xe + 1.4), yb + 3.75, z, s * (xe + 2.3), yb + 3.6, z], 0.2, 1.0);
      L.seg(s * (xe - 1.0), yb, z, s * (xe + 0.05), yb + 1.9, z, 0.12, 0.6);
      L.pl([s * (xe + 2.3), yb + 3.6, z, s * (xe + 2.35), yb + 2.0, z, s * (xe + 2.3), yb + rng.range(-1.5, 0.5), z], 0.055, 0.45, false, 0, 0.3);
    }
    const xc = side * (xe - 2.0), y0 = yb + 0.45;
    if (!hasBoat) { for (const dz of [-2.5, 2.5]) L.seg(xc - 0.9, yb + 0.3, zc + dz, xc + 0.9, yb + 0.3, zc + dz, 0.1, 0.4); return; }
    const gun = (t, s) => [xc + s * 1.3 * Math.pow(Math.sin(Math.PI * t), 0.55), y0 + 1.25 + 0.3 * (2 * t - 1) * (2 * t - 1), zc + (t - 0.5) * 9];
    const keel = (t) => [xc, y0 + 0.9 * Math.pow(2 * t - 1, 4), zc + (t - 0.5) * 8.6];
    for (const s of [-1, 1]) { const p = []; for (let k = 0; k <= 9; k++) p.push(...gun(k / 9, s)); L.pl(p, 0.1, 0.85); }
    { const p = []; for (let k = 0; k <= 8; k++) p.push(...keel(k / 8)); L.pl(p, 0.08, 0.5); }
    for (const t of [0.2, 0.4, 0.6, 0.8]) L.pl([...gun(t, -1), ...keel(t), ...gun(t, 1)], 0.055, 0.4);
  }

  // hanging rust: strands down the plating from the sheer, densest at the bow
  function rusticles(sec) {
    const u0 = sec.bow ? uOf(Z_BOW_CUT) + 0.02 : 0.02, u1 = sec.bow ? 0.999 : uOf(Z_STERN_CUT) - 0.02;
    for (const side of [-1, 1]) {
      let u = u0;
      while (u < u1) {
        const dense = sec.bow ? smoothstep(0.74, 0.86, u) : smoothstep(0.1, 0.02, u) * 0.7;
        u += (lerp(1.5, 0.3, dense) / rust) * rng.range(0.6, 1.4) / LEN;
        if (u >= u1) break;
        const len = rng.range(1, 3) * lerp(1, 2.2, dense) * rust, dh = len / 26, h0 = rng() < 0.75 ? 1 : rng.range(0.55, 0.95);
        const a = P(u, h0, side, 0.22), b = P(u + rng.range(-0.0015, 0.0015), h0 - dh * 0.5, side, 0.28), c = P(u, h0 - dh, side, 0.3);
        L.pl([...a, ...b, ...c], 0.065, rng.range(0.3, 0.6), false, 0, 0.22 + 0.13 * len);
      }
    }
  }

  const sh = (z) => sheer(uOf(z));
  // chain as alternating links (flat / edge-on)
  function chain(p, sw = 0) {
    for (let i = 0; i + 3 < p.length; i += 3) {
      const ax = p[i], ay = p[i + 1], az = p[i + 2], bx = p[i + 3], by = p[i + 4], bz = p[i + 5], n = Math.max(1, Math.round(Math.hypot(bx - ax, by - ay, bz - az) / 0.75));
      for (let k = 0; k < n; k++) { const t0 = (k + 0.08) / n, t1 = (k + 0.92) / n; const m0 = (i / 3 + t0) / (p.length / 3 - 1), m1 = (i / 3 + t1) / (p.length / 3 - 1); L.seg(lerp(ax, bx, t0), lerp(ay, by, t0), lerp(az, bz, t0), lerp(ax, bx, t1), lerp(ay, by, t1), lerp(az, bz, t1), k % 2 ? 0.13 : 0.3, k % 2 ? 0.6 : 1.0, sw * Math.sin(Math.PI * m0), sw * Math.sin(Math.PI * m1)); }
    }
  }
  function crane(x, z, dirZ, s) {
    const y = sh(z); L.seg(x, y, z, x, y + 3.2, z, 0.4, 0.8); L.ring(x, y + 0.1, z, [1, 0, 0], [0, 0, 1], 0.8, 0.8, 8, 0.08, 0.5);
    L.seg(x, y + 2.6, z, x - s * 2.5, y + 6.5, z + dirZ * 7, 0.24, 0.8); L.seg(x, y + 3.2, z, x - s * 2.5, y + 6.5, z + dirZ * 7, 0.05, 0.4);
    L.pl([x - s * 2.5, y + 6.5, z + dirZ * 7, x - s * 2.5, y + 4.4, z + dirZ * 7, x - s * 2.4, y + 2.6, z + dirZ * 7], 0.055, 0.45, false, 0, 0.3);
  }
  function hatch(x0, z0, x1, z1) { const y = sh((z0 + z1) / 2); O.box(x0, y, z0, x1, y + 0.9, z1, 0.8); L.box(x0 - 0.05, y, z0 - 0.05, x1 + 0.05, y + 0.95, z1 + 0.05, 0.1, 0.7, false); L.seg(0, y + 0.97, z0, 0, y + 0.97, z1, 0.06, 0.35); }

  function bowFittings() {
    rail(SUP_F + 0.5, 149.2, xDeck, sh, null, 0.6, 0.1);
    hatch(-2.6, 113, 2.6, 119.5); hatch(-3.1, 90, 3.1, 97.5);
    crane(6.2, 101, -1, 1); crane(-6.2, 101, -1, -1);
    { const y = sh(124); for (const s of [-1, 1]) { L.seg(0, y + 1.1, 127, s * 7.2, y + 1.1, 121.5, 0.12, 0.75); L.seg(0, y, 127, s * 7.2, y, 121.5, 0.07, 0.4); L.seg(s * 7.2, y, 121.5, s * 7.2, y + 1.1, 121.5, 0.08, 0.6); } L.seg(0, y, 127, 0, y + 1.1, 127, 0.08, 0.6); }
    const yw = sh(132);
    L.seg(-2.9, yw + 0.85, 132, 2.9, yw + 0.85, 132, 0.2, 0.8);
    for (const s of [-1, 1]) {
      L.ring(s * 1.7, yw + 0.85, 132, [0, 1, 0], [0, 0, 1], 0.9, 0.9, 12, 0.12, 0.95); L.ring(s * 1.7, yw + 0.85, 132, [0, 1, 0], [0, 0, 1], 0.5, 0.5, 8, 0.07, 0.6);
      for (const zc of [137, 126]) L.ring(s * 4.2, sh(zc) + 0.7, zc, [1, 0, 0], [0, 0, 1], 0.5, 0.5, 8, 0.09, 0.7);
      const uh = 0.9685, hawse = P(uh, 0.84, s, 0.2), yd = sh(141.5);
      chain([s * 1.7, yw + 0.3, 133, s * 2.3, yd + 0.25, 139, s * 2.5, yd + 0.2, 141.3]);
      R.add(hawse[0], hawse[1], hawse[2], 0, 0, 0.85, 0, 0.85, 0, 0, 1.25);
      if (s === chainSide) {     // this anchor was let go: chain down the plating and away over the sediment, anchor at its end
        const ex = s * rng.range(15, 20), ez = rng.range(166, 176);
        chain([hawse[0], hawse[1], hawse[2], s * 5.2, 14, 143.5, s * 7.5, 4, 146, s * 9.5, 0.5, 149], 0.9);
        chain([s * 9.5, 0.5, 149, lerp(s * 9.5, ex, 0.5) + s * 2.5, 0.4, lerp(149, ez, 0.45), ex, 0.45, ez]);
        L.pl([ex, 0.5, ez, ex + s * 1.2, 0.9, ez + 3.6], 0.34, 1.1); L.pl([ex + s * 3.2, 0.5, ez + 2.4, ex + s * 1.2, 0.9, ez + 3.6, ex - s * 0.9, 2.3, ez + 4.4, ex - s * 1.2, 2.6, ez + 2.9], 0.3, 1.1);
      } else {                   // this one still hangs in its hawse pipe
        const q = (du, h) => P(uh + du, h, s, 0.3);
        L.pl([...hawse, ...q(0, 0.775), ...q(0, 0.7)], 0.36, 1.2);
        L.pl([...q(0.0075, 0.765), ...q(0.0065, 0.712), ...q(0, 0.7), ...q(-0.0065, 0.712), ...q(-0.0075, 0.765)], 0.32, 1.2);
      }
    }
    { const y = sh(144); L.seg(0, y, 143.5, 0, y + 4.8, 148.6, 0.3, 0.9); L.seg(0, y + 4.8, 148.6, 0, y + 0.2, 149.6, 0.06, 0.45); L.pl([0, y + 4.8, 148.6, 0, y + 2.6, 148.8, 0.1, y + 1.2, 148.8], 0.06, 0.5, false, 0, 0.25); }
    // foremast, forestay to the stem head, and the aerial that used to run to the mainmast, now hanging over funnel 1
    const yb = sh(104), top = mast(104, { H: 46, dir: 1, nest: true, stays: [[0, sheer(1) + 1 - yb, 44], [-xDeck(84) + 0.4, 0, -20], [xDeck(84) - 0.4, 0, -20]] });
    const f1 = bd(58) + 2.9 + 20.5;
    for (const sx of [-1.1, 1.1]) {
      const p = [];
      for (let k = 0; k <= 8; k++) { const t = k / 8; p.push(lerp(0, sx, t), lerp(top.y, f1, t) - 4.5 * Math.sin(Math.PI * t), lerp(top.z, 60, t)); }
      L.pl(p, 0.055, 0.5, false, 0, 0.25);
      L.pl([sx, f1, 60, sx * 1.2, f1 - 6, 55.5, sx * 1.5, f1 - 13, 53.6, sx * 1.6, f1 - 19, 53.2], 0.055, 0.45, false, 0.25, 0.9);
    }
    // bridge: wheelhouse, wings with overhanging cabs, braces, compass platform
    const yB = bd(73), xw = xDeck(73);
    house(70, 76, () => 5.2, bd, (z) => bd(z) + 3, { brTop: 1.0, brBot: 0.5, capFront: true, capBack: true, win: { step: 1.15, dy: 1.75, w: 0.38, h: 0.5, kind: 1, br: 1.0, skip: 0 } });
    L.box(-1.2, yB + 3, 71.5, 1.2, yB + 4, 74, 0.08, 0.7, false); L.ring(0, yB + 4.6, 72.8, [1, 0, 0], [0, 0, 1], 0.5, 0.5, 8, 0.08, 0.9); L.seg(0, yB + 4, 72.8, 0, yB + 4.6, 72.8, 0.1, 0.8);
    for (const s of [-1, 1]) {
      const xa = Math.min(s * 5.2, s * (xw + 2.4)), xb = Math.max(s * 5.2, s * (xw + 2.4));
      L.box(xa, yB, 71.6, xb, yB + 0.25, 75, 0.11, 0.85); O.box(xa, yB, 71.6, xb, yB + 0.25, 75, 0.8);
      const ca = Math.min(s * (xw + 0.2), s * (xw + 2.4)), cb = Math.max(s * (xw + 0.2), s * (xw + 2.4));
      O.box(ca, yB + 0.25, 71.4, cb, yB + 2.7, 75.2, 0.9);
      { const xo = s * (xw + 2.45), xi = s * (xw + 0.2), y0 = yB + 0.25, yS = yB + 1.25, yH = yB + 2.3, yR = yB + 2.7;
        L.box(Math.min(xo, xi) - 0.3, yR, 71.1, Math.max(xo, xi) + 0.3, yR + 0.14, 75.5, 0.1, 1.0);                   // roof with an eave
        for (const z of [71.4, 75.2]) { L.seg(xo, y0, z, xo, yR, z, 0.11, 0.9); L.seg(xi, y0, z, xi, yR, z, 0.08, 0.6); L.seg(xi, y0, z, xo, y0, z, 0.09, 0.7); L.seg(xi, yS, z, xo, yS, z, 0.06, 0.6); L.seg(xi, yH, z, xo, yH, z, 0.06, 0.6); }
        L.seg(xo, y0, 71.4, xo, y0, 75.2, 0.09, 0.7); L.seg(xo, yS, 71.4, xo, yS, 75.2, 0.07, 0.7); L.seg(xo, yH, 71.4, xo, yH, 75.2, 0.07, 0.7);
        for (let k = 1; k < 5; k++) { const z = 71.4 + 3.8 * (k / 5); L.seg(xo, yS, z, xo, yH, z, 0.06, 0.75); }              // outboard mullions
        for (let k = 1; k < 3; k++) { const x = lerp(xi, xo, k / 3); L.seg(x, yS, 75.2, x, yH, 75.2, 0.06, 0.75); L.seg(x, yS, 71.4, x, yH, 71.4, 0.05, 0.5); }
        for (let k = 0; k < 6; k++) { const z = 71.7 + k * 0.65; L.seg(xo + s * 0.02, y0 + 0.15, z, xo + s * 0.02, yS - 0.12, z, 0.04, 0.22); }  // plank dado
        L.seg((xo + xi) / 2, yR + 0.14, 73.3, (xo + xi) / 2, yR + 0.9, 73.3, 0.09, 0.8); L.ring((xo + xi) / 2, yR + 1.1, 73.3, [1, 0, 0], [0, 1, 0], 0.22, 0.22, 8, 0.06, 1.0); life((xo + xi) / 2, yR + 1.1, 73.3, 0.9);
        const nP = 7; for (let k = 0; k <= nP; k++) { const x = lerp(s * 5.2, xi, k / nP); for (const z of [71.6, 75]) L.seg(x, yB + 0.25, z, x, yB + 1.35, z, 0.05, 0.45); }
        L.seg(s * 5.2, yB + 1.35, 71.6, xi, yB + 1.35, 71.6, 0.08, 0.7); L.seg(s * 5.2, yB + 0.8, 75, xi, yB + 0.8, 75, 0.045, 0.3); }
      L.seg(s * 5.2, yB + 1.35, 75, s * (xw + 0.2), yB + 1.35, 75, 0.08, 0.7);
      for (const z of [72, 74.6]) L.seg(s * (xw + 2.2), yB, z, s * (xw - 0.9), yB - 3.0, z, 0.1, 0.6);
      for (let k = 0; k < 9; k++) { const x = s * (xw - 1 + rng.range(0, 3.2)), z = rng.range(71.8, 74.8), len = rng.range(0.8, 2.6) * rust; L.pl([x, yB, z, x, yB - len * 0.5, z, x, yB - len, z], 0.06, 0.45, false, 0, 0.25); }
    }
    // dome over the grand staircase
    { const y = bd(45) + 2.9, U = [1, 0, 0], V = [0, 0, 1];
      for (const [t, w] of [[0, 0.12], [0.5, 0.07], [0.82, 0.07]]) { const c = Math.sqrt(1 - t * t); L.ring(0, y + t * 2.8, 45, U, V, 4.1 * c, 5.6 * c, 20, w, t ? 0.6 : 0.9); }
      for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, p = []; for (let i = 0; i <= 5; i++) { const e = (i / 5) * HP; p.push(Math.cos(a) * 4.1 * Math.cos(e), y + Math.sin(e) * 2.8, 45 + Math.sin(a) * 5.6 * Math.cos(e)); } L.pl(p, 0.065, 0.7); }
      life(0, y + 3.0, 45, 1.2); }
  }

  function sternFittings() {
    rail(-119.6, SUP_A - 0.5, xDeck, sh, null, 0.6, 0.12);
    hatch(-2.8, -81, 2.8, -75); crane(5.8, -70, -1, 1); crane(-5.8, -70, -1, -1);
    // docking bridge
    { const z = -104, y = sh(z) + 3, x = xDeck(z) + 0.4; L.box(-x, y, z - 1.1, x, y + 0.2, z + 1.1, 0.1, 0.85); O.box(-x, y, z - 1.1, x, y + 0.2, z + 1.1, 0.8);
      for (const s of [-1, 1]) { for (const xx of [x - 0.6, 3]) for (const dz of [-0.9, 0.9]) L.seg(s * xx, y - 3, z + dz, s * xx, y, z + dz, 0.09, 0.55); L.seg(s * x, y + 1.3, z - 1.1, s * x, y + 1.3, z + 1.1, 0.07, 0.6); }
      for (const dz of [-1.1, 1.1]) { L.seg(-x, y + 1.3, z + dz, x, y + 1.3, z + dz, 0.08, 0.7); for (let k = 0; k <= 12; k++) { const xx = lerp(-x, x, k / 12); L.seg(xx, y + 0.2, z + dz, xx, y + 1.3, z + dz, 0.05, 0.4); } }
      L.ring(0, y + 1.2, z, [1, 0, 0], [0, 1, 0], 0.6, 0.6, 10, 0.08, 0.9); }
    for (const s of [-1, 1]) for (const zc of [-92, -112]) L.ring(s * 3.4, sh(zc) + 0.7, zc, [1, 0, 0], [0, 0, 1], 0.5, 0.5, 8, 0.09, 0.7);
    { const y = sh(-118.5); L.seg(0, y, -118.4, 0, y + 7, -121.6, 0.14, 0.8); L.pl([0, y + 7, -121.6, 0.2, y + 5, -122, 0.3, y + 2.6, -122.3], 0.05, 0.4, false, 0, 0.5); }
    const yb = sh(-88);
    mast(-88, { H: 40, dir: -1, nest: false, broken: mainmastBroken, stays: mainmastBroken ? [] : [[0, bd(-63) + 3 - yb, 25], [0, 1, -28]] });
    // rudder and the three propellers, half sunk in the sediment under the counter
    L.pl([0, 0.2, -107.3, 0, 0.2, -112.6, 0, 9.6, -116.2, 0, 10.2, -113.4], 0.2, 1.0); for (const y of [2.5, 5, 7.5]) L.seg(0, y, hz(0, hOfY(y, 0)) - 0.2, 0, y, hz(0, hOfY(y, 0)) - 1.4, 0.16, 0.7);
    for (const [x, y, z, r] of [[0, 2.0, -105.4, 2.5], [4.8, 2.7, -98.5, 3.4], [-4.8, 2.7, -98.5, 3.4]]) {
      const a0 = rng.range(0, TAU);
      L.ring(x, y, z, [1, 0, 0], [0, 1, 0], 0.55, 0.55, 8, 0.12, 1.0); L.seg(x, y, z, x * 0.75, y + 0.4, z + 9, 0.22, 0.7);
      if (x) { L.seg(x, y, z + 1.5, x * 0.55, y + 3.6, z + 2.5, 0.16, 0.6); L.seg(x, y, z + 1.5, x * 0.4, y + 0.8, z + 2.8, 0.16, 0.6); }
      for (let k = 0; k < 3; k++) {
        const a = a0 + (k / 3) * TAU, p = [];
        for (let i = 0; i <= 8; i++) { const t = i / 8, rr = r * Math.sin(Math.PI * t) ** 0.7 * (0.35 + 0.65 * Math.sin(Math.PI * t)), aa = a + (t - 0.5) * 1.1, rad = 0.5 + rr; p.push(x + Math.cos(aa) * rad, y + Math.sin(aa) * rad, z - 0.5 * (t - 0.5)); }
        L.pl(p, 0.14, 1.05, true);
      }
    }
  }

  async function buildSection(sec) {
    hullShell(sec);
    await ctx.yield();
    const z0 = Math.max(SUP_A, sec.z0), z1 = Math.min(SUP_F, sec.z1), caps = { capFront: sec.bow, capBack: !sec.bow, gainZ: sec.bow ? null : (z) => lerp(1, 0.4, smoothstep(-46, -16, z)) };
    house(z0, z1, (z) => xDeck(z) - 0.25, sh, (z) => sh(z) + 3.1, { brTop: 0.55, wTop: 0.1, win: { step: 1.8, dy: 1.75, w: 0.3, h: 0.44, kind: 1, br: 1.1, round: 2, frame: true }, seams: 5.4, waist: 0.9, doors: 16, ...caps });
    house(z0, z1, (z) => xDeck(z) - 1.0, (z) => sh(z) + 3.1, bd, { brTop: 1.0, wTop: 0.18, posts: 2.7, midRail: 1.1, ...caps });
    house(Math.max(z0, -57), Math.min(z1, 69), () => 8.2, bd, (z) => bd(z) + 2.9, { brTop: 0.8, brBot: 0.35, win: { step: 1.6, dy: 1.65, w: 0.26, h: 0.4, kind: 1, br: 0.8, skip: 0.2, round: 3, frame: true }, seams: 4.8, waist: 0.75, doors: 11, ...caps });
    await ctx.yield();
    rail(z0 + 0.6, z1 - 0.6, (z) => xDeck(z) - 0.95, bd, null, 0.6, 0.16);
    const boats = sec.bow ? [60, 50, 40, 30] : [-24, -34, -44, -54];
    boats.forEach((zc, i) => { if (zc > -40 && zc < 0) return; boatStation(zc, 1, boatMask[(sec.bow ? 0 : 8) + i]); boatStation(zc, -1, boatMask[(sec.bow ? 4 : 12) + i]); });
    // hanging rust inside the promenade openings
    for (const side of [-1, 1]) for (let z = z0 + 1; z < z1 - 1; z += rng.range(0.7, 2.2) / rust) { const x = side * (xDeck(z) - 0.9), y = bd(z) - 0.1, len = rng.range(0.4, 2.1); L.pl([x, y, z, x, y - len * 0.5, z, x, y - len, z], 0.055, rng.range(0.25, 0.5), false, 0, 0.16 + 0.14 * len); }
    // cowl ventilators beside the funnels, skylights between them
    for (const zf of sec.bow ? [58, 32] : [-24, -50]) for (const s of [-1, 1]) for (const dz of [-6.2, 6.2]) {
      const x = s * 5.6, z = zf + dz, y = bd(z) + 2.9, hgt = rng.range(1.5, 2.4);
      L.seg(x, y, z, x, y + hgt, z, 0.3, 0.75); L.seg(x, y + hgt, z, x, y + hgt + 0.3, z + 0.45, 0.3, 0.75);
      L.ring(x, y + hgt + 0.35, z + 0.6, [1, 0, 0], [0, 1, 0], 0.55, 0.55, 9, 0.09, 0.95);
    }
    for (const zf of sec.bow ? [20, 66] : [-37]) { const y = bd(zf) + 2.9; L.box(-1.6, y, zf - 2.2, 1.6, y + 0.7, zf + 2.2, 0.08, 0.65, false); L.seg(0, y + 1.1, zf - 2.2, 0, y + 1.1, zf + 2.2, 0.08, 0.65); for (const dz of [-2.2, 0, 2.2]) { L.seg(-1.6, y + 0.7, zf + dz, 0, y + 1.1, zf + dz, 0.06, 0.5); L.seg(1.6, y + 0.7, zf + dz, 0, y + 1.1, zf + dz, 0.06, 0.5); } }
    await ctx.yield();
    if (sec.bow) { funnel(58, 0); funnel(32, 1); await ctx.yield(); bowFittings(); } else { funnel(-24, 2); funnel(-50, 3); await ctx.yield(); sternFittings(); }
    await ctx.yield();
    rusticles(sec);
  }

  // ================================================================ the torn cross-sections
  const WELL = { y: 16.9, rx: 7.9, ry: 8.3 };             // the open staircase well in the stern face (portal seat)
  function ribOutline(z, br, w, inset, nseg) {
    const u = uOf(z), s = sheer(u), xd = hb(u, 1);
    for (const side of [-1, 1]) {
      const p = [];
      for (let k = 0; k <= nseg; k++) { const h = 0.1 + 0.9 * (k / nseg); p.push(side * (hb(u, h) - inset), hy(u, h), z); }
      p.push(side * (xd - 0.25 - inset), s + 3.1, z, side * (xd - 1.0 - inset), s + 3.1, z, side * (xd - 1.0 - inset), s + 6.2 - (inset > 0.5 ? 0.5 : 0), z);
      L.pl(p, w, br);
    }
  }
  function webTicks(z) {
    const u = uOf(z);
    for (const side of [-1, 1]) for (let k = 0; k <= 26; k++) { const h = 0.1 + 0.9 * (k / 26), y = hy(u, h), x = hb(u, h); L.seg(side * (x - 0.25), y, z, side * (x - 1.1), y, z, 0.08, 0.28); }
  }
  const dY = (i, z) => (i < 9 ? deckY(i, uOf(z)) : bd(z));
  // a deck seen edge-on where the hull parted: jagged, sagging, with gaps; `under` adds the plating's lower edge
  function deckAcross(i, z, br, w, sag, gapP, jag = 0, under = false) {
    const y = dY(i, z), b = bAtY(y, uOf(z)) - 0.3, n = jag ? 14 : 6, js = rng.range(0, 90);
    const yy = (t) => y - sag * Math.sin(Math.PI * t) + jag * (noise.n2(t * 9 + js, i * 3.3) + 0.5 * noise.n2(t * 23 + js, i * 1.7));
    for (let k = 0; k < n; k++) {
      if (gapP && rng() < gapP) continue;
      const t0 = k / n, t1 = (k + 1) / n;
      L.seg(lerp(-b, b, t0), yy(t0), z, lerp(-b, b, t1), yy(t1), z, w, br);
      if (under && rng() < 0.75) L.seg(lerp(-b, b, t0), yy(t0) - 0.32, z, lerp(-b, b, t1), yy(t1) - 0.3, z, 0.06, br * 0.45);
    }
  }
  const cable = (x, y, z, len, br = 0.45) => L.pl([x, y, z, x + rng.range(-0.3, 0.3), y - len * 0.5, z, x + rng.range(-0.5, 0.5), y - len, z + rng.range(-0.3, 0.3)], 0.055, br, false, 0, 0.22 + 0.16 * len);
  const girder = (x, y, z, dir) => { const l = rng.range(2, 5.5), dx = rng.range(-0.8, 0.8), dy = rng.range(-2.2, 0.3); L.pl([x, y, z, x + dx * 0.4, y + dy * 0.15, z + dir * l * 0.55, x + dx, y + dy, z + dir * l], 0.16, 0.85); };
  // a plate torn loose and hanging by one edge (sways)
  const flap = (x, y, z, wd, len) => { const sk = rng.range(-0.4, 0.4); L.pl([x, y, z, x + wd, y - 0.1, z, x + wd + sk, y - len, z + 0.3, x + sk * 0.6, y - len * rng.range(0.7, 1.1), z + 0.3], 0.08, 0.7, true, 0, 0.35); };
  // the shell plating at the tear: broken into lengths, with plates peeled outward
  function tornOutline(z, br, w) {
    const u = uOf(z), s = sheer(u), xd = hb(u, 1), n = 22;
    for (const side of [-1, 1]) {
      const pt = (k) => { const h = 0.1 + 0.9 * (k / n), j = 0.22 * noise.n2(k * 0.9 + jagSeed, side * 4.1); return [side * (hb(u, h) - 0.25 + j), hy(u, h), z]; };
      for (let k = 0; k < n; k++) {
        const a = pt(k), b = pt(k + 1);
        if (rng() < 0.13) { if (rng() < 0.7) L.pl([...a, a[0] + side * rng.range(0.8, 2.2), a[1] + rng.range(0.2, 0.9), z + rng.range(0.8, 2.6), ...b], 0.12, br * 0.8); continue; }
        L.seg(a[0], a[1], a[2], b[0], b[1], b[2], w, br * (0.7 + 0.3 * rng()));
      }
      const ln = rng.range(-1.6, 0.5), dp = rng.range(0, 1.3);
      L.pl([side * (xd - 0.25), s, z, side * (xd - 0.3 + ln * 0.4), s + 3.1 - dp * 0.4, z, side * (xd - 1.0 + ln * 0.4), s + 3.0 - dp * 0.4, z, side * (xd - 1.1 + ln), s + 6.1 - dp, z + 0.6], w * 0.7, br * 0.6);
    }
  }

  // The finale: the stern half's torn forward face, drawn as a clean hull section on a dark bulkhead so that lines, not
  // stipple, carry it. Lit by the cut wave in this order (ring value 0 .. 1.7): the shell outline, the nine decks one
  // at a time from the outermost pair inward (with the web frames closing in round the well), then the well's 13 frames.
  let cutEnd = 0;                                           // the largest ring value any line of the face carries
  function sternFace() {
    const zc = Z_STERN_CUT, W = WELL, uc = uOf(zc), z0 = zc - 0.05, sC = sheer(uc);
    let rf = () => 0; X.ringFn = (x, y, z) => { const v = rf(x, y, z); if (v > cutEnd) cutEnd = v; return v; };
    const wellPt = (a) => [Math.cos(a) * W.rx, W.y + Math.sin(a) * W.ry];
    const wellX = (y) => { const d = (y - W.y) / W.ry; return Math.abs(d) < 1 ? W.rx * Math.sqrt(1 - d * d) : 0; };
    const hang = (x, y) => { const len = rng.range(1.3, 2.7), dx = rng.range(-0.7, 0.7); L.pl([x, y, z0 + 0.1, x + dx * 0.35, y - len * 0.55, z0 + 0.3, x + dx, y - len, z0 + 0.5], 0.12, 0.9, false, 0, 0.12); };
    const colony = (x, y, n) => { for (let c = 0; c < n; c++) life(x + rng.range(-0.55, 0.55), y + rng.range(0, 0.5), z0 + 0.2, rng.range(1.1, 1.7)); };
    // nine decks, evenly spaced through the hull, then the promenade and the boat deck
    const FY = [1.4, 5.0, 8.6, 12.2, 15.8, 19.4, sC, sC + 3.1, sC + 6.2], ND = FY.length;
    // the section as seen from the well's centre: how far the steel reaches in each direction
    const NA = 96, topY = FY[ND - 1] - 0.1, inside = (x, y) => y > KEEL + 0.1 && y < topY && Math.abs(x) < bAtY(y, uc) - 0.3;
    const rWell = (th) => 1 / Math.hypot(Math.cos(th) / W.rx, Math.sin(th) / W.ry), rO = [];
    for (let a = 0; a < NA; a++) { const c = Math.cos((a / NA) * TAU), sn = Math.sin((a / NA) * TAU); let r = 6; while (r < 40 && inside(c * (r + 0.2), W.y + sn * (r + 0.2))) r += 0.2; rO.push(r); }
    const ringAt = (x, y) => {                              // 0.12 at the shell .. 0.87 at the well's lip
      const th = Math.atan2(y - W.y, x), k = (Math.round((th / TAU) * NA) + NA) % NA, rw = rWell(th);
      return 0.12 + 0.75 * (1 - clamp((Math.hypot(x, y - W.y) - rw) / Math.max(0.5, rO[k] - rw), 0, 1));
    };
    // 0 a bulkhead just inside the tear: it hides the hull's stippled insides, so the section reads as a drawing
    O.grid(NA, 2, (s, t) => { const k = Math.round(s * NA) % NA, th = (k / NA) * TAU, r = lerp(rWell(th) + 0.05, rO[k] + 0.35, t); return [Math.cos(th) * r, W.y + Math.sin(th) * r, zc - 0.7]; }, 0.08);
    { const y0 = FY[ND - 1] - 0.2, y1 = y0 + 3.1, i0 = O.v(-8.2, y0, zc - 0.7, 0.08), i1 = O.v(8.2, y0, zc - 0.7, 0.08), i2 = O.v(8.2, y1, zc - 0.7, 0.08), i3 = O.v(-8.2, y1, zc - 0.7, 0.08); O.quad(i0, i1, i2, i3); }
    // 1 the shell where it parted: flat keel, the turn of the bilge, sides leaning in, a ragged top
    for (const side of [-1, 1]) {
      const n = 30, p = [0, KEEL + 0.05, z0];
      for (let k = 0; k <= n; k++) { const h = k / n, j = h > 0.3 ? 0.2 * noise.n2(k * 0.9 + jagSeed, side * 4.1) : 0; p.push(side * (hb(uc, h) - 0.2 + j), hy(uc, h), z0); }
      L.pl(p, 0.24, 1.3);
      const xd = hb(uc, 1), ln = rng.range(-1.6, 0.5), dp = rng.range(0, 1.3);
      L.pl([side * (xd - 0.2), sC, z0, side * (xd - 0.3 + ln * 0.4), sC + 3.1 - dp * 0.4, z0, side * (xd - 1.0 + ln * 0.4), sC + 3.0 - dp * 0.4, z0, side * (xd - 1.1 + ln), sC + 6.1 - dp, z0 + 0.6], 0.2, 1.1);
      for (let c = 0; c < 2; c++) {                         // plates peeled outward
        const h = rng.range(0.35, 0.95), x = side * (hb(uc, h) - 0.2), y = hy(uc, h);
        L.pl([x, y, z0, x + side * rng.range(0.8, 2.0), y + rng.range(0.3, 1.0), z0 + rng.range(0.8, 2.4), x, y + rng.range(1.2, 2.2), z0], 0.12, 0.9);
      }
      for (const h of [0.45, 0.85]) girder(side * (hb(uc, h) - 0.3), hy(uc, h), zc, 1);
      // great plates peeled outward and forward off the frames, and bent stanchions above: the tear's ragged
      // silhouette, so the face is never a square
      for (let c = 0; c < 3; c++) {
        const h0 = 0.2 + 0.25 * c + rng.range(0, 0.05), hh = rng.range(0.14, 0.2), wd = rng.range(4, 7), ang = rng.range(0.55, 1.15), dy = rng.range(-1.6, 0.8);
        const xa = side * (hb(uc, h0) - 0.2), ya = hy(uc, h0), xb = side * (hb(uc, h0 + hh) - 0.2), yb = hy(uc, h0 + hh);
        const tp = rng.range(0.45, 1.25), fx = (t, k) => side * wd * t * Math.sin(ang * (0.5 + 0.5 * t)) * (k ? tp : 1), fz = (t) => wd * t * Math.cos(ang * (0.5 + 0.5 * t));
        const q = [xa, ya, z0];
        for (let j = 1; j <= 4; j++) q.push(xa + fx(j / 4, 0), ya + dy * (j / 4) * (j / 4), z0 + fz(j / 4));
        for (let j = 4; j >= 0; j--) q.push(xb + fx(j / 4, 1), yb + dy * 0.7 * (j / 4) * (j / 4), z0 + fz(j / 4));
        L.pl(q, 0.14, 0.95, true);
        for (const t of [0.4, 0.75]) L.seg(xa + fx(t, 0), ya + dy * t * t, z0 + fz(t), xb + fx(t, 1), yb + dy * 0.7 * t * t, z0 + fz(t), 0.07, 0.45);
        if (rng() < 0.7) life(xa + fx(1, 0), ya + dy + 0.3, z0 + fz(1), 1.1);
      }
      for (let c = 0; c < 2; c++) {
        const x = side * (hb(uc, 1) - 1.2 - c * 2.2), y = sC + 6.2, ht = rng.range(3, 6.5), bend = rng.range(0.6, 2.6);
        L.pl([x, y, z0, x + side * 0.25, y + ht * 0.5, z0 + 0.2, x - side * bend * 0.4, y + ht * 0.85, z0 + 0.5, x - side * bend, y + ht, z0 + 0.8], 0.13, 0.85, false, 0, 0.1);
      }
      // the deckhouse above the boat deck: its torn end, leaning, open to the water
      const yb = FY[ND - 1], lean = rng.range(-0.5, 0.3);
      L.pl([side * 8.2, yb, z0, side * (8.2 + lean * 0.4), yb + 1.6, z0, side * (8.0 + lean), yb + 2.9 - rng.range(0, 0.8), z0 + 0.3, side * rng.range(3.5, 6), yb + 2.9 - rng.range(0.2, 1.1), z0 + 0.5], 0.14, 0.8);
    }
    { const yt = KEEL + 1.6, xt = hb(uc, hOfY(yt, uc)) - 0.4;   // double bottom: tank top and its floors
      L.seg(-xt, yt, z0, xt, yt, z0, 0.12, 0.8); for (let x = -xt + 0.9; x < xt; x += 1.9) L.seg(x, KEEL + 0.1, z0, x, yt, z0, 0.08, 0.5); }
    // 2 the nine decks: whole below and above the well, torn back to its lip beside it
    const order = FY.map((y, i) => i).sort((a, b) => Math.abs(FY[b] - W.y) - Math.abs(FY[a] - W.y)), deckAt = [];
    for (let i = 0; i < ND; i++) {
      const y = FY[i], b = bAtY(y, uc) - 0.35, r0 = 0.12 + 0.09 * order.indexOf(i), xw = wellX(y), js = rng.range(0, 90), boat = i === ND - 1;
      rf = (x) => r0 + 0.06 * (1 - Math.min(1, Math.abs(x) / 14));
      if (xw < 3) {                                         // clear of the well: a whole deck, slumped in the middle
        const sag = rng.range(0.5, i > 6 ? 0.9 : 1.3), n = 18;
        const yy = (t) => y - sag * Math.pow(Math.sin(Math.PI * t), 1.4) + 0.14 * noise.n2(t * 9 + js, i * 3.3) * Math.min(1, 6 * t, 6 * (1 - t));
        // the boat deck is the ragged top: broken in two, both ends drooping into the gap
        const dr = (t) => (boat ? (t < 0.5 ? 2.0 * Math.pow(Math.min(1, t / 0.4), 3) : 1.3 * Math.pow(Math.min(1, (1 - t) / 0.36), 3)) : 0);
        for (const [ta, tb] of boat ? [[0, 0.4], [0.64, 1]] : [[0, 1]]) {
          const q = [], q2 = [];
          for (let j = 0; j <= n; j++) { const t = lerp(ta, tb, j / n); q.push(lerp(-b, b, t), yy(t) - dr(t), z0); q2.push(lerp(-b, b, t), yy(t) - dr(t) - 0.34, z0); }
          L.pl(q, 0.17, 1.3); L.pl(q2, 0.06, 0.5);
        }
        deckAt.push((x) => { const t = clamp((x + b) / (2 * b), 0, 1); return boat && t > 0.4 && t < 0.64 ? null : yy(t) - dr(t); });
        for (let c = 0; c < 3; c++) { const t = boat ? [0.39, 0.65, 0.12][c] : (c + rng.range(0.2, 0.8)) / 3; hang(lerp(-b, b, t), yy(t) - dr(t) - 0.3); }
        if (i > 6) { const t = rng.range(0.1, 0.9); if (!boat || t < 0.38 || t > 0.66) flap(lerp(-b, b, t), yy(t) - dr(t) - 0.4, z0 + 0.1, rng.range(0.7, 1.6), rng.range(0.9, 2.0)); }
        for (let c = 0; c < 3; c++) { const t = rng.range(0.05, 0.95); if (boat && t > 0.38 && t < 0.66) continue; colony(lerp(-b, b, t), yy(t) - dr(t) + 0.12, c ? 2 : 3); }
        continue;
      }
      const ends = [];
      for (const side of [-1, 1]) {                         // torn by the well: from the shell in to its lip, sagging to the broken end
        const xe = xw + rng.range(0.25, 0.7), sag = rng.range(0.4, 1.1), n = 8, q = [], q2 = [];
        const yy = (t) => y - sag * Math.pow(t, 1.6) + 0.1 * noise.n2(t * 7 + js + side, i * 2.1) * Math.min(1, t * 4);
        for (let j = 0; j <= n; j++) { const t = j / n, x = lerp(b, xe, t); q.push(side * x, yy(t), z0 + 0.3 * t * t); if (j < n) q2.push(side * x, yy(t) - 0.34, z0); }
        L.pl(q, 0.17, 1.3); L.pl(q2, 0.06, 0.5);
        ends.push([xe, yy]);
        { const t = rng.range(0.3, 0.92); hang(side * lerp(b, xe, t), yy(t) - 0.35); }
        if (rng() < 0.6) cable(side * rng.range(xe + 0.2, b - 0.5), y - 0.35, z0 + 0.1, rng.range(1, 2.4));
        { const t = rng.range(0.08, 0.95); colony(side * lerp(b, xe, t), yy(t) + 0.12, 3); }
        if (rng() < 0.6) { const t = rng.range(0.5, 1); colony(side * lerp(b, xe, t), yy(t) + 0.12, 2); }
      }
      deckAt.push((x) => { const e = ends[x < 0 ? 0 : 1], ax = Math.abs(x); return ax < e[0] ? null : e[1](clamp((b - ax) / (b - e[0]), 0, 1)); });
    }
    // pillars between the decks: the cells of the section
    rf = (x, y) => ringAt(x, y);
    for (let i = 0; i < ND - 1; i++) {
      const b = Math.min(bAtY(FY[i], uc), bAtY(FY[i + 1], uc)) - 0.7;
      for (let x = -b + rng.range(0.6, 1.5); x < b; x += rng.range(2.0, 3.0)) {
        const ya = deckAt[i](x), yb = deckAt[i + 1](x);
        if (ya === null || yb === null || rng() < 0.18) continue;
        L.seg(x, ya, z0, x, yb - 0.34, z0, 0.07, 0.42);
      }
    }
    // web frames between the shell and the well, each a step from the hull's section toward the well's ellipse:
    // the rings of the cut tree, lighting one inside another
    for (const [sv, br] of [[0.8, 1.05], [0.6, 0.95], [0.4, 0.88], [0.2, 0.8]]) {
      rf = () => 0.12 + 0.75 * (1 - sv);
      const p = [];
      for (let a = 0; a < NA; a += 2) { const th = (a / NA) * TAU, rw = rWell(th), r = lerp(rw, rO[a], sv) + 0.1 * noise.n2(a * 0.35 + jagSeed, sv * 9); p.push(Math.cos(th) * r, W.y + Math.sin(th) * r, z0 - 0.3); }
      L.pl(p, 0.14, br, true);
    }
    rf = () => 0.92;
    for (let k = 0; k < 5; k++) cable(rng.range(-6.5, 6.5), FY[ND - 2] - 1.0, z0 + 0.1, rng.range(0.6, 2.0));
    // 3 the well: thirteen frames receding into the hull like the rings of a cut tree, each dimmer than the last
    rf = (x, y, z) => 0.98 + Math.max(0, zc - z) * 0.011;
    const deep = [0, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let k = 0; k <= 12; k++) {
      const d = k * 4.5, z = z0 - d, f = Math.exp(-d / 42), p = [];
      for (let i = 0; i < 36; i++) { const q = wellPt((i / 36) * TAU); p.push(q[0], q[1], z); }
      L.pl(p, k ? 0.13 : 0.18, lerp(1.1, 0.35, k / 12), true);
      if (!k || (k > 3 && k % 3)) continue;
      for (const i of deep) {
        const y = dY(i, z), b = bAtY(y, uOf(z)) - 0.3, xw = wellX(y);
        if (xw < 3) deckAcross(i, z, 0.3 * f, 0.09, 0.25, 0); else for (const side of [-1, 1]) L.seg(side * b, y, z, side * (xw + 0.3), y, z, 0.09, 0.3 * f);
      }
    }
    for (let j = 0; j < 6; j++) {                           // stringers: the tunnel's perspective lines
      const za = z0 - 9 * j, zb = z0 - 9 * (j + 1), f = 0.4 * Math.exp(-(9 * j + 4) / 42);
      for (let k = 0; k < 12; k++) { const q = wellPt(((k + 0.5) / 12) * TAU); L.seg(q[0], q[1], za, q[0], q[1], zb, 0.1, f); }
    }
    X.ringFn = null;
  }

  // living amber for the dark steel: colonies clustered in and round portholes and windows, on the rails, the foremast
  // shrouds and the rusticle curtains at the stem. Their own rng, so nothing else about the wreck moves.
  function colonies(bow, xr) {
    const put = (p, n, s = 1) => { for (let c = 0; c < n; c++) R.add(p[0], p[1] + xr.range(-0.32, 0.32), p[2] + xr.range(-0.5, 0.5), 0.33 * s, 0, 0, 0, 0.33 * s, 0, 2, xr.range(0.9, 1.5), xr()); };
    const u0 = bow ? uOf(16) : 0.07, u1 = bow ? uOf(128) : uOf(Z_STERN_CUT) - 0.025, za = bow ? 14 : SUP_A + 3, zb = bow ? SUP_F - 3 : Z_STERN_CUT - 4;
    for (let k = 0; k < (bow ? 46 : 20); k++) put(P(xr.range(u0, u1), xr.pick([0.5, 0.635, 0.77, 0.9]), k % 2 ? 1 : -1, 0.25), xr.int(3, 5), xr.range(0.8, 1.15));
    for (const side of [-1, 1]) {
      for (let k = 0; k < (bow ? 14 : 7); k++) { const z = xr.range(za, zb); put([side * (xDeck(z) - 0.05), sh(z) + 1.75, z], 3); }
      for (let k = 0; k < (bow ? 12 : 5); k++) { const z = xr.range(za, zb); put([side * (xDeck(z) - 1.05), bd(z) + 1.2, z], 2, 0.85); }
      for (const zc of bow ? [60, 50, 40, 30] : [-44, -54]) for (const dz of [-4.2, 4.2]) if (xr() < 0.75) put([side * (xDeck(zc) + 1.3), bd(zc) + 3.6, zc + dz], 2, 0.9);
      if (!bow) continue;
      const yb = sh(104), ya = 0.62 * 46;
      for (let k = 0; k < 4; k++) { const zf = -1.2 - k * 1.9, xf = side * (xDeck(104 + zf) - 0.35), t = xr.range(0.15, 0.85); put([lerp(side * 0.25, xf, t), yb + ya * (1 - t), 104 + zf * t], 2, 0.9); }
      for (let k = 0; k < 9; k++) put(P(xr.range(0.9, 0.994), xr.range(0.7, 0.98), side, 0.32), 3, 0.9);
    }
  }

  function bowFace() {
    const zc = Z_BOW_CUT + 0.05;
    for (let k = 0; k < 4; k++) {
      const z = zc + k * 5, f = Math.exp(-k * 0.45);
      if (!k) tornOutline(z, 1.1, 0.2); else ribOutline(z, 0.45 * f, 0.11, 0.25, 7);
      for (let i = 0; i <= 9; i++) { if (i === 1) continue; if (k) deckAcross(i, z, 0.45 * f, 0.1, 0.25, 0); else deckAcross(i, z, 1.1, 0.16, rng.range(0.4, 1.3), i < 9 ? 0.14 : 0, 0.25, true); }
    }
    webTicks(zc);
    for (let k = 0; k < 9; k++) { const i = rng.int(2, 8), y = dY(i, zc); flap(rng.range(-0.9, 0.9) * (bAtY(y, uOf(zc)) - 1.5), y - 0.35, zc - 0.15, rng.range(0.7, 1.6), rng.range(0.9, 2.3)); }
    for (let k = 0; k < 28; k++) { const i = rng.int(3, 7), x = rng.range(-12, 12); L.seg(x, dY(i, zc), zc, x, dY(i + 1, zc), zc, 0.08, 0.5); }
    for (let k = 0; k < 26; k++) { const i = rng.int(3, 9); cable(rng.range(-12, 12), dY(i, zc) - 0.3, zc - 0.1, rng.range(0.8, 2.6)); }
    for (let k = 0; k < 14; k++) { const i = rng.int(2, 9), y = dY(i, zc); girder(rng.range(-1, 1) * (bAtY(y, uOf(zc)) - 0.5), y, zc, -1); }
    // boiler fronts: two rows of five
    for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) {
      const x = (k - 2) * 4.9, y = 4.5, z = zc + 2.5 + r * 6.5, br = r ? 0.5 : 1.0, U = [1, 0, 0], V = [0, 1, 0];
      L.ring(x, y, z, U, V, 2.3, 2.3, 20, 0.14, br); L.ring(x, y, z, U, V, 2.0, 2.0, 16, 0.07, br * 0.6);
      for (const dx of [-1.05, 0, 1.05]) L.ring(x + dx, y - 1.0, z - 0.05, U, V, 0.42, 0.42, 7, 0.07, br * 0.9);
      if (!r) for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU; R.add(x + Math.cos(a) * 1.6, y + 0.4 + Math.sin(a) * 1.2, z - 0.06, 0.12, 0, 0, 0, 0.12, 0, 0, 0.7); }
    }
  }

  // ================================================================ debris field between the halves, and the sediment
  const MSi = MS.clone().invert(), tv = new THREE.Vector3();
  const sternLocal = (x, y, z) => tv.set(x, y, z).applyMatrix4(MSi);
  function hullDist(x, z) {                                // rough distance (m) from either hull's footprint
    const d1 = Math.max(Math.abs(x) - xDeck(clamp(z, Z_BOW_CUT, 149)), Z_BOW_CUT - z, z - 150);
    const s = sternLocal(x, 0, z);
    const d2 = Math.max(Math.abs(s.x) - xDeck(clamp(s.z, -119, Z_STERN_CUT)), s.z - Z_STERN_CUT, -120 - s.z);
    return Math.min(d1, d2);
  }
  const bedY = (x, z) => {
    const d = hullDist(x, z), s = sternLocal(x, 0, z);
    const pit = 4.6 * Math.exp(-(Math.pow(s.x / 15, 2) + Math.pow((s.z - Z_STERN_CUT - 5) / 9, 2)));   // scour before the stern face bares the keel
    return -pit + 1.5 * noise.fbm2(x * 0.011 + 3, z * 0.011, 3) + 0.45 * noise.n2(x * 0.045, z * 0.045) - 0.7
      + 1.9 * Math.exp(-Math.pow(Math.max(d, 0) / 7, 2)) - 0.9 * Math.exp(-Math.pow((d - 17) / 8, 2));
  };
  function debris() {
    const spot = (r) => { for (let t = 0; t < 30; t++) { const x = rng.range(-36, 36), z = rng.range(-56, 6); if (hullDist(x, z) > r + 1.5) return [x, bedY(x, z), z]; } return null; };
    const lying = (p, yawA, tilt, fn) => withM(new THREE.Matrix4().makeTranslation(p[0], p[1], p[2]).multiply(new THREE.Matrix4().makeRotationY(yawA)).multiply(new THREE.Matrix4().makeRotationX(tilt)), fn);
    for (let k = 0; k < 5; k++) {                           // boilers that fell out of the break
      const p = spot(4); if (!p) continue;
      lying([p[0], p[1] + rng.range(0.5, 1.3), p[2]], rng.range(0, TAU), rng.range(-0.32, 0.32), () => {
        const U = [1, 0, 0], V = [0, 1, 0], r = 2.3;
        O.grid(14, 1, (a, t) => [Math.cos(a * TAU) * r, Math.sin(a * TAU) * r, lerp(-3, 3, t)], 0.9);
        for (const z of [-3, 3]) { const c = O.v(0, 0, z + Math.sign(z) * 0.5, 0.9); for (let j = 0; j < 14; j++) { const a0 = (j / 14) * TAU, a1 = ((j + 1) / 14) * TAU, i0 = O.v(Math.cos(a0) * r, Math.sin(a0) * r, z, 0.9), i1 = O.v(Math.cos(a1) * r, Math.sin(a1) * r, z, 0.9); O.quad(c, i0, i1, c); } }
        for (const z of [-3, 3]) { const o = Math.sign(z) * 0.06; L.ring(0, 0, z + o, U, V, r, r, 18, 0.14, 0.95); L.ring(0, 0, z + o * 5, U, V, r * 0.8, r * 0.8, 14, 0.06, 0.5);
          for (let j = 0; j < 22; j++) { const a = (j / 22) * TAU; R.add(Math.cos(a) * r * 0.91, Math.sin(a) * r * 0.91, z + o * 3, 0.07, 0, 0, 0, 0.07, 0, 0, 0.85); } }
        for (const z of [-1, 1]) L.ring(0, 0, z, U, V, r + 0.04, r + 0.04, 16, 0.07, 0.4);
        for (const a of [0.9, 2.2, 4.1]) L.seg(Math.cos(a) * (r + 0.04), Math.sin(a) * (r + 0.04), -3, Math.cos(a) * (r + 0.04), Math.sin(a) * (r + 0.04), 3, 0.06, 0.28);
        for (const dx of [-1.15, 0, 1.15]) {                                   // furnace mouths with their doors, one hanging open
          L.ring(dx, -0.8, 3.36, U, V, 0.5, 0.5, 9, 0.08, 0.9); L.ring(dx, -0.8, 3.38, U, V, 0.34, 0.34, 7, 0.05, 0.5);
          L.pl([dx - 0.3, 0.1, 3.36, dx - 0.3, 0.75, 3.36, dx + 0.3, 0.75, 3.36, dx + 0.3, 0.1, 3.36], 0.06, 0.7, true); R.add(dx, 0.42, 3.38, 0.06, 0, 0, 0, 0.06, 0, 0, 0.9);
        }
        L.pl([1.15 + 0.5, -0.8, 3.36, 1.15 + 0.8, -0.8, 3.9, 1.15 + 0.8, -1.4, 3.9], 0.07, 0.7);
        L.seg(0, r, -1.2, 0, r + 1.1, -1.2, 0.2, 0.7); L.ring(0, r + 1.1, -1.2, [1, 0, 0], [0, 0, 1], 0.3, 0.3, 7, 0.07, 0.7);   // steam stop valve
        if (rng() < 0.7) life(rng.range(-1, 1), r * 0.95, rng.range(-2.5, 2.5));
      });
    }
    for (let k = 0; k < 14; k++) {                          // torn plates
      const p = spot(4); if (!p) continue;
      lying([p[0], p[1] + 0.3, p[2]], rng.range(0, TAU), rng.range(-0.3, 0.3), () => {
        const n = rng.int(4, 6), r = rng.range(1.6, 4.2), q = [];
        for (let j = 0; j < n; j++) { const a = (j / n) * TAU + rng.range(-0.3, 0.3), rr = r * rng.range(0.6, 1.1); q.push(Math.cos(a) * rr, rng.range(0, 0.9), Math.sin(a) * rr * 0.7); }
        L.pl(q, 0.1, 0.7, true); L.seg(q[0], q[1], q[2], q[6], q[7], q[8], 0.06, 0.35);
      });
    }
    for (let k = 0; k < 16; k++) {                          // girders and pipes
      const p = spot(5); if (!p) continue;
      lying([p[0], p[1] + 0.2, p[2]], rng.range(0, TAU), rng.range(-0.35, 0.05), () => { const l = rng.range(3, 9); L.seg(0, 0, 0, 0, 0, l, 0.14, 0.7); L.seg(0.35, 0, 0, 0.35, 0, l, 0.08, 0.45); for (let j = 0; j <= 3; j++) L.seg(0, 0, (l * j) / 3, 0.35, 0, (l * j) / 3, 0.06, 0.4); });
    }
    if (tornFunnel >= 0) {                                   // the lost funnel top lies crumpled beside the stern
      const p = spot(6);
      if (p) lying([p[0], p[1] + 2.2, p[2]], rng.range(0, TAU), HP + rng.range(-0.1, 0.1), () => {
        const U = [1, 0, 0], V = [0, 0, 1];
        for (let y = 0; y <= 8; y += 2) L.ring(0, y, 0, U, V, 3.1, 2.2 + (y % 4 ? 0.3 : 0), 20, y === 8 ? 0.18 : 0.08, y === 8 ? 1.1 : 0.45);
        for (let j = 0; j < 10; j++) { const a = (j / 10) * TAU; L.seg(Math.cos(a) * 3.1, 0, Math.sin(a) * 2.2, Math.cos(a) * 3.1, 8, Math.sin(a) * 2.2, 0.07, 0.35); }
      });
    }
  }
  async function seabed() {
    const nx = 88, nz = 152, base = O.n, x0 = -150, x1 = 110, z0 = -226, z1 = 226, gains = [];
    for (let j = 0; j <= nz; j++) {
      for (let i = 0; i <= nx; i++) {
        const x = lerp(x0, x1, i / nx), z = lerp(z0, z1, j / nz), e = Math.hypot((x + 20) / 126, z / 222), g = 1 - smoothstep(0.62, 1, e);
        gains.push(g); O.v(x, bedY(x, z) - 3 * smoothstep(0.7, 1.1, e), z, g * 0.45, 1);
      }
      if ((j & 7) === 7) await ctx.yield();
    }
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 2, d = a + nx + 1;
      if (gains[a] + gains[b] + gains[c] + gains[d] > 0) O.quad(base + a, base + d, base + c, base + b);
    }
  }

  // ================================================================ assemble
  const xrA = makeRng(hashSeed((ctx.seed ?? 0) + ':sounding-amber'));
  await buildSection({ bow: true, z0: Z_BOW_CUT, z1: 150 });
  await ctx.yield();
  bowFace();
  if (useLife) colonies(true, xrA);
  await ctx.yield();
  X.m.copy(MS); X.on = true;                               // the stern half, in its own frame (as withM does, but across yields)
  await buildSection({ bow: false, z0: -120, z1: Z_STERN_CUT });
  await ctx.yield();
  sternFace(); if (useLife) colonies(false, xrA);
  X.m.identity(); X.on = false;
  await ctx.yield();
  debris();
  await ctx.yield();
  if (opts.seabed !== false) await seabed();
  await ctx.yield();

  const S = opts.sonar || {};
  const lin = (c) => new THREE.Vector3(c.r, c.g, c.b);
  const arr = (f) => Array.from({ length: 8 }, f);
  const range = opts.range || [100, 300];
  const uniforms = {
    uEmit: S.uEmit || { value: arr(() => new THREE.Vector4(0, 0, 0, 150)) },
    uEmitB: S.uEmitB || { value: arr(() => new THREE.Vector4(-1, 1, 6, 5)) },
    uCFront: S.uCFront || { value: lin(pal[5]) }, uCNear: S.uCNear || { value: lin(pal[4]) },
    uCDeep: S.uCDeep || { value: lin(pal[3]) }, uCFar: S.uCFar || { value: lin(pal[2]) },
    uGain: S.uGain || { value: new THREE.Vector3(3.4, 2.2, 0.55) },
    uRange: S.uRange || { value: new THREE.Vector2(range[0], range[1]) },
    uGate: S.uGate || { value: new THREE.Vector4(0, 0, 0, 1e6) },
    uTime: { value: 0 }, uViewH: { value: 540 }, uMinPx: { value: 1.5 }, uCut: { value: -0.2 }, uCAmber: { value: lin(pal[6]) },
  };
  const mk = (vs, fs, extra) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...uniforms }, vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide, ...extra });
  const glow = { transparent: true, blending: THREE.AdditiveBlending, depthWrite: false };
  const object = new THREE.Group(); object.name = 'the-sounding-hero';
  const occ = new THREE.Mesh(O.geometry(), mk(OCC_VS, OCC_FS, { polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 2 }));
  await ctx.yield();
  const rings = new THREE.Mesh(R.geometry(), mk(RING_VS, RING_FS, glow));
  await ctx.yield();
  const lines = new THREE.Mesh(L.geometry(), mk(LINE_VS, LINE_FS, glow));
  occ.renderOrder = 0; rings.renderOrder = 1; lines.renderOrder = 2;
  for (const m of [occ, rings, lines]) { m.frustumCulled = false; object.add(m); }
  await ctx.yield();

  // ================================================================ anchors (local space)
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const inStern = (x, y, z) => V(x, y, z).applyMatrix4(MS);
  const seat = inStern(0, WELL.y, Z_STERN_CUT + 1.2), facing = V(Math.sin(yaw), 0, Math.cos(yaw));
  const A = (s, dy = 0) => seat.clone().addScaledVector(facing, s).add(V(0, dy, 0));
  const flyThrough = [V(26, 15, 240), V(16, 14, 196), V(12, 17, 163), V(20, 29, 128), V(23, 28.8, 80), V(22.6, 26.5, 46), A(70, 3.2), A(40, 0.9), A(18, 0), seat.clone()];
  const pingOrigins = [flyThrough[0].clone(), flyThrough[3].clone(), flyThrough[5].clone(), A(40, 0.9), A(16, 0)];
  const anchors = {
    portalSeat: { position: seat, facing, radius: 7 },
    flyThrough, pingOrigins,
    viewpoints: { bowLow: V(10, 6, 186), promenade: V(23, 28.8, 80), overBreak: A(46, 6), sternQuarter: inStern(34, 26, -150), high: V(75, 78, 60) },
    lookAts: { stem: V(0, 18, 150), bridge: V(0, bd(73) + 2, 73), funnels: V(0, bd(45) + 16, 45), cutFace: seat.clone(), props: inStern(0, 3, -102) },
    bowTip: V(0, sheer(1) + 1, 150), bridgeWing: V(xDeck(73) + 2.4, bd(73), 73), foremastTop: V(0, sh(104) + 45.9, 100.8),
    breakBow: V(0, 15, Z_BOW_CUT), breakStern: seat.clone(), sternPivot: PIV.clone(),
    octopusPerch: V(4, bd(73) + 6.5, 73), davitGap: V(xDeck(50) + 1.3, bd(50) + 2, 50),
  };

  // ================================================================ driving
  const T = opts.revealSeconds ?? 14, size = new THREE.Vector2(), camW = new THREE.Vector3(), tmp = new THREE.Vector3();
  const demoBuoy = V(-70, 25, -40), cutDist = pingOrigins[2].distanceTo(seat);
  let driven = !!opts.sonar, cutDriven = false;
  if (!driven) uniforms.uRange.value.set(200, 520);        // the stand-alone viewer orbits 200-300 m out
  const write = (i, p, age, speed, strength, band, tail) => { uniforms.uEmit.value[i].set(p.x, p.y, p.z, speed); uniforms.uEmitB.value[i].set(age, strength, band, tail); };
  const takeOver = () => { if (driven) return; driven = true; for (let i = 0; i < 3; i++) uniforms.uEmitB.value[i].x = -1; uniforms.uRange.value.set(range[0], range[1]); };
  function setEmitter(i, worldPos, age, speed = 150, strength = 1, band = 6, tail = 5) { takeOver(); if (i >= 0 && i < 8) write(i, worldPos, age, speed, strength, band, tail); }
  function setCut(c) { cutDriven = true; uniforms.uCut.value = c; }
  function setProgress(u) {
    takeOver(); cutDriven = true;
    const t = clamp(u, 0, 1) * T;
    object.updateMatrixWorld();
    for (let i = 0; i < 3; i++) uniforms.uEmitB.value[i].x = -1;
    for (let k = 0; k < 5; k++) {
      const age = t - (1 + 3 * k); if (age < 0 || age > 6.4) continue;
      write(k % 3, tmp.copy(pingOrigins[k]).applyMatrix4(object.matrixWorld), age, 150, 1, 6, 5);
    }
    const a3 = t - 7 - cutDist / 150;
    uniforms.uCut.value = a3 > 0 ? Math.min(2, -0.1 + a3 * 0.55) : -0.2;
  }
  if (opts.progress != null) setProgress(opts.progress);

  function update(dt, time, camera) {
    uniforms.uTime.value = time;
    if (ctx.renderer) uniforms.uViewH.value = Math.max(240, ctx.renderer.getDrawingBufferSize(size).y);
    if (!driven) {                                         // self-running demo for the part viewer
      if (camera) camW.setFromMatrixPosition(camera.matrixWorld);
      const a0 = (((time - 1.6) % 3) + 3) % 3;
      write(0, camW, a0, 150, 1, 6, 5); write(1, camW, a0 + 3, 150, 1, 6, 5);
      object.updateMatrixWorld();
      write(2, tmp.copy(demoBuoy).applyMatrix4(object.matrixWorld), (((time + 1) % 5) + 5) % 5, 60, 0.5, 4, 4);
      uniforms.uCut.value = ((((time + 2.5) % 6) + 6) % 6) / 6 * 2.4 - 0.2;
    } else if (!cutDriven) uniforms.uCut.value = 1.6;
  }

  return {
    object, radius: 120, height: 72, center: V(2, 24, 6), anchors,
    update, dispose() {}, ground: false, groundY: 0,
    setProgress, setEmitter, setCut, cutEnd,
    sonar: { uniforms, glsl: SONAR_GLSL },
    // for the world: the three shared materials (build more geometry with makeBuilders() and reuse them) and their factory
    materials: { occluder: occ.material, rings: rings.material, lines: lines.material }, makeMaterial: mk,
    stats: { lineQuads: L.n, ringQuads: R.n, occluderVerts: O.n },
  };
}
