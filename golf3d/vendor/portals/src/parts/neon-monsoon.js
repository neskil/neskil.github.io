// Hero set piece for "Neon Monsoon": THE KOI HOLOGRAM.
//
// A 120 m projected butterfly-koi made only of light: translucent scaled skin with a kohaku pattern,
// scanlines, a rolling sweep band, rare slice glitches, a ghost skeleton inside, long frayed fins that
// dissolve into pixels, eyes whose pupils follow the camera, and rain that only lights up while it is
// falling through the fish (body volume, dorsal and tail sheets), plus drifting light motes inside.
// Everything is additive (no depth write), so the camera can fly straight through any part of it and
// it can pass through skybridges and towers.
//
// LOCAL SPACE  origin on the street under the middle of the fish, +Y up. The koi swims toward +Z:
//   nose at z = +length/2, tail tips at z = -length/2, spine at y = opts.altitude. Its right flank is -X.
//   It swims on the spot (travelling body wave); translate/rotate hero.object to move it down the canyon.
//
// OPTS  { palette        brief palette (7 hex strings); [4] cyan rim, [5] magenta accent, [6] amber -> koi orange
//         length = 120   nose to tail tip, metres
//         altitude = 36  spine height above the origin (use 0 to put the origin on the spine)
//         intensity = 1  overall brightness multiplier
//         rain = 9000    number of rain/mote instances (2 triangles each)
//         streetGlow = true   soft additive smear of the koi's light on the street plane at y = 0.06
//         variety        'kohaku' | 'sanke' | 'tancho' | 'hi' (default: per seed) }
//   Per seed: variety, pattern layout, patch hue, fin length, girth, barbel length, swim tempo and phase.
//
// RETURNS  radius ~ length*0.55, height ~ altitude + length*0.2, center = (0, altitude, 0).
//   setProgress(u)  0 = not projected, 0..1 materialises nose to tail behind a bright scan edge, 1 = complete
//                   (default 1). Drive it from the world's path u so the fish "boots up" as the camera turns
//                   the dogleg; never from time.
//   setTurn(k)      -1..1 bends the whole spine sideways (k > 0: tail swings to +X) for rounding a corner.
//   uniforms        shared uniform table (uIntensity, uReveal, uTurn, uGlitch ...), streetGlow mesh, info.
//
// ANCHORS (local space, THREE.Vector3 unless noted)
//   swimDir       unit vector the fish faces (+Z).
//   nose, tailTip, eyeRight (-X flank), eyeLeft (+X flank), dorsalTop.
//   eyePass       the brief's "beside its eye at 25 m": 25 m out from the right eye, level with it.
//   tailCross     where the camera line pierces the tail fin (middle of the caudal fan).
//   flyThrough    ordered points for the camera: ahead of the nose on the right (-X) side, past eyePass,
//                 along the flank (>= 9 m outside the swinging skin), diagonally through the tail fan to the
//                 +X side and out behind. Nothing here is solid, so clearance is only a matter of taste.
//                 Mirror x for a pass on the other flank (the fish is symmetric).
//   viewpoints    { reveal, profile, astern }: good camera positions that hold the whole fish.
//   glowPoints    array of { position, color (hex), intensity, radius } along the spine for the world's
//                 wet-street / facade glow shader (nose to tail).
//   No portalSeat: in this world the portal stands at the end of the street, not on the fish.
//
// COST  ~64.5k triangles (3 x 12.3k body shells, 8.2k fins, 1.4k eyes, 18k rain at the default count,
//   2 decal), 7 draw calls, no textures, no lights, 50-100 ms build. All animation is in the vertex/fragment shaders.
// LIGHTING  wants a dark background (night city, fog) and bloom; it is self-lit and ignores scene lights.
//   Scene fog dims it (additive x (1 - 0.85 fog)), so it sinks into the haze with distance.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#07060f', '#1a1038', '#2b2f6a', '#12151c', '#00e5ff', '#ff2bd6', '#ffb300'];
const TAU = Math.PI * 2;

// ---------- body profile (mirrored exactly in GLSL: koiProf) ----------
// t = 0 at the nose, 1 at the end of the tail stalk. Returns half-width w, half-height h, centre height c.
function prof(P, t) {
  const tn = Math.min(t / 0.26, 1);
  const nose = Math.pow(Math.max(1 - Math.pow(1 - tn, 1.9), 1e-5), 0.72);
  const h = P.Hm * nose * (1 - 0.72 * Math.pow(Math.max(smoothstep(0.34, 1, t), 1e-5), 1.1));
  const w = P.Wm * Math.pow(nose, 1.15) * (1 - 0.86 * Math.pow(Math.max(smoothstep(0.25, 1, t), 1e-5), 1.05));
  const c = P.Hm * (0.2 * Math.sin(Math.PI * Math.pow(Math.max(t, 1e-5), 0.8)) - 0.16 * (1 - smoothstep(0, 0.32, t)));
  return { w, h, c };
}
// point on the skin: a = 0 on the +X flank, PI/2 on the back, -PI/2 on the belly
function skin(P, t, a, side = 1, inset = 0, out = new THREE.Vector3()) {
  const pr = prof(P, t), ca = Math.cos(a), sa = Math.sin(a), k = 1 - inset;
  const top = Math.max(sa, 0);
  return out.set(side * pr.w * ca * (1 - 0.2 * top * top) * k, pr.c + pr.h * sa * (sa < 0 ? 0.92 : 1) * k, P.L * 0.5 - t * P.Lb);
}

// ---------- shared GLSL ----------
const GLSL_COMMON = /* glsl */`
uniform float uTime, uLen, uSB, uHm, uWm, uTurn, uReveal, uPhase, uGlitch, uIntensity;
uniform vec4 uSwim;   // head amplitude, tail amplitude (fractions of length), waves along the body, angular speed
float pw(float x, float e){ return pow(max(x, 1.0e-5), e); }
float h11(float n){ return fract(sin(n*127.1)*43758.5453); }
float h21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x*p.y); }
float h31(vec3 p){ p = fract(p*0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
  return mix(mix(mix(h31(i), h31(i + vec3(1,0,0)), f.x), mix(h31(i + vec3(0,1,0)), h31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i + vec3(0,0,1)), h31(i + vec3(1,0,1)), f.x), mix(h31(i + vec3(0,1,1)), h31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a*vnoise(p); p = p*2.03 + vec3(11.3, 7.1, 3.7); a *= 0.5; } return s; }
// half-width, half-height, centre height of the body at t (0 nose .. 1 tail stalk)
vec3 koiProf(float t){
  float tn = min(t/0.26, 1.0);
  float nose = pw(1.0 - pw(1.0 - tn, 1.9), 0.72);
  float h = uHm*nose*(1.0 - 0.72*pw(smoothstep(0.34, 1.0, t), 1.1));
  float w = uWm*pw(nose, 1.15)*(1.0 - 0.86*pw(smoothstep(0.25, 1.0, t), 1.05));
  float c = uHm*(0.2*sin(3.14159265*pw(t, 0.8)) - 0.16*(1.0 - smoothstep(0.0, 0.32, t)));
  return vec3(w, h, c);
}
// lateral offset of the spine and its derivative at s (0 nose .. 1 tail tip)
vec2 koiSpine(float s){
  float sc = clamp(s, -0.1, 1.25);
  float A = uLen*(uSwim.x + uSwim.y*sc*sc), dA = uLen*2.0*uSwim.y*sc;
  float k = 6.2831853*uSwim.z, psi = k*s - uTime*uSwim.w + uPhase;
  float q = s - 0.3;
  return vec2(A*sin(psi) + 0.35*A*sin(psi*0.5 + 1.7) + uTurn*uLen*0.5*q*q,
              dA*sin(psi) + A*k*cos(psi) + 0.175*A*k*cos(psi*0.5 + 1.7) + uTurn*uLen*q);
}
float koiBob(){ return 0.9*sin(uTime*0.31 + uPhase*1.7); }
// rest position -> swimming position (cross-sections stay perpendicular to the spine)
vec3 koiBend(vec3 p, out float cs, out float sn){
  vec2 sp = koiSpine(0.5 - p.z/uLen);
  float th = atan(sp.y/uLen); cs = cos(th); sn = sin(th);
  return vec3(sp.x + p.x*cs, p.y + koiBob(), p.z + p.x*sn);
}
float koiGlitch(float y){
  float band = floor(y/2.6), tk = floor(uTime*7.0);
  return step(0.972, h21(vec2(band, tk)))*(h21(vec2(tk, band)) - 0.5)*uGlitch;
}
// materialisation front: visibility at s, and a bright scan edge while it is running
float koiVis(float s, out float edge){
  float f = uReveal*1.3 - 0.14;
  edge = exp(-abs(s - f)*42.0)*step(uReveal, 0.999)*step(0.001, uReveal);
  return 1.0 - smoothstep(f - 0.03, f, s);
}
`;
const GLSL_FRAG = /* glsl */`
float koiScan(float y){
  float fw = fwidth(y);
  float fine = 0.5 + 0.5*sin(y*7.854 - uTime*3.2);
  fine = mix(0.72, 0.45 + fine*fine*0.72, 1.0 - smoothstep(0.1, 0.36, fw));
  float coarse = 0.72 + 0.28*sin(y*1.2566 + uTime*1.1);
  float flick = 1.0 - 0.1*step(0.93, h11(floor(uTime*13.0)));
  return fine*coarse*flick;
}
// kohaku islands: warped low-frequency noise, mean 0.5
float koiPattern(vec3 q){
  q += 0.6*vec3(vnoise(q*1.7 + 4.1), vnoise(q*1.7 + 9.3), vnoise(q*1.7 + 1.7)) - 0.3;
  return 0.62*vnoise(q) + 0.28*vnoise(q*2.3 + 7.0) + 0.1*vnoise(q*5.1 + 13.0);
}
float koiSweep(float y){ return pw(0.5 + 0.5*sin(y*0.14 - uTime*0.8), 24.0); }
vec3 koiFog(vec3 col, float depth){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogF = 1.0 - exp(-fogDensity*fogDensity*depth*depth);
    #else
      float fogF = smoothstep(fogNear, fogFar, depth);
    #endif
    col *= 1.0 - 0.85*clamp(fogF, 0.0, 1.0);
  #endif
  return col;
}
`;

// ---------- geometry ----------
function buildBodyGeometry(P) {
  const NS = 128, NT = 48, W = NT + 1;
  const pos = new Float32Array((NS + 1) * W * 3), uv = new Float32Array((NS + 1) * W * 2), yc = new Float32Array((NS + 1) * W);
  const v = new THREE.Vector3();
  for (let i = 0; i <= NS; i++) {
    const u = i / NS, t = 0.35 * Math.pow(u, 2.2) + 0.65 * u;      // denser rings on the head
    const c = prof(P, t).c;
    for (let j = 0; j <= NT; j++) {
      const k = i * W + j;
      skin(P, t, (j / NT) * TAU, 1, 0, v);
      pos[k * 3] = v.x; pos[k * 3 + 1] = v.y; pos[k * 3 + 2] = v.z;
      uv[k * 2] = t; uv[k * 2 + 1] = j / NT; yc[k] = c;
    }
  }
  const idx = new Uint32Array(NS * NT * 6); let n = 0;
  for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) {
    const a = i * W + j, b = a + 1, c = a + W, d = c + 1;
    idx[n++] = a; idx[n++] = c; idx[n++] = b; idx[n++] = b; idx[n++] = c; idx[n++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aUV', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aYc', new THREE.BufferAttribute(yc, 1));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  const nr = g.attributes.normal.array;                               // weld the normals across the seam
  for (let i = 0; i <= NS; i++) {
    const a = (i * W) * 3, b = (i * W + NT) * 3;
    for (let c = 0; c < 3; c++) { const m = nr[a + c] + nr[b + c]; nr[a + c] = m; nr[b + c] = m; }
    const l = Math.hypot(nr[a], nr[a + 1], nr[a + 2]) || 1;
    for (let c = 0; c < 3; c++) { nr[a + c] /= l; nr[b + c] /= l; }
  }
  // make sure normals point outward (away from the spine)
  const flip = (nr[(40 * W) * 3] < 0) ? -1 : 1;
  if (flip < 0) for (let i = 0; i < nr.length; i++) nr[i] = -nr[i];
  return g;
}

// accumulates every fin and barbel into one geometry
function makeFinBuilder() {
  const pos = [], fin = [], flex = [], idx = [];
  const p = new THREE.Vector3(), r = new THREE.Vector3(), d = new THREE.Vector3(), f = new THREE.Vector3();
  return {
    // fan membrane: root0..root1 on the body, rays pointing dir0..dir1, ray length len(a) metres
    fan(o) {
      const { root0, root1, dir0, dir1, len, na, nb, rays, phase, amp, sweep } = o, curl = o.curl || 0, curlTo = o.curlTo;
      const fd = o.flexDir || f.crossVectors(dir0, dir1).normalize().clone();
      const base = pos.length / 3;
      for (let ia = 0; ia <= na; ia++) {
        const a = ia / na, l = len(a);
        r.lerpVectors(root0, root1, a); d.lerpVectors(dir0, dir1, a).normalize();
        for (let ib = 0; ib <= nb; ib++) {
          const b = ib / nb, bl = b * l;
          p.copy(r).addScaledVector(d, bl * (1 - curl * b));
          if (curl) p.addScaledVector(curlTo, bl * curl * b);
          if (sweep) p.addScaledVector(sweep, bl * b);
          pos.push(p.x, p.y, p.z);
          fin.push(a, b, rays, phase + (o.phaseSpread || 0) * a);
          const k = amp * Math.pow(b, 1.5) * (0.4 + 0.6 * l / o.lref);
          flex.push(fd.x * k, fd.y * k, fd.z * k);
        }
      }
      const W = nb + 1;
      for (let ia = 0; ia < na; ia++) for (let ib = 0; ib < nb; ib++) {
        const a = base + ia * W + ib, b = a + 1, c = a + W, e = c + 1;
        idx.push(a, c, b, b, c, e);
      }
    },
    // barbel: two crossed tapering ribbons along a drooping curve
    whisker(root, dir, droop, length, width, phase, flexDir) {
      const n = 12;
      for (let blade = 0; blade < 2; blade++) {
        const base = pos.length / 3;
        const side = blade === 0 ? f.set(0, 1, 0) : f.crossVectors(dir, new THREE.Vector3(0, 1, 0)).normalize();
        const sx = side.x, sy = side.y, sz = side.z;
        for (let i = 0; i <= n; i++) {
          const b = i / n, wv = width * (1 - 0.85 * b);
          p.copy(root).addScaledVector(dir, b * length).addScaledVector(droop, b * b * length);
          for (let e = -1; e <= 1; e += 2) {
            pos.push(p.x + sx * wv * e, p.y + sy * wv * e, p.z + sz * wv * e);
            fin.push(0.5 + 0.5 * e, b, 0, phase);
            const k = 0.9 * b * b; flex.push(flexDir.x * k, flexDir.y * k, flexDir.z * k);
          }
        }
        for (let i = 0; i < n; i++) { const a = base + i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aFin', new THREE.Float32BufferAttribute(fin, 4));
      g.setAttribute('aFlex', new THREE.Float32BufferAttribute(flex, 3));
      g.setIndex(idx);
      return g;
    },
  };
}

function buildFins(P) {
  const B = makeFinBuilder(), V = (x, y, z) => new THREE.Vector3(x, y, z), N = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
  const X = V(1, 0, 0), fs = P.finScale;
  const top = (t) => { const pr = prof(P, t); return V(0, pr.c + pr.h - 0.35, P.L * 0.5 - t * P.Lb); };
  const bot = (t) => { const pr = prof(P, t); return V(0, pr.c - pr.h * 0.92 + 0.35, P.L * 0.5 - t * P.Lb); };
  const back = V(0, 0, -1);
  // dorsal: a tall sail that sweeps back into a trailing streamer
  const Hd = P.dorsalH;
  B.fan({ root0: top(0.27), root1: top(0.78), dir0: N(0, 0.9, -0.44), dir1: N(0, 0.42, -0.9), na: 50, nb: 12, rays: 44, phase: 0.6, phaseSpread: 5,
    amp: 1.7, lref: Hd, flexDir: X, curl: 0.32, curlTo: back,
    len: (a) => Hd * (0.3 + 0.7 * smoothstep(0, 0.16, a)) * (1 - 0.5 * Math.pow(a, 1.3)) * (1 + 1.6 * smoothstep(0.72, 1, a)) });
  // caudal: long forked butterfly tail, lobes fan out and then sweep back
  const pe = prof(P, 1), zP = P.L * 0.5 - P.Lb + 2.2;
  const Lt = (P.L - P.Lb) * 1.16;
  B.fan({ root0: V(0, pe.c + pe.h, zP), root1: V(0, pe.c - pe.h, zP), dir0: N(0, Math.sin(0.66), -Math.cos(0.66)), dir1: N(0, -Math.sin(0.72), -Math.cos(0.72)),
    na: 64, nb: 30, rays: 56, phase: 2.1, phaseSpread: 1.5, amp: 3.0 * fs, lref: Lt, flexDir: X, curl: 0.4, curlTo: back,
    len: (a) => Lt * (0.5 + 0.5 * Math.pow(Math.abs(2 * a - 1), 1.7)) * (a < 0.5 ? 1 : 0.95) });
  P.tailHalf = Lt * 0.4; P.tailZ = zP;
  // anal fin
  const La = P.Lb * 0.14 * fs;
  B.fan({ root0: bot(0.72), root1: bot(0.84), dir0: N(0, -0.85, -0.52), dir1: N(0, -0.3, -0.95), na: 18, nb: 10, rays: 16, phase: 4.0, phaseSpread: 2,
    amp: 1.1, lref: La, flexDir: X, curl: 0.4, curlTo: back, len: (a) => La * (0.6 + 0.4 * Math.sin(Math.PI * Math.pow(a, 0.7))) * (1 + 0.7 * smoothstep(0.65, 1, a)) });
  for (const s of [-1, 1]) {
    // pectoral: big sculling fan from behind the gill plate
    const Lp = P.Lb * 0.33 * fs;
    B.fan({ root0: skin(P, 0.25, -0.5, s, 0.08), root1: skin(P, 0.305, -0.95, s, 0.08), dir0: N(s * 0.7, -0.62, -0.1), dir1: N(s * 0.22, -0.6, -0.78),
      na: 28, nb: 16, rays: 24, phase: 1.0 + s * 0.4, phaseSpread: 2.5, amp: 2.4, lref: Lp, curl: 0.5, curlTo: N(s * 0.15, -0.25, -1),
      len: (a) => Lp * (0.45 + 0.55 * Math.sin(Math.PI * Math.pow(a, 0.8))) });
    // pelvic
    const Lv = P.Lb * 0.16 * fs;
    B.fan({ root0: skin(P, 0.5, -1.0, s, 0.08), root1: skin(P, 0.56, -1.3, s, 0.08), dir0: N(s * 0.5, -0.75, -0.3), dir1: N(s * 0.12, -0.55, -0.82),
      na: 18, nb: 10, rays: 16, phase: 3.0 - s * 0.5, phaseSpread: 2, amp: 1.4, lref: Lv, curl: 0.5, curlTo: back,
      len: (a) => Lv * (0.5 + 0.5 * Math.sin(Math.PI * Math.pow(a, 0.8))) });
    // two barbels at each corner of the mouth
    const fd = V(s, 0, 0);
    B.whisker(skin(P, 0.02, -0.6, s, 0.1), N(s * 0.6, -0.45, 0.25), V(-s * 0.1, -0.4, -0.6), P.Hm * 0.5 * P.barbel, 0.2, 0.3 + s, fd);
    B.whisker(skin(P, 0.01, -0.15, s, 0.1), N(s * 0.5, -0.15, 0.55), V(-s * 0.1, -0.35, -0.65), P.Hm * 0.3 * P.barbel, 0.15, 1.3 + s, fd);
  }
  return B.build();
}

// both eyes: shallow lens domes seated on the head
function buildEyes(P) {
  const tE = 0.105, aE = 0.5, Re = P.Hm * 0.19;
  const c = skin(P, tE, aE), e = 0.004;
  const T1 = skin(P, tE - e, aE).sub(skin(P, tE + e, aE)).normalize();            // toward the nose
  const T2 = skin(P, tE, aE + 0.02).sub(skin(P, tE, aE - 0.02)).normalize();      // up the flank
  const Nn = new THREE.Vector3().crossVectors(T1, T2).normalize(); if (Nn.x < 0) Nn.negate();
  T2.crossVectors(Nn, T1).normalize();
  const NR = 10, NA = 36, pos = [], eye = [], idx = [], p = new THREE.Vector3();
  for (const s of [1, -1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= NR; i++) for (let j = 0; j <= NA; j++) {
      const r = i / NR, ph = (j / NA) * TAU, x = r * Math.cos(ph), y = r * Math.sin(ph);
      const bulge = 0.42 * Math.sqrt(Math.max(1 - r * r, 0)) - 0.1;
      p.copy(c).addScaledVector(T1, x * Re).addScaledVector(T2, y * Re).addScaledVector(Nn, bulge * Re);
      pos.push(p.x * s, p.y, p.z); eye.push(x, y, s);
    }
    const W = NA + 1;
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) {
      const a = base + i * W + j, b = a + 1, d = a + W, f = d + 1;
      if (s > 0) idx.push(a, d, b, b, d, f); else idx.push(a, b, d, b, f, d);      // outward-facing on both sides
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aEye', new THREE.Float32BufferAttribute(eye, 3));
  g.setIndex(idx);
  return { geometry: g, center: c, T1, T2, N: Nn, radius: Re };
}

// rain streaks and motes: kind 0 falls through the body, 1 through the tail sheet, 2 through the dorsal
// sheet, 3 = drifting motes inside the body. Positions are resolved in the vertex shader.
function buildRainGeometry(P, rng, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const drop = new Float32Array(count * 4), kind = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const r = rng();
    const k = r < 0.5 ? 0 : r < 0.7 ? 1 : r < 0.78 ? 2 : 3;
    let s;
    if (k === 1) s = rng();
    else if (k === 2) s = rng();
    else { s = rng(); if (rng() < 0.5) s = 0.08 + 0.6 * (rng() + rng()) * 0.5; s = clamp(s, 0.012, 0.97); }   // more where the body is fat
    drop[i * 4] = s; drop[i * 4 + 1] = rng() * 2 - 1; drop[i * 4 + 2] = rng(); drop[i * 4 + 3] = rng();
    kind[i] = k;
  }
  g.setAttribute('aDrop', new THREE.InstancedBufferAttribute(drop, 4));
  g.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 1));
  g.instanceCount = count;
  return g;
}

// ---------- shaders ----------
const VERT_TAIL = /* glsl */`
  vec4 wpos = modelMatrix*vec4(q, 1.0);
  wpos.x += koiGlitch(wpos.y);
  vWorld = wpos.xyz;
  vec4 mvPosition = viewMatrix*wpos;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
`;
const FRAG_END = /* glsl */`
  #ifdef USE_FOG
    col = koiFog(col, vFogDepth);
  #endif
  float chk = col.r + col.g + col.b;
  if (!(chk >= 0.0 && chk < 1.0e4)) col = vec3(0.0);        // never let a NaN reach the bloom chain
  gl_FragColor = vec4(clamp(col, 0.0, 48.0), 1.0);
`;

const BODY_VERT = /* glsl */`
attribute vec2 aUV; attribute float aYc;
uniform float uInflate;
varying vec3 vRest, vWorld, vN; varying vec2 vUV; varying float vDim;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vRest = position; vUV = aUV;
  vec3 p = position; p.x *= uInflate; p.y = aYc + (p.y - aYc)*uInflate;
  float cs, sn; vec3 q = koiBend(p, cs, sn);
  vN = mat3(modelMatrix)*vec3(normal.x*cs - normal.z*sn, normal.y, normal.x*sn + normal.z*cs);
  ${VERT_TAIL}
  // seen end-on the whole length stacks up additively: ease it back so the head-on view keeps its colour
  float al = abs(dot(normalize(cameraPosition - wpos.xyz), normalize(modelMatrix[2].xyz)));
  vDim = mix(1.0, 0.42, smoothstep(0.5, 0.95, al));
}`;

const BODY_FRAG = /* glsl */`
uniform vec3 uColA, uColB, uColRim, uColAcc, uEye, uPatOff;
uniform vec4 uPat;      // patch threshold, pattern frequency, accent spots, tancho disc
uniform vec2 uScaleN; uniform float uEyeR, uHeadZ;
varying vec3 vRest, vWorld, vN; varying vec2 vUV; varying float vDim;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_FRAG}
void main(){
  float t = vUV.x, ang = vUV.y*6.2831853, sa = sin(ang);
  float s = 0.5 - vRest.z/uLen;
  float edge; float vis = koiVis(s, edge);
  if (vis + edge < 0.003) discard;
  vec3 N = vN/max(length(vN), 1e-5), V = normalize(cameraPosition - vWorld);
  float ndv = clamp(abs(dot(N, V)), 0.0, 1.0);
  float scan = koiScan(vWorld.y), sweep = koiSweep(vWorld.y);
  vec3 col;
#if MODE == 0
  float F = pw(max(1.0 - ndv, 0.0), 2.2);
  float face = gl_FrontFacing ? 1.0 : 0.36;
  // kohaku pattern: crisp orange islands on white, belly stays white
  float pn = koiPattern(vRest*uPat.y + uPatOff);
  float low = smoothstep(0.25, -0.65, sa);                       // 0 on the back, 1 at the belly
  float pe = pn + 0.06*max(sa, 0.0) - 0.16*low, bellyM = smoothstep(-0.85, -0.55, sa);
  float hiPatch = smoothstep(uPat.x, uPat.x + 0.025, pe)*bellyM;
  float inkLine = smoothstep(0.022, 0.0, abs(pe - uPat.x - 0.012))*bellyM;    // drawn outline round every island
  float td = length(vec2(vRest.x, vRest.z - uHeadZ))/(0.62*uWm);
  hiPatch = max(hiPatch, uPat.w*smoothstep(1.0, 0.9, td)*step(0.0, sa));
  float spots = 0.0;
  if (uPat.z > 0.5) spots = smoothstep(0.7, 0.73, koiPattern(vRest.zxy*uPat.y*2.6 + uPatOff.yzx))*smoothstep(-0.3, 0.3, sa);
  vec3 base = mix(mix(uColB, uColA, hiPatch), uColAcc, spots);
  // scales: staggered lattice, bright trailing crescents, random glints; none on the head
  float headF = smoothstep(0.215, 0.26, t);
  vec2 sp = vec2(t*uScaleN.x, vUV.y*uScaleN.y);
  vec2 fws = fwidth(sp); float sFade = (1.0 - smoothstep(0.28, 0.8, max(fws.x, fws.y)))*headF;
  vec2 ca = fract(sp) - 0.5, cb = fract(sp + 0.5) - 0.5;
  float da = dot(ca, ca), db = dot(cb, cb), pick = step(db, da);
  vec2 cc = mix(ca, cb, pick); float d = sqrt(min(da, db));
  float twk = h21(floor(sp + 0.5*pick) + 0.37*pick);
  float rimS = smoothstep(0.3, 0.47, d), cres = rimS*smoothstep(-0.15, 0.3, cc.x);
  float glint = pw(0.5 + 0.5*sin(uTime*(0.5 + 1.8*twk) + twk*50.0), 6.0);
  float lum = 0.14 + 0.3*(1.0 - d*2.0) + 1.7*cres + 0.9*glint*(1.0 - rimS);
  // head: fine projector dot matrix instead
  float mg = (0.5 + 0.5*sin(vRest.z*10.0))*(0.5 + 0.5*sin(vRest.y*10.0));
  float mFade = 1.0 - smoothstep(0.12, 0.4, fwidth(vRest.y)*1.6);
  float lumHead = mix(0.5, 0.3 + 0.75*smoothstep(0.15, 0.7, mg), mFade);
  lum = mix(mix(0.6, lumHead, 1.0 - headF), lum, sFade);
  // gill plate, mouth, nostril, lateral line
  float tg = 0.24 - 0.055*sa*sa - 0.012*sa;
  float gmask = smoothstep(-0.92, -0.7, sa)*(1.0 - smoothstep(0.68, 0.86, sa));
  float gill = smoothstep(0.0048, 0.0014, abs(t - tg))*gmask;
  float gillGlow = exp(-max(t - tg, 0.0)*85.0)*step(tg, t)*gmask*0.3;
  float mouth = smoothstep(0.03, 0.008, abs(sa + 0.38 - t*5.0))*(1.0 - smoothstep(0.03, 0.045, t))*smoothstep(0.002, 0.008, t);
  float dn = length(vec2((t - 0.052)*30.0, (sa - 0.55)*3.2));
  float nostril = smoothstep(0.14, 0.05, abs(dn - 0.3));
  float ll = smoothstep(0.034, 0.012, abs(sa - 0.1 + 0.1*(t - 0.5)))*smoothstep(0.25, 0.28, t);
  float pulse = pw(0.5 + 0.5*sin(t*26.0 - uTime*2.2), 10.0);
  float lateral = ll*(0.22*step(0.4, fract(t*110.0)) + 1.7*pulse);
  col = base*(0.045 + 0.2*lum)*(1.0 + 1.7*hiPatch)*scan*face + uColA*inkLine*0.22*face;
  col += mix(base, uColRim, 0.25)*F*(1.0 - 0.6*F)*1.4*face*(0.55 + 0.45*scan);
  col += uColRim*(gill*1.1 + gillGlow + mouth*0.9 + nostril*0.6 + lateral)*face;
  // eye socket: cleared for the lens, with a thin ring around it
  float de = length(vec3(abs(vRest.x), vRest.y, vRest.z) - uEye)/uEyeR;
  col *= smoothstep(0.95, 1.2, de);
  col += uColRim*smoothstep(0.1, 0.0, abs(de - 1.3))*0.9*face;
  col += mix(uColB, uColRim, 0.5)*sweep*0.6*face;
#elif MODE == 1
  // halo in the rain haze
  col = mix(uColA, uColB, 0.3)*pw(ndv, 2.6)*0.075*(0.8 + 0.2*scan);
#else
  // ghost skeleton: ribs, a spine ridge and signal pulses running tailward
  float rf = 1.0 - smoothstep(0.12, 0.45, fwidth(t*46.0));
  float ribs = mix(0.27, pw(0.5 + 0.5*sin(t*289.0), 8.0), rf);
  float run = pw(0.5 + 0.5*sin(t*14.0 - uTime*1.6), 6.0);
  float ridge = smoothstep(0.72, 1.0, sa);
  float m = smoothstep(0.03, 0.13, t)*(1.0 - smoothstep(0.84, 1.0, t));
  col = mix(uColA, uColB, 0.55)*pw(ndv, 1.3)*(0.04 + 0.42*ribs*(0.35 + 0.65*run) + 0.3*ridge)*m*(0.7 + 0.3*scan);
#endif
  col *= 1.0 - 0.7*smoothstep(0.9, 1.0, t);                      // the tail stalk melts into the fin root
  col = (col*vis*vDim + uColRim*edge*1.3)*uIntensity;
  ${FRAG_END}
}`;

const FIN_VERT = /* glsl */`
attribute vec4 aFin; attribute vec3 aFlex;
varying vec4 vFin; varying vec3 vRest, vWorld;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vFin = aFin; vRest = position;
  float w = uTime*uSwim.w;
  float wv = sin(w*2.3 + aFin.w + aFin.y*4.5) + 0.4*sin(w*3.7 + aFin.w*1.7 + aFin.y*9.0 + aFin.x*6.0);
  vec3 p = position + aFlex*wv;
  float cs, sn; vec3 q = koiBend(p, cs, sn);
  ${VERT_TAIL}
}`;

const FIN_FRAG = /* glsl */`
uniform vec3 uColA, uColB, uColRim, uPatOff; uniform vec4 uPat;
varying vec4 vFin; varying vec3 vRest, vWorld;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_FRAG}
void main(){
  float a = vFin.x, b = vFin.y, rays = vFin.z;
  float edge; float vis = koiVis(0.5 - vRest.z/uLen, edge);
  if (vis + edge < 0.003) discard;
  vec3 N = cross(dFdx(vWorld), dFdy(vWorld)), V = normalize(cameraPosition - vWorld);
  float F = clamp(1.0 - abs(dot(N/max(length(N), 1e-9), V)), 0.0, 1.0);
  float scan = koiScan(vWorld.y), sweep = koiSweep(vWorld.y);
  vec3 col;
  if (rays < 0.5) {
    col = mix(uColB, uColA, 0.35)*(0.95 - 0.55*b)*(0.6 + 0.4*scan);
  } else {
    float ra = a*rays, rid = floor(ra), fwr = fwidth(ra);
    float ray = smoothstep(0.7 - fwr, 0.98, abs(fract(ra) - 0.5)*2.0);
    ray = mix(0.26, ray, 1.0 - smoothstep(0.3, 0.85, fwr));
    float ray2 = smoothstep(0.78, 1.0, abs(fract(ra*2.0 + 0.5) - 0.5)*2.0)*smoothstep(0.4, 0.7, b)*(1.0 - smoothstep(0.2, 0.5, fwr));
    float bb = b/(0.8 + 0.2*h11(rid + rays*7.0));                    // every ray ends at its own length
    vec2 cell = vec2(floor(ra*2.0), floor(b*rays*0.9 - uTime*1.2));
    float alive = step(smoothstep(0.86, 1.03, bb), h21(cell) + 0.02);  // tips break up into drifting pixels
    float pat = smoothstep(0.42, 0.5, fbm(vRest*uPat.y*1.6 + uPatOff + 3.0) + 0.25*(1.0 - b))*(1.0 - smoothstep(0.25, 0.85, b));
    vec3 base = mix(uColB, uColA, pat*0.9);
    float rimRay = smoothstep(0.035, 0.0, min(a, 1.0 - a));            // leading and trailing edges draw the outline
    col = base*(0.12 + 0.2*(1.0 - b) + 0.75*ray*(1.0 - 0.4*b) + 0.3*ray2 + 1.2*rimRay)*scan;
    col += uColRim*smoothstep(0.6, 0.97, bb)*(0.1 + 0.45*ray);
    col += mix(uColB, uColRim, 0.5)*sweep*0.25;
    col *= alive*(0.75 + 1.5*F*F);
  }
  col = (col*vis + uColRim*edge*0.9)*uIntensity;
  ${FRAG_END}
}`;

const EYE_VERT = /* glsl */`
attribute vec3 aEye;
uniform vec3 uEye, uEyeN, uEyeT1, uEyeT2, uCamLocal;
varying vec3 vE, vWorld; varying vec2 vPup;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vE = aEye;
  vec3 m = vec3(aEye.z, 1.0, 1.0);
  float cs, sn; vec3 ec = koiBend(uEye*m, cs, sn);
  vec3 tc = normalize(uCamLocal - ec);
  float facing = smoothstep(-0.2, 0.3, dot(tc, uEyeN*m));
  vPup = clamp(vec2(dot(tc, uEyeT1*m), dot(tc, uEyeT2*m)), -1.0, 1.0)*0.3*facing;   // the pupil follows the camera
  vec3 q = koiBend(position, cs, sn);
  ${VERT_TAIL}
}`;

const EYE_FRAG = /* glsl */`
uniform vec3 uColA, uColB, uColRim;
varying vec3 vE, vWorld; varying vec2 vPup;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_FRAG}
void main(){
  float edge; float vis = koiVis(0.06, edge);
  vec2 p2 = vE.xy; float r = length(p2);
  vec2 q = p2 - vPup; float rq = length(q), aq = atan(q.y, q.x);
  vec3 N = cross(dFdx(vWorld), dFdy(vWorld)), V = normalize(cameraPosition - vWorld);
  float F = clamp(1.0 - abs(dot(N/max(length(N), 1e-9), V)), 0.0, 1.0); F *= F;
  float scan = koiScan(vWorld.y);
  float pupil = smoothstep(0.3, 0.26, rq);
  float iris = smoothstep(0.63, 0.59, rq)*(1.0 - pupil);
  float stri = 0.5 + 0.5*sin(aq*44.0 + 4.0*vnoise(vec3(aq*3.0, rq*9.0, 1.0)));
  vec3 col = mix(uColA, uColB, 0.15)*iris*(0.35 + 1.5*stri*smoothstep(0.27, 0.62, rq));
  col += uColB*smoothstep(0.035, 0.0, abs(rq - 0.62))*2.2;                       // limbal ring
  col += uColA*smoothstep(0.03, 0.0, abs(rq - 0.3))*1.2;                         // pupil edge
  col += uColB*smoothstep(0.1, 0.03, length(q - vec2(0.1, 0.13)))*3.2;           // glint
  col += uColB*0.1*(1.0 - iris - pupil)*step(r, 0.84);                           // sclera
  float pr = atan(p2.y, p2.x)/6.2831853;
  col += uColRim*smoothstep(0.03, 0.0, abs(r - 0.94))*step(0.35, fract(pr*36.0 + uTime*0.05))*1.8;   // rotating reticle
  col += uColRim*smoothstep(0.02, 0.0, abs(r - 0.85))*0.7;
  col += uColRim*smoothstep(0.03, 0.0, abs(r - 0.74))*step(0.82, fract(pr*4.0 - uTime*0.08))*1.4;
  col += mix(uColB, uColRim, 0.5)*F*0.5;
  col *= (0.7 + 0.3*scan)*vis*uIntensity*step(r, 0.995)*(gl_FrontFacing ? 1.0 : 0.22);   // the far eye only ghosts through
  ${FRAG_END}
}`;

const RAIN_VERT = /* glsl */`
attribute vec4 aDrop; attribute float aKind;
uniform vec3 uTail;     // tail half-height at the root, at the tips, dorsal fin height
uniform float uFall;
varying vec2 vQ; varying float vLum, vMote, vHue;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  float rnd = aDrop.w, mote = step(2.5, aKind);
  float fall = uTime*uFall*(0.75 + 0.5*rnd);
  float s, x0, yr, yc, inside;
  if (aKind < 0.5 || aKind > 2.5) {
    float t = aDrop.x; s = t*uSB; vec3 pr = koiProf(t);
    float span = 2.5*pr.y + 2.0;
    if (aKind < 0.5) { yr = mod(aDrop.z*span - fall, span) - 0.5*span; x0 = aDrop.y*1.15*pr.x; }
    else { x0 = aDrop.y*0.8*pr.x + 0.6*sin(uTime*0.4 + rnd*40.0); yr = (aDrop.z*2.0 - 1.0)*0.8*pr.y + 0.8*sin(uTime*0.3 + rnd*70.0); }
    float e = x0*x0/(pr.x*pr.x + 0.05) + yr*yr/(pr.y*pr.y + 0.05);
    inside = 1.0 - smoothstep(0.7, 1.02, e);
    yc = pr.z;
  } else if (aKind < 1.5) {
    float tu = aDrop.x*0.8; s = mix(uSB - 0.015, 1.0, tu);
    float hh = mix(uTail.x, uTail.y, tu), span = 2.0*hh + 2.0;
    yr = mod(aDrop.z*span - fall, span) - 0.5*span;
    x0 = aDrop.y*2.2;
    inside = exp(-abs(x0)*1.1)*(1.0 - smoothstep(hh*0.82, hh, abs(yr)))*(1.0 - 0.7*smoothstep(0.45, 0.8, tu))*0.5;
    yc = -1.5*tu;
  } else {
    float t = mix(0.3, 0.8, aDrop.x); s = t*uSB; vec3 pr = koiProf(t);
    float hd = uTail.z*0.5*(1.0 - 0.45*aDrop.x), span = hd + 2.0;
    yr = mod(aDrop.z*span - fall, span);
    x0 = aDrop.y*1.8;
    inside = 0.6*exp(-abs(x0)*1.3)*(1.0 - smoothstep(hd*0.6, hd, yr))*smoothstep(0.0, 0.6, yr);
    yc = pr.z + pr.y;
  }
  vec3 c = vec3(koiSpine(s).x + x0, yc + yr + koiBob(), uLen*(0.5 - s));
  float edge; float vis = koiVis(s, edge);
  float tw = pw(0.5 + 0.5*sin(uTime*(3.0 + 9.0*rnd) + rnd*200.0), 6.0);
  float twm = pw(0.5 + 0.5*sin(uTime*(0.6 + 1.4*rnd) + rnd*90.0), 4.0);
  float lum = inside*(vis + 2.0*edge)*mix(0.3 + 2.8*tw, 0.25 + 3.2*twm, mote);
  vec4 wc = modelMatrix*vec4(c, 1.0);
  vec3 toCam = cameraPosition - wc.xyz; float dist = length(toCam);
  vec3 axis = normalize(mix(vec3(0.1, 1.0, 0.03), vec3(0.0, 1.0, 0.0), mote));
  vec3 side = cross(axis, toCam); side /= max(length(side), 1e-5);
  float wpx = dist*0.0013;
  float w0 = mix(0.085, 0.5, mote), len = mix(1.1 + 1.1*rnd, 0.5, mote);
  float w = max(w0, wpx); len = max(len, wpx*mix(5.0, 1.0, mote));
  lum *= mix(1.0, w0/w, 0.5);
  float al = abs(dot(toCam/max(dist, 1e-4), normalize(modelMatrix[2].xyz)));
  lum *= mix(1.0, 0.4, smoothstep(0.5, 0.95, al));
  vec3 wp = wc.xyz + side*position.x*w + axis*(position.y - 0.5*mote)*len;
  vQ = vec2(position.x*2.0, position.y); vLum = lum; vMote = mote; vHue = fract(rnd*7.31);
  vec4 mvPosition = viewMatrix*vec4(wp, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
  if (lum < 0.004) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
}`;

const RAIN_FRAG = /* glsl */`
uniform vec3 uColA, uColB, uColRim; uniform float uRain;
varying vec2 vQ; varying float vLum, vMote, vHue;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_FRAG}
void main(){
  float shape;
  if (vMote > 0.5) {
    vec2 q = vec2(vQ.x, vQ.y*2.0 - 1.0); float r = length(q);
    float star = max(exp(-abs(q.x)*14.0 - abs(q.y)*2.5), exp(-abs(q.y)*14.0 - abs(q.x)*2.5));
    shape = (exp(-r*r*9.0) + 0.8*star)*(1.0 - smoothstep(0.7, 1.0, r));
  } else {
    shape = (1.0 - vQ.x*vQ.x)*smoothstep(1.0, 0.2, vQ.y)*smoothstep(0.0, 0.06, vQ.y);
  }
  vec3 tint = mix(mix(uColB, uColA, 0.75*step(0.55, vHue)), uColRim, step(0.9, vHue));
  vec3 col = tint*vLum*shape*uRain*uIntensity;
  ${FRAG_END}
}`;

const GLOW_VERT = /* glsl */`
varying vec3 vP;
#include <fog_pars_vertex>
void main(){
  vP = position;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const GLOW_FRAG = /* glsl */`
uniform vec3 uColA, uColB, uPatOff; uniform vec4 uPat; uniform float uStreet;
varying vec3 vP;
#include <fog_pars_fragment>
${GLSL_COMMON}
${GLSL_FRAG}
void main(){
  float s = 0.5 - vP.z/uLen;
  float edge; float vis = koiVis(s, edge);
  float t = clamp(s/uSB, 0.0, 1.0);
  float wB = koiProf(t).x*(1.0 - smoothstep(uSB, uSB + 0.03, s));
  float dx = vP.x - koiSpine(s).x, sig = wB*0.8 + 5.5;
  float es = (s - 0.42)/0.5; float env = exp(-es*es*es*es*1.6);
  float g = exp(-dx*dx/(2.0*sig*sig))*env;
  float streak = vnoise(vec3(vP.x*0.55, vP.z*0.05, 3.0 + uTime*0.05));
  float fine = vnoise(vec3(vP.x*2.2, vP.z*0.16, 9.0));
  float ripple = pw(vnoise(vec3(vP.xz*1.7, uTime*2.5)), 5.0)*3.0;
  float pat = smoothstep(uPat.x - 0.06, uPat.x + 0.1, koiPattern(vec3(0.0, uHm*0.6, vP.z)*uPat.y + uPatOff));
  vec3 col = mix(uColB, uColA, 0.12 + 0.45*pat)*g*(0.03 + 0.09*streak + 0.08*fine*streak + 0.05*ripple)*uStreet*uIntensity*vis;
  ${FRAG_END}
}`;

// ---------- assembly ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const L = opts.length ?? 120, alt = opts.altitude ?? 36;
  const girth = rng.range(0.92, 1.1);
  const P = { L, Lb: L * 0.68, finScale: rng.range(0.85, 1.25), barbel: rng.range(0.8, 1.35) };
  P.Hm = P.Lb * 0.148 * girth; P.Wm = P.Lb * 0.09 * girth * rng.range(0.95, 1.06);
  P.dorsalH = P.Hm * 1.5 * P.finScale;
  const variety = opts.variety || rng.pick(['kohaku', 'kohaku', 'sanke', 'tancho', 'hi']);
  const pat = { kohaku: [0.51, 0, 0], sanke: [0.53, 1, 0], tancho: [0.68, 0, 1], hi: [0.43, 0, 0] }[variety] || [0.51, 0, 0];

  const orange = pal[6].clone().lerp(new THREE.Color('#ff3a08'), rng.range(0.1, 0.35));   // kept well on the orange side: additive light over a violet city drifts to pink otherwise
  const U = (v) => ({ value: v });
  const shared = {
    uTime: U(0), uLen: U(L), uSB: U(P.Lb / L), uHm: U(P.Hm), uWm: U(P.Wm), uTurn: U(0), uReveal: U(1), uPhase: U(rng() * TAU),
    uGlitch: U(opts.glitch ?? 3.2), uIntensity: U(opts.intensity ?? 1),
    uSwim: U(new THREE.Vector4(0.01, 0.07 * rng.range(0.85, 1.15), rng.range(0.8, 1.05), rng.range(0.8, 1.05))),
    uColA: U(orange.clone().multiplyScalar(1.7)), uColB: U(new THREE.Color('#fff1e2').multiplyScalar(0.4)),
    uColRim: U(pal[4].clone().multiplyScalar(1.2)), uColAcc: U(pal[5].clone().lerp(pal[2], 0.35).multiplyScalar(0.9)),
    uPat: U(new THREE.Vector4(pat[0] + rng.range(-0.03, 0.03), 1 / (L * rng.range(0.13, 0.19)), pat[1], pat[2])),
    uPatOff: U(new THREE.Vector3(rng.range(-50, 50), rng.range(-50, 50), rng.range(-50, 50))),
    uScaleN: U(new THREE.Vector2(Math.round(P.Lb / 1.7), 40)),
    uEye: U(new THREE.Vector3()), uEyeN: U(new THREE.Vector3()), uEyeT1: U(new THREE.Vector3()), uEyeT2: U(new THREE.Vector3()),
    uEyeR: U(1), uHeadZ: U(L * 0.5 - 0.135 * P.Lb), uCamLocal: U(new THREE.Vector3(0, 0, 1e4)),
    uTail: U(new THREE.Vector3()), uFall: U(26), uRain: U(0.65), uStreet: U(1),
  };
  const mat = (vs, fs, extra = {}, own = {}) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...shared, ...own },
    vertexShader: vs, fragmentShader: fs, fog: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, ...extra,
  });

  const root = new THREE.Group(); root.name = 'koi-hologram';
  const koi = new THREE.Group(); koi.position.y = alt; root.add(koi);
  const add = (geo, material, order) => { const m = new THREE.Mesh(geo, material); m.frustumCulled = false; m.renderOrder = order; koi.add(m); return m; };

  // body: halo shell, skin, ghost skeleton (one geometry, three passes)
  const bodyGeo = buildBodyGeometry(P);
  add(bodyGeo, mat(BODY_VERT, BODY_FRAG, { defines: { MODE: 1 }, side: THREE.FrontSide }, { uInflate: U(1.5) }), 1);
  add(bodyGeo, mat(BODY_VERT, BODY_FRAG, { defines: { MODE: 2 }, side: THREE.FrontSide }, { uInflate: U(0.42) }), 2);
  add(bodyGeo, mat(BODY_VERT, BODY_FRAG, { defines: { MODE: 0 } }, { uInflate: U(1) }), 3);
  await ctx.yield?.();

  const eyes = buildEyes(P);
  shared.uEye.value.copy(eyes.center); shared.uEyeN.value.copy(eyes.N); shared.uEyeT1.value.copy(eyes.T1); shared.uEyeT2.value.copy(eyes.T2);
  shared.uEyeR.value = eyes.radius;
  add(eyes.geometry, mat(EYE_VERT, EYE_FRAG), 5);

  add(buildFins(P), mat(FIN_VERT, FIN_FRAG), 4);
  shared.uTail.value.set(prof(P, 1).h * 1.05, P.tailHalf, P.dorsalH);
  await ctx.yield?.();

  const rainCount = Math.max(0, Math.floor(opts.rain ?? 9000));
  if (rainCount > 0) add(buildRainGeometry(P, rng.fork('rain'), rainCount), mat(RAIN_VERT, RAIN_FRAG), 6);

  let streetGlow = null;
  if (opts.streetGlow !== false) {
    const g = new THREE.PlaneGeometry(2 * (P.Wm + 36), L * 1.5, 1, 1); g.rotateX(-Math.PI / 2);
    streetGlow = new THREE.Mesh(g, mat(GLOW_VERT, GLOW_FRAG));
    streetGlow.position.y = 0.06; streetGlow.frustumCulled = false; streetGlow.renderOrder = 0; root.add(streetGlow);
  }
  await ctx.yield?.();

  // ---------- anchors (local space of `object`) ----------
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const ex = eyes.center.x + eyes.radius * 0.3, ey = alt + eyes.center.y, ez = eyes.center.z;
  const tailCross = V(0, alt - 1, -L * 0.5 + (L - P.Lb) * 0.55);
  const hex = (c, k) => '#' + c.clone().multiplyScalar(k).getHexString();
  const anchors = {
    swimDir: V(0, 0, 1),
    nose: V(0, alt + prof(P, 0).c, L * 0.5),
    tailTip: V(0, alt - 3, -L * 0.5),
    eyeRight: V(-ex, ey, ez), eyeLeft: V(ex, ey, ez),
    dorsalTop: V(0, alt + prof(P, 0.38).c + prof(P, 0.38).h + P.dorsalH * 0.9, L * 0.5 - 0.42 * P.Lb),
    eyePass: V(-(ex + 25), ey, ez),
    tailCross,
    flyThrough: [
      V(-(ex + 34), ey + 6, L * 0.5 + 80), V(-(ex + 27), ey + 1.5, L * 0.5 + 25), V(-(ex + 25), ey, ez),
      V(-(P.Wm + 17), alt + 1, L * 0.12), V(-(P.Wm + 9), alt, -L * 0.14), V(-6, alt - 0.5, -L * 0.26),
      tailCross.clone(), V(8, alt - 2, -L * 0.42), V(14, alt - 3, -L * 0.5 - 25), V(18, alt - 4, -L * 0.5 - 80),
    ],
    viewpoints: { reveal: V(-55, alt - 8, L * 0.5 + 70), profile: V(-110, alt + 6, 0), astern: V(30, alt + 12, -L * 0.5 - 75) },
    glowPoints: [0.06, 0.22, 0.4, 0.58, 0.82].map((s, i) => ({
      position: V(0, alt, L * (0.5 - s)), color: i % 2 ? hex(orange, 1) : '#e4f5ff', intensity: [1.2, 1.6, 1.5, 1.0, 0.7][i], radius: [14, 22, 22, 16, 18][i],
    })),
  };

  const inv = new THREE.Matrix4();
  const hero = {
    object: root, radius: L * 0.55, height: alt + L * 0.2, center: V(0, alt, 0), anchors,
    ground: true, groundY: 0, uniforms: shared, streetGlow,
    info: { variety, length: L, altitude: alt, bodyHalfHeight: P.Hm, bodyHalfWidth: P.Wm, finScale: P.finScale },
    setProgress(u) { shared.uReveal.value = clamp(u, 0, 1); },
    setTurn(k) { shared.uTurn.value = clamp(k, -1, 1) * 0.5; },
    update(dt, time, camera) {
      shared.uTime.value = time;
      if (camera) {
        koi.updateWorldMatrix(true, false);
        shared.uCamLocal.value.copy(camera.position).applyMatrix4(inv.copy(koi.matrixWorld).invert());
      }
    },
    dispose() {},
  };
  return hero;
}
