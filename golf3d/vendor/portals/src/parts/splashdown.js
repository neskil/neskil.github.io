// SPLASHDOWN: hero set piece "The capsule and what it wears" (everything procedural; imports only three and kit/core).
//
// WHAT     A returning capsule (blunt cone, 4 m heat shield, 3 m tall) and everything it wears during the flight:
//          FIRE   a shock cap under the shield, a sheath pouring back past the wall, and a 300 m wake of nine braided
//                 streamers (magenta, violet, orange) round a dark core, with sparks and thruster bursts that kink it;
//          CLOTH  a bay cover that blows off, two ribbon drogues, three pilot chutes and three 35 m ringsail mains
//                 (48 gores x 10 rings of separate sails with real slots, a vent, tapes, scalloped skirt) that open in
//                 three steps (tube, lampshade, full bloom with overshoot and a ripple up the gores) on 144 lines that
//                 hang slack, crack straight and throw frost puffs. Sun shining through the cloth makes it a lantern.
// FRAME    Origin = centre of the heat shield's lowest point, +Y = capsule axis (apex up), front = +Z (the side that
//          carries the camera pod). The parachute cluster leans opts.lean (35 deg) off +Y toward -Z, i.e. away from the
//          pod and into its gaze. The WAKE LEANS THE SAME WAY (the capsule flies at an angle of attack) and bends so
//          that its dark core lies exactly on the pod's line of sight: from mounts.along the fire is a ring round a
//          black eye, dead centre. Bounding radius ~45 m and height ~78 m with the mains open (radius/height below
//          are a little smaller so the orbit viewer frames the cluster); the wake is 300 m long but is gone before
//          the cloth appears. The capsule itself is 2 m in radius and 3.1 m tall.
// OPTS     palette   7 hex strings in the brief's order: [space black, violet, magenta, rose, gold, slate blue, orange]
//          lean      (35) degrees the cluster axis leans off the capsule axis toward -Z
//          spread    (22) degrees each main's axis diverges from the cluster axis
//          restTime  (21) flight second shown until setProgress / setFlightTime is first called ("the image")
//          demo      (false) true = play the 40 s flight on a loop from the clock (for looking at the piece alone)
//          lagThird  (seeded, 10%) the rare event: the third main stays a streamer and bangs open at 22.6 s
//          lagAt     (22.6) flight second of that late opening (the world moves it inside its held image)
//          skin      'tile' | 'foil' | 'gumdrop' (seeded)      pattern  'blocks' | 'quarters' | 'onegore' (seeded)
//          pod       (true) draw the camera pod on the +Z wall (hero.pod.visible = false hides it when the lens IS it)
//          sunDir    Vector3 toward the sun, WORLD space (default low on the left behind the canopies)
//          gloss     (1) gain on the mirror gloss of the foil and gumdrop skins (the world lowers it at night)
// PROGRESS hero.setProgress(u)      u = 0..1 along the brief's 40 s take; everything scripted hangs off this:
//                                   0-6.2 s fire, 6.2-7 s the braid frays and tears off, lip cools 7-13 s, 15.0 s cover and
//                                   drogues, 16.2 s mains drawn out as ropes, 16.6 / 17.6 / 18.6 s the three steps,
//                                   overshoot 18.85 s, ripple and settle by 19.8 s, then breathing every 2.4 s.
//          hero.setFlightTime(T, time)  the same in seconds (give it the frame's clock too and update() will not pose the
//                                   piece a second time).  Ambient motion (flow, flutter, breathing) runs off `time`.
//          hero.state               read after setProgress: { T, fire, lip, flash (0..1 pyro flash, eased), jolt (0..1
//                                   impulse that decays after each of the five jolts: use it to kick the camera),
//                                   stage: [3 numbers 0 rope .. 1 tube .. 2 lampshade .. 3 full .. 4 overshoot],
//                                   thruster: [left, right] 0..1 }
//          hero.setSun(dirWorld, linearColor)   hero.setAmbient(skyLinear, bounceLinear)   hero.setWet(0..1: the lip goes dark, glossy and beaded)
//          hero.bursts              [{ t, side, amp }] the seeded thruster bursts (flight seconds, side -1 left / +1 right)
//          hero.setLean(deg)        re-aim the cluster and the wake (anchors follow).   hero.canopyWorld(i, out) -> current centre of main i (world).
// ANCHORS  (local space)
//          mounts.along    { position, target, up }: lens 0.75 m off the +Z wall, gaze parallel to the cluster / wake
//                          axis: the tile road and the apex bay are the lower quarter of the frame, the wake's eye or
//                          the cluster is dead centre (acts one and three).
//          mounts.outward  { position, target, up }: lens 0.3 m off the wall above the shield's shelf, looking out and
//                          45 deg down; the charred lip is the bottom 14% of the frame (acts two and four). Hide the
//                          pod (hero.pod.visible = false) whenever the camera sits on a mount.
//          mounts.image    { position, target, up }: as `along` with the gaze eased down for the held image.
//          apex, confluence (where all 144 lines meet, 8 m off the apex), clusterAxis, wakeAxis, wakeEnd,
//          crowns[3], canopyCenters[3] (open state), drogues[2], thrusters[2], window
//          portalSeat      { position, normal, radius }: on the capsule axis 12 m under the shield, facing up at it: the
//                          capsule falls shield first, so the portal lies flat below (the world seats it on the sea).
//          flyThrough      an outside pass, 6 m+ clear of cloth and lines: in from the front, under the left main's
//                          skirt, round behind the cluster. viewpoints [{ position, target }] composed stills.
// LIGHTING Self-lit shaders: scene lights are NOT read. Sun (setSun) is a low warm key, default 1.25 x #FFD9A0; shadow
//          sides get blue-violet skyshine (setAmbient). Cloth transmits the sun (lantern glow capped near 1.6); plasma
//          radiance stays under 3. During fire the sun and sky are dimmed to 12% so the capsule is lit by plasma only.
//          Scene fog is honoured by every opaque part; the additive plasma fades itself. Wants bloom threshold ~0.9.
//          hero.uniforms.plasma.uTail (0.07) = brightness of the far wake: raise it toward 0.6 for an outside view of a
//          long comet tail, keep it low from the pod so the core stays black. uniforms.shared.uGlow = cloth lantern gain.
// COST     ~95k triangles in all, never more than ~60k drawn at once (fire and cloth are never up together),
//          19-25 draw calls, 100-250 ms build, one half-float 64x6 profile texture, no lights.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const DEFAULT_PALETTE = ['#05060D', '#6B3FD0', '#E8409A', '#F2A0A8', '#F6C27A', '#27406B', '#FF6A1F'];
const TAU = Math.PI * 2, DEG = Math.PI / 180;
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

// capsule dimensions (metres)
const WALL_A = 29.87 * DEG, WALL_CA = Math.cos(WALL_A), WALL_SA = Math.sin(WALL_A);   // elevation of the wall's outward normal
const WB = [1.84, 0.667], WALL_LEN = 2.373, WT = [WB[0] - WALL_SA * WALL_LEN, WB[1] + WALL_CA * WALL_LEN];
const APEX_Y = 3.0;
// material codes (aData.x)
const M_CHAR = 0, M_BASE = 1, M_TILE = 2, M_METAL = 3, M_GLASS = 4, M_NOZZLE = 5, M_TAPE = 6, M_STRAP = 7, M_DARK = 8;

// ---------------------------------------------------------------- geometry accumulator
class Geo {
  constructor() { this.P = []; this.N = []; this.C = []; this.U = []; this.D = []; this.I = []; this.n = 0; this.m = new THREE.Matrix4(); this.s = { m: 0, c: [1, 1, 1], rnd: 0, f: 0, g: 0 }; }
  style(m, c, rnd = 0, f = 0, g = 0) { this.s = { m, c, rnd, f, g }; return this; }
  v(x, y, z, nx, ny, nz, u = 0, w = 0, f = null) {
    const e = this.m.elements, s = this.s;
    this.P.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
    const ax = e[0] * nx + e[4] * ny + e[8] * nz, ay = e[1] * nx + e[5] * ny + e[9] * nz, az = e[2] * nx + e[6] * ny + e[10] * nz, l = Math.hypot(ax, ay, az) || 1;
    this.N.push(ax / l, ay / l, az / l); this.C.push(s.c[0], s.c[1], s.c[2]); this.U.push(u, w); this.D.push(s.m, s.rnd, f === null ? s.f : f, s.g);
    return this.n++;
  }
  quad(a, b, c, d) { this.I.push(a, b, c, a, c, d); }
  get tris() { return this.I.length / 3; }
  // surface of revolution about the local Z axis. prof: [[r, z], ...] walked so the outside is on the right
  // (normal = (dz, -dr)). smooth: average normals along the profile. styles: optional per-edge function.
  lathe(prof, segs, o = {}) {
    const n = prof.length, en = [];
    for (let i = 0; i < n - 1; i++) { const dr = prof[i + 1][0] - prof[i][0], dz = prof[i + 1][1] - prof[i][1], l = Math.hypot(dr, dz) || 1; en.push([dz / l, -dr / l]); }
    let len = 0;
    for (let i = 0; i < n - 1; i++) {
      if (o.styles) o.styles(i, this);
      const seg = Math.hypot(prof[i + 1][0] - prof[i][0], prof[i + 1][1] - prof[i][1]);
      const na = o.smooth && i > 0 ? [en[i][0] + en[i - 1][0], en[i][1] + en[i - 1][1]] : en[i];
      const nb = o.smooth && i < n - 2 ? [en[i][0] + en[i + 1][0], en[i][1] + en[i + 1][1]] : en[i];
      const base = this.n;
      for (let j = 0; j <= segs; j++) {
        const a = (o.a0 || 0) + ((o.a1 ?? TAU) - (o.a0 || 0)) * (j / segs), ca = Math.cos(a), sa = Math.sin(a);
        this.v(prof[i][0] * ca, prof[i][0] * sa, prof[i][1], na[0] * ca, na[0] * sa, na[1], j / segs, len);
        this.v(prof[i + 1][0] * ca, prof[i + 1][0] * sa, prof[i + 1][1], nb[0] * ca, nb[0] * sa, nb[1], j / segs, len + seg);
      }
      for (let j = 0; j < segs; j++) { const k = base + j * 2; this.quad(k, k + 2, k + 3, k + 1); }
      len += seg;
    }
    return this;
  }
  // box on the local XY plane, z from 0 to d, top edges bevelled by b
  bevelBox(w, h, d, b) {
    const x = w / 2, y = h / 2, X = x - b, Y = y - b, zb = d - b;
    const ring = (px, py, z) => [[-px, -py, z], [px, -py, z], [px, py, z], [-px, py, z]];
    const r0 = ring(x, y, 0), r1 = ring(x, y, zb), r2 = ring(X, Y, d), nrm = [[0, -1, 0], [1, 0, 0], [0, 1, 0], [-1, 0, 0]];
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4, nn = nrm[i];
      let a = this.v(...r0[i], ...nn, 0, 0), bb = this.v(...r0[j], ...nn, 1, 0), c = this.v(...r1[j], ...nn, 1, 0.8), e = this.v(...r1[i], ...nn, 0, 0.8); this.quad(a, bb, c, e);
      const bn = [nn[0] * 0.7, nn[1] * 0.7, 0.7];
      a = this.v(...r1[i], ...bn, 0, 0.8, 1); bb = this.v(...r1[j], ...bn, 1, 0.8, 1); c = this.v(...r2[j], ...bn, 1, 1, 1); e = this.v(...r2[i], ...bn, 0, 1, 1); this.quad(a, bb, c, e);
    }
    const t = r2.map((p, i) => this.v(...p, 0, 0, 1, i === 1 || i === 2 ? 1 : 0, i > 1 ? 1 : 0)); this.quad(t[0], t[1], t[2], t[3]);
    return this;
  }
  // round tube through points (array of Vector3), sides >= 3
  tube(pts, r, sides = 6) {
    const up = V3(0.31, 0.9, 0.3).normalize(), t = V3(), a = V3(), b = V3(), base = this.n;
    for (let i = 0; i < pts.length; i++) {
      t.copy(pts[Math.min(i + 1, pts.length - 1)]).sub(pts[Math.max(i - 1, 0)]).normalize();
      a.crossVectors(t, up).normalize(); b.crossVectors(t, a);
      for (let j = 0; j <= sides; j++) {
        const an = (j / sides) * TAU, c = Math.cos(an), s = Math.sin(an), nx = a.x * c + b.x * s, ny = a.y * c + b.y * s, nz = a.z * c + b.z * s;
        this.v(pts[i].x + nx * r, pts[i].y + ny * r, pts[i].z + nz * r, nx, ny, nz, j / sides, i / (pts.length - 1));
      }
    }
    for (let i = 0; i < pts.length - 1; i++) for (let j = 0; j < sides; j++) { const k = base + i * (sides + 1) + j; this.quad(k, k + 1, k + sides + 2, k + sides + 1); }
    return this;
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2));
    g.setAttribute('aData', new THREE.Float32BufferAttribute(this.D, 4));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.I, 1) : new THREE.Uint16BufferAttribute(this.I, 1));
    g.computeBoundingSphere();
    return g;
  }
}

// point, outward normal and frame on the conical wall: phi = azimuth from +Z toward +X, t = 0 (shoulder) .. 1 (collar)
function wallPoint(phi, t, off = 0, out = V3()) {
  const r = lerp(WB[0], WT[0], t) + WALL_CA * off, y = lerp(WB[1], WT[1], t) + WALL_SA * off;
  return out.set(r * Math.sin(phi), y, r * Math.cos(phi));
}
function wallFrame(phi, t, off = 0, spin = 0) {
  const s = Math.sin(phi), c = Math.cos(phi), m = new THREE.Matrix4();
  m.makeBasis(V3(c, 0, -s), V3(-WALL_SA * s, WALL_CA, -WALL_SA * c), V3(WALL_CA * s, WALL_SA, WALL_CA * c));
  if (spin) m.multiply(new THREE.Matrix4().makeRotationZ(spin));
  return m.setPosition(wallPoint(phi, t, off));
}

// ---------------------------------------------------------------- the capsule
function buildCapsule(rng, skin, detail) {
  const G = new Geo(), cover = new Geo(), pod = new Geo();
  const yUp = new THREE.Matrix4().makeRotationX(-Math.PI / 2);          // lathe axis Z -> capsule axis Y
  const tan = skin === 'foil' ? [0.52, 0.53, 0.56] : skin === 'gumdrop' ? [0.06, 0.062, 0.075] : [0.50, 0.37, 0.24];
  const pale = skin === 'foil' ? [0.60, 0.58, 0.50] : skin === 'gumdrop' ? [0.11, 0.11, 0.125] : [0.62, 0.60, 0.56];
  const skinF = skin === 'foil' ? 1 : skin === 'gumdrop' ? 2 : 0;
  const metal = [0.30, 0.31, 0.34], dark = [0.035, 0.034, 0.04], char = [0.105, 0.085, 0.078];
  const SEG = 128;

  // body: heat shield dome, shoulder, wall substrate, collar, open bay
  const prof = [], Rs = 4.8, kinds = [];
  for (let i = 0; i <= 9; i++) { const r = 1.868 * Math.sin((i / 9) * Math.PI / 2 * 0.999 + 0.0001) ** 0.9; prof.push([r, Rs - Math.sqrt(Rs * Rs - r * r) - 0.0025]); kinds.push(M_CHAR); }
  // the shield stands 16 cm proud of the backshell: a rounded edge and a charred shelf, the lip the outward mount looks over
  for (const q of [[1.93, 0.415], [1.975, 0.47], [1.997, 0.535], [2.0, 0.59], [1.985, 0.64], [1.955, 0.675], [1.91, 0.692], [1.862, 0.694], [WB[0] + 0.004, WB[1] + 0.004]]) { prof.push(q); kinds.push(M_CHAR); }
  prof.push([WT[0], WT[1]]); kinds.push(M_BASE);
  prof.push([0.64, WT[1] + 0.035]); kinds.push(M_METAL);
  prof.push([0.64, APEX_Y - 0.03]); kinds.push(M_METAL);
  prof.push([0.615, APEX_Y]); kinds.push(M_METAL);
  prof.push([0.53, APEX_Y]); kinds.push(M_METAL);
  prof.push([0.52, 2.80]); kinds.push(M_DARK);
  prof.push([0.0, 2.80]); kinds.push(M_DARK);
  G.m.copy(yUp);
  G.lathe(prof, SEG, { smooth: true, styles: (i, g) => { const k = kinds[i + 1]; g.style(k, k === M_CHAR ? char : k === M_BASE ? dark : k === M_METAL ? metal : dark, 0, 0, skinF); } });

  // things on the wall: [phi, t, keep-out radius in metres]
  const feats = { pod: [0, 0.17, 0.2], winA: [24 * DEG, 0.50, 0.21], winB: [-158 * DEG, 0.50, 0.21], thrL: [-90 * DEG, 0.36, 0.26], thrR: [90 * DEG, 0.36, 0.26], umb: [-40 * DEG, 0.26, 0.2] };
  const rot = rng.range(-0.2, 0.2);
  const blocked = (phi, t) => {
    const p = wallPoint(phi, t), q = V3();
    for (const k in feats) { const f = feats[k]; if (p.distanceTo(wallPoint(f[0] + (k === 'pod' ? 0 : rot), f[1], 0, q)) < f[2]) return true; }
    return false;
  };

  // 300 tile panels, raised and bevelled, in seven rows
  const rows = [60, 54, 48, 44, 38, 32, 24], T0 = 0.025, T1 = 0.975, HT = 0.014, p = V3();
  const wv = (phi, t, off, u, w, f) => { wallPoint(phi, t, off, p); return G.v(p.x, p.y, p.z, WALL_CA * Math.sin(phi), WALL_SA, WALL_CA * Math.cos(phi), u, w, f); };
  G.m.identity();
  for (let r = 0; r < rows.length; r++) {
    const ta = lerp(T0, T1, r / rows.length), tb = lerp(T0, T1, (r + 1) / rows.length), n = rows[r], ph0 = rng() * TAU, gt = 0.0045, bt = 0.004;
    const whiteRun = rng.int(3, 6), whiteOff = rng.int(0, 5);
    for (let i = 0; i < n; i++) {
      const pa = ph0 + (i / n) * TAU, pb = ph0 + ((i + 1) / n) * TAU, pm = (pa + pb) / 2;
      if (blocked(pm, (ta + tb) / 2)) continue;
      const rad = lerp(WB[0], WT[0], (ta + tb) / 2), gp = 0.011 / rad, bp = 0.009 / rad;
      const white = ((i + whiteOff) % (whiteRun * 2) < whiteRun) !== (r % 2 === 0) ? rng.chance(0.85) : rng.chance(0.08);
      const base = white ? pale : tan, k = rng.range(0.82, 1.08) * (rng.chance(0.06) ? 0.6 : 1);
      G.style(M_TILE, [base[0] * k, base[1] * k * rng.range(0.97, 1.03), base[2] * k], rng(), 0, skinF);
      const A = [], B = [], C = [], D = [];
      for (let j = 0; j <= 2; j++) {
        const f = j / 2, ph = lerp(pa + gp + bp, pb - gp - bp, f), pho = lerp(pa + gp, pb - gp, f);
        A.push(wv(pho, ta + gt, 0, f, 0, 1)); B.push(wv(ph, ta + gt + bt, HT, f, 0.04, 0));
        C.push(wv(ph, tb - gt - bt, HT, f, 0.96, 0)); D.push(wv(pho, tb - gt, 0, f, 1, 1));
      }
      for (let j = 0; j < 2; j++) { G.quad(A[j], A[j + 1], B[j + 1], B[j]); G.quad(B[j], B[j + 1], C[j + 1], C[j]); G.quad(C[j], C[j + 1], D[j + 1], D[j]); }
      G.quad(A[0], B[0], C[0], D[0]); G.quad(B[2], A[2], D[2], C[2]);
    }
  }
  return { G, cover, pod, feats, rot, yUp, metal, dark, tan, pale, skinF, blocked };
}

// windows, thrusters, rails, tape, bay, cover, pod
function dressCapsule(K, rng) {
  const { G, cover, pod, feats, rot, yUp, metal, dark, skinF } = K;
  const M4 = () => new THREE.Matrix4(), steel = [0.42, 0.43, 0.46], gold = [0.55, 0.40, 0.16];
  // two round windows: raised frame, recessed warm glass
  for (const k of ['winA', 'winB']) {
    const f = feats[k]; G.m.copy(wallFrame(f[0] + rot, f[1], 0.0));
    G.style(M_METAL, steel, rng(), 0, skinF).lathe([[0.205, 0], [0.20, 0.034], [0.165, 0.04], [0.15, 0.034], [0.146, 0.012]], 28);
    G.style(M_GLASS, [1, 1, 1], rng()).lathe([[0.146, 0.012], [0.0001, 0.012]], 28);
    for (let i = 0; i < 12; i++) { const a = (i / 12) * TAU; G.m.copy(wallFrame(f[0] + rot, f[1], 0.03)).multiply(M4().makeTranslation(Math.cos(a) * 0.183, Math.sin(a) * 0.183, 0)); G.style(M_METAL, [0.2, 0.2, 0.22]).lathe([[0.009, 0], [0.009, 0.008], [0.0001, 0.011]], 6); }
  }
  // two thruster quads: blister with four canted nozzles
  for (const k of ['thrL', 'thrR']) {
    const f = feats[k], side = k === 'thrL' ? -1 : 1, F = wallFrame(f[0] + rot, f[1], 0.0);
    G.m.copy(F); G.style(M_METAL, [0.26, 0.26, 0.28], rng(), 0, skinF).bevelBox(0.40, 0.34, 0.075, 0.03);
    for (let i = 0; i < 4; i++) {
      const sx = i % 2 ? 1 : -1, sy = i < 2 ? -1 : 1;
      G.m.copy(F).multiply(M4().makeTranslation(sx * 0.095, sy * 0.075, 0.07)).multiply(M4().makeRotationY(sx * 0.5)).multiply(M4().makeRotationX(-sy * 0.3));
      G.style(M_NOZZLE, [0.10, 0.09, 0.09], rng(), 0, side).lathe([[0.034, 0], [0.056, 0.085], [0.048, 0.085], [0.018, 0.012], [0.0001, 0.012]], 14);
    }
  }
  // umbilical plate with connectors
  { const f = feats.umb, F = wallFrame(f[0] + rot, f[1], 0.0);
    G.m.copy(F); G.style(M_METAL, steel, rng(), 0, skinF).bevelBox(0.30, 0.22, 0.03, 0.012);
    for (let i = 0; i < 6; i++) { G.m.copy(F).multiply(M4().makeTranslation(((i % 3) - 1) * 0.085, (i < 3 ? -1 : 1) * 0.05, 0.03)); G.style(M_METAL, i % 2 ? gold : [0.14, 0.14, 0.15], rng()).lathe([[0.026, 0], [0.026, 0.018], [0.018, 0.022], [0.012, 0.006], [0.0001, 0.006]], 10); } }
  // handrails standing off the wall, and a broken ring rail under the collar
  G.m.identity();
  for (const [ph, t0, t1] of [[-13, 0.33, 0.62], [52, 0.2, 0.52], [-64, 0.48, 0.8], [128, 0.3, 0.62], [-122, 0.3, 0.62], [9, 0.66, 0.9], [180, 0.12, 0.42]]) {
    const pts = [], a = ph * DEG + rot; pts.push(wallPoint(a, t0, 0.012), wallPoint(a, t0 + 0.012, 0.055));
    for (let i = 1; i < 4; i++) pts.push(wallPoint(a, lerp(t0 + 0.012, t1 - 0.012, i / 4), 0.055));
    pts.push(wallPoint(a, t1 - 0.012, 0.055), wallPoint(a, t1, 0.012));
    G.style(M_METAL, steel, rng()).tube(pts, 0.011, 6);
    const mid = [wallPoint(a, (t0 + t1) / 2, 0.012), wallPoint(a, (t0 + t1) / 2, 0.055)]; G.tube(mid, 0.008, 5);
  }
  for (let s = 0; s < 3; s++) { const pts = []; for (let i = 0; i <= 10; i++) pts.push(wallPoint(rot + (s * 120 + 14 + i * 9.2) * DEG, 0.945, i === 0 || i === 10 ? 0.012 : 0.05)); G.style(M_METAL, steel, rng()).tube(pts, 0.010, 5); }
  // silver tape along the gaps, one end peeled and fluttering (aData.z = how free the tape is there)
  const nrm = V3(), p = V3();
  for (let i = 0; i < 22; i++) {
    const row = rng.int(1, 6), tg = lerp(0.025, 0.975, row / 7), a0 = rng() * TAU, len = rng.range(0.25, 0.6), rad = lerp(WB[0], WT[0], tg), da = len / rad, w = rng.range(0.022, 0.034) / WALL_LEN;
    if (K.blocked(a0 + da / 2, tg)) continue;
    const dir = rng.sign(), peel = rng.range(0.25, 0.6), lift = rng.range(0.03, 0.09); G.style(M_TAPE, [0.62, 0.63, 0.66], rng());
    const base = G.n, N = 8;
    for (let j = 0; j <= N; j++) {
      const f = j / N, a = a0 + da * (dir > 0 ? f : 1 - f), free = smoothstep(1 - peel, 1, f), off = 0.017 + free * free * lift;
      for (const sgn of [-1, 1]) { wallPoint(a, tg + sgn * w, off, p); nrm.set(WALL_CA * Math.sin(a), WALL_SA, WALL_CA * Math.cos(a)); G.v(p.x, p.y, p.z, nrm.x, nrm.y, nrm.z, f, sgn * 0.5 + 0.5, free); }
    }
    for (let j = 0; j < N; j++) { const k = base + j * 2; G.quad(k, k + 2, k + 3, k + 1); }
  }
  // forward bay: mortars, folded risers, fittings on the rim
  for (let i = 0; i < 3; i++) {
    const a = i * TAU / 3 + 0.4;
    G.m.copy(yUp).premultiply(M4().makeTranslation(Math.sin(a) * 0.27, 2.80, Math.cos(a) * 0.27));
    G.style(M_METAL, [0.34, 0.33, 0.30], rng()).lathe([[0.085, 0], [0.085, 0.15], [0.07, 0.16], [0.06, 0.15], [0.055, 0.03], [0.0001, 0.03]], 12);
    const b = a + TAU / 6, pts = []; G.m.identity();
    for (let j = 0; j <= 12; j++) { const u = j / 12, zz = Math.sin(u * Math.PI * 4) * 0.07, rr = 0.33 + Math.cos(u * Math.PI * 4) * 0.05; pts.push(V3(Math.sin(b + (u - 0.5) * 0.9) * rr, 2.84 + 0.05 + zz * 0.6, Math.cos(b + (u - 0.5) * 0.9) * rr)); }
    G.style(M_STRAP, [0.62, 0.30, 0.10], rng()).tube(pts, 0.022, 5);
    G.m.copy(yUp).premultiply(M4().makeTranslation(Math.sin(b) * 0.585, APEX_Y - 0.005, Math.cos(b) * 0.585)); G.style(M_METAL, steel, rng()).bevelBox(0.07, 0.07, 0.045, 0.012);
  }
  G.m.copy(yUp).premultiply(M4().makeTranslation(0, 2.80, 0)); G.style(M_METAL, [0.3, 0.3, 0.32], rng()).lathe([[0.11, 0], [0.11, 0.1], [0.07, 0.13], [0.0001, 0.13]], 14);
  // hold-down pads round the shoulder
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + rot + 0.3; G.m.copy(yUp).premultiply(M4().makeTranslation(Math.sin(a) * 1.915, 0.69, Math.cos(a) * 1.915)); G.style(M_METAL, [0.2, 0.19, 0.19], rng()).lathe([[0.045, 0], [0.043, 0.016], [0.032, 0.022], [0.0001, 0.022]], 12); }
  G.m.identity();

  // bay cover (own mesh; origin at the collar top)
  cover.m.copy(yUp).premultiply(M4().makeTranslation(0, APEX_Y, 0));
  cover.style(M_TILE, K.pale, 0.37, 0, skinF).lathe([[0.665, -0.05], [0.665, 0.03], [0.62, 0.075], [0.4, 0.115], [0.16, 0.135], [0.0001, 0.14]], 48, { smooth: true });
  cover.style(M_DARK, dark).lathe([[0.0001, -0.05], [0.665, -0.05]], 48);
  for (let i = 0; i < 12; i++) { const a = i * TAU / 12; cover.m.copy(yUp).premultiply(M4().makeTranslation(Math.sin(a) * 0.56, APEX_Y + 0.085, Math.cos(a) * 0.56)); cover.style(M_METAL, [0.25, 0.25, 0.27]).lathe([[0.016, 0], [0.016, 0.012], [0.0001, 0.016]], 6); }

  // camera pod on the +Z wall: plate, two struts, a head with a lens ring
  const F = wallFrame(0, feats.pod[1], 0.0);
  pod.m.copy(F); pod.style(M_METAL, steel, 0.2).bevelBox(0.2, 0.26, 0.022, 0.008);
  pod.m.identity();
  for (const sx of [-1, 1]) pod.style(M_METAL, [0.2, 0.2, 0.22], 0.5).tube([V3(sx * 0.07, -0.09, 0.02), V3(sx * 0.06, -0.14, 0.3), V3(sx * 0.045, -0.2, 0.56)].map((q) => q.applyMatrix4(F)), 0.014, 6);
  pod.tube([V3(0, 0.09, 0.02), V3(0, -0.05, 0.3), V3(0, -0.2, 0.56)].map((q) => q.applyMatrix4(F)), 0.012, 6);
  pod.m.copy(F).multiply(M4().makeTranslation(0, -0.22, 0.52)); pod.style(M_METAL, [0.16, 0.16, 0.18], 0.8).bevelBox(0.15, 0.2, 0.13, 0.02);
  pod.m.copy(F).multiply(M4().makeTranslation(0, -0.12, 0.585)).multiply(M4().makeRotationX(-Math.PI / 2)); pod.style(M_NOZZLE, [0.05, 0.05, 0.06], 0, 0, 0).lathe([[0.042, 0], [0.042, 0.03], [0.034, 0.034], [0.03, 0.01], [0.0001, 0.01]], 14);
  return K;
}

// ---------------------------------------------------------------- shared GLSL
const GLSL_NOISE = /* glsl */`
float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fbm(vec2 p){ return vn(p) * .5 + vn(p * 2.03 + 7.1) * .25 + vn(p * 4.1 + 3.3) * .125 + vn(p * 8.3 + 1.7) * .0625; }
`;

function capsuleMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, vertexColors: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: /* glsl */`
      attribute vec4 aData; uniform float uTime;
      varying vec3 vN, vWP, vLP, vCol; varying vec2 vUv; varying vec4 vData;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position;
        if (aData.x > 5.5 && aData.x < 6.5) p += normal * aData.z * aData.z * (0.012 + 0.03 * sin(uTime * (11. + aData.y * 9.) + position.x * 17. + position.z * 13.)) ;
        vLP = p; vUv = uv; vCol = color; vData = aData;
        vec4 wp = modelMatrix * vec4(p, 1.); vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * normal);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime, uFire, uLip, uWet, uGlossK; uniform vec2 uThr;
      uniform vec3 uSunDir, uSunCol, uSky, uBounce, uMag, uVio, uOra;
      varying vec3 vN, vWP, vLP, vCol; varying vec2 vUv; varying vec4 vData;
      #include <fog_pars_fragment>
      vec3 envc(vec3 r){ return mix(uBounce, uSky, smoothstep(-.25, .45, r.y)) + uSunCol * pow(max(dot(r, uSunDir), 0.), 48.) * 1.6; }
      void main(){
        vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
        vec3 V = normalize(cameraPosition - vWP);
        float mat = vData.x, rnd = vData.y, skin = vData.w;
        float az = atan(vLP.x, abs(vLP.z) < 1e-5 ? 1e-5 : vLP.z);
        vec3 alb = vCol, emi = vec3(0.); float gloss = .06, ao = 1., wet = 0., bead = 0.;
        float dim = 1. - .88 * uFire;
        vec2 c = vec2(az * 1.9, vUv.y) * 42.; float fw = fwidth(c.x) + fwidth(c.y), gw = fwidth(vLP.x) + fwidth(vLP.y) + fwidth(vLP.z);
        if (mat < .5) {                                   // char: honeycomb, cracks that cool from cherry to black
          vec2 r = vec2(1., 1.7320508), hh = r * .5, a = mod(c, r) - hh, b = mod(c - hh, r) - hh, g = dot(a, a) < dot(b, b) ? a : b;
          float cell = h21(floor((c - g) * 2.) + .5); g = abs(g);
          float hd = .5 - max(dot(g, vec2(.5, .8660254)), g.x);
          float honey = smoothstep(.02, .02 + .09 + fw, hd) * (1. - smoothstep(.35, 1.1, fw));
          float big = fbm(c * .055), cd = abs(fbm(c * .13 + 3.) - .47), crk = 1. - smoothstep(.0, .028 + fw * .01, cd), halo = 1. - smoothstep(0., .16, cd);
          alb = vCol * (.55 + .9 * big) * (1. + honey * (.5 + .7 * cell)) + vec3(.03, .015, .0) * big;
          float cool = vn(c * .06 + 9.) * .5 + .1, hot = smoothstep(cool - .2, cool + .3, uLip) * sqrt(max(uLip, 0.));
          emi += vec3(1.7, .13, .03) * crk * hot * (.7 + .6 * hot) + vec3(.75, .05, .012) * hot * (halo * .4 + hot * big * (1. - honey * .6) * .7);
          emi += uOra * uFire * (1.2 + 1.6 * smoothstep(.75, .2, vLP.y)) * (.5 + .5 * big);
          // out of the cloud the char is wet: dark and glossy in patches, beaded with water, rivulets creeping to the edge
          float lod = 1. - smoothstep(.25, .9, fw);
          float riv = smoothstep(.6, .8, vn(vec2(c.x * 1.1, c.y * .1 - uTime * .35))) * lod;
          // (beads at two sizes, each fading before its cells shrink to a pixel, so some always sparkle at the lip's range)
          float b1 = fw * 16., b2 = fw * 5., b3 = fw * 1.6, b4 = fw * .5;      // cells per pixel of each bead octave: one is always a few pixels wide
          bead = smoothstep(.89, .96, vn(c * 16. + 5.)) * smoothstep(.06, .12, b1) * (1. - smoothstep(.34, .6, b1)) + smoothstep(.89, .96, vn(c * 5. + 15.)) * smoothstep(.06, .12, b2) * (1. - smoothstep(.34, .6, b2))
            + smoothstep(.89, .96, vn(c * 1.6 + 25.)) * smoothstep(.06, .12, b3) * (1. - smoothstep(.34, .6, b3)) + smoothstep(.89, .96, vn(c * .5 + 35.)) * smoothstep(.06, .12, b4) * (1. - smoothstep(.34, .6, b4));
          wet = uWet;
          float tw = .2 + .8 * smoothstep(.35, .7, vn(c * 2.1 + vec2(uTime * 1.9, -uTime * 1.4)));
          alb *= mix(1., (.3 + .28 * big) * (1. - .45 * honey), wet);
          N = normalize(N + (vec3(vn(c * 1.9 + 1.), vn(c * 1.9 + 7.), vn(c * 1.9 + 13.)) - .5) * .1 * wet * lod);
          gloss = .03 + wet * (.05 + .05 * honey + .3 * riv);
          bead *= tw;
        } else if (mat < 1.5) { alb = vCol; ao = .6; }
        else if (mat < 2.5) {                             // tiles: bevel soot, fans streaming back, scorch near the shoulder
          float u = vUv.x, v = vUv.y, bev = vData.z;
          float fan = vn(vec2((u - .5) / (.3 + v) * 3.2 + rnd * 31., rnd * 7. + v * .7));
          float soot = pow(max(1. - v, 0.), 1.4) * smoothstep(.3, .75, fan) * .55 + smoothstep(.12, 0., min(u, 1. - u)) * .25 + smoothstep(.1, 0., 1. - v) * .2;
          float scorch = smoothstep(2.7, .8, vLP.y) * (.25 + .75 * fbm(vec2(az * 3., vLP.y * 2.5) + rnd));
          float grain = mix(.5, vn(vLP.xz * 160. + vLP.y * 90.), 1. - smoothstep(.12, .4, gw * 160.));      // (fades before it can alias into blotches)
          alb = vCol * (1. - .78 * clamp(soot + scorch * .55, 0., 1.)) * (.88 + .24 * grain) * (1. - .5 * bev);
          alb = mix(alb, alb * vec3(1.1, .82, .6), scorch * .6);
          if (skin > .5 && skin < 1.5) {                   // foil: fine crinkles (two octaves, each fading as it nears a pixel) catching thin highlights
            float k1 = 1. - smoothstep(.12, .4, gw * 70.), k2 = 1. - smoothstep(.12, .4, gw * 260.);
            N = normalize(N + (vec3(vn(vLP.xz * 70. + rnd * 9.), vn(vLP.yx * 70. + 3.), vn(vLP.zy * 70. + 5.)) - .5) * .2 * k1 + (vec3(vn(vLP.xz * 260. + 2.), vn(vLP.yx * 260. + 8.), vn(vLP.zy * 260. + 1.)) - .5) * .14 * k2);
            gloss = .75 * uGlossK;
          }
          if (skin > 1.5) gloss = .6 * uGlossK;
        } else if (mat < 3.5) { alb = vCol * (.8 + .4 * vn(vLP.xy * 60. + vLP.z * 40.)); gloss = .35; ao = 1. - .4 * vData.z; }
        else if (mat < 4.5) {                             // window: warm cabin light, one shadow moving inside
          float rho = 1. - vUv.y / .146, th = vUv.x * 6.2831853; vec2 q = rho * vec2(cos(th), sin(th));
          float bx = sin(uTime * .45 + rnd * 6.) * .55, sh = smoothstep(.5, .25, length((q - vec2(bx, -.35)) * vec2(1., .55))) + smoothstep(.22, .12, length(q - vec2(bx + .04, .28)));
          emi = vec3(2.6, 1.35, .5) * (1. - .85 * clamp(sh, 0., 1.)) * (.75 + .25 * smoothstep(1., .3, rho)) * (.8 + .2 * vn(q * 3. + 4.));
          alb = vec3(.02); gloss = .9;
        } else if (mat < 5.5) {                           // nozzles: glow when they fire
          float fire = vData.w < -.5 ? uThr.x : vData.w > .5 ? uThr.y : 0.;
          emi = mix(uVio, vec3(1.), .5) * fire * 3.5 * smoothstep(.0, .1, vUv.y); gloss = .3;
        } else if (mat < 6.5) { N = normalize(N + (vec3(vn(vUv * vec2(40., 6.) + rnd * 20.), vn(vUv * vec2(40., 6.) + 7.), 0.5) - .5) * .5 * mix(.45, 1., uGlossK)); gloss = .85 * mix(.6, 1., uGlossK); }
        else if (mat < 7.5) { alb = vCol * (.7 + .3 * step(.5, fract(vUv.y * 40.))); }
        else { ao = .5; }
        float ndl = dot(N, uSunDir), rim = pow(max(1. - max(dot(N, V), 0.), 0.), 4.);
        vec3 amb = mix(uBounce, uSky, N.y * .5 + .5) * dim * ao;
        vec3 col = alb * (uSunCol * max(ndl, 0.) * dim + amb);
        col += envc(reflect(-V, N)) * dim * gloss * (.25 + .75 * rim) * ao;
        if (wet > 0.) {                                   // a sharp sun glint, a rim in the key colour on the sun side, sparkling beads
          float sl = clamp(ndl * .5 + .5, 0., 1.), sr = max(dot(reflect(-V, N), uSunDir), 0.), s2 = sr * sr, s8 = s2 * s2 * s2 * s2;
          float edge = 1. - max(dot(N, V), 0.); edge *= edge * edge;
          col += uSunCol * (s8 * s8 * s8 * s8 * s8 * (.4 + 3. * gloss) + (edge * .4 + rim * 1.1) * sl * sl * 1.2 + bead * (.7 + 2.6 * sl * sl)) * wet * dim;
        }
        // plasma wash: magenta and violet bands pouring up the wall, orange at the shock edge
        float bnd = vn(vec2(az * 2.2 + 1.3, vLP.y * 1.1 - uTime * 7.)), bnd2 = vn(vec2(az * 5. - 2., vLP.y * 2.4 - uTime * 13.));
        vec3 pl = mix(uVio, uMag, smoothstep(.3, .7, bnd)) * (.75 + .5 * bnd2) + uOra * smoothstep(1.3, .5, vLP.y) * .9;
        col += (alb * 1.5 + .03 + gloss * .5 * rim) * pl * uFire * (.55 + .45 * max(dot(N, normalize(vec3(vLP.x, .3, vLP.z) + 1e-4)), 0.)) * ao;
        col += emi;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- ringsail mains
const NG = 48, NR = 10, LINE_LEN = 50, PROF_W = 64, PROF_H = 6;
// Meridian shapes for the five inflation stages (0 rope, 1 tube, 2 lampshade, 3 full, 4 overshoot), all with the same
// cloth length: a row of (radius, height above the confluence) each, blended by the texture filter.
function buildProfiles() {
  const fullPsi = (s) => 100 * DEG * Math.pow(s, 2.4);
  const run = (psi, r0, S) => {
    const r = new Float32Array(PROF_W), z = new Float32Array(PROF_W), ds = S / (PROF_W - 1); r[0] = r0;
    for (let i = 1; i < PROF_W; i++) { const a = psi((i - 0.5) / (PROF_W - 1)); r[i] = r[i - 1] + ds * Math.cos(a); z[i] = z[i - 1] + ds * Math.sin(a); }
    return { r, z };
  };
  const unit = run(fullPsi, 0, 1), S = (17.5 - 1.5) / unit.r[PROF_W - 1];
  const solve = (make, r0, target) => { let lo = 0.05, hi = 1.6; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (run(make(m), r0, S).r[PROF_W - 1] > target) lo = m; else hi = m; } return run(make((lo + hi) / 2), r0, S); };
  const sat = (sig, q) => (pm) => (s) => pm * (1 - Math.exp(-Math.pow(s / sig, q))) / (1 - Math.exp(-Math.pow(1 / sig, q)));
  const shapes = [
    solve(sat(0.03, 1.0), 0.16, 0.34),                                       // rope
    solve(sat(0.07, 1.2), 0.45, 2.0),                                        // tube, 4 m wide
    solve(sat(0.2, 1.7), 0.8, 7.0),                                          // lampshade, 14 m mouth
    run(fullPsi, 1.5, S),                                                    // full, 35 m
    solve((pm) => (s) => pm * Math.pow(s, 3.0), 1.6, 19.0),                  // overshoot, 38 m and flatter
  ];
  shapes.push(shapes[4]);
  const data = new Uint16Array(PROF_W * PROF_H * 4), info = [];
  shapes.forEach((sh, k) => {
    const rs = sh.r[PROF_W - 1], hs = Math.sqrt(LINE_LEN * LINE_LEN - rs * rs), zs = sh.z[PROF_W - 1];
    for (let i = 0; i < PROF_W; i++) { const o = (k * PROF_W + i) * 4; data[o] = THREE.DataUtils.toHalfFloat(sh.r[i]); data[o + 1] = THREE.DataUtils.toHalfFloat(hs + zs - sh.z[i]); data[o + 2] = 0; data[o + 3] = THREE.DataUtils.toHalfFloat(1); }
    info.push({ rSkirt: rs, hSkirt: hs, hCrown: hs + zs });
  });
  const tex = new THREE.DataTexture(data, PROF_W, PROF_H, THREE.RGBAFormat, THREE.HalfFloatType);
  tex.minFilter = tex.magFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.generateMipmaps = false; tex.needsUpdate = true;
  return { tex, info, S };
}

const GLSL_CANOPY = /* glsl */`
uniform sampler2D uProf; uniform float uStage, uExtend, uTime, uPhase, uRipple, uRipA, uTremble, uBulge, uSquash, uInward;
uniform vec3 uOrigin, uAxis, uE1, uE2;
vec2 prof(float s){ return textureLod(uProf, vec2((clamp(s, 0., 1.) * 63. + .5) / 64., (uStage + .5) / 6.), 0.).xy; }
// pan = (gore, ring, s0, s1); a across the gore 0..1; v down the sail 0..1
vec3 canopyPoint(vec4 pan, float a, float v){
  float s = mix(pan.z, pan.w, v) - step(8.5, pan.y) * v * a * (1. - a) * .1;
  float th = (pan.x + a) * 0.1308997 + uPhase;
  vec2 p = prof(s), t = prof(s + .025) - prof(s - .025);
  vec2 mn = vec2(-t.y, t.x); mn /= max(length(mn), 1e-5);
  float w = p.x * .0654;
  float d = uBulge * w * 4. * a * (1. - a) * (.4 + 1.0 * v * v);
  float rp = (s - (1.15 - uRipple * 1.4)) / .1; d += uRipA * exp(-rp * rp);
  d += uTremble * (.22 * sin(s * 38. - uTime * 23. + pan.x * 1.7) + .16 * sin(s * 15. + uTime * 31. + pan.x * .9)) * min(1., p.x * .6);
  float sq = max(cos(th - uInward), 0.);
  float r = p.x * (1. + .014 * sin(pan.x * 2.4 + uPhase * 7.)) * (1. - uSquash * sq * sq * sq) * step(1e-4, uExtend) + mn.x * d * step(1e-4, uExtend);
  float h = (p.y + mn.y * d) * uExtend;
  vec3 whip = (uE1 * sin(h * .21 - uTime * 8.3 + uPhase * 3.) + uE2 * sin(h * .17 - uTime * 6.9 + uPhase * 5.)) * uTremble * smoothstep(0., 30., h) * 1.1;
  return uOrigin + uAxis * h + (cos(th) * uE1 + sin(th) * uE2) * r + whip;
}
`;
const RING_S = (k) => { const gap = k < 4 ? 0.011 : 0.0035; return [k / NR + (k === 0 ? 0 : gap), (k + 1) / NR - (k === NR - 1 ? 0 : gap)]; };

function canopyGeometry(rng, pattern) {
  const NA = 4, NV = 3, per = (NA + 1) * (NV + 1), n = NG * NR * per;
  const pan = new Float32Array(n * 4), av = new Float32Array(n * 3), idx = [];
  const blockG = rng.pick([4, 4, 6, 8]), bandR = rng.pick([2, 2, 3]), off = rng.int(0, 7), oneG = rng.int(0, 15);
  let o = 0;
  for (let g = 0; g < NG; g++) for (let k = 0; k < NR; k++) {
    let orange;
    if (pattern === 'quarters') orange = (Math.floor(g / 12) + (k >= 8 ? 1 : 0)) % 2 === 0;
    else if (pattern === 'onegore') orange = (g + oneG) % 16 < 2 || k === 0 || (k === NR - 1 && g % 4 < 2);
    else orange = k < 2 ? true : (Math.floor((g + off) / blockG) + Math.floor(k / bandR)) % 2 === 0;
    const [s0, s1] = RING_S(k), base = o;
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NA; i++) {
      pan[o * 4] = g; pan[o * 4 + 1] = k; pan[o * 4 + 2] = s0; pan[o * 4 + 3] = s1;
      av[o * 3] = i / NA; av[o * 3 + 1] = j / NV; av[o * 3 + 2] = orange ? 1 : 0; o++;
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NA; i++) { const q = base + j * (NA + 1) + i; idx.push(q, q + NA + 1, q + 1, q + 1, q + NA + 1, q + NA + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aPan', new THREE.BufferAttribute(pan, 4)); geo.setAttribute('aAv', new THREE.BufferAttribute(av, 3));
  geo.setIndex(idx); geo.boundingSphere = new THREE.Sphere(V3(0, 40, -25), 120);
  return geo;
}

function clothMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: GLSL_CANOPY + /* glsl */`
      attribute vec4 aPan; attribute vec3 aAv;
      varying vec3 vN, vWP; varying vec4 vPan; varying vec3 vAv; varying float vS;
      #include <fog_pars_vertex>
      void main(){
        vec3 P0 = canopyPoint(aPan, aAv.x, aAv.y), Pa = canopyPoint(aPan, aAv.x + .08, aAv.y), Pv = canopyPoint(aPan, aAv.x, aAv.y + .1);
        vec3 n = cross(Pv - P0, Pa - P0); n /= max(length(n), 1e-6);
        vPan = aPan; vAv = aAv; vS = mix(aPan.z, aPan.w, aAv.y);
        vec4 wp = modelMatrix * vec4(P0, 1.); vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * n + 1e-6);
        vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uBounce, uOrange, uWhite; uniform float uGlow, uFlash;
      varying vec3 vN, vWP; varying vec4 vPan; varying vec3 vAv; varying float vS;
      #include <fog_pars_fragment>
      void main(){
        vec3 N = normalize(vN), V = normalize(cameraPosition - vWP);
        float inside = gl_FrontFacing ? 0. : 1.; vec3 Nf = gl_FrontFacing ? N : -N;
        float a = vAv.x, v = vAv.y, fa = fwidth(a), fv = fwidth(v);
        float ea = min(a, 1. - a), ev = min(v, 1. - v);
        float tape = 1. - smoothstep(.035, .035 + fa * 1.5, ea), hem = 1. - smoothstep(.05, .05 + fv * 1.5, ev);
        float seam = max(tape, hem) * (1. - smoothstep(.5, 1.6, fa * 8.));
        float fade = 1. - smoothstep(.15, .6, fa * 4.);
        float rip = (smoothstep(.42, .5, abs(fract(a * 6.) - .5)) + smoothstep(.42, .5, abs(fract(v * 5.) - .5))) * .5 * fade;
        float crease = vn(vec2(vPan.x * 3.1 + a * 3., vS * 46.)) * .6 + vn(vec2((vPan.x + a) * 9., vS * 17. + vPan.y)) * .4;
        vec3 alb = mix(uWhite, uOrange, vAv.z) * (.86 + .22 * crease) * (1. - .1 * rip);
        alb *= 1. - .3 * seam;
        // light: sun on the lit face, sun THROUGH the cloth on the far face, blue-violet skyshine in shadow
        float ndl = dot(Nf, uSunDir), lit = max(ndl, 0.), thru = pow(max(-ndl, 0.), .55);
        float lsh = 1. - .4 * smoothstep(.45, .75, vS) * (1. - smoothstep(.03, .06 + fa, abs(fract(vPan.x + a + (1. - vS) * 5.5) - .5)));
        vec3 tcol = mix(vec3(.80, .72, .62), vec3(1., .215, .02), vAv.z) * (.8 + .35 * crease);
        vec3 col = alb * mix(vec3(1.), tcol * .45, inside) * uSunCol * lit;
        col += tcol * uSunCol * thru * uGlow * mix(.5, 1., inside) * (1. - .72 * seam) * lsh * (1. - .18 * rip);
        vec3 amb = mix(uBounce, uSky, Nf.y * .5 + .5);
        col += alb * amb * (.75 + .25 * inside) + alb * alb * uSunCol * .12 * inside;
        col += alb * uFlash * vec3(1.6, 1.2, .8) * smoothstep(40., 0., length(vWP - cameraPosition));
        col = min(col, vec3(1.6, 1.3, 1.1));
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// suspension lines (48), one riser and frost puffs for one canopy: ribbons that never get thinner than 1.5 px
function linesGeometry(rng) {
  const NSEG = 14, NPUFF = 14, L = [], S = [], idx = []; let n = 0;
  const strip = (gore, kind, segs) => { const base = n; for (let j = 0; j <= segs; j++) for (const sd of [-1, 1]) { L.push(gore, j / segs, sd, kind); S.push(0, 0); n++; } for (let j = 0; j < segs; j++) { const q = base + j * 2; idx.push(q, q + 1, q + 2, q + 2, q + 1, q + 3); } };
  for (let g = 0; g < NG; g++) strip(g, 0, NSEG);
  strip(0, 1, 4);
  for (let i = 0; i < NPUFF; i++) { const g = rng.int(0, NG - 1), f = rng.range(0.25, 0.95), sd = rng(), sz = rng.range(0.6, 1.4); for (let c = 0; c < 4; c++) { L.push(g, f, c, 2); S.push(sd, sz); } idx.push(n, n + 1, n + 2, n, n + 2, n + 3); n += 4; }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  geo.setAttribute('aL', new THREE.Float32BufferAttribute(L, 4)); geo.setAttribute('aS', new THREE.Float32BufferAttribute(S, 2));
  geo.setIndex(idx); geo.boundingSphere = new THREE.Sphere(V3(0, 40, -25), 120);
  return geo;
}

function linesMaterial(U) {
  const [s0, s1] = RING_S(NR - 1);
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: GLSL_CANOPY + /* glsl */`
      attribute vec4 aL; attribute vec2 aS;
      uniform float uSag, uWaveF, uWaveA, uPuff, uDeploy, uResY; uniform vec3 uFit;
      varying vec4 vInfo; varying vec2 vQ; varying vec3 vWP;
      #include <fog_pars_vertex>
      vec3 linePoint(float gore, float f){
        vec3 sk = canopyPoint(vec4(gore, 9., ${s0.toFixed(4)}, ${s1.toFixed(4)}), 0., 1.);
        vec3 d = sk - uOrigin; float len = length(d);
        float th = gore * 0.1308997 + uPhase; vec3 rad = cos(th) * uE1 + sin(th) * uE2;
        vec3 p = uOrigin + d * f;
        float bow = sin(f * 3.14159);
        float slack = uSag * len * .11, mouth = length(d - uAxis * dot(d, uAxis));
        // slack lines belly inward and droop (seen from the capsule, a line that bows outward is a hoop wider than its canopy)
        float inw = min(bow * slack, mouth * f * .55);
        p += (uE1 * .3 * sin(gore * 1.3 + uTime * 2.1) - rad * (.6 + .4 * sin(gore * 2.7))) * inw - uAxis * (.5 * bow * slack);
        float wv = (f - uWaveF) / .09; p += rad * uWaveA * exp(-wv * wv) * sin(f * 70. - uTime * 30.) * 1.2;
        p += rad * bow * .05 * sin(f * 24. - uTime * 37. + gore) * (1. - uSag);
        return p;
      }
      void main(){
        float kind = aL.w; vec3 P, T = vec3(0., 1., 0.); float half0 = .022, alpha = 1.; vQ = vec2(0.);
        if (kind < .5) { P = linePoint(aL.x, aL.y); T = linePoint(aL.x, aL.y + .03) - P; }
        else if (kind < 1.5) { P = mix(uFit, uOrigin, aL.y * uDeploy); T = uOrigin - uFit; half0 = .05; alpha = step(.01, uDeploy); }
        else {
          P = linePoint(aL.x, aL.y);
          float th = aL.x * 0.1308997 + uPhase; P += (cos(th) * uE1 + sin(th) * uE2) * (.4 + 2.2 * uPuff) * (aS.x - .3) + uAxis * (-1.5 * uPuff * aS.x);
        }
        vec4 mv = viewMatrix * modelMatrix * vec4(P, 1.);
        float dist = max(-mv.z, .05), px = 2. * dist / (projectionMatrix[1][1] * uResY);
        if (kind < 1.5) {
          vec3 tv = mat3(viewMatrix) * mat3(modelMatrix) * T, sdir = cross(tv, mv.xyz); sdir /= max(length(sdir), 1e-6);
          float hw = max(half0, .8 * px); alpha *= clamp(half0 / hw, .14, 1.);
          mv.xyz += sdir * aL.z * hw * step(1e-4, uExtend); vQ = vec2(aL.z, aL.y);
        } else {
          vec2 c = vec2(aL.z < .5 || aL.z > 2.5 ? -1. : 1., aL.z < 1.5 ? -1. : 1.);
          float sz = aS.y * (.4 + 2.3 * sqrt(max(uPuff, 0.))) * step(.001, uPuff);
          mv.xy += c * sz; vQ = c; alpha = (1. - uPuff) * (1. - uPuff) * smoothstep(0., .06, uPuff) * .26;
        }
        vInfo = vec4(kind, alpha, aS.x, aL.y); vWP = (modelMatrix * vec4(P, 1.)).xyz;
        vec4 mvPosition = mv; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uBounce; uniform float uTime;
      varying vec4 vInfo; varying vec2 vQ; varying vec3 vWP;
      #include <fog_pars_fragment>
      void main(){
        vec3 col; float al = vInfo.y;
        if (vInfo.x < 1.5) {
          float e = 1. - abs(vQ.x);
          col = vec3(.74, .70, .62) * (uSunCol * (.35 + .4 * e) + mix(uBounce, uSky, .6));
          if (vInfo.x > .5) col *= vec3(1., .62, .34) * (.7 + .3 * step(.5, fract(vQ.y * 30.)));
        } else {
          float r = length(vQ), puff = (1. - smoothstep(.15, 1., r)) * (.45 + .55 * fbm(vQ * 2.2 + vInfo.z * 17. + uTime * .3));
          col = vec3(.95, .97, 1.) * (uSunCol * .6 + uSky * 1.2 + .15); al *= puff;
        }
        if (al < .003) discard;
        gl_FragColor = vec4(col, al);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- ribbon chutes (two drogues, three pilots)
// Local frame: origin at the attach point, +Y along the riser. 7 m conical ribbon canopy on a 24 m riser and 7 m lines.
const SMALL_LR = 24, SMALL_N = 16;
function smallChuteGeometry(rng, orange, white) {
  const P = [], N = [], C = [], K = [], idx = []; let n = 0;
  const NRB = 9, prof = (u) => [0.45 + 3.05 * Math.sin(u * 1.25) / Math.sin(1.25), SMALL_LR + 6 + 2.6 * (1 - u * u)];   // u 0 vent .. 1 skirt
  const push = (x, y, z, nx, ny, nz, c, kind, side, w) => { P.push(x, y, z); N.push(nx, ny, nz); C.push(c[0], c[1], c[2]); K.push(kind, side, w, 0); return n++; };
  for (let k = 0; k < NRB; k++) {
    const u0 = (k + 0.14) / NRB, u1 = (k + 0.86) / NRB, col = k % 3 === 1 ? white : orange;
    for (let g = 0; g < SMALL_N; g++) {
      const base = n;
      for (let i = 0; i <= 3; i++) {
        const a = ((g + i / 3) / SMALL_N) * TAU, bul = 1 + 0.07 * Math.sin((i / 3) * Math.PI);
        for (const u of [u0, u1]) { const [r, y] = prof(u); const sl = 0.55; push(Math.sin(a) * r * bul, y, Math.cos(a) * r * bul, Math.sin(a) * sl, 0.84, Math.cos(a) * sl, col, 0, 0, u); }
      }
      for (let i = 0; i < 3; i++) { const q = base + i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    }
  }
  // radial tapes over the ribbons, then lines and riser as camera-facing strips (kind 1: normal = tangent)
  for (let g = 0; g < SMALL_N; g++) {
    const a = (g / SMALL_N) * TAU, s = Math.sin(a), c = Math.cos(a), base = n, wa = 0.05;
    for (let i = 0; i <= 6; i++) { const [r, y] = prof(i / 6); for (const sd of [-1, 1]) push(s * (r + 0.02) + c * sd * wa, y + 0.02, c * (r + 0.02) - s * sd * wa, s * 0.55, 0.84, c * 0.55, [0.5, 0.42, 0.34], 0, 0, i / 6); }
    for (let i = 0; i < 6; i++) { const q = base + i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
    const [rs, ys] = prof(1), t = V3(s * rs, ys - SMALL_LR, c * rs).normalize(), b2 = n;
    for (let i = 0; i <= 3; i++) { const f = i / 3; for (const sd of [-1, 1]) push(s * rs * f, SMALL_LR + (ys - SMALL_LR) * f, c * rs * f, t.x, t.y, t.z, [0.72, 0.68, 0.6], 1, sd, f); }
    for (let i = 0; i < 3; i++) { const q = b2 + i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
  }
  const b3 = n; for (let i = 0; i <= 8; i++) for (const sd of [-1, 1]) push(0, SMALL_LR * (i / 8), 0, 0, 1, 0, [0.8, 0.5, 0.25], 1, sd * 1.8, 0);
  for (let i = 0; i < 8; i++) { const q = b3 + i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(C, 3)); geo.setAttribute('aK', new THREE.Float32BufferAttribute(K, 4));
  geo.setIndex(idx); geo.boundingSphere = new THREE.Sphere(V3(0, 16, 0), 40);
  return geo;
}
function smallChuteMaterial(U) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, vertexColors: true,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U },
    vertexShader: /* glsl */`
      attribute vec4 aK; uniform float uTime, uOpen, uLen, uSpin, uResY;
      varying vec3 vN, vWP, vCol; varying vec2 vK;
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position; float top = max(p.y - ${SMALL_LR.toFixed(1)}, 0.);
        float m = mix(.07, 1., uOpen) * (1. + .05 * sin(uTime * 6.3 + uSpin) * uOpen);
        p.xz *= m; p.y = min(p.y, ${SMALL_LR.toFixed(1)}) + top * mix(1.3, 1., uOpen);
        p.xz += (1. - uOpen) * .5 * vec2(sin(p.y * .5 - uTime * 19.), cos(p.y * .43 - uTime * 16.)) * smoothstep(0., 20., p.y);
        p.xz += vec2(sin(top * 9. + uTime * 27. + position.x), cos(top * 8. + uTime * 23.)) * .05 * step(.01, top) * (1.3 - uOpen);
        float ca = cos(uSpin), sa = sin(uSpin); p.xz = mat2(ca, -sa, sa, ca) * p.xz; p.y *= uLen; p.xz *= step(1e-4, uLen);
        vec3 nn = normal; nn.xz = mat2(ca, -sa, sa, ca) * nn.xz;
        vec4 wp = modelMatrix * vec4(p, 1.), mv = viewMatrix * wp;
        if (aK.x > .5) {
          vec3 tv = mat3(viewMatrix) * mat3(modelMatrix) * nn, sd = cross(tv, mv.xyz); sd /= max(length(sd), 1e-6);
          float px = 2. * max(-mv.z, .05) / (projectionMatrix[1][1] * uResY);
          mv.xyz += sd * sign(aK.y) * max(.016 * abs(aK.y), .75 * px) * step(1e-4, uLen);
        }
        vWP = wp.xyz; vN = normalize(mat3(modelMatrix) * nn); vCol = color; vK = aK.xz;
        vec4 mvPosition = mv; gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunCol, uSky, uBounce; uniform float uGlow, uFlash;
      varying vec3 vN, vWP, vCol; varying vec2 vK;
      #include <fog_pars_fragment>
      void main(){
        vec3 col;
        if (vK.x > .5) col = vCol * (uSunCol * .6 + mix(uBounce, uSky, .6));
        else {
          vec3 N = normalize(vN); if (!gl_FrontFacing) N = -N;
          float ndl = dot(N, uSunDir), e = min(fract(vK.y * 9.) , 1. - fract(vK.y * 9.));
          vec3 t = pow(vCol, vec3(1.25)) * 1.25;
          col = vCol * uSunCol * max(ndl, 0.) + t * uSunCol * pow(max(-ndl, 0.), .55) * uGlow + vCol * mix(uBounce, uSky, N.y * .5 + .5);
          col += vCol * uFlash * vec3(1.6, 1.2, .8);
          col = min(col, vec3(1.75, 1.5, 1.3));
        }
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------- plasma: sheath, nine braided streamers, sparks, thruster plumes
const GLSL_PLASMA = /* glsl */`
uniform float uTime, uFire, uTear, uTail; uniform vec3 uMag, uVio, uOra, uBend; uniform vec4 uKinkA, uKinkB;
vec3 bendAt(float y){ return uBend * (1. - exp(-max(y + .8, 0.) / 6.)); }
vec3 kink(float y){
  float a = (y - 4. - uKinkA.z * 85.) / 9., b = (y - 4. - uKinkB.z * 85.) / 9.;
  return vec3(uKinkA.x, 0., uKinkA.y) * uKinkA.w * exp(-a * a) + vec3(uKinkB.x, 0., uKinkB.y) * uKinkB.w * exp(-b * b);
}
float wakeR(float y){ return mix(3.75, 2.5, smoothstep(2., 46., y)); }
`;
function buildPlasma(rng, detail, U) {
  const group = new THREE.Group();
  // sheath: shock cap under the shield, then a shell pouring back past the wall
  const sp = [[0.001, -0.9], [1.0, -0.86], [1.9, -0.68], [2.7, -0.34], [3.25, 0.3], [3.75, 1.2], [4.25, 2.6], [4.65, 4.4], [4.75, 6.5], [4.45, 10], [3.8, 17], [3.2, 27], [2.8, 40], [2.5, 58], [2.5, 80]];
  const SA = 64, SB = 44, P = [], Nn = [], Uv = [], idx = [];
  const at = (f) => { const x = f * (sp.length - 1), i = Math.min(sp.length - 2, Math.floor(x)), t = x - i, t2 = t * t * (3 - 2 * t) * 0.5 + t * 0.5; return [lerp(sp[i][0], sp[i + 1][0], t2), lerp(sp[i][1], sp[i + 1][1], t2)]; };
  for (let j = 0; j <= SB; j++) {
    const f = Math.pow(j / SB, 1.25), [r, y] = at(f), [r2, y2] = at(Math.min(1, f + 0.01)), [r1, y1] = at(Math.max(0, f - 0.01)), dr = r2 - r1, dy = y2 - y1, l = Math.hypot(dr, dy) || 1;
    for (let i = 0; i <= SA; i++) { const a = (i / SA) * TAU; P.push(Math.sin(a) * r, y, Math.cos(a) * r); Nn.push(Math.sin(a) * dy / l, -dr / l, Math.cos(a) * dy / l); Uv.push(i / SA, y); }
  }
  for (let j = 0; j < SB; j++) for (let i = 0; i < SA; i++) { const q = j * (SA + 1) + i; idx.push(q, q + 1, q + SA + 1, q + 1, q + SA + 2, q + SA + 1); }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(Uv, 2));
  sg.setIndex(idx); sg.boundingSphere = new THREE.Sphere(V3(0, 40, 0), 60);
  const add = { transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide };
  const sheath = new THREE.Mesh(sg, new THREE.ShaderMaterial({
    ...add, uniforms: U,
    vertexShader: GLSL_PLASMA + /* glsl */`
      varying vec3 vN, vWP; varying vec2 vUv;
      void main(){ vec3 p = position + kink(position.y) * smoothstep(3., 12., position.y) + bendAt(position.y); vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 wp = modelMatrix * vec4(p, 1.); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
    fragmentShader: GLSL_NOISE + GLSL_PLASMA + /* glsl */`
      varying vec3 vN, vWP; varying vec2 vUv;
      void main(){
        float y = vUv.y, az = vUv.x * 6.2831853;
        float edge = 1. - abs(dot(normalize(vN), normalize(cameraPosition - vWP)));
        float tw = az * 9. + y * .42 + uTime * .8;
        float strand = .5 + .5 * cos(tw), s2 = .5 + .5 * cos(tw * .3333 + 1.7);
        float f1 = vn(vec2(vUv.x * 46., y * .16 - uTime * 5.)), f2 = vn(vec2(vUv.x * 110. + 3., y * .38 - uTime * 11.)), f3 = vn(vec2(vUv.x * 230., y * .9 - uTime * 23.));
        float streak = smoothstep(.45, .9, f1) * (.35 + .65 * strand) + smoothstep(.6, .95, f2) * .55 + smoothstep(.72, .98, f3) * .5;
        vec3 col = mix(uVio, uMag, smoothstep(.3, .7, s2));
        col = mix(col, uOra * 1.4, clamp(smoothstep(1.8, -.5, y) * .85 + smoothstep(.75, .98, f3) * .5, 0., 1.));
        float body = exp(-max(y - 2., 0.) / 11.) * smoothstep(80., 40., y);
        float shred = smoothstep(uTear * 1.25 - .25, uTear * 1.25, fbm(vec2(vUv.x * 7., y * .12 - uTime * 2.) + 5.));
        float I = streak * (.1 + 1.25 * edge * edge) * body * uFire * shred + smoothstep(.2, -.9, y) * (.2 + .5 * edge * edge) * uFire * (.5 + .5 * f1);
        gl_FragColor = vec4(col * I * 1.5, 1.);
      }` }));
  sheath.frustumCulled = false; sheath.renderOrder = 3; group.add(sheath);

  // nine streamers: tubes whose centre lines are computed in the vertex shader (helix + weave + kink)
  const NS = 9, SEG = Math.round(86 * (0.6 + 0.4 * detail)), SID = 6, sv = [], si = []; let n = 0;
  for (let s = 0; s < NS; s++) {
    const ph = rng() * TAU, wd = rng.range(0.75, 1.25), tear = s === 0 ? 1 : rng.range(0.25, 0.9);
    for (let j = 0; j <= SEG; j++) for (let i = 0; i <= SID; i++) sv.push(s, j / SEG, (i / SID) * TAU, ph, wd, tear, 0, 0);
    for (let j = 0; j < SEG; j++) for (let i = 0; i < SID; i++) { const q = n + j * (SID + 1) + i; si.push(q, q + 1, q + SID + 1, q + 1, q + SID + 2, q + SID + 1); }
    n += (SEG + 1) * (SID + 1);
  }
  const tg = new THREE.BufferGeometry(), ib = new THREE.InterleavedBuffer(new Float32Array(sv), 8);
  tg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  tg.setAttribute('aA', new THREE.InterleavedBufferAttribute(ib, 4, 0)); tg.setAttribute('aB', new THREE.InterleavedBufferAttribute(ib, 4, 4));
  tg.setIndex(si); tg.boundingSphere = new THREE.Sphere(V3(0, 150, 0), 170);
  const streamers = new THREE.Mesh(tg, new THREE.ShaderMaterial({
    ...add, uniforms: U,
    vertexShader: GLSL_PLASMA + /* glsl */`
      attribute vec4 aA, aB; varying vec3 vN, vWP; varying vec4 vI; varying float vTear;
      vec3 centre(float s, float y, float ph){
        float th = s * 0.6981317 + y * .034 + uTime * .22 + .55 * sin(y * .085 + ph + uTime * .6);
        float r = wakeR(y) * (1. + .2 * sin(y * .12 + ph * 2. + uTime * .45)) * (1. + .5 * smoothstep(120., 300., y));
        return vec3(sin(th) * r, y, cos(th) * r) + kink(y) + bendAt(y);
      }
      void main(){
        float y = 3.2 + 297. * pow(aA.y, 2.1);
        vec3 c = centre(aA.x, y, aA.w), t = centre(aA.x, y + .5, aA.w) - c; t /= max(length(t), 1e-5);
        vec3 rad = vec3(c.x, 0., c.z); rad /= max(length(rad), 1e-4); vec3 tan2 = cross(t, rad);
        float rho = (.5 + .28 * sin(y * .2 + aA.w * 3. - uTime * 2.)) * aB.x * mix(.55, 1., smoothstep(3., 9., y)) * (1. + y * .004);
        vec3 nn = rad * cos(aA.z) + tan2 * sin(aA.z), p = c + nn * rho;
        vI = vec4(aA.x, y, aA.z, aA.w); vTear = aB.y; vN = normalize(mat3(modelMatrix) * nn);
        vec4 wp = modelMatrix * vec4(p, 1.); vWP = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: GLSL_NOISE + GLSL_PLASMA + /* glsl */`
      varying vec3 vN, vWP; varying vec4 vI; varying float vTear;
      void main(){
        float y = vI.y, k = mod(vI.x, 3.);
        float ndv = abs(dot(normalize(vN), normalize(cameraPosition - vWP)));
        float flow = fbm(vec2(vI.z * 1.1 + vI.w, y * .34 - uTime * (7. + vI.w)));
        float fil = smoothstep(.25, .8, flow);
        vec3 col = k < .5 ? uMag : k < 1.5 ? uVio : mix(uOra, uMag, .25);
        col = mix(col, col * .6 + vec3(.5, .35, .3), fil * fil * .22);
        float along = (exp(-max(y - 8., 0.) / 7.) * .95 + uTail * exp(-y / 140.)) * smoothstep(300., 215., y) * smoothstep(3.2, 6.5, y);
        float torn = smoothstep(max(vTear - .7, 0.), vTear, uTear);
        float alive = (1. - smoothstep(vTear - .12, vTear, uTear)) * smoothstep(torn * 1.1 - .2, torn * 1.1 + .05, fbm(vec2(y * .07 - uTime * 1.5, vI.w * 9.)) + .25 * (1. - torn));
        float I = pow(ndv, 1.6) * (.3 + .9 * fil) * along * alive * uFire;
        gl_FragColor = vec4(col * I * 1.45, 1.);
      }` }));
  streamers.frustumCulled = false; streamers.renderOrder = 2; group.add(streamers);
  return { group, sheath, streamers };
}

// sparks of ablating shield racing up the wake, and (kind 1) char flakes lifting off the cooling lip
function buildSparks(rng, detail, U) {
  const NSP = Math.round(400 * detail), NFL = Math.round(130 * detail), n = NSP + NFL, seed = [], cor = [], idx = [];
  for (let i = 0; i < n; i++) {
    const s = [rng(), rng(), rng(), rng()], kind = i < NSP ? 0 : 1;
    for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { seed.push(...s); cor.push(c[0], c[1], kind, 0); }
    idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 12), 3));
  g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 4)); g.setAttribute('aC', new THREE.Float32BufferAttribute(cor, 4));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(V3(0, 60, 0), 90);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: U,
    vertexShader: GLSL_PLASMA + /* glsl */`
      attribute vec4 aSeed, aC; uniform float uLipFx, uResY; uniform mat4 uWake; varying vec3 vQ; varying float vB;
      void main(){
        vec3 P, dir = vec3(0., 1., 0.); float len, wid;
        if (aC.z < .5) {
          float age = fract(aSeed.x + uTime * (.5 + aSeed.y * .8));
          float y = -.5 + age * 7. + age * age * (40. + 90. * aSeed.z);
          float th = aSeed.w * 6.2831853 + y * .03 + uTime * .2;
          float r = mix(2.2 + 1.5 * smoothstep(-.5, 3.5, y), wakeR(y) * (.7 + .55 * aSeed.z), smoothstep(2.5, 15., y)) + .3 * sin(aSeed.x * 40. + y * .4);
          P = vec3(sin(th) * r, y, cos(th) * r) + kink(y) * smoothstep(3., 12., y) + bendAt(y); P = (uWake * vec4(P, 1.)).xyz;
          dir = normalize(mat3(uWake) * vec3(sin(th) * .35 * (1. - smoothstep(0., 6., y)), 1., cos(th) * .35 * (1. - smoothstep(0., 6., y))));
          len = .5 + age * 5.; wid = .03; vB = (1. - age) * (1. - age) * smoothstep(0., .03, age) * uFire * (.5 + aSeed.y);
        } else {
          float age = fract(aSeed.x + uTime * (.1 + aSeed.y * .12)), th = aSeed.w * 6.2831853 + age * (aSeed.z - .5);
          float r = 2.0 + age * (.15 + aSeed.z * .7), y = .6 + age * (.5 + aSeed.y * 2.4);
          P = vec3(sin(th) * r, y, cos(th) * r) + vec3(sin(uTime * 1.7 + aSeed.x * 50.), 0., cos(uTime * 1.3 + aSeed.y * 50.)) * .06 * age;
          dir = normalize(vec3(sin(uTime * 3. * aSeed.y + aSeed.x * 9.), 1., cos(uTime * 2.3 * aSeed.z)));
          len = .014 + .02 * aSeed.z; wid = len * (.3 + .4 * aSeed.y); vB = -uLipFx * (1. - age) * smoothstep(0., .1, age);
        }
        vec4 mv = viewMatrix * modelMatrix * vec4(P, 1.);
        vec3 av = normalize(mat3(viewMatrix) * mat3(modelMatrix) * dir), sd = cross(av, mv.xyz); sd /= max(length(sd), 1e-6);
        float px = 2. * max(-mv.z, .05) / (projectionMatrix[1][1] * uResY);
        if (aC.z > .5) vB *= smoothstep(.35, .9, -mv.z);
        mv.xyz += av * aC.y * len * .5 + sd * aC.x * max(wid, .8 * px);
        vQ = vec3(aC.xy, aSeed.z); gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uOra; varying vec3 vQ; varying float vB;
      void main(){
        float s = vB >= 0. ? (1. - vQ.x * vQ.x) * (1. - vQ.y * vQ.y) * smoothstep(-1., .2, vQ.y) : smoothstep(1., .75, abs(vQ.x) + abs(vQ.y) * (.6 + .8 * vQ.z));
        vec3 col = vB >= 0. ? mix(uOra * 1.6, vec3(2.6, 2.0, 1.3), vQ.z * smoothstep(-.2, 1., vQ.y)) * vB : vec3(1.8, .3, .06) * -vB;
        gl_FragColor = vec4(col * s, 1.);
      }` }));
  m.frustumCulled = false; m.renderOrder = 4;
  return m;
}

// thruster plumes (two cones) and the pyro flash (one billboard) in one additive mesh
function buildFx(K, U) {
  const P = [], A = [], idx = []; let n = 0; const p = V3();
  for (const [k, side] of [['thrL', -1], ['thrR', 1]]) {
    const F = wallFrame(K.feats[k][0] + K.rot, K.feats[k][1], 0.12), base = n, NS = 12, NL = 6;
    for (let j = 0; j <= NL; j++) for (let i = 0; i <= NS; i++) { const f = j / NL, a = (i / NS) * TAU, r = 0.1 + 0.55 * Math.pow(f, 0.8); p.set(Math.cos(a) * r, Math.sin(a) * r, f * 2.6).applyMatrix4(F); P.push(p.x, p.y, p.z); A.push(side, f, a, 0); n++; }
    for (let j = 0; j < NL; j++) for (let i = 0; i < NS; i++) { const q = base + j * (NS + 1) + i; idx.push(q, q + 1, q + NS + 1, q + 1, q + NS + 2, q + NS + 1); }
  }
  for (const c of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { P.push(0, APEX_Y + 0.15, 0); A.push(c[0], c[1], 0, 2); }
  idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aA', new THREE.Float32BufferAttribute(A, 4));
  g.setIndex(idx); g.boundingSphere = new THREE.Sphere(V3(0, 2, 0), 12);
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, uniforms: U,
    vertexShader: /* glsl */`
      attribute vec4 aA; uniform float uFlash; uniform vec2 uThr; varying vec4 vA; varying float vI;
      void main(){
        vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.); vA = aA;
        if (aA.w > 1.) { mv.xy += aA.xy * 3.2 * step(.002, uFlash); vI = uFlash; } else vI = aA.x < 0. ? uThr.x : uThr.y;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: GLSL_NOISE + /* glsl */`
      uniform float uTime; uniform vec3 uVio; varying vec4 vA; varying float vI;
      void main(){
        vec3 col;
        if (vA.w > 1.) { float r = length(vA.xy); col = vec3(3.2, 2.3, 1.3) * (exp(-r * r * 7.) + .25 * exp(-r * 2.5) * (1. - smoothstep(.6, 1., r))) * vI; }
        else { float f = vA.y, nz = vn(vec2(vA.z * 3., f * 6. - uTime * 30.)); col = mix(vec3(1.7, 1.6, 1.9), uVio, smoothstep(0., .5, f)) * (1. - f) * (1. - f) * (.35 + .65 * nz) * vI * .8; }
        gl_FragColor = vec4(col, 1.);
      }` }));
  m.frustumCulled = false; m.renderOrder = 5;
  return m;
}

// piecewise smooth keyframes: list of [t, value]
function keyed(list, t) {
  if (t <= list[0][0]) return list[0][1];
  for (let i = 1; i < list.length; i++) if (t < list[i][0]) return lerp(list[i - 1][1], list[i][1], smoothstep(list[i - 1][0], list[i][0], t));
  return list[list.length - 1][1];
}

// ---------------------------------------------------------------- the hero
export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork('splashdown-hero'), detail = ctx.quality?.detail ?? 1;
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map((h) => new THREE.Color(h));
  const skin = opts.skin || rng.pick(['tile', 'tile', 'tile', 'tile', 'foil', 'gumdrop']);
  const pattern = opts.pattern || rng.pick(['blocks', 'blocks', 'blocks', 'quarters', 'onegore']);
  const lagThird = opts.lagThird ?? rng.chance(0.1);
  const lagAt = opts.lagAt ?? 22.6;                      // flight second at which the lagging third main bangs open
  const spread0 = (opts.spread ?? 22) * DEG, ring0 = rng.range(-0.25, 0.25), breatheP = [rng() * TAU, rng() * TAU, rng() * TAU];
  const object = new THREE.Group(); object.name = 'splashdown-hero';
  const C3 = (c, k = 1) => new THREE.Vector3(c.r * k, c.g * k, c.b * k), u = (v) => ({ value: v });

  // shared uniforms
  const SU = {
    uTime: u(0), uResY: u(450), uGlow: u(1.2), uFlash: u(0),
    uSunDir: u((opts.sunDir ? opts.sunDir.clone() : V3(-0.80, 0.40, -0.45)).normalize()), uSunCol: u(C3(new THREE.Color('#FFD9A0'), 1.25)),
    uSky: u(C3(new THREE.Color('#4A4F9A'), 1.9)), uBounce: u(C3(pal[3], 0.3)),
  };
  const PU = {
    uTime: SU.uTime, uResY: SU.uResY, uFlash: SU.uFlash, uFire: u(0), uTear: u(0), uLipFx: u(0), uThr: u(new THREE.Vector2()), uTail: u(0.07), uBend: u(V3()), uWake: u(new THREE.Matrix4()),
    uMag: u(C3(pal[2], 1.55)), uVio: u(C3(pal[1], 1.9)), uOra: u(C3(pal[6], 1.25).add(V3(0.1, 0.22, 0.05))),
    uKinkA: u(new THREE.Vector4(1, 0, -9, 0)), uKinkB: u(new THREE.Vector4(-1, 0, -9, 0)),
  };
  const capU = { ...SU, uFire: PU.uFire, uLip: u(0), uWet: u(0), uGlossK: u(opts.gloss ?? 1), uThr: PU.uThr, uMag: PU.uMag, uVio: PU.uVio, uOra: PU.uOra };

  // capsule, cover, pod
  // (yields between the steps: none of them draws from ctx.rng, and the forks are taken in the same order as before)
  const K0 = buildCapsule(rng.fork('capsule'), skin, detail);
  await ctx.yield?.();
  const K = dressCapsule(K0, rng.fork('dress'));
  await ctx.yield?.();
  const capMat = capsuleMaterial(capU);
  const capsule = new THREE.Mesh(K.G.build(), capMat); object.add(capsule);
  await ctx.yield?.();
  const pod = new THREE.Mesh(K.pod.build(), capMat); pod.visible = opts.pod !== false; object.add(pod);
  const coverPivot = new THREE.Group(); coverPivot.position.set(0, APEX_Y, 0);
  const coverMesh = new THREE.Mesh(K.cover.build(), capMat); coverPivot.add(coverMesh); object.add(coverPivot);
  await ctx.yield?.();

  // fire
  const plasma = buildPlasma(rng.fork('plasma'), detail, PU); object.add(plasma.group); plasma.group.position.set(0, 1, 0); plasma.sheath.position.y = plasma.streamers.position.y = -1;
  const sparks = buildSparks(rng.fork('sparks'), detail, PU); object.add(sparks);
  const fx = buildFx(K, PU); object.add(fx);
  const bursts = []; { let t = rng.range(0.9, 1.5), side = rng.sign(); while (t < 5.9) { bursts.push({ t, side, amp: rng.range(1.1, 2.0) }); side = rng.chance(0.75) ? -side : side; t += rng.range(0.75, 1.5); } }
  await ctx.yield?.();

  // cloth
  const profiles = buildProfiles(), info = profiles.info;
  const orangeC = C3(pal[6], 0.8).add(V3(0, 0.02, 0)), whiteC = V3(0.76, 0.74, 0.70);
  if (pattern === 'quarters') orangeC.set(0.72, 0.045, 0.02);
  const canGeo = canopyGeometry(rng.fork('canopy'), pattern), lineGeo = linesGeometry(rng.fork('lines'));
  const fitAt = (i) => { const b = i * TAU / 3 + 0.4 + TAU / 6; return V3(Math.sin(b) * 0.585, APEX_Y + 0.03, Math.cos(b) * 0.585); };
  const mains = [];
  for (let i = 0; i < 3; i++) {
    const CU = {
      uProf: u(profiles.tex), uStage: u(3), uExtend: u(1), uPhase: u(rng() * TAU), uRipple: u(0), uRipA: u(0), uTremble: u(0), uBulge: u(0.5), uSquash: u(0), uInward: u(0),
      uOrigin: u(V3()), uAxis: u(V3(0, 1, 0)), uE1: u(V3(1, 0, 0)), uE2: u(V3(0, 0, 1)), uSag: u(0), uWaveF: u(2), uWaveA: u(0), uPuff: u(0), uDeploy: u(1), uFit: u(fitAt(i)),
      uOrange: u(orangeC), uWhite: u(whiteC),
    };
    const cloth = new THREE.Mesh(canGeo, clothMaterial({ ...SU, ...CU })); cloth.frustumCulled = false; object.add(cloth);
    const lines = new THREE.Mesh(lineGeo, linesMaterial({ ...SU, ...CU })); lines.frustumCulled = false; lines.renderOrder = 6; object.add(lines);
    const delay = i * 0.045 + rng.range(0, 0.03), lag = lagThird && i === 2;
    const keys = lag
      ? [[16.6, 0], [16.72, 1.15], [16.9, 0.93], [17.1, 1], [lagAt, 1], [lagAt + 0.08, 2.25], [lagAt + 0.2, 2.0], [lagAt + 0.42, 4], [lagAt + 0.75, 2.8], [lagAt + 1.05, 3.12], [lagAt + 1.35, 3]]
      : [[16.6, 0], [16.72, 1.15], [16.9, 0.93], [17.1, 1], [17.6, 1], [17.7, 2.25], [17.86, 1.9], [18.05, 2], [18.6, 2], [18.85, 4], [19.2, 2.8], [19.5, 3.12], [19.8, 3]];
    mains.push({ CU, cloth, lines, delay, keys, snaps: lag ? [16.6, lagAt, lagAt + 0.2] : [16.6, 17.6, 18.6], alpha: (210 + 120 * i) * DEG + ring0, axis: V3(0, 1, 0), stage: 3, extend: 1 });
  }
  await ctx.yield?.();
  const smallGeo = smallChuteGeometry(rng.fork('small'), [orangeC.x, orangeC.y, orangeC.z], [whiteC.x, whiteC.y, whiteC.z]);
  const smalls = [];
  for (let i = 0; i < 5; i++) {
    const SUi = { ...SU, uOpen: u(1), uLen: u(1), uSpin: u(rng() * TAU) };
    const mesh = new THREE.Mesh(smallGeo, smallChuteMaterial(SUi)); mesh.frustumCulled = false; if (i >= 2) mesh.scale.setScalar(0.42); object.add(mesh);
    smalls.push({ mesh, U: SUi, spin: rng.range(0.5, 1.1) * rng.sign(), ph: rng() * TAU });
  }

  // ---- cluster frame
  const A = V3(), e1 = V3(1, 0, 0), e2 = V3(), O = V3(), apex = V3(0, APEX_Y, 0), tmp = V3(), tmp2 = V3(), q = new THREE.Quaternion(), YUP = V3(0, 1, 0);
  let lean = (opts.lean ?? 35) * DEG;
  const lens = wallPoint(0, K.feats.pod[1], 0.75), wallN = V3(0, WALL_SA, WALL_CA), mT = new THREE.Matrix4();
  const setLean = (deg) => {
    lean = deg * DEG; A.set(0, Math.cos(lean), -Math.sin(lean)); e2.set(0, Math.sin(lean), Math.cos(lean)); O.copy(apex).addScaledVector(A, 8);
    // the wake leans with the cluster (the capsule flies at an angle of attack) and bends so the pod looks down its core
    plasma.group.rotation.x = -lean;
    PU.uWake.value.makeTranslation(0, 1, 0).multiply(mT.makeRotationX(-lean)).multiply(mT.makeTranslation(0, -1, 0));
    tmp.copy(lens).applyMatrix4(mT.copy(PU.uWake.value).invert()); PU.uBend.value.set(tmp.x, 0, tmp.z);
  };
  setLean(opts.lean ?? 35);
  const tumble = V3(rng.range(-1, 1), rng.range(-0.3, 0.3), rng.range(-1, 1)).normalize(), coverDrift = [rng.range(2, 5) * rng.sign(), rng.range(1, 3)];
  const drogueTilt = [-0.17, 0.17];
  const crownH = (st) => { const k = clamp(st, 0, 4), i0 = Math.floor(k), f = k - i0; return lerp(info[i0].hCrown, info[Math.min(4, i0 + 1)].hCrown, f); };
  const placeAxis = (m, i, st, time) => {
    const beta = spread0 * lerp(0.32, 1, smoothstep(0.9, 3, st)) + 0.012 * Math.sin(time * 0.52 + i * 2.1), al = m.alpha + 0.03 * Math.sin(time * 0.37 + i * 1.7);
    tmp.copy(e1).multiplyScalar(Math.cos(al)).addScaledVector(e2, Math.sin(al));
    m.axis.copy(A).multiplyScalar(Math.cos(beta)).addScaledVector(tmp, Math.sin(beta)).normalize();
    const E1 = m.CU.uE1.value.crossVectors(YUP, m.axis).normalize(), E2 = m.CU.uE2.value.crossVectors(m.axis, E1);
    m.CU.uAxis.value.copy(m.axis); m.CU.uOrigin.value.copy(O);
    tmp2.copy(A).addScaledVector(m.axis, -A.dot(m.axis)); m.CU.uInward.value = Math.atan2(tmp2.dot(E2), tmp2.dot(E1));
  };

  // ---- the script: everything from the flight time T (seconds of the brief's 40 s take)
  const state = { T: 0, fire: 0, lip: 0, flash: 0, jolt: 0, stage: [3, 3, 3], thruster: [0, 0] };
  let T = opts.restTime ?? 21, driven = false, frames = 0, clock = 0, doneT = NaN, doneClock = NaN;
  const setKink = (v, b) => { if (b) { const age = T - b.t; v.set(-b.side, 0.3 * b.side, age, b.amp * smoothstep(0, 0.15, age) * (1 - smoothstep(1.2, 3.2, age))); } else v.set(1, 0, -9, 0); };
  const apply = (time) => {
    clock = time; SU.uTime.value = time; state.T = T; doneT = T; doneClock = time;
    const warm = frames < 3;
    // fire
    const fire = 1 - smoothstep(6.3, 7.0, T), tear = clamp((T - 6.2) / 0.8, 0, 1), fireOn = T < 7.02;
    PU.uFire.value = fireOn ? fire * (0.93 + 0.07 * Math.sin(time * 23) * Math.sin(time * 7.3)) : 0; PU.uTear.value = tear; state.fire = fireOn ? fire : 0;
    const lip = T < 7 ? 1 : Math.max(1 - smoothstep(7, 13.2, T), 0.4 * smoothstep(26.6, 27.2, T) * (1 - smoothstep(28.8, 33, T)));
    capU.uLip.value = lip; state.lip = lip; PU.uLipFx.value = T > 6.8 && T < 14 ? Math.pow(lip, 0.7) * smoothstep(6.8, 7.6, T) : 0;
    let thL = 0, thR = 0, ka = null, kb = null;
    for (const b of bursts) { const age = T - b.t; if (age < 0 || !fireOn) continue; const p = smoothstep(0, 0.05, age) * (1 - smoothstep(0.22, 0.34, age)); if (b.side < 0) thL = Math.max(thL, p); else thR = Math.max(thR, p); kb = ka; ka = b; }
    PU.uThr.value.set(thL, thR); state.thruster[0] = thL; state.thruster[1] = thR;
    setKink(PU.uKinkA.value, ka); setKink(PU.uKinkB.value, kb);
    plasma.group.visible = sparks.visible = warm || fireOn || PU.uLipFx.value > 0; plasma.sheath.visible = plasma.streamers.visible = warm || fireOn;
    // cover and pyro flash
    const tc = T - 15, flash = tc < 0 || tc > 0.9 ? 0 : tc < 0.1 ? tc / 0.1 : Math.exp(-(tc - 0.1) / 0.11);
    SU.uFlash.value = flash; state.flash = flash; fx.visible = warm || flash > 0.002 || thL + thR > 0.001;
    if (tc <= 0) { coverPivot.position.copy(apex); coverPivot.quaternion.identity(); coverPivot.visible = true; }
    else { coverPivot.visible = tc < 3.2; coverPivot.position.copy(apex).addScaledVector(A, tc * 15 + 0.4).addScaledVector(e1, tc * coverDrift[0]).addScaledVector(e2, tc * coverDrift[1] - 2.2 * tc * tc); coverPivot.quaternion.setFromAxisAngle(tumble, tc * 8.5); }
    coverMesh.position.set(0, -APEX_Y, 0);
    // mains
    let jolt = tc > 0 ? Math.exp(-tc / 0.2) : 0;
    mains.forEach((m, i) => {
      const Te = T - m.delay, CU = m.CU, on = Te > 16.2;
      const ext = on ? lerp(0.03, 1, smoothstep(16.2, 16.6, Te)) : 0;
      let st = keyed(m.keys, Te);
      const settled = smoothstep(m.keys[m.keys.length - 1][0] - 0.4, m.keys[m.keys.length - 1][0] + 1.5, Te);
      st += settled * 0.075 * Math.sin((time * TAU) / 2.4 + breatheP[i]);
      m.stage = st; m.extend = ext; state.stage[i] = on ? st : 0;
      CU.uStage.value = clamp(st, 0, 4.4); CU.uExtend.value = ext;
      CU.uTremble.value = (1 - smoothstep(1.15, 2.9, st)) * (st < 0.5 ? 0.55 : 1) + 0.035 * settled;
      CU.uBulge.value = 0.16 + 0.42 * smoothstep(1.4, 3, st); CU.uSquash.value = 0.09 * smoothstep(2.5, 3, st) * (1 + 0.5 * Math.sin(time * 1.1 + i * 2));
      let k = -1; for (let j = 0; j < 3; j++) if (Te >= m.snaps[j]) k = j;
      let sag = 0.85, age = 9;
      if (k >= 0) { age = Te - m.snaps[k]; const prev = k === 0 ? 0.85 : [0.5, 0.42][k - 1], creep = k < 2 ? smoothstep(m.snaps[k] + 0.3, m.snaps[k + 1], Te) * [0.5, 0.42][k] : 0; sag = Math.max(prev * (1 - smoothstep(0, 0.07, age)), creep); if (i === 0 || m.snaps[k] > 20) jolt = Math.max(jolt, Math.exp(-age / 0.2)); }
      CU.uSag.value = sag; CU.uWaveF.value = age < 0.45 ? (age / 0.34) * 1.15 : 2; CU.uWaveA.value = age < 0.45 ? 1 - age / 0.45 : 0; CU.uPuff.value = age < 1.1 ? age / 1.1 : 0;
      const rt = Te - m.snaps[2] - 0.12; CU.uRipple.value = clamp(rt / 0.95, 0, 1); CU.uRipA.value = rt > 0 && rt < 0.95 ? 0.85 * Math.sin((rt / 0.95) * Math.PI) : 0;
      CU.uDeploy.value = on ? smoothstep(16.2, 16.35, Te) : 0;
      placeAxis(m, i, st, time);
      m.cloth.visible = m.lines.visible = warm || on;
      // pilot chute rides above the crown
      const pil = smalls[2 + i]; pil.mesh.visible = warm || on;
      pil.mesh.position.copy(O).addScaledVector(m.axis, crownH(st) * ext + 0.3); pil.mesh.quaternion.setFromUnitVectors(YUP, tmp.copy(m.axis).addScaledVector(e1, 0.05 * Math.sin(time * 1.3 + i * 2)).normalize());
      pil.U.uOpen.value = on ? 0.82 + 0.1 * Math.sin(time * 5 + i) : 0; pil.U.uLen.value = on ? 1 : 0; pil.U.uSpin.value = pil.ph + time * pil.spin;
    });
    state.jolt = jolt;
    // drogues: stream at 15.0, bloom by 15.8, cut away at 16.2
    for (let i = 0; i < 2; i++) {
      const d = smalls[i], cut = T - 16.2, on = T > 15.02 && cut < 1.7;
      d.mesh.visible = warm || on;
      tmp.copy(A).addScaledVector(e1, drogueTilt[i] + 0.03 * Math.sin(time * 2.3 + i * 3)).addScaledVector(e2, 0.03 * Math.sin(time * 1.9 + i)).normalize();
      d.mesh.quaternion.setFromUnitVectors(YUP, tmp); d.mesh.position.copy(apex); if (cut > 0) d.mesh.position.addScaledVector(tmp, cut * 34 + cut * cut * 14);
      d.U.uLen.value = on ? smoothstep(15.02, 15.42, T) : 0; d.U.uSpin.value = d.ph + time * d.spin * 1.6;
      d.U.uOpen.value = on ? keyed([[15.36, 0], [15.72, 1.13], [15.9, 0.94], [16.1, 1]], T) * (1 - 0.65 * smoothstep(0, 0.5, cut)) : 0;
    }
  };

  // ---- anchors (local space, mains open)
  setLean(opts.lean ?? 35);
  const axisOpen = (i) => { const al = (210 + 120 * i) * DEG + ring0; return A.clone().multiplyScalar(Math.cos(spread0)).addScaledVector(e1, Math.cos(al) * Math.sin(spread0)).addScaledVector(e2, Math.sin(al) * Math.sin(spread0)).normalize(); };
  const center = V3(0, 38, -26);
  const anchors = {
    mounts: {
      along: { position: lens.clone(), target: lens.clone().addScaledVector(A, 20), up: wallN.clone() },
      image: { position: lens.clone(), target: lens.clone().addScaledVector(A, 20).add(V3(0, -6, -7)), up: wallN.clone() },
      outward: { position: V3(0, 1.25, 1.80), target: V3(0, 1.25 - 0.707, 1.80 + 0.707), up: V3(0, 1, 0) },
    },
    apex: apex.clone(), confluence: O.clone(), clusterAxis: A.clone(), wakeAxis: A.clone(), wakeEnd: V3(0, 1, 0).addScaledVector(A, 300),
    crowns: [0, 1, 2].map((i) => O.clone().addScaledVector(axisOpen(i), info[3].hCrown)),
    canopyCenters: [0, 1, 2].map((i) => O.clone().addScaledVector(axisOpen(i), info[3].hSkirt + 5)),
    drogues: drogueTilt.map((t) => apex.clone().addScaledVector(A.clone().addScaledVector(e1, t).normalize(), SMALL_LR + 7)),
    thrusters: [wallPoint(K.feats.thrL[0] + K.rot, K.feats.thrL[1], 0.1), wallPoint(K.feats.thrR[0] + K.rot, K.feats.thrR[1], 0.1)],
    window: wallPoint(K.feats.winA[0] + K.rot, K.feats.winA[1], 0),
    portalSeat: { position: V3(0, -12, 0), normal: V3(0, 1, 0), radius: 7 },
    flyThrough: [V3(44, 6, 78), V3(22, 8, 40), V3(12, 6, 14), V3(10, 2, -6), V3(15, -4, -32), V3(26, -8, -64)],
    viewpoints: [{ position: V3(60, 20, 110), target: center.clone() }, { position: V3(-95, 60, -20), target: V3(0, 40, -28) }, { position: V3(4.5, 2.2, 6), target: V3(0, 1.4, 0) }],
  };

  const size = new THREE.Vector2();
  const hero = {
    object, radius: 40, height: 70, center, anchors, ground: false, groundY: 0, state, pod, capsule, skin, pattern, lagThird, bursts,
    uniforms: { shared: SU, plasma: PU, capsule: capU, mains: mains.map((m) => m.CU) },
    setProgress(p) { hero.setFlightTime(clamp(p, 0, 1) * 40); },
    setFlightTime(t, time) { T = t; driven = true; apply(time ?? clock); },      // pass this frame's clock and update() will not apply again
    setSun(dir, color) { SU.uSunDir.value.copy(dir).normalize(); if (color) SU.uSunCol.value.set(color.r, color.g, color.b); },
    setAmbient(sky, bounce) { if (sky) SU.uSky.value.set(sky.r, sky.g, sky.b); if (bounce) SU.uBounce.value.set(bounce.r, bounce.g, bounce.b); },
    setWet(w) { capU.uWet.value = w; },
    setLean(deg) {
      setLean(deg); apply(clock);
      const M = anchors.mounts; M.along.target.copy(lens).addScaledVector(A, 20); M.image.target.copy(M.along.target).add(V3(0, -6, -7));
      anchors.confluence.copy(O); anchors.clusterAxis.copy(A); anchors.wakeAxis.copy(A); anchors.wakeEnd.set(0, 1, 0).addScaledVector(A, 300);
      for (let i = 0; i < 3; i++) { anchors.crowns[i].copy(O).addScaledVector(axisOpen(i), info[3].hCrown); anchors.canopyCenters[i].copy(O).addScaledVector(axisOpen(i), info[3].hSkirt + 5); }
    },
    canopyWorld(i, out = V3()) { const m = mains[i]; return out.copy(O).addScaledVector(m.axis, lerp(info[3].hSkirt, crownH(m.stage), 0.5) * m.extend).applyMatrix4(object.matrixWorld); },
    update(dt, time, camera) {
      if (ctx.renderer) SU.uResY.value = Math.max(64, ctx.renderer.getDrawingBufferSize(size).y);
      if (opts.demo && !driven) T = time % 42;
      if (doneT !== T || doneClock !== time) apply(time);
      frames++;
    },
    dispose() { profiles.tex.dispose(); },
  };
  object.userData.hero = hero;
  apply(0);
  return hero;
}
