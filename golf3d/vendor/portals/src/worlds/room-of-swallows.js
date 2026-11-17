// THE ROOM OF SWALLOWS
// A small upstairs room in a Bronze Age house on Thera, twenty-five times life size (100 x 85 x 75 m), flown at
// the size of a moth. The painted walls (all four now: the fresco runs on round the niche, the window and the door of
// the east wall), the lilies, the swallows, the gust and the kiss are the hero (src/parts/room-of-swallows.js). This
// file is the real room round them: a floor of four-coloured flags with a painted border (a running spiral on red
// ochre, rosettes in the corners) and analytic cast shadows, reed-mat ceiling on round joists, the stone window, the
// cupboard niche and the reed-hung door, and the things of a lived-in room: the unmade bed, jar, offering table with
// figs and a jug of lilies, cups, mats with fringes, sandals, a warp-weighted loom whose clay weights swing in the gust,
// two store jars in the north-west corner, a chest with wool, a vase of cut lilies, two stone lamps and a niche lamp
// alight, the wall lizard (or a sparrow), the shaft of sun with its dust, and the sea haze outside.
// Space: world == hero-local. +X east (window wall), +Z south, floor centre at the origin, y 0..75.
// Flight (u; the route is the brief's lap except that the east leg runs 30 m from the window wall, 413 m in all):
// 0-0.17 in by the door, west under the south wall, the red crag dead ahead; a loose flock of eight leaves the south
// wall ahead of us (to 0.03) and lies down again (0.105-0.146), the first kiss is over the crag (0.107-0.13);
// 0.17-0.30 round the corner and THE CLOSE PASS along the west wall, a second flock strung out ahead of us along the
// crags (0.155-0.20, home before the store jars), a pair meeting overhead (0.242-0.265), the loom and the jars passing on the right;
// 0.30-0.42 east toward the sun shape on the north wall, a third flock ahead (0.325-0.36), the seventh pair peels off
// at the shape's east edge (0.35-0.362) and spirals in front of its ghosts until 0.428;
// 0.42-0.55 the turn south and THE WINDOW WALL seen whole from 30 m (gaze 0.45-0.578): stone frame, portal, painted
// piers, the lizard running or the sparrow hopping on the sill (0.488-0.54) with nothing flying across it, and a pair
// kissing beside the window above the niche (0.50-0.526);
// 0.55-0.67 round the corner and west again at lily height. The eye turns across the room on the corner (bed poi from
// 0.555): the bed, loom and painted floor below, the west wall's rocks and lilies across the middle, and the fourth
// flock, which left the top of the window wall unseen (0.478-0.53), strung out as eight separate birds along the west
// wall and round the north-west corner (in frame 0.58-0.70), sinking with the gaze (0.60-0.645); 0.67-0.79 the slow half
// turn over the bed while the string climbs home along the north wall and lies down over the window (0.75-0.79);
// the kiss 0.795-0.818, carried along 15 m ahead of the eye; 0.82-0.90 the pair parts and sails either side of the
// window ahead of us; 0.79-1 straight out of the window to the portal (the sparrow waits on an upturned jar far out
// on the window's stone floor, the lizard on the right jamb).
// The shaft of sun is a soft body seen from the side only; it is gone by 0.775, before the eye turns to the window.
// Rare (ctx.vary.rare): the tremor, u 0.44-0.60: shudder 0.44-0.50, three veils of dust from the joists, the long
// crack runs on, all eighty-six swallows wheel over the bed in five tiers of one ring (0.445-0.578). Looks by seed: spring, noon,
// unfinished wall (the colour waits at the red crag, then floods north 17 m ahead of the eye through the close pass,
// u 0.17-0.335: near wall in colour, far wall red sketch); ctx.vary.hour 'day' gives noon, 'night' the same room
// under a low moon. Cast by seed: lizard or sparrow, jar / strainer / baskets.
// ROUND FOUR (this replaces the flight notes above where they differ; the route itself is unchanged):
// 0.10-0.215 the eye stands back from the south-west corner and holds a kissing pair (hold about 0.14-0.18) with the
// crags, lilies and loom behind it; 0.185-0.32 a second pair kisses over the store jars (hold about 0.23-0.27) while
// the colour floods north behind it; 0.40-0.475 THE CEILING: the eye looks up at the reed panels and joists and a ring
// of fourteen swallows wheeling under them (ring in the air 0.345-0.55); 0.45-0.578 the window wall over the sill, the
// eye turning from the door to the niche at the end; 0.612-0.78 THE LEAVING: every swallow leaves the plaster for good
// (0.623-0.668) and one ribbon crosses the room over loom and bed, hangs over the kiss (0.795-0.818) and pours out of
// the window (0.82-0.97); the seventh pair meets a second time in the opening (0.922-0.952) between jambs painted
// with lilies. The shaft of sun thins while the eye looks along it (0.355-0.5) and is gone by 0.69.
// Everything is unlit ShaderMaterial writing exact pigments (post flat 1): painted walls take no shading,
// real things take two flat steps (lit side, shade side) with a hard edge and a hard cast shadow.
import * as THREE from 'three';
import { makePath, smoothstep, clamp, lerp } from '../kit/core.js';
import { buildHero, buildFlyThrough } from '../parts/room-of-swallows.js';

const PALETTE = ['#EFE8DA', '#FFFBF0', '#A63A24', '#D9A441', '#3A6EA5', '#1E1B1A', '#A9C9DF'];
const RX = 50, RZ = 42.5, RH = 75, WALL_T = 15;
const WIN = { z0: -9.5, z1: 8.5, y0: 28, y1: 52 };
const DOOR = { z0: 21.5, z1: 37.5, y1: 50 };
const NICHE = { z0: -37, z1: -22, y0: 20, y1: 42, d: 6 };
const BED = { x: -8, z: 3.5, w: 40, d: 18, h: 8 };
const TABLE = { x: 16, z: -15.5 };
const JAR = { x: 24, z: 9.5 };
const TAU = Math.PI * 2;
const SHADE = 0.55;      // linear: the shade step reads as about three quarters of the lit tone on screen
const LOOKS = ['spring', 'noon', 'unfinished'];
const PERCH = [RX + 11.3, 3.0, WIN.z1 - 2.1];   // the upturned jar far out on the window's stone floor: x, height, z
const DUR = 47;

const mixc = (a, b, t) => a.clone().lerp(b, t);

// ---------------------------------------------------------------- geometry helpers
// One merged, vertex-coloured batch. Attributes: position, normal, aC (linear colour), aQ (u, v, kind, sway).
function makeBatch() {
  const P = [], N = [], C = [], Q = [], I = [];
  let n = 0;
  const m4 = new THREE.Matrix4(), n3 = new THREE.Matrix3(), v = new THREE.Vector3(), e = new THREE.Euler(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  return {
    get count() { return I.length / 3; },
    // o: p [x,y,z], r [rx,ry,rz], s scale (number or [x,y,z]), c Color, kind, uv [su, sv] scale (or fn(x,y,z,u,v)->[u,v] on
    // the transformed vertex), sway
    add(geo, o = {}) {
      const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv, col = geo.attributes.color;
      e.set(...(o.r || [0, 0, 0])); q.setFromEuler(e);
      const s = o.s ?? 1;
      if (typeof s === 'number') sc.set(s, s, s); else sc.set(s[0], s[1], s[2]);
      m4.compose(v.set(...(o.p || [0, 0, 0])), q, sc);
      n3.getNormalMatrix(m4);
      const c = o.c, kind = o.kind || 0, sway = o.sway || 0, su = o.uv && !o.uv.call ? o.uv[0] : 1, sv = o.uv && !o.uv.call ? o.uv[1] : 1;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(m4);
        const px = v.x, py = v.y, pz = v.z;
        P.push(px, py, pz);
        v.fromBufferAttribute(nor, i).applyMatrix3(n3).normalize();
        N.push(v.x, v.y, v.z);
        if (col) C.push(col.getX(i), col.getY(i), col.getZ(i)); else C.push(c.r, c.g, c.b);
        let u0 = uv ? uv.getX(i) : 0, v0 = uv ? uv.getY(i) : 0;
        if (o.uv && o.uv.call) { const r = o.uv(px, py, pz, u0, v0); u0 = r[0]; v0 = r[1]; } else { u0 *= su; v0 *= sv; }
        Q.push(u0, v0, kind, typeof sway === 'function' ? sway(px, py, pz) : sway);
      }
      if (geo.index) { const ix = geo.index; for (let i = 0; i < ix.count; i++) I.push(n + ix.getX(i)); }
      else for (let i = 0; i < pos.count; i++) I.push(n + i);
      n += pos.count;
      geo.dispose();
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      g.setAttribute('aC', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aQ', new THREE.Float32BufferAttribute(Q, 4));
      g.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      g.computeBoundingSphere();
      return g;
    },
  };
}

// a box with chamfered, smooth-shaded edges (radius r): the hard light/shade edge of the two-step shading runs along the bevel
function rbox(w, h, d, r = 0.3) {
  const g = new THREE.BoxGeometry(w, h, d, 3, 3, 3);
  const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv;
  const half = [w / 2, h / 2, d / 2], inner = [w / 2 - r, h / 2 - r, d / 2 - r], p = [0, 0, 0], c = [0, 0, 0], v = [0, 0, 0];
  for (let i = 0; i < pos.count; i++) {
    p[0] = pos.getX(i); p[1] = pos.getY(i); p[2] = pos.getZ(i);
    const ax = Math.abs(nor.getX(i)), ay = Math.abs(nor.getY(i));
    for (let a = 0; a < 3; a++) {
      const pa = Math.sign(p[a]) * (Math.abs(p[a]) > half[a] * 0.99 ? half[a] : inner[a]);
      c[a] = clamp(pa, -inner[a], inner[a]); v[a] = pa - c[a];
    }
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    v[0] /= l; v[1] /= l; v[2] /= l;
    pos.setXYZ(i, c[0] + v[0] * r, c[1] + v[1] * r, c[2] + v[2] * r);
    nor.setXYZ(i, v[0], v[1], v[2]);
    if (ax > 0.5) uv.setXY(i, pos.getZ(i), pos.getY(i)); else if (ay > 0.5) uv.setXY(i, pos.getX(i), pos.getZ(i)); else uv.setXY(i, pos.getX(i), pos.getY(i));
  }
  return g;
}

// a body of revolution from a profile [[r, y, colour?], ...] (bottom to top). Colour is flat per profile segment
// (rings are not shared between segments of different colour), normals are smooth. uv = (arc metres, profile metres).
function lathe(profile, seg, baseCol) {
  const P = [], N = [], C = [], U = [], I = [];
  const np = profile.length;
  const nrm = [];
  for (let i = 0; i < np; i++) {
    const a = profile[Math.max(0, i - 1)], b = profile[Math.min(np - 1, i + 1)];
    let dr = b[0] - a[0], dy = b[1] - a[1];
    const l = Math.hypot(dr, dy) || 1;
    nrm.push([dy / l, -dr / l]);
  }
  let len = 0, n = 0;
  for (let i = 0; i < np - 1; i++) {
    const a = profile[i], b = profile[i + 1], col = a[2] || baseCol, l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    for (let k = 0; k < 2; k++) {
      const p = k ? b : a, nn = nrm[i + k], vv = len + k * l;
      for (let j = 0; j <= seg; j++) {
        const th = (j / seg) * TAU, cs = Math.cos(th), sn = Math.sin(th);
        P.push(p[0] * cs, p[1], p[0] * sn); N.push(nn[0] * cs, nn[1], nn[0] * sn); C.push(col.r, col.g, col.b);
        U.push((j / seg) * TAU * Math.max(a[0], b[0], 0.2), vv);
      }
    }
    for (let j = 0; j < seg; j++) {
      const i0 = n + j, i1 = n + j + 1, i2 = n + seg + 1 + j, i3 = i2 + 1;
      I.push(i0, i2, i1, i1, i2, i3);
    }
    n += 2 * (seg + 1); len += l;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I);
  return g;
}
// one quad from four corners (counter-clockwise seen from its front), with uv in metres
function quad(a, b, c, d, uva, uvb, uvc, uvd) {
  const g = new THREE.BufferGeometry();
  const n = new THREE.Vector3().subVectors(new THREE.Vector3(...b), new THREE.Vector3(...a)).cross(new THREE.Vector3().subVectors(new THREE.Vector3(...d), new THREE.Vector3(...a))).normalize();
  g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...c, ...d], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z, n.x, n.y, n.z], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([...(uva || [0, 0]), ...(uvb || [1, 0]), ...(uvc || [1, 1]), ...(uvd || [0, 1])], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  return g;
}

// ---------------------------------------------------------------- shaders
// Hard cast shadows of the real things, worked out per fragment from a short list of slabs and tapered posts:
// a point is shaded when the line from it toward the key light meets one of them. Constants are baked at build.
function shadowGLSL(slabs, tapers) {
  const f = (x) => (Math.round(x * 1000) / 1000).toFixed(3);
  let body = '';
  for (const b of slabs) body += `  sh = max(sh, slabSh(p, s, py, vec4(${b.slice(0, 4).map(f).join(', ')}), vec2(${f(b[4])}, ${f(b[5])})));\n`;
  for (const t of tapers) body += `  sh = max(sh, taperSh(p, s, py, vec2(${f(t[0])}, ${f(t[1])}), vec2(${f(t[2])}, ${f(t[3])}), vec2(${f(t[4])}, ${f(t[5])})));\n`;
  return /* glsl */`
float slabSh(vec3 p, vec2 s, float py, vec4 b, vec2 yy){
  float h0 = max(yy.x, py) - p.y, h1 = yy.y - p.y;
  vec2 lo = (b.xz - p.xz) / s, hi = (b.yw - p.xz) / s;
  vec2 t0 = min(lo, hi), t1 = max(lo, hi);
  float ov = min(min(t1.x, t1.y), h1) - max(max(t0.x, t0.y), h0);
  return clamp(ov / max(fwidth(ov), 1e-4) + 0.5, 0.0, 1.0);
}
float taperSh(vec3 p, vec2 s, float py, vec2 c, vec2 yy, vec2 rr){
  float h0 = max(yy.x, py) - p.y, h1 = yy.y - p.y;
  float ok = step(0.01, h1 - h0);
  float dh = max(h1 - h0, 0.01);
  vec2 a = p.xz + s * h0 - c, d = s * dh;
  float t = clamp(-dot(a, d) / max(dot(d, d), 1e-4), 0.0, 1.0);
  float r = mix(rr.x, rr.y, clamp((h0 + t * dh + p.y - yy.x) / max(yy.y - yy.x, 0.01), 0.0, 1.0));
  float dist = length(a + d * t) - r;
  return ok * clamp(0.5 - dist / max(fwidth(dist), 1e-4), 0.0, 1.0);
}
float castShadow(vec3 p, vec3 L){
  vec2 s = L.xz / max(L.y, 0.08);
  s = vec2(s.x >= 0.0 ? max(s.x, 0.02) : min(s.x, -0.02), s.y >= 0.0 ? max(s.y, 0.02) : min(s.y, -0.02));
  float py = p.y + 0.4;
  float sh = 0.0;
${body}  return sh;
}
`;
}

const COMMON_VERT = /* glsl */`
attribute vec3 aC; attribute vec4 aQ;
varying vec3 vC, vN, vP; varying vec4 vQ;
`;

// floor, ceiling matting, the plain east wall, the stone reveal: world-space patterns on big planes
function shellFrag(G, shadow) {
  return /* glsl */`
uniform float uTime;
uniform vec3 uKey, uPlaster, uPlasterSun, uJoint, uSlateA, uSlateB, uSlateC, uSlateD, uRed, uBlue, uInk, uStone, uReedA, uReedB, uReedC;
varying vec3 vC, vN, vP; varying vec4 vQ;
${G.sun}
${G.hash}
${G.crack}
${shadow}
float hair(float c, float w){ return 1.0 - smoothstep(w * 0.5, w, abs(c) / max(fwidth(c), 1e-5)); }
float is(float k, float v){ return step(abs(k - v), 0.25); }
float bandF(float s, float a, float b, float e){ return smoothstep(a - e, a + e, s) * (1.0 - smoothstep(b - e, b + e, s)); }
void main(){
  float kind = floor(vQ.z + 0.5);
  float kF = is(kind, 0.0), kC = is(kind, 1.0), kP = is(kind, 2.0), kS = is(kind, 3.0);
  vec2 q = mix(vQ.xy, vP.xz, kF + kC);
  float px = clamp(max(length(dFdx(q)), length(dFdy(q))), 1e-4, 6.0);
  vec3 N = normalize(vN);
  float sun = sunAt(vP);

  // ---- cells: slate flags on the floor, dressed blocks in the reveal
  float H = mix(11.0, 4.0, kS);
  float row = floor(q.y / H), fy = q.y - row * H;
  float hr = hash21(vec2(row, 3.7));
  float W = mix(13.0 + 6.0 * hr, 6.5 + 4.0 * hr, kS);
  float xx = q.x + 60.0 * hash21(vec2(row, 9.1));
  float ci = floor(xx / W), fx = xx - ci * W;
  float split = step(0.6, hash21(vec2(ci, row))) * kF;
  float hf = step(H * 0.5, fy) * split;
  float dy = min(fy, H - fy);
  dy = mix(dy, min(dy, abs(fy - H * 0.5)), split);
  float jd = min(min(fx, W - fx), dy);
  float fh = hash21(vec2(ci + 0.37 * hf, row) + 0.5);

  // ---- hairline marks: straight cleavage across each slate flag (its own direction), tooling on stone
  float ca = cos(fh * 6.2832), sa = sin(fh * 6.2832);
  vec2 qr = mix(q, vec2(ca * q.x - sa * q.y, sa * q.x + ca * q.y), kF);
  vec2 isc = kF * vec2(0.035, 0.55) + kP * vec2(0.075, 0.095) + kS * vec2(0.3, 0.8) + kC * vec2(0.03, 0.03);
  vec2 iq = qr * isc + (kF + kS) * fh * 57.0 + 7.3;
  float n1 = vnoise(iq) + 0.5 * vnoise(iq * 2.3 + 5.0);
  float lineMany = hair(sin(n1 * 9.0), 1.3) * (1.0 - smoothstep(0.12, 0.4, px));
  // plaster cracks: a few angular, forking hairlines (the same field as the painted walls)
  float crack = crackLines(q + vec2(131.0, 57.0), px) * kP;

  // ---- floor
  vec3 slate = fh < 0.3 ? uSlateA : (fh < 0.56 ? uSlateB : (fh < 0.82 ? uSlateC : uSlateD));
  vec3 fl = slate * (1.0 - 0.13 * lineMany * smoothstep(0.3, 0.55, vnoise(q * 0.17 + 3.0)));
  float jw = 0.2, jwe = max(jw, 0.75 * px);
  float joint = (1.0 - smoothstep(jwe - 0.7 * px, jwe + 0.7 * px, jd)) * min(1.0, jw / jwe + 0.3);
  fl = mix(fl, uJoint, joint);
  // the painted border: round the whole room, in lime plaster laid over the flags, a band of red ochre carrying a
  // running spiral between black lines, then a plaster band and a blue line; a rosette in each corner
  {
    float dWx = 50.0 - abs(q.x), dWz = 42.5 - abs(q.y);
    float dB = min(dWx, dWz);
    float inRoom = step(0.0, dWx);
    float al = dWx < dWz ? q.y : q.x;
    float e2 = max(px, 0.02);
    float band = bandF(dB, 1.9, 8.9, e2), blk = bandF(dB, 1.3, 1.9, e2) + bandF(dB, 8.9, 9.5, e2);
    float pla = bandF(dB, -0.5, 1.3, e2) + bandF(dB, 9.5, 10.7, e2), blu = bandF(dB, 10.7, 11.3, e2);
    vec3 bc = uRed;
    // running spiral: two-armed spirals 8 m apart, each joined to the next by their common tangent
    float P = 8.0, R = 2.55, pt = 1.0, lw = 0.24;
    float cx = (fract(al / P + 0.5) - 0.5) * P, Y = dB - 5.4;
    vec2 v = vec2(cx, Y); v.x += step(dot(v, v), 1e-6) * 1e-3;
    float r = length(v), th = atan(v.y, v.x);
    float gA = fract(r / pt + th / 3.14159265 - (R / pt + 0.28));
    float arm = (1.0 - smoothstep(lw - e2, lw + e2, min(gA, 1.0 - gA) * pt)) * (1.0 - smoothstep(R + lw - e2, R + lw + e2, r));
    float d1 = 0.6375 * (cx - 0.5 * P) + 0.7705 * Y, d2 = 0.6375 * (cx + 0.5 * P) + 0.7705 * Y;
    float link = max((1.0 - smoothstep(lw - e2, lw + e2, abs(d1))) * step(1.62, cx), (1.0 - smoothstep(lw - e2, lw + e2, abs(d2))) * step(cx, -1.62));
    float eye = 1.0 - smoothstep(0.55 - e2, 0.55 + e2, r);
    bc = mix(bc, uPlaster, mix(0.26 * step(abs(Y), R + lw), max(arm, link), 1.0 - smoothstep(0.3, 1.0, px)));
    bc = mix(bc, uBlue, eye);
    // corner panels
    vec2 cq = vec2(dWx, dWz) - 5.4;
    float corner = step(max(dWx, dWz), 8.9) * step(1.9, dB);
    cq.x += step(dot(cq, cq), 1e-6) * 1e-3;
    float cr = length(cq), ca2 = atan(cq.y, cq.x);
    float petal = 1.0 - smoothstep(-e2, e2, cr - 3.0 * (0.5 + 0.5 * abs(cos(4.0 * ca2))));
    vec3 cc = mix(uPlaster, uRed, petal);
    cc = mix(cc, uInk, (1.0 - smoothstep(0.16 - e2, 0.16 + e2, abs(cr - 3.25))) );
    cc = mix(cc, uBlue, 1.0 - smoothstep(0.8 - e2, 0.8 + e2, cr));
    bc = mix(bc, cc, corner);
    vec3 paint = bc * band + uInk * min(blk, 1.0) + uPlaster * 0.97 * min(pla, 1.0) + uBlue * blu;
    float cover = min(band + blk + pla + blu, 1.0) * inRoom;
    // worn: the paint has gone from the flag joints and in a few scuffed patches
    float wear = smoothstep(0.62, 0.8, vnoise(q * 0.21 + 17.0)) * 0.55 + 0.45 * joint;
    fl = mix(fl, paint, cover * (1.0 - wear * (1.0 - smoothstep(0.3, 1.2, px))));
  }
  // swept dust: drifts along the wall foot, round the bed posts and the big vessel, broom arcs between them,
  // and almost none on the open flags
  float dW = min(50.0 - abs(q.x), 42.5 - abs(q.y)) + 2.6 * (vnoise(q * 0.13 + 3.0) - 0.5) + 0.7 * (vnoise(q * 0.8) - 0.5);
  float drift = 1.0 - smoothstep(0.5, 4.4, dW);
  float dL = length(abs(q - vec2(${BED.x.toFixed(1)}, ${BED.z.toFixed(1)})) - vec2(${(BED.w / 2 - 1.6).toFixed(1)}, ${(BED.d / 2 - 1.6).toFixed(1)})) + 1.3 * (vnoise(q * 0.5 + 9.0) - 0.5);
  drift = max(drift, 1.0 - smoothstep(2.0, 4.6, dL));
  float dJ = length(q - vec2(${JAR.x.toFixed(1)}, ${JAR.z.toFixed(1)})) + 1.3 * (vnoise(q * 0.5 + 4.0) - 0.5);
  drift = max(drift, 1.0 - smoothstep(3.6, 6.4, dJ));
  float arcs = smoothstep(0.52, 0.7, vnoise(q * 0.05 + 3.0)) * smoothstep(0.5, 0.62, sin(length(q - vec2(-70.0, 90.0)) * 0.9));
  drift = max(drift, 0.42 * arcs);
  vec2 dq = q / 0.36; vec2 di = floor(dq); float dh = hash21(di);
  vec2 dc = di + 0.5 + 0.6 * (vec2(hash21(di + 3.1), hash21(di + 7.7)) - 0.5);
  float dr = 0.02 + 0.04 * hash21(di + 1.7);
  float dre = max(dr, 0.8 * px);
  float speck = (1.0 - smoothstep(dre - 0.6 * px, dre + 0.6 * px, length(dq - dc) * 0.36)) * min(1.0, (dr * dr) / (dre * dre));
  float dust = speck * step(dh, 0.012 + 0.9 * drift * sqrt(drift));
  fl = mix(fl, uPlaster, dust * 0.9);
  // the thickest of it lies as one flat pale strip against the wall, and far off the drifts read as a paler tone
  float heap = 1.0 - smoothstep(0.8 - px, 0.8 + px, dW);
  fl = mix(fl, uPlaster * 0.9, max(0.5 * heap, 0.3 * drift * drift * smoothstep(0.04, 0.2, px)));
  float sh = castShadow(vP, uKey) * kF;
  fl = mix(fl, fl * vec3(0.43, 0.45, 0.52), sh);
  fl = mix(fl, mix(fl, uPlasterSun, 0.32), sun * (1.0 - sh));

  // ---- ceiling: reed matting in the shade
  // (the mats lie in panels between the joists; the reeds of every other panel run the other way, so that from the floor
  // the ceiling is a chequer of two straw tones crossed by dark lashings, never one flat field)
  float pj = floor((q.x + 49.965) / 8.33), pk = floor((q.y + 42.5) / 10.625);
  float alt = mod(pj + pk, 2.0);
  vec2 rq = mix(q, q.yx, alt);
  float ri = floor(rq.y / 0.5);
  float rh = hash21(vec2(ri, 1.3 + pj * 7.0 + pk * 3.0));
  vec3 reed = rh < 0.45 ? uReedA : (rh < 0.85 ? uReedB : uReedC);
  float bd = abs(fract(rq.x / 6.25 + 0.5) - 0.5) * 6.25;
  float bind = 1.0 - smoothstep(0.12 - px, 0.12 + px, bd);
  reed = mix(reed, uReedC * 0.8, bind);
  vec3 ce = mix(reed, (uReedA + uReedB) * 0.5, smoothstep(0.12, 0.4, px)) * mix(1.0, 0.8, alt);
  float lz = abs(fract((q.y + 42.5) / 10.625 + 0.5) - 0.5) * 10.625;
  float lash = 1.0 - smoothstep(0.32 - px, 0.32 + px, lz);
  float lz2 = abs(lz - 0.95);
  lash = max(lash, 0.7 * (1.0 - smoothstep(0.1 - px, 0.1 + px, lz2)) * (1.0 - smoothstep(0.3, 0.9, px)));
  ce = mix(ce, uReedC * 0.62, lash);
  ce = mix(ce, uRed * 0.9, lash * step(0.5, mod(pk, 2.0)) * (1.0 - smoothstep(0.1 - px, 0.1 + px, abs(lz - 0.0))));

  // ---- plain plaster: hairline cracks, a day-join, the one red band
  vec3 pl = uPlaster * (1.0 - 0.17 * crack);
  float jn = vP.y - (38.6 + 2.4 * (vnoise(vec2(vP.z * 0.05, 3.0)) - 0.5));
  pl *= 1.0 - 0.07 * (1.0 - smoothstep(0.0, 1.6 * px, abs(jn))) * step(0.99, vQ.w);
  float e = px * 0.8;
  float band = smoothstep(69.6 - e, 69.6 + e, vP.y) * (1.0 - smoothstep(71.6 - e, 71.6 + e, vP.y)) * step(0.99, vQ.w);
  pl = mix(pl, uRed, band);
  pl *= min(vQ.w, 1.0);

  // ---- dressed stone: flat tone per block, dark joints, a few tooling marks, lit side and shade side
  vec2 pq = q / 1.3; vec2 pc = floor(pq); vec2 pf = fract(pq) - 0.5;
  vec2 pr = vec2(pf.x + pf.y, pf.x - pf.y) * 0.7071 + (vec2(hash21(pc + 2.0), hash21(pc + 5.0)) - 0.5) * 0.3;
  float peck = (1.0 - smoothstep(0.2, 0.25, abs(pr.x))) * (1.0 - smoothstep(0.03, 0.03 + px, abs(pr.y))) * step(0.55, hash21(pc + 17.0)) * (1.0 - smoothstep(0.08, 0.25, px));
  vec3 st = uStone * (0.89 + 0.05 * floor(fh * 4.0)) * (1.0 - 0.1 * peck);
  st = mix(st, st * vec3(1.02, 0.97, 0.8), 0.6 * smoothstep(0.66, 0.7, vnoise(q * 0.42 + 40.0)) * step(0.4, vnoise(q * 3.1)));
  float sw = 0.1, swe = max(sw, 0.75 * px);
  float sj = (1.0 - smoothstep(swe - 0.7 * px, swe + 0.7 * px, jd)) * min(1.0, sw / swe + 0.25);
  st = mix(st, uStone * 0.6, sj);
  float ndl = dot(N, uSunDir) - 0.02;
  float lit = clamp(ndl / max(fwidth(ndl), 1e-4) + 0.5, 0.0, 1.0);
  st *= mix(${SHADE.toFixed(2)}, 1.0, lit) * min(vQ.w, 1.0);

  vec3 col = fl * kF + ce * ${SHADE.toFixed(2)} * kC + pl * kP + st * kS;
  gl_FragColor = vec4(col, 1.0);
}
`;
}
const SHELL_VERT = /* glsl */`${COMMON_VERT}
void main(){
  vC = aC; vQ = aQ; vP = position; vN = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// every modelled thing: vertex colour, two flat steps of light, cast shadow, and a few flat marks by kind
// kinds: 0 plain, 1 wood, 2 clay, 3 weave, 4 stone, 5 striped cloth, 6 hide, 7 reed; +16 = lit by the room (east wall things)
function realVert(G) {
  return /* glsl */`${COMMON_VERT}
uniform float uTime, uShake;
${G.gust}
void main(){
  vC = aC; vQ = aQ;
  vec3 p = position;
  float sw = aQ.w;
  vec2 g = gustAt(-30.0 - 0.4 * p.x);
  float a = sw * (0.35 * g.x + 0.05 * sin(uTime * 1.7 + p.x * 0.4 + p.z * 0.3) + 0.25 * uShake * sin(uTime * 23.0 + p.x));
  // a lamp flame (kind 8) never stands still
  float fk = step(7.5, aQ.z) * step(aQ.z, 8.5);
  a += fk * sw * (0.2 * sin(uTime * 9.0 + p.x * 2.0) + 0.12 * sin(uTime * 15.7 + p.z * 3.0));
  p += vec3(0.5 * a, 0.9 * a * sin(p.x * 0.6 + uTime * 2.2), 0.8 * a);
  vP = p; vN = normal;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;
}
function realFrag(G, shadow) {
  return /* glsl */`
uniform float uTime;
uniform vec3 uKey, uKey2, uPlaster, uPlasterSun, uRed, uBlue, uFlame;
varying vec3 vC, vN, vP; varying vec4 vQ;
${G.sun}
${G.hash}
${shadow}
float hair(float c, float w){ return 1.0 - smoothstep(w * 0.5, w, abs(c) / max(fwidth(c), 1e-5)); }
float is(float k, float v){ return step(abs(k - v), 0.25); }
float bandIn(float s, float a, float b, float e){ return smoothstep(a - e, a + e, s) * (1.0 - smoothstep(b - e, b + e, s)); }
void main(){
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float kind = floor(vQ.z + 0.5);
  float alt = step(15.5, kind); kind -= 16.0 * alt;
  vec3 L = normalize(mix(uKey, uKey2, alt));
  float ndl = dot(N, L) - 0.05;
  float lit = clamp(ndl / max(fwidth(ndl), 1e-4) + 0.5, 0.0, 1.0);
  float sh = castShadow(vP, uKey) * (1.0 - alt) * step(vP.y, 30.0);
  lit = min(lit, 1.0 - sh);
  float kWood = is(kind, 1.0), kClay = is(kind, 2.0), kWeave = is(kind, 3.0), kStone = is(kind, 4.0), kCloth = is(kind, 5.0), kHide = is(kind, 6.0), kReed = is(kind, 7.0);
  vec2 q = vQ.xy;
  float px = clamp(max(length(dFdx(q)), length(dFdy(q))), 1e-4, 6.0);
  vec3 col = vC;

  // hairline marks: grain, wheel lines, tooling, creases
  vec2 isc = kWood * vec2(0.09, 1.3) + kClay * vec2(0.03, 1.6) + kStone * vec2(0.3, 0.8) + kHide * vec2(0.5, 0.2) + kReed * vec2(0.04, 5.0) + kCloth * vec2(0.05, 0.6);
  float n1 = vnoise(q * isc + 3.7) + 0.5 * vnoise(q * isc * 2.6 + 9.0);
  float marks = hair(sin(n1 * (7.0 + 5.0 * kWood - 4.5 * kStone)), 1.3) * (1.0 - smoothstep(0.1, 0.35, px));
  vec2 pq = q / 1.3; vec2 pc = floor(pq); vec2 pf = fract(pq) - 0.5;
  vec2 pr = vec2(pf.x + pf.y, pf.x - pf.y) * 0.7071 + (vec2(hash21(pc + 2.0), hash21(pc + 5.0)) - 0.5) * 0.3;
  float peck = (1.0 - smoothstep(0.2, 0.25, abs(pr.x))) * (1.0 - smoothstep(0.03, 0.03 + px, abs(pr.y))) * step(0.55, hash21(pc + 17.0)) * (1.0 - smoothstep(0.08, 0.25, px));
  col *= 1.0 - marks * (0.2 * kWood + 0.07 * kClay + 0.1 * kHide + 0.2 * kReed + 0.06 * kCloth) - 0.1 * peck * kStone;
  // wood: a darker knot here and there
  float kn = smoothstep(0.86, 0.9, vnoise(q * vec2(0.22, 0.7) + 40.0));
  col *= 1.0 - 0.22 * kn * kWood;
  // clay: sparse dark grits
  vec2 gi = floor(q / 0.45);
  float grit = step(0.93, hash21(gi)) * (1.0 - smoothstep(0.1, 0.3, px));
  col *= 1.0 - 0.16 * grit * kClay * step(length(fract(q / 0.45) - 0.5), 0.22);

  // weave: over and under, with a dark line where strands cross (q is in strand widths)
  vec2 wi = floor(q), wf = fract(q);
  float over = mod(wi.x + wi.y, 2.0);
  float wedge = min(min(wf.x, 1.0 - wf.x), min(wf.y, 1.0 - wf.y));
  float wline = 1.0 - smoothstep(0.07 - px, 0.07 + px, wedge);
  vec3 wv = col * mix(0.84, 1.0, over) * (1.0 - 0.3 * wline);
  wv = mix(wv, col * 0.92, smoothstep(0.2, 0.6, px));
  col = mix(col, wv, kWeave);

  // striped cloth: red ground, plaster and blue stripes across v (metres)
  float s = fract(q.y / 7.0), e = px / 7.0;
  float white = bandIn(s, 0.06, 0.16, e) + bandIn(s, 0.56, 0.6, e) + bandIn(s, 0.7, 0.74, e);
  float blue = bandIn(s, 0.22, 0.27, e) + bandIn(s, 0.63, 0.67, e);
  vec3 cl = mix(mix(col, uPlaster, white), uBlue, blue);
  col = mix(col, cl, kCloth);

  // reed: a dark node every couple of metres
  float nd = abs(fract(q.x / 2.3 + hash21(vec2(floor(q.y), 2.0))) - 0.5) * 2.3;
  col *= 1.0 - 0.3 * kReed * (1.0 - smoothstep(0.06 - px, 0.06 + px, nd));

  float sun = sunAt(vP) * lit;
  col *= mix(${SHADE.toFixed(2)}, 1.0, lit);
  col = mix(col, mix(col, uPlasterSun, 0.25), sun);
  // a flame is its own light: flat, in two tones, a pale heart inside a yellow and red tongue
  float kFlame = is(kind, 8.0);
  float heart = 1.0 - smoothstep(0.42, 0.5, abs(dot(N, normalize(cameraPosition - vP))) * -1.0 + 1.0);
  col = mix(col, mix(vC, uFlame, heart * step(vQ.y, 1.7)), kFlame);
  gl_FragColor = vec4(col, 1.0);
}
`;
}

// the reed curtain in the doorway: 200 hanging reeds, pushed into the room by each gust
function curtainVert(G) {
  return /* glsl */`
attribute vec4 iA;      // z, phase, tone, length
uniform float uTime, uShake, uShow;
varying vec3 vR;        // z across the door, y, tone
${G.gust}
void main(){
  float t = position.y;
  float w = pow(t, 1.4);
  vec2 g = gustAt(-8.0 + 0.4 * (iA.x - 29.5));
  float sway = w * (2.2 * max(g.x, -0.2) + 0.3 * sin(uTime * 1.4 + iA.y * 6.283) + 0.12 * sin(uTime * 3.3 + iA.y * 40.0) + 0.6 * uShake * sin(uTime * 9.0 + iA.y * 20.0));
  float side = 0.3 * w * sin(uTime * 1.1 + iA.y * 11.0) * (0.3 + g.x);
  vec3 p = vec3(52.5 - sway, ${DOOR.y1.toFixed(1)} - t * iA.w + 0.12 * abs(sway), iA.x + position.x * 0.085 + side);
  vR = vec3(iA.x, t * iA.w, iA.z);
  // seen from behind (the camera that looks in through the previous portal can stand in the doorway) it folds away
  gl_Position = mix(vec4(2.0, 2.0, 2.0, 1.0), projectionMatrix * modelViewMatrix * vec4(p, 1.0), uShow);
}
`;
}
const CURTAIN_FRAG = /* glsl */`
uniform vec3 uStraw, uStrawB, uRed, uBlue, uDark;
varying vec3 vR;
float bandIn(float s, float a, float b, float e){ return smoothstep(a - e, a + e, s) * (1.0 - smoothstep(b - e, b + e, s)); }
void main(){
  float px = clamp(fwidth(vR.y), 1e-3, 3.0);
  vec3 col = mix(uStraw, uStrawB, step(0.5, vR.z));
  // a painted chevron runs across all the reeds
  float zz = abs(fract((vR.x - 21.5) / 5.33) - 0.5) * 2.0;
  float y = vR.y + 2.6 * zz;
  col = mix(col, uRed, bandIn(y, 9.0, 11.6, px) + bandIn(y, 30.0, 32.6, px));
  col = mix(col, uBlue, bandIn(y, 12.6, 13.6, px) + bandIn(y, 28.0, 29.0, px) + bandIn(y, 20.4, 21.4, px));
  float nd = abs(fract(vR.y / 2.4 + vR.z * 3.7) - 0.5) * 2.4;
  col = mix(col, uDark, 0.55 * (1.0 - smoothstep(0.07 - px, 0.07 + px, nd)) * (1.0 - smoothstep(0.1, 0.4, px)));
  gl_FragColor = vec4(col, 1.0);
}
`;

// the wall lizard: one mesh bent by sines. aL = (part: 0 body, 1 leg, 2 shadow; s along the spine; leg phase; unused)
const LIZARD_VERT = /* glsl */`
attribute vec3 aC; attribute vec4 aL;
uniform float uRun, uPhase, uHead, uTurn, uTime, uShadow;
varying vec3 vC, vN, vL; varying float vPart;
void main(){
  vec3 p = position;
  float s = aL.y;
  float leg = step(0.5, aL.x) * step(aL.x, 1.5);
  float amp = mix(0.42, 0.09, smoothstep(0.0, 0.62, s)) * (1.0 - 0.6 * smoothstep(0.8, 1.0, s));
  p.x += (uRun * amp * sin(s * 9.5 - uPhase) + 0.06 * (1.0 - smoothstep(0.0, 0.5, s)) * sin(uTime * 0.9 + s * 6.0)) * (1.0 - leg * 0.6);
  p.z += leg * uRun * 0.42 * sin(uPhase + aL.z) * (1.0 - smoothstep(0.0, 0.35, p.y));
  p.y += leg * uRun * 0.12 * max(0.0, cos(uPhase + aL.z));
  // breathing flanks
  float flank = smoothstep(0.52, 0.62, s) * (1.0 - smoothstep(0.72, 0.8, s)) * (1.0 - leg);
  p.x *= 1.0 + 0.05 * flank * sin(uTime * 3.2);
  // head and neck lift and turn about the shoulders
  float hw = smoothstep(0.74, 0.86, s) * (1.0 - leg);
  float zn = 0.9;
  float dz = p.z - zn;
  float ca = cos(uHead * hw), sa = sin(uHead * hw);
  p.y += hw * (dz * sa + 0.06 * uHead);
  p.z = zn + mix(dz, dz * ca, hw);
  p.x += hw * dz * sin(uTurn);
  vec3 pp = p;
  if (aL.x > 1.5) pp = vec3(p.x, 0.03, p.z) * step(0.5, uShadow);
  vC = aC; vL = position; vPart = aL.x;
  vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pp, 1.0);
}
`;
const LIZARD_FRAG = /* glsl */`
uniform vec3 uLdir, uDark, uPale, uGround;
uniform float uLitAll;
varying vec3 vC, vN, vL; varying float vPart;
void main(){
  vec3 N = normalize(vN);
  float ndl = dot(N, uLdir) - 0.05;
  float lit = clamp(ndl / max(fwidth(ndl), 1e-4) + 0.5, 0.0, 1.0) * uLitAll;
  vec3 col = vC;
  float body = 1.0 - step(0.5, vPart);
  // two rows of dark blotches down the back, a pale line along each flank
  float px = clamp(max(length(dFdx(vL.xz)), length(dFdy(vL.xz))), 1e-4, 1.0);
  vec2 b = vec2((abs(vL.x) - 0.15) / 0.1, (fract(vL.z / 0.36 + 0.25 * step(0.0, vL.x)) - 0.5) * 0.36 / 0.11);
  float e = px / 0.1;
  float blot = (1.0 - smoothstep(1.0 - e, 1.0 + e, length(b))) * step(0.12, vL.y) * step(-1.2, vL.z) * step(vL.z, 1.15) * body;
  col = mix(col, uDark, blot);
  float fl = 1.0 - smoothstep(0.035 - px, 0.035 + px, abs(abs(vL.x) - 0.3));
  col = mix(col, uPale, fl * step(0.1, vL.y) * step(-0.6, vL.z) * step(vL.z, 1.0) * body);
  col *= mix(${SHADE.toFixed(2)}, 1.0, lit);
  col = mix(col, uGround, step(1.5, vPart));
  gl_FragColor = vec4(col, 1.0);
}
`;

// dust. aS = (phase, size m, rise speed, kind: 0 dust in the beam, 0.3 dust along the faces of the beam, 1 tremor dust).
// Beam dust rides the beam: position = (fraction along the beam from the window, y in the window, z in the window), so
// the slanting shaft keeps its hard faces while the sun creeps. Tremor dust: position is where it leaves the joist.
function dustVert(G) {
  return /* glsl */`
attribute vec4 aS;
uniform float uTime, uPx, uFall, uFallA;
varying float vSun, vA, vKind;
${G.sun}
void main(){
  float ph = aS.x * 6.2832;
  float trem = step(0.5, aS.w);
  vec3 sd = uSunDir;
  vec3 w0 = vec3(uWinIn.x, position.y, position.z);
  float tMax = min(min((w0.z + ${RZ.toFixed(1)}) / max(sd.z, 0.05), w0.y / max(sd.y, 0.05)), ${(2 * RX).toFixed(1)} / max(sd.x, 0.05));
  vec3 beam = w0 - sd * (tMax * position.x);
  // slow drift and a slow rise that wraps over 5 m
  float amp = mix(1.3, 0.35, step(0.15, aS.w));
  vec3 drift = vec3(amp * sin(uTime * 0.21 + ph), mod(uTime * aS.z + aS.x * 5.0, 5.0) - 2.5, amp * cos(uTime * 0.17 + ph * 1.7));
  // tremor dust: sifts down from the joists, keyed to the journey
  float fall = clamp(uFall * (9.0 + 6.0 * aS.z) - aS.x * 42.0, 0.0, 74.0);
  vec3 sift = vec3(0.35 * sin(fall * 0.4 + ph), -fall, 0.5 * sin(fall * 0.23 + ph * 2.0));
  vec3 p = mix(beam + drift, position + sift, trem);
  float wrap = mix(smoothstep(0.0, 0.6, 2.5 - abs(drift.y)), smoothstep(0.0, 1.5, fall) * (1.0 - smoothstep(66.0, 72.0, fall)) * uFallA, trem);
  vSun = sunAt(p); vKind = trem;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = aS.y * uPx * projectionMatrix[1][1] / max(-mv.z, 0.5);
  float sz = clamp(size, 1.5, 5.0);
  vA = wrap * min(1.0, size / 1.5) * step(1.0, -mv.z);
  gl_PointSize = sz;
}
`;
}
const DUST_FRAG = /* glsl */`
uniform vec3 uSunCol, uShadeCol, uSiftCol;
varying float vSun, vA, vKind;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float d = length(c);
  float disc = 1.0 - smoothstep(0.34, 0.5, d);
  vec3 col = mix(mix(uShadeCol, uSunCol, vSun), mix(uSiftCol, uSunCol, vSun), vKind);
  float a = disc * vA * mix(mix(0.0, 1.0, vSun), 0.85, vKind);
  if (a < 0.01) discard;
  gl_FragColor = vec4(col, a);
}
`;

// the shaft of sunlight: a soft slanting body of light between the window and the wall it lights. At each pixel it is
// as strong as the light the view ray gathers inside the beam (every point whose line toward the sun passes the window
// opening), with the beam's four faces softened over a few metres and nothing at all within a few metres of the window.
// It is a thing seen from the side: it fades as the view ray comes to run along the sun's own direction (looking up or
// down the shaft there is only the dust), and uBeamK takes it away before the eye turns to the window to leave.
const BEAM_VERT = /* glsl */`
varying vec3 vP;
void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const BEAM_FRAG = /* glsl */`
uniform vec3 uBeamCol, uRoot, uSunDir;
uniform vec4 uWinIn, uWinHalf;
uniform float uBeamK;
varying vec3 vP;
void slab(float fo, float fd, float lo, float hi, inout float t0, inout float t1){
  float inv = 1.0 / (abs(fd) < 1e-5 ? (fd < 0.0 ? -1e-5 : 1e-5) : fd);
  float a = (lo - fo) * inv, b = (hi - fo) * inv;
  t0 = max(t0, min(a, b)); t1 = min(t1, max(a, b));
}
void main(){
  vec3 o = cameraPosition - uRoot, d = vP - o;
  float len = max(length(d), 1e-3);
  d /= len;
  float sx = max(uSunDir.x, 0.02), k = uSunDir.y / sx, m = uSunDir.z / sx;
  const float E = 3.2;   // metres over which each face of the beam fades
  float t0 = 0.0, t1 = len;
  // beam coordinates: where the line from a point toward the sun meets the window plane (by, bz), both linear along the ray
  float by0 = o.y + k * (uWinIn.x - o.x) - uWinIn.z, byd = d.y - k * d.x;
  float bz0 = o.z + m * (uWinIn.x - o.x) - uWinIn.y, bzd = d.z - m * d.x;
  slab(by0, byd, -uWinHalf.y - E, uWinHalf.y + E, t0, t1);
  slab(bz0, bzd, -uWinHalf.x - E, uWinHalf.x + E, t0, t1);
  slab(o.x, d.x, -${RX.toFixed(1)}, ${RX.toFixed(1)}, t0, t1);
  slab(o.y, d.y, 0.0, ${RH.toFixed(1)}, t0, t1);
  slab(o.z, d.z, -${RZ.toFixed(1)}, ${RZ.toFixed(1)}, t0, t1);
  float L = max(t1 - t0, 0.0), acc = 0.0, dt = L / 10.0;
  for (int i = 0; i < 10; i++) {
    float t = t0 + (float(i) + 0.5) * dt;
    float fy = 1.0 - smoothstep(uWinHalf.y - E, uWinHalf.y + E, abs(by0 + byd * t));
    float fz = 1.0 - smoothstep(uWinHalf.x - E, uWinHalf.x + E, abs(bz0 + bzd * t));
    float along = (uWinIn.x - (o.x + d.x * t)) / sx;          // metres down the beam from the window
    float fa = smoothstep(7.0, 24.0, along) * mix(1.0, 0.6, clamp(along / 70.0, 0.0, 1.0));
    float near = smoothstep(4.0, 18.0, t);                    // the eye never flies through a fog
    acc += fy * fz * fa * near * dt;
  }
  float side = 1.0 - smoothstep(0.55, 0.9, abs(dot(d, uSunDir)));
  float a = (1.0 - exp(-acc / 16.0)) * uBeamK * side;
  gl_FragColor = vec4(uBeamCol, a);
}
`;

// what is outside: plain distance. A flat field of sea haze, a deeper band of sea with glints, the far rim of the island.
function viewFrag(G) {
  return /* glsl */`
uniform float uTime;
uniform vec3 uHaze, uSea, uRim, uGlint, uHazeB;
varying vec3 vP;
${G.hash}
void main(){
  vec3 d = vP - cameraPosition;
  float hx = max(d.x, 1.0);
  float el = d.y / hx, az = d.z / hx;
  float px = clamp(fwidth(el), 1e-5, 0.05);
  vec3 col = uHaze;
  // thin bands of haze drifting left to right
  float hb = vnoise(vec2(az * 2.2 - uTime * 0.02, el * 26.0)) + 0.5 * vnoise(vec2(az * 5.0 - uTime * 0.035, el * 60.0 + 4.0));
  col = mix(col, uHazeB, smoothstep(0.72, 0.9, hb) * 0.9);
  // the far rim of the island: one paler shape standing on the horizon
  float rim = 0.035 + 0.03 * vnoise(vec2(az * 3.1 + 2.0, 0.5)) + 0.012 * vnoise(vec2(az * 11.0, 3.5));
  rim *= smoothstep(-0.75, -0.3, az) * (1.0 - smoothstep(0.25, 0.9, az));
  col = mix(col, uRim, (1.0 - smoothstep(rim - px, rim + px, el)) * step(0.004, rim));
  // the sea: a deeper band under the horizon, thinning back into haze below
  float sea = (1.0 - smoothstep(-0.012 - px, -0.012 + px, el)) * (0.25 + 0.75 * smoothstep(-0.5, -0.16, el));
  col = mix(col, uSea, sea);
  // glints that come and go slowly
  vec2 gq = vec2(az * 40.0, (el + 0.012) * 190.0);
  vec2 gi = floor(gq);
  float gh = hash21(gi);
  float tw = smoothstep(0.55, 0.95, sin(uTime * (0.35 + 0.5 * gh) + gh * 40.0));
  vec2 gf = fract(gq) - 0.5;
  float gl = (1.0 - smoothstep(0.3, 0.42, abs(gf.x))) * (1.0 - smoothstep(0.1, 0.2, abs(gf.y)));
  col = mix(col, uGlint, gl * tw * step(0.55, gh) * step(el, -0.018) * step(-0.42, el));
  gl_FragColor = vec4(col, 1.0);
}
`;
}
const VIEW_VERT = /* glsl */`
varying vec3 vP;
void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;

// ---------------------------------------------------------------- the real things
// a round bar between two points (for legs, handles, stems)
function bar(a, b, r0, r1, seg = 8) {
  const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = Bv.clone().sub(A), len = d.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, seg, 1, false);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) * len, uv.getX(i) * TAU * Math.max(r0, r1));
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()));
  g.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return g;
}
// tapers for the shadow list from a lathe profile, a few stacked posts
function profileTapers(cx, cz, profile, y0, out, step = 2) {
  let prev = null;
  for (let i = 0; i < profile.length; i += step) {
    const p = profile[Math.min(i, profile.length - 1)];
    if (prev && p[1] > prev[1] + 0.2) out.push([cx, cz, y0 + prev[1], y0 + p[1], prev[0] * 0.94, p[0] * 0.94]);
    if (!prev || p[1] > prev[1] + 0.2) prev = p;
  }
}

async function addBed(ctx, B, C, S) {
  const { x: bx, z: bz, w, d, h } = BED;
  const x0 = bx - w / 2, x1 = bx + w / 2, z0 = bz - d / 2, z1 = bz + d / 2;
  const wood = C.wood, woodD = C.woodD;
  // corner posts with turned knobs
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const px = bx + sx * (w / 2 - 1.6), pz = bz + sz * (d / 2 - 1.6);
    B.add(rbox(3.2, 9.4, 3.2, 0.4), { p: [px, 4.7, pz], c: wood, kind: 1, uv: (x, y, z) => [y, (x + z) * 0.8] });
    B.add(lathe([[1.0, 0], [1.5, 0.5], [1.15, 1.0], [1.35, 1.6], [0.9, 2.2], [0.0, 2.45]], 12, woodD), { p: [px, 9.3, pz], kind: 1 });
    S.slabs.push([px - 1.3, px + 1.3, pz - 1.3, pz + 1.3, 0, 9.2]);
    // pegs
    B.add(bar([px + sx * 1.55, 6.6, pz - 0.6], [px + sx * 1.85, 6.6, pz - 0.6], 0.28, 0.28, 8), { c: woodD, kind: 0 });
    B.add(bar([px + 0.6, 6.6, pz + sz * 1.55], [px + 0.6, 6.6, pz + sz * 1.85], 0.28, 0.28, 8), { c: woodD, kind: 0 });
    await ctx.yield();   // the bed is the longest piece of furniture to build: hand the page back between its parts
  }
  // rails and stretchers
  for (const sz of [-1, 1]) {
    B.add(rbox(w - 3.4, 2.8, 1.5, 0.3), { p: [bx, 6.6, bz + sz * (d / 2 - 1.2)], c: wood, kind: 1 });
    B.add(rbox(w - 3.4, 1.1, 1.0, 0.25), { p: [bx, 2.4, bz + sz * (d / 2 - 1.5)], c: woodD, kind: 1 });
  }
  for (const sx of [-1, 1]) {
    B.add(rbox(1.5, 2.8, d - 3.4, 0.3), { p: [bx + sx * (w / 2 - 1.2), 6.6, bz], c: wood, kind: 1 });
    B.add(rbox(1.0, 1.1, d - 3.4, 0.25), { p: [bx + sx * (w / 2 - 1.5), 2.4, bz], c: woodD, kind: 1 });
  }
  S.slabs.push([x0 + 0.4, x1 - 0.4, z0 + 0.4, z1 - 0.4, 5.4, 7.9]);
  await ctx.yield();
  // hide webbing: long straps over short ones, sagging a little
  const strap = (len, wid, along, cx, cz, y, sag, col) => {
    const g = new THREE.BoxGeometry(along ? len : wid, 0.22, along ? wid : len, along ? 10 : 1, 1, along ? 1 : 10);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) {
      const t = (along ? pos.getX(i) : pos.getZ(i)) / len;
      pos.setY(i, pos.getY(i) - sag * Math.cos(Math.PI * t));
      uv.setXY(i, along ? pos.getX(i) : pos.getZ(i), along ? pos.getZ(i) : pos.getX(i));
    }
    g.computeVertexNormals();
    B.add(g, { p: [cx, y, cz], c: col, kind: 6 });
  };
  let k = 0;
  for (let x = x0 + 3.4; x < x1 - 3; x += 1.9) { strap(d - 3.2, 1.05, false, x, bz, 7.42, 0.5, (k++ & 1) ? C.hide : C.hideB); if ((k & 3) === 0) await ctx.yield(); }
  for (let z = z0 + 2.9; z < z1 - 2.5; z += 1.75) { strap(w - 3.2, 1.2, true, bx, z, 7.66, 0.55, (k++ & 1) ? C.hideB : C.hide); if ((k & 3) === 0) await ctx.yield(); }
  await ctx.yield();
  // the bed left unmade: a striped blanket thrown back over the east half and hanging down the south side
  const nu = 30, nv = 26, P = [], U = [], W = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const a = i / nu, b = j / nv;
    const run = b * 23.5;                                     // metres from the far (north) edge
    const top = Math.min(run, 14.6), drop = Math.max(0, run - 14.6);
    const rum = 0.45 * Math.sin(a * 11 + b * 5) * Math.sin(b * 7 + 1) + 0.3 * Math.sin(a * 23 + b * 13 + 2);
    const edge = 2.2 * Math.sin(b * 5.5 + 0.6) * (1 - a) + 1.3 * Math.sin(b * 9 + 2) * a;   // an uneven thrown edge
    const fold = drop > 0 ? 0.55 * Math.sin(a * 16 + 1.3) * Math.min(1, drop / 2) : 0;
    const x = bx - 9 + a * 20.5 + edge * (0.35 + 0.65 * (1 - a) * (1 - a)) + (drop > 0 ? 0.25 * Math.sin(a * 9 + drop) : 0);
    const z = z0 + 1.6 + top + Math.min(drop, 1.2) * 0.75 + fold;
    const y = 8.05 + (drop > 0 ? 0.3 - Math.max(0, drop - 0.7) * (0.92 + 0.08 * Math.sin(a * 7)) : 0.3 + Math.max(0, rum) * 0.9 + 0.5 * Math.exp(-((a - 0.2) ** 2) * 40) * Math.sin(b * 6));
    P.push(x, y, z); U.push(run, a * 20.5); W.push(Math.min(1, drop / 4));
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, e = c + 1; I.push(a, c, b, b, c, e); }
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  bg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  bg.setIndex(I); bg.computeVertexNormals();
  await ctx.yield();
  let wi = 0;
  B.add(bg, { c: C.red, kind: 5, sway: () => W[wi++] });
  S.slabs.push([bx - 8, bx + 11, z1 - 0.2, z1 + 1.5, 1.6, 8.2]);
  await ctx.yield();
  // a bolster at the west end
  B.add(rbox(5.2, 2.6, 12.5, 1.25), { p: [x0 + 5.6, 9.1, bz], c: C.linen, kind: 5, uv: (x, y, z) => [x, z * 1.9 + 1.2] });
}

// the big vessel by the door: a beaked jar, a tall strainer or a nest of baskets
function addVessel(B, C, S, variant) {
  const { x, z } = JAR;
  let prof;
  if (variant === 'baskets') {
    let y = 0;
    [[5.0, 5.2, C.straw], [4.0, 4.4, C.yellowD], [3.0, 3.6, C.straw]].forEach(([r, h, col], i) => {
      prof = [[r * 0.72, 0, col], [r * 0.9, h * 0.25, col], [r, h * 0.8, C.red], [r * 1.03, h * 0.9, C.red], [r * 1.03, h, col], [r * 0.9, h, col], [r * 0.82, h * 0.86, col]];
      B.add(lathe(prof, 30, col), { p: [x + i * 0.5, y, z - i * 0.4], kind: 3, uv: [1 / 0.55, 1 / 0.55] });
      profileTapers(x + i * 0.5, z - i * 0.4, prof.slice(0, 5), y, S.tapers, 2);
      y += h * 0.82;
    });
    // a lid leaning against them
    B.add(lathe([[0, 0, C.yellowD], [2.6, 0.15, C.yellowD], [2.8, 0.5, C.red], [2.6, 0.7, C.straw], [0, 0.9, C.straw]], 24, C.straw), { p: [x - 5.6, 2.5, z + 2.2], r: [0, 0, 1.15], kind: 3, uv: [1 / 0.55, 1 / 0.55] });
    S.tapers.push([x - 5.4, z + 2.2, 0, 5, 1.0, 0.6]);
    return;
  }
  const buff = C.clay, dk = C.clayD, rd = C.red;
  if (variant === 'strainer') {
    prof = [[2.6, 0, dk], [2.9, 0.5, buff], [3.4, 3.0, buff], [3.7, 5.2, rd], [3.8, 6.0, buff], [3.9, 8.4, dk], [3.95, 9.0, buff], [4.3, 12.2, rd], [4.7, 13.2, buff], [5.0, 14.0, dk], [4.6, 14.0, buff], [4.2, 13.2, buff]];
  } else {
    prof = [[2.3, 0, dk], [2.5, 0.5, buff], [3.6, 2.6, buff], [4.5, 5.0, dk], [4.7, 6.3, buff], [4.6, 7.2, buff], [4.0, 9.0, dk], [3.4, 9.7, buff], [2.2, 10.9, buff], [1.5, 11.8, rd], [1.45, 12.6, buff], [1.7, 13.3, buff], [2.0, 13.7, dk], [1.7, 13.7, buff], [1.2, 13.0, buff]];
  }
  B.add(lathe(prof, 32, buff), { p: [x, 0, z], kind: 2 });
  profileTapers(x, z, prof.slice(0, variant === 'strainer' ? 10 : 13), 0, S.tapers, 2);
  if (variant === 'strainer') {
    // rows of holes as dark studs, and two loop handles
    for (let r = 0; r < 3; r++) for (let i = 0; i < 18; i++) {
      const th = (i + (r & 1) * 0.5) / 18 * TAU, y = 9.9 + r * 0.8, rr = 3.98 + (y - 9) * 0.11;
      B.add(new THREE.SphereGeometry(0.2, 6, 4), { p: [x + Math.cos(th) * rr, y, z + Math.sin(th) * rr], c: C.black, kind: 0 });
    }
    for (const sg of [-1, 1]) B.add(new THREE.TorusGeometry(1.3, 0.34, 8, 14, Math.PI), { p: [x, 12.9, z + sg * 4.5], r: [0, 0, 0], s: [1, 1, 1], c: buff, kind: 2 });
    return;
  }
  // beaked spout toward the room, strap handle behind it
  const beak = new THREE.CylinderGeometry(0.45, 1.5, 3.2, 14, 1, true);
  B.add(beak, { p: [x - 1.5, 14.2, z - 0.6], r: [0, 0.38, 0.95], c: buff, kind: 2 });
  B.add(new THREE.TorusGeometry(1.75, 0.36, 8, 16, Math.PI), { p: [x + 1.6, 11.3, z + 0.6], r: [0, -0.38, -Math.PI / 2 + 0.25], c: buff, kind: 2 });
  S.tapers.push([x - 1.9, z - 0.7, 13.2, 15.6, 1.2, 0.5]);
}

function addTable(B, C, S, rng) {
  const { x, z } = TABLE;
  const R = C.red, Wt = C.linen;
  B.add(lathe([[0, 6.9, R], [3.6, 6.9, R], [4.7, 7.15, R], [5.0, 7.5, Wt], [5.0, 7.95, Wt], [4.55, 8.0, R], [3.2, 7.86, Wt], [2.9, 7.84, R], [0, 7.8, R]], 40, R), { p: [x, 0, z], kind: 0 });
  S.tapers.push([x, z, 7.0, 7.9, 4.9, 4.9]);
  for (let i = 0; i < 3; i++) {
    const th = i / 3 * TAU + 0.5, c = Math.cos(th), s = Math.sin(th);
    const leg = lathe([[0.62, 0, Wt], [0.7, 0.5, R], [0.78, 3.4, Wt], [0.82, 3.9, R], [0.95, 7.0, R]], 12, R);
    B.add(leg, { p: [x + c * 3.9, 0, z + s * 3.9], r: [-s * 0.1, 0, c * 0.1], kind: 0 });
    S.tapers.push([x + c * 3.7, z + s * 3.7, 0, 7, 0.6, 0.85]);
  }
  // the offering: a dish of figs and a dry sprig, a cup beside it
  const dy = 7.84;
  B.add(lathe([[0, 0.12, C.clay], [1.3, 0.12, C.clay], [2.5, 0.8, C.red], [2.7, 0.95, C.red], [2.45, 0.95, C.clay], [1.3, 0.34, C.clay], [0, 0.3, C.clay]], 28, C.clay), { p: [x - 0.7, dy, z + 0.4], kind: 2 });
  for (let i = 0; i < 8; i++) {
    const th = i / 7 * TAU + 0.3, r = i === 7 ? 0 : 1.15, fx = x - 0.7 + Math.cos(th) * r, fz = z + 0.4 + Math.sin(th) * r;
    const col = i % 3 === 1 ? C.figB : C.fig;
    B.add(lathe([[0, 0, col], [0.42, 0.14, col], [0.62, 0.5, col], [0.5, 0.86, col], [0.2, 1.12, col], [0.07, 1.3, C.yellowD], [0, 1.32, C.yellowD]], 10, col), { p: [fx, dy + 0.4 + (i === 7 ? 0.55 : 0), fz], r: [rng.range(-0.5, 0.5), rng.range(0, 6), rng.range(-0.5, 0.5)], kind: 0 });
  }
  // sprig: a dry stem with red buds lying across the table
  const s0 = [x + 1.2, dy + 0.18, z - 3.2], s1 = [x + 3.4, dy + 0.3, z + 1.6];
  B.add(bar(s0, s1, 0.11, 0.07, 6), { c: C.yellowD, kind: 0 });
  for (let i = 0; i < 6; i++) {
    const t = 0.25 + i * 0.13, sd = (i & 1) ? 1 : -1;
    const p = [lerp(s0[0], s1[0], t), lerp(s0[1], s1[1], t), lerp(s0[2], s1[2], t)];
    const q = [p[0] + sd * 0.7, p[1] + 0.15, p[2] + 0.45];
    B.add(bar(p, q, 0.06, 0.05, 5), { c: C.yellowD, kind: 0 });
    B.add(lathe([[0, 0, C.red], [0.2, 0.1, C.red], [0.26, 0.34, C.red], [0, 0.62, C.red]], 8, C.red), { p: q, r: [0.6, 0, -sd * 1.1], kind: 0 });
  }
  addCup(B, C, [x + 2.2, dy, z + 2.6], [0, 0, 0]);
}
function cupProfile(C) {
  return [[0, 0, C.clay], [0.55, 0, C.clay], [0.72, 0.5, C.clay], [1.12, 1.62, C.red], [1.25, 2.0, C.red], [1.1, 2.0, C.clayD], [0.5, 0.3, C.clayD], [0, 0.28, C.clayD]];
}
function addCup(B, C, p, r) { B.add(lathe(cupProfile(C), 20, C.clay), { p, r, kind: 2 }); }

async function addSmallThings(ctx, B, C, S, rng) {
  // the stack of cups by the bed, one fallen beside it
  const cx = 3.5, cz = 20;
  for (let i = 0; i < 5; i++) addCup(B, C, [cx + 0.05 * i * (i & 1 ? 1 : -1), i * 0.72, cz + 0.04 * i], [0, i * 1.3, 0]);
  S.tapers.push([cx, cz, 0, 4.9, 0.7, 1.2]);
  addCup(B, C, [cx + 3.3, 1.1, cz - 1.6], [0, 0.7, Math.PI / 2 + 0.25]);
  S.slabs.push([cx + 1.7, cx + 3.6, cz - 2.7, cz - 0.6, 0, 1.9]);
  // the rush mat, bound in red
  const mx0 = -30, mx1 = -3, mz0 = 15, mz1 = 24.6, my = 0.3;
  B.add(rbox(mx1 - mx0, my, mz1 - mz0, 0.12), { p: [(mx0 + mx1) / 2, my / 2, (mz0 + mz1) / 2], c: C.straw, kind: 3, uv: (x, y, z) => [x / 0.62, z / 0.62] });
  for (const zz of [mz0, mz1]) B.add(rbox(mx1 - mx0 + 0.5, my + 0.12, 0.7, 0.14), { p: [(mx0 + mx1) / 2, my / 2 + 0.06, zz], c: C.red, kind: 0 });
  for (const xx of [mx0, mx1]) B.add(rbox(0.7, my + 0.12, mz1 - mz0 + 0.5, 0.14), { p: [xx, my / 2 + 0.06, (mz0 + mz1) / 2], c: C.yellowD, kind: 0 });
  await ctx.yield();
  // a pair of sandals kicked off on the mat
  const sandal = (sx, sz, ry) => {
    const sole = new THREE.CylinderGeometry(1.15, 1.15, 0.3, 20);
    const pos = sole.attributes.position;
    for (let i = 0; i < pos.count; i++) { const zz = pos.getZ(i); pos.setZ(i, zz * 2.7); pos.setX(i, pos.getX(i) * (1 - 0.22 * Math.max(0, -zz) + 0.06 * zz)); }
    sole.computeVertexNormals();
    const cs = Math.cos(ry), sn = Math.sin(ry);
    B.add(sole, { p: [sx, my + 0.16, sz], r: [0, ry, 0], c: C.hide, kind: 6, uv: [3, 3] });
    const at = (lx, lz) => [sx + lx * cs + lz * sn, my + 0.3, sz - lx * sn + lz * cs];
    B.add(new THREE.TorusGeometry(0.95, 0.13, 6, 12, Math.PI), { p: at(0, 1.4), r: [0, ry, 0], c: C.woodD, kind: 0 });
    B.add(new THREE.TorusGeometry(0.85, 0.13, 6, 12, Math.PI), { p: at(0, 0.2), r: [0, ry, 0], c: C.woodD, kind: 0 });
    B.add(new THREE.TorusGeometry(0.8, 0.12, 6, 12, Math.PI), { p: at(0, -2.2), r: [0.5, ry, 0], c: C.woodD, kind: 0 });
    S.slabs.push([sx - 1.4, sx + 1.4, sz - 2.6, sz + 2.6, 0, 1.0]);
  };
  sandal(-14.5, 19.2, 0.25); sandal(-10.6, 20.6, -0.5);
  await ctx.yield();
  // a low stool north of the bed with a folded blue cloth, a spindle and a ball of red wool
  const tx = -19, tz = -17.5;
  B.add(rbox(7, 0.9, 5, 0.3), { p: [tx, 5.0, tz], c: C.wood, kind: 1 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    B.add(bar([tx + sx * 3.2, 0, tz + sz * 2.3], [tx + sx * 2.6, 4.6, tz + sz * 1.8], 0.42, 0.55, 8), { c: C.woodD, kind: 1 });
    S.tapers.push([tx + sx * 2.9, tz + sz * 2.05, 0, 4.6, 0.4, 0.5]);
  }
  B.add(bar([tx - 2.9, 2.3, tz - 2.0], [tx + 2.9, 2.3, tz - 2.0], 0.26, 0.26, 6), { c: C.woodD, kind: 1 });
  B.add(bar([tx - 2.9, 2.3, tz + 2.0], [tx + 2.9, 2.3, tz + 2.0], 0.26, 0.26, 6), { c: C.woodD, kind: 1 });
  S.slabs.push([tx - 3.3, tx + 3.3, tz - 2.3, tz + 2.3, 4.6, 5.4]);
  B.add(rbox(3.6, 0.5, 3.0, 0.22), { p: [tx - 1.2, 5.7, tz + 0.2], r: [0, 0.2, 0], c: C.blue, kind: 0 });
  B.add(rbox(3.4, 0.5, 2.8, 0.22), { p: [tx - 1.1, 6.2, tz + 0.3], r: [0, 0.32, 0], c: C.blue, kind: 0 });
  B.add(new THREE.SphereGeometry(1.05, 16, 10), { p: [tx + 2.1, 6.45, tz - 0.7], c: C.red, kind: 7, uv: [30, 12] });
  B.add(bar([tx + 0.4, 5.75, tz + 1.9], [tx + 3.3, 5.95, tz + 0.9], 0.1, 0.07, 6), { c: C.woodD, kind: 0 });
  B.add(lathe([[0, 0, C.clay], [0.5, 0.1, C.clay], [0.5, 0.3, C.clay], [0, 0.4, C.clay]], 10, C.clay), { p: [tx + 0.9, 5.72, tz + 1.72], r: [0, 0, 1.4], kind: 2 });
}

// ---------------------------------------------------------------- the lived-in room: mats, loom, store jars, lamps, cut lilies
// a woven mat with a bound edge, stripes laid across it and a fringe at both ends
function addMat(B, C, x0, x1, z0, z1, o = {}) {
  const my = 0.3, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0, ax = w >= d;
  B.add(rbox(w, my, d, 0.12), { p: [cx, my / 2, cz], c: o.c || C.straw, kind: 3, uv: (x, y, z) => [x / 0.62, z / 0.62] });
  const edge = o.edge || C.red, end = o.end || C.yellowD;
  for (const zz of [z0, z1]) B.add(rbox(w + 0.5, my + 0.12, 0.7, 0.14), { p: [cx, my / 2 + 0.06, zz], c: ax ? edge : end, kind: 0 });
  for (const xx of [x0, x1]) B.add(rbox(0.7, my + 0.12, d + 0.5, 0.14), { p: [xx, my / 2 + 0.06, cz], c: ax ? end : edge, kind: 0 });
  const L = ax ? w : d, cols = o.cols || [C.red, C.blue], n = o.stripes ?? 0;
  for (let i = 0; i < n; i++) {
    const pos = (ax ? x0 : z0) + 2.2 + (i / Math.max(1, n - 1)) * (L - 4.4), sw = (i & 1) ? 0.7 : 1.5;
    B.add(new THREE.BoxGeometry(ax ? sw : w - 1.6, 0.08, ax ? d - 1.6 : sw), { p: ax ? [pos, my + 0.02, cz] : [cx, my + 0.02, pos], c: cols[i % cols.length], kind: 0 });
  }
  // fringe: short tassels past both ends
  const m = Math.round((ax ? d : w) / 0.9);
  for (const sg of [-1, 1]) for (let i = 0; i < m; i++) {
    const t = (ax ? z0 : x0) + 0.5 + (i / Math.max(1, m - 1)) * ((ax ? d : w) - 1), e = (ax ? (sg < 0 ? x0 : x1) : (sg < 0 ? z0 : z1)) + sg * 1.0, j = 0.18 * Math.sin(i * 2.7);
    B.add(new THREE.BoxGeometry(ax ? 1.3 : 0.3, 0.1, ax ? 0.3 : 1.3), { p: ax ? [e, 0.06, t + j] : [t + j, 0.06, e], r: [0, j, 0], c: i % 3 === 0 ? edge : (o.c || C.straw), kind: 0 });
  }
}

// the warp-weighted loom in the north-west of the room: two leaning posts, a cloth beam, a length of striped cloth
// already woven, the warp hanging in two sheds to rows of clay weights that swing when the gust comes through
async function addLoom(ctx, B, C, S) {
  const zA = -20.6, zB = -3.4, H = 30, xAt = (y) => -25.4 + 0.115 * y;
  for (const z of [zA, zB]) {
    B.add(bar([xAt(0), 0, z], [xAt(H + 1.6), H + 1.6, z], 0.95, 0.8, 10), { c: C.wood, kind: 1 });
    B.add(rbox(3.0, 1.3, 3.0, 0.3), { p: [xAt(0), 0.65, z], c: C.stone, kind: 4 });
    // a prop behind each post
    const zp = z + (z < -12 ? -1.0 : 1.0);
    B.add(bar([xAt(21), 21, zp], [-16.6, 0, zp], 0.5, 0.6, 8), { c: C.woodD, kind: 1 });
    B.add(lathe([[0.8, 0, C.woodD], [1.1, 0.5, C.woodD], [0.7, 1.2, C.woodD], [0, 1.5, C.woodD]], 10, C.woodD), { p: [xAt(H + 1.6), H + 1.5, z], kind: 1 });
    S.slabs.push([xAt(12) - 0.8, xAt(12) + 0.8, z - 0.8, z + 0.8, 0, H]);
  }
  // cloth beam with a peg at each end, heddle rod on two brackets, shed rod
  B.add(bar([xAt(H) - 0.2, H, zA - 2.2], [xAt(H) - 0.2, H, zB + 2.2], 1.05, 1.05, 12), { c: C.joist, kind: 1 });
  for (const z of [zA - 1.6, zB + 1.6]) B.add(bar([xAt(H) - 1.9, H + 0.2, z], [xAt(H) + 1.5, H - 0.2, z], 0.22, 0.22, 6), { c: C.woodD, kind: 0 });
  B.add(bar([xAt(14) - 1.5, 14, zA - 0.9], [xAt(14) - 1.5, 14, zB + 0.9], 0.36, 0.36, 8), { c: C.woodD, kind: 1 });
  for (const z of [zA, zB]) B.add(bar([xAt(14.4), 14.4, z], [xAt(14) - 1.9, 13.8, z], 0.3, 0.3, 6), { c: C.woodD, kind: 0 });
  B.add(bar([xAt(8.5) + 0.5, 8.5, zA + 0.3], [xAt(8.5) + 0.5, 8.5, zB - 0.3], 0.3, 0.3, 8), { c: C.wood, kind: 1 });
  await ctx.yield();
  // the woven web: hangs from the beam in the plane of the posts, striped across
  const yT = H - 0.6, yB = 20.4, z0 = zA + 1.3, z1 = zB - 1.3, nu = 10, nv = 6, P = [], U = [], I = [];
  for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
    const a = i / nu, b = j / nv, y = lerp(yT, yB, b);
    P.push(xAt(y) - 0.55 - 0.12 * Math.sin(a * 9 + b * 3), y, lerp(z0, z1, a) + 0.1 * Math.sin(b * 7 + a * 4)); U.push(lerp(z0, z1, a), (yT - y) * 1.4 + 0.6);
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, e = c + 1; I.push(a, c, b, b, c, e); }
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  wg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  wg.setIndex(I); wg.computeVertexNormals();
  B.add(wg, { c: C.ochre, kind: 5 });
  S.slabs.push([xAt(25) - 0.9, xAt(25) - 0.3, z0, z1, yB, yT]);
  await ctx.yield();
  // warp and weights: thirteen bundles, the front shed leaning with the loom, the back shed hanging plumb
  const NBU = 13;
  for (let k = 0; k < NBU; k++) {
    const z = lerp(z0 + 0.5, z1 - 0.5, k / (NBU - 1)), back = k & 1;
    const yw = 3.4 + (back ? 1.5 : 0) + 0.5 * Math.sin(k * 1.9), xw = back ? xAt(yB) - 0.5 : xAt(yw) - 0.6;
    const sway = (px, py) => clamp((yB - py) / (yB - yw), 0, 1.15) * 1.5;
    for (const dz of [-0.36, 0.36]) B.add(bar([xw, yw + 1.9, z], [xAt(yB) - 0.55, yB, z + dz], 0.11, 0.11, 5), { c: back ? C.linen : C.straw, kind: 0, sway });
    const wt = lathe([[0, 0, C.clayD], [0.75, 0.15, C.clay], [1.05, 0.8, C.clay], [0.85, 1.5, k % 3 === 0 ? C.red : C.clay], [0.3, 1.95, C.clayD], [0, 2.0, C.clayD]], 12, C.clay);
    B.add(wt, { p: [xw, yw, z], s: [0.5, 1, 1], kind: 2, sway });
    if ((k & 3) === 3) await ctx.yield();
  }
  S.slabs.push([xAt(4) - 1.2, xAt(4) + 0.6, z0, z1, 3.2, 6.2]);
}

// two store jars in the north-west corner: a tall pithos with rope bands and lugs, a smaller jar with a stone lid
async function addPithoi(ctx, B, C, S) {
  const x = -42.3, z = -34.8, bf = C.clay, dk = C.clayD, rd = C.red;
  const prof = [[2.6, 0, dk], [2.9, 0.6, bf], [4.3, 3.6, bf], [5.2, 6.6, rd], [5.45, 7.3, bf], [5.6, 9.8, dk], [5.65, 10.5, bf], [5.3, 13.4, rd], [5.1, 14.0, bf], [4.2, 16.4, dk], [3.7, 17.2, bf], [3.3, 18.6, bf], [3.9, 19.6, dk], [4.1, 20.1, bf], [3.5, 20.1, dk], [3.0, 19.0, dk]];
  B.add(lathe(prof, 36, bf), { p: [x, 0, z], kind: 2 });
  profileTapers(x, z, prof.slice(0, 14), 0, S.tapers, 3);
  for (let i = 0; i < 4; i++) { const th = i / 4 * TAU + 0.6; B.add(new THREE.TorusGeometry(1.25, 0.36, 8, 14, Math.PI), { p: [x + Math.cos(th) * 4.2, 17.0, z + Math.sin(th) * 4.2], r: [0, -th + Math.PI / 2, 0], c: bf, kind: 2 }); }
  // raised rope bands
  for (const [y, r] of [[5.4, 4.95], [11.9, 5.62]]) B.add(new THREE.TorusGeometry(r, 0.22, 6, 40), { p: [x, y, z], r: [Math.PI / 2, 0, 0], c: C.yellowD, kind: 7, uv: [60, 3] });
  await ctx.yield();
  const x2 = -35.4, z2 = -38.2;
  const p2 = [[1.7, 0, dk], [1.9, 0.4, bf], [3.2, 3.2, bf], [3.5, 5.0, dk], [3.45, 5.7, bf], [2.7, 8.2, rd], [2.2, 9.0, bf], [2.5, 9.9, dk], [2.2, 9.9, dk]];
  B.add(lathe(p2, 28, bf), { p: [x2, 0, z2], kind: 2 });
  profileTapers(x2, z2, p2, 0, S.tapers, 3);
  B.add(lathe([[0, 9.8, C.stoneD], [2.7, 9.8, C.stoneD], [2.8, 10.3, C.stone], [0.6, 10.6, C.stone], [0.5, 11.1, C.stoneD], [0, 11.15, C.stoneD]], 20, C.stone), { p: [x2, 0, z2], kind: 4 });
}

// a lamp flame: a small body of revolution in three flat tones, kind 8 (unlit, flickers in the vertex shader)
function addFlame(B, C, p, sc = 1.25) {
  const y0 = p[1];
  B.add(lathe([[0, 0, C.flameA], [0.45, 0.2, C.flameA], [0.62, 0.75, C.flameA], [0.42, 1.5, C.flameB], [0.14, 2.2, C.flameR], [0, 2.5, C.flameR]], 10, C.flameA),
    { p, s: sc, kind: 8, sway: (px, py) => clamp((py - y0) / (2.5 * sc), 0, 1) * 1.6 });
}
// a stone pedestal lamp standing on the floor, its wick alight at the rim
function addLamp(B, C, S, x, z) {
  const st = C.stone, sd = C.stoneD, rd = C.red;
  const prof = [[2.3, 0, sd], [2.5, 0.5, st], [1.6, 1.1, st], [0.95, 2.0, st], [0.85, 6.4, rd], [1.3, 7.1, st], [1.0, 7.7, st], [2.2, 8.6, st], [2.9, 9.6, sd], [2.9, 10.1, sd], [2.3, 10.1, C.black], [1.6, 9.7, C.black], [0, 9.6, C.black]];
  B.add(lathe(prof, 24, st), { p: [x, 0, z], kind: 4 });
  profileTapers(x, z, prof.slice(0, 10), 0, S.tapers, 3);
  B.add(bar([x + 1.5, 9.7, z], [x + 2.1, 10.3, z], 0.16, 0.12, 6), { c: C.linen, kind: 0 });
  addFlame(B, C, [x + 2.1, 10.2, z]);
}

// a cut lily, modelled: a bent stem, five recurved petals and yellow stamens; it nods when the gust comes through
function addCutLily(B, C, root, tip, y0, sc = 1) {
  const R = new THREE.Vector3(...root), T = new THREE.Vector3(...tip), M = R.clone().lerp(T, 0.55);
  M.y += 0.06 * R.distanceTo(T);
  const sway = (px, py) => clamp((py - y0) / 9, 0, 1.3) * 1.2;
  B.add(bar(R.toArray(), M.toArray(), 0.17 * sc, 0.14 * sc, 6), { c: C.yellowD, kind: 0, sway });
  B.add(bar(M.toArray(), T.toArray(), 0.14 * sc, 0.11 * sc, 6), { c: C.yellowD, kind: 0, sway });
  const a = T.clone().sub(M).normalize(), e1 = new THREE.Vector3().crossVectors(a, new THREE.Vector3(0.31, 0.2, 0.93)).normalize(), e2 = new THREE.Vector3().crossVectors(a, e1);
  const P = [], U = [], I = [];
  const rk = new THREE.Vector3(), sd = new THREE.Vector3(), pos = new THREE.Vector3(), dir = new THREE.Vector3();
  for (let k = 0; k < 5; k++) {
    const th = (k / 5) * TAU + 0.3, b0 = P.length / 3, n = 6, len = 2.9 * sc;
    rk.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th));
    sd.crossVectors(a, rk).normalize();
    pos.copy(T);
    for (let i = 0; i <= n; i++) {
      const t = i / n, phi = 0.3 + 2.1 * Math.pow(t, 1.2), w = 0.52 * sc * Math.pow(Math.sin(Math.PI * (0.08 + 0.9 * t)), 0.75);
      P.push(pos.x - sd.x * w, pos.y - sd.y * w, pos.z - sd.z * w, pos.x + sd.x * w, pos.y + sd.y * w, pos.z + sd.z * w); U.push(0, t, 1, t);
      dir.copy(a).multiplyScalar(Math.cos(phi)).addScaledVector(rk, Math.sin(phi));
      pos.addScaledVector(dir, len / n);
      if (i < n) { const b = b0 + i * 2; I.push(b, b + 1, b + 3, b, b + 3, b + 2); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
  g.setIndex(I); g.computeVertexNormals();
  B.add(g, { c: C.red, kind: 0, sway });
  for (let k = 0; k < 3; k++) {
    const th = (k / 3) * TAU + 1.1;
    rk.copy(e1).multiplyScalar(Math.cos(th)).addScaledVector(e2, Math.sin(th));
    pos.copy(T).addScaledVector(a, 1.9 * sc).addScaledVector(rk, 0.55 * sc);
    B.add(bar(T.toArray(), pos.toArray(), 0.06 * sc, 0.05 * sc, 4), { c: C.yellow, kind: 0, sway });
    B.add(new THREE.SphereGeometry(0.2 * sc, 6, 4), { p: pos.toArray(), c: C.yellow, kind: 0, sway });
  }
}
// lilies in jars: a tall painted vase on the floor by the foot of the bed, a small jug of them on the offering table
function addLilyJars(B, C, S, rng) {
  const bf = C.clay, dk = C.clayD, rd = C.red, x = 15.2, z = -5.2;
  const prof = [[1.5, 0, dk], [1.7, 0.4, bf], [2.9, 2.6, bf], [3.2, 4.2, rd], [3.15, 4.9, C.linen], [2.9, 5.6, C.blue], [2.3, 6.9, bf], [1.25, 8.2, dk], [1.2, 8.9, bf], [1.75, 9.6, rd], [1.45, 9.6, dk], [1.0, 8.8, dk]];
  B.add(lathe(prof, 26, bf), { p: [x, 0, z], kind: 2 });
  profileTapers(x, z, prof.slice(0, 10), 0, S.tapers, 3);
  for (const sg of [-1, 1]) B.add(new THREE.TorusGeometry(1.2, 0.26, 6, 12, Math.PI), { p: [x, 7.3, z + sg * 2.2], r: [0, Math.PI / 2, sg * -Math.PI / 2], c: bf, kind: 2 });
  for (let i = 0; i < 6; i++) {
    const th = (i / 6) * TAU + rng.range(-0.3, 0.3), r = i === 0 ? 0.6 : rng.range(2.4, 4.6), L = i === 0 ? 9 : rng.range(5.5, 8.2);
    addCutLily(B, C, [x + Math.cos(th) * 0.5, 9.2, z + Math.sin(th) * 0.5], [x + Math.cos(th) * r, 9.4 + L, z + Math.sin(th) * r], 9.4);
  }
  S.tapers.push([x, z, 12, 18, 1.0, 4.0]);
  const jx = TABLE.x - 2.8, jz = TABLE.z - 2.8, jy = 7.84;
  B.add(lathe([[0.55, 0, dk], [0.65, 0.15, bf], [0.95, 1.1, rd], [0.9, 1.7, bf], [0.5, 2.6, bf], [0.45, 3.0, dk], [0.62, 3.3, bf], [0.45, 3.3, dk]], 16, bf), { p: [jx, jy, jz], kind: 2 });
  for (let i = 0; i < 3; i++) {
    const th = (i / 3) * TAU + 0.9, r = i === 0 ? 0.3 : 1.7;
    addCutLily(B, C, [jx, jy + 3.1, jz], [jx + Math.cos(th) * r, jy + (i === 0 ? 7.6 : 6.2), jz + Math.sin(th) * r], jy + 3.1, 0.62);
  }
}
// a wooden chest with two painted bands and rope handles, a folded cloth and a basket of wool on its lid
function addChest(B, C, S) {
  const x = -1, z = -15;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(rbox(1.1, 0.9, 1.1, 0.2), { p: [x + sx * 4.2, 0.45, z + sz * 2.3], c: C.woodD, kind: 1 });
  B.add(rbox(10, 4.4, 6, 0.35), { p: [x, 3.0, z], c: C.wood, kind: 1 });
  B.add(rbox(10.6, 1.0, 6.6, 0.4), { p: [x, 5.6, z], c: C.woodD, kind: 1 });
  for (const sx of [-1, 1]) {
    B.add(rbox(0.9, 4.5, 6.12, 0.1), { p: [x + sx * 2.8, 3.0, z], c: C.red, kind: 0 });
    B.add(new THREE.TorusGeometry(0.9, 0.2, 6, 12, Math.PI), { p: [x + sx * 5.05, 3.6, z], r: [Math.PI, Math.PI / 2, 0], c: C.straw, kind: 7, uv: [20, 3] });
  }
  S.slabs.push([x - 5, x + 5, z - 3, z + 3, 0.8, 6.1]);
  B.add(rbox(4.0, 0.6, 3.6, 0.26), { p: [x - 2.6, 6.4, z + 0.3], r: [0, 0.15, 0], c: C.blue, kind: 0 });
  B.add(rbox(3.8, 0.6, 3.4, 0.26), { p: [x - 2.5, 7.0, z + 0.2], r: [0, -0.1, 0], c: C.linen, kind: 5, uv: (px, py, pz) => [px, pz * 2.4] });
  B.add(lathe([[0, 0, C.straw], [1.6, 0, C.straw], [2.3, 1.5, C.yellowD], [2.4, 1.9, C.red], [2.15, 1.9, C.straw], [1.5, 0.3, C.straw], [0, 0.25, C.straw]], 22, C.straw), { p: [x + 2.4, 6.1, z - 0.2], kind: 3, uv: [1 / 0.45, 1 / 0.45] });
  B.add(new THREE.SphereGeometry(0.95, 14, 10), { p: [x + 2.0, 7.4, z - 0.5], c: C.red, kind: 7, uv: [28, 11] });
  B.add(new THREE.SphereGeometry(0.85, 14, 10), { p: [x + 3.1, 7.3, z + 0.4], c: C.linen, kind: 7, uv: [26, 10] });
  B.add(new THREE.SphereGeometry(0.8, 14, 10), { p: [x + 2.2, 7.25, z + 0.9], c: C.yellow, kind: 7, uv: [26, 10] });
}

// floor and ceiling planes, the stone reveal of the window, the inside of the niche and the door passage
// aQ = (u, v, kind, tone): kind 0 floor, 1 ceiling, 2 plaster, 3 dressed stone
function buildShell(C) {
  const B = makeBatch();
  const X = RX, XO = RX + WALL_T;
  const add = (o, e1, e2, kind, tone, uvf) => {
    const a = o, b = [o[0] + e1[0], o[1] + e1[1], o[2] + e1[2]], d = [o[0] + e2[0], o[1] + e2[1], o[2] + e2[2]], c = [b[0] + e2[0], b[1] + e2[1], b[2] + e2[2]];
    B.add(quad(a, b, c, d), { c: C.plaster, kind, sway: tone, uv: uvf });
  };
  const zy = (x, y, z) => [z, y], xy = (x, y, z) => [x, y], xz = (x, y, z) => [x, z];
  // floor (it runs on into the door passage) and ceiling
  add([-RX, 0, RZ], [2 * RX, 0, 0], [0, 0, -2 * RZ], 0, 1, xz);
  add([X, 0, DOOR.z1], [WALL_T, 0, 0], [0, 0, DOOR.z0 - DOOR.z1], 0, 1, xz);
  add([-RX, RH, -RZ], [2 * RX, 0, 0], [0, 0, 2 * RZ], 1, 1, xz);
  // (the face of the east wall is painted now, and belongs to the hero: this file keeps what is IN its openings)
  // niche: back, sides, top, bottom
  const n = NICHE, nd = n.d;
  add([X + nd, n.y0, n.z0], [0, 0, n.z1 - n.z0], [0, n.y1 - n.y0, 0], 2, 0.8, zy);
  add([X, n.y0, n.z0], [nd, 0, 0], [0, n.y1 - n.y0, 0], 2, 0.9, xy);                     // north side, faces +z
  add([X, n.y0, n.z1], [0, n.y1 - n.y0, 0], [nd, 0, 0], 2, SHADE, xy);                   // south side, faces -z
  add([X, n.y0, n.z1], [nd, 0, 0], [0, 0, n.z0 - n.z1], 2, 0.94, xz);                    // bottom, faces up
  add([X, n.y1, n.z0], [nd, 0, 0], [0, 0, n.z1 - n.z0], 2, SHADE, xz);                   // top, faces down
  // window reveal in dressed stone
  add([X, WIN.y0, WIN.z0], [WALL_T, 0, 0], [0, WIN.y1 - WIN.y0, 0], 3, 1, xy);           // north jamb, faces +z
  add([X, WIN.y0, WIN.z1], [0, WIN.y1 - WIN.y0, 0], [WALL_T, 0, 0], 3, 1, (x, y, z) => [x + 3.3, y]);   // south jamb, faces -z
  add([X, WIN.y0, WIN.z1], [WALL_T, 0, 0], [0, 0, WIN.z0 - WIN.z1], 3, 1, (x, y, z) => [x + 1.7, z + 2]);   // sill, faces up
  add([X, WIN.y1, WIN.z0], [WALL_T, 0, 0], [0, 0, WIN.z1 - WIN.z0], 3, 1, xz);           // head, faces down
  // door passage
  add([X, 0, DOOR.z0], [WALL_T, 0, 0], [0, DOOR.y1, 0], 2, 0.88, xy);
  add([X, 0, DOOR.z1], [0, DOOR.y1, 0], [WALL_T, 0, 0], 2, SHADE, xy);
  add([X, DOOR.y1, DOOR.z0], [WALL_T, 0, 0], [0, 0, DOOR.z1 - DOOR.z0], 2, 0.66, xz);
  add([XO, 0, DOOR.z0], [0, 0, DOOR.z1 - DOOR.z0], [0, DOOR.y1, 0], 2, 0.6, zy);
  return B.build();
}

// joists, the window's stone surround, sill and lintel, the door frame, the niche and what stands in it
async function addEastWall(ctx, B, C, rng, perch) {
  const ALT = 16, buffP = C.clay, dkP = C.clayD;
  // ceiling joists: round timbers running north to south
  for (let i = 0; i < 12; i++) {
    const x = -45.8 + i * 8.33, r = 1.35 + 0.25 * rng();
    const g = new THREE.CylinderGeometry(r, r * (0.9 + 0.1 * rng()), 2 * RZ, 14, 1, true);
    g.rotateX(Math.PI / 2);
    B.add(g, { p: [x, RH - 0.9, 0], c: i % 3 === 1 ? C.woodD : C.joist, kind: 1, uv: (px, py, pz, u) => [pz, u * 9] });
  }
  await ctx.yield();
  // stone surround of the window, proud of the plaster: long and short quoins, a splayed sill, a timber lintel
  const st = (t) => C.stone.clone().multiplyScalar(t);
  for (const sd of [-1, 1]) {
    const ze = sd < 0 ? WIN.z0 : WIN.z1;
    for (let k = 0; k < 6; k++) {
      const long = (k + (sd < 0 ? 0 : 1)) % 2 === 0, wd = long ? 5.4 : 3.6;
      B.add(rbox(1.7, 3.84, wd, 0.22), { p: [RX - 0.55, WIN.y0 + 2 + k * 4, ze + sd * wd / 2], c: st(0.94 + 0.07 * rng()), kind: 4 + ALT });
    }
  }
  // sill: a splayed slab sloping into the room (the lizard's basking place)
  {
    const z0 = WIN.z0 - 6, z1 = WIN.z1 + 6, pr = [[RX + 0.3, 28], [RX - 3.6, 25.7], [RX - 3.6, 24.3], [RX + 0.3, 24.3]];
    const P = [], I = [], U = [];
    let nvt = 0;
    const face = (a, b, c, d, uva, uvb, uvc, uvd) => { P.push(...a, ...b, ...c, ...d); U.push(...uva, ...uvb, ...uvc, ...uvd); I.push(nvt, nvt + 1, nvt + 2, nvt, nvt + 2, nvt + 3); nvt += 4; };
    for (let k = 0; k < 3; k++) {
      const a = pr[k], b = pr[k + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      face([a[0], a[1], z1], [a[0], a[1], z0], [b[0], b[1], z0], [b[0], b[1], z1], [z1, 0], [z0, 0], [z0, l], [z1, l]);
    }
    face([pr[0][0], pr[0][1], z0], [pr[3][0], pr[3][1], z0], [pr[2][0], pr[2][1], z0], [pr[1][0], pr[1][1], z0], [0, 4], [0, 0], [4, 0], [4, 2]);
    face([pr[0][0], pr[0][1], z1], [pr[1][0], pr[1][1], z1], [pr[2][0], pr[2][1], z1], [pr[3][0], pr[3][1], z1], [0, 4], [4, 2], [4, 0], [0, 0]);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2));
    g.setIndex(I); g.computeVertexNormals();
    B.add(g, { c: st(1.02), kind: 4 + ALT });
  }
  // lintel: a squared beam on the face, round logs through the thickness of the wall
  B.add(rbox(2.2, 3.4, WIN.z1 - WIN.z0 + 13, 0.35), { p: [RX - 0.7, WIN.y1 + 1.7, (WIN.z0 + WIN.z1) / 2], c: C.joist, kind: 1 + ALT });
  for (let i = 0; i < 5; i++) {
    const g = new THREE.CylinderGeometry(1.45, 1.45, WIN.z1 - WIN.z0 + 2, 12, 1, true);
    g.rotateX(Math.PI / 2);
    B.add(g, { p: [RX + 2 + i * 3, WIN.y1 + 1.2, (WIN.z0 + WIN.z1) / 2], c: i & 1 ? C.woodD : C.joist, kind: 1 + ALT, uv: (px, py, pz, u) => [pz, u * 9] });
  }
  await ctx.yield();
  // a few dry reeds left on the sill
  for (let i = 0; i < 5; i++) {
    const x = RX + 4.5 + i * 1.1 + rng.range(-0.4, 0.4), za = WIN.z0 + 1.2 + rng.range(0, 2), zb = za + rng.range(8, 13);
    B.add(bar([x, WIN.y0 + 0.2 + 0.1 * i, za], [x + rng.range(-1.6, 1.6), WIN.y0 + 0.22 + 0.1 * i, Math.min(zb, WIN.z1 - 0.8)], 0.16, 0.1, 6), { c: i & 1 ? C.straw : C.yellowD, kind: 7 + ALT });
  }
  // (and three more further out, beside the place where the sparrow waits: fixed, so that no random draw moves)
  for (const [xa, za, xb, zb, k] of [[RX + 9.6, -4.2, RX + 12.6, 2.2, 0], [RX + 12.9, -2.4, RX + 9.4, 3.9, 1], [RX + 7.6, -0.8, RX + 9.2, 5.6, 2]]) {
    B.add(bar([xa, WIN.y0 + 0.2 + 0.1 * k, za], [xb, WIN.y0 + 0.24 + 0.1 * k, zb], 0.16, 0.1, 6), { c: k & 1 ? C.straw : C.yellowD, kind: 7 + ALT });
  }
  // (round four) a second bundle of reeds tied with red wool along the north jamb, and an empty snail shell
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU, oy = 0.34 + 0.2 * Math.sin(a), oz = 0.2 * Math.cos(a);
    B.add(bar([RX + 5.6 + 0.3 * (i % 3), WIN.y0 + oy, WIN.z0 + 1.5 + oz], [RX + 13.2 - 0.35 * (i % 2), WIN.y0 + oy + 0.05, WIN.z0 + 2.5 + oz], 0.15, 0.1, 6), { c: i % 3 === 0 ? C.yellowD : C.straw, kind: 7 + ALT });
  }
  for (const xx of [RX + 7.6, RX + 11.0]) B.add(new THREE.TorusGeometry(0.46, 0.09, 6, 14), { p: [xx, WIN.y0 + 0.35, WIN.z0 + 1.76 + (xx - RX - 5.6) * 0.13], r: [0, Math.PI / 2 - 0.13, 0], c: C.red, kind: 0 + ALT });
  for (const [dx, dy, dz, r, col] of [[0, 0.55, 0, 0.55, C.sandB], [0.42, 0.52, 0.2, 0.42, C.straw], [0.62, 0.72, 0.42, 0.3, C.sandB], [0.6, 0.92, 0.6, 0.19, C.clayD]]) {
    B.add(new THREE.SphereGeometry(r, 12, 8), { p: [RX + 9.3 + dx, WIN.y0 + dy * 0.9, 3.6 + dz], c: col, kind: 2 + ALT, uv: [8, 3] });
  }
  // an upturned jar left far out on the stone floor of the window: the sparrow's perch as we leave (sparrow visits only)
  if (perch) B.add(lathe([[1.5, 0, buffP], [1.75, 0.2, dkP], [1.7, 0.45, buffP], [1.85, 1.3, C.red], [1.75, 1.85, buffP], [1.35, 2.55, dkP], [1.05, 2.9, buffP], [0.8, 3.0, buffP], [0, 3.0, buffP]], 22, buffP), { p: [PERCH[0], WIN.y0, PERCH[2]], kind: 2 + ALT });
  await ctx.yield();
  // door frame: two posts, a lintel, a stone threshold
  for (const z of [DOOR.z0 - 1.0, DOOR.z1 + 1.0]) B.add(rbox(1.8, DOOR.y1 + 1.5, 2.2, 0.3), { p: [RX - 0.5, (DOOR.y1 + 1.5) / 2, z], c: C.wood, kind: 1 + ALT, uv: (x, y, z2) => [y, z2 + x] });
  B.add(rbox(2.2, 3.2, DOOR.z1 - DOOR.z0 + 7, 0.35), { p: [RX - 0.6, DOOR.y1 + 1.6, (DOOR.z0 + DOOR.z1) / 2], c: C.joist, kind: 1 + ALT });
  B.add(rbox(5, 0.5, DOOR.z1 - DOOR.z0, 0.2), { p: [RX + 1.8, 0.1, (DOOR.z0 + DOOR.z1) / 2], c: st(0.97), kind: 4 + ALT });
  // the cupboard niche: a timber shelf and the things kept there
  const n = NICHE, zc = (n.z0 + n.z1) / 2;
  B.add(rbox(n.d - 0.6, 0.8, n.z1 - n.z0, 0.2), { p: [RX + n.d / 2, 31.4, zc], c: C.wood, kind: 1 + ALT, uv: (x, y, z) => [z, x] });
  B.add(rbox(0.9, 1.0, n.z1 - n.z0 + 2.4, 0.2), { p: [RX - 0.25, n.y0 - 0.5, zc], c: C.wood, kind: 1 + ALT });
  const buff = C.clay, dk = C.clayD, rd = C.red;
  // a squat jug with a handle, a tall red flask, a stack of bowls
  B.add(lathe([[1.3, 0, dk], [1.5, 0.3, buff], [2.5, 2.2, rd], [2.6, 2.9, buff], [2.3, 4.2, dk], [1.2, 5.4, buff], [1.0, 6.3, buff], [1.35, 6.9, rd], [1.1, 6.9, buff]], 22, buff), { p: [RX + 2.9, n.y0, n.z0 + 3.4], kind: 2 + ALT });
  B.add(new THREE.TorusGeometry(1.2, 0.26, 6, 12, Math.PI), { p: [RX + 2.3, n.y0 + 5.2, n.z0 + 5.0], r: [0, 0.9, -Math.PI / 2], c: buff, kind: 2 + ALT });
  B.add(lathe([[0.9, 0, rd], [1.5, 1.8, rd], [1.6, 3.4, C.linen], [1.5, 3.9, rd], [0.75, 6.4, rd], [0.55, 8.6, dk], [0.85, 9.2, rd], [0.6, 9.2, rd]], 18, rd), { p: [RX + 3.3, n.y0, zc + 0.6], kind: 2 + ALT });
  for (let i = 0; i < 4; i++) B.add(lathe([[0, 0, buff], [0.9, 0, buff], [2.1, 1.0, i & 1 ? rd : buff], [2.25, 1.25, dk], [2.0, 1.25, buff], [0.8, 0.25, buff], [0, 0.22, buff]], 20, buff), { p: [RX + 2.8, n.y0 + i * 0.62, n.z1 - 3.2], r: [0, i, 0], kind: 2 + ALT });
  await ctx.yield();
  // on the shelf: a ball of blue wool, folded red cloth, a lamp, a small lidded box
  const sy = 31.8;
  B.add(new THREE.SphereGeometry(1.5, 18, 12), { p: [RX + 2.6, sy + 1.5, n.z0 + 2.8], c: C.blue, kind: 7 + ALT, uv: [36, 14] });
  B.add(rbox(3.8, 0.7, 4.2, 0.3), { p: [RX + 2.8, sy + 0.35, zc - 0.6], c: rd, kind: 5 + ALT, uv: (x, y, z) => [x, z * 2.2] });
  B.add(rbox(3.6, 0.7, 4.0, 0.3), { p: [RX + 2.8, sy + 1.05, zc - 0.5], r: [0, 0.12, 0], c: C.linen, kind: 0 + ALT });
  B.add(rbox(3.4, 0.6, 3.8, 0.28), { p: [RX + 2.8, sy + 1.7, zc - 0.6], r: [0, -0.1, 0], c: C.blue, kind: 0 + ALT });
  B.add(lathe([[0, 0, C.stoneD], [1.2, 0, C.stoneD], [1.7, 0.6, C.stoneD], [1.75, 1.0, C.stoneD], [1.3, 1.0, C.black], [0, 0.7, C.black]], 16, C.stoneD), { p: [RX + 2.6, sy, n.z1 - 5.0], kind: 4 + ALT });
  B.add(lathe([[1.5, 0, C.yellowD], [1.5, 1.6, rd], [1.6, 1.7, C.yellowD], [1.6, 2.0, C.yellowD], [0.3, 2.5, rd], [0.3, 2.9, rd], [0, 2.9, rd]], 16, C.yellowD), { p: [RX + 2.8, sy, n.z1 - 2.0], kind: 0 + ALT });
}

// the wall lizard, built lying along +Z on the plane y = 0, nose at z = 1.8, tail tip at z = -2.2
function buildLizard(C) {
  const P = [], N = [], Cc = [], L = [], I = [];
  let n = 0;
  const push = (p, nn, c, l) => { P.push(p[0], p[1], p[2]); N.push(nn[0], nn[1], nn[2]); Cc.push(c.r, c.g, c.b); L.push(l[0], l[1], l[2], 0); return n++; };
  const wAt = (s) => {
    // half width along the spine: tail, hips, belly, neck, head, nose
    const k = [[0, 0.015], [0.2, 0.07], [0.45, 0.17], [0.55, 0.3], [0.66, 0.37], [0.76, 0.3], [0.83, 0.2], [0.9, 0.27], [0.955, 0.21], [1, 0.05]];
    let i = 0; while (i < k.length - 2 && s > k[i + 1][0]) i++;
    const t = clamp((s - k[i][0]) / (k[i + 1][0] - k[i][0]), 0, 1);
    return lerp(k[i][1], k[i + 1][1], t * t * (3 - 2 * t));
  };
  const RINGS = 34, SEG = 10;
  for (let i = 0; i <= RINGS; i++) {
    const s = i / RINGS, z = -2.2 + 4 * s, w = wAt(s), h = w * 0.62, yc = h * 0.72 + 0.04;
    for (let j = 0; j <= SEG; j++) {
      const th = j / SEG * TAU, cx = Math.sin(th), cy = Math.cos(th);
      const y = yc + (cy > 0 ? cy * h : cy * h * 0.7);
      const col = cy > 0.25 ? C.sand : cy > -0.3 ? C.sandB : C.linen;
      push([cx * w, y, z], [cx, cy * 1.3, 0].map((v, q, a) => v / Math.hypot(a[0], a[1])), s > 0.985 ? C.sandB : col, [0, s, 0]);
    }
  }
  for (let i = 0; i < RINGS; i++) for (let j = 0; j < SEG; j++) {
    const a = i * (SEG + 1) + j, b = a + 1, c = a + SEG + 1, d = c + 1;
    I.push(a, b, c, b, d, c);
  }
  // eyes
  const addGeo = (g, col, l) => {
    const pos = g.attributes.position, nor = g.attributes.normal, base = n;
    for (let i = 0; i < pos.count; i++) push([pos.getX(i), pos.getY(i), pos.getZ(i)], [nor.getX(i), nor.getY(i), nor.getZ(i)], col, l);
    if (g.index) for (let i = 0; i < g.index.count; i++) I.push(base + g.index.getX(i)); else for (let i = 0; i < pos.count; i++) I.push(base + i);
    g.dispose();
  };
  for (const sx of [-1, 1]) { const e = new THREE.SphereGeometry(0.06, 8, 6); e.translate(sx * 0.2, 0.3, 1.42); addGeo(e, C.black, [0, 0.9, 0]); }
  // legs: thigh out from the body, shin down to a splayed foot with long toes
  const legs = [[0.57, 1, 0], [0.57, -1, Math.PI], [0.775, 1, Math.PI], [0.775, -1, 0]];
  for (const [s, sx, ph] of legs) {
    const z = -2.2 + 4 * s, w = wAt(s), hind = s < 0.6, l = [1, s, ph];
    const hip = [sx * w * 0.8, 0.2, z], knee = [sx * (w + 0.36), 0.3, z + (hind ? -0.12 : 0.16)], foot = [sx * (w + 0.52), 0.05, z + (hind ? 0.14 : 0.36)];
    addGeo(bar(hip, knee, 0.12, 0.09, 6), C.sand, l);
    addGeo(bar(knee, foot, 0.09, 0.06, 6), C.sand, l);
    for (let t = 0; t < 4; t++) {
      const a = (hind ? 0.5 : 0.1) + (t - 1.5) * 0.42, tl = (hind ? 0.34 : 0.26) * (t === 2 ? 1.25 : 1);
      addGeo(bar(foot, [foot[0] + sx * Math.sin(a + 0.5) * tl, 0.03, foot[2] + Math.cos(a + 0.5) * tl], 0.045, 0.025, 4), C.sandB, l);
    }
  }
  // its shadow on the stone: a flat shape under the body, slipped to the shade side
  const sb = n;
  for (let i = 0; i <= RINGS; i++) {
    const s = i / RINGS, z = -2.2 + 4 * s, w = wAt(s) * 1.25 + 0.03;
    push([-w - 0.2, 0.03, z - 0.06], [0, 1, 0], C.black, [2, s, 0]);
    push([w - 0.12, 0.03, z - 0.06], [0, 1, 0], C.black, [2, s, 0]);
  }
  for (let i = 0; i < RINGS; i++) { const a = sb + i * 2; I.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(Cc, 3));
  g.setAttribute('aL', new THREE.Float32BufferAttribute(L, 4));
  g.setIndex(I);
  return g;
}

// the sparrow (cast variant of the lizard): a small solid bird standing on y = 0, beak toward +Z, about 3.6 m long.
// aL = (part: 0 body, 1 head, 2 tail, 3 shadow; unused...)
const SPARROW_VERT = /* glsl */`
attribute vec3 aC; attribute vec4 aL;
uniform float uHead, uTurn, uTime, uShadow, uCrouch;
varying vec3 vC, vN; varying float vPart;
void main(){
  vec3 p = position, n = normal;
  float head = step(0.5, aL.x) * step(aL.x, 1.5), tail = step(1.5, aL.x) * step(aL.x, 2.5);
  // the head turns and lifts about the neck
  vec3 pivot = vec3(0.0, 1.25, 0.5);
  float cy = cos(uTurn * head), sy = sin(uTurn * head), cp = cos(uHead * head), sp = sin(uHead * head);
  vec3 d = p - pivot;
  d = vec3(d.x * cy + d.z * sy, d.y, -d.x * sy + d.z * cy);
  d = vec3(d.x, d.y * cp + d.z * sp, -d.y * sp + d.z * cp);
  n = vec3(n.x * cy + n.z * sy, n.y, -n.x * sy + n.z * cy);
  n = vec3(n.x, n.y * cp + n.z * sp, -n.y * sp + n.z * cp);
  p = pivot + d;
  // the tail flicks, the breast breathes, the whole bird dips before a hop
  float tw = smoothstep(-0.9, -2.2, p.z) * tail;
  p.y += tw * (0.22 * sin(uTime * 4.3) * smoothstep(0.2, 1.0, sin(uTime * 0.9)) + 0.25 * uCrouch);
  p.x *= 1.0 + 0.035 * sin(uTime * 5.0) * (1.0 - head) * (1.0 - tail) * step(0.45, p.y);
  p.y -= 0.16 * uCrouch * step(0.35, p.y) * step(aL.x, 2.5);
  if (aL.x > 2.5) p = vec3(p.x, 0.03, p.z) * step(0.5, uShadow);
  vC = aC; vPart = aL.x;
  vN = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;
const SPARROW_FRAG = /* glsl */`
uniform vec3 uLdir, uGround;
uniform float uLitAll;
varying vec3 vC, vN; varying float vPart;
void main(){
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  float ndl = dot(N, uLdir) - 0.05;
  float lit = clamp(ndl / max(fwidth(ndl), 1e-4) + 0.5, 0.0, 1.0) * uLitAll;
  vec3 col = vC * mix(${SHADE.toFixed(2)}, 1.0, lit);
  col = mix(col, uGround, step(2.5, vPart));
  gl_FragColor = vec4(col, 1.0);
}
`;
function buildSparrow(C) {
  const P = [], N = [], Cc = [], L = [], I = [];
  let n = 0;
  const v = new THREE.Vector3(), nn = new THREE.Vector3(), m4 = new THREE.Matrix4(), n3 = new THREE.Matrix3(), e = new THREE.Euler(), q = new THREE.Quaternion(), sc = new THREE.Vector3();
  // add a geometry; colour may be a Color or fn(local unit-ish position before the transform) -> Color
  const add = (g, part, col, pos, rot = [0, 0, 0], scale = [1, 1, 1]) => {
    const ps = g.attributes.position, ns = g.attributes.normal, base = n;
    q.setFromEuler(e.set(rot[0], rot[1], rot[2])); m4.compose(v.set(pos[0], pos[1], pos[2]), q, sc.set(scale[0], scale[1], scale[2])); n3.getNormalMatrix(m4);
    for (let i = 0; i < ps.count; i++) {
      v.fromBufferAttribute(ps, i);
      const c = col.isColor ? col : col(v.x, v.y, v.z);
      v.applyMatrix4(m4); nn.fromBufferAttribute(ns, i).applyMatrix3(n3).normalize();
      P.push(v.x, v.y, v.z); N.push(nn.x, nn.y, nn.z); Cc.push(c.r, c.g, c.b); L.push(part, 0, 0, 0); n++;
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) I.push(base + g.index.getX(i)); else for (let i = 0; i < ps.count; i++) I.push(base + i);
    g.dispose();
  };
  const back = mixc(C.wood, C.black, 0.12), streak = mixc(C.woodD, C.black, 0.35), belly = mixc(C.plaster, C.black, 0.12), flank = C.sand;
  const crown = mixc(C.black, C.plaster, 0.5), cheek = mixc(C.plaster, C.black, 0.06), nape = mixc(C.red, C.black, 0.35), dark = C.black;
  // body: streaked brown back, sand flanks, pale belly
  add(new THREE.SphereGeometry(1, 20, 14), 0, (x, y, z) => (y > 0.25 ? (Math.abs(((x * 2.6 + 0.5) % 1 + 1) % 1 - 0.5) < 0.16 && z < 0.55 ? streak : back) : y > -0.2 ? flank : belly),
    [0, 0.98, -0.05], [-0.32, 0, 0], [0.64, 0.6, 1.05]);
  // folded wings: dark, with one pale bar
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(1, 12, 10), 0, (x, y, z) => (z > 0.3 && z < 0.5 ? cheek : z > 0.5 ? nape : streak),
    [sx * 0.56, 1.08, -0.3], [-0.42, 0, sx * 0.12], [0.15, 0.4, 0.86]);
  // tail
  { const g = new THREE.BoxGeometry(0.5, 0.09, 1.35, 1, 1, 3); const ps = g.attributes.position; for (let i = 0; i < ps.count; i++) ps.setX(i, ps.getX(i) * (1.25 - 0.5 * (ps.getZ(i) / 1.35 + 0.5))); g.computeVertexNormals(); add(g, 2, streak, [0, 0.98, -1.55], [0.12, 0, 0]); }
  // head: grey crown, chestnut nape, pale cheek, black bib
  add(new THREE.SphereGeometry(0.47, 18, 14), 1, (x, y, z) => (y > 0.2 ? (z < -0.05 && Math.abs(x) > 0.12 ? nape : crown) : z > 0.2 && y < -0.12 && Math.abs(x) < 0.3 ? dark : Math.abs(x) > 0.3 && z < 0.05 && y > -0.05 ? nape : cheek), [0, 1.52, 0.7]);
  for (const sx of [-1, 1]) add(new THREE.SphereGeometry(0.07, 8, 6), 1, dark, [sx * 0.37, 1.6, 0.93]);
  { const g = new THREE.ConeGeometry(0.17, 0.44, 8); g.rotateX(Math.PI / 2); add(g, 1, mixc(C.black, C.yellowD, 0.3), [0, 1.47, 1.3]); }
  // bib running down onto the breast
  add(new THREE.SphereGeometry(1, 10, 8), 0, dark, [0, 1.12, 0.72], [0, 0, 0], [0.3, 0.34, 0.2]);
  // legs and toes
  for (const sx of [-1, 1]) {
    const foot = [sx * 0.26, 0.04, 0.16];
    add(bar([sx * 0.22, 0.56, 0.02], foot, 0.05, 0.045, 6), 0, nape, [0, 0, 0]);
    for (const a of [-0.5, 0, 0.5]) add(bar(foot, [foot[0] + Math.sin(a) * 0.36, 0.03, foot[2] + Math.cos(a) * 0.36], 0.04, 0.025, 4), 0, nape, [0, 0, 0]);
    add(bar(foot, [foot[0], 0.03, foot[2] - 0.26], 0.04, 0.025, 4), 0, nape, [0, 0, 0]);
  }
  // its shadow: a flat shape under the bird
  { const g = new THREE.CircleGeometry(1, 18); g.rotateX(-Math.PI / 2); add(g, 3, dark, [-0.25, 0.03, -0.25], [0, 0, 0], [0.8, 1, 1.5]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(Cc, 3));
  g.setAttribute('aL', new THREE.Float32BufferAttribute(L, 4));
  g.setIndex(I);
  return g;
}

// ---------------------------------------------------------------- the world
export default {
  id: 'room-of-swallows',
  name: 'The Room of Swallows',
  category: 'domestic',
  weirdness: 0.35,
  media: ['tiny', 'interior'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {};
    const detail = ctx.quality?.detail ?? 1;
    const seed = Math.abs(Math.floor(Number(ctx.seed) || 0));

    // ---- the look of this visit: spring morning, high noon, or the wall still being painted
    let look = LOOKS[(seed % 5) % 3];
    if (vary.hour === 'day') look = 'noon';
    else if ((vary.hour === 'dawn' || vary.hour === 'golden') && look === 'noon') look = 'spring';
    const rare = !!vary.rare;
    const sparrow = (seed % 7) % 4 === 0;                      // cast: on two visits in seven a sparrow on the sill in place of the lizard
    // night: the same room under a low moon. The moon lays the window shape on the north wall as the sun does;
    // the plaster falls to a cool grey, the pigments stay what they are, and the window holds deep blue.
    const night = vary.hour === 'night';
    if (night && look === 'noon') look = 'spring';
    const cast = look === 'noon' ? 'blue' : ['yellow', 'blue', 'red'][seed % 3];
    const lily = look === 'noon' ? 'papyrus' : seed % 2 === 0 ? 'white' : 'red';
    const vessels = ['jar', 'strainer', 'baskets'];
    const vessel = vessels[(LOOKS.indexOf(look) + (seed % 2 === 0 ? 1 : 0)) % 3];
    const palette = PALETTE.slice();
    if (night) { palette[0] = '#CDD0D0'; palette[1] = '#F3F3EC'; palette[6] = '#2F4C77'; }
    else if (look === 'noon') { palette[0] = '#E9E9E3'; palette[1] = '#FDFDF7'; palette[6] = '#A0C6E6'; }
    else if (look === 'unfinished') { palette[0] = '#F0E7D4'; palette[1] = '#FFFAEA'; palette[6] = '#B2CDDD'; }
    const [pl, ps, red, yel, blu, blk, haze] = palette.map((h) => new THREE.Color(h));
    const wy = mixc(yel, red, 0.45);
    const C = {
      plaster: pl, plasterSun: ps, red, blue: blu, black: mixc(blk, pl, 0.05),
      yellowD: mixc(yel, blk, 0.14), straw: mixc(yel, pl, 0.5),
      wood: mixc(wy, blk, 0.24), woodD: mixc(wy, blk, 0.52), joist: mixc(wy, blk, 0.4),
      hide: mixc(mixc(yel, pl, 0.55), red, 0.1), hideB: mixc(mixc(yel, pl, 0.72), red, 0.06),
      linen: mixc(pl, ps, 0.4),
      clay: mixc(mixc(yel, pl, 0.55), red, 0.1), clayD: mixc(red, blk, 0.45),
      fig: mixc(blk, red, 0.3), figB: mixc(blk, blu, 0.42),
      stone: mixc(mixc(pl, blk, 0.13), blu, 0.03), stoneD: mixc(pl, blk, 0.42),
      sand: mixc(mixc(yel, pl, 0.42), blk, 0.16), sandB: mixc(yel, pl, 0.66),
      yellow: yel, ochre: mixc(yel, pl, 0.22),
      flameA: new THREE.Color('#FFD45E'), flameB: mixc(yel, red, 0.45), flameR: mixc(red, yel, 0.15),
    };
    await ctx.yield();

    // ---- route: the brief's lap, lifted a little at the window so the sill and its lizard are seen from above
    const route = buildFlyThrough([[0, 7], [146, 7], [212, 29.5], [266, 32.5], [301, 37]]);
    const path = makePath(route);
    await ctx.yield();

    // ---- the hero: the painted walls, lilies, swallows, gust, kiss
    const hero = await buildHero(ctx, { palette, look, cast, lily, rare, density: vary.density, demo: false, path });
    const A = hero.anchors, HU = hero.uniforms, G = hero.glsl;
    await ctx.yield();

    const scene = new THREE.Scene();
    scene.background = haze.clone();
    const root = new THREE.Group();
    scene.add(root);
    root.add(hero.object);

    // ---- shared uniforms
    const uTime = { value: 0 }, uShake = { value: 0 };
    const uKey = { value: new THREE.Vector3(0.55, 0.56, -0.62).normalize() };
    const uKey2 = { value: new THREE.Vector3(-0.45, 0.55, 0.7).normalize() };
    const sunU = { uSunDir: HU.uSunDir, uWinIn: HU.uWinIn, uWinOut: HU.uWinOut, uWinHalf: HU.uWinHalf };
    const cu = (c) => ({ value: c });

    // ---- the real things, in one batch
    const S = { slabs: [], tapers: [] };
    const B = makeBatch();
    const fr = rng.fork('furniture');
    await addBed(ctx, B, C, S);
    await ctx.yield();
    addVessel(B, C, S, vessel);
    await ctx.yield();
    addTable(B, C, S, fr);
    await ctx.yield();
    await addSmallThings(ctx, B, C, S, fr);
    await ctx.yield();
    await addEastWall(ctx, B, C, fr, sparrow);
    await ctx.yield();
    // ---- the lived-in room (a random stream of its own, forked after everything above so nothing older moves)
    const lr = fr.fork('lived-in');
    addMat(B, C, 17.5, 42, 23.2, 35.8, { stripes: 6, cols: [C.blue, C.red], edge: C.blue, end: C.red });
    addMat(B, C, 6.5, 25.5, -24.5, -7, { stripes: 5, cols: [C.red, C.yellowD], c: C.sandB });
    await ctx.yield();
    await addLoom(ctx, B, C, S);
    await ctx.yield();
    await addPithoi(ctx, B, C, S);
    await ctx.yield();
    addLamp(B, C, S, 0.8, 15.6);
    await ctx.yield();
    addLamp(B, C, S, -10.5, -10.5);
    addFlame(B, C, [RX + 2.6, 32.75, NICHE.z1 - 5.0], 1.0);
    await ctx.yield();
    addLilyJars(B, C, S, lr);
    await ctx.yield();
    addChest(B, C, S);
    await ctx.yield();
    const shadow = shadowGLSL(S.slabs, S.tapers);
    await ctx.yield();
    const realMat = new THREE.ShaderMaterial({
      uniforms: { ...sunU, uGustT: HU.uGustT, uTime, uShake, uKey, uKey2, uPlaster: cu(pl), uPlasterSun: HU.uPlasterSun, uRed: cu(red), uBlue: cu(blu), uFlame: cu(new THREE.Color('#FFE9A0')) },
      vertexShader: realVert(G), fragmentShader: realFrag(G, shadow), side: THREE.DoubleSide,
    });
    const real = new THREE.Mesh(B.build(), realMat);
    real.name = 'real-things'; real.frustumCulled = false;
    root.add(real);
    await ctx.yield();

    // ---- floor, ceiling, east wall, reveal
    const shellMat = new THREE.ShaderMaterial({
      uniforms: {
        ...sunU, uTime, uKey, uPlaster: cu(pl), uPlasterSun: HU.uPlasterSun, uJoint: cu(mixc(pl, blk, 0.1)),
        // flags of four stones: blue slate, warm grey, buff and a rose-brown
        uSlateA: cu(mixc(mixc(blk, pl, 0.36), blu, 0.3)), uSlateB: cu(mixc(blk, pl, 0.46)), uSlateC: cu(mixc(mixc(yel, pl, 0.5), blk, 0.34)),
        uSlateD: cu(mixc(mixc(red, pl, 0.45), blk, 0.36)), uBlue: cu(blu), uInk: cu(mixc(blk, pl, 0.06)),
        uRed: cu(red), uStone: cu(C.stone), uReedA: cu(mixc(yel, pl, 0.42)), uReedB: cu(mixc(yel, pl, 0.6)), uReedC: cu(mixc(yel, blk, 0.32)),
      },
      vertexShader: SHELL_VERT, fragmentShader: shellFrag(G, shadow),
    });
    const shell = new THREE.Mesh(buildShell(C), shellMat);
    shell.name = 'shell'; shell.frustumCulled = false;
    root.add(shell);
    await ctx.yield();

    // ---- the reed curtain in the doorway
    const NREED = 200, RSEG = 18;
    const cg = new THREE.InstancedBufferGeometry();
    {
      const P = [], I = [];
      for (let j = 0; j <= RSEG; j++) P.push(-0.5, j / RSEG, 0, 0.5, j / RSEG, 0);
      for (let j = 0; j < RSEG; j++) { const a = j * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      cg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      cg.setIndex(I);
      const ia = new Float32Array(NREED * 4), cr = rng.fork('reeds');
      for (let i = 0; i < NREED; i++) {
        ia[i * 4] = DOOR.z0 + (i + 0.5) * (DOOR.z1 - DOOR.z0) / NREED; ia[i * 4 + 1] = cr(); ia[i * 4 + 2] = cr(); ia[i * 4 + 3] = DOOR.y1 - 0.6 - cr() * 0.9;
      }
      cg.setAttribute('iA', new THREE.InstancedBufferAttribute(ia, 4));
      cg.instanceCount = NREED;
    }
    const curtainMat = new THREE.ShaderMaterial({
      uniforms: { uGustT: HU.uGustT, uTime, uShake, uShow: { value: 1 }, uStraw: cu(mixc(yel, pl, 0.38)), uStrawB: cu(mixc(yel, pl, 0.58)), uRed: cu(red), uBlue: cu(blu), uDark: cu(C.woodD) },
      vertexShader: curtainVert(G), fragmentShader: CURTAIN_FRAG, side: THREE.DoubleSide,
    });
    const curtain = new THREE.Mesh(cg, curtainMat);
    curtain.name = 'reed-curtain'; curtain.frustumCulled = false;
    root.add(curtain);
    await ctx.yield();

    // ---- the animal on the sill: the wall lizard, or on one visit in three a sparrow
    const LSC = sparrow ? 1.9 : 1.3;
    const lizU = {
      uRun: { value: 0 }, uPhase: { value: 0 }, uHead: { value: 0 }, uTurn: { value: 0 }, uTime, uShadow: { value: 1 }, uLitAll: { value: 1 }, uCrouch: { value: 0 },
      uLdir: { value: new THREE.Vector3() }, uDark: cu(mixc(blk, wy, 0.25)), uPale: cu(C.sandB), uGround: cu(C.stone.clone().multiplyScalar(1.02 * SHADE)),
    };
    const lizard = new THREE.Mesh(sparrow ? buildSparrow(C) : buildLizard(C), new THREE.ShaderMaterial({
      uniforms: lizU, vertexShader: sparrow ? SPARROW_VERT : LIZARD_VERT, fragmentShader: sparrow ? SPARROW_FRAG : LIZARD_FRAG, side: THREE.DoubleSide,
    }));
    lizard.name = sparrow ? 'sparrow' : 'lizard'; lizard.frustumCulled = false; lizard.matrixAutoUpdate = false;
    root.add(lizard);
    const sillN = new THREE.Vector3(-2.3, 3.9, 0).normalize(), sillF = new THREE.Vector3(0, 0, 1);
    const jambN = new THREE.Vector3(0, 0, -1), jambF = new THREE.Vector3(-0.22, 0.97, 0).normalize();
    const upY = new THREE.Vector3(0, 1, 0), perchF = new THREE.Vector3(-0.8, 0, -0.6).normalize();
    const lizPos = new THREE.Vector3(), lzX = new THREE.Vector3(), lzS = new THREE.Vector3(LSC, LSC, LSC);
    const LIZ = { run0: 0.488, run1: 0.54, z0: -3.5, z1: 9.5, swap: 0.66 };
    const HOPS = 6, hop = { f: 0 };
    // the sparrow hops along the flat stone of the reveal (six hops while the lizard would run), then waits by the right jamb
    const lizardAt = (u, out) => {
      if (sparrow) {
        // (it waits for us well out along the reveal, beside the reeds, where the eye still sees the stone floor on the way out)
        if (u >= LIZ.swap) return out.set(PERCH[0], WIN.y0 + PERCH[1], PERCH[2]);
        const h = clamp((u - LIZ.run0) / (LIZ.run1 - LIZ.run0), 0, 1) * HOPS, k = Math.min(HOPS - 1, Math.floor(h)), f = h - k, mv = smoothstep(0.25, 0.75, f);
        hop.f = h > 0 && h < HOPS ? f : 0;
        return out.set(RX + 1.9, WIN.y0 + 0.8 * Math.sin(Math.PI * mv), lerp(-5, 6, (k + mv) / HOPS));
      }
      if (u < LIZ.swap) { const k = smoothstep(LIZ.run0, LIZ.run1, u); return out.set(RX - 1.65, 26.85, lerp(LIZ.z0, LIZ.z1, k)); }
      return out.set(RX + 5.5, 37.6, WIN.z1 - 0.02);
    };
    const placeLizard = (u) => {
      const onSill = u < LIZ.swap;
      const n = sparrow ? upY : onSill ? sillN : jambN, f = sparrow ? (onSill ? sillF : perchF) : onSill ? sillF : jambF;
      lizardAt(u, lizPos);
      lzX.crossVectors(n, f);
      lizard.matrix.makeBasis(lzX, n, f).scale(lzS).setPosition(lizPos);
      lizard.matrixWorldNeedsUpdate = true;
      if (sparrow) lizU.uLdir.value.set(0.7, 0.62, -0.3).normalize();
      else if (onSill) lizU.uLdir.value.set(0.55, 0.75, 0.35).normalize(); else lizU.uLdir.value.set(0.8, 0.5, -0.33).normalize();
      lizU.uShadow.value = onSill ? 1 : 0;
    };
    placeLizard(0);
    await ctx.yield();

    // ---- dust: bright specks in the slanting beam, thickest along its four faces and toward the wall it lights,
    // and (rare) three narrow veils sifting from the joists out over the room
    const dr = rng.fork('dust');
    const NB = Math.round(4200 * detail * clamp(vary.density ?? 1, 0.7, 1.3)), NS = rare ? Math.round(3 * 1700 * Math.max(0.7, detail)) : 0;
    const dP = new Float32Array((NB + NS) * 3), dS = new Float32Array((NB + NS) * 4);
    for (let i = 0; i < NB; i++) {
      const face = dr() < 0.45, r = dr();
      let wy = dr.range(-1, 1), wz = dr.range(-1, 1);
      if (face) { const inset = 1 - 0.07 * r * r; if (dr() < 0.5) wy = (wy < 0 ? -1 : 1) * inset; else wz = (wz < 0 ? -1 : 1) * inset; }
      const f = dr();
      dP[i * 3] = 1 - f * f * 0.78;                              // thicker toward the wall and floor, none by the window (the way out stays clear)
      dP[i * 3 + 1] = (WIN.y0 + WIN.y1) / 2 + wy * (WIN.y1 - WIN.y0) / 2; dP[i * 3 + 2] = (WIN.z0 + WIN.z1) / 2 + wz * (WIN.z1 - WIN.z0) / 2;
      dS[i * 4] = dr(); dS[i * 4 + 1] = face ? dr.range(0.028, 0.055) : dr.range(0.03, 0.085); dS[i * 4 + 2] = dr.range(0.12, 0.4); dS[i * 4 + 3] = face ? 0.3 : 0;
      if ((i & 255) === 0) await ctx.yield();
    }
    // three joists out over the room, each shedding one narrow veil (x of the joist, z from, z to)
    const SIFT = [[20.83, -12, -7], [12.5, 12, 17], [4.17, -2.5, 2.5]];
    for (let i = 0; i < NS; i++) {
      const k = NB + i, cset = SIFT[i % 3];
      dP[k * 3] = cset[0] + dr.range(-0.2, 0.2); dP[k * 3 + 1] = RH - 2.4; dP[k * 3 + 2] = dr.range(cset[1], cset[2]);
      dS[k * 4] = dr(); dS[k * 4 + 1] = dr.range(0.05, 0.11); dS[k * 4 + 2] = dr(); dS[k * 4 + 3] = 1;
      if ((i & 255) === 0) await ctx.yield();
    }
    const dg = new THREE.BufferGeometry();
    dg.setAttribute('position', new THREE.BufferAttribute(dP, 3));
    dg.setAttribute('aS', new THREE.BufferAttribute(dS, 4));
    const dustU = { ...sunU, uTime, uPx: { value: 450 }, uFall: { value: 0 }, uFallA: { value: 0 }, uSunCol: HU.uPlasterSun, uShadeCol: cu(pl), uSiftCol: cu(mixc(mixc(pl, yel, 0.35), blk, 0.42)) };
    const dust = new THREE.Points(dg, new THREE.ShaderMaterial({ uniforms: dustU, vertexShader: dustVert(G), fragmentShader: DUST_FRAG, transparent: true, depthWrite: false }));
    dust.name = 'dust'; dust.frustumCulled = false; dust.renderOrder = 4;
    root.add(dust);
    await ctx.yield();

    // ---- the shaft of light from the window
    const bgm = new THREE.BoxGeometry(2 * RX, RH, 2 * RZ);
    bgm.translate(0, RH / 2, 0);
    const beamU = { uSunDir: HU.uSunDir, uWinIn: HU.uWinIn, uWinHalf: HU.uWinHalf, uRoot: { value: root.position }, uBeamK: { value: 0 },
      uBeamCol: cu(night ? new THREE.Color(0.8, 0.86, 0.95) : new THREE.Color(1.0, 0.9, 0.6)) };
    const BEAM_K = night ? 0.24 : 0.36;
    const beam = new THREE.Mesh(bgm, new THREE.ShaderMaterial({ uniforms: beamU, vertexShader: BEAM_VERT, fragmentShader: BEAM_FRAG, side: THREE.BackSide,
      transparent: true, depthWrite: false, depthTest: false }));
    beam.name = 'sun-shaft'; beam.frustumCulled = false; beam.renderOrder = 2;
    root.add(beam);
    await ctx.yield();

    // ---- outside the window: plain distance
    const vg = new THREE.PlaneGeometry(2400, 1800);
    vg.rotateY(-Math.PI / 2); vg.translate(RX + 330, 40, 0);
    const viewU = { uTime, uHaze: cu(haze), uSea: cu(mixc(haze, blu, 0.48)), uRim: cu(mixc(haze, ps, 0.42)), uGlint: cu(ps), uHazeB: cu(mixc(haze, ps, 0.3)) };
    const view = new THREE.Mesh(vg, new THREE.ShaderMaterial({ uniforms: viewU, vertexShader: VIEW_VERT, fragmentShader: viewFrag(G) }));
    view.name = 'sea-haze'; view.frustumCulled = false;
    scene.add(view);
    await ctx.yield();

    // ---- gaze
    const kissAt = A.kiss.position.clone();
    const nest = A.heroNest[0].clone().add(A.heroNest[1]).multiplyScalar(0.5);
    const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpC = new THREE.Vector3(), tmpD = new THREE.Vector3(), tmpE = new THREE.Vector3(), tmpF = new THREE.Vector3();
    const seat = A.portalSeat.position;
    const tmpG = new THREE.Vector3(), tmpH = new THREE.Vector3(), BEDPOI = new THREE.Vector3(BED.x - 6, 4, BED.z - 4), HOLD0 = A.kiss.u0, HOLD1 = A.kiss.u1;
    const sunny = look !== 'noon';
    const meetA = A.pairs[0].meet, meetB = A.pairs[1].meet, ringC = new THREE.Vector3(10.5, 48, 7);
    const pois = [
      // the opening: the red crag on the axis and the first flock over it
      { at: [-36, 25, 29.5], from: 0.03, to: 0.14, weight: 0.4, fade: 0.355 },
      // THE EYE STANDS BACK (0.11-0.31). It no longer turns to the wall beside it: it looks across the room, so that the
      // crags are a rippling band along the far walls with whole lily clumps over them, and the subject is a pair of
      // swallows meeting beak to beak 28 m off: first over the mats against the bare plaster of the north wall
      // (hold 0.14-0.18), then low among the store jars and the loom against the far end of the west wall (0.232-0.272)
      { at: () => tmpB.copy(meetA).setY(meetA.y - 7), from: 0.1, to: 0.215, weight: 0.86, fade: 0.33 },
      // (the eye goes on to the store jars and the north wall before it passes under the pair)
      { at: (t, u) => tmpB.set(meetB.x + 3.5, meetB.y - 4.5, meetB.z - 2).lerp(tmpH.set(-16, 15, -42.5), smoothstep(0.258, 0.3, u)), from: 0.185, to: 0.32, weight: 0.82, fade: 0.26 },
      // the sun shape on the north wall as we come east, then the seventh pair spiralling off the plaster at its edge
      { at: (t, u) => {
        if (sunny) hero.sunShapeAt(tmpD); else tmpD.copy(nest);
        tmpD.x = clamp(tmpD.x, -4, 22); tmpD.y = clamp(tmpD.y, 12, 20);
        // (the pair is never looked at from steeply below: the room stays upright)
        hero.pairAt(u, tmpE); tmpE.y = Math.min(tmpE.y, path.pointAt(u, tmpA).y + 9);
        return tmpD.lerp(tmpE, smoothstep(sunny ? 0.378 : 0.35, sunny ? 0.408 : 0.38, u));
      }, from: 0.295, to: 0.425, weight: sunny ? 0.72 : 0.6, fade: 0.39 },
      // THE CEILING (0.40-0.475): on the turn the eye looks up at the reed mats and the round joists, and at the fifth
      // flock wheeling under them as one ring
      { at: ringC, from: 0.398, to: 0.475, weight: 0.92, fade: 0.3 },
      // the window wall, whole: the stone frame with the portal in it, the animal on the sill, the painted piers either side
      // (the aim drifts north as we pass, so that the door post stays a thin strip at the edge)
      { at: (t, u) => { lizardAt(u, tmpC); return tmpC.set(RX + 2, 31.5, -6.5 + 0.2 * (tmpC.z - 3) - 15 * smoothstep(0.515, 0.56, u)); }, from: 0.45, to: 0.578, weight: rare ? 0.12 : 0.9 },
      // over the room: the bed, the loom, the mats and the painted floor seen from the height of the lily heads
      // (it takes hold on the corner, so that the eye is already turned across the room when the west leg begins, with
      // the fourth flock strung along the west wall above the furniture)
      { at: (t, u) => tmpG.set(-11, 16, -5.5).lerp(BEDPOI, smoothstep(0.618, 0.672, u)), from: 0.555, to: 0.665, weight: 0.55, fade: 0.46 },
      // THE LEAVING (0.612-0.78): the eye follows the ribbon as it comes down the west wall and crosses the room over
      // the loom and the bed, high enough to see the ghosts it leaves on the plaster
      { at: (t, u) => { hero.ribbonAt(u, 110, tmpG); const k = smoothstep(0.69, 0.75, u); tmpG.lerp(tmpH.set(4, 30, 3), k); tmpG.y += 2.5 * (1 - k); return tmpG; }, from: 0.612, to: 0.78, weight: 0.8, fade: 0.25 },
      // the kiss, and as the pair parts the eye slides on to the window: the target is never behind us
      // (through the hold the pair is carried along ahead of us: the eye stays on it)
      { at: (t, u) => { if (u > HOLD0) hero.pairAt(Math.min(u, HOLD1), tmpF); else tmpF.copy(kissAt); return tmpF.lerp(seat, smoothstep(0.812, 0.836, u)); }, from: 0.69, to: 0.9, weight: 0.7 },
    ];
    // on the rare visit the gaze goes to the middle of the room, where the whole flock wheels behind the sifting dust
    // (low enough that the bed and the floor lie under the wheel)
    if (rare) pois.push({ at: [-12, 32, 2], from: 0.43, to: 0.6, weight: 0.86, fade: 0.2 });
    const PK = A.pace;
    const pace = (u) => {
      let i = 0;
      while (i < PK.length - 2 && u > PK[i + 1][0]) i++;
      return lerp(PK[i][1], PK[i + 1][1], smoothstep(PK[i][0], PK[i + 1][0], u));
    };

    const buf = new THREE.Vector2(), camP = new THREE.Vector3();
    const tri = (x) => 1 - Math.abs(((x % 2) + 2) % 2 - 1);

    return {
      scene, path, duration: DUR, pace,
      camera: { fov: 60, near: 0.3, far: 3000, lookAhead: 14, sway: 0.5, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: palette[6], glow: 0.25, revealDistance: 230 },
      post: { flat: 1, exposure: 1, bloom: { strength: 0, radius: 0.1, threshold: 1 }, grade: { saturation: 1, contrast: 1, vignette: 0, grain: 0, aberration: 0 } },
      ride: 'none', style: 'none', companion: 'none',
      update(dt, time, camera, u) {
        uTime.value = time;
        hero.setProgress(u);
        hero.update(dt, time, camera);
        ctx.renderer.getDrawingBufferSize(buf);
        dustU.uPx.value = buf.y;
        // the open light of the room sinks a little, so the cast shadows lengthen and draw back
        uKey.value.set(0.55, 0.56 - 0.07 * tri(time / 40), -0.62).normalize();
        // the shaft of sun is gone before the eye turns to the window: the way out is seen in its own colours
        // (and thin while the eye is inside it or looks through it, 0.36-0.5: there it is dust and a faint body, no veil)
        beamU.uBeamK.value = BEAM_K * (1 - 0.6 * smoothstep(0.355, 0.39, u) * (1 - smoothstep(0.46, 0.5, u))) * (1 - smoothstep(0.63, 0.69, u));
        camP.setFromMatrixPosition(camera.matrixWorld);
        curtainMat.uniforms.uShow.value = camP.x < RX + 1.5 ? 1 : 0;
        // the lizard: basks on the sill, lifts its head as we come, runs, and waits on the right jamb as we leave
        placeLizard(u);
        const alert = u < LIZ.swap ? smoothstep(0.455, 0.485, u) : smoothstep(0.885, 0.93, u);
        if (sparrow) {
          // head held high as we come, quick looks to either side, a dip before each hop
          const sl = Math.sin(time * 1.15 + 0.6 * Math.sin(time * 0.37));
          lizU.uHead.value = 0.08 + 0.34 * alert + 0.1 * Math.sin(time * 0.8);
          lizU.uTurn.value = 0.75 * Math.sign(sl) * Math.pow(Math.abs(sl), 0.22) * (1 - 0.5 * alert) - (u < LIZ.swap ? 0.5 : 0.15) * alert;
          lizU.uCrouch.value = smoothstep(0.0, 0.18, hop.f) * (1 - smoothstep(0.22, 0.34, hop.f));
        } else {
          const run = u < LIZ.swap ? smoothstep(LIZ.run0, LIZ.run0 + 0.006, u) * (1 - smoothstep(LIZ.run1 - 0.008, LIZ.run1, u)) : 0;
          lizU.uRun.value = run;
          lizU.uPhase.value = (lizPos.z - LIZ.z0) * 7.5;   // the gait is a pure function of where it is
          lizU.uHead.value = (0.12 + 0.05 * Math.sin(time * 0.7)) + 0.5 * alert * (1 - 0.6 * run);
          lizU.uTurn.value = u < LIZ.swap ? 0.35 * smoothstep(LIZ.run1, LIZ.run1 + 0.02, u) * Math.sin(time * 1.3) - 0.25 * alert * (1 - run) : -0.3 * alert + 0.1 * Math.sin(time * 0.9);
        }
        // the rare tremor: the room shudders, dust sifts from the joists (the hero wheels the flock and runs the crack)
        if (rare) {
          const env = smoothstep(0.44, 0.452, u) * (1 - smoothstep(0.468, 0.5, u));
          uShake.value = env;
          root.position.set(Math.sin(time * 31) * 0.16 * env, Math.sin(time * 27 + 1) * 0.1 * env, Math.sin(time * 23 + 2) * 0.16 * env);
          dustU.uFall.value = Math.max(0, u - 0.443) * DUR;
          dustU.uFallA.value = smoothstep(0.443, 0.45, u) * (1 - smoothstep(0.6, 0.64, u));
        }
      },
      dispose() { hero.dispose(); },
    };
  },
};
