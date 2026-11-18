// hill-of-round-doors, the field builder's part: THE LEAF SPRAY the two great trees are clothed in. One small texture
// drawn by hand (no canvas): a spray of about a hundred small pointed leaves in greys (the vertex gives the green) with
// a cut-out edge, and beside it a solid strip for the dark cores of the leaf masses. Its smaller copies are made here
// too and keep the share of the spray that is leaf, so that a far crown stays leafy and does not thin to nothing.
// The leaves are small against a spray, and a spray small against a crown: that is what makes the trees read as great.
export const SPRAY_CELL = [0.195, 0.004, 0.996, 0.996];        // the spray: u0, v0, u1, v1
export const SPRAY_SOLID = [0.06, 0.5];                        // a place in the solid strip
const W = 512, SOLID_W = 64, SPRAY_X = 96, CUT = 0.4;

// makeSprayTexture(THREE, rng, pause, anisotropy) -> a DataTexture with its own mip chain. rng: the stream 'leaf-spray'.
export async function makeSprayTexture(THREE, rng, pause, anisotropy = 1) {
  const px = new Uint8Array(W * W * 4), sw = W - SPRAY_X;
  for (let y = 0; y < W; y++) for (let x = 0; x < SOLID_W; x++) { const i = (y * W + x) * 4; px[i] = px[i + 1] = px[i + 2] = 235; px[i + 3] = 255; }
  if (pause) await pause();
  // the leaves, the deepest first: each a pointed oval with a midrib, one half a little darker (a fold)
  const N = 112, leaves = [];
  for (let k = 0; k < N; k++) {
    const r = 0.45 * Math.sqrt(rng()), a = rng() * Math.PI * 2, cx = 0.5 + r * Math.cos(a), cy = 0.5 + r * Math.sin(a);
    const len = rng.range(0.058, 0.082), wid = len * rng.range(0.42, 0.56), dir = a + rng.range(-1.0, 1.0), tone = 0.5 + 0.5 * (k / N) * rng.range(0.75, 1) + rng.range(0, 0.08);
    leaves.push([cx, cy, len, wid, Math.cos(dir), Math.sin(dir), Math.min(1, tone)]);
  }
  for (let k = 0; k < N; k++) {
    const [cx, cy, len, wid, dx, dy, tone] = leaves[k];
    const x0 = Math.max(0, Math.floor((cx - len) * sw)), x1 = Math.min(sw - 1, Math.ceil((cx + len) * sw)), y0 = Math.max(0, Math.floor((cy - len) * W)), y1 = Math.min(W - 1, Math.ceil((cy + len) * W));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const ux = (x + 0.5) / sw - cx, uy = (y + 0.5) / W - cy, s = (ux * dx + uy * dy) / len, w = (-ux * dy + uy * dx);
      if (s <= -1 || s >= 1) continue;
      const hw = wid * Math.pow(1 - s * s, 0.75) * (1 - 0.22 * s), cover = (hw - Math.abs(w)) * W + 0.5;
      if (cover <= 0) continue;
      const al = Math.min(1, cover), rib = Math.abs(w) < wid * 0.07 ? 0.72 : 1, half = w > 0 ? 1 : 0.84, g = 255 * tone * rib * half * (0.92 + 0.08 * s);
      const i = (y * W + SPRAY_X + x) * 4, old = px[i + 3] / 255, v = px[i] * (1 - al) + g * al;
      px[i] = px[i + 1] = px[i + 2] = v; px[i + 3] = 255 * Math.max(old, al);
    }
    if (pause && k % 10 === 9) await pause();
  }
  // the share of the spray that is leaf, to be kept in every smaller copy
  const share = (d, w, x0, gain) => { let n = 0, t = 0; for (let y = 0; y < w; y++) for (let x = x0; x < w; x++) { t++; if (d[(y * w + x) * 4 + 3] * gain > CUT * 255) n++; } return n / t; };
  let leafy = 0;
  for (let y = 0; y < W; y++) { for (let x = SPRAY_X; x < W; x++) if (px[(y * W + x) * 4 + 3] > CUT * 255) leafy++; if (pause && y % 128 === 127) await pause(); }
  const want = leafy / (W * (W - SPRAY_X)), mips = [{ data: px, width: W, height: W }];
  let src = px, w = W;
  while (w > 1) {
    const nw = w >> 1, dst = new Uint8Array(nw * nw * 4);
    for (let y = 0; y < nw; y++) for (let x = 0; x < nw; x++) {
      let r = 0, a = 0;
      for (let j = 0; j < 2; j++) for (let i = 0; i < 2; i++) { const q = ((y * 2 + j) * w + x * 2 + i) * 4; r += src[q] * src[q + 3]; a += src[q + 3]; }
      const o = (y * nw + x) * 4, v = a > 0 ? r / a : 200;
      dst[o] = dst[o + 1] = dst[o + 2] = v; dst[o + 3] = a / 4;
    }
    const x0 = Math.ceil(SPRAY_X * nw / W);
    if (pause && nw >= 128) await pause();
    if (nw <= 128 && nw >= 8) {                                 // the smaller copies: soften the cut-out, so that a far crown's edge is lobes of leaves and not single squares
      const al = new Float32Array(nw * nw);
      for (let y = 0; y < nw; y++) for (let x = x0; x < nw; x++) {
        let sum = 0, ws = 0;
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const xx = x + i, yy = y + j; if (xx < x0 || xx >= nw || yy < 0 || yy >= nw) continue; const wg = (i ? 1 : 2) * (j ? 1 : 2); sum += dst[(yy * nw + xx) * 4 + 3] * wg; ws += wg; }
        al[y * nw + x] = sum / ws;
      }
      for (let y = 0; y < nw; y++) for (let x = x0; x < nw; x++) { const o = (y * nw + x) * 4 + 3; dst[o] = 0.3 * dst[o] + 0.7 * al[y * nw + x]; }
      if (pause && nw >= 64) await pause();
    }
    if (nw >= 4) {                                              // lift the spray's alpha until as much of it passes the cut as in the full picture
      let lo = 1, hi = 6;
      for (let it = 0; it < 12; it++) { const m = (lo + hi) / 2; if (share(dst, nw, x0, m) < want) lo = m; else hi = m; if (pause && nw >= 128 && it % 3 === 2) await pause(); }
      for (let y = 0; y < nw; y++) for (let x = x0; x < nw; x++) { const o = (y * nw + x) * 4 + 3; dst[o] = Math.min(255, dst[o] * hi); }
    }
    mips.push({ data: dst, width: nw, height: nw }); src = dst; w = nw;
    if (pause && nw >= 64) await pause();
  }
  const tex = new THREE.DataTexture(px, W, W, THREE.RGBAFormat, THREE.UnsignedByteType);
  tex.mipmaps = mips; tex.generateMipmaps = false; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.anisotropy = anisotropy; tex.needsUpdate = true;
  return tex;
}

// sprig(L, rng, p, n, size, col, tip): a small plant growing from the place p along the way the surface faces (n): two
// crossed sprays, base colour col, tips `tip` (flowers when that is a petal colour). L: a Leafy. Sways a little.
export function sprig(L, rng, p, n, size, col, tip) {
  const l = Math.hypot(n[0], n[1], n[2]) || 1, up = [n[0] / l, n[1] / l, n[2] / l], ref = Math.abs(up[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  let s0 = [ref[1] * up[2] - ref[2] * up[1], ref[2] * up[0] - ref[0] * up[2], ref[0] * up[1] - ref[1] * up[0]]; const sl = Math.hypot(s0[0], s0[1], s0[2]) || 1; s0 = [s0[0] / sl, s0[1] / sl, s0[2] / sl];
  const s1 = [up[1] * s0[2] - up[2] * s0[1], up[2] * s0[0] - up[0] * s0[2], up[0] * s0[1] - up[1] * s0[0]], a0 = rng() * Math.PI, cell = SPRAY_CELL;
  const nl = Math.hypot(up[0], up[1] + 0.7, up[2]) || 1, nr = [up[0] / nl, (up[1] + 0.7) / nl, up[2] / nl];
  for (let k = 0; k < 2; k++) {
    const a = a0 + k * Math.PI / 2, ca = Math.cos(a) * size * 0.5, sa = Math.sin(a) * size * 0.5, sd = [s0[0] * ca + s1[0] * sa, s0[1] * ca + s1[1] * sa, s0[2] * ca + s1[2] * sa];
    const b = [p[0] - up[0] * size * 0.12, p[1] - up[1] * size * 0.12, p[2] - up[2] * size * 0.12], t = [b[0] + up[0] * size, b[1] + up[1] * size, b[2] + up[2] * size];
    const i0 = L.v([b[0] - sd[0], b[1] - sd[1], b[2] - sd[2]], nr, col, 0.01, 0.6, 1, cell[0], cell[3]), i1 = L.v([b[0] + sd[0], b[1] + sd[1], b[2] + sd[2]], nr, col, 0.01, 0.6, 1, cell[2], cell[3]);
    const i2 = L.v([t[0] + sd[0], t[1] + sd[1], t[2] + sd[2]], nr, tip, 0.04, 2.5, 1, cell[2], cell[1]), i3 = L.v([t[0] - sd[0], t[1] - sd[1], t[2] - sd[2]], nr, tip, 0.04, 2.5, 1, cell[0], cell[1]);
    L.quad(i0, i1, i2, i3);
  }
}
