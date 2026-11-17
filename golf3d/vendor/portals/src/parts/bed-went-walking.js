// THE BED WENT WALKING: hero set piece, after Winsor McCay (a Sunday colour page of about 1908).
// An empty brass bed striding on four jointed brass legs that DRAW OUT (12 m to 180 m), adding collars.
//
// HOW THE STYLE IS MADE (everything is unlit ShaderMaterial; world returns post { flat: 1, bloom 0 }, so a hex
// written is the hex shown; there is NO inverse tone map anywhere):
//   LINE    an even hairline (1.6 px at 720p and under, 0.8 * height / 720 above) near and far. (a) silhouettes: an inverted hull (BackSide copy of the mesh
//           pushed out along its normal by a fixed number of PIXELS in clip space: hullMaterial()); (b) creases and
//           turned rings: the 'crease' vertex attribute, a line wherever it crosses an integer, fwidth-filtered
//           (mcLine); (c) loose marks (cracks): ribbons widened in the vertex shader to 2 px (ribbonMaterial()).
//   TINT    flat pigment per vertex ('color'), never lit.
//   SHADE   the engraver's convention, not light: any face whose WORLD normal looks to starboard (+X) or down gets
//           the same tint ruled over with parallel pen lines about 6 px apart (mcRule): the count of lines is a
//           power of two picked from distance, so lines are added or dropped as you approach, never scaled, and
//           on a round thing they close toward the edge. Under 3 px apart they become their flat mean.
//   REGISTER the tint plate sits STYLE.uReg pixels (default 1.5, 1) up and right of the line plate: inside every
//           lower-left contour a sliver of bare newsprint (mcRegister, from the gradient of N.V). The world adds
//           3 px times path curvature to STYLE.uReg.value each frame; that is "the tints lag their lines".
// EXPORTS for the world coder (shade the whole world with these so the hero is not pasted in):
//   PALETTE            the brief's seven hexes, in order: paper, lemon, salmon, green, powder, night, ink.
//   makeStyle()        the shared uniforms { uRes, uReg, uPxAng, uPaper, uInk, uLine, uTime } of ONE build (never module
//                      state). buildHero makes one (or takes opts.style) and returns it as hero.style; spread it into every
//                      material's uniforms ({ ...style }) so one update drives all. styleUpdate(style, ctx, camera).
//   STYLE_GLSL         fragment chunk: mcLine(v), mcRule(turn, metres, viewZ), mcRegister(Nview, ndv), mcEdgeReg(uv, size),
//                      mcShadeOf(Nworld), mcFinish(tint, ink, reg). Needs '#extension'-free WebGL2 (derivatives built in).
//   STYLE_VERT_GLSL    vertex chunk: mcHull(clip, clipNormalXY, px) pixel-constant outline push.
//   tintMaterial(o)    the page material: attributes position, normal, color, rule (vec2: turn 0..1 across the ruled
//                      direction, metres that one turn spans), crease (float). o.sway adds the quilt-hem swing.
//   hullMaterial(o)    the contour for any mesh with smooth normals (draw the same geometry a second time).
//   ribbonMaterial()   pen ribbons: attributes position (centre), dir (tangent), side (-1/1), open (0..1 along).
//   latheGeo(...), tubeGeo(...) geometry makers that fill color/rule/crease the way tintMaterial expects.
// THE PIECE: buildHero(ctx, opts) -> see the block above buildHero at the end of this file for opts, anchors, cost.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { clamp, lerp, smoothstep } from '../kit/core.js';

export const PALETTE = ['#EFE4C6', '#F3DE7A', '#EE9C82', '#A9C49A', '#A9CBE0', '#2A5078', '#1A1714'];

// the shared uniforms of one build of the page. NOT module state: buildHero makes one per build (or takes opts.style)
// and hands it back as hero.style, so two live worlds never share a resolution, a register or a clock.
export function makeStyle(palette = PALETTE) {
  return {
    uRes: { value: new THREE.Vector2(1280, 720) },      // drawing buffer size, pixels
    uReg: { value: new THREE.Vector2(1.5, 1.0) },       // tint plate offset, pixels (up and right)
    uPxAng: { value: 2 / (1.7 * 720) },                 // metres per pixel at 1 m depth
    uPaper: { value: new THREE.Color(palette[0]) },
    uInk: { value: new THREE.Color(palette[6]) },
    uLine: { value: 0.8 },                              // half width of the pen line, pixels
    uTime: { value: 0 },
  };
}
const _sz = new THREE.Vector2();
export function styleUpdate(style, ctx, camera) {
  if (ctx && ctx.renderer) { ctx.renderer.getDrawingBufferSize(_sz); if (_sz.y > 0) style.uRes.value.copy(_sz); }
  const e5 = camera && camera.projectionMatrix ? camera.projectionMatrix.elements[5] : 1.7;
  style.uPxAng.value = 2 / (Math.max(e5, 0.05) * style.uRes.value.y);
  style.uLine.value = Math.max(0.8, 0.8 * style.uRes.value.y / 720);   // a hairline: 1.6 px at 720p and under, never thinner
}

export const STYLE_VERT_GLSL = /* glsl */`
uniform vec2 uRes; uniform float uLine;
// push a clip-space position outward along a clip-space direction by px pixels (constant on screen, near and far)
vec4 mcHull(vec4 clip, vec2 dirXY, float px){
  float l = length(dirXY);
  vec2 d = l > 1e-6 ? dirXY / l : vec2(0.);
  clip.xy += d * (px * 2.0 / uRes) * max(clip.w, 0.0);
  return clip;
}`;

export const STYLE_GLSL = /* glsl */`
uniform vec2 uRes; uniform vec2 uReg; uniform float uPxAng; uniform vec3 uPaper; uniform vec3 uInk; uniform float uLine; uniform float uTime;
// a pen line wherever v crosses an integer; 2 px wide; closer than 3 px apart it is replaced by its flat mean
float mcLine(float v){
  float f = max(fwidth(v), 1e-6);
  float d = abs(v - floor(v + 0.5)) / f;
  float ln = 1.0 - smoothstep(uLine - 0.5, uLine + 0.5, d);
  float mean = clamp(2.0 * uLine * f, 0.0, 0.34);
  return mix(ln, mean, smoothstep(0.25, 0.34, f));
}
// ruled shade: 'turn' runs 0..1 across the ruled direction and spans 'metres'; lines sit about 6 px apart at this depth
float mcRule(float turn, float metres, float viewZ){
  float want = metres / max(8.5 * uLine * viewZ * uPxAng, 1e-5);
  float n = exp2(floor(log2(clamp(want, 2.0, 4096.0)) + 0.5));
  return mcLine(turn * n);
}
// 1 where the tint plate prints, 0 in the bare sliver inside a lower-left contour (round things: N and N.V in view space)
float mcRegister(vec3 Nv, float ndv){
  float g = max(length(vec2(dFdx(ndv), dFdy(ndv))), 1e-5);
  float dpx = 0.5 * ndv / g;
  float rl = max(length(uReg), 1e-4);
  float nl = length(Nv.xy);
  float facing = nl > 1e-4 ? dot(Nv.xy / nl, -uReg / rl) : 0.0;
  return max(step(rl * max(facing, 0.0) * 1.6, dpx), step(0.5, ndv));     // only near a true contour
}
// the same for a flat face with uv in 0..size (metres or any unit): bare sliver inside its low-u and low-v edges
float mcEdgeReg(vec2 uv, vec2 size){
  vec2 f = max(fwidth(uv), vec2(1e-6));
  vec2 a = uv / f;
  return step(abs(uReg.x), a.x) * step(abs(uReg.y), a.y);
}
// the engraver's rule for what is shaded: looks to starboard, or looks down
float mcShadeOf(vec3 Nw){ return max(step(0.36, Nw.x), step(Nw.y, -0.55)); }
vec3 mcFinish(vec3 tint, float ink, float reg){ return mix(mix(uPaper, tint, reg), uInk, clamp(ink, 0.0, 1.0)); }
`;


// cloth (rule.y < 0): what hangs below y 0 of its mesh swings like a pendulum; uBillow lifts the whole quilt in a travelling swell
const CLOTH_VERT = /* glsl */`
uniform float uSway, uSwayAmp, uBillow;
vec3 clothMove(vec3 p0, vec2 rule){
  vec3 p = p0; float cloth = step(rule.y, -1e-4);
  float hang = uSwayAmp * max(0.0, -p0.y) * cloth;
  p.z += hang * uSway; p.x += hang * 0.35 * sin(uSway * 2.1 + p0.z * 0.4);
  float mid = max(0.0, 1.0 - (p0.x * p0.x) / 90.0);
  p.y += uBillow * cloth * (mid * (2.6 + 1.1 * sin(p0.z * 0.6 + uSway * 3.0)) + 0.5 * sin(p0.z * 1.3 + p0.x * 0.7 + uSway * 4.0));
  return p;
}`;
// The page material. Attributes: position, normal, color (linear tint), rule (turn, metres), crease.
export function tintMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...o.style, uSway: { value: 0 }, uSwayAmp: { value: o.sway || 0 }, uBillow: { value: 0 } },
    side: o.side ?? THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec2 rule; attribute float crease;
      ${CLOTH_VERT}
      varying vec3 vNv, vNw, vVp, vCol; varying vec2 vRule; varying float vCrease, vCloth;
      void main(){
        vec3 p = position;
        p = clothMove(p, rule); vCloth = step(rule.y, -1e-4);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vNv = normalMatrix * normal; vNw = mat3(modelMatrix) * normal; vVp = mv.xyz; vCol = color;
        vRule = vec2(rule.x, abs(rule.y)); vCrease = crease;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      ${STYLE_GLSL}
      varying vec3 vNv, vNw, vVp, vCol; varying vec2 vRule; varying float vCrease, vCloth;
      void main(){
        vec3 N = normalize(vNv + vec3(0.0, 0.0, 1e-5)); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(-vVp + vec3(0.0, 0.0, 1e-5));
        float ndv = abs(dot(N, V));
        vec3 Nw = normalize(vNw + vec3(0.0, 1e-5, 0.0)); if (!gl_FrontFacing) Nw = -Nw;
        float ink = mcLine(vCrease);
        ink = max(ink, max(mcShadeOf(Nw), step(0.5, vCloth) * step(0.3, Nw.z)) * mcRule(vRule.x, max(vRule.y, 0.01), max(-vVp.z, 0.05)));
        gl_FragColor = vec4(mcFinish(vCol, ink, mix(mcRegister(N, ndv), 1.0, smoothstep(45.0, 110.0, -vVp.z))), 1.0);   // far off the sliver would only be salt
      }`,
  });
}

// The contour: the same geometry, back faces, pushed out 2 px. o.sway must match the tint material's.
export function hullMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...o.style, uSway: { value: 0 }, uSwayAmp: { value: o.sway || 0 }, uBillow: { value: 0 } },
    side: THREE.BackSide,
    vertexShader: /* glsl */`
      ${STYLE_VERT_GLSL}
      attribute vec2 rule;
      ${CLOTH_VERT}
      void main(){
        vec3 p = position;
        p = clothMove(p, rule);
        vec4 mvh = modelViewMatrix * vec4(p, 1.0); mvh.xyz *= 1.004; vec4 c = projectionMatrix * mvh;
        vec4 n = projectionMatrix * vec4(normalMatrix * normal, 0.0);
        gl_Position = mcHull(c, n.xy, 2.0 * uLine);
      }`,
    fragmentShader: /* glsl */`uniform vec3 uInk; void main(){ gl_FragColor = vec4(uInk, 1.0); }`,
  });
}

// ---------------------------------------------------------------------------------------------- geometry makers
function rawGeo(P, N, C, R, K, I) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('rule', new THREE.Float32BufferAttribute(R, 2));
  g.setAttribute('crease', new THREE.Float32BufferAttribute(K, 1));
  g.setIndex(I);
  return g;
}
// crease values for a run of rings: a flagged ring gets an integer (a pen line is drawn exactly on it), others n + 0.5
function creaseRun(flags) { let k = 0; return flags.map((f) => (f ? ++k : k + 0.5)); }

// Lathe about +Y. profile: [[r, y, crease?], ...] bottom to top (r 0 at an end closes it). Smooth normals, pen line on
// every flagged ring, rule = (turn, circumference of the widest ring) so shade lines run along the axis.
export function latheGeo(profile, sides, color, matrix) {
  const n = profile.length, P = [], N = [], C = [], R = [], K = [], I = [];
  const cr = creaseRun(profile.map((p) => p[2]));
  let rmax = 0.01; for (const p of profile) rmax = Math.max(rmax, p[0]);
  for (let i = 0; i < n; i++) {
    const a = profile[Math.max(0, i - 1)], b = profile[Math.min(n - 1, i + 1)], p = profile[i];
    let dr = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dr, dy) || 1; dr /= l; dy /= l;
    for (let j = 0; j <= sides; j++) {
      const t = (j / sides) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      P.push(p[0] * c, p[1], p[0] * s); N.push(dy * c, -dr, dy * s);
      C.push(color.r, color.g, color.b); R.push(j / sides, Math.PI * 2 * rmax); K.push(cr[i]);
    }
  }
  const w = sides + 1;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
    const a = i * w + j, b = a + 1, c = a + w, d = c + 1;
    if (profile[i][0] > 1e-6) I.push(a, c, b);
    if (profile[i + 1][0] > 1e-6) I.push(b, c, d);
  }
  const g = rawGeo(P, N, C, R, K, I);
  if (matrix) g.applyMatrix4(matrix);
  return g;
}

// A round tube swept along points (Vector3[]). radius: number or fn(t 0..1). rings: optional array of flags (pen line).
export function tubeGeo(pts, radius, sides, color, ringFlags, ref = new THREE.Vector3(1, 0, 0)) {
  const n = pts.length, P = [], N = [], C = [], R = [], K = [], I = [];
  const cr = creaseRun(pts.map((_, i) => (ringFlags ? ringFlags[i] : i === 0 || i === n - 1)));
  const T = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    T.subVectors(pts[Math.min(n - 1, i + 1)], pts[Math.max(0, i - 1)]).normalize();
    A.crossVectors(T, ref); if (A.lengthSq() < 1e-6) A.set(0, 0, 1); A.normalize(); B.crossVectors(A, T).normalize();
    const r = typeof radius === 'function' ? radius(i / (n - 1)) : radius;
    for (let j = 0; j <= sides; j++) {
      const t = (j / sides) * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
      const nx = A.x * c + B.x * s, ny = A.y * c + B.y * s, nz = A.z * c + B.z * s;
      P.push(pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r); N.push(nx, ny, nz);
      C.push(color.r, color.g, color.b); R.push(j / sides, Math.PI * 2 * r); K.push(cr[i]);
    }
  }
  const w = sides + 1;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < sides; j++) {
    const a = i * w + j, b = a + 1, c = a + w, d = c + 1; I.push(a, c, b, b, c, d);
  }
  return rawGeo(P, N, C, R, K, I);
}

const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion(), V1 = new THREE.Vector3(), V2 = new THREE.Vector3(), V3 = new THREE.Vector3();
const place = (x, y, z, rx = 0, ry = 0, rz = 0, s = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(s, s, s));
// a ball knob on a turned neck, r = knob radius, base at y 0, top at about 2.75 r
function knobProfile(r) {
  const p = [[r * 0.5, 0, 1], [r * 0.62, r * 0.12, 0], [r * 0.62, r * 0.3, 1], [r * 0.34, r * 0.42, 1], [r * 0.3, r * 0.62, 0], [r * 0.42, r * 0.74, 1]];
  for (let i = 1; i <= 9; i++) { const a = -Math.PI / 2 + 0.38 + (i / 9) * (Math.PI - 0.38); p.push([Math.max(0, Math.cos(a)) * r, r * 1.72 + Math.sin(a) * r, i === 4 ? 1 : 0]); }
  p[p.length - 1][0] = 0;
  return p;
}
// a turned brass post from y0 to y1, radius r, with lathe collars: a vase near the foot, a reel in the middle, a cup on top
function postProfile(y0, y1, r, rng) {
  const h = y1 - y0, p = [[0, y0, 0], [r * 1.25, y0, 1], [r * 1.35, y0 + 0.25, 0], [r * 1.25, y0 + 0.5, 1], [r, y0 + 0.62, 1]];
  const stops = [0.2 + rng() * 0.06, 0.52 + rng() * 0.08, 0.8 + rng() * 0.05];
  for (const s of stops) {
    const y = y0 + h * s, b = r * (1.5 + rng() * 0.25), hh = 0.26 + rng() * 0.12;
    p.push([r, y - hh * 2.2, 1], [r * 1.18, y - hh * 1.5, 1], [r * 1.18, y - hh * 1.1, 1], [b * 0.8, y - hh * 0.7, 0], [b, y, 1], [b * 0.8, y + hh * 0.7, 0], [r * 1.18, y + hh * 1.1, 1], [r * 1.18, y + hh * 1.5, 1], [r, y + hh * 2.2, 1]);
  }
  p.push([r, y1 - 0.3, 1], [r * 1.3, y1 - 0.12, 0], [r * 1.3, y1, 1], [0, y1, 0]);
  return p;
}

// one end rail (head or foot) in its own frame: posts at x = +-hw, standing from y 0 to postH; arch between them
function endRail(parts, rng, brass, z, hw, postH, archH, nSp, knobR, skipKnobs) {
  const post = postProfile(-1.9, postH, 0.44, rng);
  for (const sx of [-1, 1]) {
    parts.push(latheGeo(post, 14, brass, place(sx * hw, 0, z)));
    if (!skipKnobs) parts.push(latheGeo(knobProfile(knobR), 16, brass, place(sx * hw, postH, z)));
  }
  // top arch: a bent tube, higher in the middle, a little springy
  const arch = [], low = [], n = 28, flags = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, x = lerp(-hw, hw, t), k = Math.sin(t * Math.PI);
    arch.push(new THREE.Vector3(x, postH - 1.5 + archH * Math.pow(k, 0.8), z)); flags.push(i === 0 || i === n);
  }
  parts.push(tubeGeo(arch, 0.3, 10, brass, flags, new THREE.Vector3(0, 0, 1)));
  for (const y of [1.9, postH - 2.6]) {
    low.length = 0; for (let i = 0; i <= 6; i++) low.push(new THREE.Vector3(lerp(-hw, hw, i / 6), y, z));
    parts.push(tubeGeo(low.slice(), 0.21, 8, brass, null, new THREE.Vector3(0, 0, 1)));
  }
  // spindles with a turned ball each, and small finial knobs where they meet the arch
  for (let i = 1; i <= nSp; i++) {
    const t = i / (nSp + 1), x = lerp(-hw, hw, t), top = postH - 1.5 + archH * Math.pow(Math.sin(t * Math.PI), 0.8);
    const y0 = 1.9, y1 = top, r = 0.15, ym = lerp(y0, postH - 2.6, 0.5), br = 0.4 + (i % 2) * 0.12;
    const sp = [[r, y0, 1], [r, ym - br * 1.5, 1], [r * 1.5, ym - br * 1.2, 1], [r * 1.5, ym - br, 1]];
    for (let k = 1; k < 8; k++) { const a = -Math.PI / 2 + (k / 8) * Math.PI; sp.push([Math.max(r, Math.cos(a) * br), ym + Math.sin(a) * br, k === 4 ? 1 : 0]); }
    sp.push([r * 1.5, ym + br, 1], [r * 1.5, ym + br * 1.2, 1], [r, ym + br * 1.5, 1], [r, y1, 1]);
    parts.push(latheGeo(sp, 12, brass, place(x, 0, z)));
    parts.push(latheGeo(knobProfile(0.3), 10, brass, place(x, top + 0.2, z)));
  }
}

// A surface from a function fn(u, v, out Vector3), u and v in the given ranges. Normals by finite differences; winding
// follows cross(dS/du, dS/dv) (flip to turn it over). ruleFn(u, v) -> [turn, metres]; creaseFn(u, v) -> number.
function surfGeo(fn, u0, u1, nu, v0, v1, nv, color, ruleFn, creaseFn, flip = false) {
  const P = [], N = [], C = [], R = [], K = [], I = [], e = 1e-3;
  const p = new THREE.Vector3(), pu = new THREE.Vector3(), pv = new THREE.Vector3(), nn = new THREE.Vector3();
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const u = lerp(u0, u1, i / nu), v = lerp(v0, v1, j / nv);
    fn(u, v, p); fn(u + e, v, pu); fn(u, v + e, pv);
    nn.crossVectors(pu.sub(p), pv.sub(p)); if (nn.lengthSq() < 1e-16) nn.set(0, 1, 0); nn.normalize(); if (flip) nn.negate();
    P.push(p.x, p.y, p.z); N.push(nn.x, nn.y, nn.z); C.push(color.r, color.g, color.b);
    const r = ruleFn(u, v); R.push(r[0], r[1]); K.push(creaseFn(u, v));
  }
  const w = nu + 1;
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
    if (flip) I.push(a, c, b, b, c, d); else I.push(a, b, c, b, d, c);
  }
  return rawGeo(P, N, C, R, K, I);
}
const spow = (x, k) => Math.sign(x) * Math.pow(Math.abs(x), k);
// a soft pillow-like solid (superellipsoid) with an optional top dent; centre at the origin
function cushionGeo(sx, sy, sz, ex, color, noise, seed, dent, wr, ey = 0.8) {
  const fn = (u, v, o) => {
    const cu = Math.cos(u), su = Math.sin(u), cv = Math.cos(v), sv = Math.sin(v);
    const x = spow(cv, ey) * spow(cu, ex), z = spow(cv, ey) * spow(su, ex), y = spow(sv, ey);
    const ear = 1 + 0.1 * Math.pow(Math.abs(x * z), 1.5);        // the corners pull out into ears
    o.set(x * sx * ear, y * sy, z * sz * ear);
    if (dent && y > 0) o.y -= dent * y * Math.exp(-((o.x / (sx * 0.34)) ** 2 + (o.z / (sz * 0.5)) ** 2));
    o.y += wr * 0.22 * noise.n3(o.x * 0.4 + seed, o.z * 0.4, y) * Math.abs(cv);
  };
  return surfGeo(fn, 0, Math.PI * 2, 40, -Math.PI / 2 + 1e-3, Math.PI / 2 - 1e-3, 16, color, (u) => [u / (Math.PI * 2), 2 * (sx + sz) * 1.6],
    (u, v) => (wr ? 2.5 + 0.62 * noise.n3(Math.cos(u) * 0.8 + seed, Math.sin(u) * 0.8, v * 0.9) : (v > 0 ? 1.5 : 0.5) + Math.sin(v) * 0.4), true);
}

// the rumpled quilt: flat on top, round shoulder, a hanging hem in scallops; 9 patches so the lemon border is a flat tint
function quiltGeos(parts, noise, seed, salmon, lemon, snow) {
  const HW = 7.0, DROP = 3.6, ARC = HW + DROP, Z0 = -8.15, Z1 = 4.4, TOP = 2.3, RAD = 0.9;
  const qOf = (a, z) => z / 1.3 + a * 0.09 * Math.sin(seed) + 0.85 * noise.fbm2(a * 0.16 + seed * 2, z * 0.13 + seed, 2) + seed;   // a fold every 1.3 m: ten freehand lines
  const fn = (u, v, o) => {
    const a = u * ARC, e = Math.abs(a) - (HW - RAD), sg = Math.sign(a) || 1, z = lerp(Z0, Z1, v);
    let x = a, y = TOP, hang = 0;
    if (e > 0) {
      const ph = Math.min(e / RAD, Math.PI / 2), down = Math.max(0, e - RAD * Math.PI / 2);
      hang = down / (DROP - RAD * (Math.PI / 2 - 1));
      x = sg * (HW - RAD + RAD * Math.sin(ph) + hang * (0.35 + 0.3 * Math.sin(z * 1.9 + seed + sg)));
      y = TOP - RAD * (1 - Math.cos(ph)) - down + hang * 0.3 * Math.sin(z * 2.6 + seed * 3 + sg * 2);
    }
    const fold = noise.fbm2(a * 0.2 + seed, z * 0.25 - seed, 2), q = qOf(a, z);
    // quilted channels: each puff is a soft arch between two valleys, and the valleys are where the pen goes
    y += (1 - hang * 0.7) * (0.34 * Math.pow(Math.abs(Math.sin(Math.PI * q)), 0.7) + 0.3 * fold) - 0.2;
    y -= 0.5 * smoothstep(0.93, 1, v) + 0.9 * smoothstep(0.05, 0, v);      // turned-back top edge, tucked foot
    x += sg * hang * 0.25 * fold;
    o.set(x, y, z);
  };
  const BU = 0.875, BV0 = 0.06, BV1 = 0.94;
  const dOf = (u, v) => Math.min((1 - Math.abs(u)) / (1 - BU), v / BV0, (1 - v) / (1 - BV1));
  const rule = (u) => [(u + 1) / 2, -2 * ARC];
  const us = [-1, -BU, BU, 1], vs = [0, BV0, BV1, 1], nus = [5, 38, 5], nvs = [4, 76, 4];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const mid = i === 1 && j === 1;
    parts.push(surfGeo(fn, us[i], us[i + 1], nus[i], vs[j], vs[j + 1], nvs[j], mid ? (snow || salmon) : lemon, rule,
      mid ? (u, v) => qOf(u * ARC, lerp(Z0, Z1, v)) : (u, v) => Math.min(dOf(u, v), 1) * 2.1));
  }
}

// the whole bed body (everything rigid plus the quilt) as one merged geometry, in bed space:
// y 0 = side rails, head toward +Z, hips at (+-HIPX, HIPY, +-HIPZ)
const HIPX = 6.55, HIPZ = 8.55, HIPY = -2.3, HEADH = 9.2;
async function bodyGeo(ctx, col, snow) {
  const rng = ctx.rng, noise = ctx.noise, parts = [], seed = rng() * 40;
  endRail(parts, rng, col.brass, HIPZ, HIPX, HEADH, 2.0, 7, 0.7, true);     // head rail, tall
  await ctx.yield();
  endRail(parts, rng, col.brass, -HIPZ, HIPX, 6.0, 1.4, 7, 0.7);           // foot rail
  await ctx.yield();
  for (const sx of [-1, 1]) for (const sz of [-1, 1])                       // hip sockets the legs slide out of
    parts.push(latheGeo([[0, -3.3, 0], [0.74, -3.3, 1], [0.86, -3.1, 0], [0.86, -2.8, 1], [0.72, -2.7, 1], [0.72, -2.2, 1], [0.95, -2.05, 0], [0.95, -1.8, 1], [0.6, -1.7, 1]], 14, col.brass, place(sx * HIPX, 0, sz * HIPZ)));
  for (const sx of [-1, 1]) {                                               // side rails, with a turned boss mid-way
    const pts = []; for (let i = 0; i <= 8; i++) pts.push(new THREE.Vector3(sx * HIPX, 0, lerp(-HIPZ, HIPZ, i / 8)));
    parts.push(tubeGeo(pts, 0.3, 10, col.brass, pts.map((_, i) => i % 2 === 0)));
  }
  for (let i = 0; i < 7; i++) {                                             // slats under the mattress, seen from the street
    const z = lerp(-7.2, 7.2, i / 6), pts = [];
    for (let k = 0; k <= 4; k++) pts.push(new THREE.Vector3(lerp(-HIPX, HIPX, k / 4), -0.15 - 0.25 * Math.sin((k / 4) * Math.PI), z));
    parts.push(tubeGeo(pts, 0.17, 6, col.brass, null, new THREE.Vector3(0, 0, 1)));
  }
  await ctx.yield();
  const mat = cushionGeo(6.2, 0.85, 8.3, 0.3, col.paper, noise, seed, 0, 0, 0.4); mat.translate(0, 0.9, 0); parts.push(mat);
  await ctx.yield();
  quiltGeos(parts, noise, seed, col.salmon, col.lemon, snow ? col.paper : null);
  await ctx.yield();
  const g = mergeGeometries(parts, false);
  for (const p of parts) p.dispose();
  return g;
}

// ---------------------------------------------------------------------------------------------- the four legs
// One geometry for all four legs. Attribute lp = (leg 0..3, part, k, 0):
//   part 0 tube     position = (cos, sin, 0), k = t along the leg (0 hip, 0.5 knee, 1 caster axle)
//   part 1 lathe placed at t = k (knee ball: k 0.5; claw socket and fork: k 1), lathe +Y pointing back up the leg
//   part 3 caster wheel at the foot, lathe +Y = the axle, spun by uSpin
//   part 4 collar: k = its distance from the foot in metres; hidden inside the hip socket until the leg is that long
const COLLAR_PITCH = 5.0, MAX_COLLARS = 36;
function withLp(g, leg, part, k) {
  const n = g.attributes.position.count, a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { a[i * 4] = leg; a[i * 4 + 1] = part; a[i * 4 + 2] = k; }
  g.setAttribute('lp', new THREE.BufferAttribute(a, 4));
  return g;
}
async function legsGeo(ctx, col, detail) {
  const brass = col.brass, parts = [];
  // tube: rings crowd toward the knee so the bend stays round
  const RINGS = 44, SIDES = 12, P = [], N = [], C = [], R = [], K = [], L = [], I = [];
  for (let i = 0; i <= RINGS; i++) {
    const s = (i / RINGS) * 2 - 1, t = 0.5 + 0.5 * Math.sign(s) * Math.pow(Math.abs(s), 1.7);
    for (let j = 0; j <= SIDES; j++) {
      const a = (j / SIDES) * Math.PI * 2;
      P.push(Math.cos(a), Math.sin(a), 0); N.push(Math.cos(a), Math.sin(a), 0); C.push(brass.r, brass.g, brass.b);
      R.push(j / SIDES, 3.6); K.push(0.5); L.push(0, 0, t, 0);
    }
  }
  for (let i = 0; i < RINGS; i++) for (let j = 0; j < SIDES; j++) { const a = i * (SIDES + 1) + j, b = a + 1, c = a + SIDES + 1, d = c + 1; I.push(a, c, b, b, c, d); }
  const tube = rawGeo(P, N, C, R, K, I); tube.setAttribute('lp', new THREE.Float32BufferAttribute(L, 4));
  // knee: a ball between two turned collars
  const knee = [[0.6, -2.1, 1], [0.8, -1.95, 0], [0.8, -1.65, 1], [0.68, -1.5, 1], [0.68, -1.2, 1]];
  for (let i = 0; i <= 8; i++) { const a = -1.1 + (i / 8) * 2.2; knee.push([Math.cos(a) * 1.12, Math.sin(a) * 1.12, i === 4 ? 1 : 0]); }
  knee.push([0.68, 1.2, 1], [0.68, 1.5, 1], [0.8, 1.65, 1], [0.8, 1.95, 0], [0.6, 2.1, 1]);
  const kneeG = withLp(latheGeo(knee, 14, brass), 0, 1, 0.5);
  // foot: a bell socket with four claws gripping down over the caster, a fork and its axle bosses
  const foot = [latheGeo([[0.5, 3.7, 1], [0.7, 3.6, 0], [0.7, 3.3, 1], [0.56, 3.2, 1], [0.56, 2.75, 1], [0.74, 2.6, 1], [0.98, 2.3, 0], [1.1, 1.95, 0], [1.1, 1.7, 1], [0.6, 1.6, 1]], 14, brass)];
  for (let k = 0; k < 4; k++) {
    const a = Math.PI / 4 + k * Math.PI / 2, pts = [];
    for (let i = 0; i <= 6; i++) { const u = i / 6, r = 0.95 + 0.42 * Math.sin(u * 2.4), y = 2.0 - 1.15 * u; pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)); }
    foot.push(tubeGeo(pts, (t) => 0.2 * (1 - t * 0.75), 6, brass, pts.map((_, i) => i === 0), new THREE.Vector3(-Math.sin(a), 0, Math.cos(a))));
  }
  for (const sx of [-1, 1]) {
    const pts = [new THREE.Vector3(sx * 0.5, 1.75, 0), new THREE.Vector3(sx * 0.62, 1.2, 0), new THREE.Vector3(sx * 0.62, 0.5, 0), new THREE.Vector3(sx * 0.62, -0.05, 0)];
    foot.push(tubeGeo(pts, 0.17, 6, brass, null, new THREE.Vector3(0, 0, 1)));
    foot.push(latheGeo([[0, -0.16, 0], [0.3, -0.16, 1], [0.3, 0.04, 1], [0.16, 0.14, 0], [0, 0.18, 0]], 8, brass, place(sx * 0.62, 0, 0, 0, 0, -sx * Math.PI / 2)));
  }
  const footG = withLp(mergeGeometries(foot, false), 0, 1, 1); foot.forEach((g) => g.dispose());
  // wheel: tyre, hub, and two discs whose crease attribute runs round the axle (six spokes that show the spin)
  const wh = [latheGeo([[0.8, -0.27, 1], [1.08, -0.3, 0], [1.2, -0.17, 1], [1.2, 0.17, 1], [1.08, 0.3, 0], [0.8, 0.27, 1]], 20, brass),
    latheGeo([[0, -0.46, 0], [0.24, -0.46, 1], [0.24, 0.46, 1], [0, 0.46, 0]], 10, brass)];
  for (const s of [-1, 1]) {
    const d = latheGeo(s < 0 ? [[0.24, -0.2, 0], [0.8, -0.27, 0]] : [[0.8, 0.27, 0], [0.24, 0.2, 0]], 20, brass);
    const cr = d.attributes.crease, ru = d.attributes.rule; for (let i = 0; i < cr.count; i++) cr.setX(i, ru.getX(i) * 6);
    wh.push(d);
  }
  const wheelG = withLp(mergeGeometries(wh, false), 0, 3, 1); wh.forEach((g) => g.dispose());
  await ctx.yield();
  const collar = latheGeo([[0.56, -0.5, 1], [0.76, -0.4, 1], [0.76, -0.22, 1], [0.93, -0.1, 0], [0.93, 0.1, 0], [0.76, 0.22, 1], [0.76, 0.4, 1], [0.56, 0.5, 1]], 10, brass);
  const nCol = Math.round(MAX_COLLARS * (detail < 0.9 ? 0.5 : 1)), pitch = COLLAR_PITCH * (detail < 0.9 ? 2 : 1);
  for (let leg = 0; leg < 4; leg++) {
    for (const g of [tube, kneeG, footG, wheelG]) { const c = g.clone(); const a = c.attributes.lp; for (let i = 0; i < a.count; i++) a.setX(i, leg); parts.push(c); }
    for (let k = 0; k < nCol; k++) parts.push(withLp(collar.clone(), leg, 4, 3.6 + (k + 0.5) * pitch));
    await ctx.yield();
  }
  const g = mergeGeometries(parts, false);
  await ctx.yield();
  parts.forEach((p) => p.dispose()); [tube, kneeG, footG, wheelG, collar].forEach((p) => p.dispose());
  return g;
}

const LEG_VERT = /* glsl */`
attribute vec3 color; attribute vec2 rule; attribute float crease; attribute vec4 lp;
uniform vec3 uHip[4]; uniform vec3 uKnee[4]; uniform vec3 uFoot[4]; uniform vec3 uLks[4];   // uLks = (length, knee rounding in t, spin)
vec3 legAt(vec3 h, vec3 k, vec3 f, float kr, float t){
  vec3 a = h + (k - h) * (t * 2.0), b = k + (f - k) * (t * 2.0 - 1.0);
  return mix(a, b, smoothstep(0.5 - kr, 0.5 + kr, t));
}
// returns the object-space position; n = object-space normal; cre = crease value
vec3 legVertex(out vec3 n, out float cre){
  int i = int(lp.x + 0.5); float part = lp.y;
  vec3 h = uHip[i], k = uKnee[i], f = uFoot[i]; float len = max(uLks[i].x, 1.0), kr = uLks[i].y;
  float t = part > 3.5 ? 1.0 - lp.z / len : lp.z;
  float show = part > 3.5 ? step(0.035, t) : 1.0;
  t = clamp(t, 0.0, 1.0);
  vec3 o = legAt(h, k, f, kr, t);
  vec3 d = legAt(h, k, f, kr, min(t + 0.01, 1.0)) - legAt(h, k, f, kr, max(t - 0.01, 0.0));
  float dl = length(d);
  vec3 T = dl > 1e-5 ? d / dl : vec3(0.0, -1.0, 0.0);
  vec3 c = cross(T, vec3(1.0, 0.0, 0.0)); float cl = length(c);
  vec3 Bz = cl > 1e-4 ? c / cl : vec3(0.0, 0.0, 1.0);
  vec3 Ax = cross(Bz, T);
  float rad = mix(0.62, 0.5, smoothstep(0.42, 0.58, t));               // the shin is the thinner tube: it telescopes
  cre = crease;
  vec3 p;
  if (part < 0.5) {
    n = Bz * position.x + Ax * position.y; p = o + n * rad;
    cre = (1.0 - t) * len / ${COLLAR_PITCH.toFixed(1)} + 0.5;                    // a pen ring every pitch, between the collars
  } else if (part < 2.5 || part > 3.5) {
    float s = part > 3.5 ? show * rad / 0.6 : 1.0;
    p = o + (Ax * position.x - T * position.y + Bz * position.z) * s;
    n = Ax * normal.x - T * normal.y + Bz * normal.z;
  } else {
    float a = uLks[i].z, ca = cos(a), sa = sin(a);
    vec3 E1 = Bz * ca - T * sa, E3 = -T * ca - Bz * sa;
    p = o + E1 * position.x + Ax * position.y + E3 * position.z;
    n = E1 * normal.x + Ax * normal.y + E3 * normal.z;
  }
  return p;
}`;

function legMaterials(style) {
  const v3 = () => [0, 1, 2, 3].map(() => new THREE.Vector3());
  const lu = { uHip: { value: v3() }, uKnee: { value: v3() }, uFoot: { value: v3() }, uLks: { value: v3() } };
  const tint = tintMaterial({ style });
  Object.assign(tint.uniforms, lu);
  tint.vertexShader = /* glsl */`${LEG_VERT}
    varying vec3 vNv, vNw, vVp, vCol; varying vec2 vRule; varying float vCrease, vCloth;
    void main(){
      vec3 n; float cre; vec3 p = legVertex(n, cre); vCloth = 0.0;
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vNv = normalMatrix * n; vNw = mat3(modelMatrix) * n; vVp = mv.xyz; vCol = color; vRule = rule; vCrease = cre;
      gl_Position = projectionMatrix * mv;
    }`;
  const hull = hullMaterial({ style });
  Object.assign(hull.uniforms, lu);
  hull.vertexShader = /* glsl */`${STYLE_VERT_GLSL}${LEG_VERT}
    void main(){
      vec3 n; float cre; vec3 p = legVertex(n, cre);
      vec4 mvh = modelViewMatrix * vec4(p, 1.0); mvh.xyz *= 1.004; vec4 c = projectionMatrix * mvh;
      vec4 nc = projectionMatrix * vec4(normalMatrix * n, 0.0);
      gl_Position = mcHull(c, nc.xy, 2.0 * uLine);
    }`;
  return { tint, hull, lu };
}

// Pen ribbons lying where they are put (cracks, wires, any loose line). Attributes: position = centre line point,
// dir = tangent (object space), side = -1 / +1, open = (born, along): the stroke is drawn while uU > born + along * uDraw.
// Width is 2 px at any distance. Give every vertex of one quad the same 'open.x'.
export function ribbonMaterial(o = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...o.style, uU: { value: 1 }, uDraw: { value: o.draw ?? 0.004 }, uFar: { value: o.far ?? 420 } },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      ${STYLE_VERT_GLSL}
      attribute vec3 dir; attribute float side; attribute vec2 open; uniform float uU, uDraw, uFar;
      void main(){
        vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec4 c2 = projectionMatrix * modelViewMatrix * vec4(position + dir * 0.2, 1.0);
        vec2 a = c.xy / max(abs(c.w), 1e-4), b = c2.xy / max(abs(c2.w), 1e-4);
        vec2 t = (b - a) * uRes; float tl = length(t);
        vec2 nrm = tl > 1e-5 ? vec2(-t.y, t.x) / tl : vec2(0.0, 1.0);
        float on = step(open.x + open.y * uDraw, uU) * step(c.w, uFar);
        gl_Position = mcHull(c, nrm * side, uLine * on);
        gl_Position.z -= 0.0006 * gl_Position.w;
      }`,
    fragmentShader: /* glsl */`uniform vec3 uInk; void main(){ gl_FragColor = vec4(uInk, 1.0); }`,
  });
}

// ---------------------------------------------------------------------------------------------- the walk, tabled at build
const KEYS_L = [[0, 12], [0.1, 30], [0.24, 90], [0.45, 180], [0.82, 180], [0.95, 15], [1, 15]];
const KEYS_Z = [[0, 40], [0.07, 135], [0.15, 300], [0.25, 470], [0.36, 640], [0.52, 790], [0.58, 900], [0.75, 1175], [0.82, 1310], [0.93, 1560], [1, 1560]];
function lin(keys, u) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], (u - keys[i - 1][0]) / (keys[i][0] - keys[i - 1][0]));
  return keys[keys.length - 1][1];
}
function keyed(keys, u) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) return lerp(keys[i - 1][1], keys[i][1], smoothstep(keys[i - 1][0], keys[i][0], u));
  return keys[keys.length - 1][1];
}
const SWING = 0.4, PHASE_OFF = [0.0, 0.1, 0.5, 0.6];     // legs: 0 port hind, 1 port fore, 2 starboard hind, 3 starboard fore
const LEG_SX = [-1, -1, 1, 1], LEG_SZ = [-1, 1, -1, 1], WHEEL_R = 1.2;
function makePlan(o) {
  // o: { lengthAt(u), course(u) -> [x, z], groundAt(leg, x, z, u) -> [x, y, z], uLand, landing: [x, y, z], half }
  const NS = 768, phi = new Float32Array(NS + 1), cx = new Float32Array(NS + 1), cz = new Float32Array(NS + 1);
  const strideOf = (u) => clamp(0.9 * o.lengthAt(u), 14, 62);
  for (let i = 0; i <= NS; i++) { const c = o.course(i / NS); cx[i] = c[0]; cz[i] = c[1]; }
  for (let i = 1; i <= NS; i++) phi[i] = phi[i - 1] + Math.hypot(cx[i] - cx[i - 1], cz[i] - cz[i - 1]) / strideOf((i - 0.5) / NS);
  const sample = (arr, u) => { const f = clamp(u, 0, 1) * NS, i = Math.min(NS - 1, Math.floor(f)); return lerp(arr[i], arr[i + 1], f - i); };
  const uOfPhi = (p) => {                                   // inverse of phi (monotone); outside the table it runs on straight
    if (p <= 0) return p * strideOf(0) / Math.max(1e-3, Math.hypot(cx[1] - cx[0], cz[1] - cz[0]) * NS);
    if (p >= phi[NS]) return 1 + (p - phi[NS]) * 0.02;
    let a = 0, b = NS; while (b - a > 1) { const m = (a + b) >> 1; if (phi[m] <= p) a = m; else b = m; }
    return (a + (p - phi[a]) / Math.max(1e-9, phi[b] - phi[a])) / NS;
  };
  const bodyXZ = (u) => {
    if (u < 0) return [cx[0] + (cx[1] - cx[0]) * NS * u, cz[0] + (cz[1] - cz[0]) * NS * u];
    return [sample(cx, u), sample(cz, u)];
  };
  const NC = Math.ceil(phi[NS]) + 3, plants = [], falls = [];
  for (let leg = 0; leg < 4; leg++) {
    const row = [];
    for (let n = -2; n <= NC; n++) {
      const uDown = uOfPhi(n + PHASE_OFF[leg] + SWING), uMid = uOfPhi(n + PHASE_OFF[leg] + SWING + (1 - SWING) * 0.5);
      const b = bodyXZ(Math.min(uMid, 1)), L = o.lengthAt(clamp(uMid, 0, 1));
      const spread = 1 + clamp(L / 180, 0, 1) * 0.35;
      let p;
      if (uMid >= o.uLand) p = [o.landing[0] + LEG_SX[leg] * o.half, o.landing[1], o.landing[2] + LEG_SZ[leg] * o.half];
      else p = o.groundAt(leg, b[0] + LEG_SX[leg] * HIPX * spread, b[1] + LEG_SZ[leg] * HIPZ * (1 + 0.012 * L), clamp(uMid, 0, 1));
      const pl = { u: uDown, x: p[0], y: p[1] + WHEEL_R, z: p[2], leg };
      row.push(pl);
      if (uDown > 0 && uDown < 1) falls.push(pl);
    }
    plants.push(row);
  }
  falls.sort((a, b) => a.u - b.u);
  const foot = (leg, u, out) => {                           // where a caster axle is at u; returns swing 0..1 (0 = planted)
    const ps = sample(phi, u) - PHASE_OFF[leg], n = Math.floor(ps), f = ps - n, row = plants[leg];
    const b = row[clamp(n + 2, 0, row.length - 1)];
    if (f >= SWING) { out.set(b.x, b.y, b.z); return 0; }
    const a = row[clamp(n + 1, 0, row.length - 1)], s = f / SWING, e = s * s * (3 - 2 * s), L = o.lengthAt(u);
    const lift = clamp(0.05 * L, 1.6, 10) + Math.abs(b.y - a.y) * 0.35;
    out.set(lerp(a.x, b.x, e), lerp(a.y, b.y, e) + Math.sin(Math.PI * s) * lift * (1 - 0.25 * Math.sin(Math.PI * s)), lerp(a.z, b.z, e));
    return s;
  };
  return { phiAt: (u) => sample(phi, u), bodyXZ, foot, plants, falls, cycles: phi[NS] };
}

// pen cracks starring out under every footfall: jagged ribbons flat on the landing, drawn outward from the instant of landing
function cracksGeo(falls, rng, detail) {
  const P = [], D = [], S = [], O = [], I = []; let v = 0;
  const seg = (ax, ay, az, bx, by, bz, born, t0, t1) => {
    const dx = bx - ax, dy = by - ay, dz = bz - az, l = Math.hypot(dx, dy, dz) || 1;
    for (const [x, y, z, t] of [[ax, ay, az, t0], [bx, by, bz, t1]]) for (const sd of [-1, 1]) { P.push(x, y, z); D.push(dx / l, dy / l, dz / l); S.push(sd); O.push(born, t); }
    I.push(v, v + 1, v + 2, v + 1, v + 3, v + 2); v += 4;
  };
  for (const f of falls) {
    const n = Math.round((5 + rng.int(0, 2)) * (detail < 0.9 ? 0.7 : 1)), a0 = rng() * 6.283, y = f.y - WHEEL_R + 0.06;
    for (let k = 0; k < n; k++) {
      let a = a0 + (k / n) * 6.283 + rng.range(-0.3, 0.3), x = f.x + Math.cos(a) * 1.3, z = f.z + Math.sin(a) * 1.3;
      const steps = 4 + rng.int(0, 2), len = rng.range(0.9, 2.0);
      for (let i = 0; i < steps; i++) {
        a += rng.range(-0.75, 0.75);
        const nx = x + Math.cos(a) * len, nz = z + Math.sin(a) * len;
        seg(x, y, z, nx, y, nz, f.u, i / steps, (i + 1) / steps);
        if (i === 1 && rng.chance(0.6)) { const b = a + rng.pick([-1, 1]) * rng.range(0.7, 1.1); seg(nx, y, nz, nx + Math.cos(b) * len * 1.3, y, nz + Math.sin(b) * len * 1.3, f.u, 0.5, 1); }
        x = nx; z = nz;
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('dir', new THREE.Float32BufferAttribute(D, 3));
  g.setAttribute('side', new THREE.Float32BufferAttribute(S, 1)); g.setAttribute('open', new THREE.Float32BufferAttribute(O, 2));
  g.setIndex(I);
  return g;
}

// ---------------------------------------------------------------------------------------------- THE PIECE
// buildHero(ctx, opts) -> { object, radius, height, center, anchors, update, setProgress, dispose, feet, knees, body, ... }
// opts
//   palette     seven hexes (default PALETTE): paper, lemon (brass, quilt border), salmon (quilt), green, powder, night, ink
//   detail      0.6..1: halves the collars and thins the cracks under 0.9; the bed itself is never thinned
//   preview     default true: until setProgress() is first called the bed walks on the spot at the origin (legs drawing out
//               from 26 to 44 m) so it can be judged alone. THE WORLD PASSES preview: false and calls setProgress(u) each frame.
//   lengthAt(u) leg length in metres (default the brief's keys: 12, 30 at .1, 90 at .24, 180 from .45 to .82, 15 by .95)
//   course(u)   -> [x, z] of the bed's centre in the piece's space (default x 0, z by KEYS_Z: 40 at u 0 to 1560 at 0.93,
//               timed to the brief's camera: alongside at .07, over the viaduct at .25, under the camera at .52 to .58)
//   bodyY(u, L) -> height of the side rails (default 0.985 L + 3.5); raise it where the feet stand on roofs or domes
//   groundAt(leg, x, z, u) -> [x, y, z]: where the foot that would land at (x, z) really lands (default the street, y 0).
//               Snap to a dome lantern, a roof, clear of the train. Legs: 0 port hind, 1 port fore, 2 starboard hind, 3 starboard fore
//   uLand, landing, landHalf   from uLand (0.93) every foot goes to landing [0, 0, 1560] +- landHalf (7.4) in x and z
//   snagU (0.82), snagPoint [x, y, z] or null: the starboard hind caster is held there for a moment (hang the spire tip on hero.feet[2])
//   snow        true: the quilt is left bare newsprint (snow edition).   cracks: false to leave the pen cracks out
//   style       the build's shared uniforms (makeStyle()); made here when not given, returned as hero.style
//   loose(kind, u, t, pos)   optional: after the snag the pillow (kind 0) and the two head knobs (1, 2) fall; t runs 0..1 over
//               each one's fall and pos holds the default place: overwrite pos to steer it past the lens
// Space: 'object' is in the WORLD's avenue frame when preview is false (put it at the avenue origin, unrotated, unscaled);
// in preview the bed is kept at the origin. Size in preview: radius 24, height 56. In flight it is 18 x 14 m on legs to 180 m.
// Cost: 118k triangles in flight (hulls included; 134k in the preview, which carries a second set of cracks), 11 draw calls,
// 5 shader programs, no lights, no textures, build about 90 ms in steps under 35 ms. update() makes nothing.
// Each frame the world calls hero.setProgress(u) and hero.update(dt, time, camera) (update refreshes the shared STYLE uniforms).
// Live, in object space, refreshed by setProgress: hero.feet[4] (caster axles), hero.knees[4], hero.hips[4], hero.body (Group),
// hero.state { u, L, phase, swing[4] (0 planted .. 1) }.
// Artist's aids (options, preview only): close: 'R,H,x,y,z' orbits a point of the bed closely; holdU: 0.25 holds the flight pose of that u at the origin.
export async function buildHero(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PALETTE).map((h) => new THREE.Color(h));
  const col = { paper: pal[0], lemon: pal[1], brass: pal[1], salmon: pal[2], green: pal[3], powder: pal[4], night: pal[5], ink: pal[6] };
  const style = opts.style || makeStyle();
  style.uPaper.value.copy(pal[0]); style.uInk.value.copy(pal[6]);
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const rng = ctx.rng, preview0 = opts.preview !== false;
  // artist's aid, set-piece viewer only: ?bedclose=R,H,x,y,z orbits a point of the bed (y from the side rails) at leg length 30
  const cq = opts.close ? [null, String(opts.close)] : null;                 // opts.close 'R,H,x,y,z' (the page query is not read)
  const close = cq ? cq[1].split(',').map(Number) : null;
  const aidU = typeof opts.holdU === 'number' ? opts.holdU : null;   // ?bedu=0.25: the flight pose at that u, kept at the origin
  const object = new THREE.Group(), stage = new THREE.Group(), body = new THREE.Group();
  object.add(stage); stage.add(body);
  const tint = tintMaterial({ sway: 1, style }), hull = hullMaterial({ sway: 1, style });
  const add = (parent, geo, a, b) => { const m1 = new THREE.Mesh(geo, a), m2 = new THREE.Mesh(geo, b); m1.frustumCulled = m2.frustumCulled = false; parent.add(m1, m2); return [m1, m2]; };

  const gBody = await bodyGeo(ctx, col, !!opts.snow);
  add(body, gBody, tint, hull);
  await ctx.yield();
  // the pillow and the two head knobs are their own meshes: they come loose at the snag
  const pillowSeed = rng() * 30, dentX = rng.range(-1.2, 1.2);
  const gPillow = cushionGeo(4.4, 1.2, 1.9, 0.55, col.paper, ctx.noise, pillowSeed, 0.6, 1, 0.7);
  await ctx.yield();
  const pillow = new THREE.Group(); add(pillow, gPillow, tint, hull); stage.add(pillow);
  const pillowHome = new THREE.Matrix4().compose(new THREE.Vector3(dentX, 2.95, 6.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.05, rng.range(-0.12, 0.12), 0)), new THREE.Vector3(1, 1, 1));
  const gKnob = latheGeo(knobProfile(0.7), 16, col.brass);
  const knobs = [-1, 1].map((sx) => { const k = new THREE.Group(); add(k, gKnob, tint, hull); stage.add(k); k.userData.home = place(sx * HIPX, HEADH, HIPZ); return k; });
  for (const o of [pillow, ...knobs]) o.matrixAutoUpdate = false;
  await ctx.yield();
  const gLegs = await legsGeo(ctx, col, detail);
  const lm = legMaterials(style);
  add(stage, gLegs, lm.tint, lm.hull);
  await ctx.yield();

  const lengthAt = opts.lengthAt || ((u) => keyed(KEYS_L, u));
  const uLand = opts.uLand ?? 0.93, landing = opts.landing || [0, 0, 1560], snagU = opts.snagU ?? 0.82;
  const landHalf = opts.landHalf ?? 7.4;
  const mk = (o) => makePlan({ uLand: 2, landing, half: landHalf, groundAt: (leg, x, z) => [x, 0, z], ...o });
  const flight = mk({ lengthAt, uLand, course: opts.course || ((u) => [0, lin(KEYS_Z, u)]), ...(opts.groundAt ? { groundAt: opts.groundAt } : {}) });
  const bodyYOf = opts.bodyY || ((u, L) => 0.985 * L + 3.5);
  const pLen = close ? () => 30 : (u) => 26 + 18 * u, show = preview0 ? mk({ lengthAt: pLen, course: (u) => [0, 1800 * u] }) : null;
  await ctx.yield();
  const crackMat = ribbonMaterial({ style }), crng = rng.fork('cracks');
  const mkCracks = (plan) => { const m = new THREE.Mesh(cracksGeo(plan.falls, crng, detail), crackMat); m.frustumCulled = false; stage.add(m); return m; };
  const cracksFlight = opts.cracks === false ? null : mkCracks(flight);
  await ctx.yield();
  const cracksShow = show && opts.cracks !== false ? mkCracks(show) : null;
  if (cracksFlight && cracksShow) cracksFlight.scale.setScalar(0);
  await ctx.yield();

  // ------------------------------------------------------------------------------------------ pose, all from u
  const feet = [0, 1, 2, 3].map(() => new THREE.Vector3()), knees = feet.map(() => new THREE.Vector3()), hips = feet.map(() => new THREE.Vector3());
  const state = { u: 0, L: 12, phase: 0, swing: [0, 0, 0, 0], preview: preview0 };
  const snagPoint = opts.snagPoint ? new THREE.Vector3().fromArray(opts.snagPoint) : null;
  const portalPos = new THREE.Vector3(landing[0], landing[1] + 9, landing[2]);
  const E = new THREE.Euler(), S1 = new THREE.Vector3(1, 1, 1), S0 = new THREE.Vector3(0, 0, 0), P0 = new THREE.Vector3(), Tm = new THREE.Matrix4();
  let prog = null;
  function pose(u, plan, Lfn, journey) {
    const L = Lfn(u), ph = plan.phiAt(u), b = plan.bodyXZ(u), TAU = Math.PI * 2;
    let by = (journey ? bodyYOf(u, L) : 0.985 * L + 3.5) + 0.012 * L * Math.sin(2 * TAU * ph);
    let pitch = 0.02 * Math.sin(2 * TAU * ph + 1), roll = 0.035 * Math.sin(TAU * ph);
    if (journey) {
      // tripped, it pitches head down (the pillow slides off); then it sits back on its haunches and drops with the quilt up like a sail
      const trip = smoothstep(snagU, snagU + 0.022, u) * (1 - smoothstep(snagU + 0.03, snagU + 0.062, u));
      const back = smoothstep(snagU + 0.036, snagU + 0.075, u) * (1 - smoothstep(uLand - 0.03, uLand, u));
      const after = Math.max(0, u - uLand), bounce = Math.exp(-after * 90) * Math.sin(after * 260) * (u > uLand ? 1 : 0);
      pitch += 0.6 * trip - 0.4 * back + 0.08 * bounce; by -= 3 * bounce;
    }
    body.position.set(b[0], by, b[1]); body.rotation.set(pitch, 0, roll); body.updateMatrix();
    for (let i = 0; i < 4; i++) {
      const H = hips[i].set(LEG_SX[i] * HIPX, HIPY, LEG_SZ[i] * HIPZ).applyMatrix4(body.matrix), F = feet[i];
      state.swing[i] = plan.foot(i, u, F);
      if (journey && u > uLand - 0.03) {                      // every caster comes down at its corner of the last panel
        const w = smoothstep(uLand - 0.03, uLand, u); V3.set(landing[0] + LEG_SX[i] * landHalf, landing[1] + WHEEL_R, landing[2] + LEG_SZ[i] * landHalf);
        F.lerp(V3, w); state.swing[i] *= 1 - w;
      }
      if (journey && snagPoint && i === 2) F.lerp(snagPoint, smoothstep(snagU - 0.012, snagU, u) * (1 - smoothstep(snagU + 0.012, snagU + 0.03, u)));
      // two-bone knee: fore knees fold forward, hind knees back, like a giraffe's; past full reach the leg simply stretches
      const K = knees[i].addVectors(H, F).multiplyScalar(0.5), d = V1.subVectors(F, H), dist = d.length(), half = L * 0.5;
      if (dist < L - 1e-3 && dist > 1e-3) {
        d.multiplyScalar(1 / dist);
        const bd = V2.set(0.1 * LEG_SX[i], 0, LEG_SZ[i]); bd.addScaledVector(d, -bd.dot(d));
        if (bd.lengthSq() > 1e-8) K.addScaledVector(bd.normalize(), Math.sqrt(Math.max(0, half * half - dist * dist * 0.25)));
      }
      lm.lu.uHip.value[i].copy(H); lm.lu.uKnee.value[i].copy(K); lm.lu.uFoot.value[i].copy(F);
      lm.lu.uLks.value[i].set(Math.max(L, dist), clamp(1.8 / L, 0.008, 0.2), (F.z / WHEEL_R) * 0.5 + i);
    }
    const sway = 0.5 * Math.sin(2 * TAU * ph + 0.6) + pitch * 1.5;
    tint.uniforms.uSway.value = sway; hull.uniforms.uSway.value = sway;
    const fall = journey ? smoothstep(snagU + 0.008, snagU + 0.04, u) * (1 - smoothstep(uLand - 0.012, uLand + 0.012, u)) : 0;   // the quilt fills like a sail while the bed drops
    tint.uniforms.uBillow.value = hull.uniforms.uBillow.value = fall;
    tint.uniforms.uSway.value = hull.uniforms.uSway.value = sway + fall * 0.9 * Math.sin(u * 330);
    crackMat.uniforms.uU.value = u;
    // pillow: at home until the snag, then it slides off the head and falls ahead of us into the last panel
    const uP = snagU + 0.012, tp = journey ? clamp((u - uP) / (0.985 - uP), 0, 1) : 0;
    pillow.matrix.multiplyMatrices(body.matrix, pillowHome);
    if (tp > 0) {
      P0.setFromMatrixPosition(pillow.matrix);
      P0.set(lerp(P0.x, portalPos.x, tp) + 10 * Math.sin(Math.PI * tp), lerp(P0.y, portalPos.y, Math.pow(tp, 0.75)), lerp(P0.z + 8 * Math.sin(Math.PI * Math.min(tp * 2, 1)), portalPos.z, tp));
      if (opts.loose) opts.loose(0, u, tp, P0);
      Q4.setFromEuler(E.set(tp * 9, tp * 3, 0.4 + tp * 5));
      pillow.matrix.compose(P0, Q4, tp > 0.985 ? S0 : S1);
    }
    for (let k = 0; k < 2; k++) {
      const kb = knobs[k], uk = snagU + 0.02 + k * 0.015, tk = journey ? clamp((u - uk) / 0.11, 0, 1) : 0;
      kb.matrix.multiplyMatrices(body.matrix, kb.userData.home);
      if (tk > 0) {
        P0.setFromMatrixPosition(kb.matrix);
        const un = Math.min(tk * 6, 1);                        // it unscrews first: rises off its post, turning
        P0.set(lerp(P0.x, landing[0] + (k ? 17 : -15), tk * tk), lerp(P0.y + 1.2 * un, landing[1] + 0.2, Math.pow(tk, 1.5)), lerp(P0.z, landing[2] - 14 + k * 9, tk * tk));
        if (opts.loose) opts.loose(1 + k, u, tk, P0);
        Q4.setFromEuler(E.set(tk * 7 * (k ? 1 : -1), un * 9, tk * 5));
        kb.matrix.compose(P0, Q4, S1);
      }
    }
    state.u = u; state.L = L; state.phase = ph;
    return b;
  }
  function setProgress(u) {
    if (prog === null) { if (cracksShow) cracksShow.scale.setScalar(0); if (cracksFlight) cracksFlight.scale.setScalar(1); stage.position.set(0, 0, 0); state.preview = false; }
    prog = clamp(u, 0, 1);
    pose(prog, flight, lengthAt, true);
  }
  function update(dt, time, camera) {
    styleUpdate(style, ctx, camera);
    style.uTime.value = time;
    if (aidU !== null) { const u = clamp(aidU + time * 0.0004, 0, 1), b = pose(u, flight, lengthAt, true); stage.position.set(-b[0], 0, -b[1]); if (cracksShow) cracksShow.scale.setScalar(0); if (cracksFlight) cracksFlight.scale.setScalar(1); }
    else if (prog === null && show) { const b = pose((time / 60) % 1, show, pLen, false); stage.position.set(-b[0], 0, -b[1]); }
  }
  if (preview0) update(0, 0, null); else setProgress(0);

  const bedAt = (u, out = new THREE.Vector3()) => { const b = flight.bodyXZ(u); return out.set(b[0], bodyYOf(u, lengthAt(u)), b[1]); };
  const anchors = {
    // where the 13 m square last panel sits and which way its face looks (toward the camera diving in at 30 degrees)
    portalSeat: { position: portalPos.clone(), normal: new THREE.Vector3(0, 0.5, -0.866), size: 13, tilt: true },
    // the brief's camera line beside the default course, at least 6 m from brass (u, x, y, z); re-derive it from bedAt(u) if you change course
    flyThrough: [[0, -10, 16, 0], [0.035, -10, 16, 60], [0.07, -9.5, 26, 128], [0.15, 0, 9, 260], [0.25, -9, 9, 440], [0.31, -20, 40, 530], [0.36, -14, 80, 600],
      [0.45, -12, 150, 700], [0.52, 0, 188, 760], [0.58, 18, 172, 880], [0.66, 30, 150, 1010], [0.75, 30, 150, 1150], [0.82, 30, 150, 1285], [0.9, 12, 80, 1440], [0.96, 0, 43.6, 1500], [1, 0, 9, 1560]],
    viewpoints: { knobs: { u: 0.07, offset: [-9.5, 0, 0] }, street: { u: 0.25 }, knee: { u: 0.3, leg: 1, radius: 14 }, over: { u: 0.55, above: 4 }, landed: { u: 0.95 } },
    bedAt,                                  // (u, out?) -> centre of the side-rail frame in object space
    lengthAt,                               // (u) -> leg length, m
    footfalls: flight.falls,                // [{ u, x, y (axle: ground + 1.2), z, leg }] in order: burst pigeons, ring the crowd, land on a lantern
    snag: { u: snagU, leg: 2 },             // hang the spire tip on hero.feet[2] around this u
    hipLocal: [HIPX, HIPY, HIPZ], bedSize: [14, 18], headRailTop: HEADH + 2,
  };
  return {
    object, radius: close ? close[0] : aidU !== null ? Math.max(24, lengthAt(aidU) * 0.42) : 24, height: close ? close[1] : aidU !== null ? lengthAt(aidU) + 22 : 56,
    center: close ? new THREE.Vector3(close[2], 0.985 * 30 + 3.5 + close[3], close[4]) : new THREE.Vector3(0, aidU !== null ? (lengthAt(aidU) + 12) * 0.55 : 27, 0), anchors,
    update, setProgress, feet, knees, hips, body, state, pillow, knobs, style,
    materials: { tint, hull, legTint: lm.tint, legHull: lm.hull, crack: crackMat },
    dispose() {}, ground: true, groundY: 0,
  };
}
