// SLIPWAY BLOSSOM hero: "The launch, seen from where no one stands".
// A 240 m riveted liner hull on a 3 degree timber slip between two rows of lattice gantries, with her whole
// launch as one progress-driven machine: wedges drop, 600 shores topple in a wave, the hull slides to the sea
// on smoking ways, plunges, lifts, curtsies and floats, snatching six chain piles after her in rust, while
// five-colour tapes part at the bow, a paper ball splits and confetti falls.
//
// FRAMES
//   brief frame  X north up the slip, Y up, Z east, water y = 0, waterline x = 0 (the brief's "space").
//   local frame  (default) origin on the water plane under the middle of the slip, +Z = toward the water (front:
//                the stern and propellers face +Z), +X = east.  local = (briefZ, briefY, 115 - briefX).
//                To seat it in the brief frame: object.position.set(115, 0, 0); object.rotation.y = -Math.PI / 2;
//   opts.frame = 'brief' builds object and anchors directly in the brief frame instead (no transform needed).
//   slip x -40..270 (y = x * tan 3deg, 60 m wide), hull stern x 10, bow x 250, keel 10 m off the timber, rail +30;
//   ways z = +-7, nave 12 m wide and 10 m high; gantry rows z = +-26, towers every 40 m x 30..270, 55 m tall;
//   chain piles z = +-19, x = 70, 150, 230.
//
// OPTS
//   palette   7 hex strings (brief palette): [red oxide, dove grey, blossom pink, steel slate, bronze/timber,
//             harbour teal, haze blue]
//   frame     'local' (default) | 'brief'
//   livery    'dove' | 'black' | 'mail' (default: picked by seed, dove most often)
//   tapes     'five' | 'redwhite' (default by seed)
//   fill      0.6: built-in sky/bounce fill (albedo * cool blue from above, warm red kick from below) added as
//             emissive so the steel ceiling and shade flank never go dead; 0 if the world's lights do it all
//   wake      true: foam sheet at y = 0.12 over the water south of the slip (stern white water, the launch wave
//             ring, the hull's foam collar and the wake off her stem). Pass false if the world draws its own.
//   reflection true: the floating hull's image on the water (a second draw of the shell, only once she is in the water)
//   caustics  1: strength of the water light that ripples on the bottom plating and the wet foot of the slip (time-driven)
//   swing     1 | -1: which way the stern drifts once she floats (brief +Z east, or west), so the hull shows past the portal
//   sun       [x,y,z] direction TO the sun in the frame in use (default east-south-east, 24 deg up) used only by
//             the unlit smoke, dust, ribbons and confetti; hero.setSun(dir, colour) changes it later.
//
// PROGRESS (never wall-clock)
//   hero.setProgress(u)   u = 0..1 of the journey (the fly-through below, 733 m). Everything reads the launch clock: slide
//                         s(u) (0 m at .16, 50 at .334, 62 at .60, 112 at .70, 188 at .754, 240 at .784, 312 at .845,
//                         360 at 1: she is held high on the ways while the camera loops out over the east yard, and runs as
//                         it comes back at her flank, u .64-.75, close alongside), wedges at .09, the shore wave from .12,
//                         ball and confetti at .33, chain piles at slides of 95, 115, 128, 140, 160 and 225 m, the stern
//                         plunge at .72-.78, bow drop at .80-.83, stem through the portal's place at .845. u = 0: still, tapes taut.
//   hero.slideAt(u) -> s; hero.hullState(u) -> { s, sternX, sternY, bowX, bowY, pitch, speed } (brief frame);
//   hero.waveAt(u) -> { x, z, radius, height } of the launch wave ring (brief frame) for rocking boats.
//   Until setProgress is first called the clock stays at 0.
//   hero.pointOnHull(u, hx, hy, hz, outVector3) -> a point of the moving hull without allocating (for camera pois);
//   hero.setTone({ amb, fill, kick }) retints the built-in ambient terms for other hours and weather.
//   Time only drives ambient loops (cloth flutter, smoke churn, hoists creeping, the floating hull's slow rock).
//
// ANCHORS (in the frame in use; arrays [x,y,z])
//   portalSeat   { position, normal }: where her stem leaves the ways, brief (-58, 13, 0); the world hangs its 14 m ring 22 m to one side
//                of this, on the side away from her swing, so the ring stands beside her bow and never in it (18 m behind the
//                entry plane, so it is not in the picture when this world is seen through the previous portal)
//   flyThrough   entry, under the propellers, up the nave (4.5 m over the timber, 5.5 m under the keel: the brief's
//                own clearance), out under the bow, between east towers x 230 / 270, one right-hand loop of 52 m
//                radius over the east yard about (211,52), back south-west at her flank as she runs (the close pass),
//                in between east towers x 110 / 150 behind her bow, and down the centreline after her to the portal
//   entry, naveStart, naveEnd, turnCentre, straightStart   named points of that line
//   hullPoi(u)   function -> point on the moving hull to lead the gaze (midships, half-way up)
//   bowTip(u), sternTip(u)   functions -> moving stem head and counter (for doves, tugs, the floating view)
//   doveBaskets  two points beside the bow at rest; launchStand: centre of the stand site at the slip head
//   gantryTops   14 tower heads; chainPiles: 6 pile centres; viewpoints: entry, quarter (her flank from over the
//                east yard at u .62), cradle (where the flight comes in behind her bow)
//
// SIZE  radius 100 is a viewing radius (the slip is 310 m long, the hull 240 m; hero.extent = 165), height 70.  COST about 102k triangles, 18 draw calls, build about 200 ms,
// no lights. LIGHTING: MeshStandardMaterials (patched) that cast and receive the world's one slip-fitted shadow
// map: a low warm sun from the east (brief +Z, local +X) gives the bars under the hull and lights the east
// flank; cool hemisphere fill. Fog supported everywhere.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const DEFAULT_PALETTE = ['#8E3B2A', '#AEB4B8', '#F2B8C9', '#5C646C', '#C49A5A', '#2E6E78', '#CFE6F5'];
const PI = Math.PI, TAU = PI * 2, K = Math.tan(3 * PI / 180), HL = 240, GAP = 10;
const sat = (x) => Math.min(1, Math.max(0, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const slipY = (x) => Math.min(x, 270) * K;

// monotone cubic table (Fritsch-Carlson), flat beyond both ends
function table(xs, ys) {
  const n = xs.length, d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m.push(d[0]);
  for (let i = 1; i < n - 1; i++) m.push(d[i - 1] * d[i] <= 0 ? 0 : 2 * d[i - 1] * d[i] / (d[i - 1] + d[i]));
  m.push(d[n - 2]);
  return (x) => {
    if (x <= xs[0]) return ys[0]; if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}
// the launch clock: slide distance of u, and the keel height of stern and bow against slide distance
// E: the fly-through is 733.3 m, the brief's was 980, so everything that happens while the camera is under her comes that much later
// in u. She starts as we fly beneath her (u 0.16-0.334), then only creeps while the camera loops out over the east yard, so that when
// it comes back at her from the north-east (0.58 on) she is still high on the ways, broadside on and whole; she runs from 0.64, past
// the camera while it closes from 70 m to 30 m (it flies slowly here: her whole length goes by), her bow sweeps across ahead and the
// camera comes in between two east towers behind it (0.73-0.80); she plunges at about 0.72-0.78, drops her bow at 0.80-0.83 and her
// stem clears the portal's place (x = -58) at about 0.845; then she
// swings clear of the ring and slows. The table is laid out in metres of flight (LEN) so that it can be read against the path.
const LEN = 733.3, E = 980 / LEN;
const slideOf = table([0, 117.6, 245, 340, 440, 470, 490, 513, 535, 553, 575, 600, 620, 655, LEN].map((d) => d / LEN), [0, 0, 50, 56, 62, 66, 80, 112, 150, 188, 240, 290, 312, 337, 360]);
const sternYOf = table([0, 100, 150, 185, 225, 265, 300, 390], [GAP + 10 * K, GAP - 90 * K, 2.2, -9.5, -4.6, -6.6, -7.3, -7.5]);
const bowYOf = table([0, 100, 185, 225, 262, 284, 304, 335, 390], [GAP + 250 * K, GAP + 150 * K, GAP + 65 * K, GAP + 25 * K, 9.2, -12, -5.2, -8.3, -7.5]);
// the slide at which each pile goes (same order as PILES): the east pile amidships first, in front of the camera as it comes back at
// her flank; the west one behind it as her bow uncovers it; the last, low on the west side, just below the camera as it follows her down
const CHAIN_S = [160, 225, 95, 140, 128, 115];
const PILES = [[70, 19], [70, -19], [150, 19], [150, -19], [230, 19], [230, -19]];

// ---------- hull form: station t = 0 (counter) .. 1 (stem head), w = 0 (keel) .. 1 (rail) ----------
function station(t) {
  const aft = sat(t / 0.2), fore = sat((t - 0.6) / 0.4);
  const zDeck = 14 * Math.min(Math.pow(1 - Math.pow(1 - aft, 2.4), 0.55), Math.pow(1 - Math.pow(fore, 2.2), 0.8));
  const fa = sstep(0.035, 0.335, t), ff = sat((t - 0.5) / 0.48);
  const zW = Math.max(t < 0.5 ? 0.3 : 0.22, 14 * Math.min(Math.pow(fa, 1.1), 1 - ff * ff));
  const yR = 30 + 3.5 * Math.pow(Math.max(0, (t - 0.6) / 0.4), 2) + 1.5 * Math.pow(Math.max(0, (0.3 - t) / 0.3), 2);
  let yK = 21.5 * (1 - sstep(0.036, 0.048, t)) + (t < 0.04 ? 4 * (1 - t / 0.04) : 0);
  if (t > 0.968) yK = yR * Math.pow((t - 0.968) / 0.032, 2);
  const end = Math.max(1 - sstep(0.05, 0.32, t), sstep(0.6, 0.97, t));
  const counter = 1 - sstep(0.03, 0.05, t);
  const zW2 = Math.max(zW, zDeck * 0.86 * counter);
  const hb = lerp(Math.min(lerp(3.2, 22, end), (yR - yK) * 0.8), (yR - yK) * 0.72, counter), es = lerp(lerp(0.22, 0.9, end), 0.5, counter), pf = lerp(lerp(1, 2.6, end), 1.3, counter);
  return { zDeck, zW: zW2, yR, yK, hb, es, pf };
}
function hullPt(st, w, out) {       // -> [hy, hz] on the starboard (+z) side
  if (w < 0.5) {
    const a = w * PI;
    out[0] = st.yK + st.hb * (1 - Math.pow(Math.max(0, Math.cos(a)), st.es)); out[1] = st.zW * Math.pow(Math.sin(a), st.es);
  } else {
    const f = (w - 0.5) * 2;
    out[0] = lerp(st.yK + st.hb, st.yR, f); out[1] = st.zW + (st.zDeck - st.zW) * Math.pow(f, st.pf);
  }
  return out;
}
// half breadth of the hull at station t and height hy (0 if the hull is not there)
function halfBreadth(t, hy) {
  const st = station(t), p = [0, 0];
  if (hy < st.yK || hy > st.yR) return 0;
  let lo = 0, hi = 1;
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; hullPt(st, mid, p); if (p[0] < hy) lo = mid; else hi = mid; }
  return hullPt(st, (lo + hi) / 2, p)[1];
}
// height on the hull bottom where the half breadth first reaches z (for cradle posts); -1 if never
function bottomAt(t, z) {
  const st = station(t), p = [0, 0];
  if (st.zW < z) return -1;
  let lo = 0, hi = 0.5;
  for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; hullPt(st, mid, p); if (p[1] < z) lo = mid; else hi = mid; }
  return hullPt(st, (lo + hi) / 2, p)[0];
}

// `pause` is the build's yield (ctx.yield), taken before the normals are worked out
async function buildHullGeometry(pause) {
  const ts = [];
  for (let i = 0; i <= 96; i++) { const u = i / 96; ts.push(u); }
  for (const e of [0.004, 0.012, 0.034, 0.038, 0.041, 0.044, 0.047, 0.05, 0.972, 0.976, 0.981, 0.986, 0.993, 0.997]) ts.push(e);
  ts.sort((a, b) => a - b);
  const NW = 18, ring = NW * 2 + 1, pos = [], uv = [], idx = [], p = [0, 0];
  for (let i = 0; i < ts.length; i++) {
    const st = station(ts[i]); let girth = 0, py = st.yK, pz = 0; const half = [];
    for (let j = 0; j <= NW; j++) {
      const w = j / NW; hullPt(st, w, p);
      const y = p[0];
      girth += Math.hypot(y - py, p[1] - pz); py = y; pz = p[1]; half.push([y, p[1], girth]);
    }
    for (let j = -NW; j <= NW; j++) { const h = half[Math.abs(j)]; pos.push(ts[i] * HL, h[0], Math.sign(j) * h[1]); uv.push(ts[i] * HL, h[2]); }
  }
  for (let i = 0; i < ts.length - 1; i++) for (let j = 0; j < ring - 1; j++) {
    const a = i * ring + j, b = a + ring; idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  await pause();
  g.computeVertexNormals();
  return g;
}

// ---------- materials: MeshStandardMaterial patched so the world's lights, shadow map and fog all apply ----------
const GLSL_NOISE = `
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;
// `name`: one stable program key per kind of material, so two visits of this world share their shader programs
function stdMat(params, U, P = {}, name = 'plain') {
  const mat = new THREE.MeshStandardMaterial(params), key = 'slipway-' + name;
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U, P.uniforms || {});
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vOp; varying vec2 vHuv;\n' + (P.vHead || ''))
      .replace('#include <beginnormal_vertex>', P.vNormal || '#include <beginnormal_vertex>')
      .replace('#include <begin_vertex>', (P.vBegin || '#include <begin_vertex>') + '\nvOp = transformed; vHuv = uv;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uFill; uniform vec3 uKick; uniform vec3 uBounceV; varying vec3 vOp; varying vec2 vHuv;\n' + GLSL_NOISE + (P.fHead || ''))
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + (P.fColor || ''))
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + (P.fRough || ''))
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + (P.fNormal || ''))
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n{ float up_ = dot(normal, viewMatrix[1].xyz); float bn_ = max(0., dot(normal, uBounceV)); totalEmissiveRadiance += diffuseColor.rgb * mix(uKick * (0.3 + 1.3 * bn_) + uFill * 0.5, uFill, smoothstep(-0.6, 0.5, up_)); }\n' + (P.fEmis || ''));
  };
  mat.customProgramCacheKey = () => key;
  return mat;
}
// bump from a height value hgt (metres) computed in fColor; strength fades with distance
const BUMP = `{ vec3 sx_ = dFdx(vViewPosition), sy_ = dFdy(vViewPosition); vec3 r1_ = cross(sy_, normal), r2_ = cross(normal, sx_);
  float det_ = dot(sx_, r1_); vec3 g_ = sign(det_) * (dFdx(hgt) * r1_ + dFdy(hgt) * r2_);
  normal = normalize(abs(det_) * normal - g_ * bumpK + normal * 1e-7); }`;

function hullMaterial(U, liv, caust = 1) {
  return stdMat({ color: 0xffffff, roughness: 0.6, metalness: 0.25 }, U, {
    uniforms: { uBot: { value: liv.bot }, uTop: { value: liv.top }, uBoot: { value: liv.boot }, uSheer: { value: liv.sheer },
      uLine: { value: new THREE.Vector4(liv.paintY, liv.bootW, liv.sheerW, liv.rust) }, uCaust: { value: caust } },
    fHead: `uniform vec3 uBot, uTop, uBoot, uSheer, uHullPos, uSunCol, uAmb, uSunV; uniform vec4 uLine; uniform float uTime, uCaust; float hgt; float bumpK;
      float portRow(float x, float y, float ax, float ay){ float r = 0.3;
        float disc = 1. - smoothstep(r - ax - ay, r + ax + ay, length(vec2(x, y)));
        float bar = (1. - smoothstep(r - ay, r + ay, abs(y))) * mix(1. - smoothstep(r - ax, r + ax, abs(x)), 0.34, smoothstep(0.5, 1.6, ax)) * min(1., 0.45 / ay);
        return mix(disc, bar, smoothstep(0.12, 0.35, ax)); }
      float rivD(float along, float across, float pitch){ float a = (fract(along / pitch) - 0.5) * pitch; return sqrt(a * a + across * across); }`,
    fColor: `{
      float dist = length(vViewPosition), fadeN = 1. - smoothstep(26., 80., dist), fadeM = 1. - smoothstep(150., 420., dist);
      float gir = vHuv.y, k = floor(gir / 2.4), sv = fract(gir / 2.4) * 2.4;
      float px = vHuv.x + h21(vec2(k, 3.7)) * 9.6, pid = floor(px / 9.6), bx = fract(px / 9.6) * 9.6;
      float aa = clamp(fwidth(vHuv.x) + fwidth(gir), 0.002, 0.4) * 0.9;
      float rnd = h21(vec2(pid, k));
      float sheerY = 30. + 3.5 * pow(max(0., (vOp.x / 240. - 0.6) / 0.4), 2.) + 1.5 * pow(max(0., (0.3 - vOp.x / 240.) / 0.3), 2.);
      float fy = fwidth(vOp.y) + 1e-4;
      float above = smoothstep(-fy, fy, vOp.y - uLine.x), below = 1. - above;
      vec3 col = mix(uBot, uTop, above);
      float boot = smoothstep(-fy, fy, vOp.y - uLine.x) * (1. - smoothstep(-fy, fy, vOp.y - uLine.x - uLine.y));
      col = mix(col, uBoot, boot * step(0.01, uLine.y));
      float sh_ = sheerY - 2.6 - vOp.y; float sheer = smoothstep(-fy, fy, sh_) * (1. - smoothstep(-fy, fy, sh_ - uLine.z));
      col = mix(col, uSheer, sheer * step(0.01, uLine.z));
      // plate to plate tone (wide enough that the slide is obvious overhead), in-and-out strakes, big soft mottling
      float outer = mod(k, 2.);
      float fadeP = (1. - smoothstep(60., 230., dist)) * mix(1., 0.4, above);
      col *= mix(1., 0.68 + 0.5 * rnd, fadeP) * mix(1., 0.9 + 0.17 * outer, fadeP);
      col *= 0.82 + 0.34 * vn(vHuv * 0.11 + 3.) * vn(vHuv * 0.37);
      // below the paint line: some plates in fresher red lead, brush streaks along the strake, pale scuffs and dark tallow stains
      float lead = smoothstep(0.62, 0.9, h21(vec2(pid + 7., k + 3.))) * below * fadeM;
      col = mix(col, col * vec3(1.3, 0.85, 0.62) + vec3(0.02, 0., 0.), lead * 0.7);
      col *= 1. - 0.2 * below * fadeM * smoothstep(0.35, 0.8, vn(vec2(vHuv.x * 0.5 + rnd * 9., gir * 7.)));
      float scuff = smoothstep(0.6, 0.85, vn(vHuv * vec2(0.45, 1.6) + 21.) * vn(vHuv * 0.13 + 2.) * 2.1) * below * fadeM;
      col = mix(col, vec3(0.3, 0.2, 0.165) * (0.8 + 0.4 * vn(vHuv * 3.)), scuff * 0.45);
      // lap shadow under each seam and butt joints
      float fadeS = mix(fadeM, max(1. - smoothstep(35., 130., dist), 0.38 * (1. - smoothstep(120., 320., dist))), above);     // on the topsides the seams are strong only close to; out to 300 m they stay as faint strake lines, so her flank has drawing
      float lap = (1. - smoothstep(0.0, 0.12 + aa, sv)) * fadeS;
      float lapHi = smoothstep(2.4 - 0.07 - aa, 2.4, sv) * fadeS;
      float butt = (1. - smoothstep(0.02, 0.06 + aa, abs(bx - 0.04))) * fadeS;
      col *= 1. - 0.65 * lap - 0.45 * butt; col += 0.045 * lapHi * (0.6 + col);
      // rivets: double rows along the laps and the butts, single rows on the frames; a dark contact ring and a bright head
      float fr = fract(vHuv.x / 1.2) * 1.2;
      float dR = min(rivD(vHuv.x, sv - 0.2, 0.35), rivD(vHuv.x + 0.175, sv - 0.42, 0.35));
      dR = min(dR, rivD(vHuv.x, sv - 2.2, 0.35));
      dR = min(dR, min(rivD(sv, bx - 0.24, 0.35), rivD(sv + 0.175, bx - 0.46, 0.35)));
      dR = min(dR, rivD(sv, bx - 9.4, 0.35));
      float dF = rivD(sv + 0.1, fr - 0.6, 0.4);
      float rv = max(1. - smoothstep(0.075 - aa, 0.075 + aa, dR), 0.7 * (1. - smoothstep(0.055 - aa, 0.055 + aa, dF))) * fadeN;
      float ring = max(1. - smoothstep(0.085, 0.17 + aa, dR), 0.7 * (1. - smoothstep(0.065, 0.13 + aa, dF))) * fadeN * (1. - rv);
      col *= 1. - 0.45 * ring;
      col = mix(col, col * 1.9 + 0.03, rv);
      // three staggered rows of open portholes along the topsides: discs close to, and at a raking distance three fine dark lines
      // that follow her sheer, so that she reads as a liner's side and not as a wall
      { float tL = vOp.x / 240., ax = clamp(fwidth(vOp.x), 0.003, 6.), pm = smoothstep(0.1, 0.14, tL) * (1. - smoothstep(0.9, 0.93, tL)) * above * (1. - smoothstep(380., 620., dist));
        float x1 = (fract(vOp.x / 3.4) - 0.5) * 3.4, x2 = (fract(vOp.x / 3.4 + 0.5) - 0.5) * 3.4, y1 = vOp.y - sheerY + 6.4;
        float hole = max(portRow(x1, y1, ax, fy), max(portRow(x2, y1 + 3.1, ax, fy), portRow(x1, y1 + 6.2, ax, fy))) * pm;
        col = mix(col, vec3(0.014, 0.016, 0.022), hole * 0.9); }
      // rust weeps under the seams, strongest on the grey; grime toward the keel
      float streak = smoothstep(0.55, 0.85, vn(vec2(vHuv.x * 1.7, k * 5.3))) * smoothstep(0.35, 0.8, vn(vec2(vHuv.x * 0.21 + 7., k * 1.9)));
      float rustK = uLine.w * mix(1., 0.3 + 0.7 * smoothstep(0.02, 0.3, dot(uTop, vec3(0.333))), above);
      float weep = streak * pow(sv / 2.4, 1.5) * rustK;
      vec3 rust = mix(vec3(0.21, 0.07, 0.03), vec3(0.34, 0.14, 0.05), vn(vHuv * 2.3));
      rust = mix(vec3(0.07, 0.035, 0.022), rust, 0.25 + 0.75 * above);
      col = mix(col, rust, weep * mix(0.7, 0.6, above));
      float blot = smoothstep(0.6, 0.88, vn(vHuv * 0.6 + 11.) * vn(vHuv * 0.17 + 5.) * 1.9) * rustK;
      col = mix(col, rust * 0.9, blot * mix(0.6, 0.2, above));
      col *= 0.8 + 0.2 * smoothstep(0., 6., vOp.y);
      col *= mix(1., 0.8 + 0.2 * smoothstep(9., 30., vOp.y), above);          // the topsides lighten toward the rail, so the flare has form
      diffuseColor.rgb = col;
      hgt = 0.06 * rv + 0.045 * outer * smoothstep(0.0, 0.08, sv) * (1. - smoothstep(2.32, 2.4, sv)) * fadeN + 0.012 * (1. - butt) * fadeN;
      bumpK = 1.0;
    }`,
    fRough: 'roughnessFactor = 0.66 - 0.2 * clamp(hgt / 0.06, 0., 1.);',
    fNormal: BUMP,
    // light thrown up off the water and the wet ways ripples on the bottom plating toward the stern (ambient, time-driven)
    fEmis: `{ float wx_ = vOp.x + uHullPos.x; float nw_ = (1. - smoothstep(70., 235., wx_)) * (0.55 + 0.45 * (1. - smoothstep(10., 90., wx_)));
      float dn_ = 1. - smoothstep(-0.55, 0.2, dot(normal, viewMatrix[1].xyz));
      vec2 cp_ = vec2(wx_, vOp.z) * 0.3;
      float c1_ = vn(cp_ + vec2(uTime * 0.33, uTime * 0.19)), c2_ = vn(cp_ * 1.7 + vec2(7. - uTime * 0.27, uTime * 0.31));
      float ca_ = 1. - abs(c1_ + c2_ - 1.); ca_ *= ca_; ca_ *= ca_ * ca_;
      totalEmissiveRadiance += diffuseColor.rgb * (uSunCol * (ca_ * nw_ * uCaust * 1.7) + uFill * 0.8 + uKick * 0.3) * dn_;
      float fz_ = 1. - abs(dot(normal, normalize(vViewPosition))); fz_ *= fz_;
      totalEmissiveRadiance += uAmb * (fz_ * 0.3 * (1. - dn_)) * (0.35 + diffuseColor.rgb);
      // a warm wrap of sun on the flank that faces it (unshadowed, soft), so the sunny side of her is the clearest value in the yard
      totalEmissiveRadiance += diffuseColor.rgb * uSunCol * (0.15 * smoothstep(-0.15, 0.85, dot(normal, uSunV)) * (1. - dn_));
      // and with the sun behind her a thin hot rim along whatever edge turns away from the eye
      totalEmissiveRadiance += uSunCol * (fz_ * fz_ * 0.5 * smoothstep(0.1, 0.7, -uSunV.z) * (1. - dn_)) * (0.2 + diffuseColor.rgb); }`,
  }, 'hull');
}

// ---------- small geometry helpers ----------
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), XA = new THREE.Vector3(1, 0, 0);
// collects coloured pieces and merges them into one vertex-coloured geometry
class Bag {
  constructor() { this.list = []; }
  add(geo, color, matrix) {
    let g = geo.index ? geo.toNonIndexed() : geo;
    if (matrix) g.applyMatrix4(matrix);
    const n = g.attributes.position.count, col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { col[i * 3] = color.r; col[i * 3 + 1] = color.g; col[i * 3 + 2] = color.b; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(k)) g.deleteAttribute(k);
    this.list.push(g); return this;
  }
  box(x, y, z, sx, sy, sz, color, rx = 0, ry = 0, rz = 0) {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz)), _s.set(1, 1, 1));
    return this.add(new THREE.BoxGeometry(sx, sy, sz), color, _m);
  }
  // tapered cylinder from a to b
  cyl(a, b, r0, r1, seg, color, open = false) {
    _a.set(a[0], a[1], a[2]); _b.set(b[0], b[1], b[2]); const len = _a.distanceTo(_b);
    _q.setFromUnitVectors(UP, _b.clone().sub(_a).normalize());
    _m.compose(_a.clone().lerp(_b, 0.5), _q, _s.set(1, 1, 1));
    return this.add(new THREE.CylinderGeometry(r1, r0, len, seg, 1, open), color, _m);
  }
  build() { const g = mergeGeometries(this.list, false); for (const x of this.list) x.dispose(); this.list = []; return g; }
}
// instanced boxes (length along local X) with optional launch animation
class Timbers {
  constructor() { this.mat = []; this.col = []; this.anim = []; this.move = []; this.n = 0; }
  // anim: [kind (0 none, 1 wedge front, 2 shore wave), triggerX, spin (rad about local z), bounce], move: [dx,dy,dz]
  add(x, y, z, L, H, W, color, rot = [0, 0, 0], anim = null, move = null) {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rot[0], rot[1], rot[2], 'YZX')), _s.set(L, H, W));
    for (let i = 0; i < 16; i++) this.mat.push(_m.elements[i]);
    this.col.push(color.r, color.g, color.b);
    this.anim.push(...(anim || [0, 0, 0, 0])); this.move.push(...(move || [0, 0, 0])); this.n++;
  }
  // a timber between two points with section h x w
  span(a, b, h, w, color) {
    _a.set(a[0], a[1], a[2]); _b.set(b[0], b[1], b[2]); const len = _a.distanceTo(_b);
    _q.setFromUnitVectors(XA, _b.clone().sub(_a).normalize());
    _m.compose(_a.clone().lerp(_b, 0.5), _q, _s.set(len, h, w));
    for (let i = 0; i < 16; i++) this.mat.push(_m.elements[i]);
    this.col.push(color.r, color.g, color.b); this.anim.push(0, 0, 0, 0); this.move.push(0, 0, 0); this.n++;
  }
  build(geo, material) {
    const g = geo.clone();
    g.setAttribute('aAnim', new THREE.InstancedBufferAttribute(new Float32Array(this.anim), 4));
    g.setAttribute('aMove', new THREE.InstancedBufferAttribute(new Float32Array(this.move), 3));
    const mesh = new THREE.InstancedMesh(g, material, this.n);
    mesh.instanceMatrix.array.set(this.mat); mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(this.col), 3);
    mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
    return mesh;
  }
}
// unit box without caps on the X ends would show hollow timbers, so timbers keep a full box; struts use this open prism
function prismGeometry() {
  const g = new THREE.BoxGeometry(1, 1, 1).toNonIndexed(), p = g.attributes.position, n = g.attributes.normal, keep = [];
  for (let i = 0; i < p.count; i += 3) if (Math.abs(n.getX(i)) < 0.5) keep.push(i, i + 1, i + 2);
  const pos = [], nor = [], uv = [];
  for (const i of keep) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); uv.push(g.attributes.uv.getX(i), g.attributes.uv.getY(i)); }
  const o = new THREE.BufferGeometry();
  o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); o.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); o.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.dispose(); return o;
}

const TIMBER_ANIM = `
  vec3 sc_ = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
  float fr_ = aAnim.x < 0.5 ? -1e5 : (aAnim.x < 1.5 ? uFront.x : uFront.y);
  float e_ = clamp((fr_ - aAnim.y) / 16., 0., 1.); float ee_ = e_ * e_ * (3. - 2. * e_);
  float an_ = aAnim.z * ee_; float cs_ = cos(an_), sn_ = sin(an_);`;
function timberMaterial(U) {
  return stdMat({ color: 0xffffff, roughness: 0.86, metalness: 0 }, U, {
    vHead: 'attribute vec4 aAnim; attribute vec3 aMove; uniform vec2 uFront; varying vec3 vLoc; varying vec3 vLn; varying float vSd;',
    vNormal: `${TIMBER_ANIM}
      vec3 objectNormal = vec3(cs_ * normal.x - sn_ * normal.y, sn_ * normal.x + cs_ * normal.y, normal.z) * sc_;
      vLn = normal;`,
    vBegin: `vec3 transformed = position * sc_;
      vLoc = transformed; vSd = fract(instanceMatrix[3].x * 0.731 + instanceMatrix[3].z * 1.37 + instanceMatrix[3].y * 0.31);
      transformed.xy = vec2(cs_ * transformed.x - sn_ * transformed.y, sn_ * transformed.x + cs_ * transformed.y);
      transformed /= sc_;
      { vec3 d_ = aMove * ee_ + vec3(0., aAnim.w * abs(sin(e_ * 9.42)) * (1. - e_), 0.);
        transformed += (transpose(mat3(instanceMatrix)) * d_) / (sc_ * sc_); }`,
    fHead: 'varying vec3 vLoc; varying vec3 vLn; varying float vSd;',
    fColor: `{
      vec3 an = abs(vLn); vec2 q = an.y > 0.5 ? vLoc.xz : (an.z > 0.5 ? vLoc.xy : vLoc.zy);
      float endGrain = step(0.5, an.x);
      float g1 = vn(vec2(q.x * 0.9 + vSd * 31., q.y * 22. + vSd * 7.)), g2 = vn(vec2(q.x * 3.1, q.y * 60. + vSd * 13.));
      float rings = 0.5 + 0.5 * sin(length(vLoc.zy + (vSd - 0.5) * 0.2) * 70.);
      float tone = mix(0.72 + 0.4 * g1 * (0.6 + 0.4 * g2), 0.62 + 0.3 * rings, endGrain);
      float check = smoothstep(0.78, 0.8, vn(vec2(q.x * 0.5 + 9., q.y * 34.))) * (1. - endGrain);
      diffuseColor.rgb *= tone * (1. - 0.45 * check) * (0.85 + 0.3 * vSd);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.045, 0.036, 0.028), smoothstep(0.55, 0.9, vn(vLoc.xz * 0.8 + vSd * 40.)) * 0.4);
    }`,
    fEmis: `{ float fz_ = 1. - max(dot(normal, normalize(vViewPosition)), 0.); fz_ *= fz_; fz_ *= fz_;
      totalEmissiveRadiance += uFill * fz_ * 0.5 * smoothstep(0.2, 0.8, dot(normal, viewMatrix[1].xyz)); }`,
  }, 'timber');
}

// ---------- shores: instanced logs that topple about their feet as the wave front (uFront.y) passes ----------
const SHORE_CALC = `
  float e_ = clamp((uFront.y - aFoot.x - aSeed.x * 12.) / 26., 0., 1.); float ee_ = e_ * e_;
  ee_ = ee_ + 0.06 * sin(e_ * 15.7) * e_ * (1. - e_) * 4. * step(0.8, e_);
  vec3 dir_ = normalize(mix(aHead.xyz, aFall, clamp(ee_, 0., 1.)) + vec3(0., 0.3 * sin(clamp(ee_, 0., 1.) * 3.14159), 0.));
  vec3 ref_ = abs(dir_.x) < 0.9 ? vec3(1., 0., 0.) : vec3(0., 0., 1.);
  vec3 bx_ = normalize(cross(ref_, dir_)); vec3 bz_ = cross(bx_, dir_);
  float rad_ = aSeed.y * (1. - 0.28 * position.y);
  float dst_ = length((modelViewMatrix * vec4(aFoot + dir_ * aHead.w * 0.5, 1.)).xyz);
  rad_ = max(rad_, dst_ * 0.0006);`;
function buildShores(rng, U, C, hullAt) {
  const foot = [], head = [], fall = [], seed = [], col = [];
  for (let r = 0; r < 30; r++) {
    const x0 = 14 + r * 8;
    for (const side of [1, -1]) for (let j = 0; j < 10; j++) {
      const hx = x0 - 10 + rng.range(-0.3, 0.3), t = sat(hx / HL), st = station(t);
      const hy = Math.max(st.yK + 1.2, 1.4) + j * (st.yR - Math.max(st.yK, 0) - 4.5) / 9 + rng.range(-0.5, 0.5);
      const hz = halfBreadth(t, hy); if (hz < 6.5 || hx < 22) continue;
      const hp = hullAt(hx, hy, side * (hz - 0.05));
      const zf = side * (9.6 + j * 1.35 + rng.range(-0.3, 0.3)), xf = hp[0] + rng.range(-0.5, 0.5), yf = slipY(xf) + 0.05;
      if (PILES.some((p) => Math.hypot(xf - p[0], zf - p[1]) < 6.2)) continue;
      const dx = hp[0] - xf, dy = hp[1] - yf, dz = hp[2] - zf, len = Math.hypot(dx, dy, dz);
      foot.push(xf, yf, zf); head.push(dx / len, dy / len, dz / len, len);
      const lane = Math.abs(zf) < 17 ? rng.range(10, 13.6) : rng.range(21, 23.4), fz = side * Math.max(-0.6, Math.min(0.6, (lane - Math.abs(zf)) / len));
      const fx = (rng.chance(0.72) ? -1 : 1) * Math.sqrt(1 - fz * fz); fall.push(fx, fx * K + 0.012 + rng.range(0, 0.03), fz);
      seed.push(rng() + j * 0.12, 0.2 + len * 0.007 + rng.range(0, 0.05));
      _c.copy(C.timber).lerp(rng.chance(0.3) ? C.timberPale : C.timberDark, rng.range(0, 0.6)); col.push(_c.r, _c.g, _c.b);
    }
  }
  const base = new THREE.CylinderGeometry(1, 1, 1, 7, 1, true).translate(0, 0.5, 0);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index;
  for (const k of ['position', 'normal', 'uv']) g.setAttribute(k, base.attributes[k]);
  g.setAttribute('aFoot', new THREE.InstancedBufferAttribute(new Float32Array(foot), 3));
  g.setAttribute('aHead', new THREE.InstancedBufferAttribute(new Float32Array(head), 4));
  g.setAttribute('aFall', new THREE.InstancedBufferAttribute(new Float32Array(fall), 3));
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(new Float32Array(seed), 2));
  g.setAttribute('aCol', new THREE.InstancedBufferAttribute(new Float32Array(col), 3));
  g.instanceCount = seed.length / 2;
  const head_ = 'attribute vec3 aFoot; attribute vec4 aHead; attribute vec3 aFall; attribute vec2 aSeed; attribute vec3 aCol; uniform vec2 uFront;';
  const mat = stdMat({ color: 0xffffff, roughness: 0.88, metalness: 0 }, U, {
    vHead: head_ + ' varying vec3 vSc; varying vec3 vSl;',
    vNormal: SHORE_CALC + '\nvec3 objectNormal = bx_ * normal.x + dir_ * normal.y + bz_ * normal.z;',
    vBegin: 'vec3 transformed = aFoot + dir_ * (position.y * aHead.w) + (bx_ * position.x + bz_ * position.z) * rad_; vSc = aCol; vSl = vec3(position.y * aHead.w, aSeed.x, aHead.w);',
    fHead: 'varying vec3 vSc; varying vec3 vSl;',
    fColor: `{ float g1 = vn(vec2(vSl.x * 0.7 + vSl.y * 37., vHuv.x * 26.)); float band = smoothstep(0.6, 0.85, vn(vec2(vSl.x * 0.35 + vSl.y * 11., 2.)));
      // rough-barked spars, weathered grey-brown: long checks, darker knots, tarred feet and bruised heads
      float bark = vn(vec2(vSl.x * 0.22 + vSl.y * 53., vHuv.x * 61.)), knot = smoothstep(0.7, 0.86, vn(vec2(vSl.x * 1.3 + vSl.y * 19., vHuv.x * 9.)));
      vec3 sc_ = mix(vec3(dot(vSc, vec3(0.3, 0.5, 0.2))), vSc, 0.62) * 0.74;
      diffuseColor.rgb = sc_ * (0.66 + 0.4 * g1 + 0.22 * bark) * (1. - 0.3 * band) * (1. - 0.5 * knot);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.05, 0.04, 0.03), max((1. - smoothstep(0., 1.6, vSl.x)) * 0.6, (1. - smoothstep(0., 0.7, vSl.z - vSl.x)) * 0.5)); }`,
  }, 'shore');
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.castShadow = true; mesh.receiveShadow = true;
  const dep = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  dep.onBeforeCompile = (sh) => {
    sh.uniforms.uFront = U.uFront;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + head_)
      .replace('#include <begin_vertex>', SHORE_CALC + '\nvec3 transformed = aFoot + dir_ * (position.y * aHead.w) + (bx_ * position.x + bz_ * position.z) * rad_;');
  };
  dep.customProgramCacheKey = () => 'slipway-shore-depth';
  mesh.customDepthMaterial = dep;
  base.dispose();
  return mesh;
}

// ---------- the slip: planked ramp with greased ways lanes, stone flanks ----------
function buildSlip(U, C) {
  const pos = [], uv = [], nor = [];
  const quad = (a, b, c, d, n, kind) => { for (const v of [a, b, c, a, c, d]) { pos.push(...v); nor.push(...n); uv.push(kind, 0); } };
  const xs = [-40, 270, 290], up = [-K, 1, 0];
  for (let i = 0; i < 2; i++) {
    const x0 = xs[i], x1 = xs[i + 1], y0 = slipY(x0), y1 = slipY(x1), n = i === 0 ? up : [0, 1, 0];
    quad([x0, y0, 30], [x1, y1, 30], [x1, y1, -30], [x0, y0, -30], n, 0);
    for (const sd of [1, -1]) {
      const a = [x0, y0, sd * 30], b = [x1, y1, sd * 30], c = [x1, -6, sd * 30.6], d = [x0, -6, sd * 30.6];
      if (sd > 0) quad(b, a, d, c, [0, 0.02, 1], 1); else quad(a, b, c, d, [0, 0.02, -1], 1);
    }
  }
  quad([290, slipY(290), -30], [290, slipY(290), 30], [290.5, -6, 30.6], [290.5, -6, -30.6], [1, 0, 0], 2);
  quad([-40, slipY(-40), 30], [-40, slipY(-40), -30], [-40.5, -6, -30], [-40.5, -6, 30], [-1, 0, 0], 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  const mat = stdMat({ color: 0xffffff, roughness: 0.85, metalness: 0 }, U, {
    uniforms: { uWood: { value: C.deck }, uStone: { value: C.stone }, uPetal: { value: C.pink } },
    fHead: 'uniform vec3 uWood, uStone, uPetal, uSunCol; uniform float uTime; float hgt; float bumpK; float gloss;',
    fColor: `{
      float dist = length(vViewPosition), fade = 1. - smoothstep(60., 220., dist);
      vec3 col;
      if (vHuv.x < 0.5) {
        float pw = 0.42, pid = floor(vOp.x / pw), px = fract(vOp.x / pw);
        float zz = vOp.z + h21(vec2(pid, 1.)) * 7., seg = floor(zz / 7.), ez = fract(zz / 7.) * 7.;
        float rnd = h21(vec2(pid, seg));
        float aa = clamp(fwidth(vOp.x) / pw, 0.001, 0.5);
        float seam = (1. - smoothstep(0.03, 0.07 + aa, min(px, 1. - px))) * (1. - smoothstep(0.25, 0.6, aa));
        float butt = (1. - smoothstep(0.02, 0.06, min(ez, 7. - ez))) * fade;
        float grain = vn(vec2(vOp.z * 0.8 + rnd * 40., vOp.x * 16.));
        col = uWood * mix(1., 0.72 + 0.5 * rnd, 0.35 + 0.65 * fade) * (0.8 + 0.3 * grain * fade);
        col *= 0.8 + 0.3 * vn(vOp.xz * 0.06) + 0.12 * vn(vOp.xz * 0.5);
        col *= 1. - 0.6 * seam - 0.4 * butt;
        // pale new weed and moss in the seams, petals drifted against the gantry feet
        float weed = seam * smoothstep(0.5, 0.75, vn(vOp.xz * 0.35 + 9.));
        col = mix(col, vec3(0.2, 0.27, 0.1), weed * 0.7);
        float lane = abs(abs(vOp.z) - 7.);
        float grease = (1. - smoothstep(1.0, 2.6, lane)) * (0.55 + 0.45 * vn(vec2(vOp.x * 0.25, vOp.z * 2.)));
        float tallow = (1. - smoothstep(0.9, 1.5, lane)) * smoothstep(0.45, 0.8, vn(vec2(vOp.x * 0.5, vOp.z * 5.)));
        col = mix(col, vec3(0.075, 0.062, 0.05), grease * 0.75); col = mix(col, vec3(0.5, 0.45, 0.3), tallow * 0.4);
        float nave = (1. - smoothstep(4., 9., abs(vOp.z))); col *= 1. - 0.15 * nave * vn(vOp.xz * 0.9);
        float drift = smoothstep(0.56, 0.92, vn(vOp.xz * vec2(0.07, 0.3) + 4.) * (0.35 + 0.65 * smoothstep(17., 27., abs(vOp.z))) + 0.14 * vn(vOp.xz * 1.1) - 0.04);
        col = mix(col, uPetal * (0.75 + 0.25 * vn(vOp.xz * 7.)), drift * 0.42 * smoothstep(4., 14., vOp.x));
        float wet = 1. - smoothstep(0., 9., vOp.x); col *= 1. - 0.5 * wet; col = mix(col, vec3(0.08, 0.14, 0.09), wet * 0.4 * vn(vOp.xz * 0.4));
        gloss = max(grease * 0.6, wet * 0.6);
        hgt = -0.012 * seam * fade; bumpK = 1.;
      } else {
        vec2 q = vec2(vHuv.x > 1.5 ? vOp.z : vOp.x, vOp.y); float row = floor(q.y / 0.8); q.x += h21(vec2(row, 2.)) * 2.;
        float bid = floor(q.x / 1.7); vec2 f = vec2(fract(q.x / 1.7) * 1.7, fract(q.y / 0.8) * 0.8);
        float joint = 1. - smoothstep(0.02, 0.06, min(min(f.x, 1.7 - f.x), min(f.y, 0.8 - f.y)));
        col = uStone * (0.75 + 0.4 * h21(vec2(bid, row))) * (0.8 + 0.3 * vn(q * 1.3)) * (1. - 0.5 * joint * fade);
        float tide = 1. - smoothstep(0.2, 2.2, vOp.y); col = mix(col, vec3(0.06, 0.1, 0.07), tide * 0.75);
        col = mix(col, vec3(0.16, 0.2, 0.1), smoothstep(0.6, 0.8, vn(q * 0.4)) * 0.5);
        gloss = 0.; hgt = -0.02 * joint * fade; bumpK = 1.;
      }
      diffuseColor.rgb = col;
    }`,
    fRough: 'roughnessFactor = mix(0.9, 0.32, gloss);',
    fNormal: BUMP,
    fEmis: `{ float fz_ = 1. - max(dot(normal, normalize(vViewPosition)), 0.); fz_ *= fz_; fz_ *= fz_;
      vec2 cp_ = vOp.xz * 0.3; float c1_ = vn(cp_ + vec2(uTime * 0.33, uTime * 0.19)), c2_ = vn(cp_ * 1.7 + vec2(7. - uTime * 0.27, uTime * 0.31));
      float ca_ = 1. - abs(c1_ + c2_ - 1.); ca_ *= ca_; ca_ *= ca_ * ca_; ca_ *= (1. - smoothstep(10., 215., vOp.x)) * smoothstep(-2., 3., vOp.x);
      totalEmissiveRadiance += (diffuseColor.rgb * (uFill * 0.9 + uKick * 0.35 + uSunCol * ca_ * 1.2) + uFill * fz_ * (0.25 + 1.1 * gloss)) * step(vHuv.x, 0.5); }`,
  }, 'slip');
  const mesh = new THREE.Mesh(g, mat); mesh.receiveShadow = true; mesh.castShadow = false;
  return mesh;
}

// ---------- steel struts (gantries): open prisms, widened with distance so lattice never falls under a pixel ----------
function steelMaterial(U) {
  return stdMat({ color: 0xffffff, roughness: 0.7, metalness: 0.35 }, U, {
    vHead: 'attribute vec4 aAnim; attribute vec3 aMove; uniform float uTime; varying vec3 vLoc; varying float vSd; varying float vWy;',
    vBegin: `vec3 transformed = position;
      { vec3 sc_ = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
        float dst_ = length((modelViewMatrix * instanceMatrix * vec4(0., 0., 0., 1.)).xyz);
        transformed.yz *= max(vec2(1.), dst_ * 0.0017 / sc_.yz);
        vLoc = position * sc_; vSd = fract(instanceMatrix[3].x * 0.37 + instanceMatrix[3].y * 0.71 + instanceMatrix[3].z * 0.13);
        vec3 d_ = aMove * sin(uTime * aAnim.z + aAnim.w) * step(2.5, aAnim.x);
        transformed += (transpose(mat3(instanceMatrix)) * d_) / (sc_ * sc_); vWy = (instanceMatrix * vec4(transformed, 1.)).y; }`,
    fHead: 'varying vec3 vLoc; varying float vSd; varying float vWy; uniform vec3 uSunCol, uSunV;',
    fColor: `{ float r = vn(vec2(vLoc.x * 0.9 + vSd * 50., vSd * 9.)); float r2 = vn(vec2(vLoc.x * 5., vSd * 77.));
      diffuseColor.rgb *= 0.8 + 0.3 * r2;
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.3, 0.12, 0.05) * (0.7 + 0.6 * r2), smoothstep(0.5, 0.82, r) * 0.7);
      float gus = 1. - smoothstep(0.1, 0.22, abs(fract(vLoc.x / 2.5) - 0.5) * 2.5);
      diffuseColor.rgb *= 1. - 0.18 * gus; }`,
    fEmis: `{ float fz_ = 1. - abs(dot(normal, normalize(vViewPosition))); fz_ *= fz_;
      totalEmissiveRadiance += uSunCol * (fz_ * 0.4 * smoothstep(0.1, 0.6, -uSunV.z) * smoothstep(34., 56., vWy)) * (0.25 + diffuseColor.rgb); }`,
  }, 'steel');
}
function buildGantries(rng, U, C, anchors) {
  const S = new Timbers(), S2 = new Timbers(), tops = [];
  const strut = (a, b, w, col, h = w) => S.span(a, b, h, w, col), minor = (a, b, w, col, h = w) => S2.span(a, b, h, w, col);
  for (const side of [1, -1]) {
    const heads = [];
    for (let k = 0; k < 7; k++) {
      const bx = 30 + k * 40, bz = side * 26, by = slipY(bx), H = 55, lv = [];
      const paint = _c.copy(C.steel).lerp(C.oxide, rng.range(0.25, 0.55)).clone(), dark = paint.clone().multiplyScalar(0.8);
      const open = side > 0 && bx <= 230;     // the east towers stand between the beam view and her sunlit flank: half their diagonals come out
      for (let i = 0; i <= 10; i++) { const f = i / 10, y = by + H * (1 - Math.pow(1 - f, 1.25)); lv.push([y, lerp(3.4, 2.2, f), lerp(3.0, 2.2, f)]); }
      const corner = (i, cx, cz) => [bx + cx * lv[i][1], lv[i][0], bz + cz * lv[i][2]];
      const CN = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
      for (const c of CN) strut(corner(0, c[0], c[1]), corner(10, c[0], c[1]), 0.6, paint);
      for (let i = 0; i <= 10; i++) for (let f = 0; f < 4; f++) {
        const c0 = CN[f], c1 = CN[(f + 1) % 4];
        if (i > 0) minor(corner(i, c0[0], c0[1]), corner(i, c1[0], c1[1]), 0.3, dark);
        if (i < 10) {
          const flip = (i + f) % 2 === 0;
          if (open && (f === 0 || f === 3) && lv[i + 1][0] - by > 12 && lv[i][0] - by < 45) continue;
          minor(corner(i, ...(flip ? c0 : c1)), corner(i + 1, ...(flip ? c1 : c0)), 0.26, dark);
          if (i < 2) minor(corner(i, ...(flip ? c1 : c0)), corner(i + 1, ...(flip ? c0 : c1)), 0.26, dark);
        }
      }
      // jib toward the hull carrying the crane runway at z = +-17
      const ty = by + H, tip = [bx, ty - 0.6, side * 17];
      for (const dx of [-2.2, 2.2]) { strut([bx + dx, ty, bz - side * 2.2], [bx + dx * 0.35, ty - 0.4, side * 16.4], 0.34, paint); minor([bx + dx, lv[8][0], bz - side * lv[8][2]], [bx + dx * 0.35, ty - 0.9, side * 17.6], 0.26, dark); }
      minor([bx - 0.9, ty - 0.5, side * 16.6], [bx + 0.9, ty - 0.5, side * 16.6], 0.3, dark);
      // ladder rails up the outer face
      for (const dz of [-0.35, 0.35]) minor([bx + dz, by, bz + side * 3.25], [bx + dz, ty, bz + side * 2.45], 0.09, dark);
      heads.push([bx, ty, bz]); tops.push([bx, ty + 1.2, bz]); anchors.push(tip);
      // cap house and finial
      strut([bx, ty, bz], [bx, ty + 1.3, bz], 3.6, dark, 3.6); strut([bx, ty + 1.3, bz], [bx, ty + 4.5, bz], 0.16, paint);
    }
    // head girders (box trusses) and the runway beam between neighbouring towers
    for (let k = 0; k < 6; k++) {
      const a = heads[k], b = heads[k + 1], col = _c.copy(C.steel).lerp(C.oxide, 0.2).clone();
      const at = (f, dy, dz) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f) + dy, a[2] + dz];
      for (const dz of [-1.5, 1.5]) for (const dy of [-0.2, -3.4]) strut(at(0.05, dy, dz), at(0.95, dy, dz), 0.36, col);
      for (let j = 0; j < 8; j++) {
        const f0 = 0.05 + j * 0.1125, f1 = f0 + 0.1125, fl = j % 2 === 0;
        for (const dz of [-1.5, 1.5]) { minor(at(f1, -0.2, dz), at(f1, -3.4, dz), 0.2, col); minor(at(fl ? f0 : f1, -0.2, dz), at(fl ? f1 : f0, -3.4, dz), 0.2, col); }
        minor(at(f1, -0.2, -1.5), at(f1, -0.2, 1.5), 0.2, col);
      }
      strut([a[0], a[1] - 1.3, side * 17], [b[0], b[1] - 1.3, side * 17], 0.42, col, 0.7);
      // a travelling hoist on some spans: trolley, fall and hook block creep along the runway (kept off the fly-through bay)
      if (rng.chance(0.6) && !(side > 0 && k === 5)) {
        const f = rng.range(0.3, 0.7), hx = lerp(a[0], b[0], f), hy = lerp(a[1], b[1], f) - 1.9, drop = rng.range(6, 14), n0 = S.n;
        const amp = rng.range(5, 9), sp = rng.range(0.06, 0.11), ph = rng.range(0, TAU);
        if (side > 0 && k === 2) continue;     // none in the bay the flight comes back in through, behind her bow
        strut([hx - 1.2, hy, side * 17], [hx + 1.2, hy, side * 17], 1.1, C.oxide, 0.8);
        strut([hx, hy, side * 17], [hx, hy - drop, side * 17], 0.1, C.dark);
        strut([hx, hy - drop, side * 17], [hx, hy - drop - 1.3, side * 17], 0.6, C.oxide, 0.5);
        for (let i = n0; i < S.n; i++) { S.anim.splice(i * 4, 4, 3, 0, sp, ph); S.move.splice(i * 3, 3, amp, amp * K, 0); }
      }
    }
  }
  return { S, S2, tops };
}

// ---------- loose timber on the slip: ground ways, keel-block stacks, wedges, mauls, sole plates, stagings ----------
function buildGroundTimber(rng, C, T) {
  const pitch = Math.atan(K), tone = (base, v = 0.25) => _c.copy(base).multiplyScalar(1 + rng.range(-v, v)).clone();
  for (const side of [1, -1]) {
    for (let x = -34; x < 262; x += 12) T.add(x, slipY(x) + 0.3, side * 7, 11.9, 0.6, 1.9, tone(C.grease, 0.15), [0, 0, pitch]);
    // knocked-out keel blocks stacked beside the nave; the top block of some stacks rolls off down the slip
    for (let i = 0; i < 30; i++) {
      const x = 18 + i * 8 + rng.range(-1.2, 1.2), z = side * (4.75 + rng.range(-0.15, 0.35)), n = rng.int(2, 3), yaw0 = rng.range(-0.15, 0.15);
      for (let l = 0; l < n; l++) {
        const top = l === n - 1, roll = top && rng.chance(0.45), dx = -rng.range(5, 22);
        T.add(x + rng.range(-0.1, 0.1), slipY(x) + 0.26 + l * 0.5, z + rng.range(-0.08, 0.08), 1.5, 0.5, l % 2 ? 1.25 : 1.4, tone(l % 2 ? C.timber : C.timberDark),
          [0, yaw0 + (l % 2 ? PI / 2 : 0) + rng.range(-0.08, 0.08), pitch * (l % 2 ? 0 : 1)],
          roll ? [2, x + rng.range(0, 14), rng.sign() * rng.range(4, 11), rng.range(0.4, 0.9)] : null, roll ? [dx, dx * K - l * 0.5, side * rng.range(-0.4, 1.2)] : null);
      }
      // a wedge heap and a maul left lying
      if (rng.chance(0.6)) for (let w = 0; w < 4; w++) T.add(x + 2.2 + rng.range(-0.5, 0.5), slipY(x + 2.2) + 0.09 + (w > 2 ? 0.16 : 0), z + rng.range(-0.5, 0.5), 1.0, 0.15, 0.24, tone(C.timberPale), [0, rng.range(0, PI), pitch * 0.5 + rng.range(-0.1, 0.1)]);
      if (rng.chance(0.55)) {
        const mx = x - 2.4 + rng.range(-0.6, 0.6), mz = z + side * rng.range(-0.3, 0.9), yaw = rng.range(0, TAU);
        T.add(mx, slipY(mx) + 0.1, mz, 1.0, 0.06, 0.06, C.timberPale, [0, yaw, 0.05]);
        T.add(mx + Math.cos(yaw) * 0.5, slipY(mx) + 0.13, mz - Math.sin(yaw) * 0.5, 0.2, 0.2, 0.34, C.dark, [0, yaw, 0]);
      }
    }
    // driving wedges along the outside of each way: they drop in a ripple as uFront.x passes
    for (let x = 14; x < 249; x += 2.5) {
      T.add(x, slipY(x) + 0.78, side * 8.15, 0.24, 0.16, 1.5, tone(C.timberPale, 0.2), [rng.range(-0.05, 0.05), rng.range(-0.1, 0.1), pitch],
        [1, x - 8 + rng.range(-2, 2), rng.range(-0.3, 0.3), 0.12], [rng.range(-0.3, 0.1), -0.66, side * rng.range(0.5, 1.1)]);
    }
    // sole plates under the gantry legs, plank stagings hung beside the hull on the runway falls (none in the fly-through bay)
    for (let k = 0; k < 7; k++) for (const cx of [-3.4, 3.4]) for (const cz of [-3, 3]) { const x = 30 + k * 40 + cx; T.add(x, slipY(x) + 0.16, side * 26 + cz, 1.6, 0.32, 1.6, tone(C.timberDark)); }
  }
  return T;
}
function buildStagings(rng, C, T, S, hullAt) {
  for (const side of [1, -1]) for (let i = 0; i < 11; i++) {
    const x = 34 + i * 19 + rng.range(-4, 4); if (side > 0 && x > 196) continue; if (side < 0 && rng.chance(0.5)) continue; if (side > 0 && x > 100) { if (x <= 150 || !rng.chance(0.65)) { rng.range(7, 25); rng.range(7, 11); rng.range(0.75, 1.1); rng.range(0.75, 1.1); } continue; }     // on the east side only by her stern: her flank is seen whole from over the east yard
    const hy = rng.range(7, 25), t = sat((x - 10) / HL), hz = halfBreadth(t, hy), L = rng.range(7, 11);
    const y = hullAt(x - 10, hy, 0)[1], z = side * Math.max(16.2, hz + 2.2), top = slipY(x) + 53.6;
    for (const dz of [-0.33, 0.33]) T.add(x, y, z + dz, L, 0.09, 0.6, _c.copy(C.timberPale).multiplyScalar(rng.range(0.75, 1.1)).clone(), [0, 0, Math.atan(K)]);
    for (const e of [-1, 1]) {
      const xe = x + e * (L / 2 - 0.5), ye = y + e * (L / 2 - 0.5) * K;
      S.span([xe, ye, z - 0.6], [xe, ye, z + 0.6], 0.14, 0.14, C.timberDark);
      S.span([xe, ye, z], [xe, top, side * 17], 0.07, 0.07, C.rope);
      S.span([xe, ye + 1.1, z - 0.62], [xe - e * (L - 1), ye + 1.1 - e * (L - 1) * K, z - 0.62], 0.05, 0.05, C.rope);
    }
  }
}

// ---------- the sliding cradle under the hull (hull-local coordinates: x from the counter, y from the keel) ----------
function buildCradle(rng, C, T) {
  const yW = -GAP + 0.95, tone = (base, v = 0.2) => _c.copy(base).multiplyScalar(1 + rng.range(-v, v)).clone();
  for (const side of [1, -1]) {
    for (let hx = 9; hx < 236; hx += 10) T.add(hx, yW, side * 7, 9.9, 0.7, 1.5, tone(C.grease, 0.2));
    let prevTop = null;
    for (let hx = 8; hx <= 234; hx += 2) {
      const t = hx / HL, st = station(t), poppet = t < 0.17 || t > 0.83;
      if ((hx - 8) % 4 !== 0 && !poppet) continue;
      if (st.yK > 12) continue;
      let top = bottomAt(t, 7), tz = 7;
      if (top < 0) { top = st.yK + st.hb * 0.85; tz = Math.max(0.6, halfBreadth(t, top)); }
      const a = [hx, yW + 0.35, side * 7], b = [hx, top - 0.15, side * tz];
      T.span(a, b, poppet ? 0.62 : 0.5, poppet ? 0.62 : 0.5, tone(poppet ? C.timberDark : C.timber));
      T.add(hx, top - 0.02 - (tz < 7 ? 0.5 : 0.12), side * (tz + (tz < 7 ? 0.25 : 0)), 1.3, 0.26, 1.0, tone(C.timberPale), [0, 0, 0]);
      if (prevTop && (hx - 8) % 8 === 0) T.span([hx - (poppet ? 2 : 4), yW + 0.5, side * 7.42], [hx, lerp(yW, prevTop, 0.86), side * lerp(7.42, tz + 0.42, 0.86)], 0.3, 0.22, tone(C.timberDark));
      prevTop = top;
    }
    for (const fy of [0.3, 0.68]) for (let hx = 14; hx < 232; hx += 12) {
      const top = Math.max(0, bottomAt(hx / HL, 7)); if (lerp(yW, top, fy) > top - 0.3 && fy > 0.5) continue;
      T.add(hx, lerp(yW, 0, fy), side * 7.4, 11.9, 0.34, 0.26, tone(C.timber));
    }
  }
}

// ---------- hull fittings: deck, casings, rudder, bossings, bilge keels, anchors (vertex coloured) ----------
async function buildFittings(rng, C, liv, pause) {
  const B = new Bag(), deckCol = liv.deck;
  // deck strip, 1.1 m below the rail
  { const pos = [], col = [], idx = []; let n = 0;
    for (let i = 0; i <= 80; i++) {
      const t = 0.004 + (i / 80) * 0.99, st = station(t), y = st.yR - 1.1, z = Math.max(0.05, halfBreadth(t, y) - 0.06);
      const v = 0.8 + 0.3 * rng(); for (const sgn of [-1, 1]) { pos.push(t * HL, y, sgn * z); col.push(deckCol.r * v, deckCol.g * v, deckCol.b * v); }
      if (i > 0) idx.push(n - 2, n, n - 1, n - 1, n, n + 1); n += 2;
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const gn = g.toNonIndexed(), cc = new Float32Array(gn.attributes.position.count * 3);
    for (let i = 0; i < idx.length; i++) { cc[i * 3] = col[idx[i] * 3]; cc[i * 3 + 1] = col[idx[i] * 3 + 1]; cc[i * 3 + 2] = col[idx[i] * 3 + 2]; }
    gn.setAttribute('color', new THREE.BufferAttribute(cc, 3)); gn.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(gn.attributes.position.count * 2), 2));
    B.list.push(gn); g.dispose(); }
  await pause();
  const dk = (hx) => station(hx / HL).yR - 1.1;
  // open casings where boilers, engines and funnels will go: coamings with black wells
  for (const [hx, L, W] of [[78, 16, 9], [104, 12, 8], [128, 12, 8], [152, 18, 10], [186, 9, 6], [52, 9, 6]]) {
    B.box(hx, dk(hx) + 0.6, 0, L, 1.2, W, C.steelDark); B.box(hx, dk(hx) + 1.22, 0, L - 0.7, 0.04, W - 0.7, C.black);
    for (let i = -1; i <= 1; i++) B.box(hx + i * L * 0.3, dk(hx) + 1.3, 0, 0.3, 0.3, W + 0.3, C.oxideDark);
  }
  // deck beams left bare aft, bollards, windlass, capstans, flag staffs
  for (let hx = 14; hx < 40; hx += 3) B.box(hx, dk(hx) + 0.12, 0, 0.35, 0.24, 2 * halfBreadth(hx / HL, dk(hx)) - 1.5, C.oxideDark);
  for (let hx = 30; hx < 220; hx += 21) for (const s of [1, -1]) { const z = s * (halfBreadth(hx / HL, dk(hx)) - 1.4); for (const d of [-0.5, 0.5]) B.cyl([hx + d, dk(hx), z], [hx + d, dk(hx) + 0.9, z], 0.26, 0.3, 7, C.dark); }
  B.box(218, dk(218) + 0.7, 0, 3.4, 1.4, 5.2, C.steelDark); for (const s of [1, -1]) B.cyl([218, dk(218) + 1.2, s * 1.9], [218, dk(218) + 1.2, s * 3.3], 0.9, 0.9, 9, C.dark);
  for (const hx of [230.5, 6, 120]) B.cyl([hx, dk(hx), 0], [hx, dk(hx) + (hx === 120 ? 14 : 11), 0], 0.2, 0.12, 6, C.timberPale);
  await pause();
  // rudder with stock and gudgeons
  { const sh = new THREE.Shape(); const P = [[10.1, 1.3], [5.4, 0.9], [3.9, 3.2], [3.8, 15.5], [5.4, 19.2], [9.4, 20.6], [10.1, 20.6]];
    sh.moveTo(P[0][0], P[0][1]); for (let i = 1; i < P.length; i++) sh.lineTo(P[i][0], P[i][1]); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 1, steps: 1 }).translate(0, 0, -0.25);
    B.add(g, liv.bot); B.cyl([9.9, 19.5, 0], [9.9, 25, 0], 0.5, 0.5, 8, liv.bot);
    for (const y of [3, 8, 13, 18]) B.box(10.2, y, 0, 1.4, 0.5, 0.9, C.oxideDark);
    for (const y of [5.5, 10.5, 15.5]) B.box(7, y, 0, 6.2, 0.22, 0.62, C.oxideDark); }
  // shaft bossings and A-brackets
  for (const s of [1, -1]) {
    await pause();
    B.cyl([47, 4.9, s * 4.9], [15.4, 4.8, s * 5.6], 1.25, 0.8, 10, liv.bot);
    B.cyl([17.2, 4.8, s * 5.6], [18.4, 10.2, s * 1.1], 0.34, 0.4, 6, liv.bot); B.cyl([17.2, 4.8, s * 5.6], [18.2, 1.6, s * 0.5], 0.34, 0.4, 6, liv.bot);
    // bilge keel
    const pos = [], p = [0, 0];
    for (let i = 0; i < 26; i++) {
      const t0 = 0.3 + i * 0.016, t1 = t0 + 0.016, a = hullPt(station(t0), 0.27, [0, 0]).slice(), b = hullPt(station(t1), 0.27, p);
      const w0 = 0.95 * Math.sin(PI * (i / 26)) ** 0.4, w1 = 0.95 * Math.sin(PI * ((i + 1) / 26)) ** 0.4;
      const A = [t0 * HL, a[0], s * a[1]], Bq = [t1 * HL, b[0], s * b[1]], A2 = [A[0], A[1] - w0 * 0.7, A[2] + s * w0 * 0.7], B2 = [Bq[0], Bq[1] - w1 * 0.7, Bq[2] + s * w1 * 0.7];
      pos.push(...A, ...Bq, ...B2, ...A, ...B2, ...A2);
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); B.add(g, liv.bot);
    // hawse pipe and stockless anchor
    const ax = 224, ay = 21.5, az = halfBreadth(ax / HL, ay);
    B.cyl([ax, ay, s * (az - 0.6)], [ax + 0.5, ay - 0.5, s * (az + 0.45)], 0.85, 0.95, 9, C.dark);
    B.box(ax + 0.4, ay - 2.2, s * (az + 0.5), 0.45, 3.4, 0.45, C.dark, 0, 0, 0.12);
    B.box(ax + 0.2, ay - 4.0, s * (az + 0.5), 2.6, 0.6, 0.6, C.dark); for (const d of [-1, 1]) B.box(ax + 0.2 + d * 1.1, ay - 3.3, s * (az + 0.55), 0.5, 1.7, 0.4, C.dark, 0, 0, d * 0.35);
  }
  // spar and cord for the paper ball at the stem head
  B.cyl([238.6, 33.2, 0], [242.7, 34.4, 0], 0.16, 0.1, 6, C.timberPale); B.cyl([242.2, 34.25, 0], [242.2, 30.0, 0], 0.05, 0.05, 5, C.rope);
  await pause();
  return B.build();
}
function propellerGeometry(C) {
  const B = new Bag();
  for (let k = 0; k < 4; k++) {
    const NR = 7, NC = 4, pos = [], idx = [];
    for (let i = 0; i <= NR; i++) for (let j = 0; j <= NC; j++) {
      const f = i / NR, r = 0.6 + f * 2.4, c = (j / NC) * 2 - 1, w = 0.2 + 1.15 * Math.pow(Math.sin(PI * Math.pow(f, 0.62) * 0.96 + 0.06), 0.8);
      const phi = Math.atan(5.5 / (TAU * r)), th = c * w * Math.cos(phi) / r + k * PI / 2 + 0.25 * f, ax = c * w * Math.sin(phi) - 0.12 * f;
      pos.push(ax, r * Math.cos(th), r * Math.sin(th));
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NC; j++) { const a = i * (NC + 1) + j, b = a + NC + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    B.add(g, C.bronze);
  }
  B.cyl([-0.9, 0, 0], [0.9, 0, 0], 0.8, 0.72, 12, C.bronze); B.cyl([-0.9, 0, 0], [-2.3, 0, 0], 0.72, 0.08, 12, C.bronze);
  return B.build();
}

// ---------- drag chains: six mounds that shrink as they pay out, and instanced links dragged down the slip ----------
const LINKS = 120, CHAIN_LEN = 150;
function buildChains(rng, U, C) {
  // mounds
  const pos = [], uv = [], pile = [], idx = []; let base = 0;
  for (let i = 0; i < 6; i++) {
    const NR = 7, NA = 18, sd = rng.range(0, 50);
    for (let r = 0; r <= NR; r++) for (let a = 0; a <= NA; a++) {
      const f = r / NR, ang = (a / NA) * TAU, lump = 1 + 0.16 * Math.sin(ang * 3 + sd) * f + 0.1 * Math.sin(ang * 7 + sd * 2 + f * 5);
      const rad = 4.7 * Math.pow(f, 0.8) * lump, y = 5 * Math.pow(Math.cos(f * PI / 2), 0.85) * (0.9 + 0.1 * Math.sin(ang * 2 + sd));
      pos.push(Math.cos(ang) * rad, y, Math.sin(ang) * rad); uv.push((a / NA) * 26, f * 9); pile.push(i);
    }
    for (let r = 0; r < NR; r++) for (let a = 0; a < NA; a++) { const p = base + r * (NA + 1) + a, q = p + NA + 1; idx.push(p, p + 1, q, q, p + 1, q + 1); }
    base += (NR + 1) * (NA + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aPile', new THREE.Float32BufferAttribute(pile, 1)); g.setIndex(idx); g.computeVertexNormals();
  const uChain = { value: PILES.map((p) => new THREE.Vector4(p[0], p[0], Math.sign(p[1]), 0)) };
  const iron = `{ float r = vn(vOp.xz * 1.1 + vOp.y) * vn(vOp.xy * 3.7 + 5.); diffuseColor.rgb = mix(uIron, uRust * (0.7 + 0.6 * vn(vOp.zy * 6.)), smoothstep(0.12, 0.42, r));`;
  const mound = new THREE.Mesh(g, stdMat({ color: 0xffffff, roughness: 0.8, metalness: 0.3 }, U, {
    uniforms: { uChain, uIron: { value: C.iron }, uRust: { value: C.rust } },
    vHead: 'attribute float aPile; uniform vec4 uChain[6]; varying float vPay;',
    vBegin: `vec3 transformed = position;
      { vec4 ch_ = uChain[int(aPile + 0.5)]; float pay_ = ch_.w; vPay = pay_;
        transformed.y *= 1. - 0.9 * pay_; transformed.xz *= 1. - 0.3 * pay_; transformed.x -= pay_ * (3. + 1.2 * position.y);
        transformed += vec3(ch_.y, min(ch_.y, 270.) * ${K.toFixed(5)}, ch_.z * 19.); }`,
    fHead: 'uniform vec3 uIron, uRust; varying float vPay; float hgt; float bumpK;',
    fColor: `{ vec2 q = vHuv * vec2(1.9, 3.); q.x += floor(q.y) * 0.5; vec2 f = fract(q) - 0.5;
      float ring = abs(length(f * vec2(1., 1.5)) - 0.3); float link = 1. - smoothstep(0.07, 0.16, ring);
      float rr = vn(vHuv * 0.9) * vn(vHuv * 3.1 + 4.);
      float lf = 1. - smoothstep(50., 170., length(vViewPosition));
      diffuseColor.rgb = mix(uIron * mix(1., 0.7, lf), mix(uIron * 1.6, uRust * (0.7 + 0.5 * vn(vHuv * 5.)), smoothstep(0.08, 0.42, rr)), mix(0.6, link, lf));
      hgt = 0.16 * link * (1. - smoothstep(60., 160., length(vViewPosition))); bumpK = 1.; }`,
    fNormal: BUMP,
  }, 'mound'));
  mound.castShadow = true; mound.receiveShadow = true; mound.frustumCulled = false;
  // links
  const lg = new THREE.TorusGeometry(0.42, 0.13, 4, 6), link = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < LINKS; j++) link.push(i, j / LINKS, rng(), j % 2);
  lg.setAttribute('aLink', new THREE.InstancedBufferAttribute(new Float32Array(link), 4));
  const links = new THREE.InstancedMesh(lg, stdMat({ color: 0xffffff, roughness: 0.75, metalness: 0.4 }, U, {
    uniforms: { uChain, uIron: { value: C.iron }, uRust: { value: C.rust } },
    vHead: 'attribute vec4 aLink; uniform vec4 uChain[6]; uniform float uTime;',
    vNormal: 'vec3 objectNormal = aLink.w > 0.5 ? normal : normal.xzy * vec3(1., 1., -1.);',
    vBegin: `vec3 transformed = aLink.w > 0.5 ? position : position.xzy * vec3(1., 1., -1.);
      { vec4 ch_ = uChain[int(aLink.x + 0.5)]; float cx_ = ch_.x + aLink.y * ${CHAIN_LEN.toFixed(1)};
        float out_ = step(cx_, ch_.y - 2.5); float q_ = 1. - aLink.y;
        float lane_ = ch_.z * (mix(15.6, 19., smoothstep(0., 60., cx_ - ch_.x)) + sin(aLink.y * 31. + aLink.z * 2.) * 0.5 * (1. - aLink.y * 0.5));
        transformed.x *= 1.5; transformed *= out_ * 1.4;
        float jit_ = (aLink.z - 0.5) * 0.25 + 0.05 * sin(uTime * 23. + aLink.z * 40.) * step(0.001, ch_.w) * step(ch_.w, 2.5);
        transformed += vec3(cx_, min(cx_, 270.) * ${K.toFixed(5)} + 0.7 + aLink.w * 0.36 + jit_ * out_, lane_); }`,
    fHead: 'uniform vec3 uIron, uRust;',
    fColor: iron + ' }',
  }, 'links'), 6 * LINKS);
  links.frustumCulled = false; links.castShadow = false; links.receiveShadow = true;
  return { mound, links, uChain };
}

// ---------- soft sprites: grease smoke on the ways, rust dust off the chains, spray at stern and bow ----------
function buildSprites(rng, U, C, detail) {
  const center = [], kk = [];
  const nSmoke = Math.round(150 * detail), nDust = Math.round(26 * detail), nSpray = Math.round(34 * detail);
  for (let i = 0; i < nSmoke; i++) { const x = rng.range(-20, 255); center.push(x, slipY(x) + 0.8, rng.sign() * 7 + rng.range(-1, 1)); kk.push(0, rng(), rng.range(3.2, 6.2), 0); }
  for (let c = 0; c < 6; c++) for (let i = 0; i < nDust; i++) {
    const x = PILES[c][0] - (i < nDust * 0.4 ? rng.range(-2, 20) : rng.range(15, 150)); center.push(x, slipY(x) + 1.5, Math.sign(PILES[c][1]) * rng.range(14.5, 21.5)); kk.push(1, rng(), rng.range(6, 10.5), c);
  }
  for (let i = 0; i < nSpray; i++) { center.push(rng.range(-6, 30), rng.range(0, 3), rng.range(-17, 17)); kk.push(2, rng(), rng.range(5, 11), 0); }
  for (let i = 0; i < nSpray * 0.7; i++) { center.push(rng.range(200, 244), rng.range(0, 3), rng.range(-15, 15)); kk.push(3, rng(), rng.range(4, 9), 0); }
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(2, 2);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  g.setAttribute('aCenter', new THREE.InstancedBufferAttribute(new Float32Array(center), 3));
  g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(kk), 4));
  g.instanceCount = kk.length / 4;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uSmokeCol: { value: C.smoke }, uDustCol: { value: C.rustDust } }]),
    vertexShader: `
      attribute vec3 aCenter; attribute vec4 aK; uniform float uTime; uniform vec4 uChain[6]; uniform vec4 uLaunch; uniform vec3 uHullPos; uniform vec2 uHullRot, uHullYaw; uniform vec2 uSpray;
      varying vec2 vQ; varying vec4 vCol; varying float vSeed; uniform vec3 uSmokeCol, uDustCol, uAmb, uSunCol;
      #include <fog_pars_vertex>
      void main() {
        vec3 c = aCenter; float size = aK.z, alpha = 0.; vec3 col = uSmokeCol;
        float ph = fract(uTime * (0.07 + 0.05 * aK.y) + aK.y * 7.31);
        if (aK.x < 0.5) {               // grease smoke: under the moving hull and lingering on the emptied ways
          float under = step(uLaunch.x, c.x) * step(c.x, uLaunch.y);
          float passed = clamp((c.x - uLaunch.y - 8.) / 22., 0., 1.) * (1. - smoothstep(120., 300., c.x - uLaunch.y)) * step(0.5, uLaunch.w);     // the ways smoke from just behind her forefoot
          alpha = (under * uLaunch.z * 0.09 + passed * (0.08 + 0.09 * uLaunch.z)) * sin(ph * 3.14159) * step(0., c.x);
          c.y += ph * (1.5 + 2.5 * passed); c.z += sign(c.z) * ph * 2.5 + sin(ph * 5. + aK.y * 20.) * 0.6; size *= 0.5 + ph * (0.6 + 0.5 * passed);
        } else if (aK.x < 1.5) {        // rust dust thrown up as the chain ploughs past, keyed to slide distance
          vec4 ch = uChain[int(aK.w + 0.5)]; float age = (c.x - ch.x) / 85.; float live = step(0., age) * step(age, 1.) * step(ch.x, ch.y - 0.5);
          float a = clamp(age, 0., 1.); alpha = live * smoothstep(0., 0.05, a) * (1. - a) * (1. - a) * 0.34 * (0.3 + 0.7 * uLaunch.z); col = uDustCol;
          c.y += a * 7. + sin(uTime * 0.7 + aK.y * 30.) * 0.4; c.z += sign(c.z) * a * 5.; size *= 0.4 + 0.9 * sqrt(a);
        } else {                         // white water thrown by the plunging stern (2) and the dropping bow (3), carried with the hull
          float I = aK.x < 2.5 ? uSpray.x : uSpray.y;
          vec3 h = vec3(c.x, 0., c.z * (0.7 + 0.6 * I));
          { vec3 o_ = vec3(h.x * uHullRot.x, h.x * uHullRot.y, h.z); c = uHullPos + vec3(o_.x * uHullYaw.x + o_.z * uHullYaw.y, o_.y, -o_.x * uHullYaw.y + o_.z * uHullYaw.x); } c.y = 0.6 + (aCenter.y + 9. * aK.y) * I * (0.6 + 0.4 * sin(ph * 6.283));
          alpha = I * (0.55 + 0.3 * sin(ph * 6.283 + 1.)); col = vec3(0.92, 0.95, 0.97); size *= 0.5 + 0.9 * I;
        }
        vCol = vec4(col * (uAmb * 0.62 + uSunCol * 0.42), alpha); vQ = position.xy; vSeed = aK.y;
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
        if (aK.x < 0.5) alpha *= smoothstep(12., 42., -mvPosition.z); else if (aK.x < 1.5) alpha *= smoothstep(38., 90., -mvPosition.z);
        vCol.a = alpha; mvPosition.xy += position.xy * size * step(0.004, alpha);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      varying vec2 vQ; varying vec4 vCol; varying float vSeed; uniform float uTime;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main() {
        float d = dot(vQ, vQ); if (d > 1.) discard;
        float n = vn(vQ * 2.3 + vSeed * 31. + vec2(0., -uTime * 0.25)) * 0.6 + vn(vQ * 5.1 - vSeed * 17.) * 0.4;
        float a = vCol.a * (1. - d) * sqrt(1. - d) * (0.3 + 0.7 * smoothstep(0.2, 0.8, n + 0.3 * (1. - d)));
        gl_FragColor = vec4(vCol.rgb * (0.82 + 0.3 * n + 0.2 * vQ.y), a);
        #include <fog_fragment>
      }`,
  });
  for (const k of ['uTime', 'uLaunch', 'uHullPos', 'uHullRot', 'uHullYaw', 'uSpray', 'uAmb', 'uSunCol']) mat.uniforms[k] = U[k];
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 6; q.dispose();
  return mesh;
}

// ---------- tapes, streamers and flags: ribbons taut until their release slide, then flying with a travelling wave ----------
// each: { a:[x,y,z], aHull:bool, b:[x,y,z], bHull:bool, mode: 'tape' (meets b half-way) | 'end' (b is the taut end),
//         len, rel (slide distance of release, negative = always free), fly:[x,y,z], width, color, seed }
function buildRibbons(list, U) {
  const SEG = 26, A = [], Bv = [], P = [], Cc = [], R = [], F = [], idx = []; let n = 0;
  for (const r of list) {
    const flag = (r.aHull ? 1 : 0) + (r.bHull ? 2 : 0) + (r.mode === 'tape' ? 0 : 4);
    for (let i = 0; i <= SEG; i++) for (const sd of [-1, 1]) {
      A.push(...r.a); Bv.push(...r.b); P.push(i / SEG, sd, r.len, r.seed); Cc.push(r.color.r, r.color.g, r.color.b); R.push(r.rel, flag, r.width, r.span || 22); F.push(...r.fly);
    }
    for (let i = 0; i < SEG; i++) { const o = n + i * 2; idx.push(o, o + 1, o + 2, o + 2, o + 1, o + 3); }
    n += (SEG + 1) * 2;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(A, 3)); g.setAttribute('aB', new THREE.Float32BufferAttribute(Bv, 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(P, 4)); g.setAttribute('aC', new THREE.Float32BufferAttribute(Cc, 3));
  g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 4)); g.setAttribute('aFly', new THREE.Float32BufferAttribute(F, 3)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: `
      attribute vec3 aB, aC, aFly; attribute vec4 aP, aR; uniform float uTime; uniform vec4 uLaunch; uniform vec3 uHullPos; uniform vec2 uHullRot, uHullYaw; uniform float uS;
      varying vec3 vC; varying vec3 vN; varying float vV;
      #include <fog_pars_vertex>
      vec3 hullX(vec3 p) { vec3 o_ = vec3(p.x * uHullRot.x - p.y * uHullRot.y, p.x * uHullRot.y + p.y * uHullRot.x, p.z); return uHullPos + vec3(o_.x * uHullYaw.x + o_.z * uHullYaw.y, o_.y, -o_.x * uHullYaw.y + o_.z * uHullYaw.x); }
      void main() {
        float q = aP.x, len = aP.z, sd = aP.w, flag = aR.y;
        float fa = mod(flag, 2.), fb = mod(floor(flag / 2.), 2.), ended = step(3.5, flag);
        vec3 a = mix(position, hullX(position), fa), b = mix(aB, hullX(aB), fb);
        vec3 tgt = mix((a + b) * 0.5, b, ended);
        float r = clamp((uS - aR.x) / aR.w, 0., 1.); r = r * r * (3. - 2. * r);
        vec3 d0 = tgt - a; float l0 = max(length(d0), 1e-3);
        vec3 dir = normalize(mix(d0 / l0, normalize(aFly + vec3(0., 0.25 * sin(uTime * 0.6 + sd * 20.), 0.2 * sin(uTime * 0.43 + sd * 9.))), r) + vec3(0., 1e-4, 0.));
        vec3 n1 = normalize(cross(dir, abs(dir.y) > 0.95 ? vec3(1., 0., 0.) : vec3(0., 1., 0.))), n2 = cross(dir, n1);
        float L = mix(l0, len, r), w = r * q * (0.5 + L * 0.035);
        float k1 = q * L * 0.42 - uTime * 4.2 + sd * 6.283, k2 = q * L * 0.27 - uTime * 3.1 + sd * 17.;
        float sagv = (1. - (1. - q) * (1. - q)) * l0 * 0.07 * (1. - ended);
        vec3 p = a + dir * (q * L) + n1 * (w * sin(k1)) + n2 * (w * 0.7 * sin(k2)); p.y -= r * q * q * L * 0.22 + sagv * (1. - r);
        float tw = q * L * 0.22 + sd * 6. + r * (uTime * 1.3 + 0.8 * sin(k1));
        vec3 wd = normalize(n1 * cos(tw) + n2 * sin(tw));
        vec4 mv0 = modelViewMatrix * vec4(p, 1.);
        float width = max(aR.z, -mv0.z * 0.0015) * mix(1., 0.45 + 0.55 * step(q, 0.999), step(aR.z, 0.3));
        p += wd * aP.y * width * 0.5;
        vC = aC; vN = normalize(normalMatrix * cross(dir, wd)); vV = q * L;
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      varying vec3 vC; varying vec3 vN; varying float vV; uniform vec3 uSunV, uSunCol, uAmb;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        float nl = abs(dot(normalize(vN + vec3(1e-5)), uSunV));
        vec3 col = vC * (uAmb * 0.75 + uSunCol * (0.22 + 0.5 * nl));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  for (const k of ['uTime', 'uLaunch', 'uHullPos', 'uHullRot', 'uHullYaw', 'uS', 'uSunV', 'uSunCol', 'uAmb']) mat.uniforms[k] = U[k];
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false;
  return mesh;
}

// ---------- confetti: flecks that burst from the paper ball at the bow and drift down, keyed to progress ----------
function buildConfetti(rng, U, cols, count, origin) {
  const base = [], kk = [], cc = [];
  for (let i = 0; i < count; i++) {
    base.push(rng.range(178, 262), rng.range(18, 62), rng.range(-30, 34)); kk.push(rng(), rng(), rng.range(0.8, 1.5), rng());
    const c = rng.pick(cols); cc.push(c.r, c.g, c.b);
  }
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1);
  g.index = q.index; g.setAttribute('position', q.attributes.position);
  g.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(base), 3)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(kk), 4));
  g.setAttribute('aC', new THREE.InstancedBufferAttribute(new Float32Array(cc), 3)); g.instanceCount = count;
  const mat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true, uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uOrigin: { value: new THREE.Vector3(...origin) } }]),
    vertexShader: `
      attribute vec3 aBase, aC; attribute vec4 aK; uniform float uTime, uU; uniform vec3 uOrigin, uSunCol, uAmb; varying vec3 vC;
      #include <fog_pars_vertex>
      void main() {
        float e = clamp((uU - ${(0.243 * E).toFixed(4)} - aK.x * 0.02) / 0.05, 0., 1.), fall = clamp((uU - ${(0.25 * E).toFixed(4)}) / 0.5, 0., 1.);
        float burst = 1. - (1. - e) * (1. - e);
        vec3 c = mix(uOrigin, aBase, burst); c.y -= fall * (22. + 20. * aK.y) - 10. * burst * (1. - burst);
        c.z += fall * 26. + sin(uTime * 1.3 + aK.w * 40.) * 1.2; c.x += cos(uTime * 1.1 + aK.y * 50.) * 1.2;
        c.y = max(c.y, min(c.x, 270.) * ${K.toFixed(5)} + 0.1);
        float vis = step(0.001, e) * (1. - smoothstep(0.62, 0.8, uU));
        vec4 mv = modelViewMatrix * vec4(c, 1.);
        float size = max(0.3 * aK.z, -mv.z * 0.0022) * vis * smoothstep(2.5, 7., -mv.z);     // a flake against the lens is a flat square: gone inside 2.5 m
        float a1 = uTime * (3. + 5. * aK.w) + aK.x * 30., a2 = uTime * (2. + 4. * aK.y) + aK.w * 11.;
        vec2 ax1 = vec2(cos(a1), sin(a1)), ax2 = vec2(-sin(a1), cos(a1)) * (0.25 + 0.75 * abs(cos(a2)));
        mv.xy += (ax1 * position.x + ax2 * position.y) * size;
        vC = aC * (uAmb * 0.8 + uSunCol * (0.25 + 0.5 * abs(cos(a2))));
        vec4 mvPosition = mv; gl_Position = projectionMatrix * mv;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      varying vec3 vC;
      #include <common>
      #include <fog_pars_fragment>
      void main() { gl_FragColor = vec4(vC, 1.);
        #include <fog_fragment>
      }`,
  });
  for (const k of ['uTime', 'uU', 'uSunCol', 'uAmb']) mat.uniforms[k] = U[k];
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; q.dispose();
  return mesh;
}

// ---------- foam sheet on the water: the hull's collar, churned track, and the launch wave ring ----------
function buildWake(U) {
  const g = new THREE.PlaneGeometry(520, 420, 1, 1).rotateX(-PI / 2).translate(-240, 0.12, 0);
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {}]),
    vertexShader: `varying vec2 vP;
      #include <fog_pars_vertex>
      void main() { vP = position.xz; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      varying vec2 vP; uniform float uTime, uBow; uniform vec4 uWake, uRing; uniform vec3 uSunCol, uAmb, uHullPos; uniform vec2 uHullYaw;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main() {
        float n = vn(vP * 0.35 + vec2(uTime * 0.2, 0.)) * 0.55 + vn(vP * 1.3 - vec2(0., uTime * 0.3)) * 0.45, n2 = vn(vP * 0.08 + 3.);
        // collar along the waterline of the immersed part of the hull, in her own frame (x from the counter to the stem, y to starboard),
        // so that it follows her when she swings on her chains
        vec2 dh = vP - uHullPos.xz, hl = vec2(dh.x * uHullYaw.x - dh.y * uHullYaw.y, dh.x * uHullYaw.y + dh.y * uHullYaw.x);
        float lx = clamp(hl.x, uWake.x, max(uWake.x, uWake.y)), tL = clamp(lx / 240., 0., 1.), ff = clamp((tL - 0.5) / 0.48, 0., 1.);
        float hbw = 14. * min(pow(max(smoothstep(0.035, 0.335, tL), 1e-4), 1.1), 1. - ff * ff);
        float ex = abs(hl.x - lx), dIn = abs(hl.y) - hbw, d = ex > 0.001 ? length(vec2(ex, max(dIn, 0.))) : dIn;
        float I = uWake.w;
        float collar = (1. - smoothstep(1.2, 6. + 32. * I, d)) * smoothstep(-3.5, -0.4, d) * step(1., uWake.y - uWake.x);
        // churned track from the slip foot out to the stern end
        float track = (1. - smoothstep(9., 26., abs(vP.y))) * smoothstep(uHullPos.x - 4., uHullPos.x + 30., vP.x) * (1. - smoothstep(-12., 4., vP.x)) * uWake.z * 0.6;
        // while she still has way on (she goes astern), the water closes behind her stem in a spreading V and a ragged core
        float bw = hl.x - 240., bq = max(bw, 0.), arm = 1. - smoothstep(0., 2.2 + bq * 0.13, abs(abs(hl.y) - (0.9 + bq * 0.3))), core = (1. - smoothstep(0., 2. + bq * 0.1, abs(hl.y))) * 0.8;
        float bowWake = max(arm, core) * smoothstep(-3., 2., bw) * (1. - smoothstep(10., 72., bw)) * uBow * 0.66 * (1. - smoothstep(-14., 2., vP.x));
        // the launch wave: an expanding crest
        vec2 rc = vP - uRing.xy; float rd = length(rc * vec2(1., 0.8));
        float rw = 9. + uRing.z * 0.035; float ring = (1. - smoothstep(0., rw, abs(rd - uRing.z + 6. * n2))) * uRing.w * (0.55 + 0.6 * n2) + (1. - smoothstep(0., rw * 0.6, abs(rd - uRing.z * 0.74 + 8. * n2))) * uRing.w * 0.4;
        ring *= 1. - smoothstep(-30., -2., vP.x);
        float wl_ = vP.x + 1.2 - 1.5 * sin(uTime * 0.7 + vP.y * 0.21) - 0.9 * sin(uTime * 1.13 - vP.y * 0.47);
        float wash = (1. - smoothstep(0.1, 2.3, abs(wl_))) * (1. - smoothstep(29., 31., abs(vP.y))) * (0.5 + 0.3 * sin(uTime * 0.7 + vP.y * 0.21 + 1.2));
        float we_ = length(vec2((vP.x + 12.) * 0.4, abs(abs(vP.y) - 7.) - 1.1)); wash = max(wash, (1. - smoothstep(0.25, 1.1 + 0.35 * sin(uTime * 1.4 + vP.x), we_)) * 0.42);
        float foam = max(max(max(collar * (0.9 + 0.6 * I), track), ring * 1.25), bowWake);
        float a = smoothstep(0.32, 0.7, foam * (0.6 + 0.9 * n) + (n2 - 0.5) * 0.2) * smoothstep(0., 0.2, foam);
        // the wash on the slip foot and round the way ends is a thin, broken lace of foam that the timber shows through
        float lace = vn(vP * 1.7 + vec2(uTime * 0.22, 0.3)) * 0.6 + vn(vP * 4.3 - vec2(0.2, uTime * 0.35)) * 0.4;
        a = max(a, wash * smoothstep(0.4, 0.62, lace + 0.12 * wash) * 0.6);
        a *= (1. - smoothstep(190., 208., abs(vP.y))) * smoothstep(-498., -470., vP.x);
        if (a < 0.004) discard;
        gl_FragColor = vec4((uAmb * 0.85 + uSunCol * 0.42) * (0.78 + 0.22 * n), a * 0.95);
        #include <fog_fragment>
      }`,
  });
  for (const k of ['uTime', 'uWake', 'uRing', 'uSunCol', 'uAmb', 'uHullPos', 'uHullYaw', 'uBow']) mat.uniforms[k] = U[k];
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

// ---------- the floating hull's image in the harbour ----------
// The sea kit mirrors the sky, not the scene, so she brings her own image: the hull shell again, turned over about the water plane and
// laid on the surface along each eye ray (every vertex is slid to where the ray to its mirror point meets the water), so it sits exactly
// where a true reflection would, is hidden by anything in front of the water, shivers with the ripples and thins out with depth.
function buildReflection(geo, U, liv) {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true, side: THREE.BackSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uBot: { value: liv.bot }, uTop: { value: liv.top }, uSheer: { value: liv.sheer }, uLine: { value: new THREE.Vector2(liv.paintY, liv.sheerW) } }]),
    vertexShader: `
      uniform mat4 uInner, uInnerInv; uniform float uTime; uniform vec3 uSunV, uSunCol, uAmb, uBot, uTop, uSheer; uniform vec2 uLine;
      varying vec3 vCol; varying vec3 vK; varying vec2 vW;
      #include <fog_pars_vertex>
      void main() {
        vec3 sp = (uInnerInv * modelMatrix * vec4(position, 1.)).xyz, cam = (uInnerInv * vec4(cameraPosition, 1.)).xyz;
        vec3 m = vec3(sp.x, -sp.y, sp.z), to = m - cam;
        vec3 side = normalize(vec3(-to.z, 0., to.x) + vec3(1e-4, 0., 0.));
        float rip = (sin(sp.y * 1.7 + uTime * 1.9 + sp.x * 0.11) + 0.6 * sin(sp.y * 4.1 - uTime * 2.6 + sp.z * 0.23)) * (0.12 + 0.06 * max(sp.y, 0.));
        m += side * rip;
        float t = (cam.y - 0.16) / max(cam.y - m.y, 0.5);
        vec3 w = cam + (m - cam) * t;
        vec3 nv = normalize(mat3(viewMatrix) * mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.));
        float sheerY = 30. + 3.5 * pow(max(0., (position.x / 240. - 0.6) / 0.4), 2.) + 1.5 * pow(max(0., (0.3 - position.x / 240.) / 0.3), 2.);
        vec3 base = mix(uBot, uTop, smoothstep(-0.4, 0.4, position.y - uLine.x));
        base = mix(base, uSheer, (1. - smoothstep(0.3, 0.7, abs(sheerY - 2.6 - uLine.y * 0.5 - position.y) / max(uLine.y, 0.05))) * step(0.01, uLine.y));
        vCol = base * (uAmb * 0.55 + uSunCol * (0.12 + 0.62 * max(dot(nv, uSunV), 0.)));
        vK = vec3(sp.y, w.x, length(w.xz - cam.xz)); vW = w.xz;
        vec4 mvPosition = viewMatrix * uInner * vec4(w, 1.);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: `
      varying vec3 vCol; varying vec3 vK; varying vec2 vW; uniform float uTime;
      #include <common>
      #include <fog_pars_fragment>
      void main() {
        if (vK.x < 0. || vK.y > -1.) discard;                    // nothing of her under the water, nothing on the land
        // the image is cut into bright bands by the ripples (bands across the line of sight, wandering), and thins toward her rail
        float wob = sin(vW.x * 0.19 + uTime * 0.7) + sin(vW.y * 0.23 - uTime * 0.5);
        float band = 0.5 + 0.5 * sin(vK.z * 1.35 + wob * 1.6 - uTime * 1.9), band2 = 0.5 + 0.5 * sin(vK.z * 3.1 - wob * 2.3 + uTime * 2.7);
        float cut = mix(1., smoothstep(0.25, 0.7, band) * (0.6 + 0.4 * band2), smoothstep(1., 9., vK.x));
        float fall = 1. - smoothstep(2., 31., vK.x);
        float a = 0.82 * fall * sqrt(fall) * smoothstep(0., 0.8, vK.x) * (0.22 + 0.78 * cut);
        gl_FragColor = vec4(vCol * vec3(0.5, 0.6, 0.66), a);
        #include <fog_fragment>
      }`,
  });
  for (const k of ['uTime', 'uSunV', 'uSunCol', 'uAmb', 'uInner', 'uInnerInv']) mat.uniforms[k] = U[k];
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 2; mesh.visible = false;
  return mesh;
}

// ---------- paper ball (kusudama) at the stem: two gored hemispheres on a top hinge ----------
function buildBall(U, colA, colB, colIn) {
  const g = new THREE.SphereGeometry(1.5, 12, 8, 0, PI).toNonIndexed(), p = g.attributes.position, col = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i += 3) {
    const cx = (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3, cz = (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3, cy = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    const gore = Math.floor((Math.atan2(cz, cx) / PI) * 6 + 100), band = Math.abs(cy) > 1.32;
    const c = band ? colIn : (gore % 2 ? colA : colB);
    for (let k = 0; k < 3; k++) { col[(i + k) * 3] = c.r; col[(i + k) * 3 + 1] = c.g; col[(i + k) * 3 + 2] = c.b; }
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = stdMat({ vertexColors: true, roughness: 0.8, metalness: 0, side: THREE.DoubleSide }, U);
  const group = new THREE.Group(), pivots = [];
  for (const s of [0, 1]) {
    const pv = new THREE.Group(), m = new THREE.Mesh(g, mat); m.position.y = -1.5; m.rotation.y = s * PI; m.castShadow = true;
    pv.position.y = 1.5; pv.add(m); group.add(pv); pivots.push(pv);
  }
  return { group, pivots };
}

// ---------- wire bridles from the chain piles to the hull: slack bights on the timber until each pile is snatched ----------
function buildBridles(C) {
  const N = 34, pos = new Float32Array(6 * 2 * N * 2 * 3), idx = [];
  for (let w = 0; w < 12; w++) for (let i = 0; i < N - 1; i++) { const o = (w * N + i) * 2; idx.push(o, o + 1, o + 2, o + 2, o + 1, o + 3); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: C.wire, side: THREE.DoubleSide, fog: true })); mesh.frustumCulled = false;
  const pt = [0, 0, 0], P0 = [0, 0, 0];
  // eyes[i]: hull point in slip coords now; heads[i]: [x, pay]; lens[i]: wire length; cam: camera in slip coords
  function update(eyes, heads, lens, cam) {
    for (let w = 0; w < 6; w++) {
      const pz = PILES[w][1], sg = Math.sign(pz), E = eyes[w], hx = heads[w][0], gone = hx < PILES[w][0] - 0.01;
      if (gone) { P0[0] = hx; P0[1] = slipY(hx) + 0.5; P0[2] = sg * 15.6; } else { P0[0] = PILES[w][0] - 1; P0[1] = slipY(PILES[w][0]) + 4.6; P0[2] = pz - sg * 1.2; }
      const D = Math.hypot(E[0] - P0[0], E[1] - P0[1], E[2] - P0[2]), slack = gone ? 0 : Math.max(0, lens[w] - D);
      const lie = Math.min(1, slack / 8), amp = Math.min(2.4, slack * 0.045);
      for (let i = 0; i < N; i++) {
        const q = i / (N - 1), gq = sstep(0, 0.14, q) * (1 - sstep(0.8, 1, q)) * lie;
        pt[0] = lerp(P0[0], E[0], q) + Math.cos(q * 31 + w) * amp * 0.5 * gq;
        const gy = Math.max(pt[0] * K, -0.4) + 0.14, ly = lerp(P0[1], E[1], q);
        pt[1] = lerp(ly, Math.min(ly, gy), gq) - (1 - lie) * Math.sin(q * PI) * D * 0.012;
        pt[2] = lerp(P0[2], E[2], q) + Math.sin(q * TAU * 3.5 + w * 1.7) * amp * gq + sg * 2.2 * gq;
        const dist = Math.hypot(pt[0] - cam.x, pt[1] - cam.y, pt[2] - cam.z), wd = Math.max(0.16, dist * 0.0013) * 0.5;
        for (let r = 0; r < 2; r++) {
          const o = (((w * 2 + r) * N + i) * 2) * 3;
          pos[o] = pt[0]; pos[o + 1] = pt[1] - (r ? wd : 0); pos[o + 2] = pt[2] - (r ? 0 : wd);
          pos[o + 3] = pt[0]; pos[o + 4] = pt[1] + (r ? wd : 0); pos[o + 5] = pt[2] + (r ? 0 : wd);
        }
      }
    }
    g.attributes.position.needsUpdate = true;
  }
  return { mesh, update };
}

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, brief = opts.frame === 'brief';
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const rgb = (r, g, b) => new THREE.Color(r, g, b), mul = (c, k) => c.clone().multiplyScalar(k);
  const timber = mul(pal[4], 0.62).lerp(rgb(0.2, 0.11, 0.05), 0.35).lerp(rgb(0.2, 0.18, 0.15), 0.42);
  const C = {
    oxide: mul(pal[0], 0.92), oxideDark: mul(pal[0], 0.55), dove: mul(pal[1], 0.82), pink: mul(pal[2], 0.85), steel: mul(pal[3], 0.9), steelDark: mul(pal[3], 0.45),
    bronze: mul(pal[4], 1.1), timber, timberPale: mul(pal[4], 0.8).lerp(pal[6], 0.2).lerp(rgb(0.42, 0.4, 0.36), 0.4), timberDark: mul(timber, 0.68), grease: rgb(0.17, 0.14, 0.1),
    deck: mul(pal[4], 0.5).lerp(pal[3], 0.3), stone: mul(pal[3], 0.85).lerp(rgb(0.36, 0.32, 0.27), 0.45), dark: rgb(0.03, 0.03, 0.035), black: rgb(0.004, 0.004, 0.005),
    iron: rgb(0.105, 0.085, 0.072), rust: rgb(0.34, 0.15, 0.065), rope: rgb(0.42, 0.35, 0.22), wire: rgb(0.05, 0.045, 0.04), smoke: rgb(0.8, 0.8, 0.8), rustDust: rgb(0.62, 0.31, 0.16),
  };
  const lr = rng.fork('slipway-livery')(), livName = opts.livery || (lr < 0.72 ? 'dove' : lr < 0.82 ? 'black' : 'mail');
  // painted for the day: red lead below, a bright boot-topping band at the paint line, the company's colour above and a sheer line
  // under the rail (dove grey with a red band and a pale sheer; black with red and a white sheer; buff with teal and a broad white one)
  const liv = { bot: new THREE.Color('#8a3828').lerp(rgb(0.17, 0.115, 0.1), 0.3), top: new THREE.Color('#767d86'), boot: new THREE.Color('#b8321f'), sheer: rgb(0.84, 0.84, 0.8), paintY: 10.2 + rng.range(-0.6, 0.8), bootW: 1.3, sheerW: 0.9, rust: rng.range(0.4, 0.75), deck: mul(pal[0], 0.6).lerp(C.steel, 0.35) };
  if (livName === 'black') { liv.top = new THREE.Color('#2a3038'); liv.sheer = rgb(0.86, 0.86, 0.82); liv.sheerW = 0.9; liv.bootW = 1.1; }
  if (livName === 'mail') { liv.top = new THREE.Color('#cdb588'); liv.boot = mul(pal[5], 0.5); liv.bootW = 1.5; liv.sheer = rgb(0.84, 0.83, 0.79); liv.sheerW = 2.3; liv.rust *= 0.9; }
  const fill = opts.fill ?? 0.6;
  const U = {
    uTime: { value: 0 }, uFill: { value: new THREE.Color('#7C97B0').multiplyScalar(0.9 * fill) }, uKick: { value: new THREE.Color('#B88A6A').multiplyScalar(0.8 * fill) }, uBounceV: { value: new THREE.Vector3(0, -1, 0) },
    uFront: { value: new THREE.Vector2(-1e4, -1e4) }, uHullPos: { value: new THREE.Vector3() }, uHullRot: { value: new THREE.Vector2(1, 0) }, uHullYaw: { value: new THREE.Vector2(1, 0) }, uS: { value: 0 }, uU: { value: 0 },
    uLaunch: { value: new THREE.Vector4() }, uSpray: { value: new THREE.Vector2() }, uWake: { value: new THREE.Vector4() }, uRing: { value: new THREE.Vector4(-165, 0, 0, 0) },
    uBow: { value: 0 }, uInner: { value: new THREE.Matrix4() }, uInnerInv: { value: new THREE.Matrix4() },
    uSunV: { value: new THREE.Vector3(0, 1, 0) }, uSunCol: { value: new THREE.Color('#FFF1D6').multiplyScalar(0.95) }, uAmb: { value: new THREE.Color('#9DB6CE').multiplyScalar(0.9) },
  };
  const F = (x, y, z) => (brief ? [x, y, z] : [z, y, 115 - x]), Fd = (x, y, z) => (brief ? [x, y, z] : [z, y, -x]);
  const sunSlip = new THREE.Vector3(-0.2364, 0.4067, 0.8824);
  const setSun = (d, colour) => { if (d) { if (brief) sunSlip.set(d[0], d[1], d[2]); else sunSlip.set(-d[2], d[1], d[0]); sunSlip.normalize(); } if (colour) U.uSunCol.value.set(colour).multiplyScalar(0.95); };
  setSun(opts.sun);

  const object = new THREE.Group(), inner = new THREE.Group(); object.add(inner);
  if (!brief) { inner.rotation.y = PI / 2; inner.position.set(0, 0, 115); }
  // hull pose from the launch clock (slip coordinates)
  const poseAt = (u, o = {}) => {
    const s = slideOf(u), sternY = sternYOf(s), bowY = bowYOf(s), pitch = Math.asin(Math.max(-1, Math.min(1, (bowY - sternY) / HL)));
    const sternX = 10 - s * Math.cos(Math.atan(K)), speed = (slideOf(u + 0.004) - slideOf(u - 0.004)) / 0.008 / 80;     // metres a second at the pace the world flies her run
    o.s = s; o.sternX = sternX; o.sternY = sternY; o.bowX = sternX + HL * Math.cos(pitch); o.bowY = bowY; o.pitch = pitch; o.speed = speed; o.c = Math.cos(pitch); o.sn = Math.sin(pitch);
    return o;
  };
  const POSE = {}, POSE2 = {}, RING = {};
  const hullAt = (hx, hy, hz, P = rest) => [P.sternX + hx * P.c - hy * P.sn, P.sternY + hx * P.sn + hy * P.c, hz];
  const rest = poseAt(0);

  // hull, fittings, propellers
  const hullG = new THREE.Group(); hullG.rotation.order = 'YZX'; inner.add(hullG);
  const swing = opts.swing === -1 ? -1 : 1;
  const PIV = 0.12;   // where along the hull (0 stern, 1 bow) the swing pivots
  const hullMat = hullMaterial(U, liv, opts.caustics ?? 1); hullMat.side = THREE.DoubleSide;
  await ctx.yield();
  const hull = new THREE.Mesh(await buildHullGeometry(ctx.yield), hullMat); hull.castShadow = true; hull.receiveShadow = true; hullG.add(hull);
  await ctx.yield();
  const fitMat = stdMat({ vertexColors: true, roughness: 0.72, metalness: 0.2, side: THREE.DoubleSide }, U);
  const fittings = new THREE.Mesh(await buildFittings(rng, C, liv, ctx.yield), fitMat); fittings.castShadow = true; fittings.receiveShadow = true; hullG.add(fittings);
  await ctx.yield();
  const propGeo = propellerGeometry(C), propMat = stdMat({ vertexColors: true, roughness: 0.3, metalness: 0.55, side: THREE.DoubleSide }, U), props = [];
  for (const sg of [1, -1]) { const m = new THREE.Mesh(propGeo, propMat); m.position.set(14.2, 4.8, sg * 5.6); m.scale.z = sg; m.castShadow = true; hullG.add(m); props.push(m); }
  await ctx.yield();

  // slip, gantries, loose timber
  inner.add(buildSlip(U, C));
  await ctx.yield();
  const jibTips = [], gan = buildGantries(rng, U, C, jibTips), T = new Timbers(), boxGeo = new THREE.BoxGeometry(1, 1, 1), timMat = timberMaterial(U);
  await ctx.yield();
  buildGroundTimber(rng, C, T); buildStagings(rng, C, T, gan.S, hullAt);
  await ctx.yield();
  const prism = prismGeometry(), steelMat = steelMaterial(U), lattice = gan.S2.build(prism, steelMat);
  await ctx.yield();
  const loose = T.build(boxGeo, timMat);
  lattice.castShadow = false; loose.castShadow = false;   // the shadow map is spent on the hull, the shores and the main gantry members
  inner.add(gan.S.build(prism, steelMat), lattice, loose); prism.dispose();
  await ctx.yield();
  const TC = new Timbers(); buildCradle(rng, C, TC); const cradle = TC.build(boxGeo, timMat); hullG.add(cradle); boxGeo.dispose();
  await ctx.yield();
  const shores = buildShores(rng, U, C, hullAt); inner.add(shores);
  await ctx.yield();

  // chains, bridles, sprites
  const chains = buildChains(rng, U, C); inner.add(chains.mound, chains.links);
  await ctx.yield();
  const bridles = buildBridles(C); inner.add(bridles.mesh);
  await ctx.yield();
  const sprites = buildSprites(rng, U, C, detail); sprites.material.uniforms.uChain = chains.uChain; inner.add(sprites);
  const sGo = CHAIN_S, wireLen = sGo.map((s) => Math.hypot(s - 10, 6, 6) + 1.5);
  const eyeLocal = PILES.map((p) => [p[0], 3, Math.sign(p[1]) * (halfBreadth(p[0] / HL, 3) + 0.1)]);
  await ctx.yield();

  // tapes, streamers, flags
  const five = ['#D8262C', '#F1EEE4', '#6B3FA0', '#F2C230', '#2E9E5B'].map((h) => new THREE.Color(h));
  const scheme = (opts.tapes || (rng.chance(0.75) ? 'five' : 'redwhite')) === 'five' ? five : [five[0], five[1]];
  const ribbons = [], stem = [239.5, station(0.998).yR - 0.1, 0], dkY = (hx) => station(hx / HL).yR - 0.2;
  for (const sg of [1, -1]) {
    const tw = gan.tops.filter((t) => Math.sign(t[2]) === sg), tip = jibTips.filter((t) => Math.sign(t[2]) === sg);
    const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - 1.2, a[2]];
    const targets = [tw[6], tw[5], tw[4], mid(tw[5], tw[6]), mid(tw[4], tw[5]), tip[6], tip[5], tw[3], mid(tw[3], tw[4]), tip[4]];
    targets.forEach((tg, i) => {
      const hx = tg[0] >= 250 ? 239.5 : Math.max(196, 238 - (250 - tg[0]) * 0.55 - rng.range(0, 4));
      const a = hx > 239 ? [stem[0], stem[1], sg * 0.3] : [hx, dkY(hx), sg * halfBreadth(hx / HL, dkY(hx))];
      const aw = hullAt(a[0], a[1], a[2]), half = Math.hypot(tg[0] - aw[0], tg[1] - aw[1], tg[2] - aw[2]) / 2;
      const color = scheme[(i + (sg > 0 ? 0 : 2)) % scheme.length], rel = rng.range(2, 30), seed = rng();
      const cap = sg > 0 ? (tg[0] >= 228 ? 16 : 30) : (Math.abs(tg[2]) - 9) / 0.78;
      ribbons.push({ a: tg, aHull: false, b: a, bHull: true, mode: 'tape', len: Math.min(half, cap), rel, fly: [rng.range(-0.2, 0.2), -0.62, 0.75], width: 0.55, color, seed });
      ribbons.push({ a, aHull: true, b: tg, bHull: false, mode: 'tape', len: Math.min(half, 42), rel, fly: [0.8, -0.38, 0.3 + sg * 0.25], width: 0.55, color, seed: seed + 0.37 });
    });
    for (let i = 0; i < 8; i++) {     // paper streamers thrown from the bow rail
      const hx = rng.range(204, 238), a = [hx, dkY(hx), sg * halfBreadth(hx / HL, dkY(hx))];
      ribbons.push({ a, aHull: true, b: [a[0], a[1] - 0.2, a[2]], bHull: true, mode: 'end', len: rng.range(12, 28), rel: rng.range(1, 46), span: 14, fly: [rng.range(0.4, 0.8), -0.55, sg * rng.range(0.1, 0.5) + 0.25], width: 0.24, color: rng.pick(five), seed: rng() });
    }
  }
  const ballAt = [242.2, 28.5, 0];
  for (let i = 0; i < 10; i++) ribbons.push({ a: ballAt, aHull: true, b: [ballAt[0], ballAt[1] - 0.1, 0], bHull: true, mode: 'end', len: rng.range(8, 18), rel: 47 + rng.range(0, 9), span: 9,
    fly: [rng.range(0.1, 0.7), -0.85, rng.range(-0.5, 0.6)], width: 0.24, color: rng.pick(five), seed: rng() });
  const flagCols = rng.shuffle([five[0], five[1], C.pink.clone(), five[3]]);
  [[230.5, 11], [6, 11], [120, 14]].forEach(([hx, h], i) => { const a = [hx, station(hx / HL).yR - 1.1 + h - 1.5, 0];
    ribbons.push({ a, aHull: true, b: [a[0], a[1], 0.2], bHull: true, mode: 'end', len: 6, rel: -1e4, fly: [-0.15, -0.14, 1], width: 2.8, color: flagCols[i], seed: rng() }); });
  await ctx.yield();
  inner.add(buildRibbons(ribbons, U));
  await ctx.yield();
  const ball = buildBall(U, scheme[0], scheme[1], rgb(0.75, 0.55, 0.15)); ball.group.position.set(ballAt[0], ballAt[1], 0); hullG.add(ball.group);
  inner.add(buildConfetti(rng, U, [...five, C.pink, five[1]], Math.round(520 * detail), hullAt(ballAt[0], ballAt[1], 0, poseAt(0.255 * E))));
  await ctx.yield();
  if (opts.wake !== false) inner.add(buildWake(U));
  await ctx.yield();
  const mirror = opts.reflection === false ? null : buildReflection(hull.geometry, U, liv); if (mirror) hullG.add(mirror);
  await ctx.yield();

  // ---------- the launch clock ----------
  let cur = 0;
  const heads = PILES.map((p) => [p[0], 0]), eyes = PILES.map(() => [0, 0, 0]), camL = new THREE.Vector3(0, 40, 300), tv = new THREE.Vector3();
  function apply(u, time) {
    const P = poseAt(u, POSE), s = P.s, afloat = sstep(282, 318, s);
    P.sternY += 0.25 * Math.sin(time * 0.45) * afloat; P.bowY += 0.3 * Math.sin(time * 0.37 + 1) * afloat;
    P.pitch = Math.asin((P.bowY - P.sternY) / HL); P.c = Math.cos(P.pitch); P.sn = Math.sin(P.pitch);
    // afloat she swings on her chains about a point near the stern, once her stem is through the portal's place: the bow falls off to the
    // shaded side and stands beside the ring, so her sunlit flank is seen past the portal
    const yaw = swing * (0.14 * sstep(292, 334, s) + 0.012 * Math.sin(time * 0.21) * afloat), cy = Math.cos(yaw), sy = Math.sin(yaw);
    const hx0 = P.sternX + HL * PIV * (1 - cy) * P.c, hz0 = HL * PIV * sy * P.c;
    hullG.position.set(hx0, P.sternY, hz0); hullG.rotation.set(0.012 * Math.sin(time * 0.31) * afloat, yaw, P.pitch);
    const speedN = sat(P.speed / 14);
    cradle.position.y = -17 * sstep(284, 312, s);
    U.uHullPos.value.set(hx0, P.sternY, hz0); U.uHullRot.value.set(P.c, P.sn); U.uHullYaw.value.set(cy, sy); U.uS.value = s; U.uU.value = u;
    U.uLaunch.value.set(P.sternX, P.bowX, speedN, s > 0.05 ? 1 : 0);
    // wedges ripple up the slip at ue .068-.098; the shore wave races up from the stern, overtakes the camera at about ue .095 and then
    // runs 40 m ahead of it all the way up the nave, a little faster than the flight, so the cradle opens to the light on both sides
    const ue = u / E;     // the brief's clock for what happens while the camera is under her
    U.uFront.value.set(ue < 0.068 ? -1e4 : lerp(0, 300, (ue - 0.068) / 0.03), ue < 0.088 ? -1e4 : (ue < 0.103 ? lerp(-10, 100, (ue - 0.088) / 0.015) : 100 + (ue - 0.103) * 1150));
    for (let i = 0; i < 6; i++) {
      const d = Math.max(0, s - sGo[i]), hx = PILES[i][0] - d; heads[i][0] = hx; heads[i][1] = sat(d / CHAIN_LEN * 1.5);
      chains.uChain.value[i].set(hx, PILES[i][0], Math.sign(PILES[i][1]), heads[i][1]);
      const el = eyeLocal[i], ox = el[0] * P.c - el[1] * P.sn, oz = el[2]; eyes[i][0] = hx0 + ox * cy + oz * sy; eyes[i][1] = P.sternY + el[0] * P.sn + el[1] * P.c; eyes[i][2] = hz0 - ox * sy + oz * cy;
    }
    bridles.update(eyes, heads, wireLen, camL);
    const ang = Math.max(0, s - 150) * 0.2; props[0].rotation.x = ang; props[1].rotation.x = -ang + 0.6;
    const open = sstep(0.243, 0.272, ue), wob = 0.07 * Math.sin(time * 2.3) * open;
    ball.pivots[0].rotation.x = -(open * 1.2 + wob); ball.pivots[1].rotation.x = open * 1.2 - wob;
    ball.group.rotation.z = 0.05 * Math.sin(time * 1.1) - speedN * 0.22;
    // white water: stern plunge, bow drop, collar, churned track, the launch wave ring
    const spS = Math.max(sstep(104, 182, s) * (1 - sstep(215, 290, s)), 0.42 * sstep(24, 64, s) * (1 - sstep(150, 200, s)) * (0.45 + 0.55 * speedN)), spB = sstep(262, 282, s) * (1 - sstep(296, 319, s));
    U.uSpray.value.set(spS, spB);
    let x0 = P.sternX, x1 = P.sternX;
    if (P.sternY < 0 && P.bowY < 0) x1 = P.bowX; else if (P.sternY < 0) x1 = P.sternX + HL * (-P.sternY) / (P.bowY - P.sternY); else if (P.bowY < 0) { x0 = P.bowX - HL * (-P.bowY) / (P.sternY - P.bowY); x1 = P.bowX; }
    U.uWake.value.set(x0 - P.sternX, Math.min(x1, 0) - P.sternX, (0.35 + 0.65 * speedN) * sstep(30, 110, s), Math.max(spS, spB * 0.8) + 0.12 * speedN);
    U.uBow.value = sstep(272, 292, s) * sat(0.3 + P.speed / 6);
    if (mirror) mirror.visible = s > 250;
    const ring = waveAt(u, RING); U.uRing.value.set(-165, 0, ring.radius, ring.strength);
    return P;
  }
  function waveAt(u, o = {}) {
    const s = slideOf(u), strength = sstep(172, 192, s) * (1 - sstep(296, 320, s) * 0.7);
    o.x = -165; o.z = 0; o.radius = Math.max(0, s - 172) * 2.1; o.strength = strength; o.height = 1.6 * strength;
    return o;
  }

  const radius = 100, height = 70, center = new THREE.Vector3(...F(115, 24, 0));

  // the warm bounce off the sunlit slip comes from below, on the sun's side
  const setBounce = (camera) => { tv.set(sunSlip.x * 0.7, -0.8, sunSlip.z * 0.7).normalize().transformDirection(inner.matrixWorld).transformDirection(camera.matrixWorldInverse); U.uBounceV.value.copy(tv); };
  apply(0, 0);
  // out between the east towers x 230 / 270 on one right-hand arc of 52 m radius about (211,52), climbing to 42 m over the plate racks
  // and the east yard; round until the heading is south-west and she lies broadside ahead; straight at her flank as she runs, down to
  // 30 m; in between the east towers x 110 / 150 as her bow sweeps past, and left on a 70 m arc onto the centreline behind her
  const LOOP = [[218.5, 18.1, 0.6], [236, 21.2, 6.4], [250.4, 24.2, 18.1], [259.8, 27.4, 34], [263, 30.8, 52.1], [259.7, 34.2, 70.3], [250.2, 37.6, 86.2], [235.8, 40.9, 97.7], [218.3, 42, 103.5],
    [199.8, 42, 102.8], [182.8, 42, 95.7], [169.3, 39.9, 83], [159.1, 37.4, 67.5], [149, 34.8, 52], [138.9, 32.1, 36.4], [127.6, 29.8, 21.7], [113, 27.5, 10.3], [96, 25.3, 3.1]];
  const anchors = {
    portalSeat: { position: F(-58, 13, 0), normal: Fd(1, 0, 0) },
    flyThrough: [F(-40, 8, 0), F(10, 5, 0), F(200, 15, 0), ...LOOP.map((p) => F(p[0], p[1], p[2])), F(77.6, 23, 0), F(30, 13, 0), F(-58, 13, 0)],
    entry: F(-40, 8, 0), naveStart: F(10, 5, 0), naveEnd: F(200, 15, 0), turnCentre: F(211, 42, 52), straightStart: F(77.6, 23, 0),
    hullPoi: (u) => F(...hullAt(120, 15, 0, poseAt(u))), bowTip: (u) => F(...hullAt(240, 33.5, 0, poseAt(u))), sternTip: (u) => F(...hullAt(0, 30, 0, poseAt(u))),
    doveBaskets: [F(246, slipY(246) + 1.2, 12), F(246, slipY(246) + 1.2, -12)], launchStand: F(282, slipY(282), 0),
    gantryTops: gan.tops.map((t) => F(t[0], t[1], t[2])), chainPiles: PILES.map((p) => F(p[0], slipY(p[0]) + 2.5, p[1])),
    viewpoints: {
      entry: { position: F(-40, 8, 0), target: F(10, 14, 0) },
      quarter: { position: F(177, 41.5, 91), target: F(...hullAt(150, 20, 0, poseAt(0.62))) },
      cradle: { position: F(96, 25.3, 3.1), target: F(20, 8, 0) },
    },
  };
  const toBrief = (P) => ({ s: P.s, sternX: P.sternX, sternY: P.sternY, bowX: P.bowX, bowY: P.bowY, pitch: P.pitch, speed: P.speed });
  return {
    object, radius, height, center, extent: 165, anchors, ground: true, groundY: -0.05, livery: livName,
    setProgress(u) { cur = sat(u); },
    setSun, slideAt: (u) => slideOf(sat(u)), hullState: (u) => toBrief(poseAt(sat(u))), waveAt: (u, out) => waveAt(sat(u), out),
    // a point of the moving hull (hull coordinates: hx from the counter, hy above the keel, hz to starboard) in the frame in use; no allocation
    pointOnHull(u, hx, hy, hz, out) {
      const P = poseAt(sat(u), POSE2), x = P.sternX + hx * P.c - hy * P.sn, y = P.sternY + hx * P.sn + hy * P.c;
      return brief ? out.set(x, y, hz) : out.set(hz, y, 115 - x);
    },
    setTone(t = {}) {
      if (t.amb) U.uAmb.value.set(t.amb).multiplyScalar(0.9);
      if (t.fill) U.uFill.value.set(t.fill).multiplyScalar(0.9 * fill);
      if (t.kick) U.uKick.value.set(t.kick).multiplyScalar(0.8 * fill);
    },
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera) {
        inner.updateWorldMatrix(true, false);
        U.uInner.value.copy(inner.matrixWorld); U.uInnerInv.value.copy(inner.matrixWorld).invert();
        camL.setFromMatrixPosition(camera.matrixWorld); inner.worldToLocal(camL);
        tv.copy(sunSlip).transformDirection(inner.matrixWorld).transformDirection(camera.matrixWorldInverse); U.uSunV.value.copy(tv);
        setBounce(camera);
      }
      apply(cur, time);
    },
    dispose() { shores.customDepthMaterial?.dispose(); },
  };
}
