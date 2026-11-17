// MY HOUSE, IN CRAYON: a five-year-old's wax-crayon drawing of home stood up in three dimensions.
//
// x across, y up, flight toward -z. A green strip of ground (top at y 0) and a blue strip of sky (underside at
// y 140) with nothing but white sugar paper between and around them. A yellow path runs 180 m between door-high
// flowers to the leaning see-through house (src/parts/crayon-house.js, front wall at z -180), round which a
// black cat as tall as the roof walks. We swing left to see the house whole, come back to the green door, climb three
// zigzag flights past the kitchen, the overflowing bath and the bed, leave between two bare rafters into the
// white gap (the reveal, at half speed) and climb to the corner sun, whose square window is the exit.
//
// The reveal is composed as one picture. From the roof (ROOF) the route is a single straight line to the sun's
// window (SUN), 17 degrees right of -z and climbing 15.6 degrees: the AXIS. Behind the house both strips turn
// onto that axis and open like fans (stations along a centre line, see drawStrip), so that from the roof the
// green is a band right across the bottom of the frame and the blue a band across the top; the blue stops 80 m
// behind the sun, which hangs from its ragged end into the white. The far garden (lollipop trees, pond, swing)
// is drawn on the fan 250 to 500 m out, where it is small and whole in frame; the cat walks down the right of
// the axis with its tail up, and a poi on the axis holds the gaze nearly level. Nearer, either side of the route
// and at its height, stand the garden's big things, so that the reveal is as full as the opening: three flowers
// as tall as the house, a kite close on the left, three tied balloons on the right, then a snail as big as the
// trees, a second kite, a far washing line and more trees between them and the far garden.
//
// Everything is drawn with the part's crayon shader pair (fill + line) and its paper dome: unlit, no fog, flat
// post, exact hex. Scripted moments are functions of u; boil, rays, smoke, clouds and washing run on time.
//   u 0.03 the dog falls in on the left     u 0.12-0.16 the cat trots on across the lawn and the gaze goes with it:
//   at u 0.16 it is whole in the picture, side-on, its tail curled up behind it, the house and the washing behind
//   u 0.2 it turns the corner of the house, tail up        u 0.25 the far point of the swing to the left: the house
//   front whole, chimney smoking, the dog waiting at the door, the cat's hind legs and question-mark tail at the right
//   u 0.29-0.32 the door bangs open and the dog is off round the house        u 0.34 the open door from in front, the
//   stair hall inside
//   u 0.41 in at the door, the clock and the kitchen to the right     u 0.50 the bath, side-on at the top of the first
//   flight (the turn of the landing is placed at u 0.50 exactly: the swing in the garden is as long as that needs)
//   u 0.52 the duck goes over the edge       u 0.566 the bed and its mobile        u 0.60-0.65 from the top flight the
//   sun's window is seen through the open patch of roof, the chimney and its smoke to the right        u 0.66 out of
//   the roof: the cat has run ahead and walks on down the garden, whole      u 0.72 birds cross ahead      u 0.74 the
//   near kite passes on the left, the balloons on the right        u 0.85 the sun's curtains part
// Looks (ctx.vary.hour, else ctx.vary.mood): sunny (default), rainy (dark strip, hanging blue dashes, puddles,
// umbrellas, the sun a window in a cloud), night on white paper (navy strip, stars on strings, banana moon,
// yellow windows), autumn (red-over-yellow trees, tumbling leaves). Casts by seed: car / blue bus / green
// tractor, washing / birthday bunting, red dog / small black cat on too many legs.
// Rare (ctx.vary.rare), u 0.62-0.78: a 30 m pink eraser rubs the biggest lollipop tree ahead and below to a pale
// smear (by 0.66, rubbing on to 0.70) and a tower-sized green crayon comes down out of the white and redraws it, bigger, stroke
// by stroke (0.71-0.768).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { buildHero, makeCrayon, Pen, PAL } from '../parts/crayon-house.js';

const V3 = THREE.Vector3, TAU = Math.PI * 2, HZ = -230, C = PAL;
const GROUND_W = 60, SKY_W = 105, Z_NEAR = 30, SKY_Y = 140;
// the last stair anchor of the house (where we leave the roof) and the sun's window: the reveal's axis
const ROOF = new V3(10.4 + 0.07 * 58.4, 58.4, -46 + HZ), SUN = new V3(64, 104, -432);
const AX = new V3(SUN.x - ROOF.x, 0, SUN.z - ROOF.z).normalize(), AXR = new V3(-AX.z, 0, AX.x), AX_YAW = Math.atan2(AX.x, -AX.z);
// a point s metres along the axis from the roof and lat metres to its right, as [x, z]
const onAxis = (s, lat = 0) => [ROOF.x + AX.x * s + AXR.x * lat, ROOF.z + AX.z * s + AXR.z * lat];
// the centre lines of the two strips: [x, z, half width, nx, nz] with (nx, nz) pointing to the strip's right
const G = (x, z, hw) => [x, z, hw, 1, 0], A = (s, hw) => { const q = onAxis(s); return [q[0], q[1], hw, AXR.x, AXR.z]; };
const GROUND_LINE = [G(0, Z_NEAR, GROUND_W), G(0, -250, GROUND_W), A(0, 72), A(60, 105), A(230, 215), A(530, 410), A(760, 560)];
const SKY_LINE = [G(0, Z_NEAR, SKY_W), G(0, -170, SKY_W), A(0, 125), A(80, 160), A(160, 205), A(250, 255)];
const lineLen = (L) => { let t = 0; for (let i = 1; i < L.length; i++) t += Math.hypot(L[i][0] - L[i - 1][0], L[i][1] - L[i - 1][1]); return t; };
// the point d metres along a centre line and g half widths to its right (g -1..1): out = [x, z, half width];
// past the far end the line runs straight on
function alongLine(L, d, g, out) {
  let i = 1, a = L[0], b = L[1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  while (d > l && i < L.length - 1) { d -= l; i++; a = b; b = L[i]; l = Math.hypot(b[0] - a[0], b[1] - a[1]); }
  const f = d / l, k = Math.min(1, f), hw = a[2] + (b[2] - a[2]) * k, nx = a[3] + (b[3] - a[3]) * k, nz = a[4] + (b[4] - a[4]) * k;
  out[0] = a[0] + (b[0] - a[0]) * f + nx * hw * g; out[1] = a[1] + (b[1] - a[1]) * f + nz * hw * g; out[2] = hw;
  return out;
}
// A strip of scribble along a centre line: a 12 m margin all round carries the distance to the edge, so the
// fill stops short of it in a ragged line (the crayon's edge), and the strokes run on unbroken through every bend.
function drawStrip(pen, L, y, down, o) {
  const M = 12, st = [], col = o.col, w = o.w, press = o.press, ca = Math.cos(o.ang || 0), sa = Math.sin(o.ang || 0);
  const ox = pen.rng() * 40, oy = pen.rng() * 40, n = new V3(0, down ? -1 : 1, 0), N = L.length;
  const dir = (a, b) => { const l = Math.hypot(b[0] - a[0], b[1] - a[1]); return [(b[0] - a[0]) / l, (b[1] - a[1]) / l]; };
  const d0 = dir(L[0], L[1]), d1 = dir(L[N - 2], L[N - 1]);
  st.push([...L[0], 0], [L[0][0] + d0[0] * M, L[0][1] + d0[1] * M, L[0][2], L[0][3], L[0][4], M]);
  for (let i = 1; i < N - 1; i++) st.push([...L[i], M]);
  st.push([L[N - 1][0] - d1[0] * M, L[N - 1][1] - d1[1] * M, L[N - 1][2], L[N - 1][3], L[N - 1][4], M], [...L[N - 1], 0]);
  const i0 = pen.n;
  for (const [cx, cz, hw, nx, nz, e] of st) for (const [k, ed] of [[-hw, 0], [-hw + M, e], [hw - M, e], [hw, 0]]) {
    const x = cx + nx * k, z = cz + nz * k;
    pen._v(new V3(x, y, z), n, col, ed, 5e3, 1e4, 5e3 + 60, x * ca - z * sa + ox, -x * sa - z * ca + oy, w, press, 0, 0);
  }
  for (let i = 0; i < st.length - 1; i++) for (let k = 0; k < 3; k++) {
    const a = i0 + i * 4 + k, b = a + 1, c = a + 5, d = a + 4;
    if (down) pen.idx.push(a, c, b, a, d, c); else pen.idx.push(a, b, c, a, c, d);
  }
  return pen;
}

const CRUMB_VERT = /* glsl */`
attribute vec3 aCol; attribute vec2 aQ; attribute float aPh;
uniform float uTime, uPix; uniform vec3 uBox; varying vec3 vCol;
void main(){
  vec3 b = position + vec3(sin(uTime * .21 + aPh * 6.) * 3., -uTime * (.5 + aPh), cos(uTime * .17 + aPh * 9.) * 3.);
  vec3 rel = mod(b - cameraPosition + uBox * .5, uBox) - uBox * .5;
  vec4 mv = viewMatrix * vec4(cameraPosition + rel, 1.);
  float size = max(.12 + .2 * aPh, -mv.z * uPix * .45) * smoothstep(5., 11., -mv.z);
  float a = aPh * 40.;
  mv.xy += vec2(cos(a) * aQ.x - sin(a) * aQ.y * .5, sin(a) * aQ.x + cos(a) * aQ.y * .5) * size;
  vCol = aCol; gl_Position = projectionMatrix * mv;
}`;
const CRUMB_FRAG = /* glsl */`varying vec3 vCol; void main(){ gl_FragColor = vec4(vCol, 1.); }`;

// ---- drawings shared by many instances -------------------------------------------------------------------
function drawFlower(p, kind, col) {
  p.line([[0, 0, 0], [0.5, 7, 0], [0, 15, 0]], 0.45, { col: C.green });
  p.save().tr(0.2, 5, 0).rz(0.85).loop(2.7, 0, 2.7, 1.15, 0.34, { col: C.green, n: 8 }).restore();
  p.save().tr(0.2, 8.4, 0).rz(Math.PI - 0.85).loop(2.7, 0, 2.7, 1.15, 0.34, { col: C.green, n: 8 }).restore();
  p.save().tr(0, 15.8, 0);
  if (kind === 'daisy') {
    for (let i = 0; i < 6; i++) p.save().rz((i / 6) * TAU + 0.25).loop(3.4, 0, 2.3, 1.2, 0.38, { col, n: 8 }).restore();
    p.tr(0, 0, 0.3).disc(1.6, { n: 9, col: C.yellow, w: 0.5, press: 0.95, gap: false, back: {}, outline: 0.26 });
  } else {
    p.poly([[-2.7, -1.6], [-3, 3.5], [-1.3, 1.5], [0, 4], [1.3, 1.5], [3, 3.5], [2.7, -1.6], [0, -3]], { col, w: 0.75, press: 0.86, ang: 0.6, back: {}, outline: 0.38, lcol: col });
  }
  p.restore();
}
const drawTuft = (p, s = 1) => p.ribbon([[-1.6 * s, 0], [-1.1 * s, 2.6 * s], [-0.5 * s, 0.2], [0, 3.5 * s], [0.6 * s, 0.2], [1.1 * s, 2.4 * s], [1.6 * s, 0]], 0.22, { col: C.green });
function drawTree(p, x, z, h, r, col, bend) {
  p.tube([[x, 0, z], [x + bend * 0.6, h * 0.3, z], [x + bend, h - r * 1.3, z]], (t) => 1.9 - 0.5 * t, { col: C.purple, w: 1.0, press: 0.86, hull: 0.6, rim: 0.16, seg: 7 });
  p.save().tr(x + bend, h - r, z).ball(r, { col, w: 2.4, press: 0.82, hull: 0.85, rim: 0.12, seg: 14, rings: 8, ang: x * 0.1 }).restore();
}
const drawShadow = (p, x, z, r, k = 0.42) => p.save().tr(x - r * 0.35, 0.22, z + r * 0.22).rx(-Math.PI / 2).disc(r, { n: 10, ry: k, col: C.purple, w: 1.2, press: 0.72, ang: 0.3 }).restore();
function drawWheel(p, r) {
  for (const z of [-2.75, 2.75]) {
    p.save().tr(0, 0, z).loop(0, 0, r, r, 0.42, { n: 10 }).loop(0, 0, r * 0.45, r * 0.45, 0.3, { n: 6 });
    for (let i = 0; i < 4; i++) { const a = (i / 4) * Math.PI; p.bar([Math.cos(a) * r, Math.sin(a) * r, 0], [-Math.cos(a) * r, -Math.sin(a) * r, 0], 0.22); }
    p.restore();
  }
}
function drawVehicle(p, kind) {
  const win = (x, y, w, h, z) => { for (const s of [-1, 1]) p.save().tr(x, y, s * z).ry(s > 0 ? 0 : Math.PI).poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], { col: C.paper, press: 0, outline: 0.22 }).restore(); };
  if (kind === 'bus') {
    p.save().tr(0, 5, 0).box(16, 7, 5, { col: C.blue, w: 1.3, press: 0.85, ang: 0.3, hull: 0.5 }).restore();
    for (let i = 0; i < 5; i++) win(-6 + i * 3, 6.4, 2.2, 2.4, 2.56);
    p.bar([-8.2, 3.4, 2.7], [8.2, 3.4, 2.7], 0.3, { col: C.yellow });
  } else if (kind === 'tractor') {
    p.save().tr(1.4, 4.2, 0).box(8, 3, 3.4, { col: C.green, w: 1.0, press: 0.86, ang: 0.3, hull: 0.45 }).restore();
    p.save().tr(-2.6, 7.6, 0).box(4, 4.6, 3.6, { col: C.green, w: 1.0, press: 0.86, ang: 1.1, hull: 0.45 }).restore();
    win(-2.6, 8, 2.4, 2.6, 1.86); p.line([[3.6, 5.6, 0], [3.6, 9.6, 0], [4.4, 10.2, 0]], 0.34);
  } else {
    p.save().tr(0, 3.4, 0).box(12, 3.4, 5, { col: C.red, w: 1.2, press: 0.86, ang: 0.3, hull: 0.5 }).restore();
    p.save().tr(-0.6, 6.5, 0).box(6.4, 3, 4.6, { col: C.red, w: 1.0, press: 0.86, ang: 1.0, hull: 0.45 }).restore();
    win(-2.2, 6.6, 2.2, 1.9, 2.36); win(1, 6.6, 2.2, 1.9, 2.36);
    p.save().tr(6.1, 3.6, 1.5).ball(0.6, { col: C.yellow, press: 1, hull: 0.22, seg: 6, rings: 4, rim: 0.03 }).restore();
  }
}
// the small animal that runs with us: a red dog, or a small black cat, on eight whirling legs
function drawRunner(p, col, catLike) {
  const K = { col, w: 0.8, press: catLike ? 1 : 0.9, hull: 0.42, rim: 0.1 };
  p.save().tr(0, 4.3, 0).sc(0.78, 0.8, 1.8).ball(2.3, { ...K, seg: 10, rings: 6, R: 1.9 }).restore();
  p.save().tr(0, 6.1, 4.1).ball(1.6, { ...K, seg: 9, rings: 5 }).restore();
  if (!catLike) { p.save().tr(0, 5.7, 5.5).sc(0.72, 0.62, 1.2).ball(1.05, { ...K, seg: 7, rings: 4 }).restore(); p.save().tr(0, 5.95, 6.75).ball(0.34, { col: C.black, press: 1, seg: 5, rings: 3, rim: 0.02 }).restore(); }
  for (const s of [-1, 1]) {
    if (catLike) p.save().tr(s * 0.9, 7, 3.9).rz(-s * 0.3).loft([[0, 0.7], [1.5, 0]], { ...K, seg: 5, rz: 0.5 }).restore();
    else p.save().tr(s * 1.75, 5.9, 3.9).ry(Math.PI / 2).disc(1, { n: 8, rx: 0.7, ry: 1.7, col: C.black, press: 1, w: 0.4, gap: false, back: {} }).restore();
    p.save().tr(s * 0.62, 6.6, 5.6).disc(0.3, { n: 6, col: catLike ? C.yellow : C.black, press: 1, w: 0.3, gap: false }).restore();
  }
  p.tube([[0, 5, -3.8], [0, 7.2, -5.2], [0, 9.4, -4.9], [0, 10.2, -3.8]], 0.4, { ...K, seg: 6, hull: 0.34 });
  p.line([[0.4, 5.1, 5.3], [1.5, 4.9, 4.1], [1.8, 5.4, 2.6], [1.9, 4.9, 1.1], [2, 5.3, -0.3]], 0.3, { col: catLike ? C.red : C.purple });
}
function drawLegWheel(p, col) {
  for (let i = 0; i < 4; i++) { const a = (i / 4) * TAU + 0.3; p.bar([0, 0, 0], [0, Math.cos(a) * 3.5, Math.sin(a) * 3.5], 0.32, { col }); }
}
// a flower as tall as the house (the giants of the back garden): 60 m of stem, three leaf loops, a head 18 m across
function drawTallFlower(p, kind, col) {
  p.line([[0, 0, 0], [2, 16, 0], [-1.5, 34, 0], [0.6, 50, 0], [0, 60, 0]], 0.8, { col: C.green });
  for (const [y, s] of [[13, 1], [25, -1], [37, 1]]) p.save().tr(0.4, y, 0).rz(s > 0 ? 0.6 : Math.PI - 0.6).loop(5.6, 0, 5.6, 2.2, 0.55, { col: C.green, n: 9 }).restore();
  p.save().tr(0, 61.5, 0);
  if (kind === 'daisy') {
    for (let i = 0; i < 7; i++) p.save().rz((i / 7) * TAU + 0.2).loop(5.7, 0, 3.6, 1.9, 0.6, { col, n: 9 }).restore();
    p.tr(0, 0, 0.4).disc(2.8, { n: 10, col: C.yellow, w: 0.8, press: 0.95, gap: false, back: {}, outline: 0.4 });
  } else {
    p.poly([[-2.7, -1.6], [-3, 3.5], [-1.3, 1.5], [0, 4], [1.3, 1.5], [3, 3.5], [2.7, -1.6], [0, -3]].map((q) => [q[0] * 2.7, q[1] * 2.7]), { col, w: 1.6, press: 0.86, ang: 0.6, back: {}, outline: 0.6, lcol: col });
  }
  p.restore();
}
// a snail as big as the trees, drawn side-on: a purple body, two eyes on stalks, a yellow shell with a red spiral
function drawSnail(p) {
  const K = { col: C.purple, w: 1.4, press: 0.86, hull: 0.6, rim: 0.12, seg: 8 };
  p.tube([[-24, 2.4, 0], [-10, 3, 0], [8, 3.2, 0], [20, 3.4, 0], [25.5, 8, 0], [26.5, 15.5, 0]], (t) => 1.4 + 2.2 * Math.max(0, Math.sin(Math.min(1, t * 1.25) * Math.PI)), K);
  p.save().tr(27, 17, 0).ball(3.4, { ...K, seg: 9, rings: 5 }).restore();
  for (const z of [-1.6, 1.6]) { p.line([[27.5, 19.5, z], [29, 25, z * 1.8], [30.5, 28.5, z * 2]], 0.4); p.save().tr(30.7, 29.4, z * 2).ball(1.1, { col: C.black, press: 1, seg: 6, rings: 4, rim: 0.02 }).restore(); }
  p.save().tr(-1, 18.5, 0).disc(15, { n: 22, col: C.yellow, w: 2.2, press: 0.9, ang: 0.5, back: {}, outline: 0.75 });
  for (const z of [0.7, -0.7]) { const pts = []; for (let i = 0; i <= 30; i++) { const t = i / 30, a = 0.6 + t * 2.6 * TAU, r = 12.6 * (1 - t * 0.93); pts.push([Math.cos(a) * r, Math.sin(a) * r, z]); } p.line(pts, 0.6, { col: C.red }); }
  p.restore();
}
// a kite on its string: the string's foot at the origin, the diamond 97 m up and 14 m to the right
function drawKite(p, c1, c2) {
  p.line([[0, 0, 0], [3, 25, -2], [7.5, 52, -5], [12, 78, -8], [14, 90, -10]], 0.2);
  p.save().tr(14, 97.5, -10).rz(-0.25);
  [[c1, 0, 7.5, 4.6, 0], [c2, 0, 7.5, -4.6, 0], [c2, 0, -7.5, 4.6, 0], [c1, 0, -7.5, -4.6, 0]].forEach(([c, x0, y0, x1, y1]) => p.poly([[0, 0], [x0, y0], [x1, y1]], { col: c, w: 0.8, press: 0.9, ang: x1, gap: false, back: {} }));
  p.line([[0, 7.5, 0], [4.6, 0, 0], [0, -7.5, 0], [-4.6, 0, 0]], 0.34, { closed: true }).bar([0, 7.5, 0], [0, -7.5, 0], 0.22).bar([-4.6, 0, 0], [4.6, 0, 0], 0.22);
  p.line([[0, -7.5, 0], [1.5, -11, 0], [-0.5, -14.5, 0], [1.2, -18, 0], [-0.3, -21.5, 0]], 0.18);
  for (const [x, y, c] of [[1.5, -11, C.blue], [-0.5, -14.5, C.green], [1.2, -18, C.purple]]) p.save().tr(x, y, 0).poly([[0, 0], [-1.5, 0.8], [-1.5, -0.8]], { col: c, press: 1, w: 0.4, gap: false, back: {} }).poly([[0, 0], [1.5, 0.8], [1.5, -0.8]], { col: c, press: 1, w: 0.4, gap: false, back: {} }).restore();
  return p.restore();
}
// three balloons tied to one peg on long strings
function drawBalloons(p) {
  for (const [x, y, z, c] of [[-6, 79, 0, C.red], [3, 90, -5, C.yellow], [10, 73, 3, C.purple]]) {
    p.line([[0, 0, 0], [x * 0.2 + 1.5, y * 0.33, z * 0.3], [x * 0.7 - 1, y * 0.66, z * 0.7], [x, y - 4.8, z]], 0.2);
    p.save().tr(x, y, z).sc(0.9, 1.08, 0.9).ball(4.6, { col: c, w: 1.0, press: 0.9, hull: 0.5, rim: 0.12, seg: 10, rings: 6 }).restore();
  }
}
// a washing line's rope (x -24..24 between its posts) and a second set of washing: a sheet, a shirt, a dress, two
// socks and a towel, with their pegs
const sag = (x) => 24 + 1.2 * (x / 24) * (x / 24);
function drawClothes(p) {
  p.poly([[-21.5, sag(-21.5) - 0.2], [-11, sag(-11) - 0.2], [-11, 15.3], [-21.5, 15.8]], { col: C.yellow, w: 1.2, press: 0.74, ang: 1.5, outline: 0.3 });
  p.poly([[-4, 23.9], [-7.6, 22], [-6.6, 19.8], [-4, 21.2], [-4, 15.8], [3, 15.8], [3, 21.2], [5.6, 19.8], [6.6, 22], [3, 23.9], [0.6, 23.2], [-1.6, 23.2]].map((q) => [q[0] * 0.8 - 3.4, (q[1] - 24) * 0.9 + 24.2]), { col: C.green, w: 0.8, press: 0.86, ang: 0.5, outline: 0.3 });
  p.poly([[5, 24.1], [8.6, 24.1], [8, 21.4], [10.8, 15.6], [2.8, 15.6], [5.6, 21.4]], { col: C.purple, w: 0.8, press: 0.86, ang: 1.1, outline: 0.3 });
  for (const [x, c] of [[12.6, C.red], [15.2, C.blue]]) p.poly([[x, 24.4], [x + 1.1, 24.4], [x + 1.1, 20.7], [x + 2.2, 20.5], [x + 2.2, 19.3], [x, 19.3]], { col: c, w: 0.5, press: 0.9, ang: 0.3, outline: 0.26 });
  p.poly([[18.6, sag(18.6) - 0.2], [22.8, sag(22.8) - 0.2], [22.8, 17], [18.6, 17]], { col: C.red, w: 0.9, press: 0.6, ang: 0, outline: 0.3 });
  for (const x of [-21, -11.5, -6, 0.6, 6.8, 13.1, 15.7, 19, 22.4]) p.bar([x, sag(x) + 0.5, 0.1], [x, sag(x) - 0.9, 0.1], 0.2);
}
// the scalloped outline of a cloud left as bare paper
function cloudPts(rng, rx, ry) {
  const n = 7 + Math.floor(rng() * 3), pts = [];
  for (let i = 0; i < n * 5; i++) { const a = (i / (n * 5)) * TAU, r = 1 + 0.2 * Math.abs(Math.sin(a * n * 0.5 + 0.4)); pts.push([Math.cos(a) * rx * r, Math.sin(a) * ry * r]); }
  return pts;
}

export default {
  id: 'crayon-house', name: 'My House, in Crayon', category: 'domestic', weirdness: 0.55,
  media: ['air', 'interior'],
  async build(ctx) {
    const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, dens = ctx.vary?.density ?? 1, rare = !!ctx.vary?.rare;
    const hour = ctx.vary?.hour, mood = ctx.vary?.mood ?? 0.2;
    const look = hour === 'night' ? 'night' : hour === 'day' ? 'sunny' : hour === 'golden' ? 'autumn' : hour === 'dawn' ? 'rainy'
      : mood < 0.34 ? 'sunny' : mood < 0.5 ? 'autumn' : mood < 0.75 ? 'rainy' : 'night';
    const vehicle = rng.pick(['car', 'car', 'bus', 'tractor']), swap = rng(), bunting = look !== 'sunny' && swap < 0.5, runnerCat = look !== 'sunny' && swap > 0.3 && swap < 0.8;
    const scene = new THREE.Scene(); scene.background = C.paper.clone();
    const crayon = makeCrayon(), mats = { over: crayon.make({ over: 1 }) };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 10), crayon.paper);
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    const add = (pen, mat, name) => { const m = pen.mesh(mat || crayon.base, name); scene.add(m); return m; };
    // a random source for drawings added late, which takes nothing from ctx.rng: every fork of that advances it,
    // and the garden, the rain and the clouds drawn after would all come out different
    const ownRng = (n) => ctx.core.makeRng(((ctx.seed | 0) + 3) * 977 + n * 131);

    // ---- the hero and the route ---------------------------------------------------------------------------
    const end = SUN.clone(), dEnd = SUN.clone().sub(ROOF), endLen = dEnd.length(); dEnd.divideScalar(endLen);
    const hero = await buildHero(ctx, { crayon, look, demo: false, sunPos: new V3(end.x, end.y, end.z - HZ), sunDir: dEnd.clone().negate() });
    hero.object.position.set(0, 0, HZ); scene.add(hero.object); scene.add(hero.cat.group); // the cat walks in world space
    await ctx.yield();
    // the garden: straight down the yellow path, a swing 38 m to the left (from its far point the house front is seen
    // whole) and back to the axis, so that the door is met from in front. Its length is what puts the landing by
    // the bath at u 0.50: change a point and the whole flight after it shifts
    const pts = [[0, 9, 0], [0, 9, -34], [-4, 9, -66], [-22, 9.5, -95], [-38.417, 10, -114.425], [-24, 10, -134], [-7, 9.9, -150]];
    for (const a of hero.anchors.stairs) pts.push([a.x, a.y, a.z + HZ]);
    // from the roof one straight line to the sun's window
    for (const k of [0.22, 0.44, 0.66, 0.83, 1]) pts.push([ROOF.x + dEnd.x * endLen * k, ROOF.y + dEnd.y * endLen * k, ROOF.z + dEnd.z * endLen * k]);
    const path = makePath(pts);
    // the first route through the garden (a later swing to the left, the door met from the side)
    const path0 = makePath([[0, 9, 0], [0, 9, -34], [-4, 9, -66], [-22, 9.5, -95], [-40, 10, -122], [-34, 10, -147], [-15, 9.8, -166], pts[7]]);
    const _p = new V3(), _q = new V3(), _r = new V3(), _c = new V3(), _sz = new THREE.Vector2(), _l = [0, 0, 0];
    const uNear = (x, y, z) => { let b = 1e9, bu = 0; for (let i = 0; i <= 500; i++) { path.pointAt(i / 500, _p); const d = _p.distanceToSquared(_q.set(x, y, z)); if (d < b) { b = d; bu = i / 500; } } return bu; };
    const sa = hero.anchors.stairs, uDoor = uNear(sa[0].x, sa[0].y, sa[0].z + HZ), uBath = uNear(sa[3].x, sa[3].y, sa[3].z + HZ);
    const uBed = uNear(sa[6].x, sa[6].y, sa[6].z + HZ), uRoof = uNear(sa[10].x, sa[10].y, sa[10].z + HZ);
    const pace = (u) => 1 + 0.15 * smoothstep(uDoor - 0.01, uDoor + 0.03, u) * (1 - smoothstep(uRoof - 0.03, uRoof, u))
      - 0.5 * smoothstep(uRoof, uRoof + 0.03, u) * (1 - smoothstep(0.8, 0.88, u));

    // ---- the cat's walk: across the front lawn, round the corner, down the right side of the house, then out
    // along the right of the axis, a little faster than we fly, its tail up from the corner on ------------------
    const catKeys = [[0, 30], [0.12, 66], [0.16, 102], [0.2, 134], [0.25, 160], [0.34, 176], [uDoor, 186], [0.52, 206], [0.56, 225], [0.6, 315], [0.635, 425], [0.66, 478], [0.68, 500], [0.7, 516], [0.76, 566], [0.8, 600], [0.9, 632], [1, 640]];
    const catAt = (u, out) => {
      let s = catKeys[catKeys.length - 1][1];
      for (let i = 0; i < catKeys.length - 1; i++) { const a = catKeys[i], b = catKeys[i + 1]; if (u <= b[0]) { s = lerp(a[1], b[1], clamp((u - a[0]) / (b[0] - a[0]), 0, 1)); break; } }
      // straight across the lawn to x 32, a quarter turn of 14 m radius, straight down the side of the house to
      // z -270, then out along the axis, drifting 34 m further to its right (and 40 more, round the pond, far out)
      if (s < 110) { out.x = -78 + s; out.z = -158; out.heading = Math.PI / 2; }
      else if (s < 131.99) { const f = (s - 110) / 14; out.x = 32 + 14 * Math.sin(f); out.z = -172 + 14 * Math.cos(f); out.heading = Math.PI / 2 + f; }
      else {
        const d = Math.max(0, s - 229.68), k = 34 * smoothstep(0, 150, d) + 40 * smoothstep(250, 400, d);
        out.x = 46 + AX.x * d + AXR.x * k; out.z = (d > 0 ? -269.68 : -40 - s) + AX.z * d + AXR.z * k; out.heading = Math.PI - AX_YAW * smoothstep(217, 241, s);
      }
      // the tail: low over the path, curled up behind the rump while the whole cat is seen side-on (u 0.13 on), the
      // question mark held high from the corner of the house
      out.walked = s; out.tailUp = s > 140 ? 1 : u > 0.128 ? 2 : 0; return out;
    };

    // ---- the land: two strips, the yellow path, drawn shadows, garden furniture, trees ---------------------
    const land = new Pen(rng.fork('land')), over = new Pen(rng.fork('over'));
    drawStrip(land, GROUND_LINE, 0, false, { col: C.green, w: 5, press: 0.86, ang: 0.04 });
    drawStrip(land, SKY_LINE, SKY_Y, true, { col: C.blue, w: 6.5, press: look === 'night' ? 0.9 : 0.78, ang: -0.05 });
    if (look === 'rainy' || look === 'night') drawStrip(over, SKY_LINE, SKY_Y - 0.4, true, { col: C.black, w: 6, press: look === 'night' ? 0.7 : 0.5, ang: 0.5 });
    land.quad([-8, 0.15, 12], [8, 0.15, 12], [8, 0.15, -178.5], [-8, 0.15, -178.5], { col: C.yellow, w: 2.4, press: 0.86, ang: 0.15 });
    land.quad([-47, 0.2, -183], [-33, 0.2, -183], [-33, 0.2, -281], [-47, 0.2, -281], { col: C.purple, w: 2.2, press: 0.72, ang: 0.4 });
    // washing line (or birthday bunting): two posts and a sagging rope across the path
    for (const s of [-1, 1]) { land.line([[s * 24, 0, -80], [s * 24.6, 13, -80], [s * 24.2, 26, -80]], 0.5, { over: 0.6 }); drawShadow(land, s * 24, -80, 3); }
    land.line([[-24.3, 25.2, -80], [-12, 24.3, -80], [0, 24, -80], [12, 24.3, -80], [24.3, 25.2, -80]], 0.3, { over: 1.5 });
    // the far garden, drawn big enough to read from the roof: the swing's frame and the pond
    const SW = onAxis(325, -102), SWK = 2.2, PD = onAxis(385, 44);
    land.save().tr(SW[0], 0, SW[1]).ry(-AX_YAW).sc(SWK);
    for (const x of [-6, 6]) land.line([[x, 0, 3.5], [x, 14.4, 0], [x, 0, -3.5]], 0.45);
    land.bar([-7.5, 14.4, 0], [7.5, 14.4, 0], 0.5).restore(); drawShadow(land, SW[0], SW[1], 15);
    land.save().tr(PD[0], 0.25, PD[1]).ry(-AX_YAW).rx(-Math.PI / 2).disc(34, { n: 20, ry: 0.66, col: C.blue, w: 2.6, press: 0.8, ang: 0.2, outline: 0.5 });
    for (const [x, y, r] of [[-12, 4, 7], [9, -6, 5], [15, 9, 3.6]]) land.loop(x, y, r, r * 0.6, 0.26, { z: 0.15, col: C.paper, n: 9 });
    land.restore();
    // the vehicle, left of the path
    land.save().tr(-34, 0, -55).ry(0.12); drawVehicle(land, vehicle); land.restore(); drawShadow(land, -34, -55, 8, 0.5);
    await ctx.yield();
    // lollipop trees: four close behind the house, one by the path, seven in the far garden ([x, z, height, ball
    // radius, bend]); on a rare visit one more, the biggest, stands ahead and below the roof to be rubbed out
    const far = (s, lat, h, r, b) => { const q = onAxis(s, lat); return [q[0], q[1], h, r, b]; };
    const TREES = [[-42, -306, 30, 10, 1.5], [-20, -332, 33, 10.5, -1.5], [-46, -366, 29, 9.5, 1], [-25, -372, 31, 10, 2], [45, -62, 30, 10, -1.5],
      far(285, -38, 36, 12, -1), far(300, -170, 32, 10.5, 1.5), far(360, -8, 30, 10, 1), far(455, 36, 33, 11, 1), far(335, 168, 35, 11.5, -1.5), far(500, -90, 30, 10, 1), far(520, 190, 34, 11, 1),
      // one on the front lawn where the path swings left (the gaze rests on it at u 0.16), four nearer ones behind the house
      [-56, -134, 36, 10.5, 1.5], far(140, -104, 38, 12.5, 1), far(165, 98, 37, 12, -1.5), far(240, 138, 36, 12, 1), far(205, -190, 35, 11.5, 1)];
    const RT = far(180, -30, 36, 12, -1);
    const ballCol = look === 'autumn' ? C.yellow : C.green;
    const drawWholeTree = (p, o, t, k = 1) => {
      drawTree(p, t[0], t[1], t[2] * k, t[3] * k, ballCol, t[4]);
      if (look === 'autumn') o.save().tr(t[0] + t[4], (t[2] - t[3]) * k, t[1]).ball(t[3] * k + 0.25, { col: C.red, w: 2.0, press: 0.5, rim: 0.2, seg: 11, rings: 6, ang: 1.2 }).restore();
    };
    TREES.forEach((t) => { drawWholeTree(land, over, t); drawShadow(land, t[0], t[1], t[3] * 1.1); });
    if (rare) drawShadow(land, RT[0], RT[1], RT[3] * 1.1);
    // one more, beside the house on the left: with the washing it stands beside the cat at u 0.16 (in a pen of its
    // own, so that no other drawing's strokes shift)
    { const T2 = [-42, -228, 34, 10.5, 1], tp = new Pen(ownRng(1)), tov = new Pen(ownRng(2));
      drawWholeTree(tp, tov, T2); drawShadow(tp, T2[0], T2[1], T2[3] * 1.1); add(tp, null, 'tree2'); if (tov.n) add(tov, mats.over, 'tree2-over'); }
    // the apple tree is the nearest of the far garden: red dots on the side we see it from
    const at = TREES[5];
    for (let i = 0; i < 7; i++) { const a = i * 2.3, b = 0.2 + (i % 3) * 0.35; land.save().tr(at[0] + at[4] + Math.sin(a) * Math.cos(b) * at[3] * 0.96, at[2] - at[3] + Math.sin(b) * at[3] * 0.9, at[1] + Math.abs(Math.cos(a)) * Math.cos(b) * at[3] * 0.96).ball(1.5, { col: C.red, press: 1, hull: 0.3, seg: 6, rings: 4, rim: 0.05 }).restore(); }
    await ctx.yield();

    // ---- flowers as tall as doors, in two rows along the path ----------------------------------------------
    const gr = rng.fork('garden'), _m = new THREE.Matrix4(), _e = new THREE.Euler(), _qt = new THREE.Quaternion(), _s = new V3();
    const setM = (mesh, i, x, y, z, ry, sc, rx = 0, rz = 0) => { _qt.setFromEuler(_e.set(rx, ry, rz)); mesh.setMatrixAt(i, _m.compose(_p.set(x, y, z), _qt, _s.set(sc, sc, sc))); };
    const flowerMat = crayon.make({ sway: 1.5, swayH: 18, rate: 0.05 });
    const kinds = [['daisy', C.red], ['daisy', C.purple], ['daisy', C.blue], ['tulip', C.red], ['tulip', C.purple]], spots = kinds.map(() => []), feet = [];
    const perSide = Math.round(19 * clamp(dens, 0.85, 1.15));
    for (let i = 0; i < perSide; i++) for (const s of [-1, 1]) {
      const z = -22 - (i * 152) / perSide - gr() * 2, x = s * (15.5 + gr() * 1.6), k = Math.floor(gr() * 5), ry = (gr() - 0.5) * 0.9, sc = z > -78 ? 0.38 + gr() * 0.07 : 0.64 + gr() * 0.18;
      // (which spots count is still decided by the route this garden was first planted for, so that the same number
      // of random draws follows and the lawn, the clouds, the birds and the rain all stay where they were; a flower
      // that would now stand in the way of the swing is then left out)
      if (path0.nearestXZ(x, z).dist < (z < -84 ? 14 : 9) || (z < -144 && z > -172)) continue;
      feet.push([x, z]);
      if (path.nearestXZ(x, z).dist < 9.5) continue;
      spots[k].push([x, z, ry, sc]); drawShadow(land, x, z, 2.4);
    }
    const flowers = kinds.map(([kind, col], k) => {
      const p = new Pen(rng.fork('flower' + k)); drawFlower(p, kind, col);
      const m = new THREE.InstancedMesh(p.build(), flowerMat, Math.max(1, spots[k].length));
      spots[k].forEach((f, i) => setM(m, i, f[0], 0, f[1], f[2], f[3]));
      m.count = spots[k].length; m.frustumCulled = false; scene.add(m); return m;
    });
    await ctx.yield();
    // ---- grass: upright zigzags along both edges of the strip, round every foot, and loose on the lawn ----
    const tufts = [], gLen = lineLen(GROUND_LINE);
    for (let d = 2; d < gLen - 4; d += (d < 330 ? 2.7 : 4.5) / dens) for (const s of [-1, 1]) {
      alongLine(GROUND_LINE, d + gr() * 1.5, s, _l); const k = 1 - (1.2 + gr() * 2.6) / _l[2];
      alongLine(GROUND_LINE, d, s * k, _l); tufts.push([_l[0], _l[1], (0.75 + gr() * 0.5) * (d < 330 ? 1 : 1.5)]);
    }
    for (const [x, z] of feet) tufts.push([x + (gr() - 0.5) * 3, z + 0.8, 0.5 + gr() * 0.2]);
    for (const t of TREES) for (let i = 0; i < 4; i++) tufts.push([t[0] + (gr() - 0.5) * 9, t[1] + 1 + gr() * 3, 0.7 + gr() * 0.4]);
    for (const [x, z] of [[-24, -80], [24, -80], [-34, -52], [-30, -178], [30, -178], [-12, -178], [12, -178]]) for (let i = 0; i < 3; i++) tufts.push([x + (gr() - 0.5) * 6, z + 1 + gr() * 2, 0.6 + gr() * 0.3]);
    const loose = Math.round(820 * detail * dens);
    for (let i = 0; i < loose; i++) {
      // two in three on the lawn and round the house, the rest out on the fan, drawn larger where they are far
      const f = gr(), x0 = (gr() - 0.5) * 108, sc = 0.55 + gr() * 0.5;
      let x = x0, z = lerp(Z_NEAR - 6, -300, gr()), k = 1;
      if (f > 0.66) { alongLine(GROUND_LINE, 300 + gr() * 330, (gr() - 0.5) * 1.8, _l); x = _l[0]; z = _l[1]; k = 2.2; }
      if ((Math.abs(x) < 34 && z < -176 && z > -284) || (Math.abs(x) < 10 && z > -180) || Math.hypot(x - PD[0], z - PD[1]) < 40) continue;
      tufts.push([x, z, sc * k]);
    }
    const tuftPen = new Pen(rng.fork('tuft')); drawTuft(tuftPen);
    const grass = new THREE.InstancedMesh(tuftPen.build(), crayon.make({ double: true, sway: 0.6, swayH: 3, rate: 0.045 }), tufts.length);
    tufts.forEach((t, i) => setM(grass, i, t[0], 0, t[1], (gr() - 0.5) * 0.5, t[2]));
    grass.frustumCulled = false; scene.add(grass);
    await ctx.yield();

    // ---- things that move in the garden ---------------------------------------------------------------------
    // the runner
    const runCol = runnerCat ? C.black : C.red, runner = new THREE.Group(); scene.add(runner);
    { const p = new Pen(rng.fork('runner')); drawRunner(p, runCol, runnerCat); runner.add(p.mesh(crayon.base, 'runner')); }
    const legPen = new Pen(rng.fork('legs')); drawLegWheel(legPen, runnerCat ? C.black : C.red);
    const legGeo = legPen.build(), legs = [1.9, -1.9].map((z) => { const m = new THREE.Mesh(legGeo, crayon.base); m.position.set(0, 3.5, z); runner.add(m); return m; });
    // wheels
    const wheelSpec = vehicle === 'tractor' ? [[-2.6, 3, 3], [4.2, 1.6, 1.6]] : vehicle === 'bus' ? [[-5, 1.7, 1.7], [5, 1.7, 1.7]] : [[-3.8, 1.6, 1.6], [3.8, 1.6, 1.6]];
    const wheels = wheelSpec.map(([x, y, r]) => { const p = new Pen(rng.fork('wheel')); drawWheel(p, r); const m = add(p, null, 'wheel'); m.position.set(-34 + x * Math.cos(0.12), y, -55 - x * Math.sin(0.12)); return m; });
    // washing or bunting, hung from the rope; a gust lifts it as we pass under
    const wash = new Pen(rng.fork('wash')), washMat = crayon.make({ double: true, sway: 0.7, swayH: -9.5, y0: 24.6, rate: 0.06, dir: [0.1, 0.35, -1] });
    wash.tr(0, 0, -80);
    if (bunting) {
      const six = [C.red, C.yellow, C.blue, C.green, C.purple, C.black];
      for (let i = 0; i < 10; i++) { const x = -21.6 + i * 4.8, y = sag(x) - 0.2; wash.poly([[x - 2.1, y], [x + 2.1, y], [x, y - 6.4]], { col: six[i % 6], w: 0.7, press: 0.88, ang: i, outline: 0.24 }); }
    } else {
      wash.poly([[-23.5, 15.6], [-16.5, 15.2], [-16.5, sag(-16.5) - 0.2], [-23.5, sag(-23.5) - 0.2]], { col: C.blue, w: 1.2, press: 0.42, ang: 1.5, outline: 0.3 });
      wash.poly([[-4, 23.9], [-7.6, 22], [-6.6, 19.8], [-4, 21.2], [-4, 15.8], [3, 15.8], [3, 21.2], [5.6, 19.8], [6.6, 22], [3, 23.9], [0.6, 23.2], [-1.6, 23.2]].map((q) => [q[0] * 0.72 + 18.2, (q[1] - 24) * 0.85 + 24.5]), { col: C.red, w: 0.8, press: 0.86, ang: 0.5, outline: 0.3 });
      for (const [x, c] of [[-15.4, C.purple], [-12.9, C.yellow]]) wash.poly([[x, 24.3], [x + 1.1, 24.3], [x + 1.1, 20.6], [x + 2.2, 20.4], [x + 2.2, 19.2], [x, 19.2]], { col: c, w: 0.5, press: 0.9, ang: 0.3, outline: 0.26 });
      for (const x of [-22.5, -17.5, -14.9, -12.4, 14.5, 21.5]) wash.bar([x, sag(x) + 0.5, 0.1], [x, sag(x) - 0.9, 0.1], 0.2);
    }
    add(wash, washMat, 'washing');
    // the swing, still going
    const swing = add(new Pen(rng.fork('swing')).bar([-2.3, 0, 0], [-2.3, -11, 0], 0.2).bar([2.3, 0, 0], [2.3, -11, 0], 0.2).save().tr(0, -11.2, 0).box(5.6, 0.6, 1.8, { col: C.red, w: 0.5, press: 0.9, hull: 0.3 }).restore(), null, 'swing');
    swing.rotation.order = 'YXZ'; swing.position.set(SW[0], 14.2 * SWK, SW[1]); swing.scale.setScalar(SWK); swing.rotation.y = -AX_YAW;
    // the kite on its string (left of the axis, its string crossing the white gap), the red balloon, the falling apple
    // three kites on their strings: one far out on the left, one close beside the route (it passes large against
    // the white at u 0.74), one far on the right; mkKite places the diamond s metres down the axis, lat to its right
    const mkKite = (name, c1, c2, sK, lat, k) => {
      const m = add(drawKite(new Pen(rng.fork(name)), c1, c2), null, name), q = onAxis(sK - 10 * k, lat - 14 * k);
      m.position.set(q[0], 0, q[1]); m.scale.setScalar(k); m.rotation.order = 'YXZ'; m.rotation.y = -AX_YAW; return m;
    };
    const kites = [mkKite('kite', C.red, C.yellow, 182, -52, 1), mkKite('kite2', C.blue, C.yellow, 84, -23, 0.82), mkKite('kite3', C.purple, C.green, 250, 105, 1.25)];
    const balloon = add((() => {
      const p = new Pen(rng.fork('balloon'));
      p.save().sc(0.9, 1.08, 0.9).ball(4.3, { col: C.red, w: 1.0, press: 0.9, hull: 0.5, rim: 0.12, seg: 10, rings: 6 }).restore();
      return p.line([[0, -4.6, 0], [0.7, -8, 0], [-0.5, -11.5, 0], [0.6, -15, 0], [0, -18, 0]], 0.18);
    })(), null, 'balloon');
    const BL = onAxis(150, 72);
    // ---- the back garden's near things, drawn big: the reveal is as full as the opening ---------------------
    // three tied balloons on the right of the route
    const BT = onAxis(92, 31), tied = add((() => { const p = new Pen(rng.fork('tied')); p.tr(BT[0], 0, BT[1]).ry(-AX_YAW); drawBalloons(p); return p; })(), crayon.make({ sway: 1.8, swayH: 88, rate: 0.04 }), 'tied-balloons');
    drawShadow(land, BT[0], BT[1], 3);
    // flowers as tall as the house, their heads at our height either side of the route ([s, lat, scale])
    const tallMat = crayon.make({ sway: 2.2, swayH: 62, rate: 0.045 });
    [['daisy', C.red, [[55, -36, 1.05], [300, -215, 1.15]]], ['daisy', C.blue, [[128, 40, 1.2]]], ['tulip', C.purple, [rare ? [132, -80, 1.32] : [160, -46, 1.16], [262, 185, 1.2]]]].forEach(([kind, col, at], k) => {
      const p = new Pen(rng.fork('tall' + k)); drawTallFlower(p, kind, col);
      const m = new THREE.InstancedMesh(p.build(), tallMat, at.length);
      at.forEach(([sT, lat, sc], i) => { const q = onAxis(sT, lat); setM(m, i, q[0], 0, q[1], -AX_YAW + (i - 0.5) * 0.2, sc); drawShadow(land, q[0], q[1], 8); });
      m.frustumCulled = false; scene.add(m);
    });
    // the snail, creeping across the lawn below the route
    const SN = onAxis(300, 4), snail = add((() => { const p = new Pen(rng.fork('snail')); drawSnail(p); return p; })(), null, 'snail');
    snail.rotation.y = -AX_YAW;
    const snailShadow = add(new Pen(rng.fork('sshadow')).rx(-Math.PI / 2).disc(24, { n: 12, ry: 0.3, col: C.purple, w: 1.8, press: 0.72, ang: 0.3 }), null, 'snail-shadow');
    // two more washing lines: one square to the path where it swings left (its washing hangs across the top of
    // the frame at u 0.16 and a gust lifts it as we go under, at u 0.2), one twice the size far down the back garden
    const WB = onAxis(247, -108);
    // (the near one is drawn a little narrow, so that both its posts stand clear of the path and of the cat)
    const lines2 = [[-39, -93.5, 0.594, 1, 0.83], [WB[0], WB[1], 0.35 - AX_YAW, 1.9, 1]].map(([x, z, ry, k, kx], i) => {
      land.save().tr(x, 0, z).ry(ry).sc(k * kx, k, k);
      for (const sd of [-1, 1]) land.line([[sd * 24, 0, 0], [sd * 24.6, 13, 0], [sd * 24.2, 26, 0]], 0.5, { over: 0.6 });
      land.line([[-24.3, 25.2, 0], [-12, 24.3, 0], [0, 24, 0], [12, 24.3, 0], [24.3, 25.2, 0]], 0.3, { over: 1.5 }).restore();
      for (const sd of [-1, 1]) drawShadow(land, x + sd * 24 * k * kx * Math.cos(ry), z - sd * 24 * k * kx * Math.sin(ry), 3 * k);
      const p = new Pen(rng.fork('wash' + (i + 2))); p.tr(x, 0, z).ry(ry).sc(k * kx, k, k); drawClothes(p);
      const mat = crayon.make({ double: true, sway: 0.9 * k, swayH: -9.5 * k, y0: 24.6 * k, rate: 0.06, dir: [-Math.sin(ry), 0.35, -Math.cos(ry)] });
      add(p, mat, 'washing' + (i + 2)); return mat;
    });
    const apple = add(new Pen(rng.fork('apple')).ball(1.5, { col: C.red, press: 1, hull: 0.3, seg: 6, rings: 4, rim: 0.05 }), null, 'apple');
    // the cat's drawn shadow
    const catShadow = add(new Pen(rng.fork('cshadow')).rx(-Math.PI / 2).disc(34, { n: 14, ry: 0.3, col: C.purple, w: 1.8, press: 0.72, ang: 0.3 }), null, 'cat-shadow');
    await ctx.yield();
    // clouds: bare paper inside scalloped outlines, sliding to and fro along the sky strip (most of them over
    // its far end, where the reveal looks)
    const clouds = [], sLen = lineLen(SKY_LINE);
    for (let i = 0; i < 9; i++) {
      const p = new Pen(rng.fork('cloud' + i)); p.rx(Math.PI / 2).poly(cloudPts(gr, 22 + gr() * 9, 12 + gr() * 5), { col: C.paper, press: 0, outline: 0.9, lcol: look === 'sunny' || look === 'autumn' ? C.blue : C.black });
      const m = add(p, null, 'cloud'), d = i < 5 ? sLen - 44 - i * 34 - gr() * 8 : 60 + (i - 5) * 78 + gr() * 20;
      m.userData = { d, g: i < 5 ? [-0.52, 0.5, -0.12, 0.66, -0.7][i] + (gr() - 0.5) * 0.08 : (gr() - 0.5) * 0.9, v: 1.1 + gr() * 0.8, ph: gr() * 4 };
      if (d > 300) m.rotation.y = -AX_YAW;
      clouds.push(m);
    }
    // V-birds: black line, flapping between two poses under the strip and out across the gap; drawn face-on,
    // as a drawn bird always is
    const nBirds = Math.max(24, Math.round(40 * detail)), birdPen = new Pen(rng.fork('bird'));
    birdPen.line([[-3.8, 2.7, 0.5], [-1.8, 1.5, 0.2], [0, 0, 0], [1.8, 1.5, 0.2], [3.8, 2.7, 0.5]], 0.34);
    const birds = new THREE.InstancedMesh(birdPen.build(), crayon.make({ flap: 0.3, rate: 0.25 }), nBirds); birds.frustumCulled = false; scene.add(birds);
    const birdData = [], bLen = sLen + 170;
    for (let i = 0; i < nBirds; i++) birdData.push({ d: gr() * bLen, g: (gr() - 0.5) * 1.5, y: i % 3 === 0 ? 66 + gr() * 34 : 104 + gr() * 28, v: (7 + gr() * 6) * (i % 4 === 0 ? -1 : 1), sc: 0.85 + gr() * 0.35, ax: i % 5 === 0 });
    // a patrol bird's place s along its own course (metres along the strip for a bird that flies along it, g for one that
    // sweeps across it), moved k metres: kind 0 up, 1 down, 2 and 3 to either side (along the strip for a sweeping bird)
    const birdAt = (b, s, kind, k, out) => {
      const e = kind === 2 ? k : kind === 3 ? -k : 0;
      if (b.ax) alongLine(SKY_LINE, b.d + e, s, _l); else { alongLine(SKY_LINE, s, b.g, _l); if (e) alongLine(SKY_LINE, s, b.g + e / _l[2], _l); }
      out[0] = _l[0]; out[1] = b.y + (kind === 0 ? k : kind === 1 ? -k : 0); out[2] = _l[1];
      return out;
    };
    const birdEase = (o, s) => (s < o.lo ? smoothstep(o.lo - o.r, o.lo, s) : 1 - smoothstep(o.hi, o.hi + o.r, s)), _bp = [0, 0, 0];
    await ctx.yield();
    // the patrol birds keep off the flown line by place, wherever the eye is: a course that passes nearer the route's line
    // than half the bird's own span (the bird itself across the lens) is moved off it, to 1 m plus its span, over that
    // whole pass, by the least lift or the least turn aside that clears the whole line (a lift first at an equal size),
    // eased in and out over 60 m of the course
    {
      const RT = [], _b = [0, 0, 0];
      for (let k = 0; k <= 600; k++) { path.pointAt(k / 600, _p); RT.push([_p.x, _p.y, _p.z]); }
      const seg2 = (p, a, b) => {
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], t = clamp(((p[0] - a[0]) * ux + (p[1] - a[1]) * uy + (p[2] - a[2]) * uz) / (ux * ux + uy * uy + uz * uz || 1), 0, 1);
        const dx = p[0] - a[0] - ux * t, dy = p[1] - a[1] - uy * t, dz = p[2] - a[2] - uz * t;
        return dx * dx + dy * dy + dz * dz;
      };
      // the stretch of the route between two heights, and whether a place stands `need` off it
      const span = (y0, y1) => { let a = -1, c = -1; for (let k = 1; k <= 600; k++) if (Math.max(RT[k - 1][1], RT[k][1]) >= y0 && Math.min(RT[k - 1][1], RT[k][1]) <= y1) { if (a < 0) a = k; c = k; } return [a, c]; };
      const off = (p, w, need) => { for (let k = w[0]; k > 0 && k <= w[1]; k++) if (seg2(p, RT[k - 1], RT[k]) < need * need) return false; return true; };
      const gap2 = (p, w) => { let g = 1e9; for (let k = w[0]; k > 0 && k <= w[1]; k++) g = Math.min(g, seg2(p, RT[k - 1], RT[k])); return g; };
      for (let i = 9; i < nBirds; i++) {
        const b = birdData[i], need = 1 + 7.6 * b.sc, hw = alongLine(SKY_LINE, b.d, 0, _l)[2];
        const s0 = b.ax ? -0.8 : 0, s1 = b.ax ? 0.8 : bLen, ds = b.ax ? 0.5 / hw : 0.5, r = 120 * ds, n = Math.round((s1 - s0) / ds);
        let lo = -1, hi = -1, jm = 0, gm = 1e9; const w0 = span(b.y - need, b.y + need), w8 = span(b.y - need - 8, b.y + need + 8);
        // every 8 m of the course first, then every half metre round the places found near
        for (let j = 0; j <= n; j += 16) if (!off(birdAt(b, s0 + j * ds, 0, 0, _b), w8, need + 8)) for (let q = Math.max(0, j - 15); q <= Math.min(n, j + 15); q++) {
          const g = gap2(birdAt(b, s0 + q * ds, 0, 0, _b), w0);
          if (g < need * need) { if (lo < 0 || q < lo) lo = q; if (q > hi) hi = q; }
          if (g < gm) { gm = g; jm = q; }
        }
        if (gm >= 3.8 * b.sc * 3.8 * b.sc) continue;
        const o = { lo: s0 + lo * ds, hi: s0 + hi * ds, r, kind: 0, m: 0 }, j0 = Math.max(0, lo - 120), j1 = Math.min(n, hi + 120), hp = b.ax ? hw : alongLine(SKY_LINE, (o.lo + o.hi) / 2, 0, _l)[2];
        search: for (let m = 0.25; m <= 40; m += 0.25) for (let kind = 0; kind < 4; kind++) {
          if (kind === 0 ? b.y + m > 134 : kind === 1 ? b.y - m < 60 : b.ax ? b.d + (kind === 2 ? m : -m) < 24 || b.d + (kind === 2 ? m : -m) > bLen - 24 : Math.abs(b.g + (kind === 2 ? m : -m) / hp) > 0.8) continue;
          const w = kind === 0 ? span(b.y - need, b.y + m + need) : kind === 1 ? span(b.y - m - need, b.y + need) : w0;
          const at = (j) => { const s = s0 + j * ds; return off(birdAt(b, s, kind, m * birdEase(o, s), _b), w, need); };
          let ok = at(jm);   // where the course ran nearest first
          for (let j = j0; j <= j1 && ok; j++) ok = at(j);
          if (ok) { o.kind = kind; o.m = m; b.mv = o; break search; }
        }
      }
    }
    await ctx.yield();
    // round the sun's window, so that the last picture of the flight is a finished drawing: two balloons tied below
    // it on the left, a small kite on the right, two birds crossing its face. All of it stands beside the
    // opening and close to its plane: nothing is ever in front of the way out
    const sunG = hero.sun.group, sunBirds = new THREE.InstancedMesh(birds.geometry, birds.material, 2);
    sunBirds.frustumCulled = false; sunG.add(sunBirds);
    const SUNB = [[12.5, 6.4, 3.2, 0.45, 1], [-12.6, -3.2, 3.4, 0.45, -1]];
    const sunKite = (() => { const k = new Pen(ownRng(4)); k.tr(7.6, -47.1, 7.4).sc(0.5); drawKite(k, C.red, C.blue); return k.mesh(crayon.base, 'sun-kite'); })();
    sunG.add(sunKite);
    { const bp = new Pen(ownRng(3));
      for (const [x, y, z, r, c] of [[-14.2, 3.6, 2.2, 3.1, C.red], [-18.4, -2.4, 2.8, 2.7, C.blue]]) {
        bp.line([[-11.5, -15, 1.5], [x * 0.9 + 1.2, y - 9, z], [x - 0.6, y - 5, z], [x, y - r * 1.12, z]], 0.16);
        bp.save().tr(x, y, z).sc(0.9, 1.08, 0.9).ball(r, { col: c, w: 0.8, press: 0.9, hull: 0.4, rim: 0.12, seg: 10, rings: 6 }).restore();
      }
      sunG.add(bp.mesh(crayon.make({ sway: 0.7, swayH: 18, y0: -15, rate: 0.045 }), 'sun-balloons')); }
    // butterflies as big as the dog: purple and yellow bow-ties
    const nFly = look === 'rainy' ? 0 : 6, flyPen = new Pen(rng.fork('fly'));
    flyPen.poly([[0, 0], [-3.5, 2.7], [-3.5, -2.3]], { col: C.purple, w: 0.6, press: 0.9, ang: 0.4, back: {}, outline: 0.22 }).poly([[0, 0], [3.5, 2.7], [3.5, -2.3]], { col: C.yellow, w: 0.6, press: 0.9, ang: 0.9, back: {}, outline: 0.22 }).bar([0, -1.5, 0], [0, 1.9, 0], 0.26);
    const flies = new THREE.InstancedMesh(flyPen.build(), crayon.make({ flap: 0.55, rate: 0.25 }), 6); flies.frustumCulled = false; flies.count = nFly; flies.visible = nFly > 0; scene.add(flies);
    const F1 = onAxis(92, -34), F2 = onAxis(58, 36);
    const flyData = [[21, 13, -66], [-12, 17, -96], [14, 12, -126], [-54, 15, -150], [F1[0], 70, F1[1]], [F2[0], 80, F2[1]]].map((c, i) => ({ c, r: 4 + gr() * 3, v: 0.5 + gr() * 0.4, ph: gr() * 6 + i }));
    // wax crumbs drifting through the white
    const nCr = Math.round(1500 * detail * clamp(dens, 0.8, 1.2)), cg = new THREE.BufferGeometry();
    { const pos = new Float32Array(nCr * 12), col = new Float32Array(nCr * 12), qd = new Float32Array(nCr * 8), ph = new Float32Array(nCr * 4), idx = new Uint32Array(nCr * 6);
      const six = [C.red, C.yellow, C.blue, C.green, C.purple, C.black];
      for (let i = 0; i < nCr; i++) {
        const x = gr() * 170, y = gr() * 130, z = gr() * 170, c = six[Math.floor(gr() * 6)], f = gr();
        for (let k = 0; k < 4; k++) { pos.set([x, y, z], i * 12 + k * 3); col.set([c.r, c.g, c.b], i * 12 + k * 3); qd.set([k === 0 || k === 3 ? -1 : 1, k < 2 ? -1 : 1], i * 8 + k * 2); ph[i * 4 + k] = f; }
        idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
      }
      cg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); cg.setAttribute('aCol', new THREE.BufferAttribute(col, 3)); cg.setAttribute('aQ', new THREE.BufferAttribute(qd, 2)); cg.setAttribute('aPh', new THREE.BufferAttribute(ph, 1)); cg.setIndex(new THREE.BufferAttribute(idx, 1)); }
    const crumbMat = new THREE.ShaderMaterial({ uniforms: { uTime: { value: 0 }, uPix: crayon.shared.uPix, uBox: { value: new V3(170, 130, 170) } }, vertexShader: CRUMB_VERT, fragmentShader: CRUMB_FRAG, side: THREE.DoubleSide });
    const crumbs = new THREE.Mesh(cg, crumbMat); crumbs.frustumCulled = false; scene.add(crumbs);
    await ctx.yield();

    // ---- the seeded looks: rain, night, autumn --------------------------------------------------------------
    // a point under the sky strip, even over its area: the fan is wider, so it is drawn from more often
    const underSky = (out) => { const f = gr(); return alongLine(SKY_LINE, 8 + (f < 0.4 ? gr() * 300 : 300 + Math.sqrt(gr()) * (sLen - 320)), (gr() - 0.5) * 1.84, out); };
    let rain = null, brolly = null, stars = null; const leaves = [], leafData = [];
    if (look === 'rainy') {
      const dp = new Pen(rng.fork('dash')); dp.ribbon([[0, 0], [0, -1]], 0.1, { col: C.blue }).ribbon([[0, -1], [0, -1.08]], 0.36, { col: C.blue });
      const n = Math.round(440 * detail * dens); rain = new THREE.InstancedMesh(dp.build(), crayon.make({ double: true, sway: 1.5, swayH: -1, y0: 0, rate: 0.05 }), n);
      let k = 0;
      for (let i = 0; i < n; i++) {
        underSky(_l); const x = _l[0], z = _l[1]; let L = 14 + gr() * gr() * 62; const near = path.nearestXZ(x, z);
        if (near.dist < 9 && SKY_Y - L < near.y + 9) L = SKY_Y - near.y - 10;
        // nothing hangs in front of the sun's window on the way in
        if (L < 6 || (Math.abs((x - ROOF.x) * AXR.x + (z - ROOF.z) * AXR.z) < 26 && (x - ROOF.x) * AX.x + (z - ROOF.z) * AX.z > 40 && (x - ROOF.x) * AX.x + (z - ROOF.z) * AX.z < 172)) continue;
        rain.setMatrixAt(k++, _m.compose(_p.set(x, SKY_Y - 0.5, z), _qt.identity(), _s.set(1, L, 1)));
      }
      rain.count = k; rain.frustumCulled = false; scene.add(rain);
      for (const [x, z] of [[-3, -22], [4, -58], [-2, -96], [3, -128], [-1, -160]]) { land.save().tr(x, 0.3, z).rx(-Math.PI / 2); for (let i = 0; i < 3; i++) land.loop((gr() - 0.5) * 5, (gr() - 0.5) * 6, 2.2 + gr() * 2, 1.3 + gr(), 0.28, { col: C.blue, n: 9 }); land.restore(); }
      const drawBrolly = (p, col, tilt, k = 1) => {
        p.rz(tilt).sc(k).line([[1.4, 1.2, 0], [0.7, 0, 0], [0, 0.8, 0], [0, 12, 0]], 0.26);
        p.tr(0, 8.2, 0).loft([[0, 5.6], [1.8, 4.6], [3.1, 2.7], [3.8, 0.5], [3.9, 0]], { col, w: 1.0, press: 0.88, hull: 0.45, rim: 0.1, seg: 10, ang: tilt * 4 });
      };
      const U1 = onAxis(345, -58), U2 = onAxis(330, 132), U3 = onAxis(430, -20);
      [[-24, -30, C.red, 1], [25, -46, C.yellow, 1], [-42, -104, C.yellow, 1], [36, -122, C.red, 1], [30, -18, C.red, 1], [U1[0], U1[1], C.yellow, 3], [U2[0], U2[1], C.red, 3], [U3[0], U3[1], C.yellow, 3]].forEach(([x, z, c, k], i) => { land.save().tr(x, 0, z); drawBrolly(land, c, (i % 3 - 1) * 0.22, k); land.restore(); drawShadow(land, x, z, 4.5 * k); });
      const bp = new Pen(rng.fork('brolly')); drawBrolly(bp, C.red, 0.3); brolly = add(bp, null, 'brolly'); brolly.position.set(22, 0, -132);
    }
    if (look === 'night') {
      const sp = new Pen(rng.fork('stars'));
      for (let i = 0; i < 40; i++) {
        underSky(_l); const x = _l[0], z = _l[1], y = 84 + gr() * 46;
        if (path.distanceTo(x, y, z) < 14) continue;
        const pts = []; for (let k = 0; k < 10; k++) { const a = (k / 10) * TAU + 0.3, r = k % 2 ? 1.2 : 2.8; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
        sp.bar([x, SKY_Y, z], [x, y + 2.6, z], 0.14).save().tr(x, y, z).ry(z < -300 ? -AX_YAW : 0).poly(pts, { col: C.yellow, w: 0.6, press: 0.95, gap: false, back: {}, outline: 0.2 }).restore();
      }
      stars = add(sp, crayon.make({ sway: 1.6, swayH: -50, y0: SKY_Y, rate: 0.04 }), 'stars');
    }
    if (look === 'autumn') {
      const n = Math.round(56 * detail);
      for (const c of [C.red, C.yellow]) {
        const lp = new Pen(rng.fork('leaf')); lp.ribbon([[-1.3, 0], [-0.45, 1], [0.45, -0.2], [1.3, 0.8]], 0.3, { col: c });
        const m = new THREE.InstancedMesh(lp.build(), crayon.twoSided, n); m.frustumCulled = false; scene.add(m); leaves.push(m);
        for (let i = 0; i < n; i++) leafData.push({ x: (gr() - 0.5) * 150, y: 6 + gr() * 126, z: lerp(Z_NEAR - 20, -520, gr()), v: 2 + gr() * 3, f: 1 + gr() * 2, ph: gr() * 9 });
      }
    }
    scene.add(land.mesh(crayon.base, 'land'));
    if (over.n) scene.add(over.mesh(mats.over, 'over'));
    await ctx.yield();

    // ---- the rare event: the eraser, the crayon, the tree that goes and the tree that comes -------------------
    const R = { on: rare };
    if (rare) {
      const oldMat = crayon.make(), newMat = crayon.make();
      const po = new Pen(rng.fork('old')); drawTree(po, RT[0], RT[1], RT[2], RT[3], ballCol, RT[4]); R.old = add(po, oldMat, 'old-tree'); R.oldMat = oldMat;
      const pn = new Pen(rng.fork('new')); drawTree(pn, RT[0], RT[1], RT[2] * 1.35, RT[3] * 1.35, C.green, RT[4]); R.neu = add(pn, newMat, 'new-tree'); R.newMat = newMat; newMat.uniforms.uDraw.value.x = -1; newMat.uniforms.uLineAhead.value = 2.4;
      const pe = new Pen(rng.fork('eraser'));
      pe.box(30, 9, 11, { col: C.pink, w: 2.4, press: 0.97, ang: 0.3, hull: 0.7 }).save().tr(6, 0, 0).box(7, 9.4, 11.4, { col: C.blue, w: 1.2, press: 0.85, ang: 1.2 }).restore();
      R.eraser = add(pe, null, 'eraser'); R.eraser.visible = false;
      const pc = new Pen(rng.fork('crayon'));
      pc.loft([[0, 0.25], [8, 4.2], [58, 4.2], [60, 3.4]], { col: C.green, w: 2.0, press: 0.97, hull: 0.7, rim: 0.08, seg: 8 }).loft([[20, 4.45], [44, 4.45]], { col: C.paper, press: 0, hull: 0.35, seg: 8 });
      R.crayon = add(pc, null, 'big-crayon'); R.crayon.visible = false;
      const pb = new Pen(rng.fork('bits'));
      for (let i = 0; i < 28; i++) pb.save().tr((gr() - 0.5) * 30, -gr() * 26, (gr() - 0.5) * 14).ry(gr() * 3).box(1.6 + gr() * 1.4, 0.9, 1.2, { col: C.pink, press: 1, w: 0.4, gap: false }).restore();
      R.bits = add(pb, null, 'eraser-bits'); R.bits.visible = false;
    }
    await ctx.yield();

    // ---- the journey ------------------------------------------------------------------------------------------
    const len = path.length, cs = { x: 0, z: 0, heading: 0, walked: 0, tailUp: false }, st = { door: 0, duck: 0, curtains: 0, cat: cs }, poiCat = { x: 0, z: 0, heading: 0, walked: 0 }, _poi = new V3();
    // the nine birds cross the axis 48 m ahead of where we are at u 0.72, in the white between us and the sun
    const sCross = path.pointAt(0.72, new V3()).sub(ROOF).dot(AX) + 48, yCross = path.pointAt(0.72, new V3()).y + 4;
    const wrap = (v, lo, span) => lo + ((((v - lo) % span) + span) % span);
    const pingpong = (v, span) => { const m = wrap(v, 0, span * 2); return m < span ? m : span * 2 - m; };
    const appleTop = at[2] - at[3] * 1.9;
    const faceCam = (x, z) => Math.atan2(_c.x - x, _c.z - z);
    // the runner's own way from u 0.12 on: [u, x, z]
    const RUN = [[0.12, -24, -88], [0.16, -8, -136], [0.2, -4, -154], [0.24, -3, -171], [0.305, -3, -171], [0.33, -45, -166], [0.37, -110, -156]];
    function update(dt, time, camera, u) {
      crayon.tick(time, camera, ctx.renderer && ctx.renderer.getDrawingBufferSize ? ctx.renderer.getDrawingBufferSize(_sz).y : 0);
      camera.getWorldPosition(_c);
      const boil = Math.floor(time * 8), ht = boil / 8;
      // the cat, the door, the duck, the curtains: all functions of u, held between drawings
      catAt(u, cs);
      const td = (u - 0.29) / 0.03;
      st.door = Math.round(clamp(td <= 0 ? 0 : td < 1 ? td * td : 1 - 0.2 * Math.exp(-(td - 1) * 3) * Math.cos((td - 1) * 10), 0, 1.05) * 6) / 6;
      st.duck = clamp((u - (uBath + 0.012)) / 0.035, 0, 1);
      st.curtains = Math.round(clamp((u - 0.85) / 0.025, 0, 1) * 4) / 4;
      hero.update(dt, time, camera, st);
      catShadow.position.set(cs.x - 7, 0.24, cs.z + 4); catShadow.rotation.y = cs.heading - Math.PI / 2;
      // the runner falls in on the left at u 0.03, runs with us, and peels off the page before the door
      // the runner falls in on the left at u 0.03 and runs with us; when we swing left it keeps to the lawn and the
      // yellow path (RUN), waits at the door, and is off round the left of the house when the door bangs open
      const dCam = u * len, jo = smoothstep(0.015, 0.06, u), sw = bell(u, 0.085, 0.27, 0.35);
      path.posAtDist(dCam + 33 + sw * 9, _p); path.tangentAtDist(dCam + 33 + sw * 9, _r); _r.y = 0; _r.normalize();
      const lat = 15 - sw * 8 + (1 - jo) * 36, kr = smoothstep(0.118, 0.15, u);
      let rx = _p.x + _r.z * lat, rz = _p.z - _r.x * lat, rr = Math.atan2(_r.x, _r.z) - (1 - jo) * 0.5;
      if (kr > 0) {
        let i = 0; while (i < RUN.length - 2 && u > RUN[i + 1][0]) i++;
        const a = RUN[i], b = RUN[i + 1], f = clamp((u - a[0]) / (b[0] - a[0]), 0, 1), dx = b[1] - a[1], dz = b[2] - a[2];
        rx = lerp(rx, a[1] + dx * f, kr); rz = lerp(rz, a[2] + dz * f, kr);
        if (kr > 0.5) rr = dx * dx + dz * dz > 1 ? Math.atan2(dx, dz) : Math.PI;
      }
      runner.position.set(rx, (boil % 2) * 0.35, rz); runner.rotation.y = rr;
      legs[0].rotation.x = boil * 1.1; legs[1].rotation.x = boil * 1.1 + 0.8;
      for (const w of wheels) w.rotation.set(0, 0.12, -boil * 0.5);
      washMat.uniforms.uSway.value.x = 0.7 + 3.6 * bell(u, 0.115, 0.205, 0.4);
      swing.rotation.x = [-0.4, 0, 0.4, 0][Math.floor(boil / 5) % 4];
      kites.forEach((k, i) => { k.rotation.z = [-0.035, 0, 0.03, 0][Math.floor(boil / 6 + i) % 4]; k.rotation.x = [0, 0.02, 0, -0.02][Math.floor(boil / 9 + i * 2) % 4]; });
      lines2[0].uniforms.uSway.value.x = 0.9 + 3.4 * bell(u, 0.13, 0.26, 0.4);
      // the snail creeps to the right, stretching and gathering itself
      const sl = pingpong(ht * 0.7, 26), sq = Math.floor(boil / 6) % 2;
      snail.position.set(SN[0] + AXR.x * sl, 0, SN[1] + AXR.z * sl); snail.scale.set(sq ? 1.05 : 1, sq ? 0.97 : 1, 1);
      snailShadow.position.set(snail.position.x - 8, 0.24, snail.position.z + 5); snailShadow.rotation.y = -AX_YAW;
      balloon.position.set(BL[0] + Math.sin(ht * 0.4) * 1.5, 64 + ((ht * 1.4) % 36), BL[1]);
      const ac = (ht * 0.4) % 1, af = Math.min(1, ac * 2.4);
      apple.position.set(at[0] + at[4] + 4, appleTop - af * af * (appleTop - 1.5), at[1] + 9);
      for (const c of clouds) { const o = c.userData; alongLine(SKY_LINE, o.d + pingpong(ht * o.v + o.ph * 20, 34) - 17, o.g, _l); c.position.set(_l[0], SKY_Y - 0.8, _l[1]); }
      // birds: nine cross ahead at u 0.72, the rest patrol under the strip and out through the gap
      const tb = (u - 0.725) / 0.05;
      for (let i = 0; i < nBirds; i++) {
        const b = birdData[i];
        if (i < 9) {
          const s = sCross + (i % 2) * 9 + Math.abs(i - 4) * 3, la = tb * 52 + (i - 4) * 8.5, x = ROOF.x + AX.x * s + AXR.x * la, z = ROOF.z + AX.z * s + AXR.z * la;
          setM(birds, i, x, yCross + (i % 3) * 4 - Math.abs(i - 4) * 1.5, z, faceCam(x, z), 1.08);
        } else {
          const d = b.ax ? b.d : wrap(b.d + time * b.v, 0, bLen), g = b.ax ? (pingpong(time * Math.abs(b.v) * 0.012 + b.g + 2, 1.6) - 0.8) : b.g;
          const o = b.mv, s = b.ax ? g : d;
          birdAt(b, s, o ? o.kind : 0, o ? o.m * birdEase(o, s) : 0, _bp);
          setM(birds, i, _bp[0], _bp[1], _bp[2], faceCam(_bp[0], _bp[2]), b.sc * smoothstep(0, 24, d) * (1 - smoothstep(bLen - 24, bLen, d)));
        }
      }
      birds.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 2; i++) { const b = SUNB[i]; setM(sunBirds, i, b[0] + b[4] * (u - 0.94) * 25, b[1] + (Math.floor(boil / 4 + i) % 2) * 0.3, b[2], 0, b[3]); }
      sunBirds.instanceMatrix.needsUpdate = true;
      sunKite.position.x = [-0.25, 0, 0.25, 0][Math.floor(boil / 6) % 4];
      for (let i = 0; i < nFly; i++) { const f = flyData[i], a = ht * f.v + f.ph; setM(flies, i, f.c[0] + Math.cos(a) * f.r, f.c[1] + Math.sin(a * 1.7) * 2.5, f.c[2] + Math.sin(a) * f.r * 0.6, a, 1); }
      if (nFly) flies.instanceMatrix.needsUpdate = true;
      crumbMat.uniforms.uTime.value = ht;
      if (brolly) brolly.rotation.y = boil * 0.4;
      if (leaves.length) {
        const n = leafData.length / 2;
        for (let i = 0; i < leafData.length; i++) { const l = leafData[i], k = Math.floor(ht * l.f + l.ph); setM(leaves[i < n ? 0 : 1], i % n, wrap(l.x + ht * l.v, -80, 160) + Math.max(0, ROOF.z - l.z) * 0.32, wrap(l.y - ht * l.f * 1.2, 4, 130), l.z, k * 1.3, 1, k * 0.9, k * 2.1); }
        leaves[0].instanceMatrix.needsUpdate = true; leaves[1].instanceMatrix.needsUpdate = true;
      }
      if (R.on) {
        // 0.62 the eraser comes down; 0.622-0.70 it rubs the tree to a smear (done by 0.66, as we leave the roof); 0.69 the crayon arrives; 0.71-0.768 it redraws
        const top = RT[2] - RT[3], rub = clamp((u - 0.622) / 0.04, 0, 1), inE = smoothstep(0.612, 0.638, u), outE = smoothstep(0.702, 0.732, u);
        R.oldMat.uniforms.uDraw.value.y = Math.round(rub * 8) / 8 * 0.56;
        R.eraser.visible = u > 0.61 && u < 0.737;
        R.eraser.position.set(RT[0] - 9 + Math.sin(boil * 1.3) * 6 * (1 - outE) - outE * 50, top + 12 - rub * 9 + (1 - inE) * 70 + outE * 60 + Math.cos(boil * 0.9) * 2.5, RT[1] + 2);
        R.eraser.rotation.set(0, 0.3, 0.45 + Math.sin(boil * 1.3) * 0.2);
        R.bits.visible = rub > 0.05 && u < 0.745; R.bits.position.set(RT[0], top + 4 - (boil % 6) * 2.4, RT[1] + 3);
        const drawn = clamp((u - 0.71) / 0.058, 0, 1), H = RT[2] * 1.35 + 3, yd = Math.round(drawn * 24) / 24 * H;
        R.newMat.uniforms.uDraw.value.x = drawn <= 0 ? -1 : yd;
        const inC = smoothstep(0.684, 0.71, u), outC = smoothstep(0.776, 0.816, u), wide = yd > RT[2] * 1.35 * 0.55 ? RT[3] * 1.2 : 2;
        R.crayon.visible = u > 0.68 && u < 0.82;
        R.crayon.position.set(RT[0] + RT[4] + Math.sin(boil * 1.7) * wide, yd + (1 - inC) * 90 + outC * 90, RT[1] + 1);
        R.crayon.rotation.set(0.12, 0, -0.3 + Math.sin(boil * 1.7) * 0.12);
      }
    }
    update(0, 0, { projectionMatrix: new THREE.Matrix4().makePerspective(-1, 1, 0.5, -0.5, 1, 100), getWorldPosition: (v) => v.set(0, 9, 0) }, 0);

    const REV = onAxis(430);
    // where the gaze rests in the garden, [u, x, y, z]: on the cat as it crosses the lawn (whole at u 0.16), on the
    // house front from the far point of the swing (whole at u 0.25), then in at the open door (u 0.34)
    const GAZE = [[0.12, 8, 44, -182], [0.16, 20, 27, -170], [0.2, 38, 28, -182], [0.25, -1, 27.5, -182], [0.3, 2, 20, -186], [0.34, 1, 12, -195], [0.42, -3, 12, -200]], _gz = new V3();
    const gaze = (time, u) => {
      let i = 0; while (i < GAZE.length - 2 && u > GAZE[i + 1][0]) i++;
      const a = GAZE[i], b = GAZE[i + 1], f = smoothstep(a[0], b[0], u);
      return _gz.set(lerp(a[1], b[1], f), lerp(a[2], b[2], f), lerp(a[3], b[3], f));
    };
    const pois = [
      { at: [6, 54, -185], from: -0.3, to: 0.245, weight: 0.5, fade: 0.25 },
      // the garden's three pictures (GAZE): the whole cat, the whole house front, the open door. Six of the same,
      // so that the gaze is this one's alone and a steady camera, which follows a poi a third as hard, still turns
      ...[0, 1, 2, 3, 4, 5].map(() => ({ at: gaze, from: 0.122, to: uDoor + 0.005, weight: 0.9, fade: 0.2 })),
      { at: [22.4, 7, -201], from: uDoor - 0.012, to: uDoor + 0.05, weight: 0.62, fade: 0.3 },
      { at: [hero.anchors.bath.x - 0.5, 21, hero.anchors.bath.z + HZ + 1.5], from: uBath - 0.075, to: uBath + 0.056, weight: 0.85, fade: 0.25 },
      // (the same again: a steady camera follows a poi only a third as hard, and one alone leaves the tub cut by the frame)
      { at: [hero.anchors.bath.x - 0.5, 21, hero.anchors.bath.z + HZ + 1.5], from: uBath - 0.075, to: uBath + 0.056, weight: 0.6, fade: 0.25 },
      { at: [hero.anchors.bed.x + 1, 26.5, hero.anchors.bed.z + HZ + 1], from: uBed - 0.045, to: uBed + 0.035, weight: 0.85, fade: 0.25 },
      // the reveal: the route climbs straight at the sun; a point far down the axis and below eye level holds the
      // gaze nearly level, so the green band, the white gap, the sun and the blue band are all in the frame
      // from the top flight the gaze is already on the sun's window, seen through the open patch of roof between
      // the ridge and the chimney
      { at: [SUN.x, SUN.y - 4, SUN.z], from: uBed + 0.02, to: uRoof + 0.004, weight: 0.6, fade: 0.3 },
      { at: [REV[0], 40, REV[1]], from: uRoof - 0.024, to: 0.84, weight: 0.53, fade: 0.2 },
    ];
    if (rare) pois.push({ at: [RT[0] + 6, 30, RT[1]], from: 0.63, to: 0.82, weight: 0.3 });
    return {
      scene, path, duration: 50, pace, pois,
      title: look === 'rainy' ? 'My House, in Crayon (Rain)' : look === 'night' ? 'My House, in Crayon (Night)' : look === 'autumn' ? 'My House, in Crayon (Autumn)' : 'My House, in Crayon',
      ride: 'none', companion: 'none', style: 'none',
      camera: { fov: 44, near: 0.5, far: 3000, lookAhead: 22, sway: 0.6, bank: 0 },
      // blendDistance: a flat world keeps its exact colours until the last 25 m
      portal: { shape: 'rect', width: 14, height: 14, color: '#FFD21F', tilt: true, style: 'ring', glow: 0.5, halo: false, blendDistance: 25 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } },
      update,
      dispose() {},
    };
  },
};
