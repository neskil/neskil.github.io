// HERO SET PIECE for "glowwood": THE MOTHER-TREE.
//
// WHAT IT IS
//   A 130 m tree whose trunk is nine translucent roots braided around a glowing core (five wound one way,
//   four the other, woven over/under), ~25 m across. Every 8 s a pale-gold pulse of light starts at the root
//   tips, climbs the braid, runs out along the boughs, drops down ~4000 hanging rose-pink fibre-optic
//   filaments (a 160 m weeping canopy) and bursts from the crown as a puff of rose spores that joins a
//   rising spore column. At the base the roots flare into buttresses ~70 m across; the two largest (plus two
//   prop roots each) form a pointed cleft 17 m wide and 24 m tall on the +Z side: the exit portal's seat.
//   The filament curtain is parted in a 20 m gap on +Z, the approach side. Creeper vines with rose light
//   beads spiral round the roots; a moss apron with glowing speckles ties the roots to the ground.
//
// LOCAL SPACE   origin = base centre of the trunk at ground level, +Y up, front (cleft, gap, approach) = +Z.
//               The moon belongs low on the -Z side (behind the tree as seen from the approach).
//
// OPTS
//   palette     7 hex strings in brief order [night, indigo fog, deep violet, violet, rose, teal, pale gold]
//   filaments   number of hanging filaments (default 4200; 16 triangles each)
//   spores      number of spore points (default 3600)
//   apron       true | false   moss mound under the roots, r = 52 m, fades to transparent at its rim and
//               dips to y = -0.6 there so it tucks into the world's terrain (default true)
//   halos       true | false   soft additive glow cards: crown heart-glow, trunk pulse bloom, cleft glow
//   moonDir     Vector3 pointing TO the moon, world space (default (0, 0.22, -1))
//   moonColor   hex (default '#aab4ff')
//   period      pulse period in seconds (default 8)
//   progress    initial setProgress value (default 0.6)
//
// RETURNS (besides object, radius, height, center, anchors, update, dispose, ground, groundY)
//   setProgress(p)     p = 0..1 = how far the camera has come on its approach (map world u 0.5..0.75 to 0..1).
//                      Draws the two halves of the filament curtain apart (gap 13 m -> 22 m), wakes the tree
//                      (resting glow x0.75 -> x1.1) and thickens the spore halo round the cleft. Pure function of p.
//   setPulseClock(s)   drive the heartbeat yourself: s = seconds on the pulse clock (cycle = s mod period).
//                      Pass null to return to world time (the default: time + a per-seed offset). The pulse leaves
//                      the root tips at cycle 0, reaches the crown at pulse.crownAt (~2.8 s) and has run down the
//                      filaments by ~6 s. For "mid-pulse at the reveal" hold the cycle near 2-3.5 s there.
//   setLight({ moonDir, moonColor, fogGlow })
//   pulse              { period, speed (m/s inside the tree), crownAt (s into the cycle when it reaches the crown
//                        and the spores release), rippleSpeed: 60, cycle(time) } so the world can launch its
//                        outward ripple from anchors.pulseOrigin at cycle == crownAt.
//   uniforms           shared block { uTime, uCyc, uPulseT, uAwake, uOpen, uCam, uMoonDir, uMoonCol }
//
// ANCHORS (local space; positions are Vector3, directions unit Vector3)
//   portalSeat    { position (0, 8.5, 15), facing (0,0,1), radius 7, width 17, height 24 }: centre of the 14 m
//                 portal in the cleft; `facing` is the portal normal, toward the arriving camera.
//   cleft         { apex, left, right, floorY } landmarks of the opening (for a frame or extra spores).
//   flyThrough    ordered points of the safe approach line: down the +Z axis at y = 8.5 from z = 240 (clearing
//                 edge) through the curtain gap (z ~ 78) to the portal seat. >= 8 m to any root, >= 9 m to any
//                 filament (they are lifted above y = 26 inside |x| < 11). The last 135 m are straight and level.
//   gap           { position, width, height } centre of the parting in the curtain.
//   pulseOrigin   base centre: origin of the basin-wide ripple.   crown: spore source, heart of the rose glow.
//   sporeTop      top of the visible spore column.
//   moonAxis      direction in which the moon should stand (toward -Z, low).
//   viewpoints    { reveal, low, under, flank } good camera positions looking at `center`.
//   clearance     { trunkRadius, rootRadius, canopyRadius, canopyTipY } keep-out sizes for scattering world flora.
//
// SIZE   radius 82 m (canopy), buttress radius ~36 m, trunk ~25 m across, height ~130 m (+ spore column to ~230).
// COST   ~125k triangles, 5 draw calls (tree, filaments, spores, halos, apron), no lights, no textures.
//        Build ~200-350 ms with ctx.yield() between steps.
// LIGHT  All materials are self-lit ShaderMaterials (they ignore scene lights) and honour scene fog. They want
//        night: a dark indigo sky/fog (#0b1238), the moon behind the tree on -Z (rim light is computed from
//        moonDir), bloom threshold ~0.9 with strength 0.5-0.8. Emissive peaks: gold pulse ~5, filament tips ~4.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#02040c', '#0b1238', '#2a1458', '#7a4dff', '#ff4fd8', '#19e6c8', '#e8ff7a'];
const TAU = Math.PI * 2;
const wrapPi = (a) => a - TAU * Math.round(a / TAU);

// ---------------------------------------------------------------- geometry helpers
function makeAcc() { return { pos: [], nor: [], uv: [], hk: [], idx: [], n: 0 }; }

// uniform arc-length resampling of a dense polyline with a parallel radius array
function resample(pts, rads, step) {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  const L = cum[cum.length - 1], n = Math.max(2, Math.round(L / step));
  const op = [], or = [];
  let k = 0;
  for (let i = 0; i <= n; i++) {
    const d = (i / n) * L;
    while (k < cum.length - 2 && cum[k + 1] < d) k++;
    const t = clamp((d - cum[k]) / Math.max(1e-6, cum[k + 1] - cum[k]), 0, 1);
    op.push(new THREE.Vector3().lerpVectors(pts[k], pts[k + 1], t));
    or.push(lerp(rads[k], rads[k + 1], t));
  }
  return { pts: op, rads: or, length: L, step: L / n };
}

// parallel-transport frames along a polyline
function frames(pts) {
  const n = pts.length, T = [], N = [], B = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    T.push(new THREE.Vector3().subVectors(b, a).normalize());
  }
  const up = Math.abs(T[0].y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  N.push(new THREE.Vector3().crossVectors(up, T[0]).normalize());
  B.push(new THREE.Vector3().crossVectors(T[0], N[0]).normalize());
  const ax = new THREE.Vector3();
  for (let i = 1; i < n; i++) {
    const nn = N[i - 1].clone();
    ax.crossVectors(T[i - 1], T[i]);
    const s = ax.length();
    if (s > 1e-6) { ax.multiplyScalar(1 / s); nn.applyAxisAngle(ax, Math.asin(Math.min(1, s))); }
    nn.addScaledVector(T[i], -nn.dot(T[i])).normalize();
    N.push(nn); B.push(new THREE.Vector3().crossVectors(T[i], nn).normalize());
  }
  return { T, N, B };
}

// Sweeps a lobed, slightly lumpy tube along pts. o: { radial, kind, seed, H0, lobes, lobeAmp, lobeTwist, bump, noise }
// Per vertex: aUV (u around 0..1, v metres along), aHK (H = pulse travel distance in metres, kind, seed).
function addTube(acc, pts, rads, o) {
  const { T, N, B } = frames(pts);
  const R = o.radial, n = pts.length, base = acc.n;
  const lobes = o.lobes || 0, la = o.lobeAmp || 0, lt = o.lobeTwist || 0, bump = o.bump || 0, nz = o.noise;
  let v = 0;
  const px = new THREE.Vector3(), nr = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    if (i > 0) v += pts[i].distanceTo(pts[i - 1]);
    const c = pts[i], r = rads[i];
    for (let j = 0; j <= R; j++) {
      const a = (j / R) * TAU, ca = Math.cos(a), sa = Math.sin(a);
      const lob = lobes ? la * Math.cos(lobes * a + lt * v) : 0;
      const dl = lobes ? -la * lobes * Math.sin(lobes * a + lt * v) : 0;
      const bm = bump && nz ? bump * nz.n3(ca * 1.3 + (o.seed || 0) * 17, sa * 1.3, v * 0.11) : 0;
      const rr = r * (1 + lob + bm);
      px.copy(c).addScaledVector(N[i], ca * rr).addScaledVector(B[i], sa * rr);
      // normal = radial - (dr/da)/r * tangential
      const k = dl / (1 + lob);
      nr.set(0, 0, 0).addScaledVector(N[i], ca + sa * k).addScaledVector(B[i], sa - ca * k).normalize();
      acc.pos.push(px.x, px.y, px.z); acc.nor.push(nr.x, nr.y, nr.z);
      acc.uv.push(j / R, v); acc.hk.push((o.H0 || 0) + v, o.kind || 0, o.seed || 0);
    }
  }
  const W = R + 1;
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < R; j++) {
    const a = base + i * W + j, b = a + 1, c2 = a + W, d = c2 + 1;
    acc.idx.push(a, b, c2, b, d, c2);
  }
  acc.n += n * W;
  return v;
}

function accGeometry(acc) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(acc.pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(acc.nor, 3));
  g.setAttribute('aUV', new THREE.Float32BufferAttribute(acc.uv, 2));
  g.setAttribute('aHK', new THREE.Float32BufferAttribute(acc.hk, 3));
  g.setIndex(new THREE.Uint32BufferAttribute(acc.idx, 1));
  return g;
}

// half-width of the cleft opening at height y: 17 m wide to y = 13, pointed arch closing at y = 24
function cleftHalf(y) {
  if (y <= 13) return 8.5;
  if (y >= 24) return 0;
  const k = (y - 13) / 11;
  return 8.5 * Math.sqrt(1 - k * k);
}

// ---------------------------------------------------------------- the tree skeleton (roots, braid, boughs, vines, core)
const Y0 = 32, Y1 = 96;                       // the braid runs between these heights
const envR = (y) => 7.6 + 1.6 * ((y - 58) / 26) * ((y - 58) / 26);   // radius of the braid's centre circle

async function buildTree(rng, noise, P, pause) {
  const acc = makeAcc();
  const NS = 9, V = THREE.Vector3;
  const turns = P.turns;
  // strand table: base angle (from +Z toward +X), winding set (0 = A, 1 = B), index inside the set
  const S = [];
  for (let i = 0; i < NS; i++) {
    const front = i === 0 || i === NS - 1;
    const set = i % 2;
    S.push({
      i, front, set, sidx: i >> 1,
      thB: (20 + 40 * i) * Math.PI / 180 + (front ? 0 : rng.range(-0.07, 0.07)),
      dir: set === 0 ? 1 : -1,
      r0: front ? 3.5 : (set === 0 ? rng.range(3.2, 3.6) : rng.range(2.7, 3.1)),
      tip: rng.range(29, 38), pw: rng.range(2.3, 3.0), drift: rng.range(-0.28, 0.28), ph: rng.range(0, TAU),
    });
  }
  const theta = (s, y) => s.thB + s.dir * turns * TAU * smoothstep(Y0, Y1, y);
  const weave = (s, y) => {
    const fade = smoothstep(Y0, Y0 + 10, y) * (1 - smoothstep(Y1 - 9, Y1, y));
    if (fade <= 0) return 0;
    let off = 0; const th = theta(s, y);
    for (const o of S) {
      if (o.set === s.set) continue;
      const d = wrapPi(th - theta(o, y)) / 0.38;
      off += (((s.sidx + o.sidx) & 1) ? -1 : 1) * (s.set === 0 ? 1 : -1) * Math.exp(-d * d);
    }
    return off * 1.55 * fade;
  };

  // crown targets: spread the nine boughs evenly round the compass, in the order the braid delivers them
  const order = S.map((s) => ({ s, a: ((theta(s, Y1) % TAU) + TAU) % TAU })).sort((p, q) => p.a - q.a);
  const leaders = new Set(); while (leaders.size < 2) leaders.add(rng.int(0, NS - 1));
  order.forEach((o, k) => {
    const s = o.s, target = order[0].a + (k / NS) * TAU + rng.range(-0.16, 0.16);
    s.curl = clamp(wrapPi(target - o.a), -0.9, 0.9);
    s.leader = leaders.has(k);
    s.L = s.leader ? rng.range(15, 24) : rng.range(54, 76) * P.spread;
    s.rise = s.leader ? rng.range(30, 36) : P.rise * rng.range(0.85, 1.15);
    s.droop = P.droop * rng.range(0.8, 1.2);
  });

  const strands = [];        // resampled centre lines kept for vines and anchors
  const boughs = [];         // { p: Vector3, H, w } filament anchor candidates
  const rootFeet = [];

  for (const s of S) {
    const pts = [], rads = [];
    const sx = s.i === 0 ? 1 : -1, RB = envR(Y0);
    // --- root: from under the ground up to the foot of the braid
    for (let y = -4; y < Y0; y += 0.5) {
      const g = Math.pow(1 - (y + 4) / (Y0 + 4), s.front ? 2.2 : s.pw);
      let x, z, r;
      if (s.front) {
        const xa = sx * (cleftHalf(y) + 4.6 + 0.9), za = 8.65 + (33 - 8.65) * g;
        const m = smoothstep(22, Y0, y);
        x = lerp(xa, RB * Math.sin(s.thB), m); z = lerp(za, RB * Math.cos(s.thB), m);
        r = lerp(4.3, s.r0, smoothstep(18, 40, y));
      } else {
        const th = s.thB + s.drift * g + 0.06 * Math.sin(y * 0.3 + s.ph) * g, rho = RB + (s.tip - RB) * g;
        x = rho * Math.sin(th); z = rho * Math.cos(th);
        r = s.r0 * (1 + 0.28 * smoothstep(26, 8, y));
      }
      r *= 0.5 + 0.5 * smoothstep(-4, 4, y);
      const wg = smoothstep(Y0, Y0 - 9, y) * (s.front ? 0.55 : 1.1);            // roots meander on their way down
      x += wg * noise.n2(y * 0.1 + s.i * 9.3, 3.1); z += wg * noise.n2(y * 0.1 + 1.7, s.i * 7.1);
      pts.push(new V(x, y, z)); rads.push(r);
    }
    rootFeet.push(pts[8].clone());
    // --- braid
    for (let y = Y0; y < Y1; y += 0.5) {
      const th = theta(s, y), rho = envR(y) + weave(s, y);
      pts.push(new V(rho * Math.sin(th), y, rho * Math.cos(th)));
      rads.push(s.front ? lerp(4.3, s.r0, smoothstep(18, 40, y)) : s.r0);
    }
    // --- bough
    const th1 = theta(s, Y1), R1 = envR(Y1), nb0 = pts.length;
    for (let k = 0; k <= 90; k++) {
      const t = k / 90, th = th1 + s.curl * t + 0.12 * Math.sin(t * 7 + s.ph) * t;
      const rho = R1 + s.L * Math.pow(t, 1.15);
      const y = Y1 + (s.leader ? s.rise * (1.15 * t - 0.15 * t * t)
        : s.rise * (1 - Math.pow(1 - t, 3)) - s.droop * Math.pow(t, 2.2)) + 1.3 * Math.sin(t * 9 + s.ph) * t;
      pts.push(new V(rho * Math.sin(th), y, rho * Math.cos(th)));
      rads.push(s.r0 * (1 - 0.92 * Math.pow(t, 0.62)) + 0.2);
    }
    const rs = resample(pts, rads, 1.65);
    s.line = rs; strands.push(s);
    addTube(acc, rs.pts, rs.rads, { radial: 12, kind: 0, seed: s.i / NS + 0.03, H0: 0, lobes: 3, lobeAmp: 0.12,
      lobeTwist: 0.05 * (s.dir), bump: 0.10, noise });
    // anchors along the bough part + secondary boughs
    const iB = Math.floor((nb0 / pts.length) * rs.pts.length) + 6;   // approx. first bough index after resampling
    for (let k = iB; k < rs.pts.length; k++) {
      const f = (k - iB) / (rs.pts.length - iB);
      boughs.push({ p: rs.pts[k], H: k * rs.step, w: s.leader ? 0.35 : 0.5 + f });
    }
    const nSec = s.leader ? 1 : rng.int(2, 3);
    for (let q = 0; q < nSec; q++) {
      const k0 = iB + Math.floor((rs.pts.length - iB) * rng.range(0.16, 0.72));
      const p0 = rs.pts[k0], az0 = Math.atan2(p0.x, p0.z), side = q % 2 ? 1 : -1;
      const az = az0 + side * rng.range(0.55, 1.0), len = rng.range(20, 36), up = rng.range(3, 9), dr = rng.range(8, 16);
      const sp = [], sr = [], rr0 = rs.rads[k0] * 0.62, sph = rng.range(0, TAU);
      for (let k = 0; k <= 40; k++) {
        const t = k / 40, a2 = az + side * 0.35 * t;
        sp.push(new V(p0.x + Math.sin(a2) * len * t, p0.y + up * Math.sin(t * 2.2) - dr * t * t + 0.8 * Math.sin(t * 8 + sph) * t,
          p0.z + Math.cos(a2) * len * t));
        sr.push(rr0 * (1 - 0.85 * Math.pow(t, 0.7)) + 0.16);
      }
      const r2 = resample(sp, sr, 1.5);
      addTube(acc, r2.pts, r2.rads, { radial: 6, kind: 0, seed: rng(), H0: k0 * rs.step, lobes: 3, lobeAmp: 0.06 });
      for (let k = 2; k < r2.pts.length; k++) boughs.push({ p: r2.pts[k], H: k0 * rs.step + k * r2.step, w: 0.7 + k / r2.pts.length });
    }
    await pause();
  }

  // --- prop roots: thinner stilts from the lower trunk to the ground. Four are explicit and wall the cleft.
  const props = [];
  for (const sx of [1, -1]) for (const [ztip, extra, rr] of [[15.5, 2.2, 2.7], [24, 1.2, 3.0]]) {
    const pts = [], rads = [], yTop = rng.range(27, 31);
    for (let y = -4; y <= yTop; y += 0.5) {
      const g = Math.pow(1 - (y + 4) / (yTop + 4), 2.0), m = smoothstep(yTop - 9, yTop, y);
      const xa = sx * (cleftHalf(y) + rr + 0.7 + extra * (1 - m)), za = 7.5 + (ztip - 7.5) * g;
      pts.push(new V(lerp(xa, sx * 4.5, m), y, lerp(za, 7.0, m)));
      rads.push(rr * (0.55 + 0.45 * smoothstep(-4, 5, y)) * (1 - 0.35 * m));
    }
    props.push({ pts, rads, radial: 10 });
  }
  let tries = 0;
  while (props.length < 4 + P.props && tries++ < 200) {
    const phi = rng.range(0, TAU), ys = rng.range(14, 46), tip = rng.range(15, 31), dr = rng.range(-0.35, 0.35);
    const rr = rng.range(1.0, 2.0), pts = [], rads = []; let ok = true;
    for (let k = 0; k <= 40 && ok; k++) {
      const t = k / 40, rho = (envR(Math.max(ys, Y0)) - 1.5) + (tip - 6) * Math.pow(t, 1.15);
      const y = -3.5 + (ys + 3.5) * Math.pow(1 - t, 2.1), a = phi + dr * t;
      const x = rho * Math.sin(a), z = rho * Math.cos(a);
      if (z > 0 && Math.abs(x) < cleftHalf(y) + rr + 6.5 && y < 30) ok = false;
      pts.push(new V(x, y, z)); rads.push(rr * (1 - 0.45 * t));
    }
    if (ok) props.push({ pts: pts.reverse(), rads: rads.reverse(), radial: 8 });
  }
  for (const p of props) {
    const rs = resample(p.pts, p.rads, 1.5);
    addTube(acc, rs.pts, rs.rads, { radial: p.radial, kind: 0, seed: rng(), H0: 4, lobes: 2, lobeAmp: 0.08, bump: 0.06, noise });
    rootFeet.push(rs.pts[3].clone());
    p.line = rs;
  }
  await pause();

  // --- creeper vines: thin luminous tubes spiralling round strands and the cleft's prop roots
  const hosts = [strands[0], strands[NS - 1], ...rng.shuffle(strands.slice(1, NS - 1)).slice(0, P.vines - 2)];
  for (const h of hosts) {
    const L = h.line, F = frames(L.pts), n = L.pts.length;
    const i0 = h.front ? 20 : 3, i1 = Math.floor(n * rng.range(0.6, 0.78));      // none on the lowest 30 m of the two cleft roots, where the camera passes
    const wind = rng.range(0.16, 0.26) * rng.sign(), rv = rng.range(0.24, 0.34) * 1.45; let ph = rng.range(0, TAU);
    const vp = [], vr = [];
    for (let i = i0; i < i1; i++) for (let sub = 0; sub < 2; sub++) {
      const f = sub / 2, j = Math.min(n - 1, i + 1);
      const c = new V().lerpVectors(L.pts[i], L.pts[j], f), r = lerp(L.rads[i], L.rads[j], f) * 1.1 + rv * 0.6;
      const Nn = new V().lerpVectors(F.N[i], F.N[j], f), Bn = new V().lerpVectors(F.B[i], F.B[j], f);
      ph += wind * L.step * 0.5;
      vp.push(c.addScaledVector(Nn, Math.cos(ph) * r).addScaledVector(Bn, Math.sin(ph) * r));
      vr.push(rv * (0.5 + 0.5 * smoothstep(i1, i1 - 12, i)));
    }
    addTube(acc, vp, vr, { radial: 8, kind: 1, seed: rng(), H0: i0 * L.step * 0.8 });
    await pause();
  }

  // --- the core: a lumpy luminous column seen through the gaps of the braid
  {
    const cp = [], cr = [];
    for (let y = -2; y <= 104; y += 3) { cp.push(new V(0, y, 0)); cr.push((envR(clamp(y, Y0, Y1)) - 3.1) * (1 - smoothstep(92, 106, y) * 0.9) * (y < Y0 ? 1 + (Y0 - y) * 0.012 : 1)); }
    addTube(acc, cp, cr, { radial: 16, kind: 2, seed: 0.5, H0: 40, lobes: 5, lobeAmp: 0.06, lobeTwist: 0.12, bump: 0.12, noise });
  }
  await pause();
  const geometry = accGeometry(acc);
  await pause();
  return { geometry, triangles: acc.idx.length / 3, boughs, strands, rootFeet };
}

// ---------------------------------------------------------------- shaders
const GLSL_COMMON = /* glsl */`
uniform float uTime, uCyc, uPeriod, uPulseT, uAwake, uOpen, uV, uCrownAt;
float hash21(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x), mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),f.x), f.y); }
// value noise periodic in x with period per (for the seam of a tube)
float vnoiseP(vec2 p, float per){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  float x0=mod(i.x,per), x1=mod(i.x+1.,per);
  return mix(mix(hash21(vec2(x0,i.y)),hash21(vec2(x1,i.y)),f.x), mix(hash21(vec2(x0,i.y+1.)),hash21(vec2(x1,i.y+1.)),f.x), f.y); }
// the heartbeat: 1 when the pulse front (which reaches this point arr seconds into the cycle) is here, then an afterglow
float pulseK(float arr, float k){ float t = uCyc - arr; t = mod(t + uPeriod*0.25, uPeriod) - uPeriod*0.25;
  return t < 0. ? exp(-t*t*40.) : exp(-t*k); }
float pulseAt(float arr){ return pulseK(arr, 1.25); }
`;
// additive materials fade to black in fog instead of to the fog colour
const GLSL_FOG_ADD = /* glsl */`
#ifdef USE_FOG
  #ifdef FOG_EXP2
    col *= exp(-fogDensity*fogDensity*vFogDepth*vFogDepth);
  #else
    col *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
  #endif
#endif
`;

const TREE_VERT = /* glsl */`
attribute vec2 aUV; attribute vec3 aHK;
varying vec2 vUv; varying vec3 vHK; varying vec3 vWN; varying vec3 vWP; varying float vLY;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vUv = aUV; vHK = aHK; vLY = position.y;
  float p = pulseAt(aHK.x/uV);
  vec3 pos = position + normal * (p * (aHK.y > 1.5 ? 0.5 : 0.22));      // roots swell as the light passes
  vec4 wp = modelMatrix * vec4(pos, 1.0);
  vWP = wp.xyz; vWN = normalize(mat3(modelMatrix) * normal);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const TREE_FRAG = /* glsl */`
uniform vec3 uBark0, uBark1, uViolet, uRose, uGold, uMoonCol, uMoonDir, uSky;
varying vec2 vUv; varying vec3 vHK; varying vec3 vWN; varying vec3 vWP; varying float vLY;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  vec3 N = normalize(vWN), Vd = normalize(cameraPosition - vWP);
  float H = vHK.x, kind = vHK.y, seed = vHK.z;
  float p = pulseK(H/uV, 2.5);
  vec3 col;
  if (kind < 0.5) {
    // root / bough: dark grooved skin; thin light-carrying fibres show through it
    float wv = vnoiseP(vec2(vUv.x*5., vUv.y*0.13 + seed*9.), 5.) - 0.5;
    float f1 = vnoiseP(vec2(vUv.x*11. + wv*1.3, vUv.y*0.045 + seed*31.), 11.);
    float f2 = vnoiseP(vec2(vUv.x*26. + wv*2.0, vUv.y*0.11 + seed*17.), 26.);
    float f3 = vnoiseP(vec2(vUv.x*48., vUv.y*0.5 + seed*5.), 48.);
    float rd1 = 1. - abs(2.*f1 - 1.), rd2 = 1. - abs(2.*f2 - 1.);
    float dist = length(cameraPosition - vWP), nearK = 1. - smoothstep(34., 80., dist), farK = smoothstep(40., 170., dist);
    // thin light-carrying fibres, widened (and dimmed) with distance so they never get thinner than a pixel
    float vw1 = clamp(dist*0.0011, 0., 0.35), vw2 = clamp(dist*0.0024, 0., 0.4);
    float veins = smoothstep(0.87 - vw1, 0.99, rd1) * (0.1/(0.12 + vw1)) + 0.55*smoothstep(0.89 - vw2, 0.995, rd2) * (0.085/(0.105 + vw2));
    float halo = smoothstep(0.5, 0.97, rd1)*0.7 + smoothstep(0.6, 0.98, rd2)*0.3;       // their glow inside the flesh
    // close up the skin is a rope of fibres: wandering ridges along the root, with short cross cracks. Both melt to their
    // mean before they get thinner than a pixel, and they stay out of the bump (screen-space derivatives would sparkle).
    // Three scales: the braid (5 strands round the root, in the bump), rope ridges (20) and fine fibres (61).
    float fw = fwidth(vUv.x), a1 = 1. - smoothstep(0.08, 0.22, fw*20.), a2 = 1. - smoothstep(0.1, 0.3, fw*22.), a3 = 1. - smoothstep(0.08, 0.22, fw*61.);
    float ridge = 0.5 + 0.5*sin((vUv.x*20. + wv*0.7 + f1*0.35 + vUv.y*0.045) * 6.2832);          // rope strands, laid with a slow twist
    float ridge2 = 0.5 + 0.5*sin((vUv.x*61. + wv*1.1 + f2*0.6 - vUv.y*0.06) * 6.2832);
    float braid = 0.5 + 0.5*sin((vUv.x*5. + wv) * 6.2832);
    float g3 = vnoiseP(vec2(vUv.x*22. + seed*3., vUv.y*0.9 + f2*1.5), 22.);
    float crack = (1. - smoothstep(0.0, 0.09, abs(g3 - 0.5))) * smoothstep(0.4, 0.62, f3) * a2;
    float fib = mix(1., (0.08 + 1.5*ridge*sqrt(ridge)) * mix(1., 0.55 + 0.9*ridge2, a3*nearK) * (1. - 0.6*crack), nearK*a1);
    fib *= mix(1., 0.45 + 0.8*braid, nearK);                              // the hollows between the strands stay dark
    float hm = mix(f2*0.45 + f3*0.35 + rd1*0.2, f3*0.25 + rd1*0.08, nearK) + 0.35*braid + 0.3*ridge*a1*nearK;      // close up the relief is rope, not swirls
    vec3 sx = dFdx(vWP), sy = dFdy(vWP), r1 = cross(sy, N), r2 = cross(N, sx);
    float det = dot(sx, r1);
    vec3 grad = sign(det) * (dFdx(hm)*r1 + dFdy(hm)*r2);
    vec3 Ng = N;
    N = normalize(abs(det)*N - grad*0.9*smoothstep(0.05, 0.5, dot(N, Vd)));
    float ndv = clamp(dot(N, Vd), 0., 1.), ndvG = clamp(dot(Ng, Vd), 0., 1.);
    vec3 albedo = mix(uBark0, uBark1, f1*0.6 + f3*0.4) * (0.5 + 0.7*hm);
    albedo *= fib;
    float up = N.y*0.5 + 0.5;
    float hgt = smoothstep(50., 112., vLY);
    vec3 amb = uSky*(0.25 + 0.75*up) + uRose*0.5*hgt*(1. - up*0.7) + uViolet*0.05;
    col = albedo * (amb * mix(1., 0.5, nearK) + uMoonCol*max(dot(N, uMoonDir), 0.)*0.9);
    float fres = pow(1. - ndv, 3.);
    float back = smoothstep(-0.55, 0.5, dot(N, uMoonDir));
    col += albedo * mix(uViolet, uRose, 0.4) * (0.5 + 0.5*up) * 0.12 * nearK * uAwake;      // close up the bark is lit by the curtain and the portal
    float rimG = pow(1. - ndvG, 3.) * smoothstep(-0.55, 0.5, dot(Ng, uMoonDir));        // a clean moon rim on the true edge
    col += uMoonCol * mix(fres * back * 0.28, rimG * 0.34 + fres * back * 0.06, nearK) * fib;
    col += uViolet * fres * 0.05;
    // translucency: looking straight into a root you see the light inside it
    float depth = ndv*ndv;
    float farG = smoothstep(28., 64., dist), veinK = mix(0.07, 1., farG);      // close up the light is carried by fine fibres, not smears
    vec3 inner = mix(uViolet, uRose, 0.25) * (0.012 + 0.06*halo*veinK + 0.5*veins*veinK) * depth * uAwake;
    float strand = smoothstep(0.82, 1.0, ridge2) * a3 * nearK * smoothstep(0.42, 0.7, vnoiseP(vec2(vUv.x*13. + seed*5., vUv.y*0.07 + seed*11.), 13.));
    float run2 = pow(max(0., sin(H*0.42 - uTime*2.4 + seed*40. + f1*5.)), 6.);
    inner += (mix(uViolet, uRose, 0.35) * 0.3 * uAwake + uGold * (run2*0.7*uAwake + p*3.0)) * strand * (0.35 + 0.65*depth);
    float bead = pow(max(0., sin(H*0.42 - uTime*2.4 + seed*40.)), 22.);
    inner += uGold * bead * veins * 1.6 * depth * uAwake * farG;
    // the climbing pulse: a band ~18 m long; fibres carry it close up, from across the clearing the whole root glows
    inner += uGold * p * (0.04 + 0.13*halo*halo + 3.4*veins*veinK + farK*(1.5 + 2.5*halo)) * (0.25 + 0.75*depth);
    col += inner;
  } else if (kind < 1.5) {
    // creeper vine: rose light with slow beads
    float ndv = clamp(dot(N, Vd), 0., 1.);
    float beads = pow(max(0., sin(vUv.y*1.15 + seed*30. - uTime*0.35)), 10.);
    float limb = ndv*ndv;                                                  // a lit cord: bright along its middle, dark at the edges
    col = (mix(uRose, uViolet, 0.22) * (0.14 + 4.0*beads) * uAwake * (1. + 1.2*p) + uGold * p * beads * 1.5) * (0.12 + 0.88*limb);
  } else {
    // core: a bundle of luminous fibres
    float ndv = clamp(dot(N, Vd), 0., 1.);
    float c1 = vnoiseP(vec2(vUv.x*14., vUv.y*0.06 - uTime*0.02), 14.);
    float c2 = vnoiseP(vec2(vUv.x*34., vUv.y*0.25 - uTime*0.08), 34.);
    float fibc = smoothstep(0.78, 0.97, 1. - abs(2.*c1 - 1.)) + 0.5*smoothstep(0.8, 0.97, 1. - abs(2.*c2 - 1.));
    col = uViolet*0.025 + mix(uViolet, uRose, 0.4)*fibc*0.4*uAwake + uGold*p*(0.05 + 3.0*fibc);
    col *= 0.4 + 0.6*ndv;
  }
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const FIL_VERT = /* glsl */`
attribute vec4 iA; attribute vec4 iB;
uniform float uViewH, uVf, uHeart;
varying float vT; varying float vSide; varying float vFade; varying float vPulse; varying float vNear; varying vec3 vSeed;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  float t = position.y, side = position.x, len = iA.w, ph = iB.x;
  vec3 a = iA.xyz, p = a;
  float tt = t*t;
  p.y -= len*t;
  p.xz += vec2(sin(uTime*0.45 + ph + t*1.7), cos(uTime*0.37 + ph*1.3 + t*2.1)) * (0.5 + len*0.03) * tt
        + vec2(sin(uTime*1.3 + ph*2. + t*6.), cos(uTime*1.1 + ph + t*5.)) * 0.16 * t;
  vec2 rad = normalize(a.xz + vec2(1e-3));
  p.xz += rad * uHeart * 2.2 * tt;                                   // the canopy swells with each beat
  float part = (1. - smoothstep(6., 28., abs(a.x))) * smoothstep(28., 58., a.z);
  p.x += sign(a.x) * part * uOpen * 7. * t;                          // the curtain draws apart on approach
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 toCam = cameraPosition - wp.xyz; float dist = length(toCam); toCam /= dist;
  vec3 sideDir = normalize(cross(toCam, vec3(0., 1., 0.)));
  float tipB = step(0.999, t);
  float w = iB.z * (1. - 0.6*tipB);
  float wmin = 1.25 * dist * 2. / (projectionMatrix[1][1] * uViewH);
  vFade = min(1., w / wmin); w = max(w, wmin);
  wp.xyz += sideDir * side * w * 0.5;
  vT = t; vSide = side; vSeed = vec3(ph, len, iB.w);
  vPulse = pulseK(iB.y + t*len/uVf, 3.2);
  vNear = 1. - smoothstep(8., 42., dist);
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const FIL_FRAG = /* glsl */`
uniform vec3 uViolet, uRose, uTip;
varying float vT; varying float vSide; varying float vFade; varying float vPulse; varying float vNear; varying vec3 vSeed;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float edge = 1. - min(abs(vSide), 1.);      // clamped: antialiasing samples a hair-thin ribbon outside its own width, where this went negative
  vec3 base = mix(uViolet*1.6, uRose, smoothstep(0.1, 0.8, vT + vSeed.z*0.25));
  float run = pow(max(0., sin(vT*vSeed.y*0.21 - uTime*1.5 + vSeed.x*7.)), 14.);
  float tip = smoothstep(1. - 0.9/vSeed.y, 1.0, vT);
  float I = (0.05 + 0.085*vT + 0.4*run) * uAwake * (1. + 0.4*vNear) + vPulse * 0.34;
  vec3 col = base * I + uTip * tip * (0.9 + 1.0*vPulse) * (1. - 0.45*vNear) * edge;
  col *= (0.55 + 0.45*edge) * vFade * smoothstep(0.0, 0.04, vT);
  ${GLSL_FOG_ADD}
  gl_FragColor = vec4(col, 1.0);
}`;

const SPORE_VERT = /* glsl */`
attribute vec4 aS; attribute vec2 aKS;      // seeds; (kind, size in metres)
uniform float uViewH, uHalo;
varying float vI; varying float vMix;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vec3 p = position; float kind = aKS.x, I = 1., al = 1.;
  if (kind < 0.5) {
    // crown bursts: one puff per beat, three beats visible, decelerating as they climb
    float life = 3. * uPeriod;
    float age = mod(uPulseT - aS.x * life, life);
    float c = cos(age*0.07*(aS.y - .5)*4.), s = sin(age*0.07*(aS.y - .5)*4.);
    p.xz = mat2(c, -s, s, c) * p.xz * (1. + age*0.07);
    p.y += 108. * (1. - exp(-age/11.)) * (0.75 + 0.5*aS.w);
    p.xz += vec2(sin(age*0.5 + aS.z*40.), cos(age*0.43 + aS.w*40.)) * (1. + age*0.3);
    al = smoothstep(0., 0.5, age) * pow(1. - age/life, 1.4);
    I = 1.8 + 3.6*exp(-age*0.45);
  } else if (kind < 1.5) {
    // ambient spores rising everywhere under the canopy; they flash as the ripple passes outward
    float sp = 0.9 + aS.x*1.7;
    p.y = mod(position.y + uTime*sp, 64.);
    p.xz += vec2(sin(uTime*0.31 + aS.z*40. + p.y*0.12), cos(uTime*0.27 + aS.w*40. + p.y*0.1)) * (1.2 + 2.*aS.y);
    al = smoothstep(0., 4., p.y) * (1. - smoothstep(48., 64., p.y)) * (0.55 + 0.45*sin(uTime*(0.8 + aS.y*2.) + aS.z*40.));
    I = 1.4 + 3.0*pulseAt(uCrownAt + length(position.xz)/60.);
  } else {
    // the halo round the portal seat: a slow wheel of spores just outside the 14 m disc
    float ang = aS.x*6.2832 + uTime*0.10*(aS.y - 0.35);
    float r = 7.7 + aS.z*aS.z*6.5 + 0.5*sin(uTime*0.6 + aS.w*30.);
    p = position + vec3(cos(ang)*r, sin(ang)*r, (aS.w - 0.5)*7. + 1.5*sin(uTime*0.2 + aS.x*20.));
    al = (0.35 + 0.65*uHalo) * (0.6 + 0.4*sin(uTime*1.3 + aS.z*50.));
    I = 1.3 + 2.5*pulseAt(0.2);
  }
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  float px = aKS.y * uViewH * projectionMatrix[1][1] * 0.5 / max(0.5, -mvPosition.z);
  al *= min(1., px/1.6);
  gl_PointSize = clamp(px, 1.6, 48.);
  vI = I * al; vMix = aS.y;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const SPORE_FRAG = /* glsl */`
uniform vec3 uRose, uTip;
varying float vI; varying float vMix;
#include <fog_pars_fragment>
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.;
  float a = max(0., 1. - d); a *= a;
  vec3 col = (mix(uRose, uTip, 0.25*vMix) * a + uTip * a*a*a * 0.6) * vI;
  ${GLSL_FOG_ADD}
  gl_FragColor = vec4(col, 1.0);
}`;

const HALO_VERT = /* glsl */`
attribute vec2 aC; attribute vec3 aP;       // corner; (size, kind, pulse arrival)
varying vec2 vC; varying float vK; varying float vPu;
#include <fog_pars_vertex>
${GLSL_COMMON}
void main(){
  vC = aC; vK = aP.y; vPu = pulseAt(aP.z);
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  mvPosition.xy += aC * aP.x * 0.5 * (1. + 0.12*vPu);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const HALO_FRAG = /* glsl */`
uniform vec3 uRose, uGold, uViolet; uniform float uGlow;
varying vec2 vC; varying float vK; varying float vPu;
#include <fog_pars_fragment>
${GLSL_COMMON}
void main(){
  float d = length(vC); float a = max(0., 1. - d); a = a*a*(0.4 + 0.6*a);
  vec3 col;
  if (vK < 0.5) col = mix(uViolet, uRose, 0.75) * (0.03 + 0.18*vPu) * uAwake;      // the heart-glow of the crown
  else if (vK < 1.5) col = uGold * 0.3 * vPu;                                        // pulse bloom climbing the trunk
  else col = mix(uGold, uRose, 0.6) * (0.02 + 0.10*vPu);                             // light spilling from the cleft
  col *= a * uGlow;
  ${GLSL_FOG_ADD}
  gl_FragColor = vec4(col, 1.0);
}`;

const APRON_VERT = /* glsl */`
varying vec3 vP; varying vec3 vWN; varying vec3 vWP;
#include <fog_pars_vertex>
void main(){
  vP = position; vWN = normalize(mat3(modelMatrix) * normal);
  vec4 wp = modelMatrix * vec4(position, 1.0); vWP = wp.xyz;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const APRON_FRAG = /* glsl */`
uniform vec3 uBark0, uViolet, uRose, uGold, uMoonCol, uMoonDir, uSky; uniform float uRim;
varying vec3 vP; varying vec3 vWN; varying vec3 vWP;
#include <fog_pars_fragment>
${GLSL_COMMON}
// one layer of glowing moss specks: sparse cells, each with its own place, size, brightness and twinkle
float specks(vec2 p, float keep){
  vec2 g = floor(p), f = fract(p);
  float h = hash21(g + 3.1), sz = hash21(g + 11.3); sz = mix(0.07, 0.26, sz*sz);
  vec2 o = vec2(hash21(g), hash21(g + 7.7))*0.64 + 0.18;
  float tw = 0.6 + 0.4*sin(uTime*(0.5 + 1.5*hash21(g + 17.)) + h*40.);
  return smoothstep(sz, sz*0.2, length(f - o)) * step(keep, h) * (0.3 + 0.7*hash21(g + 5.9)) * tw;
}
void main(){
  vec3 N = normalize(vWN), Vd = normalize(cameraPosition - vWP);
  float rho = length(vP.xz);
  float n = vnoise(vP.xz*0.22)*0.6 + vnoise(vP.xz*0.9)*0.4;
  float cells = vnoise(vP.xz*2.6);
  vec2 wq = vP.xz + (vec2(vnoise(vP.xz*0.31), vnoise(vP.xz*0.31 + 19.)) - 0.5)*3.2;      // warped, so no rows
  float patchy = smoothstep(0.38, 0.66, n);
  float dist = length(cameraPosition - vWP), nearA = 1. - smoothstep(14., 40., dist);
  float speck = (specks(wq*0.83, 0.6) + specks(mat2(0.8, -0.6, 0.6, 0.8)*wq*1.57 + 31., 0.7)*0.8) * patchy;
  speck = speck * (1. + 2.*nearA) + specks(mat2(0.6, 0.8, -0.8, 0.6)*wq*3.3 + 7., 0.55) * 1.4 * nearA * (0.35 + 0.65*patchy);      // close up: brighter, with a finer layer
  float moss = smoothstep(0.45, 0.7, n);
  vec3 albedo = mix(uBark0*0.5, uBark0*vec3(0.65, 1.0, 0.9), moss) * (0.6 + 0.6*cells);
  vec3 col = albedo * (uSky*(0.4 + 0.6*N.y) + uMoonCol*max(dot(N, uMoonDir), 0.)*1.2 + uRose*0.25);
  col += uMoonCol * pow(1. - max(dot(N, Vd), 0.), 4.) * smoothstep(-0.2, 0.6, dot(reflect(-Vd, N), uMoonDir)) * 0.22;
  float rip = pulseAt(uCrownAt + rho/60.);
  col += mix(uViolet, uRose, vnoise(vP.xz*0.7 + 5.)*0.6) * speck * (0.9 + 3.2*rip) * uAwake;
  col += uViolet * moss * 0.05 * (1. + 2.*rip);
  col += uGold * pulseAt(0.15) * exp(-rho/13.) * (0.03 + 0.10*moss);
  float al = 1. - smoothstep(uRim*0.55, uRim, rho);
  al *= smoothstep(0.02, 0.5, vP.y);                      // melts into the world's ground (y = 0) instead of cutting through it
  gl_FragColor = vec4(col, al);
  #include <fog_fragment>
}`;

// ---------------------------------------------------------------- part builders
function makeMat(U, vert, frag, extra, o = {}) {
  const m = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, extra || {}]),
    vertexShader: vert, fragmentShader: frag, fog: true, ...o,
  });
  Object.assign(m.uniforms, U);      // shared uniform objects, by reference
  return m;
}

function buildFilaments(rng, noise, tree, P, count) {
  const SEG = 8, pos = [], idx = [];
  for (let i = 0; i <= SEG; i++) { const t = i / SEG; pos.push(-1, t, 0, 1, t, 0); }
  for (let i = 0; i < SEG; i++) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  const B = tree.boughs, cum = new Float32Array(B.length); let tot = 0;
  for (let i = 0; i < B.length; i++) { tot += B[i].w; cum[i] = tot; }
  const iA = new Float32Array(count * 4), iB = new Float32Array(count * 4);
  let n = 0, guard = 0;
  while (n < count && guard++ < count * 6) {
    const r = rng() * tot; let lo = 0, hi = B.length - 1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < r) lo = m + 1; else hi = m; }
    const b = B[lo], x = b.p.x + rng.gauss() * 2.2, z = b.p.z + rng.gauss() * 2.2, y = b.p.y - 0.15;
    const rho = Math.hypot(x, z), rim = Math.pow(smoothstep(22, 78, rho), 1.25);
    let tipY = lerp(P.innerTip, P.rimTip, rim) + rng.range(-7, 10) + 8 * noise.n2(x * 0.045, z * 0.045) + (rng.chance(0.2) ? rng.range(4, 26) : 0);
    const lift = (1 - smoothstep(9, 21, Math.abs(x))) * smoothstep(0, 14, z);        // the parting on the approach side
    tipY = Math.max(tipY, lerp(tipY, lerp(30, 64, smoothstep(40, 76, rho)), lift));
    if (rho < 40 && tipY < 20) tipY = 20 + rng.range(0, 8);                         // keep the buttresses clear
    const len = y - tipY;
    if (len < 5) continue;
    iA.set([x, y, z, len], n * 4);
    iB.set([rng.range(0, TAU), b.H / P.V, rng.range(0.16, 0.3), rng()], n * 4);
    n++;
  }
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA.subarray(0, n * 4), 4));
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB.subarray(0, n * 4), 4));
  g.instanceCount = n;
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 65, 0), 125);
  return { geometry: g, triangles: n * SEG * 2, count: n };
}

function buildSpores(rng, P, count, seat) {
  const pos = new Float32Array(count * 3), aS = new Float32Array(count * 4), aKS = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    const q = i / count, kind = q < 0.46 ? 0 : q < 0.92 ? 1 : 2;
    let x, y, z, s0 = rng();
    if (kind === 0) {
      const a = rng.range(0, TAU), r = 15 * Math.sqrt(rng());
      x = Math.cos(a) * r; z = Math.sin(a) * r; y = rng.range(100, 124);
      s0 = (((rng.int(0, 2) * P.period + P.crownAt + 0.25 + Math.abs(rng.gauss()) * 0.55) / (3 * P.period)) % 1 + 1) % 1;
    } else if (kind === 1) {
      const a = rng.range(0, TAU), r = 6 + 76 * Math.pow(rng(), 0.75);
      x = Math.cos(a) * r; z = Math.sin(a) * r; y = rng.range(0, 64);
    } else { x = seat.x; y = seat.y; z = seat.z - 1.5; }
    pos.set([x, y, z], i * 3); aS.set([s0, rng(), rng(), rng()], i * 4);
    aKS.set([kind, kind === 0 ? rng.range(0.6, 1.4) : rng.range(0.28, 0.62)], i * 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aS', new THREE.BufferAttribute(aS, 4));
  g.setAttribute('aKS', new THREE.BufferAttribute(aKS, 2));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 110, 0), 190);
  return g;
}

function buildHalos(P, seat) {
  // [x, y, z, size, kind, pulse arrival]
  const L = [[0, 104, 0, 230, 0, P.crownAt], [0, 9, seat.z - 7, 34, 2, 0.25]];
  for (let k = 0; k < 5; k++) { const y = 18 + k * 19; L.push([0, y, 0, 58, 1, (48 + (y - 10) * 1.25) / P.V]); }
  const pos = [], aC = [], aP = [], idx = [];
  L.forEach((h, i) => {
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { pos.push(h[0], h[1], h[2]); aC.push(c[0], c[1]); aP.push(h[3], h[4], h[5]); }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aC', new THREE.Float32BufferAttribute(aC, 2));
  g.setAttribute('aP', new THREE.Float32BufferAttribute(aP, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 80, 0), 200);
  return g;
}

function buildApron(noise, tree, R) {
  const RN = 26, SG = 80, pos = [], idx = [];
  for (let k = 0; k <= RN; k++) {
    const rho = R * Math.pow(k / RN, 0.85);
    for (let j = 0; j <= SG; j++) {
      const a = (j / SG) * TAU, x = Math.sin(a) * rho, z = Math.cos(a) * rho;
      let h = 3.4 * Math.exp(-rho / 10) + 0.55 * noise.fbm2(x * 0.06 + 9, z * 0.06, 3) + 0.25 * noise.n2(x * 0.3, z * 0.3);
      for (const f of tree.rootFeet) { const dx = x - f.x, dz = z - f.z; h += 1.5 * Math.exp(-(dx * dx + dz * dz) / 34); }
      if (z > 4) h = lerp(Math.min(h, 0.7) * 0.6, h, smoothstep(6, 13, Math.abs(x)));      // keep the cleft floor low and level
      h = h * (1 - smoothstep(R * 0.6, R, rho)) - 0.6 * smoothstep(R * 0.72, R, rho);
      pos.push(x, h, z);
    }
  }
  const W = SG + 1;
  for (let k = 0; k < RN; k++) for (let j = 0; j < SG; j++) {
    const a = k * W + j, b = a + 1, c = a + W, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { geometry: g, triangles: idx.length / 3 };
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('mother-tree') : ctx.rng;
  const noise = ctx.noise;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const C = (h) => new THREE.Color(h);
  const period = opts.period ?? 8;

  // per-seed character
  const P = {
    period, V: 45, Vf: 38,
    turns: rng.range(0.78, 1.12) * rng.sign(),      // how tightly, and which way, the braid winds
    rise: rng.range(20, 28), droop: rng.range(26, 38),   // domed or flatter umbrella
    spread: rng.range(0.92, 1.06),
    props: rng.int(11, 16), vines: rng.int(7, 9),
    innerTip: rng.range(46, 58), rimTip: rng.range(7, 13),
    hue: rng.range(-1, 1),                          // rose leans violet (-) or warm pink (+)
    crownAt: 3,
  };
  const seat = new THREE.Vector3(0, 8.5, 15);

  const pause = async () => { if (ctx.yield) await ctx.yield(); };
  const tree = await buildTree(rng, noise, P, pause);
  // when the pulse reaches the crown: mean travel distance to the first bough anchors
  { let s = 0; for (const st of tree.strands) s += st.line.length * 0.62; P.crownAt = s / tree.strands.length / P.V; }
  await ctx.yield?.();

  const violet = pal[3].clone(), rose = pal[4].clone(), gold = pal[6].clone();
  if (P.hue < 0) rose.lerp(violet, -P.hue * 0.22); else rose.lerp(C('#ff7ab0'), P.hue * 0.25);
  const moonCol = C(opts.moonColor || '#aab4ff');
  const moonDir = (opts.moonDir ? opts.moonDir.clone() : new THREE.Vector3(0, 0.22, -1)).normalize();

  const U = {
    uTime: { value: 0 }, uCyc: { value: 0 }, uPeriod: { value: period }, uPulseT: { value: 0 },
    uAwake: { value: 1 }, uOpen: { value: 0 }, uV: { value: P.V }, uCrownAt: { value: P.crownAt },
    uMoonDir: { value: moonDir }, uMoonCol: { value: moonCol },
    uViolet: { value: violet }, uRose: { value: rose }, uGold: { value: gold },
    uTip: { value: rose.clone().lerp(C('#ffffff'), 0.3) },
    uBark0: { value: pal[2].clone().lerp(C('#4a4670'), 0.5) },
    uBark1: { value: pal[3].clone().lerp(C('#8f8ab8'), 0.5).multiplyScalar(0.6) },
    uSky: { value: pal[1].clone().lerp(moonCol, 0.3).multiplyScalar(0.32) },
    uViewH: { value: 540 }, uVf: { value: P.Vf }, uHeart: { value: 0 }, uHalo: { value: 0.6 }, uGlow: { value: 1 },
    uRim: { value: 52 },
  };

  const object = new THREE.Group(); object.name = 'mother-tree';
  let triangles = tree.triangles;

  const treeMesh = new THREE.Mesh(tree.geometry, makeMat(U, TREE_VERT, TREE_FRAG));
  tree.geometry.computeBoundingSphere();
  await pause();
  treeMesh.name = 'mother-tree-wood'; object.add(treeMesh);

  if (opts.apron !== false) {
    const ap = buildApron(noise, tree, U.uRim.value);
    const m = new THREE.Mesh(ap.geometry, makeMat(U, APRON_VERT, APRON_FRAG, null, { transparent: true }));
    await pause();
    m.name = 'mother-tree-apron'; m.renderOrder = 0; object.add(m); triangles += ap.triangles;
  }
  await ctx.yield?.();

  const fil = buildFilaments(rng, noise, tree, P, opts.filaments ?? 4200);
  const filMesh = new THREE.Mesh(fil.geometry, makeMat(U, FIL_VERT, FIL_FRAG, null,
    { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
  filMesh.name = 'mother-tree-filaments'; filMesh.frustumCulled = false; filMesh.renderOrder = 2; object.add(filMesh);
  triangles += fil.triangles;
  await ctx.yield?.();

  const spores = new THREE.Points(buildSpores(rng, P, opts.spores ?? 3600, seat), makeMat(U, SPORE_VERT, SPORE_FRAG, null,
    { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  spores.name = 'mother-tree-spores'; spores.frustumCulled = false; spores.renderOrder = 3; object.add(spores);

  if (opts.halos !== false) {
    const hg = buildHalos(P, seat);
    const halos = new THREE.Mesh(hg, makeMat(U, HALO_VERT, HALO_FRAG, null,
      { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    halos.name = 'mother-tree-halos'; halos.frustumCulled = false; halos.renderOrder = 1; object.add(halos);
    triangles += 14;
  }
  await ctx.yield?.();

  // ---- hooks
  let pulseClock = null, progress = 0;
  const phase0 = rng.range(0, period);
  const size = new THREE.Vector2();
  function setProgress(p) {
    progress = clamp(p, 0, 1);
    const e = smoothstep(0, 1, progress);
    U.uOpen.value = e; U.uAwake.value = lerp(0.75, 1.1, e); U.uHalo.value = e;
  }
  setProgress(opts.progress ?? 0.6);
  const cycleOf = (clock) => ((clock % period) + period) % period;
  const pulseAtJS = (cyc, arr) => { let t = cyc - arr; t = ((t + period * 0.25) % period + period) % period - period * 0.25; return t < 0 ? Math.exp(-t * t * 40) : Math.exp(-t * 1.25); };

  function update(dt, time, camera) {
    const clock = pulseClock ?? (time + phase0);
    U.uTime.value = time; U.uPulseT.value = clock; U.uCyc.value = cycleOf(clock);
    U.uHeart.value = pulseAtJS(U.uCyc.value, P.crownAt);
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); if (size.y > 0) U.uViewH.value = size.y; }
  }
  update(0, 0, null);

  const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    portalSeat: { position: seat.clone(), facing: V3(0, 0, 1), radius: 7, width: 17, height: 24 },
    cleft: { apex: V3(0, 24, 10), left: V3(-8.5, 0, 15), right: V3(8.5, 0, 15), floorY: 0.4 },
    flyThrough: [V3(0, 9, 240), V3(0, 8.8, 190), V3(0, 8.5, 135), V3(0, 8.5, 100), V3(0, 8.5, 78), V3(0, 8.5, 45), seat.clone()],
    gap: { position: V3(0, 10, 78), width: 20, height: 55 },
    pulseOrigin: V3(0, 0, 0), crown: V3(0, 108, 0), sporeTop: V3(0, 225, 0),
    moonAxis: V3(0, 0.2, -1).normalize(),
    viewpoints: { reveal: V3(0, 14, 250), low: V3(-70, 6, 150), under: V3(20, 6, 52), flank: V3(170, 30, 60) },
    clearance: { trunkRadius: 13, rootRadius: 38, canopyRadius: 82, canopyTipY: P.rimTip },
  };

  return {
    object, radius: 82, height: 130, center: V3(0, 60, 0), anchors,
    update, dispose() {}, ground: true, groundY: -0.05,
    setProgress, setPulseClock(s) { pulseClock = s; },
    setLight(o = {}) {
      if (o.moonDir) U.uMoonDir.value.copy(o.moonDir).normalize();
      if (o.moonColor) U.uMoonCol.value.set(o.moonColor);
      if (o.fogGlow != null) U.uGlow.value = o.fogGlow;
    },
    pulse: { period, speed: P.V, crownAt: P.crownAt, rippleSpeed: 60, cycle: (time) => cycleOf(pulseClock ?? (time + phase0)) },
    uniforms: U, triangles, filamentCount: fil.count,
  };
}
