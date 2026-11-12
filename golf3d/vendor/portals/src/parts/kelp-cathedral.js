// HERO SET PIECE for "kelp-cathedral": a humpback whale and her calf.
//
// WHAT IT IS
//   A ~15 m humpback (pleated throat, knobbed rostrum, barnacle crusts, 4.6 m white pectoral fins with
//   scalloped leading edges, serrated flukes with a per-seed white underside pattern) and a ~5 m calf tucked
//   under one pectoral fin. Both swim with a travelling spine wave and fluke beat in the vertex shader. Around
//   them: a ring of soft sun shafts that "break" around the pair (billboarded, aligned to the sun direction,
//   occluded by the bodies) and thin bubble trails from both blowholes.
//
// LOCAL SPACE (differs from the usual "base centre" because this hero swims on a spline)
//   Origin = the MOTHER'S BODY CENTRE. +Y up. She faces and travels toward +Z. Rostrum tip at z = +L/2, fluke
//   notch at z = -L/2. The world moves/rotates hero.object along its own spline (look along +Z = tangent) and
//   keys that from path progress u. Natural cruise speed is ~2-3 m/s. ground:false; no base.
//
// OPTS
//   palette      array of 7 hex strings (brief order: pale light, sea green, teal, deep teal, abyss, kelp gold,
//                garibaldi orange). Default = the brief's palette.
//   length       mother length in metres (default: per-seed 14.2-15.8)
//   calfLength   default per-seed 4.6-5.5
//   calfSide     +1 (calf on her +X side) or -1. Default per-seed. Put the calf on the side the camera sees.
//   rays         true | false  sun shafts around the pair (default true)
//   bubbles      true | false  (default true)
//   surfaceY     height of the sea surface above the origin in metres; shafts fade out below it (default 12)
//   sunDir       THREE.Vector3 pointing TO the sun in world space (default up and slightly ahead)
//   progress     initial value for setProgress (default 0)
//
// RETURNS (besides the contract fields)
//   setProgress(p)   p = 0..1 across the pass (the world maps u 0.40..0.68 to 0..1). Drives the scripted beats:
//                    the mother banks toward the calf side and lifts her high-side fin around p = 0.5 (when she
//                    is overhead) and the calf drops ~1.6 m and does one slow barrel roll at p = 0.45..0.8.
//                    Purely a function of p; ambient swimming (spine wave, fins, bubbles, caustics) runs on time.
//   setLight({ sunDir, sunColor, skyColor, deepColor, rimColor, caustic, surfaceY, rayGain })   any subset;
//                    THREE.Color / Vector3 / numbers. skyColor = ambient from above, deepColor = from below.
//                    Call it with the water kit's values so the whale shares the world's light.
//   uniforms         the shared uniform block ({ uTime, uSunDir, uSunCol, uSkyCol, uDeepCol, uRimCol, uCaustic })
//   calfSide, length, calfLength, triangles   the per-seed values actually used
//
// ANCHORS (all local space)
//   bodyCenter, head, blowhole, eyeL, eyeR, flukes, calfCenter   landmarks; `center` (the pair's visual centre)
//                    is the point for the camera poi (transform by object.matrixWorld each frame).
//   flyUnder         ordered points for the safe camera line under the pair, travelling the same way (+Z), 14 m
//                    or more below her spine: this is the staging the brief asks for (dark body, white fins,
//                    rays breaking around). Nothing solid within 9 m of it.
//   viewpoints       { below, belowAhead, flank, calfSide } good camera positions looking at `center`.
//   clearance        { radius, minCameraDistance } keep the camera at least minCameraDistance from the origin.
//   travel           { heading:+Z, speed } suggested swim speed in m/s so the fluke beat matches the motion.
//   portalSeat       null: the exit portal belongs to the rock arch, not to the whales.
//
// SIZE   radius ~10 m, height ~9 m (pair without the shafts; shafts reach surfaceY above and 26 m below).
// COST   ~41k triangles (mother ~29k, calf ~11.5k), 4 draw calls (mother, calf, shafts, bubbles), no lights,
//        no textures. Build ~150-250 ms in steps of a few ms: the geometry builder awaits
//        ctx.yield() after every body ring, every few fin rows and barnacle clusters, and while it sums the normals.
// LIGHT  Self-lit ShaderMaterials (they ignore scene lights): hemisphere ambient skyColor/deepColor, one sun
//        direction with animated caustics on up-facing skin, a back-light rim. Scene fog is honoured.
//        Wants a bright surface behind/above it and teal water fog; bloom threshold ~0.9 is fine.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, bell } from '../kit/core.js';

const DEFAULT_PALETTE = ['#e8f6c8', '#5fb89a', '#1f7f86', '#0d4a5c', '#062a38', '#a88f2e', '#ff8a3c'];

// ---------------------------------------------------------------- small helpers
// Catmull-Rom through [[x,y],...] with non-uniform knots
function tab(T, x) {
  const n = T.length;
  if (x <= T[0][0]) return T[0][1];
  if (x >= T[n - 1][0]) return T[n - 1][1];
  let i = 0; while (i < n - 2 && x > T[i + 1][0]) i++;
  const x0 = T[i][0], x1 = T[i + 1][0], y0 = T[i][1], y1 = T[i + 1][1], h = x1 - x0, t = (x - x0) / h;
  const m0 = i > 0 ? (y1 - T[i - 1][1]) / (x1 - T[i - 1][0]) : (y1 - y0) / h;
  const m1 = i < n - 2 ? (T[i + 2][1] - y0) / (T[i + 2][0] - x0) : (y1 - y0) / h;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * h * m0 + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * h * m1;
}

// growing vertex buffer: position, colour, aAnim(finSide, finV, kind), aMat(cos, sin, pleat). Typed arrays from
// the start (no garbage from growing lists while the page is flying the world before this one).
function makeBuf(capV = 20000, capI = 100000) {
  const grow = (a) => { const b = new a.constructor(a.length * 2); b.set(a); return b; };
  return {
    pos: new Float32Array(capV * 3), col: new Float32Array(capV * 3), anim: new Float32Array(capV * 3), mat: new Float32Array(capV * 3),
    idx: new Uint32Array(capI), n: 0, ni: 0,
    v(x, y, z, r, g, b, a0, a1, a2, m0, m1, m2) {
      const k = this.n * 3;
      if (k + 3 > this.pos.length) { this.pos = grow(this.pos); this.col = grow(this.col); this.anim = grow(this.anim); this.mat = grow(this.mat); }
      this.pos[k] = x; this.pos[k + 1] = y; this.pos[k + 2] = z; this.col[k] = r; this.col[k + 1] = g; this.col[k + 2] = b;
      this.anim[k] = a0; this.anim[k + 1] = a1; this.anim[k + 2] = a2; this.mat[k] = m0; this.mat[k + 1] = m1; this.mat[k + 2] = m2;
      return this.n++;
    },
    tri(a, b, c) {
      if (this.ni + 3 > this.idx.length) this.idx = grow(this.idx);
      this.idx[this.ni] = a; this.idx[this.ni + 1] = b; this.idx[this.ni + 2] = c; this.ni += 3;
    },
  };
}

// Packs the buffer into a geometry and works out smooth normals (area-weighted face normals summed per vertex, the
// same rule as three's computeVertexNormals) a few thousand triangles at a time, handing the page back in between.
async function finishGeometry(buf, pause) {
  const g = new THREE.BufferGeometry(), n3 = buf.n * 3, P = buf.pos, I = buf.idx, NI = buf.ni;
  g.setAttribute('position', new THREE.BufferAttribute(P.slice(0, n3), 3));
  g.setAttribute('color', new THREE.BufferAttribute(buf.col.slice(0, n3), 3));
  g.setAttribute('aAnim', new THREE.BufferAttribute(buf.anim.slice(0, n3), 3));
  g.setAttribute('aMat', new THREE.BufferAttribute(buf.mat.slice(0, n3), 3));
  g.setIndex(new THREE.BufferAttribute(buf.n > 65535 ? I.slice(0, NI) : new Uint16Array(I.subarray(0, NI)), 1));
  await pause();
  const nor = new Float32Array(n3);
  for (let t = 0; t < NI; t += 3) {
    const a = I[t] * 3, b = I[t + 1] * 3, c = I[t + 2] * 3;
    const ux = P[c] - P[b], uy = P[c + 1] - P[b + 1], uz = P[c + 2] - P[b + 2], vx = P[a] - P[b], vy = P[a + 1] - P[b + 1], vz = P[a + 2] - P[b + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    nor[a] += nx; nor[a + 1] += ny; nor[a + 2] += nz; nor[b] += nx; nor[b + 1] += ny; nor[b + 2] += nz; nor[c] += nx; nor[c + 1] += ny; nor[c + 2] += nz;
    if (t % 6000 === 0) await pause();
  }
  for (let k = 0; k < n3; k += 3) {
    const l = Math.hypot(nor[k], nor[k + 1], nor[k + 2]) || 1;
    nor[k] /= l; nor[k + 1] /= l; nor[k + 2] /= l;
    if (k % 12000 === 0) await pause();
  }
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  return g;
}

// ---------------------------------------------------------------- whale body profile (fractions of length)
const W_TAB = [[0, 0], [0.004, 0.018], [0.015, 0.036], [0.04, 0.057], [0.09, 0.077], [0.17, 0.097], [0.28, 0.112],
  [0.36, 0.113], [0.48, 0.1], [0.6, 0.079], [0.72, 0.054], [0.82, 0.034], [0.9, 0.021], [0.96, 0.015], [1, 0.011]];
const T_TAB = [[0, 0.002], [0.004, 0.008], [0.02, 0.016], [0.06, 0.024], [0.12, 0.036], [0.17, 0.057], [0.2, 0.067],
  [0.24, 0.066], [0.34, 0.084], [0.46, 0.093], [0.58, 0.086], [0.66, 0.077], [0.76, 0.056], [0.86, 0.038], [0.94, 0.025], [1, 0.012]];
const B_TAB = [[0, 0.002], [0.004, 0.014], [0.02, 0.036], [0.06, 0.064], [0.12, 0.09], [0.2, 0.11], [0.3, 0.117],
  [0.42, 0.108], [0.52, 0.092], [0.62, 0.074], [0.72, 0.056], [0.82, 0.041], [0.9, 0.031], [0.96, 0.023], [1, 0.012]];
const PEC_CHORD = [[0, 0.52], [0.12, 0.76], [0.32, 1.0], [0.58, 0.9], [0.8, 0.66], [0.93, 0.4], [1, 0.05]];

// Builds one whale as a single merged geometry. P: { L, girth, pecRatio, white, pleats, barnacles, calf, rng, noise, pal }
async function buildWhaleGeometry(P, pause) {
  const { L, rng, noise } = P;
  const buf = makeBuf(P.calf ? 9000 : 20000, P.calf ? 40000 : 100000);
  const nz = rng.range(0, 100);
  const girth = P.girth;
  const dark = P.dark, pale = P.pale;
  // mouth line: height (in sin of the section angle) falling from the rostrum tip to the jaw corner
  const mouthAt = (s) => lerp(0.3, -0.12, smoothstep(0.0, 0.2, s));
  const headK = (s) => 1 - smoothstep(0.17, 0.27, s);

  // surface point of the body: s 0 (rostrum) .. 1 (tail stock end), phi section angle (0 = +X flank, PI/2 = back)
  function bodyPt(s, phi, out, inset = 1) {
    const c = Math.cos(phi), sn = Math.sin(phi);
    const knuckle = 0.004 * Math.max(0, Math.sin((s - 0.7) * 95)) * bell(s, 0.7, 0.93, 0.2);
    const hump = 0.012 * Math.exp(-(((s - 0.64) / 0.045) ** 2));
    const w = L * tab(W_TAB, s) * girth, t = L * (tab(T_TAB, s) * girth + knuckle + hump), b = L * tab(B_TAB, s) * girth;
    const hk = headK(s), upper = smoothstep(-0.07, 0.07, sn - mouthAt(s));
    let x = w * Math.sign(c) * Math.pow(Math.abs(c), 0.86);
    let y = (sn > 0 ? t : b) * Math.sign(sn) * Math.pow(Math.abs(sn), 0.9);
    x *= 1 - 0.2 * hk * upper;                                   // rostrum sits inside the broad lower jaw
    const lump = 1 + 0.02 * noise.n3(s * 7 + nz, c * 1.6, sn * 1.6) * smoothstep(0.02, 0.1, s);
    // throat pouch sags slightly between the jaws
    const sag = 1 + 0.05 * bell(s, 0.05, 0.42, 0.4) * smoothstep(-0.3, -0.95, sn);
    out.set(x * lump * inset, y * lump * sag * inset, L * (0.5 - s));
    return out;
  }

  function skin(s, c, sn, p) {
    const n1 = noise.fbm3(p.x * 0.55 + nz, p.y * 0.55, p.z * 0.4, 3), n2 = noise.n3(p.x * 2.3, p.y * 2.3 + nz, p.z * 2.3);
    const d = -sn;                                              // 1 at the keel
    const edge = lerp(0.95, 0.05, P.white);
    let wm = smoothstep(edge - 0.1, edge + 0.1, d + 0.45 * n1 + 0.08 * n2) * (1 - smoothstep(0.5, 0.74, s + 0.08 * n1));
    wm = Math.max(wm, 0.75 * smoothstep(0.55, 0.9, d) * (1 - smoothstep(0.3, 0.6, s)) * P.white);
    const flank = smoothstep(0.35, -0.7, sn);
    let r = dark.r * (1 + 0.9 * flank + 0.35 * n2), g = dark.g * (1 + 0.9 * flank + 0.35 * n2), b = dark.b * (1 + 0.85 * flank + 0.3 * n2);
    r = lerp(r, pale.r, wm); g = lerp(g, pale.g, wm); b = lerp(b, pale.b, wm);
    // mouth line and pale lower lip
    const hk = headK(s), dm = sn - mouthAt(s);
    const line = hk * Math.exp(-((dm / 0.045) ** 2)), lip = hk * Math.exp(-(((dm + 0.12) / 0.06) ** 2)) * 0.35;
    r = lerp(r, pale.r * 0.8, lip); g = lerp(g, pale.g * 0.8, lip); b = lerp(b, pale.b * 0.8, lip);
    const k = 1 - 0.8 * line; r *= k; g *= k; b *= k;
    // blowhole slits
    const bh = Math.exp(-(((s - 0.192) / 0.012) ** 2)) * Math.exp(-(((Math.abs(c) - 0.1) / 0.06) ** 2)) * (sn > 0.8 ? 1 : 0);
    const kb = 1 - 0.85 * bh; r *= kb; g *= kb; b *= kb;
    return [r, g, b];
  }

  // ---- body loft
  const NS = P.calf ? 84 : 128, NR = P.calf ? 48 : 68;
  const p = new THREE.Vector3();
  const base = buf.n;
  for (let i = 0; i <= NS; i++) {
    const u = i / NS, s = Math.pow(u, 1.18);
    for (let j = 0; j < NR; j++) {
      const phi = Math.PI * 0.5 + (j / NR) * Math.PI * 2;     // start at the dorsal ridge
      bodyPt(s, phi, p);
      const c = Math.cos(phi), sn = Math.sin(phi);
      const col = skin(s, c, sn, p);
      const below = headK(s) > 0.02 ? smoothstep(0.02, -0.1, sn - mouthAt(s)) : 0;
      const pleat = Math.max(smoothstep(-0.12, -0.5, sn), below * headK(s)) * smoothstep(0.012, 0.06, s) * (1 - smoothstep(0.44, 0.55, s));
      buf.v(p.x, p.y, p.z, col[0], col[1], col[2], 0, 0, 0, c, sn, pleat);
    }
    await pause();
  }
  for (let i = 0; i < NS; i++) {
    for (let j = 0; j < NR; j++) {
      const a = base + i * NR + j, b = base + i * NR + (j + 1) % NR, c = a + NR, d = b + NR;
      buf.tri(a, c, b); buf.tri(b, c, d);
    }
    if (i % 8 === 7) await pause();
  }

  // frame + normal on the body surface
  const q1 = new THREE.Vector3(), q2 = new THREE.Vector3();
  function bodyFrame(s, phi, outP, outN) {
    bodyPt(s, phi, outP); bodyPt(Math.min(1, s + 0.004), phi, q1); bodyPt(s, phi + 0.02, q2);
    outN.crossVectors(q1.sub(outP), q2.sub(outP)).normalize();
    return outP;
  }
  const t1 = new THREE.Vector3(), t2 = new THREE.Vector3();
  function tangents(N) {
    t1.set(0, 1, 0); if (Math.abs(N.y) > 0.9) t1.set(1, 0, 0);
    t1.crossVectors(N, t1).normalize(); t2.crossVectors(N, t1);
  }
  // rounded bump (tubercle, eye) seated on a surface
  function addBlob(C, N, r, h, col, anim, kind, rings = 3, segs = 7) {
    tangents(N);
    const b0 = buf.n;
    for (let k = 0; k < rings; k++) {
      const th = (k / rings) * Math.PI * 0.5, rr = r * Math.cos(th), hh = k === 0 ? -0.25 * h : h * Math.sin(th), sh = k === 0 ? 0.8 : 1;
      for (let j = 0; j < segs; j++) {
        const a = (j / segs) * Math.PI * 2, cx = Math.cos(a) * rr, cy = Math.sin(a) * rr;
        buf.v(C.x + t1.x * cx + t2.x * cy + N.x * hh, C.y + t1.y * cx + t2.y * cy + N.y * hh, C.z + t1.z * cx + t2.z * cy + N.z * hh,
          col[0] * sh, col[1] * sh, col[2] * sh, anim[0], anim[1], kind, 0, 1, 0);
      }
    }
    const top = buf.v(C.x + N.x * h, C.y + N.y * h, C.z + N.z * h, col[0] * 1.1, col[1] * 1.1, col[2] * 1.1, anim[0], anim[1], kind, 0, 1, 0);
    for (let k = 0; k < rings - 1; k++) for (let j = 0; j < segs; j++) {
      const a = b0 + k * segs + j, b = b0 + k * segs + (j + 1) % segs, c = a + segs, d = b + segs;
      buf.tri(a, b, c); buf.tri(b, d, c);
    }
    for (let j = 0; j < segs; j++) buf.tri(b0 + (rings - 1) * segs + j, b0 + (rings - 1) * segs + (j + 1) % segs, top);
  }
  // acorn barnacle: ribbed truncated cone with a dark mouth
  function addBarnacle(C, N, r, h, anim) {
    tangents(N);
    const b0 = buf.n, SEG = 6, tint = rng.range(0.45, 1.0), rot = rng.range(0, 6.28);
    for (let k = 0; k < 2; k++) {
      const rr = k === 0 ? r : r * 0.5, hh = k === 0 ? -0.3 * h : h, sh = (k === 0 ? 0.62 : 1.0) * tint;
      for (let j = 0; j < SEG; j++) {
        const a = rot + (j / SEG) * Math.PI * 2, wob = k === 0 ? 1 + 0.25 * (j & 1) : 1, cx = Math.cos(a) * rr * wob, cy = Math.sin(a) * rr * wob;
        buf.v(C.x + t1.x * cx + t2.x * cy + N.x * hh, C.y + t1.y * cx + t2.y * cy + N.y * hh, C.z + t1.z * cx + t2.z * cy + N.z * hh,
          0.56 * sh, 0.54 * sh, 0.43 * sh, anim[0], anim[1], 1, 0, 1, 0);
      }
    }
    const top = buf.v(C.x + N.x * h * 0.45, C.y + N.y * h * 0.45, C.z + N.z * h * 0.45, 0.17, 0.16, 0.13, anim[0], anim[1], 1, 0, 1, 0);
    for (let j = 0; j < SEG; j++) {
      const a = b0 + j, b = b0 + (j + 1) % SEG, c = a + SEG, d = b + SEG;
      buf.tri(a, b, c); buf.tri(b, d, c); buf.tri(c, d, top);
    }
  }
  const BR = L * 0.0042 * (P.calf ? 1.6 : 1);
  function barnacleCluster(s, phi, count, spread) {
    const C = new THREE.Vector3(), N = new THREE.Vector3();
    for (let i = 0; i < count; i++) {
      const rr = spread * Math.sqrt(rng()), a = rng.range(0, 6.28);
      const ss = clamp(s + (Math.cos(a) * rr) / L, 0.006, 0.99), wl = Math.max(0.2, L * tab(W_TAB, ss));
      bodyFrame(ss, phi + (Math.sin(a) * rr) / wl, C, N);
      const r = BR * rng.range(0.7, 1.5);
      addBarnacle(C, N, r, r * rng.range(0.7, 1.1), [0, 0]);
    }
  }

  // ---- lofted fin. Returns a sampler for points on its leading edge.
  async function addFin(o) {
    const span = o.span.clone().normalize();
    const chord = o.chord.clone().addScaledVector(span, -o.chord.dot(span)).normalize();
    const up = new THREE.Vector3().crossVectors(span, chord).normalize();
    let flip = false; if (up.y < 0) { up.negate(); flip = true; }
    const nV = o.nV, nU = o.nU, b0 = buf.n, pt = new THREE.Vector3();
    const at = (v, a, out) => {
      const xc = (1 - Math.cos(a)) * 0.5, c = o.chordFn(v), th = o.thick(v) * (o.tipRound ? Math.sqrt(Math.max(0, 1 - Math.pow(v, 6))) : 1);
      const prof = Math.min(1, 2.6 * Math.sqrt(xc) * (1 - xc)) * Math.sign(Math.sin(a) || 0);
      const along = -o.sweepFn(v) - xc * c, lift = prof * th * 0.5 + (o.curl ? o.curl(v) : 0);
      return out.copy(o.root).addScaledVector(span, o.len * v).addScaledVector(chord, along).addScaledVector(up, lift);
    };
    for (let i = 0; i <= nV; i++) {
      const v = 1 - Math.pow(1 - i / nV, 1.25);
      for (let j = 0; j < nU; j++) {
        const a = (j / nU) * Math.PI * 2;
        at(v, a, pt);
        const col = o.colFn(v, (1 - Math.cos(a)) * 0.5, Math.sin(a) >= 0, pt);
        buf.v(pt.x, pt.y, pt.z, col[0], col[1], col[2], o.side, v, -(o.thin ? o.thin(v, (1 - Math.cos(a)) * 0.5) : 0), 0, 1, 0);
      }
      await pause();
    }
    await pause();
    for (let i = 0; i < nV; i++) for (let j = 0; j < nU; j++) {
      const a = b0 + i * nU + j, b = b0 + i * nU + (j + 1) % nU, c = a + nU, d = b + nU;
      if (flip) { buf.tri(a, c, b); buf.tri(b, c, d); } else { buf.tri(a, b, c); buf.tri(b, d, c); }
    }
    return { at, chord, up, span };
  }

  // ---- pectoral fins (the humpback's signature: a third of the body length, mostly white, knobbed front edge)
  const pecLen = L * P.pecRatio, cmax = pecLen * 0.235;
  const knob = (v) => cmax * 0.1 * Math.pow(Math.max(0, Math.sin(v * Math.PI * 8.5 + 0.6)), 2) * smoothstep(0.08, 0.2, v) * (1 - smoothstep(0.9, 1, v));
  const fins = [], rootP = new THREE.Vector3(), tmpN = new THREE.Vector3();
  let pivot = null;
  for (const side of [1, -1]) {
    await pause();
    bodyPt(0.29, side > 0 ? -0.52 : Math.PI + 0.52, rootP, 0.88);
    if (side > 0) pivot = rootP.clone();
    const fnz = rng.range(0, 50);
    fins.push({ side, fin: await addFin({
      root: rootP.clone(), span: new THREE.Vector3(side * 0.84, -0.3, -0.44), chord: new THREE.Vector3(side * 0.1, 0.12, 1),
      len: pecLen, nV: P.calf ? 20 : 34, nU: 14, side, tipRound: true, thin: (v, xc) => clamp(0.25 + 0.5 * v + 0.45 * xc, 0, 1),
      chordFn: (v) => cmax * tab(PEC_CHORD, v) + knob(v),
      sweepFn: (v) => pecLen * 0.2 * Math.pow(v, 1.9) - knob(v),
      thick: (v) => cmax * 0.3 * (1 - 0.68 * v),
      curl: (v) => -pecLen * 0.035 * v * v,
      colFn: (v, xc, top, q) => {
        const n = noise.fbm3(q.x * 0.9 + fnz, q.y * 0.9, q.z * 0.9, 3);
        let dk = smoothstep(0.34, 0.06, v + 0.3 * n);                       // dark shoulder
        if (top) dk = Math.max(dk, P.pecDark * smoothstep(0.1, -0.25, n + (xc - 0.4) * 0.8));
        const tipShade = 1 - 0.12 * smoothstep(0.85, 1, v);
        return [lerp(pale.r * tipShade, dark.r * 1.4, dk), lerp(pale.g * tipShade, dark.g * 1.4, dk), lerp(pale.b * tipShade, dark.b * 1.4, dk)];
      },
    }) });
  }

  // ---- flukes
  const flukes = [], fl0 = rng.range(0, 50), flWhite = P.flukeWhite;
  for (const side of [1, -1]) {
    await pause();
    flukes.push({ side, fin: await addFin({
      root: new THREE.Vector3(0, L * 0.002, -L * 0.412), span: new THREE.Vector3(side, 0, -0.1), chord: new THREE.Vector3(0, 0, 1),
      len: L * 0.186, nV: P.calf ? 18 : 30, nU: 12, side: 0, thin: (v, xc) => clamp(0.15 + 0.35 * v + 0.5 * xc, 0, 1),
      chordFn: (v) => (L * 0.106 * Math.pow(1 - v, 0.78) + L * 0.004) * (1 - 0.22 * Math.exp(-((v / 0.07) ** 2)))
        + L * 0.0035 * Math.sin(v * 58 + side * 1.3) * smoothstep(0.08, 0.3, v) * (1 - v),
      sweepFn: (v) => L * 0.088 * Math.pow(v, 1.4),
      thick: (v) => L * 0.02 * (1 - 0.8 * v) + L * 0.002,
      curl: (v) => -L * 0.006 * v * v,
      colFn: (v, xc, top, q) => {
        if (top) { const n = noise.n3(q.x + fl0, q.y, q.z); return [dark.r * (1.1 + 0.3 * n), dark.g * (1.1 + 0.3 * n), dark.b * (1.1 + 0.3 * n)]; }
        const n = noise.fbm3(Math.abs(q.x) * 0.7 + fl0, 3.1, q.z * 0.7, 3);   // mirrored, like a real fluke print
        const wm = smoothstep(0.1, -0.15, n - (flWhite - 0.5) * 1.2 + smoothstep(0.6, 0.95, xc) * 0.9 + smoothstep(0.2, 0.0, v) * 0.6);
        return [lerp(dark.r * 1.3, pale.r, wm), lerp(dark.g * 1.3, pale.g, wm), lerp(dark.b * 1.3, pale.b, wm)];
      },
    }) });
  }
  await pause();
  // ---- small falcate dorsal fin on its hump
  bodyPt(0.645, Math.PI * 0.5, rootP, 0.93);
  await addFin({ root: rootP.clone(), span: new THREE.Vector3(0, 1, -0.9), chord: new THREE.Vector3(0, 0.35, 1), len: L * 0.034, nV: 7, nU: 8, side: 0,
    chordFn: (v) => L * 0.06 * Math.pow(1 - v, 0.7) + L * 0.004, sweepFn: (v) => L * 0.012 * v * v, thick: (v) => L * 0.014 * (1 - 0.6 * v),
    colFn: () => [dark.r * 1.05, dark.g * 1.05, dark.b * 1.05] });

  // ---- eyes
  const C = new THREE.Vector3(), N = new THREE.Vector3(), eyes = [];
  for (const side of [1, -1]) {
    const phi = side > 0 ? -0.02 : Math.PI + 0.02;
    bodyFrame(0.212, phi, C, N);
    addBlob(C, N, L * 0.013, L * 0.0032, [dark.r * 0.9, dark.g * 0.9, dark.b * 0.9], [0, 0], 0, 2, 9);
    addBlob(C, N, L * 0.0062, L * 0.0048, [0.012, 0.012, 0.014], [0, 0], 2, 3, 8);
    eyes.push(C.clone());
  }

  // ---- tubercles on rostrum and lower jaw, each a likely barnacle seat
  const tub = [];
  for (let i = 0; i < 6; i++) tub.push([0.022 + i * 0.024 + rng.range(-0.004, 0.004), Math.PI * 0.5 + rng.range(-0.05, 0.05), 1.2]);
  for (const sd of [1, -1]) {
    for (let i = 0; i < 6; i++) tub.push([0.03 + i * 0.025 + rng.range(-0.005, 0.005), Math.PI * 0.5 + sd * (0.62 + 0.05 * i) + rng.range(-0.05, 0.05), 1]);
    for (let i = 0; i < 8; i++) tub.push([0.016 + i * 0.021 + rng.range(-0.004, 0.004), (sd > 0 ? 0 : Math.PI) - sd * (-0.12 + 0.26 * smoothstep(0, 7, i)) - sd * rng.range(0, 0.08), 1.1]);
    for (let i = 0; i < 4; i++) tub.push([0.012 + i * 0.016, (sd > 0 ? 0 : Math.PI) - sd * (0.75 + rng.range(-0.1, 0.1)), 0.9]);
  }
  tub.push([0.008, -Math.PI * 0.5, 1.8]);
  let tn = 0;
  for (const [s, phi, k] of tub) {
    if (tn++ % 3 === 2) await pause();
    bodyFrame(s, phi, C, N);
    const col = skin(s, Math.cos(phi), Math.sin(phi), C), r = L * 0.0072 * k * rng.range(0.85, 1.2);
    const tr = lerp(col[0], dark.r * 1.9, 0.7), tg = lerp(col[1], dark.g * 1.9, 0.7), tb = lerp(col[2], dark.b * 1.9, 0.7);
    addBlob(C, N, r, r * 0.62, [tr, tg, tb], [0, 0], 0, 3, 7);
    if (rng.chance(0.55 * P.barnacles)) barnacleCluster(s, phi, rng.int(1, 3), r * 1.3);
  }

  // ---- barnacle crusts: chin, throat pleats, fin leading edges, fluke tips
  if (P.barnacles > 0) {
    const dens = P.barnacles;
    await pause();
    for (let i = 0; i < Math.round(5 * dens); i++) { barnacleCluster(rng.range(0.008, 0.05), -Math.PI * 0.5 + rng.range(-0.7, 0.7), rng.int(6, 12), L * 0.016); await pause(); }
    await pause();
    for (let i = 0; i < Math.round(11 * dens); i++) { barnacleCluster(rng.range(0.07, 0.46), -Math.PI * 0.5 + rng.range(-0.9, 0.9), rng.int(4, 10), L * 0.02); await pause(); }
    for (let i = 0; i < Math.round(4 * dens); i++) barnacleCluster(rng.range(0.52, 0.7), -Math.PI * 0.5 + rng.range(-0.25, 0.25), rng.int(3, 7), L * 0.014);
    for (const { side, fin } of fins) {
      await pause();
      for (let k = 0; k < 8; k++) {
        if (k === 4) await pause();
        const v = clamp((Math.PI * (k + 0.5) - 0.6) / (Math.PI * 8.5) + 0.06, 0.1, 0.97);
        const nb = Math.round(rng.int(2, 5) * dens);
        for (let i = 0; i < nb; i++) {
          const a = rng.range(-0.5, 0.5); fin.at(clamp(v + rng.range(-0.012, 0.012), 0, 1), a, C);
          N.copy(fin.chord).addScaledVector(fin.up, Math.sin(a) * 1.5).normalize();
          const r = BR * rng.range(0.7, 1.4); addBarnacle(C, N, r, r, [side, v]);
        }
      }
      const nt = Math.round(7 * dens);
      for (let i = 0; i < nt; i++) {
        const v = rng.range(0.9, 0.995), a = rng.range(0, 6.28); fin.at(v, a, C);
        N.copy(fin.up).multiplyScalar(Math.sin(a) >= 0 ? 1 : -1); const r = BR * rng.range(0.6, 1.2); addBarnacle(C, N, r, r, [side, v]);
      }
    }
    for (const { fin } of flukes) {
      await pause();
      const nt = Math.round(12 * dens);
      for (let i = 0; i < nt; i++) {
        const tip = rng.chance(0.5), v = tip ? rng.range(0.82, 0.99) : rng.range(0.2, 0.9), a = tip ? rng.range(0, 6.28) : Math.PI + rng.range(-0.35, 0.35);
        fin.at(v, a, C); N.copy(fin.up).multiplyScalar(Math.sin(a) >= 0 ? 1 : -1);
        if (!tip) N.addScaledVector(fin.chord, -1).normalize();
        const r = BR * rng.range(0.6, 1.2); addBarnacle(C, N, r, r, [0, 0]);
      }
    }
  }
  bodyPt(0.192, Math.PI * 0.5, C);
  await pause();
  const geometry = await finishGeometry(buf, pause);
  await pause();
  return { geometry, pivot, eyes, blowhole: C.clone(), triangles: buf.ni / 3 };
}

// ---------------------------------------------------------------- shaders
const GLSL_NOISE = /* glsl */`
float hash31(vec3 p){ p = fract(p*vec3(0.1031,0.1030,0.0973)); p += dot(p, p.yzx+33.33); return fract((p.x+p.y)*p.z); }
float vnoise(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x), mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x), mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x), f.y), f.z); }
float fbm3(vec3 p){ return 0.5*vnoise(p) + 0.3*vnoise(p*2.1+3.7) + 0.2*vnoise(p*4.3+9.1); }
float caustic(vec2 p, float t){
  const float TAU = 6.2831853; vec2 pp = mod(p*TAU, TAU) - 250.0; vec2 i = pp; float c = 1.0; const float inten = 0.005;
  for (int n = 0; n < 4; n++) { float tt = t*(1.0 - (3.5/float(n+1)));
    i = pp + vec2(cos(tt - i.x) + sin(tt + i.y), sin(tt - i.y) + cos(tt + i.x));
    vec2 sc = vec2(sin(i.x+tt), cos(i.y+tt)); sc = mix(vec2(-1.0), vec2(1.0), step(0.0, sc))*max(abs(sc), 1e-3);   // never divide by zero
    c += 1.0/max(length(pp*inten/sc), 1e-6); }
  c /= 4.0; c = 1.17 - pow(max(c, 0.0), 1.4); return pow(abs(c), 8.0); }
`;

const WHALE_VERT = /* glsl */`
attribute vec3 aAnim; attribute vec3 aMat;
uniform float uLen, uPhase, uAmp; uniform vec3 uPivot, uFinR, uFinL;
varying vec3 vCol, vN, vWP, vRest, vMat, vAxis; varying float vKind;
#include <fog_pars_vertex>
float bend(float z, float lag){
  float s = 0.5 - z/uLen; float w = smoothstep(0.2, 1.1, s); w = w*w*(0.55 + 0.45*w);
  return uAmp*(w*sin(uPhase - s*3.0 - lag) + 0.09*(1.0 - smoothstep(0.0, 0.5, s))*sin(uPhase + 2.0));
}
void main(){
  vec3 p = position, n = normal;
  float side = aAnim.x, isFin = step(0.5, abs(side));
  if (isFin > 0.5) {
    vec3 piv = vec3(side*uPivot.x, uPivot.y, uPivot.z);
    vec3 f = side > 0.0 ? uFinR : uFinL; float v = aAnim.y;
    float flap = side*(f.x + f.y*sin(uPhase*0.5 + 0.8 + side*0.35 - v*1.5))*(0.35 + 0.9*v);
    float sweep = side*f.z*(0.4 + 0.6*v);
    vec3 r = p - piv; float c = cos(flap), s = sin(flap);
    r.xy = vec2(r.x*c - r.y*s, r.x*s + r.y*c); n.xy = vec2(n.x*c - n.y*s, n.x*s + n.y*c);
    c = cos(sweep); s = sin(sweep);
    r.xz = vec2(r.x*c + r.z*s, -r.x*s + r.z*c); n.xz = vec2(n.x*c + n.z*s, -n.x*s + n.z*c);
    p = piv + r;
  }
  float zr = mix(position.z, uPivot.z, isFin);
  float lag = (1.0 - isFin)*abs(position.x)/uLen*2.2*(1.0 - smoothstep(-0.46, -0.36, position.z/uLen));
  float e = 0.02*uLen;
  float b0 = bend(zr, lag), slope = (bend(zr + e, lag) - bend(zr - e, lag))/(2.0*e);
  float a = atan(slope), ca = cos(a), sa = sin(a), zrel = p.z - zr, yr = p.y;
  p.y = b0 + yr*ca + zrel*sa; p.z = zr - yr*sa + zrel*ca;
  n.yz = vec2(n.y*ca + n.z*sa, -n.y*sa + n.z*ca);
  vec4 wp = modelMatrix*vec4(p, 1.0);
  vWP = wp.xyz; vN = normalize(mat3(modelMatrix)*n); vAxis = normalize(mat3(modelMatrix)*vec3(0.0, sa, ca));
  vCol = color; vRest = position; vMat = aMat; vKind = aAnim.z;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;

const WHALE_FRAG = /* glsl */`
uniform float uTime, uPleatN, uSeed, uCaustic;
uniform vec3 uSunDir, uSunCol, uSkyCol, uDeepCol, uRimCol;
varying vec3 vCol, vN, vWP, vRest, vMat, vAxis; varying float vKind;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 N = normalize(vN); vec3 V = normalize(cameraPosition - vWP);
  float skin = 1.0 - step(0.5, vKind), eye = step(1.5, vKind), thin = clamp(-vKind, 0.0, 1.0);
  float n1 = fbm3(vRest*1.3 + uSeed), n2 = vnoise(vRest*8.0 + uSeed);
  vec3 alb = vCol*(0.8 + 0.4*n1)*(0.88 + 0.24*n2);
  // healed scars and rake marks: thin pale scratches in patches
  float sc = sin((vRest.x*1.3 + vRest.y*4.0 + vRest.z*0.5 + vnoise(vRest*0.6 + uSeed)*9.0)*3.0);
  float scar = smoothstep(0.985, 1.0, sc)*smoothstep(0.58, 0.75, vnoise(vRest*0.4 + 7.0 + uSeed))*smoothstep(0.4, 0.6, vnoise(vRest*2.2 + uSeed))*skin;
  alb = mix(alb, vec3(0.3, 0.33, 0.32), scar*0.4);
  // ventral pleats
  float pl = vMat.z*skin; float g = atan(vMat.y, vMat.x)*uPleatN;
  vec3 T = normalize(cross(normalize(vAxis + vec3(0.0, 0.0, 1e-5)), N) + vec3(1e-4, 0.0, 0.0));   // never a zero vector (rostrum tip, fluke notch)
  N = normalize(N + T*pl*0.6*sin(g));
  alb *= mix(1.0, 0.5 + 0.5*smoothstep(-1.0, -0.2, cos(g)), pl);
  // light: hemisphere of water colour, sun with caustics from above, back-light rim
  float up = N.y*0.5 + 0.5;
  vec3 amb = mix(uDeepCol, uSkyCol, up*up*(3.0 - 2.0*up))*(1.0 + 0.9*(1.0 - skin)*(1.0 - eye));
  float ndl = dot(N, uSunDir), sun = smoothstep(-0.2, 0.9, ndl);
  vec2 cq = (vWP.xz - uSunDir.xz/max(uSunDir.y, 0.2)*vWP.y)*0.05;
  float ca = caustic(cq, uTime*0.55) + 0.5*caustic(cq*1.7 + 3.1, uTime*0.4 + 4.0);
  vec3 lit = uSunCol*sun*(0.42 + uCaustic*ca*smoothstep(-0.05, 0.5, ndl));
  float fres = pow(max(1.0 - max(dot(N, V), 0.0), 0.0), 2.6);
  vec3 rim = uRimCol*fres*(0.3 + 0.7*smoothstep(-0.5, 0.6, N.y));
  vec3 H = normalize(V + uSunDir);
  float spec = pow(max(dot(N, H), 0.0), mix(36.0, 160.0, eye))*mix(0.22*skin, 3.0, eye)*sun;
  // thin fins and fluke edges let the sun through: seen from below they glow pale against the surface
  vec3 trans = uSunCol*vCol*thin*smoothstep(-0.15, 0.8, -ndl)*(0.5 + 0.45*ca);
  vec3 col = alb*(amb + lit) + trans + rim*(0.3 + 0.7*alb) + uSunCol*spec + eye*uSkyCol*fres*0.6;
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

function makeWhaleMaterial(shared, per) {
  return new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, per]),
    vertexShader: WHALE_VERT, fragmentShader: WHALE_FRAG, vertexColors: true, fog: true,
  });
}
// share (by reference) the light/time uniforms between all materials of the piece
function linkShared(mat, shared) { for (const k in shared) mat.uniforms[k] = shared[k]; return mat; }

// ---------------------------------------------------------------- sun shafts breaking around the pair
const RAY_VERT = /* glsl */`
attribute vec3 aBase; attribute vec4 aRay;      // aRay: width, phase, brightness, drift
uniform float uTime, uRayUp, uRayDown; uniform vec3 uSunDir;
varying vec2 vUv; varying vec3 vRay; varying float vNear;
#include <fog_pars_vertex>
void main(){
  float along = position.y, sideK = position.x;
  vec3 base = aBase + vec3(sin(uTime*0.11 + aRay.y), 0.0, cos(uTime*0.09 + aRay.y*1.7))*aRay.w;
  vec3 wb = (modelMatrix*vec4(base, 1.0)).xyz;
  // keep the shaft's anchor on the horizontal plane through the whale so it stays put when she rolls
  vec3 org = (modelMatrix*vec4(0.0, 0.0, 0.0, 1.0)).xyz; wb.y = org.y;
  vec3 P = wb + uSunDir*mix(-uRayDown, uRayUp, along)/max(uSunDir.y, 0.3);
  vec3 toCam = cameraPosition - P;
  vec3 sideV = normalize(cross(uSunDir, toCam) + vec3(1e-4, 0.0, 0.0));
  float w = aRay.x*(0.55 + 0.75*(1.0 - along));                      // shafts spread as they descend
  P += sideV*sideK*w;
  vUv = vec2(sideK, along); vRay = aRay.yzw; vNear = smoothstep(3.0, 16.0, length(toCam));
  vec4 mvPosition = viewMatrix*vec4(P, 1.0);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const RAY_FRAG = /* glsl */`
uniform float uTime, uRayGain; uniform vec3 uSunCol, uSkyCol;
varying vec2 vUv; varying vec3 vRay; varying float vNear;
#include <fog_pars_fragment>
void main(){
  float x = vUv.x, a = 1.0 - x*x; a *= a;
  float streak = 0.78 + 0.22*sin(x*6.0 + vRay.x*5.0 + uTime*0.3)*sin(x*13.0 - vRay.x*3.0);
  float len = smoothstep(0.0, 0.3, vUv.y)*(1.0 - smoothstep(0.82, 1.0, vUv.y));
  float core = 0.4 + 0.6*smoothstep(0.25, 0.75, vUv.y);              // brighter toward the surface
  float fl = 0.5 + 0.5*sin(uTime*0.7 + vRay.x*6.283)*sin(uTime*0.43 + vRay.x*11.0);
  float I = a*streak*len*core*(0.3 + 0.7*fl)*vRay.y*vNear*uRayGain;
  vec3 col = mix(uSkyCol, uSunCol, 0.65)*I;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      col *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

function buildRays(rng, L, count) {
  const base = [], ray = [], pos = [], idx = [];
  for (let i = 0; i < count; i++) {
    // an oval ring just outside the whale's plan outline, with a few stragglers further out
    const a = (i / count) * Math.PI * 2 + rng.range(-0.15, 0.15), far = rng.chance(0.3) ? rng.range(1.5, 2.3) : rng.range(0.95, 1.3);
    const bx = Math.cos(a) * L * 0.36 * far + L * 0.03, bz = Math.sin(a) * L * 0.6 * far - L * 0.02;
    const w = rng.range(1.3, 3.4) * (far > 1.4 ? 1.5 : 1), ph = rng.range(0, 6.28), br = rng.range(0.45, 1.0) * (far > 1.4 ? 0.7 : 1), dr = rng.range(0.3, 1.2);
    const v0 = pos.length / 3;
    for (const [sx, al] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { pos.push(sx, al, 0); base.push(bx, 0, bz); ray.push(w, ph, br, dr); }
    idx.push(v0, v0 + 1, v0 + 2, v0 + 1, v0 + 3, v0 + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 3));
  g.setAttribute('aRay', new THREE.Float32BufferAttribute(ray, 4));
  g.setIndex(idx);
  return g;
}

// ---------------------------------------------------------------- bubble trails from the blowholes
const BUB_VERT = /* glsl */`
attribute vec4 aSeed;                           // emitter (0 mother, 1 calf), phase, size, wobble
uniform float uTime, uTrail, uRise; uniform vec3 uEmit[2];
varying vec2 vUv; varying float vA;
#include <fog_pars_vertex>
void main(){
  float life = mix(9.0, 6.0, aSeed.x), age = fract(uTime/life + aSeed.y), t0 = uTime - age*life;
  float burst = smoothstep(0.15, 0.7, sin(t0*0.55 + aSeed.x*2.3) + 0.35*sin(t0*1.7 + aSeed.x));
  vec3 e = aSeed.x < 0.5 ? uEmit[0] : uEmit[1];
  float k = mix(1.0, 0.45, aSeed.x), wob = aSeed.w*6.283;
  vec3 p = e + vec3(sin(age*17.0 + wob)*0.5*age + cos(wob)*0.3*age, age*uRise*(0.7 + 0.6*fract(aSeed.y*7.3)), -age*uTrail + sin(wob*3.0)*0.6*age)*k;
  vec4 mvPosition = modelViewMatrix*vec4(p, 1.0);
  mvPosition.xy += position.xy*aSeed.z*(0.6 + 0.9*age);
  vUv = position.xy; vA = burst*smoothstep(0.0, 0.04, age)*(1.0 - smoothstep(0.6, 1.0, age))*smoothstep(2.0, 8.0, -mvPosition.z);
  gl_Position = projectionMatrix*mvPosition;
  #include <fog_vertex>
}`;
const BUB_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol;
varying vec2 vUv; varying float vA;
#include <fog_pars_fragment>
void main(){
  float d = length(vUv); if (d > 1.0) discard;
  float ring = smoothstep(0.5, 0.95, d)*(1.0 - smoothstep(0.9, 1.0, d));
  float hi = 1.0 - smoothstep(0.0, 0.35, length(vUv - vec2(-0.3, 0.38)));
  vec3 col = (uSkyCol*(0.25 + 1.1*ring) + uSunCol*hi*1.6)*vA;
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
    #else
      col *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;
function buildBubbles(rng, count) {
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3));
  g.setIndex([0, 1, 2, 1, 3, 2]);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const calf = i % 3 === 0 ? 1 : 0;
    seed.set([calf, rng(), (calf ? rng.range(0.025, 0.06) : rng.range(0.04, 0.11)) * (rng.chance(0.08) ? 1.8 : 1), rng()], i * 4);
  }
  g.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 4));
  g.instanceCount = count;
  return g;
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('kelp-cathedral-hero'), noise = ctx.noise;
  const palHex = opts.palette && opts.palette.length >= 5 ? opts.palette : DEFAULT_PALETTE;
  const pal = palHex.map((h) => new THREE.Color(h));
  const pick = (i) => pal[Math.min(i, pal.length - 1)];

  // ---- per-seed individuals
  const L = opts.length ?? rng.range(14.2, 15.8);
  const Lc = opts.calfLength ?? rng.range(4.6, 5.5);
  const calfSide = opts.calfSide ?? rng.sign();
  const white = rng.range(0.3, 0.8);
  const paleBase = pick(0).clone().lerp(new THREE.Color(1, 1, 1), 0.35).multiplyScalar(0.7);
  const darkBase = new THREE.Color(0.07, 0.082, 0.098).lerp(pick(4), 0.22);
  const root = new THREE.Group(); root.name = 'kelp-cathedral-hero';

  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(0.12, 1, 0.38)).normalize();
  const shared = {
    uTime: { value: 0 },
    uSunDir: { value: sunDir },
    uSunCol: { value: pick(0).clone().multiplyScalar(1.55) },
    uSkyCol: { value: pick(1).clone().lerp(pick(0), 0.3).multiplyScalar(0.62) },
    uDeepCol: { value: pick(2).clone().lerp(pick(0), 0.25).multiplyScalar(0.52) },
    uRimCol: { value: pick(0).clone().lerp(pick(1), 0.45).multiplyScalar(1.1) },
    uCaustic: { value: 1.25 },
  };

  const pause = typeof ctx.yield === 'function' ? () => ctx.yield() : async () => {};
  async function makeWhale(P, name) {
    const built = await buildWhaleGeometry(P, pause);
    built.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(), P.L * 0.8);
    const mat = linkShared(makeWhaleMaterial(shared, {
      uLen: { value: P.L }, uPhase: { value: 0 }, uAmp: { value: P.L * P.amp }, uPivot: { value: built.pivot.clone() },
      uFinR: { value: new THREE.Vector3(0.05, 0.16, 0) }, uFinL: { value: new THREE.Vector3(0.05, 0.16, 0) },
      uPleatN: { value: P.pleats }, uSeed: { value: rng.range(0, 40) },
      uTime: { value: 0 }, uSunDir: { value: null }, uSunCol: { value: null }, uSkyCol: { value: null },
      uDeepCol: { value: null }, uRimCol: { value: null }, uCaustic: { value: 1 },
    }), shared);
    const mesh = new THREE.Mesh(built.geometry, mat); mesh.name = name;
    const pivot = new THREE.Group(); pivot.add(mesh);
    return { ...built, mesh, mat, pivot, L: P.L };
  }

  const mother = await makeWhale({
    L, girth: rng.range(0.97, 1.05), pecRatio: rng.range(0.31, 0.34), white, pleats: rng.int(22, 30), barnacles: rng.range(0.75, 1.4),
    pecDark: rng.range(0, 0.45), flukeWhite: rng.range(0.25, 0.9), calf: false, amp: 0.07, rng: rng.fork('mother'), noise, dark: darkBase, pale: paleBase,
  }, 'humpback-mother');
  root.add(mother.pivot);
  await ctx.yield();

  const calf = await makeWhale({
    L: Lc, girth: 1.12, pecRatio: 0.285, white: clamp(white + rng.range(-0.15, 0.2), 0.3, 1), pleats: rng.int(18, 22), barnacles: 0,
    pecDark: rng.range(0, 0.3), flukeWhite: rng.range(0.3, 0.8), calf: true, amp: 0.085, rng: rng.fork('calf'), noise,
    dark: darkBase.clone().multiplyScalar(1.55), pale: paleBase.clone().multiplyScalar(0.95),
  }, 'humpback-calf');
  const calfHome = new THREE.Vector3(calfSide * L * 0.2, -L * 0.2, L * 0.07);
  calf.pivot.position.copy(calfHome);
  root.add(calf.pivot);
  await ctx.yield();

  // ---- sun shafts
  const surfaceY0 = opts.surfaceY ?? 12;
  let rays = null;
  if (opts.rays !== false) {
    const mat = linkShared(new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uRayUp: { value: surfaceY0 }, uRayDown: { value: 26 }, uRayGain: { value: 0.14 },
        uTime: { value: 0 }, uSunDir: { value: null }, uSunCol: { value: null }, uSkyCol: { value: null } }]),
      vertexShader: RAY_VERT, fragmentShader: RAY_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, fog: true,
    }), { uTime: shared.uTime, uSunDir: shared.uSunDir, uSunCol: shared.uSunCol, uSkyCol: shared.uSkyCol });
    rays = new THREE.Mesh(buildRays(rng.fork('rays'), L, 18), mat);
    rays.frustumCulled = false; rays.renderOrder = 3; rays.name = 'sun-shafts';
    root.add(rays);
  }

  // ---- bubbles
  let bubbles = null;
  const emitM = mother.blowhole.clone(), emitC = new THREE.Vector3();
  if (opts.bubbles !== false) {
    const mat = linkShared(new THREE.ShaderMaterial({
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uTrail: { value: 17 }, uRise: { value: 5.5 }, uEmit: { value: [emitM, emitC] },
        uTime: { value: 0 }, uSunCol: { value: null }, uSkyCol: { value: null } }]),
      vertexShader: BUB_VERT, fragmentShader: BUB_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: true,
    }), { uTime: shared.uTime, uSunCol: shared.uSunCol, uSkyCol: shared.uSkyCol });
    mat.uniforms.uEmit.value = [emitM, emitC];
    bubbles = new THREE.Mesh(buildBubbles(rng.fork('bubbles'), 150), mat);
    bubbles.frustumCulled = false; bubbles.renderOrder = 4; bubbles.name = 'bubbles';
    root.add(bubbles);
  }

  // ---- motion
  let progress = clamp(opts.progress ?? 0, 0, 1);
  const ph0 = rng.range(0, 6.28), ph1 = rng.range(0, 6.28);
  const eul = new THREE.Euler();
  function update(dt, time) {
    shared.uTime.value = time;
    const pm = time * 1.12 + ph0, pc = time * 2.25 + ph1;
    mother.mat.uniforms.uPhase.value = pm; calf.mat.uniforms.uPhase.value = pc;
    // scripted beats, pure functions of progress
    const B = bell(progress, 0.18, 0.86, 0.42);                    // mother's bank, peaks while she is overhead
    const R = smoothstep(0.45, 0.8, progress), D = bell(progress, 0.36, 0.92, 0.35);
    mother.pivot.position.y = L * 0.012 * Math.sin(pm + 2.6);       // body heaves against the fluke stroke
    mother.pivot.rotation.set(0.028 * Math.sin(pm + 1.1), 0, -calfSide * 0.3 * B + 0.02 * Math.sin(time * 0.31));
    const hi = calfSide > 0 ? mother.mat.uniforms.uFinL.value : mother.mat.uniforms.uFinR.value;
    const lo = calfSide > 0 ? mother.mat.uniforms.uFinR.value : mother.mat.uniforms.uFinL.value;
    hi.set(0.05 + 0.42 * B, 0.16, 0.22 * B); lo.set(0.05 - 0.1 * B, 0.14, -0.08 * B);
    calf.pivot.position.set(calfHome.x + calfSide * 0.9 * D + 0.25 * Math.sin(time * 0.37 + 1.0),
      calfHome.y - 1.6 * D + Lc * 0.02 * Math.sin(pc + 2.6) + 0.2 * Math.sin(time * 0.23), calfHome.z + 0.5 * Math.sin(time * 0.19) + 1.2 * D);
    calf.pivot.rotation.set(0.05 * Math.sin(pc + 1.1) - 0.05, -calfSide * 0.07, calfSide * (0.16 + Math.PI * 2 * R) + 0.05 * Math.sin(time * 0.5));
    emitM.copy(mother.blowhole); emitM.y += mother.pivot.position.y;
    eul.copy(calf.pivot.rotation); emitC.copy(calf.blowhole).applyEuler(eul).add(calf.pivot.position);
  }
  update(0, 0);

  function setLight(o = {}) {
    if (o.sunDir) shared.uSunDir.value.copy(o.sunDir).normalize();
    if (o.sunColor) shared.uSunCol.value.copy(o.sunColor);
    if (o.skyColor) shared.uSkyCol.value.copy(o.skyColor);
    if (o.deepColor) shared.uDeepCol.value.copy(o.deepColor);
    if (o.rimColor) shared.uRimCol.value.copy(o.rimColor);
    if (o.caustic !== undefined) shared.uCaustic.value = o.caustic;
    if (o.surfaceY !== undefined && rays) rays.material.uniforms.uRayUp.value = o.surfaceY;
    if (o.rayGain !== undefined && rays) rays.material.uniforms.uRayGain.value = o.rayGain;
  }

  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const center = V(calfSide * L * 0.07, -L * 0.07, L * 0.03);
  const anchors = {
    bodyCenter: V(0, 0, 0), head: V(0, -L * 0.02, L * 0.5), blowhole: mother.blowhole.clone(),
    eyeR: mother.eyes[0].clone(), eyeL: mother.eyes[1].clone(), flukes: V(0, 0, -L * 0.5), calfCenter: calfHome.clone(), center,
    // camera line under the pair: she overtakes the camera, so in her frame it slides from ahead to astern
    flyUnder: [V(calfSide * 7, -16, 30), V(calfSide * 4, -15, 15), V(calfSide * 1.5, -14.5, 2), V(0, -14.5, -12), V(-calfSide * 2, -16, -28)],
    viewpoints: { below: V(calfSide * 1.5, -14.5, 2), belowAhead: V(calfSide * 4, -13, 16), flank: V(calfSide * 22, -3, 7), calfSide: V(calfSide * 13, -7, 4) },
    clearance: { radius: L * 0.66, minCameraDistance: 12 },
    travel: { heading: V(0, 0, 1), speed: 2.6 },
    portalSeat: null,
  };

  return {
    object: root, radius: L * 0.66, height: L * 0.6, center, anchors,
    update, dispose() {}, ground: false, groundY: -40,
    setProgress(p) { progress = clamp(p, 0, 1); },
    setLight, uniforms: shared, calfSide, length: L, calfLength: Lc,
    triangles: mother.triangles + calf.triangles + 36 + 300,
  };
}
