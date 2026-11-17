// THE HOUSE WITH ITS ROOF BLOWN OFF (world id: morning-after-the-gale)
// After the Tale of Genji scrolls of the Heian court workshop: a palace in built-up colour seen from above with roof and
// ceiling left out, sheared for real (x = -hand*0.82p, y = h + 0.57p + 0.58q, z = q) so that long beams run on one 35 degree
// diagonal and posts stay plumb through any lens. The eye flies one dead straight level line, +Z, 1100 m, and sinks three
// times into roofless rooms whose floors climb the page: the garden court and matted aisle (tier one, ending at the hero's
// sleeve room), the inner hall ending in a roofless bridge (tier two), the north room ending at a round mirror (tier three,
// the exit). Three gust fronts, keyed to u, overtake us: grasses flatten, blinds belly and roll, old paint lets go in flakes.
// Each room is first seen whole, small and far below from the threshold before it (see THE THREE DROPS below): the tiers
// slide up the course to meet the eye, which itself never turns or sinks.
// Unlit flat pigment everywhere (post flat: 1), no light, no fog, no sky: the dome is the paper.
// LEAVES: no single leaf in canopy, litter or air is over about 1 m (LEAF_MAX): every mass of leaf colour is a cluster of small
// maple stars and pointed ovals cut in one shader (leafMaterial below). The mirror at the exit stands on a low black lacquer stand.
// Variations by seed: season (autumn | winter | spring), state of the sheet (kept | worn), hand (mirrored), cast (ladies |
// gentlemen), the object left out (lute | zither | go board). Rare: the north room's whole green coat lets go in one wave.
import * as THREE from 'three';
import { makePath, clamp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { buildHero, PALETTE, STYLE_GLSL, createStyle, contourMaterial, flakeMaterial, makeAcc, makeLines, addBar, addBlind,
  addRobeHeap, addRobeHeapAsync, addHairAndFolds, addCurtain, bandsFor } from '../parts/morning-after-the-gale.js';

const TZ = [250, 530, 1100];           // world z of the three tier origins (floor is 10 m under the path there)
const C_FRONT = [0.08, 0.40, 0.70];
// THE THREE DROPS. The eye flies one level line and never turns; the palace is what falls away. Each tier stands far ahead
// and far below while we cross the tier before it, and slides up the course to meet us: zv_k(u) is where the eye stands in
// tier k's own built frame (wall lines at z 250, 530, 810), a monotone curve through these knots, and the tier's group is
// moved along the course by (eye z) - zv_k(u). So from each threshold the next room is seen whole and small from 450 to 500 m,
// then its floor climbs the page until we are among the robes again. Tier three never moves (the mirror is the exit portal):
// its distance is real, which is why the course is LEN = 1100 m long and the mirror wall stands at z 1100.
const LEN = 1100;
const KNOTS = [
  [[0, -70], [0.08, 0], [0.16, 66], [0.25, 155], [0.305, 250], [0.36, 345], [1, 1400]],
  [[0, -330], [0.08, -260], [0.16, -194], [0.25, -105], [0.305, -10], [0.34, 30], [0.43, 290], [0.52, 432], [0.595, 530], [0.64, 600], [1, 1200]],
];
function monotone(K) {
  const n = K.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((K[i + 1][1] - K[i][1]) / (K[i + 1][0] - K[i][0]));
  for (let i = 0; i < n; i++) m.push(i === 0 ? d[0] : i === n - 1 ? d[n - 2] : (d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i])));
  return (u) => { const x = Math.min(K[n - 1][0], Math.max(K[0][0], u)); let i = 0; while (i < n - 2 && x > K[i + 1][0]) i++;
    const h = K[i + 1][0] - K[i][0], t = (x - K[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * K[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * K[i + 1][1] + (t3 - t2) * h * m[i + 1]; };
}
const ZV = KNOTS.map(monotone);

// Grasses: instanced ribbons standing in the (p, h) plane, which always faces the eye (the camera never turns).
// aO = root (p, h, q); aG = (length m, seed, type 0 pampas | 1 bush clover, lying 0..1). Combed up the diagonal (+p).
function grassMaterial(S, dotCol) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...S.uniforms, uStem: { value: S.pal.ochre }, uLeaf: { value: S.pal.green }, uDot: { value: dotCol } },
    vertexShader: /* glsl */`
attribute vec3 aO; attribute vec4 aG; uniform vec2 uPx;
varying vec2 vT; varying vec3 vK;
${STYLE_GLSL}
void main(){
  float t = position.y, L = aG.x, sd = aG.y, ty = aG.z;
  float wz0 = (modelMatrix * vec4(gShear(aO), 1.)).z;
  float gust = gPulse(wz0), beh = smoothstep(0., 80., gBehind(wz0));
  float sway = sin(uTime * (1.3 + fract(sd * 7.1)) + sd * 30.) + 0.5 * sin(uTime * 2.9 + sd * 11.);
  // pampas is combed: every plume leans the same way up the diagonal, so a clump reads as grass and never as a fan of streaks
  float bend = (ty < 0.5 ? 0.92 + 0.07 * fract(sd * 3.3) + 0.6 * gust : 0.5 + 0.3 * fract(sd * 3.3) + 0.35 + 0.85 * gust) + 0.14 * beh + 0.07 * sway;
  float ang = mix(bend * (0.3 + 1.2 * t), 1.45 + 0.25 * sin(sd * 9. + t * 3.), aG.w);
  float mid = mix(bend * (0.3 + 0.6 * t), 1.45, aG.w);            // mean angle of the chord from the root
  vec3 P = aO + vec3(sin(mid), cos(mid), 0.) * (L * t);
  P.z += 0.4 * t * sway * (1. - aG.w);
  vec3 T = vec3(sin(ang), cos(ang), 0.);
  float w = ty < 0.5 ? (t < 0.5 ? 0.6 : 0.6 + 3.4 * sin(3.1416 * clamp((t - 0.5) / 0.5, 0., 1.)) * (1.15 - 0.5 * t))
                     : 0.2 + 0.75 * sin(3.1416 * clamp(t, 0., 1.)) ;
  vec4 a = projectionMatrix * viewMatrix * modelMatrix * vec4(gShear(P), 1.);
  vec4 b = projectionMatrix * viewMatrix * modelMatrix * vec4(gShear(P + T), 1.);
  float wa = max(abs(a.w), 1e-4), wb = max(abs(b.w), 1e-4);
  vec2 dir = (b.xy / wb - a.xy / wa) * uPx; float len = max(length(dir), 1e-5);
  vec2 n = vec2(-dir.y, dir.x) / len;
  float ppm = uPx.y * projectionMatrix[1][1] * 0.5 / wa;
  float px = max(w * ppm, 1.7);
  a.xy += n * position.x * 0.5 * px / uPx * a.w;
  vT = vec2(position.x, t); vK = vec3(ty, sd, smoothstep(2.5, 5., w * ppm));
  if (ty < 0.5 && aG.w < 0.5 && fract(sd * 4.7) < 0.4) a = vec4(2., 2., 2., 1.);      // fewer, thicker plumes
  gl_Position = a;
}`,
    fragmentShader: /* glsl */`
uniform vec3 uStem, uLeaf, uDot, uWhite; varying vec2 vT; varying vec3 vK;
void main(){
  vec3 c;
  if (vK.x < 0.5) { c = vT.y < 0.52 ? uStem : uWhite; if (vT.y > 0.52 && abs(vT.x) < 0.1 && vT.y < 0.93) c = mix(c, uStem, vK.z);
    float barb = fract(vT.y * 21. - abs(vT.x) * 1.6);          // the plume's feathered edge, drawn only when it is large enough to read
    if (vT.y > 0.52 && abs(vT.x) > mix(1.01, 0.58 + 0.42 * barb, vK.z)) discard; }
  else { c = uLeaf; float f = fract(vT.y * 4. + vK.y); if (f < 0.42 && vT.x > 0.05 && vT.y > 0.25) c = mix(c, uDot, vK.z); }
  gl_FragColor = vec4(c, 1.);
}`,
    side: THREE.DoubleSide,
  });
  S.mats.push(m); return m;
}
function grassGeometry(aO, aG, n) {
  let m = 0;                                             // the standing plumes that the vertex shader leaves out are not sent at all
  for (let i = 0; i < n; i++) { const sd = aG[i * 4 + 1], f = sd * 4.7 - Math.floor(sd * 4.7);
    if (aG[i * 4 + 2] < 0.5 && aG[i * 4 + 3] < 0.5 && f < 0.39) continue;
    if (m !== i) { for (let c = 0; c < 3; c++) aO[m * 3 + c] = aO[i * 3 + c]; for (let c = 0; c < 4; c++) aG[m * 4 + c] = aG[i * 4 + c]; } m++; }
  n = Math.max(1, m);
  const g = new THREE.InstancedBufferGeometry(), ts = [0, 0.3, 0.52, 0.68, 0.84, 1], pos = [], idx = [];
  for (let i = 0; i < ts.length; i++) { pos.push(-1, ts[i], 0, 1, ts[i], 0); if (i) { const k = i * 2; idx.push(k - 2, k - 1, k + 1, k - 2, k + 1, k); } }
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 3)); g.setAttribute('aG', new THREE.InstancedBufferAttribute(aG, 4));
  g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}
// One flat pigment with no coat (the paper mist, the mirror's face): position in palace space, colour by uniform.
function flatMaterial(S, col) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...S.uniforms, uCol: { value: col } },
    vertexShader: `${STYLE_GLSL}\nvoid main(){ gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(gShear(position), 1.); }`,
    fragmentShader: 'uniform vec3 uCol; void main(){ gl_FragColor = vec4(uCol, 1.); }', side: THREE.DoubleSide,
  });
  S.mats.push(m); return m;
}
// LEAVES (the designer's limit: no single leaf larger than about 1 m). Every mass of leaf colour in the world (a maple's canopy,
// the stars over it, the drifts under the groves, the litter on mats and moss, the trees painted on the sliding doors) is a
// CLUSTER: one flat quad lying where the old star or blob lay, in its colour, out of which the shader cuts many separate small
// leaves: five-pointed maple stars and plain pointed ovals 0.6 to 1.0 m long, one to a 0.5 m cell, each kept or dropped whole
// (never cut by the cluster's rim), turned its own way and stirring a little, more when a gust passes. Between them the ground,
// the boughs or the next drift shows. Far off a leaf is never drawn under 1.6 pixels, so the cluster closes up into the same flat
// warm mass in its one colour. LEAF_MAX is the longest leaf, tip to tip, in metres (the unit of a cluster's local frame).
const LEAF_MAX = 0.98;
function leafMaterial(S, maple) {
  const m = new THREE.ShaderMaterial({
    uniforms: { ...S.uniforms, uMaple: { value: maple } },
    vertexShader: /* glsl */`
attribute vec4 aL; attribute vec4 aK; attribute vec3 aCol;
varying vec2 vL; varying vec4 vR; varying vec3 vCol; varying vec2 vG;
${STYLE_GLSL}
void main(){
  vec4 wp = modelMatrix * vec4(gShear(position), 1.);
  vL = aL.xy; vR = vec4(aL.zw, aK.x, aK.y); vCol = aCol; vG = vec2(gPulse(wp.z), aK.z);
  gl_Position = projectionMatrix * viewMatrix * wp;
}`,
    fragmentShader: /* glsl */`
varying vec2 vL; varying vec4 vR; varying vec3 vCol; varying vec2 vG; uniform float uMaple;
${STYLE_GLSL}
void main(){
  vec2 fw = fwidth(vL); float px = mix(min(fw.x, fw.y), max(fw.x, fw.y), 0.4);   // metres to a pixel, taken before the loop (a floor is foreshortened: between its two axes)
  float sd = floor(vR.z + 0.5); vec2 so = vec2(mod(sd * 37., 113.), mod(sd * 91., 127.));
  vec2 n = floor(vL * 2.); float hit = 0.;
  vec2 rr = max(vR.xy, vec2(0.05));
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 id = n + vec2(float(i), float(j)), h = gH2(id + so), h2 = gH2(id + so + 41.7);
    vec2 c = (id + h) * 0.5, e = c / rr; float e2 = dot(e, e);
    // kept whole or dropped whole: a leaf whose heart lies outside the drift is not drawn, and a drift is thick at heart and
    // scattered at its rim (the share of cells that hold a leaf falls toward the edge)
    float keep = step(e2 + 0.3 * (h2.y - 0.5), 1.) * step(h2.x, vR.w * (1.2 - 0.85 * e2));
    float r = max(vG.y * (0.62 + 0.38 * fract(h2.y * 7.3)), 0.8 * px);     // half its length
    vec2 d = vL - c; float d2 = dot(d, d);
    if (keep > 0.5 && d2 <= r * r) {
      float a = h.x * 6.2832 + (0.16 + 0.6 * vG.x) * sin(uTime * (1.1 + 2. * h.y) + h2.y * 40.);
      float cs = cos(a), sn = sin(a); vec2 q = vec2(cs * d.x + sn * d.y, cs * d.y - sn * d.x);
      if (fract(h2.x * 13.7) < uMaple) {                                   // a maple leaf: five points
        float th = atan(q.y, q.x + step(d2, 1e-8));                        // (never atan(0, 0))
        float tr = abs(fract(th * 0.79577 + 0.5) * 2. - 1.), rad = r * (0.4 + 0.6 * tr * sqrt(tr));
        if (d2 < rad * rad || d2 < 0.64 * px * px) hit = 1.;
      } else {                                                             // a plain pointed oval
        float b = max(0.46 * r, 0.8 * px), xx = q.x / r;
        if (abs(q.y) < b * (1. - xx * xx)) hit = 1.;
      }
    }
  }
  if (hit < 0.5) discard;
  gl_FragColor = vec4(vCol, 1.);
}`, side: THREE.DoubleSide });
  S.mats.push(m); return m;
}
// The clusters of one tier. add(C, plane, rx, ry, col, cover, rmax): centre C in palace (p, h, q); plane = [A, B], the palace vectors of
// one metre along the cluster's own x and y; rx, ry its half axes (m); cover = the share of cells that hold a leaf; rmax = half
// the longest leaf in local metres (0.49 in a plane that keeps true lengths; less on a floor, whose q axis is 1.16 m long).
const LEAF_PAGE = [[1 / 0.82, -0.57 / 0.82, 0], [0, 1, 0]], LEAF_FLOOR = [[1, 0, 0], [0, 0, 1]], LEAF_WALL = [[1, 0, 0], [0, 1, 0]];
function makeLeafBag() {
  const pos = [], L = [], K = [], col = [], idx = []; let n = 0;
  return {
    get count() { return n; },
    add(C, plane, rx, ry, c, cover = 0.85, rmax = 0.5 * LEAF_MAX) {
      const [A, B] = plane, ex = rx + 0.75, ey = ry + 0.75, v0 = n * 4, sd = (n * 7 + 3) % 4001; n++;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        pos.push(C[0] + A[0] * sx * ex + B[0] * sy * ey, C[1] + A[1] * sx * ex + B[1] * sy * ey, C[2] + A[2] * sx * ex + B[2] * sy * ey);
        L.push(sx * ex, sy * ey, rx, ry); K.push(sd, cover, rmax, 0); col.push(c.r, c.g, c.b); }
      idx.push(v0, v0 + 1, v0 + 2, v0, v0 + 2, v0 + 3);
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aL', new THREE.Float32BufferAttribute(L, 4));
      g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 4)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
      g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      return g;
    },
  };
}
function flakeGeometry(aO, aF, aC, n) {
  const fg = new THREE.InstancedBufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); fg.setIndex([0, 1, 2, 0, 2, 3]);
  fg.setAttribute('aO', new THREE.InstancedBufferAttribute(aO, 3)); fg.setAttribute('aF', new THREE.InstancedBufferAttribute(aF, 4));
  fg.setAttribute('aCol', new THREE.InstancedBufferAttribute(aC, 3)); fg.instanceCount = n;
  fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return fg;
}

// A wall line in palace space at depth q0: plumb posts, three beams on the diagonal, transom, valance and reed blinds.
// o: { posts: [p...], pA, pB (beam ends), q0, skip: Set of post indices not to build (they exist already), rollOf(i, p0) -> [roll, torn] }
async function wallLine(S, rng, T, o, yld) {
  const { ink, white, green } = S.pal, q = o.q0, posts = o.posts;
  addBar(T.statics, rng, 'p', o.pA, o.pB, 0, 1.3, q - 1.25, q + 1.25, ink, -0.05);
  addBar(T.statics, rng, 'p', o.pA, o.pB, 45, 47.4, q - 1.2, q + 1.2, ink, -0.05);
  addBar(T.statics, rng, 'p', o.pA, o.pB, 55, 58.2, q - 1.35, q + 1.35, ink, -0.05);
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i], w = 1 + rng.range(-0.08, 0.08);
    if (o.skip && o.skip.has(i)) continue;
    addBar(T.statics, rng, 'h', 0, 60.5, p - w, p + w, q - 1, q + 1, ink, -0.05, 0.1);
    addBar(T.statics, rng, 'h', 0, 2.2, p - w - 0.7, p + w + 0.7, q - 1.7, q + 1.7, ink, 0, 0.05);
    addBar(T.statics, rng, 'p', p - 3.2, p + 3.2, 58.2, 59.6, q - 1.9, q + 1.9, ink, 0, 0.05);
  }
  for (let i = 0; i + 1 < posts.length; i++) {
    const a = posts[i] + 1, b = posts[i + 1] - 1, open = rng.chance(0.3), lo = [0.08 + rng() * 0.1, 0, 0, 0];
    if (!open) T.statics.quad(T.statics.v(a, 47.4, q + 0.3, a, 47.4, white, null, lo), T.statics.v(b, 47.4, q + 0.3, b, 47.4, white, null, lo),
      T.statics.v(b, 55, q + 0.3, b, 55, white, null, lo), T.statics.v(a, 55, q + 0.3, a, 55, white, null, lo));
    for (let k = 1; k < 9; k++) { if (open && rng.chance(0.5)) continue; const p = a + (b - a) * k / 9 + rng.range(-0.25, 0.25);
      addBar(T.statics, rng, 'h', 47.4, 55, p - 0.32, p + 0.32, q - 0.3, q + 0.5, ink, 0, 0.04); }
    T.statics.quad(T.statics.v(a, 41.6, q - 1.6, a, 0, green, null, lo), T.statics.v(b, 41.6 + rng.range(-0.3, 0.3), q - 1.6, b, 0, green, null, lo),
      T.statics.v(b, 45, q - 1.6, b, 3.4, green, null, lo), T.statics.v(a, 45, q - 1.6, a, 3.4, green, null, lo));
    const [roll, torn] = o.rollOf(i, posts[i]), kind = o.kind ? o.kind(i, posts[i]) : 'blind', st = T.statics;
    if (kind === 'cloth') {                                          // a wall curtain hung from the lintel, ribbons trailing
      const v = rng.int(0, 2), pal = S.pal;
      addCurtain(T.cloth, st, S, rng, a + 0.8, b - 0.8, q - 1.45, 44.8, { hung: true, np: 4, dots: 4, step: 9, rr: 1.35, ribLen: 1.6,
        col: v === 0 ? pal.white : v === 1 ? S.tint(pal.purple) : S.tint(pal.green), dot: v === 0 ? pal.red : v === 1 ? pal.white : pal.ochre, rib: v === 1 ? pal.red : pal.purple });
      addBlind(T.blinds, S, rng, posts[i] + 1, b - a, 45, 40, q - 0.6, -0.9, 0, { flip: false, rows: 8 });     // its blind rolled right up behind
    } else if (kind === 'door') {                                    // sliding doors painted with green hills, as rooms in the scrolls have
      const lo2 = [0.05, 0, 0, 0], qd = q - 0.6;
      st.quad(st.v(a, 1.3, qd, a, 1.3, white, null, lo2), st.v(b, 1.3, qd, b, 1.3, white, null, lo2), st.v(b, 45, qd, b, 45, white, null, lo2), st.v(a, 45, qd, a, 45, white, null, lo2));
      const nh = rng.int(3, 5);
      for (let m = 0; m < nh; m++) { const rp = rng.range(7, 14), cp = rng.range(a + rp + 0.5, b - rp - 0.5), rh = rng.range(10, 30), c = m % 3 === 2 ? S.tint(green) : green, qq = qd - 0.12 - m * 0.06, n = 12;
        const c0 = st.v(cp, 1.3, qq, cp, 1.3, c, null, lo2); let last = -1; const pts = [];
        for (let k = 0; k <= n; k++) { const an = Math.PI * k / n, pp = cp + Math.cos(an) * rp, hh = 1.3 + Math.sin(an) * rh * (1 + 0.12 * Math.sin(an * 3 + m));
          const vv = st.v(pp, hh, qq, pp, hh, c, null, lo2); if (last >= 0) st.tri(c0, last, vv); last = vv; pts.push([pp, hh, qq - 0.1]); }
        T.lines.add(pts, 0.12, 0.5);
        if (m < 2) for (let t = 0; t < 3; t++) { const tp = cp + rng.range(-0.5, 0.5) * rp, th = 1.3 + rh * rng.range(0.75, 1.05), rr = rng.range(2.2, 3.4), qt = qq - 0.3, c1 = st.v(tp, th, qt, tp, th, S.pal.ochre, null, lo2); let l2 = -1;
          // the painted tree's crown (one flat blob up to 6.8 m long in the old sheet): a cluster of small leaves on the door
          if (T.leaves) { for (let w = 0; w < 2; w++) T.leaves.add([tp, th, qt - w * 0.01], LEAF_WALL, rr, rr * 0.55, m ? S.pal.ochre : S.pal.red, 0.95); }
          else for (let k = 0; k <= 8; k++) { const an = 6.28318 * k / 8, vv = st.v(tp + Math.cos(an) * rr, th + Math.sin(an) * rr * 0.55, qt, tp + Math.cos(an) * rr, th + Math.sin(an) * rr * 0.55, m ? S.pal.ochre : S.pal.red, null, lo2); if (l2 >= 0) st.tri(c1, l2, vv); l2 = vv; } } }
      addBar(st, rng, 'h', 1.3, 45, (a + b) / 2 - 0.45, (a + b) / 2 + 0.45, qd - 0.5, qd - 0.1, ink, 0, 0.04);
      addBar(st, rng, 'p', a, b, 1.3, 2.6, qd - 0.5, qd - 0.1, ink, 0, 0.04);
    } else addBlind(T.blinds, S, rng, posts[i] + 1, b - a, 45, 40, q - 1.45, roll, torn, { flip: rng.chance(0.5), rows: o.rows || 20 });
    if (yld) await yld();
  }
}

export default {
  id: 'morning-after-the-gale',
  name: 'The House With Its Roof Blown Off',
  category: 'artists',
  placeKind: 'interior',
  after: 'the Tale of Genji scrolls, Heian court workshop, about 1130',
  weirdness: 0.4,
  media: ['air', 'interior'],
  async build(ctx) {
    let rng = ctx.rng; const vary = ctx.vary || {}, detail = clamp((ctx.quality && ctx.quality.detail) || 1, 0.5, 1);
    const density = clamp(vary.density || 1, 0.7, 1.3);
    // ---- the edition, drawn once ----
    const vr = rng.fork('edition');
    let season = vr.pick(['autumn', 'autumn', 'autumn', 'autumn', 'winter', 'spring', 'autumn', 'winter', 'spring']);
    if (vary.hour === 'night') season = 'winter'; else if (vary.hour === 'dawn') season = 'spring'; else if (vary.hour === 'golden') season = 'autumn';
    const worn = vr.chance(0.35), hand = vr.chance(0.25) ? -1 : 1, gents = vr.chance(0.25);
    const leftOut = vr.pick(['lute', 'lute', 'zither', 'go']), rare = !!vary.rare;

    const scene = new THREE.Scene();
    const S = createStyle({ palette: PALETTE, hand, worn });
    const P = S.pal, U = S.uniforms;
    U.uGain.value = worn ? 0.065 : 0.045; U.uLoss0.value = worn ? 0.085 : 0.042;                       // bare paper grows behind each front, but the room stays painted
    scene.background = P.paper.clone();
    const path = makePath([[0, 0, 0], [0, 0, 275], [0, 0, 550], [0, 0, 825], [0, 0, LEN]]);

    // world (x, y relative to the tier floor origin, depth q) -> palace (p, h, q): for things that must keep a true shape
    const un = (x, y, q) => { const p = -x / 0.82 * hand; return [p, y - 0.57 * p - 0.58 * q, q]; };
    const tiers = [];
    for (let k = 0; k < 3; k++) {
      const g = new THREE.Group(); g.position.set(0, -10, TZ[k]); scene.add(g);
      tiers.push({ g, k, statics: makeAcc(), planks: makeAcc(), floor: makeAcc(), blinds: makeAcc(), cloth: makeAcc(), robes: makeAcc(), lines: makeLines(rng), heaps: [], leaves: makeLeafBag() });
    }
    const [T1, T2, T3] = tiers, gardenAcc = makeAcc(), mossAcc = makeAcc(), dumpAcc = makeAcc(), dumpT = { statics: dumpAcc, lines: makeLinesDump() };   // tier three's court: its green ground, and all that stands and lies on it
    function makeLinesDump() { return { add() { rng(); } }; }       // a line that is not kept still takes its one draw
    const rect = (acc, c, p0, p1, q0, q1, h = 0, loss = 0) => acc.quad(acc.v(p0, h, q0, p0, q0, c, null, [loss, 0, 0, 0]), acc.v(p1, h, q0, p1, q0, c, null, [loss, 0, 0, 0]),
      acc.v(p1, h, q1, p1, q1, c, null, [loss, 0, 0, 0]), acc.v(p0, h, q1, p0, q1, c, null, [loss, 0, 0, 0]));
    const edge = (T, p0, p1, q, h) => { for (let a = p0; a < p1; a += 60) { const pts = []; const b = Math.min(p1, a + 60 + 3);
      for (let m = 0; m <= 8; m++) pts.push([a + (b - a) * m / 8, h + rng.range(-0.06, 0.06), q + rng.range(-0.1, 0.1)]); T.lines.add(pts, 0.1, 0.4); } };

    // ---- the hero: the sleeve room at the first wall line ----
    const hero = await buildHero(ctx, { style: S, hand, worn, season, detail, floor: false });
    hero.object.position.copy(hero.anchors.place); scene.add(hero.object);
    await ctx.yield();

    // ---- floors ----
    const PA = -420, PA3 = -660, PB = 330, GQ = -104, CQ = -176;      // CQ: where the mats of tiers two and three begin (a garden court lies before them)                      // tier extents along the beams; where tier one's mats begin
    // the garden's rounded hillock (palace height over the court floor), crest to port of the path
    const hillRaw = (p, q) => 98 * Math.exp(-(Math.pow((p + 46) / 80, 2) + Math.pow((q + 160) / 46, 2))) + 34 * Math.exp(-(Math.pow((p - 95) / 60, 2) + Math.pow((q + 128) / 30, 2)));
    let over = -1e9; for (let q = -250; q <= GQ; q += 2) for (const p of [-9, 0, 9]) over = Math.max(over, hillRaw(p, q) + 0.57 * Math.abs(p) + 0.58 * q - 10);
    await ctx.yield();
    const hillK = over > -14 ? Math.max(0.5, 1 - (over + 14) / 100) : 1;         // keep the ground 14 m under the path
    const hill = (p, q) => Math.max(0, hillRaw(p, q) * hillK * (1 - smoothstep(GQ - 44, GQ - 8, q)) - 0);
    {
      const gc = P.green, st = T1.statics, NP = 52, NQ = 20, rows = [];
      for (let j = 0; j <= NQ; j++) { const q = -344 + (GQ - 7.5 + 344) * j / NQ, row = [];
        for (let i = 0; i <= NP; i++) { const p = PA + (PB - PA) * i / NP; row.push(st.v(p, hill(p, q) - 4, q, p, q, gc, null, [0.02, 0, 0, 0])); }
        if (j) st.rows(rows[j - 1], row); rows.push(row); if (j % 4 === 3) await ctx.yield(); }
      await ctx.yield();
      // overlapping mound outlines, as the workshop drew a hill: the profile of the hillock at a few depths
      for (const q of [-205, -184, -166, -150, -136, -124]) { let pts = [];
        for (let p = -200; p <= 180; p += 5) { const h = hill(p, q); if (h > 3) pts.push([p, h - 3.6, q]); else { if (pts.length > 3) T1.lines.add(pts, 0.16, 0.5); pts = []; } }
        if (pts.length > 3) T1.lines.add(pts, 0.16, 0.5); }
      rect(T1.planks, season === 'winter' ? P.white : P.ochre, PA, PB, GQ - 7, GQ, 0.6);                      // the veranda of ochre plank along the garden
      addBar(T1.statics, rng, 'p', PA, PB, -3, 0.6, GQ - 8.2, GQ - 7, P.ink, 0, 0.1);
      edge(T1, -230, 240, GQ, 0.8);
      rect(T1.floor, P.green, PA, PB, GQ, 1.2);
      // tier two: the inner hall, ending in the bridge deck; tier three: the north room, running on behind the mirror
      rect(T2.planks, P.ochre, PA, PB, CQ, -7, -0.15);                      // the inner hall is floored in plank; mats are laid where the court sits
      rect(T2.planks, P.ochre, PA, PB, -7, 3.5, 1.45);                       // the deck boards lie over the threshold beam
      addBar(T2.statics, rng, 'p', PA, PB, -1.5, 1.4, -7.6, -7, P.ochre, 0.02, 0.1);
      edge(T2, -200, 220, -8.3, 1.2);
      await ctx.yield();
      for (const [a, b, q0] of [[PA, -11, 2.7], [11, PB, 2.7], [PA, -15, -7], [14, PB, -7]]) {       // the rails of the bridge, broken where the gale went through
        // (the rail on the near side is not kept, and the far one keeps a whole coat: a chipped ochre rail before the figures who
        // stand on the deck read as stray bands slicing their robes)
        const rl = q0 < 0 ? dumpAcc : T2.statics;
        addBar(rl, rng, 'p', a, b, 5.2, 6.1, q0, q0 + 0.8, P.ochre, -0.4, 0.1);
        addBar(rl, rng, 'p', a, b, 3.0, 3.5, q0 + 0.1, q0 + 0.7, P.ochre, -0.4, 0.1);
        for (let p = a + 6; p < b - 2; p += 15) { addBar(rl, rng, 'h', 1, 5.2, p - 0.45, p + 0.45, q0, q0 + 0.8, P.ochre, -0.4, 0.05); addBar(rl, rng, 'h', 5.2, 7.4, p - 0.6, p + 0.6, q0 - 0.1, q0 + 0.9, P.ink, 0, 0.04); }
      }
      await ctx.yield();
      rect(mossAcc, P.green, PA3, PB, CQ, -17.5);                        // tier three is a maple court; the mats lie only where the mirror stands
      rect(T3.planks, season === 'winter' ? P.white : P.ochre, PA3, PB, -17.5, -13.5, 0.6);
      addBar(T3.statics, rng, 'p', PA3, PB, -3, 0.6, -18.7, -17.5, P.ink, 0, 0.1);
      rect(T3.floor, P.green, PA3, PB, -13.5, 26.6);
      rect(T3.floor, P.green, PA3, PB, 29.6, 600);                            // and one more room climbing away behind the north wall
      if (season === 'winter') {                                   // shell-white drifts the snow gale left on mats, veranda and deck
        const drift = (T, n, q0, q1, h) => { for (let i = 0; i < n; i++) { const p = rng.range(-170, 190), q = rng.range(q0, q1), rp = rng.range(7, 20);
          if (Math.abs(p) < 60 && q > -40) continue; const n2 = 16, c0 = T.statics.v(p, h, q, p, q, P.white, null, [0.04, 0, 0, 0]); let last = -1;
          for (let k = 0; k <= n2; k++) { const an = 6.28318 * k / n2, r = k === n2 ? 1 : rng.range(0.8, 1.1), pp = p + Math.cos(an) * rp * r, qq = q + Math.sin(an) * rp * 0.3 * r;
            const v = T.statics.v(pp, h, qq, pp, qq, P.white, null, [0.04, 0, 0, 0]); if (last >= 0) T.statics.tri(c0, last, v); last = v; } } };
        drift(T1, 16, GQ + 4, -8, 0.35); drift(T2, 16, -170, -14, 0.35); drift(T3, 16, -170, 10, 0.35);
      }
    }
    await ctx.yield();
    // ---- the gardens: a court lies before each room, as the scrolls set a garden at the low corner of a roofless hall ----
    // Trees keep a true shape on the page: they are drawn flat to the eye, foot at palace p, dx across the page, y = tier height.
    const Uv = (pb, dx, y, q) => { const p = pb + dx / 0.82; return [p, y - 0.57 * p - 0.58 * q, q]; };
    const blob = (acc, pb, q, pts, c, loss = 0.03) => {
      let cx = 0, cy = 0; for (const v of pts) { cx += v[0]; cy += v[1]; } cx /= pts.length; cy /= pts.length;
      const C = Uv(pb, cx, cy, q), c0 = acc.v(C[0], C[1], C[2], cx, cy, c, null, [loss, 0, 0, 0]);
      const vs = pts.map((v) => { const A = Uv(pb, v[0], v[1], q); return acc.v(A[0], A[1], A[2], v[0], v[1], c, null, [loss, 0, 0, 0]); });
      for (let i = 0; i < vs.length; i++) acc.tri(c0, vs[i], vs[(i + 1) % vs.length]); };
    const strip = (acc, pb, q, mid, c, loss = 0.03) => {            // mid = [dx, y, half width]: a ribbon in the page plane
      let prev = null; for (let i = 0; i < mid.length; i++) { const a = mid[Math.max(0, i - 1)], b = mid[Math.min(mid.length - 1, i + 1)], m = mid[i];
        let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
        const A = Uv(pb, m[0] + nx * m[2], m[1] + ny * m[2], q), B = Uv(pb, m[0] - nx * m[2], m[1] - ny * m[2], q);
        const row = [acc.v(A[0], A[1], A[2], m[0] + m[2], m[1], c, null, [loss, 0, 0, 0]), acc.v(B[0], B[1], B[2], m[0] - m[2], m[1], c, null, [loss, 0, 0, 0])];
        if (prev) acc.quad(prev[0], prev[1], row[1], row[0]); prev = row; } };
    const capCol = season === 'winter' ? P.white : S.tint(P.green);
    // a pine as the workshop drew one: an ochre trunk with an ink edge, and flat-bottomed pads of malachite, each on a thick ink underside
    const pine = (T, pb, q, y0, yTop, sc = 1) => {
      const H = yTop - y0, ph = rng() * 6.28, lean = rng.range(-0.07, 0.07) * H, tx = (t) => lean * t + sc * 5 * Math.sin(t * 4.2 + ph) * t * (1 - 0.5 * t);
      const mid = []; for (let i = 0; i <= 16; i++) { const t = i / 16; mid.push([tx(t), y0 + (H - 3 * sc) * t, sc * (2.3 - 1.5 * t)]); }
      strip(T.statics, pb, q + 0.5, mid.map((m) => [m[0], m[1], m[2] + 0.6]), P.ink, 0);
      strip(T.statics, pb, q + 0.4, mid, P.ochre, 0.04);
      const n = Math.round(rng.range(9, 13)), span = Math.min(H * 0.72, sc * 62);
      for (let i = 0; i < n; i++) {
        const f = i / (n - 1), y = yTop - 6 * sc - span * (1 - f), t = clamp((y - y0) / H, 0, 1), side = i === n - 1 ? 0 : (i % 2 ? 1 : -1);
        const rx = sc * (15.5 - 7.5 * f) * rng.range(0.8, 1.15), ry = rx * rng.range(0.36, 0.46), cx = tx(t) + side * rx * rng.range(0.5, 0.95), qi = q - 0.3 - i * 0.22, bp = rng() * 6.28;
        if (side) strip(T.statics, pb, q + 0.45, [[tx(t), y - 2.5 * sc, 0.55 * sc], [(tx(t) + cx) * 0.5, y - 1.6 * sc, 0.5 * sc], [cx, y, 0.45 * sc]], P.ink, 0);
        const dome = (ex, ey, dy, k) => { const pts = []; for (let m = 0; m <= 12; m++) { const an = Math.PI * m / 12; pts.push([cx + (rx + ex) * Math.cos(an), y + dy + (ry * k + ey) * Math.sin(an) * (1 + 0.15 * Math.sin(an * 3 + bp))]); }
          pts.push([cx - (rx + ex) * 0.5, y + dy - ry * 0.1], [cx + (rx + ex) * 0.5, y + dy - ry * 0.1]); return pts; };
        blob(T.statics, pb, qi + 0.11, dome(0.75 * sc, 0.6 * sc, -1.1 * sc, 1), P.ink, 0);
        blob(T.statics, pb, qi, dome(0, 0, 0, 1), P.green, 0.03);
        if (season === 'winter' || i % 3 === 0) blob(T.statics, pb, qi - 0.06, dome(-rx * 0.3, 0, ry * 0.42, 0.5).map((v) => [cx + (v[0] - cx) * 0.9, v[1]]), capCol, 0.05);
        for (let j = -2; j <= 2; j++) T.lines.add([Uv(pb, cx + j * rx * 0.22, y + ry * 0.12, qi - 0.1), Uv(pb, cx + j * rx * 0.34, y + ry * (0.62 - 0.06 * j * j), qi - 0.1)], 0.1, 0.5, 4);
      } };
    // a maple (cherry in spring, bare under snow in winter): ink trunk and boughs, leaves as small flat stars of red lead and ochre
    const leafCols = season === 'autumn' ? [P.red, P.ochre, P.ochre, P.red, S.tint(P.red)] : season === 'spring' ? [P.white, P.white, S.tint(P.red)] : [P.white, P.white, S.tint(P.red)];
    const massCol = season === 'autumn' ? P.red : season === 'spring' ? S.tint(P.red) : null;
    const starCols = season === 'autumn' ? [P.ochre, P.ochre, S.tint(P.red), P.white, P.ochre] : leafCols;
    // fine (a generator of its own, or nothing): the maples that stand close under the line we fly. Their canopy is not laid in
    // as one great red star (which read as a single flat shard wherever we pass close over it) but as a drift of seven leaf-stars
    // in red lead and ochre with more small leaves over them: the same red and orange mass, in smaller pieces.
    const fineRng = makeRng(hashSeed('gale-fine-leaves:' + (ctx.seed || 0)));
    const fineCols = season === 'autumn' ? [P.red, P.ochre, P.red, S.tint(P.red), P.red, P.ochre, P.red] : null;
    const maple = (T, pb, q, y0, yTop, sc = 1, fine = null) => {
      const H = yTop - y0, W = sc * 27, ph = rng() * 6.28, tx = (t) => W * 0.14 * Math.sin(t * 3 + ph) * t, mid = [];
      for (let i = 0; i <= 12; i++) { const t = i / 12; mid.push([tx(t), y0 + 0.86 * H * t, sc * (1.9 - 1.3 * t)]); }
      strip(T.statics, pb, q + 0.4, mid, P.ink, 0);
      const nl = Math.round(18 * (0.6 + 0.4 * detail));
      for (let b = 0; b < 7; b++) { const t0 = 0.5 + 0.07 * b, side = b % 2 ? 1 : -1, ex = b === 6 ? tx(1) : side * W * rng.range(0.3, 1), ey = yTop - 5 * sc - rng.range(0, 0.34) * Math.min(H, 70 * sc) * (1 - b / 9);
        const sx = tx(t0), sy = y0 + 0.86 * H * t0;
        strip(T.statics, pb, q + 0.42, [[sx, sy, 0.8 * sc], [(sx + ex) * 0.5 + side * 2, (sy + ey) * 0.5 + 3 * sc, 0.6 * sc], [ex, ey, 0.4 * sc]], P.ink, 0);
        for (const [ccx, ccy, R] of [[ex, ey, sc * rng.range(8, 12)], [(sx + ex) * 0.5 + side * 3, (sy + ey) * 0.5 + 4 * sc, sc * rng.range(5, 8)]]) {
          if (massCol) { const mp = [], a1 = rng() * 6.28; for (let m = 0; m < 12; m++) { const an = a1 + m / 12 * 6.28318, rr = R * (m % 2 ? 0.62 : 1.0) * rng.range(0.85, 1.1); mp.push([ccx + Math.cos(an) * rr * 1.25, ccy + Math.sin(an) * rr * 0.75]); }
            // (the mass was one twelve-pointed star up to 38 m across: now two drifts of small leaves over the same ellipse)
            if (!fine) for (let j = 0; j < 2; j++) T.leaves.add(Uv(pb, ccx, ccy, q - 0.1 - j * 0.02), LEAF_PAGE, R * 1.25 * 0.95, R * 0.75 * 0.95, massCol, 0.95);
            else { for (let j = 0; j < 7; j++) { const an = a1 + j * 1.0472 + fine.range(-0.3, 0.3), d = j ? R * fine.range(0.5, 0.74) : 0, rs = R * fine.range(0.36, 0.45), a2 = fine() * 6.28, pts = [];
                for (let m = 0; m < 10; m++) { const a = a2 + m / 10 * 6.28318, r2 = rs * (m % 2 ? 0.55 : 1); pts.push([ccx + Math.cos(an) * d * 1.25 + Math.cos(a) * r2 * 1.15, ccy + Math.sin(an) * d * 0.75 + Math.sin(a) * r2 * 0.82]); }
                { const fx = ccx + Math.cos(an) * d * 1.25, fy = ccy + Math.sin(an) * d * 0.75, fc = fineCols ? fineCols[j] : massCol;
                  for (let w = 0; w < 2; w++) T.leaves.add(Uv(pb, fx, fy, q - 0.1 - j * 0.012 - w * 0.005), LEAF_PAGE, rs * 1.15, rs * 0.82, fc, 0.95); } }
              for (let l = 0; l < 5; l++) { const an0 = fine() * 6.28, rr = Math.sqrt(fine()) * R, lx = ccx + Math.cos(an0) * rr * 1.25, ly = ccy + Math.sin(an0) * rr * 0.75, r = sc * fine.range(1.2, 2.0), a0 = fine() * 6.28, pts = [];
                for (let m = 0; m < 6; m++) { const an = a0 + m / 6 * 6.28318, r2 = r * (m % 3 ? 0.62 : 1.15); pts.push([lx + Math.cos(an) * r2, ly + Math.sin(an) * r2]); }
                T.leaves.add(Uv(pb, lx, ly, q - 0.25 - fine() * 0.7), LEAF_PAGE, r * 1.1, r * 1.1, fine.pick([P.white, P.ochre, S.tint(P.red), P.ochre]), 0.8); } } }
          for (let l = 0; l < nl; l++) {
          const an0 = rng() * 6.28, rr = Math.sqrt(rng()) * R, lx = ccx + Math.cos(an0) * rr * 1.25, ly = ccy + Math.sin(an0) * rr * 0.75, r = sc * rng.range(1.2, 2.1), a0 = rng() * 6.28, pts = [];
          for (let m = 0; m < 6; m++) { const an = a0 + m / 6 * 6.28318, r2 = r * (m % 3 ? 0.62 : 1.15); pts.push([lx + Math.cos(an) * r2, ly + Math.sin(an) * r2]); }
          T.leaves.add(Uv(pb, lx, ly, q - 0.2 - rng() * 0.8), LEAF_PAGE, r * 1.1, r * 1.1, rng.pick(massCol ? starCols : leafCols), 0.8); } } } };
    // a garden stream: a winding band of shell white with an ink bank line each side and a few ripple strokes
    const stream = (T, gh, p0, p1, qc, amp, lam, w) => { const ph = rng() * 6.28, st = T.statics, qm = (p) => qc + amp * Math.sin(p / lam + ph) + 0.35 * amp * Math.sin(p / (lam * 0.37) + ph * 2.1);
      let prev = null, la = [], lb = [], i = 0;
      for (let p = p0; p <= p1; p += 5, i++) { const hw = w * (0.5 + 0.2 * Math.sin(p * 0.05 + ph)), q = qm(p), ha = gh(p, q - hw) + 0.7, hb = gh(p, q + hw) + 0.7;
        const row = [st.v(p, ha, q - hw, p, q - hw, P.white, null, [0.02, 0, 0, 0]), st.v(p, hb, q + hw, p, q + hw, P.white, null, [0.02, 0, 0, 0])];
        if (prev) st.quad(prev[0], prev[1], row[1], row[0]); prev = row;
        la.push([p, ha + 0.15, q - hw]); lb.push([p, hb + 0.15, q + hw]);
        if (la.length >= 10 || p + 5 > p1) { T.lines.add(la, 0.14, 0.4); T.lines.add(lb, 0.14, 0.4); la = [la[la.length - 1]]; lb = [lb[lb.length - 1]]; }
        if (i % 2 === 0) { const f = rng.range(-0.3, 0.3), L = rng.range(5, 9), hh = Math.max(ha, hb) + 0.2;
          T.lines.add([[p, hh, q + f * hw * 2], [p + L * 0.5, hh, qm(p + L * 0.5) + f * hw * 2 + 0.6], [p + L, hh, qm(p + L) + f * hw * 2]], 0.09, 0.8, 2.5); } } };
    const gh1 = (p, q) => hill(p, q) - 4;
    const mound = [gh1, (p, q) => 20 * Math.exp(-(Math.pow((p - 70) / 70, 2) + Math.pow((q + 244) / 24, 2))) - 4,
      (p, q) => 24 * Math.exp(-(Math.pow((p + 80) / 80, 2) + Math.pow((q + 250) / 22, 2))) - 4];
    for (const T of [T2, T3]) {                                     // the inner court and the stream court under the bridge
      const gh = mound[T.k], st = T.statics, a = T.k === 2 ? PA3 : PA, NP = T.k === 2 ? 90 : 68, NQ = 10, rows = [];
      for (let j = 0; j <= NQ; j++) { const q = -279 + (CQ - 7.5 + 279) * j / NQ, row = [];
        for (let i = 0; i <= NP; i++) { const p = a + (PB - a) * i / NP; row.push(st.v(p, gh(p, q), q, p, q, P.green, null, [0.02, 0, 0, 0])); }
        if (j) st.rows(rows[j - 1], row); rows.push(row); }
      for (const q of [-268, -256, -245, -236]) { let pts = [];
        for (let p = -220; p <= 200; p += 5) { const h = gh(p, q); if (h > -1.5) pts.push([p, h + 0.4, q]); else { if (pts.length > 3) T.lines.add(pts, 0.16, 0.5); pts = []; } }
        if (pts.length > 3) T.lines.add(pts, 0.16, 0.5); }
      rect(T.planks, season === 'winter' ? P.white : P.ochre, a, PB, CQ - 7, CQ, 0.6);
      addBar(st, rng, 'p', a, PB, -3, 0.6, CQ - 8.2, CQ - 7, P.ink, 0, 0.1);
      edge(T, -230, 240, CQ, 0.8); edge(T, -230, 240, CQ - 3.5, 0.75);
      await ctx.yield();
    }
    stream(T1, gh1, -215, 220, -121, 4, 60, 7);
    await ctx.yield();
    stream(T2, mound[1], -235, 240, -216, 9, 55, 9);
    stream(T3, mound[2], -260, 240, -228, 13, 70, 10);
    await ctx.yield();
    const gy = (k, p, q) => 0.57 * p + 0.58 * q + mound[k](p, q);
    // [tier, pine 0 | maple 1, p, q, crown top (the path is at 10), scale]: the tall ones stand close beside the line we fly
    const trees = [[0, 0, -36, -135, 1, 1], [0, 1, 34, -138, 4, 0.9], [0, 0, 78, -158, -18, 0.75], [0, 0, -120, -175, -52, 0.7], [0, 0, 135, -205, -8, 0.5], [0, 1, -84, -146, -44, 0.6],
      [1, 1, -26, -190, -19, 1.1], [1, 0, 27, -191, -1, 1], [1, 0, -95, -238, -62, 0.8], [1, 0, 115, -246, -12, 0.7],
      [2, 0, -30, -195, 0, 1], [2, 1, 30, -187, 2, 1], [2, 0, 100, -242, 0, 0.7], [2, 1, -110, -228, -60, 0.8]];
    let nP1 = 0;
    for (const [k, qw] of [[0, 2.6], [1, 5.5], [2, 22]]) for (let p = -330 + rng.range(0, 40); p < 300; p += rng.range(44, 78)) {
      if (Math.abs(p) < (k === 2 ? 60 : 28)) continue;
      const sc = rng.range(1.15, 1.7), y0 = 0.57 * p + 0.58 * qw + 57; const hp = rng.range(36, 50) * sc; if (k === 1) pine(p < 30 ? tiers[k] : dumpT, p, qw, y0 - 4, y0 - 4 + hp * (0.5 + 0.2 * (nP1++ % 2)), sc * 0.8); else pine(tiers[k], p, qw, y0, y0 + hp, sc); await ctx.yield(); }
    // tall pines rising from behind the bridge wall into the paper lobe. They draw from their own generator (made without
    // touching ctx.rng), so every other draw of the build is where it was.
    const lobeLines = makeLines(makeRng(hashSeed('lobe-pines:' + (ctx.seed || 0))));
    { const keep = rng; rng = makeRng(hashSeed('lobe-pines-b:' + (ctx.seed || 0))); const lobeT = { statics: T2.statics, lines: lobeLines };
      for (const [p, hp, sc] of [[-78, 118, 1.5], [-150, 96, 1.25], [-212, 132, 1.6], [-285, 104, 1.3], [-350, 124, 1.5]]) { const y0 = 0.57 * p + 0.58 * 7 + 40; pine(lobeT, p, 7, y0, y0 + hp, sc); await ctx.yield(); }
      rng = keep; }
    for (const [k, kind, p, q, top, sc] of trees) { (kind ? maple : pine)(tiers[k], p, q, gy(k, p, q), top, sc, kind && k === 2 ? fineRng : null); await ctx.yield(); }

    // ---- wall lines: tier one continues the hero's wall both ways; posts of successive lines are staggered ----
    const rolls = (lo) => (i, p0) => [rng.pick(lo), rng.chance(0.33 * density) ? 1 : 0];
    await wallLine(S, rng, T1, { posts: [-327, -282, -237, -192, -147], pA: -343, pB: -163, q0: 0, skip: new Set([4]), rollOf: rolls([0.15, 0.3, 0.55, 0.75]) }, ctx.yield);
    await wallLine(S, rng, T1, { posts: [123, 168, 213, 258, 303], pA: 139, pB: 319, q0: 0, skip: new Set([0]), rollOf: rolls([0.15, 0.3, 0.55, 0.75]) }, ctx.yield);
    await ctx.yield();
    const posts2 = [], posts3 = []; for (let i = -7; i <= 7; i++) posts2.push(-27 + 45 * i);
    for (let i = -13; i <= 7; i++) posts3.push(-20 + 45 * i);   // tier three runs on to port under the paper lobe
    const r2 = rolls([0.3, 0.55, 0.75, 0.8]), r3 = rolls([0.08, 0.12, 0.2, 0.3]);
    await wallLine(S, rng, T2, { posts: posts2, pA: -358, pB: 304, q0: 0, rollOf: (i, p0) => { const r = p0 === -27 ? [0.78, 0] : r2(i, p0); return i === 6 || i === 7 ? [-0.8, 0] : i === 8 ? [0.8, 0] : r; }, kind: (i, p0) => (i === 0 || i === 2 || i === 5 || i === 9 || i === 12 ? 'cloth' : 'blind') }, ctx.yield);
    await ctx.yield();
    await wallLine(S, rng, T3, { posts: posts3, pA: -621, pB: 311, q0: 28, rollOf: (i, p0) => (p0 === -20 ? [0.1, 0] : r3(i, p0)), kind: (i, p0) => (i % 4 === 2 && p0 !== -20 && p0 !== 25 && p0 !== -65 ? 'blind' : 'door') }, ctx.yield);
    await ctx.yield();
    await wallLine(S, rng, T3, { posts: posts3.map((p) => p - 19), pA: -640, pB: 292, q0: 300, rows: 10, rollOf: rolls([0.15, 0.3, 0.55]) }, ctx.yield);
    await ctx.yield();
    await wallLine(S, rng, T3, { posts: posts3.map((p) => p + 13), pA: -608, pB: 324, q0: 596, rows: 8, rollOf: rolls([0.15, 0.3, 0.55]) }, ctx.yield);
    await ctx.yield();

    // ---- the court: robe heaps, all turned away ----
    // No two alike: each heap draws its own train and sleeves (now and then one sleeve thrown long across two mats),
    // its own fall of hair (length, width, swing), and may lie low. o.long: -1 | 0 | 1 which sleeve is thrown long.
    const rngMain = rng;
    const person = async (T, o, rngX) => {
      const rng = rngX || rngMain, sc = o.scale || 1, gent = o.gent === undefined ? gents : o.gent, col = bandsFor(S, season, rng);
      const top = rng.pick(gent ? [P.white, P.purple, S.tint(P.purple), P.white] : [col.top, col.top, col.top, S.tint(P.green), S.tint(P.red)]);
      const bands = gent ? col.bands.slice(7) : sc < 0.7 ? col.bands.slice(4) : col.bands.slice(rng.int(0, 2));
      const long = o.long === undefined ? (rng.chance(0.25) ? (rng.chance(0.5) ? 1 : -1) : 0) : o.long;
      const lobes = [[rng.range(-0.14, 0.14), rng.range(12.5, 23), rng.range(0.27, 0.4)],
        [rng.range(0.6, 0.98), long === 1 ? rng.range(26, 31) : rng.range(9.5, 19), long === 1 ? 0.17 : rng.range(0.19, 0.27)],
        [-rng.range(0.6, 0.98), long === -1 ? rng.range(26, 31) : rng.range(9.5, 19), long === -1 ? 0.17 : rng.range(0.19, 0.27)]];
      const heap = await addRobeHeapAsync(T.robes, T.lines, S, rng, { p: o.p, q: o.q, scale: sc, rot: o.rot === undefined ? rng.range(-0.85, 0.85) : o.rot,
        segs: o.segs || 56, nm: 8, nearSide: 0, bands, top, loss: 0.03, lobes, flat: o.flat, lift: o.lift }, ctx.yield);
      await ctx.yield();
      addHairAndFolds(T.robes, T.lines, S, rng, heap, { hair: !gent, folds: 8, lean: rng.range(-0.55, 0.55), hairLen: o.hairLen || rng.range(12.5, 25), hairW: rng.range(0.85, 1.25) });
      if (gent) {                                                  // the small black cap and its tail
        const t = heap.top + (o.lift || 0);
        addBar(T.statics, rng, 'h', t - 0.4 * sc, t + 3.0 * sc, o.p - 1.4 * sc, o.p + 1.4 * sc, o.q - 0.6 * sc, o.q + 1.8 * sc, P.ink, 0, 0.05);
        addBar(T.statics, rng, 'h', t + 1.0 * sc, t + 7.0 * sc, o.p - 0.45 * sc, o.p + 0.45 * sc, o.q + 1.8 * sc, o.q + 2.3 * sc, P.ink, 0, 0.05);
      }
      T.heaps.push({ p: o.p, q: o.q, sc, heap, cols: [top, top, ...bands] });
      return heap;
    };
    // The court sits in groups, as the workshop grouped it: a pair whose hems overlap, a lady with a page tucked beside her,
    // one lying low with a sleeve thrown long, one alone. n = people wanted; fixed = hand-placed ones (kept clear of).
    const court = (n, reg, fixed, bad) => { const out = fixed.slice(), cen = fixed.map((o) => [o.p, o.q]); let tries = 0, kind = rng.int(0, 3);
      const clear = (p, q, sc) => !(Math.abs(p) < 30 * sc + 9 && 10 - 0.58 * q < 22 * sc + 9) && !(bad && bad(p, q)) && p > reg[0] - 20 && p < reg[1] + 20 && q < reg[3] + 6;
      while (out.length < n && tries++ < 600) { const p = rng.range(reg[0], reg[1]), q = rng.range(reg[2], reg[3]);
        if (!clear(p, q, 1) || cen.some((c) => Math.hypot(c[0] - p, (c[1] - q) * 1.25) < 50)) continue;
        cen.push([p, q]); kind = (kind + 1) % 4; const sd = rng.chance(0.5) ? 1 : -1;
        if (kind === 0) {                                          // the pair: the nearer one's hem laid over the further one's
          const d = rng.range(15, 20), dq = rng.range(5, 10);
          out.push({ p: p - sd * d * 0.5, q: q + dq * 0.5, scale: rng.range(0.85, 1), rot: sd * rng.range(0.1, 0.5), long: 0 });
          if (clear(p + sd * d * 0.5, q - dq * 0.5, 1)) out.push({ p: p + sd * d * 0.5, q: q - dq * 0.5, scale: rng.range(0.8, 0.95), rot: -sd * rng.range(0.2, 0.7), lift: 0.5, long: 0 });
        } else if (kind === 1) {                                   // a lady and the page tucked in beside her
          out.push({ p, q, scale: rng.range(0.9, 1.05), long: 0 });
          if (clear(p + sd * 15, q - 4, 0.5)) out.push({ p: p + sd * rng.range(14, 16.5), q: q - rng.range(2, 7), scale: 0.5, lift: 0.5 });
        } else if (kind === 2) {                                   // lying low, one sleeve thrown long across two mats
          out.push({ p, q, scale: rng.range(0.95, 1.1), flat: rng.range(0.5, 0.62), long: sd, rot: sd * rng.range(0.5, 1.0), hairLen: rng.range(21, 25) });
        } else out.push({ p, q, scale: rng.range(0.8, 1), hairLen: rng.chance(0.5) ? rng.range(12.5, 15) : rng.range(22, 25) });
      }
      return out; };
    const fanAt = { p: 44 + rng.range(-3, 3), q: -60 + rng.range(-4, 4), scale: 1, rot: rng.range(-0.2, 0.2), gent: false, long: 0, hairLen: 19 };
    const kichoP = 30 + rng.range(-3, 3), kichoQ = -150 + rng.range(-4, 4);    // a second curtain of state, standing in the inner hall
    const cast = [
      court(Math.round(6 * density) + 3, [-150, 160, -92, -30], [{ p: 70, q: -14, scale: 1, rot: -0.3, long: 0, hairLen: 22 }, { p: 95, q: -10, scale: 0.9, rot: 0.4, long: 0, gent: true }, { p: -62, q: -30, scale: 1, rot: 0.2, long: 1 },
        { p: 120, q: -9, scale: 0.95, rot: -0.15, long: 0, hairLen: 23 },
        { p: -10, q: -7, scale: 0.5, rot: 0.3, long: 0, gent: false, hairLen: 9 }, { p: 49, q: -57, scale: 1.0, rot: -0.25, long: 0, gent: false, hairLen: 23 }], (p, q) => p > -75 && p < 75 && q > -72),
      // tier two: the fan lady; a lady half hidden behind the curtain of state that still stands to starboard
      court(Math.round(16 * Math.min(1.1, density)), [-125, 150, -150, -16], [fanAt, { p: kichoP + 30, q: kichoQ + 15, scale: 1, rot: 0.25, long: 0, hairLen: 24 },
          { p: fanAt.p + 27, q: fanAt.q + 9, scale: 0.95, rot: 0.35, long: 0, gent: true }, { p: fanAt.p - 22, q: fanAt.q + 7, scale: 0.5, lift: 0.5 }, { p: fanAt.p + 8, q: fanAt.q + 29, scale: 0.9, rot: -0.3, long: 0, hairLen: 22, gent: false },
          // three who have come out onto the bridge to look: whole and central as we sink toward it
          { p: 28, q: -1.8, scale: 0.56, rot: 0.2, lift: 1.45, long: 0, gent: false }, { p: -25, q: -2, scale: 0.5, rot: -0.3, lift: 1.45, long: 0 }, { p: 53, q: -2.5, scale: 0.7, rot: -0.15, lift: 1.45, long: 0, gent: true }],
        (p, q) => (Math.abs(p) < 30 && q > -20) || (p > kichoP - 12 && p < kichoP + 62 && q > kichoQ - 30 && q < kichoQ + 6)),
      // tier three: the four by the mirror; one half hidden behind the standing curtain; one behind the far wall, cut by blind and post
      court(Math.round(14 * Math.min(1.1, density)) + 2, [-125, 150, -150, 16],
        [{ p: 17, q: 12, scale: 0.62, rot: -0.2 }, { p: -24, q: 9, scale: 0.62, rot: 0.25 }, { p: 58, q: 2, scale: 1, gent: true }, { p: -66, q: -12, scale: 0.9 },
          { p: -84, q: -7, scale: 1, rot: -0.2, long: 0, hairLen: 23 }, { p: 86, q: 47, scale: 1, rot: 0.3, long: 0, hairLen: 22 }], (p, q) => (p < -45 && p > -108 && q > -45 && q < -8) || (Math.abs(p) < 34 && q > -30)),
    ];
    { const done = new Set(), mat = (r, p) => { const off = (((r % 2) + 2) % 2) * 13.5 + 3 * Math.sin(r * 12.9898), a = Math.floor((p + off) / 27) * 27 - off, key = r + ':' + Math.round(a);
        if (done.has(key) || r * 13.5 < CQ || r > -2) return; done.add(key); rect(T2.floor, P.green, a, a + 27, r * 13.5, r * 13.5 + 13.5, 0.12); };
      for (const o of cast[1]) { const r0 = Math.floor((o.q - 9) / 13.5), w = (o.scale || 1) > 0.7 ? 24 : 10; for (const r of [r0, r0 + 1]) for (const dp of [-w * 0.5, w * 0.5]) mat(r, o.p + dp); }
      for (let p = -400; p < 320; p += 27) mat(-2, p); }
    // the gentleman by the mirror wall, who stood hard under the wall line, sits out on the mats of the north room
    // (and is a lady: twelve bands and a fall of hair beside the mirror). The gentleman's own draws are still taken, so the rest of the court sits where it sat.
    const xr3 = makeRng(hashSeed('gale-mirror-lady:' + (ctx.seed || 0))), xLines3 = makeLines(xr3);
    for (const o of cast[2]) if (o.p === 58 && o.q === 2 && o.gent) { o.p = 36.5; o.q = -30; o.swap = true; }
    // tier one, moved after the court is drawn (so every draw stands): the page before the hero bay sits up in the open bay,
    // and the ladies under the wall sit further in on the mats (plain moves in space, the same for every seed and all the flight)
    for (const o of cast[0]) { if (o.p === -10 && o.q === -7) { o.p = -6; o.q = -4.5; } else if (o.p === 70 && o.q === -14) o.p = 61; else if (o.p === 49 && o.q === -57) o.p = 42; else if (o.p === 95 && o.q === -10) o.p = 106; }
    for (const o of cast[2]) if (o.p === 17 && o.q === 12) { o.p = 18; o.q = -4; }          // the lady beside the mirror sits before its case, on the near side of the mirror plane
    for (const o of cast[1]) if (o.p === -25 && o.q === -2) o.p = -13.5;
    // and of the other two on the deck, the lady moves clear of the bridge post that stood through her hem, and the gentleman, whom
    // stood at the deck's far corner, stands in the bay on the low side
    for (const o of cast[1]) { if (o.p === 28 && o.q === -1.8) o.p = 31.5; else if (o.p === 53 && o.q === -2.5) o.p = -58; }        // the one on the deck who stood behind the bridge post comes out into the open bay
    for (let k = 0; k < 3; k++) for (const o of cast[k]) {
      if (o.swap) { const T = tiers[k], lT = { robes: T.robes, lines: xLines3, statics: T.statics, heaps: [] };
        await person({ robes: makeAcc(), lines: makeLines(rng), statics: dumpAcc, heaps: T.heaps }, o); await ctx.yield();
        await person(lT, { p: o.p, q: o.q, scale: 1, rot: 0.25, long: 0, gent: false, hairLen: 23 }, xr3); T.heaps[T.heaps.length - 1].cols = lT.heaps[0].cols;
      } else await person(tiers[k], o);
      await ctx.yield(); }

    // ---- things the gale left: screens blown flat, a toppled curtain (tier two), a curtain of state still standing (tier three) ----
    const disc = (acc, c, p, q, h, rp, rq, half, loss = 0.05) => { const n = 14, c0 = acc.v(p, h, q, p, q, c, null, [loss, 0, 0, 0]); let last = -1;
      for (let i = 0; i <= n; i++) { const an = (half ? Math.PI : 2 * Math.PI) * i / n, pp = p + Math.cos(an) * rp * rng.range(0.94, 1.06), qq = q + Math.sin(an) * rq;
        const v = acc.v(pp, h, qq, pp, qq, c, null, [loss, 0, 0, 0]); if (last >= 0) acc.tri(c0, last, v); last = v; } };
    const screen = (T, p0, q0, np) => { const pw = 8.2, ph = 12.5;
      for (let i = 0; i < np; i++) { const a = p0 + i * pw, dq = (i % 2 ? 0.9 : -0.9) + rng.range(-0.4, 0.4);
        rect(T.statics, P.white, a + 0.15, a + pw - 0.15, q0 + dq, q0 + dq + ph, 0.5, 0.06);
        disc(T.statics, P.green, a + pw * rng.range(0.3, 0.7), q0 + dq + 0.5, 0.62, pw * rng.range(0.3, 0.44), ph * rng.range(0.35, 0.6), true);
        if (rng.chance(0.6)) disc(T.statics, S.tint(P.green), a + pw * rng.range(0.2, 0.8), q0 + dq + 0.5, 0.7, pw * 0.22, ph * rng.range(0.2, 0.3), true);
        const o = () => rng.range(-0.12, 0.12);
        T.lines.add([[a + 0.1 + o(), 0.8, q0 + dq + o()], [a + pw - 0.1 + o(), 0.8, q0 + dq + o()], [a + pw - 0.1 + o(), 0.8, q0 + dq + ph + o()], [a + 0.1 + o(), 0.8, q0 + dq + ph + o()], [a + 0.1 + o(), 0.8, q0 + dq + o()]], 0.11, 0.3); } };
    screen(T2, -92 + rng.range(-6, 6), -112 + rng.range(-5, 5), 6);
    screen(T2, 62 + rng.range(-6, 6), -40 + rng.range(-4, 4), 6);
    {
      const p0 = -104 + rng.range(-4, 4), q0 = -54 + rng.range(-4, 4), w = 44, d = 13;
      for (let i = 0; i < 4; i++) { const a = p0 + i * (w / 4), dq = rng.range(-0.8, 0.8);
        rect(T2.statics, P.red, a + 0.2, a + w / 4 - 0.2, q0 + dq, q0 + d + dq, 0.5, 0.05);
        disc(T2.statics, P.white, a + w / 8, q0 + dq + d * (i % 2 ? 0.32 : 0.66), 0.62, 1.7, 1.7, false, 0.1);
        rect(T2.statics, P.purple, a + w / 8 - 0.6, a + w / 8 + 0.6, q0 + dq - 4 - rng.range(0, 3), q0 + d + dq + 1, 0.7, 0.03); }
      addBar(T2.statics, rng, 'p', p0 - 3, p0 + w + 3, 0.2, 1.5, q0 + d + 1.6, q0 + d + 3, P.ink, 0, 0.08);
      addCurtain(T3.cloth, T3.statics, S, rng, -104, -50, -24 + rng.range(-2, 2), 27);
      addCurtain(T2.cloth, T2.statics, S, rng, kichoP, kichoP + 50, kichoQ, 27);
    }
    await ctx.yield();

    // ---- the maple court of tier three: maples standing in drifts of their own fallen leaves, a stream winding through ----
    {
      // a fallen leaf-star of the old sheet (up to 7.4 m across) is a small drift of leaves on the same spot, in its colour;
      // bag null = one of the stars that was never kept (its draw is still taken). Each drift lies at a height of its own.
      let nLit = 0;
      const leaf = (bag, p, q, h, r, c) => { rng(); if (bag) bag.add([p, h + 0.3 * ((nLit++ * 0.618) % 1), q], LEAF_FLOOR, r * 1.3, r * 1.04, c, 0.5, 0.42); };
      // the drift under a grove (a flat disc of leaf colour 40 to 70 m long in the old sheet): two layers of small leaves
      const drift = (c, p, q, h, rp, rq) => { for (let i = 0; i <= 14; i++) rng.range(0.94, 1.06);
        for (let w = 0; w < 2; w++) T3.leaves.add([p, h + w * 0.012, q], LEAF_FLOOR, rp * 1.1, rq * 1.1, c, 0.72, 0.42); };
      const lc = season === 'autumn' ? [P.red, P.ochre, P.red, S.tint(P.red), P.ochre] : [P.white, S.tint(P.red), P.white];
      const groves = [[-34, -140, 0, 1.15], [38, -118, -2, 1.1], [-30, -84, -1, 1.0], [46, -64, -4, 0.9], [-112, -122, -50, 0.95], [98, -150, 2, 1.0], [152, -92, 70, 0.85], [-172, -64, -74, 0.9], [-150, -158, -90, 1.0], [112, -40, 62, 0.8], [-250, -110, -150, 1.0]];
      stream(T3, () => -0.3, -330, 250, -100, 15, 75, 9);
      await ctx.yield();
      for (const [p, q, top, sc] of groves) {
        for (let m = 0; m < 3; m++) { const dc = m === 1 ? (season === 'autumn' ? P.ochre : S.tint(P.red)) : (season === 'winter' ? P.white : P.red);
          const dp = p + rng.range(-16, 16) + (m - 1) * 22 * sc, dq = q + rng.range(-7, 7) - (m === 1 ? 6 : 0), drp = sc * rng.range(17, 30), drq = sc * rng.range(6, 11);
          if (season === 'winter' && m !== 1) disc(gardenAcc, dc, dp, dq, 0.22 + m * 0.03, drp, drq, false, 0.06);       // a snow drift is snow, one white sheet
          else drift(dc, dp, dq, 0.22 + m * 0.03, drp, drq); }
        maple({ statics: gardenAcc, leaves: T3.leaves }, p, q, 0.57 * p + 0.58 * q, top, sc, Math.abs(p) < 60 ? fineRng : null); await ctx.yield(); }
      // tier one: a screen blown flat before the sleeve wall, and the garden maple's leaves blown in across the mats
      screen(T1, 16 + rng.range(-3, 3), -56 + rng.range(-2, 2), 6);
      await ctx.yield();
      for (let i = 0; i < Math.round(240 * detail); i++) { const p = rng.range(-160, 170), q = rng.range(GQ + 3, -3); leaf(i % 5 < 2 ? T1.leaves : null, p, q, 0.5, rng.range(1.2, 2.5), rng.pick(lc)); }
      await ctx.yield();
      for (let i = 0; i < Math.round(150 * detail); i++) { const p = rng.range(-150, 150), q = rng.range(-13, 24); if (Math.abs(p) < 12 && Math.abs(q - 1) < 5) continue; leaf(i % 2 ? T3.leaves : null, p, q, 0.5, rng.range(1.2, 2.4), rng.pick(lc)); }
      const nLeaf = Math.round(760 * detail);
      for (let i = 0; i < nLeaf; i++) { let p, q;
        if (i % 5 < 3) { const g = rng.pick(groves); p = g[0] + (rng() + rng() + rng() - 1.5) * 62; q = g[1] + (rng() + rng() + rng() - 1.5) * 26; } else { p = rng.range(-300, 215); q = rng.range(CQ + 4, -22); }
        q = clamp(q, CQ + 3, -21); leaf(i % 5 < 3 || i % 10 === 3 ? T3.leaves : null, p, q, 0.75, rng.range(1.5, 3.1), rng.pick(lc));
        if ((i & 127) === 127) await ctx.yield(); }
    }
    // ---- the mirror's face: a painted disc (pine, maple and stream on ochre) that flakes away chip by chip as we come ----
    const faceGeo = new THREE.BufferGeometry();
    { const pos = [], col = [], uvs = [], idx = []; let layer = 0;
      const V = (x, y, c) => { const A = un(x, 10 + y, -0.35 - layer * 0.012); pos.push(A[0], A[1], A[2]); col.push(c.r, c.g, c.b); uvs.push(x, y); return pos.length / 3 - 1; };
      const poly = (pts, c) => { let cx = 0, cy = 0; for (const v of pts) { cx += v[0]; cy += v[1]; } const c0 = V(cx / pts.length, cy / pts.length, c), vs = pts.map((v) => V(v[0], v[1], c));
        for (let i = 0; i < vs.length; i++) idx.push(c0, vs[i], vs[(i + 1) % vs.length]); layer++; };
      const ell = (cx, cy, rx, ry, a0 = 0, a1 = 6.28318, n = 16) => { const pts = []; for (let i = 0; i <= n; i++) { const an = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(an) * rx, cy + Math.sin(an) * ry]); } return pts; };
      const leafC = season === 'autumn' ? [P.red, P.red, S.tint(P.red)] : [P.white, S.tint(P.red)];
      poly(ell(0, 0, 7.3, 7.3, 0, 6.28318, 28), season === 'winter' ? S.tint(P.purple) : P.ochre);
      for (const [cx, rx, ry, c] of [[-3.4, 5.2, 4.6, P.green], [3.6, 4.6, 3.3, S.tint(P.green)], [0.6, 3.4, 2.5, P.green]]) { poly(ell(cx, -7.6, rx + 0.16, ry + 0.16, 0, Math.PI), P.ink); poly(ell(cx, -7.6, rx, ry, 0, Math.PI), c); }
      { const band = []; for (let i = 0; i <= 12; i++) { const x = -7.2 + 14.4 * i / 12; band.push([x, -4.9 + 0.7 * Math.sin(x * 0.8)]); } for (let i = 12; i >= 0; i--) { const x = -7.2 + 14.4 * i / 12; band.push([x, -6.1 + 0.7 * Math.sin(x * 0.8 + 0.5)]); }
        for (let i = 0; i < 12; i++) { const a = band[i], b = band[i + 1], c = band[25 - i - 1], d = band[25 - i]; poly([a, b, c, d], P.white); } }
      poly([[-2.5, -5.2], [-1.75, -5.2], [-1.2, 1.2], [-1.75, 1.2]], P.ink);                                    // the pine: trunk and three pads
      for (const [cx, cy, rx] of [[-3.3, -1.3, 2.3], [-0.3, 0.3, 2.1], [-1.9, 2.4, 2.5]]) { poly(ell(cx, cy - 0.22, rx + 0.2, rx * 0.5 + 0.1, 0, Math.PI, 10).concat([[cx - rx * 0.6, cy - 0.45], [cx + rx * 0.6, cy - 0.45]]), P.ink);
        poly(ell(cx, cy, rx, rx * 0.46, 0, Math.PI, 10), P.green); }
      for (let i = 0; i < 22; i++) { const an = rng() * 6.28, rr = Math.sqrt(rng()) * 2.6, lx = 3.1 + Math.cos(an) * rr * 1.2, ly = 1.6 + Math.sin(an) * rr, r = rng.range(0.45, 0.8), a0 = rng() * 6.28, pts = [];
        for (let m = 0; m < 6; m++) { const a2 = a0 + m / 6 * 6.28318, r2 = r * (m % 2 ? 0.5 : 1.2) * 0.5; pts.push([lx + Math.cos(a2) * r2, ly + Math.sin(a2) * r2]); } poly(pts, rng.pick(leafC)); }
      { const fr = makeRng(hashSeed('gale-face-leaves:' + (ctx.seed || 0)));       // the painted maple keeps its mass in more, smaller leaves (none over 1 m)
        for (let i = 0; i < 70; i++) { const an = fr() * 6.28, rr = Math.sqrt(fr()) * 2.6, lx = 3.1 + Math.cos(an) * rr * 1.2, ly = 1.6 + Math.sin(an) * rr, r = fr.range(0.5, 0.8), a0 = fr() * 6.28, pts = [];
          for (let m = 0; m < 6; m++) { const a2 = a0 + m / 6 * 6.28318, r2 = r * (m % 2 ? 0.5 : 1.2) * 0.5; pts.push([lx + Math.cos(a2) * r2, ly + Math.sin(a2) * r2]); } poly(pts, fr.pick(leafC)); } }
      for (let i = 0; i < 5; i++) { const lx = rng.range(-5.5, 5.5), r = 0.4, a0 = rng() * 6.28, pts = []; for (let m = 0; m < 6; m++) { const a2 = a0 + m / 6 * 6.28318, r2 = r * (m % 2 ? 0.5 : 1.2); pts.push([lx + Math.cos(a2) * r2, -5.5 + 0.7 * Math.sin(lx * 0.8) + Math.sin(a2) * r2]); } poly(pts, rng.pick(leafC)); }
      faceGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); faceGeo.setAttribute('aCol', new THREE.Float32BufferAttribute(col, 3));
      faceGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); faceGeo.setIndex(idx); faceGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); }
    const mFace = new THREE.ShaderMaterial({
      uniforms: { ...S.uniforms, uOpen: { value: 0 } },
      vertexShader: `attribute vec3 aCol; varying vec2 vUv; varying vec3 vCol;\n${STYLE_GLSL}\nvoid main(){ vUv = uv; vCol = aCol; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(gShear(position), 1.); }`,
      fragmentShader: `varying vec2 vUv; varying vec3 vCol; uniform float uOpen;\n${STYLE_GLSL}
void main(){ float r = length(vUv); if (r > 7.14) discard;
  vec3 c = gCell(vUv / 1.25 + 5.3); float thr = c.y * 0.62 + 0.38 * r / 7.14;
  if (thr < uOpen) discard;
  vec3 col = vCol; if (thr < uOpen + 0.035) col = mix(uPaper, uInk, 0.12);
  gl_FragColor = vec4(col, 1.); }`, side: THREE.DoubleSide });
    S.mats.push(mFace);
    await ctx.yield();
    // ---- the mirror (the exit) on its black lacquer stand, and the object left out overnight beside it ----
    {
      const st = T3.statics, n = 56, ring = (r0, r1, c, q) => { let prev = null;
        for (let i = 0; i <= n; i++) { const an = i / n * 6.28318, j = i === n || i === 0 ? 0 : rng.range(-0.05, 0.05), cs = Math.cos(an), sn = Math.sin(an);
          const A = un(cs * (r0 + j), 10 + sn * (r0 + j), q), B = un(cs * (r1 + j), 10 + sn * (r1 + j), q);
          const row = [st.v(A[0], A[1], A[2], an * r0, 0, c, null, [-0.4, 0, 0, 0]), st.v(B[0], B[1], B[2], an * r0, r1 - r0, c, null, [-0.4, 0, 0, 0])];
          if (prev) st.quad(prev[0], prev[1], row[1], row[0]); prev = row; } };
      ring(7.12, 8.7, P.ink, 0.5); ring(8.7, 9.15, P.white, 0.55); ring(9.15, 9.5, P.ink, 0.6);
      // the mirror's case: an eight-lobed plate of ochre (never red lead: the rare accent stays under a tenth of a frame) with an ink edge round the rim, as court mirrors were cased, so the
      // exit is one clear flower at the centre of the north room from the second drop on (no draw from ctx.rng)
      { const lobe = (an) => 11.3 + 2.1 * Math.pow(Math.abs(Math.cos(4 * an)), 0.55), N = 96, lo = [-0.4, 0, 0, 0]; let pr = null;
        for (let i = 0; i <= N; i++) { const an = i / N * 6.28318 + 0.3927, cs = Math.cos(an), sn = Math.sin(an), R = lobe(an);
          const pt = (r, q, c) => { const A = un(cs * r, 10 + sn * r, q); return st.v(A[0], A[1], A[2], an * 9, r, c, null, lo); };
          const row = [pt(9.4, 0.72, P.ochre), pt(R, 0.72, P.ochre), pt(R - 0.1, 0.8, P.ink), pt(R + 0.55, 0.8, P.ink), pt(10.15, 0.68, P.white), pt(10.6, 0.68, P.white)];
          if (pr) { st.quad(pr[0], pr[1], row[1], row[0]); st.quad(pr[2], pr[3], row[3], row[2]); st.quad(pr[4], pr[5], row[5], row[4]); } pr = row; } }
      addBar(st, rng, 'p', -13, 13, 0.2, 1.8, 0.7, 2.6, P.ink, 0, 0.06);
      for (const p of [-11.2, 11.2]) addBar(st, rng, 'h', 0, p < 0 ? 12 : 6, p - 0.7, p + 0.7, 0.9, 2.3, P.ink, 0, 0.05);
      // THE BLACK LACQUER STAND (the design's built: 'a round mirror on a black lacquer stand'). The bar and legs above stand
      // behind the case and are hidden by it, so the mirror seemed to sit on the mats. A low stand of black lacquer now lies on
      // the floor before and under the case: a plinth and a slab on it, running along the beam direction as everything long in
      // this house does, as wide as the case, its top just under the mirror's ink rim (the portal's disc is clear of it).
      // It draws from a generator of its own, so every other draw of the build is where it was.
      { const sr = makeRng(hashSeed('gale-mirror-stand:' + (ctx.seed || 0)));
        addBar(st, sr, 'p', -15, 15, 0, 0.5, -4.6, 0.62, P.ink, 0, 0.05);
        addBar(st, sr, 'p', -13.4, 13.4, 0.5, 1.0, -3.4, 0.62, P.ink, 0, 0.05); }
      // the left-out object, 7 m and more to port of the path, drawn flat to the eye as the workshop drew things
      const ox = hand * 11.5, poly = (pts, c, q, loss = 0.04) => { const cx = pts.reduce((a, b) => a + b[0], 0) / pts.length, cy = pts.reduce((a, b) => a + b[1], 0) / pts.length;
        const C0 = un(cx, cy, q), c0 = st.v(C0[0], C0[1], C0[2], cx, cy, c, null, [loss, 0, 0, 0]), vs = pts.map((v) => { const A = un(v[0], v[1], q); return st.v(A[0], A[1], A[2], v[0], v[1], c, null, [loss, 0, 0, 0]); });
        for (let i = 0; i < vs.length; i++) st.tri(c0, vs[i], vs[(i + 1) % vs.length]);
        T3.lines.add(pts.concat([pts[0]]).map((v) => { const A = un(v[0] + rng.range(-0.1, 0.1), v[1] + rng.range(-0.1, 0.1), q - 0.15); return A; }), 0.09, 0.3); };
      const rot = (x, y, a) => [ox + hand * (x * Math.cos(a) - y * Math.sin(a)), 3.2 + x * Math.sin(a) + y * Math.cos(a)];
      if (leftOut === 'lute') { const a = -0.42, body = [];
        for (let i = 0; i < 18; i++) { const an = i / 18 * 6.28318, r = 1 - 0.28 * Math.max(0, Math.sin(an)); body.push(rot(Math.cos(an) * 2.9 * r, 3.6 + Math.sin(an) * 3.9, a)); }
        poly([rot(-0.55, 6.5, a), rot(0.55, 6.5, a), rot(0.5, 13.2, a), rot(1.9, 14.8, a), rot(1.3, 15.4, a), rot(-0.5, 13.6, a)], P.ink, -14.0, 0);
        poly(body, P.ochre, -14.2); poly([rot(-2.3, 2.6, a), rot(2.3, 2.6, a), rot(2.4, 3.7, a), rot(-2.4, 3.7, a)], P.purple, -14.3);
        for (const sx of [-0.3, 0, 0.3]) T3.lines.add([rot(sx, 1.2, a), rot(sx, 7, a), rot(sx, 13, a)].map((v) => un(v[0], v[1], -14.45)), 0.07, 0.2);
      } else if (leftOut === 'zither') { const a = -0.95;
        poly([rot(-1.6, 0, a), rot(1.6, 0, a), rot(1.5, 15, a), rot(-1.5, 15, a)], P.ochre, -14.2);
        poly([rot(-1.6, 0, a), rot(1.6, 0, a), rot(1.6, 1.1, a), rot(-1.6, 1.1, a)], P.ink, -14.3, 0);
        for (let i = 0; i < 6; i++) { const sx = -1.1 + i * 0.44; T3.lines.add([rot(sx, 1.1, a), rot(sx, 8, a), rot(sx, 14.6, a)].map((v) => un(v[0], v[1], -14.45)), 0.07, 0.2); }
        for (let i = 0; i < 6; i++) poly([rot(-1.3 + i * 0.44, 4 + i * 1.5, a), rot(-0.9 + i * 0.44, 4 + i * 1.5, a), rot(-1.1 + i * 0.44, 4.9 + i * 1.5, a)], P.white, -14.4, 0);
      } else { const a = 0;                                          // the go board: a block on four black feet with its ruled face
        const p0 = -hand * ox / 0.82 - 5, q0 = -13;
        rect(st, P.ochre, p0, p0 + 10, q0, q0 + 10, 4.2, 0.03);
        for (const [a2, b2] of [[p0, q0], [p0 + 8.6, q0], [p0, q0 + 8.6], [p0 + 8.6, q0 + 8.6]]) addBar(st, rng, 'h', 0, 4.2, a2, a2 + 1.4, b2, b2 + 1.4, P.ink, 0, 0.03);
        addBar(st, rng, 'p', p0, p0 + 10, 2.6, 4.15, q0 - 0.05, q0 + 0.3, P.ochre, 0.02, 0.04);
        for (let i = 0; i <= 8; i++) { const f = 0.6 + i * 1.1; T3.lines.add([[p0 + f, 4.35, q0 + 0.5], [p0 + f, 4.35, q0 + 5], [p0 + f, 4.35, q0 + 9.5]], 0.07, 0.1); T3.lines.add([[p0 + 0.5, 4.35, q0 + f], [p0 + 5, 4.35, q0 + f], [p0 + 9.5, 4.35, q0 + f]], 0.07, 0.1); }
        for (let i = 0; i < 14; i++) disc(st, i % 2 ? P.ink : P.white, p0 + 0.6 + 1.1 * rng.int(0, 8), q0 + 0.6 + 1.1 * rng.int(0, 8), 4.45, 0.45, 0.45, false, 0);
      }
    }
    await ctx.yield();
    if (leftOut !== 'go') {                                        // the tall lacquer stand the instrument is propped on
      const pc = -11.5 / 0.82, hb = 3.2 - 0.57 * pc + 0.58 * 14.2;
      addBar(T3.statics, rng, 'p', pc - 7, pc + 6, hb - 1.3, hb - 0.2, -16.6, -12.8, P.ink, 0, 0.05);
      for (const p of [pc - 5, pc + 4]) addBar(T3.statics, rng, 'h', 0, hb - 1.3, p - 0.6, p + 0.6, -15.6, -13.8, P.ink, 0, 0.05);
    }
    for (let q = -4.5; q < 3; q += 3.3) edge(T2, -190, 200, q + rng.range(-0.3, 0.3), 1.6);
    edge(T1, -230, 240, GQ - 3.5, 0.75);

    // ---- grasses: pampas and bush clover combed up the diagonal, thick on the hillock; torn sprays blown in across the mats ----
    const clumps = []; for (let i = 0; i < 64; i++) clumps.push([rng.range(-190, 175), rng.range(-238, GQ - 12)]);
    const NG = Math.round(5000 * detail * Math.min(1.15, density)), gO = new Float32Array(NG * 3), gG = new Float32Array(NG * 4);
    for (let i = 0; i < NG; i++) {
      const k = rng(); let p, q, h, lying = 0, ty = rng() < 0.2 ? 0 : 1, L = ty ? rng.range(10, 16) : rng.range(15, 24);
      if (k < 0.95) {
        let tries = 0; do { const c = clumps[rng.int(0, clumps.length - 1)], lone = rng() < 0.18; p = lone ? rng.range(-190, 175) : c[0] + (rng() + rng() - 1) * 11; q = lone ? rng.range(-238, GQ - 9) : Math.min(GQ - 9, c[1] + (rng() + rng() - 1) * 5); h = hill(p, q); } while (k < 0.5 && h < 10 && ++tries < 8);
        h -= 4.2;
        if (p > -40 && p < 15) {                                   // under the path: nothing rises nearer than 8 m to the eye
          const room = (-8.5 - (h + 0.57 * p + 0.58 * q - 10)) / 1.12; if (room < L) { L = Math.max(3.5, room); if (L < 9) ty = rng() < 0.5 ? 1 : 0; }
        }
      } else { p = rng.range(-170, 180); q = rng.range(GQ + 2, -1); h = 0.4; lying = 1; L *= 0.6; ty = rng() < 0.75 ? 0 : 1; }
      gO.set([p, h, q], i * 3); gG.set([L, rng() * 10, ty, lying], i * 4);
      if ((i & 1023) === 1023) await ctx.yield();
    }
    const sprays = [T2, T3].map((T) => { const nl = Math.round(260 * detail), n = nl + Math.round(900 * detail), o = new Float32Array(n * 3), g = new Float32Array(n * 4);
      const cl = []; for (let i = 0; i < 26; i++) cl.push([rng.range(-180, 190), rng.range(-272, CQ - 14)]);
      for (let i = 0; i < n; i++) {
        if (i < nl) { o.set([rng.range(-170, 180), 0.4, rng.range(CQ + 3, T.k === 2 ? 20 : -10)], i * 3); g.set([rng.range(8, 20), rng() * 10, rng() < 0.6 ? 0 : 1, 1], i * 4); continue; }
        const c = cl[rng.int(0, cl.length - 1)], p = c[0] + (rng() + rng() - 1) * 12, q = Math.min(CQ - 10, c[1] + (rng() + rng() - 1) * 5);
        o.set([p, mound[T.k](p, q) - 0.2, q], i * 3); g.set([rng() < 0.22 ? rng.range(19, 28) : rng.range(10, 16), rng() * 10, rng() < 0.22 ? 0 : 1, 0], i * 4); }
      return grassGeometry(o, g, n); });
    await ctx.yield();

    // ---- flakes of old paint, lifted by the gust fronts (and a steady few from the first second) ----
    // what flies in a leaf's colour (red lead, ochre, shell white, the red tint) is a leaf in the air to the eye, and keeps the
    // leaf limit: never over LEAF_MAX across (they were up to 3.8 m). Flakes of mat green and robe purple are paint, as they were.
    const tintRed = S.tint(P.red), sameCol = (a, b) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) < 0.02;
    const airSize = (c, sz) => (sameCol(c, P.red) || sameCol(c, P.ochre) || sameCol(c, P.white) || sameCol(c, tintRed)) ? Math.min(sz, LEAF_MAX) : sz;
    const NFt = Math.round(7500 * detail * (worn ? 1.25 : 1)), flakeGeos = [];
    for (const T of tiers) {
      const n = Math.round(NFt * [0.3, 0.37, 0.33][T.k]), aO = new Float32Array(n * 3), aF = new Float32Array(n * 4), aC = new Float32Array(n * 3);
      const wq = T.k === 2 ? 26 : -1.8, flo = season === 'winter' ? P.white : P.green;
      for (let i = 0; i < n; i++) {
        const k = rng(); let p, h, q, c, fr = T.k === 0 ? 0 : (rng() < (T.k === 1 ? 0.4 : 0.5) ? T.k : rng.int(0, T.k - 1));
        if (k < 0.33) { p = rng.range(-150, 170); q = rng.range(-175, 0); h = 0.3; c = rng.chance(0.85) ? (T.k === 1 && rng.chance(0.6) ? P.ochre : P.green) : P.white;
          if (T.k === 0 && q < GQ) { h = hill(p, q) - 3.6; c = flo; } }
        else if (k < 0.62 && T.heaps.length) { const hp = rng.pick(T.heaps); p = hp.p + rng.range(-16, 16) * hp.sc; q = hp.q + rng.range(-18, 12) * hp.sc; h = hp.heap.heightAt(p, q);
          if (h < 0) { h = 0.3; c = P.green; } else { c = rng.pick(hp.cols); h += 0.4; } }
        else if (k < 0.80) { p = rng.range(-200, 200); h = rng.range(6, 44); q = wq; c = rng.chance(0.8) ? P.ochre : P.green; }
        else { const A = un(rng.range(-15, 15), rng.range(1, 19), rng.range(-275, 15)); p = A[0]; h = A[1]; q = A[2]; fr = rng() < 0.75 ? 3 : fr;
          c = rng.pick(season === 'autumn' ? [P.green, P.red, P.white, P.ochre, P.purple, P.red, P.ochre, flo] : [P.green, P.green, P.white, P.ochre, P.purple, P.red, flo]); }
        if (fr !== 3 && rng() < 0.2) fr = 3;
        aO.set([p, h, q], i * 3); aC.set([c.r, c.g, c.b], i * 3);
        aF.set([rng() * 10, airSize(c, rng.range(0.7, 2.4) * (rng.chance(0.12) ? 1.6 : 1)), rng.range(-8, 95) * rng(), fr], i * 4);
        if ((i & 511) === 511) await ctx.yield();
      }
      flakeGeos.push(flakeGeometry(aO, aF, aC, Math.round(n * 0.5)));   // every draw is kept; half the flakes are shown, so the flat plates read
    }
    let rareGeo = null;
    if (rare) { const n = Math.round(3600 * detail), aO = new Float32Array(n * 3), aF = new Float32Array(n * 4), aC = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { const p = rng.range(-190, 200), q = rng.range(-190, 24), c = rng.chance(0.9) ? P.green : P.white;
        aO.set([p, 0.3, q], i * 3); aC.set([c.r, c.g, c.b], i * 3);
        aF.set([rng() * 10, airSize(c, rng.range(1.4, 4.2)), p + 430 + 0.25 * (q + 300) - (TZ[2] + q) + rng.range(0, 30), 0], i * 4); }
      rareGeo = flakeGeometry(aO, aF, aC, n); }
    await ctx.yield();

    // ---- THE LEAF-VIEWING DECK of the north court (tier three) ----
    // Between the bridge and the mirror the eye crossed 250 m of air with the whole north room small and far below: one view
    // held for a fifth of the flight. A railed deck of ochre plank and green mat now stands out over the stream court on plumb
    // black posts, 13 m under the line we fly at its far edge, and part of the court has come out on it to look at the maples:
    // a lady with her fall of hair whole on the high side of the path, a page beyond her, a second page under the eye. They are in
    // sight from the second drop, grow through the whole run and pass under the eye, with the tall pine and maple of the court
    // behind them. A rule in space (palace p, q, h of tier three), the same for every seed; all draws from a generator of its own.
    const deckR = makeRng(hashSeed('gale-deck:' + (ctx.seed || 0))), deckLines = makeLines(deckR), deckHeaps = [], deckFloor = makeAcc();
    // Its place along the course comes from the court itself: its two rows of mats are rows of the floor's own mat grid (13.5 m), the two
    // rows on our side of the stream's centre line (q -228), with a 4.5 m plank before them; its floor lies 13 m under the line of flight at the far rail.
    { const MATQ = 13.5, STREAM_Q = -228, D1 = MATQ * Math.floor(STREAM_Q / MATQ), D0 = D1 - 2 * MATQ - 4.5, DH = -3 - 0.58 * D1, DA = -62, DB = 68, st = T3.statics;
      rect(T3.planks, season === 'winter' ? P.white : P.ochre, DA, DB, D0, D0 + 4.5, DH + 0.5);
      addBar(st, deckR, 'p', DA - 1, DB + 1, DH - 3.4, DH + 0.5, D0 - 1.2, D0, P.ink, 0, 0.1);
      rect(deckFloor, P.green, DA, DB, D0 + 4.5, D1, DH);          // its mats are not the north room's floor: the rare event leaves them their coat
      for (const p of [-56, -11, 34, 63]) addBar(st, deckR, 'h', -4, DH - 3.4, p - 1, p + 1, D0 - 1.1, D0 + 0.9, P.ink, 0, 0.05);
      for (const [a, b] of [[DA, -15], [14, DB]]) {                     // the far rail, broken where the gale went through
        addBar(st, deckR, 'p', a, b, DH + 5.2, DH + 6.1, D1 - 0.8, D1, P.ochre, -0.4, 0.1);
        addBar(st, deckR, 'p', a, b, DH + 3.0, DH + 3.5, D1 - 0.7, D1 - 0.1, P.ochre, -0.4, 0.1);
        for (let p = a + 5; p < b - 2; p += 15) { addBar(st, deckR, 'h', DH, DH + 5.2, p - 0.45, p + 0.45, D1 - 0.8, D1, P.ochre, -0.4, 0.05); addBar(st, deckR, 'h', DH + 5.2, DH + 7.4, p - 0.6, p + 0.6, D1 - 0.9, D1 + 0.1, P.ink, 0, 0.04); } }
      { const pts = []; for (let m = 0; m <= 14; m++) pts.push([DA + (DB - DA) * m / 14, DH + 0.75 + deckR.range(-0.06, 0.06), D0 + 4.5 + deckR.range(-0.1, 0.1)]); deckLines.add(pts, 0.1, 0.4); }
      await ctx.yield();
      const lT = { robes: T3.robes, lines: deckLines, statics: st, heaps: deckHeaps };
      for (const o of [{ p: 37, q: D1 - 15, scale: 0.9, rot: -0.2, long: 0, gent: false, hairLen: 23, lift: DH },
        { p: -6, q: D1 - 6, scale: 0.5, rot: 0.4, long: 0, hairLen: 9, lift: DH },
        { p: 60, q: D1 - 10, scale: 0.5, rot: 0.25, long: 0, gent: false, hairLen: 9, lift: DH }]) { await person(lT, o, deckR); await ctx.yield(); }
      // a folding screen the gale threw flat on the mats, under the eye: shell-white panels with painted green hills, ruled in ink
      { const pw = 8.2, phh = 12.5, p0 = -34, q0 = D1 - 25, lo = [0.05, 0, 0, 0];
        const hillD = (c, p, q, h, rp, rq) => { const n = 12, c0 = st.v(p, h, q, p, q, c, null, lo); let last = -1;
          for (let i = 0; i <= n; i++) { const an = Math.PI * i / n, pp = p + Math.cos(an) * rp, qq = q + Math.sin(an) * rq, v = st.v(pp, h, qq, pp, qq, c, null, lo); if (last >= 0) st.tri(c0, last, v); last = v; } };
        for (let i = 0; i < 6; i++) { const a = p0 + i * pw, dq = (i % 2 ? 0.9 : -0.9) + deckR.range(-0.4, 0.4), jo = () => deckR.range(-0.12, 0.12);
          rect(st, P.white, a + 0.15, a + pw - 0.15, q0 + dq, q0 + dq + phh, DH + 0.5, 0.06);
          hillD(P.green, a + pw * deckR.range(0.3, 0.7), q0 + dq + 0.5, DH + 0.62, pw * deckR.range(0.3, 0.44), phh * deckR.range(0.35, 0.6));
          if (deckR.chance(0.6)) hillD(S.tint(P.green), a + pw * deckR.range(0.2, 0.8), q0 + dq + 0.5, DH + 0.7, pw * 0.22, phh * deckR.range(0.2, 0.3));
          deckLines.add([[a + 0.1 + jo(), DH + 0.8, q0 + dq + jo()], [a + pw - 0.1 + jo(), DH + 0.8, q0 + dq + jo()], [a + pw - 0.1 + jo(), DH + 0.8, q0 + dq + phh + jo()], [a + 0.1 + jo(), DH + 0.8, q0 + dq + phh + jo()], [a + 0.1 + jo(), DH + 0.8, q0 + dq + jo()]], 0.11, 0.3); } }
      const dl = season === 'autumn' ? [P.red, P.ochre, P.red, S.tint(P.red), P.ochre] : [P.white, S.tint(P.red), P.white];
      for (const [p, q, rp, rq] of [[6, D1 - 7, 8, 4.2], [22, D1 - 5.5, 6.5, 3.4], [-22, D1 - 6, 7, 3.6], [15, D1 - 16, 5.5, 3], [-44, D1 - 15, 7.5, 4]])      // drifts the gale heaped against the far rail
        for (let w = 0; w < 2; w++) T3.leaves.add([p, DH + 0.8 + w * 0.012, q], LEAF_FLOOR, rp, rq, dl[(w + Math.round(p + 60)) % dl.length], 0.66, 0.42);
      for (let i = 0; i < Math.round(40 * detail); i++) { const p = deckR.range(DA + 4, DB - 4), q = deckR.range(D0 + 2, D1 - 3), r = deckR.range(1.3, 2.8);
        T3.leaves.add([p, DH + 0.95 + 0.3 * ((i * 0.618) % 1), q], LEAF_FLOOR, r * 1.3, r * 1.04, deckR.pick(dl), 0.5, 0.42); }
    }
    await ctx.yield();


    // ---- movers: the page on the bridge, the lady's fan, the blind that rips free ----
    const pageT = { robes: makeAcc(), lines: makeLines(rng), statics: T2.statics, heaps: [] };
    await person(pageT, { p: 0, q: 0, scale: 0.5, rot: rng.range(-0.3, 0.3), segs: 48, gent: false });
    const fanAcc = makeAcc(), fanLines = makeLines(rng), fanHeap = T2.heaps[0];
    { const R = 10.5, n = 12, c0 = fanAcc.v(0, 0, 0, 0, 0, P.white); let last = -1;
      for (let i = 0; i <= n; i++) { const an = 0.35 + (Math.PI - 0.7) * i / n, r = R * (i % 2 ? 1 : 0.96), v = fanAcc.v(Math.cos(an) * r, Math.sin(an) * r, 0, Math.cos(an) * r, Math.sin(an) * r, P.white, null, [0.03, 0, 0, 0]);
        if (last >= 0) fanAcc.tri(c0, last, v); last = v;
        fanLines.add([[Math.cos(an) * 0.6, Math.sin(an) * 0.6, -0.1], [Math.cos(an) * R * 0.55, Math.sin(an) * R * 0.55, -0.1], [Math.cos(an) * R * 0.98, Math.sin(an) * R * 0.98, -0.1]], 0.08, 0.2); }
      const d0 = fanAcc.v(0.4, 6.2, -0.12, 0, 0, P.red); last = -1;
      for (let i = 0; i <= 12; i++) { const an = i / 12 * 6.28318, v = fanAcc.v(0.4 + Math.cos(an) * 2, 6.2 + Math.sin(an) * 2, -0.12, Math.cos(an), Math.sin(an), P.red); if (last >= 0) fanAcc.tri(d0, last, v); last = v; } }
    const tornAcc = makeAcc(), tornLines = makeLines(rng);
    // the blind that rips free: an opaque drawn thing, whole coat (no losses, so nothing of it reads as see-through): ochre reeds
    // between green bindings, a black head rail, two red-lead cords with tassels, an ink outline, one corner torn away
    { const W = 15, H = 12, lo = [-0.4, 0, 0, 0], cols = [[-W, -W + 1.6, P.green], [-W + 1.6, -0.7, P.ochre], [-0.7, 0.7, P.green], [0.7, W - 1.6, P.ochre], [W - 1.6, W, P.green]];
      const cut = (p, h) => (p + h * 0.9 > W + H * 0.35 ? [W + H * 0.35 - h * 0.9, h] : [p, h]), V = (p, h, c, z = 0) => tornAcc.v(p, h, z, p, h, c, null, lo);
      for (const [a, b, c] of cols) for (let j = 0; j < 6; j++) { const h0 = -H + 2 * H * j / 6, h1 = h0 + 2 * H / 6, A = cut(a, h0), B = cut(b, h0), Cc = cut(b, h1), D = cut(a, h1);
        tornAcc.quad(V(A[0], A[1], c), V(B[0], B[1], c), V(Cc[0], Cc[1], c), V(D[0], D[1], c)); }
      tornAcc.quad(V(-W, -H, P.green, -0.03), V(W, -H, P.green, -0.03), V(W, -H + 1.1, P.green, -0.03), V(-W, -H + 1.1, P.green, -0.03));      // the hem binding
      tornAcc.quad(V(-W - 1, H - 0.6, P.ink, -0.06), V(W - H * 0.55 - 1, H - 0.6, P.ink, -0.06), V(W - H * 0.55 - 1.6, H + 1.1, P.ink, -0.06), V(-W - 1, H + 1.1, P.ink, -0.06));   // the head rail, broken off short
      for (const cp of [-W * 0.52, W * 0.24]) {                    // cords: a red-lead band down the face, a knot, a tassel below the hem
        tornAcc.quad(V(cp - 0.55, -H - 1.5, P.red, -0.09), V(cp + 0.55, -H - 1.5, P.red, -0.09), V(cp + 0.55, H - 0.6, P.red, -0.09), V(cp - 0.55, H - 0.6, P.red, -0.09));
        tornAcc.quad(V(cp - 1.5, -H - 1.5, P.red, -0.12), V(cp, -H - 0.2, P.red, -0.12), V(cp + 1.5, -H - 1.5, P.red, -0.12), V(cp, -H - 6.5, P.red, -0.12));
        tornAcc.quad(V(cp - 1.3, H * 0.3, P.white, -0.12), V(cp, H * 0.3 - 1.2, P.white, -0.12), V(cp + 1.3, H * 0.3, P.white, -0.12), V(cp, H * 0.3 + 1.2, P.white, -0.12)); }
      const xr = (h) => Math.min(W, W + H * 0.35 - h * 0.9);
      for (const h of [-H + 4.4, -H + 8.6, -H + 12.8, -H + 17, -H + 21]) tornLines.add([[-W + 1.8, h, -0.1], [0, h + 0.1, -0.1], [xr(h) - 1.8, h, -0.1]], 0.1, 0.1, 4.2);
      tornLines.add([[-W, H, -0.14], [-W - 0.1, 0, -0.14], [-W, -H, -0.14], [0, -H - 0.1, -0.14], [W, -H, -0.14], [W + 0.1, -2, -0.14], [xr(H * 0.42), H * 0.42, -0.14], [xr(H), H, -0.14]], 0.16, 0.2);
      tornLines.add([[-W + 1.6, -H + 1.1, -0.14], [-W + 1.7, 0, -0.14], [-W + 1.6, H - 0.6, -0.14]], 0.1, 0.2); }
    // What makes it a blind torn away by the wind and not a panel standing in the air (all from a generator of its own):
    // the reeds ruled close, its torn cords streaming behind it, and chips of its ochre and green going on ahead of it.
    const xr = makeRng(hashSeed('gale-blind:' + (ctx.seed || 0))), tornLines2 = makeLines(xr), cordAcc = makeAcc(), cordLines = makeLines(xr), chipAcc = [makeAcc(), makeAcc()];
    { const W = 15, H = 12, xe = (h) => Math.min(W, W + H * 0.35 - h * 0.9);
      for (let j = 0; j < 11; j++) { const h = -H + 2.3 + j * 2.1; if (j % 2) tornLines2.add([[-W + 1.8, h, -0.1], [0, h + 0.1, -0.1], [xe(h) - 1.8, h, -0.1]], 0.09, 0.1, 4.2); }
      // cords: red-lead ribbons trailing to the low side and back toward us, each ending in a tassel; world (X to the low side, Y up, Z on) -> palace
      const W2 = (X, Y, Z) => { const p = -X / 0.82; return [p, Y - 0.57 * p, Z]; };
      for (const [y0, len, amp, ph] of [[9, 34, 3.2, 0.4], [1, 27, 2.6, 2.3], [-8, 31, 3.4, 4.4]]) { let pr = null; const mid = [];
        for (let j = 0; j <= 12; j++) { const f = j / 12, X = 3 + len * f, Y = y0 + amp * Math.sin(f * 7 + ph) * (0.25 + f) - 5 * f * f, Z = 0.5 + 5 * f, tw = 0.62 * (1 - 0.35 * f);
          const A = W2(X, Y + tw, Z), B = W2(X, Y - tw, Z), row = [cordAcc.v(A[0], A[1], A[2], X, Y + tw, P.red, null, [-0.4, 0, 0, 0]), cordAcc.v(B[0], B[1], B[2], X, Y - tw, P.red, null, [-0.4, 0, 0, 0])];
          if (pr) cordAcc.quad(pr[0], pr[1], row[1], row[0]); pr = row; mid.push(W2(X, Y + tw + 0.1, Z - 0.1)); }
        cordLines.add(mid, 0.1, 0.2);
        const X = 3 + len, Y = y0 + amp * Math.sin(7 + ph) * 1.25 - 5, Z = 5.5, T = [[X - 0.5, Y + 1.5], [X + 1.6, Y], [X - 0.5, Y - 1.5], [X + 5.5, Y - 0.6]].map((v) => W2(v[0], v[1], Z));
        cordAcc.quad(...[T[0], T[1], T[3], T[2]].map((v) => cordAcc.v(v[0], v[1], v[2], v[0], v[1], y0 === 1 ? P.white : P.red, null, [-0.4, 0, 0, 0]))); }
      for (let g = 0; g < 2; g++) for (let i = 0; i < 11; i++) { const t = (i + xr()) / 11, r = 2 + 9 * t, an = xr() * 6.28, sz = xr.range(0.9, 2.1) * (xr.chance(0.2) ? 1.5 : 1), a0 = xr() * 6.28;
          const cx = Math.cos(an) * r - 7 * t, cy = Math.sin(an) * r * 0.7 + 5 * t, cz = 10 * t, c = xr.pick([P.ochre, P.ochre, P.green, P.ochre, P.white]), vs = [];
          for (let m = 0; m < 4; m++) { const a = a0 + m * 1.5708 + xr.range(-0.3, 0.3), A = W2(cx + Math.cos(a) * sz, cy + Math.sin(a) * sz * 0.8, cz); vs.push(chipAcc[g].v(A[0], A[1], A[2], cx, cy, c, null, [-0.4, 0, 0, 0])); }
          chipAcc[g].quad(vs[0], vs[1], vs[2], vs[3]); } }
    // a panel of a curtain of state that the third gust tears off its stand: it goes ahead of us down the north room to the mirror
    const flyAcc = makeAcc(), flyLines = makeLines(rng);
    { const W = 11, H = 15, lo = [0.05, 0, 0, 0], V = (p, h, c, z = 0) => flyAcc.v(p, h, z, p, h, c, null, lo);
      flyAcc.quad(V(-W - 2, H, P.ink, 0.1), V(W + 2, H, P.ink, 0.1), V(W + 2, H + 1.3, P.ink, 0.1), V(-W - 2, H + 1.3, P.ink, 0.1));
      for (let k = 0; k < 3; k++) { const a = -W + k * (2 * W / 3) + 0.25, b = a + 2 * W / 3 - 0.5, h0 = -H + rng.range(0, 2.5), h1 = -H + rng.range(0, 2.5), cp = (a + b) / 2;
        flyAcc.quad(V(a, h0, P.red), V(b, h1, P.red), V(b, H, P.red), V(a, H, P.red));
        flyLines.add([[a, H, -0.1], [a + rng.range(-0.15, 0.15), 0, -0.1], [a, h0, -0.1], [b, h1, -0.1], [b + rng.range(-0.15, 0.15), 0, -0.1], [b, H, -0.1]], 0.1, 0.2);
        for (let m = 0; m < 3; m++) { const ch = H - 5 - m * 9 + (k % 2 ? 4 : 0), rr = rng.range(1.7, 2.1), c0 = V(cp, ch, P.white, -0.12); let last = -1;
          for (let i = 0; i <= 10; i++) { const an = i / 10 * 6.28318, v = V(cp + Math.cos(an) * rr, ch + Math.sin(an) * rr, P.white, -0.12); if (last >= 0) flyAcc.tri(c0, last, v); last = v; } }
        let pr = null; const ph = rng() * 6.28, rl = rng.range(30, 40);                 // the ribbon, trailing behind and below
        for (let j = 0; j <= 10; j++) { const f = j / 10, h = H - rl * f, dx = 2.4 * Math.sin(f * 5 + ph) * f - 5 * f * f, tw = 0.85 * (1 - 0.3 * f);
          const row = [V(cp + dx - tw, h, P.purple, -0.25 - f), V(cp + dx + tw, h, P.purple, -0.25 - f)]; if (pr) flyAcc.quad(pr[0], pr[1], row[1], row[0]); pr = row; } } }
    await ctx.yield();

    // ---- meshes: every material is made here and is on screen from the first frame ----
    await ctx.yield();
    const mStat = S.coatMaterial({ under: [0, 0, 0, 0] }), mPlank = S.coatMaterial({ plank: true, under: [0, 3.3, 0, 0.5], chip: 2.6 });
    const mBlind = S.coatMaterial({ anim: 1, blind: true, under: [0, 4.5, 0, 0.7], chip: 2.8 }), mCloth = S.coatMaterial({ anim: 2, under: [5.2, 0, 0.8, 0], chip: 2.2 });
    const mRobe = S.coatMaterial({ anim: 3, under: [0, 1.1, 0, 0.55], chip: 1.9, crackle: 0.42 }), mLine = contourMaterial(S), mFlake = flakeMaterial(S);
    const mFloor = tiers.map(() => S.coatMaterial({ floor: true, under: [0, 13.5, 0, 0.7], chip: 3.2 }));
    const mGarden = S.coatMaterial({ under: [0, 13.5, 0, 0.7], chip: 3.2 });
    const mGrass = grassMaterial(S, season === 'autumn' ? P.purple : P.white), mMist = flatMaterial(S, P.paper);
    const mk = (parent, geo, mat, order = 0) => { const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = order; parent.add(m); return m; };
    // the mist of bare paper: one lobe with a slow-curved lower edge, standing over the port end of each wall line
    const mistGeo = new THREE.BufferGeometry();
    { const pos = [], idx = [], n = 18; for (let i = 0; i <= n; i++) { const p = -560 + 400 * i / n, f = smoothstep(-500, -160, p);
        pos.push(p, Math.min(760, 22 + 740 * f * f * f + 5 * Math.sin(p * 0.021)), 0, p, 760, 0); if (i) { const k = i * 2; idx.push(k - 2, k - 1, k + 1, k - 2, k + 1, k); } }
      mistGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mistGeo.setIndex(idx); mistGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); }
    // the inner hall's lobe is the wide one: it stands just behind the bridge and its pines, from the low end of the wall to a
    // little past the line we fly, its lower edge one slow curve at lintel height, so the far rooms show only through the bays
    const mist2Geo = new THREE.BufferGeometry();
    { const pos = [], idx = [], E = [[-700, 8], [-330, 9], [-250, 13], [-190, 22], [-140, 33], [-95, 42], [-60, 46.5], [-36, 48.5], [-14, 53], [8, 63], [28, 83], [44, 117], [58, 171], [70, 261], [80, 400], [88, 760]].map((e) => [e[0] - 270, e[1]]);
      E.forEach(([p, h], i) => { pos.push(p, h, 9, p, 760, 9); if (i) { const k = i * 2; idx.push(k - 2, k - 1, k + 1, k - 2, k + 1, k); } });
      mist2Geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); mist2Geo.setIndex(idx); mist2Geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5); }
    const mLeaf = leafMaterial(S, season === 'autumn' ? 0.62 : 0);            // maple stars in autumn; petals and snow are plain ovals
    for (const T of tiers) {
      if (T.leaves.count) mk(T.g, T.leaves.build(), mLeaf);
      mk(T.g, await T.floor.buildAsync(ctx.yield), mFloor[T.k]); await ctx.yield(); mk(T.g, await T.statics.buildAsync(ctx.yield), mStat);
      await ctx.yield();
      if (T.planks.count) mk(T.g, await T.planks.buildAsync(ctx.yield), mPlank);
      await ctx.yield();
      mk(T.g, await T.blinds.buildAsync(ctx.yield), mBlind);
      await ctx.yield();
      if (T.cloth.count) mk(T.g, await T.cloth.buildAsync(ctx.yield), mCloth);
      await ctx.yield();
      mk(T.g, await T.robes.buildAsync(ctx.yield), mRobe);
      await ctx.yield();
      await ctx.yield();
      mk(T.g, await T.lines.buildAsync(ctx.yield), mLine, 2);
      await ctx.yield();
      mk(T.g, flakeGeos[T.k], mFlake, 3);
      if (T.k === 1) { mk(T.g, mist2Geo, mMist, 1); mk(T.g, await lobeLines.buildAsync(ctx.yield), mLine, 2); }
      const mist = mk(T.g, mistGeo, mMist, 1); mist.position.z = T.k === 2 ? 24 : -3.5; { const D = T.k === 2 ? 180 : T.k === 1 ? 120 : 0; mist.position.x = hand * 0.82 * D; mist.position.y = -0.57 * D; }   // the further lobes stand further to port (moved along the beam direction)
      await ctx.yield();
    }
    mk(T3.g, await mossAcc.buildAsync(ctx.yield), mGarden); await ctx.yield(); const gardenMesh = mk(T3.g, await gardenAcc.buildAsync(ctx.yield), mStat); mk(T3.g, xLines3.build(), mLine, 2); mk(T3.g, deckLines.build(), mLine, 2); mk(T3.g, deckFloor.build(), S.coatMaterial({ floor: true, under: [0, 13.5, 0, 0.7], chip: 3.2 })); await ctx.yield(); mk(T3.g, faceGeo, mFace, 1);
    mk(T1.g, grassGeometry(gO, gG, NG), mGrass, 1); mk(T2.g, sprays[0], mGrass, 1); mk(T3.g, sprays[1], mGrass, 1);
    await ctx.yield();
    const pageG = new THREE.Group(); T2.g.add(pageG); mk(pageG, await pageT.robes.buildAsync(ctx.yield), mRobe); mk(pageG, await pageT.lines.buildAsync(ctx.yield), mLine, 2);
    const fanG = new THREE.Group(); T2.g.add(fanG); mk(fanG, fanAcc.build(), mStat); mk(fanG, fanLines.build(), mLine, 2);
    await ctx.yield();
    const tornG = new THREE.Group(); scene.add(tornG); mk(tornG, tornAcc.build(), mStat); mk(tornG, tornLines.build(), mLine, 2);
    mk(tornG, tornLines2.build(), mLine, 2); tornG.scale.setScalar(0.001); tornG.position.set(hand * 12, 14, 252);
    const cordG = new THREE.Group(); scene.add(cordG); mk(cordG, cordAcc.build(), mStat); mk(cordG, cordLines.build(), mLine, 2); cordG.scale.setScalar(0.001); cordG.position.copy(tornG.position);
    const chipG = chipAcc.map((a) => { const g = new THREE.Group(); scene.add(g); mk(g, a.build(), mStat); g.scale.setScalar(0.001); g.position.copy(tornG.position); return g; });
    const TB = [5.4, 1.9, 30, 0.2];         // the flying blind: metres to the low side, above the eye and ahead of it; scale (30 by 24 m built)
    const flyG = new THREE.Group(); scene.add(flyG); mk(flyG, flyAcc.build(), mStat); mk(flyG, flyLines.build(), mLine, 2); flyG.scale.setScalar(0.001); flyG.position.set(hand * 30, -20, 990);
    let mRare = null;
    if (rareGeo) { mRare = flakeMaterial(S); mRare.uniforms.uFronts = { value: new THREE.Vector3(-1e5, -1e5, -1e5) }; mk(T3.g, rareGeo, mRare, 3); }
    await ctx.yield();

    const lerp = (a, b, t) => a + (b - a) * t, fanTop = fanHeap ? fanHeap.heap.top : 20;
    // quick over the garden, slow through the sleeve room (where the hero wall slides up fast), steady from the bridge on
    const pace = (u) => 1.4 + 0.1 * smoothstep(0.14, 0.18, u) - 0.95 * smoothstep(0.22, 0.26, u) + 0.15 * smoothstep(0.31, 0.36, u) + 0.3 * smoothstep(0.56, 0.62, u);
    return {
      scene, path, duration: 40, pace,
      camera: { fov: 28, near: 0.5, far: 3000, lookAhead: 40, sway: 0, bank: 0 },
      pois: [],
      portal: { shape: 'circle', radius: 7, color: '#EFEAD9', glow: 0.2, revealDistance: 700, frame: 0, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        hero.setProgress(u); hero.update(dt, time, camera);
        // the three drops: each tier is slid along the course so that the eye stands at zv_k(u) in that tier's own frame
        const zc = LEN * u, z1 = ZV[0](u), z2 = ZV[1](u), z3 = 810 - LEN * (1 - u), o2 = zc - z2;
        T1.g.position.z = TZ[0] + zc - z1; hero.object.position.z = hero.anchors.place.z + zc - z1; T2.g.position.z = TZ[1] + o2;
        U.uFronts.value.set(zc + 810 * (u - C_FRONT[0]), zc + 810 * (u - C_FRONT[1]), zc + 810 * (u - C_FRONT[2]));     // the gusts overtake the eye at u = c and run on ahead
        const v1 = z1 < 300; T1.g.visible = v1; hero.object.visible = v1; T2.g.visible = z2 < 600;
        // the page runs the bridge planks, crossing under the line we fly
        const f = clamp((z2 - 300) / 215, 0, 1), pp = -52 + 67 * f, run = f > 0 && f < 1 ? 1 : 0;
        pageG.position.set(-hand * 0.82 * pp, 1.45 + 0.57 * pp + 0.58 * 6 + run * 0.9 * Math.abs(Math.sin(f * 60)), 6);
        // the lady's fan comes up behind her head
        const ff = smoothstep(190, 330, z2), fh = lerp(-4, fanTop - 7, ff) + 0.35 * ff * Math.sin(time * 2.6), fq = fanAt.q + 4.5;
        fanG.position.set(-hand * 0.82 * (fanAt.p + 10), fh + 0.57 * (fanAt.p + 10) + 0.58 * fq, fq);
        // the blind that rips free beside us at the threshold (u 0.31): it comes in over our shoulder on the low side and tumbles on
        // ahead, clear of the court, for a third of the flight, two full turns in all, its cords streaming and its paint going on
        // before it, and is wrapped round the bridge post on the low side as we come to it. All of it keyed to u.
        { const tb = smoothstep(0.298, 0.305, u), out = smoothstep(0.305, 0.34, u), tw = smoothstep(0.535, 0.588, u), A = (u - 0.31) * 46, live = u < 0.64 ? 1 : 0;
          const fx = hand * (lerp(9, TB[0], out) + 1.3 * Math.sin(A * 0.55)), fy = lerp(8, TB[1], out) + 1.2 * Math.sin(A * 0.8), fz = zc + lerp(4, TB[2], out) + 3 * Math.sin(A * 0.37);
          const px = hand * 0.82 * 27 - hand * 1.2, py = -10 + 27 - 0.57 * 27, pz = T2.g.position.z - 1.7, k = Math.max(0.001, TB[3] * tb * live);
          tornG.position.set(lerp(fx, px, tw), lerp(fy, py, tw), lerp(fz, pz, tw));
          tornG.rotation.set((1 - tw) * 0.42 * Math.sin(A) + 0.04 * Math.sin(time * 1.9), (1 - tw) * 0.45 * Math.sin(A * 0.7 + 1), hand * 12.566 * clamp((u - 0.31) / 0.278, 0, 1) + hand * 0.12 * tw);
          tornG.scale.set(k * lerp(1, 0.4, tw), k * lerp(1, 1.25, tw), k);
          cordG.position.copy(tornG.position); cordG.scale.set(k * lerp(1, 0.55, tw), k, k); cordG.rotation.z = hand * (0.16 * Math.sin(time * 2.7) + 0.2 * Math.sin(A * 1.3) - 0.5 * tw);
          for (let g = 0; g < 2; g++) { const ph = (time * 0.42 + g * 0.5) % 1, e = 1 - ph * ph * ph, d = 2 + 8 * ph;
            chipG[g].position.set(tornG.position.x - hand * 0.55 * d, tornG.position.y + 0.4 * d, tornG.position.z + d);
            chipG[g].scale.set(k * (0.5 + ph) * e, k * (0.5 + ph) * e, k); chipG[g].rotation.z = hand * (0.5 * ph + g); } }
        // the curtain panel torn off by the third gust: ahead of us and to the low side, closing on the mirror
        const s3 = clamp((u - 0.74) / 0.22, 0, 1), A3 = s3 * 10, k3 = Math.max(0.001, 0.62 * smoothstep(0.74, 0.78, u) * (1 - 0.5 * smoothstep(0.93, 1, u)));
        flyG.position.set(hand * (lerp(31, 14, s3) + 3 * Math.sin(A3 * 0.7)), lerp(-21, -8, s3) + 2.5 * Math.sin(A3 * 1.3), Math.min(806, z3 + lerp(150, 36, s3)) + LEN - 810);
        flyG.position.x += hand * 6.5;      // its whole flight lies 6.5 m wide of the lady by the mirror, never across her
        flyG.rotation.set(0.45 * Math.sin(A3) + 0.06 * Math.sin(time * 1.7), 0.5 * Math.sin(A3 * 0.6 + 1), 0.3 * Math.sin(A3 * 0.8) + hand * 0.25);
        flyG.scale.setScalar(k3);
        // the rare event: the north room's whole green coat lets go at the second drop
        mFace.uniforms.uOpen.value = 0.085 * smoothstep(0.72, 0.9, u) + 1.25 * smoothstep(0.95, 0.992, u);
        if (rare) { const strip = clamp((u - 0.60) / 0.2, 0, 1); mFloor[2].uniforms.uStrip.value = strip; mGarden.uniforms.uStrip.value = strip; if (mRare) mRare.uniforms.uFronts.value.x = strip > 0 ? strip * 1150 : -1e5; }
      },
      dispose() {},
    };
  },
};
