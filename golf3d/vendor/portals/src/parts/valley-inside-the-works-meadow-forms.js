// valley-inside-the-works, the meadow: THE PLANTS' FORMS. Each kind in its real shape, three times life size, as one
// small mesh that is instanced over the meadow: a daisy has a ring of separate rays round a domed eye, clover a round
// head of florets over three-leaved leaves, an umbel its rays and umbellets, a foxglove its one-sided spire of bells.
// A form is built with its root at the origin, +y up; every vertex carries colour, the sugar it wears and how it moves
// (see the sugar material's head). `lo` forms are the same plants as they are drawn far off: the same height, breadth
// and colours in a few triangles.
const TAU = Math.PI * 2;

export function makeForm(THREE) {
  const pos = [], nor = [], col = [], aS = [], aT = [], uv = [];
  const F = {
    // one vertex; c = [r, g, b], s = [move, sugar, light through, thread half width], t = thread direction
    tri(a, b, c, ca, cb, cc, s, ua = [0, 0], ub = [1, 0], uc = [0.5, 1], t = [0, 1, 0], n = null) {
      let nx, ny, nz;
      if (n) { nx = n[0]; ny = n[1]; nz = n[2]; } else {
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
        nx = uy * vz - uz * vy; ny = uz * vx - ux * vz; nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
        if (ny < 0) { nx = -nx; ny = -ny; nz = -nz; }    // thin things are two-sided: their normal looks up, so the sky lights them
      }
      for (const [p, cc2, u2] of [[a, ca, ua], [b, cb, ub], [c, cc, uc]]) {
        pos.push(p[0], p[1], p[2]); nor.push(nx, ny, nz); col.push(cc2[0], cc2[1], cc2[2]); aS.push(s[0], s[1], s[2], s[3] || 0); aT.push(t[0], t[1], t[2]); uv.push(u2[0], u2[1]);
      }
    },
    quad(a, b, c, d, ca, cb, cc, cd, s, v0 = 0, v1 = 1, n = null) {
      F.tri(a, b, c, ca, cb, cc, s, [0, v0], [1, v0], [1, v1], [0, 1, 0], n); F.tri(a, c, d, ca, cc, cd, s, [0, v0], [1, v1], [0, v1], [0, 1, 0], n);
    },
    // a blade or petal along a bent line: pts = [[x,y,z],...], w = half widths, side = the way its breadth lies
    ribbon(pts, w, side, c0, c1, s) {
      const n = pts.length - 1;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[i + 1], t0 = i / n, t1 = (i + 1) / n, ca = mix3(c0, c1, t0), cb = mix3(c0, c1, t1);
        const a = [p[0] - side[0] * w[i], p[1] - side[1] * w[i], p[2] - side[2] * w[i]], b = [p[0] + side[0] * w[i], p[1] + side[1] * w[i], p[2] + side[2] * w[i]];
        const c = [q[0] + side[0] * w[i + 1], q[1] + side[1] * w[i + 1], q[2] + side[2] * w[i + 1]], d = [q[0] - side[0] * w[i + 1], q[1] - side[1] * w[i + 1], q[2] - side[2] * w[i + 1]];
        if (w[i + 1] < 1e-4) F.tri(a, b, q, ca, ca, cb, s, [0, t0], [1, t0], [0.5, t1]); else F.quad(a, b, c, d, ca, ca, cb, cb, s, t0, t1);
      }
    },
    // a hair-fine thread from p to q (a ribbon the shader turns to the eye)
    thread(p, q, hw, c0, c1, move = 1, kind = 3) {
      const t = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], l = Math.hypot(t[0], t[1], t[2]) || 1; t[0] /= l; t[1] /= l; t[2] /= l;
      const put = (a, b, c, ca, cb, cc, sa, sb, sc) => {
        for (const [pp, c2, sg] of [[a, ca, sa], [b, cb, sb], [c, cc, sc]]) { pos.push(pp[0], pp[1], pp[2]); nor.push(0, 1, 0); col.push(c2[0], c2[1], c2[2]); aS.push(move, kind, 0.6, sg * hw); aT.push(t[0], t[1], t[2]); uv.push(sg > 0 ? 1 : 0, 0); }
      };
      put(p, p, q, c0, c0, c1, -1, 1, 1); put(p, q, q, c0, c1, c1, -1, 1, -1);
    },
    // a stem: a three-sided prism through pts
    stem(pts, r0, r1, c0, c1, s) {
      const n = pts.length - 1;
      for (let i = 0; i < n; i++) {
        const p = pts[i], q = pts[i + 1], ra = r0 + (r1 - r0) * i / n, rb = r0 + (r1 - r0) * (i + 1) / n, ca = mix3(c0, c1, i / n), cb = mix3(c0, c1, (i + 1) / n);
        for (let k = 0; k < 3; k++) {
          const a0 = k * TAU / 3, a1 = (k + 1) * TAU / 3, am = (a0 + a1) / 2, nn = [Math.cos(am), 0, Math.sin(am)];
          F.quad([p[0] + ra * Math.cos(a0), p[1], p[2] + ra * Math.sin(a0)], [p[0] + ra * Math.cos(a1), p[1], p[2] + ra * Math.sin(a1)],
            [q[0] + rb * Math.cos(a1), q[1], q[2] + rb * Math.sin(a1)], [q[0] + rb * Math.cos(a0), q[1], q[2] + rb * Math.sin(a0)], ca, ca, cb, cb, s, i / n, (i + 1) / n, nn);
        }
      }
    },
    build() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 4));
      g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      let top = 0, rad = 0; for (let i = 0; i < pos.length; i += 3) { top = Math.max(top, pos[i + 1]); rad = Math.max(rad, Math.hypot(pos[i], pos[i + 2])); }
      g.userData = { triangles: pos.length / 9, top, rad };
      return g;
    },
  };
  return F;
}
export const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
// a frame for a head that is tipped: returns a function taking (across, up, along) to the form's own space
function tipped(cx, cy, cz, tilt, yaw) {
  const ct = Math.cos(tilt), st = Math.sin(tilt), cy2 = Math.cos(yaw), sy = Math.sin(yaw);
  return (x, y, z) => { const y1 = y * ct - z * st, z1 = y * st + z * ct; return [cx + x * cy2 + z1 * sy, cy + y1, cz - x * sy + z1 * cy2]; };
}
export const GREEN = [0.07, 0.2, 0.035], GREEN_HI = [0.16, 0.36, 0.06], STEM = [0.09, 0.2, 0.05];
const PLAIN = [1, 0, 0.35], LEAF = [1, 0, 0.6];

// OX-EYE DAISY: a ring of separate white rays round a domed yellow eye, 0.4 m across, on a stem of 1.6 m
export function daisy(THREE, rng) {
  const F = makeForm(THREE), H = 1.6, bend = 0.12 * (rng() - 0.5), W = [0.6, 0.6, 0.55], Y = [0.62, 0.42, 0.03];
  F.thread([0, 0, 0], [bend, H, 0], 0.015, STEM, GREEN_HI, 1, 0);
  for (let k = 0; k < 1; k++) {     // a spoon leaf low on the stem
    const a = k * 2.6 + rng() * 2, y = 0.15 + 0.4 * k, l = 0.34 - 0.08 * k, dx = Math.cos(a), dz = Math.sin(a);
    F.ribbon([[0, y, 0], [dx * l * 0.6, y + 0.1, dz * l * 0.6], [dx * l, y + 0.04, dz * l]], [0.012, 0.055, 0], [-dz, 0, dx], GREEN, GREEN_HI, LEAF);
  }
  const T = tipped(bend, H, 0, 0.3 + 0.35 * rng(), TAU * rng()), N = 11;
  for (let k = 0; k < N; k++) {     // the rays: each its own petal, a little out of true
    const a = (k + 0.3 * (rng() - 0.5)) * TAU / N, len = 0.2 * (0.86 + 0.2 * rng()), droop = -0.015 - 0.045 * rng(), w = 0.035, c = Math.cos(a), s = Math.sin(a);
    F.quad(T(0.06 * c + w * 0.5 * s, 0.012, 0.06 * s - w * 0.5 * c), T(0.06 * c - w * 0.5 * s, 0.012, 0.06 * s + w * 0.5 * c), T(len * c - w * s, droop, len * s + w * c), T(len * c + w * s, droop, len * s - w * c),
      [0.55, 0.57, 0.4], [0.55, 0.57, 0.4], W, W, [1, 1, 0.6, 0]);
  }
  for (let k = 0; k < 5; k++) {     // the eye: a low dome
    const a0 = k * TAU / 5, a1 = (k + 1) * TAU / 5;
    F.tri(T(0, 0.05, 0), T(0.075 * Math.cos(a1), 0.012, 0.075 * Math.sin(a1)), T(0.075 * Math.cos(a0), 0.012, 0.075 * Math.sin(a0)), [0.7, 0.5, 0.04], Y, Y, [1, 1, 0.2, 0]);
  }
  return F.build();
}

// RED CLOVER: a round head of florets, rose-purple with a paler crown, over leaves of three leaflets
export function clover(THREE, rng) {
  const F = makeForm(THREE), H = 0.95, lean = 0.12 * (rng() - 0.5), C0 = [0.42, 0.09, 0.23], C1 = [0.6, 0.28, 0.46], S = [1, 1, 0.45, 0];
  F.thread([0, 0, 0], [lean, H - 0.08, 0], 0.015, STEM, GREEN_HI, 1, 0);
  for (let k = 0; k < 1; k++) {       // the leaf: three leaflets
    const y = 0.42 + 0.38 * k, a = 2.1 * k + TAU * rng(), l = 0.2, bx = Math.cos(a) * 0.16, bz = Math.sin(a) * 0.16;
    F.thread([lean * y, y - 0.1, 0], [bx, y, bz], 0.008, STEM, GREEN_HI, 1, 0);
    for (let q = -1; q <= 1; q++) {
      const b = a + q * 1.15, dx = Math.cos(b), dz = Math.sin(b);
      F.tri([bx - dz * 0.06 + dx * l * 0.45, y + 0.02, bz + dx * 0.06 + dz * l * 0.45], [bx + dz * 0.06 + dx * l * 0.45, y + 0.02, bz - dx * 0.06 + dz * l * 0.45], [bx + dx * l, y, bz + dz * l], GREEN, GREEN, [0.2, 0.4, 0.12], LEAF);
      F.tri([bx, y, bz], [bx - dz * 0.06 + dx * l * 0.45, y + 0.02, bz + dx * 0.06 + dz * l * 0.45], [bx + dz * 0.06 + dx * l * 0.45, y + 0.02, bz - dx * 0.06 + dz * l * 0.45], GREEN, GREEN, GREEN, LEAF);
    }
  }
  const R = 0.115, cy = H, N = 6;     // the head: three rings of florets standing out from a ball
  for (let ring = 0; ring < 3; ring++) {
    const y0 = cy - 0.07 + 0.075 * ring, y1 = y0 + 0.1, r0 = R * [0.75, 1, 0.7][ring], r1 = R * [1.05, 0.85, 0.2][ring], ca = mix3(C0, C1, ring / 2.5), cb = mix3(C0, C1, (ring + 1) / 2.5);
    for (let k = 0; k < N; k++) {
      const a0 = (k + 0.5 * ring) * TAU / N, a1 = a0 + TAU / N, am = (a0 + a1) / 2;
      F.tri([lean + r0 * Math.cos(a0), y0, r0 * Math.sin(a0)], [lean + r0 * Math.cos(a1), y0, r0 * Math.sin(a1)], [lean + r1 * Math.cos(am), y1, r1 * Math.sin(am)], ca, ca, cb, S,
        [0, 0], [1, 0], [0.5, 1], [0, 1, 0], [Math.cos(am) * 0.8, 0.6, Math.sin(am) * 0.8]);
    }
  }
  return F.build();
}

// THE HAY: a tuft of broad arching blades with one flowering stalk. Its head is SPUN SUGAR: a slim plume of pale gold
// with hair-fine threads standing out of it, the lowest longest, the whole nodding over
export function hay(THREE, rng, tall = 1) {
  const F = makeForm(THREE), GOLD0 = [0.26, 0.17, 0.05], GOLD1 = [0.44, 0.32, 0.12];
  for (let k = 0; k < 4; k++) {
    const a = k * TAU / 4 + rng(), l = (0.7 + 0.55 * rng()) * tall, out = 0.3 + 0.4 * rng(), dx = Math.cos(a), dz = Math.sin(a);
    F.ribbon([[dx * 0.03, 0, dz * 0.03], [dx * out * 0.45, l * 0.62, dz * out * 0.45], [dx * out * 1.2, l * (0.75 + 0.25 * rng()), dz * out * 1.2]], [0.07, 0.06, 0], [-dz, 0, dx], [0.035, 0.12, 0.02], [0.15, 0.36, 0.06], LEAF);
  }
  const H = (1.45 + 0.5 * rng()) * tall, nx = 0.36 * (rng() - 0.5), nz = 0.36 * (rng() - 0.5);
  const axis = (t) => [nx * t * t, H * (0.6 + 0.4 * t) - 0.1 * H * t * t, nz * t * t];    // the head's own axis, nodding over
  F.thread([0, 0, 0], axis(0), 0.011, [0.09, 0.22, 0.045], [0.3, 0.3, 0.1], 1, 0);
  // the plume: two leaves of spun sugar crossed on the axis
  const sideA = [0.7, 0, 0.7], sideB = [-0.7, 0, 0.7], w = [0.012, 0.05, 0.035, 0];
  F.ribbon([axis(0), axis(0.35), axis(0.7), axis(1)], w, sideA, GOLD0, GOLD1, [1.2, 3, 0.7, 0]);
  F.ribbon([axis(0), axis(0.35), axis(0.7), axis(1)], w, sideB, GOLD0, GOLD1, [1.2, 3, 0.7, 0]);
  for (let k = 0; k < 6; k++) {       // the threads
    const t = 0.1 + 0.85 * (k / 6), a = k * 2.4 + rng(), l = (0.3 - 0.18 * t) * (0.75 + 0.5 * rng()), p = axis(t), dx = Math.cos(a), dz = Math.sin(a);
    F.thread(p, [p[0] + dx * l * 0.7, p[1] + l * 0.8, p[2] + dz * l * 0.7], 0.003, GOLD0, GOLD1, 1.5, 3);
  }
  return F.build();
}

// THE FAR FORMS: what any plant is drawn as beyond the reach of its own form. A DISC (a daisy, an umbel), a PUFF (a
// clover head, a spire, a plume) and a TUFT (blades): each one unit across and high, sized and coloured by its instance.
export function loDisc(THREE) {
  const F = makeForm(THREE), T = tipped(0, 0, 0, 0.3, 0.7), W = [1, 1, 1], Y = [1, 0.8, 0.22];
  for (let k = 0; k < 6; k++) { const a0 = k * TAU / 6, a1 = (k + 1) * TAU / 6; F.tri(T(0, 0.12, 0), T(Math.cos(a0), 0, Math.sin(a0)), T(Math.cos(a1), 0, Math.sin(a1)), Y, W, W, [1, 1, 0.5, 0]); }
  return F.build();
}
export function loPuff(THREE) {
  const F = makeForm(THREE), C = [1, 1, 1], D = [0.7, 0.7, 0.7];
  for (let k = 0; k < 3; k++) {
    const a0 = k * TAU / 3, a1 = (k + 1) * TAU / 3, am = (a0 + a1) / 2, p0 = [Math.cos(a0), 0.45, Math.sin(a0)], p1 = [Math.cos(a1), 0.45, Math.sin(a1)];
    F.tri(p0, p1, [0, 1, 0], C, C, C, [1, 1, 0.5, 0], [0, 0], [1, 0], [0.5, 1], [0, 1, 0], [Math.cos(am) * 0.7, 0.7, Math.sin(am) * 0.7]);
    F.tri(p1, p0, [0, 0, 0], C, C, D, [1, 1, 0.5, 0], [0, 0], [1, 0], [0.5, 1], [0, 1, 0], [Math.cos(am) * 0.9, 0.3, Math.sin(am) * 0.9]);
  }
  return F.build();
}
export function loTuft(THREE, rng) {
  const F = makeForm(THREE);
  for (let k = 0; k < 5; k++) {
    const a = k * TAU / 5 + 0.7 * rng(), out = 0.5 + 0.5 * rng(), dx = Math.cos(a), dz = Math.sin(a), h = 0.7 + 0.3 * rng();
    F.tri([dx * 0.1 - dz * 0.22, 0, dz * 0.1 + dx * 0.22], [dx * 0.1 + dz * 0.22, 0, dz * 0.1 - dx * 0.22], [dx * out, h, dz * out], [0.7, 0.7, 0.7], [0.7, 0.7, 0.7], [1.5, 1.5, 1.5], [1, 0, 0.6, 0]);
  }
  return F.build();
}

// COW PARSLEY: 3 m tall; three umbels, each of rays ending in small white umbellets
export function parsley(THREE, rng) {
  const F = makeForm(THREE), H = 3.0, W = [0.6, 0.61, 0.52], W0 = [0.42, 0.5, 0.3], S = [1, 1, 0.55, 0];
  F.thread([0, 0, 0], [0.05, H * 0.55, 0.04], 0.03, STEM, STEM, 1, 0);
  for (let k = 0; k < 2; k++) {       // the cut leaves, low
    const a = 2.9 * k + rng() * 2, y = 0.5 + 0.5 * k, l = 0.9, dx = Math.cos(a), dz = Math.sin(a);
    F.ribbon([[0, y, 0], [dx * l * 0.5, y + 0.25, dz * l * 0.5], [dx * l, y + 0.1, dz * l]], [0.03, 0.2, 0], [-dz, 0, dx], GREEN, GREEN_HI, LEAF);
  }
  for (let u = 0; u < 3; u++) {
    const a = u * 2.1 + rng(), out = u === 0 ? 0.1 : 0.55 + 0.2 * rng(), hy = H * (u === 0 ? 1 : 0.8 + 0.12 * rng()), cx = Math.cos(a) * out, cz = Math.sin(a) * out, R = 0.36 + 0.1 * rng();
    F.thread([0.05, H * 0.55, 0.04], [cx, hy - 0.3, cz], 0.018, STEM, GREEN_HI, 1, 0);
    for (let k = 0; k < 6; k++) {
      const b = k * TAU / 6 + rng() * 0.4, rr = R * (0.75 + 0.3 * rng()), px = cx + Math.cos(b) * rr, pz = cz + Math.sin(b) * rr, py = hy - 0.05 * rng(), r = 0.11;
      F.thread([cx, hy - 0.3, cz], [px, py, pz], 0.006, GREEN_HI, W0, 1, 0);
      F.tri([px, py + 0.035, pz], [px + r, py, pz - r * 0.6], [px - r, py, pz - r * 0.6], W, W, W0, S); F.tri([px, py + 0.035, pz], [px - r, py, pz - r * 0.6], [px, py, pz + r], W, W0, W, S);
      F.tri([px, py + 0.035, pz], [px, py, pz + r], [px + r, py, pz - r * 0.6], W, W, W, S);
    }
  }
  return F.build();
}
// FOXGLOVE: a tall one-sided spire of hanging bells, rose-purple, paler in the mouth, over a rosette of broad leaves
export function foxglove(THREE, rng) {
  const F = makeForm(THREE), H = 3.6, P0 = [0.5, 0.12, 0.38], P1 = [0.66, 0.4, 0.58], S = [1, 1, 0.6, 0], side = TAU * rng(), sx = Math.cos(side), sz = Math.sin(side);
  F.thread([0, 0, 0], [0, H, 0], 0.03, STEM, GREEN_HI, 1, 0);
  for (let k = 0; k < 5; k++) { const a = k * TAU / 5 + rng(), l = 0.7 + 0.3 * rng(), dx = Math.cos(a), dz = Math.sin(a); F.ribbon([[0, 0.05, 0], [dx * l * 0.5, 0.35, dz * l * 0.5], [dx * l, 0.2, dz * l]], [0.05, 0.17, 0], [-dz, 0, dx], GREEN, GREEN_HI, LEAF); }
  for (let k = 0; k < 11; k++) {      // the bells, largest lowest, all to one side
    const t = k / 11, y = H * (0.42 + 0.55 * t), l = 0.34 * (1 - 0.55 * t), r = 0.085 * (1 - 0.5 * t), a = side + (rng() - 0.5) * 0.9, dx = Math.cos(a), dz = Math.sin(a);
    const base = [dx * 0.04, y, dz * 0.04], mouth = [dx * (0.04 + l * 0.75), y - l * 0.7, dz * (0.04 + l * 0.75)];
    for (let q = 0; q < 3; q++) {
      const b0 = q * TAU / 3, b1 = (q + 1) * TAU / 3, o0 = [-dz * Math.cos(b0) * r, Math.sin(b0) * r, dx * Math.cos(b0) * r], o1 = [-dz * Math.cos(b1) * r, Math.sin(b1) * r, dx * Math.cos(b1) * r];
      F.quad([base[0] + o0[0] * 0.35, base[1] + o0[1] * 0.35, base[2] + o0[2] * 0.35], [base[0] + o1[0] * 0.35, base[1] + o1[1] * 0.35, base[2] + o1[2] * 0.35],
        [mouth[0] + o1[0], mouth[1] + o1[1], mouth[2] + o1[2]], [mouth[0] + o0[0], mouth[1] + o0[1], mouth[2] + o0[2]], P0, P0, P1, P1, S);
    }
  }
  F.tri([0.05 * sx, H, 0.05 * sz], [-0.05 * sx, H, -0.05 * sz], [0, H + 0.25, 0], P0, P0, [0.3, 0.4, 0.2], S);
  return F.build();
}
// YELLOW FLAG IRIS: sword leaves of PULLED SUGAR, and flowers of three hanging falls and three small standards
export function iris(THREE, rng) {
  const F = makeForm(THREE), H = 2.6, Y0 = [0.6, 0.42, 0.03], Y1 = [0.68, 0.56, 0.08], G0 = [0.03, 0.14, 0.05], G1 = [0.13, 0.33, 0.1], PULL = [1, 2, 0.85, 0], S = [1, 1, 0.6, 0];
  for (let k = 0; k < 5; k++) {
    const a = k * TAU / 5 + rng(), l = H * (0.7 + 0.35 * rng()), out = 0.15 + 0.4 * rng(), dx = Math.cos(a), dz = Math.sin(a);
    F.ribbon([[dx * 0.04, 0, dz * 0.04], [dx * out * 0.5, l * 0.6, dz * out * 0.5], [dx * out * 1.3, l, dz * out * 1.3]], [0.07, 0.06, 0], [-dz, 0, dx], G0, G1, PULL);
  }
  for (let f = 0; f < 2; f++) {
    const fx = 0.2 * (rng() - 0.5), fz = 0.2 * (rng() - 0.5), fy = H * (0.88 + 0.12 * f), a0 = rng() * TAU;
    F.thread([0, 0, 0], [fx, fy, fz], 0.022, STEM, GREEN_HI, 1, 0);
    for (let k = 0; k < 3; k++) {
      const a = a0 + k * TAU / 3, dx = Math.cos(a), dz = Math.sin(a), b = a + TAU / 6, ex = Math.cos(b), ez = Math.sin(b);
      F.ribbon([[fx, fy, fz], [fx + dx * 0.2, fy + 0.04, fz + dz * 0.2], [fx + dx * 0.36, fy - 0.2, fz + dz * 0.36]], [0.03, 0.11, 0.02], [-dz, 0, dx], Y0, Y1, S);
      F.tri([fx + ex * 0.02 - ez * 0.04, fy, fz + ez * 0.02 + ex * 0.04], [fx + ex * 0.02 + ez * 0.04, fy, fz + ez * 0.02 - ex * 0.04], [fx + ex * 0.1, fy + 0.24, fz + ez * 0.1], Y0, Y0, Y1, S);
    }
  }
  return F.build();
}
// REEDS: tall stems with long blades of PULLED SUGAR and a plume of SPUN SUGAR
export function reed(THREE, rng) {
  const F = makeForm(THREE), G0 = [0.04, 0.15, 0.05], G1 = [0.16, 0.36, 0.1], PULL = [1, 2, 0.85, 0], B0 = [0.2, 0.12, 0.06], B1 = [0.42, 0.3, 0.14];
  for (let st = 0; st < 3; st++) {
    const a = st * 2.2 + rng(), off = 0.1 + 0.3 * rng(), bx = Math.cos(a) * off, bz = Math.sin(a) * off, H = 3.3 + 1.3 * rng(), lx = bx + 0.3 * (rng() - 0.5), lz = bz + 0.3 * (rng() - 0.5);
    F.thread([bx, 0, bz], [lx, H, lz], 0.02, [0.1, 0.22, 0.06], [0.3, 0.34, 0.12], 1, 0);
    for (let k = 0; k < 3; k++) {
      const t = 0.3 + 0.2 * k + 0.1 * rng(), b = a + k * 2.3 + rng(), l = 1.2 + 0.6 * rng(), dx = Math.cos(b), dz = Math.sin(b), px = bx + (lx - bx) * t, pz = bz + (lz - bz) * t, py = H * t;
      F.ribbon([[px, py, pz], [px + dx * l * 0.5, py + l * 0.55, pz + dz * l * 0.5], [px + dx * l, py + l * 0.5, pz + dz * l]], [0.05, 0.045, 0], [-dz, 0, dx], G0, G1, PULL);
    }
    const tip = [lx + 0.25 * (rng() - 0.5), H + 0.75, lz + 0.25 * (rng() - 0.5)], mid = [(lx + tip[0]) / 2, H + 0.4, (lz + tip[2]) / 2];
    F.ribbon([[lx, H, lz], mid, tip], [0.02, 0.09, 0], [0.7, 0, 0.7], B0, B1, [1.3, 3, 0.7, 0]); F.ribbon([[lx, H, lz], mid, tip], [0.02, 0.09, 0], [-0.7, 0, 0.7], B0, B1, [1.3, 3, 0.7, 0]);
  }
  return F.build();
}
// BLUEBELL: an arching stem hung with bells on its under side, over strap leaves
export function bluebell(THREE, rng) {
  const F = makeForm(THREE), H = 1.05, B0 = [0.1, 0.12, 0.5], B1 = [0.26, 0.3, 0.72], S = [1, 1, 0.6, 0], a = TAU * rng(), dx = Math.cos(a), dz = Math.sin(a);
  const arc = (t) => [dx * 0.45 * t * t, H * (t - 0.35 * t * t * t), dz * 0.45 * t * t];
  F.thread([0, 0, 0], arc(0.6), 0.015, STEM, [0.1, 0.16, 0.3], 1, 0); F.thread(arc(0.6), arc(1), 0.012, [0.1, 0.16, 0.3], B0, 1, 0);
  for (let k = 0; k < 3; k++) { const b = a + 1 + k * 2.1, l = 0.6 + 0.2 * rng(), ex = Math.cos(b), ez = Math.sin(b); F.ribbon([[0, 0, 0], [ex * l * 0.5, 0.4, ez * l * 0.5], [ex * l, 0.3, ez * l]], [0.04, 0.035, 0], [-ez, 0, ex], GREEN, GREEN_HI, LEAF); }
  for (let k = 0; k < 5; k++) {       // the bells: each a small flared cone hanging from the arch
    const p = arc(0.55 + 0.1 * k), l = 0.18, r = 0.07;
    for (let q = 0; q < 3; q++) {
      const b0 = q * TAU / 3, b1 = (q + 1) * TAU / 3;
      F.tri(p, [p[0] + Math.cos(b0) * r, p[1] - l, p[2] + Math.sin(b0) * r], [p[0] + Math.cos(b1) * r, p[1] - l, p[2] + Math.sin(b1) * r], B0, B1, B1, S);
    }
  }
  return F.build();
}
