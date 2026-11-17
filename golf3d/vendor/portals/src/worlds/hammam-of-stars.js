// THE HOT ROOM (hammam-of-stars)
// Noon in an old Damascus bathhouse before it opens, built five times life size on one straight axis. World space is
// the hero's own frame (src/parts/hammam-of-stars.js): the hot room's centre is the origin, the camera travels toward
// -Z, the sun side (south) is +X, brief x metres = 241 - z.
//   cool hall   z 290..131  90 m wide, dome 64 m across over the fountain pool (centre z 191), towel lines, orange trees
//   first arch  z 131..122.7
//   warm room   z 122.7..63.3  60 m wide, pointed vault, six overflowing basins, the cat on the south kerb
//   hot room    the hero: octagon, great dome, platform, pool, 300 beams growing down out of the steam
//   exit recess z -56.6..-160.6  26 m wide: the chamber of honour. Seven coloured beams across from the right, great lanterns, eight furnished
//               niches each with its lamp, an octagonal pool with a fountain, floating lamps and rose petals (z -121.6), and the portal in a tiled
//               niche under a painted honeycomb half-dome carried on a striped arch (z -149.6)
// The camera rides high over a copper bathing bowl (the eye 3.9 m above the water: the bowl is under the frame, its wake shows) down the
// marble water channel to the hot-room pool, leaves it there turning on the water, climbs through the forest of beams, goes out through the
// east arch, dips to 11.6 m over the chamber's floor and rises over its pool to the portal.
// Per seed: the hour (white noon, amber late afternoon, blue-white winter morning with half the eyes dark; each tints the
// cool hall and warm room too: pearl, amber with longer stars, cold blue with two eyes in five snowed over), the one
// glass colour there is most of, towel stripes, the cat's coat, sparrows or collared doves. Rare event: a real cloud (u 0.57-0.69).
// Scripted to u: the birds leave the fountain's lip across the bow (0.09-0.16), the cat walks the kerb and sits (0.30-0.43),
// the beams grow (0.33-0.50), the eye lifts out of the bowl (about 0.52).
// Light: the sun through coloured and clear glass eyes, amber brass lamps hung in every arch and bay, a furnace mouth in the
// warm room, and deep blue-violet shade everywhere else.
// The cool hall is lit by its dome alone: a pool of light under it, shade in the bays and under every arch, and the sun
// that its glass eyes let through lying as hard stars and hexagons on the pool, the kerbs, the floor and the north wall.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeBuilder, buildCell, archBay, basinInto, basinSheetInto, basinWaterInto, MAT } from '../parts/hammam-of-stars.js';

const PALETTE = ['#F7F2E7', '#E2DDD2', '#D9A65C', '#2E2925', '#2F7F5C', '#B96A3B', '#7C8FA0'];
const PORTAL_HEX = '#46D8E4';        // a cool jewel glow against the warm stone
const WATER_Y = 0.3, EYE_Y = 4.2;       // the eye rides well above the water: the channel is the foot of the picture, not half of it
const Z_IN = 266, Z_WEST = 290, Z_A1 = 131, Z_WARM_W = 122.7, Z_WARM_E = 63.3, Z_REC_W = -56.6, Z_REC_E = -160.6, Z_FOUNT = 191, NREC = 4;
const HALL_X = 45, HALL_TOP = 40, CDOME_R = 32, CDOME_SPRING = 46, WARM_X = 30, WARM_SPRING = 19.2, WARM_APEX = 38, REC_X = 13, REC_SPRING = 22, REC_APEX = 36;
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const lin = (hex, k = 1) => { const c = new THREE.Color(hex); return [c.r * k, c.g * k, c.b * k]; };
const warmY = (x) => WARM_SPRING + (WARM_APEX - WARM_SPRING) * (1 - Math.pow(Math.min(1, Math.abs(x) / WARM_X), 1.5));
const recY = (x) => REC_SPRING + (REC_APEX - REC_SPRING) * (1 - Math.pow(Math.min(1, Math.abs(x) / REC_X), 1.5));

// ---------------------------------------------------------------- small shape helpers on the hero's geometry builder
// a tube swept through pts ([x,y,z]...), radius rad(t) or a number; uv = (su, sv) constants for MAT.PLAIN (sway, gloss)
function tube(b, pts, rad, seg, mat, su = 0, sv = 0, ao = 1) {
  const n = pts.length - 1, fr = [];
  for (let i = 0; i <= n; i++) {
    const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, n)];
    const t = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize();
    const ref = Math.abs(t.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const n1 = new THREE.Vector3().crossVectors(t, ref).normalize(), n2 = new THREE.Vector3().crossVectors(t, n1);
    fr.push([n1, n2]);
  }
  b.grid(seg, n, (u, v) => {
    const f = v * n, i = Math.min(Math.floor(f + 1e-6), n - 1), k = f - i, p0 = pts[i], p1 = pts[i + 1];
    const r = typeof rad === 'function' ? rad(v) : rad, a = u * Math.PI * 2, ca = Math.cos(a) * r, sa = Math.sin(a) * r;
    const [m1, m2] = fr[k > 0.5 ? i + 1 : i];
    return [p0[0] + (p1[0] - p0[0]) * k + m1.x * ca + m2.x * sa, p0[1] + (p1[1] - p0[1]) * k + m1.y * ca + m2.y * sa, p0[2] + (p1[2] - p0[2]) * k + m1.z * ca + m2.z * sa, su, sv, ao];
  }, mat);
}
// a box with bevel-free flat faces, turned by yaw about its centre; uvf(face, u, v) -> [texU, texV]
function box(b, c, s, mat, yaw = 0, uvf = null, bottom = false) {
  const cy = Math.cos(yaw), sy = Math.sin(yaw), hx = s[0] / 2, hy = s[1] / 2, hz = s[2] / 2;
  const P = (x, y, z) => [c[0] + x * cy + z * sy, c[1] + y, c[2] - x * sy + z * cy];
  const faces = [
    (u, v) => P(-hx + s[0] * u, hy, -hz + s[2] * v), (u, v) => P(-hx + s[0] * u, -hy + s[1] * v, hz), (u, v) => P(-hx + s[0] * u, -hy + s[1] * v, -hz),
    (u, v) => P(hx, -hy + s[1] * v, -hz + s[2] * u), (u, v) => P(-hx, -hy + s[1] * v, -hz + s[2] * u), (u, v) => P(-hx + s[0] * u, -hy, -hz + s[2] * v)];
  for (let i = 0; i < (bottom ? 6 : 5); i++) b.grid(1, 1, (u, v) => { const p = faces[i](u, v), t = uvf ? uvf(i, u, v) : [0, 0]; return [p[0], p[1], p[2], t[0], t[1], i === 0 ? 1 : i === 5 ? 0.5 : 0.72 + 0.28 * v]; }, mat, true);
}
// a ball (or an egg: s = [sx, sy, sz])
function ball(b, c, r, mat, nu = 8, nv = 5, s = [1, 1, 1], su = 0, sv = 0) {
  b.grid(nu, nv, (u, v) => { const a = u * Math.PI * 2, f = (v - 0.5) * Math.PI, cr = Math.cos(f) * r; return [c[0] + Math.sin(a) * cr * s[0], c[1] + Math.sin(f) * r * s[1], c[2] + Math.cos(a) * cr * s[2], su, sv, 0.7 + 0.3 * v]; }, mat);
}
// a flat card: centre c, half-axes ax and ay
function card(b, c, ax, ay, mat, su = 0, sv = 0, ao = 1) {
  b.grid(1, 1, (u, v) => { const x = u * 2 - 1, y = v * 2 - 1; return [c[0] + ax[0] * x + ay[0] * y, c[1] + ax[1] * x + ay[1] * y, c[2] + ax[2] * x + ay[2] * y, su, sv, ao]; }, mat, true);
}

// ---------------------------------------------------------------- the cat: one smooth mesh, two poses (walking, sitting), legs and tail moved in the shader
// Faces -Z. aSit / aSitN = the same vertex and its normal in the sitting pose; aAnim = (leg phase, leg weight, tail weight, 1 on the head);
// aPivot = hip of its leg. The face (almond eyes, nose, mouth, whisker pads, the pink of the ears) is painted by the fragment shader.
const CAT_HEAD_W = [0, 2.14, -2.04], CAT_HEAD_S = [0, 2.56, -1.0];
function catGeometry(coat, dark, pale) {
  const P = [], S = [], C = [], A = [], V = [], I = [];
  const cr = (a, b, c, d, k) => 0.5 * (2 * b + (c - a) * k + (2 * a - 5 * b + 4 * c - d) * k * k + (3 * b - a - 3 * c + d) * k * k * k);
  const resample = (pts, m) => {            // a smooth curve through pts, m rings
    const n = pts.length - 1, out = [];
    for (let j = 0; j < m; j++) {
      const f = Math.min(n - 1e-6, j / (m - 1) * n), i = Math.floor(f), k = f - i, p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, n)];
      out.push(p1.length ? p1.map((_, q) => cr(p0[q], p1[q], p2[q], p3[q], k)) : Math.max(0.004, cr(p0, p1, p2, p3, k)));
    }
    return out;
  };
  // a tube swept along a spine in both poses: o = { rings, seg, col(w, angle, down), anim(w), pivot, flat (depth / width of the section), sitR }
  const sweep = (walk0, sit0, radii0, o) => {
    const m = o.rings || walk0.length, seg = o.seg || 12, flat = o.flat ?? 1;
    const walk = resample(walk0, m), sit = resample(sit0, m), radii = resample(radii0, m), radS = o.sitR ? resample(o.sitR, m) : radii, base = P.length / 3;
    const frame = (pts, i) => {
      const a = pts[Math.max(i - 1, 0)], c = pts[Math.min(i + 1, m - 1)];
      const t = new THREE.Vector3(c[0] - a[0], c[1] - a[1], c[2] - a[2]).normalize();
      const n1 = new THREE.Vector3(1, 0, 0); if (Math.abs(t.x) > 0.9) n1.set(0, 1, 0);
      n1.addScaledVector(t, -n1.dot(t)).normalize();
      return [n1, new THREE.Vector3().crossVectors(t, n1)];
    };
    for (let i = 0; i < m; i++) {
      const fw = frame(walk, i), fs = frame(sit, i), w = i / (m - 1);
      for (let k = 0; k < seg; k++) {
        const a = k / seg * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a) * flat, r = radii[i], rs = radS[i];
        P.push(walk[i][0] + (fw[0].x * ca + fw[1].x * sa) * r, walk[i][1] + (fw[0].y * ca + fw[1].y * sa) * r, walk[i][2] + (fw[0].z * ca + fw[1].z * sa) * r);
        S.push(sit[i][0] + (fs[0].x * ca + fs[1].x * sa) * rs, sit[i][1] + (fs[0].y * ca + fs[1].y * sa) * rs, sit[i][2] + (fs[0].z * ca + fs[1].z * sa) * rs);
        const cc = typeof o.col === 'function' ? o.col(w, a, -(fw[0].y * Math.cos(a) + fw[1].y * Math.sin(a))) : o.col; C.push(cc[0], cc[1], cc[2]);
        const an = o.anim ? o.anim(w) : [0, 0, 0, 0]; A.push(an[0], an[1], an[2], an[3]);
        const pv = o.pivot || [0, 0, 0]; V.push(pv[0], pv[1], pv[2]);
      }
    }
    for (let i = 0; i < m - 1; i++) for (let k = 0; k < seg; k++) {
      const a = base + i * seg + k, c = base + i * seg + (k + 1) % seg, d = a + seg, e = c + seg;
      I.push(a, c, e, a, e, d);
    }
  };
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
  const sst = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  const fur = (w, a, dn) => mixc(mixc(coat, dark, 0.35 * sst(0.3, 0.95, -dn)), pale, 0.8 * sst(0.45, 0.9, dn));      // darker down the spine, pale under the body
  // torso from the rump to the neck
  sweep([[0, 1.4, 1.52], [0, 1.5, 1.28], [0, 1.47, 0.7], [0, 1.42, 0.1], [0, 1.46, -0.5], [0, 1.58, -1.0], [0, 1.8, -1.42], [0, 2.02, -1.78]],
    [[0, 0.4, 1.12], [0, 0.6, 0.9], [0, 0.94, 0.45], [0, 1.32, 0.1], [0, 1.7, -0.18], [0, 2.0, -0.4], [0, 2.24, -0.6], [0, 2.44, -0.8]],
    [0.06, 0.45, 0.55, 0.57, 0.55, 0.5, 0.41, 0.36], { rings: 22, seg: 16, col: fur, flat: 1.06, sitR: [0.06, 0.52, 0.68, 0.62, 0.52, 0.47, 0.4, 0.36] });
  // head: a skull, cheeks and a short muzzle melted into one rounded surface (the farthest of the blobs along every direction, smoothed)
  {
    const blobs = [[0, 0, 0, 0.47, 0.42, 0.47], [0, -0.13, -0.3, 0.25, 0.19, 0.27], [0.2, -0.1, -0.14, 0.26, 0.22, 0.26], [-0.2, -0.1, -0.14, 0.26, 0.22, 0.26]];
    const NU = 22, NV = 14, rad = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i < NU; i++) {
      const a = i / NU * Math.PI * 2, f = (j / NV - 0.5) * Math.PI, d = [Math.sin(a) * Math.cos(f), Math.sin(f), Math.cos(a) * Math.cos(f)];
      let r = 0.05;
      for (const [cx, cy, cz, rx, ry, rz] of blobs) {
        const qa = d[0] * d[0] / (rx * rx) + d[1] * d[1] / (ry * ry) + d[2] * d[2] / (rz * rz), qb = -2 * (d[0] * cx / (rx * rx) + d[1] * cy / (ry * ry) + d[2] * cz / (rz * rz));
        const qc = cx * cx / (rx * rx) + cy * cy / (ry * ry) + cz * cz / (rz * rz) - 1, disc = qb * qb - 4 * qa * qc;
        if (disc >= 0) r = Math.max(r, (-qb + Math.sqrt(disc)) / (2 * qa));
      }
      rad.push(r);
    }
    for (let pass = 0; pass < 2; pass++) {
      const src = rad.slice();
      for (let j = 1; j < NV; j++) for (let i = 0; i < NU; i++) rad[j * NU + i] = 0.4 * src[j * NU + i] + 0.15 * (src[j * NU + (i + 1) % NU] + src[j * NU + (i + NU - 1) % NU] + src[(j + 1) * NU + i] + src[(j - 1) * NU + i]);
    }
    const base = P.length / 3;
    for (let j = 0; j <= NV; j++) for (let i = 0; i < NU; i++) {
      const a = i / NU * Math.PI * 2, f = (j / NV - 0.5) * Math.PI, r = rad[j * NU + i], x = Math.sin(a) * Math.cos(f) * r, y = Math.sin(f) * r, z = Math.cos(a) * Math.cos(f) * r;
      P.push(x + CAT_HEAD_W[0], y + CAT_HEAD_W[1], z + CAT_HEAD_W[2]); S.push(x + CAT_HEAD_S[0], y + CAT_HEAD_S[1], z + CAT_HEAD_S[2]);
      const cc = mixc(mixc(coat, dark, 0.3 * sst(0.1, 0.4, y)), pale, 0.85 * sst(-0.12, -0.3, z) * sst(0.02, -0.12, y));      // a pale muzzle and chin
      C.push(cc[0], cc[1], cc[2]); A.push(0, 0, 0, 1); V.push(0, 0, 0);
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
      const a = base + j * NU + i, c = base + j * NU + (i + 1) % NU, d = a + NU, e = c + NU;
      I.push(a, c, e, a, e, d);
    }
  }
  // ears: broad at the root, flat, pointed
  for (const sx of [-1, 1]) {
    const ear = [[sx * 0.22, 0.26, 0.04], [sx * 0.27, 0.46, 0.03], [sx * 0.31, 0.64, 0.02], [sx * 0.34, 0.76, 0.01]];
    sweep(ear.map((p) => [p[0] + CAT_HEAD_W[0], p[1] + CAT_HEAD_W[1], p[2] + CAT_HEAD_W[2]]), ear.map((p) => [p[0] + CAT_HEAD_S[0], p[1] + CAT_HEAD_S[1], p[2] + CAT_HEAD_S[2]]),
      [0.22, 0.17, 0.09, 0.012], { rings: 7, seg: 10, col: mixc(coat, dark, 0.25), flat: 0.34, anim: () => [0, 0, 0, 1] });
  }
  // tail: up when walking, curled round the haunch when sitting
  sweep([[0, 1.46, 1.4], [0, 1.9, 1.74], [0, 2.4, 1.88], [0, 2.85, 1.82], [0, 3.1, 1.62], [0, 3.16, 1.42]],
    [[0, 0.42, 1.15], [0.6, 0.2, 1.42], [1.14, 0.15, 1.1], [1.3, 0.15, 0.45], [1.14, 0.15, -0.15], [0.86, 0.17, -0.5]],
    [0.17, 0.165, 0.155, 0.145, 0.135, 0.05], { rings: 16, seg: 10, col: (w) => mixc(coat, dark, sst(0.7, 0.95, w)), anim: (w) => [0, 0, w * w, 0] });
  // legs: front pair straight in both poses, hind pair folded under when sitting; round paws
  const legs = [[-1, -0.95, 0], [1, -0.95, Math.PI], [-1, 0.95, Math.PI * 0.5], [1, 0.95, Math.PI * 1.5]];
  for (const [sx, z, ph] of legs) {
    const front = z < 0, x = sx * 0.3, hipW = [x, front ? 1.3 : 1.35, z], col = (w) => mixc(coat, pale, sst(0.72, 0.9, w));
    const walk = front ? [[x, 1.5, z], [x, 0.95, z + 0.04], [x, 0.42, z], [x, 0.12, z - 0.04], [x, 0.02, z - 0.14]] : [[x, 1.55, z], [x, 1.0, z - 0.1], [x, 0.5, z + 0.14], [x, 0.14, z + 0.1], [x, 0.02, z - 0.02]];
    const sit = front ? [[sx * 0.26, 1.55, -0.3], [sx * 0.26, 0.95, -0.4], [sx * 0.26, 0.42, -0.5], [sx * 0.26, 0.12, -0.56], [sx * 0.26, 0.02, -0.68]] : [[sx * 0.5, 0.66, 0.7], [sx * 0.6, 0.5, 0.3], [sx * 0.56, 0.3, -0.05], [sx * 0.52, 0.14, -0.3], [sx * 0.5, 0.03, -0.52]];
    sweep(walk, sit, [0.27, 0.2, 0.15, 0.17, 0.12], { rings: 10, seg: 10, col, anim: (w) => [ph, w, 0, 0], pivot: hipW });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aAnim', new THREE.Float32BufferAttribute(A, 4));
  g.setAttribute('aPivot', new THREE.Float32BufferAttribute(V, 3));
  g.setIndex(I); g.computeVertexNormals();
  const gs = new THREE.BufferGeometry();        // the sitting pose's own normals
  gs.setAttribute('position', new THREE.Float32BufferAttribute(S, 3)); gs.setIndex(I); gs.computeVertexNormals();
  g.setAttribute('aSit', gs.getAttribute('position')); g.setAttribute('aSitN', gs.getAttribute('normal'));
  return g;
}
const CAT_VERT = /* glsl */`
attribute vec3 aSit, aSitN, aPivot, color; attribute vec4 aAnim;
uniform float uPhase, uWalk, uSit, uTime;
varying vec3 vN, vC, vW, vO, vNo; varying float vHead;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal; vO = position; vNo = normal; vHead = aAnim.w;
  float ang = sin(uPhase + aAnim.x) * 0.6 * uWalk * aAnim.y;                 // legs swing from the hip
  float ca = cos(ang), sa = sin(ang);
  vec3 q = p - aPivot; p = aPivot + vec3(q.x, q.y * ca - q.z * sa, q.y * sa + q.z * ca);
  n = vec3(n.x, n.y * ca - n.z * sa, n.y * sa + n.z * ca);
  p.y += (0.05 * sin(uPhase * 2.) * uWalk) * (1. - aAnim.y);
  p.x += aAnim.z * 0.35 * sin(uTime * 1.6 + p.y);                              // the tail tip flicks
  vec3 s = aSit; s.x += aAnim.z * 0.22 * sin(uTime * 1.1); s.y += (1. - aAnim.y) * 0.02 * sin(uTime * 1.9);
  p = mix(p, s, uSit); n = mix(n, aSitN, uSit);
  vec4 wp = modelMatrix * vec4(p, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * n; vC = color;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const CAT_FRAG = /* glsl */`
uniform vec3 uPearl, uShade, uDeep, uLampCol, uRoomKey, uHead, uLampA, uLampB; uniform float uLight;
varying vec3 vN, vC, vW, vO, vNo; varying float vHead;
#include <fog_pars_fragment>
float cHash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float cNoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(cHash(i), cHash(i + vec2(1., 0.)), f.x), mix(cHash(i + vec2(0., 1.)), cHash(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), V = normalize(cameraPosition - vW);
  vec3 alb = vC;
  // fur: fine streaks lying along the body, soft tabby bars over the back and rings on the tail
  float streak = cNoise(vec2(vO.z * 3.2 + vO.y * 1.1, atan(vO.x, vO.y - 1.5 + 1e-4) * 26.));
  alb *= 0.86 + 0.26 * streak;
  float tab = smoothstep(0.3, 0.7, sin(vO.z * 7.5 + 1.5 * sin(vO.y * 4.)) * 0.5 + 0.5) * smoothstep(1.2, 1.75, vO.y) * (1. - vHead);
  alb *= 1. - 0.24 * tab;
  float glow = 0.;
  if (vHead > 0.5) {                                                       // the face, painted on the head in its own frame (it looks down -z)
    vec3 h = vO - uHead; float front = smoothstep(-0.12, -0.26, h.z) * step(vNo.z, 0.1);
    float ax = abs(h.x);
    alb *= 1. - 0.2 * smoothstep(0.08, 0.02, abs(ax - 0.1)) * smoothstep(0.22, 0.4, h.y) * front;      // two dark marks up the brow
    vec2 pad = vec2((ax - 0.105) / 0.115, (h.y + 0.15) / 0.085);
    float padK = smoothstep(1.1, 0.6, dot(pad, pad)) * front;
    alb = mix(alb, vC * 1.25 + 0.12, padK * 0.7);                                                        // whisker pads, paler, with their rows of dots
    alb *= 1. - 0.5 * padK * step(0.72, cHash(floor(vec2(ax, h.y) * 46.))) * step(0.03, ax);
    float ex = (ax - 0.18) / 0.082, ey = (h.y - 0.075 - 0.3 * (ax - 0.18)) / 0.054, de = ex * ex + ey * ey;
    float rim = smoothstep(1.4, 1.12, de) * front, eye = smoothstep(1.05, 0.85, de) * front;
    alb = mix(alb, vec3(0.03, 0.025, 0.02), rim);
    float slit = smoothstep(0.3, 0.16, abs(ex)) * smoothstep(0.98, 0.7, abs(ey));
    vec3 iris = mix(vec3(0.8, 0.5, 0.08), vec3(0.42, 0.6, 0.18), smoothstep(0.2, 0.9, de)) * (1. - 0.92 * slit);
    alb = mix(alb, iris, eye); glow = eye * (1. - slit) * 0.22;
    glow += eye * 1.6 * smoothstep(0.1, 0.02, length(vec2(ex + 0.38 * sign(h.x) , ey - 0.4) * vec2(1., 1.2)) - 0.08);   // the light of the room in each eye
    float nose = smoothstep(1.1, 0.8, length(vec2(h.x / 0.062, (h.y + 0.075 + 0.5 * ax) / 0.046))) * front;
    alb = mix(alb, vec3(0.34, 0.15, 0.14), nose);
    float mouth = smoothstep(0.016, 0.006, abs(h.y + 0.215 - 0.5 * ax)) * step(ax, 0.12) + smoothstep(0.012, 0.004, ax) * step(-0.215, h.y) * step(h.y, -0.11);
    alb *= 1. - 0.7 * clamp(mouth, 0., 1.) * front;
    float inEar = smoothstep(0.3, 0.42, h.y) * step(vNo.z, -0.25) * step(-0.16, h.z) * smoothstep(0.17, 0.1, abs(ax - 0.285 - 0.1 * (h.y - 0.3)));
    alb = mix(alb, vec3(0.5, 0.27, 0.25), inEar * 0.8);
  }
  // light: the room's pearl from above and ahead, blue-violet shade below and behind, an amber edge from the nearest lamps
  float up = N.y * 0.5 + 0.5;
  vec3 K = normalize(vec3(-0.45, 0.72, -0.3));
  float wrap = clamp(dot(N, K) * 0.62 + 0.38, 0., 1.); wrap *= wrap;
  vec3 light = mix(uDeep * 0.34 + uShade * 0.2, uPearl * 0.3, up * up) + uPearl * uRoomKey * 0.95 * wrap;
  vec3 la = uLampA - vW, lb = uLampB - vW;
  light += uLampCol * (1.3 * (0.25 + 0.75 * max(dot(N, normalize(la)), 0.)) / (1. + dot(la, la) / 150.) + 1.0 * (0.25 + 0.75 * max(dot(N, normalize(lb)), 0.)) / (1. + dot(lb, lb) / 150.));
  float fr = pow(max(1. - max(dot(N, V), 0.), 0.), 2.5);
  vec3 col = alb * light * uLight + (vC * 0.6 + uPearl * 0.14) * fr * (0.3 + 0.7 * up) * 0.5 * uLight + alb * glow;      // a soft edge of lit fur
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// ---------------------------------------------------------------- sparrows (or collared doves): one small two-winged mesh, instanced; wings beat in the shader
// Faces -Z. aWing = 0 on the body, otherwise side * (0.1 + 0.9 * distance along the wing). Per instance aBird = (beat phase, beats per second, flying 0..1).
function birdGeometry(top, belly, wing, bar, beak, dove = false) {
  const P = [], C = [], W = [];
  const tri = (a, b, c, ca, cb, cc, wa = 0, wb = 0, wc = 0) => { P.push(...a, ...b, ...c); C.push(...ca, ...cb, ...cc); W.push(wa, wb, wc); };
  const quad = (a, b, c, d, ca, cb, cc, cd, wa = 0, wb = 0, wc = 0, wd = 0) => { tri(a, b, c, ca, cb, cc, wa, wb, wc); tri(a, c, d, ca, cc, cd, wa, wc, wd); };
  const egg = (c, r, nu, nv, colF) => {
    const pt = (i, j) => { const a = i / nu * Math.PI * 2, f = (j / nv - 0.5) * Math.PI; return [c[0] + Math.sin(a) * Math.cos(f) * r[0], c[1] + Math.sin(f) * r[1], c[2] + Math.cos(a) * Math.cos(f) * r[2]]; };
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = pt(i, j), b = pt(i + 1, j), cc = pt(i + 1, j + 1), d = pt(i, j + 1); quad(a, b, cc, d, colF(a), colF(b), colF(cc), colF(d)); }
  };
  const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k], cl = (x) => Math.min(1, Math.max(0, x));
  if (dove) {
    // a collared dove: a deep round breast, a small head carried high on a short neck with the dark half-collar, a long pale-tipped tail
    egg([0, 0.01, 0.02], [0.14, 0.135, 0.3], 12, 7, (p) => mixc(belly, top, cl(p[1] / 0.135 * 1.3 + 0.5)));
    egg([0, 0.0, -0.13], [0.13, 0.135, 0.17], 10, 6, (p) => mixc(belly, top, cl(p[1] / 0.135 * 0.9 + 0.2)));
    egg([0, 0.11, -0.22], [0.075, 0.1, 0.09], 8, 5, (p) => (p[2] > -0.215 && p[1] > 0.1 && p[1] < 0.16 ? bar : mixc(belly, top, cl((p[1] - 0.11) / 0.1 + 0.6))));
    egg([0, 0.185, -0.275], [0.07, 0.068, 0.085], 8, 5, (p) => (Math.abs(p[0]) > 0.05 && Math.abs(p[1] - 0.195) < 0.02 && p[2] < -0.29 ? beak : mixc(belly, top, cl((p[1] - 0.185) / 0.07 + 0.7))));
    tri([-0.018, 0.185, -0.35], [0.018, 0.185, -0.35], [0, 0.172, -0.425], beak, beak, beak); tri([-0.018, 0.185, -0.35], [0, 0.172, -0.425], [0, 0.162, -0.35], beak, beak, beak); tri([0.018, 0.185, -0.35], [0, 0.162, -0.35], [0, 0.172, -0.425], beak, beak, beak);
    quad([-0.06, 0.05, 0.24], [0.06, 0.05, 0.24], [0.13, 0.02, 0.5], [-0.13, 0.02, 0.5], top, top, wing, wing);
    quad([-0.13, 0.02, 0.5], [0.13, 0.02, 0.5], [0.15, 0.0, 0.64], [-0.15, 0.0, 0.64], wing, wing, belly, belly);
    quad([-0.06, 0.0, 0.24], [0.06, 0.0, 0.24], [0.15, 0.0, 0.64], [-0.15, 0.0, 0.64], bar, bar, belly, belly);
  } else {
  egg([0, 0, 0], [0.105, 0.1, 0.27], 10, 6, (p) => mixc(belly, top, cl(p[1] / 0.1 * 1.6 + 0.55)));                 // body: dark back, pale belly
  egg([0, 0.065, -0.25], [0.085, 0.082, 0.095], 8, 5, (p) => mixc(belly, top, cl((p[1] - 0.065) / 0.08 * 2.2 + 0.75)));   // head: a dark cap, pale cheeks
  tri([-0.022, 0.06, -0.33], [0.022, 0.06, -0.33], [0, 0.05, -0.41], beak, beak, beak); tri([-0.022, 0.06, -0.33], [0, 0.05, -0.41], [0, 0.035, -0.33], beak, beak, beak); tri([0.022, 0.06, -0.33], [0, 0.035, -0.33], [0, 0.05, -0.41], beak, beak, beak);
  quad([-0.05, 0.02, 0.2], [0.05, 0.02, 0.2], [0.1, 0.0, 0.52], [-0.1, 0.0, 0.52], top, top, wing, wing);          // tail
  }
  for (const sx of [-1, 1]) {                                                                                    // wings: three panels from shoulder to tip, a pale bar across
    const sec = dove ? [[0.07, -0.15, 0.13], [0.34, -0.23, 0.12], [0.62, -0.17, 0.14], [0.92, 0.0, 0.18]] : [[0.07, -0.12, 0.1], [0.3, -0.2, 0.07], [0.56, -0.15, 0.1], [0.82, 0.0, 0.15]];           // span x, leading edge z, trailing edge z
    for (let k = 0; k < 3; k++) {
      const [x0, l0, t0] = sec[k], [x1, l1, t1] = sec[k + 1], w0 = sx * (0.1 + 0.9 * k / 3), w1 = sx * (0.1 + 0.9 * (k + 1) / 3);
      const c0 = k === 1 ? bar : wing, c1 = k === 0 ? bar : wing;
      quad([sx * x0, 0.03, l0], [sx * x1, 0.03, l1], [sx * x1, 0.03, t1], [sx * x0, 0.03, t0], wing, wing, c1, c0, w0, w1, w1, w0);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1));
  g.computeVertexNormals();
  return g;
}
const BIRD_VERT = /* glsl */`
attribute vec3 color, aBird; attribute float aWing;
uniform float uTime;
varying vec3 vN, vC, vW;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal;
  float w = abs(aWing), side = sign(aWing), fly = aBird.z;
  if (w > 0.) {
    float span = (w - 0.1) / 0.9;
    float beat = sin(uTime * aBird.y * 6.2831853 + aBird.x);
    float ang = fly * (0.2 + 0.78 * beat) * (0.5 + 0.6 * span) - (1. - fly) * 1.25;       // beating; folded down along the flank when perched
    float d = (abs(p.x) - 0.07) * mix(0.3, 1., fly);
    p.x = side * (0.07 + d * cos(ang)); p.y += d * sin(ang); p.z += (1. - fly) * span * 0.2;
    n = normalize(vec3(-side * sin(ang), cos(ang), 0.));
  }
  vec4 wp = modelMatrix * instanceMatrix * vec4(p, 1.); vW = wp.xyz; vN = mat3(modelMatrix) * mat3(instanceMatrix) * n; vC = color;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
uniform vec3 uPearl, uDeep, uRoomKey; uniform float uLight;
varying vec3 vN, vC, vW;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  if (!gl_FrontFacing) N = -N;
  float up = N.y * 0.5 + 0.5;
  vec3 light = mix(uDeep * 0.6 + 0.07, uPearl * 0.7, up) + uPearl * uRoomKey * 0.6 * max(dot(N, normalize(vec3(0.3, 0.85, 0.2))), 0.);
  gl_FragColor = vec4(vC * light * uLight, 1.);
  #include <fog_fragment>
}`;
// ripples spreading from the bowl: a ring of water that travels with it
const WAKE_FRAG = /* glsl */`
uniform vec3 uPearl; uniform float uLight, uTime, uSpeed;
varying vec3 vW; varying vec2 vUv;
#include <fog_pars_fragment>
void main(){
  float r = vUv.x, a = vUv.y;
  float ring = sin(r * 5.2 - uTime * 4.4 + sin(a * 3.) * 0.8) * 0.5 + 0.5;
  float chop = sin(a * 17. + r * 2.1 - uTime * 1.7) * sin(a * 9. - r * 3.3 + uTime * 2.3);
  float al = pow(ring, 5.) * (0.34 + 0.28 * chop) * smoothstep(2.1, 2.7, r) * (1. - smoothstep(4.5, 9.5, r)) * (0.5 + 0.5 * uSpeed);
  al = clamp(al, 0., 1.);
  gl_FragColor = vec4(uPearl * 0.95 * uLight * al, al);
  #include <fog_fragment>
}`;
// bright droplets: each instance flies one arc (or falls one height) over and over
const DROP_VERT = /* glsl */`
attribute vec4 aBase, aVel, aLife;      // base xyz + lowest y it may show at; velocity xyz + size; phase, period, gravity, brightness
uniform float uTime;
varying vec2 vQ; varying float vB;
#include <fog_pars_vertex>
void main(){
  float t = fract(uTime / max(aLife.y, 0.05) + aLife.x), tt = t * aLife.y;
  vec3 c = aBase.xyz + aVel.xyz * tt + vec3(0., -0.5 * aLife.z * tt * tt, 0.);
  float vy = aVel.y - aLife.z * tt;
  vec4 mvPosition = viewMatrix * vec4(c, 1.);
  float dist = -mvPosition.z;
  float nearK = smoothstep(0.6, 2.5, length(mvPosition.xyz));        // the kit's near law for small falling things (its own two numbers, and like the kit's by the true distance of the drop's centre): a drop thins to nothing as it nears the eye, and one further off than 2.5 m is drawn as it was
  float sz = max(aVel.w, dist * 0.0019);
  mvPosition.xy += position.xy * sz * vec2(1., 1. + min(abs(vy) * 0.22, 6.));        // a falling drop is drawn out into a streak
  vB = aLife.w * smoothstep(0., 0.06, t) * step(aBase.w, c.y) * (aVel.w / sz) * (0.7 + 0.3 * sin(uTime * 9. + aLife.x * 80.)) * nearK;
  vQ = position.xy;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const DROP_FRAG = /* glsl */`
uniform vec3 uBeamCol;
varying vec2 vQ; varying float vB;
#include <fog_pars_fragment>
void main(){
  float a = max(1. - dot(vQ, vQ), 0.);
  gl_FragColor = vec4(uBeamCol * a * a * vB, 1.);
}`;
const WAKE_VERT = /* glsl */`
varying vec3 vW; varying vec2 vUv;
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; vUv = uv;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

export default {
  id: 'hammam-of-stars',
  name: 'The Hot Room',
  category: 'interior',
  weirdness: 0.1,
  media: ['water', 'interior'],
  async build(ctx) {
    const scene = new THREE.Scene();
    const detail = ctx.quality?.detail ?? 1, vary = ctx.vary || {};

    // ------------------------------------------------------------------ per-seed variety
    const V = ctx.rng.fork('hammam-variety');
    const r0 = V();
    let look = r0 < 0.42 ? 'noon' : r0 < 0.72 ? 'afternoon' : 'winter';
    if (vary.hour === 'day') look = 'noon'; else if (vary.hour === 'golden') look = 'afternoon'; else if (vary.hour === 'dawn' || vary.hour === 'night') look = 'winter';
    const accentHex = V.pick([PALETTE[4], PALETTE[4], PALETTE[4], '#2B5FB8', '#D98A1E']);
    const towelHex = V.pick(['#27407F', '#A23A2C', '#2E2925']);                 // indigo, madder or black stripes
    const catKind = V.pick(['grey', 'grey', 'white', 'ginger']);
    const doves = V() < 0.3;
    const density = Math.min(1.3, Math.max(0.7, vary.density ?? 1));
    const rare = !!vary.rare;
    const R = ctx.rng.fork('hammam-world');

    // ------------------------------------------------------------------ the hero: the hot room
    const U_GROW0 = 0.33, U_GROW1 = 0.5;
    // soft contact shadows the floor shader lays under what stands on it: [x, z, radius, strength]
    const EWERS = [[-11.6, 239.2, 2.2], [-9.0, 243, 2.5], [-9.4, 234, 3.2], [9.2, 166, 2.7], [-9.0, 118, 2.8], [9.1, 104, 2.4], [-23, 70, 3.0], [9.0, -80, 2.6]];
    const WBZ = (Z_WARM_W - Z_WARM_E) / 3;
    const TREE_X = 24, TREE_Z = Z_FOUNT - 21;      // beyond the pool, either side of the way to the first arch
    const blobs = [[-TREE_X, TREE_Z, 4.6, 0.5], [TREE_X, TREE_Z, 4.6, 0.5], [0, Z_REC_E + 6.6, 7.2, 0.5]];
    for (const [x, z, h] of EWERS) blobs.push([x, z, 0.85 * h, 0.5]);
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) blobs.push([sx * 14.5, Z_WARM_E + WBZ * (i + 0.5), 7.2, 0.5]);
    blobs.push([-19.5, 112.7, 2.2, 0.4], [21.6, 84.3, 2.2, 0.4], [-10.2, -69.2, 2.2, 0.4]);
    // ------------------------------------------------------------------ the flight (made first: the hero keeps its shafts clear of our view of the east arch)
    const portalAt = new THREE.Vector3(0, 16, Z_REC_E + 1.6);
    const path = makePath([
      [0, EYE_Y, Z_IN], [0, EYE_Y, 250], [-3.4, EYE_Y, 232], [1.5, EYE_Y, 213], [11.5, EYE_Y, 197], [12.5, EYE_Y, 188], [7, EYE_Y, 174], [1, EYE_Y, 161],
      [0, EYE_Y, 146], [0, EYE_Y, Z_A1], [0, EYE_Y, 93], [0, EYE_Y, Z_WARM_E],                      // the channel through the warm room
      [0, EYE_Y, 54], [2.5, EYE_Y, 46], [6.5, EYE_Y, 38], [5.5, EYE_Y + 0.4, 30],                             // out onto the round pool
      [0.5, 6.4, 23.5], [-6.5, 8.8, 17], [-12, 11.5, 10], [-14.5, 14.5, 0], [-8, 18.5, -14], [5, 20.5, -26], [2, 17.5, -42],   // the weave (never so far off the axis that the east arch hides the portal)
      [0, 16, -54], [0, 15.4, -63], [0, 11.6, -85], [0, 11.8, -99], [0, 15.0, -121], [0, 16, -133], [portalAt.x, portalAt.y, portalAt.z],      // down into the chamber of honour, up again over its pool to the portal
    ]);
    const views = [0.47, 0.5, 0.53, 0.56, 0.585, 0.61, 0.635, 0.66, 0.69, 0.72].map((u) => { const q = path.pointAt(u); return { p: [q.x, q.y, q.z], u }; });
    const hero = await buildHero(ctx, { views, palette: PALETTE, look, accent: accentHex, growFrom: U_GROW0, growTo: U_GROW1, haze: 0.36, blobs, glow: 2.2, portalZ: Z_REC_E + 1.6, portalColor: PORTAL_HEX, eastDepth: 1.6 });      // (a thin east wall: the recess opens straight off the hot room)
    scene.add(hero.object);
    const HU = hero.uniforms, A = hero.anchors;
    if (look === 'winter') HU.uStarGain.value = 1.3;                              // the forest must read as standing rods of light from the pool
    const fogCol = HU.uSteam.value.clone().multiplyScalar(0.07).add(HU.uDeep.value.clone().multiplyScalar(0.3)).multiplyScalar(HU.uLight.value);   // unlit steam: blue-violet, so that lit things stand against it
    scene.background = fogCol.clone();
    scene.fog = new THREE.Fog(fogCol, 60, 560);
    await ctx.yield();

    let U_LIFT = 0.5; while (U_LIFT < 0.6 && path.pointAt(U_LIFT).y < EYE_Y + 0.03) U_LIFT += 0.0005;      // where the eye leaves the bowl
    const liftAt = path.pointAt(U_LIFT);

    // ------------------------------------------------------------------ shells of the cool hall, warm room and recess
    let sb = makeBuilder(), stoneTris = 0;
    const flush = async () => { const m = new THREE.Mesh(sb.build(), hero.stoneMaterial); m.frustumCulled = false; scene.add(m); stoneTris += sb.count; sb = makeBuilder(); await ctx.yield(); };
    const floorStrip = (xs, aos, z0, z1, nz, endAo) => sb.grid(xs.length - 1, nz, (u, v) => { const i = Math.round(u * (xs.length - 1)); return [xs[i], -0.03, z0 + (z1 - z0) * v, 0, 0, aos[i] * (endAo ? endAo(z0 + (z1 - z0) * v) : 1)]; }, MAT.FLOOR);
    const endShade = (zA, zB) => (z) => 0.6 + 0.4 * ss(0, 10, Math.min(Math.abs(z - zA), Math.abs(z - zB)));
    floorStrip([-49, -45, -38.6, -36, -9.5, -7.25, 7.25, 9.5, 36, 38.6, 45, 49], [0.5, 0.5, 0.55, 0.95, 1, 0.55, 0.55, 1, 0.95, 0.55, 0.5, 0.5], 126, Z_WEST + 2, 16, endShade(Z_A1, Z_WEST));
    // (floor, kerbs and channel run on 60 m behind the west wall, out of sight from inside: seen through the previous portal the eye
    // stands back there, the wall stands aside, and the water must lie under it)
    floorStrip([-49, -9.5, -7.25, 7.25, 9.5, 49], [0.8, 0.9, 0.55, 0.55, 0.9, 0.8], Z_WEST + 2, Z_WEST + 60, 4);
    floorStrip([-33, -30, -24, -9.5, -7.25, 7.25, 9.5, 24, 30, 33], [0.5, 0.55, 0.95, 1, 0.55, 0.55, 1, 0.95, 0.55, 0.5], 58, 126, 8, endShade(Z_WARM_E, Z_WARM_W));
    floorStrip([-16, -13, -9, 9, 13, 16], [0.5, 0.55, 1, 1, 0.55, 0.5], Z_REC_E - 2, -60, 8, endShade(Z_REC_E, -40));
    await ctx.yield();

    // ---- cool hall: three arches in the east wall, five blind arches down each side, plaster above, the dome on a honeycomb ring
    archBay(sb, { pt: (s, y, d) => [s, y, Z_A1 - d], cls: 1, hs: 15, uo: 0, open: true });
    for (const sx of [-1, 1]) archBay(sb, { pt: (s, y, d) => [sx * 30 + s, y, Z_A1 - d], cls: 2, hs: 15, uo: 300 + sx * 100, back: true, depth: 3 });
    await ctx.yield();
    const BAY = (Z_WEST - Z_A1) / 5;
    for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) {
      const zc = Z_A1 + BAY * (i + 0.5);
      archBay(sb, { pt: (s, y, d) => [sx * (HALL_X + d), y, zc + s], cls: 2, hs: BAY / 2, uo: 700 + sx * 250 + i * 41, back: true, depth: 4 });
      await ctx.yield();
    }
    sb.grid(6, 4, (u, v) => [-HALL_X + 2 * HALL_X * u, HALL_TOP * v, Z_WEST, 900 + 90 * u, HALL_TOP * v, 0.7 + 0.2 * v], MAT.ABLAQ);
    sb.grid(8, 1, (u, v) => [-HALL_X + 2 * HALL_X * u, 32 + 8 * v, Z_A1, 90 * u, 32 + 8 * v, 0.9], MAT.ABLAQ);
    for (const sx of [-1, 1]) sb.grid(12, 1, (u, v) => [sx * HALL_X, 32 + 8 * v, Z_A1 + (Z_WEST - Z_A1) * u, 147 * u + 40, 32 + 8 * v, 0.9], MAT.ABLAQ);
    // flat beamed ceiling from the walls in to the ring, the corbelled backing, the dome and its carved band
    const rRect = (th) => { const sx = Math.abs(Math.sin(th)), cz = Math.cos(th); return Math.min(HALL_X / Math.max(sx, 1e-4), (cz > 0 ? Z_WEST - Z_FOUNT : Z_FOUNT - Z_A1) / Math.max(Math.abs(cz), 1e-4)); };
    const RING_R = 36.4;
    sb.grid(96, 3, (u, v) => { const th = u * Math.PI * 2, r = lerp(rRect(th), RING_R, v), z = Z_FOUNT + Math.cos(th) * r; return [Math.sin(th) * r, HALL_TOP, z, z / (BAY / 4) + 0.5, 0, 0.72 + 0.14 * v]; }, MAT.PLASTER);
    sb.grid(72, 3, (u, v) => { const th = u * Math.PI * 2, r = RING_R - (RING_R - CDOME_R) * Math.pow(v, 0.8); return [Math.sin(th) * r, HALL_TOP + (CDOME_SPRING - HALL_TOP) * v, Z_FOUNT + Math.cos(th) * r, 0, 0, 0.62]; }, MAT.PLASTER);
    sb.grid(64, 14, (u, v) => { const th = u * Math.PI * 2, f = v * Math.PI / 2, r = CDOME_R * Math.cos(f); return [Math.sin(th) * r, CDOME_SPRING + CDOME_R * Math.sin(f), Z_FOUNT + Math.cos(th) * r, u * 32, v, 0.86 + 0.14 * v]; }, MAT.PLASTER);
    sb.grid(64, 1, (u, v) => { const th = u * Math.PI * 2, y = CDOME_SPRING + 0.2 + 3.1 * v, r = Math.sqrt(CDOME_R * CDOME_R - (y - CDOME_SPRING) * (y - CDOME_SPRING)) - 0.25; return [Math.sin(th) * r, y, Z_FOUNT + Math.cos(th) * r, th * CDOME_R, v, 1]; }, MAT.CARVED);
    await ctx.yield();
    // raised marble benches along both side walls
    for (const sx of [-1, 1]) {
      const x0 = sx * 38.6, x1 = sx * 44.9, z0 = Z_A1 + 3.2, z1 = Z_WEST - 3;
      sb.grid(1, 12, (u, v) => [x0 + (x1 - x0) * u, 1.45, z0 + (z1 - z0) * v, 0, 0, 0.8 + 0.2 * (1 - u)], MAT.MARBLE, true);
      sb.grid(12, 1, (u, v) => [x0, 0.25 + 1.2 * v, z0 + (z1 - z0) * u, (z1 - z0) * u, v, 0.9], MAT.MARBLE, true);
      sb.grid(12, 1, (u, v) => [x0 - sx * 0.3, 0.25 * v, z0 + (z1 - z0) * u, 0, 0, 0.7], MAT.MARBLE, true);
      sb.grid(12, 1, (u, v) => [x0 - sx * 0.3 * (1 - v), 0.25, z0 + (z1 - z0) * u, 0, 0, 1], MAT.MARBLE, true);
      for (const zz of [z0, z1]) sb.grid(1, 1, (u, v) => [x0 + (x1 - x0) * u, 1.45 * v, zz, 0, 0, 0.8], MAT.MARBLE, true);
    }

    await flush();

    // ---- warm room: three blind arches a side under a low pointed vault; its two end walls take the through arches
    const WB = (Z_WARM_W - Z_WARM_E) / 3, WS = 0.6;
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
      const zc = Z_WARM_E + WB * (i + 0.5);
      archBay(sb, { pt: (s, y, d) => [sx * (WARM_X + d * WS), y * WS, zc + s * WS], cls: 2, hs: WB / 2 / WS, sc: WS, uo: 1300 + sx * 150 + i * 37, back: true, depth: 4 });
      await ctx.yield();
    }
    archBay(sb, { pt: (s, y, d) => [s, y, Z_WARM_W + d], cls: 1, hs: WARM_X, top: 39, uo: 1700, open: true, depth: -0.3, band: false });
    archBay(sb, { pt: (s, y, d) => [s, y, Z_WARM_E - d], cls: 0, hs: WARM_X, top: 39, uo: 1800, open: true, depth: -0.3, band: false });
    sb.grid(24, 6, (u, v) => { const x = -WARM_X + 2 * WARM_X * u, z = Z_WARM_E + (Z_WARM_W - Z_WARM_E) * v; return [x, warmY(x), z, z / (WB / 2) + 0.5, 0, 0.74 + 0.22 * (1 - Math.abs(x) / WARM_X)]; }, MAT.PLASTER);
    await ctx.yield();

    // ---- exit recess: three blind arches a side, a tall pointed vault, the portal niche in the end wall
    const RB = (Z_REC_W - Z_REC_E) / NREC, RS = 0.55;
    const PZ = Z_REC_E + RB * 1.5, CONCH_D = 11, CONCH_Z = Z_REC_E + CONCH_D, CONCH_Y = 21, CONCH_H = 9.5, CONCH_W = 12.6;
    for (const sx of [-1, 1]) for (let i = 0; i < NREC; i++) {
      const zc = Z_REC_E + RB * (i + 0.5);
      archBay(sb, { pt: (s, y, d) => [sx * (REC_X + d * RS), y * RS, zc + s * RS], cls: 2, hs: RB / 2 / RS, sc: RS, uo: 2100 + sx * 150 + i * 43, back: true, depth: 5 });
      sb.grid(3, 1, (u, v) => [sx * REC_X, 17.6 + (REC_SPRING - 17.6) * v, zc - RB / 2 + RB * u, 2100 + RB * u, 17.6 + (REC_SPRING - 17.6) * v, 0.9], MAT.ABLAQ);
      await ctx.yield();
    }
    sb.grid(16, 8, (u, v) => { const x = -REC_X + 2 * REC_X * u, z = Z_REC_E + (Z_REC_W - Z_REC_E) * v; return [x, recY(x), z, z / (RB / 3) + 0.5, 0, 0.72 + 0.26 * (1 - Math.abs(x) / REC_X)]; }, MAT.PLASTER);
    {
      const zw = Z_REC_E, zf = zw + 0.75, cy = portalAt.y + 2;       // the portal: 14 wide, 18 high, round-headed; ring centre 2 m above its centre
      sb.grid(6, 8, (u, v) => { const x = -REC_X + 2 * REC_X * u, y = recY(x) * v; return [x, y, zw, x + 2500, y, 0.62 + 0.3 * ss(0, 10, y)]; }, MAT.ABLAQ);
      // striped ring and jambs standing proud of the wall round the portal, their inner reveal, a marble sill on brackets
      const ringP = (f, rho) => [Math.cos(f) * rho, cy + Math.sin(f) * rho];
      sb.grid(24, 1, (u, v) => { const f = Math.PI * u, [x, y] = ringP(f, 7.5 + 2.4 * v); return [x, y, zf, 8.2 * Math.PI * (1 - u) + 11, v, 1]; }, MAT.VOUSSOIR);
      sb.grid(24, 1, (u, v) => { const f = Math.PI * u, [x, y] = ringP(f, 7.5); return [x, y, zf - 0.75 * v, 8.2 * Math.PI * (1 - u) + 11, 0.3, 0.6]; }, MAT.VOUSSOIR, true);
      sb.grid(24, 1, (u, v) => { const f = Math.PI * u, [x, y] = ringP(f, 9.9); return [x, y, zf - 0.75 * v, 8.2 * Math.PI * (1 - u) + 11, 0.5, 0.7]; }, MAT.VOUSSOIR, true);
      for (const sx of [-1, 1]) {
        sb.grid(1, 4, (u, v) => [sx * (7.5 + 2.4 * u), 6.4 + (cy - 6.4) * v, zf, sx > 0 ? 11 - (cy - 6.4) * (1 - v) : 8.2 * Math.PI + 11 + (cy - 6.4) * (1 - v), u, 1], MAT.VOUSSOIR);
        sb.grid(1, 4, (u, v) => [sx * 7.5, 6.4 + (cy - 6.4) * v, zf - 0.75 * u, sx > 0 ? 11 - (cy - 6.4) * (1 - v) : 8.2 * Math.PI + 11 + (cy - 6.4) * (1 - v), 0.3, 0.6], MAT.VOUSSOIR, true);
        sb.grid(1, 4, (u, v) => [sx * 9.9, 6.4 + (cy - 6.4) * v, zf - 0.75 * u, 0, 0.5, 0.7], MAT.VOUSSOIR, true);
      }
      box(sb, [0, 5.9, zw + 1.6], [22, 1.0, 3.2], MAT.MARBLE, 0, (i, u, v) => (i === 1 ? [22 * u, v] : [0, 0]), true);
      for (const x of [-8.5, 0, 8.5]) box(sb, [x, 4.6, zw + 0.9], [1.2, 1.6, 1.8], MAT.MARBLE, 0, null, true);
    }
    await ctx.yield();
    await flush();

    // ------------------------------------------------------------------ water furniture: kerbs, the octagonal pool, the fountain, basins
    const wb = makeBuilder(), qb = makeBuilder();          // wb: falling sheets, qb: standing water (both: position and uv only)
    const RD = ctx.core.makeRng('hammam-drops:' + ctx.seed);
    const drops = [];                                      // bright droplets: spray under the fountain's threads and the taps, drips from the vaults
    const T8 = Math.tan(Math.PI / 8);
    {
      const cp = [[6, -0.1], [6, 0.5], [6.12, 0.62], [7.1, 0.62], [7.25, 0.5], [7.25, 0]];
      for (const [zA, zB] of [[Z_WARM_E, Z_FOUNT - 18], [Z_FOUNT + 18, Z_WEST + 60]]) for (const sg of [-1, 1]) {
        const nz = Math.ceil((zB - zA) / 7);
        for (let s = 0; s < cp.length - 1; s++) sb.grid(nz, 1, (u, v) => [sg * lerp(cp[s][0], cp[s + 1][0], v), lerp(cp[s][1], cp[s + 1][1], v), lerp(zA, zB, u), (zB - zA) * u, s === 4 ? v : 0, s === 1 ? 0.75 + 0.25 * v : 1], MAT.MARBLE, true);
        for (const zc of [zA, zB]) sb.grid(1, 1, (u, v) => [sg * (6 + 1.25 * u), 0.62 * v, zc, 0, 0, 0.8], MAT.MARBLE, true);
      }
      const op = [[18, -0.1], [18, 0.5], [18.12, 0.62], [19.1, 0.62], [19.25, 0.5], [19.25, 0]];
      for (const k of [1, 2, 3, 5, 6, 7]) {
        const a = k * Math.PI / 4, nx = Math.sin(a), nz = Math.cos(a);
        for (let s = 0; s < op.length - 1; s++) sb.grid(4, 1, (u, v) => { const ap = lerp(op[s][0], op[s + 1][0], v), l = (u * 2 - 1) * ap * T8; return [nx * ap + nz * l, lerp(op[s][1], op[s + 1][1], v), Z_FOUNT + nz * ap - nx * l, l + k * 17, s === 4 ? v : 0, s === 1 ? 0.75 + 0.25 * v : 1]; }, MAT.MARBLE, true);
      }
      // standing water: the channel in two runs and the octagonal pool
      qb.grid(1, 6, (u, v) => [-6.02 + 12.04 * u, WATER_Y, lerp(Z_WARM_E, Z_FOUNT - 17.9, v), 0, 0, 1], 0, true);
      qb.grid(1, 6, (u, v) => [-6.02 + 12.04 * u, WATER_Y, lerp(Z_FOUNT + 17.9, Z_WEST + 60, v), 0, 0, 1], 0, true);
      qb.grid(8, 2, (u, v) => { const a = (u * 8 - 0.5) * Math.PI / 4, r = 18.02 / Math.cos(Math.PI / 8) * v; return [Math.sin(a) * r, WATER_Y, Z_FOUNT + Math.cos(a) * r, 0, 0, 1]; }, 0, true);
    }
    await ctx.yield();
    {
      // the fountain: three scalloped, gadrooned bowls on a banded stem, 9 m to the finial. Each bowl is one smooth
      // surface below (ribs swelling out of the stem into twelve lobes) and one above, meeting in a crisp rolled lip.
      const F0 = 0, FZ = Z_FOUNT, NS = 96;
      const lobe = (a) => Math.pow(Math.abs(Math.cos(6 * a)), 0.55) - 0.62;          // twelve round lobes, sharp cusps between
      const spline = (prof, t) => {
        const n = prof.length - 1, f = Math.min(n - 1e-6, Math.max(0, t * n)), i = Math.floor(f), k = f - i;
        const p0 = prof[Math.max(i - 1, 0)], p1 = prof[i], p2 = prof[i + 1], p3 = prof[Math.min(i + 2, n)];
        const cr = (a, b, c, d) => 0.5 * (2 * b + (c - a) * k + (2 * a - 5 * b + 4 * c - d) * k * k + (3 * b - a - 3 * c + d) * k * k * k);
        return [cr(p0[0], p1[0], p2[0], p3[0]), cr(p0[1], p1[1], p2[1], p3[1])];
      };
      const revolve = (prof, nv, tint, amp, ao) => {
        sb.tint = tint;
        sb.grid(NS, nv, (u, v) => { const a = u * Math.PI * 2, [r0, y] = spline(prof, v), r = Math.max(0, r0) * (1 + amp(v) * lobe(a)); return [F0 + Math.sin(a) * r, y, FZ + Math.cos(a) * r, a * 3, 0, ao(v, a)]; }, MAT.MARBLE);
      };
      const L = (prof, band, tint) => { sb.tint = tint; sb.lathe(F0, FZ, prof, 0, Math.PI * 2, 48, MAT.MARBLE, band, null); };
      const body = [0.92, 0.92, 0.92], under = [0.8, 0.82, 0.85], white = [1.04, 1.04, 1.03];
      const rib = (v, a) => 0.62 + 0.38 * v + 0.1 * Math.cos(12 * a);                // the valleys between ribs are darker
      L([[3.5, 0], [3.5, 0.5], [3.3, 0.62], [3.3, 0.9], [3.05, 1.0], [2.2, 1.06], [1.5, 1.18], [1.15, 1.5], [1.1, 2.1], [1.22, 2.22], [1.22, 2.3]], 7, body);
      revolve([[1.22, 2.3], [2.2, 2.42], [3.6, 2.68], [4.7, 3.02], [5.12, 3.26], [5.22, 3.42]], 12, under, (v) => 0.03 + 0.1 * ss(0.05, 0.9, v), rib);
      revolve([[5.22, 3.42], [5.3, 3.5], [5.2, 3.56], [5.0, 3.46], [4.6, 3.26], [2.6, 2.94], [1.0, 2.9]], 10, white, (v) => 0.13 * ss(0.75, 0.25, v), (v) => 1 - 0.3 * ss(0.3, 1, v));
      await ctx.yield();
      L([[1.0, 2.9], [0.95, 3.02], [0.8, 3.12], [0.8, 3.35], [0.72, 3.45], [0.72, 4.45], [0.8, 4.55], [0.8, 4.72], [0.95, 4.84]], 5, body);
      revolve([[0.95, 4.84], [1.6, 4.94], [2.5, 5.2], [3.12, 5.5], [3.36, 5.72], [3.42, 5.86]], 10, under, (v) => 0.03 + 0.1 * ss(0.05, 0.9, v), rib);
      revolve([[3.42, 5.86], [3.48, 5.93], [3.4, 5.98], [3.26, 5.9], [3.0, 5.72], [1.6, 5.46], [0.7, 5.42]], 8, white, (v) => 0.13 * ss(0.75, 0.25, v), (v) => 1 - 0.3 * ss(0.3, 1, v));
      await ctx.yield();
      L([[0.7, 5.42], [0.66, 5.52], [0.56, 5.6], [0.56, 5.9], [0.5, 5.98], [0.5, 6.85], [0.56, 6.93], [0.56, 7.05], [0.66, 7.14]], 5, body);
      revolve([[0.66, 7.14], [1.05, 7.24], [1.5, 7.42], [1.84, 7.64], [1.96, 7.78], [2.0, 7.86]], 8, under, (v) => 0.03 + 0.1 * ss(0.05, 0.9, v), rib);
      revolve([[2.0, 7.86], [2.04, 7.92], [1.98, 7.96], [1.88, 7.9], [1.62, 7.76], [0.8, 7.64], [0.46, 7.62]], 8, white, (v) => 0.13 * ss(0.75, 0.25, v), (v) => 1 - 0.3 * ss(0.3, 1, v));
      L([[0.46, 7.62], [0.36, 8.2], [0.5, 8.42], [0.56, 8.56], [0.3, 8.8], [0.12, 8.94], [0, 9.0]], -1, white);
      sb.tint = [1, 1, 1];
      await ctx.yield();
      // water: threads off every cusp (the sheet shader's thread mode: uv.x = 100 + scallops round, fract 0.5 at a cusp)
      const tiers = [[5.3, 3.5, WATER_Y, 4.85, 3.3], [3.48, 5.93, 3.3, 3.1, 5.76], [2.04, 7.92, 5.76, 1.72, 7.8]];
      tiers.forEach(([rl, yl, yb, rw, yw], i) => {
        wb.grid(NS, 5, (u, v) => { const a = u * Math.PI * 2, r = (rl + 0.02 + 0.55 * v * v) * (1 + 0.13 * (1 - v) * lobe(a)); return [Math.sin(a) * r, yl - 0.02 - (yl - yb) * (0.22 * v + 0.78 * v * v), FZ + Math.cos(a) * r, a * 12 / (Math.PI * 2) + 100 + i * 20, v, 1]; }, 0);
        qb.grid(24, 1, (u, v) => { const a = u * Math.PI * 2, r = rw * v; return [Math.sin(a) * r, yw, FZ + Math.cos(a) * r, 0, 0, 1]; }, 0, true);
        // spray where each thread lands
        for (let k = 0; k < 12; k++) for (let j = 0; j < 5; j++) {
          const a = (k + 0.5) / 12 * Math.PI * 2 + RD.range(-0.05, 0.05), rr = rl + 0.57 + RD.range(-0.12, 0.12), out = RD.range(0.2, 1.6), tw = RD.range(-0.7, 0.7), vy = RD.range(2.0, 4.6);
          drops.push({ p: [Math.sin(a) * rr, yb + 0.04, FZ + Math.cos(a) * rr], v: [Math.sin(a) * out + Math.cos(a) * tw, vy, Math.cos(a) * out - Math.sin(a) * tw], size: RD.range(0.045, 0.085), ph: RD(), period: 2 * vy / 6, g: 6, bright: RD.range(1.0, 2.2) });
        }
      });
      for (let j = 0; j < 8; j++) {          // the crown of jets from the finial
        const a = j / 8 * Math.PI * 2 + 0.2, dx = Math.sin(a), dz = Math.cos(a);
        for (const w of [0.12, -0.12]) wb.grid(1, 6, (u, v) => { const r = 0.15 + 1.45 * v, y = 8.95 + 2.4 * v * (1 - v) - 1.2 * v, o = (u - 0.5) * 2 * w; return [dx * r + dz * o, y, FZ + dz * r - dx * o, j * 1.37 + (w > 0 ? 0.3 : 0.75), 0.15 + 0.8 * v, 1]; }, 0);
      }
    }
    await ctx.yield();
    await flush();
    // six basins in the warm room, one under the portal; copper ewers on the floor by the kerbs
    const basins = [];
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) basins.push({ x: sx * 14.5, z: Z_WARM_E + WB * (i + 0.5), ox: sx, oz: 0 });
    basins.push({ x: 0, z: Z_REC_E + 6.6, ox: 0, oz: 1 });
    for (const [i, bs] of basins.entries()) {          // (a basin is a few ms: yield after each)
      basinInto(sb, bs, bs.ox, bs.oz); basinSheetInto(wb, bs, i + 11); basinWaterInto(qb, bs);
      for (let j = 0; j < 7; j++) { const a = RD.range(0, 6.283), out = RD.range(0.3, 1.3), vy = RD.range(1.6, 3.4);      // the tap's stream breaking in the basin
        drops.push({ p: [bs.spout[0], 2.74, bs.spout[2]], v: [Math.cos(a) * out, vy, Math.sin(a) * out], size: RD.range(0.04, 0.07), ph: RD(), period: 2 * vy / 6, g: 6, bright: RD.range(0.9, 1.8) }); }
      await ctx.yield();
    }
    {   // drips let go of the vaults and fall the whole height: warm room, the east arch's soffit, the recess
      const drip = (x, y, z) => { const g = 9.8, T = Math.sqrt(2 * (y - 0.1) / g); drops.push({ p: [x, y, z], v: [0, 0, 0], size: RD.range(0.085, 0.13), ph: RD(), period: T * RD.range(1.0, 1.5), g, bright: RD.range(1.3, 2.6) }); };
      const nW = Math.round(26 * detail), nA = Math.round(14 * detail), nR = Math.round(44 * detail);
      for (let i = 0; i < nW; i++) { const x = RD.range(-26, 26); drip(x, warmY(x) - 0.3, RD.range(Z_WARM_E + 2, Z_WARM_W - 2)); }
      for (let i = 0; i < nA; i++) { const x = RD.range(-8.5, 8.5); drip(x, 18 + Math.sqrt(Math.max(14.8 * 14.8 - (Math.abs(x) + 4.8) * (Math.abs(x) + 4.8), 0)) - 0.3, RD.range(-56.4, -55.2)); }
      for (let i = 0; i < nR; i++) { const x = RD.range(-11.5, 11.5); drip(x, recY(x) - 0.3, RD.range(Z_REC_E + 3, Z_REC_W - 2)); }
    }
    const copper = lin('#B8724A', 1.1), tin = lin('#E9E6DE', 1.0), wood = lin('#A87C52'), hemp = lin('#9A8A68');
    const ewer = (x, z, h) => {
      const k = h / 2.6;
      sb.tint = copper;
      sb.lathe(x, z, [[0.55, 0], [0.6, 0.08], [0.42, 0.2], [0.5, 0.34], [0.86, 0.75], [0.95, 1.15], [0.8, 1.5], [0.42, 1.82], [0.3, 2.05], [0.34, 2.25], [0.5, 2.5], [0.52, 2.6], [0.4, 2.56]].map(([r, y]) => [r * k, y * k]), 0, Math.PI * 2, 14, MAT.METAL);
      tube(sb, [[x + 0.5 * k, 2.4 * k, z], [x + 1.15 * k, 2.2 * k, z], [x + 1.25 * k, 1.5 * k, z], [x + 0.9 * k, 1.05 * k, z]], 0.07 * k, 5, MAT.METAL, 0.1, 0);
      tube(sb, [[x - 0.85 * k, 1.1 * k, z], [x - 1.3 * k, 1.7 * k, z], [x - 1.45 * k, 2.5 * k, z], [x - 1.7 * k, 2.75 * k, z]], (t) => (0.1 - 0.05 * t) * k, 5, MAT.METAL, 0.1, 0);
      sb.tint = [1, 1, 1];
    };
    await ctx.yield();
    for (const [x, z, h] of EWERS) { ewer(x, z, h); await ctx.yield(); }

    // ------------------------------------------------------------------ what was left out: towels, clogs, soap, lavender
    const towel = lin(towelHex), pearlT = lin(PALETTE[0], 0.95);
    const clogInto = (b, x, y, z, yaw, k = 1) => {       // a stilted wooden bath clog with a strap and a pearl inlay line
      const cy = Math.cos(yaw), sy = Math.sin(yaw), Pt = (lx, ly, lz) => [x + (lx * cy + lz * sy) * k, y + ly * k, z + (-lx * sy + lz * cy) * k];
      const out = (a) => { const c = Math.cos(a), s = Math.sin(a); return [0.24 * Math.sign(c) * Math.pow(Math.abs(c), 0.7) * (1 - 0.18 * s), 0.68 * Math.sign(s) * Math.pow(Math.abs(s), 0.8)]; };
      const rings = [[0, 0.62, wood], [0.62, 0.72, pearlT], [0.72, 1, wood]];
      for (const [r0, r1, t] of rings) { b.tint = t; b.grid(14, 1, (u, v) => { const [ox, oz] = out(u * Math.PI * 2), r = lerp(r0, r1, v); const p = Pt(ox * r, 0.46, oz * r); return [p[0], p[1], p[2], 0, 0.35, 1]; }, MAT.PLAIN, true); }
      b.tint = wood;
      b.grid(14, 1, (u, v) => { const [ox, oz] = out(u * Math.PI * 2); const p = Pt(ox, 0.46 - 0.1 * v, oz); return [p[0], p[1], p[2], 0, 0.2, 0.75]; }, MAT.PLAIN, true);
      for (const lz of [-0.36, 0.34]) for (let f = 0; f < 4; f++) {
        const q = [[-0.2, lz - 0.09], [0.2, lz - 0.09], [0.2, lz + 0.09], [-0.2, lz + 0.09]], a = q[f], c = q[(f + 1) % 4];
        b.grid(1, 1, (u, v) => { const p = Pt(lerp(a[0], c[0], u), 0.36 * v, lerp(a[1], c[1], u)); return [p[0], p[1], p[2], 0, 0.2, 0.55 + 0.3 * v]; }, MAT.PLAIN, true);
      }
      b.tint = lin('#6A4630');
      b.grid(6, 1, (u, v) => { const f = u * Math.PI; const p = Pt(Math.cos(f) * 0.25, 0.46 + Math.sin(f) * 0.24, 0.2 + 0.2 * v); return [p[0], p[1], p[2], 0, 0.3, 0.9]; }, MAT.PLAIN);
      b.tint = [1, 1, 1];
    };
    const foldedTowels = (x, z, yaw, n, col, y0 = 1.45) => {
      for (let i = 0; i < n; i++) { sb.tint = i % 2 ? pearlT : col; box(sb, [x + 0.08 * Math.sin(i * 2.1), y0 + 0.19 + i * 0.38, z + 0.1 * Math.cos(i * 1.7)], [2.4 - 0.1 * i, 0.36, 1.5], MAT.CLOTH, yaw + 0.06 * Math.sin(i * 3.3), (f, u) => [u * 2.4 + i * 0.4, 0]); }
      sb.tint = [1, 1, 1];
    };
    for (const sx of [-1, 1]) for (let i = 0; i < 7; i++) {
      const z = Z_A1 + 12 + i * 19.5 + R.range(-3, 3), x = sx * (41.4 + R.range(-0.6, 0.6)), kind = (i + (sx > 0 ? 1 : 0)) % 3;
      if (kind === 0) foldedTowels(x, z, R.range(-0.3, 0.3) + Math.PI / 2, R.int(2, 4), towel);
      else if (kind === 1) { clogInto(sb, x, 1.45, z, R.range(0, 6.28), 1.3); clogInto(sb, x + 0.7, 1.45, z + R.range(0.9, 1.3), R.range(0, 6.28), 1.3); }
      else {                                              // a tinned bowl with a cake of olive soap, a comb beside it
        sb.tint = tin; sb.lathe(x, z, [[0.0, 1.5], [0.7, 1.52], [1.1, 1.8], [1.2, 2.05], [1.12, 2.05], [1.0, 1.82], [0.6, 1.62], [0, 1.6]], 0, Math.PI * 2, 14, MAT.METAL);
        sb.tint = lin('#8E9A58'); ball(sb, [x + 0.1, 1.86, z], 0.42, MAT.PLAIN, 8, 4, [1.3, 0.6, 0.9], 0, 0.3);
        sb.tint = wood; box(sb, [x - 0.3, 1.5, z + 1.9], [1.5, 0.1, 0.5], MAT.PLAIN, R.range(-0.5, 0.5));
        sb.tint = [1, 1, 1];
      }
    }
    await ctx.yield();
    // towel lines high across the cool hall (the middle span is left clear so the three arches stay in line of sight)
    const ropeY = (x) => 15.2 - 1.7 * (1 - (x / HALL_X) * (x / HALL_X)), ropePerch = [];
    {
      const lines = [247, 225, 163, 147];
      lines.forEach((z, li) => {
        sb.tint = hemp;
        const pts = []; for (let i = 0; i <= 14; i++) { const x = -HALL_X + 2 * HALL_X * i / 14; pts.push([x, ropeY(x), z]); }
        tube(sb, pts, 0.14, 4, MAT.PLAIN, 0, 0.05);
        for (const sx of [-1, 1]) {
          let x = 13 + R.range(0, 2.5);
          while (x < 40) {
            const w = R.range(2.8, 3.6), len = R.range(4.2, 6.6), kindR = R(), x0 = sx * x, off = R.range(0, 3), ph = R.range(0, 6.28);
            if (R() < 0.82 * density) {
              if (kindR < 0.14) {                                            // a bunch of dried lavender or bay
                sb.tint = kindR < 0.07 ? lin('#77709E') : lin('#6E8052');
                const xc = x0 + sx * w / 2, y0 = ropeY(xc);
                tube(sb, [[xc, y0, z], [xc, y0 - 0.5, z], [xc, y0 - 1.3, z], [xc, y0 - 2.2, z]], (t) => 0.06 + 0.5 * Math.sin(Math.min(1, t * 1.15) * Math.PI) * t, 6, MAT.PLAIN, 0.5, 0);
              } else {
                sb.tint = kindR < 0.3 ? pearlT : towel;
                sb.grid(3, 6, (u, v) => { const xx = x0 + sx * w * u; return [xx, ropeY(xx) + 0.12 - len * v, z + 0.22 * Math.sin(u * 4 + ph) * v, len * v + off, v * v * 0.9, 0.78 + 0.22 * (1 - v) + 0.1 * Math.sin(u * 9 + ph)]; }, MAT.CLOTH);
              }
            }
            x += w + R.range(0.7, 2.2);
          }
        }
        // sparrows perched on the clear span
        if (li === 1 || li === 2) for (let k = 0; k < 3; k++) {
          const x = R.range(-9, 9), y = ropeY(x) + 0.24, yaw = R.range(-0.5, 0.5);
          ropePerch.push([x, y, z, yaw + (li === 1 ? 0 : Math.PI)]);          // (drawn with the flock's own mesh, below)
        }
      });
      sb.tint = [1, 1, 1];
    }
    await flush();
    // two bitter-orange trees in inlaid tubs beyond the pool
    for (const sx of [-1, 1]) {
      const tx = sx * TREE_X, tz = TREE_Z;
      sb.tint = lin(accentHex, 0.85).map((c, i) => c * 0.6 + [0.5, 0.52, 0.5][i] * 0.4);
      sb.lathe(tx, tz, [[1.7, 0], [1.75, 0.25], [1.6, 0.35], [2.15, 1.7], [2.3, 2.15], [2.2, 2.3], [2.0, 2.2], [1.9, 2.0], [0, 2.0]], 0, Math.PI * 2, 20, MAT.MARBLE, 3);
      sb.tint = lin('#5A4634');
      tube(sb, [[tx, 1.9, tz], [tx + 0.25, 3.6, tz + 0.1], [tx - 0.1, 5.4, tz - 0.15], [tx + 0.1, 6.8, tz]], (t) => 0.36 - 0.14 * t, 7, MAT.PLAIN, 0, 0.1);
      for (let k = 0; k < 4; k++) { const a = k * 1.6 + sx, r = 1.9; tube(sb, [[tx, 6.2, tz], [tx + Math.cos(a) * r * 0.5, 7.3, tz + Math.sin(a) * r * 0.5], [tx + Math.cos(a) * r, 8.3, tz + Math.sin(a) * r]], 0.12, 4, MAT.PLAIN, 0.05, 0.1); }
      sb.tint = lin('#2C4A2A', 0.8); ball(sb, [tx, 8.7, tz], 2.7, MAT.PLAIN, 10, 6, [1.1, 0.9, 1.1], 0.15, 0.15);
      const nLeaf = Math.round(330 * detail);
      for (let i = 0; i < nLeaf; i++) {
        const a = R.range(0, 6.283), el = Math.asin(R.range(-0.75, 1)), rr = R.range(2.5, 3.9);
        const c = [tx + Math.cos(a) * Math.cos(el) * rr * 1.1, 8.7 + Math.sin(el) * rr * 0.92, tz + Math.sin(a) * Math.cos(el) * rr * 1.1];
        const b1 = R.range(0, 6.283), b2 = R.range(-0.6, 0.6), sLeaf = R.range(0.5, 0.85);
        const ax = [Math.cos(b1) * sLeaf, Math.sin(b2) * sLeaf * 0.6, Math.sin(b1) * sLeaf], ay = [-Math.sin(b1) * sLeaf * 0.5, 0.25 * sLeaf, Math.cos(b1) * sLeaf * 0.5];
        const g = R.range(0.75, 1.3), lit = 0.6 + 0.4 * ss(-2, 3.5, c[1] - 8.7);
        sb.tint = R() < 0.2 ? lin('#6C8E3C', g * lit) : lin('#3F6A34', g * lit);
        card(sb, c, ax, ay, MAT.PLAIN, 0.3, 0.3);
      }
      sb.tint = lin('#E8872A', 1.05);
      for (let i = 0; i < 16; i++) { const a = R.range(0, 6.283), el = Math.asin(R.range(-0.6, 0.7)), rr = R.range(3.0, 3.7); ball(sb, [tx + Math.cos(a) * Math.cos(el) * rr * 1.1, 8.7 + Math.sin(el) * rr * 0.92, tz + Math.sin(a) * Math.cos(el) * rr * 1.1], 0.4, MAT.PLAIN, 6, 4, [1, 1, 1], 0.12, 0.4); }
      sb.tint = [1, 1, 1];
      await ctx.yield();
    }
    await flush();
    // jasmine trained round the first arch: two stems up the pilasters and round the ring, leaves, white flowers
    {
      const c = 3.45, rho = 13.45 + 3.0, hs = 17, zJ = Z_A1 + 0.75;
      for (const sg of [-1, 1]) {
        const stem = [];
        for (let i = 0; i <= 6; i++) stem.push([sg * (13.05 + 0.3 * Math.sin(i * 2.1)), hs * i / 6, zJ]);
        const fEnd = Math.PI - (Math.PI - Math.acos(-c / rho)) * (sg > 0 ? 0.8 : 0.62);
        for (let i = 1; i <= 12; i++) { const f = Math.PI + (fEnd - Math.PI) * i / 12; stem.push([-sg * (c + rho * Math.cos(f)) + 0.25 * Math.sin(i * 1.7), hs + rho * Math.sin(f), zJ]); }
        sb.tint = lin('#4A4A2C');
        tube(sb, stem, (t) => 0.2 - 0.12 * t, 5, MAT.PLAIN, 0, 0.1);
        const nL = Math.round(230 * detail);
        for (let i = 0; i < nL; i++) {
          const t = Math.pow(R(), 0.8) * (stem.length - 1), k = Math.min(Math.floor(t), stem.length - 2), f = t - k, p0 = stem[k], p1 = stem[k + 1];
          const spread = 0.5 + 1.3 * (t / stem.length), cc = [lerp(p0[0], p1[0], f) + R.range(-spread, spread), lerp(p0[1], p1[1], f) + R.range(-spread, spread), zJ + R.range(-0.2, 0.7)];
          const b1 = R.range(0, 6.283), s = R.range(0.3, 0.55);
          if (i % 3 === 0) { sb.tint = [1.05, 1.03, 0.93]; card(sb, cc, [Math.cos(b1) * 0.3, Math.sin(b1) * 0.3, 0], [-Math.sin(b1) * 0.3, Math.cos(b1) * 0.3, 0.1], MAT.PLAIN, 0.14, 0.2); }
          else { sb.tint = lin(R() < 0.3 ? '#5E8440' : '#3A5E30', R.range(0.8, 1.25)); card(sb, cc, [Math.cos(b1) * s, Math.sin(b1) * s, 0.1], [-Math.sin(b1) * s * 0.5, Math.cos(b1) * s * 0.5, 0.15], MAT.PLAIN, 0.14, 0.3); }
        }
      }
      sb.tint = [1, 1, 1];
    }
    // towels on rails in the blind arches of the warm room and the recess
    {
      const rail = (sx, xb, zc, y, half, len) => {
        sb.tint = lin('#8A6A48'); tube(sb, [[xb, y, zc - half], [xb, y, zc], [xb, y, zc + half]], 0.11, 5, MAT.PLAIN, 0, 0.2);
        for (const o of [-0.5, 0.5]) {
          const z0 = zc + o * half - half * 0.36, w = half * 0.72, l = len * R.range(0.82, 1.05), off = R.range(0, 3), ph = R.range(0, 6.28);
          sb.tint = R() < 0.3 ? pearlT : towel;
          sb.grid(3, 6, (u, v) => [xb - sx * (0.14 + 0.1 * Math.sin(u * 5 + ph) * v), y + 0.1 - l * v, z0 + w * u, l * v + off, v * v * 0.4, 0.74 + 0.26 * (1 - v) + 0.08 * Math.sin(u * 9 + ph)], MAT.CLOTH);
        }
      };
      for (const sx of [-1, 1]) {
        for (let i = 0; i < 3; i++) rail(sx, sx * (WARM_X + 4 * WS - 0.35), Z_WARM_E + WB * (i + 0.5), 11.2, 4.6, 5.6);
        for (let i = 0; i < NREC; i++) rail(sx, sx * (REC_X + 5 * RS - 0.35), Z_REC_E + RB * (i + 0.5), 10.4, 4.2, 5.2);
      }
      sb.tint = [1, 1, 1];
    }
    // pairs of clogs left on the warm room floor and at the foot of the platform steps of the recess
    for (const [x, z, yaw] of [[-20, 112, 0.4], [-19, 113.4, 0.9], [21, 84, 2.1], [22.3, 84.6, 2.5], [-10.5, -70, 0.3], [-10, -68.4, -0.2]]) clogInto(sb, x, 0, z, yaw, 1.3);
    await flush();

    // ------------------------------------------------------------------ brass lamps hung on chains in every arch and bay; the furnace mouth
    const lamps = [], amberG = [2.1, 0.74, 0.1];            // lamps: [x, y, z, strength (negative: a pair, mirrored in x)]
    const lampInto = (x, y, z, k, topY) => {               // y = the middle of the glass; k = size (1: 3 m from cap to finial)
      sb.tint = lin('#7A5A2A');
      tube(sb, [[x, topY, z], [x, (topY + y + 1.5 * k) / 2, z], [x, y + 1.5 * k, z]], 0.09 + 0.04 * k, 4, MAT.PLAIN, 0, 0.4);
      sb.tint = lin('#C9963E');
      sb.lathe(x, z, [[0.06, 1.5], [0.3, 1.4], [0.22, 1.2], [0.6, 1.02], [0.72, 0.86], [0.62, 0.8]].map(([r, h]) => [r * k, y + h * k]), 0, Math.PI * 2, 10, MAT.METAL);
      sb.lathe(x, z, [[0.62, -0.8], [0.72, -0.86], [0.5, -1.05], [0.2, -1.2], [0.26, -1.34], [0.0, -1.55]].map(([r, h]) => [r * k, y + h * k]), 0, Math.PI * 2, 10, MAT.METAL);
      sb.tint = amberG;
      const nLat = Math.round(5 * k + 2);
      sb.grid(10, 4, (u, v) => { const a = u * Math.PI * 2, r = (0.62 + 0.3 * Math.sin(v * Math.PI)) * k; return [x + Math.sin(a) * r, y + (-0.8 + 1.6 * v) * k, z + Math.cos(a) * r, u * nLat / 2.2, v, 1]; }, MAT.GLOW);
      sb.tint = [1, 1, 1];
    };
    const hang = (x, y, z, k, topY, str, pair = false) => { lampInto(x, y, z, k, topY); if (pair) lampInto(-x, y, z, k, topY); lamps.push([x, y, z, pair ? -str : str]); };
    for (let i = 0; i < 5; i++) hang(46.3, 12.5, Z_A1 + BAY * (i + 0.5), 1.25, 25.6, 1.3, true);            // the cool hall's blind bays
    hang(0, 13, 127, 1.8, 30, 1.6); hang(6.2, 10.5, 127, 1.1, 26.2, 1.0, true); hang(30, 12, Z_A1 - 1.6, 1.15, 25.6, 1.0, true);   // the first arch and the two beside it
    await ctx.yield();
    for (let i = 0; i < 3; i++) hang(30.9, 8, Z_WARM_E + WB * (i + 0.5), 0.9, 15.3, 1.0, true);             // the warm room's bays, and one great lantern under its vault
    hang(0, 17, 93, 2.2, 38, 1.8);
    hang(0, 22, 59, 1.7, 32, 1.2); hang(6.5, 13, 59, 1.1, 27.4, 1.0, true);                                // the hot room's west arch
    hang(57.5, 13, 0, 1.5, 30, 1.5, true);                                                                  // its north and south iwans
    hang(41.7, 12, 41.7, 1.4, 25.8, 1.4, true); hang(41.7, 12, -41.7, 1.4, 25.8, 1.4, true);                // the four diagonal arches
    hang(52.7, 11, 52.7, 2.0, 41, 2.0, true); hang(52.7, 11, -52.7, 2.0, 41, 2.0, true);                    // the corner chambers
    for (const sx of [-1, 1]) lampInto(sx * 6.5, 24.5, -60.5, 1.0, 30.8);                                    // high behind the east arch, clear of the way out (these and the great lanterns down the chamber are seen, the niche lamps do the lighting)
    await ctx.yield();
    for (let i = 0; i < 3; i++) for (const sx of [-1, 1]) lampInto(sx * 8.6, 21.5, Z_REC_W - 22 - i * 22, 1.2, 28.4);     // down the chamber
    for (let i = 0; i < NREC; i++) hang(13.5, 9.4, Z_REC_E + RB * (i + 0.5), 0.85, 13.9, 1.5, true);          // one in the mouth of every niche
    hang(8.3, 22.2, CONCH_Z + 3.4, 1.3, 29.5, 1.7, true);                                                   // before the striped arch of the half-dome
    hang(9.6, 13.5, Z_REC_E + 5, 1.3, 24.2, 2.1, true);                                                     // either side of the portal, under the honeycomb
    lamps.push([0, 2.4, PZ, 1.5]);                                                                          // the floating lamps on the chamber's pool
    {   // the furnace mouth in the warm room's far wall, north of the arch: a fire behind iron bars in a dark stone surround
      const fx0 = -20, fz = Z_WARM_E + 1.25;
      sb.tint = [0.3, 0.28, 0.27]; box(sb, [fx0, 3.7, Z_WARM_E + 0.6], [8.0, 7.4, 1.2], MAT.MARBLE, 0, (i, u, v) => (i === 1 ? [8 * u, 0] : [0, 0]));
      sb.tint = [2.5, 0.85, 0.13];
      sb.grid(8, 1, (u, v) => { const top = 4.0 + 1.9 * (1 - Math.pow(Math.abs(2 * u - 1), 1.6)); return [fx0 - 2.7 + 5.4 * u, 0.5 + (top - 0.5) * v, fz, u * 5.4, 2 + v * (top - 0.5) / 5.4, 1]; }, MAT.GLOW, true);
      sb.tint = lin('#C9963E');
      const arc = []; for (let i = 0; i <= 10; i++) { const u = i / 10; arc.push([fx0 - 2.9 + 5.8 * u, 4.15 + 1.95 * (1 - Math.pow(Math.abs(2 * u - 1), 1.6)), fz + 0.05]); }
      tube(sb, [[fx0 - 2.9, 0.4, fz + 0.05], ...arc, [fx0 + 2.9, 0.4, fz + 0.05]], 0.16, 5, MAT.METAL);
      sb.tint = [1, 1, 1];
      lamps.push([fx0, 3.2, Z_WARM_E + 3.5, 2.6]);
    }
    lamps.slice(0, hero.maxLamps).forEach((l, i) => HU.uLamp.value[i].set(l[0], l[1], l[2], l[3]));
    await flush();
    // the warm room's side bays, full of what the bathers use: bright towels drying on lines across the room, low stools with
    // folded cloths, copper ewers and bowls, clogs left in pairs
    {
      const BRIGHT = ['#B8322A', '#E0A020', '#27407F', '#1F9A96', '#A23A2C', '#7A3E9A'];
      let nb = 0;
      for (const zL of [Z_WARM_E + WB, Z_WARM_E + 2 * WB]) for (const sx of [-1, 1]) {
        const xA = sx * 29.6, xB = sx * 9.2, yL = (x) => 10.6 - 1.3 * (1 - Math.pow((2 * (x - xA) / (xB - xA) - 1), 2));
        sb.tint = hemp; const pts = []; for (let i = 0; i <= 8; i++) { const x = lerp(xA, xB, i / 8); pts.push([x, yL(x), zL]); }
        tube(sb, pts, 0.12, 4, MAT.PLAIN, 0, 0.05);
        sb.tint = lin('#8A6A48'); tube(sb, [[xB, 0, zL], [xB, 5, zL], [xB, yL(xB) + 0.3, zL]], 0.16, 5, MAT.PLAIN, 0, 0.2);      // the post that carries the line by the kerb
        let x = 11.2;
        while (x < 26.5) {
          const w = R.range(2.6, 3.4), len = R.range(4.4, 6.0), x0 = sx * x, off = R.range(0, 3), ph = R.range(0, 6.28);
          sb.tint = lin(BRIGHT[(nb++) % BRIGHT.length], 1.1);
          sb.grid(3, 6, (u, v) => { const xx = x0 + sx * w * u; return [xx, yL(xx) + 0.12 - len * v, zL + 0.22 * Math.sin(u * 4 + ph) * v, len * v + off, v * v * 0.8, 0.8 + 0.2 * (1 - v) + 0.1 * Math.sin(u * 9 + ph)]; }, MAT.CLOTH);
          x += w + R.range(0.5, 1.4);
        }
      }
      await ctx.yield();
      for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
        const zc = Z_WARM_E + WB * (i + 0.5), xs = sx * 22.5, zs = zc + (i === 1 ? 6.5 : -6.5);
        sb.tint = wood; box(sb, [xs, 1.0, zs], [3.0, 0.3, 2.2], MAT.PLAIN, 0.2 * sx);
        for (const [dx, dz] of [[-1.2, -0.8], [1.2, -0.8], [-1.2, 0.8], [1.2, 0.8]]) box(sb, [xs + dx, 0.45, zs + dz], [0.3, 0.9, 0.3], MAT.PLAIN, 0.2 * sx);
        foldedTowels(xs, zs, 0.2 * sx, 3 + (i % 2), lin(BRIGHT[(i * 2 + (sx > 0 ? 1 : 0)) % BRIGHT.length], 1.1), 1.15);
        ewer(sx * 20.2, zc + 4.2 * (i === 1 ? -1 : 1), 2.9); ewer(sx * 10.2, zc + 7.5, 2.3);
        sb.tint = copper; sb.lathe(sx * 18.5, zc - 5.2 * (i === 1 ? -1 : 1), [[0, 0.1], [0.9, 0.12], [1.5, 0.5], [1.7, 1.0], [1.6, 1.0], [1.4, 0.6], [0.8, 0.3], [0, 0.28]], 0, Math.PI * 2, 14, MAT.METAL);
        sb.tint = [1, 1, 1];
        clogInto(sb, sx * 11.5, 0, zc - 3.5, 0.5 + i, 1.3); clogInto(sb, sx * 12.4, 0, zc - 2.6, 1.1 + i, 1.3);
        await ctx.yield();
      }
    }
    // ------------------------------------------------------------------ the chamber of honour before the portal
    // An octagonal pool with a slim fountain and floating lamps in the middle of the recess floor; over the portal a
    // honeycomb half-dome behind a striped arch; every blind arch a furnished niche with its own lamp.
    {
      const op = [[6.5, -0.1], [6.5, 0.5], [6.62, 0.62], [7.6, 0.62], [7.75, 0.5], [7.75, 0.12], [7.95, 0]];
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4, nx = Math.sin(a), nz = Math.cos(a);
        for (let q = 0; q < op.length - 1; q++) sb.grid(3, 1, (u, v) => { const ap = lerp(op[q][0], op[q + 1][0], v), l = (u * 2 - 1) * ap * T8; return [nx * ap + nz * l, lerp(op[q][1], op[q + 1][1], v), PZ + nz * ap - nx * l, l + k * 11, q === 4 ? v : 0, q === 1 ? 0.75 + 0.25 * v : 1]; }, MAT.MARBLE, true);
      }
      qb.grid(8, 2, (u, v) => { const a = (u * 8 - 0.5) * Math.PI / 4, r = 6.52 / Math.cos(Math.PI / 8) * v; return [Math.sin(a) * r, WATER_Y, PZ + Math.cos(a) * r, 0, 0, 1]; }, 0, true);
      // the fountain: a banded stem, one scalloped bowl, a finial and a thin jet
      const lobe = (a) => Math.pow(Math.abs(Math.cos(6 * a)), 0.55) - 0.62;
      // (the sheet shader draws a strip only where its lane noise is high: find lanes that run full)
      const fr = (x) => x - Math.floor(x), hh = (x, y) => { let a = fr(x * 0.1031), b = fr(y * 0.1031), c = fr(x * 0.1031); const d = a * (b + 33.33) + b * (c + 33.33) + c * (a + 33.33); a += d; b += d; c += d; return fr((a + b) * c); };
      const laneOf = (x) => { const q = x * 1.6, i = Math.floor(q), f = q - i, k = f * f * (3 - 2 * f); return lerp(hh(i, 3), hh(i + 1, 3), k); };
      const lanes = []; for (let x = 0.2; x < 90 && lanes.length < 16; x += 0.21) if (laneOf(x) > 0.72) { lanes.push(x); x += 0.4; }
      sb.tint = [0.94, 0.94, 0.93];
      sb.lathe(0, PZ, [[1.7, 0], [1.7, 0.75], [1.5, 0.9], [0.8, 1.0], [0.56, 1.25], [0.66, 1.6], [0.82, 1.95], [0.7, 2.3], [0.52, 2.55], [0.6, 2.65], [0.6, 2.8], [0.5, 2.9], [0.52, 3.3], [0.7, 3.45]], 0, Math.PI * 2, 24, MAT.MARBLE, 1);
      sb.tint = [0.82, 0.84, 0.87];
      sb.lathe(0, PZ, [[0.7, 3.45], [1.3, 3.58], [2.3, 3.86], [2.95, 4.2], [3.12, 4.44]], 0, Math.PI * 2, 72, MAT.MARBLE, -1, (a, y) => 1 + 0.22 * ss(3.5, 4.3, y) * lobe(a));
      sb.tint = [1.2, 1.2, 1.18];
      sb.lathe(0, PZ, [[3.12, 4.44], [3.2, 4.54], [3.06, 4.6], [2.82, 4.5], [2.5, 4.2], [1.9, 3.98], [0.5, 3.9], [0.34, 4.3], [0.26, 5.1], [0.4, 5.3], [0.4, 5.45], [0.16, 5.7], [0, 5.76]], 0, Math.PI * 2, 72, MAT.MARBLE, -1, (a, y) => 1 + 0.22 * ss(3.95, 4.5, y) * ss(5.0, 4.6, y) * lobe(a));
      sb.tint = [1, 1, 1];
      wb.grid(72, 5, (u, v) => { const a = u * Math.PI * 2, r = (3.2 + 0.5 * v * v) * (1 + 0.22 * (1 - v) * lobe(a)); return [Math.sin(a) * r, 4.5 - 4.2 * (0.22 * v + 0.78 * v * v), PZ + Math.cos(a) * r, a * 12 / (Math.PI * 2) + 180, v, 1]; }, 0);
      qb.grid(24, 1, (u, v) => { const a = u * Math.PI * 2, r = 1.8 * v; return [Math.sin(a) * r, 3.97, PZ + Math.cos(a) * r, 0, 0, 1]; }, 0, true);      // the water stands low in the bowl: its white inner wall and scalloped lip show from above
      for (let j = 0; j < 2; j++) for (const w of [0.11, -0.11]) wb.grid(1, 6, (u, v) => { const y = 5.7 + 2.7 * v, o = (u - 0.5) * 2 * w * (1 - 0.5 * v); return [j ? o : 0, y, PZ + (j ? 0 : o), lanes[(j * 2 + (w > 0 ? 0 : 1)) % lanes.length], 0.85 - 0.7 * v, 1]; }, 0);      // the jet
      for (let j = 0; j < 6; j++) {          // and its water falling back in six fine arcs
        const a = j / 6 * Math.PI * 2 + 0.3, dx = Math.sin(a), dz = Math.cos(a);
        for (const w of [0.07, -0.07]) wb.grid(1, 6, (u, v) => { const r = 0.1 + 1.9 * v, y = 8.3 + 1.0 * v * (1 - v) - 3.85 * v * v, o = (u - 0.5) * 2 * w; return [dx * r + dz * o, y, PZ + dz * r - dx * o, lanes[(4 + j * 2 + (w > 0 ? 0 : 1)) % lanes.length], 0.15 + 0.8 * v, 1]; }, 0);
      }
      for (let k = 0; k < 12; k++) for (let j = 0; j < 4; j++) {
        const a = (k + 0.5) / 12 * Math.PI * 2 + RD.range(-0.05, 0.05), rr = 3.7 + RD.range(-0.12, 0.12), out = RD.range(0.2, 1.4), vy = RD.range(1.8, 4.0);
        drops.push({ p: [Math.sin(a) * rr, WATER_Y + 0.04, PZ + Math.cos(a) * rr], v: [Math.sin(a) * out, vy, Math.cos(a) * out], size: RD.range(0.045, 0.08), ph: RD(), period: 2 * vy / 6, g: 6, bright: RD.range(1.0, 2.0) });
      }
      for (let j = 0; j < 14; j++) { const a = RD.range(0, 6.283), out = RD.range(0.3, 1.1), vy = RD.range(2.4, 4.6); drops.push({ p: [0, 8.2, PZ], v: [Math.cos(a) * out, vy * 0.4, Math.sin(a) * out], size: RD.range(0.05, 0.08), ph: RD(), period: 1.1, g: 6, bright: RD.range(1.2, 2.4) }); }
      // floating lamps: small brass cups with a flame behind pierced sides, and rose petals drifting between them
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4 + 0.5, r = 4.3 + 1.1 * Math.sin(i * 1.9), x = Math.sin(a) * r, z = PZ + Math.cos(a) * r;
        sb.tint = lin('#C9963E'); sb.lathe(x, z, [[0, 0.3], [0.34, 0.32], [0.5, 0.5], [0.52, 0.62]], 0, Math.PI * 2, 8, MAT.METAL);
        sb.tint = [2.6, 1.0, 0.16]; sb.grid(8, 2, (u, v) => { const b = u * Math.PI * 2, rr = 0.3 * Math.sin((0.15 + 0.85 * v) * Math.PI * 0.9) + 0.03; return [x + Math.sin(b) * rr, 0.6 + 0.62 * v, z + Math.cos(b) * rr, u * 2, 0.2 + 0.6 * v, 1]; }, MAT.GLOW);
      }
      for (let i = 0; i < 46; i++) {
        const a = R.range(0, 6.283), r = Math.sqrt(R.range(0.35, 1)) * 6.1, b1 = R.range(0, 6.283), sP = R.range(0.2, 0.34);
        sb.tint = R() < 0.3 ? [0.95, 0.72, 0.7] : lin('#C2364E', R.range(0.8, 1.2));
        card(sb, [Math.sin(a) * r, WATER_Y + 0.035, PZ + Math.cos(a) * r], [Math.cos(b1) * sP, 0, Math.sin(b1) * sP], [-Math.sin(b1) * sP * 0.7, 0, Math.cos(b1) * sP * 0.7], MAT.PLAIN, 0.02, 0.3);
      }
      sb.tint = [1, 1, 1];
    }
    await ctx.yield();
    {   // the striped arch that carries the half-dome, its tiled spandrel up to the vault, the shelf under the dome's corners
      const zf = CONCH_Z + 0.7, RO = 1.9, AL = 35;
      const el = (t, o) => [(CONCH_W + o) * Math.cos(t), CONCH_Y + (CONCH_H + o) * Math.sin(t)];
      sb.grid(28, 1, (u, v) => { const [x, y] = el(Math.PI * u, RO * v); return [x, y, zf, AL * (1 - u) + 3, v, 1]; }, MAT.VOUSSOIR);
      sb.grid(28, 1, (u, v) => { const [x, y] = el(Math.PI * u, 0); return [x, y, zf - 0.9 * v, AL * (1 - u) + 3, 0.3, 0.62]; }, MAT.VOUSSOIR, true);
      sb.grid(20, 3, (u, v) => { const x = -REC_X + 2 * REC_X * u, k = Math.min(1, Math.abs(x) / (CONCH_W + RO)), y0 = CONCH_Y + (CONCH_H + RO) * Math.sqrt(1 - k * k), y = lerp(y0, Math.max(y0, recY(x) + 0.3), v); return [x, y, zf - 0.06, x + 40, y, 0.8 + 0.2 * (1 - v)]; }, MAT.TILE);
      for (const sx of [-1, 1]) { sb.tint = [0.95, 0.94, 0.92]; box(sb, [sx * 12.3, CONCH_Y - 0.75, CONCH_Z + 0.3], [1.6, 1.5, 2.0], MAT.MARBLE, 0, (i, u, v) => (i === 1 ? [2 * u, v] : [0, 0]), true); box(sb, [sx * 12.5, CONCH_Y - 2.1, CONCH_Z + 0.3], [1.1, 1.2, 1.4], MAT.MARBLE, 0, null, true); }
      sb.tint = [0.5, 0.52, 0.66];
      sb.grid(20, 1, (u, v) => { const a = -Math.PI / 2 + Math.PI * u, ex = CONCH_W * Math.sin(a), ez = CONCH_D * Math.cos(a), k = lerp(1, Math.min(REC_X / Math.max(Math.abs(ex), 1e-3), (CONCH_D + 0.05) / Math.max(ez, 1e-3)), v); return [ex * k, CONCH_Y, CONCH_Z - ez * k, 0, 0, 0.75]; }, MAT.MARBLE, true);
      // the dome's own shell behind the honeycomb: deep blue, seen only between the cells
      sb.tint = [0.1, 0.13, 0.3];
      sb.grid(18, 6, (u, v) => { const a = -Math.PI / 2 + Math.PI * u, f = v * Math.PI / 2, c = Math.cos(f) * 1.03; return [CONCH_W * c * Math.sin(a), CONCH_Y + CONCH_H * Math.sin(f) * 1.03, CONCH_Z - CONCH_D * c * Math.cos(a), 0, 0, 1]; }, MAT.PLAIN);
      sb.tint = [1, 1, 1];
    }
    await ctx.yield();
    {   // every blind arch of the chamber is a furnished niche: a marble bench with folded towels, copper and tin bowls, tall ewers at its feet
      const NB = ['#B8322A', '#E0A020', '#1F9A96', '#7A3E9A', '#27407F', '#A23A2C'];
      let q = 0;
      for (const sx of [-1, 1]) for (let i = 0; i < NREC; i++) {
        const zc = Z_REC_E + RB * (i + 0.5), xb = sx * 14.75, sg = (i + (sx > 0 ? 1 : 0)) % 2 ? 1 : -1;
        sb.tint = [0.96, 0.95, 0.93];
        box(sb, [xb, 0.7, zc], [1.9, 1.4, 8.8], MAT.MARBLE, 0, (f, u, v) => (f === 3 || f === 4 ? [8.8 * u, 0.3 + 0.4 * v] : [0, 0]));
        box(sb, [xb - sx * 0.2, 0.2, zc], [2.5, 0.4, 9.4], MAT.MARBLE, 0);
        foldedTowels(xb, zc - sg * 2.6, Math.PI / 2 + 0.1 * sg, 3 + (q % 2), lin(NB[q % NB.length], 1.1), 1.4);
        sb.tint = copper; sb.lathe(xb, zc + sg * 0.5, [[0, 1.42], [0.5, 1.44], [0.85, 1.75], [0.95, 2.15], [0.87, 2.15], [0.75, 1.82], [0.45, 1.58], [0, 1.56]], 0, Math.PI * 2, 14, MAT.METAL);
        sb.tint = tin; sb.lathe(xb, zc + sg * 2.9, [[0, 1.42], [0.45, 1.44], [0.7, 1.66], [0.78, 1.92], [0.7, 1.92], [0.6, 1.7], [0.35, 1.54], [0, 1.52]], 0, Math.PI * 2, 12, MAT.METAL);
        sb.tint = lin('#8E9A58'); ball(sb, [xb + 0.05, 1.82, zc + sg * 2.9], 0.3, MAT.PLAIN, 8, 4, [1.3, 0.6, 0.9], 0, 0.3);
        sb.tint = [1, 1, 1];
        ewer(sx * 12.1, zc + sg * 5.9, 3.5 + 0.5 * (q % 3)); if (q % 2 === 0) ewer(sx * 11.9, zc - sg * 5.6, 2.6);
        q++;
        await ctx.yield();
      }
    }
    // the portal's niche: a field of glazed tile behind its striped ring
    sb.grid(1, 1, (u, v) => [-12.4 + 24.8 * u, 6.4 + 21.2 * v, Z_REC_E + 0.14, u * 24.8, v * 21.2, 0.95], MAT.TILE, true);
    await flush();

    // water and falling sheets, drawn with the hero's own materials
    HU.uFount.value.set(0, Z_FOUNT, 5.85, 1);
    const water = new THREE.Mesh(qb.build(), hero.waterMaterial); water.frustumCulled = false; scene.add(water);
    await ctx.yield();
    const sheets = new THREE.Mesh(wb.build(), hero.sheetMaterial); sheets.frustumCulled = false; sheets.renderOrder = 1; scene.add(sheets);
    await ctx.yield();

    {   // droplets: one instanced quad for every spray and drip in the house
      const n = drops.length, a1 = new Float32Array(n * 4), a2 = new Float32Array(n * 4), a3 = new Float32Array(n * 4);
      drops.forEach((d, i) => { a1.set([d.p[0], d.p[1], d.p[2], d.v[1] > 0 ? d.p[1] - 0.02 : 0.12], i * 4); a2.set([d.v[0], d.v[1], d.v[2], d.size], i * 4); a3.set([d.ph, d.period, d.g, d.bright], i * 4); });
      const base = new THREE.PlaneGeometry(2, 2), g = new THREE.InstancedBufferGeometry();
      g.index = base.index; g.setAttribute('position', base.getAttribute('position'));
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(a1, 4)); g.setAttribute('aVel', new THREE.InstancedBufferAttribute(a2, 4)); g.setAttribute('aLife', new THREE.InstancedBufferAttribute(a3, 4));
      g.instanceCount = n;
      const dm = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: DROP_VERT, fragmentShader: DROP_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uBeamCol: HU.uBeamCol, uTime: HU.uTime }) }));
      dm.frustumCulled = false; dm.renderOrder = 6; scene.add(dm);
    }
    await ctx.yield();

    // the honeycomb ring under the cool hall's dome
    {
      const cell = buildCell(), TIERS = 3, PER = 72, m4 = new THREE.Matrix4();
      // ... and a honeycomb hood over the portal niche, corbelled out under the recess vault
      // (eight tiers on a quarter of an ellipsoid: each steps in and up over the one below, to a point above the portal)
      const hood = [], NT = 8, fAt = (j) => j / NT * Math.PI / 2 * 0.97;
      for (let j = 0; j < NT; j++) {
        const f = fAt(j), c = Math.cos(f), n = Math.max(3, Math.round(24 * c)), odd = j % 2, h = CONCH_H * (Math.sin(fAt(j + 1)) - Math.sin(f)) * 1.34, d = (c - Math.cos(fAt(j + 1))) * 11.8 + 0.95;
        const w = Math.PI * Math.sqrt((CONCH_W * CONCH_W + CONCH_D * CONCH_D) / 2) * c / n * 1.06;
        for (let i = 0; i < n + odd; i++) {
          const a = -Math.PI / 2 + (i + (odd ? 0 : 0.5)) / n * Math.PI, x = CONCH_W * c * Math.sin(a), dz = CONCH_D * c * Math.cos(a);
          let nx = -x / (CONCH_W * CONCH_W), nz = dz / (CONCH_D * CONCH_D); const nl = Math.hypot(nx, nz) || 1; nx /= nl; nz /= nl;
          hood.push([x, CONCH_Y + CONCH_H * Math.sin(f) - 0.1, CONCH_Z - dz, w, h, d, nx, nz]);
        }
      }
      const mq = new THREE.InstancedMesh(cell, hero.stoneMaterial, TIERS * PER + hood.length);
      const rAt = (v) => RING_R - (RING_R - CDOME_R) * Math.pow(Math.min(v, 1), 0.8);
      let i = 0;
      for (let j = 0; j < TIERS; j++) for (let c = 0; c < PER; c++) {
        const th = (c + 0.5 * (j % 2)) / PER * Math.PI * 2, v = j / TIERS, r = rAt(v) - 0.1, w = Math.PI * 2 * r / PER * 1.03, h = (CDOME_SPRING - HALL_TOP) / TIERS * 1.32, d = (r - rAt(v + 1 / TIERS)) + 0.9;
        const sx = Math.sin(th), cz = Math.cos(th);
        m4.set(cz * w, 0, -sx * d, sx * r, 0, h, 0, HALL_TOP + (CDOME_SPRING - HALL_TOP) * v - 0.1, -sx * w, 0, -cz * d, Z_FOUNT + cz * r, 0, 0, 0, 1);
        mq.setMatrixAt(i++, m4);
      }
      for (const [x, y, z, w, h, d, nx, nz] of hood) { m4.set(-nz * w, 0, nx * d, x, 0, h, 0, y, nx * w, 0, nz * d, z, 0, 0, 0, 1); mq.setMatrixAt(i++, m4); }
      mq.instanceMatrix.needsUpdate = true; mq.frustumCulled = false; scene.add(mq);
      stoneTris += (TIERS * PER + hood.length) * 48;
    }

    // eyes of the world's own rooms: the cool hall's (in its dome and in the coffers of its flat ceiling), 18 in the warm
    // vault, 7 in the recess's south haunch
    {
      const eyes = [], cool = [], E = ctx.rng.fork('hammam-eyes');
      const GA = hero.accentIndex, GB = [1, 2, 3].filter((c) => c !== GA)[0], GC = [1, 2, 3].filter((c) => c !== GA)[1];      // this visit's glass colours (4 = ruby)
      const push = (list, p, n, dome, gain, lit, accent, big = 1) => list.push({ p, n, dome, gain, shape: E() < 0.5 ? 0 : 1, scale: E.range(0.92, 1.08) * big, accent: accent ?? (E() < 0.1 ? GA : 0), rnd: lit ? 0.56 + 0.43 * E() : E() });
      // The cool hall has clear air, so its eyes show only as stars and hexagons of sun lying on the floor, the kerbs, the
      // water and the lower north wall. Each eye is set in the roof exactly where the light that reaches a chosen landing
      // comes through (as the sun stands when we pass the fountain), so the stars lie where the bowl goes and creep from there.
      const Lc = hero.coolSunAt(0.13), COF = 6.36, hallDome = [HALL_X, Z_A1, Z_WEST, WATER_Y];
      const roofOver = (P) => {
        for (let t = 0.5; t < 140; t += 0.1) {
          const x = P[0] - Lc.x * t, y = P[1] - Lc.y * t, z = P[2] - Lc.z * t, r = Math.hypot(x, z - Z_FOUNT);
          if (y < HALL_TOP) { if (Math.abs(x) > HALL_X - 0.5 || z < Z_A1 + 0.5 || z > Z_WEST - 0.5) return null; continue; }
          if (y < CDOME_SPRING) {
            if (r < 36.4 - 4.4 * Math.pow((y - HALL_TOP) / (CDOME_SPRING - HALL_TOP), 0.8)) continue;
            if (y > HALL_TOP + 0.12) return null;                                   // the honeycomb ring takes no glass
            const cx = (Math.floor(x / COF) + 0.5) * COF, cz = (Math.floor((z - Z_A1) / COF) + 0.5) * COF + Z_A1;      // the middle of a coffer
            if (Math.hypot(cx, cz - Z_FOUNT) < 36.4 + 3.4 || Math.abs(cx) > 42 || cz < 134 || cz > 287) return null;
            return { p: [cx, HALL_TOP, cz], n: [0, -1, 0] };
          }
          const dx = x, dy = y - CDOME_SPRING, dz = z - Z_FOUNT, d = Math.hypot(dx, dy, dz);
          if (d < CDOME_R) continue;
          if (y < 50.2) return null;                                                // the carved band
          return { p: [dx / d * CDOME_R, CDOME_SPRING + dy / d * CDOME_R, Z_FOUNT + dz / d * CDOME_R], n: [-dx / d, -dy / d, -dz / d] };
        }
        return null;
      };
      const wet = (x, z) => Math.abs(x) < 6 || Math.max(Math.abs(x), Math.abs(z - Z_FOUNT), (Math.abs(x) + Math.abs(z - Z_FOUNT)) * 0.7071) < 18;
      // landings: [x, z] on the floor or the water, [x, z, y] on a wall; the fourth entry marks the accent glass
      const LAND = [[10.4, 259.5, 0, 2], [-10.6, 254, 0, 2], [0.9, 244, 0, 2], [-1.6, 234, 0, 2], [-14.5, 261, 0, 1], [3.2, 251], [-2.5, 243], [3.4, 221, 0, 1], [-3.6, 215], [2.8, 229], [-13, 247], [12.5, 240, 0, 1], [-11, 226], [10.5, 221], [16, 231], [-12, 186], [-6, 177], [-15, 197]];   // the way in, and the pool's far side
      LAND.push([-18.6, 186], [-13.4, 204.4], [6.6, 166],                                                                            // across the kerbs
        [-44.2, 166, 7], [-44.2, 181, 12, 1], [-44.2, 152, 14], [-44.2, 196, 8], [-44.2, 206, 13],                                   // low on the north wall
        [-16, 132.2, 10], [16.5, 132.2, 7], [-31, 132.2, 6],                                                                         // and on the wall of the first arch
        [-11, 160], [-17, 150], [10.5, 160], [-33, 160], [-36, 190]);                                                                // the floor north and east of the pool
      const JIT = [[0, 0], [1.6, 0], [-1.6, 0], [0, 1.6], [0, -1.6], [2.4, 2.4], [-2.4, -2.4], [2.4, -2.4], [-2.4, 2.4], [4.2, 0], [0, 4.2], [-4.2, 0], [0, -4.2]];
      const maxCool = hero.maxCoolEyes - 3, took = [];
      let nLand = 0;
      // first the pool round the fountain, thickest where the bowl swings past it: a field of small stars, the nearest first
      {
        const CAMS = [0.12, 0.14, 0.16].map((u) => path.pointAt(u)), grid = [], nearCam = (x, z) => Math.min(...CAMS.map((c) => Math.hypot(c.x - x, c.z - z)));
        for (let j = 0; j < 21; j++) for (let i = 0; i < 19; i++) {
          const x = -19 + i * 2.3 + (j & 1) * 1.15, z = 168 + j * 2.3, rf = Math.hypot(x, z - Z_FOUNT), d = nearCam(x, z);
          if (rf > 6.2 && rf < 21.5 && d > 3.6 && d < 24 && z < CAMS[0].z + 1 && path.nearestXZ(x, z).dist > 2.6) grid.push([x, z, d]);
        }
        grid.sort((p, q) => p[2] - q[2]);
        for (const [x, z, d] of grid) {
          if (cool.length >= 32) break;
          if ((++nLand & 7) === 0) await ctx.yield();
          const r = roofOver([x, wet(x, z) ? WATER_Y : 0, z]);
          if (!r || cool.some((c) => Math.hypot(c.p[0] - r.p[0], c.p[1] - r.p[1], c.p[2] - r.p[2]) < 2.1)) continue;
          push(cool, r.p, r.n, hallDome, 0, true, [0, GA, 0, GB, 0, 0, GC, 0, 4, 0][cool.length % 10], Math.min(1.3, Math.max(0.34, 0.04 * d))); took.push([x, z]);
        }
        // two panes of the accent glass: one lies before the fountain as we come up to it, one beyond it as we swing past
        for (const [tx, tz] of [[1.5, 197], [5.5, 188.5]]) { let b = -1, bd = 9; took.forEach((q, i) => { const dq = Math.hypot(q[0] - tx, q[1] - tz); if (dq < bd) { bd = dq; b = i; } }); if (b >= 0) cool[b].accent = GA; }
      }
      for (const [x, z, y = 0, acc = 0] of LAND) {
        if ((++nLand & 7) === 0) await ctx.yield();
        if (cool.length >= maxCool) break;
        if (y > 0 && z < 133 && Lc.z > -0.2) continue;                               // (too glancing on that wall at this hour)
        for (const [jx, jz] of JIT) {
          const wall = y > 0, tx = wall && z > 133 ? x : x + jx, tz = wall && z < 133 ? z : z + jz, dp = path.nearestXZ(tx, tz).dist;
          if (!wall && ((dp < 2.6 && acc !== 2) || took.some((q) => Math.hypot(q[0] - tx, q[1] - tz) < 4.4))) continue;
          const r = roofOver([tx, wall ? y : wet(tx, tz) ? WATER_Y : 0, tz]);
          if (!r || cool.some((c) => Math.hypot(c.p[0] - r.p[0], c.p[1] - r.p[1], c.p[2] - r.p[2]) < 5.2)) continue;
          // (those beside the path are small, as the brief has them; the far ones are larger: they are seen low across the water)
          push(cool, r.p, r.n, hallDome, 0, true, acc === 1 ? GA : acc === 2 ? 0 : [0, 0, GB, 0, 4, 0, GC, 0][cool.length % 8], acc === 2 ? 1.0 : Math.min(1.6, Math.max(0.72, 0.5 + 0.045 * dp))); if (!wall) took.push([tx, tz]); break;
        }
      }
      // the crown and two more on the dome's north side: their stars stand on the north wall
      for (const [th, f] of [[0, 0], [40, 3.0], [40, 4.0]]) {
        const a = th * Math.PI / 180, dx = Math.sin(a) * Math.cos(f), dy = Math.cos(a), dz = Math.sin(a) * Math.sin(f), p = [dx * CDOME_R, CDOME_SPRING + dy * CDOME_R, Z_FOUNT + dz * CDOME_R];
        if (cool.length < hero.maxCoolEyes && !cool.some((c) => Math.hypot(c.p[0] - p[0], c.p[1] - p[1], c.p[2] - p[2]) < 5.2)) push(cool, p, [-dx, -dy, -dz], hallDome, 0, true, 0, 1.5);
      }
      // a winter morning: snow lies on the roof and two eyes in five are dark; the rest blaze
      const snowed = (i) => look === 'winter' && (i % 5 === 1 || i % 5 === 3);
      hero.setCoolEyes(cool.filter((_, i) => !snowed(i)));
      hero.addEyes(cool.map((e, i) => ({ ...e, scale: Math.max(e.scale, 0.8), rnd: snowed(i) ? 0.2 : e.rnd })), { stars: false, beams: false });     // (the glass itself is drawn no smaller than this)
      await ctx.yield();
      for (let i = 0; i < 18; i++) { const sx = i % 2 ? 1 : -1, x = sx * (i % 4 < 2 ? 9 : 15), z = Z_WARM_E + 4 + Math.floor(i / 2) * 6.4 + (i % 2) * 3.2, dn = new THREE.Vector3(-sx * (Math.abs(x) > 12 ? 0.66 : 0.52), -1, 0).normalize();
        push(eyes, [x, warmY(x) - 0.05, z], [dn.x, dn.y, dn.z], [WARM_X, Z_WARM_E, Z_WARM_W, WATER_Y], 0.34, false, [0, GA, 0, 0, GB, 0, 0, 4, 0][i % 9]); }
      for (let i = 0; i < 7; i++) { const x = 10.2 + (i % 2) * 1.5, z = Z_REC_W - 6 - i * 12.2, dn = new THREE.Vector3(-1.45, -1, 0).normalize();
        push(eyes, [x, recY(x) - 0.05, z], [dn.x, dn.y, dn.z], [REC_X, Z_REC_E, Z_REC_W, 0], 1.8, true, [GA, 0, 4, GB, 0, GA, GC][i], 1.2); }      // (the recess keeps all seven, snow or not)
      await ctx.yield();
      hero.addEyes(eyes);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ clogs adrift in the channel (where the path keeps to the axis)
    const clogGeo = (() => { const b = makeBuilder(); clogInto(b, 0, 0, 0, 0, 1.2); return b.build(); })();
    const clogSpots = [[-4.3, 254], [3.9, 243], [-3.7, 234], [4.4, 147], [-4.1, 139], [4.2, 117], [-4.5, 103], [3.8, 90], [-4.0, 77]].filter((_, i) => i < Math.round(9 * density));
    const clogs = new THREE.InstancedMesh(clogGeo, hero.stoneMaterial, clogSpots.length);
    clogs.frustumCulled = false; scene.add(clogs);
    const clogPh = clogSpots.map(() => [R.range(0, 6.28), R.range(0, 6.28), R.range(0.7, 1.3)]);

    await ctx.yield();
    // ------------------------------------------------------------------ our vehicle: the hammered copper bowl, built round the eye
    const bowl = new THREE.Group();
    {
      const b = makeBuilder(), RIM = 5 / 2.6;      // (uv metres round: a whole number of knots, so the band closes)
      const rev = (prof, mat, tint, aoF, band = -1) => {
        let acc = 0; b.tint = tint;
        for (let s = 0; s < prof.length - 1; s++) {
          const [r0, y0] = prof[s], [r1, y1] = prof[s + 1], len = Math.hypot(r1 - r0, y1 - y0), a0 = acc;
          b.grid(48, 1, (u, v) => { const a = u * Math.PI * 2, r = lerp(r0, r1, v), y = lerp(y0, y1, v); return [Math.sin(a) * r, y, Math.cos(a) * r, a * RIM, s === band ? 10.02 + 0.96 * v : a0 + len * v, aoF(y)]; }, mat);
          acc += len;
        }
      };
      // hammered copper inside and out; a slim rolled rim that catches the eyes overhead as moving glints
      const copperIn = copper.map((c) => c * 0.82);
      rev([[0, -1.0], [0.9, -0.96], [1.42, -0.72], [1.7, -0.3], [1.8, -0.05]], MAT.METAL, copperIn, (y) => 0.42 + 0.58 * ss(-0.95, -0.05, y));
      rev([[1.8, -0.05], [1.84, 0.0], [1.96, 0.035], [2.03, 0.025], [2.07, -0.02], [2.04, -0.08]], MAT.METAL, copper, (y) => 1.25);
      rev([[2.04, -0.08], [1.9, -0.14], [1.8, -0.5], [1.5, -0.82], [0.9, -1.05], [0, -1.1]], MAT.METAL, copper, (y) => 0.6 + 0.4 * ss(-1.1, -0.1, y), 1);
      b.tint = [1, 1, 1];
      const mesh = new THREE.Mesh(b.build(), hero.stoneMaterial); mesh.frustumCulled = false; bowl.add(mesh);
    }
    scene.add(bowl);
    const wakeGeo = new THREE.RingGeometry(2.05, 9.5, 48, 5).rotateX(-Math.PI / 2);
    { const p = wakeGeo.attributes.position, uv = wakeGeo.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, Math.hypot(p.getX(i), p.getZ(i)), Math.atan2(p.getX(i), p.getZ(i))); }
    const wakeU = { uSpeed: { value: 1 } };
    const wake = new THREE.Mesh(wakeGeo, new THREE.ShaderMaterial({ vertexShader: WAKE_VERT, fragmentShader: WAKE_FRAG, fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true,
      uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uPearl: HU.uPearl, uLight: HU.uLight, uTime: HU.uTime }, wakeU) }));
    wake.frustumCulled = false; wake.renderOrder = 2; scene.add(wake);
    await ctx.yield();

    await ctx.yield();
    // ------------------------------------------------------------------ the cat on the south kerb of the warm room
    const CAT = { grey: ['#7E848C', '#4A4F56', '#B4B8BC'], white: ['#A39C90', '#5E5850', '#CFC8BC'], ginger: ['#C8843E', '#9A5A22', '#EBCDA2'] }[catKind];
    const catU = { uPhase: { value: 0 }, uWalk: { value: 0 }, uSit: { value: 0 } };
    const cat = new THREE.Mesh(catGeometry(lin(CAT[0]), lin(CAT[1]), lin(CAT[2])), new THREE.ShaderMaterial({ vertexShader: CAT_VERT, fragmentShader: CAT_FRAG, fog: true,
      uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uPearl: HU.uPearl, uShade: HU.uShade, uDeep: HU.uDeep, uLampCol: HU.uLampCol, uRoomKey: HU.uRoomKey, uLight: HU.uLight, uTime: HU.uTime,
        uHead: { value: new THREE.Vector3(...CAT_HEAD_W) }, uLampA: { value: new THREE.Vector3(0, 17, 93) }, uLampB: { value: new THREE.Vector3(6.5, 13, 59) } }, catU) }));
    cat.scale.setScalar(0.9); cat.frustumCulled = false; scene.add(cat);
    await ctx.yield();
    const CAT_HI = 123, CAT_LO = 65.5, CAT_D = CAT_HI - CAT_LO, CAT_LEAD = 14, soft = (x) => (x <= 0 ? 0 : x < 8 ? x * x / 16 : x - 4);

    // ------------------------------------------------------------------ air: motes, soap bubbles, jasmine flowers falling, wisps of steam
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const steamHex = '#' + HU.uSteam.value.clone().multiplyScalar(0.42).add(HU.uDeep.value.clone().multiplyScalar(0.3)).getHexString();      // steam out of the light: blue-grey
    await ctx.yield();
    const dust = set.add(fx.makeParticles({ rng: ctx.rng.fork('motes'), preset: 'dust', time, count: Math.round(800 * detail), box: [30, 16, 30], intensity: 0.5, colors: ['#fff6e2', '#f2ead8', '#e6e2d6'] }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: ctx.rng.fork('bubbles'), preset: 'bubbles', time, follow: false, center: [0, 7.5, 93], box: [44, 13, 58], count: Math.round(120 * detail * density), size: [0.22, 0.6] }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: ctx.rng.fork('jasmine'), preset: 'petals', time, follow: false, center: [0, 10, Z_A1 + 5.5], box: [30, 20, 9], count: Math.round(60 * detail), colors: ['#fffdf2', '#f6f1e2', '#fff8e6'], size: [0.22, 0.4] }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: ctx.rng.fork('warm-steam'), time, count: Math.round(26 * detail), area: [54, 8, 58], center: [0, 7, 93], size: [9, 19], color: steamHex, opacity: 0.11, drift: [0.12, 0, -0.55] }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: ctx.rng.fork('hot-steam'), time, count: Math.round(34 * detail), area: [96, 12, 96], center: [0, 9, 0], size: [10, 22], color: steamHex, opacity: 0.045, drift: [0.35, 0, -0.5] }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: ctx.rng.fork('soffit-steam'), time, count: Math.round(44 * detail), area: [22, 9, 100], center: [0, 27.5, -102], size: [8, 16], color: steamHex, opacity: 0.15, drift: [0, 0, -1.8] }));
    await ctx.yield();
    set.add(fx.makeMist({ rng: ctx.rng.fork('pool-steam'), time, count: Math.round(14 * detail), area: [16, 6, 18], center: [0, 5, PZ], size: [5, 10], color: steamHex, opacity: 0.2, drift: [0.2, 0, -0.4] }));      // steam curling off the chamber's pool, through the shafts
    await ctx.yield();
    set.add(fx.makeMist({ rng: ctx.rng.fork('basin-steam'), time, count: Math.round(12 * detail), area: [8, 10, 7], center: [0, 8.5, Z_REC_E + 6.6], size: [4, 8], color: steamHex, opacity: 0.4, drift: [0, 0, 0.5] }));      // the basin under the portal steams
    await ctx.yield();
    set.add(fx.makeParticles({ rng: ctx.rng.fork('recess-bubbles'), preset: 'bubbles', time, follow: false, center: [0, 15, -110], box: [22, 22, 88], count: Math.round(80 * detail * density), size: [0.2, 0.5] }));
    await ctx.yield();

    // ------------------------------------------------------------------ sparrows (or a pair of collared doves)
    // Twelve bathe on the fountain's lowest lip; as the bowl comes up to it (u 0.09 to 0.16) they go off it one after another,
    // low across our bow, and up onto the towel line behind us. Four more wheel under the dome; six sit on the lines.
    const NBURST = doves ? 2 : 12, NCIRC = doves ? 0 : 4, NB = NBURST + NCIRC + ropePerch.length, BSC = doves ? 1.8 : 1.05;
    const birdGeo = doves ? birdGeometry(lin('#D9C4C0'), lin('#F6E6E0'), lin('#BFA9A8'), lin('#4A4046'), lin('#3A3030'), true)
      : birdGeometry(lin('#8A6644'), lin('#F0E6D2'), lin('#3E2C20'), lin('#D8C4A0'), lin('#2A221C'));
    const aBird = new THREE.InstancedBufferAttribute(new Float32Array(NB * 3), 3); aBird.setUsage(THREE.DynamicDrawUsage);
    birdGeo.setAttribute('aBird', aBird);
    const birds = new THREE.InstancedMesh(birdGeo, new THREE.ShaderMaterial({ vertexShader: BIRD_VERT, fragmentShader: BIRD_FRAG, fog: true, side: THREE.DoubleSide,
      uniforms: Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uPearl: HU.uPearl, uDeep: HU.uDeep, uRoomKey: HU.uRoomKey, uLight: HU.uLight, uTime: HU.uTime }) }), NB);
    birds.instanceMatrix.setUsage(THREE.DynamicDrawUsage); birds.frustumCulled = false; scene.add(birds);
    const BR = ctx.rng.fork('hammam-birds'), flock = [];
    {
      const c12 = path.pointAt(0.123), t12 = path.tangentAt(0.123), rx = -t12.z, rz = t12.x;
      for (let i = 0; i < NBURST; i++) {
        const th = -1.25 + 2.5 * (i + 0.5) / NBURST + BR.range(-0.06, 0.06), ox = Math.sin(th), oz = Math.cos(th);
        const p0 = [ox * 5.28, 3.6 + 0.1 * BSC, Z_FOUNT + oz * 5.28], ah = 10 + BR.range(-2.5, 3), sd = BR.range(-2.5, 3.5);
        const px = [c12.x + t12.x * ah + rx * sd, BR.range(3.0, 6.4), c12.z + t12.z * ah + rz * sd];
        const ex = 13.5 + i * (doves ? 3 : 1.9) + BR.range(-0.3, 0.3), p3 = [ex, ropeY(ex) + 0.14 + 0.1 * BSC, 225];
        flock.push({ kind: 0, p0, px, p3, pm: [p0[0] - ox * 4, p0[1] - 0.6, p0[2] - oz * 4], pp: [p3[0] + (p3[0] - px[0]) * 0.3, p3[1], p3[2] + (p3[2] - px[2]) * 0.3],
          out: [ox, oz], uL: 0.09 + 0.017 * BR(), ph: BR() * 6.283, rate: doves ? 5 : BR.range(7, 9) });
      }
      for (let i = 0; i < NCIRC; i++) flock.push({ kind: 1, r: 9 + 1.7 * i, y: 10.6 + 1.3 * i, w: (0.5 + 0.09 * i) * (i % 2 ? -1 : 1), ph: BR() * 6.283, rate: BR.range(7, 9) });
      for (const [x, y, z, yaw] of ropePerch) flock.push({ kind: 2, p0: [x, y, z], out: [Math.sin(yaw), -Math.cos(yaw)], ph: BR() * 6.283, rate: 8 });
      flock.forEach((f, i) => aBird.setXYZ(i, f.ph, f.rate, 0));
    }
    const crs = (a, b, c, d, k) => 0.5 * (2 * b + (c - a) * k + (2 * a - 5 * b + 4 * c - d) * k * k + (3 * b - a - 3 * c + d) * k * k * k);
    const flightAt = (f, sq, out) => {          // where burst bird f is, sq (0..1) of the way from the lip to the line
      const k = sq < 0.34 ? sq / 0.34 : (sq - 0.34) / 0.66, A0 = sq < 0.34 ? f.pm : f.p0, A1 = sq < 0.34 ? f.p0 : f.px, A2 = sq < 0.34 ? f.px : f.p3, A3 = sq < 0.34 ? f.p3 : f.pp;
      return out.set(crs(A0[0], A1[0], A2[0], A3[0], k), Math.max(crs(A0[1], A1[1], A2[1], A3[1], k), 0.95), crs(A0[2], A1[2], A2[2], A3[2], k));
    };
    const flutter = (t, ph) => Math.max(0, Math.sin(t * 0.8 + ph) - 0.72) / 0.28;      // a perched bird shakes its wings now and then
    const bPos = new THREE.Vector3(), bAhead = new THREE.Vector3(), bUp = new THREE.Vector3(0, 1, 0), bScale = new THREE.Vector3(BSC, BSC, BSC), bM = new THREE.Matrix4(), bQ = new THREE.Quaternion();
    const updateBirds = (t, u) => {
      for (let i = 0; i < NB; i++) {
        const f = flock[i]; let fly = 0;
        if (f.kind === 0) {
          const sq = (u - f.uL) / 0.07;
          if (sq <= 0 || sq >= 1) {
            const P = sq <= 0 ? f.p0 : f.p3, hop = flutter(t, f.ph);
            fly = 0.75 * hop; bPos.set(P[0], P[1] + 0.05 * hop + 0.012 * Math.sin(t * 5 + f.ph), P[2]);
            if (sq <= 0) bAhead.set(P[0] + f.out[0] + 0.3 * Math.sin(t * 0.7 + f.ph), P[1] - 0.25, P[2] + f.out[1] + 0.3 * Math.cos(t * 0.6 + f.ph)); else bAhead.set(P[0] + 0.3 * Math.sin(f.ph), P[1], P[2] - 1);
          } else {
            fly = ss(0, 0.05, sq) * (1 - ss(0.94, 1, sq));
            flightAt(f, sq, bPos); flightAt(f, Math.min(sq + 0.012, 1), bAhead);
            if (sq > 0.985) bAhead.set(bPos.x, bPos.y, bPos.z - 1);
            const bob = 0.16 * Math.sin(t * 2.3 + f.ph) * fly; bPos.y += bob; bAhead.y += bob;
          }
        } else if (f.kind === 1) {
          const th = f.ph + f.w * t, sg = Math.sign(f.w); fly = 1;
          bPos.set(Math.sin(th) * f.r, f.y + 0.7 * Math.sin(t * 0.6 + f.ph), Z_FOUNT + Math.cos(th) * f.r);
          bAhead.set(bPos.x + Math.cos(th) * sg, bPos.y + 0.12 * Math.cos(t * 0.6 + f.ph), bPos.z - Math.sin(th) * sg);
        } else {
          const hop = flutter(t, f.ph); fly = 0.75 * hop;
          bPos.set(f.p0[0], f.p0[1] + 0.05 * hop, f.p0[2]); bAhead.set(bPos.x + f.out[0], bPos.y, bPos.z + f.out[1]);
        }
        bM.lookAt(bPos, bAhead, bUp); bQ.setFromRotationMatrix(bM);
        birds.setMatrixAt(i, bM.compose(bPos, bQ, bScale));
        aBird.setZ(i, fly);
      }
      birds.instanceMatrix.needsUpdate = true; aBird.needsUpdate = true;
    };
    updateBirds(0, 0);
    await ctx.yield();

    // ------------------------------------------------------------------ frame
    const camP = new THREE.Vector3(), tmpV = new THREE.Vector3(), m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
    const gazeSouth = new THREE.Vector3(27, 17, 199), gazeLamp = new THREE.Vector3(0, 12.5, 127), gazeCat = new THREE.Vector3(11.5, 5.2, 100);
    const gazeThrough = new THREE.Vector3(0, 12, -75);
    const gazeArch = A.frame57.target.clone(), gazeFount = new THREE.Vector3(0, 4.6, Z_FOUNT), gazeFloor = new THREE.Vector3(0, 10, -128), gazeBays = new THREE.Vector3(1.5, 6, -126);        // down the recess to the foot of the portal: the wet floor stays in frame
    const tint = look === 'afternoon' ? '#ffecd2' : look === 'winter' ? '#e9f1ff' : '#fffaf2';
    return {
      scene, path, duration: 50,
      // the brief's pacing: quick on the water, walking pace while the beams grow, then the weave
      pace: (u) => 1.2 - 0.8 * ss(0.415, 0.475, u) + 0.75 * ss(0.545, 0.615, u) - 0.15 * ss(0.85, 0.9, u),
      camera: { fov: 62, near: 0.3, far: 900, lookAhead: 24, sway: 0.6, bank: 0.3, nearThrough: 0.3 },
      pois: [
        { at: gazeSouth, from: 0.03, to: 0.118, weight: 0.7 },        // first the south arcade and the painted ceiling, the fountain to the left of it
        { at: gazeFount, from: 0.085, to: 0.215, weight: 0.7 },
        { at: gazeLamp, from: 0.2, to: 0.3, weight: 0.5 },            // up to the lanterns in the first arch
        { at: () => gazeCat.set(11.5, 5.2, cat.position.z - 3), from: 0.295, to: 0.4, weight: 0.66 },      // the warm room side-on: the cat, the towels, the ewers and basins
        { at: gazeArch, from: 0.405, to: 0.675, weight: 0.86 },
        { at: gazeThrough, from: 0.555, to: 0.7, weight: 0.7 },        // the weave's focal point: the lit east arch, the chamber and the portal through it, the shafts either side
        { at: gazeFloor, from: 0.62, to: 0.83, weight: 0.62 },
        { at: gazeBays, from: 0.795, to: 0.915, weight: 0.62 },      // down the recess: the lit bays and the coloured stars on its floor, before the portal takes the eye
      ],
      portal: { shape: 'arch', width: A.portalSeat.width, height: 18, color: PORTAL_HEX, glow: 0.8, revealDistance: 470 },
      post: { exposure: 1.06, bloom: { strength: 0.38, radius: 0.7, threshold: 1.0 },
        grade: { saturation: look === 'winter' ? 1.0 : look === 'noon' ? 1.06 : 1.02, contrast: look === 'noon' ? 1.11 : 1.07, tint, shadowTint: '#1a2230', vignette: 0.3, grain: 0.02, aberration: 0 } },
      ride: 'none',
      update(dt, t, camera, u) {
        time.value = t;
        hero.setProgress(u);
        if (rare) hero.setCloud(ss(0.57, 0.61, u), ss(0.645, 0.685, u));          // the real cloud: out west to east, back the same way
        hero.update(dt, t, camera);
        const hz = ss(0.28, 0.5, u);                                            // clear air in the cool hall, pearl haze from the warm room on
        scene.fog.near = lerp(70, 40, hz); scene.fog.far = lerp(620, 400, hz);
        dust.setOpacity(1 - 0.6 * hz);
        // the bowl rides under the eye, then stays behind on the pool
        camP.setFromMatrixPosition(camera.matrixWorld);
        bowl.visible = wake.visible = !ctx.through; HU.uThrough.value = ctx.through ? 1 : 0;                                            // seen through the previous portal there is no rider yet
        const k = ss(U_LIFT - 0.012, U_LIFT, u);
        const bx = lerp(camP.x, liftAt.x, k), bz = lerp(camP.z, liftAt.z, k);
        bowl.position.set(bx, WATER_Y + 0.5 + 0.03 * Math.sin(t * 1.7) + 0.018 * Math.sin(t * 2.9 + 1), bz);      // low in the water: a slim rim along the foot of the frame
        // we sit in it, so it swings with our gaze (a slow swing of its own on top); left behind, it turns freely on the pool
        const me = camera.matrixWorld.elements, ride = Math.atan2(-me[8], -me[10]) - Math.PI + 0.15 * Math.sin(t * Math.PI / 10);
        let free = t * Math.PI / 20 - ride; free -= Math.round(free / (Math.PI * 2)) * Math.PI * 2;
        bowl.rotation.set(0.02 * Math.sin(t * 1.3), ride + free * k, 0.025 * Math.sin(t * 1.1 + 1));
        // on a tall, narrow screen the view is wider: the bowl draws in under the eye, so its rim stays a slim band along the foot of the frame
        const bs = lerp(Math.min(1, Math.max(0.4, 0.6 * camera.projectionMatrix.elements[5])), 1, k);
        bowl.scale.setScalar(bs); wake.scale.set(bs, 1, bs);
        wake.position.set(bx, WATER_Y + 0.04, bz); wakeU.uSpeed.value = 1 - 0.65 * k;
        // the cat keeps pace along the kerb, then sits short of the hot-room arch and turns to watch
        path.pointAt(u, tmpV);
        const d = CAT_HI - (tmpV.z - CAT_LEAD), w1 = soft(d), w = CAT_D - soft(CAT_D - w1);
        cat.position.set(6.62, 0.62, CAT_HI - w);
        catU.uPhase.value = w / 2.6 * Math.PI * 2;
        catU.uWalk.value = d <= 0 ? 0 : Math.min(1, d / 8, Math.max(0, CAT_D - w1) / 8);
        catU.uSit.value = ss(CAT_D - 2.2, CAT_D - 0.15, w);
        cat.rotation.y = 2.5 * ss(0.05, 0.8, catU.uSit.value);                  // it turns on the kerb to watch the bowl go by
        for (let i = 0; i < clogSpots.length; i++) {
          const [cx, cz] = clogSpots[i], [p1, p2, sp] = clogPh[i];
          ee.set(0.1 * Math.sin(t * 0.9 * sp + p2), p1 + 0.35 * Math.sin(t * 0.23 * sp + p1), 0.13 * Math.sin(t * 1.15 * sp + p1));
          tmpV.set(cx + 0.35 * Math.sin(t * 0.17 + p1), WATER_Y - 0.36 + 0.05 * Math.sin(t * 1.3 * sp + p2), cz + 0.8 * Math.sin(t * 0.11 + p2));
          clogs.setMatrixAt(i, m4.compose(tmpV, qq.setFromEuler(ee), one));
        }
        clogs.instanceMatrix.needsUpdate = true;
        set.update(dt, t, camera);
        updateBirds(t, u);
      },
      dispose() { hero.dispose(); },
    };
  },
};
