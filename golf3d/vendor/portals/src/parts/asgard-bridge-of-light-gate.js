// THE GOLDEN CITY AND ITS BRIDGE: the bridge's slab, and THE GATE HOUSE at its far end with its spike and its beam. The gate house
// stands out over open space (the sea's edge is cut back in a bay: there is no sea under it), so it has no image in the sea; only
// the slab keeps one. Everything is placed by the plan's HOUSE, spikeAt and BEAM (read here, never copied):
//  THE BASE: a broad round deck level with the bridge (HOUSE.base in radius) with a low rim round it, open toward the bridge;
//   three low steps up to a round drum with a row of tall lit windows and twelve buttresses, which cradles the globe; eight small round turrets with lit
//   slots stand on the deck near its rim (none before the bridge).
//  THE KEEL under the base: a long golden spire turned over, tapering in four fluted lengths with a collar between each to a
//   needle 2.7 times the base's radius below the deck (80 m at least, 150 at most), eight thin fins down its upper lengths.
//  THE GLOBE (HOUSE.r about HOUSE.y): six bands of ribbed plates one above another (each plate a real raised rib and sunk lips,
//   fine seams of warm light, small round ports of light), narrow gaps between the bands through which the light within shows, a
//   stepped crown with a short point, two hoops either side of the middle band, a soft glow round it. EACH BAND TURNS slowly
//   about the upright, by the clock, at a speed and from a bearing of its own (stream 'shell': 0.03 to 0.09 of a radian a
//   second, neighbours opposite ways; 70 s and more to a turn).
//  THE DOORWAY toward the bridge (south): two tall pylons, a lintel and a stepped head standing proud of the globe's foot; the
//   tall opening between them is lit from within and warms the deck and the gold about it.
//   Three lesser doors of the same make, lit likewise, stand toward the west, the north and the east.
//  THE SPIKE from where the plan's spikeAt(0) leaves the globe to the beam's start: a great horn. A socket with four vanes; a stout
//   fluted shaft tapering plainly from 4 m to 1 m in radius with three bold collars; at its point a flared crown, the beam's
//   nozzle, a bright core in its mouth. THE BEAM leaves that core along the same line: a shaft of rainbow light and a
//   faint wider sheath (housemat's beam: it swells and eases over 12.6 s from a phase the stream 'beam' deals; waves of light
//   run out along it, one every 5 s at a place), a small light at the spike's point.
// Nothing here is keyed to the flight; everything that moves goes by the clock. Nothing is lettered; no figure.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { BRIDGE, HOUSE, BEAM, spikeAt } from './asgard-bridge-of-light-plan.js';
import { bridgeMat } from './asgard-bridge-of-light-mat.js';
import { gold, light, glow, beam as beamMat } from './asgard-bridge-of-light-housemat.js';

const V2 = (r, y) => new THREE.Vector2(Math.max(r, 0.001), y);
// a solid of revolution about the upright through the origin, from a profile of [radius, height] listed from its foot up (so
// its faces look outward); every corner is kept crisp (each inner place stands twice); its uv: x once round, y the way along the
// profile in metres over `per` (so a plate along it is `per` metres long)
function lathe(pts, segs, per = 1, phi0 = 0, phiLen = Math.PI * 2) {
  const p = []; pts.forEach((q, i) => { p.push(V2(q[0], q[1])); if (i > 0 && i < pts.length - 1) p.push(V2(q[0], q[1])); });
  const g = new THREE.LatheGeometry(p, segs, phi0, phiLen), uv = g.attributes.uv, run = [0];
  for (let j = 1; j < p.length; j++) run.push(run[j - 1] + p[j].distanceTo(p[j - 1]));
  for (let i = 0; i <= segs; i++) for (let j = 0; j < p.length; j++) uv.setY(i * p.length + j, run[j] / per);
  return g;
}
// a band of the globe between two polar angles (from the top), about the origin: `plates` plates round, each with a raised
// rounded rib down its middle and a sunk lip at either side (`lift`: the rib's height); its uv: x once round, y across the band
function bandGeo(R, a0, a1, plates, lift) {
  const prof = [-0.4, 0, 0.15, 0.85, 1, 0.85, 0.15, 0], per = prof.length, nu = plates * per, nv = 5, pos = [], uv = [], idx = [];
  for (let j = 0; j <= nv; j++) {
    const a = a0 + (a1 - a0) * j / nv, sa = Math.sin(a), ca = Math.cos(a);
    for (let i = 0; i <= nu; i++) {
      const ph = i / nu * Math.PI * 2, r = R + lift * prof[i % per];
      pos.push(r * sa * Math.cos(ph), r * ca, r * sa * Math.sin(ph)); uv.push(i / nu, j / nv);
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}
// a flat three-cornered fin in the upright plane through the axis (corners [radius, height], listed anticlockwise seen from +z), `th` thick
function blade(a, b, c, th) {
  const P = (q, s) => [q[0], q[1], s * th / 2], f = [P(a, 1), P(b, 1), P(c, 1)], k = [P(a, -1), P(b, -1), P(c, -1)], v = [], uv = [];
  const tri = (p, q, r) => v.push(...p, ...q, ...r), quad = (p, q, r, s) => { tri(p, q, r); tri(p, r, s); };
  tri(f[0], f[1], f[2]); tri(k[0], k[2], k[1]);
  for (let i = 0; i < 3; i++) { const j = (i + 1) % 3; quad(f[i], k[i], k[j], f[j]); }
  for (let i = 0; i < v.length; i += 3) uv.push(v[i] / 12, v[i + 1] / 12);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals(); return g;
}

export async function buildGate(ctx, shared) {
  const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed('asgard-bridge-of-light:' + name + ':' + ctx.seed));
  const group = new THREE.Group(), images = new THREE.Group(); group.name = 'bridge-and-gate-house'; images.name = 'bridge-and-gate-house-image'; images.scale.y = -1;
  const H = HOUSE, R = H.r, B = H.base, D = H.deck, cy = H.y, PI = Math.PI;
  const at = (g) => g.translate(H.x, 0, H.z), put = (g, m) => { const mesh = new THREE.Mesh(g, m); group.add(mesh); return mesh; };
  const door = [H.x, D + 0.2 * R, H.z + 1.18 * R, 0.6];      // where the doorway's light falls from, and how strong

  // ---- the bridge: one slab; its streaks' lengths and speeds are dealt from the stream 'bridge'
  const seed = stream('bridge').range(0, 50), slab = new THREE.BoxGeometry(BRIDGE.w, BRIDGE.t, BRIDGE.z0 - BRIDGE.z1).translate(0, BRIDGE.y - BRIDGE.t / 2, (BRIDGE.z0 + BRIDGE.z1) / 2);
  group.add(new THREE.Mesh(slab, bridgeMat(shared, seed)));
  const slabImage = new THREE.Mesh(slab, bridgeMat(shared, seed, true)); slabImage.renderOrder = 0.3; slabImage.frustumCulled = false; images.add(slabImage);
  await ctx.yield();

  // ---- the keel under the base (no pier: there is no sea under the gate house), with the base's outer wall at its head
  const K = Math.min(150, Math.max(80, B * 2.7));
  const kp = [[0.004, 1], [0.033, 0.862], [0.054, 0.862], [0.054, 0.838], [0.042, 0.838], [0.0875, 0.646], [0.125, 0.646], [0.125, 0.615], [0.104, 0.615],
    [0.198, 0.4], [0.26, 0.4], [0.26, 0.362], [0.23, 0.362], [0.396, 0.169], [0.479, 0.169], [0.479, 0.138], [0.4375, 0.138], [0.79, 0.046], [0.958, 0.035],
    [1.008, 0.035], [1.008, 0]].map(([r, y]) => [r * B, D - y * K]);
  put(at(lathe(kp, 64, 6.5)), gold(shared, { plates: [40, 1], seam: [0.04, 0.03], rib: 0.5, glow: 0.8, lamp: 0.38, port: [0.2, 0.1, 2.2, 0], door }));
  const fin = blade([0.02 * B, D - 0.045 * K], [0.02 * B, D - 0.72 * K], [0.7 * B, D - 0.045 * K], 0.9), fins = [];
  for (let k = 0; k < 8; k++) fins.push(fin.clone().rotateY((k + 0.5) * PI / 4));
  put(at(mergeGeometries(fins)), gold(shared, { plates: [5, 9], seam: [0.03, 0.03], rib: 0.15, glow: 0.7, lamp: 0.38, door }));
  await ctx.yield();

  // ---- the base: the deck level with the bridge, three low steps, the drum that cradles the globe; the low rim, open toward the bridge
  const st = 0.043 * R, s1 = 0.6 * B, s2 = 0.54 * B, s3 = 0.48 * B, rd = 0.64 * R, y3 = D + 3 * st;
  const drumTop = Math.max(y3 + 3, cy - Math.sqrt(Math.max(R * R - rd * rd, 0)) + 0.55), y4 = y3 + 1, y5 = drumTop - 0.9;
  const deckGeo = lathe([[B, D - 0.12], [s1, D - 0.12], [s1, D + st], [s2, D + st], [s2, D + 2 * st], [s3, D + 2 * st], [s3, y3], [rd + 1.2, y3], [rd + 1.2, y4], [rd, y4]], 96, 2.4);
  const cornice = lathe([[rd, y5], [rd + 0.7, y5], [rd + 0.7, drumTop], [Math.max(rd - 3, 1), drumTop]], 96, 2.4);
  put(at(mergeGeometries([deckGeo, cornice])), gold(shared, { plates: [72, 1], seam: [0.025, 0.05], rib: 0.12, glow: 0.8, lamp: 0.36, door }));
  put(at(lathe([[rd, y4], [rd, y5]], 96, Math.max(y5 - y4, 0.5))), gold(shared, { plates: [36, 1], seam: [0.03, 0.04], rib: 0.3, glow: 0.8, lamp: 0.42,
    port: [0.72, 0.13, Math.max(y5 - y4, 0.5) / (2 * PI * rd / 36), 1], portGlow: 1.9, door }));
  const butt = blade([rd - 0.5, y5], [rd - 0.5, y3 - 0.2], [s3 - 0.3, y3 - 0.2], 0.8), butts = [];      // twelve buttresses from the drum's wall down onto the top step, between its windows
  for (let k = 0; k < 12; k++) butts.push(butt.clone().rotateY(k * PI / 6));
  put(at(mergeGeometries(butts)), gold(shared, { plates: [3, 3], seam: [0.03, 0.03], rib: 0.15, glow: 0.7, lamp: 0.42, door }));
  const gap = Math.asin(Math.min(0.9, (BRIDGE.w / 2 + 2.6) / B)), post = (s) => new THREE.BoxGeometry(2, 3.2, 2).translate(s * B * Math.sin(gap), D + 1.6, B * Math.cos(gap));
  put(at(mergeGeometries([lathe([[B + 0.4, D - 0.3], [B + 0.4, D + 1.4], [B - 0.9, D + 1.4], [B - 0.9, D]], 88, 2.4, gap, 2 * PI - 2 * gap), post(1), post(-1)])),
    gold(shared, { plates: [64, 1], seam: [0.03, 0.06], rib: 0.25, glow: 0.8, lamp: 0.42, port: [0.5, 0.11, 0.55, 0], portGlow: 1.6, door }));
  await ctx.yield();

  // ---- eight small round turrets on the deck near its rim, lit slots up their shafts (none before the bridge: the nearest stand 22.5 degrees either side of it)
  const q = R / 30, tp = [[2.6, 0], [2.6, 1], [1.9, 1], [1.9, 7], [2.5, 7], [2.5, 7.6], [2.1, 7.6], [2.1, 9.6], [2.8, 9.6], [2.8, 10.1], [0.5, 13.6], [0.12, 15.6]].map(([r, y]) => [r * q, D + y * q]);
  const one = lathe(tp, 14, 2.4 * q), turrets = [];
  for (let k = 0; k < 8; k++) { const a = (k + 0.5) * PI / 4; turrets.push(one.clone().translate(0.895 * B * Math.sin(a), 0, 0.895 * B * Math.cos(a))); }
  put(at(mergeGeometries(turrets)), gold(shared, { plates: [8, 1], seam: [0.05, 0.05], rib: 0.4, glow: 0.7, lamp: 0.46, port: [0.5, 0.15, 1.7, 1], portGlow: 1.8, door }));

  // ---- the doorway toward the bridge: two pylons, a lintel, a stepped head, the tall opening between them lit from within;
  // and three lesser doors of the same make toward the west, the north and the east (so a lit door shows from every side)
  const porch = (wo, wp, hp, face, turn) => {
    const dp = face - 0.5 * R, zc = (face + 0.5 * R) / 2, k = hp / (0.74 * R), box = (w, h, d, x, y) => new THREE.BoxGeometry(w, h, d).translate(x, y, zc);
    const frame = mergeGeometries([box(wp, hp, dp, -(wo + wp) / 2, D + hp / 2), box(wp, hp, dp, (wo + wp) / 2, D + hp / 2), box(wo + 2 * wp + 1.4 * k, 0.1 * R * k, dp + 0.8 * k, 0, D + hp + 0.05 * R * k),
      box(wo + wp, 0.07 * R * k, dp, 0, D + hp + 0.135 * R * k), box(wo * 0.6, 0.06 * R * k, dp, 0, D + hp + 0.2 * R * k)]).rotateY(turn);
    return [frame, new THREE.PlaneGeometry(wo, hp).translate(0, D + hp / 2, face - 2.2 * k).rotateY(turn)];
  };
  const doors = [porch(0.27 * R, 0.12 * R, 0.74 * R, 1.075 * R, 0), ...[-1, 2, 1].map((k) => porch(0.17 * R, 0.085 * R, 0.47 * R, 0.985 * R, k * PI / 2))];
  put(at(mergeGeometries(doors.map((d) => d[0]))), gold(shared, { plates: [2, 6], seam: [0.03, 0.03], rib: 0.2, glow: 0.8, lamp: 0.5, door }));
  put(at(mergeGeometries(doors.map((d) => d[1]))), light(shared, { color: '#ffae58', grad: [1.9, 0.75, 0.5] }));
  await ctx.yield();

  // ---- the globe: six turning bands of ribbed plates, the light within showing through the gaps between them
  const sh = stream('shell'), bands = [], cuts = [0.075, 0.19, 0.31, 0.43, 0.57, 0.69, 0.81], plates = [16, 24, 30, 32, 30, 24], lift = 0.03 * R, gapA = 0.008;
  for (let b = 0; b < 6; b++) {
    const speed = sh.range(0.03, 0.09) * (b % 2 ? -1 : 1), from = sh.range(0, PI * 2), mid = (cuts[b] + cuts[b + 1]) / 2 * PI;
    const tall = (cuts[b + 1] - cuts[b]) * PI * R / 2, wide = 2 * PI * R * Math.sin(mid) / plates[b];      // a plate's height (two rows to a band) and width
    const mesh = put(bandGeo(R, (cuts[b] + gapA / 2) * PI, (cuts[b + 1] - gapA / 2) * PI, plates[b], lift),
      gold(shared, { plates: [plates[b], 2], seam: [0.019, 0.034], rib: 0.18, glow: 0.9, lamp: 0.3, port: [0.3, 0.055, tall / wide, 0], portGlow: 1.7, door }));
    mesh.position.set(H.x, cy, H.z); bands.push({ mesh, speed, from });
    if (b % 2) await ctx.yield();
  }
  const capA = (cuts[0] - gapA / 2) * PI, cp = [];
  for (let k = 0; k <= 4; k++) { const a = capA * (1 - 0.45 * k / 4); cp.push([R * Math.sin(a), cy + R * Math.cos(a)]); }
  const c0 = cp[4][0], c1 = cp[4][1];
  cp.push([c0, c1 + 0.05 * R], [0.085 * R, c1 + 0.05 * R], [0.085 * R, c1 + 0.09 * R], [0.05 * R, c1 + 0.09 * R], [0.012 * R, c1 + 0.24 * R]);
  const hoop = (a) => new THREE.TorusGeometry(R * Math.sin(a) + 0.2, 0.022 * R, 8, 96).rotateX(PI / 2).translate(0, cy + R * Math.cos(a), 0);
  put(at(mergeGeometries([lathe(cp, 48, 3), hoop(cuts[3] * PI), hoop(cuts[4] * PI)])), gold(shared, { plates: [48, 1], seam: [0.04, 0.06], rib: 0.35, glow: 0.9, lamp: 0.3, door }));
  put(new THREE.SphereGeometry(R * 0.955, 40, 20).translate(H.x, cy, H.z), light(shared, { color: '#ff9a3a', grad: [1.7, 1.7, 0] }));
  const halo = put(new THREE.SphereGeometry(R * 1.22, 32, 16).translate(H.x, cy, H.z), glow(shared, { color: '#ff9440', strength: 0.22, power: 13, round: 1.22, veil: 0.12 })); halo.renderOrder = 1.6;
  await ctx.yield();

  // ---- the spike, along the plan's spikeAt from where it leaves the globe to the beam's start; the beam straight on from its point
  const s0 = new THREE.Vector3(...spikeAt(0)), dir = new THREE.Vector3(...spikeAt(1)).sub(s0).normalize(), tip = new THREE.Vector3(...BEAM.from);
  const L = Math.max(tip.distanceTo(s0), 10), turn = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir), lay = (g, p) => g.applyQuaternion(turn).translate(p.x, p.y, p.z);
  // THE HORN: a socket where it leaves the globe; a stout shaft tapering plainly from 4 m to 1 m in radius, three bold collars on it; at its
  // point a flared crown, the beam's nozzle, with a bright core in its mouth where the beam leaves it (the core lights the crown and the shaft's head)
  const dS = Math.min(5 * q, 0.2 * L), dN = Math.max(L - 12 * q, dS + 1), rAt = (d) => (4.05 - 3.05 * (d - dS) / (dN - dS)) * q;
  const sp = [[6.3 * q, -5 * q], [6.3 * q, 0.7 * dS], [5.2 * q, 0.7 * dS], [5.2 * q, dS], [rAt(dS), dS]];
  for (const t of [0.22, 0.5, 0.78]) {
    const d = dS + (dN - dS) * t, r = rAt(d), a = 1.8 * q, b = 0.9 * q;
    sp.push([rAt(d - a), d - a], [r + 0.9 * q, d - a], [r + 0.9 * q, d - b], [r + 1.9 * q, d - b], [r + 1.9 * q, d + b], [r + 0.9 * q, d + b], [r + 0.9 * q, d + a], [rAt(d + a), d + a]);
  }
  sp.push([rAt(dN), dN], [1.3 * q, L - 8 * q], [2.2 * q, L - 5 * q], [3.6 * q, L - 2.5 * q], [5.2 * q, L - 0.8 * q], [5.8 * q, L - 0.8 * q], [5.8 * q, L + 0.4 * q], [5 * q, L + 0.4 * q],
    [1.8 * q, L - 3.5 * q], [0.01, L - 3.5 * q]);      // (the last three: the rim's top, the bell's inside, its floor)
  const core = [tip.x, tip.y, tip.z, 2];
  put(lay(lathe(sp, 24, 3.2 * q), s0), gold(shared, { axis: [dir.x, dir.y, dir.z], plates: [12, 1], seam: [0.05, 0.04], rib: 0.5, glow: 0.9, lamp: 0.4, door: core }));
  const vane = blade([3.4 * q, -3 * q], [10.5 * q, -3 * q], [3 * q, dS + (dN - dS) * 0.22], 0.9), vanes = [];      // four vanes round the horn's foot, sweeping up into its first collar
  for (let k = 0; k < 4; k++) vanes.push(vane.clone().rotateY((k + 0.5) * PI / 2));
  put(lay(mergeGeometries(vanes), s0), gold(shared, { axis: [dir.x, dir.y, dir.z], plates: [2, 6], seam: [0.03, 0.03], rib: 0.15, glow: 0.7, lamp: 0.3 }));
  put(lay(new THREE.CylinderGeometry(BEAM.r0, 1.8 * q, 6.5 * q, 16, 1).translate(0, L - 0.25 * q, 0), s0), light(shared, { color: '#fff0d6', grad: [2.6, 2, 0] }));      // the bright core in the nozzle's mouth
  const len = BEAM.length, ph = stream('beam').range(0, PI * 2), shaft = (k, strength, white) => {
    const m = put(lay(new THREE.CylinderGeometry(BEAM.r1 * k, BEAM.r0 * k, len, 32, 1, true).translate(0, len / 2, 0), tip),
      beamMat(shared, { from: BEAM.from, dir: [dir.x, dir.y, dir.z], r: [BEAM.r0 * k, BEAM.r1 * k], length: len, ph, strength, white }));
    m.renderOrder = 1.6; m.frustumCulled = false; return m;
  };
  shaft(1, 1.5, 0.24); shaft(2.6, 0.2, 0);
  const point = put(new THREE.SphereGeometry(0.1 * R, 20, 12).translate(tip.x + 1.5 * q * dir.x, tip.y + 1.5 * q * dir.y, tip.z + 1.5 * q * dir.z), glow(shared, { color: '#fff0da', strength: 0.55, power: 2 })); point.renderOrder = 1.6;

  return { object: group, image: images,
    update(dt, time) { for (const b of bands) b.mesh.rotation.y = b.from + b.speed * time; } };
}
