// THE FILIGREE PALACE: hero set piece of "shadow-theatre" (The Lamp-Lit Caravan).
//
// A cut-paper palace built as five nested vertical flats of 0.3 m card standing 20 m apart
// (local z = +40, +20, 0, -20, -40; front toward +Z, the lamp-sun is expected behind it at -Z).
// Each flat is a skyline of towers, onion domes, minarets and crenellated walls, pierced with
// star / arch / lattice / roundel windows that are backed with glowing gel. The front four flats are
// split down the middle and slide apart sideways (30 m each way, one after another) to uncover the
// fifth: a horseshoe-arch gate 12.6 m wide at the jambs (15.2 m at the bow) ringed with three bands of
// cut lace, which holds the portal. A 9 m peacock to the right of the gate fans its pierced tail,
// two pairs of slit-fan fountains shimmer before the front flat, brass-lined slots run in the floor.
//
// SIZE     about 200 m wide closed (260 m with the wings open), 132 m tall, 81 m deep.
//          radius 105, height 132, center (0, 52, 0).
// COST     ~40k triangles, 1 draw call, 1 ShaderMaterial, no lights, no textures, ~60 ms build.
// LIGHT    Unlit, self-shaded cut-paper style: it ignores scene lights. Faces toward +Z are
//          near-black silhouette (tinted paler/bluer per layer), faces toward -Z are warm lit
//          card with battens, pencil lines and tape; card edges and cut rims are warm; gels are
//          emissive (x2.2 to x3, bloom). Wants a bright warm backdrop behind it (-Z). Scene fog is
//          supported but the style prefers none (depth comes from the per-layer tint).
// OPTS     palette   [gold, amber, vermilion, magenta, teal, ink, turquoise] hex strings
//          progress  initial opening 0..1 (default 0)
//          autoDemo  true (default): until setProgress() is first called the palace opens and
//                    closes on a slow 24 s loop so it can be judged in the part viewer
//          glow      gel emissive multiplier (default 2.2; the gate lace gets x1.4 on top). Small motifs are
//                    filtered wider with distance (fwidth of the motif coordinate) so they do not alias.
//          layerBase tint index of the front flat (default 0; each flat adds 1)
// PROGRESS hero.setProgress(u), u 0..1 (drive it from path progress, e.g. remap(u, .82, .97)):
//          flat i (0 = front) slides during u in [0.2 i, 0.2 i + 0.4]; the peacock fans its tail
//          over u 0.5..1. hero.setFlicker(f) multiplies everything by the world's lamp flicker.
// ANCHORS  (local space)
//          portalSeat   { position (0, 9.5, -40), facing (0,0,1), radius 7 } centre of the gate arch
//          flyThrough   ordered points down the axis from 170 m in front to the portal; clear by
//                       >= 6 m once progress >= 0.9 at the first flat (wings stand 30 m either side)
//          viewpoints   { front, threeQuarter, between, behind } good camera positions
//          flatZ        z of the five flats, front to back;  slide: 30
//          lampAxis     where the lamp-sun centre should sit behind the gate (0, 45, -190)
//          peacock      base of the peacock;  fountains  bases of the four fountains
// NOTE     vDim / vInfo / vLay are flat varyings on purpose: the window layout hashes the per-piece seed, and a
//          hash of an interpolated value differs by an ulp from pixel to pixel, which scrambles the panels.
// STYLE    (for the world coder) every flat is: front face = uInk mixed 6% + 7% per layer toward
//          amber->teal; back face = cream card 0.5 albedo; side walls = cream 1.0 (the "rim");
//          a 0.3 m ribbon just inside every cut edge at amber x1.3, widened with distance to
//          stay ~1.5 px; windows are SDF motifs filled with gel colour x2.2 (uGlow) with a per-cell twinkle, plus a soft spill on the card around them.
import * as THREE from 'three';

const TAU = Math.PI * 2;
const DEF_PALETTE = ['#FBE2A0', '#F2A541', '#D9512C', '#8E2A5A', '#1E4C6B', '#0A0608', '#6FE3D0'];
const FLAT_Z = [40, 20, 0, -20, -40];
const SLIDE = 30;

// ---------- geometry writer ----------
function makeWriter() {
  const W = { pos: [], aL: [], aDim: [], aInfo: [], aLay: [], aRot: [], aN: [], idx: [], n: 0 };
  W.v = (x, y, z, lx, ly, dim, style, hue, seed, side, lay, slide, rot, nx, ny) => {
    W.pos.push(x, y, z); W.aL.push(lx, ly); W.aDim.push(dim[0], dim[1], dim[2], dim[3] || 0);
    W.aInfo.push(style, hue, seed, side); W.aLay.push(lay, slide);
    if (rot) W.aRot.push(rot[0], rot[1], rot[2], rot[3]); else W.aRot.push(0, 0, 0, 0);
    W.aN.push(nx || 0, ny || 0);
    return W.n++;
  };
  return W;
}

// One cut-out: pts = outline [[x,y],...] in piece-local metres (axis x = 0, base y = 0).
function addPiece(W, P) {
  let pts = P.pts, ox = P.ox || 0, slide = P.slide || 0;
  const oy = P.oy || 0, z = P.z, th = P.thick ?? 0.3, dim = P.dim || [1, 1, 1, 0];
  const style = P.style || 0, hue = P.hue || 0, seed = P.seed || 0, lay = P.lay || 0, rot = P.rot || null;
  if (P.mirror) { pts = pts.map((p) => [-p[0], p[1]]).reverse(); ox = -ox; slide = -slide; }
  // drop duplicate points
  const cl = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = cl.length ? cl[cl.length - 1] : null;
    if (!b || Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) > 1e-3) cl.push(a);
  }
  if (cl.length > 2 && Math.abs(cl[0][0] - cl[cl.length - 1][0]) + Math.abs(cl[0][1] - cl[cl.length - 1][1]) < 1e-3) cl.pop();
  pts = cl;
  const n = pts.length; if (n < 3) return;
  let area = 0;
  for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; area += a[0] * b[1] - b[0] * a[1]; }
  if (area < 0) pts = pts.slice().reverse();
  const contour = pts.map((p) => new THREE.Vector2(p[0], p[1]));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  const zf = z + th / 2, zb = z - th / 2;
  const put = (p, zz, side, nx, ny) => W.v(ox + p[0], oy + p[1], zz, p[0], p[1], dim, style, hue, seed, side, lay, slide, rot, nx, ny);
  const f0 = W.n; for (let i = 0; i < n; i++) put(pts[i], zf, 0);
  const b0 = W.n; for (let i = 0; i < n; i++) put(pts[i], zb, 1);
  for (const t of tris) { W.idx.push(f0 + t[0], f0 + t[1], f0 + t[2]); W.idx.push(b0 + t[0], b0 + t[2], b0 + t[1]); }
  // inward normals (CCW outline: left of the edge is inside)
  const nrm = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i + n - 1) % n], b = pts[i], c = pts[(i + 1) % n];
    let e1x = b[0] - a[0], e1y = b[1] - a[1], e2x = c[0] - b[0], e2y = c[1] - b[1];
    const l1 = Math.hypot(e1x, e1y) || 1, l2 = Math.hypot(e2x, e2y) || 1;
    e1x /= l1; e1y /= l1; e2x /= l2; e2y /= l2;
    let nx = -e1y - e2y, ny = e1x + e2x; const l = Math.hypot(nx, ny);
    if (l < 0.2) { nx = -e1y; ny = e1x; } else { const m = Math.min(1.8, 2 / l) / l; nx *= m; ny *= m; }
    nrm.push([nx, ny]);
  }
  const rim = P.rim !== false;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n, a = pts[i], b = pts[j];
    if (a[1] + oy < 0.02 && b[1] + oy < 0.02) continue;            // edge standing in the floor slot
    const w0 = put(a, zf, 2), w1 = put(b, zf, 2), w2 = put(b, zb, 2), w3 = put(a, zb, 2);
    W.idx.push(w0, w1, w2, w0, w2, w3);
    if (rim) {
      const r0 = put(a, zf + 0.05, 3), r1 = put(b, zf + 0.05, 3);
      const r2 = put(b, zf + 0.05, 3, nrm[j][0], nrm[j][1]), r3 = put(a, zf + 0.05, 3, nrm[i][0], nrm[i][1]);
      W.idx.push(r0, r1, r2, r0, r2, r3);
    }
  }
}

// ---------- outline profiles: right-hand polyline from (hw, 0) up to the axis (0, H) ----------
function arc(out, cx, cy, r, a0, a1, steps, sx = 1) {
  for (let i = 0; i <= steps; i++) { const a = a0 + (a1 - a0) * (i / steps); out.push([cx + Math.cos(a) * r * sx, cy + Math.sin(a) * r]); }
}
function finial(out, y0, s) {           // spike, two balls, needle; ends on the axis
  out.push([0.32 * s, y0], [0.32 * s, y0 + 1.0 * s]);
  arc(out, 0, y0 + 1.9 * s, 0.95 * s, -1.2, 1.2, 6);
  out.push([0.24 * s, y0 + 3.1 * s]);
  arc(out, 0, y0 + 3.7 * s, 0.55 * s, -1.1, 1.1, 4);
  out.push([0.14 * s, y0 + 4.6 * s], [0, y0 + 7.0 * s]);
  return y0 + 7.0 * s;
}
function capOnion(out, y0, R, capH, steps = 22) {
  for (let i = 0; i <= steps; i++) {
    const s = i / steps, u = 0.8 * (1 - s);
    let x = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.9)), 0.8) * (0.3 + 0.7 * Math.min(1, u / 0.42) ** 1.5);
    out.push([Math.max(0.34, R * x), y0 + capH * s]);
  }
  return y0 + capH;
}
function capPointed(out, y0, R, capH, steps = 16) {   // pointed (ogival) dome
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 0.5;
    out.push([Math.max(0.34, R * Math.pow(Math.cos(a), 0.72)), y0 + capH * Math.pow(Math.sin(a), 0.9)]);
  }
  return y0 + capH;
}
function capBell(out, y0, R, capH, steps = 14) {      // concave tented roof (chhatri)
  for (let i = 0; i <= steps; i++) { const s = i / steps; out.push([Math.max(0.34, R * (1.12 - s) * (1 - 0.55 * Math.sin(s * Math.PI * 0.5)) / 1.12 * 1.1), y0 + capH * s]); }
  return y0 + capH;
}
// tower with plinth, cornice, drum and a dome; returns { pts, bodyH, H }
function profileTower(hw, bodyH, capKind, capH, bulge, fs) {
  const o = [[hw + 0.6, 0], [hw + 0.6, 1.3], [hw, 1.9], [hw, bodyH - 1.5], [hw + 0.8, bodyH - 1.0], [hw + 0.8, bodyH - 0.2], [hw + 0.3, bodyH]];
  const dr = hw * 0.8, dh = Math.max(1.2, capH * 0.12);
  o.push([dr, bodyH], [dr, bodyH + dh * 0.7], [dr + 0.35, bodyH + dh * 0.8], [dr + 0.35, bodyH + dh]);
  let y;
  if (capKind === 0) y = capOnion(o, bodyH + dh, hw * bulge, capH);
  else if (capKind === 1) y = capPointed(o, bodyH + dh, dr + 0.35, capH * 0.8);
  else y = capBell(o, bodyH + dh, hw + 1.2, capH * 0.7);
  const H = finial(o, y, fs);
  return { pts: o, bodyH, H };
}
// crenellated curtain wall; vertical ends so that it abuts its neighbours
function profileWall(hw, bodyH, stepped) {
  const tw = 1.7, gap = 1.5, mh = 2.4, top = [];
  let x = 0, tooth = true;                       // from the axis outward, then reversed
  top.push([0, bodyH + mh]);
  x = tw / 2;
  while (x < hw - 0.4) {
    if (tooth) { if (stepped) top.push([x - 0.45, bodyH + mh], [x - 0.45, bodyH + mh * 0.55], [x, bodyH + mh * 0.55]); else top.push([x, bodyH + mh]); top.push([x, bodyH]); x += gap; }
    else { top.push([x, bodyH]); if (stepped) top.push([x, bodyH + mh * 0.55], [x + 0.45, bodyH + mh * 0.55], [x + 0.45, bodyH + mh]); else top.push([x, bodyH + mh]); x += tw; }
    tooth = !tooth;
  }
  top.push([hw, tooth ? bodyH + mh : bodyH]);
  const o = [[hw, 0]]; for (let i = top.length - 1; i >= 0; i--) o.push(top[i]);
  return { pts: o, bodyH, H: bodyH + mh };
}
// slender minaret with two balconies, a lantern and a small onion
function profileMinaret(hw, H0, fs) {
  const o = [[hw * 1.5, 0], [hw * 1.5, 2.5], [hw * 1.1, 3.6]];
  const b1 = H0 * 0.5, b2 = H0 * 0.76, top = H0 * 0.86;
  const balc = (y, w0, w1) => { o.push([w0, y - 2.2], [w0 + 0.5, y - 1.6], [w0 * 1.9 + 0.3, y - 0.5], [w0 * 1.9 + 0.3, y + 0.9], [w0 * 1.9 - 0.1, y + 0.9], [w0 * 1.9 - 0.1, y + 0.3], [w1, y + 0.3]); };
  balc(b1, hw, hw * 0.86); balc(b2, hw * 0.8, hw * 0.62);
  o.push([hw * 0.62, top - 0.8], [hw * 1.05, top - 0.4], [hw * 1.05, top]);
  const y = capOnion(o, top, hw * 1.0, H0 * 0.085, 12);
  const H = finial(o, y, fs);
  return { pts: o, bodyH: b2 - 2.4, H };
}
const fullOutline = (prof) => {            // symmetric outline from a right-hand profile
  const o = prof.slice();
  for (let i = prof.length - 1; i >= 0; i--) if (prof[i][0] > 1e-4) o.push([-prof[i][0], prof[i][1]]);
  return o;
};
const halfOutline = (prof) => { const o = prof.slice(); o.push([0, 0]); return o; };   // right half, seam on the axis
function crescent(r) {
  const o = [], d2r = Math.PI / 180;
  arc(o, 0, 0, r, 53.4 * d2r, -233.4 * d2r, 18);
  arc(o, 0, 0.3 * r, 0.78 * r, -220.1 * d2r, 40.1 * d2r, 14);
  return o;
}
function stripOutline(cs, ws) {            // outline of a tapered ribbon along a centre line
  const L = [], R = [];
  for (let i = 0; i < cs.length; i++) {
    const a = cs[Math.max(0, i - 1)], b = cs[Math.min(cs.length - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    L.push([cs[i][0] - dy * ws[i], cs[i][1] + dx * ws[i]]); R.push([cs[i][0] + dy * ws[i], cs[i][1] - dx * ws[i]]);
  }
  return L.concat(R.reverse());
}

function pennant(len) {                    // swallow-tailed pennant flying toward +x from a pin at x = 0
  const o = [], n = 8;
  for (let i = 0; i <= n; i++) { const t = i / n; o.push([t * len, 0.75 * (1 - 0.45 * t)]); }
  o.push([len * 0.8, 0]);
  for (let i = n; i >= 0; i--) { const t = i / n; o.push([t * len, -0.75 * (1 - 0.45 * t)]); }
  return o;
}
// timber braces standing behind a flat (in the YZ plane), seen once the camera is between the sheets
function addBrace(W, x, z, hB, lay, slide) {
  const d = [1, 1, 1, 0], foot = hB * 0.42, zb = z - 0.15;
  const strip = (y0, z0, y1, z1, hw) => {
    let dy = y1 - y0, dz = z1 - z0; const l = Math.hypot(dy, dz) || 1; const ny = -dz / l * hw, nz = dy / l * hw;
    const a = W.v(x, y0 + ny, z0 + nz, 0, 0, d, 0, 0, 0, 5, lay, slide), b = W.v(x, y1 + ny, z1 + nz, 0, 0, d, 0, 0, 0, 5, lay, slide);
    const c = W.v(x, y1 - ny, z1 - nz, 0, 0, d, 0, 0, 0, 5, lay, slide), e = W.v(x, y0 - ny, z0 - nz, 0, 0, d, 0, 0, 0, 5, lay, slide);
    W.idx.push(a, b, c, a, c, e);
  };
  strip(0.25, zb - 0.3, hB, zb - 0.3, 0.3);
  strip(0.45, zb, 0.45, zb - foot, 0.25);
  strip(hB * 0.92, zb - 0.3, 0.45, zb - foot, 0.22);
  strip(hB * 0.5, zb - 0.3, 0.45, zb - foot * 0.52, 0.16);
}

// ---------- layout ----------
const HALF_W = [100, 90, 78, 64, 72];
const H_MAX = [31, 52, 74, 97, 0];

function buildSplitFlat(W, k, rng, V) {
  const z = FLAT_Z[k], lay = V.layerBase + k, slide = k + 1, halfW = HALF_W[k], hmax = H_MAX[k] * rng.range(0.94, 1.04);
  const pieces = [];
  const hues = () => rng.pick(V.hues);
  // centre mass, split by the seam
  const hwC = 13 + k * 2.2 + rng.range(-1, 2);
  {
    const capKind = V.capBias[k % V.capBias.length];
    const capH = hmax * (capKind === 0 ? 0.36 : 0.3);
    const fs = 0.7 + k * 0.12;
    const bodyH = hmax - capH * (capKind === 0 ? 1 : 0.8) - Math.max(1.2, capH * 0.12) - 7 * fs;
    const t = profileTower(hwC, bodyH, capKind, capH, rng.range(1.02, 1.14), fs);
    pieces.push({ pts: halfOutline(t.pts), ox: 0, dim: [hwC, t.bodyH, t.H, 2 + (k < 2 ? 1 : 0)], style: 1, hue: hues(), seed: rng.range(1, 90) });
  }
  let x = hwC, i = 0, lastTower = false;
  while (x < halfW - 3) {
    const f = x / halfW, env = hmax * (1 - 0.5 * Math.pow(f, 1.35));
    const left = halfW - x;
    if (i % 2 === 0 && left > 16) {                     // curtain wall
      const w = Math.min(left - 10, rng.range(10, 19)), hw = w / 2;
      const bodyH = env * rng.range(0.4, 0.54) + (k === 0 ? 3 : 0);
      const t = profileWall(hw, bodyH, rng.chance(0.5));
      pieces.push({ pts: fullOutline(t.pts), ox: x + hw, dim: [hw, t.bodyH, t.H, (k < 3 && rng.chance(k === 0 ? 0.9 : 0.5)) ? 1 : 0], style: 1, hue: hues(), seed: rng.range(1, 90) });
      if (w > 12) { const kq = profileTower(rng.range(1.5, 2.0), rng.range(3, 4.5), 2, rng.range(4, 5.5), 1, 0.3); pieces.push({ pts: fullOutline(kq.pts), ox: x + hw, oy: t.bodyH, dim: [1, 1, 1, 0], style: 0 }); }
      x += w; lastTower = false;
    } else if (!lastTower && rng.chance(V.minaretP) && k > 0 && left > 8) {   // minaret
      const hw = rng.range(2.0, 2.7), H0 = Math.min(hmax * 1.12, env * rng.range(1.15, 1.35));
      const t = profileMinaret(hw, H0, 0.55);
      pieces.push({ pts: fullOutline(t.pts), ox: x + hw * 1.5, dim: [hw, t.bodyH, t.H, 0], style: 1, hue: hues(), seed: rng.range(1, 90), top: 1 });
      x += hw * 3; lastTower = true;
    } else {                                            // domed tower
      const hw = Math.min(left / 2, rng.range(4.2, 6.8) + k * 0.5), H0 = env * rng.range(0.78, 0.98);
      const capKind = rng.chance(0.55) ? V.capBias[(k + i) % V.capBias.length] : rng.int(0, 2);
      const capH = Math.min(H0 * 0.4, hw * rng.range(2.2, 3.0)), fs = 0.5 + hw * 0.05;
      const bodyH = Math.max(8, H0 - capH - 7 * fs);
      const t = profileTower(hw, bodyH, capKind, capH, rng.range(1.0, 1.15), fs);
      pieces.push({ pts: fullOutline(t.pts), ox: x + hw, dim: [hw, t.bodyH, t.H, 0], style: 1, hue: hues(), seed: rng.range(1, 90), flag: rng.chance(0.6) ? rng.range(4, 7.5) : 0 });
      x += hw * 2; lastTower = true;
    }
    i++;
  }
  for (let j = 0; j < 4; j++) {
    const bx = halfW * (0.14 + 0.25 * j), hB = (8 + k * 6.5) * (1 - 0.15 * j);
    addBrace(W, bx, z, hB, lay, slide); addBrace(W, -bx, z, hB, lay, -slide);
  }
  for (const p of pieces) {
    const base = { ...p, z, lay, slide };
    addPiece(W, { ...base });
    addPiece(W, { ...base, mirror: true });
    if (p.top) {
      const c = { pts: crescent(1.1), ox: p.ox, oy: p.dim[2] + 0.5, z, lay, slide, dim: [1, 1, 1, 0], style: 0 };
      addPiece(W, c); addPiece(W, { ...c, mirror: true });
    }
    if (p.flag) {
      const c = { pts: pennant(p.flag), ox: p.ox, oy: p.dim[2] - 1.6, z, lay, slide, dim: [1, 1, 1, 0], style: 5, seed: p.seed, thick: 0.1 };
      addPiece(W, c); addPiece(W, { ...c, mirror: true });
    }
  }
}

// the fifth flat: fixed, holds the lace gate under the grand dome
function buildGateFlat(W, rng, V) {
  const z = FLAT_Z[4], lay = V.layerBase + 4;
  const hw = 26 + rng.range(-1, 1.5), bodyH = 60 + rng.range(-3, 3), fs = 1.5;
  const capH = rng.range(48, 55);                 // the grand dome is always an onion; its swell varies
  const t = profileTower(hw, bodyH, 0, capH, rng.range(1.02, 1.2), fs);
  // outline with the horseshoe gate notched out of the base
  const o = [[6.3, 0]].concat(t.pts);
  for (let i = t.pts.length - 1; i >= 0; i--) if (t.pts[i][0] > 1e-4) o.push([-t.pts[i][0], t.pts[i][1]]);
  o.push([-6.3, 0]);
  const a0 = Math.atan2(-4.25, -6.3), a1 = Math.atan2(-4.25, 6.3);
  arc(o, 0, 9.5, 7.6, a0, a1 - TAU, 40);       // over the top, left to right
  addPiece(W, { pts: o, ox: 0, z, lay, dim: [hw, t.bodyH, t.H, 0], style: 2, hue: 0, seed: rng.range(1, 90) });
  addPiece(W, { pts: crescent(2.4), ox: 0, oy: t.H + 1.6, z, lay, style: 0 });
  // flanks
  const pieces = [];
  let x = hw;
  const wall = (w, h, arc_) => { const p = profileWall(w / 2, h, true); pieces.push({ pts: fullOutline(p.pts), ox: x + w / 2, dim: [w / 2, p.bodyH, p.H, arc_ ? 1 : 0], style: 1, hue: rng.pick(V.hues), seed: rng.range(1, 90) }); x += w; };
  const tower = (thw, H0, kind) => { const cH = Math.min(H0 * 0.4, thw * 2.7), f = 0.5 + thw * 0.05; const p = profileTower(thw, H0 - cH - 7 * f, kind, cH, 1.12, f); pieces.push({ pts: fullOutline(p.pts), ox: x + thw, dim: [thw, p.bodyH, p.H, 0], style: 1, hue: rng.pick(V.hues), seed: rng.range(1, 90) }); x += thw * 2; };
  const minaret = (mhw, H0) => { const p = profileMinaret(mhw, H0, 0.8); pieces.push({ pts: fullOutline(p.pts), ox: x + mhw * 1.5, dim: [mhw, p.bodyH, p.H, 0], style: 1, hue: rng.pick(V.hues), seed: rng.range(1, 90), top: 1 }); x += mhw * 3; };
  for (const bx of [22, 38, 55, 68]) { addBrace(W, bx, z, 30 - bx * 0.2, lay, 0); addBrace(W, -bx, z, 30 - bx * 0.2, lay, 0); }
  wall(rng.range(9, 13), rng.range(40, 48), false);
  minaret(rng.range(3.0, 3.5), rng.range(114, 122));
  wall(rng.range(10, 14), rng.range(30, 38), true);
  tower(rng.range(5.5, 7), rng.range(56, 68), rng.int(0, 1));
  if (x < 70) wall(72 - x, rng.range(20, 26), true);
  for (const p of pieces) {
    addPiece(W, { ...p, z, lay }); addPiece(W, { ...p, z, lay, mirror: true });
    if (p.top) { const c = { pts: crescent(1.5), ox: p.ox, oy: p.dim[2] + 0.7, z, lay, style: 0 }; addPiece(W, c); addPiece(W, { ...c, mirror: true }); }
  }
  return { hw, H: t.H + 4 };
}

// fountains: basin, stem and a scalloped fan whose slit lines shimmer in the shader
function buildFountains(W, rng, V) {
  const out = [];
  const xs = [rng.range(24, 30), rng.range(58, 66)];
  xs.forEach((fx, n) => {
    const R = n === 0 ? 10.5 : 8, lobes = 9;
    const o = [[R * 0.55, 0], [R * 0.55, 0.9], [R * 0.62, 1.2], [R * 0.62, 1.7], [0.9, 2.1], [0.9, 2.6]];
    for (let i = 0; i <= 44; i++) {
      const a = -1.35 + (1.35 * i) / 44;                  // angle from vertical, right side
      const r = R * (0.94 + 0.06 * Math.abs(Math.cos(a * lobes)));
      o.push([Math.max(0, -Math.sin(a) * r), 2.6 + Math.cos(a) * r]);
    }
    const P = { pts: fullOutline(o), ox: fx, z: FLAT_Z[0] + 8 + n * 1.5, lay: V.layerBase - 1, dim: [R, 2.6, R + 2.6, 0], style: 3, hue: 0, seed: rng.range(1, 90) };
    addPiece(W, P); addPiece(W, { ...P, mirror: true });
    out.push(new THREE.Vector3(fx, 0, P.z), new THREE.Vector3(-fx, 0, P.z));
  });
  return out;
}

// the peacock: jointed card bird with a tail of pierced feathers that fans open with progress
function buildPeacock(W, rng, V) {
  const px = 20, z = FLAT_Z[4] + 6, lay = V.layerBase + 3.4;
  const piv = [px + 1.2, 4.3], NF = 17, FH = 11.5, fhw = 1.0;
  for (let j = 0; j < NF; j++) {
    const s = j / (NF - 1), o = [];
    const len = FH * (0.82 + 0.18 * Math.sin(s * Math.PI)) * rng.range(0.96, 1.03);
    for (let i = 0; i <= 14; i++) { const t = i / 14; o.push([fhw * (0.1 + 0.9 * Math.pow(Math.sin(Math.PI * Math.pow(t, 1.7)), 0.8)), t * len]); }
    const open = -1.38 + 2.76 * s + rng.range(-0.02, 0.02);
    const closed = -1.78 + (s - 0.5) * 0.3;
    addPiece(W, { pts: fullOutline(o), ox: piv[0], oy: piv[1], z: z - 0.6 + j * 0.035, thick: 0.08, lay, dim: [fhw, len, len, 0], style: 4, hue: j % 2, seed: 3 + j,
      rot: [piv[0], piv[1], closed || 1e-4, open || 1e-4] });
  }
  const solid = (pts, zz = z) => addPiece(W, { pts, ox: 0, oy: 0, z: zz, lay, style: 0, thick: 0.2 });
  const body = []; arc(body, px + 0.2, 4.7, 1.75, 0, TAU * 0.999, 22, 1.45);
  solid(body.map(([x, y]) => [x + (y - 4.7) * -0.35, y]));
  solid(stripOutline([[px - 1.3, 5.2], [px - 2.0, 6.4], [px - 2.1, 7.5], [px - 1.7, 8.3], [px - 1.9, 8.9]], [0.95, 0.6, 0.42, 0.36, 0.3]), z + 0.03);
  const head = []; arc(head, px - 2.0, 8.95, 0.62, 0, TAU * 0.999, 12); solid(head, z + 0.06);
  solid([[px - 2.5, 9.15], [px - 3.6, 8.75], [px - 2.5, 8.7]], z + 0.06);
  for (let c = 0; c < 3; c++) {
    const a = 1.2 + c * 0.38, tx = px - 2.0 + Math.cos(a) * 1.9, ty = 9.3 + Math.sin(a) * 1.7;
    solid(stripOutline([[px - 2.0, 9.4], [tx, ty]], [0.07, 0.07]), z + 0.02);
    const dot = []; arc(dot, tx, ty, 0.27, 0, TAU * 0.999, 8); solid(dot, z + 0.02);
  }
  solid(stripOutline([[px - 0.2, 3.4], [px - 0.5, 1.6], [px - 0.6, 0]], [0.2, 0.12, 0.1]), z + 0.02);
  solid(stripOutline([[px + 0.9, 3.3], [px + 0.9, 1.6], [px + 0.7, 0]], [0.2, 0.12, 0.1]), z + 0.02);
  solid([[px - 1.5, 0], [px + 1.6, 0], [px + 1.6, 0.25], [px - 1.5, 0.25]], z + 0.02);
  return new THREE.Vector3(px, 0, z);
}

// brass-lined slots in the stage floor, one under each flat
function buildSlots(W, V) {
  for (let k = 0; k < 5; k++) {
    const z = FLAT_Z[k], x0 = -(HALF_W[k] + SLIDE + 12), x1 = -x0, hw = 0.9, y = 0.3;
    const d = [1, 1, 1, 0], l = V.layerBase + k;
    const a = W.v(x0, y, z - hw, x0, -hw, d, 0, 0, 0, 4, l, 0), b = W.v(x1, y, z - hw, x1, -hw, d, 0, 0, 0, 4, l, 0);
    const c = W.v(x1, y, z + hw, x1, hw, d, 0, 0, 0, 4, l, 0), e = W.v(x0, y, z + hw, x0, hw, d, 0, 0, 0, 4, l, 0);
    W.idx.push(a, c, b, a, e, c);
  }
}

// ---------- shaders ----------
const VERT = /* glsl */`
attribute vec2 aL; attribute vec4 aDim; attribute vec4 aInfo; attribute vec2 aLay; attribute vec4 aRot; attribute vec2 aN;
uniform float uProgress, uTime, uFan, uSlide;
varying vec2 vL; flat varying vec4 vDim; flat varying vec4 vInfo; flat varying vec2 vLay; varying vec3 vW; varying float vFace; varying float vRim;
#include <fog_pars_vertex>
void main() {
  vec3 p = position;
  vL = aL; vDim = aDim; vInfo = aInfo; vLay = aLay; vW = position;
  vec4 mv0 = modelViewMatrix * vec4(p, 1.0);
  if (aN.x != 0.0 || aN.y != 0.0) {                 // rim ribbon: keep about 1.5 px wide
    float w = max(0.3, -mv0.z * 0.0016);
    p.xy += aN * w; vL += aN * w; 
  }
  vRim = clamp(0.3 / max(0.3, -mv0.z * 0.0016), 0.3, 1.0);
  if (aInfo.x > 4.5) {                              // pennants on pins
    float f = abs(aL.x);
    p.y += sin(f * 0.75 - uTime * 3.0 + aInfo.z) * 0.11 * f + sin(uTime * 1.1 + aInfo.z) * 0.05 * f;
  }
  if (aRot.z != 0.0 || aRot.w != 0.0) {             // pinned parts (peacock tail)
    float a = mix(aRot.z, aRot.w, uFan) + sin(uTime * 1.3 + aRot.w * 5.0) * (0.012 + 0.02 * uFan);
    vec2 d = p.xy - aRot.xy; float c = cos(a), s = sin(a);
    p.xy = aRot.xy + vec2(c * d.x - s * d.y, s * d.x + c * d.y);
  }
  float sc = aLay.y;
  if (sc != 0.0) {
    float i = abs(sc) - 1.0;
    float o = clamp((uProgress - i * 0.2) / 0.4, 0.0, 1.0); o = o * o * (3.0 - 2.0 * o);
    p.x += sign(sc) * uSlide * o;
    p.x += sin(uTime * 0.7 + i * 2.1) * 0.03;       // the slight wobble of a hand-worked flat
  }
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  // which way the camera sees this flat: + from the front (+Z side), - from the lamp side
  vec3 camL = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
  vFace = camL.z - p.z;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FRAG = /* glsl */`
uniform vec3 uInk, uAmber, uTeal, uCream, uGold; uniform vec3 uGel[4];
uniform float uTime, uFlick, uGlow;
varying vec2 vL; flat varying vec4 vDim; flat varying vec4 vInfo; flat varying vec2 vLay; varying vec3 vW; varying float vFace; varying float vRim;
#include <fog_pars_fragment>
const float TAU = 6.2831853;
float h11(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float sdStar8(vec2 p, float r) { vec2 a = abs(p); vec2 q = abs(vec2(p.x + p.y, p.x - p.y)) * 0.7071;
  return min(max(a.x, a.y), max(q.x, q.y)) - r; }
float sdArch(vec2 p, float w, float h) { p.x = abs(p.x);
  float box = max(p.x - w, max(-p.y, p.y - h));
  return min(box, length(p - vec2(0.0, h + 0.3 * w)) - 1.12 * w); }
float sdPoint(vec2 p, float w, float h) { p.x = abs(p.x);          // pointed (two-centred) arch window
  float box = max(p.x - w, max(-p.y, p.y - h));
  float og = max(length(p - vec2(-w * 0.55, h)) - w * 1.55, -(p.y - h));
  return min(box, og); }
vec2 gCC; float gOpen; float gSel;

float bodyWin(vec2 L, vec4 dim, float seed, out float id) {
  float hw = dim.x, bodyH = dim.y, H = dim.z;
  bool arcade = mod(dim.w, 2.0) > 0.5; bool halfP = dim.w > 1.5;
  id = 0.0; gOpen = 0.0; gCC = L;
  float mx = hw < 3.6 ? 0.7 : 1.3; float W = hw - mx; float d = 1e3;
  float ah = arcade ? min(13.0, bodyH * 0.55) : 2.2;
  if (abs(L.x) < W && L.y < bodyH - 1.8) {
    if (L.y < ah) {
      if (arcade) {
        float uh = ah - 1.2;
        float nc = max(1.0, floor(2.0 * W / (uh * 0.72))); float cw = 2.0 * W / nc;
        float ci = floor((L.x + W) / cw); float cx = (ci + 0.5) * cw - W;
        float w = min(cw * 0.33, uh * 0.3);
        d = sdArch(vec2(L.x - cx, L.y), w, uh - w * 1.5);
        gCC = vec2(cx, uh * 0.5); gOpen = 1.0;
        if (halfP && abs(cx) < cw * 0.5 + 0.2) d = 1e3;
      }
    } else {
      float span = bodyH - 1.8 - ah;
      float nb = max(1.0, floor(span / (7.0 + 5.0 * h11(seed)) + 0.5)); float bh = span / nb;
      float y = L.y - ah; float bi = min(floor(y / bh), nb - 1.0); float yb = y - bi * bh;
      float bs = floor(h11(seed * 1.7 + bi * 3.1) * 5.3);
      float uh = bh - 1.3; float yy = yb - 0.65;
      if (yy > 0.0 && yy < uh) {
        if (bs < 0.5) {
          float nc = max(1.0, floor(2.0 * W / (3.3 + 2.0 * h11(seed + bi)))); float cw = 2.0 * W / nc;
          float ci = floor((L.x + W) / cw); float cx = (ci + 0.5) * cw - W;
          float w = min(cw * 0.3, uh * 0.2);
          d = sdPoint(vec2(L.x - cx, yy - 0.3), w, uh - 0.6 - w * 1.5);
          d = max(d, -(abs(L.x - cx) - 0.09) * step(1.2, w));             // mullion
          gSel = -1.0;
          id = h21(vec2(ci, bi) + seed); gCC = vec2(cx, ah + bi * bh + bh * 0.5);
          if (halfP && abs(cx) < cw * 0.5 + 0.2) d = 1e3;
        } else if (bs < 1.5) {
          float nr = max(1.0, floor(uh / 3.0)); float ch = uh / nr;
          float nc = max(1.0, floor(2.0 * W / ch)); float cw = 2.0 * W / nc;
          vec2 ci = vec2(floor((L.x + W) / cw), floor(yy / ch));
          vec2 cc = vec2((ci.x + 0.5) * cw - W, (ci.y + 0.5) * ch);
          vec2 p = vec2(L.x, yy) - cc; float r = min(cw, ch) * 0.3;
          d = mod(ci.x + ci.y, 2.0) < 0.5 ? sdStar8(p, r * 0.82) : (abs(p.x) + abs(p.y)) * 0.7071 - r * 0.6;
          id = h21(ci + seed + bi * 7.0); gCC = vec2(cc.x, ah + bi * bh + 0.65 + cc.y);
          if (halfP && abs(cc.x) < cw * 0.5 + 0.2) d = 1e3;
        } else if (bs < 2.5) {
          float c = 2.3; vec2 g = vec2(L.x, yy) / c; vec2 q = fract(g) - 0.5;
          float bars = min(abs(length(q) - 0.37) - 0.075, abs(length(abs(q) - 0.5) - 0.37) - 0.075) * c;
          float box = max(abs(L.x) - (W - 0.3), abs(yy - uh * 0.5) - uh * 0.5 + 0.3);
          if (halfP) box = max(box, 0.45 - abs(L.x));
          d = max(-bars, box);
          id = h11(seed * 2.3 + bi * 5.7);                 // one gel per lattice panel: a calm screen, not confetti
        } else {
          float nc = max(1.0, floor(2.0 * W / uh)); float cw = 2.0 * W / nc;
          float ci = floor((L.x + W) / cw); float cx = (ci + 0.5) * cw - W;
          vec2 p = vec2(L.x - cx, yy - uh * 0.5); float R = min(cw, uh) * 0.41;
          float a = atan(p.x, p.y); float pet = length(p) - R * (0.86 + 0.14 * cos(a * 8.0));
          d = max(pet, -sdStar8(p, R * 0.4));
          d = min(d, length(p) - R * 0.13);
          id = h21(vec2(ci, bi) + seed * 3.0); gCC = vec2(cx, ah + bi * bh + bh * 0.5);
          if (halfP && abs(cx) < cw * 0.5 + 0.2) d = 1e3;
        }
        if (bs > 3.5) d = 1e3;                          // a plain course
      } else if (abs(L.x) < W - 0.5 && (!halfP || abs(L.x) > 0.7)) {   // frieze of pin-pricks between courses
        vec2 p = vec2((fract(L.x / 1.15) - 0.5) * 1.15, yb < 0.65 ? yb - 0.3 : yb - bh + 0.3);
        d = (abs(p.x) + abs(p.y)) - 0.19; gSel = 2.0; id = 0.95;
      }
    }
  } else if (L.y > bodyH + 1.0) {
    float capH = H - bodyH;
    vec2 c = vec2(0.0, bodyH + capH * 0.34), rad = vec2(hw * 0.62, capH * 0.22);
    float s = clamp(hw * 0.3, 1.9, 3.4);
    vec2 ci = floor(L / s); vec2 cc = (ci + 0.5) * s;
    if (length((cc - c) / rad) < 1.0) {
      vec2 p = L - cc;
      d = mod(ci.x + ci.y, 2.0) < 0.5 ? sdStar8(p, s * 0.27) : (abs(p.x) * 1.3 + abs(p.y) * 0.75) - s * 0.3;
      id = h21(ci + seed * 5.0); gCC = cc;
    }
  }
  return d;
}

float laceBand(vec2 q, float r, float th, float rmid, float n, out vec2 p, out float ci) {
  float a = th / TAU * n; ci = floor(a + 0.5);
  p = vec2((a - ci) * TAU * rmid / n, r - rmid);
  float thc = ci * TAU / n;
  return 9.5 + cos(thc) * rmid;                      // height of the cell centre
}
float gateWin(vec2 L, vec4 dim, float seed, out float id) {
  vec2 q = L - vec2(0.0, 9.5); float r = length(q); float th = atan(q.x, q.y);
  float d = 1e3; id = 0.3; gOpen = 0.0; gSel = -1.0; vec2 p; float ci;
  if (r < 21.6) {
    if (r > 8.7 && r < 12.0) {
      float cy = laceBand(q, r, th, 10.35, 24.0, p, ci);
      if (cy > 1.6) { d = max(abs(p.x) * 1.2 + abs(p.y) * 0.72 - 0.86, -(length(p) - 0.2)); gSel = 1.0; id = h11(ci); }
    } else if (r > 12.0 && r < 16.1) {
      float cy = laceBand(q, r, th, 14.1, 26.0, p, ci);
      if (cy > 2.0) { d = max(sdStar8(p, 1.12), -(sdStar8(p, 0.42))); d = min(d, length(p) - 0.22); gSel = 0.0; id = h11(ci + 9.0); }
      float dash = max(abs(r - 12.35) - 0.11, (abs(fract(th / TAU * 60.0) - 0.5) - 0.32) * 1.2);
      if (L.y > 1.0) { if (dash < d) { d = dash; gSel = 2.0; } }
    } else if (r >= 16.1) {
      float cy = laceBand(q, r, th, 18.6, 30.0, p, ci);
      if (cy > 2.4) { d = sdPoint(vec2(p.x, p.y + 1.9), 1.0, 2.3); gSel = mod(ci, 2.0) < 0.5 ? 2.0 : 0.0; id = h11(ci + 17.0); }
      float dash = max(abs(r - 16.35) - 0.11, (abs(fract(th / TAU * 80.0) - 0.5) - 0.32) * 1.2);
      if (L.y > 1.0) { if (dash < d) { d = dash; gSel = 2.0; } }
    }
  } else {
    float idb; float db = bodyWin(L, dim, seed, idb);
    if (length(gCC - vec2(0.0, 9.5)) > 25.5 && gOpen < 0.5) { d = db; id = idb; }
    gOpen = 0.0;
    // one great rose window high in the drum of the dome
    vec2 c = vec2(0.0, dim.y - 12.0); vec2 pr = L - c; float rr = length(pr);
    if (rr < 9.5 && dim.y > 50.0) {
      float a = atan(pr.x, pr.y);
      float pet = max(rr - 7.6 * (0.88 + 0.12 * cos(a * 12.0)), -(rr - 3.1));
      pet = max(pet, -(abs(fract(a / TAU * 12.0 + 0.5) - 0.5) * TAU * rr / 12.0 - 0.16));
      d = min(pet, sdStar8(pr, 2.0)); gSel = rr < 3.0 ? 1.0 : 0.0; id = h11(floor(a / TAU * 12.0 + 0.5) + 3.0);
    } else if (rr < 11.0 && dim.y > 50.0) d = 1e3;
  }
  return d;
}
float fountainWin(vec2 L, vec4 dim, float seed, out float id) {
  vec2 q = L - vec2(0.0, 2.6); float r = length(q); float th = atan(q.x, q.y);
  float n = 19.0; float a = th / 2.7 * n; float ci = floor(a + 0.5);
  float la = (a - ci) * 2.7 * r / n; id = h11(ci + seed);
  float flow = (abs(fract(r * 0.33 - uTime * (0.45 + 0.3 * id) + id * 7.0) - 0.5) - 0.34) * 3.0;
  float d = max(abs(la) - (0.05 + 0.012 * r), flow);
  d = max(d, max(1.6 - r, r - dim.x * 0.9));
  d = max(d, abs(th) - 1.28);
  gSel = 4.0; gOpen = 0.0;
  return d;
}
float featherWin(vec2 L, vec4 dim, float hue, out float id) {
  float hw = dim.x, len = dim.y; vec2 c = vec2(0.0, len * 0.8);
  vec2 p = (L - c) / vec2(1.0, 1.35);
  float eye = max(length(p) - hw * 0.6, -(length(p - vec2(0.0, -0.08)) - hw * 0.26));
  float t = L.y / len; float wv = hw * (0.1 + 0.9 * pow(max(sin(3.14159 * pow(clamp(t, 0.0, 1.0), 1.7)), 0.0), 0.8));
  float sl = (abs(fract((L.y - abs(L.x) * 1.3) / 0.62) - 0.5) - 0.2) * 0.5;
  sl = max(sl, max(0.16 - abs(L.x), abs(L.x) - (wv - 0.22)));
  sl = max(sl, max(len * 0.22 - L.y, L.y - len * 0.66));
  id = 0.2; gOpen = 0.0;
  if (eye < sl) { gSel = hue < 0.5 ? 0.0 : 3.0; return eye; }
  gSel = 2.0; return sl;
}
vec3 gelColour(float id, float hueShift) {
  if (gSel > 3.5) return mix(uGel[0], vec3(1.0), 0.45);
  float k = gSel >= 0.0 ? gSel : mod((id < 0.58 ? 0.0 : id < 0.78 ? 1.0 : id < 0.92 ? 2.0 : 3.0) + hueShift, 4.0);
  return k < 0.5 ? uGel[0] : k < 1.5 ? uGel[1] : k < 2.5 ? uGel[2] : uGel[3];
}

void main() {
  float side = floor(vInfo.w + 0.5), style = floor(vInfo.x + 0.5), lay = vLay.x;
  float fib = vnoise(vW.xy * vec2(0.9, 5.0)) * 0.6 + vnoise(vW.xy * vec2(7.0, 1.3) + 9.0) * 0.4;
  vec3 tintTo = mix(uAmber * 0.55, uTeal * 1.25, smoothstep(0.5, 5.0, lay));
  vec3 ink = mix(uInk, tintTo, clamp(0.06 + 0.07 * lay, 0.0, 0.6)) * (0.8 + 0.4 * fib);
  vec3 col;
  if (side > 4.5) {                                   // timber stage braces behind the flats
    col = mix(uAmber * 0.2, uCream * 0.42, vnoise(vW.yz * vec2(6.0, 0.7))) * (0.7 + 0.5 * fib);
  } else if (side > 3.5) {                            // brass-lined floor slot
    float e = abs(vL.y);
    float brass = smoothstep(0.28, 0.34, e) * (1.0 - smoothstep(0.8, 0.9, e));
    float rivet = smoothstep(0.16, 0.1, length(vec2(fract(vL.x / 3.0) - 0.5, (e - 0.6) / 3.0) * 3.0));
    col = mix(uInk * 0.5, uGold * (0.22 + 0.5 * vnoise(vL.xy * vec2(0.6, 30.0))), brass) + uGold * rivet * 0.5;
  } else if (side > 2.5) {                            // warm rim just inside every cut edge
    col = vFace > 0.0 ? uAmber * 0.8 * (0.75 + 0.5 * fib) * vRim : uCream * 0.6;
  } else if (side > 1.5) {                            // raw card edge catching the lamp
    col = uCream * (0.85 + 0.35 * fib);
  } else {
    float id = 0.0; float d = 1e3; gSel = -1.0; gOpen = 0.0;
    if (style > 4.5) d = 1e3;
    else if (style > 3.5) d = featherWin(vL, vDim, vInfo.y, id);
    else if (style > 2.5) d = fountainWin(vL, vDim, vInfo.z, id);
    else if (style > 1.5) d = gateWin(vL, vDim, vInfo.z, id);
    else if (style > 0.5) d = bodyWin(vL, vDim, vInfo.z, id);
    if (gOpen > 0.5 && d < 0.0) discard;
    float fwRaw = length(fwidth(vL));
    float lod = smoothstep(0.08, 0.3, fwRaw);            // far away the smallest motifs melt into an even gel tint, not moire
    float fw = max(fwRaw * (0.75 + 2.2 * lod), 0.002);
    float win = gOpen > 0.5 ? 0.0 : clamp(0.5 - d / fw, 0.0, 1.0) * (1.0 - 0.22 * lod);
    vec3 gel = gelColour(id, vInfo.y);
    float tw = 0.82 + 0.3 * sin(uTime * (0.5 + 2.2 * h11(id * 9.1)) + id * 40.0);
    tw += 0.9 * pow(max(0.0, sin(vW.x * 0.045 + vW.y * 0.03 + vW.z * 0.05 - uTime * 0.6)), 10.0);
    float dd = max(d, 0.0);
    if (side < 0.5) {
      vec3 spill = gel * exp(-dd * 2.2) * 0.08 + uAmber * exp(-dd * 7.0) * 0.28;
      if (style > 1.5 && style < 2.5 && gSel >= 0.0) tw *= 1.4;
      if (gOpen > 0.5) spill = uAmber * exp(-dd * 5.0) * 0.8;
      col = mix(ink + spill, gel * uGlow * tw, win);
    } else {
      // lamp side: warm card, stage-flat battens, pencil construction lines, tape
      vec3 card = uCream * (0.5 + 0.16 * fib);
      vec2 g = abs(fract(vW.xy / vec2(15.0, 11.0)) - 0.5) * vec2(15.0, 11.0);
      float batten = 1.0 - smoothstep(0.26, 0.26 + fw + 0.05, min(g.x, g.y));
      card = mix(card, mix(uAmber, uCream, 0.35) * 0.36 * (0.7 + 0.6 * vnoise(vW.xy * vec2(1.0, 14.0))), batten * 0.6);
      vec2 pg = abs(fract(vL / 2.5) - 0.5) * 2.5;
      card *= 1.0 - 0.1 * (1.0 - smoothstep(0.0, fw + 0.04, min(pg.x, pg.y)));
      card *= 1.0 - 0.3 * (1.0 - smoothstep(0.03, fw + 0.12, abs(dd - 0.35))) * step(d, 50.0);
      vec2 tc = floor(vW.xy / vec2(7.0, 5.0)); vec2 tp = fract(vW.xy / vec2(7.0, 5.0)) - 0.5;
      float tape = step(0.72, h21(tc)) * step(abs(tp.x + tp.y * 0.3), 0.16) * step(abs(tp.y), 0.07);
      card = mix(card, uCream * 0.82, tape);
      card *= 0.72 + 0.4 * smoothstep(-10.0, 120.0, vW.y);
      card *= 0.86 + 0.14 * step(0.5, fract(vInfo.z * 3.7));
      col = mix(card, gel * (0.5 + 0.5 * uGlow * 0.4) * tw, win);
    }
  }
  gl_FragColor = vec4(col * uFlick, 1.0);
  #include <fog_fragment>
}`;

// ---------- hero ----------
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('filigree-palace') : ctx.rng;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEF_PALETTE).map((h) => new THREE.Color(h));
  const [gold, amber, verm, magenta, teal, inkC, turq] = pal;

  // per-seed character: which domes dominate, how many minarets, which gel leads each tower
  const show = rng.int(0, 2);
  const V = {
    layerBase: opts.layerBase ?? 0,
    capBias: [[0, 1, 0, 2], [1, 0, 1, 0], [0, 0, 2, 1]][show],
    minaretP: [0.35, 0.6, 0.2][show],
    hues: [[0, 0, 0, 1, 2], [0, 0, 1, 1, 3], [0, 0, 2, 2, 1]][rng.int(0, 2)],
  };

  const W = makeWriter();
  for (let k = 0; k < 4; k++) { buildSplitFlat(W, k, rng.fork('flat' + k), V); if (k % 2) await ctx.yield?.(); }
  const gate = buildGateFlat(W, rng.fork('gate'), V);
  await ctx.yield?.();
  const fountains = buildFountains(W, rng.fork('fountain'), V);
  const peacock = buildPeacock(W, rng.fork('peacock'), V);
  buildSlots(W, V);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(W.pos, 3));
  geo.setAttribute('aL', new THREE.Float32BufferAttribute(W.aL, 2));
  geo.setAttribute('aDim', new THREE.Float32BufferAttribute(W.aDim, 4));
  geo.setAttribute('aInfo', new THREE.Float32BufferAttribute(W.aInfo, 4));
  geo.setAttribute('aLay', new THREE.Float32BufferAttribute(W.aLay, 2));
  geo.setAttribute('aRot', new THREE.Float32BufferAttribute(W.aRot, 4));
  geo.setAttribute('aN', new THREE.Float32BufferAttribute(W.aN, 2));
  geo.setIndex(W.idx);
  const height = gate.H;
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, height * 0.45, 0), 190);
  geo.boundingBox = new THREE.Box3(new THREE.Vector3(-150, 0, -45), new THREE.Vector3(150, height + 6, 52));
  await ctx.yield?.();

  const rose = verm.clone().lerp(magenta, 0.45).lerp(new THREE.Color('#ff6aa0'), 0.55);
  const emerald = turq.clone().lerp(new THREE.Color('#2fd27a'), 0.65);
  const amberGel = amber.clone().lerp(gold, 0.25);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uProgress: { value: opts.progress ?? 0 }, uFan: { value: 0 }, uTime: { value: 0 }, uSlide: { value: SLIDE },
    uFlick: { value: 1 }, uGlow: { value: opts.glow ?? 2.2 },
    uInk: { value: inkC.clone() }, uAmber: { value: amber.clone() }, uTeal: { value: teal.clone() },
    uCream: { value: gold.clone() }, uGold: { value: amber.clone().lerp(gold, 0.5) },
    uGel: { value: [turq.clone(), rose, amberGel, emerald] },
  }]);
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG, fog: true, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false;
  mesh.name = 'filigree-palace';
  const object = new THREE.Group();
  object.name = 'shadow-theatre-hero';
  object.add(mesh);

  let driven = false, progress = opts.progress ?? 0, worldFlick = 1;
  const auto = opts.autoDemo !== false;
  const apply = (p) => {
    uniforms.uProgress.value = p;
    const f = Math.min(1, Math.max(0, (p - 0.5) / 0.5));
    uniforms.uFan.value = f * f * (3 - 2 * f);
  };
  apply(progress);

  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: V3(0, 9.5, FLAT_Z[4]), facing: V3(0, 0, 1), radius: 7 },
    flyThrough: [V3(0, 22, 170), V3(0, 18, 110), V3(0, 13.5, 62), V3(0, 11, 30), V3(0, 9.8, 0), V3(0, 9.5, -25), V3(0, 9.5, FLAT_Z[4])],
    viewpoints: {
      front: V3(0, 30, 250), threeQuarter: V3(150, 46, 180), between: V3(118, 24, 30), behind: V3(-120, 50, -170),
    },
    flatZ: FLAT_Z.slice(), slide: SLIDE,
    lampAxis: V3(0, 45, -190),
    peacock, fountains,
    gateArch: { centre: V3(0, 9.5, FLAT_Z[4]), radius: 7.6, jambHalfWidth: 6.3 },
  };

  return {
    object, radius: 105, height, center: V3(0, 52, 0), anchors,
    ground: true, groundY: 0,
    setProgress(u) { driven = true; progress = Math.min(1, Math.max(0, u)); apply(progress); },
    setFlicker(f) { worldFlick = f; },
    uniforms,
    update(dt, time) {
      uniforms.uTime.value = time;
      uniforms.uFlick.value = worldFlick * (1 + 0.06 * Math.sin(time * 0.9) * Math.sin(time * 0.37 + 1.0) + 0.02 * Math.sin(time * 11.3));
      if (!driven && auto) apply(0.5 - 0.5 * Math.cos((time / 24) * TAU));
    },
    dispose() {},
  };
}
