// water-clock-city: THE ELEPHANT CLOCK, after Ismail al-Jazari (Book of Knowledge of Ingenious
// Mechanical Devices, 1206), built as the drawing given thickness. See the long note at the end of this
// header for anchors, opts and cost. HOW THE STYLE IS MADE (use these exports for the whole world):
//
//   PALETTE            the seven pigments (paper, vermilion, azurite, gold, verdigris, slate, ink).
//   makeStyle(palette) -> { uniforms, colors, material, setParts() } one shared ShaderMaterial (unlit, flat,
//                      DoubleSide) and its uniforms (uTime, uViewH, uPA/uPB part tables). EVERYTHING in the
//                      world should be drawn by this one material so that line and fill agree.
//   PlateBuilder       the drawing board. A machine is flat PLATES (extruded 2D outlines) in two attitudes:
//                      elevations facing +Z and plans lying level. plate() lays the fill, the edge walls
//                      and, in the same geometry, the REED LINE: camera-turned ribbons along every outline,
//                      widened in the vertex shader to max(0.3 m, 2.2 px), lifted off the fill, broken at
//                      sharp corners with a 0.4 m overshoot, slanted 30 degree stroke ends, 4 percent width
//                      drift and a round blot at some corners. Fills miss the line (opts.miss) the way the
//                      painter's did. kind: 0 flat, 1 water (paper scallop rows scrolling), 2 ink hook rows,
//                      3 laid paper, 4 the open page, 5 wide water lying on the page (the same scallop three times as large),
//                      6 the copyist's hide (bare paper under rows of large ink hooks). Kind 1 water rules the wide scallop
//                      itself once its own rows fall under 3 px, so water is ruled from across the page. Three attitudes:
//                      elevations facing +Z, plans lying level (b.plan), end elevations facing -X (b.end); b.ox shifts and
//                      b.mir mirrors a drawing along u.
//                      part(): every vertex carries a part index; a part turns stiffly about
//                      one pin (axis z, y or x) and/or slides, set from JS with style.setPart(i, angle, tx,ty,tz).
//   STYLE_GLSL         the fragment helpers (wccRows scallop/hook rows, wccPaper laid paper) if a world
//                      shader of its own is ever needed (it should not be).
//   makeBalls(style,n) camera-facing gold discs with a ring reed line; set(i,x,y,z,r) each frame.
//   makePaperDome(style, opts) the floor-and-dome page (fibre, laid ribs, seams, furrows) with no horizon.
//   overshoot(t)       the stiff mechanism ease (swing past, settle) for anything keyed to progress.
// Flat post is expected: post: { flat: 1, bloom: { strength: 0 }, grade: { saturation: 1, contrast: 1,
// vignette: 0, grain: 0 } }. Colours are written as THREE.Color(hex) linear values, no inverse tone map.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#E8D9B5', '#C8321F', '#2F5FA3', '#D4A22A', '#3F8F6B', '#5F6472', '#1C1814'];
export const NPARTS = 96;
const TAU = Math.PI * 2;

// stiff mechanism ease: 0 -> 1 with one short overshoot and settle (never bends, never drifts)
export function overshoot(t) {
  t = clamp(t, 0, 1);
  const s = 1 - Math.exp(-6.5 * t) * Math.cos(9.0 * t);
  return t >= 1 ? 1 : s + (1 - s) * t * t * t * t;
}

export const STYLE_GLSL = /* glsl */`
float wccHash(vec2 p){ p = fract(p * vec2(0.1031, 0.1173)); p += dot(p, p.yx + 33.33); return fract((p.x + p.y) * p.x); }
// rows of small arcs (scallops on water, hooks on robe, hide and scales). uv in metres, fw = fwidth(uv).
// returns line coverage 0..1; never thinner than 1.5 px, and the flat average tint once a row is too fine.
float wccRows(vec2 uv, vec2 fw2, float cellW, float rowH, float r, float w, float span, float scroll, float am){
  float fw = max(max(fw2.x, fw2.y), 1e-4);
  float row = floor(uv.y / rowH);
  float fy = uv.y - row * rowH - rowH * 0.3;
  float xs = uv.x + scroll + mod(row, 2.0) * cellW * 0.5 + (wccHash(vec2(row, 7.0)) - 0.5) * 0.3;
  float fx = (fract(xs / cellW) - 0.5) * cellW;
  float d = abs(length(vec2(fx, fy)) - r);
  float up = smoothstep(-span - fw, -span + fw, fy);            // keep the upper part of the ring only
  float ww = max(w, 1.5 * fw);
  float line = clamp((ww * 0.5 - d) / fw + 0.5, 0.0, 1.0) * up;
  float avg = am * clamp(w * r * (3.2 + 2.0 * span / max(r, 1e-3)) / (cellW * rowH), 0.0, 1.0);   // am 0.5: half the true cover, so far water stays azurite; am 1: the true cover (the copyist's hooked hide)
  return mix(line, avg, smoothstep(0.2, 0.42, fw / max(rowH, 1e-3)));
}
// laid paper: returns 0..1 amount of the one darker tone (fibre flecks, laid ribs near, chain lines)
float wccPaper(vec2 uv, vec2 fw2){
  float fw = max(max(fw2.x, fw2.y), 1e-4);
  float rib = abs(fract(uv.y / 0.5) - 0.5) * 0.5;               // laid ribs every 0.5 m
  float ribs = (1.0 - smoothstep(0.03, 0.03 + fw, rib)) * (1.0 - smoothstep(0.08, 0.2, fw)) * 0.28;
  float ch = abs(fract(uv.x / 12.0) - 0.5) * 12.0;              // chain lines every 12 m
  float chain = (1.0 - smoothstep(0.05, 0.05 + fw, ch)) * (1.0 - smoothstep(0.3, 0.9, fw)) * 0.22;
  vec2 g = uv / vec2(1.6, 0.5); vec2 id = floor(g); vec2 f = fract(g);
  float h = wccHash(id);
  vec2 c = vec2(0.2 + 0.6 * wccHash(id + 3.1), 0.5);
  float len = 0.08 + 0.25 * wccHash(id + 9.7);
  vec2 q = f - c; q.x = max(abs(q.x) - len, 0.0);
  float dd = length(q * vec2(1.6, 0.5));
  float fleck = step(0.86, h) * (1.0 - smoothstep(0.035, 0.035 + fw, dd)) * (1.0 - smoothstep(0.1, 0.3, fw));
  float blotch = 0.10 * smoothstep(0.55, 0.9, wccHash(floor(uv / 37.0)));
  return clamp(max(max(ribs, chain), fleck * 0.8) + blotch * 0.0, 0.0, 1.0);
}
// the open page (floor and dome): laid paper plus flat pasted seams every 220 m and blind-ruled furrows 6 m apart
float wccPage(vec2 uv, vec2 fw2){
  float fw = max(max(fw2.x, fw2.y), 1e-4);
  float t = wccPaper(uv, fw2);
  float sd = abs(fract(uv.y / 220.0 + 0.5) - 0.5) * 220.0;
  float seam = (1.0 - smoothstep(2.0 - fw, 2.0 + fw, sd)) * 0.4;
  float fd = abs(fract(uv.x / 6.0) - 0.5) * 6.0;
  float fwid = max(0.07, 0.75 * fw);
  float furrow = (1.0 - smoothstep(fwid - fw, fwid + fw, fd)) * 0.45 * (1.0 - smoothstep(0.25, 1.2, fw)) * min(1.0, 0.07 / fwid * 2.0);
  return clamp(max(t, max(seam, furrow)), 0.0, 1.0);
}
// a paved court lying on the page (kind 7): bare paper ruled in squares of 24 m with one reed line, a small diamond of
// vermilion or verdigris on every crossing and a gold boss in every square; where a square falls under about 6 px
// the court is its flat average tint
vec3 wccCourt(vec2 uv, vec2 fw2, vec3 cA, vec3 cB, vec3 cC, vec3 paper, vec3 ink){
  float C = 24.0;
  float fw = max(max(fw2.x, fw2.y), 1e-4);
  vec2 q = uv / C; vec2 f = fract(q) - 0.5; vec2 m = f * C;
  vec2 e = (0.5 - abs(f)) * C;
  float lw = max(0.3, 1.5 * fw);
  float l1 = e.x + e.y, s = 5.0, g = fw * 1.4;
  float dia = clamp((s - l1) / g + 0.5, 0.0, 1.0);
  vec2 cid = floor(q + 0.5);
  vec3 dc = mix(cA, cB, mod(cid.x + cid.y, 2.0));
  float dl = clamp((lw * 0.7 - abs(l1 - s)) / g + 0.5, 0.0, 1.0);
  float gl = clamp((lw * 0.5 - min(e.x, e.y)) / fw + 0.5, 0.0, 1.0) * (1.0 - dia);
  float r = length(m);
  float disc = clamp((2.6 - r) / fw + 0.5, 0.0, 1.0);
  float ring = clamp((lw * 0.5 - abs(r - 2.6)) / fw + 0.5, 0.0, 1.0);
  vec3 col = mix(paper, cC, disc);
  col = mix(col, dc, dia);
  col = mix(col, ink, max(max(gl, dl), ring));
  vec3 avg = mix(mix(mix(paper, cC, 0.037), mix(cA, cB, 0.5), 0.087), ink, 0.04);
  return mix(col, avg, smoothstep(0.06, 0.17, fw / C));
}
`;

const VERT = /* glsl */`
attribute vec3 aTan; attribute vec4 aInk; attribute vec3 aCol; attribute vec4 aUV; attribute float aPart;
uniform vec4 uPA[${NPARTS}]; uniform vec4 uPB[${NPARTS}];
uniform float uViewH; uniform float uTime; uniform vec4 uBend;
varying vec3 vCol; varying vec4 vUV; varying float vFlow; varying float vDist;
vec3 wccTurn(vec3 v, float a, float ax){
  float c = cos(a), s = sin(a);
  if (ax < 0.5) return vec3(c * v.x - s * v.y, s * v.x + c * v.y, v.z);
  if (ax < 1.5) return vec3(c * v.x + s * v.z, v.y, -s * v.x + c * v.z);
  return vec3(v.x, c * v.y - s * v.z, s * v.y + c * v.z);
}
void main(){
  int pi = int(aPart + 0.5);
  vec4 A = uPA[pi]; vec4 B = uPB[pi];
  vec3 p = wccTurn(position - A.xyz, A.w, B.w) + A.xyz + B.xyz;
  // THE PAGE TIPS UP: as in the leaves of his book and the miniatures round them, what is farther away is drawn higher on
  // the page. Every vertex is raised by a smooth function of its level distance from the eye (nothing within uBend.x moves).
  vec4 wp = modelMatrix * vec4(p, 1.0);
  wp.y = max(wp.y, 0.0);                                                // nothing is drawn under the page (columns and pours that run on below it stop at the paper)
  float bs = max(length(wp.xz - cameraPosition.xz) - uBend.x, 0.0);
  wp.y += uBend.y * bs * bs / (bs + max(uBend.z, 1.0)) * (1.0 + uBend.w * bs * bs);
  vec4 mv = viewMatrix * wp;
  float dist = max(length(mv.xyz), 1e-3);
  vec3 vdir = mv.xyz / dist;
  float px = dist * 2.0 / max(projectionMatrix[1][1] * uViewH, 1.0);   // metres per pixel here
  float side = aInk.x;
  if (abs(side) > 0.5) {
    vec3 t = mat3(modelViewMatrix) * wccTurn(aTan, A.w, B.w);
    t = t / max(length(t), 1e-4);
    vec3 n = cross(t, vdir); n = n / max(length(n), 1e-3);
    float hw = max(0.15, 1.1 * px) * (1.0 + 0.04 * sin(aInk.z)) * aUV.w;
    if (aUV.x > 0.0) hw *= smoothstep(2.0, 4.5, aUV.x / px);          // a mark under about 3 px goes: only its fill's flat tint is left
    mv.xyz += n * side * hw + t * aInk.y * side * hw;
  }
  mv.xyz -= vdir * aInk.w * (0.04 + 0.0004 * dist);                     // layer lift toward the eye
  vCol = aCol; vUV = aUV; vFlow = aInk.z; vDist = dist;
  gl_Position = projectionMatrix * mv;
}`;

const FRAG = /* glsl */`
uniform float uTime; uniform vec3 uPaper; uniform vec3 uPaper2; uniform vec3 uInk; uniform vec3 uGold; uniform vec3 uGreen; uniform vec4 uFade;
varying vec3 vCol; varying vec4 vUV; varying float vFlow; varying float vDist;
${STYLE_GLSL}
void main(){
  vec3 col = vCol;
  vec2 uv = vUV.xy; vec2 fw = fwidth(uv);
  float k = vUV.z;
  if (k > 6.5) { col = wccCourt(uv, fw, vCol, uGreen, uGold, mix(uPaper, uPaper2, wccPaper(uv, fw)), uInk); }                 // kind 7: a paved court in plan
  else if (k > 5.5) { col = mix(col, uInk, wccRows(uv, fw, 2.2, 1.7, 0.95, 0.34, 0.05, 0.0, 1.0)); }                      // kind 6: the copyist's hide, bare paper under close rows of large ink hooks
  else if (k > 4.5) { col = mix(col, uPaper, wccRows(uv, fw, 4.5, 3.6, 1.86, 0.42, 0.0, uTime * vFlow, 0.5)); }   // kind 5: wide water lying on the page, the same scallop three times as large
  else if (k > 3.5) { col = mix(uPaper, uPaper2, wccPage(uv, fw)); }
  else if (k > 2.5) { col = mix(uPaper, uPaper2, wccPaper(uv, fw)); }
  else if (k > 1.5) { col = mix(col, uInk, wccRows(uv, fw, 1.2, 1.2, 0.42, 0.13, 0.05, 0.0, 0.5)); }
  else if (k > 0.5) {                                                                                               // kind 1: water. Where its rows fall under 3 px the same scallop is ruled three times as large,
    float far = smoothstep(0.2, 0.42, max(max(fw.x, fw.y), 1e-4) / 1.2);                                             // so water is ruled water from across the page (and flat azurite only beyond that)
    float fine = wccRows(uv, fw, 1.5, 1.2, 0.62, 0.15, 0.0, uTime * vFlow, 0.0);
    float wide = wccRows(uv, fw, 4.5, 3.6, 1.86, 0.42, 0.0, uTime * vFlow, 0.5);
    col = mix(col, uPaper, clamp(fine + far * wide, 0.0, 1.0));
  }
  // UNDER-DRAWING BEHIND THE FINISHED FIGURE: what stands farther from the eye is laid in thinner colour and a paler line,
  // rank by rank, until the farthest are faint line drawings on the bare leaf. uFade: x the distance kept at full strength,
  // y the further distance at which half is left, z the least strength of a fill, w the least strength of the reed line.
  float fq = uFade.y / (uFade.y + max(vDist - uFade.x, 0.0));
  float inkness = 1.0 - smoothstep(0.03, 0.09, length(col - uInk));
  float keep = mix(uFade.z + (1.0 - uFade.z) * fq, uFade.w + (1.0 - uFade.w) * fq, inkness);
  col = mix(uPaper, col, keep);
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------------------------------------------
// the shared style: one material, one set of uniforms
export function makeStyle(palette = PALETTE) {
  const C = palette.map((h) => new THREE.Color(h));
  const colors = { paper: C[0], red: C[1], blue: C[2], gold: C[3], green: C[4], slate: C[5], ink: C[6],
    paper2: C[0].clone().multiplyScalar(0.87) };
  const uPA = [], uPB = [];
  for (let i = 0; i < NPARTS; i++) { uPA.push(new THREE.Vector4(0, 0, 0, 0)); uPB.push(new THREE.Vector4(0, 0, 0, 0)); }
  const uniforms = { uTime: { value: 0 }, uViewH: { value: 720 }, uPaper: { value: colors.paper },
    uPaper2: { value: colors.paper2 }, uInk: { value: colors.ink }, uGold: { value: colors.gold }, uGreen: { value: colors.green }, uPA: { value: uPA }, uPB: { value: uPB },
    uBend: { value: new THREE.Vector4(200, 0, 300, 0) },
    uFade: { value: new THREE.Vector4(1e6, 100, 1, 1) } };   // no fading unless a mesh is given its own (style.fadeMaterial)    // x: radius left level, y: steepness (0: a level page), z: how soon it steepens, w: the far curl
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG,
    side: THREE.DoubleSide, fog: false, toneMapped: false });
  const v2 = new THREE.Vector2();
  const style = { uniforms, colors, material, nParts: 1,
    // a new moving part: pivot [x,y,z] (local), axis 0 = z pin (elevations), 1 = y pin, 2 = x pin
    newPart(pivot = [0, 0, 0], axis = 0) {
      const i = Math.min(style.nParts++, NPARTS - 1);
      uPA[i].set(pivot[0], pivot[1], pivot[2], 0); uPB[i].set(0, 0, 0, axis); return i;
    },
    // the same material (and program) with its own fade: x full strength to here (m), y half left this much farther, z least fill, w least line
    fadeMaterial(x, y, z, w, base = material) {
      const m = base.clone(); m.uniforms = { ...uniforms, uFade: { value: new THREE.Vector4(x, y, z, w) } }; return m;
    },
    setPart(i, angle = 0, tx = 0, ty = 0, tz = 0) { uPA[i].w = angle; uPB[i].x = tx; uPB[i].y = ty; uPB[i].z = tz; },
    // every mesh drawn with the material: keeps the reed line's pixel width right for whichever camera draws it
    attach(mesh) {
      mesh.frustumCulled = false;
      mesh.onBeforeRender = (renderer) => {
        const rt = renderer.getRenderTarget();
        uniforms.uViewH.value = rt ? rt.height : renderer.getDrawingBufferSize(v2).y;
      };
      return mesh;
    } };
  return style;
}

// ---------------------------------------------------------------------------------------------------
// the drawing board
export class PlateBuilder {
  constructor(style, rng, noise) {
    this.style = style; this.rng = rng; this.noise = noise;
    this.pos = []; this.tan = []; this.ink = []; this.col = []; this.uv = []; this.prt = []; this.idx = [];
    this.n = 0; this.cur = 0; this.plan = false; this.end = false; this.ox = 0; this.mir = null; this.blots = 0.3; this.inkTris = 0;
  }
  use(part) { this.cur = part; return this; }
  // 2D plate coords (u, v) at offset w -> 3D. Elevation: (u, v, w). Plan (lying level): (u, w, v).
  // End elevation (b.end, a drawing that faces -X, toward a viewer coming in at the head): (-w, v, u).
  // b.ox shifts a drawing along u; b.mir (a u value, or null) mirrors it about that line.
  map(u, v, w) { if (this.end) return [-w, v, u]; const x = this.mir === null ? u + this.ox : 2 * this.mir - u; return this.plan ? [x, w, v] : [x, v, w]; }
  vert(p, t, side, slant, ph, layer, c, u, v, kind, wmul) {
    this.pos.push(p[0], p[1], p[2]); this.tan.push(t[0], t[1], t[2]); this.ink.push(side, slant, ph, layer);
    this.col.push(c.r, c.g, c.b); this.uv.push(u, v, kind, wmul); this.prt.push(this.cur); return this.n++;
  }
  // flat fill of a 2D outline (pts: [[u,v],...], holes: [[[u,v],...],...])
  fill(pts, w, c, o = {}) {
    const kind = o.kind || 0, layer = o.layer || 0, flow = o.flow || 0, rot = o.uvRot || 0;
    const us = o.uvScale || 1, cr = Math.cos(rot) * us, sr = Math.sin(rot) * us, fy = o.uvFlip ? -1 : 1;
    const V = pts.map((p) => new THREE.Vector2(p[0], p[1]));
    const H = (o.holes || []).map((h) => h.map((p) => new THREE.Vector2(p[0], p[1])));
    const tris = THREE.ShapeUtils.triangulateShape(V, H);
    const all = V.concat(...H), base = this.n;
    for (const q of all) this.vert(this.map(q.x, q.y, w), [0, 0, 0], 0, 0, flow, layer, c, cr * q.x + sr * q.y, fy * (-sr * q.x + cr * q.y), kind, 1);
    for (const t of tris) this.idx.push(base + t[0], base + t[1], base + t[2]);
  }
  // a free quad from four 3D corners (uv in metres from the first corner)
  quad(a, b, c2, d, c, o = {}) {
    const kind = o.kind || 0, layer = o.layer || 0, flow = o.flow || 0, base = this.n;
    const lu = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]), lv = Math.hypot(d[0] - a[0], d[1] - a[1], d[2] - a[2]);
    const u0 = o.u0 || 0, v0 = o.v0 || 0;
    this.vert(a, [0, 0, 0], 0, 0, flow, layer, c, u0, v0, kind, 1); this.vert(b, [0, 0, 0], 0, 0, flow, layer, c, u0 + lu, v0, kind, 1);
    this.vert(c2, [0, 0, 0], 0, 0, flow, layer, c, u0 + lu, v0 + lv, kind, 1); this.vert(d, [0, 0, 0], 0, 0, flow, layer, c, u0, v0 + lv, kind, 1);
    this.idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  // the edge wall of an outline between offsets w0 and w1 (o.skip(i, a, b) leaves a segment open)
  wall(pts, w0, w1, c, o = {}) {
    let s = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (!(o.skip && o.skip(i, a, b))) {
        this.quad(this.map(a[0], a[1], w0), this.map(b[0], b[1], w0), this.map(b[0], b[1], w1), this.map(a[0], a[1], w1), c, { kind: o.kind, u0: s });
      }
      s += l;
    }
  }
  // one reed stroke through 3D points (already split at corners). ends: slanted cuts.
  ribbon(P, o = {}) {
    if (P.length < 2) return;
    const layer = o.layer ?? 2, c = o.col || this.style.colors.ink, wm = o.w || 1, base = this.n, ph0 = this.rng() * 40, ft = o.feat || 0;
    let s = 0;
    for (let i = 0; i < P.length; i++) {
      const a = P[Math.max(0, i - 1)], b = P[Math.min(P.length - 1, i + 1)];
      let t = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const l = Math.hypot(t[0], t[1], t[2]) || 1; t = [t[0] / l, t[1] / l, t[2] / l];
      if (i > 0) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1], P[i][2] - P[i - 1][2]);
      if (o.parts) this.cur = o.parts[i];
      const sl = (i === 0 && !o.closed) ? -0.58 : (i === P.length - 1 && !o.closed) ? 0.58 : 0;
      this.vert(P[i], t, -1, sl, ph0 + s * 0.8, layer, c, ft, 0, 0, wm); this.vert(P[i], t, 1, sl, ph0 + s * 0.8, layer, c, ft, 0, 0, wm);
      if (i > 0) { const k = base + i * 2; this.idx.push(k - 2, k - 1, k, k - 1, k + 1, k); this.inkTris += 2; }
    }
    if (o.parts) this.cur = o.parts[0];
  }
  // a round blot where the pen rested: a small ink disc lying in the plate
  blot(u, v, w, r = 0.27, layer = 3) {
    const base = this.n, c = this.style.colors.ink, N = r > 0.4 ? 14 : 7;
    for (let i = 0; i < N; i++) { const a = (i / N) * TAU; this.vert(this.map(u + Math.cos(a) * r, v + Math.sin(a) * r * 0.9, w), [0, 0, 0], 0, 0, 0, layer, c, 0, 0, 0, 1); }
    for (let i = 1; i < N - 1; i++) this.idx.push(base, base + i, base + i + 1);
  }
  // the reed line along a 2D polyline at offset w: split at sharp corners, overshoot, blots
  stroke(pts, w, o = {}) {
    const n = pts.length, closed = !!o.closed, rng = this.rng, lim = Math.cos((o.corner ?? 48) * Math.PI / 180);
    if (n < 2) return;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const q of pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); }
    const feat = o.feat ?? Math.max(x1 - x0, y1 - y0);         // the mark's size: it fades out when under about 3 px
    const dir = (a, b) => { const x = b[0] - a[0], y = b[1] - a[1], l = Math.hypot(x, y) || 1; return [x / l, y / l]; };
    const corners = [];
    for (let i = closed ? 0 : 1; i < (closed ? n : n - 1); i++) {
      const d0 = dir(pts[(i - 1 + n) % n], pts[i]), d1 = dir(pts[i], pts[(i + 1) % n]);
      if (d0[0] * d1[0] + d0[1] * d1[1] < lim) corners.push(i);
    }
    const runs = [];
    if (!corners.length) { runs.push({ p: closed ? pts.concat([pts[0]]) : pts.slice(), closed, a: false, b: false }); }
    else if (closed) {
      for (let k = 0; k < corners.length; k++) {
        const i0 = corners[k], i1 = corners[(k + 1) % corners.length], p = [];
        for (let i = i0; ; i = (i + 1) % n) { p.push(pts[i]); if (i === i1 && p.length > 1) break; }
        runs.push({ p, a: true, b: true });
      }
    } else {
      const cs = [0, ...corners, n - 1];
      for (let k = 0; k < cs.length - 1; k++) runs.push({ p: pts.slice(cs[k], cs[k + 1] + 1), a: k > 0, b: k < cs.length - 2 });
    }
    for (const r of runs) {
      const p = r.p.map((q) => [q[0], q[1]]);
      if (!r.closed && o.over !== false) {      // the pen overshoots a crossing
        if (r.a) { const d = dir(p[1], p[0]), e = Math.min(0.15 + rng() * 0.4, 0.04 * feat + 0.05); p[0] = [p[0][0] + d[0] * e, p[0][1] + d[1] * e]; }
        if (r.b) { const m = p.length - 1, d = dir(p[m - 1], p[m]), e = Math.min(0.15 + rng() * 0.4, 0.04 * feat + 0.05); p[m] = [p[m][0] + d[0] * e, p[m][1] + d[1] * e]; }
      }
      this.ribbon(p.map((q) => this.map(q[0], q[1], w)), { closed: r.closed, layer: o.layer, col: o.col, w: o.wmul, feat });
      if (r.a && feat > 6 && rng() < this.blots) this.blot(r.p[0][0], r.p[0][1], w, 0.22 + rng() * 0.1, (o.layer ?? 2) + 1);
    }
    if (!closed && feat > 4 && rng() < this.blots * 0.7) this.blot(pts[n - 1][0], pts[n - 1][1], w, 0.2 + rng() * 0.1, (o.layer ?? 2) + 1);   // the pen rested
  }
  // the fill outline as the painter left it: short of the line in places (paper sliver), over it in others
  missed(pts, amt = 1) {
    const n = pts.length, out = []; let area = 0, s = 0; const seed = this.rng() * 100;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
    const sg = area > 0 ? 1 : -1;
    for (let i = 0; i < n; i++) {
      const a = pts[(i - 1 + n) % n], p = pts[i], b = pts[(i + 1) % n];
      let nx = (b[1] - a[1]) * sg, ny = -(b[0] - a[0]) * sg; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l;
      s += Math.hypot(p[0] - a[0], p[1] - a[1]);
      const f = this.noise.n2(s / 8, seed);
      const off = f > 0.3 ? 0.32 * smoothstep(0.3, 0.6, f) : f < -0.15 ? -0.5 * smoothstep(0.15, 0.55, -f) : 0;
      out.push([p[0] + nx * off * amt, p[1] + ny * off * amt]);
    }
    return out;
  }
  // a whole plate: fill (front at o.z, back at o.z - o.depth), edge wall and reed line.
  // o: { z, depth, col, kind, holes, miss, ink, back, edge, edgeKind, skip, flow, uvRot, uvFlip, backKind, backCol, layer }
  plate(pts, o = {}) {
    const z = o.z ?? 0, d = o.depth ?? 0, c = o.col, holes = o.holes || [], L = o.layer || 0;
    const fo = { holes, kind: o.kind, flow: o.flow, uvRot: o.uvRot, uvFlip: o.uvFlip, uvScale: o.uvScale, layer: L };
    const dz = this.plan ? -1 : 1;                                   // plans are extruded downward
    if (o.miss) { this.fill(pts, z, this.style.colors.paper, { holes, kind: 3, layer: L }); this.fill(this.missed(pts, o.miss), z, c, { ...fo, layer: L + 1 }); }
    else this.fill(pts, z, c, fo);
    if (d > 0) {
      if (o.back !== false) this.fill(pts, z - d * dz, o.backCol || c, { ...fo, kind: o.backKind ?? o.kind });
      this.wall(pts, z, z - d * dz, o.edge || c, { skip: o.skip, kind: o.edgeKind });
      if (o.holeWalls !== false) for (const h of holes) this.wall(h, z, z - d * dz, o.holeEdge || o.edge || c);
    }
    if (o.ink !== false) {
      const so = { closed: true, layer: L + 3, corner: o.corner };
      this.stroke(pts, z, so); for (const h of holes) this.stroke(h, z, so);
      if (d > 0 && o.back !== false) { this.stroke(pts, z - d * dz, so); for (const h of holes) this.stroke(h, z - d * dz, so); }
    }
  }
  // split every triangle edge whose LEVEL (xz) length is over maxLen, at its midpoint, until none is left: the page tips up
  // by a curve (uBend), and a long level edge would cut straight across it. Midpoints are shared, so no crack opens.
  // maxLen may be a function (x, z) -> length at that place (coarser where the eye never comes near)
  async refineAsync(maxLen, tick) {
    const P = this.pos, lenAt = typeof maxLen === 'function' ? maxLen : null, L2 = lenAt ? 0 : maxLen * maxLen, mids = Array.from({ length: 128 }, () => new Map()), arrs = [[this.pos, 3], [this.tan, 3], [this.ink, 4], [this.col, 3], [this.uv, 4]];
    const d2 = (a, b) => { const x = P[a * 3] - P[b * 3], z = P[a * 3 + 2] - P[b * 3 + 2]; return x * x + z * z; };
    const midOf = (a, b) => {
      const key = a < b ? a * 4194304 + b : b * 4194304 + a, mid = mids[(a + b) & 127]; let m = mid.get(key);   // many small maps: no one of them grows large enough to hold the page when it rehashes
      if (m === undefined) {
        m = this.n++; for (const [A, k] of arrs) for (let j = 0; j < k; j++) A.push((A[a * k + j] + A[b * k + j]) / 2);
        this.ink[m * 4 + 2] = this.ink[a * 4 + 2]; this.uv[m * 4 + 2] = this.uv[a * 4 + 2];      // flow and kind are not averaged
        this.prt.push(this.prt[a]); mid.set(key, m);
      }
      return m;
    };
    let work = this.idx, done = [], guard = 0;
    while (work.length && guard++ < 40) {
      const next = [];
      for (let i = 0; i < work.length; i += 3) {
        if ((i % 1800) === 0 && i && tick) await tick();
        const a = work[i], b = work[i + 1], c = work[i + 2], ab = d2(a, b), bc = d2(b, c), ca = d2(c, a), mx = Math.max(ab, bc, ca);
        let lim = L2; if (lenAt) { const l = lenAt((P[a * 3] + P[b * 3] + P[c * 3]) / 3, (P[a * 3 + 2] + P[b * 3 + 2] + P[c * 3 + 2]) / 3); lim = l * l; }
        if (mx <= lim) { done.push(a, b, c); continue; }
        if (mx === ab) { const m = midOf(a, b); next.push(a, m, c, m, b, c); }
        else if (mx === bc) { const m = midOf(b, c); next.push(a, b, m, a, m, c); }
        else { const m = midOf(c, a); next.push(a, b, m, m, b, c); }
      }
      work = next; if (tick) await tick();
    }
    for (let i = 0; i < work.length; i++) done.push(work[i]);
    this.idx = done;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('aTan', new THREE.Float32BufferAttribute(this.tan, 3));
    g.setAttribute('aInk', new THREE.Float32BufferAttribute(this.ink, 4));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aUV', new THREE.Float32BufferAttribute(this.uv, 4));
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(this.prt, 1));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 80, 0), 4000);
    const m = this.style.attach(new THREE.Mesh(g, this.style.material));
    m.userData.triangles = this.idx.length / 3; m.userData.inkTriangles = this.inkTris;
    return m;
  }
  // the same mesh, made in short steps (tick = ctx.yield): one attribute at a time, so a large drawing never holds the page
  async buildAsync(tick) {
    const g = new THREE.BufferGeometry();
    // a large drawing's arrays are copied in pieces, a breath between each, so no copy holds the page
    const typed = async (arr, Ctor) => {
      const ta = new Ctor(arr.length), CH = 40000;
      for (let i = 0; i < arr.length; i += CH) { const e = Math.min(arr.length, i + CH); for (let j = i; j < e; j++) ta[j] = arr[j]; await tick(); }
      return ta;
    };
    for (const [name, arr, n] of [['position', this.pos, 3], ['aTan', this.tan, 3], ['aInk', this.ink, 4], ['aCol', this.col, 3], ['aUV', this.uv, 4], ['aPart', this.prt, 1]]) {
      g.setAttribute(name, new THREE.BufferAttribute(await typed(arr, Float32Array), n)); await tick();
    }
    g.setIndex(new THREE.BufferAttribute(await typed(this.idx, this.n > 65535 ? Uint32Array : Uint16Array), 1));
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 80, 0), 4000);
    const m = this.style.attach(new THREE.Mesh(g, this.style.material));
    m.userData.triangles = this.idx.length / 3; m.userData.inkTriangles = this.inkTris;
    await tick();
    return m;
  }
}

// ---- outline helpers (all return [[x,y],...]) ------------------------------------------------------
export const rectPts = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
export function arcPts(cx, cy, rx, ry, a0, a1, n) {
  const o = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); o.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); } return o;
}
export const circlePts = (cx, cy, r, n = 24) => arcPts(cx, cy, r, r, 0, TAU * (1 - 1 / n), n - 1);
// smooth run through control points (Catmull-Rom), n samples per span
export function curvePts(ctrl, n = 6) {
  const c = new THREE.SplineCurve(ctrl.map((p) => new THREE.Vector2(p[0], p[1])));
  return c.getPoints((ctrl.length - 1) * n).map((v) => [v.x, v.y]);
}
export const movePts = (pts, dx, dy, sx = 1, sy = 1) => pts.map((p) => [p[0] * sx + dx, p[1] * sy + dy]);

// ---- balls: camera-facing gold discs with a ring reed line -----------------------------------------
export function makeBalls(style, count = 8) {
  const N = Math.min(count, 64), pos = [], cor = [], idx = [];
  for (let i = 0; i < N; i++) {
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(0, 0, i); cor.push(c[0], c[1]); }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aCorner', new THREE.Float32BufferAttribute(cor, 2));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
  const uBall = []; for (let i = 0; i < 64; i++) uBall.push(new THREE.Vector4(0, -1e4, 0, 0));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uBall: { value: uBall }, uGold: { value: style.colors.gold }, uInk: style.uniforms.uInk, uViewH: style.uniforms.uViewH, uBend: style.uniforms.uBend },
    vertexShader: /* glsl */`
      attribute vec2 aCorner; uniform vec4 uBall[64]; uniform float uViewH; uniform vec4 uBend; varying vec2 vC; varying float vLw;
      void main(){ vec4 b = uBall[int(position.z + 0.5)]; vec4 wp = modelMatrix * vec4(b.xyz, 1.0);
        float bs = max(length(wp.xz - cameraPosition.xz) - uBend.x, 0.0); wp.y += uBend.y * bs * bs / (bs + max(uBend.z, 1.0)) * (1.0 + uBend.w * bs * bs);
        vec4 mv = viewMatrix * wp;
        float r = max(b.w, 1e-3);
        float px = max(length(mv.xyz), 1e-3) * 2.0 / max(projectionMatrix[1][1] * uViewH, 1.0);
        vLw = clamp(max(0.3, 2.2 * px) / r, 0.0, 0.6);
        mv.xy += aCorner * b.w; vC = aCorner; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uGold; uniform vec3 uInk; varying vec2 vC; varying float vLw;
      void main(){ float d = length(vC); float fw = max(fwidth(d), 1e-4); if (d > 1.0) discard;
        float ring = smoothstep(1.0 - vLw - fw, 1.0 - vLw + fw, d);
        gl_FragColor = vec4(mix(uGold, uInk, ring), 1.0); }`,
    fog: false, toneMapped: false });
  const mesh = style.attach(new THREE.Mesh(g, mat));
  return { mesh, count: N, set(i, x, y, z, r) { uBall[i].set(x, y, z, r); }, hide(i) { uBall[i].set(0, -1e4, 0, 0); } };
}

// ---- the page: one floor-and-dome mesh of buff laid paper, no horizon, no join -----------------------
// opts: { flat: radius of the level floor (900), rise: radius of the upward curl (900), y: floor level,
//         seams: pasted seam spacing along uv.y (220), furrows: blind ruling spacing along uv.x (6) }
export function makePaperDome(style, opts = {}) {
  const R0 = opts.flat ?? 900, R1 = opts.rise ?? 900, y0 = opts.y ?? 0, b = new PlateBuilder(style, () => 0.5, null);
  const rings = [[0, 0, 0], [R0 * 0.25, 0, R0 * 0.25], [R0 * 0.6, 0, R0 * 0.6], [R0, 0, R0]], NS = 48, NA = 10;
  for (let i = 1; i <= NA; i++) { const a = (i / NA) * Math.PI * 0.5; rings.push([R0 + Math.sin(a) * R1 * 0.55, (1 - Math.cos(a)) * R1, R0 + a * R1]); }
  rings.push([0.01, R1 * 1.02, R0 + Math.PI * 0.5 * R1 + R0]);
  const c = style.colors.paper, base = b.n;
  for (const r of rings) for (let j = 0; j <= NS; j++) {
    const a = (j / NS) * TAU, cx = Math.cos(a), cz = Math.sin(a);
    b.vert([cx * r[0], y0 + r[1], cz * r[0]], [0, 0, 0], 0, 0, 0, 0, c, cx * r[2], cz * r[2], 4, 1);
  }
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < NS; j++) {
    const k = base + i * (NS + 1) + j; b.idx.push(k, k + 1, k + NS + 1, k + 1, k + NS + 2, k + NS + 1);
  }
  const m = b.build(); m.renderOrder = -1; return m;
}

// band outline around a centreline: width w(t) (t 0..1), round tip at the end. returns { all, a, b }
export function bandPts(ctrl, w0, w1, n = 7, tip = 5) {
  const c = curvePts(ctrl, n), A = [], B = [], m = c.length - 1;
  for (let i = 0; i <= m; i++) {
    const p = c[Math.max(0, i - 1)], q = c[Math.min(m, i + 1)]; let tx = q[0] - p[0], ty = q[1] - p[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const w = lerp(w0, w1, i / m) * 0.5; A.push([c[i][0] - ty * w, c[i][1] + tx * w]); B.push([c[i][0] + ty * w, c[i][1] - tx * w]);
  }
  const e = c[m], pe = c[m - 1], ang = Math.atan2(e[1] - pe[1], e[0] - pe[0]), T = [];
  for (let i = 1; i < tip; i++) { const a = ang + Math.PI / 2 - (i / tip) * Math.PI; T.push([e[0] + Math.cos(a) * w1 * 0.5, e[1] + Math.sin(a) * w1 * 0.5]); }
  return { a: A, b: B, tip: T, all: [...A, ...T, ...B.slice().reverse()] };
}

// ===================================================================================================
// THE ELEPHANT CLOCK
// Local frame: origin at the base centre on the page, +Y up, the drawing faces +Z (the entry side), head
// toward -X. In the world, turn it half round (rotation.y = PI) so the head is to port of a +Z course.
// Size: 228 m long (tusk tip x -131 to tail x +97), slab 44 m thick (z -22..22, head plate to z 28, ear and
// serpent to z 32), back at y 96, canopy 150, dome bird to 186. radius 125, height 186.
// Cost: about 22k triangles with the paper (of them about 9k reed line), 3 draw calls (plates, balls, optional paper), no lights,
// no textures, build about 90 ms in 16 steps (longest about 25 ms). Uses 14 of the style's 80 moving parts (the world uses about 52).
// END ELEVATIONS (b.end): the slab's front (breast band, tassels, knee and brow wrinkle rows, two standpipes, the overflow falling
// from the chest sill), the tank's head end (the bowl again, side and mouth together, on its string, the water's top hinged up),
// the chest passage (standpipes, hooked vermilion bands, the overflow channel in plan) and the room's end wall (outflow vessel, spout,
// toothed wheel) are drawings that face -X, toward a viewer who comes in under the trunk and through the cut chest. In the tower: a
// small scoop wheel, the cistern's water drawn in plan under the canopy fringe, and its fall into the trough head.
// It expects around it: bare paper (makePaperDome), nothing within 40 m of the flanks, the feeder channel arriving at
// anchors.feederFoot, and the world's trough leaving from anchors.troughHead toward local -Z.
// THE CHAIN is a pure function of progress: call hero.setProgress(u) with the world's path u every frame (before
// update). anchors.events lists the u of every event (ball A in the air at 0, serpent 1 down 0.05..0.09, vase 0.105,
// drum 0.125, bowl rim under 0.46, falcon 2 bows 0.462, ball B 0.47..0.497, serpent 2 down 0.50..0.54, lets go 0.60,
// ball at the trough head 0.64: start the world's trough ball there). Without setProgress the chain loops every 30 s.
// anchors (local space): flyThrough (ordered safe camera line: reveal point, round the head in a wide arc, in under the trunk
// curl head-on to the cut chest, through the chest, the belly at y 44 z -14.5 with the tank's cut face 7.5 m to starboard, a helix of
// radius 14 round (12, 0) climbing 3/4 turn up the shaft past the string, out between the back posts at y 108 beside
// serpent 2's tipped head); entryView, revealView, underTrunk, chest, bellyLine, shaft, exit {position, direction},
// troughHead {position, direction, width, ballAt, ballRadius}, window, bowl, bowlEnd (the bowl drawn on the tank's head end),
// outflow (the drawing on the room's end wall), tankFaceFront/Back, serpent1, serpent2,
// serpent2Tipped, falcon1, falcon2, vase, drummer, feet, feederFoot, events. Good pois: window (u 0..0.3), serpent2.
// opts: palette (7 hex), detail (0.6..1 thins hook strokes, tassels, blots), copy ('amid' | 'copyist', seeded
// if absent: the copyist leaves the hide bare paper under close rows of large ink hooks (kind 6) and paints the dome vermilion),
// paper (true: add the paper floor-and-dome so the piece can be judged alone; the world passes paper: false
// and uses makePaperDome itself), balls (true).
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, detail = opts.detail ?? ctx.quality?.detail ?? 1;
  const steps = [];
  const tick = async () => { await ctx.yield(); };
  const S = opts.style || makeStyle(opts.palette || PALETTE), K = S.colors;
  const copyDraw = rng() < 0.75 ? 'amid' : 'copyist';
  const copy = opts.copy || copyDraw;
  const hide = copy === 'copyist' ? K.paper : K.slate, hideKind = copy === 'copyist' ? 6 : 0;   // the copyist leaves the hide bare paper under rows of ink hooks
  const b = new PlateBuilder(S, rng, ctx.noise); b.blots = 0.34 * detail;
  const root = new THREE.Group(); root.name = 'elephant-clock';
  const ZF = 22, ZB = -22;                                  // the two flanks
  const WIN = rectPts(-46, 24, 46, 64);                     // the window cut in both flanks
  const SH = { x0: -14, x1: 36, z0: -20, z1: 20 };          // the shaft up through the back into the tower
  const CH = { y0: 30, y1: 58, z0: -20, z1: 20, x: -86 };   // the cut chest

  // ---- body slab: all four legs side by side ------------------------------------------------------
  const leg = (x0, x1) => [[x0, 14], [x0 - 1.2, 6], [x0 - 1.6, 2.2], [x0 - 0.6, 0], [x1 + 0.6, 0], [x1 + 1.6, 2.2], [x1 + 1.2, 6], [x1, 14]];
  const body = [
    [CH.x, 62], [CH.x, CH.y1], [CH.x, CH.y0], [CH.x, 6], [CH.x - 0.4, 2.2], [CH.x + 0.6, 0], [-63.4, 0], [-62.4, 2.2], [-62.8, 6], [-64, 14], [-62, 17.5], ...leg(-60, -44),
    ...curvePts([[-43, 18], [-38, 20], [-28, 20.6], [0, 20.2], [28, 20.6], [38, 20], [43, 18]], 4),
    ...leg(44, 60), [62, 17.5], ...leg(64, 84),
    ...curvePts([[85.5, 20], [89, 34], [92.5, 52], [93, 68], [90, 82], [82, 91.5], [70, 95.4], [60, 96]], 5),
    [SH.x1, 96], [SH.x0, 96], [-50, 96],
    ...curvePts([[-58, 96.6], [-68, 98.2], [-78, 97], [-86, 90], [-89.5, 79], [-88.2, 69], [-86.4, 64.5]], 4),
  ];
  const isChest = (i, p, q) => p[0] === CH.x && q[0] === CH.x && Math.max(p[1], q[1]) === CH.y1 && Math.min(p[1], q[1]) === CH.y0;
  const isShaft = (i, p, q) => p[1] === 96 && q[1] === 96 && Math.max(p[0], q[0]) === SH.x1 && Math.min(p[0], q[0]) === SH.x0;
  b.plate(body, { z: ZF, depth: ZF - ZB, col: hide, kind: hideKind, edgeKind: hideKind ? 6 : 0, holes: [WIN], miss: hideKind ? 0 : 1, holeWalls: false,
    skip: (i, p, q) => isChest(i, p, q) || isShaft(i, p, q) });
  await tick();
  // the strips of wall left beside the two openings
  b.quad([CH.x, CH.y0, ZF], [CH.x, CH.y1, ZF], [CH.x, CH.y1, CH.z1], [CH.x, CH.y0, CH.z1], K.red);
  b.quad([CH.x, CH.y0, ZB], [CH.x, CH.y1, ZB], [CH.x, CH.y1, CH.z0], [CH.x, CH.y0, CH.z0], K.red);
  b.quad([CH.x - 0.05, CH.y1, ZF], [CH.x - 0.05, CH.y1, ZB], [CH.x - 0.05, CH.y1 + 2.4, ZB], [CH.x - 0.05, CH.y1 + 2.4, ZF], K.red, { layer: 1 });
  b.quad([CH.x - 0.05, CH.y0, ZF], [CH.x - 0.05, CH.y0, ZB], [CH.x - 0.05, CH.y0 - 2.4, ZB], [CH.x - 0.05, CH.y0 - 2.4, ZF], K.red, { layer: 1 });
  b.ribbon([[CH.x, CH.y1 + 2.4, ZF], [CH.x, CH.y1 + 2.4, ZB]]); b.ribbon([[CH.x, CH.y0 - 2.4, ZF], [CH.x, CH.y0 - 2.4, ZB]]);
  b.quad([SH.x0, 96, ZF], [SH.x1, 96, ZF], [SH.x1, 96, SH.z1], [SH.x0, 96, SH.z1], hide, { kind: hideKind });
  b.quad([SH.x0, 96, ZB], [SH.x1, 96, ZB], [SH.x1, 96, SH.z0], [SH.x0, 96, SH.z0], hide, { kind: hideKind });
  // toenails, knee wrinkles, the line of the far legs: plain reed strokes on both flanks
  for (const z of [ZF, ZB]) {
    for (const [x0, x1] of [[-86, -64], [-60, -44], [44, 60], [64, 84]]) {
      const w = (x1 - x0) / 3;
      for (let k = 0; k < 3; k++) b.fill(rectPts(x0 + 2 + k * 0.9, 10.8 + k * 2.4, x1 - 2 - k * 0.9, 12 + k * 2.4), z, hide, { kind: 2, layer: 1.5 });   // knee wrinkles: single rows of ink hooks
      for (let k = 0; k < 3; k++) b.stroke(arcPts(x0 + w * (k + 0.5), 0.2, w * 0.42, 3.2, 0.15, Math.PI - 0.15, 6), z, { over: false });
      for (let k = 0; k < 3; k++) b.stroke(arcPts((x0 + x1) / 2 + (rng() - 0.5) * 4, 15.5 - k * 2.4 + rng(), 5.5 + rng() * 2, 1.2, Math.PI * 1.1, Math.PI * 1.9, 5), z);
    }
    b.stroke(curvePts([[-62, 17.5], [-63.5, 30], [-67, 44], [-74, 54]], 4), z);        // far foreleg runs up behind the near one
    b.stroke(curvePts([[62, 17.5], [63, 32], [67, 46], [75, 56]], 4), z);
    b.stroke(curvePts([[84, 60], [78, 72], [66, 78]], 4), z);                           // haunch
    for (let k = 0; k < 4; k++) {                                                        // shoulder and haunch: hook-row wrinkles, 1.2 m
      b.fill(rectPts(-81 + k * 1.1, 38.4 + k * 3.6, -68 + (k % 2) * 2, 39.6 + k * 3.6), z, hide, { kind: 2, layer: 1.5 });
      b.fill(rectPts(68 - (k % 2) * 2, 40.8 + k * 3.6, 81 - k * 0.6, 42 + k * 3.6), z, hide, { kind: 2, layer: 1.5 });
    }
  }
  await tick();
  // harness: two vermilion girths with gold studs, a crupper round the rump with gold drops; and the hide's few wrinkles
  for (const [z, s] of [[ZF, 1], [ZB, -1]]) {
    for (const gx of [-52.6, 49.4]) {
      b.plate(rectPts(gx, 17.6, gx + 3.2, 70.5), { z: z + 0.7 * s, col: K.red, miss: 0.7, layer: 1 });
      for (let k = 0; k < 12; k++) b.plate(circlePts(gx + 1.6, 21 + k * 4.2, 0.85, 8), { z: z + 0.9 * s, col: K.gold, layer: 3 });
    }
    const cr = bandPts([[64, 86], [76, 86.5], [86, 82], [92.4, 73]], 2.6, 2.6, 5, 2);
    b.plate(cr.all, { z: z + 0.7 * s, col: K.red, layer: 1, corner: 70 });
    for (const [dx, dy] of [[72, 84.6], [80, 83.4], [87, 79]]) { b.ribbon([[dx, dy, z + 0.8 * s], [dx, dy - 3, z + 0.8 * s]]); b.plate([[dx, dy - 2.6], [dx + 1.5, dy - 5], [dx, dy - 8.4], [dx - 1.5, dy - 5]], { z: z + 0.9 * s, col: K.gold, layer: 3, corner: 30 }); }
    const nW = Math.round(30 * detail);
    for (let k = 0; k < nW; k++) {
      const reg = rng.pick([[-84, -56, 22, 60], [56, 90, 24, 64], [-48, 48, 66.5, 68], [66, 88, 64, 82], [-84, -56, 62, 90]]);
      const wx = lerp(reg[0], reg[1], rng()), wy = lerp(reg[2], reg[3], rng()), ww = 2.2 + rng() * 2.6;
      if (wx < -86 + (62 - Math.min(wy, 62)) * 0.02 || (wx > -55 && wx < -47) || (wx > 47 && wx < 55)) continue;
      b.stroke(arcPts(wx, wy, ww, ww * 0.42, Math.PI * 1.15, Math.PI * 1.85, 5), z, { layer: 2 });
    }
  }
  // the head cloth: a gold band over the brow with a row of studs
  {
    const top = curvePts([[-80, 104.2], [-90, 106.6], [-100, 104], [-108, 97]], 5), inn = top.map((p) => { const dx = -93 - p[0], dy = 88 - p[1], l = Math.hypot(dx, dy); return [p[0] + dx / l * 4.6, p[1] + dy / l * 4.6]; });
    b.plate([...top, ...inn.reverse()], { z: 28.5, col: K.gold, layer: 3, corner: 60 });
    for (let k = 1; k < 8; k++) { const i = Math.round(k * (top.length - 1) / 8), j = top.length - 1 - i; b.plate(circlePts((top[i][0] + inn[j][0]) / 2, (top[i][1] + inn[j][1]) / 2, 1.0, 8), { z: 28.7, col: k % 2 ? K.red : K.green, layer: 5 }); }
  }
  await tick();

  // ---- the belly: a bare paper room framed in vermilion, the cut chest and the shaft ----------------
  const P3 = { kind: 3 };
  b.plan = true;
  b.fill(rectPts(-46, ZB, 46, ZF), 24, K.paper, P3);
  b.fill(rectPts(-46, ZB, 46, ZF), 64, K.paper, { kind: 3, holes: [rectPts(SH.x0, SH.z0, SH.x1, SH.z1)] });
  b.fill(rectPts(CH.x, CH.z0, -46, CH.z1), CH.y0, K.paper, P3); b.fill(rectPts(CH.x, CH.z0, -46, CH.z1), CH.y1, K.paper, P3);
  b.stroke(rectPts(SH.x0, SH.z0, SH.x1, SH.z1), 64, { closed: true }); b.stroke(rectPts(SH.x0, SH.z0, SH.x1, SH.z1), 96, { closed: true });
  b.plan = false;
  b.quad([46, 24, ZF], [46, 24, ZB], [46, 64, ZB], [46, 64, ZF], K.paper, P3);
  b.quad([-46, 24, ZF], [-46, 24, CH.z1], [-46, 64, CH.z1], [-46, 64, ZF], K.paper, P3);
  b.quad([-46, 24, CH.z0], [-46, 24, ZB], [-46, 64, ZB], [-46, 64, CH.z0], K.paper, P3);
  b.quad([-46, 24, CH.z1], [-46, 24, CH.z0], [-46, CH.y0, CH.z0], [-46, CH.y0, CH.z1], K.paper, P3);
  b.quad([-46, CH.y1, CH.z1], [-46, CH.y1, CH.z0], [-46, 64, CH.z0], [-46, 64, CH.z1], K.paper, P3);
  for (const z of [CH.z0, CH.z1]) b.quad([CH.x, CH.y0, z], [-46, CH.y0, z], [-46, CH.y1, z], [CH.x, CH.y1, z], K.paper, P3);
  for (const x of [SH.x0, SH.x1]) b.quad([x, 64, SH.z0], [x, 64, SH.z1], [x, 96, SH.z1], [x, 96, SH.z0], K.paper, P3);
  for (const z of [SH.z0, SH.z1]) b.quad([SH.x0, 64, z], [SH.x1, 64, z], [SH.x1, 96, z], [SH.x0, 96, z], K.paper, P3);
  // vermilion frame: a 2.4 m band round each window outside, and a band on the room's faces at each window
  await tick();
  const FR = 2.4;
  for (const [z, s] of [[ZF, 1], [ZB, -1]]) {
    b.plate(rectPts(-46 - FR, 24 - FR, 46 + FR, 64 + FR), { z: z + 0.5 * s, col: K.red, holes: [WIN], miss: 0.8, layer: 1 });
    const zi = z - 3 * s;
    b.quad([-46, 24, z], [46, 24, z], [46, 24, zi], [-46, 24, zi], K.red, { layer: 1 });
    b.quad([-46, 64, z], [46, 64, z], [46, 64, zi], [-46, 64, zi], K.red, { layer: 1 });
    b.quad([46, 24, z], [46, 64, z], [46, 64, zi], [46, 24, zi], K.red, { layer: 1 });
    b.quad([-46, 24, z], [-46, 64, z], [-46, 64, zi], [-46, 24, zi], K.red, { layer: 1 });
    b.ribbon([[-46, 24, zi], [46, 24, zi], [46, 64, zi], [-46, 64, zi], [-46, 24, zi]]);
  }
  // reed line on every cut edge of chest and shaft
  for (const z of [CH.z0, CH.z1]) { b.ribbon([[CH.x, CH.y0, z], [-46, CH.y0, z]]); b.ribbon([[CH.x, CH.y1, z], [-46, CH.y1, z]]); b.ribbon([[CH.x, CH.y0, z], [CH.x, CH.y1, z]]); b.ribbon([[-46, CH.y0, z], [-46, CH.y1, z]]); }
  b.ribbon([[CH.x, CH.y0, CH.z0], [CH.x, CH.y0, CH.z1]]); b.ribbon([[CH.x, CH.y1, CH.z0], [CH.x, CH.y1, CH.z1]]);
  for (const x of [SH.x0, SH.x1]) for (const z of [SH.z0, SH.z1]) b.ribbon([[x, 64, z], [x, 96, z]]);
  await tick();

  // ---- head, trunk, tusk and ear: the second plate, 6 m proud of the near flank ----------------------
  const ZH = 28;
  const tr = bandPts([[-106, 80], [-109.5, 66], [-109, 53], [-112.5, 44], [-120, 41.2], [-125.5, 45.5], [-124, 52], [-119.5, 52.6]], 15, 4.6, 6, 6);
  const trunk = [...tr.b, ...tr.tip.slice().reverse(), ...tr.a.slice().reverse()];
  const headTop = curvePts([[-70, 93], [-72, 99.5], [-80, 104.2], [-90, 106.6], [-100, 104], [-108, 97], [-112.4, 88.5]], 4);
  const headLow = curvePts([[-96.4, 72.5], [-91, 66.6], [-83, 64], [-76.4, 69], [-72.4, 80], [-70.4, 88]], 4);
  const head = [...headTop, ...trunk, [-97.6, 71], ...headLow];
  b.plate(head, { z: ZH, depth: ZH - ZF, col: hide, kind: hideKind, miss: hideKind ? 0 : 1, back: false, corner: 60, edgeKind: hideKind ? 6 : 2 });   // hook rows run round its edge too
  // the trunk hangs clear of the body, so it has a back: the same hook rows and reed line, seen from under the curl
  b.fill(trunk, ZF + 0.03, hide, { kind: 2 }); b.stroke(trunk, ZF + 0.03, { layer: 3 });
  for (let k = 0; k < 6; k++) { const q = tr.a[4 + k * 5], r = tr.b[4 + k * 5]; if (q && r) { b.stroke([[lerp(q[0], r[0], 0.12), lerp(q[1], r[1], 0.12)], [lerp(q[0], r[0], 0.6), lerp(q[1], r[1], 0.6)]], ZF + 0.03, { layer: 3 }); b.blot(lerp(q[0], r[0], 0.6), lerp(q[1], r[1], 0.6), ZF + 0.03, 0.3 + 0.05 * (k % 3), 4); } }
  b.fill(hideKind ? trunk : b.missed(trunk, 0.9), ZH, hide, { kind: 2, layer: 2 });                                       // hook-row wrinkles, 1.2 m
  b.stroke(curvePts([[-112, 86], [-106, 82.5], [-99, 79]], 3), ZH, { layer: 3 });       // where the trunk leaves the face
  b.stroke(arcPts(-99, 89.4, 3.1, 1.7, 0.25, Math.PI - 0.25, 6), ZH, { layer: 3 });     // the eye: two strokes and a dot
  b.stroke(arcPts(-99, 90.6, 3.1, 1.5, Math.PI + 0.3, TAU - 0.3, 6), ZH, { layer: 3 });
  b.blot(-99.2, 90, ZH, 0.62, 4);
  for (let k = 0; k < 4; k++) b.stroke(arcPts(-88 + k * 2.2, 99 - k * 1.2, 7, 2.4, Math.PI * 0.2, Math.PI * 0.8, 5), ZH, { layer: 3 });
  const tusk = bandPts([[-98.6, 71.4], [-108, 64.6], [-119, 63], [-129.5, 68.4]], 5.6, 0.9, 6, 4);
  b.plate(tusk.all, { z: ZH + 2.6, depth: 1.2, col: K.paper, kind: 3, corner: 70 });
  for (let k = 0; k < 2; k++) b.stroke(movePts(arcPts(0, 0, 0.5, 2.9, -1.2, 1.2, 4), -103 - k * 2.2, 68.2 - k * 1.5), ZH + 2.6, { layer: 3 });   // gold-less plain ferrule lines
  const ear = curvePts([[-71, 101.5], [-62.5, 95], [-58.6, 82], [-61.6, 70], [-69.5, 62], [-78, 60.4], [-84.4, 68], [-83.4, 82], [-79, 95.5], [-71, 101.5]], 4).slice(0, -1);
  b.plate(ear, { z: ZH + 4, depth: 1.5, col: hide, kind: hideKind, miss: hideKind ? 0 : 1, corner: 60 });
  for (let k = 0; k < 4; k++) { const a = -2.06 + k * 0.17, L = 21 + rng() * 5; b.stroke(curvePts([[-72 + Math.cos(a) * 6, 96 + Math.sin(a) * 6], [-72 + Math.cos(a + 0.1) * L * 0.6, 96 + Math.sin(a + 0.1) * L * 0.6], [-72 + Math.cos(a + 0.26) * L, 96 + Math.sin(a + 0.26) * L]], 4), ZH + 4, { layer: 3 }); }
  const tail = bandPts([[91.5, 76], [96.4, 67], [97.6, 53], [95.6, 40]], 3.2, 1.7, 5, 4);
  b.plate(tail.all, { z: 4, depth: 2.4, col: hide, kind: hideKind, corner: 70 });
  for (let k = 0; k < 5; k++) b.stroke(curvePts([[95.6 + (k - 2) * 0.5, 40], [95 + (k - 2) * 1.5, 35], [94.6 + (k - 2) * 2.3 + rng(), 30.5 + rng() * 2]], 3), 4);
  await tick();

  // ---- the saddle carpet: vermilion, gold border, a tassel row; over the back and down both flanks ---
  const CX0 = -52, CX1 = 64, CY0 = 69, CY1 = 96.8, nMed = rng.int(3, 5), medKind = rng.int(0, 2);
  const carpet = [[CX0, CY0 + 2], ...arcPts(CX0 + 2, CY0 + 2, 2, 2, Math.PI, Math.PI * 1.5, 3).slice(1), ...arcPts(CX1 - 2, CY0 + 2, 2, 2, Math.PI * 1.5, TAU, 3), [CX1, CY1], [CX0, CY1]];
  for (const [z, s] of [[ZF, 1], [ZB, -1]]) {
    const zc = z + 1.5 * s;
    b.plate(carpet, { z: zc, depth: 0, col: K.gold, miss: 0.7, corner: 60 });
    b.plate(rectPts(CX0 + 3.2, CY0 + 3.2, CX1 - 3.2, CY1 - 3), { z: zc + 0.4 * s, col: K.red, miss: 1, layer: 1 });
    const zm = zc + 0.8 * s, mw = (CX1 - CX0 - 14) / nMed;
    for (let k = 0; k < nMed; k++) {
      const mx = CX0 + 7 + mw * (k + 0.5), my = (CY0 + CY1) / 2 + 0.2;
      const med = medKind === 0 ? [[mx - mw * 0.36, my], [mx, my - 8.4], [mx + mw * 0.36, my], [mx, my + 8.4]]
        : medKind === 1 ? circlePts(mx, my, 7.6, 20) : arcPts(mx, my, mw * 0.36, 8.2, 0, TAU * (15 / 16), 15).map((p, i) => i % 2 ? [mx + (p[0] - mx) * 0.72, my + (p[1] - my) * 0.72] : p);
      b.plate(med, { z: zm, col: K.gold, layer: 2, corner: 30 });
      b.plate(circlePts(mx, my, 2.6, 12), { z: zm + 0.3 * s, col: k % 2 ? K.green : K.blue, layer: 3 });
    }
    // gold border studs: a row of ink rings along the band
    const nStud = Math.round(34 * detail);
    for (let k = 0; k < nStud; k++) b.stroke(circlePts(CX0 + 3 + (CX1 - CX0 - 6) * (k + 0.5) / nStud, CY0 + 1.6, 0.75, 7), zm, { closed: true, layer: 3 });
    const nT = Math.round(40 * detail), tw = (CX1 - CX0 - 4) / nT;
    for (let k = 0; k < nT; k++) {
      const x = CX0 + 2 + tw * (k + 0.5), y = CY0;
      b.ribbon([[x, y + 0.2, zc], [x, y - 1.3, zc]]);
      b.plate([[x, y - 1.2], [x + 0.85, y - 2.6], [x + 0.7, y - 4.6], [x - 0.7, y - 4.6], [x - 0.85, y - 2.6]], { z: zc, col: k % 2 ? K.gold : K.red, corner: 30 });
    }
  }
  b.plan = true;                                             // the carpet's plan, lying on the back
  b.fill(rectPts(CX0, ZB - 1.5, CX1, ZF + 1.5), 96.9, K.red, { holes: [rectPts(SH.x0, SH.z0, SH.x1, SH.z1)] });
  b.stroke(rectPts(CX0, ZB - 1.5, CX1, ZF + 1.5), 96.9, { closed: true });
  b.plan = false;
  for (const x of [CX0, CX1]) b.quad([x, CY1, ZF + 1.5], [x, CY1, ZB - 1.5], [x, CY0 + 2, ZB - 1.5], [x, CY0 + 2, ZF + 1.5], K.gold);
  await tick();

  // ---- the tower: four verdigris posts, gold canopy with a hanging fringe, balcony, bare dome, bird --
  const TX0 = -20, TX1 = 42, PW = 6, YB = 96.9, YC = 150;
  const post = (x0) => { const x1 = x0 + PW; return [[x0 - 1.4, YB], [x1 + 1.4, YB], [x1 + 1.4, YB + 3], [x1, YB + 4.4], [x1, YC - 5], [x1 + 1.6, YC - 3.2], [x1 + 1.6, YC], [x0 - 1.6, YC], [x0 - 1.6, YC - 3.2], [x0, YC - 5], [x0, YB + 4.4], [x0 - 1.4, YB + 3]]; };
  for (const [z, s] of [[ZF, 1], [ZB, -1]]) for (const x0 of [TX0, TX1 - PW]) {
    const zf = s > 0 ? z : z + 5;
    b.plate(post(x0), { z: zf, depth: 5, col: K.green, miss: 0.8 });
    for (const zz of [zf, zf - 5]) {
      for (const y of [YB + 14, YB + 15.6, YB + 30, YB + 31.6, YC - 9, YC - 7.4]) b.stroke([[x0, y], [x0 + PW, y]], zz, { layer: 3 });
      b.plate(rectPts(x0 - 0.4, YB + 22, x0 + PW + 0.4, YB + 24.4), { z: zz + (zz === zf ? 0.2 : -0.2), col: K.gold, layer: 2 });
    }
  }
  const lobes = [], nL = rng.int(5, 7) * 2, CXa = TX0 - 7, CXb = TX1 + 7, lw = (CXb - CXa) / nL;
  for (let k = 0; k < nL; k++) { const x = CXa + lw * k; lobes.push([x, YC], ...arcPts(x + lw / 2, YC - 0.4, lw / 2 - 0.3, 4.2, Math.PI, TAU, 5)); }
  const canopy = [...lobes, [CXb, YC], [CXb + 1.6, YC + 3.2], [CXb, YC + 7], [CXa, YC + 7], [CXa - 1.6, YC + 3.2]];
  b.plate(canopy, { z: ZF + 2, depth: ZF - ZB + 4, col: K.gold, miss: 0.8, corner: 40 });
  for (const z of [ZF + 2, ZB - 2]) { b.stroke([[CXa - 0.6, YC + 1.8], [CXb + 0.6, YC + 1.8]], z, { layer: 4 }); b.stroke([[CXa - 0.6, YC + 5], [CXb + 0.6, YC + 5]], z, { layer: 4 });
    for (let k = 0; k < nL; k++) b.plate(circlePts(CXa + lw * (k + 0.5), YC - 2.4, 0.9, 8), { z: z + (z > 0 ? 0.3 : -0.3), col: k % 2 ? K.red : K.green, layer: 2 }); }
  const BX0 = TX0 + 4, BX1 = TX1 - 4, YBal = YC + 7, mer = [];
  await tick();
  { const nM = 7, mw = (BX1 - BX0) / (nM * 2 - 1); for (let k = nM - 1; k >= 0; k--) { const x = BX0 + mw * 2 * k; mer.push([x + mw, YBal + 5.6], [x + mw, YBal + 8], [x, YBal + 8], [x, YBal + 5.6]); } mer.pop(); }
  const balcony = [[BX0, YBal], [BX1, YBal], [BX1, YBal + 8], ...mer.slice(1)];
  b.plate(balcony, { z: 18, depth: 36, col: K.red, miss: 0.8 });
  for (const z of [18, -18]) for (let k = 0; k < 5; k++) b.plate(arcPts(BX0 + 7 + k * (BX1 - BX0 - 14) / 4, YBal + 1.4, 2.1, 4.4, 0, Math.PI, 7), { z: z + (z > 0 ? 0.3 : -0.3), col: K.paper, kind: 3, layer: 2, corner: 60 });
  const DCX = (TX0 + TX1) / 2, YD = YBal + 7.6;
  const dome = [[DCX - 16, YD], [DCX + 16, YD], ...curvePts([[DCX + 16, YD + 0.5], [DCX + 15.6, YD + 7], [DCX + 11, YD + 13], [DCX + 3.4, YD + 16.4], [DCX, YD + 19.5], [DCX - 3.4, YD + 16.4], [DCX - 11, YD + 13], [DCX - 15.6, YD + 7], [DCX - 16, YD + 0.5]], 4)];
  const domeCol = copy === 'copyist' ? K.red : K.paper;
  b.plate(dome, { z: 9, depth: 18, col: domeCol, kind: copy === 'copyist' ? 0 : 3, corner: 60 });
  for (const z of [9, -9]) for (const k of [-2, -1, 0, 1, 2]) b.stroke(curvePts([[DCX + k * 6.4, YD], [DCX + k * 5.8, YD + 7], [DCX + k * 3.4, YD + 13.4], [DCX + k * 0.4, YD + 18.4]], 4), z, { layer: 3, feat: 60 });
  const pBird = S.newPart([DCX, YD + 19, 0], 1); b.use(pBird);
  b.plate(rectPts(DCX - 0.6, YD + 18.5, DCX + 0.6, YD + 23), { z: 0.5, depth: 1, col: K.gold });
  b.plate(circlePts(DCX, YD + 23.5, 1.5, 10), { z: 0.6, depth: 1.2, col: K.gold });
  const birdY = YD + 24.6;
  b.plate(movePts([[-5.6, 3.2], [-4.2, 4.6], [-2.6, 4.4], [-1.4, 3], [1.6, 3.4], [4.6, 5.6], [7.4, 6.2], [5.2, 3.6], [6.6, 1.8], [3.2, 1.4], [1, 0.2], [-1.6, 0.4], [-3, 1.8], [-4.2, 3.2]], DCX, birdY), { z: 0.5, depth: 1, col: K.gold, corner: 40 });
  b.stroke(movePts(curvePts([[-1, 2.6], [1.6, 1.6], [4.4, 2.6]], 3), DCX, birdY), 0.5, { layer: 3 });
  b.use(0);
  await tick();

  // ---- falcons: gold, stiff profile, on perch arms; they bow to drop the ball -----------------------
  const FALCON = [[-3.5, 6.1], [-3.3, 7], [-2.5, 7.9], [-1.1, 8.1], [0.4, 7.1], [2.3, 5], [4.7, 1.6], [5.6, -2], [4, -1.4], [2.5, 0.9], [0.7, 1.3], [-1, 2.3], [-1.8, 4.3], [-1.7, 5.7], [-2.7, 6]];
  const falcon = (fx, fy, z, dirX, sc = 1) => {
    const part = S.newPart([fx, fy, z], 0); b.use(part);
    const T = (pts) => pts.map((p) => [fx + p[0] * sc * dirX, fy + (p[1] + 1.4) * sc]);
    b.plate(T(FALCON), { z, depth: 1.2, col: K.gold, corner: 42 });
    for (const zz of [z, z - 1.2]) {
      b.stroke(T(curvePts([[0.2, 6.2], [1.4, 3.6], [4.4, 1.2]], 3)), zz, { layer: 3 });                 // wing
      b.stroke(T(curvePts([[0.4, 4.6], [1.6, 2.6], [3.4, 1]], 3)), zz, { layer: 3 });
      b.stroke(T([[0.2, 1.4], [0.5, -1.4], [-0.6, -1.3]]), zz, { layer: 3 }); b.stroke(T([[1.4, 1.2], [1.5, -1.4], [0.5, -1.4]]), zz, { layer: 3 });
      b.blot(fx + -1.9 * sc * dirX, fy + 8.2 * sc, zz, 0.3 * sc, 4);                                    // the eye is a dot
    }
    b.use(0);
    return { part, beak: [fx - 3.9 * sc * dirX, fy + 6.6 * sc, z - 0.6] };
  };
  const SZ1 = 21, SZ2 = -18;                                 // front faces of the two serpent plates
  const PIN1 = [-27, 114], PIN2 = [27, 114];
  // perch arms
  b.plate([[CXa, YC + 2], [CXa - 12, YC + 5], [CXa - 12.6, YC + 6.6], [CXa - 11, YC + 7], [CXa, YC + 5.4]], { z: SZ1, depth: 3, col: K.gold });
  const fal1 = falcon(CXa - 10.6, YC + 7, SZ1 - 0.9, 1, 1.15);
  const FX2 = PIN2[0] - 15.5 - 3.9;                           // falcon 2 stands so its beak is over the raised jaws
  b.plate([[TX0 + PW, YC - 18], [FX2 + 1.6, YC - 16], [FX2 + 2.2, YC - 14.4], [FX2 + 0.6, YC - 14], [TX0 + PW, YC - 15]], { z: SZ2, depth: 3, col: K.gold });
  const fal2 = falcon(FX2, YC - 14, SZ2 - 0.9, -1, 1.0);
  await tick();

  // ---- serpents: 46 m, vermilion with hook-row scales and gold jaws, coiled once round the pin ------
  const SEAT = [-15.5, 11];                                  // where the ball sits in the jaws, from the pin
  const serpent = (pin, z, armFrom) => {
    b.plate([[armFrom, pin[1] - 2], [pin[0], pin[1] - 1.5], [pin[0], pin[1] + 1.5], [armFrom, pin[1] + 2]], { z: z - 3.4, depth: 1.2, col: K.green });
    const part = S.newPart([pin[0], pin[1], z], 0); b.use(part);
    const ctrl = [[-12.6, 7.4], [-8.6, 9.3], [-3, 8.5], [3.24, 4.56]];
    for (let i = 1; i <= 12; i++) { const a = 0.953 - i * (TAU * 1.12 / 12), r = 5.6 - 3.5 * i / 12; ctrl.push([Math.cos(a) * r, Math.sin(a) * r]); }
    const sp = bandPts(ctrl.map((p) => [p[0] + pin[0], p[1] + pin[1]]), 4.4, 0.8, 5, 4);
    b.plate(sp.all, { z, depth: 1.6, col: K.red, kind: 2, uvFlip: true, miss: 0.6, corner: 75 });
    const H = [pin[0] - 12.9, pin[1] + 7.6];                // jaw hinge
    const P = (pts) => pts.map((p) => [H[0] + p[0], H[1] + p[1]]);
    // head: a vermilion skull with a crest, and two gold jaws open on the ball
    b.plate(P([[0.2, -3.8], [3.2, -3.4], [5.2, -1.2], [5, 2], [7, 5.8], [3.8, 4.4], [1.6, 3.6], [-0.6, 1.4], [-1.4, -1.2]]), { z: z + 0.5, depth: 0, col: K.red, layer: 1, corner: 50 });
    b.plate(P([[-0.2, 1.2], [-0.9, 5.6], [-0.3, 9.6], [1.2, 11.8], [2.2, 10.4], [2.4, 6.4], [3.2, 2.6], [1.2, 0.2]]), { z: z + 0.9, depth: 0, col: K.gold, layer: 2, corner: 50 });   // upper jaw
    b.plate(P([[-0.8, -0.2], [-5, -0.1], [-8.4, 0.5], [-10.6, -0.4], [-9.2, -2], [-5, -2.6], [-1.4, -3.2], [0.6, -1.6]]), { z: z + 0.9, depth: 0, col: K.gold, layer: 2, corner: 50 });  // lower jaw
    for (let k = 0; k < 4; k++) { b.fill(P([[-0.5, 3.0 + k * 1.7], [-1.7, 3.8 + k * 1.7], [-0.6, 4.3 + k * 1.7]]), z + 0.9, K.ink, { layer: 5 }); b.fill(P([[-2.5 - k * 1.7, 0], [-3.3 - k * 1.7, 1.2], [-3.8 - k * 1.7, 0.1]]), z + 0.9, K.ink, { layer: 5 }); }
    b.plate(circlePts(H[0] + 2.7, H[1] + 0.2, 1.1, 10), { z: z + 0.9, depth: 0, col: K.gold, layer: 2 });
    b.stroke(P(curvePts([[5.2, 1.6], [7.6, 3.2], [8.2, 6], [6.6, 7.4]], 3)), z + 0.5, { layer: 4 });                                // the crest curls back
    b.blot(H[0] + 2.7, H[1] + 0.2, z + 0.9, 0.42, 5);
    b.use(0);
    b.plate(circlePts(pin[0], pin[1], 1.5, 12), { z: z + 1.2, depth: 0, col: K.gold, layer: 3 });        // the pin head
    b.blot(pin[0], pin[1], z + 1.2, 0.35, 7);
    return part;
  };
  const pS1 = serpent(PIN1, SZ1, TX0), pS2 = serpent(PIN2, SZ2, TX1 - PW);
  // a small scoop wheel in the tower lifts water to the cistern: a full circle of pots facing us on an axle lying in
  // its own plane (his error, built as an object), turning under the falcon's perch beside the way out
  const WH = [-4.5, 124.5, SZ2 + 1.8], pNoria = S.newPart(WH, 0);
  b.plate(rectPts(TX0 + PW, WH[1] - 0.55, WH[0] + 11, WH[1] + 0.55), { z: WH[2] - 2.6, depth: 0.8, col: K.gold });
  b.plate(rectPts(WH[0] + 9.6, WH[1] - 1.4, WH[0] + 11.4, YC - 17.5), { z: WH[2] - 2.4, depth: 1.2, col: K.green });
  await tick();
  b.use(pNoria);
  b.plate(circlePts(WH[0], WH[1], 7, 30), { z: WH[2], depth: 1.6, col: K.red, holes: [circlePts(WH[0], WH[1], 5.5, 26)], miss: 0.5, corner: 80 });
  for (let k = 0; k < 4; k++) {
    const a = k * Math.PI / 4, c = Math.cos(a), sn = Math.sin(a), w = 0.42, r = 5.6;
    b.plate([[WH[0] - c * r + sn * w, WH[1] - sn * r - c * w], [WH[0] + c * r + sn * w, WH[1] + sn * r - c * w], [WH[0] + c * r - sn * w, WH[1] + sn * r + c * w], [WH[0] - c * r - sn * w, WH[1] - sn * r + c * w]], { z: WH[2] - 0.3, depth: 1, col: K.gold, corner: 30 });
  }
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * TAU, c = Math.cos(a), sn = Math.sin(a), px = WH[0] + c * 8.3, py = WH[1] + sn * 8.3;
    const T = (pts) => pts.map((p) => [px + p[0] * c - p[1] * sn, py + p[0] * sn + p[1] * c]);
    b.plate(T([[-1.2, -1.6], [1.2, -1.6], [1.5, 0.3], [1, 1.7], [1.4, 2.2], [-1.4, 2.2], [-1, 1.7], [-1.5, 0.3]]), { z: WH[2] + 0.4, depth: 1.4, col: K.green, corner: 40 });
    b.plate(T([[-0.9, 0.2], [0.9, 0.2], [0.75, 1.6], [-0.75, 1.6]]), { z: WH[2] + 0.42, depth: 0, col: K.blue, layer: 2, ink: false });
  }
  b.plate(circlePts(WH[0], WH[1], 1.4, 12), { z: WH[2] + 0.3, depth: 2.2, col: K.gold }); b.blot(WH[0], WH[1], WH[2] + 0.3, 0.5, 6);
  b.use(0);
  const seat1 = [PIN1[0] + SEAT[0], PIN1[1] + SEAT[1], SZ1 - 0.8], seat2 = [PIN2[0] + SEAT[0], PIN2[1] + SEAT[1], SZ2 - 0.8];
  // the vase on the shoulder (serpent 1) and the trough head (serpent 2), each under the tipped jaws
  const tipAt = (pin) => { const a = Math.atan2(SEAT[1], SEAT[0]) + 70 * Math.PI / 180, r = Math.hypot(SEAT[0], SEAT[1]); return [pin[0] + Math.cos(a) * r, pin[1] + Math.sin(a) * r]; };
  const tip1 = tipAt(PIN1), tip2 = tipAt(PIN2);
  const vase = (x, y, z, c) => {
    const v = [[-1.8, 0], [1.8, 0], [2.2, 0.7], [1.5, 1.2], ...curvePts([[2.4, 1.6], [3.9, 2.8], [3.6, 4.2], [2.9, 4.8]], 3), [3.5, 5.3], [-3.5, 5.3], [-2.9, 4.8], ...curvePts([[-3.6, 4.2], [-3.9, 2.8], [-2.4, 1.6]], 3), [-1.5, 1.2], [-2.2, 0.7]];
    b.plate(movePts(v, x, y), { z, depth: 3, col: c, miss: 0.5, corner: 62 });
    b.stroke([[x - 3.4, y + 4.1], [x + 3.4, y + 4.1]], z, { layer: 3 }); b.stroke([[x - 3.4, y + 4.1], [x + 3.4, y + 4.1]], z - 3, { layer: 3 });
  };
  vase(tip1[0], YB, SZ1 + 0.6, K.green);
  vase(tip2[0], YB, SZ2 - 0.6, K.green);
  b.plan = true;                                             // the trough head: a short open channel leaving the back
  b.plate(rectPts(tip2[0] - 3.4, -34, tip2[0] + 3.4, SZ2 - 3.6), { z: YB + 1.2, depth: 1.2, col: K.red });
  b.fill(rectPts(tip2[0] - 2.4, -34, tip2[0] + 2.4, SZ2 - 3.6), YB + 1.2, K.blue, { kind: 1, flow: 1.6, uvRot: Math.PI / 2, layer: 1 });
  b.plan = false;
  // the canopy's cistern pours into the trough head as a ruled sheet (falling water is this page's weather): a gold lip
  // out of the back of the canopy, the sheet beside the way out
  b.plate([[tip2[0] - 3.8, YC + 0.4], [tip2[0] + 3.8, YC + 0.4], [tip2[0] + 3.8, YC + 3], [tip2[0] + 3, YC + 3], [tip2[0] + 3, YC + 1.4], [tip2[0] - 3, YC + 1.4], [tip2[0] - 3, YC + 3], [tip2[0] - 3.8, YC + 3]], { z: ZB - 2, depth: 10, col: K.gold, corner: 40 });
  b.plate(rectPts(tip2[0] - 2.8, YB + 1.3, tip2[0] + 2.8, YC + 1.4), { z: ZB - 11.4, depth: 0, col: K.blue, kind: 1, flow: 6.5, uvRot: Math.PI / 2, layer: 1 });
  await tick();

  // ---- the tank: cut open front and back on scallop-ruled azurite, its top drawn too -----------------
  const TK = { x0: -44, x1: 36, y0: 26, y1: 50, zf: 10, zb: -7, wl: 47, t: 1.6 };
  const ves = [[TK.x0, TK.y1], [TK.x0, TK.y0], [TK.x1, TK.y0], [TK.x1, TK.y1], [TK.x1 - TK.t, TK.y1], [TK.x1 - TK.t, TK.y0 + TK.t], [TK.x0 + TK.t, TK.y0 + TK.t], [TK.x0 + TK.t, TK.y1]];
  b.plate(ves, { z: TK.zf, depth: TK.zf - TK.zb, col: K.red, miss: 0.8 });
  const wat = rectPts(TK.x0 + TK.t, TK.y0 + TK.t, TK.x1 - TK.t, TK.wl);
  b.fill(wat, TK.zf - 0.3, K.blue, { kind: 1, flow: 0.7 }); b.fill(wat, TK.zb + 0.3, K.blue, { kind: 1, flow: 0.7 });
  for (const z of [TK.zf - 0.3, TK.zb + 0.3]) b.stroke([[TK.x0 + TK.t, TK.wl], [TK.x1 - TK.t, TK.wl]], z, { over: false });
  b.plan = true; b.fill(rectPts(TK.x0 + TK.t, TK.zb + 0.3, TK.x1 - TK.t, TK.zf - 0.3), TK.wl, K.blue, { kind: 1, flow: 0.7 }); b.plan = false;
  for (const x of [TK.x0 + 5, -7, TK.x1 - 11]) b.plate(rectPts(x, 24, x + 6, TK.y0), { z: TK.zf - 1, depth: TK.zf - TK.zb - 2, col: K.red });
  // the tank's two ends are cut open as well: the camera comes in through the chest facing the head end
  for (const [x, e] of [[TK.x0, -0.06], [TK.x1, 0.06]]) {
    const q = [[x + e, TK.y0 + TK.t, TK.zb + TK.t], [x + e, TK.y0 + TK.t, TK.zf - TK.t], [x + e, TK.wl, TK.zf - TK.t], [x + e, TK.wl, TK.zb + TK.t]];
    b.quad(q[0], q[1], q[2], q[3], K.blue, { kind: 1, flow: 0.7, layer: 1 });
    for (let k = 0; k < 4; k++) b.ribbon([q[k], q[(k + 1) % 4]], { layer: 3 });
  }
  // the water's top, an oval plate hinged up above the section (his error, built as an object)
  const OV = arcPts((TK.x0 + TK.x1) / 2, 57.4, 38.5, 5.2, 0, TAU * (63 / 64), 63);
  b.plate(OV, { z: TK.zf, depth: 0.8, col: K.blue, kind: 1, flow: -0.5, corner: 80 });
  for (const x of [-30, -4, 22]) b.plate(rectPts(x - 1.2, TK.y1 - 0.4, x + 1.2, 53.4), { z: TK.zf + 0.4, col: K.gold, layer: 2 });
  // inlet: a vermilion pipe with a verdigris funnel, its blue column cut open, feeding the tank's far end
  b.plate(rectPts(-41.4, TK.wl + 1.5, -38, 63.4), { z: TK.zf - 2, depth: 3, col: K.red });
  b.fill(rectPts(-40.4, TK.wl, -39, 63), TK.zf - 1.9, K.blue, { kind: 1, flow: 2.2, uvRot: Math.PI / 2, layer: 2 });
  b.plate([[-43.2, 63.6], [-36.2, 63.6], [-38.2, 60], [-41.2, 60]], { z: TK.zf - 1.6, depth: 3.8, col: K.green });
  // float on a rod at the tail end (bobs)
  const pFloat = S.newPart([0, 0, 0], 0); b.use(pFloat);
  for (const z of [TK.zf + 0.5, TK.zb - 0.5]) { b.plate(circlePts(-28, TK.wl + 0.6, 2.2, 28), { z, col: K.gold, layer: 2 }); b.stroke([[-28, TK.wl + 2.8], [-28, TK.wl + 9]], z, { layer: 3 }); b.plate(rectPts(-29.4, TK.wl + 9, -26.6, TK.wl + 10.2), { z, col: K.green, layer: 2 }); }
  // the pierced bowl, 14 m across: side and full round mouth together; it sinks, and its string runs up the shaft
  const BWX = -8, RIM = 49.2, pBowl = S.newPart([BWX, RIM, 0], 0); b.use(pBowl);
  const hull = [...arcPts(BWX, RIM, 7, 7.4, Math.PI, TAU, 30), ...arcPts(BWX, RIM, 7, 2.5, 0, Math.PI, 22).slice(1, -1)];
  for (const [z, s] of [[TK.zf + 0.9, 1], [TK.zb - 0.9, -1]]) {
    b.plate(hull, { z, col: K.gold, layer: 2, corner: 50 });
    b.plate(arcPts(BWX, RIM, 6, 1.8, 0, TAU * (35 / 36), 35), { z: z + 0.2 * s, col: K.paper, kind: 3, layer: 4, corner: 80 });
    b.stroke(arcPts(BWX, RIM, 7, 2.5, Math.PI, TAU, 22), z, { layer: 5 });
    for (let k = 0; k < 3; k++) b.stroke(arcPts(BWX, RIM - 0.3, 6.4 - k * 1.5, 6.6 - k * 1.6, Math.PI * 1.12, Math.PI * 1.88, 20), z, { layer: 5 });
    b.blot(BWX, RIM - 6.5, z, 0.6, 6);                                                         // the piercing
    b.stroke([[BWX - 6, RIM], [BWX, RIM + 5.4], [BWX + 6, RIM]], z, { layer: 5, corner: 20 }); // bridle to the string
  }
  b.use(0);
  const PUL = [BWX + 2.7, 138, 1.5], pPulley = S.newPart(PUL, 0), pSlack = S.newPart([0, 0, 0], 0);
  b.ribbon([[BWX, RIM + 5.4, 1.5], [BWX, 96, 1.5], [BWX, PUL[1], 1.5]], { parts: [pBowl, pSlack, 0] });
  b.ribbon([[PUL[0] + 2.2, PUL[1] + 1.6, 1.5], [fal2.beak[0] - 8, YC - 12.4, SZ2 - 1]]);                // on to the falcon's tail
  b.ribbon([[PUL[0] - 0.8, PUL[1], 1.5], [PUL[0] - 0.8, YC - 4, 1.5]]); b.ribbon([[PUL[0] + 0.8, PUL[1], 1.5], [PUL[0] + 0.8, YC - 4, 1.5]]);
  b.use(pPulley);
  b.plate(circlePts(PUL[0], PUL[1], 2.7, 28), { z: 2.1, depth: 1.2, col: K.gold });
  for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; for (const z of [2.1, 0.9]) b.stroke([[PUL[0] - Math.cos(a) * 2.5, PUL[1] - Math.sin(a) * 2.5], [PUL[0] + Math.cos(a) * 2.5, PUL[1] + Math.sin(a) * 2.5]], z, { layer: 3 }); }
  b.use(0);
  await tick();

  // ---- THE END ELEVATIONS: the same machine as the engineer drew it seen from the head ------------------
  // (plates facing -X: b.end, u = local z, v = y, offset = -x). The viewer comes in under the trunk and through
  // the cut chest, so the slab's front, the tank's head end and the room's end wall each carry a drawing.
  b.end = true;
  const pHCol = S.newPart([0, 0, 0], 0);
  // a standpipe in end elevation: vermilion pipe cut open on its blue column (scallops climbing), verdigris funnel
  const endPipe = (u, v0, h, xo) => {
    const hole = rectPts(u - 1.05, v0 + 1.4, u + 1.05, v0 + h - 1);
    b.plate(rectPts(u - 1.9, v0, u + 1.9, v0 + h), { z: xo, depth: 2.2, col: K.red, holes: [hole], miss: 0.5, holeWalls: false });
    b.fill(hole, xo - 0.5, K.paper, { kind: 3 });
    b.use(pHCol); b.fill(rectPts(u - 1.05, v0 - 5, u + 1.05, v0 + h * 0.6), xo - 0.3, K.blue, { kind: 1, flow: -2.5, uvRot: Math.PI / 2, layer: 1 });
    b.stroke([[u - 1.05, v0 + h * 0.6], [u + 1.05, v0 + h * 0.6]], xo - 0.3, { layer: 3, over: false, feat: 6 }); b.use(0);
    b.plate([[u - 1.9, v0 + h], [u + 1.9, v0 + h], [u + 4, v0 + h + 3.4], [u - 4, v0 + h + 3.4]], { z: xo + 0.4, depth: 3, col: K.green, corner: 30 });
    b.plate(rectPts(u - 2.7, v0, u + 2.7, v0 + 1.2), { z: xo + 0.4, depth: 3, col: K.gold });
  };
  // the slab's front: a gold breast band with studs and a tassel row, knee hooks, toenails, two standpipes,
  // and the tank's overflow falling from the chest sill as a ruled sheet
  const XF = -CH.x + 0.35;
  b.plate(rectPts(ZB, 23.2, ZF, 27.6), { z: XF, col: K.gold, miss: 0.6, layer: 1 });
  for (let k = 0; k < 14; k++) b.plate(circlePts(-19.5 + k * 3, 25.4, 0.9, 8), { z: XF + 0.2, col: k % 2 ? K.red : K.green, layer: 3 });
  const nTf = Math.round(26 * detail);
  for (let k = 0; k < nTf; k++) {
    const u = ZB + 1 + (k + 0.5) * (ZF - ZB - 2) / nTf; if (Math.abs(u) < 7.4) continue;
    b.plate([[u, 23.4], [u + 0.8, 21.8], [u + 0.65, 19.6], [u - 0.65, 19.6], [u - 0.8, 21.8]], { z: XF, col: k % 2 ? K.gold : K.red, corner: 30 });
  }
  await tick();
  for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) b.stroke(arcPts(s * (5.1 + 6.2 * k), 0.2, 2.6, 3.2, 0.15, Math.PI - 0.15, 6), XF + 0.1, { over: false });
    for (let k = 0; k < 3; k++) b.fill(rectPts(s * 11 - 4.2 + k * 0.6, 10.8 + k * 2.4, s * 11 + 4.2 - k * 0.6, 12 + k * 2.4), XF, hide, { kind: 2, layer: 1.5 });
    for (let k = 0; k < 2; k++) b.stroke(arcPts(s * 11, 8.6 - k * 2.2, 5, 1.1, Math.PI * 1.1, Math.PI * 1.9, 5), XF);
    endPipe(s * 17.2, 0, 20, XF + 3.2);
  }
  for (let k = 0; k < 7; k++) b.fill(rectPts(-19 + (k % 3) * 2.4, 62.4 + k * 4.8, 19 - ((k + 1) % 3) * 3, 63.6 + k * 4.8), XF - 0.2, hide, { kind: 2, layer: 1.5 });   // the brow over the chest: wrinkle rows
  b.plate([[-6.6, 30.6], [6.6, 30.6], [6.6, 28.2], [5.4, 27.4], [-5.4, 27.4], [-6.6, 28.2]], { z: XF + 2.6, depth: 2.6, col: K.gold, corner: 40 });   // the lip
  b.plate(rectPts(-5.4, 0.6, 5.4, 27.8), { z: XF + 1.6, depth: 0, col: K.blue, kind: 1, flow: 6.5, uvRot: Math.PI / 2, layer: 1 });               // the fall
  // the chest's floor carries the overflow to the sill: a plan lying level, two vermilion banks
  b.end = false; b.plan = true;
  b.plate(rectPts(CH.x - 0.4, -5.4, -46, 5.4), { z: CH.y0 + 0.3, depth: 0, col: K.blue, kind: 1, flow: 4.5, layer: 1 });
  for (const s of [-1, 1]) b.plate(rectPts(CH.x - 0.4, s * 6.1 - 0.7, -46, s * 6.1 + 0.7), { z: CH.y0 + 0.5, depth: 0, col: K.red, layer: 2, ink: false });
  // the canopy holds the cistern, and its water is drawn in plan under the fringe: looking up the shaft one sees it run
  b.plate(arcPts((TX0 + TX1) / 2, 0, 26, 15, 0, TAU * (39 / 40), 39), { z: YC - 4.9, depth: 0, col: K.blue, kind: 5, flow: 1.5, corner: 80 });
  b.plan = false;
  // the shaft: the room's vermilion band round its foot and its lip, and two standpipes against its back wall
  for (const z of [SH.z0 + 0.06, SH.z1 - 0.06]) for (const [v0, v1] of [[64, 66.2], [93.8, 96]]) {
    b.quad([SH.x0, v0, z], [SH.x1, v0, z], [SH.x1, v1, z], [SH.x0, v1, z], K.red, { layer: 1 });
    const vi = v0 === 64 ? v1 : v0; b.ribbon([[SH.x0, vi, z], [SH.x1, vi, z]], { layer: 2 });
  }
  endPipe(-8.5, 64, 26, SH.z0 + 2.8); endPipe(30.5, 64, 26, SH.z0 + 2.8);
  b.end = true;
  await tick();
  // the tank's head end: the bowl again (side and round mouth together), its string, and the water's top hinged up
  const XT0 = -TK.x0 + 0.5, BU = 1.5;
  b.plate(arcPts(BU, 57.2, 8.2, 3.5, 0, TAU * (31 / 32), 31), { z: XT0 - 0.2, depth: 0.6, col: K.blue, kind: 1, flow: -0.5, corner: 80 });
  for (const s of [-1, 1]) b.plate(rectPts(BU + s * 5 - 0.9, TK.y1 - 0.4, BU + s * 5 + 0.9, 54.4), { z: XT0, col: K.gold, layer: 2 });
  b.use(pBowl);
  b.plate([...arcPts(BU, RIM, 7, 7.4, Math.PI, TAU, 30), ...arcPts(BU, RIM, 7, 2.5, 0, Math.PI, 22).slice(1, -1)], { z: XT0 + 0.3, col: K.gold, layer: 2, corner: 50 });
  b.plate(arcPts(BU, RIM, 6, 1.8, 0, TAU * (35 / 36), 35), { z: XT0 + 0.5, col: K.paper, kind: 3, layer: 4, corner: 80 });
  b.stroke(arcPts(BU, RIM, 7, 2.5, Math.PI, TAU, 22), XT0 + 0.3, { layer: 5 });
  for (let k = 0; k < 3; k++) b.stroke(arcPts(BU, RIM - 0.3, 6.4 - k * 1.5, 6.6 - k * 1.6, Math.PI * 1.12, Math.PI * 1.88, 20), XT0 + 0.3, { layer: 5 });
  b.blot(BU, RIM - 6.5, XT0 + 0.3, 0.6, 6);
  b.stroke([[BU - 6, RIM], [BU, RIM + 5.4], [BU + 6, RIM]], XT0 + 0.3, { layer: 5, corner: 20 });
  b.use(0);
  b.ribbon([[-XT0 - 0.3, RIM + 5.4, BU], [-XT0 - 0.3, 64, BU]], { parts: [pBowl, 0] });
  endPipe(15.8, 24, 29, XT0 + 0.7);
  // the chest passage: standpipes along its sides, and the vermilion band the room is framed with carried along both walls
  endPipe(-17, CH.y0, 21.4, 71.5); endPipe(17, CH.y0, 21.4, 71.5); endPipe(17, CH.y0, 21.4, 58);
  b.end = false;
  for (const z of [CH.z0 + 0.06, CH.z1 - 0.06]) for (const [v0, v1] of [[CH.y0, CH.y0 + 4.8], [CH.y1 - 3.6, CH.y1]]) {
    b.quad([CH.x, v0, z], [-46, v0, z], [-46, v1, z], [CH.x, v1, z], K.red, { layer: 1, kind: 2 });      // hook rows, as on a robe
    const vi = v0 === CH.y0 ? v1 : v0; b.ribbon([[CH.x, vi, z], [-46, vi, z]], { layer: 2 });
  }
  // and between the two bands a gold border of lozenges, as on the saddle carpet, runs the length of both walls
  await tick();
  for (const z of [CH.z0 + 0.06, CH.z1 - 0.06]) {
    const vm = (CH.y0 + CH.y1) / 2 + 1, hb = 3.4;
    b.quad([CH.x, vm - hb, z], [-46, vm - hb, z], [-46, vm + hb, z], [CH.x, vm + hb, z], K.gold, { layer: 1 });
    for (const v of [vm - hb, vm + hb]) b.ribbon([[CH.x, v, z], [-46, v, z]], { layer: 2 });
    let k = 0;
    for (let x = CH.x + 6; x < -50; x += 9.2, k++) {
      const q = [[x - 3.6, vm, z], [x, vm - 2.5, z], [x + 3.6, vm, z], [x, vm + 2.5, z]];
      b.quad(q[0], q[1], q[2], q[3], k % 2 ? K.green : K.red, { layer: 2 });
      b.ribbon([...q, q[0]], { layer: 3 });
    }
  }
  b.end = true;
  // the room's end wall: the tank's outflow in section (a small vessel with its top hinged up, a spout pouring a
  // ruled ribbon, a float whose rod carries a toothed wheel that turns)
  const XE = -45.4, pGear = S.newPart([-XE - 0.5, 56, -15.4], 2);
  {
    const u0 = -20.6, u1 = -4.4, v0 = 26, v1 = 43, t = 1.5;
    b.plate(rectPts(u0, v0, u1, v1), { z: XE, depth: 0, col: K.red, holes: [rectPts(u0 + t, v0 + t, u1 - t, v1 - 0.6)], miss: 0.7 });
    b.plate(rectPts(u0 + t, v0 + t, u1 - t, v1 - 2.6), { z: XE + 0.1, depth: 0, col: K.blue, kind: 1, flow: 0.5, layer: 1, corner: 60 });
    b.plate(arcPts((u0 + u1) / 2, v1 + 4.4, 7.4, 2.9, 0, TAU * (23 / 24), 23), { z: XE + 0.1, depth: 0, col: K.blue, kind: 1, flow: 0.5, corner: 80 });
    b.plate([[-3.6, 60.6], [-9.8, 60.6], [-9.8, 57.2], [-8.2, 57.2], [-8.2, 59], [-3.6, 59]], { z: XE + 0.7, depth: 0.7, col: K.gold, corner: 40 });
    b.plate(rectPts(-9.9, 45, -8.3, 57.2), { z: XE + 0.4, depth: 0, col: K.blue, kind: 1, flow: 5.5, uvRot: Math.PI / 2, layer: 2 });
    b.plate([...arcPts(-15.4, 40.4, 2.6, 2, Math.PI, TAU, 8)], { z: XE + 0.3, depth: 0, col: K.gold, layer: 2, corner: 50 });
    b.stroke([[-15.4, 40.4], [-15.4, 51.4]], XE + 0.3, { layer: 4 });
    b.use(pGear);
    b.plate(circlePts(-15.4, 56, 4.4, 20), { z: XE + 0.5, depth: 0, col: K.gold, layer: 2 });
    for (let k = 0; k < 16; k++) { const a = (k / 16) * TAU, a1 = a + TAU / 32, a2 = a + TAU / 16, C = (r, q) => [-15.4 + Math.cos(q) * r, 56 + Math.sin(q) * r]; b.fill([C(4.3, a), C(5.9, a1), C(4.3, a2)], XE + 0.5, K.ink, { layer: 4 }); }
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3; b.stroke([[-15.4 - Math.cos(a) * 4, 56 - Math.sin(a) * 4], [-15.4 + Math.cos(a) * 4, 56 + Math.sin(a) * 4]], XE + 0.5, { layer: 4, over: false }); }
    b.use(0); b.blot(-15.4, 56, XE + 0.5, 0.6, 6);
  }
  b.end = false;
  await tick();

  // ---- the three automaton men: robe, turban and plain gold disc, no face on any side ---------------
  const man = (x, y, z, sc, dir) => {
    const T = (pts) => pts.map((p) => [x + p[0] * sc * dir, y + p[1] * sc]);
    b.plate(circlePts(x, y + 14.2 * sc, 4.3 * sc, 20), { z: z - 0.7, depth: 0.5, col: K.gold });           // the disc behind the head
    b.plate(T([[-6, 0], [6, 0], [5.2, 3], [3.8, 8], [3.3, 11.6], [-3.3, 11.6], [-3.8, 8], [-5.2, 3]]), { z, depth: 2, col: K.red, kind: 2, uvFlip: true, miss: 0.6 });
    for (const zz of [z + 0.3, z - 2.3]) {
      const tb = T([...arcPts(0, 14.1, 2.9, 2.5, -0.5, Math.PI + 0.5, 10), [-1.6, 11.4], [1.6, 11.4]]);
      b.plate(tb, { z: zz, col: K.paper, kind: 3, layer: 2, corner: 50 });
      for (let k = 0; k < 3; k++) b.stroke(T(arcPts(0.4 - k * 0.5, 12.6 + k * 1.1, 2.6 - k * 0.5, 1.5, 0.3, Math.PI - 0.5, 5)), zz, { layer: 5 });
      b.stroke(T([[-3.3, 9.6], [3.3, 9.6]]), zz, { layer: 3 }); b.stroke(T([[-4.4, 5.4], [4.4, 5.4]]), zz, { layer: 3 });   // sash and hem lines
    }
    return T;
  };
  // drummer on the neck: his mallet arm falls on a kettledrum
  const DR = [-61, 97.4, 9];
  const Td = man(DR[0], DR[1], DR[2], 1, 1);
  b.plate(Td([...arcPts(-10.4, 5.6, 3.3, 4.4, Math.PI, TAU, 8), [-7.1, 6.4], [-13.7, 6.4]]), { z: DR[2] + 0.6, depth: 2.4, col: K.gold, corner: 50 });
  const pMallet = S.newPart([DR[0] - 3, DR[1] + 10.4, DR[2]], 0); b.use(pMallet);
  b.plate(Td([[-2.4, 11], [-3.4, 9.6], [-7.6, 11.4], [-7.2, 12.8]]), { z: DR[2] + 0.5, depth: 1.2, col: K.red });
  b.stroke(Td([[-7.2, 12], [-11.6, 14.2]]), DR[2] + 0.5); b.plate(circlePts(DR[0] - 12.2, DR[1] + 14.5, 1.1, 9), { z: DR[2] + 0.5, depth: 1.2, col: K.green });
  b.use(0);
  // scribe behind the tower: his pen turns one notch over a blind dial (ticks only, nothing written)
  const SC = [53, YB, 0];
  const Ts = man(SC[0], SC[1], SC[2], 0.95, -1);
  const DIAL = [SC[0] - 9.6, SC[1] + 0.4];
  b.plate([...arcPts(DIAL[0], DIAL[1], 6.4, 6.4, 0, Math.PI, 14)], { z: 1.2, depth: 2.4, col: K.paper, kind: 3, corner: 60 });
  for (let k = 1; k < 12; k++) { const a = k * Math.PI / 12; for (const z of [1.2, -1.2]) b.stroke([[DIAL[0] + Math.cos(a) * 5, DIAL[1] + Math.sin(a) * 5], [DIAL[0] + Math.cos(a) * 6.2, DIAL[1] + Math.sin(a) * 6.2]], z, { layer: 3, over: false }); }
  const pPen = S.newPart([DIAL[0], DIAL[1], 0], 0); b.use(pPen);
  b.plate([[DIAL[0] - 0.5, DIAL[1]], [DIAL[0] + 0.5, DIAL[1]], [DIAL[0] + 0.25, DIAL[1] + 5.6], [DIAL[0] - 0.25, DIAL[1] + 5.6]], { z: 1.6, depth: 3.2, col: K.gold, layer: 2, corner: 30 });
  b.use(0);
  man(DCX, YBal, 21.5, 0.9, 1);                                                                 // the watcher on the canopy ledge
  await tick();

  // ---- assemble ------------------------------------------------------------------------------------
  // (drawn last, so the seeded choices above keep their draws) seen from behind and above (the turn at the tower's back) the shoulder and the back of the head carry the hide's wrinkles as
  // reed strokes, which never thin away as the hook rows do from across the page
  b.use(0);
  for (let k = 0; k < 6; k++) { b.stroke(arcPts(-74, 61 + k * 5.4, 13 - k * 0.8, 2.4, Math.PI * 0.12, Math.PI * 0.88, 6), ZB - 0.06, { over: false }); b.stroke(arcPts(-101, 70 + k * 5.2, 9 - k * 0.5, 2, Math.PI * 0.12, Math.PI * 0.88, 5), ZH - 0.08, { over: false }); }
  const mesh = b.build(); mesh.name = 'elephant-plates'; root.add(mesh);
  await tick();
  const balls = makeBalls(S, 8); if (opts.balls !== false) root.add(balls.mesh);
  if (opts.paper !== false) root.add(makePaperDome(S, { flat: 900, rise: 900 }));
  await tick();

  // ---- the chain of cause: every event is a function of progress u (0..1 of the world's path) --------
  const EV = { ballA: [0, 0.05], serp1Down: [0.05, 0.09], vaseA: [0.105, 0.125], drumA: 0.125, serp1Up: [0.17, 0.24], bowlUp: [0.17, 0.22],
    nextBall: [0.2, 0.27], rimUnder: 0.46, falcon2: [0.462, 0.475], ballB: [0.47, 0.497], serp2Down: [0.5, 0.54], letGo: [0.6, 0.615],
    troughHead: [0.615, 0.64], drumB: 0.615, serp2Up: [0.66, 0.72] };
  const A70 = 70 * Math.PI / 180, seg = (u, a, c) => clamp((u - a) / (c - a), 0, 1), BR = 2.5;
  const swing = (u, d, r) => A70 * (overshoot(seg(u, d[0], d[1])) - overshoot(seg(u, r[0], r[1])));
  const inJaws = (pin, a) => { const c = Math.cos(a), s = Math.sin(a); return [pin[0] + c * SEAT[0] - s * SEAT[1], pin[1] + s * SEAT[0] + c * SEAT[1]]; };
  const hour = rng.int(1, 9), pen0 = Math.PI / 2 - (hour + 0.5) * Math.PI / 12;
  const beat = (u, t) => { const x = (u - t) / 0.011; return x <= 0 || x >= 1 ? 0 : x < 0.3 ? overshoot(x / 0.3 * 0.6) : 1 - smoothstep(0.3, 1, x); };
  let progress = -1;
  function apply(u, time) {
    S.uniforms.uTime.value = time;
    const a1 = swing(u, EV.serp1Down, EV.serp1Up), a2 = swing(u, EV.serp2Down, EV.serp2Up);
    S.setPart(pS1, a1); S.setPart(pS2, a2);
    S.setPart(fal1.part, 0.55 * (1 - overshoot(seg(u, 0.004, 0.045))));
    S.setPart(fal2.part, -0.55 * (overshoot(seg(u, EV.falcon2[0], EV.falcon2[1])) - overshoot(seg(u, 0.5, 0.535))));
    // bowl: under at the start, hauled up as serpent 1 returns, sinking slowly, rim under at 0.46, hauled up again
    let off = u < EV.bowlUp[1] ? -7 * (1 - smoothstep(EV.bowlUp[0], EV.bowlUp[1], u))
      : u < EV.rimUnder ? -2.2 * seg(u, EV.bowlUp[1], EV.rimUnder)
        : u < EV.serp2Up[0] ? -2.2 - 4.8 * overshoot(seg(u, EV.rimUnder, EV.rimUnder + 0.03))
          : u < EV.serp2Up[1] ? -7 * (1 - smoothstep(EV.serp2Up[0], EV.serp2Up[1], u)) : -1.6 * seg(u, EV.serp2Up[1], 1);
    off += 0.12 * Math.sin(time * 1.1) * smoothstep(-3, -1, off);
    S.setPart(pBowl, 0, 0, off, 0);
    S.setPart(pSlack, 0, 1.5 * smoothstep(-4.2, -2.3, off), off * 0.5, 0);
    S.setPart(pPulley, off / 2.7);
    S.setPart(pFloat, 0, 0, 0.35 * Math.sin(time * 1.3) + off * 0.04, 0);
    S.setPart(pBird, time * 0.9);
    S.setPart(pNoria, -time * 0.27); S.setPart(pGear, time * 0.6); S.setPart(pHCol, 0, 0, 2.4 * Math.sin(time * 0.6), 0);
    S.setPart(pMallet, 0.9 * Math.max(beat(u, EV.drumA), beat(u, EV.drumA + 0.014), beat(u, EV.drumA + 0.028), beat(u, EV.drumB), beat(u, EV.drumB + 0.014), beat(u, EV.drumB + 0.028)));
    S.setPart(pPen, pen0 - (Math.PI / 12) * (overshoot(seg(u, 0.15, 0.17)) + overshoot(seg(u, 0.625, 0.645))));
    // ball A: in the air at u 0, into the jaws, down with the serpent, into the vase, and away inside it
    const z1 = seat1[2], z2 = seat2[2], rest1 = [tip1[0], YB + 4.6], gone1 = [tip1[0], YB + 2.4];
    if (u < EV.ballA[1]) { const f = 0.3 + 0.7 * seg(u, 0, EV.ballA[1]); balls.set(0, seat1[0], lerp(fal1.beak[1] - 3.4, seat1[1], Math.pow(f, 1.7)), z1, BR * 1.5); }   // a little large, to be seen from the far side of the page
    else if (u < EV.vaseA[0]) { const p = inJaws(PIN1, a1); balls.set(0, p[0], p[1], z1, BR * lerp(1.5, 1, seg(u, 0.05, 0.1))); }
    else { const p = inJaws(PIN1, A70), f = seg(u, EV.vaseA[0], EV.vaseA[1]), g = smoothstep(0.3, 0.345, u);
      balls.set(0, lerp(p[0], rest1[0], f), lerp(lerp(p[1], rest1[1], f * f), gone1[1], g), z1, BR); }
    // the next ball rolls out along the canopy and perch to wait under falcon 1's beak
    { const f = seg(u, EV.nextBall[0], EV.nextBall[1]), hold = [fal1.beak[0] - 0.4, fal1.beak[1] - 3.4];
      const x = lerp(BX0 - 3, hold[0], smoothstep(0, 1, f)), y = lerp(YBal + BR, hold[1], smoothstep(0.55, 1, f));
      balls.set(1, x, y, z1, BR * smoothstep(0, 0.12, f)); }
    // ball B: falcon 2 lets go when the string pulls; jaws; down; out into the trough head and off along it
    const hold2 = [fal2.beak[0] + 0.4, fal2.beak[1] - 3.4];
    if (u < EV.ballB[0]) balls.set(2, hold2[0], hold2[1], z2, BR);
    else if (u < EV.ballB[1]) { const f = seg(u, EV.ballB[0], EV.ballB[1]); balls.set(2, lerp(hold2[0], seat2[0], f), lerp(hold2[1], seat2[1], f * f), z2, BR); }
    else if (u < EV.letGo[0]) { const p = inJaws(PIN2, a2); balls.set(2, p[0], p[1], z2, BR); }
    else if (u < EV.troughHead[1]) { const p = inJaws(PIN2, A70), f = seg(u, EV.letGo[0], EV.letGo[1]), g = seg(u, EV.troughHead[0], EV.troughHead[1]);
      balls.set(2, lerp(p[0], tip2[0], f), lerp(p[1], YB + 1.4 + BR, f * f), lerp(z2, -34, g * g), BR); }
    else balls.hide(2);
  }
  apply(0, 0);

  // helix up the shaft: centre (12, 0), radius 14, three quarters of a turn from the belly line to the open back
  const fly = [[0, 40, 270], [-70, 36, 180], [-130, 32, 112], [-160, 30, 72], [-166, 30, 44], [-152, 30, 29], [-130, 30.5, 24], [-110, 34, 14], [-92, 41, 3], [-74, 44, -8], [-52, 44, -14.5], [-20, 44, -14.5], [12, 44, -14]];
  for (let k = 1; k <= 6; k++) { const a = -Math.PI / 2 + k * Math.PI / 4; fly.push([12 + Math.cos(a) * 14, 44 + k * 10.3, Math.sin(a) * 14]); }
  fly.push([-2, 108.5, -19.5], [-2, 110, -40], [-2, 110, -80]);
  const V = (p) => new THREE.Vector3(p[0], p[1], p[2]);
  const anchors = {
    flyThrough: fly.map(V),                                  // safe camera line, local space, in order (see header)
    entryView: V([0, 40, 520]), revealView: V([0, 40, 280]),
    underTrunk: V([-130, 30.5, 24]), chest: V([CH.x, 42, 1]), bellyLine: [V([-46, 44, -14.5]), V([12, 44, -14])],
    shaft: { center: V([12, 70, 0]), radius: 14, y0: 44, y1: 106 },
    exit: { position: V([-2, 110, -40]), direction: V([0, 0, -1]) },
    troughHead: { position: V([tip2[0], YB + 1.2, -34]), direction: V([0, 0, -1]), width: 6.8, ballAt: EV.troughHead[1], ballRadius: BR },
    window: V([0, 44, ZF]), bowl: V([BWX, RIM, 1.5]), bowlEnd: V([TK.x0 - 0.8, 44, BU]), outflow: V([45.4, 44, -12.5]), tankFaceBack: V([-4, 38, TK.zb]), tankFaceFront: V([-4, 38, TK.zf]),
    serpent1: V([seat1[0], seat1[1], SZ1]), serpent2: V([seat2[0], seat2[1], SZ2]), serpent2Tipped: V([tip2[0], tip2[1], SZ2]),
    falcon1: V(fal1.beak), falcon2: V(fal2.beak), vase: V([tip1[0], YB + 4, SZ1]), drummer: V([DR[0], DR[1] + 12, DR[2]]),
    feet: V([-73, 0, ZF]), feederFoot: V([0, 0, ZF + 8]),      // where the floor channel from the peacock basin should arrive
    events: EV,
  };
  return {
    object: root, radius: 125, height: 186, center: new THREE.Vector3(-8, 84, 0), anchors, style: S, balls,
    copy, hour, buildSteps: steps, triangles: mesh.userData.triangles, inkTriangles: mesh.userData.inkTriangles,
    // the world calls this every frame with its path progress; without it the piece loops the chain every 30 s
    setProgress(u) { progress = u; },
    update(dt, time, camera) {
      apply(progress >= 0 ? progress : (time / 30) % 1, time);
    },
    dispose() {},
    ground: false, groundY: 0,
  };
}
