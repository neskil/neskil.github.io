// THE CROSSING: hero set piece of "amber-reticulum" (The River That Thinks).
//
// One amber organism has hung itself across a gorge: ~40 honey-clear strands thrown in catenaries
// between three limestone towers on each lip, joined by cross-ties into a net 300 m wide and
// ~110 m tall; 26 teardrop reservoirs that fill and drain on the pulse; slow round drips on
// threads; and at the centre the KNOT, a 70 m lens of clear honey where twelve great veins meet,
// with braided ropes of grains crossing inside it and bubbles rising. Left of the Knot the organism
// has braided a collar round the place where the exit portal hangs.
//
// LOCAL SPACE  origin = centre of the gorge at lip (plateau rim) height, +Y up, +Z = downstream =
//   toward the FAR lip. The gorge runs along X; the lips are at z = -150 (near) and z = +150 (far).
//   The Knot is centred at (0, -40, 0). The hero has no floor: ground:true/groundY:-200 only tells
//   the viewer where the mist would lie. The world supplies gorge walls, lips, mist and terrain.
// SIZE   radius ~215 m, height ~150 m (y -75 .. +95 including the six anchor towers).
// COST   ~142k triangles, 5 draw calls (net, Knot, teardrops, drips, towers; ~116k and 4 without the
//        towers), no lights, no textures. Build ~200 ms, longest step under 30 ms.
// OPTS   palette   : brief palette (7 hex strings: stone, shade blue, amber, lemon, dark honey, sky, moss)
//        detail    : 0.6..1, thins cross-ties, rootlets, drips and beads only
//        sunDir    : THREE.Vector3 pointing TO the sun in the hero's local space
//                    (default: 15 deg up, 50 deg left of the exit heading, as the brief asks)
//        sunColor  : hex, default '#FFE7C2';  skyColor / shadeColor: hex for sheen and fill
//        towers    : false to leave out the six anchor towers (the world then seats its own at
//                    anchors.towers and the strands' flared hems meet them)
//        period    : pulse period in seconds (default 8)
//        duration  : seconds of the world's flight (default 46), only to time the scripted drip
// LIGHT  Everything is SELF-SHADED from uniforms (sun direction and colour, sky and shade colour): no
//        scene lights are read, so it looks the same under any rig. The amber is seen mostly by
//        TRANSMISSION: deep and glassy on the side turned to the sun, gold where the light comes out
//        again, brightest with the sun behind it; a hue-keeping shoulder holds cores under ~1.25 linear
//        so they bloom a little (bloom ~0.3) and never clip to yellow-white. The towers are limestone
//        with a raking ivory key and blue sky fill (shade ~#7C93B8), dark below the lip.
// JOINTS The twelve great veins slim down and sink into sleeves drawn out of the Knot's rim along each
//        vein's own direction, shaded with the same honey as the veins, so no vein stabs the lens.
// HOOKS  update(dt, time, camera) runs the one pulse D(t) = 70*sin(pi*t/period) + 1.5*t from `time`.
//        hero.setPulseTime(t)  : drive the pulse from the world's own pulse clock instead (pass seconds;
//                                call every frame, or pass null to return to `time`).
//        hero.pulse(t)         : the same D(t) in JS, so the world's veins breathe in step.
//        hero.setProgress(u)   : 0..1 along the world's path; the scripted drip (anchors.heroDrip)
//                                lets go at u 0.86 and is 8 m from the fly line at u 0.88.
//        hero.setSun(dir, colorHex) : re-aim the transmission light.
//        hero.veinKit = { meshTubes, material, uniforms, glsl } : build the rest of the net in the SAME honey.
//          geo = await meshTubes([{ P: Float32Array xyz centre line, R: radius per point, S: arc distance
//          from the Knot per point (m), sides, gain: +1/-1 flow sense, r0: nominal radius, seed: 0..1,
//          ref: null }], ctx);  mesh = new THREE.Mesh(geo, material), added under hero.object (points in
//          the hero's local space), frustumCulled = false. It then shares the pulse, bulges and grains.
// ANCHORS (local space)
//        knot        : centre of the Knot;  knotRadius 35, knotThickness 25
//        portalSeat  : { position, normal, radius: 7 } where the 14 m ring hangs inside the collar;
//                      normal faces the arriving camera
//        flyThrough  : ordered points, lip -> portal, >= 9 m clear of every strand, tie, reservoir
//                      and tower at build time (strands are rejected against it); last 90 m straight
//        exitHeading : unit vector of that last straight
//        viewpoints  : { sideOn, underKnot, approach } good still cameras (look at `knot`)
//        towers      : [{ position, radius, height, lip }] the six anchor towers
//        lipVein     : where the world's main vein should pour over the near lip into the net
//        reservoirs  : centres of the 26 teardrops;  perches: 14 { position } points on top of
//                      strands for birds;  heroDrip / swellReservoir: the scripted drip start and the
//                      reservoir 25 m left of the fly line
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#E6E3DA', '#7C93B8', '#F2A51E', '#F9E45B', '#B5600F', '#A9D6F0', '#6F8F5A'];
const KNOT = new THREE.Vector3(0, -40, 0), KNOT_R = 35, KNOT_T = 12.5;
const LIP = 150;

// catenary between a and b with `sag` metres of droop (closed-form cosh), t in 0..1
function catPoint(a, b, sag, t, out) {
  const k = 1.3, c = (Math.cosh(k) - Math.cosh(k * (2 * t - 1))) / (Math.cosh(k) - 1);
  return out.set(lerp(a.x, b.x, t), lerp(a.y, b.y, t) - sag * c, lerp(a.z, b.z, t));
}
function distToPolyline(p, pts) {
  let best = 1e9;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i], b = pts[i + 1];
    const abx = b.x - a.x, aby = b.y - a.y, abz = b.z - a.z;
    const t = clamp(((p.x - a.x) * abx + (p.y - a.y) * aby + (p.z - a.z) * abz) / Math.max(abx * abx + aby * aby + abz * abz, 1e-6), 0, 1);
    const dx = a.x + abx * t - p.x, dy = a.y + aby * t - p.y, dz = a.z + abz * t - p.z;
    best = Math.min(best, Math.sqrt(dx * dx + dy * dy + dz * dz));
  }
  return best;
}

// surface radius of an anchor tower at angle a (from +Z toward +X) and height y; fills TS with shading terms
const TS = { groove: 0, cap: 0, h: 0 };
function towerR(tw, a, y, noise) {
  const H = tw.height, R = tw.radius, sd = tw.seed, ca = Math.sin(a), sa = Math.cos(a);
  // a ragged crown: each side of the tower tops out at its own height, so the peak is off-centre with shoulders
  const crown = 0.5 + 0.5 * Math.sin(a * 2 + sd) * Math.cos(a * 3 - sd * 1.7);
  const h0 = clamp(y / H, 0, 1), h = clamp(h0 + 0.17 * crown * smoothstep(0.45, 0.95, h0), 0, 1);
  let r = R * (1 - 0.33 * h) - R * 0.14;
  for (let k = 0; k < 4; k++) {            // ledges, each tilted a little round the tower
    const lg = tw.ledges[k] + 0.025 * Math.sin(a * 2 + k * 2.1 + sd);
    if (h < lg) r += R * 0.03 + R * 0.09 * smoothstep(lg - 0.035, lg - 0.004, h);
  }
  const cap = smoothstep(0.86, 1.0, h); r *= Math.sqrt(Math.max(1 - cap * cap, 0)) * 0.98 + 0.02 * (1 - cap);
  r *= 1 + 0.13 * Math.sin(a * 2 + sd * 2.3 + h * 1.5) + 0.07 * Math.sin(a * 3 + sd);          // never round in plan
  if (y < 0) r += R * (0.1 * smoothstep(0, -12, y) - 0.12 * smoothstep(-2, -7, y) * smoothstep(-14, -8, y)) + R * 0.3 * smoothstep(-20, -78, y);
  const wob = noise.n3(ca * 1.3 + sd, y * 0.018, sa * 1.3) * 0.1 + noise.n3(ca * 3.1, y * 0.05 + sd, sa * 3.1) * 0.04;
  const fl = Math.abs(Math.sin(a * tw.flutes * 0.5 + noise.n2(ca * 2 + sd, y * 0.02) * 0.9));   // knife ridges at fl = 0
  const groove = (1 - fl) * (1 - fl);
  TS.groove = groove; TS.cap = cap; TS.h = h;
  return r * (1 + wob) * (1 - 0.125 * (1 - groove) * (1 - cap * 0.7));
}

// ---- layout: fly line, towers, strands (all rng draws happen here, in a fixed order) ----
async function layout(rng, detail, noise, ctx) {
  const L = {};
  // portal seat and the camera's line: last 90 m straight at 24..30 deg right of +Z, before that
  // a right-hand arc back to the near lip
  const head = THREE.MathUtils.degToRad(rng.range(24, 30));
  const exit = new THREE.Vector3(-Math.sin(head), 0, Math.cos(head));   // flying toward +Z, left is +X
  const seat = new THREE.Vector3(45, -32, 44);
  const fly = [];
  { // integrate backwards from the seat
    let h = head, p = seat.clone(), y = -30;
    fly.push(p.clone().setY(-31));
    for (let d = 15; d <= 300; d += 15) {
      if (d > 90) h = Math.max(h - (15 / 120), -0.5);          // radius ~120 m arc, ends heading -28 deg
      p = p.clone().add(new THREE.Vector3(Math.sin(h) * 15, 0, -Math.cos(h) * 15));
      if (d > 110) y = Math.min(y + 15 * 0.26, 14);
      fly.push(p.clone().setY(d < 90 ? -30 - 1 * (1 - d / 90) : y));
      if (p.z < -LIP - 25) break;
    }
    fly.reverse();
  }
  L.fly = fly; L.exit = exit; L.seat = seat; L.head = head;
  const lipX = fly[0].x;
  // six anchor towers: three per lip; the camera leaves the near lip through the gap between the left and the middle one
  const towers = [];
  const nearX = [lipX + rng.range(62, 70), lipX - rng.range(72, 78), -rng.range(128, 144)];   // the camera leaves the lip between the first two
  const farX = [rng.range(140, 165), rng.range(0, 28), -rng.range(100, 128)];
  for (let i = 0; i < 6; i++) {
    const near = i < 3, x = near ? nearX[i] : farX[i - 3];
    const radius = rng.range(17, 24), height = rng.range(72, 96) * (i % 3 === 1 ? 1.08 : 1);
    towers.push({ position: new THREE.Vector3(x, 0, (near ? -1 : 1) * (LIP + radius * 0.55 + rng.range(0, 8))), radius, height, lip: near ? 'near' : 'far', seed: rng() * 100 });
    const tw = towers[i], sd = tw.seed; tw.flutes = 2 * (5 + Math.floor(sd % 3));
    tw.ledges = [0.16 + (sd % 7) * 0.01, 0.38 + (sd % 3) * 0.03, 0.58 + (sd % 4) * 0.02, 0.78];
  }
  L.towers = towers;
  // attachment point on a tower: on the side facing `toward`, at height y
  const attach = (tw, y, toward, spread) => {
    const a = Math.atan2(toward.x - tw.position.x, toward.z - tw.position.z) + spread;
    const r = towerR(tw, a, y, noise) * 0.95 - 0.4;
    return new THREE.Vector3(tw.position.x + Math.sin(a) * r, y, tw.position.z + Math.cos(a) * r);
  };
  const strands = [];
  const tmp = new THREE.Vector3();
  const clearOf = (a, b, sag, r, margin) => {
    for (let i = 1; i < 40; i++) {
      catPoint(a, b, sag, i / 40, tmp);
      if (distToPolyline(tmp, fly) < margin + r) return false;
      if (tmp.distanceTo(seat) < 15 + r) return false;
      const dk = Math.hypot(tmp.x - KNOT.x, tmp.z - KNOT.z);
      if (dk < KNOT_R + 6 && Math.abs(tmp.y - KNOT.y) < KNOT_T + 5 + r && i > 3 && i < 37) return false;
    }
    return true;
  };
  // twelve great veins into the Knot: two from each tower
  for (let i = 0; i < 6; i++) {
    const tw = towers[i];
    for (let j = 0; j < 2; j++) {
      const r = rng.range(2.6, 3.9), spread = (j ? 1 : -1) * rng.range(0.16, 0.3);
      const y0 = rng.range(12, 38) + j * rng.range(4, 22);
      const ang = Math.atan2(tw.position.x, tw.position.z) + spread * 1.5;
      const b = new THREE.Vector3(KNOT.x + Math.sin(ang) * (KNOT_R - 5), KNOT.y + rng.range(-3, 3), KNOT.z + Math.cos(ang) * (KNOT_R - 5));
      const sag0 = rng.range(10, 22);
      let a = attach(tw, y0, b, spread), sag = Math.min(sag0, Math.max(1, (a.y - b.y) * 0.17)), done = false, bb = b, angU = ang;
      // look for a clear line: other heights on the tower, tighter or arched sags, then other places on the Knot's rim
      for (const da of [0, 0.45, -0.45, 0.9, -0.9, 1.4, -1.4]) {
        const an = ang + da, b2 = da === 0 ? b : new THREE.Vector3(KNOT.x + Math.sin(an) * (KNOT_R - 5), b.y, KNOT.z + Math.cos(an) * (KNOT_R - 5));
        for (const dy of [0, 14, -10, 28, 42]) {
          const aa = attach(tw, Math.min(y0 + dy, tw.height * 0.8), b2, spread), smax = Math.max(1, (aa.y - b2.y) * 0.17);
          for (const f of [1, 0.55, 0.2, -0.35]) { const sg = Math.min(sag0, smax) * f; if (clearOf(aa, b2, sg, r, 9)) { a = aa; sag = sg; bb = b2; angU = an; done = true; break; } }
          if (done) break;
        }
        if (done) break;
      }
      strands.push({ a, b: bb, sag, r, kind: 0, s0: 0, dir: -1, gain: (i * 2 + j) % 2 ? 1 : -1, ang: angU, rootA: tw.position });   // s measured from the Knot end (b)
    }
  }
  // cross-gorge strands, tower to tower
  const want = Math.round(rng.range(25, 31));
  for (let n = 0, tries = 0; n < want && tries < 400; tries++) {
    const i = rng.int(0, 2), jr = rng(), jd = rng() < 0.5 ? -1 : 1, j = jr < 0.42 ? i : clamp(i + jd, 0, 2) === i ? clamp(i - jd, 0, 2) : clamp(i + jd, 0, 2);
    const ta = towers[i], tb = towers[3 + j];
    const r = rng() < 0.25 ? rng.range(2.2, 3.4) : rng.range(1.0, 2.0);
    const ya = rng.range(-22, ta.height - 6), yb = rng.range(-22, tb.height - 6);
    const a = attach(ta, ya, tb.position, rng.range(-0.9, 0.9)), b = attach(tb, yb, ta.position, rng.range(-0.9, 0.9));
    const sag = rng.range(30, 60);
    if (tries % 12 === 11) await ctx.yield();
    if (!clearOf(a, b, sag, r, 9.5)) continue;
    strands.push({ a, b, sag, r, kind: 1, s0: rng.range(120, 300), dir: 1, gain: rng() < 0.5 ? 1 : -1, rootA: ta.position, rootB: tb.position });
    n++;
  }
  L.strands = strands; L.clearOf = clearOf; L.attach = attach;
  return L;
}

// ---- turn the layout into tube descriptors { P, R, S, sides, gain, r0, seed, ref } ----
async function makeTubes(L, rng, detail, noise, ctx) {
  const tubes = [], v = new THREE.Vector3(), w = new THREE.Vector3();
  const samples = [];                                    // points on strands, for ties / guys / perches
  for (let si = 0; si < L.strands.length; si++) {
    const st = L.strands[si];
    const len = st.a.distanceTo(st.b) * (1 + 1.6 * (st.sag * st.sag) / Math.max(st.a.distanceToSquared(st.b), 1));
    const n = Math.max(12, Math.round(len / (st.kind === 0 ? 3.4 : 4.6)));
    const P = new Float32Array((n + 1) * 3), R = new Float32Array(n + 1), S = new Float32Array(n + 1);
    const ph = rng() * 6.28;
    for (let i = 0; i <= n; i++) {
      const t = i / n; catPoint(st.a, st.b, st.sag, t, v);
      P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
      const d0 = t * len, d1 = (1 - t) * len;
      // trumpet hem at a tower end, webbed fillet into the Knot, slow lumps along the run
      const flare = 1 + 0.85 * Math.exp(-d0 / 5) + (st.kind === 0 ? -0.3 * Math.exp(-d1 / 7) : 0.85 * Math.exp(-d1 / 5));
      R[i] = st.r * flare * (1 + 0.07 * Math.sin(d0 * 0.21 + ph) + 0.04 * Math.sin(d0 * 0.53 + ph * 2));
      S[i] = st.kind === 0 ? d1 + 30 : st.s0 + d0;
      if (i > 2 && i < n - 2 && i % 2 === 0) samples.push({ p: v.clone(), si, r: st.r, s: S[i], t });
    }
    st.len = len; st.P = P; st.n = n; st.S = S;
    tubes.push({ P, R, S, sides: st.r > 2.1 ? 10 : 7, gain: st.gain, r0: st.r, seed: rng(), ref: null, rootA: st.rootA, rootB: st.rootB });
    if (si % 8 === 7) await ctx.yield();
  }
  L.samples = samples;
  // cross-ties: short sagging links between neighbouring strands
  const nTies = Math.round(rng.range(62, 74) * (0.5 + 0.5 * detail));
  const ties = [];
  for (let n = 0, tries = 0; n < nTies && tries < 900; tries++) {
    if (tries % 25 === 24) await ctx.yield();
    const A = samples[Math.floor(rng() * samples.length)];
    let best = null, bd = 1e9; const want = rng.range(12, 30);
    for (let k = 0; k < 40; k++) {
      const B = samples[Math.floor(rng() * samples.length)];
      if (B.si === A.si) continue;
      const d = A.p.distanceTo(B.p);
      if (d < 9 || d > 46) continue;
      if (Math.abs(d - want) < bd) { bd = Math.abs(d - want); best = B; }
    }
    if (!best) continue;
    const d = A.p.distanceTo(best.p), sag = d * rng.range(0.08, 0.2), r = rng.range(0.5, 1.0);
    if (!L.clearOf(A.p, best.p, sag, r, 9.5)) continue;
    let crowded = false;
    for (const t of ties) if (t.a.distanceTo(A.p) < 7 || t.b.distanceTo(best.p) < 7 || t.a.distanceTo(best.p) < 7 || t.b.distanceTo(A.p) < 7) { crowded = true; break; }
    if (crowded) continue;
    ties.push({ a: A.p, b: best.p });
    const seg = Math.max(6, Math.round(d / 2.4)), P = new Float32Array((seg + 1) * 3), R = new Float32Array(seg + 1), S = new Float32Array(seg + 1);
    for (let i = 0; i <= seg; i++) {
      const t = i / seg; catPoint(A.p, best.p, sag, t, v);
      P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
      R[i] = r * (0.82 + 1.5 * Math.exp(-t * d / 2.2) * (A.r / 1.6) + 1.5 * Math.exp(-(1 - t) * d / 2.2) * (best.r / 1.6));
      S[i] = A.s + t * d;
    }
    tubes.push({ P, R, S, sides: 6, gain: rng() < 0.5 ? 1 : -1, r0: r, seed: rng(), ref: null });
    n++;
  }
  // rootlets feeling over the tower where each strand is rooted
  const nRoot = detail > 0.9 ? 3 : 2;
  await ctx.yield();
  for (const st of L.strands) {
    const ends = st.kind === 0 ? [st.a] : [st.a, st.b];
    for (const e of ends) {
      const tw = L.towers.reduce((m, t) => (Math.hypot(t.position.x - e.x, t.position.z - e.z) < Math.hypot(m.position.x - e.x, m.position.z - e.z) ? t : m), L.towers[0]);
      const a0 = Math.atan2(e.x - tw.position.x, e.z - tw.position.z);
      for (let k = 0; k < nRoot; k++) {
        const da = rng.range(-1, 1), dy = rng.range(-1, 0.6), lenR = rng.range(6, 14) + st.r * 2, seg = 6, r = rng.range(0.14, 0.3) * (0.7 + st.r * 0.25);
        const nm = Math.hypot(da, dy) || 1, P = new Float32Array((seg + 1) * 3), R = new Float32Array(seg + 1), S = new Float32Array(seg + 1), wig = rng() * 6.28;
        for (let i = 0; i <= seg; i++) {
          const t = i / seg, y = e.y + (dy / nm) * lenR * t + Math.sin(t * 5 + wig) * 0.8 * t;
          const a = a0 + ((da / nm) * lenR * t + Math.cos(t * 4 + wig) * 0.9 * t) / tw.radius;
          const rr = towerR(tw, a, y, noise) + 0.05;
          P[i * 3] = tw.position.x + Math.sin(a) * rr; P[i * 3 + 1] = y; P[i * 3 + 2] = tw.position.z + Math.cos(a) * rr;
          R[i] = r * (1 - 0.8 * t) + (i === 0 ? st.r * 0.25 : 0);
          S[i] = (st.kind === 0 ? st.len + 30 : st.s0 + (e === st.a ? 0 : st.len)) + t * lenR;
        }
        tubes.push({ P, R, S, sides: 3, gain: 0.5, r0: r, seed: rng(), ref: null, thin: 1 });
      }
    }
  }
  // the collar: six strands braided into a hoop round the portal seat, guyed to the net by eight
  const nrm = L.exit.clone().multiplyScalar(-1), ax = new THREE.Vector3(0, 1, 0).cross(nrm).normalize(), ay = new THREE.Vector3(0, 1, 0);
  L.ring = { nrm, ax, ay };
  await ctx.yield();
  const HOOP = 9.1, seg = 168;
  for (let k = 0; k < 6; k++) {
    const P = new Float32Array((seg + 1) * 3), R = new Float32Array(seg + 1), S = new Float32Array(seg + 1);
    for (let i = 0; i <= seg; i++) {
      const th = (i / seg) * Math.PI * 2, ph = th * 7 + (k / 6) * Math.PI * 2 + (k % 2) * 0.5;
      const rad = HOOP + 0.95 * Math.cos(ph), axial = 0.95 * Math.sin(ph) * (k % 2 ? 1 : -1);
      v.copy(L.seat).addScaledVector(ax, Math.cos(th) * rad).addScaledVector(ay, Math.sin(th) * rad).addScaledVector(nrm, axial);
      P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
      R[i] = 0.74 * (1 + 0.1 * Math.sin(th * 13 + k)); S[i] = 60 + (k % 2 ? 1 : -1) * th * HOOP;
    }
    tubes.push({ P, R, S, sides: 6, gain: k % 2 ? 1 : -1, r0: 0.75, seed: rng(), ref: nrm, closed: true });
  }
  const guyClear = (a, b, sag) => {
    for (let i = 1; i <= 16; i++) { catPoint(a, b, sag, i / 17, v); if (distToPolyline(v, L.fly) < 8.9) return false; }
    return true;
  };
  L.guys = []; L.rim = [];
  for (let k = 0; k < 16; k++) L.rim.push({ p: new THREE.Vector3(KNOT.x + Math.sin(k * 0.3927) * 33, KNOT.y + 3, KNOT.z + Math.cos(k * 0.3927) * 33), si: -1, r: 3, s: 30, t: 0.5 });
  for (let k = 0; k < 8; k++) {
    const th = (k + 0.5 + rng.range(-0.2, 0.2)) / 8 * Math.PI * 2;
    const dir = ax.clone().multiplyScalar(Math.cos(th)).addScaledVector(ay, Math.sin(th));
    await ctx.yield();
    const a = L.seat.clone().addScaledVector(dir, HOOP + 0.6);
    let best = null, bs = 1e9;
    for (const sm of samples.concat(L.rim)) {
      w.subVectors(sm.p, a); const d = w.length(); if (d < 12 || d > 110) continue;
      const along = w.dot(dir) / d; if (along < 0.25) continue;
      const score = d * (1.6 - along);
      if (score < bs && guyClear(a, sm.p, d * 0.05)) { bs = score; best = sm; }
    }
    if (!best) continue;
    const b = best.p;
    const d = a.distanceTo(b), sg = Math.max(8, Math.round(d / 3)), P = new Float32Array((sg + 1) * 3), R = new Float32Array(sg + 1), S = new Float32Array(sg + 1);
    for (let i = 0; i <= sg; i++) {
      const t = i / sg; catPoint(a, b, d * 0.05, t, v);
      P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
      R[i] = 0.72 * (1 + 0.9 * Math.exp(-t * d / 2) + 1.6 * Math.exp(-(1 - t) * d / 2.5)); S[i] = 60 + t * d;
    }
    tubes.push({ P, R, S, sides: 6, gain: k % 2 ? 1 : -1, r0: 0.75, seed: rng(), ref: null });
    L.guys.push({ a, b });
  }
  return tubes;
}

// ---- mesh all tubes into one geometry. Per vertex: axis (tangent), aTube = (s, ring radius,
// angle round the tube 0..1 with 0 on top, base radius r0), aFlow = (gain, seed) ----
// every open tube is closed with a small rounded cap beyond each end (inside the rock or the Knot where it is anchored)
function capTube(t) {
  if (t.closed || t.nocap || t.r0 < 0.6) return t;
  const n = t.P.length / 3, k = t.r0 >= 1.5 || t.rootA || t.rootB ? 2 : 1, m = n + 2 * k;
  const P = new Float32Array(m * 3), R = new Float32Array(m), S = new Float32Array(m);
  P.set(t.P, k * 3); R.set(t.R, k); S.set(t.S, k);
  for (let e = 0; e < 2; e++) {
    const i = e ? n - 1 : 0, j = e ? n - 2 : 1, r = t.R[i];
    let dx = t.P[i * 3] - t.P[j * 3], dy = t.P[i * 3 + 1] - t.P[j * 3 + 1], dz = t.P[i * 3 + 2] - t.P[j * 3 + 2];
    const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
    const root = e ? t.rootB : t.rootA;
    if (root) {      // an end on a tower runs on, at full width, to the tower's axis: its mouth is deep in the stone
      const ex = t.P[i * 3], ey = t.P[i * 3 + 1], ez = t.P[i * 3 + 2];
      for (let c = 1; c <= k; c++) {
        const q = e ? k + n - 1 + c : k - c, f = c / k;
        P[q * 3] = ex + (root.x - ex) * f; P[q * 3 + 1] = ey - 1.5 * f; P[q * 3 + 2] = ez + (root.z - ez) * f;
        R[q] = r * (1 - 0.25 * f); S[q] = t.S[i];
      }
      continue;
    }
    for (let c = 1; c <= k; c++) {
      const q = e ? k + n - 1 + c : k - c, last = c === k, d = (last ? (k === 2 ? 1.5 : 0.7) : 0.8) * r;
      P[q * 3] = t.P[i * 3] + dx * d; P[q * 3 + 1] = t.P[i * 3 + 1] + dy * d; P[q * 3 + 2] = t.P[i * 3 + 2] + dz * d;
      R[q] = last ? 0.03 * r : 0.8 * r; S[q] = t.S[i];
    }
  }
  return { ...t, P, R, S };
}
async function meshTubes(tubesIn, ctx) {
  const tubes = tubesIn.map(capTube);
  let nv = 0, ni = 0;
  for (const t of tubes) { const n = t.P.length / 3; nv += n * (t.sides + 1); ni += (n - 1) * t.sides * 6; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), axis = new Float32Array(nv * 3);
  const tube = new Float32Array(nv * 4), flow = new Float32Array(nv * 2), idx = new Uint32Array(ni);
  const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), xa = new THREE.Vector3(1, 0, 0);
  let vo = 0, io = 0, work = 0;
  // one tube at a time in a plain function (a loop inside an async function is not optimised)
  const one = (t) => {
    const P = t.P, n = P.length / 3, sd = t.sides, base = vo;
    N.set(0, 0, 0);
    for (let i = 0; i < n; i++) {
      const i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, n - 1);
      if (t.closed && (i === 0 || i === n - 1)) T.set(P[3] - P[(n - 2) * 3], P[4] - P[(n - 2) * 3 + 1], P[5] - P[(n - 2) * 3 + 2]);
      else T.set(P[i1 * 3] - P[i0 * 3], P[i1 * 3 + 1] - P[i0 * 3 + 1], P[i1 * 3 + 2] - P[i0 * 3 + 2]);
      if (T.lengthSq() < 1e-10) T.set(0, 0, 1);
      T.normalize();
      if (t.ref) N.copy(t.ref);
      else if (i === 0) N.copy(Math.abs(T.y) > 0.9 ? xa : up);
      N.addScaledVector(T, -N.dot(T));
      if (N.lengthSq() < 1e-8) N.copy(Math.abs(T.y) > 0.9 ? xa : up).addScaledVector(T, -(Math.abs(T.y) > 0.9 ? T.x : T.y));
      N.normalize(); B.crossVectors(T, N);
      const r = t.R[i], cx = P[i * 3], cy = P[i * 3 + 1], cz = P[i * 3 + 2];
      for (let j = 0; j <= sd; j++) {
        const a = (j / sd) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
        const nx = N.x * c + B.x * s, ny = N.y * c + B.y * s, nz = N.z * c + B.z * s;
        pos[vo * 3] = cx + nx * r; pos[vo * 3 + 1] = cy + ny * r; pos[vo * 3 + 2] = cz + nz * r;
        nor[vo * 3] = nx; nor[vo * 3 + 1] = ny; nor[vo * 3 + 2] = nz;
        axis[vo * 3] = T.x; axis[vo * 3 + 1] = T.y; axis[vo * 3 + 2] = T.z;
        tube[vo * 4] = t.S[i]; tube[vo * 4 + 1] = r; tube[vo * 4 + 2] = j / sd; tube[vo * 4 + 3] = t.r0;
        flow[vo * 2] = t.gain; flow[vo * 2 + 1] = t.seed;
        vo++;
      }
    }
    for (let i = 0; i < n - 1; i++) for (let j = 0; j < sd; j++) {
      const a = base + i * (sd + 1) + j, b = a + sd + 1;
      idx[io++] = a; idx[io++] = a + 1; idx[io++] = b; idx[io++] = b; idx[io++] = a + 1; idx[io++] = b + 1;
    }
    return n * sd;
  };
  for (const t of tubes) {
    work += one(t);
    if (work > 9000) { work = 0; await ctx.yield(); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('aAxis', new THREE.BufferAttribute(axis, 3));
  g.setAttribute('aTube', new THREE.BufferAttribute(tube, 4));
  g.setAttribute('aFlow', new THREE.BufferAttribute(flow, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -10, 0), 320);
  return g;
}

// ---- shared GLSL: the one pulse, the gorge-wind sway, and the honey-glass shading ----
const GLSL_COMMON = /* glsl */`
uniform float uTime;      // wind clock
uniform float uPulseT;    // pulse clock (seconds)
uniform float uPeriod;
uniform vec3 uSeat, uRareP; uniform float uRareA;
float pulseD(float t){ return 70.0 * sin(3.14159265 * t / uPeriod) + 1.5 * t; }
#ifdef IS_VERTEX
// camera in the hero's local space (the hero may be moved and turned by the world; uniform scale only)
vec3 camLocal(){ mat3 m = mat3(modelMatrix); return ((cameraPosition - modelMatrix[3].xyz) * m) / max(dot(m[0], m[0]), 1e-6); }
#endif
// everything hanging in the gorge sways together as a smooth function of where it is (about 1 m)
vec3 swayAt(vec3 p){
  float w = clamp(1.0 - (p.z * p.z) / 21000.0, 0.0, 1.0);
  w *= w * smoothstep(11.0, 42.0, distance(p, uSeat));
  vec3 dr = p - uRareP; float spring = uRareA * exp(-dot(dr.xz, dr.xz) / 1500.0) * smoothstep(-60.0, -10.0, dr.y);
  return vec3(0.0, spring * w, 0.0) + w * vec3(sin(uTime * 0.45 + p.z * 0.012 + p.y * 0.02) + 0.35 * sin(uTime * 1.1 + p.z * 0.05),
                  0.3 * sin(uTime * 0.6 + p.x * 0.015),
                  0.25 * sin(uTime * 0.37 + p.x * 0.02));
}
`;
const GLSL_AMBER = /* glsl */`
uniform vec3 uSun, uSunCol, uSky, uShade, uDark, uLemon, uAbs;
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
// 1 below lo, 0 above hi (lo < hi)
float fall(float lo, float hi, float x){ float t = clamp((x - lo) / max(hi - lo, 1e-5), 0.0, 1.0); return 1.0 - t * t * (3.0 - 2.0 * t); }
// dark grains: one layer of cells in (along, around) metres; wrap = whole cells round the tube
float grainLayer(vec2 uv, float wrap, float stretch, float big){
  vec2 id = floor(uv), f = fract(uv); float m = 0.0;
  for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec2 o = vec2(float(i), float(j)), c = id + o; c.y = mod(c.y, wrap);
    float rnd = h21(c + 0.37);
    vec2 q = o + vec2(h21(c + 7.1), h21(c + 3.3)) * 0.64 + 0.18 - f;
    q.x *= stretch;
    // grains travel in lanes that wind slowly round the tube, so they read as streams, not spots
    float lane = 0.5 + 0.5 * sin(c.y / wrap * 12.566 + c.x * 0.23 + sin(c.x * 0.071) * 2.0);
    float rad = (0.05 + 0.13 * rnd * rnd) * big;
    m = max(m, step(mix(0.74, 0.16, lane * lane), rnd) * fall(rad * 0.25, rad, length(q)));
  }
  return m;
}
// hue-keeping shoulder: through-lit cores may bloom a little but never clip to yellow-white
vec3 knee(vec3 c){ float m = max(c.r, max(c.g, c.b)); float k = m < 0.85 ? m : 0.85 + 0.8 * (1.0 - exp(-(m - 0.85) / 0.8)); return c * (k / max(m, 1e-4)); }
// env seen through / reflected in the glass: blue sky above, shadowed gorge below
vec3 envCol(vec3 d){ return mix(uShade * 0.55, uSky, smoothstep(-0.25, 0.35, d.y)); }
// GLASS: what hangs in the gorge is clear enough to see through. gGl (0..1) and gP (hero-local position) are set by
// the caller; behindCol is the gorge as it lies behind a point, worked out from the two walls, the mist and the sky
// (no second pass): pale ledge lines on blue shade, lit mist below, sky above the lips, the sun, and gold bands for
// the strands that hang behind.
float gGl = 0.0, gThin = 1.0; vec3 gP = vec3(0.0);        // gThin < 1: clearer glass than its width would give
vec3 behindCol(vec3 P, vec3 d){
  float dz = abs(d.z) < 0.06 ? (d.z < 0.0 ? -0.06 : 0.06) : d.z;
  float t = clamp(((dz > 0.0 ? 126.0 : -126.0) - P.z) / dz, 0.0, 1200.0);
  float y = P.y + d.y * t, x = P.x + d.x * t;
  float hz = 1.0 - exp(-t / 700.0);
  vec3 sky = mix(uSky * 1.08, uSky * vec3(0.6, 0.76, 1.0), smoothstep(0.0, 0.45, d.y));
  vec3 mistC = mix(uShade, uSky, 0.6) * 1.12;
  float led = fall(0.02, 0.14, abs(fract(y / 23.0 + 0.16 * sin(x * 0.021 + y * 0.05)) - 0.5));
  float flu = 0.5 + 0.5 * sin(x * 0.19 + 2.0 * sin(x * 0.043));
  vec3 wall = mix(uShade * (0.2 + 0.12 * flu + 1.5 * led), mistC * 0.8, hz * 0.55);
  vec3 col = mix(wall, mistC, 1.0 - smoothstep(-128.0, -84.0, y));
  col = mix(col, sky, smoothstep(-4.0, 10.0, y));
  float tx = x * 0.019 + 0.35 * sin(x * 0.0043), tf = abs(fract(tx) - 0.5) * 2.0, th = (96.0 - 250.0 * tf) * (0.55 + 0.45 * sin(floor(tx) * 12.9));
  col = mix(col, mix(uShade * (0.5 + 0.5 * flu), mistC, 0.25 + 0.5 * hz), smoothstep(0.0, 6.0, th - y) * smoothstep(-4.0, 6.0, y));       // towers on the lip
  float sn = max(dot(d, uSun), 0.0), s2 = sn * sn, s8 = s2 * s2; s8 *= s8;
  col += uSunCol * (0.16 * s8 + 2.2 * s8 * s8 * s8 * s8) * smoothstep(-30.0, 10.0, y);
  // strands behind: a few gold bands, slowly different from place to place
  float st = sin(d.y * 9.0 + d.x * 5.0 + P.x * 0.031 + 1.7 * sin(d.z * 4.0 + P.z * 0.02)) * sin(d.y * 4.3 - d.x * 7.0 + P.y * 0.045 + 0.6);
  col = mix(col, uSunCol * exp(-1.6 * uAbs) * 0.95, smoothstep(0.55, 0.9, st) * 0.75);
  return col;
}
// honey glass. N,V unit; r = local radius in metres; returns linear HDR colour before grains.
// thick = view thickness in metres (out), back = how much the sun is behind what we look at (out)
// xr = how far across the rod's seen width this point lies: 0 on its axis, 1 at its outline
vec3 honeyX(vec3 N, vec3 V, float r, float xr, out float ndv, out float back){
  ndv = max(dot(N, V), 0.0);
  back = max(-dot(V, uSun), 0.0);
  float b2 = back * back;
  float sunN = dot(N, uSun), toward = max(sunN, 0.0), away = max(-sunN, 0.0);
  // optical depth: threads are lemon, strands gold, mains deep honey; and every rod deepens from its bright
  // core out to its rind, as a jar of honey does
  float heC = 1.0 + (2.6 * smoothstep(0.1, 0.75, r) + 0.8 * smoothstep(1.2, 3.6, r)) * gThin;
  // light that comes out on the side away from the sun, or straight through with the sun behind, took the short way
  float shortp = clamp(0.45 * away * away + 0.5 * b2 * b2, 0.0, 0.6);
  float he = heC * (0.55 + 3.4 * xr * (0.35 + 0.65 * xr)) * (1.0 - 0.4 * shortp);
  vec3 trans = exp(-he * uAbs);
  // light inside the glass: some is piped along it everywhere, more leaves by the far side, and with the sun
  // behind it the whole core lights up
  float lit = 0.5 + 0.06 * toward + 0.26 * away * away + b2 * (0.3 + 0.7 * b2);
  float core = 1.0 - smoothstep(0.0, 0.55, xr);              // the bright heart is about a third of the seen width
  // a rod of glass gathers the sun into one bright line along its far side
  float cs = sunN + 0.62, streak = exp(-cs * cs * 46.0) * (0.25 + 0.75 * ndv);
  // what is seen THROUGH a solid rod is upside down: gorge shade along its top, sky along its belly
  vec3 seen = envCol(normalize(-V - N * (1.15 - 0.6 * ndv)));
  // a pale, clear organism (citrine) keeps its flanks light; honey and garnet fall to deep colour
  float deep = clamp((uAbs.y - 0.05) / 0.17, 0.3, 1.0);
  vec3 col = trans * (uSunCol * (lit * mix(0.66 + 0.85 * core * core, 0.26 + 1.75 * core * core, deep) + 0.4 * (1.0 - 0.8 * gGl) * streak) + seen * vec3(0.12, 0.1, 0.08));
  // hanging glass: through the middle of the rod the gorge behind it shows, upside down, squeezed and tinted amber;
  // nothing shows through the flanks, where the light is turned back inside
  if (gGl > 0.001) {
    float x2 = xr * xr, chord = sqrt(max(1.0 - x2, 0.0));
    // nearly straight through the middle; toward the edge the view is bent further and further aside, as a rod of glass does
    vec3 Rf = normalize(-V + (N - V * dot(N, V)) * (0.12 + 0.8 * x2 * x2));
    vec3 bh = behindCol(gP, Rf);
    bh = mix(bh, vec3(dot(bh, vec3(0.3, 0.5, 0.2))), 0.5);      // amber takes the blue out: mostly how bright it is behind
    float win = 1.0 - smoothstep(0.62, 0.93, xr);
    // the colour deepens with the glass the light crossed: a thread is clear lemon, a main or a teardrop deep in its middle
    vec3 tint = exp(-(0.35 + 1.5 * min(r, 4.5) * (0.35 + 0.65 * chord)) * gThin * (0.6 + 0.4 * deep) * uAbs);
    col = mix(col, bh * tint * 1.6 + col * 0.1, gGl * win * 0.94);
    // the light that crossed the rod gathers into a thin bright line just inside its far edge
    float cx = xr - 0.76; col += uLemon * tint * (0.55 * gGl * exp(-cx * cx * 260.0) * smoothstep(0.05, 0.6, away) * smoothstep(0.3, 1.2, r));
  }
  // the brightest of the core pales toward the young-growth lemon, as light does through the middle of a jar;
  // in hanging glass it flares only where the sun stands behind it
  col += uLemon * (core * core * core * mix(0.55 + 0.5 * min(lit, 1.3) + 0.4 * b2, 0.03 + 0.22 * b2 * b2, gGl)) * smoothstep(0.15, 0.9, r);
  // thin places go lemon rather than white
  col = mix(col, uLemon * (0.3 + 0.5 * min(lit, 1.4)), 0.45 * exp(-r * 5.0));
  // the edge of the glass: a dark rind with the deepest colour just inside it
  // the flanks fall to deep honey well inside the outline, and the rind is darker still
  float thickR = smoothstep(0.1, 0.6, r);
  col = mix(col, uDark * (0.5 + 0.5 * min(lit, 1.5)), (0.4 + 0.34 * deep) * smoothstep(0.3 + 0.36 * gGl, 0.86 + 0.1 * gGl, xr) * thickR);
  col *= 1.0 - (0.2 + 0.3 * deep) * smoothstep(0.86, 0.995, xr) * thickR;
  return knee(col);
}
vec3 honey(vec3 N, vec3 V, float r, out float ndv, out float back){
  float d = max(dot(N, V), 0.0);
  return honeyX(N, V, r, sqrt(max(1.0 - d * d, 0.0)), ndv, back);
}
vec3 skin(vec3 col, vec3 N, vec3 V, float ndv, float spec){
  float e = 1.0 - ndv, fres = 0.03 + 0.97 * e * e * e * e * e;
  vec3 R = reflect(-V, N);
  col += envCol(R) * (fres * 0.13 + 0.008);
  float sp = max(dot(R, uSun), 0.0); float s4 = sp * sp; s4 *= s4; float s16 = s4 * s4; s16 *= s16; float s64 = s16 * s16; s64 *= s64;
  col += uSunCol * spec * (s64 * s64 * 2.4 + vec3(1.0, 0.78, 0.42) * s16 * 0.02);
  // sky sheen sliding on the upper skin
  col += uSky * 0.016 * smoothstep(0.2, 1.0, N.y);
  return col;
}
`;

function makeUniforms(pal, o) {
  return {
    uTime: { value: 0 }, uPulseT: { value: 0 }, uPeriod: { value: o.period }, uSeat: { value: o.seat },
    uSun: { value: o.sunDir }, uSunCol: { value: new THREE.Color(o.sunColor).multiplyScalar(1.1) },
    uSky: { value: new THREE.Color(o.skyColor) }, uShade: { value: new THREE.Color(o.shadeColor) },
    uDark: { value: new THREE.Color(pal[4]).multiplyScalar(0.55) }, uLemon: { value: new THREE.Color(pal[3]) },
    uGrain: { value: new THREE.Color('#5A2C08') }, uAbs: { value: o.abs }, uHeroT: { value: -1000 }, uHeroOn: { value: 0 },
    uBranch: { value: new THREE.Vector4(1, 1, 0, 0) },   // z: metres grown by the feelers (aFlow.y in 4..5)
    uRareP: { value: new THREE.Vector3(0, 1000, 0) }, uRareA: { value: 0 },   // where a reservoir let go, and how far the net is sprung (m)
    uFar: { value: 0.002 },   // far strands never thinner than this times their distance   // radius scale of the world's two scripted branches (aFlow.y in 2..3 and 3..4)
  };
}

function makeTubeMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: /* glsl */`
      attribute vec3 aAxis; attribute vec4 aTube; attribute vec2 aFlow;
      uniform vec4 uBranch; uniform float uFar;
      #define IS_VERTEX
      varying vec3 vN, vT, vW, vCam; varying vec4 vTube; varying vec2 vFlow; varying float vBulge;
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      void main(){
        float s = aTube.x;
        float D = pulseD(uPulseT - s / 400.0);
        float b = fract((s - 2.2 * D) / 80.0) - 0.5;
        float bump = exp(-b * b * 60.0) * smoothstep(0.4, 1.2, aTube.w);
        float tipD = uBranch.z - (s - 1000.0);
        // seed 6..7: the climber, a vein with fat bulges half as wide again strung along it, travelling toward larger s
        float cb = fract((s - uPulseT * 5.0) / 14.0) - 0.5, climb = step(6.0, aFlow.y) * exp(-cb * cb * 22.0);
        float br = aFlow.y > 6.0 ? 1.0 + 0.7 * climb : aFlow.y > 5.0 ? 1.0 + 0.2 * (0.5 + 0.5 * sin(s * 0.13 + uPulseT * 1.7)) : aFlow.y > 4.0 ? smoothstep(0.0, 4.5, tipD) * (1.0 + 0.75 * exp(-(tipD - 6.0) * (tipD - 6.0) * 0.07)) : (aFlow.y > 3.0 ? uBranch.y * (1.0 + 0.16 * (uBranch.y - 1.0) * (0.5 + 0.5 * sin(s * 0.06 + uPulseT * 1.5))) : (aFlow.y > 2.0 ? uBranch.x : 1.0));
        vec3 p = position + normal * aTube.y * (0.2 * bump + br - 1.0);
        // far off, a strand is never thinner than about two pixels: the web reads as a soft gold band
        float dC = distance(camLocal(), p);
        p += normal * max(dC * uFar - aTube.y * br, 0.0) * step(0.02, br);
        p += swayAt(p);
        vN = normal; vT = aAxis; vW = p; vCam = camLocal();
        vec4 wp = modelMatrix * vec4(p, 1.0);
        vTube = vec4(s, aTube.y * (br + 0.2 * bump), aTube.z, aTube.w * br); vFlow = aFlow; vBulge = max(bump, climb);
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
        vFogDepth *= 0.55;            // the glass carries its own light through the haze
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vN, vT, vW, vCam; varying vec4 vTube; varying vec2 vFlow; varying float vBulge;
      uniform vec3 uGrain; uniform vec4 uBranch;
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${GLSL_AMBER}
      void main(){
        vec3 N = normalize(vN), V = normalize(vCam - vW), T = normalize(vT);
        float r = vTube.y, r0 = max(vTube.w, 0.05), s = vTube.x;
        float ndv, back;
        // across-the-rod position, taken square to the tube so that a vein seen along its length keeps its bright core
        vec3 Vp = V - T * dot(V, T); float lp = max(length(Vp), 0.05), nvp = clamp(dot(N, Vp) / lp, 0.0, 1.0);
        gP = vW; gGl = smoothstep(-172.0, -150.0, vW.z) * (1.0 - smoothstep(150.0, 172.0, vW.z));     // glass where it hangs in the gorge
        float pour = step(5.0, vFlow.y) * step(vFlow.y, 6.0);          // the three strands by which the river leaves the lip
        gThin = 1.0 - 0.5 * pour;                                     // they are the clearest, palest glass in the net
        vec3 col = honeyX(N, V, r, sqrt(max(1.0 - nvp * nvp, 0.0)), ndv, back);
        // grains: two depths sliding past each other, scrolled by the pulse
        float D = pulseD(uPulseT - s / 400.0) * vFlow.x;
        vec3 Bt = cross(N, T);
        float inv = 1.0 / max(ndv, 0.3), vt = dot(V, T) * inv, vb = dot(V, Bt) * inv;
        float cell = clamp(r0 * 0.16, 0.26, 0.7), circ = 6.2832 * r0;
        float wrap = max(1.0, floor(circ / cell + 0.5)), cy = circ / wrap;
        float fw = fwidth(s) / cell + fwidth(vTube.z) * wrap * 0.3;
        float keep = 1.0 - smoothstep(0.3, 0.8, fw);
        float d1 = 0.3 * r, d2 = 0.7 * r;
        vec2 u1 = vec2((s - vt * d1 - D) / cell, (vTube.z * circ - vb * d1) / cy + vFlow.y * 17.0);
        vec2 u2 = vec2((s - vt * d2 - D * 0.62) / (cell * 1.5) + 31.7, (vTube.z * circ - vb * d2) / (cy * 1.5) + vFlow.y * 5.0);
        float g1 = grainLayer(u1, wrap, 0.34, 0.8), g2 = grainLayer(u2, max(1.0, floor(wrap / 1.5 + 0.5)), 0.3, 0.9);
        // a main seen from just above its own skin is all grazing angles: its grains stay in right to the rind
        float thickV = smoothstep(3.0, 4.5, r0);
        float inC = smoothstep(mix(0.1, 0.02, thickV), mix(0.5, 0.2, thickV), ndv) * smoothstep(33.0, 47.0, s);
        g1 = mix(0.06, g1, keep) * inC; g2 = mix(0.06, g2, keep) * inC;
        // when the fine grains fall below a pixel, larger ones take over, so thin and distant strands still stream
        { float cellF = cell * 2.7, wrapF = max(1.0, floor(circ / cellF + 0.5)), cyF = circ / wrapF;
          float gF = grainLayer(vec2((s - vt * d1 - D) / cellF + 11.3, (vTube.z * circ - vb * d1) / cyF + vFlow.y * 9.0), wrapF, 0.34, 0.95);
          g1 = max(g1, gF * smoothstep(0.3, 0.7, fw) * (1.0 - smoothstep(0.3, 0.8, fw / 2.7)) * inC * gGl); }
        vec3 gcol = uGrain * (0.3 + 0.5 * back);
        // the deep layer is seen through more honey: warmer and fainter; a thin bright lee follows each near grain
        // through-lit honey is bright enough for the tone curve to flatten a grain, so grains bite harder there
        float gk = 1.0 + 0.5 * smoothstep(0.45, 1.1, max(col.r, col.g));
        col = mix(col, gcol * 0.5 + col * 0.6, min(g2 * 0.36 * gk, 0.7));
        col = mix(col, gcol * 1.1 + col * 0.32, min(g1 * 0.5 * gk, 0.85));
        // bright motes ride with the near grains: specks of light caught in the stream
        // (a finer layer, three cells to each grain cell, long in the direction of the flow, quicker than the grains)
        float keep3 = 1.0 - smoothstep(0.1, 0.27, fw);
        vec2 u3 = vec2((s - vt * d1 * 0.5 - D * 1.25) / cell * 2.0 + 57.3, ((vTube.z * circ - vb * d1 * 0.5) / cy + vFlow.y * 17.0) * 3.0);
        float g3 = grainLayer(u3, wrap * 3.0, 0.22, 1.25) * keep3 * inC;
        col += (col * 1.6 + uSunCol * vec3(0.7, 0.5, 0.16)) * g3 * (0.5 + 0.5 * back * back + 0.25 * max(-dot(N, uSun), 0.0));
        // fine lengthwise flow lines and bubble strings
        float fl = sin(vTube.z * wrap * 5.0 + sin(s * 0.07 + vFlow.y * 40.0) * 3.0) * sin(s * 0.9 + vTube.z * 40.0);
        col *= 1.0 + (0.022 + 0.035 * smoothstep(2.5, 4.5, r0)) * fl * keep;
        // on the mains: lengthwise streaks whose beads run with the pulse, so the stream reads even along the tube
        float fzw = fwidth(vTube.z) * wrap * 3.0;
        float fl2 = sin(vTube.z * wrap * 18.85 + sin(s * 0.05 + vFlow.y * 9.0) * 2.0) * (0.55 + 0.45 * sin((s - D) * 0.35 + vTube.z * 18.85));
        col *= 1.0 + 0.06 * thickV * fl2 * (1.0 - smoothstep(0.15, 0.45, fzw));
        // a starving arm goes dull and brown as its flow leaves it; a feeler's swollen tip is young lemon growth
        float starve = step(2.0, vFlow.y) * step(vFlow.y, 3.0) * (1.0 - uBranch.x);
        col = mix(col, (col * 0.5 + uDark * 0.12) * vec3(1.0, 0.82, 0.7), starve * 0.75);
        float fat = step(3.0, vFlow.y) * step(vFlow.y, 4.0) * (uBranch.y - 1.0);          // the arm that takes the flow is the brightest amber there is
        col *= 1.0 + 0.3 * fat;
        float tipG = step(4.0, vFlow.y) * step(vFlow.y, 5.0) * exp(-max(uBranch.z - (s - 1000.0), 0.0) * 0.11);
        col = mix(col, uLemon * (0.75 + 0.5 * ndv), tipG * 0.8);
        // every strand carries a thread of light down its core whose beads run with the pulse
        float xrT = sqrt(max(1.0 - nvp * nvp, 0.0)), coreT = 1.0 - smoothstep(0.0, 0.5, xrT);
        float bead = 0.5 + 0.5 * sin((s - D) * (2.2 / max(r0, 0.5)) + 2.0 * sin(s * 0.11 + vFlow.y * 20.0));
        col *= 1.0 + coreT * coreT * (0.55 * bead * bead - 0.12) * smoothstep(33.0, 47.0, s) * (1.0 - smoothstep(0.5, 1.2, fwidth(s) / max(r0, 0.5)));
        // the pour: slow swells of light run down the three clear strands to the Knot
        float pp = 0.5 + 0.5 * sin((s - D) * 0.11); pp *= pp;
        col = col * (1.0 - 0.14 * pour + 0.42 * pour * pp) + uLemon * (pour * coreT * coreT * (0.04 + 0.4 * pp) * (0.7 + 0.5 * bead));
        col *= 1.0 + 0.28 * vBulge;                       // each travelling bulge gathers a little more light, so the flow reads from afar
        col = skin(col, N, V, ndv, 1.0);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

// ---- the Knot: a dimpled lens of clear honey; its inside is drawn analytically (no marching):
// twelve rope segments (six streams in, six out, meeting at stacked joints so they cross without
// mixing) are found by ray/segment closest approach, bubbles by three slices through a cell field ----
async function makeKnot(U, L, rng, ctx) {
  const g = new THREE.SphereGeometry(1, 96, 44);
  const p = g.attributes.position, v = new THREE.Vector3(), p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
  // where, which way and how steeply each of the twelve veins arrives
  const veins = L.strands.filter((s) => s.kind === 0).map((s) => {
    catPoint(s.a, s.b, s.sag, 1, p1); catPoint(s.a, s.b, s.sag, 0.93, p0);
    const dh = Math.max(Math.hypot(p0.x - p1.x, p0.z - p1.z), 1);
    return { bx: p1.x - KNOT.x, bz: p1.z - KNOT.z, dx: (p0.x - p1.x) / dh, dz: (p0.z - p1.z) / dh, slope: clamp((p0.y - p1.y) / dh, -0.4, 0.8), y: p1.y - KNOT.y, r: s.r };
  });
  const lobeA = new Float32Array(p.count);
  await ctx.yield();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const a = Math.atan2(v.x, v.z), eq = 1 - v.y * v.y, rim = eq * eq * eq;
    const rr = 1 - 0.07 * rim + 0.02 * Math.sin(a * 5 + 1.7) * rim;
    let x = v.x * rr * KNOT_R, z = v.z * rr * KNOT_R;
    const rho = Math.hypot(x, z), x0 = x, z0 = z;
    // webbed fillets: the rim is drawn out ALONG every vein into a sleeve that lets the vein out at its tip
    let lobe = 0, tBest = 0, lift = 0;
    for (const vn of veins) {
      const qx = x0 - vn.bx, qz = z0 - vn.bz, t = qx * vn.dx + qz * vn.dz, e = qx * vn.dz - qz * vn.dx;
      const w = Math.exp(-(e * e) / 24) * smoothstep(-10, 3, t);
      if (w < 0.003) continue;
      const push = 15 * w * rim, tt = Math.max(t, 0) + push;
      x += vn.dx * push; z += vn.dz * push;
      lift += w * (vn.y + vn.slope * tt);
      if (w > lobe) { lobe = w; tBest = tt; }
    }
    const belly = v.y < 0 ? 1.16 : 0.84 + 0.1 * Math.sin(a * 3 + 1) * eq;
    const y = v.y * belly * KNOT_T * (1 + 0.5 * lobe * rim) * lerp(1, clamp((21 - tBest) / 7, 0.05, 1), lobe * lobe) + lift * smoothstep(22, 33, rho);
    p.setXYZ(i, x, y, z);
    lobeA[i] = lobe * smoothstep(2, 12, tBest);
    if (i % 2400 === 2399) await ctx.yield();
  }
  await ctx.yield();
  g.setAttribute('aLobe', new THREE.BufferAttribute(lobeA, 1));
  g.computeVertexNormals();
  await ctx.yield();
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 60);
  // ropes: stream k comes in along segment 2k (fillet -> joint) and leaves along 2k+1 (joint -> fillet)
  const ropeA = [], ropeM = [], order = veins.map((a, i) => i);
  rng.shuffle(order);
  const tip = (vn, jit) => new THREE.Vector3(vn.bx + vn.dx * 11, vn.y + vn.slope * 11 + jit * 0.5, vn.bz + vn.dz * 11);
  for (let k = 0; k < 6; k++) {
    const v0 = veins[order[k * 2]], v1 = veins[order[k * 2 + 1]], ja = rng() * 6.28, jr = rng.range(2, 9);
    const M = new THREE.Vector4(Math.sin(ja) * jr, (k - 2.5) * 2.7 + rng.range(-0.6, 0.6), Math.cos(ja) * jr, k % 2 ? 1 : -1);
    ropeA.push(tip(v0, rng.range(-2, 2)), tip(v1, rng.range(-2, 2)));
    ropeM.push(M, new THREE.Vector4(M.x, M.y, M.z, -M.w));
  }
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uRopeA: { value: ropeA }, uRopeM: { value: ropeM }, uKnot: { value: KNOT.clone() }, uKS: { value: new THREE.Vector3(KNOT_R, KNOT_T, KNOT_R) } },
    vertexShader: /* glsl */`
      #define IS_VERTEX
      varying vec3 vN, vW, vL, vCam; varying float vLobe;
      attribute float aLobe;
      uniform vec3 uKnot;
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      void main(){
        float br = 1.0 + 0.018 * sin(3.14159265 * uPulseT / uPeriod);
        vec3 p = position * vec3(br, 2.0 - br, br);
        vL = p; vN = normal; vLobe = aLobe;
        vec3 w = p + uKnot; w += swayAt(uKnot) * 0.6; vW = w; vCam = camLocal();
        vec4 mvPosition = viewMatrix * (modelMatrix * vec4(w, 1.0));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: KNOT_FRAG,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return mesh;
}

const KNOT_FRAG = /* glsl */`
  varying vec3 vN, vW, vL, vCam; varying float vLobe;
  uniform vec3 uRopeA[12]; uniform vec4 uRopeM[12]; uniform vec3 uKS, uGrain;
  #include <fog_pars_fragment>
  ${GLSL_COMMON}
  ${GLSL_AMBER}
  float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1130, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
  void main(){
    vec3 V = normalize(vCam - vW), rd = -V, N = normalize(vN);
    // faint dimples in the skin (none on the fillets, which must meet the veins cleanly)
    vec3 q = vL * 0.42;
    vec3 dn = vec3(cos(q.x) * sin(q.z + 1.3), 0.6 * cos(q.y * 2.0 + q.x), cos(q.z) * sin(q.x * 1.1 + 0.4)) + 0.5 * vec3(cos(q.x * 2.7 + q.y), 0.0, cos(q.z * 2.3 - q.y));
    N = normalize(N + 0.07 * (1.0 - vLobe) * dn);
    // exit of the view ray from the lens (ellipsoid): thickness in metres
    vec3 o = vL / uKS, d = rd / uKS;
    float a = max(dot(d, d), 1e-6), b = dot(o, d), c = min(dot(o, o) - 1.0, 0.0);
    float thick = max((-b + sqrt(max(b * b - a * c, 0.0))) / a, 0.0);
    vec3 pc = o - d * (b / a); float dc = min(length(pc), 1.0);          // 0 where we look through the middle, 1 at the outline
    float heartS = 1.0 - smoothstep(0.08, 0.72, dc), rimS = smoothstep(0.5, 1.0, dc);
    float ndv = max(dot(N, V), 0.0), back = max(-dot(V, uSun), 0.0);
    // honey lit from inside: how far the sun has come through the lens to the place we are looking at
    vec3 P = vL + rd * min(thick * 0.5, 13.0);
    vec3 po = P / uKS, sd = uSun / uKS;
    float sa2 = max(dot(sd, sd), 1e-6), sb = dot(po, sd), sc = min(dot(po, po) - 1.0, 0.0);
    float tl = max((-sb + sqrt(max(sb * sb - sa2 * sc, 0.0))) / sa2, 0.0);
    float heS = clamp(2.9 + tl * 0.05, 2.9, 4.8);
    vec3 glow = uSunCol * exp(-heS * uAbs) * (0.7 + 0.45 * exp(-tl * 0.05));
    // and the sun seen straight through it when it stands behind
    vec3 trans = exp(-clamp(thick * 0.17, 3.2, 4.4) * uAbs);
    vec3 mid = vL + rd * min(thick * 0.5, 30.0) - uSun * 10.0;
    float heart = exp(-dot(mid, mid) / 760.0);
    float through = 0.5 + 0.5 * back;
    vec3 glowH = uSunCol * exp(-heS * (1.0 - 0.7 * heartS) * uAbs) * (0.7 + 0.45 * exp(-tl * 0.05));   // the heart is clear: far less colour in the way
    vec3 col = glowH * (0.22 + 0.5 * heart + 1.9 * heartS * heartS) + uLemon * (0.8 * heartS * heartS * heartS) + trans * (uSunCol * (0.45 * back * back + heart * (0.2 + 0.5 * back)) + envCol(normalize(rd - N * 0.5)) * 0.3);
    // ropes of grains: found by closest approach of the view ray to each stream's axis
    float D = pulseD(uPulseT), rope = 0.0, sheath = 0.0;
    for (int i = 0; i < 12; i++) {
      vec3 A = uRopeA[i], M = uRopeM[i].xyz; float sg = uRopeM[i].w, fi = float(i);
      vec3 e = M - A; float Ls = max(length(e), 1e-3); e /= Ls;
      vec3 w = vL - A; float be = dot(rd, e), dd = dot(rd, w), ee = dot(e, w), den = max(1.0 - be * be, 1e-3);
      float l = clamp((ee - be * dd) / den, 0.0, Ls);
      float t = clamp(dot(A + e * l - vL, rd), 0.0, thick);
      vec3 dv = vL + rd * t - (A + e * l);
      vec3 cr = cross(rd, e); cr = cr / max(length(cr), 1e-4);
      float side = dot(dv, cr), dist = length(dv), rw = 3.0 + 1.4 * l / Ls;
      // two interwoven strands per rope, grains streaming along it with the pulse
      float lf = l - sg * D * 0.45 + fi * 13.0, braid = 1.25 * sin(l * 0.36 + fi);
      float s1 = abs(side - braid), s2 = abs(side + braid);
      vec2 c1 = vec2(lf / 1.5, (side - braid) / 1.0), c2 = vec2((lf * 0.8 + 5.0) / 1.5, (side + braid) / 1.0 + 9.0);
      vec2 f1 = fract(c1) - 0.5, f2 = fract(c2) - 0.5; float r1 = h21(floor(c1) + 0.5), r2 = h21(floor(c2) + 2.5);
      float g1 = step(0.2, r1) * fall(0.12, 0.22 + 0.24 * r1, length(f1 + (vec2(r1, fract(r1 * 7.3)) - 0.5) * 0.3));
      float g2 = step(0.2, r2) * fall(0.12, 0.22 + 0.24 * r2, length(f2 + (vec2(r2, fract(r2 * 5.7)) - 0.5) * 0.3));
      float body = fall(0.3, 1.0, s1) * (0.74 + 0.26 * g1) + fall(0.3, 1.0, s2) * (0.6 + 0.3 * g2);     // two cords twisting round each other, grainy
      float seen = exp(-t * 0.022) * smoothstep(0.0, 1.5, thick - t + 0.5) * smoothstep(1.2, 5.5, t);   // inside the glass, never on its skin
      rope = max(rope, body * fall(rw * 0.45, rw, dist) * seen);
      sheath = max(sheath, fall(rw * 0.4, rw * 2.8, dist) * seen);
    }
    // each stream pipes light along itself: a gold sheath round the dark grains
    col += sqrt(trans) * uSunCol * sheath * (0.22 + 0.3 * back);
    col = mix(col, uGrain * (0.4 + 0.5 * back) + col * 0.13, clamp(rope * 1.5, 0.0, 1.0) * 0.92);
    // bubbles rising slowly: three slices through a field of cells
    float bub = 0.0;
    for (int i = 0; i < 3; i++) {
      float fi = float(i), dep = min(thick * (0.12 + 0.2 * fi), 4.0 + 9.0 * fi);
      vec3 pp = vL + rd * dep;
      pp.y -= uTime * (0.5 + 0.12 * fi); pp.x += 0.5 * sin(pp.y * 0.6 + fi);
      vec3 cid = floor(pp / 3.2), cf = fract(pp / 3.2) - 0.5;
      float hr = h31(cid + fi * 17.0);
      vec3 off = (vec3(hr, fract(hr * 13.7), fract(hr * 91.3)) - 0.5) * 0.5;
      float dq = length(cf - off), rad = 0.05 + 0.09 * fract(hr * 37.1);
      float ring = fall(rad * 0.6, rad, dq) * (0.35 + 0.65 * smoothstep(rad * 0.3, rad, dq));
      bub += step(0.55, hr) * ring * (1.0 - 0.25 * fi) * step(1.0, thick);
    }
    col += uLemon * bub * (0.35 + 0.8 * through) * 0.6 * (1.0 - vLobe);
    float e1 = 1.0 - ndv; col = mix(col, uDark * (0.42 + 0.4 * through), max(0.5 * e1 * e1 * e1 * e1, max(0.62 * (1.0 - smoothstep(3.0, 26.0, thick)), 0.72 * rimS)));
    // the fillets are shaded exactly as the veins they become
    gP = vW; gGl = 1.0;
    float nl, bl; vec3 hc = honey(N, V, 4.2, nl, bl);
    // ... and the lens itself wears the same honey skin, with a clear window into its lit inside where we look straight in
    float window = smoothstep(0.0, 0.16, ndv) * (1.0 - smoothstep(0.45, 1.0, vLobe));
    col = mix(hc, knee(col), window);
    col = skin(col, N, V, mix(max(ndv, 0.2), ndv, vLobe), 0.12);
    gl_FragColor = vec4(col, 1.0);
    #include <fog_fragment>
  }`;

// ---- reservoirs, collar beads, drips: where they hang (rng draws in fixed order) ----
async function layoutDrops(L, tubes, rng, detail, ctx) {
  const fly = L.fly, v = new THREE.Vector3(), res = [];
  const crowds = (r, top) => Math.hypot(r.top.x - top.x, r.top.z - top.z) < 13 && Math.abs(r.top.y - top.y) < 26;
  const ok = (top, scale) => {
    const c = v.set(top.x, top.y - 13.5 * scale, top.z);
    if (distToPolyline(c, fly) < 9.5 + 4.6 * scale) return false;
    if (c.distanceTo(L.seat) < 16 + 5 * scale) return false;
    if (Math.hypot(c.x - KNOT.x, c.z - KNOT.z) < KNOT_R + 9 && Math.abs(c.y - KNOT.y) < KNOT_T + 16) return false;
    for (const r of res) if (crowds(r, top)) return false;
    for (const sm of L.samples) { const dy = top.y - sm.p.y; if (dy > 4 && dy < 21 * scale && Math.hypot(sm.p.x - top.x, sm.p.z - top.z) < 5.2 * scale + sm.r) return false; }
    return true;
  };
  // the scripted drip hangs from a small bead on a strand thrown from tower to tower so that it passes
  // 13 m above and ~8 m beside the fly line, 120..210 m before the seat
  // ... beside the LINE, not beside its points. A drip falls plumb (its vertex shader moves y only), so all a drip can
  // ever fill, hanging or at any depth of its fall, is one upright column from its hanging point down to where its ball
  // is gone (125 m, the shader's own). No drip hangs where the fly line, on a stretch passing that column's heights,
  // comes nearer to it in plan than DRIP_CLEAR: 2 m of clear air between our line and the amber's skin + the sway of
  // what hangs (swayAt: 1 + 0.35 across, 0.25 along, weight 1 at most) + the widest a drip is ever drawn (the thread's
  // flare 0.2 * (1 + 2.5 + 1.6); the ball is 0.5) + how far the flown curve bows off the 15 m chords of this line's
  // 120 m arc (0.25: the arc's own 0.234 and what the spline adds). beside(): how near the line comes to a column, in
  // plan, at any clock
  const DRIP_CLEAR = 2 + Math.hypot(1 + 0.35, 0.25) + 0.2 * (1 + 2.5 + 1.6) + 0.25;
  const flyPlan = fly.map((p) => new THREE.Vector3(p.x, 0, p.z));
  const beside = (x, y, z) => {
    let b = 1e9;
    for (let i = 0; i < fly.length - 1; i++) {
      if (Math.min(fly[i].y, fly[i + 1].y) > y + DRIP_CLEAR || Math.max(fly[i].y, fly[i + 1].y) < y - 125 - DRIP_CLEAR) continue;
      b = Math.min(b, distToPolyline(v.set(x, 0, z), [flyPlan[i], flyPlan[i + 1]]));
    }
    return b;
  };
  let hero = null;
  const ck = Math.cosh(1.3), pa = new THREE.Vector3(), pb = new THREE.Vector3();
  search: for (const [ti, tj] of [[0, 4], [0, 5], [0, 3], [1, 3], [1, 4]]) for (const ya of [36, 50, 22]) for (const sp of [0.4, -0.2]) {
    const ta = L.towers[ti], tb = L.towers[tj];
    pa.copy(L.attach(ta, ya, tb.position, sp)); pb.copy(L.attach(tb, ya + 6, ta.position, -sp));
    await ctx.yield();
    for (let i = 8; i <= 52; i++) {
      const t = i / 60, x = lerp(pa.x, pb.x, t), z = lerp(pa.z, pb.z, t);
      let bk = -1, bd = 1e9;
      for (let k = 8; k <= 14; k++) { const fp = fly[fly.length - 1 - k]; if (!fp) continue; const d = Math.hypot(fp.x - x, fp.z - z); if (d < bd) { bd = d; bk = fly.length - 1 - k; } }
      if (bk < 0 || bd < 7 || bd > 9.5) continue;
      const c = (ck - Math.cosh(1.3 * (2 * t - 1))) / (ck - 1), sag = (lerp(pa.y, pb.y, t) - (fly[bk].y + 13)) / c;
      if (sag < 12 || sag > 80 || !L.clearOf(pa, pb, sag, 0.9, 9.5)) continue;
      hero = { A: { p: pa.clone(), s: 150 }, B: { p: pb.clone() }, sag, t, d: pa.distanceTo(pb) };
      break search;
    }
  }
  let heroTop = null;
  if (hero) {
    const { A, B, sag, d } = hero, seg = Math.max(8, Math.round(d / 4)), P = new Float32Array((seg + 1) * 3), R = new Float32Array(seg + 1), S = new Float32Array(seg + 1);
    for (let i = 0; i <= seg; i++) {
      const t = i / seg; catPoint(A.p, B.p, sag, t, v); P[i * 3] = v.x; P[i * 3 + 1] = v.y; P[i * 3 + 2] = v.z;
      R[i] = 0.9 * (1 + 1.1 * Math.exp(-t * d / 4) + 1.1 * Math.exp(-(1 - t) * d / 4)); S[i] = A.s + t * d;
    }
    tubes.push({ P, R, S, sides: 6, gain: 1, r0: 0.8, seed: rng(), ref: null });
    heroTop = catPoint(A.p, B.p, sag, hero.t, new THREE.Vector3());
    res.push({ top: heroTop.clone(), scale: 0.3, s: A.s + hero.t * d, sign: 1, seed: rng(), bead: false });
  }
  // 26 teardrop reservoirs
  for (let tries = 0; res.length < 26 + (hero ? 1 : 0) && tries < 3000; tries++) {
    const sm = L.samples[Math.floor(rng() * L.samples.length)], scale = rng.range(0.86, 1.12);
    if (sm.t < 0.1 || sm.t > 0.9) continue;
    if (tries % 20 === 19) await ctx.yield();
    const top = sm.p.clone(); top.y -= sm.r * 0.5;
    if (!ok(top, scale)) continue;
    res.push({ top, scale, s: sm.s, sign: res.length % 2 ? 1 : -1, seed: rng(), bead: false });
  }
  // where the place found stands nearer the line than DRIP_CLEAR, the bead slides along its strand, which stays as
  // thrown, to the nearest place that keeps it and keeps the reservoirs' own room (in quarters of the search's own step,
  // between the same ends of the strand). The reservoirs are dealt first, round the place found, so that each of them
  // and every draw stands as it did. No such place on the strand: the bead stays and carries no drip
  let dry = false;
  if (hero && beside(heroTop.x, heroTop.y - 20 * 0.3, heroTop.z) < DRIP_CLEAR) {
    const { A, B, sag, d } = hero, j0 = Math.round(hero.t * 240), bead = res[0], top = new THREE.Vector3();
    dry = true;
    slide: for (let n = 1; n <= 176; n++) for (const j of [j0 - n, j0 + n]) {
      if (j < 32 || j > 208) continue;
      const t = j / 240; catPoint(A.p, B.p, sag, t, top);
      if (beside(top.x, top.y - 20 * 0.3, top.z) < DRIP_CLEAR || res.some((r) => r !== bead && crowds(r, top))) continue;
      hero.t = t; heroTop.copy(top); bead.top.copy(top); bead.s = A.s + t * d; dry = false;
      break slide;
    }
  }
  // the reservoir the camera passes ~25 m to its left on the approach
  let swell = null, sb = 1e9;
  const tail = fly.slice(Math.max(0, fly.length - 12));
  for (const r of res) {
    if (r.scale < 0.5) continue;
    const c = v.set(r.top.x, r.top.y - 13.5 * r.scale, r.top.z), d = distToPolyline(c, tail);
    const left = (c.x - L.seat.x) * L.exit.z - (c.z - L.seat.z) * L.exit.x > 0 ? 0 : 30;
    const sc = Math.abs(d - 27) + left + 0.35 * Math.abs(c.y + 30);
    if (sc < sb) { sb = sc; swell = r; }
  }
  if (swell) swell.sign = 1;
  // small reservoirs beading the collar and its guys
  const { ax, ay } = L.ring, nB = Math.round(11 * (0.6 + 0.4 * detail));
  for (let k = 0; k < nB; k++) {
    const th = (k + rng.range(-0.25, 0.25)) / nB * Math.PI * 2, sc = rng.range(0.1, 0.17) * (Math.sin(th) < -0.3 ? 1.3 : 1);
    const top = L.seat.clone().addScaledVector(ax, Math.cos(th) * 9.6).addScaledVector(ay, Math.sin(th) * 9.6 - 0.6);
    res.push({ top, scale: sc, s: 60 + th * 9, sign: k % 2 ? 1 : -1, seed: rng(), bead: true });
  }
  for (const g of L.guys) {
    const t = rng.range(0.3, 0.7), d = g.a.distanceTo(g.b), top = catPoint(g.a, g.b, d * 0.05, t, new THREE.Vector3());
    if (distToPolyline(top, fly) > 13) res.push({ top, scale: rng.range(0.16, 0.26), s: 60 + t * d, sign: rng() < 0.5 ? 1 : -1, seed: rng(), bead: true });
    else { rng(); rng(); }
  }
  // drips: a pool hanging under the bigger reservoirs, plus the scripted one
  const drips = [], big = res.filter((r) => !r.bead && r.scale > 0.5), nD = Math.min(big.length, Math.round(12 * detail));
  if (heroTop) { const seed = rng(); if (!dry) drips.push({ p: new THREE.Vector3(heroTop.x, heroTop.y - 20 * 0.3, heroTop.z), K: 3, off: 0, seed, hero: 1 }); }
  const pickOrder = rng.shuffle(big.map((r, i) => i));
  // a pool drip whose column would not keep DRIP_CLEAR hangs instead under the next reservoir of the dealt order that does
  let spare = nD;
  for (let k = 0; k < nD; k++) {
    let r = big[pickOrder[k]];
    while (r && beside(r.top.x, r.top.y - 20 * r.scale, r.top.z) < DRIP_CLEAR) r = big[pickOrder[spare++]];
    const K = rng.int(3, 5), off = rng.int(0, 4), seed = rng();
    if (r) drips.push({ p: new THREE.Vector3(r.top.x, r.top.y - 20 * r.scale, r.top.z), K, off, seed, hero: 0, res: r });
  }
  if ((!heroTop || dry) && drips.length) {   // no tie could be thrown there: script the drip of the reservoir nearest the approach
    let bi = 0, bd = 1e9;
    drips.forEach((d, i) => { const dd = distToPolyline(d.p, tail); if (dd < bd) { bd = dd; bi = i; } });
    drips[bi].hero = 1; drips[bi].K = 3; drips[bi].off = 0;
  }
  return { res, drips, swell, heroDrip: drips.find((d) => d.hero) || null };
}

// ---- teardrops (reservoirs + collar beads) and drips: two instanced meshes, one shader family ----
function makeDropMaterial(U, drip) {
  return new THREE.ShaderMaterial({
    fog: true, defines: drip ? { DRIP: 1 } : {},
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: /* glsl */`
      #define IS_VERTEX
      attribute vec3 iPos; attribute vec4 iPar;
      varying vec3 vN, vW, vCam, vO; varying float vRad, vSeed, vTurn;
      #include <fog_pars_vertex>
      ${GLSL_COMMON}
      #ifdef DRIP
      attribute float aPart; uniform float uHeroT, uHeroOn;
      #endif
      void main(){
        vec3 p; vec3 n = normal;
        #ifdef DRIP
          float cyc = iPar.x * uPeriod;
          float tc = mod(uPulseT - uPeriod * 0.5 + iPar.y * uPeriod, cyc);
          float form = clamp((tc - (cyc - 6.0)) / 6.0, 0.0, 1.0), t = tc * (1.0 - step(cyc - 6.0, tc));
          if (iPar.w > 0.5 && uHeroOn > 0.5) { t = max(uHeroT, 0.0); form = clamp(1.0 + uHeroT / 6.0, 0.0, 1.0) * step(uHeroT, 0.0); }
          float fallen = 8.0 * (t - 3.5 * (1.0 - exp(-t / 3.5)));
          float y = mix(1.5 + fallen, 1.5 * form * form, step(0.001, form));
          float sz = mix(1.0 - smoothstep(95.0, 125.0, y), 0.25 + 0.75 * form, step(0.001, form));
          float snap = clamp(1.0 - (y - 12.0) / 4.0, 0.0, 1.0);
          float len = min(y, 12.0) * snap, vv = -position.y;
          float rr = 0.2 * (1.0 - 0.72 * min(y / 12.0, 1.0)) * snap * (1.0 + 2.5 * exp(-vv * len * 1.5) + 1.6 * exp(-(1.0 - vv) * len * 2.2));
          vec3 pt = vec3(position.x * rr, -vv * len, position.z * rr);
          float hang = 1.0 + 0.45 * snap * step(0.5, y) ;
          vec3 pd = position * vec3(sz, sz * hang, sz) - vec3(0.0, y, 0.0);
          p = mix(pt, pd, aPart);
          vRad = mix(rr, 0.5 * sz, aPart); vTurn = 0.0;
        #else
          float sn = sin(3.14159265 * (uPulseT - iPar.y / 400.0) / uPeriod) * iPar.w;
          float vv = -position.y / 20.0, wgt = smoothstep(0.08, 0.55, vv);
          float sw = 1.0 + 0.3 * sn * wgt;
          p = position * vec3(sw, 1.0 + 0.07 * sn, sw) * iPar.x;
          // a slow pendulum swing about the neck
          float sg = 0.03 * sin(uTime * 0.6 + iPar.z * 40.0);
          p.x += -p.y * sg; p.z += -p.y * 0.6 * 0.03 * sin(uTime * 0.47 + iPar.z * 23.0);
          vRad = length(position.xz) * sw * iPar.x; vTurn = pulseD(uPulseT - iPar.y / 400.0) * iPar.w;
        #endif
        vO = p; vN = n; vSeed = iPar.z;
        vec3 w = p + iPos + swayAt(iPos); vW = w; vCam = camLocal();
        vec4 mvPosition = viewMatrix * (modelMatrix * vec4(w, 1.0));
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vN, vW, vCam, vO; varying float vRad, vSeed, vTurn;
      uniform vec3 uGrain;
      #include <fog_pars_fragment>
      ${GLSL_COMMON}
      ${GLSL_AMBER}
      void main(){
        vec3 N = normalize(vN), V = normalize(vCam - vW);
        float ndv, back;
        gP = vW; gGl = 1.0;
        vec3 col = honey(N, V, max(vRad, 0.02), ndv, back);
        #ifndef DRIP
          // grains turning inside, two depths turning at different rates
          float zz = abs(vO.z) < 1e-4 ? 1e-4 : vO.z;
          float ang = atan(vO.x, zz) / 6.2832;
          float cell = clamp(vRad * 0.3, 0.2, 1.0);
          float keep = 1.0 - smoothstep(0.3, 0.8, (fwidth(vO.y) + fwidth(vO.x)) / cell);
          float g1 = grainLayer(vec2(vO.y / cell + vSeed * 31.0 + vTurn * 0.01, (ang + vTurn * 0.0045) * 26.0), 26.0, 0.8, 0.8);
          float g2 = grainLayer(vec2(vO.y / (cell * 1.6) + vSeed * 7.0, (ang - vTurn * 0.003 + 0.37) * 17.0), 17.0, 0.8, 0.9);
          float g3 = grainLayer(vec2(vO.y / cell * 2.0 + vSeed * 13.0 - vTurn * 0.016, (ang + vTurn * 0.007 + 0.61) * 52.0), 52.0, 0.5, 0.7) * (1.0 - smoothstep(0.12, 0.3, (fwidth(vO.y) + fwidth(vO.x)) / cell));
          g1 = mix(0.06, g1, keep); g2 = mix(0.06, g2, keep);
          vec3 gcol = uGrain * (0.3 + 0.5 * back);
          float inside = smoothstep(0.3, 1.2, vRad);
          col = mix(col, gcol + col * 0.4, g2 * 0.3 * inside);
          col = mix(col, gcol * 0.8 + col * 0.25, g1 * 0.5 * inside);
          float band = 0.5 + 0.5 * sin(ang * 37.7 + vO.y / cell * 0.8 + vTurn * 0.012 + vSeed * 40.0);
          col += (col * 0.7 + uSunCol * vec3(0.4, 0.26, 0.06)) * g3 * band * band * band * inside * smoothstep(0.15, 0.5, ndv) * (0.4 + 0.5 * back * back);     // bright motes turning with them
        #else
          col *= 1.2;
        #endif
        { float xe = 1.0 - ndv, aw = smoothstep(0.15, 0.85, -dot(N, uSun)); col += (col * 0.9 + uLemon * 0.3) * aw * xe * xe * (1.0 - xe * xe * xe); }   // the far edge takes the light
        col = skin(col, N, V, ndv, 1.0);
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
}

function makeDrops(U, drops, L) {
  // teardrop: pointed neck at y = 0, round belly, 20 m long and 8 m wide at scale 1
  const pts = [];
  for (let i = 0; i <= 13; i++) {
    const v = 1 - i / 13, th = v * Math.PI;
    const prof = Math.sin(th) * Math.pow(Math.sin(th / 2), 1.6) / 0.70;
    pts.push(new THREE.Vector2(i === 0 ? 0 : Math.max(prof * 4, 0.95 * (1 - v) * (1 - v) * (1 - v)), -20 * (1 - Math.cos(th)) / 2));
  }
  const tg = new THREE.LatheGeometry(pts, 20);
  const ig = new THREE.InstancedBufferGeometry();
  ig.index = tg.index; ig.setAttribute('position', tg.attributes.position); ig.setAttribute('normal', tg.attributes.normal);
  const n = drops.res.length, iPos = new Float32Array(n * 3), iPar = new Float32Array(n * 4);
  drops.res.forEach((r, i) => { iPos.set([r.top.x, r.top.y, r.top.z], i * 3); iPar.set([r.scale, r.s, r.seed, r.sign], i * 4); });
  ig.setAttribute('iPos', new THREE.InstancedBufferAttribute(iPos, 3)); ig.setAttribute('iPar', new THREE.InstancedBufferAttribute(iPar, 4));
  ig.instanceCount = n;
  const tear = new THREE.Mesh(ig, makeDropMaterial(U, false)); tear.frustumCulled = false;
  // drip: a unit thread (y 0..-1) plus a 1 m ball; the vertex shader stretches, snaps and drops it
  const m = drops.drips.length, pos = [], nor = [], part = [], idx = [];
  const TS = 6, TR = 10;
  for (let j = 0; j <= TR; j++) for (let i = 0; i <= TS; i++) { const a = (i / TS) * Math.PI * 2; pos.push(Math.cos(a), -j / TR, Math.sin(a)); nor.push(Math.cos(a), 0, Math.sin(a)); part.push(0); }
  for (let j = 0; j < TR; j++) for (let i = 0; i < TS; i++) { const a = j * (TS + 1) + i, b = a + TS + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const sph = new THREE.SphereGeometry(0.5, 16, 12), base = pos.length / 3;
  for (let i = 0; i < sph.attributes.position.count; i++) { pos.push(sph.attributes.position.getX(i), sph.attributes.position.getY(i), sph.attributes.position.getZ(i)); nor.push(sph.attributes.normal.getX(i), sph.attributes.normal.getY(i), sph.attributes.normal.getZ(i)); part.push(1); }
  for (let i = 0; i < sph.index.count; i++) idx.push(sph.index.getX(i) + base);
  sph.dispose();
  const dg = new THREE.InstancedBufferGeometry();
  dg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); dg.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); dg.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  dg.setIndex(idx);
  const dPos = new Float32Array(m * 3), dPar = new Float32Array(m * 4);
  drops.drips.forEach((d, i) => { dPos.set([d.p.x, d.p.y, d.p.z], i * 3); dPar.set([d.K, d.off, d.seed, d.hero], i * 4); });
  dg.setAttribute('iPos', new THREE.InstancedBufferAttribute(dPos, 3)); dg.setAttribute('iPar', new THREE.InstancedBufferAttribute(dPar, 4));
  dg.instanceCount = m;
  const dmat = makeDropMaterial(U, true);
  const drip = new THREE.Mesh(dg, dmat); drip.frustumCulled = false;
  return { tear, drip };
}

// ---- the six anchor towers: fluted, ledged limestone pinnacles with a buttress down into the gorge ----
async function makeTowers(L, pal, U, noise, ctx) {
  const NA = 60, NY = 36, per = (NA + 1) * (NY + 1), n = L.towers.length, sun = U.uSun.value;
  const pos = new Float32Array(per * n * 3), colr = new Float32Array(per * n * 3), rock = new Float32Array(per * n * 4), idx = new Uint32Array(NA * NY * 6 * n);
  // K8: what the per-pixel relief needs of each tower, beside aRock: its height, its flute phase (the build-time noise
  // in it cannot be repeated in a shader, so the phase itself is handed over), its radius, and its own four ledge heights
  const tow = new Float32Array(per * n * 3), ledg = new Float32Array(per * n * 4);
  const stone = new THREE.Color(pal[0]).multiplyScalar(0.72), shade = new THREE.Color(pal[1]), moss = new THREE.Color(pal[6]), ivory = new THREE.Color('#F3E9D2').multiplyScalar(0.8);
  const c = new THREE.Color();
  let io = 0;
  for (let ti = 0; ti < n; ti++) {
    const tw = L.towers[ti], H = tw.height, sd = tw.seed;
    const base = ti * per, y0 = -78;
    for (let j = 0; j <= NY; j++) {
      // rows bunch up toward the cap
      const f = j / NY, y = f < 0.28 ? lerp(y0, 0, f / 0.28) : lerp(0, H, Math.pow((f - 0.28) / 0.72, 0.9));
      for (let i = 0; i <= NA; i++) {
        const a = (i / NA) * Math.PI * 2, ca = Math.sin(a), sa = Math.cos(a);
        const rr = towerR(tw, a, y, noise), groove = TS.groove, cap = TS.cap, h = TS.h;
        const q = base + j * (NA + 1) + i, k = q * 3;
        pos[k] = tw.position.x + ca * rr; pos[k + 1] = y + noise.n2(ca * 4 + sd, sa * 4) * 1.2 * cap; pos[k + 2] = tw.position.z + sa * rr;
        // colour: ivory cap and ledge tops, blue-grey grooves, rain streaks, moss away from the sun and low down
        const streak = 0.5 + 0.5 * noise.n2(a * 9 + sd * 3, y * 0.03);
        c.copy(stone).multiplyScalar(0.84 + 0.22 * groove + 0.12 * (streak - 0.5));
        c.lerp(shade, 0.2 * (1 - groove) + 0.1 * smoothstep(0, -60, y));
        c.lerp(ivory, 0.5 * cap + 0.25 * smoothstep(0.6, 1, h) * groove);
        const away = clamp(-(ca * sun.x + sa * sun.z), 0, 1);
        const m = smoothstep(0.15, 0.6, noise.n3(ca * 2.2 + sd, y * 0.06, sa * 2.2) + 0.5 * away - 0.25 * h) * 0.5;
        c.lerp(moss, m * 0.8);
        colr[k] = c.r; colr[k + 1] = c.g; colr[k + 2] = c.b;
        rock[q * 4] = groove; rock[q * 4 + 1] = cap; rock[q * 4 + 2] = a; rock[q * 4 + 3] = sd;
        tow[k] = H; tow[k + 1] = a * tw.flutes * 0.5 + noise.n2(ca * 2 + sd, y * 0.02) * 0.9; tow[k + 2] = tw.radius;     // the phase as towerR has it
        ledg[q * 4] = tw.ledges[0]; ledg[q * 4 + 1] = tw.ledges[1]; ledg[q * 4 + 2] = tw.ledges[2]; ledg[q * 4 + 3] = tw.ledges[3];
      }
      if (j % 8 === 7) await ctx.yield();
    }
    for (let j = 0; j < NY; j++) for (let i = 0; i < NA; i++) {
      const a = base + j * (NA + 1) + i, b = a + NA + 1;
      idx[io++] = a; idx[io++] = a + 1; idx[io++] = b; idx[io++] = b; idx[io++] = a + 1; idx[io++] = b + 1;
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3));
  g.setAttribute('aRock', new THREE.BufferAttribute(rock, 4));
  g.setAttribute('aTow', new THREE.BufferAttribute(tow, 3)); g.setAttribute('aLedge', new THREE.BufferAttribute(ledg, 4));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  await ctx.yield();
  g.computeVertexNormals();
  await ctx.yield();
  // self-shaded limestone: one raking key for the ivory caps, sky fill so every shade is blue, never grey
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uSun: U.uSun, uSunCol: U.uSunCol, uSky: U.uSky, uShade: U.uShade },
    vertexShader: /* glsl */`
      attribute vec3 color; attribute vec4 aRock;
      varying vec3 vN, vCol, vP; varying vec4 vRock;
      attribute vec3 aTow; attribute vec4 aLedge; varying vec3 vTow; varying vec4 vLedge;
      #include <fog_pars_vertex>
      void main(){
        vN = normal; vCol = color; vP = position; vRock = aRock;
        vTow = aTow; vLedge = aLedge;
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      varying vec3 vN, vCol, vP; varying vec4 vRock;
      varying vec3 vTow; varying vec4 vLedge;
      uniform vec3 uSun, uSunCol, uSky, uShade;
      #include <fog_pars_fragment>
      void main(){
        vec3 N = normalize(vN);
        float ridge = vRock.x, cap = vRock.y;
        // fine solution grooves (an angular function, faded before they alias) and faint bedding
        float ph = vRock.z * 46.0 + sin(vP.y * 0.11 + vRock.w) * 1.4, fw = fwidth(ph);
        float fine = mix(0.6, abs(sin(ph)), 1.0 - smoothstep(0.2, 0.7, fw));
        float bed = sin(vP.y * 0.41 + sin(vRock.z * 3.0 + vRock.w) * 2.0 + sin(vP.y * 0.13) * 3.0);
        vec3 alb = vCol * (0.88 + 0.16 * fine * (1.0 - 0.6 * cap) + 0.04 * bed);
        float ao = 0.62 + 0.38 * ridge;
        // K8: THE STONE'S RELIEF PER PIXEL, the same rule as on the world's lattice towers, written from this tower's own
        // height, radius, four ledge heights and flute phase (vTow, vLedge). It goes into the fill's occlusion and the
        // shading normal only; it reads no camera and no distance, and fades only by its own width on the screen.
        {
          float tH = max(vTow.x, 1.0), fa = vTow.y, ta = vRock.z, tsd = vRock.w;
          // the flute's knife ridge, cut per pixel from the interpolated phase: live's occlusion (the line above) is
          // taken from the pixel's own groove value in place of the one interpolated between the mesh's columns; no
          // second occlusion is laid over it. Finer than a pixel it is live's again.
          float flP = abs(sin(fa)), grooveP = (1.0 - flP) * (1.0 - flP), rKeep = 1.0 - smoothstep(0.2, 0.7, fwidth(fa));
          float rAo = mix(1.0, (0.62 + 0.38 * grooveP) / (0.62 + 0.38 * clamp(ridge, 0.0, 1.0)), rKeep);
          // ridges and runnels turn the normal round the tower, by the tilts the lattice towers carry (the same stone)
          float gKeep = 1.0 - smoothstep(0.2, 0.7, fw);
          vec3 tang = vec3(cos(ta), 0.0, -sin(ta));
          vec3 Nr = N + tang * (0.5 * cos(fa) * sign(sin(fa)) * rKeep + 0.22 * cos(ph) * sign(sin(ph)) * gKeep) * (1.0 - cap);
          // fine solution grooves: nil on the knife ridge (sin(ph) = 0), only in the runnel at the bottom (abs(sin(ph))
          // to the 32nd, an eighth of the groove wide); depth 0.22 as on the lattice towers; its mean where finer than a pixel
          float gS = sin(ph); gS *= gS; gS *= gS; gS *= gS; gS *= gS; gS *= gS;
          rAo *= 1.0 - 0.22 * (1.0 - 0.6 * cap) * mix(0.14, gS, gKeep);
          // the four ledges at this tower's own heights (towerR): under each lip the rock swells out by 0.09 of the radius
          // over 0.035 - 0.004 of the height and stands in the lip's shade; at the lip it steps back by 0.12 of the radius
          float crown = 0.5 + 0.5 * sin(ta * 2.0 + tsd) * cos(ta * 3.0 - tsd * 1.7);
          float h0 = clamp(vP.y / tH, 0.0, 1.0), h = clamp(h0 + 0.17 * crown * smoothstep(0.45, 0.95, h0), 0.0, 1.0);
          float fwh = fwidth(h), rel = vTow.z / tH, lipW = 0.035 - 0.004;
          float topW = max(0.25 * 0.12 * rel, 1e-4);          // a shelf falls outward at one in four: its top is a band a quarter of its depth tall
          float under = 0.0, tilt = 0.0, top = 0.0;
          for (int k = 0; k < 4; k++) {
            float lg = vLedge[k] + 0.025 * sin(ta * 2.0 + float(k) * 2.1 + tsd);
            float below = clamp((lg - h) / max(fwh, 1e-5) + 0.5, 0.0, 1.0);
            float tt = clamp((h - (lg - 0.035)) / lipW, 0.0, 1.0);
            under = max(under, tt * tt * (3.0 - 2.0 * tt) * below);
            tilt = max(tilt, 6.0 * tt * (1.0 - tt) * below);
            top = max(top, (1.0 - below) * (1.0 - smoothstep(0.0, topW, h - lg)));
          }
          float lKeep = (1.0 - smoothstep(0.3, 1.0, fwh / lipW)) * (1.0 - cap), tKeep = (1.0 - smoothstep(0.3, 1.0, fwh / topW)) * (1.0 - cap);
          rAo *= 1.0 - 0.25 * under * lKeep;                   // under a lip a quarter of the sky fill goes, as on the lattice towers
          Nr.y -= min(0.09 * rel / lipW * tilt, 2.0) * lKeep;
          Nr = Nr / max(length(Nr), 1e-4);
          Nr = mix(Nr, vec3(0.0, 1.0, 0.0), top * tKeep);
          N = Nr / max(length(Nr), 1e-4); ao *= rAo;
        }
        // the gorge below the lip never sees the low sun
        float sunVis = 0.12 + 0.88 * smoothstep(-26.0, 4.0, vP.y);
        float ndl = max(dot(N, uSun), 0.0);
        vec3 fill = mix(uShade * 1.5 + vec3(0.17, 0.17, 0.21), uSky * vec3(0.62, 0.62, 0.76) + vec3(0.1, 0.1, 0.13), 0.5 + 0.5 * N.y) * ao;
        vec3 col = alb * (fill + uSunCol * vec3(0.84, 0.78, 0.62) * ndl * sunVis * (0.8 + 0.2 * ridge));
        gl_FragColor = vec4(col, 1.0);
        #include <fog_fragment>
      }`,
  });
  return new THREE.Mesh(g, mat);
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, noise = ctx.noise;
  const pal = Array.isArray(opts.palette) && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const period = opts.period ?? 8, duration = opts.duration ?? 46;

  const L = await layout(rng, detail, noise, ctx);
  await ctx.yield();
  const tubes = await makeTubes(L, rng, detail, noise, ctx);
  await ctx.yield();
  const drops = await layoutDrops(L, tubes, rng, detail, ctx);
  await ctx.yield();

  // sun: 15 deg up, 50 deg left of the exit heading (left of +Z is +X)
  const sa = THREE.MathUtils.degToRad(50) - L.head, se = THREE.MathUtils.degToRad(15);
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(Math.sin(sa) * Math.cos(se), Math.sin(se), Math.cos(sa) * Math.cos(se))).normalize();
  // absorption per metre from the palette's amber (so a garnet or citrine palette re-tints the glass), with a little per-seed drift
  const amb = new THREE.Color(pal[2]), drift = rng.range(0.92, 1.1);
  const abs = new THREE.Vector3(-Math.log(Math.max(amb.r, 0.004)), -Math.log(Math.max(amb.g, 0.004)) * drift, -Math.log(Math.max(amb.b, 0.004)) * 1.15).multiplyScalar(0.25);
  abs.x = Math.max(abs.x, 0.012);
  const U = makeUniforms(pal, {
    period, abs, seat: L.seat.clone(), sunDir, sunColor: opts.sunColor ?? '#FFE7C2',
    skyColor: opts.skyColor ?? pal[5], shadeColor: opts.shadeColor ?? '#4F6690',
  });

  const object = new THREE.Group();
  object.name = 'amber-reticulum:crossing';
  const tubeGeo = await meshTubes(tubes, ctx);
  const net = new THREE.Mesh(tubeGeo, makeTubeMaterial(U));
  net.frustumCulled = false;
  object.add(net);
  await ctx.yield();
  await ctx.yield();
  const knot = await makeKnot(U, L, rng, ctx);
  object.add(knot);
  await ctx.yield();
  const { tear, drip } = makeDrops(U, drops, L);
  object.add(tear, drip);
  await ctx.yield();
  if (opts.towers !== false) object.add(await makeTowers(L, pal, U, noise, ctx));
  await ctx.yield();

  // perches for the brief's 14 birds: tops of strands near the approach, well apart
  const perches = [], tail = L.fly.slice(Math.max(0, L.fly.length - 12));
  for (const sm of L.samples) {
    if (perches.length >= 14) break;
    const d = distToPolyline(sm.p, tail);
    if (d < 13 || d > 70 || sm.p.y < -75) continue;
    if (perches.some((q) => q.position.distanceTo(sm.p) < 9)) continue;
    perches.push({ position: new THREE.Vector3(sm.p.x, sm.p.y + sm.r, sm.p.z) });
  }
  const fl = L.fly, mid = fl[Math.min(4, fl.length - 1)];
  const anchors = {
    knot: KNOT.clone(), knotRadius: KNOT_R, knotThickness: KNOT_T * 2,
    portalSeat: { position: L.seat.clone(), normal: L.exit.clone().multiplyScalar(-1), radius: 7 },
    flyThrough: fl.map((p) => p.clone()), exitHeading: L.exit.clone(),
    viewpoints: {
      sideOn: new THREE.Vector3(mid.x + 60, mid.y + 6, mid.z - 10),
      underKnot: new THREE.Vector3(-30, -88, -70),
      approach: fl[Math.max(0, fl.length - 7)].clone(),
    },
    towers: L.towers.map((t) => ({ position: t.position.clone(), radius: t.radius, height: t.height, lip: t.lip })),
    lipVein: new THREE.Vector3(L.towers[0].position.x + 6, 2, -LIP - 6),
    reservoirs: drops.res.filter((r) => !r.bead && r.scale > 0.5).map((r) => new THREE.Vector3(r.top.x, r.top.y - 13.5 * r.scale, r.top.z)),
    perches,
    heroDrip: drops.heroDrip ? drops.heroDrip.p.clone() : null,
    swellReservoir: drops.swell ? new THREE.Vector3(drops.swell.top.x, drops.swell.top.y - 13.5 * drops.swell.scale, drops.swell.top.z) : null,
    sunDir: sunDir.clone(),
    strandSamples: L.samples.map((sm) => ({ p: sm.p.clone(), r: sm.r })),   // points along every strand, for the world's own additions
  };

  let pulseOverride = null;
  const pulse = (t) => 70 * Math.sin(Math.PI * t / period) + 1.5 * t;
  return {
    object, radius: 215, height: 175, center: new THREE.Vector3(0, -22, 0), anchors,
    ground: true, groundY: -200,
    pulse,
    veinKit: { meshTubes, material: net.material, uniforms: U, glsl: GLSL_AMBER },   // glsl: the honey-glass shading functions, for the world's own teardrop
    setPulseTime(t) { pulseOverride = t; },
    setProgress(u) { U.uHeroOn.value = 1; U.uHeroT.value = (u - 0.83) * duration; },
    setSun(dir, colorHex) { U.uSun.value.copy(dir).normalize(); if (colorHex) U.uSunCol.value.set(colorHex).multiplyScalar(1.1); },
    update(dt, time /* , camera */) {
      U.uTime.value = time;
      U.uPulseT.value = pulseOverride ?? time;
    },
    dispose() {},
  };
}
