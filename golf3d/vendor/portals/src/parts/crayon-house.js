// Hero set piece for "My House, in Crayon": the leaning see-through house (six rooms, zigzag stairs, the
// overflowing bath), the roof-high black cat that walks round it in three stepping poses, and the corner sun
// with its sixteen turning stick rays and the square window that frames the exit portal.
//
// Everything is wax crayon on white sugar paper, made from geometry and one unlit shader pair:
//   - a FILL is zigzag strokes in one direction per shape, thresholded against paper tooth (frayed edges and
//     white flecks close to, strokes that double in width in steps far off so they stay countable), darker in
//     hard patches at the turns, and stopping short of the outline, so a ragged white gap of fixed width on the
//     screen runs inside every line, from any side;
//   - a LINE is a fat hull or bar with a dry broken edge, never thinner than about 3 px (and inside the house
//     never fatter than a crayon);
//   - everything boils: vertices and stroke phase are re-rolled eight times a second and held between.
// No lights, no fog, no shading. Colours are the six crayons and the paper at their written hex (flat post).
//
// Exports: PAL, Pen (the geometry pen: quads, boxes, lofts, tubes, bars, polygons), makeCrayon (materials),
// buildHero(ctx, opts). Local space: origin at the base centre of the house, +Y up, the open front faces +Z
// (front wall at z = +50, back wall at z = -50). opts: { look: 'sunny'|'rainy'|'night'|'autumn',
// sunPos: Vector3, sunDir: Vector3 (the way the window faces), crayon: shared materials }.
// Anchors (local): door, stairs (camera line up the three flights), rafterGap, sunWindow, catRoute.
import * as THREE from 'three';

const V3 = THREE.Vector3;
export const PAL = {
  paper: new THREE.Color('#FBF7EC'), black: new THREE.Color('#26221F'), red: new THREE.Color('#E23A2E'),
  yellow: new THREE.Color('#FFD21F'), blue: new THREE.Color('#2F6FD6'), green: new THREE.Color('#3DA548'),
  purple: new THREE.Color('#7A4BB5'), pink: new THREE.Color('#F29BB0'),
};

const CRAYON_VERT = /* glsl */`
attribute vec3 aCol; attribute vec4 aFace; attribute vec2 aUV; attribute vec4 aPar;
uniform float uBoil, uPix, uJit, uFlap, uCap; uniform vec4 uSway; uniform vec3 uSwayDir;
varying vec3 vCol; varying vec4 vFace; varying vec2 vUV; varying vec4 vPar; varying vec3 vWN; varying vec3 vWP; varying vec3 vLP;
vec3 hash33(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx) * p.zyx); }
void main(){
  vec3 p = position; vec3 io = vec3(0.);
  mat4 M = modelMatrix;
#ifdef USE_INSTANCING
  io = instanceMatrix[3].xyz; M = modelMatrix * instanceMatrix;
#endif
  // two held poses per thing (flowers nod, grass sways, washing lifts, wings flap): never eased
  float ph = fract(dot(io, vec3(.137, .071, .113)));
  float pose = step(.5, fract(uBoil * uSway.z + ph)) * 2. - 1.;
  float k = clamp((p.y - uSway.w) / uSway.y, 0., 1.);
  p += uSwayDir * (uSway.x * pose * k * k);
  p.y += uFlap * pose * abs(p.x);
  vLP = p;
  vec4 wp = M * vec4(p, 1.);
  vec3 wn = mat3(M) * normal; wn = wn / max(length(wn), 1e-5);
  float dist = distance(cameraPosition, wp.xyz);
  float px = dist * uPix;
  float kind = aPar.w;
  if (kind > .5 && kind < 1.5) {
    // a crayon line keeps to the width of a crayon: never under about 3 px, and (where uCap is set: inside the
    // house) never fatter than uCap times that, however close it comes
    float hw = -aPar.z, e = px * .62 - hw, diag = kind > 1.1 ? 1.414 : 1.;   // a four-sided bar is pushed along its diagonal
    float ext = aPar.z >= 0. ? min(max(aPar.z, px), px * uCap * 1.6) : (e > 0. ? e : -diag * min(max(0., hw - px * uCap), hw * .9));
    wp.xyz += wn * ext;
  }
  vec3 h = hash33(floor(position * 2. + .25) + io + uBoil * vec3(1.7, 3.1, .7)) - .5;
  float jit = kind > 2.5 ? 0. : uJit;
  wp.xyz += h * jit * clamp(px * .9, .16, .42);
  vCol = aCol; vFace = aFace; vUV = aUV; vPar = aPar; vWN = wn; vWP = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}`;

const CRAYON_FRAG = /* glsl */`
uniform float uBoil, uPix, uPxW, uOver, uLineAhead; uniform vec3 uPaper; uniform vec2 uDraw;
varying vec3 vCol; varying vec4 vFace; varying vec2 vUV; varying vec4 vPar; varying vec3 vWN; varying vec3 vWP; varying vec3 vLP;
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float kind = vPar.w; float w = max(vPar.x, .05); float press = clamp(vPar.y, 0., 1.);
  float isLine = step(.5, kind) * step(kind, 1.5);
  // drawn so far (the rare event, the bath's fall): nothing is there above the pen (a line may run a little ahead
  // of its fill), so that what stands behind an unfinished drawing shows through it
  float undrawn = step(uDraw.x, vLP.y);
  if (vLP.y > uDraw.x * mix(1., uLineAhead, isLine)) discard;
  vec3 V = cameraPosition - vWP; float dist = length(V);
  float ndv = abs(dot(vWN / max(length(vWN), 1e-5), V / max(dist, 1e-4)));
  // ahead of the pen a hull shows its rim only: an outline ring with paper inside it, not a black ball
  if (uLineAhead > 1.01 && isLine * undrawn > .5 && ndv > .4) discard;
  float isBlob = step(1.5, kind) * step(kind, 2.5);
  // every derivative is taken here, at top level, of values that have no jumps in them
  vec2 fuv = fwidth(vUV);
  float ed = min(min(vFace.x, vFace.z - vFace.x), min(vFace.y, vFace.w - vFace.y));
  ed = mix(ed, 1e4, isBlob);
  float fe = fwidth(ed);
  float nv2 = ndv * ndv, gn = length(vec2(dFdx(nv2), dFdy(nv2)));
  // paper tooth: fixed to the shape, never boils. Two coarse octaves in stroke widths and, close to the camera,
  // two fine ones in metres of paper, which fray the edge of every stroke and leave white flecks in the wax
  vec2 tuv = vUV / w;
  float ft = (fuv.x + fuv.y) / w, fw = fuv.x + fuv.y;
  float lodT = clamp(1.3 - ft * 1.2, 0., 1.);
  float t1 = vn(tuv * 1.3 + 3.7), t2 = vn(tuv * 4.3 + 11.);
  float tooth = mix(.5, t1 * .55 + t2 * .45, lodT);
  float l3 = clamp(1.5 - fw * 4.6, 0., 1.), l4 = clamp(1.5 - fw * 14., 0., 1.);
  float fine = (vn(vUV * 3.1 + 7.) - .5) * .6 * l3 + (vn(vUV * 9.7 + 23.) - .5) * .4 * l4;
  // a stroke that would fall under about three pixels is drawn twice as wide, and so on in steps (each step
  // frayed by the tooth), so strokes stay countable into the distance and never beat against the pixels
  float fzb = (fuv.y + .378 * fuv.x) / w;
  float lv = clamp(ceil(log2(max(fzb * 3., 1e-3)) + (t1 - .5) * .5), 0., 5.);
  float w2 = w * exp2(lv), fz = fzb / exp2(lv);
  // the strokes are redrawn at every boil step: the whole zigzag shifts and is held
  vec2 bo = vec2(h21(vec2(uBoil, w * 7.3)), h21(vec2(w * 3.1, uBoil + 5.))) - .5;
  vec2 q = vUV + bo * w * 1.1;
  float L = w2 * 9.;
  float tri = abs(fract(q.x / L) - .5) * 2.;
  float zz = (q.y + (tri - .5) * w2 * 1.7) / w2;
  float lod = clamp(1.25 - fz * .9, 0., 1.);
  float thr = mix(.3, .9, press) + smoothstep(.9, 1., press) * .3 - lv * .035;
  // wax where the stroke band is inside its duty cycle; box-filtered over the pixel so far strokes keep their weight
  // hard pressure (the black cat) is solid wax: the tooth opens no streaks between its strokes, only a few flecks
  float hp = smoothstep(.9, .97, press);
  float duty = clamp(thr - (tooth - .5) * .6 * (1. - .85 * hp) - fine * clamp(.3 / w2, .03, .34) * (1. - hp), 0., 1.), hw = max(fz * .5, 1e-3), lo = .5 - duty * .5;
  float z1 = zz + hw, z0 = zz - hw;
  float a = ((floor(z1) - floor(z0)) * duty + clamp(fract(z1) - lo, 0., duty) - clamp(fract(z0) - lo, 0., duty)) / (2. * hw);
  a = mix(a, duty, smoothstep(.42, .8, fz));                         // past the last step: one even, lighter pressure
  a *= mix(1., smoothstep(.2, .32, tooth + press * .12 + hp * .1), lodT);
  float fl0 = mix(-.1, -.27, press);
  a *= 1. - (1. - smoothstep(fl0 - .035, fl0 + .035, fine)) * max(l3, l4) * (1. - .9 * hp);
  // darker where the strokes turn: a hard-edged patch, not a shade
  // (one stroke in two, each patch its own length, so they never line up into a ridge)
  float tt = abs(tri * 2. - 1.), ftt = clamp(fuv.x * 4. / L, .004, .2);
  float hs = h21(vec2(floor(zz), floor(q.x / L * 2. + .5)) + 3.3), t0 = .78 + .2 * hs;
  float turn = smoothstep(t0 - ftt, t0 + ftt, tt) * step(.62, hs);
  // (not on yellow, where a darker patch reads as olive shading)
  vec3 wax = vCol * mix(1., .8, turn * lod * step(.5, press) * step(vCol.g, .55));
  // the fill stops short of the outline: a ragged white gap
  float fl = min(vFace.z, vFace.w > 5e3 ? vFace.w - 5e3 : vFace.w);
  float g = min(max(w * .7, min(dist * uPix * 1.5, fl * .12)), fl * .14) * (.55 + .9 * t1);
  a *= smoothstep(g - max(fe, 1e-4), g + max(fe, 1e-4), ed);
  // round fills: the gap is a band of fixed width inside the silhouette, measured on the screen (the distance to
  // the silhouette in pixels is N.V squared over its gradient), so a long shape seen end-on stays filled
  float gw = max(vFace.x, min(dist * uPix * 1.3, vFace.y * .15)) * (.6 + .8 * t1);
  float gpx = gw / max(dist * uPix * uPxW, 1e-5), dpx = nv2 / max(gn, 1e-5);
  a *= mix(1., smoothstep(gpx - 1., gpx + 1., dpx), isBlob);
  // a line is solid wax with a few dry specks
  float la = mix(1., smoothstep(.09, .17, tooth), lodT) * (1. - (1. - smoothstep(-.34, -.28, fine)) * l4);
  a = mix(a, la, isLine);
  wax = mix(wax, vCol, isLine);
  // rubbing out (the rare event): wax comes away in patches, leaving scraps and a pale smear; the line breaks up
  float keep = smoothstep(uDraw.y * 1.35, uDraw.y * 1.35 + .1, t1 * .6 + t2 * .4 + .16);
  a *= mix(mix(.2, 1., keep), keep, isLine) * mix(1., 1. - undrawn, 1. - isLine);
  // a second crayon laid over a first: only its wax is drawn
  if (uOver > .5 && a < .5) discard;
  gl_FragColor = vec4(mix(uPaper, wax, clamp(a, 0., 1.)), 1.);
}`;

const PAPER_VERT = /* glsl */`
varying vec3 vDir;
void main(){ vDir = position; vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
  if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const PAPER_FRAG = /* glsl */`
uniform vec3 uPaper; varying vec3 vDir;
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec3 d = vDir / max(length(vDir), 1e-4);
  vec3 p = d * 150.;
  // sugar-paper tooth and a few fibres, fixed in world direction
  float t = vn(p.xy + p.z * .37) * .5 + vn(p.yz * 2.3 + p.x * .61) * .3 + vn(p.zx * 5.1 + p.y) * .2;
  float f1 = vn(vec2(p.x * .22 + p.y * 2.6, p.z * .3 + p.y * .9));
  float f2 = vn(vec2(p.z * 2.9 - p.x * .2, p.y * .35 + p.x * .8));
  float fib = smoothstep(.86, .93, f1) + smoothstep(.88, .94, f2);
  vec3 col = uPaper * (1. - .05 * (t - .5)) - vec3(.03, .034, .045) * fib;
  gl_FragColor = vec4(col, 1.);
}`;

// Shared crayon materials. make() gives a material with its own pose / reveal uniforms (o.cap: the fattest a
// line may be drawn, in minimum line widths); all of them share one boil clock and one line-width scale, set by
// tick(time, camera, pxHigh).
export function makeCrayon() {
  const shared = { uBoil: { value: 0 }, uPix: { value: 0.006 }, uPxW: { value: 0.327 }, uPaper: { value: PAL.paper.clone() } };
  const make = (o = {}) => new THREE.ShaderMaterial({
    uniforms: {
      uBoil: shared.uBoil, uPix: shared.uPix, uPxW: shared.uPxW, uPaper: shared.uPaper, uCap: { value: o.cap || 1e3 },
      uSway: { value: new THREE.Vector4(o.sway || 0, o.swayH || 1, o.rate || 0.125, o.y0 || 0) },
      uSwayDir: { value: new V3(...(o.dir || [1, 0, 0])) },
      uFlap: { value: o.flap || 0 }, uJit: { value: o.jit ?? 1 },
      uDraw: { value: new THREE.Vector2(1e6, 0) }, uOver: { value: o.over ? 1 : 0 }, uLineAhead: { value: 1 },
    },
    vertexShader: CRAYON_VERT, fragmentShader: CRAYON_FRAG, side: o.double ? THREE.DoubleSide : THREE.FrontSide,
  });
  const base = make(), twoSided = make({ double: true });
  const paper = new THREE.ShaderMaterial({ uniforms: { uPaper: shared.uPaper }, vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG,
    side: THREE.BackSide, depthWrite: false, depthTest: false });
  return {
    shared, make, base, twoSided, paper,
    // pxHigh: the height of the picture in pixels (for the width of the white gap inside round fills)
    tick(time, camera, pxHigh) {
      shared.uBoil.value = Math.floor(time * 8);
      // minimum line width: about 0.7% of the picture height, whatever the lens and the resolution
      shared.uPix.value = (0.0068 * 2) / Math.max(0.2, camera.projectionMatrix.elements[5]);
      shared.uPxW.value = 147.06 / Math.max(120, pxHigh || 900);   // dist * uPix * uPxW = metres per pixel
    },
  };
}

// ---------------------------------------------------------------------------------------------------------
// The pen: accumulates crayon geometry (fills, hulls, bars) into one BufferGeometry.
// aPar = (stroke width m, pressure 0..1, hull push m | -bar half width, kind): kind 0 flat fill (edge gap from
// aFace), 1 line (1.2: a four-sided bar), 2 round fill (a gap of aFace.x metres inside the silhouette; aFace.y the radius), 3 flat fill that
// neither boils nor leaves a gap (wall pieces that must stay shut against each other).
const _m4 = new THREE.Matrix4(), _n3 = new THREE.Matrix3();
const _t = [new V3(), new V3(), new V3(), new V3(), new V3(), new V3()];
const ZERO = new V3();
const DA = new V3(0.83, 0.45, 0.33).normalize(), DB = new V3(-0.42, 0.86, 0.29).normalize();

export class Pen {
  constructor(rng) {
    this.rng = rng; this.m = new THREE.Matrix4(); this.st = [];
    this.pos = []; this.nor = []; this.col = []; this.face = []; this.uv = []; this.par = []; this.idx = []; this.n = 0;
  }
  save() { this.st.push(this.m.clone()); return this; }
  restore() { this.m = this.st.pop(); return this; }
  tr(x, y, z) { this.m.multiply(_m4.makeTranslation(x, y, z)); return this; }
  rx(a) { this.m.multiply(_m4.makeRotationX(a)); return this; }
  ry(a) { this.m.multiply(_m4.makeRotationY(a)); return this; }
  rz(a) { this.m.multiply(_m4.makeRotationZ(a)); return this; }
  sc(x, y, z) { this.m.multiply(_m4.makeScale(x, y ?? x, z ?? x)); return this; }
  pt(x, y, z) { return new V3(x, y, z).applyMatrix4(this.m); }
  _v(p, n, c, f0, f1, f2, f3, u, v, w, press, push, kind) {
    this.pos.push(p.x, p.y, p.z); this.nor.push(n.x, n.y, n.z); this.col.push(c.r, c.g, c.b);
    this.face.push(f0, f1, f2, f3); this.uv.push(u, v); this.par.push(w, press, push, kind);
    return this.n++;
  }
  // a flat four-cornered fill; corners counter-clockwise seen from the front
  quad(a, b, c, d, o = {}) {
    const m = this.m, A = new V3(a[0], a[1], a[2]).applyMatrix4(m), B = new V3(b[0], b[1], b[2]).applyMatrix4(m);
    const C = new V3(c[0], c[1], c[2]).applyMatrix4(m), D = new V3(d[0], d[1], d[2]).applyMatrix4(m);
    const e1 = _t[0].subVectors(B, A), W = e1.length() || 1; e1.divideScalar(W);
    const n = _t[1].subVectors(B, A).cross(_t[2].subVectors(D, A)).normalize();
    const e2 = _t[3].crossVectors(n, e1), H = Math.abs(_t[2].dot(e2)) || 1;
    const ang = o.ang ?? 0, ca = Math.cos(ang), sa = Math.sin(ang), kind = o.kind ?? 0;
    const ox = o.abs ? 0 : this.rng() * 40, oy = o.abs ? 0 : this.rng() * 40, org = o.abs ? ZERO : A;
    const gap = o.gap !== false && kind === 0, col = o.col || PAL.black, w = o.w ?? 1, press = o.press ?? 0.8;
    const i0 = this.n;
    for (const Q of [A, B, C, D]) {
      const s = _t[4].subVectors(Q, org).dot(e1), t = _t[4].dot(e2);
      const fs = _t[5].subVectors(Q, A).dot(e1), ft = _t[5].dot(e2);
      this._v(Q, n, col, gap ? fs : 5e3, gap ? ft : 5e3, gap ? W : 1e4, gap ? H : 1e4, s * ca + t * sa + ox, -s * sa + t * ca + oy, w, press, 0, kind);
    }
    this.idx.push(i0, i0 + 1, i0 + 2, i0, i0 + 2, i0 + 3);
    if (o.back) this.quad(a, d, c, b, { ...o, ...(o.back === true ? {} : o.back), back: null });
    return this;
  }
  // a box centred on the pen; o.skip lists faces to leave out (F B L R U D); o.hull adds the outline
  box(sx, sy, sz, o = {}) {
    const x = sx / 2, y = sy / 2, z = sz / 2, skip = o.skip || '';
    const c = [[-x, -y, -z], [x, -y, -z], [x, y, -z], [-x, y, -z], [-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]];
    const F = { F: [4, 5, 6, 7], B: [1, 0, 3, 2], R: [5, 1, 2, 6], L: [0, 4, 7, 3], U: [7, 6, 2, 3], D: [0, 1, 5, 4] };
    for (const k in F) {
      if (skip.includes(k)) continue;
      const f = F[k], oo = o.faces && o.faces[k] ? { ...o, ...o.faces[k] } : o;
      this.quad(c[f[0]], c[f[1]], c[f[2]], c[f[3]], { ...oo, back: null });
    }
    if (o.hull) {
      const i0 = this.n, lc = o.lcol || PAL.black;
      for (const q of c) {
        const p = new V3(q[0], q[1], q[2]).applyMatrix4(this.m);
        const d = _t[0].set(Math.sign(q[0]), Math.sign(q[1]), Math.sign(q[2])).transformDirection(this.m);
        this._v(p, d, lc, 5e3, 5e3, 1e4, 1e4, p.dot(DA), p.dot(DB), 0.5, 1, o.hull, 1);
      }
      for (const k in F) { const f = F[k]; this.idx.push(i0 + f[0], i0 + f[2], i0 + f[1], i0 + f[0], i0 + f[3], i0 + f[2]); }
    }
    return this;
  }
  // rings -> a closed skin (shared by loft and tube). rings: array of arrays of V3 (already transformed)
  _skin(rings, o, capA, capB) {
    const R = rings.length, S = rings[0].length, col = o.col || PAL.black, w = o.w ?? 1, press = o.press ?? 0.85;
    const hull = o.hull ?? 0, lc = o.lcol || PAL.black, ang = o.ang ?? 0;
    const da = DA.clone().applyAxisAngle(DB, ang), nrm = [];
    const cen = rings.map((r) => { const c = new V3(); for (const p of r) c.add(p); return c.divideScalar(S); });
    // the white gap inside a round shape: its width (a share of the radius) and the radius go to the shader
    let rad = 0; for (let i = 0; i < R; i++) rad = Math.max(rad, rings[i][0].distanceTo(cen[i]));
    rad = o.R ?? rad; const rim = (o.rim ?? 0.14) * rad;
    for (let i = 0; i < R; i++) {
      nrm.push([]);
      for (let j = 0; j < S; j++) {
        const pu = rings[Math.min(R - 1, i + 1)][j], pd = rings[Math.max(0, i - 1)][j];
        const pr = rings[i][(j + 1) % S], pl = rings[i][(j + S - 1) % S];
        const n = new V3().subVectors(pu, pd).cross(_t[0].subVectors(pr, pl));
        if (n.lengthSq() < 1e-8) n.subVectors(cen[i], cen[i === 0 ? 1 : i - 1]); // a pole: point along the axis
        n.normalize();
        if (n.dot(_t[1].subVectors(rings[i][j], cen[i])) < -1e-6) n.negate();
        nrm[i].push(n);
      }
    }
    // which way round the faces go is worked out from the geometry, so mirrored and bent skins both come out right
    const mi = Math.max(0, Math.floor((R - 2) / 2)), g = new V3().subVectors(rings[mi + 1][1], rings[mi][0]).cross(_t[0].subVectors(rings[mi + 1][0], rings[mi][0]));
    const flip = g.dot(nrm[mi][0].clone().add(nrm[mi + 1][0])) < 0;
    const capDir = (ring) => { const b = rings[ring]; return _t[0].subVectors(b[1], b[0]).cross(_t[1].subVectors(b[2], b[0])).dot(_t[2].subVectors(cen[ring], cen[ring === 0 ? 1 : R - 2])) < 0; };
    const emit = (line) => {
      const i0 = this.n;
      for (let i = 0; i < R; i++) for (let j = 0; j < S; j++) {
        const p = rings[i][j];
        if (line) this._v(p, nrm[i][j], lc, 5e3, 5e3, 1e4, 1e4, p.dot(DA), p.dot(DB), 0.5, 1, hull, 1);
        else this._v(p, nrm[i][j], col, rim, rad, 1e4, 1e4, p.dot(da), p.dot(DB), w, press, 0, 2);
      }
      for (let i = 0; i < R - 1; i++) for (let j = 0; j < S; j++) {
        const a = i0 + i * S + j, b = i0 + i * S + (j + 1) % S, c = i0 + (i + 1) * S + (j + 1) % S, d = i0 + (i + 1) * S + j;
        if (line !== flip) this.idx.push(a, d, c, a, c, b); else this.idx.push(a, c, d, a, b, c);
      }
      for (const [ring, on] of [[0, capA], [R - 1, capB]]) {
        if (!on) continue;
        const b0 = i0 + ring * S, fl = capDir(ring);
        for (let j = 1; j < S - 1; j++) { if (line !== fl) this.idx.push(b0, b0 + j + 1, b0 + j); else this.idx.push(b0, b0 + j, b0 + j + 1); }
      }
    };
    emit(false); if (hull) emit(true);
    return this;
  }
  // a solid of revolution about the pen's Y axis. prof: [[y, r], ...] bottom to top
  loft(prof, o = {}) {
    const S = o.seg ?? 10, sx = o.rx ?? 1, sz = o.rz ?? 1, rings = [];
    for (const [y, r] of prof) {
      const ring = [];
      for (let j = 0; j < S; j++) { const a = (j / S) * Math.PI * 2; ring.push(new V3(Math.cos(a) * r * sx, y, -Math.sin(a) * r * sz).applyMatrix4(this.m)); }
      rings.push(ring);
    }
    return this._skin(rings, o, prof[0][1] > 1e-3, prof[prof.length - 1][1] > 1e-3);
  }
  ball(r, o = {}) {
    const n = o.rings ?? 6, prof = [];
    for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI; prof.push([Math.sin(a) * r, Math.max(0, Math.cos(a) * r)]); }
    return this.loft(prof, o);
  }
  // a bent round limb through pts (arrays), radius r or r(t)
  tube(pts, r, o = {}) {
    const S = o.seg ?? 8, P = pts.map((p) => new V3(p[0], p[1], p[2]).applyMatrix4(this.m)), rings = [];
    let u = null; const tan = new V3(), v = new V3();
    for (let i = 0; i < P.length; i++) {
      tan.subVectors(P[Math.min(P.length - 1, i + 1)], P[Math.max(0, i - 1)]).normalize();
      if (!u) { u = new V3(0, 1, 0); if (Math.abs(tan.y) > 0.9) u.set(1, 0, 0); }
      u.addScaledVector(tan, -u.dot(tan)).normalize(); v.crossVectors(tan, u);
      const rr = typeof r === 'function' ? r(i / (P.length - 1)) : r, ring = [];
      for (let j = 0; j < S; j++) { const a = (j / S) * Math.PI * 2; ring.push(new V3().copy(P[i]).addScaledVector(u, Math.cos(a) * rr).addScaledVector(v, Math.sin(a) * rr)); }
      rings.push(ring);
    }
    return this._skin(rings, o, true, true);
  }
  // a drawn line through pts: a four-sided bar that the shader keeps fat at any distance
  line(pts, hw, o = {}) {
    let P = pts.map((p) => (p.isVector3 ? p.clone() : new V3(p[0], p[1], p[2])).applyMatrix4(this.m));
    const closed = !!o.closed;
    if (this.step) {
      // a pen with a step cuts long lines into short lengths, so that the shader, which measures the distance to
      // the camera at each vertex, knows how near the middle of a long line passes
      const Q = [], n = P.length, m = closed ? n : n - 1;
      for (let i = 0; i < m; i++) { const a = P[i], b = P[(i + 1) % n], k = Math.max(1, Math.ceil(a.distanceTo(b) / this.step)); for (let j = 0; j < k; j++) Q.push(a.clone().lerp(b, j / k)); }
      if (!closed) Q.push(P[n - 1]);
      P = Q;
    }
    const N = P.length;
    if (o.over && !closed) {
      P[0].addScaledVector(_t[0].subVectors(P[0], P[1]).normalize(), o.over);
      P[N - 1].addScaledVector(_t[0].subVectors(P[N - 1], P[N - 2]).normalize(), o.over);
    }
    const col = o.col || PAL.black, i0 = this.n, tan = new V3(), v = new V3(), d = new V3(), q = new V3();
    let u = null;
    for (let i = 0; i < N; i++) {
      const a = closed ? P[(i + N - 1) % N] : P[Math.max(0, i - 1)], b = closed ? P[(i + 1) % N] : P[Math.min(N - 1, i + 1)];
      tan.subVectors(b, a).normalize();
      if (!u) { u = new V3(0, 1, 0); if (Math.abs(tan.y) > 0.9) u.set(1, 0, 0); }
      u.addScaledVector(tan, -u.dot(tan)).normalize(); v.crossVectors(tan, u);
      for (let k = 0; k < 4; k++) {
        const su = k === 0 || k === 3 ? 1 : -1, sv = k < 2 ? 1 : -1;
        d.set(0, 0, 0).addScaledVector(u, su).addScaledVector(v, sv);
        q.copy(P[i]).addScaledVector(d, hw); d.normalize();
        this._v(q, d, col, 5e3, 5e3, 1e4, 1e4, q.dot(DA), q.dot(DB), 0.5, 1, -hw, 1.2);
      }
    }
    const segs = closed ? N : N - 1;
    for (let i = 0; i < segs; i++) {
      const A = i0 + i * 4, B = i0 + ((i + 1) % N) * 4;
      for (let k = 0; k < 4; k++) { const k1 = (k + 1) % 4; this.idx.push(A + k, A + k1, B + k1, A + k, B + k1, B + k); }
    }
    if (!closed) { const E = i0 + (N - 1) * 4; this.idx.push(i0, i0 + 2, i0 + 1, i0, i0 + 3, i0 + 2, E, E + 1, E + 2, E, E + 2, E + 3); }
    return this;
  }
  bar(a, b, hw, o = {}) { return this.line([a, b], hw, o); }
  // a flat drawn line (two triangles a segment) for plentiful things; needs the two-sided material.
  // side: the direction the ribbon is wide in (default: across the pen's X axis in the XY plane)
  ribbon(pts, hw, o = {}) {
    const P = pts.map((p) => new V3(p[0], p[1], p[2] ?? 0).applyMatrix4(this.m)), N = P.length, col = o.col || PAL.black, i0 = this.n;
    const zdir = _t[5].set(0, 0, 1).transformDirection(this.m).clone(), tan = new V3(), side = new V3();
    for (let i = 0; i < N; i++) {
      tan.subVectors(P[Math.min(N - 1, i + 1)], P[Math.max(0, i - 1)]).normalize(); side.crossVectors(zdir, tan).normalize();
      for (const s of [-1, 1]) { const q = new V3().copy(P[i]).addScaledVector(side, s * hw), d = side.clone().multiplyScalar(s); this._v(q, d, col, 5e3, 5e3, 1e4, 1e4, q.dot(DA), q.dot(DB), 0.5, 1, -hw, 1); }
    }
    for (let i = 0; i < N - 1; i++) { const a = i0 + i * 2; this.idx.push(a, a + 1, a + 3, a, a + 3, a + 2); }
    return this;
  }
  // an ellipse of line in the pen's XY plane (petals, loops, wheels, scallops)
  loop(cx, cy, rx, ry, hw, o = {}) {
    const n = o.n ?? 9, pts = [], a0 = o.a0 ?? 0;
    for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, o.z ?? 0]); }
    return this.line(pts, hw, { ...o, closed: true });
  }
  // a flat polygon in the pen's XY plane facing +Z (star-shaped about its centroid)
  poly(pts, o = {}) {
    let area = 0, cx = 0, cy = 0; const N = pts.length, z = o.z ?? 0;
    for (let i = 0; i < N; i++) { const p = pts[i], q = pts[(i + 1) % N]; area += p[0] * q[1] - q[0] * p[1]; cx += p[0]; cy += p[1]; }
    const P = area < 0 ? pts.slice().reverse() : pts; cx /= N; cy /= N;
    let inr = 1e9;
    for (let i = 0; i < N; i++) {
      const p = P[i], q = P[(i + 1) % N], ex = q[0] - p[0], ey = q[1] - p[1], l = Math.hypot(ex, ey) || 1;
      inr = Math.min(inr, Math.abs((cx - p[0]) * ey - (cy - p[1]) * ex) / l);
    }
    const ang = o.ang ?? 0, ca = Math.cos(ang), sa = Math.sin(ang), ox = this.rng() * 40, oy = this.rng() * 40;
    const col = o.col || PAL.black, w = o.w ?? 1, press = o.press ?? 0.8, gap = o.gap !== false;
    const emit = (flip, c, pr) => {
      const n = _t[0].set(0, 0, flip ? -1 : 1).transformDirection(this.m).clone(), i0 = this.n;
      const put = (x, y, ed) => this._v(new V3(x, y, z).applyMatrix4(this.m), n, c, gap ? ed : 5e3, 5e3, 1e4, 5e3 + 1.4 * inr, x * ca + y * sa + ox, -x * sa + y * ca + oy, w, pr, 0, 0);
      put(cx, cy, inr);
      for (const p of P) put(p[0], p[1], 0);
      for (let i = 0; i < N; i++) { const a = i0 + 1 + i, b = i0 + 1 + (i + 1) % N; if (flip) this.idx.push(i0, b, a); else this.idx.push(i0, a, b); }
    };
    emit(false, col, press);
    if (o.back) emit(true, o.back.col || col, o.back.press ?? press);
    if (o.outline) this.line(P.map((p) => [p[0], p[1], z]), o.outline, { col: o.lcol, closed: true });
    return this;
  }
  disc(r, o = {}) {
    const n = o.n ?? 16, pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([Math.cos(a) * r * (o.rx ?? 1), Math.sin(a) * r * (o.ry ?? 1)]); }
    return this.poly(pts, o);
  }
  get tris() { return this.idx.length / 3; }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
    g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aFace', new THREE.Float32BufferAttribute(this.face, 4));
    g.setAttribute('aUV', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('aPar', new THREE.Float32BufferAttribute(this.par, 4));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.boundingSphere.radius += 3;
    return g;
  }
  mesh(mat, name) { const m = new THREE.Mesh(this.build(), mat); m.name = name || ''; m.matrixAutoUpdate = true; return m; }
}

// step a continuous value so that it is held between drawings
export const held = (x, n) => Math.floor(x * n) / n;

// ---------------------------------------------------------------------------------------------------------
// The house. Built square, then leaned: every vertex goes through LEAN (x += LEAN * y), about 4 degrees,
// and each outline is drawn a little off true and overshoots its corners.
const LEAN = 0.07;
export const lean = (x, y, z) => new V3(x + LEAN * y, y, z);
// the bath (centre of its foot, house-local before leaning) and the foot of the fall of water beside it
const BATH = [18.6, 20, 0], FALL = [12.9, 0, -2.6], BED = [-23.4, 20, -24], CHIM = [22.5, 49.5, -49.4], CLOCK = [8.5, 0, 29.3, -0.79];
const FLIGHTS = [ // tread line of the three stair flights, bottom -> top (house-local, before leaning)
  [[-6.7, 0, 40], [6.7, 14, 17.7]], [[6.7, 14, 13.7], [-6.7, 28, -8.6]], [[-6.7, 28, -12.6], [6.7, 42, -34.9]],
];

function houseShell(pen, rng, look) {
  const C = PAL, night = look === 'night';
  const wob = (v, a = 0.5) => v + (rng() - 0.5) * 2 * a;
  const ol = (a, b, hw = 1.0, over = 1.5) => pen.line([[wob(a[0]), wob(a[1]), a[2]], [wob(b[0]), wob(b[1]), b[2]]], hw, { over: over + rng() * 1.3 });
  const WZ = [-29, 1, 28], WS = 9;
  // a window: a square of line with a blue cross (and a yellow scribble at night)
  const windowAt = (make, s) => {
    pen.line([make(0, 0), make(s, 0), make(s, s), make(0, s)], 0.55, { closed: true });
    pen.bar(make(s / 2, 0.3), make(s / 2, s - 0.3), 0.4, { col: C.blue }); pen.bar(make(0.3, s / 2), make(s - 0.3, s / 2), 0.4, { col: C.blue });
  };
  // side walls: red scribble outside, the room's own crayon at light pressure inside, real window holes
  for (const sx of [-1, 1]) {
    const x = sx * 30, cells = [];
    for (const [y0, y1] of [[0, 6], [15, 20], [20, 26], [35, 40]]) cells.push([-50, 50, y0, y1]);
    for (const [y0, y1] of [[6, 15], [26, 35]]) { let z = -50; for (const wz of WZ) { cells.push([z, wz, y0, y1]); z = wz + WS; } cells.push([z, 50, y0, y1]); }
    for (const [z0, z1, y0, y1] of cells) {
      const inC = sx < 0 ? (y0 < 20 ? C.green : C.blue) : (y0 < 20 ? C.yellow : C.purple);
      const a = [x, y0, z0], b = [x, y0, z1], c = [x, y1, z1], d = [x, y1, z0];
      const out = { col: C.red, w: 3.4, press: 0.78, kind: 3, abs: true, ang: 0.5 }, ins = { col: inC, w: 1.25, press: 0.5, kind: 3, abs: true, ang: -0.45 };
      if (sx > 0) { pen.quad(b, a, d, c, out); pen.quad(a, b, c, d, ins); } else { pen.quad(a, b, c, d, out); pen.quad(b, a, d, c, ins); }
    }
    for (const y0 of [6, 26]) for (const wz of WZ) {
      windowAt((u, v) => [x + sx * 0.4, y0 + v, wz + u], WS);
      if (night) pen.quad([x + sx * 0.2, y0, wz], [x + sx * 0.2, y0, wz + WS], [x + sx * 0.2, y0 + WS, wz + WS], [x + sx * 0.2, y0 + WS, wz], { col: C.yellow, w: 1.6, press: 0.9, ang: 0.6, back: true });
    }
    ol([x, 0, 50], [x, 0, -50], 0.8); ol([x + sx * 3, 37.8, 52], [x + sx * 3, 37.8, -52], 0.8);
  }
  // back wall: red outside; inside, one light crayon per room
  const zb = -49.7, backs = [[-30, -14, 0, 20, C.green], [-30, -14, 20, 40, C.blue], [14, 30, 0, 20, C.yellow], [14, 30, 20, 40, C.purple], [-14, 14, 0, 40, C.red]];
  for (const [x0, x1, y0, y1, c] of backs) pen.quad([x0, y0, zb], [x1, y0, zb], [x1, y1, zb], [x0, y1, zb], { col: c, w: 1.35, press: 0.6, ang: 0.35 });
  pen.quad([30, 0, -50], [-30, 0, -50], [-30, 40, -50], [30, 40, -50], { col: C.red, w: 3.4, press: 0.78, ang: 0.5 });
  // (the back gable is left uncoloured, like the front one, and its right slope stops at the chimney: the open
  // patch of roof we leave by, with the sun's window seen in it from the top flight)
  for (const [cx, cy] of [[-22, 6], [-22, 26], [22, 6], [22, 26]]) {
    windowAt((u, v) => [cx - 3.5 + u, cy + v, zb + 0.5], 7);
    if (night) pen.quad([cx - 3.5, cy, zb + 0.25], [cx + 3.5, cy, zb + 0.25], [cx + 3.5, cy + 7, zb + 0.25], [cx - 3.5, cy + 7, zb + 0.25], { col: C.yellow, w: 1.4, press: 0.9, ang: 0.6 });
  }
  // floors: ground rooms, the bare hall with its boards, first floor and attic (paper underneath)
  const floor = (x0, x1, y, c, press) => pen.quad([x0, y, 50], [x1, y, 50], [x1, y, -50], [x0, y, -50], { col: c, w: 1.7, press, ang: 0.12, back: press > 0 && y > 1 ? { press: 0, col: C.paper } : null });
  floor(-30, -14, 0.2, C.green, 0.4); floor(14, 30, 0.2, C.yellow, 0.4); floor(-14, 14, 0.2, C.paper, 0);
  floor(-30, -14, 20, C.blue, 0.4); floor(14, 30, 20, C.purple, 0.4); floor(-30, -14, 40, C.red, 0.36); floor(14, 30, 40, C.red, 0.36);
  for (let i = -2; i <= 2; i++) pen.bar([i * 4.7 + wob(0, 0.3), 0.3, 49], [i * 4.7 + wob(0, 0.3), 0.3, -49], 0.22);
  // roof: purple zigzag over the front seventy metres, bare rafters over the back thirty
  const rs = { col: C.purple, w: 3.6, press: 0.82, ang: 0.08, back: true };
  pen.quad([-33, 37.8, 52], [0, 62, 52], [0, 62, -20], [-33, 37.8, -20], rs);
  pen.quad([0, 62, 52], [33, 37.8, 52], [33, 37.8, -20], [0, 62, -20], rs);
  for (const z of [-20, -35]) { ol([-33, 37.8, z], [0, 62, z], 0.45); ol([33, 37.8, z], [0, 62, z], 0.45); }
  ol([0, 62, 53], [0, 62, -53], 0.6);
  // the outline, front and back: box, gable, floor lines, the hall's two uprights, the door frame
  for (const z of [50, -50]) {
    const k = z > 0 ? 1 : 0.55; // the back outline is passed at arm's length on the way out, so it is drawn finer
    ol([-30, 0, z], [30, 0, z], k); ol([-30, 0, z], [-30, 40, z], k); ol([30, 0, z], [30, 40, z], k); ol([-30, 40, z], [30, 40, z], 0.8 * k);
    ol([-33, 37.8, z], [0, 62, z], 1.1 * k, 2.2);
    if (z > 0) ol([33, 37.8, z], [0, 62, z], 1.1 * k, 2.2); else ol([33, 37.8, z], [25.4, 43.4, z], 1.1 * k, 0.6);
  }
  ol([-30, 20, 50], [-14, 20, 50], 0.8); ol([14, 20, 50], [30, 20, 50], 0.8);
  ol([-14, 0, 50], [-14, 51, 50], 0.8); ol([14, 0, 50], [14, 51, 50], 0.8);
  ol([-8, 0, 50.2], [-8, 20, 50.2], 0.5, 0.5); ol([8, 0, 50.2], [8, 20, 50.2], 0.5, 0.5); ol([-8, 20, 50.2], [8, 20, 50.2], 0.5);
  // the open sides of the stair hall: posts and floor edges only, so every room shows from the stairs
  for (const x of [-14, 14]) {
    for (const z of x > 0 ? [-25, -49] : [25, 0, -49]) ol([x, 0, z], [x, 40 + (z > -40 ? 11 : 0), z], 0.3, 0.6);
    ol([x, 20, 50], [x, 20, -50], 0.4); ol([x, 40, 50], [x, 40, -50], 0.4);
  }
  // crooked chimney standing on a rafter
  pen.save().tr(CHIM[0], CHIM[1], CHIM[2]).rz(-0.1).box(5, 13, 5, { col: C.red, w: 1.1, press: 0.82, ang: 0.4, hull: 0.5 });
  pen.tr(0, 7.1, 0).box(6.4, 1.4, 6.4, { col: C.black, w: 0.9, press: 0.95, hull: 0.4 }).restore();
}

function houseStairs(pen, rng) {
  const C = PAL, hw = 6, steps = 13, CW = 4.5;
  FLIGHTS.forEach(([A, B], fi) => {
    const dx = B[0] - A[0], dz = B[2] - A[2], run = Math.hypot(dx, dz), rise = B[1] - A[1], d = [dx / run, dz / run], s = [-d[1], d[0]];
    const tr = run / steps, rs = rise / steps;
    const P = (a, h, b) => [A[0] + d[0] * a + s[0] * b, A[1] + h, A[2] + d[1] * a + s[1] * b];
    const tread = { col: C.yellow, w: 1.1, press: 0.5, ang: 0.2, gap: false }, carpet = { col: C.red, w: 1.0, press: 0.86, gap: false };
    for (let k = 0; k < steps; k++) {
      const a0 = k * tr, a1 = a0 + tr, h0 = k * rs, h1 = h0 + rs;
      pen.quad(P(a0, h1, -hw), P(a0, h1, hw), P(a1, h1, hw), P(a1, h1, -hw), tread);
      pen.quad(P(a0, h1 + 0.12, -CW), P(a0, h1 + 0.12, CW), P(a1, h1 + 0.12, CW), P(a1, h1 + 0.12, -CW), { ...carpet, ang: Math.PI / 2 });
      pen.quad(P(a0, h0, -hw), P(a0, h0, hw), P(a0, h1, hw), P(a0, h1, -hw), tread);
      pen.quad(P(a0 - 0.12, h0, -CW), P(a0 - 0.12, h0, CW), P(a0 - 0.12, h1, CW), P(a0 - 0.12, h1, -CW), carpet);
      pen.bar(P(a0 - 0.1, h1 + 0.1, -hw - 0.5), P(a0 - 0.1, h1 + 0.1, hw + 0.5), 0.11);
    }
    for (const b of [-hw, hw]) {
      const zig = [];
      for (let k = 0; k <= steps; k++) { zig.push(P(k * tr, k * rs, b)); if (k < steps) zig.push(P(k * tr, (k + 1) * rs, b)); }
      pen.line(zig, 0.18);
      // the hand rail: not on the side of the kitchen (first flight), the bath (second) or the bed (third), which are seen across it
      if ((fi === 0 && b > 0) || (fi === 1 && b > 0) || (fi === 2 && b < 0)) continue;
      pen.line([P(-0.5, 4, b), P(run + 0.5, rise + 4, b)], 0.22, { over: 1.2 });
      for (let k = 2; k < steps; k += 4) pen.bar(P((k + 0.5) * tr, (k + 1) * rs, b), P((k + 0.5) * tr, (k + 1) * rs + 3.8, b), 0.2, { col: fi === 1 ? C.purple : C.blue });
      for (const [a, h] of fi === 0 ? [[0, 0]] : []) {
        pen.bar(P(a, h, b), P(a, h + 4.6, b), 0.3);
        const q = P(a, h + 5.4, b); pen.save().tr(q[0], q[1], q[2]).ball(0.95, { col: C.yellow, w: 0.5, press: 0.95, rim: 0.12, hull: 0.3, seg: 6, rings: 4 }).restore();
      }
    }
  });
  // landings: a platform at the top of each flight, with the carpet turning on it
  for (const [x0, x1, z0, z1, y] of [[-1, 12.6, 11.4, 20, 14], [-12.6, 1, -14.9, -6.3, 28], [-1, 12.6, -44, -32.6, 42]]) {
    pen.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], { col: C.yellow, w: 1.1, press: 0.5, ang: 0.3, back: { press: 0, col: C.paper } });
    pen.quad([x0 + 2.4, y + 0.12, z1 - 1], [x1 - 2.4, y + 0.12, z1 - 1], [x1 - 2.4, y + 0.12, z0 + 1], [x0 + 2.4, y + 0.12, z0 + 1], { col: C.red, w: 1.0, press: 0.86, ang: 0.8 });
    pen.line([[x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]], 0.26, { closed: true });
  }
}

// furniture that never moves (drawn into the house mesh)
function houseRooms(pen, rng) {
  const C = PAL;
  // sitting room, ground left: fireplace, armchair, fishbowl table
  pen.save().tr(-28.4, 4.6, 30).box(2.6, 9.2, 10, { col: C.purple, w: 1.0, press: 0.82, ang: 0.5, hull: 0.42 }).restore();
  pen.quad([-27.05, 0.4, 33], [-27.05, 0.4, 27], [-27.05, 6, 27], [-27.05, 6, 33], { col: C.black, w: 0.8, press: 0.96, ang: 0.9 });
  pen.save().tr(-27.8, 9.9, 30).box(4, 0.9, 12, { col: C.yellow, w: 0.7, press: 0.9, hull: 0.35 }).restore();
  pen.save().tr(-21, 0, 39).ry(2.5);
  pen.save().tr(0, 2.2, 0).box(6.4, 3.2, 6, { col: C.red, w: 0.9, press: 0.85, ang: 0.3, hull: 0.42 }).restore();
  pen.save().tr(0, 6, -2.6).box(6.4, 8, 1.8, { col: C.red, w: 0.9, press: 0.85, ang: 1.2, hull: 0.42 }).restore();
  for (const sx of [-3.6, 3.6]) pen.save().tr(sx, 4.6, 0.4).box(1.6, 2.4, 6, { col: C.red, w: 0.7, press: 0.9, hull: 0.35 }).restore();
  pen.restore();
  pen.save().tr(-18, 0, 27).loft([[0, 2], [0.5, 0.5], [4.6, 0.5], [5, 3.2], [5.5, 3.2]], { col: C.purple, w: 0.7, press: 0.85, rim: 0.12, hull: 0.32, seg: 8 });
  pen.tr(0, 8.3, 0).loop(0, 0, 2.8, 2.8, 0.3, { n: 12 }); pen.ry(Math.PI / 2).loop(0, 0, 2.8, 2.8, 0.3, { n: 12 });
  pen.rx(-Math.PI / 2).tr(0, 0, 0.9).disc(2.5, { n: 10, col: C.blue, w: 0.5, press: 0.6, back: {} }).restore();
  // kitchen, ground right: table, red pot, two chairs, a cupboard
  pen.save().tr(21, 7, 30).box(9.5, 0.9, 7.5, { col: C.blue, w: 0.9, press: 0.85, ang: 0.2, hull: 0.4 });
  for (const [x, z] of [[-4, -3], [4, -3], [-4, 3], [4, 3]]) pen.bar([x, -0.4, z], [x + (rng() - 0.5), -7, z], 0.3);
  pen.tr(0.6, 0.5, 0).loft([[0, 2.1], [0.3, 2.5], [3.1, 2.6], [3.4, 2.9], [3.5, 2.5]], { col: C.red, w: 0.7, press: 0.9, rim: 0.12, hull: 0.36, seg: 9 });
  pen.loop(-3.2, 2.2, 0.8, 0.6, 0.24, { n: 6 }).loop(3.2, 2.2, 0.8, 0.6, 0.24, { n: 6 }).restore();
  for (const [x, z, r] of [[27, 37.5, 2.6], [25.5, 23.5, -1.2]]) {
    pen.save().tr(x, 0, z).ry(r).tr(0, 3.6, 0).box(3.4, 0.7, 3.4, { col: C.green, w: 0.6, press: 0.9, hull: 0.3 });
    for (const sx of [-1.4, 1.4]) { pen.bar([sx, 0, 1.4], [sx, -3.6, 1.5], 0.3); pen.bar([sx, 5.2, -1.5], [sx, -3.6, -1.5], 0.3); }
    pen.bar([-1.6, 4.6, -1.5], [1.6, 4.6, -1.5], 0.3).bar([-1.6, 2.6, -1.5], [1.6, 2.6, -1.5], 0.3).restore();
  }
  pen.save().tr(27.8, 6.5, 10).box(3.6, 13, 9, { col: C.green, w: 1.0, press: 0.8, ang: 0.4, hull: 0.42 });
  pen.bar([-1.9, -5.5, 0], [-1.9, 5.5, 0], 0.26); pen.save().tr(-2, 0, -1).ball(0.5, { col: C.yellow, hull: 0.2, seg: 5, rings: 3, press: 1 }).restore().save().tr(-2, 0, 1).ball(0.5, { col: C.yellow, hull: 0.2, seg: 5, rings: 3, press: 1 }).restore().restore();
  // the hall clock: a head on two posts with one paper face, square to the way in from the door, beside the first
  // flight (the pendulum is a separate, swinging drawing)
  pen.save().tr(CLOCK[0], 0, CLOCK[2]).ry(CLOCK[3]);
  pen.save().tr(0, 15, 0).box(4.6, 4.6, 3, { col: C.purple, w: 0.8, press: 0.85, hull: 0.42 }).restore();
  pen.save().tr(0, 0.8, 0).box(4.6, 1.6, 3, { col: C.purple, w: 0.8, press: 0.85, hull: 0.42 }).restore();
  pen.bar([-2, 1.6, 0], [-2, 12.7, 0], 0.34).bar([2, 1.6, 0], [2, 12.7, 0], 0.34);
  pen.save().tr(0, 15, 1.56).disc(1.75, { n: 12, col: C.paper, press: 0, outline: 0.24 });
  pen.bar([0, 0, 0.2], [0, 1.2, 0.2], 0.2).bar([0, 0, 0.2], [0.9, -0.4, 0.2], 0.2).restore();
  pen.restore();
  // bathroom, first floor right: the bath stands on four feet at the edge of the stairwell, side-on to the top of
  // the first flight: a white tub with a rolled rim, blue to the brim and heaped over it, two taps at the near end,
  // and one tongue of water over the hall-side rim (the falling column of loops is a moving drawing, see houseLive)
  pen.save().tr(BATH[0], BATH[1], BATH[2]);
  const sq = (k, y) => { const r = []; for (let j = 0; j < 20; j++) { const a = (j / 20) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a); r.push([Math.sign(c) * Math.sqrt(Math.abs(c)) * 2.7 * k, y, -Math.sign(s) * Math.sqrt(Math.abs(s)) * 5.2 * k]); } return r; };
  pen._skin([sq(0.72, 1.05), sq(0.86, 1.5), sq(0.95, 2.4), sq(1, 3.4), sq(1.06, 3.62)].map((r) => r.map((q) => pen.pt(q[0], q[1], q[2]))), { col: C.paper, press: 0, hull: 0.42, R: 2.7, rim: 0 }, true, true);
  pen.line(sq(1.06, 3.66), 0.26, { closed: true });
  pen.save().tr(0, 3.7, 0).rx(-Math.PI / 2).poly(sq(0.98, 0).map((q) => [q[0], -q[2]]), { col: C.blue, w: 0.6, press: 0.9, ang: 0.5, gap: false }).restore();
  pen.save().tr(0, 3.45, 0).sc(2.25, 1.0, 4.6).ball(1, { col: C.blue, w: 0.6, press: 0.9, rim: 0.06, seg: 12, rings: 6, ang: 0.4 }).restore();
  // four splayed feet: the two on the far side stand out past the ends of the tub, so that all four show from the stairs
  for (const [x, z] of [[-1.9, -3.9], [2.7, -5.3], [-1.9, 3.9], [2.7, 5.3]]) {
    pen.save().tr(x, 0.62, z).sc(1.05, 0.85, 1.3).ball(0.72, { col: C.black, press: 1, seg: 6, rings: 4, rim: 0.02 }).restore();
    pen.bar([x, 0.9, z], [x * 0.8, 1.9, z * 0.8], 0.3);
  }
  for (const x of [-1.15, 1.15]) {
    pen.line([[x, 3.5, 5.45], [x, 5.7, 5.45], [x, 6.0, 4.4], [x, 5.3, 4.1]], 0.28);
    pen.bar([x, 5.7, 5.45], [x, 6.5, 5.45], 0.2).bar([x - 0.8, 6.5, 5.45], [x + 0.8, 6.5, 5.45], 0.26, { col: C.red });
  }
  for (const z of [-3.0, -2.2]) pen.line([[-1.9, 4.05, z], [-3.0, 4.2, z], [-4.2, 3.7, z - 0.2], [-5.2, 2.7, z - 0.3]], 0.28, { col: C.blue });
  pen.restore();
  pen.save().tr(FALL[0], 0.45, FALL[2]).rx(-Math.PI / 2);
  for (let i = 0; i < 5; i++) pen.loop((rng() - 0.5) * 6, (rng() - 0.5) * 6, 2 + rng() * 2, 1.4 + rng(), 0.3, { col: C.blue, n: 9 });
  pen.restore();
  // bedroom, first floor left: a bed under a patchwork of all six crayons
  pen.save().tr(BED[0], BED[1], BED[2]);
  pen.save().tr(0, 1.9, 0).box(9.4, 2.8, 14.5, { col: C.paper, press: 0, hull: 0.45 }).restore();
  const six = [C.red, C.yellow, C.blue, C.green, C.purple, C.black];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const x0 = -4.5 + i * 3, z0 = 6.9 - j * 3.4;
    pen.quad([x0, 3.5, z0], [x0 + 3, 3.5, z0], [x0 + 3, 3.5, z0 - 3.4], [x0, 3.5, z0 - 3.4], { col: six[(i * 2 + j * 3 + (i === 1 ? 1 : 0)) % 6], w: 0.6, press: 0.86, ang: (i + j) * 0.8 });
  }
  pen.save().tr(0, 4.2, -5.3).box(6.4, 1.3, 2.6, { col: C.paper, press: 0, hull: 0.36 }).restore();
  pen.save().tr(0, 4.5, -7.8).box(10, 9, 1, { col: C.red, w: 0.9, press: 0.85, ang: 1.1, hull: 0.42 }).restore();
  pen.restore();
  // attic: a box and a ball, front and back
  for (const z of [41, -29]) {
    pen.save().tr(19.5, 41.9, z).ry(0.4).box(3.8, 3.8, 3.8, { col: C.yellow, w: 0.7, press: 0.88, ang: 0.6, hull: 0.36 }).restore();
    pen.save().tr(24.5, 41.9, z + 2.5).ball(1.9, { col: C.blue, w: 0.6, press: 0.9, rim: 0.16, hull: 0.34, seg: 8, rings: 5 }).restore();
  }
}

// the small things that make the rooms lived in: rugs, pictures, lamps, shelves, tiles, toys
function houseDetails(pen, rng) {
  const C = PAL;
  // a picture on a side wall (sx -1 left wall, +1 right wall): a frame and one scribbled thing inside it
  const pic = (sx, y, z, w, h, col) => {
    const x = sx * 29.55, a = sx < 0 ? [[x, y, z + w], [x, y, z], [x, y + h, z], [x, y + h, z + w]] : [[x, y, z], [x, y, z + w], [x, y + h, z + w], [x, y + h, z]];
    pen.quad(a[0], a[1], a[2], a[3], { col: C.paper, press: 0 });
    pen.line(a.map((q) => [q[0] - sx * 0.15, q[1], q[2]]), 0.24, { closed: true });
    pen.save().tr(x - sx * 0.2, y + h / 2, z + w / 2).ry(-sx * Math.PI / 2).disc(Math.min(w, h) * 0.3, { n: 8, col, w: 0.4, press: 0.95, gap: false }).restore();
  };
  const rug = (x0, x1, z0, z1, y, col, line) => {
    pen.quad([x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], { col, w: 0.9, press: 0.8, ang: 0.9 });
    pen.line([[x0, y + 0.05, z1], [x1, y + 0.05, z1], [x1, y + 0.05, z0], [x0, y + 0.05, z0]], 0.2, { closed: true, col: line });
  };
  const lamp = (x, y, z, l) => {
    pen.bar([x, y, z], [x, y - l, z], 0.16);
    pen.save().tr(x, y - l - 0.9, z).ball(1.1, { col: C.yellow, press: 1, hull: 0.26, seg: 7, rings: 4, rim: 0.05 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; pen.bar([Math.cos(a) * 1.7, Math.sin(a) * 1.7 - 0.3, 0], [Math.cos(a) * 2.7, Math.sin(a) * 2.7 - 0.3, 0], 0.14, { col: C.yellow }); }
    pen.restore();
  };
  // sitting room
  rug(-27, -17, 12, 22, 0.4, C.blue, C.red); pic(-1, 8.5, 15.5, 6, 5, C.yellow); lamp(-22, 19.6, 30, 3);
  pen.save().tr(-23, 0, -8).ry(Math.PI / 2);
  pen.save().tr(0, 2, 0).box(11, 3, 5, { col: C.purple, w: 0.9, press: 0.85, hull: 0.42 }).restore();
  pen.save().tr(0, 5.4, -2.2).box(11, 5.4, 1.6, { col: C.purple, w: 0.9, press: 0.85, ang: 1.2, hull: 0.42 }).restore().restore();
  rug(-22, -15.5, -16, -2, 0.4, C.yellow, C.purple); lamp(-22, 19.6, -10, 3); pic(-1, 8.5, -17, 7, 5, C.red);
  // a bookcase on the back wall: three shelves of crayon-coloured books
  pen.save().tr(-22, 7, -48.3).box(12, 13.4, 2, { col: C.paper, press: 0, hull: 0.42 });
  const six = [C.red, C.yellow, C.blue, C.green, C.purple, C.black];
  for (let r = 0; r < 3; r++) { pen.bar([-5.8, -6 + r * 4.3, 1.1], [5.8, -6 + r * 4.3, 1.1], 0.18); for (let i = 0; i < 9; i++) { const x = -5.2 + i * 1.2, h = 2.4 + rng() * 1.2; pen.quad([x, -5.8 + r * 4.3, 1.08], [x + 1, -5.8 + r * 4.3, 1.08], [x + 1, -5.8 + r * 4.3 + h, 1.08], [x, -5.8 + r * 4.3 + h, 1.08], { col: six[Math.floor(rng() * 6)], w: 0.3, press: 0.95, gap: false, ang: 1.5 }); } }
  pen.restore();
  // kitchen: tiles, plates, stove, fridge, shelf of jars
  for (let x = 16; x < 30; x += 3.5) pen.bar([x, 0.35, 49], [x, 0.35, 6], 0.13);
  for (let z = 9; z < 50; z += 3.5) pen.bar([14.3, 0.35, z], [29.7, 0.35, z], 0.13);
  for (const [x, z] of [[18.4, 28.4], [24, 31.6]]) pen.save().tr(x, 7.52, z).rx(-Math.PI / 2).disc(1.1, { n: 9, col: C.paper, press: 0, outline: 0.16 }).restore();
  pen.save().tr(27.6, 3.2, 20).box(4, 6.4, 7.5, { col: C.paper, press: 0, hull: 0.42 });
  pen.save().tr(0, 3.25, 0).rx(-Math.PI / 2).loop(-0.2, -1.8, 1.2, 1.2, 0.22, { n: 8 }).loop(-0.2, 1.8, 1.2, 1.2, 0.22, { n: 8 }).restore();
  pen.save().tr(-0.2, 4.4, 1.8).loft([[0, 1.1], [0.2, 1.3], [1.8, 1.3], [2, 1.5]], { col: C.blue, w: 0.5, press: 0.9, hull: 0.26, seg: 7, rim: 0.06 }).restore().restore();
  lamp(22, 19.6, 30, 3.4); pic(1, 8.5, 12, 5, 5, C.red); lamp(22, 19.6, -12, 3.4);
  pen.save().tr(19, 6, -48.2).box(5.6, 12, 2.6, { col: C.paper, press: 0, hull: 0.42 }).bar([-2.8, 1.5, 1.4], [2.8, 1.5, 1.4], 0.2).bar([1.9, 2.4, 1.5], [1.9, 5, 1.5], 0.22).restore();
  pen.bar([22.5, 12, -49], [29.5, 12, -49], 0.3);
  for (let i = 0; i < 4; i++) pen.save().tr(23.6 + i * 1.7, 12.3, -48.9).loft([[0, 0.6], [1.6, 0.7], [1.9, 0.4]], { col: six[(i * 2 + 1) % 5], w: 0.4, press: 0.95, hull: 0.2, seg: 6, rim: 0.05 }).restore();
  rug(17, 27, -30, -20, 0.4, C.red, C.blue);
  pen.save().tr(22, 4, -25).box(7, 0.7, 5, { col: C.green, w: 0.7, press: 0.88, hull: 0.34 }); for (const [x, z] of [[-3, -2], [3, -2], [-3, 2], [3, 2]]) pen.bar([x, -0.3, z], [x, -4, z], 0.3); pen.restore();
  // bathroom: mat, towel on a rail, mirror, a stool
  rug(16, 22.5, 13.5, 18, 20.3, C.green, C.black);
  pen.bar([29.3, 29, 17], [29.3, 29, 25], 0.22); pen.quad([29.2, 23.5, 18], [29.2, 23.5, 23.5], [29.2, 29, 23.5], [29.2, 29, 18], { col: C.red, w: 0.6, press: 0.86, ang: 0.1 });
  pic(1, 27, -14, 6, 7, C.blue); lamp(22, 39.6, 6, 3); lamp(22, 39.6, -30, 3);
  pen.save().tr(25, 22, -18).box(3, 0.6, 3, { col: C.yellow, w: 0.5, press: 0.9, hull: 0.3 }); for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) pen.bar([x, -0.3, z], [x * 1.2, -2, z * 1.2], 0.22); pen.restore();
  rug(17, 27, -40, -26, 20.3, C.blue, C.yellow);
  // bedroom: rug, a teddy, a picture over the bed, a wardrobe, a second bed far down the room
  rug(-27, -17.5, 0, 9, 20.3, C.red, C.yellow); pic(-1, 29, -2, 7, 5.4, C.red); lamp(-22, 39.6, 14, 3); lamp(-23, 39.6, -42, 3);
  pen.save().tr(-18, 20.3, 12).ry(0.7);
  pen.save().tr(0, 1.7, 0).ball(1.7, { col: C.yellow, w: 0.5, press: 0.92, hull: 0.3, seg: 8, rings: 5, rim: 0.1 }).restore();
  pen.save().tr(0, 4.1, 0).ball(1.25, { col: C.yellow, w: 0.5, press: 0.92, hull: 0.28, seg: 7, rings: 4, rim: 0.1 }).restore();
  for (const sx of [-1, 1]) { pen.save().tr(sx * 1, 5.2, 0).ball(0.5, { col: C.yellow, press: 1, hull: 0.2, seg: 5, rings: 3, rim: 0.03 }).restore(); pen.save().tr(sx * 1.7, 1.9, 0.6).ball(0.7, { col: C.yellow, press: 1, hull: 0.22, seg: 5, rings: 3, rim: 0.03 }).restore(); pen.save().tr(sx * 0.45, 4.3, 1.2).disc(0.2, { n: 5, col: C.black, press: 1, gap: false }).restore(); }
  pen.restore();
  pen.save().tr(-23, 27, -48.2).box(9, 14, 2.6, { col: C.green, w: 1.0, press: 0.82, ang: 0.4, hull: 0.42 }).bar([0, -6.5, 1.4], [0, 6.5, 1.4], 0.2);
  for (const sx of [-0.8, 0.8]) pen.save().tr(sx, 0, 1.6).ball(0.45, { col: C.yellow, press: 1, hull: 0.18, seg: 5, rings: 3, rim: 0.03 }).restore();
  pen.restore();
  pen.save().tr(-24.5, 21.6, 30).box(7, 3, 10, { col: C.yellow, w: 0.9, press: 0.84, ang: 0.5, hull: 0.42 }).restore();
  // the hall: doormats, a lamp down the well, plant pots by the door; boxes in the left attic
  // the stair carpet runs on as a runner down the right of the hall floor, under the fall of water from the bath
  rug(2.6, 11.4, -48, 9, 0.42, C.red, C.black);
  rug(-5, 5, 43, 47.5, 0.4, C.green, C.black); rug(-5, 5, 52.5, 56.5, 0.3, C.red, C.black);
  lamp(-3, 60, 30, 12);
  for (const sx of [-1, 1]) {
    pen.save().tr(sx * 11.5, 0, 53.5).loft([[0, 1.3], [2.6, 1.9], [2.9, 2.1]], { col: C.red, w: 0.5, press: 0.92, hull: 0.3, seg: 7, rim: 0.06 });
    pen.line([[0, 2.9, 0], [0.3, 5.5, 0], [0, 7.6, 0]], 0.26, { col: C.green });
    for (let i = 0; i < 5; i++) pen.save().tr(0, 8.2, 0).rz((i / 5) * Math.PI * 2).loop(1.5, 0, 1, 0.6, 0.22, { col: sx < 0 ? C.blue : C.purple, n: 7 }).restore();
    pen.restore();
  }
  pen.save().tr(-21, 42.2, 30).ry(0.3).box(5, 4.4, 4, { col: C.purple, w: 0.7, press: 0.86, hull: 0.36 }).tr(0.4, 3.6, 0).ry(0.5).box(3, 2.8, 3, { col: C.green, w: 0.6, press: 0.88, hull: 0.32 }).restore();
  pen.save().tr(-24, 42.2, -32).ry(-0.3).box(5, 4.4, 4, { col: C.blue, w: 0.7, press: 0.86, hull: 0.36 }).restore();
}

// the drawings inside the house that move: each is its own small mesh, stepped eight times a second
function houseLive(group, crayon, rng, houseMat) {
  const C = PAL;
  const mk = (at, fn, mat) => { const p = new Pen(rng); fn(p); const m = p.mesh(mat || houseMat); m.position.copy(at); group.add(m); return m; };
  const door = mk(lean(8, 0, 50.3), (p) => {
    p.rz(0.045);
    p.quad([-16, 0.6, 0], [0, 0.6, 0], [0, 20, 0], [-16, 20, 0], { col: C.green, w: 1.5, press: 0.84, ang: 0.45, back: true });
    p.line([[-16, 0.6, 0], [0, 0.6, 0], [0, 20, 0], [-16, 20, 0]], 0.42, { closed: true });
    for (const y of [3, 11.5]) p.line([[-13.5, y, 0], [-2.5, y, 0], [-2.5, y + 6.5, 0], [-13.5, y + 6.5, 0]], 0.26, { closed: true });
    for (const z of [-0.9, 0.9]) p.save().tr(-14.2, 10, z).ball(0.8, { col: C.yellow, press: 1, hull: 0.26, seg: 6, rings: 4, rim: 0.05 }).restore();
    p.save().tr(0.2, 16.5, 0).box(1.6, 2.4, 1.2, { col: C.black, press: 1, w: 0.5, gap: false }).restore();
  });
  const fire = mk(lean(-26.5, 0.5, 30), (p) => {
    for (const [z0, h, c, x] of [[-1.6, 4.6, C.yellow, 0], [0.3, 5.2, C.yellow, 0], [1.9, 4, C.yellow, 0], [-1.2, 3.6, C.red, 0.5], [0.8, 4.2, C.red, 0.5], [2.2, 2.8, C.red, 0.5]]) {
      const pts = []; for (let i = 0; i <= 7; i++) pts.push([x, (i / 7) * h, z0 + (i % 2 ? 0.9 : -0.9) * (1 - i / 9)]);
      p.line(pts, c === C.red ? 0.34 : 0.5, { col: c });
    }
  });
  const fish = mk(lean(-18, 7.6, 27), (p) => {
    p.save().sc(0.45, 0.7, 1).ball(1.0, { col: C.yellow, press: 1, hull: 0.2, seg: 6, rings: 4, rim: 0.04 }).restore();
    p.ry(Math.PI / 2).poly([[0.8, 0], [1.9, 0.8], [1.9, -0.8]], { col: C.red, press: 1, w: 0.4, gap: false, back: {} });
  });
  const steam = mk(lean(21.6, 11.4, 30), (p) => {
    for (const x of [-0.9, 0.9]) { const pts = []; for (let i = 0; i <= 10; i++) pts.push([x + Math.sin(i * 1.25 + x) * 0.8, i * 0.62, Math.cos(i * 1.25) * 0.5]); p.line(pts, 0.26); }
  });
  const pend = mk(lean(CLOCK[0], 12.7, CLOCK[2]), (p) => {
    p.bar([0, 0, 0], [0, -8.2, 0], 0.26); p.tr(0, -8.8, 0).ball(1.15, { col: C.yellow, press: 1, hull: 0.28, seg: 7, rings: 4, rim: 0.05 });
  });
  const drips = mk(lean(BATH[0], BATH[1] + 5.0, BATH[2] + 4.1), (p) => {
    for (const x of [-1.15, 1.15]) for (const y of [0, -0.8]) p.bar([x, y, 0], [x, y - 0.4, 0], 0.2, { col: C.blue });
  });
  // the fall from the bath: one column of blue loops, with dash drips either side, that scrolls down the
  // stairwell from the tongue of water at the rim to the pool on the hall floor
  const chainMat = crayon.make({ cap: 1.7 }), spiderMat = crayon.make({ cap: 1.7 });
  const chain = mk(lean(FALL[0], 0, FALL[2]), (p) => {
    for (let k = 0; k < 16; k++) {
      p.save().tr((k % 2) * 0.5 - 0.25, k * 1.9, 0).ry((k % 2 ? 0.45 : -0.2) + 0.35);
      p.loop(0, 0, 1.45, 1.2, 0.23, { col: C.blue, n: 9 }).restore();
      if (k % 2 === 0) { const sx = k % 4 ? -1 : 1; p.bar([sx * 2.4, k * 1.9 + 0.6, sx * 0.6], [sx * 2.4, k * 1.9 - 0.5, sx * 0.6], 0.2, { col: C.blue }); }
    }
  }, chainMat);
  const duck = mk(lean(BATH[0] - 0.3, BATH[1] + 4.75, BATH[2] + 0.6), (p) => {
    p.sc(1.25);
    p.save().sc(0.85, 0.7, 1.15).ball(1.15, { col: C.yellow, press: 1, hull: 0.26, seg: 7, rings: 4, rim: 0.05 }).restore();
    p.save().tr(0, 1.05, 0.9).ball(0.68, { col: C.yellow, press: 1, hull: 0.24, seg: 6, rings: 4, rim: 0.05 }).restore();
    p.tr(0, 1.0, 1.5).rx(Math.PI / 2).loft([[0, 0.34], [0.8, 0]], { col: C.red, press: 1, seg: 5, rim: 0.02 });
  });
  const mobile = mk(lean(BED[0] + 1.2, 39.7, BED[2] + 1.5), (p) => {
    p.sc(1.5);
    p.bar([0, 0, 0], [0, -3.4, 0], 0.16); p.bar([-3.6, -3.4, 0], [3.6, -3.4, 0], 0.2).bar([0, -3.4, -3.6], [0, -3.4, 3.6], 0.2);
    const hang = [[-3.6, 0, 2.2, C.red, 4], [3.6, 0, 3.4, C.blue, 3], [0, -3.6, 2.8, C.yellow, 10], [0, 3.6, 1.8, C.green, 12]];
    for (const [x, z, l, c, n] of hang) {
      p.bar([x, -3.4, z], [x, -3.4 - l, z], 0.14);
      const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + 0.3, r = n === 10 ? (i % 2 ? 0.55 : 1.3) : 1.05; pts.push([Math.cos(a) * r, Math.sin(a) * r]); }
      p.save().tr(x, -3.4 - l - 1, z).ry(x ? 0 : Math.PI / 2).poly(pts, { col: c, press: 1, w: 0.4, gap: false, back: {}, outline: 0.13 }).restore();
    }
  });
  const spider = mk(lean(-21, 44, 44), (p) => {
    p.bar([0, 0.6, 0], [0, 9, 0], 0.15); p.ball(0.9, { col: C.black, press: 1, seg: 6, rings: 4, rim: 0.02 });
    for (let i = 0; i < 4; i++) for (const s of [-1, 1]) p.line([[s * 0.6, 0.2, 0], [s * 1.7, 0.9 - i * 0.2, (i - 1.5) * 0.5], [s * 2.2, -0.7 - i * 0.2, (i - 1.5) * 0.9]], 0.13);
  }, spiderMat);
  const smoke = mk(lean(CHIM[0] + 0.8, CHIM[1] + 8.2, CHIM[2]), (p) => {
    const pts = []; for (let i = 0; i <= 46; i++) { const t = i / 46, a = t * 22, r = 0.8 + 3.4 * t; pts.push([Math.cos(a) * r + t * 3, t * 27, Math.sin(a) * r]); }
    p.line(pts, 0.5);
  });
  pend.rotation.y = CLOCK[3];
  const base = { duck: duck.position.clone(), spider: spider.position.clone(), steam: steam.position.clone(), drips: drips.position.clone(), fish: fish.position.clone() };
  const edge = lean(FALL[0] + 0.6, BATH[1] + 4.6, FALL[2]), pool = lean(FALL[0], 1.5, FALL[2] + 0.5);
  return {
    door,
    // boil: the drawing counter (eight a second); doorOpen and duckFall are 0..1, set by the journey
    update(boil, doorOpen, duckFall) {
      door.rotation.y = -(0.1 + 2.45 * doorOpen);
      fire.rotation.y = (boil % 2) * Math.PI; fire.scale.y = 1 + 0.14 * ((boil * 7) % 3);
      const fa = boil * 0.34; fish.position.set(base.fish.x + Math.cos(fa) * 1.45, base.fish.y + (boil % 2) * 0.1, base.fish.z + Math.sin(fa) * 1.45); fish.rotation.y = -fa;
      steam.position.y = base.steam.y + (boil % 4) * 0.4; steam.rotation.y = (boil % 2) * Math.PI;
      pend.rotation.z = [-0.3, 0, 0.3, 0][Math.floor(boil / 4) % 4];
      drips.position.y = base.drips.y - (boil % 3) * 0.6;
      chain.position.y = -((boil % 6) / 6) * 3.8; chainMat.uniforms.uDraw.value.x = BATH[1] + 3.3 - chain.position.y;
      const f = duckFall;
      if (f <= 0) duck.position.set(base.duck.x, base.duck.y + (boil % 2) * 0.16, base.duck.z);
      else if (f < 0.35) duck.position.lerpVectors(base.duck, edge, f / 0.35);
      else duck.position.lerpVectors(edge, pool, Math.min(1, (f - 0.35) / 0.5)), duck.position.y += f >= 0.85 ? (boil % 2) * 0.16 : 0;
      duck.rotation.set(f > 0.35 && f < 0.85 ? boil * 0.9 : 0, f > 0 ? -Math.PI / 2 : (boil % 4) * 0.2 - 1.0, 0);
      const sp = [0, 0.6, 1.3, 2.1, 2.6, 2.1, 1.3, 0.6][Math.floor(boil / 3) % 8];
      spider.position.y = base.spider.y - sp; spiderMat.uniforms.uDraw.value.x = (46.3 - spider.position.y) ;
      spider.rotation.y = (boil % 2) * 0.5;
      smoke.rotation.y = -boil * 0.3; mobile.rotation.y = boil * 0.11;
    },
  };
}

// A second chimney low on the front of the roof, where the garden sees it, its corkscrew of smoke blowing away to
// the left. Drawn with a random source of its own, so that nothing else in the house is drawn differently for it.
function frontChimney(group, mat) {
  let sd = 20077; const prng = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  const C = PAL, pen = new Pen(prng); pen.m.set(1, LEAN, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  pen.save().tr(-29, 44, 45).rz(0.1).box(5, 10, 5, { col: C.red, w: 1.1, press: 0.82, ang: 0.4, hull: 0.5 });
  pen.tr(0, 5.6, 0).box(6.4, 1.4, 6.4, { col: C.black, w: 0.9, press: 0.95, hull: 0.4 }).restore();
  group.add(pen.mesh(mat, 'front-chimney'));
  const tilt = new THREE.Group(); tilt.position.copy(lean(-29.6, 50.4, 45));
  tilt.quaternion.setFromUnitVectors(new V3(0, 1, 0), new V3(-0.8, 0.12, -0.58).normalize());
  const sp = new Pen(prng), pts = [];
  for (let i = 0; i <= 44; i++) { const t = i / 44, a = t * 21, r = 0.7 + 3.1 * t; pts.push([Math.cos(a) * r, t * 25, Math.sin(a) * r]); }
  sp.line(pts, 0.5);
  const smoke = sp.mesh(mat, 'front-smoke'); tilt.add(smoke); group.add(tilt);
  return smoke;
}

// ---------------------------------------------------------------------------------------------------------
// The cat: 58 m to the ear tips, 70 m nose to rump, a 40 m question mark of a tail. Local space: nose to +Z.
// Body and head are one drawing; legs exist three times (the three walking poses) and the tail six times (three
// held low, three held up); one of each shows. The ears turn with the face, so there is always one either side.
function buildCat(crayon, rng) {
  const C = PAL, g = new THREE.Group();
  const K = { col: C.black, w: 2.6, press: 0.955, hull: 0.9 };
  const body = new Pen(rng);
  body.save().tr(0, 35, -5).sc(0.85, 1, 2.3).ball(11, { ...K, rings: 10, seg: 16, R: 10, rim: 0.11, ang: 0.3 }).restore();
  body.save().tr(0, 43, 28).sc(1, 0.95, 0.95).ball(12.5, { ...K, rings: 9, seg: 16, rim: 0.1, ang: -0.5 }).restore();
  body.save().tr(0, 40.5, 16.5).rx(1.2).loft([[-1.4, 9.3], [1.4, 9.8]], { col: C.red, w: 0.9, press: 1, seg: 12, hull: 0.5, rim: 0.03 }).restore();
  const bodyM = body.mesh(crayon.base, 'cat-body'); g.add(bodyM);
  const ears = new Pen(rng);
  for (const s of [-1, 1]) ears.save().tr(s * 6.4, 9.2, 0).rz(-s * 0.32).loft([[0, 4.6], [3.5, 2.9], [8, 0]], { ...K, seg: 6, rz: 0.55, rim: 0.14, hull: 0.8 }).restore();
  const earM = ears.mesh(crayon.base, 'cat-ears'); earM.position.set(0, 43, 28); g.add(earM);
  // the face turns to whoever is looking: two yellow dot eyes and six whiskers, nothing more
  const face = new Pen(rng);
  for (const s of [-1, 1]) {
    face.save().tr(s * 4.7, 1.6, 12.4).disc(2.6, { n: 12, col: C.yellow, w: 0.8, press: 1, gap: false, outline: 0.34 }).restore();
    for (let i = -1; i <= 1; i++) face.bar([s * 2.6, -3.6, 12.3], [s * 14.5, -3.2 + i * 2.8, 10.5], 0.3);
  }
  const faceM = face.mesh(crayon.base, 'cat-face'); faceM.position.set(0, 43, 28); g.add(faceM);
  const LEG = [[-27, 0], [-25.8, 2.7], [-22, 3.5], [-4, 4.1], [2, 3.7], [4.5, 0]];
  const swing = [[-0.42, 0.38, 0.4, -0.4], [-0.06, 0.07, 0.05, -0.05], [0.38, -0.42, -0.4, 0.4]];
  // legs: three walking poses. Tail: three swishing poses held low (over the garden path) and three held up,
  // a question mark that stands higher than the ears (from the corner of the house on)
  const tails = [5, 0, -5], poses = [], tailLo = [], tailHi = [], tailMid = [];
  for (let k = 0; k < 3; k++) {
    const p = new Pen(rng);
    [[-5.6, 15], [5.6, 15], [-5.6, -23], [5.6, -23]].forEach(([x, z], i) => {
      p.save().tr(x, 27, z).rx(swing[k][i]).loft(LEG, { ...K, seg: 12, rim: 0.14, hull: 0.85 });
      p.tr(0, -25.6, 1.8).sc(1.25, 0.55, 1.6).ball(3.6, { ...K, seg: 12, rings: 5, rim: 0.12, hull: 0.8 }).restore();
    });
    const m = p.mesh(crayon.base, 'cat-pose' + k); m.visible = k === 0; g.add(m); poses.push(m);
    const tx = tails[k], lift = k === 1 ? 5 : 0, TK = { ...K, seg: 10, rim: 0.2, hull: 0.85 };
    const lo = new Pen(rng).tube([[0, 39, -28], [tx * 0.2, 34, -37], [tx * 0.6, 25.5 + lift * 0.4, -46], [tx, 20 + lift, -55], [tx * 1.3, 19.5 + lift, -63], [tx * 1.1, 24 + lift, -69.5], [tx * 0.5, 31 + lift, -69], [tx * 0.1, 35.5 + lift, -64]],
      (t) => 2.5 - 1.1 * t, TK).mesh(crayon.base, 'cat-tail' + k);
    lo.visible = k === 0; g.add(lo); tailLo.push(lo);
    const up = k === 1 ? 2.5 : 0;
    const hi = new Pen(rng).tube([[0, 39, -28], [tx * 0.2, 43.5, -35], [tx * 0.5, 50, -39.5], [tx * 0.8, 57 + up, -40.5], [tx, 62.5 + up, -37.5], [tx * 0.9, 65.5 + up, -32], [tx * 0.6, 63.5 + up, -27], [tx * 0.3, 59.5 + up, -26]],
      (t) => 2.6 - 1.1 * t, TK).mesh(crayon.base, 'cat-tail-up' + k);
    hi.visible = false; g.add(hi); tailHi.push(hi);
    // and three curled up close behind the rump, no higher than the ears: the tail of the whole cat seen side-on
    // from the garden path, where the low tail would lie across the house and the high one leave the picture
    const mid = new Pen(rng).tube([[0, 39, -28], [tx * 0.2, 42.5, -35.5], [tx * 0.5, 46.5, -41], [tx * 0.8, 50.5 + up * 0.6, -43], [tx, 53.5 + up * 0.6, -40.5], [tx * 0.9, 53.5 + up * 0.6, -36.5], [tx * 0.6, 51 + up * 0.6, -34.5]],
      (t) => 2.6 - 1.1 * t, TK).mesh(crayon.base, 'cat-tail-mid' + k);
    mid.visible = false; g.add(mid); tailMid.push(mid);
  }
  const _c = new V3();
  return {
    group: g,
    // x, z: where the cat stands; heading: yaw of its nose; walked: metres walked (picks the pose); tailUp: the
    // question mark held high (true or 1), or the tail curled up behind the rump (2)
    place(x, z, heading, walked, boil, camera, tailUp) {
      const k = ((Math.floor(walked / 8.5) % 3) + 3) % 3;
      const kt = Math.floor(boil / 5) % 3, tm = tailUp === 2, th = !!tailUp && !tm;
      for (let i = 0; i < 3; i++) { poses[i].visible = i === k; tailLo[i].visible = i === kt && !tailUp; tailHi[i].visible = i === kt && th; tailMid[i].visible = i === kt && tm; }
      g.position.set(x, 0, z); g.rotation.y = heading;
      bodyM.position.y = k === 1 ? 1.2 : 0;
      earM.position.y = 43 + bodyM.position.y; faceM.position.y = 43 + bodyM.position.y;
      earM.rotation.x = boil % 23 < 2 ? -0.3 : 0;
      if (camera) {
        camera.getWorldPosition(_c);
        const yaw = Math.atan2(Math.sin(Math.atan2(_c.x - x, _c.z - z) - heading), Math.cos(Math.atan2(_c.x - x, _c.z - z) - heading));
        // the face turns to whoever is looking, but not right round to the back of the head; the ears turn all
        // the way, so that from any side there is one either side of the head
        faceM.rotation.y = Math.round(Math.max(-1.75, Math.min(1.75, yaw)) * 6) / 6;
        earM.rotation.y = Math.round(yaw * 6) / 6;
      }
    },
  };
}

// The sun (or the night's banana moon, or the rain's cloud) with the square window that frames the portal.
// Local space: the window faces +Z, the portal sits at the origin.
function buildSun(crayon, rng, look) {
  const C = PAL, g = new THREE.Group(), p = new Pen(rng);
  if (look === 'night') {
    const out = [], inn = [];
    for (let i = 0; i <= 22; i++) {
      const y = -20.4 + (i / 22) * 43.8, xo = 13 - Math.sqrt(Math.max(0, 576 - y * y)), xi = 33 - Math.sqrt(Math.max(0, 576 - (y - 3) * (y - 3)));
      out.push([xo, y]); inn.push([Math.max(xo + 0.4, xi), y]);
    }
    for (let i = 0; i < 22; i++) p.quad([out[i][0], out[i][1], -0.8], [inn[i][0], inn[i][1], -0.8], [inn[i + 1][0], inn[i + 1][1], -0.8], [out[i + 1][0], out[i + 1][1], -0.8], { col: C.yellow, w: 2.2, press: 0.9, ang: 0.5, abs: true, gap: false, kind: 3 });
    p.line(out.concat(inn.slice().reverse()).map((q) => [q[0], q[1], -0.8]), 1.0, { closed: true });
  } else if (look === 'rainy') {
    const pts = []; for (let i = 0; i < 42; i++) { const a = (i / 42) * Math.PI * 2, r = 19 + 5 * Math.abs(Math.sin(a * 3.5)); pts.push([Math.cos(a) * r * 1.35, Math.sin(a) * r * 0.9]); }
    p.save().tr(0, 0, -0.8).poly(pts, { col: C.black, w: 2.4, press: 0.42, ang: 0.4, outline: 1.0 }).restore();
    p.save().tr(0, 0, -0.5).disc(15.2, { n: 30, col: C.yellow, w: 1.6, press: 0.93, ang: 0.5, gap: false, outline: 0.5, lcol: C.yellow }).restore();
  } else {
    p.save().tr(0, 0, -0.8).disc(22, { n: 44, col: C.yellow, w: 2.4, press: 0.9, ang: 0.5, outline: 1.0 }).restore();
  }
  p.line([[-7.7, -7.7, 0.5], [7.7, -7.7, 0.5], [7.7, 7.7, 0.5], [-7.7, 7.7, 0.5]], 0.62, { closed: true });
  g.add(p.mesh(crayon.base, 'sun'));
  const rp = new Pen(rng);
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2, r0 = 25.5, r1 = 38 + (i % 2) * 4; rp.bar([Math.cos(a) * r0, Math.sin(a) * r0, -0.6], [Math.cos(a) * r1, Math.sin(a) * r1, -0.6], 1.25, { col: C.yellow }); }
  const rays = rp.mesh(crayon.base, 'sun-rays'); rays.visible = look !== 'night' && look !== 'rainy'; g.add(rays);
  const ip = new Pen(rng), inCol = look === 'night' || look === 'rainy' ? C.yellow : C.red;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + 0.13, r0 = look === 'rainy' ? 17.4 : 12.2, r1 = (look === 'rainy' ? 21.6 : 15.6) + (i % 2) * 1.6; ip.bar([Math.cos(a) * r0, Math.sin(a) * r0, 0.2], [Math.cos(a) * r1, Math.sin(a) * r1, 0.2], 0.62, { col: inCol }); }
  // the rain's sun keeps its fire: twelve red rays across the edge of the yellow disc, between the yellow ones
  if (look === 'rainy') for (let i = 0; i < 12; i++) { const a = ((i + 0.5) / 12) * Math.PI * 2 + 0.13, r1 = 17.6 + (i % 2) * 1.5; ip.bar([Math.cos(a) * 14.3, Math.sin(a) * 14.3, 0.25], [Math.cos(a) * r1, Math.sin(a) * r1, 0.25], 0.5, { col: C.red }); }
  const raysIn = ip.mesh(crayon.base, 'sun-rays-in'); g.add(raysIn);
  const curtains = [];
  for (const s of [-1, 1]) {
    const cp = new Pen(rng);
    cp.poly([[0, 7.6], [s * -8, 7.6], [0, -7.6]], { col: C.red, w: 1.1, press: 0.88, ang: 0.9 * s, back: {}, outline: 0.36 });
    const m = cp.mesh(crayon.base, 'curtain'); m.position.set(s * 7.6, 0, 1.0); g.add(m); curtains.push(m);
  }
  // a scribbled border round the window: one blue zigzag, drawn by someone who likes frames
  const bp = new Pen(rng), zig = [], R = 9.5, N = 9;
  for (let sd = 0; sd < 4; sd++) for (let i = 0; i < N; i++) {
    const t = (i / N) * 2 - 1, o = R + (i % 2 ? 0.85 : -0.45), ca = [1, 0, -1, 0][sd], sa = [0, 1, 0, -1][sd];
    // side sd runs along the edge whose outward normal is (ca, sa)
    zig.push([ca * o - sa * t * R, sa * o + ca * t * R, 0.35]);
  }
  bp.line(zig, 0.3, { col: C.blue, closed: true });
  g.add(bp.mesh(crayon.base, 'sun-border'));
  return {
    group: g,
    update(boil, open) {
      rays.rotation.z = -boil * (Math.PI / 8 / 16); raysIn.rotation.z = rays.rotation.z;
      const sx = 1 - 0.74 * open;
      curtains[0].scale.x = sx; curtains[1].scale.x = sx;
    },
  };
}

// ---------------------------------------------------------------------------------------------------------
const _sz = new THREE.Vector2();
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('crayon-hero') : ctx.rng;
  const own = !opts.crayon, crayon = opts.crayon || makeCrayon(), look = opts.look || 'sunny', demo = opts.demo !== false;
  const object = new THREE.Group(), houseG = new THREE.Group(); object.add(houseG);
  const pen = new Pen(rng); pen.step = 5; pen.m.set(1, LEAN, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  houseShell(pen, rng, look); await ctx.yield();
  houseStairs(pen, rng); await ctx.yield();
  houseRooms(pen, rng); await ctx.yield();
  houseDetails(pen, rng); await ctx.yield();
  // inside the house every line passes within a few metres: there a line is never fatter than a crayon
  const houseMat = crayon.make({ cap: 1.7 });
  houseG.add(pen.mesh(houseMat, 'house')); await ctx.yield();
  const live = houseLive(houseG, crayon, rng, houseMat), smoke2 = frontChimney(houseG, houseMat); await ctx.yield();
  const cat = buildCat(crayon, rng); object.add(cat.group); await ctx.yield();
  const sun = buildSun(crayon, rng, look); object.add(sun.group);
  const sunPos = opts.sunPos || new V3(40, 92, -64), sunDir = (opts.sunDir || new V3(-0.15, -0.3, 1)).clone().normalize();
  sun.group.position.copy(sunPos); sun.group.lookAt(sunPos.clone().add(sunDir));
  // the camera line: in at the door, up the three flights nine metres over the treads, out between two rafters
  const stairs = [[-3.6, 9.6, 50.5], [-4, 11.8, 35.5], [4, 20.2, 22.2], [8.5, 25.4, 15], [5.2, 27.2, 8.4], [-4, 34.2, -4.1], [-8.5, 38.4, -10.2],
    [-5, 40.4, -17.4], [4, 48.2, -30.4], [8.6, 54.6, -40.5], [10.4, 58.4, -46]].map((q) => lean(q[0], q[1], q[2]));
  const state = { door: 0, duck: 0, curtains: 0, cat: { x: 0, z: 78, heading: Math.PI / 2, walked: 0 } };
  if (demo) cat.place(0, 78, Math.PI / 2, 0, 0, null);
  return {
    object, radius: 78, height: 62, center: new V3(0, 30, 0), ground: true, groundY: -0.3,
    anchors: { door: lean(0, 10, 50), stairs, rafterGap: lean(9.5, 57, -43), sunWindow: sunPos.clone(), bath: lean(BATH[0], BATH[1] + 2.6, BATH[2]), bed: lean(BED[0], BED[1] + 3, BED[2]), fall: lean(FALL[0], BATH[1], FALL[2]), chimney: lean(CHIM[0] + 0.8, CHIM[1] + 8.2, CHIM[2]) },
    crayon, state, cat, sun, live,
    // st (optional, from the world): { door, duck, curtains: 0..1, cat: { x, z, heading, walked, tailUp } }, all functions of u
    update(dt, time, camera, st) {
      const boil = Math.floor(time * 8);
      if (own) crayon.tick(time, camera, ctx.renderer && ctx.renderer.getDrawingBufferSize ? ctx.renderer.getDrawingBufferSize(_sz).y : 0);
      let s = st;
      if (!s) {
        if (!demo) return;
        const a = (boil / 8) * 0.075, r = 66;
        s = state; s.door = Math.max(0, Math.sin(time * 0.5)) > 0.5 ? 1 : 0; s.duck = Math.min(1, Math.max(0, (time % 14) - 6) / 5); s.curtains = Math.sin(time * 0.4) > 0 ? 1 : 0;
        s.cat.x = Math.sin(a) * r; s.cat.z = Math.cos(a) * r * 1.25; s.cat.heading = a + Math.PI / 2; s.cat.walked = a * r;
      }
      live.update(boil, s.door, s.duck); smoke2.rotation.y = -boil * 0.3;
      sun.update(boil, s.curtains);
      cat.place(s.cat.x, s.cat.z, s.cat.heading, s.cat.walked, boil, camera, s.cat.tailUp);
    },
    dispose() {},
  };
}
