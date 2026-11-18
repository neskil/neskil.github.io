// Hero set piece for "Corniche at 120 BPM": THE CORKSCREW AND THE EQUALISER CITY.
//
// What it is
//   A twisted-ladder causeway (two 7 m road strands 28 m apart, rungs, truss hoops, four helical
//   stringers) leaping 1,020 m across a bay and making one full roll about its own axis, landing on
//   a 1,050 m elevated boulevard between the towers of a crescent city that is a live spectrum
//   analyser (bass at -X, treble at +X, peak-hold bars floating above), mirrored in a sea of sine lines.
//   Style: neon vector display. Near-black violet fills that write depth and hide the lines behind
//   them; every edge is an emissive line with a white-hot core (about 2.5) and coloured falloff.
//
// Local space (metres). Origin = landfall at sea level. Travel is toward -Z ("front" faces +Z, the
//   headland). Causeway: z = +1020 (road y 61) -> z = 0 (road y 13). Boulevard deck: z 0 -> -1046 at
//   y 13, 35 m wide. City: |x| < ~900, z from about +400 (the horns) to -1050. Sea at y 0.
//   The causeway is a flat ladder at both ends (strands level, side by side at x = +14 and -14) and
//   the whole ladder twists once: phase eases in from s = 180 m, turns at a steady rate through
//   s = 340..680 and eases out by s = 840 (s = distance from the headland end). The rider is on the
//   strand that starts at +X; its "up" is the ladder normal, so at s = 510 the rider is inverted.
//
// opts
//   palette     hex strings [fill, indigo, violet haze, magenta, cyan, rose, amber] (brief default)
//   rollDir     +1 / -1 direction of the roll (default by seed)
//   beatLength  metres ridden per beat on the causeway (42.5): hoops one per beat, rungs four per beat
//   sea         false to leave out the sea (floor fill, line surface, mirrored city)   seaRadius 2600
//   sunDir      [x,y,z] toward the sun, for the amber glitter path on the sea (default left of travel)
//   song        0 four-on-the-floor | 1 half-time | 2 broken beat with fast arpeggio (default by seed)
//
// Clock / progress hooks (never wall clock once the world drives them)
//   hero.setBeat(beat)            beat count of the song (the brief's 80-beat clock). Until it is first
//                                 called the piece free-runs at 2 beats per second from `time`.
//   hero.setEnergy(e)             0..1; 0 = the breakdown (everything but the kick sinks), 1 = full.
//   hero.setKey(key, next, wipeZ) colour key 0 (cyan road / magenta city), 1 (swapped), 2 (split
//                                 cyan+magenta twins). Lines with local z > wipeZ show `next`.
//   hero.uniforms                 shared uniform objects if you want to drive them directly.
//
// anchors (local space)
//   start        { position, direction }  rider's eye at the headland end of our strand
//   landfall     { position, direction }  rider's eye where the strand meets the boulevard
//   portalSeat   { position, facing }     centre of the 14 m portal at the boulevard's end, facing +Z
//   flyThrough   [[x,y,z], ...]           rider's eye line: strand every 20 m, then the boulevard
//   ride         [{ s, p, up, roll }]     same line every 10 m with the up vector and roll (radians,
//                                         about the direction of travel) the camera must take
//   frame(s)     -> { p, up, tangent, roll, axis }  exact eye frame at distance s (0..1020)
//   frameInto(s, out)                     the same written into out.p/up/tangent/axis (no allocation), for update()
//   rollStart / rollTop / rollEnd         eye points at s = 340, 510, 680
//   viewpoints   { headland, rollTop, bay } good places to look from (headland looks at `center`)
//   bounds       { min, max }             true extents; `radius` below is only the framing radius
//   corridor     half-width kept free of towers along the boulevard (26 m)
//   seaLine(x, z, beat) -> q              the sea's isoline field (lines where q / 6 is whole), for yachts
//
// Size: framing radius 620, height 270, true extents about 1,900 x 270 x 2,100 m.
// Cost: about 91k triangles (towers and their mirror 82k), 6 draw calls (3 without the sea), under
//   100 ms build, no lights, no textures.
//   inkGain     brightness multiplier on the two inks (night look: 1.15)   cityGain  a further one on the towers only
//   beatOffset  beat count at the causeway's headland end (30), so the rung pulse leaves the rider on the beat
//   gantryZ     local z of the world's last chevron gantry (twelve stand one beat apart toward +Z from it); the wet
//               boulevard mirrors them. Left out, the deck mirrors none.
//   trail       gain of the phosphor afterimage sheets (0.14; 0 leaves them out). Drive uniforms.uVel (eye velocity
//               times persistence, metres, in this piece's space) or they stay empty.
// Exports makeLines, makeTrail and the GLSL chunks so the world draws its own lines in the same hand.
// Lighting: none. Everything is unlit and emissive; it wants a dark sky, bloom (threshold ~0.9) and
//   scene fog in a dark violet. Lines fade to black in fog, fills fade to the fog colour.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, hashSeed, makeRng } from '../kit/core.js';

const DEFAULT_PALETTE = ['#0A0418', '#1B0F4A', '#3A1470', '#FF2BD6', '#19F0FF', '#FF5A7A', '#FFB000'];
const LEN = 1020, STRAND_R = 14, STRAND_W = 7, HOOP_R = 21, Y0 = 61, Y1 = 13, BLVD = 1046, EYE = 1.2;
const NCMAX = 32;

const smoother = (t) => { t = clamp(t, 0, 1); return t * t * t * (t * (t * 6 - 15) + 10); };

// ---------------------------------------------------------------- shared GLSL
export const GLSL_INK = /* glsl */`
uniform vec3 uInkA, uInkB, uInkA2, uInkB2, uAmber;
uniform float uWipeZ;
vec3 ink(float slot, float wz) {
  float k = step(uWipeZ, wz);
  vec3 a = mix(uInkA, uInkA2, k), b = mix(uInkB, uInkB2, k);
  return slot < 0.5 ? a : (slot < 1.5 ? b : (slot < 2.5 ? uAmber : vec3(1.0)));
}
float lineP(float d, float w, float hw) {
  float px = max(w, 1e-4) * 1.2;
  float h = max(hw, px);
  return (1.0 - smoothstep(h * 0.35, h, d)) * clamp(hw / px, 0.45, 1.0);
}
vec3 hot(vec3 c, float p) { return c * (p * 1.4) + vec3(1.0) * smoothstep(0.72, 1.0, p) * 0.55; }
`;
// A wet road, drawn as lines: broken reflection strokes lying along the tarmac (x across, s along, in metres; wx and
// ws are their pixel footprints, taken with fwidth before any branch). Needs GLSL_INK (lineP) before it.
export const GLSL_WET = /* glsl */`
float wetH(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float wetStreak(float x, float s, float wx, float ws, float beat, float pitch, float per, float seed) {
  float q = x / pitch, st = wetH(floor(q) + seed);
  float dx = abs(fract(q) - 0.5) * pitch;
  float core = lineP(dx, wx, 0.08) + 0.4 * (1.0 - smoothstep(0.05, pitch * 0.5, dx));
  float sg = fract(s / per + st * 7.0);
  float on = smoothstep(0.0, 0.06, sg) * (1.0 - smoothstep(0.36, 0.55, sg));
  on = mix(on, 0.42, smoothstep(per * 0.25, per * 0.8, ws));
  float tw = 0.7 + 0.3 * sin(beat * 6.2832 + st * 20.0);
  return core * on * step(0.35, st) * tw * (1.0 - smoothstep(0.3, 0.7, wx));
}
// the headlamp's amber on the wet tarmac: short broken strokes fanning out 4 to 36 m ahead (x from the rider, d view depth)
float wetLamp(float x, float s, float wx, float ws, float d) {
  float fanW = 0.4 + d * 0.06;
  float q = x / 0.36, dx = abs(fract(q) - 0.5) * 0.36, st = wetH(floor(q) + 31.0);
  float sg = fract(s / 2.4 + st * 3.0);
  float on = mix(step(sg, 0.5), 0.5, smoothstep(0.6, 2.0, ws));
  return (lineP(dx, wx, 0.045) + 0.2) * on * (1.0 - smoothstep(fanW * 0.55, fanW, abs(x))) * smoothstep(3.0, 6.0, d) * (1.0 - smoothstep(22.0, 38.0, d));
}
`;
export const GLSL_FOG_PARS_V = /* glsl */`
#ifdef USE_FOG
  varying float vFogDepth;
#endif
`;
export const GLSL_FOG_PARS_F = /* glsl */`
#ifdef USE_FOG
  varying float vFogDepth;
  uniform vec3 fogColor;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear; uniform float fogFar;
  #endif
  float fogAmt() {
    #ifdef FOG_EXP2
      return 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      return smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  }
#endif
`;
// additive things fade to black; fills fade to the fog colour
export const GLSL_FOG_ADD = /* glsl */`
#ifdef USE_FOG
  col *= 1.0 - fogAmt();
#endif
`;
export const GLSL_FOG_MIX = /* glsl */`
#ifdef USE_FOG
  { float fa = fogAmt(); col = mix(col, fogColor * 0.35, fa) ; }
#endif
`;

// ---------------------------------------------------------------- the song (CPU, a pure function of beat)
function makeSong(rng, nc, style) {
  const steps = 32; // two bars of sixteenths
  const amp = new Float32Array(nc * steps), kickOnly = new Float32Array(nc * steps);
  const kick = new Float32Array(steps), snare = new Float32Array(steps), hat = new Float32Array(steps), bass = new Float32Array(steps), arp = new Float32Array(steps);
  for (let i = 0; i < steps; i++) {
    const st = i % 16;
    if (style === 1) { // half-time: slow heavy swells
      kick[i] = st === 0 ? 1 : (st === 10 ? 0.7 : 0); snare[i] = st === 8 ? 1 : 0; hat[i] = st % 4 === 0 ? 0.8 : (st % 4 === 2 ? 0.4 : 0);
    } else if (style === 2) { // broken beat
      kick[i] = (st === 0 || st === 6 || st === 10) ? 1 : 0; snare[i] = (st === 4 || st === 13) ? 1 : 0; hat[i] = st % 2 === 0 ? 0.85 : 0.5;
    } else { // four on the floor
      kick[i] = st % 4 === 0 ? 1 : 0; snare[i] = (st === 4 || st === 12) ? 1 : 0; hat[i] = st % 2 === 0 ? (st % 4 === 2 ? 1 : 0.7) : 0;
    }
    bass[i] = rng.chance(style === 1 ? 0.22 : 0.4) ? rng.range(0.45, 0.85) : 0;
  }
  // the melody: a walking arpeggio across the middle of the crescent
  let pa = rng.range(0.35, 0.65), dir = rng.sign();
  const stepLen = style === 2 ? 0.06 : 0.035, every = style === 2 ? 1 : 2;
  for (let i = 0; i < steps; i++) {
    if (i % every === 0) { pa += dir * stepLen * rng.range(0.7, 1.5); if (pa > 0.74 || pa < 0.28 || rng.chance(0.12)) dir = -dir; pa = clamp(pa, 0.26, 0.76); arp[i] = pa; } else arp[i] = -1;
  }
  const decay = new Float32Array(nc), pad = new Float32Array(nc);
  for (let c = 0; c < nc; c++) {
    const f = c / (nc - 1);
    const wK = 1 - smoothstep(0.02, 0.36, f), wS = smoothstep(0.2, 0.36, f) * (1 - smoothstep(0.6, 0.78, f)), wH = smoothstep(0.62, 0.95, f);
    const wB = smoothstep(0.05, 0.16, f) * (1 - smoothstep(0.3, 0.46, f));
    decay[c] = lerp(style === 1 ? 0.5 : 0.9, 4.5, Math.pow(f, 1.3)); pad[c] = 0.05 + 0.08 * rng();
    for (let i = 0; i < steps; i++) {
      let a = 0.1 + 0.1 * rng();
      const k = wK * kick[i] * (0.82 + 0.18 * Math.cos(f * 9));
      a = Math.max(a, k, wS * snare[i] * 0.8, wH * hat[i] * (0.55 + 0.45 * rng()), wB * bass[i]);
      if (arp[i] >= 0) a = Math.max(a, 0.92 * Math.exp(-Math.pow((f - arp[i]) / 0.045, 2)));
      amp[c * steps + i] = a; kickOnly[c * steps + i] = Math.max(0.04, k);
    }
  }
  // level and peak-hold for every column at a beat; energy 0 = only the kick
  function evaluate(beat, energy, out) {
    const s = beat * 4, s0 = Math.floor(s);
    for (let c = 0; c < nc; c++) {
      let lv = 0, pk = 0; const rate = decay[c];
      for (let k = 0; k < 34; k++) {
        const i = s0 - k, age = (s - i) / 4, idx = c * steps + (((i % steps) + steps) % steps);
        const a = lerp(kickOnly[idx], amp[idx], energy);
        if (k < 14) { const e = a * smoothstep(0, 0.08, age) * Math.exp(-rate * Math.max(0, age - 0.08)); if (e > lv) lv = e; }
        const p = a * smoothstep(0, 0.08, age) * (1 - Math.max(0, age - 0.35) * 0.75); if (p > pk) pk = p;
      }
      lv = Math.max(lv, energy * pad[c] * (0.8 + 0.2 * Math.sin(beat * 0.785 + c * 1.7)));
      out[c].set(lv, Math.max(pk, lv));
    }
  }
  return { evaluate };
}

// ---------------------------------------------------------------- causeway frames
function makeFrames(rollDir) {
  // phase: cubic ease 180..340, steady 340..680, cubic ease 680..840
  const L = 160, rate = 1 / (340 + 2 * L / 3), g = rate * L / 3;
  const phase01 = (s) => {
    if (s <= 180) return 0; if (s >= 840) return 1;
    if (s < 340) { const x = (s - 180) / L; return g * x * x * x; }
    if (s <= 680) return g + rate * (s - 340);
    const x = (840 - s) / L; return 1 - g * x * x * x;
  };
  const roadY = (s) => Y0 + (Y1 - Y0) * smoother(s / LEN);
  const T = new THREE.Vector3(), U0 = new THREE.Vector3(), X0 = new THREE.Vector3(1, 0, 0);
  // returns axis point, tangent, lateral r and normal u of the ladder at s
  function ladder(s) {
    const y = roadY(s), dy = (roadY(s + 0.5) - roadY(s - 0.5));
    T.set(0, dy, -1).normalize(); U0.crossVectors(X0, T).normalize();
    const phi = phase01(s) * Math.PI * 2 * rollDir, c = Math.cos(phi), sn = Math.sin(phi);
    return {
      axis: new THREE.Vector3(0, y, LEN - s), t: T.clone(), phi,
      r: new THREE.Vector3().copy(X0).multiplyScalar(c).addScaledVector(U0, sn),
      u: new THREE.Vector3().copy(X0).multiplyScalar(-sn).addScaledVector(U0, c),
    };
  }
  // the same without allocating: writes axis, t, r, u into o and returns o
  function ladderInto(s, o) {
    const y = roadY(s), dy = (roadY(s + 0.5) - roadY(s - 0.5));
    o.t.set(0, dy, -1).normalize(); U0.crossVectors(X0, o.t).normalize();
    const phi = phase01(s) * Math.PI * 2 * rollDir, c = Math.cos(phi), sn = Math.sin(phi);
    o.axis.set(0, y, LEN - s); o.phi = phi;
    o.r.copy(X0).multiplyScalar(c).addScaledVector(U0, sn);
    o.u.copy(X0).multiplyScalar(-sn).addScaledVector(U0, c);
    return o;
  }
  return { ladder, ladderInto, roadY, phase01 };
}

// ---------------------------------------------------------------- fat additive lines (one instanced draw)
// opt: { pre (GLSL declarations), xform (GLSL that may move `A`, `B` and scale `gMul`), depthTest, renderOrder }
// build(extra, dynamic): extra = { name: { array, size } } per-instance attributes for the xform code
export function makeLines(U, opt = {}) {
  const A = [], B = [], W = [];
  const add = (a, b, width, slot, phase = -1, gain = 1) => { A.push(a.x, a.y, a.z); B.push(b.x, b.y, b.z); W.push(width, slot, phase, gain); };
  function build(extra = null, dynamic = false) {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 1, -1, 0, 1, 1, 0, 0, 1, 0]), 3));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    if (extra) for (const k in extra) g.setAttribute(k, new THREE.InstancedBufferAttribute(extra[k].array, extra[k].size));
    g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 3));
    g.setAttribute('aB', new THREE.InstancedBufferAttribute(new Float32Array(B), 3));
    g.setAttribute('aW', new THREE.InstancedBufferAttribute(new Float32Array(W), 4));
    g.instanceCount = A.length / 3;
    if (dynamic) for (const k of ['aA', 'aB', 'aW']) g.attributes[k].setUsage(THREE.DynamicDrawUsage);
    const mat = new THREE.ShaderMaterial({
      uniforms: U, fog: true, transparent: true, depthWrite: false, depthTest: opt.depthTest !== false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec3 aA, aB; attribute vec4 aW;
        uniform vec2 uRes; uniform float uBeat;
        varying vec4 vL; varying vec3 vP;
        ${GLSL_FOG_PARS_V}
        ${opt.pre || ''}
        void main() {
          vec3 A = aA, B = aB; float gMul = 1.0;
          ${opt.xform || ''}
          vec4 ca = modelViewMatrix * vec4(A, 1.0), cb = modelViewMatrix * vec4(B, 1.0);
          float nz = -0.3;
          if (ca.z > nz && cb.z > nz) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); vL = vec4(0.0); vP = vec3(0.0); return; }
          if (ca.z > nz) ca = mix(cb, ca, (nz - cb.z) / max(ca.z - cb.z, 1e-4));
          if (cb.z > nz) cb = mix(ca, cb, (nz - ca.z) / max(cb.z - ca.z, 1e-4));
          vec4 pa = projectionMatrix * ca, pb = projectionMatrix * cb;
          vec2 d = (pb.xy / pb.w - pa.xy / pa.w) * uRes;
          float dl = length(d); vec2 dir = dl > 1e-3 ? d / dl : vec2(1.0, 0.0);
          vec2 nrm = vec2(-dir.y, dir.x);
          vec4 cv = mix(ca, cb, position.x); vec4 p = mix(pa, pb, position.x);
          float depth = max(-cv.z, 0.3);
          float pxPerM = uRes.y * 0.5 * projectionMatrix[1][1] / depth;
          float corePx = aW.x * pxPerM * 0.5;
          float k = clamp(corePx / 1.1, 0.1, 1.0);
          float halfPx = clamp(corePx, 1.1, max(1.3, uRes.y / 300.0)) * 2.4;
          // lines seen end-on (rails and stringers running to the vanishing point) are dimmed so they do not pile up to white
          float expect = length(cb.xyz - ca.xyz) * uRes.y * 0.5 * projectionMatrix[1][1] / max(-0.5 * (ca.z + cb.z), 0.3);
          float fs = clamp(dl * 0.5 / max(expect, 1e-3) * 5.0, 0.4, 1.0);
          p.xy += (nrm * position.y * halfPx + dir * (position.x * 2.0 - 1.0) * halfPx * 0.25) / uRes * 2.0 * p.w;
          gl_Position = p;
          // beat flare for phased elements: a chase that runs along the causeway once a bar
          // phase 2..3: a pulse that leaves the rider on every beat and runs ahead (phase = 2 + path distance / 4 beats)
          float fl = aW.z < 0.0 ? 0.0 : (aW.z < 1.5 ? exp(-7.0 * fract(uBeat * 0.25 - aW.z)) : exp(-6.0 * fract(uBeat * 1.25 - aW.z)));
          vL = vec4(position.y, aW.y, aW.w * gMul * fs * (1.0 + 1.3 * fl) * mix(1.0, 0.5, clamp(depth / 1500.0, 0.0, 1.0)), k);
          vP = mix(A, B, position.x);
          #ifdef USE_FOG
            vFogDepth = depth;
          #endif
        }`,
      fragmentShader: /* glsl */`
        varying vec4 vL; varying vec3 vP; uniform float uSplit;
        ${GLSL_INK} ${GLSL_FOG_PARS_F}
        void main() {
          float a = 1.0 - abs(vL.x);
          // a core ramp wide enough that a line held at the minimum width does not break into dots on a shallow slope
          float halo = a * a * a * 0.4, core = smoothstep(0.4, 0.85, a);
          vec3 c = ink(vL.y, vP.z);
          // key 2: every line a cyan and a magenta twin side by side
          vec3 twin = vL.x > 0.0 ? uInkA : uInkB;
          float tw = uSplit * step(vL.y, 1.5);
          c = mix(c, twin, tw);
          float coreT = mix(core, smoothstep(0.25, 0.5, a) * (1.0 - smoothstep(0.82, 0.97, a)), tw);
          vec3 col = (c * (halo + coreT * 0.95) * mix(vL.w, 1.0, vL.w * 0.5) + vec3(1.0) * coreT * mix(0.75, 0.35, tw) * vL.w * vL.w * vL.w) * vL.z;
          ${GLSL_FOG_ADD}
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = opt.renderOrder ?? 3;
    return mesh;
  }
  return { add, build, count: () => A.length / 3 };
}

// ---------------------------------------------------------------- phosphor afterimage (no render target)
// A second draw of a line batch's own instances: each near line drags a fading sheet from where it is to where it
// was on the display a moment ago (uVel = eye velocity x persistence, in the batch's own space). Lines that run
// along the direction of travel make an empty sheet, so only what crosses the frame leaves a trail.
export function makeTrail(U, lineMesh, opt = {}) {
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aA, aB; attribute vec4 aW;
      uniform vec3 uVel; uniform float uBeat, uTrail;
      varying vec3 vT; varying vec3 vP;
      ${GLSL_FOG_PARS_V}
      ${opt.pre || ''}
      void main() {
        vec3 A = aA, B = aB; float gMul = 1.0;
        ${opt.xform || ''}
        float t = position.y * 0.5 + 0.5;
        vec4 mid = modelViewMatrix * vec4((A + B) * 0.5, 1.0);
        float g = aW.w * gMul * uTrail * (1.0 - smoothstep(55.0, 120.0, length(mid.xyz)));
        vec3 P = mix(A, B, position.x);
        vec4 mv = modelViewMatrix * vec4(P + uVel * t, 1.0);
        gl_Position = g < 0.004 ? vec4(2.0, 2.0, 2.0, 1.0) : projectionMatrix * mv;
        vT = vec3(t, aW.y, g); vP = P;
        #ifdef USE_FOG
          vFogDepth = max(-mv.z, 0.0);
        #endif
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vT; varying vec3 vP;
      ${GLSL_INK} ${GLSL_FOG_PARS_F}
      void main() {
        float f = 1.0 - vT.x;
        vec3 col = ink(vT.y, vP.z) * (f * f * vT.z);
        ${GLSL_FOG_ADD}
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const mesh = new THREE.Mesh(lineMesh.geometry, mat); mesh.frustumCulled = false; mesh.renderOrder = (opt.renderOrder ?? 3) - 0.1;
  return mesh;
}

// ---------------------------------------------------------------- decks (dark fills with painted lines)
// vertex data: position, aR = (across metres, along metres, kind)
//   kind 0 our strand top, 1 oncoming strand top, 2 undersides and edges, 3 boulevard top, 4 plain fill
function makeDeck(U) {
  const P = [], R = [], I = [];
  function quad(a, b, c, d, ra, rb, rc, rd, kind) { // a,b at s0 ; c,d at s1 (a-b across)
    const n = P.length / 3;
    P.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z, d.x, d.y, d.z);
    R.push(ra[0], ra[1], kind, rb[0], rb[1], kind, rc[0], rc[1], kind, rd[0], rd[1], kind);
    I.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
  }
  function build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
    g.setAttribute('aR', new THREE.BufferAttribute(new Float32Array(R), 3));
    g.setIndex(I);
    const mat = new THREE.ShaderMaterial({
      uniforms: U, fog: true, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        attribute vec3 aR; varying vec3 vR; varying vec3 vP; varying float vD; varying float vPx;
        uniform vec2 uRes;
        ${GLSL_FOG_PARS_V}
        void main() {
          vR = aR; vP = position;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vD = -mv.z;
          vPx = 2.0 / max(projectionMatrix[1][1] * uRes.y, 1.0);   // the angle one pixel covers
          gl_Position = projectionMatrix * mv;
          #ifdef USE_FOG
            vFogDepth = -mv.z;
          #endif
        }`,
      fragmentShader: /* glsl */`
        varying vec3 vR; varying vec3 vP; varying float vD; varying float vPx;
        uniform vec3 uFill, uHaze, uEye; uniform float uBeat, uBeatLen, uGantryZ;
        ${GLSL_INK} ${GLSL_WET} ${GLSL_FOG_PARS_F}
        float hash1(float n) { return fract(sin(n * 127.1) * 43758.5453); }
        // one gantry in its own plane, p = (|x|, height above the deck): distance to its five nested chevrons
        float sdSeg2(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; return length(pa - ba * clamp(dot(pa, ba) / max(dot(ba, ba), 1e-4), 0.0, 1.0)); }
        float chevD(vec2 p, float n) {
          float w = 17.3 - n * 1.4; vec2 sh = vec2(w, 14.0 - n * 1.7);
          return min(sdSeg2(p, vec2(w, 0.0), sh), sdSeg2(p, sh, vec2(0.0, 25.0 - n * 2.2)));
        }
        float gantryD(vec2 p) { return min(min(min(chevD(p, 0.0), chevD(p, 1.0)), min(chevD(p, 2.0), chevD(p, 3.0))), chevD(p, 4.0)); }
        // gantry k mirrored in the wet deck: the view ray, reflected about the deck, meets the gantry's plane
        float gantryRefl(vec3 dv, float k) {
          float zg = uGantryZ + k * uBeatLen, t = max((zg - vP.z) / min(dv.z, -1e-3), 0.0);
          vec2 hp = vec2(abs(vP.x + dv.x * t), max(-dv.y, 0.0) * t);
          float wr = length(dv) * (1.0 + t) * vPx;
          float fl = exp(-7.0 * fract(uBeat * 0.25 - (11.0 - k) / 12.0));
          return lineP(gantryD(hp), wr, 0.22) * (0.55 + 1.3 * fl) * step(-0.5, k) * step(k, 11.5) * (1.0 - smoothstep(25.0, 29.0, hp.y));
        }
        void main() {
          float x = vR.x, s = vR.y, kind = vR.z;
          float wx = fwidth(x), ws = fwidth(s);
          float dim = mix(1.0, 0.36, clamp(vD / 1500.0, 0.0, 1.0));
          vec3 col = mix(uFill, uHaze * 0.16, clamp(vD / 2200.0, 0.0, 1.0));
          vec3 cA = ink(0.0, vP.z), cB = ink(1.0, vP.z);
          float pitch = uBeatLen * 0.25;
          // the kerb's white core is kept for our own strand close by; further off and on the other strand it is capped
          float kcap = kind < 0.5 ? mix(1.0, 0.7, smoothstep(50.0, 180.0, vD)) : 0.7;
          float wfade = 1.0 - smoothstep(40.0, 260.0, vD);
          // a strand seen edge-on squeezes all its paint into a few pixels: fade it instead of letting it add up to white
          if (kind < 2.5) dim *= 1.0 - 0.72 * smoothstep(0.35, 1.6, wx);
          if (kind < 1.5) {
            float kerb = min(lineP(abs(abs(x) - 3.25), wx, 0.14), kcap);
            col += hot(cA, kerb) * dim;
            float lane = lineP(abs(abs(x) - 2.85), wx, 0.05) * 0.35;
            col += cA * lane * dim;
            // centre dashes, four to the beat
            float ds = fract(s / pitch);
            float dash = lineP(abs(x), wx, 0.11) * step(ds, 0.42) * smoothstep(0.0, 0.02, ds);
            col += (mix(cA, vec3(1.0), 0.3) * dash * 1.15) * dim;
            // dotted guides either side of the dashes, so the deck streaks under the wheel
            float gd = lineP(abs(abs(x) - 1.5), wx, 0.04) * 0.45 * step(0.5, fract(s / (pitch * 0.5))) * (1.0 - smoothstep(150.0, 400.0, vD));
            col += cA * gd * dim;
            // the wet strand: the hoops' light lying on it as broken strokes, and our headlamp's amber on our own
            col += (cB * 0.5 * wetStreak(x, s, wx, ws, uBeat, 0.5, 4.0, 3.0) + cA * 0.32 * wetStreak(x + 0.3, s + 2.0, wx, ws, uBeat, 1.1, 7.0, 11.0)) * wfade * dim * step(abs(x), 3.1);
            if (kind < 0.5) col += uAmber * 0.42 * wetLamp(x, s, wx, ws, vD) * step(abs(x), 3.1);
            if (kind > 0.5) {
              // oncoming traffic: pairs of headlight dashes streaming toward the headland
              float gap = uBeatLen * 3.0;
              float q = (s + uBeat * uBeatLen * 0.75) / gap;
              float cell = floor(q), f = fract(q) * gap;
              float on = step(0.15, hash1(cell));
              float lx = -1.7 + (hash1(cell + 7.0) - 0.5) * 0.6;
              float hd = lineP(abs(abs(x - lx) - 0.62), wx, 0.13) * (1.0 - smoothstep(4.5, 6.0, f)) * smoothstep(0.0, 0.4, f) * on;
              float fan = (1.0 - smoothstep(0.0, 1.9, abs(x - lx))) * smoothstep(34.0, 6.0, f) * step(6.0, f) * on * 0.16;
              col += hot(cA, hd) * 1.25 * dim + cA * fan * dim;
            }
          } else if (kind < 2.5) {
            float kerb = min(lineP(abs(abs(x) - 3.25), wx, 0.14), kcap);
            float rib = lineP(abs(fract(s / pitch + 0.5) - 0.5) * pitch, ws, 0.09) * 0.4;
            float spine = lineP(abs(x), wx, 0.07) * 0.5;
            col += hot(cA, kerb) * 0.8 * dim + cA * (rib + spine) * dim;
          } else if (kind < 3.5) {
            // boulevard: kerbs, carriageway edges, dashes handing over from the two strands to the centre
            float kerb = lineP(abs(abs(x) - 17.1), wx, 0.16);
            float inner = lineP(abs(abs(x) - 10.5), wx, 0.07) * 0.5 * (1.0 - smoothstep(250.0, 350.0, s));
            float ds = fract(s / pitch), dmask = step(ds, 0.42) * smoothstep(0.0, 0.02, ds);
            float dSide = lineP(abs(abs(x) - 14.0), wx, 0.11) * dmask * (1.0 - smoothstep(200.0, 350.0, s));
            float dMid = lineP(abs(x), wx, 0.12) * dmask * smoothstep(120.0, 300.0, s);
            float lanes = lineP(abs(abs(x) - 7.0), wx, 0.06) * 0.7 * smoothstep(250.0, 350.0, s);
            // dotted guides along the carriageways (lines that streak, never a grid)
            float hs = fract(s / (pitch * 0.5));
            lanes += (lineP(abs(abs(x) - 3.5), wx, 0.045) * step(hs, 0.5) + lineP(abs(abs(x) - 12.2), wx, 0.045) * step(0.5, hs)) * 0.5 * (1.0 - smoothstep(180.0, 450.0, vD));
            lanes += lineP(abs(abs(x) - 15.6), wx, 0.05) * 0.4;
            float joint = lineP(abs(fract(s / uBeatLen + 0.5) - 0.5) * uBeatLen, ws, 0.08) * 0.3 * step(abs(x), 17.1);
            col += hot(cA, kerb) * dim + cA * (inner + lanes + joint) * dim + (mix(cA, vec3(1.0), 0.3) * max(dSide, dMid) * 1.15) * dim;
            float cb = floor(s / uBeatLen), cs = s - cb * uBeatLen;
            float chev = lineP(abs(cs - 14.0 + abs(x) * 0.7) * 0.82, max(ws, wx), 0.16) * step(abs(x), 8.5) * step(0.6, abs(x)) * smoothstep(300.0, 380.0, s);
            col += cA * chev * (0.5 + 1.3 * exp(-6.0 * fract(uBeat * 0.25 - cb / 16.0))) * dim;
            float gap = uBeatLen * 3.0;
            float q = (s + 1020.0 + uBeat * uBeatLen * 0.75) / gap;
            float cell = floor(q), f = fract(q) * gap;
            float on = step(0.15, hash1(cell));
            float lx = -mix(14.0, 7.0, smoothstep(200.0, 350.0, s)) - 1.7 + (hash1(cell + 7.0) - 0.5) * 0.6;
            float hd = lineP(abs(abs(x - lx) - 0.62), wx, 0.13) * (1.0 - smoothstep(4.5, 6.0, f)) * smoothstep(0.0, 0.4, f) * on;
            col += hot(cA, hd) * 1.25 * dim;
            // the wet boulevard: tower-window light as streaks down both sides, the next two gantries mirrored as
            // broken chevrons, and the headlamp's amber under the wheel
            float side = smoothstep(7.5, 10.0, abs(x)) * step(abs(x), 16.9);
            col += (cB * mix(0.3, 0.52, side) * wetStreak(x, s, wx, ws, uBeat, 0.6, 4.5, 5.0) + cA * mix(0.12, 0.3, side) * wetStreak(x + 0.4, s + 3.0, wx, ws, uBeat, 1.3, 7.0, 17.0)) * wfade * dim * step(abs(x), 16.9);
            vec3 dv = vP - uEye;
            float kg = floor((vP.z - uGantryZ) / uBeatLen);
            float brk = mix(step(0.35, fract(s / 1.7 + hash1(floor(x / 0.9)))), 0.65, smoothstep(0.5, 1.6, ws));
            col += cB * 0.6 * (gantryRefl(dv, kg) + gantryRefl(dv, kg - 1.0)) * brk * (1.0 - smoothstep(60.0, 320.0, vD)) * step(abs(x), 16.9);
            col += uAmber * 0.42 * wetLamp(vP.x - uEye.x, s, wx, ws, vD);
          }
          ${GLSL_FOG_MIX}
          gl_FragColor = vec4(col, 1.0);
        }`,
    });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
    return mesh;
  }
  return { quad, build, tris: () => I.length / 3 };
}

// ---------------------------------------------------------------- the corkscrew
function buildCauseway(frames, lines, deck, beatLen, rng, strLines, rungLines, beatOffset) {
  const DS = 4, n = Math.round(LEN / DS), hw = STRAND_W / 2, th = 0.55;
  const v = () => new THREE.Vector3();
  const at = (f, lat, up) => v().copy(f.axis).addScaledVector(f.r, lat).addScaledVector(f.u, up);
  let prev = frames.ladder(0);
  for (let i = 1; i <= n; i++) {
    const s0 = (i - 1) * DS, s1 = i * DS, cur = frames.ladder(s1);
    for (let k = 0; k < 2; k++) {
      const c = k === 0 ? STRAND_R : -STRAND_R, kind = k;
      // lateral coordinate across the strand is measured so that +x is always the rider's right
      const a0 = at(prev, c - hw, 0), b0 = at(prev, c + hw, 0), a1 = at(cur, c - hw, 0), b1 = at(cur, c + hw, 0);
      const e0 = at(prev, c - hw, -th), f0 = at(prev, c + hw, -th), e1 = at(cur, c - hw, -th), f1 = at(cur, c + hw, -th);
      deck.quad(a0, b0, a1, b1, [-hw, s0], [hw, s0], [-hw, s1], [hw, s1], kind);
      deck.quad(e0, f0, e1, f1, [-hw, s0], [hw, s0], [-hw, s1], [hw, s1], 2);
      deck.quad(a0, e0, a1, e1, [-3.25, s0], [-3.25, s0], [-3.25, s1], [-3.25, s1], 2);
      deck.quad(b0, f0, b1, f1, [3.25, s0], [3.25, s0], [3.25, s1], [3.25, s1], 2);
    }
    prev = cur;
  }
  // long lines: guard rails on every kerb and four helical stringers through the hoops
  const DL = 8.5, nl = Math.round(LEN / DL);
  let fp = frames.ladder(0);
  for (let i = 1; i <= nl; i++) {
    const fc = frames.ladder(i * DL);
    // the rails stand a hand below the rider's eye, so all four fall on the horizon: only our outer one is drawn firmly
    for (const [c, gn] of [[STRAND_R - hw - 0.15, 0.4], [STRAND_R + hw + 0.15, 0.5], [-STRAND_R - hw - 0.15, 0.28], [-STRAND_R + hw + 0.15, 0.28]]) {
      lines.add(at(fp, c, 0.95), at(fc, c, 0.95), 0.22, 0, -1, gn);
    }
    // stringers at the ladder's sides, crown and keel: none hangs over either strand
    for (let j = 0; j < 4; j++) {
      const a = j * Math.PI / 2, ca = Math.cos(a) * HOOP_R, sa = Math.sin(a) * HOOP_R;
      strLines.add(at(fp, ca, sa), at(fc, ca, sa), 0.3, 1, -1, 0.5);
    }
    fp = fc;
  }
  // rungs four to the beat with a zig-zag lattice between them; rail posts at every rung
  const pitch = beatLen / 4, nr = Math.floor((LEN - 4) / pitch), inner = STRAND_R - hw;
  let fprev = null;
  for (let i = 1; i <= nr; i++) {
    const s = i * pitch, f = frames.ladder(s);
    // each rung answers a pulse that leaves the rider on the beat and runs down the ladder
    rungLines.add(at(f, -inner, -0.28), at(f, inner, -0.28), 0.4, 0, 2 + ((((beatOffset + s / beatLen) / 4) % 1) + 1) % 1, 0.6);
    if (fprev) {
      const sg = i % 2 ? 1 : -1;
      rungLines.add(at(fprev, -inner * sg, -0.28), at(f, inner * sg, -0.28), 0.2, 1, -1, 0.35);
    }
    for (const c of [STRAND_R + hw + 0.15, -STRAND_R - hw - 0.15]) lines.add(at(f, c, -0.3), at(f, c, 0.95), 0.2, 0, -1, 0.7);
    fprev = f;
  }
  // truss hoops, one per beat: two concentric 16-gons, webbing, and ties to the strands
  const nh = Math.floor((LEN - 10) / beatLen), hoops = [];
  for (let i = 1; i <= nh; i++) {
    const s = i * beatLen, f = frames.ladder(s), ph = (i / nh) % 1, N = 16, r2 = HOOP_R + 2.2;
    hoops.push(s);
    for (let j = 0; j < N; j++) {
      const a0 = (j / N) * Math.PI * 2 + Math.PI / N, a1 = ((j + 1) / N) * Math.PI * 2 + Math.PI / N, am = (a0 + a1) / 2;
      const p0 = at(f, Math.cos(a0) * HOOP_R, Math.sin(a0) * HOOP_R), p1 = at(f, Math.cos(a1) * HOOP_R, Math.sin(a1) * HOOP_R);
      const q0 = at(f, Math.cos(a0) * r2, Math.sin(a0) * r2), q1 = at(f, Math.cos(a1) * r2, Math.sin(a1) * r2);
      lines.add(p0, p1, 0.5, 1, ph, 1.0);
      lines.add(q0, q1, 0.32, 1, ph, 0.7);
      lines.add(p0, q0, 0.22, 1, ph, 0.55);
      lines.add(p0, at(f, Math.cos(am) * r2, Math.sin(am) * r2), 0.16, 1, ph, 0.3);
    }
    for (const sg of [1, -1]) {
      lines.add(at(f, sg * (STRAND_R + hw), -0.28), at(f, sg * HOOP_R, -0.28), 0.34, 1, ph, 0.9);
      lines.add(at(f, sg * (STRAND_R - hw), -0.28), at(f, sg * HOOP_R * 0.707, -HOOP_R * 0.707), 0.2, 1, ph, 0.5);
      lines.add(at(f, sg * (STRAND_R + hw), -0.28), at(f, sg * HOOP_R * 0.707, -HOOP_R * 0.707), 0.2, 1, ph, 0.5);
    }
  }
  return { hoops };
}

// ---------------------------------------------------------------- the Equaliser City
function layoutCity(rng, style = 0) {
  // the song shapes the skyline: four-on-the-floor is the brief's crescent; half-time has fewer, fatter towers in a
  // tighter, deeper crescent; the broken beat a shallower, wider one of slim towers
  const R = rng.range(870, 930), zc = rng.range(770, 840) + (style === 1 ? -150 : style === 2 ? 170 : 0), Ri = zc, zo = -150 - (R - 900);
  let list = [], pitch = style === 1 ? 74 : 60;
  for (; pitch < 100; pitch += 2) {
    list = [];
    const z0 = -18 - rng.range(0, 6);
    for (let k = 0; 41 + pitch * k < R + 20; k++) {
      for (const sg of [1, -1]) {
        const x = sg * (41 + pitch * k);
        for (let j = -12; j < 30; j++) {
          const z = z0 - pitch * j;
          if (z < -1040 || Math.hypot(x, z - zo) > R || Math.hypot(x, z - zc) < Ri + 22) continue;
          if (x < 0 && x > -41 - pitch * 1.5 && z < -520) continue; // left row thins so the sun shows from the boulevard
          list.push({ x, z, k: sg * (k + 1), front: Math.hypot(x, z - zc) - Ri });
        }
      }
    }
    if (list.length <= 310) break;
  }
  const cols = [...new Set(list.map((t) => t.x))].sort((a, b) => a - b);
  for (const t of list) {
    t.col = cols.indexOf(t.x);
    t.w = style === 1 ? rng.range(32, 37) : style === 2 ? rng.range(23, 29) : rng.range(27, 32);
    t.gain = (0.85 + 0.15 * smoothstep(0, 420, t.front)) * rng.range(0.9, 1);
    if (t.front < 120) t.gain = 1;   // the row nearest the causeway hits full height
    t.x += rng.range(-2.5, 2.5); t.z += rng.range(-4, 4);
  }
  return { list, nc: cols.length, pitch };
}

function buildCity(U, city) {
  const box = new THREE.BoxGeometry(1, 1, 1, 1, 8, 1);
  const g = new THREE.InstancedBufferGeometry();
  g.setIndex(box.index); g.setAttribute('position', box.attributes.position); g.setAttribute('normal', box.attributes.normal); g.setAttribute('uv', box.attributes.uv);
  const n = city.list.length, aT = new Float32Array(n * 8), aU = new Float32Array(n * 8);
  city.list.forEach((t, i) => {
    for (let kind = 0; kind < 2; kind++) {
      const o = (i * 2 + kind) * 4;
      aT[o] = t.x; aT[o + 1] = t.z; aT[o + 2] = t.w; aT[o + 3] = t.gain;
      aU[o] = t.col; aU[o + 1] = kind; aU[o + 2] = (i * 0.618034) % 1; aU[o + 3] = t.col / Math.max(1, city.nc - 1);
    }
  });
  g.setAttribute('aT', new THREE.InstancedBufferAttribute(aT, 4));
  g.setAttribute('aU', new THREE.InstancedBufferAttribute(aU, 4));
  g.instanceCount = n * 2;
  const mk = (mirror) => new THREE.ShaderMaterial({
    uniforms: U, fog: true, side: THREE.DoubleSide, defines: mirror ? { MIRROR: 1 } : {},
    vertexShader: /* glsl */`
      attribute vec4 aT, aU;
      uniform vec2 uLv[${NCMAX}]; uniform float uBeat;
      varying vec3 vF; varying vec4 vI; varying vec3 vP; varying float vDist; flat varying vec2 vS; varying float vFarK;
      ${GLSL_FOG_PARS_V}
      void main() {
        vec2 lv = uLv[int(aU.x + 0.5)];
        // the level is shaped so quiet bands sit near the 40 m base and loud ones reach 260 m
        float l = clamp(lv.x * aT.w * 1.25, 0.0, 1.0), lp = clamp(lv.y * aT.w * 1.25, 0.0, 1.0);
        float h = 30.0 + 300.0 * l * l;
        float pk = 30.0 + 300.0 * lp * lp + 9.0;
        // the peak-hold bar is thicker far away so the analyser reads across the bay
        float farK = smoothstep(380.0, 700.0, length((modelViewMatrix * vec4(aT.x, pk, aT.y, 1.0)).xyz));
        vS = aU.zw;
        float y01 = position.y + 0.5, top = step(0.5, abs(normal.y));
        float W = aU.y < 0.5 ? aT.z : aT.z + 3.0;
        float H = aU.y < 0.5 ? h : mix(2.6, 5.0, farK);
        vec3 p = vec3(position.x * W, (aU.y < 0.5 ? 0.0 : pk) + y01 * H, position.z * W);
        vI = vec4(H, aU.y, 0.0, W * 0.5); vFarK = farK;
        vF = vec3((uv.x - 0.5) * W, top > 0.5 ? (uv.y - 0.5) * W : y01 * H, top);
        #ifdef MIRROR
          float dep = p.y;
          p.y = -dep;
          p.x += sin(dep * 0.085 - uBeat * 1.5708 + aT.y * 0.013) * min(7.0, 0.4 + dep * 0.035);
          vI.z = dep;
        #endif
        p.xz += aT.xy;
        vP = p;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDist = length(mv.xyz);
        gl_Position = projectionMatrix * mv;
        #ifdef USE_FOG
          vFogDepth = -mv.z;
        #endif
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vF; varying vec4 vI; varying vec3 vP; varying float vDist; flat varying vec2 vS; varying float vFarK;
      uniform vec3 uFill, uHaze; uniform float uBeat, uCityGain;
      ${GLSL_INK} ${GLSL_FOG_PARS_F}
      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        float dist = vDist;
        float top = vF.z, peak = vI.y;
        float wu = fwidth(vF.x), wv = fwidth(vF.y);
        float eu = vI.w - abs(vF.x);
        float ev = top > 0.5 ? vI.w - abs(vF.y) : min(vF.y + 2.0 * (1.0 - peak), vI.x - vF.y);
        float edge = max(lineP(eu, wu, 0.42), lineP(ev, wv, 0.42));
        float far = clamp(dist / 1500.0, 0.0, 1.0);
        // analyser segments: a line every 20 m of height, and a cross on the roof
        float seg = lineP(abs(fract(vF.y / 20.0 + 0.5) - 0.5) * 20.0, wv, 0.16) * (1.0 - top) * (1.0 - peak);
        float near = 1.0 - smoothstep(240.0, 420.0, dist);
        seg *= mix(0.34, 0.5, near) * (1.0 - smoothstep(0.35, 0.8, far));
        float mull = lineP(abs(vF.x), wu, 0.12) * (1.0 - top) * (1.0 - peak) * mix(0.16, 0.3, near) * (1.0 - smoothstep(0.2, 0.5, far));
        // close towers glow: quarter mullions, two window cells in five lit (stepping with the tower's band), their panes
        // filled in one of the two inks or, rarely, amber
        float sideF = (1.0 - top) * (1.0 - peak), nearW = 1.0 - smoothstep(300.0, 650.0, dist);
        float qm = lineP(abs(abs(vF.x) - vI.w * 0.5), wu, 0.09) * sideF * 0.2 * near;
        vec2 wc = vec2(vF.x / (vI.w * 0.5), vF.y / 10.0), ci = floor(wc), cf = abs(fract(wc) - 0.5);
        float rate = vS.y < 0.34 ? 1.0 : (vS.y < 0.67 ? 2.0 : 4.0);
        float lit = step(0.6, h21(ci + vS.x * 91.0 + floor(uBeat * rate + vS.x * 4.0) * 0.37));
        float wd = max((cf.x - 0.3) * vI.w * 0.5, (cf.y - 0.3) * 10.0);
        float win = (lineP(abs(wd), max(wu, wv), 0.1) * 0.75 + step(wd, 0.0) * 0.32) * lit * sideF * nearW;
        float wh = h21(ci * 1.37 + vS.x * 57.0);
        vec3 winC = wh < 0.6 ? ink(0.0, vP.z) : (wh < 0.9 ? ink(1.0, vP.z) : uAmber * 0.6);
        // the tower as a lit level meter: a faint wash below the level, and the top 20 m segment hatched, flaring on the beat
        float topSeg = step(vI.x - 20.0, vF.y);
        float hatch = lineP(abs(fract(vF.y / 4.0) - 0.5) * 4.0, wv, 0.11) * (1.0 - smoothstep(0.8, 2.0, wv));
        float wash = (0.045 + topSeg * (0.03 + hatch * (0.2 + 0.35 * exp(-5.0 * fract(uBeat + vS.x))))) * sideF * nearW;
        // one tower in five carries a sign: a lit panel with two bars that step on the beat
        float sgn = step(0.8, h21(vS.xx * 7.3 + 0.5)) * sideF * nearW;
        vec2 sp = vec2(vF.x / max(vI.w * 2.0, 1.0), (vF.y - 28.0) / 30.0);          // -0.25..0.25 across, 0..1 up
        float inP = step(abs(sp.x), 0.25) * step(0.0, sp.y) * step(sp.y, 1.0);
        float sedge = lineP((0.25 - abs(sp.x)) * vI.w * 2.0, wu, 0.14) + lineP(min(sp.y, 1.0 - sp.y) * 30.0, wv, 0.14);
        float bi = floor(sp.y * 2.0), bl = 0.3 + 0.7 * h21(vec2(bi + vS.x * 13.0, floor(uBeat + vS.x * 3.0)));
        float bar = step(abs(fract(sp.y * 2.0) - 0.5), 0.16) * step(sp.x + 0.2, 0.4 * bl) * step(-0.2, sp.x);
        float sign = sgn * inP * (0.2 + min(sedge, 1.0) * 0.7 + bar * 0.9);
        win *= 1.0 - sgn * inP;
        float roof = top * (1.0 - peak) * lineP(abs(abs(vF.x) - abs(vF.y)) * 0.707, max(wu, wv), 0.14) * 0.4;
        vec3 c = ink(peak > 0.5 ? 0.0 : 1.0, vP.z);
        float dim = mix(1.0, 0.75, far) * uCityGain;
        vec3 fill = mix(uFill, uHaze * 0.2, smoothstep(0.1, 1.3, far));
        // the far skyline is thinned to outlines; they are lifted a little so the analyser still reads across the bay
        vec3 col = fill + (hot(c, edge) * mix(1.0, mix(1.25, 1.8, vFarK), peak) * mix(1.0, 1.3, smoothstep(0.2, 0.55, far)) + c * (seg + mull + qm + roof + wash + sign) + winC * win) * dim;
        #ifdef MIRROR
          // the reflection breaks into the sea's lines: horizontal strips that widen with depth
          float strip = smoothstep(-0.15, 0.35, sin(vI.z * 0.42 + sin(vP.x * 0.02 + uBeat * 0.785) * 1.4 - uBeat * 0.785));
          float fall = exp(-vI.z / 260.0);
          col = uFill * 0.7 + (col - fill) * mix(0.25, 1.0, strip) * fall;
        #endif
        ${GLSL_FOG_MIX}
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const real = new THREE.Mesh(g, mk(false)); real.frustumCulled = false;
  const mirror = new THREE.Mesh(g, mk(true)); mirror.frustumCulled = false; mirror.renderOrder = -0.4;
  return { real, mirror, tris: n * 2 * (box.index.count / 3) };
}

// ---------------------------------------------------------------- the sea of sine lines
function seaField(x, z, beat) {
  const sx = -1500 + 3000 * ((((beat * 0.25) % 1) + 1) % 1);
  return z + 2.2 * Math.sin(x * 0.021 + beat * 0.8) + 1.4 * Math.sin(x * 0.047 - z * 0.013 - beat * 1.3)
    + 5.0 * Math.exp(-Math.pow((x - sx) / 170, 2)) + beat * 1.5;
}
function buildSea(U, radius, fillColor) {
  const floor = new THREE.Mesh(new THREE.CircleGeometry(radius, 48).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: fillColor.clone().multiplyScalar(0.8), depthWrite: false, fog: true }));
  floor.position.set(0, -0.05, 300); floor.renderOrder = -0.5; floor.frustumCulled = false;
  const mat = new THREE.ShaderMaterial({
    uniforms: U, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      varying vec3 vP; varying vec3 vW;
      ${GLSL_FOG_PARS_V}
      void main() {
        vP = position; vP.z += 300.0;
        vec4 w = modelMatrix * vec4(position, 1.0); vW = vec3(vP.x, 0.03, vP.z);
        vec4 mv = viewMatrix * w;
        gl_Position = projectionMatrix * mv;
        #ifdef USE_FOG
          vFogDepth = -mv.z;
        #endif
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vP; varying vec3 vW;
      uniform float uBeat; uniform vec3 uHaze, uSunDir, uEye;
      ${GLSL_INK} ${GLSL_FOG_PARS_F}
      float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main() {
        float x = vP.x, z = vP.z;
        float sx = -1500.0 + 3000.0 * fract(uBeat * 0.25);
        float sw = (x - sx) / 170.0;
        float q = z + 2.2 * sin(x * 0.021 + uBeat * 0.8) + 1.4 * sin(x * 0.047 - z * 0.013 - uBeat * 1.3)
          + 5.0 * exp(-sw * sw) + uBeat * 1.5;
        float w = length(vec2(dFdx(q), dFdy(q)));
        float cellf = q / 6.0;
        float dd = (0.5 - abs(fract(cellf) - 0.5)) * 6.0;
        float l = lineP(dd, w, 0.15);
        float flatK = smoothstep(1.6, 4.5, w);
        l = mix(l, 0.2, flatK);
        vec3 toF = vW - uEye; float dist = length(toF);
        float dim = mix(1.0, 0.4, clamp(dist / 1500.0, 0.0, 1.0));
        vec3 base = mix(ink(1.0, z), uHaze, 0.5) * mix(0.85, 0.62, smoothstep(450.0, 800.0, dist));
        vec3 col = base * l * dim;
        // the swell is a brighter crest travelling left to right once a bar
        col += base * l * exp(-sw * sw) * 1.2 * dim;
        // the causeway's light lying on the water under it
        float uu = (x + sin(z * 0.05 + uBeat * 0.785) * 5.0) / 20.0;
        float under = exp(-uu * uu) * step(0.0, z) * (1.0 - smoothstep(940.0, 1040.0, z));
        col += ink(0.0, z) * l * under * 0.55 * dim;
        // amber glitter path under the sun
        vec2 dxz = toF.xz / max(length(toF.xz), 1e-3);
        vec2 sxz = uSunDir.xz / max(length(uSunDir.xz), 1e-3);
        float gl = smoothstep(0.9965, 0.9998, dot(dxz, sxz)) * smoothstep(80.0, 900.0, dist);
        float spark = step(0.62, hash2(vec2(floor(cellf + 0.5), floor(x / 9.0) + floor(uBeat * 2.0))));
        col += uAmber * l * gl * (0.12 + 1.9 * spark) * mix(1.0, 0.45, clamp(dist / 2500.0, 0.0, 1.0));
        ${GLSL_FOG_ADD}
        gl_FragColor = vec4(col, 1.0);
      }`,
  });
  const surf = new THREE.Mesh(new THREE.CircleGeometry(radius, 48).rotateX(-Math.PI / 2), mat);
  surf.position.set(0, 0.03, 300); surf.renderOrder = 1; surf.frustumCulled = false;
  return { floor, surf };
}

// ---------------------------------------------------------------- buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('corniche-hero') : makeRng(hashSeed('corniche-hero'));
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const rollDir = opts.rollDir ?? rng.sign();
  const beatLen = opts.beatLength ?? 42.5;
  const songStyle = opts.song ?? (rng.chance(0.5) ? 0 : rng.int(1, 2));
  const sunDir = new THREE.Vector3().fromArray(opts.sunDir ?? [-Math.sin(0.96), 0.07, -Math.cos(0.96)]).normalize();
  const inkGain = opts.inkGain ?? 1, cityGain = opts.cityGain ?? 1, beatOffset = opts.beatOffset ?? 30;
  const cyan = pal[4].clone().multiplyScalar(inkGain), magenta = pal[3].clone().multiplyScalar(inkGain);

  const lv = []; for (let i = 0; i < NCMAX; i++) lv.push(new THREE.Vector2(0.2, 0.3));
  const U = THREE.UniformsUtils.merge([THREE.UniformsLib.fog]);
  Object.assign(U, {
    uBeat: { value: 0 }, uBeatLen: { value: beatLen }, uRes: { value: new THREE.Vector2(800, 450) },
    uInkA: { value: cyan.clone() }, uInkB: { value: magenta.clone() }, uInkA2: { value: cyan.clone() }, uInkB2: { value: magenta.clone() },
    uAmber: { value: pal[6].clone() }, uWipeZ: { value: 1e9 }, uSplit: { value: 0 },
    uVel: { value: new THREE.Vector3() }, uTrail: { value: opts.trail ?? 0.14 }, uCityGain: { value: cityGain },
    uFill: { value: pal[0].clone() }, uHaze: { value: pal[2].clone() }, uSunDir: { value: sunDir }, uLv: { value: lv }, uEye: { value: new THREE.Vector3(0, 60, 1500) },
    uGantryZ: { value: opts.gantryZ ?? 1e6 },
  });

  const object = new THREE.Group(); object.name = 'corniche-120-hero';
  const frames = makeFrames(rollDir);
  const lines = makeLines(U), deck = makeDeck(U);
  // the stringers are their own batch: they fade by half close to the eye so they never rule a hard line through the sky
  const strLines = makeLines(U, { pre: /* glsl */`uniform vec3 uEye;`, xform: /* glsl */`{ gMul = mix(0.3, 1.0, smoothstep(40.0, 110.0, distance((A + B) * 0.5, uEye))); }` });
  // rungs and lattice lie in the ladder's plane, which the rider sees edge-on from 1.2 m above it: each fades as the
  // sight line grazes that plane, so the ladder does not stack up into a white bar (from the headland it is at full gain)
  const rungLines = makeLines(U, { pre: /* glsl */`uniform vec3 uEye;`, xform: /* glsl */`{
    vec3 n = cross(B - A, vec3(0.0, 0.0, -1.0)), v = (A + B) * 0.5 - uEye;
    float graze = abs(dot(v, n)) / max(length(n) * length(v), 1e-3);
    gMul = mix(0.3, 1.0, smoothstep(0.015, 0.12, graze));
  }` });
  buildCauseway(frames, lines, deck, beatLen, rng, strLines, rungLines, beatOffset);
  await ctx.yield?.();

  // the boulevard: an elevated deck on line pylons, straight to the portal seat
  {
    const V = (x, y, z) => new THREE.Vector3(x, y, z), hw = 17.5, th = 1.3, step = 52.3;
    const nseg = Math.round(BLVD / step);
    for (let i = 0; i < nseg; i++) {
      const s0 = (i / nseg) * BLVD, s1 = ((i + 1) / nseg) * BLVD;
      deck.quad(V(-hw, Y1, -s0), V(hw, Y1, -s0), V(-hw, Y1, -s1), V(hw, Y1, -s1), [-hw, s0], [hw, s0], [-hw, s1], [hw, s1], 3);
      deck.quad(V(-hw, Y1 - th, -s0), V(hw, Y1 - th, -s0), V(-hw, Y1 - th, -s1), V(hw, Y1 - th, -s1), [0, 0], [0, 0], [0, 0], [0, 0], 4);
      for (const sg of [1, -1]) {
        deck.quad(V(sg * hw, Y1, -s0), V(sg * hw, Y1 - th, -s0), V(sg * hw, Y1, -s1), V(sg * hw, Y1 - th, -s1), [0, 0], [0, 0], [0, 0], [0, 0], 4);
        lines.add(V(sg * (hw + 0.1), Y1 - th, -s0), V(sg * (hw + 0.1), Y1 - th, -s1), 0.3, 0, -1, 0.8);
        lines.add(V(sg * (hw + 0.1), Y1 + 0.6, -s0), V(sg * (hw + 0.1), Y1 + 0.6, -s1), 0.45, 0, -1, 0.6);
      }
    }
    // rail posts four to the beat, as on the causeway, so the rail streaks past
    for (let z = -beatLen / 4; z > -BLVD; z -= beatLen / 4) for (const sg of [1, -1]) lines.add(V(sg * (hw + 0.1), Y1, z), V(sg * (hw + 0.1), Y1 + 0.6, z), 0.2, 0, -1, 0.7);
    for (let z = -beatLen; z > -BLVD; z -= beatLen * 2) {
      for (const sg of [1, -1]) {
        lines.add(V(sg * 13, Y1 - th, z), V(sg * 16, 0, z), 0.4, 1, -1, 0.7);
        lines.add(V(sg * 13, Y1 - th, z), V(sg * 10, 0, z), 0.4, 1, -1, 0.7);
      }
      lines.add(V(-17.5, Y1 - th, z), V(17.5, Y1 - th, z), 0.3, 1, -1, 0.6);
    }
    // threshold bars where the ladder meets the deck and at the far end
    lines.add(V(-17.5, Y1 + 0.02, 0), V(17.5, Y1 + 0.02, 0), 0.4, 0, -1, 1);
  }
  const deckMesh = deck.build(); object.add(deckMesh);
  await ctx.yield?.();

  const city = layoutCity(rng, songStyle);
  const song = makeSong(rng, city.nc, songStyle);
  await ctx.yield?.();
  const cityMeshes = buildCity(U, city);
  object.add(cityMeshes.real);
  await ctx.yield?.();

  const wantSea = opts.sea !== false;
  if (wantSea) {
    const sea = buildSea(U, opts.seaRadius ?? 2600, pal[0]);
    object.add(sea.floor, cityMeshes.mirror, sea.surf);
  }
  const lineMesh = lines.build(); object.add(lineMesh, strLines.build(), rungLines.build());
  if (opts.trail !== 0) object.add(makeTrail(U, lineMesh));
  await ctx.yield?.();

  // ---- anchors
  const eyeFrame = (s) => {
    const f = frames.ladder(clamp(s, 0, LEN));
    return { p: f.axis.clone().addScaledVector(f.r, STRAND_R).addScaledVector(f.u, EYE), up: f.u, tangent: f.t, roll: f.phi, axis: f.axis };
  };
  // the same without allocating: out = { p, up, tangent, axis } (Vector3s owned by the caller), out.roll is set
  const scratch = { axis: new THREE.Vector3(), t: new THREE.Vector3(), r: new THREE.Vector3(), u: new THREE.Vector3(), phi: 0 };
  function eyeFrameInto(s, out) {
    const f = frames.ladderInto(clamp(s, 0, LEN), scratch);
    out.p.copy(f.axis).addScaledVector(f.r, STRAND_R).addScaledVector(f.u, EYE);
    out.up.copy(f.u); out.tangent.copy(f.t); out.axis.copy(f.axis); out.roll = f.phi;
    return out;
  }
  const ride = [], flyThrough = [];
  for (let s = 0; s <= LEN; s += 10) { const f = eyeFrame(s); ride.push({ s, p: f.p.toArray(), up: f.up.toArray(), roll: f.roll }); if (s % 20 === 0) flyThrough.push(f.p.toArray()); }
  for (let z = -25; z > -BLVD - 4; z -= 25) flyThrough.push([STRAND_R * (1 - smoothstep(40, 350, -z)), Y1 + EYE, Math.max(z, -1050)]);
  flyThrough.push([0, Y1 + EYE, -1050]);
  const center = new THREE.Vector3(0, 60, 450);
  const anchors = {
    start: { position: eyeFrame(0).p.toArray(), direction: [0, 0, -1] },
    landfall: { position: eyeFrame(LEN).p.toArray(), direction: [0, 0, -1] },
    portalSeat: { position: [0, Y1 + EYE, -1050], facing: [0, 0, 1] },
    flyThrough, ride, frame: eyeFrame, frameInto: eyeFrameInto,
    rollStart: eyeFrame(340).p.toArray(), rollTop: eyeFrame(510).p.toArray(), rollEnd: eyeFrame(680).p.toArray(),
    viewpoints: { headland: [70, 78, 1420], rollTop: eyeFrame(510).p.toArray(), bay: [-760, 120, 620] },
    bounds: { min: [-930, 0, -1060], max: [930, 345, 1020] },
    corridor: 26, rollDir, beatLength: beatLen, song: songStyle, columns: city.nc, towers: city.list.length,
    seaLine: seaField,
  };

  // ---- clock and state
  let beatSet = false, beat = 0, energy = 1;
  const res = new THREE.Vector2();
  const setKey = (key = 0, next = key, wipeZ = 1e9) => {
    const k = (i) => (i === 1 ? [magenta, cyan] : [cyan, magenta]);
    U.uInkA.value.copy(k(key)[0]); U.uInkB.value.copy(k(key)[1]);
    U.uInkA2.value.copy(k(next)[0]); U.uInkB2.value.copy(k(next)[1]);
    U.uSplit.value = key === 2 ? 1 : 0; U.uWipeZ.value = wipeZ;
  };
  const invM = new THREE.Matrix4();
  const apply = () => { U.uBeat.value = beat; song.evaluate(beat, energy, lv); };
  apply();

  return {
    object, radius: 620, height: 270, center, anchors, uniforms: U,
    ground: false, groundY: 0,
    setBeat(b) { beatSet = true; beat = b; },
    setEnergy(e) { energy = clamp(e, 0, 1); },
    setKey,
    setProgress(u) { beatSet = true; beat = u * 80; },
    update(dt, time, camera) {
      if (!beatSet) beat = time * 2;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(res); if (res.x > 0) U.uRes.value.copy(res); }
      // the eye in the piece's own space (the world may roll the whole piece about the view axis)
      if (camera) { object.updateWorldMatrix(true, false); U.uEye.value.setFromMatrixPosition(camera.matrixWorld).applyMatrix4(invM.copy(object.matrixWorld).invert()); }
      apply();
    },
    dispose() { if (!wantSea) { cityMeshes.mirror.material.dispose(); } },
    stats: { deckTris: deck.tris(), lineInstances: lines.count(), towerTris: cityMeshes.tris },
  };
}
