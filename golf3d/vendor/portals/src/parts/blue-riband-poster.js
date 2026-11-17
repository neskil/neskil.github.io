// THE BLUE RIBAND: hero set piece for the world "blue-riband-poster".
// A 310 m art-deco express liner drawn as a pochoir / airbrush travel poster in true 3D geometry.
//
// COORDINATES. The brief speaks in ship coordinates (s metres aft of the stem at the waterline, p metres to
// port, h above the water). Local space of `object`: x = p, y = h, z = 155 - s. So the origin is the base
// centre amidships on the waterline, +Y up, and the bow points to +Z ("front"). shipToLocal(s, p, h) and
// localToShip(v) are exported. The stem at the waterline is local (0, 0, 155); the taffrail is z = -155.
//
// SIZE. radius 172 (half length plus bow rake), height 84 (masthead truck). Hull 38 m high at the bow, 31
// amidships, 20 at the stern; upperworks in three tiers to h 46 (s 85..266); funnels at s 140, 182, 224,
// tops h 68, 66.5, 65; foremast at s 60 to h 82.
//
// THE STERN CASCADE (search for it in buildHero; sternArt() draws one terrace). Five terraces at h 41, 36, 31,
// 25.5 and 20 end aft in pointed ogives whose lips stand at s 255, 266, 279, 294 and 310 (the hull steps down at
// nominal stations STEP_A 270 and STEP_B 285). Each deck is laid in cream and gold planking bands with a teal
// stepped shadow, and each lip carries a glazed windscreen: a dark GOLD-to-TEAL band with navy lozenge lights and
// a cream cap rail. The lips are spaced so that the glide down from funnel height (camera near s 236, h 59) sees
// a slice of every deck and the inner face of every screen: no aft-facing riser can show from there.
//
// STYLE (how the poster is done; reuse it for the whole world). ONE unlit shader, "inkFill":
//   attribute vec4 aInk = (g, inkA, inkB, glow).  g is 0..1 along the object's own axis; inkA / inkB index the
//   five-ink uniform palette uInk[5] (INK.NAVY 0, TEAL 1, CREAM 2, GOLD 3, VERM 4); glow lifts the colour by
//   9% per unit, at most 1.5 (0 = ordinary fill, 1.3 = a lit porthole): a lit lamp is one lighter flat ink, made
//   for post { flat: 1 } with bloom off.
//   fragment: g slides by uSlide (0.06) on a slow sine (the airbrush pass), is snapped to FIVE steps and the
//   colour is mix(inkA, inkB, step/4). Grain exists only at the steps: inside a band 6 px wide around each
//   step boundary (width from fwidth(g)) a screen-space ordered threshold, 2 px per texel, re-dealt 3 times a
//   second, picks the lower or the upper step. No lights, no normals, no fog, no outlines.
//   Optional stepped haze: uHazeP = (stepDistance, maxSteps, amountPerStep) toward uHaze (off by default).
//   const style = createInkStyle(palette);  style.material({ head, motion, uniforms, side, defines })
//   gives a ShaderMaterial; `head` is extra vertex declarations and `motion` is vertex GLSL that may change
//   `pos` (object space, before instancing), `g`, `ia`, `ib`, `glow`. style.uniforms.uTime is shared: call
//   style.tick(time) once a frame (hero.update does it). inkGeometry(builder) / new InkBuilder() make merged
//   geometry with the aInk attribute. Never fill VERM to NAVY (brown): use VERM to GOLD.
//
// OPTS. palette (5 hex strings: navy, teal, cream, gold, vermilion), livery 'black' | 'cream' (default by
// seed, mostly black), funnels 2 | 3 (default by seed, mostly 3), streamers (count, default 300 x
// quality.detail), pitchDeg (0.5, a 9 s pitch of the ship group only), smoke (true), volutes (true: bow-wave
// scrolls, spiral faces and spray fans), voluteScale (1), waterline (true: foam scallops, contact band,
// zigzag reflections and scupper ribbons lying at y 0.1..0.2; clear the world's own scallops there), night
// (false; true lights every window and porthole), loom (2: see HOOKS; 1 turns it off).
//
// ANCHORS (all local space). portalSeat { position, facing }: the 14 m ring on the water astern, ship
// (438, 0, 8), facing back up the wake (+Z). flyThrough: the brief's journey as an ordered list of local
// points for makePath, with one pin point on the approach and the funnel gap re-cut so the line keeps 7.5 m
// from funnels 1 and 2 (measured clearance from all solid geometry is at least 6.3 m everywhere except the
// water at the stem: foam line 3.6 m, volute scroll about 3 m below left, as the brief stages it).
// viewpoints: entry, bowClose, climb, funnels, stern. bowMedallion, anchorPort, funnelTops[], whistle,
// mastHead, bridge, taffrail, ensign, voluteEyePort, sunDir (unit vector toward the painted sun: 14 degrees
// up on the starboard quarter; every drawn shadow on the ship assumes it), tugs[], fireboats[] (the brief's
// seats).
//
// HOOKS. update(dt, time, camera) drives everything. hero.setLitFront(s): portholes forward of ship-s light
// up (the wave running aft); by default the front follows the camera, 22 m ahead of it. hero.setProgress(u)
// maps u 0..1 to that front along the journey (null returns to automatic). hero.setLoom(k): poster
// perspective. From 2 m above the sea the true funnels are hidden behind the bow and bridge, so while the
// camera is ahead of the stem and low (h under 10..30) the funnel group is loomed: stretched in height by k
// (default 3.8 at s <= -80, easing to 1 at s = -12 while the flare hides it), widened by up to 1.6 and sheared
// so funnels 2 and 3 stand 7.5 and 15 m further to port (the entry camera's right): three organ pipes stepping
// out beside the bow spike. The smoke is not stretched. It is one matrix on the `stack` group, set in update();
// setLoom(1) pins the true shape, null returns to automatic. hero.style is the ink style (share it); hero.uniforms its shared uniforms
// (uTime, uInk, uHaze, uHazeP, uPx).
//
// LIVERIES. LIVERY.black: navy to teal strakes, vermilion funnels. LIVERY.cream: its strake() gives every strake
// its own fill (cream and gold to port, cream toward teal to starboard, the teal riband at h 18.8-23.6), a teal
// bulwark and navy-rimmed portholes; gold funnels capped vermilion.
//
// COST. About 94k triangles, 9 draw calls (hull and fittings, funnels, portholes, lines, flags, streamers,
// smoke, volutes, waterline), no lights, no textures, about 0.25 s to build. LIGHTING: none wanted, none
// used; it ignores scene lights and scene fog on purpose (the style has stepped haze instead). Made for
// post { flat: 1 } with bloom off: nothing here exceeds 1.0.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const INK = { NAVY: 0, TEAL: 1, CREAM: 2, GOLD: 3, VERM: 4 };
export const BRIEF_PALETTE = ['#0A1730', '#1E7C86', '#F3E7C9', '#E6C06C', '#E3421F'];
const { NAVY, TEAL, CREAM, GOLD, VERM } = INK;
const PI = Math.PI, TAU = PI * 2, D2R = PI / 180;
const HALF = 155;
export const shipToLocal = (s, p, h, out = new THREE.Vector3()) => out.set(p, h, HALF - s);
export const localToShip = (v) => ({ s: HALF - v.z, p: v.x, h: v.y });

// ---------------------------------------------------------------- the style
export const INK_VERT_HEAD = /* glsl */`
attribute vec4 aInk;
uniform vec3 uInk[5];
uniform float uTime;
varying float vG; varying vec3 vA; varying vec3 vB; varying float vGlow; varying float vDist;
vec3 inkAt(float i){
  int k = int(clamp(i, 0.0, 4.0) + 0.5);
  if (k == 0) return uInk[0]; if (k == 1) return uInk[1]; if (k == 2) return uInk[2]; if (k == 3) return uInk[3];
  return uInk[4];
}
`;
export const INK_FRAG = /* glsl */`
uniform float uTime; uniform float uSlide; uniform float uPhase;
uniform vec3 uHaze; uniform vec3 uHazeP;
varying float vG; varying vec3 vA; varying vec3 vB; varying float vGlow; varying float vDist;
float inkDither(vec2 p){ return fract(52.9829189*fract(dot(p, vec2(0.06711056, 0.00583715)))); }
// five posterised steps of g with stipple only inside a 6 px band round each step boundary
float inkStep(float g){
  float x = clamp(g, 0.0, 0.9999)*5.0;
  float k = floor(x), f = x - k;
  float w = max(fwidth(g)*5.0, 1e-5);
  float tile = floor(uTime*3.0);
  vec2 q = floor(gl_FragCoord.xy*0.5) + vec2(mod(tile*17.0, 64.0), mod(tile*29.0, 64.0));
  float n = inkDither(q);
  if (f < 0.5) { float pr = clamp(0.5 + (f/w)/6.0, 0.0, 1.0); if (k > 0.5 && n > pr) k -= 1.0; }
  else { float pr = clamp(0.5 + ((1.0 - f)/w)/6.0, 0.0, 1.0); if (k < 3.5 && n > pr) k += 1.0; }
  return k*0.25;
}
void main(){
  float g = vG + uSlide*sin(uTime*0.42 + uPhase);
  vec3 col = mix(vA, vB, inkStep(g))*(1.0 + 0.09*min(vGlow, 1.5));     // a lit lamp is one lighter flat ink (bloom is off)
  if (uHazeP.x > 0.0) col = mix(col, uHaze, clamp(floor(vDist/uHazeP.x), 0.0, uHazeP.y)*uHazeP.z);
  gl_FragColor = vec4(col, 1.0);
}
`;

export function createInkStyle(palette = BRIEF_PALETTE) {
  const inks = [];
  for (let i = 0; i < 5; i++) inks.push(new THREE.Color(palette[i] ?? BRIEF_PALETTE[i]));
  const uniforms = {
    uInk: { value: inks }, uTime: { value: 0 },
    uHaze: { value: new THREE.Color(palette[3] ?? BRIEF_PALETTE[3]) }, uHazeP: { value: new THREE.Vector3(0, 3, 0.22) },
    uPx: { value: 0.0027 },          // radians per pixel (set every frame by the hero)
  };
  const style = {
    uniforms, inks,
    tick(time) { uniforms.uTime.value = time; },
    // opts: head (vertex declarations), motion (vertex code), uniforms, side, slide, phase, defines
    material(o = {}) {
      const u = { uInk: uniforms.uInk, uTime: uniforms.uTime, uHaze: uniforms.uHaze, uHazeP: uniforms.uHazeP, uPx: uniforms.uPx,
        uSlide: { value: o.slide ?? 0.06 }, uPhase: { value: o.phase ?? 0 }, ...(o.uniforms || {}) };
      return new THREE.ShaderMaterial({
        uniforms: u, side: o.side ?? THREE.DoubleSide, defines: o.defines || {}, fog: false,
        vertexShader: INK_VERT_HEAD + (o.head || '') + /* glsl */`
void main(){
  vec3 pos = position; float g = aInk.x, ia = aInk.y, ib = aInk.z, glow = aInk.w;
  ${o.motion || ''}
  #ifdef USE_INSTANCING
  vec4 mv = modelViewMatrix*instanceMatrix*vec4(pos, 1.0);
  #else
  vec4 mv = modelViewMatrix*vec4(pos, 1.0);
  #endif
  vG = g; vA = inkAt(ia); vB = inkAt(ib); vGlow = glow; vDist = -mv.z;
  gl_Position = projectionMatrix*mv;
}`,
        fragmentShader: INK_FRAG,
      });
    },
  };
  return style;
}

// Geometry builder in SHIP coordinates: every vertex is (s, p, h, g) and each face carries two inks.
export class InkBuilder {
  constructor() { this.P = []; this.K = []; this.T = null; }
  v(s, p, h, g, a, b, w = 0) {
    if (this.T) { const q = this.T(s, p, h); s = q[0]; p = q[1]; h = q[2]; }
    this.P.push(p, h, HALF - s); this.K.push(g, a, b, w);
  }
  tri(A, B, C, a, b, w = 0) { this.v(A[0], A[1], A[2], A[3], a, b, w); this.v(B[0], B[1], B[2], B[3], a, b, w); this.v(C[0], C[1], C[2], C[3], a, b, w); }
  quad(A, B, C, D, a, b, w = 0) { this.tri(A, B, C, a, b, w); this.tri(A, C, D, a, b, w); }
  // closed loops of equal length joined by quads
  loft(rings, a, b, closed = true, w = 0) {
    for (let i = 0; i + 1 < rings.length; i++) {
      const r0 = rings[i], r1 = rings[i + 1], n = r0.length, m = closed ? n : n - 1;
      for (let j = 0; j < m; j++) { const k = (j + 1) % n; this.quad(r0[j], r0[k], r1[k], r1[j], a, b, w); }
    }
  }
  fan(c, ring, a, b, closed = true, w = 0) {
    const n = ring.length, m = closed ? n : n - 1;
    for (let j = 0; j < m; j++) this.tri(c, ring[j], ring[(j + 1) % n], a, b, w);
  }
  // two polylines joined by quads
  strip(A, B, a, b, w = 0) { for (let i = 0; i + 1 < A.length; i++) this.quad(A[i], A[i + 1], B[i + 1], B[i], a, b, w); }
  box(s0, s1, p0, p1, h0, h1, a, b, g0 = 0.2, g1 = 0.9) {
    const c = (s, p, h, g) => [s, p, h, g];
    this.quad(c(s0, p0, h0, g0), c(s1, p0, h0, g0), c(s1, p0, h1, g1), c(s0, p0, h1, g1), a, b);
    this.quad(c(s0, p1, h0, g0 - 0.15), c(s1, p1, h0, g0 - 0.15), c(s1, p1, h1, g1 - 0.15), c(s0, p1, h1, g1 - 0.15), a, b);
    this.quad(c(s0, p0, h0, g0), c(s0, p1, h0, g0 - 0.15), c(s0, p1, h1, g1 - 0.15), c(s0, p0, h1, g1), a, b);
    this.quad(c(s1, p0, h0, g0), c(s1, p1, h0, g0 - 0.15), c(s1, p1, h1, g1 - 0.15), c(s1, p0, h1, g1), a, b);
    this.quad(c(s0, p0, h1, g1), c(s1, p0, h1, g1 + 0.1), c(s1, p1, h1, g1 + 0.1), c(s0, p1, h1, g1), a, b);
  }
  get triangles() { return this.P.length / 9; }
}
export function inkGeometry(b) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(b.P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(b.K), 4));
  return geo;
}

// ---------------------------------------------------------------- hull form
const TAN20 = Math.tan(20 * D2R), TAN10 = Math.tan(10 * D2R);
const sm = (a, b, x) => smoothstep(a, b, x);
const STEP_A = 270, STEP_B = 285;   // nominal stations of the two hull steps of the stern cascade
// sheer height at nominal station sn (0 stem .. 310 taffrail); the stern steps down in terraces
function sheer(sn) {
  if (sn < 110) return 31 + 7 * Math.pow(1 - sn / 110, 1.8);
  if (sn < STEP_A) return 31;
  if (sn < STEP_B) return 25.5;
  return 20;
}
// half breadth at nominal station and height
function hbN(sn, h) {
  const t = clamp(sn / 110, 0, 1);
  let w = 18 * Math.pow(Math.sin(t * PI / 2), 1.5);
  if (sn > 225) {
    const q = clamp((sn - 225) / 85, 0, 1);
    let ws = 18 * Math.sqrt(Math.max(0, 1 - Math.pow(q, 2.4)));
    ws *= lerp(1, lerp(0.45, 1, sm(0, 17, h)), sm(232, 300, sn));
    w = Math.min(w, ws);
  }
  const F = 7.5 * sm(0, 16, sn) * (1 - sm(30, 105, sn));
  w += F * Math.pow(clamp(h / 36, 0, 1.1), 2.5);
  w *= lerp(0.72, 1, sm(-3, 5, h));
  return Math.max(w, 0.14);
}
const stemS = (h) => (h > 0 ? -h * TAN20 : 0);
const sternS = (h) => 300 + 10 * Math.pow(clamp(h / 20, 0, 1), 0.7);
// true s of a nominal station at height h (the raked stem and the counter stern shear the stations)
const hullS = (sn, h) => { const a = stemS(h); return a + (sn / 310) * (sternS(h) - a); };
const nomS = (s, h) => { const a = stemS(h); return clamp((s - a) / (sternS(h) - a), 0, 1) * 310; };
// half breadth at a true (s, h)
const hbT = (s, h) => hbN(nomS(s, h), h);

// ---------------------------------------------------------------- generic modelling helpers
// tube along a path of [s,p,h]; radii per point; B = fixed binormal (the path should lie roughly in the plane normal to it)
function tube(m, pts, radii, n, a, b, o = {}) {
  const B = o.B || [0, 1, 0], g0 = o.g0 ?? 0.15, gr = o.gr ?? 0.6, a0 = o.a0 ?? 0, rings = [];
  for (let i = 0; i < pts.length; i++) {
    const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)];
    let tx = q[0] - r[0], ty = q[1] - r[1], tz = q[2] - r[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    let nx = ty * B[2] - tz * B[1], ny = tz * B[0] - tx * B[2], nz = tx * B[1] - ty * B[0]; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
    const bx = ty * nz - tz * ny, by = tz * nx - tx * nz, bz = tx * ny - ty * nx;
    const R = typeof radii === 'number' ? radii : radii[i], ring = [];
    for (let j = 0; j < n; j++) {
      const an = (j / n) * TAU, c = Math.cos(an) * R, s = Math.sin(an) * R * (o.flat ?? 1);
      ring.push([pts[i][0] + nx * c + bx * s, pts[i][1] + ny * c + by * s, pts[i][2] + nz * c + bz * s, g0 + gr * (0.5 + 0.5 * Math.cos(an - a0)) + (o.gl ?? 0) * (i / (pts.length - 1))]);
    }
    rings.push(ring);
  }
  m.loft(rings, a, b);
  if (o.cap) { const L = pts.length - 1; m.fan([pts[L][0], pts[L][1], pts[L][2], o.capG ?? g0], rings[L], o.capA ?? a, o.capB ?? b); }
  return rings;
}
// flat hexagonal lozenge centred at c (ship coords), along unit tangent t (in the s,p plane), upright
function lozenge(m, c, t, w, hh, a, b, g0 = 0.02, g1 = 0.5, glow = 0) {
  const P = (u, v) => [c[0] + t[0] * u, c[1] + t[1] * u, c[2] + v, lerp(g0, g1, v / hh + 0.5)];
  const p0 = P(-w / 2, 0), p1 = P(-w / 4, hh / 2), p2 = P(w / 4, hh / 2), p3 = P(w / 2, 0), p4 = P(w / 4, -hh / 2), p5 = P(-w / 4, -hh / 2);
  m.tri(p0, p1, p2, a, b, glow); m.tri(p0, p2, p3, a, b, glow); m.tri(p0, p3, p4, a, b, glow); m.tri(p0, p4, p5, a, b, glow);
}
// map (s, h, g) points drawn on the side elevation onto the hull plating, `off` metres proud; sd = +1 port, -1 starboard
const onHull = (sd, s, h, g, off = 0.12) => [s, sd * (hbT(s, h) + off), h, g];

// ---------------------------------------------------------------- hull
async function buildHull(m, L, pause) {
  const st = [0, 0.6, 1.5, 2.5, 4, 6, 8, 10, 12.5];
  for (let x = 15; x <= 300; x += 2.5) st.push(x);
  st.push(STEP_A - 0.01, STEP_A + 0.01, STEP_B - 0.01, STEP_B + 0.01, 302, 304, 306, 307.5, 308.6, 309.4, 310);
  st.sort((a, b) => a - b);
  const hs = [-3, 0, 2]; for (let h = 4.4; h < 41; h += 2.4) hs.push(h);
  const gHull = (sn, k, sd) => L.hullG0 + 0.22 * ((hs[k] + hs[k + 1]) * 0.5 / 38) + 0.08 * (sn / 310) + (k % 2 ? 0.1 : 0) + (sd < 0 ? 0.04 : 0);
  const gBoot = (sn, sd) => 0.05 + 0.12 * (sn / 310) + (sd < 0 ? 0.1 : 0);
  for (const sd of [1, -1]) {
    for (let i = 0; i + 1 < st.length; i++) {
      if (pause && i % 8 === 7) await pause();
      const a = st[i], b = st[i + 1], Ha = sheer(a), Hb = sheer(b);
      for (let k = 0; k + 1 < hs.length; k++) {
        const h0 = hs[k], h1 = hs[k + 1];
        if (h0 >= Math.max(Ha, Hb)) break;
        const boot = k < 2, lap = boot ? 0.05 : 0.14;
        const F = !boot && L.strake ? L.strake(k, sd, (h0 + h1) * 0.5) : null;
        const ga = boot ? gBoot(a, sd) : F ? F[2] - F[3] * (a / 310) : gHull(a, k, sd), gb = boot ? gBoot(b, sd) : F ? F[2] - F[3] * (b / 310) : gHull(b, k, sd);
        const iA = boot ? L.bootA : F ? F[0] : L.hullA, iB = boot ? L.bootB : F ? F[1] : L.hullB;
        const P = (sn, h, off, g) => [hullS(sn, h), sd * (hbN(sn, h) + off), h, g];
        m.quad(P(a, Math.min(h0, Ha), lap, ga), P(b, Math.min(h0, Hb), lap, gb), P(b, Math.min(h1, Hb), 0, gb), P(a, Math.min(h1, Ha), 0, ga), iA, iB);
        // the lap: a ledge under each strake, one step lighter, so the plating reads as drawn lines
        if (!boot && h0 < Math.min(Ha, Hb)) m.quad(P(a, h0, lap, ga + 0.2), P(b, h0, lap, gb + 0.2), P(b, h0, 0, gb + 0.2), P(a, h0, 0, ga + 0.2), iA, iB);
      }
      if (Math.abs(Ha - Hb) < 1) {
        const R = (sn, H, d0, d1, off, g0, g1, ia, ib) => {
          const q = (x, h, g) => [hullS(x, h), sd * (hbN(x, h) + off), h, g];
          m.quad(q(a, sheer(a) + d0, g0), q(b, sheer(b) + d0, g0), q(b, sheer(b) + d1, g1), q(a, sheer(a) + d1, g1), ia, ib);
        };
        // sheer riband, bulwark or rail, capping
        R(a, Ha, -L.ribH - 0.7, -0.7, 0.2, L.ribG, L.ribG + 0.05, L.ribA, L.ribB);
        if (a < 84) { if (L.bulA != null) R(a, Ha, 0, 1.25, 0, L.bulG, L.bulG + 0.08, L.bulA, L.bulB); else R(a, Ha, 0, 1.25, 0, gHull(a, 13, sd), gHull(a, 13, sd) + 0.1, L.hullA, L.hullB); R(a, Ha, 1.25, 1.55, 0.1, 0.75, 0.95, GOLD, CREAM); }
        else R(a, Ha, 0, 1.1, 0, 0.55, 1.0, GOLD, CREAM);
        // rubbing strake
        if (a > 14 && b < STEP_A - 2) R(a, Ha, 26.5 - Ha, 27.25 - Ha, 0.32, 0.12, 0.3, L.rubA, L.rubB);
      }
    }
  }
  // stem bar and deck
  for (let k = 0; k + 1 < hs.length; k++) {
    const h0 = Math.min(hs[k], 38), h1 = Math.min(hs[k + 1], 38); if (h1 <= h0) break;
    const q = (h, p) => [hullS(0, h) - 0.1, p, h, 0.2];
    const F = k >= 2 && L.strake ? L.strake(k, 1, (h0 + h1) * 0.5) : null;
    m.quad(q(h0, 0.2), q(h0, -0.2), q(h1, -0.2), q(h1, 0.2), k < 2 ? L.bootA : F ? F[0] : L.hullA, k < 2 ? L.bootB : F ? F[1] : L.hullB);
  }
  for (let i = 0; i + 1 < st.length; i++) {
    const a = st[i], b = st[i + 1], Ha = sheer(a), Hb = sheer(b), ga = 0.5 + 0.45 * (a / 310), gb = 0.5 + 0.45 * (b / 310);
    const q = (sn, H, sd, g) => [hullS(sn, H), sd * hbN(sn, H), H, g];
    m.quad(q(a, Ha, 1, ga * 0.4 + 0.02), q(b, Hb, 1, gb * 0.4 + 0.02), q(b, Hb, -1, gb * 0.4 + 0.12), q(a, Ha, -1, ga * 0.4 + 0.12), GOLD, CREAM);
  }
  // freeing ports in the bulwark, and hawse-pipe lips
  for (const sd of [1, -1]) for (let s = 14; s < 82; s += 4.5) {
    const h = sheer(nomS(s, 34)) + 0.5, c = onHull(sd, s, h, 0, 0.08);
    lozenge(m, c, [1, 0], 1.7, 0.55, TEAL, CREAM, 0.25, 0.25);
  }
  for (const sd of [1, -1]) for (let s = 36; s < 264; s += 3.4) {
    const h = 28.55, d = sd * (hbT(s + 0.5, h) - hbT(s - 0.5, h)), l = Math.hypot(1, d), t = [1 / l, d / l];
    lozenge(m, onHull(sd, s, h, 0, 0.26), t, 2.6, 1.75, GOLD, CREAM, 0.6, 1.0);
    if (L.night) lozenge(m, onHull(sd, s, h, 0, 0.33), t, 1.95, 1.2, GOLD, CREAM, 0.6, 1.0, 1.0);
    else lozenge(m, onHull(sd, s, h, 0, 0.33), t, 1.95, 1.2, NAVY, TEAL, 0.02, 0.46);
  }
}

// ---------------------------------------------------------------- deck tiers (upperworks, terraces, bridge)
const SUN_TH = -40 * D2R;            // horizontal bearing of the painted sun in ship (s, p): aft and to starboard
// og > 0 draws the aft end as a pointed ogive, half breadth wa*(1 - t^og), with na points; og = 0 is the old half ellipse
function tierOutline(s0, s1, hw, df, da, step = 2.5, n = 10, og = 0, na = n) {
  const o = [];
  for (let s = s0; s < s1 - 0.3; s += step) o.push([s, hw(s)]);
  o.push([s1, hw(s1)]);
  const wa = hw(s1), wf = hw(s0);
  if (da > 0) for (let i = 1; i < na; i++) { const a = (i / na) * PI, c = Math.cos(a); o.push(og ? [s1 + da * Math.pow(1 - Math.abs(c), 1 / og), wa * c] : [s1 + da * Math.sin(a), wa * c]); }
  for (let s = s1; s > s0 + 0.3; s -= step) o.push([s, -hw(s)]);
  o.push([s0, -hw(s0)]);
  if (df > 0) for (let i = 1; i < n; i++) { const a = (i / n) * PI; o.push([s0 - df * Math.sin(a), -wf * Math.cos(a)]); }
  return o;
}
function outlineNormals(o) {
  const n = o.length, N = [];
  for (let i = 0; i < n; i++) {
    const a = o[(i + n - 1) % n], b = o[(i + 1) % n]; const ds = b[0] - a[0], dp = b[1] - a[1], l = Math.hypot(ds, dp) || 1;
    N.push([-dp / l, ds / l]);
  }
  return N;
}
// One terrace of the stern cascade, as the camera gliding down from funnel height sees it (from forward and above,
// where no aft-facing riser can show): arc = the lip's aft arc [[s,p]..] from the port shoulder round the tip to
// the starboard shoulder. Lays the deck in alternate cream and gold planking bands (copies of the arc scaled about
// (cx, 0), so they never cross), a teal stepped shadow thrown inboard of the lip, and along the lip a glazed
// windscreen: a dark GOLD-to-TEAL band leaning outboard with a row of navy lozenge lights and a cream cap rail.
// Its inner face is what parts each terrace from the next in that view.
function sternArt(m, arc, cx, h, o = {}) {
  const n = arc.length, N = [], tone = o.tone ?? 0.9, Hs = o.Hs ?? 1.6, lean = 0.5;
  for (let i = 0; i < n; i++) { const a = arc[Math.max(0, i - 1)], b = arc[Math.min(n - 1, i + 1)], ds = b[0] - a[0], dp = b[1] - a[1], l = Math.hypot(ds, dp) || 1; N.push([-dp / l, ds / l]); }
  const F = o.bands || [1, 0.93, 0.87, 0.78, 0.72, 0.62, 0.56, 0.45, 0.39, 0.28, 0.22], at = (f, g) => arc.map((q) => [cx + (q[0] - cx) * f, q[1] * f, h + 0.09, g]);
  for (let k = 0; k + 1 < F.length; k++) { const g = (k + (o.phase || 0)) % 2 === 1 ? 0.3 : tone; m.strip(at(F[k], g), at(F[k + 1], g), GOLD, CREAM); }
  m.fan([cx, 0, h + 0.09, tone], at(F[F.length - 1], tone), GOLD, CREAM, false);
  const sx = Math.cos(SUN_TH), sp = Math.sin(SUN_TH);
  m.strip(arc.map((q, i) => [q[0] - N[i][0] * 0.3, q[1] - N[i][1] * 0.3, h + 0.13, 0.08]),
    arc.map((q, i) => { const w = 0.8 + 1.5 * Math.max(0, N[i][0] * sx + N[i][1] * sp); return [q[0] - N[i][0] * w, q[1] - N[i][1] * w, h + 0.13, 0.67]; }), TEAL, CREAM);
  const top = arc.map((q, i) => [q[0] + N[i][0] * lean, q[1] + N[i][1] * lean, h + Hs, 0.97]);
  m.strip(arc.map((q) => [q[0], q[1], h, 0.72]), top, GOLD, TEAL);
  m.strip(top.map((q) => [q[0], q[1], q[2], 0.95]), arc.map((q, i) => [q[0] + N[i][0] * (lean - 0.55), q[1] + N[i][1] * (lean - 0.55), h + Hs + 0.02, 0.95]), GOLD, CREAM);
  let acc = 1.2;
  for (let i = 0; i + 1 < n; i++) {
    const a = arc[i], b = arc[i + 1], ds = b[0] - a[0], dp = b[1] - a[1], l = Math.hypot(ds, dp); if (l < 1e-4) continue;
    const tx = ds / l, tp = dp / l;
    while (acc < l) {
      const c = [a[0] + tx * acc - tp * 0.03, a[1] + tp * acc + tx * 0.03, h + Hs * 0.52];
      if (o.night) lozenge(m, c, [tx, tp], 1.5, Hs * 0.6, GOLD, CREAM, 0.6, 1.0, 1.2); else lozenge(m, c, [tx, tp], 1.5, Hs * 0.6, NAVY, TEAL, 0.02, 0.3);
      acc += 2.4;
    }
    acc -= l;
  }
}
// o: outline [[s,p]..]; walls h0..h1 with a row (or rows) of lozenge windows, an overhanging deck lip and a rail
function tier(m, o, h0, h1, t = {}) {
  const n = o.length, N = outlineNormals(o), hwMax = o.reduce((x, q) => Math.max(x, Math.abs(q[1])), 1);
  const A = t.a ?? GOLD, B = t.b ?? CREAM, lip = t.lip ?? 0.8, night = t.night;
  const gw = (p) => 0.36 - 0.26 * (p / hwMax);
  const lo = o.map((q) => [q[0], q[1], h0, gw(q[1])]), hi = o.map((q) => [q[0], q[1], h1 - 0.35, gw(q[1]) + 0.5]);
  m.loft([lo, hi], A, B);
  const ox = o.map((q, i) => [q[0] + N[i][0] * lip, q[1] + N[i][1] * lip]);
  const s0 = o.reduce((x, q) => Math.min(x, q[0]), 1e9), s1 = o.reduce((x, q) => Math.max(x, q[0]), -1e9);
  const dG = t.deckG || [0.7, 0.98], gd = (s) => lerp(dG[0], dG[1], (s - s0) / Math.max(1, s1 - s0));
  const under = ox.map((q) => [q[0], q[1], h1 - 0.35, 0.3]), edge = ox.map((q) => [q[0], q[1], h1, 0.75]);
  m.loft([o.map((q) => [q[0], q[1], h1 - 0.35, 0.1]), under], TEAL, CREAM);
  m.loft([under, edge], GOLD, CREAM);
  if (t.deck !== false) m.fan([(s0 + s1) / 2, 0, h1, gd((s0 + s1) / 2)], ox.map((q) => [q[0], q[1], h1, gd(q[0])]), GOLD, CREAM);
  const S = t.stern, inArc = (i) => S && o[i][0] >= S.s1 - 0.01;
  if (t.rail !== false) for (let i = 0; i < n; i++) {
    const k = (i + 1) % n; if ((inArc(i) && inArc(k)) || (t.railMinS != null && Math.min(o[i][0], o[k][0]) < t.railMinS - 0.01)) continue;
    m.quad([ox[i][0], ox[i][1], h1, 0.45], [ox[k][0], ox[k][1], h1, 0.45], [ox[k][0], ox[k][1], h1 + 1.05, 1.0], [ox[i][0], ox[i][1], h1 + 1.05, 1.0], GOLD, CREAM);
  }
  if (S) sternArt(m, ox.filter((q, i) => inArc(i)), S.cx, h1, { ...S, night });
  // drawn shadow at the foot of the wall: a thin contact line toward the sun, a wide teal wedge away from it
  if (t.skirt !== false) {
    const sx = -Math.cos(SUN_TH), sp = -Math.sin(SUN_TH), mx = t.skirtMax ?? 2.7;
    const sk = o.map((q, i) => { const w = 0.9 + mx * Math.max(0, N[i][0] * sx + N[i][1] * sp); return [q[0] + N[i][0] * w, q[1] + N[i][1] * w, h0 + 0.07, 0.5]; });
    m.loft([o.map((q) => [q[0], q[1], h0 + 0.07, 0.02]), sk], TEAL, CREAM);
  }
  // inlaid band following the deck edge
  if (t.deck !== false && t.inlay !== false) {
    const ia = dG[0] > 0.55 ? 0.12 : 0.95;
    m.loft([o.map((q, i) => [q[0] - N[i][0] * 1.2, q[1] - N[i][1] * 1.2, h1 + 0.05, ia]), o.map((q, i) => [q[0] - N[i][0] * 1.75, q[1] - N[i][1] * 1.75, h1 + 0.05, ia])], GOLD, CREAM);
  }
  // windows
  const W = t.win; if (!W) return;
  let acc = W.sp * 0.5;
  for (let i = 0; i < n; i++) {
    const a = o[i], b = o[(i + 1) % n], ds = b[0] - a[0], dp = b[1] - a[1], l = Math.hypot(ds, dp); if (l < 1e-4) continue;
    const tx = ds / l, tp = dp / l;
    while (acc < l) {
      const cs = a[0] + tx * acc - tp * 0.09, cp = a[1] + tp * acc + tx * 0.09;
      for (const y of W.rows) {
        if (night) lozenge(m, [cs, cp, h0 + y], [tx, tp], W.w, W.hh, GOLD, CREAM, 0.6, 1.0, 1.2);
        else lozenge(m, [cs, cp, h0 + y], [tx, tp], W.w, W.hh, NAVY, TEAL, 0.02, 0.46);
      }
      acc += W.sp;
    }
    acc -= l;
  }
}

// ---------------------------------------------------------------- funnels
function buildFunnel(m, L, s0, hBase, Hf, whistle) {
  const N = 36, a = 6.5, b = 4.5;
  const lit = (th) => 0.5 + 0.5 * Math.cos(th - SUN_TH);
  const pt = (f, th, k) => [s0 + f * Hf * TAN10 + a * k * Math.cos(th), b * k * Math.sin(th), hBase + f * Hf];
  const ring = (f, k, gf) => { const r = []; for (let j = 0; j < N; j++) { const th = (j / N) * TAU, q = pt(f, th, k); q.push(gf(th)); r.push(q); } return r; };
  const tap = (f) => 1.0 - 0.04 * f;
  const gBody = (th) => 0.05 + 0.37 * lit(th), gCap = (th) => 0.03 + 0.34 * lit(th), gLt = (th) => 0.45 + 0.5 * lit(th);
  // stepped base
  m.loft([ring(-0.01, 1.16, gLt), ring(0.03, 1.16, gLt), ring(0.03, 1.08, gLt), ring(0.06, 1.08, gLt), ring(0.06, 1.0, gLt)], GOLD, CREAM);
  m.loft([ring(0.06, tap(0.06), gBody), ring(0.3, tap(0.3), gBody), ring(0.52, tap(0.52), gBody), ring(0.74, tap(0.74), gBody)], L.funA, L.funB);
  for (const f of [0.3, 0.52]) m.loft([ring(f, tap(f) * 1.022, (t) => gBody(t) + 0.2), ring(f + 0.016, tap(f) * 1.022, (t) => gBody(t) + 0.2)], L.funA, L.funB);
  m.loft([ring(0.74, tap(0.74) * 1.02, gLt), ring(0.775, tap(0.775) * 1.02, gLt)], GOLD, CREAM);
  m.loft([ring(0.775, tap(0.775), gCap), ring(0.96, tap(0.96), gCap), ring(1.0, tap(1) * 1.06, (t) => gCap(t) + 0.12), ring(1.0, tap(1) * 0.86, (t) => gCap(t) + 0.2)], L.capA, L.capB);
  const inner = ring(0.93, tap(1) * 0.86, () => 0.02);
  m.loft([ring(1.0, tap(1) * 0.86, () => 0.02), inner], NAVY, TEAL);
  m.fan([s0 + 0.93 * Hf * TAN10, 0, hBase + 0.93 * Hf, 0.02], inner, NAVY, TEAL);
  // the drawn shadow: one wedge down the lee
  const lee = SUN_TH + PI, rows = 9, cols = 6;
  for (let i = 0; i < rows; i++) {
    const f0 = lerp(0.74, 0.1, i / rows), f1 = lerp(0.74, 0.1, (i + 1) / rows), w0 = lerp(0.5, 0.03, i / rows), w1 = lerp(0.5, 0.03, (i + 1) / rows);
    for (let j = 0; j < cols; j++) {
      const u0 = j / cols * 2 - 1, u1 = (j + 1) / cols * 2 - 1;
      const q = (f, w, u) => { const r = pt(f, lee + 0.1 + w * u, tap(f) * 1.008); r.push(0.05 + 0.12 * (u + 1)); return r; };
      m.quad(q(f0, w0, u0), q(f0, w0, u1), q(f1, w1, u1), q(f1, w1, u0), L.wedgeA, L.wedgeB);
    }
  }
  // steam pipes fore and aft, and the whistle
  for (const th of [PI, 0.0]) {
    const pp = []; for (let i = 0; i <= 8; i++) { const f = lerp(0.06, th ? 1.07 : 0.98, i / 8), q = pt(f, th, tap(f) * 1.07); pp.push(q); }
    tube(m, pp, 0.32, 6, GOLD, CREAM, { g0: 0.4, gr: 0.5, cap: true });
  }
  let wp = null;
  if (whistle) {
    const c = pt(0.66, PI, 1.16); wp = [c[0] - 1.6, 0, c[2] + 0.6];
    m.box(c[0] - 0.9, c[0] + 0.6, -1.5, 1.5, c[2] - 0.25, c[2], GOLD, CREAM, 0.3, 0.6);
    for (const p of [-0.75, 0.75]) tube(m, [[c[0] + 0.2, p, c[2] + 0.6], [c[0] - 0.7, p, c[2] + 0.6], [c[0] - 1.9, p, c[2] + 0.75]], [0.2, 0.26, 0.6], 8, GOLD, CREAM, { g0: 0.35, gr: 0.6, cap: true, capA: VERM, capB: GOLD, capG: 0.1 });
  }
  return { top: [s0 + Hf * TAN10, 0, hBase + Hf], whistle: wp };
}

// ---------------------------------------------------------------- fittings
const deckH = (s) => sheer(nomS(s, 33));
function buildBoat(m, sc, sd, pc, hk) {
  const rings = [], NS = 8;
  for (let i = 0; i <= NS; i++) {
    const u = (i / NS) * 2 - 1, wf = Math.pow(Math.max(0, Math.cos(u * PI / 2)), 0.6), s = sc + 4.6 * u, k = hk + 0.55 * u * u * u * u;
    const P = (dp, dh, g) => [s, sd * pc + dp * wf, k + dh * (0.35 + 0.65 * wf) + (1 - wf) * 0.9, g];
    rings.push([P(0, 0, 0.22), P(0.8, 0.4, 0.45), P(1.3, 1.45, 0.72), P(1.36, 1.6, 0.2), P(0.5, 1.95, 0.9), P(-0.5, 1.95, 1.0), P(-1.36, 1.6, 0.2), P(-1.3, 1.45, 0.86), P(-0.8, 0.4, 0.6)]);
  }
  m.loft(rings, GOLD, CREAM);
  // davits: stepped foot and a curved arm over the boat
  for (const ds of [-3.1, 3.1]) {
    const pts = [], p0 = pc - 2.3, h0 = hk - 1.3;
    for (let i = 0; i <= 7; i++) { const a = (i / 7) * PI * 0.62; pts.push(i === 0 ? [sc + ds, sd * p0, h0] : [sc + ds, sd * (p0 + 2.3 * (1 - Math.cos(a)) * 0.92), h0 + 1.6 + 3.3 * Math.sin(a)]); }
    tube(m, pts, [0.34, 0.3, 0.27, 0.24, 0.22, 0.2, 0.18, 0.16], 5, GOLD, CREAM, { B: [1, 0, 0], g0: 0.3, gr: 0.6, a0: sd > 0 ? PI : 0 });
    m.box(sc + ds - 0.45, sc + ds + 0.45, sd * (p0 - 0.45), sd * (p0 + 0.45), h0, h0 + 0.5, GOLD, CREAM, 0.2, 0.5);
  }
}
function buildCowl(m, s, p, h0, H, r) {
  const pts = [[s, p, h0], [s, p, h0 + H * 0.62], [s - r * 0.35, p, h0 + H * 0.86], [s - r * 1.1, p, h0 + H], [s - r * 1.9, p, h0 + H + r * 0.1]];
  tube(m, pts, [r * 1.15, r, r * 1.05, r * 1.3, r * 1.75], 9, GOLD, CREAM, { g0: 0.3, gr: 0.65, a0: p > 0 ? 1.2 : -1.2, cap: true, capA: VERM, capB: GOLD, capG: 0.1 });
}
// sunburst medallion, laurel scrolls and the anchor in its hawse, drawn on the side elevation and pressed onto the plating
function buildBowOrnament(m, sd) {
  const cs = 6.5, ch = 28.2, pt = (r, a, g, off = 0.3) => onHull(sd, cs + r * Math.cos(a), ch + r * Math.sin(a), g, off);
  const c = onHull(sd, cs, ch, 0.95, 0.42), NR = 24;
  const ringAt = (r, g, off) => { const q = []; for (let j = 0; j < NR; j++) q.push(pt(r, (j / NR) * TAU, g, off)); return q; };
  m.fan(c, ringAt(1.5, 0.12, 0.42), GOLD, CREAM);
  m.loft([ringAt(1.5, 0.95, 0.38), ringAt(2.05, 0.95, 0.38)], GOLD, CREAM);
  m.loft([ringAt(2.05, 0.3, 0.34), ringAt(2.6, 0.1, 0.34)], GOLD, CREAM);
  for (let j = 0; j < 16; j++) {
    const a = (j / 16) * TAU + 0.196, len = j % 2 ? 3.9 : 5.3, w = j % 2 ? 0.1 : 0.14;
    m.tri(pt(2.75, a - w, 0.2), pt(2.75, a + w, 0.2), pt(len, a, 0.95), GOLD, CREAM);
  }
  for (const side of [1, -1]) for (let i = 0; i < 10; i++) {
    const a = -PI / 2 + side * (0.2 + i * 0.2), R = 5.0 + (i % 2 ? 0.36 : -0.36), ta = a + side * PI / 2 + side * (i % 2 ? 0.45 : -0.45);
    const lx = Math.cos(ta), ly = Math.sin(ta), nx = -ly, ny = lx, L = 2.1 - i * 0.07, W = 0.3;
    const q = (u, v, g) => onHull(sd, cs + R * Math.cos(a) + lx * u + nx * v, ch + R * Math.sin(a) + ly * u + ny * v, g, 0.3);
    m.quad(q(-L / 2, 0, 0.15), q(0, W, 0.4), q(L / 2, 0, 0.75), q(0, -W, 0.4), GOLD, CREAM);
  }
  // anchor
  const as = 25, ah = 25.0, A = (ds, dh, g) => onHull(sd, as + ds, ah + dh, g, 0.36);
  const lip = []; const lip2 = [];
  for (let j = 0; j < 14; j++) { const an = (j / 14) * TAU; lip.push(A(1.25 * Math.cos(an), 0.3 + 0.95 * Math.sin(an), 0.9)); lip2.push(A(0.75 * Math.cos(an), 0.3 + 0.55 * Math.sin(an), 0.6)); }
  m.loft([lip, lip2], GOLD, CREAM); m.fan(onHull(sd, as, ah + 0.3, 0.05, 0.3), lip2, NAVY, TEAL);
  m.quad(A(-0.26, 0.2, 0.8), A(0.26, 0.2, 0.8), A(0.3, -4.1, 0.25), A(-0.3, -4.1, 0.25), GOLD, CREAM);
  m.quad(A(-1.7, -4.0, 0.3), A(1.7, -4.0, 0.3), A(1.25, -4.85, 0.1), A(-1.25, -4.85, 0.1), GOLD, CREAM);
  for (const e of [1, -1]) { m.tri(A(e * 1.75, -4.3, 0.2), A(e * 0.95, -4.0, 0.3), A(e * 2.05, -1.9, 0.85), GOLD, CREAM); m.tri(A(e * 1.75, -4.3, 0.2), A(e * 2.05, -1.9, 0.85), A(e * 2.5, -3.6, 0.5), GOLD, CREAM); }
}
function buildMast(m, lines) {
  const sM = 60, hB = deckH(60), TAN4 = Math.tan(4 * D2R), at = (h, p = 0) => [sM + (h - hB) * TAN4, p, h];
  tube(m, [at(hB), at(46), at(56), at(70), at(82)], [1.05, 0.88, 0.72, 0.46, 0.26], 10, GOLD, CREAM, { g0: 0.15, gr: 0.75, a0: -0.7 });
  m.loft([[1.3, 1.6], [1.75, 1.6], [1.75, 0], [1.2, 0]].map(([r, dh]) => { const q = []; for (let j = 0; j < 12; j++) { const an = (j / 12) * TAU; q.push([at(55.2)[0] - 0.9 + r * Math.cos(an), r * Math.sin(an), 55.2 + dh, 0.45 + 0.5 * (0.5 + 0.5 * Math.cos(an - SUN_TH))]); } return q; }), GOLD, CREAM);
  tube(m, [at(81.6), at(82.5), at(83.4)], [0.2, 0.62, 0.12], 8, GOLD, CREAM, { g0: 0.5, gr: 0.5 });
  tube(m, [at(70.6, -8.5), at(70, 0), at(70.6, 8.5)], [0.12, 0.34, 0.12], 6, GOLD, CREAM, { B: [1, 0, 0], g0: 0.3, gr: 0.6 });
  m.box(at(46)[0] - 2.2, at(46)[0] + 0.4, -1.3, 1.3, 46, 46.35, GOLD, CREAM, 0.3, 0.7);
  for (const sd of [1, -1]) {
    tube(m, [[62, sd * 1.4, hB + 3.5], [51, sd * 3.4, hB + 7.5], [40, sd * 5.2, hB + 11.5]], [0.42, 0.34, 0.22], 6, GOLD, CREAM, { g0: 0.2, gr: 0.7 });
    for (const ds of [0, 4, 8]) lines.push([at(57), [sM + 3 + ds, sd * (hbT(sM + 3 + ds, hB) - 0.6), hB + 1.3], 0.14, GOLD, CREAM, 0.3]);
    lines.push([at(70.5, sd * 8.3), at(57, sd * 1.2), 0.1, GOLD, CREAM, 0.3]);
    lines.push([[40, sd * 5.2, hB + 11.5], at(66), 0.1, GOLD, CREAM, 0.3]);
  }
  lines.push([at(80), [-13, 0, 39.4], 0.12, GOLD, CREAM, 0.3]);
  return { head: at(83.4), top: at(81.5) };
}
function buildForedeck(m, lines) {
  for (const [s0, s1, w] of [[23, 29.5, 3], [45, 54, 4.6], [67, 77, 5.2]]) {
    const h = Math.min(deckH(s0), deckH(s1)) - 0.1;
    m.box(s0, s1, -w, w, h, h + 1.25, GOLD, CREAM, 0.25, 0.6);
    m.box(s0 + 0.7, s1 - 0.7, -w + 0.7, w - 0.7, h + 1.25, h + 1.75, TEAL, CREAM, 0.12, 0.3);
  }
  const hb = deckH(40);
  for (const sd of [1, -1]) {
    const w = hbT(43.5, hb) - 0.8;
    m.quad([36.5, 0, hb, 0.4], [43.5, sd * w, hb, 0.3], [43.5, sd * w, hb + 1.9, 0.8], [36.5, 0, hb + 2.3, 0.95], GOLD, CREAM);
    const hc = deckH(13);
    tube(m, [[13, sd * 1.9, hc], [13, sd * 1.9, hc + 0.5], [13, sd * 1.9, hc + 1.3], [13, sd * 1.9, hc + 1.7]], [0.95, 0.55, 0.55, 0.95], 9, GOLD, CREAM, { g0: 0.3, gr: 0.6, cap: true });
    lines.push([[13, sd * 1.9, hc + 0.5], [17, sd * (hbT(17, 33) - 0.9), deckH(17) + 0.25], 0.3, GOLD, CREAM, 0.3]);
  }
}
// flat drawn shadows lying on a deck: stepped teal ellipses thrown forward and to port of the sun
function deckShadow(m, sF, h, len, wid, pMax, sMin, p0 = 0) {
  const dx = -Math.cos(SUN_TH), dp = -Math.sin(SUN_TH), c = [sF + dx * len * 0.55, p0 + dp * len * 0.55], ring = [];
  for (let j = 0; j < 22; j++) {
    const a = (j / 22) * TAU, u = Math.cos(a) * len, v = Math.sin(a) * wid;
    ring.push([Math.max(sMin, c[0] + dx * u - dp * v), clamp(c[1] + dp * u + dx * v, -pMax, pMax), h, 0.66]);
  }
  m.fan([c[0], c[1], h, 0.0], ring, TEAL, CREAM);
}

// ---------------------------------------------------------------- portholes (instanced, light up in a wave)
function buildPortholes(style, rows, night, uLit, dark) {
  const P = [], K = [], N = 10;
  const v = (x, y, z, g, a, b, w) => { P.push(x, y, z); K.push(g, a, b, w); };
  for (let j = 0; j < N; j++) {
    const a0 = (j / N) * TAU, a1 = ((j + 1) / N) * TAU, c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1), r0 = 0.3; let r1 = 0.5;
    const gr = (s) => (dark ? 0.04 + 0.3 * (0.5 + 0.5 * s) : 0.55 + 0.4 * (0.5 + 0.5 * s)), gg = (s) => (dark ? 0.72 : 0.1) + (dark ? 0.24 : 0.3) * (0.5 + 0.5 * s);
    const RA = dark ? NAVY : GOLD, RB = dark ? TEAL : CREAM; if (dark) r1 = 0.58;
    v(c0 * r0, s0 * r0, 0.05, gr(s0), RA, RB, 0); v(c1 * r0, s1 * r0, 0.05, gr(s1), RA, RB, 0); v(c1 * r1, s1 * r1, 0, gr(s1), RA, RB, 0);
    v(c0 * r0, s0 * r0, 0.05, gr(s0), RA, RB, 0); v(c1 * r1, s1 * r1, 0, gr(s1), RA, RB, 0); v(c0 * r1, s0 * r1, 0, gr(s0), RA, RB, 0);
    v(0, 0, 0.03, 0.25, NAVY, TEAL, 1); v(c0 * r0, s0 * r0, 0.03, gg(s0), NAVY, TEAL, 1); v(c1 * r0, s1 * r0, 0.03, gg(s1), NAVY, TEAL, 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(K), 4));
  const list = [];
  for (const sd of [1, -1]) for (const [h, s0, s1, sp] of rows) for (let s = s0; s <= s1; s += sp) {
    if (h > sheer(nomS(s, h)) - 2.6 || hbT(s, h) < 1.2) continue;
    list.push([sd, s, h]);
  }
  const mat = style.material({
    head: 'attribute vec2 aPh; uniform float uLitS; uniform float uNight;\n',
    motion: /* glsl */`
      float lit = max(uNight, smoothstep(0.0, 5.0, uLitS - aPh.x))*step(aPh.y, 0.9);
      if (glow > 0.5) { glow = 0.0; if (lit > 0.02) { ia = 3.0; ib = 2.0; g = 0.92; glow = 1.3*lit*(0.8 + 0.2*sin(uTime*2.1 + aPh.y*40.0)); } }
      else glow = 0.0;`,
    uniforms: { uLitS: uLit, uNight: { value: night ? 1 : 0 } },
  });
  const mesh = new THREE.InstancedMesh(geo, mat, list.length), ph = new Float32Array(list.length * 2);
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3(), M = new THREE.Matrix4(), e = 0.4;
  list.forEach(([sd, s, h], i) => {
    const dps = (hbT(s + e, h) - hbT(s - e, h)) / (2 * e), dph = (hbT(s, h + e) - hbT(s, h - e)) / (2 * e);
    Y.set(sd * dph, 1, 0).normalize(); X.set(sd * dps, 0, -1).normalize();
    Z.crossVectors(X, Y).normalize(); if (Z.x * sd < 0) Z.negate();
    X.crossVectors(Y, Z).normalize();
    M.makeBasis(X, Y, Z).setPosition(sd * (hbT(s, h) + 0.22), h, HALF - s);
    mesh.setMatrixAt(i, M); ph[i * 2] = s; ph[i * 2 + 1] = (Math.sin(s * 12.9898 + h * 78.233 + sd) * 43758.5453) % 1; ph[i * 2 + 1] = Math.abs(ph[i * 2 + 1]);
  });
  geo.setAttribute('aPh', new THREE.InstancedBufferAttribute(ph, 2));
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- thin lines as camera-facing ribbons (stays, halyards, dressing lines)
const LINE_MOTION = /* glsl */`
  { vec3 toCam = uCam - pos; float dist = length(toCam);
    vec3 nn = cross(aDir, toCam); nn /= max(length(nn), 1e-4);
    pos += nn*aSide.x*max(aSide.y*0.5, 0.8*uPx*dist); glow = 0.0; }`;
function buildLines(style, lines, uCam) {
  const P = [], K = [], D = [], S = [];
  for (const [A, B, w, ia, ib, g] of lines) {
    const a = [A[1], A[2], HALF - A[0]], b = [B[1], B[2], HALF - B[0]], d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const l = Math.hypot(d[0], d[1], d[2]) || 1; d[0] /= l; d[1] /= l; d[2] /= l;
    for (const [q, sd] of [[a, -1], [b, -1], [b, 1], [a, -1], [b, 1], [a, 1]]) { P.push(q[0], q[1], q[2]); K.push(g, ia, ib, 0); D.push(d[0], d[1], d[2]); S.push(sd, w); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(K), 4));
  geo.setAttribute('aDir', new THREE.BufferAttribute(new Float32Array(D), 3));
  geo.setAttribute('aSide', new THREE.BufferAttribute(new Float32Array(S), 2));
  const mesh = new THREE.Mesh(geo, style.material({ head: 'attribute vec3 aDir; attribute vec2 aSide; uniform vec3 uCam; uniform float uPx;\n', motion: LINE_MOTION, uniforms: { uCam }, slide: 0 }));
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- signal flags (instanced; pattern from a 3 x 3 cell grid)
function buildFlags(style, flags) {
  const P = [], C = [], COLS = 6, ROWS = 3;
  for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) {
    const u0 = i / COLS, u1 = (i + 1) / COLS, v0 = j / ROWS, v1 = (j + 1) / ROWS, cu = Math.floor(i / 2), cv = j;
    for (const [u, v] of [[u0, v0], [u1, v0], [u1, v1], [u0, v0], [u1, v1], [u0, v1]]) { P.push(u, v, 0); C.push(cu, cv); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(P.length / 3 * 4), 4));
  geo.setAttribute('aCell', new THREE.BufferAttribute(new Float32Array(C), 2));
  const mat = style.material({
    head: 'attribute vec2 aCell; attribute vec4 aFlag;\n', slide: 0,
    motion: /* glsl */`
      float cu = aCell.x, cv = aCell.y, pt = aFlag.x, on = 0.0;
      if (pt < 0.5) on = 1.0 - abs(sign(cu - 1.0));
      else if (pt < 1.5) on = 1.0 - abs(sign(cv - 1.0));
      else if (pt < 2.5) on = mod(cu + cv, 2.0);
      else if (pt < 3.5) on = (1.0 - abs(sign(cu - 1.0)))*(1.0 - abs(sign(cv - 1.0)));
      else if (pt < 4.5) on = max(1.0 - abs(sign(cu - 1.0)), 1.0 - abs(sign(cv - 1.0)));
      else if (pt < 5.5) on = step(0.5, cu);
      else on = step(1.5, cu + cv);
      g = mix(0.1, 0.9, on); ia = aFlag.y; ib = aFlag.z; glow = 0.0;
      float u = position.x, v = position.y, ph = aFlag.w;
      pos = vec3(sin(u*5.0 - uTime*7.0 + ph)*0.2*u + sin(u*11.0 - uTime*11.0 + ph*2.3)*0.07*u,
                 -v + sin(u*4.0 - uTime*5.0 + ph*1.7)*0.12*u - 0.1*u*u, -u);`,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, flags.length), F = new Float32Array(flags.length * 4), M = new THREE.Matrix4();
  flags.forEach((f, i) => {
    M.makeScale(f.len, f.hgt, f.len).setPosition(f.at[1], f.at[2], HALF - f.at[0]); mesh.setMatrixAt(i, M);
    F[i * 4] = f.pat; F[i * 4 + 1] = f.a; F[i * 4 + 2] = f.b; F[i * 4 + 3] = f.ph;
  });
  geo.setAttribute('aFlag', new THREE.InstancedBufferAttribute(F, 4));
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- paper streamers (instanced ribbons)
function buildStreamers(style, list, uCam) {
  const P = [], N = 14;
  for (let i = 0; i < N; i++) { const u0 = i / N, u1 = (i + 1) / N; P.push(u0, -1, 0, u1, -1, 0, u1, 1, 0, u0, -1, 0, u1, 1, 0, u0, 1, 0); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(P.length / 3 * 4), 4));
  const mat = style.material({
    head: /* glsl */`attribute vec3 aOrg; attribute vec4 aStr; attribute vec2 aCol; uniform vec3 uCam; uniform float uPx;
      vec3 strC(float u){ float L = aStr.x, ph = aStr.y;
        return aOrg + vec3(aStr.w*(0.22*L*u + (0.9*sin(u*6.0 - uTime*5.0 + ph) + 0.4*sin(u*13.0 - uTime*8.0 + ph*2.0))*u),
          -L*0.42*u*(1.0 - 0.45*u) + (0.7*sin(u*8.0 - uTime*6.3 + ph*1.7) + 0.5*sin(uTime*1.3 + ph))*u, -L*0.88*u); }\n`,
    slide: 0,
    motion: /* glsl */`
      float u = position.x; vec3 c0 = strC(u), tg = strC(u + 0.03) - c0;
      vec3 toCam = uCam - c0; float dist = length(toCam);
      vec3 nn = cross(tg, toCam); nn /= max(length(nn), 1e-4);
      pos = c0 + nn*position.y*max(aStr.z*0.5, 0.8*uPx*dist);
      g = 0.08 + 0.86*u; ia = aCol.x; ib = aCol.y; glow = 0.0;`,
    uniforms: { uCam },
  });
  const n = list.length, O = new Float32Array(n * 3), S = new Float32Array(n * 4), C = new Float32Array(n * 2);
  list.forEach((q, i) => { O.set([q.at[1], q.at[2], HALF - q.at[0]], i * 3); S.set([q.len, q.ph, q.w, q.sd], i * 4); C.set([q.a, q.b], i * 2); });
  const ig = new THREE.InstancedBufferGeometry(); ig.setAttribute('position', geo.getAttribute('position')); ig.setAttribute('aInk', geo.getAttribute('aInk'));
  ig.setAttribute('aOrg', new THREE.InstancedBufferAttribute(O, 3)); ig.setAttribute('aStr', new THREE.InstancedBufferAttribute(S, 4)); ig.setAttribute('aCol', new THREE.InstancedBufferAttribute(C, 2));
  ig.instanceCount = n;
  const mesh = new THREE.Mesh(ig, mat); mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- funnel smoke: scalloped ribbons unrolling aft with a curled end
function buildSmoke(style, tops, rng, uLoomInv) {
  const P = [], K = [], R = [], U = [], NS = 52, NA = 10;
  tops.forEach((top, fi) => {
    const ph = rng.range(0, 6), len = 64 - fi * 5, rise = 11 - fi * 1.5;
    const ctr = (u) => {
      const ub = Math.min(u, 0.78), s = top[0] + 0.5 + len * ub, h = top[2] - 1.0 + 2.2 * Math.min(1, ub * 12) + rise * Math.pow(ub / 0.78, 0.6), p = 2.4 * Math.sin(ub * 5 + ph) * ub;
      if (u <= 0.78) return [s, p, h];
      const k = (u - 0.78) / 0.22, f = k * 1.75 * PI, rc = 6.5 * (1 - 0.5 * k);
      return [s + rc * Math.sin(f), p, h + rc * (1 - Math.cos(f))];
    };
    const rings = [];
    for (let i = 0; i <= NS; i++) {
      const u = i / NS, c = ctr(u), a = ctr(Math.max(0, u - 0.005)), b = ctr(Math.min(1, u + 0.005));
      let ts = b[0] - a[0], th = b[2] - a[2]; const tl = Math.hypot(ts, th) || 1; ts /= tl; th /= tl;
      const rv = (1.5 + 2.4 * Math.sqrt(Math.min(u, 0.78))) * (u > 0.78 ? 1 - 0.62 * (u - 0.78) / 0.22 : 1), ring = [];
      for (let j = 0; j < NA; j++) {
        const an = (j / NA) * TAU, cn = Math.cos(an) * rv, sn = Math.sin(an) * rv * 1.7;
        // normal in the s-h plane is (-th, ts); the binormal is the p axis. stored in LOCAL axes (p, h, -s)
        ring.push({ c, r: [sn, ts * cn, th * cn], g: 0.3 + 0.62 * (0.5 + 0.5 * Math.cos(an)), u });
      }
      rings.push(ring);
    }
    const put = (q) => { P.push(q.c[1], q.c[2], HALF - q.c[0]); R.push(q.r[0], q.r[1], q.r[2]); K.push(q.g, GOLD, CREAM, 0); U.push(q.u, ph, top[2]); };
    for (let i = 0; i < NS; i++) for (let j = 0; j < NA; j++) {
      const k = (j + 1) % NA, a = rings[i][j], b = rings[i][k], c = rings[i + 1][k], d = rings[i + 1][j];
      put(a); put(b); put(c); put(a); put(c); put(d);
    }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(K), 4));
  geo.setAttribute('aRad', new THREE.BufferAttribute(new Float32Array(R), 3));
  geo.setAttribute('aU', new THREE.BufferAttribute(new Float32Array(U), 3));
  const mesh = new THREE.Mesh(geo, style.material({
    head: 'attribute vec3 aRad; attribute vec3 aU; uniform float uLoomInv;\n', slide: 0.03, uniforms: { uLoomInv },
    motion: /* glsl */`
      float u = aU.x, fl = u*7.0 - uTime*1.3 + aU.y;
      float puff = 0.58 + 0.42*abs(sin(3.14159*fl));
      float grow = (0.3 + 0.7*smoothstep(0.0, 0.07, u))*(1.0 - smoothstep(0.93, 1.0, u));
      pos = position + aRad*puff*grow;
      pos.y = aU.z + (pos.y - aU.z)*uLoomInv;            // the loom stretches the funnels, not the smoke above them
      g += 0.2*step(0.5, fract(fl*0.5)); glow = 0.0;`,
  }));
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- the twin volute bow waves (shader-swept spiral scrolls)
function buildVolutes(style, scale, rng) {
  const P = [], K = [], Bs = [], NS = 64, NT = 44, LEN = 52, FACE = 0.4;
  const Rof = (sN) => 3.3 * scale * sm(-0.1, 0.35, sN) * (1 - 0.7 * sm(0.5, 1, sN));
  const hbI = [], rofI = []; for (let i = 0; i <= NS; i++) { hbI.push(hbT(0.4 + LEN * (i / NS), 0.3)); rofI.push(Rof(i / NS)); }
  for (const sd of [1, -1]) {
    // the swept sheet: a fin off the stem that rolls into a full scroll abaft the spiral face
    const vert = (i, j) => { const sN = i / NS, s = 0.4 + LEN * sN; P.push(sN, j / NT, 0); K.push(0, CREAM, TEAL, 0); Bs.push(s, hbI[i], rofI[i], sd); };
    for (let i = 0; i < NS; i++) for (let j = 0; j < NT; j++) { vert(i, j); vert(i + 1, j); vert(i + 1, j + 1); vert(i, j); vert(i + 1, j + 1); vert(i, j + 1); }
    // the spiral face: a two-tone band in the cross-section plane, facing forward, winding in to the eye
    const sF = 0.4 + LEN * FACE, NF = 110, hbF = hbT(sF, 0.3), rofF = Rof(FACE), fv = (i, z, tone) => { P.push(FACE, i / NF, z); K.push(tone, CREAM, TEAL, 1); Bs.push(sF, hbF, rofF, sd); };
    for (let i = 0; i < NF; i++) for (const [z0, z1, tone] of [[-1, 0, 0.26], [0, 1, 0]]) { fv(i, z0, tone); fv(i + 1, z0, tone); fv(i + 1, z1, tone); fv(i, z0, tone); fv(i + 1, z1, tone); fv(i, z1, tone); }
    // stepped spray fans with scalloped rims, bursting along the fin
    const nFan = 13;
    for (let f = 0; f < nFan; f++) {
      const s = 1.5 + (f / nFan) * 24 + rng.range(-0.6, 0.6), R = Rof((s - 0.4) / LEN), rad = rng.range(2.0, 3.4) * scale * (0.6 + 0.4 * sm(0, 10, s));
      const base = [sd * (hbT(s, 0.3) + 0.4 + R * rng.range(0.1, 0.6)), 0.3 + R * rng.range(0.6, 1.5), HALF - s], ph = rng();
      const yaw = rng.range(0.5, 1.1), ox = sd * Math.cos(yaw), oz = -Math.sin(yaw), tilt = rng.range(-0.25, 0.35), LOB = 6, SEG = 6, rim = [];
      for (let k = 0; k <= LOB * SEG; k++) {
        const a = (k / (LOB * SEG)) * PI * 0.9 + 0.05 * PI + tilt, rr = rad * (0.74 + 0.26 * Math.sqrt(Math.abs(Math.sin((k / SEG) * PI))));
        rim.push([ox * Math.cos(a) * rr, Math.sin(a) * rr, oz * Math.cos(a) * rr]);
      }
      // every vertex of a card carries the same g: one flat tone a card, never a gradient across its triangles
      const gCard = f % 3 === 1 ? 0.3 : 0.05;
      for (let k = 0; k < LOB * SEG; k++) for (const q of [[0, 0, 0], rim[k], rim[k + 1]]) { P.push(q[0], q[1], q[2]); K.push(gCard, CREAM, TEAL, 2); Bs.push(base[0], base[1], base[2], ph); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3));
  geo.setAttribute('aInk', new THREE.BufferAttribute(new Float32Array(K), 4));
  geo.setAttribute('aBase', new THREE.BufferAttribute(new Float32Array(Bs), 4));
  const mesh = new THREE.Mesh(geo, style.material({
    head: 'attribute vec4 aBase;\n', slide: 0.02,
    motion: /* glsl */`
      if (glow > 1.5) {
        float p = fract(uTime/2.4 + aBase.w);
        float e = smoothstep(0.0, 0.18, p)*(1.0 - smoothstep(0.6, 1.0, p));
        pos = aBase.xyz + position*vec3(e, e*(0.55 + 0.8*p), e) + vec3(0.0, 1.6*p - 0.4, -2.0*p);
        g = aInk.x + 0.25*step(0.5, p);
      } else {
        float face = step(0.5, glow);
        float sN = position.x, tt = position.y, R = aBase.z;
        float cyc = uTime/3.0 - sN*1.2;
        float open = 0.84 + 0.16*sin(6.2832*cyc);
        float turns = (0.32 + 1.7*smoothstep(${(FACE - 0.03).toFixed(2)}, ${(FACE + 0.02).toFixed(2)}, sN + 0.06*face))*open;
        vec2 cc = vec2(aBase.y + 0.2 + R*0.95 + 7.0*sN*sqrt(sN), R*0.78);
        float q = mix(clamp((tt - 0.14)/0.86, 0.0, 1.0), tt, face);
        float th = q*turns*6.2832;
        float rho = max(R*(1.0 - 0.47*q*turns), 0.05*R) + face*position.z*0.16*R*(1.0 - 0.45*q);
        float phi = 3.55 - th;
        vec2 sp = cc + rho*vec2(cos(phi), sin(phi));
        vec2 foot = vec2(aBase.y - 0.15, -0.5);
        if (face < 0.5 && tt < 0.14) { float k = tt/0.14; sp = mix(foot, sp, k) + vec2(0.35*R*sin(3.14159*k), 0.0); }
        pos = vec3(aBase.w*sp.x, sp.y, ${HALF}.0 - (aBase.x + (1.0 - face)*1.6*q*R - face*0.25));
        float band = step(0.5, fract(sN*15.0 + q*turns*3.0 - uTime*1.2));
        if (face > 0.5) g = aInk.x + 0.04 + 0.62*q*q + 0.2*step(0.5, fract(q*turns*4.0 - uTime*0.9));
        else g = (tt < 0.14) ? mix(0.75, 0.12, tt/0.14) : 0.06 + 0.42*band + 0.42*q*q;
      }
      ia = 2.0; ib = 1.0; glow = 0.0;`,
  }));
  mesh.frustumCulled = false;
  return { mesh, triangles: P.length / 9 };
}

// ---------------------------------------------------------------- where she meets the sea: foam scallops, contact band, zigzag reflections, scuppers
function buildWaterline(style, rng, detail) {
  const m = new InkBuilder();
  for (const sd of [1, -1]) {
    // contact band, one step darker than the sea, and the scallop foam line standing against the plating
    const inner = [], outer = [];
    for (let s = 0; s <= 309; s += 3) { const w = hbT(s, 0.2); inner.push([s, sd * (w - 0.2), 0.12, 0.3]); outer.push([s, sd * (w + 3.2), 0.12, 0.3]); }
    m.strip(inner, outer, TEAL, NAVY);
    for (let s = 1.2; s < 307; s += 2.1) {
      const w0 = hbT(s - 1.05, 0.2), w1 = hbT(s + 1.05, 0.2), off = 0.5, ring = [];
      for (let j = 0; j <= 7; j++) { const a = (j / 7) * PI, k = 0.5 - 0.5 * Math.cos(a); ring.push([s - 1.05 + 2.1 * k, sd * (lerp(w0, w1, k) + off), -0.05 + 1.05 * Math.sin(a), 1.0]); }
      m.fan([s, sd * ((w0 + w1) / 2 + off), -0.05, 0.42], ring, TEAL, CREAM, false, 1);
    }
    // three broken zigzag bars of reflection
    [4.6, 9.4, 15].forEach((d, bi) => {
      let s = rng.range(6, 20);
      while (s < 296) {
        const len = rng.range(16, 38), rnd = rng(), A = [], B = [];
        for (let x = 0, i = 0; x <= len && s + x < 300; x += 3, i++) {
          const p = hbT(s + x, 0.2) + d + (i % 2 ? 1.15 : -1.15), wd = 0.55 + 0.2 * bi;
          A.push([s + x, sd * (p - wd), 0.16, 0.1 + 0.24 * bi]); B.push([s + x, sd * (p + wd), 0.16, 0.1 + 0.24 * bi]);
        }
        m.strip(A, B, NAVY, TEAL, 2 + rnd * 0.9);
        s += len + rng.range(6, 14);
      }
    });
    // scuppers pouring thin ribbons
    const nSc = Math.max(4, Math.round(9 * detail));
    for (let i = 0; i < nSc; i++) {
      const s = 66 + (i + rng.range(0.2, 0.8)) * (190 / nSc), h0 = 5.2, A = [], B = [], rnd = rng();
      for (let j = 0; j <= 7; j++) { const t = j / 7, p = hbT(s, h0 * (1 - t * t)) + 0.25 + 2.4 * t, h = h0 * (1 - t * t) - 0.1; A.push([s - 0.3, sd * p, h, t]); B.push([s + 0.3, sd * p, h, t]); }
      m.strip(A, B, CREAM, TEAL, 3 + rnd * 0.9);
      lozenge(m, [s, sd * (hbT(s, h0 + 0.3) + 0.2), h0 + 0.3], [1, 0], 1.3, 0.7, GOLD, CREAM, 0.4, 0.9);
    }
  }
  const mesh = new THREE.Mesh(inkGeometry(m), style.material({
    slide: 0.03,
    motion: /* glsl */`
      float md = floor(glow + 0.01), rn = fract(glow);
      if (md > 2.5) g = 0.05 + 0.85*fract(g*2.5 - uTime*1.6 + rn*3.0);
      else if (md > 1.5) pos.x += sign(pos.x)*0.9*step(0.5, fract(uTime*0.8 + rn*7.0));
      else if (md > 0.5) pos.y = (pos.y + 0.05)*(0.72 + 0.48*sin(pos.z*0.8 + uTime*3.2)) - 0.05;
      glow = 0.0;`,
  }));
  mesh.frustumCulled = false;
  return { mesh, triangles: m.triangles };
}

// ---------------------------------------------------------------- the liner
const LIVERY = {
  black: { hullA: NAVY, hullB: TEAL, hullG0: 0.02, bootA: VERM, bootB: GOLD, ribA: GOLD, ribB: CREAM, ribG: 0.3, ribH: 0.55, rubA: TEAL, rubB: CREAM,
    funA: VERM, funB: GOLD, capA: NAVY, capB: TEAL, wedgeA: NAVY, wedgeB: TEAL },
  // cream: the port side (the one the camera passes) in cream and gold, alternate strakes a full step apart and the
  // lower hull a step down; the starboard side the same steps of cream toward teal, so the stem is a two-tone edge;
  // the Blue Riband itself is the two strakes at h 18.8-23.6, stem to stern; portholes are rimmed navy.
  // strake(k, side, h) -> [inkA, inkB, g at the stem, fall of g to the stern]
  cream: { hullA: TEAL, hullB: CREAM, hullG0: 0.4, bootA: VERM, bootB: GOLD, ribA: TEAL, ribB: CREAM, ribG: 0.1, ribH: 1.7, rubA: GOLD, rubB: CREAM,
    funA: GOLD, funB: CREAM, capA: VERM, capB: GOLD, wedgeA: TEAL, wedgeB: CREAM, bulA: TEAL, bulB: CREAM, bulG: 0.1, darkPorts: true,
    strake(k, sd, h) {
      if (h > 18.8 && h < 23.6) return [NAVY, TEAL, h < 21.2 ? 0.7 : 0.9, 0];
      const low = h < 11.6 ? 0.2 : 0, odd = k % 2 ? 0.22 : 0;
      return sd > 0 ? [GOLD, CREAM, 0.97 - low - odd, 0.1] : [TEAL, CREAM, 0.57 - low - odd, 0.1];
    } },
};
const JOURNEY = [[-150, 22, 2], [-75, 14, 2.2], [-37, 9.9, 2.35], [0, 6, 2.5], [45, 17, 14], [90, 27, 34], [130, 16, 56], [140, 12.5, 60], [152, 10, 60], [164, 0, 60],
  [176, -10, 60], [182, -12.5, 60], [224, -12.5, 60], [250, -8, 56], [310, -4, 33], [378, 0, 8], [438, 0, 8]];
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = ctx.quality?.detail ?? 1;
  const style = createInkStyle(opts.palette || BRIEF_PALETTE);
  const liveryName = opts.livery ?? (rng.chance(0.3) ? 'cream' : 'black');
  const night = !!opts.night, L = { ...(LIVERY[liveryName] || LIVERY.black), night }, nF = opts.funnels ?? (rng.chance(0.82) ? 3 : 2);
  const object = new THREE.Group(); object.name = 'blue-riband-liner';
  const ship = new THREE.Group(), sea = new THREE.Group(), stack = new THREE.Group(); object.add(ship, sea); ship.add(stack);
  stack.matrixAutoUpdate = false; const uLoomInv = { value: 1 };
  const m = new InkBuilder(), mS = new InkBuilder(), lines = [];

  await buildHull(m, L, () => ctx.yield());
  await ctx.yield();

  // upperworks: three stepped tiers with curved ends, lozenge windows, overhanging decks and rails
  const hw1 = (s) => Math.min(hbT(s, 31) - 2.3, 15.5), hw2 = (s) => hw1(s) - 2.4, hw3 = (s) => Math.min(hw1(s) - 4.9, 10.6);
  tier(m, tierOutline(85, 250, hw1, 9, 16.2, 2.5, 10, 1.6, 16), 31, 36, { win: { sp: 3.1, w: 1.9, hh: 1.3, rows: [2.5] }, night, skirtMax: 1.7, deckG: [0.72, 0.98], stern: { s1: 250, cx: 250, tone: 0.7, phase: 1 } });
  await ctx.yield();
  tier(m, tierOutline(93, 243, hw2, 8, 12, 2.5, 10, 1.6, 16), 36, 41, { win: { sp: 3.1, w: 1.9, hh: 1.3, rows: [2.5] }, night, deckG: [0.24, 0.44], stern: { s1: 243, cx: 243, tone: 0.9, phase: 0 } });
  await ctx.yield();
  tier(m, tierOutline(101, 236, hw3, 7, 5), 41, 46, { win: { sp: 2.6, w: 1.5, hh: 1.5, rows: [2.5] }, night, deckG: [0.72, 0.98] });
  tier(m, tierOutline(101, 113, () => 8.6, 5.5, 1.5, 2, 10), 46, 50, { win: { sp: 1.85, w: 1.35, hh: 1.5, rows: [2.2] }, lip: 0.55, night, deckG: [0.26, 0.42] });
  tier(m, tierOutline(103, 109, () => 4.2, 2.6, 1, 2, 8), 50, 52.4, { win: { sp: 1.6, w: 1.1, hh: 0.95, rows: [1.25] }, lip: 0.35, rail: false, night, inlay: false, skirtMax: 1.6 });
  for (const sd of [1, -1]) {
    m.box(104.5, 108, sd * 10.6, sd * 16.6, 45.55, 46, GOLD, CREAM, 0.3, 0.75);
    m.box(104.3, 108.2, sd * 15.3, sd * 16.9, 46, 48.3, GOLD, CREAM, 0.4, 0.9);
    lozenge(m, [106.25, sd * 16.98, 47.4], [1, 0], 1.6, 0.9, NAVY, TEAL);
  }
  // THE STERN CASCADE: five terraces (h 41, 36, 31, 25.5, 20) below the funnel deck, each ending aft in a pointed
  // ogive whose lip carries a glazed windscreen (see sternArt). The lips stand at s 255, 266, 279, 294 and 310 so
  // that from the glide at funnel height (camera about s 236, h 59) every terrace shows a slice of striped deck and
  // its dark screen above the one before: a ziggurat in perspective, pointing down the wake.
  for (const [sn, hLo, hHi, tip, tone, phase] of [[STEP_A, 25.5, 31, 279, 0.9, 0], [STEP_B, 20, 25.5, 294, 0.7, 1]]) {
    const sA = hullS(sn, hHi), w = hbT(sA, hHi) - 1.3;
    // the hull deck forward of the apron: a cream carpet with fore-and-aft gold planking, under the drawn shadows
    const sF = hLo > 22 ? 246 : hullS(STEP_A, 25.5) + 0.5, cA = [], cB = [];
    for (let k = 0; k <= 6; k++) { const s = lerp(sF, sA, k / 6), cw = hbT(s, hHi) - 0.75; cA.push([s, cw, hHi + 0.03, tone]); cB.push([s, -cw, hHi + 0.03, tone]); }
    m.strip(cA, cB, GOLD, CREAM);
    for (let p = -14; p <= 14.01; p += 2.8) if (Math.abs(p) + 0.4 < hbT(sA, hHi) - 1.2) m.quad([sF, p - 0.4, hHi + 0.05, 0.3], [sA, p - 0.4, hHi + 0.05, 0.3], [sA, p + 0.4, hHi + 0.05, 0.3], [sF, p + 0.4, hHi + 0.05, 0.3], GOLD, CREAM);
    tier(m, tierOutline(sA - 0.6, sA, () => w, 0, tip - sA, 2.5, 12, 1.6, 16), hLo, hHi + 0.02, { a: GOLD, b: TEAL, win: { sp: 2.6, w: 1.5, hh: 1.25, rows: [2.9] }, lip: 0.5, night, inlay: false,
      deckG: [0.72, 0.95], railMinS: sA, stern: { s1: sA, cx: sA, tone, phase } });
  }
  {
    // the taffrail terrace: the same art inside the hull's own rail, round the stern
    const sB = hullS(STEP_B, 20) + 0.4, arc = [], sns = [0.4, 3, 6, 9, 12, 15, 17.5, 19.6, 21.2, 22.5, 23.5, 24.2];
    for (const d of sns) arc.push([hullS(STEP_B + d, 20), Math.max(0.3, hbN(STEP_B + d, 20) - 0.6)]);
    arc.push([309.6, 0]); for (let i = sns.length - 1; i >= 0; i--) arc.push([arc[i][0], -arc[i][1]]);
    sternArt(m, arc, sB, 20, { tone: 0.9, phase: 0, Hs: 1.5, night });
    // flat ring medallions on the two lowest decks, seen as the camera passes over them
    for (const [cs, ch] of [[279.5, 25.5], [299, 20]]) for (const [r, g, a, b] of [[3.6, 0.95, GOLD, CREAM], [2.9, 0.1, TEAL, CREAM], [2.1, 0.95, GOLD, CREAM], [1.4, 0.1, VERM, GOLD], [0.7, 0.95, GOLD, CREAM]]) {
      const hh = ch + 0.17 + (3.6 - r) * 0.012, ring = []; for (let j = 0; j < 20; j++) { const an = (j / 20) * TAU; ring.push([cs + r * Math.cos(an), r * Math.sin(an), hh, g]); }
      m.fan([cs, 0, hh, g], ring, a, b);
    }
    // boats under davits and cowls on the upper terraces, so the cascade's outline is broken
    for (const sd of [1, -1]) {
      buildBoat(m, 252, sd, 11.6, 37.3); deckShadow(m, 252, 36.16, 5.5, 1.5, 14, 244, sd * 11.6);
      buildBoat(m, 265.5, sd, 11.8, 32.3); deckShadow(m, 265.5, 31.16, 5.5, 1.5, 15, 257, sd * 11.8);
      for (const [cs, cp, ch, cH, cr] of [[249.2, 4.4, 41, 3.4, 0.7], [261, 5.6, 36, 3.0, 0.65]]) {
        buildCowl(m, cs, sd * cp, ch, cH, cr); deckShadow(m, cs - 0.5, ch + 0.16, 2.3, 0.9, Math.abs(cp) + 3, cs - 5, sd * cp);
      }
    }
  }
  await ctx.yield();

  // funnels and their drawn shadows
  const fS = nF === 3 ? [140, 182, 224] : [140, 182], fH = [22, 20.5, 19], funnels = [];
  fS.forEach((s, i) => { funnels.push(buildFunnel(mS, L, s, 46, fH[i], i === 0)); deckShadow(m, s - 1, 46.07, 15, 6.2, 11.3, 96); });
  // skylights along the funnel deck
  for (let s = 117; s < 232; s += 7.5) {
    if (fS.some((q) => Math.abs(s + 1.6 - q - 1) < 11)) continue;
    for (const p of [-3.6, 3.6]) { m.box(s, s + 3.2, p - 0.9, p + 0.9, 46, 46.75, GOLD, CREAM, 0.3, 0.7); m.box(s + 0.35, s + 2.85, p - 0.55, p + 0.55, 46.75, 46.95, TEAL, CREAM, 0.06, 0.2); }
  }
  await ctx.yield();
  // boats, cowls, skylights
  for (let i = 0; i < 12; i++) for (const sd of [1, -1]) {
    const s = 126.5 + i * 9.25; buildBoat(m, s, sd, 15.4, 42.3);
    if (sd < 0) m.quad([s - 6, -12.6, 41.07, 0.1], [s - 1.5, -11.4, 41.07, 0.45], [s + 3, -12.6, 41.07, 0.3], [s - 1.5, -13.6, 41.07, 0.1], TEAL, CREAM);
  }
  for (const [s, p, h, H, r] of [[90, 9.2, 36, 3.6, 0.8], [118, 6.4, 46, 4.2, 0.85], [127, 6.8, 46, 3.4, 0.7], [157, 7, 46, 4.4, 0.9], [166, 6.6, 46, 3.4, 0.7], [199, 7, 46, 4.4, 0.9],
    [208, 6.6, 46, 3.4, 0.7], [241.5, 7.5, 41, 3.8, 0.8], [254, 8.5, 36, 3.8, 0.8], [259, 12.6, 31, 3.4, 0.75], [274, 11.6, 25.5, 3, 0.7]]) {
    buildCowl(m, s + rng.range(-0.6, 0.6), p, h, H, r); buildCowl(m, s + rng.range(-0.6, 0.6), -p, h, H, r);
    for (const q of [p, -p]) deckShadow(m, s - 0.6, h + 0.09, 2.6, 1.0, Math.abs(p) + 3.2, s - 6, q);
  }
  for (const s of [149, 191]) { m.box(s, s + 6, -2.4, 2.4, 46, 47, GOLD, CREAM, 0.3, 0.7); m.box(s + 0.5, s + 5.5, -1.9, 1.9, 47, 47.4, TEAL, CREAM, 0.1, 0.3); }
  await ctx.yield();

  // bow ornament, mast, foredeck gear, staffs
  buildBowOrnament(m, 1); buildBowOrnament(m, -1);
  const mast = buildMast(m, lines); buildForedeck(m, lines);
  const staffTop = [309.4, 0, 26.4], jackTop = [-14.6, 0, 44.2];
  tube(m, [[308.7, 0, 20], staffTop], [0.2, 0.12], 6, GOLD, CREAM, { g0: 0.3, gr: 0.6 });
  tube(m, [[309.4, 0, 26.2], [309.4, 0, 26.7], [309.4, 0, 27.2]], [0.1, 0.34, 0.08], 6, GOLD, CREAM, { g0: 0.5, gr: 0.5 });
  tube(m, [[-12.9, 0, 38.4], jackTop], [0.2, 0.1], 6, GOLD, CREAM, { g0: 0.3, gr: 0.6 });
  tube(m, [[106, 0, 52.4], [106, 0, 53.5]], [0.3, 0.14], 6, GOLD, CREAM, { g0: 0.3, gr: 0.6, cap: true });

  // dressing lines and flags
  const cat = (A, B, sag, t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t) - sag * 4 * t * (1 - t)];
  const lastF = fS.length - 1;
  const runs = [[[-13.7, 0, 39.7], mast.top, 3.2], [mast.top, [106, 0, 53.4], 1.4],
    [[fS[lastF] + 0.8 * fH[lastF] * TAN10 + 6.6, 0, 46 + 0.8 * fH[lastF]], staffTop, 1.6]];
  const pairs = [[VERM, CREAM], [CREAM, TEAL], [GOLD, NAVY], [CREAM, VERM], [GOLD, VERM], [CREAM, NAVY], [GOLD, TEAL], [CREAM, GOLD]], flags = [];
  for (const [A, B, sag] of runs) {
    const len = Math.hypot(B[0] - A[0], B[2] - A[2]), n = Math.round(len / 2.15);
    for (let i = 0; i < 12; i++) lines.push([cat(A, B, sag, i / 12), cat(A, B, sag, (i + 1) / 12), 0.07, GOLD, CREAM, 0.6]);
    for (let i = 1; i < n; i++) { const pr = rng.pick(pairs); flags.push({ at: cat(A, B, sag, i / n), len: 2.1, hgt: 1.45, pat: rng.int(0, 6), a: pr[0], b: pr[1], ph: rng.range(0, TAU) }); }
  }
  flags.push({ at: staffTop, len: 4.8, hgt: 2.7, pat: 4, a: liveryName === 'black' ? VERM : TEAL, b: CREAM, ph: 1.3 });
  flags.push({ at: mast.top, len: 3.6, hgt: 2.2, pat: 3, a: CREAM, b: VERM, ph: 4.1 });
  flags.push({ at: jackTop, len: 2.6, hgt: 1.7, pat: 5, a: GOLD, b: CREAM, ph: 2.2 });

  // streamers from the rails
  const nStr = Math.max(40, Math.round((opts.streamers ?? 300) * detail)), streamers = [];
  const tiersForStr = [[36, 88, 248, hw1], [41, 96, 241, hw2], [46, 104, 234, hw3]], cols = [[CREAM, GOLD], [GOLD, CREAM], [CREAM, TEAL], [TEAL, CREAM]];
  for (let i = 0; i < nStr; i++) {
    const sd = rng.sign(); let at;
    if (rng() < 0.55) { const s = rng.range(16, 298), H = sheer(nomS(s, 30)); at = [s, sd * (hbT(s, H) + 0.15), H + 1.1]; }
    else { const [top, sa, sb, hw] = rng.pick(tiersForStr), s = rng.range(sa, sb); at = [s, sd * (hw(s) + 0.85), top + 1.05]; }
    const c = i % 3 === 0 ? [VERM, GOLD] : rng.pick(cols);
    streamers.push({ at, len: rng.range(8, 20), ph: rng.range(0, TAU), w: rng.range(0.3, 0.5), sd, a: c[0], b: c[1] });
  }
  await ctx.yield();

  // ---- meshes
  const uCamShip = { value: new THREE.Vector3(0, 30, 400) }, uCamSea = { value: new THREE.Vector3(0, 30, 400) }, uLit = { value: -1e4 };
  const staticMesh = new THREE.Mesh(inkGeometry(m), style.material({ phase: rng.range(0, TAU) }));
  staticMesh.frustumCulled = false; ship.add(staticMesh);
  await ctx.yield();
  const stackMesh = new THREE.Mesh(inkGeometry(mS), style.material({ phase: rng.range(0, TAU) })); stackMesh.frustumCulled = false; stack.add(stackMesh);
  await ctx.yield();
  const ports = buildPortholes(style, [[9, 14, 298, 3.2], [15, 10, 302, 3.2], [21, 8, 290, 3.2]], night, uLit, !!L.darkPorts); ship.add(ports);
  await ctx.yield();
  ship.add(buildLines(style, lines, uCamShip), buildFlags(style, flags), buildStreamers(style, streamers, uCamShip));
  let tris = m.triangles + mS.triangles + ports.count * 30 + lines.length * 2 + flags.length * 36 + streamers.length * 28;
  if (opts.smoke !== false) { stack.add(buildSmoke(style, funnels.map((f) => f.top), rng, uLoomInv)); tris += funnels.length * 1040; }
  await ctx.yield();
  await ctx.yield();
  if (opts.volutes !== false) { const v = buildVolutes(style, opts.voluteScale ?? 1, rng); sea.add(v.mesh); tris += v.triangles; }
  await ctx.yield();
  if (opts.waterline !== false) { const w = buildWaterline(style, rng, detail); sea.add(w.mesh); tris += w.triangles; }

  // ---- anchors
  const V = (s, p, h) => shipToLocal(s, p, h);
  const sunDir = new THREE.Vector3(-Math.sin(40 * D2R) * Math.cos(14 * D2R), Math.sin(14 * D2R), -Math.cos(40 * D2R) * Math.cos(14 * D2R));
  const anchors = {
    portalSeat: { position: V(438, 0, 8), facing: new THREE.Vector3(0, 0, 1) },
    flyThrough: JOURNEY.map((q) => V(q[0], q[1], q[2])),
    viewpoints: { entry: V(-150, 22, 2), bowClose: V(-25, 9, 2.4), climb: V(90, 27, 34), funnels: V(164, 0, 60), stern: V(310, -4, 33) },
    bowMedallion: V(6.5, hbT(6.5, 28.2) + 0.4, 28.2), anchorPort: V(17, hbT(17, 23) + 0.4, 23),
    funnelTops: funnels.map((f) => V(f.top[0], f.top[1], f.top[2])), whistle: V(funnels[0].whistle[0], 0, funnels[0].whistle[2]),
    mastHead: V(mast.head[0], 0, mast.head[2]), bridge: V(98, 0, 48), taffrail: V(310, 0, 21), ensign: V(staffTop[0], 0, staffTop[2]),
    voluteEyePort: V(22, hbT(22, 0.3) + 3.1, 2.4), sunDir,
    tugs: [V(-80, 50, 0), V(-40, -45, 0), V(300, -45, 0)], fireboats: [V(455, 50, 0), V(455, -50, 0)],
  };

  // ---- animation
  const pitch = (opts.pitchDeg ?? 0.5) * D2R, tmp = new THREE.Vector3(), size = new THREE.Vector2();
  let manualLit = null, manualLoom = null;
  const loomMax = opts.loom ?? 3.8;
  const hero = {
    object, radius: 172, height: 84, center: new THREE.Vector3(0, 30, 0),
    anchors, style, uniforms: style.uniforms, livery: liveryName, funnelCount: nF, triangles: Math.round(tris),
    ground: true, groundY: -0.2,
    setLitFront(s) { manualLit = s; },
    setProgress(u) { manualLit = u == null ? null : lerp(-128, 492, clamp(u, 0, 1)); },
    setLoom(k) { manualLoom = k; },
    update(dt, time, camera) {
      style.tick(time);
      ship.rotation.x = pitch * Math.sin(time * TAU / 9);
      if (camera) {
        object.updateWorldMatrix(true, true);
        uCamShip.value.copy(ship.worldToLocal(tmp.setFromMatrixPosition(camera.matrixWorld)));
        uCamSea.value.copy(sea.worldToLocal(tmp.setFromMatrixPosition(camera.matrixWorld)));
        let hpx = 900; if (ctx.renderer?.getDrawingBufferSize) hpx = Math.max(200, ctx.renderer.getDrawingBufferSize(size).y);
        style.uniforms.uPx.value = 2 * Math.tan((camera.fov ?? 62) * D2R / 2) / hpx;
        const sCam = HALF - uCamShip.value.z;
        uLit.value = manualLit ?? (sCam + 22);
        // poster perspective: seen from ahead the funnels loom over the bow; they settle to true height while the flare hides them
        const low = 1 - smoothstep(10, 30, uCamShip.value.y);
        const k = manualLoom ?? (1 + (loomMax - 1) * (1 - smoothstep(-80, -12, sCam)) * low), q = (k - 1) / Math.max(0.01, loomMax - 1);
        // x' = wx*x + sh*(z1 - z): each funnel stands further to port (the camera's right) the further aft it is
        const wx = 1 + 0.6 * q, sh = (7.5 / 42) * q;
        stack.matrix.set(wx, 0, -sh, sh * (HALF - 140) - 4 * q, 0, k, 0, 46 * (1 - k), 0, 0, 1, 0, 0, 0, 0, 1);
        stack.matrixWorldNeedsUpdate = true; uLoomInv.value = 1 / k;
      } else if (manualLit != null) uLit.value = manualLit;
    },
    dispose() {},
  };
  return hero;
}
