// hill-of-round-doors, the land builder's part: THE BAKED SHADE. One small picture laid over the village and the
// fields about it says, by place alone, what stands between each spot of ground and the sun: red is how much of the
// sun reaches the ground there (the long soft shadows of trees, hedges, walls and the mill), green how open the sky is
// over it (dimmer under a crown), blue the lamplight that falls on it (lanterns, windows). It is made once at build
// from the things' own shapes and the ground's own heights; the ground, the grass and everything that stands on the
// land read it. Nothing in it follows the lens.
const ss = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// o: { THREE, box: [x0, z0, x1, z1], size (texels a side), sun (unit vector toward the sun), heightAt, step (metres
// between the ground heights it keeps) }
export async function makeShade(ctx, o) {
  const { THREE, box, size: N, sun, heightAt } = o, W = box[2] - box[0], D = box[3] - box[1], tx = W / N, tz = D / N;
  const data = new Uint8Array(N * N * 4).fill(255); for (let i = 2; i < N * N * 4; i += 4) data[i] = 0;
  // the ground's heights on a coarse lattice, mixed between its nodes
  const step = o.step || 6, hx = Math.ceil(W / step) + 1, hz = Math.ceil(D / step) + 1, H = new Float32Array(hx * hz);
  for (let j = 0; j < hz; j++) { for (let i = 0; i < hx; i++) H[j * hx + i] = heightAt(box[0] + i * step, box[1] + j * step); if ((j & 7) === 7) await ctx.yield(); }
  const yAt = (x, z) => {
    const fx = Math.min(hx - 1.001, Math.max(0, (x - box[0]) / step)), fz = Math.min(hz - 1.001, Math.max(0, (z - box[1]) / step)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = j * hx + i;
    return (H[k] * (1 - u) + H[k + 1] * u) * (1 - v) + (H[k + hx] * (1 - u) + H[k + hx + 1] * u) * v;
  };
  // the shadow's heading in plan (away from the sun) and how far a metre of height throws it
  const sl = Math.sqrt(sun.x * sun.x + sun.z * sun.z) || 1e-3, sx = -sun.x / sl, sz = -sun.z / sl, reach = Math.min(5.5, sl / Math.max(0.05, sun.y));
  const iOf = (x) => Math.floor((x - box[0]) / tx), jOf = (z) => Math.floor((z - box[1]) / tz);
  return {
    box, size: N, data, yAt,
    // a crown (a round mass of leaves): c = { x, y (its middle), z, r (across), ry (half its height), dense 0..1 }.
    // Its shadow lies where the line from the ground toward the sun passes through it; under it the sky is less open.
    crown(c) {
      const L = (c.y + c.ry - yAt(c.x, c.z) + 8) * reach, ex = c.x + sx * L, ez = c.z + sz * L, pad = c.r * 1.3, dense = c.dense ?? 0.85;
      const i0 = Math.max(0, iOf(Math.min(c.x, ex) - pad)), i1 = Math.min(N - 1, iOf(Math.max(c.x, ex) + pad) + 1), j0 = Math.max(0, jOf(Math.min(c.z, ez) - pad)), j1 = Math.min(N - 1, jOf(Math.max(c.z, ez) + pad) + 1);
      const dx = sun.x / c.r, dy = sun.y / c.ry, dz = sun.z / c.r, dd = dx * dx + dy * dy + dz * dz, ir = 1 / c.r;
      for (let j = j0; j <= j1; j++) {
        const z = box[1] + (j + 0.5) * tz, rz = z - c.z;
        for (let i = i0; i <= i1; i++) {
          const x = box[0] + (i + 0.5) * tx, rx = x - c.x, across = rx * sz - rz * sx, along = rx * sx + rz * sz;
          if (across > pad || across < -pad || along < -pad || along > L + pad) continue;                     // off the shadow's strip
          const k = (j * N + i) * 4, px = rx * ir, pz = rz * ir, under = px * px + pz * pz;
          if (under < 1.5625) { const u = Math.sqrt(under); data[k + 1] = Math.round(data[k + 1] * (1 - 0.42 * (1 - ss(0.45, 1.25, u)))); }
          const py = (yAt(x, z) - c.y) / c.ry, t = Math.max(0, -(px * dx + py * dy + pz * dz) / dd), qx = px + dx * t, qy = py + dy * t, qz = pz + dz * t;
          const d2 = qx * qx + qy * qy + qz * qz; if (d2 > 2.2) continue;
          const far = Math.sqrt(rx * rx + rz * rz) * 0.012 * ir, d = Math.sqrt(d2);
          if (d < 1.12 + far) data[k] = Math.round(data[k] * (1 - dense * (1 - ss(0.72 - far, 1.12 + far, d))));
        }
      }
    },
    // an upright face (a hedge, a wall, a building's side): from (ax, az) to (bx, bz), h metres high, standing on the
    // ground; dense 0..1. Its shadow is the strip the face throws away from the sun.
    face(ax, az, bx, bz, h, dense = 0.9) {
      const ya = yAt((ax + bx) / 2, (az + bz) / 2), L = (h + 5) * reach, ux = bx - ax, uz = bz - az, det = ux * sz - uz * sx;
      if (Math.abs(det) < 1e-4) return;
      const lenU = Math.sqrt(ux * ux + uz * uz), cx = ax + sx * L, cz = az + sz * L, ex = bx + sx * L, ez = bz + sz * L;
      const i0 = Math.max(0, iOf(Math.min(ax, bx, cx, ex) - 1.5)), i1 = Math.min(N - 1, iOf(Math.max(ax, bx, cx, ex) + 1.5) + 1), j0 = Math.max(0, jOf(Math.min(az, bz, cz, ez) - 1.5)), j1 = Math.min(N - 1, jOf(Math.max(az, bz, cz, ez) + 1.5) + 1);
      for (let j = j0; j <= j1; j++) {
        const z = box[1] + (j + 0.5) * tz, rz = z - az;
        for (let i = i0; i <= i1; i++) {
          const x = box[0] + (i + 0.5) * tx, rx = x - ax, u = (rx * sz - rz * sx) / det, v = (ux * rz - uz * rx) / det;      // (x, z) = a + u (b - a) + v (the shadow's heading)
          if (v < -0.3 || u < -0.2 || u > 1.2 || v > L) continue;
          const len = (h + ya - yAt(x, z)) * reach; if (len <= 0) continue;
          const soft = 0.35 + v * 0.07, su = soft / lenU;
          const kk = ss(-0.3, 0.3, v) * (1 - ss(len - soft * 2, len + soft, v)) * ss(-su, su, u) * (1 - ss(1 - su, 1 + su, u));
          if (kk > 0.004) { const k = (j * N + i) * 4; data[k] = Math.round(data[k] * (1 - dense * kk)); }
        }
      }
    },
    // a pool of lamplight on the ground: amount 0..1 at its middle, fading to its rim r metres out
    pool(x, z, r, amount) {
      const i0 = Math.max(0, iOf(x - r)), i1 = Math.min(N - 1, iOf(x + r) + 1), j0 = Math.max(0, jOf(z - r)), j1 = Math.min(N - 1, jOf(z + r) + 1);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const px = box[0] + (i + 0.5) * tx - x, pz = box[1] + (j + 0.5) * tz - z, d2 = (px * px + pz * pz) / (r * r);
        if (d2 < 1) { const k = (j * N + i) * 4 + 2, f = 1 - d2; data[k] = Math.min(255, data[k] + Math.round(255 * amount * f * f)); }
      }
    },
    // what a place gets: out[0] the sun, out[1] the open sky, out[2] the lamplight (each 0..1), mixed between texels
    at(x, z, out) {
      const fx = Math.min(N - 1.001, Math.max(0, (x - box[0]) / tx - 0.5)), fz = Math.min(N - 1.001, Math.max(0, (z - box[1]) / tz - 0.5)), i = Math.floor(fx), j = Math.floor(fz), u = fx - i, v = fz - j, k = (j * N + i) * 4;
      for (let c = 0; c < 3; c++) out[c] = ((data[k + c] * (1 - u) + data[k + 4 + c] * u) * (1 - v) + (data[k + N * 4 + c] * (1 - u) + data[k + N * 4 + 4 + c] * u) * v) / 255;
      return out;
    },
    // the picture itself, once everything has been laid into it
    texture() {
      const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
      tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true; return tex;
    },
  };
}
