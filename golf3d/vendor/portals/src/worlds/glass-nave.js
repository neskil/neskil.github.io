// NAVE OF COLOURED LIGHT
// One unbroken Gothic vessel (kit 'nave' at scale 1.5, ten bays of 16.5 m), morning sun through the right-hand
// glass, the Rose Window (src/parts/glass-nave.js) in the east wall with the exit portal in its eye.
// Flight: west door at 4.5 m -> through an arcade arch into the right aisle (close pass by a pier, candles,
// coloured pools) -> back into the nave, the rose revealed -> climb over the pews as doves spiral up ->
// level at 30 m over the choir, organ on the left, straight into the eye of the rose.
// Room-local space == world space: the nave runs from z = 0 (west) to z = -165 (east), floor at y = 0.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero } from '../parts/glass-nave.js';

const S = 1.5, BAYS = 10, BAY = 16.5, LEN = BAYS * BAY, NX = 9.75, PIER_X = 10.7, AISLE_OUT = 21.5;
const ARCH_TOP = 20, DAIS_H = 2, DAIS_L = 49.5;
const STONE = '#c4b9a3', BLUE = '#2f5fd0', RUBY = '#d02f4a', GOLD = '#ffcf5a';
const OAK = '#2b1a10', GILT = '#c9a148';
const lerp = THREE.MathUtils.lerp, sstep = THREE.MathUtils.smoothstep;
const hexMix = (a, b, t) => '#' + new THREE.Color(a).lerp(new THREE.Color(b), t).getHexString();

const S_OAK = INT.surf(INT.SURF.WOOD, 0.42), S_OAKM = INT.surf(INT.SURF.WOOD, 0.2), S_BRASS = INT.surf(INT.SURF.PLAIN, 0.78, 1);
const S_STONE = INT.surf(INT.SURF.STONE, 0.14), S_CLOTH = INT.surf(INT.SURF.FABRIC, 0.05), S_IRON = INT.surf(INT.SURF.PLAIN, 0.45, 0.8);
const S_PIPE = INT.surf(INT.SURF.PLAIN, 0.7, 0.55, 0.1), S_PIPEG = INT.surf(INT.SURF.PLAIN, 0.8, 0.6, 0.3);
const S_LEAF = INT.surf(INT.SURF.PLAIN, 0.3, 0, 0, 0.25), S_PETAL = INT.surf(INT.SURF.PLAIN, 0.2, 0, 0.25, 0.25);

const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 8, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);

// ---- choir stalls: two dark ranks of three tiers under a canopied back, garlands on the desk fronts
async function addStalls(ctx, b, gb, rng, zE) {
  const z0 = zE + 44, z1 = zE + 8, len = z0 - z1, zc = (z0 + z1) / 2, y0 = DAIS_H;
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 3; i++) {
      const x = sx * (5.35 + i * 1.35), h = 0.5 * i;
      if (i) b.add(box(1.35, h, len), { p: [x, y0 + h / 2, zc], c: OAK, surf: S_OAKM });
      b.add(box(0.5, 0.55, len), { p: [x + sx * 0.4, y0 + h + 0.275, zc], c: OAK, surf: S_OAK });                 // bench
      b.add(box(0.12, 1.25, len), { p: [x - sx * 0.6, y0 + h + 0.625, zc], c: hexMix(OAK, '#000000', 0.15), surf: S_OAK });   // desk front
      b.add(box(0.5, 0.08, len), { p: [x - sx * 0.42, y0 + h + 1.27, zc], r: [0, 0, sx * 0.22], c: hexMix(OAK, '#7a4a26', 0.25), surf: S_OAK });  // book rest
      const n = Math.round(len / 1.2);
      for (let k = 0; k <= n; k++) b.add(box(0.75, 1.1, 0.09), { p: [x + sx * 0.28, y0 + h + 0.55, z1 + (k / n) * len], c: OAK, surf: S_OAK });
    }
    await ctx.yield();
    // canopied back
    const xb = sx * 9.25;
    b.add(box(0.22, 6.4, len), { p: [xb, y0 + 3.2, zc], c: hexMix(OAK, '#000000', 0.2), surf: S_OAKM });
    b.add(box(1.25, 0.2, len + 0.4), { p: [xb - sx * 0.55, y0 + 5.0, zc], c: OAK, surf: S_OAK });
    b.add(box(0.1, 0.34, len + 0.4), { p: [xb - sx * 1.16, y0 + 5.0, zc], c: GILT, surf: S_BRASS });
    const m = Math.round(len / 2.4);
    for (let k = 0; k <= m; k++) {
      const z = z1 + (k / m) * len;
      b.add(box(0.2, 5.0, 0.2), { p: [xb - sx * 1.05, y0 + 1.0 + 2.5, z], c: OAK, surf: S_OAK });
      const pin = new THREE.ConeGeometry(0.34, 2.2, 4); pin.rotateY(Math.PI / 4);
      b.add(pin, { p: [xb - sx * 0.55, y0 + 6.2, z], c: OAK, surf: S_OAK });
      b.add(new THREE.OctahedronGeometry(0.16), { p: [xb - sx * 0.55, y0 + 7.4, z], c: GILT, surf: S_BRASS });
      if (k < m) {     // traceried panel between the posts: a gilt-edged pointed arch
        const zz = z + len / m / 2;
        b.add(box(0.06, 2.6, 1.7), { p: [xb - sx * 0.14, y0 + 3.1, zz], c: hexMix(OAK, '#6a3a1c', 0.35), surf: S_OAK });
        const tip = new THREE.ConeGeometry(0.85, 1.1, 3); tip.rotateY(Math.PI / 2); tip.scale(0.08, 1, 1);
        b.add(tip, { p: [xb - sx * 0.14, y0 + 4.9, zz], c: hexMix(OAK, GILT, 0.5), surf: S_BRASS });
      }
    }
    // ends with poppy heads
    for (const z of [z0 + 0.1, z1 - 0.1]) for (let i = 0; i < 3; i++) {
      const x = sx * (5.35 + i * 1.35), h = 0.5 * i;
      b.add(box(1.3, 1.9 + h, 0.16), { p: [x, y0 + (1.9 + h) / 2, z], c: OAK, surf: S_OAK });
      b.add(new THREE.OctahedronGeometry(0.26), { p: [x - sx * 0.45, y0 + 2.1 + h, z], s: [0.7, 1.5, 0.7], c: hexMix(OAK, GILT, 0.6), surf: S_BRASS });
    }
    await ctx.yield();
    // garlands: green swags with white lilies, on the front desks and across the west ends
    const swag = (a, c) => {
      const mid = [(a[0] + c[0]) / 2, Math.min(a[1], c[1]) - 0.55, (a[2] + c[2]) / 2];
      const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3(...mid), new THREE.Vector3(...c));
      const g = new THREE.TubeGeometry(curve, 8, 0.11, 5, false); g.deleteAttribute('uv');
      gb.add(g, { c: hexMix('#1f4a1c', '#3a6a22', rng()), surf: S_LEAF });
      for (let k = 0; k < 4; k++) {
        const p = curve.getPoint((k + 0.5) / 4);
        gb.add(new THREE.IcosahedronGeometry(0.15, 0), { p: [p.x - sx * 0.1, p.y + 0.03, p.z], s: [1, 0.75, 1], c: k % 2 ? '#f4efe0' : '#e9d9a8', surf: S_PETAL });
      }
    };
    const ns = Math.round(len / 3.0), xg = sx * (5.35 - 0.68);
    for (let k = 0; k < ns; k++) { swag([xg, y0 + 1.2, z1 + (k / ns) * len], [xg, y0 + 1.2, z1 + ((k + 1) / ns) * len]); await ctx.yield(); }
    for (let i = 0; i < 3; i++) swag([sx * (4.75 + i * 1.35), y0 + 1.75 + 0.5 * i, z0 + 0.22], [sx * (6.0 + i * 1.35), y0 + 1.75 + 0.5 * i, z0 + 0.22]);
    await ctx.yield();
  }
}

// ---- swallow's-nest organ loft corbelled out from a left-hand pier
function addLoft(b, z) {
  const x0 = -NX, y = 17;
  const cor = cyl(4.6, 0.5, 6, 10); cor.scale(1.05, 1, 1.25);
  b.add(cor, { p: [x0 + 0.2, y - 3, z], c: hexMix(STONE, '#4e4a46', 0.45), surf: S_STONE });
  b.add(cyl(4.95, 4.75, 0.5, 10), { p: [x0 + 0.2, y + 0.05, z], s: [1.05, 1, 1.25], c: OAK, surf: S_OAK });
  for (let i = 0; i < 10; i++) {                         // parapet panels round the front of the loft
    const a = -Math.PI / 2 + (i + 0.5) * Math.PI / 10, r = 4.85;
    b.add(box(0.16, 1.25, 1.75), { p: [x0 + 0.2 + Math.cos(a) * r * 1.05, y + 0.9, z + Math.sin(a) * r * 1.25], r: [0, -a, 0], c: i % 2 ? OAK : hexMix(OAK, '#6a3a1c', 0.4), surf: S_OAK });
    b.add(box(0.2, 0.12, 1.8), { p: [x0 + 0.2 + Math.cos(a) * r * 1.05, y + 1.58, z + Math.sin(a) * r * 1.25], r: [0, -a, 0], c: GILT, surf: S_BRASS });
  }
}

// ---- the organ's show pipes: a gilded front rank in three towers and two flats, and a crown of pipes on the case roof, so the
// case reads as gold pipes from the nave and from above (org: { x, y, z, rot, sc } of the kit organ they stand on)
function addPipes(b, org, S) {
  const sc = org.sc * S, W = 4.4 * sc, D = 1.15 * sc, H = 5.4 * sc;
  const pre = new THREE.Matrix4().makeRotationY(org.rot).setPosition(org.x, org.y, org.z);
  const bump = (t, c, w) => Math.exp(-((t - c) / w) * ((t - c) / w));
  const pipe = (x, y0, z, r, h, k) => {
    const col = hexMix('#cfa03c', '#96681c', (k * 0.37) % 1), sf = k % 4 === 1 ? S_PIPEG : S_PIPE;
    b.add(cyl(r, r * 0.4, 0.5, 7, true), { pre, p: [x, y0 + 0.25, z], c: col, surf: sf });
    b.add(cyl(r, r, h - 0.5, 7), { pre, p: [x, y0 + 0.5 + (h - 0.5) / 2, z], c: col, surf: sf });
    b.add(box(r * 1.1, r * 0.7, r * 0.5), { pre, p: [x, y0 + 0.5 + r * 1.2, z + r * 0.85], c: '#1a120a', surf: S_OAKM });       // the mouth
  };
  const y0 = 1.55 * sc + 0.45, n = 29;
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), mx = Math.max(bump(t, 0.05, 0.065), bump(t, 0.5, 0.075), bump(t, 0.95, 0.065));
    const h = 2.7 + (H - y0 - 3.1) * mx + 0.9 * Math.abs(Math.sin(t * Math.PI * 6));
    pipe(lerp(-W / 2 + 0.4, W / 2 - 0.4, t), y0, D / 2 + 0.2 + 0.3 * mx, 0.1 + 0.011 * h, h, i);
  }
  // the pipework inside the case, standing through its open top: seen from above the organ is a forest of pipe tops, not a roof
  const inner = cyl(1, 1, 1, 6);
  for (let j = 0; j < 5; j++) for (let i = 0; i < 22; i++) {
    const t = (i + 0.5 * (j % 2)) / 22, h = 0.9 + 1.1 * Math.abs(Math.cos(t * Math.PI * 3 + j * 0.5)) + 0.3 * ((i * 7 + j * 3) % 5) / 4, r = 0.1 + 0.05 * ((i + j * 2) % 3);
    b.add(inner, { pre, p: [lerp(-W / 2 + 0.35, W / 2 - 0.35, t), H - 0.9 + h / 2, -D / 2 + 0.3 + j * (D - 0.6) / 4], s: [r, h + 0.9, r],
      c: hexMix('#b89a52', '#7a6a48', ((i * 5 + j) % 7) / 6), surf: (i + j) % 6 === 0 ? S_PIPEG : S_PIPE });
  }
  inner.dispose();
  // gilt impost under the pipes, cornice over them, and pipe shades (a pierced gilt band across each flat)
  b.add(box(W + 0.3, 0.22, 0.5), { pre, p: [0, y0 - 0.05, D / 2 + 0.2], c: GILT, surf: S_BRASS });
  b.add(box(W + 0.4, 0.26, 0.4), { pre, p: [0, H - 0.2, D / 2 + 0.12], c: GILT, surf: S_PIPE });
  for (const sx of [-1, 1]) b.add(box(W * 0.3, 0.3, 0.1), { pre, p: [sx * W * 0.235, y0 + 3.9, D / 2 + 0.42], c: GILT, surf: S_PIPE });
}

// ---- carved relief for the kit's flat walls (all in the prop builder, no extra draw):
//   nave side: a string course and a blind arcade of pointed arches between the arcade and the triforium (y 21-25), and
//   pairs of small arch heads on a mid shaft between the triforium's colonnettes (y 25.6-29);
//   aisle side: a stone bench and a wall arcade under the window rail (y 0-4.2).
async function addWallRelief(ctx, b, { trim, dark, bays }) {
  const half = (w, tube) => { const g = new THREE.TorusGeometry(w, tube, 4, 5, Math.PI / 3); g.deleteAttribute('uv'); g.translate(-w / 2, 0, 0); return g; };
  const heads = (w, tube) => { const a = half(w, tube), c = half(w, tube); c.rotateY(Math.PI); a.rotateY(Math.PI / 2); c.rotateY(Math.PI / 2); return [a, c]; };
  // a pointed panel (the shadowed field inside an arch), facing +x or -x
  const panel = (w, hRect, dir) => {
    const sh = new THREE.Shape(), n = 5; sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, hRect);
    for (let i = 1; i <= n; i++) { const a = (i / n) * Math.PI / 3; sh.lineTo(-w / 2 + Math.cos(a) * w, hRect + Math.sin(a) * w); }
    for (let i = n - 1; i >= 0; i--) { const a = (i / n) * Math.PI / 3; sh.lineTo(w / 2 - Math.cos(a) * w, hRect + Math.sin(a) * w); }
    const g = new THREE.ShapeGeometry(sh); g.deleteAttribute('uv'); g.rotateY(dir * Math.PI / 2); return g;
  };
  const trimD = hexMix(trim, '#4e4a46', 0.3), free = [];
  const keep = (g) => { free.push(g); return g; };
  // --- nave walls
  const wF = (BAY - 1.8) / 6, hF = heads(wF, 0.09).map(keep), pF = [keep(panel(wF - 0.1, 1.45, 1)), keep(panel(wF - 0.1, 1.45, -1))];
  const wT = 1.32, hT = heads(wT, 0.07).map(keep);
  const shaftF = keep(cyl(0.1, 0.1, 1.45, 6, true)), capF = keep(box(0.34, 0.16, 0.34)), baseF = keep(box(0.3, 0.12, 0.3)), shaftT = keep(cyl(0.07, 0.07, 2.1, 5, true)), boss = keep(new THREE.OctahedronGeometry(0.17));
  const courseF = keep(box(0.22, 0.26, BAY - 1.0)), panelT = keep(box(0.05, 3.25, 2.64 - 0.24));
  for (let k = 0; k < bays; k++) {
    for (const sx of [-1, 1]) {
      const xw = sx * NX, zc = -(k + 0.5) * BAY;
      b.add(courseF, { p: [xw - sx * 0.1, 21.12, zc], c: trim, surf: S_STONE });
      for (let j = 0; j <= 6; j++) {
        const z = -k * BAY - 0.9 - j * wF;
        b.add(shaftF, { p: [xw - sx * 0.13, 21.3 + 0.725, z], c: trim, surf: S_STONE });
        b.add(baseF, { p: [xw - sx * 0.13, 21.31, z], c: trimD, surf: S_STONE });
        b.add(capF, { p: [xw - sx * 0.13, 22.8, z], c: trim, surf: S_STONE });
        if (j === 6) break;
        for (const g of hF) b.add(g, { p: [xw - sx * 0.12, 22.86, z - wF / 2], c: trim, surf: S_STONE });
        b.add(pF[sx > 0 ? 1 : 0], { p: [xw - sx * 0.035, 21.3, z - wF / 2], c: dark, surf: S_STONE });
        if (j) b.add(boss, { p: [xw - sx * 0.12, 24.55, z], s: [0.6, 1, 1], c: GILT, surf: S_BRASS });
      }
      for (let j = 0; j < 4; j++) {                           // triforium: between the kit's colonnettes at 0.18 + 0.16 j of the bay
        const zm = -(k * BAY + BAY * (0.26 + 0.16 * j));
        b.add(panelT, { p: [xw - sx * 0.03, 27.3, zm], c: dark, surf: S_STONE });
        b.add(shaftT, { p: [xw - sx * 0.2, 25.65 + 1.05, zm], c: trim, surf: S_STONE });
        for (const dz of [-0.66, 0.66]) for (const g of hT) b.add(g, { p: [xw - sx * 0.2, 27.72, zm + dz], c: trim, surf: S_STONE });
      }
    }
    await ctx.yield();
  }
  // --- outer aisle walls (the first seven bays: beyond them the choir stalls' backs hide the wall)
  const nA = 9, wA = (BAY - 1.7) / nA, hA = heads(wA, 0.075).map(keep), pA = [keep(panel(wA - 0.08, 1.9, 1)), keep(panel(wA - 0.08, 1.9, -1))];
  const shaftA = keep(cyl(0.075, 0.075, 1.9, 6, true)), capA = keep(box(0.26, 0.13, 0.26)), bench = keep(box(0.5, 0.62, BAY - 1.3)), seat = keep(box(0.6, 0.1, BAY - 1.2));
  for (let k = 0; k < Math.min(bays, 7); k++) {
    for (const sx of [-1, 1]) {
      const xw = sx * AISLE_OUT, zc = -(k + 0.5) * BAY;
      b.add(bench, { p: [xw - sx * 0.25, 0.31, zc], c: trimD, surf: S_STONE });
      b.add(seat, { p: [xw - sx * 0.28, 0.66, zc], c: trim, surf: S_STONE });
      for (let j = 0; j <= nA; j++) {
        const z = -k * BAY - 0.85 - j * wA;
        b.add(shaftA, { p: [xw - sx * 0.12, 0.7 + 0.95, z], c: trim, surf: S_STONE });
        b.add(capA, { p: [xw - sx * 0.12, 2.6, z], c: trim, surf: S_STONE });
        if (j === nA) break;
        for (const g of hA) b.add(g, { p: [xw - sx * 0.11, 2.66, z - wA / 2], c: trim, surf: S_STONE });
        b.add(pA[sx > 0 ? 1 : 0], { p: [xw - sx * 0.03, 0.7, z - wA / 2], c: j % 3 === 1 ? hexMix(dark, '#3a1420', 0.5) : dark, surf: S_STONE });
      }
    }
    await ctx.yield();
  }
  for (const g of free) g.dispose();
}

// ---- one hanging censer (chain + pierced brass vessel), built hanging down from the origin
function censerGeometry(len) {
  const b = INT.makeBuilder();
  b.add(cyl(0.035, 0.035, len - 1.1, 5), { p: [0, -(len - 1.1) / 2, 0], c: '#6a5630', surf: S_BRASS });
  for (let i = 0; i < 3; i++) { const a = i * 2.094; b.add(cyl(0.02, 0.02, 1.3, 4), { p: [Math.cos(a) * 0.24, -len + 0.72, Math.sin(a) * 0.24], r: [Math.sin(a) * 0.36, 0, -Math.cos(a) * 0.36], c: '#6a5630', surf: S_BRASS }); }
  const prof = [[0.02, -0.75], [0.3, -0.68], [0.5, -0.4], [0.56, -0.1], [0.46, 0.12], [0.5, 0.18], [0.36, 0.5], [0.16, 0.8], [0.07, 1.0], [0.11, 1.08], [0.02, 1.2]].map((p) => new THREE.Vector2(p[0], p[1]));
  b.add(new THREE.LatheGeometry(prof, 12), { p: [0, -len, 0], c: GILT, surf: S_BRASS });
  b.add(cyl(0.6, 0.6, 0.07, 12), { p: [0, -len + 0.15, 0], c: '#e0b450', surf: S_BRASS });
  b.add(new THREE.SphereGeometry(0.3, 8, 6), { p: [0, -len + 0.1, 0], c: '#ff8a30', surf: INT.surf(0, 0.2, 0, 4) });   // the coals glow through
  return b.build();
}

// ---- the long banner: ruby (or sapphire) silk, gold border and roundels, swallow-tail foot
function bannerGeometry(w, h, field, rng) {
  const g = new THREE.PlaneGeometry(w, h, 16, 72); g.deleteAttribute('uv');
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3);
  const cF = new THREE.Color(field), cG = new THREE.Color('#e2b23c'), cD = cF.clone().multiplyScalar(0.55), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), y = pos.getY(i), u = x / w + 0.5, v = 0.5 - y / h;        // v: 0 top .. 1 foot
    if (v > 0.9) pos.setY(i, y + Math.abs(u - 0.5) * 2 * -1.6 + 0.8);                // swallow tail
    const edge = Math.min(u, 1 - u) * w;
    c.copy(cF);
    const cell = (v * h) / 2.5, f = cell - Math.floor(cell), rr = Math.hypot((u - 0.5) * w, (f - 0.5) * 2.5);
    if (rr < 0.66) c.copy(Math.floor(cell) % 2 ? cG : cD);                           // roundels: gold and shadow by turns ...
    if (rr > 0.42 && rr < 0.5) c.copy(Math.floor(cell) % 2 ? cD : cG);               // ... each with a ring
    if (Math.abs(rr - 0.86) < 0.06 && v < 0.88) c.copy(cG).multiplyScalar(0.7);      // a thin gold circle round each
    if (edge < 0.22 || v < 0.03) c.copy(cG);
    if (edge > 0.22 && edge < 0.3) c.copy(cD);
    if (v > 0.955) c.copy(Math.floor(u * 16) % 2 ? cG : cG.clone().multiplyScalar(0.55));   // gold fringe at the foot
    c.multiplyScalar((0.9 + 0.12 * rng()) * (0.8 + 0.2 * Math.cos(u * Math.PI * 2 * 3)));  // long folds of the cloth
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.translate(0, -h / 2, 0); g.computeVertexNormals();
  return g;
}

export default {
  id: 'glass-nave',
  name: 'Nave of Coloured Light',
  category: 'interior',
  weirdness: 0.08,
  async build(ctx) {
    const { rng } = ctx;
    const scene = new THREE.Scene();

    // ------------------------------------------------------------------ per-seed variety
    const V = rng.fork('variety');
    const hour = V();                                         // 0 = early, low .. 1 = later, higher
    const elevDeg = lerp(22, 38, hour), azDeg = V.range(13, 19);       // low sun = long pools, high = short
    const rosy = V();                                         // sun: cool white-gold .. pale rose
    
    const warm = V();                                         // stone: cool grey .. warm buff
    const hazeN = V(), haze = lerp(0.5, 1.7, hazeN);          // how much incense hangs in the air
    // the dominant glass family: blue-led (twice as likely, it is the brief's), ruby-led, green-and-gold-led.
    // stain = the kit windows' five colours (the first two fill most quarries); rose = [blue, ruby, gold] of the hero
    const family = V.pick([
      { stain: [BLUE, '#3a7fe0', RUBY, GOLD, '#7a2fb0'], rose: [BLUE, RUBY, GOLD], portal: '#ffe6b0', sun: '#f4f1ff', fog: '#141a2a', sky: '#42508c', shadow: '#10142c' },
      { stain: ['#2748c0', '#3f8ae6', '#c0243c', '#ffc24a', '#4a36c8'], rose: ['#2a52d8', '#d02f4a', GOLD], portal: '#ffe6b0', sun: '#fff3e2', fog: '#161828', sky: '#4a4878', shadow: '#17142c' },
      { stain: [RUBY, '#8e2a9a', BLUE, GOLD, '#3a7fe0'], rose: ['#c22a48', '#2f5fd0', '#ffc860'], portal: '#ffd9c0', sun: '#ffdcd6', fog: '#221620', sky: '#5a3c64', shadow: '#22101e' },
      { stain: ['#128a5a', BLUE, RUBY, GOLD, '#0d6b8f'], rose: ['#1b78c4', RUBY, '#ffd870'], portal: '#f2ecc0', sun: '#ffe2b0', fog: '#1a1c18', sky: '#4a5648', shadow: '#141a10' },
    ]);
    const sunHex = hexMix(hexMix(family.sun, '#ffffff', hour * 0.25), '#ffe2e4', rosy * 0.3);    // the sun and the air follow the glass
    const stain = family.stain;
    const bannerSide = V.sign(), bannerField = V.pick(['#7a1022', '#7a1022', '#152c70']);
    const nDoves = V.int(14, 20), nSparrows = V.int(10, 20), nChoir = V.int(12, 18);
    const censerAll = [[-1, V.pick([1, 2, 3])], [-1, V.pick([5, 6])], [1, 4], [1, V.pick([5, 6])]];
    const fogCol = new THREE.Color(hexMix(hexMix(family.fog, '#1b1724', V() * 0.3), '#221a1c', warm * 0.2));
    // three to five censers, never in an arch the camera flies through (right-hand bays 1 and 3) or beside it as it comes out
    censerAll[2][1] = censerAll[3][1] === 5 ? 6 : 5; censerAll[3][1] = 7;
    censerAll.push([-1, 8 - 4]);
    const nCenser = V.int(3, 5), censerBays = [censerAll[0], censerAll[2], censerAll[1], censerAll[3], censerAll[4]].slice(0, nCenser);
    const helixR = V.range(0.72, 1.12);
    scene.background = fogCol.clone().multiplyScalar(0.5);
    scene.fog = new THREE.FogExp2(fogCol, 0.0026 * lerp(0.85, 1.2, hazeN));

    // ------------------------------------------------------------------ the vessel
    const stoneA = hexMix('#a7a39c', '#bcae92', warm), stoneB = hexMix('#85827f', '#948a74', warm), trim = hexMix('#b9b6ae', STONE, warm);
    const room = await INT.makeRoomAsync({
      rng: rng.fork('room'), style: 'nave', scale: S, bays: BAYS, rose: false, clerestoryStained: true, windows: { stained: true }, entry: 'open',
      sun: { side: 1, elevation: elevDeg, ahead: Math.cos(azDeg * Math.PI / 180), color: sunHex },
      light: { dapple: { amount: 0.6, size: 2.4, speed: 0.9 }, sunIntensity: 10.5, ambient: 1.95, sky: 2.2, ambientSky: family.sky, ambientGround: hexMix('#3a3440', '#4a3a30', warm) },
      wallPatternScale: 0.8,
      skyColor: '#9aa6e6', stainPalette: stain,
      palette: { wallA: stoneA, wallB: stoneB, wallD: hexMix(stoneB, '#4e4a46', 0.5), trim, frame: trim, reveal: hexMix(trim, '#8f8572', 0.4), ceiling: hexMix(stoneB, stoneA, 0.4), rib: trim,
        floorA: '#968d7d', floorB: '#3c3846', floorC: '#8b8477', floorD: '#2a2632' },
      windowLight: { shaftGain: 0.048 * lerp(0.75, 1.3, hazeN), shaftDensity: 0.07, motesPerWindow: 90, maxMotes: 2700 },
    }, ctx.yield);
    scene.add(room.object);
    const rig = room.rig, clerShafts = [];
    // The kit's shafts take the sun colour and only a little of the glass, so a long hall of them reads as one amber fan.
    // Give them their own, luminance-balanced copy of the glass palette and a cool base tint: each beam is banded in the
    // colours of its window (blue and ruby as strong as gold). Only uniforms of this room's own shaft materials are touched.
    {
      const shaftPal = stain.map((h) => {
        const c = new THREE.Color(h), m = Math.max(c.r, c.g, c.b, 1e-3); c.multiplyScalar(1 / m).lerp(new THREE.Color(1, 1, 1), 0.05);
        const k = 1.35 / (0.3 + 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b);
        return new THREE.Vector3(c.r * k, c.g * k, c.b * k);
      });
      for (const sh of (room.light && room.light.shafts) || []) {
        if (!sh.uniforms) continue;
        if (sh.uniforms.uStainPal) sh.uniforms.uStainPal = { value: shaftPal };
        if (sh.uniforms.uTint) sh.uniforms.uTint.value.set(0.78, 0.82, 1.08);
        // clerestory beams: ten of them line up end-on down the nave and the level run flies through them, so they are
        // kept thinner than the aisle beams and thinned again (in update) once the camera is up among them
        if (sh.uniforms.uGain && sh.uniforms.uO && sh.uniforms.uO.value.y > ARCH_TOP + 4) clerShafts.push({ u: sh.uniforms.uGain, base: sh.uniforms.uGain.value * 0.52 });
      }
      for (const c of clerShafts) c.u.value = c.base;
    }
    await ctx.yield();

    // ------------------------------------------------------------------ the hero: east wall, rose, choir floor, cone of light
    const ZE = -(LEN - 1.7);                                   // the hero's inner wall face, just proud of the kit's own end wall
    const kitMat = (surf) => INT.interiorMaterial({ rig, vertexColors: true, surf, side: THREE.DoubleSide });
    const hero = await buildHero(ctx, {
      sunElevation: elevDeg, roseElevation: lerp(9, 11, hour), sunAzimuth: 4.5 + V.range(-1, 1), clipX: NX + 0.9, apron: false, palette: ['#c4b9a3', '#8f8572', '#4e4a46', '#1e1a22', family.rose[0], family.rose[1], family.rose[2]], naveWidth: NX * 2, daisLength: DAIS_L, daisHeight: DAIS_H, daisColor: '#e8e2d4',
      materials: { stone: kitMat(INT.surf(INT.SURF.STONE, 0.1)), carved: kitMat(INT.surf(INT.SURF.STONE, 0.22)), gilt: kitMat(INT.surf(INT.SURF.PLAIN, 0.72, 1)), floor: room.materials.floor },
    });
    hero.object.position.set(0, 0, ZE);
    scene.add(hero.object);
    hero.object.updateWorldMatrix(true, true);
    for (const m of [room.materials.wall, room.materials.prop]) hero.applyRoseLight(m);
    // The outer aisle walls sit in their own shade (the kit lamps do not reach them, see the report), so the candle stands
    // along them (one per bay) warm the stone through the hero's surface patch instead.
    hero.setAisleGlow({ x: AISLE_OUT, bay: BAY, z: -ZE, strength: 0.25, color: '#e8a880' });
    hero.setSurfaceLight(3.0, 1.0);                         // the rose's disc lies along the left-hand wall: let the grazed stone take it
    const A = hero.anchors;
    const roseC = A.roseCenter.clone().applyMatrix4(hero.object.matrixWorld);
    const portalAt = A.portalSeat.position.clone().applyMatrix4(hero.object.matrixWorld);
    await ctx.yield();

    // ------------------------------------------------------------------ the flight
    const zb = (k) => -(k + 0.5) * BAY;                       // centre of bay k (0 = westmost)
    const path = makePath([
      [0, 5.5, -1.5], [0, 5.5, -8], [2.4, 5.5, -15.5],
      [PIER_X + 0.2, 5.5, zb(1)],                             // through the second arch into the right aisle
      [16.9, 5.6, -32], [17.2, 5.9, -41], [16.9, 6.6, -50.5], // down the aisle past two piers
      [PIER_X + 0.2, 8.2, zb(3)],                             // back out through the fourth arch
      [2.6, 11.5, -66], [0, 16.5, -74], [0, 22, -82], [0, 26.5, -89.5], [0, 29.3, -96.5], [0, 30, portalAt.z + 60],
      [0, 30, portalAt.z + 30], [0, 30, portalAt.z],          // level for the last 60 m, straight into the eye
    ]);
    const DUR = 40;

    // ------------------------------------------------------------------ furniture: pews, candle stands, organ
    const items = [], stands = [];
    for (let z = -35; z > -107; z -= 1.95) for (const sx of [-1, 1]) items.push({ kind: 'pew', position: [sx * 6.0, 0, z], rotation: Math.PI, opts: { width: 2.9, color: '#6a4428' }, scale: 1.2, occluder: false, light: false });
    const stand = (x, y, z, n, sc = 5.2) => {
      items.push({ kind: 'candle', position: [x, y, z], rotation: 0, opts: { holder: 'candelabra', count: n, height: 0.2 }, scale: sc, light: false, occluder: false });
      stands.push([x, y + 0.5 * S * sc, z, n]);
    };
    for (let k = 1; k <= 6; k++) for (const sx of [-1, 1]) stand(sx * (NX - 2.05), 0, -k * BAY, 7);
    for (let k = 1; k <= 9; k++) for (const sx of [-1, 1]) stand(sx * (AISLE_OUT - 1.3), 0, -k * BAY, 5);
    for (const sx of [-1, 1]) stand(sx * 4.3, 0, ZE + DAIS_L + 3.4, 7, 6.2);
    const zOrg = -8 * BAY;
    // the case is turned a little toward the west, so the camera coming up the nave sees its pipe front, not its end
    const ORG = { x: -NX + 1.15, y: 17.3, z: zOrg, rot: Math.PI / 2 - 0.36, sc: 1.25 }, oN = [Math.sin(ORG.rot), Math.cos(ORG.rot)];
    items.push({ kind: 'organ', position: [ORG.x, ORG.y, ORG.z], rotation: ORG.rot, opts: { width: 4.4, height: 5.4, pipeColor: '#e6c56c', color: '#4e3018' }, scale: ORG.sc, occluder: false });
    items.push({ kind: 'organ', position: [ORG.x + oN[0] * 2.7, 17.3, ORG.z + oN[1] * 2.7], rotation: ORG.rot, opts: { width: 2.5, height: 2.75, pipeColor: '#e6c56c', color: '#4e3018' }, scale: 0.8, occluder: false });
    const fur = await INT.makeFurnitureAsync({ rig, rng: rng.fork('furniture'), scale: S, items, chunks: 4, length: LEN, material: room.materials.prop, lights: false, occluders: false }, ctx.yield);
    scene.add(fur.object);
    await ctx.yield();

    // warm candle light where the camera flies low, and in the choir (rig lights: at most 8)
    const candleLight = (x, y, z, k = 1, range = 15) => rig.addLight({ position: [x, y, z], color: '#ffb878', intensity: 5 * k, range, flicker: 0.3 });
    for (const sx of [-1, 1]) { candleLight(sx * (NX - 2.6), 4.6, -BAY); candleLight(sx * 8.4, DAIS_H + 3.2, ZE + 26, 1.2); }
    candleLight(NX - 4.2, 4.6, -4 * BAY, 0.4);
    rig.addLight({ position: [-3.0, 22.5, zOrg + 6.5], color: '#ffe2b8', intensity: 8, range: 22, flicker: 0.08 });   // lamp at the organ loft: the pipes glint
    candleLight(AISLE_OUT - 2.4, 5.6, -2.2 * BAY, 1.3, 26); candleLight(AISLE_OUT - 2.4, 5.6, -2.9 * BAY, 1.3, 26);   // outer aisle wall, either side of z = -41

    // ------------------------------------------------------------------ choir stalls, organ loft (one draw) + garlands and banner (cloth material)
    const sb = INT.makeBuilder(), gb = INT.makeBuilder();
    await addStalls(ctx, sb, gb, rng.fork('stalls'), ZE);
    addLoft(sb, zOrg);
    addPipes(sb, ORG, S);
    hero.setOccluder([-11.2, 12, ORG.z - ZE - 3.9], [-6.2, 28, ORG.z - ZE + 3.9]);   // the organ and its loft stop the cone's haze
    await ctx.yield();
    // the banner hangs close against a pier of the climb (not out over the level run), from a short iron bracket
    const zBan = -5 * BAY, xBan = bannerSide * (NX - 1.75), yBan = 33, hBan = 15;
    sb.add(cyl(0.08, 0.08, 3.2, 6), { p: [bannerSide * (NX - 1.6), yBan + 0.12, zBan + 0.7], r: [0, 0, Math.PI / 2], c: '#3a3028', surf: S_IRON });
    sb.add(new THREE.OctahedronGeometry(0.2), { p: [bannerSide * (NX - 3.25), yBan + 0.12, zBan + 0.7], s: [1.6, 1, 1], c: GILT, surf: S_BRASS });
    sb.add(cyl(0.045, 0.045, 2.6, 5), { p: [bannerSide * (NX - 1.0), yBan + 1.0, zBan + 0.7], r: [0, 0, bannerSide * 0.86], c: '#3a3028', surf: S_IRON });
    // carved relief on the stone: blind arcades under the triforium, heads to the triforium, a wall arcade along the aisles
    await addWallRelief(ctx, sb, { trim, dark: hexMix(stoneB, '#1e1a22', 0.66), bays: BAYS });
    const stallMesh = new THREE.Mesh(sb.build(), room.materials.prop); stallMesh.name = 'stalls-loft'; scene.add(stallMesh);
    await ctx.yield();
    gb.add(bannerGeometry(2.5, hBan, bannerField, rng.fork('banner')), { p: [xBan, yBan, zBan + 0.7], surf: S_CLOTH, sway: [yBan - hBan, yBan - 0.4, 1, 0] });
    const clothMat = hero.applyRoseLight(INT.propMaterial({ rig, side: THREE.DoubleSide, sway: { dir: [0.22, 0, 1], amp: 0.34, freq: 1.0, k: 1.0 } }));
    const clothMesh = new THREE.Mesh(gb.build(), clothMat); clothMesh.name = 'banner-garlands'; scene.add(clothMesh);
    await ctx.yield();

    // ------------------------------------------------------------------ four censers swinging on long chains in the arcade arches
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    const sunDir = rig.state.sunDir.clone();
    const CH = 10.5, censerGeo = censerGeometry(CH), censers = [];
    for (let i = 0; i < censerBays.length; i++) {
      const [sx, k] = censerBays[i], R = rng.fork('censer' + i);
      const pivot = new THREE.Group(); pivot.position.set(sx * PIER_X, ARCH_TOP - 0.7, zb(k));
      pivot.add(new THREE.Mesh(censerGeo, room.materials.prop)); scene.add(pivot);
      const smoke = set.add(fx.makeSmokeColumn({ rng: R, time, position: [pivot.position.x, pivot.position.y - CH, pivot.position.z], height: 17, radius: [0.25, 3.2], size: [0.7, 4.2], count: 44,
        color: '#625e7a', colorTop: '#8a88b0', shadowColor: '#221e2c', ambient: '#141019', opacity: 0.13 * haze, rate: 0.045, wind: [-sx * 0.35, 0, 0.12], bend: 0.3,
        sunDir, sunColor: sunHex, scatter: 0.4, rim: 0.35 }));
      censers.push({ pivot, smoke, amp: R.range(0.3, 0.4), w: Math.sqrt(9.81 / CH) * R.range(0.96, 1.04), ph: R.range(0, 6.28) });
    }
    const embers = set.add(fx.makeGlows({ rng: rng.fork('embers'), time, positions: censers.map((c) => [c.pivot.position.x, c.pivot.position.y - CH, c.pivot.position.z]), color: '#ff9440', size: 2.6, intensity: 1.5, flicker: 0.5 }));
    await ctx.yield();

    // ------------------------------------------------------------------ candle halos, dust, incense haze
    set.add(fx.makeGlows({ rng: rng.fork('halos'), time, positions: stands.map((s) => [s[0], s[1] + 0.3, s[2]]), sizes: stands.map((s) => (s[3] > 5 ? 1.2 : 1)),
      color: '#ffbc7a', size: 5.2, intensity: 0.46, flicker: 0.3, halo: 1, core: 0.25 }));
    set.add(fx.makeParticles({ rng: rng.fork('dust'), preset: 'dust', time, count: 2000, box: [28, 18, 28], intensity: 0.7, colors: ['#ffe9c8', '#c9b8ff', '#b8ccff', '#ffc8d0'] }));
    set.add(fx.makeMist({ rng: rng.fork('haze'), time, count: 40, area: [22, 16, 150], center: [0, 10, -88], size: [12, 26], color: hexMix('#3c3654', '#4a3c44', warm * 0.5),
      opacity: 0.06 * haze, drift: [0.1, 0.03, 0.34], flatten: 0.7, floorFade: 0.5 }));
    await ctx.yield();

    // ------------------------------------------------------------------ doves (released under the camera's climb) and sparrows in the triforium
    const birdLight = { sunDir, sunColor: sunHex, sunIntensity: 2.4, sky: '#8f8fd6', skyIntensity: 0.85, ground: '#7a6450', groundIntensity: 0.6 };
    // The release: the doves come up from between the pews ahead of the camera and climb in a helix that leads the camera's
    // own climb by 12-25 m (so they ring the view of the rose, never closer than ~12 m), then wheel twice under the choir
    // vault above the level run and leave over the rose.
    const helix = [], turns = 2.4, a0 = rng.range(0, 6.28), dirn = rng.sign();
    for (let i = 0; i <= 28; i++) {
      const t = i / 28, a = a0 + dirn * t * turns * Math.PI * 2, r = lerp(7.4, 5.6, t) * helixR;
      helix.push([Math.cos(a) * r, lerp(-2.5, 38.5, Math.pow(t, 0.9)), lerp(-84, -112, t) + Math.sin(a) * r * 1.25]);
    }
    {
      const aE = a0 + dirn * turns * Math.PI * 2;
      for (let i = 1; i <= 16; i++) {
        const t = i / 16, a = aE + dirn * t * 2 * Math.PI * 2;
        helix.push([Math.cos(a) * 6.4, 39 + 1.6 * Math.sin(t * 9), lerp(-112, -136, t) + Math.sin(a) * 6.4 * 1.3]);
      }
      helix.push([5 * dirn, 43, -152]);
    }
    const DOVE_U = 0.36, DOVE_V = 12.5;
    const doves = F.makeFlock({ rng: rng.fork('doves'), species: 'gulls', count: nDoves, size: 1.8, speed: DOVE_V, form: 'loose', spread: [2.4, 1.6, 12], wander: [1.1, 0.7, 1.1, 0.5],
      flap: 4.4, amp: 0.78, glide: 0.14, route: helix, closed: false, start: 0, light: { ...birdLight, sunIntensity: 3.2, skyIntensity: 1.3, groundIntensity: 1.0 },
      // THE CLEAR AIR ROUND THE LINE. These doves do not travel on the clock: the climb below drives them from the journey itself,
      // `doves.update(dt, min(max(0, u - DOVE_U) * DUR, DOVE_T))`, so they are released ahead of the camera once and climb in front
      // of it, and a place of their helix meets a place of the flown line at ONE moment or at none. `ofU` says exactly that sum to
      // the kit, which writes it on the mesh for the counter outside; the travel is unchanged and no pixel moves for it. Read blind
      // to time the deal looked 0.19 m off the line, and both forms of the kit's own clearing were tried on 14 Oct against that
      // reading: the per bird form sent single doves thirty metres off and emptied the nave of them, and the eased course shift
      // (6.6 m) carried the whole flight off the rose window. If the counter still finds a pair under two metres with the keying
      // read, the mend is a hand on the helix itself, holding its arc over the window and giving way where it passes the lens.
      ofU: { from: DOVE_U, dur: DUR, holdOfL: 1.15 },

      body: '#f3f0e8', belly: '#ffffff', wingC: '#ebe8e0', trail: '#f6f4ee', tip: '#d2ccc2', beak: '#d28a6a', head: '#f8f6f0' });
    doves.object.visible = false;
    scene.add(doves.object);
    await ctx.yield();
    const DOVE_T = (doves.route ? doves.route.length : 290) * 1.15 / DOVE_V;      // never wrap round to a second release
    const sparrows = F.makeFlock({ rng: rng.fork('sparrows'), species: 'swifts', count: nSparrows, size: 2.0, speed: 10.5, form: 'loose', spread: [2.4, 2, 13], wander: [1.4, 1.1, 1.4, 0.8],
      route: [[-6, 24, -14], [-7, 27, -44], [-5, 23, -70], [3.5, 26, -78], [7, 24.5, -52], [6, 28, -22]], closed: true, light: birdLight, glide: 0.3,
      body: '#5c4732', belly: '#bcab92', wingC: '#4a3a29', trail: '#6a543c', tip: '#2e241a', head: '#4a3626' });
    scene.add(sparrows.object);
    await ctx.yield();
    // a second party over the choir, wheeling across the axis between the camera and the rose (always >= 4.5 m above the path)
    const choirBirds = F.makeFlock({ rng: rng.fork('choir-birds'), species: 'swifts', count: nChoir, size: 2.1, speed: 9, form: 'loose', spread: [2.2, 1.2, 12], wander: [1.2, 0.7, 1.2, 0.7],
      route: [[-6.5, 32.5, -124], [-6.5, 35, -138], [-2, 36.6, -150], [5.5, 35.5, -153], [7, 32.5, -140], [6, 32, -126], [0, 36.4, -119]], closed: true, start: V(), light: birdLight, glide: 0.3,
      body: '#5c4732', belly: '#bcab92', wingC: '#4a3a29', trail: '#6a543c', tip: '#2e241a', head: '#4a3626' });
    scene.add(choirBirds.object);

    // ------------------------------------------------------------------ frame
    const camP = new THREE.Vector3();
    return {
      scene, path, duration: DUR,
      camera: { fov: 60, near: 0.3, far: 700, lookAhead: 15, sway: 0.5, bank: 0.25 },
      pois: [
        { at: roseC, from: 0.0, to: 0.14, weight: 0.8 },
        { at: new THREE.Vector3(18.5, 2.5, -62), from: 0.17, to: 0.29, weight: 0.3 },
        { at: roseC, from: 0.30, to: 0.78, weight: 0.8 },
      ],
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: family.portal, glow: 0.12, revealDistance: 190 },
      post: { exposure: 1.08, bloom: { strength: 0.38, radius: 0.72, threshold: 1.25 },
        grade: { saturation: 1.12, contrast: 1.04, tint: hexMix('#fbf4ee', '#f2f2ff', hour * 0.6), shadowTint: family.shadow, vignette: 0.4, grain: 0.03, aberration: 0 } },
      update(dt, t, camera, u) {
        time.value = t;
        room.update(dt, t, camera); fur.update(dt, t, camera);
        hero.setProgress(u); hero.update(dt, t, camera);
        // the cone is not depth-tested: only show it while the camera is inside the nave vessel
        camP.setFromMatrixPosition(camera.matrixWorld);
        // ... thin it as the camera closes on the rose, so the haze it looks through does not bleach the glass, and keep it
        // short and faint while the camera is still far down the nave, so the window itself reads as a wheel of colour
        // The beam runs nearly level from the rose down the vessel and the level run flies inside it. Seen from inside, along
        // its own axis, the haze adds up over 40 m: thin it there (the lens wash carries the colour instead), and over the last
        // 30 m so the glass itself stays deep.
        const far = sstep(u, 0.35, 0.55), inside = 1 - sstep(hero.coneOffset(camera), 7, 14);
        hero.setConeGain((1 - sstep(Math.abs(camP.x), 8.4, 10.4)) * (0.3 + 0.7 * sstep(camP.z - ZE, 8, 30)) * lerp(0.25, 1, far) * (1 - 0.86 * inside));
        hero.setConeReach(lerp(24, 68, far));
        hero.setLens(ctx.through ? 0 : 1);                           // the colours of the cone slide over the lens while the camera is in it
        const thin = 1 - 0.62 * sstep(u, 0.56, 0.72);
        for (let i = 0; i < clerShafts.length; i++) clerShafts[i].u.value = clerShafts[i].base * thin;
        for (let i = 0; i < censers.length; i++) {
          const c = censers[i], th = c.amp * Math.sin(c.w * t + c.ph), p = c.pivot.position, sn = Math.sin(th), cs = Math.cos(th);
          c.pivot.rotation.z = th;
          c.smoke.uniforms.uBase.value.set(p.x + sn * CH * 0.5, p.y - cs * CH + 0.7, p.z);
          embers.setPosition(i, p.x + sn * CH, p.y - cs * CH + 0.15, p.z);
        }
        set.update(dt, t, camera);
        doves.object.visible = u > DOVE_U;                           // the release is keyed to the journey, not the clock
        doves.update(dt, Math.min(Math.max(0, u - DOVE_U) * DUR, DOVE_T), camera);
        sparrows.update(dt, t, camera); choirBirds.update(dt, t, camera);
      },
      dispose() { censerGeo.dispose(); if (hero.dispose) hero.dispose(); if (room.dispose) room.dispose(); if (fur.dispose) fur.dispose(); },
    };
  },
};
