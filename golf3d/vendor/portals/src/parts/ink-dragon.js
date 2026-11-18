// THE INK DRAGON: hero set piece of "Mountains of Wet Ink" (world id: ink-dragon).
//
// A 320 m dragon drawn as ONE calligraphic brushstroke that swims along a spline ("course"), with a
// head, antlers, whiskers, mane, four clawed legs and a tail tuft made of separate short strokes, a
// cloud of flung ink droplets that land as blots and stay, and the ENSO: a 14 m brushed circle that the
// tail tip paints in mid-air (wet and fat at the start, dry-brush where it almost closes, nine drips).
// Default layout (local space, +Y up, front = +Z, the camera arrives from +Z flying toward -Z):
//   - the enso stands at (0, 60, 0) facing +Z; its opening is 7.2 m in radius (seat a 14 m portal in it);
//   - the dragon pours down the approach line from behind/above the camera, passes just in front of the
//     ring, dives under it, climbs the left side behind the ring plane, arcs over the top and ends with
//     its head at upper right (+X, +Y), turned back toward the viewer. Its tail flick paints the enso.
//
// SIZE     radius ~80 m, height ~125 m around the enso (the approach course reaches z = +640 m).
// COST     ~10.5k triangles, 4 draw calls (droplets, body, strokes, enso; renderOrder 1-4), no lights,
//          one 400x3 float texture updated per frame (~400 cheap spline lookups on the CPU), build ~60 ms.
//          Everything is alpha-blended without depth writes: draw opaque world geometry first (default).
// LIGHTING none. Sumi style: every fragment outputs ink colour with alpha = ink density, normal alpha
//          blending, depthWrite off, so paper (sky, mist, anything pale) shows through as in a wash.
//          Scene fog is supported (fade to fog colour = fade to paper); opts.fade adds an alpha fade.
//          Nothing here is HDR: by the brief only the sun, lantern and portal interior may bloom.
//
// HOW THE STYLE IS DONE (for matching it in the world):
//   density = load (dark at the head / crest, paler away) x wet-edge ring (darker toward |v| = 1)
//           x ragged edge (noise-shifted smoothstep at the stroke border)
//           x dry-brush "flying white": value noise stretched ~25:1 ALONG the stroke, thresholded by a
//             dryness that rises toward the stroke's end, so the ink breaks into bristle tracks
//           x granulation: fine object-anchored noise, +-10 %, shimmering a few percent with time.
//   colour = mix(#2C2F30, #101112, density); alpha = density. Thin strokes never go below ~1.5 px
//   (widened with distance in the vertex shader, alpha reduced to compensate).
//
// opts
//   palette     hex[7], default the brief's: [paper, wash1, wash2, wash3, ink2, ink, vermilion]
//   length      body length in metres (320)          girth    width multiplier (1)
//   droplets    number of droplet/blot sprites (900)  fade     [near, far] alpha fade distances (off)
//   redEye      true: the dragon's eye is dotted in vermilion (the one spot of colour on it)
//   tone        { glsl, paper }: for worlds that compose in display-linear colour. glsl must define
//               vec4 compose(vec3 paper, vec3 colour, float coverage) returning the scene-linear colour and alpha to
//               blend; paper is the display-linear paper colour (THREE.Color); the palette is then display-linear too
//   ensoRadius  inner radius of the enso (7.25); a second, diluted dragon paints a wider ring around the first
//   course      optional array of [x,y,z] (local) to use instead of the default approach; see setCourse
//
// API on the returned hero (besides the contract fields)
//   setProgress(u)       0..1 scripted finale on the current course: fly in, tail flick paints the enso
//                        (u 0.72-0.92), drips run (u 0.8-1), dragon settles over the ring. If you never
//                        call any setter the piece runs a demo loop from `time` (for the part viewer).
//   setTravel(m)         head position in metres along the course (drive this yourself for the long flight)
//   setEnso(f, drips)    f 0..1 = tail flick + ring reveal, drips 0..1 = how far the nine drips have run
//   setGhost(g)          0..1 density of the not-yet-painted part of the ring (a ghost wash that the tail then loads); default 0
//   setCourse(pts, {finale:true})  replace the course; with finale (default) the built-in end section
//                        (approach to the ring, loop around it) is appended. Returns hero.timing.
//   timing               { courseLength, flickTravel, endTravel, startTravel } in metres of travel
//   mistBand             Vector4 (lo, hi, hideBelow 0..1, whiteOut 0..1) in WORLD heights: the world's mist deck hides the ink
//   fadeRange            Vector2 [near, far] alpha fade by distance, live (same as opts.fade)
//   head, headDir, tail  Vector3 (local), refreshed every update: use head for the "floods ink within
//                        120 m" paint front. getBodyPoint(s, target) gives any point s metres behind it.
//
// anchors (local space)
//   portalSeat  { position, facing, radius }   centre of the enso, normal toward the arriving camera
//   flyThrough  ordered points down the ring axis; clear by >= 6 m once progress >= 0.93 (before that
//               the dragon's body runs down this very line ahead of the camera: keep 60 m behind its tail)
//   viewpoints  { approach, reveal, side, below }   good camera positions looking at `center`
//   headRest    where the head ends (upper right, turned back), ensoStart = where the stroke begins
//   course      the control points in use
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#EFE8D8', '#D5D1C4', '#A3A49D', '#5F6462', '#2C2F30', '#101112', '#C8321E'];
const ROWS = 400;            // spine texture width
const HEAD_LEN = 28;         // metres of spine in front of the neck (the head lives there)
const TRAIL = 80;            // metres of spine kept behind the tail tip (tuft, lingering blots)

const GLSL_COMMON = /* glsl */`
  varying float vMistK;
  //TONE
  #ifdef DISPLAY_COMPOSE
  uniform vec3 uPaperD;
  #endif
  float hash21(vec2 p){ p = fract(p*vec2(123.34, 345.45)); p += dot(p, p+34.345); return fract(p.x*p.y); }
  float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
    return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y); }
  // pigment granulation: fine two-octave grain, weaker where the ink is fully loaded (p in metres)
  float granulate(float dens, vec2 p){ float g = vnoise(p*5.3)*0.55 + vnoise(p*12.1 + 7.)*0.45;
    return dens*(1. - mix(0.3, 0.05, smoothstep(0.55, 1., dens))*(1. - g)); }
`;
const GLSL_SPINE = /* glsl */`
  uniform highp sampler2D uSpine; uniform vec3 uSpineInfo;   // s0, 1/ds, rows
  vec3 spineFetch(float s, int row){
    float f = clamp((s - uSpineInfo.x)*uSpineInfo.y, 0., uSpineInfo.z - 1.001);
    int i = int(floor(f)); float t = f - float(i);
    return mix(texelFetch(uSpine, ivec2(i, row), 0).xyz, texelFetch(uSpine, ivec2(i+1, row), 0).xyz, t);
  }
  // world mist: a band between two world heights hides ink; .z hides everything under the band's top (seen
  // from above the cloud sea); .w is a white-out for everything farther than a few tens of metres
  uniform vec4 uMistBand; varying float vMistK;
  float mistK(vec3 w, float dist){
    float band = smoothstep(uMistBand.x, uMistBand.x + 22., w.y)*(1. - smoothstep(uMistBand.y - 22., uMistBand.y, w.y));
    band *= smoothstep(15., 90., dist);                // inside the deck, what is close still shows
    float below = (1. - smoothstep(uMistBand.y - 30., uMistBand.y, w.y))*uMistBand.z;
    return (1. - max(band, below))*(1. - uMistBand.w*smoothstep(60., 220., dist));
  }
`;

// ---------- course: a 1 m table of points along a Catmull-Rom curve ----------
function buildCourseTable(points) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'centripetal');
  curve.arcLengthDivisions = Math.min(1600, points.length * 80);
  const len = curve.getLength(), n = Math.max(2, Math.ceil(len));
  const pts = curve.getSpacedPoints(n), tab = new Float32Array((n + 1) * 3);
  for (let i = 0; i <= n; i++) { tab[i * 3] = pts[i].x; tab[i * 3 + 1] = pts[i].y; tab[i * 3 + 2] = pts[i].z; }
  return { tab, n, len, step: len / n };
}
function courseAt(c, a, out, o) {
  const f = a / c.step, t = c.tab;
  if (f <= 0) { for (let k = 0; k < 3; k++) out[o + k] = t[k] + (t[3 + k] - t[k]) * f; return; }
  if (f >= c.n) { const j = c.n * 3, e = f - c.n; for (let k = 0; k < 3; k++) out[o + k] = t[j + k] + (t[j + k] - t[j - 3 + k]) * e; return; }
  const i = Math.floor(f), u = f - i, j = i * 3;
  for (let k = 0; k < 3; k++) out[o + k] = t[j + k] + (t[j + 3 + k] - t[j + k]) * u;
}

// ---------- stroke batch: short brush marks carried by the body ----------
// Each stroke is a polyline in body-frame coordinates (f forward, n up/dorsal, b sideways), attached at
// body distance `at`, billboarded about its own axis in the vertex shader.
function makeStrokeBatch() {
  const pos = [], dir = [], aA = [], aB = [], aC = [], idx = [];
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3()], false, 'centripetal');
  const p = new THREE.Vector3(), q = new THREE.Vector3();
  const widthAt = (w, u) => { const x = u * (w.length - 1), i = Math.min(w.length - 2, Math.floor(x)), t = x - i, s = t * t * (3 - 2 * t); return w[i] + (w[i + 1] - w[i]) * s; };
  function add(pts, widths, o = {}) {
    const segs = o.segs ?? 6, at = o.at ?? 0, seed = o.seed ?? 0.5, dens = o.d ?? 1, kind = o.kind ?? 0, fl = o.fl ?? 0, hide = o.hide ?? 0, dry = o.dry ?? 0;
    curve.points = pts.map((a) => new THREE.Vector3(a[0], a[1], a[2]));
    let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1], pts[i][2] - pts[i - 1][2]);
    const base = pos.length / 3;
    for (let i = 0; i <= segs; i++) {
      const u = i / segs; curve.getPoint(u, p); curve.getTangent(u, q);
      const hw = widthAt(widths, u);
      for (let sgn = -1; sgn <= 1; sgn += 2) {
        pos.push(p.x, p.y, p.z); dir.push(q.x, q.y, q.z);
        aA.push(at, sgn, hw, u); aB.push(seed, dens, kind, fl); aC.push(hide, len, dry);
      }
      if (i < segs) { const k = base + i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
    }
  }
  function dot(f, n, b, r, o = {}) { add([[f - r, n, b], [f + r, n, b]], [o.ry ?? r, o.ry ?? r], { ...o, segs: 1, kind: o.kind ?? 3 }); }
  function geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('aDir', new THREE.Float32BufferAttribute(dir, 3));
    g.setAttribute('aA', new THREE.Float32BufferAttribute(aA, 4));
    g.setAttribute('aB', new THREE.Float32BufferAttribute(aB, 4));
    g.setAttribute('aC', new THREE.Float32BufferAttribute(aC, 3));
    g.setIndex(idx);
    return g;
  }
  return { add, dot, geometry };
}

const FLICK = [0.25, 1, 0.8, 0.45, 0.0];           // width profile of a quick flick (x its width)
const flick = (w) => FLICK.map((x) => x * w);

// ---------- the strokes that are not the body: head, mane, legs, whiskers, tail tuft ----------
async function buildDragonStrokes(rng, L, hwBody, opts, pause = async () => {}) {
  const B = makeStrokeBatch(), R = (a, b) => rng.range(a, b);
  const K = R(1.4, 1.6);                                   // head scale
  const sc = (pts) => pts.map((p) => [p[0] * K, p[1] * K, p[2] * K]);
  const H = (pts, w, o) => B.add(sc(pts), w.map((x) => x * K), { at: 0, seed: rng(), ...o });

  // --- mane on the back of the neck and all along the spine (drawn first: it sits behind the head)
  for (let s = 1.5; s < L * 0.9; s += R(1.0, 1.9) * (s < 40 ? 0.7 : 1 + s / L)) {
    const hw = hwBody(s), neck = 1 + 1.3 * (1 - smoothstep(0, 45, s));
    const len = hw * R(0.8, 2.2) * neck * (0.55 + 0.9 * Math.abs(Math.sin(s * 0.19 + K * 9))), side = R(-0.45, 0.45) * hw, lean = R(0.8, 1.5);
    B.add([[0, hw * 0.55, side], [-len * 0.5 * lean, hw * 0.6 + len * 0.5, side * 1.3], [-len * (0.9 + lean * 0.6), hw * 0.5 + len * R(0.3, 0.8), side * 1.6]],
      flick(R(0.3, 0.55) * (0.6 + hw * 0.22)), { at: s, seed: rng(), d: R(0.7, 1), fl: len * 0.16, dry: R(0.5, 1), segs: 5 });
  }
  await pause();
  // --- belly fins: shorter, paler flicks under the body
  for (let s = 14; s < L * 0.8; s += R(4, 8)) {
    const hw = hwBody(s), len = hw * R(0.8, 1.5), side = R(-0.3, 0.3) * hw;
    B.add([[0, -hw * 0.6, side], [-len * 0.6, -hw * 0.7 - len * 0.5, side], [-len * 1.5, -hw * 0.6 - len * 0.55, side]],
      flick(R(0.3, 0.5)), { at: s, seed: rng(), d: R(0.4, 0.65), fl: len * 0.15, dry: 1, segs: 5 });
  }
  await pause();
  // --- four legs with claw flourishes and elbow flames
  const legAt = [L * R(0.14, 0.17), L * R(0.19, 0.22), L * R(0.55, 0.6), L * R(0.62, 0.66)];
  for (let li = 0; li < 4; li++) {
    const s = legAt[li], hw = hwBody(s), sd = li % 2 ? -1 : 1, g = 0.75 + hw * 0.22;
    const sw = R(-2.5, 2.5), reach = R(0.9, 1.15) * g;
    const hip = [0, -hw * 0.35, sd * hw * 0.5];
    const knee = [(-2.5 + sw) * reach, -7.5 * reach, sd * 6.2 * reach];
    const ankle = [(6.5 + sw) * reach, -10.2 * reach, sd * 8.2 * reach];
    // legs are calligraphic flicks like the claws: pressed at the hip and knee, tapering, running dry toward the end
    B.add([hip, [(1.5 + sw * 0.4) * reach, -4.2 * reach, sd * 4.2 * reach], knee], [0.5 * g, 0.82 * g, 0.56 * g, 0.34 * g], { at: s, seed: rng(), dry: 0.4, segs: 8 });
    B.add([knee, [(2.5 + sw) * reach, -10.6 * reach, sd * 7.4 * reach], ankle], [0.46 * g, 0.5 * g, 0.34 * g, 0.26 * g], { at: s, seed: rng(), dry: 0.4, segs: 8 });
    for (let c = 0; c < 4; c++) {                               // claws: press, sweep, hook
      const sp = (c - 1.5) * 0.9, cl = R(3.2, 4.4) * g;
      B.add([ankle, [ankle[0] + cl * 0.55, ankle[1] + 0.9 * g - Math.abs(sp) * 0.3, ankle[2] + sd * sp * 1.1 * g], [ankle[0] + cl, ankle[1] - 1.9 * g, ankle[2] + sd * sp * 2.0 * g]],
        [0.5 * g, 0.42 * g, 0.26 * g, 0.0], { at: s, seed: rng(), fl: 0.25, dry: 0.3, segs: 6 });
    }
    B.add([ankle, [ankle[0] - 1.6 * g, ankle[1] - 1.2 * g, ankle[2]], [ankle[0] - 2.6 * g, ankle[1] - 2.8 * g, ankle[2]]], [0.4 * g, 0.3 * g, 0], { at: s, seed: rng(), dry: 0.3, segs: 4 }); // spur
    for (let c = 0; c < 4; c++) {                               // flame wisps streaming from the elbow
      const wl = R(4, 8) * g;
      B.add([knee, [knee[0] - wl * 0.5, knee[1] + R(-1, 2), knee[2] + sd * R(0, 1.5)], [knee[0] - wl, knee[1] + R(0, 3.5), knee[2] + sd * R(0, 2.5)]],
        flick(R(0.16, 0.3) * g), { at: s, seed: rng(), d: R(0.75, 1), fl: wl * 0.14, dry: 0.7, segs: 5 });
    }
  }
  // --- tail tuft: a fan of long dry strokes streaming off the tip
  for (let i = 0, n = rng.int(8, 11); i < n; i++) {
    const a = (i / (n - 1) - 0.5) * 2, len = R(12, 26), up = a * R(4, 8), sdw = R(-5, 5);
    B.add([[0, 0, 0], [-len * 0.4, up * 0.5, sdw * 0.4], [-len, up, sdw]], flick(R(0.3, 0.6)),
      { at: L - R(1, 8), seed: rng(), d: R(0.6, 0.95), fl: len * 0.1, dry: 1, segs: 7 });
  }

  await pause();
  // --- HEAD (profile: f forward, n up). Cheek mane first, skull over it.
  for (let i = 0; i < 14; i++) {
    const sd = i % 2 ? -1 : 1, n0 = R(-1.6, 2.6), len = R(6, 12);
    H([[R(0, 4), n0, sd * 1.5], [-len * 0.45, n0 + R(-1, 2), sd * R(2.2, 3.4)], [-len, n0 + R(-2.5, 3.5), sd * R(2.5, 4.5)]],
      flick(R(0.5, 0.8)), { d: R(0.75, 1), fl: len * 0.09, dry: 0.9, segs: 6 });
  }
  H([[-3, 0.1, 0], [2, 1.0, 0], [6, 1.7, 0], [8.6, 1.5, 0]], [1.9, 2.5, 2.35, 1.6], { segs: 8 });                 // cranium
  H([[7, 1.35, 0], [10.5, 0.95, 0], [13.4, 1.25, 0], [15.3, 2.1, 0]], [1.6, 1.25, 1.0, 1.15, 0.6], { segs: 8 }); // snout, upturned nose
  H([[2.5, -0.8, 0], [6, -2.3, 0], [10, -3.0, 0], [13.8, -2.3, 0]], [1.3, 1.1, 0.8, 0.55, 0.22], { segs: 8 });   // lower jaw, mouth open
  H([[5.5, -1.3, 0], [9.5, -1.35, 0], [12.2, -0.7, 0], [13.2, -1.1, 0]], [0.3, 0.36, 0.26, 0.06], { d: 0.6, fl: 0.25, segs: 6 }); // tongue
  for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) {                                                         // teeth
    const f = 9.2 + i * 1.15, l = i === 4 ? 1.5 : R(0.7, 1.0);
    H([[f, 0.15, sd * 0.7], [f + 0.1, 0.15 - l * 0.6, sd * 0.7], [f - 0.15, 0.15 - l, sd * 0.7]], [0.3, 0.2, 0.0], { segs: 3 });
    if (i < 4) H([[f + 0.5, -2.2, sd * 0.6], [f + 0.6, -1.7, sd * 0.6], [f + 0.5, -1.3, sd * 0.6]], [0.26, 0.17, 0.0], { segs: 3 });
  }
  for (let i = 0, n = rng.int(5, 7); i < n; i++) {                                                                // beard
    const f = 3.5 + i * 1.3, l = R(3, 6.5), b = R(-0.5, 0.5);
    H([[f, -2.7, b], [f - l * 0.35, -2.9 - l * 0.6, b], [f - l * 0.95, -3.0 - l * 0.85, b * 2]], flick(R(0.4, 0.6)), { d: R(0.7, 1), fl: l * 0.1, dry: 0.9, segs: 5 });
  }
  await pause();
  const tines = rng.int(2, 3), hornL = R(0.9, 1.25);
  for (const sd of [-1, 1]) {
    const b = sd * 1.25;
    H([[14.7, 2.3, sd * 0.5], [15.7, 3.1, sd * 0.7], [15.0, 3.8, sd * 0.85]], [0.36, 0.3, 0.1], { segs: 4 });    // nostril curl
    H([[4.8, 2.5, sd * 1.0], [6.8, 3.4, sd * 1.4], [9.2, 2.9, sd * 1.3]], [0.3, 0.75, 0.5, 0.08], { segs: 5 });  // brow
    H([[3, 2.0, sd * 1.9], [0, 3.5, sd * 3.1], [-3.4, 2.9, sd * 3.8]], flick(0.85), { fl: 0.4, dry: 0.5, segs: 5 }); // ear fin
    const hp = [[4, 3.0, b], [1, 5.4 * hornL, b * 1.5], [-3.5 * hornL, 7.6 * hornL, b * 2.0], [-8.5 * hornL, 8.4 * hornL, b * 2.4]];
    H(hp, [0.72, 0.6, 0.42, 0.24, 0.03], { segs: 9, dry: 0.25 });                                                 // antler beam
    for (let t = 0; t < tines; t++) {
      const r = hp[1 + t] || hp[2], tl = R(2.6, 4.2) * hornL, off = t === 2 ? -3.5 : 0;
      H([[r[0] + off, r[1] + (t === 2 ? 0.6 : 0), r[2]], [r[0] + off - 0.4, r[1] + tl * 0.6, r[2] + sd * 0.3], [r[0] + off - 2.2, r[1] + tl, r[2] + sd * 0.6]], [0.42, 0.3, 0.03], { segs: 5, dry: 0.25 });
    }
    // long whisker: out from the snout, then streaming back along the body
    const wl = R(26, 40);
    B.add(sc([[13, 0.6, sd * 1.0], [15.5, 2.6, sd * 3.8], [9, 5.2, sd * 6.5], [-6, 4.4, sd * 8], [-wl * 0.6, 1.5, sd * 6.5], [-wl, -1, sd * 5]]),
      [0.34 * K, 0.3 * K, 0.24 * K, 0.16 * K, 0.0], { at: 0, seed: rng(), fl: 2.2, dry: 0.35, segs: 26 });
    B.add(sc([[11.5, -2.9, sd * 0.6], [12.5, -4.6, sd * 1.6], [8, -6, sd * 2.4], [1, -5.4, sd * 2.6]]), [0.22 * K, 0.2 * K, 0.12 * K, 0.0], { at: 0, seed: rng(), fl: 1.0, dry: 0.3, segs: 12 }); // chin barbel
    // the eye: paper reserved inside the black, dotted in vermilion; hidden from the far side
    const ef = 7.1 * K, en = 1.85 * K, eb = sd * 2.0 * K;
    B.dot(ef, en, eb, 1.02 * K, { ry: 0.78 * K, kind: 1, hide: sd, seed: rng() });
    B.dot(ef + 0.18 * K, en, eb * 1.02, 0.5 * K, { ry: 0.5 * K, kind: opts.redEye ? 2 : 3, hide: sd, seed: rng() });
    B.dot(ef + 0.26 * K, en, eb * 1.04, 0.2 * K, { ry: 0.2 * K, kind: 3, hide: sd, seed: rng() });
  }
  await pause();
  return B.geometry();
}

// ---------- the enso: ring ribbon + nine drips + flung dots, one geometry ----------
// attributes: position (base point, local to the ring centre), aE (a|t, v, kind, seed), aF (len, halfwidth, startA, delay)
function buildEnsoGeometry(rng, E) {
  const pos = [], aE = [], aF = [], idx = [];
  const NA = 260, sweep = Math.PI * 2 - E.gap;
  const w1 = rng.range(0, 6.28), w2 = rng.range(0, 6.28);
  const width = (a) => (1.5 + 2.1 * Math.exp(-Math.pow((a - 0.04) / 0.055, 2)) + 1.0 * smoothstep(0.0, 0.3, a) * (1 - smoothstep(0.35, 0.95, a)) + 0.12 * Math.sin(a * 23 + w1)) * E.wScale;
  const inner = (a) => E.rIn + 0.1 * Math.sin(a * 9 + w2) + E.drift * (a - 0.5);
  const arcLen = sweep * (E.rIn + 1);
  for (let i = 0; i <= NA; i++) {
    const a = i / NA, th = E.th0 - a * sweep, ri = inner(a), w = width(a);
    for (let k = 0; k < 2; k++) {
      const r = ri + w * k;
      pos.push(Math.cos(th) * r, Math.sin(th) * r, 0); aE.push(a, k * 2 - 1, 0, 0.37); aF.push(arcLen, w * 0.5, 0, 0);
    }
    if (i < NA) { const b = i * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  }
  // drips hang from the lower outer edge; each starts once the stroke has passed its anchor
  const drips = [];
  for (let i = 0; i < 9; i++) {
    let a; do { a = rng(); } while (Math.sin(E.th0 - a * sweep) > -0.35);
    drips.push(a);
  }
  drips.sort((x, y) => x - y);
  const DS = 10;
  drips.forEach((a, i) => {
    const th = E.th0 - a * sweep, r = inner(a) + width(a) * 0.72, x = Math.cos(th) * r, y = Math.sin(th) * r;
    const len = rng.range(2.2, 6.5) * (a < 0.15 ? 1.5 : 1) * (0.6 + 0.4 * -Math.sin(th)), hw = rng.range(0.13, 0.26) * (a < 0.15 ? 1.4 : 1), seed = rng(), delay = rng.range(0, 0.45);
    const base = pos.length / 3;
    for (let j = 0; j <= DS; j++) for (let k = -1; k <= 1; k += 2) { pos.push(x, y, 0.02); aE.push(j / DS, k, 1, seed); aF.push(len, hw, a, delay); }
    for (let j = 0; j < DS; j++) { const b = base + j * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
  });
  // dots flung off the brush, mostly near the wet start, always outside the opening
  for (let i = 0, n = rng.int(26, 38); i < n; i++) {
    const a = rng.chance(0.6) ? rng.range(0, 0.12) : rng.range(0.1, 0.9), th = E.th0 - a * sweep + rng.range(-0.05, 0.25);
    const r = inner(a) + width(a) + rng.range(0.3, 1) * rng.range(0.3, 6), size = rng.range(0.12, 0.55) * (rng.chance(0.15) ? 2 : 1), seed = rng();
    const base = pos.length / 3, x = Math.cos(th) * r, y = Math.sin(th) * r;
    for (let k = 0; k < 4; k++) { pos.push(x, y, 0.03); aE.push(k % 2 ? 1 : -1, k < 2 ? -1 : 1, 2, seed); aF.push(size, size, a, 0); }
    idx.push(base, base + 1, base + 2, base + 1, base + 3, base + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aE', new THREE.Float32BufferAttribute(aE, 4));
  g.setAttribute('aF', new THREE.Float32BufferAttribute(aF, 4));
  g.setIndex(idx);
  return { geometry: g, inner, width, sweep };
}

// ---------- shaders ----------
const INK_OUT = /* glsl */`
  vec3 col = mix(uInk2, uInk, clamp(dens*1.25 - 0.25, 0., 1.));
  alpha *= (1. - smoothstep(uFade.x, uFade.y, vDepth))*smoothstep(0.25, 0.7, vMistK);   // decisive: inked or bare paper, never a half-erased ghost
  if (alpha < 0.004) discard;
  col = mix(col, tint, tintAmt);
  #ifdef DISPLAY_COMPOSE
    gl_FragColor = compose(uPaperD, col, alpha);     // colours are display-linear; see opts.tone
  #else
    gl_FragColor = vec4(col, alpha);
  #endif
`;
const BODY_VS = /* glsl */`
  ${GLSL_SPINE}
  uniform float uGirth;
  varying vec2 vUv; varying float vBack, vHw, vDepth;
  #include <fog_pars_vertex>
  void main(){
    float s = position.x;
    vec3 C = spineFetch(s, 0), Nn = spineFetch(s, 1);
    vec3 fwd = normalize(spineFetch(s-0.9, 0) - spineFetch(s+0.9, 0));
    vec4 wp = modelMatrix*vec4(C, 1.);
    vec3 wf = normalize(mat3(modelMatrix)*fwd), wn = normalize(mat3(modelMatrix)*Nn);
    vec3 side = normalize(cross(wf, cameraPosition - wp.xyz));
    vBack = dot(side, wn);
    float hw = position.z*uGirth;
    wp.xyz += side*position.y*hw*length(modelMatrix[0].xyz);
    vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
    vUv = vec2(s, position.y); vHw = hw; vDepth = -mvPosition.z; vMistK = mistK(wp.xyz, vDepth);
    #include <fog_vertex>
  }`;
const BODY_FS = /* glsl */`
  uniform vec3 uInk, uInk2; uniform float uTime, uLen, uSeed, uBelly; uniform vec2 uFade;
  varying vec2 vUv; varying float vBack, vHw, vDepth;
  ${GLSL_COMMON}
  #include <fog_pars_fragment>
  void main(){
    float s = vUv.x, v = vUv.y, t = clamp(s/uLen, 0., 1.);
    float m = v*vHw;                                   // metres across the stroke
    float q = v*clamp(vBack*1.7, -1., 1.);             // +1 on the dorsal edge, -1 on the belly
    float n1 = vnoise(vec2(s*0.33 + uSeed, m*1.3));
    float edge = 1. - smoothstep(0.80 + 0.13*n1, 0.96 + 0.04*n1, abs(v));
    // dry-brush: the load runs out toward the tail, with one or two dry patches where the brush lifted
    float dryp = vnoise(vec2(s*0.021 + uSeed*3., 0.5));
    float dry = smoothstep(0.42, 1., t)*0.6 + smoothstep(0.62, 0.9, dryp)*0.4*smoothstep(0.1, 0.22, t)*(1. - smoothstep(0.6, 0.8, t)) + smoothstep(0.975, 1., t)*0.3;
    float st = vnoise(vec2(s*0.05 + uSeed*7., m*3.1))*0.65 + vnoise(vec2(s*0.4, m*7.7 + 3.))*0.35;
    float keep = smoothstep(dry - 0.16, dry + 0.10, st + 0.12);
    float load = mix(1., 0.7, smoothstep(0.08, 0.9, t));
    float belly = smoothstep(0.25, -0.45, q)*smoothstep(0.03, 0.12, t)*(1. - smoothstep(0.6, 0.85, t))*uBelly;
    float dens = load*mix(1., 0.4, belly);
    // belly scales: staggered crescents opening toward the tail
    vec2 sc = vec2(q*vHw/1.35, s/2.3); sc.y += 0.5*mod(floor(sc.x), 2.);
    vec2 f = fract(sc) - vec2(0.5, 0.0);
    float arc = 1. - smoothstep(0.05, 0.11, abs(length(f) - 0.46));
    dens += arc*0.5*belly;
    float ring = smoothstep(0.55, 0.9, abs(v));        // wet edge
    dens = mix(dens, min(1., dens + 0.42), ring*0.85);
    dens += 0.3*smoothstep(0.3, 0.8, q)*(1. - dens);   // spine line
    dens = clamp(dens, 0., 1.);
    dens = granulate(dens, vec2(s, m) + uSeed)*(1. + 0.03*sin(uTime*1.7 + s*0.9 + m*3.));
    dens = clamp(dens, 0., 1.);
    float alpha = dens*edge*keep*smoothstep(-2.5, 0.5, s);
    vec3 tint = vec3(0.); float tintAmt = 0.;
    ${INK_OUT}
    #include <fog_fragment>
  }`;
const STROKE_VS = /* glsl */`
  ${GLSL_SPINE}
  attribute vec3 aDir, aC; attribute vec4 aA, aB;
  uniform float uTime, uPix;
  varying vec4 vS, vK; varying float vDepth, vThin;
  #include <fog_pars_vertex>
  void main(){
    float s = aA.x - position.x, u = aA.w, seed = aB.x;
    vec3 C = spineFetch(s, 0), Nn = normalize(spineFetch(s, 1));
    vec3 fwd = normalize(spineFetch(s-0.8, 0) - spineFetch(s+0.8, 0));
    Nn = normalize(Nn - fwd*dot(Nn, fwd)); vec3 Bv = cross(fwd, Nn);
    float ph = uTime*(1.5 + fract(seed*7.3)) - u*3.2 + seed*40.;
    float fl = aB.w*u*u;
    vec3 P = C + Nn*(position.y + fl*sin(ph)) + Bv*(position.z + fl*0.8*cos(ph*0.83 + 1.3));
    vec3 dir = normalize(fwd*aDir.x + Nn*aDir.y + Bv*aDir.z);
    vec4 wp = modelMatrix*vec4(P, 1.);
    vec3 toCam = cameraPosition - wp.xyz; float dist = length(toCam);
    vec3 side = normalize(cross(normalize(mat3(modelMatrix)*dir), toCam));
    float hw = aA.z*length(modelMatrix[0].xyz), hwUse = hw;
    if (aB.z < 0.5) hwUse = max(hw, min(dist*uPix, hw*4.) * step(0.001, hw));
    vThin = hw > 0. ? hw/hwUse : 1.;
    if (aC.x != 0. && dot(mat3(modelMatrix)*Bv*aC.x, toCam) < -0.2*dist) hwUse = 0.;   // far-side eye
    wp.xyz += side*aA.y*hwUse;
    vec4 mvPosition = viewMatrix*wp; gl_Position = projectionMatrix*mvPosition;
    vS = vec4(u, aA.y, seed, aB.y); vK = vec4(aB.z, aC.y, aC.z, aA.z); vDepth = -mvPosition.z; vMistK = mistK(wp.xyz, vDepth);
    #include <fog_vertex>
  }`;
const STROKE_FS = /* glsl */`
  uniform vec3 uInk, uInk2, uPaper, uRed; uniform vec2 uFade;
  varying vec4 vS, vK; varying float vDepth, vThin;
  ${GLSL_COMMON}
  #include <fog_pars_fragment>
  void main(){
    float u = vS.x, v = vS.y, seed = vS.z, dens = vS.w, alpha;
    vec3 tint = vec3(0.); float tintAmt = 0.;
    if (vK.x > 0.5) {                                  // dots: paper reserve, vermilion, ink
      vec2 p = vec2(u*2. - 1., v); float r = length(p), ang = atan(p.y, p.x);
      float R = 0.8 + 0.05*sin(ang*3. + seed*20.) + 0.03*sin(ang*7. + seed*50.);
      alpha = 1. - smoothstep(R - 0.12, R, r);
      if (vK.x < 1.5) { tint = uPaper; tintAmt = 1. - smoothstep(R - 0.42, R - 0.2, r); } else if (vK.x < 2.5) { tint = uRed*(0.9 + 0.2*smoothstep(0.9, 0.3, r)); tintAmt = 1.; }
      dens = 1.;
    } else {
      float m = v*vK.w, Lm = u*vK.y;
      float n1 = vnoise(vec2(Lm*0.5 + seed*17., m*2. + seed*5.));
      float edge = 1. - smoothstep(0.72 + 0.18*n1, 0.97, abs(v));
      float dry = vK.z*smoothstep(0.2, 1., u)*1.1;
      float st = vnoise(vec2(Lm*0.09 + seed*31., m*4.5 + seed*13.))*0.7 + vnoise(vec2(Lm*0.7, m*9. + seed))*0.3;
      float keep = smoothstep(dry - 0.16, dry + 0.1, st + 0.12);
      dens = granulate(clamp(dens*(0.94 + 0.06*smoothstep(0.45, 0.9, abs(v))), 0., 1.), vec2(Lm, m) + seed*37.);
      alpha = dens*edge*keep*mix(1., vThin, 0.55);
      float capU = vK.w/max(vK.y, 0.001), cx = min(u, 1. - u)/max(capU, 0.0001);    // round the blunt ends
      if (cx < 1.) alpha *= 1. - smoothstep(0.78, 1., length(vec2(1. - cx, v)));
    }
    ${INK_OUT}
    #include <fog_fragment>
  }`;
const DROP_VS = /* glsl */`
  ${GLSL_SPINE}
  attribute vec4 iA, iB, iC;      // (s0, span, phase, seed) (dir, dist) (size, density, flyFrac, speck)
  uniform float uFlow, uPix; uniform vec3 uEnsoC, uEnsoN;
  varying vec2 vP; varying vec4 vD; varying float vDepth;
  #include <fog_pars_vertex>
  void main(){
    float a = fract(uFlow/iA.y + iA.z);
    float s = iA.x + a*iA.y;
    vec3 Cu = spineFetch(s, 0), Cr = spineFetch(s, 2);
    float fly = clamp(a/iC.z, 0., 1.), flyE = 1. - pow(1. - fly, 3.);
    vec3 P = mix(Cu, Cr, fly) + iB.xyz*iB.w*flyE - vec3(0., 1., 0.)*iB.w*0.12*fly*fly;
    float landed = smoothstep(0.75, 1.0, fly);
    float spread = mix(1., smoothstep(0.0, 0.05, a - iC.z) , 0.55);
    float size = mix(0.22 + 0.25*iC.w, iC.x*spread, landed);
    vec4 wp = modelMatrix*vec4(P, 1.);
    float dist = distance(cameraPosition, wp.xyz);
    size = max(size*length(modelMatrix[0].xyz), dist*uPix*1.3);
    vec3 rel = P - uEnsoC; float radial = length(rel - uEnsoN*dot(rel, uEnsoN));
    float vis = smoothstep(0., 0.012, a)*(1. - smoothstep(0.84, 1., a))*smoothstep(16., 40., dist)*smoothstep(17., 27., radial);
    vec4 mvPosition = viewMatrix*wp; mvPosition.xy += position.xy*size*step(0.01, vis);
    gl_Position = projectionMatrix*mvPosition;
    vP = position.xy; vD = vec4(iA.w, iC.y*vis, landed, iC.w); vDepth = -mvPosition.z; vMistK = mistK(wp.xyz, vDepth);
    #include <fog_vertex>
  }`;
const DROP_FS = /* glsl */`
  uniform vec3 uInk, uInk2; uniform vec2 uFade; uniform float uTime;
  varying vec2 vP; varying vec4 vD; varying float vDepth;
  ${GLSL_COMMON}
  #include <fog_pars_fragment>
  void main(){
    float seed = vD.x, r = length(vP), ang = atan(vP.y, vP.x);
    float lobes = 0.07*sin(ang*2. + seed*17.) + 0.05*sin(ang*3. + seed*41.) + 0.03*sin(ang*7. + seed*5.);
    float spikes = pow(max(0., sin(ang*(4. + floor(seed*5.)) + seed*30.)), 8.)*0.25*step(0.8, fract(seed*9.));
    float R = mix(0.8, 0.66 + lobes + spikes, vD.z);
    float inside = 1. - smoothstep(R - 0.07, R + 0.02, r);
    float ring = smoothstep(R - 0.3, R - 0.04, r);
    float g = vnoise(vP*5. + seed*60.);
    float dens = mix(1., vD.y*(0.72 + 0.28*ring)*(0.8 + 0.4*g), vD.z*(1. - vD.w)) * step(0.0001, vD.y);
    dens = clamp(dens, 0., 1.);
    float alpha = dens*inside*min(1., vD.y*40.);
    vec3 tint = vec3(0.); float tintAmt = 0.;
    ${INK_OUT}
    #include <fog_fragment>
  }`;
const ENSO_VS = /* glsl */`
  attribute vec4 aE, aF;
  uniform float uReveal, uDrip, uTime, uPix;
  varying vec4 vE, vF; varying float vDepth, vMistK;
  #include <fog_pars_vertex>
  void main(){
    vec3 p = position; vE = aE; vF = aF;
    float kind = aE.z, ms = length(modelMatrix[0].xyz);
    float dist = distance(cameraPosition, (modelMatrix*vec4(position, 1.)).xyz);
    if (kind > 0.5 && kind < 1.5) {                    // drip: runs down from its anchor
      float t = aE.x, started = step(aF.z + 0.03, uReveal);
      float g = clamp((uDrip - aF.w)/(1. - aF.w), 0., 1.); g = 1. - pow(1. - g, 2.2);
      g = started*(0.05 + 0.95*g)*(1. + 0.02*sin(uTime*0.7 + aE.w*40.));
      float len = aF.x*g;
      float prof = (0.55 + 0.45*(1. - t))*(1. + 1.6*exp(-pow((t - 0.9)/0.07, 2.)));
      float hw = max(aF.y*prof, dist*uPix/ms)*(1. - smoothstep(0.955, 1., t))*started;
      p.y -= t*len; p.x += aE.y*hw + 0.1*sin(t*len*0.9 + aE.w*30.)*t;
    } else if (kind > 1.5) {                           // flung dot
      float on = smoothstep(aF.z, aF.z + 0.02, uReveal);
      p.xy += aE.xy*max(aF.x, dist*uPix*1.2/ms)*on;
    }
    vec4 mvPosition = modelViewMatrix*vec4(p, 1.); gl_Position = projectionMatrix*mvPosition;
    vDepth = -mvPosition.z; vMistK = 1.;
    #include <fog_vertex>
  }`;
const ENSO_FS = /* glsl */`
  uniform vec3 uInk, uInk2; uniform vec2 uFade; uniform float uReveal, uTime, uGhost;
  varying vec4 vE, vF; varying float vDepth;
  ${GLSL_COMMON}
  #include <fog_pars_fragment>
  void main(){
    float kind = vE.z, alpha, dens = 1.;
    if (kind < 0.5) {
      float a = vE.x, v = vE.y, m = v*vF.y, Lm = a*vF.x;
      float n1 = vnoise(vec2(Lm*0.6, m*1.5 + 4.));
      float edge = 1. - smoothstep(0.78 + 0.16*n1, 0.97 + 0.03*n1, abs(v));
      float dry = smoothstep(0.5, 1., a)*1.05 + 0.22*smoothstep(0.16, 0.3, a)*(1. - smoothstep(0.3, 0.5, a)) + smoothstep(0.95, 1., a)*0.5;
      float st = vnoise(vec2(Lm*0.07 + 3., m*4.2))*0.65 + vnoise(vec2(Lm*0.5, m*10.))*0.35;
      float keep = smoothstep(dry - 0.16, dry + 0.1, st + 0.12);
      float fr = uReveal*1.05 - a - vnoise(vec2(m*3., 7.))*0.012;
      float wet = 1. - smoothstep(0., 0.22, fr);
      dens = (0.92 + 0.08*smoothstep(0.5, 0.95, abs(v)))*mix(1., 0.8, smoothstep(0.5, 1., a));
      dens = clamp(granulate(dens, vec2(Lm, m))*(1. + 0.03*sin(uTime*1.5 + Lm*3.)) + wet*0.25, 0., 1.);
      float cap = smoothstep(0., 0.012, a - (1. - sqrt(max(0., 1. - v*v)))*0.03);
      // before the tail arrives the ring already hangs there as a ghost wash (uGhost), like every unvisited thing
      alpha = edge*cap*mix(uGhost*(0.8 + 0.3*n1), dens*keep, smoothstep(0., 0.012, fr));
    } else if (kind < 1.5) {
      alpha = (1. - smoothstep(0.5, 1., abs(vE.y)))*0.96;
    } else {
      float r = length(vE.xy), ang = atan(vE.y, vE.x);
      float R = 0.78 + 0.1*sin(ang*3. + vE.w*20.) + 0.07*sin(ang*7. + vE.w*50.);
      alpha = 1. - smoothstep(R - 0.12, R, r);
    }
    vec3 tint = vec3(0.); float tintAmt = 0.;
    ${INK_OUT}
    #include <fog_fragment>
  }`;

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('ink-dragon-hero'), R = (a, b) => rng.range(a, b);
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const L = opts.length ?? 320, girth = opts.girth ?? 1;
  const S0 = -HEAD_LEN, S1 = L + TRAIL, DS = (S1 - S0) / (ROWS - 1);
  const ensoC = new THREE.Vector3(0, 60, 0);
  const E = { rIn: opts.ensoRadius ?? 7.25, th0: THREE.MathUtils.degToRad(235 + R(-14, 14)), gap: THREE.MathUtils.degToRad(R(12, 22)), drift: R(-0.3, 0.35), wScale: R(0.9, 1.1) };

  // per-seed character
  const loop = { sx: R(0.9, 1.12), sy: R(0.9, 1.1), sz: R(0.75, 1.3) };
  const und = { a1: R(3.4, 5.6), l1: R(85, 125), a2: R(2.2, 3.8), l2: R(55, 80), p1: R(0, 6.28), p2: R(0, 6.28), v: R(8, 13) };
  const wp1 = R(0, 6.28), wp2 = R(0, 6.28), wMax = R(3.8, 4.4);
  const hwBody = (s) => {
    const t = clamp(s / L, 0, 1);
    return lerp(2.5, wMax, smoothstep(0, 0.2, t)) * (1 - 0.8 * smoothstep(0.32, 1, t)) * (1 + 0.1 * Math.sin(s * 0.057 + wp1) + 0.06 * Math.sin(s * 0.13 + wp2));
  };

  // ----- course -----
  const FIN = [[3, 14, 150], [5, 3, 80], [3, -3, 36], [-2, -6, 14], [14, -16, 4], [32, -36, -12], [-11, -41, -28], [-49, -26, -36], [-64, 4, -38],
    [-49, 34, -34], [-11, 50, -24], [32, 44, -8], [55, 30, 12], [62, 26, 44], [52, 18, 84], [20, 20, 150]]
    .map((p, i) => (i >= 5 && i <= 12 ? [p[0] * loop.sx, 4 + (p[1] - 4) * loop.sy, p[2] * loop.sz] : p))
    .map((p) => [p[0] + ensoC.x, p[1] + ensoC.y, p[2] + ensoC.z]);
  const flickPoint = FIN[3];
  const DEFAULT_PREFIX = [[40, 210, 640], [-24, 164, 500], [18, 124, 370], [-8, 94, 250]];
  let course = null, coursePts = null;
  const timing = { courseLength: 0, flickTravel: 0, endTravel: 0, startTravel: 0 };
  function setCourse(points, o = {}) {
    const pts = points.map((p) => (p.isVector3 ? [p.x, p.y, p.z] : [p[0], p[1], p[2]]));
    coursePts = o.finale === false ? pts : pts.concat(FIN);
    course = buildCourseTable(coursePts);
    let best = course.n, bd = 1e9;
    if (o.finale !== false) for (let i = Math.max(0, course.n - 700); i <= course.n; i++) {
      const d = Math.hypot(course.tab[i * 3] - flickPoint[0], course.tab[i * 3 + 1] - flickPoint[1], course.tab[i * 3 + 2] - flickPoint[2]);
      if (d < bd) { bd = d; best = i; }
    }
    timing.courseLength = course.len;
    timing.flickTravel = best * course.step + L;
    timing.endTravel = o.finale === false ? course.len : timing.flickTravel + 26;
    timing.startTravel = Math.min(L * 0.6, timing.endTravel * 0.2);
    return timing;
  }
  setCourse(opts.course || DEFAULT_PREFIX);
  await ctx.yield?.();

  // ----- spine texture: row 0 animated centreline, row 1 dorsal normal, row 2 the bare course -----
  const spineData = new Float32Array(ROWS * 3 * 4);
  const spineTex = new THREE.DataTexture(spineData, ROWS, 3, THREE.RGBAFormat, THREE.FloatType);
  spineTex.minFilter = spineTex.magFilter = THREE.NearestFilter; spineTex.generateMipmaps = false;
  const raw = new Float32Array(ROWS * 3), P = new Float32Array(ROWS * 3), Nn = new Float32Array(ROWS * 3);
  const state = { travel: timing.startTravel, flick: 0, drip: 0, driven: false };
  const head = new THREE.Vector3(), headDir = new THREE.Vector3(0, 0, -1), tail = new THREE.Vector3();
  const rowOf = (s) => clamp((s - S0) / DS, 0, ROWS - 1.001);
  function getBodyPoint(s, target = new THREE.Vector3()) {
    const f = rowOf(s), i = Math.floor(f), u = f - i, j = i * 3;
    return target.set(P[j] + (P[j + 3] - P[j]) * u, P[j + 1] + (P[j + 4] - P[j + 1]) * u, P[j + 2] + (P[j + 5] - P[j + 2]) * u);
  }
  const ensoGeo = buildEnsoGeometry(rng.fork('enso'), E);
  await ctx.yield?.();
  const revealOf = (f) => clamp((f - 0.12) / 0.68, 0, 1);
  function updateSpine(time) {
    for (let i = 0; i < ROWS; i++) courseAt(course, state.travel - (S0 + i * DS), raw, i * 3);
    let nx = 0, ny = 1, nz = 0;
    const k1 = 6.2832 / und.l1, k2 = 6.2832 / und.l2;
    for (let i = 0; i < ROWS; i++) {
      const a = Math.max(0, i - 1) * 3, b = Math.min(ROWS - 1, i + 1) * 3, j = i * 3;
      let tx = raw[a] - raw[b], ty = raw[a + 1] - raw[b + 1], tz = raw[a + 2] - raw[b + 2];
      const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
      let d = nx * tx + ny * ty + nz * tz; nx -= tx * d; ny -= ty * d; nz -= tz * d;       // transport
      const ux = -tx * ty, uy = 1 - ty * ty, uz = -tz * ty, ul = Math.hypot(ux, uy, uz);   // world up, projected
      if (ul > 0.25) { const w = 0.1 * ul; nx += (ux / ul - nx) * w; ny += (uy / ul - ny) * w; nz += (uz / ul - nz) * w; }
      const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
      Nn[j] = nx; Nn[j + 1] = ny; Nn[j + 2] = nz;
      const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
      const s = S0 + i * DS, arc = state.travel - s;
      const env = smoothstep(-10, 60, s) * (0.7 + 0.6 * clamp(s / L, 0, 1)) * (1 - smoothstep(L, L + 40, s));
      const o1 = und.a1 * env * Math.sin(k1 * arc + k1 * und.v * time + und.p1);
      const o2 = und.a2 * env * Math.sin(k2 * arc + k2 * und.v * 1.3 * time + und.p2);
      P[j] = raw[j] + nx * o1 + bx * o2; P[j + 1] = raw[j + 1] + ny * o1 + by * o2; P[j + 2] = raw[j + 2] + nz * o1 + bz * o2;
    }
    // tail flick: the tip leaves the course and sweeps the enso's circle, leading the wet front
    const f = state.flick, envF = smoothstep(0, 0.14, f) * (1 - smoothstep(0.8, 1, f));
    if (envF > 0.001) {
      const e = revealOf(f), th = E.th0 - e * ensoGeo.sweep, r = ensoGeo.inner(e) + ensoGeo.width(e) * 0.5;
      getBodyPoint(L, tail);
      const dx = (ensoC.x + Math.cos(th) * r - tail.x) * envF, dy = (ensoC.y + Math.sin(th) * r - tail.y) * envF, dz = (ensoC.z + 0.6 - tail.z) * envF;
      for (let i = Math.floor(rowOf(L - 80)); i < ROWS; i++) {
        const s = S0 + i * DS, w = s <= L ? Math.pow(smoothstep(L - 78, L, s), 1.5) : 1 - smoothstep(L, L + 30, s), j = i * 3;
        P[j] += dx * w; P[j + 1] += dy * w; P[j + 2] += dz * w;
      }
    }
    for (let i = 0; i < ROWS; i++) {
      const j = i * 3, a = i * 4, b = (ROWS + i) * 4, c = (2 * ROWS + i) * 4;
      spineData[a] = P[j]; spineData[a + 1] = P[j + 1]; spineData[a + 2] = P[j + 2];
      spineData[b] = Nn[j]; spineData[b + 1] = Nn[j + 1]; spineData[b + 2] = Nn[j + 2];
      spineData[c] = raw[j]; spineData[c + 1] = raw[j + 1]; spineData[c + 2] = raw[j + 2];
    }
    spineTex.needsUpdate = true;
    getBodyPoint(-8, head); getBodyPoint(L, tail);
    const h2 = getBodyPoint(-12, _tmp); headDir.copy(h2).sub(head).normalize();
  }
  const _tmp = new THREE.Vector3();

  function progressToState(u) {
    u = clamp(u, 0, 1);
    const Etot = timing.endTravel - timing.startTravel, V = Etot / 0.66667, Dr = V * 0.5 / 3;
    state.travel = u < 0.5 ? timing.startTravel + V * u : timing.endTravel - Dr * Math.pow(1 - (u - 0.5) / 0.5, 3);
    state.flick = clamp((u - 0.72) / 0.2, 0, 1);
    state.drip = clamp((u - 0.8) / 0.2, 0, 1);
  }
  await ctx.yield?.();

  // ----- materials -----
  const U = {
    uSpine: { value: spineTex }, uSpineInfo: { value: new THREE.Vector3(S0, 1 / DS, ROWS) }, uTime: { value: 0 },
    uInk: { value: pal[5] }, uInk2: { value: pal[4] }, uPaper: { value: pal[0].clone().multiplyScalar(0.82) }, uRed: { value: pal[6] },
    uPix: { value: 0.00085 }, uFade: { value: new THREE.Vector2(opts.fade?.[0] ?? 1e6, opts.fade?.[1] ?? 2e6) },
    uGirth: { value: girth }, uLen: { value: L }, uSeed: { value: R(0, 50) }, uBelly: { value: R(0.75, 1) },
    uMistBand: { value: new THREE.Vector4(1e5, 1e5, 0, 0) },
    uFlow: { value: 0 }, uEnsoC: { value: ensoC }, uEnsoN: { value: new THREE.Vector3(0, 0, 1) }, uReveal: { value: 0 }, uDrip: { value: 0 }, uGhost: { value: 0 },
  };
  const mat = (vs, fs, names) => {
    const uniforms = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    for (const n of names) uniforms[n] = U[n];
    if (opts.tone) uniforms.uPaperD = { value: opts.tone.paper };
    return new THREE.ShaderMaterial({ vertexShader: vs, fragmentShader: opts.tone ? fs.replace('//TONE', opts.tone.glsl) : fs, defines: opts.tone ? { DISPLAY_COMPOSE: 1 } : {},
      uniforms, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  };
  const object = new THREE.Group(); object.name = 'ink-dragon';
  const big = new THREE.Sphere(new THREE.Vector3(0, 60, 0), 1e5);
  const addMesh = (geo, m, order) => { geo.boundingSphere = big; const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; mesh.renderOrder = order; object.add(mesh); return mesh; };

  // body: one long ribbon, position = (s, side, halfwidth)
  {
    const NB = 1500, pos = new Float32Array((NB + 1) * 6), idx = new Uint16Array(NB * 6);
    for (let i = 0; i <= NB; i++) {
      const s = -3 + (L + 3) * (i / NB), hw = hwBody(s);
      pos.set([s, -1, hw, s, 1, hw], i * 6);
      if (i < NB) { const b = i * 2; idx.set([b, b + 1, b + 2, b + 1, b + 3, b + 2], i * 6); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setIndex(new THREE.BufferAttribute(idx, 1));
    addMesh(g, mat(BODY_VS, BODY_FS, ['uSpine', 'uSpineInfo', 'uTime', 'uInk', 'uInk2', 'uFade', 'uMistBand', 'uGirth', 'uLen', 'uSeed', 'uBelly']), 2);
  }
  await ctx.yield?.();
  // strokes
  addMesh(await buildDragonStrokes(rng.fork('strokes'), L, (s) => hwBody(s) * girth, { redEye: opts.redEye !== false }, async () => { await ctx.yield?.(); }),
    mat(STROKE_VS, STROKE_FS, ['uSpine', 'uSpineInfo', 'uTime', 'uInk', 'uInk2', 'uPaper', 'uRed', 'uPix', 'uFade', 'uMistBand']), 3);
  await ctx.yield?.();
  // droplets and blots
  {
    const n = opts.droplets ?? 900, dr = rng.fork('drops');
    const iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iC = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      const s0 = Math.pow(dr(), 1.4) * L * 0.92, span = Math.min(dr.range(90, 280), S1 - 2 - s0);
      let x = dr.gauss(), y = dr.gauss() * 0.8 + 0.25, z = dr.gauss(); const l = Math.hypot(x, y, z) || 1;
      const speck = dr.chance(0.5) ? 1 : 0, big2 = dr.chance(0.08);
      iA.set([s0, span, dr(), dr()], i * 4);
      iB.set([x / l, y / l, z / l, speck ? dr.range(5, 30) : dr.range(14, 75)], i * 4);
      iC.set([speck ? dr.range(0.15, 0.5) : (0.7 + Math.pow(dr(), 2.2) * 3.2) * (big2 ? 1.8 : 1), speck ? 1 : dr.range(0.14, 0.6) * (big2 ? 0.6 : 1), dr.range(0.03, 0.09), speck], i * 4);
    }
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); g.setIndex([0, 1, 2, 1, 3, 2]);
    g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.setAttribute('iC', new THREE.InstancedBufferAttribute(iC, 4));
    g.instanceCount = n;
    addMesh(g, mat(DROP_VS, DROP_FS, ['uSpine', 'uSpineInfo', 'uTime', 'uInk', 'uInk2', 'uPix', 'uFade', 'uMistBand', 'uFlow', 'uEnsoC', 'uEnsoN']), 1);
  }
  // enso
  const enso = addMesh(ensoGeo.geometry, mat(ENSO_VS, ENSO_FS, ['uTime', 'uInk', 'uInk2', 'uPix', 'uFade', 'uReveal', 'uDrip', 'uGhost']), 4);
  enso.position.copy(ensoC);

  await ctx.yield?.();
  progressToState(1); updateSpine(0);
  const headRest = head.clone();
  progressToState(0); updateSpine(0);
  const sweepStart = E.th0, rs = E.rIn + 1.2;
  const C = ensoC;
  const hero = {
    object, radius: 80, height: 125, center: new THREE.Vector3(C.x - 2, C.y + 3, C.z - 6),
    ground: false, groundY: 0,
    anchors: {
      portalSeat: { position: C.clone(), facing: new THREE.Vector3(0, 0, 1), radius: E.rIn - 0.05 },
      flyThrough: [[0, 0, 260], [0, 0, 160], [0, 0, 80], [0, 0, 30], [0, 0, 0], [0, 0, -20]].map((p) => new THREE.Vector3(C.x + p[0], C.y + p[1], C.z + p[2])),
      viewpoints: {
        approach: new THREE.Vector3(C.x, C.y + 2, C.z + 170), reveal: new THREE.Vector3(C.x - 34, C.y + 12, C.z + 230),
        side: new THREE.Vector3(C.x + 150, C.y + 20, C.z + 70), below: new THREE.Vector3(C.x + 20, C.y - 50, C.z + 120),
      },
      ensoCenter: C.clone(), ensoStart: new THREE.Vector3(C.x + Math.cos(sweepStart) * rs, C.y + Math.sin(sweepStart) * rs, C.z),
      headRest, course: coursePts,
    },
    timing, head, headDir, tail, getBodyPoint, mistBand: U.uMistBand.value, fadeRange: U.uFade.value, ensoMesh: enso,
    setCourse(points, o) { const t = setCourse(points, o); hero.anchors.course = coursePts; return t; },
    setProgress(u) { state.driven = true; progressToState(u); },
    setTravel(m) { state.driven = true; state.travel = m; },
    setGhost(g) { U.uGhost.value = clamp(g, 0, 1); },
    setEnso(f, drips) { state.driven = true; state.flick = clamp(f, 0, 1); if (drips !== undefined) state.drip = clamp(drips, 0, 1); },
    update(dt, time, camera) {
      if (!state.driven) progressToState(0.62 + 0.38 * clamp((time % 36) / 10, 0, 1));
      U.uTime.value = time;
      U.uFlow.value = state.travel + time * 2.5;
      U.uReveal.value = revealOf(state.flick);
      U.uDrip.value = state.drip;
      updateSpine(time);
    },
    dispose() { spineTex.dispose(); },
  };
  return hero;
}
