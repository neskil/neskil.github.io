// THE DAWN TRACKS: hero set piece "one airliner's contrail, read backwards" (procedural; imports only three and kit/core).
//
// WHAT     One contrail 2 km long in every stage of its life, plus the aircraft that is making it:
//          the ragged RIBBON (a torn 400 m sheet hung with pendulous lobes, three burst horseshoes inside it), the
//          CHAIN (three vortex rings 150 x 120 m, tilted alternately like chain links, each rolling about its core, with
//          lobes dripping below, and each at its own stage: loop 4, the oldest, has begun to burst and is a C; loop 5 drags
//          a thin veil up above its high side, whole at the wall and frayed at its top; loop 6 has just shed a lobe below its low side), the WAVES (s 1023-1380: two ropes of cloud swinging in and out, pinched into
//          loops 7, 8 and 9; LOOP 7 is a pinched vortex ring laid by arc round a rounded oval, blunt at both ends, one arm
//          wider), the CANYON (s 1380-1750: the two ropes 45 m apart; from s 1540 they are a third slimmer, 8 m thick, in big
//          lobes, on the trail's own axis), the JETS (each rope unwinding
//          into two knotted ropes lit round: the core itself is eaten by noise into knots and necks (shader: knot), with a few torn
//          beads of 0.6-3 m sunk deep in it, a hot crest on every jet (the light comes through the pair between the lens and the
//          sun), lilac flanks, dark deck showing through the necks; born from clear air behind the nozzles in small torn flecks)
//          and a four-engined widebody modelled for a 10 m pass.
//          Beyond the aircraft, the EXIT RINGS of old cloud: an arch (108 x 86 m, upright, 170 m before
//          the portal, a whole closed ring), a gate (116 x 92 m, 50 m before the portal: a whole ring with one shallow neck on its lower left) and a closed wreath (48 m)
//          round the portal, nested one inside the next.
// FRAME    The brief's own frame, so the world places the object at the origin unrotated: x to the right, y up,
//          z = -s where s is metres from the entry (0) toward the portal (2400). The camera flies toward -Z.
//          Entry point (-150,-128,0); trail axis y -110 (old end) rising to 0 at the aircraft; aircraft nose at
//          s 2060, tail s 1988, wing-root top y 0, fuselage axis y 2.2; portal seat (0,75,-2400).
//          radius/height/center describe the chain of rings (what the part viewer orbits), not the whole 2.4 km.
// OPTS     palette    7 hex strings in the brief's order (sea, slate, indigo, rose, coral, gold, turquoise)
//          hour       'dawn' (default) | 'golden' | 'night': trail and hull colours (also hero.setHour(name))
//          moist      0..1 trail character: 0 thin with hard bright cores, 1 thick and lobed (default: per seed)
//          sunDir     Vector3 TOWARD the sun (default: azimuth 40 degrees right of -Z, 3 degrees below level)
//          pathPoints [[x,y,s],...] camera line used to keep lobes and puffs clear (default: the brief's line); the exit rings
//                     are centred on its last leg
//          airliner   false to leave the aircraft out;  humped / tailColor override the seeded cast
// LAMPS    wingtip and tail strobes share one phase, both beacons another: two white blinks per 1.2 s, one red a second.
// PER SEED moist/thin trail, ring tilts, sizes, wobble and thickness, horseshoe arcs, lobe fields, wave amplitude,
//          tail colour, humped or plain forward fuselage, which cabin blinds are down.
// PROGRESS hero.setProgress(u): path progress 0..1; only brightens the trail slowly (the glow growing). Nothing
//          else is keyed to the camera: the piece is a place, the flight does the timing.
//          hero.setSun(dirTowardSun), hero.setHour(name), hero.uniforms (trail), hero.hullUniforms (aircraft).
// ANCHORS  see the end of buildHero: flyThrough (the camera line given in pathPoints, at least 8 m clear of every lobe),
//          portalSeat, rings[], loop5, loop7, pinch, wreath, gate, arch, airliner{...}, nozzles[], viewpoints[].
// LIGHTING Self-lit shaders, no scene lights read. Trail: coral body (wrap light plus forward scattering), lilac
//          shadow sides, gold only on thin back-lit rims (peaks about 1.6), premultiplied alpha, depthWrite off.
//          Hull: coral key from the sun direction, blue sky fill, a small analytic sky for glossy reflections
//          (hullUniforms uEnvGlow/uEnvAnti/uEnvZen/uEnvDeck), lit windows 2-3, beacons 5, strobes 6.
//          Scene fog is honoured by everything. Wants a dark saturated sky and bloom threshold about 0.9.
// ORDER    The trail is seven meshes with fixed renderOrder (aircraft end first) whose triangles are sorted along the
//          track, so a camera that flies up-trail and never looks back gets back-to-front blending with no sorting.
// WINDOW   The ribbon keeps a sight window on loop 4 (see buildRibbon): inside the cone that loop 4's oval subtends from any
//          station of the camera line under the sheet (s 0..450, each station's own cone) the sheet is open, lobes stay shallow,
//          horseshoes thin away and no puff is placed, so the entry frame has its focal point. The three horseshoes sit to the
//          right of it. THE VAULT'S CROWN: clumps of cumulus seated over that opening, all above the cones, so that from below
//          (the camera line dives 41 m at s 98-236) the ribbon is a closed vault and loop 4 hangs in a slot of sky under it.
//          Puffs over about 2 m have torn outlines (shader: bigP); a puff with no neighbour and no sheet behind it is faded out.
//          The crown is nine clumps, each a heap 40-66 m across: heads of 7-12 m low in its middle with solid bodies and shadowed
//          bellies, heads of 3-5 m only round its edge, open sky between clumps (puff flag -1 at a clump's edge to -2 at its middle).
// CLOSE UP Within 45 m the halo shells are gone and the core carries the cloud: silhouettes eaten by noise, billowed relief
//          (uniform uBump, metres) and puffs seated in the wall. The sheet is a gentle 5 m grid; its pendulous lobes are puffs.
//          Within 46 m old cloud is lit by a lens-facing normal tilted by the billows (capped, creases rounded), not by the mesh's
//          vertex normals (the wound ropes within 75 m, and there the billows' tilt is capped by distance: uncapped, a wall looked
//          along carried fans of hard blades); its folds are wide dusky-mauve valleys within 95 m, not thin lilac veins; a rope
//          between the lens and the sun takes light through it in patches; the core of a wound rope thins out within 42 m; and
//          the stretches the lens passes close to (loop 7, the canyon at s 1585-1765) carry twice the puffs,
//          the canyon's inner faces a further 950 heads of 1.4-3.6 m a side with their own lit and shadow sides (cauliflower at 25 m).
//          Down the canyon each rope's radius swells and sinks by 42% every 15-25 m: a wall is a row of big lobes with lilac gulfs
//          between them (puff flag 0..0.45; up to four heads in ten are left out of a gulf) and a notched top edge, the small heads
//          seated in the lobes. What leaves the ropes there is a fall of fine ice (puff flag 0.75): faint pale streaks with glinting grains, all going down,
//          at half a wisp's strength; like a wisp it fades out only from 16 m to 5 m of the lens.
//          FAR OFF (hull shader) wing, fin and tailplane are swelled to a pixel and a half and edge-on surfaces take a coral rim.
// CLOUD    Everything older than the four jets is lumpy cloud built the same way: a lobed core tube (beaded radius on the
//          waves and the canyon), a soft halo for distance, and many small lit puffs seated all round the wall, each with its own
//          lit and shadow side. The helical streaks are only a faint modulation of the light (shader: cot / cotF). No fringe
//          of fibres stands on the rings any more (it read as bristles); the shader still understands kind 4 but nothing uses it.
// STREAM   Pieces added after the first reviews draw from miniRng. The cauliflower heads of the ropes, the falling ice and the heads
//          of a ring with gaps are each tested once, where they now lie, and take their phases from their stream only when they are
//          kept: nothing is burnt or replayed for them, so the ice, the rings and the ribbon are dealt by the trail as it now stands,
//          not as an earlier version dealt them. Two older devices are left as they were for a later round: the lumps on the waves
//          (their tests replayed against LEGACY_PATH) and the puffs left out at the ribbon's far end (their three draws still taken).
// EXIT     The arch, the gate and the wreath have their own copies of the trail material (same program, shared uniform objects)
//          with uFar, a fade by distance: the wreath shows inside 500 m, the gate inside 460 m, the arch inside 340 m (so the view
//          from behind the aircraft keeps its clean sky). Their walls are of nearly even thickness and carry no puff over about 4 m.
// COST     about 285k triangles, 11 draw calls, 3 programs, one 256x256 noise texture, no lights. Build about 0.7 s of script
//          (the geometry buffers are handed to three as views, not copies; the bounding sphere is taken from every eleventh vertex).
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';

const PAL = ['#0B1522', '#2C3E5E', '#131A3F', '#C9809A', '#FF7F57', '#FFC98A', '#6FE3C8'];
// the brief's camera line as (x, y, s)
export const DAWN_TRACKS_PATH = [[-150, -128, 0], [-150, -128, 60], [-150, -125, 450], [-60, -78, 630], [-20, -112, 690], [0, -135, 750],
  [18, -108, 810], [0, -85, 870], [-20, -112, 930], [0, -128, 990], [0, -95, 1350], [0, -22, 1750], [14, 12, 1975], [12, 8, 2020],
  [8, 12, 2090], [0, 8, 2240], [0, 75, 2400]];
// the camera line of the first build (the brief's line with its last leg in three pieces). The trail's axis and every seeded
// keep-or-drop decision of the first build are still taken against it, so the same seed still gives the same rings and ribbon
const LEGACY_PATH = [...DAWN_TRACKS_PATH.slice(0, 16), [0, 30.2, 2293], [0, 52.4, 2346], [0, 75, 2400]];
const TAU = Math.PI * 2;
const WV = 30;                              // the waves begin 30 m after loop 6 (s 1023): loop 7 is seen whole from below at s 1000 and threaded at its middle, s 1070
const S_NOSE = 2060, AXIS_Y = 2.2;          // aircraft nose station and fuselage axis height
const ENG_X = [11.5, 21];                   // engine centrelines either side (m)

// ---------- camera line lookup: where the lens is at each s, for clearances ----------
function makeCamTable(points) {
  const path = makePath(points.map((p) => [p[0], p[1], -p[2]]), { samples: 64 });
  const N = 1400, xs = new Float32Array(1300), ys = new Float32Array(1300), v = new THREE.Vector3();
  let k = 0, px = points[0][0], py = points[0][1], ps = 0;
  for (let i = 0; i <= N && k < 1300; i++) {
    path.pointAt(i / N, v); const s = -v.z;
    while (k < 1300 && k * 2 <= s) { const f = s > ps ? (k * 2 - ps) / (s - ps) : 0; xs[k] = lerp(px, v.x, f); ys[k] = lerp(py, v.y, f); k++; }
    px = v.x; py = v.y; ps = s;
  }
  for (; k < 1300; k++) { xs[k] = px; ys[k] = py; }
  const at = (s, out) => { const f = clamp(s / 2, 0, 1298.999), i = Math.floor(f), t = f - i; out[0] = lerp(xs[i], xs[i + 1], t); out[1] = lerp(ys[i], ys[i + 1], t); return out; };
  const tmp = [0, 0];
  // distance from a point to the camera line (searched 40 m either side of the point's own station)
  const dist = (x, y, z) => {
    const s0 = -z; let best = 1e9;
    for (let d = -40; d <= 40; d += 4) { const s = s0 + d; if (s < -30 || s > 2400) continue; at(Math.max(0, s), tmp); const dx = x - tmp[0], dy = y - tmp[1], dz = d; const q = dx * dx + dy * dy + dz * dz; if (q < best) best = q; }
    return Math.sqrt(best);
  };
  return { at, dist, path };
}

// Hermite through (s, value) knots with finite-difference slopes
function knots(pts) {
  const n = pts.length, m = new Array(n);
  for (let i = 0; i < n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; m[i] = (b[1] - a[1]) / Math.max(1e-6, b[0] - a[0]); }
  return (s) => {
    if (s <= pts[0][0]) return pts[0][1]; if (s >= pts[n - 1][0]) return pts[n - 1][1];
    let i = 0; while (s > pts[i + 1][0]) i++;
    const h = pts[i + 1][0] - pts[i][0], t = (s - pts[i][0]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * pts[i][1] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * pts[i + 1][1] + (t3 - t2) * h * m[i + 1];
  };
}

// ---------- trail geometry builder ----------
// attributes: position, normal, aA (along m, around 0..1, age 0 fresh..1 old, fade), aK (kind, spin, cornerX, cornerY), aQ (noise uv)
// kind 0 core shell, 1 halo shell, 2 sheet, 3 puff (billboard: position = centre, normal = (size, phase, driftLength), aQ = drift direction,
// aK.y = its flag, see addPuff; a drift length of -1 marks a lump that rides its tube's wander, aQ.x = metres along), 4 curtain fibre
// (no longer built). The buffers are typed arrays that double when full (plain arrays cost a tenth of a second of pushes); nv and nt
// count the vertices and triangles written.
const B_W = { p: 3, n: 3, a: 4, k: 4, q: 2 };
function newB(cap = 16384) {
  const B = { nv: 0, nt: 0, cap, capT: cap * 2, idx: new Uint32Array(cap * 6), bias: new Float32Array(cap * 2) };
  for (const key in B_W) B[key] = new Float32Array(cap * B_W[key]);
  return B;
}
function vtx(B, x, y, z, nx, ny, nz, along, around, age, fade, kind, spin, cx, cy, nu, nv) {
  if (B.nv === B.cap) { B.cap *= 2; for (const key in B_W) { const t = new Float32Array(B.cap * B_W[key]); t.set(B[key]); B[key] = t; } }
  const v = B.nv++, i3 = v * 3, i4 = v * 4, i2 = v * 2, P = B.p, N = B.n, A = B.a, K = B.k, Q = B.q;
  P[i3] = x; P[i3 + 1] = y; P[i3 + 2] = z; N[i3] = nx; N[i3 + 1] = ny; N[i3 + 2] = nz;
  A[i4] = along; A[i4 + 1] = around; A[i4 + 2] = age; A[i4 + 3] = fade; K[i4] = kind; K[i4 + 1] = spin; K[i4 + 2] = cx; K[i4 + 3] = cy; Q[i2] = nu; Q[i2 + 1] = nv;
  return v;
}
function tri(B, a, b, c, bias) {
  if (B.nt === B.capT) { B.capT *= 2; const ix = new Uint32Array(B.capT * 3), bs = new Float32Array(B.capT); ix.set(B.idx); bs.set(B.bias); B.idx = ix; B.bias = bs; }
  const t = B.nt++, i = t * 3; B.idx[i] = a; B.idx[i + 1] = b; B.idx[i + 2] = c; B.bias[t] = bias;
}

// Sweeps a lumpy tube along stations C = [{x,y,z,r,age,fade}], o = { n, closed, ref, kind, spin, rMul, lobe, lobeF, hang, squash, tile, vt, bias, kA }
// Its passes are plain functions (tubeRows, tubeFinish) and addTube only strings them together with yields between: a loop that an
// async function comes back into after an await runs unoptimised for a while each time, and these loops are most of the build.
function tubeRows(S, iA, iB) {
  const { C, m, n, closed, ref, o, noise, P, D } = S;
  for (let i = iA; i < iB; i++) {
    const c = C[i % m], a = C[closed ? (i - 1 + m) % m : Math.max(0, i - 1)], b = C[closed ? (i + 1) % m : Math.min(m - 1, i + 1)];
    let tx = b.x - a.x, ty = b.y - a.y, tz = b.z - a.z; const tl = Math.hypot(tx, ty, tz) || 1; tx /= tl; ty /= tl; tz /= tl;
    const rd = ref[0] * tx + ref[1] * ty + ref[2] * tz;
    let ux = ref[0] - rd * tx, uy = ref[1] - rd * ty, uz = ref[2] - rd * tz; const ul = Math.hypot(ux, uy, uz) || 1; ux /= ul; uy /= ul; uz /= ul;   // e2
    const ex = ty * uz - tz * uy, ey = tz * ux - tx * uz, ez = tx * uy - ty * ux;                                                            // e1 = T x e2
    for (let j = 0; j <= n; j++) {
      const ph = (j % n) / n * TAU, cs = Math.cos(ph), sn = Math.sin(ph) * (o.squash || 1);
      const dx = cs * ex + sn * ux, dy = cs * ey + sn * uy, dz = cs * ez + sn * uz;
      const r0 = c.r * (o.rMul || 1), qx = c.x + dx * r0, qy = c.y + dy * r0, qz = c.z + dz * r0;
      let rr = r0 * (1 + (o.lobe || 0) * (c.lobe ?? 1) * noise.fbm3(qx * o.lobeF, qy * o.lobeF, qz * o.lobeF, 2));
      if (o.hang) { const dn = Math.max(0, -dy); rr += o.hang * (c.hang ?? 1) * dn * dn * (0.5 + 0.5 * noise.n3(qx * 0.045, qy * 0.045 + 7, qz * 0.045)); }
      const q = (i * (n + 1) + j) * 3; P[q] = c.x + dx * rr; P[q + 1] = c.y + dy * rr; P[q + 2] = c.z + dz * rr; D[q] = dx; D[q + 1] = dy; D[q + 2] = dz;
    }
  }
}
function tubeFinish(B, S) {
  const { C, m, n, closed, o, P, D, rows, L, aScale, tile, along0, base } = S;
  for (let i = 0; i < rows; i++) {
    const c = C[i % m], i0 = closed ? (i - 1 + m) % m : Math.max(0, i - 1), i1 = closed ? (i + 1) % m : Math.min(rows - 1, i + 1);
    for (let j = 0; j <= n; j++) {
      const q = (i * (n + 1) + j) * 3, jm = ((j % n) - 1 + n) % n, jp = ((j % n) + 1) % n;
      const a = (i0 * (n + 1) + j) * 3, b = (i1 * (n + 1) + j) * 3, cq = (i * (n + 1) + jm) * 3, d = (i * (n + 1) + jp) * 3;
      const ax = P[b] - P[a], ay = P[b + 1] - P[a + 1], az = P[b + 2] - P[a + 2], bx = P[d] - P[cq], by = P[d + 1] - P[cq + 1], bz = P[d + 2] - P[cq + 2];
      let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; let nl = Math.hypot(nx, ny, nz);
      if (nl < 1e-6 || nx * D[q] + ny * D[q + 1] + nz * D[q + 2] < 0.15 * nl) { nx = D[q]; ny = D[q + 1]; nz = D[q + 2]; nl = Math.hypot(nx, ny, nz) || 1; }
      const al = along0 + L[i] * aScale;
      vtx(B, P[q], P[q + 1], P[q + 2], nx / nl, ny / nl, nz / nl, al, j / n, c.age, c.fade ?? 1, o.kind, (o.spin || 0) * (c.spin ?? 1), 0, 0, L[i] / tile + (o.nu0 || 0), (j / n) * (o.vt || 1));
    }
  }
  for (let i = 0; i < rows - 1; i++) for (let j = 0; j < n; j++) {
    const a = base + i * (n + 1) + j, b = a + (n + 1), c = b + 1, d = a + 1;
    tri(B, a, b, d, o.bias || 0); tri(B, b, c, d, o.bias || 0);
  }
}
async function addTube(B, C, o, noise, ctx) {
  const m = C.length, n = o.n, closed = !!o.closed, ref = o.ref || [0, 1, 0];
  const rows = closed ? m + 1 : m, base = B.nv;
  // arc length
  const L = new Float32Array(rows); let tot = 0;
  for (let i = 1; i < rows; i++) { const a = C[(i - 1) % m], b = C[i % m]; tot += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z); L[i] = tot; }
  const kA = o.kA || 0.25;
  // closed loops: stripes and noise must meet themselves, so the along coordinate and the noise tile are fitted to the loop
  const aScale = closed ? (Math.max(1, Math.round(kA * tot / TAU)) * TAU) / (kA * tot) : 1;
  const tile = closed ? tot / Math.max(1, Math.round(tot / o.tile)) : o.tile;
  const along0 = o.along0 || 0, P = new Float32Array(rows * (n + 1) * 3), D = new Float32Array(rows * (n + 1) * 3);
  const S = { C, m, n, closed, ref, o, noise, P, D, rows, L, aScale, tile, along0, base };
  for (let i = 0; i < rows; i += 16) { tubeRows(S, i, Math.min(rows, i + 16)); await ctx.yield(); }
  tubeFinish(B, S);
  return tot;
}

function addPuff(B, x, y, z, size, age, fade, rng, drift, wisp) {   // wisp: true = drawn out along its drift (aK.y = 1)
  const u = rng(), v = rng(), ph = rng(), base = B.nv, dl = drift ? drift[2] : 0, dx = drift ? drift[0] : 0, dy = drift ? drift[1] : 0;
  // aK.y, the puff's flag: 1 a wisp; -1..-2 a head of the vault's crown (shaded with a shadowed belly, deeper toward -2, the middle of
  // its clump); 0..0.45 a head seated in a gulf between two lobes of a canyon wall (shaded lilac in proportion)
  const w = wisp === true ? 1 : (wisp || 0);
  vtx(B, x, y, z, size, ph, dl, u, v, age, fade, 3, w, -1, -1, dx, dy); vtx(B, x, y, z, size, ph, dl, u, v, age, fade, 3, w, 1, -1, dx, dy);
  vtx(B, x, y, z, size, ph, dl, u, v, age, fade, 3, w, 1, 1, dx, dy); vtx(B, x, y, z, size, ph, dl, u, v, age, fade, 3, w, -1, 1, dx, dy);
  tri(B, base, base + 1, base + 2, 1.5); tri(B, base, base + 2, base + 3, 1.5);
}

// Builds the BufferGeometry: triangles sorted far (aircraft end, most negative z) to near, with a small per-triangle bias
// (halo shells carry a bias of several metres: a halo triangle must be drawn after every core triangle beside it, or a tube that
// runs along the track is blended in a patchwork order and shows its polygons)
// (its passes are plain functions, fbKeys, fbOrder and fbBox, for the reason given at addTube)
function fbKeys(B) {
  const nt = B.nt, key = new Float32Array(nt), p = B.p, ix = B.idx;
  let lo = 1e9, hi = -1e9;
  for (let t = 0; t < nt; t++) { const k = (p[ix[t * 3] * 3 + 2] + p[ix[t * 3 + 1] * 3 + 2] + p[ix[t * 3 + 2] * 3 + 2]) / 3 + B.bias[t]; key[t] = k; if (k < lo) lo = k; if (k > hi) hi = k; }
  // counting sort on 0.2 m buckets (stable, no comparator calls)
  const nb = Math.min(32768, Math.ceil((hi - lo) / 0.2) + 2), sc = (nb - 1) / Math.max(1e-6, hi - lo), cnt = new Uint32Array(nb + 1);
  for (let t = 0; t < nt; t++) cnt[Math.floor((key[t] - lo) * sc) + 1]++;
  for (let i = 0; i < nb; i++) cnt[i + 1] += cnt[i];
  return { key, lo, sc, cnt };
}
function fbOrder(B, K) {
  const nt = B.nt, order = new Uint32Array(nt), ix = B.idx, { key, lo, sc, cnt } = K;
  for (let t = 0; t < nt; t++) order[cnt[Math.floor((key[t] - lo) * sc)]++] = t;
  const out = B.nv > 65535 ? new Uint32Array(nt * 3) : new Uint16Array(nt * 3);
  for (let t = 0; t < nt; t++) { const s = order[t] * 3; out[t * 3] = ix[s]; out[t * 3 + 1] = ix[s + 1]; out[t * 3 + 2] = ix[s + 2]; }
  return out;
}
function fbBox(p, nv) {
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (let i = 0; i < nv * 3; i += 33) { const x = p[i], y = p[i + 1], z = p[i + 2]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; if (z < z0) z0 = z; if (z > z1) z1 = z; }
  if (nv === 0) { x0 = x1 = y0 = y1 = z0 = z1 = 0; }
  return new THREE.Sphere(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), 0.5 * Math.hypot(x1 - x0, y1 - y0, z1 - z0) + 90);   // (every eleventh vertex, and a wider margin for it)
}
async function finishB(B, ctx) {
  const K = fbKeys(B);
  await ctx.yield();
  const out = fbOrder(B, K), nv = B.nv, p = B.p;
  await ctx.yield();
  const g = new THREE.BufferGeometry();
  // (views of the build buffers, not copies: the five copies were 50 ms of the build)
  g.setAttribute('position', new THREE.BufferAttribute(p.subarray(0, nv * 3), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(B.n.subarray(0, nv * 3), 3));
  await ctx.yield();
  g.setAttribute('aA', new THREE.BufferAttribute(B.a.subarray(0, nv * 4), 4));
  g.setAttribute('aK', new THREE.BufferAttribute(B.k.subarray(0, nv * 4), 4));
  g.setAttribute('aQ', new THREE.BufferAttribute(B.q.subarray(0, nv * 2), 2));
  g.setIndex(new THREE.BufferAttribute(out, 1));
  await ctx.yield();
  // bounding sphere from the box (one pass over the typed array; the meshes are never culled, this only keeps it defined)
  g.boundingSphere = fbBox(p, nv);
  return g;
}

// A small private random stream. Pieces added after the first reviews (the cauliflower on the young tubes, the wreath round the
// portal) draw from it, so they never shift the seeded stream that shapes the rings and the ribbon.
function miniRng(seed) {
  let a = (Math.floor(seed * 1e6) ^ 0x9e3779b9) >>> 0;
  const r = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r(); r.int = (lo, hi) => Math.floor(lo + (hi - lo + 1) * r()); r.chance = (q) => r() < q;
  return r;
}

// ---------- trail layout ----------
const ageAt = (s) => clamp((1985 - s) / 1985, 0, 1);

// shared numbers for the whole trail: character, axis, the growing wave
function trailParams(rng, cam, opts) {
  const moist = opts.moist ?? (rng.chance(0.5) ? rng.range(0.62, 1) : rng.range(0.05, 0.42));
  const c = [0, 0], cy = (s) => (opts.axisCam || cam).at(s, c)[1];   // the trail's axis follows the brief's line, whatever line the camera now flies
  const axisY = knots([[0, -110], [990, -110], [1110, -104], [1230, -94.5], [1350, cy(1350)], [1450, cy(1450)], [1550, cy(1550)], [1650, cy(1650)],
    [1750, cy(1750)], [1850, cy(1750) + 0.5 * (-2.9 - cy(1750))], [1990, -2.9]]);
  const axisX = (s) => 30 * (1 - smoothstep(0, 600, s));
  const wAmp = rng.range(0.93, 1.06), wPh = rng.range(0, TAU);
  // Crow instability caught growing: half separation and lift of each tube between s 990 and 1350
  const wave = (s, out) => {
    const g = Math.sin(0.5 * Math.PI * clamp((1350 + WV - s) / 240, 0, 1)), ph = TAU * (s - 1350 - WV) / 120, sh = Math.sin(ph * 0.5);
    const pinch = 22.5 * (1 - g), h = Math.max(1.2, 22.5 * (1 - g * Math.cos(ph)) + 6 * wAmp * g * g * sh * sh);
    out[0] = h; out[1] = 0.35 * wAmp * Math.max(0, h - Math.max(1.2, pinch)); return out;
  };
  return { cam0: opts.axisCam || cam, moist, rT: lerp(0.84, 1.16, moist), hang: lerp(0.45, 1.25, moist), dens: lerp(0.6, 1.1, moist) * (opts.detail ?? 1), axisY, axisX, wave, wPh };
}

// waves + canyon tubes + the four jets (s 993 .. about 1995)
async function buildHead(ctx, rng, noise, cam, T, birth) {
  const B = newB(), w = [0, 0], cc = [0, 0];
  for (const side of [1, -1]) {
    const C = [];
    // one station of a rope at s, with half separation h and lift (as T.wave gives them). ring: part of loop 7 (no taper, no fade-in)
    const station = (s, h, lift, ring) => {
      const old = smoothstep(1350 + WV, 1010 + WV, s), wx = noise.n2(s * 0.011 + side * 7, 3.3) * (0.6 + 2.4 * old), wy = noise.n2(s * 0.012 - side * 5, 9.1) * (0.5 + 1.8 * old);
      // a rope of cloud, not a pipe: the radius swells and necks every 20-60 m
      // BIG LOBES down the canyon (s 1585-1765, where the lens flies between the ropes): the radius swells and sinks every 15-25 m,
      // so each wall is a row of large heads with gulfs between them (gulf, 0..1: its puffs shaded lilac); the small heads ride on those
      // THE CANYON OPENS (s 1540-1790, where the lens comes down between the ropes): a young rope is a slimmer one, so from s 1540
      // each rope draws in by a third, to the brief's 8 m (slim), its lobes swell and neck by 42% (not 30), the heads ride 2.4 m high
      // and the necks sag (a notched top edge). The ropes lie on the trail's own axis all the way to where the jets take over, 8 m
      // thick as the design has them: two rows of big lobes that rise ahead to meet at the aircraft. A rope has one lie, this one.
      const lobeK = ring ? 0 : smoothstep(1560, 1600, s) * (1 - smoothstep(1752, 1785, s)), lb = clamp(noise.n2(s * 0.075 + side * 5.3, 2.2) + 0.35 * noise.n2(s * 0.17 - side * 3.7, 6.1), -1, 1);
      const open = ring ? 0 : 1, slim = 1 - 0.36 * open * smoothstep(1500, 1620, s);
      const bead = (1 + 0.2 * noise.n2(s * 0.045 + side * 3.1, 1.7) + 0.1 * noise.n2(s * 0.13, side * 9.1 + 4)) * (1 + (open ? 0.42 : 0.3) * lobeK * lb);
      const st = { x: side * (h + wx * Math.min(1, h / 10)), y: T.axisY(s) + lift + wy + 2.4 * open * lobeK * lb, z: -s, s, cz: open * lobeK,
        r: T.rT * lerp(4.9, 6.4, old) * slim * bead * (ring ? 1 : 0.6 + 0.4 * smoothstep(993 + WV, 1003 + WV, s)) * (1 - 0.4 * smoothstep(1745, 1790, s)),
        age: ageAt(s), fade: (ring ? 1 : smoothstep(991 + WV, 999 + WV, s)) * (1 - smoothstep(1752, 1790, s)), lobe: 0.9 + 0.5 * old, hang: old * smoothstep(5, 18, h), gulf: lobeK * smoothstep(0.05, -0.6, lb) };
      // any stretch that would come within 10 m of the lens is pushed straight away from it
      cam.at(s, cc); const need = st.r * 1.45 + 10, ddx = st.x - cc[0], ddy = st.y - cc[1], d = Math.hypot(ddx, ddy);
      if (d < need) { const k = (need - d) / Math.max(d, 1e-3); st.x += ddx * k; st.y += ddy * k; }
      return st;
    };
    // LOOP 7 (s 1023-1140) is a pinched vortex ring, not a kite: its two arms are laid by angle round a rounded oval (a
    // superellipse: round shoulders, the arms meeting the axis square-on at both pinches), one arm 15% wider than the other (which, per
    // seed), the ring wider toward its far end (so that seen from below, the far end small with distance, it reads as an oval and
    // not as a heart), each arm with 8 m of slow wander of its own. Stations every 3 m of ARC.
    {
      const a7 = 58.5, m7 = 993 + WV + a7, lop = T.wPh > Math.PI ? 1 : -1, W7 = 47 * (1 + 0.075 * side * lop);
      let px = 0, py = 0, pz = 0, arc = 3, last = null;
      for (let i = 0; i <= 600; i++) {
        const ph = Math.PI * i / 600, cp = Math.cos(ph), sp = Math.sin(ph), s = m7 - a7 * Math.sign(cp) * Math.pow(Math.abs(cp), 0.84);
        // (at the near pinch each arm begins 6 m beyond the axis, tapered, so the two overlap: begun back to back at the axis they
        // left a slit of sky between their open ends)
        // (the far half is blunter and lies flatter: dished like the near half, its low far pinch drew the ring out into a heart)
        const far = smoothstep(0, -1, cp), near = smoothstep(0, 1, cp);
        const h0 = W7 * Math.pow(sp, 0.84 - 0.44 * far - 0.2 * near) * (1 - (cp > 0 ? 0.2 : 0.36) * cp) + 8 * sp * sp * noise.n2(s * 0.021 + side * 31, 5.5 + T.wPh), h = i < 300 ? h0 - 6 * (1 - smoothstep(0, 0.3, ph)) : Math.max(1.2, h0);
        const st = station(s, h, (0.33 - 0.2 * far) * Math.max(0, h - 1.2), true);
        st.r *= 0.5 + 0.5 * smoothstep(0, 0.1, ph);
        if (i > 0) arc += Math.hypot(st.x - px, st.y - py, st.z - pz);
        px = st.x; py = st.y; pz = st.z; last = st;
        if (arc >= 3) { C.push(st); arc -= 3; last = null; }
      }
      if (last && arc > 1.2) C.push(last);
    }
    await ctx.yield();
    for (let s = 1143; s <= 1790; s += 3) { T.wave(s, w); C.push(station(s, w[0], w[1], false)); }
    // where the rope is at each 3 m of s (the index its stations had when they lay on a 3 m grid of s)
    const sMap = new Int16Array(257).fill(-1), sErr = new Float32Array(257).fill(1e9);
    for (let i = 0; i < C.length; i++) { const k = clamp(Math.round((C[i].s - 993 - WV) / 3), 0, 256), e = Math.abs(C[i].s - (993 + WV + 3 * k)); if (e < sErr[k]) { sErr[k] = e; sMap[k] = i; } }
    for (let k = 1; k < 257; k++) if (sMap[k] < 0) sMap[k] = sMap[k - 1];
    const atS = (s) => C[clamp(sMap[clamp(Math.round((s - 993 - WV) / 3), 0, 256)], 3, C.length - 15)];
    // 24 sides and 3 m stations with real lobes (the taut 16-sided pipe read as a painted ribbon); the halo has 16 sides
    await addTube(B, C, { n: 24, kind: 0, spin: side, lobe: 0.17, lobeF: 0.06, tile: 62, vt: 1, along0: 993 }, noise, ctx);
    await ctx.yield();
    await addTube(B, C, { n: 16, kind: 1, spin: side, rMul: 1.34, lobe: 0.16, lobeF: 0.045, hang: 3.2 * T.hang, tile: 62, vt: 1, bias: 7, along0: 993, nu0: 0.37 }, noise, ctx);
    await ctx.yield();
    // jets: each tube unwinds into two; station list runs up-trail to where the jet is born from clear air
    for (let pair = 0; pair < 2; pair++) {
      const sB = birth[pair], J = [];
      for (let s = 1738; s <= sB + 0.01; s += 3) {
        const f = clamp((1975 - s) / 225, 0, 1.06), ff = f * f * (3 - 2 * Math.min(1, f));
        const xc = lerp(16.25, 22.5, Math.min(1, ff)), rho = lerp(4.75, 1.1, smoothstep(0.35, 1, f)), th = (pair === 0 ? Math.PI : 0) + 2.25 * Math.PI * Math.pow(f, 1.6);
        const d = sB - s, fl = noise.n2(s * 0.09 + pair * 13, side * 4.2), bn = noise.n2(s * 0.19 + pair * 7.3, side * 2.9 + 11);
        J.push({ x: side * (xc + rho * Math.cos(th)), y: T.axisY(s) + rho * Math.sin(th) + (pair === 0 ? 0.25 : -0.25) * smoothstep(40, 0, d), z: -s,
          r: T.rT * (1.3 + 1.3 * smoothstep(0.1, 0.9, f)) * (0.12 + 0.88 * Math.pow(smoothstep(0, 26, d), 0.7)) * (1 + 0.16 * fl) * (1 + 0.48 * bn),   // beaded every 9-14 m: nacelle-sized heads with necks the deck shows through
          age: clamp(d / 1985, 0, 1), fade: smoothstep(0, 9, d) * smoothstep(1738, 1772, s) * (0.3 + 0.7 * smoothstep(-0.62, -0.08, bn)), lobe: 1, bn });
      }
      // 12 sides, so each jet is lit as a round rope (lilac top, coral flank); the halo is a thin sheath (at 1.55 radii it made a jet
      // seen from above a flat band twice its width)
      await addTube(B, J, { n: 12, kind: 0, spin: side, lobe: 0.2, lobeF: 0.12, tile: 40, vt: 1, along0: 1738 }, noise, ctx);
      await addTube(B, J, { n: 8, kind: 1, spin: side, rMul: 1.25, lobe: 0.25, lobeF: 0.09, tile: 40, vt: 1, bias: 3, along0: 1738, nu0: 0.6 }, noise, ctx);
      await ctx.yield();
      // THE BEADS (private stream): small lit puffs seated round every head of each jet from a few metres behind its birth,
      // riding the tube. Each has its own lit and shadow side, which is what makes a rope read round from above and behind;
      // none on the necks, and only small torn ones in the last 25 m, where the jet freezes out of clear air.
      {
        const rj = miniRng(T.wPh + 0.9 + 0.13 * side + 0.29 * pair); let al = 1738;
        for (let i = 0; i < J.length; i++) { if (i) al += Math.hypot(J[i].x - J[i - 1].x, J[i].y - J[i - 1].y, 3); J[i].al = al; }
        // (each bead's centre is sunk 40-75% of its own radius into the core, so it is a lump OF the rope and not a ball beside it;
        // sizes 0.6-3 m, most of them small; one in six has a second head against it)
        for (let i = 0; i < 620; i++) {
          const c = J[rj.int(8, J.length - 1)], d = sB + c.z, a = rj.range(0, TAU), q = 0.25 + 0.75 * Math.pow(rj(), 1.8), sink = rj.range(0.4, 0.75), dz = rj.range(-1.5, 1.5), dbl = rj() < 0.17;
          // (ONE BEAD IN THREE is laid, and each is sunk 55-95% of its own radius into the core: at three times the number and sunk
          // 40-75% they stood along each jet as a string of same-sized balls. The rope's knots are now the core's own, see the shader)
          if (c.bn < -0.25 || d < 4 || i % 3 !== 0) continue;
          const sk = 0.55 + (sink - 0.4) * (0.4 / 0.35);
          const sz = clamp(c.r * 1.15 * q * (d < 25 ? 0.6 : 1), 0.6, 3.0), rc = Math.max(0.1 * c.r, c.r - sk * sz), x = c.x + Math.cos(a) * rc, y = c.y + Math.sin(a) * rc;
          if (cam.dist(x, y, c.z + dz) <= sz + 7) continue;
          addPuff(B, x, y, c.z + dz, sz, c.age, 0.85 * Math.min(1, d / 12), rj, [c.al, 0, -1]);
          if (dbl && sz > 0.9) addPuff(B, x + Math.cos(a + 1.2) * sz * 0.55, y + Math.sin(a + 1.2) * sz * 0.55, c.z + dz + 0.8 * sz, sz * 0.68, c.age, 0.85 * Math.min(1, d / 12), rj, [c.al + 0.8 * sz, 0, -1]);
        }
      }
      await ctx.yield();
    }
    // lumps on the waves, wisps peeling off the canyon walls, flecks where the jets freeze
    const nL = Math.round(70 * T.dens), nW = Math.round(180 * T.dens);
    // The lumps sit inside the wall (0.35-0.65 of the radius; at 0.7-0.95 the tube's sway left some hanging beside it as pom-poms)
    // and ride its wander. A changed placement rule must not shift the random stream of everything built after it, so the stream
    // is advanced exactly as the first rule advanced it: a lump only the new rule keeps takes its phases from a hash (alt).
    // the tube as the first build laid it (C0): only its keep-or-drop tests are replayed, against the first camera line, so the
    // seeded stream is advanced exactly as it was and the rings and the ribbon built after this come out unchanged
    const C0 = [], cam0 = T.cam0;
    for (let s = 993; s <= 1790; s += (s < 1350 ? 3 : 5)) {
      T.wave(s + WV, w);                                                   // the wave as it lay in the first build
      const old = smoothstep(1350, 1010, s), wx = noise.n2(s * 0.011 + side * 7, 3.3) * (0.6 + 2.4 * old), wy = noise.n2(s * 0.012 - side * 5, 9.1) * (0.5 + 1.8 * old);
      const st = { x: side * (w[0] + wx * Math.min(1, w[0] / 10)), y: T.axisY(s) + w[1] + wy, z: -s, r: T.rT * lerp(4.0, 6.2, old) * (0.35 + 0.65 * smoothstep(993, 1006, s)) * (1 - 0.4 * smoothstep(1745, 1790, s)) };
      if (s < 1340) { cam0.at(s, cc); const need = st.r * 1.45 + 10, d = Math.hypot(st.x - cc[0], st.y - cc[1]); if (d < need) st.y += need - d; }
      C0.push(st);
    }
    let hk = side * 517; const alt = () => { hk += 1; const v = Math.sin(hk * 91.7 + 3.1) * 43758.5453; return v - Math.floor(v); };
    const keep = (was, now, ...args) => { if (now) addPuff(B, ...args.slice(0, 6), was ? rng : alt, ...args.slice(6)); else if (was) { rng(); rng(); rng(); } };
    let al = 993; for (let i = 0; i < C.length; i++) { if (i > 0) al += Math.hypot(C[i].x - C[i - 1].x, C[i].y - C[i - 1].y, C[i].z - C[i - 1].z); C[i].al = al; }
    for (let i = 0; i < nL; i++) {
      const ci = Math.floor(rng.range(2, 118)), c = atS(993 + WV + 3 * ci), c0 = C0[ci], a = rng.range(0, TAU), dn = rng.chance(0.55) ? -Math.abs(Math.sin(a)) : Math.sin(a), k0 = rng.range(0.7, 0.95), k = 0.35 + (k0 - 0.7) * 1.2;
      const q = rng.range(0.28, 0.5), x = c.x + Math.cos(a) * c.r * k, y = c.y + dn * c.r * k * 1.1, sz0 = c0.r * q, sz = c.r * q * 0.85;
      keep(cam0.dist(c0.x + Math.cos(a) * c0.r * k0, c0.y + dn * c0.r * k0 * 1.1, c0.z) > sz0 + 8, cam.dist(x, y, c.z) > sz + 8 && c.fade > 0.9, x, y, c.z, sz, c.age, 0.8, [c.al, 0, -1]);
    }
    await ctx.yield();
    // THE CAULIFLOWER: the waves and the canyon are built like the rings, from many small lit puffs seated all round the wall (each
    // has its own lit and shadow side) with a few larger ones standing proud; they ride the tube's wander. Private stream.
    const rq = miniRng(T.wPh + (side > 0 ? 0.31 : 0.77)), nC = Math.round(1850 * Math.max(0.85, T.dens));
    // one head on the rope at station c: angle a round it, kk radii out, q radii across (abs: q is metres), at z. DOWN THE CANYON
    // (c.cz) a head sits in the rope's surface (no further out than 1.02 radii, no larger than 0.62 of one), so a lobe is a heap of
    // heads and not a cloud of them; in a gulf between two lobes (c.gulf) up to four in ten are left out and the rest are smaller and
    // lilac, so the gulfs stay open and the wall is a row of separate lobes. One test, on the head as it now lies (now): a head
    // that is kept takes its phases from the private stream as they fall, and a head left out draws nothing more.
    const head = (c, i, a, kk, q, abs, z) => {
      const g = c.gulf || 0, cz = c.cz || 0, k2 = lerp(kk, Math.min(kk, 1.02) * (1 - 0.12 * g), cz), sz = (abs ? q * (1 - 0.25 * cz) : c.r * lerp(q, Math.min(q, 0.62), cz)) * (1 - 0.3 * g * cz);
      const x = c.x + Math.cos(a) * c.r * k2, y = c.y + Math.sin(a) * c.r * k2, fi = i * 0.6180339887;
      const now = c.fade > 0.9 && cam.dist(x, y, z) > sz + 7 && !(cz * g > 0.2 && fi - Math.floor(fi) < 0.45 * g);
      if (now) addPuff(B, x, y, z, sz, c.age, 0.85, rq, [c.al, 0, -1], 0.45 * g);
    };
    for (let i = 0; i < nC; i++) {
      const c = C[rq.int(3, C.length - 15)], big = i % 5 === 0, a = rq.range(0, TAU), kk = big ? rq.range(0.9, 1.15) : rq.range(0.8, 1.05);
      const q = big ? rq.range(0.5, 0.85) : rq.range(0.26, 0.6), z = c.z + rq.range(-1.5, 1.5);
      head(c, i, a, kk, q, false, z);
      if (i % 200 === 199) await ctx.yield();
    }
    // twice the heads where the lens passes close: round loop 7 (threaded at its middle) and down the canyon (s 1590-1760, a rope
    // 22 m to either side). There the puffs, each with its own lit and shadow side, carry the wall and the core is only their backing.
    for (let i = 0; i < Math.round(760 * Math.max(0.85, T.dens)); i++) {
      const sA = i % 5 < 2 ? rq.range(1001 + WV, 1165) : rq.range(1585, 1765), c = atS(sA);
      const big = i % 4 === 0, a = rq.range(0, TAU), kk = big ? rq.range(0.95, 1.2) : rq.range(0.85, 1.08);
      const q = big ? rq.range(0.5, 0.8) : rq.range(0.28, 0.55), z = c.z + rq.range(-1.5, 1.5);
      head(c, i + 0.37, a, kk, q, false, z);
      if (i % 200 === 199) await ctx.yield();
    }
    // BESIDE THE LENS (the canyon at s 1595-1765, where a rope passes 16-22 m away): three times the heads again, small ones
    // (1.4-3.6 m) seated on the inner face that the lens looks along, standing a little proud so each shows its own shadow
    // side. The core thins to nothing there (shader) and these carry the wall as a heap of separate heads.
    for (let i = 0; i < Math.round(950 * Math.max(0.85, T.dens)); i++) {
      const c = atS(rq.range(1595, 1765)), a = (side > 0 ? Math.PI : 0) + rq.range(-1.45, 1.45), kk = rq.range(0.82, 1.22);
      const sz = rq.range(1.4, 3.6), z = c.z + rq.range(-1.5, 1.5);
      head(c, i + 0.71, a, kk, sz, true, z);
      if (i % 200 === 199) await ctx.yield();
    }
    await ctx.yield();
    // one in five (cross) is a smaller, brighter streak that starts under the canyon's side of the rope and is drawn further in as it falls
    for (let i = 0; i < nW; i++) {
      const c0 = C0[Math.floor(rng.range(120, C0.length - 12))], c = atS(-c0.z), a = rng.range(0, TAU), cross = i % 5 === 0;
      const dx = cross ? -side * rng.range(0.9, 1) : Math.cos(a);
      let dl = cross ? rng.range(13, 27) : rng.range(5, 12); const sz0 = cross ? rng.range(0.15, 0.4) : rng.range(0.45, 1.15), sz = cross ? 0.32 + (sz0 - 0.15) * 1.6 : sz0;   // crossing flecks 0.32-0.72 m
      // ICE FALLING FROM THE TRAIL (flag 0.75): what leaves the ropes is a fall of fine ice, every streak of it going the same way:
      // down, drawn a little toward the canyon's middle by the downwash, 5-13 m in twenty seconds. (Sent off round the rope in
      // every direction and across the canyon, as they first were, the same streaks hung in the air at all angles as debris.)
      // A streak is kept where its own fall is clear of the camera line (clr) and takes its phases from the stream as they fall;
      // one that is left out draws nothing more. Nothing here is replayed on an earlier lie of the rope.
      // It starts under the rope (laid round it, a streak hung in front of the lit wall and read as a scratch across it).
      const fx = -side * (cross ? 0.3 : 0.14), fl = cross ? dl * 0.5 : dl * 1.1, szI = sz * 0.85, xI = c.x + dx * c.r * 0.5, yI = c.y - c.r * 0.8;
      const clr = (l) => cam.dist(xI + fx * l, yI - l, c.z) > szI * 3.4 + 6;
      if (clr(fl) && clr(fl * 0.6) && clr(fl * 0.25)) addPuff(B, xI, yI, c.z, szI, c.age, cross ? 0.9 : 0.6, rng, [fx, -1, fl], 0.75);
    }
    await ctx.yield();
    for (let pair = 0; pair < 2; pair++) for (let i = 0; i < Math.round(16 * T.dens); i++) {
      const s = birth[pair] - rng.range(2, 60), a = rng.range(0, TAU);
      addPuff(B, side * (ENG_X[pair] + Math.cos(a) * 1.4), T.axisY(s) + Math.sin(a) * 1.2, -s, 0.5 + (rng.range(1.2, 2.6) - 1.2) * 0.5, 0.0, 0.5, rng, [Math.cos(a) * 0.3, Math.sin(a) * 0.3, 2.5], true);   // 0.5-1.2 m, torn (as discs of 1.2-2.6 m they read as bokeh)
    }
    await ctx.yield();
  }
  return finishB(B, ctx);
}

// one vortex ring (loops 4..6, the exit rings), built about its own centre so it can rock and bob.
// NO TWO RINGS ARE AT THE SAME STAGE. R.gaps [[angle round the ring, half width (radians), depth 0..1], ...]: where an old ring has
// begun to burst, its wall necks down to nothing and frays (loop 4 is a C; the gate is whole but for one shallow neck; the arch is a whole closed ring).
// R.curtain: the thin torn curtain a ring drags up above its high side (loop 5). R.shed: a lobe it has just shed below its low
// side (loop 6). A gap takes no draw of its own: a head is tested and placed on the wall as it is, and where the wall is more than
// half gone none is laid and nothing more is drawn for it (so a ring with gaps deals what is built after it by its own wall); the
// curtain and the lobe have a private stream.
async function buildRing(ctx, rng, noise, cam, T, R) {
  const B = newB(), M = 192, cT = Math.cos(R.tilt), sT = Math.sin(R.tilt), k = R.noseDown ? 1 : -1;
  const n = [0, cT, k * sT], u = [0, k * sT, -cT], C = [], sd = rng.range(0, 50), pw = 2 / rng.range(2.2, 2.7);
  const gapAt = (ps) => { let o = 0; for (const g of R.gaps || []) { let d = Math.abs(ps - g[0]) % TAU; if (d > Math.PI) d = TAU - d; o = Math.max(o, g[2] * (1 - smoothstep(g[1] * 0.4, g[1], d))); } return o; };
  for (let i = 0; i < M; i++) {
    const ps = i / M * TAU, c0 = Math.cos(ps), s0 = Math.sin(ps), cp = Math.sign(c0) * Math.pow(Math.abs(c0), pw), sp = Math.sign(s0) * Math.pow(Math.abs(s0), pw);
    const ra = R.a * (1 + 0.08 * noise.n2(c0 * 1.2 + sd, s0 * 1.2) + 0.035 * noise.n2(c0 * 3.4 - sd, s0 * 3.4)), rb = R.b * (1 + 0.09 * noise.n2(c0 * 1.2 - sd, s0 * 1.2 + 4) + 0.04 * noise.n2(c0 * 3.1 + sd, s0 * 3.1 + 7)), wob = (R.wob ?? 8.5) * noise.n2(c0 * 1.6 + 9, s0 * 1.6 + sd);
    const x = ra * cp, y = u[1] * rb * sp + n[1] * wob, z = u[2] * rb * sp + n[2] * wob;
    // (R.even: the exit rings, whose walls are of nearly even thickness all round; see buildHero)
    const r0 = 0.5 * R.wall * T.rT * (R.even ? 0.8 + 0.16 * c0 * c0 : 0.68 + 0.46 * c0 * c0) * (1 + (R.even ? 0.2 : 0.3) * noise.n2(c0 * 3.1 + sd, s0 * 3.1 - 2));
    const op = clamp(gapAt(ps) * (0.85 + 0.3 * noise.n2(c0 * 5.3 - sd, s0 * 5.3 + 3)), 0, 1);   // 0 whole .. 1 gone; the ends of a gap are ragged
    C.push({ x, y, z, r: r0 * (1 - 0.72 * op), open: op, age: R.age ?? ageAt(R.s), fade: 1 - smoothstep(0.3, 0.62, op),
      hang: 0.35 + 0.65 * smoothstep(10, -25, y), lobe: 1 });
  }
  // core 192 x 32 (2.2 m by 1.5 m quads at the 22 m pass) with gentle lobes; the lumps are carried by puffs hugging the wall.
  // The halo is only seen from afar (it fades within 55 m), so it rides every other station.
  await addTube(B, C, { n: 32, closed: true, ref: n, kind: 0, spin: 0.55, lobe: 0.24, lobeF: 0.055, hang: 5 * T.hang * (R.hangK ?? 1), tile: 52, vt: 1 }, noise, ctx);
  await ctx.yield();
  await addTube(B, C.filter((c, i) => i % 2 === 0), { n: 20, closed: true, ref: n, kind: 1, spin: 0.55, rMul: 1.36, lobe: 0.2, lobeF: 0.04, hang: 6.5 * T.hang * (R.hangK ?? 1), tile: 52, vt: 1, bias: 7, nu0: 0.41 }, noise, ctx);
  await ctx.yield();
  const ok = (x, y, z, sz) => cam.dist(x + R.x, y + R.y, z - R.s) > sz + 12;
  // R.puffMax (the exit rings, which the lens meets face-on): a puff larger than this is laid as three smaller heads instead. Face-on,
  // one puff of 8 m was a flat disc in the ring's limb. Loops 4-6 set no cap: each of their heads is one puff.
  const put = (x, y, z, sz, age, fade, drift) => {
    if (!(sz > R.puffMax)) { addPuff(B, x, y, z, sz, age, fade, rng, drift); return; }
    for (let k = 0; k < 3; k++) { const a = rng.range(0, TAU), q = rng.range(0.4, 0.56); addPuff(B, x + Math.cos(a) * sz * 0.5, y + Math.sin(a) * sz * 0.45, z + rng.range(-0.5, 0.5) * sz, sz * q, age, fade, rng, drift); }
  };
  // a cauliflower of small lit lobes on the wall: many small puffs seated in the surface, a few larger ones standing proud
  // (a head at a gap: none where the wall is more than half gone, smaller ones on its thinning ends. Each head is tested and placed
  // on the wall as it is, and one that is not laid draws nothing beyond what its loop has already drawn)
  for (let i = 0; i < Math.round(560 * (R.puffK ?? 1) * Math.max(0.85, T.dens)); i++) {
    const big = i % 5 === 0, c = C[rng.int(0, M - 1)], a = rng.range(0, TAU), el = rng.range(-1, 0.75), ce = Math.sqrt(1 - el * el);
    const kk = big ? rng.range(0.9, 1.15) : rng.range(0.84, 1.08), q = big ? rng.range(0.5, 0.85) : rng.range(0.25, 0.6);
    const dx = Math.cos(a) * ce * c.r * kk, dy = el * c.r * kk, dz = Math.sin(a) * ce * c.r * kk;
    if (c.open <= 0.5 && ok(c.x + dx, c.y + dy, c.z + dz, c.r * q)) put(c.x + dx, c.y + dy, c.z + dz, c.r * q, c.age, 0.85, null);
    if (i % 160 === 159) await ctx.yield();
  }
  // lobes dripping from the low side
  for (let i = 0; i < Math.round(70 * (R.puffK ?? 1) * T.dens * T.hang); i++) {
    const c = C[rng.int(0, M - 1)]; if (c.hang < 0.5 && rng.chance(0.7)) continue;
    const d = rng.range(0.9, 1.9), sz = c.r * rng.range(0.7, 0.4) * (1.3 - 0.3 * d), x = c.x + rng.range(-3, 3), y = c.y - c.r * d, z = c.z + rng.range(-3, 3);
    if (c.open <= 0.5 && ok(x, y - 5, z, sz)) put(x, y, z, sz, c.age, 0.8, rng.chance(0.5) ? [0, -1, rng.range(4, 9)] : null);
  }
  const rs = miniRng(T.wPh + 0.00071 * R.s + 0.37), hiS = Math.sign(u[1]) || 1;   // hiS: the sign of sin(angle) on the ring's high side
  if (R.curtain) {
    // THE CURTAIN (kind 2, the sheet's shader: torn by noise, a little gold along its tears): a thin veil standing up to 44 m above the
    // ring's high arc, densest at the wall and frayed to nothing at its top, combed upward, leaning and billowing slowly.
    // Nothing of it comes within 14 m of the camera line.
    const cols = [], NR = 8; let arc = 0;
    for (let i = 0; i < M; i += 2) { const w = smoothstep(0.2, 0.75, hiS * Math.sin(i / M * TAU)); if (w > 0.01) cols.push([i, w]); }
    for (let q = 0; q < cols.length; q++) {
      const i = cols[q][0], w = cols[q][1], c = C[i], a = C[(i - 2 + M) % M], b = C[(i + 2) % M];
      if (q > 0) arc += Math.hypot(c.x - C[cols[q - 1][0]].x, c.y - C[cols[q - 1][0]].y, c.z - C[cols[q - 1][0]].z);
      let tx = b.x - a.x, tz = b.z - a.z; const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const H = 44 * Math.pow(w, 0.7) * (0.6 + 0.4 * noise.n2(arc * 0.03 + sd, 4.4)), lean = 5 * noise.n2(arc * 0.02 - sd, 8.1);
      for (let j = 0; j <= NR; j++) {
        const t = j / NR, h = t * H, bw = (2.5 + 5 * t) * noise.n2(arc * 0.045 + sd, h * 0.06 + 2.7) + lean * t * t;
        const x = c.x - tz * bw, y = c.y + 0.45 * c.r + h, z = c.z + tx * bw, clear = cam.dist(x + R.x, y + R.y, z - R.s) > 14;
        // (fade: the sheet's shader tears a strip open below about 0.85 and leaves nothing below 0.7; at 0.95 falling as (1 - t)^0.6
        // nothing of the curtain was drawn at all)
        // (flag 0.5 marks the curtain for the shader: thinner than the ribbon's sheet, hardly any gold on its tears, its noise lifting
        // slowly. Torn 2.6 times taller than wide, solid below and gold-edged, it stood on the ring as a row of flames)
        // (ONE VEIL, NOT A ROW OF TONGUES: the fade holds its full value up to 45% of the height, so neighbouring columns join there,
        // and only then falls toward the top; the noise is laid 2.3 times as long along the ring as up the veil, so what tears it open
        // are gaps wider than they are tall and the top frays into low scallops)
        vtx(B, x, y, z, -tz, 0, tx, arc, t, c.age, clear ? Math.pow(w, 0.3) * (1 - 0.3 * smoothstep(0.45, 1, t)) : 0, 2, 0.5, 0, 0, arc / 120 + 0.2, h / 52);
      }
    }
    const b0 = B.nv - cols.length * (NR + 1);
    for (let q = 0; q < cols.length - 1; q++) for (let j = 0; j < NR; j++) { const a = b0 + q * (NR + 1) + j, b = a + NR + 1; tri(B, a, b, a + 1, 0); tri(B, b, b + 1, a + 1, 0); }
    await ctx.yield();
  }
  if (R.shed) {
    // THE SHED LOBE: a cloudlet 14 m across that has dropped away under the ring's low side, a few small heads still strung
    // between it and the wall. A heap of overlapping heads, biggest in its middle (a lone puff reads as a cotton ball).
    let lo = 0; for (let i = 1; i < M; i++) if (C[i].y < C[lo].y) lo = i;
    const c = C[(lo + 9) % M], cx = c.x + 5, cy = c.y - c.r - 17, cz = c.z + 3;
    for (let i = 0; i < 30; i++) {
      const f = Math.pow((i + rs()) / 30, 0.8), a = rs.range(0, TAU), el = rs.range(-1, 1), ce = Math.sqrt(1 - el * el), sz = lerp(5.2, 2.0, f) * rs.range(0.8, 1.15);
      const x = cx + Math.cos(a) * ce * 7.5 * f, y = cy + el * 4.6 * f - 1.5 * f * f, z = cz + Math.sin(a) * ce * 6.5 * f;
      if (ok(x, y, z, sz)) addPuff(B, x, y, z, sz, c.age, 0.85, rs, null);
    }
    for (let i = 0; i < 5; i++) { const t = (i + 0.5) / 5, sz = lerp(3.0, 1.7, Math.sin(Math.PI * t)), x = lerp(c.x, cx, t) + rs.range(-1, 1), y = lerp(c.y - c.r * 0.9, cy + 4, t), z = lerp(c.z, cz, t) + rs.range(-1, 1); if (ok(x, y, z, sz)) addPuff(B, x, y, z, sz, c.age, 0.8, rs, null); }
  }
  return finishB(B, ctx);
}

// the ragged ribbon: torn sheet with hanging lobes, three burst horseshoes inside it (s -60 .. 600).
// tgt = loop 4 { x, y, s }: the ribbon keeps a SIGHT WINDOW on it. From every station of the camera line under the sheet (s 0..450)
// loop 4 is an oval ahead-right; whatever lies inside that oval's cone is opened (sheet), kept shallow (lobes), faded (horseshoes)
// or rejected (puffs), so the entry frame has its focal point: a bright ring through a ragged gap, the ceiling above and left of it,
// the body of the ribbon to its right.
async function buildRibbon(ctx, rng, noise, cam, T, tgt) {
  const B = newB(), c2 = [0, 0], o1 = rng.range(0, 90), o2 = rng.range(0, 90), CELL = 31;
  // (the lobes' hash is asked for 36 times at every look-up of the sheet: each cell's values are kept once worked out. Same values.)
  const HC = new Float64Array(26 * 32 * 4).fill(-1), hsh0 = (i, j, k) => { const v = Math.sin(i * 127.1 + j * 311.7 + k * 74.7 + o1) * 43758.5453; return v - Math.floor(v); };
  const hsh = (i, j, k) => { if (i < -13 || i > 12 || j < -6 || j > 25) return hsh0(i, j, k); const q = ((j + 6) * 26 + i + 13) * 4 + k - 1; let v = HC[q]; if (v < 0) { v = hsh0(i, j, k); HC[q] = v; } return v; };
  // the stations of the camera line under the sheet, as [s, x, y] (the line dips and drifts toward the axis: each station's own cone is used)
  const SC = []; for (let sc = 0; sc <= 450; sc += 15) { cam.at(sc, c2); SC.push([sc, c2[0], c2[1]]); }
  // 1 on the edge of loop 4's oval as seen from some station of the camera line, less inside it (9: never in the way)
  const sight = (x, y, s) => {
    let best = 9;
    for (const S of SC) {
      const sc = S[0]; if (s <= sc + 4) break;
      const t = (s - sc) / (tgt.s - sc); if (t >= 1) continue;
      const q = Math.hypot((x - (S[1] + (tgt.x - S[1]) * t)) / (t * 88 + 4), (y - (S[2] + (tgt.y - S[2]) * t)) / (t * 50 + 2));
      if (q < best) best = q;
    }
    return best;
  };
  // the highest point of those ovals above (x, s): nothing may hang below it there
  const sightTop = (x, s) => {
    let top = -1e9;
    for (const S of SC) {
      const sc = S[0]; if (s <= sc + 4) break;
      const t = (s - sc) / (tgt.s - sc); if (t >= 1) continue;
      const dn = (x - (S[1] + (tgt.x - S[1]) * t)) / ((t * 88 + 4) * 1.18); if (Math.abs(dn) >= 1) continue;
      const y = S[2] + (tgt.y - S[2]) * t + (t * 50 + 2) * 1.1 * Math.sqrt(1 - dn * dn) + 1.5; if (y > top) top = y;
    }
    return top;
  };
  // height of the sheet's underside and its density at (x, s)
  const sheetAt = (x, s, out) => {
    const w = x - T.axisX(s), und = 4.5 * noise.fbm2(x / 150 + o1, s / 150, 3);
    const mask = smoothstep(-0.3, 0.3, noise.fbm2(x / 170 + o2, s / 170 + 5, 2)) * (1 - 0.6 * smoothstep(330, 520, s));
    // pendulous lobes: domes on a jittered grid
    const gi = Math.floor(x / CELL), gj = Math.floor(s / CELL); let lobe = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const ci = gi + a, cj = gj + b, px = (ci + 0.2 + 0.6 * hsh(ci, cj, 1)) * CELL, pz = (cj + 0.2 + 0.6 * hsh(ci, cj, 2)) * CELL, rc = CELL * (0.42 + 0.26 * hsh(ci, cj, 3));
      const d2 = ((x - px) * (x - px) + (s - pz) * (s - pz)) / (rc * rc);
      if (d2 < 1) lobe = Math.max(lobe, Math.pow(1 - d2, 1.15) * (0.3 + 0.7 * hsh(ci, cj, 4)));   // rounded rim: a square-root dome ends in a cliff that shows as flat facets
    }
    cam.at(clamp(s, 0, 2400), c2);
    const clr = c2[1] < -117 ? smoothstep(7, 34, Math.abs(x - c2[0])) : 1;   // lobes shallow out over the lens while it is under the sheet
    const y0 = -110 + und - 3, top = sightTop(x, s);
    let room = lobe * mask * clr * 24 * Math.min(1.1, 0.55 + 0.5 * T.hang);
    if (top > -1e8) room = Math.min(room, Math.max(0, y0 - top));            // and never hang into the sight window
    // the sheet itself only swells 8 m (a 24 m dome on a 5 m grid is a cliff of flat facets from 18 m below); the rest of each
    // lobe's depth is hung from it as puffs (out[4] = room left under the sheet)
    const depth = Math.min(room, 8 * lobe * mask * clr), y = y0 - depth;
    const gap = smoothstep(5, 13, Math.hypot(x - c2[0], y - c2[1]));         // the sheet opens where the lens climbs through it
    const open = smoothstep(1.0, 1.3, sight(x, y0, s));                      // and where it would stand in front of loop 4
    // the left edge reaches 25 m further out between s 60 and 520: with the window open to the right, this strip is the ceiling
    const wl = w < 0 ? -w - 25 * smoothstep(40, 200, s) * (1 - smoothstep(430, 540, s)) : w;
    const edge = 1 - smoothstep(176, 216, wl + 24 * noise.fbm2(s / 70 + o2, w / 110, 2));
    const ends = smoothstep(-60, -10, s) * (1 - smoothstep(360, 560, s + 55 * noise.n2(x / 90, s / 120 + o1)));
    const hole = smoothstep(10, 25, Math.hypot(x + 150, s - 4));
    out[0] = y; out[1] = clamp(edge * ends, 0, 1) * hole * gap * open; out[2] = lobe * mask; out[3] = depth; out[4] = room - depth; return out;
  };
  // a 5 m grid throughout: at 10 m the folds between lobes showed as straight-edged panes from 18 m below
  const ws = []; for (let w = -240; w <= 215; w += 5) ws.push(w);
  const ss = []; for (let s = -60; s <= 570; s += 5) ss.push(s);
  const nx = ws.length, nz = ss.length, Y = new Float32Array(nx * nz), F = new Float32Array(nx * nz), o = [0, 0, 0, 0, 0], base = B.nv;
  for (let j = 0; j < nz; j++) { for (let i = 0; i < nx; i++) { sheetAt(T.axisX(ss[j]) + ws[i], ss[j], o); Y[j * nx + i] = o[0]; F[j * nx + i] = o[1]; } if (j % 2 === 1) await ctx.yield(); }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(nx - 1, i + 1), j0 = Math.max(0, j - 1), j1 = Math.min(nz - 1, j + 1), x = T.axisX(ss[j]) + ws[i];
    // underside normal (pointing down): slope of the height field
    const sx = (Y[j * nx + i1] - Y[j * nx + i0]) / (ws[i1] - ws[i0]), sz = (Y[j1 * nx + i] - Y[j0 * nx + i]) / (ss[j1] - ss[j0]), nl = Math.hypot(sx, 1, sz);
    vtx(B, x, Y[j * nx + i], -ss[j], sx / nl, -1 / nl, -sz / nl, ss[j], x / 50, ageAt(ss[j]), F[j * nx + i], 2, 0, 0, 0, x / 90, ss[j] / 72);
    if (i === 0 && j % 12 === 11) await ctx.yield();
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const a = base + j * nx + i, b = a + 1, c = a + nx + 1, d = a + nx;
    if (F[j * nx + i] + F[j * nx + i + 1] + F[(j + 1) * nx + i] + F[(j + 1) * nx + i + 1] < 0.02) continue;
    tri(B, a, d, b, 0); tri(B, b, d, c, 0);
  }
  await ctx.yield();
  // loops 1..3: swollen horseshoes, burst open, the oldest most smeared. They sit in the right-hand body of the ribbon (dx), clear
  // of the sight window; any stretch that would still cross it thins away.
  const shoes = [{ s: 505, a: 72, b: 62, r: 10.5, arc: 0.84, tilt: 0.4, open: 0, dx: 132 }, { s: 335, a: 90, b: 70, r: 12, arc: 0.7, tilt: 0.2, open: 1, dx: 85 }, { s: 165, a: 102, b: 74, r: 13.5, arc: 0.58, tilt: 0.1, open: 0, dx: 28 }];
  const shoeC = [];
  for (const h of shoes) {
    const C = [], M = 76, th = h.tilt * rng.range(0.8, 1.2), n = [0, Math.cos(th), Math.sin(th)], u = [0, Math.sin(th), -Math.cos(th)], cx = T.axisX(h.s) + h.dx + rng.range(-14, 14), sd = rng.range(0, 40);
    const p0 = (h.open ? Math.PI * 1.5 : Math.PI * 0.5) + Math.PI * (1 - h.arc) + rng.range(-0.25, 0.25);
    for (let i = 0; i < M; i++) {
      const f = i / (M - 1), ps = p0 + f * TAU * h.arc, c0 = Math.cos(ps), s0 = Math.sin(ps), end = Math.sin(Math.PI * f);
      const ra = h.a * (1 + 0.1 * noise.n2(f * 3 + sd, 1.1)), rb = h.b * (1 + 0.12 * noise.n2(f * 3 - sd, 5.1));
      const x = cx + ra * c0, y = -113 + u[1] * rb * s0 + 4 * noise.n2(f * 4 + sd, 8.8), z = -h.s + u[2] * rb * s0, r = h.r * T.rT * (0.45 + 0.55 * Math.pow(end, 0.5)) * (1 + 0.22 * noise.n2(f * 7 + sd, 2.2));
      const win = smoothstep(1.0, 1.45, Math.min(sight(x, y, -z), sight(x, y - 2 * r, -z), sight(x - 1.5 * r, y - r, -z)));
      C.push({ x, y, z, r, age: ageAt(h.s), fade: win * Math.pow(end, 0.6) * (0.72 + 0.28 * smoothstep(-0.5, 0.2, noise.n2(f * 6 + sd, 4.4 + h.s))), hang: win, lobe: 1 });
    }
    // 20 and 18 sides (were 14 and 10: the halo's flat 10-25 m facets read as hanging cloth with a hard rim), and half the hang
    await addTube(B, C, { n: 20, ref: n, kind: 0, spin: 0.22, squash: 0.66, lobe: 0.24, lobeF: 0.04, hang: 5 * T.hang, tile: 60, vt: 1, bias: 0.3 }, noise, ctx);
    await addTube(B, C, { n: 18, ref: n, kind: 1, spin: 0.22, squash: 0.7, rMul: 1.3, lobe: 0.3, lobeF: 0.035, hang: 6 * T.hang, tile: 60, vt: 1, bias: 7, nu0: 0.3 }, noise, ctx);
    shoeC.push(C); await ctx.yield();
  }
  // the ribbon's far end (s over about 480, where the lens climbs out through the level of the sheet): no puffs in the thin
  // sheet or over the lens's own strip. One hanging alone there, 20-60 m ahead and seen side-on against the sky, read as an
  // airbrushed cotton ball at any size. A puff left out still takes its three draws, so every later piece is the same for a seed.
  const fray = (x, s, d) => s > 478 + 10 * noise.n2(x * 0.06, 3.3) && (d < 0.5 || x < -120);
  const put = (x, y, s, sz, d, f) => { if (fray(x, s, d)) { rng(); rng(); rng(); } else addPuff(B, x, y, -s, sz, ageAt(s), f, rng, null); };
  const clearOf = (x, y, s, sz) => sight(x, y, s) > 1.06 && sight(x, y - sz, s) > 1.06 && sight(x - sz, y, s) > 1.06 && sight(x + sz, y, s) > 1.06 && cam.dist(x, y, -s) > sz + 8.5;
  // (a) THE CEILING: small lobes hanging under the strip the lens flies beneath, 8-20 m from it
  const dR = Math.max(0.78, T.dens);   // the old end is thick cloud in any air: a thin seed keeps a full ceiling
  const nA = Math.round(1700 * dR);
  for (let i = 0; i < nA; i++) {
    const s = rng.range(-20, 545), x = rng.range(-232, -96), sz = rng.range(2.1, 4.9), dy = rng.range(-0.1, 0.6), keep = rng();
    sheetAt(x, s, o);
    if (o[1] > 0.3 && keep < 0.35 + 0.65 * o[1]) { const y = o[0] - sz * dy - o[4] * rng(); if (clearOf(x, y, s, sz)) put(x, y, s, sz, o[1], 0.9); }
    if (i % 150 === 149) await ctx.yield();
  }
  // (b) the body of the ribbon: larger lobes seated in the underside, thickest where the sheet hangs
  const nP = Math.round(2500 * dR);
  for (let i = 0; i < nP; i++) {
    const s = rng.range(-40, 530), x = T.axisX(s) + rng.range(-205, 205);
    sheetAt(x, s, o); const hf = rng(), sz = rng.range(3.4, 7.0) * (0.8 + 0.5 * o[2]) * (1 - 0.35 * hf);
    if (o[1] < 0.45 || (o[2] < 0.12 && rng.chance(0.75))) continue;
    const y = o[0] - hf * o[4] - sz * rng.range(-0.3, 0.35);                  // stacked down the lobe, smaller toward its tip
    if (clearOf(x, y, s, sz)) put(x, y, s, sz, o[1], 0.9);
    if (i % 150 === 149) await ctx.yield();
  }
  // (c) the torn rims (sheet density 0.15-0.65: its outer edges, its holes and the frame of the sight window): ragged puffs
  // that hide every border of the sheet and take the gold back-light
  const nR = Math.round(5200 * dR);
  for (let i = 0; i < nR; i++) {
    const s = rng.range(-30, 560), x = T.axisX(s) + rng.range(-245, 215);
    sheetAt(x, s, o);
    if (o[1] > 0.12 && o[1] < 0.68) { const sz = rng.range(2.4, 5.6), y = o[0] + sz * rng.range(-0.5, 0.3); if (clearOf(x, y, s, sz)) put(x, y, s, sz, o[1], 0.8); }
    if (i % 150 === 149) await ctx.yield();
  }
  // (d) lumps seated in the horseshoes
  for (const C of shoeC) for (let i = 0; i < Math.round(130 * T.dens); i++) {
    const c = C[rng.int(6, C.length - 7)], a = rng.range(0, TAU), sz = c.r * rng.range(0.3, 0.75), x = c.x + Math.cos(a) * c.r * 0.9, y = c.y - Math.abs(Math.sin(a)) * c.r * rng.range(0.4, 1.3), z = c.z + rng.range(-5, 5);
    if (c.fade > 0.25 && clearOf(x, y, -z, sz)) addPuff(B, x, y, z, sz, c.age, 0.85 * c.fade, rng, null);
  }
  await ctx.yield();
  // (e) THE VAULT'S CROWN (private stream): the sight window is the shadow of loop 4 on the sheet, a swath up to 100 m wide that
  // stood open to the sky from below. Clumps of cumulus are seated over it, every one ABOVE the cones of sight (so from the entry
  // they sit over the ring, never in front of it), low at the swath's sides and higher along its middle. From the dip in the
  // camera line the ribbon is then a closed vault, and loop 4 hangs in the slot of sky under its far rim.
  // (it ends at s 395: further on, where the sheet itself frays out, its clumps stood alone against the sky as cotton balls)
  // It is laid as NINE CLUMPS, not as a scatter: each clump is a heap 40-66 m across whose heads are largest (7-12 m) and lowest
  // in its middle and small (3-5 m) only round its edge, with open sky between one clump and the next. As 470 clumps of mostly
  // 3 m, strewn evenly, the crown was popcorn. The flag (-1 at a clump's edge to -2 at its middle) deepens the belly's shadow.
  const rv = miniRng(T.wPh + 0.55), S0 = SC[0], NCL = 9, nV = Math.round(40 * Math.max(0.85, T.dens)), clumps = [];
  for (let c = 0; c < NCL; c++) {
    const s = 122 + (c + 0.5 + rv.range(-0.28, 0.28)) * (262 / NCL), t = (s - S0[0]) / (tgt.s - S0[0]), hw = t * 88 + 4;
    clumps.push({ s, x: S0[1] + (tgt.x - S0[1]) * t + (c % 2 ? 1 : -1) * rv.range(0.25, 0.95) * hw, R: rv.range(20, 33) * (0.75 + 0.25 * Math.min(1, hw / 30)), up: rv.range(1.5, 5) });
  }
  for (const cl of clumps) {
    for (let i = 0; i < nV; i++) {
      // (the first heads of a clump are its big middle ones; the later the head, the further out and the smaller)
      const f = Math.pow((i + rv()) / nV, 0.75), ka = rv.range(0, TAU), rr = cl.R * f, s = cl.s + Math.sin(ka) * rr * 1.25, x = cl.x + Math.cos(ka) * rr;
      const big = lerp(11.5, 3.8, Math.pow(f, 0.7)) * rv.range(0.78, 1.12), n = 2 + (i % 3), top = sightTop(x, s), thin = rv();
      if (thin < smoothstep(340, 398, s)) continue;
      const cy = Math.max(top, -117) + cl.up + 5 * f * f, flag = -2 + f;
      for (let k = 0; k < n; k++) {
        const kb = rv.range(0, TAU), kr = rv.range(0.55, 0.95), sz = big * (k === 0 ? 1 : rv.range(0.36, 0.62)), px = x + (k ? Math.cos(kb) * big * kr : 0), ps = s + (k ? Math.sin(kb) * big * kr : 0), py = cy + (k ? big * 0.6 + rv.range(-0.35, 0.3) * big : sz * 0.6);
        if (py - sz * 0.85 > sightTop(px, ps) && cam.dist(px, py, -ps) > sz + 9 && ps < 400) addPuff(B, px, py, -ps, sz, ageAt(ps), 0.9, rv, null, flag);
      }
    }
    await ctx.yield();
  }
  await ctx.yield();
  // No puff hangs alone: one with no neighbour within 1.5 of its own size, and no solid sheet behind it, is an airbrushed disc
  // against the sky from any side. It is faded out (not removed: nothing else moves).
  {
    const K = B.k, P = B.p, Nn = B.n, A4 = B.a, CELL2 = 16, map = new Map(), list = [];
    for (let v = 0; v < B.nv; v += 1) if (K[v * 4] === 3 && K[v * 4 + 2] === -1 && K[v * 4 + 3] === -1) list.push(v);
    const key = (x, y, z) => Math.floor(x / CELL2) + 4096 * (Math.floor(y / CELL2) + 64) + 1048576 * Math.floor(-z / CELL2 + 8);
    for (const v of list) { const kk = key(P[v * 3], P[v * 3 + 1], P[v * 3 + 2]); let a = map.get(kk); if (!a) map.set(kk, a = []); a.push(v); }
    await ctx.yield();
    const lone = (v) => {
      const x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2], lim = Math.min(CELL2, 1.5 * Nn[v * 3]); let found = false;
      for (let a = -1; a <= 1 && !found; a++) for (let b = -1; b <= 1 && !found; b++) for (let c = -1; c <= 1 && !found; c++) {
        const cell = map.get(key(x + a * CELL2, y + b * CELL2, z + c * CELL2)); if (!cell) continue;
        for (let k = 0; k < cell.length; k++) { const w = cell[k]; if (w !== v && Math.hypot(P[w * 3] - x, P[w * 3 + 1] - y, P[w * 3 + 2] - z) < lim) { found = true; break; } }
      }
      if (!found) { sheetAt(x, -z, o); if (o[1] < 0.6 || o[0] - y > Nn[v * 3]) for (let q = 0; q < 4; q++) A4[(v + q) * 4 + 3] = 0; }
    };
    for (let n = 0; n < list.length; n++) { lone(list[n]); if (n % 100 === 99) await ctx.yield(); }
  }
  return finishB(B, ctx);
}

// ---------- tileable noise: three fbm fields of wrapped gradient noise (R, G: erosion; B: coarse, fibres and frost) ----------
async function makeNoiseTex(ctx, rng) {
  const S = 256, data = new Uint8Array(S * S * 4), ch = [[4, 8, 16, 32, 64], [5, 10, 20, 40, 80], [3, 6, 12, 24, 48]];
  for (let c = 0; c < 3; c++) {
    const f = new Float32Array(S * S); let amp = 1;
    for (const p of ch[c]) {
      const gx = new Float32Array(p * p), gy = new Float32Array(p * p);
      for (let i = 0; i < p * p; i++) { const a = rng() * TAU; gx[i] = Math.cos(a); gy[i] = Math.sin(a); }
      // the column terms are the same on every row: worked out once per octave. The products with the gradients' x parts change
      // only from one row of lattice cells to the next (G00..G11, once per cell row) and those with their y parts only from row to
      // row (A00..A11, one per lattice column), so a texel costs four sums and three blends. The same sums in the same order as
      // when each texel worked all eight products out for itself: the texture comes out bit for bit as it always did.
      const TX = new Float64Array(S), SX = new Float64Array(S), XA = new Int32Array(S), XB = new Int32Array(S);
      for (let x = 0; x < S; x++) { const fx = x / S * p, x0 = Math.floor(fx), tx = fx - x0; TX[x] = tx; SX[x] = tx * tx * tx * (tx * (tx * 6 - 15) + 10); XA[x] = x0 % p; XB[x] = (x0 + 1) % p; }
      const G00 = new Float64Array(S), G10 = new Float64Array(S), G01 = new Float64Array(S), G11 = new Float64Array(S), A00 = new Float64Array(p), A01 = new Float64Array(p);
      // (the rows are worked in a plain function, 32 at a call: a loop that an async function comes back into after each
      // await runs unoptimised for a while every time, and this one is a million texels)
      let yPrev = -1;
      const rows = (yA, yB) => {
        for (let y = yA; y < yB; y++) {
          const fy = y / S * p, y0 = Math.floor(fy), ty = fy - y0, sy = ty * ty * ty * (ty * (ty * 6 - 15) + 10), ya = (y0 % p) * p, yb = ((y0 + 1) % p) * p;
          if (y0 !== yPrev) { yPrev = y0; for (let x = 0; x < S; x++) { const tx = TX[x], xa = XA[x], xb = XB[x]; G00[x] = gx[ya + xa] * tx; G10[x] = gx[ya + xb] * (tx - 1); G01[x] = gx[yb + xa] * tx; G11[x] = gx[yb + xb] * (tx - 1); } }
          for (let c2 = 0; c2 < p; c2++) { A00[c2] = gy[ya + c2] * ty; A01[c2] = gy[yb + c2] * (ty - 1); }
          for (let x = 0, q = y * S; x < S; x++, q++) {
            const sx = SX[x], xa = XA[x], xb = XB[x];
            const d00 = G00[x] + A00[xa], d10 = G10[x] + A00[xb], d01 = G01[x] + A01[xa], d11 = G11[x] + A01[xb];
            f[q] += amp * lerp(lerp(d00, d10, sx), lerp(d01, d11, sx), sy);
          }
        }
      };
      for (let y = 0; y < S; y += 32) { rows(y, y + 32); await ctx.yield(); }
      amp *= 0.55;
    }
    await ctx.yield();
    const smp = []; for (let i = 0; i < S * S; i += 13) smp.push(f[i]); smp.sort((a, b) => a - b);
    await ctx.yield();
    const lo = smp[Math.floor(smp.length * 0.01)], hi = smp[Math.floor(smp.length * 0.99)];
    for (let i = 0; i < S * S; i++) data[i * 4 + c] = Math.round(clamp((f[i] - lo) / (hi - lo), 0, 1) * 255);
    await ctx.yield();
  }
  for (let i = 0; i < S * S; i++) data[i * 4 + 3] = 255;
  const tex = new THREE.DataTexture(data, S, S, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true; tex.needsUpdate = true;
  return tex;
}

// ---------- trail shader ----------
const TRAIL_VERT = /* glsl */`
attribute vec4 aA; attribute vec4 aK; attribute vec2 aQ;
uniform float uTime;
varying vec3 vN; varying vec3 vWp; varying vec4 vA; varying vec4 vK; varying vec2 vQ; varying vec2 vNuv;
#include <fog_pars_vertex>
void main() {
  float kind = aK.x;
  vec3 p = position; vec4 a = aA; vec2 q = vec2(0.0); vec2 nuv = aQ; vec3 nrm = vec3(0.0, 1.0, 0.0);
  vec4 mvPosition;
  if (kind > 2.5 && kind < 3.5) {
    // lit puff: a billboard about its centre. normal = (size, phase, drift length), aQ = drift direction
    float size = normal.x, ph = normal.y, dl = normal.z, moving = step(0.01, dl);
    float life = fract(uTime * 0.05 + ph);
    p.xy += aQ * dl * life * moving;
    // a lump seated in a wandering tube (drift length -1, aQ.x = metres along) sways with it, or it is left hanging in clear air
    float ride = step(dl, -0.5), rw = (0.25 + 5.0 * aA.z) * ride;
    p.x += sin(aQ.x * 0.019 + uTime * 0.27) * rw;
    p.y += sin(aQ.x * 0.023 - uTime * 0.21 + 2.0) * rw * 0.7;
    p.y -= (1.0 - moving) * 0.9 * sin(uTime * 0.23 + ph * 6.2832);
    float sz = size * (1.0 + 0.07 * sin(uTime * 0.31 + ph * 40.0)) * mix(1.0, 0.45 + 0.95 * life, moving);
    a.w *= mix(1.0, sin(3.14159 * life), moving);
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWp = wp.xyz;
    mvPosition = viewMatrix * wp;
    // the canyon's peeling wisps (aK.y = 1) are drawn out along their drift: a round one near the lens reads as a pom-pom
    float ice = step(0.5, aK.y) * step(aK.y, 0.9);                                // falling ice (flag 0.75): a finer, longer streak
    vec2 dr = aQ / max(length(aQ), 1e-4), st = vec2(aK.z * mix(2.6, 3.4, ice), aK.w * mix(0.5, 0.42, ice));
    mvPosition.xy += mix(aK.zw, dr * st.x + vec2(-dr.y, dr.x) * st.y, moving * step(0.5, aK.y)) * sz;
    q = aK.zw; nuv = aA.xy;
    nrm = vec3(size, 1.0, 0.0);                                               // a puff has no normal to pass: it sends its size (m)
  } else if (kind > 3.5) {
    // curtain fibre: a strip about its own spine that always faces the lens. normal = (half width, phase, azimuth of the curtain's normal)
    float hw = normal.x, ph = normal.y, f = aA.y;
    vec3 sn = vec3(cos(normal.z), 0.0, sin(normal.z));
    float wa = (0.25 + 5.0 * aA.z) * step(0.75, abs(aK.y));                   // it rides the wander of the tube beneath it
    p.x += sin(aA.x * 0.019 + uTime * 0.27) * wa;
    p.y += sin(aA.x * 0.023 - uTime * 0.21 + 2.0) * wa * 0.7;
    // the fibres sway and ripple, more toward their tips
    p += sn * sin(aA.x * 0.06 + uTime * 0.4 + ph * 6.2832) * 1.6 * f;
    p += vec3(-sn.z, 0.0, sn.x) * sin(aA.x * 0.11 - uTime * 0.31 + ph * 21.0) * 0.9 * f;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vec3 tc = cameraPosition - wp.xyz; float dc = max(length(tc), 1e-3);
    vec3 sv = cross(vec3(0.0, 1.0, 0.0), tc / dc);                            // level, across the line of sight
    sv /= max(length(sv), 0.08);                                              // seen from straight below a fibre narrows, it does not spin
    float hwT = hw * (1.0 + 0.25 * f), hwE = max(hwT, dc * 0.0032);          // never thinner than about a pixel and a half: dimmer instead
    wp.xyz += sv * aK.z * hwE;
    vWp = wp.xyz;
    mvPosition = viewMatrix * wp;
    // where the curtain runs along the line of sight its fibres stack into a column: there it thins away instead
    vec2 sw = (mat3(modelMatrix) * sn).xz, th = tc.xz;
    float face = abs(dot(sw / max(length(sw), 1e-4), th / max(length(th), 1e-3)));
    q = vec2(aK.z, smoothstep(0.1, 0.55, face) * hwT / hwE);
    nuv = aQ + vec2(aK.z * hw * 0.035, -uTime * 0.011);                       // streaks 10:1 up the fibre, lifting slowly
  } else {
    // slow billow of the lobes, a wandering braid on the tubes
    float tube = step(kind, 1.5), sheet = step(1.5, kind) * step(kind, 2.5);
    // one wave along (25 m, eight vertices a cycle) shaped round the tube: a product of two waves along beat at 8 m, which the 3 m
    // grid cannot carry, and folded the surface into flat facets with chevroned streaks at the 22 m pass
    float w1 = sin(aA.x * 0.25 + uTime * 0.33 + aA.y * 12.566) * (0.6 + 0.4 * sin(aA.y * 6.2832 - uTime * 0.19 + 1.7));
    float w2 = sin(aA.x * 0.085 + uTime * 0.27 + aA.y * 3.1) * sin(aA.x * 0.031 - uTime * 0.17 + aA.y * 1.3);
    p += normal * (w1 * tube * (0.2 + 1.3 * aA.z) * (1.0 + 0.6 * kind) + w2 * sheet * 2.2);
    float free = tube * step(0.75, abs(aK.y));
    float wa = (0.25 + 5.0 * aA.z) * free;
    p.x += sin(aA.x * 0.019 + uTime * 0.27) * wa;
    p.y += sin(aA.x * 0.023 - uTime * 0.21 + 2.0) * wa * 0.7;
    vec4 wp = modelMatrix * vec4(p, 1.0);
    vWp = wp.xyz;
    mvPosition = viewMatrix * wp;
    nrm = mat3(modelMatrix) * normal;
  }
  vN = nrm; vA = a; vK = aK; vQ = q; vNuv = nuv;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const TRAIL_FRAG = /* glsl */`
uniform sampler2D uNoise;
uniform float uTime, uGain, uHalo, uStreak, uSheet, uBump, uCrease;
uniform vec2 uFar;
uniform vec3 uSunDir, uBody, uRim, uShade, uSky;
varying vec3 vN; varying vec3 vWp; varying vec4 vA; varying vec4 vK; varying vec2 vQ; varying vec2 vNuv;
#include <fog_pars_fragment>
void main() {
  float kind = vK.x, spin = vK.y;
  // (back faces of the tubes are not discarded: their alpha already falls to nothing with the smooth normal's facing ratio, and a
  // discard by triangle cut the lumpy outline of a tube seen end-on into saw teeth)
  bool puff = kind > 2.5 && kind < 3.5;
  float r2 = dot(vQ, vQ);
  if (puff && r2 > 1.0) discard;
  vec3 V = cameraPosition - vWp; float dist = length(V); V /= max(dist, 1e-3);
  float age = vA.z, fade = vA.w, tube = step(kind, 1.5), sgn = spin < 0.0 ? -1.0 : 1.0;
  // four octaves from one tile. On the tubes every octave turns about the core at the same rate, so the surface rolls.
  // a large puff takes twice the noise across it, so its outline is torn into lobes (at 0.16 a 6 m puff was one airbrushed disc)
  // (a bead on a young jet, age under 0.1, is torn from 0.8 m up: as a round disc it was a ball on a string)
  float ypB = puff ? 1.0 - smoothstep(0.09, 0.13, vA.z) : 0.0;
  float bigP = puff ? smoothstep(mix(1.8, 0.8, ypB), mix(4.2, 1.8, ypB), vN.x) : 0.0;
  vec2 uv = puff ? vQ * mix(0.16, 0.33, bigP) + vA.xy * 9.0 : vNuv;
  // COTTON: everything older than the four jets is soft lumpy cloud. The wound tubes of the waves and the canyon (cotF) are shaded
  // like the rings: billowed relief, creases, a wide wrap of light, and the helical streaks only a faint modulation of it
  float cot = tube * smoothstep(0.105, 0.135, age), cotF = cot * step(0.75, abs(spin));
  // the ropes of the waves and the canyon roll fast enough to see which way the wake winds (both inner walls going down)
  // (a puff's flag is not a spin: only a wisp, 1, and a head of the crown, -1..-2, scroll their noise, at the one rate they always had)
  float rollS = puff ? (spin > 0.5 ? 1.0 : (spin < -0.5 ? -1.0 : 0.0)) : spin;
  vec2 roll = vec2(0.0, -rollS * uTime * mix(0.075, 0.12, cotF)) * step(kind, 3.5), drift = vec2(uTime * 0.0022, uTime * 0.0013) * (1.0 - tube);
  float n1 = texture2D(uNoise, uv + roll + drift).r;
  float n2 = texture2D(uNoise, uv * 3.0 + roll * 3.0 - drift * 2.0).g;
  float n3 = texture2D(uNoise, uv * 9.0 + roll * 9.0 + drift * 5.0).b;
  float n4 = texture2D(uNoise, uv * 23.0 + roll * 23.0).r;
  // helical fibres: noise stretched along the lines the vortex winds (two samples, coarse and fine)
  float h1 = texture2D(uNoise, vec2(3.0 * vA.y + 3.0 * roll.y - sgn * vA.x / 12.5664, vNuv.x)).b;
  float h2 = texture2D(uNoise, vec2(7.0 * vA.y + 7.0 * roll.y - sgn * vA.x / 6.2832, vNuv.x * 2.0 + 0.37)).b;
  // billows for the relief: the coarse octaves only (three mip levels up), folded so lumps are round and creases sharp
  float bil = min(1.0, abs(2.0 * texture2D(uNoise, uv * 2.0 + roll * 2.0 + drift, 3.0).g - 1.0) * 1.15
    + abs(2.0 * texture2D(uNoise, uv * 6.0 + roll * 6.0 + 0.31, 2.0).r - 1.0) * 0.5);
  float bs = smoothstep(0.0, 0.7, bil);          // soft-shouldered: creases shade gently instead of drawing veins
  // (within 70 m of the lens a tube's folds are wide valleys between round tops, not thin lines: there the shade of a fold begins
  // higher up its sides. Thin dark folds on a broad lit surface were the veins of marble.)
  bs = mix(smoothstep(0.1, 0.92, bil), bs, max(smoothstep(22.0, 70.0, dist), 1.0 - step(kind, 1.5)));
  // derivatives are taken here, outside every branch (Direct3D). ex, ey: the step between neighbouring pixel rays, which does
  // not depend on the triangle under the pixel (derivatives of the position do, and showed the mesh as facets)
  vec3 ex = -dFdx(V), ey = -dFdy(V);
  float dbx = dFdx(bil), dby = dFdy(bil), kpx = max(length(ex), 1e-6);
  ex /= kpx; ey /= max(length(ey), 1e-6);
  float fl = texture2D(uNoise, vec2(vA.x * 0.021 - uTime * 0.9, vA.y * 0.5 + 0.3)).b;
  float fbm = n1 * 0.5 + n2 * 0.27 + n3 * 0.15 + n4 * 0.08, fine = n3 * 0.6 + n4 * 0.4, fib = smoothstep(0.22, 0.78, h1 * 0.55 + h2 * 0.45);
  // stripes belong to the wound tubes: faint on the fresh jets (soft and flickering), fading again on the old rings (lumps)
  float sAmt = min(abs(spin), 1.0) * uStreak * tube * mix(1.0, 0.45, smoothstep(0.4, 0.62, age)) * mix(0.4, 1.0, smoothstep(0.03, 0.12, age));
  sAmt = min(sAmt, mix(3.0, 1.2, smoothstep(0.27, 0.33, age)));            // on the waves the rolls are old enough to be soft
  sAmt *= (1.0 - 0.8 * cotF) * mix(1.0, smoothstep(25.0, 70.0, dist), cotF);   // (no streaks beside the lens: there they drew the wall out along its length)
  // the jets are taut round ropes from a few metres behind their birth (when this waited for age 0.1, the 200 m of jet nearest
  // the aircraft were lit as flat bands)
  float young = tube * (1.0 - cot) * smoothstep(0.003, 0.02, age);
  vec3 N = vN; float nl = length(N); N = nl > 1e-4 ? N / nl : vec3(0.0, 1.0, 0.0);
  float facing;
  if (puff) {
    vec3 nv = normalize(vec3(vQ * mix(0.7, 0.5, bigP) + (vec2(n2, n3) - 0.5) * mix(0.8, 1.5, bigP), 1.0 - 0.45 * r2));   // (a large puff is lit as several heads, not as one ball)
    N = normalize((vec4(nv, 0.0) * viewMatrix).xyz + vec3(0.0, 1e-5, 0.0));
    facing = nv.z;
  } else if (kind > 3.5) {
    N = normalize(V + vec3(0.0, 0.5, 0.0)); facing = 1.0;                     // a fibre has no side: lit as thin haze
  } else {
    float d = dot(N, V);
    if (kind > 1.5 && d < 0.0) { N = -N; d = -d; }
    facing = clamp(d, 0.0, 1.0);
    // the sheet is a coarse height field: light it by its noise more than by its facets, or the triangles show at 20 m
    if (kind > 1.5 && kind < 2.5) N = normalize(N * 0.55 + vec3((n1 - 0.5) * 1.6, N.y < 0.0 ? -0.6 : 0.6, (n2 - 0.5) * 1.6));
    // cauliflower relief on the tubes: the billows as a height field (metres) whose slope across the view tilts the normal.
    // Old cloud is lumpy, the young tubes stay taut.
    if (kind < 1.5) {
      float bk = uBump * mix(mix(0.2, 0.85, young), 1.0, max(smoothstep(0.15, 0.5, age), cotF)) * mix(1.0, 0.4 + 0.6 * smoothstep(25.0, 110.0, dist), cotF) * facing / max(dist * kpx, 1e-4);
      // within 110 m the valleys between billows are rounded (the slope goes to nothing at the crease): the fold of the noise is a
      // cusp, and at close range each cusp was a thin dark vein across the wall (the marbling)
      float vein = mix(min(1.0, 2.2 * bil), 1.0, smoothstep(40.0, 110.0, dist));
      dbx *= vein; dby *= vein;
      // (ON THE WOUND ROPES THE TILT IS CAPPED BY DISTANCE: none within 15 m, at most 0.9 by 45 m, free beyond 150 m. A wall seen
      // along its length has its billows foreshortened into bands a pixel wide; their slope, uncapped, threw the normal right over
      // from band to band, and beside the lens each wall carried fans of straight hard blades of lilac, blue and gold)
      vec3 tb = (dbx * ex + dby * ey) * min(bk, 60.0);
      tb *= mix(1.0, min(1.0, (0.9 * smoothstep(15.0, 45.0, dist) + 59.0 * smoothstep(60.0, 150.0, dist)) / max(length(tb), 1e-4)), cotF);
      N = normalize(N - tb + vec3(0.0, 1e-6, 0.0));
      // beside the lens old cloud is lit as the puffs are, by the view and the noise and hardly by the mesh: the raw vertex
      // normals of 1.6 m quads showed as hard triangular shards of shadow in the nearest stretch of rope
      // (on the wound ropes out to 75 m: the canyon's walls are looked along for all of that)
      float nearN = (1.0 - smoothstep(mix(16.0, 30.0, cotF), mix(46.0, 75.0, cotF), dist)) * max(cot, smoothstep(0.3, 0.5, age));
      // (a normal that faces the lens, tilted by the slope of the billows at full strength: every lump keeps a lit and a shadow side)
      // (the tilt is capped: on a wall seen along its length the billows are foreshortened into bands, and an uncapped slope
      // drew them as stripes)
      vec3 tl = (dbx * ex + dby * ey) * min(uBump * 1.5 * (0.3 + 0.7 * facing) / max(dist * kpx, 1e-4), 60.0);
      tl *= min(1.0, 0.5 / max(length(tl), 1e-4));
      vec3 nn = normalize(V * 0.7 - tl + vec3(n2 - 0.5, 0.0, n3 - 0.5) * 0.7 + vec3(0.0, 1e-4, 0.0));
      N = normalize(mix(N, nn, nearN * 0.85) + vec3(0.0, 1e-3, 0.0));
    }
  }
  // density: the depth of cloud a ray crosses in a tube goes with the facing ratio, so every outline is soft; noise and fibres vary it
  // (the streaks are in the light, hardly in the density: at 1.7 the sky showed between the bands and a roll read as slatted cloth)
  float dens = clamp(1.0 + (fbm - 0.5) * mix(2.2, 3.4, age) + (fib - 0.5) * 0.5 * sAmt, 0.0, 3.0);
  // the tubes of the waves and the canyon have no holes (where the noise ran low the sky showed through the wall as a dark lens)
  dens = max(dens, 0.55 * tube * smoothstep(0.02, 0.1, age) * (1.0 - smoothstep(0.44, 0.52, age)));
  float hole = fbm * 1.7 - 0.35 + (fade - 1.0) * (0.5 + 1.5 * fine);
  // a ring's curtain (flag 0.5) is one veil: whole where its fade is whole, torn only as the fade falls toward its top
  float curt = step(1.5, kind) * step(kind, 2.5) * step(0.25, spin);
  hole = mix(hole, fbm + 0.25 + (fade - 1.0) * (1.0 + 2.2 * fine), curt);
  // A YOUNG JET IS A KNOTTED ROPE: its core is eaten by the two coarse octaves (knot), from the outline inward, right through
  // where they run lowest, so it swells and necks and the deck shows in the necks; its sheath is eaten the same way and thinner.
  // (Smooth, with beads set along it, each jet was a stroke of paint with balls on it.)
  float knot = n1 * 0.6 + n2 * 0.4;
  float a;
  // silhouettes are eaten by the noise (no outline is ever a clean polygon edge); the halo shell is for distance only: within
  // 160 m it thins away (gone by 45 m), or the near wall of a ring shows a glassy second outline
  // (the core of a rope thins out from 42 m of the lens and is gone at 14: beside us it dissolves and its puffs carry the outline)
  if (kind < 0.5) a = (1.0 - exp(-smoothstep(0.04, 0.6, facing) * dens * mix(3.0, 6.5, age))) * smoothstep(0.0, mix(0.35, 0.5, cotF), facing + (fbm - 0.5) * mix(0.5 + 0.3 * young, 0.9, cotF)) * mix(1.0, smoothstep(14.0, 42.0, dist), cotF) * mix(1.0, smoothstep(0.34, 0.6, knot + 0.22 * facing), young * 0.9);
  else if (kind < 1.5) a = (1.0 - exp(-smoothstep(0.2, 0.9, facing) * dens * 1.7)) * uHalo * smoothstep(0.25, 0.6, fbm + facing * 0.6) * mix(0.22 * smoothstep(0.36, 0.62, knot + 0.15 * facing), 1.0, max(smoothstep(0.08, 0.12, age), cot))
    * mix(1.0, smoothstep(45.0, 160.0, dist) * mix(min(1.0, smoothstep(0.38, 0.7, fbm) * 1.5), 1.0, smoothstep(140.0, 320.0, dist)), max(smoothstep(0.06, 0.2, age), cot));
    // (within 140 m: torn wisps, not a shell. The fresh jets, age under 0.06, keep their soft sheath at any range)
  // THE SHEET SEEN ALONG ITS SPAN: a flat sheet looked at sideways (far more across the track than along it) has its texture drawn
  // out along the track, and from under the vault its wings were smears streaming to the vanishing point. The cure is in the sheet's
  // own coordinates: its noise is laid a little shorter along the track than across (72 m to 90). Nothing thins the sheet by the
  // direction it is seen from.
  else if (kind < 2.5) a = smoothstep(0.3, 0.68, hole) * smoothstep(0.3, 0.6, fbm + facing * 2.0) * uSheet * mix(0.5, 1.0, smoothstep(20.0, 80.0, dist))
    * (1.0 - 0.45 * step(0.25, spin));   // (a ring's curtain, flag 0.5, is a thinner veil)
  else if (kind < 3.5) {
    // eroded hard enough that a small puff never reads as a disc; a bead on a young jet (age under 0.1) harder still, so its outline
    // is the noise's and it reads as a lump of the rope (at night, pale on black, the softer edge showed as a disc)
    float ypE = 1.0 - smoothstep(0.09, 0.13, age);
    a = 0.9 * smoothstep(0.0, 0.5, (1.0 - sqrt(r2)) * (0.12 + mix(1.85, 2.2, ypE) * (n1 * 0.4 + n2 * 0.36 + n3 * 0.24)) - mix(0.1, 0.24, ypE));
    // a puff over about 2 m: its OUTLINE is the noise (the radius of its edge runs from 0.45 to 0.98 round it, so it is a torn
    // clump of heads with a soft edge), and its body is eaten into as well. As a soft disc with a noisy rim it was a cotton ball.
    float pe = 0.5 + 1.05 * clamp(n1 * 0.62 + n2 * 0.38 - 0.22, 0.0, 0.5), pd = sqrt(r2);
    // (a head in the middle of a clump of the vault's crown, flag toward -2, keeps a solid body inside its torn outline: eaten into
    // like the rest, a clump was a spatter of small pieces with the sky showing through it)
    float solid = spin < -0.5 ? 0.85 * clamp(-spin - 1.0, 0.0, 1.0) : 0.0;
    float aBig = 0.92 * smoothstep(0.0, 0.4, pe - pd) * mix(smoothstep(-0.05, 0.3, n2 * 0.55 + n3 * 0.45 - 0.3 + (1.0 - pd) * 0.55), 1.0, solid);
    a = mix(a, aBig, bigP);
    // a drawn-out wisp is a soft streak (as an eroded disc it crossed the canyon as a solid petal), and it thins out beside the lens
    float sw = (1.0 - r2) * (1.0 - r2);
    // falling ice (flag 0.75) is a faint fall with grains glinting in it (drawn as solidly as a wisp it was a row of needles)
    if (spin > 0.5) a = 0.75 * sw * mix(smoothstep(0.38, 0.8, n1 * 0.2 + n2 * 0.4 + n3 * 0.4 + 0.12 * sw), 0.2 + 0.8 * smoothstep(0.56, 0.8, n3) * smoothstep(0.4, 0.7, n4), step(spin, 0.9)) * mix(1.0, 0.5, step(spin, 0.9)) * smoothstep(5.0, 16.0, dist);   // (the ice at half strength; shed ice is where it falls, and like a wisp it only fades out from 16 m to 5 m of the lens)
  }
  else {
    // curtain fibres: no floor under the alpha. Soft across the strip, eroded into finer threads, gone toward the tip (fade),
    // where the curtain is seen end-on (vQ.y) and beside the lens
    float px = 1.0 - vQ.x * vQ.x;
    a = 0.46 * px * px * vQ.y * smoothstep(0.3, 0.85, n1 * 0.45 + n2 * 0.55 + (fade - 0.5) * 0.5) * smoothstep(25.0, 90.0, dist);
  }
  if (kind < 1.5 || kind > 2.5) a *= fade;
  // the jets freeze out of clear air in flickers
  float fresh = (1.0 - smoothstep(0.0, 0.028, age)) * tube;
  a *= mix(1.0, smoothstep(0.3, 0.62, fl + (1.0 - fresh) * 0.5), fresh);
  a *= smoothstep(2.5, 8.0, dist) * (1.0 - smoothstep(uFar.x, uFar.y, dist));   // (uFar: the rings round the exit come out of the haze late)
  // light: a low red sun wrapped far round the body, forward scattering when we look toward it, lilac only in the folds
  // the young tubes are round rolls: a steeper wrap, undersides coral in the low sun, tops lilac from the sky, a terminator between
  float wrap = smoothstep(mix(-0.72, -0.4, young), mix(0.8, 0.88, young), dot(N, uSunDir));
  // sunUp: the light is high (the night's moon, 50 degrees up; 0 at dawn and dusk, whose sun is below level). Then the tops of the
  // jets are already their lit side, and the hot crest and the thinner lilac top that the low sun's jets are given would wash
  // them out flat: under the moon they keep the light they had
  float sunUp = smoothstep(0.1, 0.5, uSunDir.y);
  float roll2 = (0.3 * smoothstep(0.0, 0.8, -N.y) - mix(0.42, mix(0.15, 0.26, sunUp), young) * smoothstep(0.05, 0.75, N.y)) * max(young, 0.3 * cotF);
  // a jet is lit round: its middle holds the body colour (hotter where the ray crosses the most cloud), the flank turned from the
  // sun goes lilac, the sunward flank brightens. (A lilac TOP was tried: from behind and above, where the jets are seen at a
  // grazing angle, the whole band is top, and the four jets went pale.)
  // (the crest is hot on every jet seen from a distance, 0.38: at 0.25, with a lilac top, the pair on the far side of the sun was
  // a blue-white ribbon. Within 40 m of the lens it stays 0.25: a jet that fills a corner of the picture is not one hot stroke)
  float crestK = smoothstep(40.0, 150.0, dist) * (1.0 - sunUp);
  roll2 += young * (0.1 + mix(0.25, 0.38, crestK) * facing * facing - 0.2 * smoothstep(-0.1, 0.7, -dot(N, uSunDir)));
  float vs = max(dot(-V, uSunDir), 0.0), trans = vs * vs;
  // a jet between the lens and the sun is thin enough for the light to come through its middle: a hot crest there too, lilac
  // only on its flanks (lit from the front alone, that pair was a blue ribbon with white edges)
  roll2 += young * trans * (0.12 + 0.42 * facing * facing) * mix(0.35, 1.0, crestK);
  float thin = kind < 0.5 ? 0.5 : (kind < 1.5 ? 0.9 : (kind < 2.5 ? 0.5 : (kind < 3.5 ? 0.6 : 1.0)));
  // old tubes near the lens: lump tops coral, creases lilac (the cauliflower); far off the whole trail simply blazes
  float farK = smoothstep(250.0, 650.0, dist), oldK = tube * max(smoothstep(0.3, 0.55, age), cotF) * (1.0 - smoothstep(70.0, 240.0, dist));
  // near the lens the fine octaves are held back (they marbled a wall with veins): relief there comes from the billows
  float nearK = (1.0 - smoothstep(45.0, 120.0, dist)) * (puff ? 1.0 : tube);
  // a rope between the lens and the sun, close by: the light comes THROUGH it in patches (as flat lilac it was a pane of glass)
  // HEADS: a puff over a metre across, near the lens, is shaded as a heap of heads by the billow field: tops lit and creases dark
  // when the light falls on it, and the other way round (dark bodies, glowing creases) when the light comes through it
  float headP = puff ? (1.0 - smoothstep(30.0, 95.0, dist)) * smoothstep(1.0, 2.2, vN.x) : 0.0;
  float nearC = mix(1.5, 1.0, smoothstep(25.0, 60.0, dist));
  // a bead on a young jet (a puff of age under 0.1): the rope's own body colour and hardly any pale rim, so it is a lump of the rope
  // (with a pale rim and a lilac face, seen from above against the hot core, it was a cotton ball on a string)
  float yp = puff ? 1.0 - smoothstep(0.09, 0.13, age) : 0.0;
  // a clump of the vault's crown (spin -1) seen from below has a shadowed belly inside its lit rim
  // (deeper toward the middle of its clump, flag -2; the rim of every head keeps its light)
  float belly = (puff && spin < -0.5) ? smoothstep(0.2, 0.75, -V.y) * (1.0 - r2) * (0.75 + 0.9 * clamp(-spin - 1.0, 0.0, 1.0)) : 0.0;
  // a head seated in a gulf between two lobes of a canyon wall (flag 0..0.45): in the lobes' shadow
  float gulf = (puff && spin > 0.0 && spin < 0.5) ? spin * 2.2 : 0.0;
  float nearT = tube * (1.0 - smoothstep(20.0, 75.0, dist)) * max(cot, smoothstep(0.3, 0.5, age)) * trans * clamp(0.75 * fbm + 0.3 * bs - 0.22, 0.0, 0.6);
  float lit = clamp(0.15 + roll2 + nearT + (puff ? 0.14 + 0.12 * yp + 0.2 * max(-N.y, 0.0) + 0.22 * step(0.5, spin) : 0.0) + 0.2 * farK + (bs - 0.65) * 0.24 * uCrease * oldK * nearC + (bs - 0.6) * 0.3 * headP * (1.0 - 1.7 * trans) - 0.26 * belly - 0.33 * gulf * (0.5 + 0.5 * uCrease) + (bs - 0.62) * 0.26 * young + mix(0.62, 0.46, young) * wrap + trans * 0.3 * thin + (fine - 0.5) * mix(0.3, 0.12, nearK) + (fbm - 0.5) * mix(0.45, 0.3, nearK) + (fib - 0.5) * 0.55 * sAmt, 0.0, 1.0);   // streaks tint the roll, they do not paint it (at full strength the canyon walls were flat zebra wedges)
  vec3 mid = uBody * 0.74 + uShade * 0.12;
  // beside the lens (within 95 m, wholly within 25) the folds of cloud are a dusky mauve, a soft shadow between the heads: in the full lilac of
  // the far shadow side, next to the coral, they were blue veins
  float softK = tube * (1.0 - smoothstep(25.0, 95.0, dist)) * max(max(cot, smoothstep(0.3, 0.5, age)), young);
  vec3 shadeC = mix(uShade, uShade * 0.55 + uBody * 0.3, 0.75 * softK);
  vec3 col = mix(mix(shadeC, mid, clamp(lit * 2.0, 0.0, 1.0)), uBody, clamp(lit * 2.0 - 1.0, 0.0, 1.0));
  col *= mix(1.0, 0.7 + 0.6 * fbm, step(1.5, kind) * step(kind, 2.5));
  col *= (1.0 + 0.5 * farK) * mix(1.0, 1.0 - (0.16 - 0.2 * bs) * uCrease * nearC, oldK) * mix(1.0, 0.84 + 0.24 * bs, headP);
  col += uSky * (0.5 + 0.5 * N.y);
  float rim = (puff || kind < 1.5) ? pow(1.0 - facing, 3.0) : (kind < 2.5 ? (1.0 - smoothstep(0.0, 0.2, hole - 0.3)) * (spin > 0.25 ? 0.2 : 0.7) : (1.0 - fade) * 0.22);   // (a curtain fibre's tip takes only a little gold: at 0.5 the tips outshone the roots and read as spikes)
  // on the tubes the rim is torn by the noise and held back near the lens: an unbroken highlight along a smooth outline is
  // what made a ring wall read as wrapped plastic
  rim *= (0.12 + 0.88 * trans) * mix(1.0, 0.6 * smoothstep(0.3, 0.7, fbm) * mix(0.4, 1.0, smoothstep(40.0, 200.0, dist)), tube);
  rim *= mix(1.0, smoothstep(20.0, 70.0, dist), cotF) * (1.0 - 0.5 * young);   // no gold edge on a rope beside the lens (it drew the mesh), half of it on a jet
  if (puff && spin > 0.5 && spin < 0.9) col = mix(col, uRim, 0.55);              // falling ice glints pale gold, it is not cloud
  // (a young jet's edge brightens toward its own body colour, not toward the pale gold of the old cloud's rims)
  vec3 rimC = mix(uRim, uBody * 1.25, young);
  col = mix(col, rimC, clamp(rim, 0.0, 0.7 - 0.54 * yp)) * uGain;
  gl_FragColor = vec4(col * a + rimC * rim * 0.2 * min(a * 3.0, 1.0) * tube, a);
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      float fogFactor = 1.0 - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      float fogFactor = smoothstep(fogNear, fogFar, vFogDepth);
    #endif
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor * a, fogFactor);
  #endif
}`;

// ---------- the airliner ----------
// attributes: position, normal, color (linear albedo), aP (part, u, v, w), aF (wing-flex weight)
// parts: 1 fuselage (t, y from axis, angle), 2 wing (span, chord fraction, upper/lower), 3 nacelle (z, angle), 4 bare metal,
//        5 fan (r, angle, engine), 6 spinner (r, angle, engine), 7 fin (height, chord fraction), 8 tailplane (span, chord fraction, upper/lower), 9 plain
function newG() { return { p: [], n: [], c: [], a: [], f: [], idx: [] }; }
// Lofts a grid of nu x nv quads. fn(i, j, o, ju) fills o.{x,y,z,r,g,b,p0..p3,fx}. wrap: the grid closes on itself in v.
// Facing is decided numerically: away from ref (default the grid's own centroid), or toward it when inward is set.
// opt.pause (async): awaited between the passes of a large grid; without it the call finishes at once and needs no await.
async function grid(G, nu, nv, fn, opt = {}) {
  const W = nv + 1, base = G.p.length / 3, P = new Float32Array(nu * W * 3), N = new Float32Array(nu * W * 3), o = { x: 0, y: 0, z: 0, r: 0.7, g: 0.7, b: 0.7, p0: 9, p1: 0, p2: 0, p3: 0, fx: 0 };
  let cx = 0, cy = 0, cz = 0;
  for (let i = 0; i < nu; i++) for (let j = 0; j <= nv; j++) {
    fn(i, opt.wrap ? j % nv : j, o, j);
    const q = (i * W + j) * 3; P[q] = o.x; P[q + 1] = o.y; P[q + 2] = o.z; cx += o.x; cy += o.y; cz += o.z;
    G.c.push(o.r, o.g, o.b); G.a.push(o.p0, o.p1, o.p2, o.p3); G.f.push(o.fx);
  }
  if (opt.pause) await opt.pause();
  const cnt = nu * W, ref = opt.ref || [cx / cnt, cy / cnt, cz / cnt]; let sum = 0;
  for (let i = 0; i < nu; i++) for (let j = 0; j <= nv; j++) {
    const i0 = Math.max(0, i - 1), i1 = Math.min(nu - 1, i + 1), j0 = opt.wrap ? ((j % nv) - 1 + nv) % nv : Math.max(0, j - 1), j1 = opt.wrap ? ((j % nv) + 1) % nv : Math.min(nv, j + 1);
    const a = (i0 * W + j) * 3, b = (i1 * W + j) * 3, c = (i * W + j0) * 3, d = (i * W + j1) * 3, q = (i * W + j) * 3;
    const ax = P[b] - P[a], ay = P[b + 1] - P[a + 1], az = P[b + 2] - P[a + 2], bx = P[d] - P[c], by = P[d + 1] - P[c + 1], bz = P[d + 2] - P[c + 2];
    let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const nl = Math.hypot(nx, ny, nz);
    if (nl > 1e-9) { nx /= nl; ny /= nl; nz /= nl; } else { nx = 0; ny = 0; nz = 0; }
    N[q] = nx; N[q + 1] = ny; N[q + 2] = nz; sum += nx * (P[q] - ref[0]) + ny * (P[q + 1] - ref[1]) + nz * (P[q + 2] - ref[2]);
  }
  if (opt.pause) await opt.pause();
  const flip = (sum < 0) !== !!opt.inward, sg = flip ? -1 : 1;
  for (let k = 0; k < cnt; k++) {
    let nx = N[k * 3] * sg, ny = N[k * 3 + 1] * sg, nz = N[k * 3 + 2] * sg;
    if (nx === 0 && ny === 0 && nz === 0) { const dx = P[k * 3] - ref[0], dy = P[k * 3 + 1] - ref[1], dz = P[k * 3 + 2] - ref[2], dl = Math.hypot(dx, dy, dz) || 1, s2 = opt.inward ? -1 : 1; nx = s2 * dx / dl; ny = s2 * dy / dl; nz = s2 * dz / dl; }
    G.p.push(P[k * 3], P[k * 3 + 1], P[k * 3 + 2]); G.n.push(nx, ny, nz);
  }
  for (let i = 0; i < nu - 1; i++) for (let j = 0; j < nv; j++) {
    const a = base + i * W + j, b = a + W, c = b + 1, d = a + 1;
    if (flip) G.idx.push(a, d, b, b, d, c); else G.idx.push(a, b, d, b, c, d);
  }
}

// aerofoil loop: j 0..nv-1, upper surface from trailing edge to leading edge, then lower surface back
function foil(j, nv, tc, out) {
  const h = nv / 2, up = j <= h, xc = up ? 0.5 * (1 + Math.cos(Math.PI * j / h)) : 0.5 * (1 - Math.cos(Math.PI * (j - h) / h));
  const yt = 5 * tc * (0.2969 * Math.sqrt(xc) - 0.126 * xc - 0.3516 * xc * xc + 0.2843 * xc * xc * xc - 0.1036 * xc * xc * xc * xc);
  out[0] = xc; out[1] = (up ? yt : -yt) + 0.07 * tc * 4 * xc * (1 - xc) * 2; out[2] = up ? 1 : -1; return out;
}

const TAN35 = 0.7002, TAN6 = 0.1051;
const wingLE = (x) => 23.5 + (Math.max(3, x) - 3) * TAN35;                                   // leading-edge station (m aft of the nose)
const wingChord = (x) => (x < 12.5 ? lerp(12.4, 8.0, (Math.max(3, x) - 3) / 9.5) : lerp(8.0, 2.9, (x - 12.5) / 21));
const wingY = (x) => -0.85 + (Math.max(3, x) - 3) * TAN6;                                    // wing mid-surface height at span x
const wingTc = (x) => lerp(0.135, 0.095, clamp((x - 3) / 30.5, 0, 1));

async function buildAirlinerGeometry(rng, cast, detail, pause) {
  const G = newG(), zN = -S_NOSE, f3 = [0, 0, 0], q = detail < 0.75 ? 0.6 : 1;
  const paint = [0.7, 0.7, 0.71], grey = [0.56, 0.58, 0.62], dark = [0.035, 0.037, 0.045], metal = [0.62, 0.6, 0.58];
  const set = (o, c, p0, p1, p2, p3, fx) => { o.r = c[0]; o.g = c[1]; o.b = c[2]; o.p0 = p0; o.p1 = p1; o.p2 = p2; o.p3 = p3; o.fx = fx || 0; };
  // --- fuselage: 6 m across, drooped nose, upswept tail cone, optional hump, belly fairing as a swelling of the section
  const ts = [0, 0.1, 0.3, 0.62, 1.05, 1.6, 2.3, 3.1, 4.0, 5.0, 6.1, 7.4]; for (let t = 8.8; t < 46.2; t += 1.55 / q) ts.push(t); for (let t = 47.4; t < 71.9; t += 1.7 / q) ts.push(t); ts.push(72);
  const fR = (t) => (t < 8 ? Math.max(0.03, 3 * Math.pow(Math.sin(0.5 * Math.PI * t / 8), 0.62)) : t > 46 ? 3 * (1 - 0.88 * Math.pow((t - 46) / 26, 1.7)) : 3);
  const fY = (t) => AXIS_Y - 0.75 * Math.pow(1 - smoothstep(0, 8, t), 1.5) + (t > 46 ? 2.3 * Math.pow((t - 46) / 26, 1.8) : 0);
  const nvF = Math.round(60 * q);
  await pause();
  await grid(G, ts.length, nvF, (i, j, o, ju) => {
    const t = ts[i], ang = j / nvF * TAU, sa = Math.sin(ang), ca = Math.cos(ang), R = fR(t);
    const hump = cast.humped ? 0.42 * smoothstep(2.5, 8.5, t) * (1 - smoothstep(15, 25, t)) : 0, fair = smoothstep(19, 24, t) * (1 - smoothstep(38, 44, t));
    const ry = R * (ca > 0 ? 1 + hump * ca : 1 + 0.2 * fair * smoothstep(0.35, 0.95, -ca)), rx = R * (1 + 0.1 * fair * smoothstep(0.2, 0.8, -ca));
    o.x = rx * sa; o.y = fY(t) + ry * ca; o.z = zN + t; set(o, paint, 1, t, o.y - AXIS_Y, ju / nvF * TAU, 0);
  }, { wrap: true, pause });
  await pause();
  grid(G, 2, 12, (i, j, o) => { const a = j / 12 * TAU, r = i === 0 ? 0.36 : 0.02; o.x = r * Math.sin(a); o.y = fY(72) + r * Math.cos(a); o.z = zN + 72 + (i ? 0.02 : 0); set(o, dark, 9, 0, 0, 0, 0); }, { wrap: true, ref: [0, fY(72), zN + 70] });
  // --- wings: 32 degrees of sweep at quarter chord, dihedral, washout, blended winglet
  const xsW = [2.6, 3.3, 4.5, 6, 7.5, 9, 10.5, 11.5, 12.5, 13.5, 15, 17, 19, 21, 23, 25, 27, 29, 31, 32.4, 33.5], WL = [];
  for (const x of xsW) WL.push({ x, y: wingY(x), le: wingLE(x), ch: wingChord(x), tc: wingTc(x), b: 0, span: x, tw: lerp(0.045, -0.05, clamp((x - 3) / 30.5, 0, 1)) });
  const yT = wingY(33.5), leT = wingLE(33.5);
  for (const bd of [15, 30, 45, 60, 75]) { const b = bd * Math.PI / 180, k = bd / 75; WL.push({ x: 33.5 + 1.6 * Math.sin(b), y: yT + 1.6 * (1 - Math.cos(b)), le: leT + 0.55 * k, ch: lerp(2.9, 2.2, k), tc: 0.09, b, span: 33.5 + 1.6 * b, tw: -0.05 }); }
  const b75 = 75 * Math.PI / 180, x75 = 33.5 + 1.6 * Math.sin(b75), y75 = yT + 1.6 * (1 - Math.cos(b75));
  for (const d of [0.8, 1.6, 2.3, 2.5]) { const k = d / 2.5; WL.push({ x: x75 + Math.cos(b75) * d, y: y75 + Math.sin(b75) * d, le: leT + 0.55 + 1.5 * k, ch: d > 2.4 ? 0.12 : lerp(2.2, 0.95, k), tc: 0.09, b: b75, span: 33.5 + 1.6 * b75 + d, tw: -0.05 }); }
  const nvW = Math.round(36 * q);
  const lifting = (L, side, part, vertical) => grid(G, L.length, nvW, (i, j, o) => {
    const s = L[i]; foil(j, nvW, s.tc, f3);
    const cz = (f3[0] - 0.25) * s.ch, th = f3[1] * s.ch, ct = Math.cos(s.tw || 0), st = Math.sin(s.tw || 0), dz = cz * ct + th * st, t2 = -cz * st + th * ct;
    const X = s.x - Math.sin(s.b) * t2, Y = s.y + Math.cos(s.b) * t2;
    if (vertical) { o.x = t2; o.y = s.y; } else { o.x = side * X; o.y = Y; }
    o.z = zN + s.le + 0.25 * s.ch + dz;
    const fx = part === 2 ? Math.pow(clamp((s.span - 3) / 31, 0, 1.15), 2) : 0;
    set(o, part === 2 ? grey : paint, part, s.span, f3[0], vertical ? Math.sign(t2) || 1 : f3[2], fx);
  }, { wrap: true });
  lifting(WL, 1, 2, false); await pause(); lifting(WL, -1, 2, false); await pause();
  // --- fin and tailplane
  const FL = []; for (const h of [0, 1.5, 3, 4.5, 6, 7.5, 9, 10.2, 11.0, 11.12]) FL.push({ x: 0, y: AXIS_Y + 1.5 + h, le: 55.2 + 0.84 * h, ch: h > 11.05 ? 0.3 : lerp(10.8, 4.0, h / 11) * (h > 10.5 ? 0.82 : 1), tc: lerp(0.1, 0.085, h / 11), b: 0, span: h });
  lifting(FL, 1, 7, true); await pause();
  const TL = []; for (const x of [0.7, 2, 3.5, 5, 6.5, 8, 9.5, 10.8, 11.5, 11.62]) TL.push({ x, y: AXIS_Y + 1.05 + x * 0.12, le: 59.3 + x * 0.7, ch: x > 11.55 ? 0.25 : lerp(7.2, 2.5, x / 11.5), tc: 0.09, b: 0, span: x, tw: 0 });
  lifting(TL, 1, 8, false); await pause(); lifting(TL, -1, 8, false); await pause();
  // --- engines: nacelle, polished lip, intake, fan disc, spinner, fan nozzle, core cowl, plug; pylon; all hang with the wing
  const nvE = Math.round(34 * q), nozzles = [];
  const lathe = (prof, ex, ey, ez, part, col, fx, idx, o2) => grid(G, prof.length, nvE, (i, j, o, ju) => {
    const a = j / nvE * TAU, pr = prof[i]; o.x = ex + pr[1] * Math.sin(a); o.y = ey + pr[1] * Math.cos(a); o.z = ez + pr[0];
    const c = typeof col === 'function' ? col(pr) : col;
    if (part === 5 || part === 6) set(o, c, part, pr[2], ju / nvE * TAU, idx, fx); else set(o, c, part, pr[0], ju / nvE * TAU, idx, fx);
  }, { wrap: true, ...o2 });
  let eIdx = 0;
  for (const side of [1, -1]) for (let pair = 0; pair < 2; pair++) {
    const x = ENG_X[pair], ex = side * x, ey = wingY(x) - 2.3, tF = wingLE(x) - 3.9, ez = zN + tF, fx = Math.pow((x - 3) / 31, 2), id = eIdx++;
    lathe([[0, 1.26], [0.05, 1.36], [0.2, 1.46], [0.7, 1.55], [1.7, 1.58], [2.9, 1.52], [3.6, 1.42], [3.95, 1.33]], ex, ey, ez, 3, paint, fx, id);
    lathe([[0, 1.26], [0.06, 1.17], [0.3, 1.13], [0.8, 1.15], [1.3, 1.19]], ex, ey, ez, 3, (p) => (p[0] < 0.2 ? paint : [0.11, 0.115, 0.13]), fx, id, { inward: true, ref: [ex, ey, ez + 0.6] });
    lathe([[1.3, 1.19, 1], [1.3, 0.93, 0.78], [1.3, 0.68, 0.57], [1.3, 0.44, 0.37]], ex, ey, ez, 5, dark, fx, id, { ref: [ex, ey, ez + 3] });
    lathe([[0.62, 0.03, 0.07], [0.78, 0.2, 0.45], [1.03, 0.36, 0.82], [1.3, 0.44, 1]], ex, ey, ez, 6, dark, fx, id, { ref: [ex, ey, ez + 3] });
    lathe([[3.95, 1.33], [3.95, 1.0]], ex, ey, ez, 9, dark, fx, id, { ref: [ex, ey, ez] });
    lathe([[3.95, 1.0], [4.5, 0.9], [5.1, 0.74], [5.4, 0.64]], ex, ey, ez, 4, [0.4, 0.37, 0.34], fx, id);
    lathe([[5.4, 0.64], [5.4, 0.4]], ex, ey, ez, 9, [0.02, 0.02, 0.022], fx, id, { ref: [ex, ey, ez] });
    lathe([[5.4, 0.4], [5.9, 0.26], [6.4, 0.03]], ex, ey, ez, 4, [0.3, 0.28, 0.26], fx, id);
    nozzles.push(new THREE.Vector3(ex, ey, ez + 5.4));
    // pylon: a thin swept blade from the cowl up to the wing's underside
    const PY = [{ y: ey + 1.4, le: tF + 0.6, ch: 4.6 }, { y: ey + 1.9, le: tF + 1.6, ch: 4.6 }, { y: wingY(x) - 0.1, le: wingLE(x) + 0.5, ch: 4.4 }];
    grid(G, 3, 12, (i, j, o) => { const s = PY[i]; foil(j, 12, 0.085, f3); o.x = ex + f3[1] * s.ch; o.y = s.y; o.z = zN + s.le + f3[0] * s.ch; set(o, paint, 9, 0, 0, 0, fx); }, { wrap: true });
    await pause();
  }
  // --- flap-track canoes, five a side
  for (const side of [1, -1]) for (const x of [6.2, 9.0, 15.3, 18.2, 25.6]) {
    const ch = wingChord(x), z0 = zN + wingLE(x) + 0.5 * ch, len = 0.5 * ch + 1.15, cy = wingY(x) - 0.5 * wingTc(x) * ch * 0.55 - 0.2, fx = Math.pow((x - 3) / 31, 2);
    grid(G, 9, 8, (i, j, o) => { const f = i / 8, a = j / 8 * TAU, r = Math.pow(Math.sin(Math.PI * clamp(f * 0.94 + 0.03, 0, 1)), 0.6); o.x = side * x + 0.34 * r * Math.sin(a); o.y = cy - 0.1 - 0.25 * f + 0.5 * r * Math.cos(a); o.z = z0 + f * len; set(o, grey, 9, 0, 0, 0, fx); }, { wrap: true });
  }
  await pause();
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(G.p), 3));
  g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(G.n), 3));
  await pause();
  g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(G.c), 3));
  g.setAttribute('aP', new THREE.BufferAttribute(new Float32Array(G.a), 4));
  g.setAttribute('aF', new THREE.BufferAttribute(new Float32Array(G.f), 1));
  await pause();
  g.setIndex(G.p.length / 3 > 65535 ? new THREE.BufferAttribute(new Uint32Array(G.idx), 1) : new THREE.BufferAttribute(new Uint16Array(G.idx), 1));
  g.computeBoundingSphere();
  // lamps: [x, y, z, r, g, b, size m, kind (0 steady, 1 beacon, 2 double strobe), phase, flex]. All strobes share one phase and both
  // beacons another, so the whole aircraft gives two white blinks per 1.2 s and one red a second: under three flashes a second
  const tip = WL[WL.length - 2], zTip = zN + tip.le + 0.4, lamps = [
    [0, AXIS_Y + 3.12, zN + 30, 1, 0.07, 0.04, 0.36, 1, 0, 0], [0, AXIS_Y - 3.72, zN + 33, 1, 0.07, 0.04, 0.36, 1, 0, 0],
    [tip.x, tip.y - 1.2, zTip, 1, 1, 1, 0.3, 2, 0, 1.1], [-tip.x, tip.y - 1.2, zTip, 1, 1, 1, 0.3, 2, 0, 1.1], [0, fY(72), zN + 72.2, 1, 1, 1, 0.26, 2, 0, 0],
    [-tip.x + 0.3, tip.y - 2.0, zTip - 0.9, 1, 0.05, 0.03, 0.24, 0, 0, 1.1], [tip.x - 0.3, tip.y - 2.0, zTip - 0.9, 0.16, 0.76, 0.58, 0.24, 0, 0, 1.1],
    [0, fY(71) + 0.2, zN + 71.6, 0.9, 0.9, 1, 0.18, 0, 0, 0]];
  return { geometry: g, nozzles, lamps };
}

const HULL_VERT = /* glsl */`
attribute vec4 aP; attribute float aF;
uniform float uTime, uPix;
varying vec3 vN; varying vec3 vWp; varying vec3 vCol; varying vec4 vP;
#include <fog_pars_vertex>
void main() {
  vec3 p = position;
  p.y += aF * (0.4 * sin(uTime * 1.1) + 0.12 * sin(uTime * 2.7 + 1.0));   // the wing breathing
  vec4 wp = modelMatrix * vec4(p, 1.0);
  vec3 wn = mat3(modelMatrix) * normal;
  // FAR OFF the thin parts (wing, fin, tailplane: a metre thick or less) are swelled along their normals, so that from any range
  // they are at least a pixel and a half thick and an aircraft hundreds of metres away is a whole cross, not a few dashes
  // (uPix: metres across one pixel at one metre; nothing moves within about 180 m)
  float thinPart = ((aP.x > 1.5 && aP.x < 2.5) || aP.x > 6.5) ? 1.0 : 0.0;
  wp.xyz += wn / max(length(wn), 1e-4) * clamp(0.75 * length(wp.xyz - cameraPosition) * uPix - 0.35, 0.0, 1.6) * thinPart;
  vWp = wp.xyz; vN = wn; vCol = color; vP = aP;
  vec4 mvPosition = viewMatrix * wp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;

const HULL_FRAG = /* glsl */`
uniform sampler2D uNoise;
uniform float uTime, uWin, uHump, uLogo;
uniform vec3 uSunDir, uSunCol, uEnvGlow, uEnvAnti, uEnvZen, uEnvDeck, uAmbUp, uAmbDn, uTail, uWinCol;
varying vec3 vN; varying vec3 vWp; varying vec3 vCol; varying vec4 vP;
#include <fog_pars_fragment>
float hash1(float n) { return fract(sin(n * 12.9898 + 4.1) * 43758.5453); }
// a small analytic sky for the gloss: glow at the sun's azimuth, rose opposite, indigo above, slate deck below
vec3 skyEnv(vec3 d) {
  vec2 h = d.xz; h /= max(length(h), 1e-4);
  vec2 sh = uSunDir.xz; sh /= max(length(sh), 1e-4);
  vec3 hor = mix(uEnvAnti, uEnvGlow, smoothstep(-0.3, 0.95, dot(h, sh)));
  vec3 up = mix(hor, uEnvZen, smoothstep(0.02, 0.5, d.y));
  return mix(uEnvDeck, up, smoothstep(-0.1, 0.01, d.y));
}
float aaLine(float d, float w) { return 1.0 - smoothstep(w, w + fwidth(d) * 1.2 + 1e-5, abs(d)); }
// line every 'period' of x, half-width w (derivative taken on x itself, so there is no spike where the cell wraps)
float aaLineP(float x, float period, float w) { float d = (fract(x / period + 0.5) - 0.5) * period; return 1.0 - smoothstep(w, w + fwidth(x) * 1.2 + 1e-5, abs(d)); }
float box(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  float part = vP.x;
  vec3 N = normalize(vN + vec3(0.0, 1e-6, 0.0)); if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(cameraPosition - vWp);
  vec3 alb = vCol, emis = vec3(0.0); float gloss = 0.4, metal = 0.0, pool = 0.0;
  float fr = texture2D(uNoise, vec2(vP.y * 0.05, vP.z * 0.45 + 0.2)).r * 0.6 + texture2D(uNoise, vec2(vP.y * 0.17, vP.z * 1.5)).g * 0.4;   // frost field (wing only; sampled outside the branches)
  if (part < 1.5) {
    // fuselage: paint scheme, joints, cabin windows, doors, cockpit glazing
    float t = vP.y, y = vP.z, ang = vP.w > 3.14159 ? vP.w - 6.28318 : vP.w, side = ang < 0.0 ? -1.0 : 1.0;
    float px = fwidth(t) + fwidth(y) + 1e-4;
    alb = mix(alb, vec3(0.47, 0.49, 0.54), 1.0 - smoothstep(-2.05, -1.85, y));
    float sweep = smoothstep(0.0, 0.5, (t - 49.0) - (2.4 - y) * 1.15);
    alb = mix(alb, uTail, sweep);
    alb = mix(alb, uTail, aaLine(y + 0.42, 0.085) * step(7.0, t) * (1.0 - sweep));
    alb *= 1.0 - 0.22 * aaLineP(t, 5.8, 0.012) * step(7.0, t) * step(t, 62.0);
    alb *= 1.0 - 0.35 * aaLine(t - 1.75, 0.012);
    alb = mix(alb, vec3(0.5, 0.5, 0.52), (1.0 - smoothstep(1.6, 1.8, t)) * 0.3);
    float wx = (t - 9.3) / 0.82, wi = floor(wx), wf = (fract(wx) - 0.5) * 0.82;
    float inRow = step(9.3, t) * step(t, 60.2);
    float dd = min(min(abs(t - 10.6), abs(t - 23.7)), min(abs(t - 38.5), abs(t - 54.3)));
    float door = 1.0 - smoothstep(0.78, 0.86, dd);
    float lit = hash1(wi * 1.37 + side * 31.7) > 0.145 ? 0.5 + 0.5 * hash1(wi * 7.13 + side * 3.0) : 0.015;
    float sd = box(vec2(wf, y - 0.72), vec2(0.125, 0.175), 0.07);
    float win = (1.0 - smoothstep(-px, px, sd)) * inRow * (1.0 - door);
    alb *= 1.0 - 0.3 * (1.0 - smoothstep(0.02, 0.02 + px, abs(sd - 0.03))) * inRow * (1.0 - door);
    float usd = box(vec2(wf, y - 3.2), vec2(0.11, 0.15), 0.06);
    win = max(win, (1.0 - smoothstep(-px, px, usd)) * step(8.0, t) * step(t, 19.5) * uHump);
    alb = mix(alb, vec3(0.02), win); emis += uWinCol * uWin * lit * win;
    float dline = 1.0 - smoothstep(0.012, 0.012 + px, abs(box(vec2(dd, y - 0.42), vec2(0.53, 0.97), 0.12)));
    alb *= 1.0 - 0.45 * dline;
    float dwin = 1.0 - smoothstep(-px, px, box(vec2(dd, y - 0.78), vec2(0.09, 0.13), 0.06));
    alb = mix(alb, vec3(0.02), dwin); emis += uWinCol * uWin * 0.45 * dwin;
    float c0 = mix(1.75, 4.5, uHump), c1 = mix(5.0, 7.5, uHump), sill = mix(0.25 + 0.1 * (t - 2.0), 1.75 + 0.22 * (t - 4.6), uHump);
    float gz = smoothstep(-px, px, y - sill) * smoothstep(-px, px, sill + 0.72 - y) * smoothstep(-px, px, c1 - t) * smoothstep(-px, px, t - c0);
    float aa = abs(ang), mul = min(aa, min(abs(aa - 0.62), abs(aa - 1.14)));
    gz *= smoothstep(0.02, 0.02 + fwidth(aa) + 1e-4, mul);
    alb = mix(alb, vec3(0.012, 0.016, 0.026), gz); gloss = mix(gloss, 1.0, gz); emis += vec3(1.0, 0.55, 0.25) * 0.04 * gz * uWin;
  } else if (part < 2.5) {
    // wing: slats, spoilers, flaps and ailerons with their gaps, tank panel lines, walkway, frost over the tanks
    float sp = vP.y, xc = vP.z, up = smoothstep(0.0, 0.5, vP.w);
    alb = mix(vec3(0.46, 0.48, 0.53), vec3(0.6, 0.62, 0.66), up);
    float ob = step(5.0, sp) * step(sp, 32.6);
    float ln = aaLine(xc - 0.13, 0.0022) * ob;
    ln = max(ln, aaLineP(sp, 5.4, 0.02) * step(xc, 0.13) * ob);
    float flap = step(3.4, sp) * step(sp, 23.8), ail = step(24.2, sp) * step(sp, 31.6);
    ln = max(ln, aaLine(xc - 0.72, 0.0032) * flap);
    ln = max(ln, aaLine(xc - 0.75, 0.0026) * ail);
    float ends = min(min(abs(sp - 12.6), abs(sp - 23.8)), min(abs(sp - 24.2), min(abs(sp - 27.9), abs(sp - 31.6))));
    ln = max(ln, aaLine(ends, 0.025) * step(0.735, xc));
    float spz = step(6.0, sp) * step(sp, 23.4) * step(0.6, xc) * step(xc, 0.72) * up;
    alb *= 1.0 - 0.12 * spz;
    ln = max(ln, max(aaLine(xc - 0.6, 0.002), aaLineP(sp - 6.0, 2.9, 0.018)) * step(6.0, sp) * step(sp, 23.4) * step(0.598, xc) * step(xc, 0.722) * up);
    float tank = step(3.6, sp) * step(sp, 31.0) * step(0.14, xc) * step(xc, 0.6);
    alb *= 1.0 - 0.13 * clamp(max(aaLine(xc - 0.3, 0.0016), aaLine(xc - 0.47, 0.0016)) + aaLineP(sp, 2.3, 0.012), 0.0, 1.0) * tank;
    alb *= 1.0 - 0.5 * (1.0 - smoothstep(0.03, 0.03 + fwidth(sp) * 1.5 + 1e-4, abs(box(vec2(sp - 5.3, (xc - 0.4) * 9.0), vec2(1.7, 1.7), 0.15)))) * up;
    float frost = smoothstep(0.5, 0.72, fr) * up * step(4.5, sp) * (1.0 - smoothstep(19.0, 24.0, sp)) * smoothstep(0.15, 0.22, xc) * (1.0 - smoothstep(0.5, 0.58, xc));
    alb = mix(alb, vec3(0.74, 0.79, 0.88), frost * 0.75); gloss = 0.55 * (1.0 - 0.85 * frost);
    alb *= 1.0 - 0.62 * ln;
    metal = (1.0 - smoothstep(0.012, 0.035, xc)) * 0.7;
    alb = mix(alb, uTail, smoothstep(35.3, 35.6, sp));
  } else if (part < 3.5) {
    // nacelle: polished lip, cowl seams, a band of the tail colour
    float z = vP.y, ang = vP.z;
    metal = 1.0 - smoothstep(0.2, 0.26, z);
    alb = mix(alb, uTail, step(0.25, vCol.r) * smoothstep(0.85, 0.9, z) * (1.0 - smoothstep(1.2, 1.25, z)));
    alb *= 1.0 - 0.3 * max(max(aaLine(z - 1.75, 0.012), aaLine(z - 2.95, 0.012)), aaLineP(ang, 1.5708, 0.008) * step(1.75, z)) * step(0.25, vCol.r);
    gloss = 0.5;
  } else if (part < 4.5) {
    metal = 1.0; gloss = 0.8;
  } else if (part < 5.5) {
    // fan: a spinning blur
    float r = vP.y, ang = vP.z;
    float bl = 0.5 + 0.5 * sin(ang * 22.0 + r * 5.0 - uTime * 37.0), beat = 0.5 + 0.5 * sin(ang * 2.0 - uTime * 6.3 + vP.w * 1.7);
    alb = vec3(0.022, 0.024, 0.03) + vec3(0.07, 0.072, 0.08) * bl * beat * smoothstep(0.37, 0.62, r) + vec3(0.05) * smoothstep(0.9, 1.0, r);
    gloss = 0.25;
  } else if (part < 6.5) {
    float r = vP.y, ang = vP.z;
    alb = mix(vec3(0.03), vec3(0.62), smoothstep(0.55, 0.8, sin(ang + r * 7.0 - uTime * 9.0)) * smoothstep(0.1, 0.3, r));
    gloss = 0.6;
  } else if (part < 7.5) {
    // fin: tail colour, a pale crescent, rudder split, the logo light's pool
    float h = vP.y, xc = vP.z, cw = mix(10.8, 4.0, clamp(h / 11.0, 0.0, 1.0));
    alb = uTail;
    vec2 e = vec2((xc - 0.42) * cw, h - 6.0);
    float cres = (1.0 - smoothstep(1.55, 1.62, length(e))) * smoothstep(1.3, 1.37, length(e - vec2(0.75, 0.45)));
    alb = mix(alb, vec3(0.74, 0.72, 0.68), cres);
    float rl = max(aaLine(xc - 0.68, 0.0035), aaLine(min(abs(h - 3.9), abs(h - 7.6)), 0.02) * step(0.68, xc));
    alb *= 1.0 - 0.5 * rl;
    pool = uLogo * exp(-(h - 5.0) * (h - 5.0) / 16.0) * smoothstep(0.05, 0.3, xc);
    gloss = 0.5;
  } else if (part < 8.5) {
    float sp = vP.y, xc = vP.z;
    alb *= 1.0 - 0.5 * max(aaLine(xc - 0.68, 0.0035) * step(1.6, sp), aaLine(sp - 6.0, 0.02) * step(0.68, xc));
    gloss = 0.5;
  }
  // light: coral key, blue fill from above, slate from the deck, the horizon glow as a broad side light, glossy sky reflection
  float ndl = dot(N, uSunDir), key = max(ndl, 0.0);
  vec2 sh = uSunDir.xz; sh /= max(length(sh), 1e-4);
  float az = N.x * sh.x + N.z * sh.y, lvl = 1.0 - 0.6 * abs(N.y);
  vec3 amb = mix(uAmbDn, uAmbUp, 0.5 + 0.5 * N.y) + uEnvGlow * (0.5 + 0.5 * az) * (0.5 + 0.5 * az) * lvl * 0.15 + uEnvAnti * (0.5 - 0.5 * az) * (0.5 - 0.5 * az) * lvl * 0.3;
  vec3 col = alb * (uSunCol * key + amb + vec3(1.0, 0.92, 0.8) * pool);
  vec3 R = reflect(-V, N);
  float fres = pow(clamp(1.0 - dot(N, V), 0.0, 1.0), 5.0);
  vec3 env = skyEnv(R);
  float spec = pow(max(dot(N, normalize(uSunDir + V + vec3(0.0, 1e-5, 0.0))), 0.0), 90.0);
  col = mix(col, env, clamp((0.04 + 0.96 * fres) * gloss * 1.5, 0.0, 1.0));
  col = mix(col, env * (0.4 + alb) + uSunCol * spec * 2.0, metal);
  col += uSunCol * spec * gloss * 1.2 + emis;
  // far off (beyond about 200 m) the surfaces seen edge-on take a rim of the low sun, strongest on the sunward side: from behind,
  // against the glow, the wing and the nacelles are then drawn by a coral line and not only by their shadow
  float gz2 = 1.0 - abs(dot(N, V)); gz2 *= gz2;
  col += uSunCol * 0.42 * gz2 * smoothstep(180.0, 420.0, length(cameraPosition - vWp)) * (0.35 + 0.65 * smoothstep(-0.3, 0.6, ndl));
  gl_FragColor = vec4(col, 1.0);
  #include <fog_fragment>
}`;

const LAMP_VERT = /* glsl */`
attribute vec4 aL; attribute vec4 aC; attribute float aF;
uniform float uTime, uLamp;
varying vec2 vQ; varying vec3 vC;
#include <fog_pars_vertex>
float blink(float x) { return smoothstep(0.0, 0.09, x) * (1.0 - smoothstep(0.09, 0.36, x)); }
void main() {
  vec3 p = position;
  p.y += aF * (0.4 * sin(uTime * 1.1) + 0.12 * sin(uTime * 2.7 + 1.0));
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  float I = 1.0;
  if (aL.z > 1.5) { float ph = fract(uTime / 1.2 + aL.w) * 1.2; I = blink(ph) + blink(ph - 0.42); }
  else if (aL.z > 0.5) { I = blink(fract(uTime + aL.w)); }
  float size = max(aC.w, -mvPosition.z * 0.0032) * (0.55 + 0.75 * I);
  mvPosition.xy += aL.xy * size * 3.2;
  vQ = aL.xy; vC = aC.rgb * I * uLamp;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const LAMP_FRAG = /* glsl */`
varying vec2 vQ; varying vec3 vC;
#include <fog_pars_fragment>
void main() {
  float r2 = dot(vQ, vQ);
  vec3 col = vC * (exp(-r2 * 22.0) + 0.16 * exp(-r2 * 4.0)) * (1.0 - smoothstep(0.7, 1.0, r2));
  #ifdef USE_FOG
    #ifdef FOG_EXP2
      col *= exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
    #else
      col *= 1.0 - smoothstep(fogNear, fogFar, vFogDepth);
    #endif
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

// colours by hour: trail body / rim / shadow / sky tint, then the hull's key, glow, anti-glow, zenith, deck, fills
function hourColours(hour, pal) {
  const c = (h, k = 1) => new THREE.Color(h).multiplyScalar(k), P = (i, k = 1) => pal[i].clone().multiplyScalar(k);
  if (hour === 'golden') return { body: c('#E0607A', 0.8), rim: c('#FF8FD0', 1.55), shade: c('#8A5AA0', 0.85), sky: c('#2A1E55', 0.25), bump: 0.5, crease: 0.5,
    sun: c('#FF5A4A', 1.3), glow: c('#FF6A5A', 1.1), anti: c('#7A4AA8', 0.4), zen: c('#1B1446', 1), deck: c('#3A3358', 0.6), up: c('#3A3A8C', 0.5), dn: c('#3A3358', 0.35), win: c('#FFB060', 2.4) };
  if (hour === 'night') return { body: c('#C9D4EE', 0.8), rim: c('#EAF0FF', 1.45), shade: c('#3A4E8C', 0.95), sky: c('#0A1230', 0.3),
    sun: c('#9FB4E8', 0.75), glow: c('#5A74B8', 0.5), anti: c('#22305E', 0.4), zen: c('#060A1E', 1), deck: c('#A8B4CC', 0.25), up: c('#2A3A70', 0.45), dn: c('#8090B0', 0.12), win: c('#FFA550', 3.0) };
  return { body: P(4, 0.9), rim: P(5, 1.6), shade: c('#5A6599', 1.0), sky: P(2, 0.3),
    sun: c('#FF8A62', 1.35), glow: P(5, 0.75).lerp(P(4, 1.1), 0.45), anti: P(3, 0.4), zen: P(2, 1), deck: P(1, 0.6), up: P(1, 1.6).lerp(P(2, 2.2), 0.4), dn: P(1, 0.8), win: c('#FFB266', 2.4) };
}

// The widebody on its own: { object, uniforms, lampUniforms, nozzles, lamps }. Exported so a world can fly a second one.
// opts: detail (1), humped, tailColor (hex), noiseTex (the hero's noise texture; required), pause (async () => ctx.yield()).
export async function buildAirliner(rng, opts = {}) {
  const tails = ['#0E6F7A', '#B01E3C', '#1D3FA6', '#D99A1B', '#5E2A6E', '#1E6B45', '#C8452A'];
  const cast = { humped: opts.humped ?? rng.chance(0.4), tail: new THREE.Color(opts.tailColor || rng.pick(tails)) };
  const built = await buildAirlinerGeometry(rng, cast, opts.detail ?? 1, opts.pause || (async () => {}));
  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uWin: { value: 1 }, uHump: { value: cast.humped ? 1 : 0 }, uLogo: { value: 0.9 }, uPix: { value: 0.0026 },
    uSunDir: { value: new THREE.Vector3(0.642, -0.052, -0.765) }, uSunCol: { value: new THREE.Color() }, uEnvGlow: { value: new THREE.Color() },
    uEnvAnti: { value: new THREE.Color() }, uEnvZen: { value: new THREE.Color() }, uEnvDeck: { value: new THREE.Color() }, uAmbUp: { value: new THREE.Color() },
    uAmbDn: { value: new THREE.Color() }, uTail: { value: cast.tail.clone().multiplyScalar(0.85) }, uWinCol: { value: new THREE.Color() } }]);
  uniforms.uNoise = { value: opts.noiseTex };
  const mat = new THREE.ShaderMaterial({ uniforms, vertexShader: HULL_VERT, fragmentShader: HULL_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide });
  const hull = new THREE.Mesh(built.geometry, mat); hull.name = 'airliner'; hull.frustumCulled = false;
  // lamps as small additive billboards
  const L = built.lamps, n = L.length, pos = new Float32Array(n * 12), aL = new Float32Array(n * 16), aC = new Float32Array(n * 16), aF = new Float32Array(n * 4), ix = new Uint16Array(n * 6);
  const pow = [1, 5, 6], cor = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let i = 0; i < n; i++) for (let k = 0; k < 4; k++) {
    const l = L[i], q = i * 4 + k, I = l[7] === 0 ? 2.6 : pow[l[7]];
    pos.set([l[0], l[1], l[2]], q * 3); aL.set([cor[k][0], cor[k][1], l[7], l[8]], q * 4); aC.set([l[3] * I, l[4] * I, l[5] * I, l[6]], q * 4); aF[q] = l[9];
    if (k === 0) ix.set([q, q + 1, q + 2, q, q + 2, q + 3], i * 6);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); lg.setAttribute('aL', new THREE.BufferAttribute(aL, 4));
  lg.setAttribute('aC', new THREE.BufferAttribute(aC, 4)); lg.setAttribute('aF', new THREE.BufferAttribute(aF, 1)); lg.setIndex(new THREE.BufferAttribute(ix, 1));
  const lampUniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uLamp: { value: 1 } }]);
  const lamps = new THREE.Mesh(lg, new THREE.ShaderMaterial({ uniforms: lampUniforms, vertexShader: LAMP_VERT, fragmentShader: LAMP_FRAG, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  lamps.name = 'airliner-lamps'; lamps.frustumCulled = false; lamps.renderOrder = 9;
  const object = new THREE.Group(); object.add(hull, lamps);
  const setHour = (H) => { uniforms.uSunCol.value.copy(H.sun); uniforms.uEnvGlow.value.copy(H.glow); uniforms.uEnvAnti.value.copy(H.anti); uniforms.uEnvZen.value.copy(H.zen);
    uniforms.uEnvDeck.value.copy(H.deck); uniforms.uAmbUp.value.copy(H.up); uniforms.uAmbDn.value.copy(H.dn); uniforms.uWinCol.value.copy(H.win); };
  return { object, hull, lamps, uniforms, lampUniforms, nozzles: built.nozzles, cast, setHour, update(time) { uniforms.uTime.value = time; lampUniforms.uTime.value = time; } };
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng.fork ? ctx.rng.fork('dawn-tracks') : ctx.rng, noise = ctx.noise;   // one draw from ctx.rng, then a private stream: yields cannot reorder it
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : PAL).map((h) => new THREE.Color(h));
  const detail = ctx.quality?.detail ?? 1, points = opts.pathPoints || DAWN_TRACKS_PATH, cam = makeCamTable(points);
  await ctx.yield();
  const T = trailParams(rng, cam, { moist: opts.moist, detail, axisCam: makeCamTable(LEGACY_PATH) });
  const root = new THREE.Group(); root.name = 'dawn-tracks-contrail';
  const noiseTex = await makeNoiseTex(ctx, rng);
  let hour = opts.hour === 'golden' || opts.hour === 'night' ? opts.hour : 'dawn', H = hourColours(hour, pal);
  const sunDir = (opts.sunDir ? opts.sunDir.clone() : new THREE.Vector3(Math.sin(40 * Math.PI / 180) * Math.cos(3 * Math.PI / 180), -Math.sin(3 * Math.PI / 180), -Math.cos(40 * Math.PI / 180) * Math.cos(3 * Math.PI / 180))).normalize();

  await ctx.yield();
  // the aircraft first: its nozzles say where the jets are born
  let air = null;
  if (opts.airliner !== false) {
    air = await buildAirliner(rng, { detail, humped: opts.humped, tailColor: opts.tailColor, noiseTex, pause: () => ctx.yield() });
    air.setHour(H); air.uniforms.uSunDir.value.copy(sunDir); root.add(air.object);
  }
  await ctx.yield();
  const nz = air ? air.nozzles : [new THREE.Vector3(11.5, -2.25, -2029), new THREE.Vector3(21, -1.25, -2022.4)];
  const birth = [-nz[0].z - 34, -nz[1].z - 34];

  const uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
    uTime: { value: 0 }, uGain: { value: 0.95 }, uHalo: { value: lerp(0.62, 0.95, T.moist) }, uStreak: { value: 1 }, uBump: { value: H.bump ?? 1.2 }, uCrease: { value: H.crease ?? 1 }, uFar: { value: new THREE.Vector2(1e6, 2e6) }, uSheet: { value: lerp(0.86, 1, T.moist) },
    uSunDir: { value: sunDir.clone() }, uBody: { value: H.body.clone() }, uRim: { value: H.rim.clone() }, uShade: { value: H.shade.clone() }, uSky: { value: H.sky.clone().multiplyScalar(0.25) } }]);
  uniforms.uNoise = { value: noiseTex };
  const material = new THREE.ShaderMaterial({ uniforms, vertexShader: TRAIL_VERT, fragmentShader: TRAIL_FRAG, transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide, fog: true });
  const addMesh = (geo, name, order) => { const m = new THREE.Mesh(geo, material); m.name = name; m.renderOrder = order; m.frustumCulled = false; root.add(m); return m; };

  addMesh(await buildHead(ctx, rng, noise, cam, T, birth), 'trail-head', 10);
  await ctx.yield();
  // loops 6, 5, 4 (far to near): alternately nose-down and nose-up like chain links, set off-centre so the camera passes a wall
  const deg = Math.PI / 180, rings = [];
  // (each at its own stage: loop 6, the youngest, has just shed a lobe; loop 5 drags its curtain; loop 4, the oldest, has begun to
  // burst: its wall is gone over a sixth of the way round on its high far side, left of the top, as the horseshoes ahead of it began)
  const specs = [{ s: 930, x: 20, noseDown: true, tilt: rng.range(41, 52) * deg, shed: true }, { s: 810, x: -20, noseDown: false, tilt: rng.range(36, 46) * deg, curtain: true },
    { s: 690, x: 20, noseDown: true, tilt: rng.range(45, 54) * deg, gaps: [[Math.PI * 0.5 + 0.6, 0.85, 1]] }];
  for (let i = 0; i < 3; i++) {
    const R = { ...specs[i], y: -110, a: 75 * rng.range(0.95, 1.05), b: 60 * rng.range(0.94, 1.05), wall: 16 * rng.range(0.92, 1.1) };
    const geo = await buildRing(ctx, rng, noise, cam, T, R), gp = geo.attributes.position, gk = geo.attributes.aK;
    // slide the ring sideways until its wall passes 35 m from the lens (at the brief's 22 m, and still at 29 m, the near wall was too
    // close to be seen as a wall: a lumpy mass wider than the lens's field, with no outline against the sky)
    let near = 1e9; { const pa = gp.array, ka = gk.array; for (let v = 0; v < gp.count; v += 2) if (ka[v * 4] < 1.5) near = Math.min(near, cam.dist(pa[v * 3] + R.x, pa[v * 3 + 1] + R.y, pa[v * 3 + 2] - R.s)); }
    R.x -= Math.sign(R.x) * clamp(35 - near, -16, 20);
    const mesh = addMesh(geo, 'loop-' + (6 - i), 11 + i);
    mesh.position.set(R.x, R.y, -R.s);
    rings.push({ ...R, mesh, loop: 6 - i, ph: rng.range(0, TAU), rate: rng.range(0.85, 1.15) });
    await ctx.yield();
  }
  addMesh(await buildRibbon(ctx, rng, noise, cam, T, { x: rings[2].x, y: rings[2].y, s: rings[2].s }), 'trail-ribbon', 14);   // rings[2] is loop 4
  await ctx.yield();
  // THE EXIT RINGS (private stream): two more rings of old cloud, the last loops of the trail of the aircraft that flew this track
  // before ours. THE WREATH, 48 m across, stands square to the last leg of the camera line with the portal at its centre; THE GATE,
  // 116 x 92 m, is threaded 50 m before it, so the wreath and the portal are seen nested inside it. Each has its own copy of
  // the trail material (same program, shared uniforms) with a distance fade, uFar: they come out of the haze only once the
  // aircraft is beside us, and the view from behind the aircraft keeps its clean sky.
  // (even, puffMax: their walls are of nearly even thickness and no puff on them is over 4 m. Met face-on, the swollen side limb of
  // a ring 13 m thick was one smooth bulge, a flat orange disc with a dark crescent beside it, and an 8 m puff another.)
  const lastP = points[points.length - 1], prevP = points[points.length - 2], exitTilt = Math.atan2(lastP[2] - prevP[2], lastP[1] - prevP[1]);
  const farMesh = async (R, name, order, f0, f1, seed) => {
    const mat = material.clone(); mat.uniforms = { ...uniforms, uFar: { value: new THREE.Vector2(f0, f1) } };
    const m = new THREE.Mesh(await buildRing(ctx, miniRng(T.wPh + seed), noise, cam, T, R), mat);
    m.name = name; m.renderOrder = order; m.frustumCulled = false; m.position.set(R.x, R.y, -R.s); root.add(m);
    await ctx.yield();
    return m;
  };
  const WR = { s: lastP[2], x: lastP[0], y: lastP[1], noseDown: false, tilt: exitTilt, a: 24, b: 22, wall: 7.5, age: 0.6, wob: 2, hangK: 0.4, puffK: 0.45, puffMax: 3.6, even: true };
  const wreath = await farMesh(WR, 'portal-wreath', 8, 400, 500, 0.123);
  // (THE GATE IS A WHOLE RING. Broken into two arcs it read as a hook and a comma, unfinished, and the three rings nested round the
  // portal were lost. It keeps one shallow notch on its lower left, where its wall necks to two thirds and closes again. It stands
  // where it always stood, 50 m before the portal: brought 20 m nearer and made larger it was two thirds of the picture's height as
  // the lens left the arch, but 30 m further on all four edges of the picture cut it and it was two pillars, not a ring.)
  const GATE_BACK = 50, gk = clamp((lastP[2] - GATE_BACK - prevP[2]) / Math.max(1e-6, lastP[2] - prevP[2]), -3, 1);
  const GR = { s: lastP[2] - GATE_BACK, x: lerp(prevP[0], lastP[0], gk), y: lerp(prevP[1], lastP[1], gk), noseDown: false, tilt: exitTilt, a: 58, b: 46, wall: 13, age: 0.62, wob: 5, hangK: 0.8, puffK: 1.0, puffMax: 4.2, even: true, gaps: [[Math.PI * 0.5 + 0.75, 0.2, 0.4]] };
  const gate = await farMesh(GR, 'exit-gate', 8.5, 360, 460, 0.456);
  // THE ARCH, 108 x 86 m, stands nearly upright 170 m ahead of the aircraft's nose where the camera line is still level: past the
  // nose it is two fifths of the frame high with the gate, the wreath and the portal nested inside it. It shows inside 340 m.
  const aC = [0, 0]; cam.at(lastP[2] - 170, aC);
  const AR = { s: lastP[2] - 170, x: aC[0], y: aC[1] + 14, noseDown: false, tilt: 1.47, a: 54, b: 43, wall: 12, age: 0.62, wob: 4, hangK: 0.7, puffK: 1.0, puffMax: 4.2, even: true };
  const arch = await farMesh(AR, 'exit-arch', 8.7, 250, 340, 0.789);

  const v3 = (x, y, s) => new THREE.Vector3(x, y, -s);
  const ringInfo = rings.map((r) => ({ loop: r.loop, center: v3(r.x, r.y, r.s), normal: new THREE.Vector3(0, Math.cos(r.tilt), (r.noseDown ? 1 : -1) * Math.sin(r.tilt)), across: 2 * r.a, along: 2 * r.b, wall: r.wall })).reverse();
  const last = points[points.length - 1], prev = points[points.length - 2];
  const anchors = {
    // the brief's camera line (entry .. portal) as local points; lobes and puffs were kept at least 8 m off it
    flyThrough: points.map((p) => v3(p[0], p[1], p[2])), pathPoints: points.map((p) => p.slice()),
    // where the 14 m portal sits and the way it faces (back down the last leg)
    portalSeat: { position: v3(last[0], last[1], last[2]), normal: new THREE.Vector3(prev[0] - last[0], prev[1] - last[1], last[2] - prev[2]).normalize(), radius: 7 },
    wreath: { center: v3(WR.x, WR.y, WR.s), across: 2 * WR.a, wall: WR.wall }, gate: { center: v3(GR.x, GR.y, GR.s), across: 2 * GR.a, wall: GR.wall },
    arch: { center: v3(AR.x, AR.y, AR.s), across: 2 * AR.a, wall: AR.wall },
    rings: ringInfo, loop5: ringInfo[1].center.clone(),                       // loops 4, 5, 6 in flight order; loop 5 is the brief's poi
    pinch: v3(0, T.axisY(1110 + WV), 1110 + WV), loop7: v3(0, T.axisY(1052 + WV) + 6, 1052 + WV), canyon: [v3(0, T.axisY(1350), 1350), v3(0, T.axisY(1750), 1750)],
    airliner: { nose: v3(0, AXIS_Y - 0.75, S_NOSE), tail: v3(0, AXIS_Y + 2.3, S_NOSE - 72), fuselage: v3(0, AXIS_Y, S_NOSE - 30), windows: v3(3, AXIS_Y + 0.72, S_NOSE - 34), finTop: v3(0, AXIS_Y + 12.6, S_NOSE - 66), wingTip: v3(35.5, 4.5, S_NOSE - 48) },
    nozzles: nz.map((p) => p.clone()), jetBirth: [v3(ENG_X[0], T.axisY(birth[0]), birth[0]), v3(ENG_X[1], T.axisY(birth[1]), birth[1])],
    sunDir: sunDir.clone(),
    viewpoints: [{ name: 'entry', position: v3(-150, -128, 0), target: v3(20, -110, 690) }, { name: 'chain', position: v3(-95, -88, 575), target: v3(-20, -110, 810) },
      { name: 'inside-loop-5', position: v3(18, -108, 810), target: v3(20, -110, 930) }, { name: 'canyon', position: v3(-1, -60, 1550), target: v3(0, AXIS_Y, S_NOSE - 40) },
      { name: 'wing', position: v3(12, 8, 2020), target: v3(3, AXIS_Y, S_NOSE - 10) }],
  };
  const applyHour = () => { uniforms.uBody.value.copy(H.body); uniforms.uRim.value.copy(H.rim); uniforms.uShade.value.copy(H.shade); uniforms.uSky.value.copy(H.sky).multiplyScalar(0.25); uniforms.uBump.value = H.bump ?? 1.2; uniforms.uCrease.value = H.crease ?? 1; if (air) air.setHour(H); };
  const hero = {
    object: root, radius: 250, height: 200, center: new THREE.Vector3(0, -105, -810), anchors, ground: false, groundY: -3000,
    material, uniforms, hullUniforms: air ? air.uniforms : null, lampUniforms: air ? air.lampUniforms : null, airliner: air, rings, noiseTex, moist: T.moist, hour,
    setProgress(u) { uniforms.uGain.value = lerp(0.9, 1.06, clamp(u, 0, 1)); },
    setSun(dir) { sunDir.copy(dir).normalize(); uniforms.uSunDir.value.copy(sunDir); if (air) air.uniforms.uSunDir.value.copy(sunDir); },
    setHour(name) { hour = name === 'golden' || name === 'night' ? name : 'dawn'; hero.hour = hour; H = hourColours(hour, pal); applyHour(); },
    update(dt, time) {
      uniforms.uTime.value = time; if (air) air.update(time);
      // each ring rocks about its own centre and bobs; small enough that the corridor stays clear
      for (const r of rings) {
        const m = r.mesh, t = time * 0.2 * r.rate + r.ph;
        m.rotation.set(0.1 * Math.sin(t), 0.035 * Math.sin(t * 0.63 + 1.3), 0.05 * Math.sin(t * 0.81 + 2.1));
        m.position.y = r.y + 2 * Math.sin(t * 1.37 + 0.7);
      }
      wreath.rotation.set(0.03 * Math.sin(time * 0.17), 0, 0.05 * Math.sin(time * 0.13 + 1));   // the exit rings only breathe: the camera line runs through their centres
      gate.rotation.set(0.04 * Math.sin(time * 0.15 + 2), 0, 0.05 * Math.sin(time * 0.11));
      arch.rotation.set(0.03 * Math.sin(time * 0.13 + 1), 0, 0.04 * Math.sin(time * 0.1 + 2.6));
    },
    dispose() { noiseTex.dispose(); },
  };
  root.userData.hero = hero;
  return hero;
}
