// Firefly Lantern. You walk behind a bent bamboo pole. It comes up out of the bottom-right corner of
// the frame (cord-wrapped grip, a brass prayer bell and inked paper slips tied half-way up), bows
// over into a crook at the top and carries a pleated paper lantern that hangs free of it in the
// upper right of the picture: split-bamboo ribs (drawn in the paper shader), lacquered caps with a
// gilt line, a wire bail, a bead and a silk tassel underneath. There is no lamp inside. What lights
// the paper depends on the world it is carried through: drifting fireflies, a flickering flame, a
// captured star, or glowing moss under water (where the lantern becomes a diver's lamp and bubbles
// rise from it). More fireflies circle outside with a moth or two, and soft additive halos stand in
// for the light it would throw. No three.js light is used.
// Ride space: the eye is at the origin looking down -Z, +Y up, metres.
// Draw calls: 3 (pole, lantern, one additive sprite mesh for halos + fireflies/bubbles + moths).
// About 8k triangles.
import * as THREE from 'three';

const PI = Math.PI, TAU = PI * 2;
const WRAP = 200 * PI;   // every shader frequency is a multiple of 0.01 rad/s, so phases wrap here unseen
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const clamp01 = (x) => Math.min(1, Math.max(0, x));
const ss = (a, b, x) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// 0 below -k, x above +k, a smooth knee between: how far something has gone past a limit
const over = (x, k) => (x <= -k ? 0 : x >= k ? x : (x + k) * (x + k) / (4 * k));
const T = (x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) =>
  new THREE.Matrix4().compose(V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), V3(sx, sy, sz));

// ---- layout (ride space at rest). The shaft stays in the outer 15% of the frame; the crook reaches
// 0.35 m back toward the picture so the lantern hangs clear of it at about 77% of the half-width.
const POLE = [V3(0.8, -1.12, -0.5), V3(0.87, -0.57, -0.95), V3(1.47, -0.05, -1.52), V3(1.8, 0.52, -1.74), V3(1.77, 0.85, -1.77), V3(1.62, 0.965, -1.77), V3(1.45, 0.93, -1.77)];
const HAND = POLE[0];                                  // the whole thing pivots about the hand
const TIP = POLE[POLE.length - 1];
const SHAFT_X = 1.8;                                   // where the shaft stands beside the hanging lantern
const PIVOT = V3(TIP.x, TIP.y - 0.07, TIP.z);          // the ring the lantern's bail hangs in
const CAP_R = 0.062;                                   // radius of the lacquer caps

// Collects geometry into one buffer: position, normal, colour, aSw (how far a vertex trails), aGlow
// (1 = paper, 2 = the open glowing mouth), aMetal (gilt and brass), aLamp (light baked from the
// lantern, filled in by build()).
function makeBag() {
  const P = [], N = [], C = [], S = [], G = [], M = [], I = [];
  const v = V3(), n = V3(), nm = new THREE.Matrix3(), ID = new THREE.Matrix4();
  return {
    add(geo, m, col, o = {}) {
      m = m || ID;
      const p = geo.attributes.position, gn = geo.attributes.normal;
      nm.getNormalMatrix(m);
      for (const side of (o.both ? [1, -1] : [1])) {   // both: a second, back-facing copy (thin paper)
        const base = P.length / 3;
        for (let i = 0; i < p.count; i++) {
          v.fromBufferAttribute(p, i).applyMatrix4(m); n.fromBufferAttribute(gn, i).applyMatrix3(nm).normalize().multiplyScalar(side);
          P.push(v.x, v.y, v.z); N.push(n.x, n.y, n.z);
          const c = typeof col === 'function' ? col(v, i) : col;
          C.push(c.r, c.g, c.b); S.push(o.sw ? o.sw(v) : 0); G.push(o.glow || 0); M.push(o.metal || 0);
        }
        const cnt = geo.index ? geo.index.count : p.count, at = (i) => base + (geo.index ? geo.index.getX(i) : i);
        for (let i = 0; i < cnt; i += 3) { if (side > 0) I.push(at(i), at(i + 1), at(i + 2)); else I.push(at(i), at(i + 2), at(i + 1)); }
      }
      geo.dispose();
    },
    raw(pos, nor, col, idx) { // pre-built arrays (the pole)
      const base = P.length / 3;
      for (let i = 0; i < pos.length; i++) { P.push(pos[i]); N.push(nor[i]); C.push(col[i]); }
      for (let i = 0; i < pos.length / 3; i++) { S.push(0); G.push(0); M.push(0); }
      for (const i of idx) I.push(base + i);
    },
    // lamp: where the light is (in this mesh's space); floor: how much reaches faces turned away
    build(lamp, floor = 0.12, reach = 0.03) {
      const L = [];
      for (let i = 0; i < P.length; i += 3) {
        const dx = lamp.x - P[i], dy = lamp.y - P[i + 1], dz = lamp.z - P[i + 2], d2 = dx * dx + dy * dy + dz * dz, d = Math.sqrt(d2) || 1;
        const ndl = (N[i] * dx + N[i + 1] * dy + N[i + 2] * dz) / d;
        L.push((floor + (1 - floor) * Math.max(0, ndl)) * reach / (d2 + reach));
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aSw', new THREE.Float32BufferAttribute(S, 1));
      g.setAttribute('aGlow', new THREE.Float32BufferAttribute(G, 1));
      g.setAttribute('aMetal', new THREE.Float32BufferAttribute(M, 1));
      g.setAttribute('aLamp', new THREE.Float32BufferAttribute(L, 1));
      g.setIndex(I);
      return g;
    },
  };
}

// A prayer slip: a strip of paper that curls, with a dyed head, brushed characters and a red seal.
// pattern: one string per row of vertices, top to bottom; r = dye, k = ink, s = seal, . = paper
function slipGeo(w, h, pattern, curl) {
  const g = new THREE.PlaneGeometry(w, h, 4, pattern.length - 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), f = 0.5 - p.getY(i) / h;
    p.setZ(i, curl * (0.05 * f * Math.sin(f * 2.8) + 0.02 * f * f) + 9 * x * x * (0.4 + f));
  }
  g.computeVertexNormals();
  return g;
}
const SLIP_A = ['rrrrr', 'rrrrr', '.....', '..k..', '.kkk.', '..k..', '.....', '.kk..', '..kk.', '.....', '..ss.', '..ss.', '.....'];
const SLIP_B = ['rrrrr', '.....', '.kkk.', '..k..', '.kkk.', '.....', '..k..', '.ss..', '.ss..', '.....'];

// ---- the pole: a tapering bamboo culm with nodes, a cord-wrapped grip, lashings, a bell and paper slips
function buildPole(bag, K, rng) {
  const curve = new THREE.CatmullRomCurve3(POLE, false, 'centripetal');
  const NR = 108, RS = 8, fr = curve.computeFrenetFrames(NR, false);
  const pos = [], nor = [], col = [], idx = [];
  const p = V3(), q = V3(), c = new THREE.Color();
  let nextNode = 3, inter = 0, tint = 1, CHARM = 50;
  for (let i = 0; i <= NR; i++) {
    const t = i / NR; curve.getPointAt(t, p);
    let r = 0.027 - 0.0165 * Math.pow(t, 0.8);
    const node = i === nextNode;
    if (node) { nextNode += 6 + Math.floor(rng() * 4); inter++; tint = 0.86 + rng() * 0.28; }
    const grip = t > 0.15 && t < 0.31, lash = t > 0.96 || Math.abs(i - CHARM) <= 1;
    if (node && !grip) r *= 1.2;
    if (grip || lash) r += 0.0028 + (i % 2) * 0.0012;
    // bamboo: each internode its own tone, paler just above a node, the node ring dark
    if (grip || lash) c.copy(K.cord).multiplyScalar(i % 2 ? 1 : 0.62);
    else { c.copy(K.bamboo).multiplyScalar(tint * (0.92 + 0.16 * ((i * 7) % 5) / 5)); if (node) c.multiplyScalar(0.42); else if (i === nextNode - 1 || i + 1 === nextNode) c.multiplyScalar(0.8); }
    for (let j = 0; j < RS; j++) {
      const a = j / RS * TAU, cs = Math.cos(a), sn = Math.sin(a);
      q.copy(fr.normals[i]).multiplyScalar(cs).addScaledVector(fr.binormals[i], sn);
      pos.push(p.x + q.x * r, p.y + q.y * r, p.z + q.z * r); nor.push(q.x, q.y, q.z);
      const streak = 0.93 + 0.07 * Math.sin(j * 2.4 + inter * 1.7);
      col.push(c.r * streak, c.g * streak, c.b * streak);
    }
    if (i < NR) for (let j = 0; j < RS; j++) { const a = i * RS + j, b = i * RS + (j + 1) % RS; idx.push(a, b, a + RS, b, b + RS, a + RS); }
  }
  bag.raw(pos, nor, col, idx);
  // the tip: a short cord down to an iron ring, and a knot of cord ends
  bag.add(new THREE.CylinderGeometry(0.0026, 0.0026, 0.06, 5, 1, true), T(TIP.x, TIP.y - 0.032, TIP.z), K.cord);
  bag.add(new THREE.TorusGeometry(0.012, 0.0028, 5, 12), T(PIVOT.x, PIVOT.y, PIVOT.z, 0, PI / 2, 0), K.iron);
  bag.add(new THREE.SphereGeometry(0.012, 8, 6), T(TIP.x, TIP.y - 0.004, TIP.z), K.cord);
  // half-way up: a knotted cord, a brass bell with a bright lip and
  // its clapper, and inked prayer slips that flutter
  const Q = curve.getPointAt(CHARM / NR), top = Q.y - 0.012;
  const sw = (v) => clamp01((top - v.y) / 0.42);
  const cx = Q.x + 0.04, cz = Q.z + 0.035, by = top - 0.105;   // on the outer side, where the leaning shaft does not hide them
  const brassHi = K.brass.clone().multiplyScalar(2.6), brassLo = K.brass.clone().multiplyScalar(0.55);
  bag.add(new THREE.CylinderGeometry(0.0026, 0.0026, 0.075, 5, 3, true), T(cx, top - 0.037, cz), K.cord, { sw });
  bag.add(new THREE.SphereGeometry(0.04, 14, 8, 0, TAU, 0, PI * 0.62), T(cx, by, cz, 0, 0, 0, 1, 1.15, 1),
    (v) => (v.y < by - 0.012 ? K.brass : (v.y > by + 0.03 ? brassLo : K.brass.clone().multiplyScalar(1.3))), { sw, metal: 1 });
  bag.add(new THREE.TorusGeometry(0.0375, 0.0042, 6, 18), T(cx, by - 0.019, cz, PI / 2, 0, 0), brassHi, { sw, metal: 1 });
  bag.add(new THREE.SphereGeometry(0.009, 6, 5), T(cx, by + 0.05, cz), K.brass, { sw, metal: 1 });
  bag.add(new THREE.SphereGeometry(0.011, 8, 6), T(cx, by - 0.03, cz), brassHi, { sw, metal: 1 });       // clapper
  bag.add(new THREE.CylinderGeometry(0.002, 0.002, 0.06, 4, 2, true), T(cx, by - 0.066, cz), K.cord, { sw });
  const seal = new THREE.Color('#c0271c'), ink = new THREE.Color('#3b2f29'), paper = K.paper.clone().multiplyScalar(1.05);
  const dye = (pat) => (v, i) => { const ch = pat[Math.floor(i / 5)][i % 5]; return ch === 'r' ? K.motif : ch === 'k' ? ink : ch === 's' ? seal : paper; };
  const slipTop = by - 0.095;
  bag.add(slipGeo(0.074, 0.24, SLIP_A, 1), T(cx, slipTop - 0.12, cz, 0, -0.45, 0), dye(SLIP_A), { sw, both: true });
  if (K.twoSlips) bag.add(slipGeo(0.05, 0.16, SLIP_B, -0.8), T(cx + 0.03, slipTop - 0.08, cz - 0.03, 0, 0.5, -0.06), dye(SLIP_B), { sw, both: true });
}

// ---- the lantern, in its own space: paper body centred on the origin, hanging from (0, K.hang, 0)
function buildLantern(bag, K) {
  const { H, R, ribs } = K, h2 = H / 2;
  const prof = (y) => CAP_R + (R - CAP_R) * Math.pow(Math.max(0, Math.cos(PI * y / H)), K.shape);
  // pleated paper: it sags in a little between each pair of ribs (the ribs themselves are drawn in
  // the fragment shader, where they can be antialiased)
  const pts = [], SUB = 4;
  for (let i = 0; i <= ribs * SUB; i++) {
    const f = i / (ribs * SUB), y = -h2 + H * f, sag = Math.sin(PI * ((f * ribs) % 1));
    pts.push(new THREE.Vector2(prof(y) * (1 - 0.026 * sag * sag), y));
  }
  bag.add(new THREE.LatheGeometry(pts, 30), null, K.paper, { glow: 1 });
  // lacquered caps with a gilt line; the mouths are open and the light pours out of them
  for (const s of [1, -1]) {
    const y = s * (h2 + 0.014);
    bag.add(new THREE.CylinderGeometry(CAP_R + 0.005, CAP_R + 0.005, 0.034, 22, 1, true), T(0, y, 0), K.cap);
    bag.add(new THREE.TorusGeometry(CAP_R + 0.0055, 0.003, 5, 22), T(0, y - s * 0.012, 0, PI / 2, 0, 0), K.gilt, { metal: 1 });
    bag.add(new THREE.TorusGeometry(CAP_R + 0.004, 0.0034, 5, 22), T(0, y + s * 0.017, 0, PI / 2, 0, 0), K.cap);
    bag.add(new THREE.RingGeometry(CAP_R * 0.62, CAP_R + 0.005, 22), T(0, y + s * 0.017, 0, -s * PI / 2, 0, 0), K.cap);
    bag.add(new THREE.CircleGeometry(CAP_R * 0.62, 18), T(0, y + s * 0.012, 0, -s * PI / 2, 0, 0), K.paper, { glow: 2 });
  }
  // wire bail up to the ring on the pole, with gilt studs where it meets the cap
  const top = h2 + 0.03;
  const bail = new THREE.CatmullRomCurve3([V3(-CAP_R, top, 0), V3(-CAP_R * 0.92, top + 0.07, 0), V3(-0.012, K.hang - 0.012, 0), V3(0, K.hang, 0), V3(0.012, K.hang - 0.012, 0), V3(CAP_R * 0.92, top + 0.07, 0), V3(CAP_R, top, 0)]);
  bag.add(new THREE.TubeGeometry(bail, 22, 0.0026, 5, false), null, K.iron);
  for (const s of [1, -1]) bag.add(new THREE.SphereGeometry(0.007, 6, 5), T(s * CAP_R, top - 0.004, 0), K.gilt, { metal: 1 });
  // underneath: cord, bead, knot and a silk tassel (these trail and swing a beat behind the lantern)
  const y0 = -h2 - 0.03, sw = (v) => clamp01((y0 - v.y) / 0.2);
  bag.add(new THREE.CylinderGeometry(0.002, 0.002, 0.05, 5, 2, true), T(0, y0 - 0.02, 0), K.tassel, { sw });
  bag.add(new THREE.SphereGeometry(0.0135, 10, 8), T(0, y0 - 0.03, 0), K.gilt, { sw, metal: 1 });
  bag.add(new THREE.SphereGeometry(0.0105, 8, 6), T(0, y0 - 0.055, 0, 0, 0, 0, 1, 1.25, 1), K.tassel, { sw });
  bag.add(new THREE.TorusGeometry(0.0085, 0.0026, 5, 10), T(0, y0 - 0.07, 0, PI / 2, 0, 0), K.gilt, { sw, metal: 1 });
  const dark = K.tassel.clone().multiplyScalar(0.6), tc = new THREE.Color();
  bag.add(new THREE.CylinderGeometry(0.0085, 0.022, 0.13, 14, 5, true), T(0, y0 - 0.135, 0),
    (v, i) => tc.copy(i % 2 ? K.tassel : dark).multiplyScalar(0.75 + 0.25 * clamp01((y0 - 0.07 - v.y) / 0.12)), { sw });
}

// One standard material (the world's own lights and fog apply) with these additions: parts that
// trail (aSw), light baked from the lantern (aLamp), a sheen on gilt and brass (aMetal), and paper
// with ribs, fibre and a dyed motif that is lit from within by whatever the lantern holds.
function litMaterial(lit, U, tag, side) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.0, side });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSw; attribute float aGlow; attribute float aLamp; attribute float aMetal; uniform vec3 uLag; varying vec3 vLP; varying float vGlow; varying float vLamp; varying float vMetal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLP = position; vGlow = aGlow; vLamp = aLamp; vMetal = aMetal; transformed += uLag * (aSw * aSw);');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', /* glsl */`#include <common>
uniform vec3 uGlowCol; uniform vec3 uMotifCol; uniform vec4 uPaper; uniform vec4 uDim; uniform vec2 uFly; uniform vec4 uKind; uniform float uSheen;
varying vec3 vLP; varying float vGlow; varying float vLamp; varying float vMetal;
float rstep(float a, float b, float x){ return 1.0 - smoothstep(b, a, x); }
float flHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float flNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(flHash(i), flHash(i + vec2(1., 0.)), f.x), mix(flHash(i + vec2(0., 1.)), flHash(i + vec2(1., 1.)), f.x), f.y); }`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
float flPaper = step(0.5, vGlow) * step(vGlow, 1.5), flShade = 1.0;
if (flPaper > 0.5) {
  float yN = vLP.y / uDim.y, ang = atan(vLP.x, vLP.z), pm = 0.0;
  if (uDim.w < 0.5) {            // two dyed bands
    pm = rstep(0.03, 0.0, abs(abs(yN) - 0.74) - 0.085) * 0.85 + rstep(0.012, 0.0, abs(abs(yN) - 0.52) - 0.012) * 0.7;
  } else if (uDim.w < 1.5) {     // a crest on three sides, one of them toward the eye
    float da = mod(ang - uFly.y + 1.0472, 2.0944) - 1.0472;
    float d = length(vec2(da * uDim.x, vLP.y));
    pm = rstep(0.052, 0.046, d) * (1.0 - rstep(0.03, 0.026, length(vec2(da * uDim.x - 0.012, vLP.y - 0.01)))) * 0.85
       + rstep(0.005, 0.0, abs(d - 0.066) - 0.004) * 0.8;
  } else {                       // dipped in dye, with a scalloped tide line
    float yy = yN + 0.42 + 0.07 * abs(sin(ang * 4.5));
    pm = rstep(0.03, 0.0, yy) * 0.8 + rstep(0.015, 0.0, abs(yy - 0.13) - 0.014) * 0.7;
  }
  float fib = 0.86 + 0.2 * flNoise(vec2(ang * 34.0, vLP.y * 900.0)) * flNoise(vec2(ang * 9.0, vLP.y * 60.0) + 7.0);
  float seam = 0.82 + 0.18 * smoothstep(0.0, 0.03, abs(fract(ang / 6.2832 * 6.0 + 0.5) - 0.5));
  float pf = (yN * 0.5 + 0.5) * uDim.z, pw = fwidth(pf) * 0.75;
  float pleat = 0.8 + 0.2 * sin(3.1416 * fract(pf));
  // split-bamboo ribs at each pleat: a dark line whose edge is as wide as a pixel, so it never breaks up
  float rib = (1.0 - smoothstep(0.045 - pw, 0.045 + pw, abs(fract(pf + 0.5) - 0.5))) * step(abs(yN), 0.985);
  rib *= 0.045 / max(0.045, pw);
  flShade = fib * seam * pleat * (0.72 + 0.28 * (1.0 - yN * yN)) * (1.0 - 0.62 * rib);
  diffuseColor.rgb = mix(diffuseColor.rgb * (0.9 + 0.1 * fib), uMotifCol, pm) * (1.0 - 0.6 * rib);
}`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.35, vMetal);')
      .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\nmetalnessFactor = 0.6 * vMetal;')
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
totalEmissiveRadiance += diffuseColor.rgb * uGlowCol * vLamp * uPaper.w;
// gilt and brass: a little of the sky and of the lantern caught on the upper curve of the metal
totalEmissiveRadiance += diffuseColor.rgb * vMetal * uSheen * (0.5 + 0.5 * uGlowCol) * (0.25 + pow(clamp(normal.y * 0.5 + 0.5, 0.0, 1.0), 5.0) * 2.2);
if (flPaper > 0.5) {
  float g = 0.0, t = uFly.x, yN = vLP.y / uDim.y, ang = atan(vLP.x, vLP.z);
  if (uKind.x > 0.01) {          // fireflies: seven lights wandering about inside, each one blinking
    float a = 0.0;
    for (int i = 0; i < 7; i++) {
      float fi = float(i);
      vec3 q = vec3(sin(t * (0.41 + 0.13 * fi) + fi * 2.4), sin(t * (0.33 + 0.09 * fi) + fi * 4.1), cos(t * (0.37 + 0.11 * fi) + fi * 1.3));
      q *= vec3(uDim.x * 0.74, uDim.y * 0.7, uDim.x * 0.74);
      vec3 d = vLP - q;
      float blink = 0.35 + 0.65 * smoothstep(-0.2, 0.9, sin(t * (1.1 + 0.37 * fi) + fi * 5.0));
      a += blink * 0.0022 / (dot(d, d) + 0.0022);
    }
    g += a * uKind.x;
  }
  if (uKind.y > 0.01) {          // a flame: one light low on the axis, leaning and flickering
    float fl = 0.8 + 0.13 * sin(t * 61.0) * sin(t * 77.0) + 0.1 * sin(t * 5.3) * sin(t * 3.1);
    vec3 d = vLP - vec3(0.014 * sin(t * 2.3) * fl, -0.34 * uDim.y + 0.02 * fl, 0.014 * sin(t * 1.7 + 2.0));
    d.y *= 0.5;
    g += uKind.y * fl * (0.034 / (dot(d, d) + 0.011)) * (0.85 - 0.3 * yN);
  }
  if (uKind.z > 0.01) {          // a captured star: one steady core seen through the paper
    float face = abs(dot(normalize(vViewPosition), normal));
    g += uKind.z * (0.3 + 0.75 * pow(face, 3.0) + 1.1 * pow(face, 14.0)) * (0.8 + 0.2 * (1.0 - yN * yN)) * (0.96 + 0.04 * sin(t * 3.7));
  }
  if (uKind.w > 0.01) {          // glowing moss: slow blotches that breathe
    float n = flNoise(vec2(ang * 2.4 + 3.0, vLP.y * 15.0)) * 0.7 + flNoise(vec2(ang * 7.0, vLP.y * 44.0) + 11.0) * 0.3;
    g += uKind.w * (0.2 + 1.25 * smoothstep(0.32, 0.72, n) * (0.72 + 0.28 * sin(t * 0.62 + n * 9.0)));
  }
  totalEmissiveRadiance += diffuseColor.rgb * uGlowCol * (uPaper.x + uPaper.y * g) * flShade;
} else if (vGlow > 1.5) {
  totalEmissiveRadiance += uGlowCol * uPaper.z * (1.0 - 0.5 * smoothstep(0.4, 1.0, length(vLP.xz) / 0.04));
}`);
  };
  lit(mat);
  mat.customProgramCacheKey = () => 'firefly-lantern-' + tag;
  return mat;
}

// ---- halos + fireflies (ten of which turn into bubbles under water) + moths: camera-facing quads
// in one additive mesh. kind: 0 firefly, 1 halo, 2 moth, 3 wide halo, 4 firefly or bubble
const N_FLY = 16, N_BUB = 10, N_MOTH = 3;
function buildSprites(rng, U) {
  const kinds = [3, 1];
  for (let i = 0; i < N_FLY; i++) kinds.push(0);
  for (let i = 0; i < N_BUB; i++) kinds.push(4);
  for (let i = 0; i < N_MOTH; i++) kinds.push(2);
  const n = kinds.length, pos = new Float32Array(n * 12), seed = new Float32Array(n * 16), cor = new Float32Array(n * 12), idx = [];
  for (let i = 0; i < n; i++) {
    const s = [rng(), rng(), rng(), rng()];
    for (let k = 0; k < 4; k++) {
      seed.set(s, (i * 4 + k) * 4);
      cor.set([k % 2 ? 1 : -1, k < 2 ? -1 : 1, kinds[i]], (i * 4 + k) * 3);
    }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  g.setAttribute('aCor', new THREE.BufferAttribute(cor, 3));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
#define W(f) (floor((f) * 100.0 + 0.5) * 0.01)
attribute vec4 aSeed; attribute vec3 aCor;
uniform vec3 uC; uniform vec3 uTrail; uniform vec4 uAnim; // time, orbit phase, burst, presence
uniform vec4 uMode;                                        // bubbles, star, half height of the lantern, -
varying vec2 vQ; varying float vKind; varying float vB;
void main(){
  float t = uAnim.x, kind = aCor.z; vec3 o = vec3(0.0); float size = 0.5; vB = 1.0; vKind = kind;
  if (kind < 0.5 || kind > 3.5) {
    if (kind > 3.5 && uMode.x > 0.5) {   // a bubble: wobbling up out of the lantern's mouth, swelling as it rises
      float ph = fract(aSeed.x + t * W(0.9 + 0.8 * aSeed.y) / 6.2831853);
      float wob = t * W(1.6 + 1.5 * aSeed.z) + aSeed.w * 20.0;
      o = vec3(sin(wob), 0.0, cos(wob * 0.8 + 1.0)) * (0.02 + 0.06 * ph) + vec3((aSeed.y - 0.5) * 0.16 * ph - 0.05 * ph, uMode.z + 0.02 + ph * 0.62, 0.0);
      o += uTrail * ph * 1.5;
      vB = smoothstep(0.0, 0.06, ph) * (1.0 - smoothstep(0.7, 1.0, ph)) * (2.0 * uMode.x - 1.0);
      size = (0.018 + 0.03 * aSeed.z) * (0.6 + 0.8 * ph) * uAnim.w;
      vKind = 4.0;
    } else {                             // a firefly: a lazy orbit that wanders, pulsing
      float dir = aSeed.w > 0.5 ? 1.0 : -1.0, stray = step(0.8, aSeed.x);
      float ang = aSeed.x * 6.2832 + uAnim.y * W(0.22 + 0.5 * aSeed.y) * dir;
      float rad = mix(0.15 + 0.4 * aSeed.z, 0.58 + 0.24 * aSeed.z, stray) * (1.0 + uAnim.z * (0.5 + aSeed.y));
      o = vec3(cos(ang) * rad * 0.6 + 0.04, (aSeed.w - 0.5) * 0.8 + 0.1 * sin(t * W(0.5 + aSeed.z) + aSeed.x * 40.0), sin(ang) * rad);
      o += 0.035 * vec3(sin(t * 1.7 + aSeed.y * 30.0), sin(t * 2.3 + aSeed.z * 30.0), cos(t * 1.9 + aSeed.x * 30.0));
      o += uTrail * (0.35 + aSeed.z) * (0.6 + 0.4 * sin(t * 0.9 + aSeed.w * 20.0));
      vB = 0.3 + 0.9 * smoothstep(-0.3, 1.0, sin(t * W(0.9 + 1.4 * aSeed.y) + aSeed.w * 30.0));
      if (kind > 3.5) vB *= 1.0 - 2.0 * uMode.x;
      size = (0.04 + 0.03 * aSeed.z) * uAnim.w;
      vKind = 0.0;
    }
  } else if (kind > 1.5 && kind < 2.5) { // a moth, battering round the paper
    float ang = aSeed.x * 6.2832 + t * W(1.6 + aSeed.y) + 0.8 * sin(t * 2.7 + aSeed.z * 9.0);
    float rad = 0.23 + 0.06 * sin(t * 3.1 + aSeed.w * 12.0);
    o = vec3(cos(ang) * rad * 0.7, (aSeed.y - 0.5) * 0.34 + 0.07 * sin(t * 2.1 + aSeed.x * 20.0), sin(ang) * rad) + uTrail * 0.3;
    size = 0.036 * uAnim.w * (1.0 - uMode.x);   // no moths under water
  } else if (kind > 2.5) { size = 1.4 * uAnim.w; }
  else { size = 0.62 * uAnim.w; }
  vec4 mv = modelViewMatrix * vec4(uC + o, 1.0);
  vec2 q = aCor.xy;
  if (kind > 1.5 && kind < 2.5) q.x *= 0.3 + 0.7 * abs(sin(t * 31.0 + aSeed.w * 6.0));    // wing beats
  if (kind > 0.5 && kind < 1.5) mv.xyz += normalize(-mv.xyz) * 0.2;   // the halo sits in front of the lantern
  mv.xy += q * size;
  vQ = aCor.xy;
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: /* glsl */`
uniform vec3 uCol; uniform vec3 uHaloCol; uniform vec4 uK; // firefly gain, halo gain, moth gain, flicker
uniform vec4 uMode;
varying vec2 vQ; varying float vKind; varying float vB;
float rstep(float a, float b, float x){ return 1.0 - smoothstep(b, a, x); }
void main(){
  float r = length(vQ); vec3 c;
  if (vKind < 0.5) c = uCol * uK.x * vB * (exp(-r * r * 26.0) * 3.2 + exp(-r * r * 5.0) * 0.3) * rstep(1.0, 0.7, r);
  else if (vKind > 3.5) {       // bubble: a bright rim, a faint body and a glint
    float rim = rstep(0.2, 0.03, abs(r - 0.76)), gl = rstep(0.22, 0.05, length(vQ - vec2(-0.32, 0.36)));
    c = (uHaloCol * 0.6 + 0.4) * vB * (rim * 1.5 + gl * 2.2 + 0.14 * rstep(0.8, 0.6, r)) * (0.7 + 0.4 * uK.x);
  } else if (vKind > 2.5) {     // the wide, faint pool of light
    c = uHaloCol * uK.y * uK.w * 0.3 * pow(max(0.0, 1.0 - r), 3.0);
  } else if (vKind > 1.5) {     // moth: two pale wings and a body
    float w = rstep(1.0, 0.7, length(vec2(abs(vQ.x) - 0.45, vQ.y * 1.2)) * 1.9) + rstep(0.3, 0.1, length(vec2(vQ.x * 3.0, vQ.y)));
    c = (uHaloCol * 0.5 + vec3(0.5, 0.42, 0.3)) * uK.z * min(1.0, w);
  } else {                      // the halo, with a four-pointed glint when the lantern holds a star
    float a = pow(max(0.0, 1.0 - r), 2.6) + 1.4 * pow(max(0.0, 1.0 - r * 2.6), 2.0);
    vec2 s = abs(vQ);
    float glint = (exp(-s.y * 70.0) * exp(-s.x * 3.5) + exp(-s.x * 70.0) * exp(-s.y * 3.5)) * (1.0 - smoothstep(0.6, 1.0, max(s.x, s.y)));
    c = uHaloCol * uK.y * uK.w * a + (uHaloCol * 0.5 + 0.5) * uMode.y * glint * (0.7 + 0.9 * uK.y);
  }
  gl_FragColor = vec4(max(c, 0.0), 1.0);
}`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = 3; mesh.frustumCulled = false;
  return mesh;
}

const LOOKS = [ // paper, caps, tassel, dye, cord
  ['#efdcb2', '#15110e', '#b3261e', '#a8241d', '#7a1f1a'],
  ['#e9cfa6', '#2c1a10', '#d6a02e', '#27405f', '#2a3f5c'],
  ['#f0e5cc', '#0f1417', '#2e6b5c', '#2a6656', '#b9975a'],
  ['#f0c0a4', '#1a1210', '#eadcb8', '#8e1f2a', '#8e1f2a'],
  ['#e8e2d2', '#1b1620', '#6a3f8a', '#4a3470', '#c0a060'],
];
const SHAPES = [ // height, radius, roundness, ribs
  [0.36, 0.15, 0.62, 12],   // round chochin
  [0.44, 0.118, 0.42, 15],  // tall barrel
  [0.3, 0.158, 0.8, 10],    // squat melon
];
// what is in the lantern, by the kind of world it is carried through: [light, paper glow]
const KINDS = ['fireflies', 'flame', 'star', 'moss'];
const GLOWS = {
  fireflies: ['#d6f25a', '#ffbe5c'], flame: ['#ffc070', '#ffa248'], star: ['#bcdcff', '#a6c6ff'], moss: ['#74f7c0', '#8ef0c4'],
};

export default {
  id: 'firefly-lantern', name: 'Firefly Lantern',
  media: ['air', 'interior', 'tiny', 'snow', 'underwater'],
  near: 0.7,
  gaze: 0.94,
  stow: [1.3, -2.7, 0.5],
  async build(ctx) {
    const { rng, lit } = ctx;
    const C = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
    const look = rng.pick(LOOKS), shape = rng.pick(SHAPES);
    const K = {
      paper: C(look[0], 0.62), cap: C(look[1]), tassel: C(look[2]), motif: C(look[3]), cord: C(look[4]),
      gilt: C('#d8a844'), brass: C('#c08f38'), iron: C('#23252a'),
      bamboo: C(rng.pick(['#c2a566', '#98a252', '#7a5632', '#b8964a'])),
      H: shape[0], R: shape[1], shape: shape[2], ribs: shape[3], hang: shape[0] / 2 + 0.2,
      twoSlips: rng.chance(0.6), motifKind: Math.floor(rng() * 3),
    };
    const REST = V3(PIVOT.x, PIVOT.y - K.hang, PIVOT.z);   // lantern centre at rest
    const GC = {}; for (const k of KINDS) GC[k] = [C(GLOWS[k][0]), C(GLOWS[k][1])];

    const U = {
      uGlowCol: { value: GC.fireflies[1].clone() }, uMotifCol: { value: K.motif.clone() },
      uPaper: { value: new THREE.Vector4(0.7, 2.6, 3, 2) }, uDim: { value: new THREE.Vector4(K.R, K.H / 2, K.ribs, K.motifKind) },
      uFly: { value: new THREE.Vector2(0, Math.atan2(-REST.x, -REST.z)) },
      uKind: { value: new THREE.Vector4(1, 0, 0, 0) }, uSheen: { value: 0.25 },
    };
    const UP = { ...U, uLag: { value: V3(0, 0, 0) } }, UL = { ...U, uLag: { value: V3(0, 0, 0) } };
    const SU = {
      uC: { value: REST.clone() }, uTrail: { value: V3(0, 0, 0) }, uAnim: { value: new THREE.Vector4(0, 0, 0, 1) },
      uMode: { value: new THREE.Vector4(0, 0, K.H / 2, 0) },
      uCol: { value: GC.fireflies[0].clone() }, uHaloCol: { value: GC.fireflies[1].clone() }, uK: { value: new THREE.Vector4(2, 0.4, 0.5, 1) },
    };

    const pb = makeBag(); buildPole(pb, K, rng);
    const pole = new THREE.Mesh(pb.build(REST, 0.35, 0.3), litMaterial(lit, UP, 'pole', THREE.FrontSide));
    await ctx.yield();
    const lb = makeBag(); buildLantern(lb, K);
    const lantern = new THREE.Mesh(lb.build(V3(0, 0, 0), 0.3), litMaterial(lit, UL, 'paper', THREE.DoubleSide));
    lantern.position.y = -K.hang;
    const sprites = buildSprites(rng, SU);
    pole.frustumCulled = false; lantern.frustumCulled = false;

    // object > aim (turns about the eye to keep the lantern in frame) > rig (pivots about the hand)
    //   > inner (ride space again) > pole, lant (hangs from the ring) > lantern
    const object = new THREE.Group(), aim = new THREE.Group(), rig = new THREE.Group(), inner = new THREE.Group(), lant = new THREE.Group();
    rig.position.copy(HAND); inner.position.copy(HAND).negate();
    lant.position.copy(PIVOT); lant.add(lantern);
    inner.add(pole, lant, sprites); rig.add(inner); aim.add(rig); object.add(aim);

    // ---- motion state
    const p0 = rng() * TAU, p1 = rng() * TAU, p2 = rng() * TAU, p3 = rng() * TAU;
    const lx = { x: 0, v: 0 }, lz = { x: 0, v: 0 }, rr = { x: 0, v: 0 };
    const spring = (o, target, w, damp, dt) => { o.v += ((target - o.x) * w * w - o.v * damp) * dt; o.x += o.v * dt; };
    const flyT = new THREE.Color(), glowT = new THREE.Color(), portal = new THREE.Color('#9fd0ff'), eul = new THREE.Euler(), off = V3(0, 0, 0);
    const qRel = new THREE.Quaternion(), pc = V3(0, 0, 0), KW = [1, 0, 0, 0];
    let first = true, lastSp = -1, acc = 0, pause = 0, portalStr = '', lastWorld = null, lastTime = 0;
    let tm = 0, flyPhase = rng() * 40, paperPhase = rng() * 40;   // our own clocks: a world's clock jumps at every portal
    const STEP = TAU * 1.8;
    const swingMax = Math.asin(Math.min(0.6, Math.max(0.05, (SHAFT_X - TIP.x - K.R - 0.085) / K.hang)));

    return {
      object,
      update(dt, time, s) {
        dt = Math.min(Math.max(dt || 0, 0), 0.05);
        const sp = s.speed || 0, turn = s.turn || 0, cross = s.crossing || 0;
        const burst = s.prev ? Math.exp(-(s.entered || 0) * 0.8) : 0;     // they scatter as a new world opens
        // advance the clocks by the world's own time step, except across a portal where it jumps
        const w = s.world || {};
        let d = first ? 0 : (w === lastWorld ? time - lastTime : dt);
        if (!(Math.abs(d) < 3600)) d = dt;
        if (first) tm = time;
        lastWorld = w; lastTime = time; tm += d;
        // orbit and paper phases are integrated, so a change of pace never makes them jump
        flyPhase = (flyPhase + d * (1 + 1.2 * cross + 2 * burst)) % WRAP; if (flyPhase < 0) flyPhase += WRAP;
        paperPhase = (paperPhase + d * (1 + 0.8 * cross)) % WRAP; if (paperPhase < 0) paperPhase += WRAP;
        const t = tm, tS = ((tm % WRAP) + WRAP) % WRAP;

        if (lastSp < 0) lastSp = sp;
        if (dt > 0) acc += ((sp - lastSp) / dt - acc) * Math.min(1, dt * 3);
        lastSp = sp;
        const wind = Math.min(sp, 30) / 30, gait = 0.55 + 0.45 * Math.min(1, sp * 0.08);
        // every so often the bearer slows to look: the bob dies away and the lantern settles
        const look = ss(0.55, 0.9, Math.sin(t * 0.11 + p3));
        pause += (look - pause) * Math.min(1, dt * 1.5 + (first ? 1 : 0));
        const walk = gait * (1 - 0.75 * pause);

        // footsteps: a 2 cm bob at 1.8 Hz, the weight shifting side to side at half that
        const bob = 0.02 * walk * (Math.abs(Math.sin(t * STEP * 0.5 + p0)) - 0.6);
        const shift = 0.012 * walk * Math.sin(t * STEP * 0.5 + p0);
        spring(rr, turn * 0.16, 2.2, 3.0, dt);
        const rx = 0.012 * walk * Math.sin(t * STEP + p0 + 0.9) + 0.006 * Math.sin(t * 0.43 + p1) - acc * 0.002;
        const rz = rr.x * 0.6 + 0.01 * walk * Math.sin(t * STEP * 0.5 + p0 - 0.5) + 0.005 * Math.sin(t * 0.31 + p2);
        rig.position.set(HAND.x + shift, HAND.y + bob, HAND.z);
        rig.rotation.set(rx, rr.x * 0.25, rz);

        // keep the lantern in the picture: if the gaze swings so far that it would pass 86% of the
        // half-width (or drift in past 72%, or leave by the top), turn the whole pole about the eye
        const cam = s.camera;
        let yaw = 0, pitch = 0;
        if (cam && cam.projectionMatrix) {
          qRel.copy(cam.quaternion).invert().multiply(object.quaternion);
          pc.copy(REST).applyQuaternion(qRel);
          if (pc.z < -0.2) {
            const P0 = cam.projectionMatrix.elements[0] || 0.94, P5 = cam.projectionMatrix.elements[5] || 1.66;
            const ax = Math.atan2(pc.x, -pc.z), hi = Math.atan(0.86 / P0), lo = Math.min(Math.atan(0.72 / P0), hi - 0.07);
            yaw = over(ax - hi, 0.02) - over(lo - ax, 0.02);
            const ay = Math.atan2(pc.y, -pc.z), hiY = Math.atan(0.6 / P5), loY = Math.atan(0.2 / P5);
            pitch = over(loY - ay, 0.02) - over(ay - hiY, 0.02);
          }
        }
        aim.rotation.set(pitch, yaw, 0);

        // the lantern is a pendulum under the ring: a beat behind the steps, dragged back by the air,
        // thrown outward in the bends, but never so far that the paper touches the shaft
        spring(lx, -wind * 0.16 - acc * 0.01, 5.2, 0.9, dt); spring(lz, -turn * 0.35, 5.0, 0.9, dt);
        const ax = lx.x + 0.05 * walk * Math.sin(t * STEP - 1.4 + p0) + 0.02 * Math.sin(t * 1.13 + p1);
        const az = lz.x + 0.065 * walk * Math.sin(t * STEP * 0.5 - 1.2 + p0) + 0.02 * Math.sin(t * 0.87 + p2);
        let zr = az - rz; if (zr > 0) zr = swingMax * Math.tanh(zr / swingMax);
        lant.rotation.set(ax - rx, 0.12 * Math.sin(t * 0.37 + p3) + 0.04 * Math.sin(t * 1.3 + p1), zr);
        eul.copy(lant.rotation);
        SU.uC.value.copy(off.set(0, -K.hang, 0).applyEuler(eul)).add(PIVOT);
        // the tassel trails behind the swing; the bell and slips stream in the air
        UL.uLag.value.set(0.018 * Math.sin(t * 2.3 + p2) - lz.v * 0.03 + az * 0.1, 0, 0.018 * Math.sin(t * 1.9 + p0) + wind * 0.05 - lx.v * 0.03 - ax * 0.1);
        const fl = 0.3 + wind;
        UP.uLag.value.set(0.03 * fl * Math.sin(t * 5.3 + p1) + 0.014 * Math.sin(t * 1.4 + p3) - turn * 0.08, wind * 0.02, 0.03 * fl * Math.sin(t * 4.1 + p2) + wind * 0.1 + 0.02 * walk * Math.sin(t * STEP + p0));

        // what glows in there depends on where we are; near a portal it takes on the portal's colour
        const L = s.light, media = w.media || [], id = w.id || '';
        const ki = media.includes('underwater') || (w.category === 'ocean' && /kelp|reef|abyss|deep|under|trench/.test(id)) ? 3
          : media.includes('space') || media.includes('snow') || /orbit|aurora|ice|snow|frost|glacier|moon/.test(id) ? 2
          : w.category === 'interior' || w.category === 'domestic' || media.includes('interior') ? 1 : 0;
        const G = GC[KINDS[ki]];
        if (s.portalColor && s.portalColor !== portalStr) { portalStr = s.portalColor; portal.set(portalStr); }
        flyT.copy(G[0]).lerp(portal, 0.5 * cross); glowT.copy(G[1]).lerp(portal, 0.25 * cross);
        const k = first ? 1 : 1 - Math.exp(-dt * 1.2);
        SU.uCol.value.lerp(flyT, k); SU.uHaloCol.value.lerp(glowT, k); U.uGlowCol.value.copy(SU.uHaloCol.value);
        for (let i = 0; i < 4; i++) KW[i] += ((i === ki ? 1 : 0) - KW[i]) * k;
        U.uKind.value.set(KW[0], KW[1], KW[2], KW[3]);
        SU.uMode.value.set(KW[3], KW[2], K.H / 2, 0);
        // the glow never drops below a floor, so it is still a lit lantern at noon or under water
        const dark = L && L.has ? 1 - clamp01(L.level / 1.1) : 0.55;
        const flick = 0.92 + 0.08 * Math.sin(t * 3.1 + p0) * Math.sin(t * 1.7 + p1) * (1 - KW[2]);
        U.uFly.value.x = paperPhase;
        U.uPaper.value.set(0.6 + 0.3 * dark, (2.4 + 0.8 * dark) * flick, 1.8 + 2.4 * dark, 0.6 + 2.0 * dark);
        U.uSheen.value = 0.14 + 0.26 * (1 - dark);
        SU.uAnim.value.set(tS, flyPhase, burst + 0.25 * cross, ss(0.3, 1, s.presence ?? 1));
        SU.uTrail.value.set(-turn * 0.25, 0.04 * wind, 0.3 * wind + 0.05);
        SU.uK.value.set(1.3 + 1.5 * dark, (0.16 + 0.54 * dark) * (1 + 0.5 * cross) * (1 - 0.5 * KW[2]), 0.3 + 0.5 * dark, flick);
        first = false;
      },
      dispose() {},
    };
  },
};
