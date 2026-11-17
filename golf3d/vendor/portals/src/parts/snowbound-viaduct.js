// HERO SET PIECE for "snowbound-viaduct": THE EXPRESS ON THE VIADUCT.
//
// WHAT IT IS
//   A 300 m, 65 m high snowbound stone railway viaduct of seven 34 m arches (battered, stepped piers, proud
//   voussoir rings with keystones, pilasters, corbel table, low parapet with a lantern refuge over every pier,
//   telegraph wires, snow caps and icicles on every ledge, a lantern hung on a chain under each keystone and one on a bracket above the top
//   ledge of each pier, both faces, their light on the soffits and the stone), ending at both sides in a stone bastion with a tunnel mouth set in
//   a snowy crag. On it runs the Midwinter Express: a black-and-crimson steam locomotive (spinning spoked
//   drivers and coupling rods, snowplough, brass domes, glowing firebox and cab, headlamp with a visible cone
//   through the snowfall), a coal tender and eight crimson carriages with lit windows and a red tail lamp.
//   A ~150 m steam plume lit orange from below trails back over the carriages; whistle and cylinder jets,
//   lamp halos and a slab of falling snow that lights up amber near every lamp, window and in the headlamp.
//
// LOCAL SPACE   origin = base centre at river level under the central arch, +Y up. The viaduct runs along X
//   (x = -150..150, bastions/tunnels to +-172, crags to about +-235). The camera comes from +Z and flies
//   toward -Z through the central arch (34 m wide, crown at y 58.5). The train runs -X -> +X, i.e. left to
//   right for that camera. Piers reach down to y = -14 so terrain can bury their feet.
//
// OPTS
//   palette     7 hex strings in brief order [night blue, slate blue, mauve, snow, dark slate, crimson, amber]
//   progress    initial train progress 0..1 (default ~0.43: locomotive 50 m past the central arch, the whole
//               train and its plume on the viaduct). The world should call setProgress every frame.
//   crags       true (default) build the two snowy crags behind the tunnel bastions; false = bastions only
//   snow        true (default) own slab of falling snow round the deck (lit by lamps / train)
//   light       true (default) one warm PointLight riding on the firebox (the only real light)
//   trainScale  storybook exaggeration of the train (default 1.45; the tunnel mouths fit up to ~1.5)
//   carriages   number of carriages (default 8)
//   plough      true = a rotary snowplough is coupled ahead of the locomotive (spinning cutter wheel, chute) and throws an
//               arc of snow out over the parapet; anchors.train.headX then means the plough's nose (the world's rare event)
//   wind, blow  [x, z] wind and 0..1 how hard it drives the deck's falling snow sideways (default calm)
//   flakes      number of flakes in the deck's own snowfall (default: the part's own count)
//   Steam, sparks from the chimney, spindrift torn off the parapet snow as the train passes and the plough's arc are one
//   instanced mesh keyed to the train's position (nothing is made or switched after build).
//
// RETURNS (besides the contract fields)
//   setProgress(p)   p = 0..1: 0 = whole train still hidden in the left (-X) tunnel, 1 = whole train gone into
//                    the right tunnel. The locomotive front is at x = anchors.train.headX(p) (linear).
//                    Wheels, rods, plume, whistle and all light follow p. Drive it from path u, never time.
//   progressForU(u, uEnter = 0.42, uCentre = 0.6)   the brief's timing: loco leaves the left abutment at
//                    uEnter and is over the central arch at uCentre; returns p for setProgress.
//   setLight({ sky, ground, rim, rimDir, warm })   any subset (THREE.Color / hex / Vector3 for rimDir).
//   uniforms, info   shared uniform block; per-seed values and measured triangle count.
//
// ANCHORS (local space)
//   flyThrough   ordered camera points +Z -> -Z through the central arch at y 25 (>= 12 m from all stone)
//   archCentre, archClear { halfWidth, crownY, springY }   the central opening
//   portalSeat   { position, facing, note }: NOT built here. The 14 m portal belongs in the castle gatehouse
//                on the axis of the central arch (0, 64, -250), facing +Z, so the arch frames it.
//   castleSeat   base of the crag-top castle the arch should frame (0, 55, -250)
//   train        { deckY, railY, x0, x1, length, tunnelX, headX(p) }
//   viewpoints   { entry, river, underArch, farSide } good camera positions; gaze = point to look at
//   lamps        parapet lantern positions (for extra world fx);  firebox: where the PointLight rides at p
//
// SIZE   viaduct 300 x 10 x 80 m (deck 65 m + train + plume); with bastions and crags ~470 m. Reported
//        radius 150, height 80.
// COST   see info.triangles: about 66k triangles (27k stone, 21k train, 18k steam/snow/glow quads), 6 draw
//        calls, 1 PointLight, no textures. Build ~200 ms with ctx.yield() breaks. Scale the object uniformly
//        only (and preferably not at all): steam, halo and snowflake billboards assume scale 1.
// LIGHT  Self-lit ShaderMaterials (scene lights are ignored, scene fog is honoured): shadowless blue
//        hemisphere ambient, a low mauve rim from -Z (the thin cloud up-valley), warm light computed in the
//        shader from the parapet lanterns and from the moving train. Wants snowy dusk, bloom threshold ~0.9,
//        blue-lavender fog. Feed the sky kit's colours through setLight().
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#1b2a55', '#5a6fa8', '#c9b6c8', '#eef3fa', '#3b3f4a', '#7a2f2a', '#ffc46b'];

// material ids carried per vertex (static mesh)
const M_STONE = 0, M_SNOW = 1, M_ICE = 2, M_ROCK = 3, M_METAL = 4, M_LAMP = 5, M_VOUS = 6, M_DARK = 7, M_DECK = 8, M_SOFFIT = 9;
// material ids (train mesh)
const T_PAINT = 0, T_WINDOW = 1, T_BRASS = 2, T_ROOF = 3, T_LAMP = 4, T_FIRE = 5, T_COAL = 6;

// ---------------------------------------------------------------- geometry builder
class Geo {
  constructor(withSpin = false) {
    this.p = []; this.n = []; this.uv = []; this.c = []; this.m = []; this.i = []; this.nv = 0;
    this.sp = withSpin ? [] : null; this.spin = [0, 0, 0, 0]; this.ox = 0; this.oy = 0; this.oz = 0;
  }
  setSpin(cx = 0, cy = 0, r = 0, mode = 0) { this.spin = [cx + this.ox, cy + this.oy, r, mode]; }
  vert(x, y, z, nx, ny, nz, u, v, col, mat, sh = 1) {
    this.p.push(x + this.ox, y + this.oy, z + this.oz); this.n.push(nx, ny, nz); this.uv.push(u, v);
    this.c.push(col[0] * sh, col[1] * sh, col[2] * sh); this.m.push(mat);
    if (this.sp) this.sp.push(this.spin[0], this.spin[1], this.spin[2], this.spin[3]);
    return this.nv++;
  }
  // a,b,c,d counter-clockwise seen from outside. uvs: optional [[u,v] x4] in metres; ao: optional 4 shades
  quad(a, b, c, d, col, mat, uvs, ao) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = d[0] - a[0], vy = d[1] - a[1], vz = d[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const P = [a, b, c, d], id = [];
    for (let k = 0; k < 4; k++) {
      const q = P[k]; let u, v;
      if (uvs) { u = uvs[k][0]; v = uvs[k][1]; }
      else if (Math.abs(ny) > 0.7) { u = q[0]; v = q[2]; }
      else if (Math.abs(nz) >= Math.abs(nx)) { u = q[0]; v = q[1]; }
      else { u = q[2]; v = q[1]; }
      id.push(this.vert(q[0], q[1], q[2], nx, ny, nz, u, v, col, mat, ao ? ao[k] : 1));
    }
    this.i.push(id[0], id[1], id[2], id[0], id[2], id[3]);
  }
  tri(a, b, c, col, mat) {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const i0 = this.vert(a[0], a[1], a[2], nx, ny, nz, a[0] + a[2], a[1], col, mat);
    const i1 = this.vert(b[0], b[1], b[2], nx, ny, nz, b[0] + b[2], b[1], col, mat);
    const i2 = this.vert(c[0], c[1], c[2], nx, ny, nz, c[0] + c[2], c[1], col, mat);
    this.i.push(i0, i1, i2);
  }
  // hexahedron between a bottom rect B=[x0,x1,z0,z1] at y0 and a top rect T at y1. faces: string of
  // letters to emit: f(+z) k(-z) r(+x) l(-x) t(top) b(bottom)
  hexa(y0, y1, B, T, col, mat, faces = 'fkrlt', ao) {
    const [a0, a1, c0, c1] = B, [b0, b1, d0, d1] = T;
    const A = ao || [1, 1, 1, 1];
    if (faces.includes('f')) this.quad([a0, y0, c1], [a1, y0, c1], [b1, y1, d1], [b0, y1, d1], col, mat, null, A);
    if (faces.includes('k')) this.quad([a1, y0, c0], [a0, y0, c0], [b0, y1, d0], [b1, y1, d0], col, mat, null, A);
    if (faces.includes('r')) this.quad([a1, y0, c1], [a1, y0, c0], [b1, y1, d0], [b1, y1, d1], col, mat, null, A);
    if (faces.includes('l')) this.quad([a0, y0, c0], [a0, y0, c1], [b0, y1, d1], [b0, y1, d0], col, mat, null, A);
    if (faces.includes('t')) this.quad([b0, y1, d1], [b1, y1, d1], [b1, y1, d0], [b0, y1, d0], col, mat);
    if (faces.includes('b')) this.quad([a0, y0, c0], [a1, y0, c0], [a1, y0, c1], [a0, y0, c1], col, mat);
  }
  box(x0, x1, y0, y1, z0, z1, col, mat, faces = 'fkrlt', ao) { this.hexa(y0, y1, [x0, x1, z0, z1], [x0, x1, z0, z1], col, mat, faces, ao); }
  // box with a chamfered (bevelled) top edge of size bv
  bevelBox(x0, x1, y0, y1, z0, z1, bv, col, mat, faces = 'fkrlt') {
    this.box(x0, x1, y0, y1 - bv, z0, z1, col, mat, faces.replace('t', ''));
    this.hexa(y1 - bv, y1, [x0, x1, z0, z1], [x0 + bv, x1 - bv, z0 + bv, z1 - bv], col, mat, faces);
  }
  // surface of revolution about an axis ('x'|'y'|'z') through origin o. prof = [[r, a], ...] with a along the
  // axis; list it centre -> rim -> along -> rim -> centre with increasing a for outward normals.
  lathe(o, axis, prof, seg, col, mat, a0 = 0, a1 = Math.PI * 2) {
    const put = (r, a, th, nr, na) => {
      const cs = Math.cos(th), sn = Math.sin(th);
      let x, y, z, nx, ny, nz;
      if (axis === 'x') { x = a; y = r * cs; z = r * sn; nx = na; ny = nr * cs; nz = nr * sn; }
      else if (axis === 'y') { x = r * cs; y = a; z = -r * sn; nx = nr * cs; ny = na; nz = -nr * sn; }
      else { x = r * cs; y = r * sn; z = a; nx = nr * cs; ny = nr * sn; nz = na; }
      return this.vert(o[0] + x, o[1] + y, o[2] + z, nx, ny, nz, th * Math.max(r, 0.3), a, col, mat);
    };
    for (let j = 0; j < prof.length - 1; j++) {
      const [r0, h0] = prof[j], [r1, h1] = prof[j + 1];
      const dr = r1 - r0, da = h1 - h0, l = Math.hypot(dr, da) || 1, nr = da / l, na = -dr / l;
      let prev = null;
      for (let k = 0; k <= seg; k++) {
        const th = a0 + (a1 - a0) * (k / seg);
        const cur = [put(r0, h0, th, nr, na), put(r1, h1, th, nr, na)];
        if (prev) this.i.push(prev[0], cur[0], cur[1], prev[0], cur[1], prev[1]);
        prev = cur;
      }
    }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.m, 1));
    if (this.sp) g.setAttribute('aSpin', new THREE.Float32BufferAttribute(this.sp, 4));
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    return g;
  }
  // the same geometry as build(), one attribute at a time with the page handed back in between (each is a copy of a long array)
  async buildAsync(yld) {
    const g = new THREE.BufferGeometry(), step = async () => { if (yld) await yld(); };
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); await step();
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); await step();
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2)); await step();
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); await step();
    g.setAttribute('aMat', new THREE.Float32BufferAttribute(this.m, 1));
    if (this.sp) g.setAttribute('aSpin', new THREE.Float32BufferAttribute(this.sp, 4));
    await step();
    g.setIndex(this.nv > 65535 ? new THREE.Uint32BufferAttribute(this.i, 1) : new THREE.Uint16BufferAttribute(this.i, 1));
    return g;
  }
}

// ---------------------------------------------------------------- dimensions
const NARCH = 7, SPAN = 34, HALF = SPAN / 2, PIERW = 7, PITCH = SPAN + PIERW;
const DECK = 65, CROWN = 58.5, WALLTOP = 62.4, HZ = 4.5, FOOT = -14;
const RAILY = 65.0, BALLAST = 64.72, PARTOP = 65.75, PARZ = 4.95, XEND = 150, XT = 172;
const LAMPY = PARTOP + 2.75, LAMPZ = PARZ + 0.55;
const KEYY = CROWN - 1.85, KEYZ = HZ + 0.33;      // the lanterns hung under the keystones

const hex = (h) => { const c = new THREE.Color(h); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const WHITE = [1, 1, 1];

// ---------------------------------------------------------------- viaduct
// arch profile (superellipse; e = 2 is a semicircle, lower is slightly pointed)
function archProfile(xc, S, n) {
  const P = [], E = [], L = [0], pw = 2 / S.archExp;
  const at = (th) => { const c = Math.cos(th), s = Math.sin(th); return [xc - HALF * Math.sign(c) * Math.pow(Math.abs(c), pw), S.spring + S.rise * Math.pow(Math.max(s, 0), pw)]; };
  for (let i = 0; i <= n; i++) {
    const th = Math.PI * (i / n), p = at(th), a = at(Math.max(0, th - 0.01)), b = at(Math.min(Math.PI, th + 0.01));
    let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    P.push(p); E.push([p[0] - ty * S.ringT, Math.max(S.spring, p[1] + tx * S.ringT)]);
    if (i) L.push(L[i - 1] + Math.hypot(p[0] - P[i - 1][0], p[1] - P[i - 1][1]));
  }
  return { P, E, L };
}

async function buildViaduct(G, S, rng, noise, yld) {
  const st = S.stone, RZ = HZ + 0.25, NSEG = 28;
  const zsides = [1, -1];
  // a quad given in the x-y plane (CCW seen from +Z) at depth z, mirrored for the back face
  const faceQ = (zs, z, a, b, c, d, col, mat, uvs, ao) => {
    const A = [a[0], a[1], z * zs], B = [b[0], b[1], z * zs], C = [c[0], c[1], z * zs], D = [d[0], d[1], z * zs];
    if (zs > 0) G.quad(A, B, C, D, col, mat, uvs, ao);
    else G.quad(A, D, C, B, col, mat, uvs ? [uvs[0], uvs[3], uvs[2], uvs[1]] : null, ao ? [ao[0], ao[3], ao[2], ao[1]] : null);
  };
  const zr = (zs, a, b) => (zs > 0 ? [a, b] : [-b, -a]);
  const F = (zs, s) => (zs > 0 ? s : s.replace(/[fk]/g, (ch) => (ch === 'f' ? 'k' : 'f')));

  // ---- arches: voussoir rings, soffits, spandrel walls
  for (let k = 0; k < NARCH; k++) {
    const xc = (k - (NARCH - 1) / 2) * PITCH, { P, E, L } = archProfile(xc, S, NSEG);
    const tint = mul(st, 0.92 + 0.14 * rng());
    for (let i = 0; i < NSEG; i++) {
      const p0 = P[i], p1 = P[i + 1], e0 = E[i], e1 = E[i + 1];
      for (const zs of zsides) {
        faceQ(zs, RZ, p0, p1, e1, e0, mul(tint, 1.08), M_VOUS, [[L[i], 0], [L[i + 1], 0], [L[i + 1], S.ringT], [L[i], S.ringT]]);
        faceQ(zs, HZ, e0, e1, [e1[0], WALLTOP], [e0[0], WALLTOP], tint, M_STONE, null, [0.96, 0.96, 0.74, 0.74]);
        // step of the proud ring
        const a = [e0[0], e0[1], RZ * zs], b = [e1[0], e1[1], RZ * zs], c = [e1[0], e1[1], HZ * zs], d = [e0[0], e0[1], HZ * zs];
        if (zs > 0) G.quad(a, b, c, d, tint, M_STONE); else G.quad(a, d, c, b, tint, M_STONE);
      }
      // soffit in three strips, darker in the middle of the barrel
      const zst = [RZ, 2.4, -2.4, -RZ], sh = [0.95, 0.5, 0.5, 0.95];
      for (let q = 0; q < 3; q++) {
        G.quad([p0[0], p0[1], zst[q]], [p0[0], p0[1], zst[q + 1]], [p1[0], p1[1], zst[q + 1]], [p1[0], p1[1], zst[q]], mul(tint, 0.9), M_SOFFIT,
          [[zst[q], L[i]], [zst[q + 1], L[i]], [zst[q + 1], L[i + 1]], [zst[q], L[i + 1]]], [sh[q], sh[q + 1], sh[q + 1], sh[q]]);
      }
    }
    for (const zs of zsides) {
      faceQ(zs, HZ, [xc - PITCH / 2, S.spring], [E[0][0], S.spring], [E[0][0], WALLTOP], [xc - PITCH / 2, WALLTOP], tint, M_STONE);
      faceQ(zs, HZ, [E[NSEG][0], S.spring], [xc + PITCH / 2, S.spring], [xc + PITCH / 2, WALLTOP], [E[NSEG][0], WALLTOP], tint, M_STONE);
      // keystone
      const [z0, z1] = zr(zs, HZ, HZ + 0.62);
      G.hexa(CROWN - 0.25, CROWN + S.ringT + 0.8, [xc - 0.62, xc + 0.62, z0, z1], [xc - 0.95, xc + 0.95, z0, z1], mul(st, 1.2), M_STONE, F(zs, 'frltb'));
      {   // a lantern hung on a short chain under every keystone, on both faces
        const lz = KEYZ * zs, ky = CROWN - 0.25, mt = [0.05, 0.055, 0.07];
        G.box(xc - 0.04, xc + 0.04, ky - 1.0, ky, lz - 0.04, lz + 0.04, mt, M_METAL, 'fkrl');
        G.hexa(ky - 1.14, ky - 0.96, [xc - 0.46, xc + 0.46, lz - 0.46, lz + 0.46], [xc - 0.08, xc + 0.08, lz - 0.08, lz + 0.08], mt, M_METAL, 'fkrl');
        G.hexa(ky - 2.05, ky - 1.14, [xc - 0.24, xc + 0.24, lz - 0.24, lz + 0.24], [xc - 0.38, xc + 0.38, lz - 0.38, lz + 0.38], S.amberC, M_LAMP, 'fkrlb');
        S.keyLamps.push([xc, KEYY, lz]);
      }
    }
    if (yld && k % 2 === 1) await yld();
  }

  // ---- piers
  for (let j = 0; j <= NARCH; j++) {
    const px = (j - NARCH / 2) * PITCH, tint = mul(st, 0.9 + 0.16 * rng());
    let hw = PIERW / 2, hd = HZ + 0.35, yTop = S.spring - 0.9;
    // impost band at the springing
    G.bevelBox(px - hw - 0.5, px + hw + 0.5, S.spring - 0.9, S.spring + 0.55, -hd - 0.5, hd + 0.5, 0.3, mul(tint, 1.12), M_STONE, 'fkrltb');
    const tiers = S.tiers, hT = (yTop - FOOT) / tiers;
    for (let t = 0; t < tiers; t++) {
      const yBot = yTop - hT * (t === tiers - 1 ? 1 : 0.94 + 0.12 * rng()), h = yTop - yBot;
      const hw2 = hw + S.batterX * h, hd2 = hd + S.batterZ * h;
      const dark = [1 - 0.06 * t, 1 - 0.06 * t, 1 - 0.03 * t, 1 - 0.03 * t];
      G.hexa(yBot, yTop, [px - hw2, px + hw2, -hd2, hd2], [px - hw, px + hw, -hd, hd], tint, M_STONE, 'fkrl', [dark[0], dark[1], 0.9, 0.9]);
      // buttress rib on both faces, following the batter
      const rw = 1.35, rp = 0.55;
      G.hexa(yBot, yTop, [px - rw, px + rw, hd2, hd2 + rp + 0.25], [px - rw, px + rw, hd, hd + rp], mul(tint, 1.06), M_STONE, 'frl');
      G.hexa(yBot, yTop, [px - rw, px + rw, -hd2 - rp - 0.25, -hd2], [px - rw, px + rw, -hd - rp, -hd], mul(tint, 1.06), M_STONE, 'krl');
      if (t === 0) for (const zs of zsides) {      // a bracket lantern on the buttress rib above the first ledge: its light lies on the ledge's snow
        const ly = yBot + 2.3, zf = lerp(hd2, hd, 2.3 / h) + rp + 0.14, lz = (zf + 0.72) * zs, mt = [0.05, 0.055, 0.07];
        const [b0, b1] = zr(zs, zf - 0.1, zf + 0.95);
        G.box(px - 0.05, px + 0.05, ly + 0.98, ly + 1.08, b0, b1, mt, M_METAL, 'fkrltb');
        G.hexa(ly + 0.74, ly + 0.98, [px - 0.5, px + 0.5, lz - 0.5, lz + 0.5], [px - 0.08, px + 0.08, lz - 0.08, lz + 0.08], WHITE, M_SNOW, 'fkrl');
        G.hexa(ly - 0.2, ly + 0.74, [px - 0.26, px + 0.26, lz - 0.26, lz + 0.26], [px - 0.42, px + 0.42, lz - 0.42, lz + 0.42], S.amberC, M_LAMP, 'fkrlb');
        S.pierLamps.push([px, ly + 0.3, lz]);
      }
      if (t < tiers - 1) { // weathered set-back ledge
        const o = S.ledge;
        S.ledges.push([px, yBot, hw2, hd2]);
        G.hexa(yBot - 0.55, yBot, [px - hw2 - o, px + hw2 + o, -hd2 - o - 0.9, hd2 + o + 0.9], [px - hw2, px + hw2, -hd2 - 0.8, hd2 + 0.8], mul(tint, 1.1), M_STONE, 'fkrl');
        hw = hw2 + o; hd = hd2 + o; yTop = yBot - 0.55;
      } else { // plinth
        G.bevelBox(px - hw2 - 0.8, px + hw2 + 0.8, FOOT, FOOT + 15 + 3 * rng(), -hd2 - 1.6, hd2 + 1.6, 0.6, mul(tint, 0.95), M_STONE, 'fkrlt');
      }
    }
    // pilaster above the springing, corbelled out into a refuge bay with a lantern
    for (const zs of zsides) {
      let [z0, z1] = zr(zs, HZ, HZ + 0.6);
      G.box(px - 2.2, px + 2.2, S.spring + 0.55, WALLTOP - 1.7, z0, z1, mul(tint, 1.05), M_STONE, F(zs, 'frl'), [1, 1, 0.8, 0.8]);
      const [y0, y1] = zr(zs, HZ, HZ + 1.35);
      G.hexa(WALLTOP - 1.7, WALLTOP + 0.55, [px - 2.2, px + 2.2, z0, z1], [px - 2.7, px + 2.7, y0, y1], mul(tint, 1.12), M_STONE, F(zs, 'frlb'));
      const [b0, b1] = zr(zs, PARZ - 0.5, HZ + 1.35);
      G.box(px - 2.7, px + 2.7, WALLTOP + 0.55, PARTOP, b0, b1, tint, M_STONE, 'fkrl');
      const [c0, c1] = zr(zs, PARZ - 0.6, HZ + 1.47);
      G.bevelBox(px - 2.82, px + 2.82, PARTOP, PARTOP + 0.3, c0, c1, 0.12, mul(tint, 1.15), M_STONE, 'fkrlt');
      // lantern post, bracket, lantern, cap
      const lz = LAMPZ * zs, mt = [0.05, 0.055, 0.07];
      G.hexa(PARTOP + 0.3, LAMPY - 0.45, [px - 0.13, px + 0.13, lz - 0.13, lz + 0.13], [px - 0.07, px + 0.07, lz - 0.07, lz + 0.07], mt, M_METAL, 'fkrl');
      G.box(px - 0.5, px + 0.5, LAMPY - 1.2, LAMPY - 1.1, lz - 0.04, lz + 0.04, mt, M_METAL, 'fkrltb');
      G.hexa(LAMPY - 0.45, LAMPY + 0.3, [px - 0.2, px + 0.2, lz - 0.2, lz + 0.2], [px - 0.33, px + 0.33, lz - 0.33, lz + 0.33], S.amberC, M_LAMP, 'fkrlb');
      G.hexa(LAMPY + 0.3, LAMPY + 0.72, [px - 0.42, px + 0.42, lz - 0.42, lz + 0.42], [px - 0.05, px + 0.05, lz - 0.05, lz + 0.05], WHITE, M_SNOW, 'fkrl');
      S.lamps.push([px, LAMPY, lz]);
    }
    if (yld && j % 3 === 2) await yld();
  }
  if (yld) await yld();

  // ---- solid abutment walls from the last pier to the tunnel bastions
  const xa = (NARCH / 2) * PITCH;
  for (const sx of [-1, 1]) for (const zs of zsides) {
    const x0 = sx > 0 ? xa : -XT, x1 = sx > 0 ? XT : -xa;
    faceQ(zs, HZ, [x0, FOOT], [x1, FOOT], [x1, WALLTOP], [x0, WALLTOP], mul(st, 0.97), M_STONE, null, [0.8, 0.8, 0.78, 0.78]);
    // blind arch panel so the abutment is not a bare wall
    const bx = sx * (xa + XT) / 2, [z0, z1] = zr(zs, HZ, HZ + 0.4);
    G.box(bx - 9, bx - 7, 20, WALLTOP, z0, z1, mul(st, 1.06), M_STONE, F(zs, 'frl'));
    G.box(bx + 7, bx + 9, 20, WALLTOP, z0, z1, mul(st, 1.06), M_STONE, F(zs, 'frl'));
    const [q0, q1] = zr(zs, HZ, HZ + 0.7);
    G.bevelBox(bx - 9.6, bx + 9.6, 18.8, 20.2, q0, q1, 0.25, mul(st, 1.1), M_STONE, F(zs, 'frlt'));
  }

  // ---- corbel table, string course, parapet, coping, deck and rails (full length to the tunnels)
  for (const zs of zsides) {
    const [s0, s1] = zr(zs, HZ, HZ + 0.5);
    G.box(-XT, XT, WALLTOP, WALLTOP + 0.55, s0, s1, mul(st, 1.14), M_STONE, F(zs, 'ftb'));
    const [p0, p1] = zr(zs, PARZ - 0.5, PARZ);
    G.box(-XT, XT, WALLTOP + 0.55, PARTOP, p0, p1, mul(st, 1.0), M_STONE, 'fk');
    const [c0, c1] = zr(zs, PARZ - 0.6, PARZ + 0.1);
    G.bevelBox(-XT, XT, PARTOP, PARTOP + 0.28, c0, c1, 0.1, mul(st, 1.16), M_STONE, 'fkt');
    for (let x = -XT + 1; x < XT - 0.5; x += 1.55) {
      const near = Math.abs(((x / PITCH + 0.5) % 1 + 1) % 1 - 0.5) * PITCH; // distance to nearest pier centre
      if (near < 2.5 && Math.abs(x) < xa + 3) continue;
      const [a0, a1] = zr(zs, HZ, HZ + 0.14), [b0, b1] = zr(zs, HZ, HZ + 0.46);
      G.hexa(WALLTOP - 0.75, WALLTOP, [x - 0.26, x + 0.26, a0, a1], [x - 0.3, x + 0.3, b0, b1], mul(st, 1.1), M_STONE, F(zs, 'frl'));
    }
    const rz = 0.72 * S.trainScale * zs;
    G.box(-XT, XT, BALLAST, RAILY, rz - 0.07, rz + 0.07, [0.05, 0.05, 0.06], M_METAL, 'fkt');
  }
  G.quad([-XT, BALLAST, PARZ - 0.5], [XT, BALLAST, PARZ - 0.5], [XT, BALLAST, -PARZ + 0.5], [-XT, BALLAST, -PARZ + 0.5], WHITE, M_DECK);
}

function appendGeo(G, src, axis = -1) { // axis: -1 copy, 0 mirror in X, 2 mirror in Z
  const base = G.nv, mir = axis >= 0;
  for (let k = 0; k < src.nv; k++) {
    for (let a = 0; a < 3; a++) { const sg = a === axis ? -1 : 1; G.p.push(src.p[k * 3 + a] * sg); G.n.push(src.n[k * 3 + a] * sg); }
    G.uv.push(src.uv[k * 2], src.uv[k * 2 + 1]); G.c.push(src.c[k * 3], src.c[k * 3 + 1], src.c[k * 3 + 2]); G.m.push(src.m[k]);
    if (G.sp) { const m = src.sp[k * 4 + 3]; G.sp.push(src.sp[k * 4], src.sp[k * 4 + 1], src.sp[k * 4 + 2], mir && m > 1.5 ? m + 4 : m); }
  }
  for (let k = 0; k < src.i.length; k += 3) G.i.push(base + src.i[k], base + src.i[k + (mir ? 2 : 1)], base + src.i[k + (mir ? 1 : 2)]);
  G.nv += src.nv;
}

// ---------------------------------------------------------------- tunnel bastion + crag (canonical +X side)
function buildBastion(G, S, rng, noise, withCrag, out) {
  const st = mul(S.stone, 0.9 + 0.12 * rng()), xF = XT - 2, xB = XT + 16, zT = 13, zB = 17, TB = DECK + 18.5 + 4 * rng();
  const RO = 4.0, yS = BALLAST + 6.2, xi = xF + 1.6;
  const zAt = (y) => zT + (zB - zT) * (TB - y) / (TB - FOOT);
  // face toward the viaduct, with the tunnel mouth cut out
  G.quad([xF, FOOT, -zB], [xF, FOOT, -RO], [xF, TB, -RO], [xF, TB, -zT], st, M_STONE, null, [0.7, 0.7, 1, 1]);
  G.quad([xF, FOOT, RO], [xF, FOOT, zB], [xF, TB, zT], [xF, TB, RO], st, M_STONE, null, [0.7, 0.7, 1, 1]);
  G.quad([xF, FOOT, -RO], [xF, FOOT, RO], [xF, BALLAST, RO], [xF, BALLAST, -RO], st, M_STONE);
  const O = [], O2 = [], L = [0], NA = 14;
  O.push([-RO, BALLAST]); O2.push([-RO - 1, BALLAST]);
  for (let i = 0; i <= NA; i++) { const a = Math.PI * (1 - i / NA), c = Math.cos(a), s = Math.sin(a); O.push([RO * c, yS + RO * s]); O2.push([(RO + 1) * c, yS + (RO + 1) * s]); }
  O.push([RO, BALLAST]); O2.push([RO + 1, BALLAST]);
  for (let i = 1; i < O.length; i++) L.push(L[i - 1] + Math.hypot(O[i][0] - O[i - 1][0], O[i][1] - O[i - 1][1]));
  for (let i = 0; i < O.length - 1; i++) {
    const a = O[i], b = O[i + 1], a2 = O2[i], b2 = O2[i + 1];
    if (i > 0 && i < O.length - 2) G.quad([xF, a[1], a[0]], [xF, b[1], b[0]], [xF, TB, b[0]], [xF, TB, a[0]], st, M_STONE);
    G.quad([xF, a[1], a[0]], [xi, a[1], a[0]], [xi, b[1], b[0]], [xF, b[1], b[0]], mul(st, 0.55), M_STONE, null, [1, 0.25, 0.25, 1]);
    G.quad([xF - 0.3, a[1], a[0]], [xF - 0.3, b[1], b[0]], [xF - 0.3, b2[1], b2[0]], [xF - 0.3, a2[1], a2[0]], mul(st, 1.15), M_VOUS, [[L[i], 0], [L[i + 1], 0], [L[i + 1], 1], [L[i], 1]]);
    G.quad([xF - 0.3, a2[1], a2[0]], [xF - 0.3, b2[1], b2[0]], [xF, b2[1], b2[0]], [xF, a2[1], a2[0]], st, M_STONE);
  }
  G.quad([xi, BALLAST, -RO], [xi, BALLAST, RO], [xi, yS + RO, RO], [xi, yS + RO, -RO], [0, 0, 0], M_DARK);
  G.hexa(yS + RO - 0.2, yS + RO + 1.9, [xF - 0.7, xF, -0.6, 0.6], [xF - 0.7, xF, -0.95, 0.95], mul(st, 1.25), M_STONE, 'fklbt');
  // battered sides, belt course, cornice, merlons
  G.hexa(FOOT, TB, [xF, xB, -zB, zB], [xF, xB, -zT, zT], st, M_STONE, 'fkrt', [0.7, 0.7, 1, 1]);
  for (const y of [WALLTOP, DECK + 13.2]) { const z = zAt(y) + 0.45, z2 = zAt(y + 0.7) + 0.45; G.hexa(y, y + 0.7, [xF - 0.45, xB, -z, z], [xF - 0.45, xB, -z2, z2], mul(st, 1.15), M_STONE, y > DECK ? 'fkbt' : 'fklbt'); }
  G.quad([xF - 0.45, DECK + 13.2, -zT - 0.6], [xF - 0.45, DECK + 13.2, -RO - 1.2], [xF - 0.45, DECK + 13.9, -RO - 1.2], [xF - 0.45, DECK + 13.9, -zT - 0.6], mul(st, 1.15), M_STONE);
  G.quad([xF - 0.45, DECK + 13.2, RO + 1.2], [xF - 0.45, DECK + 13.2, zT + 0.6], [xF - 0.45, DECK + 13.9, zT + 0.6], [xF - 0.45, DECK + 13.9, RO + 1.2], mul(st, 1.15), M_STONE);
  G.hexa(TB - 1.3, TB, [xF - 0.2, xB, -zT - 0.2, zT + 0.2], [xF - 0.7, xB, -zT - 0.7, zT + 0.7], mul(st, 1.12), M_STONE, 'fklbt');
  const mer = (x0, x1, z0, z1) => G.bevelBox(x0, x1, TB, TB + 1.5 + 0.2 * rng(), z0, z1, 0.18, mul(st, 0.95 + 0.2 * rng()), M_STONE, 'fkrlt');
  if (S.crenel) {
    for (let z = -zT - 0.5; z < zT; z += 2.7) mer(xF - 0.7, xF + 0.4, z, z + 1.5);
    for (let x = xF + 2; x < xB - 1; x += 2.7) { mer(x, x + 1.5, zT - 0.4, zT + 0.7); mer(x, x + 1.5, -zT - 0.7, -zT + 0.4); }
  } else { // hipped snow roof
    G.hexa(TB, TB + 7, [xF - 1.2, xB, -zT - 1.2, zT + 1.2], [xF + 7, xB, -1.5, 1.5], WHITE, M_SNOW, 'fkl');
  }
  // small lit windows (signal cabin) and bracket lamps beside the mouth
  const win = (y, z, w, h, k) => {
    G.quad([xF - 0.06, y, z - w], [xF - 0.06, y, z + w], [xF - 0.06, y + h, z + w], [xF - 0.06, y + h, z - w], mul(S.amberC, k), M_LAMP);
    G.bevelBox(xF - 0.5, xF, y - 0.35, y, z - w - 0.3, z + w + 0.3, 0.1, mul(st, 1.2), M_STONE, 'fklt');
    out.glows.push([xF - 0.5, y + h / 2, z, S.amberC, 3.2 * k + 2, 0.5]);
  };
  const wy = DECK + 14.6;
  for (const z of [-7.5, -2.5, 2.5, 7.5]) if (rng() < 0.8) win(wy, z, 0.45, 1.5, 0.5 + 0.5 * rng());
  for (const zs of [-1, 1]) {
    const z = zs * (RO + 2.4), y = BALLAST + 5.2;
    G.box(xF - 1.1, xF, y + 0.9, y + 1.0, z - 0.05, z + 0.05, [0.05, 0.05, 0.07], M_METAL, 'fklbt');
    G.hexa(y, y + 0.75, [xF - 1.25, xF - 0.85, z - 0.2, z + 0.2], [xF - 1.38, xF - 0.72, z - 0.33, z + 0.33], S.amberC, M_LAMP, 'fkrlb');
    G.hexa(y + 0.75, y + 1.15, [xF - 1.45, xF - 0.65, z - 0.4, z + 0.4], [xF - 1.1, xF - 1.0, z - 0.05, z + 0.05], WHITE, M_SNOW, 'fkrl');
    out.glows.push([xF - 1.05, y + 0.4, z, S.amberC, 6.5, 1]);
    out.lamps.push([xF - 1.05, y + 0.4, z]);
  }
  // semaphore signal lamp above the keystone (green = line clear)
  G.box(xF - 0.95, xF - 0.55, yS + RO + 2.3, yS + RO + 2.75, -0.22, 0.22, [0.25, 1.0, 0.55], M_LAMP, 'fklbt');
  out.glows.push([xF - 1.0, yS + RO + 2.5, 0, [0.2, 1.0, 0.5], 3.4, 1]);

  if (!withCrag) return;
  // crag: a heightfield mound that swallows the back of the bastion
  const X0 = XT - 24, X1 = XT + 58, ZH = 52, NX = 30, NZ = 40, so = rng() * 100;
  const pz = rng.range(-14, 14);
  const hf = (x, z) => {
    const az = Math.abs(z), front = XT + 6 - 27 * smoothstep(13, 30, az);
    const rise = smoothstep(front - 1, front + 15, x);
    const edge = Math.pow(smoothstep(0, 34, Math.min((ZH - az) * 1.1, X1 - x)), 0.8);
    const peak = Math.exp(-(Math.pow((x - XT - 30) / 17, 2) + Math.pow((z - pz) / 15, 2)));
    const top = (DECK + 7 + 12 * noise.fbm2(x * 0.02 + so, z * 0.02, 3) + 24 * peak - FOOT) * (1 - 0.35 * smoothstep(16, ZH, az));
    return FOOT + rise * edge * (top + 13 * (noise.ridged2(x * 0.03 + so, z * 0.03, 4) - 0.35) + 7 * noise.ridged2(x * 0.075 - so, z * 0.075, 2));
  };
  const idx = [];
  for (let i = 0; i <= NX; i++) for (let j = 0; j <= NZ; j++) {
    const x = lerp(X0, X1, i / NX) + (i > 0 && i < NX ? (rng() - 0.5) * 1.6 : 0), z = lerp(-ZH, ZH, j / NZ) + (j > 0 && j < NZ ? (rng() - 0.5) * 1.6 : 0);
    const y = hf(x, z), e = 0.8, dx = hf(x + e, z) - hf(x - e, z), dz = hf(x, z + e) - hf(x, z - e);
    let nx = -dx, ny = 2 * e, nz = -dz; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const k = 0.8 + 0.3 * noise.n2(x * 0.07 + so, z * 0.07);
    idx.push(G.vert(x, y, z, nx, ny, nz, x + z, y, [k, k, k], M_ROCK));
  }
  for (let i = 0; i < NX; i++) for (let j = 0; j < NZ; j++) {
    const a = idx[i * (NZ + 1) + j], b = idx[i * (NZ + 1) + j + 1], c = idx[(i + 1) * (NZ + 1) + j + 1], d = idx[(i + 1) * (NZ + 1) + j];
    G.i.push(a, b, c, a, c, d);
  }
}

// ---------------------------------------------------------------- snow caps and icicles
async function addSnowAndIce(G, S, rng, noise, yld) {
  // puffy snow ridge along X on top of a ledge
  const ridge = (x0, x1, y, zc, w, h, step = 1.3) => {
    const n = Math.max(2, Math.round((x1 - x0) / step)), prof = [[-0.5, 0, -0.9, 0.45], [-0.34, 0.72, -0.6, 0.8], [0, 1, 0, 1], [0.34, 0.72, 0.6, 0.8], [0.5, 0, 0.9, 0.45]];
    let prev = null;
    for (let k = 0; k <= n; k++) {
      const x = lerp(x0, x1, k / n), hh = h * (0.6 + 0.55 * (noise.n2(x * 0.45, zc * 3.1) * 0.5 + 0.5) + 0.35 * (noise.n2(x * 0.11, zc) * 0.5 + 0.5));
      const cur = prof.map((q) => G.vert(x, y + q[1] * hh, zc + q[0] * w * (1 + 0.15 * noise.n2(x * 0.3, 7 + zc)), 0, q[3], q[2], x, zc + q[0], WHITE, M_SNOW));
      if (prev) for (let q = 0; q < 4; q++) G.i.push(prev[q], prev[q + 1], cur[q + 1], prev[q], cur[q + 1], cur[q]);
      prev = cur;
    }
  };
  for (const zs of [-1, 1]) {
    ridge(-XT, XT, PARTOP + 0.26, zs * (PARZ - 0.25), 0.82, 0.42);
    ridge(-XT, XT, WALLTOP + 0.5, zs * (HZ + 0.36), 0.3, 0.2, 2.6);
    ridge(-XT, XT, BALLAST - 0.02, zs * (PARZ - 1.0), 1.3, 0.55, 2.2);   // drifts along the inside of the parapets
    if (yld) await yld();
  }
  // telegraph poles and sagging wires along the -Z parapet (they stand clear above the carriage roofs)
  {
    const mt = [0.075, 0.062, 0.058], WIREC = [0.17, 0.18, 0.25], zP = -(PARZ - 0.22), top = PARTOP + 8.2, xs = [];      // the wires are rimed: a soft slate line, not a black one
    for (let k = -8; k <= 7; k++) xs.push(k * PITCH / 2 + PITCH / 4 + (rng() - 0.5) * 1.5);
    const arms = [top - 0.7, top - 1.7];
    for (const x of xs) {
      G.hexa(PARTOP + 0.25, top, [x - 0.15, x + 0.15, zP - 0.15, zP + 0.15], [x - 0.09, x + 0.09, zP - 0.09, zP + 0.09], mt, M_METAL, 'fkrlt');
      for (const y of arms) {
        G.box(x - 0.07, x + 0.07, y, y + 0.13, zP - 1.0, zP + 1.0, mt, M_METAL, 'fkrltb');
        for (const dz of [-0.85, 0.85]) G.hexa(y + 0.13, y + 0.3, [x - 0.06, x + 0.06, zP + dz - 0.06, zP + dz + 0.06], [x - 0.03, x + 0.03, zP + dz - 0.03, zP + dz + 0.03], [0.5, 0.6, 0.7], M_ICE, 'fkrlt');
      }
    }
    for (let i = 0; i < xs.length - 1; i++) for (const y of arms) for (const dz of [-0.85, 0.85]) {
      const z = zP + dz, sag = 0.45 + 0.25 * rng(), NS = 6, w = 0.035;
      for (let q = 0; q < NS; q++) {
        const t0 = q / NS, t1 = (q + 1) / NS, x0 = lerp(xs[i], xs[i + 1], t0), x1 = lerp(xs[i], xs[i + 1], t1);
        const y0 = y + 0.3 - sag * 4 * t0 * (1 - t0), y1 = y + 0.3 - sag * 4 * t1 * (1 - t1);
        // a wire's lower edge carries material 3.75 and its upper edge 4.25 (both shade as metal): the vertex shader spreads them apart with distance,
        // so the ribbon never gets thinner than about a pixel and a far wire is a line, not a row of dashes
        for (let side = 0; side < 2; side++) {
          if (side) G.quad([x1, y1 - w, z], [x0, y0 - w, z], [x0, y0 + w, z], [x1, y1 + w, z], WIREC, M_METAL); else G.quad([x0, y0 - w, z], [x1, y1 - w, z], [x1, y1 + w, z], [x0, y0 + w, z], WIREC, M_METAL);
          const n = G.m.length; G.m[n - 4] = G.m[n - 3] = M_METAL - 0.25; G.m[n - 2] = G.m[n - 1] = M_METAL + 0.25;
        }
      }
    }
  }
  const ice = (x, y, z, len, r) => {
    const a0 = rng() * 6.28, tip = [x + (rng() - 0.5) * r, y - len, z + (rng() - 0.5) * r], c = mul(WHITE, 0.8 + 0.2 * rng());
    for (let k = 0; k < 3; k++) {
      const a = a0 + k * 2.094, b = a + 2.094;
      G.tri([x + Math.cos(a) * r, y, z + Math.sin(a) * r], tip, [x + Math.cos(b) * r, y, z + Math.sin(b) * r], c, M_ICE);
    }
  };
  const len = () => 0.35 + 2.3 * Math.pow(rng(), 2.6);
  if (yld) await yld();
  {
    let hs = 48271; const r8 = () => { hs = (hs * 16807) % 2147483647; return hs / 2147483647; };
    const ice8 = (x, y, z, l, r) => { const a0 = r8() * 6.28, tip = [x + (r8() - 0.5) * r, y - l, z + (r8() - 0.5) * r], c = mul(WHITE, 0.8 + 0.2 * r8()); for (let k = 0; k < 3; k++) { const a = a0 + k * 2.094, b = a + 2.094; G.tri([x + Math.cos(a) * r, y, z + Math.sin(a) * r], tip, [x + Math.cos(b) * r, y, z + Math.sin(b) * r], c, M_ICE); } };
    for (const [px, y, hw, hd] of S.ledges) for (const zs of [-1, 1]) {
      ridge(px - hw - 0.15, px + hw + 0.15, y - 0.04, zs * (hd + 0.45), 0.95, 0.62, 0.9);
      for (let k = 0; k < 7; k++) { const l = 0.5 + 2.2 * Math.pow(r8(), 2); ice8(px + (r8() * 2 - 1) * hw, y - 0.53, zs * (hd + 1.15), l, 0.08 + l * 0.05); }
    }
    for (let a = 0; a < NARCH; a++) for (const zs of [-1, 1]) {
      const xc = (a - (NARCH - 1) / 2) * PITCH;
      for (let k = 0; k < 7; k++) { const t = (r8() * 2 - 1) * 3.2, y = S.spring + S.rise * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t) / HALF, S.archExp)), 1 / S.archExp), l = 1.1 + 2.6 * r8(); if (Math.abs(t) < 0.6) continue; ice8(xc + t, y + 0.03, zs * (HZ + 0.2), l, 0.09 + l * 0.045); }
    }
  }
  if (yld) await yld();
  for (const zs of [-1, 1]) {
    for (let k = 0; k < S.icicles; k++) { const x = (rng() * 2 - 1) * XT + noise.n2(k * 0.3, 1) * 3, l = len(); ice(x, WALLTOP + 0.02, zs * (HZ + 0.44), l, 0.07 + l * 0.06); }
    for (let j = 0; j <= NARCH; j++) { const px = (j - NARCH / 2) * PITCH; for (let k = 0; k < 9; k++) { const l = len() * 1.2; ice(px + (rng() * 2 - 1) * 3.9, S.spring - 0.88, zs * (HZ + 0.82), l, 0.08 + l * 0.06); } }
    for (let a = 0; a < NARCH; a++) {
      const xc = (a - (NARCH - 1) / 2) * PITCH;
      for (let k = 0; k < 16; k++) {
        const t = (rng() * 2 - 1) * 8.5, y = S.spring + S.rise * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(t) / HALF, S.archExp)), 1 / S.archExp), l = len() * 1.3;
        ice(xc + t, y + 0.03, zs * (HZ + 0.18), l, 0.08 + l * 0.06);
      }
    }
    if (yld) await yld();
  }
}

// ---------------------------------------------------------------- the train (local: +X forward, rail top y = 0)
const CRANK = 0.4, RDRIVE = 0.95, LOCO_K = 1.16;   // the locomotive is built at 1:1 then enlarged by LOCO_K
async function buildTrain(S, rng, yld) {
  const G = new Geo(true), SD = new Geo(true);            // SD = +Z side parts, mirrored to -Z afterwards
  const blk = [0.042, 0.046, 0.06], blk2 = [0.06, 0.063, 0.075], steel = [0.3, 0.31, 0.34];
  const crim = mul(S.crimson, 2.3), crimD = mul(S.crimson, 1.6), gold = mul(S.amberC, 0.75), cream = mix3(S.snowC, S.amberC, 0.35).map((v) => v * 0.62);
  const glows = [];
  const flush = async () => { appendGeo(G, SD); if (yld) await yld(); appendGeo(G, SD, 2); SD.p.length = SD.n.length = SD.uv.length = SD.c.length = SD.m.length = SD.sp.length = SD.i.length = 0; SD.nv = 0; };
  const off = (x) => { G.ox = x; SD.ox = x; };
  const still = () => { G.setSpin(); SD.setSpin(); };
  // spoked wheel on the +Z side, outer face at z = zo
  const wheel = (cx, r, zo, spokes, col, seg) => {
    SD.setSpin(cx, r, r, 1);
    const o = [cx, r, 0];
    SD.lathe(o, 'z', [[r + 0.06, zo - 0.2], [r + 0.06, zo - 0.13], [r, zo - 0.12], [r, zo], [r - 0.07, zo + 0.02], [r - 0.14, zo]], seg, steel, T_BRASS);
    SD.lathe(o, 'z', [[r - 0.12, zo - 0.07], [0, zo - 0.07]], seg, mul(col, 0.35), T_PAINT);
    SD.lathe(o, 'z', [[0.2, zo - 0.06], [0.2, zo + 0.05], [0.1, zo + 0.08], [0, zo + 0.08]], 8, col, T_PAINT);
    for (let k = 0; k < spokes; k++) {
      const a = (k / spokes) * 6.2832, c = Math.cos(a), s = Math.sin(a), w = 0.045, z = zo - 0.02;
      SD.quad([cx + c * 0.15 + s * w, r + s * 0.15 - c * w, z], [cx + c * (r - 0.1) + s * w, r + s * (r - 0.1) - c * w, z],
        [cx + c * (r - 0.1) - s * w, r + s * (r - 0.1) + c * w, z], [cx + c * 0.15 - s * w, r + s * 0.15 + c * w, z], col, T_PAINT);
    }
    SD.setSpin();
  };
  // side window quad (+Z side): uv carries a per-window seed in the integer part
  const windowQ = (x0, x1, y0, y1, z, k, seed) => {
    const u = Math.floor(seed * 50) * 2;
    SD.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], mul(S.amberC, k), T_WINDOW, [[u, 0], [u + 1, 0], [u + 1, 1], [u, 1]]);
  };
  const arcRoof = (x0, x1, cy, r, half, col, seg = 8) => G.lathe([0, cy, 0], 'x', [[0, x0], [r, x0], [r, x1], [0, x1]], seg, col, T_ROOF, -half, half);

  // ================= locomotive (x 0 .. -13.5)
  off(0); still();
  const BY = 2.55, RB = 1.02;
  G.lathe([0, BY, 0], 'x', [[0, -10.7], [RB, -10.7], [RB, -3.0], [RB + 0.07, -3.0], [RB + 0.07, -1.25], [0.96, -1.19], [0.62, -1.02], [0, -0.95]], 20, blk, T_PAINT);
  for (const x of [-9.2, -7.6, -6.0, -4.4, -3.05]) G.lathe([0, BY, 0], 'x', [[RB + 0.025, x - 0.05], [RB + 0.035, x], [RB + 0.025, x + 0.05]], 20, gold, T_BRASS);
  G.lathe([0, BY, 0], 'x', [[0.84, -1.13], [0.87, -1.1], [0.84, -1.07]], 20, gold, T_BRASS);
  G.lathe([0, BY, 0], 'x', [[0, -0.97], [0.13, -0.97], [0.1, -0.86], [0, -0.84]], 8, gold, T_BRASS);
  G.box(-12.7, -0.45, 1.16, 1.3, -1.4, 1.4, blk2, T_PAINT, 'fkrltb');                     // running board
  G.box(-10.7, -8.5, 1.3, 2.5, -1.05, 1.05, blk, T_PAINT, 'fkrl');                         // firebox
  G.box(-10.5, -8.7, 0.45, 1.16, -0.72, 0.72, [1, 0.42, 0.1], T_FIRE, 'fkrlb');             // glowing ashpan
  G.box(-8.5, -1.6, 0.55, 1.16, -0.6, 0.6, blk, T_PAINT, 'fkb');                           // frames
  G.box(-0.5, -0.2, 0.8, 1.42, -1.38, 1.38, crim, T_PAINT, 'fkrltb');                      // buffer beam
  // snowplough wedge
  { const tb = [1.45, 0.12, 0], tt = [0.95, 1.05, 0];
    for (const zs of [1, -1]) {
      const bb = [-0.2, 0.12, 1.5 * zs], bt = [-0.2, 1.05, 1.42 * zs];
      if (zs > 0) G.quad(tb, tt, bt, bb, crim, T_ROOF); else G.quad(tb, bb, bt, tt, crim, T_ROOF);
    }
    G.tri(tt, [-0.2, 1.05, -1.42], [-0.2, 1.05, 1.42], crimD, T_ROOF); }
  if (yld) await yld();
  // chimney, domes, safety valves, whistle, headlamp
  const chX = -2.05;
  G.lathe([chX, 0, 0], 'y', [[0.5, 3.42], [0.34, 3.62], [0.3, 4.05]], 12, blk, T_PAINT);
  G.lathe([chX, 0, 0], 'y', [[0.3, 4.05], [0.4, 4.24], [0.43, 4.34], [0.33, 4.36], [0.3, 4.2]], 12, gold, T_BRASS);
  const dome = (x, r, h, col, mat) => G.lathe([x, 0, 0], 'y', [[r * 1.15, BY + RB - 0.1], [r, BY + RB + 0.05], [r, BY + RB + h * 0.5], [r * 0.86, BY + RB + h * 0.78], [r * 0.5, BY + RB + h * 0.96], [0, BY + RB + h]], 12, col, mat);
  const d1 = S.domeFirst ? -4.0 : -6.4, d2 = S.domeFirst ? -6.4 : -4.0;
  dome(d1, 0.5, 0.72, gold, T_BRASS); dome(d2, 0.4, 0.5, blk, T_PAINT);
  for (const z of [-0.2, 0.2]) G.lathe([-8.9, 0, z], 'y', [[0.09, 3.5], [0.09, 3.95], [0.12, 4.0], [0, 4.02]], 6, gold, T_BRASS);
  G.lathe([-10.0, 0, 0.45], 'y', [[0.05, 3.5], [0.05, 3.85], [0.1, 3.9], [0.1, 4.05], [0, 4.08]], 6, gold, T_BRASS);
  G.lathe([0, 3.98, 0], 'x', [[0, -1.5], [0.2, -1.5], [0.27, -1.0], [0.3, -0.92]], 12, blk, T_PAINT);
  G.lathe([0, 3.98, 0], 'x', [[0.28, -0.93], [0, -0.9]], 12, [1, 0.86, 0.6], T_LAMP);
  G.box(-1.4, -1.0, 3.6, 3.75, -0.15, 0.15, blk, T_PAINT, 'fkrl');
  if (S.deflectors) for (const z of [1.3, -1.3]) { // small smoke deflectors with a raked top
    G.quad([-3.05, 1.3, z], [-1.35, 1.3, z], [-1.55, 2.7, z], [-3.05, 3.25, z], blk2, T_PAINT);
    G.quad([-3.05, 3.19, z * 1.02], [-1.55, 2.64, z * 1.02], [-1.55, 2.7, z * 1.02], [-3.05, 3.25, z * 1.02], gold, T_BRASS);
  }
  if (yld) await yld();
  // cab
  G.box(-12.9, -10.7, 1.3, 3.32, -1.42, 1.42, crim, T_PAINT, 'fkrl');
  G.box(-12.95, -10.65, 1.3, 1.42, -1.45, 1.45, gold, T_BRASS, 'fkrl');
  arcRoof(-13.25, -10.5, 1.83, 2.02, 0.8, blk2);
  G.quad([-12.92, 1.5, -1.0], [-12.92, 1.5, 1.0], [-12.92, 3.1, 1.0], [-12.92, 3.1, -1.0], [1, 0.45, 0.12], T_FIRE);   // open cab back, firelit
  for (const z of [-0.95, 0.95]) G.quad([-10.68, 2.75, z + 0.3], [-10.68, 2.75, z - 0.3], [-10.68, 3.2, z - 0.3], [-10.68, 3.2, z + 0.3], mul(S.amberC, 1.2), T_WINDOW, [[4, 0], [5, 0], [5, 1], [4, 1]]);
  windowQ(-12.35, -11.2, 2.35, 3.15, 1.435, 1.5, 0.13);
  SD.box(-12.5, -11.05, 2.24, 2.3, 1.42, 1.47, gold, T_BRASS, 'ftb'); SD.box(-12.5, -11.05, 3.2, 3.26, 1.42, 1.47, gold, T_BRASS, 'ftb');
  SD.box(-12.6, -0.5, 0.98, 1.16, 1.36, 1.41, crim, T_PAINT, 'fb');                        // valance
  SD.box(-9.4, -1.5, 2.98, 3.03, 1.0, 1.05, gold, T_BRASS, 'ft');                          // handrail
  // cylinders, rods, wheels
  SD.lathe([0, 0.98, 1.1], 'x', [[0, -3.5], [0.4, -3.5], [0.44, -3.42], [0.44, -2.0], [0.4, -1.92], [0, -1.92]], 12, blk, T_PAINT);
  SD.lathe([0, 0.98, 1.1], 'x', [[0.2, -1.92], [0.2, -1.84], [0, -1.82]], 8, gold, T_BRASS);
  SD.box(-5.2, -3.5, 1.28, 1.36, 1.02, 1.18, steel, T_BRASS, 'ftb');                      // slide bar
  const drv = S.drivers === 4 ? [-4.9, -6.55, -8.2, -9.85] : [-5.4, -7.45, -9.5];
  if (yld) await yld();
  for (const x of drv) wheel(x, RDRIVE, 0.9, 14, crim, 22);
  if (yld) await yld();
  for (const x of [-1.55, -2.85]) wheel(x, 0.46, 0.88, 8, crim, 14);
  wheel(-11.6, 0.6, 0.88, 10, crim, 14);
  SD.setSpin(0, 0, 1, 2);                                                                  // coupling rod
  SD.box(drv[drv.length - 1] - 0.2, drv[0] + 0.2, RDRIVE - 0.08, RDRIVE + 0.08, 0.95, 1.01, steel, T_BRASS, 'ftbrl');
  for (const x of drv) SD.box(x - 0.13, x + 0.13, RDRIVE - 0.13, RDRIVE + 0.13, 1.01, 1.06, gold, T_BRASS, 'ftbrl');
  { // main rod: crank end follows the pin, crosshead end only slides
    const xa = drv[1], xb = -4.2, z0 = 1.07, z1 = 1.12, y = RDRIVE;
    const P = (x, yy, z, w) => { SD.setSpin(0, 0, w, 4); return SD.vert(x, yy, z, 0, 0, 1, x, yy, steel, T_BRASS); };
    const a = P(xa, y - 0.07, z1, 1), b = P(xb, y - 0.06, z1, 0), c = P(xb, y + 0.06, z1, 0), d = P(xa, y + 0.07, z1, 1);
    SD.i.push(a, b, c, a, c, d);
    SD.setSpin(0, 0, 0, 4); SD.box(xb - 0.25, xb + 0.2, y - 0.16, y + 0.16, z0, z1 + 0.03, steel, T_BRASS, 'ftbrl');   // crosshead
    SD.box(xb, -3.5, y - 0.035, y + 0.035, 1.07, 1.12, steel, T_BRASS, 'ftb');                                       // piston rod
  }
  if (yld) await yld();
  still(); await flush();
  if (yld) await yld();
  for (let k = 0; k < G.nv; k++) { // enlarge the locomotive about its front buffer
    G.p[k * 3] *= LOCO_K; G.p[k * 3 + 1] *= LOCO_K; G.p[k * 3 + 2] *= LOCO_K; G.sp[k * 4] *= LOCO_K; G.sp[k * 4 + 1] *= LOCO_K;
    if (G.sp[k * 4 + 3] > 0.5 && G.sp[k * 4 + 3] < 1.5) G.sp[k * 4 + 2] *= LOCO_K;
  }
  if (yld) await yld();

  // ================= the rare rotary snowplough, coupled ahead of the locomotive (x 0.55 .. 9.4; built 1:1, the tunnels take it)
  let ploughLamp = null, ploughAt = null;
  if (S.plough) {
    off(0.55); still();
    const PY = 2.0, PR = 1.72, xd = 6.9, xf = 8.3;                // drum centre height and radius, back of the drum, its front lip
    G.box(0.1, xd, 0.7, 1.1, -1.25, 1.25, blk, T_PAINT, 'fkrlb');                             // underframe
    G.box(0, xd, 1.1, 3.55, -1.5, 1.5, crim, T_PAINT, 'fkrl');                                // body
    G.box(-0.05, xd + 0.05, 1.1, 1.3, -1.54, 1.54, gold, T_BRASS, 'fkrl');                    // waist rail
    arcRoof(-0.2, xd + 0.1, 2.0, 2.1, 0.8, blk2);
    G.box(0.5, 2.9, 3.6, 4.5, -0.95, 0.95, crim, T_PAINT, 'fkrl');                            // lookout cupola
    arcRoof(0.35, 3.05, 3.55, 1.5, 0.72, blk2, 6);
    G.quad([2.91, 3.95, 0.75], [2.91, 3.95, -0.75], [2.91, 4.4, -0.75], [2.91, 4.4, 0.75], mul(S.amberC, 1.3), T_WINDOW, [[20, 0], [21, 0], [21, 1], [20, 1]]);
    G.lathe([4.6, 0, 0], 'y', [[0.26, 3.9], [0.2, 4.5], [0.27, 4.62], [0.2, 4.64]], 10, blk, T_PAINT);     // its own little chimney
    // drum casing with a flared brass-bound lip, and the dark back plate behind the wheel
    G.lathe([0, PY, 0], 'x', [[0, xd - 0.1], [PR, xd - 0.1], [PR, xf - 0.5], [PR + 0.16, xf], [PR + 0.06, xf + 0.03], [PR - 0.1, xf - 0.45]], 22, blk2, T_PAINT);
    G.lathe([0, PY, 0], 'x', [[PR + 0.17, xf - 0.03], [PR + 0.2, xf + 0.02], [PR + 0.1, xf + 0.06]], 22, gold, T_BRASS);
    G.lathe([0, PY, 0], 'x', [[PR - 0.1, xf - 0.5], [0, xf - 0.5]], 22, mul(blk, 0.45), T_PAINT);
    // the cutting wheel: ten pitched blades and a hub, spinning about the track axis
    G.setSpin(0, PY, 0, 10);
    for (let k = 0; k < 10; k++) {
      const a = k / 10 * 6.2832, c = Math.cos(a), sn = Math.sin(a), r0 = 0.34, r1 = PR - 0.2, w0 = 0.16, w1 = 0.5, col = k % 2 ? crim : steel;
      const P = (r, w, dx) => [xf - 0.2 + dx, PY + c * r - sn * w, sn * r + c * w];
      G.quad(P(r0, -w0, -0.22), P(r1, -w1, -0.22), P(r1, w1, 0.04), P(r0, w0, 0.04), col, T_BRASS);
    }
    G.lathe([0, PY, 0], 'x', [[0.46, xf - 0.46], [0.36, xf - 0.1], [0.14, xf + 0.06], [0, xf + 0.08]], 12, gold, T_BRASS);
    still();
    // the chute: a hood on top of the drum that throws the snow out over the +Z parapet
    { const xa = xd + 0.25, xb2 = xf - 0.35, prof = [[3.55, -0.62], [4.3, -0.6], [4.82, -0.2], [5.0, 0.5]];
      for (let j = 0; j < prof.length - 1; j++) {
        const [y0, z0] = prof[j], [y1, z1] = prof[j + 1];
        G.quad([xa, y0, z0], [xb2, y0, z0], [xb2, y1, z1], [xa, y1, z1], crim, T_ROOF);
        for (const x of [xa, xb2]) G.tri([x, y0, z0], [x, y1, z1], [x, 3.55, 0.62], crimD, T_ROOF);
      }
      G.box(xb2 - 0.5, xb2 - 0.2, 5.0, 5.28, -0.16, 0.16, blk, T_PAINT, 'fkrlt');                // lamp bracket
      G.lathe([0, 5.42, 0], 'x', [[0, xb2 - 0.75], [0.2, xb2 - 0.75], [0.27, xb2 - 0.2], [0.3, xb2 - 0.12]], 12, blk, T_PAINT);
      G.lathe([0, 5.42, 0], 'x', [[0.28, xb2 - 0.13], [0, xb2 - 0.1]], 12, [1, 0.86, 0.6], T_LAMP);
      ploughLamp = [0.55 + xb2 - 0.05, 5.42, 0]; ploughAt = [0.55 + xf - 0.3, 5.0, 0.3]; }
    // side windows, flanger wings, wheels (mirrored to the far side)
    windowQ(0.5, 1.5, 2.2, 3.05, 1.512, 1.3, 0.31); windowQ(1.9, 2.9, 2.2, 3.05, 1.512, 1.2, 0.57); windowQ(0.8, 2.6, 3.9, 4.35, 0.962, 1.1, 0.77);
    SD.box(3.4, xd - 0.3, 1.5, 3.3, 1.5, 1.515, crimD, T_PAINT, 'f');
    for (const y of [1.48, 3.3]) SD.box(3.4, xd - 0.3, y, y + 0.05, 1.515, 1.53, gold, T_BRASS, 'f');
    SD.quad([xf - 0.7, 0.22, PR - 0.12], [xf + 0.35, 0.22, PR + 0.5], [xf + 0.35, 2.5, PR + 0.5], [xf - 0.7, 2.5, PR - 0.12], crim, T_ROOF);
    SD.quad([xf - 0.7, 2.5, PR - 0.12], [xf + 0.35, 2.5, PR + 0.5], [xf + 0.35, 2.58, PR + 0.5], [xf - 0.7, 2.58, PR - 0.12], gold, T_BRASS);
    for (const x of [1.2, 2.4, 4.7, 5.9]) wheel(x, 0.5, 0.92, 8, crim, 14);
    SD.box(0.6, 6.5, 0.4, 0.72, 1.0, 1.12, blk2, T_PAINT, 'ftb');
    await flush();
    glows.push([ploughLamp[0] + 0.1, ploughLamp[1], 0, [1, 0.85, 0.6], 5.2]);
    if (yld) await yld();
  }

  // ================= tender
  const tx0 = -13.5 * LOCO_K - 0.4;
  off(tx0);
  G.box(-6.45, -0.05, 0.72, 1.16, -1.3, 1.3, blk, T_PAINT, 'fkrlb');
  G.box(-6.5, 0, 1.16, 3.0, -1.4, 1.4, crim, T_PAINT, 'fkrl');
  G.box(-6.55, 0.05, 2.94, 3.08, -1.45, 1.45, blk2, T_PAINT, 'fkrlt');
  for (const [x0, x1, y0, y1] of [[-6.1, -0.4, 1.45, 1.5], [-6.1, -0.4, 2.6, 2.65], [-6.1, -6.05, 1.45, 2.65], [-0.45, -0.4, 1.45, 2.65]]) SD.box(x0, x1, y0, y1, 1.4, 1.415, gold, T_BRASS, 'f');
  { const NXc = 7, NZc = 4, id = []; // coal heap
    for (let i = 0; i <= NXc; i++) for (let j = 0; j <= NZc; j++) {
      const e = Math.min(i, NXc - i, j, NZc - j) > 0 ? 1 : 0, x = -6.2 + 5.9 * i / NXc, z = -1.25 + 2.5 * j / NZc;
      id.push(G.vert(x, 3.05 + e * (0.25 + 0.5 * rng()), z, (rng() - 0.5) * 0.9, 0.8, (rng() - 0.5) * 0.9, x, z, mul(blk, 0.6 + rng()), T_COAL));
    }
    for (let i = 0; i < NXc; i++) for (let j = 0; j < NZc; j++) { const a = id[i * (NZc + 1) + j], b = id[i * (NZc + 1) + j + 1], c = id[(i + 1) * (NZc + 1) + j + 1], d = id[(i + 1) * (NZc + 1) + j]; G.i.push(a, b, c, a, c, d); } }
  for (const x of [-1.2, -3.25, -5.3]) wheel(x, 0.52, 0.9, 8, crim, 14);
  SD.box(-6.2, -0.3, 0.5, 0.72, 0.98, 1.1, blk2, T_PAINT, 'ftb');
  await flush();
  if (yld) await yld();
  const tenderEnd = tx0 - 6.5;

  // ================= carriages
  const CL = 13.6, CGAP = 0.8, car0 = tenderEnd - CGAP;
  for (let ci = 0; ci < S.carriages; ci++) {
    const x0 = car0 - ci * (CL + CGAP); off(x0);
    const band = S.creamBand ? cream : mul(crim, 0.85), Z = 1.42;
    G.box(-CL + 0.1, -0.1, 0.8, 1.16, -1.3, 1.3, blk, T_PAINT, 'fkrlb');
    G.box(-CL, 0, 1.16, 3.46, -Z, Z, crimD, T_PAINT, 'rl');
    G.box(0, CGAP, 1.25, 3.2, -0.6, 0.6, blk, T_PAINT, 'fkt');                              // gangway bellows
    SD.box(-CL, 0, 1.16, 2.02, Z - 0.01, Z, crim, T_PAINT, 'f');
    SD.box(-CL, 0, 2.02, 3.02, Z - 0.01, Z, band, T_PAINT, 'f');
    SD.box(-CL, 0, 3.02, 3.46, Z - 0.01, Z, crim, T_PAINT, 'f');
    for (const y of [1.98, 3.02]) SD.box(-CL, 0, y, y + 0.05, Z, Z + 0.012, gold, T_BRASS, 'f');
    SD.box(-CL + 0.2, -0.2, 1.2, 1.25, Z, Z + 0.012, gold, T_BRASS, 'f');
    const nw = 9, wx0 = -1.75, pitch = (CL - 3.5) / nw;
    for (let w = 0; w < nw; w++) {
      const xa = wx0 - w * pitch, lit = rng() < 0.9 ? 0.75 + 0.6 * rng() : 0.06;
      windowQ(xa - pitch + 0.28, xa, 2.12, 2.94, Z + 0.006, lit, rng());
    }
    for (const xd of [-0.95, -CL + 0.95]) { // doors
      SD.box(xd - 0.42, xd + 0.42, 1.2, 3.1, Z, Z + 0.015, mul(crim, 0.7), T_PAINT, 'f');
      windowQ(xd - 0.26, xd + 0.26, 2.2, 2.9, Z + 0.02, 0.5 + 0.4 * rng(), rng());
      SD.box(xd + 0.28, xd + 0.33, 1.9, 2.1, Z + 0.015, Z + 0.05, gold, T_BRASS, 'f');
    }
    arcRoof(-CL - 0.12, 0.12, 2.0, 2.05, 0.775, blk2);
    G.box(-CL + 1.1, -1.1, 3.9, 4.22, -0.55, 0.55, blk2, T_ROOF, 'fkrl');                    // clerestory
    arcRoof(-CL + 0.9, -0.9, 2.82, 1.5, 0.42, blk2, 4);
    for (let w = 0; w < 11; w++) { const xa = -1.5 - w * ((CL - 3) / 11); SD.quad([xa - 0.7, 3.98, 0.556], [xa, 3.98, 0.556], [xa, 4.16, 0.556], [xa - 0.7, 4.16, 0.556], mul(S.amberC, 0.5), T_WINDOW, [[8, 0.4], [9, 0.4], [9, 0.6], [8, 0.6]]); }
    for (const bx of [-2.5, -CL + 2.5]) {
      SD.box(bx - 1.55, bx + 1.55, 0.36, 0.7, 0.98, 1.12, blk2, T_PAINT, 'ftbrl');
      wheel(bx - 0.95, 0.46, 0.9, 0, blk2, 12); wheel(bx + 0.95, 0.46, 0.9, 0, blk2, 12);
    }
    SD.box(-CL / 2 - 1.7, -CL / 2 + 1.7, 0.3, 0.8, 0.7, 1.15, blk, T_PAINT, 'frlb');           // battery box
    if (ci === S.carriages - 1) {
      for (const z of [-0.95, 0.95]) { G.box(-CL - 0.12, -CL, 1.45, 1.75, z - 0.15, z + 0.15, [1, 0.08, 0.05], T_LAMP, 'fklbt'); glows.push([x0 - CL - 0.2, 1.6, z, [1, 0.1, 0.06], 2.2]); }
      G.quad([-CL - 0.01, 2.1, 0.5], [-CL - 0.01, 2.1, -0.5], [-CL - 0.01, 2.9, -0.5], [-CL - 0.01, 2.9, 0.5], mul(S.amberC, 0.9), T_WINDOW, [[12, 0], [13, 0], [13, 1], [12, 1]]);
    }
    await flush();
    if (yld) await yld();
  }
  off(0);
  const length = -(car0 - S.carriages * (CL + CGAP)) - CGAP;
  const K = LOCO_K, kk = (a) => a.map((v) => v * K);
  glows.push([-0.75 * K, 3.98 * K, 0, [1, 0.85, 0.6], 4.6], [-9.6 * K, 0.7 * K, 0, [1, 0.4, 0.1], 8.5], [-12.2 * K, 2.4 * K, 0, [1, 0.5, 0.16], 5]);
  const geo = await G.buildAsync(yld);
  if (yld) await yld();
  return { geo, tris: G.i.length / 3, length, glows, plough: ploughAt, lead: S.plough ? 9.5 : 0, chimney: kk([chX, 4.4, 0]), headlamp: ploughLamp || kk([-0.85, 3.98, 0]), firebox: kk([-9.6, 0.9, 0]), whistle: kk([-10.0, 4.1, 0.45]), cyl: kk([-2.0, 0.9, 1.5]), carEnd: car0 };
}

// ---------------------------------------------------------------- shaders
const f1 = (v) => Number(v).toFixed(4);
const GLSL_COMMON = /* glsl */`
uniform float uTime, uHeadX, uTrainLen, uTrainS, uCarStart, uFireOff, uLampK, uTrainK;
uniform vec3 uSky, uGround, uRim, uRimDir, uWarm, uFire, uLampOff; uniform vec2 uPier;
const float PITCH = ${f1(PITCH)}, LAMPY = ${f1(LAMPY)}, LAMPZ = ${f1(LAMPZ)}, RAILY = ${f1(RAILY)}, XCLIP = ${f1(XT - 0.5)}, KEYY = ${f1(KEYY)}, KEYZ = ${f1(KEYZ)};
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash21(i), hash21(i+vec2(1,0)), f.x), mix(hash21(i+vec2(0,1)), hash21(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = .5, s = 0.; for (int i = 0; i < 4; i++){ s += a*vnoise(p); p = p*2.03 + vec2(17.1, 9.2); a *= .5; } return s; }
float wrapNL(vec3 n, vec3 L, float d2, float wrap){ return max((dot(n, L*inversesqrt(d2 + 1e-4)) + wrap) / (1. + wrap), 0.); }
// warm light of the parapet lanterns (one over every pier, both sides)
vec3 lampLight(vec3 p, vec3 n, float wrap){
  float px = clamp((floor(p.x/PITCH) + .5)*PITCH, -3.5*PITCH, 3.5*PITCH);
  vec3 L = vec3(px, LAMPY, (p.z >= 0. ? 1. : -1.)*LAMPZ) - p; float d2 = dot(L, L);
  float fl = .9 + .1*sin(uTime*9. + px*1.7)*sin(uTime*5.3 + px), sz = p.z >= 0. ? 1. : -1.;
  float acc = fl * wrapNL(n, L, d2, wrap) / (1. + d2*.06);
  float under = 1. - smoothstep(59.5, 62.5, p.y);                       // the lanterns under the keystones and on the piers light nothing above the deck
  float kx = clamp(floor(p.x/PITCH + .5)*PITCH, -3.*PITCH, 3.*PITCH);
  vec3 L2 = vec3(kx, KEYY, sz*KEYZ) - p; float e2 = dot(L2, L2);
  acc += under * .78 * (.92 + .08*sin(uTime*7.3 + kx)) * wrapNL(n, L2, e2, wrap) / (1. + e2*.07);
  vec3 L3 = vec3(px, uPier.x, sz*uPier.y) - p; float e3 = dot(L3, L3);
  acc += under * .8 * wrapNL(n, L3, e3, wrap) / (1. + e3*.08);
  return uWarm * (uLampK * acc);
}
// warm light of the moving train: a line of lit windows plus the firebox
vec3 trainLight(vec3 p, vec3 n, float wrap){
  vec3 acc = vec3(0.);
  float x1 = min(uHeadX - uCarStart, XCLIP), x0 = max(uHeadX - uTrainLen, -XCLIP);
  if (x1 > x0){
    vec3 L = vec3(clamp(p.x, x0, x1), RAILY + 2.5*uTrainS, clamp(p.z, -1.9, 1.9)) - p; float d2 = dot(L, L);
    float rh = .8 + .2*sin((p.x - uHeadX)*3.6);
    acc += uWarm * (.95 * rh * wrapNL(n, L, d2, wrap) / (1. + d2*.08));
  }
  float fx = uHeadX - uFireOff;
  if (abs(fx) < XCLIP){
    vec3 L = vec3(fx, RAILY + 1.0, 0.) - p; float d2 = dot(L, L);
    float fl = .8 + .2*sin(uTime*13.)*sin(uTime*7.1 + 1.);
    acc += uFire * (2.4 * fl * wrapNL(n, L, d2, wrap) / (1. + d2*.03));
  }
  return acc * uTrainK;
}
// headlamp cone along +X
float headCone(vec3 p){
  vec3 d = p - vec3(uHeadX - uLampOff.x, RAILY + uLampOff.y, 0.);
  if (d.x < 0. || abs(uHeadX) > XCLIP + 2.) return 0.;
  float cr = .5 + d.x*.07;
  return (1. - smoothstep(cr*.1, cr, length(d.yz))) * exp(-d.x*.04) * uTrainK;
}
vec3 ambient(vec3 n){ return mix(uGround, uSky, n.y*.5 + .5) + uRim * max(dot(n, uRimDir), 0.); }
// the low key light skimming a surface seen against it: soffits, pier arrises and snow caps catch a warm edge
vec3 skim(vec3 n, vec3 v){ float g = 1. - abs(dot(n, v)); return uRim * (g*g*g * smoothstep(.15, .9, dot(v, uRimDir)) * .55); }
`;

const STATIC_VS = /* glsl */`
attribute float aMat; uniform float uWirePx;
varying vec3 vPos, vNor, vCol, vWV; varying vec2 vUv; varying float vMat;
#include <fog_pars_vertex>
void main(){
  vPos = position; vNor = normal; vCol = color; vUv = uv; vMat = aMat;
  vec4 wp = modelMatrix * vec4(position, 1.); vWV = wp.xyz - cameraPosition;
  float wk = aMat - 4.;                                    // telegraph wires: +-.25 marks the ribbon's two edges
  if (abs(abs(wk) - .25) < .05) wp.y += sign(wk) * max(0., length(vWV) * uWirePx - .035);
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const STATIC_FS = /* glsl */`
varying vec3 vPos, vNor, vCol, vWV; varying vec2 vUv; varying float vMat;
uniform vec3 uSnowCol, uRockCol;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 n = normalize(vNor); float m = floor(vMat + .5);
  vec3 alb = vCol; vec3 emis = vec3(0.), bulk = vec3(0.); float sheen = 0.; float snow = 0.; float wrap = .35;
  float big = fbm(vPos.xy*.06 + vPos.z*.11), fwY = fwidth(vPos.y);
  if (m < .5 || abs(m - 6.) < .5 || m > 8.5){            // ashlar masonry / voussoirs / the soffits (the same ashlar, lining the barrels)
    float bh = .85, bw = 1.9, hs = 0.; vec2 q; float edge;
    if (m > 5. && m < 7.){ q = vec2(vUv.x/.95, 0.); float f = fract(q.x); edge = min(f, 1. - f)*.95; }
    else { float row = floor(vUv.y/bh); q = vec2((vUv.x + fract(row*.5)*bw + hash21(vec2(row, 3.))*.6)/bw, vUv.y/bh);
      vec2 f = fract(q); edge = min(min(f.x, 1. - f.x)*bw, min(f.y, 1. - f.y)*bh);
      float cut = .36 + .28*hash21(floor(q) + 37.);                // about one stone in three is two shorter ones: never a wall of evenly sized blocks
      if (hash21(floor(q) + 31.) > .66){ edge = min(edge, abs(f.x - cut)*bw); hs = step(cut, f.x)*.37 + .11; } }
    vec2 id = floor(q) + vec2(hs, 0.); float lod = clamp(1. - fwidth(vUv.y)*1.6, 0., 1.);
    float mort = (1. - smoothstep(.02, .08, edge)) * lod;
    float t = hash21(id + 11.), t2 = hash21(id + 5.);
    alb *= (.74 + .5*t) * mix(vec3(1.), vec3(1.08, .98, .9), t2*.6);          // block to block variation
    alb *= mix(.72, 1.12, vnoise(vec2(vPos.x*.9 + vPos.z*.7, vPos.y*.05)));   // drip streaks
    alb *= .8 + .4*fbm(vUv*1.7);
    alb *= 1. - .5*mort;
    // close to, every block is a pillowed stone: a lit upper arris, a shadowed lower joint, pits, damp stains
    float nearK = lod * (1. - smoothstep(26., 85., length(vWV)));
    if (m < .5 || m > 8.5){ float fb = fract(q.y); alb *= 1. + nearK * (.2*smoothstep(.8, .97, fb) - .3*(1. - smoothstep(.03, .2, fb))); }
    else alb *= 1. - .3*nearK*(1. - smoothstep(0., .3, vUv.y));
    alb *= 1. - nearK * .3 * smoothstep(.55, .85, vnoise(vUv*6.3 + id*3.7));
    alb = mix(alb, alb * vec3(.7, .8, .96), nearK * .55 * smoothstep(.42, .72, fbm(vUv*.33 + 7.)));
    // no wall of one tone: here and there a paler replaced stone or a dark old one, warmer and cooler blocks
    { float t3 = hash21(id + 23.); alb *= 1. + (.3 + .2*nearK)*step(.88, t3) - (.28 + .12*nearK)*step(t3, .12); alb *= mix(vec3(1.), t3 > .5 ? vec3(1.12, .97, .86) : vec3(.88, .97, 1.12), abs(t3 - .5) * (1. + nearK));
      alb *= 1. + nearK * (.44*(t - .5) + .2*(t2 - .5)); }                // close to, the stones differ more
    float strSnow = 0., iceK = 0.;
    if (m < .5 && abs(n.z) > .7){                          // the two faces of the viaduct
      float lodF = clamp(1. - fwY*3., 0., 1.);
      // a string course half way up the spandrels: long pale stones, a shadow under it, snow lying on it
      float ys = vPos.y - 51.4, band = step(0., ys) * step(ys, .62), jf = fract(vPos.x/3.1 + .3);
      float jb = 1. - smoothstep(.02, .07, min(jf, 1. - jf)*3.1);
      alb = mix(alb, vCol * (1.04 + .2*hash21(vec2(floor(vPos.x/3.1 + .3), 7.))) * (1. - .45*jb*lodF) * (.86 + .28*smoothstep(.1, .55, ys)), band);
      alb *= 1. - .4 * (1. - smoothstep(0., .5, -ys)) * step(ys, 0.) * lodF;
      strSnow = band * smoothstep(.47, .56, ys + .05*vnoise(vec2(vPos.x*1.3, 2.))) * .9;
      // damp running down from the course and from the ledge under the parapet, in streaks; soot in a long band under the ledge
      float dr = max((1. - smoothstep(0., 3.6, -ys)) * step(ys, 0.), 1. - smoothstep(0., 5., 61.4 - vPos.y));
      alb *= 1. - .36 * dr * smoothstep(.4, .78, vnoise(vec2(vPos.x*.8, vPos.y*.05 + 2.)));
      alb *= 1. - .22 * smoothstep(.5, .8, vnoise(vec2(vPos.x*.035 + 4., vPos.y*.3)));
      // close to: rime lying in long level bands across the courses, and soot hanging in a curtain over every crown
      float nearF = 1. - smoothstep(40., 120., length(vWV)), xc = mod(vPos.x + ${(PITCH / 2).toFixed(2)}, ${PITCH.toFixed(1)}) - ${(PITCH / 2).toFixed(2)};
      strSnow = max(strSnow, nearF * lodF * .46 * smoothstep(.56, .8, vnoise(vec2(vPos.x*.1 + 9., vPos.y*.6))*.72 + vnoise(vec2(vPos.x*.8, vPos.y*2.1))*.28));
      alb *= 1. - .42 * nearF * (1. - smoothstep(2., 10., abs(xc))) * smoothstep(57.2, 59.6, vPos.y) * (1. - smoothstep(60.2, 65.5, vPos.y)) * (.45 + .55*vnoise(vec2(vPos.x*1.2, vPos.y*.22)));
      // weep holes in the course below it, a tongue of ice hanging from most of them
      float wy = vPos.y - 47.3, wc = floor(vPos.x/6.8 + .15), wx = (fract(vPos.x/6.8 + .15) - .5)*6.8, wh = hash21(vec2(wc, 41.));
      if (wh > .3){
        alb = mix(alb, vec3(.012), (1. - smoothstep(.08, .12, max(abs(wx), abs(wy)))) * lodF);
        float len = 1.1 + 3.4*hash21(vec2(wc, 17.)), k = clamp(1. + wy/len, 0., 1.), w = .045 + .15*k;
        iceK = (1. - smoothstep(w*.6, w, abs(wx + .04*sin(wy*4. + wc)))) * step(wy, -.07) * smoothstep(0., .22, k) * step(.45, wh) * lodF;
      }
      // on the two piers of the central arch an iron inspection ladder up the pilaster, and a bulkhead lamp at its head throwing its pool on the stone
      float lx = abs(vPos.x) - ${(PITCH / 2).toFixed(2)}, lodL = clamp(1. - fwY*7., 0., 1.);
      if (abs(lx) < 6.){
        vec2 dl = vec2(lx - .95, vPos.y - 59.6); float d2 = dot(dl, dl);
        bulk = uWarm * (1.5 * exp(-d2*.2) * (.92 + .08*sin(uTime*6.1 + vPos.x)));
        emis += uWarm * 7. * (1. - smoothstep(.02, .045, d2));
        float inY = step(42.4, vPos.y) * step(vPos.y, 60.3);
        float rail = 1. - smoothstep(.03, .065, abs(abs(lx) - .27));
        float rung = (1. - smoothstep(.025, .055, abs(fract(vPos.y/.36) - .5)*.36)) * step(abs(lx), .27);
        float lad = max(rail, rung) * inY * lodL;
        float shd = (1. - smoothstep(.03, .09, abs(abs(lx + .1) - .27))) * inY * lodL * exp(-d2*.03);      // the rails' shadow in the lamp's light
        alb *= 1. - .45*shd; alb = mix(alb, vec3(.035, .035, .045), lad);
      }
    } else if (m > 8.5){                                   // the barrels: soot in long bands along the arc, rime toward both rims
      alb *= 1. - .3 * smoothstep(.45, .8, vnoise(vec2(vUv.x*.3 + 5., vUv.y*.05)));
      strSnow = .34 * smoothstep(2.6, 4.4, abs(vPos.z)) * smoothstep(.35, .7, vnoise(vUv*vec2(.5, .16) + 21.));
    }
    // wind-plastered snow: patches, course ledges and frost toward the top
    float fy = fract(vUv.y/bh);
    float fr = smoothstep(.46, .8, big + .08*vnoise(vUv*2.3) + smoothstep(20., 66., vPos.y)*.12) * .42;
    fr = max(fr, (m < .5 ? smoothstep(.8, .97, fy) : 0.) * lod * smoothstep(.35, .6, vnoise(vUv*vec2(.6, .2) + 3.)) * .55);
    fr = max(fr, mort * nearK * .6 * smoothstep(.3, .65, vnoise(vUv*.8 + 13.)));      // rime packed into the joints
    snow = max(max(fr * (.4 + .6*smoothstep(-.6, .2, n.y)), strSnow), smoothstep(.3, .62, n.y + (vnoise(vPos.xz*1.3) - .5)*.2));
    alb = mix(alb, vec3(.5, .64, .84), iceK*.85); sheen = iceK*.8; snow *= 1. - iceK;
  } else if (m < 1.5){ snow = 1.; }
  else if (m < 2.5){ alb = vec3(.42, .56, .74)*vCol; sheen = .9; wrap = 1.; }          // ice
  else if (m < 3.5){                                                                   // crag rock
    float st = fbm(vec2(vPos.y*.33 + fbm(vPos.xz*.05)*4., (vPos.x + vPos.z)*.045));
    alb = uRockCol * vCol * (.62 + .6*st) * (.75 + .5*vnoise(vec2(vPos.x*.5 + vPos.z*.4, vPos.y*.07)));
    snow = smoothstep(.36, .64, n.y + (fbm(vPos.xz*.16) - .5)*.55 + (st - .5)*.25);
  } else if (m < 4.5){ sheen = .5; snow = smoothstep(.6, .9, n.y)*.8; }
  else if (m < 5.5){ emis = vCol * (4.6 + .5*sin(uTime*8. + vPos.x)); alb = vec3(0.); }
  else if (m < 7.5){ alb = vec3(.002); }
  else {                                                                               // deck: snow, sleepers, ballast
    float az = abs(vPos.z), tr = 1. - smoothstep(1.3, 1.9, az);
    float sl = smoothstep(.3, .42, abs(fract(vPos.x/.78) - .5));
    alb = mix(vec3(.75), vec3(.07, .065, .07), tr * (.35 + .4*sl) * (.6 + .4*vnoise(vPos.xz*3.)));
    snow = 1. - tr*(.5 + .4*sl);
  }
  vec3 snowAlb = uSnowCol * (.86 + .14*vnoise(vPos.xz*.8 + vPos.y*.6));
  alb = mix(alb, snowAlb, clamp(snow, 0., 1.));
  wrap = mix(wrap, .75, snow);
  vec3 v = normalize(vWV);
  vec3 light = ambient(n) + skim(n, v) * (1. + 1.5*snow);
  vec3 lmp = lampLight(vPos, n, .7), trn = trainLight(vPos, n, 1.2);
  light += lmp + trn + bulk + (m > 8.5 ? lmp*.5 : vec3(0.));      // the barrels hold the keystone lanterns' light
  light += vec3(1., .9, .7) * headCone(vPos) * (max(-n.x, 0.)*2. + .35) * .9;
  vec3 col = alb * light + emis;
  float fres = pow(1. - max(dot(-v, n), 0.), 3.);
  col += fres * sheen * (uSky*.5 + lmp*.6 + uRim*.5*smoothstep(0., .8, dot(v, uRimDir)));
  // sparkle on snow close to the lamps
  float sp = step(.992, hash21(floor(vPos.xz*9.) + floor(vPos.y*9.))) * snow;
  col += sp * (lmp + trn) * 1.5;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const TRAIN_VS = /* glsl */`
attribute float aMat; attribute vec4 aSpin;
uniform float uTravel, uHeadX, uTrainS, uTime;
varying vec3 vPos, vLoc, vNor, vCol, vWV; varying vec2 vUv; varying float vMat;
#include <fog_pars_vertex>
void main(){
  vec3 p = position, n = normal; float mode = aSpin.w;
  if (mode > .5 && mode < 1.5){
    float a = -uTravel/aSpin.z, c = cos(a), s = sin(a); vec2 d = p.xy - aSpin.xy;
    p.xy = aSpin.xy + vec2(c*d.x - s*d.y, s*d.x + c*d.y); n.xy = vec2(c*n.x - s*n.y, s*n.x + c*n.y);
  } else if (mode > 9.5){
    float a = uTime*11., c = cos(a), s = sin(a); vec2 d = vec2(p.y - aSpin.y, p.z);
    p.y = aSpin.y + c*d.x - s*d.y; p.z = s*d.x + c*d.y; n.yz = vec2(c*n.y - s*n.z, s*n.y + c*n.z);
  } else if (mode > 1.5){
    float far = step(5., mode), mm = mode - 4.*far, a = -uTravel/${f1(RDRIVE * LOCO_K)} + 1.5708*far;
    p.xy += ${f1(CRANK * LOCO_K)} * vec2(cos(a), sin(a) * (mm > 3. ? aSpin.z : 1.));
  }
  vPos = p; vNor = n; vCol = color; vUv = uv; vMat = aMat;
  vLoc = vec3(uHeadX, ${f1(RAILY)}, 0.) + p * uTrainS;
  vec4 wp = modelMatrix * vec4(p, 1.); vWV = wp.xyz - cameraPosition;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const TRAIN_FS = /* glsl */`
varying vec3 vPos, vLoc, vNor, vCol, vWV; varying vec2 vUv; varying float vMat;
uniform vec3 uSnowCol;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  if (abs(vLoc.x) > XCLIP) discard;
  vec3 n = normalize(vNor); if (!gl_FrontFacing) n = -n;
  float m = floor(vMat + .5); vec3 v = normalize(vWV);
  vec3 alb = vCol, emis = vec3(0.); float gloss = .6, snow = 0.;
  if (m > .5 && m < 1.5){                                 // lit window: lamp glow, curtains, passengers
    float seed = floor(vUv.x*.5 + .01), u = vUv.x - seed*2., w = vUv.y;
    float h1 = hash21(vec2(seed, 7.)), h2 = hash21(vec2(seed, 19.));
    float g = .55 + .45*smoothstep(0., 1., w) ;
    float curt = 1. - smoothstep(.1, .22, min(u, 1. - u) * (.7 + w*1.2));
    vec2 hp = vec2(.3 + .4*h1, .2);
    float head = (1. - smoothstep(.1, .15, length((vec2(u, w) - hp)*vec2(1., .8)))) + (1. - smoothstep(.16, .2, abs(u - hp.x))) * step(w, .14);
    head *= step(.45, h2);
    vec3 c = vCol * g * mix(vec3(1.), vec3(.9, .3, .2), curt*.8) * (1. - .7*clamp(head, 0., 1.));
    float frame = smoothstep(.0, .05, min(min(u, 1. - u), min(w, 1. - w)*.6)) * (1. - .5*(1. - smoothstep(.0, .025, abs(u - .5))));
    emis = c * 5. * frame; alb = vec3(.01);
  } else if (m > 3.5 && m < 4.5){ emis = vCol * 9.; alb = vec3(0.); }
  else if (m > 4.5 && m < 5.5){ float fl = .65 + .35*vnoise(vec2(uTime*6., vPos.y*3. + vPos.z*2.)); emis = vCol * (3.4 + 4.6*fl); alb = vec3(0.); }
  else if (m > 1.5 && m < 2.5){ gloss = 1.4; }
  else if (m > 2.5 && m < 3.5){ gloss = .15; snow = smoothstep(.25, .6, n.y + (vnoise(vLoc.xz*.9) - .5)*.5); }
  else if (m > 5.5){ gloss = .6; snow = smoothstep(.55, .75, vnoise(vLoc.xz*2.5)) * .7; }
  else { snow = smoothstep(.75, .95, n.y) * .7; }
  alb = mix(alb, uSnowCol * .92, snow); gloss *= 1. - snow;
  vec3 light = ambient(n) + skim(n, v) + lampLight(vLoc, n, .3)*1.1;
  light += uWarm * (.1 + .2*max(-n.y, 0.)) * step(vPos.x, -uCarStart/uTrainS + 1.) * (1. - snow);      // the carriages' own window light spilling on their sides
  vec3 Lf = vec3(-uFireOff/uTrainS, 1.0, 0.) - vPos; float d2 = dot(Lf, Lf);
  light += uFire * (3.2 * wrapNL(n, Lf, d2, .6) / (1. + d2*.07)) * (.8 + .2*sin(uTime*13.));
  vec3 col = alb * light + emis;
  vec3 r = reflect(v, n); float fres = pow(1. - max(dot(-v, n), 0.), 4.);
  vec3 env = mix(uGround*.6, uSky, smoothstep(-.3, .5, r.y)) + uRim * pow(max(dot(r, uRimDir), 0.), 6.) * 3.;
  col += env * gloss * (.1 + .6*fres) * (m > 1.5 && m < 2.5 ? vCol*3. + .2 : vec3(1.));
  col += lampLight(vLoc, r, 0.) * gloss * .25;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const FOG_FRAG_FN = /* glsl */`
float fogAmount(){
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      return smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #else
    return 0.;
  #endif
}`;

// ---------------------------------------------------------------- steam, glows, snow, light volumes
function quadInstances(count) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3));
  g.setIndex([0, 1, 2, 0, 2, 3]); g.instanceCount = count;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 50, 0), 400);
  return g;
}

function makeSteam(S, rng, U, fogU) {
  // kinds: 0 plume, 1 whistle, 2 cylinder jets, 3 chimney sparks, 4 spindrift torn off the parapet snow, 5 the snowplough's arc (rare)
  const NP = S.puffs, NW = 26, NJ = 44, NS = 60, ND = 180, NA = S.plough ? 900 : 0, N = NP + NW + NJ + NS + ND + NA, seed = new Float32Array(N * 4);
  for (let i = 0; i < N; i++) {
    const kind = i < NP ? 0 : i < NP + NW ? 1 : i < NP + NW + NJ ? 2 : i < NP + NW + NJ + NS ? 3 : i < NP + NW + NJ + NS + ND ? 4 : 5;
    seed.set([kind === 0 ? (i + rng() * 0.8) / NP : rng(), rng(), rng(), kind], i * 4);
  }
  const g = quadInstances(N); g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU, ...U }, fog: true, transparent: true, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
    vertexShader: /* glsl */`
      attribute vec4 aSeed;
      uniform float uTime, uHeadX, uTrainS, uTravelW, uPlumeLen, uWhistle, uTrainLen, uTrainK;
      uniform vec3 uChim, uWhis, uCyl, uLampOff; uniform vec4 uPlough; uniform vec2 uBlow;
      varying vec2 vQ, vOff; varying vec3 vK; varying float vSeed, vKind;
      #include <fog_pars_vertex>
      const float RAILY = ${f1(RAILY)}, XCLIP = ${f1(XT - 0.5)}, XEND = ${f1(XEND)}, PARTOP = ${f1(PARTOP)};
      void main(){
        float kind = aSeed.w, size, alpha; vec3 c; vec2 warm = vec2(0.);
        vec3 head = vec3(uHeadX, RAILY, 0.);
        if (kind < .5){
          float u = fract(aSeed.x + uTravelW/uPlumeLen + uTime*.012), d = u*uPlumeLen;
          float ex = uHeadX + uChim.x - d, spread = .45 + 6.5*pow(u, .75);
          float calm = 1. - clamp(length(uBlow)*.125, 0., 1.);
          float rise = 1.0 + (10. + 4.*calm)*(1. - exp(-d/24.)) + (5. + 15.*calm)*u + 2.2*calm*sin(ex*.085)*smoothstep(8., 40., d);      // still air: it towers in rolling heads
          c = vec3(ex + sin(aSeed.y*40. + uTime*.31)*spread*.5,
                   RAILY + uChim.y + rise + (aSeed.y - .5)*spread*1.15 + sin(uTime*.45 + aSeed.x*30.)*spread*.12,
                   (aSeed.z - .5)*spread*1.5 + sin(d*.045 + 1.3)*2.4*u - 7.*u*u + cos(uTime*.37 + aSeed.z*20.)*spread*.12);
          size = (1.05 + 9.5*pow(u, .7)) * (.7 + .6*aSeed.z);
          alpha = smoothstep(0., .012, u) * (1. - smoothstep(.4, 1., u)) * .72;
          alpha *= smoothstep(-XCLIP - 3., -XCLIP + 5., ex) * (1. - smoothstep(XCLIP - 4., XCLIP + 1., ex));
          warm = vec2(exp(-d/12.) * 1.5 + .4*exp(-d/38.) + .66*exp(-d/170.), (1. - smoothstep(uTrainLen*.8, uTrainLen*1.1, d)) * .42);      // the firebox lights the first 40 m from below, and the lit carriages under it carry the orange on along the whole plume
        } else if (kind < 1.5){
          float age = fract(aSeed.x + uTime*1.4);
          c = head + uWhis + vec3(-age*5.5 + (aSeed.y - .5)*age, age*7.5, (aSeed.z - .5)*age*2.2);
          size = .35 + 2.6*age; alpha = uWhistle * (1. - age) * .95 * step(abs(c.x), XCLIP);
        } else if (kind < 2.5){
          float sd = aSeed.y > .5 ? 1. : -1., age = fract(aSeed.x + uTime*.85);
          c = head + uCyl*vec3(1., 1., sd) + vec3(-age*7. + (aSeed.z - .5)*age*2., -.3 + age*age*2.6, sd*(.3 + age*6.));
          size = .45 + 3.6*age; alpha = (1. - age) * .5 * step(abs(c.x), XCLIP);
          warm = vec2(0., .5);
        } else if (kind < 3.5){
          float age = fract(aSeed.x + uTime*(.5 + .5*aSeed.y)), t = age*1.9;
          c = head + uChim + vec3(-t*(6. + 9.*aSeed.z) + sin(aSeed.y*50. + t*5.)*.5, .6 + t*(5. + 5.*aSeed.y) - t*t*2.5, (aSeed.z - .5)*t*4.5 + cos(aSeed.x*70. + t*4.)*.4);
          size = .11 + .12*aSeed.y; alpha = (1. - age)*(1. - age) * smoothstep(0., .04, age) * step(abs(c.x), XCLIP);
          warm = vec2(1., 0.);
        } else if (kind < 4.5){
          float sd = aSeed.y > .5 ? 1. : -1., age = fract(aSeed.x*13. + uTime*(.5 + .35*aSeed.z)), back = aSeed.x*(uTrainLen + 10.) - 5.;
          c = vec3(uHeadX - back + age*(5. + 7.*aSeed.z), PARTOP + .25 + age*(1.2 + 3.4*aSeed.z) + sin(age*9. + aSeed.x*40.)*.35*age, sd*(4.9 + age*(1.5 + 5.5*fract(aSeed.y*7.3))));
          size = .55 + 3.6*age; alpha = smoothstep(0., .12, age) * (1. - age) * .4 * step(abs(c.x), XEND + 4.);
          warm = vec2(.2*exp(-max(back, 0.)/18.), .45);
        } else {
          float age = fract(aSeed.x + uTime*.5), t = age*2.3;
          vec3 v0 = vec3(9. + 6.*aSeed.y, 2.6 + 2.6*aSeed.z, 7. + 6.*fract(aSeed.y*9.7));      // thrown out and forward over the parapet, to fall away below the deck
          c = head + uPlough.xyz + v0*t + vec3(0., -4.9*t*t, 0.) + vec3(sin(aSeed.z*30. + t), cos(aSeed.y*40. + t), sin(aSeed.x*50.))*.4*t;
          size = .07 + .17*age + .11*age*aSeed.z; alpha = uPlough.w * smoothstep(0., .04, age) * pow(1. - age, .7) * .8 * step(abs(head.x + uPlough.x), XCLIP);
          vec3 dc = c - vec3(uHeadX - uLampOff.x, RAILY + uLampOff.y, 0.); float crn = .5 + max(dc.x, 0.)*.07;      // it flies through the headlamp's beam
          warm = vec2(0., .7*exp(-t*1.6) + 1.6*step(0., dc.x)*(1. - smoothstep(crn*.1, crn, length(dc.yz)))*exp(-max(dc.x, 0.)*.04));
        }
        alpha *= uTrainK;
        float a = aSeed.z*6.283 + uTime*(aSeed.y - .5)*.25, cs = cos(a), sn = sin(a);
        vQ = position.xy; vOff = vec2(cs*position.x - sn*position.y, sn*position.x + cs*position.y);
        vK = vec3(alpha, warm); vSeed = aSeed.x*91. + aSeed.y*13.; vKind = kind;
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
        if (kind > 4.5){                                         // a grain of thrown snow: a streak along its flight
          float tp = fract(aSeed.x + uTime*.5)*2.3;
          vec3 vel = vec3(9. + 6.*aSeed.y, 2.6 + 2.6*aSeed.z - 9.8*tp, 7. + 6.*fract(aSeed.y*9.7));
          vec2 ax = normalize((modelViewMatrix * vec4(vel, 0.)).xy + vec2(1e-4, 0.));
          vOff = position.xy; mvPosition.xy += (ax*position.x*2.5 + vec2(-ax.y, ax.x)*position.y) * size;
        } else mvPosition.xy += vOff * size;
        gl_Position = alpha > .002 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ, vOff; varying vec3 vK; varying float vSeed, vKind;
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${FOG_FRAG_FN}
      void main(){
        float r = length(vQ);
        if (vKind > 2.5 && vKind < 3.5){                       // a spark: additive (premultiplied with no coverage)
          if (r > 1.) discard;
          float g = exp(-r*r*5.) * vK.x * (1. - fogAmount());
          gl_FragColor = vec4(mix(uFire, vec3(1., .75, .35), g) * g * 9., 0.); return;
        }
        float nz = fbm(vQ*1.7 + vSeed + vec2(0., -uTime*.06));
        float a = (1. - smoothstep(.25, 1., r + (nz - .5)*1.0)) * vK.x;
        if (vKind > 4.5) a = (1. - smoothstep(.15, 1., r)) * vK.x * (.32 + .95*smoothstep(.4, .55, nz));       // thrown snow is a grainy spray, not a puff
        if (a < .004) discard;
        float up = clamp(vOff.y*.55 + .5 + (nz - .5)*.5, 0., 1.), snowy = step(3.5, vKind);
        vec3 col = mix(uGround*.8, uSky*1.15 + uRim*.13, up) * (.7 + .6*nz) * (1. - .6*min(vK.y, 1.));      // cold blue-grey steam, a little of the last light on its crown
        col = mix(col, (mix(uGround, uSky, up)*1.5 + uRim*.2) * (.75 + .5*nz), snowy);
        col += (uFire + uWarm*.16) * vK.y * pow(1. - up, 1.3) * (.6 + .8*nz) * 1.25 + uWarm * vK.z * mix(1. - up, 1., snowy) * (.5 + nz) * .6;
        col = mix(col, fogColor, fogAmount());
        gl_FragColor = vec4(col*a, a);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}

function makeGlows(list, U, fogU) {
  const N = list.length, pos = new Float32Array(N * 3), col = new Float32Array(N * 3), sz = new Float32Array(N * 3);
  list.forEach((q, i) => { pos.set([q[0], q[1], q[2]], i * 3); col.set(q[3], i * 3); sz.set([q[4], q[5] > 1.5 ? 1 : 0, i * 1.7], i * 3); });
  const g = quadInstances(N);
  g.setAttribute('aPos', new THREE.InstancedBufferAttribute(pos, 3)); g.setAttribute('aCol', new THREE.InstancedBufferAttribute(col, 3)); g.setAttribute('aSz', new THREE.InstancedBufferAttribute(sz, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU, ...U }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec3 aPos, aCol, aSz; uniform float uTime, uHeadX, uTrainS, uTrainK, uGlowK;
      varying vec2 vQ; varying vec3 vC;
      #include <fog_pars_vertex>
      void main(){
        vec3 c = aPos; float k = uGlowK;
        if (aSz.y > .5){ c = vec3(uHeadX, ${f1(RAILY)}, 0.) + aPos*uTrainS; k *= step(abs(c.x), ${f1(XT - 0.5)}) * uTrainK; }
        k *= .88 + .12*sin(uTime*7. + aSz.z*3.)*sin(uTime*4.3 + aSz.z);
        vQ = position.xy; vC = aCol * k;
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.); mvPosition.xyz *= 1. - 1.3/max(1.3, length(mvPosition.xyz))*.999;
        mvPosition.xy += position.xy * aSz.x * .5;
        gl_Position = k > .001 ? projectionMatrix * mvPosition : vec4(2., 2., 2., 1.);
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vC;
      #include <fog_pars_fragment>
      ${FOG_FRAG_FN}
      void main(){
        float r2 = dot(vQ, vQ); if (r2 > 1.) discard;
        float g = exp(-r2*5.5)*.55 + exp(-r2*60.)*1.6; g *= 1. - r2;
        gl_FragColor = vec4(vC * g * (1. - fogAmount()), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 4;
  return mesh;
}

function makeSnow(S, rng, U, fogU) {
  const N = S.flakes, a = new Float32Array(N * 4); for (let i = 0; i < N * 4; i++) a[i] = rng();
  const g = quadInstances(N); g.setAttribute('aP', new THREE.InstancedBufferAttribute(a, 4));
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU, ...U }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
      attribute vec4 aP; uniform vec2 uBlow; varying vec2 vQ; varying vec3 vC;
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      void main(){
        const vec3 B0 = vec3(${f1(-XT - 4)}, ${f1(RAILY - 10)}, -15.), BS = vec3(${f1(2 * XT + 8)}, 26., 30.);
        vec3 c = B0 + vec3(mod(aP.x*BS.x - uTime*(.5 + aP.w*.5) + uTime*uBlow.x*(.7 + .6*aP.w), BS.x) + sin(uTime*.7 + aP.w*40.)*.5,
                           mod(aP.y*BS.y - uTime*(1.2 + aP.w*1.1), BS.y),
                           mod(aP.z*BS.z + sin(uTime*.5 + aP.w*23.)*.6 + uTime*.25 + uTime*uBlow.y*(.7 + .6*aP.w), BS.z));
        vec3 l = lampLight(c, vec3(0.), 1e3)*3.4 + trainLight(c, vec3(0.), 1e3)*2. + vec3(1., .9, .7)*headCone(c)*5.;
        vC = uSky*.22 + l; vQ = position.xy;
        vec4 mvPosition = modelViewMatrix * vec4(c, 1.);
        float sz = max(.05 + .06*aP.w, -mvPosition.z*.0012);
        vC *= min(1., (.05 + .06*aP.w)/sz*2.2) * smoothstep(0., 1.5, min(c.y - B0.y, B0.y + BS.y - c.y));
        mvPosition.xy += position.xy * sz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vQ; varying vec3 vC;
      #include <fog_pars_fragment>
      ${FOG_FRAG_FN}
      void main(){ float r = length(vQ); if (r > 1.) discard; gl_FragColor = vec4(vC * (1. - smoothstep(.25, 1., r)) * (1. - fogAmount()), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// headlamp cone + amber haze beside the lit carriages (train-local geometry, additive)
function makeVolumes(T, S, U, fogU) {
  const p = [], n = [], k = [], idx = [], H = T.headlamp, LEN = 50, SEG = 20, RINGS = 10;
  for (let i = 0; i <= RINGS; i++) for (let j = 0; j <= SEG; j++) {
    const t = i / RINGS, a = (j / SEG) * 6.2832, r = 0.5 / S.trainScale + t * LEN * 0.07;
    p.push(H[0] + 0.1 + t * LEN, H[1] + Math.cos(a) * r, Math.sin(a) * r); n.push(-0.1, Math.cos(a), Math.sin(a)); k.push(t, 0);
  }
  for (let i = 0; i < RINGS; i++) for (let j = 0; j < SEG; j++) { const a = i * (SEG + 1) + j, b = a + SEG + 1; idx.push(a, b, b + 1, a, b + 1, a + 1); }
  for (const zs of [-1, 1]) {
    const b = p.length / 3, x0 = -T.length, x1 = T.carEnd;
    p.push(x0, 3.0, 1.45 * zs, x1, 3.0, 1.45 * zs, x1, 0.7, 4.6 * zs, x0, 0.7, 4.6 * zs); n.push(0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0); k.push(0, 1, 0, 1, 1, 1, 1, 1);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(n, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(k, 2)); g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...fogU, ...U }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      attribute vec2 aK; uniform float uHeadX, uTrainS; varying vec2 vK; varying vec3 vN, vV, vP; varying float vX;
      #include <fog_pars_vertex>
      void main(){
        vK = aK; vP = position; vX = uHeadX + position.x*uTrainS;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.); vN = normalMatrix * normal; vV = mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vK; varying vec3 vN, vV, vP; varying float vX;
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${FOG_FRAG_FN}
      void main(){
        if (abs(vX) > XCLIP) discard;
        vec3 col;
        if (vK.y < .5){
          // a soft beam: bright only where the eye looks through its thickness, dying along its length, broken up by the falling snow it lights
          float f = pow(abs(dot(normalize(vN), normalize(vV))), 2.6);
          float ang = atan(vP.z, vP.y - 4. + 1e-5);
          float streak = .5 + .5*vnoise(vec2(vP.x*.5 - uTime*3., ang*4.));
          float speck = smoothstep(.66, .92, vnoise(vec2(vP.x*2.4 - uTime*2.5, ang*8. + uTime*1.3)));       // soft motes of lit snow (hard cells read as rectangles when the beam is seen end-on)
          col = vec3(1., .88, .66) * f * pow(clamp(1. - vK.x, 0., 1.), 3.4) * (streak * .26 + speck * .16) * smoothstep(0., .04, vK.x);
        } else {
          float w = 1. - vK.x; col = uWarm * w*w * (.14 + .08*sin(vP.x*4.6)) ;
        }
        gl_FragColor = vec4(col * uTrainK * (1. - fogAmount()), 1.);
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}

// ---------------------------------------------------------------- hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('express-viaduct') : ctx.rng, noise = ctx.noise;
  const palHex = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const pal = palHex.map(hex);
  const rise = rng.range(17, 20.5);
  const S = {
    stone: mix3(pal[4], pal[2], rng.range(0.24, 0.36)), rock: mix3(pal[4], pal[2], rng.range(0.22, 0.36)).map((v) => v * 1.5),
    amberC: pal[6], snowC: pal[3], crimson: pal[5],
    rise, spring: CROWN - rise, archExp: rng.pick([2, 2, 1.85, 1.72]), ringT: rng.range(1.35, 1.7),
    tiers: rng.int(3, 4), batterX: rng.range(0.028, 0.045), batterZ: rng.range(0.05, 0.075), ledge: rng.range(0.3, 0.5),
    icicles: rng.int(240, 380), crenel: rng.chance(0.65),
    trainScale: opts.trainScale ?? 1.45, carriages: opts.carriages ?? 8,
    creamBand: rng.chance(0.5), domeFirst: rng.chance(0.5), deflectors: rng.chance(0.45), drivers: rng.pick([3, 3, 4]),
    puffs: 300, flakes: Math.max(1500, Math.round(opts.flakes ?? 7000)), lamps: [], keyLamps: [], pierLamps: [], ledges: [], plough: !!opts.plough,
  };
  const s = S.trainScale;
  const object = new THREE.Group(); object.name = 'express-on-the-viaduct';

  // ---- static stonework
  const G = new Geo();
  const yld = ctx.yield ? () => ctx.yield() : null;
  await buildViaduct(G, S, rng, noise, yld);
  await ctx.yield?.();
  const glowList = S.lamps.map((l) => [l[0], l[1] - 0.1, l[2], pal[6], 7.5, 1]);
  for (const l of S.keyLamps) glowList.push([l[0], l[1] + 0.25, l[2], pal[6], 6.4, 1]);
  for (const l of S.pierLamps) glowList.push([l[0], l[1], l[2], pal[6], 6.4, 1]);
  const pierY = S.pierLamps.reduce((a, l) => a + l[1], 0) / Math.max(1, S.pierLamps.length), pierZ = S.pierLamps.reduce((a, l) => a + Math.abs(l[2]), 0) / Math.max(1, S.pierLamps.length);
  const extraLamps = [];
  for (const sx of [1, -1]) {
    const B = new Geo(), out = { glows: [], lamps: [] };
    buildBastion(B, S, rng, noise, opts.crags !== false, out);
    appendGeo(G, B, sx > 0 ? -1 : 0);
    for (const q of out.glows) glowList.push([q[0] * sx, q[1], q[2], q[3], q[4], q[5]]);
    for (const l of out.lamps) extraLamps.push([l[0] * sx, l[1], l[2]]);
    await ctx.yield?.();
  }
  await addSnowAndIce(G, S, rng, noise, yld);
  await ctx.yield?.();

  // ---- train
  const T = await buildTrain(S, rng, yld);
  await ctx.yield?.();
  const trainLen = T.length * s, lead = T.lead * s, travelTotal = 2 * (XT + 4) + trainLen + lead;      // lead: what rides ahead of the locomotive (the rare snowplough)
  const headX = (p) => -(XT + 4) - lead + clamp(p, 0, 1) * travelTotal;
  const pForHead = (x) => clamp((x + XT + 4 + lead) / travelTotal, 0, 1);

  // ---- shared uniforms
  const V3 = (a) => new THREE.Vector3(a[0], a[1], a[2]), C3 = (a) => new THREE.Color(a[0], a[1], a[2]);
  const U = {
    uTime: { value: 0 }, uHeadX: { value: 0 }, uTravel: { value: 0 }, uTravelW: { value: 0 }, uWhistle: { value: 0 },
    uTrainLen: { value: trainLen }, uTrainS: { value: s }, uCarStart: { value: -T.carEnd * s }, uFireOff: { value: -T.firebox[0] * s },
    uLampOff: { value: new THREE.Vector3(-T.headlamp[0] * s, T.headlamp[1] * s, 0) },
    uChim: { value: V3(T.chimney).multiplyScalar(s) }, uWhis: { value: V3(T.whistle).multiplyScalar(s) }, uCyl: { value: V3(T.cyl).multiplyScalar(s) },
    uPlumeLen: { value: 150 }, uLampK: { value: 2.4 }, uTrainK: { value: 1 }, uGlowK: { value: 1 },
    uPlough: { value: T.plough ? new THREE.Vector4(T.plough[0] * s, T.plough[1] * s, T.plough[2] * s, 1) : new THREE.Vector4(0, 0, 0, 0) },
    uBlow: { value: new THREE.Vector2((opts.wind?.[0] ?? 0) * 13 * (opts.blow ?? 0), (opts.wind?.[1] ?? 0) * 13 * (opts.blow ?? 0)) },
    uSky: { value: C3(mix3(pal[1], pal[3], 0.3)).multiplyScalar(0.8) },
    uGround: { value: C3(mix3(pal[1], pal[2], 0.5)).multiplyScalar(0.36) },
    uRim: { value: C3(pal[2]).multiplyScalar(0.5) }, uRimDir: { value: new THREE.Vector3(0, 0.22, -1).normalize() },
    uWarm: { value: C3(pal[6]) }, uFire: { value: new THREE.Color(1.0, 0.36, 0.08) },
    uSnowCol: { value: C3(pal[3]).multiplyScalar(0.84) }, uRockCol: { value: C3(S.rock) },
    uPier: { value: new THREE.Vector2(pierY, pierZ) },      // the pier lanterns: their height and how far they stand off the axis
    uWirePx: { value: 0.0016 },                            // half a wire's least width, as an angle: about 0.6 of a pixel (set every frame from the drawing buffer)
  };
  const bufSize = new THREE.Vector2();
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

  await ctx.yield?.();
  const stoneGeo = await G.buildAsync(yld);
  await ctx.yield?.();
  const stoneMesh = new THREE.Mesh(stoneGeo, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: STATIC_VS, fragmentShader: STATIC_FS, vertexColors: true, fog: true }));
  stoneMesh.name = 'viaduct'; object.add(stoneMesh);
  await ctx.yield?.();

  const train = new THREE.Mesh(T.geo, new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...U }, vertexShader: TRAIN_VS, fragmentShader: TRAIN_FS, vertexColors: true, fog: true, side: THREE.DoubleSide }));
  train.name = 'express'; train.frustumCulled = false; train.scale.setScalar(s); train.position.set(0, RAILY, 0); object.add(train);
  await ctx.yield?.();
  const volumes = makeVolumes(T, S, U, fogU()); train.add(volumes);
  await ctx.yield?.();

  for (const q of T.glows) glowList.push([q[0], q[1], q[2], q[3], q[4] * s, 2]);
  const glows = makeGlows(glowList, U, fogU()); object.add(glows);
  await ctx.yield?.();
  const steam = makeSteam(S, rng, U, fogU()); object.add(steam);
  await ctx.yield?.();
  let snow = null;
  if (opts.snow !== false) { snow = makeSnow(S, rng, U, fogU()); object.add(snow); }
  let light = null;
  if (opts.light !== false) { light = new THREE.PointLight(0xff8a3a, 900, 90, 2); object.add(light); }
  await ctx.yield?.();

  // ---- progress
  let progress = -1;
  function setProgress(p) {
    p = clamp(+p || 0, 0, 1); if (p === progress) return; progress = p;
    const hx = headX(p);
    U.uHeadX.value = hx; U.uTravelW.value = hx + XT + 4; U.uTravel.value = (hx + XT + 4) / s;
    train.position.x = hx;
    const wIn = smoothstep(-XT - 1, -XT + 6, hx) * (1 - smoothstep(-XEND + 30, -XEND + 62, hx));
    const wOut = smoothstep(XEND - 62, XEND - 40, hx) * (1 - smoothstep(XEND - 8, XEND + 8, hx));
    U.uWhistle.value = Math.max(wIn, wOut);
    if (light) { const fx = hx + T.firebox[0] * s; light.position.set(fx, RAILY + 1.4 * s, 0); light.intensity = Math.abs(fx) < XT - 1 ? 900 : 0; }
  }
  const progressForU = (u, uEnter = 0.42, uCentre = 0.6) => pForHead(lerp(-XEND, 0, (u - uEnter) / (uCentre - uEnter)));
  setProgress(opts.progress ?? pForHead(52));

  const col = (v) => (v && v.isColor ? v : new THREE.Color(v));
  function setLight(L = {}) {
    if (L.sky) U.uSky.value.copy(col(L.sky)); if (L.ground) U.uGround.value.copy(col(L.ground));
    if (L.rim) U.uRim.value.copy(col(L.rim)); if (L.rimDir) U.uRimDir.value.copy(L.rimDir).normalize();
    if (L.warm) U.uWarm.value.copy(col(L.warm));
  }

  const triangles = Math.round(G.i.length / 3 + T.tris + (S.puffs + 70 + glowList.length + (snow ? S.flakes : 0)) * 2 + 450);
  const anchors = {
    gaze: new THREE.Vector3(0, 52, 0),
    flyThrough: [[0, 8, 170], [0, 14, 110], [0, 21, 50], [0, 25, 0], [0, 28, -50], [0, 34, -110]].map(V3),
    archCentre: new THREE.Vector3(0, 30, 0),
    archClear: { halfWidth: HALF, crownY: CROWN, springY: S.spring, depth: 2 * (HZ + 0.25) },
    portalSeat: { position: new THREE.Vector3(0, 64, -250), facing: new THREE.Vector3(0, 0, 1), note: 'not built by the hero: seat the 14 m portal in the castle gatehouse on the arch axis' },
    castleSeat: new THREE.Vector3(0, 55, -250),
    train: { deckY: BALLAST, railY: RAILY, x0: -XEND, x1: XEND, tunnelX: XT, length: trainLen, headX, progressForHeadX: pForHead },
    viewpoints: { entry: new THREE.Vector3(0, 60, 420), river: new THREE.Vector3(0, 6, 150), underArch: new THREE.Vector3(0, 25, 0), farSide: new THREE.Vector3(0, 30, -70), threeQuarter: new THREE.Vector3(-150, 78, 230) },
    lamps: S.lamps.concat(extraLamps).map(V3),
    lanterns: S.keyLamps.concat(S.pierLamps).map(V3),      // the lanterns hung under each keystone and bracketed on the piers
    firebox: (p) => new THREE.Vector3(headX(p) + T.firebox[0] * s, RAILY + 1.4 * s, 0),
    tunnels: [new THREE.Vector3(-XT + 2, BALLAST, 0), new THREE.Vector3(XT - 2, BALLAST, 0)],
  };

  return {
    object, radius: 150, height: 80, center: new THREE.Vector3(0, 48, 0), anchors,
    update(dt, time, camera) {
      U.uTime.value = time;
      if (camera && ctx.renderer) { const h = ctx.renderer.getDrawingBufferSize(bufSize).y, e = camera.projectionMatrix.elements[5]; if (h > 0 && e > 0.01) U.uWirePx.value = 1.05 / (e * h); }
    },
    dispose() {},
    ground: true, groundY: 0,
    setProgress, progressForU, setLight, uniforms: U,
    info: { triangles, drawCalls: snow ? 6 : 5, trainLength: trainLen, arches: NARCH, rise: S.rise, archExp: S.archExp, tiers: S.tiers, crenel: S.crenel, drivers: S.drivers, creamBand: S.creamBand, deflectors: S.deflectors },
  };
}
