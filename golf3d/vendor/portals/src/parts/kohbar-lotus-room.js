// THE KOHBAR: hero set piece of "kohbar-lotus-room".
//
// The lotus wheel painted and modelled on the east gable of a Mithila bridal room, twenty times life size:
// a hub pad 16 m across and six lotus pads of 18 m round it, each a cushion of mud relief 1.5 m proud with a
// leaf notch, painted in rings inside a hatched double outline with a fan of dotted veins, its thickness a
// solid-colour rim. A bamboo stem 4 m wide with black node rings rises from the plinth through the hub to a
// small crown flower under the gable peak and stays still while the six pads and the 24 buds between them
// wheel round it (one turn in 90 s). Each bud is eight hinged relief petals over a green calyx; when it opens
// the petals swing out into a rosette and a dotted heart swells in the middle. Outside the wheel eight fish,
// four turtles and eight parrots circle head to tail the other way, bent onto the plaster in the vertex
// shader so they ride its bulges. The piece includes the gable wall itself (rice-white ground, banded plinth,
// rake border, dotted rings, sown motifs) because the painted sun patch must cross it: inside the patch the
// plaster is stippled turmeric, and every bud the patch touches opens in a second and a half.
//
// LOCAL SPACE  origin on the floor under the hub, +Y up, the painted face toward +Z. Hub centre (0,42,0).
//              Local +X is the room's south (the door side), so the patch climbs from lower +X to upper -X.
//              In the brief's room: object.position.set(80, 0, 6); object.rotation.y = -Math.PI / 2.
//              The gable wall spans x -51..39 (its ridge at x -6, opts.gableX), y 0..60 at the eaves, 96 at
//              the ridge; it lies at z 0 inside 33 m of the hub, bulges up to +-1.5 m outside that and
//              returns to z 0 within 8 m of its two side edges so a room shell can meet it there. Pads reach
//              z 1.5, buds 2.2, the stem 3.1, the plinth 1.3. hero.wallZ(x, y) is the plaster function.
// SIZE         radius 33 (the wheel with its buds; the creature ring reaches 39), height 96.
// COST         about 75k triangles, 10 draw calls (wall, wheel pads, buds, stalks, hub and crown, stem, blades,
//              creature ring, two instanced motif sets), 7 programs, no lights, no textures. Build about 130 ms.
// LIGHTING     None wanted. Everything is an unlit ShaderMaterial writing one of the seven palette colours
//              as linear colour; scene lights are ignored, scene fog is honoured (the world has none).
//              Meant for post { flat: 1, bloom: { strength: 0 } } so the hex values are the ones seen.
//
// OPTS         palette  7 hex strings in brief order: rice white, lamp black, turmeric, vermilion, indigo,
//                       leaf green, rose.
//              look     'sun' | 'line' | 'dusk'. Default: ctx.vary.hour (dawn line, night dusk, day or golden sun),
//                       else the FIRST draw from ctx.rng: under 0.52 sun, under 0.7 line, else dusk (seed 5 line,
//                       seeds 7, 11, 21 sun, seed 3 dusk). hero.look says which was built. 'sun': all five
//                       pigments and the turmeric patch. 'line': black line and hatching on rice white,
//                       vermilion only for dots, eyes and bud hearts, no patch, buds open in turn round the
//                       wheel. 'dusk': fills limited to indigo and rose, no patch, buds open in nine groups
//                       (group g at progress (g + 0.5) / 9, to go with the nine lamp niches).
//              wall     false leaves the gable wall and plinth out (the creatures still follow wallZ).
//              gableX   local x of the ridge (default -6).
//              demo     true (default): until setProgress()/setU() is called the patch climbs on a 60 s loop.
//
// PROGRESS     hero.setProgress(p), p 0..1, latched to its maximum: how far the sun patch has climbed
//              (0 its corner at the wall foot, south; 1 the whole gable). hero.setU(u) maps path u through
//              hero.progressFromU(u) = clamp((u - 0.26) / 0.46): first buds at u 0.32, half at 0.52, the top
//              at 0.64-0.70. hero.setSpin(s): signed turn rate, 1 = one turn in 90 s (ease it through 0 to -1
//              for the rare reversal; the creature ring always runs against the wheel). hero.setFlip(p), p 0..1:
//              instead of all turning at once, the ring's figures leap and turn over one after another, a wave
//              that has gone once round at p 1 (a pure function of the caller's u). hero.resetProgress()
//              unlatches. hero.patch = { cornerX, cornerY, footX, slope, lean } (local, read-only, refreshed
//              each frame): the patch is x > cornerX + lean * (y - cornerY) and y < cornerY + slope *
//              (x - cornerX); footX is where its north edge meets the wall foot, so the floor patch can run
//              to it. hero.opened is how many buds are open. hero.uniforms shares uTime etc.
//
// ANCHORS      (local space)
//   hub          (0,42,1.5) centre of the wheel; look here.
//   squareOn     (0,42,60) the frame to remember (u 0.52).
//   lowPass      (9,26,14.5) and hubPass (0,44,14.5): the two close passes, 13 m off the pad faces.
//   flyThrough   ordered points of a safe line parallel to the wall: everything of the piece is within
//                z < 3.3, so any path with z >= 9.5 has 6 m of air.
//   portalSeat   { position, facing }: the brief's niche in the far west wall seen from here, (-34,34,190)
//                facing -Z; the portal is not part of this piece, the line from squareOn to it is clear.
//   placement    { position [80,0,6], rotationY -PI/2 } for the brief's room.
//   patchFoot    (footX at p 0, 0, 0): where the floor patch should meet the wall at the start.
//
// STYLE (for the world coder to match). Seven flat colours, unlit. Three kinds of mark:
//   fills   flat polygons 5-25 cm proud of the plaster in one palette colour (vertex colours);
//   strokes ribbons with a coordinate across them: kind 1 solid black, kind 2 the Mithila double line (black
//           at both edges, rice white between, hatched with scrolling black strokes that fade by fwidth
//           before they alias); every ribbon is widened in the vertex shader to at least 1.5 px;
//   relief  real geometry in flat colour whose side wall is one solid colour (the rim) with an
//           inverted-hull black outline (back faces pushed out 0.16 m or 1.5 px along the normal).
//   The ink toolkit below (makeInk, PAINT_VERT, PAINT_FRAG) is self-contained and may be copied.
import * as THREE from 'three';

const DEF_PALETTE = ['#F3EBD9', '#1B1714', '#E9A91C', '#D8432B', '#27407F', '#3F8E3C', '#E27A9A'];
const HUB_Y = 42, PAD_R = 9, HUB_R = 8, PAD_RING = 21, RING_R = 35.3, TAU = Math.PI * 2;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));

const FOG_V = '\n#include <fog_pars_vertex>\n', FOG_VM = '\n#include <fog_vertex>\n';
const FOG_F = '\n#include <fog_pars_fragment>\n', FOG_FM = '\n#include <fog_fragment>\n';

// plaster bulge, the same sines in GLSL and in JS (uWall = four phases, uGable = ridge x)
const WALL_GLSL = /* glsl */`
uniform vec4 uWall; uniform float uGable;
float wallZ(vec2 p) {
  float r = length(p - vec2(0., ${HUB_Y}.));
  float m = smoothstep(33.5, 39., r);
  float e = smoothstep(0., 8., min(p.x - (uGable - 45.), (uGable + 45.) - p.x));
  float b = 0.55 * sin(p.x * 0.105 + p.y * 0.045 + uWall.x) + 0.45 * sin(p.x * 0.062 - p.y * 0.083 + uWall.y)
          + 0.30 * sin(p.y * 0.19 + p.x * 0.12 + uWall.z) + 0.20 * sin(p.y * 0.031 + uWall.w);
  return b * m * e;
}`;

// ---------------------------------------------------------------- ink toolkit: flat fills and stroke ribbons
// Collects 2D drawing into one BufferGeometry: position (x, y, layer z), color, aS (across -1..1, along m,
// kind, half width), aN (stroke normal x, y, wave weight). ext(n) adds an extra per-vertex vec4 (aR).
function makeInk() {
  const P = [], C = [], S = [], N = [], R = [], I = [];
  let zl = 0, wv = 0, tx = null, ext = null;
  const put = (x, y, c, s0, s1, s2, s3, nx, ny) => {
    const w = typeof wv === 'function' ? wv(x, y) : wv;
    P.push(x, y, zl); C.push(c.r, c.g, c.b); S.push(s0, s1, s2, s3); N.push(nx, ny, w);
    if (ext) R.push(ext[0], ext[1], ext[2], ext[3]);
    return P.length / 3 - 1;
  };
  const T = (pts) => (tx ? pts.map((p) => tx(p[0], p[1])) : pts);
  const ink = {
    z(v) { zl = v; return ink; }, wave(v) { wv = v; return ink; }, xf(f) { tx = f; return ink; },
    ext(v) { ext = v; return ink; },
    fill(pts0, c) {
      const pts = T(pts0); const v2 = pts.map((p) => new THREE.Vector2(p[0], p[1]));
      const cw = THREE.ShapeUtils.isClockWise(v2);
      const tris = THREE.ShapeUtils.triangulateShape(v2, []);
      const b = P.length / 3;
      for (const p of pts) put(p[0], p[1], c, 0, 0, 0, 0, 0, 0);
      for (const t of tris) { if (cw) I.push(b + t[0], b + t[2], b + t[1]); else I.push(b + t[0], b + t[1], b + t[2]); }
      return ink;
    },
    // kind 1 solid, kind 2 double hatched line; width in metres
    stroke(pts0, width, c, closed = false, kind = 1) {
      const pts = T(pts0), n = pts.length, hw = width * 0.5; let along = 0, prev = -1;
      const cnt = closed ? n + 1 : n;
      for (let k = 0; k < cnt; k++) {
        const i = k % n, a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
        let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
        if (k > 0) { const q = pts[(k - 1) % n]; along += Math.hypot(pts[i][0] - q[0], pts[i][1] - q[1]); }
        const nx = -dy, ny = dx;
        const i0 = put(pts[i][0] + nx * hw, pts[i][1] + ny * hw, c, 1, along, kind, hw, nx, ny);
        put(pts[i][0] - nx * hw, pts[i][1] - ny * hw, c, -1, along, kind, hw, -nx, -ny);
        if (prev >= 0) I.push(prev, prev + 1, i0, prev + 1, i0 + 1, i0);
        prev = i0;
      }
      return ink;
    },
    disc(cx, cy, rx, c, seg = 12, ry = rx, rot = 0) {
      const pts = [], cr = Math.cos(rot), sr = Math.sin(rot);
      for (let i = 0; i < seg; i++) { const a = (i / seg) * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
      return ink.fill(pts, c);
    },
    // filled shape with a black (or given) outline stroke on the layer just above
    shape(pts, c, lineC, lw = 0.14, kind = 1) { ink.fill(pts, c); const z0 = zl; zl = z0 + 0.012; ink.stroke(pts, lw, lineC, true, kind); zl = z0; return ink; },
    count() { return I.length / 3; },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(S, 4));
      g.setAttribute('aN', new THREE.Float32BufferAttribute(N, 3));
      if (R.length) g.setAttribute('aR', new THREE.Float32BufferAttribute(R, 4));
      g.setIndex(I);
      return g;
    },
  };
  return ink;
}

// smooth closed outline through a few control points (Catmull-Rom), for hand-drawn shapes
function loop(ctrl, per = 5) {
  const n = ctrl.length, out = [];
  for (let i = 0; i < n; i++) {
    const p0 = ctrl[(i - 1 + n) % n], p1 = ctrl[i], p2 = ctrl[(i + 1) % n], p3 = ctrl[(i + 2) % n];
    for (let k = 0; k < per; k++) {
      const t = k / per, t2 = t * t, t3 = t2 * t;
      out.push([0.5 * (2 * p1[0] + (p2[0] - p0[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (3 * p1[0] - p0[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 * (2 * p1[1] + (p2[1] - p0[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (3 * p1[1] - p0[1] - 3 * p2[1] + p3[1]) * t3)]);
    }
  }
  return out;
}
const arc = (cx, cy, r, a0, a1, n = 8) => { const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); o.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } return o; };

// ---------------------------------------------------------------- paint shader (fills and strokes)
// Plain: static ink on the wall. USE_INSTANCING: sown motifs. RING: figures bent onto the plaster round the hub,
// aR = (angle on the ring, ring radius, phase, 0); uRing turns them, uFace mirrors them about their own middle.
// uFlipP (0..1) sends a wave once round the ring: each figure in turn leaps out of its line, tips and turns over.
const PAINT_VERT = /* glsl */`
attribute vec4 aS; attribute vec3 aN;
uniform float uTime, uViewH, uRing, uFace, uFlipP;
varying vec3 vCol; varying vec4 vS;
#ifdef RING
attribute vec4 aR;
#endif
${WALL_GLSL}
${FOG_V}
void main() {
  vec3 p = position; vCol = color; vS = aS;
  float sc = 1.;
#ifdef USE_INSTANCING_COLOR
  if (color.r < 0.) vCol = instanceColor;
#endif
#ifdef RING
  p.y += aN.z * sin(uTime * 3.4 + aR.z + p.x * 0.6);
  // the wave starts low on the door side and runs once round the wall; where it is, a figure leaps out of the
  // ring as far as the gable has room (most over the top and down the far side) and turns a somersault
  float th0 = aR.x + uRing, c0 = cos(th0), s0 = sin(th0);
  float fw = smoothstep(0., 0.4, uFlipP * 1.4 - fract((th0 - 0.35) / 6.2831853));
  float face = uFace * (1. - 2. * fw), leap = sin(3.14159265 * fw);
  if (abs(face) < 0.06) face = face < 0. ? -0.06 : 0.06;
  float room = min(min(36. / max(c0, 0.02), 48. / max(-c0, 0.02)), 36. / max(-s0, 0.02));
  room = min(room, min(45.2 / max(s0 + 0.8 * c0, 0.02), 54.8 / max(s0 - 0.8 * c0, 0.02)));
  // (where the gable leaves no room it leaps inward instead, over the buds; at the crest it is half as big again)
  float amp = room - 37.3 > 3. ? min(room - 37.3, 9.5) : -5.;
  float tip = 6.2831853 * fw * sign(uFace), ct = cos(tip), st = sin(tip);
  vec2 pf = vec2(p.x * face, p.y) * (1. + 0.75 * leap), nf = vec2(aN.x * sign(face), aN.y);
  pf = vec2(pf.x * ct - pf.y * st, pf.x * st + pf.y * ct); nf = vec2(nf.x * ct - nf.y * st, nf.x * st + nf.y * ct);
  float rho = aR.y + pf.y + amp * leap;
  float th = th0 + pf.x / aR.y;
  vec2 rad = vec2(cos(th), sin(th)), tng = vec2(-rad.y, rad.x);
  vec2 q = vec2(0., ${HUB_Y}.) + rad * rho;
  vec3 lp = vec3(q, wallZ(q) + p.z + (amp < 0. ? 2.7 : 0.3) * leap);
  vec3 nrm = vec3(tng * nf.x + rad * nf.y, 0.);
#else
  float ph = 0.;
  #ifdef USE_INSTANCING
  ph = instanceMatrix[3].x * 0.37 + instanceMatrix[3].y * 0.53;
  #endif
  p.x += aN.z * sin(uTime * 1.7 + ph + p.y * 0.7);
  vec3 lp = p; vec3 nrm = vec3(aN.xy, 0.);
  #ifdef USE_INSTANCING
  lp = (instanceMatrix * vec4(lp, 1.)).xyz;
  sc = length(instanceMatrix[0].xyz);
  nrm = mat3(instanceMatrix) * nrm / max(sc, 1e-4);
  #endif
#endif
  vec4 wp = modelMatrix * vec4(lp, 1.);
  float px = 2. * length(cameraPosition - wp.xyz) / (projectionMatrix[1][1] * uViewH);
  float add = step(0.5, aS.z) * clamp(0.8 * px - aS.w * sc, 0., aS.w * sc * 2.2 + 0.02);
  wp.xyz += mat3(modelMatrix) * nrm * add;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  ${FOG_VM}
}`;
const PAINT_FRAG = /* glsl */`
uniform vec3 uGround; uniform float uTime, uHatch;
varying vec3 vCol; varying vec4 vS;
${FOG_F}
void main() {
  vec3 col = vCol;
  if (vS.z > 1.5) {
    float a = abs(vS.x), aw = fwidth(vS.x) + 1e-4;
    float lf = clamp(0.12 / max(vS.w, 0.05), 0.14, 0.5);
    float edge = smoothstep(1. - lf - aw, 1. - lf + aw, a);
    float arg = vS.y * uHatch + vS.x * 1.1 - uTime * 1.3;
    float fw = max(fwidth(arg), 1e-3);
    float st = smoothstep(0.3 - fw, 0.3 + fw, sin(arg)) * (1. - smoothstep(0.7, 1.7, fw));
    col = mix(uGround, vCol, max(edge, st * 0.92));
  }
  gl_FragColor = vec4(col, 1.);
  ${FOG_FM}
}`;

// ---------------------------------------------------------------- figures (head toward +x, about 7 m long)
// k: { W, K, acc, body, second, third }   s: size multiplier
function drawFish(ink, k, s, rng) {
  ink.xf((x, y) => [x * s, y * s]).wave((x) => 0.06 + 0.6 * clamp01((1.2 * s - x) / (6 * s)) ** 2);
  const lw = 0.15;
  ink.z(0.05).shape([[-2.5, 0.32], [-4.1, 1.65], [-3.55, 0.0], [-4.1, -1.65], [-2.5, -0.32]], k.second, k.K, lw);
  for (let i = -1; i <= 1; i++) ink.z(0.07).stroke([[-2.8, i * 0.14], [-3.75, i * 0.85]], 0.09, k.K);
  ink.z(0.05).shape([[1.0, 1.15], [-0.1, 2.05], [-1.4, 0.9]], k.third, k.K, lw);
  ink.z(0.05).shape([[0.7, -1.15], [0.0, -1.95], [-1.0, -1.0]], k.third, k.K, lw);
  const body = loop([[3.7, 0], [2.5, 1.0], [0.6, 1.32], [-1.4, 0.92], [-2.65, 0.36], [-2.65, -0.36], [-1.4, -0.92], [0.6, -1.32], [2.5, -1.0]], 4);
  ink.z(0.09).fill(body, k.body);
  ink.z(0.105).stroke(body, 0.36, k.K, true, 2);
  ink.z(0.11).stroke(arc(0.4, 0, 1.75, -0.62, 0.62, 6), 0.13, k.K);
  ink.z(0.11).stroke(arc(0.75, 0, 1.75, -0.55, 0.55, 6), 0.09, k.K);
  const rows = rng.int(2, 3);
  for (let i = 0; i < 4; i++) for (let j = 0; j < rows; j++) {
    const x = 1.25 - i * 0.78 - (j & 1) * 0.3, y = (j - (rows - 1) / 2) * 0.58 * (1 - i * 0.12);
    ink.z(0.11).disc(x, y, 0.17, i & 1 ? k.second : k.W, 6);
  }
  ink.z(0.12).disc(2.75, 0.3, 0.33, k.W, 10).z(0.13).disc(2.8, 0.3, 0.15, k.acc, 7);
  ink.z(0.12).stroke(arc(2.75, 0.3, 0.33, 0, TAU, 10), 0.07, k.K);
}
function drawTurtle(ink, k, s) {
  ink.xf((x, y) => [x * s, y * s]).wave(0);
  const lw = 0.15, leg = (cx, cy, rot) => {
    const pts = []; const cr = Math.cos(rot), sr = Math.sin(rot);
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU, x = Math.cos(a) * 0.95, y = Math.sin(a) * 0.48; pts.push([cx + x * cr - y * sr, cy + x * sr + y * cr]); }
    ink.z(0.05).shape(pts, k.second, k.K, lw);
  };
  ink.wave((x, y) => 0.22 * Math.sign(x) * (Math.abs(y) > 1.2 * s ? 1 : 0));
  leg(1.5, 1.75, 0.9); leg(1.5, -1.75, -0.9); leg(-1.45, 1.7, 2.2); leg(-1.45, -1.7, -2.2);
  ink.wave(0.04);
  ink.z(0.05).shape([[-2.0, 0.3], [-3.0, 0], [-2.0, -0.3]], k.second, k.K, lw);
  const head = loop([[3.45, 0], [2.9, 0.6], [2.1, 0.45], [2.1, -0.45], [2.9, -0.6]], 4);
  ink.z(0.06).shape(head, k.third, k.K, lw);
  ink.z(0.08).disc(3.0, 0.3, 0.13, k.acc, 6).disc(3.0, -0.3, 0.13, k.acc, 6);
  const shell = []; for (let i = 0; i < 28; i++) { const a = (i / 28) * TAU; shell.push([Math.cos(a) * 2.3, Math.sin(a) * 1.72]); }
  ink.z(0.09).fill(shell, k.body).z(0.105).stroke(shell, 0.38, k.K, true, 2);
  const inner = shell.map((p) => [p[0] * 0.6, p[1] * 0.58]);
  ink.z(0.11).fill(inner, k.second).z(0.12).stroke(inner, 0.11, k.K, true);
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; ink.z(0.12).stroke([[Math.cos(a) * 1.4, Math.sin(a) * 1.0], [Math.cos(a) * 1.95, Math.sin(a) * 1.45]], 0.09, k.K); }
  ink.z(0.13).disc(0, 0, 0.3, k.W, 8);
  for (let i = 0; i < 6; i++) { const a = ((i + 0.5) / 6) * TAU; ink.disc(Math.cos(a) * 0.8, Math.sin(a) * 0.58, 0.15, k.W, 6); }
}
function drawParrot(ink, k, s) {
  ink.xf((x, y) => [x * s, y * s]).wave((x) => 0.07 + 0.28 * clamp01((-x - 0.8 * s) / (3.5 * s)));
  const lw = 0.15;
  ink.z(0.05).shape([[-0.9, 0.25], [-4.4, -0.85], [-4.2, -1.5], [-2.6, -1.05], [-1.1, -0.75]], k.second, k.K, lw);
  ink.z(0.07).stroke([[-1.5, -0.35], [-3.9, -1.1]], 0.09, k.K);
  ink.stroke([[0.45, -1.15], [0.5, -1.85], [0.95, -1.9]], 0.13, k.K).stroke([[-0.25, -1.1], [-0.2, -1.8], [0.25, -1.85]], 0.13, k.K);
  ink.z(0.06).shape(loop([[2.25, 1.0], [3.2, 0.72], [3.05, 0.0], [2.6, -0.1], [2.35, 0.4]], 3), k.acc, k.K, lw);
  const body = loop([[1.8, 1.4], [2.5, 0.85], [1.9, -0.55], [0.3, -1.25], [-1.5, -0.7], [-1.1, 0.45], [0.5, 1.25]], 5);
  ink.z(0.09).fill(body, k.body).z(0.105).stroke(body, 0.3, k.K, true, 2);
  const wing = loop([[1.0, 0.45], [-0.3, 0.3], [-2.3, -0.55], [-0.5, -0.8], [0.8, -0.35]], 4);
  ink.z(0.11).shape(wing, k.third, k.K, 0.12);
  for (let i = 0; i < 3; i++) ink.z(0.125).stroke([[0.4 - i * 0.65, 0.2 - i * 0.12], [0.1 - i * 0.65, -0.12 - i * 0.1], [0.4 - i * 0.65, -0.45 - i * 0.06]], 0.09, k.K);
  ink.z(0.115).stroke(arc(2.0, 0.45, 1.05, 2.4, 4.0, 6), 0.16, k.acc);
  ink.z(0.12).disc(1.85, 0.8, 0.31, k.W, 10).z(0.13).disc(1.9, 0.8, 0.14, k.K, 7);
  ink.z(0.12).stroke(arc(1.85, 0.8, 0.31, 0, TAU, 10), 0.07, k.K);
}
// sown motifs, unit radius; vertices coloured (-1,0,0) take the instance colour
function drawFlower(ink, k, petals) {
  const m = new THREE.Color(-1, 0, 0);
  ink.xf(null).wave(0);
  for (let i = 0; i < petals; i++) {
    const a = (i / petals) * TAU, pts = [];
    for (let j = 0; j < 8; j++) { const b = (j / 8) * TAU, x = 0.62 + Math.cos(b) * 0.36, y = Math.sin(b) * 0.2; pts.push([x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)]); }
    ink.z(0.05).shape(pts, m, k.K, 0.07);
  }
  ink.z(0.07).disc(0, 0, 0.3, k.W, 10).z(0.08).stroke(arc(0, 0, 0.3, 0, TAU, 10), 0.07, k.K).disc(0, 0, 0.13, k.acc, 6);
}
function drawSprig(ink, k) {
  const m = new THREE.Color(-1, 0, 0);
  ink.xf(null).wave((x, y) => 0.09 * clamp01((y + 1) / 2) ** 2);
  ink.z(0.05).stroke([[0, -1], [0.06, -0.3], [-0.04, 0.4], [0.02, 0.95]], 0.09, k.K);
  for (let i = 0; i < 5; i++) {
    const y0 = -0.7 + i * 0.38, sd = i & 1 ? -1 : 1, L = 0.62 - i * 0.05, a = sd * 0.9;
    const pts = [[0, 0], [L * 0.5, 0.17], [L, 0], [L * 0.5, -0.17]].map((p) => [p[0] * Math.cos(a) * sd - p[1] * Math.sin(a), y0 + Math.abs(p[0] * Math.sin(a)) + p[1] * Math.cos(a) * sd]);
    ink.z(0.06).shape(pts, m, k.K, 0.06);
  }
  ink.z(0.07).disc(0.02, 1.02, 0.14, k.acc, 6);
}

// ---------------------------------------------------------------- relief pads (analytic paint on a cushion)
// aP = (radius 0..1 of the pad's own outline, angle, part: 0 top 1 rim 2 ground ring, kind: 0 leaf pad 1 flower)
// aQ = (radius in metres, seed, vein count, scallop count)
const PAD_VERT = /* glsl */`
attribute vec4 aP; attribute vec4 aQ; varying vec4 vP; varying vec4 vQ;
${FOG_V}
void main() { vP = aP; vQ = aQ; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${FOG_VM} }`;
const PAD_FRAG = /* glsl */`
uniform vec3 uCA, uCB, uCC, uRim, uGround, uInk, uDot; uniform float uTime, uHatch;
varying vec4 vP; varying vec4 vQ;
${FOG_F}
float ln(float d, float w) { float aw = max(fwidth(d), 1e-4); w = max(w, 0.75 * aw); return 1. - smoothstep(w - aw, w + aw, abs(d)); }
float dotAt(vec2 d, float r) { float l = length(d); float aw = max(fwidth(l), 1e-4); return (1. - smoothstep(r - aw, r + aw, l)) * (1. - smoothstep(0.25, 0.6, aw)); }
void main() {
  float R = vQ.x, m = vP.x * R, e = R - m, th = vP.y, kind = vP.w;
  vec3 col;
  if (vP.z > 1.5) col = uInk;
  else if (vP.z > 0.5) col = uRim;
  else {
    vec3 cA = mix(uCA, uCC, kind), cC = mix(uCC, uCA, kind);
    float sc = vQ.w, wob = (0.16 + 0.34 * kind) * (0.5 - abs(sin(th * sc * 0.5)));
    float b1 = min(1.2, 0.2 * R), b2 = b1 + (0.36 - 0.1 * kind) * R + wob, b3 = b2 + 0.2 * R + wob * 0.6;
    col = e < b1 ? uGround : e < b2 ? cA : e < b3 ? uCB : cC;
    // the hatched double outline
    float arg = th * R * uHatch * 0.5 + e * 2.6 - uTime * 1.3 + vQ.y;
    float fw = max(fwidth(arg), 1e-3);
    float hatch = smoothstep(0.3 - fw, 0.3 + fw, sin(arg)) * (1. - smoothstep(0.7, 1.7, fw)) * step(e, b1);
    float k = max(hatch * 0.92, 1. - smoothstep(0.17, 0.17 + max(fwidth(e), 1e-4) * 1.5, e));
    k = max(k, max(ln(e - b1, 0.085), max(ln(e - b2, 0.07), ln(e - b3, 0.07))));
    // dotted veins fanning through the outer ring
    float nv = vQ.z, f = th * nv / 6.2831853;
    float dx = (fract(f) - 0.5) * 6.2831853 / nv * m;
    float mm = e - b1 - 0.45;
    float dy = (fract(mm / 0.8) - 0.5) * 0.8;
    float inA = step(b1 + 0.3, e) * step(e, b2 - 0.3);
    float vd = dotAt(vec2(dx, dy), 0.19) * inA;
    // ticks across the middle ring
    float f2 = th * nv * 2. / 6.2831853 + 0.5;
    float dx2 = (fract(f2) - 0.5) * 3.14159265 / nv * m;
    float tick = ln(dx2, 0.05) * step(b2 + 0.12, e) * step(e, b3 - 0.12);
    // the heart: a ring of dots and a centre boss
    float rc = max(R - b3, 0.5), nd = 8.;
    float f3 = th * nd / 6.2831853;
    float dx3 = (fract(f3) - 0.5) * 6.2831853 / nd * m;
    float hd = dotAt(vec2(dx3, m - rc * 0.58), 0.24) * step(b3 + 0.2, e);
    float boss = 1. - smoothstep(rc * 0.26, rc * 0.26 + max(fwidth(m), 1e-4), m);
    float dxm = (fract(f + 0.5) - 0.5) * 6.2831853 / nv * m;
    float hair = ln(dxm, 0.03) * inA * step(fract(mm / 1.6), 0.66);
    k = max(k, max(hair, ln(m - rc * 0.84, 0.045) * step(b3 + 0.3, e)));
    col = mix(col, uDot, vd);
    col = mix(col, uDot, hd);
    col = mix(col, uCB, boss);
    k = max(k, max(tick, ln(m - rc * 0.26, 0.07)));
    col = mix(col, uInk, k);
  }
  gl_FragColor = vec4(col, 1.);
  ${FOG_FM}
}`;

// pads: [{ x, y, R, notch (angle or null), kind, seed, veins, scal, h, z0 }] -> one geometry
function padGeometry(pads) {
  const P = [], A = [], Q = [], I = [];
  for (const pd of pads) {
    const h = pd.h ?? 1.5, z0 = pd.z0 ?? 0, n0 = pd.R > 5 ? 120 : 44, ths = [];
    for (let i = 0; i < n0; i++) ths.push((i / n0) * TAU);
    const hwN = 0.17;
    if (pd.notch != null) { const a = ((pd.notch % TAU) + TAU) % TAU; for (const o of [-hwN, 0, hwN]) ths.push((((a + o) % TAU) + TAU) % TAU); }
    ths.sort((a, b) => a - b); ths.push(ths[0] + TAU);
    const edge = (t) => {
      let r = pd.R * (1 + 0.022 * Math.sin(3 * t + pd.seed) + 0.016 * Math.sin(5 * t + pd.seed * 2.3));
      if (pd.notch != null) { let d = Math.abs((((t - pd.notch) % TAU) + TAU + Math.PI) % TAU - Math.PI); r *= 1 - 0.46 * Math.max(0, 1 - d / hwN); }
      return r;
    };
    // rows: [radius fraction, height, part, extra radius in metres]
    const rows = [[0, h, 0, 0], [0.25, h - 0.02, 0, 0], [0.5, h - 0.07, 0, 0], [0.7, h - 0.14, 0, 0], [0.85, h - 0.23, 0, 0], [0.93, h - 0.32, 0, 0],
      [0.975, h - 0.45, 0, 0], [1, h - 0.68, 0, 0], [1, h - 0.68, 1, 0], [1, 0.03, 1, 0.05], [1, 0.03, 2, 0.05], [1, 0.03, 2, 0.4]];
    const base = P.length / 3, nt = ths.length, nr = rows.length;
    for (let j = 0; j < nt; j++) {
      const t = ths[j], er = edge(t), c = Math.cos(t), s = Math.sin(t);
      for (let i = 0; i < nr; i++) {
        const rw = rows[i], r = er * rw[0] + rw[3];
        P.push(pd.x + c * r, pd.y + s * r, z0 + rw[1]);
        A.push(rw[0], t, rw[2], pd.kind); Q.push(pd.R, pd.seed, pd.veins, pd.scal);
      }
    }
    for (let j = 0; j < nt - 1; j++) for (let i = 0; i < nr - 1; i++) {
      if (i === 7 || i === 9) continue;                     // duplicated rows: no faces between them
      const a = base + j * nr + i, b = a + nr;
      if (i > 0) I.push(a, a + 1, b);
      I.push(b, a + 1, b + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4));
  g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 4));
  g.setIndex(I);
  return g;
}

// ---------------------------------------------------------------- the bamboo stem
// aP = (height along the cane m, angle round it with 0 at the front, signed distance to the nearest node m, 0)
const STEM_VERT = /* glsl */`
attribute vec4 aP; varying vec4 vP;
${FOG_V}
void main() { vP = aP; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${FOG_VM} }`;
const STEM_FRAG = /* glsl */`
uniform vec3 uStem, uGround, uInk, uDot; uniform float uTime, uHatch;
varying vec4 vP;
${FOG_F}
float ln(float d, float w) { float aw = max(fwidth(d), 1e-4); w = max(w, 0.75 * aw); return 1. - smoothstep(w - aw, w + aw, abs(d)); }
void main() {
  float v = vP.x, ph = abs(vP.y), nd = vP.z;
  vec3 col = uStem;
  // the double line down each side, hatched, and black beyond it
  float side = smoothstep(1.02, 1.02 + max(fwidth(ph), 1e-4), ph);
  float arg = v * uHatch * 0.9 + ph * 5. - uTime * 1.3;
  float fw = max(fwidth(arg), 1e-3);
  float hatch = smoothstep(0.3 - fw, 0.3 + fw, sin(arg)) * (1. - smoothstep(0.7, 1.7, fw));
  col = mix(col, uGround, side);
  float k = side * hatch * 0.92;
  k = max(k, max(ln(ph - 1.02, 0.035), smoothstep(1.38, 1.38 + max(fwidth(ph), 1e-4), ph)));
  // node rings: a black band, a white gap, a thin second line; a row of dots under each
  float an = abs(nd);
  float ring = 1. - smoothstep(0.2, 0.2 + max(fwidth(nd), 1e-4), an);
  float gap = (1. - smoothstep(0.46, 0.46 + max(fwidth(nd), 1e-4), an)) * (1. - side);
  col = mix(col, uGround, gap);
  k = max(k, max(ring, ln(an - 0.46, 0.05) * (1. - side)));
  float dx = (fract(vP.y / 0.42 + 0.5) - 0.5) * 0.42 * 1.9;
  float l = length(vec2(dx, nd + 0.95)); float aw = max(fwidth(l), 1e-4);
  float dots = (1. - smoothstep(0.17 - aw, 0.17 + aw, l)) * (1. - smoothstep(0.25, 0.6, aw)) * (1. - side);
  col = mix(col, uDot, dots);
  // two dashed fibres
  float dash = step(fract(v * 0.31), 0.62) * step(0.75, an);
  k = max(k, ln(ph - 0.5, 0.022) * dash * step(0.5, fract(v * 0.31 + 0.2) + 0.2));
  col = mix(col, uInk, k);
  gl_FragColor = vec4(col, 1.);
  ${FOG_FM}
}`;
function stemGeometry(stemX, y0, y1, nodes, zAt) {
  const P = [], A = [], I = [], NA = 14, step = 0.75, n = Math.ceil((y1 - y0) / step);
  for (let i = 0; i <= n; i++) {
    const y = y0 + (y1 - y0) * (i / n);
    let nd = 1e9; for (const ny of nodes) if (Math.abs(y - ny) < Math.abs(nd)) nd = y - ny;
    const r = (2.0 - 0.55 * (y / 90)) * (1 + 0.1 * Math.exp(-(nd * nd) / 0.3) + 0.4 * Math.exp(-(y - y0) / 1.3));
    const cx = stemX(y), cz = zAt(cx, y);
    for (let j = 0; j <= NA; j++) {
      const ph = -1.85 + 3.7 * (j / NA);
      P.push(cx + Math.sin(ph) * r, y, cz + Math.cos(ph) * r);
      A.push(y, ph, nd, 0);
    }
  }
  for (let i = 0; i < n; i++) for (let j = 0; j < NA; j++) { const a = i * (NA + 1) + j, b = a + NA + 1; I.push(a, a + 1, b, a + 1, b + 1, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(A, 4));
  g.setIndex(I);
  return g;
}

// ---------------------------------------------------------------- buds: hinged relief petals, calyx, heart
// aB = (bud centre x, y in the wheel's frame, outward angle, bud index)
// aK = (petal number -3.5..3.5, type 0 petal 1 calyx 2 heart, along 0..1, across -1..1; |across| 2 = rim)
const BUD_VERT = /* glsl */`
attribute vec4 aB; attribute vec4 aK; uniform float uOpen[24];
varying vec4 vK; varying float vO;
${FOG_V}
void main() {
  float o = uOpen[int(aB.w + 0.5)]; vK = aK; vO = o;
  vec3 p = position; float ang = 0., tilt = 0., zo = 0.;
  if (aK.y < 0.5) {
    ang = aK.x * mix(0.17, 0.7854, o);
    p.y *= mix(0.78, 1., o);
    tilt = mix(0.3, 0.1, o) + 0.5 * sin(3.14159265 * o);
    zo = 0.5 + (3.5 - abs(aK.x)) * mix(0.07, 0.012, o) + step(0., aK.x) * 0.012;
  } else if (aK.y < 1.5) { ang = aK.x * 0.52; tilt = 0.1; zo = 0.26; }
  else { float s = smoothstep(0.2, 1., o); p *= s; zo = 0.9 * s; }
  float ct = cos(tilt), st = sin(tilt);
  p = vec3(p.x * ct - p.z * st, p.y, p.x * st + p.z * ct);
  float a = aB.z + ang, ca = cos(a), sa = sin(a);
  vec3 lp = vec3(aB.x + p.x * ca - p.y * sa, aB.y + p.x * sa + p.y * ca, zo + p.z);
  vec4 mvPosition = modelViewMatrix * vec4(lp, 1.);
  gl_Position = projectionMatrix * mvPosition;
  ${FOG_VM}
}`;
const BUD_FRAG = /* glsl */`
uniform vec3 uPetal, uPetal2, uCalyx, uHeart, uRim, uInk, uDot;
varying vec4 vK; varying float vO;
${FOG_F}
void main() {
  float type = vK.y, t = vK.z, c = vK.w, ac = abs(c);
  vec3 col;
  if (ac > 1.5) col = type < 0.5 ? uRim : uInk;
  else if (type < 1.5) {
    col = type < 0.5 ? uPetal : uCalyx;
    float aw = max(fwidth(c), 1e-4), at = max(fwidth(t), 1e-4);
    if (type < 0.5) col = mix(col, uPetal2, 1. - smoothstep(0.3 - at, 0.3 + at, t + 0.1 * c * c));
    float k = smoothstep(0.78 - aw, 0.78 + aw, ac);
    k = max(k, smoothstep(0.95 - at, 0.95 + at, t));
    k = max(k, (1. - smoothstep(0.07, 0.07 + aw, ac)) * step(0.36, t) * step(t, 0.82));
    float dl = length(vec2((t - 0.62) * 6., (ac - 0.42) * 2.2));
    col = mix(col, uDot, (1. - smoothstep(0.42, 0.5, dl)) * step(type, 0.5));
    col = mix(col, uInk, k);
  } else {
    col = uHeart;
    float at = max(fwidth(t), 1e-4);
    float f = c * 7., dx = (fract(f) - 0.5) * 1.1, dl = length(vec2(dx, (t - 0.56) * 2.6));
    col = mix(col, uDot, 1. - smoothstep(0.2, 0.28, dl));
    col = mix(col, uDot, 1. - smoothstep(0.16, 0.16 + at, t));
    col = mix(col, uInk, smoothstep(0.84 - at, 0.84 + at, t));
  }
  gl_FragColor = vec4(col, 1.);
  ${FOG_FM}
}`;
// buds: [{ x, y, phi, size }] in the wheel's frame; yields every sixth bud
async function budGeometry(buds, pause) {
  const P = [], B = [], K = [], I = [], NT = 8, CS = [-2, -1, -0.5, 0, 0.5, 1, 2];
  const petal = (bi, bd, k, type, L, W) => {
    const base = P.length / 3;
    for (let i = 0; i <= NT; i++) {
      const t = i / NT, prof = Math.pow(Math.sin(Math.PI * Math.pow(t, 0.72)), 0.75), w = W * (0.1 * (1 - t) + prof);
      for (const c of CS) {
        const cc = Math.max(-1, Math.min(1, c)), rim = Math.abs(c) > 1.5;
        P.push(t * L, cc * w, rim ? -0.14 : 0.2 * L * (1 - cc * cc) * (0.25 + 0.75 * prof) * 0.5);
        B.push(bd.x, bd.y, bd.phi, bi); K.push(k, type, t, c);
      }
    }
    const nc = CS.length;
    for (let i = 0; i < NT; i++) for (let j = 0; j < nc - 1; j++) { const a = base + i * nc + j, b = a + nc; I.push(a, b, a + 1, b, b + 1, a + 1); }
  };
  for (let bi = 0; bi < buds.length; bi++) {
    const bd = buds[bi], L = bd.size;
    if (bi % 6 === 5) await pause();
    for (let k = -1; k <= 1; k++) petal(bi, bd, k, 1, L * 0.62, L * 0.27);
    for (let i = 0; i < 8; i++) petal(bi, bd, i - 3.5, 0, L, L * 0.3);
    // the heart: a low dome; along = radius 0..1, across = angle / TAU
    const base = P.length / 3, R = L * 0.4, NS = 14, rr = [0, 0.5, 0.86, 1, 1];
    for (let j = 0; j <= NS; j++) {
      const a = (j / NS) * TAU;
      for (let i = 0; i < rr.length; i++) {
        const r = rr[i] * R, last = i === rr.length - 1;
        P.push(Math.cos(a) * r, Math.sin(a) * r, last ? -0.3 : 0.3 * (1 - rr[i] * rr[i]));
        B.push(bd.x, bd.y, bd.phi, bi); K.push(0, 2, rr[i], j / NS);
      }
    }
    for (let j = 0; j < NS; j++) for (let i = 0; i < rr.length - 1; i++) { const a = base + j * rr.length + i, b = a + rr.length; if (i > 0) I.push(a, a + 1, b); I.push(b, a + 1, b + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aB', new THREE.Float32BufferAttribute(B, 4));
  g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 4));
  g.setIndex(I);
  return g;
}

// ---------------------------------------------------------------- the gable wall and its plinth
const WALL_VERT = /* glsl */`
attribute float aT; varying vec3 vW; varying float vT;
${FOG_V}
void main() { vW = position; vT = aT; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${FOG_VM} }`;
const WALL_FRAG = /* glsl */`
uniform vec3 uGround, uInk, uSun, uAcc, uB;
uniform vec4 uPatch; uniform float uPatchOn, uGable, uWheel, uTime;
varying vec3 vW; varying float vT;
${FOG_F}
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ln(float d, float w) { float aw = max(fwidth(d), 1e-4); w = max(w, 0.75 * aw); return 1. - smoothstep(w - aw, w + aw, abs(d)); }
void main() {
  vec2 p = vW.xy;
  vec3 col = uGround;
  if (gl_FrontFacing) {
    float pxm = max(fwidth(p.x) + fwidth(p.y), 1e-4);
    // the painted sun patch: north edge leaning, top edge slanting
    float dN = p.x - (uPatch.x + uPatch.w * (p.y - uPatch.y));
    float dT = (uPatch.y + uPatch.z * (p.x - uPatch.x)) - p.y;
    float ed = min(dN, dT * 0.94);
    float inside = smoothstep(-pxm, pxm, ed) * uPatchOn;
    if (vT < 0.5) {
      // stipple: jittered rows of turmeric dots, crowding toward the edge
      vec2 g = p / 1.12; g.x += 0.5 * floor(g.y);
      vec2 id = floor(g), f = fract(g) - 0.5 + (vec2(hash(id), hash(id + 7.3)) - 0.5) * 0.3;
      float rad = mix(0.5, 0.34, smoothstep(0., 8., ed)), l = length(f), aw = pxm / 1.12;
      float dotc = 1. - smoothstep(rad - aw, rad + aw, l);
      dotc = mix(dotc, 0.55, smoothstep(0.25, 0.7, aw));
      col = mix(col, uSun, max(dotc, ln(ed - 0.2, 0.2)) * inside);
      float k = 0.;
      // dotted ring round the wheel between two lines; it turns with the wheel
      vec2 d = p - vec2(0., ${HUB_Y}.);
      float rr = length(d), ang = atan(d.y, d.x + (abs(d.x) + abs(d.y) < 1e-4 ? 1e-4 : 0.));
      float fr = (ang - uWheel) * 138. / 6.2831853;
      float dl = length(vec2((fract(fr) - 0.5) * 6.2831853 / 138. * rr, rr - 33.05));
      col = mix(col, uAcc, (1. - smoothstep(0.26 - pxm, 0.26 + pxm, dl)) * (1. - smoothstep(0.25, 0.6, pxm)));
      // border under the rakes and down the sides: two lines, a row of triangles between
      float dr = (60. + 36. * (1. - abs(p.x - uGable) / 45.) - p.y) * 0.781;
      float ds = min(p.x - (uGable - 45.), (uGable + 45.) - p.x);
      float db = min(dr, ds), al = dr < ds ? p.x * 1.28 : p.y;
      float h = (db - 0.5) / 1.5, s = fract(al / 1.9), tri = 1. - abs(2. * s - 1.);
      float inB = step(0., h) * step(h, 1.);
      col = mix(col, h < tri ? uAcc : uB, inB);
      k = max(k, max(max(ln(db - 0.5, 0.08), ln(db - 2.0, 0.08)), ln((h - tri) * 1.5, 0.08) * inB));
      // sown marks in the corners: triads of dots and little chevrons
      vec2 g2 = p / 2.7; vec2 id2 = floor(g2); float hs = hash(id2 + 3.1);
      vec2 f2 = (fract(g2) - 0.5) * 2.7 - (vec2(hash(id2 + 1.7), hash(id2 + 5.9)) - 0.5) * 1.1;
      float sow = step(38.4, rr) * step(3.0, db) * step(4.6, p.y);
      float tri3 = min(length(f2 - vec2(0., 0.3)), min(length(f2 - vec2(0.27, -0.16)), length(f2 - vec2(-0.27, -0.16))));
      float chev = max(abs(abs(f2.x) * 0.9 + f2.y) - 0.07, abs(f2.x) - 0.42);
      float mk = hs < 0.55 ? 1. - smoothstep(0.13 - pxm, 0.13 + pxm, tri3) : 1. - smoothstep(-pxm, pxm, chev);
      mk *= sow * (1. - smoothstep(0.2, 0.5, pxm));
      col = mix(col, hs > 0.3 && hs < 0.55 ? uAcc : uInk, mk);
      col = mix(col, uInk, k);
    } else {
      // plinth: a band of triangles between lines; inside the patch the vermilion turns turmeric
      float h = (p.y - 0.25) / 2.1, s = fract(p.x / 3.2), tri = 1. - abs(2. * s - 1.);
      float inB = step(0., h) * step(h, 1.);
      col = mix(col, h < tri ? mix(uAcc, uSun, inside) : uB, inB);
      float k = max(max(ln(p.y - 0.25, 0.09), ln(p.y - 2.35, 0.09)), ln((h - tri) * 1.5, 0.09) * inB);
      k = max(k, ln(p.y - 2.72, 0.05));
      col = mix(col, uInk, k);
    }
  }
  gl_FragColor = vec4(col, 1.);
  ${FOG_FM}
}`;
function wallGeometry(gx, zAt) {
  const P = [], T = [], I = [], NX = 76, NY = 52, x0 = gx - 45;
  const roof = (x) => 60 + 36 * (1 - Math.abs(x - gx) / 45);
  for (let i = 0; i <= NX; i++) {
    const x = x0 + 90 * (i / NX);
    for (let j = 0; j <= NY; j++) { const y = 3.1 + (roof(x) - 3.1) * (j / NY); P.push(x, y, zAt(x, y)); T.push(0); }
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) { const a = i * (NY + 1) + j, b = a + NY + 1; I.push(a, b, a + 1, b, b + 1, a + 1); }
  const prof = [[1.3, 0], [1.3, 2.3], [1.2, 2.72], [0.9, 3.0], [0.35, 3.1], [0, 3.1]], base = P.length / 3, np = prof.length;
  for (let i = 0; i <= NX; i++) {
    const x = x0 + 90 * (i / NX), z = zAt(x, 3.1);
    for (const q of prof) { P.push(x, q[1], z + q[0]); T.push(1); }
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < np - 1; j++) { const a = base + i * np + j, b = a + np; I.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('aT', new THREE.Float32BufferAttribute(T, 1));
  g.setIndex(I);
  return g;
}

// ================================================================ buildHero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1, dens = ctx.vary?.density ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const hour = ctx.vary?.hour;
  const lookRoll = rng();
  const look = opts.look || (hour === 'dawn' ? 'line' : hour === 'night' ? 'dusk' : hour === 'golden' || hour === 'day' ? 'sun'
    : lookRoll < 0.52 ? 'sun' : lookRoll < 0.7 ? 'line' : 'dusk');
  const remap = look === 'line' ? [0, 1, 0, 0, 0, 0, 0] : look === 'dusk' ? [0, 1, 6, 6, 4, 4, 6] : [0, 1, 2, 3, 4, 5, 6];
  const f = (i) => pal[remap[i]];
  const W = pal[0], K = pal[1], ACC = look === 'dusk' ? pal[6] : pal[3];
  const gx = opts.gableX ?? -6;
  const wp = [rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU), rng.range(0, TAU)];
  const wallZ = (x, y) => {
    const r = Math.hypot(x, y - HUB_Y), m = sstep(33.5, 39, r), e = sstep(0, 8, Math.min(x - (gx - 45), gx + 45 - x));
    return (0.55 * Math.sin(x * 0.105 + y * 0.045 + wp[0]) + 0.45 * Math.sin(x * 0.062 - y * 0.083 + wp[1])
      + 0.3 * Math.sin(y * 0.19 + x * 0.12 + wp[2]) + 0.2 * Math.sin(y * 0.031 + wp[3])) * m * e;
  };
  const dir = rng.sign(), phase0 = rng.range(0, TAU), hatchK = rng.range(8, 11);
  const stemBase = rng.range(2.2, 5.2), stemTop = 89.5;
  // the cane's lean and bow: a parabola through its foot, the hub and the crown
  const stemX = (y) => {
    const y0 = 2.4, y1 = HUB_Y, y2 = stemTop, x0 = stemBase, x2 = gx;
    return x0 * ((y - y1) * (y - y2)) / ((y0 - y1) * (y0 - y2)) + x2 * ((y - y0) * (y - y1)) / ((y2 - y0) * (y2 - y1));
  };

  // shared uniforms
  const U = {
    uTime: { value: 0 }, uViewH: { value: 1080 }, uRing: { value: 0 }, uFace: { value: -dir }, uFlipP: { value: 0 }, uHatch: { value: hatchK },
    uGround: { value: W }, uInk: { value: K }, uWall: { value: new THREE.Vector4(wp[0], wp[1], wp[2], wp[3]) }, uGable: { value: gx },
    uWheel: { value: phase0 }, uPatch: { value: new THREE.Vector4(33, 2, 0.3, 0.25) }, uPatchOn: { value: look === 'sun' ? 1 : 0 },
    uOpen: { value: new Float32Array(24) },
  };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const mat = (vs, fs, extra, defines) => new THREE.ShaderMaterial({
    vertexShader: vs, fragmentShader: fs, fog: true, side: THREE.DoubleSide, defines: defines || {},
    uniforms: { ...fogU(), ...extra },
  });
  const paintU = { uTime: U.uTime, uViewH: U.uViewH, uRing: U.uRing, uFace: U.uFace, uFlipP: U.uFlipP, uHatch: U.uHatch, uGround: U.uGround, uWall: U.uWall, uGable: U.uGable };
  const paintMat = mat(PAINT_VERT, PAINT_FRAG, paintU); paintMat.vertexColors = true;
  const ringMat = mat(PAINT_VERT, PAINT_FRAG, paintU, { RING: 1 }); ringMat.vertexColors = true;
  const padMat = mat(PAD_VERT, PAD_FRAG, {
    uTime: U.uTime, uHatch: U.uHatch, uGround: U.uGround, uInk: U.uInk,
    uCA: { value: f(5) }, uCB: { value: f(2) }, uCC: { value: look === 'dusk' ? pal[4] : f(6) },
    uRim: { value: look === 'line' ? W : f(3) }, uDot: { value: look === 'line' ? ACC : W },
  });
  const stemMat = mat(STEM_VERT, STEM_FRAG, {
    uTime: U.uTime, uHatch: U.uHatch, uGround: U.uGround, uInk: U.uInk,
    uStem: { value: f(2) }, uDot: { value: look === 'line' ? ACC : W },
  });
  const budMat = mat(BUD_VERT, BUD_FRAG, {
    uOpen: U.uOpen, uInk: U.uInk, uPetal: { value: f(6) }, uPetal2: { value: look === 'dusk' ? pal[4] : f(2) }, uCalyx: { value: f(5) },
    uHeart: { value: look === 'dusk' ? pal[4] : pal[3] }, uRim: { value: look === 'line' ? W : f(3) }, uDot: { value: W },
  });
  const wallMat = mat(WALL_VERT, WALL_FRAG, {
    uTime: U.uTime, uGround: U.uGround, uInk: U.uInk, uGable: U.uGable, uWheel: U.uWheel, uPatch: U.uPatch, uPatchOn: U.uPatchOn,
    uSun: { value: pal[2] }, uAcc: { value: ACC }, uB: { value: f(4) },
  });

  await ctx.yield();
  const root = new THREE.Group(); root.name = 'kohbar';
  const add = (parent, geo, m, order = 0) => { const me = new THREE.Mesh(geo, m); me.frustumCulled = false; me.renderOrder = order; parent.add(me); return me; };

  // ---- wall and plinth
  if (opts.wall !== false) add(root, wallGeometry(gx, wallZ), wallMat);
  await ctx.yield();

  // ---- the wheel: six pads, their stalks and 24 buds, in a group that turns about the hub
  const wheel = new THREE.Group(); wheel.position.set(0, HUB_Y, 0); root.add(wheel);
  const notchIn = rng.chance(0.6), veins = rng.int(7, 10) * 2, scal = rng.int(5, 8) * 2;
  const pads = [];
  for (let i = 0; i < 6; i++) {
    const a = (i + 0.5) * TAU / 6;
    pads.push({ x: Math.cos(a) * PAD_RING, y: Math.sin(a) * PAD_RING, R: PAD_R, notch: a + (notchIn ? Math.PI : 0) + rng.range(-0.25, 0.25), kind: 0,
      seed: rng.range(0, 6), veins, scal });
  }
  add(wheel, padGeometry(pads), padMat);
  await ctx.yield();
  const buds = [];
  for (let i = 0; i < 6; i++) {
    const a = i * TAU / 6;
    const at = (r, da, size) => buds.push({ x: Math.cos(a + da) * r, y: Math.sin(a + da) * r, phi: a + da, size });
    at(13.2, 0, 2.8); at(26.6, 0, 3.5); at(30.0, 0.2, 2.3); at(30.0, -0.2, 2.3);
  }
  buds.sort((p, q) => p.phi - q.phi);
  add(wheel, await budGeometry(buds, ctx.yield), budMat);
  await ctx.yield();
  // stalks: double hatched lines from the hub out through each notch, branching to the flank buds
  {
    const ink = makeInk();
    for (let i = 0; i < 6; i++) {
      const a = i * TAU / 6, bend = rng.range(-0.035, 0.035), pts = [];
      for (let k = 0; k <= 10; k++) { const r = 8.7 + (24.6 - 8.7) * (k / 10), aa = a + bend * Math.sin((k / 10) * Math.PI); pts.push([Math.cos(aa) * r, Math.sin(aa) * r]); }
      ink.z(0.05).stroke(pts, 0.62, K, false, 2);
      for (const sd of [-1, 1]) {
        const q = [];
        for (let k = 0; k <= 8; k++) { const t = k / 8, r = 19.5 + 9.0 * t, aa = a + sd * 0.2 * t * t; q.push([Math.cos(aa) * r, Math.sin(aa) * r]); }
        ink.z(0.06).stroke(q, 0.2, K);
        // a small leaf on each branch
        const lr = 22.6, la = a + sd * 0.2 * 0.118, lx = Math.cos(la) * lr, ly = Math.sin(la) * lr, ld = a + sd * 1.0;
        const leaf = [[0, 0], [0.6, 0.32], [1.4, 0], [0.6, -0.32]].map((p) => [lx + p[0] * Math.cos(ld) - p[1] * Math.sin(ld), ly + p[0] * Math.sin(ld) + p[1] * Math.cos(ld)]);
        ink.z(0.07).shape(leaf, f(5), K, 0.11);
      }
      // dots either side of the stalk between hub and inner bud
      for (let k = 0; k < 3; k++) for (const sd of [-1, 1]) { const r = 15.9 + k * 1.3, aa = a + sd * 0.042; ink.z(0.07).disc(Math.cos(aa) * r, Math.sin(aa) * r, 0.2, ACC, 7); }
    }
    add(wheel, ink.build(), paintMat);
  }
  await ctx.yield();

  // ---- hub flower, crown flower and the still bamboo stem
  const fixedPads = [{ x: 0, y: HUB_Y, R: HUB_R, notch: null, kind: 1, seed: rng.range(0, 6), veins: 24, scal: 12 },
    { x: gx, y: stemTop, R: 3.1, notch: null, kind: 1, seed: rng.range(0, 6), veins: 12, scal: 8, h: 2.7, z0: wallZ(gx, stemTop) }];
  add(root, padGeometry(fixedPads), padMat);
  const nodes = [];
  for (let y = rng.range(6.5, 8.5); y < stemTop - 5; y += rng.range(6.2, 8.4)) nodes.push(y);
  add(root, stemGeometry(stemX, 2.4, stemTop, nodes, (x, y) => wallZ(x, y) + 1.0), stemMat);
  await ctx.yield();
  // bamboo blades at the nodes above the wheel (painted, fluttering from the node)
  {
    const ink = makeInk();
    for (const ny of nodes) {
      if (ny < 80) continue;
      const nx = stemX(ny), zz = wallZ(nx, ny) + 0.12;
      for (const sd of [-1, 1]) for (let b = 0; b < 2; b++) {
        const L = rng.range(3.6, 5.2), a = sd * (0.75 + b * 0.55 + rng.range(-0.1, 0.1)), ca = Math.sin(a), sa = Math.cos(a);
        const bl = loop([[0, 0], [L * 0.35, 0.5], [L, 0], [L * 0.35, -0.5]], 4).map((p) => [nx + sd * 1.4 + p[0] * ca - p[1] * sa, ny + p[0] * sa + p[1] * ca]);
        ink.wave((x, y) => 0.11 * clamp01(Math.hypot(x - nx, y - ny) / 5) ** 2);
        ink.z(zz + b * 0.03).shape(bl, f(5), K, 0.13);
        ink.z(zz + b * 0.03 + 0.02).stroke([[nx + sd * 1.4 + L * 0.1 * ca, ny + L * 0.1 * sa], [nx + sd * 1.4 + L * 0.85 * ca, ny + L * 0.85 * sa]], 0.07, K);
      }
    }
    if (ink.count()) add(root, ink.build(), paintMat);
  }

  await ctx.yield();
  // ---- the ring that circles against the wheel: 8 fish, 4 turtles, 8 parrots
  {
    const ink = makeInk(), order = ['f', 'p', 'f', 't', 'p'], off = rng.int(0, 4);
    const bodies = look === 'dusk' ? [pal[4], pal[6]] : [f(2), f(6), f(4)];
    let nf = 0;
    for (let i = 0; i < 20; i++) {
      const kind = order[(i + off) % 5], th = (i / 20) * TAU + rng.range(-0.02, 0.02);
      ink.ext([th, RING_R + rng.range(-0.15, 0.15), rng.range(0, TAU), 0]);
      if (kind === 'f') { const b = bodies[nf++ % bodies.length]; drawFish(ink, { W, K, acc: ACC, body: b, second: b === f(2) ? f(3) : f(2), third: f(5) }, rng.range(0.72, 0.82), rng); }
      else if (kind === 't') drawTurtle(ink, { W, K, acc: ACC, body: f(5), second: f(2), third: look === 'dusk' ? pal[6] : f(5) }, 0.72);
      else drawParrot(ink, { W, K, acc: ACC, body: f(5), second: look === 'dusk' ? pal[6] : f(5), third: f(2) }, rng.range(0.74, 0.8));
      if (i % 5 === 4) await ctx.yield();
    }
    add(root, ink.build(), ringMat, 1);
  }
  await ctx.yield();

  // ---- sown motifs in the corners of the gable
  {
    const roof = (x) => 60 + 36 * (1 - Math.abs(x - gx) / 45);
    const spots = [[], []], keep = Math.min(1, 0.9 * detail * dens);
    for (let cx = gx - 45 + 3.4; cx < gx + 45 - 3; cx += 3.1) for (let cy = 6.2; cy < 92; cy += 3.1) {
      const x = cx + rng.range(-0.9, 0.9), y = cy + rng.range(-0.9, 0.9), kindRoll = rng(), pick = rng(), s = rng.range(0.95, 1.7), rot = rng.range(0, TAU), take = rng();
      const db = Math.min((roof(x) - y) * 0.781, x - (gx - 45), gx + 45 - x);
      if (db < 3.6 + s || Math.hypot(x, y - HUB_Y) < 38.6 + s || (y > 70 && Math.abs(x - stemX(y)) < 6.5) || take > keep) continue;
      spots[kindRoll < 0.55 ? 0 : 1].push({ x, y, s, rot, pick });
    }
    const fl = makeInk(); drawFlower(fl, { W, K, acc: ACC }, rng.int(6, 8));
    const sp = makeInk(); drawSprig(sp, { W, K, acc: ACC });
    const geos = [fl.build(), sp.build()], m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), zax = new THREE.Vector3(0, 0, 1), v = new THREE.Vector3(), sv = new THREE.Vector3();
    const tints = look === 'line' ? [W] : look === 'dusk' ? [pal[6], pal[4]] : [pal[2], pal[3], pal[6], pal[4]];
    for (let g = 0; g < 2; g++) {
      const n = spots[g].length; if (!n) continue;
      const im = new THREE.InstancedMesh(geos[g], paintMat, n); im.frustumCulled = false; im.renderOrder = 1;
      spots[g].forEach((o, i) => {
        q.setFromAxisAngle(zax, g === 0 ? o.rot : (o.rot / TAU - 0.5) * 0.9);
        m4.compose(v.set(o.x, o.y, wallZ(o.x, o.y) + 0.02), q, sv.set(o.s, o.s, 1)); im.setMatrixAt(i, m4);
        im.setColorAt(i, g === 0 ? tints[Math.floor(o.pick * tints.length)] : f(5));
      });
      im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
      root.add(im);
    }
  }
  await ctx.yield();

  // ---------------------------------------------------------------- state and animation
  const N = buds.length, open = new Float32Array(N), target = new Float32Array(N);
  let prog = 0, progSet = false, snap = true, spin = 1, spinInt = 0, face = -dir, lastDemo = -1, waveMode = false;
  const demo = opts.demo !== false, size = new THREE.Vector2();
  const patch = { cornerX: 33, cornerY: 2, footX: 32.5, slope: 0.3, lean: 0.25 };
  const progressFromU = (u) => clamp01((u - 0.26) / 0.46);
  const reset = () => { prog = 0; open.fill(0); target.fill(0); snap = true; };
  const setProgress = (p) => { progSet = true; p = clamp01(p); if (p - prog > 0.06) snap = true; if (p > prog) prog = p; };
  const placePatch = () => {
    patch.cornerX = 33 - 85 * prog; patch.cornerY = 2 + 98 * prog; patch.footX = patch.cornerX - patch.lean * patch.cornerY;
    U.uPatch.value.set(patch.cornerX, patch.cornerY, patch.slope, patch.lean);
  };
  placePatch();

  function update(dt, time, camera) {
    dt = Math.min(Math.max(dt || 0, 0), 0.1);
    U.uTime.value = time;
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uViewH.value = Math.max(64, size.y); }
    if (demo && !progSet) {
      const d = clamp01((((time + 8) % 60) + 60) % 60 / 36);
      if (d < lastDemo - 0.02) reset();
      if (Math.abs(d - lastDemo) > 0.06) snap = true;
      lastDemo = d; prog = Math.max(prog, d);
    }
    spinInt += (spin - 1) * dt;
    const turn = time + spinInt, wa = phase0 + dir * turn * TAU / 90;
    wheel.rotation.z = wa; U.uWheel.value = wa;
    U.uRing.value = -dir * turn * TAU / 75;
    const want = waveMode || spin >= 0 ? -dir : dir;
    face += (want - face) * Math.min(1, dt * 2.5); if (snap) face = want;
    U.uFace.value = Math.abs(face) < 0.04 ? (face < 0 ? -0.04 : 0.04) : face;
    placePatch();
    const ca = Math.cos(wa), sa = Math.sin(wa);
    let cnt = 0;
    for (let i = 0; i < N; i++) {
      if (look === 'sun') {
        const b = buds[i], x = b.x * ca - b.y * sa, y = HUB_Y + b.x * sa + b.y * ca;
        if (x > patch.cornerX + patch.lean * (y - patch.cornerY) + 1 && y < patch.cornerY + patch.slope * (x - patch.cornerX) - 1) target[i] = 1;
      } else if (look === 'line') { if (prog > (i + 0.5) / N) target[i] = 1; }
      else if (prog > (Math.floor(i * 9 / N) + 0.5) / 9) target[i] = 1;
      open[i] = snap ? target[i] : Math.min(target[i], open[i] + dt / 1.5);
      const o = open[i]; U.uOpen.value[i] = o * o * (3 - 2 * o);
      if (target[i] > 0) cnt++;
    }
    hero.opened = cnt;
    snap = false;
  }

  const P3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const hero = {
    object: root, radius: 33, height: 96, center: P3(0, HUB_Y, 0), ground: true, groundY: 0,
    look, uniforms: U, patch, opened: 0, wallZ, stemX,
    anchors: {
      hub: P3(0, HUB_Y, 1.5), squareOn: P3(0, HUB_Y, 60), lowPass: P3(9, 26, 14.5), hubPass: P3(0, 44, 14.5),
      flyThrough: [P3(34, 26, 30), P3(22, 26, 16), P3(9, 26, 14.5), P3(-8, 28, 15), P3(-24, 32, 24), P3(0, HUB_Y, 60), P3(20, 44, 22), P3(0, 44, 14.5), P3(-20, 44, 20)],
      portalSeat: { position: P3(-34, 34, 190), facing: P3(0, 0, -1) },
      placement: { position: [80, 0, 6], rotationY: -Math.PI / 2 },
      patchFoot: P3(patch.footX, 0, 0), crown: P3(gx, stemTop, 2.8), maxProud: 3.3,
    },
    update, dispose() {},
    setProgress, setU: (u) => setProgress(progressFromU(u)), progressFromU, resetProgress: reset,
    setSpin: (s) => { spin = Math.max(-2, Math.min(2, s)); },
    setFlip: (p) => { waveMode = true; U.uFlipP.value = clamp01(p); },
  };
  return hero;
}

// the ink toolkit and the figures, for the world file (same shaders, so the same programs)
export { makeInk, loop as inkLoop, arc as inkArc, PAINT_VERT, PAINT_FRAG, drawFish, drawParrot, drawTurtle, drawFlower, drawSprig };
