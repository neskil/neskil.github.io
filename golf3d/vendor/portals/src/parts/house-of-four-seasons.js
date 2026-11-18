// The House of Four Seasons: the hero set piece (the crossing where the four gardens meet) and the builders of every
// other building of the estate: a hall on posts, an open roofed gallery, an arched bridge, boats, figures.
// Everything is at one and a half times life size. +X east, +Z south, the crossing's centre at the origin.
import * as THREE from 'three';
import { lerp, makePath } from '../kit/core.js';
import * as flora from '../kit/flora.js';
import * as Water from '../kit/water.js';
import * as fx from '../kit/fx.js';

export const SURF = { TIMBER: 0, BARK: 1, PLASTER: 2, BLIND: 3, CLOTH: 4, BOARDS: 5, SNOW: 6, GILT: 7 };
const TAU = Math.PI * 2;
// the kit's clamp and smoothstep, written out (the same arithmetic, without a call inside a call: the ground rule asks them many thousand times)
const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const smoothstep = (a, b, x) => { let t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
export const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const PAL = {
  timber: lin('#7f7163'), timberPale: lin('#9c8f80'), bark: lin('#665b4f'), moss: lin('#3f5a2c'), plaster: lin('#e6dfcf'),
  blind: lin('#b5ab6c'), boards: lin('#8f806c'), snow: mul(lin('#dfe8f6'), 0.8), gilt: lin('#ffc66a'), dark: lin('#1a120e'), iron: lin('#201c1c'),
};

// ---------------------------------------------------------------- geometry builder
// Vertices carry position, normal, colour, uv in metres and a surface word (kind, glow, sway metres, sway phase).
export function makeBuilder(cap = 2048) {
  // the numbers are laid straight into typed arrays that double when full (nV vertices, nI indices so far); a builder that is
  // known to grow large is given its first size (cap, in vertices), so that it is not copied over and over on the way
  let capV = cap, capI = cap * 2, nV = 0, nI = 0;
  let P = new Float32Array(capV * 3), N = new Float32Array(capV * 3), C = new Float32Array(capV * 3), U = new Float32Array(capV * 2), S = new Float32Array(capV * 4), I = new Uint32Array(capI);
  const grown = (a, n) => { const t = new a.constructor(n); t.set(a); return t; };
  const moreV = () => { capV *= 2; P = grown(P, capV * 3); N = grown(N, capV * 3); C = grown(C, capV * 3); U = grown(U, capV * 2); S = grown(S, capV * 4); };
  const ix = (a, c, d) => { if (nI + 3 > capI) { capI *= 2; I = grown(I, capI); } I[nI++] = a; I[nI++] = c; I[nI++] = d; };
  let col = [1, 1, 1], surf = 0, glow = 0, sway = 0, phase = 0;
  const stack = [];
  let ox = 0, oy = 0, oz = 0, cy = 1, sy = 0, yawNow = 0;
  const b = {
    get triangles() { return nI / 3; },
    col(c, k = 1) { col = [c[0] * k, c[1] * k, c[2] * k]; return b; },
    surf(s, g = 0) { surf = s; glow = g; return b; },
    sway(a = 0, ph = 0) { sway = a; phase = ph; return b; },
    // a local frame: origin and a turn about Y (yaw 0 keeps +Z as the front)
    tr(x, y, z, yaw = 0) {
      stack.push([ox, oy, oz, yawNow]); const w = b.world([x, y, z]);
      ox = w[0]; oy = w[1]; oz = w[2]; yawNow += yaw; cy = Math.cos(yawNow); sy = Math.sin(yawNow); return b;
    },
    pop() { [ox, oy, oz, yawNow] = stack.pop(); cy = Math.cos(yawNow); sy = Math.sin(yawNow); return b; },
    world(p) { return [ox + p[0] * cy + p[2] * sy, oy + p[1], oz - p[0] * sy + p[2] * cy]; },
    vert(p, n, u, v, c = col, sw = sway, gl = glow) {
      if (nV === capV) moreV();
      const k = nV * 3, k2 = nV * 2, k4 = nV * 4;
      P[k] = ox + p[0] * cy + p[2] * sy; P[k + 1] = oy + p[1]; P[k + 2] = oz - p[0] * sy + p[2] * cy;
      N[k] = n[0] * cy + n[2] * sy; N[k + 1] = n[1]; N[k + 2] = -n[0] * sy + n[2] * cy;
      C[k] = c[0]; C[k + 1] = c[1]; C[k + 2] = c[2]; U[k2] = u; U[k2 + 1] = v; S[k4] = surf; S[k4 + 1] = gl; S[k4 + 2] = sw; S[k4 + 3] = phase;
      return nV++;
    },
    // a, b, c, d counter-clockwise seen from the front
    quad(a, q, c, d, uv, o = {}) {
      const ux = q[0] - a[0], uy = q[1] - a[1], uz = q[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
      const n = o.n || [nx, ny, nz], w = uv || [0, 0, Math.hypot(ux, uy, uz), Math.hypot(vx, vy, vz)], cs = o.cols, ss = o.sways;
      const i0 = b.vert(a, n, w[0], w[1], cs ? cs[0] : col, ss ? ss[0] : sway), i1 = b.vert(q, n, w[2], w[1], cs ? cs[1] : col, ss ? ss[1] : sway);
      const i2 = b.vert(c, n, w[2], w[3], cs ? cs[2] : col, ss ? ss[2] : sway), i3 = b.vert(d, n, w[0], w[3], cs ? cs[3] : col, ss ? ss[3] : sway);
      ix(i0, i1, i2); ix(i0, i2, i3);
      return b;
    },
    box(x0, y0, z0, x1, y1, z1, o = {}) {
      b.quad([x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], [x0, y0, x1, y1]);
      b.quad([x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x0, y0, x1, y1]);
      b.quad([x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [z0, y0, z1, y1]);
      b.quad([x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], [z0, y0, z1, y1]);
      if (o.top !== false) b.quad([x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [x0, z0, x1, z1]);
      if (o.bottom) b.quad([x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, z0, x1, z1]);
      return b;
    },
    // a round post (or a cone when r1 differs), smooth sides
    cyl(x, y0, y1, z, r0, sides = 8, r1 = r0, cap = false) {
      const base = nV;
      for (let i = 0; i <= sides; i++) {
        const a = i / sides * TAU, ca = Math.cos(a), sa = Math.sin(a), sl = (r0 - r1) / Math.max(y1 - y0, 1e-3), nl = Math.hypot(1, sl);
        b.vert([x + ca * r0, y0, z + sa * r0], [ca / nl, sl / nl, sa / nl], a * r0, y0);
        b.vert([x + ca * r1, y1, z + sa * r1], [ca / nl, sl / nl, sa / nl], a * r0, y1);
      }
      for (let i = 0; i < sides; i++) { const k = base + i * 2; ix(k, k + 1, k + 3); ix(k, k + 3, k + 2); }
      if (cap) {
        const c0 = b.vert([x, y1, z], [0, 1, 0], 0, 0);
        for (let i = 0; i < sides; i++) { const a0 = i / sides * TAU, a1 = (i + 1) / sides * TAU; const i0 = b.vert([x + Math.cos(a0) * r1, y1, z + Math.sin(a0) * r1], [0, 1, 0], 0, 0), i1 = b.vert([x + Math.cos(a1) * r1, y1, z + Math.sin(a1) * r1], [0, 1, 0], 0, 0); ix(c0, i1, i0); }
      }
      return b;
    },
    // a squared timber from p to q, w wide (level) and h high
    beam(p, q, w, h) {
      const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], L = Math.hypot(dx, dy, dz) || 1, hl = Math.hypot(dx, dz);
      const sx = hl > 1e-4 ? -dz / hl * w / 2 : w / 2, sz = hl > 1e-4 ? dx / hl * w / 2 : 0, h2 = h / 2;
      const c = (e, s, t) => { const o = e ? q : p; return [o[0] + sx * s, o[1] + h2 * t, o[2] + sz * s]; };
      b.quad(c(0, 1, -1), c(1, 1, -1), c(1, 1, 1), c(0, 1, 1), [0, 0, L, h]);
      b.quad(c(1, -1, -1), c(0, -1, -1), c(0, -1, 1), c(1, -1, 1), [0, 0, L, h]);
      b.quad(c(0, 1, 1), c(1, 1, 1), c(1, -1, 1), c(0, -1, 1), [0, 0, L, w]);
      b.quad(c(0, -1, -1), c(1, -1, -1), c(1, 1, -1), c(0, 1, -1), [0, 0, L, w]);
      b.quad(c(0, -1, -1), c(0, 1, -1), c(0, 1, 1), c(0, -1, 1), [0, 0, w, h]);
      b.quad(c(1, 1, -1), c(1, -1, -1), c(1, -1, 1), c(1, 1, 1), [0, 0, w, h]);
      return b;
    },
    // a smooth sheet: f(u, v) -> [x, y, z]; o.color(u, v) -> colour; o.uv(u, v) -> [metres, metres]; o.flip turns it over
    // o.lattice: each normal from the sheet's own neighbours (f is asked once for each vertex); o.wrapU: the sheet closes on itself in u
    grid(nu, nv, f, o = {}) {
      const base = nV, e = 1e-3, us = o.us, vs = o.vs;
      if (o.lattice) {
        const row = nu + 1, pts = [];
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) pts.push(f(us ? us[i] : i / nu, vs ? vs[j] : j / nv));
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
          const u = us ? us[i] : i / nu, v = vs ? vs[j] : j / nv, p = pts[j * row + i];
          const ia = o.wrapU ? (i === nu ? 1 : i + 1) : Math.min(nu, i + 1), ib = o.wrapU ? (i === 0 ? nu - 1 : i - 1) : Math.max(0, i - 1);
          const pu = pts[j * row + ia], pd = pts[j * row + ib], pv = pts[Math.min(nv, j + 1) * row + i], pw = pts[Math.max(0, j - 1) * row + i];
          const ax = pu[0] - pd[0], ay = pu[1] - pd[1], az = pu[2] - pd[2], bx = pv[0] - pw[0], by = pv[1] - pw[1], bz = pv[2] - pw[2];
          let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = (Math.hypot(nx, ny, nz) || 1) * (o.flip ? -1 : 1);
          const w = o.uv ? o.uv(u, v) : [u, v];
          b.vert(p, [nx / l, ny / l, nz / l], w[0], w[1], o.color ? o.color(u, v, p) : col, o.swayAt ? o.swayAt(u, v) : sway, o.glowAt ? o.glowAt(u, v) : glow);
        }
      } else for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const u = us ? us[i] : i / nu, v = vs ? vs[j] : j / nv, p = f(u, v), pu = f(Math.min(1, u + e), v), pd = f(Math.max(0, u - e), v), pv = f(u, Math.min(1, v + e)), pw = f(u, Math.max(0, v - e));
        const ax = pu[0] - pd[0], ay = pu[1] - pd[1], az = pu[2] - pd[2], bx = pv[0] - pw[0], by = pv[1] - pw[1], bz = pv[2] - pw[2];
        let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = (Math.hypot(nx, ny, nz) || 1) * (o.flip ? -1 : 1);
        const w = o.uv ? o.uv(u, v) : [u, v];
        b.vert(p, [nx / l, ny / l, nz / l], w[0], w[1], o.color ? o.color(u, v, p) : col, o.swayAt ? o.swayAt(u, v) : sway, o.glowAt ? o.glowAt(u, v) : glow);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
        const a = base + j * (nu + 1) + i, c = a + 1, d = a + nu + 1, g = d + 1;
        if (o.flip) { ix(a, g, c); ix(a, d, g); } else { ix(a, c, g); ix(a, g, d); }
      }
      return b;
    },
    tri(i0, i1, i2) { ix(i0, i1, i2); return b; },
    // a round limb along points that lie in one upright plane (the plane's level direction is dirX, dirZ): radii per point
    tube(pts, radii, sides = 8, o = {}) {
      const base = nV, n = pts.length, side = o.side || [0, 0, 1];
      for (let i = 0; i < n; i++) {
        const a = pts[Math.max(0, i - 1)], c = pts[Math.min(n - 1, i + 1)]; let tx = c[0] - a[0], ty = c[1] - a[1], tz = c[2] - a[2]; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
        let ux = side[1] * tz - side[2] * ty, uy = side[2] * tx - side[0] * tz, uz = side[0] * ty - side[1] * tx; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;
        const vx = ty * uz - tz * uy, vy = tz * ux - tx * uz, vz = tx * uy - ty * ux, r = radii[i], cs = o.cols ? o.cols[i] : col;
        for (let k = 0; k <= sides; k++) { const an = k / sides * TAU, ca = Math.cos(an), sa = Math.sin(an), nx = ux * ca + vx * sa, ny = uy * ca + vy * sa, nz = uz * ca + vz * sa; b.vert([pts[i][0] + nx * r, pts[i][1] + ny * r, pts[i][2] + nz * r], [nx, ny, nz], an * r, i * 0.5, cs); }
      }
      for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) { const a = base + i * (sides + 1) + k, c = a + sides + 1; ix(a, c, a + 1); ix(a + 1, c, c + 1); }
      return b;
    },
    toGeometry() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, nV * 3), 3)); g.setAttribute('normal', new THREE.BufferAttribute(N.slice(0, nV * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(C.slice(0, nV * 3), 3)); g.setAttribute('uv', new THREE.BufferAttribute(U.slice(0, nV * 2), 2));
      g.setAttribute('aSurf', new THREE.BufferAttribute(S.slice(0, nV * 4), 4)); g.setIndex(new THREE.BufferAttribute(I.slice(0, nI), 1));
      // the sphere round it, read straight from the numbers: the middle of the box of all vertices, and the farthest vertex from it
      let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
      for (let k = 0, n = nV * 3; k < n; k += 3) { const x = P[k], y = P[k + 1], z = P[k + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      const cx = nV ? (x0 + x1) / 2 : 0, cy = nV ? (y0 + y1) / 2 : 0, cz = nV ? (z0 + z1) / 2 : 0; let r2 = 0;
      for (let k = 0, n = nV * 3; k < n; k += 3) { const dx = P[k] - cx, dy = P[k + 1] - cy, dz = P[k + 2] - cz, d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d; }
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2));
      return g;
    },
    // (kept for the callers that ask with a rest: the sphere is cheap now, so nothing is waited for)
    async toGeometrySteps() { return b.toGeometry(); },
  };
  return b;
}

// ---------------------------------------------------------------- the four standing hours
// Each garden keeps one hour for ever: spring its morning, summer its dusk after sunset, autumn its low red sun, winter
// its full moon. A place of the estate (world x, z) has four weights, one to a garden, written from the dividing roofs:
// the crossing's two axes (x 0, and z 0 beside it), the spring hall's line with its gallery-bridge (z 24, east of the
// gallery that turns south at x 50) and the border gallery with its gate (z 0, in the west). Under a dividing roof the
// weights cross over 16 m of ground. Whatever stands is shaded by the weights of its own place, from wherever it is
// seen; no light's direction is ever blended, and nothing here reads the eye, the metres flown or the clock.
export const JOIN = { half: 8, hallZ: 24, turn0: 42, turn1: 58 };
export function hoursAt(x, z, out = [0, 0, 0, 0], half = JOIN.half) {
  const e = smoothstep(-half, half, x), zd = JOIN.hallZ * smoothstep(JOIN.turn0, JOIN.turn1, x), se = smoothstep(zd - half, zd + half, z), sw = smoothstep(-half, half, z);
  out[0] = e * se; out[1] = e * (1 - se); out[2] = (1 - e) * sw; out[3] = (1 - e) * (1 - sw);
  return out;
}
// WHAT HIDES A BODY OF THE SKY. A sun's disc changes only on lane from which the world hides its station (the world's dome).
// The cover is what is built, always stands and is always drawn: the meshes of the halls, galleries, bridges and gate and of
// the crossing (roof, wall, floor, post, rail). A crown is no cover: light comes through leaves. A ray is stopped by the first
// face in its way. A place of the lane hides a disc when every ray to the disc's whole face is stopped (its middle, four rays
// at half its radius, eight on its rim), from the lane's own height there and COVER.lift metres over and under it.
// COVER.margin: the metres left unchanged at each end of a hidden run; COVER.least: the shortest hidden run the buildings
// give as they stand (a number for the print: no law reads it, and a run too short for the margins keeps a change of 2 m at its middle); COVER.step: the metres of lane asked in one cast; COVER.reach: the metres of lane beyond a roof's ground that
// the cover is made ready for at a time.
export const COVER = { lift: 0.3, margin: 2, least: 6, step: 8, reach: 40, face: [[0, 0], [0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5], [1, 0], [-1, 0], [0, 1], [0, -1], [0.7071, 0.7071], [-0.7071, 0.7071], [0.7071, -0.7071], [-0.7071, -0.7071]] };
export function makeCover() {
  const solids = [], BLOCK = 256;
  // A mesh is taken in the order it was built (a post, a roof, a rail: neighbours in the list are neighbours in the world),
  // BLOCK faces at a time, each block with the ball round it, so that a cast asks only the blocks that lie its way.
  const solid = (g) => {
    const pos = g.attributes.position; if (!pos || pos.isInterleavedBufferAttribute) return;
    const A = pos.array, I = g.index ? g.index.array : null, nt = (I ? I.length : A.length / 3) / 3, nb = Math.ceil(nt / BLOCK), balls = new Float32Array(nb * 4);
    for (let b = 0; b < nb; b++) {
      let x0 = 1e9, y0 = 1e9, z0 = 1e9, x1 = -1e9, y1 = -1e9, z1 = -1e9;
      for (let k = b * BLOCK * 3, e = Math.min(nt, (b + 1) * BLOCK) * 3; k < e; k++) { const v = (I ? I[k] : k) * 3, x = A[v], y = A[v + 1], z = A[v + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
      balls[b * 4] = (x0 + x1) / 2; balls[b * 4 + 1] = (y0 + y1) / 2; balls[b * 4 + 2] = (z0 + z1) / 2; balls[b * 4 + 3] = 0.5 * Math.hypot(x1 - x0, y1 - y0, z1 - z0);
    }
    solids.push({ geometry: g, A, I, nt, balls });
  };
  // The cover made ready for a set of origins O (x, y, z each; n of them) and rays toward dir (unit, three numbers) at a disc
  // whose radius has the tangent rho: every face that can stand in such a ray's way, filed under the squares (1 m) of the
  // plane across the rays that it covers. Returns ask(Q, m, all): for each of m origins Q (among those it was made ready
  // for) 0 where the disc is hidden, else the rays of its face not stopped (all: every one counted; else 1 at the first).
  const ready = (O, n, dir, rho) => {
    const dx = dir[0], dy = dir[1], dz = dir[2], hl = Math.hypot(dx, dz) || 1, ux = dz / hl, uz = -dx / hl, vx = -uz * dy, vy = uz * dx - ux * dz, vz = ux * dy;
    let u0 = 1e9, u1 = -1e9, v0 = 1e9, v1 = -1e9, wMin = 1e9;
    for (let j = 0; j < n; j++) { const x = O[j * 3], y = O[j * 3 + 1], z = O[j * 3 + 2], u = x * ux + z * uz, v = x * vx + y * vy + z * vz, w = x * dx + y * dy + z * dz; if (u < u0) u0 = u; if (u > u1) u1 = u; if (v < v0) v0 = v; if (v > v1) v1 = v; if (w < wMin) wMin = w; }
    const gx = u0 - 0.5, gy = v0 - 0.5, nx = Math.ceil(u1 - u0 + 1), ny = Math.ceil(v1 - v0 + 1), cells = Array.from({ length: nx * ny }, () => []), T = [];
    for (const { A, I, nt, balls } of solids) for (let b = 0; b * BLOCK < nt; b++) {
      // (a block is asked only where the ball round it reaches the origins' own reach of the plane across the rays)
      const qx = balls[b * 4], qy = balls[b * 4 + 1], qz = balls[b * 4 + 2], r = balls[b * 4 + 3], w = qx * dx + qy * dy + qz * dz, er = r + rho * Math.max(0, w + r - wMin), u = qx * ux + qz * uz, v = qx * vx + qy * vy + qz * vz;
      if (w + r <= wMin || u + er <= u0 || u - er >= u1 || v + er <= v0 || v - er >= v1) continue;
      for (let t = b * BLOCK * 3, end = Math.min(nt, (b + 1) * BLOCK) * 3; t < end; t += 3) {
        const a = (I ? I[t] : t) * 3, c1 = (I ? I[t + 1] : t + 1) * 3, c2 = (I ? I[t + 2] : t + 2) * 3, ax = A[a], ay = A[a + 1], az = A[a + 2], bx = A[c1], by = A[c1 + 1], bz = A[c1 + 2], cx = A[c2], cy = A[c2 + 1], cz = A[c2 + 2];
        const wm = Math.max(ax * dx + ay * dy + az * dz, bx * dx + by * dy + bz * dz, cx * dx + cy * dy + cz * dz); if (wm <= wMin) continue;
        const e = rho * (wm - wMin) + 0.02, ua = ax * ux + az * uz, ub = bx * ux + bz * uz, uc = cx * ux + cz * uz, a0 = Math.min(ua, ub, uc) - e, a1 = Math.max(ua, ub, uc) + e; if (a1 < u0 || a0 > u1) continue;
        const va = ax * vx + ay * vy + az * vz, vb = bx * vx + by * vy + bz * vz, vc = cx * vx + cy * vy + cz * vz, b0 = Math.min(va, vb, vc) - e, b1 = Math.max(va, vb, vc) + e; if (b1 < v0 || b0 > v1) continue;
        const id = T.length; T.push(ax, ay, az, bx - ax, by - ay, bz - az, cx - ax, cy - ay, cz - az);
        const i0 = Math.max(0, Math.floor(a0 - gx)), i1 = Math.min(nx - 1, Math.floor(a1 - gx)), j0 = Math.max(0, Math.floor(b0 - gy)), j1 = Math.min(ny - 1, Math.floor(b1 - gy));
        for (let jj = j0; jj <= j1; jj++) for (let ii = i0; ii <= i1; ii++) cells[jj * nx + ii].push(id);
      }
    }
    return (Q, m, all) => rays(Q, m, all, gx, gy, nx, ny, cells, T, dx, dy, dz, ux, uz, vx, vy, vz, rho);
  };
  return { solid, ready, open: (O, n, dir, rho) => ready(O, n, dir, rho)(O, n, true), solids };
}
// the rays of makeCover: for each origin, each ray of the face against the faces filed under the origin's own square of the plane
function rays(O, n, all, gx, gy, nx, ny, cells, T, dx, dy, dz, ux, uz, vx, vy, vz, rho) {
  const out = new Uint8Array(n), F = COVER.face;
  for (let j = 0; j < n; j++) {
    const ox = O[j * 3], oy = O[j * 3 + 1], oz = O[j * 3 + 2], ci = Math.min(nx - 1, Math.max(0, Math.floor(ox * ux + oz * uz - gx))), cj = Math.min(ny - 1, Math.max(0, Math.floor(ox * vx + oy * vy + oz * vz - gy))), list = cells[cj * nx + ci]; let clear = 0;
    for (let k = 0; k < F.length && (all || !clear); k++) {
      const a = F[k][0] * rho, b = F[k][1] * rho, rx = dx + a * ux + b * vx, ry = dy + b * vy, rz = dz + a * uz + b * vz; let stopped = false;
      for (let q = 0; q < list.length && !stopped; q++) {
        const t = list[q], e1x = T[t + 3], e1y = T[t + 4], e1z = T[t + 5], e2x = T[t + 6], e2y = T[t + 7], e2z = T[t + 8];
        const hx = ry * e2z - rz * e2y, hy = rz * e2x - rx * e2z, hz = rx * e2y - ry * e2x, det = e1x * hx + e1y * hy + e1z * hz; if (det > -1e-9 && det < 1e-9) continue;
        const f = 1 / det, px = ox - T[t], py = oy - T[t + 1], pz = oz - T[t + 2], u = f * (px * hx + py * hy + pz * hz); if (u < 0 || u > 1) continue;
        const qx = py * e1z - pz * e1y, qy = pz * e1x - px * e1z, qz = px * e1y - py * e1x, v = f * (rx * qx + ry * qy + rz * qz); if (v < 0 || u + v > 1) continue;
        if (f * (e2x * qx + e2y * qy + e2z * qz) >= 0.05) stopped = true;
      }
      if (!stopped) clear++;
    }
    out[j] = clear;
  }
  return out;
}
// THE HIDDEN STRETCH AT A DIVIDING ROOF. The roof's own ground is every whole metre of lane round metre mJoin whose place lies
// within JOIN.half of the dividing line (off(x, z): metres from the line). A disc is whole in its own garden: so on the side of
// its own garden (ahead of the roof along the lane when `ahead`, else behind it) the stretch ends with the roof's own ground.
// On the other side the rays are cast on along the lane, COVER.step metres at a time, for as long as the last metre asked is
// itself hidden: so a hidden run is followed to its true end, however far from the roof the cover reaches. The stretch is the
// longest hidden run that has a metre on the roof's own ground. The cover is made ready for the ground and COVER.reach metres
// beyond it, and again that far on if a run goes on past that. In steps (a generator: one piece of work, then a hand-back), so
// that no step of a build is long.
// Returns { m0, m1 (the ground), lo, hi (the metres asked), from, to (the hidden run; from > to when there is none), open (for
// each metre asked from lo on: 0 where the disc is hidden at all three heights) }.
export function* hiddenSteps(cover, E, mJoin, off, ahead, dir, rho) {
  const last = E.route.length - 2, clear = new Uint8Array(E.route.length), on = (m) => { const p = E.route[m]; return Math.abs(off(p.x, p.z)) <= JOIN.half; };
  const origins = (a, b) => {
    const n = b - a + 1, O = new Float32Array(n * 9);
    for (let i = 0; i < n; i++) { const p = E.route[a + i]; for (let h = 0; h < 3; h++) { O[(i * 3 + h) * 3] = p.x; O[(i * 3 + h) * 3 + 1] = p.y + (h - 1) * COVER.lift; O[(i * 3 + h) * 3 + 2] = p.z; } }
    return O;
  };
  let m0 = Math.round(mJoin), m1 = m0; while (m0 > 1 && on(m0 - 1)) m0--; while (m1 < last && on(m1 + 1)) m1++;
  let pa = ahead ? Math.max(1, m0 - COVER.reach) : m0, pb = ahead ? m1 : Math.min(last, m1 + COVER.reach), ask = cover.ready(origins(pa, pb), (pb - pa + 1) * 3, dir, rho);
  const cast = (a, b) => { const r = ask(origins(a, b), (b - a + 1) * 3, false); for (let i = a; i <= b; i++) clear[i] = r[(i - a) * 3] + r[(i - a) * 3 + 1] + r[(i - a) * 3 + 2]; };
  let lo = m0, hi = m0 - 1;
  while (hi < m1) { yield; const b = Math.min(m1, hi + COVER.step); cast(hi + 1, b); hi = b; }
  while (ahead && lo > 1 && clear[lo] === 0) {
    yield; const a = Math.max(1, lo - COVER.step);
    if (a < pa) { pb = lo - 1; pa = Math.max(1, lo - COVER.reach); ask = cover.ready(origins(pa, pb), (pb - pa + 1) * 3, dir, rho); yield; }
    cast(a, lo - 1); lo = a;
  }
  while (!ahead && hi < last && clear[hi] === 0) {
    yield; const b = Math.min(last, hi + COVER.step);
    if (b > pb) { pa = hi + 1; pb = Math.min(last, hi + COVER.reach); ask = cover.ready(origins(pa, pb), (pb - pa + 1) * 3, dir, rho); yield; }
    cast(hi + 1, b); hi = b;
  }
  let from = 1, to = 0, a = -1;
  for (let m = lo; m <= hi + 1; m++) {
    if (m <= hi && clear[m] === 0) { if (a < 0) a = m; } else if (a >= 0) { if (m - 1 >= m0 && a <= m1 && m - 1 - a > to - from) { from = a; to = m - 1; } a = -1; }
  }
  return { m0, m1, lo, hi, from, to, open: Array.from(clear.subarray(lo, hi + 1)) };
}
export const H4_LAMPS = 8;
// the same weights for a shader: h4At(world xz, half width of a join in metres)
export const GLSL_FIELD = /* glsl */`
vec4 h4At(vec2 p, float hs){
  float e = smoothstep(-hs, hs, p.x), zd = ${JOIN.hallZ.toFixed(1)} * smoothstep(${JOIN.turn0.toFixed(1)}, ${JOIN.turn1.toFixed(1)}, p.x);
  float se = smoothstep(zd - hs, zd + hs, p.y), sw = smoothstep(-hs, hs, p.y);
  return vec4(e * se, e * (1. - se), (1. - e) * sw, (1. - e) * (1. - sw));
}
`;
const GLSL_HOURS = /* glsl */`
#define H4_LAMPS ${H4_LAMPS}
uniform vec3 uHKey[4]; uniform vec3 uHDir[4]; uniform vec3 uHSky[4]; uniform vec3 uHGnd[4]; uniform vec3 uHFog[4]; uniform vec3 uHBnc[4]; uniform vec4 uHAux[4];
uniform vec4 uHLampP[H4_LAMPS]; uniform vec3 uHLampC[H4_LAMPS]; uniform float uHLampF[H4_LAMPS]; uniform float uHClock;
` + GLSL_FIELD;
// toward a light at this elevation and azimuth (0 looking north, 90 east)
export const skyDir = (el, az) => { const D = Math.PI / 180; return new THREE.Vector3(Math.sin(az * D) * Math.cos(el * D), Math.sin(el * D), -Math.cos(az * D) * Math.cos(el * D)); };
// The four hours' constants. o: { hour (spring's standing hour for the visit: day | dawn | golden | night), storm (the autumn's
// standing weather on a rare visit), snowing (the winter's) }. Returns { hours: [spring, summer, autumn, winter], uniforms }.
export function makeHours(o = {}) {
  const col = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k), storm = !!o.storm;
  // the estate has one moon, at one station: the winter's for ever, and the spring's too on a visit whose spring hour is night
  // (its disc is drawn once, by the winter's row)
  const MOON = { el: 21, az: 346 };
  const SPRING = {
    day: { el: 30, az: 250, sunCol: '#fff0dc', sunI: 3.0, hemiSky: '#b6c4f2', hemiGround: '#9a8676', hemiI: 1.35, fog: '#e6d6e2', fogD: 0.0034, zen: '#4f84d8', hor: '#ecd8e2', glow: '#fff0e0', disc: 9, cloud: '#fff4f2', cloudAmt: 0.3, bounce: ['#fff0e0', 0.15], preset: 'noon' },
    dawn: { el: 9, az: 95, sunCol: '#ffb48a', sunI: 2.9, hemiSky: '#b0b4e0', hemiGround: '#8a6a6a', hemiI: 1.0, fog: '#f0c8c4', fogD: 0.006, zen: '#7f9ad6', hor: '#ffd0b8', glow: '#ffc09a', disc: 10, cloud: '#ffd8c8', cloudAmt: 0.5, bounce: ['#ffd8c8', 0.1], preset: 'sunrise' },
    golden: { el: 14, az: 262, sunCol: '#ffb060', sunI: 3.0, hemiSky: '#a8b0e0', hemiGround: '#8a6a50', hemiI: 1.0, fog: '#f2cc9a', fogD: 0.0042, zen: '#6f94d8', hor: '#ffd8a0', glow: '#ffb870', disc: 10, cloud: '#ffe0b0', cloudAmt: 0.45, bounce: ['#ffd8a8', 0.1], preset: 'sunset' },
    night: { el: MOON.el, az: MOON.az, sunCol: '#c4d6ff', sunI: 1.7, hemiSky: '#5a74b8', hemiGround: '#27304a', hemiI: 1.1, fog: '#2e3c68', fogD: 0.0032, zen: '#0a1230', hor: '#2a3a66', glow: '#8fa8e8', disc: 0, moon: true, stars: 0.6, ring: 0.5, cloud: '#3a4a7a', cloudAmt: 0.35, expo: 1.25, bounce: ['#a8c0ff', 0.09], preset: 'night' },
  };
  const raw = [
    SPRING[o.hour] || SPRING.day,
    { el: 12, az: 292, sunCol: '#ffc890', sunI: 1.1, hemiSky: '#86b0c4', hemiGround: '#35584a', hemiI: 2.0, fog: '#3d6468', fogD: 0.0065, zen: '#122c44', hor: '#8fc0a8', glow: '#ffc27a', disc: 0, stars: 0.3, cloud: '#4a6a7a', cloudAmt: 0.4, expo: 1.15, bounce: ['#a0d0c0', 0.08], preset: 'overcast' },
    { el: 9, az: 247, sunCol: '#ff7a3a', sunI: 3.2, hemiSky: '#8a8fd0', hemiGround: '#8a4a34', hemiI: 2.0, fog: '#e0a070', fogD: storm ? 0.0042 : 0.003, zen: '#3a5aa0', hor: '#ffb070', glow: '#ff8a40', disc: 11, cloud: storm ? '#a8604a' : '#ffb890', cloudAmt: storm ? 0.8 : 0.42, bounce: ['#ffb080', 0.13], preset: 'sunset' },
    { el: MOON.el, az: MOON.az, sunCol: '#c4d6ff', sunI: 2.6, hemiSky: '#8098d8', hemiGround: '#2c3654', hemiI: 2.0, fog: '#2a3a66', fogD: 0.0025, zen: '#060c22', hor: '#243460', glow: '#9fb4f0', disc: 5, moon: true, stars: 0.5, ring: 1, cloud: '#3a4a7a', cloudAmt: o.snowing ? 0.5 : 0.25, expo: 1.3, bounce: ['#a8c0ff', 0.22], preset: 'night' },
  ];
  const hours = raw.map((r) => {
    const e = r.expo || 1;
    return { sun: skyDir(r.el, r.az), sunCol: col(r.sunCol, r.sunI * e), hemiSky: col(r.hemiSky, r.hemiI * e), hemiGround: col(r.hemiGround, r.hemiI * e), fog: col(r.fog), fogD: r.fogD, zen: col(r.zen), hor: col(r.hor), glow: col(r.glow),
      bounce: col(r.bounce[0], r.bounce[1]), disc: col(r.sunCol, r.disc), discSize: r.disc > 6 ? 0.99965 : 0.9996, stars: r.stars || 0, ring: r.ring || 0, moon: !!r.moon, cloud: col(r.cloud), cloudAmt: r.cloudAmt, expo: e, raw: r };
  });
  const each = (f) => ({ value: hours.map(f) });
  const uniforms = {
    uHKey: each((h) => h.sunCol), uHDir: each((h) => h.sun), uHSky: each((h) => h.hemiSky), uHGnd: each((h) => h.hemiGround), uHFog: each((h) => h.fog), uHBnc: each((h) => h.bounce),
    uHAux: each((h) => new THREE.Vector4(h.fogD, 0, 0, 0)),
    uHLampP: { value: Array.from({ length: H4_LAMPS }, () => new THREE.Vector4(0, -1e4, 0, 1)) }, uHLampC: { value: Array.from({ length: H4_LAMPS }, () => new THREE.Color(0, 0, 0)) },
    uHLampF: { value: new Array(H4_LAMPS).fill(0) }, uHClock: o.time || { value: 0 },
  };
  // a lamp that stands in the world for ever: place, reach in metres, colour times candela, how much its flame shakes (0..1)
  let lamps = 0;
  const lamp = (x, y, z, reach, hex, strength, shake = 0) => { if (lamps >= H4_LAMPS) return; uniforms.uHLampP.value[lamps].set(x, y, z, reach); uniforms.uHLampC.value[lamps].set(hex).multiplyScalar(strength); uniforms.uHLampF.value[lamps] = shake; lamps++; };
  return { hours, uniforms, lamp };
}

// Give a Lambert material the four hours. Its light is then: the key and the sky of each of the four hours by the weights of the
// fragment's own place, the fixed lamps, and the haze of its own garden. Whatever lights a scene may hold are not read.
// o.world: the name of a varying that already holds the world position (else one is added); o.flora: the kit's leaf material
// (light wrapped round a crown and through a leaf, as the kit does it for a scene's sun); o.key: GLSL that may change hK0..hK3.
export function hoursInto(sh, HU, o = {}) {
  Object.assign(sh.uniforms, HU);
  const wp = o.world || 'vH4W';
  if (!o.world) sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vH4W;')
    .replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 h4p = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nh4p = instanceMatrix * h4p;\n#endif\nvH4W = (modelMatrix * h4p).xyz; }');
  const term = o.flora
    ? '(mix(saturate(hNL), saturate((hNL + 0.9) / 1.9), 0.7 * (1. - fLeaf)) + fLeaf * ((saturate((hNL + 0.6) / 1.6) - saturate(hNL)) * uFloraLight.x + uFloraBackTint * ((saturate(0.25 - hNL * 0.75) * (0.35 + 0.65 * hVL * hVL) + 0.3 * hVL * hVL * vFlora.w) * uFloraBack)))'
    : 'vec3(saturate(hNL))';
  const one = (i) => `{ vec3 hL = normalize((viewMatrix * vec4(uHDir[${i}], 0.)).xyz); float hNL = dot(normal, hL), hVL = saturate(dot(hView, -hL)); hKey += hw[${i}] * hK${i} * ${term}; hAmb += hw[${i}] * mix(uHGnd[${i}], uHSky[${i}], hUpK); }`;
  const light = /* glsl */`
      {
        vec4 hw = h4At(${wp}.xz, ${JOIN.half.toFixed(1)});
        vec3 hUp = normalize((viewMatrix * vec4(0., 1., 0., 0.)).xyz), hView = normalize(vViewPosition);
        float hUpK = 0.5 * dot(normal, hUp) + 0.5;
        vec3 hKey = vec3(0.), hAmb = vec3(0.), hK0 = uHKey[0], hK1 = uHKey[1], hK2 = uHKey[2], hK3 = uHKey[3];
        ${o.key || ''}
        ${one(0)}
        ${one(1)}
        ${one(2)}
        ${one(3)}
        ${o.after || ''}
        for (int i = 0; i < H4_LAMPS; i++) {
          vec3 hTo = (viewMatrix * vec4(uHLampP[i].xyz, 1.)).xyz + vViewPosition;
          float hD = length(hTo), hQ = saturate(1. - pow4(hD / max(uHLampP[i].w, 1.)));
          float hShake = 1. - uHLampF[i] * (0.5 + 0.5 * sin(uHClock * 9.1 + float(i) * 2.3) * sin(uHClock * 5.3 + 1. + float(i)));
          hKey += uHLampC[i] * (hShake * hQ * hQ / max(hD * hD, 0.3)) * (0.25 + 0.75 * saturate(dot(normal, hTo / max(hD, 1e-3))))${o.lampCut ? ' * (' + o.lampCut + ')' : ''};
        }
        reflectedLight.directDiffuse = hKey * BRDF_Lambert(diffuseColor.rgb);
        reflectedLight.indirectDiffuse = hAmb * BRDF_Lambert(diffuseColor.rgb);
        totalEmissiveRadiance += diffuseColor.rgb * (hw.x * uHBnc[0] + hw.y * uHBnc[1] + hw.z * uHBnc[2] + hw.w * uHBnc[3]);
      }
      #include <lights_fragment_maps>`;
  const fog = /* glsl */`
      #ifdef USE_FOG
      {
        vec4 fw = h4At(${wp}.xz, ${JOIN.half.toFixed(1)});
        vec3 fC = fw.x * uHFog[0] + fw.y * uHFog[1] + fw.z * uHFog[2] + fw.w * uHFog[3];
        float fD = fw.x * uHAux[0].x + fw.y * uHAux[1].x + fw.z * uHAux[2].x + fw.w * uHAux[3].x;
        gl_FragColor.rgb = mix(gl_FragColor.rgb, fC, 1. - exp(-fD * fD * vFogDepth * vFogDepth));
      }
      #endif`;
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <common>', '#include <common>\n' + (o.world ? '' : 'varying vec3 vH4W;\n') + GLSL_HOURS)
    .replace('#include <lights_fragment_maps>', light)
    .replace('#include <fog_fragment>', fog);
}
// The kit's leaf material, given the four hours (the material is this world's own copy; the kit's code is not touched).
// A trunk or a bough (what is not leaf) takes its garden's key wrapped far round it and nearly twice its sky's fill: no trunk stands unlit black.
export function floraHours(mat, HU) {
  const kit = mat.onBeforeCompile, key = mat.customProgramCacheKey ? mat.customProgramCacheKey() : 'flora';
  mat.onBeforeCompile = (sh, r) => { kit(sh, r); hoursInto(sh, HU, { world: 'vFloraWorld', flora: true, after: 'hAmb *= 1. + 0.8 * (1. - fLeaf);' }); };
  mat.customProgramCacheKey = () => key + '-h4s2';
  return mat;
}

// ---------------------------------------------------------------- materials (lit by the four hours of their own place, the fixed lamps and their garden's haze)
const GLSL_HN = /* glsl */`
float hh(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float hn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(hh(i),hh(i+vec2(1.,0.)),f.x), mix(hh(i+vec2(0.,1.)),hh(i+vec2(1.,1.)),f.x), f.y); }
`;
// One material for every built thing: timber, bark roofs, plaster, blinds, cloth, boards, snow caps and gilding.
// shared = { uTime }: the clock's uniform, kept by the caller. HU: the four hours' uniforms (makeHours).
// Lamps behind blinds glow by what each surface was given when it was built (a hall's own strength, for ever). In the autumn
// garden bare wood, bark and boards take that hour's key and ground light greyed, so that no post, beam or eave reads red.
export function makeTimberMaterial(shared, HU) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  const un = { uTime: shared.uTime, uGlowCol: { value: new THREE.Color('#ffc66a') }, uMoss: { value: new THREE.Color('#465f2e') } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, un);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec4 aSurf; varying vec4 vSurf; varying vec2 vUvM; varying vec3 vWpT; uniform float uTime;')
      .replace('#include <begin_vertex>', /* glsl */`
        float swA = sin(uTime * 1.1 + aSurf.w) * 0.6 + sin(uTime * 2.3 + aSurf.w * 1.7 + position.x * 0.4 + position.z * 0.4) * 0.4;
        vec3 transformed = position + normal * aSurf.z * swA;
        vSurf = aSurf; vUvM = uv; vWpT = (modelMatrix * vec4(transformed, 1.0)).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec4 vSurf; varying vec2 vUvM; varying vec3 vWpT; uniform float uTime; uniform vec3 uGlowCol, uMoss;' + GLSL_HN)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        float sk = floor(vSurf.x + 0.5); vec2 sm = vUvM; float sfw = max(fwidth(sm.x), fwidth(sm.y)); vec3 dc = diffuseColor.rgb; float lampPat = 1., h4Caust = 0.;
        float h4Wood = sk < 1.5 ? 1. : (sk < 2.5 ? 0. : (sk < 3.5 ? 0.5 : (sk < 4.5 ? 0. : (sk < 5.5 ? 1. : 0.))));
        if (sk < 0.5) {
          float g = hn(vec2(sm.x * 0.7, sm.y * 9.0)) * 0.6 + hn(vec2(sm.x * 2.3, sm.y * 31.0)) * 0.4;
          dc *= 0.78 + 0.44 * mix(0.5, g, 1. - smoothstep(0.03, 0.25, sfw));
          dc = mix(dc, vec3(dot(dc, vec3(0.3333))) * 1.2, 0.3 * hn(sm * 0.35 + 3.7));
        } else if (sk < 1.5) {
          float course = fract(sm.y / 0.42), edge = smoothstep(0.0, 0.3, course) * (1. - smoothstep(0.75, 1.0, course));
          float fade = 1. - smoothstep(0.1, 0.5, sfw / 0.42);
          dc *= mix(0.9, 0.66 + 0.48 * edge, fade) * (0.78 + 0.44 * hn(sm * vec2(1.3, 0.6)));
          float moss = smoothstep(0.5, 0.74, hn(sm * 0.22 + 7.3) * 0.7 + hn(sm * 0.9) * 0.3);
          dc = mix(dc, uMoss * (0.7 + 0.6 * hn(sm * 3.1)), moss * 0.6 * step(vSurf.y, 0.5));
        } else if (sk < 2.5) {
          dc *= 0.88 + 0.16 * hn(sm * 1.7) + 0.06 * hn(sm * 9.);
        } else if (sk < 3.5) {
          float sl = fract(sm.y / 0.16), fade = 1. - smoothstep(0.12, 0.6, sfw / 0.16);
          float slat = mix(0.85, 0.66 + 0.4 * smoothstep(0.05, 0.4, sl) * (1. - smoothstep(0.75, 1., sl)), fade);
          float th = abs(fract(sm.x / 1.15) - 0.5), thread = 1. - 0.45 * (1. - smoothstep(0.03, 0.07, th)) * (1. - smoothstep(0.02, 0.2, sfw));
          dc *= slat * thread * (0.9 + 0.2 * hn(sm * vec2(0.4, 5.)));
          lampPat = slat * thread;
        } else if (sk < 4.5) {
          dc *= 0.9 + 0.14 * hn(sm * vec2(30., 2.5));
        } else if (sk < 5.5) {
          float pl = abs(fract(sm.y / 0.45) - 0.5), seam = 1. - 0.45 * smoothstep(0.42, 0.49, pl) * (1. - smoothstep(0.05, 0.4, sfw));
          dc *= (0.78 + 0.34 * hn(vec2(floor(sm.y / 0.45) * 7.1, sm.x * 0.4))) * seam;
        } else if (sk < 6.5) {
          dc *= 0.93 + 0.09 * hn(sm * 0.8);
        } else {
          dc *= 0.82 + 0.36 * hn(sm * 5.);
        }
        diffuseColor.rgb = dc;`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        float lampF = 0.82 + 0.18 * hn(vec2(vUvM.x * 0.25 + vSurf.w, uTime * 1.6));
        totalEmissiveRadiance += uGlowCol * vSurf.y * 1.9 * lampF * lampPat * step(1.5, vSurf.x);
        totalEmissiveRadiance += diffuseColor.rgb * 0.3 * step(6.5, vSurf.x);
        vec2 cw = vWpT.xz * 0.5 + vWpT.y * 0.23;
        float ca = (1. - abs(2. * hn(cw * 0.9 + vec2(uTime * 0.33, uTime * 0.21)) - 1.)) * (1. - abs(2. * hn(cw * 1.7 - vec2(uTime * 0.27, -uTime * 0.19)) - 1.));
        h4Caust = vSurf.y * (0.3 + 1.5 * smoothstep(0.35, 0.95, ca)) * (1. - step(0.5, vSurf.x));`);
    hoursInto(sh, HU, { world: 'vWpT',
      key: 'hK2 = mix(hK2, dot(hK2, vec3(0.2126, 0.7152, 0.0722)) * vec3(1.0, 0.94, 0.86), 0.88 * h4Wood);',
      after: 'hAmb = mix(hAmb, dot(hAmb, vec3(0.2126, 0.7152, 0.0722)) * vec3(0.96, 0.98, 1.06), 0.7 * hw.z * h4Wood); totalEmissiveRadiance += diffuseColor.rgb * (hw.x * (uHSky[0] + 0.2 * uHKey[0]) + hw.y * (uHSky[1] + 0.2 * uHKey[1]) + hw.z * (uHSky[2] + 0.2 * uHKey[2]) + hw.w * (uHSky[3] + 0.2 * uHKey[3])) * 0.3 * h4Caust;' });
  };
  m.customProgramCacheKey = () => 'h4s-timber-3';
  m.userData.uniforms = un;
  return m;
}

// The ground: vertex colours with detail from the world position; snow that sparkles and carries the print of the wind (fine ripples
// across the wind, in its shading only); in the autumn garden fallen leaves, each a fleck a hand long. aG = (snow 0..1, fine sand 0..1).
const PLACE_WIND = [-0.7538, -0.6571];
export function makeGroundMaterial(shared, HU) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true });
  // shared.court: the uniforms of a court's sheet (makeCourtSheet), where a world lays one. Its picture is also set as a plain
  // property of the material, so that the engine's clearing finds it.
  const court = shared.court || null; if (court) { m.courtMap = court.uCourtMap.value; m.courtTall = court.uCourtTall.value; }
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = shared.uTime; if (court) Object.assign(sh.uniforms, court); sh.uniforms.uWet = shared.wet || { value: new THREE.Vector4(0, 0, 1e6, 2e6) };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute vec2 aG; varying vec2 vG; varying vec3 vWp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvG = aG; vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vG; varying vec3 vWp; uniform float uTime; uniform vec4 uWet;' + (court ? ' uniform sampler2D uCourtMap; uniform sampler2D uCourtTall; uniform vec4 uCourtBox; uniform vec2 uCourtTallBox;' : '') + GLSL_HN)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        vec2 gw = vWp.xz; float gd = length(vViewPosition), nearK = 1. - smoothstep(10., 55., gd), midK = 1. - smoothstep(60., 220., gd);
        float n1 = hn(gw * 0.21), n2 = hn(gw * 1.7 + 5.), n3 = hn(gw * 8.3), n4 = hn(gw * 31.);
        float rough = (n1 - 0.5) * 0.3 * midK + (n2 - 0.5) * 0.34 * midK + (n3 - 0.5) * 0.3 * nearK + (n4 - 0.5) * 0.22 * nearK * nearK;
        float soft = (n1 - 0.5) * 0.14 + (n2 - 0.5) * 0.1 * midK + (n3 - 0.5) * 0.08 * nearK;
        float fine = (n1 - 0.5) * 0.12 + (n3 - 0.5) * 0.16 * nearK + (n4 - 0.5) * 0.3 * nearK;
        float sn = clamp(vG.x, 0., 1.), sd = clamp(vG.y, 0., 1.);
        diffuseColor.rgb *= 1. + mix(mix(rough, fine, sd), soft, sn);
        float spark = step(0.9975, hh(floor(gw * 22.))) * step(0.5, fract(hh(floor(gw * 22.) + 3.) + uTime * 0.35)) * nearK * nearK * sn;
        // THE AUTUMN FLOOR IS LEAF LITTER. The fallen leaves lie in drifts the wind has gathered (long along the wind, a few metres
        // across, a foot deep at the most): red under one stretch of maples, orange under the next, gold further on, by the place;
        // between the drifts the floor shows, moss here and bare earth there, with a thin scatter of leaves on it. A drift has
        // form: its slope is handed to the normal below, so the side toward the red sun is lit by the autumn hour and the other
        // lies in its own shade, from wherever it is seen. Near the eye every leaf is drawn, a hand long, lying at its own turn.
        float lf = h4At(gw, 8.0).z * (1. - sd) * (1. - sn); vec2 lDr = vec2(0.);
        if (lf > 0.01) {
          vec2 lwd = vec2(${PLACE_WIND[0].toFixed(4)}, ${PLACE_WIND[1].toFixed(4)}), lp = vec2(dot(gw, lwd), dot(gw, vec2(-lwd.y, lwd.x)));
          #define H4LIT(q) (0.62 * hn((q) * vec2(0.1, 0.19) + 3.) + 0.38 * hn((q) * vec2(0.27, 0.5) + 17.))
          float deep = smoothstep(0.4, 0.62, H4LIT(lp)), lk = 1. - smoothstep(7., 26., gd);
          lDr = (lwd * (smoothstep(0.4, 0.62, H4LIT(lp + vec2(0.4, 0.))) - deep) + vec2(-lwd.y, lwd.x) * (smoothstep(0.4, 0.62, H4LIT(lp + vec2(0., 0.4))) - deep)) * (0.75 * lf * midK);
          float lz = hn(gw * 0.06 + 31.) + 0.3 * (n2 - 0.5);
          vec3 floorC = mix(vec3(0.2, 0.135, 0.08), vec3(0.12, 0.2, 0.07), smoothstep(0.42, 0.6, hn(gw * 0.31 + 41.)));
          vec3 driftC = mix(mix(vec3(0.55, 0.125, 0.045), vec3(0.62, 0.25, 0.055), smoothstep(0.34, 0.5, lz)), vec3(0.57, 0.35, 0.085), smoothstep(0.56, 0.74, lz));
          vec3 bed = mix(floorC, driftC * (0.82 + 0.36 * n3), 0.22 + 0.78 * deep);
          if (lk > 0.) {
            vec2 lq = gw * 4.2 + 0.6 * hn(gw * 0.9), lc = floor(lq), lu = fract(lq) - 0.5; float lh = hh(lc), la = 6.283 * hh(lc + 5.3);
            lu -= (vec2(hh(lc + 1.7), hh(lc + 2.9)) - 0.5) * 0.36;
            vec2 lr = vec2(cos(la) * lu.x + sin(la) * lu.y, cos(la) * lu.y - sin(la) * lu.x); float ll = 0.26 + 0.12 * hh(lc + 7.), lw = ll * (0.5 + 0.22 * hh(lc + 4.4));
            float shape = (1. - smoothstep(0.7, 1., length(vec2(lr.x / ll, lr.y / max(lw * (1. - 0.6 * abs(lr.x) / ll), 1e-3))))) * step(hh(lc + 9.1), 0.2 + 0.75 * deep);
            float lzz = lz + (lh - 0.5) * 0.5;
            vec3 leafC = mix(mix(vec3(0.6, 0.135, 0.05), vec3(0.68, 0.275, 0.06), smoothstep(0.34, 0.5, lzz)), vec3(0.63, 0.385, 0.094), smoothstep(0.56, 0.74, lzz)) * (0.75 + 0.5 * hh(lc + 3.));
            bed = mix(bed, mix(mix(floorC, bed * 0.6, deep), leafC, shape), lk);
          }
          // (under a tree the ground's own colour is shaded: the litter keeps a part of that shade)
          diffuseColor.rgb = mix(diffuseColor.rgb, bed * (0.66 + 0.34 * smoothstep(0.012, 0.05, dot(diffuseColor.rgb, vec3(0.3, 0.6, 0.1)))), lf * 0.9);
        }
        // THE WATER'S EDGE. The ground within a hand and a half over its own water's level is wet and dark, and darker under the water
        // (the level: nought through the spring and the summer gardens; in the autumn garden the brook's own, which falls along its straight
        // line from the crossing to the autumn lake's: uWet = that line's direction and the two ends of the fall along it). Snow is never wet.
        // On a spring bank's slope, between the wet line and the garden's level, lie fallen petals, each a thumb across.
        float wHgt = vWp.y + 0.6 * smoothstep(uWet.z, uWet.w, dot(gw, uWet.xy)) * step(gw.x, 0.) * step(0., gw.y);
        // (a bed two metres and more under its water keeps its own colour: the water over it is not seen through, and where an opening's
        // camera behind the entry cuts the lake's surface away the bed is what shows and must read as water, as the world's colours say)
        diffuseColor.rgb *= 1. - 0.62 * (1. - smoothstep(0.05, 0.3, wHgt)) * smoothstep(-2.3, -1.7, wHgt) * (1. - sn);
        float pk = h4At(gw, 8.0).x * (1. - sd) * (1. - sn) * smoothstep(0.25, 0.45, wHgt) * (1. - smoothstep(0.82, 0.96, wHgt)) * (1. - smoothstep(8., 34., gd));
        if (pk > 0.01) {
          vec2 pq = gw * 9. + 0.5 * hn(gw * 1.3), pc = floor(pq), pu = fract(pq) - 0.5 - (vec2(hh(pc + 1.7), hh(pc + 2.9)) - 0.5) * 0.4;
          float pm = step(hh(pc), 0.4 * (0.35 + 0.65 * hn(gw * 0.35 + 9.))) * (1. - smoothstep(0.17, 0.27, length(pu * vec2(1., 1.5))));
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.66, 0.72) * (0.8 + 0.4 * hh(pc + 3.)), pm * pk);
        }
        ${court ? /* glsl */`// (where the eye's ray meets the true ground: this sheet of ground may lie a hand above or under it)
        vec3 cRay = normalize(vWp - cameraPosition); vec2 cw = gw + cRay.xz * clamp((vWp.y - texture2D(uCourtTall, (gw - uCourtBox.xy + 0.5) * uCourtTallBox).r) / max(-cRay.y, 0.08), -2., 2.);
        vec2 cuv = (cw - uCourtBox.xy) * uCourtBox.zw; vec4 ct = texture2D(uCourtMap, cuv, -0.7);
        float cIn = sn * smoothstep(0., 0.04, min(cuv.x, cuv.y)) * smoothstep(0., 0.04, 1. - max(cuv.x, cuv.y)), h4Shade = ct.r * cIn, cPress = ct.a * cIn; vec2 cSlope = (ct.gb - 0.50196) * ${(2.00787 * COURT_SHEET.slope).toFixed(4)};
        diffuseColor.rgb = mix(diffuseColor.rgb * (1. - 0.3 * cPress), vec3(0.16, 0.19, 0.09), cPress * 0.55 * smoothstep(0.5, 0.75, n3 * 0.55 + n4 * 0.45));
        // (the court's snow is clean: of the snow's tone only its broadest shade and its finest grain stay; the half-metre blotches go)
        diffuseColor.rgb *= mix(1., (1. + (n1 - 0.5) * 0.08 + (n3 - 0.5) * 0.08 * nearK) / (1. + soft), cIn);` : 'float h4Shade = 0., cIn = 0.; vec2 cSlope = vec2(0.), cw = gw;'}
        float cSpark = 0., cLean = 0.;`)
      .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
        {
          if (dot(lDr, lDr) > 0.) normal = normalize(normal - (viewMatrix * vec4(lDr.x, 0., lDr.y, 0.)).xyz);
          float rsn = clamp(vG.x, 0., 1.);
          if (rsn > 0.01) {
            vec2 wd = vec2(${PLACE_WIND[0].toFixed(4)}, ${PLACE_WIND[1].toFixed(4)}); float ra = dot(cw, wd), rc = dot(cw, vec2(-wd.y, wd.x));
            float rph = rc * 4.5 + 6.283 * 1.6 * hn(vec2(ra * 0.06, rc * 0.35)), ramp = (0.35 + 0.65 * hn(cw * 0.07 + 11.)) * (1. - smoothstep(25., 70., length(vViewPosition)));
            normal = normalize(normal - (viewMatrix * vec4(vec3(-wd.y, 0., wd.x) * (cos(rph) * 0.2 * ramp * rsn), 0.)).xyz);
            ${court ? /* glsl */`// the court's snow takes its whole form from the sheet's slopes (the ground's broad swells, the long drifts laid on it, the furrow:
            // one form for the quarter's sheet and the fine strips alike); between the drifts it is clean: no crust, no lump, only the wind's print below
            // THE WIND'S PRINT ON THE COURT'S SNOW IS NO ROW OF LINES. Low crests lie along the wind, a few metres long and a hand to a
            // stride across, of two sizes; they wander, fork and run out, no two at one spacing (two noises drawn out along the wind, the
            // finer sheared across the coarser, both bent by a third). They lie in patches with clean snow between, the same over the
            // whole court, and fade from 12 to 32 m of the eye. (Even parallel ripples, long and unbroken, read as raked gravel, which
            // the design forbids.)
            float rb = rc + 0.8 * hn(vec2(ra * 0.09, rc * 0.2) + 71.), re = 0.09;
            float rf = hn(vec2(ra * 0.21, (rb + re) * 1.15) + 3.) - hn(vec2(ra * 0.21, (rb - re) * 1.15) + 3.) + 0.5 * (hn(vec2(ra * 0.47 + 0.6 * (rb + re), (rb + re) * 2.9) + 19.) - hn(vec2(ra * 0.47 + 0.6 * (rb - re), (rb - re) * 2.9) + 19.));
            float rpatch = smoothstep(0.35, 0.7, hn(vec2(ra * 0.05, rc * 0.12) + 37.)) * (1. - smoothstep(12., 32., gd));
            vec2 cSkin = cSlope + vec2(-wd.y, wd.x) * (rf * 0.2 * rpatch);
            normal = normalize(mix(normal, normalize((viewMatrix * vec4(-cSkin.x, 1., -cSkin.y, 0.)).xyz), cIn));
            // (the sky's fill is brighter on the moon's side: a slope that faces that way takes more of it, so the snow keeps its form in the shade)
            cLean = clamp(-(cSkin.x * uHDir[3].x + cSkin.y * uHDir[3].z) * 1.1, -0.35, 0.4) * cIn;
            // the crust's sparkle, a law of the snow and the moon alone: a plate of crust (one in seventy of the small ones, a thumb
            // across; one in fifty of those a hand across) lies tilted by its own chance and shines when it faces the moon's one
            // station, on and off with the world's clock. (A plate smaller than the picture's own grain is not drawn.)
            float cpx = max(length(dFdx(cw)), length(dFdy(cw)));
            vec2 k1 = floor(cw * 22.), k2 = floor(cw * 7.);
            float f1 = dot(normalize(vec3(-cSkin.x + (hh(k1 + 11.) - 0.5) * 1.4, 1., -cSkin.y + (hh(k1 + 17.) - 0.5) * 1.4)), uHDir[3]);
            float f2 = dot(normalize(vec3(-cSkin.x + (hh(k2 + 11.) - 0.5) * 1.4, 1., -cSkin.y + (hh(k2 + 17.) - 0.5) * 1.4)), uHDir[3]);
            cSpark = (step(0.9857, hh(k1)) * smoothstep(0.55, 0.8, f1) * step(0.4, fract(hh(k1 + 3.) + uTime * 0.35)) * (1. - smoothstep(0.04, 0.11, cpx)) * (1. - smoothstep(0.2, 0.45, length(fract(cw * 22.) - 0.5)))
              + 0.7 * step(0.98, hh(k2)) * smoothstep(0.55, 0.8, f2) * step(0.4, fract(hh(k2 + 3.) + uTime * 0.27)) * (1. - smoothstep(0.1, 0.32, cpx)) * (1. - smoothstep(0.1, 0.3, length(fract(cw * 7.) - 0.5)))) * cIn;` : ''}
          }
        }`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance += vec3(0.75, 0.85, 1.0) * (spark * (1. - cIn) + cSpark) * 0.55 * (1. - h4Shade);');
    // (in the moon's shade the winter hour's key is gone; its sky's fill stays, a little less of it, which is what makes that shade
    // blue; the court's lit snow is a twentieth brighter, so that the court as a whole is as light as it was without its shade)
    // (a basket's legs stand between its fire and the snow: within 2.6 m of a lamp's foot the sheet's shade cuts that lamp's light too)
    hoursInto(sh, HU, { world: 'vWp', key: 'hK3 *= (1. - h4Shade) * (1. + 0.06 * cIn);', after: 'hAmb *= (1. - 0.15 * h4Shade) * (1. + cLean);', lampCut: '1. - 0.85 * h4Shade * (1. - smoothstep(1.7, 2.6, length(vWp.xz - uHLampP[i].xz)))' });
  };
  m.customProgramCacheKey = () => 'h4s-ground-13' + (court ? 'c' : '');
  return m;
}
// ---------------------------------------------------------------- the court's sheet: what lies on the snow, laid once at the build, by place
// One small picture of the winter quarter's ground (COURT_SHEET.cell metres a texel) that the ground's shader reads at each
// fragment's own x and z. R: the moon's shade (1 where a thing that stands lies between that ground and the moon's one
// station); G, B: the snow's own slope toward the east and toward the south (the ground's form with its drifts, finer than the
// ground's sheet holds; COURT_SHEET.slope is the steepest it can say; a world lays the drifts in it COURT_SHEET.gain times as
// high as they lie, so that a drift a hand high shows its lee side from across the court); A: snow pressed down (a furrow, a
// trodden lane). Every mark in it is laid from the place and the height of a thing that stands; nothing in it reads the eye,
// the clock or the metres flown.
export const COURT_SHEET = { x0: -206, z0: -226, x1: -2, z1: -2, cell: 0.5, slope: 1, gain: 2.2 };
export function makeCourtSheet(moon) {
  const S = COURT_SHEET, nx = Math.round((S.x1 - S.x0) / S.cell), nz = Math.round((S.z1 - S.z0) / S.cell), D = new Uint8Array(nx * nz * 4);
  for (let k = 0, n = nx * nz * 4; k < n; k += 4) { D[k + 1] = 128; D[k + 2] = 128; }
  const tex = new THREE.DataTexture(D, nx, nz, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = 16;
  // away from the moon along the ground, and how far a metre of height throws its shade
  const hl = Math.hypot(moon.x, moon.z), dx = -moon.x / hl, dz = -moon.z / hl, cot = hl / Math.max(moon.y, 0.05);
  // a soft blade into channel ch: from (ax, az) to (bx, bz), its half width ra to rb, its strength ka to kb, its edge soft over sa to sb metres
  const blade = (ch, ax, az, bx, bz, ra, rb, ka, kb, sa, sb) => {
    const pad = Math.max(ra, rb) + Math.max(sa, sb), i0 = Math.max(0, Math.floor((Math.min(ax, bx) - pad - S.x0) / S.cell)), i1 = Math.min(nx - 1, Math.ceil((Math.max(ax, bx) + pad - S.x0) / S.cell));
    const j0 = Math.max(0, Math.floor((Math.min(az, bz) - pad - S.z0) / S.cell)), j1 = Math.min(nz - 1, Math.ceil((Math.max(az, bz) + pad - S.z0) / S.cell)), ex = bx - ax, ez = bz - az, l2 = ex * ex + ez * ez || 1e-6;
    for (let j = j0; j <= j1; j++) {
      const pz = S.z0 + (j + 0.5) * S.cell - az;
      for (let i = i0; i <= i1; i++) {
        const px = S.x0 + (i + 0.5) * S.cell - ax; let t = (px * ex + pz * ez) / l2; t = t < 0 ? 0 : t > 1 ? 1 : t;
        const qx = px - ex * t, qz = pz - ez * t, r = ra + (rb - ra) * t, sf = sa + (sb - sa) * t, d = Math.sqrt(qx * qx + qz * qz); if (d >= r + sf) continue;
        let c = (r + sf - d) / (2 * sf); c = c > 1 ? 1 : c; const v = Math.round(255 * c * c * (3 - 2 * c) * (ka + (kb - ka) * t)), k = (j * nx + i) * 4 + ch;
        if (v > D[k]) D[k] = v;
      }
    }
  };
  // the shade of a thing that stands at (x, z): of its part between heights y0 and y1 over its foot, r0 to r1 metres across, strength k0 to k1
  const cast = (x, z, y0, y1, r0, r1, k0 = 1, k1 = k0) => blade(0, x + dx * cot * y0, z + dz * cot * y0, x + dx * cot * y1, z + dz * cot * y1, Math.max(r0, 0.3), Math.max(r1, 0.3), k0 * Math.min(1, r0 / 0.3), k1 * Math.min(1, r1 / 0.3), 0.3 + 0.012 * cot * y0, 0.3 + 0.012 * cot * y1);
  // the shade of a slab that stands over the box (cx, cz, half width hw, half depth hd) between heights y0 and y1 over the ground:
  // a place is shaded when a ray from it toward the moon meets the slab (asked at four points of each texel)
  let sLo = 0, sHi = 0;
  const span = (p, c, h, d) => { if (Math.abs(d) < 1e-6) { if (Math.abs(p - c) > h) return false; sLo = -1e9; sHi = 1e9; return true; } const a = (p - c - h) / d, b = (p - c + h) / d; sLo = a < b ? a : b; sHi = a < b ? b : a; return true; };
  const slab = (cx, cz, hw, hd, y0, y1, k = 1) => {
    const t0 = cot * y0, t1 = cot * y1, xa = cx - hw + Math.min(dx * t0, dx * t1), xb = cx + hw + Math.max(dx * t0, dx * t1), za = cz - hd + Math.min(dz * t0, dz * t1), zb = cz + hd + Math.max(dz * t0, dz * t1);
    const i0 = Math.max(0, Math.floor((xa - S.x0) / S.cell)), i1 = Math.min(nx - 1, Math.ceil((xb - S.x0) / S.cell)), j0 = Math.max(0, Math.floor((za - S.z0) / S.cell)), j1 = Math.min(nz - 1, Math.ceil((zb - S.z0) / S.cell));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      let n = 0;
      for (let q = 0; q < 4; q++) {
        if (!span(S.x0 + (i + 0.25 + 0.5 * (q & 1)) * S.cell, cx, hw, dx)) continue;
        let lo = sLo > t0 ? sLo : t0, hi = sHi < t1 ? sHi : t1;
        if (!span(S.z0 + (j + 0.25 + 0.5 * (q >> 1)) * S.cell, cz, hd, dz)) continue;
        if (sLo > lo) lo = sLo; if (sHi < hi) hi = sHi; if (lo <= hi) n++;
      }
      if (n) { const v = Math.round(255 * k * n / 4), q = (j * nx + i) * 4; if (v > D[q]) D[q] = v; }
    }
  };
  // the snow's own slope from a height rule h(x, z): asked at every metre (in rows, with a rest between), the slope at each
  // metre from its neighbours either side, and each texel's slope laid between the four metres round it. ground(x, z), asked
  // straight after h at the same place, is the height the ground truly has there: it is kept at every metre in a second small
  // picture (uCourtTall), by which the ground's shader finds where the eye's ray meets the true ground, so that what lies on the
  // snow does not jump where a coarse sheet of ground and a fine one meet a hand apart in height
  const cx = Math.round(S.x1 - S.x0) + 1, cz = Math.round(S.z1 - S.z0) + 1, T = new Uint16Array(cx * cz);
  const tall = new THREE.DataTexture(T, cx, cz, THREE.RedFormat, THREE.HalfFloatType);
  tall.magFilter = tall.minFilter = THREE.LinearFilter; tall.wrapS = tall.wrapT = THREE.ClampToEdgeWrapping;
  const relief = async (h, rest, ground) => {
    const H = new Float32Array(cx * cz), SX = new Float32Array(cx * cz), SZ = new Float32Array(cx * cz);
    for (let j = 0; j < cz; j++) { for (let i = 0; i < cx; i++) { H[j * cx + i] = h(S.x0 + i, S.z0 + j); if (ground) T[j * cx + i] = THREE.DataUtils.toHalfFloat(ground(S.x0 + i, S.z0 + j)); } if (rest && j % 24 === 23) await rest(); }
    for (let j = 0; j < cz; j++) for (let i = 0; i < cx; i++) {
      const ia = i > 0 ? i - 1 : 0, ib = i < cx - 1 ? i + 1 : i, ja = j > 0 ? j - 1 : 0, jb = j < cz - 1 ? j + 1 : j;
      SX[j * cx + i] = (H[j * cx + ib] - H[j * cx + ia]) / (ib - ia); SZ[j * cx + i] = (H[jb * cx + i] - H[ja * cx + i]) / (jb - ja);
    }
    if (rest) await rest();
    for (let j = 0; j < nz; j++) {
      const fz = (j + 0.5) * S.cell, jz = Math.min(cz - 2, Math.floor(fz)), tz = fz - jz;
      for (let i = 0; i < nx; i++) {
        const fxm = (i + 0.5) * S.cell, ix = Math.min(cx - 2, Math.floor(fxm)), tx = fxm - ix, q = jz * cx + ix, k = (j * nx + i) * 4;
        const sx = (SX[q] * (1 - tx) + SX[q + 1] * tx) * (1 - tz) + (SX[q + cx] * (1 - tx) + SX[q + cx + 1] * tx) * tz, sz = (SZ[q] * (1 - tx) + SZ[q + 1] * tx) * (1 - tz) + (SZ[q + cx] * (1 - tx) + SZ[q + cx + 1] * tx) * tz;
        D[k + 1] = Math.round(128 + 127 * Math.max(-1, Math.min(1, sx / S.slope))); D[k + 2] = Math.round(128 + 127 * Math.max(-1, Math.min(1, sz / S.slope)));
      }
      if (rest && j % 96 === 95) await rest();
    }
  };
  // every texel whose middle lies in a box of the court: f(index, x, z); a slope (east, south) added to what a texel holds; a mark (0..1) laid into a channel
  const texels = (xa, za, xb, zb, f) => {
    const i0 = Math.max(0, Math.ceil((xa - S.x0) / S.cell - 0.5)), i1 = Math.min(nx - 1, Math.floor((xb - S.x0) / S.cell - 0.5)), j0 = Math.max(0, Math.ceil((za - S.z0) / S.cell - 0.5)), j1 = Math.min(nz - 1, Math.floor((zb - S.z0) / S.cell - 0.5));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f((j * nx + i) * 4, S.x0 + (i + 0.5) * S.cell, S.z0 + (j + 0.5) * S.cell);
  };
  const tilt = (k, sx, sz) => { D[k + 1] = Math.max(1, Math.min(255, Math.round(D[k + 1] + 127 * sx / S.slope))); D[k + 2] = Math.max(1, Math.min(255, Math.round(D[k + 2] + 127 * sz / S.slope))); };
  const mark = (k, ch, v) => { const b = Math.round(255 * v); if (b > D[k + ch]) D[k + ch] = b; };
  return { tex, tall, D, nx, nz, dx, dz, cot, blade, cast, slab, relief, texels, tilt, mark, done: () => { tex.needsUpdate = true; tall.needsUpdate = true; },
    uniforms: { uCourtMap: { value: tex }, uCourtTall: { value: tall }, uCourtBox: { value: new THREE.Vector4(S.x0, S.z0, 1 / (S.x1 - S.x0), 1 / (S.z1 - S.z0)) }, uCourtTallBox: { value: new THREE.Vector2(1 / cx, 1 / cz) } } };
}
// ---------------------------------------------------------------- the court's air: snow slipping from boughs, the baskets' sparks and smoke
// One cloud of small cards that face the eye. Each belongs to a source that stands for ever (a bough of a pine, a fire basket)
// and runs on the world's clock by that source's own period and phase: a bough sheds once in its period (a puff that falls,
// spreads and drifts down the wind, gone in four seconds and a half), a basket's sparks rise and die over and over, its smoke
// climbs and leans down the wind. Nothing in it reads the eye's place or the metres flown.
// A pool is a basket's gold lying flat on the ice beside it (x, y, z, radius), shaking as its flame does.
// o: { rng, time, wind: [x, z], slips: [[x, y, z, period, phase, size]], fires: [[x, y, z]], pools: [[x, y, z, r]], moon, ember, smoke (colours) }
export function makeCourtAir(o) {
  const g = o.rng, S = [], A = [], B = [], C = [], I = [];
  const mote = (x, y, z, per, ph, kind, size) => {
    const base = S.length / 3, r = [g(), g.range(-1, 1), g.range(-1, 1), g()];
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { S.push(x, y, z); A.push(per, ph, kind, r[0]); B.push(r[1], r[2], r[3], size); C.push(c[0], c[1], 0); }
    I.push(base, base + 1, base + 2, base, base + 2, base + 3);
  };
  for (const s of o.slips) for (let i = 0; i < 14; i++) mote(s[0], s[1], s[2], s[3], s[4] + g.range(0, 1.1), 0, g.range(0.5, 1.1) * s[5]);
  for (const f of o.fires) {
    for (let i = 0; i < 10; i++) mote(f[0], f[1], f[2], g.range(1.3, 2.6), g.range(0, 3), 1, g.range(0.035, 0.06));
    for (let i = 0; i < 8; i++) mote(f[0], f[1] + 0.2, f[2], g.range(5.5, 8), g.range(0, 8), 2, g.range(0.9, 1.5));
  }
  for (const q of o.pools || []) mote(q[0], q[1], q[2], 1, g.range(0, 6), 3, q[3]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('aSrc', new THREE.Float32BufferAttribute(S, 3));
  geo.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4)); geo.setAttribute('aB', new THREE.Float32BufferAttribute(B, 4)); geo.setIndex(I);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: o.time, uWind: { value: new THREE.Vector2(o.wind[0], o.wind[1]) }, uMoon: { value: new THREE.Color(o.moon) }, uEmber: { value: new THREE.Color(o.ember) }, uSmoke: { value: new THREE.Color(o.smoke) } },
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec3 aSrc; attribute vec4 aA; attribute vec4 aB; uniform float uTime; uniform vec2 uWind; uniform vec3 uMoon, uEmber, uSmoke;
      varying vec2 vC; varying vec4 vCol; varying float vHard;
      void main() {
        float per = aA.x, t = mod(uTime + aA.y, per), u = t / per, size = 0.; vec3 p = aSrc, wd = vec3(uWind.x, 0., uWind.y); vec4 col = vec4(0.); vHard = 0.;
        if (aA.z < 0.5) {
          float v = t / 4.5;
          if (v < 1.) {
            p += vec3(aB.x, 0., aB.y) * (0.25 + 0.32 * t) + wd * (t * (0.5 + 0.8 * aB.z)) - vec3(0., (0.5 + aA.w) * t * (0.9 + 0.5 * t), 0.);
            size = aB.w * (0.35 + 0.55 * v); col = vec4(uMoon, 1.) * (0.5 * smoothstep(0., 0.08, v) * (1. - v) * (1. - v));
          }
        } else if (aA.z < 1.5) {
          p += vec3(aB.x * 0.18 + 0.25 * u * sin(u * 9. + aB.z * 6.3), 0.2 + u * (1.6 + 1.6 * aA.w), aB.y * 0.18 + 0.25 * u * cos(u * 7. + aB.z * 6.3)) + wd * (u * u * 0.9);
          size = aB.w * (1. - 0.6 * u); col = vec4(uEmber * ((1. - u) * (1. - u) * 3.), 0.); vHard = 1.;
        } else {
          p += vec3(aB.x * 0.15, 0.4 + u * (3.2 + 1.5 * aA.w), aB.y * 0.15) + wd * (u * u * 3. + 0.3 * sin(u * 5. + aB.z * 6.3));
          size = aB.w * (0.35 + 1.4 * u); float a = 0.2 * smoothstep(0., 0.15, u) * (1. - u); col = vec4(mix(uEmber * 0.35, uSmoke, smoothstep(0., 0.3, u)) * a, a);
        }
        if (aA.z > 2.5) { size = 0.; p = aSrc + vec3(position.x, 0., position.y) * aB.w; col = vec4(uEmber * (0.2 * (0.82 + 0.18 * sin(uTime * 9.1 + aA.y) * sin(uTime * 5.3 + 1. + aA.y))), 0.); }
        vec4 mv = viewMatrix * vec4(p, 1.); mv.xy += position.xy * size;
        gl_Position = projectionMatrix * mv; vC = position.xy; vCol = col;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vC; varying vec4 vCol; varying float vHard;
      void main() {
        float d = dot(vC, vC), f = mix(exp(-d * 3.2) * (1. - smoothstep(0.6, 1., d)), 1. - smoothstep(0.25, 1., d), vHard);
        if (f * (vCol.a + vCol.r + vCol.g + vCol.b) < 0.002) discard;
        gl_FragColor = vCol * f;
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

// ---------------------------------------------------------------- the standing map: what stands in the estate, by place (the waters mirror it)
// Three small pictures of the whole estate from above, STAND.cell metres a texel, laid once at the build from the places and the
// heights of what stands. H: the top and the underside of the tall thing over a place (a crown over its trunk, a roof over its
// floor), the top of the low thing there (a bush, a stone, a post) and the height of the ground where it rises over the
// gardens' level (a hill, the fall's crag); heights are kept from STAND.base metres under the lake's water up. C: the tall
// thing's colour as it is lit in its own garden's hour, and in A the share of its height, from its underside up, that is trunk
// or wall. L: the colour of that trunk or wall, of the low thing, or of the risen ground. A water's shader reads them along the
// mirrored ray. Nothing in them reads the eye, the clock or the metres flown.
export const STAND = { x0: -216, z0: -252, x1: 216, z1: 256, cell: 1, tall: 40, low: 8, base: 1, gain: 4 };
export function makeStandMap(hours) {
  const S = STAND, nx = Math.round((S.x1 - S.x0) / S.cell), nz = Math.round((S.z1 - S.z0) / S.cell), H = new Uint8Array(nx * nz * 4), C = new Uint8Array(nx * nz * 4), L = new Uint8Array(nx * nz * 4);
  const tex = (D) => { const t = new THREE.DataTexture(D, nx, nz, THREE.RGBAFormat, THREE.UnsignedByteType); t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t; };
  const tH = tex(H), tC = tex(C), tL = tex(L);
  const hi = (y) => clamp(Math.round(255 * (y + S.base) / S.tall), 0, 255), lo = (y) => clamp(Math.round(255 * (y + S.base) / S.low), 0, 255), enc = (c) => Math.round(255 * Math.min(1, Math.sqrt(Math.max(0, c) / S.gain)));
  // a colour as it stands lit at its own place: its garden's sky and ground fill and a share of its key (the weights of hoursAt), k times
  const w4 = [0, 0, 0, 0];
  const lit = (c, x, z, k = 1) => {
    hoursAt(x, z, w4); let r = 0, g = 0, b = 0;
    for (let i = 0; i < 4; i++) { const h = hours[i], w = w4[i] * k * 0.3183; r += w * (0.5 * h.hemiSky.r + 0.5 * h.hemiGround.r + 0.3 * h.sunCol.r); g += w * (0.5 * h.hemiSky.g + 0.5 * h.hemiGround.g + 0.3 * h.sunCol.g); b += w * (0.5 * h.hemiSky.b + 0.5 * h.hemiGround.b + 0.3 * h.sunCol.b); }
    return [c[0] * r, c[1] * g, c[2] * b];
  };
  // every cell whose middle lies in a box of the estate (never the map's outermost ring, which stays empty): f(k, x, z)
  const cells = (xa, za, xb, zb, f) => {
    const i0 = Math.max(1, Math.ceil((xa - S.x0) / S.cell - 0.5)), i1 = Math.min(nx - 2, Math.floor((xb - S.x0) / S.cell - 0.5)), j0 = Math.max(1, Math.ceil((za - S.z0) / S.cell - 0.5)), j1 = Math.min(nz - 2, Math.floor((zb - S.z0) / S.cell - 0.5));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) f((j * nx + i) * 4, S.x0 + (i + 0.5) * S.cell, S.z0 + (j + 0.5) * S.cell);
  };
  const put = (D, k, c) => { D[k] = enc(c[0]); D[k + 1] = enc(c[1]); D[k + 2] = enc(c[2]); };
  // the taller thing takes a cell: a tall thing (top, underside, colour; share: how much of it from the underside up wears the foot's colour)
  const tall = (k, top, under, col, share = 0, foot = null) => { const t = hi(top); if (t <= H[k]) return; H[k] = t; H[k + 1] = Math.min(t, hi(under)); put(C, k, col); C[k + 3] = Math.round(255 * clamp(share, 0, 1)); if (foot && share > 0) put(L, k, foot); };
  const low = (k, top, col) => { const t = lo(top); if (t <= H[k + 2]) return; H[k + 2] = t; if (!C[k + 3]) put(L, k, col); };
  const ground = (k, y, col) => { const t = hi(y); if (t <= H[k + 3]) return; H[k + 3] = t; if (!H[k + 2] && !C[k + 3]) put(L, k, col); };
  // a tree at (x, z) on ground y: a crown r across, a dome between its underside and its top, over a trunk
  const tree = (x, z, y, top, r, under, col, bark) => cells(x - r, z - r, x + r, z + r, (k, cx, cz) => {
    const d = Math.hypot(cx - x, cz - z) / r; if (d >= 1) return;
    const t = y + top * (1 - 0.4 * d * d), trunk = d * r < 0.75, u = trunk ? -S.base : y + top * (under + 0.3 * (1 - under) * d * d);
    tall(k, t, u, col, trunk ? (y + top * under + S.base) / (t + S.base) : 0, bark);
  });
  // a bush, a clump, a stone, a post: a low mound r across (the nearest cell at least)
  const mound = (x, z, y, top, r, col) => { const rr = Math.max(r, 0.72); cells(x - rr, z - rr, x + rr, z + rr, (k, cx, cz) => { const d = Math.hypot(cx - x, cz - z) / rr; if (d < 1) low(k, y + top * (1 - 0.5 * d * d), col); }); };
  // a hill of the ground rule (the part's HILLS): only where it stands 0.6 m or more over the gardens' level
  const hill = (x, z, r, h, pw, base, col) => cells(x - r, z - r, x + r, z + r, (k, cx, cz) => { const d = Math.hypot(cx - x, cz - z); if (d >= r) return; const up = h * Math.pow(1 - smoothstep(r * 0.12, r, d), pw); if (up > 0.6) ground(k, base + up, col); });
  // a house at (x, z), turned by yaw (the builder's turn), hw by hd metres to its posts and ov more to its eaves: the walls from the
  // ground to the eave (the wall's colour), over them and over the eaves' reach the roof, hipped, from yE at the eaves to yR at the ridge
  const house = (x, z, yaw, hw, hd, ov, yE, yR, roof, wall) => {
    const c = Math.cos(yaw), s = Math.sin(yaw), A = hw + ov, B = hd + ov, R = Math.hypot(A, B);
    cells(x - R, z - R, x + R, z + R, (k, cx, cz) => {
      const dx = cx - x, dz = cz - z, ax = Math.abs(dx * c - dz * s), az = Math.abs(dx * s + dz * c); if (ax >= A || az >= B) return;
      const t = clamp(Math.min(B - az, A - ax) / Math.min(A, B), 0, 1), top = yE + (yR - yE) * (0.42 * t + 0.58 * t * t), inside = ax < hw && az < hd;
      tall(k, top, inside ? -S.base : yE - 0.45, roof, inside ? (yE - 0.3 + S.base) / (top + S.base) : 0, wall);
    });
  };
  // a gallery or a bridge from p0 to p1, `half` metres to either side: its floor at fy(metres along), the lintel `up` over the floor,
  // the roof `rise` more at its middle (a plain bridge: up to its rail, no rise); floor, posts and rails in the colour `under`
  const walk = (p0, p1, half, fy, up, rise, roof, under) => {
    const dx = p1[0] - p0[0], dz = p1[1] - p0[1], L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
    cells(Math.min(p0[0], p1[0]) - half - 1, Math.min(p0[1], p1[1]) - half - 1, Math.max(p0[0], p1[0]) + half + 1, Math.max(p0[1], p1[1]) + half + 1, (k, cx, cz) => {
      const ex = cx - p0[0], ez = cz - p0[1], a = ex * ux + ez * uz, o = Math.abs(ex * uz - ez * ux); if (a < -0.8 || a > L + 0.8 || o >= half) return;
      const y = fy(clamp(a, 0, L)), top = y + up + rise * (1 - o / half);
      tall(k, top, y - 0.32, roof, rise > 0 ? (up + 0.32) / (top - y + 0.32) : 1, under);
    });
  };
  // the coarse copy for the far part of a mirrored ray: of every four metres square the tallest thing's top (A) and its colour
  const fx = Math.ceil(nx / 4), fz = Math.ceil(nz / 4), F = new Uint8Array(fx * fz * 4), tF = new THREE.DataTexture(F, fx, fz, THREE.RGBAFormat, THREE.UnsignedByteType);
  tF.magFilter = tF.minFilter = THREE.LinearFilter; tF.generateMipmaps = false; tF.wrapS = tF.wrapT = THREE.ClampToEdgeWrapping;
  const coarse = () => {
    for (let j = 1; j < nz - 1; j++) for (let i = 1, row = j * nx; i < nx - 1; i++) {
      const k = (row + i) * 4, t = H[k], g = H[k + 3]; if (!t && !g) continue;
      const f = ((j >> 2) * fx + (i >> 2)) * 4, top = Math.max(t, g); if (top <= F[f + 3]) continue;
      const D = t >= g ? C : L; F[f] = D[k]; F[f + 1] = D[k + 1]; F[f + 2] = D[k + 2]; F[f + 3] = top;
    }
  };
  // A thing's colour runs one texel out past its own outline, into cells where nothing of that picture stands: a water reads the
  // pictures between texels, and at a thing's edge it would mix the thing's colour with the empty cell's black (a dark line round
  // every mirrored thing). The heights and the trunk's share are not touched.
  const spread = (D, w, h) => {
    const W = new Uint32Array(D.buffer, D.byteOffset, D.length >> 2), near = [-w - 1, -w, -w + 1, -1, 1, w - 1, w, w + 1], add = [];   // (a cell read as one word: its three colour bytes are the word's low three on a little-endian machine, which every machine the film runs on is)
    for (let j = 1; j < h - 1; j++) for (let i = 1, c = j * w + 1; i < w - 1; i++, c++) {
      if (W[c] & 0xffffff) continue;
      let r = 0, g = 0, b = 0, n = 0;
      for (let q = 0; q < 8; q++) { const v = W[c + near[q]] & 0xffffff; if (v) { r += v & 255; g += (v >> 8) & 255; b += v >> 16; n++; } }
      if (n) add.push(c * 4, Math.round(r / n), Math.round(g / n), Math.round(b / n));
    }
    for (let a = 0; a < add.length; a += 4) { const k = add[a]; D[k] = add[a + 1]; D[k + 1] = add[a + 2]; D[k + 2] = add[a + 3]; }
  };
  return { S, H, C, L, nx, nz, lit, cells, tall, low, ground, tree, mound, hill, house, walk,
    // (done's four passes are too long for one build step together: given `rest` it asks to hand back to the page between them)
    done: async (rest) => { coarse(); if (rest) await rest(); spread(C, nx, nz); if (rest) await rest(); spread(L, nx, nz); if (rest) await rest(); spread(F, fx, fz); tH.needsUpdate = true; tC.needsUpdate = true; tL.needsUpdate = true; tF.needsUpdate = true; },
    uniforms: { uStandH: { value: tH }, uStandC: { value: tC }, uStandL: { value: tL }, uStandF: { value: tF }, uStandBox: { value: new THREE.Vector4(S.x0, S.z0, 1 / (S.x1 - S.x0), 1 / (S.z1 - S.z0)) } } };
}
// ---------------------------------------------------------------- the estate's own water (the stream, the brook, the side waters, the two lakes)
// A water mirrors what stands at its banks BY PLACE: from each point of its surface the mirrored ray is walked over the standing
// map (near by the map itself, a metre a texel; far by the map's coarse copy, the tallest of every four metres), and what the ray
// meets is drawn in its own colour, upside down in the water, where it stands and as wide as it stands; a ray that meets nothing
// shows the sky of the water's own garden (the dome's rule for that garden: lighter toward the horizon, which is the far end of a
// reach), with that sky's glow and cloud. The ripples bend the ray, so a mirrored thing is broken by them. No second render.
// LIGHT LAW: a water keeps its own garden's hour everywhere on it (the uniforms are that garden's alone); the haze laid over it
// is the scene's, by the eye's place, as it was. Nothing here reads the metres flown; the clock moves only ripples, flow and rings.
const WATER_VERT = /* glsl */`
attribute float aDepth, aShore; varying vec3 vWorld; varying float vDepth, vShore; varying vec3 vPixK;
#ifdef W_FLOW
attribute vec4 aFlow; attribute vec2 aDir; varying vec4 vFlow; varying vec2 vDir;
#endif
#include <fog_pars_vertex>
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vWorld = wp.xyz; vDepth = aDepth; vShore = aShore;
#ifdef W_FLOW
  vFlow = aFlow; vDir = aDir;
#endif
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  vPixK = vec3(gl_Position.y, gl_Position.w, 1. / projectionMatrix[1][1]);
  #include <fog_vertex>
}`;
const WATER_HEAD = /* glsl */`
uniform sampler2D uStandH, uStandC, uStandL, uStandF; uniform vec4 uStandBox;
uniform vec3 uZen, uHor, uGlow, uSunDir, uSkyFog, uCloud, uAmb, uKey, uDeep, uShallow, uFoamCol;
uniform vec4 uSkyK;      // cloud amount, the garden's haze density, how much the standing things are mirrored, the key's glint
uniform vec3 uZen4[4], uHor4[4], uGlow4[4], uSun4[4], uFog4[4], uCloud4[4]; uniform vec4 uCloudAmt4;   // the four gardens' skies (the dome's own numbers)
${GLSL_FIELD}
uniform vec4 uWat;       // ripple, ripple scale, clarity, edge softness
uniform vec4 uShoreK;    // shore foam, foam width, the bank's dark line in the water (amount, width)
uniform vec2 uWind; uniform float uTime;
varying vec3 vWorld; varying float vDepth, vShore; varying vec3 vPixK;
#include <fog_pars_fragment>
const mat2 WR1 = mat2(.7986,.6018,-.6018,.7986), WR2 = mat2(-.3256,.9455,-.9455,-.3256), WR3 = mat2(.3420,-.9397,.9397,.3420);
float wh1(vec2 p){ vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
vec2 wh2(vec2 p){ vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973)); p3+=dot(p3,p3.yzx+33.33); return fract((p3.xx+p3.yz)*p3.zy); }
float wvn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(wh1(i),wh1(i+vec2(1.,0.)),f.x), mix(wh1(i+vec2(0.,1.)),wh1(i+vec2(1.,1.)),f.x), f.y); }
// gradient noise and its two slopes (value about 0..1, d/dx, d/dy)
vec3 wnd(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*f*(f*(f*6.-15.)+10.), du=30.*f*f*(f*(f-2.)+1.);
  vec2 ga=wh2(i)*2.-1., gb=wh2(i+vec2(1.,0.))*2.-1., gc=wh2(i+vec2(0.,1.))*2.-1., gd=wh2(i+vec2(1.,1.))*2.-1.;
  float va=dot(ga,f), vb=dot(gb,f-vec2(1.,0.)), vc=dot(gc,f-vec2(0.,1.)), vd=dot(gd,f-vec2(1.,1.)), k=va-vb-vc+vd;
  return vec3(.5+.72*(va+u.x*(vb-va)+u.y*(vc-va)+u.x*u.y*k), .72*(ga+u.x*(gb-ga)+u.y*(gc-ga)+u.x*u.y*(ga-gb-gc+gd)+du*(u.yx*k+vec2(vb,vc)-va))); }
// The sky along a mirrored ray is THE SKY THE DOME SHOWS THERE: one garden's sky by the dome's rule (zenith to horizon, the body's glow, the
// cloud, the haze at the rim), and the four gardens' mixed by the estate's field at the ground under that part of the sky (the water's own
// place carried along the ray's bearing, as far as that part of the dome is low: 120 m at the rim, nought overhead), with a join 20 m
// either side of the gardens' line. So a water near a join mirrors the neighbour's sky where the dome shows the neighbour's sky.
vec3 wSky1(vec3 d, vec3 zen, vec3 hor, vec3 glow, vec3 sun, vec3 fogc, vec3 cloud, float amt, float t, float g, float n){
  float sd = clamp(dot(d, sun), 0., 1.);
  vec3 c = mix(hor, zen, g) + glow * ((.42 * pow(sd, 5.) + .5 * pow(sd, 48.)) * (1. - .5 * t));
  c = mix(c, cloud * (.75 + .5 * n) + glow * (.5 * pow(sd, 3.)), smoothstep(.92 - amt, 1.3 - amt, n) * smoothstep(.015, .2, d.y) * .6);
  return mix(fogc, c, smoothstep(-.01, .045, d.y)); }
vec3 wSky(vec3 d){ float t = clamp(d.y, 0., 1.), g = pow(t, .55), lowK = (1. - t) * (1. - t) * (1. - t);
  vec2 sp = d.xz / max(d.y + .16, .05); float n = wvn(sp * .9 + vec2(uTime * .006, uTime * .002)) * .62 + wvn(sp * 1.86 + 3.1) * .38;
  vec4 w = h4At(vWorld.xz + d.xz / max(length(d.xz), 1e-4) * (120. * lowK), 20.); vec3 c = vec3(0.);
  for (int i = 0; i < 4; i++) if (w[i] > .001) c += w[i] * wSky1(d, uZen4[i], uHor4[i], uGlow4[i], uSun4[i], uFog4[i], uCloud4[i], uCloudAmt4[i], t, g, n);
  return c; }
// what stands along the mirrored ray from o: its colour, and how much of the ray it takes. The ray is tried at set places along
// it, so a thing whose top it clears by little at one of them (by less than a third of the step there) takes a share of the ray,
// the more the less it clears it: the TOP of a mirrored thing is soft, as wide as the walk is coarse there. (A thing's side stays
// a hard edge, a true one; a thing lying whole between two of the places, a post or a thin trunk, can still be stepped over.)
vec4 standRay(vec3 o, vec3 d){
  float hl = max(length(d.xz), 1e-3), sl = d.y / hl, y0 = o.y + ${STAND.base.toFixed(1)}; vec2 dir = d.xz / hl;
  float t = .6, st = 1., tp = 0., hit = -1., farHit = 0., na = 0., nt = 0., nk = 0.;   // (na, nt, nk: of the things the ray clears before it meets one, the one that takes the greatest share: its share, where, and whether it is a low thing or risen ground (0), a tall thing (1) or one of the coarse copy (2))
  for (int i = 0; i < W_NEAR; i++){
    vec4 h = textureLod(uStandH, (o.xz + dir * t - uStandBox.xy) * uStandBox.zw, 0.); float y = y0 + sl * t;
    float top = h.r * ${STAND.tall.toFixed(1)}, lowTop = max(h.b * ${STAND.low.toFixed(1)}, h.a * ${STAND.tall.toFixed(1)});
    float inn = max(step(y, top) * step(h.g * ${STAND.tall.toFixed(1)}, y), step(y, lowTop));
    if (hit < 0.) { if (inn > .5) hit = t; else { tp = t;
      float sw = .35 * st, at = step(.004, h.r) * step(top, y) * (1. - smoothstep(0., sw, y - top)), al = step(.004, max(h.b, h.a)) * (1. - smoothstep(0., sw, y - lowTop));
      if (max(at, al) > na) { na = max(at, al); nt = t; nk = step(al, at); } } }
    t += st; st *= 1.14;
  }
  st = 3.5;
  for (int i = 0; i < W_FAR; i++){
    float fa = textureLod(uStandF, (o.xz + dir * t - uStandBox.xy) * uStandBox.zw, 0.).a, top = fa * ${STAND.tall.toFixed(1)}, y = y0 + sl * t;
    if (hit < 0.) { if (y < top) { hit = t; farHit = 1.; } else { tp = t;
      float af = step(.004, fa) * (1. - smoothstep(0., min(.35 * st, 3.), y - top));
      if (af > na) { na = af; nt = t; nk = 2.; } } }
    t += st; st *= 1.17;
  }
  vec4 nm = vec4(0.);
  if (na > .003) {
    vec2 un = (o.xz + dir * nt - uStandBox.xy) * uStandBox.zw; vec3 c;
    if (nk > 1.5) { c = textureLod(uStandF, un, 0.).rgb; c = c * c * (${STAND.gain.toFixed(1)} * 1.1); }
    else if (nk > .5) { c = textureLod(uStandC, un, 0.).rgb; c = c * c * (${STAND.gain.toFixed(1)} * 1.12); }
    else { c = textureLod(uStandL, un, 0.).rgb; c = c * c * ${STAND.gain.toFixed(1)}; }
    nm = vec4(mix(c, uSkyFog, 1. - exp(-uSkyK.y * uSkyK.y * nt * nt)), na);
  }
  if (hit < 0.) return nm;
  vec2 uv; float y;
  if (farHit > .5) {
    for (int i = 0; i < 2; i++){ float tm = .5 * (tp + hit); if (y0 + sl * tm < textureLod(uStandF, (o.xz + dir * tm - uStandBox.xy) * uStandBox.zw, 0.).a * ${STAND.tall.toFixed(1)}) hit = tm; else tp = tm; }
    uv = (o.xz + dir * hit - uStandBox.xy) * uStandBox.zw; vec4 f = textureLod(uStandF, uv, 0.); y = y0 + sl * hit;
    vec3 c = f.rgb * f.rgb * ${STAND.gain.toFixed(1)} * mix(.62, 1.1, clamp(y / max(f.a * ${STAND.tall.toFixed(1)}, 1.), 0., 1.));
    return vec4(mix(mix(c, uSkyFog, 1. - exp(-uSkyK.y * uSkyK.y * hit * hit)), nm.rgb, nm.a), 1.);
  }
  for (int i = 0; i < 3; i++){ float tm = .5 * (tp + hit); vec4 h = textureLod(uStandH, (o.xz + dir * tm - uStandBox.xy) * uStandBox.zw, 0.); y = y0 + sl * tm;
    if (max(max(step(y, h.r * ${STAND.tall.toFixed(1)}) * step(h.g * ${STAND.tall.toFixed(1)}, y), step(y, h.b * ${STAND.low.toFixed(1)})), step(y, h.a * ${STAND.tall.toFixed(1)})) > .5) hit = tm; else tp = tm; }
  uv = (o.xz + dir * hit - uStandBox.xy) * uStandBox.zw; y = y0 + sl * hit;
  vec4 h = textureLod(uStandH, uv, 0.), ct = textureLod(uStandC, uv, 0.), cl = textureLod(uStandL, uv, 0.);
  float top = h.r * ${STAND.tall.toFixed(1)}, und = h.g * ${STAND.tall.toFixed(1)}, k = clamp((y - und) / max(top - und, .5), 0., 1.);
  float tallK = step(y, top + .25) * step(und - .25, y) * step(.004, h.r) * step(ct.a, k);
  vec3 c = mix(cl.rgb * cl.rgb * ${STAND.gain.toFixed(1)}, ct.rgb * ct.rgb * (${STAND.gain.toFixed(1)} * mix(.6, 1.12, k)), tallK);
  return vec4(mix(mix(c, uSkyFog, 1. - exp(-uSkyK.y * uSkyK.y * hit * hit)), nm.rgb, nm.a), 1.);
}
`;
// A RIBBON'S SURFACE HAS A COURSE. Its sheet carries, at each point, the metres along the course, the metres across it, the half
// width there and how much the water quickens there (the world's rule: where the course narrows and where its bed falls), and the
// course's own direction. From these: flow lines carried down at the water's pace (the rafts' pace in the middle, slower toward
// the banks); a riffle where it quickens (chop going down with the water, standing waves across it, white flecks) and glass
// between; the standing V below every stone in the water (the wake sheet, laid at the build by the stones' places); slow rings
// round every pad and every raft (the ring sheet: the pads' is still, the rafts' goes down with them at their own pace).
const WATER_FLOW_HEAD = /* glsl */`
uniform sampler2D uWake, uRing; uniform vec4 uWakeBox, uRingK, uFlow; varying vec4 vFlow; varying vec2 vDir;
`;
const WATER_FLOW = /* glsl */`
  {
    float s = vFlow.x, a = vFlow.y, hw = max(vFlow.z, 1.), rf = clamp(vFlow.w, 0., 1.);
    vec2 T = normalize(vDir + vec2(1e-5, 0.)), Pn = vec2(-T.y, T.x);
    float bk = clamp(abs(a) / hw, 0., 1.), v = uFlow.x * (1. - .7 * bk * bk);
    float kA = smoothstep(1.5, 5., .5 / foot), kB = smoothstep(1.5, 5., .7 / foot), kC = smoothstep(1.5, 5., .3 / foot);
    float ph = fract(uTime * .11), w0 = 1. - abs(2. * ph - 1.);
    vec3 fa = wnd(vec2((s - v * 9.1 * (ph - .5)) * .22, a * 1.9 + 3.)), fb = wnd(vec2((s - v * 9.1 * (fract(ph + .5) - .5)) * .22 + 7.3, a * 1.9 - 5.));
    vec2 fl = (fa.yz * w0 + fb.yz * (1. - w0)) * vec2(.22, 1.9);
    slope += (T * fl.x + Pn * fl.y) * (uFlow.y * kA);
    vec3 ra = wnd(vec2((s - v * uTime) * 1.5, a * 2.3)), rb = wnd(vec2((s - v * uTime * .8) * 3.1 + 11., a * 4.1 + 2.));
    float sp = s * 4.2 + 2.5 * ra.x + a * .6;
    slope += rf * ((T * (ra.y * 1.5) + Pn * (ra.z * 2.3)) * (.036 * kB) + (T * (rb.y * 3.1) + Pn * (rb.z * 4.1)) * (.013 * kC) + T * (cos(sp) * .02 * kB * (.4 + .6 * rb.x)));
    white = rf * rf * (smoothstep(.6, .85, ra.x * .55 + rb.x * .45 + .12 * sin(sp)) * .55 * kB + .06 * (1. - kB)) * uFlow.z;
    rough += rf * rf * ((1. - kB) * .0012 + (1. - kC) * .0006);
    ruffle = mix(.22, .9, rf) * (1. - .45 * bk);
    // the V below a stone
    vec4 wk = texture2D(uWake, vec2((s - uWakeBox.x) * uWakeBox.y, a * .0625 + .5));
    float wl = smoothstep(1.5, 5., .45 / foot);
    slope += (T * (wk.r - .50196) + Pn * (wk.g - .50196)) * (uWakeBox.z * wl); white = max(white, wk.b * (.15 + .45 * wl) * uFlow.z);
    // the rings round a pad or a raft
    float ae = uRingK.w > .5 ? a / max(hw - 1.1, .5) * 3. : a, rm = smoothstep(0., 10., s - uWakeBox.w) * smoothstep(0., 10., uFlow.w - s);
    vec2 ru = vec2((s - uRingK.x - uRingK.z * uTime) * uRingK.y, ae * .0625 + .5);
    float r0 = texture2D(uRing, ru).r, r1 = texture2D(uRing, ru + vec2(.3 * uRingK.y, 0.)).r, r2 = texture2D(uRing, ru + vec2(0., .01875)).r, rd = r0 * 3.;
    vec2 rg = vec2(r1 - r0, r2 - r0); rg /= max(length(rg), 1e-4);
    slope += (T * rg.x + Pn * rg.y) * (cos(rd * 9. - uTime * 1.7) * exp(-rd * 1.1) * .07 * rm * (1. - smoothstep(.75, .98, r0)) * kA);
  }
`;
// where carp rise: a slow ring opens at each place, by the world's clock (uRise: x, z, the seconds between rises, the place's own phase)
const WATER_RISE_HEAD = /* glsl */`
uniform vec4 uRise[W_RISE];
`;
const WATER_RISE = /* glsl */`
  for (int i = 0; i < W_RISE; i++){ vec2 dv = vWorld.xz - uRise[i].xy; float d = length(dv), tt = mod(uTime + uRise[i].w, uRise[i].z), q = d - .25 - tt * .5;
    slope += dv / max(d, .05) * (cos(q * 8.) * exp(-q * q * 1.6) * exp(-tt * .4) * smoothstep(0., .5, tt) * .1); }
`;
// where a fall meets its pool: white water over its foot and the chop it throws (uChurn: x, z, how far it reaches, how white)
const WATER_CHURN_HEAD = /* glsl */`
uniform vec4 uChurn;
`;
const WATER_CHURN = /* glsl */`
  { float cd = length(vWorld.xz - uChurn.xy), ck = 1. - smoothstep(.3 * uChurn.z, uChurn.z, cd);
    white = max(white, ck * uChurn.w * (.5 + .5 * wvn(vWorld.xz * 3.1 - uTime * vec2(.9, .7))));
    slope += wnd(vWorld.xz * 2.2 + uTime * 1.3).yz * (.18 * ck); ruffle = max(ruffle, ck); }
`;
// a sheet along a course: `len` metres from m0, 8 m to either side, four texels a metre (bytes; R, G: the wake's two slopes about 128;
// B: its white; or one byte a texel: the distance to the nearest ring's middle, 3 m and more as 255)
export function makeCourseSheet(m0, len, bytes, wrap) {
  const nx = Math.max(4, Math.round(len * 4)), nz = 64, D = new Uint8Array(nx * nz * bytes); if (bytes === 1) D.fill(255); else for (let k = 0; k < D.length; k += 4) { D[k] = 128; D[k + 1] = 128; }
  const t = new THREE.DataTexture(D, nx, nz, bytes === 1 ? THREE.RedFormat : THREE.RGBAFormat, THREE.UnsignedByteType); t.magFilter = t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = wrap ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping; t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
  // every texel within `reach` metres of (s, a): f(index, metres down from s, metres across from a)
  const near = (s, a, back, fwd, side, f) => {
    const i0 = Math.floor((s - back - m0) * 4), i1 = Math.ceil((s + fwd - m0) * 4), j0 = Math.max(0, Math.floor((a - side + 8) * 4)), j1 = Math.min(nz - 1, Math.ceil((a + side + 8) * 4));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const ii = wrap ? ((i % nx) + nx) % nx : i; if (ii < 0 || ii >= nx) continue; f((j * nx + ii) * bytes, (i + 0.5) / 4 + m0 - s, (j + 0.5) / 4 - 8 - a); }
  };
  return { texture: t, m0, len, D,
    // a ring's middle at (s, a)
    ring: (s, a) => near(s, a, 3, 3, 3, (k, ds, da) => { const d = Math.round(Math.hypot(ds, da) * 85); if (d < D[k]) D[k] = d; }),
    // a stone r metres across at (s, a): two arms of standing ripples opening down the course from its shoulders, white where they leave it
    wake: (s, a, r) => near(s, a, r, 9, r + 4.5, (k, ds, da) => {
      if (ds < -0.3 * r) return; const A = Math.exp(-Math.max(ds, 0) / 4.2) * smoothstep(-0.3 * r, 0.4 * r, ds), q = Math.abs(da) - 0.8 * r - 0.36 * Math.max(ds, 0), sg = 0.22 + 0.05 * ds, g = Math.exp(-q * q / (2 * sg * sg));
      const dq = A * g * (-7 * Math.sin(7 * q) - q / (sg * sg) * Math.cos(7 * q)) * 0.05;
      D[k] = clamp(Math.round(D[k] + dq * -0.36 * 127), 0, 255); D[k + 1] = clamp(Math.round(D[k + 1] + dq * Math.sign(da) * 127), 0, 255); D[k + 2] = Math.max(D[k + 2], Math.round(255 * A * g * smoothstep(3.5, 0.5, ds)));
    }) };
}
const WATER_MAIN = /* glsl */`
void main(){
  if (vDepth <= 0.) discard;
  vec3 toCam = cameraPosition - vWorld; float dist = length(toCam); vec3 V = toCam / dist;
  float pix = max(fwidth(vPixK.x / vPixK.y) * vPixK.z, 1e-5), foot = dist * pix / max(V.y, .03);
  vec2 p = vWorld.xz * uWat.y; float inv = 1. / (uWat.y * foot);
  float f1 = smoothstep(1., 4., 5. * inv), f2 = smoothstep(1., 4., 1.4 * inv), f3 = smoothstep(1., 4., .4 * inv);
  vec3 n1 = wnd(WR1 * p * .2 + uWind * uTime * .1), n2 = wnd(WR2 * p * .7 - uWind.yx * uTime * .17 + n1.x), n3 = wnd(WR3 * p * 2.6 + uWind * uTime * .33 + n2.x);
  // a still water is ruffled in patches by the air (cat's paws) and glassy between them
  float ruffle = .25 + .75 * smoothstep(.3, .7, wvn(vWorld.xz * .011 + uWind * uTime * .015) * .6 + wvn(WR1 * vWorld.xz * .031 - uWind * uTime * .02) * .4);
  vec2 slope = vec2(0.); float white = 0., rough = 0.;
  //W_FLOW_HERE
  slope += uWat.x * ruffle * ((n1.yz * WR1) * .024 * f1 + (n2.yz * WR2) * .05 * f2 + (n3.yz * WR3) * .05 * f3);
  rough += uWat.x * uWat.x * ruffle * ruffle * ((1. - f1) * .0004 + (1. - f2) * .0004 + (1. - f3) * .0002);
  vec3 N = normalize(vec3(-slope.x, 1., -slope.y));
  float ndv = clamp(dot(N, V), 0., 1.), ndl = max(dot(N, uSunDir), 0.);
  vec3 R = reflect(-V, N); R.y = abs(R.y) + .003; R = normalize(R);
  vec3 refl = wSky(R);
  vec4 stand = standRay(vWorld, R); refl = mix(refl, stand.rgb, stand.a * uSkyK.z);
  // the bank stands dark in the water at its foot
  refl *= 1. - uShoreK.z * (1. - smoothstep(0., uShoreK.w, vShore));
  float F = .05 + .95 * pow(1. - ndv, 3.4);
  float dk = 1. - exp(-max(vDepth, 0.) * uWat.z);
  vec3 body = mix(uShallow, uDeep, dk) * (uAmb * 1.05 + uKey * (.07 + .16 * ndl));
  vec3 col = mix(body, refl, F);
  // the key's light on the facets (its road on the water), where nothing standing is mirrored
  vec3 Hh = normalize(V + uSunDir); float ndh = max(dot(N, Hh), 0.), vdh = max(dot(V, Hh), 0.);
  float al = max(sqrt(.0004 + 2. * rough), .012), a2 = al * al, gd = ndh * ndh * (a2 - 1.) + 1.;
  vec3 spec = uKey * (uSkyK.w * min(a2 / (3.14159 * gd * gd) * (.02 + .98 * pow(clamp(1. - vdh, 0., 1.), 5.)) * .25 / max(vdh * vdh, .08) * ndl, 24.) * (1. - stand.a * uSkyK.z));
  // a thin broken fringe at the water's edge
  float fw = max(uShoreK.y, 2.2 * foot), fn = wvn(WR1 * vWorld.xz * .45 + uTime * .03) * .667 + wvn(WR2 * vWorld.xz * .9 + 3.1) * .333, fq = wvn(WR2 * vWorld.xz * 2.3 - uTime * .05);
  float fm = clamp(smoothstep(.34 * fw, .02 * fw, vShore + (fn - .5) * .35 * fw) * (.55 + .45 * fq), 0., 1.) * uShoreK.x * min(1., uShoreK.y / fw * 1.6);
  fm = max(fm, white);
  col += spec * (1. - fm);
  col = mix(col, uFoamCol * (uAmb * .9 + uKey * (.05 + .2 * ndl)), fm);
  gl_FragColor = vec4(col, smoothstep(0., uWat.w, vDepth) * mix(clamp(.3 + dk * 1.1, 0., 1.), 1., max(F, fm)));
  #include <fog_fragment>
}`;
// o: { hour (one garden's standing hour of makeHours), hours (all four, for the sky a water mirrors), amb, key (that garden's fill and key on water), stand (makeStandMap), time (the clock's
// uniform), detail, deep, shallow, foamColor, ripple, scale, clarity, edge, foam, foamWidth, bank, bankWidth, mirror, glint, windAngle,
// flow: { speed, lines, white, wake (a course sheet), wakeK, ring (a course sheet), ringSpeed, ringMode, from, to }, rises: [Vector4], churn: Vector4 }
export function makeWaterMaterial(o) {
  const h = o.hour, col = (c, d) => (c == null ? new THREE.Color(d) : c.isColor ? c : new THREE.Color(c)), detail = o.detail || 1, wa = o.windAngle ?? 0.9;
  const uniforms = {
    ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...o.stand.uniforms,
    uZen: { value: h.zen }, uHor: { value: h.hor }, uGlow: { value: h.glow }, uSunDir: { value: h.sun }, uSkyFog: { value: h.fog }, uCloud: { value: h.cloud }, uAmb: { value: o.amb }, uKey: { value: o.key },
    uZen4: { value: o.hours.map((x) => x.zen) }, uHor4: { value: o.hours.map((x) => x.hor) }, uGlow4: { value: o.hours.map((x) => x.glow) }, uSun4: { value: o.hours.map((x) => x.sun) }, uFog4: { value: o.hours.map((x) => x.fog) },
    uCloud4: { value: o.hours.map((x) => x.cloud) }, uCloudAmt4: { value: new THREE.Vector4(...o.hours.map((x) => x.cloudAmt)) },
    uDeep: { value: col(o.deep, '#1d3c40') }, uShallow: { value: col(o.shallow, '#8ab09a') }, uFoamCol: { value: col(o.foamColor, '#f2f7fa') },
    uSkyK: { value: new THREE.Vector4(h.cloudAmt, h.fogD, o.mirror ?? 1, o.glint ?? 1) }, uWat: { value: new THREE.Vector4(o.ripple ?? 1, o.scale ?? 1, o.clarity ?? 0.5, o.edge ?? 0.12) },
    uShoreK: { value: new THREE.Vector4(o.foam ?? 0.3, o.foamWidth ?? 1, o.bank ?? 0.5, o.bankWidth ?? 0.9) }, uWind: { value: new THREE.Vector2(Math.cos(wa), Math.sin(wa)) }, uTime: o.time,
  };
  const f = o.flow, rises = o.rises && o.rises.length ? o.rises : null;
  if (f) Object.assign(uniforms, { uWake: { value: f.wake.texture }, uRing: { value: f.ring.texture }, uWakeBox: { value: new THREE.Vector4(f.wake.m0, 1 / f.wake.len, f.wakeK ?? 0.5, f.from ?? -1e5) },
    uRingK: { value: new THREE.Vector4(f.ring.m0, 1 / f.ring.len, f.ringSpeed || 0, f.ringMode || 0) }, uFlow: { value: new THREE.Vector4(f.speed ?? 1.3, f.lines ?? 0.009, f.white ?? 1, f.to ?? 1e5) } });
  if (rises) uniforms.uRise = { value: rises };
  if (o.churn) uniforms.uChurn = { value: o.churn };
  const defines = { W_NEAR: clamp(Math.round(10 * detail), 5, 14), W_FAR: clamp(Math.round(12 * detail), 6, 16) }; if (f) defines.W_FLOW = 1; if (rises) defines.W_RISE = rises.length;
  const m = new THREE.ShaderMaterial({ uniforms, defines, vertexShader: WATER_VERT, fragmentShader: WATER_HEAD + (f ? WATER_FLOW_HEAD : '') + (rises ? WATER_RISE_HEAD : '') + (o.churn ? WATER_CHURN_HEAD : '') + WATER_MAIN.replace('//W_FLOW_HERE', (f ? WATER_FLOW : '') + (rises ? WATER_RISE : '') + (o.churn ? WATER_CHURN : '')), fog: true, transparent: true, depthWrite: false });
  // (the map's pictures are also plain properties of the material, so that the engine's clearing finds them)
  m.standH = uniforms.uStandH.value; m.standC = uniforms.uStandC.value; m.standL = uniforms.uStandL.value; m.standF = uniforms.uStandF.value; if (f) { m.wakeMap = f.wake.texture; m.ringMap = f.ring.texture; }
  return m;
}
// A ground sheet over a rectangle: heightAt(x, z), colorAt(x, z, y) -> [r, g, b, snow, sand]; keep(x, z) false drops a cell.
// o.rest (optional): a function to await after every fourth row of heights and every eighth row of cells, so that a large sheet is laid in short steps
export async function groundGeometry(o) {
  const nx = Math.max(1, Math.round((o.x1 - o.x0) / o.cell)), nz = Math.max(1, Math.round((o.z1 - o.z0) / o.cell));
  const row = nx + 1, nv = row * (nz + 1), P = new Float32Array(nv * 3), C = new Float32Array(nv * 3), G = new Float32Array(nv * 2), N = new Float32Array(nv * 3), I = new Uint32Array(nx * nz * 6);
  for (let j = 0, k = 0; j <= nz; j++) for (let i = 0; i <= nx; i++, k++) {
    const x = lerp(o.x0, o.x1, i / nx), z = lerp(o.z0, o.z1, j / nz), y = o.heightAt(x, z), c = o.colorAt(x, z, y);
    P[k * 3] = x; P[k * 3 + 1] = y; P[k * 3 + 2] = z; C[k * 3] = c[0]; C[k * 3 + 1] = c[1]; C[k * 3 + 2] = c[2]; G[k * 2] = c[3] || 0; G[k * 2 + 1] = c[4] || 0;
    if (o.rest && i === nx && j % 4 === 3) await o.rest();
  }
  if (o.rest) await o.rest();
  let nI = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    if (o.keep && !o.keep(lerp(o.x0, o.x1, (i + 0.5) / nx), lerp(o.z0, o.z1, (j + 0.5) / nz))) continue;
    const a = j * row + i, b = a + 1, c = a + row, d = c + 1;
    I[nI++] = a; I[nI++] = c; I[nI++] = b; I[nI++] = b; I[nI++] = c; I[nI++] = d;
    if (o.rest && i === nx - 1 && j % 8 === 7) await o.rest();
  }
  // each normal from the heights of the neighbours on the sheet's own grid
  const dx = (o.x1 - o.x0) / nx, dz = (o.z1 - o.z0) / nz;
  for (let j = 0, k = 0; j <= nz; j++) for (let i = 0; i <= nx; i++, k++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(nx, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(nz, j + 1);
    const gx = (P[(j * row + i1) * 3 + 1] - P[(j * row + i0) * 3 + 1]) / ((i1 - i0) * dx), gz = (P[(j1 * row + i) * 3 + 1] - P[(j0 * row + i) * 3 + 1]) / ((j1 - j0) * dz), l = Math.hypot(gx, 1, gz);
    N[k * 3] = -gx / l; N[k * 3 + 1] = 1 / l; N[k * 3 + 2] = -gz / l;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setAttribute('aG', new THREE.BufferAttribute(G, 2));
  g.setIndex(new THREE.BufferAttribute(I.slice(0, nI), 1)); if (o.rest) await o.rest();
  // (the sphere straight from the sheet's own numbers: the middle of its box, the farthest vertex)
  let y0 = 1e9, y1 = -1e9; for (let k = 1; k < nv * 3; k += 3) { const y = P[k]; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const cx = (o.x0 + o.x1) / 2, cy = (y0 + y1) / 2, cz = (o.z0 + o.z1) / 2; let r2 = 0;
  for (let k = 0; k < nv * 3; k += 3) { const ex = P[k] - cx, ey = P[k + 1] - cy, ez = P[k + 2] - cz, d = ex * ex + ey * ey + ez * ez; if (d > r2) r2 = d; }
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(cx, cy, cz), Math.sqrt(r2));
  return g;
}

// ---------------------------------------------------------------- the bark roof
// A broad roof of cypress bark over a W by D eave outline (W along X, W >= D): hipped, or hip-and-gable when o.gable
// (a share of the half depth) is given. yEave is the eave's upper edge, rise the height of the ridge over it. The eave is one level
// line all round: the corners lie flat (o.lift, a rise of the corners, is nought on every roof of this house).
// o.snowAt(x, z) -> 0..1 lays snow on it (local coordinates).
export function roofInto(b, cx, cz, W, D, yEave, rise, o = {}) {
  const hd = D / 2, hw = W / 2, g0 = o.gable ?? 0, lift = o.lift ?? 0, thick = o.thick ?? 0.62, snowAt = o.snowAt || (() => 0);
  const prof = (t) => rise * (0.42 * t + 0.58 * t * t);
  const tOf = (x, z) => { const tx = (hw - Math.abs(x)) / hd, ty = (hd - Math.abs(z)) / hd; return clamp(g0 > 0 && tx > g0 ? ty : Math.min(tx, ty), 0, 1); };
  const corner = (x, z) => Math.pow(Math.abs(x) / hw, 6) * Math.pow(Math.abs(z) / hd, 6);
  const H = lift ? (x, z) => yEave + prof(tOf(x, z)) + lift * corner(x, z) + 0.3 * snowAt(x, z) : (x, z) => yEave + prof(tOf(x, z)) + 0.3 * snowAt(x, z);
  const xs = [], zs = [], nx = Math.max(4, Math.round(W / 2.4)), nz = Math.max(4, Math.round(D / 2.4));
  for (let i = 0; i <= nx; i++) xs.push(-hw + W * i / nx);
  for (let j = 0; j <= nz; j++) zs.push(-hd + D * j / nz);
  const Lr = Math.max(0, hw - (g0 > 0 ? g0 : 1) * hd);
  if (g0 > 0) for (const sg of [-1, 1]) xs.push(sg * (Lr - 0.03), sg * (Lr + 0.03));
  xs.push(0); zs.push(0);
  const uniq = (a) => a.sort((p, q) => p - q).filter((v, i) => i === 0 || v - a[i - 1] > 0.02);
  const X = uniq(xs), Z = uniq(zs), bark = o.color || PAL.bark;
  const tone = (x, z) => 0.82 + 0.36 * (((Math.sin(x * 1.7 + z * 2.3 + cx) * 43758.5453) % 1 + 1) % 1);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const us = X.filter((x) => x * sx >= -1e-6).map((x) => (x + hw) / W), vs = Z.filter((z) => z * sz >= -1e-6).map((z) => (z + hd) / D);
    const sn = snowAt(sx * hw * 0.5, sz * hd * 0.5) > 0.5;
    b.surf(sn ? SURF.SNOW : SURF.BARK, !sn && o.noMoss ? 1 : 0);
    b.grid(us.length - 1, vs.length - 1, (u, v) => { const x = (u - 0.5) * W, z = (v - 0.5) * D; return [cx + x, H(x, z), cz + z]; }, {
      us, vs, flip: true,
      uv: (u, v) => { const x = (u - 0.5) * W, z = (v - 0.5) * D, tx = (hw - Math.abs(x)) / hd, ty = (hd - Math.abs(z)) / hd; return [ty <= tx || (g0 > 0 && tx > g0) ? x : z, tOf(x, z) * hd * 1.25]; },
      color: (u, v) => { const x = (u - 0.5) * W, z = (v - 0.5) * D; return mix3(mul(bark, tone(x, z)), PAL.snow, snowAt(x, z)); },
    });
  }
  // the thick edge of the bark, layer on layer, and the dark boards under the eave
  const edge = (x0, z0, x1, z1) => {
    const n = Math.max(2, Math.round(Math.hypot(x1 - x0, z1 - z0) / 2.4));
    for (let i = 0; i < n; i++) {
      const ax = lerp(x0, x1, i / n), az = lerp(z0, z1, i / n), qx = lerp(x0, x1, (i + 1) / n), qz = lerp(z0, z1, (i + 1) / n);
      const ya = H(ax, az), yq = H(qx, qz), sa = snowAt(ax, az), sq = snowAt(qx, qz), ca = mul(bark, 0.72), cs = mix3(ca, PAL.snow, 0.5 * (sa + sq));
      b.surf(SURF.BARK, 1);
      b.quad([cx + ax, ya - thick - 0.3 * sa, cz + az], [cx + qx, yq - thick - 0.3 * sq, cz + qz], [cx + qx, yq - 0.3 * sq, cz + qz], [cx + ax, ya - 0.3 * sa, cz + az], [i * 2.4, 0, (i + 1) * 2.4, thick * 4], { cols: [ca, ca, ca, ca] });
      if (sa + sq > 0.2) { b.surf(SURF.SNOW); b.quad([cx + ax, ya - 0.3 * sa, cz + az], [cx + qx, yq - 0.3 * sq, cz + qz], [cx + qx, yq, cz + qz], [cx + ax, ya, cz + az], null, { cols: [cs, cs, cs, cs] }); }
    }
  };
  edge(-hw, hd, hw, hd); edge(hw, hd, hw, -hd); edge(hw, -hd, -hw, -hd); edge(-hw, -hd, -hw, hd);
  b.surf(SURF.TIMBER).col(PAL.timber, 0.5);
  b.grid(Math.max(2, Math.round(W / 6)), Math.max(2, Math.round(D / 6)), (u, v) => { const x = (u - 0.5) * W, z = (v - 0.5) * D; return [cx + x, yEave - thick + (lift ? lift * corner(x, z) : 0) + 0.02, cz + z]; }, { uv: (u, v) => [u * W, v * D * 6] });
  if (Lr > 0.5) {
    const yT = yEave + rise, sn = snowAt(0, 0);
    b.surf(sn > 0.5 ? SURF.SNOW : SURF.BARK, sn > 0.5 ? 0 : 1).col(mix3(mul(bark, 0.7), PAL.snow, sn));
    b.box(cx - Lr - 0.4, yT - 0.15, cz - 0.55, cx + Lr + 0.4, yT + 0.5, cz + 0.55);
    if (g0 > 0) {
      const zg = hd * (1 - g0), yg = yEave + prof(g0);
      b.surf(SURF.TIMBER).col(PAL.timberPale, 0.8);
      for (const sg of [-1, 1]) {
        const xg = cx + sg * (Lr + 0.08), a = [xg, yg, cz - sg * zg], q = [xg, yg, cz + sg * zg], top = [xg, yT - 0.1, cz];
        b.quad(a, q, top, top, [0, 0, zg * 2, yT - yg]);
      }
    }
  }
  return { H, Lr };
}

// ---------------------------------------------------------------- blinds, sleeves, curtains, rails
// Five graded colours from a to c: the edges of layered sleeves.
export const grade5 = (a, c) => [0, 1, 2, 3, 4].map((i) => mix3(a, c, i / 4));
// A sleeve's edge spilling from under a blind onto the boards: five graded bands of a half round, flat on the floor at y.
export function sleeveInto(b, x, y, z, r, set, ph) {
  b.surf(SURF.CLOTH).sway(0.025, ph);
  const seg = 7;
  for (let k = 0; k < 5; k++) {
    const r0 = r * (0.22 + 0.78 * k / 5), r1 = r * (0.22 + 0.78 * (k + 1) / 5), yk = y + 0.05 - 0.008 * k;
    b.col(set[4 - k]);
    for (let i = 0; i < seg; i++) {
      const a0 = Math.PI * i / seg, a1 = Math.PI * (i + 1) / seg;
      b.quad([x + Math.cos(a0) * r0, yk, z + Math.sin(a0) * r0 * 0.8], [x + Math.cos(a0) * r1, yk, z + Math.sin(a0) * r1 * 0.8],
        [x + Math.cos(a1) * r1, yk, z + Math.sin(a1) * r1 * 0.8], [x + Math.cos(a1) * r0, yk, z + Math.sin(a1) * r0 * 0.8], [a0, r0, a1, r1], { n: [0, 1, 0] });
    }
  }
  b.sway(0);
}
// One bay between two posts, dressed: the frame's +Z looks out, the bay runs from -w/2 to +w/2 at z 0, floor at yF, lintel at yT.
// o: { lamp 0..1, sets (sleeve colour sets), sleeves (chance), plain (no sleeves or curtain) }
export function bayInto(b, rng, w, yF, yT, o = {}) {
  const x0 = -w / 2 + 0.34, x1 = w / 2 - 0.34, low = rng() < (o.lowered ?? 0.62), y0 = yF + (low ? rng.range(0.3, 0.5) : rng.range(1.5, 2.9)), ph = rng.range(0, TAU);
  const sw = 0.12 * (yT - y0) / 5, lamp = (o.lamp || 0) * rng.range(0.55, 1), tone = rng.range(0.82, 1.12);
  b.surf(SURF.BLIND, lamp).sway(0, ph).col(PAL.blind, tone);
  b.quad([x0, y0, 0], [x1, y0, 0], [x1, yT, 0], [x0, yT, 0], [x0, y0, x1, yT], { sways: [sw, sw, 0, 0] });
  b.surf(SURF.CLOTH, lamp * 0.25).col(o.border || [0.05, 0.09, 0.07]);
  for (const [xa, xb] of [[x0, x0 + 0.22], [x1 - 0.22, x1]]) b.quad([xa, y0, 0.03], [xb, y0, 0.03], [xb, yT, 0.03], [xa, yT, 0.03], null, { sways: [sw, sw, 0, 0] });
  b.surf(SURF.BLIND).sway(0).col(PAL.blind, tone * 0.7);
  b.box(x0, yT - 0.3, -0.14, x1, yT, 0.14, { bottom: true });
  const out = { low, sleeves: [] };
  if (o.plain) return out;
  const set = rng.pick(o.sets);
  if (low && rng() < (o.sleeves ?? 0.5)) {
    const n = rng.int(1, 2);
    for (let i = 0; i < n; i++) { const sx = lerp(x0 + 0.9, x1 - 0.9, n === 1 ? rng.range(0.25, 0.75) : (i + rng.range(0.2, 0.8)) / n); sleeveInto(b, sx, yF, 0.06, rng.range(0.75, 1.05), set, rng.range(0, TAU)); out.sleeves.push(sx); }
  } else if (!low) {
    // a standing curtain a little way inside: two tones of one of the sets
    const cw = w * rng.range(0.5, 0.7), cx = rng.range(-0.15, 0.15) * w, top = yF + rng.range(1.9, 2.3), cs = 0.07;
    b.surf(SURF.CLOTH, lamp * 0.5).sway(0, ph + 1.3);
    b.quad([cx - cw / 2, yF + 0.12, -0.9], [cx + cw / 2, yF + 0.12, -0.9], [cx + cw / 2, top, -0.9], [cx - cw / 2, top, -0.9], null, { cols: [set[1], set[1], set[4], set[4]], sways: [cs, cs, 0, 0] });
    b.surf(SURF.TIMBER).sway(0).col(PAL.dark);
    b.beam([cx - cw / 2 - 0.1, top + 0.04, -0.9], [cx + cw / 2 + 0.1, top + 0.04, -0.9], 0.08, 0.08);
  }
  return out;
}
// A rail along a floor's edge from p to q (local x, z) at floor height y: three rails and their posts.
export function railInto(b, p, q, y, h = 1.0) {
  const L = Math.hypot(q[0] - p[0], q[1] - p[1]), n = Math.max(1, Math.round(L / 1.6));
  b.surf(SURF.TIMBER).col(PAL.timber, 0.9);
  const yq = q[2] ?? y, yp = p[2] ?? y;
  for (const [dy, t] of [[h, 0.2], [h * 0.55, 0.13], [0.16, 0.13]]) b.beam([p[0], yp + dy, p[1]], [q[0], yq + dy, q[1]], t, t);
  for (let i = 0; i <= n; i++) { const x = lerp(p[0], q[0], i / n), z = lerp(p[1], q[1], i / n), yy = lerp(yp, yq, i / n); b.box(x - 0.08, yy, z - 0.08, x + 0.08, yy + h + (i % 2 ? 0 : 0.12), z + 0.08, { top: i % 2 === 0 }); }
}

// ---------------------------------------------------------------- a hall on posts
// Built in the builder's frame: ground at y 0, the front on +Z, o.w wide between the post lines and o.d deep.
// o: { bays, floor, eave (lintel height), ridge, veranda, overhang, stair (width, 0 for none), open (count of open middle bays),
//      lamp 0..1 (lamps behind the blinds), sets (sleeve colour sets), snow 0..1, gable }
export function hallInto(b, rng, o) {
  const W = o.w, D = o.d, bays = o.bays, sp = W / bays, yF = o.floor ?? 1.6, yB = o.eave ?? 7.4, ridge = o.ridge ?? 14, ver = o.veranda ?? 2.6, ov = o.overhang ?? 4.6;
  const hw = W / 2, hd = D / 2, sideBays = Math.max(2, Math.round(D / sp)), ssp = D / sideBays, snow = o.snow || 0;
  const open0 = o.open ? Math.floor((bays - o.open) / 2) : -1, open1 = o.open ? open0 + o.open : -1;
  b.surf(SURF.TIMBER).col(PAL.timber, 0.95);
  // posts all round; the open bays of the front are one clear span (no post stands inside it)
  for (let i = 0; i <= bays; i++) for (const z of [hd, -hd]) { if (z > 0 && i > open0 && i < open1) continue; b.cyl(-hw + i * sp, -3.6, yB, z, 0.27, 8); }
  for (let j = 1; j < sideBays; j++) for (const x of [-hw, hw]) b.cyl(x, -3.6, yB, -hd + j * ssp, 0.27, 8);
  for (const z of [hd, -hd]) b.beam([-hw - 0.3, yB - 0.25, z], [hw + 0.3, yB - 0.25, z], 0.4, 0.5);
  for (const x of [hw, -hw]) b.beam([x, yB - 0.25, -hd], [x, yB - 0.25, hd], 0.4, 0.5);
  // the floor with its veranda all round, short posts under its edge, the dark core of the house
  b.surf(SURF.BOARDS).col(PAL.boards);
  b.box(-hw - ver, yF - 0.34, -hd - ver, hw + ver, yF, hd + ver, { bottom: true });
  b.surf(SURF.TIMBER).col(PAL.timber, 0.8);
  const nv = bays * 2;
  for (let i = 0; i <= nv; i++) { const x = lerp(-hw - ver + 0.3, hw + ver - 0.3, i / nv); for (const z of [hd + ver - 0.3, -hd - ver + 0.3]) b.cyl(x, -3.4, yF - 0.34, z, 0.16, 6); }
  for (let j = 1; j < sideBays * 2; j++) { const z = lerp(-hd - ver + 0.3, hd + ver - 0.3, j / (sideBays * 2)); for (const x of [hw + ver - 0.3, -hw - ver + 0.3]) b.cyl(x, -3.4, yF - 0.34, z, 0.16, 6); }
  if (!o.bare) { b.col(PAL.dark, 1.4); b.box(-hw + sp * 0.9, yF, -hd + ssp * 0.9, hw - sp * 0.9, yB - 0.1, hd - ssp * 0.9, { top: false }); }
  // the stair and the rails
  const sw = o.stair ?? sp * 2, zV = hd + ver, steps = 5;
  if (sw > 0) {
    b.surf(SURF.BOARDS).col(PAL.boards, 0.92);
    for (let k = 0; k < steps; k++) b.box(-sw / 2, -0.2, zV + k * 0.55, sw / 2, yF * (1 - (k + 1) / (steps + 1)), zV + (k + 1) * 0.55);
    b.surf(SURF.TIMBER).col(PAL.timber, 0.9);
    for (const sg of [-1, 1]) b.beam([sg * (sw / 2 + 0.1), yF + 0.5, zV], [sg * (sw / 2 + 0.1), 0.75, zV + steps * 0.55 + 0.3], 0.2, 0.2);
    railInto(b, [-hw - ver + 0.15, zV - 0.15], [-sw / 2 - 0.1, zV - 0.15], yF); railInto(b, [sw / 2 + 0.1, zV - 0.15], [hw + ver - 0.15, zV - 0.15], yF);
  } else railInto(b, [-hw - ver + 0.15, zV - 0.15], [hw + ver - 0.15, zV - 0.15], yF);
  railInto(b, [hw + ver - 0.15, zV - 0.15], [hw + ver - 0.15, -zV + 0.15], yF); railInto(b, [-hw - ver + 0.15, -zV + 0.15], [-hw - ver + 0.15, zV - 0.15], yF);
  railInto(b, [hw + ver - 0.15, -zV + 0.15], [-hw - ver + 0.15, -zV + 0.15], yF);
  // blinds, sleeves and curtains bay by bay: the front richly, the sides and the back plainly
  const dress = { lamp: o.lamp || 0, sets: o.sets, sleeves: o.sleeves, lowered: o.lowered }, front = [];
  for (let i = 0; i < bays && !o.bare; i++) {
    if (i >= open0 && i < open1) continue;
    b.tr(-hw + (i + 0.5) * sp, 0, hd, 0); const r = bayInto(b, rng, sp, yF, yB - 0.5, dress); b.pop();
    front.push({ x: -hw + (i + 0.5) * sp, low: r.low, sleeves: r.sleeves });
  }
  for (let i = 0; i < bays && !o.bare; i++) { b.tr(-hw + (i + 0.5) * sp, 0, -hd, Math.PI); bayInto(b, rng, sp, yF, yB - 0.5, { ...dress, plain: true }); b.pop(); }
  for (let j = 0; j < sideBays && !o.bare; j++) for (const sg of [-1, 1]) { b.tr(sg * hw, 0, -hd + (j + 0.5) * ssp, sg * Math.PI / 2); bayInto(b, rng, ssp, yF, yB - 0.5, { ...dress, sleeves: (o.sleeves ?? 0.5) * 0.5 }); b.pop(); }
  roofInto(b, 0, 0, W + 2 * ov, D + 2 * ov, yB + 0.62, ridge - yB - 0.62, { gable: o.gable ?? 0.42, snowAt: snow ? () => snow : null, noMoss: snow > 0 });
  return { w: W, d: D, sp, yF, yB, ridge, front, open: o.open ? [-hw + open0 * sp, -hw + open1 * sp] : null, stairFoot: b.world([0, 0, zV + steps * 0.55 + 1.2]) };
}

// ---------------------------------------------------------------- an open roofed gallery, a roofed stair, an arched bridge
// From p0 to p1 (world x, z), in the builder's frame. o: { y0, y1 (floor heights at the ends), arch (rise), archSpan [m, m],
// width, eave (lintel above the floor), rise (roof), post (how thick the posts are, 1 as a rule), roof (false: a plain bridge), roofFrom (metres), ground(x, z) -> y of the
// ground under a post or null over water, snow 0..1, step (post spacing) }
export function galleryInto(b, p0, p1, o = {}) {
  const dx = p1[0] - p0[0], dz = p1[1] - p0[1], L = Math.hypot(dx, dz), w = o.width ?? 3.6, hw = w / 2, eave = o.eave ?? 3.7, rise = o.rise ?? 1.25;
  const n = Math.max(1, Math.round(L / (o.step ?? 4.2))), y0 = o.y0 ?? 1.6, y1 = o.y1 ?? y0, as = o.archSpan || [0, L], snow = o.snow || 0, roofFrom = o.roofFrom ?? 0, pk = o.post ?? 1;
  // an arched floor is one clean arc from end to end (no level landing, no turn of the curve)
  const fy = (x) => { const t = clamp((x - as[0]) / (as[1] - as[0]), 0, 1) * 2 - 1; return lerp(y0, y1, x / L) + (o.arch ? o.arch * (1 - t * t) : 0); };
  b.tr(p0[0], 0, p0[1], Math.atan2(-dz, dx));
  const sub = o.arch ? 3 : 1, m = n * sub;
  for (let i = 0; i < m; i++) {
    const xa = L * i / m, xb = L * (i + 1) / m, ya = fy(xa), yb = fy(xb);
    b.surf(SURF.BOARDS).col(PAL.boards);
    b.quad([xa, ya, hw], [xb, yb, hw], [xb, yb, -hw], [xa, ya, -hw], [xa, -hw, xb, hw]);
    b.surf(SURF.TIMBER, o.caustic ? 1 : 0).col(PAL.timber, 0.55);
    b.quad([xa, ya - 0.32, -hw], [xb, yb - 0.32, -hw], [xb, yb - 0.32, hw], [xa, ya - 0.32, hw], [xa, -hw, xb, hw]);
    b.surf(SURF.TIMBER).col(PAL.timber, 0.85);
    b.quad([xa, ya - 0.32, hw], [xb, yb - 0.32, hw], [xb, yb, hw], [xa, ya, hw], [xa, 0, xb, 0.32]);
    b.quad([xb, yb - 0.32, -hw], [xa, ya - 0.32, -hw], [xa, ya, -hw], [xb, yb, -hw], [xa, 0, xb, 0.32]);
    // an arched floor takes its rails piece by piece
    if (o.arch) for (const sg of [-1, 1]) railInto(b, [xa, sg * (hw - 0.12), ya], [xb, sg * (hw - 0.12), yb], 0, o.roof === false ? 1.05 : 0.9);
  }
  // a straight floor takes each rail in one run from end to end
  if (!o.arch) for (const sg of [-1, 1]) railInto(b, [0, sg * (hw - 0.12), y0], [L, sg * (hw - 0.12), y1], 0, o.roof === false ? 1.05 : 0.9);
  const roofed = o.roof !== false;
  for (let i = 0; i <= n; i++) {
    const x = L * i / n, y = fy(x);
    b.surf(SURF.TIMBER).col(PAL.timber, 0.95);
    for (const sg of [-1, 1]) {
      const wp = b.world([x, 0, sg * (hw - 0.05)]), g = o.ground ? o.ground(wp[0], wp[2]) : 0;
      if (g !== null && g !== undefined) b.cyl(x, g - 0.4, y - 0.3, sg * (hw - 0.05), 0.24 * pk, 8);
      if (roofed && x >= roofFrom - 0.01) b.cyl(x, y, y + eave, sg * (hw - 0.05), 0.2 * pk, 8);
    }
    if (roofed && x >= roofFrom - 0.01) b.beam([x, y + eave - 0.1, -hw], [x, y + eave - 0.1, hw], 0.22 * pk, 0.26 * pk);
  }
  if (roofed) {
    // a low bark roof that follows the floor: three courses a side, a thick edge, boards beneath
    const ovh = o.overhang ?? 1.5, prof = [[hw + ovh, 0], [hw * 0.55 + ovh * 0.4, rise * 0.34], [0, rise]];
    const mr = Math.max(1, Math.round((L - roofFrom) / 2.6)), xr = (i) => roofFrom - 0.8 + (L - roofFrom + 1.6) * i / mr;
    for (let i = 0; i < mr; i++) {
      const xa = xr(i), xb = xr(i + 1), ya = fy(clamp(xa, 0, L)) + eave + 0.5, yb = fy(clamp(xb, 0, L)) + eave + 0.5;
      for (const sg of [-1, 1]) {
        const snowK = o.snowSide === undefined || o.snowSide === sg ? snow : 0, bark = mix3(PAL.bark, PAL.snow, snowK);
        b.surf(snowK > 0.5 ? SURF.SNOW : SURF.BARK, 0).col(bark, 0.9 + 0.2 * ((i * 7 + (sg > 0 ? 3 : 0)) % 5) / 5);
        for (let k = 0; k < 2; k++) {
          const a = [xa, ya + prof[k][1], sg * prof[k][0]], q = [xb, yb + prof[k][1], sg * prof[k][0]], c = [xb, yb + prof[k + 1][1], sg * prof[k + 1][0]], d = [xa, ya + prof[k + 1][1], sg * prof[k + 1][0]];
          if (sg > 0) b.quad(a, q, c, d, [xa, k * 1.4, xb, (k + 1) * 1.4]); else b.quad(q, a, d, c, [xa, k * 1.4, xb, (k + 1) * 1.4]);
        }
        b.surf(SURF.BARK, 1).col(mix3(mul(PAL.bark, 0.7), PAL.snow, snowK * 0.6));
        const e0 = [xa, ya - 0.42, sg * prof[0][0]], e1 = [xb, yb - 0.42, sg * prof[0][0]], e2 = [xb, yb, sg * prof[0][0]], e3 = [xa, ya, sg * prof[0][0]];
        if (sg > 0) b.quad(e0, e1, e2, e3, [xa, 0, xb, 1.6]); else b.quad(e1, e0, e3, e2, [xa, 0, xb, 1.6]);
        b.surf(SURF.TIMBER).col(PAL.timber, 0.5);
        const u0 = [xa, ya - 0.42, sg * prof[0][0]], u1 = [xb, yb - 0.42, sg * prof[0][0]], u2 = [xb, yb - 0.3 + rise * 0.5, 0], u3 = [xa, ya - 0.3 + rise * 0.5, 0];
        if (sg > 0) b.quad(u1, u0, u3, u2, [xa, 0, xb, 4]); else b.quad(u0, u1, u2, u3, [xa, 0, xb, 4]);
      }
    }
    b.surf(SURF.TIMBER).col(PAL.timberPale, 0.7);
    for (const [x, sg] of [[xr(0), -1], [xr(mr), 1]]) {
      const y = fy(clamp(x, 0, L)) + eave + 0.5, a = [x, y - 0.42, -sg * prof[0][0]], q = [x, y - 0.42, sg * prof[0][0]], t = [x, y + rise, 0];
      b.quad(a, q, t, t, [0, 0, w, rise]);
    }
  }
  b.pop();
  return { L, n, fy, at: (x, z = 0, dy = 0) => { const k = Math.atan2(-dz, dx), c = Math.cos(k), s = Math.sin(k); return [p0[0] + x * c + z * s, fy(clamp(x, 0, L)) + dy, p0[1] - x * s + z * c]; } };
}

// ---------------------------------------------------------------- the crossing
export const CROSS = { post: 11, deck: 11.9, deckY: 7.0, lintel: 9.5, eave: 15, eaveY: 10, peak: 16, stub: 25.9, stubY: 2.6, lowAtPosts: 5.2, lowAtCentre: 6.4 };
// the underside of the deck: a shallow vault, lowest over the four corners where the lane and the brook pass
export const crossUnder = (x, z) => CROSS.lowAtPosts + (CROSS.lowAtCentre - CROSS.lowAtPosts) * clamp(1 - (x * x + z * z) / (2 * CROSS.post * CROSS.post), 0, 1);
// The roofed bridge where the four galleries meet, built about the frame's origin with the water at y 0 and the courts at
// groundY. o: { groundY, snowAt(x, z), sets, ground(x, z) for the stair posts }
export async function crossingInto(b, rng, o = {}) {
  const C = CROSS, R = C.deck, gy = o.groundY ?? 1, rest = o.yield || (() => Promise.resolve());
  // four clusters of round posts on the axes, braced
  for (const [px, pz] of [[C.post, 0], [-C.post, 0], [0, C.post], [0, -C.post]]) {
    b.surf(SURF.TIMBER).col(PAL.timber, 0.95);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(px + sx * 1.15, -1.6, C.lintel, pz + sz * 1.15, 0.33, 10);
    b.col(PAL.timber, 0.8);
    for (const y of [3.4, C.lowAtPosts - 0.3]) for (const s of [-1, 1]) {
      b.beam([px - 1.5, y, pz + s * 1.15], [px + 1.5, y, pz + s * 1.15], 0.26, 0.34); b.beam([px + s * 1.15, y, pz - 1.5], [px + s * 1.15, y, pz + 1.5], 0.26, 0.34);
    }
  }
  await rest();
  // The deck: boards above. Beneath, the thing to see from the water: a coffered ceiling of pale old wood, eleven squares of 2.2 m each way
  // between darker beams, following the shallow vault; panels and beams take the moving light off the water (the material's water light).
  b.surf(SURF.BOARDS).col(PAL.boards);
  b.quad([-R, C.deckY, R], [R, C.deckY, R], [R, C.deckY, -R], [-R, C.deckY, -R], [-R, -R, R, R]);
  b.surf(SURF.TIMBER, 1).col(PAL.timberPale, 1.05);
  b.grid(11, 11, (u, v) => { const x = (u - 0.5) * 2 * R, z = (v - 0.5) * 2 * R; return [x, crossUnder(x, z), z]; }, { uv: (u, v) => [u * 2 * R, v * 2 * R * 5] });
  for (const sg of [-1, 1]) for (let i = 0; i < 12; i++) {
    const t0 = -R + 2 * R * i / 12, t1 = -R + 2 * R * (i + 1) / 12;
    b.surf(SURF.TIMBER).col(PAL.timber, 0.85);
    const zq = (a, q) => (sg > 0 ? b.quad(a, q, [q[0], C.deckY, q[2]], [a[0], C.deckY, a[2]], [t0, 0, t1, 1.6]) : b.quad(q, a, [a[0], C.deckY, a[2]], [q[0], C.deckY, q[2]], [t0, 0, t1, 1.6]));
    zq([t0, crossUnder(t0, R), sg * R], [t1, crossUnder(t1, R), sg * R]);
    zq([sg * R, crossUnder(R, t1), t1], [sg * R, crossUnder(R, t0), t0]);
  }
  b.surf(SURF.TIMBER, 1).col(PAL.timber, 0.5);
  for (let k = 0; k <= 11; k++) {
    const c = -R + 2 * R * k / 11, edge = k === 0 || k === 11, w = edge ? 0.5 : 0.3, h = edge ? 0.6 : 0.45;
    for (let i = 0; i < 6; i++) {
      const t0 = -R + 2 * R * i / 6, t1 = -R + 2 * R * (i + 1) / 6;
      b.beam([t0, crossUnder(t0, c) - h / 2 + 0.02, c], [t1, crossUnder(t1, c) - h / 2 + 0.02, c], w, h);
      b.beam([c, crossUnder(c, t0) - h / 2 - 0.03, t0], [c, crossUnder(c, t1) - h / 2 - 0.03, t1], w, h);
    }
    if (k % 4 === 3) await rest();
  }
  // In each of the four clusters of posts a small boarded floor 2.2 m over the water, and on each of its four sides a half-rolled blind
  // hanging from the upper brace with a sleeve's edge on the boards under it (who sits there is never seen). On a stream of its own.
  if (o.piers) {
    const g = o.piers, yF = 2.2, yT = C.lowAtPosts - 0.5;
    for (const [px, pz] of [[C.post, 0], [-C.post, 0], [0, C.post], [0, -C.post]]) {
      b.surf(SURF.BOARDS).sway(0).col(PAL.boards, 0.95); b.box(px - 1.5, yF - 0.2, pz - 1.5, px + 1.5, yF, pz + 1.5, { bottom: true });
      for (let f = 0; f < 4; f++) {
        const y0 = yF + g.range(1.0, 1.6), ph = g.range(0, TAU), tone = g.range(0.85, 1.1), set = g.pick(o.sets), sw = 0.05;
        b.tr(px, 0, pz, f * Math.PI / 2); b.tr(0, 0, 1.15, 0);
        b.surf(SURF.BLIND, 0.22).sway(0, ph).col(PAL.blind, tone);
        b.quad([-0.92, y0, 0], [0.92, y0, 0], [0.92, yT, 0], [-0.92, yT, 0], [-0.92, y0, 0.92, yT], { sways: [sw, sw, 0, 0] });
        b.surf(SURF.BLIND).sway(sw, ph).col(PAL.blind, tone * 0.7); b.box(-0.96, y0 - 0.2, -0.1, 0.96, y0, 0.1, { bottom: true });
        sleeveInto(b, g.range(-0.4, 0.4), yF, 0.1, g.range(0.5, 0.68), set, g.range(0, TAU));
        b.pop(); b.pop();
      }
    }
    await rest();
  }
  await rest();
  // corner posts and lintels above the deck; rails with a mouth for each gallery
  b.surf(SURF.TIMBER).col(PAL.timber, 0.95);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.cyl(sx * (R - 0.4), C.deckY, C.lintel, sz * (R - 0.4), 0.3, 10);
  for (const s of [-1, 1]) { b.beam([-R, C.lintel - 0.25, s * (R - 0.4)], [R, C.lintel - 0.25, s * (R - 0.4)], 0.4, 0.5); b.beam([s * (R - 0.4), C.lintel - 0.25, -R], [s * (R - 0.4), C.lintel - 0.25, R], 0.4, 0.5); }
  const mouth = 2.2, e = R - 0.2;
  for (const s of [-1, 1]) for (const t of [-1, 1]) {
    railInto(b, [t * e, s * e], [t * mouth, s * e], C.deckY, 1.05); railInto(b, [s * e, t * e], [s * e, t * mouth], C.deckY, 1.05);
  }
  // blinds in the two bays that face up the brook (north-east), sleeves beneath them
  const bw = R - 0.4 - 1.5, dress = { lamp: o.lamp ?? 0.35, sets: o.sets, sleeves: 1, lowered: 1 };
  b.tr(1.5 + bw / 2, 0, -(R - 0.4), Math.PI); bayInto(b, rng, bw, C.deckY, C.lintel - 0.5, dress); b.pop();
  b.tr(R - 0.4, 0, -(1.5 + bw / 2), Math.PI / 2); bayInto(b, rng, bw, C.deckY, C.lintel - 0.5, dress); b.pop();
  await rest();
  // one broad roof
  roofInto(b, 0, 0, C.eave * 2, C.eave * 2, C.eaveY, C.peak - C.eaveY, { thick: 0.8, snowAt: o.snowAt });
  b.surf(SURF.BARK, 1).col(PAL.bark, 0.7); b.cyl(0, C.peak - 0.2, C.peak + 1.3, 0, 0.5, 8, 0.12, true);
  await rest();
  // four roofed stairs down to the four galleries
  const stubs = [];
  for (const [ax, az] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const sn = o.snowAt ? o.snowAt(ax * 22 - (az !== 0 ? 6 : 0), az * 22 - (ax !== 0 ? 6 : 0)) : 0;
    stubs.push(galleryInto(b, [ax * R, az * R], [ax * C.stub, az * C.stub], { y0: C.deckY, y1: C.stubY, eave: 3.0, rise: 1.0, roofFrom: C.eave + 0.6 - R, step: 3.5, snow: sn > 0.5 ? 0.9 : 0,
      ground: (x, z) => (Math.max(Math.abs(x), Math.abs(z)) > C.post + 4 ? (o.ground ? o.ground(x, z) : gy) : null) }));
    await rest();
  }
  return { stubs };
}

// ---------------------------------------------------------------- small plain figures (never a face)
const SKIN = lin('#c9a184'), HAIR = [0.02, 0.018, 0.02];
// A child standing at the frame's origin, facing +Z. o: { h, robe, hem, kind: 'girl' | 'page', wings (colour), carry: 'vase' | 'box' | 'pole',
// carryCol, sprig (colour), lean (radians, forward) }
export function figureInto(b, rng, x, y, z, yaw, o = {}) {
  const h = o.h ?? 1.8, ph = rng.range(0, TAU), lean = o.lean || 0, lz = (yy) => Math.sin(lean) * yy;
  b.tr(x, y, z, yaw);
  b.surf(SURF.CLOTH).sway(0.012, ph);
  if (o.kind === 'page') {
    b.col(o.hem || PAL.plaster, 0.9); for (const sx of [-1, 1]) b.cyl(sx * 0.07 * h, 0, 0.3 * h, lz(0.15 * h), 0.05 * h, 6, 0.06 * h);
    b.col(o.robe); b.cyl(0, 0.24 * h, 0.7 * h, lz(0.45 * h), 0.2 * h, 8, 0.1 * h);
  } else {
    b.col(o.hem || o.robe, 0.9); b.cyl(0, 0, 0.13 * h, 0, 0.27 * h, 8, 0.25 * h);
    b.col(o.robe); b.cyl(0, 0.13 * h, 0.7 * h, lz(0.4 * h), 0.25 * h, 8, 0.1 * h);
  }
  // sleeves: two short hanging cones
  for (const sx of [-1, 1]) b.cyl(sx * 0.15 * h, 0.4 * h, 0.66 * h, lz(0.55 * h) + (o.carry ? 0.08 * h : 0), 0.085 * h, 6, 0.05 * h);
  b.surf(SURF.PLASTER).sway(0).col(SKIN);
  b.cyl(0, 0.7 * h, 0.8 * h, lz(0.75 * h), 0.07 * h, 8, 0.095 * h);
  b.col(HAIR); b.cyl(0, 0.8 * h, 0.9 * h, lz(0.85 * h), 0.098 * h, 8, 0.05 * h, true);
  if (o.kind === 'page') {
    // hair bound in a loop at each ear
    for (const sx of [-1, 1]) b.box(sx * 0.1 * h - 0.03 * h, 0.72 * h, lz(0.75 * h) - 0.03 * h, sx * 0.1 * h + 0.03 * h, 0.82 * h, lz(0.75 * h) + 0.03 * h);
  } else {
    // long hair down the back
    b.surf(SURF.CLOTH).sway(0.02, ph + 2).col(HAIR);
    b.quad([0.09 * h, 0.22 * h, -0.2 * h], [-0.09 * h, 0.22 * h, -0.2 * h], [-0.085 * h, 0.86 * h, lz(0.85 * h) - 0.09 * h], [0.085 * h, 0.86 * h, lz(0.85 * h) - 0.09 * h]);
  }
  if (o.wings) {
    b.surf(SURF.CLOTH).sway(0.05, ph + 4).col(o.wings);
    for (const sx of [-1, 1]) b.quad([sx * 0.05 * h, 0.5 * h, -0.14 * h], [sx * 0.36 * h, 0.44 * h, -0.2 * h], [sx * 0.4 * h, 0.76 * h, -0.22 * h], [sx * 0.05 * h, 0.66 * h, -0.14 * h]);
  }
  if (o.carry === 'vase') {
    b.surf(SURF.GILT).sway(0).col(o.carryCol); b.cyl(0, 0.46 * h, 0.6 * h, 0.2 * h, 0.035 * h, 6, 0.05 * h);
    b.surf(SURF.CLOTH).sway(0.03, ph + 1).col(o.sprig);
    for (let k = 0; k < 3; k++) { const a = k * 2.1 + ph, r = 0.11 * h; b.quad([Math.cos(a) * r, 0.58 * h, 0.2 * h + Math.sin(a) * r], [-Math.cos(a) * r, 0.58 * h, 0.2 * h - Math.sin(a) * r], [-Math.cos(a) * r * 1.3, 0.84 * h, 0.2 * h - Math.sin(a) * r * 1.3], [Math.cos(a) * r * 1.3, 0.84 * h, 0.2 * h + Math.sin(a) * r * 1.3]); }
  } else if (o.carry === 'box') {
    b.surf(SURF.GILT).sway(0).col(o.carryCol); b.box(-0.11 * h, 0.46 * h, 0.12 * h, 0.11 * h, 0.55 * h, 0.3 * h);
    b.surf(SURF.CLOTH).sway(0.02, ph).col(o.sprig); b.quad([-0.1 * h, 0.56 * h, 0.13 * h], [0.1 * h, 0.56 * h, 0.13 * h], [0.12 * h, 0.6 * h, 0.3 * h], [-0.12 * h, 0.6 * h, 0.3 * h]);
  } else if (o.carry === 'pole') {
    b.surf(SURF.TIMBER).sway(0).col(PAL.timberPale); b.beam([o.poleSide * 0.2 * h, 1.25 * h, 0.1 * h], [o.poleSide * 0.75 * h, -0.9 * h, -0.5 * h], 0.07, 0.07);
  }
  b.sway(0).pop();
}

// ---------------------------------------------------------------- the two boats, the water birds
// A boat in the Chinese manner, bow toward +X, waterline at y 0. o: { head: 'dragon' | 'bird', robes [4 colours], sets, band (hull colour), fire }
export function boatInto(b, rng, o = {}) {
  const L = 13, B = 3.3, half = (u) => B / 2 * Math.pow(Math.max(1 - Math.pow(Math.abs(u * 2 - 1), 2.4), 0), 0.55), sheer = (u) => 0.75 + 0.75 * Math.pow(Math.abs(u * 2 - 1), 2.2);
  const band = o.band || lin('#1f5a5a'), dark = [0.05, 0.035, 0.03], gilt = PAL.gilt;
  b.surf(SURF.TIMBER).sway(0);
  for (const sg of [-1, 1]) b.grid(12, 3, (u, v) => [(u - 0.5) * L, lerp(-0.45, sheer(u), v), sg * half(u) * (0.45 + 0.55 * Math.sqrt(v))], { flip: sg < 0, uv: (u, v) => [u * L, v * 0.4],
    color: (u, v) => (v < 0.4 ? dark : v < 0.8 ? band : mul(gilt, 0.8)) });
  b.surf(SURF.BOARDS).col(PAL.boards, 1.1);
  b.grid(12, 1, (u, v) => [(u - 0.5) * L, 0.42 + 0.5 * Math.pow(Math.abs(u * 2 - 1), 2.2), (v * 2 - 1) * half(u) * 0.94], { flip: true, uv: (u, v) => [u * L, v * B] });
  b.surf(SURF.GILT).col(gilt, 0.9);
  for (const sg of [-1, 1]) for (let i = 1; i < 11; i++) { const u0 = i / 12, u1 = (i + 1) / 12; b.beam([(u0 - 0.5) * L, sheer(u0) + 0.05, sg * half(u0)], [(u1 - 0.5) * L, sheer(u1) + 0.05, sg * half(u1)], 0.12, 0.12); }
  // the carved prow
  const bx = L / 2;
  if (o.head === 'dragon') {
    const green = lin('#2f7a5a'), neck = [[bx - 1.0, 0.9, 0], [bx + 0.1, 1.9, 0], [bx + 0.5, 3.0, 0], [bx + 0.9, 3.75, 0], [bx + 1.7, 3.95, 0]];
    b.surf(SURF.GILT).tube(neck, [0.46, 0.4, 0.33, 0.32, 0.36], 8, { cols: [green, green, mix3(green, gilt, 0.3), mix3(green, gilt, 0.6), gilt] });
    b.col(gilt); b.box(bx + 1.4, 3.6, -0.34, bx + 2.7, 4.2, 0.34, { bottom: true }); b.col(gilt, 0.75); b.box(bx + 1.6, 3.3, -0.26, bx + 2.55, 3.52, 0.26, { bottom: true });
    b.col(lin('#b8231c')); b.box(bx + 1.7, 3.5, -0.2, bx + 2.5, 3.62, 0.2);
    for (const sg of [-1, 1]) { b.col(gilt, 1.1); b.tube([[bx + 1.6, 4.15, sg * 0.22], [bx + 1.1, 4.7, sg * 0.34], [bx + 0.8, 5.3, sg * 0.3]], [0.09, 0.06, 0.02], 5); b.col(dark); b.box(bx + 2.2, 3.95, sg * 0.34, bx + 2.4, 4.1, sg * 0.36); }
    b.surf(SURF.CLOTH).sway(0.06, 1.3).col(lin('#b8231c'));
    for (let i = 0; i < 4; i++) { const p = neck[i], q = neck[i + 1]; b.quad([p[0] - 0.3, p[1] + 0.1, 0], [q[0] - 0.3, q[1] + 0.1, 0], [q[0] - 0.85, q[1] + 0.45, 0], [p[0] - 0.8, p[1] + 0.5, 0]); }
    b.surf(SURF.GILT).sway(0).tube([[-bx + 0.6, 0.9, 0], [-bx - 0.3, 1.7, 0], [-bx - 0.9, 2.9, 0], [-bx - 0.6, 3.7, 0]], [0.36, 0.3, 0.2, 0.06], 8, { cols: [green, green, mix3(green, gilt, 0.5), gilt] });
  } else {
    const white = lin('#e9e4d6'), neck = [[bx - 1.0, 0.9, 0], [bx + 0.35, 1.8, 0], [bx + 0.3, 2.9, 0], [bx + 0.75, 3.7, 0], [bx + 1.3, 3.85, 0], [bx + 1.75, 3.75, 0]];
    b.surf(SURF.GILT).tube(neck, [0.4, 0.3, 0.2, 0.2, 0.27, 0.2], 8, { cols: [white, white, white, white, mix3(white, gilt, 0.4), white] });
    b.col(gilt).tube([[bx + 1.8, 3.74, 0], [bx + 2.7, 3.5, 0]], [0.11, 0.02], 6);
    b.surf(SURF.CLOTH).sway(0.07, 0.4).col(lin('#2f6a8a'));
    b.quad([bx + 1.3, 4.05, 0], [bx + 0.9, 4.1, 0], [bx + 0.3, 4.8, 0], [bx + 0.9, 4.5, 0]);
    // folded wings along the bow, a fanned tail at the stern
    b.col(white, 0.95);
    for (const sg of [-1, 1]) b.quad([bx - 0.6, 1.0, sg * 0.75], [bx - 3.4, 1.0, sg * 1.5], [bx - 3.8, 2.3, sg * 1.75], [bx - 1.0, 1.9, sg * 0.85]);
    for (let k = -2; k <= 2; k++) b.quad([-bx + 0.5, 0.95, k * 0.2], [-bx + 0.5, 0.95, k * 0.2 + 0.2], [-bx - 1.3, 3.0 - Math.abs(k) * 0.3, k * 0.55 + 0.3], [-bx - 1.3, 3.0 - Math.abs(k) * 0.3, k * 0.55 - 0.1], null, { cols: [white, white, mix3(white, gilt, 0.5), mix3(white, gilt, 0.5)] });
  }
  // a curtained place amidships (the passengers are never seen), and four pages with their poles
  const set = rng.pick(o.sets), dk = 0.47;
  b.surf(SURF.TIMBER).sway(0).col(PAL.dark, 1.5);
  for (const sx of [-1.7, 1.7]) for (const sz of [-1, 1]) b.cyl(sx, dk, dk + 2.0, sz * 1.05, 0.05, 5);
  b.surf(SURF.CLOTH).sway(0, 2.2);
  const cs = 0.07, pan = (a, q) => b.quad([a[0], dk + 0.1, a[1]], [q[0], dk + 0.1, q[1]], [q[0], dk + 1.95, q[1]], [a[0], dk + 1.95, a[1]], null, { cols: [set[0], set[0], set[3], set[3]], sways: [cs, cs, 0, 0] });
  pan([-1.7, 1.05], [1.7, 1.05]); pan([1.7, -1.05], [-1.7, -1.05]); pan([-1.7, -1.05], [-1.7, 1.05]);
  sleeveInto(b, 0.4, dk - 0.02, 1.08, 0.6, set, 1.7); sleeveInto(b, -0.6, dk - 0.02, 1.08, 0.55, rng.pick(o.sets), 0.6);
  const robes = o.robes, seats = [[4.3, 0.55, 1], [3.1, -0.6, -1], [-3.4, 0.7, 1], [-4.5, -0.55, -1]];
  seats.forEach(([x, z, sg], i) => figureInto(b, rng, x, 0.5 + 0.5 * Math.pow(Math.abs(x / L * 2), 2.2), z, sg > 0 ? 0.5 : Math.PI - 0.5, { kind: 'page', h: 1.75, robe: robes[i % robes.length], hem: PAL.plaster, carry: 'pole', poleSide: 1, lean: 0.12 }));
  let fire = null;
  if (o.fire) { b.surf(SURF.TIMBER).col(PAL.iron); b.cyl(bx - 2.0, 0.6, 2.2, 0, 0.05, 5); b.cyl(bx - 2.0, 2.2, 2.6, 0, 0.12, 6, 0.3); fire = [bx - 2.0, 2.7, 0]; }
  return { L, B, fire };
}
// A paired water bird afloat, bill toward +X: the drake bright, the duck plain.
export function duckInto(b, male) {
  const body = male ? lin('#b5622a') : lin('#7a6a58'), back = male ? lin('#3a2f4a') : lin('#5e5246'), head = male ? lin('#1f4a3a') : lin('#6a5a4a');
  b.surf(SURF.PLASTER).sway(0);
  b.grid(8, 5, (u, v) => { const a = u * TAU, t = v * Math.PI, r = Math.sin(t); return [-Math.cos(t) * 0.42 - 0.04, 0.12 + Math.sin(a) * r * 0.17 * (Math.sin(a) > 0 ? 1.15 : 0.6), Math.cos(a) * r * 0.22]; },
    { flip: true, color: (u, v) => (Math.sin(u * TAU) > 0.5 ? back : v > 0.75 ? mix3(body, PAL.plaster, male ? 0.5 : 0.15) : body) });
  b.tube([[0.3, 0.2, 0], [0.37, 0.4, 0], [0.47, 0.47, 0]], [0.075, 0.062, 0.085], 6, { cols: [body, head, head] });
  b.col(male ? lin('#c8402a') : lin('#4a4038')).tube([[0.52, 0.46, 0], [0.66, 0.43, 0]], [0.04, 0.012], 5);
  if (male) { b.col(PAL.plaster); for (const sg of [-1, 1]) b.quad([0.4, 0.44, sg * 0.088], [0.5, 0.46, sg * 0.088], [0.5, 0.52, sg * 0.07], [0.4, 0.5, sg * 0.07]); b.col(lin('#d8862a')); for (const sg of [-1, 1]) b.quad([-0.3, 0.2, sg * 0.1], [-0.05, 0.22, sg * 0.14], [-0.12, 0.42, sg * 0.05], [-0.3, 0.3, sg * 0.06]); }
}

// ---------------------------------------------------------------- what the gardens share
// the sleeve sets: the edges of layered robes, five graded colours each; two per quarter (which one is the visit's)
export const SETS = {
  spring: [grade5(lin('#d24a6a'), lin('#5a2a6a')), grade5(lin('#f3c9d2'), lin('#7a2a4a'))],
  summer: [grade5(lin('#a8c8e8'), lin('#8a1c28')), grade5(lin('#dfe8c8'), lin('#2f6a5a'))],
  autumn: [grade5(lin('#e0aa3a'), lin('#7a2a1c')), grade5(lin('#c8d08a'), lin('#8a3a1c'))],
  winter: [grade5(lin('#f0ece4'), lin('#3a1c5a')), grade5(lin('#e8e0f0'), lin('#6a1c3a'))],
};
// snow of the north-west quarter, 0..1
export const snowNW = (x, z) => smoothstep(1.5, 8, -x) * smoothstep(1.5, 8, -z);
// Snow laid on a tree's foliage from above (the kit's geometry, changed in place): leaf vertices that face up or stand high turn white.
export function snowOn(geometry, amount = 1) {
  const col = geometry.getAttribute('color'), nor = geometry.getAttribute('normal'), wind = geometry.getAttribute('wind'), pos = geometry.getAttribute('position');
  const H = geometry.userData.height || 10, s = PAL.snow;
  const plain = (a) => !!a && !a.isInterleavedBufferAttribute && !a.normalized;
  if (plain(col) && plain(nor) && plain(pos) && (!wind || plain(wind))) {
    // (the same sum, read and written straight in the attributes' arrays)
    const ca = col.array, cs = col.itemSize, na = nor.array, ns = nor.itemSize, pa = pos.array, ps = pos.itemSize, wa = wind ? wind.array : null, ws = wind ? wind.itemSize : 0;
    for (let i = 0, n = col.count; i < n; i++) {
      const leaf = wa ? wa[i * ws + 2] : 1, up = na[i * ns + 1], k = clamp((leaf > 0.3 ? smoothstep(-0.15, 0.55, up) : smoothstep(0.55, 0.9, up) * 0.8) * amount, 0, 1) * (0.75 + 0.25 * smoothstep(0.2, 0.7, pa[i * ps + 1] / H)), c = i * cs;
      ca[c] = lerp(ca[c], s[0] * 0.92, k); ca[c + 1] = lerp(ca[c + 1], s[1] * 0.92, k); ca[c + 2] = lerp(ca[c + 2], s[2] * 0.92, k);
    }
    col.needsUpdate = true;
    return geometry;
  }
  for (let i = 0; i < col.count; i++) {
    const leaf = wind ? wind.getZ(i) : 1, up = nor.getY(i), k = clamp((leaf > 0.3 ? smoothstep(-0.15, 0.55, up) : smoothstep(0.55, 0.9, up) * 0.8) * amount, 0, 1) * (0.75 + 0.25 * smoothstep(0.2, 0.7, pos.getY(i) / H));
    col.setXYZ(i, lerp(col.getX(i), s[0] * 0.92, k), lerp(col.getY(i), s[1] * 0.92, k), lerp(col.getZ(i), s[2] * 0.92, k));
  }
  col.needsUpdate = true;
  return geometry;
}
// The colour of the gardens' ground by quarter: spring grass, summer moss, autumn dry grass, winter snow. n in 0..1 varies it.
const GARDEN = { spring: [lin('#6a8a48'), lin('#8fa05a')], summer: [lin('#3f6a3c'), lin('#5a8448')], autumn: [lin('#a08a48'), lin('#b89a52')] };
export function gardenColor(x, z, n = 0.5) {
  // (channel by channel: the same sums as four mixes of whole colours, with one array made instead of nine)
  const e = smoothstep(-5, 5, x), s = smoothstep(-5, 5, z), G = GARDEN, w = 0.9 + 0.08 * n, out = [0, 0, 0, (1 - e) * (1 - s), 0];
  for (let k = 0; k < 3; k++) out[k] = lerp(lerp(PAL.snow[k] * w, lerp(G.summer[0][k], G.summer[1][k], n), e), lerp(lerp(G.autumn[0][k], G.autumn[1][k], n), lerp(G.spring[0][k], G.spring[1][k], n), e), s);
  return out;
}

// ---------------------------------------------------------------- the hero: the crossing with a corner of each garden
// opts: { inWorld, rng, shared, hours, timber, floraMat, wind, time, waterLight, density, mood, groundY, storm }
// Alone (no opts) it brings its own ground, brook, materials and wind.
export async function buildHero(ctx, opts = {}) {
  const inWorld = !!opts.inWorld, rng = opts.rng || ctx.core.makeRng(ctx.core.hashSeed('crossing:' + ctx.seed)), detail = (ctx.quality && ctx.quality.detail) || 1;
  const shared = opts.shared || { uTime: { value: 0 } };
  // the four hours: the world's own, or (alone) the same four at their usual constants; every corner is shaded by the hour of its own place
  const H = opts.hours || makeHours({ time: shared.uTime });
  const timber = opts.timber || makeTimberMaterial(shared, H.uniforms), time = opts.time || { value: 0 }, dens = (opts.density ?? 1) * detail;
  const wind = opts.wind || flora.makeWind({ direction: [-0.75, -0.65], strength: 0.9, speed: 0.9 });
  const matOpts = { wind, backlight: 1.0, backlightTint: '#ffd9a0', ambient: 2.0, leafAmbient: 1.9 };
  if (!opts.floraMat) await flora.prepareLeafTexture(matOpts, ctx.yield);
  const fmat = opts.floraMat || floraHours(flora.windMaterial(matOpts), H.uniforms);
  const root = new THREE.Group(), gy = opts.groundY ?? 1, mood = opts.mood ?? 0.5;
  const sets = [SETS.spring[mood < 0.5 ? 0 : 1], SETS.autumn[mood < 0.5 ? 0 : 1]];
  // the hero's own forks, all taken here
  const fk = {}; for (const name of ['brook', 'geo', 'scatter', 'petals', 'leaves', 'snow', 'sift']) fk[name] = rng.fork(name);
  // every draw of the corners is taken here, before any test
  const lane = (x, z) => Math.abs(x + z) / Math.SQRT2;
  const draw = (n, sx, sz, r0, r1) => { const out = []; for (let i = 0; i < n; i++) { const a = rng.range(0.08, 0.92) * Math.PI / 2, r = rng.range(r0, r1); out.push({ x: sx * Math.cos(a) * r, z: sz * Math.sin(a) * r, s: rng.range(0.85, 1.2), rot: rng.range(0, TAU), v: rng.int(0, 1), k: rng() }); } return out; };
  const keep = (list, laneMin, axisMin, gap, max) => {
    const out = [];
    for (const p of list) {
      if (out.length >= max) break;
      if (lane(p.x, p.z) < laneMin || Math.min(Math.abs(p.x), Math.abs(p.z)) < axisMin || out.some((q) => Math.hypot(q.x - p.x, q.z - p.z) < gap)) continue;
      out.push(p);
    }
    return out;
  };
  const cand = { cherry: draw(24, 1, 1, 23, 31), kerria: draw(30, 1, 1, 15, 33), bamboo: draw(40, 1, -1, 20, 33), deutzia: draw(40, 1, -1, 13, 33), maple: draw(30, -1, 1, 22, 33), pampas: draw(70, -1, 1, 9, 33),
    clover: draw(30, -1, 1, 12, 33), pine: draw(40, -1, -1, 21, 33), pineLow: draw(30, -1, -1, 13, 30) };
  const P = { cherry: keep(cand.cherry, 15, 9, 9, 2), kerria: keep(cand.kerria, 6, 5, 2.6, 7), bamboo: keep(cand.bamboo, 9.5, 6.5, 5, 7), deutzia: keep(cand.deutzia, 5.5, 5, 2.6, 9), maple: keep(cand.maple, 10.5, 8, 7, 5),
    pampas: keep(cand.pampas, 4, 4.5, 1.6, Math.round(26 * dens)), clover: keep(cand.clover, 5.5, 5, 2.6, 8), pine: keep(cand.pine, 10, 7, 5.5, 8), pineLow: keep(cand.pineLow, 6, 5, 3, 6) };
  // ground and brook when it stands alone
  const bed = (x, z) => gy - 1.7 * (1 - smoothstep(2.6, 5.6, lane(x, z)));
  if (!inWorld) {
    const gmat = makeGroundMaterial(shared, H.uniforms), n = ctx.noise;
    const g = await groundGeometry({ x0: -42, z0: -42, x1: 42, z1: 42, cell: 2, heightAt: bed, keep: (x, z) => Math.hypot(x, z) < 41,
      colorAt: (x, z, y) => { const c = gardenColor(x, z, 0.5 + 0.5 * n.n2(x * 0.08, z * 0.08)), w = smoothstep(gy - 0.2, gy - 1.2, y); return [lerp(c[0], 0.1, w * (1 - c[3])), lerp(c[1], 0.09, w * (1 - c[3])), lerp(c[2], 0.07, w * (1 - c[3])), c[3], 0]; } });
    root.add(new THREE.Mesh(g, gmat));
    await ctx.yield();
  }
  let brook = null;
  if (!inWorld) {
    brook = Water.makeRiver({ rng: fk.brook, light: opts.waterLight || 'sunset', points: [[30, 0, -30], [15, 0, -15], [0, 0, 0], [-15, 0, 15], [-30, 0, 30]], width: 7.4, speed: 1.6, foam: 0.25, deep: '#1c3a40', shallow: '#5a8a7a', opacity: 0.7 });
    root.add(brook.object);
  }
  // the timber: the crossing itself and a low plastered wall under the cherries
  const b = makeBuilder(16384);
  const made = await crossingInto(b, rng, { groundY: gy, snowAt: snowNW, sets, yield: ctx.yield, piers: ctx.core.makeRng(ctx.core.hashSeed('crossing-piers:' + ctx.seed)) });
  await ctx.yield();
  b.tr(23.5, gy, 23.5, -Math.PI / 4);
  b.surf(SURF.PLASTER).col(PAL.plaster, 0.92); b.box(-11, -0.4, -0.3, 11, 1.25, 0.3, { top: false });
  b.surf(SURF.BARK, 0).col(PAL.bark, 0.9); b.quad([-11.3, 1.2, 0.6], [11.3, 1.2, 0.6], [11.3, 1.62, 0], [-11.3, 1.62, 0], [0, 0, 22.6, 0.8]); b.quad([11.3, 1.2, -0.6], [-11.3, 1.2, -0.6], [-11.3, 1.62, 0], [11.3, 1.62, 0], [0, 0, 22.6, 0.8]);
  b.pop();
  const mesh = new THREE.Mesh(await b.toGeometrySteps(ctx.yield), timber); root.add(mesh);
  await ctx.yield();
  // the four corners: cherries and kerria (south-east), bamboo and deutzia (north-east), maples, pampas and bush clover
  // (south-west), the snow-laden pine fence (north-west)
  // opts.shapes lends the shapes of kinds a world has already made (in the world the gardens' own); alone, each is made here
  const g = fk.geo, G = {}, lent = opts.shapes || {};
  G.kerria = lent.kerria || [0, 1].map(() => flora.bushGeometry({ rng: g, size: 1.5, detail: 1, flowers: 1, flowerColor: '#ffc21a', leaf: '#8a9a34' })); await ctx.yield();
  G.cherry = lent.cherry || []; if (!lent.cherry) for (const i of [0, 1]) { G.cherry.push(flora.cherryGeometry({ rng: g, detail: 2, height: 15 - i * 2, leaf: '#f3c9d2', leafLight: '#fff2f5', leafDark: '#c98aa0' })); await ctx.yield(); }
  G.bamboo = lent.bamboo || [0, 1].map((i) => flora.bambooGeometry({ rng: g, detail: 1, height: 12.5 - i * 1.5, stalk: '#5f7a3a', leaf: '#4a7a36' })); await ctx.yield();
  G.deutzia = lent.deutzia || [0, 1].map(() => flora.bushGeometry({ rng: g, size: 1.8, detail: 1, flowers: 0.9, flowerColor: '#ffffff', leaf: '#3f6a3a' })); await ctx.yield();
  G.maple = lent.maple || [0, 1].map((i) => flora.mapleGeometry({ rng: g, detail: 1, height: 14 - i * 2.5, leaf: '#b8231c', crimson: '#8a1410', gold: '#e8861c' })); await ctx.yield();
  G.pampas = lent.pampas || [plumeGeometry({ rng: g })]; await ctx.yield();
  G.clover = lent.clover || [flora.bushGeometry({ rng: g, size: 1.5, detail: 1, flowers: 0.7, flowerColor: '#c84a9a', leaf: '#5a7a3a' })]; await ctx.yield();
  G.pine = lent.pine || [0, 1].map((i) => snowOn(flora.pineGeometry({ rng: g, detail: 1, height: 14.5 - i * 2.5 }))); await ctx.yield();
  G.pineLow = lent.pineLow || [snowOn(flora.pineGeometry({ rng: g, detail: 0, height: 7 }))]; await ctx.yield();
  await ctx.yield();
  const sets3 = [], solids = [];
  for (const [name, r] of [['cherry', 0.7], ['kerria', 1.3], ['bamboo', 1.4], ['deutzia', 1.3], ['maple', 0.6], ['pampas', 0.9], ['clover', 1.2], ['pine', 0.6], ['pineLow', 0.5]]) {
    const pts = P[name].map((p) => ({ x: p.x, y: gy - 0.12, z: p.z, s: p.s, rot: p.rot, v: p.v % G[name].length, d: 0, u: 0 }));
    if (!pts.length) continue;
    const sc = flora.makeScatter({ rng: fk.scatter, points: pts, variants: G[name], material: fmat });
    sets3.push(sc); root.add(sc.object);
    for (const p of pts) solids.push([p.x, p.z, r * p.s, name]);
  }
  for (const [px, pz] of [[CROSS.post, 0], [-CROSS.post, 0], [0, CROSS.post], [0, -CROSS.post]]) { solids.push([px, pz, 1.9, 'post']); for (let d = 15; d <= 26; d += 2) solids.push([px / CROSS.post * d, pz / CROSS.post * d, 2.1, 'stair']); }
  for (let t = -11; t <= 11; t += 2) solids.push([23.5 + t * Math.SQRT1_2, 23.5 - t * Math.SQRT1_2, 0.6, 'wall']);
  await ctx.yield();
  // air: petals from the cherries across the brook, leaves up the brook out of the south-west, snow on the pine fence
  const storm = opts.storm ? 1 : 0;
  const petals = fx.makeParticles({ rng: fk.petals, preset: 'petals', time, follow: false, center: [9, gy + 5.5, 9], box: [36, 12, 36], count: Math.round(460 * dens), velocity: [-1.5, -0.75, -1.2], colors: ['#ffd0de', '#fff0f4', '#f3b8cc'], size: [0.1, 0.2] });
  const leaves = fx.makeParticles({ rng: fk.leaves, preset: 'leaves', time, follow: false, center: [-11, gy + 5, 11], box: [38, 11, 38], count: Math.round((storm ? 900 : 300) * dens), velocity: storm ? [5.5, -0.6, -5.5] : [2.0, -0.55, -2.0],
    colors: ['#c8321c', '#e8862a', '#9a1c14'], size: [0.16, 0.3] });
  const snow = fx.makeParticles({ rng: fk.snow, preset: 'snow', time, follow: false, center: [-17, gy + 7, -17], box: [32, 15, 32], count: Math.round(800 * dens), size: [0.05, 0.12] });
  const bough = P.pine[0] || { x: -22, z: -22 };
  const sift = fx.makeParticles({ rng: fk.sift, preset: 'snow', time, follow: false, center: [bough.x + 1.5, gy + 5, bough.z + 1.5], box: [2.6, 9, 2.6], count: 110, velocity: [0.1, -2.6, 0.1], velocityRandom: [0.3, 0.8, 0.3], size: [0.05, 0.11] });
  const airs = [petals, leaves, snow, sift]; for (const a of airs) root.add(a.object);
  return {
    object: root, radius: 31, height: CROSS.peak, center: new THREE.Vector3(0, 6.5, 0), mesh, solids, stubs: made.stubs, snowAt: snowNW, bed,
    anchors: { laneIn: new THREE.Vector3(26, 2.4, -26), laneOut: new THREE.Vector3(-26, 2.4, 26), centre: new THREE.Vector3(0, 2.4, 0) },
    update(dt, t, camera) {
      if (!opts.shared) shared.uTime.value = t;
      if (!opts.time) time.value = t;
      if (!opts.wind) wind.update(t);
      for (const sc of sets3) sc.update(dt, t, camera);
      for (const a of airs) a.update(dt, t, camera);
      if (brook) brook.update(dt, t, camera);
    },
    dispose() {},
    ground: true, groundY: gy - 1.9,
  };
}

// ---------------------------------------------------------------- the estate's plan: its places, the route, the watercourses and the ground rule
// Nothing here is drawn, and nothing is dealt but the ground's grain (the noise): a script can lay the estate without a
// picture and print the lens's height over ground, water and ice on any seed. +X east, +Z south, metres.
const R2 = Math.SQRT1_2;
// Rings of rafts on a lake. `cand` candidate rings are thrown, every number of each before any is tried (the start angle too);
// then the first `count` whose whole round lies `inside` metres or more within the bank are kept. The number of draws never
// follows the count, the density or the bank. g: the water's own stream; L: the lake's oval; inL(x, z): metres inside its bank.
export const RAFT_RINGS = { spring: 900, autumn: 600 };
export function dealRings(g, L, inL, count, cand, inside = 3.3) {
  const all = [];
  for (let i = 0; i < cand; i++) {
    const a = g.range(0, TAU), k = Math.sqrt(g()) * 0.9, r = g.range(3, 20), w = g.range(0.008, 0.02) * (g.chance(0.5) ? 1 : -1), yaw = g.range(0, TAU), s = g.range(0.7, 1.3), a0 = g.range(0, TAU);
    all.push({ cx: L.cx + L.a * k * Math.cos(a), cz: L.cz + L.b * k * Math.sin(a), r, w, a: a0, yaw, s });
  }
  const list = [];
  for (let i = 0; i < cand && list.length < count; i++) {
    const c = all[i]; let wet = true;
    for (let j = 0; j < 12 && wet; j++) wet = inL(c.cx + c.r * Math.cos(j * TAU / 12), c.cz + c.r * Math.sin(j * TAU / 12)) > inside;
    if (wet) list.push(c);
  }
  return list;
}
// The children's ball of snow, dealt from a stream of its own: its metre within BALL_PLACE.along metres either side of the
// route metre nearest the design's point, its distance from the lane within BALL_PLACE.off, always on the right.
export const BALL_PLACE = { near: [-128, -76], along: 5, off: [10, 14], sight: 2.5 };
export function dealBall(g, E) {
  const m = E.metresAt(BALL_PLACE.near[0], BALL_PLACE.near[1]) + g.range(-BALL_PLACE.along, BALL_PLACE.along), off = g.range(BALL_PLACE.off[0], BALL_PLACE.off[1]);
  const p = E.path.posAtDist(m), t = E.path.tangentAtDist(m), tl = Math.hypot(t.x, t.z) || 1, rx = -t.z / tl, rz = t.x / tl;
  return { m, off, x: p.x + rx * off, z: p.z + rz * off, rx, rz };
}
// The places of the lane, every 2 m from metre m0 on, from which a thing at (bx, bz) bears under 60 degrees off the lane's
// line (the line to the lane's point 20 m on, as the looks take it): where the eye can rest on it.
export function sightFan(E, bx, bz, m0) {
  const pts = [], C60 = Math.cos(Math.PI / 3);
  for (let m = m0; m < E.LEN; m += 2) {
    const p = E.path.posAtDist(m), a = E.path.posAtDist(Math.min(E.LEN, m + 20)), ax = a.x - p.x, az = a.z - p.z, tx = bx - p.x, tz = bz - p.z;
    if ((ax * tx + az * tz) / ((Math.hypot(ax, az) || 1) * (Math.hypot(tx, tz) || 1)) > C60) pts.push([p.x, p.z, m]); else if (pts.length) break;
  }
  return pts;
}
// how near a place lies to any straight line from those places of the lane to the thing
export function fanDist(pts, bx, bz, x, z) {
  let least = 1e9;
  for (const p of pts) { const dx = bx - p[0], dz = bz - p[1], t = clamp(((x - p[0]) * dx + (z - p[1]) * dz) / (dx * dx + dz * dz || 1), 0, 1); least = Math.min(least, Math.hypot(x - p[0] - dx * t, z - p[1] - dz * t)); }
  return least;
}
// The two pleasure boats' beat: one closed oval on the spring lake, west of the first leg and along it, which both boats ply
// half a round apart on the world clock at one even pace (BEAT.pace metres a second, the design's). Its two long sides lie
// BEAT.near and BEAT.far metres left of the lane, joined at each end by a half round between them: a turn a poled hull can make.
// Its ends are places of the lake: it is grown from abreast of the lake's middle, south toward the bank behind the entry and
// north toward the island, as far each way as every point of a boat's skin keeps BEAT.clear metres inside the bank and the
// island's shore (water a hand deep). A boat rides it as a long hull does: bow and stern both on the oval's line, BEAT.hold
// metres ahead of and behind its middle. BEAT.skin: a boat's outline, metres ahead and to the side of its middle (boatInto: the
// head reaches 9.2 m ahead, the stern 7.4 m behind, the beam is 3.3 m).
export const BEAT = { near: 20, far: 30, pace: 1.1, hold: 4.5, clear: 3.3, skin: [[9.2, 0], [-7.4, 0], [4.5, 1.65], [4.5, -1.65], [-4.5, 1.65], [-4.5, -1.65], [0, 1.65], [0, -1.65]] };
export function boatBeat(E) {
  const { knots, leg, rightN, lakeIn } = E, r = (BEAT.far - BEAT.near) / 2, mid = -(BEAT.near + r), x0 = knots[0][0], z0 = knots[0][2], turn = Math.PI * r;
  // the oval's line between the two half rounds' middles (metres along the leg, south and north): the point s metres round it,
  // from the north end of the near side, southward down the near side, round the south end, north up the far side, round the north end
  const line = (cS, cN, s, out) => {
    const side = cN - cS, P = 2 * side + 2 * turn; s = ((s % P) + P) % P; let al, lat;
    if (s < side) { al = cN - s; lat = mid + r; }
    else if (s < side + turn) { const f = (s - side) / r; al = cS - r * Math.sin(f); lat = mid + r * Math.cos(f); }
    else if (s < 2 * side + turn) { al = cS + (s - side - turn); lat = mid - r; }
    else { const f = (s - 2 * side - turn) / r; al = cN + r * Math.sin(f); lat = mid - r * Math.cos(f); }
    out[0] = x0 + leg.x * al + rightN[0] * lat; out[1] = z0 + leg.y * al + rightN[1] * lat;
    return out;
  };
  // a hull whose middle is s metres round: its place (the middle of bow and stern on the line) and its heading (stern to bow)
  const pa = [0, 0], pb = [0, 0];
  const hull = (cS, cN, s, out) => {
    line(cS, cN, s - BEAT.hold, pa); line(cS, cN, s + BEAT.hold, pb);
    const hx = pb[0] - pa[0], hz = pb[1] - pa[1], hl = Math.hypot(hx, hz) || 1;
    out.x = (pa[0] + pb[0]) / 2; out.z = (pa[1] + pb[1]) / 2; out.hx = hx / hl; out.hz = hz / hl;
    return out;
  };
  // the least depth inside the bank of any point of a hull's skin, for every metre of the line from s0 to s1
  const o = { x: 0, z: 0, hx: 0, hz: 0 };
  const inside = (cS, cN, s0, s1) => {
    let least = 1e9;
    for (let s = s0; s <= s1; s += 1) { hull(cS, cN, s, o); for (const [f, sd] of BEAT.skin) least = Math.min(least, lakeIn(o.x + o.hx * f - o.hz * sd, o.z + o.hz * f + o.hx * sd)); }
    return least;
  };
  // grown from abreast of the lake's middle: north while the north end's turn keeps its water, then south likewise, each by
  // strides of 8 m, then 4, 2, 1 and half a metre (a stride moves one end only: the turn at that end and a hull's length of
  // the sides either way of it, which is more than a stride, are asked again)
  const LAKE = PLACE.LAKE, al0 = (LAKE.cx - x0) * leg.x + (LAKE.cz - z0) * leg.y, lap = BEAT.skin[0][0] + BEAT.hold + 1;
  let cS = al0, cN = al0;
  for (let st = 8; st >= 0.5; st /= 2) while (cN + st - al0 < 200 && inside(cS, cN + st, 2 * (cN + st - cS) + turn - lap, 2 * (cN + st - cS) + 2 * turn + lap) >= BEAT.clear) cN += st;
  for (let st = 8; st >= 0.5; st /= 2) while (al0 - cS + st < 200 && inside(cS - st, cN, cN - cS + st - lap, cN - cS + st + turn + lap) >= BEAT.clear) cS -= st;
  const P = 2 * (cN - cS) + 2 * turn;
  // where the boat that holds `phase` (a share of the round, in radians) lies at a clock time: out.x, out.z, out.yaw
  const at = (phase, time, out) => { hull(cS, cN, phase / TAU * P + BEAT.pace * time, o); out.x = o.x; out.z = o.z; out.yaw = Math.atan2(-o.hz, o.hx); return out; };
  // how near any point of a boat's skin comes to a place, all the way round (for whatever else floats on the lake)
  const reach = (x, z) => {
    let least = 1e9;
    for (let s = 0; s < P; s += 1) { hull(cS, cN, s, o); for (const [f, sd] of BEAT.skin) least = Math.min(least, Math.hypot(o.x + o.hx * f - o.hz * sd - x, o.z + o.hz * f + o.hx * sd - z)); }
    return least;
  };
  return { south: cS - r, north: cN + r, round: P, period: P / BEAT.pace, hull: (s, out) => hull(cS, cN, s, out), inside: () => inside(cS, cN, 0, P), reach, at };
}
export const PLACE = (() => {
  // the courts and the garden ground; the spring lake (water at y 0) and its island; the cool spring; both arcs' radius; the maple hill
  const GY = 1.0, LAKE = { cx: 102, cz: 150, a: 64, b: 80, p: 4.5, bankRight: 13 }, ISLE = { x: 96, z: 104, r: 15 }, POOL = { x: 89, z: -27, r: 14 }, ARC = 44, HILL = { x: -95, z: 33, r: 26, h: 15 };
  // The fall ends the brook's straight line down the field and faces up it. Its pool; uphill from the pool (FU); its three lips,
  // each [metres uphill of the pool's middle, height of the lip, width of the water], the water dropping from each onto the ledge below
  const FU = [-R2, R2], FALL = { x: -91, z: 91, r: 4.6, level: -0.55, steps: [[12.2, 20.5, 3.8], [8.0, 14.0, 4.4], [3.8, 7.5, 5.0]] };
  const fallAt = (s, side = 0) => [FALL.x + FU[0] * s - FU[1] * side, FALL.z + FU[1] * s + FU[0] * side];
  // the knoll the fall comes down, the top lip, the autumn lake (water at y -0.6), the gate in the border gallery
  const KNOLL = { x: fallAt(22)[0], z: fallAt(22)[1], r: 33, h: 15 }, LIP = fallAt(FALL.steps[0][0]), ALAKE = { cx: -96, cz: 176, a: 88, b: 60, p: 3.2 }, GATE = { x: -139, z: 0, w: 13, h: 7.5 };
  const HALLS = {
    spring: { x: 92, z: 24, w: 44, d: 20, ridge: 16, eave: 7.8, bays: 10 },
    wing: { x: 155, z: 22, w: 24, d: 18, ridge: 12, eave: 6.6, bays: 6, yaw: -Math.PI / 2 },
    fishing: { x: 150, z: 84, w: 12, d: 10, ridge: 9.5, eave: 5.4, bays: 3, yaw: -Math.PI / 2 },
    summer: { x: 89, z: -108, w: 34, d: 20, ridge: 14, eave: 7.2, bays: 8 },
    autumn: { x: -166, z: 38, w: 18, d: 12, ridge: 10, eave: 5.8, bays: 4, yaw: Math.PI / 2 },
    winter: { x: -120, z: -196, w: 46, d: 20, ridge: 17, eave: 8.6, bays: 8 },
  };
  // the frozen stream of the winter court, from its frozen pool before the hall's stair south to the border gallery: the lane keeps 7 to 11 m east of it
  const ICE = { level: GY - 0.3, pool: [-131, -167, 6.5], line: [[-131, -166], [-130.5, -148], [-129.5, -124], [-133.5, -104], [-141, -84], [-149.5, -62], [-152.6, -42], [-151.6, -22], [-150, -6], [-149.5, 1.5]] };
  // The lane through the court. From the gate it keeps 9 m east of the frozen stream beside the stream's two westmost points
  // (a shallow swing west); then it swings back to the hall's axis in five equal steps north, as far as the start of the
  // last 60 m: its x goes from the swing's west point to the axis by the smooth step over the first four of them, so the
  // fifth runs on the axis already (the straightening knot stands one step before the last 60 m), and it climbs evenly over
  // those four; then 60 m straight north and level into the hall's open bays.
  const WH = HALLS.winter, endY = GY + 1.6 + 0.1 + 2.7, endZ = WH.z + WH.d / 2, LAST = 60, west = [ICE.line[6][0] + 9, 2.95, ICE.line[6][1]];
  const swing = [0, 1, 2, 3, 4].map((i) => [lerp(west[0], WH.x, smoothstep(0, 1, i / 4)), lerp(west[1], endY - 0.1, i / 4), lerp(west[2], endZ + LAST, i / 5)]);
  const COURT = [[GATE.x, 3.0, GATE.z], [ICE.line[7][0] + 9, 2.9, ICE.line[7][1]], ...swing, [WH.x, endY, endZ + LAST], [WH.x, endY, endZ]];
  return { GY, LAKE, ISLE, STREAM_W: 8, BROOK_W: 7, AUTUMN_W: 9.6, POOL, ARC, HILL, FU, FALL, fallAt, KNOLL, LIP, ALAKE, GATE, HALLS, ICE, COURT, WIND: PLACE_WIND };
})();
// The plan laid out. noise: the build's own noise; rest: a function to await between pieces (optional).
export async function makeEstate(noise, rest = () => Promise.resolve()) {
  const { GY, LAKE, ISLE, STREAM_W, BROOK_W, AUTUMN_W, POOL, ARC, HILL, FU, FALL, KNOLL, ALAKE, GATE, ICE, COURT, WIND } = PLACE, DEG = Math.PI / 180;
  // ---- the route (rules R1 to R8 of the first round's notes; the court's line is this round's)
  const arcPt = (c, deg, y) => [c.x + ARC * Math.cos(deg * DEG), y, c.z + ARC * Math.sin(deg * DEG)];
  const knots = [[152, 2.2, 198], [142, 2.2, 150], [132, 2.2, 102], [129, 2.3, 70], [130, 2.4, 46], [131, 2.4, 24], [132, 2.4, -2], [133, 2.4, -27]];
  // the left arc round the cool spring: from its east point by the north to its north-west point
  for (let a = 22.5; a <= 135.1; a += 22.5) knots.push(arcPt(POOL, -a, 2.4));
  // down the brook, under the crossing, through the flower field
  knots.push([29, 2.4, -29], [0, 2.4, 0], [-32, 2.5, 32]);
  // the right arc round the maple hill: from its south-east point by the south to its west point
  for (let a = 45; a <= 180.1; a += 22.5) knots.push(arcPt(HILL, a, a < 50 ? 2.9 : 3.4));
  // north through the gate, beside the frozen stream, and straight up the court to the hall's open bays
  knots.push(...COURT);
  const path = makePath(knots), LEN = path.length, route = [];
  for (let m = 0; m <= LEN; m += 1) { route.push(path.posAtDist(m)); if (m % 80 === 79) await rest(); }
  route.push(path.posAtDist(LEN));
  // the nearest metre of route to a place, and the distance of a place from the lane's line
  // (every eighth metre first, then each metre round the best of those: the lane never comes within 40 m of itself)
  const nearRoute = (x, z) => {
    let best = 1e9, bm = 0;
    for (let m = 0; m < route.length; m += 8) { const dx = route[m].x - x, dz = route[m].z - z, d = dx * dx + dz * dz; if (d < best) { best = d; bm = m; } }
    for (let m = Math.max(0, bm - 8), m1 = Math.min(route.length - 1, bm + 8); m <= m1; m++) { const dx = route[m].x - x, dz = route[m].z - z, d = dx * dx + dz * dz; if (d < best) { best = d; bm = m; } }
    return { m: Math.min(bm, LEN), d: Math.sqrt(best) };
  };
  const metresAt = (x, z) => nearRoute(x, z).m;
  const mMouth = metresAt(129, 70), mBridge = metresAt(131, 24), mArc1 = metresAt(133, -27), mNorth1 = metresAt(POOL.x, POOL.z - ARC), mBrook = metresAt(POOL.x - ARC * R2, POOL.z - ARC * R2);
  const mCross = metresAt(0, 0), mArc2 = metresAt(HILL.x + ARC * R2, HILL.z + ARC * R2), mSouth2 = metresAt(HILL.x, HILL.z + ARC), mWest2 = metresAt(HILL.x - ARC, HILL.z), mGate = metresAt(GATE.x, GATE.z);
  // the lane's x through the court by its z (the court's line never turns back on itself in z)
  const courtX = (z) => { for (let i = 0; i < COURT.length - 1; i++) { const a = COURT[i], b = COURT[i + 1]; if (z <= a[2] && z >= b[2]) return lerp(a[0], b[0], (a[2] - z) / (a[2] - b[2])); } return z > 0 ? GATE.x : COURT[COURT.length - 1][0]; };
  // ---- the watercourse. The stream leaves the spring lake northward under the lane, runs round the cool spring, down the diagonal
  // under the crossing and through the flower field, and on south into the autumn lake: one course, the lane above it to the maple arc.
  const course = [];
  for (let m = mMouth - 10; m <= mArc2 + 2; m += 3) { const p = route[Math.round(m)]; course.push([p.x, p.z]); }
  course.push([-72, 82], [-78, 100], [-82, 114], [-84, 126]);
  const cm0 = mMouth - 10, cN = Math.floor((mArc2 + 2 - cm0) / 3) + 1;
  // metres along the course by index: the routed part first, the tail to the autumn lake after it
  const courseM = (i) => (i < cN ? cm0 + i * 3 : cm0 + (cN - 1) * 3 + (i - cN + 1) * 16);
  const waterY = (m) => -0.6 * smoothstep(mCross + 12, mArc2 + 20, m);
  // 8 m of stream, 7 m of brook from the summer arc on, 9.6 m of reflecting water through the autumn field
  const halfW = (m) => lerp(lerp(STREAM_W / 2, BROOK_W / 2, smoothstep(mArc1, mBrook, m)), AUTUMN_W / 2, smoothstep(mCross + 10, mCross + 36, m)) + 0.9 * noise.n2(m * 0.045, 3.7);
  // in the autumn garden the banks come down to the water over 12 m: a broad low dale, the water a hand under its grass
  const daleK = (m) => smoothstep(mCross + 14, mCross + 44, m);
  return layGround({ noise, knots, path, LEN, route, nearRoute, metresAt, mMouth, mBridge, mArc1, mNorth1, mBrook, mCross, mArc2, mSouth2, mWest2, mGate, courtX, course, cm0, cN, courseM, waterY, halfW, daleK });
}
// the ground rule over a laid route and course (the second half of makeEstate)
function layGround(E) {
  const { GY, LAKE, ISLE, POOL, HILL, FU, FALL, KNOLL, ALAKE, ICE, WIND } = PLACE, { noise, knots, course, courseM, waterY, halfW, daleK, courtX } = E;
  // distance from a point to a polyline: [distance, index + fraction]
  // (polyDist and courseDist each give the same one array again and again: read it before the next ask)
  const pdOut = [0, 0], cdOut = [0, 0];
  const polyDist = (poly, x, z) => {
    let best = 1e12, bt = 0;
    for (let i = 0, n = poly.length - 1; i < n; i++) {
      const a = poly[i], q = poly[i + 1], ax = a[0], az = a[1], dx = q[0] - ax, dz = q[1] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), ex = ax + dx * t - x, ez = az + dz * t - z, d = ex * ex + ez * ez;
      if (d < best) { best = d; bt = i + t; }
    }
    pdOut[0] = Math.sqrt(best); pdOut[1] = bt;
    return pdOut;
  };
  // a coarse box test first: most of the estate is far from any water
  const boxOf = (poly, pad) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const p of poly) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); } return [x0 - pad, z0 - pad, x1 + pad, z1 + pad]; };
  const inBox = (b, x, z) => x > b[0] && x < b[2] && z > b[1] && z < b[3];
  const rounded = (line, step) => { const cv = new THREE.CatmullRomCurve3(line.map((p) => new THREE.Vector3(p[0], 0, p[1]))), n = Math.ceil(cv.getLength() / step); return cv.getSpacedPoints(n).map((v) => [v.x, v.z]); };
  const SIDE = [
    // the cool spring's outflow, west to the brook
    { q: 1, poly: [[POOL.x - 9, POOL.z - 3], [66, -34], [52, -39], [42, -42]], hw: 2.6, y: 0.12, shallow: '#3f6a58', band: { color: '#14301f', top: '#3f6a44', height: 0.3, amount: 0.85 } },
    // from the fall's pool east into the brook, just above the autumn lake
    { q: 2, poly: [[FALL.x, FALL.z], [-85, 91.5], [-79.5, 94], [-76.3, 95.5]], hw: 2.2, y: FALL.level, shallow: '#8a7a5a', band: { color: '#5a1c14', top: '#e0702a', height: 0.26, amount: 0.85 } },
    // the channel between the two lakes, round the wooded hill
    { q: 0, poly: [[42, 178], [28, 190], [8, 194], [-12, 188]], hw: 5, y: -0.3, shallow: '#8ab09a', band: { color: '#33482c', top: '#8a9a6a', height: 0.16, amount: 0.75 } },
  ];
  // each side brook's line is rounded once, here, so that its bed and its water follow the same curve
  for (const s of SIDE) { s.poly = rounded(s.poly, 3); s.box = boxOf(s.poly, 12); }
  const courseBox = [];
  for (let i = 0; i < course.length - 1; i += 12) courseBox.push({ i0: i, i1: Math.min(course.length - 1, i + 12), box: boxOf(course.slice(i, i + 13), 18.5) });
  const courseDist = (x, z) => {
    let best = 1e9, bt = 0;
    for (let k = 0; k < courseBox.length; k++) {
      const c = courseBox[k], bx = c.box; if (!(x > bx[0] && x < bx[2] && z > bx[1] && z < bx[3])) continue;
      for (let i = c.i0; i < c.i1; i++) {
        const a = course[i], q = course[i + 1], ax = a[0], az = a[1], dx = q[0] - ax, dz = q[1] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), ex = ax + dx * t - x, ez = az + dz * t - z, d = ex * ex + ez * ez;
        if (d < best) { best = d; bt = i + t; }
      }
    }
    cdOut[0] = Math.sqrt(best); cdOut[1] = bt;
    return cdOut;
  };
  const courseMetres = (t) => { const i = Math.min(course.length - 2, Math.floor(t)); return lerp(courseM(i), courseM(i + 1), t - i); };
  // the two lakes: metres inside the bank (negative on land)
  const leg = new THREE.Vector2(knots[2][0] - knots[0][0], knots[2][2] - knots[0][2]).normalize(), rightN = [-leg.y, leg.x];
  const superIn = (L, x, z) => { const ex = Math.abs(x - L.cx), ez = Math.abs(z - L.cz); if (ex > L.a + 24 || ez > L.b + 24) return -99; return (1 - Math.pow(Math.pow(ex / L.a, L.p) + Math.pow(ez / L.b, L.p), 1 / L.p)) * Math.min(L.a, L.b); };
  const lakeIn = (x, z) => {
    const d = superIn(LAKE, x, z); if (d < -3) return d;
    const r = (x - knots[0][0]) * rightN[0] + (z - knots[0][2]) * rightN[1];
    return Math.min(d, LAKE.bankRight - r, Math.hypot(x - ISLE.x, z - ISLE.z) - ISLE.r);
  };
  const alakeIn = (x, z) => superIn(ALAKE, x, z);
  // the frozen stream: its line rounded once, its width (2.8 to 3.8 m a side, a third of that under the border gallery), its pool; metres inside the ice
  const iceLine = rounded(ICE.line, 3), iceBox = boxOf(iceLine, 12), iceN = iceLine.length - 1;
  const iceHalf = (t) => (3.3 + 0.5 * noise.n2(t * 0.21, 9.3)) * (0.42 + 0.58 * smoothstep(0, 5, iceN - t));
  // (the line is searched in pieces of eight spans, each with a box of its own, as the watercourse is)
  const iceBoxes = []; for (let i = 0; i < iceN; i += 8) iceBoxes.push({ i0: i, i1: Math.min(iceN, i + 8), box: boxOf(iceLine.slice(i, i + 9), 12) });
  const iceIn = (x, z) => {
    if (!inBox(iceBox, x, z)) return -9;
    let best = 144, bt = 0;
    for (let k = 0; k < iceBoxes.length; k++) {
      const c = iceBoxes[k]; if (!inBox(c.box, x, z)) continue;
      for (let i = c.i0; i < c.i1; i++) {
        const a = iceLine[i], q = iceLine[i + 1], ax = a[0], az = a[1], dx = q[0] - ax, dz = q[1] - az, t = clamp(((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz), 0, 1), ex = ax + dx * t - x, ez = az + dz * t - z, d = ex * ex + ez * ez;
        if (d < best) { best = d; bt = i + t; }
      }
    }
    return Math.max(iceHalf(bt) - Math.sqrt(best), ICE.pool[2] - Math.hypot(x - ICE.pool[0], z - ICE.pool[1]));
  };
  return layHeights({ ...E, polyDist, boxOf, inBox, SIDE, courseDist, courseBox, courseMetres, leg, rightN, lakeIn, alakeIn, iceLine, iceHalf, iceIn, iceBox });
}
// the heights (the third part of makeEstate): hills, the fall's cliff, the rim, the court's drifts, basins and beds
function layHeights(E) {
  const { GY, LAKE, ISLE, POOL, HILL, FU, FALL, KNOLL, ALAKE, ICE, WIND } = PLACE, { noise, waterY, halfW, daleK, courtX, courseDist, courseBox, courseMetres, lakeIn, alakeIn, iceIn, iceBox, SIDE, inBox, polyDist } = E;
  const HILLS = [[HILL.x, HILL.z, HILL.r, HILL.h, 0.8], [KNOLL.x, KNOLL.z, KNOLL.r, KNOLL.h, 0.8], [186, 150, 36, 8, 1.2], [118, 262, 46, 9, 1.2], [8, 158, 21, 8, 1.1], [-120, -262, 64, 13, 1.2], [92, -196, 52, 9, 1.2], [-200, 120, 40, 9, 1.2], [205, -80, 44, 8, 1.2], [ISLE.x, ISLE.z, 13, 1.6, 1]];
  const basin = (y, inM, level, deep, reach) => Math.min(y, lerp(GY, level - deep, smoothstep(-1.5, reach, inM)));
  // the fall's cliff: from the pool's back edge to the top lip 20 m higher in 10 m of ground; the rock ledges stand on it
  const top = FALL.steps[0], cliff = (s) => lerp(0.2, top[1] - 0.4, smoothstep(4.2, top[0] + 2.2, s));
  // The court's snow has form: long drifts lying along the wind, broad swells and hollows between them, up to a metre high.
  // Low beside the lane (the lens goes 2 m over the court), nought at the crossing's own corner (its pines stand on level ground).
  const drift = (x, z) => {
    const w0 = smoothstep(1.5, 8, -x) * smoothstep(1.5, 8, -z); if (w0 <= 0) return 0;
    const w = w0 * smoothstep(34, 46, Math.hypot(x, z)); if (w <= 0) return 0;
    const a = x * WIND[0] + z * WIND[1], c = -x * WIND[1] + z * WIND[0], ridge = 1 - Math.abs(noise.n2(a * 0.02 + 31, c * 0.07 - 17)), swell = 0.5 + 0.5 * noise.n2(x * 0.035 - 9, z * 0.035 + 4);
    return (1.25 * (0.55 * ridge * ridge + 0.45 * swell) - 0.25) * w * (0.3 + 0.7 * smoothstep(3, 10, Math.abs(x - courtX(z))));
  };
  // What can touch a place: one word for each 8 m square of the estate, with a bit for each thing whose own box (the box its rule
  // tests first, half a metre wider here) reaches into that square: a bit for each hill, then the cliff, the two lakes, the two round
  // pools, the frozen stream, the watercourse, the side brooks. The height's rule asks only the things whose bit is set (each still
  // tests its own box, so the heights are the same to the last bit); beyond the map every bit counts as set.
  const MX0 = -240, MZ0 = -288, MC = 8, MNX = 60, MNZ = 72, touch = new Uint32Array(MNX * MNZ), HB = HILLS.length;
  const T_HILLS = (1 << HB) - 1, T_CLIFF = 1 << HB, T_LAKE = 2 << HB, T_ALAKE = 4 << HB, T_POOL = 8 << HB, T_FPOOL = 16 << HB, T_ICE = 32 << HB, T_COURSE = 64 << HB, T_SIDE = 128 << HB;
  const mark = (x0, z0, x1, z1, bit) => {
    const i0 = Math.max(0, Math.floor((x0 - 0.5 - MX0) / MC)), i1 = Math.min(MNX - 1, Math.floor((x1 + 0.5 - MX0) / MC)), j0 = Math.max(0, Math.floor((z0 - 0.5 - MZ0) / MC)), j1 = Math.min(MNZ - 1, Math.floor((z1 + 0.5 - MZ0) / MC));
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) touch[j * MNX + i] |= bit;
  };
  HILLS.forEach((h, k) => mark(h[0] - h[2], h[1] - h[2], h[0] + h[2], h[1] + h[2], 1 << k));
  mark(FALL.x - 44, FALL.z - 44, FALL.x + 44, FALL.z + 44, T_CLIFF);
  mark(LAKE.cx - LAKE.a - 24, LAKE.cz - LAKE.b - 24, LAKE.cx + LAKE.a + 24, LAKE.cz + LAKE.b + 24, T_LAKE);
  mark(ALAKE.cx - ALAKE.a - 24, ALAKE.cz - ALAKE.b - 24, ALAKE.cx + ALAKE.a + 24, ALAKE.cz + ALAKE.b + 24, T_ALAKE);
  mark(POOL.x - POOL.r - 1.6, POOL.z - POOL.r - 1.6, POOL.x + POOL.r + 1.6, POOL.z + POOL.r + 1.6, T_POOL);
  mark(FALL.x - FALL.r - 1.6, FALL.z - FALL.r - 1.6, FALL.x + FALL.r + 1.6, FALL.z + FALL.r + 1.6, T_FPOOL);
  mark(iceBox[0], iceBox[1], iceBox[2], iceBox[3], T_ICE);
  for (const c of courseBox) mark(c.box[0], c.box[1], c.box[2], c.box[3], T_COURSE);
  for (const sd of SIDE) mark(sd.box[0], sd.box[1], sd.box[2], sd.box[3], T_SIDE);
  const heightAt = (x, z) => {
    let y = GY;
    const mi = Math.floor((x - MX0) / MC), mj = Math.floor((z - MZ0) / MC), m = mi >= 0 && mi < MNX && mj >= 0 && mj < MNZ ? touch[mj * MNX + mi] : -1;
    if (m & T_HILLS) for (let k = 0; k < HB; k++) { if (!(m >> k & 1)) continue; const h = HILLS[k]; if (Math.abs(x - h[0]) > h[2] || Math.abs(z - h[1]) > h[2]) continue; const r = Math.hypot(x - h[0], z - h[1]); if (r < h[2]) y += h[3] * Math.pow(1 - smoothstep(h[2] * 0.12, h[2], r), h[4]); }
    const fx0 = x - FALL.x, fz0 = z - FALL.z;
    if (m & T_CLIFF && Math.abs(fx0) < 44 && Math.abs(fz0) < 44) { const s = fx0 * FU[0] + fz0 * FU[1], side = Math.abs(-fx0 * FU[1] + fz0 * FU[0]); if (s > 4 && side < 17) y = Math.max(y, lerp(y, cliff(s), (1 - smoothstep(7, 17, side)) * (1 - smoothstep(20, 36, s)))); }
    y += 0.18 * noise.n2(x * 0.045, z * 0.045) * smoothstep(GY + 0.02, GY + 1.5, y + 0.3);
    // the rim: west of the wing and the storehouses, and south of the autumn lake, the ground climbs 15 m to the estate's edge
    if (x < -176 || (z > 234 && x < 0)) y += 15 * Math.max(smoothstep(178, 214, -x), smoothstep(236, 256, z) * smoothstep(0, -40, x)) * (0.82 + 0.18 * noise.n2(x * 0.02, z * 0.02));
    if (x < 0 && z < 0) y += drift(x, z);
    if (m & T_LAKE) { const li = lakeIn(x, z); if (li > -1.5) y = basin(y, li, 0, 2.4, 8); }
    if (m & T_ALAKE) { const ai = alakeIn(x, z); if (ai > -1.5) y = basin(y, ai, -0.6, 2.2, 8); }
    // (the two round pools are asked only inside the square that holds them and their 1.5 m of bank)
    if (m & T_POOL && Math.abs(x - POOL.x) < POOL.r + 1.6 && Math.abs(z - POOL.z) < POOL.r + 1.6) { const pi = POOL.r - Math.hypot(x - POOL.x, z - POOL.z); if (pi > -1.5) y = basin(y, pi, 0.12, 1.5, 5); }
    if (m & T_FPOOL && Math.abs(fx0) < FALL.r + 1.6 && Math.abs(fz0) < FALL.r + 1.6) { const fi = FALL.r - Math.hypot(fx0, fz0); if (fi > -1.5) y = basin(y, fi, FALL.level, 1.3, 3.5); }
    if (m & T_ICE) { const ii = iceIn(x, z); if (ii > -2.5) y = Math.min(y, lerp(y, ICE.level - 0.5, smoothstep(-2.5, 1.2, ii))); }
    if (m & T_COURSE) {
      const cd = courseDist(x, z);
      if (cd[0] < 17.5) {
        const cm = courseMetres(cd[1]), hw = halfW(cm), wy = waterY(cm), dk = daleK(cm); let bank = Math.max(y, GY);
        if (dk > 0) bank = lerp(bank, Math.min(bank, lerp(wy + 0.5, bank, smoothstep(hw + 0.5, hw + 12, cd[0]))), dk);
        y = Math.min(y, lerp(wy - 1.25, bank, smoothstep(hw - 1.3, hw + 2.3, cd[0])));
      }
    }
    if (m & T_SIDE) for (let k = 0; k < SIDE.length; k++) { const sd = SIDE[k]; if (inBox(sd.box, x, z)) { const d = polyDist(sd.poly, x, z)[0]; if (d < sd.hw + 3) y = Math.min(y, lerp(sd.y - 0.9, Math.max(y, GY), smoothstep(sd.hw - 0.9, sd.hw + 2.2, d))); } }
    return y;
  };
  // the surface the lens must stay over: the ground, or the water or the ice where that lies over it
  const surfaceAt = (x, z) => {
    let y = heightAt(x, z);
    if (lakeIn(x, z) > 0) y = Math.max(y, 0);
    if (alakeIn(x, z) > 0) y = Math.max(y, -0.6);
    if (Math.hypot(x - POOL.x, z - POOL.z) < POOL.r) y = Math.max(y, 0.12);
    if (iceIn(x, z) > 0) y = Math.max(y, ICE.level);
    const cd = courseDist(x, z); if (cd[0] < 9) { const m = courseMetres(cd[1]); if (cd[0] < halfW(m) + 0.6) y = Math.max(y, waterY(m)); }
    return y;
  };
  // (can the watercourse be within 18.5 m of this place? asked before its distance is)
  const courseNear = (x, z) => { const mi = Math.floor((x - MX0) / MC), mj = Math.floor((z - MZ0) / MC); return !(mi >= 0 && mi < MNX && mj >= 0 && mj < MNZ) || (touch[mj * MNX + mi] & T_COURSE) !== 0; };
  return { ...E, HILLS, heightAt, surfaceAt, drift, courseNear };
}

// ---------------------------------------------------------------- pampas: a clump as it grows, no card of grass blown up to the size of a bush
// A fountain of fine arching blades (each a thin ribbon of three bends), above it stalks, and on each stalk a plume: two crossed
// narrow feathers (the kit's fine-needled bough from its leaf sheet, a hand wide and a metre long) that bend over to the lee.
// The geometry is laid out as the kit's own plants are (position, normal, colour, wind = sway, flutter, leaf, glow; uv into the leaf
// sheet), so the gardens' leaf material sways it and lets the low sun through it. o: { rng, height, blades, plumes }
export function plumeGeometry(o = {}) {
  const rng = o.rng, H = o.height ?? 2.9, nb = o.blades ?? 18, np = o.plumes ?? 7, P = [], N = [], Cc = [], Wd = [], UV = [], I = [];
  const cell = flora.LEAF_CELLS.needle, SU = 0.875, SV = 0.75;
  const v = (p, n, c, sway, flutter, tu = SU, tv = SV) => { P.push(p[0], p[1], p[2]); N.push(n[0], n[1], n[2]); Cc.push(c[0], c[1], c[2]); Wd.push(sway, flutter, 1, 0); UV.push(tu, tv); return P.length / 3 - 1; };
  const root = lin('#6a5a30'), mid = lin('#a89858'), tip = lin('#d6c88e'), stalk = lin('#b4a474'), pl0 = lin('#e2d4b4'), pl1 = lin('#fff4e0');
  // one ribbon along a bent line: points [x, y, z], widths, colours; it faces across its own lean
  const ribbon = (pts, ws, cols, ax, az, sway) => {
    let prev = null;
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], w = ws[i], n = [ax * 0.35, 1, az * 0.35], l = Math.hypot(n[0], 1, n[2]), nn = [n[0] / l, 1 / l, n[2] / l], r = p[1] / H;
      const a = v([p[0] + az * w, p[1], p[2] - ax * w], nn, cols[i], sway * r * r, 0.5 * r), b = v([p[0] - az * w, p[1], p[2] + ax * w], nn, cols[i], sway * r * r, 0.5 * r);
      if (prev) I.push(prev[0], prev[1], b, prev[0], b, a);
      prev = [a, b];
    }
  };
  for (let i = 0; i < nb; i++) {
    const a = rng.range(0, TAU), ax = Math.cos(a), az = Math.sin(a), L = H * rng.range(0.42, 0.7), out = L * rng.range(0.45, 0.85), r0 = rng.range(0, 0.22), w = rng.range(0.035, 0.06);
    const at = (t) => [ax * (r0 + out * t * t), L * (t - 0.42 * t * t * t), az * (r0 + out * t * t)];
    ribbon([at(0), at(0.4), at(0.75), at(1)], [w, w * 0.85, w * 0.5, 0.004], [root, mid, tip, tip], ax, az, 0.5);
  }
  for (let i = 0; i < np; i++) {
    const a = rng.range(0, TAU), ax = Math.cos(a), az = Math.sin(a), h = H * rng.range(0.7, 0.98), out = rng.range(0.1, 0.5), r0 = rng.range(0, 0.15), len = rng.range(0.9, 1.25), wd = rng.range(0.15, 0.21);
    const at = (t) => [ax * (r0 + out * t * t), h * t, az * (r0 + out * t * t)], top = at(1);
    ribbon([at(0), at(0.5), top], [0.022, 0.016, 0.01], [mid, stalk, stalk], ax, az, 0.55);
    for (let k = 0; k < 2; k++) {
      const ca = a + 0.6 + k * Math.PI / 2, cx = Math.cos(ca), cz = Math.sin(ca); let prev = null;
      for (let j = 0; j <= 3; j++) {
        const r = j / 3, y = top[1] - 0.12 + len * (r - 0.28 * r * r), bx = top[0] + ax * 0.5 * len * r * r, bz = top[2] + az * 0.5 * len * r * r, ww = wd * (0.55 + 0.9 * r - 0.75 * r * r), col = mix3(pl0, pl1, r), sw = 0.55 * (y / H) * (y / H) + 0.25 * r, tv = lerp(cell[3], cell[1], r);
        const i0 = v([bx - cx * ww, y, bz - cz * ww], [ax * 0.4, 0.9, az * 0.4], col, sw, 0.4 + 0.6 * r, cell[0], tv), i1 = v([bx + cx * ww, y, bz + cz * ww], [ax * 0.4, 0.9, az * 0.4], col, sw, 0.4 + 0.6 * r, cell[2], tv);
        if (prev) I.push(prev[0], prev[1], i1, prev[0], i1, i0);
        prev = [i0, i1];
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3));
  g.setAttribute('wind', new THREE.Float32BufferAttribute(Wd, 4)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  g.computeBoundingSphere(); g.computeBoundingBox();
  g.userData = { triangles: I.length / 3, height: g.boundingBox.max.y, radius: Math.max(g.boundingBox.max.x, -g.boundingBox.min.x, g.boundingBox.max.z, -g.boundingBox.min.z), glowColor: null, kind: 'grass' };
  return g;
}
