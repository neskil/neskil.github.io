// THE BOURDON  (hero set piece of "carillon-grove")
// ---------------------------------------------------------------------------------------------
// A celadon glass bell 180 m tall and 120 m across the mouth, hung under an arch of three fused
// lacquer-black stalks (feet 150 m apart, apex at 260 m). 24 pale veins (real ribs + a branching
// shader vein net) converge on a 22 m collar at the crown; the portal seat ring sits in the collar
// on three spokes and faces straight down the bell. A 12 m ember-seed clapper on a ~158 m stem is
// hinged on the collar rim (+Z side); it draws back, strikes the wall facing the approach (+Z) and
// stays pressed there, off axis, so the axis is clear for the climb. Around it: a dozen 7-13 m
// "first-catch" bells on crooked branchlets of the arch (they catch the toll first, hop-delayed),
// a tuning gallery under the lip (132 separate planks on rope hangers, cold lamps, four ladders),
// a lacquer calyx of twelve sepals inside the crown round the collar, about 4,100 glass-moths
// (roost -> burst; 2,600 of them wind up the inside of the bell as one two-strand ribbon), mist
// halos, and a water decal (contact shadow, gold flash, chime-fish rings).
// The glass has an inside look (uniform uIn, 0 outside .. 1 inside): clear celadon near the lip
// (the grove shows through), dense veined green with climbing gold shimmer bands mid-wall, clear
// again toward the crown. The lip is thick celadon with gold beads moving in it and a gold root
// at each rib.
//
// SIZE     radius ~95 m (arch feet at 87 m; side bells reach ~120 m), height 262 m.
//          Lip (rim) at y = 50, crown/collar at y = 230, apex knot at y = 260. Origin = lake level.
// FRONT    +Z is the approach side: the clapper strikes the +Z wall, arch feet stand at about
//          +-60 deg and 180 deg from +Z so the aisle axis (x = 0) is open.
// OPTS     palette  [pearl, slate, celadon, deep celadon, far-stalk, lacquer, gold] (brief default)
//          waterFx  true  : water decal at y = 0.08 (contact dark + gold flash + chime-fish rings)
//          gallery  true  : tuning gallery under the lip
//          sideBells number: override count of first-catch bells (default 10-14 by seed)
//          seatTilt degrees the portal seat is tipped off straight-down (default 20)
//          ambient  ambient level of the self-shading (default 1; ~0.25 for the night variant)
// TOLL     hero.setToll(s): s = seconds relative to the Bourdon's strike (negative before it).
//          Drive it from path progress, e.g. s = (u - uStrike) * duration. s <= -9 rest (swaying); -9..-0.5
//          clapper draws back (ember charging); -0.5..0 swings across; 0 strike; gold cracks up the
//          veins, fills the wall in ~1.5 s, side bells catch by hop delay, moths burst, then a
//          long after-shimmer. If setToll is never called a 30 s demo loop runs (strike at t=6).
//          hero.goldLevel(s) -> 0..1 envelope (for the 6% gold sky grade / envelope glow).
//          hero.tollArrival(localVec3) -> seconds after the strike for the chain to reach a point
//          at 90 m/s (use for the grove's own graph source time).
//          hero.makeMirror() -> Group: y-flipped copy for the lake mirror. It shares the vertex
//          buffers and materials but draws a lighter index (Buf.mi, geometry.userData.mirror):
//          Buf.mdec = 0 leaves a piece out of the mirror, 1 keeps it whole, 2 halves its grid.
//          hero.haloMesh: the halo mesh (the world re-orders it under the glass when inside).
//          await buildHero(ctx, opts): the build is async and yields (ctx.yield) between pieces.
// ANCHORS  (local space)
//          portalSeat  { position (0,226,0), normal, radius 7, tiltDeg }: the 14 m portal in the
//                      collar. The engine's tilted exit allows at most 70 deg from level, so the
//                      seat ring is tipped opts.seatTilt (default 20) degrees off straight-down,
//                      facing down and toward -Z; normal is the way the portal faces (back along
//                      the camera's final line). The last flyThrough leg is that 60 m straight.
//          flyThrough  ordered points: aisle approach at 35 m, under the +Z lip, then a rising
//                      helix (r 14-20 m) inside the bell to the seat; >= 9 m clear of everything,
//                      pitch stays under ~70 deg; the last leg is a 60 m straight at 70 deg to the seat
//          axisBottom / axisTop  the clear vertical axis inside the bell (y 55 .. 222)
//          strikePoint where the clapper hits (on the +Z wall ~25 m above the lip)
//          clapperRest seed position after the strike (keep the camera > 12 m from it)
//          lipFront    lowest point of the rim on the approach side (pass under at y <= 38)
//          revealView  { position, target }: the whole bell and arch in frame, 230 m out
//          underView   { position, target }: looking up the bell from under the lip
//          feet[3]     arch feet at the waterline; apex; sideBells[] {position, radius, delay}
// WORLD    The world file draws its whole grove with this piece's materials (hero.materials.glass / solid / halo)
//          and vertex layout (exported Buf, lathe, tube, blob, spline). Extra per-vertex attribute aPre (< 0):
//          an earlier scripted toll at that time relative to the strike (no after-shimmer). Uniforms the
//          world drives: uAfter (after-shimmer level), uBackA (alpha of back faces, raised inside the bell),
//          uHaloK (halo gain; halos are pushed behind their bell so stalks cut out against them), uRime
//          (opts.rime, frost season), uIn (inside-the-bell look, 0..1), uAmberK (how deep an amber the
//          tolling wall goes, 1 = pale gold, 1.7 = saturated amber for bright hours), uVeinK (gain of
//          the lit ribs seen from outside), uGlassAmb (floor under the glass ambient, for night),
//          uRim (sky-coloured rim light on the lacquer stalks, so they read as silhouettes at night).
// LIGHT    Self-shaded (custom ShaderMaterials, fogged): soft pearl ambient from above, no key
//          light, no shadows. Expects bright pearl fog/sky behind it (silhouette contrast) and
//          bloom ~0.45 at threshold ~0.9. Gold is emitted only by embers, tolling glass, halos.
//          hero.uniforms.uSky / uAmb let the world retint the ambient (night variants: uAmb 0.25).
// COST     ~55k triangles rendered (mirror copy about half that), 7 draw calls (solids, clapper,
//          glass back + front, halos, moths, water decal), no lights, no textures, build ~200 ms on
//          the software test machine in steps under 50 ms.
// ---------------------------------------------------------------------------------------------
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#D5DAE6', '#8FA5B8', '#A9D6C4', '#3F9C86', '#22323C', '#0B1016', '#FFC56B'];
const TAU = Math.PI * 2;
const RIM_Y = 50, CROWN_Y = 230, APEX_Y = 260, MOUTH_R = 60, COLLAR_R = 11, FOOT_R = 86.6;

// ---------- growable mesh buffer with the shared vertex layout ----------
class Buf {
  constructor() { this.p = []; this.n = []; this.uv = []; this.c = []; this.pv = []; this.d = []; this.i = []; this.pr = []; this.pre = 0; this.count = 0;
    this.pivot = [0, 0, 0, 0]; this.data = [0, 0, 0, 0];
    this.mi = []; this.mdec = 1; }   // mi = the index of the lake-mirror copy; mdec 0 leaves a piece out of it, 1 copies it whole, 2 halves its grid
  set(pivot, data) { this.pivot = pivot; this.data = data; return this; }
  v(x, y, z, nx, ny, nz, u, v, col) {
    this.p.push(x, y, z); this.n.push(nx, ny, nz); this.uv.push(u, v); this.c.push(col[0], col[1], col[2]);
    this.pv.push(this.pivot[0], this.pivot[1], this.pivot[2], this.pivot[3]);
    this.d.push(this.data[0], this.data[1], this.data[2], this.data[3]); this.pr.push(this.pre);
    return this.count++;
  }
  quad(a, b, c, d) { this.i.push(a, b, c, c, b, d); if (this.mdec) this.mi.push(a, b, c, c, b, d); }
  // a (rows + 1) x (cols + 1) vertex grid starting at base, w vertices per row; lat = the lathe's winding, else the tube's
  grid(base, w, rows, cols, lat) {
    const I = this.i;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const p = base + j * w + i; if (lat) I.push(p, p + w, p + 1, p + 1, p + w, p + w + 1); else I.push(p, p + 1, p + w, p + w, p + 1, p + w + 1); }
    if (!this.mdec) return;
    const pick = (n) => { const o = []; if (this.mdec < 2 || n < 6) { for (let k = 0; k <= n; k++) o.push(k); } else { for (let k = 0; k < n; k += 2) o.push(k); o.push(n); } return o; };
    const R = pick(rows), C = pick(cols), M = this.mi;
    for (let j = 0; j + 1 < R.length; j++) for (let i = 0; i + 1 < C.length; i++) {
      const a = base + R[j] * w + C[i], b = base + R[j + 1] * w + C[i], c = base + R[j] * w + C[i + 1], d = base + R[j + 1] * w + C[i + 1];
      if (lat) M.push(a, b, c, c, b, d); else M.push(a, c, b, b, c, d);
    }
  }
  // the attributes are filled a slice at a time (pass ctx.yield) so no single step of the build is long
  async geometry(yieldFn) {
    const g = new THREE.BufferGeometry(), n = this.count, step = 12000;
    const mk = async (src, k) => { const a = new Float32Array(n * k); for (let o = 0; o < src.length; o += step * k) { a.set(src.slice(o, o + step * k), o); if (yieldFn) await yieldFn(); } return new THREE.BufferAttribute(a, k); };
    g.setAttribute('position', await mk(this.p, 3)); g.setAttribute('normal', await mk(this.n, 3)); g.setAttribute('uv', await mk(this.uv, 2));
    g.setAttribute('color', await mk(this.c, 3)); g.setAttribute('aPivot', await mk(this.pv, 4)); g.setAttribute('aData', await mk(this.d, 4));
    g.setAttribute('aPre', await mk(this.pr, 1));
    const ix = (src) => new THREE.BufferAttribute(n > 65535 ? Uint32Array.from(src) : Uint16Array.from(src), 1);
    g.setIndex(ix(this.i)); if (yieldFn) await yieldFn();
    const m = new THREE.BufferGeometry(); for (const k in g.attributes) m.setAttribute(k, g.attributes[k]);   // the mirror shares every vertex and has its own, lighter index
    m.setIndex(ix(this.mi)); g.userData.mirror = m;
    return g;
  }
  get tris() { return this.i.length / 3; }
}

// Surface of revolution about a vertical axis through (cx,*,cz). prof(t,a) -> [r, y]; a = 0 faces +Z.
function latheRows(buf, segA, segT, prof, colFn, cx, cz, tMap, j0, j1) {
  const e = 1e-3;
  for (let j = j0; j <= j1; j++) {
    const t = tMap(j / segT);
    for (let i = 0; i <= segA; i++) {
      const a = (i / segA) * TAU, s = Math.sin(a), c = Math.cos(a);
      const [r, y] = prof(t, a), [r1, y1] = prof(Math.min(1, t + e), a), [r0, y0] = prof(Math.max(0, t - e), a);
      let dr = r1 - r0, dy = y1 - y0; const l = Math.hypot(dr, dy) || 1; dr /= l; dy /= l;
      buf.v(cx + s * r, y, cz + c * r, -dy * s, dr, -dy * c, i / segA, t, colFn(t, a));
    }
  }
}
function lathe(buf, segA, segT, prof, colFn, cx = 0, cz = 0, tMap = (t) => t) {
  const base = buf.count;
  latheRows(buf, segA, segT, prof, colFn, cx, cz, tMap, 0, segT);
  buf.grid(base, segA + 1, segT, segA, true);
}
// the same surface built a few rows at a time, handing the page back between them (for the big wall)
async function latheSlow(buf, segA, segT, prof, colFn, yieldFn, rows = 8) {
  const base = buf.count;
  for (let j = 0; j <= segT; j += rows) {
    latheRows(buf, segA, segT, prof, colFn, 0, 0, (t) => t, j, Math.min(segT, j + rows - 1));
    if (yieldFn) await yieldFn();
  }
  buf.grid(base, segA + 1, segT, segA, true);
}

// Tube along a polyline of Vector3. radFn(t, phi) -> radius; colFn(t, phi) -> [r,g,b].
const _t = new THREE.Vector3(), _n = new THREE.Vector3(), _b = new THREE.Vector3(), _q = new THREE.Vector3();
function tube(buf, pts, sides, radFn, colFn, o = {}) {
  const base = buf.count, m = pts.length, flat = o.flat ?? 1;
  _t.subVectors(pts[1], pts[0]).normalize();
  if (o.ref) _n.copy(o.ref); else _n.set(Math.abs(_t.y) > 0.9 ? 1 : 0, Math.abs(_t.y) > 0.9 ? 0 : 1, 0);
  _n.addScaledVector(_t, -_n.dot(_t)).normalize();
  for (let j = 0; j < m; j++) {
    const t = j / (m - 1);
    _t.subVectors(pts[Math.min(m - 1, j + 1)], pts[Math.max(0, j - 1)]).normalize();
    _n.addScaledVector(_t, -_n.dot(_t)).normalize(); _b.crossVectors(_t, _n);
    for (let k = 0; k <= sides; k++) {
      const ph = (k / sides) * TAU + (o.phase || 0) + (o.twist ? o.twist * t : 0), cs = Math.cos(ph), sn = Math.sin(ph), r = radFn(t, ph);
      _q.set(0, 0, 0).addScaledVector(_n, cs).addScaledVector(_b, sn * flat);
      const nx = _n.x * cs + _b.x * sn, ny = _n.y * cs + _b.y * sn, nz = _n.z * cs + _b.z * sn;
      buf.v(pts[j].x + _q.x * r, pts[j].y + _q.y * r, pts[j].z + _q.z * r, nx, ny, nz, k / sides, t, colFn(t, ph));
    }
  }
  const w = sides + 1;
  buf.grid(base, w, m - 1, sides, false);
  if (o.cap) { // close the far end with a small fan
    const e = pts[m - 1], ci = buf.v(e.x + _t.x * o.cap, e.y + _t.y * o.cap, e.z + _t.z * o.cap, _t.x, _t.y, _t.z, 0.5, 1, colFn(1, 0));
    const p = base + (m - 1) * w; for (let k = 0; k < sides; k++) buf.i.push(p + k, p + k + 1, ci);
  }
}

// Lumpy ellipsoid (knots, seeds, lamps). bump(a, t) -> radial scale.
function blob(buf, c, rx, ry, rz, segA, segT, colFn, bump = () => 1) {
  const base = buf.count;
  for (let j = 0; j <= segT; j++) {
    const t = j / segT, th = t * Math.PI, st = Math.sin(th), ct = Math.cos(th);
    for (let i = 0; i <= segA; i++) {
      const a = (i / segA) * TAU, k = bump(a, t), x = Math.sin(a) * st, z = Math.cos(a) * st;
      const nx = x / rx, ny = ct / ry, nz = z / rz, l = Math.hypot(nx, ny, nz) || 1;
      buf.v(c.x + x * rx * k, c.y + ct * ry * k, c.z + z * rz * k, nx / l, ny / l, nz / l, i / segA, t, colFn(t, a));
    }
  }
  buf.grid(base, segA + 1, segT, segA, true);
}

const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
function spline(points, n) { return new THREE.CatmullRomCurve3(points, false, 'centripetal').getPoints(n); }

// ---------- the Bourdon's clapper: its own keys, in seconds from the strike ----------
const DRAW = [-9, -0.7];       // it is drawn back from the first to the second (then let go half a second before the strike)

// ---------- shaders ----------
const GLSL_COMMON = /* glsl */`
uniform float uS, uTime, uAfter;
float drawBack(float s) { return smoothstep(${DRAW[0].toFixed(2)}, ${DRAW[1].toFixed(2)}, s); }   // 0 = the clapper hangs, 1 = it is fully drawn back
float tollCore(float t, float seed, float per) {
  float flick = 0.82 + 0.18 * sin(t * 31.4 + seed * 40.0);
  float e = exp(-t / 3.2) * flick;
  e += 0.45 * exp(-max(t - per, 0.0) / 1.6) * step(per, t) + 0.28 * exp(-max(t - 2.0 * per, 0.0) / 1.6) * step(2.0 * per, t);
  return e;
}
float tollEnv(float t, float seed, float per) {      // t = seconds since the toll reached this bell
  if (t < 0.0) return 0.0;
  float e = tollCore(t, seed, per) + uAfter * (0.72 + 0.28 * sin(t * 1.9 + seed * 9.0)) * smoothstep(0.5, 3.0, t);
  return smoothstep(0.0, 0.3, t) * min(e, 1.3);
}
float tollPre(float pre, float seed, float per) {    // an earlier, scripted toll (pre < 0 = its time relative to the strike); no after-shimmer
  float t = uS - pre;
  if (pre > -0.001 || t < 0.0) return 0.0;
  // the grove holds its breath while the Bourdon's clapper is drawn back: a toll begins at its full strength whenever it begins,
  // dies down with what was left of the draw at that moment, and is silent once the clapper is fully back. After that a bell
  // stays quiet until the Bourdon's own toll reaches it
  float hush = clamp((1.0 - drawBack(uS)) / max(1.0 - drawBack(pre), 0.02), 0.0, 1.0);
  return smoothstep(0.0, 0.3, t) * min(tollCore(t, seed, per), 1.3) * hush;
}`;
const GLSL_VERT = /* glsl */`
attribute vec4 aPivot; attribute vec4 aData; attribute float aPre;
varying vec3 vN, vW, vL; varying vec2 vUv; varying vec4 vData; varying vec3 vCol; varying float vPre, vPend, vThin;
#ifdef THIN
uniform float uPx;
#endif
${GLSL_COMMON}
#include <common>
#include <fog_pars_vertex>
void main() {
  vec3 p = position, n = normal; vL = position; vThin = 1.0;
  if (aPivot.w > 0.0) {                                // pendulum swing about the hanging point
    float per = aPivot.w, t = uS - aData.x;
    float ang = 0.035 * sin(uTime * 6.2832 / per + aData.z * 20.0);
    if (t > 0.0) ang += 0.105 * sin(6.2832 * t / per) * exp(-t / 16.0);
    float tp = uS - aPre;
    if (aPre < -0.001 && tp > 0.0) ang += 0.105 * sin(6.2832 * tp / per) * exp(-tp / 9.0);
    ang *= (aData.w > 0.5 && aData.w < 1.5) ? 1.9 : 1.0;   // clapper seeds swing wider than their bells
    vec3 ax = vec3(cos(aData.z * 37.0), 0.0, sin(aData.z * 37.0)), q = p - aPivot.xyz;
    float c = cos(ang), s = sin(ang);
    p = aPivot.xyz + q * c + cross(ax, q) * s + ax * dot(ax, q) * (1.0 - c);
    n = n * c + cross(ax, n) * s + ax * dot(ax, n) * (1.0 - c);
  }
  vec4 w = modelMatrix * vec4(p, 1.0);
#ifdef THIN
  if (aData.y > 0.0 && (aData.w < 0.5 || aData.w > 2.5)) {   // thin lines (ropes, rungs, cables): aData.y = their radius; never thinner than ~1.6 px
    float need = 0.8 * length(cameraPosition - w.xyz) / max(uPx, 1.0);
    if (need > aData.y) { p += n * (need - aData.y); w = modelMatrix * vec4(p, 1.0); vThin = aData.y / need; }
  }
#endif
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * n);
  vUv = uv; vData = aData; vCol = color; vPre = aPre; vPend = step(0.001, aPivot.w);
  vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

// Glass: aData = (delay, veinCount, seed, kind)  kind 0 Bourdon wall, 1 side bell, 2 rib, 3 lip bead
const GLASS_FRAG = /* glsl */`
uniform vec3 uBody, uLip, uPale, uGold, uSky, uStrike; uniform float uAmb, uBackA, uIn, uAmberK, uGlassAmb, uVeinK, uClear, uDense, uDawnK; uniform vec2 uLightAz; uniform vec3 uEmber;
varying vec3 vN, vW, vL; varying vec2 vUv; varying vec4 vData; varying vec3 vCol; varying float vPre, vPend;
${GLSL_COMMON}
#include <common>
#include <fog_pars_fragment>
float veins(vec2 uv, float n, float seed) {
  float x = uv.x * n, v = clamp(uv.y, 0.0, 1.0);
  x += 0.07 * sin(v * 9.0 + floor(x) * 1.7 + seed * 6.0) * v;
  float f = abs(fract(x) - 0.5), w = 0.035 + 0.03 * v + fwidth(x) * 0.8;
  float m = 1.0 - smoothstep(w * 0.3, w, f);
  float b1 = abs(f - 0.55 * max(v - 0.36, 0.0));
  m = max(m, 0.75 * (1.0 - smoothstep(w * 0.2, w * 0.75, b1)) * step(0.36, v));
  float b2 = abs(f - (0.55 * (v - 0.36) - 0.62 * max(v - 0.64, 0.0)));
  m = max(m, 0.55 * (1.0 - smoothstep(w * 0.15, w * 0.6, b2)) * step(0.64, v));
  float b3 = abs(f - 0.3 * max(v - 0.78, 0.0));
  m = max(m, 0.45 * (1.0 - smoothstep(w * 0.15, w * 0.5, b3)) * step(0.78, v));
  return m * smoothstep(0.0, 0.05, v);
}
// the finer net between the ribs of the Bourdon, seen from inside: side veins leave every rib up-and-out like a leaf's,
// a second, fainter family crosses them, and a thread runs up the middle of every panel where the two sides meet
float net(vec2 uv, float f, float pid, float fwx, float fwv, float seed) {
  float v = clamp(uv.y, 0.0, 1.0), wd = 0.3 + 0.9 * v, h = fract(sin(pid * 12.9898 + seed * 7.0) * 43758.5);   // a panel is wider toward the lip; every rib has its own rhythm
  float k1 = 20.0 + 7.0 * h;
  float q1 = v * k1 + f * 4.4 * wd + f * f * 3.0 + 3.0 * h + 0.3 * sin(f * 12.0 + v * 8.0 + h * 6.0);
  float w1 = (0.05 + 0.1 * (0.5 - f)) + (fwv * k1 + fwx * 5.5 * wd) * 0.9;
  float m = (1.0 - smoothstep(w1 * 0.45, w1, abs(fract(q1) - 0.5))) * (0.35 + 1.3 * (0.5 - f)) * clamp(0.4 / max(w1, 0.12), 0.0, 1.0);
  float q2 = v * 57.0 - f * 7.0 * wd + 2.0 * sin(v * 11.0 + h * 9.0) + 1.5 * sin(f * 9.0 + h * 4.0);
  float w2 = 0.07 + (fwv * 57.0 + fwx * 7.0 * wd) * 0.9;
  m = max(m, 0.3 * (1.0 - smoothstep(w2 * 0.45, w2, abs(fract(q2) - 0.5))) * clamp(0.3 / max(w2, 0.1), 0.0, 1.0));
  float wm = 0.015 + fwx * 0.9;
  m = max(m, 0.45 * (1.0 - smoothstep(wm * 0.4, wm, 0.5 - f)));
  return m * smoothstep(0.02, 0.09, v);
}
void main() {
  float kind = vData.w, v = clamp(vUv.y, 0.0, 1.0);    // crown-to-lip coordinate, kept in its own range before it is squared or raised to a power
  vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vW);
  float fr = pow(max(1.0 - abs(dot(N, V)), 0.0), 2.2);
  float isWall = step(kind, 1.5), isRib = step(1.5, kind) * step(kind, 2.5), isLip = step(2.5, kind), isB = step(kind, 0.5);
  float vn = isWall * veins(vUv, vData.y, vData.z);
  // thickness: lip, veins and grazing angles read as deeper, more saturated glass
  float thick = clamp(pow(v, 3.5) * 0.85 + vn * 0.55 + fr * 0.6 + isLip + isRib * 0.25, 0.0, 1.0);
  float streak = 0.5 + 0.5 * sin(vUv.x * 190.0 + sin(v * 14.0 + vData.z * 5.0) * 3.0);      // drawn-glass striation
  vec3 tint = mix(uBody, uLip, thick) * (0.9 + 0.1 * streak);
  float sky = 0.62 + 0.38 * N.y, amb = max(uAmb, uGlassAmb);                                   // glass keeps its own colour in the dark
  amb = mix(amb, max(amb, 0.72), isLip);                                                       // the thick bead holds light of its own
  vec3 col = tint * (0.55 + 0.45 * sky) * amb * 1.05;
  col = mix(col, uPale * amb * 0.92, max(isRib * 0.8, smoothstep(0.55, 1.0, vn) * 0.75));
  col += uSky * amb * fr * (0.4 - 0.26 * isLip);                                               // pearl reflection at the rim
  // the glass is never still: slow bands of sky light slide down the wall and along the veins as the bell breathes
  float gl = pow(0.5 + 0.5 * sin(v * (7.0 + 5.0 * step(kind, 0.5)) - uTime * 1.5 + vData.z * 20.0 + sin(vUv.x * 12.566 + vData.z * 9.0) * 1.3), 5.0);
  col += uSky * amb * gl * isWall * (0.13 + 0.24 * vn + 0.3 * step(kind, 0.5)) * (0.4 + 0.6 * v);
  float alpha = clamp(0.4 + 0.42 * thick + 0.25 * fr + isRib, 0.0, 0.96);
  if (!gl_FrontFacing) alpha *= uBackA;
  // toll: gold from the strike point outward, veins leading the wall
  float d = distance(vL, uStrike);
  float lead = max(max(vn, isRib), isLip * 0.6);
  float tA = vData.x + (1.0 - max(step(0.5, kind) * step(kind, 1.5), vPend)) * d / mix(125.0, 420.0, lead);
  float g = tollEnv(uS - tA, vData.z + vUv.x * 3.0, 4.0 + vData.z * 5.0);
  g = max(g, tollPre(vPre, vData.z + vUv.x * 3.0, 4.0 + vData.z * 5.0));
  float fq = (uS - tA) * 4.5, fp = (uS - vPre) * 4.5;
  float front = exp(-fq * fq) * step(0.0, uS) + exp(-fp * fp) * step(vPre, -0.001);                                 // the bright crack of the front itself
  float T = uTime * 0.6;
  float ca = pow(0.5 + 0.5 * sin(vUv.x * 75.0 + sin(v * 21.0 - T * 1.7) * 2.4 + T), 5.0)
           + pow(0.5 + 0.5 * sin(vUv.x * 44.0 - sin(v * 13.0 + T * 1.1) * 3.1 - T * 0.7), 6.0);
  // gold after-shimmer: bands of light that climb the wall toward the crown
  float band = pow(0.5 + 0.5 * sin(v * 26.0 + uTime * 1.9 + 1.4 * sin(vUv.x * 12.566 + vData.z * 7.0)), 4.0);
  // the wall turns to amber glass; only vein cores, ribs, lip and the travelling front are HDR
  float amberK = mix(uAmberK, 1.0, uIn * max(isB, isRib)), veinK = mix(uVeinK, 1.0, uIn);     // bright hours need a deeper, stronger amber outside to beat their sky
  vec3 GA = uGold * mix(vec3(1.0, 0.8, 0.52), vec3(1.0, 0.68, 0.36), clamp(amberK - 1.0, 0.0, 1.0));
  vec3 amber = GA * amberK * (gl_FrontFacing ? 0.5 + 0.28 * v * v + ca * 0.16 + 0.14 * band * isB : 0.36 + 0.2 * v * v + ca * 0.3);
  // some seconds after its toll a wall relaxes back toward celadon: gold stays in veins, ribs, lip and the travelling shimmer
  float rel = smoothstep(mix(3.5, 7.0, isB), mix(9.0, 14.0, isB), uS - tA) * isWall, cap = mix(0.94, mix(0.76, 0.26, isB), rel);
  float inK = gl_FrontFacing ? 0.0 : isB * uIn, nt = 0.0;
  float x24 = vUv.x * 24.0, fwx = fwidth(x24), fwv = fwidth(v);              // derivatives are taken outside the branch
  if (!gl_FrontFacing) { col = mix(col, mix(uBody, uLip, 0.5 + 0.3 * vn + 0.2 * v * v) * amb * (0.5 + 0.28 * sky) * (0.88 + 0.12 * streak), rel * isB * 0.88); alpha = min(alpha + 0.2 * rel * isB, 0.96); }   // from inside, the Bourdon is thick green glass
  if (inK > 0.0) {
    // INSIDE THE BOURDON the wall is thick clear glass: the grove, the arch and the sky are seen through its panes. The glass
    // gathers where it is thick (beside every rib, along the leaf veins, in the last metres above the lip) and at grazing angles
    float f = abs(fract(x24) - 0.5);
    nt = net(vUv, f, floor(x24 + 0.5), fwx, fwv, vData.z);
    float bright = smoothstep(0.5, 1.0, uAmb);                                              // a bright sky behind: the veins are darker lines; at night they carry the light
    float flank = 1.0 - smoothstep(0.02, 0.1, f), vv = max(vn, mix(0.35, 0.85, bright) * nt);
    float lipZ = smoothstep(0.86, 1.0, v), crownZ = 1.0 - smoothstep(0.02, 0.2, v);
    float low = smoothstep(0.58, 0.78, v), dense = (1.0 - low) * (1.0 - 0.7 * crownZ);     // clear at the mouth (the grove and the horizon show through), rich and deep above, thin and pale in the crown
    // a pane is thin in its middle and thick toward its ribs and along its leaf veins, all the way up the wall: the thin glass is
    // clearer and paler, so what stands or glows behind the wall shows between the veins and no pane is one flat sheet
    float pane = smoothstep(0.1, 0.4, f) * (1.0 - min(nt, 1.0));
    dense *= 1.0 - 0.7 * pane;
    float dC = distance(cameraPosition, vW), air = 1.0 - exp(-dC / 150.0);
    float tk = clamp(0.7 * flank + 0.2 * (1.0 - smoothstep(0.06, 0.34, f)) + 0.46 * vv + 0.8 * lipZ * lipZ + 0.6 * fr, 0.0, 1.0);
    float back = max(uAmb, 0.42);                                                          // how bright the world behind the glass is
    vec3 T = mix(mix(uBody * vec3(0.8, 1.25, 1.1), uLip * mix(1.5, 1.25, bright), 0.8 * dense), uLip * 0.9, tk) * (0.9 + 0.1 * streak);   // what the glass lets through
    float sideL = 0.5 + 0.5 * dot(vL.xz / max(length(vL.xz), 1.0), uLightAz);               // the side of the bell toward the bright band of the sky is lit through; the far side is deep
    // the light inside: gold thrown up from the lit lake on the lower wall, the portal's pale light in the crown, deep glass between
    float warm = smoothstep(0.4, 1.0, v) * min(g, 1.0);
    vec3 inner = T * mix(vec3(1.0), vec3(0.6, 1.0, 0.94), bright * dense) * uSky * back * mix(1.25, 1.1, bright * dense) * mix(0.9, 1.1, sideL * sideL * (3.0 - 2.0 * sideL));
    inner += T * uGold * vec3(1.0, 0.72, 0.4) * uDawnK * sideL * sideL * 0.04;
    inner += T * (uGold * vec3(1.0, 0.76, 0.45) * warm * 0.2 + uPale * crownZ * 0.4) + uPale * back * 0.12 * nt;
    inner += uSky * back * (fr * 0.15 + gl * 0.05);
    inner = mix(inner, uPale * back * 0.6 + uGold * 0.08 * min(g, 1.0), 0.14 * air * (1.0 - 0.7 * bright));         // the air between us and the far wall
    float aIn = clamp(mix(mix(uClear, uDense, dense), 0.94, tk), 0.0, 0.96);
    col = mix(col, inner, inK); alpha = mix(alpha, aIn, inK); cap = mix(cap, 0.0, inK);
  }
  // the lip stays deep celadon: its gold is a bead of light sliding round inside it, and every vein ends in it as a bright root
  float core = pow(0.5 + 0.5 * sin(vUv.x * 6.2832 * floor(vData.y * 0.5 + 0.25) - uTime * 1.2 + vData.z * 9.0), 3.0) * (1.0 - 0.8 * fr);   // (+ 0.25: a whole count must not fall to the count below it between two pixels)
  float root = 1.0 - smoothstep(0.05, 0.2, abs(fract(vUv.x * vData.y) - 0.5));
  float lipGold = isLip * (0.05 + 1.1 * core + 1.6 * root);
  // the Bourdon's own lip is a rim of thick glass lit from within, the same all the way round: deep celadon at its edge and
  // bright along its heart. After the toll a thread of gold lies in that heart, swelling slowly as it slides round, and every
  // vein ends in it as a small bright root
  float big = isLip * (1.0 - vPend), heart = clamp(dot(N, V), 0.0, 1.0); heart *= heart;
  col = mix(col, uLip * (0.45 + 1.2 * heart) * max(amb, 0.72) + uSky * amb * fr * 0.14, big);
  float thread = 0.55 + 0.45 * sin(vUv.x * 18.85 - uTime * 0.6 + vData.z * 9.0);
  lipGold = mix(lipGold, heart * (0.5 + 0.6 * thread + 0.8 * (1.0 - smoothstep(0.02, 0.07, abs(fract(vUv.x * vData.y) - 0.5)))), big);
  cap = mix(cap, 0.0, isLip);
  col = mix(col, amber * (1.0 + 0.9 * max(vn * veinK, isRib)), clamp(g * 1.5, 0.0, cap));
  col += uGold * vec3(1.0, 0.8, 0.52) * ca * 0.2 * rel * isB * min(g, 1.0) * (1.0 - 0.6 * inK);
  col += uGold * vec3(1.0, 0.86, 0.62) * g * (vn * vn * 1.05 * veinK * mix(1.0, 0.25 + 0.75 * band, inK) + isRib * (0.95 * veinK - 0.45 * uIn) + lipGold) + uGold * front * (0.5 + 2.2 * lead) * mix(1.0, 0.5, clamp(amberK - 1.0, 0.0, 1.0));
  // inside: ripples of after-shimmer climb the wall along the veins, and the lit lake throws its caustics on the lower wall
  col += inK * uGold * vec3(1.0, 0.8, 0.5) * min(g, 1.0) * (band * (0.04 + 0.9 * vn + 0.4 * nt) + 0.05 * vn + ca * 0.2 * smoothstep(0.5, 0.95, v));
  // the clapper's ember pressed against the wall shines through the glass where it struck
  float hd = d / 9.5, hot = exp(-hd * hd) * isB * smoothstep(0.0, 0.25, uS) * (0.85 + 0.15 * sin(uTime * 23.0) * exp(-max(uS, 0.0) * 0.3));
  col += uGold * vec3(1.0, 0.82, 0.55) * hot * (1.0 + 1.0 * vn);
  // THE BUILD. As the clapper is drawn back (drawBack, the clapper's own key) its ember's copper gathers in the glass round the
  // place the ember hangs: low in the wall and faint in the veins, half as strong one mouth-radius from the ember. Each part of
  // the wall keeps it until the strike's own front reaches that part (tA, the same arrival the gold has) and gives it up to the
  // bright crack of that front, so nothing dips between the two and the strike is a plain step up in brightness and in colour:
  // the copper is the deep amber, under half the wall's gold after the strike, and under a third of the veins'
  float ce = distance(vL, uEmber) / ${MOUTH_R.toFixed(1)};
  float chg = isB * drawBack(uS) * step(uS, tA) / (1.0 + ce * ce);
  col += uGold * vec3(1.0, 0.68, 0.36) * chg * (0.42 + 0.3 * vn + 0.3 * ca) * (1.0 - 0.6 * inK);
  alpha = clamp(alpha + g * 0.38 * (1.0 - 0.75 * inK) + front * 0.4 + chg * 0.16, 0.0, 0.98);
  alpha = mix(alpha, 0.95, big);
  if (isRib * uIn > 0.0) {
    // a rib seen from inside the bell is a rod of pale glass, dark at its edges and bright along its core, and the after-shimmer
    // climbs it toward the collar as beads of gold
    float nvR = clamp(dot(N, V), 0.0, 1.0), aR = max(uAmb * 0.9, 0.62);
    float bead = clamp(0.5 + 0.5 * sin(v * 19.0 + uTime * 1.7 + floor(x24) * 2.399), 0.0, 1.0); bead = bead * bead * bead;
    vec3 rc = mix(uLip * 0.6, mix(uPale, uLip * 1.2, 0.7 * smoothstep(0.5, 1.0, uAmb)), nvR * nvR) * aR * (0.4 + 0.6 * nvR) + uSky * aR * pow(max(nvR, 1e-4), 8.0) * 0.2;
    rc += uGold * vec3(1.0, 0.82, 0.55) * min(g, 1.0) * (0.4 + 1.6 * bead) * (0.35 + 0.65 * nvR);
    col = mix(col, rc, isRib * uIn); alpha = mix(alpha, 0.93, isRib * uIn);
  }
  gl_FragColor = vec4(col, alpha);
  #include <fog_fragment>
}`;

// Solids: aData = (delay, glow, seed, kind)  kind 0 lacquer, 1 ember, 2 cold lamp, 3 matte rope/plank
const SOLID_FRAG = /* glsl */`
uniform vec3 uGold, uSky, uCold; uniform float uAmb, uCharge, uPilot, uRime, uRim;
varying vec3 vN, vW, vL; varying vec2 vUv; varying vec4 vData; varying vec3 vCol; varying float vPre, vPend, vThin;
${GLSL_COMMON}
#include <common>
#include <fog_pars_fragment>
void main() {
  float kind = vData.w;
  vec3 N = normalize(vN), V = normalize(cameraPosition - vW);
  float nv = clamp(dot(N, V), 0.0, 1.0), fr = pow(1.0 - nv, 3.0);
  float sky = 0.5 + 0.5 * N.y;
  vec3 col = vCol * (0.35 + 0.65 * sky) * uAmb;
  if (kind < 0.5) {                                    // lacquer: thin pearl rim, tight sky sheen, faint gold kick from the bell
    float rimFar = 1.0 - 0.8 * smoothstep(60.0, 220.0, distance(cameraPosition, vW));       // far stalks stay pure silhouettes
    col += uSky * uRim * rimFar * (pow(1.0 - nv, 4.0) * 0.42 + pow(sky, 6.0) * 0.03 + 0.012);
    float g = tollEnv(uS - length(vL.xz) / 300.0, 0.3, 6.0);
    vec3 toAxis = normalize(vec3(-vL.x, 0.0, -vL.z) + 1e-4);
    col += uGold * g * (pow(max(dot(N, toAxis), 0.0), 2.0) * 0.05 + fr * 0.04);
    // what hangs with a bell (its cord, its knots, its clapper's stem) takes a glint of that bell's own gold while it rings
    float gb = max(tollEnv(uS - vData.x, vData.z, 4.0 + vData.z * 5.0), tollPre(vPre, vData.z, 4.0 + vData.z * 5.0));
    col += uGold * vec3(1.0, 0.8, 0.5) * min(gb, 1.0) * vPend * 0.45;
  } else if (kind < 1.5) {                             // ember seed: pilot from the first frame, 6x on a toll
    float g = max(tollEnv(uS - vData.x, vData.z, 4.0 + vData.z * 5.0), tollPre(vPre, vData.z, 4.0 + vData.z * 5.0));
    float pulse = 0.85 + 0.15 * sin(uTime * 2.3 + vData.z * 30.0);
    float hot = uPilot * pulse * (1.0 + uCharge * vData.y) + 5.0 * g;
    col = uGold * vec3(1.0, 0.84, 0.6) * hot * (0.5 + 0.5 * nv);
  } else if (kind < 2.5) {
    col = uCold * (2.6 + 0.5 * sin(uTime * 1.3 + vData.z * 50.0)) * (vData.y > 0.001 ? vData.y : 1.0);   // aData.y = gain (window panes are dimmer than lamps)
  }
  if (kind < 0.5 || kind > 2.5) {                      // frost season: rime on everything that faces the sky
    float rm = uRime * smoothstep(0.42, 0.95, sky + 0.07 * sin(vL.y * 0.31 + vL.x * 0.7 + 2.0 * sin(vL.y * 0.13 + vL.z * 0.4)) * sin(vL.x * 0.9 - vL.z * 0.6 + vL.y * 0.07));
    col = mix(col, uSky * uAmb * 0.86, rm);
  }
  #ifdef USE_FOG
  col = mix(fogColor, col, clamp(max(vThin, 0.55), 0.0, 1.0));     // a widened thin line carries less of its own colour
  #endif
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

// additive things fade to nothing in fog (never toward the fog colour)
const GLSL_ADDFOG = /* glsl */`
#ifdef USE_FOG
  uniform vec3 fogColor;
  #ifdef FOG_EXP2
    uniform float fogDensity;
    float addFog(float d, float k) { return exp(-fogDensity * fogDensity * d * d * k * k); }
  #else
    uniform float fogNear, fogFar;
    float addFog(float d, float k) { return 1.0 - smoothstep(fogNear, fogFar, d * k); }
  #endif
#else
  float addFog(float d, float k) { return 1.0; }
#endif`;

// Moths: position = roost point, aDir = xyz burst direction + w speed, aSeed = (seed, helix flag, size, phase)
const MOTH_VERT = /* glsl */`
attribute vec4 aDir; attribute vec4 aSeed;
uniform float uPx;
varying float vA, vGold, vDist; varying vec2 vWing;
${GLSL_COMMON}
void main() {
  float sd = aSeed.x, t = uS - aSeed.w * 0.9;
  vec3 p = position; float a = 0.6, gold = 0.0, size = aSeed.z, near = 0.0;
  float oa = uTime * (0.35 + 0.5 * fract(sd * 9.7)) + sd * 60.0, orr = 1.2 + 1.8 * fract(sd * 5.3);             // roosting: a slow orbit off the glass
  p += orr * vec3(sin(oa), 0.6 * sin(oa * 1.3 + sd * 20.0), cos(oa)) + 0.3 * vec3(sin(uTime * 1.3 + sd * 50.0), sin(uTime * 1.7 + sd * 31.0), cos(uTime * 1.1 + sd * 77.0));
  if (t > 0.0) {
    gold = smoothstep(0.0, 0.4, t);
    if (aSeed.y > 0.5) {                                // helix climbing the bell's axis
      // the helix: every moth climbs at the same rate along one of two strands, so the swarm reads as one gold ribbon
      float k = smoothstep(0.0, 4.0, t), k2 = smoothstep(1.5, 6.0, t), h = mod(aDir.w + uTime * 7.0, 176.0), hk = h / 176.0;
      float strand = step(0.5, fract(sd * 2.0));
      float rr = mix(length(position.xz), mix(22.0, 9.5, hk) + 1.3 * sin(sd * 211.0) * (1.0 - 0.6 * hk), k);
      float ang = h * 0.06 - uTime * 0.16 + strand * 3.14159;
      vec3 hp = vec3(sin(ang) * rr, 52.0 + h, cos(ang) * rr);
      hp += (0.35 + 0.5 * fract(sd * 17.0)) * vec3(sin(uTime * 2.1 + sd * 40.0), sin(uTime * 2.7 + sd * 22.0), cos(uTime * 1.9 + sd * 63.0));
      p = mix(p, hp, k2);
      a = 0.9 * smoothstep(0.0, 0.04, hk) * (1.0 - smoothstep(0.95, 1.0, hk)); size *= 1.5; near = 1.0;
    } else {                                            // thrown off the glass toward the neighbours, in streams
      float fly = aDir.w * (1.0 - exp(-t * 0.55));
      p += aDir.xyz * fly + vec3(0.0, 6.0 * sin(t * 0.8 + sd * 9.0), 0.0);
      p += (1.5 + fly * 0.03) * vec3(sin(uTime * 2.3 + sd * 44.0), cos(uTime * 1.9 + sd * 12.0), sin(uTime * 2.9 + sd * 71.0));
      a = mix(0.6, 1.0, gold) * (1.0 - smoothstep(9.0, 16.0, t) * 0.8); size *= 1.0 + gold * 0.6;
    }
  }
  float tw = 0.55 + 0.45 * sin(uTime * (5.0 + sd * 9.0) + sd * 100.0);
  vec4 mv = modelViewMatrix * vec4(p, 1.0); vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
  float px = uPx * size / max(vDist, 1.0), cap = mix(22.0, 30.0, near);
  gl_PointSize = clamp(px, 1.5, cap);
  // a moth right at the basket does not blind us; the ribbon's own moths come close and large, as wings, and thin as they grow
  float fadeN = mix(0.25 + 0.75 * smoothstep(5.0, 22.0, vDist), smoothstep(4.0, 12.0, vDist) * mix(1.0, 0.6, smoothstep(12.0, 30.0, px)), near);
  vA = a * tw * clamp(px / 1.5, 0.25, 1.0) * fadeN; vGold = gold;
  vWing = vec2(smoothstep(7.0, 16.0, min(px, cap)), 0.35 + 0.65 * abs(sin(uTime * (9.0 + sd * 7.0) + sd * 50.0)));
}`;
const MOTH_FRAG = /* glsl */`
uniform vec3 uGold, uSky;
varying float vA, vGold, vDist; varying vec2 vWing;
${GLSL_ADDFOG}
void main() {
  vec2 q = clamp(gl_PointCoord, 0.0, 1.0) - 0.5; float d = length(q * vec2(1.0, 1.7));
  float m = (1.0 - smoothstep(0.08, 0.5, d));
  if (vWing.x > 0.0) {                                 // close to, a glass-moth is two beating wings and a bright body
    vec2 w = vec2(abs(q.x) / max(vWing.y, 0.25), q.y - 0.22 * abs(q.x));               // wings swept back from a narrow waist
    float wing = (1.0 - smoothstep(0.14, 0.3, length((w - vec2(0.24, -0.02)) * vec2(1.0, 0.82)))) * smoothstep(0.0, 0.07, abs(q.x));
    float body = (1.0 - smoothstep(0.02, 0.07, length(q * vec2(2.6, 0.75))));
    m = mix(m, max(wing * 0.85, body), vWing.x);
  }
  vec3 c = mix(uSky * 0.7, uGold * vec3(1.0, 0.8, 0.5) * 2.4, vGold);
  gl_FragColor = vec4(c * m * vA * addFog(vDist, 0.6), 1.0);
}`;

// Halos: one camera-facing quad per bell. position = centre, uv = corner, aData = (delay, size, seed, gain)
const HALO_VERT = /* glsl */`
attribute vec4 aPivot; attribute vec4 aData; attribute float aPre;
varying vec2 vQ; varying float vG, vDist, vPil;
${GLSL_COMMON}
void main() {
  vQ = uv * 2.0 - 1.0; vPil = aPivot.z;
  float g = max(tollEnv(uS - aData.x, aData.z, 4.0 + aData.z * 5.0), tollPre(aPre, aData.z, 4.0 + aData.z * 5.0));
  vG = g * aData.w;
  vec4 mv = modelViewMatrix * vec4(position + vec3(0.0, aPivot.y, 0.0), 1.0);   // aPivot = (how much taller than wide, how far above its bell): a far toll blooms up into the mist
  vDist = max(-mv.z, 1.0);
  float push = (vDist + aData.y * 0.7) / vDist;        // the glow hangs in the mist BEHIND its bell, so stalks cut out black against it
  mv.xyz *= push;
  mv.xy += vQ * vec2(1.0, 1.0 + aPivot.x) * aData.y * 1.3 * (0.8 + 0.2 * min(g, 1.0)) * push;
  gl_Position = projectionMatrix * mv;
}`;
const HALO_FRAG = /* glsl */`
uniform vec3 uGold; uniform float uHaloK;
varying vec2 vQ; varying float vG, vDist, vPil;
${GLSL_ADDFOG}
void main() {
  float r = min(length(vQ), 1.5); if ((r > 1.0 && vPil < 0.5) || vG < 0.002) discard;
  float h = max(exp(-r * r * 4.6) - 0.01, 0.0);            // a bloom with no edge
  if (vPil > 0.5) {                                        // a far toll's light thrown up into the mist: a pale column over a bloom at its foot
    float qx = clamp(vQ.x, -1.0, 1.0), qy = clamp(vQ.y, -1.0, 1.0);          // the quad's own range, before anything is squared
    float up = 0.5 - 0.5 * qy, foot = (qy + 0.8) * 5.0;
    h = max(exp(-qx * qx * 5.0) - 0.007, 0.0) * (0.4 * up * up * smoothstep(-1.0, -0.84, qy) + 1.0 * exp(-foot * foot)) * (1.0 - smoothstep(0.7, 1.0, abs(qx)));
  }
  float pale = mix(1.0, 0.42, smoothstep(320.0, 1250.0, vDist));          // the blooms pale step by step toward the limit of sight
  gl_FragColor = vec4(mix(uGold, vec3(dot(uGold, vec3(0.3, 0.5, 0.2))), 0.25 * (1.0 - h)) * h * vG * uHaloK * pale * addFog(vDist, 0.33), 1.0);
}`;

// Water decal (premultiplied): contact darkening, gold flash, the gold column of the lit bell, chime-fish rings
const WATER_VERT = /* glsl */`
varying vec3 vL; varying float vDist;
void main() { vL = position; vec4 mv = modelViewMatrix * vec4(position, 1.0); vDist = -mv.z; gl_Position = projectionMatrix * mv; }`;
const WATER_FRAG = /* glsl */`
uniform vec3 uGold, uSky; uniform float uSeed;
varying vec3 vL; varying float vDist;
${GLSL_COMMON}
${GLSL_ADDFOG}
void main() {
  vec2 p = vL.xy; float r = length(p);
  float edge = 1.0 - smoothstep(170.0, 215.0, r);
  float dark = 0.34 * (1.0 - smoothstep(30.0, 95.0, r));
  float g = tollEnv(uS - 0.35, 0.2, 6.0);
  float rip = 0.0;                                       // chime-fish: a ring of small expanding circles under the lip
  for (int i = 0; i < 14; i++) {
    float fi = float(i), a = fi * 0.4488 + uSeed, rr = 52.0 + 9.0 * fract(sin(fi * 12.9 + uSeed) * 43758.5);
    float t0 = 1.1 + fract(sin(fi * 78.2 + uSeed) * 9631.3) * 1.4, t = mod(max(uS - t0, 0.0), 6.5);
    float d = distance(p, rr * vec2(sin(a), cos(a))), R = t * 5.5;
    float wq = (d - R + 3.0) / 4.5;
    float w = sin((d - R) * 1.6) * exp(-wq * wq) * exp(-t * 0.45) * step(t0, uS);
    rip += w;
  }
  float bq = (r - (uS - 0.3) * 24.0) / 9.0;
  float big = sin((r - (uS - 0.3) * 24.0) * 0.5) * exp(-bq * bq) * step(0.3, uS) * exp(-max(uS, 0.0) * 0.25);
  rip += big * 1.5;
  float sh = 0.75 + 0.25 * sin(r * 0.9 - uTime * 1.4 + sin(p.x * 0.21) * 2.0);
  vec3 add = uGold * g * (1.6 * exp(-r * r / 2600.0) + 0.5 * exp(-(r - 58.0) * (r - 58.0) / 49.0)) * sh;
  add += (uSky * 0.35 + uGold * g * 1.2) * max(rip, 0.0);
  float a = clamp(dark + max(-rip, 0.0) * 0.35, 0.0, 0.8) * edge;
  float f = addFog(vDist, 1.0);
  gl_FragColor = vec4(add * edge * f, a * f);
}`;

// shared with the world file: the grove's own trees are built into the same vertex layout and drawn with the hero's materials
export { Buf, lathe, tube, blob, spline, GLSL_COMMON, GLSL_ADDFOG };

// ---------- the hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('bourdon') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE);
  const P = pal.map(lin);
  const PEARL = P[0], CELADON = P[2], DEEP = P[3], FAR = P[4], LACQ = P[5];
  const PALE = mix3(CELADON, PEARL, 0.6), WOOD = mix3(FAR, P[1], 0.25), ROPE = mix3(LACQ, FAR, 0.6);

  // per-seed character of the bell
  const shoulderK = rng.range(0.2, 0.28), flare = rng.range(16, 21), shoulderR = rng.range(14, 19), slow = MOUTH_R - COLLAR_R - shoulderR - flare;
  const lobes = rng.pick([0, 5, 6, 6, 7, 8]), scal = lobes ? rng.range(0.9, 2.4) : 0, scalPh = rng.range(0, TAU);
  const waist = rng.range(0, 2.0), seedA = rng(), archRot = rng.range(-0.2, 0.2), kink = rng.range(3, 8);
  const prof = (t, a) => {
    const sh = Math.pow(Math.sin(Math.min(t / shoulderK, 1) * Math.PI / 2), 0.8), t6 = t ** 6;
    const sc = scal * Math.cos(lobes * a + scalPh);
    const r = COLLAR_R + shoulderR * sh + slow * t + flare * t * t * t * t - waist * Math.sin(Math.PI * clamp((t - 0.3) / 0.6, 0, 1)) + sc * t6 * t * t
      + 0.5 * Math.sin(a * 3 + seedA * 9) * t;
    return [r, CROWN_Y - (CROWN_Y - RIM_Y) * Math.pow(t, 1.2) - sc * 1.1 * t6 * t6];
  };
  const tOfY = (y) => Math.pow(clamp((CROWN_Y - y) / (CROWN_Y - RIM_Y), 0, 1), 1 / 1.2);
  const rAt = (y, a = 0) => prof(tOfY(y), a)[0];

  // ================= GLASS =================
  await ctx.yield?.();
  const glass = new Buf(); glass.mdec = 2;                            // the lake mirror draws the bell at half its grid
  const Y = ctx.yield ? () => ctx.yield() : null;
  const wallCol = (t) => mix3(CELADON, DEEP, t ** 3);
  glass.set([0, 0, 0, 0], [0, 24, seedA, 0]);
  await latheSlow(glass, 96, 60, prof, wallCol, Y);
  await ctx.yield?.();
  // 24 raised ribs, one on every primary vein (vein centres sit at (k + 0.5) / 24)
  glass.set([0, 0, 0, 0], [0, 24, seedA, 2]);
  for (let k = 0; k < 24; k++) {
    const a = ((k + 0.5) / 24) * TAU, pts = [];
    for (let j = 0; j <= 36; j++) {
      const t = lerp(0.012, 0.992, j / 36), [r, y] = prof(t, a);
      pts.push(V3(Math.sin(a) * (r + 0.3), y + 0.15, Math.cos(a) * (r + 0.3)));
    }
    tube(glass, pts, 4, (t) => lerp(0.75, 0.5, t) + 0.35 * t ** 8, () => PALE, { ref: V3(Math.sin(a), 0, Math.cos(a)), phase: Math.PI / 4 });
    if (k % 6 === 5) await ctx.yield?.();
  }
  // the lip: a 4 m bead of saturated glass following the scalloped rim
  glass.set([0, 0, 0, 0], [0, 24, seedA, 3]);
  lathe(glass, 96, 12, (t, a) => { const [r, y] = prof(1, a), ph = -t * TAU; return [r + 0.3 + 2.0 * Math.cos(ph), y - 1.6 + 2.3 * Math.sin(ph)]; }, () => DEEP);
  await ctx.yield?.();

  // clapper geometry numbers (needed for the strike point before the side bells get their delays)
  const HINGE = V3(0, 228.4, 9.6), STEM = 158, SEED_R = 6;
  let strikeAng = 0.2;
  for (let ph = 0.05; ph < 0.6; ph += 0.002) {
    const y = HINGE.y - STEM * Math.cos(ph), z = HINGE.z + STEM * Math.sin(ph);
    if (z + SEED_R * 0.92 >= rAt(y) - 0.6) { strikeAng = ph; break; }
  }
  const seedRest = V3(0, HINGE.y - STEM * Math.cos(strikeAng), HINGE.z + STEM * Math.sin(strikeAng));
  const strike = V3(0, seedRest.y, rAt(seedRest.y));

  // ================= SOLIDS: arch of three fused stalks =================
  const solid = new Buf(); solid.mdec = 2;
  const nz = ctx.noise, lacq = (k) => mix3(LACQ, FAR, clamp(k, 0, 1));
  const stalkPts = [], feet = [];
  for (let k = 0; k < 3; k++) {
    const th = archRot + Math.PI / 3 + k * TAU / 3, sx = Math.sin(th), sz = Math.cos(th), tx = Math.cos(th), tz = -Math.sin(th);
    const lean = rng.range(-4, 4), bow = rng.range(0, 7);
    const cyl = [[FOOT_R, -3], [FOOT_R - 1, 18], [FOOT_R - 3 + bow * 0.4, 62], [82 + bow, 128], [70 + bow * 0.6, 192], [47, 238], [20, 257], [0, APEX_Y]];
    const ctrl = cyl.map(([r, y], i) => {
      const f = Math.sin(Math.PI * clamp(i / (cyl.length - 1), 0, 1)) * (i > 0 ? 1 : 0);
      const tg = (lean + kink * nz.n2(k * 7.3 + 1.1, i * 0.9)) * f;
      return V3(sx * r + tx * tg, y, sz * r + tz * tg);
    });
    const pts = spline(ctrl, 76); stalkPts.push({ pts, sx, sz, tx, tz });
    feet.push(V3(sx * FOOT_R, 0, sz * FOOT_R));
    await ctx.yield?.();
    const nodes = []; for (let t = 0.05 + rng() * 0.03; t < 0.97; t += rng.range(0.05, 0.09)) nodes.push(t);
    const node = (t) => { let s = 0; for (const n of nodes) { const d = (t - n) / 0.007; s += Math.exp(-d * d); } return s; };
    solid.set([0, 0, 0, 0], [0, 0, rng(), 0]);
    tube(solid, pts, 14,
      (t, ph) => lerp(4.8, 1.9, Math.pow(t, 0.75)) * (1 + 0.8 * Math.exp(-t * 34)) * (1 + 0.075 * Math.cos(7 * ph)) * (1 + 0.24 * node(t))
        * (1 + 0.06 * nz.n2(t * 30 + k * 11, ph * 0.7)),
      (t, ph) => lacq(0.1 + 0.22 * (0.5 + 0.5 * Math.cos(7 * ph)) + 0.35 * node(t) + 0.15 * nz.n2(t * 50 + k * 5, ph)),
      { ref: V3(tx, 0, tz), twist: rng.range(-2.5, 2.5) });
    await ctx.yield?.();
    // buttress roots splaying into the lake
    const nRoots = rng.int(4, 6), r0 = rng() * TAU;
    for (let i = 0; i < nRoots; i++) {
      const a = r0 + (i / nRoots) * TAU + rng.range(-0.3, 0.3), len = rng.range(11, 21), h = rng.range(9, 19);
      const ox = Math.sin(a), oz = Math.cos(a), b = feet[k];
      const rp = spline([V3(b.x + ox * 2.5, h, b.z + oz * 2.5), V3(b.x + ox * len * 0.4, h * 0.55, b.z + oz * len * 0.4),
        V3(b.x + ox * len * 0.8, 1.2, b.z + oz * len * 0.8), V3(b.x + ox * len, -2.5, b.z + oz * len)], 9);
      tube(solid, rp, 6, (t) => lerp(1.7, 0.55, t) * (1 + 0.5 * Math.exp(-t * 9)), (t, ph) => lacq(0.12 + 0.2 * Math.cos(3 * ph) ** 2), {});
    }
    // crooked thorn spurs up the stalk (tertiary silhouette breakup)
    for (const n of nodes) {
      if (n < 0.1 || !rng.chance(0.55)) continue;
      const b = pts[Math.round(n * 76)], a = rng() * TAU, L = rng.range(3.5, 8) * (1.2 - n * 0.6);
      const d = V3(sx * Math.cos(a) * 0.6 + tx * Math.sin(a), 0.5, sz * Math.cos(a) * 0.6 + tz * Math.sin(a)).normalize();
      const sp = spline([b.clone(), b.clone().addScaledVector(d, L * 0.6).add(V3(0, L * 0.25, 0)), b.clone().addScaledVector(d, L).add(V3(0, L * 0.9, 0))], 5);
      solid.mdec = 0; tube(solid, sp, 5, (t) => lerp(0.9, 0.08, t), () => lacq(0.2), {}); solid.mdec = 2;
    }
  }
  await ctx.yield?.();

  // apex knot where the three stalks fuse, tendons down to the collar
  solid.set([0, 0, 0, 0], [0, 0, rng(), 0]);
  blob(solid, V3(0, APEX_Y - 0.5, 0), 6.2, 4.6, 6.2, 18, 10, (t, a) => lacq(0.15 + 0.25 * Math.cos(3 * a + 1) ** 2 * t),
    (a, t) => 1 + 0.16 * Math.cos(3 * (a - archRot) + Math.PI) * Math.sin(t * Math.PI) + 0.07 * nz.n2(a * 2, t * 5));
  for (let k = 0; k < 3; k++) {
    const a = archRot + k * TAU / 3;      // between the stalks
    const tp = spline([V3(Math.sin(a) * 2.5, APEX_Y - 3.5, Math.cos(a) * 2.5), V3(Math.sin(a) * 6.5, 246, Math.cos(a) * 6.5),
      V3(Math.sin(a) * 10.4, 237, Math.cos(a) * 10.4), V3(Math.sin(a) * 11.4, 231.2, Math.cos(a) * 11.4)], 8);
    tube(solid, tp, 6, (t) => 0.75 + 0.5 * Math.exp(-t * 8) + 0.45 * Math.exp(-(1 - t) * 8), (t, ph) => lacq(0.2 + 0.2 * Math.sin(t * 40) ** 2), { twist: 5 });
  }
  // collar ring (22 m across) with a stud where every vein lands (nothing of the crown is ever seen in the lake)
  solid.mdec = 0;
  lathe(solid, 48, 8, (t) => { const ph = -t * TAU; return [COLLAR_R + 0.5 + 1.25 * Math.cos(ph), CROWN_Y + 0.4 + 1.7 * Math.sin(ph)]; },
    (t, a) => lacq(0.02 + 0.08 * (0.5 + 0.5 * Math.cos(24 * a)) * (t > 0.5 ? 1 : 0.4)));
  for (let k = 0; k < 24; k++) {
    const a = ((k + 0.5) / 24) * TAU;
    blob(solid, V3(Math.sin(a) * (COLLAR_R + 1.6), CROWN_Y - 0.5, Math.cos(a) * (COLLAR_R + 1.6)), 0.75, 1.0, 0.75, 6, 4, () => lacq(0.1));
  }
  // portal seat ring on three spokes, tipped to meet the camera's final line
  const tilt = THREE.MathUtils.degToRad(opts.seatTilt ?? 20), SEAT = V3(0, 226, 0), SEAT_R = 7.7;
  const seatN = V3(0, -Math.cos(tilt), -Math.sin(tilt));            // the way the portal faces (down and toward -Z)
  const seatPt = (a, r) => V3(Math.sin(a) * r, SEAT.y - Math.cos(a) * r * Math.tan(tilt), Math.cos(a) * r);
  const ringPts = []; for (let i = 0; i <= 48; i++) ringPts.push(seatPt((i / 48) * TAU, SEAT_R));
  tube(solid, ringPts, 6, () => 0.5, (t, ph) => lacq(0.03 + 0.07 * Math.cos(ph) ** 2), {});
  for (let k = 0; k < 3; k++) {
    const a = archRot + Math.PI / 3 + k * TAU / 3, p0 = seatPt(a, SEAT_R + 0.2);
    tube(solid, [p0, V3(Math.sin(a) * 9.4, lerp(p0.y, 229.2, 0.6), Math.cos(a) * 9.4), V3(Math.sin(a) * 10.9, 229.6, Math.cos(a) * 10.9)], 5,
      (t) => 0.36 + 0.25 * t, () => lacq(0.04), {});
    solid.set([0, 0, 0, 0], [0, 0, rng(), 2]);                      // a cold lamp at the root of each spoke
    blob(solid, V3(Math.sin(a) * 9.2, 227.4, Math.cos(a) * 9.2), 0.42, 0.55, 0.42, 6, 4, () => PEARL);
    solid.set([0, 0, 0, 0], [0, 0, rng(), 0]);
  }

  await ctx.yield?.();
  // the calyx: twelve lacquer sepals lie against the inside of the crown between the ribs, so the collar reads as a
  // black flower 45 m across with the portal at its heart
  solid.set([0, 0, 0, 0], [0, 0, 0.21, 0]);
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * TAU, tEnd = k % 2 ? 0.078 : 0.115, pts = [];
    for (let j = 0; j <= 9; j++) { const [r, y] = prof(lerp(0.004, tEnd, j / 9), a); pts.push(V3(Math.sin(a) * (r - 0.55), y - 0.45, Math.cos(a) * (r - 0.55))); }
    tube(solid, pts, 6, (q) => (0.22 + 1.9 * Math.pow(Math.sin(Math.PI * Math.pow(q, 0.55)), 1.2)) * (1 - 0.92 * q ** 5),
      (q, ph) => lacq(0.03 + 0.16 * Math.cos(ph) ** 2 * (1 - q)), { ref: V3(Math.cos(a), 0, -Math.sin(a)), flat: 0.2 });
  }
  solid.mdec = 2;

  // ================= first-catch bells on crooked branchlets of the arch =================
  const sideBells = [], halo = new Buf();
  const nSide = opts.sideBells ?? rng.int(10, 14);
  const addHalo = (c, size, delay, gain, sd) => {
    halo.set([0, 0, 0, 0], [delay, size, sd, gain]);
    const b = halo.count; for (let i = 0; i < 4; i++) halo.v(c.x, c.y, c.z, 0, 1, 0, i & 1, i >> 1, PEARL);
    halo.quad(b, b + 1, b + 2, b + 3);
  };
  addHalo(V3(0, 138, 0), 150, 0.35, 0.085, 0.37);
  for (let i = 0; i < nSide; i++) {
    const st = stalkPts[i % 3], s = lerp(0.2, 0.8, (Math.floor(i / 3) + rng()) / Math.ceil(nSide / 3));
    const base = st.pts[Math.round(s * 76)];
    const side = (i % 2 ? 1 : -1) * rng.range(0.25, 1.15), ca = Math.cos(side), sa = Math.sin(side);
    const out = V3(st.sx * ca + st.tx * sa, 0, st.sz * ca + st.tz * sa);
    const L = rng.range(15, 28), R = rng.range(3.4, 6.6), tl = rng.range(5, 9), H = R * rng.range(2.1, 2.5);
    const tip = base.clone().addScaledVector(out, L).add(V3(0, L * 0.42, 0));
    const lowest = tip.y - tl - H;
    if (lowest < 7 || (Math.abs(tip.x) < R + 18 && tip.z > 30 && lowest < 62)) continue;      // keep the lake and the aisle clear
    const crook = spline([base.clone(), base.clone().addScaledVector(out, L * 0.35).add(V3(0, L * 0.5, 0)),
      base.clone().addScaledVector(out, L * 0.78).add(V3(0, L * 0.72, 0)), tip.clone().add(V3(0, 1.2, 0)), tip.clone().addScaledVector(out, L * 0.06).add(V3(0, -2.2, 0))], 14);
    solid.set([0, 0, 0, 0], [0, 0, rng(), 0]);
    tube(solid, crook, 6, (t) => lerp(1.25, 0.32, Math.pow(t, 0.7)) * (1 + 0.3 * Math.exp(-t * 12)), (t, ph) => lacq(0.15 + 0.25 * Math.cos(2 * ph) ** 2), {});
    const sd = rng(), per = 4 + (R - 3.4) / 3.2 * 2.6, top = tip.y - tl, c = V3(tip.x, top - H * 0.5, tip.z);
    const delay = 0.35 + (c.distanceTo(strike) / 90) * rng.range(0.7, 1.3);
    const piv = [tip.x, tip.y - 1.5, tip.z, per], nv = rng.int(12, 16), fl = rng.range(0.14, 0.24), sk = rng.range(0.26, 0.36);
    const bp = (t) => [R * (0.07 + (0.75 - fl) * Math.pow(Math.sin(Math.min(t / sk, 1) * Math.PI / 2), 0.8) + 0.18 * t + fl * t ** 6), top - H * Math.pow(t, 1.15)];
    glass.set(piv, [delay, nv, sd, 1]);
    lathe(glass, 28, 13, bp, wallCol, tip.x, tip.z);
    glass.set(piv, [delay, nv, sd, 3]); glass.mdec = 0;
    lathe(glass, 28, 5, (t) => { const ph = -t * TAU; return [R + 0.05 + 0.2 * Math.cos(ph), top - H - 0.1 + 0.26 * Math.sin(ph)]; }, () => DEEP, tip.x, tip.z);
    glass.mdec = 2;
    // tendon, clapper stem and ember seed swing with the bell
    solid.set(piv, [delay, 0, sd, 0]);
    tube(solid, [V3(tip.x, tip.y - 1.5, tip.z), V3(tip.x, top + 0.2, tip.z)], 4, () => 0.2, () => lacq(0.3), {});
    blob(solid, V3(tip.x, top + 0.1, tip.z), R * 0.12, R * 0.1, R * 0.12, 6, 4, () => lacq(0.35));
    tube(solid, [V3(tip.x, top, tip.z), V3(tip.x, top - H * 0.78, tip.z)], 3, () => 0.11, () => lacq(0.2), {});
    solid.set(piv, [delay, 0, sd, 1]);
    blob(solid, V3(tip.x, top - H * 0.8, tip.z), R * 0.17, R * 0.22, R * 0.17, 8, 6, () => P[6]);
    addHalo(c, R * 5, delay, 0.16, sd);
    sideBells.push({ position: c, radius: R, delay });
    if (i % 3 === 2) await ctx.yield?.();
  }
  await ctx.yield?.();

  // ================= tuning gallery under the lip =================
  if (opts.gallery !== false) {
    const GR = MOUTH_R + 5.5, GY = 42.5, N = 132, gap = 0.5;       // open for +-0.5 rad at the front (the camera's way in)
    const inGap = (a) => { const d = Math.abs(((a + Math.PI) % TAU) - Math.PI); return d < gap; };
    const gp = (a, r, y) => V3(Math.sin(a) * r, y, Math.cos(a) * r);
    solid.mdec = 1;
    for (let i = 0; i < N; i++) {                                    // separate planks, two tones, each a little askew
      const a0 = (i / N) * TAU, a1 = ((i + 0.74) / N) * TAU, am = (a0 + a1) / 2;
      if (inGap(am)) continue;
      const sag = 0.35 * Math.sin(i * 1.9) + 0.5 * Math.cos(am * 6), tone = (i % 2 ? 0.1 : 0.55) + rng() * 0.3, skew = 0.25 * Math.sin(i * 2.7);
      solid.set([0, 0, 0, 0], [0, 0.16, rng(), 3]);
      tube(solid, [gp(a0, GR + skew, GY + sag), gp(a1, GR - skew, GY + sag)], 4, () => 1.5 + 0.2 * Math.sin(i * 4.1), () => mix3(mix3(WOOD, PEARL, 0.12), FAR, tone),
        { ref: V3(Math.sin(am), 0, Math.cos(am)), phase: Math.PI / 4, flat: 0.1 });
      if (i % 4 === 0) {                                            // rope hangers up to the lip
        const [lr, ly] = prof(1, am); solid.data = [0, 0.2, solid.data[2], 3];
        tube(solid, [gp(am, GR + 1.2, GY + sag), gp(am, lr + 1.6, ly - 1.2)], 4, () => 0.2, () => ROPE, {});
        tube(solid, [gp(am, GR - 1.2, GY + sag), gp(am, lr - 1.2, ly - 3.2)], 4, () => 0.2, () => ROPE, {});
      }
      if (i % 9 === 3) {
        solid.set([0, 0, 0, 0], [0, 0, rng(), 2]);
        blob(solid, gp(am, GR + 1.3, GY + sag + 1.7), 0.45, 0.6, 0.45, 6, 4, () => PEARL);
      }
      if (i % 44 === 43) await ctx.yield?.();
    }
    solid.set([0, 0, 0, 0], [0, 0.2, rng(), 3]);
    for (const [aS, aE] of [[gap, Math.PI], [Math.PI, TAU - gap]]) {      // rope handrail, and two stringers that carry the planks as one line
      const hp = [], s1 = [], s2 = [];
      for (let i = 0; i <= 40; i++) { const a = lerp(aS, aE, i / 40); hp.push(gp(a, GR + 1.05, GY + 1.25 + 0.12 * Math.sin(i * Math.PI * 0.5))); s1.push(gp(a, GR + 1.1, GY - 0.2 + 0.5 * Math.cos(a * 6))); s2.push(gp(a, GR - 1.1, GY - 0.2 + 0.5 * Math.cos(a * 6))); }
      tube(solid, hp, 4, () => 0.2, () => ROPE, {}); tube(solid, s1, 4, () => 0.2, () => ROPE, {}); tube(solid, s2, 4, () => 0.2, () => ROPE, {});
    }
    for (const la of [rng.range(1.4, 2.2), rng.range(3.9, 4.9), 0.5 + 0.2, TAU - 0.72]) {   // ladders hanging to the water, one each side of the way in
      const tx = Math.cos(la), tz = -Math.sin(la);
      for (const s of [-0.45, 0.45]) {
        const b = gp(la, GR + 1.2, GY); b.x += tx * s; b.z += tz * s;
        tube(solid, [b, V3(b.x, -0.5, b.z)], 4, () => 0.16, () => ROPE, {});
      }
      for (let y = 1; y < GY; y += 2.2) { const c = gp(la, GR + 1.2, y); solid.data = [0, 0.13, 0.5, 3]; tube(solid, [V3(c.x - tx * 0.5, y, c.z - tz * 0.5), V3(c.x + tx * 0.5, y, c.z + tz * 0.5)], 3, () => 0.13, () => WOOD, {}); }
    }
    solid.mdec = 2;
  }
  await ctx.yield?.();

  // ================= the clapper: hinge, stem, ember seed (hangs along -Y from its hinge) =================
  const clap = new Buf(); clap.mdec = 2;
  clap.set([0, 0, 0, 0], [0, 0, 0.5, 0]);
  blob(clap, V3(0, 0, 0), 1.3, 1.1, 1.3, 8, 6, () => lacq(0.4));
  clap.set([0, 0, 0, 0], [0, 0.5, 0.5, 0]);
  // the stem is a made thing like the cords of the chimes round it: twisted lacquer, thicker toward the seed, jointed about
  // every 8 m (as the cords are beaded), each joint a bead of the lip's glass, paler than the lacquer
  const JOINTS = 18, joint = (t) => Math.exp(-(((((t * JOINTS) % 1) - 0.5) / 0.12) ** 2));
  const stemPts = []; for (let i = 0; i <= JOINTS * 6; i++) stemPts.push(V3(0, -(i / (JOINTS * 6)) * (STEM - SEED_R * 1.1), 0));
  tube(clap, stemPts, 6, (t) => lerp(0.5, 0.85, t) * (1 + 0.8 * joint(t)) + 1.2 * Math.exp(-(1 - t) * 40),
    (t, ph) => mix3(lacq(0.15 + 0.3 * Math.cos(ph) ** 2), mix3(DEEP, PEARL, 0.5), 0.8 * joint(t)), { twist: 6 });
  clap.set([0, 0, 0, 0], [0, 0, 0.5, 0]);
  blob(clap, V3(0, -STEM + SEED_R * 1.05, 0), 2.6, 1.8, 2.6, 10, 5, (t) => lacq(0.2 + 0.3 * t), (a) => 1 + 0.15 * Math.cos(5 * a));   // calyx
  clap.set([0, 0, 0, 0], [0, 1, 0.5, 1]);
  blob(clap, V3(0, -STEM, 0), SEED_R, SEED_R * 1.22, SEED_R, 20, 14, () => P[6], (a, t) => (1 + 0.05 * Math.cos(8 * a) * Math.sin(t * Math.PI)) * (0.82 + 0.18 * Math.sin(Math.min(1, t * 1.6) * Math.PI / 2)));
  await ctx.yield?.();

  // ================= glass-moths =================
  const NM = Math.round(1500 * (ctx.quality?.detail ?? 1)) + 2600, NHELIX = 2600, mp = new Float32Array(NM * 3), md = new Float32Array(NM * 4), ms = new Float32Array(NM * 4);
  const streams = []; for (let i = 0; i < 7; i++) streams.push((i / 7) * TAU + rng.range(-0.3, 0.3));
  for (let i = 0; i < NM; i++) {
    const t = lerp(0.08, 1, Math.pow(rng(), 0.7)), a = rng() * TAU, [r, y] = prof(t, a);
    const x = Math.sin(a) * (r + 0.7), z = Math.cos(a) * (r + 0.7);
    mp[i * 3] = x; mp[i * 3 + 1] = y; mp[i * 3 + 2] = z;
    let best = 0, bd = 9; for (const sa of streams) { const d = Math.abs(((sa - a + Math.PI * 3) % TAU) - Math.PI); if (d < bd) { bd = d; best = sa; } }
    const da = best + rng.gauss() * 0.1, el = 0.06 + rng.gauss() * 0.09;
    md[i * 4] = Math.sin(da); md[i * 4 + 1] = el; md[i * 4 + 2] = Math.cos(da); md[i * 4 + 3] = rng.range(45, 175);
    ms[i * 4] = rng(); ms[i * 4 + 1] = i < NHELIX ? 1 : 0; ms[i * 4 + 2] = rng.range(0.45, 1.0);
    if (i < NHELIX) md[i * 4 + 3] = ((i + 0.5) / NHELIX) * 176;            // a helix moth's place along the ribbon
    ms[i * 4 + 3] = Math.hypot(x - strike.x, y - strike.y, z - strike.z) / 125;
    if (i % 1400 === 1399) await ctx.yield?.();
  }
  // the way up the inside (the anchors hand the same points to the world); the world's path is this curve from the lip on
  const FLY = [V3(0, 35, 260), V3(0, 35, 150), V3(0, 36, 75), V3(0, 40, 40), V3(-14, 58, 12), V3(-22, 84, -10), V3(-19, 112, -24),
    V3(-7, 141, -25), V3(0, 226 - 60 * Math.cos(tilt), -60 * Math.sin(tilt)), SEAT.clone()];
  const flyS = new THREE.CatmullRomCurve3([...FLY.slice(1, 9), V3(0, 226 - 30 * Math.cos(tilt), -30 * Math.sin(tilt)), SEAT.clone()], false, 'centripetal').getPoints(280);
  const flyDist = (p) => { let b = 1e9; for (const q of flyS) { const d = q.distanceToSquared(p); if (d < b) b = d; } return Math.sqrt(b); };
  await ctx.yield?.();

  // ================= chimes inside the bell =================
  // Smaller bells hang on long tendons from the inner ribs at every height, clear of the flight and of the clapper, some with a
  // cluster of handbells strung above them: the climb passes glass and embers near, in the middle distance and far. They catch the
  // toll by hop delay and go on swinging and re-striking with the after-shimmer. (Their own random stream: nothing else is redrawn.)
  const rx = makeRng(hashSeed('bourdon-chimes:' + (ctx.seed ?? 1))), chimes = [];
  {
    const stemD = seedRest.clone().sub(HINGE), stemL2 = stemD.lengthSq(), tmp = V3(0, 0, 0);
    const stemDist = (c) => { const t = clamp(tmp.copy(c).sub(HINGE).dot(stemD) / stemL2, 0, 1); return tmp.copy(HINGE).addScaledVector(stemD, t).distanceTo(c); };
    // A cord is a made thing of the grove, in scale with the bell it carries (R = the bell's radius): a rod of the lip's deep
    // glass drawn fine, tapering from R / 22 where it leaves its crook to R / 44 at the bell (a bell 3 m across hangs on a
    // finger's width), with a bead of pale glass about every 8 m
    const cord = (piv, delay, sd, x, z, yTop, yBot, R) => {
      const L = yTop - yBot, nk = Math.max(1, Math.round(L / 8)), r0 = R / 22, r1 = R / 44, kw = R * 0.12, ys = [[yTop, 0]];
      for (let j = 0; j < nk; j++) { const y = yTop - L * (j + 0.5 + 0.3 * (((sd * 17 + j * 0.37) % 1) - 0.5)) / nk; ys.push([y + kw, 0], [y, 1], [y - kw, 0]); }
      ys.push([yBot, 0]);
      const m = ys.length, at = (t) => ys[Math.round(t * (m - 1))];
      solid.set(piv, [delay, r1, sd, 0]);
      tube(solid, ys.map(([y]) => V3(x, y, z)), 5, (t) => lerp(r0, r1, (yTop - at(t)[0]) / L) * (1 + 2.2 * at(t)[1]), (t) => mix3(mix3(DEEP, LACQ, 0.3), PEARL, 0.55 * at(t)[1]), {});
    };
    // and it hangs from a crook that grows out of the rib, as every bell of the grove hangs from one: R tall, tapering to its tip,
    // of the rib's own pale glass where it leaves the rib and of the cord's deep glass where the cord takes over
    const crook = (a, r0, y0, R, sd) => {
      const s = Math.sin(a), c = Math.cos(a), P = (r, y) => V3(s * r, y, c * r);
      solid.set([0, 0, 0, 0], [0, R / 30, sd, 0]);
      tube(solid, spline([P(rAt(y0 - R, a) + 0.1, y0 - R), P(r0 + 0.5, y0 - R * 0.35), P(r0 + 0.12, y0 + R * 0.1), P(r0 - 0.04, y0 + R * 0.03), P(r0, y0 - R * 0.12)], 7), 5,
        (t) => R * lerp(0.11, 0.035, Math.pow(t, 0.7)), (t) => mix3(mix3(CELADON, PEARL, 0.4), mix3(DEEP, LACQ, 0.3), t), {});
    };
    const smallBell = (piv, x, top, z, R, H, delay, sd, segA, segT, lip) => {
      const nv = 10 + Math.floor(sd * 5), fl = 0.14 + 0.1 * ((sd * 7) % 1), sk = 0.26 + 0.1 * ((sd * 13) % 1);
      const bp = (t) => [R * (0.07 + (0.75 - fl) * Math.pow(Math.sin(Math.min(t / sk, 1) * Math.PI / 2), 0.8) + 0.18 * t + fl * t ** 6), top - H * Math.pow(t, 1.15)];
      glass.set(piv, [delay, nv, sd, 1]); lathe(glass, segA, segT, bp, wallCol, x, z);
      if (lip) { glass.set(piv, [delay, nv, sd, 3]); lathe(glass, segA, 2, (t) => { const ph = -t * TAU; return [R + 0.04 + 0.13 * Math.cos(ph), top - H - 0.08 + 0.2 * Math.sin(ph)]; }, () => DEEP, x, z); }
      solid.set(piv, [delay, 0, sd, 1]);
      blob(solid, V3(x, top - H * 0.8, z), R * 0.2, R * 0.26, R * 0.2, 6, 3, () => P[6]);
    };
    const hang = (a, y0, L, R, chance) => {
      const H = R * rx.range(2.1, 2.5), r0 = rAt(y0, a) - 0.9, x = Math.sin(a) * r0, z = Math.cos(a) * r0, top = y0 - L, c = V3(x, top - H * 0.5, z), sd = rx();
      const cluster = rx.chance(chance), reach = R + (cluster ? R * 0.9 : 0);
      if (top - H < 58 || rAt(top - H, a) - r0 < reach + 1.2) return false;                    // above the mouth, off the wall
      if (flyDist(c) < 9.5 + H * 0.5 + 0.14 * (L + H * 0.5) || stemDist(c) < 5 + reach + 0.14 * L) return false;   // clear of the flight (with its swing) and of the clapper
      for (const q of chimes) if (Math.hypot(q.c.x - x, q.c.z - z) < q.reach + reach + 2.5 && c.y - H * 0.5 - 2 < q.c.y + q.H * 0.5 + q.up && q.c.y - q.H * 0.5 - 2 < c.y + H * 0.5 + (cluster ? R * 7 : 0)) return false;
      const per = 3 + R * 0.9, piv = [x, y0, z, per], delay = 0.4 + (c.distanceTo(strike) / 90) * rx.range(0.7, 1.3);
      glass.mdec = 0; solid.mdec = 0;
      smallBell(piv, x, top, z, R, H, delay, sd, 16, 7, true);
      cord(piv, delay, sd, x, z, y0, top + R * 0.2, R);
      glass.set(piv, [delay, 6, sd, 1]);                                                      // a bead of glass where the cord takes the bell: it catches the toll with its bell
      lathe(glass, 8, 4, (t) => [R * (0.02 + 0.15 * Math.sin(Math.PI * t)), top + R * 0.34 - t * R * 0.4], wallCol, x, z);
      crook(a, r0, y0, R, sd);
      if (cluster) for (let j = 0; j < 3; j++) {                                              // handbells strung up the tendon on short arms
        const r2 = R * (0.55 - 0.07 * j), h2 = r2 * 2.2, sgn = j % 2 ? -1 : 1, an = a + 1.3 + j * 2.1, ox = Math.sin(an) * R * 0.9 * sgn, oz = Math.cos(an) * R * 0.9 * sgn, ty = top + R * 1.1 + j * R * 1.9;
        solid.set(piv, [delay, r2 / 22, sd, 0]);                                               // each on its own small crook off the cord
        tube(solid, spline([V3(x, ty + r2 * 1.6, z), V3(x + ox * 0.55, ty + r2 * 1.75, z + oz * 0.55), V3(x + ox, ty + r2 * 1.1, z + oz), V3(x + ox, ty, z + oz)], 6), 4,
          (t) => r2 * lerp(0.1, 0.045, t), () => mix3(DEEP, LACQ, 0.3), {});
        smallBell(piv, x + ox, ty, z + oz, r2, h2, delay + 0.15 * (j + 1), (sd + 0.37 * (j + 1)) % 1, 10, 5, false);
      }
      glass.mdec = 2; solid.mdec = 2;
      addHalo(c, R * 5, delay, 0.14, sd);
      chimes.push({ c, R, H, reach, up: cluster ? R * 7 : 0 });
      return true;
    };
    const NCH = Math.round(14 + 8 * (ctx.quality?.detail ?? 1));
    for (let tries = 0; tries < 700 && chimes.length < NCH; tries++) {
      const k = rx.int(0, 23), big = rx() ** 3;
      hang(((k + 0.5) / 24) * TAU, rx.range(112, 212), rx.range(9, 24) + rx() ** 2 * 52, 1.5 + rx() * 1.1 + big * 2.4, 0.45);
      if (tries % 60 === 59) await ctx.yield?.();
    }
    // a ring of pendants under the calyx: one hangs from the tip of every sepal, round the last straight to the portal
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * TAU, tEnd = k % 2 ? 0.078 : 0.115, [r, y] = prof(tEnd, a), R = k % 2 ? 1.05 : 1.45, L = k % 2 ? 3.5 : 6.5 + 2 * rx();
      const x = Math.sin(a) * (r - 0.9), z = Math.cos(a) * (r - 0.9), sd = rx(), piv = [x, y - 0.6, z, 2.6 + R], delay = 1.6 + 0.9 * rx();
      glass.mdec = 0; solid.mdec = 0;
      smallBell(piv, x, y - 0.6 - L, z, R, R * 2.3, delay, sd, 12, 5, false);
      cord(piv, delay, sd, x, z, y - 0.6, y - 0.5 - L, R);
      glass.mdec = 2; solid.mdec = 2;
      addHalo(V3(x, y - 0.6 - L - R, z), R * 5, delay, 0.12, sd);
    }
  }
  await ctx.yield?.();

  const mothGeo = new THREE.BufferGeometry();
  mothGeo.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  mothGeo.setAttribute('aDir', new THREE.BufferAttribute(md, 4));
  mothGeo.setAttribute('aSeed', new THREE.BufferAttribute(ms, 4));

  // ================= materials =================
  const col = (c) => new THREE.Color(c[0], c[1], c[2]);
  const U = {
    uS: { value: -20 }, uTime: { value: 0 }, uAfter: { value: 0.24 }, uAmb: { value: opts.ambient ?? 1.0 },
    uGold: { value: col(P[6]) }, uSky: { value: col(PEARL) }, uBody: { value: col(CELADON) }, uLip: { value: col(DEEP) },
    uPale: { value: col(PALE) }, uCold: { value: col(mix3(CELADON, [1, 1, 1], 0.65)) }, uStrike: { value: strike.clone() },
    uCharge: { value: 0 }, uPilot: { value: 1.2 }, uRime: { value: opts.rime ?? 0 }, uBackA: { value: 0.72 }, uHaloK: { value: 1 }, uPx: { value: 600 }, uSeed: { value: seedA * 6 },
    uIn: { value: 0 }, uClear: { value: 0.38 }, uDense: { value: 0.7 }, uDawnK: { value: 0 }, uLightAz: { value: new THREE.Vector2(-0.6, -0.8) }, uShaft: { value: 0 }, uEmber: { value: new THREE.Vector3(0, 70, 0) }, uAmberK: { value: 1 }, uVeinK: { value: 1 }, uGlassAmb: { value: 0 }, uRim: { value: opts.ambient ?? 1.0 },
  };
  const mk = (vs, fs, names, extra) => {
    const uniforms = THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
    for (const n of names) uniforms[n] = U[n];
    return new THREE.ShaderMaterial({ uniforms, vertexShader: vs, fragmentShader: fs, fog: true, ...extra });
  };
  const base = ['uS', 'uTime', 'uAfter', 'uGold', 'uSky', 'uAmb'];
  const glassMat = mk(GLSL_VERT, GLASS_FRAG, [...base, 'uBody', 'uLip', 'uPale', 'uStrike', 'uBackA', 'uIn', 'uClear', 'uDense', 'uDawnK', 'uLightAz', 'uEmber', 'uAmberK', 'uGlassAmb', 'uVeinK'],
    { vertexColors: true, transparent: true, side: THREE.DoubleSide, depthWrite: false });
  const solidMat = mk(GLSL_VERT, SOLID_FRAG, [...base, 'uCold', 'uCharge', 'uPilot', 'uRime', 'uPx', 'uRim'], { vertexColors: true, defines: { THIN: 1 } });
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending };
  const mothMat = mk(MOTH_VERT, MOTH_FRAG, [...base, 'uPx'], add);
  const haloMat = mk(HALO_VERT, HALO_FRAG, [...base, 'uHaloK'], { ...add, depthTest: true });
  const waterMat = mk(WATER_VERT, WATER_FRAG, [...base, 'uSeed'], { transparent: true, depthWrite: false, blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

  // the Bourdon's own toll hangs in the moth-dust inside it: the after-shimmer gathered by the 24 ribs toward the collar shows as a
  // soft gold column down the axis of the bell, seen only from inside (uShaft is the world's: it brings the column up as the basket
  // comes in under the lip), and it dies as the toll dies
  const SHAFT_VERT = /* glsl */`
varying vec3 vN, vW; varying vec2 vUv;
void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }`;
  const SHAFT_FRAG = /* glsl */`
uniform vec3 uGold; uniform float uShaft;
varying vec3 vN, vW; varying vec2 vUv;
${GLSL_COMMON}
void main() {
  vec3 V = cameraPosition - vW; float dC = length(V); V /= max(dC, 1e-3);
  float nv = min(abs(dot(vN / max(length(vN), 1e-4), V)), 1.0), core = nv * nv * (0.4 + 0.6 * nv);            // thickest through the middle, nothing at its edges
  float an = vUv.x * 6.2832, h = clamp(vUv.y, 0.0, 1.0);
  float ray = 0.55 + 0.45 * sin(an * 5.0 + uTime * 0.11 + 2.0 * sin(an * 3.0 - uTime * 0.07)) * sin(an * 9.0 - uTime * 0.05 + 1.3);
  float fall = mix(0.1, 1.0, h * h) * smoothstep(0.0, 0.08, h) * (1.0 - smoothstep(0.93, 1.0, h));
  float drift = 0.8 + 0.2 * sin(h * 40.0 - uTime * 0.9 + an * 2.0);
  float toll = min(tollEnv(uS, 0.2, 6.0), 1.0);        // the Bourdon's own toll and its after-shimmer: this light is nothing without them
  float k = core * ray * fall * drift * uShaft * toll * smoothstep(5.0, 34.0, dC);
  gl_FragColor = vec4(uGold * vec3(1.0, 0.84, 0.6) * k, 1.0);
}`;
  const shaftMat = new THREE.ShaderMaterial({ uniforms: { uGold: U.uGold, uS: U.uS, uTime: U.uTime, uAfter: U.uAfter, uShaft: U.uShaft }, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false });
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(6.2, 21, 166, 40, 1, true), shaftMat); shaft.position.set(0, 60 + 83, 0); shaft.renderOrder = 4.6; shaft.visible = false;

  // ================= assembly =================
  const object = new THREE.Group(); object.name = 'bourdon';
  const glassGeo = await glass.geometry(Y), solidGeo = await solid.geometry(Y), clapGeo = await clap.geometry(Y), haloGeo = await halo.geometry(Y);
  const glassMesh = new THREE.Mesh(glassGeo, glassMat); glassMesh.renderOrder = 3;
  const solidMesh = new THREE.Mesh(solidGeo, solidMat);
  const clapper = new THREE.Mesh(clapGeo, solidMat); clapper.position.copy(HINGE);
  const haloMesh = new THREE.Mesh(haloGeo, haloMat); haloMesh.renderOrder = 4; haloMesh.frustumCulled = false;
  const moths = new THREE.Points(mothGeo, mothMat); moths.renderOrder = 5; moths.frustumCulled = false;
  object.add(solidMesh, clapper, glassMesh, haloMesh, moths, shaft);
  if (opts.waterFx !== false) {
    const water = new THREE.Mesh(new THREE.PlaneGeometry(440, 440), waterMat);
    water.rotation.x = -Math.PI / 2; water.position.y = 0.08; water.renderOrder = 1; object.add(water);
  }
  for (const m of [glassMesh, solidMesh, clapper]) { m.geometry.computeBoundingSphere(); m.geometry.boundingSphere.radius += 12; m.geometry.userData.mirror.boundingSphere = m.geometry.boundingSphere; }

  // ================= animation =================
  let tollS = null, mirrorClapper = null;
  const env = (t) => (t < 0 ? 0 : smoothstep(0, 0.3, t) * Math.min(1.3, Math.exp(-t / 3.2) + U.uAfter.value * smoothstep(0.5, 3, t)));
  const clapperAngle = (s) => {
    if (s < DRAW[0]) return 0.03 * Math.sin(s * 0.9);
    if (s < -0.5) { const k = smoothstep(DRAW[0], DRAW[1], s); return -0.25 * k + 0.004 * Math.sin(s * 9) * k + 0.03 * Math.sin(s * 0.9) * (1 - k); }
    if (s < 0) { const k = (s + 0.5) / 0.5; return lerp(-0.25, strikeAng, k * k); }
    return strikeAng - 0.045 * Math.abs(Math.sin(s * 4.2)) * Math.exp(-s * 1.2) - 0.0025 * Math.sin(s * 37) * Math.exp(-s * 0.35);
  };
  const size = new THREE.Vector2();
  function update(dt, time, camera) {
    const s = tollS !== null ? tollS : ((time + 2) % 30) - 8;
    U.uS.value = s; U.uTime.value = time;
    U.uCharge.value = s < 0 ? 1.1 * smoothstep(-9, -0.3, s) : 0;
    const idle = s < 0 ? 1 - smoothstep(-1.5, -0.4, s) : 0;          // before it is let go the great clapper is never quite still
    clapper.rotation.x = -(clapperAngle(s) + 0.012 * Math.sin(time * 0.83) * idle);
    clapper.rotation.z = 0.034 * Math.sin(time * 0.71 + 0.6) * idle;
    if (mirrorClapper) { mirrorClapper.rotation.x = clapper.rotation.x; mirrorClapper.rotation.z = clapper.rotation.z; }
    U.uEmber.value.set(0, HINGE.y - STEM * Math.cos(clapper.rotation.x), HINGE.z - STEM * Math.sin(clapper.rotation.x));   // where the ember seed hangs now
    shaft.visible = U.uShaft.value > 0.004;
    if (camera && ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); U.uPx.value = camera.projectionMatrix.elements[5] * size.y * 0.5; }
  }
  update(0, 0, null);

  function makeMirror() {
    const g = new THREE.Group(); g.name = 'bourdon-mirror'; g.scale.y = -1;
    const a = new THREE.Mesh(solidGeo.userData.mirror, solidMat), b = new THREE.Mesh(glassGeo.userData.mirror, glassMat), c = new THREE.Mesh(clapGeo.userData.mirror, solidMat);
    b.renderOrder = 2; c.position.copy(HINGE); mirrorClapper = c; g.add(a, c, b); return g;
  }

  const lipY = prof(1, 0)[1] - 3.9;
  const anchors = {
    portalSeat: { position: SEAT.clone(), normal: seatN.clone(), radius: 7, tiltDeg: opts.seatTilt ?? 20 },
    flyThrough: FLY.map((p) => p.clone()),
    axisBottom: V3(0, 55, 0), axisTop: V3(0, 222, 0),
    strikePoint: strike.clone(), clapperRest: seedRest.clone(), clapperHinge: HINGE.clone(),
    lipFront: V3(0, lipY, prof(1, 0)[0]),
    revealView: { position: V3(0, 35, 230), target: V3(0, 140, 0) },
    underView: { position: V3(0, 36, 72), target: V3(0, 150, 0) },
    feet, apex: V3(0, APEX_Y, 0), sideBells,
  };

  return {
    object, radius: 95, height: 262, center: V3(0, 132, 0), anchors,
    update, dispose() {},
    setToll(s) { tollS = s; }, setProgress(s) { tollS = s; },
    goldLevel: (s) => clamp(env(s), 0, 1), tollArrival: (p) => p.distanceTo(strike) / 90,
    makeMirror, uniforms: U, strikeSpeed: 90, materials: { glass: glassMat, solid: solidMat, halo: haloMat }, glassMesh, haloMesh,
    ground: true, groundY: 0,
  };
}
