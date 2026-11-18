// The Gates in the Snow: THE GREAT GATES, and the wrought-iron-under-snow style the whole world is forged from.
//
// THE HERO. Two leaves 45 m wide and 90 m tall between barley-twist piers 6 m thick (frame of 2.5 m bar, sixteen uprights
// ending in spikes, dog bars, a ring band at 27-33 m, a band of S-scrolls under the top rail), and over them the overthrow:
// about fifty forged scrolls that build inward from two stumps on the piers as lace in one plane (a running lintel, six stalks a
// side, one scroll a level from a collar on each stalk, every eye in a cell of its own with sky round it) to the forged ring, 2 m bar round a 14 m opening at y 104, leaning 33 degrees to meet
// the climb. Then the leaves swing 80 degrees inward (toward -Z), their top rails' snow falling as two curtains, and four
// last 30 m scrolls curl shut round the ring. Old work (leaves, piers, ring) is capped with snow; forged work stays bare.
// SIZE: 104 m wide, 2.5 m deep closed, 124 m tall; radius 62. Origin on the snow between the leaves; the camera comes from +Z.
// COST: about 132k triangles, 10 draw calls, 6 programs, no textures, no lights; build about 150-250 ms, longest step < 50 ms.
//
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update(dt, time, camera), dispose, style, kind,
//                           setForge(f), setOpen(o), setRing(r), setProgress(p) }
//   opts: style (the world's one makeStyle instance), palette (7 hexes), detail (0.6-1: thins the snow veils: 96 lumps a leaf, each with a tail of three smaller ones; ROUND NINE: nearly all let go in the first second as ONE dense front that rides its leaf, so each leaf carries one veil with bare rail above and nothing falls in the gap), tilt (33,
//         degrees the ring leans = pitch of the last climb), ringY (104), openAngle (80), overthrow ('C' | 'S' | 'lyre'; seeded),
//         heat (3.5 m of glowing bar), halo (3.4), fall (16 m/s curtain), lead (1.6 s the curtains' clock runs ahead of the swing: setOpen may be
//         given a negative value), plume (1: height factor of the four plumes over the crown), plumeFat (1.4).
//   PROGRESS (drive from path u, never from time; until one is called the piece plays the whole act on a 44 s loop):
//     setForge(0..1)  0 = two stumps and the ring hanging in the gap, 1 = the last pair has closed on the ring (brief: 24 s -> 31 s)
//     setOpen(0..)    0..1 the leaves swing over what the brief calls eight seconds; KEEP COUNTING to about 2.2 at the same rate
//                     so the curtains finish their 90 m fall (1 unit = 8 s of falling)
//     setRing(0..1)   the four last scrolls close round the ring (brief: 38 s -> 41 s)
//     setProgress(0..3) = the three in order, for a quick hookup.
//   ANCHORS (local): ringCentre; portalSeat { position, normal (faces back down the climb), radius 7, tilt }; pathDir (unit, the
//     climb's heading: 33 degrees up toward -Z); flyThrough (7 points on that line from 150 m before the ring to 20 m beyond;
//     clear by 7 m everywhere, the leaves' spikes pass 8.4 m under it); approach (the level axis, y 2.5); hoopLine (the hoop's
//     way through between the opened leaves); pierFeet and crownRoots (where the world's two runs should arrive: they climb
//     the piers, then setForge takes over); hinges; viewpoints { reveal, axis, climb, beyond }.
//
// STYLE LAW (brief.styleNote), and where each rule lives
//   seven colours, flat      style.pal.{iron, sheen, snow, snowBlue, pearl, orange, straw} (+ cherry, scale: the two the
//                            brief's light text names). Written linear, shown as written: the world returns
//                            post { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0 } }.
//   a line is a bar          style.bar(batch, pts, opt): one sweeper for every member (4, 6, 8 sides, taper, barley twist),
//                            flat facet normals, real thickness. style.iron shades it: one black, sheen #3A4048 on facets
//                            that face up (normal.y > 0.55) or stand edge-on to the lens (band uEdge.xy); close to, a few
//                            long hammer flats run along upper facets, a hair lighter (uEdge.z), never a grid. No light, no shadow.
//   snow does the drawing    style.cap(batch, pts, opt): a second strip on every bar wherever its top faces up: rounded,
//                            1.3 bar widths wide, 0.6 high, overhanging, with a scalloped lip cut in the fragment shader.
//                            style.snow: white where the facet faces up, #C9D6E6 where it faces down or hangs.
//   bars meet under collars  style.collar(batch, p, axis, r): a wrapped band of three turns, set a little askew.
//   sky swallows distance    both materials mix to pearl by 1 - exp(-d / uFog) (uFog 380); heat is exempt; heavy members
//                            (half-thickness over ~0.5 m) and their caps fade as if nearer (fadeD), so they stay. The vertex
//                            shader widens every bar to >= 2 px and scales 'light' bars to nothing between 140 and 200 m.
//   steam, flakes, heat      all hard-edged: steam is a column of flat two-tone puffs, flakes are small discs capped at 1.4% of
//                            the frame height, the bead at a bend (an almond lying along the bar) and the spill on the snow are
//                            flat cut shapes; opts ember / cool leave a thin cherry arc on the last bends for a while (dusk and
//                            night only). Falling clumps are cards cut as a rounded cap with a blue scalloped hem. opts.cap
//                            [px, fade] gives the caps their own pixel floor and range (night: caps draw the far garden).
//   the one colour is heat   style.scrollMaterial(): instances of one straight bar that the vertex shader pushes out of a
//                            collar and winds up from the tip on a log spiral (closed form in arc length), keyed to a run
//                            value (uRun) and each instance's order, never to time. style.haloMaterial / steamMaterial
//                            ride the same instance attributes.
//   the hand does wrong      every builder takes the rng: tightness, tilt, askew collars, uneven caps.
// Round eleven: the overthrow's lintel scrolls alternate tall and short so sky shows between their feet; plumes stand in a row
// behind both wings, rooted at the lintel and drawn with their depth pushed 16 m back (uBack) so every scroll cuts out against them.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#1A1B1E', '#3A4048', '#F4F6F8', '#C9D6E6', '#E6EAEC', '#F08A2A', '#FFE08A'];
const V3 = THREE.Vector3;

// ---- GLSL shared by every material of the style ----------------------------------------------------------------------
export const COMMON_GLSL = /* glsl */`
uniform vec3 uIron, uSheen, uScale, uSnow, uBlue, uPearl, uOrange, uStraw, uCherry;
uniform float uFog, uTime, uNear;
uniform vec3 uEdge;                     // xy: the edge-on sheen's band (1 - |n.V|), z: how strongly hammer flats show
uniform vec2 uPx;                       // x: drawing-buffer height in px, y: least bar width in px
uniform float uUnder;                   // 1 on work the lens passes close beneath (the overthrow): see ironCol. Not supplied (0) everywhere else
float h13(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
vec3 toPearl(vec3 c, float d){ vec3 m = mix(sqrt(max(uPearl, 0.)), sqrt(max(c, 0.)), exp(-max(d - uNear, 0.) / max(uFog, 1.))); return m * m; }   // mixed as the eye sees it, so black holds;   // work within uNear of the lens keeps its full black
// far iron pales and sheds its small work, the heavy members and their caps stay: a bar of half-thickness r fades as if nearer
float fadeD(float d, float r){ return d * mix(1., .45, smoothstep(.45, 1.3, r)); }
// heat 0..1 -> black, cherry, orange, straw
vec3 heatCol(vec3 cold, float h){
  vec3 c = mix(cold, uCherry, smoothstep(0., .3, h));
  c = mix(c, uOrange, smoothstep(.25, .6, h));
  return mix(c, uStraw, smoothstep(.6, .95, h));
}
// the whole iron rule: n = facet normal (world), V = to the lens, o = position on the bar (object space, metres)
vec3 ironCol(vec3 n, vec3 V, vec3 o, float s, float taper, float d){
  float up = step(.55, n.y);
  float edge = smoothstep(uEdge.x, uEdge.y, 1. - abs(dot(n, V)));
  vec3 c = uIron;
  // one black. Close to, a few long narrow hammer flats run ALONG the bar on its upper facets, a hair lighter (never a grid:
  // each flat is 3 to 6 m long, every facet starts its run somewhere else, and only one cell in four carries one)
  float fid = dot(floor(n * 2.5 + .5), vec3(1., 5., 11.)), run = s / (3.2 + 2.6 * h11(fid * 3.7 + 2.)) + h11(fid * 1.3 + 5.) * 9.;
  float flat_ = step(.74, h11(floor(run) * 7.13 + fid)) * step(.1, n.y) * step(.12, fract(run)) * step(fract(run), .9);
  c = mix(c, uSheen, uEdge.z * (.45 + .25 * taper) * flat_ * (1. - smoothstep(22., 60., d)));
  // ROUND NINE, uUnder: seen from below no upper facet faces the lens, and where two bars overlap they were one black mass. On such work the
  // facet turned toward the top of the picture carries the sheen (a rule of the facet still, hard-edged), so every scroll can be followed
  vec3 cu = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
  float rim = uUnder * smoothstep(.16, .4, -V.y) * step(.45, dot(n, cu)) * step(.45, 1. - abs(dot(n, V)));   // a sliver: only a facet turned well away from the lens, on the bar's upper side
  return mix(c, uSheen, max(max(up, edge), rim));
}
`;
// widening: off = vertex offset from the bar's centre line (world), r = bar half-thickness, w = clip w, d = range
const WIDEN_GLSL = /* glsl */`
float widen(float r, float w, float d, float light){
  float mPerPx = 2. * max(w, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
  float k = clamp(.5 * uPx.y * mPerPx / max(r, .02), 1., 8.);
  return k * (1. - light * smoothstep(140., 200., d));
}
`;
const IRON_VERT = /* glsl */`
attribute vec3 aC; attribute vec3 aS;      // aC: centre line; aS: arc length m, flags (1 light, 2 taper, 3 both), half-thickness
varying vec3 vN, vW, vO; varying vec3 vA; varying float vF;
${COMMON_GLSL}${WIDEN_GLSL}
void main(){
  mat4 M = modelMatrix;
  #ifdef USE_INSTANCING
  M = modelMatrix * instanceMatrix;
  #endif
  vec4 wc = M * vec4(aC, 1.);
  vec3 off = (M * vec4(position, 1.)).xyz - wc.xyz;
  vec4 cc = projectionMatrix * viewMatrix * wc;
  float d = distance(cameraPosition, wc.xyz);
  float light = step(.5, mod(aS.y, 2.));
  vec3 w = wc.xyz + off * widen(aS.z, cc.w, d, light);
  vN = mat3(M) * normal; vW = w; vO = position; vA = vec3(aS.x, step(1.5, aS.y), d); vF = fadeD(d, aS.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const IRON_FRAG = /* glsl */`
varying vec3 vN, vW, vO; varying vec3 vA; varying float vF;
${COMMON_GLSL}
void main(){
  vec3 n = vN / max(length(vN), 1e-4);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  #ifdef FACET
  // beaten leaves: the rule is decided once per facet (its true normal, turned to the lens), so a leaf is flat black with at
  // most a hard-edged sheen facet and never a gradient, however close it passes
  vec3 fn = cross(dFdx(vW), dFdy(vW)); float fl = length(fn);
  if (fl > 1e-10) { n = fn / fl; if (dot(n, V) < 0.) n = -n; }
  gl_FragColor = vec4(toPearl(mix(uIron, uSheen, step(.5, n.y)), vF), 1.);
  #else
  gl_FragColor = vec4(toPearl(ironCol(n, V, vO, vA.x, vA.y, vA.z), vF), 1.);
  #endif
}`;
const SNOW_VERT = /* glsl */`
attribute vec3 aC; attribute vec3 aS; attribute float aShed;   // aS: arc length / scallop period, v (0 top .. 1 lip hem), bar half-thickness
uniform float uShed, uShiver; uniform vec2 uCap;   // uCap: the caps' own pixel floor (x times the bars') and how slowly they pale with range (y)
varying vec3 vN; varying vec3 vA;
${COMMON_GLSL}${WIDEN_GLSL}
void main(){
  mat4 M = modelMatrix;
  #ifdef USE_INSTANCING
  M = modelMatrix * instanceMatrix;
  #endif
  vec4 wc = M * vec4(aC, 1.);
  vec3 off = (M * vec4(position, 1.)).xyz - wc.xyz;
  vec4 cc = projectionMatrix * viewMatrix * wc;
  float d = distance(cameraPosition, wc.xyz);
  // a cap that lets go: staggered along the bar, it slumps and is gone (the falling clumps are separate instances)
  float shedL = aShed > .5 ? clamp(uShed - (aShed - 1.), 0., 1.) : 0.;   // aShed: 0 never sheds, 1 + order otherwise
  float gone = clamp(max(uShiver, shedL) * 1.6 - .6 * (.5 + .5 * sin(aS.x * 1.9 + aC.x * .37 + aC.z * .23)), 0., 1.);   // a wave along the bar, so the cap slumps in lumps, not shards
  gone = gone * gone * (3. - 2. * gone);
  off *= 1. - gone;
  vec3 w = wc.xyz + off * widen(aS.z / max(uCap.x, .2), cc.w, d, 0.);
  vN = mat3(M) * normal; vA = vec3(aS.x, aS.y, fadeD(d, aS.z) * uCap.y);
  gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
}`;
const SNOW_FRAG = /* glsl */`
varying vec3 vN; varying vec3 vA;
${COMMON_GLSL}
void main(){
  vec3 n = vN / max(length(vN), 1e-4);
  if (vA.y > .01) {                       // the lip: a hanging hem with a scalloped edge
    float hem = .30 + .70 * abs(sin(vA.x * 3.14159)) * (.75 + .25 * sin(vA.x * 1.7 + 1.3));
    if (vA.y > hem) discard;
  }
  vec3 c = mix(uBlue, uSnow, step(.22, n.y) * step(vA.y, .01));
  gl_FragColor = vec4(toPearl(c, vA.z), 1.);
}`;

// ---- geometry: one growing vertex batch, so a whole structure is one draw ------------------------------------------------
export class Batch {
  constructor() { this.nv = 0; this.ni = 0; this.cv = 8192; this.ci = 16384; this.shed = 0;
    this.P = new Float32Array(this.cv * 3); this.N = new Float32Array(this.cv * 3); this.C = new Float32Array(this.cv * 3);
    this.A = new Float32Array(this.cv * 3); this.S = new Float32Array(this.cv); this.I = new Uint32Array(this.ci); }
  need(v, i) {
    if (this.nv + v > this.cv) { while (this.nv + v > this.cv) this.cv *= 2;
      for (const k of ['P', 'N', 'C', 'A']) { const a = new Float32Array(this.cv * 3); a.set(this[k]); this[k] = a; }
      const s = new Float32Array(this.cv); s.set(this.S); this.S = s; }
    if (this.ni + i > this.ci) { while (this.ni + i > this.ci) this.ci *= 2; const a = new Uint32Array(this.ci); a.set(this.I); this.I = a; }
  }
  v(px, py, pz, nx, ny, nz, cx, cy, cz, a0, a1, a2) {
    const n = this.nv++, o = n * 3;
    this.P[o] = px; this.P[o + 1] = py; this.P[o + 2] = pz; this.N[o] = nx; this.N[o + 1] = ny; this.N[o + 2] = nz;
    this.C[o] = cx; this.C[o + 1] = cy; this.C[o + 2] = cz; this.A[o] = a0; this.A[o + 1] = a1; this.A[o + 2] = a2; this.S[n] = this.shed;
    return n;
  }
  tri(a, b, c) { const I = this.I; I[this.ni++] = a; I[this.ni++] = b; I[this.ni++] = c; }
  get triangles() { return this.ni / 3; }
  geometry() {
    const g = new THREE.BufferGeometry(), f = (a, n) => new THREE.BufferAttribute(a.slice(0, this.nv * n), n);
    g.setAttribute('position', f(this.P, 3)); g.setAttribute('normal', f(this.N, 3)); g.setAttribute('aC', f(this.C, 3));
    g.setAttribute('aS', f(this.A, 3)); g.setAttribute('aShed', f(this.S, 1));
    g.setIndex(new THREE.BufferAttribute(this.I.slice(0, this.ni), 1)); g.computeBoundingSphere();
    return g;
  }
}
const _t = new V3(), _n = new V3(), _b = new V3(), _u = new V3(), _e1 = new V3(), _e2 = new V3(), _q = new V3();
const tangentAt = (pts, i, out) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)]; out.subVectors(b, a); const l = out.length(); return l > 1e-6 ? out.multiplyScalar(1 / l) : out.set(1, 0, 0); };
// one flat-shaded quad a,b,c,d (xyz in Q at offsets), facing away from centre m; each corner carries its own centre and aS.x
function quadOut(B, Q, ia, ib, ic, id, C, ca, cb, s0, s1, a1, a2, a2b, m) {
  _e1.set(Q[ic] - Q[ia], Q[ic + 1] - Q[ia + 1], Q[ic + 2] - Q[ia + 2]); _e2.set(Q[id] - Q[ib], Q[id + 1] - Q[ib + 1], Q[id + 2] - Q[ib + 2]);
  _q.crossVectors(_e1, _e2); const l = _q.length(); if (l < 1e-9) return; _q.multiplyScalar(1 / l);
  const flip = (_q.x * ((Q[ia] + Q[ic]) * 0.5 - m.x) + _q.y * ((Q[ia + 1] + Q[ic + 1]) * 0.5 - m.y) + _q.z * ((Q[ia + 2] + Q[ic + 2]) * 0.5 - m.z)) < 0;
  if (flip) _q.negate();
  B.need(4, 6);
  const v0 = B.v(Q[ia], Q[ia + 1], Q[ia + 2], _q.x, _q.y, _q.z, C[ca], C[ca + 1], C[ca + 2], s0, a1, a2);
  const v1 = B.v(Q[ib], Q[ib + 1], Q[ib + 2], _q.x, _q.y, _q.z, C[ca], C[ca + 1], C[ca + 2], s0, a1, a2);
  const v2 = B.v(Q[ic], Q[ic + 1], Q[ic + 2], _q.x, _q.y, _q.z, C[cb], C[cb + 1], C[cb + 2], s1, a1, a2b);
  const v3 = B.v(Q[id], Q[id + 1], Q[id + 2], _q.x, _q.y, _q.z, C[cb], C[cb + 1], C[cb + 2], s1, a1, a2b);
  if (flip) { B.tri(v0, v2, v1); B.tri(v0, v3, v2); } else { B.tri(v0, v1, v2); B.tri(v0, v2, v3); }
}

// BAR. pts: Vector3[] centre line. opt: r (half-thickness: number or (t, i) => m), sides 4|6|8, rot (radians; default puts
// a face toward `up`), twist (radians over the whole length: the barley twist is sides 8, star .62, twist ~ length / r),
// star (odd corners' radius factor), up (Vector3 a face is squared to; default +Z), light (infill that vanishes by 200 m),
// taper (shows hammer flats), capA / capB (close the ends). Returns the arc length.
export function bar(B, pts, opt = {}) {
  const n = pts.length, sides = opt.sides || 4, star = opt.star ?? 1, twist = opt.twist || 0, rot = opt.rot ?? Math.PI / sides;
  const rf = typeof opt.r === 'function' ? opt.r : () => (opt.r ?? 0.5), flags = (opt.light ? 1 : 0) + (opt.taper ? 2 : 0);
  const Q = new Float32Array(n * sides * 3), C = new Float32Array(n * 3), R = new Float32Array(n), S = new Float32Array(n);
  const up = opt.up || _u.set(0, 0, 1); let len = 0;
  for (let i = 0; i < n; i++) {
    const p = pts[i]; tangentAt(pts, i, _t);
    if (i === 0) { _n.copy(up).addScaledVector(_t, -up.dot(_t)); if (_n.lengthSq() < 1e-4) _n.set(1, 0, 0).addScaledVector(_t, -_t.x); _n.normalize(); }
    else { _n.addScaledVector(_t, -_n.dot(_t)); if (_n.lengthSq() < 1e-8) _n.set(0, 1, 0).addScaledVector(_t, -_t.y); _n.normalize(); len += p.distanceTo(pts[i - 1]); }
    _b.crossVectors(_t, _n);
    const t = n > 1 ? i / (n - 1) : 0, r = Math.max(0, rf(t, i)), rc = r / Math.cos(Math.PI / sides);
    C[i * 3] = p.x; C[i * 3 + 1] = p.y; C[i * 3 + 2] = p.z; R[i] = r; S[i] = len;
    for (let j = 0; j < sides; j++) {
      const a = rot + twist * t + (j / sides) * Math.PI * 2, rr = rc * (j & 1 ? star : 1), ca = Math.cos(a) * rr, sa = Math.sin(a) * rr, o = (i * sides + j) * 3;
      Q[o] = p.x + _n.x * ca + _b.x * sa; Q[o + 1] = p.y + _n.y * ca + _b.y * sa; Q[o + 2] = p.z + _n.z * ca + _b.z * sa;
    }
  }
  const s0 = opt.s0 || 0;
  for (let i = 0; i < n - 1; i++) {
    _e1.copy(pts[i]).add(pts[i + 1]).multiplyScalar(0.5); const m = _b.copy(_e1);
    for (let j = 0; j < sides; j++) {
      const j2 = (j + 1) % sides;
      quadOut(B, Q, (i * sides + j) * 3, (i * sides + j2) * 3, ((i + 1) * sides + j2) * 3, ((i + 1) * sides + j) * 3, C, i * 3, (i + 1) * 3, s0 + S[i], s0 + S[i + 1], flags, R[i], R[i + 1], m);
    }
  }
  for (const end of [0, n - 1]) {      // closed ends: a fan on the centre
    if ((end === 0 ? opt.capA : opt.capB) === false || R[end] < 0.02) continue;
    tangentAt(pts, end, _t); if (end === 0) _t.negate(); const p = pts[end];
    B.need(sides + 1, sides * 3);
    const c = B.v(p.x, p.y, p.z, _t.x, _t.y, _t.z, p.x, p.y, p.z, s0 + S[end], flags, R[end]), ring = [];
    for (let j = 0; j < sides; j++) { const o = (end * sides + j) * 3; ring.push(B.v(Q[o], Q[o + 1], Q[o + 2], _t.x, _t.y, _t.z, p.x, p.y, p.z, s0 + S[end], flags, R[end])); }
    // winding from the first triangle's geometric normal
    const o0 = end * sides * 3, o1 = o0 + 3;
    _e1.set(Q[o0] - p.x, Q[o0 + 1] - p.y, Q[o0 + 2] - p.z); _e2.set(Q[o1] - p.x, Q[o1 + 1] - p.y, Q[o1 + 2] - p.z);
    const ccw = _q.crossVectors(_e1, _e2).dot(_t) > 0;
    for (let j = 0; j < sides; j++) { const a = ring[j], b = ring[(j + 1) % sides]; if (ccw) B.tri(c, a, b); else B.tri(c, b, a); }
  }
  return len;
}

// SNOW CAP along a bar's centre line, wherever its top faces up (|tangent.y| < maxSlope). opt: r (the bar's half-thickness,
// number or (t, i) => m), wide 1.3, high 0.6 (of the bar's width, never under minH 0.25 m), pinch (round the ends off, default
// true), seed (moves the scallops and the unevenness), period (scallop length). B.shed (0/1) marks caps that let go with uShed.
export function cap(B, pts, opt = {}) {
  const rf = typeof opt.r === 'function' ? opt.r : () => (opt.r ?? 0.5), maxSlope = opt.maxSlope ?? 0.8, wide = opt.wide ?? 1.3, high = opt.high ?? 0.6;
  const minH = opt.minH ?? 0.25, seed = opt.seed ?? 0, pinchOn = opt.pinch !== false;
  const P = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const r = rf(pts.length > 1 ? i / (pts.length - 1) : 0, i); P.push(pts[i]); R.push(r);
    if (i < pts.length - 1) {
      const r2 = rf((i + 1) / (pts.length - 1), i + 1), l = pts[i].distanceTo(pts[i + 1]), k = Math.ceil(l / Math.max(opt.step ?? 1.2, 4 * r));
      for (let j = 1; j < k; j++) { P.push(pts[i].clone().lerp(pts[i + 1], j / k)); R.push(lerp(r, r2, j / k)); }
    }
  }
  const PROF = [[-1, -0.68, 1], [-1, 0.12, 0.02], [-0.62, 0.78, 0], [0, 1, 0], [0.62, 0.78, 0], [1, 0.12, 0.02], [1, -0.68, 1]];   // x (of w), y (of h), v
  const FACES = [[0, 1, 1], [1, 2, 0], [2, 3, 0], [3, 4, 0], [4, 5, 0], [5, 6, 1], [5, 1, 2]];                                  // a, b, kind (1 lip, 2 underside)
  const emit = (run) => {
    const m = run.length, Q = new Float32Array(m * 21), S = new Float32Array(m); let tot = 0;
    for (let i = 1; i < m; i++) { tot += P[run[i]].distanceTo(P[run[i - 1]]); S[i] = tot; }
    for (let i = 0; i < m; i++) {
      const k = run[i], p = P[k], r = R[k]; tangentAt(P, k, _t);
      _u.set(0, 1, 0).addScaledVector(_t, -_t.y).normalize(); _b.crossVectors(_t, _u);
      const e = pinchOn ? smoothstep(0, 2 * r + 0.3, Math.min(S[i], tot - S[i])) : 1;
      const un = 0.82 + 0.36 * (0.5 + 0.5 * Math.sin(S[i] * 1.31 / Math.max(r, 0.2) + seed * 9.1 + k * 0.7));
      const w = wide * r * (0.7 + 0.3 * e), h = Math.max(2 * r * high, minH) * (0.25 + 0.75 * e) * un;
      for (let j = 0; j < 7; j++) { const x = PROF[j][0] * w, y = r + PROF[j][1] * h, o = (i * 7 + j) * 3;
        Q[o] = p.x + _b.x * x + _u.x * y; Q[o + 1] = p.y + _b.y * x + _u.y * y; Q[o + 2] = p.z + _b.z * x + _u.z * y; }
    }
    for (let i = 0; i < m - 1; i++) {
      const pa = P[run[i]], pb = P[run[i + 1]], ra = R[run[i]], rb = R[run[i + 1]];
      const per = opt.period ?? Math.max(1.2, 3.2 * ra), sa = S[i] / per + seed, sb = S[i + 1] / per + seed;
      for (const [ja, jb, kind] of FACES) {
        const a = (i * 7 + ja) * 3, b = (i * 7 + jb) * 3, c = ((i + 1) * 7 + jb) * 3, d = ((i + 1) * 7 + ja) * 3;
        _e1.set(Q[c] - Q[a], Q[c + 1] - Q[a + 1], Q[c + 2] - Q[a + 2]); _e2.set(Q[d] - Q[b], Q[d + 1] - Q[b + 1], Q[d + 2] - Q[b + 2]);
        _q.crossVectors(_e1, _e2); const l = _q.length(); if (l < 1e-9) continue; _q.multiplyScalar(1 / l);
        if (kind === 2) { if (_q.y > 0) _q.negate(); }
        else if (_q.x * ((Q[a] + Q[c]) * 0.5 - (pa.x + pb.x) * 0.5) + _q.y * ((Q[a + 1] + Q[c + 1]) * 0.5 - (pa.y + pb.y) * 0.5) + _q.z * ((Q[a + 2] + Q[c + 2]) * 0.5 - (pa.z + pb.z) * 0.5) < 0) _q.negate();
        const va = kind === 1 ? PROF[ja][2] : 0, vb = kind === 1 ? PROF[jb][2] : 0;
        B.need(4, 6);
        const v0 = B.v(Q[a], Q[a + 1], Q[a + 2], _q.x, _q.y, _q.z, pa.x, pa.y, pa.z, sa, va, ra), v1 = B.v(Q[b], Q[b + 1], Q[b + 2], _q.x, _q.y, _q.z, pa.x, pa.y, pa.z, sa, vb, ra);
        const v2 = B.v(Q[c], Q[c + 1], Q[c + 2], _q.x, _q.y, _q.z, pb.x, pb.y, pb.z, sb, vb, rb), v3 = B.v(Q[d], Q[d + 1], Q[d + 2], _q.x, _q.y, _q.z, pb.x, pb.y, pb.z, sb, va, rb);
        B.tri(v0, v1, v2); B.tri(v0, v2, v3);
      }
    }
  };
  let run = [];
  for (let i = 0; i < P.length; i++) { tangentAt(P, i, _t); if (Math.abs(_t.y) < maxSlope) run.push(i); else { if (run.length > 1) emit(run); run = []; } }
  if (run.length > 1) emit(run);
}

// COLLAR: a wrapped band of three turns round a bar of half-thickness R at p, about `axis`; opt.rng sets it a little askew.
export function collar(B, p, axis, R, opt = {}) {
  const br = opt.band ?? Math.max(0.1, R * 0.2), turns = opt.turns ?? 3, seg = opt.seg ?? 8, n = turns * seg, rng = opt.rng;
  const ax = axis.clone().normalize(); if (rng) { ax.x += rng.range(-0.07, 0.07); ax.y += rng.range(-0.07, 0.07); ax.z += rng.range(-0.07, 0.07); ax.normalize(); }
  const u = new V3(0, 0, 1); if (Math.abs(ax.z) > 0.9) u.set(1, 0, 0); u.addScaledVector(ax, -u.dot(ax)).normalize(); const v = new V3().crossVectors(ax, u);
  const ph = rng ? rng() * 6.28 : 0, pts = [];
  for (let i = 0; i <= n; i++) { const a = ph + (i / seg) * Math.PI * 2, h = (i / n - 0.5) * turns * br * 2.04, rr = R + br * 0.75;
    pts.push(new V3(p.x + ax.x * h + (u.x * Math.cos(a) + v.x * Math.sin(a)) * rr, p.y + ax.y * h + (u.y * Math.cos(a) + v.y * Math.sin(a)) * rr, p.z + ax.z * h + (u.z * Math.cos(a) + v.z * Math.sin(a)) * rr)); }
  bar(B, pts, { r: br, sides: 4, up: ax, light: opt.light });
}

// SCROLL. One description serves the static scrolls (scrollPts -> bar + cap) and the forged ones (the vertex shader):
//   L total length, Lw wound (spiral) length at the tip end, b tightness of the log spiral (0.17 tight .. 0.26 open),
//   s0 arc offset of the tip from the spiral's eye, k curvature of the stem (1/m),
//   hand +1 / -1 which side it curls to, R bar half-thickness. (k < 0 carries the curl on, a C; k > 0 bends against it, an S.)  scrollSpec(across, R, b, stem, k, hand) fills it in.
export function scrollSpec(across, R, b = 0.2, stem = 0, k = 0, hand = 1) {
  const c = b / Math.sqrt(1 + b * b), s0 = 1.15 * R / c, Lw = Math.max(1, across * 0.5 / c - s0);
  return { L: Lw + stem, Lw, b, s0, k, hand, R };
}
export const scrollTaper = (S, s) => S.R * (0.5 + 0.5 * smoothstep(0, 0.4 * S.Lw, s));
// final shape at arc length s from the tip, in the root frame (root at 0,0 heading +x); out [x, y]
export function scrollAt(S, s, out) {
  const Ls = S.L - S.Lw, k = Math.abs(S.k) < 1e-4 ? 1e-4 : S.k;
  const base = (sg) => { const a = Math.min(sg, Ls), ex = sg - a, ph = k * a; return [Math.sin(ph) / k + Math.cos(ph) * ex, (1 - Math.cos(ph)) / k + Math.sin(ph) * ex]; };
  if (s >= S.Lw) { const p = base(S.L - s); out[0] = p[0]; out[1] = p[1] * S.hand; return out; }
  const c = S.b / Math.sqrt(1 + S.b * S.b), al = Math.atan(1 / S.b), q = S.s0 + s, qw = S.s0 + S.Lw, th = Math.log(q) / S.b, thw = Math.log(qw) / S.b;
  const pb = base(Ls), rho = k * Ls - (thw + al + Math.PI), dx = c * (q * Math.cos(th) - qw * Math.cos(thw)), dy = c * (q * Math.sin(th) - qw * Math.sin(thw));
  out[0] = pb[0] + Math.cos(rho) * dx - Math.sin(rho) * dy; out[1] = (pb[1] + Math.sin(rho) * dx + Math.cos(rho) * dy) * S.hand; return out;
}
// centre line of a finished scroll from root to tip: root + dir * x + side * y. Returns { pts, r: (t, i) => m } for bar() and cap().
export function scrollPts(root, dir, side, S, n = 40) {
  const pts = [], rs = [], o = [0, 0];
  for (let i = 0; i <= n; i++) { const s = S.L * Math.pow(1 - i / n, 1.6); scrollAt(S, s, o); rs.push(scrollTaper(S, s));
    pts.push(new V3(root.x + dir.x * o[0] + side.x * o[1], root.y + dir.y * o[0] + side.y * o[1], root.z + dir.z * o[0] + side.z * o[1])); }
  return { pts, r: (t, i) => rs[i] };
}

// ---- the forging: instanced scrolls -------------------------------------------------------------------------------------
// per instance: instanceMatrix (x = root heading, y = the side it curls to before `hand`, z = out of its plane),
//   aSc (L, Lw, b, s0), aSd (k, hand, R, order), aSe (dur, seed).  growth g = clamp((uRun - order) / dur, 0, 1):
//   0..0.45 the straight glowing bar is pushed out of the collar, 0.12..0.9 it winds up from the tip, 0.9..1 it cools; then never moves.
const SCROLL_GLSL = /* glsl */`
attribute vec4 aSc, aSd; attribute vec2 aSe;
uniform float uRun, uHeat;
vec2 sBase(float sg, float Ls, float k){ float a = min(sg, Ls), ex = sg - a, ph = k * a; return vec2(sin(ph) / k + cos(ph) * ex, (1. - cos(ph)) / k + sin(ph) * ex); }
// centre (xy) and heading angle (z) of the bar at arc length s from the tip, with e pushed out and w wound
vec3 scrollPose(float s, float e, float w){
  float L = aSc.x, Lw = aSc.y, b = max(aSc.z, .02), s0 = max(aSc.w, .01), Ls = L - Lw;
  float k = abs(aSd.x) < 1e-4 ? 1e-4 : aSd.x;
  if (s >= w) { float sg = max(e - s, 0.); return vec3(sBase(sg, Ls, k), k * min(sg, Ls)); }
  float sgw = max(e - w, 0.), phw = k * min(sgw, Ls);
  float c = b / sqrt(1. + b * b), al = atan(1. / b), q = s0 + s, qw = s0 + w, th = log(q) / b, thw = log(qw) / b;
  float rho = phw - (thw + al + 3.14159265);
  vec2 d = c * (q * vec2(cos(th), sin(th)) - qw * vec2(cos(thw), sin(thw)));
  float cr = cos(rho), sr = sin(rho);
  return vec3(sBase(sgw, Ls, k) + vec2(cr * d.x - sr * d.y, sr * d.x + cr * d.y), rho + th + al + 3.14159265);
}
float scrollG(){ return clamp((uRun - aSd.w) / max(aSe.x, 1e-3), 0., 1.); }
`;
const SCROLL_VERT = /* glsl */`
varying vec3 vN, vW, vO, vR; varying vec3 vA; varying vec4 vH; varying float vF;
uniform vec2 uEmber;                    // x: how hot finished work stays (0 none, .3 cherry), y: for how much of the run
uniform float uHeatMin;                 // the least share of the hot length kept beside the lens (.35; a run whose scrolls are the picture keeps more)
${COMMON_GLSL}${WIDEN_GLSL}${SCROLL_GLSL}
void main(){
  float g = scrollG(), L = aSc.x, Lw = aSc.y;
  float e = L * clamp(g / .45, 0., 1.), w = Lw * clamp((g - .12) / .78, 0., 1.);
  float s = L * pow(clamp(1. - position.x, 0., 1.), 1.6);
  vec3 ps = scrollPose(s, e, w);
  float r = aSd.z * (.5 + .5 * smoothstep(0., max(.4 * Lw, 1e-3), s)) * step(s, e + .01) * step(.0005, g);
  vec2 T = vec2(cos(ps.z), sin(ps.z)), Nn = vec2(-T.y, T.x);
  vec3 c = vec3(ps.x, ps.y * aSd.y, 0.);
  vec3 nrm = vec3(Nn.x * normal.y, Nn.y * normal.y * aSd.y, normal.z);
  vec3 off = vec3(Nn.x * position.y, Nn.y * position.y * aSd.y, position.z);
  float isCollar = step(position.x, -.01);                 // the three-turn collar it springs from: template verts with x < 0
  if (isCollar > .5) { c = vec3((-position.x - .2) * 11. * aSd.z, 0., 0.); off = vec3(0., position.y * aSd.y, position.z);
    nrm = vec3(normal.x, normal.y * aSd.y, normal.z); r = aSd.z * step(.0005, g); s = L; }
  mat4 M = modelMatrix * instanceMatrix;
  vec4 wc = M * vec4(c, 1.);
  vec4 cc = projectionMatrix * viewMatrix * wc;
  float d = distance(cameraPosition, wc.xyz);
  vec3 wp = wc.xyz + mat3(M) * off * (r * widen(max(r, .02), cc.w, d, 0.));
  float hl = max(uHeat, .1) * clamp(d / (20. + 20. * aSd.z + 70. * max(aSd.z - .35, 0.)), uHeatMin, 1.);       // heat stays small: beside the lens the hot length shortens, sooner on heavy bar
  // heat is drawn per pixel from the arc length (vA.x): vH = bend, hot length, how hot the bend is, how hot the cooled bend stays.
  // the last bend cools slowly where the hour is dark: a thin cherry arc that goes out over uEmber.y of the run
  float age = uRun - aSd.w - aSe.x, hold = 1. - smoothstep(.5 * uEmber.y, max(uEmber.y, 1e-3), age);
  vH = vec4(w, hl, (1. - smoothstep(.88, 1., g)) * step(.0005, g) * (1. - isCollar), uEmber.x * hold * step(.9, g) * (1. - isCollar));
  vR = mat3(M) * off;
  vN = mat3(M) * nrm; vW = wp; vO = c + off * r + aSe.y * 31.; vA = vec3(s, 1., d); vF = fadeD(d, aSd.z);
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
}`;
const SCROLL_FRAG = /* glsl */`
varying vec3 vN, vW, vO, vR; varying vec3 vA; varying vec4 vH; varying float vF;
${COMMON_GLSL}
void main(){
  vec3 n = vN / max(length(vN), 1e-4);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  float s = vA.x, hl = max(vH.y, .02);
  float h = s < vH.x ? 1. - (vH.x - s) / hl : 1. - (s - vH.x) / (1.4 * hl);
  float heat = clamp(h, 0., 1.) * vH.z;
  // the ember is a thin arc down the middle of the bar as the lens sees it, never the whole bar
  vec3 rr = vR / max(length(vR), 1e-4);
  float emb = vH.w * step(.9, dot(rr, V)) * clamp(1.3 - abs(s - vH.x) / max(.45 * hl, .05), 0., 1.);
  gl_FragColor = vec4(heatCol(toPearl(ironCol(n, V, vO, vA.x, vA.y, vA.z), vF), max(heat, emb)), 1.);
}`;
// the bead at the bend (or at the tip while the bar is pushed out): camera-facing, hard-edged, never under a few px nor over a small share of the frame
const HALO_VERT = /* glsl */`
uniform float uHalo; uniform vec2 uHaloPx; varying vec2 vUv; varying float vI, vSeed;
${COMMON_GLSL}${SCROLL_GLSL}
void main(){
  float g = scrollG(), L = aSc.x, Lw = aSc.y, e = L * clamp(g / .45, 0., 1.), w = Lw * clamp((g - .12) / .78, 0., 1.);
  vec3 ps = scrollPose(w, e, w);
  vec4 mv = modelViewMatrix * instanceMatrix * vec4(ps.x, ps.y * aSd.y, 0., 1.);
  vI = step(.0005, g) * (1. - smoothstep(.86, .98, g));
  float mPerPx = 2. * max(-mv.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
  float size = clamp(uHalo * aSd.z, uHaloPx.x * mPerPx, uHaloPx.y * uPx.x * mPerPx) * vI;   // never under a few px, never over a share of the frame
  vec2 tv = (modelViewMatrix * instanceMatrix * vec4(cos(ps.z), sin(ps.z) * aSd.y, 0., 0.)).xy; float tl = length(tv);
  tv = tl > 1e-4 ? tv / tl : vec2(1., 0.);                // the bar's heading at the bend, on screen
  float lie = clamp(tl / max(length(instanceMatrix[0].xyz), 1e-4), 0., 1.);   // seen end-on the bead is round
  vec2 q = position.xy * vec2(mix(1.15, 1.75, lie), mix(1.15, .8, lie)) * size * 2.;
  mv.xy += tv * q.x + vec2(-tv.y, tv.x) * q.y; mv.z += aSd.z * 1.5;
  vUv = position.xy * 2.; vSeed = aSe.y;
  gl_Position = projectionMatrix * mv;
}`;
const HALO_FRAG = /* glsl */`
varying vec2 vUv; varying float vI, vSeed;
${COMMON_GLSL}
void main(){
  // flat inks: the hot bend itself, a straw almond with an orange rim, cut hard, its edge licked unevenly (never a round bulb)
  vec2 p = vec2(vUv.x, vUv.y * (1. + .9 * vUv.x * vUv.x));
  float r = length(p) * (1. + .05 * sin(atan(p.y, abs(p.x) + 1e-4) * 5. + vSeed * 40. + uTime * 2.3));
  if (r > .9 || vI < .02) discard;
  gl_FragColor = vec4(mix(uStraw, uOrange, step(.5, r)), 1.);
}`;
// the spill: one flat orange tint with a hard scalloped edge on the snow under a hot bend that is within a few metres of the ground (uSpill = its width in m)
const SPILL_VERT = /* glsl */`
uniform float uSpill, uLinger; varying vec2 vUv; varying float vI;
${COMMON_GLSL}${SCROLL_GLSL}
void main(){
  float g = scrollG(), L = aSc.x, Lw = aSc.y, e = L * clamp(g / .45, 0., 1.), w = Lw * clamp((g - .12) / .78, 0., 1.);
  vec3 ps = scrollPose(w, e, w);
  vec4 wp = modelMatrix * instanceMatrix * vec4(ps.x, ps.y * aSd.y, 0., 1.);
  float age = uRun - aSd.w - aSe.x, born = step(.0005, g);
  float held = .62 * (1. - smoothstep(.3 * uLinger, max(uLinger, 1e-3), age)) * step(.001, uLinger);        // the pool stays while the work cools
  vI = born * max(1. - smoothstep(.8, .98, g), held) * (1. - smoothstep(2.5, 7., wp.y));
  vUv = position.xy * 2.;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp.x + position.x * uSpill, .07, wp.z + position.y * uSpill, 1.);
}`;
const SPILL_FRAG = /* glsl */`
varying vec2 vUv; varying float vI;
${COMMON_GLSL}
void main(){
  float an = atan(vUv.y, abs(vUv.x) + 1e-4), r = length(vUv) * (1. + .07 * sin(an * 7.));
  float a = (1. - smoothstep(.08, .96, r)) * vI;                    // soft: orange at the rim, gold where the bend hangs over it
  if (a < .015) discard;
  gl_FragColor = vec4(mix(uOrange, uStraw, smoothstep(.4, .85, a)), min(a * .95, .85));
}`;
// steam, drawn in the snow's own language: each plume is a column of flat puffs with a hard scalloped edge, white above and
// blue below, narrow at the foot, leaning, thinning into a few detached puffs. per instance aPos (base, local), aSt (order,
// dur, seed, height m); alive while (uRun - order) / dur is between 0 and ~2.4 (dur <= 0: always on).
const STEAM_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aSt; uniform float uRun, uFat, uBack; varying vec4 vU;
${COMMON_GLSL}
void main(){
  float ph = (uRun - aSt.x) / max(aSt.y, 1e-3);
  float life = aSt.y <= 0. ? 1. : smoothstep(0., .12, ph) * (1. - smoothstep(1., 2.4, ph));
  vec4 wb = modelMatrix * vec4(aPos, 1.);
  vec2 tc = cameraPosition.xz - wb.xz; tc /= max(length(tc), 1e-3);
  life *= smoothstep(6., 15., distance(cameraPosition, wb.xyz));       // a plume the lens brushes thins away instead of filling the frame
  // ROUND EIGHT: a near (thin) plume that is dying, or that the lens brushes, shrinks toward its foot as ONE column; its puffs no
  // longer shrink apart into beads that float with no source. Tall far plumes (uFat above 1.2) are as they were.
  float thin = 1. - step(1.2, uFat);
  float y = position.y, hgt = aSt.w * mix(.6 + .4 * life, .3 + .7 * life, thin);
  float lean = y * y * hgt * .3 + sin(uTime * .6 + aSt.z * 40. + y * 3.) * y * hgt * .04;
  // a fat (far, tall) plume turns its height toward the lens as well, so that seen from below on the climb it still stands as a column
  vec3 sd = vec3(-tc.y, 0., tc.x), tcam = cameraPosition - wb.xyz; tcam /= max(length(tcam), 1e-3);
  vec3 upv = mix(vec3(0., 1., 0.), cross(sd, tcam), clamp(uFat - 1., 0., 1.) * .85); upv /= max(length(upv), 1e-3);
  vec3 w = wb.xyz + sd * (position.x * hgt * .5 * uFat) + upv * (y * hgt) + vec3(lean, 0., lean * .35);
  vU = vec4(position.x * .5 * uFat, y, mix(life, 1., thin), aSt.z); gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.);
  // ROUND ELEVEN, uBack (the plumes behind the Gates' crown): drawn where it stands but with the depth of a point uBack metres further from the
  // lens, so a plume that leans toward the lens never comes in front of the lace it stands behind
  if (uBack > 0.) { vec3 tb = w - cameraPosition; vec4 fb = projectionMatrix * viewMatrix * vec4(w + tb / max(length(tb), 1e-3) * uBack, 1.); gl_Position.z = fb.z / max(fb.w, 1e-4) * gl_Position.w; }
  if (life < .02) gl_Position = vec4(2., 2., 2., 1.);
}`;
const STEAM_FRAG = /* glsl */`
varying vec4 vU; uniform float uFat;   // uFat: how fat the puffs are for the plume's height (1 near work, about 2 for tall far plumes, so they stand as columns, not stacks of beads)
${COMMON_GLSL}
void main(){
  vec2 p = vU.xy; float inside = -1., lit = -1.;
  for (int i = 0; i < 7; i++) {
    float fi = float(i), ph = fract(fi / 7. + uTime * .1 + vU.w * 3.7);
    float r = (.042 + .105 * ph) * uFat * smoothstep(0., .08, ph) * (1. - smoothstep(.66, 1., ph)) * (.4 + .6 * vU.z);
    vec2 c = vec2(.05 * uFat * ph * sin(ph * 7. + vU.w * 30. + fi * 2.1), .05 + .8 * ph - .1 * (uFat - 1.) * ph);
    inside = max(inside, r - length(p - c));
    lit = max(lit, .8 * r - length(p - c - vec2(-.16, .3) * r));
  }
  if (inside < 0.) discard;
  float low = 1. - smoothstep(.1, mix(.34, .17, clamp(uFat - 1., 0., 1.)) + .05 * sin(p.x * 31. + vU.w * 9.), p.y);          // lit from below by the iron it stands over
  low *= 1. - .8 * clamp(uFat - 1., 0., 1.);                                               // a tall far plume is white over blue: the fire is a long way under it
  // ROUND NINE: the palette's own colours only, never a blend of them (snow into straw gave a cream, blue into orange a dusty pink): the plume is
  // white over the snow's blue, and only the very foot of a plume standing on hot work is orange, cut hard
  vec3 c = low > .7 ? uOrange : (lit > 0. ? uSnow : uBlue);
  gl_FragColor = vec4(c, 1.);
}`;
// hot iron that is not a winding scroll. Its bars carry arc length; uHot = (the run's front, order at arc 0, order per metre,
// hot length). Hot length > 0: a RUN of fire along bar already standing (a railing, a standard, a pier): only the hot stretch is
// drawn, straw at the front cooling through orange and cherry behind it. Hot length <= 0: a still piece just off the anvil (an
// offcut, a bar across the anvil, the end plunged in the trough): hot from its arc 0 over that many metres, the rest cold iron.
const HOT_FRAG = /* glsl */`
varying vec3 vN, vW, vO; varying vec3 vA; varying float vF;
uniform vec4 uHot;
${COMMON_GLSL}
void main(){
  vec3 n = vN / max(length(vN), 1e-4);
  vec3 V = cameraPosition - vW; V /= max(length(V), 1e-4);
  float h;
  if (uHot.w <= 0.) h = (1. - vA.x / max(-uHot.w, .05)) * (.84 + .16 * sin(uTime * 1.1 + vW.x * .7 + vW.z * .9));
  else { float b = uHot.x - (uHot.y + vA.x * uHot.z), x = b < 0. ? 1. + b / (.06 * uHot.w) : 1. - b / uHot.w; if (x < .03) discard;
    h = b < 0. ? x : x * sqrt(max(x, 0.));                            // a front: straw at its head, orange a third of the way back, a long cherry tail going to black
    h *= .93 + .07 * sin(uTime * 1.7 + vA.x * 1.1); }                 // the hot stretch shimmers slowly as it cools
  gl_FragColor = vec4(heatCol(toPearl(ironCol(n, V, vO, vA.x, vA.y, vA.z), vF), clamp(h, 0., 1.)), 1.);
}`;
// falling snow clumps. per instance aPos (release point, local), aCl (release second, size m, seed, rho). With rho != 0 the
// release point rides a gate leaf: aPos is the hinge and the point is rho along the rail at the leaf's angle at that second.
const CLUMP_VERT = /* glsl */`
attribute vec3 aPos; attribute vec4 aCl; attribute float aSp;
uniform float uClock, uOpenA, uOpenT, uFall, uFloor, uStretch, uStreak, uLead, uBurst, uMinPx, uFollow, uFront, uPuffSel; varying vec3 vP; varying float vD, vK;
${COMMON_GLSL}
void main(){
  // uLead: the curtain's clock runs that many seconds ahead of the swing (the snow starts to go as the crown closes on the ring)
  // ROUND NINE, uFollow (the Gates' veils): the snow hangs from its rail, so the veil rides the leaf as it swings (half a second behind
  // it, in its wake) and stands uFront metres clear of the bars on the side the lens comes from: one veil per leaf, nothing in the gap
  float f = uClock - aCl.x, x0 = clamp((mix(aCl.x, uClock - .5, uFollow) - uLead) / max(uOpenT, 1e-3), 0., 1.), ang = uOpenA * x0 * x0 * (3. - 2. * x0);
  float sgn = sign(aCl.w);
  vec3 p = aPos + vec3(aCl.w * cos(ang), 0., -abs(aCl.w) * sin(ang)) + vec3(sgn * sin(ang), 0., abs(sgn) * cos(ang)) * uFront;
  float ff = max(f, 0.), vt = uFall * aSp, drop = vt * (ff - (1. - exp(-ff * .7)) / .7);          // aSp: a heavy lump falls faster than the powder torn off it
  // uBurst (the Gates' curtains): a clump that reaches the snow does not fade on the way down, it lands and bursts into a fat
  // puff of powder that swells, lifts a little and is gone; small ones just go out
  float h0 = max(aPos.y - uFloor - .5, .1), over = max(drop - h0, 0.) * uBurst, tl = over / max(vt, .1);
  // uPuffSel: only one landing in six swells into a fat puff (and those swell further): a few big puffs at the foot of the leaf, not a bank
  float big = mix(smoothstep(.9, 2.2, aCl.y), step(.83, fract(aCl.z * 91.7)) * step(.95, aCl.y), uPuffSel);
  drop = mix(drop, min(drop, h0), uBurst);
  p.y -= drop - over * .06 * big; p.x += sin(aCl.z * 50. + ff * 1.1) * .5 * min(ff, 2.); p.z += cos(aCl.z * 31. + ff * .9) * .5 * min(ff, 2.);
  float puff = (1. + (1.7 + 1.5 * uPuffSel) * big * smoothstep(0., .5, tl)) * (1. - smoothstep(.3 + 1.5 * big, .7 + 2.3 * big, tl));
  float alive = step(0., f) * smoothstep(0., .3, ff) * mix(smoothstep(uFloor, uFloor + 3., p.y), puff, uBurst);
  vec4 mv = viewMatrix * modelMatrix * vec4(p, 1.);
  float mPerPx = 2. * max(-mv.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
  float sz = max(aCl.y, uMinPx * mPerPx) * alive;
  // a clump is a piece of cap: a rounded white dome with a blue scalloped underside, a card turned to the lens, tumbling a little
  float tl2 = ((fract(aCl.z * 13.7) - .5) * 1.1 + sin(ff * 1.3 + aCl.z * 20.) * .25) / (1. + 4. * uStreak), ct = cos(tl2), sn = sin(tl2);
  vec2 q = position.xy * 2. * vec2(1.05 + .12 * uStretch, (.8 + .25 * uStretch * smoothstep(0., 2.5, ff)) * (1. + uStreak * smoothstep(.2, 1.6, ff) * (.5 + fract(aCl.z * 7.3))));   // uStreak: falling strokes; uStretch: a long fall draws taller lumps
  mv.xy += vec2(ct * q.x - sn * q.y, sn * q.x + ct * q.y) * sz;
  vP = vec3(position.xy * 2., aCl.z); vD = length(mv.xyz); vK = step(1e-4, over);
  gl_Position = projectionMatrix * mv;
}`;
const CLUMP_FRAG = /* glsl */`
varying vec3 vP; varying float vD, vK;
${COMMON_GLSL}
void main(){
  float x = vP.x, y = vP.y, yt = max(y, 0.), ph = vP.z * 40.;
  if (vK > .5) {                                                               // landed: a puff of powder, drawn like the steam: white over blue, cut hard
    float r = length(vP.xy) * (1. + .07 * sin(atan(y, abs(x) + 1e-4) * 5. + ph));
    if (r > .94) discard;
    float lit = .66 - length(vP.xy - vec2(-.1, .2));
    gl_FragColor = vec4(toPearl(mix(uBlue, uSnow, step(0., lit)), vD), 1.); return;
  }
  float under = -(.34 + .16 * cos(x * 7. + ph)) * (1. - .55 * x * x);         // the scalloped hem it tore off with
  if (x * x + yt * yt * 1.15 > .92 || y < under) discard;
  float blue = step(y, under + .36 + .1 * sin(x * 4. + ph * 1.7));   // a broad blue underside: it is what shows the piece on white snow and against the leaves
  gl_FragColor = vec4(toPearl(mix(uSnow, uBlue, blue), vD), 1.);
}`;

// flakes: quads in a box that wraps round whichever camera is drawing; white within 30 m, blue-grey beyond; 1.5 m/s with a slow sway
const FLAKE_VERT = /* glsl */`
attribute vec3 aSeed; uniform float uBox; varying vec2 vUv; varying float vNear;
${COMMON_GLSL}
void main(){
  vec3 b = aSeed * uBox; b.y -= uTime * (1.2 + .6 * fract(aSeed.x * 7.3)); b.x += sin(uTime * .45 + aSeed.z * 40.) * 1.3; b.z += cos(uTime * .37 + aSeed.x * 40.) * 1.3;
  vec3 p = mod(b - cameraPosition, uBox) - .5 * uBox + cameraPosition;
  vec4 mv = viewMatrix * vec4(p, 1.);
  float d = length(mv.xyz), mPerPx = 2. * max(-mv.z, .05) / max(uPx.x * projectionMatrix[1][1], 1.);
  // snowfall, not snowballs: a flake is 14-28 cm across (the garden is three times life size), never under 2 px and never over 1.4% of the frame's height
  float size = clamp(.07 + .07 * fract(aSeed.y * 5.1), 1. * mPerPx, .007 * uPx.x * mPerPx) * (1. - smoothstep(.38 * uBox, .5 * uBox, d)) * smoothstep(.8, 2.5, d);
  mv.xy += position.xy * size * 2.; vUv = position.xy * 2.; vNear = 1. - smoothstep(26., 34., d);
  gl_Position = projectionMatrix * mv;
}`;
const FLAKE_FRAG = /* glsl */`
varying vec2 vUv; varying float vNear;
${COMMON_GLSL}
void main(){ if (dot(vUv, vUv) > 1.) discard; gl_FragColor = vec4(mix(uBlue, uSnow, vNear), 1.); }`;

// ---- makeStyle: one per world ---------------------------------------------------------------------------------------------
// opts: palette (the brief's seven hexes), fog (380), near (0: metres round the lens that keep full black), minPx (2), pearl (hex: another hour's sky).
// scrollMesh(list, mat, lite) takes a lighter template for small work; spillMaterial / spillMesh lay the orange disc on the snow;
// Batch.shed = 1 + order marks caps that let go as a snow material's uShed passes order (0 never, 1 = order 0).
// hotMaterial({ at, rate, len }) is hot iron that is not a scroll: a run of fire along standing bar (len > 0: uniforms.uHot.x is
// the run's front; a bar is hot where at + arc * rate lies within len behind it) or a still piece hot from its arc 0 (len <= 0).
// returns { pal, uniforms, iron, snow, hotMaterial(o), scrollMaterial(o), haloMaterial(scrollMat), steamMaterial(scrollMat), clumpMaterial(o),
//   scrollMesh(list, mat), haloMesh(scrollMesh, mat), steamMesh(list, mat), clumpMesh(list, mat), Batch, bar, cap, collar,
//   scrollSpec, scrollPts, scrollAt, mesh(batch, material), flakes(n, box), update(dt, time, camera) }. Call update every frame.
//   pal has iron, sheen, snow, snowBlue, pearl, orange, straw (the brief's seven) + cherry, scale, veil (#DDE2E6, the far snowfall).
//   uniforms.uShiver 0..1 lets every cap in the garden go (the rare event); snowMaterial() gives a material with its own uShed
//   for caps marked Batch.shed = 1. scene.background = pal.pearl; nothing is lit, fogged by the engine or tone mapped.
export function makeStyle(ctx, opts = {}) {
  const hex = opts.palette || PALETTE, col = (h) => new THREE.Color(h);
  const pal = { iron: col(hex[0]), sheen: col(hex[1]), snow: col(hex[2]), snowBlue: col(hex[3]), pearl: col(opts.pearl || hex[4]), orange: col(hex[5]), straw: col(hex[6]),
    cherry: col('#A8281E'), scale: col('#24262A'), veil: col('#DDE2E6') };
  const U = { uIron: { value: pal.iron }, uSheen: { value: pal.sheen }, uScale: { value: pal.scale }, uSnow: { value: pal.snow }, uBlue: { value: pal.snowBlue },
    uPearl: { value: pal.pearl }, uOrange: { value: pal.orange }, uStraw: { value: pal.straw }, uCherry: { value: pal.cherry },
    uFog: { value: opts.fog ?? 380 }, uNear: { value: opts.near ?? 0 }, uTime: { value: 0 }, uEdge: { value: new THREE.Vector3(opts.edge?.[0] ?? 0.8, opts.edge?.[1] ?? 0.92, opts.edge?.[2] ?? 0.32) }, uPx: { value: new THREE.Vector2(720, opts.minPx ?? 2) }, uShiver: { value: 0 },
    uCap: { value: new THREE.Vector2(opts.cap?.[0] ?? 1, opts.cap?.[1] ?? 1) } };
  const iron = new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: IRON_VERT, fragmentShader: IRON_FRAG });
  const ironFacet = new THREE.ShaderMaterial({ uniforms: { ...U }, defines: { FACET: 1 }, vertexShader: IRON_VERT, fragmentShader: IRON_FRAG });   // for beaten leaves
  const snowMaterial = () => new THREE.ShaderMaterial({ uniforms: { ...U, uShed: { value: 0 } }, vertexShader: SNOW_VERT, fragmentShader: SNOW_FRAG, side: THREE.DoubleSide });
  const snow = snowMaterial();
  // one scroll material per run: its uniforms.uRun is that run's front (in the same units as the instances' order), uHeat the hot length in m
  const scrollMaterial = (o = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, uRun: { value: o.run ?? 0 }, uHeat: { value: o.heat ?? 2 }, uHeatMin: { value: o.heatMin ?? 0.35 }, uHalo: { value: o.halo ?? 3 },
      uEmber: { value: new THREE.Vector2(o.ember ?? 0, o.cool ?? 1) }, uHaloPx: { value: new THREE.Vector2(o.haloMin ?? 3.5, o.haloMax ?? 0.03) } },
    vertexShader: SCROLL_VERT, fragmentShader: SCROLL_FRAG, side: THREE.DoubleSide });
  const haloMaterial = (sm) => new THREE.ShaderMaterial({ uniforms: { ...U, uRun: sm.uniforms.uRun, uHeat: sm.uniforms.uHeat, uHalo: sm.uniforms.uHalo, uHaloPx: sm.uniforms.uHaloPx },
    vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, depthWrite: false });
  const spillMaterial = (sm, width = 4) => new THREE.ShaderMaterial({ uniforms: { ...U, uRun: sm.uniforms.uRun, uHeat: sm.uniforms.uHeat, uSpill: { value: width }, uLinger: { value: sm.uniforms.uEmber.value.y } },
    vertexShader: SPILL_VERT, fragmentShader: SPILL_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide });
  const hotMaterial = (o = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, uHot: { value: new THREE.Vector4(0, o.at ?? 0, o.rate ?? 1, o.len ?? -1.6) } }, vertexShader: IRON_VERT, fragmentShader: HOT_FRAG });
  const steamMaterial = (sm, fat = 1) => new THREE.ShaderMaterial({ uniforms: { ...U, uRun: sm ? sm.uniforms.uRun : { value: 0 }, uFat: { value: fat }, uBack: { value: 0 } },
    vertexShader: STEAM_VERT, fragmentShader: STEAM_FRAG, side: THREE.DoubleSide });
  const clumpMaterial = (o = {}) => new THREE.ShaderMaterial({ uniforms: { ...U, uClock: { value: -1 }, uOpenA: { value: o.openA ?? 0 }, uOpenT: { value: o.openT ?? 8 },
    uFall: { value: o.fall ?? 15 }, uFloor: { value: o.floor ?? 0 }, uStretch: { value: o.stretch ?? 3.6 }, uStreak: { value: o.streak ?? 0 },
    uLead: { value: o.lead ?? 0 }, uBurst: { value: o.burst ?? 0 }, uMinPx: { value: o.minPx ?? 1.5 }, uFollow: { value: o.follow ?? 0 }, uFront: { value: o.front ?? 0 }, uPuffSel: { value: o.puffSel ?? 0 } }, vertexShader: CLUMP_VERT, fragmentShader: CLUMP_FRAG });
  // the straight bar every forged scroll is an instance of: x 0 (root) .. 1 (tip), unit hexagonal section
  const tpl = new Batch(); { const pts = []; for (let i = 0; i <= 30; i++) pts.push(new V3(i / 30, 0, 0)); bar(tpl, pts, { r: 1, sides: 6, capA: false });
    for (const x of [-0.3, -0.22, -0.14]) bar(tpl, [new V3(x, 0, 0), new V3(x + 0.045, 0, 0)], { r: 1.7, sides: 6, rot: x * 9 }); }
  const tpl2 = new Batch(); { const pts = []; for (let i = 0; i <= 14; i++) pts.push(new V3(i / 14, 0, 0)); bar(tpl2, pts, { r: 1, sides: 6, capA: false });
    for (const x of [-0.3, -0.18]) bar(tpl2, [new V3(x, 0, 0), new V3(x + 0.045, 0, 0)], { r: 1.7, sides: 4, rot: x * 9 }); }
  const scrollGeoLite = tpl2.geometry();
  const scrollGeo = tpl.geometry(), cardGeo = new THREE.PlaneGeometry(1, 1), steamGeo = new THREE.PlaneGeometry(1, 1, 1, 5).translate(0, 0.5, 0);
  const clumpGeo = cardGeo;
  const inst = (geo, n, attrs) => { const g = new THREE.InstancedBufferGeometry(); g.index = geo.index; for (const k of ['position', 'normal', 'uv']) if (geo.attributes[k]) g.setAttribute(k, geo.attributes[k]);
    for (const [k, size] of attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(new Float32Array(n * size), size)); g.instanceCount = n; return g; };
  // list items: { m: Matrix4 (scroll frame -> local), S: scrollSpec, order, dur, seed }
  const scrollMesh = (list, mat, lite = false) => {
    const g = inst(lite ? scrollGeoLite : scrollGeo, list.length, [['aSc', 4], ['aSd', 4], ['aSe', 2]]), mesh = new THREE.InstancedMesh(g, mat, list.length);
    list.forEach((s, i) => { mesh.setMatrixAt(i, s.m); g.attributes.aSc.setXYZW(i, s.S.L, s.S.Lw, s.S.b, s.S.s0); g.attributes.aSd.setXYZW(i, s.S.k, s.S.hand, s.S.R, s.order); g.attributes.aSe.setXY(i, s.dur, s.seed ?? 0); });
    mesh.frustumCulled = false; return mesh;
  };
  const haloMesh = (sm, mat) => { const g = new THREE.InstancedBufferGeometry(); g.index = cardGeo.index; g.setAttribute('position', cardGeo.attributes.position);
    for (const k of ['aSc', 'aSd', 'aSe']) g.setAttribute(k, sm.geometry.attributes[k]); g.instanceCount = sm.count;
    const mesh = new THREE.InstancedMesh(g, mat, sm.count); mesh.instanceMatrix = sm.instanceMatrix; mesh.frustumCulled = false; mesh.renderOrder = 5; return mesh; };
  const spillMesh = (sm, mat) => { const m = haloMesh(sm, mat); m.renderOrder = 1; return m; };
  // list items: { p: Vector3, order, dur, seed, h }
  const steamMesh = (list, mat) => { const g = inst(steamGeo, list.length, [['aPos', 3], ['aSt', 4]]);
    list.forEach((s, i) => { g.attributes.aPos.setXYZ(i, s.p.x, s.p.y, s.p.z); g.attributes.aSt.setXYZW(i, s.order, s.dur, s.seed ?? 0, s.h); });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4; return mesh; };
  // list items: { p: Vector3, t, size, seed, rho }
  const clumpMesh = (list, mat) => { const g = inst(clumpGeo, list.length, [['aPos', 3], ['aCl', 4], ['aSp', 1]]);
    list.forEach((s, i) => { g.attributes.aPos.setXYZ(i, s.p.x, s.p.y, s.p.z); g.attributes.aCl.setXYZW(i, s.t, s.size, s.seed ?? 0, s.rho ?? 0); g.attributes.aSp.setX(i, s.sp ?? 1); });
    const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; return mesh; };
  const flakes = (n = 6000, box = 120) => { const g = inst(cardGeo, n, [['aSeed', 3]]), a = g.attributes.aSeed.array, r = ctx.rng.fork('flakes'); for (let i = 0; i < a.length; i++) a[i] = r();
    const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...U, uBox: { value: box } }, vertexShader: FLAKE_VERT, fragmentShader: FLAKE_FRAG })); m.frustumCulled = false; return m; };
  const mesh = (batch, material) => { const m = new THREE.Mesh(batch.geometry(), material); m.frustumCulled = false; return m; };
  const _sz = new THREE.Vector2();
  return { pal, uniforms: U, iron, ironFacet, snow, snowMaterial, hotMaterial, scrollMaterial, haloMaterial, spillMaterial, spillMesh, steamMaterial, clumpMaterial, scrollMesh, haloMesh, steamMesh, clumpMesh, mesh, flakes,
    Batch, bar, cap, collar, scrollSpec, scrollPts, scrollAt, scrollTaper,
    update(dt, time, camera) { U.uTime.value = time; if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(_sz); U.uPx.value.x = _sz.y; } } };
}

// ---- THE GREAT GATES ------------------------------------------------------------------------------------------------------
const P3 = (x, y, z) => new V3(x, y, z);
const line = (a, b, n = 1) => { const o = []; for (let i = 0; i <= n; i++) o.push(a.clone().lerp(b, i / n)); return o; };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, style = opts.style || makeStyle(ctx, { palette: opts.palette });
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const tilt = THREE.MathUtils.degToRad(opts.tilt ?? 33), RING_Y = opts.ringY ?? 104, OPEN = THREE.MathUtils.degToRad(opts.openAngle ?? 80);
  const W = 45, PIER_X = 49, TOP = 90;                       // leaf width, pier centre, top of the leaves' top rail
  const root = new THREE.Group(); root.name = 'great-gates';
  const lap = async () => { await ctx.yield(); };
  await lap(0);
  const kind = opts.overthrow || rng.pick(['C', 'C', 'S', 'lyre']);         // seeded cast of the crown
  const twistHand = rng.sign(), tight = rng.range(0.185, 0.235);
  const X = P3(1, 0, 0), Y = P3(0, 1, 0), Z = P3(0, 0, 1);

  // --- static work: piers, their finials, the ring -------------------------------------------------------------------------
  const iron = new Batch(), snow = new Batch();
  for (const sg of [-1, 1]) {
    const x = sg * PIER_X, th = twistHand * sg;
    bar(iron, line(P3(x, 0, 0), P3(x, 6.2, 0), 1), { r: 3.75, sides: 4, capA: false });                                     // plinth
    bar(iron, line(P3(x, 6, 0), P3(x, 92.2, 0), 120), { r: 3, sides: 8, star: 0.6, twist: th * Math.PI * 2 * 5.5, capA: false, capB: false });   // the barley twist
    collar(iron, P3(x, 8.2, 0), Y, 3.2, { band: 0.8, seg: 10, rng }); collar(iron, P3(x, 90, 0), Y, 3.2, { band: 0.8, seg: 10, rng });
    bar(iron, line(P3(x, 92, 0), P3(x, 100, 0), 1), { r: 3.55, sides: 4 });                                                   // cap block
    bar(iron, line(P3(x, 100, 0), P3(x, 114 + rng.range(-1, 1.5), 0), 8), { r: (t) => 1.5 * (1 - t) ** 0.8, sides: 4, taper: true, rot: rng.range(0, 1.5), capA: false });   // finial spike
    collar(iron, P3(x, 101.4, 0), Y, 1.45, { band: 0.42, rng });
    cap(snow, [P3(x - 3.5, 96.45, 0), P3(x + 3.5, 96.45, 0)], { r: 3.55, wide: 1.06, high: 0.3, seed: rng() });               // the mound on the block
    cap(snow, [P3(x - 3.7, 2.5, 0), P3(x + 3.7, 2.5, 0)], { r: 3.75, wide: 1.05, high: 0.12, seed: rng() });                  // the plinth's ledge
    // four old C-scrolls round the finial: the capped stumps the crown will grow from
    for (let q = 0; q < 4; q++) {
      const a = q * Math.PI / 2 + Math.PI / 4, d = P3(Math.cos(a), 0, Math.sin(a)), S = scrollSpec(rng.range(4.2, 5.4), 0.42, tight + rng.range(-0.02, 0.02), rng.range(3.5, 5), -0.05, 1);
      const sp = scrollPts(P3(x + d.x * 1.3, 100.2, d.z * 1.3), Y, d.clone().negate(), S, 30);
      sp.pts.forEach((p) => { p.x = x + (p.x - x) * -1; p.z *= -1; });                                                       // curl outward, away from the spike
      bar(iron, sp.pts, { r: sp.r, sides: 6, taper: true, capA: false }); cap(snow, sp.pts, { r: sp.r, seed: rng(), maxSlope: 0.7 });
    }
    await lap(2);
  }
  // the ring: 2 m round bar about a 14 m opening, leaning to meet the climb; ex, eu, en are its frame
  const RC = P3(0, RING_Y, 0), eu = P3(0, Math.cos(tilt), Math.sin(tilt)), en = P3(0, Math.sin(tilt), -Math.cos(tilt));
  const ringPt = (a, r = 8) => P3(Math.sin(a) * r, 0, 0).addScaledVector(eu, -Math.cos(a) * r).add(RC);                      // a = 0 at the foot, pi at the head
  { const pts = []; for (let i = 0; i <= 64; i++) pts.push(ringPt((i / 64) * Math.PI * 2));
    const wob = [rng.range(0.94, 1.06), rng.range(0, 6.28)];
    bar(iron, pts, { r: (t) => 1 * (1 + 0.04 * Math.sin(t * 12.56 + wob[1])) * wob[0], sides: 8, up: en, capA: false, capB: false });
    const top = []; for (let i = 0; i <= 28; i++) top.push(ringPt(Math.PI * (0.56 + 0.88 * i / 28)));
    cap(snow, top, { r: 1, seed: rng(), maxSlope: 0.97, high: 0.55 });
    for (const a of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) { const p = ringPt(a), tan = ringPt(a + 0.01).sub(p).normalize(); collar(iron, p, tan, 1.05, { band: 0.36, turns: 3, seg: 8, rng }); }
  }
  await lap(3);
  const ironMesh = style.mesh(iron, style.iron); await lap(31); const snowMesh = style.mesh(snow, style.snow); await lap(32); root.add(ironMesh, snowMesh);

  // --- the two leaves: rigid groups hinged at x = -45 and +45; built in leaf space (hinge at x 0, free edge at x 45) -------------
  const leafSnowMat = style.snowMaterial(), leaves = [];
  const x0 = 1.6, x1 = W - 1.55, RB = 3.2, R1 = 27, R2 = 33.5, R3 = 75.5, RT = TOP - 1.25, NU = 16, sp = (x1 - x0) / (NU + 1);
  for (const sg of [-1, 1]) {
    const I = new Batch(), S = new Batch();
    for (const x of [x0, x1]) {                                                                // stiles, each ending in a spike
      bar(I, line(P3(x, 0.9, 0), P3(x, TOP + 1.5, 0)), { r: 1.25 });
      bar(I, line(P3(x, TOP + 1.5, 0), P3(x, TOP + rng.range(8.5, 10.5), 0), 6), { r: (t) => 1.1 * (1 - t) ** 0.85, taper: true, rot: rng.range(0.6, 1), capA: false });
      collar(I, P3(x, TOP + 2.3, 0), Y, 1.3, { band: 0.38, rng });
    }
    await lap(10);
    for (const y of [22, 58, 84]) collar(I, P3(x0, y + rng.range(-1, 1), 0), Y, 1.85, { band: 0.6, seg: 8, rng });      // the hinge bands
    for (const [y, r] of [[RB, 1.25], [R1, 0.9], [R2, 0.9], [R3, 0.9], [RT, 1.25]]) {             // rails and their snow
      bar(I, line(P3(x0, y, 0), P3(x1, y, 0)), { r });
      S.shed = y === RT ? 1 : 0;
      cap(S, y === RT ? [P3(x0 - 1.25, y, 0), P3(x1 + 1.25, y, 0)] : [P3(x0 + 1.25, y, 0), P3(x1 - 1.25, y, 0)], { r, seed: rng(), pinch: y === RT });
    }
    S.shed = 0;
    await lap(9);
    const twisted = rng.pick([(i) => i % 2 === 1, (i) => i % 3 === 1, (i) => (i >> 1) % 2 === 0]);
    for (let i = 0; i < NU; i++) {                                                             // sixteen uprights, their spikes above the top rail
      const x = x0 + (i + 1) * sp, wob = rng.range(-0.12, 0.12);
      bar(I, line(P3(x, RB, 0), P3(x + wob * 0.3, R1, 0)), { r: 0.5, capA: false, capB: false });
      if (twisted(i)) bar(I, line(P3(x + wob * 0.3, R2, 0), P3(x, R3, 0), 34), { r: 0.5, sides: 8, star: 0.6, twist: rng.sign() * Math.PI * 2 * rng.range(7.5, 9.5), capA: false, capB: false });
      else bar(I, line(P3(x + wob * 0.3, R2, 0), P3(x, R3, 0)), { r: 0.5, rot: Math.PI / 4 + rng.range(-0.08, 0.08), capA: false, capB: false });
      bar(I, line(P3(x, RT, 0), P3(x + wob, TOP + rng.range(4.6, 5.6), 0), 5), { r: (t) => 0.55 * (1 - t) ** 0.8, taper: true, rot: rng.range(0.5, 1.1), capA: false });
      for (const y of [RB + 1.9, R1 - 1.5, R2 + 1.5, R3 - 1.5, TOP + 0.75]) collar(I, P3(x, y, 0), Y, 0.62, { band: 0.2, seg: 5, rng });
      await lap(4);
    }
    for (let i = 0; i <= NU; i++) {                                                            // dog bars between them
      const x = x0 + (i + 0.5) * sp, h = 13 + 5 * Math.sin(i / NU * Math.PI) + rng.range(-0.6, 0.6);
      bar(I, line(P3(x, RB, 0), P3(x, h, 0), 4), { r: (t) => 0.34 * (t < 0.6 ? 1 : (1 - (t - 0.6) / 0.4) ** 0.8), light: true, taper: true, capA: false });
    }
    const NR = 8, rsp = (x1 - x0 - 2.5) / NR;                                                  // the ring band
    await lap(51); for (let i = 0; i < NR; i++) { if (i % 4 === 3) await lap(52);
      const c = P3(x0 + 1.25 + (i + 0.5) * rsp, (R1 + R2) / 2, 0), rr = 1.98 * rng.range(0.96, 1.03), ph = rng() * 6.28, el = rng.range(0.95, 1.05), pts = [];
      for (let k = 0; k <= 20; k++) { const a = ph + (k / 20) * Math.PI * 2; pts.push(P3(c.x + Math.cos(a) * rr * el, c.y + Math.sin(a) * rr / el, 0)); }
      bar(I, pts, { r: 0.36, sides: 6, capA: false, capB: false });
      const top = []; for (let k = 0; k <= 8; k++) { const a = Math.PI * (0.14 + 0.72 * k / 8); top.push(P3(c.x + Math.cos(a) * rr * el, c.y + Math.sin(a) * rr / el, 0)); }
      cap(S, top, { r: 0.36, seed: rng(), maxSlope: 0.95 });
      if (i) collar(I, P3(c.x - rsp / 2, c.y, 0), Y, 0.75, { band: 0.2, seg: 6, rng });
    }
    await lap(5);
    const NS = 4, ssp = (x1 - x0 - 2.5) / NS;                                                  // the band of S-scrolls under the top rail
    for (let i = 0; i < NS; i++) { if (i % 3 === 2) await lap(53);
      const c = P3(x0 + 1.25 + (i + 0.5) * ssp, (R3 + RT) / 2 - 0.2, rng.range(-0.1, 0.1)), fl = i & 1 ? -1 : 1, ph = THREE.MathUtils.degToRad(40 + rng.range(-4, 4));
      for (const h of [1, -1]) {
        const d = P3(Math.cos(ph) * h, Math.sin(ph) * h * fl, 0), sd = P3(-d.y, d.x, 0).multiplyScalar(fl);
        const Sp = scrollSpec(rng.range(4.7, 5.2), 0.42, tight + rng.range(-0.025, 0.025), 1.5, -0.12, 1), s = scrollPts(c, d, sd, Sp, 36);
        bar(I, s.pts, { r: s.r, sides: 6, taper: true, capA: false }); cap(S, s.pts, { r: s.r, seed: rng(), maxSlope: 0.75 });
      }
      collar(I, c, P3(Math.cos(ph), Math.sin(ph) * fl, 0), 0.6, { band: 0.22, seg: 6, rng });
    }
    const g = new THREE.Group(); g.position.set(sg * W, 0, 0);
    await lap(61); g.add(style.mesh(I, style.iron)); await lap(62); g.add(style.mesh(S, leafSnowMat)); root.add(g); leaves.push({ g, sg, tris: I.triangles + S.triangles });
    await lap(6);
  }

  // --- the overthrow: every member is a forged (instanced) scroll, ordered along its run from each pier inward -------------------
  const scrolls = [], steam = [], LY = 98.5, CROWN_END = 12.2, RING0 = 14;
  const frame = (p, dir, side, lean = 0) => { const z = new V3().crossVectors(dir, side).normalize(), s2 = side.clone().applyAxisAngle(dir, lean), z2 = z.applyAxisAngle(dir, lean);
    return new THREE.Matrix4().makeBasis(dir, s2, z2).setPosition(p); };
  const addScroll = (p, dir, side, S, order, dur, plume) => {
    scrolls.push({ m: frame(p, dir, side, rng.range(-0.09, 0.09)), S, order, dur, seed: rng() });
    if (plume) steam.push({ p: p.clone().addScaledVector(dir, (S.L - S.Lw) + plume * 0.3), order: order + dur * 0.2, dur: dur * 0.9, seed: rng(), h: rng.range(15, 24) });
  };
  const branchK = kind === 'S' ? 0.07 : -0.08;
  // LACE: every scroll stands in the one plane of the crown, in a cell of its own. Six stalks a side, 6 m apart, taller toward the
  // ring; at each level (6 m apart) every stalk throws ONE scroll about 4.6 m across from a collar, all of a level to the same
  // side and alternate levels to the other, so no two eyes overlap and there is sky as wide as a bar between neighbours.
  for (const sg of [-1, 1]) {
    const inw = P3(-sg, 0, 0);
    for (let k = 0; k < 6; k++) { if (k % 2 === 1) await lap(71);
      const base = k === 0 ? -100 : (k - 1) * 1.7, xb = 45.6 - k * 6, zl = rng.range(-0.1, 0.1);
      // the lintel: a running band, each length ending in a curl that stands on it
      // ROUND ELEVEN: the lintel is a plain running bar. Alternate lengths end in one small curl standing midway between two stalks, the others in
      // a mere hook, so that along each wing there is a row of clear openings between the stalks' feet (it was one black strip: every bay held a 4 m curl)
      { const lw = rng.range(4.2, 4.9), odd = k % 2 === 1;
        addScroll(P3(sg * xb, LY, zl), inw, Y, scrollSpec(odd ? 1.5 : 2.5 + (lw - 4.2) * 0.6, 0.5, tight + rng.range(-0.02, 0.02), odd ? 6.1 : 5.7, 0, -1), base, 3, 0); }
      // a stalk on each length, taller toward the ring, its head curling inward
      const H = lerp(9, 33, Math.pow(k / 5, 1.15)) + rng.range(-0.8, 0.8), sx = sg * (xb - 3 + rng.range(-0.2, 0.2)), across = rng.range(4.4, 5.2);
      const stalk = scrollSpec(across, 0.6, tight + rng.range(-0.02, 0.02), H - across * 0.5, kind === 'lyre' ? 0.012 : 0, 1);
      addScroll(P3(sx, LY + 0.8, zl), Y, P3(sg, 0, 0), stalk, base + 0.6, 3, 0);
      if (k === 2 || k === 4) steam.push({ p: P3(sx, LY + 1 + H, zl), order: 4.4 + k * 0.3 + rng.range(0, 0.4), dur: 8, seed: rng(), h: rng.range(30, 36) * (opts.plume ?? 1) });   // four plumes stand over the crown
      for (let l = 0, yo = 3.2; yo < H - 5.6; l++, yo += 5.7) {
        const h = sg * (l % 2 ? -1 : 1);                                    // even levels lean outward, odd levels inward
        if (k === 5 && h === -sg) continue;                                 // the innermost stalk keeps clear of the ring
        const a = THREE.MathUtils.degToRad(rng.range(50, 60)), d = P3(h * Math.sin(a), Math.cos(a), 0), sd = P3(-d.y, d.x, 0);
        const S = scrollSpec(rng.range(4.9, 5.4), 0.52, tight + rng.range(-0.03, 0.03), rng.range(0.8, 1.2), branchK * rng.range(0.7, 1.3), h);
        addScroll(P3(sx + h * 0.5, LY + 0.8 + 5.3 + (yo - 3.2) * 0.82 + rng.range(-0.3, 0.3), zl), d, sd, S,   /* ROUND NINE: the first level springs clear above the lintel's curls: a row of sky along the lintel */ base + 1.2 + l * 0.55 + rng.range(0, 0.15), 2.6, 0);
      }
    }
  }
  // ROUND ELEVEN: steam stands BEHIND each wing as a row of fat plumes rooted along the lintel, one behind every stalk and one between (taller toward
  // the ring, as the stalks are), from the moment the run reaches that stalk until the ring has closed. At dusk and at night the lace is cut out
  // black against white-over-blue steam instead of sinking into the sky. No dice are thrown for them (the garden built after the Gates keeps its shapes).
  for (const sg of [-1, 1]) for (let k = 0; k < 6; k++) { const xb = 45.6 - k * 6, Hk = lerp(9, 33, Math.pow(k / 5, 1.15)), o0 = (k === 0 ? 0 : (k - 1) * 1.7) + 0.9, fr = (v) => v - Math.floor(v);
    steam.push({ p: P3(sg * (xb - 3), LY + 0.6, -1.6), order: o0, dur: 18.8 - o0, seed: fr(k * 0.371 + (sg > 0 ? 0.13 : 0.57)), h: (Hk + 8) / 0.78 + 4 * fr(k * 0.61 + 0.2) });
    steam.push({ p: P3(sg * (xb - 6.2), LY + 0.4, -2.4), order: o0 + 0.5, dur: 18.8 - o0 - 0.5, seed: fr(k * 0.713 + (sg > 0 ? 0.41 : 0.87)), h: (Hk + 3) / 0.9 + 5 * fr(k * 0.37 + 0.6) }); }
  // the four last scrolls, 30 m long, that curl shut round the ring: rooted at its side collars, in the ring's leaning plane
  for (const sg of [-1, 1]) for (const ud of [1, -1]) {
    const S = { L: 30, Lw: ud > 0 ? 16.5 : 18, b: tight + 0.01, s0: 1.15 * 0.85 / (tight / Math.sqrt(1 + tight * tight)), k: 1 / 10.8, hand: 1, R: 0.85 };
    const dir = eu.clone().multiplyScalar(ud), side = P3(-sg, 0, 0);
    scrolls.push({ m: new THREE.Matrix4().makeBasis(dir, side, new V3().crossVectors(dir, side)).setPosition(RC.clone().addScaledVector(X, sg * 10.8).addScaledVector(dir, 0.6)),
      S, order: RING0 + (ud > 0 ? 0 : 0.35) + rng.range(0, 0.2), dur: 3, seed: rng() });
  }
  await lap(7);
  const scrollMat = style.scrollMaterial({ heat: opts.heat ?? 3.5, halo: opts.halo ?? 3.4, ember: opts.ember ?? 0, cool: opts.cool ?? 10, haloMin: opts.haloMin ?? 4, haloMax: opts.haloMax ?? 0.03 });
  scrollMat.uniforms.uUnder = { value: 1 };
  const scrollMesh = style.scrollMesh(scrolls, scrollMat), haloMesh = style.haloMesh(scrollMesh, style.haloMaterial(scrollMat)); await lap(72);
  const steamMat = style.steamMaterial(scrollMat, opts.plumeFat ?? 1.4); steamMat.uniforms.uBack.value = 16;
  const steamMesh = style.steamMesh(steam, steamMat);
  root.add(scrollMesh, steamMesh, haloMesh);

  // --- the curtains: the top rails' snow, released along each rail as its leaf swings ------------------------------------------
  // (ROUND NINE supersedes the release described here: see the note above the loop.)
  // Two towering veils of SEPARATE lumps, never a sheet: each leaf lets go about sixty pieces of cap (2 to 3 m across) at their own
  // moments, most of them in the first two seconds and stragglers for seven; each drags a tail of smaller lumps and powder torn
  // off it, which fall slower, so every piece becomes a streamer with bare bars between it and the next. A lump that reaches the
  // snow bursts into a fat puff. Their clock runs LEAD seconds ahead of the swing: the snow goes as the crown closes on the ring.
  const clumps = [], NB = Math.round(96 * detail), LEAD = opts.lead ?? 1.6, pool = [];
  for (let i = Math.round(800 * detail) * 8; i > 0; i--) pool.push(rng());           // the same number of draws as the curtains have always taken, so the garden built after the Gates keeps its shapes
  let pi = 0; const cr = () => pool[pi++ % pool.length]; cr.range = (a, b) => a + (b - a) * cr();
  // ROUND NINE: ONE veil a leaf. Nearly every piece lets go within the first second (a ragged dense front of lumps that touch, the
  // biggest about 2 m), each dragging two or three smaller ones that start later and fall slower (the veil's thinning upper part);
  // one piece in ten is a straggler. So the rail and the top of the leaf are bare black over the veil, and it lands as one front.
  for (const sg of [-1, 1]) for (let i = 0; i < NB; i++) {
    const late = cr() < 0.1, rho = 1.6 + (i + cr()) / NB * (W - 5), t0 = late ? cr.range(3.3, 4.1) : 2.5 + 0.32 * Math.pow(cr(), 1.6), hinge = P3(sg * W, TOP + 0.6, 0);
    const add = (dr, dt, size, sp) => clumps.push({ p: hinge, t: t0 + dt, size, seed: cr(), rho: -sg * clamp(rho + dr, 1.2, W - 2.6), sp });
    add(0, 0, cr.range(1.45, 2.05), cr.range(1.24, 1.34));
    const psp = clumps[clumps.length - 1].sp;
    add(cr.range(-0.9, 0.9), cr.range(0.1, 0.45), cr.range(0.9, 1.3), psp * cr.range(0.92, 0.98));
    for (let j = 0; j < 2; j++) add(cr.range(-0.8, 0.8), cr.range(0.2, 0.9), cr.range(0.5, 0.8), psp * cr.range(0.86, 0.96));
  }
  const clumpMat = style.clumpMaterial({ openA: OPEN, openT: 8, fall: opts.fall ?? 16, floor: 0, stretch: 0.7, streak: 0, lead: LEAD, burst: 1, minPx: 1, follow: 1, front: 2.4, puffSel: 1 });
  const clumpMesh = style.clumpMesh(clumps, clumpMat); root.add(clumpMesh);
  await lap(8);

  // --- progress: everything scripted hangs on these three values, never on the clock ------------------------------------------
  const st = { forge: 0, open: -1, ring: 0, driven: false };
  const apply = () => {
    scrollMat.uniforms.uRun.value = st.ring > 0 ? RING0 - 0.5 + st.ring * 4.6 : st.forge * CROWN_END;
    const o = clamp(st.open, 0, 1), a = OPEN * o * o * (3 - 2 * o);
    for (const lf of leaves) lf.g.rotation.y = lf.sg < 0 ? a : Math.PI - a;
    clumpMat.uniforms.uClock.value = st.open * 8 + LEAD > 0 ? st.open * 8 + LEAD : -1;
    leafSnowMat.uniforms.uShed.value = smoothstep(-LEAD / 8 + 0.02, 0.5, st.open);
  };
  const api = {
    setForge(f) { st.forge = clamp(f, 0, 1); st.driven = true; apply(); },          // 0 two stumps .. 1 the crown closed on the ring
    setOpen(o) { st.open = Math.max(-1, o); st.driven = true; apply(); },            // 0..1 the leaves swing 80 degrees; keep counting to ~2.2 so the curtains finish falling (1 = 8 s)
    setRing(r) { st.ring = clamp(r, 0, 1); st.driven = true; apply(); },            // 0..1 the four last scrolls close round the ring
    setProgress(p) { st.forge = clamp(p, 0, 1); st.open = Math.max(-1, p - 1); st.ring = clamp(p - 2, 0, 1); st.driven = true; apply(); },   // 0..3, the three in order
  };
  apply();
  const path = (t) => RC.clone().addScaledVector(en, -t);                            // the climb: t metres before the ring
  const anchors = {
    ringCentre: RC.clone(), portalSeat: { position: RC.clone(), normal: en.clone().negate(), radius: 7, tilt },
    pathDir: en.clone(), flyThrough: [150, 110, 70, 40, 15, 0, -20].map(path),
    approach: [P3(0, 2.5, 300), P3(0, 2.5, 190)], hoopLine: [P3(0, 1.5, 140), P3(0, 1.5, -140)],
    pierFeet: [P3(-PIER_X, 0, 4.5), P3(PIER_X, 0, 4.5)], crownRoots: [P3(-45.6, LY, 0), P3(45.6, LY, 0)], hinges: [P3(-W, 0, 0), P3(W, 0, 0)],
    viewpoints: { reveal: P3(0, 2.5, 300), axis: P3(0, 2.5, 150), climb: path(60), beyond: P3(0, 40, -90) },
  };
  let tris = iron.triangles + snow.triangles + leaves[0].tris + leaves[1].tris + scrolls.length * (scrollMesh.geometry.index.count / 3) + steam.length * 10 + scrolls.length * 2 + clumps.length * 2;
  return {
    object: root, radius: 62, height: 124, center: P3(0, 62, 0), anchors, ground: true, groundY: 0, style, kind, triangles: Math.round(tris), ...api,
    update(dt, time, camera) {
      style.update(dt, time, camera);
      if (!st.driven || st.demo) {            // nobody is driving (the set-piece viewer): play the whole act on a 44 s loop
        const t = time % 44; st.demo = true;
        st.forge = clamp(t / 15, 0, 1); st.open = t < 40 ? Math.max(-1, (t - 16) / 8) : -1; st.ring = t < 40 ? clamp((t - 27) / 5, 0, 1) : 0; apply();
      }
    },
    dispose() {},
  };
}
