// THE NESTING MOUNTAIN: hero set piece of "The Turned Country".
// A 180 m black-and-gold lacquered bell that unscrews like a nest of dolls: vermilion inside, then sage,
// then gold, then a small bare birch kernel whose lid lifts off a turned gold portal frame in a black bowl.
// Every solid is a lathe profile (beads, coves, fillets, reeding, onion finials) painted in polar
// coordinates round its own axis by ONE lacquer ShaderMaterial; the bells end hanging in a rising spiral,
// each turning once in 30 s over its own soft shadow disc.
//
// buildHero(ctx, opts) -> { object, radius 120, height 190, center, anchors, update(dt, time, camera),
//                           setProgress(u), bellState(i, u), shadows, progress, dispose(), ground, groundY }
//   Origin at the base centre on the plain, +Y up, front (entry and final dive side) toward +Z.
//   radius/height are the seated mountain (what to frame); anchors.extent = { radius 292, height 300 } is
//   the full envelope once the bells hang.
// opts: palette  the brief's seven hexes [black, vermilion, gold, birch, sage, blue-grey, umber] (default built in)
//       detail   0.6-1 thins lathe segments only (nothing is removed)
//       sunDir   Vector3 toward the sun (default (-0.42, 0.81, 0.41): 54 degrees up, behind the left shoulder at entry)
//       keyColor, skyLow, skyHigh   key light tint and the two sky colours reflected in the clear coat
//       fog      true to let scene fog act on the lacquer (default false: the world has no fog)
//       portalFrame (true)  the turned gold-and-black ring round the portal seat
//       portalGlow  (true)  stand-in additive glow 0.45 m behind the portal plane; pass false once the real portal is seated
//       groundShadows (true) multiplied soft discs on the plain at y 0.12 under every bell and the base
// PROGRESS: call hero.setProgress(u) every frame with the path u (0..1). The whole choreography is a pure
//   function of u (bellState): black bell turned and 10 m up at 0, clear at 0.14; vermilion unscrews 0.18,
//   clear 0.33, lip beside the camera at 0.42; sage 0.48-0.56; gold 0.58-0.64 (then straight up the axis
//   until 0.70 before it drifts); kernel lid 0.63-0.66. If setProgress is never called the piece loops the
//   show on time (47 s) so the part viewer is alive. Ambient motion (collar bands and dish friezes spinning
//   between stripes and flowers, hanging bells turning and bobbing, portal glow) runs on time.
//   THE TABLEAU: from u 0.5 to 0.62 the three hung bells settle (M[i].s) into one picture for the camera at u 0.6:
//   black sinks where it hangs (far), vermilion slides round and down (left), sage swings out low over the far rim
//   (near, right), while the gold bell begins to turn. anchors.hang gives the settled places, anchors.hangEarly the
//   places the vermilion and sage bells wait in before that.
//   GOLD LIGHT: as the kernel lid lifts, uniform uGlow (seat, strength) lights every lacquer fragment near the seat and
//   a camera-facing additive halo ('seat-halo', opts.seatHalo !== false) marks the seat from every side; it stands
//   down as the camera lines up on the dive.
//   THE BLACK BOWL AND THE PEARL: the portal frame is a dish 14.5 m in radius about the portal's own axis, black lacquer
//   inside and out with one gold lip band, the gold frame at its centre; it opens out of the cup as the lid leaves
//   (the lid hangs 40 m up and 30 m back, clear of it). A ball of gold light ('seat-pearl') sits in the frame so the
//   seat reads as a bounded lit disc from the side; it flattens into the opening as the camera comes to face the ring.
//   Test hooks by option: opts.fixedU, opts.orbitDemo. hero.uniforms (shared lacquer uniforms: uLathe 0..1 smears
//   every pattern to stripes; uWin/uWinK shape the window highlight), hero.material, hero.colors are for the world.
// ANCHORS (local space):
//   portalSeat { position (0,16,0), normal (0, sin25, cos25), radius 7, tiltDeg 25 }  seat the 14 m portal here
//   diveStart (0,41.4,54.4), diveDir   the last 60 m: straight, 25 degrees down, toward -Z; rims pass 6.7-11 m below
//   flyThrough  ordered points for the whole brief path: entry on +Z at y 8, climb to y 86, close pass at
//               x -12, 1.25 clockwise turns (mountain to starboard) out to 85 m and down to y 40, closing
//               turn, dive. At least 6 m clear of every surface at the u each point is reached.
//   closePass   { u 0.42, camera, sageCrown, vermilionLip }   summits [{u, y}]  gaze heights on the axis
//   rims [{radius, y}]  the five lips;  hang [{position (lip centre), radius, top}]  where the bells end
//   viewpoints { entry, threeBells, finalRims }   sunDir   extent
//   hero.shadows[i] = { x, z, y (lip height), radius, strength } is refreshed every frame for ground shaders.
// SHARED WITH THE WORLD: Prof, turn, aim, MO, cells and the shader strings are exported; the world instances the same
//   fragment shader. Band flag hl +8 adds V tool grooves (the plain). turn() writes typed arrays and sets bounds by hand.
// COST: about 140k triangles, 14 draw calls (5 bells, merged dishes, frame, glow, 6 shadow discs), no lights,
//   no textures, about 250 ms build. The bells are never frustum culled (they move in update()).
// LIGHT: none needed. The lacquer shader lights itself: flat two-step key from sunDir, umber-tinted shade at
//   0.62, a four-pane window highlight fixed in the world, sky reflection at grazing angles. Colours are
//   aim()ed through the engine's ACES curve so lit lacquer lands on the palette hexes; only window
//   highlights and gold pass 1.0 and bloom. Bright daylight sky behind it is what it wants.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const TAU = Math.PI * 2;
const DEFAULT_PALETTE = ['#15110E', '#D33B22', '#E4B23F', '#EBDAB6', '#7E9F6B', '#D2E2E4', '#9C6B45'];

// Motif ids understood by the lacquer shader.
const MO = { PLAIN: 0, BERRY: 1, COMMA: 2, LEAF: 3, DOTS: 4, REED: 5, GOLD: 6, GRAIN: 7, RINGS: 8, THREAD: 9, PETAL: 10, TOOL: 11 };

// ---------- colour: aim(hex) finds the linear value that the engine's ACES curve lands on the hex ----------
function acesFit(x) { const v = x / 0.6; return clamp((v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081), 0, 1); }
function aimChannel(t) { let lo = 0, hi = 4; for (let i = 0; i < 28; i++) { const m = (lo + hi) * 0.5; if (acesFit(m) < t) lo = m; else hi = m; } return (lo + hi) * 0.5; }
function aim(hex) {
  const c = new THREE.Color(hex);                      // linear target
  const o = new THREE.Color(aimChannel(c.r), aimChannel(c.g), aimChannel(c.b));
  // the tone map's channel mixing greys saturated paint a little: push chroma back out
  const l = o.r * 0.2126 + o.g * 0.7152 + o.b * 0.0722, k = 1.12;
  o.r = Math.max(0.004, l + (o.r - l) * k); o.g = Math.max(0.004, l + (o.g - l) * k); o.b = Math.max(0.004, l + (o.b - l) * k);
  return o;
}

// ---------- lathe profiles ----------
// A profile is an ordered list of bands. Each band is a run of (r, y) control points that is resampled
// through Catmull-Rom (so no segment is straight) and carries its own paint: base colour, stroke colour,
// motif, cells round the axis, spin and hairlines. Bands meet at creases, which is what makes fillets,
// beads and coves read as turned mouldings. Trace order: material on the left, i.e. outer walls upward,
// inner walls downward (the surface normal is (dy, -dr)).
class Prof {
  constructor() { this.bands = []; this.r = 0; this.y = 0; }
  at(r, y) { this.r = r; this.y = y; return this; }
  // start a band at the current point; o = { c, c2, mo, n, spin, hl, step, thread, seed }
  band(o, pts) {
    const p = [[this.r, this.y]];
    for (const q of pts) p.push([q[0], q[1]]);
    this.bands.push({ p, ...o });
    const e = p[p.length - 1]; this.r = e[0]; this.y = e[1];
    return this;
  }
  // half-round bead bulging outward by b between the current point and (r1, y1)
  bead(o, r1, y1, b) {
    const r0 = this.r, y0 = this.y, pts = [], dx = r1 - r0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = dy / L, ny = -dx / L;
    for (let i = 1; i <= 5; i++) { const t = i / 5, s = Math.sin(t * Math.PI); pts.push([r0 + dx * t + nx * b * s, y0 + dy * t + ny * b * s]); }
    return this.band({ step: 99, ...o }, pts);
  }
  // cove: the same arc cut inward
  cove(o, r1, y1, d) { return this.bead(o, r1, y1, -d); }
}

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

// Resample one band to rows about `step` metres apart.
function resampleBand(b, stepScale) {
  const P = b.p, n = P.length, rows = [];
  let len = 0; for (let i = 1; i < n; i++) len += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
  const step = (b.step || 2.5) * stepScale;
  const per = Math.max(1, Math.ceil(len / step / (n - 1)));
  for (let i = 0; i < n - 1; i++) {
    const a = P[Math.max(0, i - 1)], c = P[i], d = P[i + 1], e = P[Math.min(n - 1, i + 2)];
    for (let k = 0; k < per; k++) { const t = k / per; rows.push([Math.max(0, catmull(a[0], c[0], d[0], e[0], t)), catmull(a[1], c[1], d[1], e[1], t)]); }
  }
  rows.push([P[n - 1][0], P[n - 1][1]]);
  return rows;
}

// turn(profile, segments): sweep a profile round +Y. uv.x = angle (radians, 0 at +Z), uv.y = arc length in
// metres; per-vertex band data rides in aBand (band centre s, half height, cells N, motif), aCol / aCol2
// (base and stroke colour, linear) and aFx (spin rate, seed, hairline flags, shell lift id).
function turn(prof, seg, stepScale = 1) {
  // pass 1: resample every band, so the buffers can be allocated once (typed arrays: no array growth, no copy)
  const B = prof.bands, R = new Array(B.length); let nv = 0, ni = 0;
  for (let k = 0; k < B.length; k++) { const rows = resampleBand(B[k], stepScale); R[k] = rows; nv += rows.length * (seg + 1); ni += (rows.length - 1) * seg * 6; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), band = new Float32Array(nv * 4);
  const col = new Float32Array(nv * 3), col2 = new Float32Array(nv * 3), fx = new Float32Array(nv * 4);
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  const SA = new Float64Array(seg + 1), CA = new Float64Array(seg + 1);
  for (let j = 0; j <= seg; j++) { const a = (j / seg) * TAU; SA[j] = Math.sin(a); CA[j] = Math.cos(a); }
  let s0 = 0, base = 0, v = 0, t = 0;
  for (let k = 0; k < B.length; k++) {
    const b = B[k], rows = R[k], m = rows.length, S = [0];
    for (let i = 1; i < m; i++) S.push(S[i - 1] + Math.hypot(rows[i][0] - rows[i - 1][0], rows[i][1] - rows[i - 1][1]));
    const len = S[m - 1], sMid = s0 + len * 0.5, half = len * 0.5;
    const c = b.c, c2 = b.c2 || b.c, bn = b.n || 12, bmo = b.mo || 0, bsp = b.spin || 0, bsd = b.seed || 0, bhl = b.hl || 0, bgl = b.gloss === undefined ? 1 : b.gloss;
    for (let i = 0; i < m; i++) {
      const pa = rows[Math.max(0, i - 1)], pb = rows[Math.min(m - 1, i + 1)];
      let tr = pb[0] - pa[0], ty = pb[1] - pa[1]; const tl = Math.hypot(tr, ty) || 1; tr /= tl; ty /= tl;
      const nr = ty, ny = -tr, r0 = rows[i][0], y = rows[i][1], si = s0 + S[i];
      const dk = b.dark ? lerp(b.dark[0], b.dark[1], len > 0 ? S[i] / len : 0) : 1;
      const cr = c.r * dk, cg = c.g * dk, cb = c.b * dk, dr = c2.r * dk, dg = c2.g * dk, db = c2.b * dk;
      for (let j = 0; j <= seg; j++, v++) {
        const sa = SA[j], ca = CA[j];
        let r = r0, nrr = nr, nyy = ny;
        if (b.thread) {                               // a real screw thread: one helical ridge
          const ph = (S[i] / b.thread + j / seg) % 1, tri = 1 - Math.abs(ph * 2 - 1), edge = Math.min(1, Math.min(S[i], len - S[i]) / (b.thread * 0.5));
          r += (tri - 0.5) * b.thread * 0.55 * edge; const sl = (ph < 0.5 ? 1 : -1) * 0.75 * edge;
          const ql = Math.hypot(1, sl); nrr = (nr - sl * tr) / ql; nyy = (ny - sl * ty) / ql;
        }
        const v3 = v * 3, v4 = v * 4;
        pos[v3] = r * sa; pos[v3 + 1] = y; pos[v3 + 2] = r * ca; nor[v3] = nrr * sa; nor[v3 + 1] = nyy; nor[v3 + 2] = nrr * ca;
        uv[v * 2] = (j / seg) * TAU; uv[v * 2 + 1] = si;
        band[v4] = sMid; band[v4 + 1] = half; band[v4 + 2] = bn; band[v4 + 3] = bmo;
        col[v3] = cr; col[v3 + 1] = cg; col[v3 + 2] = cb; col2[v3] = dr; col2[v3 + 1] = dg; col2[v3 + 2] = db;
        fx[v4] = bsp; fx[v4 + 1] = bsd; fx[v4 + 2] = bhl; fx[v4 + 3] = bgl;
      }
    }
    for (let i = 0; i < m - 1; i++) {
      const dead0 = rows[i][0] < 1e-4, dead1 = rows[i + 1][0] < 1e-4;
      for (let j = 0; j < seg; j++) {
        const a = base + i * (seg + 1) + j, bb = a + 1, cc = a + seg + 1, d = cc + 1;
        if (!dead0) { idx[t++] = a; idx[t++] = bb; idx[t++] = cc; }
        if (!dead1) { idx[t++] = bb; idx[t++] = d; idx[t++] = cc; }
      }
    }
    base += m * (seg + 1); s0 += len;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setAttribute('aBand', new THREE.BufferAttribute(band, 4));
  g.setAttribute('aCol', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aCol2', new THREE.BufferAttribute(col2, 3));
  g.setAttribute('aFx', new THREE.BufferAttribute(fx, 4));
  g.setIndex(new THREE.BufferAttribute(t < ni ? idx.slice(0, t) : idx, 1));
  // bounds by hand: a solid of revolution's sphere is known, and computing it later would stall a frame
  let rmax = 0, y0 = Infinity, y1 = -Infinity;
  for (const rows of R) for (const q of rows) { if (q[0] > rmax) rmax = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; }
  rmax += 1; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, (y0 + y1) / 2, 0), Math.hypot(rmax, (y1 - y0) / 2));
  g.boundingBox = new THREE.Box3(new THREE.Vector3(-rmax, y0, -rmax), new THREE.Vector3(rmax, y1, rmax));
  return g;
}

// ---------- the lacquer shader (also does bare birch: motifs GRAIN, RINGS, THREAD) ----------
const LACQUER_VERT = /* glsl */`
attribute vec4 aBand, aFx; attribute vec3 aCol, aCol2;
uniform float uTime;
varying vec2 vUv; varying vec4 vBand, vFx; varying vec3 vCol, vCol2, vN, vP; varying float vR, vSpinA, vSpinW;
#include <common>
#include <fog_pars_vertex>
void main(){
  vUv = uv; vBand = aBand; vFx = aFx; vCol = aCol; vCol2 = aCol2;
  vR = length(position.xz);
  // free spin: a band may turn on its own. Its rate breathes between rest (flowers) and full speed (stripes).
  float th = uTime * 0.2618 + aFx.y * 6.2832;          // 24 s cycle, staggered by seed
  float c1 = 0.5 + 0.5 * cos(th);
  vSpinW = aFx.x * c1 * c1;
  vSpinA = mod(aFx.x * (0.375 * uTime + (0.5 * sin(th) + 0.0625 * sin(2.0 * th)) / 0.2618), 6.2832);   // constant per band, so safe to wrap
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const LACQUER_FRAG = /* glsl */`
precision highp float;
uniform vec3 uSun, uKey, uGold, uUmber, uSkyLo, uSkyHi;
uniform vec4 uBell[5]; uniform float uBellK[5];
uniform float uPix, uTime, uLathe;
uniform vec4 uWin; uniform vec3 uWinK;
uniform vec4 uGlow;   // the portal seat (world) and how far the kernel lid has lifted
varying vec2 vUv; varying vec4 vBand, vFx; varying vec3 vCol, vCol2, vN, vP; varying float vR, vSpinA, vSpinW;
#include <common>
#include <fog_pars_fragment>
float h11(float n){ return fract(sin(n * 127.1 + 3.7) * 43758.5453); }
float cov(float d, float e){ return 1.0 - smoothstep(-e, e, d); }
float atan2s(float y, float x){ return atan(y, abs(x) < 1e-5 ? 1e-5 : x); }
// spin smear: stretch a stroke round the axis by sm metres, and thin its paint so that paint is conserved
float gW;   // cell width in metres, set in main: strokes repeat with the cell so smears join into rings
float smearX(float p, float sm){ p = mod(p + 0.5 * gW, gW) - 0.5 * gW; return sign(p) * max(abs(p) - sm, 0.0); }
float thin(float chord, float sm){ return chord / max(chord + 2.0 * sm, 1e-4); }
float berry(vec2 p, vec2 o, float r, float sm, float e){
  vec2 v = vec2(smearX(p.x - o.x, sm), p.y - o.y);
  float dy = p.y - o.y, c = 2.0 * sqrt(max(r * r - dy * dy, 0.0));
  return cov(length(v) - r, e) * thin(max(c, r * 0.3), sm);
}
// tapered comma: an arc of radius rho from angle a0 over span, fat round head tapering to a point
float comma(vec2 p, vec2 ctr, float rho, float a0, float span, float t0, float sm, float e){
  vec2 v = vec2(smearX(p.x - ctr.x, sm), p.y - ctr.y);
  float ang = atan2s(v.y, v.x) - a0;
  ang = mod(ang + 6.2832 + 1.2, 6.2832) - 1.2;          // keep the branch cut away from the stroke
  float rel = clamp(ang, 0.0, span);
  vec2 q = rho * vec2(cos(a0 + rel), sin(a0 + rel));
  float k = rel / span, th = t0 * (1.0 - k * k) * (0.6 + 0.4 * (1.0 - k));   // fat round head, quick taper to a point
  return cov(length(v - q) - th, e) * thin(t0 * 1.4, sm);
}
// curled leaf: a one-and-a-quarter turn spiral, pointed at both ends, with a centre vein
float leaf(vec2 p, vec2 ctr, float m, float flip, float sm, float e){
  vec2 v = vec2(smearX(p.x - ctr.x, sm), (p.y - ctr.y)) * vec2(flip, 1.0);
  float rho = length(v), th = atan2s(v.y, v.x) + 3.14159;      // 0..2pi
  float b = m * 0.05, tMax = 7.6, best = 1e3, vein = 0.0;
  for (int k = 0; k < 2; k++) {
    float tt = min(th + 6.2832 * float(k), tMax);
    float x = tt / tMax, w = m * 0.115 * sin(3.14159 * sqrt(x)) * (0.35 + 0.65 * x);
    float dc = abs(rho - b * tt), d = dc - w;
    if (d < best) { best = d; vein = 1.0 - smoothstep(0.12 * w, 0.3 * w + 1e-4, dc + 0.5 * e); }
  }
  return cov(best, e) * (1.0 - 0.55 * vein * step(sm, 1e-4)) * thin(m * 0.2, sm);
}
float petal(vec2 p, float m, float sm, float e, out float eye){
  vec2 v = vec2(smearX(p.x, sm), p.y);
  float rho = length(v), th = atan2s(v.y, v.x);
  float c5 = abs(cos(2.5 * th));
  float d = rho - m * (0.2 + 0.24 * sqrt(c5));
  float ring = abs(rho - m * 0.13) ;
  eye = cov(rho - m * 0.105, e) * thin(m * 0.2, sm);
  return cov(d, e) * smoothstep(-e, e, ring - m * 0.022) * thin(m * 0.6, sm);
}
void main(){
  vec3 N = normalize(vN);
  vec3 Vv = cameraPosition - vP; float dist = length(Vv); vec3 V = Vv / max(dist, 1e-3);
  float NV = clamp(dot(N, V), 0.0, 1.0);
  float e = max(dist * uPix / max(NV, 0.25), 1e-4);            // pixel footprint in metres, no derivatives
  float motif = vBand.w, h = vBand.y, q = vUv.y - vBand.x, Nc = max(vBand.z, 1.0), seed = vFx.y;
  float W = 6.2832 * max(vR, 0.05) / Nc; gW = W;
  float cell = (vUv.x + vSpinA) * Nc / 6.2832 + seed;
  float id = floor(cell), p = (fract(cell) - 0.5) * W;
  float m = min(W, 2.0 * h);                                     // the stroke unit of this frieze
  float B = max(abs(vSpinW) * 0.05 * Nc / 6.2832, uLathe * 1.3);                    // smear in cells over a 1/20 s shutter
  float sm = min(B, 1.0) * W * 0.5;
  vec2 pq = vec2(p, q);
  vec3 paint = vCol; float a1 = 0.0, a2 = 0.0, mean1 = 0.0, mean2 = 0.0, goldMask = 0.0, satin = 0.0;
  vec3 Nl = N;
  if (motif < 0.5) {
  } else if (motif < 1.5) {                                      // berries in fives, gold dots, a gold tendril
    float r = 0.115 * m;
    a1 = berry(pq, vec2(0.0, 0.03 * m), r * 1.15, sm, e);
    a1 = max(a1, berry(pq, vec2(-0.21 * m, 0.19 * m), r, sm, e));
    a1 = max(a1, berry(pq, vec2(0.21 * m, 0.19 * m), r, sm, e));
    a1 = max(a1, berry(pq, vec2(-0.14 * m, -0.2 * m), r, sm, e));
    a1 = max(a1, berry(pq, vec2(0.14 * m, -0.2 * m), r, sm, e));
    a2 = berry(pq, vec2(0.5 * W, 0.27 * m), r * 0.55, sm, e);
    a2 = max(a2, berry(pq, vec2(0.5 * W, -0.27 * m), r * 0.55, sm, e));
    a2 = max(a2, comma(pq, vec2(0.5 * W, 0.0), 0.16 * m, -1.3, 2.6, 0.05 * m, sm, e));
    mean1 = 0.3; mean2 = 0.08;
  } else if (motif < 2.5) {                                      // strokework: commas up and down, gold dots between
    float mm = min(W * 0.5, 2.0 * h);
    a1 = comma(pq, vec2(-0.25 * W, -0.1 * mm), 0.27 * mm, -0.5, 2.5, 0.12 * mm, sm, e);
    a1 = max(a1, comma(pq * vec2(1.0, -1.0), vec2(0.25 * W, -0.1 * mm), 0.27 * mm, -0.5, 2.5, 0.12 * mm, sm, e));
    a2 = berry(pq, vec2(0.0, 0.0), 0.07 * mm, sm, e);
    a2 = max(a2, berry(pq, vec2(0.5 * W, 0.0), 0.07 * mm, sm, e));
    mean1 = 0.26; mean2 = 0.05;
  } else if (motif < 3.5) {                                      // curled leaves, turned alternately
    a1 = leaf(pq, vec2(0.0), m, mod(id, 2.0) * 2.0 - 1.0, sm, e);
    a2 = berry(pq, vec2(0.5 * W, 0.3 * m), 0.045 * m, sm, e);
    a2 = max(a2, berry(pq, vec2(0.5 * W, -0.3 * m), 0.045 * m, sm, e));
    mean1 = 0.3; mean2 = 0.03;
  } else if (motif < 4.5) {                                      // dot row
    a1 = berry(pq, vec2(0.0), 0.3 * m, sm, e); mean1 = 0.28;
  } else if (motif < 5.5) {                                      // reeding: flutes round the axis, in the normal
    vec3 T = cross(vec3(0.0, 1.0, 0.0), N); T /= max(length(T), 1e-4);
    float keepR = smoothstep(0.6, 2.0, W / e);
    Nl = normalize(N + T * 0.55 * sin(fract(cell) * 6.2832) * keepR);
  } else if (motif < 6.5) { goldMask = 1.0;
  } else if (motif < 7.5) {                                      // birch flank: long grain along s, sparse pores
    float ka = vUv.x * 38.2, w = 6.2832 * max(vR, 0.05) / 240.0, keepG = smoothstep(0.5, 2.0, w / e);
    float f = h11(floor(ka)) * 0.6 + h11(floor(ka * 3.0) + 17.0) * 0.4;
    float tick = step(0.9, h11(floor(ka * 2.0) * 3.1 + floor(vUv.y / 1.9 + h11(floor(ka * 2.0)) * 5.0)));
    paint *= 1.0 + (f - 0.5) * 0.11 * keepG; paint = mix(paint, uUmber, 0.16 * tick * keepG); satin = 1.0;
  } else if (motif < 8.5) {                                      // turned-off end grain: growth rings and pores
    float sp = max(vBand.z, 0.2), rr = vR / sp; rr += 0.33 * sin(rr * 0.9 + seed * 9.0);
    rr += 0.3 * sin(vUv.x * 3.0 + seed * 6.0) + 0.16 * sin(vUv.x * 7.0 + 1.3);
    float fr = fract(rr), dl = min(fr, 1.0 - fr) * sp, keepG = smoothstep(0.4, 1.6, 0.09 * sp / e);
    float ring = cov(dl - 0.07 * sp, e);
    float ka = vUv.x * 28.6, tick = step(0.82, h11(floor(ka) * 1.7 + floor(rr * 2.0)));
    paint = mix(paint, uUmber, mix(0.05, 0.3 * ring + 0.1 * tick * step(0.25, fr) * step(fr, 0.75), keepG)); satin = 1.0;
  } else if (motif < 9.5) {                                      // screw thread: umber in the grooves
    float ph = fract((q + h) / max(vBand.z, 0.1) + vUv.x / 6.2832);
    paint = mix(paint, uUmber * 0.8, 0.42 * smoothstep(0.3, 0.5, abs(ph - 0.5))); satin = 1.0;
  } else if (motif < 10.5) {                                     // five-petal flowers with gold eyes
    float eye; a1 = petal(pq, m, sm, e, eye); a2 = eye;
    a2 = max(a2, berry(pq, vec2(0.5 * W, 0.3 * m), 0.06 * m, sm, e));
    a2 = max(a2, berry(pq, vec2(0.5 * W, -0.3 * m), 0.06 * m, sm, e));
    mean1 = 0.34; mean2 = 0.06;
  } else {                                                       // bare inside walls: lathe tool lines round the axis, long grain
    float sp = max(vBand.z, 0.2), fr = fract((q + h) / sp), dl = min(fr, 1.0 - fr) * sp;
    float line = cov(dl - 0.06 * sp, e) * smoothstep(0.4, 1.6, 0.12 * sp / e);
    float ka = vUv.x * 38.2, f = h11(floor(ka)) * 0.6 + h11(floor(ka * 3.0) + 17.0) * 0.4;
    paint *= 1.0 + (f - 0.5) * 0.1 * smoothstep(0.5, 2.0, 6.2832 * max(vR, 0.05) / 240.0 / e);
    paint = mix(paint, uUmber, 0.26 * line); satin = 1.0;
    // one broad burnt ring for every four tool lines, in the middle of the bay between two of them and fading out to their
    // edges: measured along the solid's own profile in tool-line spacings, and in nothing else
    float bay = abs(fract((q + h) / (4.0 * sp) + 0.375) - 0.5) * 4.0;
    paint = mix(paint, paint * uUmber * 1.6, 0.45 * (1.0 - smoothstep(0.16, 0.44, bay)));
  }
  float keep = smoothstep(0.6, 2.2, 0.14 * m / e);               // strokes under two pixels fade to the ring mean
  a1 = mix(mean1, a1, keep); a2 = mix(mean2, a2, keep);
  paint = mix(paint, vCol2, a1); paint = mix(paint, uGold, a2); goldMask = max(goldMask, a2);
  float hlf = vFx.z;
  if (hlf > 7.5) {                                               // +8: V tool grooves round the axis, every vFx.x' metres (ground bands)
    hlf -= 8.0;
    float gsp = 0.55 + 1.3 * h11(floor(vBand.x * 0.37) + 2.0), gfr = fract(vUv.y / gsp), gdl = min(gfr, 1.0 - gfr) * gsp;
    float gl = cov(gdl - 0.05, e) * smoothstep(0.3, 1.4, 0.08 / e);
    float g2 = cov(abs(fract(vUv.y / (gsp * 4.0) + 0.37) - 0.5) * gsp * 4.0 - 0.16, e) * smoothstep(0.3, 1.4, 0.22 / e);
    paint = mix(paint, paint * uUmber * 1.6, 0.3 * gl + 0.34 * g2);
  }
  if (hlf > 3.5) { hlf -= 4.0; goldMask = max(goldMask, 1.0 - a1); }   // +4: the base coat itself is gold leaf
  if (hlf > 0.5) {                                               // gold hairlines at the band's edges (2: one centre line)
    float hw = clamp(h * 0.1, 0.03, 0.42);
    float d = hlf > 1.5 ? abs(q) - hw : abs(abs(q) - (h - 2.2 * hw)) - hw;
    float al = cov(d, e) * mix(0.35, 1.0, smoothstep(0.3, 1.2, hw / e));
    paint = mix(paint, uGold, al); goldMask = max(goldMask, al);
  }
  // faked shadows: a soft disc straight under every lifted bell, widening and fading with height
  vec3 shadow = vec3(1.0);
  for (int i = 0; i < 5; i++) {
    float hg = uBell[i].z - vP.y;
    float Rr = uBell[i].w * 1.15 + max(hg, 0.0) * 0.1, d = length(vP.xz - uBell[i].xy);
    float sh = (1.0 - smoothstep(Rr * 0.62, Rr, d)) * step(0.5, hg) * uBellK[i] / (1.0 + max(hg, 0.0) * 0.004);
    shadow *= mix(vec3(1.0), vec3(0.58, 0.47, 0.40), sh);
  }
  // base coat: flat two-step light, shade tinted umber, never grey
  float wrap = smoothstep(-0.105, 0.105, dot(Nl, uSun));
  vec3 shadeTint = 0.62 * mix(vec3(1.0), uUmber / max(dot(uUmber, vec3(0.333)), 1e-3), 0.3);
  vec3 col = paint * mix(shadeTint, vec3(1.0), wrap) * uKey * shadow;
  // clear coat, never spun: one four-pane window per solid, fixed in the world
  vec3 R = reflect(-V, N);
  vec3 ax = cross(uSun, vec3(0.0, 1.0, 0.0)); ax /= max(length(ax), 1e-4);
  vec3 ay = cross(ax, uSun);
  float rs = dot(R, uSun);
  vec2 wv = vec2(dot(R, ax), dot(R, ay)); wv.x += wv.y * uWin.z;             // uWin: half width, half height, slant, soft edge
  vec2 dq = abs(wv) - uWin.xy + 0.04;
  float dw = length(max(dq, 0.0)) + min(max(dq.x, dq.y), 0.0) - 0.04;
  float win = (1.0 - smoothstep(0.0, max(uWin.w, 1e-3), dw)) * mix(1.0, smoothstep(0.008, 0.024, min(abs(wv.x), abs(wv.y))), uWinK.y) * step(0.0, rs);
  float gloss = vFx.w * (1.0 - satin);
  float lit = mix(0.25, 1.0, wrap) * mix(0.5, 1.0, min(shadow.g * 1.6 - 0.6, 1.0));
  col += uKey * win * uWinK.x * gloss * lit;
  float rs2 = max(rs, 0.0); rs2 *= rs2; rs2 *= rs2;                        // (R.S)^4
  col += paint * goldMask * (rs2 * rs2 * 0.75 + rs2 * 0.25) * gloss * lit; // gold's second, broad highlight keeps its hue
  col += paint * satin * rs2 * 0.16 * lit;                                 // satin birch: one wide dim highlight
  float fr = 1.0 - NV; float fr5 = fr * fr; fr5 = fr5 * fr5 * fr;
  vec3 sky = mix(uSkyLo, uSkyHi, smoothstep(-0.1, 0.8, R.y));
  col += sky * (0.04 + 0.5 * fr5) * mix(0.35, 1.0, gloss) * mix(0.6, 1.0, shadow.g);
  // gold light pours out from under the kernel lid: everything within a dozen metres of the seat takes it
  vec3 gv = uGlow.xyz - vP; float gd2 = dot(gv, gv);
  float gk = uGlow.w / (1.0 + gd2 / 46.0), gn = 0.3 + 0.7 * clamp(dot(N, gv) / sqrt(max(gd2, 1e-4)), 0.0, 1.0);
  col += (paint * 0.75 + 0.16 * smoothstep(0.03, 0.2, paint.g)) * vec3(2.1, 1.32, 0.5) * gk * gn;   // black lacquer stays black
  col = mix(col, uSkyLo, 0.15 * smoothstep(900.0, 1500.0, dist));         // far solids lean to horizon cream, no fog
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

function makeLacquer(U, fog) {
  return new THREE.ShaderMaterial({
    uniforms: Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), U),   // U is shared by reference
    vertexShader: LACQUER_VERT, fragmentShader: LACQUER_FRAG, fog: !!fog,
  });
}

// ---------- the five shells ----------
// Each shell is a bell (upper 82 percent) and a dish (lower 18 percent) that meet at a beaded, threaded
// waist. R = widest radius, H = full height, C = its colours, st = per-seed style numbers.
function cells(r, bandH, k = 1.1) { return Math.max(6, Math.round(TAU * r / (bandH * k))); }
// NEVER PALE ON PALE: every band of a shell's profile passes its stroke colour through its colour set's rule (buildHero)
function neverPale(P, C) { if (C.stroke) for (const b of P.bands) if (b.c2) b.c2 = C.stroke(b.c, b.c2); }

function dishProfile(R, H, C, st) {
  const u = H / 180, wy = H * 0.158, P = new Prof(), sd = st.seed;
  const lac = { c: C.base, c2: C.s1 };
  P.at(0.82 * R, 0);
  P.band({ ...lac, step: 1.5 * u }, [[0.86 * R, 0.6 * u]]);
  P.bead({ c: C.gold, mo: MO.GOLD }, 0.875 * R, 4 * u, 1.7 * u);                                   // foot bead
  P.cove({ ...lac, mo: MO.REED, n: cells(R, 2.2 * u) }, 0.93 * R, 8.6 * u, 1.0 * u);
  P.band({ ...lac, mo: st.dishMo, n: cells(R, 14.5 * u, st.cellK), hl: 1, seed: sd, spin: st.dishSpin, step: 3.4 * u },
    [[0.975 * R, 12.5 * u], [1.0 * R, 18.5 * u], [1.0 * R, 23.6 * u]]);                                  // the belly frieze
  P.bead({ c: C.gold, mo: MO.GOLD }, 0.985 * R, 27.1 * u, 1.5 * u);                                // lower half of the beaded waist
  P.band({ ...lac, step: 1.2 * u }, [[0.975 * R, 27.9 * u], [0.955 * R, wy]]);
  P.band({ c: C.birch, mo: MO.RINGS, n: 1.4 * u, seed: sd, gloss: 0, step: 2 * u }, [[0.928 * R, wy]]);   // the seat
  P.band({ c: C.birch, mo: MO.THREAD, n: 1.0 * u, thread: 1.0 * u, gloss: 0, step: 0.25 * u }, [[0.925 * R, wy + 1.0 * u], [0.925 * R, wy + 2.0 * u]]);
  P.bead({ ...lac, hl: 2 }, 0.885 * R, wy + 1.8 * u, 0.95 * u);                                      // the coloured lip
  P.band({ ...lac, c2: C.gold, mo: MO.DOTS, n: cells(0.87 * R, 5 * u, 1.3), spin: st.spin[1] * 0.6, seed: sd + 0.1, step: 3 * u }, [[0.872 * R, wy - 2.6 * u], [0.866 * R, wy - 6.4 * u]]);
  P.bead({ c: C.gold, mo: MO.GOLD }, 0.862 * R, wy - 8 * u, 0.55 * u);
  P.band({ c: C.birch, mo: MO.TOOL, n: 2.2 * u, gloss: 0, dark: [1, 0.7], step: 5 * u },
    [[0.858 * R, 12 * u], [0.845 * R, 5.5 * u], [0.8 * R, 2.8 * u]]);                               // inner wall
  P.band({ c: C.birch, mo: MO.RINGS, n: 2.3 * u, seed: sd + 0.3, gloss: 0, dark: [0.7, 0.86], step: 9 * u }, [[0.5 * R, 2.2 * u], [0.3 * R, 2.2 * u]]);
  neverPale(P, C);
  return P;
}

function bellProfile(R, H, C, st) {
  const u = H / 180, wy = H * 0.158, w0 = wy / u, P = new Prof(), sd = st.seed, f = st.full, nk = st.neck;
  const lac = { c: C.base, c2: C.s1 }, gb = C.goldBase ? 4 : 0, G = { c: C.gold, mo: MO.GOLD };
  const yA = 55 + st.j[0], yB = 93 + st.j[1], yC = 124 + st.j[2];             // the three collars (black-bell metres)
  const rA = 0.885, rB = 0.7 * f, rC = 0.37 * f * nk;
  // inside first, crown to lip: bare birch with tool lines, darker toward the crown, then a lacquered inner lip
  P.at(0, (yC + 13.6) * u);
  P.band({ c: C.birch, mo: MO.RINGS, n: 2.6 * u, seed: sd, gloss: 0, dark: [0.26, 0.32], step: 7 * u }, [[0.1 * R, (yC + 13.2) * u], [(rC - 0.1) * R, (yC + 4) * u]]);
  P.band({ c: C.birch, mo: MO.TOOL, n: 3.2 * u, gloss: 0, dark: [0.25, 0.7], step: 14 * u },
    [[(rC - 0.03) * R, (yC - 6) * u], [(rB - 0.075) * R, yB * u], [(rA - 0.085) * R, (yA + 4) * u], [0.9 * R, (w0 + 16) * u], [0.928 * R, (w0 + 9) * u]]);
  P.bead(G, 0.932 * R, (w0 + 7.4) * u, 0.5 * u);
  P.band({ ...lac, c2: C.gold, mo: MO.DOTS, n: cells(0.93 * R, 5.6 * u, 1.3), seed: sd + 0.7, dark: [0.8, 1], step: 4 * u }, [[0.934 * R, (w0 + 3.6) * u], [0.936 * R, (w0 + 0.3) * u]]);
  P.band({ c: C.birch, mo: MO.RINGS, n: 1.4 * u, seed: sd, gloss: 0, step: 2 * u }, [[0.965 * R, wy + 0.05 * u]]);         // the lip
  P.band({ ...lac, step: 1.2 * u }, [[0.992 * R, wy + 0.5 * u], [1.0 * R, wy + 1.4 * u]]);
  P.bead(G, 0.995 * R, wy + 5 * u, 1.7 * u);                                                                 // upper half of the beaded waist
  // skirt: a flaring bell mouth, and the lip band whose brushwork the camera passes at 12 m
  P.band({ ...lac, c2: C.s1, mo: st.mo[0], n: cells(0.94 * R, (yA - w0 - 9) * u, st.cellK), hl: 1 + gb, seed: sd, step: 3.6 * u },
    [[0.972 * R, (w0 + 8.5) * u], [0.915 * R, (w0 + (yA - w0) * 0.52) * u], [(rA + 0.006) * R, (yA - 1) * u]]);
  // collar A: fillet, spinning bead, reeded cove
  P.band({ c: C.cb, step: 1 * u }, [[(rA + 0.014) * R, (yA + 0.6) * u]]);
  P.bead({ c: C.cb, c2: C.gold, mo: MO.DOTS, n: cells(rA * R, 4.2 * u, 1.5), spin: st.spin[0], seed: sd + 0.21 }, (rA - 0.005) * R, (yA + 5) * u, 2.1 * u);
  P.cove({ ...lac, mo: MO.REED, n: cells(rA * R, 2.4 * u) }, (rA - 0.03) * R, (yA + 8.5) * u, 0.9 * u);
  // body: the broad, swelling face
  P.band({ ...lac, c2: C.s2, mo: st.mo[1], n: cells(0.82 * R, (yB - yA - 10) * u, st.cellK), hl: 1 + gb, seed: sd + 0.4, step: 3.6 * u },
    [[(rA - 0.036) * R, (yA + 12.5) * u], [((rA - 0.036 + rB + 0.02) * 0.5 + 0.052) * R, lerp(yA + 12.5, yB, 0.5) * u], [(rB + 0.02) * R, (yB - 1) * u]]);
  // collar B: gold bead, spinning berry bead, gold bead
  P.bead(G, (rB + 0.02) * R, (yB + 1.6) * u, 1.0 * u);
  P.bead({ c: C.s3, c2: C.s1, mo: MO.BERRY, n: cells(rB * R, 5.4 * u, 1.25), spin: -st.spin[1], seed: sd + 0.63 }, (rB + 0.005) * R, (yB + 7) * u, 2.5 * u);
  P.bead(G, (rB - 0.02) * R, (yB + 8.6) * u, 1.0 * u);
  // shoulder: a dome
  P.band({ ...lac, c2: C.s4, mo: st.mo[2], n: cells(0.56 * R * f, (yC - yB - 12) * u, st.cellK), hl: 1 + gb, seed: sd + 0.8, step: 3.4 * u },
    [[(rB - 0.04) * R, (yB + 12) * u], [(lerp(rB, rC, 0.42) + 0.035) * R, lerp(yB + 12, yC, 0.56) * u], [(rC + 0.035) * R, (yC - 1) * u]]);
  // collar C and the reeded neck
  P.bead({ c: C.cb, c2: C.gold, mo: MO.DOTS, n: cells(rC * R, 3.4 * u, 1.5), spin: st.spin[2], seed: sd + 0.9 }, (rC + 0.01) * R, (yC + 4.4) * u, 2.0 * u);
  P.band({ c: C.gold, mo: MO.GOLD, step: 0.8 * u }, [[(rC - 0.03) * R, (yC + 5.2) * u]]);
  P.cove({ ...lac, mo: MO.REED, n: st.reeds, step: 3 * u }, 0.19 * nk * R, (yC + 19) * u, 3.2 * u * st.waistCut);
  P.bead(G, 0.17 * nk * R, (yC + 22.4) * u, 1.5 * u);
  // onion finial, a gold ball and a spire
  const y0 = yC + 23, oh = st.onionH, ow = st.onionW * R;
  P.band({ c: C.fin, c2: C.gold, mo: MO.COMMA, n: st.finN, hl: 1, seed: sd + 0.5, step: 2.8 * u },
    [[0.11 * R, (y0 + 0.4) * u], [ow * 0.8, (y0 + 0.16 * oh) * u], [ow, (y0 + 0.36 * oh) * u], [ow * 0.66, (y0 + 0.62 * oh) * u], [ow * 0.3, (y0 + 0.84 * oh) * u], [0.045 * R, (y0 + oh) * u]]);
  P.bead(G, 0.03 * R, (y0 + oh + 3.4) * u, 1.9 * u);
  P.band({ c: C.gold, mo: MO.GOLD, step: 2.5 * u }, [[0.022 * R, (y0 + oh + 5) * u], [0.012 * R, (y0 + oh + 8) * u], [0, (y0 + oh + 11.4) * u]]);
  P.top = (y0 + oh + 11.4) * u;
  neverPale(P, C);
  return P;
}

// The birch kernel: an egg lid over an egg cup (bare birch outside, black lacquer inside, one gold band).
function kernelLid(C, st) {
  const P = new Prof(), sd = st.seed;
  P.at(0, 19.2);
  P.band({ c: C.birch, mo: MO.RINGS, n: 0.5, seed: sd, gloss: 0, dark: [0.34, 0.4], step: 1.6 }, [[3.5, 18.6], [6.2, 16.2]]);
  P.band({ c: C.birch, mo: MO.TOOL, n: 0.8, gloss: 0, dark: [0.4, 0.95], step: 1.8 }, [[8.4, 12.5], [9.2, 8], [9.3, 5.05]]);
  P.band({ c: C.birch, mo: MO.RINGS, n: 0.34, seed: sd, gloss: 0, step: 1 }, [[9.75, 5.02]]);
  P.bead({ c: C.birch, mo: MO.GRAIN, gloss: 0 }, 10, 6.3, 0.42);
  P.cove({ c: C.umber, mo: MO.PLAIN, gloss: 0 }, 9.96, 6.75, 0.12);                       // a burnt tool line
  P.band({ c: C.birch, mo: MO.GRAIN, gloss: 0, step: 0.9 }, [[9.97, 7.65], [9.9, 9], [9.75, 10.1]]);         // the wall
  P.cove({ c: C.umber, mo: MO.PLAIN, gloss: 0 }, 9.67, 10.55, 0.12);                      // the collar: a bead between two burnt tool lines cut as the lid's own lower one is (0.45 m tall, 0.12 deep), about where the mountain's shells carry their middle collar
  P.bead({ c: C.birch, mo: MO.GRAIN, gloss: 0, step: 0.4 }, 9.33, 12.15, 0.6);
  P.cove({ c: C.umber, mo: MO.PLAIN, gloss: 0 }, 9.2, 12.6, 0.12);
  P.band({ c: C.birch, mo: MO.GRAIN, gloss: 0, step: 0.9 }, [[8.48, 14.34], [7.6, 15.9], [5.6, 18.1]]);      // the shoulder
  P.cove({ c: C.umber, mo: MO.PLAIN, gloss: 0 }, 5.3, 18.4, 0.1);
  P.band({ c: C.birch, mo: MO.RINGS, n: 0.42, seed: sd + 0.2, gloss: 0, step: 0.8 }, [[3.6, 19.6], [1.5, 20.2]]);   // turned-off top
  P.bead({ c: C.birch, mo: MO.GRAIN, gloss: 0 }, 1.1, 20.9, 0.38);
  P.band({ c: C.gold, mo: MO.GOLD, step: 0.35 }, [[0.75, 21.2], [1.0, 21.7], [0.6, 22.4], [0, 22.9]]);              // a gold acorn
  P.top = 22.9;
  neverPale(P, C);
  return P;
}
function kernelCup(C, st) {
  const P = new Prof(), sd = st.seed;
  P.at(5.4, 0);
  P.bead({ c: C.birch, mo: MO.GRAIN, gloss: 0 }, 5.8, 1.1, 0.4);
  P.cove({ c: C.umber, mo: MO.PLAIN, gloss: 0 }, 5.9, 1.4, 0.1);
  P.band({ c: C.birch, mo: MO.GRAIN, gloss: 0, step: 0.7 }, [[7.6, 2.2], [9.4, 3.6], [9.95, 4.6]]);
  P.bead({ c: C.birch, mo: MO.GRAIN, gloss: 0 }, 9.7, 5.0, 0.3);
  P.band({ c: C.birch, mo: MO.RINGS, n: 0.34, seed: sd, gloss: 0, step: 1 }, [[9.25, 5.0]]);
  P.band({ c: C.gold, mo: MO.GOLD, step: 0.4 }, [[9.0, 4.75], [8.75, 4.3]]);                                         // the one gold band
  P.band({ c: C.black, c2: C.gold, mo: MO.DOTS, n: 36, spin: st.spin[0] * 0.5, seed: sd, step: 0.7 }, [[7.6, 3.5], [5.2, 2.75], [2.4, 2.45], [0, 2.4]]);
  neverPale(P, C);
  return P;
}
// The portal's frame and its black bowl: one solid of revolution about the portal's own axis (local +Y faces the dive).
// A dish 14.5 m in radius, black lacquer inside and out with one gold lip band, and at its centre the turned
// gold frame round the 7 m opening: seen down the dive the gold and the picture inside it sit in black on all sides.
function ringProfile(C, st) {
  const P = new Prof();
  P.at(7.1, -0.42);
  P.band({ c: C.black, c2: C.verm, mo: MO.COMMA, n: 16, hl: 1, seed: st.seed, spin: st.spin[0] * 0.12, step: 0.9 }, [[8.6, -0.8], [10.6, -0.5], [12.8, 0.9], [14.5, 2.8]]);   // the back: black, a comma frieze
  P.bead({ c: C.gold, mo: MO.GOLD, step: 0.3 }, 13.9, 3.6, 0.42);                                                  // the one gold band: the lip
  P.band({ c: C.black, step: 0.5 }, [[13.2, 3.2], [11.6, 1.95], [10.0, 1.05], [8.95, 0.78]]);                       // black lacquer, a shallow cove 5 m wide
  P.bead({ c: C.verm, c2: C.gold, mo: MO.DOTS, n: 52, spin: -st.spin[1] * 0.6, seed: st.seed + 0.4, step: 0.3 }, 8.75, 0.74, 0.14);   // a spinning bead at the frame's foot
  P.bead({ c: C.gold, mo: MO.GOLD, step: 0.25 }, 7.75, 0.66, 0.5);                                                  // the gold frame
  P.band({ c: C.black, step: 0.5 }, [[7.1, 0.42]]);
  P.bead({ c: C.verm, c2: C.gold, mo: MO.DOTS, n: 44, spin: st.spin[1], seed: st.seed, step: 0.3 }, 7.1, -0.42, 0.34);
  neverPale(P, C);
  return P;
}

const SHELLS = [[60, 180], [43, 130], [30, 90], [19, 56]];                 // widest radius, height
const ease = (x) => { x = clamp(x, 0, 1); return x * x * x * (x * (x * 6 - 15) + 10); };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('nesting-mountain') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const K = { black: aim(pal[0]), verm: aim(pal[1]), gold: aim(pal[2]), birch: aim(pal[3]), sage: aim(pal[4]), blue: aim(pal[5]), umber: aim(pal[6]) };
  K.cream = aim('#F1ECE0');
  const sun = new THREE.Vector3().copy(opts.sunDir || new THREE.Vector3(-0.42, 0.81, 0.41)).normalize();

  // per-shell colours: base, skirt stroke, body stroke, collar-B bead, shoulder stroke, collar beads, finial
  const COL = [
    { base: K.black, s1: K.verm, s2: K.verm, s3: K.cream, s4: K.gold, cb: K.verm, fin: K.verm },
    { base: K.verm, s1: K.black, s2: K.black, s3: K.cream, s4: K.gold, cb: K.black, fin: K.black },
    { base: K.sage, s1: K.cream, s2: K.cream, s3: K.cream, s4: K.gold, cb: K.black, fin: K.verm },
    { base: K.gold, s1: K.verm, s2: K.black, s3: K.cream, s4: K.black, cb: K.verm, fin: K.verm, goldBase: true },
  ];
  COL[2].s1 = K.verm;                                                       // sage carries vermilion berries
  for (const c of COL) { c.gold = K.gold; c.birch = K.birch; c.black = K.black; c.umber = K.umber; }
  const KC = { birch: K.birch, gold: K.gold, black: K.black, verm: K.verm, umber: K.umber };
  // NEVER PALE ON PALE, a rule of the paint for every lacquer set, with no dice: where a band's stroke colour and its coat
  // lie under 90 apart (their palette hexes, as RGB 0 to 255), the stroke takes whichever of the set's strong colours
  // (black, vermilion, gold, sage) lies farthest from the coat. A stroke laid in the coat's own paint is left as it is.
  const HEX = new Map([[K.black, pal[0]], [K.verm, pal[1]], [K.gold, pal[2]], [K.birch, pal[3]], [K.sage, pal[4]], [K.blue, pal[5]], [K.umber, pal[6]], [K.cream, '#F1ECE0']]
    .map(([c, hex]) => { const n = new THREE.Color(hex).getHex(); return [c, [n >> 16 & 255, n >> 8 & 255, n & 255]]; }));
  const apart = (a, b) => { const p = HEX.get(a), q = HEX.get(b); return Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); };
  const STRONG = [K.black, K.verm, K.gold, K.sage];
  const stroke = (c, c2) => (c2 === c || !HEX.has(c) || !HEX.has(c2) || apart(c, c2) >= 90 ? c2 : STRONG.reduce((far, k) => (apart(c, k) > apart(c, far) ? k : far)));
  for (const c of [...COL, KC]) c.stroke = stroke;

  // per-seed style: which frieze goes where, how full the shoulders are, collar heights, onion, spin
  const friezes = [[MO.COMMA, MO.PETAL, MO.LEAF], [MO.BERRY, MO.COMMA, MO.LEAF], [MO.PETAL, MO.BERRY, MO.LEAF], [MO.COMMA, MO.LEAF, MO.BERRY],
    [MO.PETAL, MO.COMMA, MO.LEAF], [MO.BERRY, MO.PETAL, MO.COMMA]];
  const off = rng.int(0, 5);
  const styles = SHELLS.map((s, i) => ({
    dishSpin: rng.range(0.16, 0.3) * (i % 2 ? -1 : 1),               // the dish friezes turn slowly, alternately
    seed: rng(), full: rng.range(0.95, 1.06), neck: rng.range(0.9, 1.1), waistCut: rng.range(0.8, 1.25),
    j: [rng.range(-2.5, 2.5), rng.range(-2.5, 2.5), rng.range(-2.5, 2.5)],
    mo: i === 2 ? [rng.pick([MO.PETAL, MO.BERRY]), rng.pick([MO.COMMA, MO.PETAL]), MO.LEAF] : friezes[(off + i * 2) % 6],
    dishMo: rng.pick([MO.COMMA, MO.BERRY, MO.LEAF]), cellK: rng.range(0.95, 1.3),
    spin: [rng.range(1.6, 2.6) * rng.sign(), rng.range(1.8, 3.0), rng.range(2.5, 4.0) * rng.sign()],
    reeds: rng.int(26, 40), finN: rng.int(7, 11), onionH: rng.range(20.4, 22.6), onionW: rng.range(0.22, 0.27),
  }));
  const kst = { seed: rng(), spin: [rng.range(2, 3), rng.range(2.5, 3.5) * rng.sign()] };

  // shared uniforms
  const U = {
    uTime: { value: 0 }, uSun: { value: sun }, uKey: { value: new THREE.Color(opts.keyColor || '#ffffff') },
    uGold: { value: K.gold }, uUmber: { value: K.umber },
    uSkyLo: { value: new THREE.Color(opts.skyLow || '#F4E9D0') }, uSkyHi: { value: new THREE.Color(opts.skyHigh || pal[5]) },
    uBell: { value: [0, 1, 2, 3, 4].map(() => new THREE.Vector4(0, 0, -1e4, 1)) }, uBellK: { value: [0, 0, 0, 0, 0] },
    uPix: { value: 0.0012 }, uLathe: { value: 0 },
    uWin: { value: new THREE.Vector4(0.16, 0.22, 0, 0.03) }, uWinK: { value: new THREE.Vector3(1.6, 1, 0) },
    uGlow: { value: new THREE.Vector4(0, 12, 0, 0) },
  };
  const lacquer = makeLacquer(U, opts.fog);
  const root = new THREE.Group(); root.name = 'nesting-mountain';

  // geometry: five bells (they move), five dishes merged with the portal frame's seat (they stay)
  const SEG = [96, 88, 80, 64, 48].map((n) => Math.round(n * (0.75 + 0.25 * detail) / 4) * 4);
  const bells = [], dishGeos = [], tops = [], lipY = [];
  for (let i = 0; i < 4; i++) {
    const [R, H] = SHELLS[i];
    const bp = bellProfile(R, H, COL[i], styles[i]);
    const g = turn(bp, SEG[i], 1);
    const m = new THREE.Mesh(g, lacquer); m.name = 'bell' + i; m.frustumCulled = false; root.add(m);
    bells.push(m); tops.push(bp.top); lipY.push(H * 0.158);
    await ctx.yield?.();
    dishGeos.push(turn(dishProfile(R, H, COL[i], styles[i]), SEG[i], 1));
    await ctx.yield?.();
  }
  {
    const lp = kernelLid(KC, kst), g = turn(lp, SEG[4], 1);
    const m = new THREE.Mesh(g, lacquer); m.name = 'kernel-lid'; m.frustumCulled = false; root.add(m);
    bells.push(m); tops.push(lp.top); lipY.push(5);
    dishGeos.push(turn(kernelCup(KC, kst), SEG[4], 1));
  }
  await ctx.yield?.();
  const dishGeo = mergeGeometries(dishGeos, false);
  dishGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 16, 0), 72); dishGeo.boundingBox = new THREE.Box3(new THREE.Vector3(-62, 0, -62), new THREE.Vector3(62, 34, 62));
  await ctx.yield?.();
  const dishes = new THREE.Mesh(dishGeo, lacquer); dishes.name = 'dishes'; root.add(dishes);
  for (const g of dishGeos) g.dispose();

  // the portal's turned frame, tilted 25 degrees to face the dive, standing in the black bowl
  const TILT = THREE.MathUtils.degToRad(25), seat = new THREE.Vector3(0, 16, 0);
  const facing = new THREE.Vector3(0, Math.sin(TILT), Math.cos(TILT));
  const ring = new THREE.Mesh(turn(ringProfile(KC, kst), 96, 1), lacquer); ring.name = 'portal-frame';
  ring.position.copy(seat); ring.rotation.x = Math.PI / 2 - TILT; ring.visible = opts.portalFrame !== false; root.add(ring);

  // stand-in glow behind the portal plane (the real portal covers it): turning lathe bands of gold light
  const glowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uTime: U.uTime, uOpen: { value: 0 }, uCol: { value: new THREE.Color(pal[2]) } },
    vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: /* glsl */`uniform float uTime, uOpen; uniform vec3 uCol; varying vec2 vQ;
      void main(){ float r = length(vQ), a = atan(vQ.y, abs(vQ.x) < 1e-5 ? 1e-5 : vQ.x);
        float bands = 0.5 + 0.5 * sin(r * 22.0 - uTime * 1.7 + 2.0 * sin(a * 3.0 + uTime * 0.6));
        float core = 1.0 - smoothstep(0.0, 1.0, r);
        vec3 c = mix(uCol * 1.3, vec3(1.0, 0.8, 0.5) * 1.9, core * core) * (0.5 + 0.5 * bands);
        gl_FragColor = vec4(c * uOpen * (1.0 - smoothstep(0.93, 1.0, r)), 1.0); }`,
  });
  const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 48), glowMat); glow.name = 'portal-glow'; glow.scale.setScalar(7.05);
  glow.position.copy(seat).addScaledVector(facing, -0.45); glow.rotation.x = -TILT; glow.visible = opts.portalGlow !== false; root.add(glow);

  // the seat's halo: a camera-facing additive glow at the portal seat, seen from every side through the closing turn
  // (the portal plane itself must face the dive, so from the side it is edge-on). It grows with the lid's lift and
  // stands down as the camera lines up on the dive, where the portal itself is the light.
  const haloMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
    uniforms: { uSeat: { value: seat.clone() }, uK: { value: 0 }, uSize: { value: 15 }, uTime: U.uTime },
    vertexShader: /* glsl */`uniform vec3 uSeat; uniform float uSize; varying vec2 vQ;
      void main(){ vQ = position.xy; vec4 c = viewMatrix * vec4(uSeat, 1.0);
        float dl = max(length(c.xyz), 1e-3); c.xyz -= c.xyz / dl * min(9.0, dl * 0.5);          // stand 9 m toward the eye: clear of the ring
        c.xy += position.xy * uSize; gl_Position = projectionMatrix * c; }`,
    fragmentShader: /* glsl */`uniform float uK, uTime; varying vec2 vQ;
      void main(){ float r = length(vQ), core = exp(-r * r * 16.0), mid = exp(-r * r * 3.6), far = max(1.0 - r, 0.0);
        float breathe = 0.94 + 0.06 * sin(uTime * 1.3);
        vec3 c = vec3(1.0, 0.8, 0.46) * core * 1.5 + vec3(1.0, 0.6, 0.2) * (mid * 0.85 + far * far * 0.2);
        gl_FragColor = vec4(c * uK * breathe, 1.0); }`,
  });
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), haloMat); halo.name = 'seat-halo'; halo.frustumCulled = false; halo.renderOrder = 3;
  halo.visible = opts.seatHalo !== false; root.add(halo);

  // the pearl: a ball of turned light held in the frame, so the seat reads as a bounded lit disc from every side while
  // the portal's own plane is still edge-on. As the camera comes round to face the ring the ball flattens along the
  // portal's axis into the opening and lies just behind the portal's plane, which then shows the next world in its place.
  const pearlMat = new THREE.ShaderMaterial({
    fog: false, uniforms: { uTime: U.uTime, uK: { value: 0 } },
    vertexShader: /* glsl */`varying vec3 vN, vV; varying float vL;
      void main(){ vL = position.y; vec4 mv = modelViewMatrix * vec4(position, 1.0); vV = mv.xyz; vN = normalMatrix * normal; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`uniform float uTime, uK; varying vec3 vN, vV; varying float vL;
      void main(){ vec3 n = normalize(vN + vec3(0.0, 0.0, 1e-5)), v = normalize(-vV + vec3(0.0, 0.0, 1e-5));
        float nv = abs(dot(n, v)), bands = 0.5 + 0.5 * sin(vL * 3.6 - uTime * 1.4);
        vec3 c = mix(vec3(1.05, 0.42, 0.07), vec3(1.7, 1.02, 0.3), nv * nv) * (0.88 + 0.12 * bands);
        gl_FragColor = vec4(c * uK, 1.0); }`,
  });
  const pearlG = new THREE.Group(); pearlG.position.copy(seat); pearlG.rotation.x = Math.PI / 2 - TILT; root.add(pearlG);
  const pearl = new THREE.Mesh(new THREE.SphereGeometry(6.7, 40, 24), pearlMat); pearl.name = 'seat-pearl'; pearl.frustumCulled = false;
  pearl.visible = false; pearlG.add(pearl);

  await ctx.yield?.();
  // soft shadow discs on the plain (multiplied): the dishes take theirs in the lacquer shader
  const shadowMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    blending: THREE.CustomBlending, blendSrc: THREE.DstColorFactor, blendDst: THREE.ZeroFactor,
    uniforms: { uK: { value: 1 } },
    vertexShader: 'varying vec2 vQ; void main(){ vQ = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uK; varying vec2 vQ; void main(){ float a = (1.0 - smoothstep(0.54, 1.0, length(vQ))) * uK; gl_FragColor = vec4(mix(vec3(1.0), vec3(0.58, 0.47, 0.40), a), 1.0); }',
  });
  const discGeo = new THREE.CircleGeometry(1, 40), discs = [];
  for (let i = 0; i < 5; i++) {
    const m = shadowMat.clone(); m.uniforms.uK = { value: 0 };
    const d = new THREE.Mesh(discGeo, m); d.rotation.x = -Math.PI / 2; d.position.y = 0.12; d.renderOrder = 2; d.name = 'shadow' + i;
    d.visible = opts.groundShadows !== false; root.add(d); discs.push(d);
  }

  { const m = shadowMat.clone(); m.uniforms.uK = { value: 0.9 }; const d = new THREE.Mesh(discGeo, m); d.rotation.x = -Math.PI / 2; d.position.y = 0.1;
    d.scale.setScalar(SHELLS[0][0] * 1.22); d.renderOrder = 2; d.name = 'shadow-base'; d.visible = opts.groundShadows !== false; root.add(d); discs.push(d); }

  // ---------- choreography: every bell is a function of the progress u ----------
  const phi0 = THREE.MathUtils.degToRad(188 + rng.range(-3, 3)), dphi = THREE.MathUtils.degToRad(73 + rng.range(-3, 3));
  const hangR = [230, 200, 175, 150], hangLip = [140, 150, 165, 190];
  const M = [
    { a: -0.18, b: 0.14, L1: 104, cv: 0.42, d: 0.14, c: 0.42 },     // 25 m up at u 0: a readable slot of vermilion in the first frame
    { a: 0.18, b: 0.33, L1: 76, cv: 0.8, d: 0.33, c: 0.56 },
    { a: 0.48, b: 0.56, L1: 100 - lipY[2], cv: 0.8, d: 0.56, c: 0.82 },
    { a: 0.58, b: 0.64, L1: 19, cv: 0.74, d: 0.70, c: 0.9 },
    { a: 0.63, b: 0.66, L1: 14, cv: 0.72, d: 0.66, c: 0.76 },
  ];
  for (let i = 0; i < 5; i++) {
    const m = M[i];
    if (i < 4) { const ph = phi0 + dphi * i; m.hx = Math.sin(ph) * hangR[i]; m.hz = Math.cos(ph) * hangR[i]; m.Lh = hangLip[i] - lipY[i]; m.thr = 2.6 * SHELLS[i][1] / 180; m.R = SHELLS[i][0]; }
    else { m.hx = 7; m.hz = -30; m.Lh = 40; m.thr = 0.6; m.R = 10; }
    m.dir = rng.sign(); m.bob = rng.range(0, TAU); m.turn = 0;
  }
  // THE TABLEAU (u 0.6). As the gold bell starts to turn, the three hung bells settle into one picture for the camera at
  // (-50, 64, 67) looking across the axis: the black one sinks where it hangs (far, centre), the vermilion one slides
  // round and down (left), the sage one swings out low over the far rim (near, right). s = { from, to, x, z, lip }.
  M[0].s = { u0: 0.5, u1: 0.605, x: M[0].hx, z: M[0].hz, lift: 52 - lipY[0] };
  M[1].s = { u0: 0.53, u1: 0.62, x: -124, z: -135, lift: 54 - lipY[1] };
  M[2].s = { u0: 0.535, u1: 0.612, x: 74, z: -70, lift: 60 - lipY[2] };
  // state of bell i at progress u: out = { x, y (lift), z, q (unscrew 0..1) }
  function bellState(i, u, out = {}) {
    const m = M[i], q = ease((u - m.a) / (0.4 * (m.b - m.a)));
    const r0 = m.a + 0.35 * (m.b - m.a), bv = m.b - 0.35 * (m.b - r0);
    out.y = m.thr * q + (m.L1 - m.thr) * ease((u - r0) / (m.b - r0)) + (m.Lh - m.L1) * ease((u - bv) / (m.cv - bv));
    const w = ease((u - m.d) / (m.c - m.d));
    out.x = m.hx * w; out.z = m.hz * w; out.q = q; out.w = w;
    if (m.s) { const e = ease((u - m.s.u0) / (m.s.u1 - m.s.u0)); out.x = lerp(out.x, m.s.x, e); out.z = lerp(out.z, m.s.z, e); out.y = lerp(out.y, m.s.lift, e); out.w = Math.max(w, e); }
    return out;
  }

  // ---------- anchors (local space) ----------
  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const diveStart = seat.clone().addScaledVector(facing, 60);                   // 60 m out along the portal's axis: (0, 37.4, 54.4)
  const cp = bellState(1, 0.42);
  const spiral = [];                                                            // E: 1.25 clockwise turns (seen from above), mountain to starboard
  for (let k = 0; k <= 10; k++) {
    const t = k / 10, th = THREE.MathUtils.degToRad(-158 - 450 * t), r = lerp(52, 85, Math.sin(Math.min(t * 1.6, 1) * Math.PI * 0.5));
    spiral.push(V3(Math.sin(th) * r, lerp(86, 40, ease(t)), Math.cos(th) * r));
  }
  const closing = [[80, 100, 41], [50, 118, 42], [25, 124, 43], [8, 108, 45]].map(([deg, r, y]) => { const th = THREE.MathUtils.degToRad(deg); return V3(Math.sin(th) * r, y, Math.cos(th) * r); });
  const anchors = {
    portalSeat: { position: seat.clone(), normal: facing.clone(), radius: 7, tiltDeg: 25 },
    diveStart, diveDir: facing.clone().negate(),
    flyThrough: [V3(0, 8, 600), V3(0, 8, 300), V3(-4, 30, 205), V3(-11, 86, 52), V3(-12, 86, 0), V3(-14, 86, -30), ...spiral, ...closing, V3(1.5, 49, 82), diveStart.clone(), seat.clone()],
    closePass: { u: 0.42, camera: V3(-12, 86, 0), sageCrown: V3(0, tops[2], 0), vermilionLip: V3(cp.x + SHELLS[1][0], lipY[1] + cp.y, cp.z) },
    summits: [{ u: 0, y: tops[0] }, { u: 0.14, y: tops[1] }, { u: 0.33, y: tops[2] }, { u: 0.56, y: tops[3] }, { u: 0.64, y: tops[4] }, { u: 0.67, y: seat.y }],
    rims: [0, 1, 2, 3].map((i) => ({ radius: SHELLS[i][0], y: lipY[i] + M[i].thr })).concat([{ radius: 10, y: 5 }]),
    hang: M.map((m, i) => (m.s ? { position: V3(m.s.x, lipY[i] + m.s.lift, m.s.z), radius: m.R, top: tops[i] - lipY[i] } : { position: V3(m.hx, lipY[i] + m.Lh, m.hz), radius: m.R, top: tops[i] - lipY[i] })),
    hangEarly: [1, 2].map((i) => ({ position: V3(M[i].hx, lipY[i] + M[i].Lh, M[i].hz), radius: M[i].R })).concat([{ position: V3((M[1].hx - 124) / 2, 100, (M[1].hz - 135) / 2), radius: 43 }]),   // where bells wait before the tableau
    viewpoints: { entry: V3(0, 8, 600), threeBells: V3(60, 62, 60), finalRims: V3(0, 40, 60) },
    extent: { radius: 292, height: 300 },
    sunDir: sun.clone(),
  };

  // ---------- animation ----------
  let progress = null;
  const fixedU = opts.fixedU ?? null, orbitDemo = !!opts.orbitDemo;                 // test hooks, by option only
  const st = {}, wp = new THREE.Vector3(), cl = new THREE.Vector3(), size = new THREE.Vector2();
  const shadows = M.map(() => ({ x: 0, z: 0, y: 0, radius: 1, strength: 0 }));
  function update(dt, time, camera) {
    U.uTime.value = time;
    let u = progress;
    if (u === null) {
      if (fixedU !== null) u = fixedU;
      else if (orbitDemo && camera) { cl.setFromMatrixPosition(camera.matrixWorld); root.worldToLocal(cl); let az = Math.atan2(cl.x, cl.z); if (az < -0.6) az += TAU; u = clamp((az + 0.3) / 4.4, 0, 1); }
      else u = Math.min(1, (time / 47) % 1.2);                                  // nobody is driving: loop the whole show
    }
    if (camera && ctx.renderer?.getDrawingBufferSize) {
      ctx.renderer.getDrawingBufferSize(size);
      if (size.y > 0 && camera.fov) U.uPix.value = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) * 0.5) / size.y;
    }
    root.updateWorldMatrix(true, false);
    const sc = root.matrixWorld.getMaxScaleOnAxis();
    for (let i = 0; i < 5; i++) {
      const m = M[i], b = bells[i]; bellState(i, u, st);
      const up = smoothstep(m.thr, m.thr + 12, st.y);
      m.turn += Math.min(dt, 0.1) * (TAU / 30) * m.dir * up;                      // hangs turning once in 30 s
      const bob = Math.sin(time * 0.45 + m.bob) * 1.1 * st.w, sway = Math.sin(time * 0.31 + m.bob * 2) * 1.6 * st.w;
      b.position.set(st.x + sway, st.y + bob, st.z);
      b.rotation.y = st.q * Math.PI * 0.5 + m.turn;
      const lip = lipY[i] + st.y + bob, k = smoothstep(1, 12, st.y);
      wp.set(b.position.x, lip, b.position.z); root.localToWorld(wp);
      U.uBell.value[i].set(wp.x, wp.z, wp.y, m.R * sc); U.uBellK.value[i] = k;
      const s = shadows[i]; s.x = b.position.x; s.z = b.position.z; s.y = lip; s.radius = m.R * 1.15 + lip * 0.1; s.strength = k / (1 + lip * 0.004);
      discs[i].position.set(s.x, 0.12, s.z); discs[i].scale.setScalar(s.radius); discs[i].material.uniforms.uK.value = s.strength;
    }
    const open = smoothstep(0.5, 10, bells[4].position.y);
    const grow = 0.5 + 0.5 * smoothstep(3, 30, bells[4].position.y);            // the bowl opens out of the cup as the lid leaves
    ring.scale.setScalar(grow);
    glowMat.uniforms.uOpen.value = open;
    // gold light from the seat: the lacquer takes it near the seat; the halo carries it to the eye from every side
    const lit = smoothstep(1, 13, bells[4].position.y);                    // the rising gold bell hides it by depth until its lip clears
    wp.copy(seat); root.localToWorld(wp); U.uGlow.value.set(wp.x, wp.y, wp.z, lit);
    haloMat.uniforms.uSeat.value.copy(wp);
    let hk = lit * 0.42, flat = 1;
    if (camera) {
      cl.setFromMatrixPosition(camera.matrixWorld).sub(wp); const dist = cl.length(); cl.divideScalar(Math.max(dist, 1e-3));
      const face = Math.max(0, cl.dot(facing)), f2 = face * face;
      hk *= smoothstep(20, 72, dist) * (1 - f2 * f2);                      // stands down as the camera lines up on the dive
      flat = 1 - smoothstep(0.34, 0.74, face);
    }
    haloMat.uniforms.uK.value = hk;
    const py = Math.max(0.012, flat);
    pearl.scale.set(grow, grow * py, grow); pearl.position.y = -0.3 * (1 - flat);
    pearl.visible = lit > 0.002; pearlMat.uniforms.uK.value = 0.35 + 0.65 * lit;
    hero.progress = u;
  }

  const hero = {
    object: root, radius: 120, height: 190, center: V3(0, 80, 0), anchors, uniforms: U, material: lacquer, colors: K,
    update, setProgress(u) { progress = (u === null || u === undefined) ? null : clamp(u, 0, 1); },
    bellState, shadows, progress: 0,
    dispose() { for (const d of discs) d.material.dispose(); shadowMat.dispose(); },
    ground: true, groundY: 0,
  };
  update(0, 0, null);
  return hero;
}

// The lathe kit, shared with the world file (src/worlds/turned-country.js).
export { Prof, turn, aim, MO, cells, LACQUER_VERT, LACQUER_FRAG, DEFAULT_PALETTE };
