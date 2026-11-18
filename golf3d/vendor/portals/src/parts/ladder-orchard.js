// THE LONG LADDER: hero set piece of "ladder-orchard" (The Ladder Orchard).
//
// Two wavering ink rails 480 m long lean away from the viewer at 32 degrees, 10 m apart at the foot and
// 18 m at the top, with 78 rungs bowed like smiles, an ink knot lashed with three ticks at every joint,
// splice knots every 48 m, twig-ladders with small fruit, dotted root spirals at the feet, tenders hopping
// up rung by rung, and, balanced off the upper half like a mobile, a red sun-disc with a hairline orbit,
// a black crescent, a yellow star of four crossed strokes and a green hourglass. The rails end in two
// inward curls with a missing rung between them where the exit portal ring stands.
//
// LOCAL SPACE: origin at the middle of the two feet, +Y up, front toward +Z. The ladder climbs AWAY from
// the front: axis A = (0, sin32, -cos32), top at about (0, 254, -407). N = (0, cos32, sin32) is "above the
// rungs". Port is -X, starboard +X. (Brief: foot (90,0,380), top (-172,254,692): rotation.y = PI - 0.699,
// which turns local -Z to world (-0.643, 0, 0.766).) Helper in anchors: at(s, x, h) = A*s + X*x + N*h.
//
// STYLE (flat ink and stain, no light, no fog): every material is an unlit ShaderMaterial, depthTest on,
// depthWrite off, fog off. Passes by renderOrder: 3 KNOCK-OUT (coloured blots as dst*(1-a)), 4 STAIN
// (blend ONE_MINUS_DST_COLOR, ONE_MINUS_SRC_COLOR: s + d - 2sd, so red over yellow goes leaf green),
// 5 INK (strokes, dots, crescent: dst*(1-0.975a), opts.ink). Use the same renderOrders for the world's own blots
// and ink so crossings between world signs and the hero's mix the same way. Lines are ribbons widened in
// screen space (floor 2 px, paling below it), wavering, breathing in width, with round ends and dry-brush
// breaks up close. Blots are world-fixed quads with a signed-distance shape and a ragged noise edge.
// Colours are written as linear(hex) * opts.gain: gain 1 for post.flat = 1 (recommended), ~1.3 under ACES.
//
// opts: palette (brief order: blue, ink, red, yellow, cream, earth, green), detail 0.6..1 (thins root
//   dots, ticks, twigs and sprinkled seed dots; never the ladder, signs or tenders), gain (1), earth
//   (true: a small dry-brushed red patch under the feet at y 0.03; pass false when the world has its own),
//   duration (45: seconds of flight that setProgress(u) maps to), noiseTex (share the world's 64x64 noise).
// PROGRESS: hero.setProgress(u) (u = 0..1 of the world's path) makes the four great signs' swing a pure
//   function of u, so the crossings in beat E are the same at any speed; without it they swing on time.
//   hero.signPose(i, out) gives sign i's current centre (local) for gaze points.
// SIZE: the ladder spans 407 m in plan and 254 m in height (signs and scrolls reach about 300 m); the
//   returned radius (200) is a viewing radius about the centre, not a bound. COST: about 22k triangles,
//   5 draw calls (3 instanced geometries, 2 shader programs' worth of source), no lights, one 64x64 RGBA8
//   texture, build about 70 ms in ten yielded steps. hero.counts lists the instance counts.
// LIGHTING: none. It is drawn by multiply and stain, so it wants a mid-value ground behind it (the blue
//   wash, 0.1 to 0.45 linear); on a near-black ground the ink disappears, on white the stains invert.
// ANCHORS (all local): see the anchors block at the bottom of buildHero.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#14246A', '#0C0D12', '#E23B2A', '#F2C230', '#F3EEDD', '#8A3B1E', '#2F9A6B'];
const LEAN = 32 * Math.PI / 180, LEN = 480, RUNG = 6, NRUNG = 78;
const AX = [0, Math.sin(LEAN), -Math.cos(LEAN)], NX = [0, Math.cos(LEAN), Math.sin(LEAN)];
// point on the ladder: s metres up the axis, x metres to starboard, h metres above the plane of the rungs
const at = (s, x, h) => [x, AX[1] * s + NX[1] * h, AX[2] * s + NX[2] * h];
const halfSep = (s) => 5 + 4 * (s / LEN);

// Instance collector. Every instance (stroke or quad) is 20 floats:
//  a(3) b(3) c(3)   stroke: start, bow control, end.  quad: centre, half-axis U, half-axis V
//  w(4)             stroke: width m, seed, group, mode.  quad: ragged amount, seed, group, mode
//  own(4)           owner foot xyz + phase (mode 1 twig flex, mode 2 tender hop)
//  q(3)             quad only: shape, colour id, billboard flag.  stroke: min px (negative: vanish when tiny), taper, chained
//                   (mode 0 strokes: own[0] = repeat spacing in metres, the stroke fades as that closes to 2 px)
function collector() {
  const d = [];
  return {
    d, get count() { return d.length / 20; },
    push(a, b, c, w, own, q) { d.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2], w[0], w[1], w[2], w[3], own[0], own[1], own[2], own[3], q[0], q[1], q[2]); },
  };
}
const NO_OWN = [0, 0, 0, 0];
const mid = (a, b, k = 0.5) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const norm3 = (a) => { const l = len3(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

async function makeNoiseTex(rng, ctx) {      // ctx: yields three times on the way (the build's first step was this one call), the draws are the same
  // 64x64 repeating RGBA8 value noise, four independent channels, each blurred once so it reads as stain
  const S = 64, raw = new Float32Array(S * S * 4), data = new Uint8Array(S * S * 4);
  for (let i = 0; i < raw.length; i++) raw[i] = rng(); if (ctx) await ctx.yield();
  for (let y = 0; y < S; y++) { if (ctx && y % 22 === 21) await ctx.yield(); for (let x = 0; x < S; x++) for (let c = 0; c < 4; c++) {
    let v = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) v += raw[(((y + j + S) % S) * S + ((x + i + S) % S)) * 4 + c] * (i === 0 && j === 0 ? 4 : i === 0 || j === 0 ? 2 : 1);
    data[(y * S + x) * 4 + c] = Math.round(clamp((v / 16 - 0.5) * 1.9 + 0.5, 0, 1) * 255);
  } }
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearFilter;
  tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}

// ---------------------------------------------------------------- shaders
// One shared vertex chunk moves a point with its owner, so strokes, knots, blots and tenders never drift
// off their joints: great-sign swing about its pivot (and spin about its own centre), lever dip, twig
// flex, tender hop, then the whole ladder's flex from the foot.
const MOVE = /* glsl */`
  attribute vec3 iA, iB, iC, iQ; attribute vec4 iW, iOwn;
  uniform float uTime, uHop; uniform vec2 uRes, uFlex; uniform vec3 uA, uN;
  uniform vec4 uPiv[5], uAxs[5], uCen[5], uNr[5], uArm[5];
  vec3 rotK(vec3 v, vec3 k, float a) { float c = cos(a), s = sin(a); return v * c + cross(k, v) * s + k * dot(k, v) * (1. - c); }
  vec3 moveP(vec3 p) {
    int g = int(iW.z + 0.5); int mode = int(iW.w + 0.5);
    bool spin = g >= 8; if (spin) g -= 8;
    g = g > 4 ? 4 : g;
    if (g > 0) {
      if (spin) p = uCen[g].xyz + rotK(p - uCen[g].xyz, uNr[g].xyz, uCen[g].w);
      vec3 r = p - uPiv[g].xyz;
      float lever = clamp(dot(r, uArm[g].xyz) / max(uArm[g].w, 1.), -1.2, 1.2);   // +1 at the sign, -1 at the counterweight
      p = uPiv[g].xyz + rotK(r, uAxs[g].xyz, uPiv[g].w) + uN * (uAxs[g].w * lever);
    }
    if (mode == 1) {
      float d = length(p - iOwn.xyz);
      p += (vec3(1., 0., 0.) * sin(uTime * 0.9 + iOwn.w) + uA * cos(uTime * 0.7 + iOwn.w * 1.7)) * min(d * d * 0.006, d * 0.11);
    } else if (mode == 2) {
      vec3 foot = iOwn.xyz;
      float k = mod(uHop + iOwn.w, 77.), n = floor(k), f = k - n;
      float air = smoothstep(0.3, 0.8, f), arc = sin(3.14159 * air);
      float c1 = smoothstep(0.03, 0.27, f) * (1. - smoothstep(0.27, 0.4, f));
      float c2 = smoothstep(0.78, 0.86, f) * (1. - smoothstep(0.86, 1., f));
      float leg = 1. - 0.6 * c1 - 0.45 * c2 + 0.3 * arc;
      float h = dot(p - foot, uN), top = 0.6;
      float h2 = h < top ? h * leg : h - top * (1. - leg);
      p += uN * (h2 - h) + uA * (max(h - top, 0.) * 0.22 * arc);
      float sc = smoothstep(0., 0.7, k) * (1. - smoothstep(76.2, 77., k));
      p = foot + (p - foot) * sc;
      p += uA * (6. * (1. + n + air)) + uN * (1.5 * arc);
    } else if (mode == 3) {
      // resident tender: keeps its rung, hopping to and fro along it. iOwn.w = phase + 100 * (ten times its scale - 10)
      vec3 foot = iOwn.xyz;
      float q = floor(iOwn.w / 100.), sc = 1. + 0.1 * q;
      float k = uTime * 0.8 + (iOwn.w - 100. * q), n = floor(k), f = k - n;
      float air = smoothstep(0.3, 0.8, f), arc = sin(3.14159 * air);
      float c1 = smoothstep(0.03, 0.27, f) * (1. - smoothstep(0.27, 0.4, f));
      float c2 = smoothstep(0.78, 0.86, f) * (1. - smoothstep(0.86, 1., f));
      float leg = 1. - 0.6 * c1 - 0.45 * c2 + 0.3 * arc;
      float h = dot(p - foot, uN), top = 0.8 * sc;
      float h2 = h < top ? h * leg : h - top * (1. - leg);
      float to = mod(n, 2.) < 0.5 ? air : 1. - air;
      p += uN * (h2 - h + 1.1 * sc * arc) + vec3(1., 0., 0.) * ((to - 0.5) * 2.2 * sc + max(h - top, 0.) * 0.16 * arc * (mod(n, 2.) < 0.5 ? 1. : -1.));
    }
    float s = max(dot(p, uA), 0.) / 480.;
    return p + (vec3(1., 0., 0.) * uFlex.x + uN * uFlex.y) * (s * s);
  }
`;

const STROKE_VERT = MOVE + /* glsl */`
  uniform vec2 uWave;                       // waver cycles along one stroke
  varying vec2 vSV; varying vec4 vInfo;     // vSV: across, cap.  vInfo: along (widths), seed, coverage, nearness
  void main() {
    vec3 a = moveP(iA), b = moveP(iB), c = moveP(iC);
    float t = position.x, m = 1. - t, seed = iW.y;
    vec3 p = a * m * m + b * (2. * m * t) + c * (t * t);
    vec3 tg = mix(b - a, c - b, t);
    float tl = length(tg); tg = tl > 1e-5 ? tg / tl : vec3(0., 1., 0.);
    vec4 c0 = projectionMatrix * modelViewMatrix * vec4(p, 1.);
    vec4 c1 = projectionMatrix * modelViewMatrix * vec4(p + tg, 1.);
    vec2 d = (c1.xy * c0.w - c0.xy * c1.w) * uRes;
    float dl = length(d); d = dl > 1e-6 ? d / dl : vec2(1., 0.);
    vec2 nrm = vec2(-d.y, d.x);
    float w = max(abs(c0.w), 1e-3);
    float pxPerM = projectionMatrix[1][1] * uRes.y * 0.5 / w;
    float env = sin(3.14159 * t);
    float breathe = 1. + 0.25 * sin(t * uWave.y * 4.1 + seed * 7.3) * env + 0.22 * smoothstep(0.78, 1., abs(2. * t - 1.)) * (1. - iQ.z);
    float taper = mix(1., 1. - 0.8 * t, iQ.y);
    float halfM = iW.x * 0.5 * breathe * taper;
    float truePx = halfM * pxPerM, floorPx = abs(iQ.x) * 0.5;
    float halfPx = max(truePx, floorPx);
    float wav = (sin(t * uWave.x * 6.283 + seed * 5.1 + uTime * 1.05) + 0.7 * sin(t * uWave.y * 6.283 - seed * 3.7 - uTime * 0.8)) * env * (1. - 0.55 * iQ.z);
    vec2 off = (nrm * (position.y + wav * 0.45) + d * position.z) * halfPx;
    c0.xy += off * 2. / uRes * w;
    gl_Position = c0;
    vSV = position.yz;
    float along = t * length(c - a) / max(iW.x, 0.02);
    float ratio = truePx / max(floorPx, 1e-3);
    float cov = iQ.x < 0. ? smoothstep(0.2, 1., ratio) : clamp(ratio, 0.78, 1.);       // negative floor: fade right out when tiny
    if (iW.w < 0.5 && iOwn.x > 0.) cov *= smoothstep(2., 5., iOwn.x * pxPerM);        // repeated strokes (rungs) fade as their spacing closes
    vInfo = vec4(along, seed, cov, smoothstep(1.5, 5., truePx));
  }
`;
const STROKE_FRAG = /* glsl */`
  uniform sampler2D uNoise; uniform float uInk;
  varying vec2 vSV; varying vec4 vInfo;
  void main() {
    vec2 sv = clamp(vSV, -1., 1.);                                               // across and cap, held to their own range before they are squared
    float d = length(sv), aa = max(fwidth(d) * 1.2, 1e-3);
    float n = texture2D(uNoise, vec2(vInfo.x * 0.021 + vInfo.y * 0.37, sv.x * 0.11 + vInfo.y * 1.7)).r;
    float n2 = texture2D(uNoise, vec2(vInfo.x * 0.006 + vInfo.y * 0.61, sv.x * 0.42 + vInfo.y * 2.3)).g;
    float edge = 1. - (0.12 + (n - 0.5) * 0.38) * vInfo.w;                       // ragged brush edge up close
    float cov = 1. - smoothstep(edge - aa, edge, d);
    float brk = smoothstep(0.6, 0.78, n2) * smoothstep(0.15, 0.85, abs(sv.x)) * vInfo.w;   // dry-brush streaks
    cov *= (1. - 0.6 * brk) * vInfo.z;
    gl_FragColor = vec4(vec3(cov * uInk), 1.);
  }
`;

const QUAD_VERT = MOVE + /* glsl */`
  varying vec2 vUv; varying vec4 vInfo; varying vec3 vCol;   // vInfo: shape, seed, coverage, ragged
  uniform vec3 uCol[7];
  void main() {
    vec3 cen = moveP(iA);
    vec3 pu = moveP(iA + iB) - cen, pv = moveP(iA + iC) - cen;
    vec4 mv; float cov = 1.;
    if (iQ.z > 0.5) {
      float r = length(pu);
      mv = modelViewMatrix * vec4(cen, 1.);
      float rpx = r * projectionMatrix[1][1] * uRes.y * 0.5 / max(-mv.z, 1e-3);
      float k = max(rpx, 1.1) / max(rpx, 1e-4);
      cov = iQ.z > 1.5 ? smoothstep(0.3, 1., rpx / 1.1) : clamp(rpx / 1.1, 0.4, 1.);   // 2: vanish when tiny, 1: stay as a pale speck
      mv.xy += position.xy * r * min(k, 400.);
    } else {
      mv = modelViewMatrix * vec4(cen + pu * position.x + pv * position.y, 1.);
    }
    gl_Position = projectionMatrix * mv;
    vUv = position.xy;
    vInfo = vec4(iQ.x, iW.y, cov, iW.x);
    vCol = uCol[int(clamp(iQ.y, 0., 6.) + 0.5)];
  }
`;
// Blot shapes: 0 disc, 1 crescent, 2 lozenge, 3 hourglass, 4 asterisk of four crossed strokes, 5 plate (bean),
// 6 dry-brushed earth island. Signed distance in the quad's own -1..1 coordinates, edge wobbled by noise.
const QUAD_FRAG = /* glsl */`
  uniform sampler2D uNoise; uniform float uInk, uUseCol, uGain;
  varying vec2 vUv; varying vec4 vInfo; varying vec3 vCol;
  float sdSeg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-5), 0., 1.); return length(pa - ba * h); }
  void main() {
    vec2 uv = vUv; float seed = vInfo.y, rag = vInfo.w; int shape = int(vInfo.x + 0.5);
    vec2 so = vec2(fract(seed * 0.731), fract(seed * 1.37));
    float n1 = texture2D(uNoise, uv * 0.13 + so).r - 0.5;
    float n2 = texture2D(uNoise, uv * 0.47 + so.yx).g - 0.5;
    vec2 sq = abs(uv.x) + abs(uv.y) < 1e-3 ? vec2(1e-3, 0.) : uv;
    // dry-brush grain: isotropic on the earth, streaks that run round the edge on every other blot
    vec2 guv = shape == 6 ? uv * 5.5 : vec2(atan(sq.y, sq.x) * 0.31831, length(uv) * 1.4);
    float n3 = texture2D(uNoise, guv + so).b;
    float grain0 = 1. - smoothstep(0.2, 0.7, length(fwidth(uv)) * 0.47 * 24.);
    float d;
    if (shape == 1) {
      d = max(length(uv) - 0.92, -(length(uv - vec2(0.37, 0.03)) - 0.80));
    } else if (shape == 2) {
      d = (abs(uv.x) / 0.56 + abs(uv.y) / 0.92 - 1.) * 0.46;
    } else if (shape == 3) {
      float cap = length(vec2(uv.x * 0.9, max(abs(uv.y) - 0.62, 0.) * 2.4)) - 0.74;     // rounded outer ends
      d = max(cap, abs(uv.x) - (0.075 + 0.62 * uv.y * uv.y + 0.16 * abs(uv.y)));
    } else if (shape == 4) {
      d = 1e3;
      for (int i = 0; i < 4; i++) {
        float fi = float(i), an = fi * 0.7854 + sin(seed * (3.1 + fi * 1.7)) * 0.15;
        vec2 dir = vec2(cos(an), sin(an));
        float L = 0.79 + 0.13 * sin(seed * 5.3 + fi * 2.1), al = dot(uv, dir);
        float hw = 0.05 + 0.017 * sin(al * 7. + seed + fi * 1.3) + 0.035 * smoothstep(0.5, 1., abs(al) / L);
        d = min(d, sdSeg(uv, -dir * L, dir * L) - hw);
      }
    } else if (shape == 5) {
      d = length(uv * vec2(1., 1.22) + vec2(0., 0.2 * sin(uv.x * 2.2 + seed))) - 0.84;
    } else if (shape == 6) {
      d = length(uv * vec2(1., 1.12)) - 0.6 + n1 * 0.55 + n2 * 0.2 * grain0;
    } else {
      d = length(uv) - 0.9;
    }
    d += (n1 * 0.075 + n2 * 0.035) * rag;
    float aa = max(fwidth(d) * 0.75, 1e-4);
    float cov = 1. - smoothstep(-aa, aa, d);
    float band = smoothstep(-0.06 * max(rag, 0.3) * (shape == 6 ? 5. : 1.), 0.005, d);   // dry-brush fringe just inside the edge
    float grain = 1. - smoothstep(0.5, 1.6, length(fwidth(uv)) * (shape == 6 ? 5.5 : 1.4) * 64.);   // no speckle once the noise is under a pixel
    cov *= 1. - band * smoothstep(0.45, 0.55, n3) * min(rag, 1.) * 0.9 * grain;
    vec3 col = mix(vec3(uInk), vCol * uGain * (1. - 0.09 * n2), uUseCol);
    gl_FragColor = vec4(min(col * (cov * vInfo.z), vec3(1.)), 1.);
  }
`;

function strokeGeometry(segs) {
  // strip of segs body segments plus one cap segment at each end; position = (t, side, cap)
  const rows = [[0, -1]]; for (let i = 0; i <= segs; i++) rows.push([i / segs, 0]); rows.push([1, 1]);
  const pos = [], idx = [];
  rows.forEach(([t, cap], r) => { pos.push(t, -1, cap, t, 1, cap); if (r > 0) { const o = (r - 1) * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); } });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  return g;
}
function quadGeometry() {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}
function instanced(base, col) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
  const buf = new THREE.InstancedInterleavedBuffer(new Float32Array(col.d), 20);
  g.setAttribute('iA', new THREE.InterleavedBufferAttribute(buf, 3, 0));
  g.setAttribute('iB', new THREE.InterleavedBufferAttribute(buf, 3, 3));
  g.setAttribute('iC', new THREE.InterleavedBufferAttribute(buf, 3, 6));
  g.setAttribute('iW', new THREE.InterleavedBufferAttribute(buf, 4, 9));
  g.setAttribute('iOwn', new THREE.InterleavedBufferAttribute(buf, 4, 13));
  g.setAttribute('iQ', new THREE.InterleavedBufferAttribute(buf, 3, 17));
  g.instanceCount = col.count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 130, -200), 420);
  return g;
}
// blend: 'mul' = dst * (1 - src) (knock-out and ink), 'stain' = src + dst - 2 src dst
function passMaterial(vert, frag, uniforms, blend) {
  return new THREE.ShaderMaterial({
    vertexShader: vert, fragmentShader: frag, uniforms, fog: false, side: THREE.DoubleSide,
    depthTest: true, depthWrite: false, transparent: true, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
    blendSrc: blend === 'stain' ? THREE.OneMinusDstColorFactor : THREE.ZeroFactor, blendDst: THREE.OneMinusSrcColorFactor,
    blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor, toneMapped: false,
  });
}

// ---------------------------------------------------------------- the piece
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('long-ladder') : ctx.rng;
  const palette = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const gain = opts.gain ?? 1, duration = opts.duration ?? 45;
  const shortS = collector(), longS = collector(), inkQ = collector(), blotQ = collector();
  const seed = () => rng.range(0, 40);
  // stroke from a to c bowed by the vector bow (the curve passes half of it off the chord)
  const stroke = (col, a, c, bow, width, o = {}) => col.push(a, add(mid(a, c), bow || [0, 0, 0]), c,
    [width, seed(), o.group || 0, o.mode || 0], o.own || (o.spacing ? [o.spacing, 0, 0, 0] : NO_OWN), [o.minPx ?? 2, o.taper || 0, o.chain ? 1 : 0]);
  // ink dot facing the camera
  const dot = (p, r, o = {}) => inkQ.push(p, [r, 0, 0], [0, r, 0], [o.rag ?? 0.7, seed(), o.group || 0, o.mode || 0], o.own || NO_OWN, [0, 0, o.keep ? 1 : 2]);
  // world-fixed blot: centre, half-axes U and V, shape, colour id (0 ink, 2 red, 3 yellow, 6 green, 5 earth)
  const blot = (p, U, V, shape, colour, o = {}) => (colour === 0 ? inkQ : blotQ).push(p, U, V, [o.rag ?? 1, seed(), o.group || 0, o.mode || 0], o.own || NO_OWN, [shape, colour, 0]);

  // ---- rails: ten spliced lengths a side, bowing a little, never quite parallel
  const SPL = 48, NSP = LEN / SPL;
  const rails = [-1, 1].map((side) => {
    const nodes = [], ctrls = [];
    for (let j = 0; j <= NSP; j++) {
      const s = j * SPL, edge = j === 0 || j === NSP;
      nodes.push(at(s, side * (halfSep(s) + (edge ? 0 : rng.range(-0.4, 0.4))), edge ? 0 : rng.range(-0.3, 0.3)));
    }
    for (let j = 0; j < NSP; j++) ctrls.push(add(add(mid(nodes[j], nodes[j + 1]), [side * rng.range(-0.3, 1.1), 0, 0]), NX, rng.range(-0.6, 0.6)));
    return { side, nodes, ctrls };
  });
  const railPt = (ri, s) => {
    const r = rails[ri], j = clamp(Math.floor(s / SPL), 0, NSP - 1), t = clamp((s - j * SPL) / SPL, 0, 1), m = 1 - t;
    const a = r.nodes[j], b = r.ctrls[j], c = r.nodes[j + 1];
    return [a[0] * m * m + b[0] * 2 * m * t + c[0] * t * t, a[1] * m * m + b[1] * 2 * m * t + c[1] * t * t, a[2] * m * m + b[2] * 2 * m * t + c[2] * t * t];
  };
  for (const r of rails) for (let j = 0; j < NSP; j++) {
    longS.push(r.nodes[j], r.ctrls[j], r.nodes[j + 1], [0.6, seed(), 0, 0], NO_OWN, [5.5, 0, 0]);
    if (j > 0) {                                           // splice knot: a fat knot, five wraps and two loose ends
      const n = r.nodes[j];
      dot(n, 0.62, { rag: 1.2 });
      for (let k = -2; k <= 2; k++) {
        const o = k * 0.34 + rng.range(-0.05, 0.05);
        stroke(shortS, add(add(n, [0.62, 0, 0]), AX, o - 0.3), add(add(n, [-0.62, 0, 0]), AX, o + 0.3), add([0, 0, 0], NX, 0.5), 0.13, { minPx: -1.3 });
      }
      for (const e of [-1, 1]) {
        const tip = add(add(add(n, [r.side * rng.range(1.2, 2.4), 0, 0]), AX, e * rng.range(0.8, 2.0)), NX, rng.range(0.3, 1.4));
        stroke(shortS, n, tip, add([0, 0, 0], NX, rng.range(0.4, 1.2)), 0.12, { minPx: -1.3, taper: 0.7 });
      }
    }
  }
  await ctx.yield();

  // ---- rungs bowed like smiles, a knot lashed with three ticks at every joint
  const crooked = new Set([rng.int(8, 24), rng.int(26, 44), rng.int(46, 70)]);
  for (let k = 1; k <= NRUNG; k++) {
    const s = k * RUNG, drop = crooked.has(k) ? rng.range(1.2, 2.2) * rng.sign() : 0;
    const a = railPt(0, s - Math.max(drop, 0)), c = railPt(1, s - Math.max(-drop, 0));
    stroke(shortS, a, c, add(add([0, 0, 0], AX, -1.2 + rng.range(-0.25, 0.25)), NX, rng.range(-0.25, 0.25)), 0.42, { spacing: RUNG });
    for (const [j, side] of [[a, -1], [c, 1]]) {
      dot(j, 0.4 + rng.range(-0.04, 0.07), { rag: 1.1 });
      const nt = detail < 0.8 ? 2 : 3;
      for (let i = 0; i < nt; i++) {
        const o = (i - (nt - 1) / 2) * 0.36 + rng.range(-0.06, 0.06), lean = 0.34 * (i % 2 ? -1 : 1);
        stroke(shortS, add(add(j, [side * 0.62, 0, 0]), AX, o - lean), add(add(j, [-side * 0.62, 0, 0]), AX, o + lean), add([0, 0, 0], NX, 0.45), 0.11, { minPx: -1.3 });
      }
    }
  }
  await ctx.yield();

  // ---- the top: each rail turns up out of the rung plane and rolls into a scroll 9 m across beside the ring's seat
  const XV = [1, 0, 0], NT = norm3(add(NX, AX, 0.28));          // scroll plane leans back a little
  for (const r of rails) {
    const side = r.side, end = r.nodes[NSP], R0 = 4.5, turns = 1.8, NP = 17, th1 = turns * Math.PI * 2;
    const C = add(at(LEN + 3.2, side * (9 + R0), 0), NT, 5.2);
    const sp = (th, k = 1) => { const rr = R0 * (1 - 0.8 * th / th1) * k; return add(add(C, XV, -side * Math.cos(th) * rr), NT, Math.sin(th) * rr); };
    const p0 = sp(0);
    longS.push(end, add(add(mid(end, p0), AX, 2.2), NX, -2.4), p0, [0.5, seed(), 0, 0], NO_OWN, [2, 0, 1]);
    for (let i = 0; i < NP; i++) {
      const a = (i / NP) * th1, b = ((i + 1) / NP) * th1, h = (b - a) / 2;
      shortS.push(sp(a), sp(a + h, 1 / Math.cos(h)), sp(b), [lerp(0.5, 0.2, (i + 0.5) / NP), seed(), 0, 0], NO_OWN, [2, 0, 1]);
    }
    dot(sp(th1), 0.5, { rag: 1.2 });
    dot(end, 0.55, { rag: 1.2 });
  }

  // ---- feet: a fat knot and dotted root spirals on the earth, with a hairline root leading each one out
  for (const r of rails) {
    const foot = [r.nodes[0][0], 0.08, r.nodes[0][2]];
    dot(add(foot, [0, 0.3, 0]), 0.75, { rag: 1.3 });
    const nSp = 3, base = rng.range(0, Math.PI * 2);
    for (let k = 0; k < nSp; k++) {
      const dir = base + (k / nSp) * Math.PI * 2 + rng.range(-0.4, 0.4), R0 = rng.range(5, 9.5), hand = rng.sign();
      const C = [foot[0] + Math.cos(dir) * R0 + r.side * 3, 0.08, foot[2] + Math.sin(dir) * R0 + 2.5];
      const ph0 = Math.atan2(foot[2] - C[2], foot[0] - C[0]), R1 = Math.hypot(foot[0] - C[0], foot[2] - C[2]);
      const turns = rng.range(1.7, 2.5), th1 = turns * Math.PI * 2, pt = (th) => { const rr = R1 * (1 - 0.86 * th / th1); return [C[0] + Math.cos(ph0 + hand * th) * rr, 0.08, C[2] + Math.sin(ph0 + hand * th) * rr]; };
      stroke(longS, foot, pt(1.5), sub(pt(0.75), mid(foot, pt(1.5))).map((v) => v * 2), 0.16, { minPx: 1.6, taper: 0.8 });
      let th = 0.25, i = 0;
      while (th < th1) {
        const f = th / th1, rr = R1 * (1 - 0.86 * f), rad = lerp(0.3, 0.11, f) * rng.range(0.8, 1.2);
        if (rng() < detail) dot(add(pt(th), [0, rad, 0]), rad, { rag: 0.9 });
        th += (0.5 + rad * 1.6) / Math.max(rr, 0.5); i++;
      }
      dot(add(C, [0, 0.25, 0]), 0.3, { rag: 1 });
    }
  }
  if (opts.earth !== false) blot([0, 0.03, -14], [84, 0, 0], [0, 0, -78], 6, 5, { rag: 1 });
  await ctx.yield();

  // ---- twig-ladders of three rungs sprouting from the rails, each with a small fruit; they flex from their foot
  const nTwig = Math.round(24 * detail) + rng.int(0, 5);
  const FRUIT = [[0, 2], [0, 2], [2, 3], [4, 3], [4, 3], [0, 2], [1, 0], [3, 6]];      // [shape, colour]
  for (let i = 0; i < nTwig; i++) {
    const ri = rng.chance(0.5) ? 0 : 1, side = rails[ri].side, s = lerp(22, 455, (i + rng.range(0.1, 0.9)) / nTwig);
    const foot = railPt(ri, s), under = side < 0 && s < 345;          // port twigs hang below the rungs where the camera climbs alongside
    const elev = under ? rng.range(-1.0, -0.35) : rng.range(-0.3, 1.1), Lt = rng.range(6.5, 12.5) * (under ? 0.8 : 1);
    const dir = norm3(add(add([side * Math.cos(elev), 0, 0], NX, Math.sin(elev)), AX, rng.range(0.15, 0.8)));
    const wv = norm3(cross3(dir, add(NX, AX, rng.range(-0.5, 0.5)))), own = [foot[0], foot[1], foot[2], rng.range(0, 6.28)];
    const bend = add(add([0, 0, 0], AX, rng.range(0.6, 2.2)), NX, rng.range(-1, 1));
    const o = { own, mode: 1 };
    const tr = (t, e) => add(add(add(foot, dir, Lt * t), wv, e * lerp(0.85, 0.5, t)), bend, 4 * t * (1 - t) * 0.5);
    for (const e of [-1, 1]) shortS.push(tr(0, e * 0.3), add(tr(0.5, e), bend, 0.5), tr(1, e), [0.2, seed(), 0, 1], own, [2, 0.25, 0]);
    for (let k = 1; k <= 3; k++) {
      const t = k / 3.6 + rng.range(-0.03, 0.03), a = tr(t, -1), c = tr(t, 1);
      stroke(shortS, a, c, add([0, 0, 0], dir, -0.3), 0.13, { ...o, minPx: -1.4 });
      dot(a, 0.17, o); dot(c, 0.17, o);
    }
    const tip = tr(1, rng.sign()), fr = rng.pick(FRUIT), size = rng.range(1.0, 2.3) * (fr[0] === 4 ? 1.25 : 1);
    const fc = add(add(add(tip, dir, rng.range(1.5, 3.5)), NX, rng.range(-1.5, 2.5)), [side * rng.range(0, 2), 0, 0]);
    stroke(shortS, tip, fc, add(add([0, 0, 0], NX, rng.range(-1.5, 1.5)), AX, rng.range(-1, 1)), 0.1, { ...o, minPx: 1.6 });
    const fn = norm3(add(add(AX, XV, rng.range(-0.7, 0.7)), NX, rng.range(-0.5, 0.2))), fu = norm3(cross3(NX, fn)), fv = cross3(fn, fu), roll = rng.range(-0.6, 0.6);
    const U = add(fu.map((v) => v * Math.cos(roll) * size), fv, Math.sin(roll) * size), V = add(fu.map((v) => -v * Math.sin(roll) * size), fv, Math.cos(roll) * size);
    blot(fc, U, V, fr[0], fr[1], { ...o, rag: 1.1 });
    dot(add(tip, dir, -0.2), 0.2, o);
  }
  await ctx.yield();

  // ---- lesser signs down the ladder's length: small mobiles on stalks with counterweights and plumb dots.
  // Port ones hang below the rungs where the camera climbs alongside; neighbours are unlike colours.
  const LESSER = rng.shuffle([[0, 2], [2, 3], [1, 0], [4, 3], [0, 2], [3, 6], [2, 3], [5, 2], [4, 3]]);
  for (let i = 0; i < LESSER.length; i++) {
    const side = i % 2 ? -1 : 1, ri = side < 0 ? 0 : 1, s = clamp(52 + i * 37 + rng.range(-9, 9), 40, 392), [shape, colour] = LESSER[i];
    const P = railPt(ri, s), under = side < 0 && s < 350, own = [P[0], P[1], P[2], rng.range(0, 6.28)], o = { own, mode: 1 };
    const C = at(s + rng.range(2, 10), side * (halfSep(s) + rng.range(11, 24)), under ? rng.range(-22, -9) : rng.range(5, 22));
    const half = rng.range(4.2, 8.5) * (shape === 4 ? 1.25 : 1) * (shape === 1 ? 1.2 : 1);
    const fn = norm3(add(add([0, 0, 0], AX, -1), [rng.range(-0.35, 0.35), 0, 0])), fu = norm3(cross3(NX, fn)), fv = norm3(cross3(fu, fn)).map((v) => -v), roll = rng.range(-0.5, 0.5);
    const Uv = add(fu.map((v) => v * Math.cos(roll) * half), fv, Math.sin(roll) * half), Vv = add(fu.map((v) => -v * Math.sin(roll) * half), fv, Math.cos(roll) * half);
    blot(C, shape === 3 ? Uv.map((v) => v * 0.72) : Uv, Vv, shape, colour, { ...o, rag: 1.3 });
    stroke(longS, P, C, add([0, 0, 0], NX, (under ? -1 : 1) * rng.range(5, 10)), 0.26, { ...o, taper: 0.45 });
    dot(P, 0.6, { rag: 1.2 }); dot(C, 0.55, o);
    const W = add(add(P, [-side * rng.range(4, 8), 0, 0]), NX, (under ? 1 : -1) * rng.range(3, 7));
    stroke(shortS, P, W, add([0, 0, 0], AX, rng.range(-1.5, 1.5)), 0.18, { ...o, taper: 0.3 });
    dot(W, rng.range(0.7, 1.15), { ...o, rag: 1.1, keep: true });
    for (let k = 0, y = half * 0.9 + 1; k < 5; k++) { const rr = lerp(0.5, 0.2, k / 5); dot(add(C, [Math.sin(k * 1.7) * 0.3, -y, 0]), rr, o); y += 1.1 + rr * 2.2; }
  }
  await ctx.yield();

  // ---- tenders: a bent line, a dot off to one side, one zigzag wire leg, a plate of colour; some carry a star up.
  // Each hops the whole ladder one rung a hop (closed form in the shader), shrinking away into the ring at the top.
  const NT_ = 16, tenders = [], TS = 0.75;
  for (let i = 0; i < NT_; i++) {
    const lane = (i % 2 ? 1 : -1) * rng.range(3.1, 4.1), F = at(0, lane, 0), own = [F[0], F[1], F[2], (i * 5 + rng.int(0, 1)) % 77 + rng()];
    const o = { own, mode: 2 }, sd = rng.sign(), up = (h, x = 0, a = 0) => add(add(add(F, NX, h * TS), XV, x * TS), AX, a * TS);      // TS: the brief's 2.4 m
    for (let k = 0; k < 5; k++) stroke(shortS, up(k * 0.16, k === 0 ? 0 : (k % 2 ? 0.36 : -0.36)), up((k + 1) * 0.16, k === 4 ? 0 : (k % 2 ? -0.36 : 0.36)), null, 0.1, { ...o, minPx: 1.5 });
    const bendX = rng.range(0.25, 0.5) * rng.sign(), top = up(3.2, bendX * 0.3);
    stroke(shortS, up(0.8), top, [bendX, 0, 0], 0.24, { ...o, minPx: 2 });
    const dp = up(3.2 + rng.range(0.1, 0.5), bendX * 0.3 + sd * rng.range(0.7, 0.95));
    stroke(shortS, top, dp, add([0, 0, 0], NX, 0.35), 0.08, { ...o, minPx: 1.5 });
    dot(dp, 0.25, { ...o, rag: 0.8, keep: true });
    const pc = up(rng.range(1.7, 2.3), bendX * 0.5 - sd * 0.15, -0.12), ps = rng.range(0.6, 0.8) * TS, tw = rng.range(-0.7, 0.7);
    blot(pc, add([Math.cos(tw) * ps, 0, 0], AX, Math.sin(tw) * ps), add([0, 0, 0], NX, ps), 5, rng.chance(0.55) ? 2 : 3, { ...o, rag: 1 });
    const carries = i % 5 !== 3 && rng.chance(0.7);
    if (carries) {
      const sc = up(4.5, bendX * 0.3 - sd * 0.5), ss = rng.range(0.7, 0.95), t2 = rng.range(-0.6, 0.6);
      stroke(shortS, top, sc, [-sd * 0.3, 0, 0], 0.05, { ...o, minPx: 1.5 });
      blot(sc, add([Math.cos(t2) * ss, 0, 0], AX, Math.sin(t2) * ss), add([0, 0, 0], NX, ss), 4, 3, { ...o, rag: 0.6 });
    }
    tenders.push({ lane, phase: own[3], carries });
  }
  await ctx.yield();

  // ---- the mobile: four great signs balanced on stalks with counterweights. Group g swings about the axis K
  // through its pivot on a rail (uPiv/uAxs), tips like a lever as it rebalances, and its blot may turn about
  // its own centre (uCen/uNr). Everything of a sign carries its group, so it never leaves its joint.
  const vz = () => new THREE.Vector4(0, 1, 0, 0);
  const G = { piv: [vz(), vz(), vz(), vz(), vz()], axs: [vz(), vz(), vz(), vz(), vz()], cen: [vz(), vz(), vz(), vz(), vz()], nr: [vz(), vz(), vz(), vz(), vz()], arm: [vz(), vz(), vz(), vz(), vz()] };
  const signs = [];
  const sz = rng.range(0.93, 1.07);
  // name, group, rail (0 port, 1 starboard), s, centre [x, h], half size, stalk bow [x, h], counterweight [x, h, r], swing amp, period s, phase
  const SIGNS = [
    { name: 'sun', g: 1, ri: 0, s: 300, c: [-70, 9], half: 39 * sz, bow: [-12, -22], cw: [17, 19, 2.7], amp: 0.6, per: 26, ph: 2.78, dipPh: 0.4 },
    { name: 'crescent', g: 2, ri: 1, s: 360, c: [55, 16], half: 23 * sz, bow: [12, 20], cw: [-5, -15, 2.2], amp: 0.5, per: 22, ph: 1.1, dipPh: 2.1 },
    { name: 'star', g: 3, ri: 1, s: 400, c: [-24, 40], half: 22 * sz, bow: [-6, 0], cw: [24, -11, 2.0], amp: 0.5, per: 29, ph: 4.0, dipPh: 3.3 },
    { name: 'hourglass', g: 4, ri: 0, s: 440, c: [-25, 15], half: 15 * sz, bow: [-9, 18], cw: [-1, 21, 1.7], amp: 0.25, per: 24, ph: 5.2, dipPh: 5.0 },      // (round 4e) the brief's station: "at 440 m, 25 m to port ... 30 m tall"; it stood behind the ring's plane, in the quiet pool
  ];
  for (const S of SIGNS) {
    const g = S.g, P = railPt(S.ri, S.s), K = norm3(add(NX, [rng.range(-0.06, 0.06), 0, 0])), C = at((S.cs ?? S.s) + rng.range(-4, 4), S.c[0], S.c[1]);
    const r = sub(C, P), kr = r[0] * K[0] + r[1] * K[1] + r[2] * K[2], armV = sub(r, K.map((v) => v * kr)), armL = len3(armV), armD = norm3(armV);
    G.piv[g].set(P[0], P[1], P[2], 0); G.axs[g].set(K[0], K[1], K[2], 0); G.cen[g].set(C[0], C[1], C[2], 0); G.arm[g].set(armD[0], armD[1], armD[2], armL);
    const o = { group: g };
    // the blot faces back down the ladder with a small seeded tilt; U to starboard, V above the rungs
    const fn = norm3(add(add([0, 0, 0], AX, -1), [rng.range(-0.15, 0.15), 0, 0])), fu = norm3(cross3(NX, fn)), fv = norm3(cross3(fu, fn)).map((v) => -v);
    const U = fu.map((v) => v * S.half), V = fv.map((v) => v * S.half);
    const inPlane = (x, y) => add(add(C, fu, x * S.half), fv, y * S.half);
    let spinAxis = fn, attach = C;
    if (S.name === 'sun') {
      blot(C, U, V, 0, 2, { group: g, rag: 1.7 });
      attach = inPlane(0.42, 0.12);
      // hairline orbit: a circle of radius ~1.13 half-sizes tipped 72 degrees out of the disc's plane, with a yellow planet
      const tip = rng.range(0.3, 0.6) * rng.sign(), e1 = norm3(add(fu.map((v) => v * Math.cos(tip)), fv, Math.sin(tip)));
      const e2p = norm3(add(fu.map((v) => -v * Math.sin(tip)), fv, Math.cos(tip))), e2 = norm3(add(e2p.map((v) => v * 0.31), fn, 0.95));
      const Ro = S.half * 1.13, oc = (a, k = 1) => add(add(C, e1, Math.cos(a) * Ro * k), e2, Math.sin(a) * Ro * k), NO = 10, h = Math.PI / NO;
      for (let i = 0; i < NO; i++) longS.push(oc(i * 2 * h), oc(i * 2 * h + h, 1 / Math.cos(h)), oc(i * 2 * h + 2 * h), [0.2, seed(), 8 + g, 0], NO_OWN, [2, 0, 1]);
      blotQ.push(oc(0.5), [4.6, 0, 0], [0, 4.6, 0], [1.2, seed(), 8 + g, 0], NO_OWN, [0, 3, 1]);       // the planet: yellow, green where it crosses the disc
      inkQ.push(oc(0.5 + Math.PI), [1.5, 0, 0], [0, 1.5, 0], [0.8, seed(), 8 + g, 0], NO_OWN, [0, 0, 1]);
      spinAxis = norm3(cross3(e1, e2));
    } else if (S.name === 'crescent') {
      blot(C, U.map((v) => -v), V, 1, 0, { group: 8 + g, rag: 1.2 });
      attach = inPlane(0.55, 0.0);
      dot(inPlane(-0.2, 0.05), 1.6, { group: 8 + g, rag: 1 });                                         // a seed dot held in the crescent's arms
    } else if (S.name === 'star') {
      blot(C, U, V, 4, 3, { group: 8 + g, rag: 0.8 });
      const rc = inPlane(0.34, -0.5);
      blotQ.push(rc, [3.4, 0, 0], [0, 3.4, 0], [1.2, seed(), g, 0], NO_OWN, [0, 2, 1]);                // red companion: the star's strokes sweep through it
      stroke(longS, C, rc, fu.map((v) => v * 4), 0.14, { ...o, minPx: 1.6 });
    } else {
      blot(C, U.map((v) => v * 0.72), V, 3, 6, { group: 8 + g, rag: 1.1 });
      dot(inPlane(0, 0), 0.9, { group: g });
    }
    G.nr[g].set(spinAxis[0], spinAxis[1], spinAxis[2], 0);
    // stalk from the rail, lashed at its foot, and the counterweight on the other end of the lever
    stroke(longS, P, attach, add(add([0, 0, 0], XV, S.bow[0] - (P[0] + attach[0]) * 0.5 + P[0]), NX, S.bow[1]), 0.42, { ...o, taper: 0.45 });
    dot(P, 0.8, { rag: 1.3 }); dot(attach, 1.1, { ...o, rag: 1.1 });
    for (let i = -1; i <= 1; i++) stroke(shortS, add(add(P, [0.8, 0, 0]), AX, i * 0.42 - 0.35), add(add(P, [-0.8, 0, 0]), AX, i * 0.42 + 0.35), add([0, 0, 0], NX, 0.7), 0.14, { minPx: -1.3 });
    const W = add(add(P, XV, S.cw[0] - P[0]), NX, S.cw[1]);
    stroke(longS, P, W, add(add([0, 0, 0], NX, S.cw[1] * 0.55), AX, rng.range(-2, 2)), 0.3, { ...o, taper: 0.4 });
    dot(W, S.cw[2], { ...o, rag: 1.2, keep: true });
    // a dotted plumb trail hanging from the sign, shrinking as it falls
    const t0 = inPlane(rng.range(-0.3, 0.3), S.name === 'star' ? -0.2 : -0.8), nd = rng.int(6, 9);
    for (let i = 0, y = 2; i < nd; i++) { const rr = lerp(0.95, 0.3, i / nd); dot(add(t0, [Math.sin(i * 1.3) * 0.5, -y, 0]), rr, { ...o, rag: 0.9 }); y += 1.6 + rr * 2.4; }
    signs.push({ ...S, P, K, C, armL, U, V, fn, attach });
  }
  await ctx.yield();

  // ---- resident tenders: larger ones that keep a rung (mode 3), so the climb and the last rungs always have
  // their cast whatever the hour. Drawn from their own stream, after everything else, so the ladder is unchanged.
  {
    const r2 = rng.fork ? rng.fork('residents') : rng;
    const resident = (s, lane, sc, carries) => {
      const F = at(s - 0.6 * (1 - (lane * lane) / (halfSep(s) * halfSep(s))), lane, 0.15);       // on the rung's smile
      const own = [F[0], F[1], F[2], r2.range(0, 20) + 100 * Math.round(sc * 10 - 10)], o = { own, mode: 3 }, sd = r2.sign();
      const up = (h, x = 0, a = 0) => add(add(add(F, NX, h * sc), XV, x * sc), AX, a * sc);
      for (let k = 0; k < 5; k++) stroke(shortS, up(k * 0.16, k === 0 ? 0 : (k % 2 ? 0.4 : -0.4)), up((k + 1) * 0.16, k === 4 ? 0 : (k % 2 ? -0.4 : 0.4)), null, 0.13 * sc, { ...o, minPx: 1.8 });
      const bendX = r2.range(0.3, 0.55) * r2.sign(), top = up(3.2, bendX * 0.3);
      stroke(shortS, up(0.8), top, [bendX * sc, 0, 0], 0.3 * sc, { ...o, minPx: 2.4 });
      const dp = up(3.2 + r2.range(0.1, 0.5), bendX * 0.3 + sd * r2.range(0.8, 1.05));
      stroke(shortS, top, dp, add([0, 0, 0], NX, 0.35 * sc), 0.1 * sc, { ...o, minPx: 1.6 });
      dot(dp, 0.36 * sc, { ...o, rag: 0.8, keep: true });
      const pc = up(r2.range(1.7, 2.2), bendX * 0.5 - sd * 0.2, -0.12), ps = r2.range(0.7, 0.9) * sc, tw = r2.range(-0.5, 0.5);
      blot(pc, add([Math.cos(tw) * ps, 0, 0], AX, Math.sin(tw) * ps), add([0, 0, 0], NX, ps), 5, r2.chance(0.55) ? 2 : 3, { ...o, rag: 1 });
      if (carries) {
        const sc2 = up(4.7, bendX * 0.3 - sd * 0.6), ss = r2.range(0.85, 1.1) * sc, t2 = r2.range(-0.6, 0.6);
        stroke(shortS, top, sc2, [-sd * 0.3 * sc, 0, 0], 0.07 * sc, { ...o, minPx: 1.6 });
        blot(sc2, add([Math.cos(t2) * ss, 0, 0], AX, Math.sin(t2) * ss), add([0, 0, 0], NX, ss), 4, 3, { ...o, rag: 0.6 });
      }
    };
    // beside the camera's climb (it rides outside the port rail to s 290, crosses to the axis by s 360)
    // (round 4e: every resident is the brief's 2.4 m, TS; no scale is drawn for them any more)
    for (const [s, lane] of [[18, -2.2], [30, 2.6], [48, -1.4], [66, 2]]) resident(s, lane, TS, s !== 30);      // the first rungs, seen from the feet
    for (let s = 96, i = 0; s <= 276; s += 12, i++) resident(s, i % 2 ? r2.range(-0.8, 1.2) : -r2.range(2.4, 4), TS, i % 3 !== 2);
    for (let s = 294, i = 0; s <= 354; s += 18, i++) resident(s, r2.range(4.6, 6), TS, false);
    // (round 4e; the brief, journey F: "rungs and hopping tenders pass beneath") one on every second rung of the last stretch
    for (let s = 372, i = 0; s <= 432; s += 12, i++) resident(s, (i % 2 ? 1 : -1) * r2.range(5.6, 6.4), TS, i % 2 === 0);
    // the last rungs before the missing one: one each side of the way through
    resident(444, -5.7, TS, true); resident(450, 5.5, TS, false); resident(462, -6.6, TS, true);
    // the crown: small mobiles on stalks either side of the last rungs, facing down the ladder, so the approach to
    // the ring is hung with signs. [s of the lashing, x, h above the rungs, shape, colour, half size]
    const CROWN = [[407, 19, 13, 2, 3, 3.6], [413, -20, 12, 0, 2, 3.4], [421, 24, 18, 1, 0, 4.2], [456, -22, 15, 4, 3, 4.6], [459, 23, 12, 0, 2, 3],
      [465, -28, 9, 2, 3, 3.4], [469, 29, 15, 1, 0, 4.2], [477, 17, 23, 0, 2, 2.8], [479, -15, 25, 2, 3, 3]];
    const r3 = ctx.core.makeRng(ctx.core.hashSeed('long-ladder-crown:' + ctx.seed));      // the crown's number of signs changed this round: a named stream of its own, which draws from no parent
    for (const [s, x, h, shape, colour, half0] of CROWN) {
      if (s > 474) continue;      // (round 4e) the quiet pool: nothing of the crown stands behind the ring's plane
      const side = x < 0 ? -1 : 1, P = railPt(side < 0 ? 0 : 1, Math.min(s - 6, 476)), own = [P[0], P[1], P[2], r3.range(0, 6.28)], o = { own, mode: 1 };
      const C = at(s + r3.range(-1.5, 1.5), x + r3.range(-1.5, 1.5), h + r3.range(-1.5, 1.5)), half = half0 * r3.range(0.9, 1.15);
      const fn = norm3(add(add([0, 0, 0], AX, -1), [r3.range(-0.2, 0.2), 0, 0])), fu = norm3(cross3(NX, fn)), fv = norm3(cross3(fu, fn)).map((v) => -v), roll = r3.range(-0.5, 0.5);
      const Uv = add(fu.map((v) => v * Math.cos(roll) * half), fv, Math.sin(roll) * half), Vv = add(fu.map((v) => -v * Math.sin(roll) * half), fv, Math.cos(roll) * half);
      blot(C, shape === 3 ? Uv.map((v) => v * 0.72) : Uv, Vv, shape, colour, { ...o, rag: 1.2 });
      stroke(longS, P, C, add([0, 0, 0], NX, r3.range(3, 6)), 0.24, { ...o, taper: 0.45, minPx: 2.4 });
      dot(P, 0.55, { rag: 1.2 }); dot(C, 0.5, o);
      const W = add(add(P, [-side * r3.range(2.5, 4.5), 0, 0]), NX, -r3.range(2.5, 5));
      stroke(shortS, P, W, add([0, 0, 0], AX, r3.range(-1, 1)), 0.17, { ...o, taper: 0.3, minPx: 2 });
      dot(W, r3.range(0.6, 0.95), { ...o, rag: 1.1, keep: true });
      for (let k = 0, y = half * 0.9 + 0.8; k < 4; k++) { const rr = lerp(0.42, 0.18, k / 4); dot(add(C, [Math.sin(k * 1.7) * 0.25, -y, 0]), rr, o); y += 0.9 + rr * 2.2; }
    }
  }
  await ctx.yield();

  // ---- meshes: five draws over three instanced geometries, in the style's pass order
  const noiseTex = opts.noiseTex || await makeNoiseTex(rng.fork ? rng.fork('noise') : rng, ctx);
  const ownNoise = !opts.noiseTex;
  const cols = palette.slice(0, 7).map((h) => { const c = new THREE.Color(h); return new THREE.Vector3(c.r, c.g, c.b); });
  const U = {
    uTime: { value: 0 }, uHop: { value: 0 }, uRes: { value: new THREE.Vector2(800, 450) }, uFlex: { value: new THREE.Vector2() },
    uA: { value: new THREE.Vector3(...AX) }, uN: { value: new THREE.Vector3(...NX) }, uNoise: { value: noiseTex },
    uPiv: { value: G.piv }, uAxs: { value: G.axs }, uCen: { value: G.cen }, uNr: { value: G.nr }, uArm: { value: G.arm },
    uCol: { value: cols }, uGain: { value: gain },
  };
  const object = new THREE.Group(); object.name = 'long-ladder';
  const sBase = strokeGeometry(6), lBase = strokeGeometry(24), qBase = quadGeometry();
  const mk = (geo, mat, order, name) => { const m = new THREE.Mesh(geo, mat); m.renderOrder = order; m.frustumCulled = false; m.name = name; object.add(m); return m; };
  const blotGeo = instanced(qBase, blotQ);
  mk(blotGeo, passMaterial(QUAD_VERT, QUAD_FRAG, { ...U, uInk: { value: 1 }, uUseCol: { value: 0 } }, 'mul'), 3, 'knock-out');
  mk(blotGeo, passMaterial(QUAD_VERT, QUAD_FRAG, { ...U, uInk: { value: 1 }, uUseCol: { value: 1 } }, 'stain'), 4, 'stain');
  await ctx.yield();
  mk(instanced(qBase, inkQ), passMaterial(QUAD_VERT, QUAD_FRAG, { ...U, uInk: { value: opts.ink ?? 0.975 }, uUseCol: { value: 0 } }, 'mul'), 5, 'ink-dots');
  mk(instanced(sBase, shortS), passMaterial(STROKE_VERT, STROKE_FRAG, { ...U, uInk: { value: opts.ink ?? 0.975 }, uWave: { value: new THREE.Vector2(0.8, 1.7) } }, 'mul'), 5, 'ink-short');
  mk(instanced(lBase, longS), passMaterial(STROKE_VERT, STROKE_FRAG, { ...U, uInk: { value: opts.ink ?? 0.975 }, uWave: { value: new THREE.Vector2(2.3, 5.1) } }, 'mul'), 5, 'ink-long');
  await ctx.yield();

  // ---- motion
  let progress = -1;
  const size = new THREE.Vector2(), TAU = Math.PI * 2;
  const pose = { ang: [0, 0, 0, 0, 0], dip: [0, 0, 0, 0, 0] };
  const setPose = (T) => {
    for (const S of signs) {
      pose.ang[S.g] = S.amp * Math.sin(TAU * T / S.per + S.ph);
      pose.dip[S.g] = 3 * Math.sin(TAU * T / (S.per * 0.62) + S.dipPh);
      G.piv[S.g].w = pose.ang[S.g]; G.axs[S.g].w = pose.dip[S.g];
    }
    G.cen[1].w = 0.2 * T;                                   // the planet rides its hairline round the sun
    G.cen[2].w = 0.38 * Math.sin(TAU * T / 17 + 1);         // the crescent rocks
    G.cen[3].w = 0.09 * T;                                  // the star twinkles by turning
    G.cen[4].w = 0.15 * T + 0.4;                            // the hourglass forever turns over
  };
  const flexAt = (t, out) => out.set(4.2 * Math.sin(0.23 * t) + 1.6 * Math.sin(0.41 * t + 1), 1.8 * Math.sin(0.19 * t + 2));
  setPose(0);
  const _r = new THREE.Vector3(), _k = new THREE.Vector3(), _q = new THREE.Quaternion();
  const signFrom = (i, ang, dip, f, out) => {                // centre of sign i at a swing angle, a dip and a flex of the ladder, local
    const S = signs[i]; _k.set(...S.K); _q.setFromAxisAngle(_k, ang);
    _r.set(S.C[0] - S.P[0], S.C[1] - S.P[1], S.C[2] - S.P[2]).applyQuaternion(_q);
    out.set(S.P[0], S.P[1], S.P[2]).add(_r).addScaledVector(U.uN.value, dip);
    const s = Math.max(out.dot(U.uA.value), 0) / LEN;
    out.x += f.x * s * s; out.addScaledVector(U.uN.value, f.y * s * s);
    return out;
  };
  const signPose = (i, out = new THREE.Vector3()) => signFrom(i, pose.ang[signs[i].g], pose.dip[signs[i].g], U.uFlex.value, out);       // current centre of sign i (0 sun, 1 crescent, 2 star, 3 hourglass), local
  // the same at a given moment of the flight (progress 0..1) and of the clock (for the ladder's flex), worked out from
  // those two alone, whatever pose and flex the last update left: for gaze entries
  const _fx = new THREE.Vector2();
  const signPoseAt = (i, prog, time, out = new THREE.Vector3()) => { const S = signs[i], T = clamp(prog, 0, 1) * duration;
    return signFrom(i, S.amp * Math.sin(TAU * T / S.per + S.ph), 3 * Math.sin(TAU * T / (S.per * 0.62) + S.dipPh), flexAt(time, _fx), out); };

  const signNormal = (i, out = new THREE.Vector3()) => {     // the way sign i's blot faces now (local, unit)
    const S = signs[i]; _k.set(...S.K); _q.setFromAxisAngle(_k, pose.ang[S.g]);
    return out.set(S.fn[0], S.fn[1], S.fn[2]).applyQuaternion(_q);
  };

  const v3 = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  const anchors = {
    axis: v3(AX), normal: v3(NX),                             // climb direction and "above the rungs"
    at: (s, x = 0, h = 0) => v3(at(s, x, h)),                 // s m up the axis, x m to starboard, h m above the rungs
    foot: v3([0, 0, 0]), top: v3(at(LEN, 0, 0)),
    // the 14 m ring: centre 5 m above the rung plane where rung 79 is missing, square to the axis (tilt true)
    portalSeat: { position: v3(at(474, 0, 5)), facing: v3(AX), normal: v3(AX).negate(), up: v3(NX), radius: 7 },
    // brief beats D, E, F: alongside to port and 4 m above the rungs, drift over the port rail, then the axis at 5 m
    flyThrough: [at(40, -halfSep(40) - 12, 4), at(120, -halfSep(120) - 12, 4), at(200, -halfSep(200) - 12, 4), at(248, -halfSep(248) - 11, 4),
      at(292, -11, 4.5), at(326, -2, 5), at(360, 0, 5), at(420, 0, 5), at(474, 0, 5), at(505, 0, 5)].map(v3),
    viewpoints: { entry: v3([-150, 14, 300]), alongside: v3(at(150, -20, 4)), mobile: v3(at(285, -14, 4)), axisRun: v3(at(340, 0, 5)) },
    // rest centres and radii of the four great signs; use hero.signPose(i) for where they are now
    signs: signs.map((S) => ({ name: S.name, center: v3(S.C), radius: S.half * 0.92, pivot: v3(S.P), hold: v3(S.attach) })),      // hold: where the stalk holds the sign, at rest
    tenderLanes: tenders.map((t) => t.lane),
  };

  return {
    object, radius: 200, height: 262, center: new THREE.Vector3(0, 135, -215), anchors,
    ground: false, groundY: 0,
    counts: { short: shortS.count, long: longS.count, inkQuads: inkQ.count, blots: blotQ.count,
      triangles: shortS.count * 16 + longS.count * 52 + (inkQ.count + blotQ.count * 2) * 2 },
    setProgress(u) { progress = u == null ? -1 : clamp(u, 0, 1); },
    signPose, signPoseAt, signNormal,
    update(dt, time, camera) {
      U.uTime.value = time % 3600;
      U.uHop.value = (time * 0.55) % 77;
      flexAt(time, U.uFlex.value);
      setPose(progress >= 0 ? progress * duration : time);
      if (ctx.renderer && ctx.renderer.getDrawingBufferSize) { ctx.renderer.getDrawingBufferSize(size); if (size.y > 0) U.uRes.value.copy(size); }
    },
    dispose() { if (ownNoise) noiseTex.dispose(); sBase.dispose(); lBase.dispose(); qBase.dispose(); },
  };
}

// Shared with the world module (src/worlds/ladder-orchard.js) so the orchard is drawn with the same strokes,
// blots and passes as the Long Ladder. strokeVert(move) / quadVert(move) take a replacement for the MOVE chunk
// (it must declare the instance attributes, uTime, uRes and vec3 moveP(vec3 p)).
export const inkKit = {
  collector, instanced, passMaterial, strokeGeometry, quadGeometry, makeNoiseTex,
  strokeVert: (move) => move + STROKE_VERT.slice(MOVE.length), quadVert: (move) => move + QUAD_VERT.slice(MOVE.length),
  STROKE_FRAG, QUAD_FRAG,
};
