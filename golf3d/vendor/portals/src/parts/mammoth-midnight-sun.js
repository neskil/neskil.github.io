// TWO HERDS MEETING AT RIGHT ANGLES - hero set piece for the world "mammoth-midnight-sun" (The Saiga River, 20,000 years ago).
//
// A family file of woolly mammoths (matriarch, 18 cows and young, 3-7 calves, a tail bull 20 m behind, and a lone bull
// standing out in the plain) walks an arc at 1.3 m/s while a stream of saiga pours across it at 11 m/s, is squeezed
// into every gap between the walking animals, under tusks and past knees, and closes again beyond. Mammoths: domed head,
// neck notch, shoulder hump, back falling to low hips, small ears, spiral tusks, jointed legs, skirt and trousers of
// guard hair (single-triangle locks whose tips break into strands in the fragment shader), moulting wool, an eye that
// blinks. The walk is an amble solved in the vertex shader: each foot is planted for 68% of the stride and moves back
// exactly as fast as the body moves forward (stride = distance / cadence, so nothing slides); skirt and trousers swing a
// quarter-stride late; head nods once a stride; trunk curls and reaches (and lifts while the saiga pass); ears flick;
// tail swishes; flank breathes every 6 s; breath vapour. Saiga: barrel body, thin legs, low head, swollen drooping nose,
// amber ringed horns on bucks only; they run a flat pace, noses bobbing, and now and then one leaps a metre.
//
// LOCAL SPACE  +Y up, y = 0 the ground on the crest the file walks. The file walks an arc of radius 280 m about (0, 0, 280),
//   through the origin, toward +X (the matriarch leads, at x ~ +104 at herd time 0). The saiga come from +Z ("front") and
//   run toward -Z; the camera of the brief flies in with them, turns left at the matriarch and flies the file toward -X
//   on its +Z (inner) side, so the mammoths pass on its right with the sun behind them. Arc coordinates used everywhere:
//   a = metres along the arc (+ = the way the file walks, 0 at the origin), q = metres outward from the arc (+ = downstream).
//   hero.arcPoint(a, q, y) converts to local space; hero.groundAt(x, z) is the ground height (0 unless opts.swell).
// SIZE   file ~210 m long (a = +104 .. -105 at time 0; it advances 52 m during a 40 s flight), stream 60 m wide coming in,
//   156 m along the file; lone bull 135 m upstream. True extent: anchors.extent (radius 200 about (0,2,30)). Adults 2.4-3.2 m
//   at the hump, calves 1.3 m. hero.radius/center/height are a CLOSE ORBIT of the matriarch for the part viewer
//   (opts.focus or ?focus= : close | face | file | gap | tail | bull | calf | all).
// COST   ~170k triangles (21 adults x 2.9k, 3-7 calves x 1.8k, 330 saiga x 282, ground 3.2k, shadows, sprites), 7 draw calls,
//   no lights, no textures, 10-60 ms build, longest step < 40 ms.
// LIGHT  Self-lit by uniforms (it does not read scene lights; scene fog is honoured): a low warm key, lilac sky fill and
//   loess bounce, with a backlit hair halo. Defaults are the brief's midnight sun: sunDir (-0.5, 0.052, -0.866) = 3 degrees up,
//   30 degrees left of the saiga's heading; colours from the palette. hero.setLight({ sunDir, sunColor, sunIntensity, sky,
//   skyIntensity, ground, groundIntensity }) relights everything (shadows turn and lengthen with sunDir). Match the world's
//   DirectionalLight / fog to these, not the other way round. Dark coats are lifted (uExpo 0.58) so shadow sides never crush.
// STYLE  Naturalistic. Vertex colours (umber top, chestnut skirt, pale moult) x procedural strand noise; hair is geometry.
//
// OPTS   palette        7 hex strings in the brief's order (rose, apricot sun, lilac, grass, sage, umber coat, poppy)
//        detail         0.6-1 thins saiga and dust only (never the mammoths)
//        saiga          near-tier saiga count (330; 0 = none)      saigaRange [qFrom, qTo] of that tier (-52, 36)
//        calves         3-7 (default: seeded)                       bullDistance  lone bull's distance upstream (135)
//        swell          [height, halfWidth]: ground = -h (1 - exp(-(q/w)^2)); the file walks the crest (default flat)
//        ground         false to omit the built-in terrace (frost polygons, tufts, trails) when the world lays its own
//        shadows        false to omit the long shadow quads        shadowOpacity (0.5)   dust (0.32 alpha)
//        wakes          (m7) true: the near tier carries wakes for the river (the world then sets uniforms.uRiverW, uBarBox, uBarTex)
//        sunDir, sunIntensity (2.2), skyIntensity (3.2), groundIntensity (2.2), coatExposure (0.58)
//        duration (40), walkSpeed (1.3), saigaSpeed (11), arcRadius (280), previewWalk (8 s), rampOffset, focus
// HERO API (besides the contract)
//   hero.setProgress(u)     THE HERD CLOCK: call every frame with the world's u. Herd time = u x duration; walk and every
//                           gait phase hang off it, so the matriarch is where the anchors say when the camera arrives.
//                           While u is 0 (seen through the portal) the file walks on for up to previewWalk seconds, then
//                           stands; the saiga never stop. Never called: everything free-runs on update()'s time.
//   hero.setStream(k)       0..1: dust density and how readily trunks lift (1 while saiga cross, ease to 0 after u 0.66)
//   hero.setStreamWindow(tailQ, headQ)   hide saiga with q < tailQ or q > headQ: slide tailQ from -60 to +40 to let the
//                           tail of the column run out; pass nothing to reset.
//   hero.makeSaigaTier({ count, lod: 'near'|'mid'|'far', qFrom, qTo, bias, expo, shadows, nearFade, wake })  -> Mesh on the SAME flow and uniforms
//                           (m7) wake: its wakes on the river, as mesh.userData.wake (add it to the same parent)
//                           mesh.userData.uQ (slide x,y together to move its q window with the camera: every animal keeps its run),
//                           mesh.userData.uWrap (centre lane, lane window: keep the tier in the lanes round the camera), nearFade [from, to] m.
//                           uniforms.uSaigaFill / uSaigaExpo set the saiga look by mood; uShadowCol, uDustLit likewise.
//                           (its shadow mesh is mesh.userData.shadow). Call during build() for the world's mid/far tiers,
//                           e.g. qFrom -260, qTo 110. SAIGA_FLOW_GLSL is exported for far cards.
//   hero.positionAt(m, u)   local position of an animal of hero.mammoths ({ a, q, sc, kind, ... }) at progress u
//   hero.uniforms           shared uniforms (uWalk, uFlow, uArc, uSunDir, uSunCol, uSkyCol, uGroundCol, uMam, uLane, ...)
//   exports: mammothGeometry({ calf, coat, skirt, wool, ivory }), saigaGeometry({ lod, coat, cream, horn }), SAIGA_FLOW_GLSL
// ANCHORS (local space)
//   flyThrough   ordered camera line: down the stream at 6 m, the turn at the matriarch (5 m from her tusks at u 0.36),
//                up the file 8.5 m inside the arc at 4 m, past the tail bull, then 62 m dead straight sloping 7.5 m down
//                to portalSeat. Clearance >= 6 m from every mammoth at the progress it is passed (saiga cross beneath).
//   portalSeat   { position, facing, normal, radius 7 }: ring centre beyond the file's tail, facing back up the line
//   matriarch, tailBull, loneBull, gap (the 30 m gap in the file), fall (where the stream should pour off the bluff)
//   streamIn [from, to], sunDir, extent { center, radius }
//   viewpoints   { entry, matriarch, file, gap, tailBull }: { from, to, u } camera/target pairs for the brief's frames
import * as THREE from 'three';
import { Geo } from '../kit/fauna/common.js';

const DEFAULT_PALETTE = ['#F2A28A', '#F6C877', '#7F86B5', '#A8A46A', '#B9C2B0', '#3B2620', '#F4D03A'];
const C = (h) => new THREE.Color(h);
const TAU = Math.PI * 2;
const sat = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const t = sat((x - a) / (b - a)); return t * t * (3 - 2 * t); };
// small deterministic hash for geometry breakup (never Math.random; geometry is the same for every seed, variety is per instance)
const hsh = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
function crPoint(P, t) {   // Catmull-Rom through control points P at t in 0..1
  const n = P.length - 1, f = Math.min(n - 1e-6, Math.max(0, t * n)), i = Math.floor(f), k = f - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)], k2 = k * k, k3 = k2 * k, o = [];
  for (let a = 0; a < 3; a++) o.push(0.5 * (2 * p1[a] + (p2[a] - p0[a]) * k + (2 * p0[a] - 5 * p1[a] + 4 * p2[a] - p3[a]) * k2 + (3 * p1[a] - p0[a] - 3 * p2[a] + p3[a]) * k3));
  return o;
}

// ---------------------------------------------------------------------------------------------------------
// WOOLLY MAMMOTH. Y up, walking toward +Z, built at cow size (2.7 m at the shoulder hump, 4.2 m rump to brow).
// aAnim = (x: phase or random, y: weight 0 root .. 1 tip, z: part, w: extra)
//   part 0 body | 1 leg (x = gait phase, y = 0 hip .. 1 foot, w = hair lag) | 2 head | 3 tail | 4 trunk | 5 ear |
//   6 tusk (scaled about aPivot by the instance's tusk length) | 7 eyelid | 8 body hair lock (pendulum) | 9 head hair lock
//   every part >= 2 except 3 and 8 also nods with the head about the neck.
// aPivot = joint (hip / shoulder, tusk socket, ear root, trunk root, tail root, lock root).
// aGlow  = coat mask: 0 short hair on skin .. 1 the tip of a long lock; -1 bare skin (foot pad, trunk tip); -2 eye; -3 eye highlight; -4 ivory; -5 horn.
//          Only bare skin ever shares a triangle with coat, so no interpolated value can land in another material's band.
// opts: { calf: bool, coat, skirt, wool, ivory (hex) }
export function mammothGeometry(o = {}) {
  const g = new Geo(), calf = !!o.calf;
  const cTop = C(o.coat || '#3B2620'), cSkirt = C(o.skirt || '#8A4E2A'), cWool = C(o.wool || '#B08A62'), cIvory = C(o.ivory || '#E8DCC0');
  const cDeep = cTop.clone().multiplyScalar(0.62), cMid = cTop.clone().lerp(cSkirt, 0.3), cSkin = C('#4a3a36'), cTip = cSkirt.clone().lerp(cWool, 0.15), cHank = cWool.clone().multiplyScalar(0.6);
  const S = 16;
  // ---- torso: rump, low hips, belly, the fat shoulder hump, the notch of the short neck
  //            z      top    bottom  halfWidth
  const prof = calf ? [
    [-1.98, 1.80, 1.42, 0.30], [-1.72, 2.02, 1.22, 0.60], [-1.25, 2.12, 1.12, 0.74], [-0.70, 2.20, 1.08, 0.80], [-0.15, 2.32, 1.08, 0.80],
    [0.30, 2.46, 1.12, 0.76], [0.62, 2.52, 1.18, 0.70], [0.92, 2.46, 1.28, 0.60], [1.16, 2.36, 1.40, 0.50], [1.34, 2.30, 1.50, 0.40],
  ] : [
    [-2.02, 1.74, 1.40, 0.30], [-1.80, 1.98, 1.22, 0.62], [-1.42, 2.07, 1.12, 0.80], [-0.95, 2.16, 1.06, 0.90], [-0.45, 2.30, 1.03, 0.95], [0.0, 2.50, 1.05, 0.94],
    [0.35, 2.68, 1.10, 0.88], [0.62, 2.76, 1.16, 0.80], [0.88, 2.70, 1.26, 0.70], [1.10, 2.52, 1.38, 0.58], [1.26, 2.40, 1.48, 0.50], [1.40, 2.36, 1.56, 0.40],
  ];
  const rings = [{ z: prof[0][0] - 0.1, y: 1.56, rx: 0, ry: 0 }];
  for (const p of prof) rings.push({ z: p[0], y: (p[1] + p[2]) / 2, rx: p[3], ry: (p[1] - p[2]) / 2 });
  const body = g.loft(rings, { sides: S, top: cTop, belly: cMid, shade: [-0.5, 0.35] });
  g.glow(body, 0.25);
  // moult: pale wool coming away on the shoulders and hump (broad pattern), darker saddle over the hips
  g.paint(body, (x, y, z, c) => {
    const m = sstep(0.1, 0.6, Math.sin(x * 3.1 + z * 2.3) * Math.sin(z * 4.7 - y * 2.0 + 1.3) * 0.5 + 0.5 * hsh(Math.round(x * 5) + Math.round(z * 5) * 7.3) - 0.1)
      * sstep(-0.5, 0.4, z) * sstep(1.5, 2.2, y) * (calf ? 0.5 : 1);
    c.lerp(cHank, m * 0.55); if (y < 1.5) c.lerp(cSkirt, 0.3);
  });
  const topAt = (z) => { for (let i = 0; i < prof.length - 1; i++) if (z <= prof[i + 1][0]) { const k = sat((z - prof[i][0]) / (prof[i + 1][0] - prof[i][0])); return [prof[i][1] + (prof[i + 1][1] - prof[i][1]) * k, prof[i][2] + (prof[i + 1][2] - prof[i][2]) * k, prof[i][3] + (prof[i + 1][3] - prof[i][3]) * k]; } const l = prof[prof.length - 1]; return [l[1], l[2], l[3]]; };
  // point on the torso surface at z and angle th from the top (0 = spine, PI/2 = flank, PI = belly line)
  const skin = (z, th, lift = 0) => { const [t, b, w] = topAt(z); return [Math.sin(th) * (w + lift), (t + b) / 2 + Math.cos(th) * ((t - b) / 2 + lift), z]; };

  // ---- hair locks: ragged pointed triangles hanging from a root line. part 8 = pendulum on the body, 9 = on the head
  // roots: [[x,y,z],...]; dir(i) -> [dx,dy,dz] hang vector (length included); returns range
  const locks = (roots, dir, c0, c1, part, o2 = {}) => {
    const st = g.n, wj = o2.jit ?? 0.5;
    for (let i = 0; i + 1 < roots.length; i++) {
      const a = roots[i], b = roots[i + 1], h = hsh(i * 3.7 + a[2] * 11 + a[1] * 5 + (o2.seed || 0)), d = dir(i, h);
      const L = 1 - wj + wj * 2 * h, mx = a[0] + (b[0] - a[0]) * (0.2 + 0.6 * hsh(h * 91)), my = a[1] + (b[1] - a[1]) * 0.5, mz = a[2] + (b[2] - a[2]) * (0.2 + 0.6 * hsh(h * 37));
      const tone = 0.86 + 0.28 * hsh(h * 53.1 + i * 0.37), ca = c0.clone().multiplyScalar(tone), cb = c1.clone().multiplyScalar(tone);
      const ia = g.v(a[0], a[1], a[2], ca), ib = g.v(b[0], b[1], b[2], ca), it = g.v(mx + d[0] * L, my + d[1] * L, mz + d[2] * L, cb);
      g.tri(ia, ib, it);
      for (const [id, w] of [[ia, 0], [ib, 0], [it, 1]]) { g.a[id * 4] = h; g.a[id * 4 + 1] = w; g.a[id * 4 + 2] = part; g.a[id * 4 + 3] = o2.w ?? 0; g.pv[id * 3] = (a[0] + b[0]) / 2; g.pv[id * 3 + 1] = my; g.pv[id * 3 + 2] = (a[2] + b[2]) / 2; g.g[id] = w ? 1 : (o2.root ?? 0.45); }
    }
    return [st, g.n];
  };
  const coatLocks = () => {   // (its own build step when staged)
  // SKIRT: three overlapping tiers of guard hair down each flank, the lowest hanging to the knees
  const zA = prof[1][0] + 0.05, zB = prof[prof.length - 3][0];
  for (const sx of [-1, 1]) {
    const tiers = calf ? [[1.25, 0.34, 34, cTop, cMid], [1.9, 0.36, 40, cMid, cSkirt]] : [[1.0, 0.42, 44, cTop, cMid], [1.5, 0.52, 56, cTop, cMid], [1.8, 0.5, 60, cMid, cSkirt], [2.05, 0.64, 72, cMid, cSkirt], [2.5, 0.58, 56, cMid, cTip], [2.85, 0.5, 60, cDeep, cSkirt]];
    tiers.forEach(([th, len, n, c0, c1], ti) => {
      const roots = []; for (let i = 0; i <= n; i++) { const z = zA + (zB - zA) * (i / n) + (ti % 2) * 0.04; const p = skin(z, th + 0.1 * Math.sin(i * 1.7 + ti), 0.03 + ti * 0.012); roots.push([sx * p[0], p[1], p[2]]); }
      locks(roots, (i, h) => [sx * (0.05 + 0.05 * h) * (th > 2.3 ? -1 : 1), -len * (0.75 + 0.5 * hsh(i * 13.1 + ti)), -0.1 - 0.12 * h], c0, c1, 8, { seed: ti * 13 + sx, w: 0.6 + 0.4 * Math.min(1, ti / 3) });
    });
  }
  // BACK: a short ragged crest along the spine and tufts of moulting wool lifting off the hump (silhouette edge)
  for (const off of [-0.07, 0.07]) {
    const n = calf ? 30 : 44, roots = []; for (let i = 0; i <= n; i++) { const z = zA + (prof[prof.length - 1][0] - zA) * (i / n); const p = skin(z, 0, -0.02); roots.push([off * (0.6 + hsh(i * 7.7)), p[1], z]); }
    locks(roots, (i, h) => { const z = roots[i][2], hump = sstep(-0.3, 0.5, z) * (1 - sstep(0.75, 1.2, z)); return [off * 1.2, 0.004 + 0.016 * hump + 0.008 * h, -0.12 - 0.07 * h]; }, cDeep, cTop.clone().lerp(cSkirt, 0.4), 8, { seed: off * 90, w: 0.15, root: 0.5 });
  }
  if (!calf) for (const sx of [-1, 1]) for (let k = 0; k < 7; k++) {   // moult hanks on shoulder and hump
    const z0 = -0.1 + hsh(k * 5.1 + sx) * 1.0, th = 0.35 + hsh(k * 9.3 + sx * 2) * 0.9, roots = [];
    for (let i = 0; i <= 3; i++) { const p = skin(z0 + i * (0.05 + 0.05 * hsh(k * 3.3 + i)), th + 0.06 * hsh(i * 7.1 + k), 0.04); roots.push([sx * p[0], p[1], p[2]]); }
    locks(roots, (i, h) => [sx * (0.06 + 0.1 * h), -0.12 - 0.2 * h, -0.12 * h], cTop.clone().lerp(cWool, 0.55), cWool.clone().multiplyScalar(0.92), 8, { seed: k * 31 + sx, w: 0.9, root: 0.7, jit: 0.7 });
  }
  };
  if (!o.staged) coatLocks();
  const K = { calf, cTop, cSkirt, cWool, cIvory, cDeep, cMid, cSkin, cTip, skin, locks, topAt, coatLocks, staged: !!o.staged };
  return o.staged ? { g, K } : mammothFront(g, K);
}
// the same geometry built in three short steps with a yield between them (no build step may hold the page long)
export async function mammothGeometryAsync(o = {}, pause = async () => {}) {
  const st = mammothGeometry({ ...o, staged: true });
  await pause(); st.K.coatLocks();
  await pause(); mammothFront(st.g, st.K);
  await pause(); mammothLimbs(st.g, st.K, true);
  await pause(); const geo = st.g.build();
  await pause();
  const n = geo.attributes.position.count;
  for (let i = 0; i < n; i += 5000) { lockNormals(geo, i, Math.min(n, i + 5000)); await pause(); }
  geo.computeBoundingSphere();
  return geo;
}

// head, trunk, tusks, ears, eyes (everything that nods), then legs and tail
function mammothFront(g, K) {
  const { calf, cTop, cSkirt, cWool, cIvory, cDeep, cMid, cSkin, cTip, locks } = K;
  const P = (calf ? 62 : 68) * Math.PI / 180, sP = Math.sin(P), cP = Math.cos(P), hs = calf ? 0.92 : 1, O = calf ? [0, 2.70, 1.46] : [0, 2.99, 1.44];
  // head frame: local z runs down the face from the top of the dome, local y points out of the brow
  const hp = (x, y, z) => [O[0] + x * hs, O[1] + (y * cP - z * sP) * hs, O[2] + (y * sP + z * cP) * hs];
  const h0 = g.n;
  const hr = [[0.10, 0.0, 0.20, 0.24], [0.30, 0.02, 0.30, 0.38], [0.55, 0.04, 0.37, 0.46], [0.80, 0.06, 0.40, 0.47], [1.02, 0.10, 0.38, 0.41], [1.22, 0.16, 0.31, 0.31], [1.38, 0.20, 0.25, 0.25]];
  const head = g.loft([{ z: -0.03, y: 0, rx: 0, ry: 0 }, ...hr.map((r) => ({ z: r[0], y: r[1], rx: r[2], ry: r[3] }))], { sides: 14, top: cTop, belly: cMid, shade: [-0.6, 0.2] });
  g.glow(head, 0.3);
  g.paint(head, (x, y, z, c) => { if (z > 1.05) c.lerp(cSkin, sstep(1.05, 1.35, z) * 0.6); if (z < 0.4) c.lerp(cDeep, 0.5); });
  const headSurf = (z, th, lift = 0) => { let i = 0; while (i < hr.length - 2 && z > hr[i + 1][0]) i++; const a = hr[i], b = hr[i + 1], k = sat((z - a[0]) / (b[0] - a[0])), yo = a[1] + (b[1] - a[1]) * k, rx = a[2] + (b[2] - a[2]) * k + lift, ry = a[3] + (b[3] - a[3]) * k + lift; return [Math.sin(th) * rx, yo + Math.cos(th) * ry, z]; };
  // eyes: dark ball, one highlight, in a paler ring of short hair
  for (const sx of [-1, 1]) {
    const e = headSurf(0.80, 1.12, -0.012), e0 = g.n;
    g.blob(sx * e[0], e[1], e[2], 0.036, 0.058, 0.062, C('#0d0907'), null, 6, 4); g.glow([e0, g.n], -2);
    const q0 = g.n; g.fan([[sx * (e[0] + 0.03), e[1] + 0.035, e[2] - 0.03], [sx * (e[0] + 0.03), e[1] + 0.055, e[2] - 0.012], [sx * (e[0] + 0.032), e[1] + 0.03, e[2] - 0.006]], C('#fff4e0')); g.glow([q0, g.n], -3);
    g.anim([e0, g.n], () => [0, 0, 7, 0]); g.pivot([e0, g.n], sx * (e[0] - 0.03), e[1], e[2]);
    // ear: a small hairy flap behind the eye
    const r = headSurf(0.62, 1.75, 0), a0 = g.n, el = calf ? 0.26 : 0.3;
    g.fan([[sx * r[0], r[1] + 0.07, r[2] - 0.08], [sx * (r[0] + 0.1), r[1] - 0.12, r[2] - 0.1], [sx * (r[0] + 0.14), r[1] - 0.16, r[2] + el * 0.45], [sx * (r[0] + 0.1), r[1] - 0.08, r[2] + el], [sx * r[0], r[1] + 0.04, r[2] + el * 0.8]], cMid, cSkirt);
    g.anim([a0, g.n], (x) => [sx, sat((Math.abs(x) - r[0]) / 0.14), 5, 0]); g.pivot([a0, g.n], sx * r[0], r[1], r[2]); g.glow([a0, g.n], 0.6);
    // cheek beard and the hair of the jaw
    const roots = []; for (let i = 0; i <= 9; i++) { const p = headSurf(0.55 + i * 0.075, 2.05 + 0.04 * Math.sin(i * 2.1), 0.02); roots.push([sx * p[0], p[1], p[2]]); }
    locks(roots, (i, h) => [sx * 0.03, -0.26 - 0.14 * h, 0.16 + 0.05 * h], cMid, cSkirt, 9, { seed: 40 + sx, w: 0.5 });
  }
  // topknot on the dome, chin beard
  for (const off of [-0.05, 0.05]) { const roots = []; for (let i = 0; i <= 8; i++) { const p = headSurf(0.04 + i * 0.07, 0, 0); roots.push([off * (1 + 0.5 * hsh(i * 3.3 + off)), p[1] - Math.abs(off) * 0.25, p[2] - (1 - i / 8) * 0.03 - Math.abs(off) * 0.1]); }
    locks(roots, (i, h) => [off * 0.8, 0.004 + 0.008 * h, -0.08 - 0.04 * h], cDeep, cTop.clone().lerp(cSkirt, 0.5), 9, { seed: 70 + off * 10, w: 0.3, root: 0.5 }); }
  { const roots = []; for (let i = 0; i <= 8; i++) { const th = Math.PI + (i / 8 - 0.5) * 1.5, p = headSurf(1.12, th, 0.01); roots.push(p); }
    locks(roots, (i, h) => [0, -0.34 - 0.12 * h, 0.2], cMid, cSkirt, 9, { seed: 55, w: 0.6 }); }
  // tusks: down out of the face, out and forward, then up and back in until the tips point at each other
  if (!calf) for (const sx of [-1, 1]) {
    const s0 = headSurf(1.2, 1.25, -0.06), CP = [[0.27, 0.0, 0.0], [0.38, -0.46, 0.2], [0.62, -0.80, 0.62], [0.66, -0.80, 1.06], [0.46, -0.56, 1.30], [0.20, -0.36, 1.30]];
    const base = hp(s0[0], s0[1], s0[2]), pts = [], rr = [], N = 14, t0 = g.n;   // CP are offsets from the socket in body axes (x out, y up, z forward)
    for (let i = 0; i <= N; i++) { const t = i / N, q = crPoint(CP, t); pts.push([sx * (base[0] - CP[0][0] + q[0]), base[1] + q[1], base[2] + q[2] - 0.02]); rr.push(i === N ? 0 : 0.078 * (1 - 0.72 * t * t) * (0.9 + 0.1 * Math.cos(t * 3))); }
    const tk = g.tube(pts, rr, 7, cIvory, cIvory); g.glow(tk, -4);
    g.paint(tk, (x, y, z, c, i) => { const t = Math.floor((i - t0) / 7) / N; c.lerp(C('#6e4a2c'), 1 - sstep(0.02, 0.3, t)); c.multiplyScalar(0.9 + 0.1 * Math.sin(t * 60)); });
    g.anim(tk, () => [0, 0, 6, 0]); g.pivot(tk, pts[0][0], pts[0][1], pts[0][2]);
  }
  // move head-frame parts into place (tusks were built in body axes already: skip them)
  const tuskParts = new Set(); for (let i = h0; i < g.n; i++) if (g.a[i * 4 + 2] === 6) tuskParts.add(i);
  for (let i = h0; i < g.n; i++) { if (tuskParts.has(i)) continue; const q = hp(g.p[i * 3], g.p[i * 3 + 1], g.p[i * 3 + 2]); g.p[i * 3] = q[0]; g.p[i * 3 + 1] = q[1]; g.p[i * 3 + 2] = q[2];
    const pv = hp(g.pv[i * 3], g.pv[i * 3 + 1], g.pv[i * 3 + 2]); g.pv[i * 3] = pv[0]; g.pv[i * 3 + 1] = pv[1]; g.pv[i * 3 + 2] = pv[2]; if (g.a[i * 4 + 2] === 0) g.a[i * 4 + 2] = 2; }
  // trunk: 2 m, hanging off the face, the tip curled back toward the mouth; ringed with wrinkles, hairy at the root
  {
    const root = hp(0, 0.2, 1.3), L = calf ? 1.5 : 2.02, N = 16, pts = [], rr = []; let y = root[1], z = root[2];
    for (let i = 0; i <= N; i++) { const t = i / N, a = -P + (-(Math.PI / 2) - 0.1 + P) * sstep(0, 0.45, t) - sstep(0.62, 1, t) * 1.25;
      pts.push([0, y, z]); rr.push((0.245 - 0.165 * Math.pow(t, 0.8)) * hs); y += Math.sin(a) * L / N; z += Math.cos(a) * L / N; }
    const t0 = g.n, tr = g.tube(pts, rr, 9, cMid, cSkin);
    g.paint(tr, (x, yy, zz, c, i) => { const k = Math.floor((i - t0) / 9); c.multiplyScalar(k % 2 ? 0.8 : 1.05); });
    g.anim(tr, (x, yy, zz, i) => [0, Math.floor((i - t0) / 9) / N, 4, 0]); g.pivot(tr, root[0], root[1], root[2]); g.glow(tr, (x, yy, zz, i) => (Math.floor((i - t0) / 9) / N > 0.8 ? -1 : 0.3));
    // tip: one long finger above a broad lip
    const e = pts[N], d = [0, pts[N][1] - pts[N - 1][1], pts[N][2] - pts[N - 1][2]], dl = Math.hypot(d[1], d[2]) || 1, f0 = g.n;
    g.tube([[0, e[1], e[2]], [0, e[1] + d[1] / dl * 0.1 + 0.02, e[2] + d[2] / dl * 0.1 + 0.035], [0, e[1] + d[1] / dl * 0.2 + 0.015, e[2] + d[2] / dl * 0.2 + 0.05]], [0.05, 0.03, 0], 5, cSkin, C('#6a5650'));
    g.anim([f0, g.n], () => [0, 1, 4, 0]); g.pivot([f0, g.n], root[0], root[1], root[2]); g.glow([f0, g.n], -1);
    // hair down the front of the trunk
    for (const sx of [-1, 1]) { const roots = []; for (let i = 0; i <= 9; i++) { const k = i, q = pts[k]; roots.push([sx * rr[k] * 0.75, q[1], q[2] + rr[k] * 0.55]); }
      const lr = locks(roots, (i, h) => [sx * 0.05, -0.2 - 0.1 * h, 0.03], cMid, cSkirt, 4, { seed: 80 + sx, root: 0.4 });
      for (let i = lr[0]; i < lr[1]; i++) { const k = Math.floor((i - lr[0]) / 3); g.a[i * 4 + 1] = (k + 0.5) / N; g.pv[i * 3] = root[0]; g.pv[i * 3 + 1] = root[1]; g.pv[i * 3 + 2] = root[2]; } }
  }
  return K.staged ? null : mammothLimbs(g, K);
}

function mammothLimbs(g, K, staged) {
  const { calf, cTop, cSkirt, cDeep, cMid, cSkin, cTip, locks } = K, k = calf ? 0.84 : 1;
  // legs: jointed columns. Forelegs longer (shoulder joint high under the hump), elbow and knee visible, round feet.
  // gait phases (an amble: the two legs of one side move nearly together): LH 0, LF 0.22, RH 0.5, RF 0.72
  const leg = (sx, front, phase) => {
    const x = sx * (front ? 0.5 : 0.48), z = front ? 0.62 : -1.42, jy = front ? 1.95 : 1.72;
    const pts = front
      ? [[x, jy, z], [x, 1.52, z + 0.03], [x, 1.16, z - 0.05], [x, 0.78, z + 0.01], [x, 0.46, z + 0.04], [x, 0.2, z + 0.03], [x, 0.07, z + 0.06], [x, 0, z + 0.06]]
      : [[x, jy, z], [x, 1.32, z + 0.12], [x, 1.0, z + 0.17], [x, 0.64, z + 0.03], [x, 0.42, z - 0.05], [x, 0.2, z - 0.01], [x, 0.07, z + 0.03], [x, 0, z + 0.03]];
    const rr = (front ? [0.36, 0.31, 0.25, 0.215, 0.19, 0.205, 0.25, 0.24] : [0.4, 0.35, 0.27, 0.205, 0.18, 0.2, 0.245, 0.235]).map((r) => r * k);
    const r = g.tube(pts, rr, 9, cMid, cDeep);
    g.anim(r, (px, py) => [phase, sat((jy - py) / jy), 1, 0]); g.pivot(r, x, jy, z);
    g.glow(r, (px, py) => (py < 0.1 ? -1 : 0.3));
    g.paint(r, (px, py, pz, c) => { if (py < 0.1) c.copy(pz > z + 0.2 && py < 0.08 && py > 0.01 ? C('#5d5247') : cSkin); });
    // trousers: three rings of guard hair down the leg, hair to the feet
    const tiers = calf ? [[1.2, 0.36], [0.7, 0.3]] : [[1.42, 0.5], [1.02, 0.46], [0.62, 0.4], [0.3, 0.22]];
    tiers.forEach(([y0, len], ti) => {
      let zc = z, rad = 0.25; for (let i = 0; i + 1 < pts.length; i++) if (pts[i][1] >= y0 && pts[i + 1][1] <= y0) { const t = (pts[i][1] - y0) / (pts[i][1] - pts[i + 1][1]); zc = pts[i][2] + (pts[i + 1][2] - pts[i][2]) * t; rad = rr[i] + (rr[i + 1] - rr[i]) * t; }
      const roots = [], n = 9; for (let i = 0; i <= n; i++) { const a = (i / n) * TAU + ti; roots.push([x + Math.cos(a) * (rad + 0.02), y0 + 0.04 * Math.sin(i * 2.7), zc + Math.sin(a) * (rad + 0.02)]); }
      const lr = locks(roots, (i, h) => { const a = ((i + 0.5) / n) * TAU + ti; return [Math.cos(a) * 0.07, -len * (0.8 + 0.4 * h), Math.sin(a) * 0.07 - 0.04]; }, ti < 2 ? cMid : cDeep, ti < 2 ? cSkirt : cMid, 1, { seed: 100 + ti * 7 + sx * 3 + (front ? 50 : 0), jit: 0.2 });
      for (let i = lr[0]; i < lr[1]; i++) { const tip = g.a[i * 4 + 1]; g.a[i * 4] = phase; g.a[i * 4 + 1] = sat((jy - (y0 - (tip ? len * 0.6 : 0))) / jy); g.a[i * 4 + 3] = tip; g.pv[i * 3] = x; g.pv[i * 3 + 1] = jy; g.pv[i * 3 + 2] = z; }
    });
  };
  leg(-1, false, 0.0); leg(-1, true, 0.22); leg(1, false, 0.5); leg(1, true, 0.72);
  // tail: short, tufted
  { const ty = calf ? 1.86 : 1.8, tz = calf ? -2.06 : -2.1, t0 = g.n;
    g.tube([[0, ty, tz + 0.08], [0, ty - 0.12, tz - 0.06], [0, ty - 0.32, tz - 0.1], [0, ty - 0.5, tz - 0.08]], [0.07, 0.055, 0.04, 0.03], 5, cTop, cDeep);
    const roots = []; for (let i = 0; i <= 6; i++) { const a = (i / 6) * TAU; roots.push([Math.cos(a) * 0.035, ty - 0.46, tz - 0.08 + Math.sin(a) * 0.035]); }
    locks(roots, (i, h) => [0, -0.22 - 0.08 * h, -0.03], cDeep, cTop, 3, { seed: 200 });
    g.anim([t0, g.n], (x, y) => [0, sat((ty - y) / 0.7), 3, 0]); g.pivot([t0, g.n], 0, ty, tz + 0.08); g.glow([t0, g.n], 0.5); }
  return staged ? g : mammothFinish(g);
}
function mammothFinish(g) {
  const geo = g.build();
  lockNormals(geo, 0, geo.attributes.position.count);
  geo.computeBoundingSphere();
  return geo;
}
const _ln = new THREE.Vector3(), _lo = new THREE.Vector3();
function lockNormals(geo, i0, i1) {
  // hair locks are single triangles: give each one the normal of the body under it (outward from the spine) so it shades as coat, not as a card
  const pos = geo.attributes.position, nor = geo.attributes.normal, an = geo.attributes.aAnim, gl = geo.attributes.aGlow;
  for (let i = i0; i < i1; i++) {
    const part = an.getZ(i), isLock = (part === 8 || part === 9) || (part === 1 && (gl.getX(i) === 1 || gl.getX(i) === 0.45)) || (part === 4 && gl.getX(i) >= 0.4) || (part === 3 && gl.getX(i) >= 0.45);
    if (!isLock) continue;
    const x = pos.getX(i), y = pos.getY(i), n = _ln.set(x * 1.2, (y - 1.75) * 0.8, 0.15).normalize().lerp(_lo.set(nor.getX(i), nor.getY(i), nor.getZ(i)), 0.25).normalize();
    nor.setXYZ(i, n.x, n.y, n.z);
  }
}

// ---------------------------------------------------------------------------------------------------------
// SHARED GLSL. The file of mammoths walks an arc of radius uArc.x about the local point (0, 0, uArc.x); arc
// coordinate a (metres, +a = the way they walk, a = 0 at the origin) and radial coordinate q (metres, +q = outward
// = downstream = local -Z at the origin). Ground: y = -uArc.y * (1 - exp(-(q / uArc.z)^2)), the swell whose crest
// the file walks (uArc.y = 0: flat).
const GLSL_COMMON = /* glsl */`
uniform float uTime, uWalk, uStream;
uniform vec4 uArc, uBluff;   // uBluff: (q where the slump ramp starts, its run, its drop, 0): the stream pours down it
uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol;
float h11(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
float groundY(float q){ float w = max(uArc.z, 1.); return -uArc.y * (1. - exp(-(q * q) / (w * w))) - uBluff.z * smoothstep(uBluff.x, uBluff.x + max(uBluff.y, 1.), q); }
vec3 arcPos(float a, float q){ float ph = a / uArc.x, rr = uArc.x + q; return vec3(rr * sin(ph), groundY(q), uArc.x - rr * cos(ph)); }
// local (x = outward, z = along the walk) -> object space at arc coordinate a
vec3 arcDir(float a, vec3 v){ float ph = a / uArc.x, c = cos(ph), s = sin(ph); return vec3(v.x * s + v.z * c, v.y, -v.x * c + v.z * s); }
`;
// CLOUD SHADOWS (the noon look): one drifting field shared by the land, the grass and every animal, so a shadow that
// crosses the plain darkens the herd inside it. cloudShade(world xz, time) -> 0 sunlit .. uCloud in shadow.
export const CLOUD_GLSL = /* glsl */`
uniform float uCloud;
float clh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float cln(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(clh(i), clh(i + vec2(1., 0.)), f.x), mix(clh(i + vec2(0., 1.)), clh(i + vec2(1., 1.)), f.x), f.y); }
float cloudShade(vec2 p, float t){ return uCloud * smoothstep(.54, .63, cln(p * .017 + t * vec2(.1, .045)) * .72 + cln(p * .05 - t * vec2(.05, .02)) * .28); }
`;
const GLSL_LIT_PARS = /* glsl */`
${CLOUD_GLSL}
float gSunVis = 1.;   // how much of the sun reaches this fragment (cloud shadow); set in main before litCoat
uniform float uTime, uFill;   // uFill: how much of the sky / ground fill reaches this coat (1 = the midnight look; lower under a high sun, so form reads)
uniform vec3 uSunDir, uSunCol, uSkyCol, uGroundCol;
varying vec3 vN, vWorld, vObj, vCol;
varying float vHair;
float vh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(vh(i), vh(i + vec2(1., 0.)), f.x), mix(vh(i + vec2(0., 1.)), vh(i + vec2(1., 1.)), f.x), f.y); }
// one light model for every animal here: wrapped low sun, sky/ground fill that never crushes, backlit hair halo
vec3 litCoat(vec3 base, vec3 N, vec3 V, float hair, float halo){
  float ndl = dot(N, uSunDir), wrap = max(0., (ndl + .5) / 1.5);
  vec3 hemi = mix(uGroundCol, uSkyCol, N.y * .5 + .5) * uFill * (1.45 - .45 * min(wrap, 1.));   // the shadow side is filled a little more: it never crushes
  float back = max(0., -dot(V, uSunDir)), fres = 1. - abs(dot(N, V)); fres = fres * fres;
  vec3 c = base * (uSunCol * wrap * wrap * gSunVis + hemi);
  // halo: hair edges and lock tips catch the level sun when we look toward it; a weaker sky rim everywhere
  vec3 tipC = mix(base, vec3(.9, .55, .32), .5);
  c += tipC * uSunCol * gSunVis * halo * (fres * fres * (.12 + 2.2 * back * back) + hair * hair * hair * (.02 + .5 * back * back * back));
  c += base * uSkyCol * fres * .35;
  return c;
}
`;
const MAMMOTH_VERT = /* glsl */`
attribute vec4 aAnim, iA, iB; attribute vec3 aPivot, iTint; attribute float aGlow;
varying vec3 vN, vWorld, vObj, vCol; varying float vHair;
${GLSL_COMMON}
#include <fog_pars_vertex>
const float LS = 2.0, DUTY = .68;
vec2 footAt(float f){   // x: fore-aft offset of the foot from its rest place, y: lift. Planted for DUTY of the stride, moving back exactly as fast as the body goes forward.
  f = fract(f);
  if(f < DUTY) return vec2(LS * (DUTY * .5 - f), 0.);
  float u = (f - DUTY) / (1. - DUTY), e = u * u * (3. - 2. * u);
  return vec2(LS * DUTY * (e - .5), sin(u * 3.14159));
}
void rotX(inout vec3 d, float a){ float c = cos(a), s = sin(a); d.yz = vec2(d.y * c - d.z * s, d.z * c + d.y * s); }
void main(){
  vec3 p = position, n = normal; float part = aAnim.z, w = aAnim.y, seed = iB.z, sc = iA.z, stand = iB.w;
  float adv = uWalk * (1. - stand), cyc = adv * (uArc.x + iA.y) / uArc.x / (LS * sc) + iA.w;
  float t = uTime;
  float raise = max(stand, uStream * smoothstep(.2, .8, .5 + .5 * sin(t * .37 + seed * 4.)));
  if(part > .5 && part < 1.5){
    vec2 fa = footAt(cyc + aAnim.x), fl = footAt(cyc + aAnim.x - .12);
    float hind = step(aPivot.z, 0.), sw = w, lw = smoothstep(.3, 1., w);
    p.z += fa.x * sw + fa.y * .2 * sin(lw * 3.14159) * (hind > .5 ? 1. : .7) + (fl.x - fa.x) * aAnim.w * .5;
    p.y += fa.y * (.16 * lw + aAnim.w * .03);
  } else {
    if(part > 5.5 && part < 6.5) p = aPivot + (p - aPivot) * iB.x;
    if(part > 6.5 && part < 7.5){ float bl = smoothstep(.985, 1., sin(t * .83 + seed * 5.)); p = mix(p, aPivot, bl); }
    if(part > 3.5 && part < 4.5){   // trunk: curl and reach, raised when the saiga come through
      float ww = w * w, A = (.22 * sin(t * .55 + seed * 3.) + .12 * sin(t * 1.3 + seed) + raise * (1.25 + .25 * sin(t * .9 + seed))) ;
      vec3 d = p - aPivot; rotX(d, -A * (w * .6 + ww * .9)); p = aPivot + d;
      p.x += ww * .22 * sin(t * .7 + seed * 2.) * (1. - .5 * raise);
    }
    if(part > 4.5 && part < 5.5){ float fk = sin(t * 1.3 + seed * 9. + aAnim.x); fk = fk * fk; fk = fk * fk; p.x += aAnim.x * w * .16 * fk; p.z -= w * .08 * fk; }
    if(part > 2.5 && part < 3.5){ p.x += w * w * .32 * sin(t * 2.1 + seed * 7.); p.z -= w * w * .05; }
    if(part > 7.5){   // hair: a pendulum a quarter-stride behind the body, and the wind
      float sw2 = sin((cyc * 2. - .25) * 6.2832) * (1. - stand);
      float gust = sin(t * 1.7 + position.z * 2.3 + seed) * .5 + sin(t * .6 - iA.x * .05) * .5;
      p.z -= w * aAnim.w * .085 * sw2;
      p.x += w * (.02 + .03 * aAnim.w) * gust * sign(position.x + 1e-4) + w * .03 * gust;
      p.y += w * aAnim.w * .015 * sw2;
    }
    if(part > 1.5 && (part < 2.5 || part > 3.5) && (part < 7.5 || part > 8.5)){   // the head nods once a stride and looks about
      vec3 np = vec3(0., 2.25, 1.12), d = p - np;
      rotX(d, -(.05 * sin(cyc * 6.2832 + 1.) * (1. - stand) + .03 * sin(t * .4 + seed * 6.) - raise * .1));
      float yw = .1 * sin(t * .23 + seed * 8.) + .05 * sin(t * .61 + seed); float c = cos(yw), s = sin(yw);
      d.xz = vec2(d.x * c + d.z * s, d.z * c - d.x * s); p = np + d;
    }
    // body: two bobs a stride, a roll over the planted side, the flank breathing every 6 s
    float bob = cos(cyc * 12.566) * (1. - stand);
    p.y += .028 * bob; p.x += .04 * sin(cyc * 6.2832 + .6) * (p.y / 2.7) * (1. - stand);
    float fl = smoothstep(.45, .9, abs(position.x)) * smoothstep(-1.5, -.9, position.z) * (1. - smoothstep(-.1, .5, position.z));
    p.x *= 1. + .03 * fl * sin(t * 1.047 + seed * 3.);
  }
  float a = iA.x + adv;
  vec3 obj = arcPos(a, iA.y) + arcDir(a, p * sc);
  vObj = position; vCol = color * iTint; vHair = aGlow;
  vec4 wp = modelMatrix * vec4(obj, 1.); vWorld = wp.xyz;
  vN = normalize(mat3(modelMatrix) * arcDir(a, n));
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const COAT_FRAG = /* glsl */`
${GLSL_LIT_PARS}
uniform float uExpo, uShag, uSnow;
#include <fog_pars_fragment>
void main(){
  vec3 N = normalize(vN + vec3(0., 1e-4, 0.)), V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  float hair = clamp(vHair, 0., 1.), dist = length(cameraPosition - vWorld), fade = 1. - smoothstep(22., 70., dist);
  vec3 base = vCol, c;
  gSunVis = 1. - .66 * cloudShade(vWorld.xz, uTime);
  if(vHair > -.5){
    // skin at the fine scale: strands running down the coat, clumps across it; fades to the mean before it can shimmer
    // (polish 3) hanging hair with form: locks a hand wide that run down the coat (the 3 cm strand noise sat at the size of
    // a pixel at 10 m and read as speckle), finer strands only within a few metres; every lock is darker at its root, in the
    // shade of the tier above it, and lighter and warmer toward its tip, so the skirt reads as layers of hair
    float fine = 1. - smoothstep(5., 14., dist);
    float st = vnoise(vec2((vObj.z + vObj.x * .7) * 12., vObj.y * 1.5)), st2 = vnoise(vec2((vObj.z - vObj.x * .5) * 37., vObj.y * 3.3));
    float cl = vnoise(vObj.zy * 2.7 + vObj.x * 1.3), shag = step(.5, uShag);
    if(shag > .5 && vHair > .5 && st * (.8 + .2 * fine) + st2 * .2 * fine < (vHair - .5) * 1.6 * fade) discard;
    float tipk = smoothstep(.42, 1., vHair) * step(.4, vHair);
    base *= mix(1., mix(1., .74 + .4 * st + .22 * (st2 - .5) * fine, fade * .9) * (.84 + .32 * cl) * mix(1., mix(.7, 1.22, tipk), step(.4, vHair)), shag);
    base = mix(base, base * vec3(1.12, 1., .86), tipk * shag * .6);
    if(uShag < .5){
      // saiga (polish 3): a short summer coat lying back along the body. The sky's fill on the back is warmed so the back stays
      // cinnamon (it read as a flat grey slab); a harder key gives the barrel form; every back carries a rose rim toward the sun.
      float fadeS = 1. - smoothstep(9., 30., dist);
      float fur = vnoise(vec2(vObj.x * 46. + vObj.y * 23., vObj.z * 11.)) * .6 + vnoise(vec2(vObj.y * 60., vObj.z * 17. + vObj.x * 9.)) * .4;
      base *= mix(1., .78 + .44 * fur, fadeS) * (.9 + .2 * vnoise(vObj.zy * 5. + vObj.x * 3.));
      float ndl = dot(N, uSunDir), wrap = max(0., (ndl + .3) / 1.3);
      vec3 skyW = mix(uSkyCol, vec3(dot(uSkyCol, vec3(.3333))) * vec3(1.1, .97, .84), .62);
      vec3 hemi = mix(uGroundCol * .95, skyW * .7, N.y * .5 + .5) * uFill;
      float back = max(0., -dot(V, uSunDir)), fres = 1. - abs(dot(N, V)); fres *= fres;
      c = base * (uSunCol * wrap * wrap * gSunVis * 1.1 + hemi * (1.75 - .5 * min(wrap, 1.)));
      c += mix(base, vec3(1., .66, .5), .6) * uSunCol * gSunVis * fres * (.1 + 1.1 * back * back) * smoothstep(-.3, .4, N.y) * .5;
      c += base * uSkyCol * fres * .22;
      c *= uExpo * mix(.76, 1., smoothstep(-.8, .05, N.y)); c = min(c, vec3(1.1));   // (polish m4) the rim never clips a back to a pale shape
    } else {
      c = litCoat(base, N, V, hair, .3 + .7 * hair);
      float bk = max(0., -dot(V, uSunDir)), sd = max(0., dot(N, uSunDir));
      c += mix(base, vec3(.95, .6, .36), .55) * uSunCol * gSunVis * hair * hair * (.05 + .3 * bk * bk + .12 * sd);   // lock tips catch the low sun: a lit edge on every tier
      c *= uExpo;
    }
    c = mix(vec3(dot(c, vec3(.3, .55, .15))), c, mix(1., .72, uShag));
    // first snow: a thin broken dusting on the dome and the hump only, the hair showing through it
    // a thin grey-white frosting with feathered edges, the dark hair showing through it as streaks; warm on the sun side, blue in shade
    float sn = vnoise(vObj.xz * 5. + 3.) * .6 + vnoise(vObj.zx * 13. + vObj.y * 4.) * .4;
    float snow = uSnow * step(.5, uShag) * smoothstep(.45, .95, N.y + .2 * cl) * smoothstep(2.42, 2.78, vObj.y + .14 * cl)
      * smoothstep(.28, .7, sn + .2 * (N.y - .7)) * (1. - smoothstep(.25, .7, hair));
    snow *= mix(.75, 1. - .8 * smoothstep(.3, .62, st * .6 + st2 * .4), fade);
    c = mix(c, vec3(.6, .64, .72) * uExpo * .85 * (uSkyCol * .34 + uSunCol * gSunVis * (.08 + .6 * max(dot(N, uSunDir), 0.))), snow * .85);
  } else if(vHair > -1.5){ c = litCoat(base, N, V, 0., .1) * uExpo * .8; }   // bare skin
  else if(vHair > -2.5){   // eye: wet dark ball
    vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.)); float sp = max(dot(N, H), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp; sp *= sp;
    c = vec3(.012, .008, .006) + uSkyCol * .012 * (1. - abs(dot(N, V))) + uSunCol * sp * .4;
  } else if(vHair > -3.5){ c = uSunCol * .45 + vec3(.1); }   // the highlight
  else if(vHair > -4.5){   // ivory: smooth, a soft highlight
    vec3 H = normalize(uSunDir + V + vec3(0., 1e-4, 0.)); float sp = max(dot(N, H), 0.); sp *= sp; sp *= sp; sp *= sp; sp *= sp;
    c = litCoat(base, N, V, 0., .5) * .24 + uSunCol * sp * .2;
  } else {   // saiga horn: translucent amber wax that glows against the sun
    float back = max(0., -dot(V, uSunDir));
    c = base * (uSkyCol * .25 + uSunCol * (.35 + 1.6 * back * back));
  }
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}
`;

// ---------------------------------------------------------------------------------------------------------
// SAIGA. 0.75 m at the shoulder, 1.2 m long. Side silhouette, as fractions of the length: a barrel deepest at the chest
// (0.42 deep at 0.65 of the length) and tucked up at the loin (0.29 at 0.35), a level back, a short neck stepping down to a
// head carried a little below the line of the back, and the nose: a pale swollen bag hanging over the mouth, more than a
// third of the head long and bigger than the skull in front of the eye, nostrils pointing down. Thighs and forearms carry
// muscle, knee and hock show above thin cannon bones. Cinnamon back, cream belly, inner legs and rump patch.
// lod 'near' ~280 triangles, 'mid' ~95, 'far' ~27.
// aAnim = (x: gait phase, y: weight 0 hip .. 1 hoof, z: part 0 body | 1 leg | 2 head | 3 horn (bucks only), w: 0)
export function saigaGeometry(o = {}) {
  const g = new Geo(), near = (o.lod || 'near') === 'near', far = o.lod === 'far', S = near ? 8 : 4;
  const cCoat = C(o.coat || '#C49A62'), cCream = C(o.cream || '#EFE3CC'), cDark = cCoat.clone().multiplyScalar(0.7), cNose = cCoat.clone().lerp(cCream, 0.3), cNostril = C('#6a5646'), cHorn = C(o.horn || '#E0A040'), cHoof = C('#3a2e26');
  // lod 'far' (~45 triangles, for animals under a twentieth of the frame): the same silhouette from fewer rings, a little fuller
  const RB = [
    // (polish 2: a rounder haunch, the loin tucked higher, the chest a hand deeper, so the barrel is no longer an even tube)
    { z: -0.6, y: 0.7, rx: 0, ry: 0 }, { z: -0.55, y: 0.69, rx: 0.105, ry: 0.13 }, { z: -0.4, y: 0.665, rx: 0.165, ry: 0.185 }, { z: -0.2, y: 0.69, rx: 0.143, ry: 0.135 },
    { z: 0.02, y: 0.65, rx: 0.175, ry: 0.175 }, { z: 0.22, y: 0.615, rx: 0.19, ry: 0.225 }, { z: 0.36, y: 0.65, rx: 0.15, ry: 0.19 }, { z: 0.46, y: 0.69, rx: 0.095, ry: 0.13 }, { z: 0.54, y: 0.7, rx: 0.07, ry: 0.092 },
  ];
  const body = g.loft(far ? [
    { z: -0.62, y: 0.67, rx: 0, ry: 0 }, { z: -0.52, y: 0.655, rx: 0.16, ry: 0.18 }, { z: 0.24, y: 0.625, rx: 0.2, ry: 0.22 }, { z: 0.56, y: 0.7, rx: 0.08, ry: 0.1 },
  ] : near ? RB : [RB[0], RB[2], RB[3], RB[5], RB[6], RB[8]], { sides: S, top: cCoat, belly: cCream, shade: [-0.7, -0.12] });   // cream belly; the flank stays cinnamon (higher, it striped the barrel from above)
  g.paint(body, (x, y, z, c) => {
    if (z < -0.36 && y < 0.8) c.lerp(cCream, 0.92);                                   // the rump patch, a hand span of cream
    else if (z < -0.22 && y < 0.72 && Math.abs(x) < 0.12) c.lerp(cCream, 0.7);        // ... running down between the thighs
    else if (y > 0.55 && y < 0.71 && Math.abs(x) > 0.1) c.lerp(cDark, 0.14);         // the flank a step darker than the back
    if (y > 0.74 && z > -0.42 && z < 0.5) c.lerp(cDark, Math.abs(x) < 0.09 ? 0.7 : 0.38);   // a darker saddle over the back, darkest along the spine (polish 3)
    if (z > 0.1 && z < 0.4 && y < 0.62 && Math.abs(x) > 0.08) c.lerp(cDark, 0.18);    // the shoulder's shadow
    if (z > 0.43 && y < 0.6) c.lerp(cCream, 0.45);                                    // pale throat (polish m4: smaller, so the chest stays cinnamon from the front)
  });
  g.glow(body, 0.35);
  // head: short and deep, carried a little below the back; a narrow skull in front of the eye, then the nose: a humped
  // bag that swells above the line of the face and hangs below the mouth
  const h0 = g.n, nz = { top: cNose, belly: cNose };
  if (far) {   // a flat profile is enough under a twentieth of the frame
    g.fan([[0, 0.8, 0.5], [0, 0.6, 0.52], [0, 0.5, 0.9], [0, 0.74, 0.86]], cCoat, cNose);
  } else {
    const head = g.loft([
      { z: 0.52, y: 0.7, rx: 0.068, ry: 0.09 }, { z: 0.62, y: 0.705, rx: 0.08, ry: 0.092 }, { z: 0.7, y: 0.685, rx: 0.062, ry: 0.076 },
      { z: 0.78, y: 0.655, rx: 0.086, ry: 0.115, ...nz }, { z: 0.855, y: 0.612, rx: 0.09, ry: 0.122, ...nz }, { z: 0.91, y: 0.56, rx: 0.062, ry: 0.082, ...nz }, { z: 0.925, y: 0.495, rx: 0, ry: 0, top: cNostril },
    ], { sides: near ? 6 : 3, top: cCoat, belly: cCream, shade: [-0.9, -0.4] });
    g.glow(head, 0.3);
  }
  if (near) for (const sx of [-1, 1]) {
    g.fan([[sx * 0.065, 0.775, 0.585], [sx * 0.175, 0.855, 0.535], [sx * 0.085, 0.75, 0.515]], cCoat, cDark);                       // ear
    const e0 = g.n; g.fan([[sx * 0.077, 0.735, 0.655], [sx * 0.073, 0.712, 0.69], [sx * 0.079, 0.704, 0.65]], C('#0d0907')); g.glow([e0, g.n], -2);   // eye
  }
  if (!far) for (const sx of [-1, 1]) {   // horns: short, upright, ringed, lyre-curved; bucks only
    const r = near ? g.tube([[sx * 0.045, 0.78, 0.6], [sx * 0.09, 0.89, 0.575], [sx * 0.095, 0.99, 0.57], [sx * 0.06, 1.09, 0.59]], [0.034, 0.03, 0.022, 0.005], 3, cHorn, cHorn.clone().lerp(C('#fff0c0'), 0.3))
      : g.fan([[sx * 0.025, 0.78, 0.63], [sx * 0.075, 0.78, 0.57], [sx * 0.07, 1.09, 0.585]], cHorn);
    if (near) g.paint(r, (x, y, z, c, i) => { if (Math.floor((i - r[0]) / 3) % 2 === 1) c.multiplyScalar(0.62); });   // the rings
    g.anim(r, () => [0, 0, 3, 0]); g.pivot(r, sx * 0.04, 0.76, 0.6); g.glow(r, -5);
  }
  if (!far) for (let i = h0; i < g.n; i++) { const y = g.p[i * 3 + 1], z = g.p[i * 3 + 2]; if (g.a[i * 4 + 2] === 0 && y > 0.7 && z > 0.5 && z < 0.74) { g.c[i * 3] *= 0.74; g.c[i * 3 + 1] *= 0.72; g.c[i * 3 + 2] *= 0.7; } }   // (polish m4) darker crown
  for (let i = h0; i < g.n; i++) if (g.a[i * 4 + 2] === 0) { g.a[i * 4 + 2] = 2; g.a[i * 4 + 1] = sat((g.p[i * 3 + 2] - 0.52) / 0.38); }
  // legs: a muscled forearm and thigh, knee and hock, thin cannon bones, small hooves; pivots at shoulder / hip
  const leg = (sx, front, phase) => {
    const x = sx * 0.105, z = front ? 0.3 : -0.37, jy = 0.6;
    const pts = front ? [[x, jy, z], [x, 0.46, z + 0.012], [x, 0.325, z + 0.03], [x, 0.05, z + 0.012], [x, 0, z + 0.035]]
      : [[x * 1.05, jy + 0.03, z], [x * 1.1, 0.47, z - 0.035], [x, 0.335, z - 0.115], [x, 0.05, z - 0.05], [x, 0, z - 0.025]];
    const rr = front ? [0.09, 0.062, 0.037, 0.026, 0.032] : [0.12, 0.088, 0.041, 0.027, 0.032];   // (polish m3) the cannon bones were hairlines at any distance
    const r = near ? g.tube(pts, rr, 3, cCoat, cDark, { flatten: 1.25 })
      : far ? g.strip([[0, jy, z - 0.07], [0, 0, z - 0.03]], [[0, jy, z + 0.07], [0, 0, z + 0.03]], cCoat, cDark)
        : g.strip([pts[0], pts[2], pts[4]].map((q, i) => [q[0], q[1], q[2] - rr[i * 2] * 1.2]), [pts[0], pts[2], pts[4]].map((q, i) => [q[0], q[1], q[2] + rr[i * 2] * 1.2]), cCoat, cDark);
    g.anim(r, (px, py) => [phase, sat((jy - py) / jy), 1, 0]); g.pivot(r, x, jy, z); g.glow(r, 0.2);
    g.paint(r, (px, py, pz, c) => { if (py < 0.04) c.copy(cHoof); else if (py < 0.34) c.lerp(cDark, 0.45); });
  };
  leg(-1, false, 0.0); leg(-1, true, 0.08);
  if (!far) { leg(1, false, 0.5); leg(1, true, 0.58); }   // far off, one pair of legs each end is all that shows
  { const t0 = g.n; g.fan([[0, 0.78, -0.575], [0.028, 0.66, -0.635], [-0.028, 0.66, -0.635]], cDark); g.glow([t0, g.n], 0.4); }   // the short dark tail on the cream rump
  const geo = g.build();
  for (const name of ['position', 'aPivot']) { const at = geo.getAttribute(name); if (at) for (let i = 0; i < at.count; i++) { at.setZ(i, at.getZ(i) * 0.85); at.setY(i, at.getY(i) * 1.03); } }
  geo.computeBoundingSphere(); return geo;
}

// THE FLOW: one function places every saiga. A lane (-1..1 across the stream) and a distance q along it give the arc
// coordinate; the stream is uWidth.x wide where it comes in, fans to uWidth.y along the file, funnels to uWidth.z
// beyond it, and at the file every lane is squeezed into the gap between the two mammoths it would meet, using where
// those mammoths WILL BE when this animal gets there, so no lane ever crosses a mammoth. Exported so the world's
// own far tiers can run on the same streamlines (it needs the uniforms of hero.uniforms: uWalk, uArc, uMam, uLane,
// uWidth, uBull, uRate and #define NM).
// (m7) THE RIVER'S OWN LAW, for whatever stands in it. riverChv is the land shader's braid value at a point (the world's GROUND_FRAG
// draws open water where it is under .36 to .44 and the point lies 6 to 16 m out from the bank circle); barLift is the height of the
// river plain above its datum, baked once at build from the world's own land() (the gravel bars stand up to half a metre proud).
// uRiverW.z = 0 (the default): no river, nothing wades.
export const RIVER_GLSL = /* glsl */`
uniform vec4 uRiverW, uBarBox; uniform sampler2D uBarTex;   // (centre x, centre z, radius of the near bank, y of the bars); (x0, z0, 1/width, 1/depth) of the baked plain
float rvh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float rvn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(rvh(i), rvh(i + vec2(1., 0.)), f.x), mix(rvh(i + vec2(0., 1.)), rvh(i + vec2(1., 1.)), f.x), f.y); }
float riverChv(vec2 p, out float dB){
  dB = length(p - uRiverW.xy) - uRiverW.z;
  float bx = p.x - uRiverW.x, bz = -(p.y - uRiverW.y); if(abs(bz) < 1e-3) bz = 1e-3;
  vec2 rp = vec2(atan(bx, bz) * uRiverW.z, dB);
  float wv = rvn(rp * vec2(.004, .012)) * 2. - 1., wv2 = rvn(rp * vec2(.011, .03) + 7.) * 2. - 1.;
  float ch1 = abs(sin(dB * .047 + wv * 2.6 + wv2 * .9 + rp.x * .004)), ch2 = abs(sin(dB * .027 - rp.x * .019 + wv2 * 2.4 + 1.7)), ch3 = abs(sin(dB * .021 + rp.x * .013 + wv * 3.1 + 4.));
  return min(ch1, min(ch2, ch3) + .1) + .25 * (rvn(rp * vec2(.02, .07)) - .5);
}
// x: 0 on a bar .. 1 in open water; y: 0 at the waterline .. 1 in mid channel; z: metres the plain stands above its datum here
vec3 riverAt(vec2 p){
  if(uRiverW.z <= 0.) return vec3(0.);
  float dB, chv = riverChv(p, dB), out0 = smoothstep(6., 16., dB);
  vec2 uv = (p - uBarBox.xy) * uBarBox.zw;
  float inb = step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.);
  return vec3((1. - smoothstep(.36, .44, chv)) * out0, (1. - smoothstep(.12, .4, chv)) * out0, textureLod(uBarTex, clamp(uv, 0., 1.), 0.).r * .75 * inb);
}
`;
export const SAIGA_FLOW_GLSL = /* glsl */`
uniform vec4 uMam[NM]; uniform vec4 uLane, uBull, uQ, uRepel; uniform vec3 uWidth, uWrap; uniform vec2 uNearFade; uniform float uRate, uFlow;   // uRepel: (a, q, radius, q reach) one more thing the stream bends round (0 radius = none)
float flowAt(float lane, float q, float seed){
  float k1 = smoothstep(-110., -12., q), k2 = smoothstep(6., 38., q), wv = 1.4 * sin(seed * 40.);
  float ac = mix(mix(uLane.x, uLane.y, k1), uLane.z, k2), w = mix(mix(uWidth.x, uWidth.y, k1), uWidth.z, k2);
  float a = ac + lane * w + 1.4 * sin(q * .06 + seed * 40.);
  float A0 = uLane.y + lane * uWidth.y + wv, sh = uWalk - q * uRate;
  float aL = -1e4, aR = 1e4, cL = 0., cR = 0.;
  for(int i = 0; i < NM; i++){ float m = uMam[i].x + sh; if(m <= A0){ if(m > aL){ aL = m; cL = uMam[i].y; } } else if(m < aR){ aR = m; cR = uMam[i].y; } }
  float A1;
  if(aR > 9e3) A1 = A0 + cL * exp(-(A0 - aL) / 5.);
  else if(aL < -9e3) A1 = A0 - cR * exp(-(aR - A0) / 5.);
  else { float lo = aL + cL, hi = aR - cR; A1 = hi > lo ? mix(lo, hi, (A0 - aL) / max(aR - aL, .01)) : (lo + hi) * .5; }
  float g = q / 7.; g *= g; g = 1. / (1. + g * g);
  a += (A1 - A0) * g;
  float d = a - uBull.x, gb = (q - uBull.y) / 6.; gb *= gb; gb = 1. / (1. + gb * gb);
  a += sign(d) * max(0., uBull.z - abs(d)) * gb;
  float d2 = a - uRepel.x, g2 = (q - uRepel.y) / max(uRepel.w, 1.); g2 *= g2; g2 = 1. / (1. + g2 * g2);
  float k2r = max(0., 1. - abs(d2) / max(uRepel.z, .01)); a += (d2 < 0. ? -1. : 1.) * uRepel.z * k2r * k2r * g2 * step(.01, uRepel.z);
  return a;
}
// THE FORDS' LAW (live's own, moved here from the world's FORD_VERT letter for letter so that cards and whole animals run the same lines):
// six fords fanning out over the bars from the foot of the slump, each a loose drift of animals that thins and bunches. x = the lane draw (-1..1).
float fordAt(float x, float q, float seed){
  float ford = (floor(x * 3.) + .5) / 3. + .05 * (fract(seed * 13.3) - .5);                // six fords
  float jit = fract(seed * 5.7) + fract(seed * 91.3) - 1., bunch = .55 + .45 * sin(q * .05 + floor(x * 3.) * 1.7 + seed * 3.);
  float fan = ford * (q - 104.) * .42 + 4. * sin(q * .013 + floor(x * 3.) * 2.1) + 15. * jit * bunch;
  return flowAt(ford, q, seed) + fan;
}
`;
const SAIGA_VERT = /* glsl */`
attribute vec4 aAnim, iA, iB; attribute vec3 aPivot, iTint; attribute float aGlow;
varying vec3 vN, vWorld, vObj, vCol; varying float vHair;
${GLSL_COMMON}
${SAIGA_FLOW_GLSL}
${RIVER_GLSL}
#include <fog_pars_vertex>
void rotX(inout vec3 d, float a){ float c = cos(a), s = sin(a); d.yz = vec2(d.y * c - d.z * s, d.z * c + d.y * s); }
void main(){
  vec3 p = position, n = normal; float part = aAnim.z, w = aAnim.y, seed = iA.w, t = uTime;
  float span = max(uQ.y - uQ.x, 1.), run = uFlow * iB.w + iA.y * span, q = uQ.x + fract((run - uQ.x) / span) * span;
  float lane = uWrap.x + (fract((iA.x - uWrap.x) / max(uWrap.y, .01) + .5) - .5) * uWrap.y;
  float edge = uWrap.y < 1.99 ? 1. - smoothstep(.8, 1., abs(lane - uWrap.x) / max(uWrap.y * .5, .01)) : 1.;
  float cyc = run / 1.8 + seed * 7.;
  // now and then one leaps a metre high to look
  float lp = fract(t * .2 * (.7 + .6 * h11(seed * 3.)) + h11(seed * 5. + 1.)), leap = (lp < .16 && h11(seed * 9. + 2.) > .5) ? sin(lp / .16 * 3.14159) : 0.;
  if(part > .5 && part < 1.5){
    // (polish m3) not clones: two in five bound (fore pair together, hind pair together) while the rest pace; each has its own reach
    float lph = h11(seed * 17. + 4.) > .6 ? (aPivot.z > 0. ? .02 : .47) + (aPivot.x > 0. ? .09 : 0.) : aAnim.x;
    // (m7) a leap that has legs: off the ground the fore pair reaches forward and the hind pair trails back at full length
    // (live tucked the cannon bones up under the belly, .12 m, and a body in the air read as a floating barrel)
    float ph = (cyc + lph) * 6.2832, ang = (.6 + .36 * h11(seed * 13. + 2.)) * sin(ph) * (1. - .8 * leap) + .85 * leap * (aPivot.z > 0. ? -1. : 1.);
    vec3 d = p - aPivot; float lw = smoothstep(.35, 1., w);
    rotX(d, -ang); d.y += lw * .1 * max(cos(ph), 0.) * (1. - leap); d.z -= lw * .1 * max(cos(ph), 0.) * (aPivot.z > 0. ? 1. : -.6);
    p = aPivot + d;
  }
  if(part > 2.5 && iB.x < .5) p = aPivot;                           // does carry no horns
  if(part > 1.5) p.y += w * (.022 * sin(cyc * 12.566 + 1.) + .05 * leap);   // the nose bobs; head up in the leap
  if(part > 1.5) p.y += max(p.z - .43, 0.) * ((h11(seed * 11. + 6.) - .42) * .5 + .08 * sin(cyc * 6.2832 + seed));   // head carried low by one, up by the next
  p.y += (p.z - .05) * (.035 + .04 * h11(seed * 19.)) * sin(cyc * 12.566 + seed * 9.);                                  // the body rocks over its stride
  p.y += .012 * sin(cyc * 12.566) + leap * 1.0;
  rotX(p, -leap * .25 * cos(lp / .16 * 3.14159));
  float a1 = flowAt(lane, q, seed), a2 = flowAt(lane, q + .7, seed);
  vec3 P1 = arcPos(a1, q), P2 = arcPos(a2, q + .7), fw = normalize(P2 - P1 + vec3(0., 0., 1e-5)), rt = normalize(cross(vec3(0., 1., 0.), fw) + vec3(1e-5, 0., 0.));
  fw = normalize(fw + rt * (h11(seed * 23. + 1.) - .5) * .26); rt = normalize(cross(vec3(0., 1., 0.), fw) + vec3(1e-5, 0., 0.)); vec3 up = cross(fw, rt);   // each on its own line
  // (m7) in the river it stands on the plain's true surface (the bars stand up to half a metre proud of the datum) and WADES:
  // a hand deep at the waterline, belly-deep (.46 m of a .6 m leg) in mid channel, so the land's own water hides its legs
  if(q > uBluff.x){ vec3 rv = riverAt(P1.xz); P1.y += rv.z - (.16 + .3 * rv.y) * rv.x * iA.z * (1. - .6 * leap); }
  float vis = step(uQ.z, q) * step(q, uQ.w) * smoothstep(0., 8., q - uQ.x) * smoothstep(0., 8., uQ.y - q) * edge;
  vis *= smoothstep(uNearFade.x, uNearFade.y, distance(cameraPosition, P1));   // a far tier gives way to the full animals near the camera
  vis *= h11(seed * 29. + 3.) < .17 ? .72 : 1.;                               // this year's young run among them
  vec3 obj = P1 + (rt * p.x + up * p.y + fw * p.z) * iA.z * vis;
  vObj = position; vCol = color * iTint; vHair = aGlow;
  vec4 wp = modelMatrix * vec4(obj, 1.); vWorld = wp.xyz;
  vN = normalize(mat3(modelMatrix) * (rt * n.x + up * n.y + fw * n.z));
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;

// LONG SHADOWS: one stretched quad per mammoth, laid on the ground away from the sun (19 body heights at 3 degrees),
// multiplied over whatever is under it. u runs along the body, v up the animal, so the comb of legs, the belly,
// the hump and the dome all read in the shadow. Follows the swell analytically.
const SHADOW_VERT = /* glsl */`
attribute vec4 iA, iB;
varying vec2 vUV, vP; varying float vFade;
${GLSL_COMMON}
uniform vec2 uShadow;   // x: length per metre of height, y: opacity
void main(){
  float sc = iA.z, a = iA.x + uWalk * (1. - iB.w);
  vec3 base = arcPos(a, iA.y), T = arcDir(a, vec3(0., 0., 1.));
  vec2 sh = -uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  float u = position.x, v = position.y, h = v * 3.0 * sc;
  vec3 obj = base + T * (u * 2.6 + .3) * sc + vec3(sh.x, 0., sh.y) * h * uShadow.x;
  float q = length(obj.xz - vec2(0., uArc.x)) - uArc.x;
  obj.y = groundY(q) + .05 + .02 * v;
  vUV = vec2(u, v); vP = obj.xz;
  vec4 wp = modelMatrix * vec4(obj, 1.), mv = viewMatrix * wp;
  vFade = (1. - smoothstep(350., 800., -mv.z)) * uShadow.y;
  gl_Position = projectionMatrix * mv;
}
`;
const SHADOW_FRAG = /* glsl */`
uniform vec3 uShadowCol; uniform float uTime;
varying vec2 vUV, vP; varying float vFade;
${CLOUD_GLSL}
float band(float x, float c, float w, float s){ return 1. - smoothstep(w, w + s, abs(x - c)); }
void main(){
  float u = vUV.x, v = vUV.y, h = v * 3.0, s = .05 + .22 * v;   // penumbra widens with distance from the feet
  float legs = max(max(band(u, -.66, .09, s), band(u, .12, .09, s)), band(u, .73, .05, s) * step(.15, h)) * (1. - smoothstep(1.0, 1.3, h));
  float body = band(u, -.25, .66 - .2 * smoothstep(1.9, 2.7, h), s) * smoothstep(.95, 1.2, h) * (1. - smoothstep(2.1, 2.8, h + .5 * max(0., -u - .25)));
  float hump = band(u, .1, .25, s) * smoothstep(2.0, 2.3, h) * (1. - smoothstep(2.6, 2.85, h));
  float dome = band(u, .5, .15, s) * smoothstep(1.7, 2.0, h) * (1. - smoothstep(2.85, 3.0, h));
  float a = clamp(max(max(legs, body), max(hump, dome)), 0., 1.) * (1. - .55 * v) * vFade * (1. - .9 * cloudShade(vP, uTime));
  a *= smoothstep(0., .04, v) * (1. - smoothstep(.93, 1., v));
  gl_FragColor = vec4(mix(vec3(1.), uShadowCol, a), 1.);
}
`;
// DUST and BREATH: camera-facing soft sprites in one draw. iA = (lane | mammoth a0, q phase | q, size, seed), iB = (kind 0 dust 1 breath, rate, sc, stand)
const PUFF_VERT = /* glsl */`
attribute vec4 iA, iB;
varying vec2 vUV; varying float vAlpha, vBack, vKind;
${GLSL_COMMON}
uniform vec4 uLane, uQ; uniform vec3 uWidth; uniform float uFlow;
#include <fog_pars_vertex>
void main(){
  float seed = iA.w, kind = iB.x, life = fract(uTime * iB.y + seed * 13.7), size, alpha; vec3 c;
  if(kind < .5){   // dust: kicked up where the stream leaves the file, rolling downstream, hanging gold in the light
    float q = mix(3., 24., iA.y) + life * 6., k2 = smoothstep(6., 38., q);   // (kept on the terrace behind the file: over the slump it veiled the fall)
    float a = mix(uLane.y, uLane.z, k2) + iA.x * mix(uWidth.y, uWidth.z, k2) * 1.05 + 3. * sin(seed * 50. + uTime * .1);
    c = arcPos(a, q); c.y += .4 + life * (2.5 + 5. * h11(seed * 3.)) * (.6 + .6 * iA.y) + sin(uTime * .5 + seed * 20.) * .3;
    size = iA.z * (.45 + .9 * life);
    alpha = smoothstep(0., .2, life) * (1. - smoothstep(.55, 1., life)) * uStream * step(uQ.z, q) * step(q - 30., uQ.w);
  } else {         // breath: a faint puff at the mouth every breath
    float sc = iB.z, a = iA.x + uWalk * (1. - iB.w);
    c = arcPos(a, iA.y) + arcDir(a, vec3(0., 1.72 + life * .5, 2.25 + life * .9) * sc);
    size = iA.z * (.3 + 1.1 * life) * sc; alpha = smoothstep(0., .12, life) * (1. - smoothstep(.2, .9, life)) * .5;
  }
  vec4 wp = modelMatrix * vec4(c, 1.), mvPosition = viewMatrix * wp;
  mvPosition.xy += position.xy * size;
  float d = -mvPosition.z;
  alpha *= kind < .5 ? smoothstep(10., 22., d) : smoothstep(1.5, 4., d);
  vec3 V = normalize(cameraPosition - wp.xyz + vec3(0., 1e-4, 0.));
  vBack = max(0., -dot(V, uSunDir)); vUV = position.xy; vAlpha = alpha; vKind = kind;
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const PUFF_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol, uDustCol; uniform float uDustA, uDustLit;   // uDustLit: front light on the dust (day looks, the sun behind the viewer)
varying vec2 vUV; varying float vAlpha, vBack, vKind;
#include <fog_pars_fragment>
void main(){
  float r2 = dot(vUV, vUV); if(r2 > 1.) discard;
  float a = (1. - r2); a *= a * vAlpha * uDustA;
  // gold toward the light, rose-grey away from it; albedo capped so it never clips
  vec3 lit = uDustCol * (uSkyCol * .16 + uSunCol * (.07 + .2 * vBack * vBack + uDustLit));
  vec3 c = min(mix(lit, lit * 1.15 + uSunCol * .02, vKind), vec3(.7));
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}
`;

function blankTex() { const t = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1, THREE.RGBAFormat, THREE.UnsignedByteType); t.needsUpdate = true; return t; }
function instanced(base, count, iA, iB, iTint) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k of Object.keys(base.attributes)) g.setAttribute(k, base.attributes[k]);
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4));
  if (iTint) g.setAttribute('iTint', new THREE.InstancedBufferAttribute(iTint, 3));
  g.instanceCount = count; return g;
}

export async function buildHero(ctx, opts = {}) {
  const rng = ctx.rng, pause = ctx.yield ? () => ctx.yield() : async () => {};
  const pal = (opts.palette && opts.palette.length >= 7 ? opts.palette : DEFAULT_PALETTE).map(C);
  const detail = Math.min(1, Math.max(0.6, opts.detail ?? 1));
  const R = opts.arcRadius ?? 280, WALK = opts.walkSpeed ?? 1.3, RUN = opts.saigaSpeed ?? 11, DUR = opts.duration ?? 40;
  const swell = opts.swell || [0, 30], bluff = opts.bluff || [1e4, 40, 0];   // opts.bluff [q0, run, drop]: the slump ramp the stream falls down
  const group = new THREE.Group(); group.name = 'mammoth-midnight-sun';

  // ---- the cast (all rng draws happen here, in one fixed order)
  const nCalf = opts.calves ?? rng.int(3, 7), nFile = 19, gapAfter = rng.int(10, 13);
  const M = [];   // { a, q, sc, tusk, kind, stand, phase, seed, tint }
  let a = 104;
  for (let i = 0; i < nFile; i++) {
    const matriarch = i === 0, young = !matriarch && rng.chance(0.22);
    const sc = matriarch ? 1.12 : young ? rng.range(0.72, 0.84) : rng.range(0.9, 1.06);
    M.push({ a, q: matriarch ? 0 : rng.range(-0.7, 0.7), sc, tusk: matriarch ? 1.02 : young ? rng.range(0.4, 0.55) : rng.range(0.66, 0.86), kind: matriarch ? 'matriarch' : young ? 'young' : 'cow', stand: 0, phase: rng(), seed: rng() * 10, tint: rng.range(0.8, 1.15), warm: rng.range(0, 1) });
    a -= (i === gapAfter ? 30 : rng.range(8.7, 10.2) * (0.55 + 0.45 * sc));
  }
  const aTailCow = M[M.length - 1].a;
  M.push({ a: aTailCow - 20 - rng.range(0, 3), q: rng.range(-0.5, 0.5), sc: 1.185, tusk: 1.4, kind: 'tailBull', stand: 0, phase: rng(), seed: rng() * 10, tint: 0.9, warm: 0.2 });
  const aHead = M[0].a, aTail = M[M.length - 1].a, aGap = M[gapAfter].a - 15;
  const lane = { up: aHead + 4, mid: aHead - 50, down: aHead - 60 + (opts.rampOffset ?? 0) };
  const bullA = lane.up + 9, bullQ = -(opts.bullDistance ?? 135);
  M.push({ a: bullA, q: bullQ, sc: 1.185, tusk: 1.45, kind: 'loneBull', stand: 1, phase: 0.31, seed: rng() * 10, tint: 1.0, warm: 0.4 });
  // calves: beside their mothers' forelegs, under the tusks; the last one has fallen behind the file and trots to catch up
  const mothers = rng.shuffle(M.filter((m) => m.kind === 'cow').slice()).slice(0, nCalf - 1), CALF = [];
  for (const m of mothers) CALF.push({ a: m.a + rng.range(1.2, 1.9), q: m.q + rng.sign() * rng.range(1.4, 1.65), sc: rng.range(0.46, 0.54), tusk: 0, kind: 'calf', stand: 0, phase: rng(), seed: rng() * 10, tint: rng.range(1.0, 1.3), warm: 0.6 });
  CALF.push({ a: aTailCow - rng.range(8, 10.5), q: rng.range(-1.6, -0.6), sc: 0.5, tusk: 0, kind: 'straggler', stand: 0, phase: rng(), seed: rng() * 10, tint: 1.15, warm: 0.6 });
  const saigaN = Math.round((opts.saiga ?? 330) * (opts.saiga === undefined ? detail : 1)), dustN = Math.round(150 * detail);
  const saigaSeed = rng.fork('saiga'), dustSeed = rng.fork('dust');

  // ---- uniforms shared by every material of the piece
  const sunDir = new THREE.Vector3().fromArray(opts.sunDir || [-0.5, 0.052, -0.866]).normalize();
  const NM = nFile + 2;   // file + tail bull + straggler calf: everything a lane must be squeezed past
  const mam = []; for (const m of [...M.filter((m) => !m.stand), CALF[CALF.length - 1]]) mam.push(new THREE.Vector4(m.a + 0.45 * m.sc, (m.kind === 'straggler' ? 2.0 : 2.6 * m.sc + 0.7), 0, 0));
  const U = {
    uTime: { value: 0 }, uWalk: { value: 0 }, uFlow: { value: 0 }, uStream: { value: 1 }, uRate: { value: WALK / RUN },
    uArc: { value: new THREE.Vector4(R, swell[0], swell[1], 0) }, uBluff: { value: new THREE.Vector4(bluff[0], bluff[1], bluff[2], 0) },
    uSunDir: { value: sunDir }, uSunCol: { value: pal[1].clone().multiplyScalar(opts.sunIntensity ?? 2.2) },
    uSkyCol: { value: pal[2].clone().multiplyScalar(opts.skyIntensity ?? 3.2) }, uGroundCol: { value: C('#C9B48A').multiplyScalar(opts.groundIntensity ?? 2.2) },
    uMam: { value: mam }, uLane: { value: new THREE.Vector4(lane.up, lane.mid, lane.down, 0) }, uWidth: { value: new THREE.Vector3(30, 78, 36) },
    uBull: { value: new THREE.Vector4(bullA + 0.45, bullQ, 4.6, 0) }, uRepel: { value: new THREE.Vector4(0, 0, 0, 10) }, uWrap: { value: new THREE.Vector3(0, 2, 0) }, uNearFade: { value: new THREE.Vector2(-2, -1) }, uSaigaFill: { value: 1 }, uSaigaExpo: { value: 0.23 }, uSnow: { value: 0 }, uCloud: { value: 0 }, uQ: { value: new THREE.Vector4(-52, 36, -1e5, 1e5) },
    uShadow: { value: new THREE.Vector2(Math.min(19, 1 / Math.max(Math.tan(Math.asin(Math.min(1, Math.max(0.02, sunDir.y)))), 0.05)), opts.shadowOpacity ?? 0.5) },
    uShadowCol: { value: C('#6A6E9E').lerp(C('#ffffff'), 0.25) }, uDustCol: { value: pal[1].clone().lerp(pal[0], 0.35) }, uDustA: { value: opts.dust ?? 0.32 }, uDustLit: { value: 0 },
    // (m7) the river's law for whatever wades (RIVER_GLSL): none until the world gives its river (radius 0), a blank plain
    uRiverW: { value: new THREE.Vector4(0, 0, 0, 0) }, uBarBox: { value: new THREE.Vector4(0, 0, 1, 1) }, uBarTex: { value: blankTex() },
  };
  const coatMat = (vert, expo, defs, shag = 1) => new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uExpo: { value: expo }, uShag: { value: shag }, uFill: { value: 1 } }, defines: defs || {},
    vertexShader: vert, fragmentShader: COAT_FRAG, vertexColors: true, fog: true, side: THREE.DoubleSide,
  });
  await pause();

  // ---- mammoths: one adult mesh and one calf mesh, instanced
  const coat = '#' + pal[5].getHexString(), bounds = new THREE.Sphere(new THREE.Vector3(0, 2, 45), 215);
  const fill = (list) => {
    const n = list.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iT = new Float32Array(n * 3);
    list.forEach((m, i) => { iA.set([m.a, m.q, m.sc, m.phase], i * 4); iB.set([m.tusk, 0, m.seed, m.stand], i * 4); iT.set([m.tint * (1 + 0.14 * m.warm), m.tint * (1 + 0.05 * m.warm), m.tint], i * 3); });
    return [n, iA, iB, iT];
  };
  const adultGeo = await mammothGeometryAsync({ coat }, pause); await pause();
  const calfGeo = await mammothGeometryAsync({ coat, calf: true }, pause); await pause();
  const mamMat = coatMat(MAMMOTH_VERT, opts.coatExposure ?? 0.58); mamMat.uniforms.uFill.value = opts.coatFill ?? 1;
  const adults = new THREE.Mesh(instanced(adultGeo, ...fill(M)), mamMat), calves = new THREE.Mesh(instanced(calfGeo, ...fill(CALF)), mamMat);
  for (const m of [adults, calves]) { m.geometry.boundingSphere = bounds; m.frustumCulled = true; group.add(m); }
  await pause();

  // ---- saiga: the near tier that threads the file. makeSaigaTier lets the world add its own tiers on the same flow.
  const tiers = [];
  const makeSaigaTier = (o = {}) => {
    const n = Math.max(1, Math.round(o.count ?? 400)), r = o.rng || saigaSeed, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4), iT = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      // denser toward the head of the file, where the camera turns (bias 1 = even across the stream)
      const l = 1 - 2 * Math.pow(r(), o.bias ?? 1.35); iA.set([l, r(), r.range(0.86, 1.1), r()], i * 4);
      iB.set([r.chance(0.38) ? 1 : 0, 0, 0, r.range(0.94, 1.06)], i * 4);   // x: buck (carries horns), w: its own pace
      const t = r.range(0.82, 1.15); iT.set([t, t * r.range(0.94, 1.03), t * r.range(0.86, 1.0)], i * 3);
    }
    const mat = coatMat(SAIGA_VERT, o.expo ?? 0.23, { NM }, 0.3);
    mat.uniforms.uQ = { value: new THREE.Vector4(o.qFrom ?? -52, o.qTo ?? 36, U.uQ.value.z, U.uQ.value.w) };
    // uWrap (centre lane, lane window, 0): a window narrower than 2 keeps the whole tier in the lanes round that centre
    // (the world slides the centre with the camera; animals leaving one edge come in at the other, faded at both)
    mat.uniforms.uWrap = { value: new THREE.Vector3(0, 2, 0) };
    mat.uniforms.uNearFade = { value: new THREE.Vector2(...(o.nearFade || [-2, -1])) };   // o.nearFade [from, to] m: shrink away inside this distance of the camera
    mat.uniforms.uFill = U.uSaigaFill; if (o.expo === undefined) mat.uniforms.uExpo = U.uSaigaExpo;   // one look for every tier: the world sets these two by mood
    const mesh = new THREE.Mesh(instanced(saigaGeometry({ lod: o.lod || 'near', coat: o.coat, cream: o.cream }), n, iA, iB, iT), mat);
    mesh.geometry.boundingSphere = o.bounds || bounds; tiers.push(mat.uniforms.uQ.value); mesh.userData.uQ = mat.uniforms.uQ.value; mesh.userData.uWrap = mat.uniforms.uWrap.value;
    if (o.shadows !== false) {   // its shadows: mesh.userData.shadow (add it to the same parent)
      const pg = new THREE.PlaneGeometry(2, 1, 1, 2); pg.translate(0, 0.5, 0); const sg = instanced(pg, n, iA, iB); sg.boundingSphere = mesh.geometry.boundingSphere;
      const sm = new THREE.ShaderMaterial({ uniforms: { ...U, uQ: mat.uniforms.uQ, uWrap: mat.uniforms.uWrap, uNearFade: mat.uniforms.uNearFade }, defines: { NM }, vertexShader: SAIGA_SHADOW_VERT, fragmentShader: SAIGA_SHADOW_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      mesh.userData.shadow = new THREE.Mesh(sg, sm); mesh.userData.shadow.renderOrder = 1;
    }
    if (o.wake) {   // (m7) its wakes on the river: mesh.userData.wake (add it to the same parent); two triangles an animal
      const wg0 = new THREE.PlaneGeometry(2, 1); wg0.translate(0, 0.5, 0); const wg = instanced(wg0, n, iA, iB); wg.boundingSphere = mesh.geometry.boundingSphere;
      const wm = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uQ: mat.uniforms.uQ, uWrap: mat.uniforms.uWrap }, defines: { NM }, vertexShader: WAKE_VERT, fragmentShader: WAKE_FRAG,
        transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
      mesh.userData.wake = new THREE.Mesh(wg, wm); mesh.userData.wake.renderOrder = 1.1; mesh.userData.wake.name = 'wakes';
    }
    return mesh;
  };
  const saiga = makeSaigaTier({ count: saigaN, lod: 'near', qFrom: (opts.saigaRange || [-52, 36])[0], qTo: (opts.saigaRange || [-52, 36])[1], wake: !!opts.wakes });
  if (opts.saiga !== 0) { group.add(saiga); if (opts.shadows !== false) group.add(saiga.userData.shadow); if (saiga.userData.wake) group.add(saiga.userData.wake); }
  await pause();

  // ---- long shadows (one draw) and dust + breath (one draw)
  const all = [...M, ...CALF];
  {
    const pg = new THREE.PlaneGeometry(2, 1, 1, 18); pg.translate(0, 0.5, 0);
    const [n, iA, iB] = fill(all), sg = instanced(pg, n, iA, iB); sg.boundingSphere = bounds;
    const sm = new THREE.ShaderMaterial({ uniforms: U, vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    const shadows = new THREE.Mesh(sg, sm); shadows.renderOrder = 1; shadows.name = 'shadows'; if (opts.shadows !== false) group.add(shadows);
  }
  {
    const adultsBreathing = all.filter((m) => m.kind !== 'calf' && m.kind !== 'straggler'), n = dustN + adultsBreathing.length, iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
    for (let i = 0; i < dustN; i++) { iA.set([dustSeed.range(-1, 1), dustSeed(), dustSeed.range(3, 6.5), dustSeed()], i * 4); iB.set([0, dustSeed.range(0.07, 0.13), 0, 0], i * 4); }
    adultsBreathing.forEach((m, k) => { const i = dustN + k; iA.set([m.a, m.q, 0.55, m.seed * 0.1], i * 4); iB.set([1, 0.166 * (0.9 + 0.02 * m.seed), m.sc, m.stand], i * 4); });
    const pg = instanced(new THREE.PlaneGeometry(2, 2), n, iA, iB); pg.boundingSphere = bounds;
    const pm = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U }, vertexShader: PUFF_VERT, fragmentShader: PUFF_FRAG, transparent: true, depthWrite: false, fog: true });
    const puffs = new THREE.Mesh(pg, pm); puffs.renderOrder = 3; puffs.name = 'dust'; group.add(puffs);
  }
  await pause();

  // ---- the terrace under them (optional)
  if (opts.ground !== false) {
    const GR = opts.groundRadius ?? 330, gg = new THREE.PlaneGeometry(GR * 2, GR * 2, 40, 40); gg.rotateX(-Math.PI / 2); gg.translate(0, 0, 40); gg.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 40), GR * 1.5);
    const gm = new THREE.ShaderMaterial({ uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...U, uGroundR: { value: GR }, uLoess: { value: C('#C9B48A') }, uGrass: { value: pal[3].clone() }, uSage: { value: pal[4].clone() }, uPoppy: { value: pal[6].clone() } },
      vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, fog: true });
    const ground = new THREE.Mesh(gg, gm); ground.name = 'ground'; ground.renderOrder = -0.5; group.add(ground);
  }
  await pause();

  // ---- geometry helpers for the world (local space)
  const groundAt = (x, z) => { const q = Math.hypot(x, z - R) - R, w = Math.max(swell[1], 1), k = sat((q - bluff[0]) / Math.max(bluff[1], 1)); return -swell[0] * (1 - Math.exp(-(q * q) / (w * w))) - bluff[2] * k * k * (3 - 2 * k); };
  const arcPoint = (a, q, y = 0, out = new THREE.Vector3()) => { const ph = a / R, rr = R + q; out.set(rr * Math.sin(ph), 0, R - rr * Math.cos(ph)); out.y = groundAt(out.x, out.z) + y; return out; };
  const arcTangent = (a, out = new THREE.Vector3()) => out.set(Math.cos(a / R), 0, Math.sin(a / R));   // the way the file walks
  const walkAt = (u) => WALK * DUR * u;
  const P = (a, q, y) => arcPoint(a, q, y).toArray();
  const wTurn = walkAt(0.36), wTail = walkAt(0.74), aExit = aTail + wTail - 16;
  const exit0 = arcPoint(aExit, -10, 3), exitDir = arcTangent(aExit).multiplyScalar(-1), seat = exit0.clone().addScaledVector(exitDir, 62); seat.y = exit0.y - 7.5;
  const fly = [P(lane.up, -170, 6), P(lane.up, -110, 6), P(lane.up + 2, -60, 6), P(aHead + 9, -30, 5), P(aHead + wTurn - 6, -10, 4.2)];
  for (let x = aHead + wTurn - 30; x > aTail + wTail + 12; x -= 28) fly.push(P(x, -8.5, 4));
  fly.push(P(aTail + wTail, -7.5, 4), exit0.toArray(), seat.toArray());
  const anchors = {
    portalSeat: { position: seat.clone(), facing: exitDir.clone().multiplyScalar(-1), normal: exitDir.clone().multiplyScalar(-1), radius: 7 },
    flyThrough: fly.map((p) => new THREE.Vector3().fromArray(p)),
    matriarch: arcPoint(aHead, 0, 2.9), tailBull: arcPoint(aTail, 0, 3.3), loneBull: arcPoint(bullA, bullQ, 3.3), gap: arcPoint(aGap, 0, 2), fall: arcPoint(lane.down, 60, 0),
    streamIn: [arcPoint(lane.up, -170, 0), arcPoint(lane.up, -20, 0)], sunDir: sunDir.clone(),
    viewpoints: {
      entry: { from: arcPoint(lane.up, -170, 6), to: arcPoint(lane.up + 4, -60, 1.5) },
      matriarch: { from: arcPoint(aHead + wTurn - 5.5, -7, 4), to: arcPoint(aHead + wTurn + 2, 0, 2.2), u: 0.36 },
      file: { from: arcPoint(aHead - 30, -8.5, 4), to: arcPoint(aHead - 75, -1, 2.4), u: 0.5 },
      gap: { from: arcPoint(aGap + walkAt(0.58) + 6, -9, 4), to: arcPoint(lane.down, 60, 2), u: 0.58 },
      tailBull: { from: arcPoint(aTail + wTail + 7, -6.5, 4), to: arcPoint(aTail + wTail, 0, 2.6), u: 0.74 },
    },
    extent: { center: new THREE.Vector3(0, 2, 30), radius: 200 },
  };

  // ---- clocks. Herd time T drives everything that must coincide with the camera: walk = WALK * T, flow = RUN * T.
  let T = 0, prevT = 0, driven = false, uNow = 0, preview = 0, streamK = 1, tail = -1e5, head = 1e5, winSet = false;
  const hero = {
    object: group, radius: 200, height: 6, center: new THREE.Vector3(0, 2, 30), anchors, ground: opts.ground === false, groundY: 0,
    uniforms: U, mammoths: all, counts: { adults: M.length, calves: CALF.length, saiga: saigaN }, NM,
    groundAt, arcPoint, arcTangent, makeSaigaTier, mammothGeometry, saigaGeometry,
    setProgress(u) { driven = true; uNow = Math.min(1, Math.max(0, u)); },
    setHerdTime(s) { driven = true; uNow = s / DUR; },
    setStream(k) { streamK = Math.min(1, Math.max(0, k)); },
    setStreamWindow(tailQ, headQ) { winSet = true; tail = tailQ ?? -1e5; head = headQ ?? 1e5; },
    setLight(l = {}) {
      if (l.sunDir) { sunDir.copy(l.sunDir.isVector3 ? l.sunDir : new THREE.Vector3().fromArray(l.sunDir)).normalize(); U.uShadow.value.x = Math.min(19, 1 / Math.max(Math.tan(Math.asin(Math.min(1, Math.max(0.02, sunDir.y)))), 0.05)); }
      if (l.sunColor) U.uSunCol.value.copy(l.sunColor.isColor ? l.sunColor : C(l.sunColor)).multiplyScalar(l.sunIntensity ?? 1);
      if (l.sky) U.uSkyCol.value.copy(l.sky.isColor ? l.sky : C(l.sky)).multiplyScalar(l.skyIntensity ?? 1);
      if (l.ground) U.uGroundCol.value.copy(l.ground.isColor ? l.ground : C(l.ground)).multiplyScalar(l.groundIntensity ?? 1);
    },
    // where an animal of hero.mammoths is at progress u (local space; add your own height)
    positionAt(m, u = uNow, out = new THREE.Vector3()) { return arcPoint(m.a + (m.stand ? 0 : walkAt(u) + WALK * preview), m.q, 0, out); },
    update(dt, time) {
      dt = Math.min(Math.max(dt || 0, 0), 0.1);
      if (driven) { if (uNow <= 0) preview = Math.min(preview + dt, opts.previewWalk ?? 8); T = uNow * DUR + preview; } else T = time;
      const dT = T - prevT; prevT = T;
      U.uTime.value = time; U.uWalk.value = WALK * T;
      // the saiga never stop: they run on real time while the world waits behind its portal, on herd time once we fly
      if (!driven) { U.uFlow.value = RUN * time; U.uRate.value = WALK / RUN; }
      else {
        U.uFlow.value += RUN * (uNow > 0 ? dT : dt);   // signed: a pose taken twice (the gate steps back through u) shows the same animals in the same places
        const rate = uNow > 0 ? WALK / RUN : (preview < (opts.previewWalk ?? 8) ? WALK / RUN : 0);
        U.uRate.value += (rate - U.uRate.value) * Math.min(1, dt * 2);
      }
      U.uStream.value = streamK;
      U.uQ.value.z = tail; U.uQ.value.w = head; for (let i = 0; i < tiers.length; i++) { tiers[i].z = tail; tiers[i].w = head; }
    },
    dispose() {},
  };

  // ---- part-viewer framing: the true extent is anchors.extent; by default the viewer orbits the head of the file
  // (the matriarch where the stream splits). opts.focus or ?focus= picks another: close | file | gap | tail | bull | calf | all.
  let focus = opts.focus; try { focus = focus || new URLSearchParams(globalThis.location?.search || '').get('focus'); } catch (e) { /* no page */ }
  const w12 = WALK * 12, mom = mothers[0] || M[1];
  const views = {
    head: [arcPoint(aHead + w12 - 2.5, 0, 2.3), 4.6, 5], close: [arcPoint(aHead + w12 + 0.5, 0, 2.2), 3.2, 4], face: [arcPoint(aHead + w12 + 1.6, 0, 2.2), 0.01, 3], file: [arcPoint(aHead + w12 - 45, 0, 2), 26, 7],
    gap: [arcPoint(aGap + w12, 0, 2), 22, 7], tail: [arcPoint(aTail + w12, 0, 2.4), 5, 5], bull: [arcPoint(bullA, bullQ, 2.4), 5, 5],
    calf: [arcPoint(mom.a + w12 + 1, mom.q, 1.6), 3.4, 4], all: [anchors.extent.center, 95, 30],
  };
  const v = views[focus] || views.head;
  hero.center = v[0].clone(); hero.radius = v[1]; hero.height = v[2];
  hero.update(0, 0);
  return hero;
}

// THE TERRACE under the meeting (optional: opts.ground = false when the world lays its own): loess netted with frost
// polygons 13 m wide (greener sedge in the troughs), cracked bare silt between fescue bunches and sage cushions,
// specks of poppy and pasqueflower, the trail the file has trodden and the lanes the saiga have beaten.
const GROUND_VERT = /* glsl */`
varying vec3 vWorld, vObj; varying float vQ;
${GLSL_COMMON}
#include <fog_pars_vertex>
void main(){
  vec3 obj = position; float q = length(obj.xz - vec2(0., uArc.x)) - uArc.x; obj.y = groundY(q); vQ = q; vObj = obj;
  vec4 wp = modelMatrix * vec4(obj, 1.); vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const GROUND_FRAG = /* glsl */`
uniform vec3 uSunDir, uSunCol, uSkyCol, uLoess, uGrass, uSage, uPoppy; uniform vec4 uArc, uLane; uniform vec3 uWidth; uniform float uGroundR;
varying vec3 vWorld, vObj; varying float vQ;
#include <fog_pars_fragment>
float gh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 gh2(vec2 p){ return fract(sin(vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)))) * 43758.5453); }
float gn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(gh(i), gh(i + vec2(1., 0.)), f.x), mix(gh(i + vec2(0., 1.)), gh(i + vec2(1., 1.)), f.x), f.y); }
vec3 voro(vec2 x){   // x: distance to the nearest cell edge, y: cell id, z: distance to the cell centre
  vec2 n = floor(x), f = fract(x), mg = vec2(0.), mr = vec2(0.); float md = 8.;
  for(int j = -1; j <= 1; j++) for(int i = -1; i <= 1; i++){ vec2 g = vec2(float(i), float(j)), o = gh2(n + g) * .7 + .15, r = g + o - f; float d = dot(r, r); if(d < md){ md = d; mr = r; mg = g; } }
  float ed = 8.;
  for(int j = -2; j <= 2; j++) for(int i = -2; i <= 2; i++){ vec2 g = mg + vec2(float(i), float(j)), o = gh2(n + g) * .7 + .15, r = g + o - f; vec2 dr = r - mr; float l2 = dot(dr, dr); if(l2 > 1e-5) ed = min(ed, dot(.5 * (mr + r), dr / sqrt(l2))); }
  return vec3(ed, gh(n + mg), sqrt(md));
}
void main(){
  vec2 p = vObj.xz; float dist = length(cameraPosition - vWorld), near = 1. - smoothstep(30., 140., dist), mid = 1. - smoothstep(120., 420., dist);
  vec3 V = normalize(cameraPosition - vWorld + vec3(0., 1e-4, 0.));
  vec3 poly = voro(p / 13.5 + .3 * vec2(gn(p * .05), gn(p * .05 + 7.)));
  float trough = 1. - smoothstep(.03, .11, poly.x);
  float n1 = gn(p * .9), n2 = gn(p * 3.7 + 11.), n3 = gn(p * .13 + 3.);
  // bunches: fescue tufts a metre apart with bare cracked loess between; sage cushions in drifts
  vec3 tv = voro(p * 1.25 + 5. + .25 * vec2(n2, gn(p * 3.1))); float tn = gn(p * 2.3) * .45 + gn(p * 5.9 + 3.) * .33 + gn(p * 13. + 9.) * .22; float tuft = smoothstep(.5, .6, tn) * (.6 + .4 * gn(p * 23.));
  float sage = smoothstep(.62, .7, gn(p * 2.9 + 31.) * .6 + gn(p * 8.1 + 5.) * .4) * smoothstep(.45, .6, n3) * (1. - tuft);
  vec3 cv = voro(p * 1.3 + 40. + .5 * vec2(n2, n1)); float crack = (1. - smoothstep(.0, .035, cv.x)) * near * smoothstep(.3, .6, n1) * .6;
  vec3 c = uLoess * (.8 + .3 * n3 + .12 * n1) * (1. - .35 * crack);
  vec3 grass = mix(uGrass, uLoess, .25) * (.55 + .5 * n2 + .5 * tv.y * tuft) * mix(vec3(1.), vec3(.75, 1.05, .7), trough);
  float cover = mix(.5 + .25 * trough, tuft * (.85 + .15 * n2) + trough * .45, near);
  c = mix(c, grass, clamp(cover, 0., 1.));
  c = mix(c, mix(uSage, uGrass, .4) * (.5 + .3 * n2), sage * mix(.4, .85, near));
  c *= 1. - .22 * trough;
  // flowers: tiny bright specks, poppies yellow, pasqueflowers violet, only up close
  vec3 fv = voro(p * 2.9 + 90.); float fl = (1. - smoothstep(.03, .07, fv.z)) * near * step(.72, fv.y) * (1. - sage);
  c = mix(c, fv.y > .9 ? vec3(.3, .14, .5) : uPoppy, fl);
  // the trodden trail along the file and the beaten lanes of the stream
  float trail = (1. - smoothstep(1.2, 3.6, abs(vQ))) * (.6 + .4 * n1);
  float dz = uArc.x - p.y; if(abs(dz) < 1e-3) dz = 1e-3; float ang = atan(p.x, dz), a = ang * uArc.x;
  float k1 = smoothstep(-110., -12., vQ), k2 = smoothstep(6., 38., vQ), ac = mix(mix(uLane.x, uLane.y, k1), uLane.z, k2), w = mix(mix(uWidth.x, uWidth.y, k1), uWidth.z, k2);
  float ln = (a - ac) / max(w, 1.), inS = 1. - smoothstep(.85, 1.1, abs(ln));
  float beaten = inS * (.35 + .4 * gn(vec2(ln * 46., vQ * .05)) ) * mid;
  c = mix(c, uLoess * .62, trail * .55);
  c = mix(c, uLoess * (.95 + .2 * n2), beaten * .6);
  // light: the level sun barely touches the flat ground, the sky does the work; grass tips and dust glow toward the sun
  float back = max(0., -dot(V, uSunDir)), graze = 1. - abs(V.y);
  vec3 lit = c * (uSkyCol * .34 + uSunCol * (.16 + .5 * back * back * graze * graze));
  lit += uSunCol * uGrass * tuft * near * .08 * back;
  gl_FragColor = vec4(lit, 1.);
  float edge = 1. - smoothstep(uGroundR * .72, uGroundR * .98, length(p - vec2(0., 40.)));
  if(edge < gh(gl_FragCoord.xy * .37)) discard;
  #include <fog_fragment>
}
`;

// saiga shadows: one thin stretched quad per animal on the same flow, so the stream combs the plain too
const SAIGA_SHADOW_VERT = /* glsl */`
attribute vec4 iA, iB;
varying vec2 vUV, vP; varying float vFade; varying vec3 vFoot;
${GLSL_COMMON}
${SAIGA_FLOW_GLSL}
${RIVER_GLSL}
uniform vec2 uShadow;
void main(){
  float seed = iA.w, span = max(uQ.y - uQ.x, 1.), run = uFlow * iB.w + iA.y * span, q = uQ.x + fract((run - uQ.x) / span) * span;
  float lane = uWrap.x + (fract((iA.x - uWrap.x) / max(uWrap.y, .01) + .5) - .5) * uWrap.y;
  float edge = uWrap.y < 1.99 ? 1. - smoothstep(.8, 1., abs(lane - uWrap.x) / max(uWrap.y * .5, .01)) : 1.;
  float a1 = flowAt(lane, q, seed), a2 = flowAt(lane, q + .7, seed);
  vec3 P1 = arcPos(a1, q), P2 = arcPos(a2, q + .7), fw = normalize(P2 - P1 + vec3(0., 0., 1e-5));
  vec2 sh = -uSunDir.xz / max(length(uSunDir.xz), 1e-3);
  // (m7) the same leap as the animal's own (SAIGA_VERT): while it is in the air its shadow leaves its feet, thrown by the height
  float lp = fract(uTime * .2 * (.7 + .6 * h11(seed * 3.)) + h11(seed * 5. + 1.)), leap = (lp < .16 && h11(seed * 9. + 2.) > .5) ? sin(lp / .16 * 3.14159) : 0.;
  vec3 rv = q > uBluff.x ? riverAt(P1.xz) : vec3(0.);
  float vis = step(uQ.z, q) * step(q, uQ.w) * smoothstep(0., 8., q - uQ.x) * smoothstep(0., 8., uQ.y - q) * edge;
  vis *= smoothstep(uNearFade.x, uNearFade.y, distance(cameraPosition, P1));
  float u = position.x, v = position.y;
  // the body's footprint (1.2 m by 0.38 m) seen along the light, then thrown one animal's height times the shadow length:
  // as wide as the body whichever way the animal runs against the sun (never a hairline)
  vec3 S3 = vec3(sh.x, 0., sh.y), P3 = vec3(-sh.y, 0., sh.x);
  float wAc = .2 + .42 * abs(dot(fw, P3)), lAl = .2 + .42 * abs(dot(fw, S3));
  float onRamp = smoothstep(uBluff.x - 4., uBluff.x + 8., q) * (1. - smoothstep(uBluff.x + uBluff.y - 6., uBluff.x + uBluff.y + 6., q)), slope = 1. - .6 * onRamp;   // on the slump a shadow falls short: one compact shape under each animal
  // (m7) on water a wader throws no long shadow: a short dark mirror under its body is all (its wake says the rest)
  float thrw = .78 * min(uShadow.x, 4.2) * slope * (1. - .8 * rv.x), total = 2. * lAl + .2 + thrw;
  vec3 obj = P1 + (P3 * u * wAc * 1.2 + S3 * (-lAl - .1 + v * total + leap * thrw)) * iA.z * vis;
  float qq = length(obj.xz - vec2(0., uArc.x)) - uArc.x; obj.y = groundY(qq) + .04 + (qq > uBluff.x ? riverAt(obj.xz).z : 0.);
  vUV = vec2(u, v); vP = obj.xz; vFoot = vec3((lAl + .1) / total, (lAl + .1) / total, leap);   // where the body stands along the quad, its half-length there, how far off the ground
  vec4 mv = viewMatrix * modelMatrix * vec4(obj, 1.);
  vFade = (1. - smoothstep(200., 500., -mv.z)) * uShadow.y * vis * (1. - .6 * smoothstep(12., 40., q) * (1. - .55 * onRamp));   // (polish m4) on the slump each compact shadow keeps its full depth, so no animal floats   // where the stream packs into the ribbon its shadows overlap many deep: lighter there
  gl_Position = projectionMatrix * mv;
}
`;
const SAIGA_SHADOW_FRAG = /* glsl */`
uniform vec3 uShadowCol; uniform vec2 uShadow; uniform float uTime;
varying vec2 vUV, vP; varying float vFade; varying vec3 vFoot;
${CLOUD_GLSL}
void main(){
  // (m7) A SHADOW THAT TOUCHES THE FEET. Live drew one soft blob whose dark middle lay half-way along the throw, a metre and
  // more from the animal, fading to nothing where the hooves stand ('detached dark blob shadows, pasted on'). Now the darkest
  // part is the body's own footprint under the belly, and the throw runs on from it away from the sun, narrowing a little and
  // paling along its length. In a leap the footprint goes with the body's shadow, off along the throw, and softens.
  float u = clamp(vUV.x, -1., 1.), v = clamp(vUV.y, 0., 1.), v0 = clamp(vFoot.x, .02, .98), vh = max(vFoot.y, .02), lp = clamp(vFoot.z, 0., 1.);
  float dv = (v - v0) / vh, core = 1. - smoothstep(.5, 1., u * u + dv * dv);
  float tv = clamp((v - v0) / max(1. - v0, .02), 0., 1.), wd = u / mix(1., .72, tv);
  float lng = smoothstep(3., 12., uShadow.x);   // very long shadows overlap many deep: each one lighter along its length
  float thrown = (1. - smoothstep(.55, 1., wd * wd)) * step(v0, v) * (1. - smoothstep(.55, 1., tv)) * mix(1., .78, lng) * (1. - mix(.3, .7, lng) * v);   // (Mend 1) as dark as live's along its length (live's own two factors)
  float a = max(core * (1. - .35 * lp), thrown) * (1. - .3 * lp) * vFade * (1. - .9 * cloudShade(vP, uTime));
  gl_FragColor = vec4(mix(vec3(1.), uShadowCol, clamp(a, 0., 1.)), 1.);
}
`;
// (m7) WAKES: one quad per animal of a tier that crosses the river, lying on the water behind it along its own run. Only where the
// river's law says open water: two foam lines spreading from the chest, the churned water between them, a little spray thrown up at
// the forelegs. On a bar it has no size. u across (-1..1), v from the chest (0) back to the wake's end (1); both clamped before use.
const WAKE_VERT = /* glsl */`
attribute vec4 iA, iB;
varying vec2 vUV; varying float vFade, vSeed, vRun;
${GLSL_COMMON}
${SAIGA_FLOW_GLSL}
${RIVER_GLSL}
#include <fog_pars_vertex>
void main(){
  float seed = iA.w, span = max(uQ.y - uQ.x, 1.), run = uFlow * iB.w + iA.y * span, q = uQ.x + fract((run - uQ.x) / span) * span;
  float lane = uWrap.x + (fract((iA.x - uWrap.x) / max(uWrap.y, .01) + .5) - .5) * uWrap.y;
  float edge = uWrap.y < 1.99 ? 1. - smoothstep(.8, 1., abs(lane - uWrap.x) / max(uWrap.y * .5, .01)) : 1.;
  float a1 = flowAt(lane, q, seed), a2 = flowAt(lane, q + .7, seed);
  vec3 P1 = arcPos(a1, q), P2 = arcPos(a2, q + .7), fw = normalize(P2 - P1 + vec3(0., 0., 1e-5)), rt = normalize(cross(vec3(0., 1., 0.), fw) + vec3(1e-5, 0., 0.));
  vec3 rv = q > uBluff.x ? riverAt(P1.xz) : vec3(0.);
  float vis = step(uQ.z, q) * step(q, uQ.w) * smoothstep(0., 8., q - uQ.x) * smoothstep(0., 8., uQ.y - q) * edge * rv.x;
  float u = position.x, v = position.y;                                   // the plane is 2 wide, 1 long
  vec3 obj = P1 + (rt * u * (.5 + .45 * v) + fw * (.75 - v * (2.6 + 1.6 * rv.y))) * iA.z * step(.02, vis);
  obj.y = P1.y + rv.z + .05;
  vUV = vec2(u, v); vSeed = seed; vRun = run;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(obj, 1.);
  float eyeD = length(mvPosition.xyz);   // (Mend 2) the straight distance from the eye in metres (before: the depth along the gaze)
  vFade = vis * (1. - .6 * smoothstep(25., 90., eyeD)) * (1. - smoothstep(140., 320., eyeD));   // (Mend 1) a wake is a thing of the near distance: its foam lines are a hand to a forearm wide, narrower than the body that makes them: from 25 m off they are under half a degree across and weaken (to two fifths by 90 m), and from 140 to 320 m, where a foam line is under a tenth of a degree, they go, or the pale streaks outweigh the bodies they trail
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}
`;
const WAKE_FRAG = /* glsl */`
uniform vec3 uSunCol, uSkyCol; uniform float uTime;
varying vec2 vUV; varying float vFade, vSeed, vRun;
#include <fog_pars_fragment>
float wkh(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wkn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f); return mix(mix(wkh(i), wkh(i + vec2(1., 0.)), f.x), mix(wkh(i + vec2(0., 1.)), wkh(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  float u = clamp(vUV.x, -1., 1.), v = clamp(vUV.y, 0., 1.), au = abs(u);
  float n = wkn(vec2(u * 3.1 + vSeed * 40., v * 7. + vRun * .9)), n2 = wkn(vec2(u * 9. + vSeed * 9., v * 19. + vRun * 2.3));
  float arm = 1. - smoothstep(.0, .2 + .12 * n, abs(au - (.3 + .55 * v)));                        // the two foam lines, spreading
  float churn = (1. - smoothstep(.2, .34 + .5 * v, au)) * smoothstep(.45, .75, n * .6 + n2 * .4);     // broken water between them
  float spray = (1. - smoothstep(.0, .26, v)) * (1. - smoothstep(.3, .9, au)) * smoothstep(.5, .8, n2);   // thrown up at the forelegs
  float a = clamp(max(max(arm * (.5 + .5 * n2), churn * .7), spray), 0., 1.) * (1. - smoothstep(.5, 1., v)) * smoothstep(0., .05, v) * (1. - smoothstep(.85, 1., au)) * clamp(vFade, 0., 1.);
  if(a < .01) discard;
  vec3 c = uSkyCol * .26 + uSunCol * (.2 + .14 * spray);   // pale foam in this light: under the water's own glitter, over its body
  gl_FragColor = vec4(c, a * .66);
  #include <fog_fragment>
}
`;
