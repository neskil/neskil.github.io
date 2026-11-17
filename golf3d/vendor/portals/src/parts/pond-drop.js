// THE VOLVOX: hero set piece of "pond-drop" (One Drop).
//
// A hollow living globe 130 m across (a Volvox colony at a magnification of ~150,000), built to be
// flown THROUGH, pole to pole. About 2,000 emerald beads sit 5.5 m apart in a near-hexagonal net on
// a sphere of radius 65 m; each bead is a clear glass cell holding a cup of chloroplast and an orange
// eyespot, is joined to its neighbours by fine threads, lies in a faint round sheath compartment, and
// carries two whip flagella on the outside, so the whole shell wears a fur that ripples in travelling
// waves. The colony rolls about its axle (the local Z axis, the line between its two poles) once every
// 24 s, so the two polar openings hold still while the wall of beads wheels round the camera at 17 m/s.
// Seven daughter colonies (complete miniature globes, 14-30 m) hover and counter-rotate inside, the
// big ones carrying a third generation as green dots. The near pole (+Z, the front) is a clean round
// mouth 20 m wide; the far pole (-Z) is a ragged, keyhole-shaped tear with torn threads round it, and
// an eighth daughter is being born through its side lobe.
//
// STYLE (bright-field micrograph; the world coder should match this for every other organism)
//   Nothing is lit. Everything is seen by light coming through it, against a luminous jade field.
//   * Glass = one transparent pass, depthWrite off, depthTest on, CustomBlending with
//     blendSrc = One, blendDst = SrcAlpha:  out = dst * a + rgb.  The fragment computes a per-channel
//     transmittance T (1 = clear), writes a = min(T) and rgb = (T - a) * fieldColour (+ any bright
//     line). Over the even field this equals a true colour multiply, needs no sorting, and lets the
//     same pass add the hair-thin bright line just inside each rim. Body tint is capped near 10 % per
//     layer; the rim is a thin dark-olive band (T ~ 0.3) whose width never drops below ~1.6 px.
//   * Chloroplasts and eyespots = one opaque alpha-tested pass (sphere-impostor quads, depth written)
//     drawn before the glass, saturated emerald with a brightened core, brighter still when the view
//     ray points toward the lamp (uLampLocal), where they exceed 1 and bloom like stained glass.
//   * Focus instead of murk: past uFocus.x metres everything pales toward uHaze and rims widen and
//     fade (uFocus = near, far, max amount). Scene fog (Fog or FogExp2) is honoured in all passes.
//   * Lines (threads, flagella) are view-facing ribbons widened to >= 1.2 px with coverage fading.
//
// SIZE     radius 72 m (shell 65 + flagella ~6), height 144 m. Globe centre = `center` = (0, 72, 0).
//          Axle along local Z: near pole at z = +65 (front), far pole / tear at z = -65.
// COST     ~130k triangles, 5 draw calls (chloroplasts, jelly, threads, flagella, glass), no lights,
//          no textures, ~100 ms build. (+1 draw call if opts.backdrop.)
// LIGHTING None needed: all materials are unlit ShaderMaterials writing linear HDR. They want a
//          bright, even jade backdrop (palette[0], brightest toward the lamp) BEHIND them in every
//          direction; the glass only darkens what is already drawn. Keep bloom threshold ~0.95+ so
//          the field itself does not bloom; lamp-side chloroplasts and rim lines reach 1.2-2.
//
// OPTS     palette    7 hex strings in brief order: field, lamp white, far haze, emerald, olive rim,
//                     azure (unused here), gold (eyespots are pushed from this toward orange)
//          beads      target bead count of the mother shell (default 1800-2200 by seed)
//          lampDir    [x,y,z] local direction TOWARD the lamp (default down, left and ahead)
//          rollPeriod seconds per roll of the mother about the axle (default 24)
//          backdrop   true adds a jade bright-field dome that follows the camera (preview only;
//                     the world should supply its own backdrop). Default false.
//          progress   initial birth progress 0..1 (default 0.45)
//
// ANCHORS  (all in local space)
//   center       Vector3 globe centre (0, 72, 0)
//   axis         (0,0,-1): direction of travel down the axle, near pole -> far pole
//   nearPole     { position, normal(+Z), radius 10 }   the round mouth the camera enters by
//   farPole      { position, normal(-Z), radius 10.5 } centre of the tear the camera leaves by
//   portalSeat   { position, normal(-Z), radius 7 }    just outside the tear on the axle. The brief
//                seats the real portal in the diatom pore beyond; this is where a 14 m portal fits
//                framed by the tear if the world wants it here instead (clear 10 m all round).
//   flyThrough   ordered Vector3s: a safe camera line. Level run-in from z = +190, in at the near
//                pole centre, a shallow arc bowing 9 m to the left (-X) across the interior, out at
//                the tear centre and on to z = -130. Every daughter keeps its surface >= 8 m from
//                this line at all times; the bead wall is >= 8.5 m away at both openings.
//   viewpoints   { reveal, threeQuarter, inside, wall, tearFrame } camera positions; all look at
//                `center` except tearFrame, which looks down the axle at farPole.
//   daughters    [{ center, radius }] rest positions of the seven inner daughters (they drift <= 1 m);
//                largest = the one passed at ~8 m. hero.daughterPosition(i, out) gives live positions.
//   newborn      { center, radius } rest position of the daughter in the tear (it rolls with the wall)
//   lampDir      local direction toward the lamp the shaders are using
//
// HOOKS    hero.setProgress(u)   0..1: the birth. 0 = newborn pressed against the wall inside the
//                                tear lobe, 1 = free, 12 m outside. Drive it from path u so it squeezes
//                                out as the camera crosses the interior. Never wall-clock.
//          hero.setLamp(dirLocal)             re-aim the lamp glow
//          hero.setFocus(near, far, amount)   focus falloff (defaults 120, 520, 0.55)
//          hero.setField(hex, hazeHex)        tell the glass what field colour it sits on
//          hero.uniforms                      shared uniforms for fine tuning
//   Preview: pass opts.backdrop = true for the jade dome.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#E2F8E6', '#F7FFF4', '#A6E0BC', '#1FA862', '#12402E', '#2A84E0', '#D9A93A'];
const TAU = Math.PI * 2;
const NCOL = 10;            // colony slots: 0 mother, 1..7 inner daughters, 8 newborn, 9 spare
const R = 65;               // mother shell radius
const CY = 72;              // globe centre height above the base
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------------ shared GLSL
const GLSL_COLONY = /* glsl */`
  uniform vec3 uColPos[${NCOL}];
  uniform vec4 uColQuat[${NCOL}];
  uniform float uTime;
  uniform float uResY;
  uniform vec3 uFocus;
  vec3 qrot(vec4 q, vec3 v) { return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v); }
  float focusF(float d) { return smoothstep(uFocus.x, uFocus.y, d) * uFocus.z; }
  float pixelSize(float viewZ) { return max(-viewZ, 0.0) * 2.0 / (projectionMatrix[1][1] * uResY); }
`;
const GLSL_FOGF = /* glsl */`
  float fogF() {
    #ifdef USE_FOG
      #ifdef FOG_EXP2
        return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
      #else
        return smoothstep(fogNear, fogFar, vFogDepth);
      #endif
    #else
      return 0.0;
    #endif
  }
`;
// glass output: T = per-channel transmittance, add = bright line. See STYLE in the header.
const GLSL_GLASS_OUT = /* glsl */`
  uniform vec3 uField;
  uniform vec3 uRim;
  uniform vec3 uTint;
  uniform vec3 uLine;
  vec4 glassOut(vec3 T, vec3 add) {
    T = clamp(T, 0.0, 1.0);
    float a = min(T.r, min(T.g, T.b));
    return vec4((T - a) * uField + add, a);
  }
`;

// ------------------------------------------------------------------ beads (impostor quads)
const BEAD_VERT = /* glsl */`
  attribute vec3 iPos;
  attribute vec4 iData;       // colony, radius, seed, kind (0 bead, 1 gonidium, 2 envelope, 3 sheath disc)
  uniform vec3 uLampLocal;
  varying vec2 vQ;
  varying vec3 vN;
  varying vec4 vD;            // seed, kind, focus, lamp glow
  varying float vFace;
  #include <fog_pars_vertex>
  ${GLSL_COLONY}
  void main() {
    int ci = int(iData.x + 0.5);
    float kind = iData.w;
    vec3 lp = qrot(uColQuat[ci], iPos);
    vec3 nl = normalize(lp + vec3(1e-4, 2e-4, 3e-4));
    float sd = iData.z;
    vec3 wp = uColPos[ci] + lp;
    if (kind < 1.5) wp += iData.y * 0.07 * vec3(sin(uTime * 3.1 + sd * 50.0), sin(uTime * 2.6 + sd * 91.0), sin(uTime * 3.7 + sd * 13.0));
    vec4 mvPosition = modelViewMatrix * vec4(wp, 1.0);
    float sc = length(modelViewMatrix[0].xyz);
    vec3 nv = normalize(mat3(modelViewMatrix) * nl);
    vec3 ray = normalize(mvPosition.xyz - vec3(0.0, 0.0, 1e-4));
    vFace = 1.0;
    vQ = position.xy * 1.06;
    if (kind > 2.5) {
      vec3 t1 = normalize(cross(nl, vec3(0.31, 0.55, 0.77)) + vec3(1e-5, 0.0, 0.0));
      vec3 t2 = cross(nl, t1);
      mvPosition = modelViewMatrix * vec4(wp + (t1 * position.x + t2 * position.y) * iData.y, 1.0);
      vFace = abs(dot(nv, ray));
      vQ = position.xy;
    } else {
      mvPosition.xy += position.xy * iData.y * sc * 1.06;
    }
    vN = nv;
    vec3 lampV = normalize(mat3(modelViewMatrix) * uLampLocal);
    float glow = max(dot(ray, lampV), 0.0);
    vD = vec4(sd, kind, focusF(length(mvPosition.xyz)), glow * glow * glow);
    gl_Position = projectionMatrix * mvPosition;
    #ifdef OPAQUE_PASS
      if (kind > 1.5) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    #endif
    #include <fog_vertex>
  }
`;
const BEAD_OPAQUE_FRAG = /* glsl */`
  uniform vec3 uEmerald;
  uniform vec3 uEmeraldHi;
  uniform vec3 uEye;
  uniform vec3 uHaze;
  varying vec2 vQ;
  varying vec3 vN;
  varying vec4 vD;
  varying float vFace;
  #include <fog_pars_fragment>
  void main() {
    vec2 q = vQ;
    float r2 = dot(q, q);
    if (r2 > 1.0) discard;
    float kind = vD.y;
    vec3 n = normalize(vN + vec3(0.0, 0.0, 1e-4));
    // chord of the view ray through the chloroplast: a cup (a ball with a smaller ball scooped out
    // of its outer side), so it reads as a ring from outside, a disc from inside, a crescent side-on
    float ri = kind > 0.5 ? 0.93 : 0.86;
    float hi2 = ri * ri - r2;
    float thick = 0.0;
    if (hi2 > 0.0) {
      float hi = sqrt(hi2);
      thick = 2.0 * hi;
      if (kind < 0.5) {
        vec3 c = n * 0.44;
        vec2 hq = q - c.xy;
        float hs2 = 0.62 * 0.62 - dot(hq, hq);
        if (hs2 > 0.0) { float hs = sqrt(hs2); thick -= max(min(hi, c.z + hs) - max(-hi, c.z - hs), 0.0); }
      }
    }
    float dens = 1.0 - exp(-max(thick, 0.0) * 2.4);
    float eye = 0.0;
    if (kind < 0.5) {
      vec3 e = normalize(n + vec3(cos(vD.x * 40.0), sin(vD.x * 40.0), 0.3) * 0.55);
      eye = 1.0 - smoothstep(0.13, 0.2, length(q - e.xy * 0.74));
    }
    if (dens < 0.25 && eye < 0.5) discard;
    vec3 col = mix(uEmeraldHi, uEmerald, smoothstep(0.25, 0.85, dens));
    float core = 1.0 - smoothstep(0.0, 0.5, sqrt(r2));
    col *= 1.0 + 0.3 * core;                                         // brightened core
    col *= 1.0 + vD.w * 0.8;                                          // stained glass toward the lamp
    col = mix(col, uEye * (1.0 + vD.w), eye);
    col = mix(col, uHaze, vD.z);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }
`;
const BEAD_GLASS_FRAG = /* glsl */`
  varying vec2 vQ;
  varying vec3 vN;
  varying vec4 vD;
  varying float vFace;
  #include <fog_pars_fragment>
  ${GLSL_FOGF}
  ${GLSL_GLASS_OUT}
  void main() {
    float kind = vD.y;
    float r = length(vQ);
    float fw = max(fwidth(r), 1e-4);
    if (r > 1.0 + fw) discard;
    float f = vD.z;
    float keep = (1.0 - smoothstep(1.0 - fw, 1.0 + fw, r)) * (1.0 - f) * (1.0 - fogF());
    vec3 T = vec3(1.0);
    float line = 0.0;
    if (kind < 2.5) {
      bool env = kind > 1.5;
      float wp = 1.6 * fw;                                   // rim never thinner than ~1.6 px ...
      float small = smoothstep(0.1, 0.28, wp);               // ... but a far bead keeps its green heart
      float w = max(env ? 0.02 : 0.085, min(wp, 0.3)) * (1.0 + 1.5 * f);
      float mu = sqrt(max(1.0 - r * r, 0.0));
      float rim = smoothstep(1.0 - w, 1.0 - 0.35 * w, r);
      line = smoothstep(1.0 - 2.5 * w, 1.0 - 1.9 * w, r) * (1.0 - smoothstep(1.0 - 1.5 * w, 1.0 - w, r));
      T = vec3(1.0) - (vec3(1.0) - uTint) * mu * (env ? 1.15 : 1.0);
      T = mix(T, uRim, rim * (env ? 0.6 : 0.85) * (1.0 - 0.45 * small));
      line *= (env ? 0.6 : 1.0) * (1.0 - small);
    } else {
      float w = max(0.045, 1.6 * fw);
      float rim = smoothstep(1.0 - w, 1.0 - 0.4 * w, r);
      float face = smoothstep(0.06, 0.4, vFace);
      T = mix(vec3(1.0) - (vec3(1.0) - uTint) * 0.25, uRim, rim * 0.36);
      T = mix(vec3(1.0), T, face);
    }
    T = mix(vec3(1.0), T, keep);
    gl_FragColor = glassOut(T, uLine * line * keep);
  }
`;

// ------------------------------------------------------------------ threads (view-facing ribbons)
const THREAD_VERT = /* glsl */`
  attribute vec3 iA;
  attribute vec3 iB;
  attribute vec3 iT;          // colony, half width, seed
  varying vec3 vL;            // across, coverage, focus
  #include <fog_pars_vertex>
  ${GLSL_COLONY}
  void main() {
    int ci = int(iT.x + 0.5);
    vec3 a = (modelViewMatrix * vec4(uColPos[ci] + qrot(uColQuat[ci], iA), 1.0)).xyz;
    vec3 b = (modelViewMatrix * vec4(uColPos[ci] + qrot(uColQuat[ci], iB), 1.0)).xyz;
    vec4 mvPosition = vec4(mix(a, b, position.x), 1.0);
    vec3 side = normalize(cross(b - a, mvPosition.xyz) + vec3(1e-6, 2e-6, 0.0));
    float sc = length(modelViewMatrix[0].xyz);
    float w = iT.y * sc;
    float hw = max(w, 0.62 * pixelSize(mvPosition.z));
    mvPosition.xyz += side * position.y * hw;
    vL = vec3(position.y, w / max(hw, 1e-5), focusF(length(mvPosition.xyz)));
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const THREAD_FRAG = /* glsl */`
  varying vec3 vL;
  #include <fog_pars_fragment>
  ${GLSL_FOGF}
  ${GLSL_GLASS_OUT}
  void main() {
    float prof = 1.0 - smoothstep(0.35, 1.0, abs(vL.x));
    float dark = 0.74 * prof * pow(vL.y, 0.8) * (1.0 - vL.z) * (1.0 - fogF());
    gl_FragColor = glassOut(mix(vec3(1.0), uRim, dark), vec3(0.0));
  }
`;

// ------------------------------------------------------------------ flagella (whip ribbons)
const FLAG_VERT = /* glsl */`
  attribute vec3 iPos;
  attribute vec4 iF;          // seed, which (+-1), length, bead radius
  varying vec4 vF;            // across, coverage, s, phase
  varying float vFoc;
  #include <fog_pars_vertex>
  ${GLSL_COLONY}
  vec3 whip(float s, vec3 base, vec3 n, vec3 t1, vec3 t2, float ph0) {
    float L = iF.z;
    float ph = ph0 - s * 3.4;
    float env = pow(max(s, 0.0), 1.25);
    return base + n * (L * s * (1.0 - 0.18 * s))
      + t2 * (sin(ph) * 0.30 * env * L + 0.24 * L * s * s)
      + t1 * (iF.y * 0.24 * L * s + cos(ph + iF.x * 6.0) * 0.11 * env * L);
  }
  void main() {
    vec3 n = normalize(iPos);
    vec3 back = vec3(0.0, 0.0, -1.0);
    vec3 t2 = normalize(back - n * dot(back, n) + vec3(1e-5, 0.0, 0.0));
    vec3 t1 = cross(n, t2);
    float s = position.x;
    float ph0 = uTime * 6.6 - iPos.z * 0.33 + 2.0 * atan(iPos.y, iPos.x + 1e-4) + iF.x * 0.9;
    vec3 base = iPos + n * iF.w * 0.8 + t1 * iF.y * iF.w * 0.35;
    vec3 p0 = whip(s, base, n, t1, t2, ph0);
    vec3 p1 = whip(s + 0.03, base, n, t1, t2, ph0);
    vec4 mvPosition = modelViewMatrix * vec4(uColPos[0] + qrot(uColQuat[0], p0), 1.0);
    vec3 m1 = (modelViewMatrix * vec4(uColPos[0] + qrot(uColQuat[0], p1), 1.0)).xyz;
    vec3 side = normalize(cross(m1 - mvPosition.xyz, mvPosition.xyz) + vec3(1e-6, 2e-6, 0.0));
    float sc = length(modelViewMatrix[0].xyz);
    float w = mix(0.12, 0.04, s) * sc;
    float hw = max(w, 0.6 * pixelSize(mvPosition.z));
    mvPosition.xyz += side * position.y * hw;
    vF = vec4(position.y, pow(w / max(hw, 1e-5), 0.55), s, ph0 - s * 3.4);
    vFoc = focusF(length(mvPosition.xyz));
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const FLAG_FRAG = /* glsl */`
  varying vec4 vF;
  varying float vFoc;
  #include <fog_pars_fragment>
  ${GLSL_FOGF}
  ${GLSL_GLASS_OUT}
  void main() {
    float prof = 1.0 - smoothstep(0.3, 1.0, abs(vF.x));
    float keep = prof * vF.y * (1.0 - vFoc) * (1.0 - fogF());
    float dark = 0.8 * keep * (1.0 - 0.4 * vF.z);
    float g = max(sin(vF.w), 0.0);
    g = g * g; g = g * g; g = g * g;
    float glint = g * smoothstep(0.15, 0.5, vF.z) * (1.0 - smoothstep(0.85, 1.0, vF.z));
    gl_FragColor = glassOut(mix(vec3(1.0), uRim, dark), uLine * glint * keep * 1.3);
  }
`;

// ------------------------------------------------------------------ jelly shell of the mother
const GLSL_OPENING = /* glsl */`
  uniform vec4 uTear;         // lobe centre xy, main radius, lobe radius
  uniform vec3 uRag;          // ragged edge phases, mouth radius
  float openDist(vec3 p) {    // metres to the edge of the nearest opening (< 0 inside it)
    if (abs(p.z) < 40.0) return 99.0;
    float l = length(p.xy);
    if (p.z > 0.0) return l - uRag.z;
    float th = atan(p.y, p.x + 1e-4);
    float rag = 1.0 + 0.10 * sin(3.0 * th + uRag.x) + 0.06 * sin(7.0 * th + uRag.y);
    return min(l - uTear.z * rag, length(p.xy - uTear.xy) - uTear.w);
  }
`;
const JELLY_VERT = /* glsl */`
  varying vec3 vP;
  varying vec3 vNv;
  varying vec3 vV;
  uniform vec3 uFocus;
  varying float vFoc;
  #include <fog_pars_vertex>
  void main() {
    vP = position;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vNv = normalMatrix * normal;
    vV = mvPosition.xyz;
    vFoc = smoothstep(uFocus.x, uFocus.y, length(mvPosition.xyz)) * uFocus.z;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }
`;
const JELLY_FRAG = /* glsl */`
  varying vec3 vP;
  varying vec3 vNv;
  varying vec3 vV;
  varying float vFoc;
  #include <fog_pars_fragment>
  ${GLSL_FOGF}
  ${GLSL_GLASS_OUT}
  ${GLSL_OPENING}
  void main() {
    float d = openDist(vP);
    if (d < 0.0) discard;
    float mu = abs(dot(normalize(vNv + vec3(0.0, 0.0, 1e-5)), normalize(vV - vec3(0.0, 0.0, 1e-4))));
    float keep = (1.0 - vFoc) * (1.0 - fogF());
    float rim = 1.0 - smoothstep(0.0, 0.34, mu);
    float lip = 1.0 - smoothstep(0.0, 1.7, d);
    float line = smoothstep(0.15, 0.3, d) * (1.0 - smoothstep(0.45, 0.7, d));
    vec3 T = vec3(1.0) - (vec3(1.0) - uTint) * min(0.3 / max(mu, 0.15), 1.0) * 0.6;
    T = mix(T, uRim, max(rim * 0.5, lip * 0.55));
    T = mix(vec3(1.0), T, keep);
    gl_FragColor = glassOut(T, uLine * line * keep * 0.8);
  }
`;

// ------------------------------------------------------------------ preview backdrop (opts.backdrop)
const DOME_VERT = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = normalize(mat3(modelMatrix) * position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const DOME_FRAG = /* glsl */`
  uniform vec3 uField;
  uniform vec3 uLampCol;
  uniform vec3 uFar;
  uniform vec3 uLampWorld;
  varying vec3 vDir;
  void main() {
    float l = dot(normalize(vDir), uLampWorld);
    vec3 c = mix(uField, uLampCol, 0.7 * smoothstep(0.6, 0.995, l));
    c = mix(c, uFar, 0.22 * smoothstep(0.3, -1.0, l));
    gl_FragColor = vec4(c, 1.0);
  }
`;

// ------------------------------------------------------------------ geometry helpers
// Points on a sphere in a near-hexagonal net (Fibonacci lattice about the Z axis, lightly jittered).
// isOpen(x, y, z) on the sphere of radius rad removes points (polar openings). Points come out
// ordered by falling z, which pairsOf() relies on.
function fibColony(rng, count, rad, isOpen, jitter = 0.1) {
  const GA = Math.PI * (3 - Math.sqrt(5));
  const spacing = Math.sqrt((4 * Math.PI * rad * rad / count) * 2 / Math.sqrt(3));
  const ph0 = rng() * TAU, j = jitter * spacing / rad;
  const pts = [];
  for (let i = 0; i < count; i++) {
    let z = 1 - 2 * (i + 0.5) / count;
    const rr = Math.sqrt(Math.max(0, 1 - z * z)), a = i * GA + ph0;
    let x = rr * Math.cos(a) + (rng() - 0.5) * 2 * j, y = rr * Math.sin(a) + (rng() - 0.5) * 2 * j;
    z += (rng() - 0.5) * 2 * j * rr;
    const l = Math.hypot(x, y, z) || 1;
    x = x / l * rad; y = y / l * rad; z = z / l * rad;
    if (isOpen && isOpen(x, y, z)) continue;
    pts.push(x, y, z);
  }
  return { pts, n: pts.length / 3, spacing };
}

// Neighbour pairs (threads): every pair closer than 1.32 spacings, at most 6 per bead.
function pairsOf(col) {
  const { pts, n, spacing } = col, thr = spacing * 1.32, thr2 = thr * thr, zBreak = thr * 1.6;
  const deg = new Uint8Array(n), out = [];
  for (let i = 0; i < n; i++) {
    const ax = pts[i * 3], ay = pts[i * 3 + 1], az = pts[i * 3 + 2];
    for (let k = i + 1; k < n; k++) {
      const dz = az - pts[k * 3 + 2];
      if (dz > zBreak) break;
      const dx = ax - pts[k * 3], dy = ay - pts[k * 3 + 1];
      if (dx * dx + dy * dy + dz * dz < thr2 && deg[i] < 6 && deg[k] < 6) { deg[i]++; deg[k]++; out.push(i, k); }
    }
  }
  return { pairs: out, deg };
}

function quadGeometry() {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
function ribbonGeometry(segs) {          // position = (s along 0..1, side -1/+1, 0)
  const g = new THREE.InstancedBufferGeometry(), p = [], idx = [];
  for (let i = 0; i <= segs; i++) { p.push(i / segs, -1, 0, i / segs, 1, 0); }
  for (let i = 0; i < segs; i++) { const a = i * 2; idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setIndex(idx);
  return g;
}
const inst = (g, name, arr, size) => g.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), size));

// ------------------------------------------------------------------ the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('volvox') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const wantDome = !!opts.backdrop;
  const C = V3(0, CY, 0);

  // ---- colours (linear)
  const field = pal[0].clone(), lampCol = pal[1].clone(), haze = pal[2].clone();
  const emerald = pal[3].clone().offsetHSL(rng.range(-0.035, 0.03), 0, rng.range(-0.02, 0.03));
  const emeraldHi = emerald.clone().lerp(new THREE.Color(0.3, 0.95, 0.25), 0.42);
  const rimCol = pal[4].clone().lerp(field, 0.27);
  const tint = new THREE.Color(1 - 0.17 * (1 - haze.r), 1 - 0.17 * (1 - haze.g), 1 - 0.17 * (1 - haze.b));
  const eyeCol = pal[6].clone().lerp(new THREE.Color(1.0, 0.3, 0.03), rng.range(0.45, 0.7)).multiplyScalar(1.15);
  const lampDir = V3(...(opts.lampDir || [-0.45, -0.75, -0.5])).normalize();

  // ---- openings (colony space of the mother, metres)
  const mouthR = 10;
  const lobeA = rng.range(-1.2, 0.15), lobeD = 15.5;
  const tear = { cx: Math.cos(lobeA) * lobeD, cy: Math.sin(lobeA) * lobeD, r1: 10.5, r2: 8.6, pa: rng() * TAU, pb: rng() * TAU };
  const openDist = (x, y, z) => {
    if (Math.abs(z) < 40) return 99;
    const l = Math.hypot(x, y);
    if (z > 0) return l - mouthR;
    const th = Math.atan2(y, x + 1e-4);
    const rag = 1 + 0.10 * Math.sin(3 * th + tear.pa) + 0.06 * Math.sin(7 * th + tear.pb);
    return Math.min(l - tear.r1 * rag, Math.hypot(x - tear.cx, y - tear.cy) - tear.r2);
  };

  // ---- instance buffers
  const bPos = [], bData = [];                 // beads: iPos, iData(colony, radius, seed, kind)
  const tA = [], tB = [], tT = [];             // threads
  const fPos = [], fF = [];                    // flagella
  const addBead = (c, x, y, z, r, kind) => { bPos.push(x, y, z); bData.push(c, r, rng(), kind); };
  const addThread = (c, ax, ay, az, bx, by, bz, hw) => { tA.push(ax, ay, az); tB.push(bx, by, bz); tT.push(c, hw, rng()); };
  const threadNet = (c, col, beadR, hw) => {
    const { pairs, deg } = pairsOf(col), p = col.pts;
    for (let k = 0; k < pairs.length; k += 2) {
      const i = pairs[k] * 3, j = pairs[k + 1] * 3;
      const dx = p[j] - p[i], dy = p[j + 1] - p[i + 1], dz = p[j + 2] - p[i + 2];
      const l = Math.hypot(dx, dy, dz) || 1, s = Math.min(0.35, beadR * 0.75 / l);
      addThread(c, p[i] + dx * s, p[i + 1] + dy * s, p[i + 2] + dz * s, p[j] - dx * s, p[j + 1] - dy * s, p[j + 2] - dz * s, hw);
    }
    return deg;
  };

  // ---- mother shell
  const count = Math.round(clamp(opts.beads ?? rng.int(1800, 2200), 600, 2600));
  const mother = fibColony(rng, count, R, (x, y, z) => openDist(x, y, z) < 1.0, 0.1);
  const flagLen = rng.range(4.8, 6.4);
  const beadR0 = rng.range(0.95, 1.06);
  const mRad = new Float32Array(mother.n);
  for (let i = 0; i < mother.n; i++) {
    const x = mother.pts[i * 3], y = mother.pts[i * 3 + 1], z = mother.pts[i * 3 + 2];
    const r = beadR0 * rng.range(0.86, 1.12) * (1 + 0.1 * smoothstep(20, -60, z));   // a little larger toward the rear
    mRad[i] = r;
    addBead(0, x, y, z, r, 0);
    addBead(0, x, y, z, mother.spacing * rng.range(0.5, 0.55), 3);
    for (const w of [-1, 1]) { fPos.push(x, y, z); fF.push(rng(), w, flagLen * rng.range(0.82, 1.18), r); }
  }
  const mDeg = threadNet(0, mother, beadR0, 0.075);
  // torn threads hanging into the far tear
  for (let i = 0; i < mother.n; i++) {
    const x = mother.pts[i * 3], y = mother.pts[i * 3 + 1], z = mother.pts[i * 3 + 2];
    if (z > 0 || mDeg[i] > 4 || openDist(x, y, z) > 6) continue;
    const n = rng.int(1, 2);
    for (let k = 0; k < n; k++) {
      const a = Math.atan2(-y, -x) + rng.range(-0.9, 0.9), l = rng.range(1.6, 4.2), inw = rng.range(-0.25, 0.45);
      const bx = x + Math.cos(a) * l - (x / R) * inw * l, by = y + Math.sin(a) * l - (y / R) * inw * l, bz = z - (z / R) * inw * l;
      addThread(0, x, y, z, bx, by, bz, 0.06);
    }
  }
  await ctx.yield();

  // ---- camera line through the globe (relative to C), used to keep the daughters clear of it
  const bow = 9;
  const arc = (z) => V3(-bow * (1 - (z / R) * (z / R)), 0, z);
  const arcPts = []; for (let i = 0; i <= 64; i++) arcPts.push(arc(lerp(R, -R, i / 64)));
  const arcDist = (p) => { let b = 1e9; for (const a of arcPts) b = Math.min(b, a.distanceTo(p)); return b; };

  // ---- daughters: 7 inside (slots 1..7) + the newborn in the tear lobe (slot 8)
  const dRadii = [15, 12.5, 11, 9.5, 8.5, 7.5, 7].map((r, i) => (i ? r * rng.range(0.92, 1.08) : rng.range(14, 15)));
  const daughters = [];
  const bornIn = V3(tear.cx, tear.cy, -R + 9), bornR = 7;
  for (let i = 0; i < dRadii.length; i++) {
    let r = dRadii[i], p = null;
    for (let tries = 0; tries < 600 && !p; tries++) {
      if (tries && tries % 150 === 0) r *= 0.9;
      let q;
      if (i === 0) {                       // the largest: 8-9 m off the camera line, mid-globe, right or below
        const z = rng.range(-22, 8), a = rng.range(-1.9, 0.4);
        q = arc(z).add(V3(Math.cos(a), Math.sin(a), 0).multiplyScalar(r + 9.2));
      } else {
        const u = rng.range(-1, 1), a = rng() * TAU, rr = Math.sqrt(1 - u * u), d = (R - 4 - r) * Math.cbrt(rng());
        q = V3(rr * Math.cos(a) * d, rr * Math.sin(a) * d, u * d);
        if (arcDist(q) < r + 9.6) continue;
      }
      if (q.length() + r > R - 4) continue;
      if (q.distanceTo(bornIn) < r + bornR + 3) continue;
      if (daughters.some((o) => o.pos.distanceTo(q) < o.r + r + 3)) continue;
      p = q;
    }
    if (!p) continue;
    daughters.push({ pos: p, r });
  }
  daughters.push({ pos: bornIn.clone(), r: bornR, born: true });
  const rollDir = rng.sign();
  daughters.forEach((d, k) => {
    const slot = d.born ? 8 : k + 1;
    d.slot = slot;
    const n = Math.round(clamp(150 + d.r * 18, 200, 420));
    const col = fibColony(rng, n, d.r, null, 0.12);
    const br = col.spacing * 0.28;
    for (let i = 0; i < col.n; i++) addBead(slot, col.pts[i * 3], col.pts[i * 3 + 1], col.pts[i * 3 + 2], br * rng.range(0.88, 1.12), 0);
    threadNet(slot, col, br, Math.max(0.028, col.spacing * 0.014));
    addBead(slot, 0, 0, 0, d.r + br * 1.7, 2);                                   // jelly envelope
    const ng = d.r > 9 ? rng.int(5, 9) : rng.int(2, 4);                           // third generation
    for (let g = 0; g < ng; g++) {
      const u = rng.range(-1, 1), a = rng() * TAU, rr = Math.sqrt(1 - u * u), dd = d.r * 0.66 * Math.cbrt(rng());
      const gr = d.r * rng.range(0.06, 0.1);
      addBead(slot, rr * Math.cos(a) * dd, rr * Math.sin(a) * dd, u * dd, gr, 1);
      addBead(slot, rr * Math.cos(a) * dd, rr * Math.sin(a) * dd, u * dd, gr * 1.35, 2);
    }
    d.axis = V3(rng.range(-0.5, 0.5), rng.range(-0.5, 0.5), 1).normalize();
    d.rate = -rollDir * rng.range(0.14, 0.3) * (11 / d.r);
    d.q0 = new THREE.Quaternion().setFromUnitVectors(V3(0, 0, 1), V3(rng.gauss(), rng.gauss(), rng.gauss()).normalize());
    d.ph = [rng() * TAU, rng() * TAU, rng() * TAU];
  });
  await ctx.yield();

  // ---- uniforms
  const colPos = [], colQuat = [];
  for (let i = 0; i < NCOL; i++) { colPos.push(C.clone()); colQuat.push(new THREE.Vector4(0, 0, 0, 1)); }
  const uniforms = {
    uColPos: { value: colPos }, uColQuat: { value: colQuat }, uTime: { value: 0 }, uResY: { value: 1080 },
    uFocus: { value: V3(120, 520, 0.55) }, uLampLocal: { value: lampDir.clone() },
    uField: { value: field }, uRim: { value: rimCol }, uTint: { value: tint }, uLine: { value: lampCol.clone().multiplyScalar(0.6) },
    uEmerald: { value: emerald }, uEmeraldHi: { value: emeraldHi }, uEye: { value: eyeCol }, uHaze: { value: haze },
    uTear: { value: new THREE.Vector4(tear.cx, tear.cy, tear.r1, tear.r2) }, uRag: { value: V3(tear.pa, tear.pb, mouthR) },
  };
  const mat = (vertexShader, fragmentShader, glass, extra = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsLib.fog, ...uniforms }, vertexShader, fragmentShader, fog: true,
    ...(glass ? {
      transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.OneFactor, blendDst: THREE.SrcAlphaFactor, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
    } : {}), ...extra,
  });
  const bounds = new THREE.Sphere(C.clone(), 96);
  const object = new THREE.Group();
  object.name = 'pond-drop-volvox';
  const addMesh = (g, m, order, n) => {
    if (n !== undefined) g.instanceCount = n;
    g.boundingSphere = bounds;
    const mesh = new THREE.Mesh(g, m); mesh.renderOrder = order; object.add(mesh); return mesh;
  };

  // ---- beads: opaque chloroplast pass + glass pass on the same instances
  const beadGeo = quadGeometry();
  inst(beadGeo, 'iPos', bPos, 3); inst(beadGeo, 'iData', bData, 4);
  const nBeads = bData.length / 4;
  addMesh(beadGeo, mat(BEAD_VERT, BEAD_OPAQUE_FRAG, false, { defines: { OPAQUE_PASS: 1 } }), 0, nBeads);
  // ---- jelly shell
  const jellyGeo = new THREE.SphereGeometry(R + 1.15, 72, 40);
  const jelly = new THREE.Mesh(jellyGeo, mat(JELLY_VERT, JELLY_FRAG, true, { side: THREE.DoubleSide }));
  jelly.position.copy(C); jelly.renderOrder = 1; object.add(jelly);
  // ---- threads
  const thGeo = ribbonGeometry(1);
  inst(thGeo, 'iA', tA, 3); inst(thGeo, 'iB', tB, 3); inst(thGeo, 'iT', tT, 3);
  addMesh(thGeo, mat(THREAD_VERT, THREAD_FRAG, true, { side: THREE.DoubleSide }), 2, tT.length / 3);
  // ---- flagella
  const flGeo = ribbonGeometry(8);
  inst(flGeo, 'iPos', fPos, 3); inst(flGeo, 'iF', fF, 4);
  addMesh(flGeo, mat(FLAG_VERT, FLAG_FRAG, true, { side: THREE.DoubleSide }), 3, fF.length / 4);
  // ---- glass pass of the beads, sheaths and envelopes
  addMesh(beadGeo, mat(BEAD_VERT, BEAD_GLASS_FRAG, true), 4, nBeads);
  await ctx.yield();

  // ---- optional preview backdrop
  let dome = null;
  if (wantDome) {
    dome = new THREE.Mesh(new THREE.SphereGeometry(2400, 32, 16), new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false, vertexShader: DOME_VERT, fragmentShader: DOME_FRAG,
      uniforms: { uField: uniforms.uField, uLampCol: { value: lampCol }, uFar: { value: haze }, uLampWorld: { value: lampDir.clone() } },
    }));
    dome.renderOrder = -0.5; dome.frustumCulled = false; object.add(dome);
  }

  // ---- animation state
  const period = opts.rollPeriod ?? 24;
  let progress = clamp(opts.progress ?? 0.45, 0, 1);
  const qM = new THREE.Quaternion(), qT = new THREE.Quaternion(), vT = V3(), Z = V3(0, 0, 1), size = new THREE.Vector2();
  const setCol = (slot, pos, q) => { colPos[slot].copy(pos); colQuat[slot].set(q.x, q.y, q.z, q.w); };
  const place = (time) => {
    qM.setFromAxisAngle(Z, rollDir * time * TAU / period);
    setCol(0, C, qM);
    jelly.quaternion.copy(qM);
    for (const d of daughters) {
      const t = time, w = d.born ? 0.4 : 0.55;
      vT.set(Math.sin(t * 0.21 + d.ph[0]), Math.sin(t * 0.17 + d.ph[1]), Math.sin(t * 0.19 + d.ph[2])).multiplyScalar(w);
      qT.setFromAxisAngle(d.axis, d.rate * time).multiply(d.q0);
      if (d.born) {
        const e = progress * progress * (3 - 2 * progress);
        vT.add(d.pos); vT.z = lerp(-R + 9, -R - 12 - d.r, e) + vT.z - d.pos.z;
        vT.applyQuaternion(qM).add(C);
        qT.premultiply(qM);
      } else vT.add(d.pos).add(C);
      d.live = (d.live || V3()).copy(vT);
      setCol(d.slot, vT, qT);
    }
  };
  place(0);

  const inner = daughters.filter((d) => !d.born);
  const hero = {
    object,
    radius: R + 7, height: 2 * (R + 7),
    center: C.clone(),
    ground: false, groundY: 0,
    uniforms,
    anchors: {
      center: C.clone(),
      axis: V3(0, 0, -1),
      nearPole: { position: V3(0, CY, R), normal: V3(0, 0, 1), radius: mouthR },
      farPole: { position: V3(0, CY, -R), normal: V3(0, 0, -1), radius: tear.r1 },
      portalSeat: { position: V3(0, CY, -R - 16), normal: V3(0, 0, -1), radius: 7 },
      flyThrough: [V3(0, CY, 190), V3(0, CY, 120), ...[1, 0.75, 0.5, 0.25, 0, -0.25, -0.5, -0.75, -1].map((k) => arc(k * R).add(C)), V3(0, CY, -95), V3(0, CY, -130)],
      viewpoints: {
        reveal: V3(45, CY + 20, 255), threeQuarter: V3(150, CY + 45, 125), inside: V3(-6, CY + 2, 32),
        wall: arc(0).add(C), tearFrame: arc(-12).add(C),
      },
      daughters: inner.map((d) => ({ center: d.pos.clone().add(C), radius: d.r })),
      largest: inner.length ? { center: inner[0].pos.clone().add(C), radius: inner[0].r } : null,
      newborn: { center: bornIn.clone().add(C), radius: bornR },
      lampDir: lampDir.clone(),
    },
    daughterPosition(i, out = V3()) { const d = inner[i]; return d && d.live ? out.copy(d.live) : out.copy(C); },
    setProgress(u) { progress = clamp(u, 0, 1); },
    setLamp(dir) { lampDir.copy(dir).normalize(); uniforms.uLampLocal.value.copy(lampDir); if (dome) dome.material.uniforms.uLampWorld.value.copy(lampDir); },
    setFocus(near, far, amount = 0.55) { uniforms.uFocus.value.set(near, far, amount); },
    setField(hex, hazeHex) { uniforms.uField.value.set(hex); if (hazeHex) uniforms.uHaze.value.set(hazeHex); },
    update(dt, time, camera) {
      uniforms.uTime.value = time;
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) uniforms.uResY.value = Math.max(240, ctx.renderer.getDrawingBufferSize(size).y);
      place(time);
      if (dome && camera) { object.updateWorldMatrix(true, false); dome.position.copy(object.worldToLocal(camera.getWorldPosition(vT))); }
    },
    dispose() {},
  };
  return hero;
}
