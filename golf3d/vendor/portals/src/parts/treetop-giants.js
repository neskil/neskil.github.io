// HEADS ABOVE THE POPLARS - hero set piece for the world "treetop-giants" (mid-Oligocene Turgai, 28 million years ago).
//
// The leader at feed. An old Paraceratherium cow (a hornless rhinoceros 4.8 m at the withers) stands in a sea of gold
// willow scrub beside a clump of young poplars taller than she is. Only her withers, neck and head ride above the
// leaves. She lifts her head into the spire, wraps her pointed lip round a bough, drags it down and sideways, lets
// it whip back in a burst of yellow leaves that the wind carries off, then chews and turns one small eye to the
// camera. Behind her the family stands and walks in the willow, each walker trailing a closing wake of thrashing
// crowns. Everything moves: legs (two-bone IK with planted feet), neck, jaw, lip, ears, eyelids, tail, breathing
// flanks, sliding shoulder blades, every crown, the silver gust fronts, the flickering poplar leaves, the air.
//
// LOCAL SPACE  origin = the ground under the leader's body, +Y up. She faces +Z (the piece's front) and the herd is
//   behind her at -Z. The camera of the brief comes in from +Z along her -X side at 8 m and curves right round her
//   rump; the low sun is meant to stand at -X so that side of her is lit. The poplar clump is at about (3.5, 0, 8).
// SIZE   willow patch radius 34 m (opts.willowRadius), tops 3.6-4.5 m; poplars 9-12 m; her head 6.2 m at ease and
//   about 7.3 m at the top of her reach. hero.radius/center are a CLOSE orbit of her head for the part viewer;
//   the true extent is anchors.extent (radius ~38 m about (0,4,-8), top 12.5 m).
// COST   110-125k triangles, 6 draw calls (adults, half-grown, willow, poplar leaves, wood, leaves in air), no lights,
//   no textures, about 60-80 ms of build in steps under 40 ms. Animals ~5.8k triangles each.
// LIGHT  All materials are custom shaders (linear HDR, scene fog) lit by uniforms. On the first update the piece
//   adopts the scene's first DirectionalLight (direction, colour x intensity / pi) and HemisphereLight; call
//   hero.setLight({ sunDir, sunColor, sky, ground }) (colours already divided by pi) if the light changes, or pass
//   opts.sunDir to fix the direction. It wants a low gold sun (16 degrees up) from -X at intensity ~3 and a cobalt
//   hemisphere at ~1. Shadow sides get a built-in fill (never below about a third of the key) and a burning rim.
//
// OPTS   palette      7 hex strings in the brief's order (gold, cobalt, hide, silver-sage, umber, teal, rust)
//        detail       0.6-1: thins the far willow and the leaves in the air only
//        season       'gold' | 'early' (half the willow green) | 'frost' (rime, half-bare spires); seeded if absent
//        wind         'steady' | 'calm' | 'blow' or a number; seeded if absent       windDir [x, z]
//        blizzard     true: the air is full of leaves (the brief's rare event; 10% of seeds)
//        herd         false: only the leader          herdCount  0-7 animals behind her (seeded 4-6)
//        willow       false: no willow patch (the world plants its own; see STYLE)    willowRadius
//        sunDir       [x,y,z] world direction toward the sun      adoptLight false      cycleSeconds (8)
//        progress     fixes the feed phase (same as hero.setProgress)
// HOOKS  hero.setProgress(p): p 0..1 runs ONE feed keyed to the camera: reach up 0-0.22, lip wraps the bough 0.3,
//        drag down and sideways to 0.58, release at 0.58 (the bough whips back, 300 leaves fly), chew and look at
//        the camera 0.6-0.9. Map the world's u so that 0.58 falls just before the closest pass. null = loop on time.
//        hero.headPosition(out) live head point for a poi; hero.herds.adults / .halves are the creature objects
//        (state[i], set(i, {...}), commit()); hero.uniforms.leaf.uAnim / uAnimS are the wake sources (8 slots).
// ANCHORS (local) leaderHead, withers, bough (where the lip takes it), clump (foot of her poplars), herd (start
//        points of the others), viewpoints { approach, closePass, behind }, flyThrough (9 points, the brief's
//        line, 6 m or more clear of every animal and stem), exitDir, sunSide (-X), windDir, extent. portalSeat is
//        null: this world's portal stands on the river island, not at the hero.
// EXPORTS makeParaceratherium(ctx, { age: 'adult' | 'half' | 'calf', count, palette }) -> { mesh, state, set, commit,
//        update(time), setLight, lipPoint, stride, rig }: one draw call of posed, walking animals for the world's
//        own herd (the mother and calf in the glade). Advance state.phase by distance / stride and feet never slide.
// STYLE  Naturalistic. Willow = instanced lumpy domes with whip-spray cards, alpha-tested procedural leaves, two-tone
//        side light, transmitted glow toward the sun, silver undersides in gusts and wakes (LEAF_VERT / LEAF_FRAG).
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const PALETTE = ['#E3B23C', '#2E5FA8', '#8C8377', '#C9C2B2', '#4A3A2A', '#6FA79A', '#B5562B'];
const lin = (hex) => new THREE.Color(hex);
const mixc = (a, b, t) => a.clone().lerp(b, t);
const TAU = Math.PI * 2;
const hash1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// ---------------------------------------------------------------------------------------------------------
// Mesh builder. Model space of an animal: nose +Z, up +Y, its left side +X, metres, feet on y = 0.
// Attributes: position, normal, color (linear), aBone (part, param, weight, surface), aPivot (joint).
//   part 0 body (param = nearest leg 0..3, weight = how far the shoulder/haunch muscle slides with that leg)
//        1 neck (param = 0 at the chest .. 1 at the skull)      2 head (weight = lip curl)
//        3 jaw    4 ear (param = side +-1)    5 tail (param = 0..1)    6 leg (param = leg 0 FL 1 FR 2 HL 3 HR)
//        7 eyelid (aPivot = how far it closes)
//   surface 0 hide, 1 eye (glossy, dark), 2 hoof / tusk (smooth horn), 3 hair (ear fuzz, tail tuft)
// ---------------------------------------------------------------------------------------------------------
class MB {
  constructor() { this.p = []; this.c = []; this.b = []; this.pv = []; this.idx = []; this.bone = [0, 0, 0, 0]; this.pivot = [0, 0, 0]; }
  get n() { return this.p.length / 3; }
  set(part, param = 0, weight = 0, surface = 0, pivot = null) { this.bone = [part, param, weight, surface]; if (pivot) this.pivot = pivot; return this; }
  v(x, y, z, c) { this.p.push(x, y, z); this.c.push(c.r, c.g, c.b); this.b.push(...this.bone); this.pv.push(...this.pivot); return this.n - 1; }
  quad(a, b, c, d) { this.idx.push(a, b, c, a, c, d); }
  tri(a, b, c) { this.idx.push(a, b, c); }
  // Loft in the sagittal plane: secs = [{ y, z, a (tilt of the ring's up axis, rad; 0 = upright ring facing +Z),
  //   up, dn, hw (radii above / below / to the side), e (superellipse exponent, 2 = ellipse), x (centre offset),
  //   dk (colour multiplier, for a fold's groove), t (param written to aBone.y), w (weight to aBone.z) }]
  // col(upness -1..1, side -1..1, sec, i) -> THREE.Color ; mod(theta, i, sec) -> radial factor
  loft(secs, sides, col, o = {}) {
    const rows = [], first = this.n;
    for (let i = 0; i < secs.length; i++) {
      const s = secs[i], row = [], ca = Math.cos(s.a || 0), sa = Math.sin(s.a || 0), e = 2 / (s.e || 2);
      if (s.t !== undefined) this.bone[1] = s.t;
      if (s.w !== undefined) this.bone[2] = s.w;
      for (let j = 0; j < sides; j++) {
        const th = (j / sides) * TAU, cs = Math.cos(th), sn = Math.sin(th);
        const m = o.mod ? o.mod(th, i, s) : 1;
        const px = Math.sign(cs) * Math.pow(Math.abs(cs), e) * s.hw * m;
        const pu = Math.sign(sn) * Math.pow(Math.abs(sn), e) * (sn > 0 ? s.up : s.dn) * m;
        const c = col(sn, cs, s, i); if (s.dk) c.multiplyScalar(s.dk);
        row.push(this.v((s.x || 0) + px, s.y + pu * ca, s.z - pu * sa, c));
      }
      rows.push(row);
    }
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < sides; j++) {
      const j1 = (j + 1) % sides; this.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]);
    }
    if (o.capStart) this.cap(rows[0], true);
    if (o.capEnd) this.cap(rows[rows.length - 1], false);
    return [first, this.n];
  }
  cap(row, flip) {
    let x = 0, y = 0, z = 0; const c = new THREE.Color(0, 0, 0);
    for (const i of row) { x += this.p[i * 3]; y += this.p[i * 3 + 1]; z += this.p[i * 3 + 2]; c.r += this.c[i * 3]; c.g += this.c[i * 3 + 1]; c.b += this.c[i * 3 + 2]; }
    const n = row.length; c.multiplyScalar(1 / n); const k = this.v(x / n, y / n, z / n, c);
    for (let j = 0; j < n; j++) { const a = row[j], b = row[(j + 1) % n]; if (flip) this.tri(k, b, a); else this.tri(k, a, b); }
  }
  // Loft along a 3D polyline with elliptical rings (legs, ears, tail, tusks). pts [[x,y,z]], rad [[rSide, rFore]] in
  // the frame (side = +X-ish, fore = +Z-ish); col(i, theta) -> Color. per-ring hook o.ring(i) may set bone values.
  limb(pts, rad, sides, col, o = {}) {
    const rows = [], first = this.n, N = pts.length, t = new THREE.Vector3(), ax = new THREE.Vector3(), az = new THREE.Vector3();
    for (let i = 0; i < N; i++) {
      const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(N - 1, i + 1)];
      t.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize();
      ax.set(1, 0, 0); if (o.side) ax.set(o.side[0], o.side[1], o.side[2]);
      ax.addScaledVector(t, -ax.dot(t)).normalize(); az.crossVectors(ax, t).multiplyScalar(-1);
      if (o.ring) o.ring(i, this);
      const row = [], r = rad[i];
      for (let j = 0; j < sides; j++) {
        const th = (j / sides) * TAU, cs = Math.cos(th), sn = Math.sin(th);
        const rf = sn > 0 ? (r[1]) : (r[2] !== undefined ? r[2] : r[1]);
        row.push(this.v(p[0] + ax.x * cs * r[0] + az.x * sn * rf, p[1] + ax.y * cs * r[0] + az.y * sn * rf, p[2] + ax.z * cs * r[0] + az.z * sn * rf, col(i, th)));
      }
      rows.push(row);
    }
    for (let i = 0; i < N - 1; i++) for (let j = 0; j < sides; j++) {
      const j1 = (j + 1) % sides; this.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]);
    }
    if (o.capStart) this.cap(rows[0], true);
    if (o.capEnd) this.cap(rows[N - 1], false);
    return [first, this.n];
  }
  // squashed ellipsoid lump (toe hooves, eye, muscle pads)
  blob(cx, cy, cz, rx, ry, rz, col, seg = 6) {
    const rows = [];
    for (let i = 0; i <= seg; i++) {
      const ph = (i / seg) * Math.PI, row = [];
      for (let j = 0; j < seg * 2; j++) { const th = (j / (seg * 2)) * TAU; row.push(this.v(cx + Math.sin(ph) * Math.cos(th) * rx, cy + Math.cos(ph) * ry, cz + Math.sin(ph) * Math.sin(th) * rz, col(Math.cos(ph), th))); }
      rows.push(row);
    }
    for (let i = 0; i < seg; i++) for (let j = 0; j < seg * 2; j++) { const j1 = (j + 1) % (seg * 2); this.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]); }
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    g.setAttribute('aBone', new THREE.Float32BufferAttribute(this.b, 4));
    g.setAttribute('aPivot', new THREE.Float32BufferAttribute(this.pv, 3));
    g.setIndex(this.idx); g.computeVertexNormals();
    return g;
  }
}

// ---------------------------------------------------------------------------------------------------------
// Paraceratherium: a hornless rhinoceros built like a giant heavy horse. All numbers below are adult metres
// (4.8 m at the withers); a half-grown animal and a calf are separate models with their own proportions
// (bigger head and ears, shallower barrel, lankier legs, fewer folds), then sized to their shoulder height.
// ---------------------------------------------------------------------------------------------------------
const AGES = {
  adult: { h: 4.8, head: 1.1, ear: 0.9, depth: 1.0, width: 1.0, leg: 1.22, neck: 1.0, fold: 1.0, ribs: 1.0, brown: 0.0 },
  half: { h: 3.4, head: 1.18, ear: 1.1, depth: 0.93, width: 0.92, leg: 1.1, neck: 0.96, fold: 0.65, ribs: 0.4, brown: 0.3 },
  calf: { h: 2.2, head: 1.32, ear: 1.5, depth: 0.84, width: 0.84, leg: 0.98, neck: 0.86, fold: 0.3, ribs: 0.0, brown: 1.0 },
};
const NECK_EL = 40 * Math.PI / 180, HEAD_EL = -14 * Math.PI / 180;

export function paraceratheriumGeometry(age = 'adult', pal = PALETTE, noise = null, pending = false) {
  const A = AGES[age] || AGES.adult, k = A.h / 4.8, m = new MB();
  const cHide = mixc(mixc(lin(pal[2]), lin('#6c7689'), 0.8).multiplyScalar(0.8), lin('#8a7c72'), A.brown * 0.7), cDark = mixc(lin(pal[4]).multiplyScalar(0.62), cHide, 0.1 + 0.25 * A.brown);
  const cBelly = mixc(lin(pal[3]), cHide, 0.35), cHorn = lin('#3a3128'), cTusk = lin('#d8cdb4'), cEye = lin('#0b0806');
  const n3 = noise ? (x, y, z) => noise.n3(x, y, z) : (x, y, z) => Math.sin(x * 1.7 + y * 2.3) * Math.cos(z * 1.9 + y);
  // hide colour from where a point sits on its ring: pale below, grey flank, dark stripe along the spine
  const hideAt = (up, y, z, stripe = 1) => {
    const c = cBelly.clone().lerp(cHide, smoothstep(-0.85, -0.1, up));
    c.lerp(cDark, smoothstep(0.6, 0.92, up) * 0.94 * stripe);
    const mott = 0.5 + 0.5 * n3(z * 1.3, y * 1.3, up * 2.0), fine = 0.5 + 0.5 * n3(z * 5.1, y * 5.1, up * 6.0);
    return c.multiplyScalar(0.76 + 0.2 * mott + 0.1 * fine);
  };
  const ringCol = (sn, cs, s) => hideAt(sn, s.y, s.z, s.stripe === undefined ? 1 : s.stripe);

  // ---- torso: rump -> chest. [z, top, bottom, halfWidth, exponent]; shoulder higher than hip, back sloping down
  const yB = 2.42, D = A.depth, W = A.width;
  const T = [[-2.34, 3.66, 3.0, 0.4, 2], [-2.2, 4.02, 2.74, 0.8, 2.1], [-1.9, 4.25, 2.62, 1.06, 2.2], [-1.45, 4.35, yB + 0.14, 1.17, 2.3],
    [-1.0, 4.36, yB + 0.08, 1.2, 2.4], [-0.5, 4.39, yB - 0.04, 1.25, 2.5], [0.0, 4.45, yB - 0.10, 1.26, 2.5], [0.5, 4.57, yB - 0.12, 1.22, 2.4],
    [0.95, 4.72, yB - 0.07, 1.12, 2.2], [1.3, 4.80, yB + 0.02, 1.0, 1.9], [1.6, 4.72, yB + 0.14, 0.9, 1.9], [1.88, 4.50, yB + 0.4, 0.74, 2], [2.12, 4.2, 3.2, 0.45, 2]];
  m.set(0, 0, 0, 0, [0, 0, 0]);
  m.loft(T.map(([z, top, bot0, hw, e]) => {
    const bot = top - (top - bot0) * D, yc = bot + 0.56 * (top - bot);
    return { y: yc, z, up: top - yc, dn: yc - bot, hw: hw * W, e };
  }), 26, ringCol, { capStart: true, capEnd: true,
    // faint ribs on the barrel, a hollow in front of the hip and a ridge of withers
    mod: (th, i, s) => { const flank = Math.max(0, Math.cos(th)) ** 2 + Math.max(0, -Math.cos(th)) ** 2; return 1 + 0.012 * A.ribs * flank * Math.sin(s.z * 14.0) * smoothstep(-1.2, -0.6, s.z) * smoothstep(0.9, 0.3, s.z); } });

  // ---- shoulder and haunch muscle masses (slide with their leg in the shader)
  for (const sx of [1, -1]) {
    m.set(0, sx > 0 ? 0 : 1, 1);
    m.blob(sx * 0.8 * W, 3.5, 1.2, 0.33 * W, 1.05, 0.66, (u, th) => hideAt(u * 0.6, 3.5 + u, 1.2, 0), 7);
    m.set(0, sx > 0 ? 2 : 3, 1);
    m.blob(sx * 0.82 * W, 3.42, -1.32, 0.46 * W, 1.0, 0.9, (u, th) => hideAt(u * 0.6, 3.4 + u, -1.3, 0), 7);
  }

  // ---- neck: thick as a barrel at the chest, rising at 40 degrees, with fold rings at its base and behind the jaw
  const Ln = 2.48 * A.neck, nb = [3.95, 1.7], nd = [Math.sin(NECK_EL), Math.cos(NECK_EL)], F = A.fold;
  // smooth profile [s, up, dn, halfWidth], then creases cut into it: four ringing the base, two behind the jaw,
  // each a narrow shadowed groove between two swollen lips (real geometry, so the raking sun lights the lips)
  const NP = [[-0.4, 0.98, 1.12, 0.74], [0.0, 0.93, 1.02, 0.71], [0.42, 0.83, 0.88, 0.63], [0.72, 0.735, 0.77, 0.555], [1.1, 0.61, 0.63, 0.465], [1.5, 0.47, 0.49, 0.36], [1.82, 0.43, 0.45, 0.33], [2.04, 0.42, 0.44, 0.325], [2.2, 0.40, 0.42, 0.315]];
  const npAt = (s0) => { let i = 0; while (i < NP.length - 2 && NP[i + 1][0] < s0) i++; const a = NP[i], b = NP[i + 1], t = clamp((s0 - a[0]) / (b[0] - a[0]), 0, 1); return [s0, lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)]; };
  const NK = [[...npAt(-0.4).slice(0), 1], [...npAt(-0.1), 1]];
  const groove = (s0, depth, w) => { const d = depth * F; for (const [ds, mul, dk] of [[-w, 1 + 0.035 * d, 1], [0, 1 - 0.07 * d, 1 - 0.18 * d], [w, 1 + 0.04 * d, 1.02]]) { const r = npAt(s0 + ds); NK.push([r[0], r[1] * mul, r[2] * mul, r[3] * mul, dk]); } };
  groove(0.08, 1.0, 0.07); groove(0.4, 0.75, 0.06); groove(0.86, 0.45, 0.05);
  NK.push([...npAt(1.1), 1], [...npAt(1.4), 1]);
  groove(1.9, 0.6, 0.05);
  NK.push([...npAt(2.06), 1], [...npAt(2.2), 1]);
  m.set(1, 0, 0, 0, [0, nb[0], nb[1]]);
  m.loft(NK.map(([s0, up, dn, hw, dk]) => {
    const s = s0 * A.neck * (s0 > 0 ? 2.48 / 2.2 : 1);
    const nf = lerp(1.1, 1.02, clamp(s / Ln, 0, 1));
    return { y: nb[0] + nd[0] * s, z: nb[1] + nd[1] * s, a: NECK_EL, up: up * nf, dn: dn * nf * 1.05, hw: hw * nf, e: 2.1, dk, t: clamp(s / Ln, 0, 1) };
  }), 20, ringCol);

  // ---- skull: long, narrow, low domed forehead, straight profile, NO horn, ending in a pointed mobile lip
  const hp = [nb[0] + nd[0] * Ln, nb[1] + nd[1] * Ln], hd = [Math.sin(HEAD_EL), Math.cos(HEAD_EL)], hu = [Math.cos(HEAD_EL), -Math.sin(HEAD_EL)], HS = A.head;
  const headPt = (s, u, x) => [x * HS, hp[0] + (hd[0] * s + hu[0] * u) * HS, hp[1] + (hd[1] * s + hu[1] * u) * HS];
  const SK = [[-0.2, 0.34, 0.37, 0.28, 0, 0], [0.04, 0.39, 0.40, 0.31, 0, 0], [0.24, 0.405, 0.36, 0.315, 0, 0], [0.44, 0.375, 0.22, 0.295, 0, 0], [0.64, 0.32, 0.16, 0.255, 0, 0],
    [0.84, 0.265, 0.135, 0.22, 0, 0], [1.02, 0.225, 0.12, 0.195, 0.1, 0], [1.15, 0.185, 0.115, 0.165, 0.35, -0.01], [1.25, 0.125, 0.10, 0.115, 0.7, -0.04], [1.33, 0.05, 0.05, 0.05, 1, -0.085]];
  m.set(2, 0, 0, 0, [0, hp[0], hp[1]]);
  m.loft(SK.map(([s, up, dn, hw, w, dy]) => { const c = headPt(s, dy, 0); return { y: c[1], z: c[2], a: HEAD_EL, up: up * HS, dn: dn * HS, hw: hw * HS, e: 2.2, w, stripe: 0.5 }; }), 16, (sn, cs, s) => hideAt(0.3 + 0.7 * sn, s.y, s.z, 0.32).multiplyScalar(sn < -0.3 ? 0.7 : 1), { capEnd: true });
  // ---- lower jaw: deep cheek at the back, slim chin; hinged below the eye, grinds sideways
  const jp = headPt(0.16, -0.2, 0);
  const JW = [[0.1, -0.2, 0.14, 0.2, 0.27], [0.34, -0.27, 0.12, 0.21, 0.265], [0.6, -0.25, 0.08, 0.13, 0.205], [0.85, -0.215, 0.06, 0.095, 0.16], [1.04, -0.185, 0.05, 0.07, 0.125], [1.14, -0.17, 0.03, 0.035, 0.06]];
  m.set(3, 0, 0, 0, jp);
  m.loft(JW.map(([s, dy, up, dn, hw]) => { const c = headPt(s, dy, 0); return { y: c[1], z: c[2], a: HEAD_EL, up: up * HS, dn: dn * HS, hw: hw * HS, e: 2.2, stripe: 0 }; }), 12, (sn, cs, s) => hideAt(0.1 + 0.3 * sn, s.y, s.z, 0).multiplyScalar(0.9), { capStart: true, capEnd: true });
  const q = { A, k, hp, hd, hu, HS, nb, Ln, headPt, jp, hideAt, cDark, cHide, cHorn, cTusk, cEye, pal };
  return pending ? { m, q } : finishPara(m, q);
}
// The same geometry built in two steps with the page handed back between them, and kept for this build:
// await prepareParaceratherium(ctx, age, palette) before makeParaceratherium and that call costs almost nothing.
const PREP = new WeakMap();
const prepKey = (age, pal) => age + '|' + pal.join(',');
export async function prepareParaceratherium(ctx, age = 'adult', pal = PALETTE) {
  let map = PREP.get(ctx); if (!map) PREP.set(ctx, map = new Map());
  const key = prepKey(age, pal); if (map.has(key)) return map.get(key);
  if (ctx.yield) await ctx.yield();
  const half = paraceratheriumGeometry(age, pal, ctx.noise, true);
  if (ctx.yield) await ctx.yield();
  const fin = finishPara(half.m, half.q, true);
  if (ctx.yield) await ctx.yield();
  const done = fin(); map.set(key, done);
  if (ctx.yield) await ctx.yield();
  return done;
}

// leg rows: [s (m down from the pivot), rSide, rFore, rBack, colourMultiplier]
const FORE = [[-0.55, 0.33, 0.42, 0.42, 1], [0, 0.36, 0.45, 0.46, 1], [0.4, 0.34, 0.40, 0.48, 1], [0.72, 0.31, 0.34, 0.53, 1], [0.82, 0.29, 0.31, 0.44, 0.9], [0.98, 0.27, 0.30, 0.34, 1],
  [1.3, 0.225, 0.25, 0.25, 1], [1.7, 0.19, 0.21, 0.2, 1], [1.9, 0.195, 0.23, 0.2, 1], [1.97, 0.185, 0.225, 0.19, 0.9], [2.1, 0.235, 0.31, 0.22, 1], [2.22, 0.2, 0.235, 0.2, 0.9],
  [2.3, 0.195, 0.215, 0.2, 1], [2.55, 0.165, 0.17, 0.17, 1], [2.9, 0.16, 0.165, 0.17, 1], [3.08, 0.19, 0.2, 0.225, 1], [3.2, 0.24, 0.275, 0.26, 0.85], [3.34, 0.275, 0.315, 0.275, 1], [3.42, 0.255, 0.295, 0.255, 0.8]];
const HIND = [[-0.6, 0.38, 0.6, 0.55, 1], [0, 0.4, 0.57, 0.5, 1], [0.3, 0.36, 0.47, 0.42, 0.92], [0.42, 0.35, 0.44, 0.41, 1], [0.78, 0.29, 0.34, 0.33, 1], [1.2, 0.22, 0.24, 0.27, 1],
  [1.42, 0.2, 0.2, 0.31, 1], [1.56, 0.21, 0.215, 0.35, 1], [1.68, 0.19, 0.19, 0.26, 0.9], [1.8, 0.18, 0.18, 0.21, 1], [2.15, 0.165, 0.17, 0.18, 1], [2.5, 0.165, 0.17, 0.18, 1],
  [2.68, 0.19, 0.2, 0.225, 1], [2.8, 0.24, 0.275, 0.26, 0.85], [2.94, 0.275, 0.315, 0.275, 1], [3.02, 0.255, 0.295, 0.255, 0.8]];
const LEGS = { fore: { py: 3.4, pz: 1.22, px: 0.72, L1: 2.1, L2: 1.32, rows: FORE }, hind: { py: 2.95, pz: -1.22, px: 0.74, L1: 1.56, L2: 1.46, rows: HIND } };

function finishPara(m, q, pending = false) {
  const { A, k, hp, hu, hd, HS, headPt, jp, hideAt, cDark, cHide, cHorn, cTusk, cEye, pal } = q, W = A.width;
  const cInner = mixc(lin('#a08878'), cHide, 0.6), cSilt = mixc(lin(pal[3]), lin('#a89a80'), 0.6).multiplyScalar(0.8);
  for (const sx of [1, -1]) {
    // eye mid-skull with a lid that closes, a brow, a nostril high on the muzzle
    const e = headPt(0.5, 0.105, sx * 0.262);
    m.set(2, 0, 0, 1, [0, hp[0], hp[1]]); m.blob(e[0], e[1], e[2], 0.05 * HS, 0.05 * HS, 0.058 * HS, () => cEye.clone(), 5);
    m.set(7, 0, 0, 0, [0, -hu[0] * 0.062 * HS, -hu[1] * 0.062 * HS]);
    const l = headPt(0.5, 0.158, sx * 0.25); m.blob(l[0], l[1], l[2], 0.062 * HS, 0.05 * HS, 0.085 * HS, (u) => hideAt(0.3, l[1], l[2], 0).multiplyScalar(0.8 + 0.15 * u), 5);
    m.set(2, 0, 0, 0, [0, hp[0], hp[1]]);
    const lo = headPt(0.5, 0.04, sx * 0.262); m.blob(lo[0], lo[1], lo[2], 0.05 * HS, 0.035 * HS, 0.08 * HS, () => hideAt(0, lo[1], lo[2], 0).multiplyScalar(0.72), 4);
    const no = headPt(1.11, 0.135, sx * 0.1); m.set(2, 0, 0.3, 0); m.blob(no[0], no[1], no[2], 0.03 * HS, 0.022 * HS, 0.05 * HS, () => cDark.clone().multiplyScalar(0.35), 4);
    // peg tusks: two down from the upper jaw, two forward from the lower
    const u0 = headPt(1.1, -0.09, sx * 0.075), u1 = headPt(1.12, -0.19, sx * 0.075);
    m.set(2, 0, 0, 2); m.limb([u0, u1], [[0.024 * HS, 0.024 * HS], [0.008, 0.008]], 5, () => cTusk.clone(), { capEnd: true });
    const d0 = headPt(1.07, -0.185, sx * 0.045), d1 = headPt(1.2, -0.16, sx * 0.05);
    m.set(3, 0, 0, 2, jp); m.limb([d0, d1], [[0.022 * HS, 0.022 * HS], [0.007, 0.007]], 5, () => cTusk.clone(), { capEnd: true });
    // mule ear: a cupped leaf on a narrow stalk, set at the poll, swivelling about its base
    const eb = headPt(0.05, 0.33, sx * 0.2), EL = 0.46 * A.ear, pts = [], rad = [];
    const dir = new THREE.Vector3(sx * 0.42, hu[0] * 0.95 - hd[0] * 0.2, hu[1] * 0.95 - hd[1] * 0.2).normalize();
    const ER = [[0, 0.05, 0.045], [0.18, 0.085, 0.04], [0.42, 0.125, 0.03], [0.7, 0.105, 0.022], [0.9, 0.055, 0.015], [1, 0.008, 0.006]];
    for (const [t, w, th] of ER) { pts.push([eb[0] + dir.x * t * EL, eb[1] + dir.y * t * EL - 0.02 * t * t, eb[2] + dir.z * t * EL - 0.05 * t * t * EL]); rad.push([w * A.ear * 0.95, th * A.ear]); }
    m.set(4, sx, 0, 0, eb);
    m.limb(pts, rad, 8, (i, th) => (Math.sin(th) > 0.2 ? cInner.clone() : hideAt(0.5, eb[1], eb[2], 0).multiplyScalar(0.85)), { side: [sx * 0.78, 0, -0.62], capEnd: true });
  }
  // tail: 1 m, carried down, a dark tuft
  const tb = [0, 3.74, -2.22], TP = [[0, 3.74, -2.2], [0, 3.56, -2.43], [0, 3.22, -2.52], [0, 2.9, -2.53], [0, 2.7, -2.53], [0, 2.42, -2.52], [0, 2.1, -2.5]];
  const TR = [0.16, 0.125, 0.095, 0.075, 0.13, 0.12, 0.02];
  m.set(5, 0, 0, 0, tb);
  m.limb(TP, TR.map((r) => [r, r]), 7, (i) => (i >= 3 ? mixc(cDark, cHide, 0.4) : hideAt(0.4, 3.3, -2.4, 0.6)), { ring: (i, mb) => { mb.bone[1] = i / 6; mb.bone[3] = i >= 4 ? 3 : 0; }, capEnd: true });
  // legs, modelled straight below their pivot; the shader poses them (two bones and a foot)
  let li = 0;
  for (const L of [LEGS.fore, LEGS.hind]) for (const sx of [1, -1]) {
    const px = sx * L.px * W, T = A.leg, hind = L === LEGS.hind;
    m.set(6, li++, 0, 0, [px, L.py, L.pz]);
    m.limb(L.rows.map(([s]) => [px, L.py - s, L.pz]), L.rows.map(([s, a, b, c]) => { const f = s < 0.5 ? lerp(1, T, clamp(s / 0.5 + 0.5, 0, 1)) : T; return [a * f, b * f, c * f]; }), 12,
      (i, th) => { const s = L.rows[i][0], out = Math.cos(th) * sx; return hideAt(-0.75 + 0.75 * smoothstep(-0.7, 0.4, out), L.py - s, L.pz + (hind ? 3 : 0), 0).multiplyScalar(L.rows[i][4]); }, { capEnd: true });
    // three blunt hooves round the front of the spread foot
    const yS = L.py - L.L1 - L.L2;
    m.bone[3] = 2;
    for (const [ox, oz, r] of [[0, 0.29, 0.115], [0.2, 0.19, 0.1], [-0.2, 0.19, 0.1]]) m.blob(px + ox * T, yS + 0.085, L.pz + oz * T, r * T, 0.1, r * 0.85 * T, (u) => cHorn.clone().multiplyScalar(0.8 + 0.5 * Math.max(0, u)), 4);
  }
  // silt dust to the knees, then size the whole animal to its shoulder height
  for (let i = 0; i < m.n; i++) {
    const y = m.p[i * 3 + 1], d = smoothstep(2.0, 0.3, y) * (m.b[i * 4 + 3] === 2 ? 0.12 : 0.5);
    m.c[i * 3] = lerp(m.c[i * 3], cSilt.r, d); m.c[i * 3 + 1] = lerp(m.c[i * 3 + 1], cSilt.g, d); m.c[i * 3 + 2] = lerp(m.c[i * 3 + 2], cSilt.b, d);
  }
  for (let i = 0; i < m.p.length; i++) { m.p[i] *= k; m.pv[i] *= k; }
  const fin = () => {
  const geometry = m.build(), lip = headPt(1.3, -0.12, 0);
  const rig = { age: A, k, h: A.h, neckBase: [0, q.nb[0] * k, q.nb[1] * k], headPivot: [0, hp[0] * k, hp[1] * k], jawPivot: jp.map((v) => v * k), lipTip: lip.map((v) => v * k),
    legs: [LEGS.fore.L1 * k, LEGS.fore.L2 * k, LEGS.hind.L1 * k, LEGS.hind.L2 * k], withers: [0, 4.8 * k, 1.3 * k], length: 7.2 * k };
  return { geometry, rig, triangles: m.idx.length / 3 };
  };
  return pending ? fin : fin();
}

// ---------------------------------------------------------------------------------------------------------
// Hide shader. The whole skeleton is solved in the vertex shader from per-instance attributes:
//   iA (x, y, z, heading)   iB (gait phase in strides, walk 0..1, seed, size)
//   iC (neck pitch, neck yaw, head pitch, head yaw; radians, added to the ambient life)
//   iD (chew 0..1, lip curl 0..1, ears back 0..1, dapple 0..1)
// Legs are two bones and a foot solved to a foot target that is still on the ground through the stance
// (stance travel = stride x duty), so a walking animal never slides when x,z advance by stride per unit phase.
// ---------------------------------------------------------------------------------------------------------
export const GLSL_NOISE = /* glsl */`
float h31(vec3 p){ p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
float vn3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(mix(h31(i), h31(i+vec3(1,0,0)), f.x), mix(h31(i+vec3(0,1,0)), h31(i+vec3(1,1,0)), f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)), h31(i+vec3(1,0,1)), f.x), mix(h31(i+vec3(0,1,1)), h31(i+vec3(1,1,1)), f.x), f.y), f.z); }
float h11(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
`;
const HIDE_VERT = /* glsl */`
attribute vec4 aBone; attribute vec3 aPivot; attribute vec4 iA, iB, iC, iD;
uniform float uTime, uStride, uK, uDuty; uniform vec3 uNeckBase, uHeadPiv, uJawPiv; uniform vec4 uLegs;
varying vec3 vCol, vN, vWorld, vRest; varying vec4 vInfo; varying float vDapple;
#include <fog_pars_vertex>
${GLSL_NOISE}
void rX(inout vec3 p, vec3 c, float a){ float s = sin(a), k = cos(a); vec3 d = p - c; p = c + vec3(d.x, d.y*k + d.z*s, d.z*k - d.y*s); }
void rY(inout vec3 p, vec3 c, float a){ float s = sin(a), k = cos(a); vec3 d = p - c; p = c + vec3(d.x*k + d.z*s, d.y, d.z*k - d.x*s); }
void rZ(inout vec3 p, vec3 c, float a){ float s = sin(a), k = cos(a); vec3 d = p - c; p = c + vec3(d.x*k - d.y*s, d.y*k + d.x*s, d.z); }
// where a foot is in its cycle: x = fore-aft position -0.5..0.5 of the stance travel, y = lift 0..1, z = stance progress 0..1 (or -1 in swing)
vec3 footCycle(float leg, float ph){
  float off = leg < 0.5 ? 0.25 : leg < 1.5 ? 0.75 : leg < 2.5 ? 0.0 : 0.5;
  float f = fract(ph + off), st = f / uDuty, sw = clamp((f - uDuty) / (1. - uDuty), 0., 1.);
  float e = sw*sw*sw*(sw*(sw*6.-15.)+10.);
  return f < uDuty ? vec3(0.5 - st, 0., st) : vec3(e - 0.5, sin(sw * 3.14159), -1.);
}
void main(){
  vec3 p = position, n = normal;
  float part = aBone.x, ph = iB.x, walk = iB.y, seed = iB.z, t = uTime + seed * 23.7;
  float S = uStride * uDuty;
  // the body rides over the planted feet: bob twice a stride, sway once, breathe
  vec3 bodyOff = vec3(0.045 * uK * sin(6.2832 * ph), -0.04 * uK * (0.5 + 0.5 * cos(12.566 * ph)), 0.) * walk;
  if (part > 5.5 && part < 6.5) {
    float leg = aBone.y; bool hind = leg > 1.5;
    float L1 = hind ? uLegs.z : uLegs.x, L2 = hind ? uLegs.w : uLegs.y, LL = L1 + L2;
    vec3 fc = footCycle(leg, ph);
    float stand = (h11(leg + seed * 7.) - 0.5) * 0.5 * uK * (1. - walk);
    vec2 P = vec2(aPivot.z + fc.x * walk * 0.3 * uK, aPivot.y + bodyOff.y);
    vec2 Ft = vec2(aPivot.z + fc.x * S * walk + stand, fc.y * walk * 0.42 * uK);
    vec2 d = Ft - P; float dl0 = max(length(d), 1e-3); vec2 dn = d / dl0;
    float dl = clamp(dl0, abs(L1 - L2) + 0.02, LL * 0.9995);
    float a = (L1*L1 - L2*L2 + dl*dl) / (2. * dl), h = sqrt(max(L1*L1 - a*a, 0.));
    vec2 K = P + dn * a + vec2(-dn.y, dn.x) * h * (hind ? -1. : 1.);
    vec2 Fe = P + dn * dl, u1 = (K - P) / L1, u2 = (Fe - K) / L2;
    float s = aPivot.y - p.y; vec2 rel = vec2(p.z - aPivot.z, p.y - aPivot.y), nr = vec2(n.z, n.y);
    // upper bone (fades into the body above the joint), lower bone, level foot
    vec2 ra = vec2(-u1.y * rel.x - u1.x * rel.y, u1.x * rel.x - u1.y * rel.y), na = vec2(-u1.y * nr.x - u1.x * nr.y, u1.x * nr.x - u1.y * nr.y);
    float w0 = smoothstep(-0.55 * uK, 0.2 * uK, s);
    vec2 A = P + mix(rel + vec2(0., 0.), ra, w0); na = mix(nr, na, w0);
    vec2 r2 = vec2(rel.x, rel.y + L1);
    vec2 B = K + vec2(-u2.y * r2.x - u2.x * r2.y, u2.x * r2.x - u2.y * r2.y), nb = vec2(-u2.y * nr.x - u2.x * nr.y, u2.x * nr.x - u2.y * nr.y);
    float wK = smoothstep(L1 - 0.24 * uK, L1 + 0.24 * uK, s);
    vec2 q = mix(A, B, wK), nq = mix(na, nb, wK);
    float pitch = fc.y * 0.7 * walk + (fc.z > 0. ? smoothstep(0.84, 1., fc.z) * 0.14 * walk : 0.);   // toes hang in swing, heel lifts at push-off
    float spread = 1. + 0.1 * (fc.z > 0. ? smoothstep(0., 0.12, fc.z) : 0.) * walk + 0.05 * (1. - walk);
    vec2 r3 = vec2(rel.x, rel.y + LL) * vec2(spread, 1.); float cp = cos(pitch), sp = sin(pitch);
    vec2 C = Fe + vec2(r3.x * cp + r3.y * sp, r3.y * cp - r3.x * sp);
    float wF = smoothstep(LL - 0.46 * uK, LL - 0.3 * uK, s);
    q = mix(q, C, wF); nq = mix(nq, nr, wF);
    p.x = aPivot.x + (p.x - aPivot.x) * mix(1., spread, wF) + bodyOff.x * clamp(1. - s / LL, 0., 1.);
    p.z = q.x; p.y = q.y; n = normalize(vec3(n.x, nq.y, nq.x) + vec3(1e-5, 0., 0.));
  } else {
    if (part < 0.5) {
      // shoulder blades and haunches slide under the skin with their leg; the flank breathes
      p.z += footCycle(aBone.y, ph).x * walk * 0.3 * uK * aBone.z;
      p.x += sign(p.x) * 0.018 * uK * sin(t * 1.15) * smoothstep(1.3 * uK, -0.2 * uK, abs(p.z + 0.2 * uK));
    } else if (part < 1.5 || (part > 1.5 && part < 4.5) || part > 6.5) {
      // ambient life: chew, ear flicks, a slow blink, small looks about, a nod once a stride
      float chew = iD.x, flickT = t * 0.42 + aBone.y * 0.31, fl = fract(flickT);
      float flick = smoothstep(0., 0.05, fl) * (1. - smoothstep(0.05, 0.22, fl)) * step(0.35, h11(floor(flickT) + seed));
      float bl = fract(t / 6.0), blink = smoothstep(0., 0.02, bl) * (1. - smoothstep(0.03, 0.07, bl));
      if (part > 2.5 && part < 3.5) { rX(p, uJawPiv, -(0.05 + 0.05 * sin(t * 6.2832)) * chew - 0.02); p.x += 0.04 * uK * sin(t * 6.2832 + 1.2) * chew; }
      if (part > 3.5 && part < 4.5) { rY(p, aPivot, aBone.y * (0.9 * flick - 0.25 + 0.18 * sin(t * 0.7 + aBone.y)) ); rX(p, aPivot, -0.55 * iD.z - 0.3 * flick); }
      if (part > 6.5) p += aPivot * blink;
      if (part > 1.5 && part < 2.5) p += vec3(0., -0.11, -0.09) * uK * aBone.z * iD.y + vec3(0.02 * sin(t * 6.2832 + 0.6) * chew * aBone.z * uK, 0., 0.);
      float w = part < 1.5 ? aBone.y : 1.;
      float nP = iC.x + 0.045 * walk * sin(6.2832 * ph + 0.8) + 0.012 * sin(t * 0.9);
      float nY = iC.y + 0.05 * sin(t * 0.37 + seed);
      if (part > 1.5) {
        vec3 n1 = p + n; float hP = iC.z - 0.03 * walk * sin(6.2832 * ph + 0.3), hY = iC.w + 0.06 * sin(t * 0.53 + 2. * seed);
        rX(p, uHeadPiv, hP); rY(p, uHeadPiv, hY); rX(n1, uHeadPiv, hP); rY(n1, uHeadPiv, hY); n = n1 - p;
      }
      vec3 n2 = p + n; float ww = w * w * (3. - 2. * w);
      rX(p, uNeckBase, nP * ww); rY(p, uNeckBase, nY * w); rX(n2, uNeckBase, nP * ww); rY(n2, uNeckBase, nY * w); n = n2 - p;
    } else {
      float sw = (0.3 * sin(t * 1.4) + 0.5 * sin(t * 0.61 + 2.) * sin(t * 2.9)) * aBone.y;   // tail switches
      rZ(p, aPivot, sw); rX(p, aPivot, -0.12 * aBone.y * walk * sin(12.566 * ph));
    }
    p += bodyOff;
  }
  float ch = cos(iA.w), sh = sin(iA.w);
  p *= iB.w; vec3 wp = vec3(p.x * ch + p.z * sh, p.y, p.z * ch - p.x * sh) + iA.xyz;
  vec3 wn = vec3(n.x * ch + n.z * sh, n.y, n.z * ch - n.x * sh);
  vec4 world = modelMatrix * vec4(wp, 1.);
  vWorld = world.xyz; vN = normalize(mat3(modelMatrix) * wn + vec3(0., 1e-5, 0.));
  vCol = color; vRest = position / uK; vInfo = vec4(part, aBone.y, aBone.w, seed); vDapple = iD.w;
  vec4 mvPosition = viewMatrix * world; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
export const LIGHT_PARS = /* glsl */`uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol; uniform float uTime;`;
const HIDE_FRAG = /* glsl */`
${LIGHT_PARS}
uniform float uFold, uGlade;
varying vec3 vCol, vN, vWorld, vRest; varying vec4 vInfo; varying float vDapple;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)), toC = cameraPosition - vWorld; float dist = max(length(toC), 1e-3); vec3 V = toC / dist;
  if (!gl_FrontFacing) N = -N;
  float part = vInfo.x, surf = vInfo.z, hide = surf < 0.5 ? 1. : 0., near = 1. - smoothstep(22., 70., dist), close = 1. - smoothstep(8., 26., dist);
  // skin at two scales: broad mottle, then a crackle of wrinkles, with fold rings round neck and limbs
  float m1 = vn3(vRest * 1.7 + vInfo.w * 9.), m2 = vn3(vRest * 4.3 + 3.1);
  float w1 = abs(vn3(vRest * vec3(13., 19., 13.)) - 0.5) * 2., w2 = abs(vn3(vRest * vec3(34., 46., 34.) + 7.) - 0.5) * 2.;
  float crack = (1. - smoothstep(0.0, 0.2, w1)) * 0.36 * near + (1. - smoothstep(0., 0.25, w2)) * 0.5 * close;
  // folds: rings round the neck, at knee, hock and fetlock, behind the elbow and in front of the stifle
  bool isNeck = part > 0.5 && part < 1.5, isLeg = part > 5.5 && part < 6.5;
  float ringc = isNeck ? vInfo.y * 20. + 3.6 * sin(vInfo.y * 8.3 + vInfo.w * 2.) : isLeg ? vRest.y * 30. : (vRest.z + vRest.y * 0.22) * 16.;
  float fmask = isNeck ? (0.2 + 0.8 * smoothstep(0.5, 0.0, vInfo.y) + 0.7 * smoothstep(0.7, 1., vInfo.y)) * (0.6 + 0.4 * smoothstep(0.3, 0.7, m2))
              : isLeg ? 0.5 * max(1. - smoothstep(0.1, 0.42, abs(vRest.y - 1.35)), 1. - smoothstep(0.05, 0.25, abs(vRest.y - 0.42)))
              : (part < 0.5 ? max(1. - smoothstep(0.15, 0.55, abs(vRest.z - 0.6)), 1. - smoothstep(0.15, 0.55, abs(vRest.z + 0.7))) * smoothstep(4.1, 3.2, vRest.y) * smoothstep(0.55, 0.85, abs(vRest.x)) : 0.);
  float fph = ringc + (m1 - 0.5) * 5. + (m2 - 0.5) * 2.; float fold = smoothstep(0.55, 1., sin(fph)) * uFold * fmask, crest = smoothstep(0.4, 1., sin(fph + 1.1)) * uFold * fmask;
  float rib = (part < 0.5) ? smoothstep(0.3, 1., sin(vRest.z * 13.5 + vRest.y * 1.2)) * smoothstep(0.75, 1.05, abs(vRest.x)) * smoothstep(-1.3, -0.5, vRest.z) * smoothstep(0.9, 0.2, vRest.z) : 0.;
  float sideK = smoothstep(0.45, 0.8, abs(vRest.x)), eD = vRest.z - 0.66 - 0.22 * (vRest.y - 3.0) + (m2 - 0.5) * 0.12, sD = vRest.z + 0.62 + 0.3 * (vRest.y - 3.0) + (m2 - 0.5) * 0.12, hD = vRest.z + 1.72 - 0.42 * (vRest.y - 3.3) + (m1 - 0.5) * 0.15;
  float lowK = smoothstep(4.05, 3.35, vRest.y) * sideK * (part < 0.5 ? 1. : 0.);
  float crease = max(max(1. - smoothstep(0.02, 0.13, abs(eD)), 1. - smoothstep(0.02, 0.12, abs(sD))), (1. - smoothstep(0.02, 0.1, abs(hD))) * 0.8) * lowK * uFold;
  float lipL = max(max(1. - smoothstep(0.05, 0.3, abs(eD - 0.26)), 1. - smoothstep(0.05, 0.3, abs(sD + 0.26))), 1. - smoothstep(0.05, 0.28, abs(hD + 0.24))) * lowK * uFold;
  float blade = (part < 0.5) ? (1. - smoothstep(0.0, 0.1, abs(vRest.z - 1.05 + 0.3 * (vRest.y - 3.6) + (m1 - 0.5) * 0.1))) * smoothstep(4.5, 4.1, vRest.y) * smoothstep(3.0, 3.5, vRest.y) * sideK * uFold : 0.;
  N = normalize(N + (vec3(m1 - 0.5, (w1 - 0.5) * 0.6, m2 - 0.5) * 0.42 + vec3(w2 - 0.5, 0., w1 - 0.5) * 0.3 * close) * near * hide);
  vec3 alb = vCol * mix(1., (1. - 0.3 * crease * (0.4 + 0.6 * near)) * (1. + 0.14 * lipL * near) * (1. - 0.22 * blade * near) * 1.08 * (0.84 + 0.26 * m1) * (0.92 + 0.16 * m2) * (1. - crack * 0.5) * (1. - (isNeck ? 0.2 : isLeg ? 0.3 : 0.26) * fold * near) * (1. + 0.1 * crest * near) * (1. - 0.2 * rib * uFold * near) * (1. + 0.1 * smoothstep(0.2, 1., sin(vRest.z * 13.5 + vRest.y * 1.2 + 2.2)) * rib * uFold * near), hide);
  // the broad pattern: a darker saddle over back and neck with a ragged lower edge, pale patches of dried silt on flank and haunch
  bool trunk = part < 1.5;
  float sad = trunk ? smoothstep(3.1, 4.3, vRest.y - (isNeck ? 0.9 * vInfo.y * 2.4 : 0.) + (m1 - 0.5) * 1.1 + (m2 - 0.5) * 0.4) : 0.;
  float pat = trunk ? smoothstep(0.52, 0.66, vn3(vRest * vec3(0.9, 1.3, 0.9) + vInfo.w * 3.)) * (1. - sad) * smoothstep(4.4, 3.4, vRest.y) : 0.;
  alb *= mix(1., 0.86, sad * hide); { float lum = dot(alb, vec3(0.3, 0.5, 0.2)); alb = mix(alb, alb * mix(vec3(1.36, 1.24, 1.06), vec3(0.86, 0.8, 0.7), smoothstep(0.16, 0.34, lum)), vDapple * hide); }   // under the gold ceiling the grey is lifted and warmed, never navy alb = mix(alb, alb * 1.22 + vec3(0.035, 0.03, 0.02), pat * 0.6 * hide);
  // low sun from the side, wrapped; sky above and gold leaf-light from below; coin dapples under the leaves
  float ndl = dot(N, uSunDir), diff = clamp((ndl + 0.12) / 1.12, 0., 1.); diff *= diff * (3. - 2. * diff) * 0.6 + 0.4;
  float dap = smoothstep(0.34, 0.72, vn3(vec3(vWorld.xz * 0.8 + uTime * vec2(0.3, 0.12), vWorld.y * 0.25)));
  float sunK = mix(1., 0.36 + 0.7 * dap, vDapple);   // soft pools of sun under the leaves, never hard coins that read as leaves stuck to the hide
  vec3 gnd = mix(mix(vec3(dot(uGroundCol, vec3(0.3, 0.5, 0.2))), uGroundCol, 0.45) * 0.6, uGroundCol, vDapple);
  vec3 hemi = mix(gnd, uSkyCol * 1.3, clamp(N.y * 0.5 + 0.55, 0., 1.)) * (0.5 + 0.5 * smoothstep(-0.5, 0.5, N.y + (m2 - 0.5) * 0.3));
  hemi += dot(uSunCol, vec3(0.3, 0.5, 0.2)) * mix(0.17, 0.29, vDapple) * mix(mix(vec3(0.8, 0.84, 0.95), vec3(1.0, 0.9, 0.66), vDapple), vec3(0.6, 0.8, 1.3), clamp(N.y * 0.5 + 0.5, 0., 1.));   // open sky and gold canopy: the shadow side is never black
  vec3 col = alb * (uSunCol * mix(vec3(0.84, 0.97, 1.22), vec3(1.), max(vDapple, 1. - hide)) * diff * sunK * 1.12 + hemi);
  float f3 = 1. - clamp(dot(N, V), 0., 1.); f3 = f3 * f3 * f3;
  col += uSunCol * vec3(1.15, 0.86, 0.42) * f3 * smoothstep(-0.1, 0.6, N.y) * (0.5 + 0.5 * clamp(ndl + 0.6, 0., 1.)) * mix(0.55, 0.25, vDapple) * (part > 1.5 && part < 4.5 ? 1.5 : 1.) * sunK;   // a thin gold line along nape, brow and ears
  // a burning rim along brow, ears and neck when the sun is behind the animal; a gold edge when it is lit
  float fres = 1. - clamp(dot(N, V), 0., 1.); fres *= fres;
  float back = clamp(dot(-V, uSunDir), 0., 1.), toSun = clamp(ndl + 0.55, 0., 1.);
  col += uSunCol * vec3(1.1, 0.88, 0.55) * (alb * 0.9 + 0.08) * fres * toSun * (0.3 + 3.6 * smoothstep(0.03, 0.75, back)) * sunK;
  if (part > 3.5 && part < 4.5 || surf > 2.5) col += uSunCol * vec3(1., 0.8, 0.55) * alb * (0.6 * back * back + 0.12 * fres) * sunK;   // ear fuzz, tail tuft
  vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.)); float nh = clamp(dot(N, H), 0., 1.);
  if (surf > 0.5 && surf < 1.5) { float s2 = nh * nh; s2 *= s2; s2 *= s2; s2 *= s2; s2 *= s2; col = alb * 0.4 + uSunCol * (s2 * s2 * 2.5 + smoothstep(0.78, 0.96, nh) * 1.5) + uSkyCol * fres * 0.7 + uSkyCol * 0.05;
    vec3 Hc = normalize(V + vec3(0., 0.75, 0.) + uSunDir * 0.45); col += vec3(1.0, 0.95, 0.85) * smoothstep(0.9, 0.97, clamp(dot(N, Hc), 0., 1.)) * 1.3; }   // a catchlight from the sky even in shade
  else { float s1 = nh * nh; s1 *= s1; s1 *= s1; col += uSunCol * s1 * (surf > 1.5 && surf < 2.5 ? 0.22 : 0.035) * sunK * clamp(ndl * 4., 0., 1.); }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

const lightUniforms = () => ({ uSunDir: { value: new THREE.Vector3(-0.92, 0.28, 0.27).normalize() }, uSunCol: { value: new THREE.Color(0.95, 0.8, 0.56) },
  uSkyCol: { value: new THREE.Color(0.17, 0.22, 0.33) }, uGroundCol: { value: new THREE.Color(0.2, 0.15, 0.06) }, uTime: { value: 0 } });

// One draw call of `count` animals of one age. set(i, {...}) poses an animal, commit() uploads, lipPoint(i) gives
// the world-space (group-local) position of the tip of its upper lip so a bough can be put in its mouth.
export function makeParaceratherium(ctx, o = {}) {
  const age = o.age || 'adult', count = o.count || 1, pal = o.palette || PALETTE;
  const prep = ctx && PREP.get(ctx), base = (prep && prep.get(prepKey(age, pal))) || paraceratheriumGeometry(age, pal, ctx && ctx.noise), rig = base.rig, g = new THREE.InstancedBufferGeometry();
  g.index = base.geometry.index; for (const k of Object.keys(base.geometry.attributes)) g.setAttribute(k, base.geometry.attributes[k]);
  const mk = (n, v) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(count * 4), 4); a.setUsage(THREE.DynamicDrawUsage); for (let i = 0; i < count; i++) a.setXYZW(i, v[0], v[1], v[2], v[3]); g.setAttribute(n, a); return a; };
  const iA = mk('iA', [0, 0, 0, 0]), iB = mk('iB', [0, 0, 0, 1]), iC = mk('iC', [0, 0, 0, 0]), iD = mk('iD', [0.6, 0, 0, 0]);
  g.instanceCount = count;
  const stride = (o.stride || 3.9) * rig.k * (age === 'calf' ? 0.73 : 1);
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, lightUniforms(), {
    uStride: { value: stride }, uK: { value: rig.k }, uDuty: { value: 0.68 }, uFold: { value: rig.age.fold }, uGlade: { value: 0 },
    uNeckBase: { value: new THREE.Vector3(...rig.neckBase) }, uHeadPiv: { value: new THREE.Vector3(...rig.headPivot) }, uJawPiv: { value: new THREE.Vector3(...rig.jawPivot) }, uLegs: { value: new THREE.Vector4(...rig.legs) } }]);
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: HIDE_VERT, fragmentShader: HIDE_FRAG, vertexColors: true, fog: true });
  const mesh = new THREE.Mesh(g, material); mesh.frustumCulled = false; mesh.name = 'paraceratherium-' + age;
  const state = []; for (let i = 0; i < count; i++) state.push({ x: 0, y: 0, z: 0, heading: 0, phase: 0, walk: 0, seed: i * 1.37, size: 1, neckPitch: 0, neckYaw: 0, headPitch: 0, headYaw: 0, chew: 0.6, lip: 0, ears: 0, dapple: 0 });
  const _p = new THREE.Vector3();
  const rot = (p, c, ax, a) => { const s = Math.sin(a), k = Math.cos(a), x = p.x - c[0], y = p.y - c[1], z = p.z - c[2]; if (ax === 0) p.set(c[0] + x, c[1] + y * k + z * s, c[2] + z * k - y * s); else p.set(c[0] + x * k + z * s, c[1] + y, c[2] + z * k - x * s); };
  return {
    mesh, object: mesh, material, uniforms, rig, stride, count, state, triangles: base.triangles * count,
    set(i, s) { Object.assign(state[i], s); return this; },
    commit() {
      for (let i = 0; i < count; i++) { const s = state[i]; iA.setXYZW(i, s.x, s.y, s.z, s.heading); iB.setXYZW(i, s.phase, s.walk, s.seed, s.size); iC.setXYZW(i, s.neckPitch, s.neckYaw, s.headPitch, s.headYaw); iD.setXYZW(i, s.chew, s.lip, s.ears, s.dapple); }
      iA.needsUpdate = iB.needsUpdate = iC.needsUpdate = iD.needsUpdate = true;
    },
    // the same chain as the shader (head about the occiput, then the neck about the chest), without the small ambient sways
    lipPoint(i, out = new THREE.Vector3(), local = rig.lipTip) {
      const s = state[i]; _p.set(local[0], local[1], local[2]);
      rot(_p, rig.headPivot, 0, s.headPitch); rot(_p, rig.headPivot, 1, s.headYaw); rot(_p, rig.neckBase, 0, s.neckPitch); rot(_p, rig.neckBase, 1, s.neckYaw);
      const ch = Math.cos(s.heading), sh = Math.sin(s.heading); _p.multiplyScalar(s.size);
      return out.set(_p.x * ch + _p.z * sh + s.x, _p.y + s.y, _p.z * ch - _p.x * sh + s.z);
    },
    setLight(L) { if (L.sunDir) uniforms.uSunDir.value.copy(L.sunDir).normalize(); if (L.sunColor) uniforms.uSunCol.value.copy(L.sunColor); if (L.sky) uniforms.uSkyCol.value.copy(L.sky); if (L.ground) uniforms.uGroundCol.value.copy(L.ground); },
    update(time) { uniforms.uTime.value = time; },
  };
}

// ---------------------------------------------------------------------------------------------------------
// Foliage: one shader for the willow sea (lumpy leaf domes with whip sprays) and the poplar leaf clusters.
// Base geometry carries aUv (u across -1..1, v along 0..1, kind: 0 dome, 1 willow spray, 2 poplar cluster).
// Instances: iP (x, y, z, size)   iQ (yaw, tilt, phase, tint -1..1)   iR (green 0..1, bough t 0..1, squash, spare)
// Wind rolls every crown, silver gust fronts cross the canopy (the leaf underside shows), and each animal
// (uAnim[i] = x, z, dirX, dirZ; uAnimS[i] = speed m/s, strength, body half-length) parts the crowns it stands
// in and trails a wake that thrashes for about three seconds: the wake's age is distance behind / speed.
// ---------------------------------------------------------------------------------------------------------
const NA = 8;
const LEAF_VERT = /* glsl */`
attribute vec3 aUv; attribute vec4 iP, iQ, iR;
uniform float uTime, uWind, uFlat; uniform vec2 uWindDir; uniform vec4 uAnim[${NA}]; uniform vec4 uAnimS[${NA}]; uniform vec3 uBough;
varying vec3 vN, vWorld, vObj, vUv; varying vec4 vVar; varying float vGust, vBig;
#include <fog_pars_vertex>
${GLSL_NOISE}
void main(){
  float kind = aUv.z, sz = iP.w, cy = cos(iQ.x), sy = sin(iQ.x), ct = cos(iQ.y), st = sin(iQ.y);
  vec3 p = position * vec3(sz, sz * iR.z, sz), n = normal;
  p = vec3(p.x, p.y * ct - p.z * st, p.z * ct + p.y * st); n = vec3(n.x, n.y * ct - n.z * st, n.z * ct + n.y * st);
  p = vec3(p.x * cy + p.z * sy, p.y, p.z * cy - p.x * sy); n = vec3(n.x * cy + n.z * sy, n.y, n.z * cy - n.x * sy);
  if (kind < 0.5 && iR.w < 0.5) { float lmp = vn3(position * 2.7 + iQ.z) - 0.42; p += vec3(n.x, n.y * 0.6, n.z) * lmp * 0.3 * sz; }
  vec3 c = iP.xyz, w = c + p;
  float hgt = kind < 0.5 ? clamp(position.y + 0.25, 0., 1.2) : 1.;
  // wind: a slow roll of each crown, a flutter of its sprays, and gust fronts that lay it over
  vec2 gp = c.xz * 0.028 - uWindDir * uTime * 0.21;
  float gust = smoothstep(0.44, 0.66, vn3(vec3(gp, 0.3)) * 0.75 + vn3(vec3(gp * 2.7, 1.7)) * 0.25 + 0.14 * (uWind - 1.));
  float roll = sin(uTime * 1.25 + iQ.z + c.x * 0.21) + 0.5 * sin(uTime * 2.9 + iQ.z * 1.7 + c.z * 0.4);
  float flut = sin(uTime * (kind > 1.5 ? 9.0 : 5.5) + iQ.z * 7. + position.x * 9. + position.z * 7.) * (kind > 0.5 ? 1. : 0.25);
  vec2 push = uWindDir * (0.09 * roll + 0.34 * gust + 0.045 * flut) * uWind * hgt * (kind > 1.5 ? 0.55 : 1.) * (kind < 0.5 ? sz * 0.5 : 1.);
  w.xz += push; w.y -= 0.35 * dot(push, push);
  if (kind > 0.5) w.y += 0.035 * flut * uWind;
  // the animals: crowns part round the body and thrash in the wake
  float thr = 0., trough = 0.;
  if (kind < 1.5) {
    for (int i = 0; i < ${NA}; i++) {
      vec4 a = uAnim[i]; vec4 s = uAnimS[i];
      vec2 rel = c.xz - a.xy; float al = dot(rel, a.zw); vec2 lat = rel - a.zw * al; float ld = length(lat);
      float behind = max(-al - s.z, 0.), age = behind / max(s.x, 0.05), ahead = max(al - s.z - 1.5, 0.);
      float near = (1. - smoothstep(1.3, 3.8, ld)) * (1. - smoothstep(0., 2.5, ahead)) * s.y;
      float fresh = exp(-age * 0.9) * near;
      vec2 side = ld > 0.05 ? lat / ld : vec2(a.w, -a.z);
      float wob = sin(age * 6.5 + iQ.z * 3.) * exp(-age * 0.75) * smoothstep(0., 0.5, age) * near;
      float partK = fresh * (1. - smoothstep(0., 1.2, age));
      w.xz += side * (0.55 * partK + 0.75 * wob) * hgt; w.y -= (0.2 * partK + 0.3 * abs(wob)) * hgt;
      // the parted trough: crowns on the line are laid outward and down for 10 m behind a walker (a hole round a stander),
      // dark inside, with the crowns along its edges turned silver side up
      float tl = mix(1.6, 10.5, smoothstep(0.1, 0.8, s.x)), alongK = (1. - smoothstep(0.3, 2.2, ahead)) * (1. - smoothstep(tl * 0.45, tl, behind)) * s.y;
      float tk = (1. - smoothstep(0.9, 2.9, ld)) * alongK, edgeK = smoothstep(1.4, 2.6, ld) * (1. - smoothstep(3.0, 4.6, ld)) * alongK;
      w.xz += side * tk * 1.25 * hgt; w.y -= tk * 1.55 * hgt;
      trough = max(trough, tk); thr += fresh + abs(wob) + 0.9 * edgeK;
    }
  }
  w += uBough * iR.y * iR.y;
  vec4 world = modelMatrix * vec4(w, 1.);
  vWorld = world.xyz; vN = normalize(mat3(modelMatrix) * n + vec3(0., 1e-5, 0.)); vObj = position; vUv = aUv;
  vVar = vec4(iQ.w, iR.x, iQ.z, clamp(trough, 0., 1.)); vBig = kind < 0.5 ? iR.w : sz; vGust = clamp(gust * min(uWind, 1.3) * (1. - uFlat) + 0.5 * thr + uFlat * 0.8, 0., 1.);
  vec4 mvPosition = viewMatrix * world; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LEAF_FRAG = /* glsl */`
${LIGHT_PARS}
uniform vec3 uGold, uSilver, uGreen, uPoplar, uFrost; uniform float uFrostK, uUnder; uniform sampler2D uShade; uniform vec4 uShadeST;
varying vec3 vN, vWorld, vObj, vUv; varying vec4 vVar; varying float vGust, vBig;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  float kind = vUv.z; vec3 toC = cameraPosition - vWorld; float dist = max(length(toC), 1e-3); vec3 V = toC / dist;
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.)); if (!gl_FrontFacing) N = -N;
  float detail = 1. - smoothstep(90., 160., dist), cell = 0.5, ao = 1., a = 1.;
  if (kind < 0.5) {
    // dome: streaks of narrow leaves hanging outward, dark gaps between sprays, a ragged cut-out edge
    vec3 q = vObj * vec3(8.5, 3.1, 8.5) + vVar.z;
    float n1 = vn3(q), n2 = vn3(q * 2.9 + 5.), n3v = vn3(vObj * 2.1 + vVar.z * 3.), nh = vn3(vObj * vec3(53., 21., 53.) + vVar.z * 5.);
    float edge = 1. - abs(dot(N, V));
    if (vBig > 0.5) {                                   // the tall crowns of the old wood keep their leaf-noise shell
      float dB = 1. - smoothstep(260., 520., dist), c1 = vn3(vObj * 6.3 + vVar.z), c2 = vn3(vObj * 13. + vVar.z * 2.);
      cell = c1 * 0.6 + c2 * 0.4;
      a = cell + 0.5 - edge * 0.95 * dB * (0.55 + 0.9 * c1) - smoothstep(0.1, -0.3, vObj.y) * 0.6;
      ao = (0.3 + 0.7 * smoothstep(-0.3, 0.8, vObj.y)) * (0.5 + 0.8 * smoothstep(0.3, 0.7, cell)) * (0.82 + 0.18 * n3v);
      N = normalize(N + (vec3(c1, 0.5, c2) - 0.5) * 0.7 + vec3(0., 0.1, 0.));
    } else {
      // a willow crown is ONE soft mass: a few broad lobes of spray, a fine leaf grain inside its tone, a dark foot, and a
      // ragged cut only along its outline (never holes through the body: at a distance those are pixel noise)
      // the core of a willow crown: a shaded mass under its sprays. Tufts of spray (a lit crest, a dark gap), and within 25 m
      // the narrow hanging leaves as pale dashes; never a hole through the body (at a distance those are pixel noise)
      float nearK = 1. - smoothstep(26., 64., dist), leafK = 1. - smoothstep(9., 26., dist); vec3 lp = vObj * vec3(5.6, 3.6, 5.6) + vVar.z * 1.7;
      float tuf = vn3(lp) * 0.62 + vn3(lp * 2.4 + 3.1) * 0.38, gap = smoothstep(0.32, 0.6, tuf);
      float dash = smoothstep(0.42, 0.66, vn3(vObj * vec3(19., 6., 19.) + vVar.z * 5.)), grain = (nh - 0.5) * detail * nearK;
      cell = clamp(0.5 + (tuf - 0.5) * 0.5 + (dash - 0.4) * 0.5 * leafK + grain * 0.3, 0., 1.);
      float midK = 1. - smoothstep(12., 38., dist);
      a = min(1. - smoothstep(0.02, -0.2, vObj.y + (n1 - 0.5) * 0.3), mix(1., 0.5 + (tuf - 0.31 - 0.2 * midK * smoothstep(0.45, 0.9, edge)) * 6., nearK));        // gaps between tufts, a hand wide and more; ragged at the foot
      ao = (mix(0.16, 0.5, uUnder) + mix(0.84, 0.5, uUnder) * smoothstep(-0.2, 0.85, vObj.y)) * mix(mix(0.78, mix(0.62, 0.8, uUnder), nearK) - 0.2 * midK, 1.08 + 0.06 * midK, gap) * mix(1., 0.84 + 0.28 * dash, leafK) * (1. + 0.2 * grain);
      float closeK = 1. - smoothstep(4.5, 13., dist), l1 = vn3(vObj * vec3(41., 8., 41.) + vVar.z * 3.), l2 = vn3(vObj * vec3(17., 23., 17.) + vVar.z * 7.), leafy = smoothstep(0.38, 0.6, l1 * 0.7 + l2 * 0.3);
      float holeK = closeK * mix(smoothstep(0.3, -0.15, vObj.y), 1., uUnder);                          // from above a crown is a closed mass of leaves; from beside and below it is sprays with air between
      ao *= mix(1., mix(0.3 + 1.0 * leafy * (0.7 + 0.6 * l2), 0.5 + 0.8 * leafy, uUnder), closeK); cell = mix(cell, clamp(0.25 + 0.7 * l1, 0., 1.), closeK * 0.7);
      a = min(a, mix(1., 0.5 + (l1 * 0.55 + l2 * 0.2 + tuf * 0.45 - 0.56 + 0.3 * smoothstep(0.75, 0.2, edge)) * 7., holeK));
      a = min(a, mix(1., 0.5 + (l2 * 0.6 + tuf * 0.5 + l1 * 0.3 - 0.62) * 7., (1. - smoothstep(6., 24., dist)) * smoothstep(0.5, 0.85, edge)));
      { float t2 = vn3(lp * 1.7 + 9.3), hole2 = (1. - smoothstep(13., 40., dist)) * (1. - closeK) * mix(smoothstep(0.3, -0.15, vObj.y), 1., uUnder);
        a = min(a, mix(1., 0.5 + (tuf * 0.6 + t2 * 0.5 - 0.63 + 0.2 * smoothstep(0.75, 0.2, edge)) * 7., hole2)); ao *= mix(1., 0.62 + 0.62 * smoothstep(0.3, 0.7, t2), hole2); }
      N = normalize(N + (vec3(tuf, 0.5, n3v) - 0.5) * 0.5 + (vec3(n1, 0.5, n2) - 0.5) * 0.3 * detail * nearK + (vec3(l1, 0.5, l2) - 0.5) * 0.8 * closeK);
    }
    if (vBig > 0.5) { float cl = vn3(vObj * 2.6 + vVar.z), cl2 = vn3(vObj * 6.1 + vVar.z * 2.); ao *= 0.7 + 0.5 * cl; a -= smoothstep(0.42, 0.24, cl * 0.6 + cl2 * 0.4) * 0.9 + smoothstep(0.25, -0.15, vObj.y) * 0.5 * cl2; }
  } else if (kind < 1.5) {
    // willow spray: many small narrow leaves at their own angles on a card (a thin shoot of them when kind is 1.25)
    float whip = step(1.1, kind), aLeaf = -4.; vec2 gs = mix(vec2(4.6, 9.2), vec2(1.4, 11.), whip), g0 = vec2(vUv.x * gs.x, vUv.y * gs.y) + vVar.z * vec2(1.3, 2.1);
    cell = 0.5;
    for (int L = 0; L < 2; L++) {
      float fl = float(L); vec2 g = g0 * (1. + 0.31 * fl) + fl * vec2(3.7, 1.9), id = floor(g), f = fract(g) - 0.5;
      float hc = h11(id.x * 7.3 + id.y * 13.7 + fl * 31. + floor(vVar.z * 4.)), ang = (hc - 0.5) * 2.4 + sign(vUv.x) * 0.45;
      vec2 q = f - (vec2(h11(hc * 9.1), h11(hc * 5.3)) - 0.5) * 0.4; float ca = cos(ang), sa = sin(ang); q = vec2(q.x * ca - q.y * sa, q.x * sa + q.y * ca);
      float l = clamp(abs(q.y) / 0.46, 0., 1.), al = (0.125 * (1. - l * l) - abs(q.x)) * 14. + 0.5 - step(0.8, hc) * 9.;
      if (al > aLeaf) { aLeaf = al; cell = hc; }
    }
    float rim = max(abs(vUv.x), abs(vUv.y * 2. - 1.) * mix(1., 0.9, whip));
    aLeaf -= smoothstep(0.8, 1., rim) * 4.;
    float farS = smoothstep(9., 30., dist), tuft = vn3(vec3(vUv.xy * vec2(3.4, 6.8) * mix(1., 0.6, whip), vVar.z * 3.)) * 0.7 + 0.3 * vn3(vec3(vUv.xy * vec2(2., 4.), vVar.z));
    a = mix(aLeaf, 0.5 + (tuft - 0.26 - 0.5 * rim * rim - 0.2 * whip) * 6., farS); cell = mix(cell, tuft, farS);
    ao = (0.62 + 0.38 * smoothstep(0., 0.6, vUv.y)) * (0.78 + 0.44 * vn3(vec3(vUv.xy * vec2(7., 15.), vVar.z * 5.)));
    N = normalize(N + (vec3(cell, h11(cell * 3.), h11(cell * 7.)) - 0.5) * 0.7 * (1. - farS) + vec3(0., 0.35, 0.) * farS);
  } else {
    // poplar cluster: round leaves on long stalks, each turning on its own
    vec2 cuv = vec2(vUv.x * 0.5, vUv.y) * max(vBig, 0.3); float rim = length(vec2(vUv.x, vUv.y * 2. - 1.)), aLeaf = -4.; cell = 0.5;
    for (int L = 0; L < 2; L++) {
      float fl = float(L), cs = L == 0 ? 0.83 : 0.36, sn = L == 0 ? 0.56 : -0.93;
      vec2 g = vec2(cuv.x * cs - cuv.y * sn, cuv.x * sn + cuv.y * cs) * (L == 0 ? 8.2 : 6.6) + vVar.z * (1. + fl * 2.7); g.x += 0.5 * mod(floor(g.y), 2.);
      vec2 id = floor(g), f = fract(g) - 0.5; float hc = h11(id.x * 7.3 + id.y * 13.7 + vVar.z + fl * 31.);
      vec2 o = (vec2(h11(hc * 9.1), h11(hc * 5.3)) - 0.5) * 0.52;
      float r = length((f - o) * vec2(1., 1.15)), al = (0.25 + 0.2 * h11(hc * 3.7) - r) * 6. + 0.5 - step(0.8, hc) * 9.;
      if (al > aLeaf) { aLeaf = al; cell = hc; }
    }
    aLeaf -= smoothstep(0.78, 1., rim) * 3.;
    float far = smoothstep(14., 44., dist), tuft = vn3(vec3(cuv * 3.3, vVar.z * 3.)) * 0.6 + vn3(vec3(cuv * 9., vVar.z)) * 0.4;
    a = mix(aLeaf, 0.5 + (tuft - 0.34 - 0.4 * rim * rim) * 5., far); cell = mix(cell, tuft, far); ao = 0.7 + 0.3 * vUv.y;
    N = normalize(N + vec3(0., 0.5, 0.) + (vec3(cell, h11(cell * 3.), h11(cell * 7.)) - 0.5) * 1.3);
  }
  a -= (1. - smoothstep(1.3, 3.0, dist)) * (0.4 + 2.2 * h31(floor(vObj * 23.) + 0.5));
  if (a < 0.5) discard;
  // gold above, silver-sage beneath: gusts and wakes turn the leaves over; poplar leaves flicker even in still air
  float flick = kind > 1.5 ? smoothstep(0.55, 0.9, sin(uTime * (5. + 6. * cell) + cell * 40.) * 0.5 + 0.5) * 0.55
                           : smoothstep(0.62, 0.95, vn3(vec3(vWorld.xz * (kind < 0.5 ? 0.45 : 1.7), uTime * 1.6 + cell * 3.))) * (kind < 0.5 ? 0.28 : 0.5);
  float silver = clamp(vGust * (0.5 + 0.8 * cell) + flick * detail, 0., 1.) * (kind > 1.5 ? 0.4 : 0.92);
  vec3 base = kind > 1.5 ? mix(uPoplar, uGreen * 1.15, vVar.y) : mix(uGold, uGreen, vVar.y);
  float bigT = (kind < 0.5 && vBig > 0.5) ? 1. : 0.;
  base *= 1. + vVar.x * mix(0.22, 0.13, bigT) + (cell - 0.5) * 0.3 * max(detail, bigT); base.g *= 1. + vVar.x * mix(0.1, 0.02, bigT); base *= 1. - 0.12 * bigT;
  if (kind < 0.5 && vBig < 0.5) base *= mix(vec3(1.), mix(vec3(1.1, 0.8, 0.5), vec3(0.95, 1.05, 1.1), step(0., vVar.x)), abs(vVar.x) * 0.4);
  vec3 alb = mix(base, uSilver, silver * (kind > 1.5 ? 1. : kind < 0.5 ? 0.45 : 0.45));
  float lee0 = (kind < 1.5 ? 1. : 0.) * (1. - smoothstep(-0.05, 0.6, dot(N, uSunDir))); alb *= mix(vec3(1.), kind < 0.5 ? vec3(0.86, 0.8, 0.62) : vec3(0.7, 0.98, 0.95), lee0);   // the lee is olive-bronze, not maroon
  // a low sun from the side: each crown is lit on its sunward shoulder and falls to olive-bronze on its lee side and in the
  // troughs between crowns (its lower half stands in its neighbour's shadow)
  float ndl = dot(N, uSunDir), lit = smoothstep(-0.05, 0.6, ndl), bigK = (kind < 0.5 && vBig > 0.5) ? 1. : 0.;
  lit = mix(lit, smoothstep(-0.5, 0.55, ndl), bigK);   // the tall crowns of the old wood: a softer turn, so faces square to us are not black
  if (kind < 0.5) lit *= mix(1., smoothstep(-0.12, 0.5, vObj.y), 0.85 * (1. - vBig) * (1. - 0.7 * uUnder));
  if (kind > 1.5) lit = max(lit, 0.62 * smoothstep(-0.1, 0.7, abs(ndl)) + 0.12); else if (kind > 0.5) lit = lit * 0.72 + 0.26;
  // long shadows thrown across the canopy by the spires (a top-down map baked by the world; white when there is none)
  float shd = kind < 1.5 ? texture2D(uShade, vWorld.xz * uShadeST.xy + uShadeST.zw).r : 1.; lit *= shd;
  float back = clamp(dot(-V, uSunDir), 0., 1.);
  alb = mix(alb, uFrost, uFrostK * (1. - lit) * smoothstep(-0.1, 0.6, N.y));
  float wil = (kind < 1.5 ? 1. : 0.) * (1. - 0.75 * bigK), tro = vVar.w * wil * (1. - 0.6 * uUnder); ao *= 1. - 0.72 * tro; lit *= 1. - 0.6 * tro;
  if (!gl_FrontFacing && kind < 0.5 && vBig < 0.5) { ao *= 0.5; lit *= 0.2; }
  if (kind < 1.5 && bigK < 0.5) alb *= mix(vec3(0.84, 1.06, 0.9), vec3(1.), smoothstep(0.25, 0.75, ao * (0.4 + 0.6 * lit)));
  vec3 hemi = mix(uGroundCol * mix(0.75, kind < 0.5 ? 0.6 : 0.3, wil), uSkyCol * mix(1.12, kind < 0.5 ? 1.05 : 1.7, wil), clamp(N.y * 0.5 + 0.5, 0., 1.)) * mix(mix(0.72, 0.5, wil), 1., shd);
  vec3 col = alb * (uSunCol * lit * (0.55 + 0.6 * ao) + hemi * ao);
  col += alb * uSunCol * (0.13 + 0.12 * uUnder) * (1. - lit) * wil * (0.5 + 0.5 * ao);   // gold light thrown back by the sunlit leaves all round: a willow's lee is bronze, never a black hole
  // leaves between us and the sun glow with transmitted light, more saturated than lit ones
  col += base * vec3(1.15, 0.92, 0.5) * uSunCol * back * back * (1. - 0.6 * lit) * (0.35 + 0.4 * cell) * ao * mix(0.35, 1., shd);
  // seen from underneath (uUnder = 1 when the camera is below the canopy) the ceiling is stained-glass gold, never dark
  if (kind > 1.5) col *= mix(1., mix(1.12, 0.5, smoothstep(7.3, 5.9, vWorld.y)) * (0.72 + 0.56 * h11(floor(vVar.z * 9.))), uUnder);   // depth in the ceiling: the lower, nearer sprays a darker gold
  float under = uUnder * (kind > 1.5 ? 0.8 * mix(1.3, 0.42, smoothstep(7.3, 5.9, vWorld.y)) * (0.7 + 0.6 * h11(floor(vVar.z * 9.))) : smoothstep(0.45, -0.35, N.y));   // lower, nearer sprays darker against the bright ones above
  col += base * vec3(1.1, 0.88, 0.42) * uSunCol * under * (0.3 + 0.45 * cell) * (1. - 0.5 * lit);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// base shapes for the foliage shader (unit size; position, normal, aUv)
export function crownGeometry(rng) {
  const ico = new THREE.IcosahedronGeometry(1, 1), src = ico.attributes.position, P = [], N = [], U = [];
  const lump = (x, y, z) => 1 + 0.2 * Math.sin(x * 3.1 + 1.3) * Math.sin(z * 2.7 + 0.4) + 0.14 * Math.sin(y * 4.3 + x * 2.2) + 0.1 * Math.sin(z * 5.9 - y * 3.1);
  for (let i = 0; i < src.count; i++) {
    let x = src.getX(i), y = src.getY(i), z = src.getZ(i); const l = lump(x, y, z);
    x *= l; z *= l; y *= l; if (y < -0.2) y = -0.2 + (y + 0.2) * 0.25;
    const nl = Math.hypot(x, y * 1.5 + 0.25, z) || 1;
    P.push(x, y, z); N.push(x / nl, (y * 1.5 + 0.25) / nl, z / nl); U.push(0, 0, 0);
  }
  ico.dispose();
  // Leaf sprays shingled over the dome (kind 1: a card of many small narrow leaves, ragged at its edge) and a few whip
  // tips standing out of it (kind 1.25: a thin shoot with small leaves), so the outline is leaves and never a frond.
  const R72 = []; for (let i = 0; i < 72; i++) R72.push(rng()); let ri = 0; const rr = (a, b) => a + (b - a) * R72[(ri++) % 72];   // exactly the 72 draws the old sprays took, so the rest of the seeded world is unchanged
  const quad = (o, ax, sd, len, hw, nrm, kind, v0 = 0, v1 = 1) => {
    const pt = (v, s) => [o.x + ax.x * len * v + sd.x * hw * s, o.y + ax.y * len * v + sd.y * hw * s, o.z + ax.z * len * v + sd.z * hw * s];
    const a = pt(0, -1), b = pt(0, 1), c = pt(1, 1), e = pt(1, -1);
    for (const [q, sg, v] of [[a, -1, v0], [b, 1, v0], [c, 1, v1], [a, -1, v0], [c, 1, v1], [e, -1, v1]]) { P.push(...q); N.push(nrm.x, nrm.y, nrm.z); U.push(sg, v, kind); }
  };
  const up = new THREE.Vector3(0, 1, 0), tufts = 22, whips = 6;
  for (let k = 0; k < tufts + whips; k++) {
    const whip = k >= tufts, az = k * 2.39996 + rr(-0.3, 0.3), el = whip ? rr(0.55, 1.3) : Math.asin(clamp(1 - (k + 0.5) / tufts * 0.98, 0.02, 0.99)) + rr(-0.1, 0.1);
    const d = new THREE.Vector3(Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)), l0 = lump(d.x, d.y, d.z);
    const tan = new THREE.Vector3(-Math.sin(az), 0, Math.cos(az)), roll = rr(-1.1, 1.1);
    const ax = d.clone().multiplyScalar(1).addScaledVector(up, whip ? 0.5 : 0.32).addScaledVector(tan, rr(-0.5, 0.5) * (whip ? 0.5 : 0.75)).normalize();
    const dn = new THREE.Vector3().crossVectors(tan, d).normalize();                      // "down the dome" at this spot
    const sd = tan.clone().multiplyScalar(Math.cos(roll)).addScaledVector(dn, Math.sin(roll)).addScaledVector(ax, 0); sd.addScaledVector(ax, -sd.dot(ax)).normalize();
    const nrm = d.clone().multiplyScalar(0.75).addScaledVector(up, 0.45).normalize();
    if (whip) { const len = rr(0.5, 0.8), o = d.clone().multiplyScalar(l0 * 0.8), mid = o.clone().addScaledVector(ax, len * 0.5), ax2 = ax.clone().addScaledVector(d, 0.35).addScaledVector(up, -0.4).normalize();
      quad(o, ax, sd, len * 0.5, 0.055, nrm, 1.25, 0, 0.5); quad(mid, ax2, sd, len * 0.5, 0.05, nrm, 1.25, 0.5, 1); }
    else quad(d.clone().multiplyScalar(l0 * rr(0.62, 0.8)), ax, sd, rr(0.42, 0.58), rr(0.22, 0.31), nrm, 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 3));
  return g;
}
export function clusterGeometry() {
  // two crossed cards of round poplar leaves
  const P = [], N = [], U = [];
  for (const [ax, az] of [[1, 0], [0.3, 0.95]]) {
    const q = [[-1, 0], [1, 0], [1, 1], [-1, 0], [1, 1], [-1, 1]];
    for (const [u, v] of q) { P.push(ax * u * 0.5, v - 0.5, az * u * 0.5); N.push(-az, 0.3, ax); U.push(u, v, 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('aUv', new THREE.Float32BufferAttribute(U, 3));
  return g;
}
export function instanced(base, list) {
  // list: [{ p: [x,y,z,size], q: [yaw,tilt,phase,tint], r: [green,boughT,squash,spare] }]
  const g = new THREE.InstancedBufferGeometry(), n = list.length;
  for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
  const P = new Float32Array(n * 4), Q = new Float32Array(n * 4), R = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { P.set(list[i].p, i * 4); Q.set(list[i].q, i * 4); R.set(list[i].r, i * 4); }
  g.setAttribute('iP', new THREE.InstancedBufferAttribute(P, 4)); g.setAttribute('iQ', new THREE.InstancedBufferAttribute(Q, 4)); g.setAttribute('iR', new THREE.InstancedBufferAttribute(R, 4));
  g.instanceCount = n; return g;
}

// wood: poplar poles, branches and willow whips in one mesh; sways with the leaves it carries
const WOOD_VERT = /* glsl */`
attribute vec3 aW;   // height fraction 0..1, phase, bough t
uniform float uTime, uWind; uniform vec2 uWindDir; uniform vec3 uBough;
varying vec3 vCol, vN, vWorld, vObj;
#include <fog_pars_vertex>
${GLSL_NOISE}
void main(){
  vec3 w = position;
  vec2 gp = w.xz * 0.028 - uWindDir * uTime * 0.21;
  float gust = smoothstep(0.44, 0.66, vn3(vec3(gp, 0.3)) * 0.75 + vn3(vec3(gp * 2.7, 1.7)) * 0.25 + 0.14 * (uWind - 1.));
  float roll = sin(uTime * 1.25 + aW.y + w.x * 0.21) + 0.5 * sin(uTime * 2.9 + aW.y * 1.7 + w.z * 0.4);
  vec2 push = uWindDir * (0.09 * roll + 0.34 * gust) * uWind * aW.x * aW.x * 0.55;
  w.xz += push; w += uBough * aW.z * aW.z;
  vec4 world = modelMatrix * vec4(w, 1.);
  vWorld = world.xyz; vN = normalize(mat3(modelMatrix) * normal + vec3(0., 1e-5, 0.)); vCol = color; vObj = position;
  vec4 mvPosition = viewMatrix * world; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WOOD_FRAG = /* glsl */`
${LIGHT_PARS}
varying vec3 vCol, vN, vWorld, vObj;
#include <fog_pars_fragment>
${GLSL_NOISE}
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-5, 0.));
  // pale bark with dark diamond scars
  vec2 b = vec2(atan(N.z, N.x + 1e-4) * 1.6, vObj.y * 2.2); vec2 f = abs(fract(b + vec2(0.5 * floor(b.y), 0.)) - 0.5);
  float scar = smoothstep(0.16, 0.06, f.x * 0.6 + f.y) * step(0.45, h11(floor(b.y) * 3.7 + floor(b.x + 0.5 * floor(b.y))));
  vec3 alb = vCol * (0.8 + 0.4 * vn3(vObj * vec3(6., 1.5, 6.))) * (1. - 0.7 * scar);
  float lit = clamp((dot(N, uSunDir) + 0.2) / 1.2, 0., 1.);
  vec3 col = alb * (uSunCol * lit * 0.8 + mix(uGroundCol, uSkyCol, N.y * 0.5 + 0.5) + dot(uSunCol, vec3(0.3, 0.5, 0.2)) * 0.22);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// leaves in the air: a stream going downwind above the canopy (mode 0, wrapped in a box) and the burst flung
// off the feeding bough when it whips back (mode 1, a pure function of the burst's age in seconds)
const AIR_VERT = /* glsl */`
attribute vec4 iS, iV;   // iS: start xyz, seed    iV: velocity xyz, mode
uniform float uTime, uWind, uBurst, uDensity; uniform vec2 uWindDir; uniform vec3 uBox, uCenter, uBurstPos;
varying vec2 vQ; varying vec3 vN, vWorld; varying float vSeed;
#include <fog_pars_vertex>
void main(){
  float seed = iS.w, mode = iV.w, size = 0.11 + 0.07 * fract(seed * 13.7), show = 1.;
  vec3 wind = vec3(uWindDir.x, 0., uWindDir.y) * 4.2 * uWind, c;
  if (mode < 0.5) {
    vec3 q = iS.xyz + (wind * (0.7 + 0.6 * fract(seed * 5.1)) + vec3(0., -0.45, 0.)) * uTime;
    q += vec3(sin(uTime * 1.3 + seed * 40.), 0.6 * sin(uTime * 2.1 + seed * 17.), cos(uTime * 1.1 + seed * 29.)) * 0.5;
    vec3 f = fract(q / (2. * uBox) + 0.5); c = uCenter + (f - 0.5) * 2. * uBox;
    vec3 e = min(f, 1. - f); show = smoothstep(0., 0.08, min(e.x, min(e.y * 2., e.z))) * step(fract(seed * 7.13), uDensity);
  } else {
    float a = uBurst - fract(seed * 3.3) * 0.35, k = 1. - exp(-max(a, 0.) * 1.5);
    c = uBurstPos + iS.xyz + iV.xyz * k / 1.5 + wind * max(a, 0.) * k + vec3(0., -0.75 * max(a, 0.) * k, 0.);
    c += vec3(sin(a * 3.1 + seed * 40.), 0.5 * sin(a * 4.3 + seed * 17.), cos(a * 2.7 + seed * 29.)) * 0.3 * k;
    show = step(0., a) * (1. - smoothstep(4.5, 6.5, a));
  }
  vec4 wc = modelMatrix * vec4(c, 1.);
  float dist = length(cameraPosition - wc.xyz); size = max(size, dist / 400.) * show * smoothstep(1.2, 3.5, dist);   // never a leaf filling the lens
  float A = uTime * (2.5 + 4. * fract(seed * 9.7)) + seed * 60.;
  vec3 e1 = normalize(vec3(cos(A), 0.55 * sin(A), sin(A) * 0.8) + vec3(1e-4, 0., 0.));
  vec3 e2 = normalize(cross(e1, vec3(sin(seed * 9.) * 0.6, 0.9, cos(seed * 9.) * 0.6)) + vec3(0., 1e-4, 0.));
  vec3 w = wc.xyz + (e1 * position.x + e2 * position.y) * size;
  vQ = position.xy * 2.; vN = normalize(cross(e1, e2) + vec3(0., 1e-4, 0.)); vWorld = w; vSeed = seed;
  vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const AIR_FRAG = /* glsl */`
${LIGHT_PARS}
uniform vec3 uGold, uPoplar;
varying vec2 vQ; varying vec3 vN, vWorld; varying float vSeed;
#include <fog_pars_fragment>
void main(){
  float r = vQ.x * vQ.x + vQ.y * vQ.y * (1.6 + 1.2 * step(0.5, fract(vSeed * 3.7)));   // round poplar leaves and narrow willow ones
  if (r > 1.) discard;
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.)); vec3 N = vN;
  float ndl = abs(dot(N, uSunDir)), back = clamp(dot(-V, uSunDir), 0., 1.);
  vec3 alb = mix(uGold, uPoplar, fract(vSeed * 11.3)) * (0.8 + 0.4 * fract(vSeed * 23.1));
  vec3 col = alb * (uSunCol * (0.25 + 0.75 * ndl) + mix(uGroundCol, uSkyCol, 0.6)) + alb * vec3(1.15, 0.92, 0.5) * uSunCol * back * back * 0.7;
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;

// tapered tube for the wood mesh (few sides: these are thin and mostly seen against leaves)
export function pushTube(W, pts, r0, r1, sides, col0, col1, wfn) {
  const t = new THREE.Vector3(), ax = new THREE.Vector3(), az = new THREE.Vector3(), N = pts.length, base = W.p.length / 3;
  for (let i = 0; i < N; i++) {
    const p = pts[i], q0 = pts[Math.max(0, i - 1)], q1 = pts[Math.min(N - 1, i + 1)], f = i / (N - 1), r = lerp(r0, r1, f);
    t.set(q1[0] - q0[0], q1[1] - q0[1], q1[2] - q0[2]).normalize(); ax.set(1, 0, 0.01); ax.addScaledVector(t, -ax.dot(t)).normalize(); az.crossVectors(t, ax);
    const w = wfn(p, f);
    for (let j = 0; j < sides; j++) {
      const th = (j / sides) * TAU, cs = Math.cos(th), sn = Math.sin(th);
      W.p.push(p[0] + (ax.x * cs + az.x * sn) * r, p[1] + (ax.y * cs + az.y * sn) * r, p[2] + (ax.z * cs + az.z * sn) * r);
      W.n.push(ax.x * cs + az.x * sn, ax.y * cs + az.y * sn, ax.z * cs + az.z * sn);
      W.c.push(lerp(col0.r, col1.r, f), lerp(col0.g, col1.g, f), lerp(col0.b, col1.b, f)); W.w.push(w[0], w[1], w[2]);
    }
  }
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < sides; j++) {
    const a = base + i * sides + j, b = base + i * sides + (j + 1) % sides, c = a + sides, d = b + sides; W.i.push(a, c, b, b, c, d);
  }
}

const SEASONS = { gold: { green: 0.0, frost: 0.0, bare: 0.0 }, early: { green: 0.5, frost: 0.0, bare: 0.0 }, frost: { green: 0.0, frost: 0.65, bare: 0.5 } };
const WINDS = { steady: 1.0, calm: 0.3, blow: 1.75 };
const GRAB_F = 0.72, boughT = (f) => clamp((f - 0.25) / 0.75, 0, 1);
const POSE = { rest: [0.0, 0.0, 0.0, 0.0], reach: [0.15, 0.12, 0.5, 0.06], drag: [0.15, -0.3, 0.06, -0.2], chew: [0.12, -0.04, -0.1, -0.3] };

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pal = opts.palette || PALETTE, _unused = 0;
  const tick = async () => { if (ctx.yield) await ctx.yield(); };
  const detail = clamp(opts.detail ?? (ctx.quality && ctx.quality.detail) ?? 1, 0.6, 1);
  // per-seed variety: season, wind, herd, clumps (every draw from ctx.rng, in a fixed order)
  const rSeason = rng(), rWind = rng(), rStorm = rng();
  const seasonName = opts.season || (rSeason < 0.24 ? 'early' : rSeason < 0.38 ? 'frost' : 'gold'), season = SEASONS[seasonName] || SEASONS.gold;
  const windName = opts.wind || (rWind < 0.6 ? 'steady' : rWind < 0.8 ? 'calm' : 'blow'), windK = typeof opts.wind === 'number' ? opts.wind : (WINDS[windName] || 1);
  const storm = opts.blizzard ?? (rStorm < 0.1);
  const wd = opts.windDir ? new THREE.Vector2(opts.windDir[0], opts.windDir[1]).normalize() : new THREE.Vector2(-0.78, -0.62).normalize();
  const group = new THREE.Group(); group.name = 'treetop-giants-hero'; if (opts.yaw) group.rotation.y = opts.yaw;
  const cGold = lin(pal[0]).multiplyScalar(0.86), cSilver = mixc(lin(pal[3]), lin('#9fa587'), 0.45).multiplyScalar(0.66), cGreen = mixc(lin('#6E7B3A'), lin('#7F9A3C'), 0.45).multiplyScalar(0.72), cPoplar = lin('#EBC24E').multiplyScalar(0.86);
  const L = lightUniforms(), shared = { uTime: L.uTime, uSunDir: L.uSunDir, uSunCol: L.uSunCol, uSkyCol: L.uSkyCol, uGroundCol: L.uGroundCol,
    uWind: { value: windK }, uWindDir: { value: wd }, uBough: { value: new THREE.Vector3() } };
  const fogU = () => THREE.UniformsUtils.clone(THREE.UniformsLib.fog);

  // ---- the animals: the leader at the origin facing +Z, the rest of the family behind her in the willow
  const others = opts.herd === false ? 0 : clamp(opts.herdCount ?? rng.int(4, 6), 0, NA - 1), nHalf = others >= 2 ? Math.min(2, others - 1) : 0, nAdult = 1 + others - nHalf;
  await prepareParaceratherium(ctx, 'adult', pal); if (nHalf) await prepareParaceratherium(ctx, 'half', pal);
  const adults = makeParaceratherium(ctx, { age: 'adult', count: nAdult, palette: pal }); await tick();
  const halves = nHalf ? makeParaceratherium(ctx, { age: 'half', count: nHalf, palette: pal }) : null; await tick();
  const herds = halves ? [adults, halves] : [adults];
  for (const h of herds) { Object.assign(h.uniforms, { uTime: shared.uTime, uSunDir: shared.uSunDir, uSunCol: shared.uSunCol, uSkyCol: shared.uSkyCol, uGroundCol: shared.uGroundCol }); group.add(h.mesh); }
  const leader = adults.state[0]; Object.assign(leader, { x: 0, y: 0, z: 0, heading: 0, walk: 0, seed: rng.range(0, 9), chew: 0.2 });
  const cast = [];   // everyone but the leader: { herd, i, mode, cx, cz, R, dir, th0, speed, ... }
  for (let k = 0; k < others; k++) {
    const isHalf = k >= others - nHalf, herd = isHalf ? halves : adults, i = isHalf ? k - (others - nHalf) : k + 1;
    const ang = rng.range(-0.55, 0.55), dist = 19 + k * (30 / Math.max(1, others - 1)) * 0.9 + rng.range(-2, 2), walker = k % 2 === 0;
    const px = Math.sin(ang) * dist + (k % 2 ? 5 : -4), pz = -Math.cos(ang) * dist - 4;
    const R = rng.range(15, 24), dir = rng.chance(0.5) ? 1 : -1, hd = rng.range(-0.6, 0.6), sp = rng.range(0.85, 1.15) * 1.5, seed = rng.range(0, 9), size = rng.range(0.94, 1.04);
    // walkers circle slowly (a wide curve reads as a lane); the rest stand and feed with their heads up
    const c = { herd, i, walker, px, pz, R, dir, hd, sp, seed, cx: px - Math.cos(hd) * R * dir, cz: pz + Math.sin(hd) * R * dir, feedT: rng.range(0, 20), len: isHalf ? 2.3 : 3.3 };
    Object.assign(herd.state[i], { x: px, z: pz, heading: hd, seed, size, walk: walker ? 1 : 0, chew: walker ? 0.25 : 1 });
    cast.push(c);
  }
  // opts.calf: a calf trotting at the elbow of the first walker (hidden by the willow from above; for the glade and for tests)
  const calf = opts.calf && cast.length ? makeParaceratherium(ctx, { age: 'calf', count: 1, palette: pal }) : null;
  if (calf) { Object.assign(calf.uniforms, { uTime: shared.uTime, uSunDir: shared.uSunDir, uSunCol: shared.uSunCol, uSkyCol: shared.uSkyCol, uGroundCol: shared.uGroundCol }); group.add(calf.mesh); herds.push(calf); }
  for (const h of herds) h.commit();

  // ---- where the bough must hang: in her mouth at the top of her reach
  const reachLip = (() => { const s0 = { ...leader }; Object.assign(leader, { neckPitch: POSE.reach[0], neckYaw: POSE.reach[1], headPitch: POSE.reach[2], headYaw: POSE.reach[3] }); const p = adults.lipPoint(0); Object.assign(leader, s0); return p; })();
  const boughBase = [reachLip.x + 0.55, 0, reachLip.z + 1.5];
  const boughTop = [boughBase[0] + (reachLip.x - boughBase[0]) / GRAB_F, reachLip.y / GRAB_F, boughBase[2] + (reachLip.z - boughBase[2]) / GRAB_F];
  const grabRest = reachLip.clone();

  // ---- poplar clumps: the one she feeds in (taller than she is), and two more spires standing out of the willow
  const W = { p: [], n: [], c: [], w: [], i: [] }, cards = [], cPole = lin(pal[3]).multiplyScalar(0.62), cTwig = lin('#8a7a52').multiplyScalar(0.6), cWhip = lin('#6e5a34').multiplyScalar(0.55);
  const stems = [];   // [x, z, radius] trunks, so no willow crown is planted on one
  const addPoplar = (base, top, bough, tint, green) => {
    const ph = rng.range(0, 6.28), H = top[1], n = 8, pts = [], bend = [rng.range(-0.25, 0.25), rng.range(-0.25, 0.25)];
    for (let j = 0; j <= n; j++) { const f = j / n, b = Math.sin(f * Math.PI) * (bough ? 0 : 1); pts.push([lerp(base[0], top[0], f) + bend[0] * b, H * f, lerp(base[2], top[2], f) + bend[1] * b]); }
    const at = (f) => { const b = Math.sin(f * Math.PI) * (bough ? 0 : 1); return [lerp(base[0], top[0], f) + bend[0] * b, H * f, lerp(base[2], top[2], f) + bend[1] * b]; };
    pushTube(W, pts, 0.055 + H * 0.004, 0.012, 5, cPole, cTwig, (p, f) => [f, ph, bough ? boughT(f) : 0]);
    stems.push([base[0], base[2], 0.9]);
    const card = (p, f, sc) => { if (rng() < season.bare * (bough ? 0.3 : 1)) return; cards.push({ p: [p[0], p[1], p[2], sc * rng.range(0.8, 1.25)], q: [rng.range(0, 6.28), rng.range(-0.5, 0.5), ph, tint + rng.range(-0.35, 0.35)], r: [green, bough ? boughT(f) : 0, 1, f] }); };
    const nb = Math.round(H * rng.range(1.0, 1.3));
    for (let b = 0; b < nb; b++) {
      const f = lerp(0.3, 0.94, (b + rng()) / nb), o = at(f), az = b * 2.4 + rng.range(-0.5, 0.5), len = (1.7 * (1 - f) + 0.4) * rng.range(0.8, 1.2), el = rng.range(1.0, 1.3);
      const d = [Math.cos(az) * Math.cos(el), Math.sin(el), Math.sin(az) * Math.cos(el)];
      const bp = [o, [o[0] + d[0] * len * 0.5, o[1] + d[1] * len * 0.5 + 0.06 * len, o[2] + d[2] * len * 0.5], [o[0] + d[0] * len * 0.85, o[1] + d[1] * len + 0.1, o[2] + d[2] * len * 0.85]];
      pushTube(W, bp, 0.022, 0.008, 3, cPole, cTwig, () => [f, ph, bough ? boughT(f) : 0]);
      const nc = Math.round(lerp(4, 7, 1 - f) * (bough ? 1.25 : 1));
      for (let k = 0; k < nc; k++) { const s = rng.range(0.25, 1.05), q = s < 0.5 ? 0 : 1, u = s < 0.5 ? s * 2 : Math.min(1, s * 2 - 1); card([lerp(bp[q][0], bp[q + 1][0], u) + rng.range(-0.25, 0.25), lerp(bp[q][1], bp[q + 1][1], u) + rng.range(-0.2, 0.3), lerp(bp[q][2], bp[q + 1][2], u) + rng.range(-0.25, 0.25)], f, 0.95); }
    }
    for (let f = 0.42; f < 1.0; f += 0.035) { const o = at(f); card([o[0] + rng.range(-0.3, 0.3) * (1 - f), o[1] + rng.range(-0.1, 0.1), o[2] + rng.range(-0.3, 0.3) * (1 - f)], f, lerp(1.0, 0.7, f)); }
  };
  addPoplar(boughBase, boughTop, true, 0.1, 0);
  const clumps = [[boughBase[0] + 2.4, boughBase[2] + 1.6, rng.int(7, 11), 1.0], [23 + rng.range(0, 6) * 0.83, 17 + rng.range(0, 10) * 0.5, rng.int(5, 8), 0.9], [rng.range(-29, -23), rng.range(-8, 6), rng.int(5, 9), 0.95]];
  for (const [cx, cz, n, hk] of clumps) {
    const elm = rng.chance(0.3) ? -0.5 : 0.1;
    for (let s = 0; s < n; s++) {
      const a = (s / n) * TAU + rng.range(-0.3, 0.3), r = Math.sqrt(rng()) * 2.3 + 0.35, H = rng.range(9, 12.2) * hk, bx = cx + Math.cos(a) * r, bz = cz + Math.sin(a) * r;
      addPoplar([bx, 0, bz], [bx + Math.cos(a) * r * 0.18 + rng.range(-0.3, 0.3), H, bz + Math.sin(a) * r * 0.18 + rng.range(-0.3, 0.3)], false, elm + rng.range(-0.2, 0.2), rng.chance(0.12) ? 0.6 : 0);
    }
    await tick();
  }

  // ---- the willow sea: a closed, lumpy top at 3.5-4.5 m on a jittered grid, thinning at the rim of the piece
  const crowns = [], RW = opts.willowRadius ?? 34, step = 3.0;
  if (opts.willow !== false) for (let gz = -RW; gz <= RW; gz += step * 0.866) for (let gx = -RW; gx <= RW; gx += step) {
    const row = Math.round(gz / (step * 0.866)), x = gx + (row & 1) * step * 0.5 + rng.range(-0.8, 0.8), z = gz + rng.range(-0.8, 0.8), d = Math.hypot(x, z);
    const sz = rng.range(1.75, 2.4), sq = rng.range(0.6, 0.85), top = rng.range(3.6, 4.5), keep = rng(), ph = rng.range(0, 6.28), tint = rng.range(-1, 1), gr = rng(), yaw = rng.range(0, 6.28);
    if (d > RW || keep > (1 - smoothstep(RW - 7, RW, d)) * (d > 18 ? detail : 1) + 0.02) continue;
    if (stems.some(([sx, sz2, r]) => Math.hypot(x - sx, z - sz2) < r)) continue;
    const green = gr < 0.035 ? 1 : gr < 0.035 + season.green ? rng.range(0.5, 0.9) : 0;
    crowns.push({ p: [x, top - sz * sq, z, sz], q: [yaw, 0, ph, tint], r: [green, 0, sq, 0] });
    if (d < 15) for (let k = 0; k < 5; k++) {   // whip stems fanning from the stool, only near the leader
      const a = k * 1.257 + ph, r = sz * rng.range(0.35, 0.75), ty = top - sz * sq * rng.range(0.3, 0.9);
      pushTube(W, [[x + Math.cos(a) * 0.15, 0, z + Math.sin(a) * 0.15], [x + Math.cos(a) * r * 0.45, ty * 0.55, z + Math.sin(a) * r * 0.45], [x + Math.cos(a) * r, ty, z + Math.sin(a) * r]], 0.04, 0.014, 3, cWhip, cTwig, (p, f) => [f * 0.6, ph, 0]);
    }
  }
  await tick();
  const white = new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1, THREE.RGBAFormat); white.needsUpdate = true;
  const leafU = { ...fogU(), ...shared, uFlat: { value: windName === 'blow' ? 0.35 : 0 }, uAnim: { value: Array.from({ length: NA }, () => new THREE.Vector4(0, 0, 0, 1)) }, uAnimS: { value: Array.from({ length: NA }, () => new THREE.Vector4(1, 0, 3, 0)) },
    uGold: { value: cGold }, uSilver: { value: cSilver }, uGreen: { value: cGreen }, uPoplar: { value: cPoplar }, uFrost: { value: lin('#dfe6ea').multiplyScalar(0.8) }, uFrostK: { value: season.frost }, uUnder: { value: 0 }, uShade: { value: white }, uShadeST: { value: new THREE.Vector4(0, 0, 0, 0) } };
  const leafMat = new THREE.ShaderMaterial({ uniforms: leafU, vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, side: THREE.DoubleSide, fog: true });
  const crownBase = crownGeometry(rng), cardBase = clusterGeometry();
  const crownMesh = new THREE.Mesh(instanced(crownBase, crowns), leafMat), cardMesh = new THREE.Mesh(instanced(cardBase, cards), leafMat);
  crownMesh.name = 'willow'; cardMesh.name = 'poplar-leaves'; crownMesh.frustumCulled = cardMesh.frustumCulled = false; group.add(crownMesh, cardMesh);
  await tick();
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(W.p, 3)); wg.setAttribute('normal', new THREE.Float32BufferAttribute(W.n, 3));
  wg.setAttribute('color', new THREE.Float32BufferAttribute(W.c, 3)); wg.setAttribute('aW', new THREE.Float32BufferAttribute(W.w, 3)); wg.setIndex(W.i);
  const woodMat = new THREE.ShaderMaterial({ uniforms: { ...fogU(), ...shared }, vertexShader: WOOD_VERT, fragmentShader: WOOD_FRAG, vertexColors: true, side: THREE.DoubleSide, fog: true });
  const wood = new THREE.Mesh(wg, woodMat); wood.name = 'wood'; wood.frustumCulled = false; group.add(wood);
  await tick();

  // ---- leaves in the air: the stream above the canopy and the burst off the bough
  const dragLip = (() => { const s0 = { ...leader }; Object.assign(leader, { neckPitch: POSE.drag[0], neckYaw: POSE.drag[1], headPitch: POSE.drag[2], headYaw: POSE.drag[3] }); const p = adults.lipPoint(0); Object.assign(leader, s0); return p; })();
  const dRel = dragLip.clone().sub(grabRest), tbG = boughT(GRAB_F), whip = dRel.clone().multiplyScalar(-1).normalize();
  const nStream = Math.round(1300 * detail), nBurst = 300, nAir = nStream + nBurst, S = new Float32Array(nAir * 4), V = new Float32Array(nAir * 4), box = new THREE.Vector3(24, 3.6, 24);
  for (let i = 0; i < nAir; i++) {
    if (i < nStream) { S.set([rng.range(-box.x, box.x), rng.range(-box.y, box.y), rng.range(-box.z, box.z), rng()], i * 4); V.set([0, 0, 0, 0], i * 4); continue; }
    const f = rng.range(0.5, 1), tb = boughT(f) / tbG, k = rng.range(4, 9.5) * tb;
    S.set([lerp(boughBase[0], boughTop[0], f) + dRel.x * tb * tb - dragLip.x + rng.range(-0.5, 0.5), boughTop[1] * f + dRel.y * tb * tb - dragLip.y + rng.range(-0.4, 0.4), lerp(boughBase[2], boughTop[2], f) + dRel.z * tb * tb - dragLip.z + rng.range(-0.5, 0.5), rng()], i * 4);
    V.set([whip.x * k + rng.range(-2, 2), whip.y * k + rng.range(0.5, 3), whip.z * k + rng.range(-2, 2), 1], i * 4);
  }
  const ag = new THREE.InstancedBufferGeometry();
  ag.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3));
  ag.setAttribute('iS', new THREE.InstancedBufferAttribute(S, 4)); ag.setAttribute('iV', new THREE.InstancedBufferAttribute(V, 4)); ag.instanceCount = nAir;
  const airU = { ...fogU(), ...shared, uBurst: { value: -1 }, uDensity: { value: storm ? 1 : 0.4 }, uBox: { value: box }, uCenter: { value: new THREE.Vector3(0, 7.6, 0) }, uBurstPos: { value: dragLip.clone() }, uGold: { value: cGold }, uPoplar: { value: cPoplar } };
  const air = new THREE.Mesh(ag, new THREE.ShaderMaterial({ uniforms: airU, vertexShader: AIR_VERT, fragmentShader: AIR_FRAG, side: THREE.DoubleSide, fog: true }));
  air.name = 'leaves-in-air'; air.frustumCulled = false; group.add(air);
  await tick();

  // ---- anchors (local space) and the feed cycle
  let progress0 = null;
  if (opts.progress !== undefined) progress0 = opts.progress;
  const T = opts.cycleSeconds || 8, NEUTRAL = [0.24, 0, -0.06, 0], mixP = (a, b, t) => a.map((v, i) => lerp(v, b[i], t));
  const poseAt = (c) => (c < 0.22 ? mixP(NEUTRAL, POSE.reach, smoothstep(0, 0.22, c)) : c < 0.32 ? POSE.reach : c < 0.58 ? mixP(POSE.reach, POSE.drag, smoothstep(0.32, 0.58, c))
    : c < 0.68 ? mixP(POSE.drag, POSE.chew, smoothstep(0.58, 0.68, c)) : mixP(POSE.chew, NEUTRAL, smoothstep(0.88, 1, c)));
  for (const c of cast) { if (c.walker) { c.cz = Math.min(c.cz, -19 - c.R); c.th0 = Math.atan2(-Math.sin(c.hd) * c.dir, Math.cos(c.hd) * c.dir); } }
  const headRest = new THREE.Vector3(0, adults.rig.headPivot[1] + 0.1, adults.rig.headPivot[2] + 0.6);
  const anchors = {
    leaderHead: headRest.clone(),                                   // where a poi should hold the gaze (use hero.headPosition(out) for the live point)
    withers: new THREE.Vector3(0, 4.8, 1.3),
    bough: grabRest.clone(),                                        // where her lip takes the bough at the top of the reach
    clump: new THREE.Vector3(clumps[0][0], 0, clumps[0][1]),        // foot of the poplar clump she feeds in (stems to ~12 m)
    clumps: clumps.map((c) => new THREE.Vector3(c[0], 0, c[1])),    // all three clumps of the piece (local)
    viewpoints: { approach: new THREE.Vector3(-9.5, 7, 46), closePass: new THREE.Vector3(-8.2, 8, 2.5), behind: new THREE.Vector3(-4.5, 8, -9) },
    // camera line of the brief: in from +Z on her sunward (-X) side at 8 m, curving right round her rump and away to +X.
    // Every point keeps 6 m or more from every animal, stem and bough; the wind carries the leaf burst across it.
    flyThrough: [[-10.5, 6.5, 52], [-9.5, 7.4, 28], [-8.6, 8, 12], [-8.2, 8, 2.5], [-7, 8, -4], [-3.5, 8, -9.5], [3, 7.8, -12], [14, 7, -10.5], [30, 6.5, -6]].map((p) => new THREE.Vector3(...p)),
    exitDir: new THREE.Vector3(0.95, -0.03, 0.3).normalize(),
    sunSide: new THREE.Vector3(-1, 0, 0),                           // the low sun is meant to stand at -X, so the camera's side of her is lit
    windDir: new THREE.Vector3(wd.x, 0, wd.y),
    extent: { center: new THREE.Vector3(0, 4, -8), radius: RW + 4, top: 12.5 },
    herd: cast.map((c) => new THREE.Vector3(c.px, 0, c.pz)),
    portalSeat: null,                                               // the portal of this world stands on the island, not here
  };

  let progress = progress0, lightSet = false, lastC = 0;
  const _cam = new THREE.Vector3(), _lip = new THREE.Vector3(), _v = new THREE.Vector3(), _l = new THREE.Vector3(), _t = new THREE.Vector3();
  const setLight = (Lo) => { for (const h of herds) h.setLight(Lo); lightSet = true; };
  if (opts.sunDir) shared.uSunDir.value.set(opts.sunDir[0], opts.sunDir[1], opts.sunDir[2]).normalize();
  const adopt = () => {
    let root = group; while (root.parent) root = root.parent; if (root === group) return;
    let sun = null, hemi = null; root.traverse((o) => { if (o.isDirectionalLight && !sun) sun = o; if (o.isHemisphereLight && !hemi) hemi = o; });
    if (sun) { sun.getWorldPosition(_l); sun.target.getWorldPosition(_t); if (!opts.sunDir) shared.uSunDir.value.copy(_l.sub(_t)).normalize(); shared.uSunCol.value.copy(sun.color).multiplyScalar(sun.intensity / Math.PI); }
    if (hemi) { shared.uSkyCol.value.copy(hemi.color).multiplyScalar(hemi.intensity / Math.PI); shared.uGroundCol.value.copy(hemi.groundColor).multiplyScalar(0.6 * hemi.intensity / Math.PI); }
    // gold light thrown up by the canopy fills every underside
    const k = shared.uSunCol.value; shared.uGroundCol.value.r += cGold.r * k.r * 0.2; shared.uGroundCol.value.g += cGold.g * k.g * 0.2; shared.uGroundCol.value.b += cGold.b * k.b * 0.2;
    lightSet = true;
  };
  const setAnim = (i, x, z, h, sp, k, len) => { leafU.uAnim.value[i].set(x, z, Math.sin(h), Math.cos(h)); leafU.uAnimS.value[i].set(sp, k, len, 0); };

  function update(dt, time, camera) {
    if (!lightSet && opts.adoptLight !== false) adopt();
    shared.uTime.value = time;
    const c = progress === null ? (((time / T - 0.1) % 1) + 1) % 1 : clamp(progress, 0, 0.9999); lastC = c;
    // the leader: reach, wrap the lip, drag down and sideways, let go, chew and look at us
    const P = poseAt(c), look = smoothstep(0.6, 0.72, c) * (1 - smoothstep(0.9, 1, c));
    let camYaw = 0;
    if (camera) { _cam.setFromMatrixPosition(camera.matrixWorld); group.worldToLocal(_cam); const ca = Math.atan2(_cam.x - headRest.x, _cam.z - headRest.z); camYaw = clamp(ca, -1.3, 1.3) * (1 - smoothstep(2.7, 3.05, Math.abs(ca))); }   // she follows us with her head until we are right behind her
    leader.neckPitch = P[0]; leader.neckYaw = P[1] + camYaw * 0.2 * look; leader.headPitch = P[2]; leader.headYaw = P[3] * (1 - look) + camYaw * 0.55 * look;
    leader.lip = smoothstep(0.2, 0.3, c) * (1 - smoothstep(0.57, 0.6, c)); leader.chew = c > 0.6 ? 1 : c < 0.2 ? 0.5 : 0.1; leader.ears = 0.7 * smoothstep(0.3, 0.5, c) * (1 - smoothstep(0.58, 0.7, c));
    const age = (c - 0.58) * T;
    if (c >= 0.3 && c < 0.58) { adults.lipPoint(0, _lip); _v.copy(_lip).sub(grabRest).multiplyScalar(1 / (tbG * tbG)); }
    else if (c >= 0.58) _v.copy(dRel).multiplyScalar(Math.exp(-1.7 * age) * Math.cos(8.5 * age) / (tbG * tbG));
    else _v.set(0, 0, 0);
    shared.uBough.value.copy(_v); airU.uBurst.value = c >= 0.58 ? age : -1;
    setAnim(0, 0, 0, 0, 0.05, 1, 3.3);
    // the family: walkers on wide curves trailing wakes, the others standing with their heads up, chewing
    for (let k = 0; k < cast.length; k++) {
      const m = cast[k], s = m.herd.state[m.i];
      if (m.walker) {
        const dist = m.sp * time, th = m.th0 + m.dir * dist / m.R;
        s.x = m.cx + m.R * Math.cos(th); s.z = m.cz + m.R * Math.sin(th); s.heading = Math.atan2(-Math.sin(th) * m.dir, Math.cos(th) * m.dir); s.phase = dist / m.herd.stride;
        s.neckPitch = 0.04 + 0.05 * Math.sin(time * 0.17 + m.feedT); s.headYaw = 0.25 * Math.sin(time * 0.11 + m.seed);
        setAnim(k + 1, s.x, s.z, s.heading, m.sp, 1, m.len);
        if (calf && k === 0) { const q = calf.state[0], ch = Math.cos(s.heading), sh = Math.sin(s.heading); q.x = s.x + ch * 2.1 + sh * 0.9; q.z = s.z - sh * 2.1 + ch * 0.9; q.heading = s.heading; q.walk = 1; q.phase = dist / calf.stride; q.chew = 0.1; }
      } else {
        const up = smoothstep(0.1, 0.8, Math.sin(time * 0.21 + m.feedT));
        s.neckPitch = 0.1 + 0.3 * up; s.headPitch = 0.2 * up; s.neckYaw = 0.2 * Math.sin(time * 0.09 + m.seed * 3); s.headYaw = 0.3 * Math.sin(time * 0.13 + m.feedT * 2); s.lip = up;
        setAnim(k + 1, s.x, s.z, s.heading, 0.05, 0.9, m.len);
      }
    }
    for (let k = cast.length + 1; k < NA; k++) leafU.uAnimS.value[k].y = 0;
    for (const h of herds) h.commit();
  }
  update(0, 0, null);
  return {
    object: group, radius: 2, height: 7, center: new THREE.Vector3(0, 5.6, 1.5), anchors, update, dispose() { white.dispose(); }, ground: true, groundY: 0,
    setProgress(p) { progress = p === null || p === undefined ? null : p; },   // 0..1 across one feed: reach 0-0.22, lip wraps 0.3, drag to 0.58, the bough whips back and the leaves fly at 0.58, she chews and looks at us to 0.9
    get feedPhase() { return lastC; }, cycleSeconds: T, setLight,
    headPosition(out = new THREE.Vector3()) { return adults.lipPoint(0, out, [0, adults.rig.headPivot[1] + 0.1, adults.rig.headPivot[2] + 0.6]); },
    herds: { adults, halves }, uniforms: { shared, leaf: leafU, air: airU },
    // for the world: the foliage and wood materials and base shapes, so its own willow sea and clumps share one program and the wakes
    kit: { leafMat, woodMat, crownBase, cardBase, crownMesh, cardMesh, wood, air, cGold, cSilver, cGreen, cPoplar, seasonDef: season, windK }, season: seasonName, wind: windName, blizzard: storm, stats: { crowns: crowns.length, cards: cards.length, animals: 1 + others },
  };
}
