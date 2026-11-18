// THE FIELD OF DOORS
// An endless twilight plain of ten thousand free-standing doors, each opening onto a different sky, and at the
// end of the river of light one door the size of a mountain, ajar. The exit portal stands in its 30 m gap.
//
// Layout (world space): the Great Door stands at z = 0 facing +Z, shifted so that its slot is centred on x = 0.
// The camera enters at z ~ 1300 among head-high doors and flies toward -Z.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero } from '../parts/field-of-doors.js';

const TAU = Math.PI * 2;
const PALETTE = ['#1a1440', '#5a3f8a', '#e88a6a', '#ffd9a0', '#3a3a4a', '#14141c', '#ffffff'];

// The eight worlds beyond: [name, light colour, drifting particle preset]
const LOOKS = [
  ['noon', '#dcebff'], ['sunset', '#ff8a3c'], ['aurora', '#4dffa0'], ['sea', '#3fd8e8'],
  ['snow', '#eef4ff'], ['desert', '#ffcf78'], ['garden', '#ff9ac0'], ['void', '#9a7aff'],
];
const LOOK = { noon: 0, sunset: 1, aurora: 2, sea: 3, snow: 4, desert: 5, garden: 6, void: 7 };

// material ids carried per vertex (aP.x); aP.y = shade, aP.z = hinge x (0 = fixed, |hx| > 50 = sliding panel)
const M = { FRAME: 0, LEAF: 1, BEYOND: 2, GLOW: 3, METAL: 4, PAPER: 5, PALE: 6, CARD: 7, DARK: 8 };

// ---------------------------------------------------------------- tiny geometry builder
function GB() {
  const P = [], N = [], A = [];
  const v = (p, n, m, sh, hx) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); A.push(m, sh, hx); };
  const g = {
    get triangles() { return P.length / 9; },
    quad(a, b, c, d, n, m = 0, sh = 1, hx = 0) { v(a, n, m, sh, hx); v(b, n, m, sh, hx); v(c, n, m, sh, hx); v(a, n, m, sh, hx); v(c, n, m, sh, hx); v(d, n, m, sh, hx); },
    tri(a, b, c, n, m = 0, sh = 1, hx = 0) { v(a, n, m, sh, hx); v(b, n, m, sh, hx); v(c, n, m, sh, hx); },
    // axis-aligned box from min to max corner; skip: letters of faces to leave out (f b l r t d)
    box(x0, y0, z0, x1, y1, z1, m = 0, sh = 1, hx = 0, skip = '') {
      const q = g.quad, s = (c) => skip.indexOf(c) < 0;
      if (s('f')) q([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [0, 0, 1], m, sh, hx);
      if (s('b')) q([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [0, 0, -1], m, sh, hx);
      if (s('l')) q([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [-1, 0, 0], m, sh * 0.85, hx);
      if (s('r')) q([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [1, 0, 0], m, sh * 0.85, hx);
      if (s('t')) q([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [0, 1, 0], m, sh * 1.1, hx);
      if (s('d')) q([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [0, -1, 0], m, sh * 0.7, hx);
    },
    // ring segment prism in the XY plane around (cx, cy), from angle a0 to a1; r0 = 0 gives a solid disc
    arc(cx, cy, r0, r1, z0, z1, a0, a1, seg, m = 0, sh = 1, hx = 0, faces = 'fboi') {
      for (let i = 0; i < seg; i++) {
        const a = a0 + (a1 - a0) * (i / seg), b = a0 + (a1 - a0) * ((i + 1) / seg), am = (a + b) / 2;
        const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b), cm = Math.cos(am), sm = Math.sin(am);
        const i0 = [cx + ca * r0, cy + sa * r0], i1 = [cx + cb * r0, cy + sb * r0], o0 = [cx + ca * r1, cy + sa * r1], o1 = [cx + cb * r1, cy + sb * r1];
        if (faces.indexOf('f') >= 0) { if (r0 > 0) g.quad([...i0, z1], [...o0, z1], [...o1, z1], [...i1, z1], [0, 0, 1], m, sh, hx); else g.tri([cx, cy, z1], [...o0, z1], [...o1, z1], [0, 0, 1], m, sh, hx); }
        if (faces.indexOf('b') >= 0) { if (r0 > 0) g.quad([...i1, z0], [...o1, z0], [...o0, z0], [...i0, z0], [0, 0, -1], m, sh, hx); else g.tri([cx, cy, z0], [...o1, z0], [...o0, z0], [0, 0, -1], m, sh, hx); }
        if (faces.indexOf('o') >= 0) g.quad([...o0, z0], [...o1, z0], [...o1, z1], [...o0, z1], [cm, sm, 0], m, sh * 0.9, hx);
        if (faces.indexOf('i') >= 0 && r0 > 0) g.quad([...i1, z0], [...i0, z0], [...i0, z1], [...i1, z1], [-cm, -sm, 0], m, sh * 0.8, hx);
      }
    },
    // append another builder's triangles through a 4x4 matrix
    append(o, mat) {
      const d = o.data(), p = new THREE.Vector3(), n = new THREE.Vector3(), nm = new THREE.Matrix3().getNormalMatrix(mat);
      for (let i = 0; i < d.P.length; i += 3) {
        p.set(d.P[i], d.P[i + 1], d.P[i + 2]).applyMatrix4(mat); n.set(d.N[i], d.N[i + 1], d.N[i + 2]).applyMatrix3(nm).normalize();
        P.push(p.x, p.y, p.z); N.push(n.x, n.y, n.z); A.push(d.A[i], d.A[i + 1], 0);
      }
    },
    data() { return { P, N, A }; },
    // doorway quads give up their normal for their place in the opening (x -1..1, y 0..1), which the shader uses
    bakeOpening() {
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      for (let i = 0; i < A.length; i += 3) if (A[i] === M.BEYOND) { x0 = Math.min(x0, P[i]); x1 = Math.max(x1, P[i]); y0 = Math.min(y0, P[i + 1]); y1 = Math.max(y1, P[i + 1]); }
      for (let i = 0; i < A.length; i += 3) if (A[i] === M.BEYOND) { N[i] = ((P[i] - x0) / (x1 - x0)) * 2 - 1; N[i + 1] = (P[i + 1] - y0) / (y1 - y0); N[i + 2] = 0; }
      return g;
    },
    build() {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
      geo.setAttribute('aP', new THREE.Float32BufferAttribute(A, 3));
      geo.computeBoundingSphere();
      return geo;
    },
  };
  return g;
}

// ---------------------------------------------------------------- the eight door styles (human scale, metres)
// Each returns { g, ow, oh, cy }: opening width / height (for the light decal) and the doorway centre height.
// Local space: x across, y up from the threshold, +z = the front (the side the leaf swings to).
function panels(g, x0, x1, y0, y1, cols, rows, zt, hx, sh = 1.15) {
  const gx = 0.07, gy = 0.09, w = (x1 - x0 - gx * (cols + 1)) / cols, h = (y1 - y0 - gy * (rows + 1)) / rows;
  for (let c = 0; c < cols; c++) for (let r = 0; r < rows; r++) {
    const px = x0 + gx + c * (w + gx), py = y0 + gy + r * (h + gy);
    g.box(px, py, zt, px + w, py + h, zt + 0.014, M.LEAF, sh, hx, 'b');
    g.box(px, py, -zt - 0.014, px + w, py + h, -zt, M.LEAF, sh, hx, 'f');
  }
}
const STYLES = [
  function panelled() {
    const g = GB(), w = 0.45, h = 2.05;
    g.box(-w - 0.1, 0, -0.09, -w, h + 0.1, 0.09, M.FRAME, 1, 0, 'd'); g.box(w, 0, -0.09, w + 0.1, h + 0.1, 0.09, M.FRAME, 1, 0, 'd');
    g.box(-w, h, -0.09, w, h + 0.1, 0.09, M.FRAME, 1, 0, 'lr'); g.box(-w - 0.17, h + 0.1, -0.13, w + 0.17, h + 0.19, 0.14, M.FRAME, 1.2);
    g.box(-w - 0.1, -0.03, -0.14, w + 0.1, 0.035, 0.16, M.FRAME, 0.7, 0, 'd');
    g.box(-w, 0.035, -0.025, w, h, 0.025, M.LEAF, 0.85, -w);
    panels(g, -w, w, 0.06, h, 2, 3, 0.025, -w);
    g.box(w - 0.11, 0.98, -0.07, w - 0.05, 1.04, 0.07, M.METAL, 1.3, -w);
    g.quad([-w, 0.035, -0.03], [w, 0.035, -0.03], [w, h, -0.03], [-w, h, -0.03], [0, 0, 1], M.BEYOND);
    return { g, ow: 0.9, oh: h, cy: h / 2 };
  },
  function arched() {
    const g = GB(), w = 0.55, sp = 1.5, d = 0.15;
    g.box(-w - 0.22, 0, -d, -w, sp, d, M.FRAME, 1, 0, 'dt'); g.box(w, 0, -d, w + 0.22, sp, d, M.FRAME, 1, 0, 'dt');
    g.arc(0, sp, w, w + 0.24, -d, d, 0, Math.PI, 8, M.FRAME, 1.05);
    g.box(-0.09, sp + w + 0.2, -d - 0.03, 0.09, sp + w + 0.34, d + 0.03, M.FRAME, 1.3);
    g.box(-w - 0.26, -0.03, -d - 0.05, w + 0.26, 0.04, d + 0.07, M.FRAME, 0.7, 0, 'd');
    g.box(-w, 0.04, -0.03, w, sp, 0.03, M.LEAF, 0.9, -w, 't'); g.arc(0, sp, 0, w, -0.03, 0.03, 0, Math.PI, 8, M.LEAF, 0.9, -w, 'fb');
    for (const y of [0.4, 1.25]) g.box(-w, y, 0.03, w * 0.75, y + 0.07, 0.045, M.METAL, 0.8, -w, 'b');
    g.arc(w - 0.16, 0.95, 0.045, 0.075, 0.03, 0.06, 0, TAU, 6, M.METAL, 1.3, -w, 'fo');
    g.quad([-w, 0.04, -0.04], [w, 0.04, -0.04], [w, sp, -0.04], [-w, sp, -0.04], [0, 0, 1], M.BEYOND);
    g.arc(0, sp, 0, w, -0.04, -0.04, 0, Math.PI, 8, M.BEYOND, 1, 0, 'f');
    return { g, ow: 1.1, oh: sp + w, cy: 1.0 };
  },
  function shoji() {
    const g = GB(), w = 0.9, h = 1.9;
    g.box(-w - 0.07, 0, -0.07, -w, h + 0.02, 0.07, M.FRAME, 0.7, 0, 'd'); g.box(w, 0, -0.07, w + 0.07, h + 0.02, 0.07, M.FRAME, 0.7, 0, 'd');
    g.box(-w - 0.16, h, -0.09, w + 0.16, h + 0.11, 0.09, M.FRAME, 0.8); g.box(-w - 0.07, -0.02, -0.09, w + 0.07, 0.04, 0.09, M.FRAME, 0.6, 0, 'd');
    for (const [x0, z, hx] of [[-w, 0.03, 100 + w * 0.94], [0, -0.03, 0]]) {
      g.box(x0, 0.04, z - 0.008, x0 + w, h, z + 0.008, M.PAPER, 1, hx, 'tdlr');
      for (let i = 0; i <= 3; i++) g.box(x0 + (w - 0.03) * (i / 3), 0.04, z - 0.02, x0 + (w - 0.03) * (i / 3) + 0.03, h, z + 0.02, M.FRAME, 0.55, hx, 'td');
      for (let j = 0; j <= 4; j++) g.box(x0, 0.04 + (h - 0.08) * (j / 4), z - 0.018, x0 + w, 0.08 + (h - 0.08) * (j / 4), z + 0.018, M.FRAME, 0.55, hx, 'lr');
    }
    g.quad([-w, 0.04, -0.06], [w, 0.04, -0.06], [w, h, -0.06], [-w, h, -0.06], [0, 0, 1], M.BEYOND);
    return { g, ow: 0.9, oh: h, cy: h / 2 };
  },
  function vault() {
    const g = GB(), r = 0.95, cy = 1.25, d = 0.2;
    g.arc(0, cy, r, r + 0.3, -d, d, 0, TAU, 12, M.FRAME, 0.95);
    g.box(-0.9, 0, -d - 0.05, 0.9, 0.16, d + 0.05, M.FRAME, 0.7, 0, 'd');
    const hx = -r - 0.1;
    for (let k = 0; k < 16; k++) { const a = (k + 0.5) * TAU / 16, x = Math.cos(a) * (r + 0.15), y = cy + Math.sin(a) * (r + 0.15); g.box(x - 0.04, y - 0.04, d, x + 0.04, y + 0.04, d + 0.035, M.METAL, 1.25, 0, 'b'); }   // rivets round the collar
    g.arc(0, cy, r - 0.2, r - 0.1, 0.14, 0.17, 0, TAU, 12, M.METAL, 0.9, hx, 'fo');                                   // a raised rim and four portholes on the leaf
    for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.785, x = Math.cos(a) * 0.6, y = cy + Math.sin(a) * 0.6; g.arc(x, y, 0.07, 0.12, 0.14, 0.18, 0, TAU, 6, M.METAL, 1.2, hx, 'fo'); g.arc(x, y, 0, 0.07, 0.15, 0.15, 0, TAU, 6, M.GLOW, 0.35, hx, 'f'); }
    g.arc(0, cy, 0, r - 0.02, -0.02, 0.14, 0, TAU, 12, M.LEAF, 0.9, hx, 'fbo');
    g.arc(0, cy, 0.24, 0.31, 0.2, 0.25, 0, TAU, 6, M.METAL, 1.2, hx, 'fbo');
    for (let k = 0; k < 3; k++) { const a = k * Math.PI / 3, c = Math.cos(a) * 0.3, s = Math.sin(a) * 0.3; g.quad([-c - s * 0.1, cy - s + c * 0.1, 0.23], [c - s * 0.1, cy + s + c * 0.1, 0.23], [c + s * 0.1, cy + s - c * 0.1, 0.23], [-c + s * 0.1, cy - s - c * 0.1, 0.23], [0, 0, 1], M.METAL, 1.1, hx); }
    g.box(-0.05, cy - 0.05, 0.14, 0.05, cy + 0.05, 0.23, M.METAL, 0.9, hx, 'bf');
    g.box(hx - 0.06, cy - 0.5, 0, hx + 0.12, cy + 0.5, 0.2, M.METAL, 0.8, hx, 'd');
    g.arc(0, cy, 0, r, -0.06, -0.06, 0, TAU, 12, M.BEYOND, 1, 0, 'f');
    return { g, ow: 1.7, oh: cy + r, cy };
  },
  function gardenGate() {
    const g = GB(), w = 0.62, sp = 1.65;
    g.box(-w - 0.09, 0, -0.045, -w, sp, 0.045, M.PALE, 0.9, 0, 'dt'); g.box(w, 0, -0.045, w + 0.09, sp, 0.045, M.PALE, 0.9, 0, 'dt');
    g.arc(0, sp, w, w + 0.09, -0.045, 0.045, 0, Math.PI, 8, M.PALE, 0.95);
    g.arc(0, sp, w + 0.2, w + 0.25, -0.03, 0.03, 0.15, Math.PI - 0.15, 7, M.PALE, 0.8);
    for (const s of [-1, 1]) {
      const hx = s * w;
      for (let i = 0; i < 4; i++) { const x = s * (w - 0.1 - i * 0.145), top = 0.95 + 0.12 * Math.sin((i / 3) * Math.PI * 0.5); g.box(x - 0.045, 0.1, -0.015, x + 0.045, top, 0.015, M.PALE, 1, hx, 'd'); }
      g.box(Math.min(0, hx), 0.25, 0.015, Math.max(0, hx), 0.32, 0.035, M.PALE, 0.85, hx, 'b'); g.box(Math.min(0, hx), 0.72, 0.015, Math.max(0, hx), 0.79, 0.035, M.PALE, 0.85, hx, 'b');
    }
    g.quad([-w, 0, -0.03], [w, 0, -0.03], [w, sp, -0.03], [-w, sp, -0.03], [0, 0, 1], M.BEYOND);
    g.arc(0, sp, 0, w, -0.03, -0.03, 0, Math.PI, 8, M.BEYOND, 1, 0, 'f');
    return { g, ow: 1.24, oh: sp + w, cy: 1.1 };
  },
  function hatch() {
    const g = GB(), w = 0.65, y0 = 0.14, y1 = 1.44, d = 0.12, t = 0.14;
    g.box(-w - t, 0, -d, -w, y1 + t, d, M.FRAME, 0.85, 0, 'd'); g.box(w, 0, -d, w + t, y1 + t, d, M.FRAME, 0.85, 0, 'd');
    g.box(-w, y1, -d, w, y1 + t, d, M.FRAME, 0.95, 0, 'lr'); g.box(-w, 0, -d, w, y0, d, M.FRAME, 0.75, 0, 'lrd');
    for (const x of [-w - t * 0.5, w + t * 0.5]) for (const y of [0.1, y1 + t * 0.5]) g.box(x - 0.035, y - 0.035, d, x + 0.035, y + 0.035, d + 0.03, M.METAL, 1.2, 0, 'b');
    g.box(-w, y0, 0, w, y1, 0.07, M.LEAF, 0.9, -w);
    g.box(-w, (y0 + y1) / 2 - 0.05, 0.07, w, (y0 + y1) / 2 + 0.05, 0.1, M.METAL, 0.8, -w, 'b'); g.box(-0.05, y0, 0.07, 0.05, y1, 0.1, M.METAL, 0.8, -w, 'b');
    g.arc(0, (y0 + y1) / 2, 0.15, 0.21, 0.12, 0.16, 0, TAU, 6, M.METAL, 1.3, -w, 'fo');
    g.quad([-w, y0, -0.03], [w, y0, -0.03], [w, y1, -0.03], [-w, y1, -0.03], [0, 0, 1], M.BEYOND);
    return { g, ow: 1.3, oh: 1.44, cy: 0.79 };
  },
  function doubleDoor() {
    const g = GB(), w = 0.8, h = 2.2, tr = 0.38;
    g.box(-w - 0.11, 0, -0.1, -w, h + tr + 0.1, 0.1, M.FRAME, 1, 0, 'd'); g.box(w, 0, -0.1, w + 0.11, h + tr + 0.1, 0.1, M.FRAME, 1, 0, 'd');
    g.box(-w, h + tr, -0.1, w, h + tr + 0.1, 0.1, M.FRAME, 1, 0, 'lr'); g.box(-w, h, -0.07, w, h + 0.06, 0.07, M.FRAME, 0.9, 0, 'lr');
    g.box(-w - 0.2, h + tr + 0.1, -0.15, w + 0.2, h + tr + 0.2, 0.16, M.FRAME, 1.2); g.box(-w - 0.11, -0.03, -0.15, w + 0.11, 0.035, 0.17, M.FRAME, 0.7, 0, 'd');
    for (const s of [-1, 1]) {
      const hx = s * w, x0 = Math.min(0, hx), x1 = Math.max(0, hx);
      g.box(x0, 0.035, -0.025, x1, h, 0.025, M.LEAF, 0.85, hx);
      panels(g, x0, x1, 0.06, h, 1, 3, 0.025, hx);
      g.box(s * 0.06 - 0.02, 1.0, -0.07, s * 0.06 + 0.02, 1.16, 0.07, M.METAL, 1.3, hx);
    }
    g.quad([-w, 0.035, -0.035], [w, 0.035, -0.035], [w, h + tr, -0.035], [-w, h + tr, -0.035], [0, 0, 1], M.BEYOND);
    return { g, ow: 1.6, oh: h + tr, cy: 1.2 };
  },
  function pediment() {
    const g = GB(), w = 0.5, h = 2.2, d = 0.13;
    for (const s of [-1, 1]) {
      g.box(s > 0 ? w : -w - 0.2, 0.12, -d, s > 0 ? w + 0.2 : -w, h, d, M.PALE, 0.8, 0, 'dt');
      g.box(s > 0 ? w - 0.02 : -w - 0.25, 0, -d - 0.04, s > 0 ? w + 0.25 : -w + 0.02, 0.12, d + 0.04, M.PALE, 0.7, 0, 'd');
      g.box(s > 0 ? w - 0.02 : -w - 0.24, h - 0.1, -d - 0.03, s > 0 ? w + 0.24 : -w + 0.02, h, d + 0.03, M.PALE, 0.9, 0, 'd');
    }
    g.box(-w - 0.28, h, -d - 0.04, w + 0.28, h + 0.22, d + 0.04, M.PALE, 0.85);
    const a = -w - 0.34, b = w + 0.34, y = h + 0.22, top = h + 0.62, zf = d + 0.06, zb = -d - 0.06;
    g.tri([a, y, zf], [b, y, zf], [0, top, zf], [0, 0, 1], M.PALE, 0.75); g.tri([b, y, zb], [a, y, zb], [0, top, zb], [0, 0, -1], M.PALE, 0.75);
    g.quad([a, y, zb], [a, y, zf], [0, top, zf], [0, top, zb], [-0.5, 0.86, 0], M.PALE, 1); g.quad([b, y, zf], [b, y, zb], [0, top, zb], [0, top, zf], [0.5, 0.86, 0], M.PALE, 1);
    g.box(-w, 0.03, -0.03, w, h, 0.03, M.LEAF, 0.85, -w);
    panels(g, -w, w, 0.06, h, 2, 2, 0.03, -w);
    g.arc(0, 1.25, 0.05, 0.09, 0.045, 0.075, 0, TAU, 6, M.METAL, 1.3, -w, 'fo');
    g.quad([-w, 0.03, -0.04], [w, 0.03, -0.04], [w, h, -0.04], [-w, h, -0.04], [0, 0, 1], M.BEYOND);
    return { g, ow: 1.0, oh: h, cy: h / 2 };
  },
];
const ARCHED = [0, 1, 0, 1, 1, 0, 0, 0];   // which far shape stands in for each style

// mid-distance stand-ins: unit opening (1 wide, 1 tall), scaled per instance to the style's proportions
function farRect() {
  const g = GB(), w = 0.5, j = 0.11;
  g.box(-w - j, 0, -0.08, -w, 1.05, 0.08, M.FRAME, 1, 0, 'dt'); g.box(w, 0, -0.08, w + j, 1.05, 0.08, M.FRAME, 1, 0, 'dt');
  g.box(-w - j - 0.04, 1, -0.1, w + j + 0.04, 1.09, 0.1, M.FRAME, 1.15);
  g.box(-w, 0.01, -0.02, w, 1, 0.02, M.LEAF, 1, -w, 'tdl');
  g.quad([-w, 0, -0.03], [w, 0, -0.03], [w, 1, -0.03], [-w, 1, -0.03], [0, 0, 1], M.BEYOND);
  return g;
}
function farArch() {
  const g = GB(), w = 0.5, sp = 0.62, j = 0.13;
  g.box(-w - j, 0, -0.08, -w, sp, 0.08, M.FRAME, 1, 0, 'dt'); g.box(w, 0, -0.08, w + j, sp, 0.08, M.FRAME, 1, 0, 'dt');
  g.arc(0, sp, w, w + j, -0.08, 0.08, 0, Math.PI, 5, M.FRAME, 1.05, 0, 'fbo');
  g.box(-w, 0.01, -0.02, w, sp, 0.02, M.LEAF, 1, -w, 'tdlr'); g.arc(0, sp, 0, w, -0.02, 0.02, 0, Math.PI, 5, M.LEAF, 1, -w, 'fb');
  g.quad([-w, 0, -0.03], [w, 0, -0.03], [w, sp, -0.03], [-w, sp, -0.03], [0, 0, 1], M.BEYOND);
  g.arc(0, sp, 0, w, -0.03, -0.03, 0, Math.PI, 5, M.BEYOND, 1, 0, 'f');
  return g;
}
// far cards: one quad for frame and doorway (told apart in the fragment shader) and one for the leaf
function farCard() {
  const g = GB(), w = 0.5, j = 0.12;
  g.quad([-w - j, 0, 0], [w + j, 0, 0], [w + j, 1.08, 0], [-w - j, 1.08, 0], [0, 0, 1], M.CARD);
  g.quad([-w, 0, 0.01], [w, 0, 0.01], [w, 1, 0.01], [-w, 1, 0.01], [0, 0, 1], M.LEAF, 1, -w);
  return g;
}

// ---------------------------------------------------------------- shaders
const GLSL_COMMON = /* glsl */`
  float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
  float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
    return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
`;
// swing angle of a door (radians): shared by the door mesh and its light on the ground
const GLSL_SWING = /* glsl */`
  uniform float uTime;
  float swingOf(vec4 I){ float sd = abs(I.w);
    return clamp(I.z + (0.2 + 0.55 * fract(sd * 3.7)) * sin(uTime * (0.25 + 0.55 * fract(sd * 7.13)) + I.y), 0.04, 2.3); }
`;
// the worlds beyond the doors: a tiny procedural landscape per look, drawn from the view ray in door space
const GLSL_BEYOND = /* glsl */`
  // d = view ray in door space, op = place in the opening (x -1..1, y 0..1). The picture is anchored to the opening
  // (so every doorway holds a horizon, whatever the angle) and slides with the ray for parallax.
  vec3 beyond(float look, vec3 d, vec2 op, float sd, float t){
    float er = d.y / max(0.12, length(d.xz)), ar = d.x / max(0.12, -d.z);
    float el = 0.3 * er / (1. + abs(er)) + (op.y - 0.4) * 0.85;
    float a0 = 0.6 * ar / (1. + 0.5 * abs(ar)) + op.x * 0.35, az = a0 + sd * 9.;
    vec3 c;
    if (look < 0.5) {            // noon meadow
      float h = el - 0.06 * sin(az * 2.3) - 0.035 * sin(az * 5.1 + 1.7);
      vec3 sky = mix(vec3(0.72, 0.87, 1.0), vec3(0.07, 0.25, 0.82), smoothstep(0.0, 0.6, el));
      float cl = smoothstep(0.42, 0.7, vn(vec2(az * 2.2 + t * 0.03, el * 5.)) * 0.65 + vn(vec2(az * 6. + t * 0.05, el * 13.)) * 0.35) * smoothstep(0.03, 0.2, h);
      sky = mix(sky, vec3(1.12, 1.1, 1.05), cl);
      vec3 g = mix(vec3(0.04, 0.17, 0.05), vec3(0.36, 0.60, 0.15), smoothstep(-0.45, 0.0, h)) * (0.7 + 0.6 * vn(vec2(az * 7., h * 26.)));
      float far = (1. - smoothstep(0.0, 0.035, abs(h - 0.012))) * step(0.5, vn(vec2(az * 9., 2.)));       // a line of far trees
      c = mix(mix(g, sky, smoothstep(-0.006, 0.006, h)), vec3(0.05, 0.16, 0.10), far * 0.8) * 2.2;
    } else if (look < 1.5) {     // sunset
      vec3 sky = mix(vec3(1.0, 0.44, 0.09), vec3(0.34, 0.07, 0.32), smoothstep(0.0, 0.5, el));
      float sd2 = length(vec2(a0 - 0.08, el - 0.11));
      sky += vec3(1.0, 0.72, 0.36) * ((1. - smoothstep(0.085, 0.1, sd2)) * 3.0 + 0.7 * exp(-5. * sd2));
      float bar = smoothstep(0.55, 0.75, vn(vec2(az * 1.5 + t * 0.02, el * 16.))) * smoothstep(0.1, 0.2, el);
      sky = mix(sky, vec3(0.30, 0.06, 0.16), bar * 0.75);                                                  // long cloud bars
      float hl = 0.035 + 0.03 * sin(az * 3.1) + 0.02 * sin(az * 8.3);
      c = mix(vec3(0.05, 0.012, 0.035), sky * 1.9, smoothstep(-0.005, 0.005, el - hl));
    } else if (look < 2.5) {     // aurora night
      vec3 sky = mix(vec3(0.02, 0.12, 0.14), vec3(0.0, 0.015, 0.07), smoothstep(0., 0.6, el));
      float band = pow(0.5 + 0.5 * sin(az * 7. + 2.5 * vn(vec2(az * 2., t * 0.2)) + t * 0.3 + el * 3.), 3.) * smoothstep(0.03, 0.2, el) * (1. - smoothstep(0.3, 0.9, el));
      sky += vec3(0.15, 1.0, 0.55) * band * 2.4 + vec3(0.45, 0.2, 0.9) * band * smoothstep(0.3, 0.7, el);
      sky += step(0.985, h21(floor(vec2(az, el) * 40.))) * 0.8;
      float hl = 0.03 + 0.05 * sin(az * 2.7) + 0.05 * (1. - abs(fract(az * 3.3) - 0.5) * 2.) * step(0.4, h21(vec2(floor(az * 3.3), 5.)));
      c = mix(vec3(0.015, 0.05, 0.06), sky * 1.7, smoothstep(-0.005, 0.005, el - hl));
    } else if (look < 3.5) {     // under the sea
      float ray = pow(0.5 + 0.5 * sin(az * 11. + el * 2. + sin(t * 0.6 + az * 3.) * 1.5), 2.);
      c = mix(vec3(0.0, 0.07, 0.20), vec3(0.15, 0.85, 0.9), smoothstep(-0.35, 0.6, el)) * (0.6 + 1.0 * ray * smoothstep(-0.2, 0.5, el));
      float cau = vn(vec2(az * 9. + t * 0.4, 1.4 / max(0.05, -el) + t * 0.3));
      float reef = 0.10 * vn(vec2(az * 6., 1.)) + 0.05 * vn(vec2(az * 17., 4.)) - 0.2;
      c = mix(vec3(0.02, 0.10, 0.14) * (0.5 + 1.2 * cau), c, smoothstep(-0.01, 0.01, el - reef)) * 1.8;
      vec2 bc = vec2(az * 6., el * 6. - t * 0.25), bi = floor(bc); float bh = h21(bi);
      c += vec3(0.5, 1.0, 0.95) * 1.2 * step(0.6, bh) * (1. - smoothstep(0.05, 0.09, length(fract(bc) - 0.5 - (vec2(bh, fract(bh * 7.)) - 0.5) * 0.5)));
    } else if (look < 4.5) {     // snowfield in daylight
      float hl = 0.05 + 0.04 * sin(az * 1.9) + 0.02 * sin(az * 6.1), h = el - hl;
      vec3 sky = mix(vec3(0.85, 0.92, 1.0), vec3(0.22, 0.44, 0.92), smoothstep(0., 0.55, el));
      vec3 g = mix(vec3(0.45, 0.58, 0.92), vec3(1.0), smoothstep(-0.5, 0.0, h) * (0.7 + 0.3 * vn(vec2(az * 5., h * 22.))));
      float tx = az * 13., pine = step(0.45, h21(vec2(floor(tx), 3.))) * (1. - abs(fract(tx) - 0.5) * 2.) * (0.10 + 0.08 * h21(vec2(floor(tx), 7.)));
      vec3 fld = mix(g, sky, smoothstep(-0.006, 0.006, h));
      c = mix(fld, vec3(0.06, 0.15, 0.18), step(0.002, h) * step(h, pine)) * 2.5;
    } else if (look < 5.5) {     // desert
      float hl = 0.07 * sin(az * 1.3) + 0.04 * sin(az * 3.7 + 1.), h = el - hl;
      vec3 sky = mix(vec3(1.0, 0.84, 0.56), vec3(0.30, 0.50, 0.88), smoothstep(0., 0.55, el));
      float dune = smoothstep(0.35, 0.65, fract(h * 9. + 0.6 * sin(az * 4.) + vn(vec2(az * 3., 2.)) * 0.8));
      vec3 g = mix(vec3(0.42, 0.20, 0.08), vec3(1.0, 0.74, 0.36), dune * smoothstep(-0.6, 0.05, h) + 0.15);
      c = mix(g, sky, smoothstep(-0.006, 0.006, h)) * 2.1;
      c += vec3(1.0, 0.8, 0.5) * 1.6 * (1. - smoothstep(0.05, 0.065, length(vec2(a0 + 0.1, el - 0.3))));
    } else if (look < 6.5) {     // blossom garden
      vec3 sky = mix(vec3(1.0, 0.82, 0.86), vec3(0.50, 0.64, 1.0), smoothstep(0., 0.6, el));
      float tr = vn(vec2(az * 4., 1.)) * 0.42 + 0.06 + 0.14 * vn(vec2(az * 13., 4.));
      float bn = vn(vec2(az * 16., el * 16. + t * 0.2));
      vec3 bl = mix(vec3(0.62, 0.14, 0.34), vec3(1.0, 0.78, 0.86), bn);
      vec3 lawn = vec3(0.10, 0.30, 0.10) * (0.6 + 0.8 * vn(vec2(az * 6., el * 30.))) + vec3(0.9, 0.5, 0.65) * step(0.8, vn(vec2(az * 40., el * 60.))) * 0.5;
      c = (el < 0.0 ? lawn : (el < tr ? bl : sky)) * 2.0;
    } else {                     // starry void
      vec3 sky = mix(vec3(0.16, 0.04, 0.38), vec3(0.015, 0.005, 0.07), smoothstep(-0.4, 0.6, el));
      sky += vec3(0.8, 0.3, 1.0) * pow(vn(vec2(az * 3., el * 3.) + sd * 30.), 3.) * 1.6;
      sky += step(0.955, h21(floor(vec2(az, el) * 46.))) * 2.5 * (0.6 + 0.4 * sin(t * 2. + az * 40.));
      vec2 pq = vec2(a0 + 0.07, el - 0.16); float pr = length(pq);                                         // a ringed planet
      float lim = clamp(0.5 + (pq.x * 0.7 + pq.y * 0.7) / 0.13, 0., 1.);
      sky = mix(sky, mix(vec3(0.05, 0.02, 0.12), vec3(1.0, 0.72, 0.9) * 1.5, lim), 1. - smoothstep(0.125, 0.135, pr));
      float rg = length(vec2(pq.x + pq.y * 0.4, pq.y * 3.2));
      sky += vec3(0.9, 0.7, 1.0) * 0.9 * smoothstep(0.17, 0.19, rg) * (1. - smoothstep(0.25, 0.27, rg)) * step(0.13, pr + step(pq.y, 0.) * 0.2);
      c = sky * 1.6;
    }
    return c;
  }
`;

function makeDoorMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec3 aP; attribute vec4 aI; attribute vec3 aTf; attribute vec3 aTl;
      uniform vec3 uLooks[9];
      varying vec3 vW; varying vec3 vN; varying vec3 vRd; varying vec4 vM; varying vec3 vTf; varying vec3 vTl; varying vec3 vLook; varying float vSeed; varying vec2 vLp; varying vec2 vOp;
      ${GLSL_SWING}
      void main(){
        vec3 p = position, n = normal; float hx = aP.z, th = swingOf(aI), glow = 0.;
        vLp = position.xy;
        bool isBeyond = aP.x > 1.5 && aP.x < 2.5;
        vOp = isBeyond ? normal.xy : vec2(0.);                                   // doorway quads carry their opening coordinates
        if (isBeyond) n = vec3(0., 0., 1.);
        #ifdef USE_INSTANCING
          mat4 im = instanceMatrix;
        #else
          mat4 im = mat4(1.);
        #endif
        if (abs(hx) > 50.) { p.x += (abs(hx) - 100.) * smoothstep(0.1, 1.7, th); glow = 0.3; }
        else if (hx != 0.) {
          float a = th * (hx < 0. ? 1. : -1.), c = cos(a), s = sin(a); vec2 q = vec2(p.x - hx, p.z);
          p.x = hx + q.x * c - q.y * s; p.z = q.x * s + q.y * c; n = vec3(n.x * c - n.z * s, n.y, n.x * s + n.z * c);
          glow = max(0., -normal.z) * (0.2 + 0.8 * sin(min(th, 1.57))) * 0.45;          // the back of an open leaf faces the beam
        } else if (!isBeyond) glow = max(0., dot(normal, normalize(vec3(-sign(p.x), 0., 0.3)))) * 0.8;
        vec4 wp = modelMatrix * im * vec4(p, 1.);
        vec3 sc = vec3(length(im[0].xyz), length(im[1].xyz), length(im[2].xyz));
        if (aI.w < 0.) wp.y += sin(uTime * 0.6 + aI.y * 3.) * 0.1 * sc.y;        // floating doors bob
        vW = wp.xyz; vN = normalize(mat3(modelMatrix) * mat3(im) * (n / (sc * sc)));
        vRd = ((wp.xyz - cameraPosition) * mat3(im)) / sc;
        vM = vec4(aP.x, aP.y, glow, aI.x); vTf = aTf; vTl = aTl; vSeed = abs(aI.w);
        vLook = uLooks[int(clamp(aI.x, 0., 8.))];
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSky; uniform vec3 uGnd; uniform vec3 uKeyCol; uniform vec3 uKeyPos; uniform vec3 uFogCol; uniform vec3 uMetal; uniform vec3 uPale; uniform vec3 uLamp;
      uniform float uFogD; uniform float uTime; uniform float uOpen;
      varying vec3 vW; varying vec3 vN; varying vec3 vRd; varying vec4 vM; varying vec3 vTf; varying vec3 vTl; varying vec3 vLook; varying float vSeed; varying vec2 vLp; varying vec2 vOp;
      ${GLSL_COMMON}
      ${GLSL_BEYOND}
      void main(){
        float mt = vM.x; vec3 V = vW - cameraPosition; float dist = length(V);
        float fog = 1. - exp(-uFogD * uFogD * dist * dist), fogAmt = 1.;
        vec3 col; vec2 op = vOp;
        if (mt > 6.5 && mt < 7.5) { mt = (abs(vLp.x) < 0.5 && vLp.y < 1.) ? 2. : 0.; op = vec2(vLp.x * 2., vLp.y); }
        if (mt > 1.5 && mt < 2.5) {
          vec3 b = beyond(vM.w, normalize(vec3(vRd.xy, -abs(vRd.z))), op, vSeed, uTime);
          float e = min(1. - abs(op.x), min(op.y * 1.6 + 0.3, (1. - op.y) * 1.2));
          b *= mix(0.42, 1., smoothstep(0., 0.4, e));                          // the frame's own shadow: the world sits behind the opening
          float l = max(b.r, max(b.g, b.b));
          col = b * mix(0.5, 1., smoothstep(0.9, 2.0, l)); fogAmt = 0.5;       // only the bright cores bloom
        }
        else if (mt > 2.5 && mt < 3.5) { col = uLamp * vM.y * (0.85 + 0.15 * sin(uTime * 9. + vW.x * 3.7 + vW.z * 1.3)); fogAmt = 0.45; }
        else {
          vec3 n = normalize(vN); if (dot(n, V) > 0.) n = -n;
          float px = length(fwidth(vLp)), f1 = 1. - smoothstep(0.006, 0.02, px), f2 = 1. - smoothstep(0.03, 0.12, px);
          float foot = 0.66 + 0.34 * smoothstep(0., 0.4, vLp.y);               // grime where the door meets the ground
          vec3 alb; float rimK = 1.;
          if (mt > 7.5) { alb = vec3(0.04, 0.035, 0.045); fogAmt = 0.; rimK = 0.25; }
          else if (mt < 0.5) alb = vTf * (1. + f2 * (0.26 * vn(vLp * vec2(6., 4.)) - 0.13) + f1 * (0.16 * vn(vLp * 37.) - 0.08)) * foot;
          else if (mt < 1.5) {
            float gr = vn(vLp * vec2(40., 3.)), wide = vn(vLp * vec2(8., 0.6) + 3.), knot = smoothstep(0.78, 0.9, vn(vLp * vec2(5., 2.2) + 11.));
            alb = vTl * (1. + f1 * (0.36 * gr - 0.18)) * (1. + f2 * (0.3 * wide - 0.15)) * (1. - 0.35 * knot * f2) * foot;
            alb *= 0.55 + 0.45 * vM.y * vM.y;                                 // deeper recesses around the raised panels
          }
          else if (mt < 4.5) alb = uMetal * (0.8 + 0.4 * f2 * vn(vLp * 19.));
          else if (mt < 5.5) alb = vec3(0.62, 0.58, 0.5);
          else alb = uPale * (1. + f2 * (0.24 * vn(vLp * vec2(4., 15.)) - 0.12)) * foot;
          if (mt > 1.5 || mt < 0.5) alb *= vM.y;
          vec3 Lk = uKeyPos - vW; float kl = length(Lk); Lk /= kl;
          float kd = clamp(dot(n, Lk) * 0.75 + 0.25, 0., 1.);
          vec3 lit = mix(uGnd, uSky, n.y * 0.5 + 0.5) + uKeyCol * uOpen * kd * (0.22 + 0.78 * exp(-kl / 520.));
          float fr = pow(1. - abs(dot(n, V / dist)), 3.);
          col = alb * lit + alb * vLook * vM.z * 3.0 + (uSky * 0.4 + uKeyCol * uOpen * 0.06) * fr * rimK * (0.4 + alb.g);
          if (mt > 4.5 && mt < 5.5) col += vLook * 0.6;                       // paper screens glow through
        }
        col = mix(col, uFogCol, fog * fogAmt);
        if (!(col.r + col.g + col.b >= 0.)) col = uFogCol;
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// light thrown on the ground by every door: instanced additive quads, sweeping with the leaf
function makeDecalMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4,
    vertexShader: /* glsl */`
      attribute vec4 aD0; attribute vec4 aD1; attribute vec4 aI;
      uniform vec3 uLooks[9];
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying float vFlat;
      ${GLSL_SWING}
      void main(){
        float th = swingOf(aI), open = smoothstep(0.05, 1.5, th);
        vec2 q = position.xy; float w = aD0.w, L = aD1.x; vec3 wp;
        if (aD1.z < 0.5) {
          float gw = mix(0.15, 1., open), al = (1. - open) * 0.9;
          float xl = (0.5 - gw) * w + (q.x + 0.5) * gw * w + q.x * q.y * (w * 0.9 + L * 0.12) + q.y * L * sin(al);
          float zl = q.y * L * cos(al) + 0.05 * w;
          float c = cos(aD0.z), s = sin(aD0.z);
          wp = vec3(aD0.x + xl * c + zl * s, 0.06, aD0.y - xl * s + zl * c);
        } else {                                                              // trapdoors: a standing shaft of light
          vec3 base = vec3(aD0.x, 0., aD0.y), toC = cameraPosition - base; vec3 rt = normalize(vec3(toC.z, 0., -toC.x));
          wp = base + rt * q.x * w * (0.7 + q.y * 0.9) + vec3(0., q.y * L, 0.);
        }
        vUv = vec2(q.x * 2., q.y); vFlat = aD1.z; vW = wp;
        vCol = uLooks[int(clamp(aI.x, 0., 8.))] * aD1.y * (0.2 + 0.8 * open);
        gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform float uFogD; uniform float uPud; uniform float uTime;
      varying vec2 vUv; varying vec3 vCol; varying vec3 vW; varying float vFlat;
      ${GLSL_COMMON}
      void main(){
        float e = 1. - pow(abs(vUv.x), vFlat < 0.5 ? 4. : 1.6);
        float a = max(e, 0.) * pow(clamp(1. - vUv.y, 0., 1.), vFlat < 0.5 ? 1.5 : 1.2) * smoothstep(0., 0.03, vUv.y);
        float dist = length(vW - cameraPosition), fog = exp(-uFogD * uFogD * dist * dist);
        if (vFlat < 0.5) {                                                    // where the light crosses a puddle the water throws it back, rippling
          vec2 p = vW.xz;
          float pf = sin(p.x * 0.11 + 2. * sin(p.y * 0.043)) * sin(p.y * 0.097 + 2. * sin(p.x * 0.037)) + 0.3 * sin(p.x * 0.31 + p.y * 0.23);
          float pud = smoothstep(uPud - 0.02, uPud + 0.05, pf), near = exp(-dist / 160.);
          a *= 1. + pud * (0.6 + 2.6 * near * vn(vec2(p.x * 1.3 + uTime * 0.5, p.y * 4.2 - uTime * 0.8)));
        }
        gl_FragColor = vec4(vCol * a * fog * (0.4 + 0.6 * exp(-dist / 300.)) * (vFlat < 0.5 ? 1. : 0.45), 1.);
      }`,
  });
}

// analytic puddle field, identical in GLSL and JS (so grass tufts stay out of the water)
const puddleField = (x, z) => Math.sin(x * 0.11 + 2 * Math.sin(z * 0.043)) * Math.sin(z * 0.097 + 2 * Math.sin(x * 0.037)) + 0.3 * Math.sin(x * 0.31 + z * 0.23);
const groundTone = (x, z) => 0.5 + 0.3 * Math.sin(x * 0.021 + 1.3 * Math.sin(z * 0.013)) + 0.2 * Math.sin(z * 0.017 - x * 0.009);

function makeGroundMaterial(U) {
  return new THREE.ShaderMaterial({
    uniforms: U,
    vertexShader: /* glsl */`
      varying vec3 vW;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZen; uniform vec3 uMid; uniform vec3 uHor; uniform vec3 uFogCol; uniform vec3 uGrassA; uniform vec3 uGrassB; uniform vec3 uAmb; uniform vec3 uKeyCol; uniform vec3 uStone;
      uniform float uTime; uniform float uFogD; uniform float uOpen; uniform float uPud; uniform vec2 uFrame; uniform vec2 uSkyPow; uniform vec4 uSp; uniform vec4 uSp2; uniform vec3 uSpCol;
      varying vec3 vW;
      ${GLSL_COMMON}
      vec3 skyCol(vec3 d){ float inv = 1. - clamp(d.y, 0., 1.); return mix(mix(uZen, uMid, pow(inv, uSkyPow.x)), uHor, pow(inv, uSkyPow.y)); }
      void main(){
        vec3 V = vW - cameraPosition; float dist = length(V); vec3 v = V / dist; vec2 p = vW.xz;
        float pf = sin(p.x * 0.11 + 2. * sin(p.y * 0.043)) * sin(p.y * 0.097 + 2. * sin(p.x * 0.037)) + 0.3 * sin(p.x * 0.31 + p.y * 0.23);
        pf += (vn(p * 0.6) - 0.5) * 0.12;
        float pud = smoothstep(uPud, uPud + 0.05, pf);
        float tone = 0.5 + 0.3 * sin(p.x * 0.021 + 1.3 * sin(p.y * 0.013)) + 0.2 * sin(p.y * 0.017 - p.x * 0.009);
        float lod2 = exp(-dist / 400.), fw = length(fwidth(p));
        vec3 g = mix(uGrassA, uGrassB, tone);
        // isotropic turf detail, each octave fading out before it can alias
        vec2 pa = mat2(0.8, -0.6, 0.6, 0.8) * p + 7.3, pb = mat2(0.28, 0.96, -0.96, 0.28) * p + 3.1, pc = mat2(-0.6, 0.8, -0.8, -0.6) * p;     // turned octaves hide the lattice
        float o1 = (vn(pa * 0.9) - 0.5) * (1. - smoothstep(0.3, 1.0, fw * 0.9)), o2 = (vn(pb * 3.3) * 0.6 + vn(pc * 5.1) * 0.4 - 0.5) * (1. - smoothstep(0.3, 1.0, fw * 4.));
        float o3 = (vn(pa * 11.) * 0.6 + vn(pc * 17.) * 0.4 - 0.5) * (1. - smoothstep(0.3, 1.0, fw * 14.)), o4 = (vn(pb * 31.) - 0.5) * (1. - smoothstep(0.3, 1.0, fw * 31.));
        float blade = (vn(p * vec2(83., 67.)) * vn(p * vec2(59., 97.) + 5.) - 0.25) * (1. - smoothstep(0.25, 0.8, fw * 80.)) * exp(-dist / 25.);
        g *= max(0.3, 1.12 + 0.42 * o1 + 0.5 * o2 + 0.5 * o3 + 0.4 * o4 + 0.9 * blade);
        g = mix(g, g * vec3(0.78, 0.86, 1.12), smoothstep(0.1, 0.35, o1 + 0.5 * o2));     // cooler tussocks among the pale grass
        g *= mix(1., 0.7 + 0.6 * vn(p * 0.23), lod2) * (0.85 + 0.3 * vn(p * 0.031));
        g *= 1. - 0.5 * smoothstep(uPud - 0.22, uPud, pf);                        // damp earth around the water
        float dd = length(p);
        float rbase = (1. - smoothstep(0.3, 1.7, abs(p.x) / (24. + max(p.y, 0.) * 0.05))) * smoothstep(-40., 60., p.y);
        // the river of light: long streaks that run outward from the Great Door
        float river = rbase * (0.12 + 1.75 * smoothstep(0.28, 0.78, vn(vec2(p.x * 0.085, p.y * 0.011 - uTime * 0.05)) * 0.6 + vn(vec2(p.x * 0.29 + 4., p.y * 0.021 - uTime * 0.09)) * 0.4));
        // the doors' light pools along the arms of the great spiral, so it reads from the air
        vec2 sq = p - uSp.xy; float sr = max(length(sq), 1.);
        float sf = fract((uSp.z * (atan(sq.y, sq.x) - uSp.w) - log(sr / uSp2.x) / uSp2.y) * uSp2.z / 6.2831853);
        float sm = min(sf, 1. - sf) * sr * uSp2.y * 6.2831853 / uSp2.z, sh = 12. + 0.075 * sr;
        float arm = (1. - smoothstep(sh * 0.5, sh * 1.9, sm)) * smoothstep(uSp2.x * 0.7, uSp2.x * 1.4, sr) * (1. - smoothstep(uSp2.w * 0.75, uSp2.w, sr));
        vec3 gn = mix(g, vec3(dot(g, vec3(0.34))), 0.75);                           // warm light falls on a neutral albedo, so it stays apricot, never khaki
        vec3 col = g * uAmb * (1. - 0.4 * (1. - arm) * (1. - smoothstep(uSp2.w * 0.8, uSp2.w, sr))) * (1. - 0.4 * rbase * exp(-dd / 900.)) * (1. - 0.3 * arm)
          + gn * (uSpCol * arm * (0.7 + 0.6 * vn(p * 0.07)) + uKeyCol * vec3(1., 0.64, 0.32) * uOpen * (0.03 * exp(-dd / 500.) + 0.36 * river * exp(-dd / 900.)));
        // puddles: a rippling mirror of the dusk sky and of the Great Door's slot
        vec2 rp = vec2(vn(p * 2.6 + uTime * 0.4), vn(p * 2.6 - uTime * 0.33 + 7.)) - 0.5;
        vec3 n = normalize(vec3(rp.x * 0.07, 1., rp.y * 0.07));
        vec3 r = reflect(v, n); r.y = abs(r.y);
        vec3 refl = skyCol(r);
        if (r.z < -0.001) {
          float t = -vW.z / r.z; vec3 h = vW + r * t;
          float inFrame = step(abs(h.x - uFrame.x), 163.) * step(h.y, uFrame.y);
          refl = mix(refl, uStone, inFrame * 0.85 * exp(-t / 1500.));
          refl += uKeyCol * 3.2 * uOpen * (1. - smoothstep(12., 17., abs(h.x))) * (1. - smoothstep(380., 410., h.y));
        }
        refl += uSpCol * arm * (1.2 + 2.2 * vn(vec2(p.x * 1.1 + uTime * 0.4, p.y * 3.7)));     // the doors of the arm, glinting in the water
        refl += uKeyCol * vec3(1., 0.66, 0.34) * uOpen * rbase * exp(-dd / 900.) * (0.5 + 1.1 * vn(vec2(p.x * 0.9, p.y * 3.1 - uTime * 0.7)));   // pools of gold in the river of light
        float fr = pow(1. - max(0., -v.y), 4.);
        col = mix(col, mix(mix(uGrassA, uGrassB, tone) * uAmb * 0.22, refl, 0.5 + 0.5 * fr), pud);
        float fog = 1. - exp(-uFogD * uFogD * dist * dist);
        vec3 fc = mix(uFogCol, uHor * 0.82, smoothstep(1100., 4200., dist));      // the plain melts into the horizon band
        col = mix(col, fc, fog);
        if (!(col.r + col.g + col.b >= 0.)) col = uFogCol;
        gl_FragColor = vec4(col, 1.);
      }`,
  });
}

// ---------------------------------------------------------------- the field: where every door stands
const TC = (list) => list.map((h) => new THREE.Color(h));
const MUTE = (list, k) => list.map((c, i) => { const l = 0.3 * c.r + 0.55 * c.g + 0.15 * c.b; return c.lerp(new THREE.Color(l * 1.02, l * 0.94, l * (i % 2 ? 1.28 : 1.1)), k); });
const LEAF_TINTS = MUTE(TC(['#7a4a2a', '#a8763e', '#2f5d62', '#8a2f2a', '#d8cfb8', '#34503a', '#3d4a6e', '#2a2624', '#c9a23c', '#9aa2ac', '#6a3f8a', '#b86a4a']), 0.42);
const FRAME_TINTS = TC(['#cfc6b4', '#8f8a84', '#5a4636', '#e6e0d2', '#4a4a5c', '#b9a58a']);
const VAULT_L = MUTE(TC(['#9aa2ac', '#6f7884', '#b08a4a']), 0.3), VAULT_F = TC(['#4a4a5c', '#8f8a84']), SHOJI_F = TC(['#5a4636', '#2a2624', '#8a2f2a']), HATCH_L = MUTE(TC(['#7a4a2a', '#6f7884', '#8a2f2a']), 0.4), HATCH_F = TC(['#4a4a5c', '#5a4636']);
const NEAR = 26, MID = 85;     // LOD rings: distance from the camera path (m)
const STORY_SEED = 0.2703;       // a seed whose swing stays wide open (see swingOf)

function layoutDoors({ rng, path, styles, heroX, spiral, lookWeights, total, entry }) {
  const doors = [], cell = 14, grid = new Map(), keep = [], bigs = [];
  const key = (x, z) => (Math.floor(x / cell) + 2048) * 4096 + Math.floor(z / cell) + 2048;
  const wsum = lookWeights.reduce((a, b) => a + b, 0);
  // nearest point of the camera path (coarse samples refined on the two neighbouring segments)
  const NS = 168, px = new Float32Array(NS + 1), py = new Float32Array(NS + 1), pz = new Float32Array(NS + 1), _p = new THREE.Vector3(), nres = { dist: 0, u: 0, y: 0 };
  let xMax = 0; for (let i = 0; i <= NS; i++) { path.pointAt(i / NS, _p); px[i] = _p.x; py[i] = _p.y; pz[i] = _p.z; xMax = Math.max(xMax, Math.abs(_p.x)); }
  function nearest(x, z) {
    if (Math.abs(x) > xMax + MID + 12) { nres.dist = Math.abs(x) - xMax; nres.u = 0.5; nres.y = 0; return nres; }
    let best = Infinity, bi = 0;
    for (let i = 0; i <= NS; i++) { const dx = px[i] - x, dz = pz[i] - z, d = dx * dx + dz * dz; if (d < best) { best = d; bi = i; } }
    nres.dist = Math.sqrt(best); nres.u = bi / NS; nres.y = py[bi];
    for (let k = Math.max(0, bi - 1); k < Math.min(NS, bi + 1); k++) {
      const ax = px[k], az = pz[k], bx = px[k + 1] - ax, bz = pz[k + 1] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz), 0, 1), dx = ax + bx * t - x, dz = az + bz * t - z, d = Math.sqrt(dx * dx + dz * dz);
      if (d < nres.dist) { nres.dist = d; nres.u = (k + t) / NS; nres.y = py[k] + (py[k + 1] - py[k]) * t; }
    }
    return nres;
  }
  const pickLook = () => { let r = rng() * wsum; for (let i = 0; i < 8; i++) { r -= lookWeights[i]; if (r <= 0) return i; } return 0; };
  const pickSize = () => { const r = rng(); return r < 0.8 ? rng.range(2.1, 3.8) : r < 0.95 ? rng.range(3.8, 8) : r < 0.99 ? rng.range(8, 16) : rng.range(16, 30); };
  const tintOf = (style) => {
    let tl = rng.pick(LEAF_TINTS), tf = rng.pick(FRAME_TINTS);
    if (style === 3) { tl = rng.pick(VAULT_L); tf = rng.pick(VAULT_F); }
    if (style === 2) tf = rng.pick(SHOJI_F);
    if (style === 5) { tl = rng.pick(HATCH_L); tf = rng.pick(HATCH_F); }
    const j = rng.range(0.8, 1.15);
    return [tf.clone().multiplyScalar(j), tl.clone().multiplyScalar(j)];
  };
  // o: { x, z, H (total height, m), yaw, style, look, y, flat, open, seed, lean, force, near }
  function add(o) {
    const style = o.style ?? rng.int(0, 7), st = styles[style]; let H = o.H ?? pickSize();
    if (!o.force && H > 3.3) { const n0 = nearest(o.x, o.z); if ((n0.u < 0.075 && n0.dist < 34) || Math.hypot(o.x - entry[0], o.z - entry[1]) < 36) H = rng.range(2.2, 3.2); }      // nothing looms over the way in
    if (!o.force && (o.y ?? 0) > 0 && Math.hypot(o.x - entry[0], o.z - entry[1]) < 26) return null;
    const s = H / st.oh, hw = s * (st.ow * 0.5 + 0.3), reach = o.flat ? hw : s * st.ow + 0.5;
    const y = o.y ?? 0, x = o.x, z = o.z;
    if (!o.force) {
      if (Math.abs(x - heroX) < 215 && z > -70 && z < 138) return null;
      if (H > 11 && Math.abs(x) < 70 && z < 620) return null;                     // keep the river of light open to the sky
      if (!o.arm) { const dx = x - spiral.cx, dz = z - spiral.cz; if (dx * dx + dz * dz < spiral.rEx * spiral.rEx && (H > 4.5 || o.flat || rng() > 0.07)) return null; }   // inside the spiral only its arms stand
      for (const k of keep) { const dx = x - k[0], dz = z - k[1], r = k[2] + hw; if (dx * dx + dz * dz < r * r) return null; }
      for (const d of bigs) { const dx = x - d.x, dz = z - d.z, r = (hw + d.hw) * 1.15 + 1.2; if (dx * dx + dz * dz < r * r) return null; }
      const k0 = key(x, z);
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
        const b = grid.get(k0 + i * 4096 + j); if (!b) continue;
        for (const d of b) { const dx = x - d.x, dz = z - d.z, r = (hw + d.hw) * 1.15 + 1.2; if (dx * dx + dz * dz < r * r) return null; }
      }
    }
    const n = nearest(x, z);
    if (!o.force && n.dist < 6.5 + reach && H + y > n.y - 7) return null;
    const [tf, tl] = tintOf(style);
    const d = { x: o.x, z: o.z, y, H, s, hw, style, yaw: o.yaw ?? rng.range(0, TAU), look: o.look ?? pickLook(), flat: !!o.flat,
      phase: rng.range(0, TAU), open: o.open ?? (rng() < 0.82 ? rng.range(0.9, 1.75) : rng.range(0.25, 0.8)), seed: o.seed ?? rng.range(0.05, 0.95),
      lean: o.lean ?? (H < 6 && !o.flat ? rng.range(0.02, 0.11) : rng.range(0, 0.02)), tf, tl, dist: n.dist, u: n.u, near: !!o.near, story: !!o.force, dL: o.dL, dK: o.dK, dW: o.dW, noLamp: !!o.noLamp };
    doors.push(d);
    if (hw > 5.5) bigs.push(d); else { const k = key(x, z); let b = grid.get(k); if (!b) grid.set(k, (b = [])); b.push(d); }
    return d;
  }
  const yawTo = (fx, fz) => Math.atan2(fx, fz);
  return { doors, add, keep, yawTo, pickLook, pickSize,
    async fill(yieldFn) {          // yieldFn (ctx.yield) hands the page back between lanes, rows, whorls and every 250 scatter tries; it takes no draw
      // 1. the avenue of head-high doors at the entry
      for (let side = -1; side <= 1; side += 2) for (let d = 6; d < path.length * 0.17; d += rng.range(5.5, 9)) {
        const P = path.posAtDist(d), T = path.tangentAtDist(d), lat = side * rng.range(8.6, 11.5) + (rng() < 0.3 ? side * rng.range(4, 9) : 0);
        add({ x: P.x - T.z * lat, z: P.z + T.x * lat, H: rng.range(2.1, 3.3), yaw: yawTo(-T.x - side * (-T.z) * rng.range(0.1, 0.7), -T.z - side * T.x * rng.range(0.1, 0.7)), near: true });
      }
      // 2. the great spiral: arms of doors, each facing along its arm so their light draws the curve on the plain
      const { cx, cz, arms, b, r0, r1, dir } = spiral;
      for (let a = 0; a < arms; a++) {
        const armLook = pickLook();
        // great doors every forty metres or so, their long light drawing the arm so it reads from high above
        for (let th = rng.range(0.5, 0.9), r = r0; r < r1 * 0.94;) {
          r = r0 * Math.exp(b * th);
          const ang = dir * (th + (a / arms) * TAU) + spiral.rot, x = cx + Math.cos(ang) * r, z = cz + Math.sin(ang) * r;
          let tx = -Math.sin(ang) * dir + Math.cos(ang) * b, tz = Math.cos(ang) * dir + Math.sin(ang) * b;
          if (tz < 0) { tx = -tx; tz = -tz; }
          if (r > 70) add({ x, z, arm: true, H: rng.range(8, 12 + r * 0.012), style: rng.pick([0, 1, 6, 7, 1, 0]), yaw: yawTo(tx, tz) + rng.range(-0.2, 0.2), look: rng() < 0.8 ? armLook : undefined, open: rng.range(1.2, 1.7), dL: rng.range(34, 52), dK: 0.8 });
          th += rng.range(36, 48) / (r * Math.sqrt(1 + b * b));
        }
        for (let lane = 0; lane < 6; lane++) {
          await yieldFn();
          let th = rng.range(0, 0.3), r = r0;
          while (r < r1) {
            r = r0 * Math.exp(b * th);
            const ang = dir * (th + (a / arms) * TAU) + spiral.rot, rr = r + (lane - 2.5) * (5.5 + r * 0.036) + rng.range(-1.4, 1.4);
            const x = cx + Math.cos(ang) * rr, z = cz + Math.sin(ang) * rr;
            let tx = -Math.sin(ang) * dir + Math.cos(ang) * b, tz = Math.cos(ang) * dir + Math.sin(ang) * b;     // tangent of the arm (outward)
            if ((tz < 0) === (rng() < 0.8)) { tx = -tx; tz = -tz; }                                              // most fronts face the arriving camera
            const big = rng() < 0.04 + r * 0.0001;
            add({ x, z, arm: true, H: big ? rng.range(7, 13 + r * 0.03) : rng.range(2.2, 4.2 + r * 0.004), yaw: yawTo(tx, tz) + rng.range(-0.25, 0.25), look: rng() < 0.72 ? armLook : undefined });
            th += rng.range(4.4, 7.2) * (1 + r * 0.0012) / (r * Math.sqrt(1 + b * b));
          }
        }
      }
      // 3. enfilades: long loose rows, every door facing down its row
      const nRows = Math.round(total * 0.004);
      for (let i = 0; i < nRows; i++) {
        await yieldFn();
        let x = rng.range(-640, 640), z = rng.range(-220, 1480); const h = rng.range(0, TAU), len = rng.range(120, 460), step = rng.range(5.5, 10), curve = rng.range(-0.0016, 0.0016);
        const look = rng() < 0.35 ? pickLook() : undefined, style = rng() < 0.5 ? rng.int(0, 7) : undefined; let hh = h;
        for (let d = 0; d < len; d += step * rng.range(0.8, 1.3)) {
          hh += curve * step; x += Math.sin(hh) * step; z += Math.cos(hh) * step;
          const f = rng() < 0.75 ? 1 : -1;
          add({ x: x + rng.range(-1, 1), z: z + rng.range(-1, 1), yaw: hh + (f > 0 ? 0 : Math.PI) + rng.range(-0.15, 0.15), look, style, H: rng() < 0.9 ? rng.range(2.2, 4.4) : undefined });
        }
      }
      // 4. small whorls
      for (let i = 0; i < Math.round(total * 0.0016); i++) {
        await yieldFn();
        const wx = rng.range(-560, 560), wz = rng.range(-150, 1420), R = rng.range(28, 80), dr = rng.sign(), look = rng() < 0.5 ? pickLook() : undefined;
        for (let th = 1.2; th < 15; th += 5.2 / (2.2 * th + 4)) {
          const r = R * th / 15, a = th * dr;
          add({ x: wx + Math.cos(a) * r, z: wz + Math.sin(a) * r, yaw: yawTo(Math.cos(a), Math.sin(a)) + rng.range(-0.2, 0.2), H: rng.range(2.1, 3.4 + r * 0.03), look });
        }
      }
      // 5. scatter until the plain holds its ten thousand: denser by the path, trapdoors and floating doors among them
      let guard = total * 6;
      while (doors.length < total && guard-- > 0) {
        if (guard % 250 === 0) await yieldFn();
        const nearPath = rng() < 0.24; let x, z;
        if (nearPath) { const d = rng.range(0, path.length), P = path.posAtDist(d), lat = rng.sign() * (7 + rng() * 130); x = P.x + lat * rng.range(0.8, 1.2); z = P.z + rng.range(-20, 20); }
        else { x = rng.gauss() * 380; z = rng.range(-260, 1560); if (Math.abs(x) > 800) continue; }
        const r = rng();
        if (r < 0.045) add({ x, z, flat: true, style: rng() < 0.7 ? 5 : rng.pick([0, 3, 6]), H: rng.range(1.6, 5), lean: 0 });
        else if (r < 0.1) { const H = pickSize(); add({ x, z, H, y: rng.range(1.5, 8) + H * rng.range(0.3, 2.2), seed: -rng.range(0.05, 0.95), lean: rng.range(0, 0.05) }); }
        else add({ x, z, yaw: rng() < 0.6 ? yawTo(rng.range(-0.9, 0.9), 1) : undefined });
      }
      return doors;
    },
  };
}

const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _e = new THREE.Euler(), _v3 = new THREE.Vector3(), _s3 = new THREE.Vector3(), _ax = new THREE.Vector3();
const X_AXIS = new THREE.Vector3(1, 0, 0), Y_AXIS = new THREE.Vector3(0, 1, 0);

// instance matrix of a door: lean toward the Great Door, yaw, lie flat for trapdoors; sx/sy = stand-in proportions
function doorMatrix(d, sx, sy, out) {
  _q.setFromAxisAngle(Y_AXIS, d.yaw);
  if (d.flat) { _q2.setFromAxisAngle(X_AXIS, -Math.PI / 2); _q.multiply(_q2); }
  else if (d.lean > 0.001) { const dx = -d.x, dz = -d.z, l = Math.hypot(dx, dz) || 1; _ax.set(dz / l, 0, -dx / l); _q2.setFromAxisAngle(_ax, d.lean); _q.premultiply(_q2); }
  return out.compose(_v3.set(d.x, d.y + (d.flat ? 0.1 * d.s : 0), d.z), _q, _s3.set(sx, sy, sx));
}

// Build the instanced meshes: near doors in their own style, mid stand-ins, far cards, plus the ground light.
async function buildDoorMeshes({ doors, styles, mats, bands }, yieldFn) {      // yieldFn (ctx.yield) hands the page back every 256 doors of a mesh or a light band; nothing here draws a random number
  const group = new THREE.Group(); group.name = 'doors';
  const share = (base) => { const g = new THREE.BufferGeometry(); for (const k in base.attributes) g.setAttribute(k, base.attributes[k]); g.boundingSphere = base.boundingSphere; return g; };
  const bandOf = (z, n) => clamp(Math.floor(((z + 260) / 1780) * n), 0, n - 1);
  const buckets = new Map();
  const push = (k, geo, d, sx, sy) => { let b = buckets.get(k); if (!b) buckets.set(k, (b = { geo, list: [] })); b.list.push([d, sx, sy]); };
  const rect = farRect().bakeOpening().build(), arch = farArch().bakeOpening().build(), card = farCard().build();
  let tris = 0;
  for (const d of doors) {
    const st = styles[d.style];
    if (d.near || d.story || d.dist < NEAR) push('n' + d.style + ':' + bandOf(d.z, bands.near), st.geo, d, d.s, d.s);
    else if (d.dist < MID) { const a = ARCHED[d.style]; push((a ? 'a' : 'r') + bandOf(d.z, bands.mid), a ? arch : rect, d, d.s * st.ow, d.H); }
    else push('c' + bandOf(d.z, bands.far), card, d, d.s * st.ow, d.H);
  }
  for (const [, b] of buckets) {
    const n = b.list.length, geo = share(b.geo), mesh = new THREE.InstancedMesh(geo, mats.door, n);
    const aI = new Float32Array(n * 4), aTf = new Float32Array(n * 3), aTl = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      if (i % 256 === 0) await yieldFn();
      const [d, sx, sy] = b.list[i];
      mesh.setMatrixAt(i, doorMatrix(d, sx, sy, _m4));
      aI.set([d.look, d.phase, d.open, d.seed], i * 4); aTf.set([d.tf.r, d.tf.g, d.tf.b], i * 3); aTl.set([d.tl.r, d.tl.g, d.tl.b], i * 3);
    }
    geo.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4)); geo.setAttribute('aTf', new THREE.InstancedBufferAttribute(aTf, 3)); geo.setAttribute('aTl', new THREE.InstancedBufferAttribute(aTl, 3));
    mesh.instanceMatrix.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 3;
    group.add(mesh); tris += n * geo.attributes.position.count / 3;
  }
  // ground light, banded the same way
  const quad = new THREE.PlaneGeometry(1, 1); quad.translate(0, 0.5, 0);
  const lists = Array.from({ length: bands.far }, () => []);
  for (const d of doors) lists[bandOf(d.z, bands.far)].push(d);
  for (const list of lists) {
    if (!list.length) continue;
    const n = list.length, g = new THREE.InstancedBufferGeometry(); g.index = quad.index; g.setAttribute('position', quad.attributes.position);
    const a0 = new Float32Array(n * 4), a1 = new Float32Array(n * 4), aI = new Float32Array(n * 4);
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (let i = 0; i < n; i++) {
      if (i % 256 === 0) await yieldFn();
      const d = list[i], w = d.dW ?? d.s * styles[d.style].ow;
      const off = d.flat ? styles[d.style].cy * d.s : 0;
      a0.set([d.x - Math.sin(d.yaw) * off, d.z - Math.cos(d.yaw) * off, d.yaw, w], i * 4);
      a1.set([d.dL ?? (d.flat ? d.H * 3.2 + 5 : d.H * (2.6 + 0.8 * (Math.abs(d.seed) % 1)) + d.y * 0.6), d.dK ?? (d.flat ? 0.5 : 0.62) / (1 + d.y * 0.12), d.flat ? 1 : 0, 0], i * 4);
      aI.set([d.look, d.phase, d.open, d.seed], i * 4);
      x0 = Math.min(x0, d.x); x1 = Math.max(x1, d.x); z0 = Math.min(z0, d.z); z1 = Math.max(z1, d.z);
    }
    g.setAttribute('aD0', new THREE.InstancedBufferAttribute(a0, 4)); g.setAttribute('aD1', new THREE.InstancedBufferAttribute(a1, 4)); g.setAttribute('aI', new THREE.InstancedBufferAttribute(aI, 4));
    g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, 0, (z0 + z1) / 2), Math.hypot(x1 - x0, z1 - z0) / 2 + 120);
    const mesh = new THREE.Mesh(g, mats.decal); mesh.renderOrder = 1; group.add(mesh); tris += n * 2;
  }
  return { group, triangles: Math.round(tris), calls: group.children.length };
}

// ---------------------------------------------------------------- props: arch, staircase, table, lamp posts, moon
function archProp() {            // 24 m wide, 30 m tall opening; origin at the centre of the opening
  const g = GB(), w = 12, sp = 3, t = 3.2, d = 2.2, y0 = -15;
  for (const s of [-1, 1]) {
    const X = (a, b) => (s > 0 ? [w + a, w + b] : [-w - b, -w - a]);
    // piers in alternating courses, the long ones standing proud like quoins
    for (let k = 0, y = y0 + 1.2; y < sp - 1.3; k++) {
      const h = Math.min(k % 2 ? 1.5 : 2.3, sp - 1.2 - y), o = k % 2 ? 0 : 0.16, [xa, xb] = X(-o * 0.4, t + o);
      g.box(xa, y, -d - o, xb, y + h, d + o, M.FRAME, k % 2 ? 0.84 : 1.02 - 0.04 * (k % 3)); y += h;
    }
    // stepped plinth and a moulded impost under the springing
    let [xa, xb] = X(-0.9, t + 0.9); g.box(xa, y0 - 1.6, -d - 0.8, xb, y0 + 0.2, d + 0.8, M.FRAME, 0.74);
    [xa, xb] = X(-0.55, t + 0.55); g.box(xa, y0 + 0.2, -d - 0.5, xb, y0 + 1.2, d + 0.5, M.FRAME, 0.92);
    [xa, xb] = X(-0.35, t + 0.35); g.box(xa, sp - 1.3, -d - 0.3, xb, sp - 0.75, d + 0.3, M.FRAME, 0.9);
    [xa, xb] = X(-0.75, t + 0.75); g.box(xa, sp - 0.75, -d - 0.6, xb, sp - 0.3, d + 0.6, M.FRAME, 1.2);
    [xa, xb] = X(-0.5, t + 0.5); g.box(xa, sp - 0.3, -d - 0.4, xb, sp, d + 0.4, M.FRAME, 1.0);
    [xa, xb] = X(-0.09, 0.02); g.box(xa, y0 + 1.2, -0.7, xb, sp - 1.3, 0.7, M.GLOW, 0.3, 0, 'td');             // the inner reveal, warm with the Great Door's light
  }
  const NV = 17;                    // voussoirs, alternately proud, and a keystone
  for (let i = 0; i < NV; i++) {
    const a0 = (i / NV) * Math.PI, a1 = ((i + 1) / NV) * Math.PI, o = i % 2 ? 0 : 0.2;
    if (i === (NV - 1) / 2) continue;
    g.arc(0, sp, w - o * 0.3, w + t + o, -d - o, d + o, a0 + 0.004, a1 - 0.004, 2, M.FRAME, i % 2 ? 0.86 : 1.04 - 0.05 * (i % 3));
  }
  g.arc(0, sp, w + t + 0.2, w + t + 0.85, -d - 0.55, d + 0.55, 0, Math.PI, 18, M.FRAME, 0.8, 0, 'fbo');
  g.arc(0, sp, w - 0.09, w - 0.03, -0.7, 0.7, 0.02, Math.PI - 0.02, 18, M.GLOW, 0.3, 0, 'i');
  const ka = Math.PI / NV * 0.62, kx0 = Math.sin(ka) * (w - 0.5), kx1 = Math.sin(ka) * (w + t + 2.1);
  for (const [za, zb, n] of [[d + 0.7, d + 0.7, [0, 0, 1]], [-d - 0.7, -d - 0.7, [0, 0, -1]]]) g.quad([-kx0, sp + w - 0.6, za], [kx0, sp + w - 0.6, za], [kx1, sp + w + t + 1.7, zb], [-kx1, sp + w + t + 1.7, zb], n, M.FRAME, 1.28);
  g.quad([-kx0, sp + w - 0.6, -d - 0.7], [-kx0, sp + w - 0.6, d + 0.7], [-kx1, sp + w + t + 1.7, d + 0.7], [-kx1, sp + w + t + 1.7, -d - 0.7], [-1, 0, 0], M.FRAME, 1.0);
  g.quad([kx0, sp + w - 0.6, d + 0.7], [kx0, sp + w - 0.6, -d - 0.7], [kx1, sp + w + t + 1.7, -d - 0.7], [kx1, sp + w + t + 1.7, d + 0.7], [1, 0, 0], M.FRAME, 1.0);
  g.quad([-kx1, sp + w + t + 1.7, d + 0.7], [kx1, sp + w + t + 1.7, d + 0.7], [kx1, sp + w + t + 1.7, -d - 0.7], [-kx1, sp + w + t + 1.7, -d - 0.7], [0, 1, 0], M.FRAME, 1.4);
  g.quad([-kx0, sp + w - 0.6, -d - 0.7], [kx0, sp + w - 0.6, -d - 0.7], [kx0, sp + w - 0.6, d + 0.7], [-kx0, sp + w - 0.6, d + 0.7], [0, -1, 0], M.FRAME, 0.7);
  g.arc(0, sp + w + t * 0.55, 0.5, 0.85, d + 0.7, d + 0.82, 0, TAU, 10, M.METAL, 1.1, 0, 'fo'); g.arc(0, sp + w + t * 0.55, 0.5, 0.85, -d - 0.82, -d - 0.7, 0, TAU, 10, M.METAL, 1.1, 0, 'bo');
  return g;
}
function stairProp(rise, steps, width = 2.4) {     // climbs toward +z from the origin
  const g = GB(), r = rise / steps, going = 0.52;
  for (let i = 0; i < steps; i++) g.box(-width / 2, i * r - 0.12, i * going, width / 2, (i + 1) * r, (i + 1) * going + 0.06, M.PALE, 0.95 + 0.1 * (i % 2), 0, 'b');
  g.box(-width / 2, rise - 0.3, steps * going, width / 2, rise, steps * going + 2.2, M.PALE, 1);
  for (const s of [-1, 1]) for (let i = 0; i <= steps; i += 5) { const x = s * (width / 2 - 0.08), z = i * going + 0.2; g.box(x - 0.04, i * r, z - 0.04, x + 0.04, i * r + 1.0, z + 0.04, M.METAL, 1, 0, 'd'); }
  return g;
}
function tableProp(len, candles) {                 // long dining table set for no one, along x
  const g = GB(), w = 0.65, h = 0.78;
  g.box(-len / 2, h - 0.05, -w, len / 2, h, w, M.PALE, 1.15);
  g.box(-len / 2 - 0.03, h - 0.42, -w - 0.03, len / 2 + 0.03, h - 0.04, w + 0.03, M.PALE, 0.9, 0, 'td');       // the cloth hanging
  for (let x = -len / 2 + 0.3; x <= len / 2 - 0.2; x += (len - 0.6) / 4) for (const s of [-1, 1]) g.box(x - 0.05, 0, s * (w - 0.12) - 0.05, x + 0.05, h - 0.05, s * (w - 0.12) + 0.05, M.LEAF, 0.7, 0, 'td');
  for (let x = -len / 2 + 0.7; x < len / 2 - 0.4; x += 0.95) for (const s of [-1, 1]) {
    const z = s * (w + 0.42);
    g.box(x - 0.22, 0.42, z - 0.22, x + 0.22, 0.47, z + 0.22, M.LEAF, 1); g.box(x - 0.22, 0.47, z + s * 0.18 - 0.02, x + 0.22, 1.05, z + s * 0.18 + 0.02, M.LEAF, 0.9, 0, 'd');
    for (const lx of [-0.19, 0.19]) for (const lz of [-0.19, 0.19]) g.box(x + lx - 0.02, 0, z + lz - 0.02, x + lx + 0.02, 0.42, z + lz + 0.02, M.LEAF, 0.7, 0, 'td');
    g.box(x - 0.13, h, s * (w - 0.3) - 0.13, x + 0.13, h + 0.015, s * (w - 0.3) + 0.13, M.PALE, 1.35, 0, 'd');   // a plate
    g.box(x + 0.2, h, s * (w - 0.32) - 0.03, x + 0.26, h + 0.13, s * (w - 0.32) + 0.03, M.PAPER, 1.2, 0, 'd');   // a glass
  }
  for (let x = -len / 2 + 1.2; x < len / 2 - 1; x += (len - 2.4) / 4) {
    g.box(x - 0.09, h, -0.09, x + 0.09, h + 0.04, 0.09, M.METAL, 1); g.box(x - 0.025, h + 0.04, -0.025, x + 0.025, h + 0.42, 0.025, M.PALE, 1.3, 0, 'd');
    g.box(x - 0.03, h + 0.43, -0.03, x + 0.03, h + 0.53, 0.03, M.GLOW, 1.6); candles.push([x, h + 0.5, 0]);
  }
  return g;
}
// the last door: a dark stone doorway standing in the Great Door's slot, so the portal reads against the blinding light
function exitFrameProp(w, h) {    // opening 2w wide, h tall; origin at the middle of the threshold, front toward +z
  const g = GB(), t = 3.5, d0 = -0.3, d1 = 2.1, sh = 1, D = M.DARK;
  for (const s of [-1, 1]) {
    g.box(s > 0 ? w : -w - t, 0, d0, s > 0 ? w + t : -w, h, d1, D, sh, 0, 'dt');
    g.box(s > 0 ? w - 0.3 : -w - t - 0.7, 0, d0 - 0.2, s > 0 ? w + t + 0.7 : -w + 0.3, 2.0, d1 + 0.5, D, sh * 0.85, 0, 'd');
    g.box(s > 0 ? w - 0.25 : -w - t - 0.5, h - 1.5, d0 - 0.1, s > 0 ? w + t + 0.5 : -w + 0.25, h, d1 + 0.4, D, sh * 1.15, 0, 'd');
    g.box(s > 0 ? w + 1.1 : -w - 1.45, 2.0, d1, s > 0 ? w + 1.45 : -w - 1.1, h - 1.5, d1 + 0.06, M.GLOW, 0.75, 0, 'b');      // a seam of light up each jamb
    g.box(s > 0 ? w + 2.3 : -w - 2.45, 2.0, d1, s > 0 ? w + 2.45 : -w - 2.3, h - 1.5, d1 + 0.06, M.GLOW, 0.3, 0, 'b');
  }
  g.box(-w - t - 0.4, h, d0, w + t + 0.4, h + 3.4, d1, D, sh);
  g.box(-w + 0.6, h + 1.2, d1, w - 0.6, h + 1.45, d1 + 0.06, M.GLOW, 0.5, 0, 'b');                                         // and one across the lintel
  g.box(-w - t - 1.2, h + 3.4, d0 - 0.4, w + t + 1.2, h + 4.5, d1 + 0.7, D, sh * 1.2);
  const a = -w - t - 1.5, b = w + t + 1.5, y = h + 4.5, top = h + 11, zf = d1 + 0.75, zb = d0 - 0.45;
  g.tri([a, y, zf], [b, y, zf], [0, top, zf], [0, 0, 1], D, sh * 0.9); g.tri([b, y, zb], [a, y, zb], [0, top, zb], [0, 0, -1], D, sh * 0.9);
  g.quad([a, y, zb], [a, y, zf], [0, top, zf], [0, top, zb], [-0.5, 0.86, 0], D, sh * 1.2); g.quad([b, y, zf], [b, y, zb], [0, top, zb], [0, top, zf], [0.5, 0.86, 0], D, sh * 1.2);
  g.arc(0, h + 6.9, 0.75, 1.25, zf, zf + 0.14, 0, TAU, 14, M.GLOW, 0.6, 0, 'fo');                                          // a ring of light, like every door here
  return g;
}
function lampProp() {
  const g = GB();
  g.box(-0.16, 0, -0.16, 0.16, 0.35, 0.16, M.METAL, 0.5, 0, 'd'); g.box(-0.055, 0.35, -0.055, 0.055, 3.1, 0.055, M.METAL, 0.5, 0, 'd');
  g.box(-0.3, 2.62, -0.03, 0.3, 2.68, 0.03, M.METAL, 0.5); g.box(-0.2, 3.1, -0.2, 0.2, 3.16, 0.2, M.METAL, 0.5);
  g.box(-0.13, 3.16, -0.13, 0.13, 3.52, 0.13, M.GLOW, 1, 0, 'd'); g.box(-0.21, 3.52, -0.21, 0.21, 3.58, 0.21, M.METAL, 0.5);
  g.box(-0.05, 3.58, -0.05, 0.05, 3.74, 0.05, M.METAL, 0.6);
  return g;
}
// the moon: a round door in the sky, slightly open
function makeMoon(light) {
  const tint = (g, cols) => {
    const geo = g.build(), aP = geo.attributes.aP, c = new Float32Array(aP.count * 3);
    for (let i = 0; i < aP.count; i++) { const k = cols[aP.getX(i)] || cols[0], s = aP.getX(i) === M.BEYOND ? 1 : aP.getY(i); c[i * 3] = k[0] * s; c[i * 3 + 1] = k[1] * s; c[i * 3 + 2] = k[2] * s; }
    geo.setAttribute('color', new THREE.BufferAttribute(c, 3)); geo.deleteAttribute('aP'); return geo;
  };
  const cols = { [M.FRAME]: [0.62, 0.58, 0.72], [M.LEAF]: [0.80, 0.76, 0.84], [M.METAL]: [0.9, 0.75, 0.5], [M.BEYOND]: [light.r * 3.4, light.g * 3.2, light.b * 3.0] };
  const mat = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
  const ring = GB(); ring.arc(0, 0, 1, 1.16, -0.1, 0.1, 0, TAU, 40, M.FRAME, 1); ring.arc(0, 0, 0, 1, -0.02, -0.02, 0, TAU, 40, M.BEYOND, 1, 0, 'f');
  const leaf = GB(); leaf.arc(1, 0, 0, 0.99, -0.03, 0.05, 0, TAU, 40, M.LEAF, 1, 0, 'fbo');
  for (let i = 0; i < 9; i++) { const a = i * 2.4, r = 0.15 + 0.08 * i, cr = 0.05 + 0.035 * ((i * 7) % 5); leaf.arc(1 + Math.cos(a) * r, Math.sin(a) * r, 0, cr, 0.05, 0.055, 0, TAU, 10, M.LEAF, 0.86, 0, 'f'); }   // maria
  leaf.arc(1.72, 0, 0.06, 0.1, 0.05, 0.09, 0, TAU, 10, M.METAL, 1, 0, 'fo');
  const group = new THREE.Group(), a = new THREE.Mesh(tint(ring, cols), mat), pivot = new THREE.Group(), b = new THREE.Mesh(tint(leaf, cols), mat);
  pivot.position.x = -1; pivot.add(b); group.add(a, pivot);
  for (const m of [a, b]) { m.frustumCulled = false; m.renderOrder = -0.5; }
  return { group, pivot };
}

// ---------------------------------------------------------------- the world
const MOODS = [
  { name: 'apricot dusk', zen: '#1a1440', mid: '#5a3f8a', hor: '#e88a6a', stars: 0.55 },
  { name: 'rose dusk', zen: '#140f38', mid: '#573a8c', hor: '#e07a86', stars: 0.8 },
  { name: 'amber dusk', zen: '#211a52', mid: '#66468c', hor: '#f09a62', stars: 0.4 },
];

export default {
  id: 'field-of-doors', name: 'The Field of Doors', category: 'bizarre', weirdness: 0.9,
  async build(ctx) {
    const rng = ctx.rng, scene = new THREE.Scene(), C = (h) => new THREE.Color(h);
    const updaters = [], disposables = [];

    // ---- per-seed mood: which dusk, how wet, how misty, which world dominates the doors, which way the route bends
    const mood = MOODS[rng.int(0, MOODS.length - 1)], flip = rng.sign(), wet = rng.range(0, 1), mistAmt = rng.range(0.65, 1.25), weather = rng.int(0, 2);
    const zen = C(mood.zen), mid = C(mood.mid), hor = C(mood.hor).lerp(C('#e88a6a'), rng.range(0, 0.4));
    const fogCol = hor.clone().lerp(mid, 0.55).multiplyScalar(0.5), fogD = 0.00098 * lerp(0.92, 1.1, rng());
    scene.fog = new THREE.FogExp2(fogCol, fogD);
    const lookWeights = [14, 20, 12, 12, 12, 10, 10, 10]; lookWeights[rng.int(0, 7)] *= 2.6;

    const sky = makeSky({ rng: rng.fork('sky'), preset: 'blueHour', zenith: zen, mid, horizon: hor, ground: fogCol, horizonPow: 8, midPow: 2.2,
      scatter: 0, sunIntensity: 0, sunGlow: 0, sunElevation: -25, stars: mood.stars, milkyWay: 0.12, bodies: [], clouds: false, clouds2: false, fogColor: fogCol });
    scene.add(sky.object); updaters.push(sky);

    const hemi = new THREE.HemisphereLight(mid.clone().lerp(C('#b49cff'), 0.45), C('#3a2c4a'), 2.3);
    const fill = new THREE.DirectionalLight(hor.clone().lerp(C('#ffffff'), 0.25), 0.9); fill.position.set(60 * flip, 90, 130);
    scene.add(hemi, fill, fill.target);
    const ambSky = hemi.color.clone().multiplyScalar(hemi.intensity / Math.PI), ambGnd = hemi.groundColor.clone().multiplyScalar(hemi.intensity / Math.PI);
    await ctx.yield();

    // ---- the Great Door
    const hero = await buildHero(ctx, { palette: [mood.zen, mood.mid, '#' + hor.getHexString(), PALETTE[3], PALETTE[4], PALETTE[5], PALETTE[6]], motes: 6000 });
    const seat = hero.anchors.portalSeat, heroX = -seat.position.x;
    hero.object.position.set(heroX, 0, 0); scene.add(hero.object);
    const seatY = seat.position.y, keyCol = hero.anchors.lightColor.clone();
    await ctx.yield();

    // ---- the flight
    const f = flip, peak = rng.range(68, 78);
    const path = makePath([[-72 * f, 2.7, 1300], [-64 * f, 2.8, 1215], [-42 * f, 3.4, 1128], [-12 * f, 4.4, 1042], [27 * f, 22, 946], [56 * f, peak - 18, 852], [53 * f, peak, 765],
      [30 * f, peak - 14, 662], [9 * f, 40, 572], [1 * f, 30, 500], [0, 23, 400], [0, 17, 250], [0, seatY, 112], [0, seatY, 0]]);
    const at = (u, lat = 0, fwd = 0, y = null) => { const d = u * path.length + fwd, P = path.posAtDist(d), T = path.tangentAtDist(d); T.y = 0; T.normalize(); return { P, T, x: P.x - T.z * lat, z: P.z + T.x * lat, y: y ?? P.y }; };

    // ---- uniforms shared by the door, light and ground shaders
    const U = {
      uTime: { value: 0 }, uLooks: { value: LOOKS.map((l) => C(l[1])).concat([C('#000000')]) }, uSky: { value: ambSky.clone().multiplyScalar(1.15) }, uGnd: { value: ambGnd },
      uKeyCol: { value: keyCol.clone().multiplyScalar(1.5) }, uKeyPos: { value: new THREE.Vector3(0, 170, 0) }, uFogCol: { value: fogCol }, uFogD: { value: fogD },
      uMetal: { value: C('#b08a4a') }, uPale: { value: C('#d6cfc4') }, uLamp: { value: C('#ffc27a').multiplyScalar(3.2) }, uOpen: { value: 1 },
      uZen: { value: zen }, uMid: { value: mid }, uHor: { value: hor }, uGrassA: { value: C('#565a58') }, uGrassB: { value: C('#8c8e7c') },
      uAmb: { value: ambSky.clone().add(fill.color.clone().multiplyScalar(fill.intensity * 0.55 / Math.PI)) }, uStone: { value: fogCol.clone().multiplyScalar(0.8) },
      uPud: { value: lerp(0.76, 0.58, wet) }, uSkyPow: { value: new THREE.Vector2(2.2, 8) }, uFrame: { value: new THREE.Vector2(heroX, hero.height) },
      uSp: { value: new THREE.Vector4() }, uSp2: { value: new THREE.Vector4(36, 0.3, 4, 560) }, uSpCol: { value: keyCol.clone().lerp(C('#ff9a50'), 0.7).multiplyScalar(0.72) },
    };
    const mats = { door: makeDoorMaterial(U), decal: makeDecalMaterial(U) };

    // ---- the ground: pale grass and shallow puddles, one big sheet
    const groundGeo = new THREE.PlaneGeometry(10000, 10000); groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, makeGroundMaterial(U)); ground.position.set(0, 0, 500); ground.frustumCulled = false; scene.add(ground);
    await ctx.yield();

    // ---- door styles and the layout
    const styles = STYLES.map((fn) => { const s = fn(); s.g.bakeOpening(); return { geo: s.g.build(), tris: s.g.triangles, ow: s.ow, oh: s.oh, cy: s.cy }; });
    await ctx.yield();
    const pA = at(0.6), spiral = { cx: pA.P.x, cz: pA.P.z - 20, arms: 3, b: rng.range(0.4, 0.47), r0: 36, r1: 560, rEx: 500, dir: rng.sign(), rot: rng.range(0, TAU) };
    U.uSp.value.set(spiral.cx, spiral.cz, spiral.dir, spiral.rot); U.uSp2.value.set(spiral.r0, spiral.b, spiral.arms, spiral.r1);
    const P0 = path.pointAt(0, new THREE.Vector3());
    const L = layoutDoors({ rng: rng.fork('doors'), path, styles, heroX, spiral, lookWeights, total: 9600, entry: [P0.x, P0.z] });
    const story = {}, yawOf = (fx, fz) => Math.atan2(fx, fz), frontOf = (d) => new THREE.Vector3(Math.sin(d.yaw), 0, Math.cos(d.yaw)), rightOf = (d) => new THREE.Vector3(Math.cos(d.yaw), 0, -Math.sin(d.yaw));
    const S = (o) => L.add({ force: true, arm: true, seed: STORY_SEED + 10 * rng.int(0, 9), open: 1.65, lean: 0, ...o });
    // the snow door: 8 m tall, 10 m from the path at u = 0.2, on the right
    { const a = at(0.2, 14 * f, 52), fx = -a.T.x * 0.75 + a.T.z * f * 0.66, fz = -a.T.z * 0.75 - a.T.x * f * 0.66;
      story.snow = S({ x: a.x, z: a.z, H: 8, style: 0, look: LOOK.snow, yaw: yawOf(fx, fz), open: 1.45 }); L.keep.push([a.x, a.z, 9]); }
    // the fox: it trots out of a small snowy gate, crosses in profile through the long light of a bright doorway standing behind
    // its track (so it is a small back-lit shape, never close), and slips through the next door
    const foxCross = { path, u: 0.2, window: 0.1, lead: 28, span: 28, angle: 68, side: -f, offset: -20 * f, height: 0, bow: 0 };
    { const pts = F.crossPoints(path, foxCross), a = pts[0], b = pts[pts.length - 1], dx = b.x - a.x, dz = b.z - a.z, cam = path.pointAt(foxCross.u, new THREE.Vector3());
      const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, ll = Math.hypot(mx - cam.x, mz - cam.z), lx = (mx - cam.x) / ll, lz = (mz - cam.z) / ll;
      story.foxOut = S({ x: a.x - dx * 0.06, z: a.z - dz * 0.06, H: 2.5, style: 4, look: LOOK.snow, yaw: yawOf(dx, dz), open: 1.9, noLamp: true });
      story.foxIn = S({ x: b.x + dx * 0.06, z: b.z + dz * 0.06, H: 3.3, style: 1, look: LOOK.sunset, yaw: yawOf(-dx, -dz), open: 1.9, noLamp: true });
      story.foxLight = S({ x: mx + lx * 12, z: mz + lz * 12, H: 7.5, style: 6, look: LOOK.snow, yaw: yawOf(-lx, -lz), open: 2.1, dL: 36, dK: 1.0, dW: 7.5, noLamp: true });
      L.keep.push([mx, mz, 22]); }
    // two tall doors flank the way in: a lit avenue, and two colour accents when this world is first seen through a portal
    { const a = at(0.052, 17.5 * f), c = at(0.06, -18.5 * f);
      story.aveA = S({ x: a.x, z: a.z, H: 12.5, style: 1, look: LOOK.sunset, yaw: yawOf(-a.T.x + a.T.z * f * 0.45, -a.T.z - a.T.x * f * 0.45), open: 1.7, dL: 40, dK: 0.75 }); L.keep.push([a.x, a.z, 10]);
      story.aveB = S({ x: c.x, z: c.z, H: 11, style: 0, look: LOOK.aurora, yaw: yawOf(-c.T.x - c.T.z * f * 0.45, -c.T.z + c.T.x * f * 0.45), open: 1.7, dL: 36, dK: 0.75 }); L.keep.push([c.x, c.z, 9]); }
    // two great doors for the birds to cross between, under the high point of the flight
    const bu = 0.43, bm = path.posAtDist(bu * path.length + 125), birdCross = { path, u: bu, window: 0.2, lead: 125, span: 300, angle: 74, side: f, height: 42 - bm.y, sag: -29 };
    { const pts = F.crossPoints(path, birdCross), a = pts[0], b = pts[pts.length - 1], dx = b.x - a.x, dz = b.z - a.z;
      story.birdOut = S({ x: a.x, z: a.z, H: 28, style: 6, look: LOOK.noon, yaw: yawOf(dx, dz), open: 1.5 });
      story.birdIn = S({ x: b.x, z: b.z, H: 26, style: 1, look: LOOK.sunset, yaw: yawOf(-dx, -dz), open: 1.5 }); }
    // garden gate with butterflies and roses; a door with a tree growing through; desert, sea and autumn doors that leak their weather
    { const a = at(0.085, -9.5 * f); story.gate = S({ x: a.x, z: a.z, H: 3.4, style: 4, look: LOOK.garden, yaw: yawOf(-a.T.x - a.T.z * f * 0.5, -a.T.z + a.T.x * f * 0.5) }); L.keep.push([a.x, a.z, 5]); }
    { const a = at(0.14, 17 * f); story.tree = S({ x: a.x, z: a.z, H: 9, style: 1, look: LOOK.noon, yaw: yawOf(-a.T.x + a.T.z * f * 0.5, -a.T.z - a.T.x * f * 0.5), open: 2.0 }); L.keep.push([a.x, a.z, 10]); }
    { const a = at(0.038, -10.5 * f); story.desert = S({ x: a.x, z: a.z, H: 4.2, style: 7, look: LOOK.desert, yaw: yawOf(-a.T.x - a.T.z * f * 0.6, -a.T.z + a.T.x * f * 0.6) }); L.keep.push([a.x, a.z, 5]); }
    { const a = at(0.29, 23 * f); story.sea = S({ x: a.x, z: a.z, y: 5, H: 7, style: 3, look: LOOK.sea, yaw: yawOf(-a.T.x + a.T.z * f * 0.7, -a.T.z - a.T.x * f * 0.7), seed: -STORY_SEED }); L.keep.push([a.x, a.z, 8]); }
    { const a = at(0.155, -12 * f); story.autumn = S({ x: a.x, z: a.z, H: 5, style: 0, look: LOOK.sunset, yaw: yawOf(-a.T.x - a.T.z * f * 0.6, -a.T.z + a.T.x * f * 0.6) }); L.keep.push([a.x, a.z, 6]); }
    // the staircase to a door in mid-air, and the long table set for no one between two doors
    { const a = at(0.3, -30 * f, 30), yaw = yawOf(-a.T.x, -a.T.z); story.air = S({ x: a.x, z: a.z, y: 11, H: 4.4, style: 7, look: LOOK.void, yaw, seed: STORY_SEED }); L.keep.push([a.x - a.T.x * 11, a.z - a.T.z * 11, 16]); }
    { const a = at(0.1, 13.5 * f), rx = -a.T.z * f, rz = a.T.x * f, yaw = yawOf(rx, rz);
      story.tableA = S({ x: a.x, z: a.z, H: 3.2, style: 6, look: LOOK.sunset, yaw, open: 1.8 });
      story.tableB = S({ x: a.x + rx * 15, z: a.z + rz * 15, H: 3.2, style: 0, look: LOOK.aurora, yaw: yaw + Math.PI, open: 1.8 }); story.table = { x: a.x + rx * 7.5, z: a.z + rz * 7.5, rx, rz }; L.keep.push([a.x + rx * 7.5, a.z + rz * 7.5, 9.5]); }
    L.keep.push([spiral.cx, spiral.cz + 20, 24]);            // room for the floating arch
    const doors = await L.fill(ctx.yield);
    await ctx.yield();
    const built = await buildDoorMeshes({ doors, styles, mats, bands: { near: 3, mid: 4, far: 3 } }, ctx.yield);
    scene.add(built.group);
    await ctx.yield();

    // ---- props in one mesh: the floating arch, the staircase, the table, lamp posts
    const props = GB(), candles = [], lampTops = [], vineSpans = [];
    const archYaw = Math.atan2(-pA.T.x, -pA.T.z), archM = new THREE.Matrix4().makeRotationY(archYaw).setPosition(pA.P.x, pA.P.y, pA.P.z);
    props.append(archProp(), archM);
    await ctx.yield();
    props.append(exitFrameProp(seat.width / 2 + 0.35, seat.height + 0.5), new THREE.Matrix4().makeTranslation(0, seat.floorY, 0));
    { const d = story.air, fr = frontOf(d), run = 37 * 0.52 + 2.2;
      props.append(stairProp(d.y, 37), new THREE.Matrix4().makeRotationY(Math.atan2(-fr.x, -fr.z)).setPosition(d.x + fr.x * run, 0, d.z + fr.z * run)); }
    await ctx.yield();
    { const t = story.table, m = new THREE.Matrix4().makeRotationY(Math.atan2(-t.rz, t.rx)).setPosition(t.x, 0, t.z), local = [];
      props.append(tableProp(9.5, local), m); for (const c of local) candles.push(new THREE.Vector3(c[0], c[1], c[2]).applyMatrix4(m)); }
    await ctx.yield();
    { const lamp = lampProp(), lr = rng.fork('lamps'); let n = 0;
      for (const d of doors) {
        if (n >= 40 || d.noLamp || d.flat || d.y > 0 || d.H > 6 || d.dist > 46 || lr() > (d.story ? 0.6 : 0.2)) continue;
        const r = rightOf(d), sd = lr.sign(), x = d.x + r.x * (d.hw + 0.7) * sd, z = d.z + r.z * (d.hw + 0.7) * sd;
        if (path.nearestXZ(x, z).dist < 7.5) continue;
        props.append(lamp, new THREE.Matrix4().makeRotationY(d.yaw).setPosition(x, 0, z)); lampTops.push(new THREE.Vector3(x, 3.34, z)); n++;
      } }
    await ctx.yield();
    { const geo = props.build(), n = geo.attributes.position.count, aI = new Float32Array(n * 4), aTf = new Float32Array(n * 3), aTl = new Float32Array(n * 3);
      const stone = C('#b9b0a6'), wood = C('#5a3a26');
      for (let i = 0; i < n; i++) { if (i % 2048 === 0) await ctx.yield(); aI.set([8, 0, 1.2, 0.5], i * 4); aTf.set([stone.r, stone.g, stone.b], i * 3); aTl.set([wood.r, wood.g, wood.b], i * 3); }
      geo.setAttribute('aI', new THREE.BufferAttribute(aI, 4)); geo.setAttribute('aTf', new THREE.BufferAttribute(aTf, 3)); geo.setAttribute('aTl', new THREE.BufferAttribute(aTl, 3));
      const mesh = new THREE.Mesh(geo, mats.door); mesh.frustumCulled = false; mesh.name = 'props'; scene.add(mesh); }
    await ctx.yield();

    // ---- the moon: a round door in the sky, slightly open
    const moon = makeMoon(keyCol), moonAz = (rng.range(16, 30) * -f * Math.PI) / 180, moonEl = (rng.range(15, 23) * Math.PI) / 180;
    const moonDir = new THREE.Vector3(Math.sin(moonAz) * Math.cos(moonEl), Math.sin(moonEl), -Math.cos(moonAz) * Math.cos(moonEl));
    moon.group.scale.setScalar(rng.range(120, 165)); scene.add(moon.group);

    // ---- flora: short pale grass by the low part of the flight, a tree through a doorway, roses and ivy on frames
    const wind = flora.makeWind({ direction: [0.15 * f, 1], strength: 0.9, speed: 0.9 });
    const fmat = flora.windMaterial({ wind, ambient: 2.4, leafAmbient: 2.2 });
    await ctx.yield();
    const gA = U.uGrassA.value, gB = U.uGrassB.value, pud = U.uPud.value;
    const beams = Object.values(story).filter((d) => d && d.H && d.y === 0 && !d.flat).map((d) => ({ x: d.x, z: d.z, fx: Math.sin(d.yaw), fz: Math.cos(d.yaw), w: d.dW ?? d.s * styles[d.style].ow, L: d.dL ?? d.H * 3.3 }));
    const inBeam = (x, z) => { for (const b of beams) { const dx = x - b.x, dz = z - b.z, f = dx * b.fx + dz * b.fz; if (f < -0.5 || f > b.L) continue; const l = Math.abs(dx * b.fz - dz * b.fx); if (l < b.w * (0.7 + 1.1 * f / b.L) + 0.8 + f * 0.25) return true; } return false; };
    const grass = await flora.makeGrassAsync({ rng: rng.fork('grass'), path, uRange: [0, 0.29], radius: 20, count: 38000, chunks: 6, fade: [34, 52], bias: 1.3, wind, map: fmat.map,
      width: [0.6, 1.0], height: [0.4, 0.9], flowers: 0, root: '#565a58', tip: '#7e827c', materialOptions: { ambient: 1.15, leafAmbient: 1.15, backlight: 0.7, sheen: 0.5 },
      density: (x, z) => (puddleField(x, z) > pud - 0.06 || inBeam(x, z) ? 0 : 1), groundColor: (x, z) => gA.clone().lerp(gB, clamp(groundTone(x, z), 0, 1)).multiplyScalar(1.3) }, ctx.yield);
    scene.add(grass.object); updaters.push(grass);
    await ctx.yield();
    { const d = story.tree, fr = frontOf(d), tree = new THREE.Mesh(flora.cherryGeometry({ rng: rng.fork('tree'), height: 8.6, detail: 2 }), fmat);
      tree.position.set(d.x - fr.x * 2.1, 0, d.z - fr.z * 2.1); tree.rotation.set(0.42, d.yaw, 0, 'YXZ'); scene.add(tree); story.treePos = new THREE.Vector3(d.x + fr.x * 2, 6, d.z + fr.z * 2); }
    await ctx.yield();
    const climb = (d) => { const r = rightOf(d), fr = frontOf(d), st = styles[d.style], w = d.s * (st.ow * 0.5 + 0.08), o = 0.1 * d.s + 0.05, top = d.y + d.H * 1.0;
      const P = (sx, y) => [d.x + r.x * w * sx + fr.x * o, y, d.z + r.z * w * sx + fr.z * o];
      vineSpans.push([P(-1, d.y + 0.15), P(-1, top)], [P(-1, top), P(1, top + 0.12)], [P(1, top + 0.12), P(1, d.y + d.H * 0.35)]); };
    climb(story.gate); climb(story.autumn); climb(story.tableB);
    { const vr = rng.fork('vines'); let n = 0; for (const d of doors) { if (n >= 7) break; if (d.story || d.flat || d.y > 0 || d.dist > 26 || d.H > 7 || d.H < 2.6 || vr() > 0.12) continue; climb(d); n++; } }
    { const vr = rng.fork('curtain');                     // ivy curtains of differing length trailing from each foot of the floating arch
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) {
        const x = sx * (12.2 + k * 1.05), z = (k % 2 ? -1 : 1) * vr.range(0.6, 2.4), len = [21, 9, 15, 6][(k + (sx > 0 ? 1 : 0)) % 4] + vr.range(-2, 3);
        const p0 = new THREE.Vector3(x, -16.4, z).applyMatrix4(archM), p1 = new THREE.Vector3(x + vr.range(-1.2, 1.2), -16.4 - len, z + vr.range(-1, 1)).applyMatrix4(archM);
        vineSpans.push([p0.toArray(), p1.toArray()]);
      }
      for (const sx of [-1, 1]) { const p0 = new THREE.Vector3(sx * 12.1, -14.8, 2.4).applyMatrix4(archM), p1 = new THREE.Vector3(sx * 12.1, 1.5, 2.4).applyMatrix4(archM); vineSpans.push([p0.toArray(), p1.toArray()]); } }
    const vines = flora.makeVines({ rng: rng.fork('ivy'), material: fmat, spans: vineSpans, sag: 0.14, flower: rng.pick(['#e0506a', '#f2c0d0', '#e86a80']) });
    scene.add(vines.object);
    await ctx.yield();

    // ---- fauna: things passing between worlds
    const faunaLight = { sunDir: [0.1 * f, 0.3, -1], sunColor: keyCol, sunIntensity: 2.2, sky: hemi.color, skyIntensity: 2.0, ground: '#5a4668', groundIntensity: 1.1 };
    const fauna = [];
    const birds = F.makeFlock({ rng: rng.fork('birds'), species: 'gulls', count: rng.int(40, 70), size: 2.5, light: faunaLight, cross: birdCross, spread: [16, 7, 46],
      body: '#ffffff', belly: '#ffffff', wingC: '#e8e6f0', trail: '#f4f2f8', tip: '#cfc8dc', head: '#ffffff' });
    await ctx.yield();
    const doves = F.makeFlock({ rng: rng.fork('doves'), species: rng.pick(['gulls', 'geese', 'swifts']), count: rng.int(10, 22), size: 2.0, light: faunaLight,
      center: [70 * -f, rng.range(70, 120), 190], radius: rng.range(90, 130), height: 26 });
    const FOX = { ...F.HERD_PRESETS.deer, h: 0.52, bodyLen: 1.3, width: 0.3, depth: 0.36, neckLen: 0.3, neckAng: 28, headLen: 0.42, headPitch: 6, ears: 0.24, tail: 0.8, tailType: 'flow',
      antlers: 0, coat: '#d0642a', belly: '#f2e8da', legs: '#4a2c20', sock: '#2a1c18', accent: '#f6efe2', pattern: 'none', speed: 3.2, stride: 0.5, varieties: 0 };
    const fox = F.makeHerd({ rng: rng.fork('fox'), preset: FOX, count: 1, size: 3.0, sizes: [1], mode: 'migrate', cross: foxCross, spread: [0, 0], heightAt: () => 0, light: faunaLight });
    await ctx.yield();
    const gfr = frontOf(story.gate);
    const flutter = F.makeButterflies({ rng: rng.fork('flutter'), center: [story.gate.x + gfr.x * 5.5, 2.4, story.gate.z + gfr.z * 5.5], radius: 8.5, count: rng.int(90, 140), size: 3.2,
      heightAt: () => 0, altitude: [0.5, 6], light: faunaLight });
    // dark swifts wheeling through the light in front of the slot, above the last door
    const wheel = []; { const n = 10, ph = rng.range(0, TAU), tilt = rng.range(-0.5, 0.5);
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU + ph; wheel.push([Math.cos(a) * 32, seatY + 16.5 + 6 * Math.sin(a + tilt), 34 + Math.sin(a) * 20]); } }
    const swifts = F.makeFlock({ rng: rng.fork('swifts'), species: 'swifts', count: rng.int(26, 38), size: 3, light: faunaLight, route: wheel, closed: true, speed: 14, spread: [6, 3, 70],
      body: '#1c1626', belly: '#2a2034', wingC: '#181220', trail: '#221a2c', tip: '#120e18', head: '#1c1626' });
    fauna.push(birds, doves, fox, flutter, swifts);
    if (lampTops.length) fauna.push(F.makeMoths({ rng: rng.fork('moths'), positions: lampTops.slice(0, 24).map((p) => [p.x, p.y, p.z]), jitter: 0.7, count: 70, size: 1.8, light: faunaLight }));
    for (const c of fauna) scene.add(c.object);
    await ctx.yield();

    // ---- atmosphere: low mist that catches every beam, golden motes on the outward wind, weather leaking from the doors
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    set.add(fx.makeGroundFog({ rng: rng.fork('mist'), time, layers: 4, size: 1100, y: 0.2, height: 8 + 5 * mistAmt, color: mid.clone().lerp(hor, 0.35),
      opacity: 0.085 * mistAmt, coverage: 0.42, scale: 0.0065, wind: [0.5 * f, 1.5], sunDir: [0, 0.25, -1], sunColor: keyCol, scatter: 0.5 }));
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'dust', time, count: 1300, box: [70, 34, 70], velocity: [0.15 * f, 0.05, 1.1], velocityRandom: [0.3, 0.15, 0.4],
      size: [0.03, 0.085], colors: ['#ffd9a0', '#fff1d0', '#ffc27a'], intensity: 1.5 }));
    set.add(fx.makeParticles({ rng: rng.fork('gold'), preset: 'magic', time, follow: false, center: [0, seatY + 3, 95], box: [34, 24, 190], velocity: [0, 0.25, 7], velocityRandom: [1.2, 0.6, 2.5],
      count: 2200, size: [0.1, 0.32], colors: ['#ffd9a0', '#ffb45e', '#fff1d0'], intensity: 2.6 }));
    set.add(fx.makeMist({ rng: rng.fork('sill'), time, count: 56, area: [140, 8, 170], center: [0, 6.5, 215], size: [14, 30], color: '#ffe0b4', opacity: 0.12 * mistAmt, drift: [0.4 * f, 0, 5.5] }));
    // the last hundred metres: a fast outward stream of motes at eye height and sheets of lit mist sliding over the paving, under the camera's line
    set.add(fx.makeParticles({ rng: rng.fork('gold2'), preset: 'magic', time, follow: false, center: [0, seatY + 4, 48], box: [30, 26, 96], velocity: [0, 0.3, 9], velocityRandom: [1.6, 0.8, 3],
      count: 1800, size: [0.08, 0.26], colors: ['#ffd9a0', '#ffb45e', '#fff1d0'], intensity: 2.4 }));
    set.add(fx.makeMist({ rng: rng.fork('sill2'), time, count: 64, area: [120, 5, 118], center: [0, 4.6, 62], size: [9, 20], color: '#ffd8a6', opacity: 0.2 * mistAmt, drift: [0.5 * f, 0, 8.5], flatten: 0.3 }));
    if (weather === 1) set.add(fx.makeParticles({ rng: rng.fork('wx'), preset: 'snow', time, count: 1500, velocity: [0.4 * f, -0.9, 1.2], opacity: 0.6 }));
    if (weather === 2) set.add(fx.makeParticles({ rng: rng.fork('wx'), preset: 'petals', time, count: 600, velocity: [0.3 * f, -0.4, 1.3] }));
    const drift = (d, preset, o = {}) => { const fr = frontOf(d), reach = o.reach ?? 7, v = o.speed ?? 1.3, box = o.box ?? [16, d.H + 3, 16];
      return set.add(fx.makeParticles({ rng: rng.fork(preset), preset, time, follow: false, center: [d.x + fr.x * reach, d.y + (o.lift ?? box[1] * 0.5), d.z + fr.z * reach], box,
        velocity: [fr.x * v, o.fall ?? -0.6, fr.z * v], ...o.opts })); };
    drift(story.snow, 'snow', { reach: 8, box: [20, 11, 20], speed: 1.5, fall: -0.75, opts: { count: 1500, size: [0.06, 0.17] } });
    drift(story.foxLight, 'snow', { reach: 7, box: [16, 9, 16], speed: 1.3, fall: -0.6, opts: { count: 600, size: [0.07, 0.18] } });
    drift(story.desert, 'dust', { reach: 6, box: [14, 5, 14], speed: 2.4, fall: 0.02, opts: { count: 800, size: [0.03, 0.08], colors: ['#ffcf78', '#f0b060', '#ffe4a8'], intensity: 1.3 } });
    drift(story.sea, 'bubbles', { reach: 3, box: [9, 16, 9], speed: 0.4, fall: 1.2, lift: 8, opts: { count: 240 } });
    drift(story.autumn, 'leaves', { reach: 7, box: [16, 7, 16], speed: 1.6, fall: -0.5, opts: { count: 320 } });
    set.add(fx.makeParticles({ rng: rng.fork('blossom'), preset: 'petals', time, follow: false, center: [story.treePos.x, 5.5, story.treePos.z], box: [18, 11, 18], velocity: [0.2 * f, -0.5, 0.9], count: 420 }));
    const lights = lampTops.concat(candles);
    if (lights.length) set.add(fx.makeGlows({ rng: rng.fork('glows'), time, positions: lights, color: '#ffc27a', size: 2.3, intensity: 1.5, flicker: 0.35, sizes: lights.map((p, i) => (i < lampTops.length ? 1 : 0.45)) }));
    await ctx.yield();

    // ---- gaze
    const snowAt = new THREE.Vector3(story.snow.x, 4.5, story.snow.z), foxAt = new THREE.Vector3(), heroAt = new THREE.Vector3(0, 150, 0);
    const pois = [
      { at: snowAt, from: 0.07, to: 0.165, weight: 0.5 },
      { at: (t, u) => fox.positionAt(t, u, foxAt), from: 0.145, to: 0.25, weight: 0.6 },
      { at: new THREE.Vector3(spiral.cx - 20 * f, 0, spiral.cz + 70), from: 0.27, to: 0.5, weight: 0.55 },
      { at: heroAt, from: 0.58, to: 0.9, weight: 0.3 },
    ];

    return {
      scene, path, duration: 48, title: 'The Field of Doors',
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 32, sway: 0.8, bank: 0.8 },
      pois,
      portal: { shape: 'rect', width: seat.width, height: seat.height, color: '#ffe9c4', glow: 1.6, revealDistance: 460 },
      post: { exposure: 0.98, bloom: { strength: 0.5, radius: 0.72, threshold: 0.95 },
        grade: { saturation: 1.08, contrast: 1.05, tint: '#fff5ea', shadowTint: '#0c0a26', vignette: 0.36, grain: 0.03, aberration: 0 } },
      update(dt, t, camera, u) {
        U.uTime.value = t; time.value = t;
        const hd = Math.hypot(camera.position.x, camera.position.z);
        hero.setProgress(u); hero.uniforms.uOpen.value *= lerp(0.32, 1, smoothstep(50, 330, hd));
        hero.update(dt, t, camera); U.uOpen.value = lerp(hero.uniforms.uOpen.value, 1, 0.5);
        const close = smoothstep(0.62, 0.82, u);
        hero.uniforms.uVeil.value = 0.6 * (0.22 + 0.78 * smoothstep(70, 620, hd)) * (1 - 0.7 * close);
        hero.uniforms.uPocket.value = close;
        for (const s of updaters) s.update(dt, t, camera);
        for (const c of fauna) c.update(dt, t, camera, u);
        set.update(dt, t, camera);
        moon.group.position.copy(camera.position).addScaledVector(moonDir, 3400); moon.group.lookAt(camera.position);
        moon.pivot.rotation.y = -(0.3 + 0.45 * smoothstep(0, 0.9, u) + 0.06 * Math.sin(t * 0.35));
      },
      dispose() { hero.dispose(); for (const d of disposables) d.dispose?.(); for (const st of styles) st.geo.dispose(); },
    };
  },
};
