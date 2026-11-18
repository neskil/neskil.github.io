// THE BLUE TILE HILL (azulejo-descent): Lisbon's Alfama made of cobalt-and-white azulejo, ridden down in the
// cab of a yellow tram: largo, a street barely wider than the car, the burst onto the terrace, the hairpin
// round the Sea Wall (src/parts/azulejo-descent.js), and the last straight into the church door.
// X east, Z south (downhill), Y up. Every surface is the hero's tile material; there are no lights.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeTileMaterial, AZULEJO_PALETTE } from '../parts/azulejo-descent.js';

const EYE = 2.6, XS = -4.5, HW = 2.6;                 // eye above the rail, street centre line, street half width
const MORNING_PALETTE = ['#F8EBD0', '#BBCBE8', '#3E6DC2', '#142E7C', '#C8962E', '#5C3A68', '#F2C312'];
const SHOWER_PALETTE = ['#E2E7EE', '#9FB6E0', '#355FB4', '#122A72', '#C8962E', '#5C3A68', '#F2C312'];
const DUSK_PALETTE = ['#1B3A8A', '#2A52A6', '#9DB9EA', '#F1EFE6', '#E0A63A', '#C59AD6', '#FFCF2A'];

// ---- geometry accumulator: non-indexed triangles carrying the tile attributes, in typed arrays ----
function makeAcc(cap = 3000) {
  let n = 0, c = cap, P = new Float32Array(c * 3), N = new Float32Array(c * 3), T = new Float32Array(c * 2), Q = new Float32Array(c * 4), X = new Float32Array(c * 4), ext = false;
  const st = { pic: 0, seed: 0, bor: 0, wind: 0, rx: 0, ry: 0, rz: 0 };
  const grow = () => {
    c *= 2; const g = (a, k) => { const b = new Float32Array(c * k); b.set(a); return b; };
    P = g(P, 3); N = g(N, 3); T = g(T, 2); Q = g(Q, 4); X = g(X, 4);
  };
  const A = {
    get count() { return n / 3; },
    set(pic, seed = 0, bor = 0) { st.pic = pic; st.seed = seed; st.bor = bor; return A; },
    wind(w) { st.wind = w; if (w) ext = true; return A; },
    rib(x, y, z) { st.rx = x; st.ry = y; st.rz = z; if (x || y || z) ext = true; return A; },
    v(x, y, z, nx, ny, nz, tu, tv, sh = 0) {
      if (n >= c) grow();
      P[n * 3] = x; P[n * 3 + 1] = y; P[n * 3 + 2] = z; N[n * 3] = nx; N[n * 3 + 1] = ny; N[n * 3 + 2] = nz; T[n * 2] = tu; T[n * 2 + 1] = tv;
      Q[n * 4] = st.pic; Q[n * 4 + 1] = st.seed; Q[n * 4 + 2] = sh; Q[n * 4 + 3] = st.bor;
      X[n * 4] = st.wind; X[n * 4 + 1] = st.rx; X[n * 4 + 2] = st.ry; X[n * 4 + 3] = st.rz; n++;
    },
    // quad a,b,c,d ([x,y,z]); n [nx,ny,nz] (winding is fixed against it); tile coords ta..td; shades sa..sd
    quad(a, b, cc, d, nn, ta, tb, tc, td, sa = 0, sb = sa, sc = sb, sd = sa) {
      const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2], e2x = cc[0] - a[0], e2y = cc[1] - a[1], e2z = cc[2] - a[2];
      const fl = (e1y * e2z - e1z * e2y) * nn[0] + (e1z * e2x - e1x * e2z) * nn[1] + (e1x * e2y - e1y * e2x) * nn[2] < 0;
      const p = (q, t, s) => A.v(q[0], q[1], q[2], nn[0], nn[1], nn[2], t[0], t[1], s);
      if (fl) { p(a, ta, sa); p(cc, tc, sc); p(b, tb, sb); p(a, ta, sa); p(d, td, sd); p(cc, tc, sc); }
      else { p(a, ta, sa); p(b, tb, sb); p(cc, tc, sc); p(a, ta, sa); p(cc, tc, sc); p(d, td, sd); }
    },
    tri(a, b, cc, nn, ta, tb, tc, s = 0) {
      const e1x = b[0] - a[0], e1y = b[1] - a[1], e1z = b[2] - a[2], e2x = cc[0] - a[0], e2y = cc[1] - a[1], e2z = cc[2] - a[2];
      const fl = (e1y * e2z - e1z * e2y) * nn[0] + (e1z * e2x - e1x * e2z) * nn[1] + (e1x * e2y - e1y * e2x) * nn[2] < 0;
      const p = (q, t) => A.v(q[0], q[1], q[2], nn[0], nn[1], nn[2], t[0], t[1], s);
      p(a, ta); if (fl) { p(cc, tc); p(b, tb); } else { p(b, tb); p(cc, tc); }
    },
    // vertical wall from (x0,z0) to (x1,z1); its face is on the RIGHT of that direction (so pictures read unmirrored).
    // o: tu (tile u at the start), tv (tile v at y0; default y0), ks (tile scale), sh0/sh1 (shade bottom/top),
    //    b1/t1 (bottom/top height at the far end), rot (tile u runs up the wall), mir (tile u runs backwards)
    wall(x0, z0, x1, z1, y0, y1, o = {}) {
      const dx = x1 - x0, dz = z1 - z0, len = Math.hypot(dx, dz) || 1e-6, nn = [-dz / len, 0, dx / len], ks = o.ks ?? 1;
      const b1 = o.b1 ?? y0, t1 = o.t1 ?? y1, tu = o.tu ?? 0, tv = o.tv ?? y0, s0 = o.sh0 ?? 0, s1 = o.sh1 ?? s0;
      const mir = o.mir ? -1 : 1, tc = (s, y, yb) => (o.rot ? [(tv + (y - yb)) * ks, (tu + mir * s) * ks] : [(tu + mir * s) * ks, (tv + (y - yb)) * ks]);
      A.quad([x0, y0, z0], [x1, b1, z1], [x1, t1, z1], [x0, y1, z0], nn, tc(0, y0, y0), tc(len, b1, y0), tc(len, t1, y0), tc(0, y1, y0), s0, s0, s1, s1);
      return len;
    },
    // level (or sloping) floor between two corners; o: y1 (height at z1), yx (height at x1), down, ks, sh
    flat(x0, z0, x1, z1, y, o = {}) {
      const ks = o.ks ?? 1, ya = y, yb = o.yx ?? y, yc = o.y1 ?? y, s = o.sh ?? 0, nn = [0, o.down ? -1 : 1, 0];
      A.quad([x0, ya, z0], [x1, yb, z0], [x1, yb + yc - ya, z1], [x0, yc, z1], nn, [x0 * ks, z0 * ks], [x1 * ks, z0 * ks], [x1 * ks, z1 * ks], [x0 * ks, z1 * ks], s);
    },
    // box centred at (cx, cz) on y0..y1, turned by yaw; o: top (default true), bottom, sh, ks, taper
    box(cx, cz, sx, sz, y0, y1, yaw = 0, o = {}) {
      const c0 = Math.cos(yaw), s0 = Math.sin(yaw), hx = sx / 2, hz = sz / 2, k = 1 - (o.taper ?? 0), ks = o.ks ?? 1, sh = o.sh ?? 0;
      const W = (lx, lz, y, kk = 1) => [cx + (lx * c0 + lz * s0) * kk, y, cz + (-lx * s0 + lz * c0) * kk];
      const cs = [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]];
      let run = (o.tu ?? cx + cz);
      for (let i = 0; i < 4; i++) {
        const a = cs[i], b = cs[(i + 1) % 4], l = i % 2 ? sz : sx;
        const pa = W(a[0], a[1], y0), pb = W(b[0], b[1], y0), pc = W(b[0] * k, b[1] * k, y1), pd = W(a[0] * k, a[1] * k, y1);
        const nx = pb[2] - pa[2], nz = -(pb[0] - pa[0]), nl = Math.hypot(nx, nz) || 1e-6, sg = (pa[0] - cx) * nx + (pa[2] - cz) * nz + (pb[0] - cx) * nx + (pb[2] - cz) * nz < 0 ? -1 : 1;
        A.quad(pa, pb, pc, pd, [sg * nx / nl, 0, sg * nz / nl], [run * ks, y0 * ks], [(run + l) * ks, y0 * ks], [(run + l) * ks, y1 * ks], [run * ks, y1 * ks], sh);
        run += l;
      }
      if (o.top !== false) A.quad(W(-hx * k, -hz * k, y1), W(hx * k, -hz * k, y1), W(hx * k, hz * k, y1), W(-hx * k, hz * k, y1), [0, 1, 0], [0, 0], [sx * ks, 0], [sx * ks, sz * ks], [0, sz * ks], sh);
      if (o.bottom) A.quad(W(-hx, -hz, y0), W(hx, -hz, y0), W(hx, hz, y0), W(-hx, hz, y0), [0, -1, 0], [0, 0], [sx * ks, 0], [sx * ks, sz * ks], [0, sz * ks], Math.max(sh, 0.7));
    },
    // any three.js geometry (position, normal, uv), transformed by m; tile = uv * (ku, kv)
    geo(g, m, ku = 1, kv = 1, sh = 0) {
      const gg = g.index ? g.toNonIndexed() : g; if (m) gg.applyMatrix4(m);
      const p = gg.attributes.position, nn = gg.attributes.normal, uv = gg.attributes.uv;
      for (let i = 0; i < p.count; i++) A.v(p.getX(i), p.getY(i), p.getZ(i), nn.getX(i), nn.getY(i), nn.getZ(i), uv.getX(i) * ku, uv.getY(i) * kv, sh === 'ny' ? Math.max(0, 0.5 - nn.getY(i) * 0.75) : sh);
      if (gg !== g) gg.dispose(); g.dispose();
    },
    // a ribbon through pts that never gets thinner than about 1.5 px; side (sx,sy,sz) is its width direction
    ribbon(pts, hw, sx = 1, sy = 0, sz = 0) {
      let run = 0;
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i], b = pts[i + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
        const e = [[a, -1, run], [b, -1, run + l], [b, 1, run + l], [a, -1, run], [b, 1, run + l], [a, 1, run]];
        for (const [q, s, t] of e) { A.rib(sx * hw * s, sy * hw * s, sz * hw * s); A.v(q[0] + sx * hw * s, q[1] + sy * hw * s, q[2] + sz * hw * s, 0, 1, 0, t, s * hw); }
        run += l;
      }
      A.rib(0, 0, 0);
    },
    // the geometry in steps (a generator: each yield is a place where a big build may hand the page back)
    *steps() {
      const g = new THREE.BufferGeometry(), sl = (a, k) => new THREE.BufferAttribute(a.slice(0, n * k), k);
      g.setAttribute('position', sl(P, 3)); yield; g.setAttribute('normal', sl(N, 3)); yield; g.setAttribute('aTile', sl(T, 2)); yield;
      const q = Q.subarray(0, n * 4), pic = new Float32Array(n), seed = new Float32Array(n), shade = new Float32Array(n), bor = new Float32Array(n);
      for (let i = 0; i < n; i++) { pic[i] = q[i * 4]; seed[i] = q[i * 4 + 1]; shade[i] = q[i * 4 + 2]; bor[i] = q[i * 4 + 3]; }
      g.setAttribute('aPic', new THREE.BufferAttribute(pic, 1)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
      g.setAttribute('aShade', new THREE.BufferAttribute(shade, 1)); g.setAttribute('aBorder', new THREE.BufferAttribute(bor, 1));
      yield;
      if (ext) {
        const w = new Float32Array(n), r = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { w[i] = X[i * 4]; r[i * 3] = X[i * 4 + 1]; r[i * 3 + 1] = X[i * 4 + 2]; r[i * 3 + 2] = X[i * 4 + 3]; }
        g.setAttribute('aWind', new THREE.BufferAttribute(w, 1)); g.setAttribute('aRib', new THREE.BufferAttribute(r, 3));
        yield;
      }
      g.computeBoundingSphere(); yield; g.computeBoundingBox();
      return g;
    },
    build() { const it = A.steps(); let r; while (!(r = it.next()).done); return r.value; },
  };
  return A;
}
const M4 = (x, y, z, ry = 0, sx = 1, sy = sx, sz = sx) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry), new THREE.Vector3(sx, sy, sz));
const lathe = (pts, seg = 10) => new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg);
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp01 = (x) => Math.min(1, Math.max(0, x));

// ---- the route: rail position by distance (the eye rides EYE above it) ----
const SEGS = [100, 15.8, 26, Math.PI * 15, 40, Math.PI * 32, 40, Math.PI * 14, 76];
const S0 = SEGS.reduce((a, l, i) => { a.push(a[i] + l); return a; }, [0]);      // cumulative starts; S0[9] = total
function railAt(s) {
  let i = 0; while (i < 8 && s > S0[i + 1]) i++;
  const t = Math.max(0, s - S0[i]); let x, z;
  if (i === 0) { x = XS; z = -116 + t; }
  else if (i === 1) { const k = t / SEGS[1]; x = XS + 4.5 * k * k * (3 - 2 * k); z = -16 + 15 * k; }
  else if (i === 2) { x = 0; z = -1 + t; }
  else if (i === 3) { const a = t / 30; x = 30 - 30 * Math.cos(a); z = 25 + 30 * Math.sin(a); }
  else if (i === 4) { x = 30 + t; z = 55; }
  else if (i === 5) { const a = t / 32; x = 70 + 32 * Math.sin(a); z = 87 - 32 * Math.cos(a); }
  else if (i === 6) { x = 70 - t; z = 119; }
  else if (i === 7) { const a = t / 28; x = 30 - 28 * Math.sin(a); z = 147 - 28 * Math.cos(a); }
  else { x = 2; z = 147 + t; }
  // after the street the rail dives at 13 percent so the eye clears the balustrade ahead and the whole city shows at the burst
  const K = [[0, 58], [60, 58], [S0[2], 53], [S0[3], 49.6], [S0[3] + 16, 47.4], [S0[4], 46.4], [S0[5], 45.2], [S0[6], 40], [S0[8], 28], [S0[9], 19]];
  let y = 19; for (let k = 0; k < K.length - 1; k++) if (s <= K[k + 1][0]) { y = K[k][1] + (K[k + 1][1] - K[k][1]) * (s - K[k][0]) / (K[k + 1][0] - K[k][0]); break; }
  return [x, y, z];
}
// the hill under everything: a plain function of z (and a little of x) that the town stands on
function hillY(x, z) {
  let y;
  if (z < -56) y = 58; else if (z < 0) y = 58 + (z + 56) * (5 / 56) * -1; else if (z < 22) y = 53 - 11 * sstep(10, 22, z);            // the belvedere stands on a retaining bluff
  else if (z < 147) y = 42 - (z - 22) * (14 / 125); else if (z < 223) y = 28 - (z - 147) * (9 / 76); else y = Math.max(0.6, 19 - (z - 223) * (18.4 / 70));
  const side = sstep(60, 260, Math.abs(x - 20));
  return y + side * (7 * Math.sin(x * 0.013 + 1.2) + 4 * Math.sin(x * 0.031 + z * 0.01)) * sstep(-40, 60, z) * (1 - sstep(230, 300, z));
}

export default {
  id: 'azulejo-descent',
  name: 'The Blue Tile Hill',
  category: 'city',
  weirdness: 0.35,
  media: ['rail', 'open'],
  async build(ctx) {
    const rng = ctx.rng, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, dens = vary.density ?? 1;
    const scene = new THREE.Scene();

    // ------------------------------------------------------------ what kind of visit this is
    const hour = vary.hour || 'any', vr = rng.fork('visit');
    const look = hour === 'dawn' ? 'morning' : hour === 'night' ? 'dusk' : hour === 'golden' ? vr.pick(['afternoon', 'dusk'])
      : hour === 'day' ? vr.pick(['afternoon', 'shower']) : vr.pick(['afternoon', 'morning', 'dusk', 'shower']);
    const dusk = look === 'dusk', shower = look === 'shower', morning = look === 'morning';
    const festival = vr.chance(0.4), rare = !!vary.rare, catTone = vr.chance(0.5) ? 1 : 0;
    const cast = vr.pick(['caravels', 'fishing', 'galleon']), border = vr.chance(0.4) ? 'manganese' : 'ochre';
    const palette = dusk ? DUSK_PALETTE : morning ? MORNING_PALETTE : shower ? SHOWER_PALETTE : AZULEJO_PALETTE;
    const SUN = (morning ? new THREE.Vector3(0.8, 0.42, 0.3) : dusk ? new THREE.Vector3(-0.93, 0.17, 0.32) : new THREE.Vector3(-0.66, 0.74, 0.13)).normalize();
    const fogCol = new THREE.Color(dusk ? '#3a5fb4' : shower ? '#a3b6dc' : morning ? '#f4e6c8' : '#e3e9f1');
    scene.fog = new THREE.FogExp2(fogCol, dusk ? 0.0006 : shower ? 0.0010 : morning ? 0.0006 : 0.0004);
    scene.background = fogCol.clone();

    // ------------------------------------------------------------ the hero and the one material
    const HERO_Y = 37.6, ARC_C = [70, 87];
    const hero = await buildHero(ctx, { palette, arc: 124, cast, border, travel: 1 });
    hero.object.position.set(ARC_C[0] + 40, HERO_Y, ARC_C[1]); hero.object.rotation.y = -Math.PI / 2;   // face looks west, travel runs south
    hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await ctx.yield();
    const U = hero.uniforms;
    U.uSun.value.copy(SUN);
    U.uWash.value.set(0.52, 0.63, 0.96);
    U.uWarm.value.set(dusk ? 0 : 0.15, dusk ? 0.3 : 0.06, dusk ? 0.5 : 1, 1);          // a sparse warm accent: lit windows near and far; the depth of full shade; gold on the lead ship
    if (dusk) { U.uFloor.value.set(0.012, 0.03, 0.16); U.uWash.value.set(0.66, 0.7, 0.84); U.uWash2.value.set(0.5, 0.56, 0.78); }
    U.uWorld.value.set(0, shower ? 1 : 0, dusk ? 1 : 0, festival ? 1 : 0);
    U.uSky.value.set(shower ? 2 : morning || dusk ? 0 : 1, dusk ? 0.9 : 0, 0, morning ? 1 : 0);
    U.uOpt.value.y = morning ? 1 : 0; U.uOpt.value.z = shower ? 1.9 : morning ? 0.6 : 1; U.uOpt.value.w = dusk ? 0 : 1;
    if (shower) U.uWash.value.set(0.48, 0.6, 0.94);
    U.uCat.value.set(0, 0.06, 1, catTone);
    const matF = makeTileMaterial({ uniforms: U }), matD = hero.material;
    const matSky = makeTileMaterial({ uniforms: U, fog: false, side: THREE.DoubleSide });
    matSky.depthWrite = false;
    const add = async (acc, name, dbl) => {                                                  // big merged geometry: one attribute per step
      if (!acc.count) return null;
      const it = acc.steps(); let r; while (!(r = it.next()).done) await ctx.yield();
      const m = new THREE.Mesh(r.value, dbl ? matD : matF); m.name = name; scene.add(m); return m;
    };
    await ctx.yield();

    // ------------------------------------------------------------ the path
    const TOTAL = S0[9], pts = [];
    for (let s = 0; s < TOTAL - 4; s += 8) { const p = railAt(s); pts.push([p[0], p[1] + EYE, p[2]]); }
    { const p = railAt(TOTAL); pts.push([p[0], p[1] + EYE, p[2]]); }
    const path = makePath(pts), L = path.length;
    await ctx.yield();
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    // frame at distance d: rail point, unit tangent in plan, right-hand vector in plan
    const fr = (d) => {
      path.posAtDist(d, _p); path.tangentAtDist(d, _t); const l = Math.hypot(_t.x, _t.z) || 1;
      return { x: _p.x, y: _p.y - EYE, z: _p.z, tx: _t.x / l, tz: _t.z / l, rx: -_t.z / l, rz: _t.x / l };
    };
    const off = (f, r, up = 0) => [f.x + f.rx * r, f.y + up, f.z + f.rz * r];
    const dStreet0 = 24, dJog = S0[1], dBurst = S0[2], dCurve = S0[3], dRamp = S0[4], dHair = S0[5], dWest = S0[6], dTurn = S0[7], dFinal = S0[8];

    // ------------------------------------------------------------ paving under the wheels, rails, wires
    const loopX = (d) => 2.8 * sstep(60, 65, d) * (1 - sstep(83, 88, d));               // the passing loop widens the street to the east
    const deckL = (d) => (d < dBurst ? HW + loopX(d) : d < dRamp ? 3.6 : d < dHair ? 3.5 : d < dWest ? 3.4 : d < dFinal ? 3.6 : 5);   // left = east in the street
    const deckR = (d) => (d < dBurst ? HW : d < dRamp ? 3.45 : d < dHair ? 3.5 : d < dWest ? 3.4 : d < dFinal ? 4 : 5);
    const gnd = makeAcc(6000), thin = makeAcc(4000);
    gnd.set(4, 0.3);
    for (let d = 0; d < L - 0.01; d += 2) {
      const a = fr(d), b = fr(Math.min(L, d + 2)), la = deckL(d), ra = deckR(d), lb = deckL(d + 2), rb = deckR(d + 2);
      const slot = d > dStreet0 && d < dBurst ? 0.55 : 0;                                  // the street floor lies in cobalt shade
      gnd.quad(off(a, -la, 0.02), off(b, -lb, 0.02), off(b, rb, 0.02), off(a, ra, 0.02), [0, 1, 0], [-la, d], [-lb, d + 2], [rb, d + 2], [ra, d], slot);
      if (d % 64 === 0) await ctx.yield();
    }
    await ctx.yield();
    for (const g of [-0.45, 0.45]) {                                                       // rails: deep cobalt lines with a pale groove beside
      const rp = [], gp = [];
      for (let d = 0; d <= L; d += 2) { const f = fr(Math.min(L, d)); rp.push(off(f, g, 0.05)); gp.push(off(f, g + 0.1 * Math.sign(g), 0.04)); }
      thin.set(6, 0.5); for (let i = 0; i < rp.length - 1; i++) { const f = fr(Math.min(L, i * 2)); thin.ribbon([rp[i], rp[i + 1]], 0.035, f.rx, 0, f.rz); }
      await ctx.yield();
      thin.set(6, 0.1); for (let i = 0; i < gp.length - 1; i++) { const f = fr(Math.min(L, i * 2)); thin.ribbon([gp[i], gp[i + 1]], 0.03, f.rx, 0, f.rz); }
      await ctx.yield();
    }
    const WIRE_Y = 5.4, sparkAt = [];
    for (const g of [-0.28, 0.28]) {
      thin.set(6, 0.5);
      for (let d = 0; d < L; d += 4) { const a = fr(d), b = fr(Math.min(L, d + 4)); thin.ribbon([off(a, g, WIRE_Y), off(b, g, WIRE_Y)], 0.011, a.rx, 0, a.rz); }
    }
    await ctx.yield();
    // span wires across the street; in the open, bracket poles. Nothing stands near the glass on the burst: the wire hangs
    // from a bridle off the last two fronts, then from one tall standard out in the garden on a long arm.
    const poles = makeAcc(1500);
    const pole = (f, r, baseY, d) => {
      const b = off(f, r), top = f.y + 6.4, yaw = Math.atan2(f.tx, f.tz), side = Math.sign(r);
      poles.set(6, 0.3); poles.box(b[0], b[2], 0.13, 0.13, baseY, top, yaw, { taper: 0.4 });
      poles.set(6, 0.7); poles.box(b[0], b[2], 0.3, 0.3, baseY, baseY + 0.9, yaw, { taper: 0.25 });
      poles.set(6, 0.1); poles.box(b[0], b[2], 0.26, 0.26, top, top + 0.22, 0.6, { taper: 0.6 });
      thin.set(6, 0.5); thin.ribbon([off(f, r, 6.2), off(f, -0.5 * side, WIRE_Y + 0.05)], 0.02, f.tx, 0, f.tz);
      thin.ribbon([off(f, r, 5.1), off(f, r * 0.45, WIRE_Y + 0.42)], 0.012, f.tx, 0, f.tz);
    };
    for (let d = 30; d < L - 6; d += 12) {
      const f = fr(d);
      thin.set(6, 0.5);
      if (d < dBurst) { thin.ribbon([off(f, -deckL(d), WIRE_Y + 0.9), off(f, 0, WIRE_Y + 0.05), off(f, deckR(d), WIRE_Y + 0.9)], 0.009, f.tx, 0, f.tz); continue; }
      if (d < dRamp || d > dFinal) continue;
      if (d < dHair - 6) {                                                                  // the ramp: no pole by the glass; pull-off wires run to a rosette on the Sea Wall's north pier
        if (d > dRamp + 14) { const wy = f.y + WIRE_Y + 2.6; thin.ribbon([[69.6, wy, 48.16], off(f, 0, WIRE_Y + 0.05)], 0.009, 0, 1, 0); poles.set(6, 0.5); poles.geo(new THREE.SphereGeometry(0.16, 8, 6), M4(69.6, wy, 48.12), 1, 0.5); }
        continue;
      }
      if (d < dWest + 6) {                                                                  // round the Sea Wall: pull-off wires run to deep cobalt rosettes on the wall
        if (d > dHair + 2 && d < dWest - 2) {
          const rx = f.x - 70, rz = f.z - 87, rl = Math.hypot(rx, rz) || 1, wx = 70 + rx / rl * 39.93, wz = 87 + rz / rl * 39.93, wy = f.y + WIRE_Y + 1.7;
          thin.ribbon([[wx, wy, wz], off(f, 0, WIRE_Y + 0.05)], 0.009, f.tx, 0, f.tz);
          poles.set(6, 0.5); poles.geo(new THREE.SphereGeometry(0.16, 8, 6), M4(wx, wy, wz), 1, 0.5);
        }
        continue;
      }
      if (d < dTurn + 4) {                                                                  // west under the terrace wall: pull-offs to brackets on its coping (z = 115)
        const wy = f.y + 4.95; thin.ribbon([[f.x, wy, 115.05], off(f, 0, WIRE_Y + 0.05)], 0.009, 0, 1, 0);
        poles.set(6, 0.5); poles.geo(new THREE.SphereGeometry(0.14, 8, 6), M4(f.x, wy, 115.02), 1, 0.5);
        continue;
      }
      if (Math.abs(d - (dTurn + dFinal) / 2) < 6) pole(f, 5.6, f.y - 0.5, d);              // the last curve: one slender standard behind the outer wall
    }
    // the final straight carries no standards at all: the twin wires run clear to the church front, converging on the door
    {
      const f0 = fr(dBurst - 0.5), f1 = fr(dBurst + 10);
      thin.set(6, 0.5); thin.ribbon([off(f0, -HW + 0.05, 7.4), off(f1, 0, WIRE_Y + 0.05), off(f0, HW - 0.05, 7.4)], 0.01, f0.tx, 0, f0.tz);
      const f = fr(dCurve + 35.2), b = off(f, -7.5), baseY = 46.3, top = f.y + 6.4;
      pole(f, -7.5, baseY, dCurve + 35.2);
      poles.set(2, 0.4); poles.box(b[0], b[2], 0.4, 0.4, baseY + 0.9, baseY + 1.6, 0.6);                 // a tiled band and a finial
      poles.set(6, 0.5); poles.box(b[0], b[2], 0.46, 0.46, baseY + 1.6, baseY + 1.7, 0.6);
      poles.set(6, 0.7); poles.geo(new THREE.SphereGeometry(0.17, 8, 6), M4(b[0], top + 0.36, b[2]), 1, 0.5);
      thin.set(6, 0.5); thin.ribbon([off(f, -7.5, 6.6), off(f, -3.4, WIRE_Y + 0.45)], 0.012, f.tx, 0, f.tz);
    }
    await ctx.yield();

    // ------------------------------------------------------------ house fronts: bordered tile panels with real fittings
    const props = { shutter: [], balcony: [], box: [], lamp: [], cage: [], cloth: [], flag: [], pot: [], bal: [], vine: [] };
    const put = (kind, x, y, z, yaw, sx = 1, sy = 1, sz = 1) => props[kind].push({ m: M4(x, y, z, yaw, sx, sy, sz), seed: rng(), ph: rng(), a: [x, y, z, yaw, sx, sy, sz] });
    const FIELDS = [2, 3, 0, 2, 3], HFIELDS = [2, 3, 2, 3, 2], sunXZ = Math.hypot(SUN.x, SUN.z) || 1, slotDrop = 5.2 * SUN.y / sunXZ;
    // a front from (x0,z0) to (x1,z1), facing the right-hand side of that direction, standing on yb, cornice at yt.
    // o: fit (0 none, 1 painted openings only, 2 with fittings), slot (true in the street), frieze (tile u offset or null), seed
    function front(acc, x0, z0, x1, z1, yb, yt, o = {}) {
      const dx = x1 - x0, dz = z1 - z0, w = Math.hypot(dx, dz), ux = dx / w, uz = dz / w, nx = -uz, nz = ux, yaw = Math.atan2(nx, nz);
      const fit = o.fit ?? 1, seed = o.seed ?? rng(), field = o.pic ?? rng.pick(FIELDS), bw = w < 5 ? 0.42 : 0.56, kb = 1.4 / bw;
      const at = (s, y, out = 0) => [x0 + ux * s + nx * out, y, z0 + uz * s + nz * out], nn = [nx, 0, nz];
      const lit = nx * SUN.x + nz * SUN.z > 0.15;
      const shLo = o.slot ? (lit ? 0.72 : 0.9) : 0, shHi = o.slot ? (lit ? 0 : 0.25) : 0, shY = o.slot ? (lit ? yt - Math.min(slotDrop, yt - yb - 3) : yt - 2) : yb;
      const shAt = (y) => (o.slot ? shLo + (shHi - shLo) * sstep(shY - 1.2, shY + 1.2, y) : 0);
      const yp = yb + 1.05, tu0 = o.tu ?? x0 * 0.7 + z0;
      // dado
      acc.set(6, rng.pick([0.5, 0.5, 0.3]));
      acc.quad(at(0, yb - 3), at(w, yb - 3), at(w, yp), at(0, yp), nn, [tu0, yb - 3], [tu0 + w, yb - 3], [tu0 + w, yp], [tu0, yp], shLo);
      acc.set(6, 0.1); acc.quad(at(0, yp, 0.03), at(w, yp, 0.03), at(w, yp + 0.12, 0.03), at(0, yp + 0.12, 0.03), nn, [0, 0], [w, 0], [w, 0.12], [0, 0.12], shLo);
      const y0 = yp + 0.12, y1 = yt;
      // baroque border, 4 strips; tile u along the strip, v 0 (outer edge) .. 1.4 (picture side)
      acc.set(0, seed, 1);
      const strip = (a, b, c, d, len, sa, sb) => acc.quad(a, b, c, d, nn, [0, 0], [len * kb, 0], [len * kb, 1.4], [0, 1.4], sa, sb, sb, sa);
      strip(at(0, y0), at(w, y0), at(w - bw, y0 + bw), at(bw, y0 + bw), w, shAt(y0), shAt(y0));
      strip(at(w, y1), at(0, y1), at(bw, y1 - bw), at(w - bw, y1 - bw), w, shAt(y1), shAt(y1));
      strip(at(0, y1), at(0, y0), at(bw, y0 + bw), at(bw, y1 - bw), y1 - y0, shAt(y1), shAt(y0));
      strip(at(w, y0), at(w, y1), at(w - bw, y1 - bw), at(w - bw, y0 + bw), y1 - y0, shAt(y0), shAt(y1));
      // the field, in three bands so the slot's shade line can cross it
      acc.set(field, seed);
      const ys = o.slot ? [y0 + bw, Math.max(y0 + bw + 0.2, shY - 1.2), Math.min(y1 - bw - 0.2, shY + 1.2), y1 - bw] : [y0 + bw, y1 - bw];
      for (let i = 0; i < ys.length - 1; i++) if (ys[i + 1] > ys[i] + 0.01)
        acc.quad(at(bw, ys[i]), at(w - bw, ys[i]), at(w - bw, ys[i + 1]), at(bw, ys[i + 1]), nn, [tu0 + bw, ys[i]], [tu0 + w - bw, ys[i]], [tu0 + w - bw, ys[i + 1]], [tu0 + bw, ys[i + 1]], shAt(ys[i]), shAt(ys[i]), shAt(ys[i + 1]), shAt(ys[i + 1]));
      // cornice: deep line, projecting pale eave with a shaded soffit
      acc.set(6, 0.5); acc.quad(at(0, y1 - 0.02, 0.02), at(w, y1 - 0.02, 0.02), at(w, y1 + 0.16, 0.02), at(0, y1 + 0.16, 0.02), nn, [0, 0], [w, 0], [w, 0.18], [0, 0.18], shHi);
      acc.set(6, 0.1);
      acc.quad(at(0, y1 + 0.16, 0.4), at(w, y1 + 0.16, 0.4), at(w, y1 + 0.5, 0.4), at(0, y1 + 0.5, 0.4), nn, [tu0, 0], [tu0 + w, 0], [tu0 + w, 0.34], [tu0, 0.34], shHi * 0.5);
      acc.quad(at(0, y1 + 0.16, 0), at(w, y1 + 0.16, 0), at(w, y1 + 0.16, 0.4), at(0, y1 + 0.16, 0.4), [0, -1, 0], [0, 0], [w, 0], [w, 0.4], [0, 0.4], 0.85);
      acc.set(5, seed); acc.quad(at(0, y1 + 0.5, 0.4), at(w, y1 + 0.5, 0.4), at(w, y1 + 0.5, -0.3), at(0, y1 + 0.5, -0.3), [0, 1, 0], [tu0, 0], [tu0 + w, 0], [tu0 + w, 0.7], [tu0, 0.7]);
      if (o.frieze != null) {                                                              // the string course the cat walks
        acc.set(14, seed); const fy = yb + 3.5;
        acc.quad(at(0, fy, 0.03), at(w, fy, 0.03), at(w, fy + 0.84, 0.03), at(0, fy + 0.84, 0.03), nn, [o.frieze, 0], [o.frieze + w, 0], [o.frieze + w, 0.84], [o.frieze, 0.84], shAt(fy));
      }
      if (!fit) return;
      // openings
      const inner = w - 2 * bw, nCols = Math.max(1, Math.floor(inner / 2.05)), sp = inner / nCols;
      const nFl = Math.max(0, Math.floor((y1 - bw - 0.5 - (yb + 4.5)) / 3.05)), doorCol = rng.int(0, nCols - 1), fl0 = yb + 4.55;
      const hasBalc = rng.chance(0.75), balcFl = rng.chance(0.7) ? 0 : 1;
      for (let c = 0; c < nCols; c++) {
        const s = bw + (c + 0.5) * sp;
        if (c === doorCol && o.door !== false) {
          acc.set(12, rng()); acc.quad(at(s - 0.75, yb + 0.05, 0.04), at(s + 0.75, yb + 0.05, 0.04), at(s + 0.75, yb + 2.85, 0.04), at(s - 0.75, yb + 2.85, 0.04), nn, [0, 0], [1.5, 0], [1.5, 2.8], [0, 2.8], shLo);
          if (fit > 1 && rng.chance(0.5)) put('pot', ...at(s + rng.pick([-1.05, 1.05]), yb + 0.02, 0.32), rng() * 6, rng.range(0.55, 0.8));
        } else if (y1 - yb > 6 && rng.chance(0.8)) {
          acc.set(11, rng()); const wy = yb + 1.45;
          acc.quad(at(s - 0.5, wy, 0.04), at(s + 0.5, wy, 0.04), at(s + 0.5, wy + 1.55, 0.04), at(s - 0.5, wy + 1.55, 0.04), nn, [0, 0], [1.1, 0], [1.1, 1.8], [0, 1.8], shLo);
          if (fit > 1) { put('shutter', ...at(s - 0.5, wy, 0.05), yaw + 0.05, -1, 1.55 / 1.8, 1); put('shutter', ...at(s + 0.5, wy, 0.05), yaw - 0.05, 1, 1.55 / 1.8, 1); if (rng.chance(0.55 * dens)) put('box', ...at(s, wy - 0.02, 0.06), yaw, 1, 1, 1); }
        }
        for (let f = 0; f < nFl; f++) {
          if (rng.chance(0.06)) continue;
          const by = fl0 + f * 3.05, balc = hasBalc && f === balcFl && w > 5, wy = balc ? by + 0.08 : by + 0.85, wh = balc ? 2.45 : 1.75;
          acc.set(11, rng());
          acc.quad(at(s - 0.55, wy, 0.04), at(s + 0.55, wy, 0.04), at(s + 0.55, wy + wh, 0.04), at(s - 0.55, wy + wh, 0.04), nn, [0, 0], [1.1, 0], [1.1, 1.8], [0, 1.8], shAt(wy + 1));
          if (fit < 2) continue;
          const open = rng.chance(0.3) ? rng.range(0.25, 1.3) : 0.04;
          put('shutter', ...at(s - 0.55, wy, 0.05), yaw + open, -1, wh / 1.8, 1); put('shutter', ...at(s + 0.55, wy, 0.05), yaw - open, 1, wh / 1.8, 1);
          if (balc) { put('balcony', ...at(s, by, 0.02), yaw, Math.min(1, (sp - 0.12) / 1.7), 1, 1); if (rng.chance(0.5 * dens)) put('box', ...at(s + rng.range(-0.2, 0.2), by + 0.98, 0.52), yaw, 0.8, 1, 1); }
          else if (rng.chance(0.7 * dens)) put('box', ...at(s, wy - 0.02, 0.06), yaw, 1, 1, 1);
          if (rng.chance(0.14)) put('cage', ...at(s + 0.9, wy + 1.75, 0.04), yaw);
          else if (!balc && rng.chance(0.16 * dens)) put('cloth', ...at(s, wy - 0.25, 0.3), yaw, rng.range(0.7, 1.1), rng.range(0.6, 1), 1);
        }
      }
      if (fit > 1 && (o.lamp ?? rng.chance(0.6))) put('lamp', ...at(rng.chance(0.5) ? 0.25 : w - 0.25, yb + 4.15, 0.02), yaw);
    }
    // a row of fronts along a polyline that faces its right-hand side, with a roof slab behind
    function row(acc, x0, z0, x1, z1, ybFn, o = {}) {
      const len = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / len, uz = (z1 - z0) / len; let s = 0;
      while (s < len - 0.5) {
        let w = rng.range(o.wMin ?? 6, o.wMax ?? 9); if (len - s - w < 4.5) w = len - s;
        const ax = x0 + ux * s, az = z0 + uz * s, bx = x0 + ux * (s + w), bz = z0 + uz * (s + w), yb = ybFn((ax + bx) / 2, (az + bz) / 2), yt = yb + rng.range(o.hMin ?? 9, o.hMax ?? 14);
        front(acc, ax, az, bx, bz, yb, yt, o);
        roofBehind(acc, ax, az, bx, bz, yt + 0.5, o.depth ?? 9);
        s += w;
      }
    }
    function roofBehind(acc, ax, az, bx, bz, y, depth) {
      const w = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / w, uz = (bz - az) / w, nx = -uz, nz = ux, rise = depth * 0.22, sd = rng();
      const A = [ax + nx * 0.4, y, az + nz * 0.4], B = [bx + nx * 0.4, y, bz + nz * 0.4], C = [bx - nx * depth * 0.5, y + rise, bz - nz * depth * 0.5], D = [ax - nx * depth * 0.5, y + rise, az - nz * depth * 0.5];
      const E = [bx - nx * depth, y, bz - nz * depth], G = [ax - nx * depth, y, az - nz * depth];
      acc.set(5, sd); acc.quad(A, B, C, D, [nx * 0.3, 0.95, nz * 0.3], [0, 0], [w, 0], [w, depth * 0.55], [0, depth * 0.55]);
      acc.quad(D, C, E, G, [-nx * 0.3, 0.95, -nz * 0.3], [0, 0], [w, 0], [w, depth * 0.55], [0, depth * 0.55]);
      acc.set(rng.pick(FIELDS), sd);
      acc.tri(B, E, C, [ux, 0, uz], [0, 0], [depth, 0], [depth / 2, rise]); acc.tri(G, A, D, [-ux, 0, -uz], [0, 0], [depth, 0], [depth / 2, rise]);
      acc.wall(bx - ux * 0.06, bz - uz * 0.06, bx - ux * 0.06 - nx * depth, bz - uz * 0.06 - nz * depth, y - 16, y, { tu: sd * 30 }); acc.wall(ax + ux * 0.06 - nx * depth, az + uz * 0.06 - nz * depth, ax + ux * 0.06, az + uz * 0.06, y - 16, y, { tu: sd * 50 });
      acc.wall(bx - nx * depth, bz - nz * depth, ax - nx * depth, az - nz * depth, y - 16, y, { tu: sd * 70 });
      const nCh = rng.int(1, 2);
      for (let i = 0; i < nCh; i++) {                                                       // chimneys with pots
        const t = rng.range(0.15, 0.85), k = rng.range(0.25, 0.75), cx = ax + ux * w * t - nx * depth * k, cz = az + uz * w * t - nz * depth * k, cy = y + rise * (1 - Math.abs(k - 0.5) * 2);
        acc.set(rng.pick([0, 2, 3]), rng()); acc.box(cx, cz, 0.7, 0.7, cy - 0.5, cy + 1.5, Math.atan2(ux, uz));
        acc.set(6, 0.5); acc.box(cx, cz, 0.9, 0.9, cy + 1.5, cy + 1.66, Math.atan2(ux, uz));
        acc.set(6, 0.3); acc.box(cx, cz, 0.3, 0.3, cy + 1.66, cy + 2.2, 0.4, { taper: 0.3 });
        chimneys.push([cx, cy + 2.2, cz]);
      }
    }
    const chimneys = [];

    // ------------------------------------------------------------ the largo and the street
    const north = makeAcc(30000);
    north.set(4, 0.3); north.flat(XS - 17, -136, XS + 17, -92, 57.99);
    north.flat(XS - 40, -230, XS + 40, -136, 57.99);                                         // paving runs on behind the entry (seen through the portal before us)
    const largoO = { fit: 2, hMin: 12.5, hMax: 15.5, wMin: 6.5, wMax: 7.6 };
    row(north, XS - HW, -92, XS - 17, -92, () => 58, largoO); row(north, XS + 17, -92, XS + HW, -92, () => 58, largoO);
    await ctx.yield();
    row(north, XS + 17, -136, XS + 17, -92, () => 58, largoO);
    await ctx.yield();
    row(north, XS - 17, -92, XS - 17, -136, () => 58, largoO);
    await ctx.yield();
    const largoB = makeAcc(6000);                                                              // the row behind us: left out of the portal picture, where it would stand in the way
    row(largoB, XS - 17, -136, XS + 17, -136, () => 58, { fit: 1, hMin: 12, hMax: 15 });
    await ctx.yield();
    row(north, XS + 17, -200, XS + 17, -136, () => 58, { fit: 1, hMin: 12, hMax: 15 });
    await ctx.yield();
    row(north, XS - 17, -136, XS - 17, -200, () => 58, { fit: 1, hMin: 12, hMax: 15 });
    await ctx.yield();
    const largoBack = await add(largoB, 'largo-back');
    const clothLines = [];
    for (const side of [-1, 1]) {                                                            // -1 = left (east) wall, +1 = right (west) wall
      let d = dStreet0;
      while (d < dBurst - 0.3) {
        let w = d > dJog - 6 ? rng.range(4.4, 5.4) : rng.range(6, 9); if (dBurst - d - w < 4) w = dBurst - d;
        const a = fr(d), b = fr(d + w), oa = side < 0 ? -deckL(d) : deckR(d), ob = side < 0 ? -deckL(d + w) : deckR(d + w);
        const pa = off(a, oa), pb = off(b, ob), yb = Math.min(a.y, b.y), yt = yb + rng.range(11.5, 15.5);
        const o = { fit: 2, slot: true, frieze: side < 0 ? d : null, tu: d };
        if (side < 0) { front(north, pa[0], pa[2], pb[0], pb[2], yb, yt, o); roofBehind(north, pa[0], pa[2], pb[0], pb[2], yt + 0.5, 8); }
        else { front(north, pb[0], pb[2], pa[0], pa[2], yb, yt, o); roofBehind(north, pb[0], pb[2], pa[0], pa[2], yt + 0.5, 8); }
        d += w;
        await ctx.yield();
      }
    }
    for (let d = dStreet0 + 5; d < dBurst - 5; d += rng.range(6.5, 10)) {                     // washing (or festival garlands) across the slot
      const f = fr(d), l = -deckL(d) + 0.1, r = deckR(d) - 0.1, y = rng.range(6.6, 10.5), yaw = Math.atan2(-f.rz, f.rx), sag = rng.range(0.25, 0.5);
      const line = []; for (let i = 0; i <= 8; i++) { const t = i / 8, p = off(f, l + (r - l) * t, y - sag * 4 * t * (1 - t)); line.push(p); }
      thin.set(6, 0.3); thin.ribbon(line, 0.008, f.tx, 0, f.tz);
      const fest = festival && rng.chance(0.7), n = fest ? 11 : rng.int(3, 5);
      for (let i = 0; i < n; i++) {
        const t = (i + 0.5 + rng.range(-0.2, 0.2)) / n, p = off(f, l + (r - l) * t, y - sag * 4 * t * (1 - t));
        if (fest) put('flag', p[0], p[1], p[2], yaw, 0.36, 0.4, 1); else put('cloth', p[0], p[1], p[2], yaw, rng.range(0.55, 1.05), rng.range(0.6, 1.2), 1);
      }
      clothLines.push(d);
    }
    await ctx.yield();
    {                                                                                         // things left in the street: crates, a leaning bicycle
      for (let i = 0; i < 9; i++) {
        const d = rng.range(dStreet0 + 4, dBurst - 6), f = fr(d), side = rng.chance(0.5) ? -1 : 1, r = side < 0 ? -deckL(d) + 0.42 : deckR(d) - 0.42, p = off(f, r);
        north.set(rng.pick([3, 2, 6]), rng.range(0.05, 0.38)); north.box(p[0], p[2], 0.56, 0.5, p[1], p[1] + 0.4, rng() * 3, { sh: 0.5 });
        if (rng.chance(0.5)) { north.set(3, rng()); north.box(p[0] + f.tx * 0.5, p[2] + f.tz * 0.5, 0.46, 0.42, p[1], p[1] + 0.34, rng() * 3, { sh: 0.5 }); }
      }
      const d = rng.range(40, 56), f = fr(d), p = off(f, deckR(d) - 0.2), yaw = Math.atan2(f.tx, f.tz);
      const lean = new THREE.Matrix4().makeTranslation(p[0], p[1], p[2]).multiply(new THREE.Matrix4().makeRotationY(yaw)).multiply(new THREE.Matrix4().makeRotationZ(-0.2));
      const part = (g, x, y, z) => north.geo(g, lean.clone().multiply(new THREE.Matrix4().makeTranslation(x, y, z)), 2, 0.3, 0.4);
      north.set(6, 0.5);
      part(new THREE.TorusGeometry(0.33, 0.025, 5, 16).rotateY(Math.PI / 2), 0, 0.36, -0.52); part(new THREE.TorusGeometry(0.33, 0.025, 5, 16).rotateY(Math.PI / 2), 0, 0.36, 0.52);
      north.set(6, 0.3);
      part(new THREE.BoxGeometry(0.035, 0.035, 0.62).rotateX(-0.5), 0, 0.62, -0.2); part(new THREE.BoxGeometry(0.035, 0.035, 0.66), 0, 0.8, -0.02); part(new THREE.BoxGeometry(0.035, 0.6, 0.035).rotateX(0.3), 0, 0.62, 0.38);
      part(new THREE.BoxGeometry(0.035, 0.55, 0.035).rotateX(-0.25), 0, 0.6, -0.42); part(new THREE.BoxGeometry(0.42, 0.03, 0.03), 0, 0.96, 0.46); part(new THREE.BoxGeometry(0.1, 0.04, 0.22), 0, 0.9, -0.36);
    }
    await ctx.yield();
    await add(north, 'largo-and-street');
    await ctx.yield();

    // ------------------------------------------------------------ the terrace (belvedere) and the ramp
    // The rail rides a tiled causeway that dives out of the street; the terraces lie well below it on both sides,
    // so from the cab the paving falls away and the city, the church on the axis and the river fill the frame.
    const terr = makeAcc(24000), LOWT = 46.3, SUNK = 47, UPT = 52.5, terY = (z) => railAt(S0[2] + 1 + z)[1];
    const eastY = (z) => (z < 3 ? UPT : z < 10.5 ? UPT - (Math.floor((z - 3) / 0.5) + 1) * ((UPT - LOWT) / 15) : LOWT);
    const arcPt = (ph, r = 33.3) => [30 - r * Math.sin(ph), 25 + r * Math.cos(ph)];
    const stairs = (x0, x1, z0, n, yTop, yBot) => {
      const h = (yTop - yBot) / n;
      for (let k = 0; k < n; k++) { const y = yTop - (k + 1) * h, z = z0 + k * 0.5; terr.set(4, 0.3); terr.flat(x0, z, x1, z + 0.5, y); terr.set(6, k % 2 ? 0.1 : 0.3); terr.wall(x0, z, x1, z, y, y + h); }
    };
    terr.set(4, 0.3); terr.flat(-36, 0, 77, 3, UPT);                                         // the landing below the last fronts
    stairs(3.4, 77, 3, 15, UPT, LOWT);                                                       // east: broad steps down to the garden inside the curve
    terr.set(4, 0.3); terr.flat(3.4, 10.5, 77, 25, LOWT); terr.flat(30, 25, 77, 51.5, LOWT);
    for (let i = 0; i < 16; i++) {
      const a = arcPt(Math.PI / 2 * i / 16, 26.6), b = arcPt(Math.PI / 2 * (i + 1) / 16, 26.6);
      terr.tri([30, LOWT, 25], [a[0], LOWT, a[1]], [b[0], LOWT, b[1]], [0, 1, 0], [30, 25], a, b);
    }
    const ROSE = [18, 34];                                                                   // a compass rose inlaid in the garden floor
    terr.set(19, 0); terr.quad([ROSE[0] - 7.4, LOWT + 0.015, ROSE[1] - 7.4], [ROSE[0] + 7.4, LOWT + 0.015, ROSE[1] - 7.4], [ROSE[0] + 7.4, LOWT + 0.015, ROSE[1] + 7.4], [ROSE[0] - 7.4, LOWT + 0.015, ROSE[1] + 7.4], [0, 1, 0], [-7.4, -7.4], [7.4, -7.4], [7.4, 7.4], [-7.4, 7.4]);
    stairs(-36, -3.3, 3, 13, UPT, SUNK);                                                     // west: steps to a small sunk terrace with its rail at z 17
    terr.set(4, 0.3); terr.flat(-36, 9.5, -3.3, 17.2, SUNK);
    row(terr, -36, 0, -HW, 0, () => 53, { fit: 2, hMin: 11, hMax: 14.5 });
    await ctx.yield();
    row(terr, HW, 0, 78, 0, () => 53, { fit: 2, hMin: 10, hMax: 14.5 });
    await ctx.yield();
    row(terr, 77, 0.2, 77, 43, (x, z) => eastY(z), { fit: 1, hMin: 8, hMax: 10 }); row(terr, -36, 17.2, -36, 0, (x, z) => (z > 8 ? SUNK : 50), { fit: 1, hMin: 10, hMax: 13 });
    for (let d = dBurst; d < dRamp - 0.5; d += 2) {                                          // the causeway's left flank and kerb
      const a = fr(d), b = fr(Math.min(dRamp, d + 2)), pa = off(a, -3.6), pb = off(b, -3.6), ia = off(a, -3.3), ib = off(b, -3.3);
      const fy = Math.min(eastY(pa[2]), eastY(pb[2])) - 0.3, k = Math.floor(d / 2);
      if (a.y + 0.37 > fy + 0.35) {
        terr.set(k % 6 < 4 ? 3 : 2, 0.37); terr.wall(pb[0], pb[2], pa[0], pa[2], fy, b.y - 0.3, { b1: fy, t1: a.y - 0.3, tu: d, mir: true });
        terr.set(6, 0.5); terr.wall(pb[0], pb[2], pa[0], pa[2], b.y - 0.3, b.y + 0.37, { b1: a.y - 0.3, t1: a.y + 0.37 });
      }
      terr.set(6, 0.1); terr.quad(off(a, -3.62, 0.37), off(b, -3.62, 0.37), off(b, -3.3, 0.37), off(a, -3.3, 0.37), [0, 1, 0], [0, d], [0, d + 2], [0.3, d + 2], [0.3, d]);
      terr.set(6, 0.3); terr.wall(ia[0], ia[2], ib[0], ib[2], a.y, a.y + 0.37, { b1: b.y, t1: b.y + 0.37, tu: d });
      if (k % 5 === 2) put('pot', pa[0] + a.rx * 0.12, a.y + 0.37, pa[2] + a.rz * 0.12, rng() * 6, 0.46);
    }
    // balustraded edges: retaining wall, plinth, balusters, rail, a pier with a pot every so often
    function edgeRun(edge, lowUntil = 0) {
      for (let i = 0; i < edge.length - 1; i++) {
        const a = edge[i], b = edge[i + 1], l = Math.hypot(b[0] - a[0], b[2] - a[2]), ux = (b[0] - a[0]) / l, uz = (b[2] - a[2]) / l, yaw = Math.atan2(ux, uz);
        const lowA = hillY(a[0], a[2]) - 6, mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
        terr.set(i % 9 < 7 ? 3 : 2, 0.37); terr.wall(a[0], a[2], b[0], b[2], Math.min(lowA, a[1] - 3) - 5, a[1], { t1: b[1], tu: i * 2.1, tv: 0 });   // outer face (seen from below)
        terr.set(6, 0.1); terr.box(mid[0], mid[2], 0.34, l + 0.02, mid[1], mid[1] + 0.16, yaw); terr.set(6, 0.3); terr.box(mid[0], mid[2], 0.3, l + 0.02, mid[1] + 0.86, mid[1] + 0.98, yaw);
        const nb = Math.max(1, Math.round(l / 0.42));
        for (let k = 0; k < nb; k++) { const t = (k + 0.5) / nb; props.bal.push({ m: M4(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t + 0.16, a[2] + (b[2] - a[2]) * t, 0), seed: 0, ph: 0 }); }
        if (i % 9 === 8 && i < lowUntil) { terr.set(2, 0.4); terr.box(a[0], a[2], 0.42, 0.42, a[1], a[1] + 0.98, yaw); }   // on the burst nothing stands above the rail
        else if (i % 9 === 8) { terr.set(2, 0.4); terr.box(a[0], a[2], 0.5, 0.5, a[1], a[1] + 1.15, yaw); terr.set(6, 0.5); terr.box(a[0], a[2], 0.62, 0.62, a[1] + 1.15, a[1] + 1.27, yaw); if (i % 18 === 8) put('pot', a[0], a[1] + 1.27, a[2], 0, 0.5); }
      }
    }
    const edge = [];
    for (let d = dBurst + 4.2; d < dWest - 1; d += 2) { const f = fr(d), p = off(f, d < dRamp ? 3.3 : deckR(d) - 0.05); edge.push([p[0], p[1], p[2]]); }
    await ctx.yield();
    edgeRun(edge, Math.ceil((dRamp - dBurst - 4.2) / 2));
    await ctx.yield();
    { const e2 = []; for (let x = -36; x < -2.9; x += 2.06) e2.push([x, SUNK, 17.1]); edgeRun(e2); }
    // the ramp's left side: the edge of the upper terrace, a tiled bank with a parapet and pots
    for (let x = 33; x < 77; x += 6) {
      const x1 = Math.min(77, x + 6), fy = fr(dRamp + Math.max(0, x1 - 30)).y;
      terr.set(x % 12 < 6 ? 3 : 2, 0.3); terr.wall(x, 51.5, x1, 51.5, Math.min(fy - 1, 36), LOWT, { tu: x });
      terr.set(6, 0.1); terr.box((x + x1) / 2, 51.3, x1 - x, 0.5, LOWT, LOWT + 0.5, 0); terr.set(6, 0.5); terr.box((x + x1) / 2, 51.3, x1 - x + 0.02, 0.6, LOWT + 0.5, LOWT + 0.62, 0);
      if (x < 70) put('pot', x + 3, LOWT + 0.62, 51.3, rng() * 6, rng.range(0.5, 0.7));
    }
    {                                                                                         // a fountain basin inside the curve
      const fxp = 16, fzp = 21;
      terr.set(2, 0.5); terr.geo(lathe([[2.7, 0], [2.8, 0.5], [2.6, 0.62], [2.4, 0.62], [2.4, 0.3]], 16), M4(fxp, LOWT, fzp), 16, 1);
      terr.set(13, 0.5); terr.geo(new THREE.CircleGeometry(2.42, 16).rotateX(-Math.PI / 2), M4(fxp, LOWT + 0.46, fzp), 5, 5);
      terr.set(3, 0.6); terr.geo(lathe([[0.5, 0], [0.3, 0.3], [0.22, 1.2], [0.9, 1.5], [1.0, 1.62], [0.2, 1.7], [0.14, 2.3], [0, 2.5]], 10), M4(fxp, LOWT + 0.3, fzp), 3, 2.5);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the hairpin: viaduct edge, the court under the Sea Wall
    const low = makeAcc(20000);
    for (let d = dHair - 4; d < dTurn; d += 2) {                                             // left-hand curb and the drop below it
      const a = fr(d), b = fr(d + 2), pa = off(a, -3.25), pb = off(b, -3.25), qa = off(a, -3.55), qb = off(b, -3.55);
      const floorY = d < dWest + 2 ? HERO_Y : Math.min(hillY(qa[0], qa[2]) - 4, a.y - 3);
      low.set(6, 0.3); low.wall(pa[0], pa[2], pb[0], pb[2], pa[1], pa[1] + 0.42, { b1: pb[1], t1: pb[1] + 0.42, tu: d });
      low.set(6, 0.1); low.quad([pa[0], pa[1] + 0.42, pa[2]], [pb[0], pb[1] + 0.42, pb[2]], [qb[0], qb[1] + 0.42, qb[2]], [qa[0], qa[1] + 0.42, qa[2]], [0, 1, 0], [0, d], [0, d + 2], [0.3, d + 2], [0.3, d]);
      low.set(d % 12 < 2 ? 6 : 2, 0.5); low.wall(qb[0], qb[2], qa[0], qa[2], floorY, qb[1] + 0.42, { b1: floorY, t1: qa[1] + 0.42, tu: -d, tv: 0 });
    }
    low.set(4, 0.3);
    for (let i = 0; i < 28; i++) {                                                            // the wet court at the foot of the wall
      const a0 = -1.72 + 3.44 * i / 28, a1 = -1.72 + 3.44 * (i + 1) / 28, P = (a, r) => [ARC_C[0] + r * Math.cos(a), HERO_Y + 0.02, ARC_C[1] + r * Math.sin(a)];
      low.quad(P(a0, 35.4), P(a1, 35.4), P(a1, 39.6), P(a0, 39.6), [0, 1, 0], [a0 * 37, 0], [a1 * 37, 0], [a1 * 37, 4.2], [a0 * 37, 4.2], 0.3);
    }
    // ------------------------------------------------------------ west under the terrace wall, the last curve, the garden walls
    const WZ = 115;
    for (let x = 22; x < 76; x += 4) {
      const ra = fr(dWest + Math.max(-4, 70 - x)).y, rb = fr(dWest + Math.max(-4, 70 - x - 4)).y, u0 = 70 - x, w = (y0a, y1a, y0b, y1b, o) => low.wall(x, WZ, x + 4, WZ, y0a, y1a, Object.assign({ b1: y0b, t1: y1b, tu: u0, mir: true }, o));
      low.set(6, 0.5); w(ra - 4, ra + 0.6, rb - 4, rb + 0.6, {});
      low.set(0, 0.3, 1); low.quad([x, ra + 0.6, WZ], [x + 4, rb + 0.6, WZ], [x + 4, rb + 1.16, WZ], [x, ra + 1.16, WZ], [0, 0, 1], [u0 * 2.5, 0], [(u0 - 4) * 2.5, 0], [(u0 - 4) * 2.5, 1.4], [u0 * 2.5, 1.4]);
      low.set(15, 0.3); w(ra + 1.16, ra + 3.7, rb + 1.16, rb + 3.7, {});
      low.set(14, 0.3); low.quad([x, ra + 3.7, WZ], [x + 4, rb + 3.7, WZ], [x + 4, rb + 4.54, WZ], [x, ra + 4.54, WZ], [0, 0, 1], [500 + u0, 0], [500 + u0 - 4, 0], [500 + u0 - 4, 0.84], [500 + u0, 0.84]);
      low.set(6, 0.1); low.box(x + 2, WZ - 0.25, 4.02, 0.8, (ra + rb) / 2 + 4.56, (ra + rb) / 2 + 4.8, 0, { bottom: true });
      if (x % 12 === 2) put('lamp', x + 2, (ra + rb) / 2 + 5.3, WZ, 0);
    }
    for (let d = dTurn - 6; d < L - 17; d += 3) {                                              // outer wall of the curve, then garden walls 5 m off
      const a = fr(d), b = fr(d + 3), fin = d >= dFinal - 1, rr = fin ? 5 : deckR(d), pa = off(a, rr), pb = off(b, rr), h = fin ? 2.25 : 2.6, k = Math.round(d / 3);
      if (d > dTurn + 6 || true) {
        low.set(6, 0.5); low.wall(pb[0], pb[2], pa[0], pa[2], pb[1] - 3, pb[1] + 0.5, { b1: pa[1] - 3, t1: pa[1] + 0.5 });
        low.set(fin ? 15 : 3, 0.4); low.wall(pb[0], pb[2], pa[0], pa[2], pb[1] + 0.5, pb[1] + h, { b1: pa[1] + 0.5, t1: pa[1] + h, tu: 200 + (pb[2] - 147), mir: true });
        low.set(6, k % 2 ? 0.1 : 0.3); low.box((pa[0] + pb[0]) / 2 + a.rx * 0.15, (pa[2] + pb[2]) / 2 + a.rz * 0.15, 0.5, 3.04, (pa[1] + pb[1]) / 2 + h - 0.1, (pa[1] + pb[1]) / 2 + h + 0.14, Math.atan2(a.tx, a.tz), { bottom: true });
      }
      if (fin) {                                                                              // left-hand garden wall, panelled, with piers and pots
        const la = off(a, -5), lb = off(b, -5);
        low.set(6, 0.5); low.wall(la[0], la[2], lb[0], lb[2], la[1] - 3, la[1] + 0.5, { b1: lb[1] - 3, t1: lb[1] + 0.5 });
        low.set(k % 2 ? 2 : 3, 0.4); low.wall(la[0], la[2], lb[0], lb[2], la[1] + 0.5, la[1] + h, { b1: lb[1] + 0.5, t1: lb[1] + h, tu: d });
        low.set(6, k % 2 ? 0.1 : 0.3); low.box((la[0] + lb[0]) / 2 - a.rx * 0.15, (la[2] + lb[2]) / 2 - a.rz * 0.15, 0.5, 3.04, (la[1] + lb[1]) / 2 + h - 0.1, (la[1] + lb[1]) / 2 + h + 0.14, Math.atan2(a.tx, a.tz), { bottom: true });
        if (k % 3 === 0) for (const sg of [-1, 1]) { const q = off(a, sg * 4.8); low.set(2, 0.6); low.box(q[0], q[2], 0.62, 0.62, q[1] - 1, q[1] + h + 0.3, 0); low.set(6, 0.5); low.box(q[0], q[2], 0.76, 0.76, q[1] + h + 0.3, q[1] + h + 0.42, 0); put('pot', q[0], q[1] + h + 0.42, q[2], rng() * 6, rng.range(0.5, 0.68)); }
      }
    }
    await add(low, 'hairpin-and-lower-walls');
    await ctx.yield();

    // ------------------------------------------------------------ the church: tiled front, twin towers, the door the portal fills
    const church = makeAcc(8000), FZ = 223.2, GY = 19, DX = 2, CTOP = 41;
    church.set(4, 0.3); church.flat(-16, 204, 20, FZ + 0.3, GY + (FZ - 204) * 0.12 - 0.02, { y1: GY - 0.05 });
    church.set(15, 0.3);
    const CSH = { sh0: 0.96, sh1: 0.84 };                                                       // the front faces north: it stands in cobalt shade and the gold door burns in it
    church.wall(19.5, FZ, DX + 5, FZ, GY - 3, CTOP, { tu: 419.5, mir: true, ...CSH }); church.wall(DX - 5, FZ, -15.5, FZ, GY - 3, CTOP, { tu: 397, mir: true, ...CSH });
    church.wall(DX + 5, FZ, DX - 5, FZ, 29.2, CTOP, { tu: 407, mir: true, sh0: 0.9, sh1: 0.84 });
    for (let i = 0; i < 12; i++) {                                                            // the arch: wall between the half circle and the lintel line
      const a0 = Math.PI * i / 12, a1 = Math.PI * (i + 1) / 12, P = (a) => [DX + 5 * Math.cos(a), 23.6 + 5 * Math.sin(a), FZ], T = (p) => [400 + p[0], p[1]];
      const pa = P(a0), pb = P(a1), qa = [pa[0], 29.2, FZ], qb = [pb[0], 29.2, FZ];
      church.quad(pa, pb, qb, qa, [0, 0, -1], T(pa), T(pb), T(qb), T(qa), 0.92);
      church.set(6, 0.5); church.quad(P(a0), P(a1), [P(a1)[0], P(a1)[1], FZ + 1.2], [P(a0)[0], P(a0)[1], FZ + 1.2], [-Math.cos((a0 + a1) / 2), -Math.sin((a0 + a1) / 2), 0], [0, 0], [1.3, 0], [1.3, 1.2], [0, 1.2], 0.8); church.set(15, 0.3);
    }
    church.set(6, 0.5); church.wall(DX + 5, FZ, DX + 5, FZ + 1.2, GY - 1, 23.6, { sh0: 0.8 }); church.wall(DX - 5, FZ + 1.2, DX - 5, FZ, GY - 1, 23.6, { sh0: 0.8 });
    church.set(0, 0.2, 1);                                                                    // the great border round the door
    { const z = FZ - 0.04, nn = [0, 0, -1], S = (a, b, c, d, len) => church.quad(a, b, c, d, nn, [0, 0], [len, 0], [len, 1.4], [0, 1.4]);
      S([DX + 6.6, GY, z], [DX + 6.6, 30.8, z], [DX + 5.2, 29.4, z], [DX + 5.2, GY, z], 11.8); S([DX - 6.6, 30.8, z], [DX - 6.6, GY, z], [DX - 5.2, GY, z], [DX - 5.2, 29.4, z], 11.8);
      S([DX + 6.6, 30.8, z], [DX - 6.6, 30.8, z], [DX - 5.2, 29.4, z], [DX + 5.2, 29.4, z], 13.2);
      if (!rare) { church.set(10, 0.4, 0); } else church.set(15, 0.3, 0);
      if (!rare) church.quad([DX + 4.6, 31.4, z], [DX - 4.6, 31.4, z], [DX - 4.6, 38, z], [DX + 4.6, 38, z], nn, [-4.6, 0], [4.6, 0], [4.6, 6.6], [-4.6, 6.6]); }
    for (let i = 0; i < 10; i++) {                                                            // baroque gable between the towers
      const x0 = -8 + 2 * i, x1 = x0 + 2, hg = (x) => 7.5 * Math.pow(Math.max(0, 1 - Math.abs(x - DX) / 10.5), 0.6) + 0.8 * Math.cos((x - DX) * 0.9);
      church.set(2, 0.3); church.quad([x1, CTOP, FZ], [x0, CTOP, FZ], [x0, CTOP + hg(x0), FZ], [x1, CTOP + hg(x1), FZ], [0, 0, -1], [x1, 0], [x0, 0], [x0, hg(x0)], [x1, hg(x1)]);
      church.set(6, 0.5); church.quad([x1, CTOP + hg(x1), FZ - 0.3], [x0, CTOP + hg(x0), FZ - 0.3], [x0, CTOP + hg(x0), FZ + 0.5], [x1, CTOP + hg(x1), FZ + 0.5], [0, 1, 0], [0, 0], [2, 0], [2, 0.8], [0, 0.8]);
    }
    church.set(6, 0.5); church.box(DX, FZ - 0.25, 35, 0.9, CTOP - 0.3, CTOP + 0.3, 0, { bottom: true });
    {                                                                                         // a gilded archivolt and jambs round the door, tiled in tram yellow
      const z = FZ - 0.07, nn = [0, 0, -1], R0 = 4.98, R1 = 5.6, P = (a, r) => [DX + r * Math.cos(a), 23.6 + r * Math.sin(a), z];
      church.set(7, 0.3);
      for (let i = 0; i < 16; i++) { const a0 = Math.PI * i / 16, a1 = Math.PI * (i + 1) / 16; church.quad(P(a0, R0), P(a1, R0), P(a1, R1), P(a0, R1), nn, [a0 * 5.3, 0], [a1 * 5.3, 0], [a1 * 5.3, 0.6], [a0 * 5.3, 0.6]); }
      church.set(7, 0.7);
      for (const sg of [-1, 1]) church.quad([DX + sg * R0, GY - 0.2, z], [DX + sg * R1, GY - 0.2, z], [DX + sg * R1, 23.6, z], [DX + sg * R0, 23.6, z], nn, [0, 0], [0.6, 0], [0.6, 4.8], [0, 4.8]);
      if (!rare) for (const sg of [-1, 1]) {                                                  // giant pilasters in solid deep cobalt, ochre capitals and bases
        const px = DX + sg * 8.55;
        church.set(6, 0.5); church.box(px, FZ - 0.2, 1.25, 0.5, GY - 1, CTOP - 1.5, 0, { top: false });
        church.set(6, 0.7); church.box(px, FZ - 0.26, 1.7, 0.66, CTOP - 1.5, CTOP - 0.5, 0, { bottom: true }); church.box(px, FZ - 0.26, 1.6, 0.64, GY - 1, GY + 0.9, 0);
        church.set(6, 0.1); church.box(px, FZ - 0.28, 1.9, 0.7, CTOP - 0.5, CTOP - 0.3, 0, { bottom: true });
      }
      for (const sg of [-1, 1]) props.lamp.push({ m: M4(DX + sg * 8.55, GY + 6.2, FZ - (rare ? 0.02 : 0.46), Math.PI, 2.7), seed: 0.5, ph: 0.3, a: [] });   // a great lantern either side of the door
    }
    church.set(6, 0.3); church.box(DX, FZ + 0.3, 0.5, 0.5, CTOP + 8, CTOP + 12, 0, { taper: 0.7 });
    church.set(3, 0.5); church.box(DX, FZ + 21, 34, 41, GY - 6, CTOP - 1, 0, { top: false });
    church.set(5, 0.2); church.quad([-15, CTOP - 1, FZ + 0.6], [-15, CTOP - 1, FZ + 41.5], [DX, CTOP + 7, FZ + 41.5], [DX, CTOP + 7, FZ + 0.6], [-0.4, 0.9, 0], [0, 0], [41, 0], [41, 19], [0, 19]);
    church.quad([19, CTOP - 1, FZ + 41.5], [19, CTOP - 1, FZ + 0.6], [DX, CTOP + 7, FZ + 0.6], [DX, CTOP + 7, FZ + 41.5], [0.4, 0.9, 0], [0, 0], [41, 0], [41, 19], [0, 19]);
    const bellAt = [];
    await ctx.yield();
    for (const tx of [-12, 16]) {
      const tz = FZ + 1.5, TB = 54.5, TT = 63;
      church.set(2, 0.2 + rng() * 0.3); church.box(tx, tz, 7, 7, GY - 6, TB, 0, { top: false, tu: tx * 3 });
      front(church, tx + 3.5, tz - 3.52, tx - 3.5, tz - 3.52, GY, TB - 0.5, { fit: 1, door: false, pic: 3, seed: 0.6, tu: tx });
      front(church, tx - 3.52, tz - 3.5, tx - 3.52, tz + 3.5, GY, TB - 0.5, { fit: 0, pic: 3, seed: 0.6, tu: tx }); front(church, tx + 3.52, tz + 3.5, tx + 3.52, tz - 3.5, GY, TB - 0.5, { fit: 0, pic: 3, seed: 0.7, tu: tx });
      for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { church.set(0, 0.4); church.box(tx + px * 2.75, tz + pz * 2.75, 1.5, 1.5, TB, TT, 0, { top: false }); }   // belfry piers
      church.set(6, 0.5); church.box(tx, tz, 5.4, 5.4, TB, TT, 0, { top: false, sh: 0.9 });
      church.set(6, 0.1); church.box(tx, tz, 7.9, 7.9, TT, TT + 0.7, 0, { bottom: true }); church.set(6, 0.5); church.box(tx, tz, 7.3, 7.3, TB - 0.1, TB + 0.35, 0);
      rng(); church.set(6, 0.7); church.geo(lathe([[3.6, 0], [3.5, 0.8], [3.0, 2.2], [2.0, 3.6], [0.9, 4.5], [0.45, 5.2], [0.5, 5.8], [0.2, 6.4], [0, 8]], 12), M4(tx, TT + 0.7, tz), 22, 9);
      for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { church.set(2, 0.5); church.geo(lathe([[0.45, 0], [0.3, 0.5], [0.5, 1.1], [0.2, 1.7], [0, 2.4]], 8), M4(tx + px * 3.3, TT + 0.7, tz + pz * 3.3), 3, 2.4); }
      bellAt.push([tx, TT - 1.2, tz - 3.1], [tx + (tx < 0 ? -3.1 : 3.1), TT - 1.2, tz]);
      await ctx.yield();
    }
    await add(church, 'church');
    await ctx.yield();

    // ------------------------------------------------------------ the town on the hill: about a thousand tiled houses
    const steamAt = [], parasols = [];
    function house(acc, cx, cz, yaw, w, d, y0, h, lod) {
      const c = Math.cos(yaw), s = Math.sin(yaw), hw = w / 2, hd = d / 2, C = (lx, lz) => [cx + lx * c + lz * s, cz - lx * s + lz * c];
      const p = [C(-hw, -hd), C(hw, -hd), C(hw, hd), C(-hw, hd)], yt = y0 + h, pic = rng.pick(lod > 0 ? HFIELDS : FIELDS), sd = rng(), flatRoof = lod > 0 && rng.chance(0.14);
      for (let i = 0; i < 4; i++) {
        const a = p[i], b = p[(i + 1) % 4];
        if (lod > 0) front(acc, b[0], b[1], a[0], a[1], y0, yt, { fit: lod, pic, seed: sd, lamp: false });
        else {
          acc.set(17, sd); acc.wall(b[0], b[1], a[0], a[1], y0 - 7, yt, { tu: sd * 40 + i * 9, tv: 0 });
          acc.set(6, 0.5); acc.wall(b[0] + (b[0] - cx) * 0.01, b[1] + (b[1] - cz) * 0.01, a[0] + (a[0] - cx) * 0.01, a[1] + (a[1] - cz) * 0.01, yt - 0.1, yt + 0.32);
        }
      }
      const e = lod > 0 ? 0.42 : 0.3, ye = yt + (lod > 0 ? 0.5 : 0.3), q = [C(-hw - e, -hd - e), C(hw + e, -hd - e), C(hw + e, hd + e), C(-hw - e, hd + e)];
      if (flatRoof) {                                                                         // a roof terrace: parapet, washing or a parasol
        acc.set(4, 0.3); acc.quad([q[0][0], ye, q[0][1]], [q[1][0], ye, q[1][1]], [q[2][0], ye, q[2][1]], [q[3][0], ye, q[3][1]], [0, 1, 0], [0, 0], [w, 0], [w, d], [0, d]);
        for (let i = 0; i < 4; i++) { const a = p[i], b = p[(i + 1) % 4]; acc.set(6, 0.1); acc.box((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.hypot(b[0] - a[0], b[1] - a[1]), 0.25, ye, ye + 0.7, Math.atan2(-(b[1] - a[1]), b[0] - a[0])); }
        if (rng.chance(0.6)) parasols.push([cx, ye, cz]); else for (let k = 0; k < 3; k++) put('cloth', cx + (k - 1) * 1.1 * c, ye + 2.1, cz - (k - 1) * 1.1 * s, yaw, 0.8, 1, 1);
        return yt + 1;
      }
      const rise = d * rng.range(0.26, 0.38), r0 = C(-hw - e, 0), r1 = C(hw + e, 0), yr = ye + rise, nA = [s * 0.4, 0.92, c * 0.4];
      acc.set(5, sd);
      acc.quad([q[3][0], ye, q[3][1]], [q[2][0], ye, q[2][1]], [r1[0], yr, r1[1]], [r0[0], yr, r0[1]], nA, [0, 0], [w, 0], [w, d * 0.56], [0, d * 0.56]);
      acc.quad([q[1][0], ye, q[1][1]], [q[0][0], ye, q[0][1]], [r0[0], yr, r0[1]], [r1[0], yr, r1[1]], [-nA[0], 0.92, -nA[2]], [0, 0], [w, 0], [w, d * 0.56], [0, d * 0.56]);
      acc.set(pic, sd);
      acc.tri([p[1][0], yt, p[1][1]], [p[2][0], yt, p[2][1]], [C(hw, 0)[0], yr - 0.1, C(hw, 0)[1]], [c, 0, -s], [0, 0], [d, 0], [d / 2, rise]);
      acc.tri([p[3][0], yt, p[3][1]], [p[0][0], yt, p[0][1]], [C(-hw, 0)[0], yr - 0.1, C(-hw, 0)[1]], [-c, 0, s], [0, 0], [d, 0], [d / 2, rise]);
      const ch = C(rng.range(-hw * 0.6, hw * 0.6), rng.range(-hd * 0.5, hd * 0.5)), cy = ye + rise * 0.5;
      acc.set(rng.pick([0, 3]), sd); acc.box(ch[0], ch[1], 0.75, 0.75, cy - 0.6, cy + 1.6, yaw); acc.set(6, 0.5); acc.box(ch[0], ch[1], 0.95, 0.95, cy + 1.6, cy + 1.78, yaw);
      if (lod > 0) steamAt.push([ch[0], cy + 2, ch[1]]);
      return yr;
    }
    const inRect = (x, z, x0, z0, x1, z1) => x > x0 && x < x1 && z > z0 && z < z1;
    // roofs stay under the sight line from the cab at the burst to the river, so the whole fall of the city shows
    const capRiver = (z) => 55 - 0.123 * (z - 5);
    // stepped rows of fronts either side of the stair lane: roofs cascade down the axis to the church
    const ROWS = [[48, -72, -5], [64, -72, -5], [64, 8, 62], [82, -72, -5], [82, 8, 40], [100, -72, -5], [100, 8, 44], [127, -72, -6], [165, -72, -9], [165, 13, 72], [188, -72, -9], [188, 13, 72]];
    const rowsAcc = makeAcc(16000);
    for (const [rz, rx0, rx1] of ROWS) {
      row(rowsAcc, rx1, rz, rx0, rz, (x, z) => hillY(x, z + 4) - 0.2, { fit: 1, hMin: 6.2, hMax: 8.2, wMin: 6.5, wMax: 9.5, depth: 9, lamp: false });
      await ctx.yield();
    }
    await add(rowsAcc, 'axis-rows');
    const townAcc = []; for (let i = 0; i < 8; i++) townAcc.push(makeAcc(14000));
    let nHouses = 0;
    for (let gz = 4; gz < 292; gz += 12.6) {
      for (let gx = -352; gx < 356; gx += 12.4) {
        const cx = gx + rng.range(-2.2, 2.2), cz = gz + rng.range(-2, 2), ax = Math.abs(cx - 20);
        if (ax > 190 && rng.chance(0.25)) continue;
        const below = cx < -6 && cz > 23;                                                    // the slope under the sunk terrace is built up
        if (!below && cz < 36 && inRect(cx, cz, -48, -20, 88, 60)) continue;                 // the terrace and its rows
        if ((!below && inRect(cx, cz, -44, -20, 85, 58)) || Math.hypot(cx - 30, cz - 25) < 40) continue;
        if (ROWS.some((r) => cz > r[0] - 6 && cz < r[0] + 15 && cx > r[1] - 6 && cx < r[2] + 6)) continue;
        const rc = Math.hypot(cx - ARC_C[0], cz - ARC_C[1]);
        if (rc > 25 && rc < 49 && cx > 60) continue;                                         // the sea wall and its court
        if (inRect(cx, cz, -22, 198, 26, 272)) continue;                                     // the church
        if (inRect(cx, cz, -9, 34, 13, 150)) continue;                                       // the stair lane on the church's axis
        const near = path.nearestXZ(cx, cz); if (near.dist < 9.2) continue;
        const w = rng.range(7, 10.5), d = rng.range(7.5, 10), yaw = rng.range(-0.14, 0.14) + (rng.chance(0.3) ? Math.PI / 2 : 0);
        let y0 = hillY(cx, cz + 5), h = rng.range(6.5, 10.5) + (cz > 150 ? rng.range(0, 3) : 0);
        const above = inRect(cx, cz, 20, 60, 62, 112);
        if (rc <= 25) { y0 = 39; h = Math.min(h, 7.5); }
        else if (!above) {
          let cap = 1e3;
          cap = capRiver(cz);
          if (near.dist < 34 && cz > 36) cap = Math.min(cap, near.y - 3.6 + (near.dist - 9) * 0.06);
          if (Math.abs(cx - 1) < 16) cap = Math.min(cap, 53.8 - 0.137 * (cz - 20) - 3.5);
          if (y0 + h + 2.6 > cap) h = cap - y0 - 2.6;
          if (h < 3.2) continue;
        }
        const lod = near.dist < 20 ? 2 : near.dist < 62 ? 1 : 0, acc = townAcc[(cx < -60 ? 0 : cx < 20 ? 1 : cx < 100 ? 2 : 3) + (cz < 140 ? 0 : 4)];
        house(acc, cx, cz, yaw, w, d, y0, h, lod); nHouses++;
        await ctx.yield();
      }
      await ctx.yield();
    }
    for (let i = 0; i < townAcc.length; i++) await add(townAcc[i], 'town-' + i);
    await ctx.yield();

    // ------------------------------------------------------------ ground, stair lane, river, far bank, the great dome
    const far = makeAcc(9000);
    far.set(4, 0.3);
    const gY = (x, z) => {
      let y = hillY(x, z) - 1.3; const n = path.nearestXZ(x, z);
      if (n.dist < 16) y = Math.min(y, n.y - EYE - 1.4);
      if (Math.hypot(x - ARC_C[0], z - ARC_C[1]) < 52 && x > 58) y = Math.min(y, 36);
      if (x > -52 && x < 92 && z > -4 && z < 58) y = Math.min(y, 44.5);
      return y;
    };
    for (let x = -434; x < 430; x += 14) for (let z = -6; z < 300; z += 14) {
      const z1 = Math.min(300, z + 14);
      far.quad([x, gY(x, z), z], [x + 14, gY(x + 14, z), z], [x + 14, gY(x + 14, z1), z1], [x, gY(x, z1), z1], [0, 1, 0], [x, z], [x + 14, z], [x + 14, z1], [x, z1], 0.4);
    }
    await ctx.yield();
    for (let z = 36; z < 118; z += 3) {                                                      // the stair lane straight down to the church's axis
      const y = hillY(1, z + 3) + 0.3; far.set(4, 0.3); far.flat(-2.5, z, 5.5, z + 3, y, { sh: 0.2 });
      far.set(6, 0.1); far.wall(-2.5, z + 3, 5.5, z + 3, y - 1.2, y);
    }
    far.set(13, 0.5); far.quad([-2600, 0.3, 296], [2600, 0.3, 296], [2600, 0.3, 1320], [-2600, 0.3, 1320], [0, 1, 0], [-2600, 0], [2600, 0], [2600, 1024], [-2600, 1024]);
    far.set(6, 0.5); far.wall(-434, 297, 430, 297, -1, 2.2);
    for (let layer = 0; layer < 3; layer++) {                                                // far bank: three painted ranges, deep, mid and pale cobalt
      const z = 700 + layer * 130, hF = (x) => 34 + layer * 30 + (52 + layer * 12) * (0.5 + 0.5 * Math.sin(x * 0.0021 + layer * 2)) + 24 * Math.sin(x * 0.0063 + layer) + 9 * Math.sin(x * 0.019 + layer * 4);
      far.set(20, layer === 0 ? 1 : layer === 1 ? 0.5 : 0);
      for (let x = -2400; x < 2400; x += 80) far.quad([x + 80, 0, z], [x, 0, z], [x, hF(x), z], [x + 80, hF(x + 80), z], [0, 0.3, -1], [x + 80, -hF(x + 80)], [x, -hF(x)], [x, 0], [x + 80, 0], 0.2);
    }
    {
      const dx = 300, dz = 150, by = hillY(dx, dz) - 3;
      far.set(2, 0.4); far.geo(new THREE.CylinderGeometry(21, 22, 30, 20, 1, true), M4(dx, by + 15, dz), 138, 30);
      far.set(6, 0.5); far.geo(new THREE.CylinderGeometry(22.6, 22.6, 1.4, 20, 1, false), M4(dx, by + 30, dz), 140, 1.4);
      far.set(5, 0.4); far.geo(lathe([[21.5, 0], [21, 5], [18.6, 11], [14.5, 16], [8.5, 20], [3.2, 22], [3.2, 26], [3.8, 26.5], [2.4, 29], [0.3, 31], [0, 35]], 20), M4(dx, by + 30.7, dz), 135, 40);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; far.set(11, rng()); const px = dx + Math.sin(a) * 21.7, pz = dz + Math.cos(a) * 21.7; far.wall(px - Math.cos(a) * 2.2, pz + Math.sin(a) * 2.2, px + Math.cos(a) * 2.2, pz - Math.sin(a) * 2.2, by + 12, by + 25, { ks: 0.25, tu: 0, tv: 0 }); }
    }
    {
      const dx = 300, dz = 150, by = hillY(dx, dz) - 3;
      far.set(6, 0.7); far.geo(lathe([[3.5, 0], [3.5, 4], [4.1, 4.5], [2.7, 7], [0.5, 9], [0, 13]], 12), M4(dx, by + 30.7 + 22, dz), 20, 13);   // its lantern, gilded
    }
    {                                                                                         // the mirante: a slender tiled look-out tower with a gilded cupola, standing where the west leg points
      const mx = -13.5, mz = 119.5, my = hillY(mx, mz) - 3, MT = 45.4;
      far.set(2, 0.45); far.box(mx, mz, 4.4, 4.4, my, MT, 0, { top: false, tu: 7 });
      far.set(6, 0.5); far.box(mx, mz, 4.6, 4.6, my, my + 5, 0, { top: false }); far.box(mx, mz, 4.9, 4.9, MT - 0.1, MT + 0.4, 0, { bottom: true });
      for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { far.set(0, 0.4); far.box(mx + px * 1.75, mz + pz * 1.75, 0.8, 0.8, MT + 0.4, MT + 3.7, 0, { top: false }); }
      far.set(6, 0.5); far.box(mx, mz, 2.9, 2.9, MT + 0.4, MT + 3.7, 0, { top: false, sh: 0.9 });
      far.set(6, 0.1); far.box(mx, mz, 5.3, 5.3, MT + 3.7, MT + 4.2, 0, { bottom: true });
      far.set(6, 0.7); far.geo(lathe([[2.5, 0], [2.45, 0.6], [2.1, 1.7], [1.4, 2.7], [0.55, 3.4], [0.3, 3.9], [0.38, 4.3], [0.14, 4.8], [0, 6.2]], 12), M4(mx, MT + 4.2, mz), 14, 6);
      for (let k = 0; k < 3; k++) {                                                           // windows toward the track (east) and toward the terrace (north)
        const y = MT - 4.2 - k * 4.6;
        far.set(11, 0.13 + k * 0.29); far.wall(mx + 2.22, mz + 0.55, mx + 2.22, mz - 0.55, y, y + 1.8, { tu: 0, tv: 0 });
        far.set(11, 0.71 - k * 0.23); far.wall(mx + 0.55, mz - 2.22, mx - 0.55, mz - 2.22, y, y + 1.8, { tu: 0, tv: 0 });
      }
    }
    await ctx.yield();
    await add(far, 'ground-river-far');
    // the painted sky: a dome that follows the eye
    const skyA = makeAcc(5000); skyA.set(9, 0);
    {
      const R = 2500, NA = 48, NE = 14, P = (i, j) => { const az = -Math.PI + 2 * Math.PI * i / NA, el = -0.14 + (Math.PI / 2 + 0.14) * j / NE; return { p: [R * Math.sin(az) * Math.cos(el), R * Math.sin(el), R * Math.cos(az) * Math.cos(el)], t: [az * 52, el * 52] }; };
      for (let i = 0; i < NA; i++) for (let j = 0; j < NE; j++) { const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1); skyA.quad(a.p, b.p, c.p, d.p, [0, -1, 0], a.t, b.t, c.t, d.t); }
    }
    const sky = new THREE.Mesh(skyA.build(), matSky); sky.name = 'sky'; sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);
    await ctx.yield();

    // ------------------------------------------------------------ fittings, instanced: shutters, balconies, flower boxes, lamps, cages, cloth
    for (const d of clothLines) for (const side of [-1, 1]) if (rng.chance(0.55)) {            // vines down the street walls
      const f = fr(d + rng.range(-3, 3)), p = off(f, side < 0 ? -deckL(d) + 0.07 : deckR(d) - 0.07, rng.range(8, 10.5));
      put('vine', p[0], p[1], p[2], Math.atan2(-f.rx * side, -f.rz * side), 1, rng.range(0.7, 1.3), 1);
    }
    const TB = (sx, sy, sz, x, y, z) => new THREE.BoxGeometry(sx, sy, sz).translate(x, y, z);
    const kinds = {
      shutter(a) {
        a.set(6, 0); a.geo(TB(0.53, 1.8, 0.04, 0.265, 0.9, 0.02), null, 0.53, 1.8);
        for (let i = 0; i < 5; i++) a.geo(new THREE.PlaneGeometry(0.4, 0.2).translate(0.265, 0.26 + i * 0.32, 0.045), null, 0.4, 0.2, 0.75);
      },
      balcony(a) {
        a.set(6, 0.1); a.geo(TB(1.7, 0.09, 0.62, 0, 0.045, 0.31), null, 1.7, 0.6);
        a.set(6, 0.5);
        a.geo(TB(1.7, 0.045, 0.045, 0, 1.0, 0.6), null, 1.7, 0.1); a.geo(TB(0.045, 0.045, 0.6, -0.83, 1.0, 0.3), null, 0.6, 0.1); a.geo(TB(0.045, 0.045, 0.6, 0.83, 1.0, 0.3), null, 0.6, 0.1);
        a.geo(TB(1.7, 0.03, 0.03, 0, 0.22, 0.6), null, 1.7, 0.1);
        for (let i = 0; i < 11; i++) a.geo(TB(0.024, 0.92, 0.024, -0.8 + i * 0.16, 0.54, 0.6), null, 0.1, 0.9);
        for (const x of [-0.83, 0.83]) for (const z of [0.2, 0.4]) a.geo(TB(0.024, 0.92, 0.024, x, 0.54, z), null, 0.1, 0.9);
        for (let i = 0; i < 5; i++) a.geo(new THREE.TorusGeometry(0.1, 0.012, 3, 8).translate(-0.64 + i * 0.32, 0.62, 0.6), null, 0.5, 0.1);
      },
      box(a) {
        a.set(3, 0.2); a.geo(TB(0.92, 0.2, 0.24, 0, -0.1, 0.12), null, 0.92, 0.24);
        for (let i = 0; i < 7; i++) {
          a.set(6, [0.3, 0.5, 0.3, 0.1, 0.5, 0.3, 0.3][i]); a.wind(0.035);
          a.geo(new THREE.OctahedronGeometry(0.11 + (i % 3) * 0.02, 0).translate(-0.36 + i * 0.12, 0.08 + (i % 2) * 0.1 + (i % 3) * 0.03, 0.12 + (i % 2) * 0.06), null, 0.4, 0.4); a.wind(0);
        }
      },
      lamp(a) {
        a.set(6, 0.5); a.geo(TB(0.035, 0.035, 0.95, 0, 0.6, 0.475), null, 0.1, 0.95); a.geo(TB(0.03, 0.03, 0.75, 0, 0.3, 0.3).rotateX(0), null, 0.1, 0.7);
        a.geo(new THREE.TorusGeometry(0.16, 0.014, 3, 10, Math.PI * 1.5).rotateY(Math.PI / 2).translate(0, 0.42, 0.5), null, 0.5, 0.1);
        a.set(7, 0.1); a.geo(new THREE.CylinderGeometry(0.15, 0.09, 0.34, 6).translate(0, 0.3, 0.92), null, 0.9, 0.34);
        a.set(6, 0.5); a.geo(new THREE.ConeGeometry(0.2, 0.16, 6).translate(0, 0.55, 0.92), null, 0.9, 0.2); a.geo(TB(0.02, 0.12, 0.02, 0, 0.66, 0.92), null, 0.1, 0.1);
      },
      cage(a) {
        a.set(6, 0.5); a.geo(TB(0.025, 0.025, 0.5, 0, 0.3, 0.25), null, 0.1, 0.5);
        a.wind(0.03); a.geo(TB(0.012, 0.3, 0.012, 0, 0.15, 0.46), null, 0.1, 0.3);
        for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; a.geo(TB(0.012, 0.36, 0.012, Math.sin(an) * 0.13, -0.18, 0.46 + Math.cos(an) * 0.13), null, 0.1, 0.36); }
        a.geo(new THREE.ConeGeometry(0.15, 0.1, 8).translate(0, 0.03, 0.46), null, 0.6, 0.1); a.set(6, 0.1); a.geo(new THREE.CylinderGeometry(0.14, 0.14, 0.025, 8).translate(0, -0.36, 0.46), null, 0.6, 0.1);
        a.set(6, 0.3); a.geo(new THREE.OctahedronGeometry(0.045, 0).scale(1, 1, 1.5).translate(0, -0.2, 0.46), null, 0.2, 0.2); a.wind(0);
      },
      cloth(a, flag = false) {                                                                 // patterned cloth: a sagging top edge, a wavy hem
        a.set(18, 0);
        const NX = 6, NY = 4, P = (i, j) => { const u = i / NX, v = j / NY, top = flag ? 0 : -0.05 * 4 * u * (1 - u), len = flag ? 1.2 * (1 - 0.82 * Math.abs(u - 0.5) * 2) : 1.2 + 0.05 * Math.sin(u * 15.7) + 0.03 * Math.sin(u * 37.7); return [u - 0.5, top - len * v, 0.03 * Math.sin(u * 9.4) * v, 0.05 * j * (flag ? 1.4 : 1), u, v * 1.2]; };
        for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) {
          const V = (q) => { a.wind(q[3]); a.v(q[0], q[1], q[2], 0, 0, 1, q[4], q[5]); }, A = P(i, j), B = P(i, j + 1), C = P(i + 1, j + 1), D = P(i + 1, j);
          V(A); V(B); V(C); V(A); V(C); V(D);
        }
        a.wind(0);
      },
      flag(a) { kinds.cloth(a, true); },
      pot(a) {                                                                                 // a glazed pot with a spray of brush-stroke leaves
        a.set(2, 0.3); a.geo(lathe([[0, 0], [0.3, 0], [0.34, 0.1], [0.5, 0.55], [0.52, 0.72], [0.58, 0.76], [0.58, 0.86], [0.46, 0.86], [0, 0.8]], 10), null, 2.2, 0.9);
        a.wind(0.035);
        for (let i = 0; i < 17; i++) {
          const an = i * 2.4, e = (i % 6) / 6, tilt = 1.1 - e * 0.95, len = 0.36 + 0.22 * ((i * 7) % 5) / 4, r = 0.1 + 0.16 * (1 - e);
          a.set(16, [0.36, 0.6, 0.2, 0.6, 0.36, 0.5][i % 6]);
          a.geo(new THREE.OctahedronGeometry(0.5, 0).scale(0.26, len * 2, 0.1).translate(0, len, 0).rotateZ(-tilt).rotateY(-an).translate(Math.cos(an) * r, 0.84, Math.sin(an) * r), null, 0.9, 1.6, i % 2 ? 0.15 : 0.6);
        }
        a.wind(0);
      },
      bal(a) { a.set(0, 0.2); a.geo(lathe([[0.09, 0], [0.09, 0.06], [0.05, 0.12], [0.11, 0.3], [0.07, 0.5], [0.05, 0.62], [0.09, 0.7]], 6), null, 0.56, 0.7); },
      vine(a) {
        a.set(6, 0.3);
        for (let i = 0; i < 22; i++) {
          const y = -i * 0.3, x = Math.sin(i * 1.3) * 0.25 + Math.sin(i * 0.37) * 0.3, s = 0.14 + (i % 3) * 0.04; a.wind(0.012 + i * 0.002); a.set(6, i % 4 === 0 ? 0.5 : i % 4 === 2 ? 0.1 : 0.3);
          a.v(x, y, 0.05, 0, 0, 1, 0, 0); a.v(x + s, y - s * 0.5, 0.09, 0, 0, 1, s, 0); a.v(x, y - s * 1.6, 0.05, 0, 0, 1, 0, s); a.v(x, y, 0.05, 0, 0, 1, 0, 0); a.v(x, y - s * 1.6, 0.05, 0, 0, 1, 0, s); a.v(x - s, y - s * 0.6, 0.09, 0, 0, 1, s, s);
        }
        a.wind(0);
      },
    };
    const thinned = { box: 1, cloth: 1, cage: 1, vine: 1, flag: 1 };
    let nProps = 0, shutterMesh = null;
    for (const kind of Object.keys(kinds)) {
      const list = props[kind] || []; let n = list.length; if (thinned[kind]) n = Math.round(n * Math.min(1, detail)); if (!n) continue;
      const a = makeAcc(600); kinds[kind](a);
      const g = a.build(), inst = new Float32Array(n * 2), im = new THREE.InstancedMesh(g, matD, n);
      for (let i = 0; i < n; i++) {
        im.setMatrixAt(i, list[i].m);
        inst[i * 2] = kind === 'shutter' ? [0.05, 0.25, 0.25, 0.45, 0.45][Math.floor(list[i].seed * 5)] : kind === 'flag' || kind === 'cloth' ? list[i].seed : 0;
        inst[i * 2 + 1] = list[i].ph;
      }
      g.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 2));
      im.instanceMatrix.needsUpdate = true; im.computeBoundingSphere(); im.name = 'props-' + kind; scene.add(im); nProps += n;
      if (kind === 'shutter') shutterMesh = im;
      await ctx.yield();
    }
    await ctx.yield();

    // ------------------------------------------------------------ trees in glaze: the pine, orange tubs, the jacaranda, garden cypresses, parasols
    const trees = makeAcc(9000), gYlate = (x, z) => { const n = path.nearestXZ(x, z), y = hillY(x, z) - 1.3; return n.dist < 16 ? Math.min(y, n.y - EYE - 1.4) : y; };
    // foliage is the stipple picture (16): lumpy scalloped masses, pale and dabbed above, deep cobalt below, no sheen
    const lump = (r, det, sy, k = 0.27) => {
      const g = new THREE.IcosahedronGeometry(r, det), p = g.attributes.position, o = rng() * 50, f = 1.9 / r;
      for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + k * ctx.noise.n3(x * f + o, y * f, z * f); p.setXYZ(i, x * n, y * n * sy, z * n); }
      return g;
    };
    const blob = (x, y, z, r, sy, seed, wind, det = 2) => { trees.set(16, seed); trees.wind(wind); trees.geo(lump(r, det, sy), M4(x, y, z, rng() * 6), 5.8 * r, 5.8 * r, 'ny'); trees.wind(0); };
    const crown = (x, y, z, r, seed, wind, n = 6, sy = 0.5) => { for (let i = 0; i < n; i++) { const a = i * 2.4 + rng(), q = i ? r * 0.62 : 0; blob(x + Math.cos(a) * q, y + (i % 3) * r * 0.16 - (i ? 0 : -r * 0.2), z + Math.sin(a) * q, r * (i ? 0.62 : 0.8), sy, i % 3 === 0 ? Math.min(1, seed + 0.15) : seed, wind, 1); } };
    const trunk = (x, y, z, h, r, lean = 0) => { trees.set(6, 0.5); trees.geo(new THREE.CylinderGeometry(r * 0.6, r, h, 6).translate(0, h / 2, 0).rotateZ(lean), M4(x, y, z), 1, h); };
    {                                                                                         // the stone pine at the corner of the sunk terrace: a wide flat umbrella
      const px = -12.5, pz = 14.4; trunk(px, SUNK, pz, 6.2, 0.36, 0.08);
      for (const [bx, by] of [[-1.2, 6.6], [0.9, 7.2]]) { trees.set(6, 0.5); trees.geo(new THREE.CylinderGeometry(0.07, 0.12, 2.6, 5).translate(0, 1.3, 0).rotateZ(bx > 0 ? -0.9 : 0.9), M4(px - 0.6, SUNK + by - 2.4, pz), 0.5, 2.6); }
      for (let i = 0; i < 12; i++) { const a = i * 2.4, r = i ? 1.5 + (i % 4) * 0.95 : 0; blob(px - 0.7 + Math.cos(a) * r, SUNK + 6.7 + (i % 2) * 0.4 - r * 0.2, pz + Math.sin(a) * r, 2.1 - r * 0.14, 0.46, i % 3 === 0 ? 0.5 : 0.3, 0.07, 1); await ctx.yield(); }
    }
    await ctx.yield();
    for (let i = 0; i < 6; i++) {                                                             // orange trees in tubs round the compass rose
      const an = i * Math.PI / 3 + 0.5, x = ROSE[0] + Math.cos(an) * 8.7, z = ROSE[1] + Math.sin(an) * 8.7;
      trees.set(2, 0.3 + (i % 4) * 0.1); trees.geo(lathe([[0, 0], [0.55, 0], [0.6, 0.15], [0.7, 0.8], [0.8, 0.9], [0.8, 1.02], [0.62, 1.02], [0, 0.95]], 10), M4(x, LOWT, z), 4, 1);
      trunk(x, LOWT + 1, z, 1.5, 0.09); crown(x, LOWT + 3.1, z, 1.25, 0.42, 0.03, 5, 0.95);
      for (let k = 0; k < 9; k++) { const a = k * 2.4, e = 0.3 + (k % 4) * 0.42; trees.set(6, 0.7); trees.wind(0.03); trees.geo(new THREE.IcosahedronGeometry(0.12, 0), M4(x + Math.cos(a) * Math.cos(e) * 1.08, LOWT + 3.1 + Math.sin(e) * 0.8 - 0.25, z + Math.sin(a) * Math.cos(e) * 1.08), 0.4, 0.4); trees.wind(0); }
      await ctx.yield();
    }
    const JAC = [14.6, GY + 1, 216];                                                        // the jacaranda by the church steps, in manganese stipple
    trunk(JAC[0], JAC[1] - 1, JAC[2], 6.6, 0.3, -0.1);
    for (const [bx, lean] of [[-0.3, 0.7], [0.5, -0.6]]) { trees.set(6, 0.5); trees.geo(new THREE.CylinderGeometry(0.08, 0.16, 3, 5).translate(0, 1.5, 0).rotateZ(lean), M4(JAC[0] + bx, JAC[1] + 4.4, JAC[2]), 0.5, 3); }
    for (let i = 0; i < 10; i++) { const a = i * 2.4, r = i ? 0.9 + (i % 3) * 0.55 : 0; blob(JAC[0] + 0.3 + Math.cos(a) * r, JAC[1] + 7.2 + (i % 3) * 0.9 - r * 0.3, JAC[2] + Math.sin(a) * r, 1.4 - r * 0.1, 0.95, i % 3 === 0 ? 0.98 : 0.84, 0.06, 1); await ctx.yield(); }
    await ctx.yield();
    const cypress = (x, y, z, h, wind) => { trees.set(16, rng.pick([0.62, 0.45])); trees.wind(wind); const g = new THREE.ConeGeometry(0.85, h, 9, 5), q = g.attributes.position, o = rng() * 9; for (let i = 0; i < q.count; i++) { const k = 1 + 0.22 * Math.sin(q.getY(i) * 4.3 + o + Math.atan2(q.getZ(i), q.getX(i)) * 3); q.setX(i, q.getX(i) * k); q.setZ(i, q.getZ(i) * k); } trees.geo(g.translate(0, h / 2 + 0.3, 0), M4(x, y, z), 7, h * 1.4, 'ny'); trees.wind(0); };
    for (let d = dFinal + 6; d < L - 30; d += rng.range(5, 8)) for (const sg of [-1, 1]) {
      const f = fr(d), r = sg * rng.range(6.6, 9), p = off(f, r), y = p[1] - 0.5;
      if (rng.chance(0.5)) cypress(p[0], y, p[2], rng.range(4.5, 6.5), 0.05);
      else { trunk(p[0], y, p[2], 3, 0.14); crown(p[0], y + 3.9, p[2], rng.range(1.7, 2.3), rng.pick([0.3, 0.3, 0.12]), 0.05, 6, 0.62); }
      await ctx.yield();
    }
    for (let i = 0; i < 26; i++) {                                                            // the orchard inside the last curve
      const an = rng.range(0.1, 1.5), r = rng.range(4, 18.5), x = 30 - r * Math.sin(an), z = 147 - r * Math.cos(an), y = gYlate(x, z);
      if (i % 3 === 0) cypress(x, y, z, rng.range(4, 6), 0.04);
      else { trunk(x, y, z, 1.8, 0.1); crown(x, y + 2.5, z, rng.range(1.0, 1.4), rng.pick([0.3, 0.3, 0.5]), 0.04, 5, 0.75); if (i % 3 === 1) for (let k = 0; k < 5; k++) { const a2 = k * 2.4; trees.set(6, 0.7); trees.geo(new THREE.IcosahedronGeometry(0.1, 0), M4(x + Math.cos(a2) * 0.95, y + 2.4 + (k % 3) * 0.3, z + Math.sin(a2) * 0.95), 0.4, 0.4); } }
      await ctx.yield();
    }
    for (const rr of [8, 14]) for (let i = 0; i < 9; i++) {                               // clipped hedges in quarter rings
      const a0 = 0.12 + i * 0.16, a1 = a0 + 0.13, x = 30 - rr * Math.sin((a0 + a1) / 2), z = 147 - rr * Math.cos((a0 + a1) / 2);
      trees.set(16, i % 2 ? 0.3 : 0.5); trees.box(x, z, rr * 0.13, 0.7, gYlate(x, z) - 0.3, gYlate(x, z) + 0.9, (a0 + a1) / 2, { ks: 1.6, sh: 0.3 });
    }
    await ctx.yield();
    {                                                                                         // on the belvedere: a tiled kiosk and benches
      const kx = 42, kz = 19, ky = LOWT;
      trees.set(2, 0.5); trees.geo(new THREE.CylinderGeometry(1.7, 1.7, 2.7, 6, 1, true).translate(0, 1.35, 0), M4(kx, ky, kz), 10.7, 2.7);
      trees.set(6, 0.5); trees.geo(new THREE.CylinderGeometry(1.82, 1.82, 0.5, 6, 1, false).translate(0, 0.25, 0), M4(kx, ky, kz), 10.7, 0.5);
      trees.set(5, 0.5); trees.geo(new THREE.ConeGeometry(2.5, 1.5, 6).translate(0, 3.45, 0), M4(kx, ky, kz), 12, 3); trees.set(6, 0.3); trees.geo(new THREE.SphereGeometry(0.2, 6, 5).translate(0, 4.35, 0), M4(kx, ky, kz), 1, 1);
      for (let i = 0; i < 3; i++) { trees.set(11, 0.2 + i * 0.2); const a = i * Math.PI * 2 / 3 + 0.52, px = kx + Math.sin(a) * 1.49, pz = kz + Math.cos(a) * 1.49; trees.wall(px - Math.cos(a) * 0.55, pz + Math.sin(a) * 0.55, px + Math.cos(a) * 0.55, pz - Math.sin(a) * 0.55, ky + 0.9, ky + 2.3, { ks: 1, tu: 0, tv: 0 }); }
      for (const [bx, bz, by, yw] of [[9.5, 20, LOWT, 1.3], [22.5, 20.5, LOWT, -1.3], [16, 14.2, LOWT, 0], [29, 31, LOWT, 1.57], [8, 30, LOWT, 1.2], [36, 44, LOWT, 0.5], [50, 30, LOWT, 0], [60, 14, LOWT, 0], [-9, 15.8, SUNK, 0], [-21, 15.8, SUNK, 0], [-29, 15.8, SUNK, 0], [-33.5, 12.5, SUNK, 1.57], [22, 1.6, UPT, 0], [-18, 1.6, UPT, 0]]) {
        trees.set(3, 0.4); trees.box(bx, bz, 1.9, 0.5, by + 0.38, by + 0.48, yw, { bottom: true }); trees.set(6, 0.5); trees.box(bx - 0.75 * Math.cos(yw), bz + 0.75 * Math.sin(yw), 0.12, 0.44, by, by + 0.38, yw); trees.box(bx + 0.75 * Math.cos(yw), bz - 0.75 * Math.sin(yw), 0.12, 0.44, by, by + 0.38, yw);
      }
    }
    for (const q of parasols) {
      trees.set(6, 0.5); trees.geo(new THREE.CylinderGeometry(0.03, 0.03, 2.3, 5).translate(0, 1.15, 0), M4(q[0], q[1], q[2]), 0.2, 2.3);
      rng(); trees.set(7, 0.7); trees.wind(0.02); trees.geo(new THREE.ConeGeometry(1.5, 0.5, 10, 1, true).translate(0, 2.4, 0), M4(q[0], q[1], q[2]), 9, 1.5); trees.wind(0);
    }
    await ctx.yield();
    await add(trees, 'trees', true);
    await add(poles, 'poles'); await add(gnd, 'paving'); await add(terr, 'terrace'); await add(thin, 'rails-and-wires', true);
    await ctx.yield();

    // ------------------------------------------------------------ our tram's cab (ride space: eye at the origin, looking down -Z)
    // The frame (pillars, sill, header, cord) is stretched every frame to the real projection so it hugs the edges at any
    // aspect or field of view; the controller and brake wheel keep their shape and ride the lower corners.
    const cab = new THREE.Group(); cab.name = 'cab';
    const cabFrame = (() => {
      const a = makeAcc(1600), B = (sx, sy, sz, x, y, z, ku = sx, kv = sy, sh = 0) => a.geo(TB(sx, sy, sz, x, y, z), null, ku, kv, sh);
      for (const sg of [-1, 1]) {
        a.set(7, 0.7); B(0.13, 1.66, 0.05, sg * 1.48, 0.1, -1.36, 0.1, 1.6);                   // window pillars, tiled and pinstriped: slim, at the very edge
        a.set(6, 0.5); B(0.012, 1.6, 0.012, sg * 1.409, 0.1, -1.392, 0.1, 1.4);                 // a cobalt bead on the inner edge
        for (const top of [0, 1]) {                                                            // curved corner brackets with a cobalt bead
          const cx = sg * 1.215, cy = top ? 0.65 : -0.59, rz = top ? (sg > 0 ? 0 : Math.PI / 2) : (sg > 0 ? -Math.PI / 2 : Math.PI);
          a.set(7, 0.7); a.geo(new THREE.TorusGeometry(0.2, 0.034, 5, 8, Math.PI / 2).rotateZ(rz).translate(cx, cy, -1.33), null, 0.25, 0.1);
          a.set(6, 0.5); a.geo(new THREE.TorusGeometry(0.155, 0.012, 4, 8, Math.PI / 2).rotateZ(rz).translate(cx, cy, -1.31), null, 0.25, 0.1);
          a.set(6, 0.5); a.geo(new THREE.IcosahedronGeometry(0.016, 0).translate(cx, cy, -1.3), null, 0.2, 0.2);
        }
      }
      a.set(7, 0.3); B(3.04, 0.07, 0.13, 0, -0.825, -1.365, 2.7, 0.3); B(3.04, 0.35, 0.05, 0, -1.03, -1.3, 2.7, 0.3, 0.6);     // a narrow sill and a short dash
      a.set(6, 0.5); B(2.9, 0.014, 0.02, 0, -0.784, -1.31, 2.6, 0.1);
      for (let i = 0; i < 19; i++) { a.set(6, 0.5); a.geo(new THREE.IcosahedronGeometry(0.012, 0).scale(1, 0.5, 1).translate(-1.26 + i * 0.14, -0.788, -1.37), null, 0.1, 0.1); }   // rivets along the sill
      a.set(7, 0.3); B(3.04, 0.12, 0.16, 0, 0.91, -1.35, 2.7, 0.3); a.set(6, 0.5); B(2.9, 0.02, 0.17, 0, 0.845, -1.35, 2.6, 0.1);       // header
      const cordPts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; cordPts.push([-1.36 + 2.72 * t, 0.83 - 0.11 * Math.sin(Math.PI * t) - 0.05 * Math.sin(Math.PI * 3 * t) * (t > 0.33 && t < 0.67 ? 1 : 0), -1.3]); }
      a.set(6, 0.5);
      for (let i = 0; i < 12; i++) { a.wind(0.012 * Math.sin(Math.PI * i / 12)); a.ribbon([cordPts[i], cordPts[i + 1]], 0.007, 0, 1, 0); }
      const m = new THREE.Mesh(a.build(), matD); m.frustumCulled = false; cab.add(m); return m;
    })();
    const ctrl = new THREE.Group(), wheel = new THREE.Group(); cab.add(ctrl); cab.add(wheel);
    {
      const a = makeAcc(900); a.set(7, 0.2);                                                      // the brass controller, low left (origin at the handle pivot)
      a.geo(new THREE.CylinderGeometry(0.115, 0.14, 0.5, 16).translate(0, -0.32, 0), null, 0.8, 0.5, 0.45); a.geo(new THREE.CylinderGeometry(0.15, 0.115, 0.05, 16).translate(0, -0.05, 0), null, 0.8, 0.1, 0.3);
      a.set(6, 0.5); a.geo(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 16).translate(0, -0.015, 0), null, 0.8, 0.1); a.geo(new THREE.CylinderGeometry(0.146, 0.146, 0.022, 16).translate(0, -0.3, 0), null, 0.8, 0.1);
      a.geo(new THREE.TorusGeometry(0.118, 0.006, 4, 20).rotateX(Math.PI / 2).translate(0, -0.024, 0), null, 0.5, 0.1);
      a.geo(new THREE.TorusGeometry(0.152, 0.009, 4, 16).rotateX(Math.PI / 2).translate(0, -0.075, 0), null, 0.5, 0.1);
      const m = new THREE.Mesh(a.build(), matD); m.frustumCulled = false; ctrl.add(m);
      const b = makeAcc(600); b.set(7, 0.2); b.geo(new THREE.CylinderGeometry(0.045, 0.045, 0.06, 14).rotateZ(Math.PI / 2), null, 0.3, 0.1, 0.4);   // brake wheel, low right: a round hub, a rim, eight spokes
      b.geo(new THREE.TorusGeometry(0.15, 0.016, 6, 20).rotateY(Math.PI / 2), null, 0.9, 0.1, 0.4);
      for (let i = 0; i < 4; i++) b.geo(new THREE.CylinderGeometry(0.008, 0.008, 0.3, 5).rotateX(i * Math.PI / 4), null, 0.1, 0.3, 0.5);
      b.set(6, 0.5); b.geo(new THREE.CylinderGeometry(0.03, 0.03, 0.07, 12).rotateZ(Math.PI / 2), null, 0.3, 0.1); b.geo(new THREE.TorusGeometry(0.15, 0.006, 4, 20).rotateY(Math.PI / 2).translate(-0.016, 0, 0), null, 0.9, 0.1);
      const m2 = new THREE.Mesh(b.build(), matD); m2.frustumCulled = false; wheel.add(m2);
    }
    const handle = new THREE.Group(); ctrl.add(handle);
    {
      const a = makeAcc(300); a.set(7, 0.2); a.geo(TB(0.24, 0.025, 0.035, 0.1, 0.012, 0), null, 0.24, 0.1, 0.35); a.set(6, 0.5); a.geo(new THREE.CylinderGeometry(0.014, 0.02, 0.07, 8).translate(0.2, 0.055, 0), null, 0.2, 0.1);
      a.set(6, 0.1); a.geo(new THREE.SphereGeometry(0.022, 10, 8).translate(0.2, 0.105, 0), null, 0.2, 0.2);              // a glazed knob
      const m = new THREE.Mesh(a.build(), matD); m.frustumCulled = false; handle.add(m);
    }
    scene.add(cab);
    const cab0 = path.frameAt(0);                                                              // the cab's pose for a camera standing at the start of the route
    await ctx.yield();
    // someone is home: one shutter swings shut as we come, and a crate is drawn back out of our way
    let shutI = -1, shutD = 0;
    { let best = 1e9; props.shutter.forEach((q, i) => { if (q.a[4] > 0) return; const n = path.nearestXZ(q.a[0], q.a[2]), dd = n.u * L; if (n.dist < 4.5 && dd > 62 && dd < 96 && q.a[1] - n.y > 0.5 && Math.abs(dd - 76) < best) { best = Math.abs(dd - 76); shutI = i; shutD = dd; } }); }
    const crate = (() => {
      const a = makeAcc(100); a.set(3, 0.3); a.box(0, 0, 0.6, 0.5, 0, 0.44, 0, { sh: 0.45 }); a.set(6, 0.5); a.box(0, 0, 0.64, 0.08, 0.16, 0.26, 0, { sh: 0.45 });
      const m = new THREE.Mesh(a.build(), matD); m.name = 'crate'; scene.add(m); return m;
    })();
    const crateD = 96, crateF = fr(crateD);

    // ------------------------------------------------------------ the second tram, climbing at the passing loop
    const tram2 = new THREE.Group(); tram2.name = 'uphill-tram';
    {
      const a = makeAcc(1500), W2 = 2.15, LN = 7.6, Wl = (x0, z0, x1, z1, y0, y1, o) => a.wall(x0, z0, x1, z1, y0, y1, o);
      a.set(6, 0.5); a.box(0, 0, 1.5, LN - 1.6, 0.12, 0.62, 0, { bottom: true });                 // truck
      a.set(7, 0.3); a.box(0, 0, W2, LN, 0.55, 1.75, 0, { top: false, bottom: true });           // yellow waist
      a.set(0, 0.2); a.box(0, 0, W2, LN, 1.75, 2.75, 0, { top: false });                         // white window band
      a.set(6, 0.1); a.box(0, 0, W2 + 0.16, LN + 0.2, 2.75, 2.92, 0, { bottom: true }); a.set(5, 0.4); a.box(0, 0, W2 - 0.3, LN - 0.5, 2.92, 3.1, 0);
      for (const sg of [-1, 1]) {
        for (let i = 0; i < 6; i++) { const z = -LN / 2 + 0.75 + i * 1.03; a.set(11, 0.31 + i * 0.07); if (sg > 0) Wl(W2 / 2 + 0.01, z + 0.9, W2 / 2 + 0.01, z, 1.82, 2.68, { ks: 1.25, tu: 0, tv: 0 }); else Wl(-W2 / 2 - 0.01, z, -W2 / 2 - 0.01, z + 0.9, 1.82, 2.68, { ks: 1.25, tu: 0, tv: 0 }); }
        a.set(11, 0.5); const zf = sg * (LN / 2 + 0.01); Wl(sg * 0.85, zf, -sg * 0.85, zf, 1.8, 2.7, { ks: 0.65, tu: 0, tv: 0 });   // end windscreens
        a.set(6, 0.5); Wl(sg * 0.6, zf + sg * 0.01, -sg * 0.6, zf + sg * 0.01, 2.74, 3.02, {});                                        // blank cobalt destination cartouche
        a.set(6, 0.1); a.geo(new THREE.CylinderGeometry(0.14, 0.14, 0.06, 10).rotateX(Math.PI / 2).translate(0, 1.1, zf), null, 0.5, 0.1);  // headlamp
        a.set(6, 0.5); a.box(0, sg * (LN / 2 + 0.12), W2 - 0.2, 0.2, 0.5, 0.66, 0);                                                   // fender
      }
      a.set(6, 0.5); a.ribbon([[0, 3.1, 0.6], [0, WIRE_Y, -2.2]], 0.02, 1, 0, 0); a.box(0, 0.6, 0.5, 0.9, 3.1, 3.22, 0);              // trolley pole
      const m = new THREE.Mesh(a.build(), matD); tram2.add(m);
    }
    scene.add(tram2);
    await ctx.yield();

    // ------------------------------------------------------------ bells, barges and ferries
    const bellG = (() => { const a = makeAcc(400); a.set(6, 0.5); a.geo(lathe([[0, 0], [0.2, 0], [0.3, -0.25], [0.42, -0.9], [0.62, -1.3], [0.72, -1.42], [0.6, -1.42], [0.5, -1.25]], 10), null, 3, 1.5); a.set(6, 0.3); a.geo(TB(1.9, 0.16, 0.16, 0, 0.08, 0), null, 1.9, 0.2); a.geo(new THREE.SphereGeometry(0.13, 6, 5).translate(0, -1.4, 0), null, 0.5, 0.3); return a.build(); })();
    const bells = bellAt.map((p, i) => { const m = new THREE.Mesh(bellG, matD); m.position.set(p[0], p[1], p[2]); m.rotation.y = i % 2 ? Math.PI / 2 : 0; m.scale.setScalar(1.5); scene.add(m); return m; });
    const bargeG = (() => {
      const a = makeAcc(300); a.set(6, 0.5); a.box(0, 0, 3.4, 15, 0, 1.5, 0, { taper: 0.25 });
      a.set(6, 0.3); a.box(0, 0.5, 0.2, 0.2, 1.5, 13, 0);
      const sail = (q) => {                                                                    // a tin sail edged in mid cobalt (the edge is a larger sail behind)
        const cy = (q[0][0] + q[1][0] + q[2][0]) / 3, cz = (q[0][1] + q[1][1] + q[2][1]) / 3, P = (x, k) => q.map(([y, z]) => [x, cy + (y - cy) * k, cz + (z - cz) * k]);
        const big = P(0, 1.17); a.set(6, 0.3); a.tri(big[0], big[1], big[2], [1, 0, 0], [0, 0], [0, 10], [7, 1]);
        a.set(6, 0.1); for (const x of [-0.08, 0.08]) { const t = P(x, 1); a.tri(t[0], t[1], t[2], [Math.sign(x), 0, 0], [0, 0], [0, 10], [7, 1]); }
      };
      sail([[2.4, 0.6], [12.6, 0.6], [3.2, -7.2]]); sail([[2.6, 0.9], [10.5, 0.7], [2.4, 6.6]]);
      return a.build();
    })();
    const NB = 14, barges = new THREE.InstancedMesh(bargeG, matD, NB + 2), bargeS = [];
    for (let i = 0; i < NB + 2; i++) { const ferry = i >= NB; bargeS.push({ x: i < 6 ? -330 + i * 130 + rng.range(-40, 40) : rng.range(-650, 650), z: ferry ? 350 + (i - NB) * 210 : i < 6 ? 322 + i * 24 + rng.range(-6, 6) : 470 + ((i - 6) / 8) * 190 + rng.range(-15, 15), v: (rng.chance(0.5) ? 1 : -1) * (ferry ? 6 : rng.range(1.6, 3.4)), s: ferry ? 3.8 : i < 6 ? rng.range(2.5, 3.5) * 1.12 : rng.range(2.2, 3) * 1.1, ph: rng() * 6 }); }
    { const bi = new Float32Array((NB + 2) * 2); for (let i = 0; i < NB; i++) if (i % 4 === 1 || i === 4) bi[i * 2] = 0.62; bargeG.setAttribute('aInst', new THREE.InstancedBufferAttribute(bi, 2)); }   // some under ochre sails
    barges.frustumCulled = false; barges.name = 'barges'; scene.add(barges);
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler(), _v = new THREE.Vector3();
    await ctx.yield();

    // ------------------------------------------------------------ creatures in the round: ceramic swallows, white pigeons, gulls
    const DUR = 40.5;
    const light = { sunDir: SUN, sunColor: dusk ? '#ffd9a0' : '#fff8ea', sunIntensity: dusk ? 1.0 : 1.7, sky: dusk ? '#3a5fb8' : '#b4c8ea', skyIntensity: dusk ? 0.9 : 1.15, ground: dusk ? '#243f8c' : '#e3e9f4', groundIntensity: 0.9 };
    const fauna = F.makeFauna(scene, { light });
    await ctx.yield();
    // (flock cure 1) every bird keeps 2.0 m of clear air from the flown line, BY PLACE, bird by bird: each course stays where it is laid and each spread is
    // live's (the kit's own for the kind, written out); a bird whose own reach comes within 2 m of the line is moved by what it alone lacks (the kit's
    // keepClear with each, never downward), the deal is held at three scatters, each flock has a small wander of its own, and each clearing is made in slices
    const clearOf = (from, to) => ({ path, dist: 2, each: true, up: true, from, to, step: 2 });
    const glaze = { body: '#f3f1e7', belly: '#ffffff', wingC: '#3e6dc2', tip: '#142e7c', trail: '#b4c8ea', head: '#3e6dc2', tailC: '#142e7c', beak: '#c8962e' };
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('swallows'), species: 'swifts', count: 30, size: 1.5, light, center: [14, 61, 36], radius: 42, height: 7, spread: [40, 16, 40], wander: [2, 1.2, 2, 0.7], maxSigma: 3, keepClear: clearOf(0, 1), ...glaze }, ctx.yield));
    await ctx.yield();
    const white = { body: '#f6f4ec', belly: '#ffffff', wingC: '#e9edf5', tip: '#b4c8ea', trail: '#dfe6f2', head: '#f6f4ec', tailC: '#c9d6ee', beak: '#c8962e' };
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('pigeons-largo'), species: 'crows', count: 24, size: 0.75, light, spread: [30, 10, 30], wander: [0.8, 0.5, 0.8, 0.4], maxSigma: 3, keepClear: clearOf(0, 1), ...white, cross: { path, u: 0.045, lead: 20, height: 1.5, angle: 62, side: rng.chance(0.5) ? 1 : -1, span: 80, rise: 15, duration: DUR } }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('pigeons-church'), species: 'crows', count: 24, size: 0.75, light, spread: [30, 10, 30], wander: [0.8, 0.5, 0.8, 0.4], maxSigma: 3, keepClear: clearOf(0, 1), ...white, cross: { path, u: 0.92, lead: 30, height: 2, angle: 70, side: rng.chance(0.5) ? 1 : -1, span: 90, rise: 14, duration: DUR } }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('gulls'), species: 'gulls', count: Math.round(22 * detail), size: 1.6, light, center: [10, 34, 400], radius: 150, height: 14, spread: [34, 12, 34], wander: [1.2, 0.8, 1.6, 0.35], maxSigma: 3, keepClear: clearOf(0, 1) }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('pigeons-roofs'), species: 'crows', count: 22, size: 0.75, light, spread: [30, 10, 30], wander: [0.8, 0.5, 0.8, 0.4], maxSigma: 3, keepClear: clearOf(0, 1), ...white, cross: { path, u: 0.71, lead: 24, height: -1, angle: 68, side: -1, span: 90, rise: 13, duration: DUR } }, ctx.yield));
    await ctx.yield();
    fauna.add(await F.makeFlockAsync({ rng: rng.fork('gulls-town'), species: 'gulls', count: Math.round(16 * detail), size: 1.5, light, center: [4, 50, 150], radius: 85, height: 10, spread: [34, 12, 34], wander: [1.2, 0.8, 1.6, 0.35], maxSigma: 3, keepClear: clearOf(0, 1) }, ctx.yield));
    await ctx.yield();

    // ------------------------------------------------------------ air: steam, smoke, petals, sparks, rain, motes
    const time = { value: 0 }, set = fx.fxGroup(); set.object.name = 'fx'; scene.add(set.object);
    const steamPts = steamAt.filter((p) => path.nearestXZ(p[0], p[2]).dist < 55);
    const steamN = Math.min(steamPts.length, Math.round(46 * detail * dens));
    if (steamN > 0) set.add(fx.makeMist({ rng: rng.fork('steam'), time, count: steamN, positions: rng.shuffle(steamPts).slice(0, steamN).map((p) => [p[0], p[1] + 2, p[2]]), size: [3.5, 8], color: dusk ? '#6f8fd6' : '#eef2fa', opacity: shower ? 0.3 : 0.17, drift: [0.5, 0.35, 0.2], flatten: 0.8 }));
    await ctx.yield();
    for (const p of rng.shuffle(chimneys.concat(steamPts)).slice(0, 6)) { set.add(fx.makeSmokeColumn({ rng: rng.fork('smoke'), time, position: p, height: 16, radius: [0.3, 2.6], size: [1, 4.6], count: 40, color: dusk ? '#5a7cc8' : '#e6ecf7', colorTop: dusk ? '#6f8fd6' : '#ffffff', shadowColor: dusk ? '#22469a' : '#9db4e0', ambient: dusk ? '#1b3a8a' : '#8fa8d6', opacity: 0.55, wind: [1.1, 0, 0.3], sunDir: SUN })); await ctx.yield(); }
    set.add(fx.makeParticles({ rng: rng.fork('petals'), preset: 'petals', time, follow: false, center: [JAC[0] - 5, GY + 7, JAC[2] - 2], box: [30, 16, 34], count: Math.round(320 * detail), colors: ['#8a5ea0', '#b79ac8', '#5c3a68'], lightDir: SUN }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('motes'), preset: 'pollen', time, count: Math.round(700 * detail), colors: dusk ? ['#ffe9a8', '#9db9ea', '#ffffff'] : ['#ffffff', '#dfe8f8', '#b4c8ea'], size: [0.02, 0.05], near: [1.6, 4] }));
    await ctx.yield();
    if (shower) set.add(fx.makeParticles({ rng: rng.fork('rain'), preset: 'rain', time, density: 0.8 * detail, colors: ['#8fa9dc', '#c4d2ee', '#5f84cc'], near: [1.8, 5] }));
    await ctx.yield();
    if (morning) set.add(fx.makeMist({ rng: rng.fork('river-mist'), time, count: Math.round(70 * detail), area: [1900, 5, 300], center: [0, 3, 560], size: [40, 90], color: '#f8ebd0', opacity: 0.25, drift: [1.2, 0, 0.2] }));
    await ctx.yield();
    set.add(fx.makeParticles({ rng: rng.fork('fountain'), preset: 'rain', time, follow: false, center: [16, LOWT + 2.3, 21], box: [2.6, 3.4, 2.6], count: Math.round(260 * detail), velocity: [0, -3.2, 0], colors: dusk ? ['#9db9ea', '#f1efe6', '#c9d6ee'] : ['#ffffff', '#b4c8ea', '#dfe8f8'], size: [0.03, 0.07] }));
    await ctx.yield();
    // the church door is the bright point of the whole picture from the burst on (the portal itself only shows closer in)
    const doorGlow = set.add(fx.makeGlows({ time, positions: [[DX, 26, FZ - 0.6]], color: dusk ? '#ffcf2a' : '#ffdf80', size: 8, intensity: 1.25, halo: 0.5, flicker: 0, rays: 0.3 }));
    set.add(fx.makeGlows({ time, positions: [[DX - 8.55, GY + 7, FZ - 2.9], [DX + 8.55, GY + 7, FZ - 2.9]], color: '#ffcf2a', size: 3.4, intensity: dusk ? 1.0 : 1.5, halo: 0.6, flicker: 0.12 }));
    await ctx.yield();
    const sparkD = [dHair + 30, dHair + 77], sparks = [];
    for (const d of sparkD) {
      const p = path.posAtDist(d, new THREE.Vector3()); p.y += WIRE_Y - EYE;
      const s = fx.makeParticles({ rng: rng.fork('sparks'), preset: 'sparks', time, follow: false, center: [p.x, p.y - 0.9, p.z], box: [1.5, 2, 1.5], count: 130, velocity: [0, -2.6, 0], velocityRandom: [1.5, 1.2, 1.5], size: [0.025, 0.06], stretch: 0.045, intensity: 1.7, colors: ['#ffc24a', '#ffe08a', '#ff9a2a'] });
      s.setOpacity(0); set.add(s); sparks.push(s);
      await ctx.yield();
    }
    const sparkGlow = set.add(fx.makeGlows({ time, positions: sparkD.map((d) => { const p = path.posAtDist(d, new THREE.Vector3()); return [p.x, p.y + WIRE_Y - EYE, p.z]; }), color: '#ffd68a', size: 0.7, intensity: 2.0, flicker: 0.25, rays: 0.15 }));
    if (dusk && props.lamp.length) set.add(fx.makeGlows({ time, positions: props.lamp.map((l) => { const v = new THREE.Vector3(0, 0.3, 0.92).applyMatrix4(l.m); return [v.x, v.y, v.z]; }), color: '#ffcf2a', size: 2.4, intensity: 1.3, flicker: 0.1 }));
    await ctx.yield();

    // ------------------------------------------------------------ flight
    const leadW = new THREE.Vector3(), churchDoor = new THREE.Vector3(DX, 30, 223), doorLow = new THREE.Vector3(DX, 27, 223), towerTops = new THREE.Vector3(DX, 50, 223), _v2 = new THREE.Vector2();
    let shutLive = true;
    const TILE = 0.14, snap = (x) => Math.floor(x / TILE) * TILE;
    const bell3 = (x, a, b) => sstep(a, a + 0.012, x) * (1 - sstep(b - 0.03, b, x));
    return {
      scene, path, duration: DUR, ride: 'none', style: 'none',
      camera: { fov: 62, near: 0.3, nearThrough: 0.3, far: 3000, lookAhead: 9, sway: 0.25, bank: 0 },   // a tram cab looks down its own rails
      pace: (u) => 0.72 + 0.28 * sstep(0, 0.05, u) - 0.24 * sstep(0.215, 0.245, u) * (1 - sstep(0.29, 0.33, u)) - 0.15 * sstep(0.46, 0.5, u) * (1 - sstep(0.62, 0.67, u)) + 0.2 * sstep(0.665, 0.7, u) * (1 - sstep(0.74, 0.79, u)) + 0.1 * sstep(0.84, 0.9, u),
      pois: [
        { at: churchDoor, from: 0.215, to: 0.41, weight: 0.75 },
        { at: () => leadW, from: 0.41, to: 0.66, weight: 0.8 },
        { at: doorLow, from: 0.6, to: 0.82, weight: 0.95 },
        { at: towerTops, from: 0.62, to: 0.8, weight: 0.7 },
      ],
      portal: { shape: 'arch', width: 10, height: 14, tilt: true, color: dusk ? '#ffd45e' : '#ffcb52', glow: 1.3, revealDistance: 250, blendDistance: 30 },
      post: {
        exposure: dusk ? 1.12 : 1.0, bloom: { strength: dusk ? 0.38 : 0.34, radius: 0.6, threshold: 1.15 },
        grade: { saturation: dusk ? 1.0 : 1.04, contrast: dusk ? 1.03 : 1.02, tint: '#ffffff', shadowTint: dusk ? '#08133c' : '#0e1a48', vignette: 0.22, grain: 0.014, aberration: 0 },
      },
      update(dt, t, camera, u) {
        time.value = t;
        const d = u * L;
        // the cab rocks on the rail joints; the glaze sheen slides with it
        const jp = (d % 9) / 9, roll = 0.017 * (Math.exp(-jp * 7) * Math.sin(jp * 38) + 0.35 * Math.sin(t * 1.3) + 0.2 * Math.sin(t * 2.9 + 1));
        U.uCamSway.value.set(0.05 * Math.sin(t * 0.8) + roll * 2.5, 0.03 * Math.sin(t * 1.1 + 1));
        U.uWorld.value.x = t * 3.2 + d * 0.84;
        U.uSky.value.z = t * 0.7;
        ctx.renderer.getDrawingBufferSize(_v2);                                                   // ribbons stay about 1.5 px wide at whatever the resolution is now
        U.uPix.value = 0.75 * 2 / (Math.max(0.2, Math.abs(camera.projectionMatrix.elements[5])) * Math.max(1, _v2.y));
        largoBack.visible = !ctx.through;
        // u is 0 while we are drawn through the previous world's portal (its camera, cut at the portal's plane): the cab
        // then waits at the start of the route, whole and still, and the viewer arrives into it; from there it rides the camera
        (u > 0 ? camera.matrixWorld : cab0).decompose(cab.position, cab.quaternion, _s); cab.visible = u > 0; cab.rotateZ(roll);   // never camera.position: behind a portal only the matrix is set
        const pe = camera.projectionMatrix.elements, kx = Math.abs(1 / (pe[0] || 1)) / 1.068, ky = Math.abs(1 / (pe[5] || 1)) / 0.601, ku = Math.min(kx, ky);
        cabFrame.scale.set(1.12 * kx, 1.14 * ky, 1); ctrl.position.set(-0.8 * kx, -0.55 * ky, -1); ctrl.scale.setScalar(ku); wheel.position.set(0.86 * kx, -0.56 * ky, -1.05);   // the window frame sits just outside the picture; only the brake wheel and the lever reach in wheel.scale.setScalar(ku);
        handle.rotation.y = -0.7 + 0.45 * Math.sin(t * 0.43) + 0.02 * Math.sin(t * 33);
        sky.position.setFromMatrixPosition(camera.matrixWorld);
        // the sea wall: the lead caravel holds station ahead of the cab, the whale surfaces at mid-turn
        const pr = (d - dHair) / (dWest - dHair);
        hero.setProgress(clamp01(pr)); hero.setCab((-0.5 + Math.max(-0.02, Math.min(1, pr))) * Math.PI);
        hero.update(dt, t, camera);
        leadW.copy(hero.anchors.lead).applyMatrix4(hero.object.matrixWorld);
        path.posAtDist(d, _v);
        // the cat on its string course: the street first, the terrace wall later
        if (d < dBurst + 6) U.uCat.value.x = snap(d + 6.5 + 1.5 * Math.sin(t * 0.4)); else U.uCat.value.x = snap(500 + (70 - _v.x) + 6 + Math.sin(t * 0.4));
        // rare: the whale leaves its panel, crosses the walls beside us and breaches over the church door
        if (rare && d > dWest - 8) {
          if (d > dFinal + 8) { const w = clamp01((d - dFinal - 8) / (L - dFinal - 30)); U.uRare.value.set(snap(402 - 3 * (1 - w)), snap(27 + 8 * w), 1.0 - 0.8 * w, (0.6 + 0.5 * w) * sstep(dFinal + 8, dFinal + 13, d)); U.uFigB.value.x = sstep(0.25, 0.5, w); }
          else if (d > dFinal - 4) U.uRare.value.set(snap(200 + (_v.z - 147) + 8), snap(_v.y - EYE - 0.95 + 1.38 + 0.2 * Math.sin(_v.z * 0.4)), 0.15 * Math.cos(_v.z * 0.4), 0.24 * sstep(dFinal - 4, dFinal + 1, d) * (1 - sstep(dFinal + 2, dFinal + 8, d)));
          else U.uRare.value.set(snap(70 - _v.x + 8), snap(_v.y - EYE - 1.14 + 2.45 + 0.3 * Math.sin(_v.x * 0.35)), 0.18 * Math.cos(_v.x * 0.35), 0.34 * sstep(dWest - 8, dWest + 4, d) * (1 - sstep(dTurn - 6, dTurn + 2, d)));
        } else U.uRare.value.w = 0;
        if (shutI >= 0 && shutterMesh && shutI < shutterMesh.count) {
          const inWin = d > shutD - 17 && d < shutD - 4;                                         // the one shutter that closes: written only while it moves, and once after
          if (inWin || shutLive) {
            const q = props.shutter[shutI].a, open = 1.25 * (1 - sstep(shutD - 16, shutD - 5, d));
            _e.set(0, q[3] + open, 0); _q.setFromEuler(_e); _m.compose(_v.set(q[0], q[1], q[2]), _q, _s.set(q[4], q[5], q[6])); shutterMesh.setMatrixAt(shutI, _m); shutterMesh.instanceMatrix.needsUpdate = true;
          }
          shutLive = inWin;
        }
        { const k = sstep(crateD - 22, crateD - 9, d), r = deckR(crateD) - 0.75 + 1.3 * k; crate.position.set(crateF.x + crateF.rx * r, crateF.y + 0.02, crateF.z + crateF.rz * r); crate.rotation.y = Math.atan2(crateF.tx, crateF.tz) + 0.25 * (1 - k); }
        // the uphill tram waits in the loop, then squeezes past
        const d2 = 83 - 26 * sstep(0.158, 0.24, u);
        path.posAtDist(d2, _v); path.tangentAtDist(d2, _s);
        const lx = -(loopX(d2) * 1.07), il = 1 / (Math.hypot(_s.x, _s.z) || 1);
        tram2.position.set(_v.x + (-_s.z * il) * lx, _v.y - EYE + 0.04, _v.z + (_s.x * il) * lx);
        tram2.rotation.set(0, Math.atan2(-_s.x, -_s.z), 0.012 * Math.sin(t * 5.1));
        for (let i = 0; i < bells.length; i++) { const sw = 0.55 * Math.sin(t * 2.3 + i * 1.9); if (i % 2) bells[i].rotation.z = sw; else bells[i].rotation.x = sw; }
        for (let i = 0; i < bargeS.length; i++) {
          const b = bargeS[i], x = ((b.x + b.v * t + 700) % 1400 + 1400) % 1400 - 700;
          _e.set(0.03 * Math.sin(t * 0.9 + b.ph), b.v > 0 ? Math.PI / 2 : -Math.PI / 2, 0.04 * Math.sin(t * 0.7 + b.ph)); _q.setFromEuler(_e);
          _v.set(x, 0.2 + 0.15 * Math.sin(t * 1.1 + b.ph), b.z); _s.setScalar(b.s); _m.compose(_v, _q, _s); barges.setMatrixAt(i, _m);
        }
        barges.instanceMatrix.needsUpdate = true;
        // wire sparks, twice in the hairpin
        for (let i = 0; i < 2; i++) { const k = bell3(u, sparkD[i] / L - 0.022, sparkD[i] / L + 0.03); sparks[i].setOpacity(k); sparkGlow.setSize(i, 0.01 + 0.7 * k * (0.8 + 0.2 * Math.sin(t * 9 + i))); }      // eased by bell3, under 2 Hz
        doorGlow.setSize(0, 0.01 + 8 * (1 - sstep(0.8, 0.9, u)));
        fauna.update(dt, t, camera, u);
        set.update(dt, t, camera);
      },
      dispose() {
        hero.dispose();
        bellG.dispose(); bargeG.dispose();
        for (const o of [set, fauna]) if (o && typeof o.dispose === 'function') o.dispose();
      },
    };
  },
};
