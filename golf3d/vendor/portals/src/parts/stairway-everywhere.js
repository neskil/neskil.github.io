// THE TRIPLE FALL: hero set piece for the world "stairway-everywhere".
//
// A 190 m cube-cage atrium of pale stone (twelve arcaded edge galleries, eight domed corner pavilions,
// each built upright for its OWN gravity) in whose centre hangs a slowly turning 25 m sphere of water.
// Three broken aqueducts cantilever into the void from three perpendicular directions and each pours
// along its own "down": one falls down onto the top of the sphere, one falls sideways to the left
// (-X) into its right flank, one falls UPWARD into its underside. Giant goldfish circle inside the
// sphere (some leap out of it in arcs), three suns are refracted through it, and the water drains
// away down a fourth staircase of cascades whose "down" is -Z, so it lies on its side and recedes to
// the back-left. Flying stair flights cut the corners of every face, each for a different gravity.
//
// SPACE     origin = base centre, +Y up, front = +Z (the camera enters from +Z travelling toward -Z).
//           The sphere centre is at (0, 112, 0). Nothing here moves except water, fish, mist, lanterns.
// SIZE      radius ~112 m (gallery centre lines at +-82 m, domes and pendants reach +-112; corners at
//           ~150 m in plan), height ~224 m. The clear void inside is ~150 m across.
// COST      ~107k triangles, 8 draw calls, no lights, no render targets, no textures. Build ~150-300 ms.
// LIGHT     Stone is one MeshStandardMaterial mesh (vertex colours + procedural ashlar/checker detail):
//           it takes the scene's lights and fog. It is art-directed for the brief's three keys (warm
//           white from above, peach from the left/-X, cool lilac from ahead/-Z) and already carries a
//           gentle per-axis albedo tint so the three face tones survive any lighting. Water, sphere,
//           fish and mist are unlit shaders lit by three "suns": opts.suns (world-space directions
//           TOWARD each sun + colours) or the brief defaults. All shaders honour scene fog.
//
// OPTS      palette   7 hex strings in the brief's order: ivory, sand, shadow stone, periwinkle haze,
//                     plum, water teal, coral accent (lanterns, goldfish, oranges)
//           suns      [{ dir:[x,y,z], color:'#hex', intensity }, x3]  default: up / -X / -Z
//           fish      number of goldfish (default 46 +- seed)
//           detail    0.6..1.2 scales stair-bridge and tree counts (default 1)
//           selfLight 0..1.5 (default 0.5): strength of the built-in three-sun + haze ambient on the stone, so
//                     faces keep their ivory / peach / lilac tones even under weak scene lights. With three
//                     strong DirectionalLights of your own, drop it to ~0.25.
//
// PROGRESS  hero.setProgress(u) with the world's path u (optionally hero.setWindow(u0, u1), default
//           0.45..0.64 = "into the atrium" .. "end of the half orbit"). Inside the window the falls
//           surge, ripple rings run over the sphere and the leaping goldfish breach one after another
//           as the camera rounds the sphere. If setProgress is never called the leaps loop on time.
//           hero.uniforms exposes { time, surge, prog, spin } for fine control.
//
// KIT       The world reuses this file's stone: exports makeBuilder, makeKit, makeBig, frame, makeStoneMaterial
//           (opts.rest: texture from aRP/aRN rest attributes for bent geometry; instancing aware; foliage sways),
//           and buildHero returns kit: { pal, style, U, stoneMaterial, waterMaterial, makeStone(opts) }.
//           boundsInSteps(geo, yld) is computeBoundingSphere() for a big merged geometry, with yields inside.
//
// ANCHORS   (all local space, Vector3 unless noted)
//           sphereCenter, sphereRadius      the water sphere (also hero.center)
//           entry   { position, facing }    belvedere at the middle of the +Z face, camera line y=112
//           exit    { position, facing }    belvedere at the middle of the -Z face
//           portalSeat { position, facing, radius }  where a 14 m portal fits if the world wants it in
//                        the atrium: centred in the -Z face above the exit belvedere, facing +Z. (The
//                        brief puts the real portal at the end of a colonnade after the second gallery;
//                        then attach that gallery's mouth here instead.)
//           flyThrough   ordered points: in through +Z, straight at the sphere, then a late half orbit round its +X side at
//                        ~35 m that rises to pass 10 m OVER the sideways fall, out through -Z. Every
//                        point is >= 10 m from all solids and water.
//           viewpoints   { front, orbitApex, high, low }: good camera positions
//           falls        [{ lip, end, gravity }] x3 (down, sideways, up): for extra mist, birds, sound
//           cascade      { top, bottom, gravity, along }: the draining staircase
//           walkways     [{ a, b, up }]: deck centre lines of the 12 edge galleries with each one's own
//                        "up", for seating figures / trees with per-instance gravity
//           suns         the three default sun directions (toward each sun)
import * as THREE from 'three';
import { clamp, lerp, smoothstep as sst, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#f6e8d0', '#e6c9a0', '#b89a7a', '#8f96c4', '#2f2a44', '#3fb8c9', '#ff7a4a'];
const CY = 112;         // sphere centre height above the base (lowest pendant tip sits at y = 0)
const HF = 82;          // distance of the edge-gallery centre lines from the atrium axes
const SR = 12.5;        // sphere radius
const FALL = 62;        // lip distance from the sphere centre along each aqueduct's "up"

// ---------------------------------------------------------------------------------------------
// Geometry builder: flat-shaded, non-indexed triangles with vertex colour and a material kind.
// kind: 0 ashlar stone, 1 checkerboard floor, 2 lantern (emissive), 3 foliage, 4 plain (no joints)
// ---------------------------------------------------------------------------------------------
export function makeBuilder(maxTris) {
  // (the arrays start at the size asked for and grow by half when full: a builder can be sized to what it uses, with nothing
  //  dropped if a set grows; big buffers that are mostly empty are what provoke a collection pause while a world loads)
  let cap = Math.max(64, Math.ceil(maxTris)) * 3;      // in vertices
  let P = new Float32Array(cap * 3), N = new Float32Array(cap * 3), C = new Float32Array(cap * 3), K = new Float32Array(cap);
  const more = (a, len) => { const o = new Float32Array(len); o.set(a); return o; };
  const grow = () => { cap = Math.ceil(cap * 0.5) * 3; P = more(P, cap * 3); N = more(N, cap * 3); C = more(C, cap * 3); K = more(K, cap); };
  let n = 0;
  let M = new THREE.Matrix4();
  const stack = [];
  // st.axis = [x, z] (current frame) rounds the normals of what follows about that vertical axis: foliage masses shade
  // as soft columns, not as faceted shards. null = flat shading.
  const st = { r: 1, g: 1, b: 1, kind: 0, tint: 1, axis: null };
  const wa = [0, 0, 0], wb = [0, 0, 0], wc = [0, 0, 0], wr = [0, 0, 0], wq = [0, 0, 0], wp = [0, 0, 0];
  const xf = (p, o) => { const e = M.elements, x = p[0], y = p[1], z = p[2];
    o[0] = e[0] * x + e[4] * y + e[8] * z + e[12]; o[1] = e[1] * x + e[5] * y + e[9] * z + e[13]; o[2] = e[2] * x + e[6] * y + e[10] * z + e[14]; };
  // triangle a,b,c (local arrays), oriented AWAY from ref (or TOWARD it when toward=true); s = shade
  function tri(a, b, c, ref, toward, sa = 1, sb = sa, sc = sa) {
    if (n + 3 > cap) grow();
    xf(a, wa); xf(b, wb); xf(c, wc); xf(ref, wr);
    let ux = wb[0] - wa[0], uy = wb[1] - wa[1], uz = wb[2] - wa[2], vx = wc[0] - wa[0], vy = wc[1] - wa[1], vz = wc[2] - wa[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz); if (l < 1e-9) return; nx /= l; ny /= l; nz /= l;
    const d = nx * (wa[0] - wr[0]) + ny * (wa[1] - wr[1]) + nz * (wa[2] - wr[2]);
    const flip = toward ? d > 0 : d < 0;
    if (flip) { nx = -nx; ny = -ny; nz = -nz; }
    // per-axis albedo tone: tops ivory, undersides lilac-plum, X faces peach, Z faces cool lilac
    const t = st.tint, ax = nx * nx, ay = ny * ny, az = nz * nz;
    const tr = 1 + t * (ay * (ny > 0 ? 0.03 : -0.17) + ax * 0.01 + az * -0.10);
    const tg = 1 + t * (ay * (ny > 0 ? 0.00 : -0.19) + ax * -0.08 + az * -0.08);
    const tb = 1 + t * (ay * (ny > 0 ? -0.05 : -0.06) + ax * -0.17 + az * 0.04);
    const o = n * 3, A = flip ? wc : wb, B = flip ? wb : wc, s2 = flip ? sc : sb, s3 = flip ? sb : sc;
    P[o] = wa[0]; P[o + 1] = wa[1]; P[o + 2] = wa[2]; P[o + 3] = A[0]; P[o + 4] = A[1]; P[o + 5] = A[2]; P[o + 6] = B[0]; P[o + 7] = B[1]; P[o + 8] = B[2];
    for (let i = 0; i < 9; i += 3) { N[o + i] = nx; N[o + i + 1] = ny; N[o + i + 2] = nz; }
    if (st.axis) { const loc = [a, flip ? c : b, flip ? b : c];
      for (let i = 0; i < 3; i++) { const p = loc[i], r = Math.hypot(p[0] - st.axis[0], p[2] - st.axis[1]);
        wq[0] = st.axis[0]; wq[1] = p[1] - 0.3 * r - 0.02; wq[2] = st.axis[1]; xf(wq, wp); const w = i === 0 ? wa : i === 1 ? A : B;
        let sx = w[0] - wp[0], sy = w[1] - wp[1], sz = w[2] - wp[2]; const sl = Math.hypot(sx, sy, sz) || 1;
        sx = nx * 0.22 + sx / sl * 0.78; sy = ny * 0.22 + sy / sl * 0.78; sz = nz * 0.22 + sz / sl * 0.78; const l2 = Math.hypot(sx, sy, sz) || 1;
        N[o + i * 3] = sx / l2; N[o + i * 3 + 1] = sy / l2; N[o + i * 3 + 2] = sz / l2; } }
    const sh = [sa, s2, s3];
    for (let i = 0; i < 3; i++) { C[o + i * 3] = st.r * tr * sh[i]; C[o + i * 3 + 1] = st.g * tg * sh[i]; C[o + i * 3 + 2] = st.b * tb * sh[i]; K[n + i] = st.kind; }
    n += 3;
  }
  function quad(a, b, c, d, ref, toward, sa = 1, sb = sa, sc = sb, sd = sa) { tri(a, b, c, ref, toward, sa, sb, sc); tri(a, c, d, ref, toward, sa, sc, sd); }
  const B = {
    st, tri, quad,
    get tris() { return n / 3; },
    push(m) { stack.push(M); M = M.clone().multiply(m); },
    pop() { M = stack.pop(); },
    at(m, fn) { B.push(m); fn(); B.pop(); },
    pt(p) { const o = [0, 0, 0]; xf(p, o); return o; },
    color(c, kind = 0, tint = 1) { st.r = c.r; st.g = c.g; st.b = c.b; st.kind = kind; st.tint = tint; },
    // axis-aligned box from min to max corner; sb = shade of the -Y face (baked AO), skipBottom/Top
    box(x0, y0, z0, x1, y1, z1, sb = 0.8, skip = 0) {
      const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2];
      const v = (i) => [i & 1 ? x1 : x0, i & 2 ? y1 : y0, i & 4 ? z1 : z0];
      quad(v(0), v(4), v(6), v(2), c, false, sb, sb, 1, 1); quad(v(1), v(5), v(7), v(3), c, false, sb, sb, 1, 1);
      quad(v(0), v(1), v(3), v(2), c, false, sb, sb, 1, 1); quad(v(4), v(5), v(7), v(6), c, false, sb, sb, 1, 1);
      if (!(skip & 1)) quad(v(0), v(1), v(5), v(4), c, false, sb);
      if (!(skip & 2)) quad(v(2), v(3), v(7), v(6), c, false, 1);
    },
    // chamfered box (44 triangles): for prominent blocks so edges catch light
    cbox(x0, y0, z0, x1, y1, z1, bv = 0.3, sb = 0.8) {
      const c = [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], h = [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2];
      const V = (ax, sx, sy, sz) => { const s = [sx, sy, sz], p = [0, 0, 0]; for (let i = 0; i < 3; i++) p[i] = c[i] + s[i] * (h[i] - (i === ax ? 0 : bv)); return p; };
      const sh = (p) => (p[1] < c[1] ? sb : 1);
      const Q = (a, b, cc, d) => quad(a, b, cc, d, c, false, sh(a), sh(b), sh(cc), sh(d));
      for (const s of [-1, 1]) {
        Q(V(0, s, -1, -1), V(0, s, 1, -1), V(0, s, 1, 1), V(0, s, -1, 1));
        Q(V(1, -1, s, -1), V(1, 1, s, -1), V(1, 1, s, 1), V(1, -1, s, 1));
        Q(V(2, -1, -1, s), V(2, 1, -1, s), V(2, 1, 1, s), V(2, -1, 1, s));
        for (const t of [-1, 1]) {
          Q(V(0, s, t, -1), V(0, s, t, 1), V(1, s, t, 1), V(1, s, t, -1));
          Q(V(0, s, -1, t), V(0, s, 1, t), V(2, s, 1, t), V(2, s, -1, t));
          Q(V(1, -1, s, t), V(1, 1, s, t), V(2, 1, s, t), V(2, -1, s, t));
          for (const u of [-1, 1]) { const a = V(0, s, t, u), b = V(1, s, t, u), cc = V(2, s, t, u); tri(a, b, cc, c, false, sh(a), sh(b), sh(cc)); }
        }
      }
    },
    // wall panel x:[-w/2,w/2] y:[0,h] z:[-d/2,d/2] pierced by an arch (opening width ow, springing sh,
    // rise factor rz: 1 = semicircle, >1 stilted/pointed-ish). Intrados gets baked AO.
    archWall(w, h, d, ow, sh, rz = 1, seg = 8, ao = 0.62, plain = false) {
      const r = ow / 2, hz = d / 2, mid = [0, sh, 0], body = [w / 2 - 0.2, h - 0.1, 0];
      const pts = [];
      for (let i = 0; i <= seg; i++) { const a = Math.PI * (1 - i / seg); const cs = Math.cos(a), sn = Math.sin(a);
        const pw = rz > 1.01 ? Math.pow(sn, 0.8) : sn; pts.push([r * cs, Math.min(h - 0.4, sh + r * rz * pw)]); }
      for (const z of [-hz, hz]) {
        const ref = [0, h / 2, 0];
        quad([-w / 2, 0, z], [-r, 0, z], [-r, h, z], [-w / 2, h, z], ref, false, 0.86, 0.8, 1, 1);
        quad([r, 0, z], [w / 2, 0, z], [w / 2, h, z], [r, h, z], ref, false, 0.8, 0.86, 1, 1);
        for (let i = 0; i < seg; i++) { const a = pts[i], b = pts[i + 1]; quad([a[0], a[1], z], [b[0], b[1], z], [b[0], h, z], [a[0], h, z], ref, false, 0.84, 0.84, 1, 1); }
      }
      // jambs + soffit (oriented toward the opening)
      quad([-r, 0, -hz], [-r, 0, hz], [-r, sh, hz], [-r, sh, -hz], mid, true, ao * 1.15, ao * 1.15, ao, ao);
      quad([r, 0, -hz], [r, 0, hz], [r, sh, hz], [r, sh, -hz], mid, true, ao * 1.15, ao * 1.15, ao, ao);
      for (let i = 0; i < seg; i++) { const a = pts[i], b = pts[i + 1]; quad([a[0], a[1], -hz], [a[0], a[1], hz], [b[0], b[1], hz], [b[0], b[1], -hz], [0, sh - r, 0], true, ao); }
      quad([-w / 2, h, -hz], [w / 2, h, -hz], [w / 2, h, hz], [-w / 2, h, hz], [0, 0, 0], false);
      quad([-w / 2, 0, -hz], [-w / 2, 0, hz], [-w / 2, h, hz], [-w / 2, h, -hz], body, false);
      quad([w / 2, 0, -hz], [w / 2, 0, hz], [w / 2, h, hz], [w / 2, h, -hz], [-body[0], body[1], 0], false);
      if (plain) return;
      // imposts and keystone (secondary detail)
      const iw = 0.9, ih = 0.55, pj = 0.28;
      B.box(-r - iw, sh - ih, -hz - pj, -r + 0.12, sh, hz + pj, 0.75); B.box(r - 0.12, sh - ih, -hz - pj, r + iw, sh, hz + pj, 0.75);
      const kt = pts[seg >> 1][1]; B.box(-0.55, kt - 0.5, -hz - pj, 0.55, Math.min(h, kt + 1.3), hz + pj, 0.75);
    },
    // tapered n-gon shaft along +Y with square plinth and abacus
    column(x, z, y0, y1, r, sides = 8) {
      const hgt = y1 - y0, pb = Math.min(0.6, hgt * 0.08), ref = [x, (y0 + y1) / 2, z];
      B.box(x - r * 1.35, y0, z - r * 1.35, x + r * 1.35, y0 + pb, z + r * 1.35);
      B.box(x - r * 1.3, y1 - pb, z - r * 1.3, x + r * 1.3, y1, z + r * 1.3, 0.7);
      for (let i = 0; i < sides; i++) { const a0 = (i / sides) * 6.2832, a1 = ((i + 1) / sides) * 6.2832, rt = r * 0.82;
        quad([x + Math.cos(a0) * r, y0 + pb, z + Math.sin(a0) * r], [x + Math.cos(a1) * r, y0 + pb, z + Math.sin(a1) * r],
          [x + Math.cos(a1) * rt, y1 - pb, z + Math.sin(a1) * rt], [x + Math.cos(a0) * rt, y1 - pb, z + Math.sin(a0) * rt], ref, false, 0.85, 0.85, 1, 1); }
    },
    // surface of revolution about +Y through (x,z): profile = [[radius, y], ...]
    lathe(x, z, prof, sides = 10, s0 = 1, s1 = 1) {
      const ref = [x, (prof[0][1] + prof[prof.length - 1][1]) / 2, z];
      for (let j = 0; j < prof.length - 1; j++) { const [r0, y0] = prof[j], [r1, y1] = prof[j + 1];
        const sa = lerp(s0, s1, j / (prof.length - 1)), sb2 = lerp(s0, s1, (j + 1) / (prof.length - 1));
        for (let i = 0; i < sides; i++) { const a0 = (i / sides) * 6.2832, a1 = ((i + 1) / sides) * 6.2832;
          const p0 = [x + Math.cos(a0) * r0, y0, z + Math.sin(a0) * r0], p1 = [x + Math.cos(a1) * r0, y0, z + Math.sin(a1) * r0];
          const p2 = [x + Math.cos(a1) * r1, y1, z + Math.sin(a1) * r1], p3 = [x + Math.cos(a0) * r1, y1, z + Math.sin(a0) * r1];
          if (r0 < 1e-4) tri(p0, p2, p3, ref, false, sa, sb2, sb2); else if (r1 < 1e-4) tri(p0, p1, p2, ref, false, sa, sa, sb2); else quad(p0, p1, p2, p3, ref, false, sa, sa, sb2, sb2); } }
    },
    // (views of the builder's own arrays, not copies: the same numbers with half the memory traffic while a world loads)
    finish() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P.subarray(0, n * 3), 3));
      g.setAttribute('normal', new THREE.BufferAttribute(N.subarray(0, n * 3), 3));
      g.setAttribute('color', new THREE.BufferAttribute(C.subarray(0, n * 3), 3));
      g.setAttribute('aK', new THREE.BufferAttribute(K.subarray(0, n), 1));
      return g;
    },
  };
  return B;
}

// geometry.computeBoundingSphere() for a big merged geometry, done in steps so a frame can be handed back between
// them (`yld`, optional). It gives the same sphere: the centre of the bounding box and the furthest vertex from it.
export async function boundsInSteps(geo, yld) {
  const p = geo.attributes.position.array, n = p.length, STEP = 15000;
  let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
  for (let i = 0; i < n; i += 3) {
    if (yld && i && i % STEP === 0) await yld();
    const x = p[i], y = p[i + 1], z = p[i + 2];
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z;
  }
  const c = new THREE.Vector3(x0, y0, z0).add(new THREE.Vector3(x1, y1, z1)).multiplyScalar(0.5);
  let r2 = 0;
  for (let i = 0; i < n; i += 3) {
    if (yld && i && i % STEP === 0) await yld();
    const dx = c.x - p[i], dy = c.y - p[i + 1], dz = c.z - p[i + 2], d = dx * dx + dy * dy + dz * dz; if (d > r2) r2 = d;
  }
  geo.boundingSphere = new THREE.Sphere(c, Math.sqrt(r2));
}

// rigid frame from two perpendicular unit axes (local X -> ax, local Y -> ay, local Z -> ax x ay)
export function frame(ax, ay, px = 0, py = 0, pz = 0) {
  const x = new THREE.Vector3(...ax), y = new THREE.Vector3(...ay), z = new THREE.Vector3().crossVectors(x, y);
  return new THREE.Matrix4().makeBasis(x, y, z).setPosition(px, py, pz);
}
const AXES = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const neg = (a) => [-a[0], -a[1], -a[2]];

// ---------------------------------------------------------------------------------------------
// (round 7) The roof deck of an edge gallery whose own up points into the atrium, dressed as a terrace: a pale band across the
// checker at every bay, a capital block with a finial at each end, a lantern kiosk the walkers pass through at the middle and
// two lamp standards. Gallery frame; the deck's top is y = 14.03. No random draw (tone and lantern make none).
function dressDeck(B, K, L, bays) {
  const yd = 14.03, bw = L / bays, h = L / 2;
  for (let i = 0; i <= bays; i++) { const x = -h + i * bw, x0 = Math.max(-h, x - 1.1), x1 = Math.min(h, x + 1.1);
    K.tone(0.02, 4); B.st.r *= 1.75; B.st.g *= 1.58; B.st.b *= 1.55; B.quad([x0, yd + 0.04, -5.4], [x1, yd + 0.04, -5.4], [x1, yd + 0.04, 5.4], [x0, yd + 0.04, 5.4], [x, 0, 0], false); }
  for (const s of [-1, 1]) { const xa = s * (h - 8.2), xb = s * (h - 0.6), xm = (xa + xb) / 2;
    K.tone(0.3); B.box(Math.min(xa, xb), yd, -5.7, Math.max(xa, xb), yd + 1.7, 5.7, 0.7, 1);
    K.tone(0.3, 4); B.st.r *= 1.4; B.st.g *= 1.32; B.st.b *= 1.5; B.lathe(xm, 0, [[3.3, yd + 1.7], [1.9, yd + 3.4], [0, yd + 7.2]], 4, 0.9, 1.05);
    const xl = s * bw * 2, zl = s * 3.9;
    K.tone(0.4); B.box(xl - 0.3, yd, zl - 0.3, xl + 0.3, yd + 5.2, zl + 0.3, 0.7, 3); K.lantern(xl, yd + 5.2, zl, 0.62); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { K.tone(0.14); B.box(sx * 3.4 - 0.5, yd, sz * 3.3 - 0.5, sx * 3.4 + 0.5, yd + 6.6, sz * 3.3 + 0.5, 0.7, 3); }
  K.tone(0.3); B.box(-4.5, yd + 6.6, -4.4, 4.5, yd + 7.6, 4.4, 0.55);
  K.tone(0.05, 4); B.st.r *= 1.5; B.st.g *= 1.4; B.st.b *= 1.62; B.lathe(0, 0, [[5.0, yd + 7.6], [3.2, yd + 9.6], [0, yd + 12.4]], 8, 0.9, 1.05);      // (lifted: its shadow side is lilac, not navy)
  K.lantern(0, yd + 12.3, 0, 0.7);
}

// (round 7) The near end of the arcade under the cascade (cascade frame: its own up is +Y, its ground slab lies at y = -71):
// the two pier ends that stood as plain beams take a base, two bands and a capital; a balcony with a balustrade and lanterns
// spans them nine metres above the slab; the slab's blank end takes a cornice. The kit is the caller's own (its own stream).
function dressArcadeEnd(B, K, lil) {
  for (const sx of [-1, 1]) { const x = sx * 7.2;
    K.tone(0.4); B.box(x - 1.75, -71, 37.55, x + 1.75, -68.6, 38.6, 0.7, 1);
    for (const y of [-52.5, -43.5]) { K.tone(0.08); B.box(x - 1.55, y, 37.7, x + 1.55, y + 0.7, 38.4, 0.7); }
    K.tone(0.3); B.box(x - 1.8, -34.4, 37.5, x + 1.8, -32.6, 38.6, 0.7);
    K.tone(0.05); B.box(x - 2.1, -32.6, 37.3, x + 2.1, -31.8, 38.6, 0.7);
    K.tone(0.45); B.box(x - 0.6, -64.2, 35.6, x + 0.6, -61.7, 38.0, 0.7); }
  K.tone(0.35); B.box(-9.6, -61.7, 34.6, 9.6, -61.0, 38.0, 0.6);
  K.tone(0.2, 1); B.quad([-9.3, -60.97, 35.3], [9.3, -60.97, 35.3], [9.3, -60.97, 38.0], [-9.3, -60.97, 38.0], [0, -70, 36], false);
  K.balustrade(-9.3, 9.3, -61.0, 34.95, 2);
  K.tone(0.05); B.box(-9.7, -71.25, 35.7, 9.7, -70.75, 36.3, 0.7);
  // the slab's end, a blank plate toward the atrium: a pale frame, three fields of lilac shadow in it, a lantern at each end
  K.tone(0.03, 4); B.st.r *= 1.3; B.st.g *= 1.25; B.st.b *= 1.3; B.quad([-8.9, -73.3, 35.97], [8.9, -73.3, 35.97], [8.9, -71.45, 35.97], [-8.9, -71.45, 35.97], [0, -72.3, 40], false);
  for (let i = -1; i <= 1; i++) { B.color(lil, 4, 0); B.quad([i * 5.8 - 2.6, -73.05, 35.94], [i * 5.8 + 2.6, -73.05, 35.94], [i * 5.8 + 2.6, -71.7, 35.94], [i * 5.8 - 2.6, -71.7, 35.94], [0, -72.3, 40], false, 0.8, 0.8, 1, 1); }
  for (const sx of [-1, 1]) B.at(frame([1, 0, 0], [0, 0, -1], sx * 9.0, -72.3, 36), () => K.lantern(0, 0, 0, 0.5));
}

// Architectural assemblies (all built in a local frame: +Y is that element's own "up")
// ---------------------------------------------------------------------------------------------
export function makeKit(B, pal, rng, style) {
  const ivory = pal[0].clone().multiplyScalar(0.86), sand = pal[0].clone().lerp(pal[1], 0.7).multiplyScalar(0.82), shade = pal[2].clone().multiplyScalar(0.85);
  const tmp = new THREE.Color();
  const stone = (v = 0, k = 0) => { tmp.copy(ivory).lerp(sand, clamp(v + rng.range(-0.06, 0.06), 0, 1)); B.color(tmp, k); };
  const dark = (v = 0.5) => { tmp.copy(sand).lerp(shade, v); B.color(tmp, 0); };
  const tone = (v = 0, k = 0) => { tmp.copy(ivory).lerp(sand, clamp(v, 0, 1)); B.color(tmp, k); };      // stone() without the random draw
  const deep = (v = 0) => { tmp.copy(pal[4]).lerp(pal[5], 0.25 + v * 0.3).multiplyScalar(0.5 + v * 0.4); B.color(tmp, 4, 0); };   // the bed of a pool
  const roof = () => { tmp.copy(pal[1]).lerp(pal[6], style.roofWarm * 0.6).multiplyScalar(0.74); B.color(tmp, 4); };
  const lamp = () => { tmp.copy(pal[6]).lerp(pal[0], 0.25); B.color(tmp, 2, 0); };
  const leaf = (v) => { tmp.setRGB(0.112 + v * 0.05, 0.215 + v * 0.062, 0.158 + v * 0.036); B.color(tmp, 3, 0.3); };   // deep green to sage, cool enough to stay green under three warm suns
  // foliage mass: a lathe with a slight spiral, per-vertex radius jitter and per-facet colour, so it never reads as a cone
  const tuft = (x, z, prof, n, jit, v0, s0, s1, ph0) => {
    const ph = ph0 === undefined ? rng.range(0, 6.283) : ph0, m = prof.length - 1, yLo = prof[0][1], yHi = prof[m][1];
    const P = (j, i) => { const r = prof[j][0], t = (prof[j][1] - yLo) / (yHi - yLo), a = ((i % n) / n) * 6.2832 + ph + t * 1.1;
      const rr = r * (1 + jit * Math.sin((i % n) * 2.4 + j * 1.9 + ph * 3)); return [x + Math.cos(a) * rr, prof[j][1] + (r > 1e-4 && j ? jit * 1.6 * r * Math.sin((i % n) * 1.7 + j * 2.3 + ph) : 0), z + Math.sin(a) * rr]; };
    B.st.axis = [x, z];
    for (let j = 0; j < m; j++) { const ref = [x, (prof[j][1] + prof[j + 1][1]) / 2, z], sa = lerp(s0, s1, j / m), sb = lerp(s0, s1, (j + 1) / m);
      for (let i = 0; i < n; i++) { leaf(clamp(v0 + 0.25 * Math.sin(i * 1.3 + j * 2.1 + ph * 2) + 0.12 * Math.sin(i * 3.1 + j), 0, 1.6));
        if (prof[j][0] < 1e-4) B.tri(P(j, i), P(j + 1, i + 1), P(j + 1, i), ref, false, sa, sb, sb); else B.quad(P(j, i), P(j, i + 1), P(j + 1, i + 1), P(j + 1, i), ref, false, sa, sa, sb, sb); } }
    B.st.axis = null;
    return ph;
  };
  const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  const RY = (a) => new THREE.Matrix4().makeRotationY(a);
  const lanterns = [];   // local-frame lantern positions are pushed through B's matrix by the caller
  const K = {
    stone, dark, tone, deep, roof, lamp, leaf, tuft, T, RY, lanterns,
    lantern(x, y, z, s = 0.42) {
      dark(0.8); B.box(x - s * 0.5, y, z - s * 0.5, x + s * 0.5, y + s * 0.5, z + s * 0.5);
      lamp(); B.lathe(x, z, [[s * 0.8, y + s * 0.5], [s * 1.3, y + s * 1.25], [s * 1.2, y + s * 2.6]], 4, 0.5, 1.05);
      dark(0.8); B.lathe(x, z, [[s * 1.7, y + s * 2.55], [s * 0.5, y + s * 3.4], [0, y + s * 4.1]], 4);
      K.lanterns.push([...B.pt([x, y + s * 1.5, z]), s]);
    },
    // rail along local X at height y, depth position z; posts, piers and occasional lanterns
    // (round 7: merged = +1 or -1, the side of z the deck's outer edge lies on, for decks that no course comes near: each baluster
    //  is then one panel of a screen between the rails, in its own drawn tone, on the outer face, and the inner face is one plain
    //  screen: some 80 triangles in place of some 300. Every draw is made and used as before.)
    balustrade(x0, x1, y, z, lampEvery = 0, merged = 0) {
      const L = x1 - x0, nP = Math.max(2, Math.round(L / 2.4)), dx = L / nP;
      stone(0.15); B.box(x0, y, z - 0.3, x1, y + 0.22, z + 0.3); B.box(x0, y + 1.05, z - 0.34, x1, y + 1.32, z + 0.34, 0.7);
      for (let i = 0; i <= nP; i++) { const x = x0 + i * dx, pier = i % 4 === 0;
        if (pier) { stone(0.3); B.box(x - 0.42, y, z - 0.42, x + 0.42, y + 1.62, z + 0.42);
          if (lampEvery && (i / 4) % lampEvery === 0) K.lantern(x, y + 1.62, z); else { B.lathe(x, z, [[0.4, y + 1.62], [0.26, y + 1.9], [0, y + 2.25]], 4); } }
        else { stone(0.05); if (!merged) B.box(x - 0.16, y + 0.22, z - 0.16, x + 0.16, y + 1.05, z + 0.16, 0.9, 3);
          else { const zo = z + merged * 0.1, xa = Math.max(x0, x - dx / 2), xb = Math.min(x1, x + dx / 2); B.st.r *= 0.8; B.st.g *= 0.8; B.st.b *= 0.88;
            B.quad([xa, y + 0.22, zo], [xb, y + 0.22, zo], [xb, y + 1.05, zo], [xa, y + 1.05, zo], [x, y + 0.6, z], false, 0.9, 0.9, 1, 1); } } }
      if (merged) { const zi = z - merged * 0.1; tone(0.36); B.st.r *= 0.8; B.st.g *= 0.8; B.st.b *= 0.88;
        B.quad([x0, y + 0.22, zi], [x1, y + 0.22, zi], [x1, y + 1.05, zi], [x0, y + 1.05, zi], [(x0 + x1) / 2, y + 0.6, z], false, 0.9, 0.9, 1, 1); }
    },
    cypress(x, y, z, h) {
      dark(0.55); B.lathe(x, z, [[0.75, y], [1.0, y + 0.9], [0.85, y + 1.0]], 6); B.column(x, z, y + 0.9, y + 1.9, 0.22, 5);
      const w = h * 0.125, b = y + 1.7;
      const v0 = 0.3 + rng() * 0.5;
      const ph = tuft(x, z, [[w * 0.28, b], [w * 0.86, b + h * 0.08], [w * 1.06, b + h * 0.22], [w * 0.98, b + h * 0.42], [w * 0.62, b + h * 0.6], [0, b + h * 0.7]], 16, 0.12, v0, 0.6, 1.05);
      tuft(x, z, [[w * 0.3, b + h * 0.3], [w * 0.84, b + h * 0.46], [w * 0.72, b + h * 0.64], [w * 0.45, b + h * 0.8], [w * 0.2, b + h * 0.93], [0, b + h * 1.04]], 14, 0.13, v0 + 0.25, 0.8, 1.22, ph + 2.1);
    },
    orangeTree(x, y, z, s) {
      dark(0.5); B.cbox(x - s, y, z - s, x + s, y + s * 1.2, z + s, 0.12 * s); B.column(x, z, y + s * 1.2, y + s * 2.8, s * 0.16, 5);
      tuft(x, z, [[0, y + s * 2.4], [s * 0.95, y + s * 2.7], [s * 1.45, y + s * 3.3], [s * 1.55, y + s * 3.95], [s * 1.2, y + s * 4.6], [s * 0.6, y + s * 5.0], [0, y + s * 5.15]], 12, 0.1, 0.7, 0.66, 1.2);
      lamp(); for (let i = 0; i < 5; i++) { const a = i * 1.257 + s, r = s * 1.38, yy = y + s * (3.2 + (i % 3) * 0.55);
        B.box(x + Math.cos(a) * r - 0.2, yy, z + Math.sin(a) * r - 0.2, x + Math.cos(a) * r + 0.2, yy + 0.4, z + Math.sin(a) * r + 0.2, 1); }
    },
    // straight flight from the origin, running +Z and rising +Y; x in [-w/2, w/2]
    flight(nS, run, rise, w, soffit = 1.5) {
      const hw = w / 2, Lz = nS * run, Hy = nS * rise;
      const ref = [0, Hy / 2 - soffit - 2, Lz / 2 + 2];
      for (let i = 0; i < nS; i++) { const z0 = i * run, z1 = z0 + run, y0 = i * rise, y1 = y0 + rise;
        stone(0.1 + 0.25 * ((i % 2))); B.st.kind = 4;
        // each step is oriented from its own interior, so risers and treads face out on flights of any length
        B.quad([-hw, y0, z0], [hw, y0, z0], [hw, y1, z0], [-hw, y1, z0], [0, y0, z0 + 1], false, 0.56, 0.56, 0.74, 0.74);
        B.quad([-hw, y1, z0], [hw, y1, z0], [hw, y1, z1], [-hw, y1, z1], [0, y1 - 1, z0], false, 1.03, 1.03, 0.8, 0.8);
        B.st.kind = 0;
        for (const sx of [-hw, hw]) B.quad([sx, y0 - soffit, z0], [sx, y1 - soffit, z1], [sx, y1, z1], [sx, y1, z0], [0, y0 - soffit, z0 + run], false, 0.8, 0.8, 1, 1); }
      // the soffit is somebody's floor too: a checkerboard (lifted, as if lamp-lit), not a blank dark slab
      stone(0.5, 1); { const r = B.st.r, g = B.st.g, b = B.st.b; B.st.r *= 1.45; B.st.g *= 1.3; B.st.b *= 1.2;
        B.quad([-hw, -soffit, 0], [hw, -soffit, 0], [hw, Hy - soffit, Lz], [-hw, Hy - soffit, Lz], [0, Hy, 0], false, 0.78);
        B.st.r = r; B.st.g = g; B.st.b = b; B.st.kind = 0; }
      B.quad([-hw, -soffit, 0], [hw, -soffit, 0], [hw, 0, 0], [-hw, 0, 0], [0, 0, 1], false, 0.7);
      // sloped parapets with a moulded rail and posts
      for (const sx of [-1, 1]) { const xa = sx * hw, xb = sx * (hw + 0.55), c = [(xa + xb) / 2, Hy / 2 + 0.5, Lz / 2];
        const P = (x, top, e) => [x, (e ? Hy : 0) + rise + (top ? 1.25 : -soffit * 0.4), e ? Lz : 0];
        stone(0.2);
        B.quad(P(xa, 0, 0), P(xa, 0, 1), P(xa, 1, 1), P(xa, 1, 0), c, false, 0.85, 0.85, 1, 1); B.quad(P(xb, 0, 0), P(xb, 0, 1), P(xb, 1, 1), P(xb, 1, 0), c, false, 0.85, 0.85, 1, 1);
        B.quad(P(xa, 1, 0), P(xa, 1, 1), P(xb, 1, 1), P(xb, 1, 0), c, false); B.quad(P(xa, 0, 0), P(xa, 0, 1), P(xb, 0, 1), P(xb, 0, 0), c, false, 0.6);
        B.quad(P(xa, 0, 0), P(xa, 1, 0), P(xb, 1, 0), P(xb, 0, 0), c, false); B.quad(P(xa, 0, 1), P(xa, 1, 1), P(xb, 1, 1), P(xb, 0, 1), c, false);
        const nP = Math.max(2, Math.round(Lz / 10));
        for (let i = 0; i <= nP; i++) { const f = i / nP, z = f * Lz, y = f * Hy + rise + 1.25, x = (xa + xb) / 2; stone(0.35);
          B.box(x - 0.5, y - 2.2, z - 0.5, x + 0.5, y + 0.5, z + 0.5);
          if (i % 2 === 0) K.lantern(x, y + 0.5, z, 0.36); else B.lathe(x, z, [[0.45, y + 0.5], [0, y + 1.3]], 4); } }
    },
    // one edge gallery: double arcade under a balustraded deck, running along local X
    // (galleryA then galleryB is the same gallery in two halves, so a builder can hand a frame back between them)
    gallery(L, bays, trees) { K.galleryA(L, bays); K.galleryB(L, bays, trees); },
    galleryA(L, bays, soffit = false) {
      const bw = L / bays, wallH = 12.5, rz = style.archRise;
      stone(0.45); B.cbox(-L / 2, -1.5, -6.4, L / 2, 0, 6.4, 0.35, 0.62);
      if (soffit) {      // the deck's underside is somebody's floor too: a checkerboard between two beams, lit by the lanterns that hang over it
        for (const zs of [-5.2, 5.2]) { tone(0.5); B.box(-L / 2, -2.1, zs - 0.4, L / 2, -1.5, zs + 0.4, 0.6); }
        tone(0.2, 1); B.st.r *= 1.7; B.st.g *= 1.45; B.st.b *= 1.3; B.quad([-L / 2 + 0.4, -1.53, -4.8], [L / 2 - 0.4, -1.53, -4.8], [L / 2 - 0.4, -1.53, 4.8], [-L / 2 + 0.4, -1.53, 4.8], [0, 0, 0], false, 0.9);
        for (let i = 0; i < bays; i++) B.at(frame([1, 0, 0], [0, -1, 0], -L / 2 + (i + 0.5) * bw, -1.53, 0), () => K.lantern(0, 0, 0, 0.45)); }
      stone(0.2, 1); B.quad([-L / 2, 0.03, -3.4], [L / 2, 0.03, -3.4], [L / 2, 0.03, 3.4], [-L / 2, 0.03, 3.4], [0, -5, 0], false, 0.8);
      for (let i = 0; i < bays; i++) { const x = -L / 2 + (i + 0.5) * bw;
        for (const z of [-4.7, 4.7]) { stone(0.05 + 0.1 * (i % 2)); B.at(T(x, 0, z), () => B.archWall(bw, wallH, 2.3, bw * 0.66, 5.4, rz, 8)); } }
    },
    galleryB(L, bays, trees, merged = false) {
      const bw = L / bays, wallH = 12.5;
      stone(0.3); if (merged) B.box(-L / 2, wallH, -6.9, L / 2, wallH + 0.6, 6.9, 0.6); else B.cbox(-L / 2, wallH, -6.9, L / 2, wallH + 0.6, 6.9, 0.2, 0.6);
      stone(0.12); if (merged) B.box(-L / 2, wallH + 0.6, -6.5, L / 2, wallH + 1.5, 6.5, 0.7); else B.cbox(-L / 2, wallH + 0.6, -6.5, L / 2, wallH + 1.5, 6.5, 0.25, 0.7);
      stone(0.2, 1); B.quad([-L / 2, wallH + 1.53, -5.4], [L / 2, wallH + 1.53, -5.4], [L / 2, wallH + 1.53, 5.4], [-L / 2, wallH + 1.53, 5.4], [0, 0, 0], false);
      K.balustrade(-L / 2 + 9, L / 2 - 9, wallH + 1.5, -6, 2, merged ? -1 : 0); K.balustrade(-L / 2 + 9, L / 2 - 9, wallH + 1.5, 6, 2, merged ? 1 : 0);
      for (let i = 0; i < trees; i++) { const x = -L / 2 + (rng.int(1, bays - 1)) * bw + rng.range(-1, 1), z = rng.pick([-3.2, 0, 3.2]);
        if (rng.chance(0.6)) K.cypress(x, wallH + 1.5, z, rng.range(9, 15)); else K.orangeTree(x, wallH + 1.5, z, rng.range(0.9, 1.3)); }
    },
    // corner pavilion: open arched cube, dome on its own "top", stepped pendant below
    // (pavilionA then pavilionB is the same pavilion in two halves, so a builder can hand a frame back between them)
    pavilion() { K.pavilionA(); K.pavilionB(); },
    pavilionA() {
      const rz = style.archRise;
      for (let k = 0; k < 4; k++) B.at(RY(k * Math.PI / 2).multiply(T(0, -11, 10)), () => { stone(0.1); B.archWall(22.4, 21, 2.4, 9.5, 9, rz, 8); });
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { stone(0.3); B.cbox(sx * 9.4, -11, sz * 9.4, sx * 12, 10, sz * 12, 0.3, 0.75); }
      stone(0.4); B.cbox(-12.8, -12.6, -12.8, 12.8, -11, 12.8, 0.4, 0.6); B.cbox(-13.2, 10, -13.2, 13.2, 11.6, 13.2, 0.4, 0.6);
      stone(0.2, 1); B.quad([-9, -10.97, -9], [9, -10.97, -9], [9, -10.97, 9], [-9, -10.97, 9], [0, -20, 0], false, 0.75);
    },
    pavilionB() {
      stone(0.25); B.lathe(0, 0, [[9.4, 11.6], [9.4, 12.4], [8.6, 12.4], [8.6, 14.6], [9, 14.6], [9, 15.2]], 12, 0.85, 1);
      roof(); const dp = []; for (let i = 0; i <= 6; i++) { const a = (i / 6) * Math.PI / 2; dp.push([8.5 * Math.cos(a), 15.2 + 8.5 * style.domeH * Math.sin(a)]); } dp[6][0] = 0.7;
      B.lathe(0, 0, dp, 12, 0.8, 1.08);
      const top = 15.2 + 8.5 * style.domeH; stone(0.3); B.lathe(0, 0, [[0.9, top - 0.1], [0.5, top + 1.2], [0.95, top + 1.7], [0.3, top + 2.6]], 6); K.lantern(0, top + 2.6, 0, 0.7);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { stone(0.25); B.lathe(sx * 11, sz * 11, [[1.1, 11.6], [1.1, 12.6], [0.8, 12.6], [0.5, 16.5], [0, 18]], 4); }
      stone(0.5); B.cbox(-9.5, -15, -9.5, 9.5, -12.6, 9.5, 0.4, 0.6); stone(0.6); B.cbox(-6, -17.2, -6, 6, -15, 6, 0.4, 0.6);
      dark(0.3); B.lathe(0, 0, [[0, -22.5], [1.2, -20.5], [0.6, -19.4], [3.2, -17.2]], 8, 0.6, 0.8);
    },
  };
  return K;
}

// The big one-off structures. Aqueduct frame: sphere centre at the origin, "down" = -Y, the channel
// runs along +Z at y = FALL and ends in a spout at z = -5. Cascade frame: +Y is its up, it descends
// along +Z from a top landing at the origin.
export function makeBig(B, K, rng, style) {
  const { stone, dark, tone, T } = K;
  const braceY = (z) => { const c = clamp((-14 - z) / 62, -1, 1); return 36 + 23.6 * Math.sqrt(1 - c * c); };
  return {
    aqueduct() {
      const y = FALL, rz = style.archRise;
      // gatehouse where the channel crosses the atrium frame
      for (const z of [-89, -77]) { stone(0.12); B.at(T(0, 30, z), () => B.archWall(19, 45, 2.4, 9, 27.5, rz, 8)); }
      for (const sx of [-1, 1]) { stone(0.25); B.cbox(sx * 7.4, 30, -88, sx * 9.5, 75, -78, 0.3, 0.7);
        stone(0.35); B.cbox(sx * 8.2 - 1.6, 26.5, -90.4, sx * 8.2 + 1.6, 30, -75.6, 0.3, 0.6); }
      stone(0.4); B.cbox(-10.4, 75, -91, 10.4, 76.8, -75, 0.35, 0.6);
      K.roof(); B.lathe(0, -83, [[9.6, 76.8], [7.2, 79.4], [3.2, 81.2], [0.6, 81.8]], 4, 0.85, 1.05);
      for (const sx of [-1, 1]) for (const z of [-90, -76]) { stone(0.25); B.lathe(sx * 9.2, z, [[0.9, 76.8], [0.55, 79.6], [0, 81]], 4); }
      // channel: bed, walls, coping, cornice, corbels
      stone(0.3); B.box(-5.3, y - 1.9, -100, 5.3, y - 0.7, -5, 0.6);
      stone(0.1); B.box(-5.9, y - 2.5, -100, 5.9, y - 1.9, -4.6, 0.6);
      for (const sx of [-1, 1]) { const x0 = Math.min(sx * 4.1, sx * 5.3), x1 = Math.max(sx * 4.1, sx * 5.3);
        stone(0.15); B.box(x0, y - 0.7, -100, x1, y + 1.1, -5, 0.8, 1);
        stone(0.3); B.cbox(x0 - 0.25, y + 1.1, -100, x1 + 0.25, y + 1.6, -5, 0.14, 0.75);
        for (let i = 0; i < 12; i++) { const z = -72 + i * 5.4; if (i % 3 === 1) K.lantern(sx * 4.7, y + 1.6, z, 0.34); else { stone(0.3); B.box(sx * 4.7 - 0.38, y + 1.6, z - 0.38, sx * 4.7 + 0.38, y + 2.0, z + 0.38, 0.9, 1); } } }
      for (let i = 0; i < 14; i++) { const z = -74 + i * 5; stone(0.5); tone(0.25); B.box(-5.9, y - 3.4, z, 5.9, y - 2.5, z + 1.1, 0.55); }
      for (let i = 0; i < 13; i++) { const z0 = -74 + i * 5 + 1.6, z1 = z0 + 2.9, zm = (z0 + z1) / 2;           // coffers and bosses between the corbels
        dark(0.85); B.st.kind = 4; B.quad([-4.7, y - 2.53, z0], [4.7, y - 2.53, z0], [4.7, y - 2.53, z1], [-4.7, y - 2.53, z1], [0, y, zm], false, 0.62, 0.62, 0.8, 0.8);
        tone(0.2, 4); B.lathe(0, zm, [[0, y - 3.5], [0.55, y - 3.05], [1.05, y - 2.55]], 6, 0.7, 1); }
      // twin rampant brace ribs (quarter ellipse) + spandrel colonnade
      const seg = 18, th = 2.4;
      for (const sx of [-1, 1]) { const xa = sx * 2.9, xb = sx * 4.7, ref0 = [(xa + xb) / 2, 0, 0];
        for (let i = 0; i < seg; i++) { const a0 = (i / seg) * Math.PI / 2, a1 = ((i + 1) / seg) * Math.PI / 2;
          const o = (a, r) => [-14 - (62 - r) * Math.cos(a), 36 + (23.6 - r) * Math.sin(a) - r * 0.0];
          const [z0, y0] = o(a0, 0), [z1, y1] = o(a1, 0), [z2, y2] = o(a1, th), [z3, y3] = o(a0, th);
          const ref = [ref0[0], (y0 + y2) / 2, (z0 + z2) / 2]; stone(0.15 + 0.12 * (i % 2));
          B.quad([xa, y0, z0], [xb, y0, z0], [xb, y1, z1], [xa, y1, z1], ref, false); B.quad([xa, y3, z3], [xb, y3, z3], [xb, y2, z2], [xa, y2, z2], ref, false, 0.6);
          B.quad([xa, y0, z0], [xa, y1, z1], [xa, y2, z2], [xa, y3, z3], ref, false, 1, 1, 0.8, 0.8); B.quad([xb, y0, z0], [xb, y1, z1], [xb, y2, z2], [xb, y3, z3], ref, false, 1, 1, 0.8, 0.8); }
        for (const z of [-68, -59, -50, -41, -32]) { stone(0.2); B.column(sx * 3.8, z, braceY(z) - 0.3, y - 3.4, 0.62, 6); } }
      for (const z of [-68, -50, -32]) { stone(0.4); B.box(-3, braceY(z) + (y - 3.4 - braceY(z)) * 0.5, z - 0.35, 3, braceY(z) + (y - 3.4 - braceY(z)) * 0.5 + 0.7, z + 0.35, 0.6); }
      stone(0.45); B.cbox(-6.2, 31, -78.5, 6.2, 37.5, -73.5, 0.4, 0.6);
      // spout head: twin pylons, lip, lanterns
      // (slim pylons: a dressed base with pilasters and a blind niche on the outer face, and above the channel a small
      //  arch through each pylon holding its lamp; two-step cap and a turned finial. Only the first two tones draw from rng.)
      const SX = frame([0, 0, 1], [0, 1, 0]);
      for (const sx of [-1, 1]) { const xc = sx * 5.3, zc = -7.55, xo = sx * 6.1;
        stone(0.2); B.cbox(xc - 0.8, y - 4.2, -10.5, xc + 0.8, y + 1.6, -4.6, 0.18, 0.7);
        stone(0.35); B.cbox(xc - 1.05, y + 1.6, -10.8, xc + 1.05, y + 2.05, -4.3, 0.14, 0.6);
        tone(0.42); B.cbox(xc - 1.0, y - 4.7, -10.75, xc + 1.0, y - 4.2, -4.35, 0.14, 0.6);
        for (const zp of [-9.95, -5.15]) { tone(0.3); B.cbox(Math.min(xo - sx * 0.1, xo + sx * 0.24), y - 4.2, zp - 0.4, Math.max(xo - sx * 0.1, xo + sx * 0.24), y + 1.6, zp + 0.4, 0.08, 0.8); }
        tone(0.08); B.at(SX.clone().setPosition(xo + sx * 0.1, y - 4.2, zc), () => B.archWall(3.5, 5.3, 0.3, 1.9, 3.0, rz, 6, 0.7, true));
        dark(0.8); B.st.kind = 4; B.quad([xo + sx * 0.02, y - 4.2, zc - 0.95], [xo + sx * 0.02, y - 4.2, zc + 0.95], [xo + sx * 0.02, y - 0.1, zc + 0.95], [xo + sx * 0.02, y - 0.1, zc - 0.95], [xc, y - 2, zc], false, 0.5, 0.5, 0.75, 0.75);
        tone(0.14); B.at(SX.clone().setPosition(xc, y + 2.05, zc), () => B.archWall(5.5, 4.6, 1.5, 2.2, 1.9, rz, 8));
        tone(0.4); B.cbox(xc - 1.0, y + 6.65, -10.5, xc + 1.0, y + 7.1, -4.6, 0.14, 0.6);
        tone(0.3); B.cbox(xc - 0.8, y + 7.1, -10.25, xc + 0.8, y + 7.5, -4.85, 0.12, 0.7);
        tone(0.34); B.lathe(xc, zc, [[0.72, y + 7.5], [0.46, y + 8.3], [0.74, y + 8.75], [0.34, y + 9.5], [0, y + 10.2]], 8, 0.85, 1.05);
        K.lantern(xc, y + 2.05, zc, 0.46); }
      stone(0.4); B.cbox(-4.1, y - 1.5, -5.2, 4.1, y - 0.75, -3.4, 0.2, 0.6);
      tone(0.3); B.at(frame([0, 1, 0], [1, 0, 0], 0, y - 1.55, -3.75), () => B.lathe(0, 0, [[0, -4.45], [0.7, -4.45], [0.92, -4.1], [0.92, 4.1], [0.7, 4.45], [0, 4.45]], 10));   // the carved lip: a roll under the stream
      // under the head: a shallow carved rosette (not a spike), and three small lanterns hanging under the channel
      tone(0.3); B.lathe(0, -7.5, [[0, y - 5.3], [0.5, y - 4.9], [0.35, y - 4.6], [1.3, y - 4.2], [1.1, y - 3.95], [2.4, y - 3.6], [3.6, y - 3.4]], 16, 0.7, 0.95);
      for (const z of [-60, -40, -20]) B.at(frame([1, 0, 0], [0, -1, 0], 0, y - 3.4, z), () => K.lantern(0, 0, 0, 0.3));
    },
    cascade(nC, run, drop) {
      const top = 12, hw = 4.5;
      stone(0.3); B.cbox(-10.6, -4.5, -1.5, 10.6, -0.5, top, 0.4, 0.55);
      for (const sx of [-1, 1]) { stone(0.15); B.box(Math.min(sx * 4.5, sx * 10.6), -0.5, -1.5, Math.max(sx * 4.5, sx * 10.6), 0, top, 1, 1);
        B.at(K.RY(Math.PI / 2).multiply(T(0, 0, 0)), () => K.balustrade(-top + 0.6, 1.2, 0, sx * 10.1, 1)); }
      B.at(T(0, 0, -1.1), () => { K.balustrade(4.8, 10.4, 0, 0, 0); K.balustrade(-10.4, -4.8, 0, 0, 0); });
      // the underside of the head landing faces the orbit: a coffered soffit round a turned rosette and its pendant
      tone(0.42); B.cbox(-9.8, -5.3, -0.9, 9.8, -4.5, 11.4, 0.25, 0.6);
      for (const xs of [-5.3, 5.3]) { tone(0.55); B.cbox(xs - 0.45, -6.1, -0.9, xs + 0.45, -5.3, 11.4, 0.12, 0.6); }
      for (const zs of [-0.45, 10.95]) { tone(0.5); B.cbox(-9.8, -5.9, zs - 0.45, 9.8, -5.3, zs + 0.45, 0.12, 0.6); }
      for (const xs of [-7.55, 7.55]) for (const zs of [2.4, 8.1]) {
        dark(0.45); B.st.kind = 4; B.quad([xs - 1.5, -5.33, zs - 1.9], [xs + 1.5, -5.33, zs - 1.9], [xs + 1.5, -5.33, zs + 1.9], [xs - 1.5, -5.33, zs + 1.9], [xs, 0, zs], false, 0.7, 0.7, 0.88, 0.88);
        tone(0.2, 4); B.lathe(xs, zs, [[0, -5.7], [0.7, -5.6], [1.15, -5.33]], 12, 0.85, 1); }      // flat roundels (they were pointed studs)
      tone(0.5); B.lathe(0, 5.25, [[4.55, -5.3], [4.55, -5.85], [4.1, -5.85]], 16, 0.8, 1);
      tone(0.3); B.lathe(0, 5.25, [[4.1, -5.85], [3.7, -6.9], [2.5, -7.9], [1.25, -8.5]], 16, 0.7, 1);
      tone(0.3); B.lathe(0, 5.25, [[1.25, -8.5], [1.0, -8.9], [0.45, -9.15], [0, -9.2]], 16, 0.7, 0.95);      // a shallow boss (a 5 m spike stood here, pointing at the orbit)
      for (let i = 0; i < nC; i++) { const z0 = top + i * run, z1 = z0 + run, yt = -i * drop, yb = yt - drop - 4.2;
        stone(0.35 + 0.1 * (i % 2)); B.box(-hw, yb, z0, hw, yt - drop - 0.5, z1, 0.55);           // channel bed (one step lower = pool)
        for (const sx of [-1, 1]) { const xi = sx * hw, xk = sx * (hw + 0.9), xo = sx * 9.6, xp = sx * 10.6;
          stone(0.25); B.box(Math.min(xi, xk), yb, z0, Math.max(xi, xk), yt - drop + 0.75, z1, 0.6);   // kerb
          stone(0.3); B.box(Math.min(xo, xp), yb, z0, Math.max(xo, xp), yt - drop + 1.9, z1, 0.6);     // parapet
          stone(0.4); B.box(Math.min(xo, xp) - 0.15, yt - drop + 1.9, z0 - 0.15, Math.max(xo, xp) + 0.15, yt - drop + 2.3, z0 + 1.3, 0.8, 1);
          if (i % 2 === 0) K.lantern((xo + xp) / 2, yt - drop + 2.3, z0 + 0.6, 0.4);
          if (i % 3 === 1) K.cypress((xi + xk) / 2 + sx * 0.2, yt - drop + 0.75, z1 - 1.2, 7.5);
          const nS = 6; for (let j = 0; j < nS; j++) { stone(0.05 + 0.3 * (j % 2));
            B.box(Math.min(xk, xo), j === 0 ? yb : yt - drop - 0.2, z0 + (j * run) / nS, Math.max(xk, xo), yt - ((j + 1) * drop) / nS, z0 + ((j + 1) * run) / nS, 0.7, j === 0 ? 0 : 1); } } }
      // the stair's underside faces the orbit: one sloped checkerboard under the steps (somebody's floor), with lanterns hanging from it
      { const zB = top + nC * run, yS = (z) => -((z - top) / run + 1) * drop - 4.25;
        tone(0.2, 1); B.st.r *= 1.7; B.st.g *= 1.45; B.st.b *= 1.3;
        B.quad([-10.55, yS(top), top], [10.55, yS(top), top], [10.55, yS(zB), zB], [-10.55, yS(zB), zB], [0, 0, (top + zB) / 2], false, 0.9);
        for (const xs of [-10.1, 10.1]) { tone(0.5); B.quad([xs - 0.5, yS(top) - 0.5, top], [xs + 0.5, yS(top) - 0.5, top], [xs + 0.5, yS(zB) - 0.5, zB], [xs - 0.5, yS(zB) - 0.5, zB], [xs, 0, (top + zB) / 2], false, 0.75);
          for (const e of [-0.5, 0.5]) B.quad([xs + e, yS(top), top], [xs + e, yS(zB), zB], [xs + e, yS(zB) - 0.5, zB], [xs + e, yS(top) - 0.5, top], [xs, yS(top) - 0.2, top], false, 0.85); }
        for (let i = 1; i < nC; i += 3) for (const xs of [-5.6, 5.6]) { const z = top + (i + 0.5) * run; B.at(frame([1, 0, 0], [0, -1, 0], xs, yS(z), z), () => K.lantern(0, 0, 0, 0.42)); } }
      const zE = top + nC * run, yE = -nC * drop;
      stone(0.3); B.cbox(-10.6, yE - 4.5, zE, 10.6, yE - 0.5, zE + 12, 0.4, 0.55);
      // the mouth, where the drain leaves the foot of the stair: two pylons with lamps and a rolled lip under the stream (no draw from rng)
      for (const sx of [-1, 1]) { const xc = sx * 7.1, z0 = zE + 8.4, z1 = zE + 12.3, zm = (z0 + z1) / 2;
        tone(0.25); B.cbox(xc - 1.5, yE - 4.5, z0, xc + 1.5, yE + 7.2, z1, 0.22, 0.7);
        tone(0.42); B.cbox(xc - 1.85, yE + 7.2, z0 - 0.35, xc + 1.85, yE + 7.9, z1 + 0.35, 0.16, 0.6); B.cbox(xc - 1.8, yE - 0.5, z0 - 0.3, xc + 1.8, yE + 0.6, z1 + 0.3, 0.16, 0.8);
        tone(0.3); B.cbox(xc - 1.4, yE + 7.9, z0 + 0.1, xc + 1.4, yE + 8.5, z1 - 0.1, 0.12, 0.7);
        K.roof(); B.lathe(xc, zm, [[1.55, yE + 8.5], [1.05, yE + 9.9], [0.2, yE + 11.2]], 4, 0.85, 1.05);
        K.lantern(xc, yE + 11.2, zm, 0.5);
        tone(0.45); B.box(xc - sx * 1.5 - 0.35, yE + 3.2, zm - 0.35, xc - sx * 1.5 + 0.35, yE + 3.7, zm + 0.35, 0.7); K.lantern(xc - sx * 1.5, yE + 3.7, zm, 0.36); }
      tone(0.3); B.at(frame([0, 1, 0], [1, 0, 0], 0, yE - 0.8, zE + 12.2), () => B.lathe(0, 0, [[0, -5.5], [0.7, -5.5], [0.95, -5.1], [0.95, 5.1], [0.7, 5.5], [0, 5.5]], 10));
      for (const sx of [-1, 1]) { stone(0.15); B.box(Math.min(sx * 4.5, sx * 10.6), yE - 0.5, zE, Math.max(sx * 4.5, sx * 10.6), yE, zE + 12, 1, 1); }
      // supporting arcade down to its "ground" (y = -71) under the lower half, with stepped infill
      const lvl = (z) => -(Math.min(nC, Math.floor((z - top) / run + 1e-6) + 1)) * drop - 4.2;
      for (const sx of [-1, 1]) for (const zc of [46, 62, 78]) { const h = lvl(zc + 7.9) + 71;
        stone(0.2); B.at(frame([0, 0, 1], [0, 1, 0], sx * 7.2, -71, zc), () => B.archWall(16, h, 2.6, 10.5, h - 12, style.archRise, 8));
        for (let i = 0; i < nC; i++) { const z0 = Math.max(top + i * run, zc - 8), z1 = Math.min(top + (i + 1) * run, zc + 8); if (z1 - z0 < 0.2) continue;
          const yy = lvl(z0 + 0.1); if (yy > h - 71 + 0.05) { stone(0.3); B.box(sx * 7.2 - 1.3, h - 71, z0, sx * 7.2 + 1.3, yy, z1, 0.7); } } }
      stone(0.45); B.cbox(-9.4, -73.6, 36, 9.4, -71, 88, 0.4, 0.6);
      for (const zc of [38, 54, 70, 86]) { stone(0.35); B.box(-7.2, -62, zc - 0.7, 7.2, -60.8, zc + 0.7, 0.6); }
    },
    // entry / exit belvedere: octagonal balcony on a cross-shaped arcaded pier (floor at local y = 0)
    belvedere(hgt) {
      stone(0.3); B.lathe(0, 0, [[6.5, -3.2], [9.6, -1.5], [10.2, -1.5], [10.2, 0]], 8, 0.6, 1);
      stone(0.2, 1); B.lathe(0, 0, [[10.2, 0], [0, 0.02]], 8);
      for (let k = 0; k < 8; k++) { const a = (k + 0.5) * Math.PI / 4; B.at(K.RY(-a + Math.PI / 2).multiply(T(0, 0, 9.0)), () => K.balustrade(-3.5, 3.5, 0, 0, k % 2 ? 1 : 0)); }
      const tier = hgt / 2;
      for (let t = 0; t < 2; t++) for (let k = 0; k < 2; k++) B.at(K.RY(k * Math.PI / 2).multiply(T(0, -3.2 - hgt + t * tier, 0)), () => { stone(0.15 + 0.1 * t); B.archWall(13, tier, 2.6, 7.6, tier - 9.5, style.archRise, 8); });
      stone(0.4); B.cbox(-7.2, -3.2 - tier - 0.6, -7.2, 7.2, -3.2 - tier + 0.6, 7.2, 0.3, 0.6);
      B.cbox(-7.6, -3.2 - hgt - 1.2, -7.6, 7.6, -3.2 - hgt, 7.6, 0.3, 0.6);
    },
    // rose-window corner of a face: quarter-circle rib tangent to both galleries + an oculus ring
    // (local x,y in the face plane measured from the face centre toward the corner; z = face normal)
    cornerRib(Rr, inner) {
      const C = inner - Rr, seg = 18, hz = 1.7, rw = 2.8;
      const arc = (cx, cy, r0, r1, a0, a1, n, v0) => { for (let i = 0; i < n; i++) { const t0 = a0 + (a1 - a0) * (i / n), t1 = a0 + (a1 - a0) * ((i + 1) / n);
        const p = (t, r, z) => [cx + Math.cos(t) * r, cy + Math.sin(t) * r, z], ref = p((t0 + t1) / 2, (r0 + r1) / 2, 0); stone(v0 + 0.14 * (i % 2));
        B.quad(p(t0, r1, -hz), p(t1, r1, -hz), p(t1, r1, hz), p(t0, r1, hz), ref, false); B.quad(p(t0, r0, -hz), p(t1, r0, -hz), p(t1, r0, hz), p(t0, r0, hz), ref, false, 0.66);
        B.quad(p(t0, r0, hz), p(t1, r0, hz), p(t1, r1, hz), p(t0, r1, hz), ref, false, 0.82, 0.82, 1, 1); B.quad(p(t0, r0, -hz), p(t1, r0, -hz), p(t1, r1, -hz), p(t0, r1, -hz), ref, false, 0.82, 0.82, 1, 1); } };
      arc(C, C, Rr - rw, Rr, 0, Math.PI / 2, seg, 0.15);
      const r = Rr * 0.1716, oc = inner - r;
      arc(oc, oc, r - 1.7, r - 0.1, 0, Math.PI * 2, 20, 0.3);
      for (const t of [0.25, 0.5, 0.75]) { const a = t * Math.PI / 2, x = C + Math.cos(a) * (Rr + 0.2), y = C + Math.sin(a) * (Rr + 0.2); stone(0.4); B.box(x - 0.9, y - 0.9, -hz - 0.4, x + 0.9, y + 0.9, hz + 0.4, 0.8); }
      stone(0.35); B.cbox(inner - 3.2, C - 2.2, -hz - 0.5, inner + 0.4, C + 2.2, hz + 0.5, 0.3, 0.7); B.cbox(C - 2.2, inner - 3.2, -hz - 0.5, C + 2.2, inner + 0.4, hz + 0.5, 0.3, 0.7);
    },
    // flying stair flight across a face corner, with landings at both ends
    stairBridge(nS, run, rise, w) {
      const Lz = nS * run, Hy = nS * rise;
      K.flight(nS, run, rise, w, 1.8);
      stone(0.35); B.cbox(-w / 2 - 1.2, -4.2, -9.5, w / 2 + 1.2, 0, 0.2, 0.35, 0.6);
      stone(0.2, 1); B.quad([-w / 2, 0.03, -9], [w / 2, 0.03, -9], [w / 2, 0.03, 0], [-w / 2, 0.03, 0], [0, -3, 0], false);
      stone(0.35); B.cbox(-w / 2 - 1.2, Hy - 3.4, Lz - 0.2, w / 2 + 1.2, Hy, Lz + 9.5, 0.35, 0.6);
      stone(0.2, 1); B.quad([-w / 2, Hy + 0.03, Lz], [w / 2, Hy + 0.03, Lz], [w / 2, Hy + 0.03, Lz + 9], [-w / 2, Hy + 0.03, Lz + 9], [0, 0, 0], false);
      // pendant drop under the middle of the flight
      const zc = Lz * 0.5, yc = Hy * 0.5 - 1.8;
      dark(0.3); B.lathe(0, zc, [[0, yc - 6.5], [1.1, yc - 4.2], [0.55, yc - 3.2], [2.6, yc - 1.2], [2.6, yc + 0.6]], 6, 0.6, 0.85);
    },
  };
}

// square wall (half-size `half`, z0..z1) pierced by a round opening of radius r: gallery mouths, the moon gate, wells
export function ringWall(B, half, r, z0, z1, trim = 0, seg = 40) {
  const zm = (z0 + z1) / 2;
  const sq = (a) => { const c = Math.cos(a), s = Math.sin(a), k = half / Math.max(Math.abs(c), Math.abs(s)); return [c * k, s * k]; };
  for (let i = 0; i < seg; i++) {
    const a0 = (i / seg) * Math.PI * 2, a1 = ((i + 1) / seg) * Math.PI * 2;
    const c0 = [r * Math.cos(a0), r * Math.sin(a0)], c1 = [r * Math.cos(a1), r * Math.sin(a1)], o0 = sq(a0), o1 = sq(a1);
    const mx = (c0[0] + o1[0]) / 2, my = (c0[1] + o1[1]) / 2;
    for (const z of [z0, z1]) B.quad([c0[0], c0[1], z], [c1[0], c1[1], z], [o1[0], o1[1], z], [o0[0], o0[1], z], [mx, my, zm], false, 0.8, 0.8, 1, 1);
    B.quad([c0[0], c0[1], z0], [c1[0], c1[1], z0], [c1[0], c1[1], z1], [c0[0], c0[1], z1], [0, 0, zm], true, 0.62);
    if (trim) { const t0 = [(r + trim) * Math.cos(a0), (r + trim) * Math.sin(a0)], t1 = [(r + trim) * Math.cos(a1), (r + trim) * Math.sin(a1)], zt = z1 + 0.45;
      B.quad([c0[0], c0[1], zt], [c1[0], c1[1], zt], [t1[0], t1[1], zt], [t0[0], t0[1], zt], [mx, my, zm], false, i % 2 ? 0.85 : 1);
      B.quad([t0[0], t0[1], z1], [t1[0], t1[1], z1], [t1[0], t1[1], zt], [t0[0], t0[1], zt], [0, 0, zt], false, 0.8);
      B.quad([c0[0], c0[1], z1], [c1[0], c1[1], z1], [c1[0], c1[1], zt], [c0[0], c0[1], zt], [0, 0, zt], true, 0.62); }
  }
  for (const s of [-1, 1]) { B.quad([s * half, -half, z0], [s * half, half, z0], [s * half, half, z1], [s * half, -half, z1], [0, 0, zm], false);
    B.quad([-half, s * half, z0], [half, s * half, z0], [half, s * half, z1], [-half, s * half, z1], [0, 0, zm], false, s < 0 ? 0.7 : 1); }
}

// The underside of the cascade stair (cascade frame) is a stair too, for the gravity that points the other way: a flight with a
// wine runner, parapets and lamps hangs under the steps, and the head landing's coffered underside gets a balustrade and two
// potted trees. Seen from the far side of the orbit it is somebody's staircase, not a checkered slab with a square end.
function dressSoffit(B, K, nC, run, drop, runC, runE) {
  const top = 12, y0 = -drop - 4.25 - 0.06, nS = nC * 2, ru = run / 2, ri = drop / 2, w = 8.6, hw = w / 2;
  B.push(frame([-1, 0, 0], [0, -1, 0], 0, y0, top));
  K.flight(nS, ru, ri, w, 0.3);
  for (let i = 0; i < nS; i++) { const z0 = i * ru, z1 = z0 + ru, a = i * ri, b = a + ri, e = 0.05;
    for (const [xa, xb, c] of [[-1.7, -1.36, runE], [-1.36, 1.36, runC], [1.36, 1.7, runE]]) { B.color(c, 4, 1);
      B.quad([xa, a, z0 - e], [xb, a, z0 - e], [xb, b + e, z0 - e], [xa, b + e, z0 - e], [0, a, z0 + 1], false, 0.95, 0.95, 1.15, 1.15);
      B.quad([xa, b + e, z0 - e], [xb, b + e, z0 - e], [xb, b + e, z1 - e], [xa, b + e, z1 - e], [0, b - 1, z0], false, 1.0, 1.0, 0.84, 0.84); } }
  // potted orange trees on the margins, each on a small level plinth cut into the slope
  for (let i = 3; i < nS - 2; i += 8) for (const sx of [-1, 1]) { const z = (i + 0.5) * ru, y = (i + 1) * ri, x = sx * (hw + 3.3);
    K.tone(0.4); B.cbox(x - 1.3, y - ri * 1.4, z - 1.3, x + 1.3, y, z + 1.3, 0.15, 0.7); K.orangeTree(x, y, z, 0.72); }
  B.pop();
  B.push(frame([-1, 0, 0], [0, -1, 0], 0, -5.3, 0));
  K.balustrade(-9.4, 9.4, 0.6, -0.45, 2);      // (on the cross beam at the plate's free end)
  for (const sx of [-1, 1]) B.at(K.RY(Math.PI / 2), () => K.balustrade(-11.1, 0.4, 0, sx * 9.4, 2));
  for (const sx of [-1, 1]) K.orangeTree(sx * 7.55, 0, 5.25, 0.8);
  B.pop();
  return { hw, nS, ru, ri, y0, top };
}

// A landing pierced by a round well, hung under the water sphere: the fall that rises into the sphere's underside comes up
// through it, out of a basin with a raised rim. Seen over the entry belvedere the column lands in a basin instead of running
// off behind the terrace. Its top is a floor for the ordinary gravity (parapet, lamps), its underside a floor for the fall's
// own (two potted trees and lamps hang from it). Frame: the well's centre, +Y up, top of the plate at y = 1.6.
function wellTerrace(B, K) {
  const H = 12.5, R = 7;
  B.at(frame([1, 0, 0], [0, 0, -1], 0, 0, 0), () => { K.tone(0.2, 1); ringWall(B, H, R, 0, 1.6, 0.9, 32); });
  // (round 7: no water stands level in the well. This is zone B, whose down is +X, and a level pool here lay in zone A's gravity;
  //  the well is an open throat of carved stone, and the fall wells up through it in its own gravity: see the collar in buildHero)
  K.tone(0.55); B.at(frame([1, 0, 0], [0, 0, -1], 0, 0, 0), () => { for (let i = 0; i < 32; i++) { const a0 = i / 32 * 6.2832, a1 = (i + 1) / 32 * 6.2832;      // the throat's inner wall
    B.quad([R * 0.99 * Math.cos(a0), R * 0.99 * Math.sin(a0), 0.02], [R * 0.99 * Math.cos(a1), R * 0.99 * Math.sin(a1), 0.02], [R * 0.99 * Math.cos(a1), R * 0.99 * Math.sin(a1), 1.25], [R * 0.99 * Math.cos(a0), R * 0.99 * Math.sin(a0), 1.25], [0, 0, 0.6], true, 0.6, 0.6, 0.9, 0.9); } });
  for (const sz of [-1, 1]) K.balustrade(-H + 0.4, H - 0.4, 1.6, sz * (H - 0.5), 1);
  for (const sx of [-1, 1]) B.at(K.RY(Math.PI / 2), () => K.balustrade(-H + 1.2, H - 1.2, 1.6, sx * (H - 0.5), 0));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    K.tone(0.45); B.cbox(sx * (H - 0.2) - 0.9, -1.2, sz * (H - 0.2) - 0.9, sx * (H - 0.2) + 0.9, 0, sz * (H - 0.2) + 0.9, 0.2, 0.7);
    K.dark(0.3); B.lathe(sx * (H - 0.2), sz * (H - 0.2), [[0, -5.6], [0.55, -4.4], [0.3, -3.6], [0.95, -2.2], [0.95, -1.2]], 8, 0.6, 0.85); }
  B.at(frame([1, 0, 0], [0, -1, 0], 0, 0, 0), () => { K.orangeTree(-9.6, 0, 9.6, 0.95); K.orangeTree(9.6, 0, -9.6, 0.95);
    for (const [x, z] of [[9.4, 9.4], [-9.4, -9.4]]) { K.tone(0.4); B.cbox(x - 0.45, 0, z - 0.45, x + 0.45, 1.3, z + 0.45, 0.1, 0.8); K.lantern(x, 1.3, z, 0.45); } });
  return { H, R };
}

const GLSL_NOISE = /* glsl */`
float sh21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float svn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(sh21(i), sh21(i + vec2(1.0, 0.0)), f.x), mix(sh21(i + vec2(0.0, 1.0)), sh21(i + vec2(1.0, 1.0)), f.x), f.y); }
float sfb(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * svn(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
float sh31(vec3 p){ p = fract(p * vec3(0.1031, 0.1130, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float svn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(sh31(i), sh31(i + vec3(1,0,0)), f.x), mix(sh31(i + vec3(0,1,0)), sh31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(sh31(i + vec3(0,0,1)), sh31(i + vec3(1,0,1)), f.x), mix(sh31(i + vec3(0,1,1)), sh31(i + vec3(1,1,1)), f.x), f.y), f.z); }
float sfb3(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 3; i++) { s += a * svn3(p); p = p * 2.02 + 11.3; a *= 0.5; } return s; }
`;
// additive / premultiplied things fade out in fog instead of turning fog-coloured
const GLSL_FOG_FADE = /* glsl */`
float fogFade(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      return 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 1.0;
  #endif
}`;

export function makeStoneMaterial(U, plum, hazeC, mopts = {}) {
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88, metalness: 0 });
  if (mopts.rest) m.defines.USE_REST = '';
  // lamps: lantern light worked out per pixel in the geometry's own (rest) space, for lamps that repeat along z:
  //   { pts: { value: [Vector4 x4] } (x, y, z of the first, gain), col: { value: Color }, par: { value: Vector4(period, radius, inside, length) } }
  //   (inside: how much of the suns' light reaches the stone between z = 0 and z = length, within 9.3 m of the axis: under a roof)
  // point: one warm light at a world point (the court's portal): { pos: { value: Vector3 }, col: { value: Color }, par: { value: Vector2(radius, 0) } }
  if (mopts.lamps) m.defines.USE_GLAMPS = '';
  if (mopts.point) m.defines.USE_PLAMP = '';
  m.onBeforeCompile = (sh) => {
    if (mopts.lamps) { sh.uniforms.uGL = mopts.lamps.pts; sh.uniforms.uGLC = mopts.lamps.col; sh.uniforms.uGLP = mopts.lamps.par; }
    if (mopts.point) { sh.uniforms.uPL = mopts.point.pos; sh.uniforms.uPLC = mopts.point.col; sh.uniforms.uPLR = mopts.point.par; }
    sh.uniforms.uTime = U.time; sh.uniforms.uPlum = { value: plum }; sh.uniforms.sunD = U.sunD; sh.uniforms.sunC = U.sunC; sh.uniforms.uSelf = U.self; sh.uniforms.uHazeS = { value: hazeC };
    sh.uniforms.uShade = U.shade; sh.uniforms.uLampE = U.lampE; sh.uniforms.uBounce = U.bounce; sh.uniforms.uLeafT = U.leafT;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aK; uniform float uTime; varying float vK; varying vec3 vOP; varying vec3 vON; varying vec3 vWNs;\n#ifdef USE_REST\nattribute vec3 aRP; attribute vec3 aRN;\n#endif\n#ifdef USE_PLAMP\nvarying vec3 vWPs;\n#endif')
      .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
        vK = aK; vOP = position; vON = normal;
        #ifdef USE_REST
          vOP = aRP; vON = aRN;
        #endif
        { vec3 wn = normal;
          #ifdef USE_INSTANCING
            wn = mat3(instanceMatrix) * wn;
          #endif
          vWNs = normalize(mat3(modelMatrix) * wn); }
        #ifdef USE_PLAMP
          vWPs = (modelMatrix * vec4(transformed, 1.0)).xyz;
        #endif
        if (aK > 2.5 && aK < 3.5) transformed += 0.17 * vec3(sin(uTime * 1.3 + position.y * 0.35 + position.x), sin(uTime * 1.1 + position.z * 0.4), sin(uTime * 1.7 + position.x * 0.3 + position.y * 0.5));`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vK; varying vec3 vOP; varying vec3 vON; varying vec3 vWNs; uniform float uTime, uSelf, uLampE, uLeafT; uniform vec2 uShade; uniform vec3 uBounce; uniform vec3 uPlum; uniform vec3 uHazeS; uniform vec3 sunD[3]; uniform vec3 sunC[3];\n#ifdef USE_GLAMPS\nuniform vec4 uGL[4]; uniform vec3 uGLC; uniform vec4 uGLP;\n#endif\n#ifdef USE_PLAMP\nuniform vec3 uPL; uniform vec3 uPLC; uniform vec2 uPLR; varying vec3 vWPs;\n#endif\n' + GLSL_NOISE)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
        {
          vec3 an = abs(vON); vec2 suv;
          if (an.y > an.x && an.y > an.z) suv = vOP.xz; else if (an.x > an.z) suv = vOP.zy; else suv = vOP.xy;
          if (vK > 2.5 && vK < 3.5) suv = vec2(vOP.x + vOP.z * 0.7, vOP.y + vOP.z * 0.4);      // foliage has rounded normals: one continuous mapping
          float fw = length(fwidth(suv));
          float n1 = sfb(suv * 0.31 + 3.0), n2 = svn(suv * 3.1);
          if (vK < 0.5) {
            // ashlar: 1.2 x 0.58 m blocks, fine joints, a lit arris under each bed joint, slow stains down the courses
            float row = floor(suv.y / 0.58);
            vec2 bb = vec2(suv.x / 1.2 + mod(row, 2.0) * 0.5 + sh21(vec2(row, 3.0)) * 0.25, suv.y / 0.58);
            vec2 fb = fract(bb), f = 0.5 - abs(fb - 0.5);
            float lodJ = clamp(1.2 - fw * 5.0, 0.0, 1.0);
            float j = (1.0 - smoothstep(0.02, 0.06, min(f.x * 1.2, f.y * 0.58))) * lodJ;
            float tone = sh21(floor(bb)) * clamp(1.4 - fw * 0.9, 0.0, 1.0);
            float bev = (smoothstep(0.76, 0.88, fb.y) - smoothstep(0.26, 0.12, fb.y)) * (1.0 - j) * lodJ;
            diffuseColor.rgb *= (0.94 + 0.11 * tone) * (1.0 + 0.07 * bev) * mix(vec3(1.0), uPlum * 1.6 + 0.35, j * 0.42);
            diffuseColor.rgb *= 0.97 + 0.06 * n2;
            vec2 sq = vec2(suv.x * 0.15, suv.y * 0.04) + 9.0;
            diffuseColor.rgb *= 0.9 + 0.2 * (0.65 * svn(sq) + 0.35 * svn(sq * 2.7 + 5.0));
          } else if (vK < 1.5) {
            vec2 c = floor(suv / 2.0); float ck = mod(c.x + c.y, 2.0);
            ck = mix(0.5, ck, clamp(1.7 - fw * 0.55, 0.0, 1.0));
            // a thin inlaid line round every tile, so a floor near the camera is paving and not flat paint
            vec2 tf = 0.5 - abs(fract(suv / 2.0) - 0.5);
            float tj = (1.0 - smoothstep(0.012, 0.03, min(tf.x, tf.y))) * clamp(1.2 - fw * 5.0, 0.0, 1.0);
            diffuseColor.rgb *= mix(uPlum * 1.5 + 0.62, vec3(1.04), ck) * (1.0 - 0.16 * tj) * (0.96 + 0.08 * n2);
          } else if (vK > 2.5 && vK < 3.5) {
            // leaves: soft masses, a fine dapple of leaf-sized dabs near the camera, warmer tips where a dab catches the light
            float lf = svn(suv * vec2(6.0, 3.2) + 11.0), lf2 = svn(suv * vec2(13.0, 7.0) + 5.0), lodL = clamp(1.4 - fw * 2.5, 0.0, 1.0);
            diffuseColor.rgb *= (0.74 + 0.6 * svn(suv * 1.9 + 2.0)) * mix(1.0, 0.7 + 0.42 * lf + 0.3 * lf2, lodL);
            diffuseColor.rgb *= mix(vec3(1.0), vec3(1.2, 1.1, 0.84), smoothstep(0.6, 0.9, lf2) * 0.5 * lodL);
          }
          diffuseColor.rgb *= 0.84 + 0.3 * n1;
        }`)
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
        #ifdef USE_GLAMPS
          vec3 gAlb = diffuseColor.rgb;
          { float gIn = smoothstep(0.0, 9.0, vOP.z) * (1.0 - smoothstep(uGLP.w - 9.0, uGLP.w, vOP.z)) * step(abs(vOP.x), 9.3) * step(abs(vOP.y), 9.3);
            diffuseColor.rgb *= mix(1.0, uGLP.z, gIn); }
        #endif
        { // the haze lights a face that looks toward the three suns; a face that looks away from all of them sinks toward plum
          float toSuns = 0.5 + 0.5 * dot(vWNs, normalize(sunD[0] + sunD[1] + sunD[2] + vec3(1e-4)));
          vec3 sl = mix(uPlum * uShade.x + uHazeS * uShade.y, uHazeS * 0.7 + uPlum * 0.2 + vec3(0.06, 0.04, 0.02), smoothstep(0.15, 0.85, toSuns));
          sl += uBounce * max(-vWNs.y, 0.0);                       // warm light thrown back up by the sunlit floors below
          for (int i = 0; i < 3; i++) sl += sunC[i] * max(dot(vWNs, sunD[i]), 0.0) * 0.95; totalEmissiveRadiance += diffuseColor.rgb * sl * uSelf; }
        #ifdef USE_GLAMPS
        { vec3 gl = vec3(0.0); float per = max(uGLP.x, 0.5), rr = max(uGLP.y * uGLP.y, 0.01);
          for (int i = 0; i < 4; i++) { float zl = (floor((vOP.z - uGL[i].z) / per) + 0.5) * per + uGL[i].z;
            vec3 dl = vec3(uGL[i].xy, zl) - vOP; float d2 = dot(dl, dl);
            float nl = dot(vON, dl) * inversesqrt(max(d2, 1e-3));
            gl += uGLC * uGL[i].w * (0.3 + 0.7 * max(nl, 0.0)) / (1.0 + d2 / rr); }
          totalEmissiveRadiance += gAlb * gl; }
        #endif
        #ifdef USE_PLAMP
        { vec3 dl = uPL - vWPs; float d2 = dot(dl, dl);
          float nl = dot(vWNs, dl) * inversesqrt(max(d2, 1e-3));
          totalEmissiveRadiance += diffuseColor.rgb * uPLC * (0.25 + 0.75 * max(nl, 0.0)) / (1.0 + d2 / max(uPLR.x * uPLR.x, 0.01)); }
        #endif
        if (vK > 2.5 && vK < 3.5) totalEmissiveRadiance += diffuseColor.rgb * (sunC[0] + sunC[1] * 0.6) * uLeafT;     // leaves let the suns through
        if (vK > 1.5 && vK < 2.5) totalEmissiveRadiance += vColor.rgb * uLampE * (0.8 + 0.2 * sin(uTime * 2.3 + vOP.x * 1.7 + vOP.z * 2.1 + vOP.y));`)
      // Distance takes the stone into the haze AS IT LOOKS IN THAT DIRECTION (the world's haze dome: deeper below the eye,
      // glowing round each sun), not into one flat fog colour: far masonry in front of a sun melts into its glow instead of
      // standing against it as dark cut-outs.
      .replace('#include <fog_fragment>', /* glsl */`
        #ifdef USE_FOG
        {
          #ifdef FOG_EXP2
            float fogF = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
          #else
            float fogF = smoothstep(fogNear, fogFar, vFogDepth);
          #endif
          vec3 vd = normalize(-vViewPosition - vec3(0.0, 0.0, 1e-4));
          vec3 fc = mix(fogColor, uPlum * 1.3 + uHazeS * 0.4, smoothstep(0.1, -0.9, dot(vd, (viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz)) * 0.4);
          for (int i = 0; i < 3; i++) { float k = max(dot(vd, (viewMatrix * vec4(sunD[i], 0.0)).xyz), 0.0); float k2 = k * k;
            fc += sunC[i] * (k2 * k2 * 0.08 + pow(k, 36.0) * 0.5) + vec3(0.92, 0.81, 0.63) * pow(k, 10.0) * 0.16; }
          gl_FragColor.rgb = mix(gl_FragColor.rgb, fc, fogF);
        }
        #endif`);
  };
  return m;
}

// camera line in atrium-centred coordinates (y is relative to the sphere centre)
const FLY = [[0, 0, 132], [0, 0, 100], [2, 0.4, 74], [10, 2.6, 50], [23, 8, 28], [31, 13, 5], [30, 12, -17], [21, 6.5, -45], [7, 1, -76], [0, 0, -100], [0, 0, -132]];
// keep-out boxes for the randomly placed stair bridges: [x0,y0,z0,x1,y1,z1] (centred)
const KEEP = [[-104, -15, -86, -8, 15, -2], [-13, 26, -104, 13, 86, 2], [26, -104, -13, 86, 2, 13], [-104, -86, -13, 2, -26, 13], [-12, -78, 72, 12, -2, 97], [-12, -78, -97, 12, -2, -72]];

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('triple-fall');
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const detail = clamp(opts.detail ?? 1, 0.6, 1.2);
  // per-seed character: arch shape, dome height, roof colour, stone warmth
  const style = { archRise: rng.pick([1, 1, 1.2, 1.36]), domeH: rng.range(0.8, 1.4), roofWarm: rng.range(0.12, 0.55) };
  const warm = rng.range(-0.05, 0.05); pal[0].offsetHSL(warm * 0.2, 0, 0); pal[1].offsetHSL(warm * 0.3, rng.range(-0.05, 0.08), 0);
  const sunsIn = opts.suns && opts.suns.length === 3 ? opts.suns : [
    { dir: [0.08, 1, 0.1], color: '#fff2da', intensity: 1.0 }, { dir: [-1, 0.12, 0.1], color: '#ffc49a', intensity: 0.85 }, { dir: [0.1, 0.1, -1], color: '#b8b2ff', intensity: 0.75 }];
  const sunDirs = sunsIn.map((s) => new THREE.Vector3().fromArray(s.dir.isVector3 ? s.dir.toArray() : s.dir).normalize());
  const sunCols = sunsIn.map((s) => new THREE.Color(s.color).multiplyScalar(s.intensity ?? 1));

  // shade: what a face turned away from all three suns takes from (plum, haze); lampE: lantern emissive gain
  const U = { self: { value: clamp(opts.selfLight ?? 0.5, 0, 1.5) }, shade: { value: new THREE.Vector2(...(opts.shade || [0.2, 0.7])) }, lampE: { value: opts.lampEmissive ?? 5 }, bounce: { value: new THREE.Vector3(...(opts.bounce || [0, 0, 0])) }, leafT: { value: opts.leafGlow ?? 0 }, time: { value: 0 }, surge: { value: 0 }, prog: { value: -1 }, spin: { value: 0 }, leap: { value: 0 }, leapMode: { value: 0 }, viewH: { value: 540 },
    sunD: { value: sunDirs }, sunC: { value: sunCols } };
  const object = new THREE.Group(); object.name = 'triple-fall';
  const core = new THREE.Group(); core.position.set(0, CY, 0); object.add(core);   // everything is authored round the sphere centre

  // ------------------------------------------------------------------ stone
  const B = makeBuilder(110000), K = makeKit(B, pal, rng, style), G = makeBig(B, K, rng, style);      // (it holds about 103k; the builder grows if a seed needs more)
  await ctx.yield?.();
  const walkways = [];
  // (round 7) the dress of the decks that face the atrium and of the arcade under the cascade: a kit of its own on a stream of its own, so no draw of the hero's moves
  const K7 = makeKit(B, pal, makeRng(hashSeed('hero-decks7:' + (ctx.seed ?? 0))), style);
  // twelve edge galleries, each upright for one of the four gravities perpendicular to its run
  for (let a = 0; a < 3; a++) {
    const b = (a + 1) % 3, c = (a + 2) % 3;
    for (const s1 of [-1, 1]) for (const s2 of [-1, 1]) {
      const ups = [AXES[b], neg(AXES[b]), AXES[c], neg(AXES[c])];
      const up = rng.pick(ups), ax = rng.chance(0.5) ? AXES[a] : neg(AXES[a]);
      const p = [0, 0, 0]; p[b] = s1 * HF; p[c] = s2 * HF;
      const o = p.map((v, i) => v - up[i] * 7);
      const fuse = (a === 0 && s1 === 1 && s2 === -1) || (a === 2 && s1 === 1 && s2 === -1) || (a === 2 && s1 === -1 && s2 === -1) || (a === 0 && s1 === -1);
      { const nT = fuse ? 0 : Math.round(rng.int(1, 3) * detail);     // the gallery in two halves with a yield between (same calls, same order)
        // (round 7) a deck that faces out of the cage lies 89 m and more from the atrium's axis, turned away from it: its balusters are merged
        const inward = up[b] * s1 + up[c] * s2 < 0;
        B.push(frame(ax, up, o[0], o[1], o[2])); K.galleryA(140, 8); await ctx.yield?.(); K.galleryB(140, 8, nT, !inward);
        if (inward) { await ctx.yield?.(); dressDeck(B, K7, 140, 8); }      // a deck that faces the atrium is a terrace, not a bare checkered pier
        B.pop(); }
      const w0 = o.map((v, i) => v + up[i] * 14 - AXES[a][i] * 60), w1 = o.map((v, i) => v + up[i] * 14 + AXES[a][i] * 60);
      walkways.push({ a: new THREE.Vector3(w0[0], w0[1] + CY, w0[2]), b: new THREE.Vector3(w1[0], w1[1] + CY, w1[2]), up: new THREE.Vector3(...up) });
      await ctx.yield?.();
    }
    await ctx.yield?.();
  }
  // eight corner pavilions, each with its own "up"
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
    const k = rng.int(0, 2), up = rng.chance(0.5) ? AXES[k] : neg(AXES[k]), side = AXES[(k + 1) % 3];
    B.push(frame(side, up, sx * HF, sy * HF, sz * HF)); K.pavilionA(); await ctx.yield?.(); K.pavilionB(); B.pop();      // (push / pop in place of B.at, so a frame can be handed back half way)
    await ctx.yield?.();
  }
  await ctx.yield?.();
  // the three aqueducts: down (-Y), sideways (-X), up (+Y)
  const AQ = [frame([1, 0, 0], [0, 1, 0]), frame([0, 0, 1], [1, 0, 0]), frame([0, 0, 1], [0, -1, 0])];
  for (const m of AQ) { B.at(m, () => G.aqueduct()); await ctx.yield?.(); }
  // the fourth staircase: cascades whose down is -Z, descending toward -X
  const NC = 17, RUN = 3.6, DROP = 2.3;
  const CAS = frame([0, -1, 0], [0, 0, 1], -12, 0, -9);
  B.at(CAS, () => G.cascade(NC, RUN, DROP));
  await ctx.yield?.();
  // Polish: the cascade's underside as a stair, and the well under the sphere. Built with a kit of their own, on an rng of
  // their own, so every draw of the hero's rng (and with it every gallery, bridge and fish) is what it was.
  const K5 = makeKit(B, pal, makeRng(hashSeed((ctx.seed ?? 0) + ':hero-polish5')), style);
  const WELL = new THREE.Matrix4().makeTranslation(-1.1, -35.2, 0);
  const sof = (() => { let r = null; B.at(CAS, () => { r = dressSoffit(B, K5, NC, RUN, DROP, pal[6].clone().lerp(pal[4], 0.55).multiplyScalar(0.8), pal[0].clone().multiplyScalar(0.74)); }); return r; })();
  await ctx.yield?.();
  B.at(WELL, () => wellTerrace(B, K5));
  B.at(CAS, () => dressArcadeEnd(B, K7, pal[0].clone().multiplyScalar(0.86).lerp(pal[3], 0.55).multiplyScalar(1.25)));      // (round 7)
  for (const l of K5.lanterns) K.lanterns.push(l);
  await ctx.yield?.();
  // entry and exit belvederes
  B.at(K.T(0, -10, 84), () => G.belvedere(60.8)); B.at(K.T(0, -10, -84), () => G.belvedere(60.8));
  // flying stair flights across the corners of the six faces, for assorted gravities
  const blocked = (x, y, z) => {
    for (const k of KEEP) if (x > k[0] - 7 && x < k[3] + 7 && y > k[1] - 7 && y < k[4] + 7 && z > k[2] - 7 && z < k[5] + 7) return true;
    for (const f of FLY) if (Math.hypot(x - f[0], y - f[1], z - f[2]) < 22) return true;
    return false;
  };
  let nBridges = 0; const ribR = rng.range(32, 42);
  for (let fa = 0; fa < 3; fa++) for (const sf of [-1, 1]) {
    const a = (fa + 1) % 3, b = (fa + 2) % 3;
    const cands = [], swap = rng.int(0, 1);
    for (const sa of [-1, 1]) for (const su of [-1, 1]) {
      cands.push({ sa, su, swap });
      const xa = [0, 0, 0], ya = [0, 0, 0], o = [0, 0, 0]; xa[a] = sa; ya[b] = su; o[fa] = sf * 80;
      B.at(frame(xa, ya, o[0], o[1], o[2]), () => G.cornerRib(ribR, 75.5));
    }
    rng.shuffle(cands);
    let placed = 0; const want = Math.round(rng.int(2, 3) * detail);
    for (const cd of cands) {
      if (placed >= want) break;
      const r = [0, 0, 0], u = [0, 0, 0]; r[cd.swap ? b : a] = cd.sa; u[cd.swap ? a : b] = cd.su;
      const o = [0, 0, 0]; for (let i = 0; i < 3; i++) o[i] = (i === fa ? sf * 71 : 0) + r[i] * 14 + u[i] * -70;
      let bad = false;
      for (let t = -0.12; t <= 1.13; t += 0.125) { const tt = clamp(t, 0, 1); if (blocked(o[0] + r[0] * (t * 60) + u[0] * tt * 40, o[1] + r[1] * (t * 60) + u[1] * tt * 40, o[2] + r[2] * (t * 60) + u[2] * tt * 40)) { bad = true; break; } }
      if (bad) continue;
      const ux = new THREE.Vector3(...u).cross(new THREE.Vector3(...r));
      B.at(frame([ux.x, ux.y, ux.z], u, o[0], o[1], o[2]), () => G.stairBridge(40, 1.5, 1.0, 7));
      placed++; nBridges++;
      await ctx.yield?.();
    }
    await ctx.yield?.();
  }
  await ctx.yield?.();
  const stoneGeo = B.finish();
  await ctx.yield?.();
  await boundsInSteps(stoneGeo, ctx.yield ? () => ctx.yield() : null);
  await ctx.yield?.();
  const stoneMat = makeStoneMaterial(U, pal[4], pal[3]);
  const stone = new THREE.Mesh(stoneGeo, stoneMat);
  stone.name = 'stone'; core.add(stone);
  await ctx.yield?.();

  // ------------------------------------------------------------------ water (one mesh)
  // uv = (across 0..1 mirrored, along in flow units), aW = (kind 0 flat / 1 falling, alpha, foam)
  const wP = [], wN = [], wU = [], wW = [];
  const v3 = new THREE.Vector3(), n3 = new THREE.Vector3();
  const wVert = (m, p, nn, u, v, kind, alpha, foam) => { v3.set(p[0], p[1], p[2]).applyMatrix4(m); n3.set(nn[0], nn[1], nn[2]).transformDirection(m);
    wP.push(v3.x, v3.y, v3.z); wN.push(n3.x, n3.y, n3.z); wU.push(u, v); wW.push(kind, alpha, foam); };
  const wQuad = (m, A, Bq, Cq, D) => { for (const q of [A, Bq, Cq, A, Cq, D]) wVert(m, q.p, q.n, q.u, q.v, q.k, q.a, q.f); };
  // falling tube along a path fn(s) -> { p:[x,y,z], hw, th }, in the y-z plane of frame m
  const wTube = (m, fn, rows, v0, v1, fadeIn, fadeOut) => {
    const ring = 12, R = [];
    for (let j = 0; j <= rows; j++) { const s = j / rows, c = fn(s), c2 = fn(Math.min(1, s + 0.01)), c0 = fn(Math.max(0, s - 0.01));
      let ty = c2.p[1] - c0.p[1], tz = c2.p[2] - c0.p[2]; const tl = Math.hypot(ty, tz) || 1; ty /= tl; tz /= tl;
      const ny = -tz, nz = ty, row = [];   // in-plane normal of the path
      for (let i = 0; i <= ring; i++) { const a = (i / ring) * 6.2832, ca = Math.cos(a), sa = Math.sin(a);
        row.push({ p: [ca * c.hw, c.p[1] + sa * c.th * ny, c.p[2] + sa * c.th * nz], n: [ca * c.th, sa * c.hw * ny, sa * c.hw * nz], u: Math.abs(i / ring * 2 - 1), v: lerp(v0, v1, s), k: 1,
          a: sst(-1e-4, Math.max(fadeIn, 1e-4), s) * (1 - sst(1 - Math.max(fadeOut, 1e-4), 1.0001, s)), f: s }); }
      R.push(row); }
    for (let j = 0; j < rows; j++) for (let i = 0; i < ring; i++) wQuad(m, R[j][i], R[j][i + 1], R[j + 1][i + 1], R[j + 1][i]);
  };
  const wFlat = (m, x0, x1, y, z0, z1, v0, v1, foam0 = 0, foam1 = 0, a0 = 1, a1 = 1) => {
    const q = (x, z, u, v, f, a) => ({ p: [x, y, z], n: [0, 1, 0], u, v, k: 0, a, f });
    wQuad(m, q(x0, z0, 0, v0, foam0, a0), q(x1, z0, 1, v0, foam0, a0), q(x1, z1, 1, v1, foam1, a1), q(x0, z1, 0, v1, foam1, a1));
  };
  const fallPath = (s) => ({ p: [0, FALL - 0.25 - (FALL - 0.25 - SR * 0.9) * s * s, -5 + 5.3 * s], hw: lerp(4.0, 4.9, sst(0.02, 0.45, s)) + 1.2 * sst(0.72, 1, s), th: lerp(0.9, 2.8, Math.sqrt(s)) });
  for (const m of AQ) {
    for (let i = 0; i < 6; i++) { const z0 = -100 + i * 15.8, z1 = z0 + 15.8; wFlat(m, -4.1, 4.1, FALL, z0, Math.min(z1, -5), z0 / 9, Math.min(z1, -5) / 9, 0, i === 5 ? 0.5 : 0, i === 0 ? 0 : 1, 1); }
    wTube(m, fallPath, 40, -0.55, 3.2, 0.03, 0.1);
    await ctx.yield?.();
  }
  // drain: sphere -> top landing -> cascade steps -> spill off the far end
  {
    const m = CAS, hw = 4.2;
    wTube(m, (s) => ({ p: [0, 3.6 - 3.75 * s * s, -1.2 + 5.0 * s], hw: lerp(3.0, 4.0, s), th: lerp(1.0, 0.45, s) }), 12, -1.2, 0, 0.25, 0.08);
    wFlat(m, -hw, hw, -0.12, 2.6, 12, 0.3, 1.35, 0.9, 0.15);
    let v = 1.35;
    for (let i = 0; i < NC; i++) { const z0 = 12 + i * RUN, y0 = -i * DROP - 0.12, y1 = y0 - DROP;
      wTube(m, (s) => ({ p: [0, y0 - 0.15 - (DROP - 0.1) * s * s, z0 - 0.1 + 1.3 * s], hw: hw * 0.98, th: 0.3 }), 4, v, v + 0.5, 0.0, 0.12);
      wFlat(m, -hw, hw, y1, z0, z0 + 1.8, v + 0.4, v + 0.6, 1, 0.8); wFlat(m, -hw, hw, y1, z0 + 1.8, z0 + RUN, v + 0.6, v + 0.9, 0.8, 0.1);
      v += 0.9; }
    const zE = 12 + NC * RUN, yE = -NC * DROP - 0.12;
    wFlat(m, -hw, hw, yE, zE, zE + 12, v, v + 1.3, 0.1, 0.4);
    wTube(m, (s) => ({ p: [0, yE - 0.2 - 16 * s * s, zE + 11.9 + 3.5 * s], hw: hw, th: lerp(0.3, 0.8, s) }), 10, v + 1.3, v + 2.6, 0.0, 0.7);
  }
  // (round 7) where the rising fall passes the well under the sphere it swells to fill the throat and narrows again: its own
  // falling water, in its own gravity (+Y), in place of the level pool that stood here in a gravity that is not this zone's
  { const yA = 39.4, yB = 29.8, sAt = (y) => Math.sqrt(Math.max(0, (FALL - 0.25 - y) / (FALL - 0.25 - SR * 0.9)));
    wTube(AQ[2], (q) => { const y = lerp(yA, yB, q), s = sAt(y), k = sst(0, 0.5, q) * (1 - sst(0.56, 1, q)), hw0 = lerp(4.0, 4.9, sst(0.02, 0.45, s)), th0 = lerp(0.9, 2.8, Math.sqrt(s));
      return { p: [0, y, -5 + 5.3 * s], hw: lerp(hw0 * 1.02, 6.5, k), th: lerp(th0 * 1.02, 6.1, k) }; }, 10, 1.9, 2.6, 0.22, 0.22); }
  await ctx.yield?.();
  const waterGeo = new THREE.BufferGeometry();
  waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(wP, 3)); waterGeo.setAttribute('normal', new THREE.Float32BufferAttribute(wN, 3));
  waterGeo.setAttribute('uv', new THREE.Float32BufferAttribute(wU, 2)); waterGeo.setAttribute('aW', new THREE.Float32BufferAttribute(wW, 3));
  await ctx.yield?.();
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);
  const teal = pal[5].clone(), haze = pal[3].clone(), plum = pal[4].clone(), coral = pal[6].clone(), cream = pal[0].clone();
  const GLSL_SUNS = /* glsl */`
    uniform vec3 sunD[3]; uniform vec3 sunC[3]; uniform vec3 uHaze; uniform vec3 uPlum; uniform vec3 uCream;
    vec3 sunWrap(vec3 n){ vec3 s = vec3(0.0); for (int i = 0; i < 3; i++) s += sunC[i] * (0.32 + 0.68 * max(dot(n, sunD[i]), 0.0)); return s * 0.62; }
    vec3 sunSpec(vec3 r, float p){ vec3 s = vec3(0.0); for (int i = 0; i < 3; i++) s += sunC[i] * pow(max(dot(r, sunD[i]), 0.0), p); return s; }
    // the world's "sky": luminous periwinkle haze, plum in the gaps, three soft suns
    vec3 hazeEnv(vec3 d, float sharp){ vec3 c = mix(uPlum * 1.3, uHaze, 0.55 + 0.45 * sfb3(d * 2.0));
      for (int i = 0; i < 3; i++) { float k = max(dot(d, sunD[i]), 0.0); c += sunC[i] * (pow(k, 3.0) * 0.38 + pow(k, 28.0 * sharp) * 2.4) + uCream * pow(k, 8.0) * 0.25; }
      return c; }`;
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
    uniforms: { ...fogU(), uTime: U.time, uSurge: U.surge, sunD: U.sunD, sunC: U.sunC, uTeal: { value: teal }, uHaze: { value: haze }, uPlum: { value: plum }, uCream: { value: cream } },
    vertexShader: /* glsl */`
      attribute vec3 aW; varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vWP;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vUv = uv; vW = aW; vN = normalize(mat3(modelMatrix) * normal);
        vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz;
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uSurge; uniform vec3 uTeal; varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vWP;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_SUNS}
      void main(){
        vec3 V = normalize(cameraPosition - vWP); vec3 N = normalize(vN); if (dot(N, V) < 0.0) N = -N;
        float t = uTime * (1.0 + 0.35 * uSurge);
        float fwUv = length(fwidth(vUv));      // taken here, before any branch or loop
        vec2 gp = (vWP.xz + vWP.yy * 0.71) * 3.0; float fwG = length(fwidth(gp));
        vec3 col; float alpha;
        if (vW.x > 0.5) {
          // falling water: long streaks that stretch as they accelerate, white where it tears
          float s = vW.z;
          float streak = sfb(vec2(vUv.x * 7.0, vUv.y * 2.6 - t * 1.25));
          float fine = svn(vec2(vUv.x * 26.0, vUv.y * 9.0 - t * 3.6));
          // It has a body (teal, nearly opaque), strands (thin threads drawn out along the fall, with darker gaps between them,
          // seen only close by) and spray (white flecks along its silhouette); it turns white where it tears.
          // (round 7, the owner's limit) The sheet is lit water: after the suns and the lanterns the brightest thing in a view, but
          // capped under the bloom threshold, so it never blooms into a pale beam. Only its sun glints pass the threshold: sparse
          // points where a strand mirrors one of the suns.
          float white = smoothstep(0.5, 0.94, streak * 0.8 + fine * 0.38 + s * 0.07 + uSurge * 0.04) * 0.8;
          float vein = smoothstep(0.35, 0.6, sfb(vec2(vUv.x * 13.0 + 4.0, vUv.y * 1.4 - t * 0.9)));
          float lodS = clamp(1.4 - fwUv * 90.0, 0.0, 1.0), lodT = clamp(1.4 - fwUv * 200.0, 0.0, 1.0);
          float th1 = svn(vec2(vUv.x * 58.0, vUv.y * 1.6 - t * 1.5)), th2 = svn(vec2(vUv.x * 131.0 + 9.0, vUv.y * 2.3 - t * 2.1));
          float strand = smoothstep(0.55, 0.8, th1) * 0.6 * lodS + smoothstep(0.6, 0.85, th2) * 0.4 * lodT;
          float gap = smoothstep(0.42, 0.2, th1) * lodS, gap2 = smoothstep(0.4, 0.2, th2) * lodT;
          vec3 lit = sunWrap(N);
          lit = mix(vec3(dot(lit, vec3(0.3, 0.5, 0.2))), lit, 0.55);        // the water keeps its own colour under any sun
          lit = clamp(lit * 1.3, vec3(0.8), vec3(1.2));
          vec3 aqua = uTeal * vec3(0.9, 1.1, 1.12) + vec3(0.2, 0.25, 0.24);
          vec3 body = uTeal * mix(0.62, 1.15, vein) * (1.0 - 0.4 * gap) * (1.0 - 0.25 * gap2);
          body = mix(body, aqua, 0.22 + 0.2 * vein + 0.5 * strand);
          col = mix(body, vec3(0.76, 0.91, 0.95), white) * lit * 1.08;
          float nv = dot(N, V);
          float spray = step(0.8, svn(vec2(vUv.x * 90.0, vUv.y * 14.0 - t * 5.0))) * smoothstep(0.4, 0.12, nv) * lodS;
          col = mix(col, vec3(0.8, 0.9, 0.94) * min(lit, vec3(1.0)), spray * 0.7);
          col = min(col, vec3(0.9));
          { vec3 T1 = normalize(cross(N, vec3(0.31, 0.54, 0.78)) + 1e-5), T2 = cross(N, T1);
            vec3 Ng = normalize(N + ((fine - 0.5) * T1 + (th1 - 0.5) * T2) * 0.9);
            float gm = smoothstep(0.66, 0.9, svn(vec2(vUv.x * 41.0 + 3.0, vUv.y * 5.2 - t * 2.6))) * smoothstep(0.35, 0.7, streak);
            col += min(sunSpec(reflect(-V, Ng), 48.0) * gm * 2.6 * clamp(1.5 - fwUv * 60.0, 0.0, 1.0), vec3(4.0)); }      // (a glint is a point of light, not a flare: four times white at most)
          float edge = smoothstep(0.02, 0.24, nv + (th1 - 0.5) * 0.24 * lodS);      // the silhouette breaks into strands: no soft blurred rim
          alpha = vW.y * max(edge, spray * 0.6) * mix(0.88, 0.98, white) * (1.0 - 0.3 * smoothstep(0.6, 1.0, s) * (1.0 - streak));
          // a stream built as a tube (kind 2 and up) thins out toward its two sharp edges, in strands
          if (vW.x > 1.5) alpha *= smoothstep(0.0, 0.5, clamp((vW.x - 2.0) / 0.45, 0.0, 1.0) + (th1 - 0.5) * 0.3 * lodS);
        } else {
          // channel and pool surfaces: deep teal, the haze mirrored at grazing angles, fine ripples that run with the flow
          float lod = clamp(1.0 - fwUv * 6.0, 0.0, 1.0);
          vec2 p = vec2(vUv.x * 22.0, vUv.y * 30.0 - t * 2.4);
          float r1 = sfb(p * vec2(1.0, 0.55)), r2 = sfb(p * 2.3 + vec2(5.0, 5.0 + t * 0.6));
          vec3 T1 = normalize(cross(N, vec3(0.31, 0.54, 0.78)) + 1e-5), T2 = normalize(cross(N, vec3(-0.71, 0.2, 0.4)) + 1e-5);
          vec3 Nr = normalize(N + ((r1 - 0.5) * 0.3 * T1 + (r2 - 0.5) * 0.2 * T2) * (0.3 + 0.7 * lod));
          float f0 = clamp(1.0 - dot(Nr, V), 0.0, 1.0); float fr = f0 * f0 * f0;
          vec3 R = reflect(-V, Nr);
          float edge = min(vUv.x, 1.0 - vUv.x);
          vec3 sw = sunWrap(N); sw = mix(vec3(dot(sw, vec3(0.3, 0.5, 0.2))), sw, 0.45);      // teal under any sun, not the sun's colour
          vec3 body = mix(uTeal, uPlum, 0.08) * (0.46 + 0.30 * r1) * sw * 1.25 * mix(1.3, 0.85, smoothstep(0.0, 0.25, edge));
          // caustic threads: the middle contour of a slow, warped noise
          float cz = svn(p * 0.55 + vec2(r2 * 1.6, t * 0.35));
          float ca = smoothstep(0.44, 0.5, cz) * smoothstep(0.56, 0.5, cz) * lod;
          body += uTeal * vec3(0.7, 1.0, 1.0) * ca * 0.18;
          vec3 env = mix(uPlum * 1.3, uHaze, 0.5 + 0.5 * r2);
          for (int i = 0; i < 3; i++) { float k = max(dot(R, sunD[i]), 0.0); env += sunC[i] * k * k * k * k * 0.3; }
          env = mix(env, uTeal * 1.1, 0.35);
          // sparkle: a much finer normal, so the suns break into points of light and not into patches; sparse and near white,
          // so it reads as glitter on water and never as flecks in stone
          vec2 ps = p * 3.1 + vec2(0.0, t * 0.8);
          vec3 Ns = normalize(N + ((svn(ps) - 0.5) * T1 + (svn(ps * 1.37 + 7.0) - 0.5) * T2) * 0.25);
          vec3 spk = sunSpec(reflect(-V, Ns), 220.0); float spkL = dot(spk, vec3(0.3, 0.5, 0.2));
          spk = mix(spk, spkL * vec3(0.9, 0.97, 1.0), 0.6) * smoothstep(0.74, 0.9, svn(vec2(ps.x, ps.y * 0.35) * 0.37 + 3.0));      // sparse, drawn out along the flow
          col = mix(body, env, 0.08 + 0.5 * fr) + spk * lod + sunSpec(R, 30.0) * 0.08;
          float foam = smoothstep(0.8, 0.3, r2 + (1.0 - vW.z) * 0.9) * vW.z;
          float lace = smoothstep(0.55, 0.95, sfb(vec2(p.x, p.y * 0.18)) * 0.75 + 0.45 * sfb(vec2(p.x * 2.3, p.y * 0.4) + 5.0)) * 0.07 * lod;      // pale marks drawn out along the flow: ripple light, not flecks
          col = mix(col, vec3(0.86, 0.95, 0.98) * sw, clamp(foam + lace, 0.0, 1.0));
          // glints fixed in the world: few, and gone before they shrink to single-pixel flecks
          vec2 gq = vec2(gp.x, gp.y * 0.35);      // stretched, so what is left is drawn-out ripple light and not angular flecks
          float glint = smoothstep(0.78, 0.98, svn(gq * 2.3 + vec2(t * 0.9, -t * 0.6)) * svn(gq * 3.1 - vec2(t * 0.7, t) + 13.0) * 1.9) * lod * clamp(1.0 - fwG * 6.0, 0.0, 1.0);
          col += mix(sunC[0] + sunC[1] * 0.6, vec3(1.3, 1.45, 1.5), 0.6) * glint * 0.1;
          float side = smoothstep(0.0, 0.08, vUv.x) * smoothstep(1.0, 0.92, vUv.x);
          alpha = vW.y * mix(0.9, 1.0, foam) * mix(0.75, 1.0, side);
        }
        gl_FragColor = vec4(col, alpha);
        #include <fog_fragment>
      }`,
  });
  const water = new THREE.Mesh(waterGeo, waterMat); water.name = 'water'; water.renderOrder = 3; core.add(water);
  await ctx.yield?.();

  // ------------------------------------------------------------------ the water sphere (two shells)
  const HITS = [new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, -1, 0), new THREE.Vector3(-0.894, 0, -0.447)];
  const spinAxisTilt = rng.range(-0.3, 0.3), spinRate = rng.range(0.07, 0.11) * rng.sign();
  const sphereGeo = new THREE.SphereGeometry(SR, 72, 44);
  const sphU = () => ({ ...fogU(), uTime: U.time, uSpin: U.spin, uSurge: U.surge, uHit: { value: HITS }, sunD: U.sunD, sunC: U.sunC,
    uTeal: { value: teal }, uHaze: { value: haze }, uPlum: { value: plum }, uCream: { value: cream } });
  const SPH_VERT = /* glsl */`
    uniform float uTime, uSurge; uniform vec3 uHit[4];
    varying vec3 vWP; varying vec3 vWN; varying vec3 vD;
    #include <common>
    #include <fog_pars_vertex>
    void main(){
      vec3 d = normalize(position); vD = d;
      float wob = 0.2 * sin(d.x * 3.1 + uTime * 0.9) * sin(d.y * 2.7 - uTime * 0.7) + 0.14 * sin(d.z * 4.3 + uTime * 1.3);
      float hit = 0.0;
      for (int k = 0; k < 4; k++) { float a = acos(clamp(dot(d, uHit[k]), -1.0, 1.0));
        hit += -0.5 * exp(-a * a * 16.0) + sin(a * 22.0 - uTime * 5.0) * exp(-a * 3.2) * 0.1 * (1.0 + uSurge); }
      vec3 p = position + d * (wob + hit);
      vec4 wp = modelMatrix * vec4(p, 1.0); vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * d);
      vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`;
  const SPH_HEAD = /* glsl */`
    uniform float uTime, uSpin, uSurge; uniform vec3 uHit[4]; uniform vec3 uTeal;
    varying vec3 vWP; varying vec3 vWN; varying vec3 vD;
    #include <common>
    #include <fog_pars_fragment>
    ${GLSL_NOISE}
    ${GLSL_SUNS}
    ${GLSL_FOG_FADE}
    vec3 spun(vec3 d){ float c = cos(uSpin), s = sin(uSpin); return vec3(d.x * c - d.z * s, d.y, d.x * s + d.z * c); }`;
  const sphereBack = new THREE.Mesh(sphereGeo, new THREE.ShaderMaterial({
    side: THREE.BackSide, fog: true, uniforms: sphU(), vertexShader: SPH_VERT,
    fragmentShader: SPH_HEAD + /* glsl */`
      void main(){
        // what you see THROUGH the ball: the hazy world and its three suns, flipped as by a lens
        vec3 I = normalize(vWP - cameraPosition), Nb = normalize(vWN);
        float thick = clamp(dot(Nb, I), 0.0, 1.0);
        vec3 outD = normalize(I - 1.3 * (Nb - dot(Nb, I) * I));
        vec3 env = hazeEnv(outD, 0.55);
        vec3 q = outD / max(abs(outD.x), max(abs(outD.y), abs(outD.z)));
        vec3 g = abs(fract(q * 1.5 + 0.5) - 0.5) + step(0.999, abs(q));
        float lat = smoothstep(0.07, 0.015, min(g.x, min(g.y, g.z)));
        env = mix(env, uCream * 0.95, lat * 0.4);
        vec3 dr = spun(vD);
        float ca = sfb3(dr * 3.2 + vec3(0.0, uTime * 0.12, 0.0));
        float bands = smoothstep(0.49, 0.53, ca) * smoothstep(0.58, 0.53, ca);
        float tk = thick * thick;
        vec3 deep = uTeal * vec3(0.5, 0.11, 0.13) + uPlum * 0.14, mid = uTeal * vec3(0.5, 0.6, 0.66), rim = uTeal * vec3(0.9, 1.0, 1.0);
        vec3 col = mix(mix(rim, mid, smoothstep(0.0, 0.35, thick)), deep, smoothstep(0.25, 1.0, tk));
        col += env * vec3(0.4, 0.88, 1.0) * (0.03 + 0.17 * (1.0 - thick));
        for (int i = 0; i < 3; i++) { float k = max(dot(outD, sunD[i]), 0.0); col += sunC[i] * (pow(k, 26.0) * 0.4 + pow(k, 110.0) * 6.0); }
        col += bands * (uTeal * 0.9 + 0.08) * 0.3;
        col *= 0.75 + 0.5 * sfb3(dr * 1.7 - vec3(uTime * 0.05));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }` }));
  sphereBack.name = 'sphere-back'; core.add(sphereBack);
  const sphereFront = new THREE.Mesh(sphereGeo, new THREE.ShaderMaterial({
    side: THREE.FrontSide, fog: true, transparent: true, depthWrite: false, premultipliedAlpha: true, uniforms: sphU(), vertexShader: SPH_VERT,
    fragmentShader: SPH_HEAD + /* glsl */`
      void main(){
        vec3 V = normalize(cameraPosition - vWP), N = normalize(vWN);
        vec3 dr = spun(vD);
        float nx = sfb3(dr * 5.0 + vec3(uTime * 0.2, 0.0, 0.0)) - 0.5, ny = sfb3(dr * 5.0 + vec3(7.3, uTime * 0.2, 1.7)) - 0.5;
        vec3 T1 = normalize(cross(N, vec3(0.03, 1.0, 0.01)) + 1e-5), T2 = cross(N, T1);
        float foam = 0.0, ring = 0.0;
        for (int k = 0; k < 4; k++) { float a = acos(clamp(dot(vD, uHit[k]), -1.0, 1.0));
          ring += sin(a * 24.0 - uTime * 5.5) * exp(-a * 2.6);
          foam += smoothstep(0.4 + 0.1 * uSurge, 0.14, a + 0.4 * nx) * smoothstep(0.25, 0.7, svn(vD.xz * 11.0 + vD.y * 9.0 - uTime * 1.5) + 0.6 * smoothstep(0.3, 0.1, a)); }
        N = normalize(N + 0.24 * (nx * T1 + ny * T2) + 0.16 * ring * T2);
        float F = pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 3.1);
        vec3 R = reflect(-V, N);
        vec3 refl = hazeEnv(R, 1.0) * 1.05 + uCream * 0.08;
        vec3 spec = sunSpec(R, 240.0) * 7.0 + sunSpec(R, 30.0) * 0.25;
        foam = clamp(foam, 0.0, 1.0);
        float a = clamp(F * 0.9 + 0.07, 0.0, 1.0) * (1.0 - foam) + foam * 0.92;
        vec3 col = refl * clamp(F * 0.9 + 0.07, 0.0, 1.0) * (1.0 - foam) + vec3(0.88, 0.96, 1.0) * sunWrap(N) * 1.05 * foam * 0.92 + spec;
        #ifdef USE_FOG
          col = mix(col, fogColor * a, 1.0 - fogFade());
        #endif
        gl_FragColor = vec4(col, a);
      }` }));
  sphereFront.name = 'sphere-front'; sphereFront.renderOrder = 2; core.add(sphereFront);
  await ctx.yield?.();

  // ------------------------------------------------------------------ goldfish (instanced, swim + leap in the shader)
  const fishN = Math.round(clamp(opts.fish ?? rng.int(40, 54), 8, 90)), leapN = Math.min(6, Math.max(2, Math.round(fishN / 8)));
  const fishGeo = new THREE.InstancedBufferGeometry();
  {
    const zs = [-0.5, -0.32, -0.08, 0.18, 0.38, 0.5], rs = [0.035, 0.09, 0.17, 0.165, 0.1, 0.012], sides = 6, pos = [], nor = [], idx = [];
    for (let j = 0; j < zs.length; j++) for (let i = 0; i < sides; i++) { const a = (i / sides) * 6.2832; pos.push(Math.cos(a) * rs[j] * 0.72, Math.sin(a) * rs[j] * 1.3, zs[j]); nor.push(Math.cos(a), Math.sin(a) * 0.6, 0); }
    for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < sides; i++) { const a = j * sides + i, b = j * sides + (i + 1) % sides; idx.push(a, b, b + sides, a, b + sides, a + sides); }
    const fin = (pts) => { const o = pos.length / 3; for (const p of pts) { pos.push(0, p[0], p[1]); nor.push(1, 0, 0); } for (let i = 1; i < pts.length - 1; i++) idx.push(o, o + i, o + i + 1); };
    fin([[0, -0.44], [0.3, -0.92], [0.06, -0.78], [-0.3, -0.92]]); fin([[0.2, 0.16], [0.4, -0.06], [0.33, -0.22], [0.15, -0.3]]); fin([[-0.19, 0.12], [-0.34, -0.02], [-0.17, -0.1]]);
    fishGeo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); fishGeo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); fishGeo.setIndex(idx);
    const iA = new Float32Array(fishN * 4), iB = new Float32Array(fishN * 4);
    for (let i = 0; i < fishN; i++) { const r = rng.range(3.2, 9.4), ym = Math.sqrt(Math.max(1, 10.4 * 10.4 - r * r)) - 1.0;
      iA.set([r, rng.range(-ym, ym) * 0.8, rng.range(0, 6.283), rng.range(0.16, 0.42) * (rng.chance(0.8) ? 1 : -1) * (5.5 / r + 0.4)], i * 4);
      iB.set([rng.range(1.5, 2.9) * (rng.chance(0.12) ? 1.35 : 1), rng.range(-0.3, 0.3), rng(), i < leapN ? i : -1], i * 4); }
    fishGeo.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); fishGeo.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
    fishGeo.instanceCount = fishN;
  }
  const fishMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide, fog: true,
    uniforms: { ...fogU(), uTime: U.time, uSpin: U.spin, uLeap: U.leap, uLeapMode: U.leapMode, uLeapN: { value: leapN }, sunD: U.sunD, sunC: U.sunC,
      uCoral: { value: coral }, uTeal: { value: teal }, uHaze: { value: haze }, uPlum: { value: plum }, uCream: { value: cream }, uTilt: { value: spinAxisTilt } },
    vertexShader: /* glsl */`
      attribute vec4 iA; attribute vec4 iB;
      uniform float uTime, uSpin, uLeap, uLeapMode, uLeapN, uTilt;
      varying vec3 vN; varying vec3 vL; varying float vSeed; varying float vIn;
      #include <common>
      #include <fog_pars_vertex>
      vec3 swimPos(float t){
        float ang = iA.z + t * iA.w + uSpin;
        vec3 p = vec3(cos(ang) * iA.x, iA.y + sin(ang * 2.0 + iB.z * 6.283) * 0.9, sin(ang) * iA.x);
        float tl = iB.y + uTilt, c = cos(tl), s = sin(tl);
        return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c);
      }
      vec3 leapPos(float q){
        float az = (iB.w / max(uLeapN - 1.0, 1.0) - 0.5) * 2.3;
        vec3 d0 = normalize(vec3(cos(az), -0.3 + 0.25 * sin(iB.w * 1.7), sin(az)));
        vec3 d1 = normalize(vec3(cos(az + 0.55), 0.62, sin(az + 0.55)));
        return normalize(mix(d0, d1, q)) * ${SR.toFixed(1)} * (0.84 + 0.82 * sin(3.14159 * q));
      }
      void main(){
        float sc = iB.x; vec3 c0, c1, up;
        if (iB.w > -0.5) {
          float q = uLeapMode > 0.5 ? (uLeap - iB.w / uLeapN * 0.78) / 0.22 : fract(uLeap + iB.w / uLeapN) / 0.3;
          float qq = clamp(q, 0.0, 1.0); c0 = leapPos(qq); c1 = leapPos(qq + 0.02); up = normalize(c0);
          sc *= smoothstep(0.0, 0.07, q) * smoothstep(1.0, 0.93, q);
        } else { c0 = swimPos(uTime); c1 = swimPos(uTime + 0.1); up = vec3(0.0, 1.0, 0.0); }
        vec3 fw = normalize(c1 - c0), rt = normalize(cross(up, fw)); up = cross(fw, rt);
        vec3 lp = position;
        lp.x += sin(lp.z * 5.5 - uTime * (3.0 + abs(iA.w) * 8.0) + iB.z * 20.0) * 0.12 * (0.55 - lp.z);
        vec3 p = c0 + (rt * lp.x + up * lp.y + fw * lp.z) * sc;
        vN = normalize(mat3(modelMatrix) * (rt * normal.x + up * normal.y + fw * normal.z));
        vL = position; vSeed = iB.z; vIn = step(length(p), ${SR.toFixed(1)});
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCoral, uTeal; varying vec3 vN; varying vec3 vL; varying float vSeed; varying float vIn;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_SUNS}
      void main(){
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        float pch = smoothstep(0.5, 0.62, svn(vec2(vL.z * 4.0 + vSeed * 31.0, vL.y * 6.0 + vSeed * 17.0)) + (vSeed - 0.5) * 0.5);
        vec3 base = mix(uCoral * vec3(1.0, 0.78, 0.5), vec3(1.0, 0.9, 0.8), pch) * mix(0.75, 1.1, smoothstep(-0.15, 0.15, vL.y));
        vec3 col = base * (0.55 + sunWrap(N)) * 1.5;
        col = mix(col, col * vec3(0.85, 1.0, 1.0) + uTeal * 0.06, vIn * 0.5);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }` });
  const fish = new THREE.Mesh(fishGeo, fishMat); fish.name = 'goldfish'; fish.frustumCulled = false; fish.renderOrder = 1; core.add(fish);
  await ctx.yield?.();

  // ------------------------------------------------------------------ mist (points) and lantern glows (points)
  const mP = [], mD = [], mG = [], mA = [];
  const tv = new THREE.Vector3(), tw = new THREE.Vector3(), tu = new THREE.Vector3();
  const emit = (n, pos, spread, axis, axisAmt, grav, size0, size1, travel0, travel1, jitter) => {
    for (let i = 0; i < n; i++) {
      tv.set(rng.gauss(), rng.gauss(), rng.gauss()); tw.copy(axis); tv.addScaledVector(tw, -tv.dot(tw)).normalize().multiplyScalar(spread).addScaledVector(axis, axisAmt * rng.range(0.4, 1));
      tu.set(rng.gauss(), rng.gauss(), rng.gauss()).multiplyScalar(jitter).add(pos);
      mP.push(tu.x, tu.y, tu.z); mD.push(tv.x, tv.y, tv.z); mG.push(grav.x, grav.y, grav.z);
      mA.push(rng(), rng.range(0.14, 0.3), rng.range(size0, size1), rng.range(travel0, travel1));
    }
  };
  const fallG = [new THREE.Vector3(0, -1, 0), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0)];
  const fallsAnchor = [];
  for (let k = 0; k < 3; k++) {
    const hit = HITS[k].clone().multiplyScalar(SR), lip = new THREE.Vector3(0, FALL, -5).applyMatrix4(AQ[k]);
    emit(150, hit.clone().multiplyScalar(1.08), 0.8, HITS[k], 0.95, fallG[k].clone().multiplyScalar(2.5), 3.5, 8, 6, 13, 1.8);
    emit(70, hit.clone().multiplyScalar(1.3), 0.5, HITS[k], 1, fallG[k].clone().multiplyScalar(-2), 6, 11, 6, 12, 3);
    for (let j = 0; j < 9; j++) { const f = (j + 0.5) / 9, pp = lip.clone().lerp(hit, f * f * 0.96 + 0.04);
      emit(10, pp, 0.55, fallG[k], 0.6, fallG[k].clone().multiplyScalar(16 + 22 * f), 1.6, 3.4, 3, 6, 2.6); }
    emit(30, lip.clone().addScaledVector(fallG[k], 6), 0.35, fallG[k], 1, fallG[k].clone().multiplyScalar(14), 2.5, 4.5, 3, 6, 2.2);
    fallsAnchor.push({ lip: lip.clone().add(core.position), end: hit.clone().add(core.position), gravity: fallG[k].clone() });
  }
  const gZ = new THREE.Vector3(0, 0, -1), upZ = new THREE.Vector3(0, 0, 1);
  emit(50, HITS[3].clone().multiplyScalar(SR * 1.02), 0.8, HITS[3], 0.5, gZ.clone().multiplyScalar(4), 2.5, 5, 4, 8, 1.2);
  for (let i = 0; i < NC; i++) { const p = new THREE.Vector3(0, -(i + 1) * DROP + 0.3, 12 + i * RUN + 1.2).applyMatrix4(CAS);
    for (let j = 0; j < 7; j++) emit(1, p.clone().add(new THREE.Vector3(0, rng.range(-3.8, 3.8), 0)), 0.5, upZ, 1, gZ.clone().multiplyScalar(1.5), 1.6, 3.2, 2, 4.5, 0.4); }
  emit(40, new THREE.Vector3(0, -NC * DROP - 6, 12 + NC * RUN + 14).applyMatrix4(CAS), 0.5, gZ, 1, gZ.clone().multiplyScalar(10), 3, 6, 4, 9, 2.5);
  // the splash where the rising fall leaves the well's basin (the last draws of the hero's rng: nothing after them changes)
  emit(70, new THREE.Vector3(-1.1, -33.2, 0), 0.9, new THREE.Vector3(0, 1, 0), 0.8, new THREE.Vector3(0, 2.2, 0), 2.6, 5.5, 3, 6.5, 3.2);
  const mistGeo = new THREE.BufferGeometry();
  mistGeo.setAttribute('position', new THREE.Float32BufferAttribute(mP, 3)); mistGeo.setAttribute('aDir', new THREE.Float32BufferAttribute(mD, 3));
  mistGeo.setAttribute('aG', new THREE.Float32BufferAttribute(mG, 3)); mistGeo.setAttribute('aP', new THREE.Float32BufferAttribute(mA, 4));
  mistGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 140);
  const mistCol = new THREE.Color(0, 0, 0); for (let i = 0; i < 3; i++) mistCol.add(sunCols[i]); mistCol.multiplyScalar(0.36).lerp(new THREE.Color(0.8, 0.94, 1.0), 0.55);
  const mist = new THREE.Points(mistGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: { ...fogU(), uTime: U.time, uSurge: U.surge, uViewH: U.viewH, uCol: { value: mistCol }, uMistA: { value: opts.mistAlpha ?? 0.2 } },
    vertexShader: /* glsl */`
      attribute vec3 aDir; attribute vec3 aG; attribute vec4 aP; uniform float uTime, uSurge, uViewH; varying float vA;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        float age = fract(uTime * aP.y * (1.0 + 0.3 * uSurge) + aP.x), e = 1.0 - (1.0 - age) * (1.0 - age);
        vec3 p = position + aDir * aP.w * e + aG * age * age;
        vA = smoothstep(0.0, 0.14, age) * pow(1.0 - age, 1.4) * (0.75 + 0.35 * uSurge);
        vec4 mvPosition = modelViewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = min(aP.z * 1.5 * (0.4 + 0.9 * age) * uViewH * 0.5 * projectionMatrix[1][1] / max(-mvPosition.z, 1.0), 220.0);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; uniform float uMistA; varying float vA;
      #include <common>
      #include <fog_pars_fragment>
      void main(){
        vec2 q = gl_PointCoord * 2.0 - 1.0; float r2 = dot(q, q); if (r2 > 1.0) discard;
        float s = exp(-r2 * 3.2) * (1.0 - r2);
        gl_FragColor = vec4(uCol * 0.95, s * vA * uMistA);
        #include <fog_fragment>
      }` }));
  mist.name = 'mist'; mist.renderOrder = 4; core.add(mist);
  await ctx.yield?.();

  const lp = [], ls = [];
  for (const l of K7.lanterns) K.lanterns.push(l);      // (round 7's own, last: every earlier lantern keeps its place in the list)
  for (const l of K.lanterns) { lp.push(l[0], l[1], l[2]); ls.push(l[3]); }
  const glowGeo = new THREE.BufferGeometry();
  glowGeo.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); glowGeo.setAttribute('aS', new THREE.Float32BufferAttribute(ls, 1));
  glowGeo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 170);
  const glows = new THREE.Points(glowGeo, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    uniforms: { ...fogU(), uTime: U.time, uViewH: U.viewH, uGS: { value: opts.glowSize ?? 11 }, uCol: { value: coral.clone().lerp(cream, 0.2).multiplyScalar(opts.glowGain ?? 1) } },
    vertexShader: /* glsl */`
      attribute float aS; uniform float uTime, uViewH, uGS; varying float vF;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vF = 0.8 + 0.2 * sin(uTime * 2.3 + position.x * 1.7 + position.z * 2.1 + position.y);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mvPosition;
        gl_PointSize = clamp(aS * uGS * uViewH * 0.5 * projectionMatrix[1][1] / max(-mvPosition.z, 1.0), 2.0, 90.0);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCol; varying float vF;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_FOG_FADE}
      void main(){
        vec2 q = gl_PointCoord * 2.0 - 1.0; float r = length(q); if (r > 1.0) discard;
        float k = max(1.0 - r, 0.0); float g = k * k * k * 1.6 + smoothstep(0.22, 0.0, r) * 1.2;
        gl_FragColor = vec4(uCol * g * vF * fogFade(), 1.0);
      }` }));
  glows.name = 'lantern-glow'; glows.renderOrder = 5; core.add(glows);

  // ------------------------------------------------------------------ anchors, hooks
  const P = (x, y, z) => new THREE.Vector3(x, y + CY, z);
  const anchors = {
    sphereCenter: P(0, 0, 0), sphereRadius: SR,
    entry: { position: P(0, 0, 100), facing: new THREE.Vector3(0, 0, -1) },
    exit: { position: P(0, 0, -100), facing: new THREE.Vector3(0, 0, -1) },
    portalSeat: { position: P(0, 0, -96), facing: new THREE.Vector3(0, 0, 1), radius: 7 },
    flyThrough: FLY.map((p) => P(p[0], p[1], p[2])),
    viewpoints: { front: P(0, 4, 150), orbitApex: P(31, 13, 5), high: P(118, 62, 124), low: P(-60, -40, 120) },
    falls: fallsAnchor,
    cascade: { top: new THREE.Vector3(0, 0, 6).applyMatrix4(CAS).add(core.position), bottom: new THREE.Vector3(0, -NC * DROP, 18 + NC * RUN).applyMatrix4(CAS).add(core.position),
      gravity: new THREE.Vector3(0, 0, -1), along: new THREE.Vector3(-1, 0, 0) },
    walkways,
    // polish: the stair under the cascade ({ a, b } its centre line from head to foot, `side` across it, `up` its own up, hw)
    // and the well under the sphere ({ center of its top, half-size, radius })
    soffitStair: { a: new THREE.Vector3(0, sof.y0, sof.top).applyMatrix4(CAS).add(core.position), b: new THREE.Vector3(0, sof.y0 - sof.nS * sof.ri, sof.top + sof.nS * sof.ru).applyMatrix4(CAS).add(core.position),
      side: new THREE.Vector3(0, -1, 0), up: new THREE.Vector3(0, 0, -1), hw: sof.hw },
    well: { center: new THREE.Vector3(-1.1, -35.2 + 1.6 + CY, 0), half: 12.5, radius: 7 },
    // (round 7) the balcony at the near end of the arcade under the cascade: a walk along it, in the cascade's own gravity
    arcadeBalcony: { a: new THREE.Vector3(-8, -61, 36.6).applyMatrix4(CAS).add(core.position), b: new THREE.Vector3(8, -61, 36.6).applyMatrix4(CAS).add(core.position), up: new THREE.Vector3(0, 1, 0).transformDirection(CAS) },
    suns: sunDirs.map((d) => d.clone()),
  };
  let progress = -1, u0 = 0.45, u1 = 0.64;
  const size = new THREE.Vector2();
  return {
    object, radius: 112, height: 224, center: P(0, 0, 0), anchors, uniforms: U,
    sphere: { back: sphereBack, front: sphereFront, fish },      // for a world that hangs a second, smaller ball (same geometry and materials)
    kit: { pal, style, U, stoneMaterial: stoneMat, waterMaterial: waterMat, makeStone: (o) => makeStoneMaterial(U, pal[4], pal[3], o) },
    stats: { triangles: Math.round(B.tris + wP.length / 9 + 2 * (72 * 44 * 2) + fishN * 76), bridges: nBridges, lanterns: K.lanterns.length, fish: fishN },
    setProgress(u) { progress = u; },
    setWindow(a, b) { u0 = a; u1 = Math.max(a + 0.01, b); },
    update(dt, time, camera) {
      U.time.value = time; U.spin.value = time * spinRate;
      if (progress >= 0) {
        U.leapMode.value = 1; U.leap.value = clamp((progress - u0) / (u1 - u0), -0.3, 1.4); U.prog.value = progress;
        U.surge.value = sst(u0 - 0.08, u0 + 0.02, progress) * (1 - sst(u1, u1 + 0.1, progress));
      } else { U.leapMode.value = 0; U.leap.value = time * 0.035; U.surge.value = 0.3 + 0.3 * Math.sin(time * 0.21); }
      if (ctx.renderer?.getDrawingBufferSize) U.viewH.value = ctx.renderer.getDrawingBufferSize(size).y;
    },
    dispose() {},
    ground: false, groundY: 0,
  };
}
