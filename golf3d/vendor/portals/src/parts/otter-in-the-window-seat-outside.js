// otter-in-the-window-seat: THE OUTSIDE (the hull, wings, pods and tail, the dome, the aerials, the arcs, the billows,
// the wisps). The outside part; the world calls it by design/ab/otter-in-the-window-seat.contract-outside.md.
//
// SPACE: cabin space, the world's own (the sun wall at x = 0, seats to +x, row k at z = k * 15.6; the hull's axis at
// x 36.4, y 14; the nose toward -z). Every object returned is added to the scene at identity by the world.
// Everything is built twenty times life: the hull is a tube 76.8 m across, a window's frame stands a third of a metre
// proud of the skin, a rivet is a dimple a hand wide. Nothing here reads a seed, a lens (but to shade by the view
// direction, to face ribbons and puffs at it, to thin a medium near it (the wisps melt away between 46 and 10 m from
// it; the arcs' ribbons NARROW, at full colour, to a hair and then nothing: outdoor arcs between 16 and 6 m, an indoor
// sign between the plan's 2.5 and 0.6 m; no arc is ever made pale or see-through), to keep the arcs' ribbons at a floor of
// 2.2 px by the cabin light's uPix, the angle one pixel covers, and to soften a puff's edge by its size in the
// picture, the projection's scale: all declared in the world's head), a clock of the wall or a route metre: every place is the plan file's,
// every motion is a function of the world's clock handed to update(), and the pulses' six frames come from the world.
// No lettering, no stripe, no mark: plain white, panel joints, lap seams, rivets, plain doors with sill and gutter,
// the wing root's fairing as its own panel, every window's rim warm with the cabin's light, lit painted panes.
// BY PLACE, the same at every metre and on every seed: the arcs are not drawn inside the hull's own space and are
// lifted over the window line in a zone before the entered window; no wisp is drawn in the roof's clear air, nor in
// the lane of air outside the hero's own window through which the last leg sees the cloud of two.
//
// E, the one object handed to every maker (read only): sunDir (unit, toward the sun), sunColor, skyColor,
// groundColor, fogColor (THREE.Color), fogDensity, look, detail, pause (the context's yield), noise (the cloud
// field's own noise texture), rig, L (the cabin light handle: its uPix sizes ribbons).
// A HANDLE is { object, update(dt, time, camera) }: uniforms only inside update.
//
// makeBillows and makeWisps take `field`, the kit cloud field that stands round them: its lit, shade, bottom and sun
// uniforms are SHARED (the same objects), so the billows and wisps are lit as the cloud beside them in every look.
// tools/ab/ow-count-outside.mjs counts these pieces' true triangles against the route.
import * as THREE from 'three';
import * as P from './otter-in-the-window-seat-plan.js';

const PI = Math.PI, TAU = PI * 2, D2R = PI / 180;
const AX = P.CABIN.HULL_AXIS[0], AY = P.CABIN.HULL_AXIS[1], HR = P.CABIN.HULL_R, DM = P.D;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const spow = (x, e) => Math.sign(x) * Math.pow(Math.abs(x), e);
const v3 = (c) => new THREE.Vector3(c.r, c.g, c.b);

// kinds of surface, one float a vertex (the one shader paints each its own way)
const K = { SKIN: 0, FRAME: 1, PANE: 2, TUNNEL: 3, WING: 4, POD: 5, INLET: 6, DOME: 7, AERIAL: 8, TAIL: 9, EDGE: 10 };

// A SMALL MESHER: points with a kind; triangles; smooth normals by adding up the faces round each point (two pieces
// that must meet at a crease do not share points). add(): one point. grid(): a lofted sheet of rows of points.
function mesher() {
  const pos = [], kind = [], idx = [];
  const add = (x, y, z, k) => { pos.push(x, y, z); kind.push(k); return pos.length / 3 - 1; };
  const tri = (a, b, c, flip) => { if (flip) idx.push(a, c, b); else idx.push(a, b, c); };
  // rows[j][i] = [x, y, z]; closed: the last column joins the first; flip turns the faces over. Returns the first index.
  const grid = (rows, k, closed = false, flip = false) => {
    const nj = rows.length, ni = rows[0].length, base = pos.length / 3, cols = closed ? ni : ni - 1;
    for (const r of rows) for (const p of r) add(p[0], p[1], p[2], k);
    for (let j = 0; j < nj - 1; j++) for (let i = 0; i < cols; i++) {
      const a = base + j * ni + i, b = base + j * ni + (i + 1) % ni, c = a + ni, d = b + ni;
      tri(a, b, c, flip); tri(b, d, c, flip);
    }
    return base;
  };
  // a fan from one point to a loop of points (a cap)
  const fan = (centre, loop, k, flip = false) => {
    const c = add(centre[0], centre[1], centre[2], k), base = pos.length / 3;
    for (const p of loop) add(p[0], p[1], p[2], k);
    for (let i = 0; i < loop.length; i++) tri(c, base + i, base + (i + 1) % loop.length, flip);
  };
  const done = (name) => {
    const n = pos.length / 3, nrm = new Float32Array(n * 3), p = pos;
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3, b = idx[t + 1] * 3, c = idx[t + 2] * 3;
      const ux = p[b] - p[a], uy = p[b + 1] - p[a + 1], uz = p[b + 2] - p[a + 2], vx = p[c] - p[a], vy = p[c + 1] - p[a + 1], vz = p[c + 2] - p[a + 2];
      const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      for (const q of [a, b, c]) { nrm[q] += nx; nrm[q + 1] += ny; nrm[q + 2] += nz; }
    }
    for (let i = 0; i < n; i++) { const l = Math.hypot(nrm[i * 3], nrm[i * 3 + 1], nrm[i * 3 + 2]) || 1; nrm[i * 3] /= l; nrm[i * 3 + 1] /= l; nrm[i * 3 + 2] /= l; }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
    g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1)); g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(idx, 1) : new THREE.Uint16BufferAttribute(idx, 1));
    g.userData.triangles = idx.length / 3; g.name = name;
    return g;
  };
  return { add, tri, grid, fan, done, count: () => pos.length / 3, triangles: () => idx.length / 3 };
}

// ------------------------------------------------------------------------------------------------------------------
// THE HULL'S SHAPE. A tube about the airliner's axis: radius HR (the plan's), the nose tapered and drooped, the tail
// cone tapered and swept up; under the window line, the length of the cabin and a little more, a belly fairing swells
// it by FAIR metres (it carries the wing's root and holds the cabin's floor corners inside the skin).
// a: the angle round the axis from the crown toward the sun flank (the sun flank is a quarter turn, the belly a half).
// ------------------------------------------------------------------------------------------------------------------
const HULL = { NA: 64, SHOULDER: 1.5, NOSE: 98, TAIL: 170, FAIR: 2.6, FAIR_A: [98, 114], FAIR_Z: [-100, -70, 135, 165], WIN_K: [-14, 16], BAND: [13, 16], NW: 32 };
function hullSection(z) {
  const Z0 = P.CABIN.HULL_Z[0], Z1 = P.CABIN.HULL_Z[1];
  if (z < Z0 + HULL.NOSE) { const t = clamp((z - Z0) / HULL.NOSE, 0, 1), f = Math.max(0.02, Math.pow(1 - Math.pow(1 - t, 2.0), 0.62)); return [HR * f, AY - HR * (1 - f) * 0.3]; }
  if (z > Z1 - HULL.TAIL) { const t = clamp((z - (Z1 - HULL.TAIL)) / HULL.TAIL, 0, 1), f = 1 - 0.88 * Math.pow(t, 1.35); return [HR * f, AY + HR * (1 - f) * 0.78]; }
  return [HR, AY];
}
const fairAt = (a, z) => { const f = a > PI ? TAU - a : a, Z = HULL.FAIR_Z; return HULL.FAIR * sstep(HULL.FAIR_A[0] * D2R, HULL.FAIR_A[1] * D2R, f) * sstep(Z[0], Z[1], z) * (1 - sstep(Z[2], Z[3], z)); };
// the shoulders: over the window line the section is 1.5 m fuller than the circle, the whole length (the cabin's
// wall top and the bins' outer edge lie under it); the crown and the window band keep the plan's own circle
const shoulderAt = (a) => { const f = (a > PI ? TAU - a : a) / D2R; return HULL.SHOULDER * sstep(36, 46, f) * (1 - sstep(60, 69, f)); };
export function hullPoint(a, z) { const [r0, cy] = hullSection(z), r = r0 + fairAt(a, z) + shoulderAt(a) * (r0 / HR); return [AX - r * Math.sin(a), cy + r * Math.cos(a), z]; }
// the skin's x on the sun flank at height y, in the window band (there the section is the plan's own circle)
const skinX = (y) => AX - Math.sqrt(Math.max(0, HR * HR - (y - AY) * (y - AY)));
// HOW FAR OUTSIDE THE SKIN a place stands, in metres (under 0: inside the hull's own space), by the section's law
// above: the arcs' shader runs the same law (HULL_GLSL), and the count holds the drawn skin to it.
export function hullOutside(x, y, z) {
  if (z < P.CABIN.HULL_Z[0] || z > P.CABIN.HULL_Z[1]) return 1e3;
  const [r0, cy] = hullSection(z), dx = x - AX, dy = y - cy, l = Math.max(Math.hypot(dx, dy), 1e-4), a = Math.acos(clamp(dy / l, -1, 1));
  return l - (r0 + fairAt(a, z) + shoulderAt(a) * (r0 / HR));
}
const glf = (x) => { const s = String(Math.round(x * 1e4) / 1e4); return /[.e]/.test(s) ? s : s + '.'; };   // a number as GLSL writes a float
const HULL_GLSL = /* glsl */`
float hullOut(vec3 p){                                   // metres outside the hull's skin (under 0: inside): hullOutside() above
  float f = 1., cy = ${glf(AY)};
  if (p.z < ${glf(P.CABIN.HULL_Z[0] + HULL.NOSE)}){ float q = 1. - clamp((p.z - ${glf(P.CABIN.HULL_Z[0])})/${glf(HULL.NOSE)}, 0., 1.);
    f = max(.02, pow(max(1. - q*q, 1e-6), .62)); cy = ${glf(AY)} - ${glf(HR)}*(1. - f)*.3; }
  else if (p.z > ${glf(P.CABIN.HULL_Z[1] - HULL.TAIL)}){ float t = clamp((p.z - ${glf(P.CABIN.HULL_Z[1] - HULL.TAIL)})/${glf(HULL.TAIL)}, 0., 1.);
    f = 1. - .88*pow(max(t, 1e-6), 1.35); cy = ${glf(AY)} + ${glf(HR)}*(1. - f)*.78; }
  vec2 d = vec2(p.x - ${glf(AX)}, p.y - cy); float l = max(length(d), 1e-4), a = degrees(acos(clamp(d.y/l, -1., 1.)));
  float r = ${glf(HR)}*f + ${glf(HULL.SHOULDER)}*f*smoothstep(${glf(36)}, ${glf(46)}, a)*(1. - smoothstep(${glf(60)}, ${glf(69)}, a))
    + ${glf(HULL.FAIR)}*smoothstep(${glf(HULL.FAIR_A[0])}, ${glf(HULL.FAIR_A[1])}, a)*smoothstep(${glf(HULL.FAIR_Z[0])}, ${glf(HULL.FAIR_Z[1])}, p.z)*(1. - smoothstep(${glf(HULL.FAIR_Z[2])}, ${glf(HULL.FAIR_Z[3])}, p.z));
  return (p.z < ${glf(P.CABIN.HULL_Z[0])} || p.z > ${glf(P.CABIN.HULL_Z[1])}) ? 1e3 : l - r;
}`;
const ovalAt = (f, k) => { const e = 2 / 2.7; return [(DM.WIN_W / 2) * k * spow(Math.cos(f), e), (DM.WIN_H / 2) * k * spow(Math.sin(f), e)]; };
const winZ = (k) => k * DM.PITCH + DM.WIN_Z;
const isReal = (k) => k >= P.CABIN.BAY[0] && k <= P.CABIN.ROW1;

// two convex loops of points, one inside the other, each sorted by angle about one middle ({ i: index, a: angle,
// u, v: its place in the loops' own plane }): the band of triangles between them, by merging the two loops' edges in
// the order of their directions from each loop's lowest point (every triangle then stands on one loop's edge with
// its third corner where the other loop runs alongside: none crosses the hole, none is turned over).
function stitch(M, inner, outer, flip) {
  const lay = (loop) => {
    const n = loop.length; let s = 0;
    for (let k = 1; k < n; k++) if (loop[k].v < loop[s].v - 1e-9 || (Math.abs(loop[k].v - loop[s].v) <= 1e-9 && loop[k].u < loop[s].u)) s = k;
    const pts = [], dir = [];
    for (let k = 0; k <= n; k++) pts.push(loop[(s + k) % n]);
    for (let k = 0; k < n; k++) { let d = Math.atan2(pts[k + 1].v - pts[k].v, pts[k + 1].u - pts[k].u); if (d < -1e-7) d += TAU; dir.push(Math.max(d, 0)); }
    return { n, pts, dir };
  };
  const A = lay(inner), B = lay(outer); let i = 0, j = 0;
  while (i < A.n || j < B.n) {
    const di = i < A.n ? A.dir[i] : Infinity, dj = j < B.n ? B.dir[j] : Infinity;
    if (di <= dj) { M.tri(A.pts[i].i, B.pts[j].i, A.pts[i + 1].i, flip); i++; } else { M.tri(A.pts[i].i, B.pts[j].i, B.pts[j + 1].i, flip); j++; }
  }
}

// one window's rings: side 0 the sun flank, 1 the far flank (mirrored in the cabin's middle); real: a hole that meets
// the cabin's reveal 1.6 m outside the inner wall; else a dark pane set in the same frame. ring: the skin's own points
// round the hole (real windows only), to which the frame is fitted.
function windowRings(M, k, side, real) {
  const NW = HULL.NW, zc = winZ(k), W = DM.CABIN_W, flip = side === 1;
  const X = (x) => (side ? W - x : x);
  const xr = (y) => P.wallX(y) - DM.WIN_DEPTH;                                  // where the cabin's reveal ends
  const xf = (y) => Math.min(skinX(y), real ? xr(y) : 1e9) - 0.32;              // the frame's face, a third of a metre proud
  const ring = (kk, fx) => { const r = []; for (let n = 0; n < NW; n++) { const o = ovalAt((n / NW) * TAU, kk), y = DM.WIN_Y + o[1]; r.push([X(fx(y)), y, zc + o[0]]); } return r; };
  const mixx = (t) => (y) => skinX(y) + (xf(y) - skinX(y)) * t;
  // the frame: from the skin up a bevel to a flat face, then in to the opening's lip (rows from the outside in)
  M.grid([ring(1.3, (y) => skinX(y) + (real ? 0 : 0.06)), ring(1.25, mixx(0.7)), ring(1.17, xf), ring(1.03, xf)], K.FRAME, true, flip);
  if (real) {
    // the passage through the skin: lip, then straight in to the reveal's own outline (a hair wider: never narrower)
    M.grid([ring(1.03, xf), ring(0.995, (y) => xf(y) + 0.1), ring(0.985, xr)], K.TUNNEL, true, flip);
  } else {
    M.grid([ring(1.03, xf), ring(0.99, (y) => xf(y) + 0.16)], K.FRAME, true, flip);
    M.fan([X(xf(DM.WIN_Y) + 0.22), DM.WIN_Y, zc], ring(0.99, (y) => xf(y) + 0.16), K.PANE, flip);
  }
}

// the stations along the axis: the nose, the straight run, the cabin's twelve unit edges, the tail cone
function hullStations() {
  const Z0 = P.CABIN.HULL_Z[0], Z1 = P.CABIN.HULL_Z[1], zs = [];
  for (const t of [0, 0.015, 0.05, 0.11, 0.2, 0.32, 0.46, 0.62, 0.8, 1]) zs.push(Z0 + HULL.NOSE * t);
  zs.push(-190, -145, -100, -92.5, -85, -77.5, -70);
  const u0 = P.CABIN.BAY[0], u1 = P.CABIN.ROW1;
  for (let k = u0; k <= u1 + 1; k++) zs.push(k * DM.PITCH + 3.6 - DM.PITCH);      // a unit runs from 15.6 k - 12 to 15.6 k + 3.6
  zs.push(135, 142.5, 150, 157.5, 165, 205);
  for (const t of [0, 0.1, 0.22, 0.36, 0.5, 0.64, 0.78, 0.9, 1]) zs.push(Z1 - HULL.TAIL + HULL.TAIL * t);
  return zs;
}
// THE HULL'S GEOMETRY, in steps (a generator: the maker rests between them). One merged mesh: the lofted skin with
// twenty-four real oval holes (the cabin's twelve units on both flanks), each hole's frame and passage, and on the
// sun flank a frame and a dark pane for every other window of the straight run.
function* hullSteps() {
  const M = mesher(), NA = HULL.NA, zs = hullStations(), NJ = zs.length, base = 0;
  for (let j = 0; j < NJ; j++) for (let i = 0; i < NA; i++) { const p = hullPoint((i / NA) * TAU, zs[j]); M.add(p[0], p[1], p[2], K.SKIN); }
  const vi = (j, i) => base + j * NA + ((i + NA) % NA);
  const zA = P.CABIN.BAY[0] * DM.PITCH + 3.6 - DM.PITCH, zB = P.CABIN.ROW1 * DM.PITCH + 3.6;
  const B0 = HULL.BAND[0], B1 = HULL.BAND[1], inBand = (i) => (i >= B0 && i < B1) || (i >= NA - B1 && i < NA - B0);
  const units = [];                                                              // [station index, unit number]
  for (let j = 0; j < NJ - 1; j++) {
    const unit = zs[j] > zA - 0.01 && zs[j + 1] < zB + 0.01;
    if (unit) units.push([j, Math.round((zs[j] + DM.PITCH - 3.6) / DM.PITCH)]);
    for (let i = 0; i < NA; i++) {
      if (unit && inBand(i)) continue;                                           // the window band of a cabin unit: laid below, round its hole
      const a = vi(j, i), b = vi(j, i + 1), c = vi(j + 1, i), d = vi(j + 1, i + 1);
      M.tri(a, b, c); M.tri(b, d, c);
    }
  }
  // nose and tail are closed
  { const n0 = hullPoint(0, zs[0]), [, cy0] = hullSection(zs[0]), c = M.add(AX, cy0, zs[0] - 0.4, K.SKIN); for (let i = 0; i < NA; i++) M.tri(c, vi(0, i + 1), vi(0, i)); void n0;
    const [, cy1] = hullSection(zs[NJ - 1]), e = M.add(AX, cy1, zs[NJ - 1] + 1.5, K.SKIN); for (let i = 0; i < NA; i++) M.tri(e, vi(NJ - 1, i), vi(NJ - 1, i + 1)); }
  yield;
  // the window band of each cabin unit, both flanks: the skin from the band's edge in to a ring round the hole
  const NW = HULL.NW, W = DM.CABIN_W;
  for (const [j, k] of units) {
    const zc = winZ(k);
    for (const side of [0, 1]) {
      const i0 = side ? NA - B1 : B0, i1 = side ? NA - B0 : B1, outer = [], inner = [];
      const edge = (jj, ii) => { const p = hullPoint((ii / NA) * TAU, zs[jj]); outer.push({ i: vi(jj, ii), a: Math.atan2(p[1] - DM.WIN_Y, p[2] - zc), u: p[2] - zc, v: p[1] - DM.WIN_Y }); };
      for (let ii = i0; ii <= i1; ii++) { edge(j, ii); edge(j + 1, ii); }
      outer.sort((p, q) => p.a - q.a);
      for (let n = 0; n < NW; n++) {
        const o = ovalAt((n / NW) * TAU, 1.3), y = DM.WIN_Y + o[1], x = skinX(y);
        inner.push({ i: M.add(side ? W - x : x, y, zc + o[0], K.SKIN), a: Math.atan2(o[1], o[0]), u: o[0], v: o[1] });
      }
      inner.sort((p, q) => p.a - q.a);
      stitch(M, inner, outer, side === 1);
      windowRings(M, k, side, true);
    }
    if ((k & 3) === 0) yield;
  }
  yield;
  // every other window of the straight run on the sun flank: a frame and a dark pane (the far flank's are paint)
  for (let k = HULL.WIN_K[0]; k <= HULL.WIN_K[1]; k++) if (!isReal(k)) windowRings(M, k, 0, false);
  yield;
  return M.done('otter-hull');
}

// ------------------------------------------------------------------------------------------------------------------
// THE SKIN'S SHADER: one program for hull, frames, panes, wings, pods, tail, dome and aerials (aKind tells which).
// Plain white paint under a low sun: the sun's own light with the drawn shadows of the bodies that stand on the skin,
// the sky above and the cloud's light below, and a gloss (a broad lobe toward the sun, a tight one, the sky mirrored
// at grazing angles) that the panels' slight pillowing breaks into a quilt. Relief drawn in the shader: panel joints,
// rows of rivets, plain door outlines, and on the far flank the windows of the straight run as dark ovals in a frame.
// Every pow, sqrt, division and normalize is clamped (Direct3D); no texture is read; the one loop reads none.
// ------------------------------------------------------------------------------------------------------------------
const NCAP = 8;
const SKIN_VERT = /* glsl */`
attribute float aKind;
varying vec3 vP, vN; varying float vKind, vDist;
void main(){
  vec4 w = modelMatrix*vec4(position, 1.);
  vP = w.xyz; vN = mat3(modelMatrix)*normal; vKind = aKind;
  vec4 mv = viewMatrix*w; vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const SKIN_HEAD = /* glsl */`
precision highp float;
uniform vec3 uSunDir, uSunCol, uSkyCol, uGndCol, uFogCol, uAxis; uniform vec4 uCapA[${NCAP}], uCapB[${NCAP}], uDomeC, uDomeR, uLight, uWinK, uPod, uWarm; uniform float uTime, uFogDen;
varying vec3 vP, vN; varying float vKind, vDist;
float hash2(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7)))*43758.5453); }
float noise2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f);
  return mix(mix(hash2(i), hash2(i + vec2(1., 0.)), f.x), mix(hash2(i + vec2(0., 1.)), hash2(i + vec2(1., 1.)), f.x), f.y); }
// the shade of the wisps that stream aft over the roof and down the flank: long soft streaks sliding along the skin
// at the wisps' own speed, by the world's clock (0 in the open sun, 1 under a wisp's middle)
float wispShade(vec3 Pw){
  float arc = atan(-(Pw.x - uAxis.x), Pw.y - uAxis.y + 1e-5)*uAxis.z;
  vec2 q = vec2((Pw.z - uTime*21.)/45., arc/14.);
  return smoothstep(.48, .7, noise2(q)*.7 + noise2(q*2.7 + 3.7)*.3);
}
// a ruled line: x metres from it, w its half width, px metres a pixel; under a pixel it fades by its share of one
float ruled(float x, float w, float px){ return (1. - smoothstep(w, w + px, abs(x)))*clamp(2.*w/max(px, 1e-4), 0., 1.); }
// the soft drawn shadows: capsules (an otter's trunk, head and tail, an aerial's blade) and the dome, toward the sun
float bodyShade(vec3 Pw, vec3 L){
  float sh = 1.;
  for (int i = 0; i < ${NCAP}; i++){
    vec3 A = uCapA[i].xyz, d = uCapB[i].xyz - A, w0 = Pw - A;
    float a = max(dot(d, d), 1e-4), b = dot(d, L), c = dot(w0, d), e = dot(w0, L);
    float s = clamp((c - b*e)/max(a - b*b, 1e-4), 0., 1.), t = max(b*s - e, 0.);
    s = clamp((c + b*t)/a, 0., 1.);
    float dist = length(w0 + L*t - d*s), r = uCapA[i].w, pen = .22 + .03*t;
    sh *= mix(1., smoothstep(r - pen, r + pen, dist), uCapB[i].w);
  }
  vec3 q = (Pw - uDomeC.xyz)/uDomeR.xyz, l = L/uDomeR.xyz;
  float t = max(-dot(q, l)/max(dot(l, l), 1e-6), 0.), dd = length(q + l*t);
  sh *= mix(1., smoothstep(.93, 1.07 + .006*t, dd), uDomeC.w);
  return sh;
}
// the oval of a cabin window about its middle: 1 on the outline
float oval(vec2 p){ vec2 q = abs(p)/vec2(${(DM.WIN_W / 2).toFixed(3)}, ${(DM.WIN_H / 2).toFixed(3)}); return pow(pow(q.x, 2.7) + pow(q.y, 2.7) + 1e-6, 1./2.7); }
// a rounded rectangle's outline: metres from it (under 0 inside)
float rrect(vec2 p, vec2 h, float r){ vec2 q = abs(p) - h + r; return length(max(q, 0.)) + min(max(q.x, q.y), 0.) - r; }
`;
// THE FLANK'S DRESS (both flanks, by place; drawn in the shader, no triangle more), what a real hull has where the
// eye runs along it before the entered window. Nothing lettered; the paint stays plain white.
//   DOORS: three a flank, at the windows of units -5, -2 (the cabin's own doorway bay, beside the entered window)
//     and 10; each a slab with its own window, a dark gap round it and a lit edge inside the gap, a doubler's edge a
//     metre outside it, one recessed grip, a SILL of bare metal under its foot and a rain gutter's lip over its head.
//   THE BELT SEAMS: the two long joints over and under the window row (48 and 60.8 m round from the crown) are lap
//     joints: a raised edge that throws the low sun back as one bright line the hull's length, a line of shade
//     under it, a row of rivets either hand (dots near, one faint line from afar); the belt between them is a
//     doubler a hair warmer than the paint.
//   THE WING ROOT'S FAIRING: the belly's swell under the window line is its own panel, matt and a touch cooler, with
//     a seam and a row of fasteners along its upper edge and a seam where it ends fore and aft.
// in: Pw, px, arc (metres round from the crown), dz and door (relief's). Returns the shine.
const DOORS = [winZ(-5), winZ(-2), winZ(10)], FAIR_ARC = HULL.FAIR_A[0] * D2R * HR;
const SKIN_DRESS = /* glsl */`
float dress(vec3 Pw, float px, float arc, float dz, float door, inout vec3 alb, inout vec2 g, inout float gloss){
  float shine = 0., far1 = 1. - smoothstep(.5, 2.2, px), open = smoothstep(-.1, .1, door);
  // the belt seams
  float sa = arc - 48., sb = arc - 60.8, s = abs(sa) < abs(sb) ? sa : sb;
  float nearR = 1. - smoothstep(.12, .3, px), rd = length(vec2((fract(Pw.z/.6) - .5)*.6, abs(s) - .45));
  float riv = (1. - smoothstep(.08, .08 + px, rd))*nearR + ruled(abs(s) - .45, .05, px)*.35*(1. - nearR);
  alb *= 1. - (.3*ruled(s - .07, .05, px) + .22*riv)*open; shine += .8*ruled(s + .11, .09, px)*open;
  g.y -= s*exp(-s*s*40.)*3.*far1*open;
  alb *= mix(vec3(1.), vec3(.975, .968, .955), smoothstep(48., 48.2, arc)*(1. - smoothstep(60.6, 60.8, arc))*open);
  // the fairing
  float zin = smoothstep(${glf(HULL.FAIR_Z[0])}, ${glf(HULL.FAIR_Z[1])}, Pw.z)*(1. - smoothstep(${glf(HULL.FAIR_Z[2])}, ${glf(HULL.FAIR_Z[3])}, Pw.z));
  float fa = arc - ${glf(FAIR_ARC)}, on = smoothstep(.45, .55, zin), fw = smoothstep(0., .25, fa)*on;
  alb *= mix(vec3(1.), vec3(.925, .932, .955), fw); gloss *= mix(1., .5, fw);
  float fz = abs(Pw.z - ${glf((HULL.FAIR_Z[0] + HULL.FAIR_Z[1]) / 2)}) < abs(Pw.z - ${glf((HULL.FAIR_Z[2] + HULL.FAIR_Z[3]) / 2)}) ? Pw.z - ${glf((HULL.FAIR_Z[0] + HULL.FAIR_Z[1]) / 2)} : Pw.z - ${glf((HULL.FAIR_Z[2] + HULL.FAIR_Z[3]) / 2)};
  float fl = max(ruled(fa, .07, px)*on, ruled(fz, .07, px)*step(0., fa));
  float fd = length(vec2((fract(Pw.z/1.3) - .5)*1.3, fa - .55));
  alb *= 1. - (.5*fl + .3*((1. - smoothstep(.11, .11 + px, fd))*nearR + ruled(fa - .55, .06, px)*.3*(1. - nearR))*on)*open;
  shine += .5*ruled(fa + .13, .07, px)*on*open;
  // a door: gap, lit edge, doubler, grip, sill, gutter
  float grip = rrect(vec2(dz - 6.1, arc - 55.), vec2(.9, .42), .3);
  alb *= 1. - .55*clamp(ruled(door, .085, px) + ruled(grip, .05, px), 0., 1.) - .16*ruled(door - 1.1, .045, px);
  alb *= 1. - .25*(1. - smoothstep(-.06, .06, grip));
  shine += .55*ruled(door + .22, .07, px);
  float sill = 1. - smoothstep(-.05, .05 + px*.5, rrect(vec2(dz, arc - 73.95), vec2(9.7, .5), .2));
  alb = mix(alb, vec3(.6, .61, .65), sill); gloss = mix(gloss, 2.2, sill); shine += .9*ruled(arc - 73.42, .07, px)*step(abs(dz), 9.6);
  float gut = rrect(vec2(dz, arc - 36.9), vec2(9.7, 4.3), 3.4), cap = 1. - smoothstep(34.2, 35., arc);
  alb *= 1. - .35*ruled(gut - .1, .05, px)*cap; shine += .7*ruled(gut + .04, .07, px)*cap;
  return shine;
}`;
// the skin's own relief: joints, rivets, pillowing, doors, the far flank's painted windows.
// in: Pw, px. out: alb (albedo), gz, gs (the normal's tilt along and round the hull), gloss, glass (1 on a painted pane),
// shine (how much of the sun's own light a raised edge of the flank's dress throws back)
const SKIN_RELIEF = /* glsl */`
void relief(vec3 Pw, float px, out vec3 alb, out vec2 g, out float gloss, out float glass, out float shine){
  float ang = atan(-(Pw.x - uAxis.x), Pw.y - uAxis.y + 1e-5), arc = abs(ang)*uAxis.z;   // metres round from the crown, either flank
  float zf = (Pw.z + ${(-DM.WIN_Z - DM.PITCH / 4).toFixed(2)})/${(DM.PITCH / 2).toFixed(2)}, sf = arc/3.2;            // frames 7.8 m apart (a window sits between two), stringers 3.2 m
  vec2 cell = floor(vec2(zf, sf)), uv = fract(vec2(zf, sf));
  float far1 = 1. - smoothstep(.5, 2.2, px);
  alb = vec3(.88, .885, .89); gloss = 1.; glass = 0.;
  // pillowing: each panel bay a shallow cushion, and tilted a hair of its own
  g = (vec2(.5) - uv)*vec2(.05, .034)*(4.*uv.yx*(1. - uv.yx)) + (vec2(hash2(cell), hash2(cell + 7.3)) - .5)*.018;
  g *= far1;
  // joints: along the hull every fourth stringer (one over the windows, one under them), and round it every fourth
  // frame, staggered band by band
  float band = floor((sf + 1.)/4.), stag = .5*mod(band, 2.);
  float jz = (fract(zf/4. + stag) - .5)*31.2, js = (fract((sf - 1.)/4.) - .5)*12.8;
  // a door is one slab: no joint of the panels crosses it (dz: metres along the hull from the nearest door's middle)
  float dz = Pw.z - ${glf(DOORS[0])}; if (abs(Pw.z - ${glf(DOORS[1])}) < abs(dz)) dz = Pw.z - ${glf(DOORS[1])}; if (abs(Pw.z - ${glf(DOORS[2])}) < abs(dz)) dz = Pw.z - ${glf(DOORS[2])};
  float door = rrect(vec2(dz, arc - 53.4), vec2(8.5, 19.6), 2.6), open = smoothstep(-.1, .1, door);
  float jl = max(ruled(jz, .055, px), ruled(js, .055, px))*open;
  alb *= 1. - .5*jl; g += vec2(jz, js)*exp(-vec2(jz*jz, js*js)*30.)*2.2*far1*open;
  alb *= 1. + .022*(hash2(vec2(floor(zf/4. + stag), band)) - .5);
  // rivets: a row along every frame and every stringer, a dimple each 0.8 m
  float rv = 1. - smoothstep(.05, .22, px);
  if (rv > 0.){
    vec2 m = (uv - .5)*vec2(7.8, 3.2);                          // metres from the bay's middle
    vec2 e = vec2(3.9, 1.6) - abs(m);                           // metres to the frame line, to the stringer line
    vec2 rz = vec2(-sign(m.x)*e.x, (fract(m.y/.8) - .5)*.8), rs = vec2((fract(m.x/.8) - .5)*.8, -sign(m.y)*e.y);
    vec2 rr = dot(rz, rz) < dot(rs, rs) ? rz : rs; float d = length(rr);
    float dot_ = (1. - smoothstep(.07, .07 + px, d))*rv;
    alb *= 1. - .2*dot_; g += rr*dot_*3.;
  }
  // the flank's dress: doors with sill and gutter, the two belt seams, the wing root's fairing
  shine = dress(Pw, px, arc, dz, door, alb, g, gloss);
  // the far flank's windows of the straight run, where the cabin has none: a frame and a dark pane, as paint
  float kz = floor((Pw.z + ${(-DM.WIN_Z + DM.PITCH / 2).toFixed(2)})/${DM.PITCH.toFixed(2)});
  if (Pw.x > uAxis.x && kz >= uWinK.x && kz <= uWinK.y && (kz < uWinK.z || kz > uWinK.w)){
    vec2 wq = vec2(Pw.z - (kz*${DM.PITCH.toFixed(2)} + ${DM.WIN_Z.toFixed(2)}), Pw.y - ${DM.WIN_Y.toFixed(1)});
    float o = oval(wq), e = px/2.3 + .004, fr = 1. - smoothstep(1.3 - e, 1.3 + e, o);
    alb = mix(alb, vec3(.76, .77, .79), fr); g *= 1. - fr;
    g += wq/(length(wq) + 1e-3)*((1. - smoothstep(1.2, 1.3, o)) - (1. - smoothstep(1., 1.08, o)))*.35*fr*vec2(1., -1.);
    glass = 1. - smoothstep(1. - e, 1. + e, o);
  }
}`;

const SKIN_FRAG = SKIN_HEAD + SKIN_DRESS + SKIN_RELIEF + /* glsl */`
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-6, 0.)), V = normalize(cameraPosition - vP + vec3(0., 1e-6, 0.)), L = uSunDir;
  if (!gl_FrontFacing) N = -N;
  float px = length(fwidth(vP))*.7 + 1e-4, kind = vKind;
  vec3 alb = vec3(.86); vec2 g = vec2(0.); float gloss = 1., glass = 0., metal = 0., shine = 0.;
  // the window this place belongs to (its number along the hull), the place in that window's own plane, its oval
  float kw = floor((vP.z + ${(-DM.WIN_Z + DM.PITCH / 2).toFixed(2)})/${DM.PITCH.toFixed(2)});
  vec2 wq = vec2(vP.z - (kw*${DM.PITCH.toFixed(2)} + ${DM.WIN_Z.toFixed(2)}), vP.y - ${DM.WIN_Y.toFixed(1)}); float ov = oval(wq);
  if (kind < .5){
    relief(vP, px, alb, g, gloss, glass, shine);
    vec3 Tz = vec3(0., 0., 1.), Ts = cross(N, Tz); N = normalize(N + Tz*g.x + Ts*g.y + vec3(0., 1e-6, 0.));
  } else if (kind < 1.5){ alb = vec3(.75, .76, .78); gloss = 1.4; }                                  // a window's frame
  else if (kind < 2.5){ glass = 1.; }                                                                // a painted pane
  else if (kind < 3.5){ alb = vec3(.74, .68, .58); gloss = .15; }                                    // the passage through the skin
  else if (kind < 4.5){                                                                              // wing: ribs and spar lines
    float span = vP.x < uAxis.x ? -vP.x : vP.x - 2.*uAxis.x, zc = vP.z - max(span, 0.)*.4663;
    float ln = max(ruled((fract(span/19.2) - .5)*19.2, .07, px), ruled((fract(zc/30.) - .5)*30., .07, px));
    alb = vec3(.83, .84, .86)*(1. - .34*ln)*(1. + .04*(hash2(floor(vec2(span/19.2, zc/30.))) - .5)); gloss = 1.1;
  } else if (kind < 5.5){ alb = vec3(.86, .865, .87)*(1. - .45*ruled((fract(vP.z/11.) - .5)*11., .06, px)); } // pod
  else if (kind < 6.5){                                                                              // the fan in the pod's mouth, turning
    float cx = abs(vP.x - uPod.x) < abs(vP.x - uPod.w) ? uPod.x : uPod.w; vec2 q = vec2(vP.x - cx, vP.y - uPod.y);
    float rad = length(q), a = atan(q.y, q.x + 1e-5), bl = .5 + .5*sin(a*20. + rad*.3 + uTime*1.1);
    alb = mix(vec3(.015, .016, .02), vec3(.1, .105, .12), smoothstep(.3, .7, bl))*smoothstep(0., 3., rad); gloss = .4;
    alb = mix(vec3(.42, .43, .45), alb, smoothstep(4.6, 5.2, rad));
  } else if (kind < 7.5){ alb = vec3(.8, .79, .77); gloss = .3; }                                    // the dome: a matt blister
  else if (kind < 8.5){ alb = vec3(.8, .81, .83); gloss = .8; }                                      // an aerial's blade
  else if (kind < 9.5){ alb = vec3(.86, .865, .87)*(1. - .4*ruled((fract(vP.y/9.) - .5)*9., .06, px)); } // fin and tailplane
  else { alb = vec3(.6, .61, .64); metal = 1.; }                                                     // bare metal: a leading edge, a pod's lip
  float nl = dot(N, L), nv = clamp(dot(N, V), 0., 1.), sh = bodyShade(vP, L);
  float ws = wispShade(vP), sunD = clamp((nl + .06)/1.06, 0., 1.)*sh*(1. - .6*ws);
  vec2 lh = L.xz/max(length(L.xz), 1e-3), nh = N.xz;
  vec3 amb = mix(uGndCol*uLight.z, mix(uSkyCol, uFogCol, .3)*uLight.y, clamp(N.y*.5 + .5, 0., 1.));   // the sky's own light, warmed by its bright horizon
  amb += uFogCol*uLight.w*(1. - N.y*N.y)*(.3 + .7*clamp(dot(nh, lh), 0., 1.));
  amb *= .6 + .4*sh;
  // what the gloss mirrors: the sky from horizon to overhead, the cloud below, and the sun as three lobes
  vec3 R = reflect(-V, N); float up = R.y;
  vec3 skyR = mix(uFogCol*1.05, uSkyCol*.9, pow(clamp(up, 0., 1.), .55));
  skyR = mix(uGndCol*.7, skyR, smoothstep(-.14, .06, up));
  float sl = clamp(dot(R, L), 0., 1.), rh = clamp(dot(R.xz/max(length(R.xz), 1e-3), lh), 0., 1.);
  skyR += uSunCol*(rh*rh*rh*(1. - abs(up))*(1. - abs(up))*.55);                       // the horizon burns gold on the sun's side
  vec3 sunR = uSunCol*(pow(sl, 6.)*.9 + (pow(sl, 60.)*2.4 + pow(sl, 900.)*20.)*sh);
  // the lacquer's haze: a wide gold lobe as of a flatter roof, seen at a grazing angle toward the sun (the crown burns)
  vec3 Nb = normalize(N + vec3(0., 1.2*clamp(N.y, 0., 1.), 0.) + vec3(0., 1e-6, 0.)); float gb = 1. - clamp(dot(Nb, V), 0., 1.);
  vec3 hazeR = uSunCol*vec3(1., .8, .58)*(pow(clamp(dot(reflect(-V, Nb), L), 0., 1.), 4.)*gb*1.25*(.45 + .55*sh));     // a broad gold lobe; a tight one and the sun's glint, which a body's shadow cuts
  float fr = pow(1. - nv, 4.), F = mix(.05, 1., fr)*gloss;
  vec3 col = alb*(uSunCol*uLight.x*sunD + amb) + (skyR*.5 + sunR)*F + hazeR*min(gloss, 1.);
  col += (uSunCol*uLight.x*sunD*1.5 + amb*.6)*shine;             // a raised edge of the dress throws the low sun back
  // THE WINDOWS' WARM LIT REVEALS: the cabin's light on the inner rim of each of the cabin's own windows (the
  // passage through the skin glows, the frame's inner half takes its colour, a faint halo lies on the skin round
  // it); dimmer where the blinds are down (the dusk rows). By place: the same at every metre.
  if (kind < 3.5 && kw >= uWinK.z && kw <= uWinK.w && abs(wq.y) < 9.){
    float rim = kind > 2.5 ? 1. : kind > .5 ? 1. - smoothstep(1., 1.24, ov) : .22*(1. - smoothstep(1.28, 1.75, ov));
    rim *= mix(1., .55, step(uWarm.w, kw));
    col = mix(col, uWarm.rgb*(.85 + .4*smoothstep(-3.3, 3.3, -wq.y)), rim*.85);
  }
  if (metal > .5) col = alb*(skyR*1.1 + sunR*1.4 + uSunCol*uLight.x*sunD*.25);
  if (glass > 0.){
    // a dark pane: the sky mirrored, and a warm glint low in it as of a lit cabin behind
    // a painted pane (the windows beyond the cabin's own): a lit cabin behind glass, each window its own strength,
    // a pale blind drawn down some way in some (a fixed hash of the window's number and flank), the sky mirrored on it
    float h1 = hash2(vec2(kw, step(uAxis.x, vP.x)*7. + 3.)), h2 = hash2(vec2(kw + 31., step(uAxis.x, vP.x)*5. + 1.));
    float blind = smoothstep(-.12, .12, wq.y - (3.4 - 5.2*h2*step(.45, h2)));
    vec3 lit = uWarm.rgb*(.5 + .7*h1)*(.55 + .45*smoothstep(-3.3, 3.3, wq.y));
    lit = mix(lit, uWarm.rgb*vec3(1.05, 1.2, 1.45)*(.5 + .3*h1), blind);
    vec3 pane = lit + (skyR + sunR)*mix(.1, 1., fr);
    col = mix(col, pane, glass);
  }
  col *= mix(vec3(1.), vec3(.72, .77, .9), ws);                 // under a wisp the skin stands in the sky's cooler light
  // the air between: the far ends of the hull and the wings stand in the haze of the horizon
  float hz = max(1. - exp(-vDist*uFogDen*5.), 1. - exp(-uFogDen*uFogDen*vDist*vDist));
  col = mix(col, uFogCol, hz);
  gl_FragColor = vec4(col, 1.);
}`;

// the bodies that throw a drawn shadow on the skin: the crown otter, the two aerials, the wing otter (capsules, by
// the plan's places; the wing otter's three are the plan's WING_OTTER.SHADE and go with its slide), and the dome.
// E.crownShade (an option): the crown otter's capsules for another pose, each [ax, ay, az, bx, by, bz, r] in the
// animal's OWN space (as the three below, which are the belly pose's: tail, trunk, head); E.crown: its seat
// ({ position, yaw }) when it is not the plan's OUTSIDE.CROWN. Three capsules at the most (eight in all).
const CROWN_SHADE = [[0, 0.7, -10.2, 0, 0.9, -3.5, 0.75], [0, 1.9, -3.5, 0, 2.0, 8.6, 2.0], [0, 2.0, 8.6, 0, 1.9, 12.2, 1.75]];
function shadowCapsules(E = {}) {
  const out = [], O = P.OUTSIDE, cap = (sit, a, b, r) => out.push({ a: P.ownToCabin(sit, a, 1), b: P.ownToCabin(sit, b, 1), r });
  for (const c of (E.crownShade || CROWN_SHADE).slice(0, 3)) cap(E.crown || O.CROWN, [c[0], c[1], c[2]], [c[3], c[4], c[5]], c[6]);
  for (const [x, z] of O.AERIALS) out.push({ a: [x, P.skinY(x) - 0.2, z - 0.5], b: [x, P.skinY(x) + O.AERIAL_H - 0.4, z + 0.7], r: 0.5 });
  for (const c of O.WING_OTTER.SHADE.slice(0, 3)) cap(O.WING_OTTER, [c[0], c[1], c[2]], [c[3], c[4], c[5]], c[6]);   // the slider at the top of its slide; the world moves these three by its clock (the handle's setShade)
  return out;
}
const POD = { OUT: P.OUTSIDE.WING.POD_OUT, Y: -30, Z: [-58, 14], R: 21 };
function skinMaterial(E, side) {
  const warm = new THREE.Color(E.windowGlow || '#ffa55a');                       // the cabin's own light, as its windows' rims show it
  const caps = shadowCapsules(E), A = [], B = [], dc = P.OUTSIDE.DOME.centre, ds = P.OUTSIDE.DOME.size, dim = E.look === 'AFTERGLOW';
  for (let i = 0; i < NCAP; i++) { const c = caps[i]; A.push(c ? new THREE.Vector4(c.a[0], c.a[1], c.a[2], c.r) : new THREE.Vector4(0, -1e4, 0, 1)); B.push(c ? new THREE.Vector4(c.b[0], c.b[1], c.b[2], 1) : new THREE.Vector4(0, -1e4, 1, 0)); }
  const uniforms = {
    uSunDir: { value: E.sunDir }, uSunCol: { value: v3(E.sunColor) }, uSkyCol: { value: v3(E.skyColor) }, uGndCol: { value: v3(E.groundColor) }, uFogCol: { value: v3(E.fogColor) },
    uFogDen: { value: E.fogDensity }, uTime: { value: 0 }, uAxis: { value: new THREE.Vector3(AX, AY, HR) }, uPod: { value: new THREE.Vector4(-POD.OUT, POD.Y, POD.Z[0], DM.CABIN_W + POD.OUT) },
    uCapA: { value: A }, uCapB: { value: B }, uDomeC: { value: new THREE.Vector4(dc[0], dc[1] - 0.4, dc[2], 1) }, uDomeR: { value: new THREE.Vector4(ds[0] / 2, ds[1] + 0.4, ds[2] / 2, 0) },
    uWarm: { value: new THREE.Vector4(warm.r, warm.g, warm.b, P.CABIN.DUSK_ROW) },
    uLight: { value: new THREE.Vector4(dim ? 1.05 : 1.2, 0.5, 0.36, 0.2) }, uWinK: { value: new THREE.Vector4(HULL.WIN_K[0], HULL.WIN_K[1], P.CABIN.BAY[0], P.CABIN.ROW1) },
  };
  return new THREE.ShaderMaterial({ uniforms, vertexShader: SKIN_VERT, fragmentShader: SKIN_FRAG, side });
}
const skinHandle = (geometry, E, side, name) => {
  const material = skinMaterial(E, side), mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.name = name;
  const A = material.uniforms.uCapA.value, B = material.uniforms.uCapB.value;
  return { object: mesh, material, triangles: geometry.userData.triangles, update(dt, time) { material.uniforms.uTime.value = time; },
    // setShade(k, a, b, r): the slider's k-th capsule (0 to 2: the skin's last three) from a to b (THREE.Vector3, cabin space); uniforms only
    setShade(k, a, b, r) { A[NCAP - 3 + k].set(a.x, a.y, a.z, r); B[NCAP - 3 + k].set(b.x, b.y, b.z, 1); } };
};

// 1. THE HULL (contract: await makeHull(E)). Drawn from outside only: from inside the cabin its skin is never seen.
export function hullGeometry() { const it = hullSteps(); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
export async function makeHull(E) {
  const it = hullSteps(); let r = it.next();
  while (!r.done) { await E.pause(); r = it.next(); }
  return skinHandle(r.value, E, THREE.FrontSide, 'otter-hull');
}

// ------------------------------------------------------------------------------------------------------------------
// 2. WINGS, PODS, TAIL (contract: await makeWings(E)); one mesh. A wing is a slab: its UPPER FACE IS FLAT from the
// leading edge's line back over three fifths of the chord and lies exactly in the plan's face (root at x 0, y -8,
// z -60 to 80; swept 25 degrees, rising 5, 340 m to the tip): the wing otter sits on it. Ahead of that line a
// rounded nose of bare metal; behind, the face falls to a thin trailing edge. The far wing is the same in fewer
// stations. One pod hangs under each wing 115 m out (a bare lip, a fan turning in its mouth by the clock), on a
// pylon. A swept fin and two tailplanes stand on the tail cone. Seen from both sides (no face is culled).
// ------------------------------------------------------------------------------------------------------------------
const WING = { TH: 0.11, FLAT: 0.62, NOSE: 0.16, IN: 14 };
function wingProfile(chord) {
  const th = WING.TH * chord, rn = WING.NOSE * th, up = [], nose = [], low = [];
  for (const f of [1, 0.9, 0.78, WING.FLAT, 0.3, 0]) up.push([f * chord, f > WING.FLAT ? -0.55 * th * Math.pow((f - WING.FLAT) / (1 - WING.FLAT), 1.6) : 0]);
  for (let k = 0; k <= 6; k++) { const a = (k / 6) * PI; nose.push([-1.4 * rn * Math.sin(a), -rn * (1 - Math.cos(a))]); }
  for (const f of [0, 0.08, 0.2, 0.35, 0.55, 0.78, 1]) {
    const y = f <= 0.35 ? -(2 * rn + (th - 2 * rn) * Math.sin((PI / 2) * (f / 0.35))) : -th + (th - 0.55 * th - 0.25) * Math.pow((f - 0.35) / 0.65, 1.3);
    low.push([f * chord, y]);
  }
  return { up, nose, low, th };
}
// a wing's section s metres out from its root plane (under 0: inside the hull): the leading edge's z, the upper face's y, the chord
function wingAt(s) {
  const G = P.OUTSIDE.WING, o = Math.max(s, 0), c0 = G.ROOT_Z[1] - G.ROOT_Z[0];
  return { z: G.ROOT_Z[0] + o * Math.tan(G.SWEEP * D2R), y: G.ROOT_Y + o * Math.tan(G.RISE * D2R), chord: c0 + (G.TIP_CHORD - c0) * (o / G.SPAN) };
}
function* wingSteps() {
  const M = mesher(), W = DM.CABIN_W, G = P.OUTSIDE.WING;
  for (const side of [0, 1]) {
    const X = (x) => (side ? W - x : x);
    const spans = side ? [-WING.IN, 0, 60, 115, 200, 280, G.SPAN] : [-WING.IN, 0, 20, 40, 60, 90, 115, 140, 180, 230, 290, G.SPAN];
    const U = [], N = [], Lw = [];
    for (const s of spans) {
      const q = wingAt(s), pr = wingProfile(q.chord), at = (p) => [X(-s), q.y + p[1], q.z + p[0]];
      U.push(pr.up.map(at)); N.push(pr.nose.map(at)); Lw.push(pr.low.map(at));
    }
    M.grid(U, K.WING); M.grid(N, K.EDGE); M.grid(Lw, K.WING);
    { const e = spans.length - 1, loop = [...U[e], ...N[e].slice(1, -1), ...Lw[e]], q = wingAt(G.SPAN); M.fan([X(-G.SPAN - 0.6), q.y - 1.5, q.z + q.chord * 0.45], loop, K.WING); }
    yield;
    // the pod: a body of revolution about a line along z, 115 m out and well under the wing; its lip bare metal
    const px = X(-POD.OUT), ring = (z, r) => { const row = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; row.push([px + r * Math.cos(a), POD.Y + r * Math.sin(a), z]); } return row; };
    const z0 = POD.Z[0], z1 = POD.Z[1], R = POD.R;
    M.grid([ring(z0 + 5, R - 4.2), ring(z0 + 1.2, R - 3.6), ring(z0, R - 2.4), ring(z0 + 1.4, R - 1.2), ring(z0 + 5, R - 0.5)], K.EDGE, true);
    M.grid([ring(z0 + 5, R - 0.5), ring(z0 + 18, R), ring(z0 + 38, R), ring(z0 + 56, R - 2.5), ring(z1, R - 6.5), ring(z1 - 3, R - 9)], K.POD, true);
    M.grid([ring(z1 - 3, R - 9), ring(z1 + 6, R - 12), ring(z1 + 20, 0.3)], K.EDGE, true);
    M.fan([px, POD.Y, z0 + 2.5], ring(z0 + 5, R - 4.2), K.INLET);
    // the pylon: a slab from the pod's back up into the wing's underside
    { const q = wingAt(POD.OUT), top = q.y - 2.5, pz0 = q.z - 26, pz1 = q.z + 30, hw = 1.6, rows = [];
      for (const [y, a, b] of [[POD.Y + R - 2, pz0 + 6, pz1], [top, pz0 + 22, pz1 + 8]]) rows.push([[px - hw, y, a], [px, y, a - 3], [px + hw, y, a], [px + hw, y, b], [px, y, b + 2], [px - hw, y, b]]);
      M.grid(rows, K.POD, true); }
    yield;
  }
  // the fin and the two tailplanes: swept slabs of a lens section, on the tail cone
  const Z1 = P.CABIN.HULL_Z[1], top = (z) => { const [r, cy] = hullSection(z); return cy + r; };
  slab(M, { p: [AX, top(Z1 - 100) - 4, Z1 - 100], chord: 92, t: 3.6, n: [1, 0, 0] }, { p: [AX, top(Z1 - 100) + 112, Z1 - 100 + 94], chord: 36, t: 1.5, n: [1, 0, 0] }, K.TAIL);
  for (const sgn of [-1, 1]) { const [r, cy] = hullSection(Z1 - 62); slab(M, { p: [AX + sgn * (r - 6), cy + 2, Z1 - 84], chord: 62, t: 2.6, n: [0, 1, 0] }, { p: [AX + sgn * (r + 128), cy + 16, Z1 - 84 + 76], chord: 24, t: 1.1, n: [0, 1, 0] }, K.TAIL); }
  yield;
  return M.done('otter-wings');
}
export function wingGeometry() { const it = wingSteps(); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
export async function makeWings(E) {
  const it = wingSteps(); let r = it.next();
  while (!r.done) { await E.pause(); r = it.next(); }
  return skinHandle(r.value, E, THREE.DoubleSide, 'otter-wings');
}

// a swept slab of a lens section between two stations (a fin, a tailplane, an aerial's blade), its far end closed.
// root, tip: { p: [x, y, z] of the leading edge, chord (along z), t: half thickness, n: [x, y, z] the way it is thick }
function slab(M, root, tip, kind) {
  const sec = (q) => [0, 0.06, 0.3, 0.7, 1, 0.7, 0.3, 0.06].map((f, i) => { const w = (i === 0 || i === 4 ? 0 : i === 1 || i === 7 ? 0.6 : 1) * q.t * (i > 4 ? -1 : 1); return [q.p[0] + q.n[0] * w, q.p[1] + q.n[1] * w, q.p[2] + f * q.chord + q.n[2] * w]; });
  const b = sec(tip); M.grid([sec(root), b], kind, true);
  M.fan([tip.p[0], tip.p[1], tip.p[2] + tip.chord * 0.5], b, kind);
}

// 3. THE DOME (contract: makeDome(E)): a smooth blister on the crown, the plan's 30 x 14 x 5 m about (36.4, 52.4, -135).
// It sits ON the curved skin (its foot follows the crown's fall to either hand) with a soft skirt round its foot.
export function domeGeometry() {
  const M = mesher(), O = P.OUTSIDE.DOME, cx = O.centre[0], cz = O.centre[2], rx = O.size[0] / 2 - 0.35, rz = O.size[2] / 2 - 0.75, ry = O.size[1] + 0.4, rows = [], NL = 28;
  const at = (lat, k) => { const row = []; for (let i = 0; i < NL; i++) { const a = (i / NL) * TAU, x = cx + rx * k * Math.cos(lat) * Math.cos(a); row.push([x, P.skinY(x) - 0.4 + ry * Math.sin(lat), cz + rz * k * Math.cos(lat) * Math.sin(a)]); } return row; };
  rows.push(at(0, 1.05).map((p) => [p[0], p[1] + 0.3, p[2]]), at(0.05, 1.02));
  for (const lat of [0.16, 0.34, 0.55, 0.78, 1.02, 1.26, 1.45]) rows.push(at(lat, 1));
  M.grid(rows, K.DOME, true);
  M.fan([cx, P.skinY(cx) - 0.4 + ry, cz], at(1.45, 1), K.DOME);
  return M.done('otter-dome');
}
export function makeDome(E) { return skinHandle(domeGeometry(), E, THREE.DoubleSide, 'otter-dome'); }

// THE TWO BLADE AERIALS (contract: makeAerials(E)): plain swept blades 6 m tall at the plan's two places, each on a
// small foot plate; they stay inside the plan's own boxes but for the plate, which lies flat on the skin.
export function aerialGeometry() {
  const M = mesher(), O = P.OUTSIDE;
  for (const [x, z] of O.AERIALS) {
    const y0 = P.skinY(x);
    slab(M, { p: [x, y0 - 0.3, z - 1.15], chord: 2.3, t: 0.36, n: [1, 0, 0] }, { p: [x, y0 + O.AERIAL_H - 0.05, z - 0.1], chord: 1.25, t: 0.14, n: [1, 0, 0] }, K.AERIAL);
    const plate = (r, dy) => { const row = []; for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU, px = x + r * 0.62 * Math.cos(a); row.push([px, P.skinY(px) + dy, z + r * 1.9 * Math.sin(a)]); } return row; };
    M.grid([plate(1.0, 0.02), plate(0.9, 0.14)], K.FRAME, true); M.fan([x, y0 + 0.14, z], plate(0.9, 0.14), K.FRAME);
  }
  return M.done('otter-aerials');
}
export function makeAerials(E) { return skinHandle(aerialGeometry(), E, THREE.DoubleSide, 'otter-aerials'); }

// ------------------------------------------------------------------------------------------------------------------
// 4. THE ARCS (contract: makeArcs(E, { standing, frames })): three kinds in one shader, one mesh, one draw.
// Every arc is a fan of a circle about a place, in the plane square to a unit direction, its middle toward a given
// up as far as that plane allows; drawn as a ribbon that faces the lens, so that it shows at any angle.
//   standing sets (the dome's, the hero's lid's): always lit, at full strength, the same at every metre flown
//   the pulses: six frames (two pulses of three arcs) handed by the world every frame through setFrame
// A saturated blue core inside a darker blue edge, laid over what lies behind (it holds against a cream ceiling and
// a gold sky; nothing here is additive). All three arcs of a set are lit together, none switched off to show a strength (near the lens one can stand while its fellows are closed by their own fit); a brightening runs up them by the
// world's clock. It writes no depth: a medium with no skin. No point stands under any arcs.
// AN ARC IS NEVER SEEN HALF-FADED (the lead's ruling D1: a pale see-through arc beside a solid one read as a glitch).
// EVERY FRAGMENT THAT LEAVES THE SHADER HAS THE ONE OPACITY, 0.95, AND ITS FULL COLOUR: the ribbon's drawn shape IS
// its triangles (its edge is the triangles' own edge, smoothed by the picture's antialiasing), and no law multiplies
// its alpha or pales its colour. What used to fade an arc now SHAPES it, in the vertex law, by ONE share 0..1:
//   the WHOLE arc's share = its pulse's strength to the power 0.6 (a standing set: 1) times its fit in the picture
//   (FIT, below); at a place of the ribbon that share times the lens's nearness (NEAR, or the plan's THIN for an
//   indoor sign) times the skin's law (SKIN).
//   - ITS WIDTH is the share of its full width there, and never under the floor of MINPX pixels to either hand of
//     its middle WHILE THE SHARE IS OVER `CUT` (a hair that does not shimmer); at or under CUT it is nought.
//   - ITS SWEEP OPENS FROM A LEAST SHARE OF ITS FAN: the fan's half angle is MIN of its full half angle at CUT and
//     grows by the smoothstep of the whole arc's share from CUT to SWEEP: an arc comes on as a short hair-thin ARC
//     (three tenths of its fan, never a dot or a dash) that lengthens and thickens, and goes out the same way back.
// AN ARC ENDS IN A POINT OF ITS OWN BLUE: over the last quarter of each half of its fan the ribbon narrows and its
// dark edge goes over to the core's blue, and over the last tenth it runs to a point (a square end in the dark
// edge's colour stood as a mauve stub against a warm sky).
// TWO KINDS, BY PLACE: an arc whose set stands inside the hull's own space (the hero's lid's) is an INDOOR sign and
// narrows with the true distance from the lens between the plan's ARCS.THIN's two figures. Every other arc
// (the dome's set, the pulses) is an OUTDOOR arc, and three laws of place hold it:
//   - NOT DRAWN INSIDE THE HULL: a fragment whose place lies inside the hull's section (hullOut: the skin's own law)
//     or within SKIN[0] metres outside it is dropped (a cut, not a fade), and the ribbon's width comes in over SKIN[1]
//     metres outside the skin: no large arc cuts through the cabin's ceiling, walls or floor.
//   - OVER THE WINDOW LINE BEFORE THE ENTERED WINDOW: in a zone of the sun flank about the entered window and the
//     windows beside it (ZONE: from the skin out to x -32, eased to x -46; 1.5 units of z either hand, eased over 6 m)
//     an arc is lifted whole, by its own middle's place, until its two ends stand over a line that lies 1.2 m over the
//     window frames' tops at the skin and rises two fifths of a metre a metre out from it: no arc stands between the
//     coming eye and the window it enters by, its otter, or the windows beside it.
//   - A MEDIUM NEAR THE LENS (a declared read of the lens's place): its ribbon narrows away between NEAR's two
//     distances from the lens (16 m and 6 m), and a whole arc narrows and closes (to MIN of its fan) as the lens comes nearer its middle
//     than FIT[1] times its radius, toward nothing at FIT[0] times (2.9 and 2.1; by CUT it is gone at about 2.2: an
//     arc nearer than that cannot stand whole in the picture), so that none is a giant band cut by the frame's edge.
// ------------------------------------------------------------------------------------------------------------------
const ARC_SEG = 40, ARC_MINPX = 2.2;
export const arcHalf = (r) => 0.1 + 0.03 * r;                   // half a ribbon's width in metres, by its arc's radius (a third thinner than first built)
// CUT: the share at or under which nothing of a ribbon is drawn; SWEEP: the whole arc's share from which its fan is
// whole; MIN: the least share of its fan a drawn arc sweeps (an arc is first and last seen as a short thin ARC, never
// as a dot or a dash); EDGE: the drawn half width as a share of the laid one (the old soft edge's half-way line: a ribbon looks as
// wide as it did); OPACITY: the one alpha every drawn fragment has
export const ARCLAW = { NEAR: [6, 16], FIT: [2.1, 2.9], SKIN: [0.25, 1.5], TAPER: 0.24, TIP: 0.1, CUT: 0.06, SWEEP: 0.7, MIN: 0.3, EDGE: 0.88, OPACITY: 0.95,
  ZONE: { X: [-46, -32], UNITS: 1.5, SOFT: 6, OVER: 1.2, RISE: 0.4 } };
// the share of its full half fan a whole arc sweeps, by the whole arc's share (the vertex law, in script)
export const arcSweep = (whole) => ARCLAW.MIN + (1 - ARCLAW.MIN) * sstep(ARCLAW.CUT, ARCLAW.SWEEP, whole);
// the line an arc's ends keep over in the zone, x metres of cabin space (the skin there stands at skinX(the line))
const arcLine = () => { const y0 = DM.WIN_Y + 1.3 * DM.WIN_H / 2 + ARCLAW.ZONE.OVER; return [y0, ARCLAW.ZONE.RISE, skinX(y0)]; };
// how far an arc whose middle stands at (x, y, z), of radius r and half fan `half` (radians), is lifted (the vertex law, in script)
export function arcLift(x, y, z, r, half = (P.ARCS.FAN * D2R) / 2) {
  const Zn = ARCLAW.ZONE, [y0, rise, sx] = arcLine(), wz = winZ(P.WINDOW.UNIT);
  const zone = sstep(Zn.X[0], Zn.X[1], x) * (1 - sstep(sx, sx + 4, x)) * (1 - sstep(Zn.UNITS * DM.PITCH, Zn.UNITS * DM.PITCH + Zn.SOFT, Math.abs(z - wz)));
  return Math.max(y0 + rise * Math.max(sx - x, 0) - (y + Math.cos(half) * r), 0) * zone;
}
const ARC_VERT = (n) => /* glsl */`
attribute vec3 aArc;                                     // x: along the fan -1..1, y: -1 | 1 across, z: which arc
uniform vec4 uA[${n}], uB[${n}], uG[${n}], uU[${n}];     // (place, radius) (unit direction, strength) (half fan, half width, step, 1 for an indoor sign) (up, 0)
uniform float uPix; uniform vec4 uZone; uniform vec3 uLine; uniform vec2 uFit, uThin, uNear, uSkin;   // (x where the zone begins, x where it is whole, the entered window's z, its half length) (the line at the skin, its rise a metre out, the skin's x)
varying vec3 vArc, vP; varying vec2 vIn;                 // (1 for an indoor sign, the arc's step in its set)
${HULL_GLSL}
void main(){
  int id = int(aArc.z + .5);
  vec4 A = uA[id], B = uB[id], G = uG[id];
  vec3 t = B.xyz, up = uU[id].xyz, C = A.xyz;
  // the zone before the entered window (outdoor arcs): the whole arc is lifted, by its middle's place, over the line
  float zone = smoothstep(uZone.x, uZone.y, C.x)*(1. - smoothstep(uLine.z, uLine.z + 4., C.x))*(1. - smoothstep(uZone.w, uZone.w + ${glf(ARCLAW.ZONE.SOFT)}, abs(C.z - uZone.z)));
  C.y += max(uLine.x + uLine.y*max(uLine.z - C.x, 0.) - (C.y + cos(G.x)*A.w), 0.)*zone*(1. - G.w);
  vec3 m = up - t*dot(up, t); float ml = length(m); m = ml > 1e-3 ? m/ml : vec3(1., 0., 0.);
  vec3 s = cross(m, t);
  // HOW MUCH OF THE WHOLE ARC STANDS (0..1): its pulse's strength and, out of doors, its fit in the picture (the lens
  // to its middle, in its own radii). Its sweep opens from MIN of its fan by that share; nothing of it is ever made pale.
  float dc = length((viewMatrix*vec4(C, 1.)).xyz);
  float whole = pow(clamp(B.w, 1e-5, 1.), .6)*mix(smoothstep(uFit.x*A.w, uFit.y*A.w, dc), 1., G.w);
  float phi = aArc.x*G.x*mix(${glf(ARCLAW.MIN)}, 1., smoothstep(${glf(ARCLAW.CUT)}, ${glf(ARCLAW.SWEEP)}, whole));
  vec3 radial = m*cos(phi) + s*sin(phi), tang = s*cos(phi) - m*sin(phi), wc = C + radial*A.w;
  vec4 mv = viewMatrix*vec4(wc, 1.);
  vec3 tv = (viewMatrix*vec4(tang, 0.)).xyz;
  float dist = max(length(mv.xyz), 1e-3);
  vec3 side = cross(tv, mv.xyz/dist); float sl = length(side); side = sl > 1e-3 ? side/sl : vec3(0., 1., 0.);
  // how much of the ribbon stands AT THIS PLACE: the whole arc's share, the lens's nearness (an indoor sign: the
  // plan's THIN) and, out of doors, the skin's law. It is the share of the ribbon's full WIDTH here.
  float here = whole*mix(smoothstep(uNear.x, uNear.y, dist)*smoothstep(uSkin.x, uSkin.y, hullOut(wc)), smoothstep(uThin.x, uThin.y, dist), G.w);
  // the ribbon narrows over the last quarter of each half of its fan and runs to a point over the last tenth; it is
  // never under the floor of pixels while its share is over CUT, and nought at or under it
  float e = 1. - abs(aArc.x);
  float hw = here > ${glf(ARCLAW.CUT)} ? max(G.y*mix(.1, 1., smoothstep(0., ${glf(ARCLAW.TAPER)}, e))*here, uPix*dist*${ARC_MINPX.toFixed(1)}) : 0.;
  hw *= aArc.y*${glf(ARCLAW.EDGE)}*min(e*${glf(1 / ARCLAW.TIP)}, 1.);
  mv.xyz += side*hw;
  vP = wc + (side*mat3(viewMatrix))*hw;                  // the fragment's own place (the view's turn taken off the offset)
  vArc = aArc; vIn = vec2(G.w, G.z);
  gl_Position = B.w > .002 ? projectionMatrix*mv : vec4(2., 2., 2., 1.);
}`;
const ARC_FRAG = /* glsl */`
precision highp float;
uniform float uTime; uniform vec3 uCore, uEdge, uTip; uniform vec2 uSkin;
varying vec3 vArc, vP; varying vec2 vIn;
${HULL_GLSL}
void main(){
  float a = abs(vArc.y)*${glf(ARCLAW.EDGE)}, core = 1. - smoothstep(.36, .56, a);  // across the ribbon, in shares of its laid half width
  float e = 1. - abs(vArc.x), point = smoothstep(0., ${glf(ARCLAW.TAPER)}, e);      // 0 at an end, 1 over the fan's middle
  float run = .66 + .34*sin(uTime*1.5 - vIn.y*1.25);     // the brightening that runs up the three
  vec3 col = mix(uTip, mix(uEdge, uCore*run, core), point);                       // toward its point: the core's own blue alone
  // NOT DRAWN INSIDE THE HULL (out of doors): a cut by the fragment's own place, not a fade
  float keep = mix(step(uSkin.x, hullOut(vP)), 1., step(.5, vIn.x));
  if (keep < .5) discard;
  // THE ONE OPACITY: no strength, no nearness, no edge and no tip multiplies it; the ribbon's shape is its triangles
  gl_FragColor = vec4(col, ${glf(ARCLAW.OPACITY)});
}`;
export function makeArcs(E, o = {}) {
  const sets = o.standing || [], frames = o.frames ?? 6, first = sets.length * 3, n = first + frames;
  const A = [], B = [], G = [], U = [], V4 = THREE.Vector4, unit = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  for (const s of sets) for (let j = 0; j < 3; j++) {
    const t = unit(s.normal), up = unit(s.up || [0, 1, 0]), r = s.radii[j];
    A.push(new V4(s.centre[0], s.centre[1], s.centre[2], r)); B.push(new V4(t[0], t[1], t[2], 1));
    // a set whose middle stands inside the hull's own space is an indoor sign (by place; s.indoor says it outright)
    const indoor = s.indoor ?? (hullOutside(s.centre[0], s.centre[1], s.centre[2]) < 0);
    G.push(new V4(((s.fan ?? 100) * D2R) / 2, arcHalf(r), j, indoor ? 1 : 0)); U.push(new V4(up[0], up[1], up[2], 0));
  }
  for (let i = 0; i < frames; i++) { A.push(new V4(0, -1e4, 0, 1)); B.push(new V4(1, 0, 0, 0)); G.push(new V4((P.ARCS.FAN * D2R) / 2, arcHalf(1), i % 3, 0)); U.push(new V4(0, 1, 0, 0)); }
  const arc = new Float32Array(n * (ARC_SEG + 1) * 2 * 3), idx = []; let v = 0;
  for (let id = 0; id < n; id++) for (let i = 0; i <= ARC_SEG; i++) {
    for (const e of [-1, 1]) { arc[v * 3] = (i / ARC_SEG) * 2 - 1; arc[v * 3 + 1] = e; arc[v * 3 + 2] = id; v++; }
    if (i < ARC_SEG) { const q = v - 2; idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(v * 3), 3)); g.setAttribute('aArc', new THREE.BufferAttribute(arc, 3)); g.setIndex(idx);
  const core = new THREE.Color(P.ARCS.COLOUR), emis = (P.ARCS.EMISSIVE[0] + P.ARCS.EMISSIVE[1]) / 2;
  // o.indoors: true draws the pulses inside the hull too (as first built); o.near: [m, m] the outdoor arcs' thinning
  // near the lens; o.fit: [radii, radii] the whole arc's (false: none); o.zone: false leaves the arcs before the
  // entered window where the route puts them
  const Zn = ARCLAW.ZONE, line = arcLine(), near = o.near || ARCLAW.NEAR, skin = o.indoors ? [-2e4, -1e4] : ARCLAW.SKIN, fit = o.fit === false ? [-2, -1] : o.fit || ARCLAW.FIT;
  const material = new THREE.ShaderMaterial({
    uniforms: { uA: { value: A }, uB: { value: B }, uG: { value: G }, uU: { value: U }, uTime: { value: 0 },
      uPix: E.L.uniforms.uPix,
      uCore: { value: new THREE.Vector3(core.r, core.g, core.b).multiplyScalar(emis) }, uEdge: { value: new THREE.Vector3(0.012, 0.07, 0.42) },
      uTip: { value: new THREE.Vector3(core.r, core.g, core.b).multiplyScalar(1.15) },
      uThin: { value: new THREE.Vector2(P.ARCS.THIN[0], P.ARCS.THIN[1]) }, uNear: { value: new THREE.Vector2(near[0], near[1]) }, uSkin: { value: new THREE.Vector2(skin[0], skin[1]) },
      uZone: { value: new THREE.Vector4(o.zone === false ? 1e5 : Zn.X[0], o.zone === false ? 2e5 : Zn.X[1], winZ(P.WINDOW.UNIT), Zn.UNITS * DM.PITCH) },
      uLine: { value: new THREE.Vector3(line[0], line[1], line[2]) }, uFit: { value: new THREE.Vector2(fit[0], fit[1]) } },
    vertexShader: ARC_VERT(n), fragmentShader: ARC_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.name = 'otter-arcs'; mesh.renderOrder = 6;
  return {
    object: mesh, material, triangles: idx.length / 3,
    // frame i (pulse * 3 + arc): its place on the route, the route's unit direction there, its radius, its strength 0..1
    setFrame(i, px, py, pz, tx, ty, tz, radius, strength) {
      const k = first + i; if (i < 0 || k >= n) return;
      A[k].set(px, py, pz, radius); B[k].set(tx, ty, tz, strength); G[k].y = arcHalf(radius);
    },
    update(dt, time) { material.uniforms.uTime.value = time; },
  };
}

// ------------------------------------------------------------------------------------------------------------------
// 5. THE BILLOWS (contract: makeBillows(E, { centre, radius, top, hollows, field })): the soft top of a cloud that
// otters float on as if it were water. Two draws: a FLOOR (a low mounded disc: flat at the water line where a body
// lies, billowing up between and round them, sinking and melting away at its rim) and a ring of PUFFS that face the
// lens, of the kit's own cloud recipe (the same noise texture, the same law of light), so that the floor reads as
// the same cloud as the tower round it. centre: [x, y, z], y the level the otters' places stand on (the water line
// lies two metres over it: a floating body is sunk in it to its flanks); nothing here rises over `top` or stands further than `radius` from the centre in plan.
// The mounds are laid by a fixed hash (the same on every visit); they breathe and their grain drifts by the clock.
// body: true gives the top a belly under it (a cloud that stands alone in the sky; not the raft's, which lies on its tower).
// ------------------------------------------------------------------------------------------------------------------
const WATER = 2.0;                                       // the water line over the level of the otters' places
// THE RIM'S BAND (D3): from FROM of the radius out to an outline between EDGE's two shares of it (LOBES: how many
// lumps the outline has, about three times it); RINGS: rings of puffs for a small and a large top; a ring's puffs
// stand APART of their size apart; sizes IN (inside) to OUT (at the outline), metres at a large top
const BAND = { FROM: 0.6, EDGE: [0.8, 0.95], MELT: 0.05, LOBES: 2.3, RINGS: [4, 5], APART: 0.62, IN: 5.0, OUT: 2.6 };
// THE BELLY of a cloud that stands alone (o.body): its lowest point DEPTH under the water line, its rim RIM under it
// (where the top's own rim has sunk to), lumps up to LUMP high in it, RINGS rings of faces
const BELLY = { DEPTH: 7.7, RIM: 2.4, LUMP: 1.6, RINGS: 5 };
const hash1 = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
function vnoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z), fx = x - xi, fz = z - zi, ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  return (hash1(xi, zi) * (1 - ux) + hash1(xi + 1, zi) * ux) * (1 - uz) + (hash1(xi, zi + 1) * (1 - ux) + hash1(xi + 1, zi + 1) * ux) * uz;
}
// the floor's height over the water line and how much of a hollow lies here (0..1), at a place in plan
function billowAt(o, x, z) {
  const rho = Math.hypot(x - o.centre[0], z - o.centre[2]) / o.radius; let H = 0;
  for (const h of o.hollows || []) H = Math.max(H, 1 - sstep(h[2] * 0.9, h[2] * 1.6, Math.hypot(x - h[0], z - h[1])));
  const L = 0.55 * vnoise(x / 9.3, z / 9.3) + 0.3 * vnoise(x / 4.1 + 7.7, z / 4.1 + 3.1) + 0.15 * vnoise(x / 1.9, z / 1.9);
  const room = Math.max(0.4, o.top - 0.2 - (o.centre[1] + WATER));                 // what a mound may rise over the water line
  const y = (1 - H) * (0.22 + (room - 0.22) * sstep(0.28, 0.78, L) * sstep(0, 0.22, 1 - rho)) - 2.4 * sstep(0.7, 1, rho);
  return [y, H, rho];
}
const CLOUD_TONE = /* glsl */`
float cloudTone(vec3 n, float back, vec3 S){            // the kit's own large-scale light on a cloud (copied, so that both agree)
  float top = clamp(n.y, 0., 1.), ndl = dot(n, S);
  ndl *= ndl > 0. ? 1. : .55;
  return .56 + .62*ndl*(1. - .6*back) + .12*n.y - .12*back*(1. - .8*top) + .07*back*top;
}`;
const FLOOR_VERT = /* glsl */`
attribute vec2 aData;                                    // how much of a hollow, how far out to the rim (0..1)
uniform float uTime;
varying vec3 vP, vN; varying vec2 vData; varying float vDist;
void main(){
  vec3 p = position; p.y += .12*sin(uTime*.5 + p.x*.11 + p.z*.07)*(1. - aData.x);       // the mounds breathe; where a body lies the level is still
  vec4 w = modelMatrix*vec4(p, 1.); vP = w.xyz; vN = normal; vData = aData;
  vec4 mv = viewMatrix*w; vDist = length(mv.xyz);
  gl_Position = projectionMatrix*mv;
}`;
const FLOOR_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uNoise; uniform vec3 uSunDir, uSunColor, uLit, uShade, uBottom, uFogCol; uniform vec2 uLight; uniform float uTime, uSilver, uFogDen;
varying vec3 vP, vN; varying vec2 vData; varying float vDist;
${CLOUD_TONE}
void main(){
  vec2 q = vP.xz*.021 + uTime*vec2(.0016, .0011);
  float t0 = texture2D(uNoise, q).r, tx = texture2D(uNoise, q + vec2(.012, 0.)).r, tz = texture2D(uNoise, q + vec2(0., .012)).r;
  float fine = texture2D(uNoise, q*3.1 + 4.7).g, lump = mix(t0, fine, .3);
  vec3 N = normalize(vN + vec3(t0 - tx, 0., t0 - tz)*3.4*(1. - .6*vData.x) + vec3(0., 1e-5, 0.));
  vec3 V = normalize(vP - cameraPosition + vec3(0., 1e-6, 0.)); float mup = max(dot(V, uSunDir), 0.), back = mup*mup;
  float tone = max(cloudTone(N, back, uSunDir) - (.5 - lump)*.42 - .1*vData.x, uLight.x);   // troughs and hollows in their own shade
  vec3 col = mix(mix(uBottom, uShade, smoothstep(.2, .65, lump)), uLit, smoothstep(.08, .98, tone));
  col += uSunColor*uSilver*pow(mup, 10.)*.1*(.4 + .9*lump);
  float a = smoothstep(0., .26, (1. - vData.y) - (1. - lump)*.36*smoothstep(.35, 1., vData.y));  // the rim frays and melts away
  col = mix(col, uFogCol, 1. - exp(-uFogDen*uFogDen*vDist*vDist));
  gl_FragColor = vec4(col, a*.97);
}`;
// the colours and the sun the kit's field round it uses (the same uniform objects: a re-lit field re-lights these)
function cloudLight(E, field) {
  const fu = field.uniforms;
  return { uSunDir: fu.uSunDir, uSunColor: fu.uSunColor, uLit: fu.uLit, uShade: fu.uShade, uBottom: fu.uBottom, uLight: fu.uLight, uSilver: fu.uSilver,
    uNoise: { value: E.noise }, uFogCol: { value: v3(E.fogColor) }, uFogDen: { value: E.fogDensity } };
}

const PUFF_VERT = /* glsl */`
attribute vec4 iPos, iNrm;                               // (middle, radius) (the mound's own large normal, seed)
attribute vec2 iMix;                                     // (its share of the way out across the rim's band, spare)
uniform float uTime; uniform vec3 uSunDir; uniform vec2 uLight;
varying vec2 vUv, vOut, vMix; varying vec4 vLit, vMisc; varying vec3 vNrm; varying float vDist;
${CLOUD_TONE}
void main(){
  vec3 c = iPos.xyz; float seed = iNrm.w, size = iPos.w*(1. + .045*sin(uTime*.23 + seed*37.));
  vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  vec2 uv = position.xy*1.5; vUv = uv;
  vec4 mv = viewMatrix*vec4(c + (right*uv.x + up*uv.y)*size, 1.);
  gl_Position = projectionMatrix*mv; vDist = length(mv.xyz);
  float dist = distance(c, cameraPosition);
  vec3 V = (c - cameraPosition)/max(dist, 1e-3);
  float mu = dot(V, uSunDir), mup = max(mu, 0.), back = mup*mup;
  float sil = smoothstep(.4, .95, length(iNrm.xyz - V*dot(iNrm.xyz, V)));
  float mu6 = back*back*back, mu36 = mu6*mu6*mu6; mu36 *= mu36;
  float ang = size*projectionMatrix[1][1]/max(dist, 1.);
  vLit = vec4(size, (mu6*.24 + mu36*mu6*1.3)*(.12 + .88*sil), .215/pow(1.16 - .8*mu, 1.5)*(.1 + .9*sil), mix(1., .66, smoothstep(.08, .45, ang)));
  vMisc = vec4(seed, max(cloudTone(iNrm.xyz, back, uSunDir), uLight.x), smoothstep(size*.35, size*1.5, dist), 1. - .7*back);
  vNrm = iNrm.xyz; vOut = vec2(dot(iNrm.xyz, right), dot(iNrm.xyz, up)); vOut /= length(vOut) + .15; vMix = iMix;
}`;
const PUFF_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uNoise; uniform vec3 uSunDir, uSunColor, uLit, uShade, uBottom, uFogCol; uniform vec2 uLight; uniform float uTime, uSilver, uFogDen;
varying vec2 vUv, vOut, vMix; varying vec4 vLit, vMisc; varying vec3 vNrm; varying float vDist;
void main(){
  float r2 = dot(vUv, vUv), r = sqrt(r2), seed = vMisc.x, rim = vMix.x;
  vec4 t = texture2D(uNoise, vUv*.231 + seed*vec2(3.71, 9.17) + uTime*vec2(.0014, .0009));
  float lump = mix(t.r, t.g, .46), ero = lump*.95*(.25 + .75*r)*1.1, e = (1. - r) - ero;
  // A PUFF IS A SOFT LUMP OF THE CLOUD, NOT A DISC (D3): its edge runs out over half of its own radius and more
  // (nine tenths at the outline), so that no outline of a disc is left standing
  float a = smoothstep(0., mix(.5, .9, rim)*vLit.w, e)*(1. - smoothstep(.63, .75, max(abs(vUv.x), abs(vUv.y))))*vMisc.z;
  vec2 gn = vec2(dFdx(ero), dFdy(ero))/max(vec2(abs(dFdx(vUv.x)), abs(dFdy(vUv.y))), vec2(1e-5));
  gn = clamp(gn, -4., 4.);
  vec3 Nv = normalize(vec3(vUv*.5 + gn*.24, sqrt(max(1. - r2, 0.)) + .4)), N = (vec4(Nv, 0.)*viewMatrix).xyz;
  // a flat top lies open to the sky: a little lighter than a tower's flank between the hollows; at the rim its tone is the cloud's own
  float light = max(vMisc.y + .1*(1. - rim) + dot(N, uSunDir)*.2*vMisc.w - (lump - .5)*(.16 + .2*vMisc.w), uLight.x*.55);
  vec3 col = mix(mix(uBottom, uShade, smoothstep(-.5, .7, vNrm.y + N.y*.5)), uLit, smoothstep(.08, .98, light));
  float thin = 1. - smoothstep(0., .5, e);
  // (the light through a puff's thin edge drew every small puff's outline as a bright ring: a third of it between the hollows, a tenth at the rim)
  col += uSunColor*(uSilver*mix(.34, .1, rim)*((vLit.z*.56 + vLit.y)*thin*smoothstep(-.1, .75, dot(vUv, vOut)/(r + .05)) + vLit.y*.08));
  col = mix(col, uFogCol, 1. - exp(-uFogDen*uFogDen*vDist*vDist));
  if (a < .012) discard;
  gl_FragColor = vec4(col, a*mix(.82, .6, rim));           // thinner toward the outline: its colour runs into the cloud's behind it
}`;
export function makeBillows(E, o = {}) {
  const centre = o.centre || [0, 0, 0], radius = o.radius ?? 35, q = { centre, radius, top: o.top ?? centre[1] + 3, hollows: o.hollows || [] };
  const water = centre[1] + WATER, big = radius > 20, NR = big ? 16 : 9, NS = big ? 56 : 32, pos = [], nrm = [], data = [], idx = [], B = BAND;
  // THE LUMPY OUTLINE (D3), a share of the radius by the angle: the rim's band of puffs runs out to it, and the floor
  // (the top and the belly) melts away along it, MELT of the radius beyond (not along the circle of the radius)
  const outline = (ang) => B.EDGE[0] + (B.EDGE[1] - B.EDGE[0]) * vnoise(3.1 + 0.37 * radius + B.LOBES * Math.cos(ang), 7.7 + B.LOBES * Math.sin(ang));
  const melt = (ang, rho) => Math.min(1, rho / (outline(ang) + B.MELT));
  // o.body: A CLOUD THAT STANDS ALONE IN THE SKY HAS A BELLY (the window cloud, the rare one: seen from the side a
  // top with nothing under it is a sliver the colour of the sky behind it). A shallow lumpy bowl under the top, in
  // the same draw and laid BEFORE the top in the index (the top is drawn over it; no depth is written): its rim
  // meets the top's sunk rim and frays with it, its lowest point stands BELLY.DEPTH under the water line (within
  // the plan's 6 m under the otters' level), its faces look down and out and so stand in the cloud's own shade.
  if (o.body) {
    const NB = BELLY.RINGS, yb = (x, z) => { const rho = Math.min(1, Math.hypot(x - centre[0], z - centre[2]) / radius), f = 1 - rho * rho * rho; return water - BELLY.RIM - (BELLY.DEPTH - BELLY.RIM - BELLY.LUMP * vnoise(x / 6.1 + 2.7, z / 6.1 + 9.1)) * f; };
    for (let i = 0; i <= NB; i++) for (let s = 0; s < NS; s++) {
      const a = (s / NS) * TAU, rr = (i / NB) * radius * 0.998, x = centre[0] + rr * Math.cos(a), z = centre[2] + rr * Math.sin(a), d = 0.7;
      const nx = yb(x + d, z) - yb(x - d, z), nz = yb(x, z + d) - yb(x, z - d), l = Math.hypot(nx, 2 * d, nz);
      pos.push(x, yb(x, z), z); nrm.push(nx / l, (-2 * d) / l, nz / l); data.push(0, melt(a, rr / radius));
      if (i < NB) { const p = i * NS + s, p1 = i * NS + (s + 1) % NS; idx.push(p, p1, p + NS, p1, p1 + NS, p + NS); }
    }
  }
  const base = pos.length / 3;
  for (let i = 0; i <= NR; i++) for (let s = 0; s < NS; s++) {
    const a = (s / NS) * TAU, rr = (i / NR) * radius * 0.998, x = centre[0] + rr * Math.cos(a), z = centre[2] + rr * Math.sin(a), [h, H, rho] = billowAt(q, x, z), d = 0.7;
    const nx = billowAt(q, x - d, z)[0] - billowAt(q, x + d, z)[0], nz = billowAt(q, x, z - d)[0] - billowAt(q, x, z + d)[0], l = Math.hypot(nx, 2 * d, nz);
    pos.push(x, water + h, z); nrm.push(nx / l, (2 * d) / l, nz / l); data.push(H, melt(a, rho));
    if (i < NR) { const p = base + i * NS + s, p1 = base + i * NS + (s + 1) % NS; idx.push(p, p + NS, p1, p1, p + NS, p1 + NS); }
  }
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fg.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  fg.setAttribute('aData', new THREE.Float32BufferAttribute(data, 2)); fg.setIndex(idx);
  const light = cloudLight(E, o.field), uTime = { value: 0 };
  const floorMat = new THREE.ShaderMaterial({ uniforms: { ...light, uTime }, vertexShader: FLOOR_VERT, fragmentShader: FLOOR_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const floor = new THREE.Mesh(fg, floorMat); floor.frustumCulled = false; floor.name = 'otter-billow-floor'; floor.renderOrder = 3;
  // THE PUFFS, by a fixed hash; none over a hollow. A scatter of mounds between the hollows, and THE RIM (the lead's
  // ruling D3: no ring of separate discs): a BAND of many small puffs from 0.6 of the radius out to a LUMPY outline
  // (0.80 to 0.95 of it, by the angle), laid in rings: a ring's puffs stand 0.62 of their size apart and the rings
  // stand closer than a puff's reach, so every puff overlaps its neighbours on both hands and the ring inside it
  // (none stands alone outside the mass); sizes fall across the band from BAND.IN to BAND.OUT and are mixed by three
  // tenths either way. iMix.x is a puff's share of the way out (0 inside the band, 1 at the outline): the shader
  // softens its edge, thins it and takes its tone to the cloud's own by that share.
  const iPos = [], iNrm = [], iMix = [], sc = big ? 1 : 0.62;
  const put = (k, ang, rr, size, out) => {
    const x = centre[0] + rr * Math.cos(ang), z = centre[2] + rr * Math.sin(ang);
    for (const h of q.hollows) if (Math.hypot(x - h[0], z - h[1]) < h[2] * 1.3 + size * 0.5) return;
    const y = Math.min(q.top - 0.05 - 0.83 * size, water + billowAt(q, x, z)[0] + 0.5 - 0.3 * size), l = Math.hypot(rr / radius, 0.9);
    iPos.push(x, y, z, size); iNrm.push((Math.cos(ang) * rr) / radius / l, 0.9 / l, (Math.sin(ang) * rr) / radius / l, hash1(k, 3.7)); iMix.push(out, 0);
  };
  const n2 = Math.round(radius * 0.7), rings = big ? B.RINGS[1] : B.RINGS[0];
  for (let k = 0; k < n2; k++) { const size = (3.0 + 2.2 * hash1(k, 8.3)) * sc, rr = radius * 0.76 * Math.sqrt((k + 0.5) / n2); put(100 + k, k * 2.39996, rr, size, sstep(B.FROM, B.EDGE[0], rr / radius)); }
  for (let l = 0, k = 0; l < rings; l++) {
    const t = l / (rings - 1), size0 = (B.IN + (B.OUT - B.IN) * t) * sc, r0 = radius * (B.FROM + ((B.EDGE[0] + B.EDGE[1]) / 2 - B.FROM) * t), n = Math.ceil((TAU * r0) / (B.APART * size0));
    for (let i = 0; i < n; i++, k++) {
      const ang = ((i + 0.6 * hash1(k, 2.1) + 0.5 * (l & 1)) / n) * TAU, size = size0 * (0.7 + 0.6 * hash1(k, 1.3));
      const rr = radius * (B.FROM + (outline(ang) - B.FROM) * t) + (hash1(k, 5.9) - 0.5) * 0.5 * size0;
      put(400 + k, ang, Math.min(rr, radius - 0.85 * size), size, t);
    }
  }
  const pg = new THREE.InstancedBufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); pg.setIndex([0, 1, 2, 0, 2, 3]);
  pg.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(iPos), 4)); pg.setAttribute('iNrm', new THREE.InstancedBufferAttribute(new Float32Array(iNrm), 4));
  pg.setAttribute('iMix', new THREE.InstancedBufferAttribute(new Float32Array(iMix), 2));
  pg.instanceCount = iPos.length / 4;
  const puffMat = new THREE.ShaderMaterial({ uniforms: { ...light, uTime }, vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, transparent: true, depthWrite: false });
  const puffs = new THREE.Mesh(pg, puffMat); puffs.frustumCulled = false; puffs.name = 'otter-billow-puffs'; puffs.renderOrder = 4;
  const object = new THREE.Group(); object.name = 'otter-billows'; object.add(floor, puffs);
  return { object, floor, puffs, triangles: idx.length / 3 + (iPos.length / 4) * 2, update(dt, time) { uTime.value = time; } };
}

// ------------------------------------------------------------------------------------------------------------------
// 6. THE WISPS (contract: makeWisps(E, {})): thin streaks of cloud streaming aft over the roof and down the sun
// flank, by the world's clock: the thing that MOVES against the still white cliff and tells how fast the airliner
// flies. One instanced draw. A streak lies along the hull's axis and faces the lens across it; it comes in out of
// nothing far ahead of the nose side of the cabin and goes out to nothing far aft (no wrap is ever seen); it is thin
// air: it melts away near the lens, writes no depth and never hides a body. Laid by a fixed hash.
// THE ROOF'S CLEAR AIR (by place): no wisp is drawn in the air over the roof between the route's first metres and the
// crown group (CLEAR: a box in plan from 12 m behind the route's first point to 16 m past the dome and the crown
// otter on the sun's side, and from 20 m beyond the dome to 20 m beyond the otter's tail along the hull; a streak
// goes out over SOFT metres as it comes to the box and comes back beyond it). A sunlit streak between the eye and
// the roof's otter stood over it as a bright veil, and the animal read as a pale ghost from 60 m.
// THE HERO'S WINDOW'S LANE (by place, the same law, its own box): no wisp is drawn in the air outside the hero's
// own window through which the last leg's first metres see the cloud of two (LANE: in plan from the skin out past
// the furthest flank streak, and from FWD metres forward of the window's middle to AFT metres aft of it; a streak
// goes out over LANE.SOFT metres as it comes to it). A flank streak stood between that window and the two otters
// 200 m off as a bright veil over them (counted in ow-count-outside: no share of a wisp on those sight lines).
// ------------------------------------------------------------------------------------------------------------------
const WISP = { N: 40, Z: [-300, 330], FADE: 70, NEAR: [10, 46], SOFT: 16, FLANK: [9, 31], LANE: { OUT: 50, FWD: 4.4, AFT: 9, SOFT: 8 } };
// how much of a wisp is drawn at a place in plan (0 in the box, 1 from SOFT metres outside it): the fragment's law, in script
export function wispShare(x, z, box = wispClear(), soft = WISP.SOFT) { return sstep(0, soft, Math.max(box[0] - x, x - box[2], box[1] - z, z - box[3])); }
export const wispClear = () => { const O = P.OUTSIDE, d = O.DOME, c = O.CROWN.position;
  return [Math.min(c[0], d.centre[0]) - 16, d.centre[2] - d.size[2] / 2 - 20, P.ROUTE[0][0] + 12, c[2] + 28]; };   // [x0, z0, x1, z1]
// the hero's window's lane, [x0, z0, x1, z1] in plan, its soft edge, and the furthest x a flank streak's middle can lie at
export const wispLane = () => { const L = WISP.LANE, x = AX - HR, z = P.HERO.SEAT[0] * P.D.PITCH + P.D.WIN_Z; return [x - L.OUT, z - L.FWD, x, z + L.AFT]; };
export const WISP_LANE_SOFT = WISP.LANE.SOFT, WISP_FLANK_X = AX - (HR + HULL.SHOULDER + WISP.FLANK[1]);
const WISP_VERT = /* glsl */`
attribute vec4 iA, iB;                                   // (x, y, z at time 0, metres a second aft) (length, width, seed, strength)
uniform float uTime; uniform vec3 uSpan, uSunDir;
varying vec2 vUv, vXZ; varying vec4 vW;
void main(){
  float zz = mod(iA.z - uSpan.x + uTime*iA.w, uSpan.y);
  vec3 c = vec3(iA.x, iA.y + 1.2*sin(uTime*.31 + iB.z*40.), uSpan.x + zz);
  vec3 toC = c - cameraPosition; float dist = max(length(toC), 1e-3);
  vec3 side = cross(vec3(0., 0., 1.), toC/dist); float sl = length(side); side = sl > 1e-3 ? side/sl : vec3(0., 1., 0.);
  vec3 p = c + vec3(0., 0., position.x*iB.x) + side*(position.y*iB.y);
  vec4 mv = viewMatrix*vec4(p, 1.);
  gl_Position = projectionMatrix*mv; vUv = position.xy*2.;
  float ends = smoothstep(0., uSpan.z, zz)*(1. - smoothstep(uSpan.y - uSpan.z, uSpan.y, zz));
  float mup = max(dot(toC/dist, uSunDir), 0.);
  vW = vec4(length(mv.xyz), ends*iB.w, iB.z, mup*mup);
  vXZ = p.xz;                                             // the fragment's own place in plan (a streak is one long card)
}`;
const WISP_FRAG = /* glsl */`
precision highp float;
uniform sampler2D uNoise; uniform vec3 uLit, uShade, uSunColor, uFogCol; uniform vec2 uNear; uniform float uTime, uFogDen, uSoft, uLaneSoft; uniform vec4 uClear, uLane;
varying vec2 vUv, vXZ; varying vec4 vW;
void main(){
  float n = texture2D(uNoise, vec2(vUv.x*.07 + vW.z*7.3, vUv.y*.33 + vW.z*3.1)).r, m = texture2D(uNoise, vec2(vUv.x*.31 + vW.z*1.7, vUv.y*.9 + .37)).g;
  float along = 1. - vUv.x*vUv.x; along *= along;
  float across = exp(-vUv.y*vUv.y*3.2);
  float a = along*across*smoothstep(.3, .72, n*.75 + m*.25 + .22*across)*vW.y*smoothstep(uNear.x, uNear.y, vW.x);   // filaments drawn out along the stream
  vec2 q = max(uClear.xy - vXZ, vXZ - uClear.zw);          // metres outside the roof's clear box, in plan: none inside it
  a *= smoothstep(0., uSoft, max(q.x, q.y));
  vec2 ql = max(uLane.xy - vXZ, vXZ - uLane.zw);           // and outside the hero's window's lane
  a *= smoothstep(0., uLaneSoft, max(ql.x, ql.y));
  vec3 col = uLit*(.95 + .2*n) + uSunColor*(vW.w*vW.w*.6);                  // in the sun: lighter than the roof's own shade
  col = mix(col, uFogCol, 1. - exp(-uFogDen*uFogDen*vW.x*vW.x));
  if (a < .004) discard;
  gl_FragColor = vec4(col, a);
}`;
export function makeWisps(E, o = {}) {
  const n = o.count ?? WISP.N, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), span = WISP.Z[1] - WISP.Z[0];
  for (let k = 0; k < n; k++) {
    // two thirds over the roof (a sheet a few metres over the crown and its shoulders), a third down the sun flank
    const roof = k % 3 !== 0, a = roof ? (-58 + 116 * hash1(k, 11.3)) * D2R : (62 + 46 * hash1(k, 11.3)) * D2R;
    const off = roof ? 5 + 13 * hash1(k, 4.9) * hash1(k, 6.1) : WISP.FLANK[0] + (WISP.FLANK[1] - WISP.FLANK[0]) * hash1(k, 4.9), r = HR + HULL.SHOULDER + off;
    iA[k * 4] = AX - r * Math.sin(a); iA[k * 4 + 1] = AY + r * Math.cos(a); iA[k * 4 + 2] = WISP.Z[0] + span * hash1(k, 17.7); iA[k * 4 + 3] = 15 + 12 * hash1(k, 23.1);
    iB[k * 4] = 70 + 80 * hash1(k, 29.9); iB[k * 4 + 1] = (roof ? 7 : 9) + 7 * hash1(k, 31.3); iB[k * 4 + 2] = hash1(k, 37.7); iB[k * 4 + 3] = 0.45 + 0.35 * hash1(k, 41.1);
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.instanceCount = n;
  const L = cloudLight(E, o.field);
  const material = new THREE.ShaderMaterial({
    uniforms: { uNoise: L.uNoise, uLit: L.uLit, uShade: L.uShade, uSunColor: L.uSunColor, uSunDir: L.uSunDir, uFogCol: L.uFogCol, uFogDen: L.uFogDen,
      uTime: { value: 0 }, uSpan: { value: new THREE.Vector3(WISP.Z[0], span, WISP.FADE) }, uNear: { value: new THREE.Vector2(WISP.NEAR[0], WISP.NEAR[1]) },
      uClear: { value: new THREE.Vector4(...(o.clear === false ? [1e5, 1e5, 1e5, 1e5] : o.clear || wispClear())) }, uSoft: { value: WISP.SOFT },   // o.clear: [x0, z0, x1, z1] another box; false: none
      uLane: { value: new THREE.Vector4(...(o.lane === false ? [1e5, 1e5, 1e5, 1e5] : o.lane || wispLane())) }, uLaneSoft: { value: WISP.LANE.SOFT } },
    vertexShader: WISP_VERT, fragmentShader: WISP_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.name = 'otter-wisps'; mesh.renderOrder = 5;
  return { object: mesh, material, triangles: n * 2, update(dt, time) { material.uniforms.uTime.value = time; } };
}
