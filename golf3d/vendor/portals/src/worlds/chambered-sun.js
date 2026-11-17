// The Chambered Sun: inside a seashell the size of a moon, grown round a small sun. We fly outward from the
// bright heart through round door after round door into pearl chambers that double in size, each with country
// growing all the way round its walls, and out of the mouth to a ring held in a pearl cradle against the stars.
//
// The shell itself (chambers, domes, sun, ribs, shafts, cataract bells, cradle) is the hero part. This file adds
// the flight, the real country round the lake pass (tree-ferns, terraces, villages, reeds, boats), the cloud
// river, egrets, seed parachutes, showers, the star sky, and the seeded variations.
// Coordinates are the hero's: sun at the origin, axis +Z, phi from the bottom toward +X.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero, SHELL_LIGHT } from '../parts/chambered-sun.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);

// ---------------------------------------------------------------- seeded variations
const NACRE = {
  ivory: ['#F3E9E2', '#E8B7C4', '#9FD8C6'],
  black: ['#8F8D9E', '#4FA596', '#86E0BC'],
  honey: ['#F1DCAE', '#F2B58A', '#C6E2B4'],
};
function pickVariation(ctx) {
  const r = ctx.rng.fork ? ctx.rng.fork('chambered-vary') : ctx.rng;
  const hour = ctx.vary?.hour || 'any';
  let season = r.pick(['summer', 'summer', 'blossom', 'harvest']);
  let weather = r.pick(['clear', 'heavy', 'still']);
  let nacre = r.pick(['ivory', 'ivory', 'black', 'honey']);
  const cast = r.pick(['egret', 'egret', 'ibis']);
  const regatta = r.chance(0.2);
  const boats = regatta ? 40 : r.int(8, 20);
  const sail = r.pick(['#EFE6D2', '#FAF7F0', '#F0DDB4']);
  if (hour === 'dawn') season = 'blossom';
  if (hour === 'golden') { season = 'harvest'; nacre = 'honey'; }
  if (hour === 'night') nacre = 'black';
  if (hour === 'day') { nacre = 'ivory'; weather = weather === 'heavy' ? 'clear' : weather; }
  const n = NACRE[nacre];
  const palette = [n[0], n[1], n[2], '#FFE6A3', season === 'harvest' ? '#A58C3A' : '#3F8F6A', '#5B4A78', '#0A0C1E'];
  return { season, weather, nacre, cast, regatta, boats, sail, palette, rare: !!ctx.vary?.rare,
    density: clamp(ctx.vary?.density ?? 1, 0.7, 1.3), detail: clamp(ctx.quality?.detail ?? 1, 0.6, 1) };
}

// A stream of random numbers of its own, begun with exactly one draw of the stream it is given. Four builders deal
// from one each, so that however many draws one of them takes, what is built after it is dealt the same: the lake's
// boats ('lake-boats'), the lake's villages ('lake-villages'), the harbour ('harbour') and the cloud deck ('cloud-deck').
function ownStream(rng, label) {
  if (rng.fork) return rng.fork(label);
  let a = Math.floor(rng() * 4294967296) >>> 0;
  const r = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  r.range = (lo, hi) => lo + (hi - lo) * r(); r.chance = (q) => r() < q; r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  return r;
}

// height of the harbour's rim above its water at angle th (in the harbour's frame): 30 m, swelling to 37 m where the spire grows out of it (the same in HB_GLSL)
const hbRimAt = (th, towerAng) => { let d = th - towerAng; d = Math.atan2(Math.sin(d), Math.cos(d)); return 30 * (1 + 0.24 * Math.exp(-d * d * 8)); };

// Where the harbour stands in the last room: a pearl bowl of blue-green water, 430 m across, grown on a stalk from
// the wall. Across the room it is seated 116 m off the axis and 20 degrees round from straight below it (world coordinates)
// so that its water lies under the route's climb across the room, 40 to 75 m beneath our line: typed design numbers of the harbour. Along the axis there is no number for z:
// it stands as far toward the mouth as the spur lets it, its rim one rim's height (30 m) short of the sunward face
// of the spur's swan neck (the hero's anchor spur.neckReach).
// Its up is the line from its centre to the axis, as every treetop's is in this world: water, masts, ferns, houses,
// washing and the spire all share it, and since the camera never rolls the harbour is seen tilted.
// Frame: origin at the centre of the water, Y its up, Z along the shell's axis, X across (toward its higher rim).
function harbourPlace(A) {
  const ang = 20 * DEG, off = 116, RW = 150, RR = 215, RIM = 30;
  const c = V3(off * Math.sin(ang), -off * Math.cos(ang), A.spur.neckReach - RR - RIM);
  const Y = V3(-c.x, -c.y, 0).normalize(), Z = V3(0, 0, 1), X = new THREE.Vector3().crossVectors(Y, Z);
  const world = (x, y, z, out = new THREE.Vector3()) => out.copy(c).addScaledVector(X, x).addScaledVector(Y, y).addScaledVector(Z, z);
  const local = (q, out = new THREE.Vector3()) => { const dx = q.x - c.x, dy = q.y - c.y, dz = q.z - c.z; return out.set(dx * X.x + dy * X.y, dx * Y.x + dy * Y.y, dz); };
  const towerAng = 72 * DEG, towerR = 201.5, tl = [towerR * Math.cos(towerAng), towerR * Math.sin(towerAng)];
  // the spire: grown from the rim on the mouthward side, parallel to the bowl's up, its tip 42 m short of the axis's height
  const headH = hbRimAt(towerAng, towerAng), towerH = off - 42;
  return { c, off, RW, RR, X, Y, Z, world, local, towerAng, tl, headH, towerH, towerFoot: world(tl[0], headH, tl[1]), towerTip: world(tl[0], towerH, tl[1]) };
}

// ---------------------------------------------------------------- the flight
// Returns the path and the u of its named places (found from the built curve, not guessed).
async function buildFlight(A, ctx) {
  const w = (z, phiDeg, lift) => A.wall(2, z, phiDeg * DEG, lift).position;
  const pts = [
    V3(170, 6, -232), V3(156, 5, -172), V3(142, 3, -112), V3(124, 1, -48), V3(98, 0, 22), V3(60, 0, 100), V3(20, 0, 165), V3(0, 0, 218),   // in beside the sun, round it, onto the axis
    V3(0, -3, 262),                                                                                  // through door 1
    V3(-52, -40, 322), V3(-128, -118, 392), V3(-168, -205, 462), V3(-140, -282, 528),                   // bank right and dive
    w(585, -6, 22), w(628, 4, 22), w(672, 15, 22), w(712, 26, 19), w(748, 36, 16), w(782, 45, 17),   // over the lake and up the wall
    V3(206, -176, 850), V3(114, -88, 931), V3(38, -10, 1005), V3(26, 22, 1090), V3(25, 30, 1200),    // peel off, climb through the shaft, door 2
    V3(75, -5, 1310), V3(185, -125, 1410), V3(240, -250, 1530),                                        // chamber 3: down under the cloud, low over the land
    V3(150, -240, 1760), V3(14, -90, 2010), V3(-20, -30, 2228),                                   // up to door 3, through it close by its lower rim
  ];
  // The last room, blue with distance. Out to the -X side of the axis and up, the harbour (a pearl bowl of blue-green
  // water on a stalk, tilted so that its up points at the axis, a spire on its mouthward rim) standing across the room
  // in the shaft; back down and in over its low rim, across its lagoon along the slope of its water and out over its
  // high rim past the spire; a wide bend on the +X side of the room, the mouth of stars and the spur before us; then
  // onto the axis and dead straight and level along the beaded spur to the ring between its horns.
  const RING = A.portalSeat.position, FW = A.portalSeat.forward;
  pts.push(V3(-112, -28, 2450), V3(-320, 46, 2545), V3(-490, 90, 2650), V3(-556, 34, 2764),
    V3(-446, -70, 2854), V3(-282, -100, 2892), V3(-130, -102, 2925), V3(-14, -86, 2995),
    V3(68, -42, 3078), V3(160, -6, 3152), V3(262, 16, 3214), V3(330, 32, 3284), V3(334, 34, 3354), V3(272, 26, 3414), V3(188, 14, 3462), V3(80, 4, 3500), V3(18, 0, 3528),
    V3(0, 0, 3560), V3(0, 0, 3660), V3(0, 0, 3760), V3(0, 0, 3860), RING.clone());
  const path = makePath(pts, { samples: 640 });
  await ctx.yield();
  const p = new THREE.Vector3();
  const uAtZ = (z) => { let lo = 0, hi = 0.7;      // z rises all along the flight
    for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; path.pointAt(m, p); if (p.z < z) lo = m; else hi = m; } return (lo + hi) / 2; };
  const U = {};
  for (const [k, z] of [['door1', 222], ['lake0', 585], ['boat', 650], ['lake1', 748], ['terr', 782], ['shaft2', 900], ['door2', 1022],
    ['sink', 1400], ['flock2', 1560], ['door3', 2222]]) { U[k] = uAtZ(z); await ctx.yield(); }
  // pace: linger beside the sun and over the lake, hurry through the two day rooms, ease through the last room to the ring
  const pace = (u) => {
    let s = 0.5 + 0.55 * smoothstep(U.door1 - 0.02, U.door1 + 0.02, u);
    s -= 0.5 * smoothstep(U.lake0 - 0.035, U.lake0 - 0.005, u) * (1 - smoothstep(U.terr, U.terr + 0.03, u));
    s += 0.4 * smoothstep(U.door2 - 0.03, U.door2 + 0.03, u) * (1 - smoothstep(U.door3 - 0.04, U.door3 + 0.05, u));
    return s;
  };
  // More places, each found from the built curve: where the route does something, or passes something.
  const MC = A.mouth.center, LIP_R = A.mouth.radius + 34;
  const least = (u0, u1, f) => { let bu = u0, bv = Infinity; for (let i = 0; i <= 600; i++) { const u = lerp(u0, u1, i / 600); const v = f(path.pointAt(u, p)); if (v < bv) { bv = v; bu = u; } } return bu; };
  const first = (u0, u1, f) => { for (let i = 0; i <= 1200; i++) { const u = lerp(u0, u1, i / 1200); if (f(path.pointAt(u, p))) return u; } return u1; };
  U.sunA = uAtZ(-60); U.sunB = uAtZ(60);                                 // abreast of the sun's near limb, and of its far limb
  U.axis1 = first(U.sunB, U.door1, (q) => Math.hypot(q.x, q.y) < 20);    // onto the axis before door 1
  U.swing = least(U.door1, U.lake0, (q) => q.x);                         // the outermost point of the dive, where it swings back left
  U.crest = least(U.door2, U.sink, (q) => -q.y);                         // the top of the climb through door 2
  U.low = least(U.sink, U.door3, (q) => q.y);                            // the lowest point of the pass under the cloud of chamber 3
  await ctx.yield();
  // The last room's own places (none of them depends on the harbour), and the harbour's seat (harbourPlace).
  U.top = least(U.door3, 1, (q) => -q.y);                                // the top of the climb out beside the room
  U.dip = least(U.top, 1, (q) => q.y);                                   // the low point of the pass back across the room
  U.bend = least(U.dip, 1, (q) => -Math.hypot(q.x, q.y));                // the far point of the bend, on the left of the room
  const H = harbourPlace(A);
  await ctx.yield();
  const _l = new THREE.Vector3(), hbPlan = (x, z) => (q) => { H.local(q, _l); return Math.hypot(_l.x - x, _l.z - z); };      // distance across the harbour's own plan
  U.rimIn = first(U.top, 1, (q) => hbPlan(0, 0)(q) < H.RR);              // in over the harbour's rim
  U.wide = least(U.top, U.rimIn, (q) => -Math.hypot(q.x, q.y));          // the far point of that swing, where we turn back toward the harbour
  U.lagoon = least(U.rimIn, 1, hbPlan(0, 0));                            // over the lagoon's middle
  U.tower = least(U.lagoon, 1, hbPlan(H.tl[0], H.tl[1]));                // past the spire
  U.rimOut = first(U.lagoon, 1, (q) => hbPlan(0, 0)(q) > H.RR);          // out over the harbour's high rim
  U.axis = first(U.bend, 1, (q) => Math.hypot(q.x, q.y) < 2);            // onto the axis: the last straight
  { let bv = Infinity; const q2 = new THREE.Vector3();                   // the middle of the turn onto the spur: where the route heads most squarely across the room
    for (let i = 0; i <= 200; i++) { const u = lerp(U.bend, U.axis, i / 200); path.tangentAt(u, q2); if (q2.x < bv) { bv = q2.x; U.turn = u; } } }
  await ctx.yield();
  // ---- the gaze: one smooth look direction for every u, handed to the engine as a single point of interest.
  // It starts from a long look-ahead (so bends swing it slowly) and leans toward each subject through a window whose
  // ends are places on the route; a later row leans from where the earlier rows have left the look.
  const L = path.length, ring = RING;
  const bendAt = path.pointAt(U.bend, new THREE.Vector3()), thB = Math.atan2(bendAt.y, bendAt.x);
  const lipAt = (th) => V3(MC.x + LIP_R * Math.cos(th), MC.y + LIP_R * Math.sin(th), MC.z);
  const SPIRE = H.world(H.tl[0], (H.headH + H.towerH) / 2, H.tl[1]);      // the harbour's spire, halfway up it
  const LIP_TOP = lipAt(Math.PI / 2);                                    // the crown of the mouth's lip
  const LIP_ARCH = lipAt(thB + 0.75 * Math.PI);                          // the lip across the mouth from the bend and halfway up to its top
  const SUBJ = [   // [target, in from, in to, out from, out to, weight]
    [V3(46, 0, 40), -1, -0.5, U.sunA, U.sunB, 0.62],                      // beside the sun: the sun and the first door side by side, until we have passed it
    [V3(0, 0, 222), U.sunA, U.sunB, U.sunB, U.axis1, 0.6],                // door 1 in its dome, as we pass the sun and ease onto the axis
    [V3(0, -40, 1010), U.sunB, U.axis1, U.door1, U.swing, 0.6],           // through door 1: dome 2 and its ring of country
    [A.wall(2, 690, 16 * DEG, 0).position, U.door1, U.swing, U.boat, U.lake1, 0.7],   // the lake climbing the wall, from the dive to the middle of the lake
    [V3(0, 0, 1010), U.lake1, U.terr, U.shaft2, U.door2, 0.55],           // dome 2 and its door, from the terraces up through the shaft
    [V3(0, 0, 2222), U.door2, U.crest, U.sink, U.flock2, 0.5],            // chamber 3 opens: dome 3 and its door, until we sink under the cloud
    [V3(330, -170, 2150), U.sink, U.flock2, U.low, U.door3, 0.62],        // low over the land: dome 3's face standing over us on our side
    [MC, U.low, U.door3, U.door3, U.top, 0.9],                             // up to door 3 and through it: the mouth of stars, the ring a pale star in it
  ];
  const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _g = new THREE.Vector3(), _a = new THREE.Vector3(), _s = new THREE.Vector3(), _t = new THREE.Vector3();
  // The last room. At each place below the look is a blend of named things as they stand from that place: the harbour
  // tilted on its stalk under the axis; its spire; the mouth of stars and the crown of its pearl lip, with the blue
  // country behind; the ring between its horns, and the lip arching over the spur. Between the places the look turns
  // from one to the next along a smooth curve through those directions, so it slows only where it turns round. Never back to the door.
  const NK = [   // [place, [thing, share], ...]
    [U.door3, [MC, 1]],
    [U.top, [H.c, 0.6], [MC, 0.4]],
    [U.wide, [H.c, 0.7], [SPIRE, 0.3]],
    [U.rimIn, [SPIRE, 0.45], [MC, 0.35], [LIP_TOP, 0.2]],
    [U.lagoon, [MC, 0.55], [SPIRE, 0.2], [LIP_TOP, 0.25]],
    [U.rimOut, [ring, 0.6], [LIP_TOP, 0.2], [LIP_ARCH, 0.2]],
    [U.bend, [ring, 0.25], [LIP_ARCH, 0.75]],
    [U.turn, [ring, 0.4], [LIP_ARCH, 0.6]],
    [U.axis, [ring, 1]],
  ];
  const NU = NK.map((k) => k[0]), ND = NK.map(([u, ...ws]) => { path.pointAt(u, _p); const d = new THREE.Vector3();
    for (const [at, w] of ws) d.addScaledVector(_q.copy(at).sub(_p).normalize(), w); return d.normalize(); });
  NU.push(1.02); ND.push(FW.clone());                                    // at the ring: straight through it
  const NM = ND.map((d, i) => { const a = Math.max(0, i - 1), b = Math.min(ND.length - 1, i + 1); return ND[b].clone().sub(ND[a]).multiplyScalar(i >= ND.length - 2 ? 0 : 1 / (NU[b] - NU[a])); });      // (it comes to rest on the ring as we come onto the axis)
  const lastRoom = (u, out) => { let i = 0; while (i < NU.length - 2 && u > NU[i + 1]) i++;
    const dl = NU[i + 1] - NU[i], t = clamp((u - NU[i]) / dl, 0, 1), t2 = t * t, t3 = t2 * t;
    return out.copy(ND[i]).multiplyScalar(2 * t3 - 3 * t2 + 1).addScaledVector(NM[i], (t3 - 2 * t2 + t) * dl).addScaledVector(ND[i + 1], -2 * t3 + 3 * t2).addScaledVector(NM[i + 1], (t3 - t2) * dl).normalize(); };
  const gaze1 = (u, out) => {
    path.pointAt(u, _p); path.posAtDist(u * L + 150, out).sub(_p).normalize();
    for (const [at, i0, i1, o0, o1, wt] of SUBJ) {
      const k = wt * smoothstep(i0, i1, u) * (1 - smoothstep(o0, o1, u)); if (k <= 0) continue;
      _q.copy(at).sub(_p).normalize(); out.multiplyScalar(1 - k).addScaledVector(_q, k).normalize();
    }
    const kw = smoothstep(U.door3, U.top, u);
    if (kw > 0) out.multiplyScalar(1 - kw).addScaledVector(lastRoom(u, _q), kw).normalize();
    return out;
  };
  // Calm: the look direction is tabled every 0.0025 of u and relaxed until no two rows turn by more than 1.8 degrees
  // (7 degrees per 0.01 of u); a bend of the route or a change of subject is spread over as much of the flight as it needs.
  const GN = 400, G = new Float32Array((GN + 1) * 3), LIM = Math.cos(1.8 * DEG), LIM2 = Math.cos(1.81 * DEG);
  for (let i = 0; i <= GN; i++) { gaze1(i / GN, _s); G[i * 3] = _s.x; G[i * 3 + 1] = _s.y; G[i * 3 + 2] = _s.z; if (i % 20 === 19) await ctx.yield(); }
  let relaxed = 0;
  for (let it = 0; it < 900; it++) {
    let bad = 0; relaxed = it;
    for (let i = 1; i < GN; i++) {
      const a = (i - 1) * 3, b = i * 3, c = (i + 1) * 3;
      const d0 = G[a] * G[b] + G[a + 1] * G[b + 1] + G[a + 2] * G[b + 2], d1 = G[c] * G[b] + G[c + 1] * G[b + 1] + G[c + 2] * G[b + 2];
      if (d0 > LIM && d1 > LIM) continue;
      if (d0 <= LIM2 || d1 <= LIM2) bad++;                                       // (a row resting exactly on the limit is not a reason to go round again)
      for (let j = Math.max(1, i - 3); j <= Math.min(GN - 1, i + 3); j++) {       // ease this row and its neighbours toward the mean of theirs
        const q = j * 3; let x = G[q - 3] + G[q + 3] + 2 * G[q], y = G[q - 2] + G[q + 4] + 2 * G[q + 1], z = G[q - 1] + G[q + 5] + 2 * G[q + 2];
        const il = 1 / (Math.hypot(x, y, z) || 1); G[q] = x * il; G[q + 1] = y * il; G[q + 2] = z * il;
      }
    }
    if (!bad) break;
    if (it % 5 === 4) await ctx.yield();
  }
  // Rests: the relaxed look is a saw of full-speed pans; rounding its teeth (three box blurs, each over 0.02 of u, the
  // whole flight from door 1 on) lets the look come to rest on a subject at each turn-round and move off again gently.
  { const T = new Float32Array(G.length);
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 0; i <= GN; i++) { let x = 0, y = 0, z = 0;
        for (let j = -4; j <= 4; j++) { const q = clamp(i + j, 0, GN) * 3; x += G[q]; y += G[q + 1]; z += G[q + 2]; }
        const u = i / GN, m = smoothstep(U.sunB, U.door1, u), il = 1 / (Math.hypot(x, y, z) || 1);
        T[i * 3] = lerp(G[i * 3], x * il, m); T[i * 3 + 1] = lerp(G[i * 3 + 1], y * il, m); T[i * 3 + 2] = lerp(G[i * 3 + 2], z * il, m); }
      for (let i = 0; i <= GN; i++) { const q = i * 3, il = 1 / (Math.hypot(T[q], T[q + 1], T[q + 2]) || 1); G[q] = T[q] * il; G[q + 1] = T[q + 1] * il; G[q + 2] = T[q + 2] * il; }
      await ctx.yield();
    } }
  const gazeDir = (u, out) => { const f = clamp(u, 0, 1) * GN, i = Math.min(GN - 1, Math.floor(f)), t = f - i, q = i * 3;
    return out.set(lerp(G[q], G[q + 3], t), lerp(G[q + 1], G[q + 4], t), lerp(G[q + 2], G[q + 5], t)).normalize(); };
  // the engine blends its own 60 m look-ahead `a` with the point of interest `p`: (1 - k) a + k p. Solve p so that the blend points along the gaze.
  const POI_W = 0.92;
  const gazeAt = (time, u) => {
    gazeDir(u, _g); path.pointAt(u, _p); path.posAtDist(u * L + 60, _a).sub(_p).normalize();
    const k = POI_W * smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u)), c = _g.dot(_a);
    const lam = (1 - k) * c + Math.sqrt(Math.max(0, k * k - (1 - k) * (1 - k) * (1 - c * c)));
    _t.copy(_g).multiplyScalar(lam).addScaledVector(_a, -(1 - k));
    if (_t.lengthSq() < 1e-8) _t.copy(_g);
    return _t.normalize().multiplyScalar(1000).add(_p);
  };
  const pois = [{ at: gazeAt, from: -1, to: 2, weight: POI_W }];
  U.relaxed = relaxed;
  return { path, U, H, pace, uAtZ, pois, gazeDir, marks: { lipArch: LIP_ARCH.toArray(), lipTop: LIP_TOP.toArray(), spire: SPIRE.toArray() } };
}

// ---------------------------------------------------------------- the sky in the mouth: indigo and hard stars
function buildSky(S) {
  const mat = new THREE.ShaderMaterial({
    uniforms: { uInk: { value: new THREE.Color(S.V.palette[6]) }, uTime: { value: 0 } }, side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = position; vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_Position = p; }`,
    fragmentShader: /* glsl */`
uniform vec3 uInk; uniform float uTime; varying vec3 vDir;
float h13(vec3 p){ p = fract(p * vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.x + p.y) * p.z); }
void main(){
  vec3 d = normalize(vDir + vec3(0., 1e-4, 0.));
  vec3 c = uInk * (.55 + .5 * smoothstep(-.6, .7, d.y)) + vec3(.012, .016, .04) * smoothstep(.2, 1., d.z);
  float bd = dot(d, normalize(vec3(.55, .8, -.25))) * 3.2; float band = exp(-bd * bd);          // a river of faint stars across the dark
  float pxd = max(fwidth(d.x), max(fwidth(d.y), fwidth(d.z)));          // one pixel, as a change of direction
  vec3 di = floor(d * 420.);
  float dust = h13(di) * h13(floor(d * 260.) + 4.) * (.60 + .03 * sin(uTime * (1.2 + 2.5 * h13(di + 2.)) + h13(di + 9.) * 40.));
  c += band * (vec3(.05, .06, .11) + vec3(.5, .55, .75) * smoothstep(.72, 1., dust) * .5);
  for (int k = 0; k < 3; k++) {
    float sc = k == 0 ? 46. : k == 1 ? 90. : 170.;
    vec3 q = d * sc, id = floor(q), f = q - id - .5;
    float h = h13(id + float(k) * 17.), on = step(k == 0 ? .88 : .80, h);
    vec3 o = (vec3(h13(id + 3.1), h13(id + 7.7), h13(id + 11.3)) - .5) * .5;
    float r = length(f - o), w = max(k == 0 ? .085 : k == 1 ? .10 : .14, 1.25 * pxd * sc);      // never under a pixel and a quarter across
    float w0 = k == 0 ? .085 : k == 1 ? .10 : .14, dim = k == 0 ? max(.5, w0 / w) : (w0 * w0) / (w * w);      // small stars spread over a pixel keep their light, not their size
    float b = dim * on * (1. - smoothstep(w * .4, w, r)) * (k == 0 ? 5. : k == 1 ? 2.4 : 1.1) * (.4 + h13(id + 5.5)) * (.68 + .03 * sin(uTime * (1.4 + 3. * h13(id + 1.3)) + h * 60.));
    c += b * mix(vec3(.75, .84, 1.), vec3(1., .9, .74), h13(id + 9.9));
  }
  gl_FragColor = vec4(c, 1.);
}`,
  });
  const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(8200, 4), mat);
  sky.renderOrder = -1; sky.frustumCulled = false; sky.name = 'stars';
  S.scene.add(sky);
  S.onUpdate.push((dt, time, camera) => { sky.position.setFromMatrixPosition(camera.matrixWorld); mat.uniforms.uTime.value = time; });
}

// ---------------------------------------------------------------- shared GLSL for things that stand on the wall
// "Down" is away from the axis. An instance stores its seat on the wall (iPos) and iRot = (yaw, scale, seed, kind).
// Local geometry: x = side, y = up (toward the axis), z = forward (the axis turned by yaw about up).
const WALL_FRAME = /* glsl */`
attribute vec3 iPos; attribute vec4 iRot;
vec3 wUp, wFwd, wSide;
void wallFrame(){
  wUp = normalize(vec3(-iPos.xy, 0.) + vec3(0., 1e-4, 0.));             // rho is never under 100 m
  vec3 tang = vec3(-wUp.y, wUp.x, 0.);
  float cy = cos(iRot.x), sy = sin(iRot.x);
  wFwd = vec3(0., 0., 1.) * cy + tang * sy;
  wSide = tang * cy - vec3(0., 0., 1.) * sy;
}
vec3 wallPoint(vec3 l){ return iPos + (wSide * l.x + wUp * l.y + wFwd * l.z) * iRot.y; }
vec3 wallDir(vec3 l){ return wSide * l.x + wUp * l.y + wFwd * l.z; }
`;

// ---------------------------------------------------------------- the world
export default {
  id: 'chambered-sun',
  name: 'The Chambered Sun',
  category: 'alien',
  weirdness: 0.65,
  media: ['air', 'interior'],
  async build(ctx) {
    const V = pickVariation(ctx);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0A0C1E');
    const hero = await buildHero(ctx, { palette: V.palette, detail: V.detail, season: V.season === 'blossom' ? 'blossom' : 'summer', view: 'country' });
    scene.add(hero.object);
    await ctx.yield();
    const A = hero.anchors;
    const flight = await buildFlight(A, ctx);
    await ctx.yield();
    const S = { ctx, scene, hero, A, V, H: flight.H, path: flight.path, U: flight.U, uAtZ: flight.uAtZ, gazeDir: flight.gazeDir, subjects: {}, sh: hero.uniforms, onUpdate: [], onDispose: [], patch: [],
      rng: ctx.rng.fork ? ctx.rng.fork('chambered-world') : ctx.rng };
    hero.setHaze(V.weather === 'heavy' ? 1700 : V.weather === 'still' ? 2500 : 2100);
    S.subjects.tower = S.H.towerTip.toArray(); S.subjects.harbour = S.H.c.toArray();
    S.subjects.spurTop = A.spur.top.toArray(); S.subjects.spurRoot = A.spur.root.toArray(); Object.assign(S.subjects, flight.marks);
    buildSky(S);
    await ctx.yield();
    for (const step of BUILDERS) { await step(S); await ctx.yield(); }

    const P = A.parts, U = S.U, renderer = ctx.renderer;
    const res = new THREE.Vector2();
    return {
      scene,
      path: S.path,
      duration: 50,
      pace: flight.pace,
      camera: { fov: 68, near: 0.5, far: 9000, lookAhead: 60, sway: 0.5, bank: 0.6 },
      pois: flight.pois, subjects: S.subjects,
      U,
      portal: { shape: 'circle', radius: A.portalSeat.radius, color: '#DFF5EC', glow: 1, revealDistance: 1500 },
      post: { exposure: 1, bloom: { strength: 0.36, radius: 0.72, threshold: 1.0 },
        grade: { saturation: 1.06, contrast: 1.04, tint: '#fff9f0', shadowTint: '#0b0a1c', vignette: 0.28, grain: 0.02 } },
      ride: 'none',
      update(dt, time, camera, u) {
        hero.update(dt, time, camera);
        const cz = hero.uniforms.uCam.value.z;
        const auto = 0.47 + 0.43 * smoothstep(40, 420, cz) + 0.1 * smoothstep(1000, 1500, cz) + 0.15 * smoothstep(2200, 2900, cz);      // 0.6 beside the sun to 1.15 in the last room
        const dip = smoothstep(U.terr, U.shaft2 + 0.01, u) * (1 - smoothstep(U.door2 - 0.005, U.door2 + 0.02, u));
        hero.setExposure(auto * (1 - 0.2 * dip)); hero.uniforms.uExpo.value = auto * (1 - 0.2 * dip);
        // pieces behind us are hidden by progress (all built and compiled; only visibility changes)
        const early = u < U.door2;
        P.chambers[0].visible = P.ribs.visible = early;      // chamber 1 and its ribs
        const patchOn = u < U.door2 + 0.05;
        for (const m of S.patch) m.visible = patchOn;
        renderer.getDrawingBufferSize(res);
        for (const f of S.onUpdate) f(dt, time, camera, u, res);
      },
      dispose() { for (const f of S.onDispose) f(); hero.dispose(); },
    };
  },
};

const BUILDERS = [];

// ---------------------------------------------------------------- the painted map of chamber 2, read back in JS
// The hero paints the country from a 256 px noise tile; sampling the same tile here lets real ferns stand in the
// painted forest and real houses in the painted towns. Mirrors COUNTRY_FRAG (chamber 2: uCirc = TAU * 360, uN1 = 1).
function makeLand(S) {
  const img = S.sh.uNoise.value.image, N = img.width, data = img.data;
  const tex = (u, v, c) => {
    let x = (u - Math.floor(u)) * N - 0.5, y = (v - Math.floor(v)) * N - 0.5;
    const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    const X0 = (x0 + N) % N, X1 = (x0 + 1 + N) % N, Y0 = (y0 + N) % N, Y1 = (y0 + 1 + N) % N;
    const a = data[(Y0 * N + X0) * 4 + c], b = data[(Y0 * N + X1) * 4 + c], d = data[(Y1 * N + X0) * 4 + c], e = data[(Y1 * N + X1) * 4 + c];
    return ((a + (b - a) * fx) * (1 - fy) + (d + (e - d) * fx) * fy) / 255;
  };
  const CIRC = TAU * 360, r2 = (z) => { const t = clamp((z - 120) / 848, 0, 1); return 360 * (0.94 + 0.06 * Math.sin(Math.PI * Math.min(1, t * 1.15))); };
  const arc = [0]; for (let i = 1; i <= 40; i++) { const z0 = 120 + 848 * (i - 1) / 40, z1 = 120 + 848 * i / 40; arc.push(arc[i - 1] + Math.hypot(z1 - z0, r2(z1) - r2(z0))); }
  const sAt = (z) => { const t = clamp((z - 120) / 848, 0, 1) * 40, i = Math.min(39, Math.floor(t)); return lerp(arc[i], arc[i + 1], t - i); };
  // phi in radians (-PI..PI), z in metres -> what is painted there
  const R = { h: 0, lakeD: 0, ter: false, terFix: false, forest: false, water: false, town: false, river: false };
  const at = (z, phi) => {
    const ux = phi / TAU, uy = sAt(z) / CIRC;
    let h = 0.68 * tex(ux, uy, 0) + 0.32 * tex(ux * 3 + 0.37, uy * 3 + 0.11, 1);
    const lx = Math.abs(phi * 345 - 69) - 100, lz = Math.abs(z - 650) - 70;
    const lakeD = Math.hypot(Math.max(lx, 0), Math.max(lz, 0)) + Math.min(Math.max(lx, lz), 0) - 60 + (tex(ux * 4, uy * 4, 3) - 0.5) * 46;
    h = lerp(h, 0.2, 1 - smoothstep(0, 60, lakeD));
    const terFix = Math.abs(phi * 345 - 301) < 78 && Math.abs(z - 650) < 150;
    const ter = terFix || (h > 0.70 && h < 0.80);
    const forest = !ter && tex(ux * 2 + 0.6, uy * 2 + 0.2, 3) + 0.3 * (h - 0.5) > 0.565;
    const water = lakeD < 3 || h < 0.315;
    const town = !forest && !water && !ter && h > 0.36 && tex(ux * 5 + 0.5, uy * 5 + 0.3, 1) > 0.81;
    const rv = tex(ux + 0.13, uy + 0.71, 2) + 0.08 * tex(ux * 6, uy * 6, 3);
    R.h = h; R.lakeD = lakeD; R.ter = ter; R.terFix = terFix; R.forest = forest; R.water = water; R.town = town; R.river = Math.abs(rv - 0.5) < 0.012;
    return R;                                                // one shared record: read it before the next call
  };
  // the lake's box alone (no shoreline noise): a cheap bound on lakeD, within 23 m of it
  const lakeBox = (z, phi) => { const lx = Math.abs(phi * 345 - 69) - 100, lz = Math.abs(z - 650) - 70; return Math.hypot(Math.max(lx, 0), Math.max(lz, 0)) + Math.min(Math.max(lx, lz), 0) - 60; };
  S.land = { at, r2, sAt, lakeBox };
}
BUILDERS.push(async (S) => { makeLand(S); });

// instanced geometry helper: base geometry + iPos / iRot (+ optional extra vec4)
function instanced(base, pos, rot, extra) {
  const g = new THREE.InstancedBufferGeometry();
  g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
  g.setAttribute('iPos', new THREE.InstancedBufferAttribute(new Float32Array(pos), 3));
  g.setAttribute('iRot', new THREE.InstancedBufferAttribute(new Float32Array(rot), 4));
  if (extra) g.setAttribute('iEx', new THREE.InstancedBufferAttribute(new Float32Array(extra), 4));
  g.instanceCount = pos.length / 3;
  return g;
}
// material lit like the shell (chamber uCh), with fog chunks; frag gets SHELL_LIGHT prepended
function shellMat(S, vert, frag, own = {}, extra = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...S.sh, ...own },
    vertexShader: vert, fragmentShader: SHELL_LIGHT + frag, fog: true, ...extra,
  });
}

// ---------------------------------------------------------------- tree-ferns
// A ringed trunk, a crown of eight arching fronds and pale fiddleheads at the centre. 12 m tall at scale 1.
function fernGeometry(lod) {
  const P = [], Nn = [], UV = [], K = [], I = [];
  const v = (x, y, z, nx, ny, nz, u, w, part, bend) => { P.push(x, y, z); Nn.push(nx, ny, nz); UV.push(u, w); K.push(part, bend); return P.length / 3 - 1; };
  const H = 9.2, sides = lod === 0 ? 6 : lod === 1 ? 4 : 3, rings = lod === 0 ? 3 : 1;
  for (let j = 0; j <= rings; j++) for (let i = 0; i <= sides; i++) {       // trunk
    const a = i / sides * TAU, t = j / rings, r = lerp(0.62, 0.34, t) + (j === 0 ? 0.25 : 0);
    v(Math.cos(a) * r, t * H, Math.sin(a) * r, Math.cos(a), 0.1, Math.sin(a), i / sides, t * H, 0, t * t * 0.25);
  }
  for (let j = 0; j < rings; j++) for (let i = 0; i < sides; i++) { const a = j * (sides + 1) + i, b = a + 1, c = a + sides + 1, d = c + 1; I.push(a, c, b, b, c, d); }
  const fronds = lod === 2 ? 4 : 8, segs = lod === 0 ? 5 : lod === 1 ? 2 : 1, Lf = 6.2;
  for (let f = 0; f < fronds; f++) {
    const a = (f + 0.5 * (f % 2) * 0.3) / fronds * TAU, ca = Math.cos(a), sa = Math.sin(a), lift = 0.75 + 0.5 * ((f * 7) % 5) / 4;
    const row = [];
    for (let s = 0; s <= segs; s++) {
      const t = s / segs, r = 0.2 + Lf * (t - 0.18 * t * t), y = H + 2.3 * lift * Math.sin(t * 2.0) - 3.4 * t * t;
      const wd = (lod === 2 ? 2.0 : 1.25) * Math.pow(Math.sin(Math.PI * (0.1 + 0.88 * t)), 0.7) * (s === segs ? 0.12 : 1);
      const dy = 2.3 * lift * 2.0 * Math.cos(t * 2.0) - 6.8 * t, dr = Lf * (1 - 0.36 * t), il = 1 / Math.hypot(dy, dr);
      const nx = -dy * il * ca, ny = dr * il, nz = -dy * il * sa, sag = wd * 0.32;
      const c = v(ca * r, y, sa * r, nx, ny, nz, 0, t, 1, t);
      const l = v(ca * r - sa * wd, y - sag, sa * r + ca * wd, nx - sa * 0.5, ny, nz + ca * 0.5, -1, t, 1, t);
      const rr = v(ca * r + sa * wd, y - sag, sa * r - ca * wd, nx + sa * 0.5, ny, nz - ca * 0.5, 1, t, 1, t);
      row.push([c, l, rr]);
    }
    for (let s = 0; s < segs; s++) { const [c0, l0, r0] = row[s], [c1, l1, r1] = row[s + 1]; I.push(c0, l0, c1, l0, l1, c1, c0, c1, r0, r0, c1, r1); }
  }
  if (lod < 2) for (let f = 0; f < 3; f++) {                                 // fiddleheads: pale curled shoots
    const a = f / 3 * TAU + 0.5, ca = Math.cos(a), sa = Math.sin(a), b = v(ca * 0.25, H, sa * 0.25, ca, 0.6, sa, 0, 0, 2, 0.3);
    const m = v(ca * 0.7, H + 1.5, sa * 0.7, ca, 0.6, sa, 1, 0.5, 2, 0.4), t2 = v(ca * 0.35 - sa * 0.45, H + 2.1, sa * 0.35 + ca * 0.45, ca, 0.6, sa, 0, 1, 2, 0.5);
    const b2 = v(-sa * 0.3 + ca * 0.1, H, ca * 0.3 + sa * 0.1, ca, 0.6, sa, 1, 0, 2, 0.3);
    I.push(b, b2, m, b2, t2, m);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2));
  g.setIndex(I);
  return g;
}

const FERN_VERT = /* glsl */`
${WALL_FRAME}
attribute vec2 aK; uniform float uTime;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  wallFrame();
  float ph = iRot.z * 40. + uTime * (1.1 + .5 * fract(iRot.z * 7.));
  float sw = aK.y * (sin(ph + position.y * .35) * .55 + sin(ph * 2.3 + position.x) * .2);       // the wind blows down-shell
  vec3 p = wallPoint(position) + (vec3(0., 0., 1.) * (sw + aK.y * .6) + wUp * (sin(ph * 1.7 + position.z) * .3 * aK.y)) * iRot.y;
  vP = p; vN = wallDir(normal); vUv = uv; vK = vec3(aK.x, iRot.z, iRot.w);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const FERN_FRAG = /* glsl */`
varying vec3 vK; uniform float uBlossom;
void main(){
  float d = length(uCam - vP), teeth = 1. - smoothstep(50., 150., d);
  vec3 col;
  if (vK.x < .5) {
    col = mix(uViolet, uGold, .4) * .5 * (.84 + .16 * sin(vUv.y * 5.));
  } else if (vK.x < 1.5) {
    if (abs(vUv.x) > 1. - .55 * teeth * step(.5, fract(vUv.y * 15.))) discard;
    float rib = 1. - smoothstep(0., .14, abs(vUv.x));
    float pin = .8 + .2 * sin(vUv.y * 47. + abs(vUv.x) * 8.);
    vec3 g0 = uForest * vec3(.74, .98, .80), g1 = mix(uForest, uGold, .5) * vec3(.80, 1.05, .56);
    col = mix(g0 * .66, g1, smoothstep(.05, 1., vUv.y)) * mix(1., pin, teeth) * (.82 + .36 * fract(vK.y * 31.));
    col = mix(col, col * .5, rib * .6);
    float bl = uBlossom * step(.45, fract(vK.y * 13.7));
    col = mix(col, mix(uRose, vec3(.95, .9, .9), fract(vK.y * 5.3)) * .82, bl * (.35 + .65 * vUv.y));
  } else col = mix(uGold, uForest, .25) * 1.15;
  vec3 up = normalize(vec3(-vP.xy, 0.) + vec3(0., 1e-4, 0.));
  vec3 n = normalize(vN + up * .9 + vec3(0., 1e-4, 0.));
  vec3 lit = shellLight(vP, n, 1., 1., 1.);
  float ao = vK.x < .5 ? 1. - .45 * smoothstep(3., 8.5, vUv.y) : .7 + .3 * smoothstep(0., .5, vUv.y);
  vec3 c = col * lit * ao;
  // light through the fronds when we look toward the sun
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.)), toSun = normalize(-vP + vec3(0., 0., 1e-3));
  float back = clamp(-dot(V, toSun), 0., 1.);
  c += col * keyColor(1.) * sunVis(vP, 1.) * back * back * .5 * step(.5, vK.x);
  c = hazed(c, vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// nearest distance from a point to the stretch of the route inside chamber 2 (the route taken every 3 m of its length)
function makeNear(S) {
  const pts = [], p = new THREE.Vector3(), L = S.path.length, d1 = S.uAtZ(1000) * L;
  for (let d = S.uAtZ(240) * L; d <= d1; d += 3) { S.path.posAtDist(d, p); pts.push(p.x, p.y, p.z); }
  S.near2 = (x, y, z) => { let b = 1e9; for (let i = 0; i < pts.length; i += 3) { const dx = pts[i] - x, dy = pts[i + 1] - y, dz = pts[i + 2] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
}

BUILDERS.push(async (S) => {
  makeNear(S);
  const { ctx, rng, V, land } = S, k = V.detail * V.density;
  const sets = [{ pos: [], rot: [], cap: 620 }, { pos: [], rot: [], cap: Math.round(2300 * Math.min(1, k)) }, { pos: [], rot: [], cap: Math.round(5200 * Math.min(1, k)) }];
  S.fernTops = [];                                                      // crowns near the path: where seeds lift off
  let n = 0;
  for (let z = 292; z < 962; z += 6.5) {
    for (let a = -470; a < 640; a += 6.5) {
      if (++n % 100 === 0) await ctx.yield();
      const zz = z + rng.range(-3, 3), phi = (a + rng.range(-3, 3)) / 345, sc = rng.range(0.74, 1.3), r1 = rng(), r2 = rng(), yaw = rng() * TAU;
      const L = land.at(zz, phi);
      if (L.water || L.town || L.terFix || L.river) continue;
      const shore = L.lakeD > 30 && L.lakeD < 66;
      if (!(L.forest ? r1 < 0.8 : shore ? r1 < 0.2 : L.ter ? r1 < 0.02 : r1 < 0.03)) continue;
      const rho = land.r2(zz) + 0.4, x = rho * Math.sin(phi), y = -rho * Math.cos(phi);
      const d = S.near2(x, y, zz);
      if (d < 12 * sc * 1.1 + 8) continue;
      const lod = d < 62 ? 0 : d < 165 ? 1 : d < 430 ? 2 : -1;
      if (lod < 0 || (lod > 0 && r2 > k * (lod === 1 ? 0.85 : 0.6))) continue;
      const s = sets[lod]; if (s.pos.length / 3 >= s.cap) continue;
      s.pos.push(x, y, zz); s.rot.push(yaw, sc * (L.forest ? 1 : 0.85), r2, lod);
      if (d < 120 && S.fernTops.length < 900) S.fernTops.push(x, y, zz, sc);
    }
  }
  await ctx.yield();
  { // triangle budget: when a seed's forest crowds the path, thin the two far levels evenly (never the near one)
    const TRI = [202, 78, 22], cnt = sets.map((q) => q.pos.length / 3), far = cnt[1] * TRI[1] + cnt[2] * TRI[2];
    const keep = clamp((165000 - cnt[0] * TRI[0]) / Math.max(1, far), 0.35, 1);
    if (keep < 1) for (let lod = 1; lod < 3; lod++) {
      const q = sets[lod], pos = [], rot = [], lim = keep * k * (lod === 1 ? 0.85 : 0.6);
      for (let i = 0; i < cnt[lod]; i++) if (q.rot[i * 4 + 2] < lim) { pos.push(q.pos[i * 3], q.pos[i * 3 + 1], q.pos[i * 3 + 2]); rot.push(q.rot[i * 4], q.rot[i * 4 + 1], q.rot[i * 4 + 2], q.rot[i * 4 + 3]); }
      q.pos = pos; q.rot = rot;
    }
  }
  await ctx.yield();
  const mat = shellMat(S, FERN_VERT, FERN_FRAG, { uBlossom: { value: V.season === 'blossom' ? 1 : 0 } }, { side: THREE.DoubleSide });
  for (let lod = 0; lod < 3; lod++) {
    const fg = fernGeometry(lod);
    await ctx.yield();
    const m = new THREE.Mesh(instanced(fg, sets[lod].pos, sets[lod].rot), mat);
    m.frustumCulled = false; m.name = 'ferns' + lod; S.scene.add(m);
    S.patch.push(m);
    await ctx.yield();
  }
});

// ---------------------------------------------------------------- sailboats on the lake that climbs the wall
function boatGeometry() {
  const parts = [];
  const tag = (g, part, kfn) => { const n = g.attributes.position.count, a = new Float32Array(n * 2), p = g.attributes.position;
    for (let i = 0; i < n; i++) { a[i * 2] = part; a[i * 2 + 1] = kfn ? kfn(i, p) : 0; } g.setAttribute('aK', new THREE.BufferAttribute(a, 2)); parts.push(g); return g; };
  const grid = (nu, nv, fn) => { const P = [], UV = [], I = [];
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const q = fn(i / nu, j / nv); P.push(q[0], q[1], q[2]); UV.push(i / nu, j / nv); }
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; I.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I); g.computeVertexNormals(); return g; };
  const beam = (z) => { const q = z / 4.5; return q > 0 ? 1.5 * Math.pow(Math.max(0, 1 - Math.pow(q, 2.2)), 0.6) : 1.5 * (1 - 0.34 * q * q); };
  const sheer = (z) => { const q = z / 4.5; return 0.85 + (q > 0 ? 0.75 : 0.35) * q * q; };
  const keel = (z) => { const q = z / 4.5; return -0.4 + (q > 0 ? 0.9 * q * q * q * q : 0.25 * q * q); };
  tag(grid(10, 4, (u, v) => { const z = lerp(-4.5, 4.5, u), b = beam(z), yg = sheer(z), yk = keel(z), s = v * 2 - 1, a = Math.abs(s);   // hull
    return [-Math.sign(s) * b * Math.pow(a, 0.6), lerp(yk, yg, Math.pow(a, 1.8)), z]; }), 0);
  tag(grid(10, 1, (u, v) => { const z = lerp(-4.5, 4.5, u); return [(v * 2 - 1) * beam(z) * 0.93, sheer(z) - 0.28, z]; }), 1);            // deck
  tag(grid(1, 2, (u, v) => { const s = u * 2 - 1; return [s * beam(-4.5) * (v > 0.4 ? 1 : 0.5), lerp(keel(-4.5), sheer(-4.5), v), -4.5]; }), 0);   // transom
  const box = (cx, cy, cz, sx, sy, sz, part) => { const g = new THREE.BoxGeometry(sx, sy, sz); g.translate(cx, cy, cz); return tag(g, part); };
  box(0, 6.6, 1.0, 0.2, 12.2, 0.2, 2);                                        // mast
  box(0, 1.25, -3.6, 0.1, 0.1, 2.0, 2);                                       // tiller
  box(0, 0.5, -4.55, 0.12, 1.5, 0.5, 2);                                      // rudder
  box(0, 1.0, -0.6, 2.2, 0.5, 1.6, 1);                                        // a low cabin
  const T = [1.7, 2.3], C = [2.0, -4.0], Pk = [11.7, -3.0], Th = [9.3, 2.5];  // lugsail corners as (y, z)
  const sail = (u, v) => { const y0 = lerp(T[0], C[0], u), z0 = lerp(T[1], C[1], u), y1 = lerp(Th[0], Pk[0], u), z1 = lerp(Th[1], Pk[1], u); return [0.14, lerp(y0, y1, v), lerp(z0, z1, v)]; };
  tag(grid(5, 6, sail), 3, (i, p) => { const u = (i % 6) / 5, v = Math.floor(i / 6) / 6; void p; return Math.sin(Math.PI * u) * Math.sin(Math.PI * (0.08 + 0.84 * v)); });
  { const g = new THREE.BoxGeometry(0.16, 0.16, 6.2); g.rotateX(-Math.atan2(Pk[0] - Th[0], Pk[1] - Th[1]) - Math.PI); g.translate(0.14, (Pk[0] + Th[0]) / 2, (Pk[1] + Th[1]) / 2); tag(g, 2); }   // the yard
  return mergeGeometries(parts);
}
const BOAT_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iRot; attribute vec4 iEx; attribute vec2 aK;
uniform float uTime, uU, uUBoat, uRefl; uniform vec3 uCam;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vK; varying float vH;
#include <fog_pars_vertex>
float rhoAt(float z){ return 360. * (.94 + .06 * sin(3.14159265 * min(1., (z - 120.) / 848. * 1.15))); }
void main(){
  // iPos = (arc metres = phi * 345, z, unused); iRot = (heading, scale, seed, heel); iEx = (circle radius, speed m/s, theta0, clock: 0 time, 1 keyed to u)
  float clock = mix(uTime, (uU - uUBoat) * 70., iEx.w);
  float R = iEx.x, wake = step(3.5, aK.x);
  float th = iEx.z + iEx.y * clock / max(R, 1.) + wake * position.z / max(R, 1.) * step(1., R);
  float hdg = R > 1. ? th + 1.5708 : iRot.x;
  vec2 d2 = vec2(cos(hdg), sin(hdg));
  vec2 c2 = iPos.xy + (R > 1. ? R * vec2(cos(th), sin(th)) : d2 * (iEx.y * clock + wake * position.z));
  float phi = c2.x / 345.;
  float rho = rhoAt(c2.y) - .05;                                      // chamber 2's wall, as the hero lathes it
  vec3 up = vec3(-sin(phi), cos(phi), 0.), tang = vec3(cos(phi), sin(phi), 0.);
  vec3 fwd = tang * d2.x + vec3(0., 0., 1.) * d2.y, side = cross(up, fwd);
  vec3 base = vec3(rho * sin(phi), -rho * cos(phi), c2.y);
  vec3 l = position, n = normal;
  if (wake < .5) {
    float sd = sin(iRot.z * 50.) > 0. ? 1. : -1.;
    float hl = sd * iRot.w * (1. + .22 * sin(uTime * .9 + iRot.z * 30.));
    if (aK.x > 2.5) l.x += sd * aK.y * (1.05 + .2 * sin(uTime * 2.6 + iRot.z * 20. + position.y * .8));     // the sail bellies and breathes
    float ch = cos(hl), sh = sin(hl);
    l = vec3(l.x * ch - l.y * sh, l.x * sh + l.y * ch, l.z); n = vec3(n.x * ch - n.y * sh, n.x * sh + n.y * ch, n.z);
    float pt = .05 * sin(uTime * 1.3 + iRot.z * 44.);                                                       // pitching on the swell
    l.y += l.z * pt + .16 * sin(uTime * 1.1 + iRot.z * 70.) - .12;
    l *= iRot.y;
  } else { l.z = 0.; l.xy *= step(.01, iRot.y); }
  vec3 p = base + side * l.x + up * l.y + fwd * l.z;
  vH = 0.; float rfade = 1.;
  if (uRefl > .5) {
    // the boat's mirror image, laid on the water where the line of sight to it meets the surface
    float hgt = max(dot(p - base, up), 0.), Hc = max(dot(uCam - base, up), 2.);
    vec3 m = p - 2. * hgt * up;
    vec3 q = uCam + (m - uCam) * (Hc / (Hc + hgt));
    q += side * sin(uTime * 2.2 + hgt * 1.1 + iRot.z * 30.) * .045 * hgt + fwd * sin(uTime * 1.7 + hgt * .8) * .03 * hgt;   // broken by the ripples
    q.xy *= (rhoAt(q.z) - .2) / max(length(q.xy), 1.);                // seated on the wall, just over the water
    vec3 qb = q - base; float ql = length(qb);
    q = base + qb * (min(ql, 27.) / max(ql, 1e-3));                  // and never runs further than its fade: no long faint wedge across the water
    rfade = 1. - smoothstep(9., 26., ql);              // a long streak at a grazing view fades before it reaches the shore
    vH = hgt / max(iRot.y, .01); p = q;
  }
  vP = p; vN = side * n.x + up * n.y + fwd * n.z; vUv = uv; vK = vec3(aK.x, mix(iRot.z, rfade, step(.5, uRefl)), aK.y);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BOAT_FRAG = /* glsl */`
varying vec3 vK; uniform vec3 uSail;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.)), col;
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  if (dot(n, V) < 0.) n = -n;
  float glow = 0.;
  if (vK.x < .5) {                                                   // white hull, a rose sheer strake, a painted eye on the bow
    float v = abs(vUv.y * 2. - 1.);
    col = mix(vec3(.80, .79, .76), uRose * .7, smoothstep(.80, .84, v) * (1. - smoothstep(.93, .95, v)));
    vec2 e = (vec2(vUv.x, v) - vec2(.86, .66)) * vec2(9., 5.);
    float er = length(e);
    col = mix(col, vec3(.08, .1, .2), (1. - smoothstep(.34, .4, er)) * smoothstep(.12, .16, er) + (1. - smoothstep(.05, .09, er)));
    col = mix(col, uViolet * .35, 1. - smoothstep(.0, .2, v));       // dark below the waterline
  } else if (vK.x < 1.5) { col = mix(uPearl, uGold, .45) * (.6 + .08 * sin(vUv.x * 60.));
  } else if (vK.x < 2.5) { col = mix(uViolet, uGold, .5) * .34;
  } else {                                                           // the lugsail: battens, a patch, light through the cloth
    float bat = 1. - smoothstep(.0, .035, abs(fract(vUv.y * 5. + .5) - .5));
    vec2 pq = abs(vUv - vec2(.36 + .3 * fract(vK.y * 9.), .3 + .3 * fract(vK.y * 17.))) - vec2(.09, .06);
    float mend = 1. - smoothstep(0., .012, max(pq.x, pq.y));
    col = uSail * (.82 + .18 * sin(vUv.x * 40.) * .3) * (1. - .45 * bat);
    col = mix(col, mix(uSail, uRose, .6) * .7, mend);
    glow = clamp(-dot(V, normalize(-vP + vec3(0., 0., 1e-3))), 0., 1.);
    float g2 = clamp(-dot(V, normalize(vec3(0., 0., 1010.) - vP + vec3(0., 1e-3, 0.))), 0., 1.);     // and the lamp of dome 2 behind the cloth
    glow = max(glow, g2 * g2 * 1.25);
  }
  vec3 lit = shellLight(vP, n, 1., 1., 1.);
  float cloth = step(2.5, vK.x), white = 1. - step(.5, vK.x);
  lit = mix(lit, vec3(dot(lit, vec3(.3, .5, .2))) * 1.5, .6 * cloth + .35 * white);        // sails and hulls stay pale in the gold fill
  vec3 c = col * lit + col * mix(keyColor(1.) * sunVis(vP, 1.), vec3(1., .8, .5), .5) * glow * .6;
  c = hazed(c, vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
// the reflection: violet where the hull and spars stand in the water, pale where the sail does
const REFL_FRAG = /* glsl */`
varying vec3 vK; varying float vH; uniform vec3 uSail;
void main(){
  float cloth = step(2.5, vK.x);
  vec3 col = mix(mix(uViolet, uSea, .25) * .42, uSail * .62, cloth * .8);
  float rip = texture2D(uNoise, vP.xz * .11 + vec2(uTime * .05, -uTime * .03)).r;
  float a = (.62 - .30 * smoothstep(0., 12., vH)) * (.6 + .5 * rip) * (1. - .5 * cloth * step(.5, fract(vH * .9 + rip * 2. + uTime * .3)) * smoothstep(3., 9., vH));
  vec3 up = normalize(vec3(-vP.xy, 0.) + vec3(0., 1e-4, 0.));
  vec3 c = hazed(col * shellLight(vP, up, 1., 1., 1.), vP) * uExpo;
  gl_FragColor = vec4(c, clamp(a, 0., .75) * vK.y);
  #include <fog_fragment>
}`;
const WAKE_FRAG = /* glsl */`
void main(){
  float v = clamp(vUv.y, 0., 1.), x = min(abs(vUv.x * 2. - 1.), 1.);      // (along and across the wake, each held to its own range)
  float nz = texture2D(uNoise, vec2(vUv.x * .7, v * 4. - uTime * .06)).r, nz2 = texture2D(uNoise, vec2(vUv.x * 2.3 + .4, v * 11. - uTime * .11)).g;
  float arms = smoothstep(.5, .82, x) * (1. - smoothstep(.9, 1., x));
  float churn = (1. - smoothstep(0., .5, x)) * (1. - smoothstep(0., .4, v));
  float fade = (1. - v) * (1. - v) * smoothstep(0., .04, v);
  float a = clamp((arms * .75 + churn) * fade * (.35 + 1.3 * nz * nz2 * 2.), 0., .85);
  vec3 up = normalize(vec3(-vP.xy, 0.) + vec3(0., 1e-4, 0.));
  vec3 c = hazed(vec3(.86, .9, .9) * shellLight(vP, up, 1., 1., 1.), vP) * uExpo;
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`;
BUILDERS.push(async (S) => {
  const { V, land, path, U } = S;
  // The lake's boats are dealt from a stream of their own, begun with one draw of the world's: however many tries
  // the scatter takes, everything built after the boats is dealt the same.
  const rng = ownStream(S.rng, 'lake-boats');
  const pos = [], rot = [], ex = [], used = [];
  const put = (a, z, R, speed, th0, clock, hdg, sc = 1) => { pos.push(a, z, 0); rot.push(hdg, rng.range(0.92, 1.08) * sc, rng(), rng.range(0.14, 0.3)); ex.push(R, speed, th0, clock); };
  const inLake = (a, z, m) => land.at(z, a / 345).lakeD < -m;
  const lakeAZ = (v) => [Math.atan2(v.x, -v.y) * 345, v.z];              // a place over the lake as (arc metres, z)
  // The boats of the lake pass, where the journey has them: one on the route's ground track at the lake's middle
  // (U.boat, z 650), so that we pass straight over it, and one 20 m to either side of it. Hulls and masts are the
  // lake's own (12 m masts, 10 m beneath our line); all three lie three-quarter on to our course.
  const c0 = path.pointAt(U.boat, new THREE.Vector3()), c1 = path.tangentAt(U.boat, new THREE.Vector3()).add(c0);      // (c1: one metre on along the route's own heading)
  const [a0, z0] = lakeAZ(c0), [a1, z1] = lakeAZ(c1), hl = Math.hypot(a1 - a0, z1 - z0) || 1;
  const ha = (a1 - a0) / hl, hz = (z1 - z0) / hl;                         // the route's heading over the water; (-hz, ha) lies across it
  const bow = 1.05, hdg = Math.atan2(hz * Math.cos(bow) + ha * Math.sin(bow), ha * Math.cos(bow) - hz * Math.sin(bow));
  put(a0, z0, 0, 2.4, 0, 1, hdg, 1); used.push([a0, z0, 0]);
  for (const sd of [1, -1]) { const a = a0 - hz * 20 * sd, z = z0 + ha * 20 * sd; put(a, z, 0, 2.4, 0, 1, hdg + 0.1 * sd, inLake(a, z, 6) ? 1 : 0); used.push([a, z, 0]); }
  // The rule of the lake, the same along the whole pass from U.lake0 to U.terr: but for those three, no boat comes
  // within 30 m of the route's ground track over the water, neither on its round nor on its run.
  const track = [], CORR = 30, _t = new THREE.Vector3();
  for (let d = U.lake0 * path.length; d <= U.terr * path.length; d += 2) { const q = lakeAZ(path.posAtDist(d, _t)); track.push(q[0], q[1]); }      // (the track, every 2 m of the route)
  const nearTrack = (a, z, R, hd) => { const cx = Math.cos(hd), cz = Math.sin(hd);
    for (let i = 0; i < track.length; i += 2) { const dx = track[i] - a, dz = track[i + 1] - z;
      if (R > 1) { if (Math.abs(Math.hypot(dx, dz) - R) < CORR) return true; }
      else { const t = clamp(dx * cx + dz * cz, 0, 110); if (Math.hypot(dx - t * cx, dz - t * cz) < CORR) return true; } }
    return false; };
  await S.ctx.yield();
  // The rest are scattered over the lake's own water, each clear of every other, of those three and of that corridor.
  let tries = 0;
  while (used.length < V.boats + 1 && tries++ < 2400) {
    if (tries % 40 === 0) await S.ctx.yield();
    if (V.regatta) {
      const a = rng.range(-70, 60), z = rng.range(565, 735), hd = rng.range(-0.22, 0.22), sp = rng.range(2.2, 3.1);
      if (!inLake(a, z, 14) || !inLake(a + 110 * Math.cos(hd), z + 110 * Math.sin(hd), 8)) continue;
      if (used.some((q) => Math.hypot(q[0] - a, q[1] - z) < 13)) continue;
      put(a, z, 0, sp, 0, 0, hd); used.push([a, z, 0]);
    } else {
      const a = rng.range(-85, 205), z = rng.range(538, 762), R = Math.max(12, rng.range(16, 42) * (1 - 0.6 * tries / 2400));      // the fuller the lake, the smaller the rounds it still has room for
      let ok = true; for (let i = 0; i < 8 && ok; i++) ok = inLake(a + R * Math.cos(i * TAU / 8), z + R * Math.sin(i * TAU / 8), 14);
      if (!ok || used.some((q) => Math.hypot(q[0] - a, q[1] - z) < q[2] + R + 12) || nearTrack(a, z, R, 0)) continue;
      put(a, z, R, rng.range(1.8, 3.0), rng() * TAU, 0, 0); used.push([a, z, R]);
    }
  }
  await S.ctx.yield();
  // A fleet racing across the lake is laid out as one body first; any of its boats whose run would bring it into the
  // corridor is then moved to the nearest free water, or left out if there is none.
  let moved = 0, hidden = 0;
  for (let i = 3; i < pos.length / 3; i++) {
    const R = ex[i * 4], hd = rot[i * 4]; let a = pos[i * 3], z = pos[i * 3 + 1];
    if (!nearTrack(a, z, R, hd)) continue;
    let ok = false, best = 1e9, Rn = R; const oa = a, oz = z;
    for (const Rk of R > 1 ? [R, Math.max(12, R * 0.5)] : [R]) { if (ok) break;       // a smaller round if the first will not fit anywhere
      for (let ia = 0; ia < 10; ia++) for (let iz = 0; iz < 8; iz++) {
        const ca = -72 + ia * 30 + 9 * Math.sin(iz * 2.1 + i), cz = 546 + iz * 30 + 9 * Math.sin(ia * 1.7 + i), dd = Math.hypot(ca - oa, cz - oz);
        if (dd >= best || nearTrack(ca, cz, Rk, hd)) continue;
        let fits = !pos.some((_, j) => j % 3 === 0 && j !== i * 3 && Math.hypot(pos[j] - ca, pos[j + 1] - cz) < ex[j / 3 * 4] + Rk + 12);
        if (fits && Rk > 1) for (let q = 0; q < 8 && fits; q++) fits = inLake(ca + Rk * Math.cos(q * TAU / 8), cz + Rk * Math.sin(q * TAU / 8), 14);
        if (fits && Rk <= 1) fits = inLake(ca, cz, 14) && inLake(ca + 110 * Math.cos(hd), cz + 110 * Math.sin(hd), 8);
        if (fits) { ok = true; best = dd; a = ca; z = cz; Rn = Rk; } } }
    if (ok) ex[i * 4] = Rn;
    if (i % 4 === 3) await S.ctx.yield();
    if (ok) { pos[i * 3] = a; pos[i * 3 + 1] = z; moved++; } else { rot[i * 4 + 1] = 0; hidden++; }
  }
  S.subjects.boats = { moved, hidden, n: pos.length / 3 };
  await S.ctx.yield();
  const own = { uU: { value: 0 }, uUBoat: { value: U.boat }, uSail: { value: new THREE.Color(V.sail) }, uRefl: { value: 0 } };
  const boatG = boatGeometry();
  await S.ctx.yield();
  const boats = new THREE.Mesh(instanced(boatG, pos, rot, ex), shellMat(S, BOAT_VERT, BOAT_FRAG, own, { side: THREE.DoubleSide }));
  boats.frustumCulled = false; boats.name = 'boats'; S.scene.add(boats); S.patch.push(boats);
  const wg = new THREE.PlaneGeometry(2, 1, 1, 12), wp = wg.attributes.position, wk = new Float32Array(wp.count * 2);
  for (let i = 0; i < wp.count; i++) { const v = 0.5 - wp.getY(i), x = wp.getX(i); wp.setXYZ(i, x * (0.9 + v * 8.5), 0.14, -3.2 - v * 42); wg.attributes.uv.setXY(i, x * 0.5 + 0.5, v); wk[i * 2] = 4; }
  wg.setAttribute('aK', new THREE.BufferAttribute(wk, 2));
  const wakes = new THREE.Mesh(instanced(wg, pos, rot, ex), shellMat(S, BOAT_VERT, WAKE_FRAG, own, { side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  wakes.frustumCulled = false; wakes.renderOrder = 1; wakes.name = 'wakes'; S.scene.add(wakes); S.patch.push(wakes);
  const refl = new THREE.Mesh(instanced(boatG, pos, rot, ex), shellMat(S, BOAT_VERT, REFL_FRAG, { ...own, uRefl: { value: 1 } }, { side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  refl.frustumCulled = false; refl.renderOrder = 0.5; refl.name = 'boatReflections'; S.scene.add(refl); S.patch.push(refl);
  S.onUpdate.push((dt, time, camera, u) => { own.uU.value = u; });
});

// ---------------------------------------------------------------- white villages, dry-stone lips, jetties
const PROP_VERT = /* glsl */`
${WALL_FRAME}
attribute vec2 aK; uniform float uTime;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  wallFrame();
  vec3 l = position;
  float bend = aK.y * (sin(uTime * 1.6 + iRot.z * 40. + iPos.z * .12) * .5 + .35);       // reeds bow down-shell
  vec3 p = wallPoint(l) + vec3(0., 0., 1.) * bend * iRot.y;
  vP = p; vN = wallDir(normal); vUv = uv; vK = vec3(aK.x, iRot.z, iRot.w);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// A farmhouse: limewashed walls under a tiled gable roof with eaves, a chimney, a lean-to with its own roof, and a
// walled yard. Flat-shaded quads with uv in metres. aK = (part: 0 wall, 1 roof, 2 chimney, 3 yard wall, 4 yard;
// flag: 1 the wall with the door, 2 the low parts that stay low when the house has an upper storey).
function houseGeometry() {
  const P = [], Nn = [], UV = [], K = [], I = [];
  const face = (pts, uvs, part, flag) => {
    const [a, b, c] = pts, e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], il = 1 / (Math.hypot(n[0], n[1], n[2]) || 1), o = P.length / 3;
    pts.forEach((q, i) => { P.push(q[0], q[1], q[2]); Nn.push(n[0] * il, n[1] * il, n[2] * il); UV.push(uvs[i][0], uvs[i][1]); K.push(part, flag); });
    for (let i = 2; i < pts.length; i++) I.push(o, o + i - 1, o + i);
  };
  // a wall from (x0, z0) to (x1, z1), y0..y1, outward on the right of its run
  const wall = (x0, z0, x1, z1, y0, y1, part, flag) => { const len = Math.hypot(x1 - x0, z1 - z0);
    face([[x0, y0, z0], [x1, y0, z1], [x1, y1, z1], [x0, y1, z0]], [[0, y0], [len, y0], [len, y1], [0, y1]], part, flag); };
  const X = 3.2, Z = 2.3, H = 3.3, RH = 5.2;
  wall(-X, Z, X, Z, 0, H, 0, 1); wall(X, Z, X, -Z, 0, H, 0, 0); wall(X, -Z, -X, -Z, 0, H, 0, 0); wall(-X, -Z, -X, Z, 0, H, 0, 0);
  face([[X, H, Z], [X, H, -Z], [X, RH, 0]], [[0, H], [2 * Z, H], [Z, RH]], 0, 0);                         // gables
  face([[-X, H, -Z], [-X, H, Z], [-X, RH, 0]], [[0, H], [2 * Z, H], [Z, RH]], 0, 0);
  const ex = X + 0.35, ez = Z + 0.5, ey = H - 0.25, ry = RH + 0.12, sl = Math.hypot(ez, ry - ey);
  face([[-ex, ey, ez], [ex, ey, ez], [ex, ry, 0], [-ex, ry, 0]], [[0, 0], [2 * ex, 0], [2 * ex, sl], [0, sl]], 1, 0);   // roof slopes with eaves
  face([[ex, ey, -ez], [-ex, ey, -ez], [-ex, ry, 0], [ex, ry, 0]], [[0, 0], [2 * ex, 0], [2 * ex, sl], [0, sl]], 1, 0);
  const cx = 1.5, cz = -0.7, cw = 0.36, c0 = 3.9, c1 = 6.0;                                                   // chimney
  wall(cx - cw, cz + cw, cx + cw, cz + cw, c0, c1, 2, 0); wall(cx + cw, cz + cw, cx + cw, cz - cw, c0, c1, 2, 0);
  wall(cx + cw, cz - cw, cx - cw, cz - cw, c0, c1, 2, 0); wall(cx - cw, cz - cw, cx - cw, cz + cw, c0, c1, 2, 0);
  face([[cx - cw, c1, cz + cw], [cx + cw, c1, cz + cw], [cx + cw, c1, cz - cw], [cx - cw, c1, cz - cw]], [[0, 9], [1, 9], [1, 9], [0, 9]], 2, 0);
  const LX = X + 2.2, L0 = -Z, L1 = 0.9, LH = 2.2;                                                            // the lean-to
  wall(-LX, L1, -X, L1, 0, LH, 0, 2); wall(-X, L0, -LX, L0, 0, LH, 0, 2); wall(-LX, L0, -LX, L1, 0, LH, 0, 2);
  face([[-LX - 0.3, LH - 0.1, L1 + 0.3], [-X, 2.95, L1 + 0.3], [-X, 2.95, L0 - 0.3], [-LX - 0.3, LH - 0.1, L0 - 0.3]], [[0, 0], [0, 2.6], [3.8, 2.6], [3.8, 0]], 1, 2);
  const YZ = 4.9, YX = -1.6;                                                                                   // the yard and its dry-stone wall
  wall(X, Z, X, YZ, 0, 0.95, 3, 2); wall(X, YZ, YX, YZ, 0, 0.95, 3, 2); wall(YX, YZ, YX, YZ - 1.3, 0, 0.95, 3, 2);
  face([[YX, 0.07, Z], [X, 0.07, Z], [X, 0.07, YZ], [YX, 0.07, YZ]], [[0, 0], [X - YX, 0], [X - YX, YZ - Z], [0, YZ - Z]], 4, 2);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2)); g.setIndex(I);
  return g;
}
const HOUSE_VERT = /* glsl */`
${WALL_FRAME}
attribute vec2 aK;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  wallFrame();
  vec3 l = position; vec2 q = uv;
  float xs = .84 + .36 * fract(iRot.z * 7.31), tall = step(.7, fract(iRot.z * 3.17));       // long or short, one storey or two
  if (abs(normal.x) < .6) q.x *= xs;
  l.x *= xs;
  float up2 = tall * 2.7 * step(2.99, l.y) * (1. - step(1.5, aK.y));
  l.y += up2; if (aK.x < .5) q.y += up2;
  vec3 p = wallPoint(l);
  vP = p; vN = wallDir(normal); vUv = q; vK = vec3(aK.x, iRot.z, aK.y);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const HOUSE_FRAG = /* glsl */`
varying vec3 vK; uniform float uHCh;      // the chamber the house stands in (1 or 3)
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.)), col; float glint = 0., ao = 1.;
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  if (dot(n, V) < 0.) n = -n;
  float sd = vK.y, low = step(1.5, vK.z), tall = step(.7, fract(sd * 3.17)) * (1. - low), top = 3.3 + 2.7 * tall;
  vec3 wash = mix(vec3(.84, .82, .78), mix(uPearl, uRose, .3) * .92, step(.62, fract(sd * 5.3)) * .7);
  wash = mix(wash, mix(uPearl, uGold, .45) * .86, step(.82, fract(sd * 9.1)) * .6);
  float hb3 = step(2.5, uHCh);                                       // the harbour's village: lime-white walls, green shutters, rose tiles, whatever the palette
  wash = mix(wash, vec3(.90, .88, .84) * (.94 + .1 * fract(sd * 5.3)), hb3);
  vec3 trim = mix(mix(uSea * .5, mix(uViolet, uSea, .35) * .75, step(.5, fract(sd * 11.3))), vec3(.16, .40, .30), hb3);        // shutters and doors
  if (vK.x < .5) {                                                   // limewashed wall: stains, plinth, windows with shutters, a door
    float st = texture2D(uNoise, vUv * .06 + sd).g, st2 = texture2D(uNoise, vec2(vUv.x * .35 + sd * 3., vUv.y * .05)).b;
    col = wash * (.88 + .16 * st) * (1. - .16 * smoothstep(.55, .8, st2) * (1. - smoothstep(top - 2., top, vUv.y)));     // rain streaks under the eaves
    float y = mod(vUv.y, 2.75), cell = vUv.x / 2.1, fu = (fract(cell) - .5) * 2.1, ci = floor(cell), fl = floor(vUv.y / 2.75);
    float isDoor = step(.5, vK.z) * (1. - low) * (1. - step(.5, abs(ci - 1.))) * (1. - step(.5, fl));
    float has = step(.22, fract(sd * 3.7 + ci * .37 + fl * .61)) * step(vUv.y, top - .5) * (1. - isDoor) * (1. - low * step(.5, abs(ci)));
    vec2 wq = abs(vec2(fu, y - 1.72)) - vec2(.40, .52);
    float wd = max(wq.x, wq.y), win = (1. - smoothstep(0., .04, wd)) * has;
    vec2 sq = abs(vec2(abs(fu) - .63, y - 1.72)) - vec2(.17, .56);
    float shut = (1. - smoothstep(0., .04, max(sq.x, sq.y))) * has;
    col = mix(col, wash * 1.1, (1. - smoothstep(.06, .1, wd)) * has * .7);                     // a pale surround
    col = mix(col, trim * (.85 + .15 * step(.5, fract(y * 9.))), shut);                        // louvred shutters
    col = mix(col, vec3(.09, .12, .2), win);
    col = mix(col, wash * .95, win * (1. - smoothstep(.02, .045, min(abs(fu), abs(y - 1.72)))));   // glazing bars
    col = mix(col, wash * .7, has * (1. - smoothstep(0., .04, max(abs(fu) - .5, abs(y - 1.14) - .05))));   // the sill
    vec2 dq = abs(vec2(fu, vUv.y - 1.02)) - vec2(.46, 1.02);
    float door = (1. - smoothstep(0., .04, max(dq.x, dq.y))) * isDoor;
    col = mix(col, trim * .8 * (.8 + .2 * step(.5, fract(fu * 4.5))), door);
    col = mix(col, uGold * .9, door * (1. - smoothstep(.03, .06, length(vec2(fu - .3, vUv.y - 1.05)))));   // a brass knob
    glint = win * pow(max(dot(reflect(-V, n), normalize(vec3(0., 0., 210.) - vP + vec3(0., 1e-3, 0.))), 1e-3), 30.) * 5.;       // daylight on glass, not a lamp
    ao = (.66 + .34 * smoothstep(0., .6, vUv.y)) * (1. - .34 * smoothstep(top - .75, top - .2, vUv.y) * (1. - smoothstep(top, top + .25, vUv.y)));
    col = mix(col, mix(uForest, uGold, .3) * .4, (1. - smoothstep(.0, .35, vUv.y + (st - .5) * .5)) * .5);   // moss at the foot
  } else if (vK.x < 1.5) {                                           // roof: tile courses, a pale ridge, lichen
    vec3 tile = mix(mix(uRose, vec3(.74, .34, .27), .55), mix(uViolet, vec3(.42, .47, .58), .55) * .9, step(.8, fract(sd * 13.)));
    tile = mix(tile, vec3(.84, .40, .40) * (.9 + .2 * fract(sd * 13.)), hb3);                 // rose tiles
    float cy = vUv.y * 2.4, row = floor(cy), cx = vUv.x * 2.1 + .5 * row;
    float h = texture2D(uNoise, (vec2(floor(cx), row) + .5) / 64. + sd).r;
    col = tile * (.72 + .3 * fract(cy)) * (.82 + .36 * h) * (1. - .3 * smoothstep(.86, .98, fract(cx)));
    col = mix(col, mix(uGold, uForest, .5) * .5, smoothstep(.62, .8, texture2D(uNoise, vUv * .11 + sd * 2.).a) * .55);
    col = mix(col, tile * 1.25 + .05, (1. - smoothstep(.08, .3, abs(vUv.y - 3.6))) * (1. - low));               // ridge tiles
  } else if (vK.x < 2.5) {                                           // chimney, with a dark pot
    col = mix(wash * .9, vec3(.2, .16, .16), step(5.7, vUv.y));
  } else if (vK.x < 3.5) {                                           // dry-stone yard wall
    vec2 bq = vUv * vec2(1.9, 3.4); bq.x += .5 * floor(bq.y);
    vec2 f = abs(fract(bq) - .5);
    col = mix(uPearl * .7, mix(uPearl, uViolet, .3) * .56, texture2D(uNoise, floor(bq) / 64. + .13).r) * (1. - .45 * smoothstep(.36, .47, max(f.x, f.y)));
    ao = .7 + .3 * smoothstep(0., .5, vUv.y);
  } else {                                                           // the yard: swept earth and a few rows of vegetables
    float rowsOn = step(.45, fract(sd * 17.)), r = fract(vUv.y * 1.6);
    col = mix(mix(uPearl, uGold, .5) * .52, mix(uForest, uGold, .25) * .62, rowsOn * step(.2, r) * step(r, .62) * step(.6, vUv.x) * step(.5, fract(vUv.x * 2.3 + floor(vUv.y * 1.6) * .37) + .25));
    ao = .82;
  }
  vec3 lit = shellLight(vP, n, uHCh, 1., 1.);
  vec3 c = col * lit * ao + glint * keyColor(1.) * (.3 + .7 * sunVis(vP, uHCh));
  c = hazed(c, vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
const STONE_FRAG = /* glsl */`
void main(){
  vec3 n = normalize(vN + 1.4 * normalize(vec3(-vP.xy, 0.) + vec3(0., 1e-4, 0.)));
  vec2 b = vUv * vec2(2.2, 3.6); b.x += .5 * floor(b.y);
  float h = texture2D(uNoise, floor(b) / 64. + .13).r, m = texture2D(uNoise, vUv / 9.).g;
  vec2 f = abs(fract(b) - .5);
  float joint = smoothstep(.38, .47, max(f.x, f.y));
  vec3 col = mix(uPearl * .74, mix(uPearl, uViolet, .3) * .6, h) * (.8 + .4 * m) * (1. - .45 * joint);
  col = mix(col, mix(uGold, uForest, .6) * .5, smoothstep(.55, .75, m) * .5);                 // moss
  vec3 c = hazed(col * shellLight(vP, n, 1., 1., 1.), vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
const STONE_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vP; varying vec3 vN;
#include <fog_pars_vertex>
void main(){ vUv = uv; vP = position; vN = normal; vec4 mvPosition = modelViewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
BUILDERS.push(async (S) => {
  const { ctx, V, land } = S, rng = ownStream(S.rng, 'lake-villages');
  // ---- houses: where towns are painted, plus a village on the lake's right shore and one above the terraces
  const hg = houseGeometry();
  const pos = [], rot = [], cap = Math.round(420 * Math.max(0.7, V.detail));
  const tryHouse = (a, z, p) => {
    if (pos.length / 3 >= cap || rng() > p) return;
    const phi = a / 345, L = land.at(z, phi); if (L.water || L.lakeD < 9 || L.forest) return;
    const rho = land.r2(z), x = rho * Math.sin(phi), y = -rho * Math.cos(phi); if (S.near2(x, y, z) < 17) return;
    pos.push(x, y, z); rot.push(rng.pick([0, 0.2, -0.2, 1.57, 1.77]) + rng.range(-0.08, 0.08), rng.range(0.85, 1.12) * 0.84, rng(), 0);
  };
  for (let z = 585; z < 705; z += 8.5) for (let a = -216; a < -118; a += 8.5) tryHouse(a + rng.range(-1.5, 1.5), z + rng.range(-1.5, 1.5), 0.62);
  for (let z = 600; z < 700; z += 8.5) for (let a = 386; a < 440; a += 8.5) tryHouse(a + rng.range(-1.5, 1.5), z + rng.range(-1.5, 1.5), 0.6);
  await ctx.yield();
  let n = 0;
  for (let z = 304; z < 958; z += 9) for (let a = -468; a < 638; a += 9) {
    if (++n % 120 === 0) await ctx.yield();
    const r = rng(); if (land.at(z, a / 345).town) tryHouse(a, z, 0.58 + r * 0);
  }
  const houses = new THREE.Mesh(instanced(hg, pos, rot), shellMat(S, HOUSE_VERT, HOUSE_FRAG, { uHCh: { value: 1 } }, { side: THREE.DoubleSide }));
  houses.frustumCulled = false; houses.name = 'houses'; S.scene.add(houses); S.patch.push(houses);
  await ctx.yield();
  // ---- stone: terrace lips along the wall and jetties out into the lake
  const P = [], Nn = [], UV = [], I = [];
  const frame = (a, z, lift) => { const phi = a / 345, rho = land.r2(z) - lift, s = Math.sin(phi), c = Math.cos(phi); return [rho * s, -rho * c, z, -s, c, 0, c, s, 0]; };
  // a box-section strip between (a0, z0) and (a1, z1), `w` wide, `h` high, in `segs` pieces
  const strip = (a0, z0, a1, z1, w, h, segs) => {
    const len = Math.hypot(a1 - a0, z1 - z0), da = (a1 - a0) / len, dz = (z1 - z0) / len, base = P.length / 3;
    const prof = [[-w / 2 - 0.25, -0.3], [-w / 2, h], [w / 2, h], [w / 2 + 0.25, -0.3]];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, a = lerp(a0, a1, t), z = lerp(z0, z1, t), wob = 1 + 0.12 * Math.sin(t * len * 0.7 + a0);
      for (let k = 0; k < 4; k++) {
        const o = prof[k][0], F = frame(a - dz * o, z + da * o, 0), hh = prof[k][1] * (k === 1 || k === 2 ? wob : 1);
        P.push(F[0] + F[3] * hh, F[1] + F[4] * hh, F[2]);
        const nx = k < 2 ? -1 : 1, ny = k === 1 || k === 2 ? 1.2 : 0.2, il = 1 / Math.hypot(nx, ny);
        const sx = -dz * F[6] * nx, sy = -dz * F[7] * nx, sz = da * nx;
        Nn.push((sx + F[3] * ny) * il, (sy + F[4] * ny) * il, sz * il);
        UV.push(t * len, k === 0 ? 0 : k === 1 ? h : k === 2 ? h + w : 2 * h + w);
      }
    }
    for (let i = 0; i < segs; i++) for (let k = 0; k < 3; k++) { const q = base + i * 4 + k, r = q + 4; I.push(q, r, q + 1, q + 1, r, r + 1); }
  };
  for (let k = 22; k <= 35; k++) {
    await ctx.yield();
    const a = k * 10.5; let z = 512 + rng.range(0, 8);
    while (z < 780) { const l = rng.range(22, 40), gap = rng.chance(0.3) ? rng.range(2.5, 4) : 0, z1 = Math.min(788, z + l);
      const dry = (zq) => land.at(zq, a / 345).lakeD > 5;                 // beyond the deep basin the lips stand in flooded terraces
      if (dry(z) && dry(z1) && dry((z + z1) / 2)) strip(a, z, a, z1, 0.7, 1.25, Math.ceil(l / 6)); z += l + gap; }
  }
  for (const z of [596, 628, 659, 688]) {                                  // jetties from the village shore
    let a = -190; while (a < -40 && !land.at(z, a / 345).water) a += 2;
    strip(a - 8, z, a + 26, z, 3.0, 1.1, 7);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); sg.setIndex(I);
  const stone = new THREE.Mesh(sg, shellMat(S, STONE_VERT, STONE_FRAG, {}, { side: THREE.DoubleSide }));
  stone.frustumCulled = false; stone.name = 'stone'; S.scene.add(stone); S.patch.push(stone);
});

// ---------------------------------------------------------------- reed beds and lily rafts along the shore
const REED_FRAG = /* glsl */`
varying vec3 vK;
float h11(float x){ return fract(sin(x * 127.1) * 43758.5453); }
void main(){
  vec3 col; float ao = 1.;
  if (vK.z < .5) {                                                     // reeds: blades cut out of a card
    float x = vUv.x * 7. + vK.y * 31., id = floor(x), f = fract(x) - .5, hgt = .5 + .5 * h11(id + vK.y * 9.);
    float t = vUv.y / hgt;
    if (t > 1. || abs(f + .25 * t * (h11(id + 3.) - .5)) > .34 * (1. - t * t) + .02) discard;
    col = mix(uForest * vec3(.7, 1., .62), mix(uGold, uForest, .35) * vec3(.9, .95, .5), t);
    col = mix(col, mix(uViolet, uGold, .5) * .45, step(.86, t) * step(.5, h11(id + 7.)));      // seed heads
    ao = .5 + .5 * smoothstep(0., .5, vUv.y);
  } else {                                                             // lily pads and pink flowers
    vec2 g = vUv * 5., id = floor(g), f = fract(g) - .5;
    float h = h11(id.x * 7.3 + id.y * 13.1 + vK.y * 50.), h2 = h11(id.x * 3.7 + id.y * 5.9 + vK.y * 20.);
    vec2 o = f - (vec2(h, h2) - .5) * .4;
    float r = length(o), keep = step(.3, h) * step(length(id + .5 - 2.5), 2.3 + h2 * .4);
    float pad = keep * step(r, .30 + .12 * h2) * step(-.92, dot(normalize(o + vec2(1e-4, 0.)), vec2(cos(h * 6.3), sin(h * 6.3))));
    float flower = keep * step(.72, h2) * step(r, .12);
    if (pad + flower < .5) discard;
    col = mix(uForest * vec3(.62, 1.05, .7) * (.8 + .3 * h), mix(uRose, vec3(1., .86, .9), .35 + .4 * step(r, .05)) * 1.05, flower);
  }
  vec3 up = normalize(vec3(-vP.xy, 0.) + vec3(0., 1e-4, 0.));
  vec3 c = hazed(col * shellLight(vP, up, 1., 1., 1.) * ao, vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
BUILDERS.push(async (S) => {
  const { ctx, rng, V, land } = S;
  const mk = (g, w) => { const p = g.attributes.position, a = new Float32Array(p.count * 2); for (let i = 0; i < p.count; i++) a[i * 2 + 1] = w(p.getY(i)); g.setAttribute('aK', new THREE.BufferAttribute(a, 2)); return g; };
  const card = () => new THREE.PlaneGeometry(2.0, 3.2, 1, 3).translate(0, 1.6, 0);
  const reedG = mergeGeometries([mk(card(), (y) => (y / 3.2) ** 2 * 0.9), mk(card().rotateY(Math.PI / 2), (y) => (y / 3.2) ** 2 * 0.9), mk(card().rotateY(Math.PI / 4).translate(0.7, 0, 0.5), (y) => (y / 3.2) ** 2 * 0.9)]);
  const lilyG = mk(new THREE.PlaneGeometry(7, 7).rotateX(-Math.PI / 2).translate(0, 0.1, 0), () => 0);
  const rp = [], rr = [], lp = [], lr = [], capR = Math.round(2600 * V.detail), capL = Math.round(380 * V.detail);
  await ctx.yield();
  let n = 0;
  for (let z = 476; z < 826; z += 2.6) for (let a = -176; a < 292; a += 2.6) {
    if (++n % 120 === 0) await ctx.yield();
    const r = rng(), zz = z + rng.range(-1.2, 1.2), aa = a + rng.range(-1.2, 1.2), sc = rng.range(0.8, 1.35), sd = rng();
    const DB = land.lakeBox(zz, aa / 345);
    if (DB > 86 || DB < -64) continue;
    const D = land.at(zz, aa / 345).lakeD;
    if (D > 62 || D < -40) continue;
    const wet = (dz, da) => land.at(zz + dz, (aa + da) / 345).water;
    const w0 = wet(0, 0), nearEdge = wet(4, 0) !== w0 || wet(-4, 0) !== w0 || wet(0, 4) !== w0 || wet(0, -4) !== w0;
    const bar = D > -5 && D < 5;                                        // a reed bar round the deep basin, and reeds on every true shore
    const reed = (nearEdge && r < 0.6) || (bar && r < 0.55);
    const lily = !reed && w0 && ((D > -26 && D < -7 && r < 0.07) || (r < 0.09 && !(wet(16, 0) && wet(-16, 0) && wet(0, 16) && wet(0, -16))));
    if (!reed && !lily) continue;
    const phi = aa / 345, rho = land.r2(zz) - 0.02, x = rho * Math.sin(phi), y = -rho * Math.cos(phi);
    if (S.near2(x, y, zz) < 10) continue;
    if (reed && rp.length / 3 < capR) { rp.push(x, y, zz); rr.push(sd * TAU, sc, sd, 0); }
    if (lily && lp.length / 3 < capL) { lp.push(x, y, zz); lr.push(sd * TAU, sc, sd, 1); }
  }
  const mat = shellMat(S, PROP_VERT, REED_FRAG, {}, { side: THREE.DoubleSide });
  for (const [g, p, r, name] of [[reedG, rp, rr, 'reeds'], [lilyG, lp, lr, 'lilies']]) {
    const m = new THREE.Mesh(instanced(g, p, r), mat); m.frustumCulled = false; m.name = name; S.scene.add(m); S.patch.push(m);
  }
});

// ---------------------------------------------------------------- the weightless river of cloud down the axis
const BILLBOARD = /* glsl */`
vec3 camRight(){ return vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]); }
vec3 camUp(){ return vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]); }
`;
const PUFF_VERT = /* glsl */`
${BILLBOARD}
attribute vec4 iA; uniform float uTime, uFlow; uniform vec3 uCam;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec4 vC;
#include <fog_pars_vertex>
float neck(float z, float zd, float w){ float q = (z - zd) / w; return 1. - exp(-q * q); }
void main(){
  float L = 4320., f = fract(iA.x + uTime * uFlow / L), z = 120. + f * L;
  float big = mix(mix(mix(14., 34., smoothstep(210., 520., z)), 52., smoothstep(1010., 1500., z)), 66., smoothstep(2210., 2900., z));
  big = mix(big, 38., smoothstep(2450., 3350., z));                    // along the last room the river draws out into a line of streamers
  float nk = neck(z, 215., 90.) * neck(z, 1020., 160.) * neck(z, 2225., 260.);
  float R = big * (.3 + .7 * nk), stray = step(.74, iA.w), room4 = smoothstep(2300., 2500., z) * (1. - smoothstep(2640., 2860., z));
  float a = iA.y + uTime * .03 * (iA.w - .5) + stray * (z - 120.) * .0006;
  float rr = iA.z * R * (1. + stray * (1.5 + (2.2 + 5.5 * room4) * smoothstep(0., 600., z - (z < 1020. ? 215. : z < 2225. ? 1020. : 2225.)) * nk));   // strays sink toward the land
  rr = mix(rr, max(rr, 300.), stray * room4);                           // cloudlets in the last room keep well clear of the axis and the mouth
  vec2 off = vec2(56., 46.) * smoothstep(262., 410., z) * (1. - smoothstep(760., 965., z)) + vec2(-28., -46.) * smoothstep(1080., 1300., z) * (1. - smoothstep(1980., 2180., z)) + vec2(-80., 110.) * smoothstep(1940., 2320., z);   // the river runs below and beside our line
  vec3 c = vec3(cos(a) * rr * 1.25 + off.x, sin(a) * rr * .6 + off.y, z);
  float size = (.5 + .6 * fract(iA.w * 7.31)) * (R * .85 + 6.) * (1. + 1.1 * stray * room4);
  vec3 p = c + (camRight() * (uv.x - .5) + camUp() * (uv.y - .5)) * size * 2.;
  float fade = smoothstep(0., .03, f) * (1. - smoothstep(.9, 1., f)) * (1. - mix(.66 * smoothstep(2330., 3200., z), smoothstep(2330., 2720., z), stray) * (1. - .8 * stray * room4)) * (1. - stray * smoothstep(3000., 3250., z)) * (1. - smoothstep(3690., 3900., z));      // the river thins to streamers along the last room and out over the lip
  float dc = length(uCam - c);
  fade *= smoothstep(22. + size * .5, 70. + size * 1.4, dc);                        // held off the camera
  fade *= .45 + .55 * nk;                                                           // drawn through a door the river thins to wisps: the rim and the room beyond show through it
  fade *= 1. - stray * room4 * smoothstep(380., 620., dc);                          // cloudlets of the last room never sit in front of the far mouth            // the streamers past the mouth only show from close by
  vP = p; vN = vec3(0., 0., 1.); vUv = uv; vC = vec4(1. + step(1022., z) + step(2225., z), fade, iA.w, stray);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const PUFF_FRAG = /* glsl */`
varying vec4 vC; uniform float uOpacity;
void main(){
  vec2 q = vUv * 2. - 1.; float r2 = dot(q, q);
  if (r2 > 1.) discard;
  float soft = (1. - r2) * (1. - r2);
  vec2 o = vec2(vC.z * 3.7, vC.z * 9.1);
  float n = texture2D(uNoise, vUv * .33 + o + vec2(uTime * .004, 0.)).r * .62 + texture2D(uNoise, vUv * .9 + o * 1.7 - vec2(0., uTime * .006)).g * .38;
  float deck = step(vC.w, -.5);                                       // the cloud deck of the last room
  float a = soft * smoothstep(.3, .74, n * 1.12 + soft * .3) * uOpacity * 1.15 * vC.y * (1. - .35 * max(vC.w, 0.));
  float hole = texture2D(uNoise, vec2(atan(vP.y, vP.x + 1e-3) * .87, vP.z / 1500.)).g;      // the deck is broken: holes that stay where they are on the wall, the same for every puff
  a = min(a * mix(1., smoothstep(.36, .56, hole), deck), .5);          // no puff anywhere is more than half opaque: the land shows through the cloud and between its heads
  vec3 lit = keyColor(vC.x) * sunVis(vP, vC.x) * (.5 + .9 * n) * (.55 + .45 * (q.y * .5 + .5)) + mix(uViolet, vec3(.85, .9, 1.), .62) * (.5 + .22 * q.y);
  lit = mix(lit, mix(mix(uViolet, vec3(.85, .9, 1.), .42), vec3(1.06, 1.07, 1.1), clamp(.15 + .5 * (q.y * .5 + .5) + .6 * (n - .35), 0., 1.)), deck);      // white tops, thin violet undersides
  vec3 c = hazed(vec3(.93) * lit, mix(vP, uCam, .45 * deck)) * uExpo;                  // a bank of cloud, not a mist: it keeps its white through the blue air
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`;
BUILDERS.push(async (S) => {
  const { rng, V } = S;
  const n = Math.round((V.weather === 'heavy' ? 620 : V.weather === 'still' ? 190 : 420) * V.detail);
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  const a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) { a[i * 4] = V.weather === 'still' ? (i + rng() * 0.3) / n : rng(); a[i * 4 + 1] = rng() * TAU; a[i * 4 + 2] = Math.sqrt(rng()) * (V.weather === 'still' ? 0.35 : 1); a[i * 4 + 3] = rng(); }
  g.setAttribute('iA', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
  const own = { uFlow: { value: V.weather === 'still' ? 5 : 12 }, uOpacity: { value: V.weather === 'heavy' ? 0.5 : V.weather === 'still' ? 0.5 : 0.4 } };
  const m = new THREE.Mesh(g, shellMat(S, PUFF_VERT, PUFF_FRAG, own, { transparent: true, depthWrite: false }));
  m.frustumCulled = false; m.renderOrder = 5; m.name = 'cloudRiver'; S.scene.add(m);
});

// ---------------------------------------------------------------- egrets (or rose ibis): flock one on a curve keyed to u, flock two on a course fixed in the world, a third wheeling in the mouth
function birdGeometry() {
  // A wader in flight, 2.3 units from tip to tip: spindle body, neck folded back with the bill ahead, legs trailing,
  // a tail fan, and wings in three tapering panels (shoulder, wrist, swept hand). aK = (flap weight 0..1, part).
  const P = [], K = [], I = [];
  const v = (x, y, z, w, part, trail = 0) => { P.push(x, y, z); K.push(w, part, trail); return P.length / 3 - 1; };
  const tri = (a, b, c) => I.push(a, b, c), quad = (a, b, c, d) => I.push(a, b, c, a, c, d);
  const nose = v(0, 0.02, 0.5, 0, 0), tail = v(0, 0.01, -0.52, 0, 0), top = v(0, 0.13, 0.04, 0, 0), l = v(-0.16, 0, 0.04, 0, 0), r = v(0.16, 0, 0.04, 0, 0), bot = v(0, -0.12, 0.06, 0, 0);
  tri(nose, l, top); tri(nose, top, r); tri(tail, top, l); tri(tail, r, top); tri(nose, bot, l); tri(nose, r, bot); tri(tail, l, bot); tri(tail, bot, r);
  // neck (an S folded back on the shoulders), head and bill
  const n0 = v(-0.085, 0.05, 0.4, 0, 0), n1 = v(0.085, 0.05, 0.4, 0, 0), n2 = v(-0.07, 0.13, 0.62, 0, 0), n3 = v(0.07, 0.13, 0.62, 0, 0);
  const h0 = v(-0.075, 0.1, 0.82, 0, 0), h1 = v(0.075, 0.1, 0.82, 0, 0), b0 = v(-0.04, 0.085, 0.84, 0, 1), b1 = v(0.04, 0.085, 0.84, 0, 1), bt = v(0, 0.045, 1.26, 0, 1);
  quad(n0, n1, n3, n2); quad(n2, n3, h1, h0); tri(b0, b1, bt);
  // legs and tail
  const g0 = v(-0.05, -0.03, -0.42, 0, 2), g1 = v(0.05, -0.03, -0.42, 0, 2), g2 = v(0.028, -0.05, -1.12, 0, 2), g3 = v(-0.028, -0.05, -1.12, 0, 2);
  quad(g0, g1, g2, g3);
  tri(tail, v(0.15, 0.01, -0.78, 0, 0), v(-0.15, 0.01, -0.78, 0, 0));
  for (const s of [-1, 1]) {
    // stations: root, wrist, mid-hand, tip; (x, leading z, trailing z, flap weight); the hand sweeps back and narrows
    const st = [[0.1, 0.24, -0.2, 0], [0.5, 0.44, 0.02, 0.5], [0.86, 0.24, -0.14, 0.8], [1.2, -0.2, -0.32, 1]];      // an M from below: wrists forward, hands swept back to a point
    let prev = null;
    for (const [x, zl, zt, w] of st) {
      const a = v(s * x, 0.035 - 0.03 * w, zl, w, 0), c = v(s * x, 0.02 - 0.02 * w, zt, w, 0, 1);    // trail 1: the flight feathers
      if (prev) { if (s > 0) quad(prev[0], a, c, prev[1]); else quad(prev[0], prev[1], c, a); }
      prev = [a, c];
    }
  }
  const g = new THREE.BufferGeometry();
  for (let i = 24; i < I.length; i += 3) {                    // everything but the body faces up, so "seen from below" is one test
    const a = I[i] * 3, b = I[i + 1] * 3, c = I[i + 2] * 3;
    const ny = (P[b + 2] - P[a + 2]) * (P[c] - P[a]) - (P[b] - P[a]) * (P[c + 2] - P[a + 2]);
    if (ny < 0) { const t = I[i + 1]; I[i + 1] = I[i + 2]; I[i + 2] = t; }
  }
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 3)); g.setIndex(I);
  g.computeVertexNormals();
  return g;
}
// The shader's typed numbers for flock two, and where each comes from (the builder below must say the same):
//   120 points in uQ: flock one's 6, then flock two's 57 course points (from index 6), then its 57 facings (57 further on);
//   54 spans (the builder's loop lays -1 to 55 over 54); .58 is the deal's own power (0.58 in the builder), undone here;
//   .7 is how strongly one sine gathers the skein into its middle (at .5 the fullest stretch falls under the designer's floor of fifty,
//   at .9 head and tail thin to a string); 3.6 widens the dealt 4.16 m to the 15 m either side of a ribbon 30 m across.
const BIRD_VERT = /* glsl */`
attribute vec3 aK; attribute vec4 iF; attribute vec4 iG;
uniform float uTime; uniform vec3 uQ[120]; uniform vec3 uS; uniform vec3 uWheel;
vec3 crPos(vec3 a, vec3 b, vec3 c, vec3 d, float t){ return .5 * (2. * b + (c - a) * t + (2. * a - 5. * b + 4. * c - d) * t * t + (3. * b - a - 3. * c + d) * t * t * t); }
vec3 crTan(vec3 a, vec3 b, vec3 c, vec3 d, float t){ return .5 * ((c - a) + 2. * (2. * a - 5. * b + 4. * c - d) * t + 3. * (3. * b - a - 3. * c + d) * t * t); }
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  // iF = (flock 0 | 1, place along the curve, offset to the side, offset up); iG = (seed, size, wingbeat, unused)
  bool two = iF.x > .5, wheel = iF.x > 1.5, skein = two && !wheel;
  // flock one flies a Catmull-Rom curve through four of its six points (three spans); flock two through 55 of its 57 (54 spans), and fills the share uS.z of it.
  // Flock two is thick in its middle and thin at head and tail: the dealt place gives back its own even draw (the power undoes the deal's), and one sine gathers it.
  float pl = pow(iF.y, 1. / .58), ys = skein ? pl + .7 * sin(6.2831853 * pl) / 6.2831853 : iF.y;
  float ns = two ? 54. : 3., tt = clamp((two ? uS.y : uS.x) + ys * (two ? uS.z : .5), -.15, 1.15) * ns, sg = clamp(floor(tt), 0., ns - 1.), lt = tt - sg;
  int o = (two ? 6 : 0) + int(sg + .5);
  vec3 c = crPos(uQ[o], uQ[o + 1], uQ[o + 2], uQ[o + 3], lt);
  vec3 tn = skein ? crPos(uQ[o + 57], uQ[o + 58], uQ[o + 59], uQ[o + 60], lt) : vec3(0., 1., 0.);      // flock two: the way its ribbon faces, laid with the course
  vec3 fw = normalize(crTan(uQ[o], uQ[o + 1], uQ[o + 2], uQ[o + 3], lt) + vec3(0., 0., 1e-3));
  if (wheel) {                                                       // the third flock wheels slowly round the ring and the horn tips, upright in the mouth, facing down the shell
    float R = 60. + 50. * iF.y, a = iG.x * 6.2832 + uTime * (10. + 5. * fract(iG.x * 7.)) / R;
    c = uWheel + vec3(cos(a) * R, sin(a) * R * .7, iF.z * 9. + 30. * sin(2. * a + iG.x * 6.));
    fw = normalize(vec3(-sin(a) * R, cos(a) * R * .7, 60. * cos(2. * a + iG.x * 6.)) + vec3(0., 0., 1e-3));
  }
  vec3 up0 = skein ? vec3(0., 1., 0.) : normalize(vec3(-c.xy, 0.) + vec3(0., 40., 0.));      // (flock two flies wings level: its course passes close by the axis, where the other rule turns a bird over)
  vec3 sd = normalize(cross(up0, fw) + vec3(1e-4, 0., 0.)), up = cross(fw, sd);
  // flock two's ribbon has axes of its own, which only PLACE its birds (each bird's body keeps sd and up: wings level, pitched along its course):
  // the 30 m lie square to the course and to tn, the 9 m along tn
  vec3 rs = sd, ru = up;
  if (skein) { rs = normalize(cross(tn, fw)); ru = cross(fw, rs); }
  float s = iG.x;
  c += (rs * (iF.z * (skein ? 3.6 : 1.) + 1.6 * sin(uTime * .5 + s * 20.)) + ru * (iF.w + 1.3 * sin(uTime * .37 + s * 33.))) * (wheel ? .3 : 1.);
  float ph = uTime * iG.z + s * 40., glide = smoothstep(-.2, .5, sin(uTime * .31 + s * 17.));    // beats, then a glide
  vec3 l = position; float w = aK.x;
  float lift = (sin(ph) * w * .62 + sin(ph - .9) * w * w * .34) * glide + w * .12 * (1. - glide);
  l.y += lift; l.x *= 1. - .12 * abs(lift);
  l.y += -.05 * sin(ph) * (1. - w) * glide;                                                       // the body rides the beat
  float bank = .25 * cos(uTime * .5 + s * 20.);
  l = vec3(l.x * cos(bank) - l.y * sin(bank), l.x * sin(bank) + l.y * cos(bank), l.z) * iG.y;
  vec3 p = c + sd * l.x + up * l.y + fw * l.z;
  vec3 nl = normalize(normal + vec3(0., 1e-4, 0.));
  vP = p; vN = sd * nl.x + up * (nl.y + .35) + fw * nl.z; vUv = vec2(w, aK.z); vK = vec3(aK.y, wheel ? 3. : two ? 2. : 1., s);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const BIRD_FRAG = /* glsl */`
varying vec3 vK; uniform vec3 uBird; uniform float uTips;
void main(){
  vec3 col = uBird;
  float fl = smoothstep(.3, 1., vUv.y);                               // the trailing flight feathers
  if (vK.x > .5 && vK.x < 1.5) col = uGold * vec3(.9, .62, .22);
  else if (vK.x > 1.5 && vK.x < 2.5) col = uViolet * .3;
  col = mix(col, col * mix(vec3(.80, .82, .9), vec3(.5, .2, .3), uTips), fl * .6);                 // a soft band along the trailing edge
  col = mix(col, uViolet * .2, uTips * smoothstep(.84, .95, vUv.x) * (.4 + .6 * fl));       // ibis: only the very tips are dark
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.));
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  float under = step(dot(n, V), 0.);
  if (under > .5) n = -n;
  vec3 toSun = normalize(-vP + vec3(0., 0., 1e-3));
  vec3 lit = shellLight(vP, normalize(mix(n, toSun, .45) + vec3(0., 1e-4, 0.)), vK.y, 1., 1.);
  float vis = sunVis(vP, vK.y);
  // seen from below against the lit dome: cool shadow on the body, and the light coming through the spread feathers
  lit = mix(lit, mix(uViolet, vec3(.5, .55, .85), .45) * .55, .68 * under);
  float last = step(2.5, vK.y);                                       // the birds of the last room blaze gold where they cross the shaft from door 3
  lit = mix(lit, lit * .3, last * vis);
  lit += mix(keyColor(min(vK.y, 2.)), keyColor(1.) * 1.3, last) * (vis * (.5 - .3 * under) + under * (.03 + .26 * smoothstep(.45, 1., vUv.x)));
  vec3 c = hazed(col * lit, vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
BUILDERS.push(async (S) => {
  const { rng, V, path, U, A } = S;
  const f = [], gI = [], N1 = 60, N2 = 200, N3 = 70;
  for (let i = 0; i < N3; i++) { f.push(2, rng(), rng.gauss(), 0); gI.push(rng(), rng.range(1.6, 2.2), rng.range(7, 9.5), 0); }
  for (let i = 0; i < N1 + N2; i++) {
    const two = i >= N1, d = two ? 15 : 7;
    // flock two: this deal is kept as it was (its place by a power, 4.16 m to the side and 3.36 m up or down at most); the shader undoes the power and reads the side offset times 3.6 for the long skein
    const pl = rng(), gs = rng.gauss(), gu = rng.gauss();
    f.push(two ? 1 : 0, two ? Math.pow(pl, 0.58) : pl * 0.5, two ? clamp(gs, -1.6, 1.6) * 2.6 : gs * d * 0.5, two ? clamp(gu, -1.6, 1.6) * 2.1 : clamp(gu * 2.2, -3, 2.5));
    gI.push(rng(), rng.range(0.9, 1.15) * (two ? 1.3 : 1.15), two ? rng.range(8, 10.5) : rng.range(10.5, 13), 0);
  }
  const g = new THREE.InstancedBufferGeometry(), b = birdGeometry();
  g.index = b.index; g.setAttribute('position', b.attributes.position); g.setAttribute('normal', b.attributes.normal); g.setAttribute('aK', b.attributes.aK);
  g.setAttribute('iF', new THREE.InstancedBufferAttribute(new Float32Array(f), 4)); g.setAttribute('iG', new THREE.InstancedBufferAttribute(new Float32Array(gI), 4));
  g.instanceCount = N1 + N2 + N3;
  // flock one: off the lake, under our climb through the shaft of chamber 2, on toward the dome
  const alongside = (u, right, down) => { const q = path.pointAt(u, new THREE.Vector3()), d = path.tangentAt(u, new THREE.Vector3());
    const rt = new THREE.Vector3().crossVectors(d, V3(0, 1, 0)).normalize(), dn = new THREE.Vector3().crossVectors(d, rt).normalize(); return q.addScaledVector(rt, right).addScaledVector(dn, down); };
  // flock one: low over the lake's far shore and the terraces just under our line, then up through the shaft of chamber 2 beside us
  const uL = U.lake1, uD = U.door2, f1 = [[uL - 0.041, -4, 16], [uL - 0.026, 0, 15], [uL, 3, 10], [uL + 0.026, 9, 14], [uL + 0.056, 19, 14], [uD - 0.004, 30, 10]];
  const Q = f1.map((q) => alongside(q[0], q[1], q[2]));
  // flock two: a long skein on one course. THE COURSE IS LAID HERE, ONCE, AT BUILD, FROM THE ROUTE'S OWN LINE, AND NEVER MOVED: nothing in
  // the update lays or moves it, and nothing of it reads the eye, the camera or the clock at draw time (the update sets only how far the
  // skein has come along it, one straight line in the metres flown).
  // The course (57 points, 54 spans, even in the metres of our line): from door 2 down beside our dive, on the side of the shaft, 45 m off,
  // as far above our line as beside it where we sink under the cloud (U.sink); that offset is carried along our line without being turned
  // about it, so the course there is our own dive moved bodily and climbs about as steeply as we fall (the curve through its points overshoots our steepest 47.9 degrees: 48.2 at the most). Where our line turns under the
  // cloud the course comes over it and slides across it at a slant to our left (27 m off at the low place, U.low; its middle line's least from our whole line is 26.1 m),
  // and goes on up beside our climb, 45 m off on the left, 15 degrees above level.
  // The skein flies UP it, against our way the whole way: out of the shade over our line, into the light, on to door 2.
  // Its ribbon is 30 m across as dealt (the dealt 4.16 m to the side, read times 3.6: 29.95 m; with each bird's own sway of 1.6 m, 33.15 m at the most) and faces the place on our line 90 m before it.
  // A bird's place along the course is the metres flown times one number over the whole flight, plus its own dealt place in the skein:
  // no step, no hold. The number is an egret's pace (12.5 m/s, the middle of the third flock's 10 to 15) over our usual pace through
  // this room (183 m/s). The skein's middle is abeam of us at the world's own mark for this flock (U.flock2), its head comes to door 2
  // as we leave the world, and that makes its length.
  const kE = 12.5 / 183, mF = U.flock2 * path.length, mD = U.door2 * path.length, lenF2 = 2 * (mF - kE * (path.length - mF) - mD);
  const mA = mF * (1 + kE) + lenF2 / 2, shareF2 = lenF2 / (mA - mD);      // where the skein's tail is abeam as we enter the world; the share of its course the skein fills
  const mSk = U.sink * path.length, mLow = U.low * path.length, uOf = (m) => clamp(m / path.length, 0, 1);
  const offAt = (m, right, down) => alongside(uOf(m), right, down).sub(path.pointAt(uOf(m), new THREE.Vector3()));     // an offset from our line, by the helper
  const oDive = (m) => {                                             // the dive's offset (a unit), carried from U.sink along our line without turning about it
    const o = offAt(mSk, Math.SQRT1_2, -Math.SQRT1_2), n = Math.ceil(Math.abs(m - mSk) / 4), d = new THREE.Vector3();
    for (let i = 1; i <= n; i++) { path.tangentAt(uOf(mSk + (m - mSk) * i / n), d); o.addScaledVector(d, -o.dot(d)).normalize(); }
    return o; };
  // The typed numbers below: 45 m (the brief's distance), 15 degrees above level on our left beside the climb (what the frame holds there),
  // 30 m and 60 m (the widths of the slide across our line and of the drawing-in), 18 (45 less the 27 m at the low place), 90 m (the ribbon
  // faces the place on our line that far before it), 54 spans (the shader's 54), and the 4 m steps that carry the dive's offset.
  const C15 = Math.cos(Math.PI / 12), S15 = Math.sin(Math.PI / 12), F2 = [], F2n = [];
  for (let j = -1; j <= 55; j++) {
    const mj = mA + (mD - mA) * j / 54, x = (mj - mLow) / 30, gj = 0.5 + 0.5 * Math.tanh(x), ch = Math.cosh(x / 2);
    const o = oDive(mj).multiplyScalar(1 - gj).addScaledVector(offAt(mj, -C15, -S15), gj).normalize();      // over our line and across it, one smooth slide
    const p = path.pointAt(uOf(mj), new THREE.Vector3()).addScaledVector(o, 45 - 18 / (ch * ch));
    F2.push(p); F2n.push(p.clone().sub(path.pointAt(uOf(mj - 90), new THREE.Vector3())).normalize());
  }
  Q.push(...F2, ...F2n);
  const uF1a = uL - 0.026, uF1b = uL + 0.056;
  const ibis = V.cast === 'ibis';
  const own = { uQ: { value: Q }, uS: { value: new THREE.Vector3(0, 0, shareF2) }, uWheel: { value: A.portalSeat.position.clone().add(V3(0, 14, -40)) },
    uBird: { value: new THREE.Color(ibis ? '#F0A0AE' : '#F4F2EC') }, uTips: { value: ibis ? 1 : 0 } };
  const m = new THREE.Mesh(g, shellMat(S, BIRD_VERT, BIRD_FRAG, own, { side: THREE.DoubleSide }));
  m.frustumCulled = false; m.name = 'birds'; S.scene.add(m);
  S.onUpdate.push((dt, time, camera, u) => {
    own.uS.value.set(0.12 + 0.7 * clamp((u - uF1a) / (uF1b - uF1a), 0, 1.25) + 0.004 * Math.sin(time * 0.4),
      (1 - shareF2) * u, shareF2);      // flock two: its tail's place along its course, one straight line in the metres flown; and the skein's share
  });
});

// ---------------------------------------------------------------- seed parachutes rising off the ferns toward the axis
const SEED_VERT = /* glsl */`
${BILLBOARD}
attribute vec3 iB; attribute vec4 iS; uniform float uTime, uPx, uSeedCh; uniform vec3 uCam;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec4 vC;
#include <fog_pars_vertex>
void main(){
  // iB = where it lifts off; iS = (seed, rise in metres, speed m/s, size)
  float f = fract(iS.x + uTime * iS.z / iS.y), h = f * iS.y;
  vec3 up = normalize(vec3(-iB.xy, 0.) + vec3(0., 1e-3, 0.));
  vec3 c = iB + up * h + vec3(0., 0., 1.) * h * .3;                                   // drifting down-shell as they rise
  c += vec3(sin(uTime * .6 + iS.x * 50.), cos(uTime * .47 + iS.x * 31.), sin(uTime * .53 + iS.x * 77.)) * (1.2 + .012 * h);
  float d = length(uCam - c), size = max(iS.w, d * uPx * 1.7);
  float rot = uTime * (.4 + iS.x) + iS.x * 40., cr = cos(rot), sr = sin(rot);
  vec2 q = (uv - .5) * 2., qr = vec2(q.x * cr - q.y * sr, q.x * sr + q.y * cr);
  vec3 p = c + (camRight() * qr.x + camUp() * qr.y) * size * .5;
  float fade = smoothstep(0., .05, f) * (1. - smoothstep(.86, 1., f)) * smoothstep(1.6, 4., d) * min(1., iS.w / max(d * uPx * 1.7, 1e-3) * 1.6);
  fade *= 1. - step(2.5, uSeedCh) * smoothstep(450., 1000., d);      // the tufts along the spur are not seen from far off: piled up end-on they would smear the stars in the mouth
  vP = p; vN = up; vUv = uv; vC = vec4(fade, iS.x, 0., 0.);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const SEED_FRAG = /* glsl */`
varying vec4 vC; uniform float uSeedCh;
void main(){
  vec2 q = vUv * 2. - 1.; float r = length(q);
  if (r > 1.) discard;
  float ang = atan(q.y, abs(q.x) + 1e-4);
  float spk = abs(cos(ang * 9.5 + vC.y * 6.)); float spokes = spk * spk * spk * (1. - r) * smoothstep(.08, .3, r);
  float last = step(2.5, uSeedCh), core = 1. - smoothstep(.0, .16, r), halo = (1. - r) * (1. - r) * mix(.45, .12, last);      // against the stars a seed must stay a tuft, not a pale disc
  float a = clamp(core + spokes * .5 + halo, 0., 1.) * vC.x * .9;
  vec3 lit = (keyColor(uSeedCh) * sunVis(vP, uSeedCh) * 2.4 + mix(uViolet, vec3(.9, .93, 1.), .7) * .62) * mix(1., .6, last);
  vec3 c = hazed(vec3(.96, .95, .9) * lit, vP) * uExpo;
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`;
BUILDERS.push(async (S) => {
  const { ctx, rng, V, path } = S;
  const n = Math.round((V.rare ? 9000 : 2200) * V.detail), tops = S.fernTops, nt = tops.length / 4;
  const B = new Float32Array(n * 3), Sd = new Float32Array(n * 4), p = new THREE.Vector3(), o = new THREE.Vector3();
  const u0 = S.uAtZ(700), u1 = S.uAtZ(1000);
  for (let i = 0; i < n; i++) {
    if (i % 300 === 299) await ctx.yield();
    const air = nt === 0 || rng() < (V.rare ? 0.7 : 0.5);
    if (air) {                                                   // already aloft round our climb through the shaft
      path.pointAt(lerp(u0, u1, rng()), p);
      const rr = (V.rare ? 42 : 32) * Math.sqrt(rng()) + 4.5, a = rng() * TAU;
      o.set(Math.cos(a) * rr, Math.sin(a) * rr, rng.range(-20, 20)); p.add(o);
      const rho = Math.hypot(p.x, p.y), rise = V.rare ? Math.max(40, rho - 10) : 36, back = rng() * rise * 0.6;
      const k = rho > 1 ? (rho + back) / rho : 1; B[i * 3] = p.x * k; B[i * 3 + 1] = p.y * k; B[i * 3 + 2] = p.z - back * 0.3;
      Sd[i * 4] = rng(); Sd[i * 4 + 1] = rise; Sd[i * 4 + 2] = rng.range(1.2, 2.6); Sd[i * 4 + 3] = rng.range(0.45, 0.7) * (V.rare ? 2.2 : 1);
    } else {                                                     // lifting off a crown
      const j = rng.int(0, nt - 1) * 4, sc = tops[j + 3], rho = Math.hypot(tops[j], tops[j + 1]), k = (rho - 11 * sc) / rho;
      B[i * 3] = tops[j] * k + rng.range(-3, 3); B[i * 3 + 1] = tops[j + 1] * k + rng.range(-3, 3); B[i * 3 + 2] = tops[j + 2] + rng.range(-3, 3);
      Sd[i * 4] = rng(); Sd[i * 4 + 1] = V.rare ? rho * 0.9 : rng.range(50, 150); Sd[i * 4 + 2] = rng.range(1.2, 2.8) * (V.rare ? 1.6 : 1); Sd[i * 4 + 3] = rng.range(0.45, 0.7);
    }
  }
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 3)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(Sd, 4)); g.instanceCount = n;
  const own = { uPx: { value: 0.003 }, uSeedCh: { value: 1 } };
  S.uPx = own.uPx;
  const m = new THREE.Mesh(g, shellMat(S, SEED_VERT, SEED_FRAG, own, { transparent: true, depthWrite: false }));
  m.frustumCulled = false; m.renderOrder = 6; m.name = 'seeds'; S.scene.add(m); S.patch.push(m);
  S.onUpdate.push((dt, time, camera, u, res) => { own.uPx.value = 2 * Math.tan((camera.fov || 68) * DEG / 2) / Math.max(1, res.y); });
});

// ---------------------------------------------------------------- showers that fall outward in long curved arcs
const RAIN_VERT = /* glsl */`
attribute vec4 iR; uniform float uTime, uPx; uniform vec3 uCam; uniform vec3 uO[3]; uniform vec3 uD[3]; uniform vec3 uHR[3];
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec4 vC;
#include <fog_pars_vertex>
void main(){
  // iR = (shower 0..2, seed, offset along the axis, offset across); uHR = (height, column radius, streak length)
  int k = int(iR.x + .5);
  vec3 O = uO[k], D = uD[k], HR = uHR[k];
  float H = HR.x, f = fract(iR.y + uTime * (70. + 30. * fract(iR.y * 13.)) / H);
  float g = f + (uv.y - .5) * HR.z / H;
  vec3 e2 = normalize(cross(D, vec3(0., 0., 1.)) + vec3(1e-4, 0., 0.));
  vec3 base = O + vec3(0., 0., 1.) * iR.z * HR.y + e2 * iR.w * HR.y * (1. + 1.2 * g);        // the column flares as it falls
  vec3 c = base + D * (g * H) + vec3(0., 0., 1.) * (g * g * H * .42);                    // outward, with a growing sideways term
  vec3 vel = normalize(D + vec3(0., 0., 1.) * (g * .84) + vec3(0., 1e-4, 0.));
  vec3 toCam = normalize(uCam - c + vec3(1e-3, 0., 0.));
  vec3 across = normalize(cross(vel, toCam) + vec3(0., 1e-4, 0.));
  float d = length(uCam - c), wd = max(.22, d * uPx * 1.6);
  vec3 p = c + across * (uv.x - .5) * wd;
  float fade = smoothstep(0., .08, f) * (1. - smoothstep(.8, .98, f)) * smoothstep(20., 60., d);
  vP = p; vN = toCam; vUv = uv; vC = vec4(fade, k < 1 ? 2. : k < 2 ? 3. : 2., fract(iR.y * 7.), 0.);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RAIN_FRAG = /* glsl */`
varying vec4 vC;
void main(){
  float e = clamp(1. - abs(vUv.x * 2. - 1.), 0., 1.), l = sin(3.14159 * clamp(vUv.y, 0., 1.));
  float last = step(2.5, vC.y);                                       // the shower of the last room: bright where the shaft lights it, a pale veil against the blue beyond
  float a = e * l * l * vC.x * (.2 + .22 * vC.z) * (1. + .7 * last);
  vec3 lit = keyColor(vC.y) * sunVis(vP, vC.y) * (2.2 + 1.2 * last) + vec3(.6, .7, 1.) * .5 + vec3(.8, .9, 1.) * .3 * last;
  vec3 c = hazed(vec3(.86, .9, 1.) * lit, vP) * uExpo;
  gl_FragColor = vec4(c, a);
  #include <fog_fragment>
}`;
BUILDERS.push(async (S) => {
  const { rng, V } = S;
  const heavy = V.weather === 'heavy', n = Math.round((heavy ? 3600 : 2800) * V.detail);
  const a = new Float32Array(n * 4);
  for (let i = 0; i < n; i++) {
    if (i % 500 === 499) await S.ctx.yield();
    const r = rng(), k = heavy ? (r < 0.42 ? 0 : r < 0.74 ? 1 : 2) : (r < 0.58 ? 0 : 1), ang = rng() * TAU, rr = Math.sqrt(rng());
    a[i * 4] = k; a[i * 4 + 1] = rng(); a[i * 4 + 2] = Math.cos(ang) * rr; a[i * 4 + 3] = Math.sin(ang) * rr;
  }
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  g.setAttribute('iR', new THREE.InstancedBufferAttribute(a, 4)); g.instanceCount = n;
  const own = { uPx: S.uPx,
    uO: { value: [V3(-10, -30, 1600), V3(215, 150, 2660), V3(-30, 30, 1880)] },      // the second shower: its head in the shaft from door 3, above the axis on the +X side between door 3 and the mouth, falling outward to the cloud deck on that wall
    uD: { value: [V3(-0.34, -0.94, 0).normalize(), V3(0.82, 0.57, 0).normalize(), V3(-0.5, 0.86, 0).normalize()] },
    uHR: { value: [V3(600, 55, 34), V3(1050, 170, 76), V3(600, 60, 34)] } };
  const m = new THREE.Mesh(g, shellMat(S, RAIN_VERT, RAIN_FRAG, own, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
  m.frustumCulled = false; m.renderOrder = 4; m.name = 'showers'; S.scene.add(m);
});

// ---------------------------------------------------------------- beyond the mouth: seed tufts that have drifted out along the spur
BUILDERS.push(async (S) => {
  const { rng, V } = S;
  const n = Math.round(3000 * V.detail), B = new Float32Array(n * 3), Sd = new Float32Array(n * 4), seat = S.A.portalSeat.position;
  for (let i = 0; i < n; i++) {
    if (i % 500 === 499) await S.ctx.yield();
    const a = rng() * TAU, rr = 9 + 120 * Math.pow(rng(), 1.5), z = rng() < 0.55 ? rng.range(2500, 3760) : rng.range(2250, 4470);
    B[i * 3] = Math.cos(a) * rr * 1.9; B[i * 3 + 1] = Math.sin(a) * rr * 1.9; B[i * 3 + 2] = 2300 + (z - 2250) * 0.62;      // drawn along the shaft, out to its edge
    const ds = Math.hypot(B[i * 3] - seat.x, B[i * 3 + 1] - seat.y, B[i * 3 + 2] - seat.z);
    if (ds < 70) B[i * 3 + 1] += 150;                                           // none round the ring: it is the one cool light there
    Sd[i * 4] = rng(); Sd[i * 4 + 1] = Math.max(6, rr - 7.5); Sd[i * 4 + 2] = rng.range(0.8, 2.4); Sd[i * 4 + 3] = rng.range(0.4, 0.8);
  }
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 3)); g.setAttribute('iS', new THREE.InstancedBufferAttribute(Sd, 4)); g.instanceCount = n;
  const m = new THREE.Mesh(g, shellMat(S, SEED_VERT, SEED_FRAG, { uPx: S.uPx, uSeedCh: { value: 3 } }, { transparent: true, depthWrite: false }));
  m.frustumCulled = false; m.renderOrder = 6; m.name = 'mouthSeeds'; S.scene.add(m);
});

// ================================================================ the harbour of the last room
// A pearl bowl 430 m across, grown on a stalk that springs from the wall, holding a lagoon of blue-green water in the
// shaft of daylight from door 3. Round the water the bowl is cut into four steps (a quay and three terraces behind
// dry-stone walls), planted and built with white villages; on the mouthward side its lip swells and is drawn up into
// a spire, a turret shell of the same growth. All its light is the sun's: glass flashes gold, nothing burns.
// Everything here is laid out in the harbour's own frame (origin at the centre of the water, +Y its up, which points
// at the axis of the shell) and set into the world through H.world / uHbM.
const HB = { R: [150, 161, 176, 193, 210.5, 213.5], LV: [0.12, 0.40, 0.70, 1.0] };      // radii of quay edge, three risers, rim walk, lip; levels as parts of the rim height
const hbGardenAt = (th, k) => (k < 0.5 ? 0 : smoothstep(0.12, 0.3, Math.sin(th * (7 + 2 * k) + 1.7 * k)));      // the same rule as hbGarden below
const HB_GLSL = /* glsl */`
// uHb: centre of the water (xyz) and the angle of the spire (w); uTw: the spire's place and the height of its tip, in the
// harbour's frame; uHbM: the harbour's axes (world = uHb.xyz + uHbM * local); all declared with the shell's light
float hbRim(float th){ float d = th - uHb.w; d = atan(sin(d), cos(d)); return 30. * (1. + .24 * exp(-d * d * 8.)); }
float hbHash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// gardens and houses take turns along each terrace k (0 the quay .. 3 the rim walk): 1 where it is planted
float hbGarden(float th, float k){ return smoothstep(.12, .3, sin(th * (7. + 2. * k) + 1.7 * k)) * step(.5, k); }
`;
// The bowl, its stalk, the piers and the spire as one mesh. aSide: 0 the outside of the bowl and the stalk,
// 1 the steps and quay inside, 2 the spire, 3 piers.
async function harbourGeometry(H, ctx) {
  const P = [], SD = [], UV = [], I = [];
  const rimAt = (th) => hbRimAt(th, H.towerAng);
  const SEG = 168, R = HB.R, LV = HB.LV;
  const prof = (Hh) => {
    const q = [[2, -150, 0], [17, -146, 0]];
    for (let i = 1; i <= 11; i++) { const t = i / 11; q.push([17 + (R[5] + 1.3 - 17) * Math.pow(t, 0.8), -146 + (146 + Hh * 0.9) * Math.pow(t, 1.52), 0]); }      // a round-bottomed bowl: its outside lies under the quay and every terrace
    q.push([R[5] + 1.5, Hh * 0.96, 0], [R[5] + 1.2, Hh + 1.8, 0], [R[5] - 1, Hh + 2.6, 0.5], [R[4], Hh + 1.2, 1], [R[4], Hh, 1]);      // the rolled lip
    for (let k = 3; k >= 1; k--) q.push([R[k] + 0.4, Hh * LV[k], 1], [R[k], Hh * LV[k], 1], [R[k], Hh * LV[k - 1], 1]);
    q.push([R[0] + 0.4, Hh * LV[0], 1], [R[0], Hh * LV[0], 1], [R[0], -7, 1], [0, -7, 1]);
    return q;
  };
  const rows = prof(30).length;
  for (let j = 0; j <= SEG; j++) {
    const th = j / SEG * TAU, q = prof(rimAt(th)), c = Math.cos(th), sn = Math.sin(th);
    for (let i = 0; i < rows; i++) { P.push(q[i][0] * c, q[i][1], q[i][0] * sn); SD.push(q[i][2]); UV.push(j / SEG, i / rows); }
    if (j % 56 === 55) await ctx.yield();
  }
  for (let j = 0; j < SEG; j++) for (let i = 0; i < rows - 1; i++) { const a = j * rows + i, b = a + rows; I.push(a, a + 1, b, a + 1, b + 1, b); }
  await ctx.yield();
  // a ring-by-ring tube of revolution about a bent centre line; fn(t) -> [x, y, z, radius, v] in the harbour's frame
  const tube = (fn, rings, sides, side) => {
    const o = P.length / 3;
    for (let i = 0; i <= rings; i++) { const [x, y, z, r, v] = fn(i / rings);
      for (let k = 0; k <= sides; k++) { const a = k / sides * TAU; P.push(x + Math.cos(a) * r, y, z + Math.sin(a) * r); SD.push(side); UV.push(k / sides, v === undefined ? y : v); } }
    for (let i = 0; i < rings; i++) for (let k = 0; k < sides; k++) { const a = o + i * (sides + 1) + k, b = a + sides + 1; I.push(a, b, a + 1, a + 1, b, b + 1); }
  };
  // the stalk: a swan neck straight out from the axis to the wall 1.3 km away, thickening to its root in the land
  tube((t) => [50 * Math.sin(Math.PI * t) * (1 - 0.4 * t), -146 - 1230 * t, -80 * Math.sin(Math.PI * t * 0.9) * t, 16 + 12 * t * t + 46 * Math.pow(t, 6)], 26, 18, 0);
  // the spire: the lip drawn up into a turret shell of eight whorls, each four fifths of the one below, to a point.
  // v (the second texture coordinate) counts the whorls from the foot.
  { const tx = H.tl[0], tz = H.tl[1], y0 = H.headH - 5, y1 = y0 + 4, yT = H.towerH, tw = [[11.5, y0, -0.6], [9.6, y0 + 2.2, -0.3]];
    let s = 0, hw = 0.2 / (1 - Math.pow(0.8, 8));
    for (let k = 0; k < 8; k++) { for (let i = (k ? 1 : 0); i <= 6; i++) { const f = i / 6, sf = s + hw * f;
      tw.push([(8.6 * Math.pow(Math.max(0, 1 - sf), 0.85) + 0.1) * (0.84 + 0.26 * Math.pow(Math.max(0, Math.sin(Math.PI * f)), 0.7)), y1 + (yT - y1) * Math.min(1, sf), k + f]); } s += hw; hw *= 0.8; }
    let i = 0; tube(() => { const q = tw[i++]; return [tx, q[1], tz, q[0], q[2]]; }, tw.length - 1, 24, 2); }
  // piers: five stone moles out into the lagoon from the quay (a box each: deck 3.6 m over the water)
  H.piers = [];
  for (let k = 0; k < 5; k++) {
    const th = H.towerAng + [0.55, 1.5, 2.6, -2.2, -1.1][k], len = [54, 42, 58, 48, 58][k], wd = 4.6, c = Math.cos(th), sn = Math.sin(th), top = 3.5;
    H.piers.push({ th, len });
    const o = P.length / 3, r0 = R[0] + 2, r1 = R[0] - len;
    for (const [r, s, y] of [[r0, -1, top], [r0, 1, top], [r1, 1, top], [r1, -1, top], [r0, -1, -6], [r0, 1, -6], [r1, 1, -6], [r1, -1, -6]]) {
      P.push(r * c - s * wd * sn, y, r * sn + s * wd * c); SD.push(3); UV.push((r0 - r), s); }
    for (const f of [[0, 1, 2, 3], [0, 4, 5, 1], [1, 5, 6, 2], [2, 6, 7, 3], [3, 7, 4, 0]]) I.push(o + f[0], o + f[1], o + f[2], o + f[0], o + f[2], o + f[3]);
  }
  const v = new THREE.Vector3();
  for (let i = 0; i < P.length; i += 3) { H.world(P[i], P[i + 1], P[i + 2], v); P[i] = v.x; P[i + 1] = v.y; P[i + 2] = v.z; if (i % 30000 === 29997) await ctx.yield(); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(SD, 1));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setIndex(I);
  await ctx.yield();
  g.computeVertexNormals();
  return g;
}

const HARBOUR_VERT = /* glsl */`
attribute float aSide;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying float vSide;
#include <fog_pars_vertex>
void main(){
  vUv = uv; vP = position; vN = normal; vSide = aSide;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const HARBOUR_FRAG = HB_GLSL + /* glsl */`
uniform float uPx; varying float vSide;
void main(){
  vec3 l = (vP - uHb.xyz) * uHbM, up = uHbM[1];                         // this point in the harbour's frame; the harbour's up
  float r = length(l.xz), th = atan(l.z, l.x + 1e-4), y = l.y, Hh = hbRim(th);
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.));
  vec3 n = normalize(vN + vec3(0., 1e-5, 0.));
  if (dot(n, V) < 0.) n = -n;
  float px = length(uCam - vP) * uPx;                                   // metres per pixel here
  float ndv = clamp(dot(n, V), 0., 1.), vis = sunVis(vP, 3.), det = 1. - smoothstep(.35, 1.5, px);
  vec3 toSun = normalize(-vP + vec3(0., 0., 1e-3)), c;
  float nz = texture2D(uNoise, vec2(th * .9, y / 190.)).r, fine = texture2D(uNoise, vec2(th * 9., y / 23.)).b;
  vec3 lilac = mix(uPearl, uViolet, .55) * .6;                          // shadowed pearl
  vec3 pale = mix(uPearl, vec3(.95, .87, .74), .72);                    // the town's own stone: quarried pale and warm
  vec3 pearl = uPearl * clamp(.5 / max(dot(uPearl, vec3(.3, .55, .15)), .05), .76, 1.7) * .76;      // grown pearl, pale as the cradle's: the bowl must read from across the room
  if (vSide < .25) {
    // the outside of the bowl and its stalk, grown as the cradle is: ribs running down from the lip, a growth ring
    // every 18 m, a fringe of moss hanging under the lip, the two-hue sheen
    float rib = cos(th * 44.) * (1. - smoothstep(.35, 1.4, px / max(r, 1.) * 44.));
    float gq = (y + .45 * r) / 18., ring = smoothstep(.43, .47, abs(fract(gq) - .5)) * (1. - smoothstep(2., 9., px));
    vec3 alb = pearl * (.86 + .2 * nz) * (.94 + .06 * sin(gq * 25.13));
    alb = mix(alb, lilac, (1. - smoothstep(-.7, .3, rib)) * .7 * smoothstep(30., 90., r));
    alb = mix(alb, lilac * 1.03, ring * .6);
    float fz = texture2D(uNoise, vec2(th * 2.3, .37)).r;
    float fringe = smoothstep(Hh - 26. - 16. * fz, Hh - 12. - 8. * fz, y) * (1. - smoothstep(Hh - 3., Hh, y)) * step(100., r) * (.7 + .3 * fine);
    alb = mix(alb, mix(uForest, uGold, .45) * vec3(.42, .50, .16) * (.6 + .8 * fine), fringe * .85);
    float under = smoothstep(-110., 20., y);                           // the bowl turns under into its own shade, thin and violet
    c = alb * (shellLight(vP, n, 3., 1., 1.) * mix(.8, 1., under) + vec3(1., .84, .56) * .5 * vis * clamp(dot(n, toSun) * 1.4 + .3, 0., 1.)) + sheen(ndv, gq + rib, nz) * (.5 + .5 * vis) * (1. - fringe);
    c = mix(c, c * mix(vec3(1.), uViolet * 2.6, .5), (1. - under) * .3);
    c = mix(c, c * vec3(1.22, 1.03, .70), max(vis, .6) * .5 * (1. - fringe));                          // the shaft from behind us washes it pale gold, as it does the cradle
  } else if (vSide < 1.5) {
    // inside: dry-stone walls between the terraces, paved walks, beds of rice, mustard and roses
    vec3 gn = normalize(cross(dFdx(vP), dFdy(vP)) + vec3(0., 1e-6, 0.));
    if (dot(gn, V) < 0.) gn = -gn;
    float flatness = smoothstep(.45, .8, abs(dot(gn, up)));
    float j = r < 155.5 ? 0. : r < 168.5 ? 1. : r < 184.5 ? 2. : 3.;     // which wall this is (quay wall, three risers)
    float rj = j < .5 ? 150. : j < 1.5 ? 161. : j < 2.5 ? 176. : 193.;
    float y0 = j < .5 ? -8. : Hh * (j < 1.5 ? .12 : j < 2.5 ? .40 : .70), y1 = Hh * (j < .5 ? .12 : j < 1.5 ? .40 : j < 2.5 ? .70 : 1.);
    float s = th * rj, hgt = max(y1 - y0, .5), t = clamp((y - y0) / hgt, 0., 1.);
    float crow = floor((y - y0) / .62), cw = .75 + .8 * hbHash(vec2(crow, j + 3.));                // dry stone: every course its own stones, none two alike
    vec2 b = vec2(s / (1.5 * cw) + 7. * hbHash(vec2(crow, 7.)), (y - y0) / .62);
    vec2 bf = abs(fract(b) - .5);
    float joint = smoothstep(.34, .47, max(bf.x, bf.y)) * det, bh = hbHash(floor(b) + 3.7);
    vec3 stone = mix(pale * .86, mix(pale, uViolet, .34) * .56, mix(.5, bh * bh, det)) * (.84 + .3 * fine) * (1. - .5 * joint);
    stone = mix(stone, pale * vec3(1.04, .90, .70) * .8, step(.78, bh) * det * .6);                     // a rusty stone here and there
    vec2 lb = vec2(s / 2.7 + .5 * floor((y - y0) / 1.86), (y - y0) / 1.86);                            // built in lifts of big footing stones: these still read from across the lagoon
    stone *= .86 + .28 * hbHash(floor(lb) + j * 11.) * (1. - smoothstep(.9, 2.6, px));
    float bq = abs(fract(s / 10.4) - .5), butt = smoothstep(.40, .46, bq);                            // a buttress every ten metres, its shadow beside it
    stone *= 1. + .16 * butt - .12 * smoothstep(.30, .40, bq) * (1. - butt);
    float fs = fract(s / 41.6) * 2.6, st = abs(t - fs), stair = (1. - smoothstep(.6, 1.1, st * hgt)) * step(fs, 1.) * step(.5, j);      // a flight of steps up each wall, one to a block
    stone = mix(stone, pale * (.74 + .26 * step(.45, fract((y - y0) / .42))), stair * .85 * mix(.6, 1., det));                          // tread by tread
    float hang = smoothstep(.45, .7, texture2D(uNoise, vec2(s / 37., j * .37)).g) * smoothstep(.55, 1., t + .3 * (fine - .5));   // plants spilling over the top
    stone = mix(stone, mix(uForest, uGold, .3) * vec3(.62, .78, .40), hang * .8 * step(.5, j) * (1. - stair));
    // here and there a tall wall carries a planted ledge: a dry-stone lip and a few metres of green, mustard or blossom trailing over it
    float lq = (y - y0) / 3.3, lf = fract(lq), lseg = s / 6.5 + 3.1 * floor(lq), lh = hbHash(vec2(floor(lq) + j * 5., floor(lseg)));
    float lend = smoothstep(.0, .16 + .2 * fine, .5 - abs(fract(lseg) - .5));                          // each ledge ends raggedly
    float ledge = step(5., hgt) * step(.5, j) * step(.5, floor(lq)) * step(lh, .5) * lend * (1. - stair) * (1. - smoothstep(.34, .46 + .2 * (fine - .5), lf)) * (1. - smoothstep(hgt - 1.4, hgt - .8, y - y0));
    vec3 lcrop = lh < .22 ? vec3(.36, .58, .20) : lh < .37 ? vec3(.80, .64, .17) : vec3(.84, .44, .50);
    stone = mix(stone, lcrop * (.7 + .5 * fine) * (.75 + .5 * smoothstep(.0, .3, lf)), ledge * .92);
    stone *= 1. - .25 * step(5., hgt) * step(.5, j) * step(lh, .5) * lend * smoothstep(.46, .56, lf) * (1. - smoothstep(.56, .8, lf));      // and its shadow on the stones below
    float wet = (1. - smoothstep(-.5, 2.2, y)) * step(j, .5);                                        // the quay wall: darker and weedy at the water line
    stone = mix(stone, mix(uForest * .4, uViolet * .5, .5), wet * .8);
    vec3 wall = stone * shellLight(vP, gn, 3., 1., 1.) * (.78 + .22 * t);
    float k = r < 161. ? 0. : r < 176. ? 1. : r < 193. ? 2. : 3.;       // which walk
    float r0 = k < .5 ? 150. : k < 1.5 ? 161. : k < 2.5 ? 176. : 193., r1 = k < .5 ? 161. : k < 1.5 ? 176. : k < 2.5 ? 193. : 210.5, rl = r0 + 8.;
    float slabOn = 1. - smoothstep(.5, 2., px);
    float gr = texture2D(uNoise, l.xz / 9.3).b, gr2 = texture2D(uNoise, l.xz / 31.).r;               // the grain of the ground: as fine one way across a walk as the other
    vec2 sc = vec2(r / 2.6, th * rl / 3.4 + .5 * floor(r / 2.6)), sf = abs(fract(sc) - .5);         // paving: slabs 2.6 by 3.4 m, each its own tone, a dark joint between
    float slab = (1. - .3 * smoothstep(.38, .48, max(sf.x, sf.y)) * slabOn) * (.9 + .2 * hbHash(floor(sc) + k * 5.) * slabOn);
    vec3 pave = pale * .80 * (.84 + .16 * gr + .12 * gr2) * slab;
    float gdn = hbGarden(th, k), gd = gdn * smoothstep(r0 + 1.6, r0 + 2.6, r);
    // between the houses of a village: kitchen plots, each a few rows of green, mustard or blossom, in swept earth
    vec2 pc = vec2(th * rl / 6.2, (r - r0) / 5.4); vec2 pi = floor(pc), pf = fract(pc); float ph = hbHash(pi + k * 9.3);
    float plot = step(.5, k) * (1. - gdn) * step(.34, ph) * smoothstep(.06, .12, min(min(pf.x, 1. - pf.x), min(pf.y, 1. - pf.y))) * smoothstep(r0 + 1.6, r0 + 2.6, r);
    vec3 pcrop = ph < .62 ? vec3(.38, .58, .22) : ph < .82 ? vec3(.78, .62, .18) : vec3(.82, .44, .50);
    pave = mix(pave, mix(pale * vec3(.86, .74, .58) * .8, pcrop, .35 + .65 * smoothstep(.3, .45, abs(fract(pf.x * 4.) - .5)) * mix(1., slabOn, .6)) * (.8 + .4 * gr), plot);
    // a planted terrace: beds seven to nine metres long between low walls, each with its own crop set out plant by plant
    // in rows that run across the terrace in one bed and along it in the next
    float bw = 7. + 2. * hbHash(vec2(floor(th * rl / 34.), k)), bx = th * rl / bw, bed = floor(bx), bhs = hbHash(vec2(bed, k * 3.7 + 2.));
    vec3 crop = bhs < .45 ? vec3(.40, .60, .20) : bhs < .75 ? vec3(.80, .64, .17) : mix(uRose, vec3(.82, .42, .47), .5) * .85;
    float across = step(.5, fract(bhs * 7.7));
    vec2 gc = mix(vec2(th * rl / .95, (r - r0) / 1.5), vec2(th * rl / 1.5, (r - r0) / .95), across), gf = fract(gc) - .5;
    float tuft = 1. - smoothstep(.2, .46, length(gf * mix(vec2(.8, 1.), vec2(1., .8), across) + vec2(1e-4, 0.)) + .25 * (hbHash(floor(gc) + bed) - .5));
    vec3 earth = pale * vec3(.80, .66, .50) * .62;
    vec3 planted = mix(mix(earth, crop * (.8 + .5 * hbHash(floor(gc))), tuft), mix(earth, crop, .55), 1. - slabOn);
    float hedge = smoothstep(.40, .47, abs(fract(bx) - .5));                                          // a low wall between beds
    vec3 garden = mix(planted * (.8 + .4 * gr), pale * .66, hedge * .7);
    float kerb = 1. - smoothstep(.9, 1.5, r - r0);                                                     // the dry-stone lip of each terrace
    vec3 ground = mix(mix(pave, garden, gd), pale * .84 * (.85 + .3 * gr), kerb * .8);
    ground *= 1. - .34 * smoothstep(r1 - 2.6, r1 - .3, r) * step(k, 2.5);                              // the foot of the wall behind stands in that wall's shade
    vec3 walk = ground * shellLight(vP, normalize(up + toSun * .8), 3., 1., 1.) * 1.08;                // the sun is low behind us: what stands on the walks takes it full
    c = mix(wall, walk, flatness);
    c = mix(c, pearl * shellLight(vP, n, 3., 1., 1.), smoothstep(210., 211.5, r));                     // the rolled lip
  } else if (vSide < 2.5) {
    // the spire: a turret shell of the bowl's own pearl. Whorl on whorl with a seam of thin violet shade between,
    // fine ribs down each and a cord wound round it, the two-hue sheen; a few slit windows in its three lowest whorls.
    vec3 lt = l - vec3(uTw.x, l.y, uTw.z); float ta = atan(lt.z, lt.x + 1e-4), wv = vUv.y, wf = fract(wv), wk = floor(wv);
    float seam = 1. - smoothstep(.0, .13, min(wf, 1. - wf));
    float ribs = cos(ta * 16. + wk * 1.3) * (1. - smoothstep(.4, 2., px));
    float cord = smoothstep(.41, .48, abs(fract(wf * 3. + ta / 6.2831853) - .5)) * (1. - smoothstep(.3, 1.2, px));
    vec3 alb = pearl * (.88 + .16 * nz) * (.93 + .07 * ribs);
    alb = mix(alb, lilac, max(seam * .6, (1. - smoothstep(-.9, -.2, ribs)) * .2));
    alb = mix(alb, lilac * 1.05, cord * .22);
    float wc = ta / 6.2831853 * 5. + wk * .37;
    float slit = (1. - smoothstep(.03, .05, abs(fract(wc) - .5))) * step(.34, wf) * step(wf, .72) * step(0., wv) * step(wv, 3.) * step(.35, hbHash(vec2(wk, floor(wc))));
    slit *= 1. - smoothstep(1.5, 5., px);
    c = alb * (shellLight(vP, n, 3., 1., 1.) + vec3(1., .84, .56) * .5 * vis * clamp(dot(n, toSun) * 1.4 + .3, 0., 1.));
    c = mix(c, c * vec3(1.22, 1.03, .70), max(vis, .6) * .6);                                          // washed pale gold from behind us, as the cradle
    c = mix(c, vec3(.05, .07, .12), slit);                                                             // the slits stay dark
    c += sheen(ndv, wv * 1.5 + ribs * .3, nz) * (.5 + .5 * vis) * (1. - slit);
  } else {
    // jetties: coursed stone, weedy at the water line
    float top = smoothstep(.5, .8, abs(dot(n, up)));
    vec2 b = vec2(vUv.x / 1.8, mix(y / .6, vUv.y * 3.5, top)); b.x += .5 * floor(b.y);
    vec2 bf = abs(fract(b) - .5);
    float joint = smoothstep(.38, .47, max(bf.x, bf.y)) * det;
    vec3 stone = mix(pale * .78, mix(pale, uViolet, .3) * .62, texture2D(uNoise, floor(b) / 64. + .31).r) * (.85 + .25 * fine) * (1. - .4 * joint);
    stone = mix(stone, mix(uForest * .4, uViolet * .5, .5), (1. - smoothstep(-.3, 1.6, y)) * (1. - top) * .8);
    c = stone * shellLight(vP, mix(n, up, top), 3., 1., 1.) * mix(.8, 1.05, top);
  }
  c = hazed(c, mix(vP, uCam, .3)) * uExpo;                              // the harbour is the near thing of the room: it keeps more of its colour than the land beyond
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// The lagoon: blue-green water in daylight. It mirrors no scenery: its own blue-green body, the blue of the far land,
// a little of the mouth's indigo, ripples, and gold where the shaft lies.
const LAGOON_FRAG = /* glsl */`
void main(){
  vec3 l = (vP - uHb.xyz) * uHbM; float r = length(l.xz), d = length(uCam - vP);      // in the harbour's frame, as the view below
  vec3 V = normalize(uCam - vP + vec3(1e-3, 0., 0.)) * uHbM;
  float near = 1. - smoothstep(120., 520., d);
  vec2 q = l.xz;
  vec3 nA = texture2D(uNoise, q / 61. + vec2(uTime * .009, uTime * .005)).rgb - .5;
  vec3 nB = texture2D(uNoise, q / 13.7 - vec2(uTime * .021, -uTime * .014)).gbr - .5;
  vec3 nC = texture2D(uNoise, q / 4.1 + vec2(-uTime * .05, uTime * .04)).brg - .5;
  vec2 tilt = nA.xy * .16 + nB.xy * .12 * (.35 + .65 * near) + nC.xy * .10 * near * near;
  vec3 n = normalize(vec3(tilt.x, 1., tilt.y));
  vec3 R = reflect(-V, n); R.y = abs(R.y) + .015; R = normalize(R);
  float ndv = clamp(dot(n, V), 0., 1.), x = 1. - ndv, fres = .04 + .96 * x * x * x * x * x;
  float vis = sunVis(vP, 3.);
  vec3 sky = uHaze * vec3(.64, .78, 1.) * (.62 + .3 * (1. - R.y));                              // the blue of the far land
  sky = mix(sky, vec3(.05, .07, .16), .55 * smoothstep(.6, .9, dot(uHbM * R, vec3(0., .17, .985))));   // and, toward the mouth, a little of its indigo
  vec3 body = mix(uSea * vec3(.36, .62, .68), uSea * vec3(.66, .96, .90), exp(-max(150. - r, 0.) / 30.) * .6);      // blue-green, paler in the shallows under the quay
  float rip = smoothstep(.3, .7, texture2D(uNoise, q / 6.3 + vec2(uTime * .03, -uTime * .02)).g + nB.y * near);      // ripples
  vec3 lagoonLit = body * shellLight(vP, uHbM[1], 3., 1., 1.) * .62;
  vec3 c = lagoonLit * (1. - fres) + sky * (.86 + .28 * rip) * (.12 + .88 * fres);
  c += mix(uPearl, keyColor(3.), .5) * (nB.x + nC.x * near) * .10 * (.4 + .6 * vis);            // light on the backs of the ripples
  float g = texture2D(uNoise, q / 9. + vec2(uTime * .06, -uTime * .045)).r * texture2D(uNoise, q / 3.3 - vec2(uTime * .11, uTime * .08)).g;
  c += keyColor(1.) * smoothstep(.40, .58, g) * vis * (.25 + .75 * near) * 1.5;                 // the sun on the water: a glint, where the shaft lies
  c = hazed(max(c, vec3(0.)), vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

// window glints: a flash of daylight on glass, never a lamp. One to a house, and one to the spire (iS = width m, 0,
// seed, the wall's heading in the harbour's frame); it shows only while a pane (a casement standing open at its own
// angle) throws the sun toward the eye, so the flashes run along the terraces as the view turns, and it is brightest
// where the shaft from door 3 lies. Drawn as a hard gold lozenge with four thin rays.
const GLINT_VERT = /* glsl */`
${BILLBOARD}
attribute vec3 iP; attribute vec4 iS;
uniform float uTime, uPx, uExpo; uniform vec3 uCam; uniform mat3 uHbM;
varying vec2 vUv; varying vec4 vC;
float dVis(vec3 p, float zd, float rd){ float k = max(p.z - zd, 0.) / zd, rho = length(p.xy); return 1. - smoothstep(rd + (rd - 60.) * k - 2., rd + (rd + 60.) * k + 2., rho); }
void main(){
  vec3 c = iP; float d = max(length(uCam - c), 1.);
  vec3 V = (uCam - c) / d, s = normalize(-c + vec3(0., 0., 1e-3));       // to the eye, to the sun
  vec2 Vl = (V * uHbM).xz, sl = (s * uHbM).xz;                           // the same across the harbour's own plan
  vec2 h = Vl + sl; h /= max(length(h), 1e-3);                           // a wall facing this way mirrors the sun to the eye
  float best = 0.;
  for (int k = 0; k < 4; k++) {
    float a = iS.w + (iS.z - .5) * 1.2 + float(k) * 1.5707963; vec2 n = vec2(sin(a), cos(a));      // casements stand open at their own angles
    float f = max(dot(n, h), 0.); f *= f; f *= f; f *= f; f *= f; f *= f;                     // a lobe about 12 degrees wide
    best = max(best, f * step(0., dot(n, Vl)) * step(0., dot(n, sl)));
  }
  float vis = dVis(c, 210., 45.) * dVis(c, 1010., 95.) * dVis(c, 2210., 210.);
  float wmin = d * uPx * 1.7, wd = max(iS.x, wmin);     // its own width in metres (iS.x); under that, only the floor against flicker that the seeds have (1.7 pixels, SEED_VERT)
  float gain = best * (.22 + .78 * vis) * (.8 + .2 * sin(uTime * (1.3 + 2.4 * iS.z) + iS.z * 60.)) * exp(-d / 5200.) * min(1., iS.x / max(d * uPx * 1.7, 1e-3) * 1.6);      // and dimmed by how far its own width is under that floor, the form live's seeds have (live world:1159)
  c += V * 4.4;                                                          // stand clear of the wall
  vec3 p = c + (camRight() * (uv.x - .5) + camUp() * (uv.y - .5)) * wd;
  vUv = uv; vC = vec4(vec3(1., .79, .36) * 1.12, gain * 1.8);            // #FFE6A3, laid over what is behind it (not added: on a white wall an added light would only be white)
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.);
}`;
const GLINT_FRAG = /* glsl */`
varying vec2 vUv; varying vec4 vC;
void main(){
  vec2 q = vUv * 2. - 1.; float r2 = dot(q, q);
  if (r2 > 1.) discard;
  float f = 1. - r2, star = exp(-abs(q.x) * 26.) * exp(-abs(q.y) * 4.) + exp(-abs(q.y) * 26.) * exp(-abs(q.x) * 4.);
  float core = 1. - smoothstep(.34, .48, abs(q.x) + abs(q.y));                                  // a hard-edged lozenge and four thin rays: light off a pane, not a globe
  gl_FragColor = vec4(vC.rgb, clamp(vC.a * (core + star * 1.1 * f), 0., 1.));      // no halo round it
}`;
// lugsail boats on the lagoon: white hulls, one tan sail, gold where the shaft falls on them
const HBOAT_VERT = /* glsl */`
attribute vec3 iP; attribute vec4 iS; attribute vec4 iM; attribute vec2 aK;
uniform float uTime; uniform mat3 uHbM;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  float a = iM.z + iM.y * uTime / max(iM.x, 1.), sg = iM.y < 0. ? -1. : 1.;
  vec3 c = iP + uHbM * vec3(cos(a), 0., sin(a)) * iM.x;                 // rounds lie in the plane of the harbour's water; masts stand along its up
  vec3 fwd = uHbM * vec3(-sin(a), 0., cos(a)) * sg, up = uHbM[1], side = cross(up, fwd);
  vec3 l = position, n = normal;
  float sd = sin(iS.z * 50.) > 0. ? 1. : -1., hl = sd * .16 * (1. + .25 * sin(uTime * .9 + iS.z * 30.));
  if (aK.x > 2.5) l.x += sd * aK.y * (1.05 + .2 * sin(uTime * 2.6 + iS.z * 20. + position.y * .8));
  float ch = cos(hl), sh = sin(hl);
  l = vec3(l.x * ch - l.y * sh, l.x * sh + l.y * ch, l.z); n = vec3(n.x * ch - n.y * sh, n.x * sh + n.y * ch, n.z);
  l.y += l.z * .04 * sin(uTime * 1.3 + iS.z * 44.) + .14 * sin(uTime * 1.1 + iS.z * 70.) - .1;
  l *= iS.x;
  vec3 p = c + side * l.x + up * l.y + fwd * l.z;
  vP = p; vN = side * n.x + up * n.y + fwd * n.z; vUv = uv; vK = vec3(aK.x, iS.z, aK.y);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const HBOAT_FRAG = /* glsl */`
varying vec3 vK; uniform vec3 uSail;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.)), V = normalize(uCam - vP + vec3(1e-3, 0., 0.)), col;
  if (dot(n, V) < 0.) n = -n;
  float cloth = step(2.5, vK.x);
  if (vK.x < .5) { float v = abs(vUv.y * 2. - 1.); col = mix(vec3(.88, .87, .84), uRose * .7, smoothstep(.80, .84, v) * (1. - smoothstep(.93, .95, v))); col = mix(col, uViolet * .3, 1. - smoothstep(0., .2, v)); }
  else if (vK.x < 1.5) col = mix(uPearl, uGold, .45) * .6;
  else if (vK.x < 2.5) col = mix(uViolet, uGold, .5) * .34;
  else col = mix(uSail, vec3(.70, .50, .30), .6) * (1. - .4 * (1. - smoothstep(0., .035, abs(fract(vUv.y * 5. + .5) - .5))));      // a tan lugsail
  vec3 toSun = normalize(-vP + vec3(0., 0., 1e-3));
  float ndl = mix(clamp(dot(n, toSun) * .6 + .5, 0., 1.), 1., cloth * .7);                    // the cloth lets the light through
  vec3 c = col * (shellLight(vP, n, 3., 1., 1.) * 1.15 + keyColor(1.) * sunVis(vP, 3.) * ndl * .75);
  c = hazed(c, vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;
// A village house of the harbour: a lime-washed cube 5 m on a side under a hipped roof of rose tiles
// (parts as houseGeometry: 0 wall, 1 roof; flag 1 the wall with the door). Lit and painted by HOUSE_FRAG.
function cubeHouseGeometry() {
  const P = [], Nn = [], UV = [], K = [], I = [];
  const face = (pts, uvs, part, flag) => {
    const [a, b, c] = pts, e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], il = 1 / (Math.hypot(n[0], n[1], n[2]) || 1), o = P.length / 3;
    pts.forEach((q, i) => { P.push(q[0], q[1], q[2]); Nn.push(n[0] * il, n[1] * il, n[2] * il); UV.push(uvs[i][0], uvs[i][1]); K.push(part, flag); });
    for (let i = 2; i < pts.length; i++) I.push(o, o + i - 1, o + i);
  };
  const X = 2.5, H = 3.3, ex = X + 0.4, ey = H - 0.2, RH = 4.9, sl = Math.hypot(ex, RH - ey), W = 4.2;      // W: two window bays to a wall
  const wall = (x0, z0, x1, z1, flag) => face([[x0, 0, z0], [x1, 0, z1], [x1, H, z1], [x0, H, z0]], [[0, 0], [W, 0], [W, H], [0, H]], 0, flag);
  wall(-X, X, X, X, 1); wall(X, X, X, -X, 0); wall(X, -X, -X, -X, 0); wall(-X, -X, -X, X, 0);
  const c = [[-ex, ex], [ex, ex], [ex, -ex], [-ex, -ex]];
  for (let i = 0; i < 4; i++) { const a = c[i], b = c[(i + 1) % 4]; face([[a[0], ey, a[1]], [b[0], ey, b[1]], [0, RH, 0]], [[0, 0], [2 * ex, 0], [ex, sl]], 1, 0); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(Nn, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2)); g.setAttribute('aK', new THREE.Float32BufferAttribute(K, 2)); g.setIndex(I);
  return g;
}
// houses that stand along the harbour's up: iPos the foot, iRot = (heading in the harbour's frame, scale, seed, 0); one storey or two, as HOUSE_VERT
const HHOUSE_VERT = /* glsl */`
attribute vec3 iPos; attribute vec4 iRot; attribute vec2 aK; uniform mat3 uHbM;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  float cy = cos(iRot.x), sy = sin(iRot.x);
  vec3 sd = uHbM * vec3(cy, 0., -sy), fw = uHbM * vec3(sy, 0., cy), hu = uHbM[1], l = position; vec2 q = uv;
  float xs = .84 + .5 * fract(iRot.z * 7.31);                         // long or short
  if (abs(normal.x) < .6) q.x *= xs;
  l.x *= xs;
  float up2 = step(.7, fract(iRot.z * 3.17)) * 2.7 * step(2.99, l.y);
  l.y += up2; if (aK.x < .5) q.y += up2;
  vec3 p = iPos + (sd * l.x + hu * l.y + fw * l.z) * iRot.y;
  vP = p; vN = sd * normal.x + hu * normal.y + fw * normal.z; vUv = q; vK = vec3(aK.x, iRot.z, aK.y);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// the small things of a village: a domed well, washing on its lines. aQ = (part, seed, sway x, sway z):
// part 0 the well's stone, 1 its dome, 2 posts, 3 a line, 4 cloth (its hem sways)
const HPROP_VERT = /* glsl */`
attribute vec4 aQ; uniform float uTime; uniform mat3 uHbM;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec3 vK;
#include <fog_pars_vertex>
void main(){
  vec3 p = position;
  p += uHbM * vec3(aQ.z, 0., aQ.w) * (.4 + .6 * sin(uTime * 1.9 + position.x * .31 + position.z * .23 + aQ.y * 20.) + .25 * sin(uTime * 3.1 + aQ.y * 50.));
  vP = p; vN = normal; vUv = uv; vK = vec3(aQ.x, aQ.y, 0.);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const HPROP_FRAG = /* glsl */`
varying vec3 vK;
void main(){
  vec3 n = normalize(vN + vec3(0., 1e-4, 0.)), V = normalize(uCam - vP + vec3(1e-3, 0., 0.)), col;
  if (dot(n, V) < 0.) n = -n;
  float cloth = step(3.5, vK.x) * step(vK.x, 4.5);
  if (vK.x < .5) { vec2 b = vUv * vec2(1.6, 3.2); b.x += .5 * floor(b.y); vec2 f = abs(fract(b) - .5);
    col = mix(vec3(.84, .78, .68), vec3(.62, .58, .58), texture2D(uNoise, floor(b) / 64. + .47).r) * (1. - .4 * smoothstep(.36, .47, max(f.x, f.y))); }
  else if (vK.x < 1.5) col = vec3(.86, .84, .80);
  else if (vK.x < 2.5) col = mix(uViolet, uGold, .4) * .42;
  else if (vK.x < 3.5) col = uPearl * .8;
  else if (vK.x < 4.5) { float h = fract(vK.y * 7.3);
    col = h < .42 ? vec3(.9, .89, .86) : h < .64 ? mix(uRose, vec3(.85, .45, .5), .4) : h < .82 ? uSea * .9 : mix(uGold, vec3(.85, .65, .2), .5) * .9;
    col *= .9 + .1 * sin(vUv.x * 30.); }
  else if (vK.x < 5.5) col = mix(uViolet, vec3(.36, .26, .18), .6) * (.7 + .3 * step(.5, fract(dot(vP - uHb.xyz, uHbM[1]) * 1.4)));      // a ringed trunk
  else if (vK.x < 6.5) { float rib = abs(vUv.x - .5) * 2., pv = vUv.y * 13. - rib * 1.5, pf = fract(pv);           // a frond: a pale midrib and pinnae either side with air between them, paler toward the tip
    float near = 1. - smoothstep(.25, .6, fwidth(pv));                                                       // (from far off the frond closes up into one blade)
    if (rib > .13 && pf < .36 * near) discard;
    col = mix(mix(uForest, uGold, .22) * vec3(.62, .95, .52), mix(uGold, uForest, .4) * vec3(.9, 1.1, .6), vUv.y * .7) * (.62 + .38 * smoothstep(.36, .6, pf)) * (.75 + .25 * rib);
    col = mix(col, mix(uGold, vec3(.8, .9, .5), .5) * .8, 1. - smoothstep(.0, .12, rib)); }
  else { vec2 fq = vUv - .5; float fr = dot(fq, fq) * 4.;                                                      // fiddleheads: pale curls at the heart of the crown
    if (fr > 1.) discard;
    col = mix(mix(uGold, vec3(.8, .9, .5), .5), mix(uForest, uGold, .3) * vec3(.7, 1., .55), smoothstep(.3, .5, fract(fr * 2.5 + atan(fq.y, fq.x + 1e-4) * .955))) * .9; }
  vec3 c = col * (shellLight(vP, n, 3., 1., 1.) + keyColor(3.) * sunVis(vP, 3.) * .35 * cloth);      // cloth lets the light through
  c = hazed(c, vP) * uExpo;
  gl_FragColor = vec4(c, 1.);
  #include <fog_fragment>
}`;

BUILDERS.push(async (S) => {
  const { ctx, V, H } = S, rng = ownStream(S.rng, 'harbour'), C = H.c, parts = S.harbour = [], _w = new THREE.Vector3();
  const at = (x, y, z) => H.world(x, y, z, _w);                          // a point of the harbour's frame, in the world
  S.sh.uHb.value.set(C.x, C.y, C.z, H.towerAng);
  S.sh.uTw.value.set(H.tl[0], H.towerH, H.tl[1], 0);
  S.sh.uHbM.value.set(H.X.x, H.Y.x, H.Z.x, H.X.y, H.Y.y, H.Z.y, H.X.z, H.Y.z, H.Z.z);
  await ctx.yield();
  const hg = await harbourGeometry(H, ctx);
  await ctx.yield();
  const add = (m, name, order) => { m.frustumCulled = false; m.name = name; if (order !== undefined) m.renderOrder = order; S.scene.add(m); parts.push(m); return m; };
  add(new THREE.Mesh(hg, shellMat(S, HARBOUR_VERT, HARBOUR_FRAG, { uPx: S.uPx }, { side: THREE.DoubleSide })), 'harbour');
  const wg = new THREE.CircleGeometry(HB.R[0] + 0.6, 72).rotateX(-Math.PI / 2).applyMatrix4(new THREE.Matrix4().makeBasis(H.X, H.Y, H.Z).setPosition(C));
  add(new THREE.Mesh(wg, shellMat(S, STONE_VERT, LAGOON_FRAG)), 'lagoon');
  await ctx.yield();
  const rimAt = (th) => hbRimAt(th, H.towerAng);
  const tl = V3(H.tl[0], 0, H.tl[1]);
  // ---- the villages: white cubes under rose tiles, their backs to the terrace walls, their doors to the water; none
  // where a terrace is planted. Each has one glint of daylight on its glass.
  const hp = [], hr = [], gP = [], gS = [], cap = Math.round(640 * Math.max(0.7, V.detail));
  for (const [k, rad, p] of [[0, 157.6, 0.5], [1, 172.4, 0.9], [2, 189.4, 0.9], [2, 181.4, 0.45], [3, 206.0, 0.9], [3, 198.6, 0.5]]) {
    let th = rng() * 0.02;
    while (th < TAU) {
      const sc = rng.range(0.86, 1.14), seed = rng(), wdt = 5 * sc * (0.84 + 0.5 * ((seed * 7.31) % 1)) + rng.range(0.6, 2.8), a = th + wdt / rad / 2, pick = rng(), jit = rng.range(-0.2, 0.2), set = rng.range(-0.9, 0.5);
      th += wdt / rad;
      const x = (rad + set) * Math.cos(a), z = (rad + set) * Math.sin(a);
      if (hbGardenAt(a, k) > 0.02 || pick > p || Math.hypot(x - tl.x, z - tl.z) < 17 || hp.length / 3 >= cap) continue;
      const y = rimAt(a) * HB.LV[k], yaw = Math.atan2(-Math.cos(a), -Math.sin(a)) + jit;
      at(x, y, z); hp.push(_w.x, _w.y, _w.z); hr.push(yaw, sc, seed, 0);
      at(x, y + 1.9 * sc, z); gP.push(_w.x, _w.y, _w.z); gS.push(1.5, 0, seed, yaw);
    }
    await ctx.yield();
  }
  add(new THREE.Mesh(instanced(cubeHouseGeometry(), hp, hr), shellMat(S, HHOUSE_VERT, HOUSE_FRAG, { uHCh: { value: 3 } }, { side: THREE.DoubleSide })), 'harbourHouses');
  await ctx.yield();
  // ---- a domed well on each walk, washing on its lines between the houses and the terrace lip
  const PP = [], PN = [], PU = [], PQ = [], PI = [];
  const pq = (pts, part, seed, sway) => {
    const [a, b, c] = pts, e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], il = 1 / (Math.hypot(n[0], n[1], n[2]) || 1), o = PP.length / 3;
    pts.forEach((q, i) => { PP.push(q[0], q[1], q[2]); PN.push(n[0] * il, n[1] * il, n[2] * il); PU.push(q[3] || 0, q[4] || 0); PQ.push(part, seed, sway ? sway[i][0] : 0, sway ? sway[i][1] : 0); });
    for (let i = 2; i < pts.length; i++) PI.push(o, o + i - 1, o + i);
  };
  const post = (x, z, hw, y0, y1, part) => { const q = [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]];
    for (let i = 0; i < 4; i++) { const a = q[i], b = q[(i + 1) % 4]; pq([[x + a[0], y0, z + a[1]], [x + b[0], y0, z + b[1]], [x + b[0], y1, z + b[1]], [x + a[0], y1, z + a[1]]], part, 0); } };
  // sizes that read from the air: a well-house 4 m across under its white dome, linen on 3.4 m poles
  const well = (x, y, z) => {
    const N = 12, W = 1.6, cs = (i, r) => [x + r * W * Math.cos(i / N * TAU), z + r * W * Math.sin(i / N * TAU)];
    for (let i = 0; i < N; i++) { const a = cs(i, 1.25), b = cs(i + 1, 1.25), u0 = i * 0.785 * W, u1 = u0 + 0.785 * W;
      pq([[b[0], y, b[1], u1, 0], [a[0], y, a[1], u0, 0], [a[0], y + 0.9 * W, a[1], u0, 0.9 * W], [b[0], y + 0.9 * W, b[1], u1, 0.9 * W]], 0, 0);
      for (let j = 0; j < 3; j++) { const e0 = j / 3 * Math.PI / 2, e1 = (j + 1) / 3 * Math.PI / 2, r0 = 1.5 * Math.cos(e0), r1 = 1.5 * Math.cos(e1), y0 = y + W * (2.3 + 1.2 * Math.sin(e0)), y1 = y + W * (2.3 + 1.2 * Math.sin(e1));
        const a0 = cs(i, r0), b0 = cs(i + 1, r0), a1 = cs(i, r1), b1 = cs(i + 1, r1);
        pq(j < 2 ? [[b0[0], y0, b0[1]], [a0[0], y0, a0[1]], [a1[0], y1, a1[1]], [b1[0], y1, b1[1]]] : [[b0[0], y0, b0[1]], [a0[0], y0, a0[1]], [a1[0], y1, a1[1]]], 1, 0); } }
    for (let i = 0; i < 6; i++) post(x + 1.12 * W * Math.cos(i * TAU / 6 + 0.6), z + 1.12 * W * Math.sin(i * TAU / 6 + 0.6), 0.16, y + 0.9 * W, y + 2.32 * W, 2);
  };
  const washing = (x, y, z, tx, tz, len) => {
    const PH = 3.4;
    post(x - tx * len / 2, z - tz * len / 2, 0.11, y, y + PH + 0.1, 2); post(x + tx * len / 2, z + tz * len / 2, 0.11, y, y + PH + 0.1, 2);
    const at = (s, yy) => [x + tx * s, y + yy, z + tz * s];
    pq([at(-len / 2, PH - 0.05), at(len / 2, PH - 0.05), at(len / 2, PH + 0.04), at(-len / 2, PH + 0.04)], 3, 0);
    let s = -len / 2 + rng.range(0.3, 0.7);
    while (s < len / 2 - 2.0) { const w = rng.range(1.2, 2.6), h = rng.range(1.3, 2.6), sd = rng(), sw = [-tz * 0.3 * h, tx * 0.3 * h];
      pq([[...at(s, PH - h), 0, 0], [...at(s + w, PH - h), w, 0], [...at(s + w, PH), w, h], [...at(s, PH), 0, h]], 4, sd, [sw, sw, [0, 0], [0, 0]]); s += w + rng.range(0.1, 0.6); }
  };
  // a tree-fern: a ringed trunk and a crown of nine fronds that arch up and out and droop at their tips, each cut
  // into pinnae either side of its midrib (HPROP_FRAG), with a pale knot of fiddleheads at the heart: seen crown-on from the air
  const fern = (x, y, z, h, R, sd) => {
    post(x, z, 0.34, y, y + h, 5);
    const a0 = sd * TAU;
    for (let i = 0; i < 9; i++) { const a = a0 + i * TAU / 9 + 0.3 * Math.sin(i * 2.4 + sd * 9), c = Math.cos(a), sn = Math.sin(a), px = -sn, pz = c, L = R * (0.82 + 0.18 * Math.sin(i * 1.7 + sd * 20));
      const st = [[0.15, 0.1, 0.10, 0], [L * 0.38, L * 0.24, 0.30, 0.34], [L * 0.72, L * 0.22, 0.26, 0.7], [L, -L * 0.1, 0.05, 1]];      // out, up, half width (as a part of L), place along the frond
      const P4 = (q, sg) => [x + c * q[0] + px * sg * q[2] * L, y + h + q[1], z + sn * q[0] + pz * sg * q[2] * L, sg > 0 ? 1 : 0, q[3]];
      for (let k = 0; k < 3; k++) { const p0 = st[k], p1 = st[k + 1], s0 = [c * 0.3 * p0[3], sn * 0.3 * p0[3]], s1 = [c * 0.3 * p1[3], sn * 0.3 * p1[3]];
        pq([P4(p0, -1), P4(p0, 1), P4(p1, 1), P4(p1, -1)], 6, sd, [s0, s0, s1, s1]); } }
    const fq = 0.55, fy = y + h + 0.55; pq([[x - fq, fy, z - fq, 0, 0], [x + fq, fy, z - fq, 1, 0], [x + fq, fy, z + fq, 1, 1], [x - fq, fy, z + fq, 0, 1]], 7, sd);
  };
  for (let k = 0; k < 4; k++) {
    const r0 = HB.R[k], rw = r0 + (k ? 5 : 2.9);
    if (k < 2) for (let i = 0, n = 0; i < 80 && n < 5; i++) { const a = rng() * TAU; if (hbGardenAt(a, k) > 0.02 || Math.hypot(rw * Math.cos(a) - tl.x, rw * Math.sin(a) - tl.z) < 20) continue;      // wells: on the quay and the first terrace, between the houses and the lip
      well(rw * Math.cos(a), rimAt(a) * HB.LV[k], rw * Math.sin(a)); n++; }
    const rl = r0 + (k >= 2 ? 1.7 : k ? 4.2 : 2.6);
    for (let a = rng() * 0.05; a < TAU; a += rng.range(16, 34) / rl) { const len = rng.range(8, 14);
      if (hbGardenAt(a, k) > 0.02 || hbGardenAt(a + len / rl, k) > 0.02 || Math.hypot(rl * Math.cos(a) - tl.x, rl * Math.sin(a) - tl.z) < 20) continue;
      washing(rl * Math.cos(a), rimAt(a) * HB.LV[k], rl * Math.sin(a), -Math.sin(a), Math.cos(a), len); }
    await ctx.yield();
    if (k > 0) for (let a = rng() * 0.05; a < TAU; a += rng.range(11, 30) / r0) {      // tree-ferns: along the lips of the planted terraces, and between the houses of the villages
      const gdn = hbGardenAt(a, k) > 0.5, rt = r0 + (gdn ? rng.range(2.6, 0.5 * (HB.R[k + 1] - r0)) : 1.6), hh = rng.range(9, 13.5), RR = rng.range(4.2, 5.8), sd = rng();
      if (Math.hypot(rt * Math.cos(a) - tl.x, rt * Math.sin(a) - tl.z) < 20 || (!gdn && sd < 0.45)) continue;
      fern(rt * Math.cos(a), rimAt(a) * HB.LV[k], rt * Math.sin(a), hh, RR, sd); }
    await ctx.yield();
  }
  for (let i = 0; i < PP.length; i += 3) {                                // out of the harbour's frame into the world
    at(PP[i], PP[i + 1], PP[i + 2]); PP[i] = _w.x; PP[i + 1] = _w.y; PP[i + 2] = _w.z;
    _w.set(0, 0, 0).addScaledVector(H.X, PN[i]).addScaledVector(H.Y, PN[i + 1]).addScaledVector(H.Z, PN[i + 2]); PN[i] = _w.x; PN[i + 1] = _w.y; PN[i + 2] = _w.z;
    if (i % 60000 === 59997) await ctx.yield();
  }
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute(PP, 3)); pg.setAttribute('normal', new THREE.Float32BufferAttribute(PN, 3));
  pg.setAttribute('uv', new THREE.Float32BufferAttribute(PU, 2)); pg.setAttribute('aQ', new THREE.Float32BufferAttribute(PQ, 4)); pg.setIndex(PI);
  add(new THREE.Mesh(pg, shellMat(S, HPROP_VERT, HPROP_FRAG, {}, { side: THREE.DoubleSide })), 'harbourProps');
  await ctx.yield();
  // ---- glints: one to a house, and one to the spire (a slit window low on its doorward side), as any window has
  at(H.tl[0], H.headH + 7, H.tl[1] - 9.2); gP.push(_w.x, _w.y, _w.z); gS.push(1.8, 0, 0.5, Math.PI);      // (the 0.5 only holds the seed's place: the seed is drawn below, as the harbour stream's last draw)
  const quad = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  const lg = new THREE.InstancedBufferGeometry(); lg.index = quad.index; lg.setAttribute('position', quad.attributes.position); lg.setAttribute('uv', quad.attributes.uv);
  lg.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(gP), 3)); lg.setAttribute('iS', new THREE.InstancedBufferAttribute(new Float32Array(gS), 4));
  lg.instanceCount = gP.length / 3;
  add(new THREE.Mesh(lg, new THREE.ShaderMaterial({ uniforms: { uTime: S.sh.uTime, uPx: S.uPx, uExpo: S.sh.uExpo, uCam: S.sh.uCam, uHbM: S.sh.uHbM },
    vertexShader: GLINT_VERT, fragmentShader: GLINT_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false })), 'glints', 8);
  await ctx.yield();
  // ---- boats: the brief's lugger (a 9 m hull under a 12 m mast), at most nineteen: one moored at each jetty, the rest
  // sailing slow rounds inside the jetty heads. Laid out across the harbour's own plan.
  const bP = [], bS = [], bM = [];
  const boat = (x, z, R, sp, ph, sc) => { at(x, 0, z); bP.push(_w.x, _w.y, _w.z); bS.push(sc, 0, rng(), 0); bM.push(R, sp, ph, 0); };
  // The route crosses the lagoon low. No boat, moored or on its round, comes inside a corridor 30 m either side of the
  // route's track across the water (the route as it falls on the harbour's plan): a rule of the place, the same along the whole pass.
  const track = [], CORR = 30, _t = new THREE.Vector3(), _l = new THREE.Vector3();
  for (let d = S.U.door3 * S.path.length; d <= S.path.length; d += 2) { H.local(S.path.posAtDist(d, _t), _l); if (Math.hypot(_l.x, _l.z) < HB.R[0] + CORR) track.push(_l.x, _l.z); }      // (the track, every 2 m of the route)
  const inCorridor = (x, z, R) => { for (let i = 0; i < track.length; i += 2) if (Math.abs(Math.hypot(track[i] - x, track[i + 1] - z) - R) < CORR) return true; return false; };
  const sail = (x, z, R, sp, ph, sc) => { if (inCorridor(x, z, R)) return false; boat(x, z, R, sp, ph, sc); return true; };
  for (const pr of H.piers) { const r = HB.R[0] - pr.len * rng.range(0.35, 0.8), sdn = rng.chance(0.5) ? 1 : -1, sc = rng.range(1.0, 1.1);
    sail(r * Math.cos(pr.th) - sdn * 9 * Math.sin(pr.th), r * Math.sin(pr.th) + sdn * 9 * Math.cos(pr.th), 0, 0, pr.th + (sdn > 0 ? 0 : Math.PI), sc); }
  const rounds = [];
  for (let tries = 0; rounds.length < 14 && tries < 400; tries++) {
    const a = rng() * TAU, rc = 80 * Math.sqrt(rng()), R = rng.range(10, 30), x = rc * Math.cos(a), z = rc * Math.sin(a);
    if (rc + R > 88 ||   /* every pier head is at radius 92 or more */ rounds.some((q) => Math.hypot(q[0] - x, q[1] - z) < q[2] + R + 5)) continue;
    if (!sail(x, z, R, rng.range(2.6, 4.2) * (rng.chance(0.5) ? 1 : -1), rng() * TAU, rng.range(1.0, 1.12))) continue;
    rounds.push([x, z, R]);
  }
  { const gI = lg.getAttribute('iS'); gI.setZ(lg.instanceCount - 1, rng()); gI.needsUpdate = true; }      // the spire's glint draws its seed as every house's glint does (seed = rng()): the last draw of the harbour's stream, so nothing dealt before it moves
  S.subjects.harbourBoats = bP.length / 3;
  await ctx.yield();
  const bg = boatGeometry(), big = new THREE.InstancedBufferGeometry();
  big.index = bg.index; for (const k in bg.attributes) big.setAttribute(k, bg.attributes[k]);
  big.setAttribute('iP', new THREE.InstancedBufferAttribute(new Float32Array(bP), 3)); big.setAttribute('iS', new THREE.InstancedBufferAttribute(new Float32Array(bS), 4));
  big.setAttribute('iM', new THREE.InstancedBufferAttribute(new Float32Array(bM), 4)); big.instanceCount = bP.length / 3;
  add(new THREE.Mesh(big, shellMat(S, HBOAT_VERT, HBOAT_FRAG, { uSail: { value: new THREE.Color(V.sail) } }, { side: THREE.DoubleSide })), 'harbourBoats');
});

// ---------------------------------------------------------------- a cloud deck lying against the left wall of the last room
// Big soft puffs banked on the wall from beside the harbour to the curl of the mouth; the second shower falls into it.
// (Built last, from a stream of its own.)
const DECK_VERT = /* glsl */`
${BILLBOARD}
attribute vec4 iD; attribute vec2 iE; uniform float uTime; uniform vec3 uCam;
varying vec2 vUv; varying vec3 vP; varying vec3 vN; varying vec4 vC;
#include <fog_pars_vertex>
void main(){
  vec3 c = iD.xyz + vec3(0., 0., 1.) * 46. * sin(uTime * .021 + iE.x * 6.2831853);      // the deck creeps along the wall
  vec3 p = c + (camRight() * (uv.x - .5) + camUp() * (uv.y - .5)) * iD.w * 2.;
  float dc = length(uCam - c);
  vP = p; vN = vec3(0., 0., 1.); vUv = uv; vC = vec4(3., smoothstep(iD.w * 1.2, iD.w * 3., dc), iE.y, -1.);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.);
  gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
BUILDERS.push(async (S) => {
  const { V } = S, rng = ownStream(S.rng, 'cloud-deck');
  const n = Math.round(110 * Math.max(0.6, V.detail)), D = new Float32Array(n * 4), E = new Float32Array(n * 2);
  const wallR = (z) => z < 2900 ? lerp(1000, 1450, Math.sin(clamp((z - 2100) / 800, 0, 1) * Math.PI / 2)) : 620 + 830 * Math.pow(Math.cos(Math.asin(clamp((z - 2900) / 810, 0, 1))), 0.85);
  for (let i = 0; i < n; i++) {
    const a = rng(), b = rng(), th = lerp(-0.12, 0.66, a), z = lerp(2560, 3440, b);
    const edge = Math.max(Math.abs(a * 2 - 1), Math.abs(b * 2 - 1)), size = rng.range(110, 230) * (1 - 0.45 * edge * edge);
    const R = wallR(z) - 25 - size * rng.range(0.25, 0.8);
    D[i * 4] = R * Math.cos(th); D[i * 4 + 1] = R * Math.sin(th); D[i * 4 + 2] = z; D[i * 4 + 3] = size; E[i * 2] = rng(); E[i * 2 + 1] = rng();
  }
  await S.ctx.yield();
  const g = new THREE.InstancedBufferGeometry(), q = new THREE.PlaneGeometry(1, 1).translate(0.5, 0.5, 0);
  g.index = q.index; g.setAttribute('position', q.attributes.position); g.setAttribute('uv', q.attributes.uv);
  g.setAttribute('iD', new THREE.InstancedBufferAttribute(D, 4)); g.setAttribute('iE', new THREE.InstancedBufferAttribute(E, 2)); g.instanceCount = n;
  const m = new THREE.Mesh(g, shellMat(S, DECK_VERT, PUFF_FRAG, { uOpacity: { value: 0.43 } }, { transparent: true, depthWrite: false }));      // 0.43 x 1.15 in the shader: a puff peaks at 0.5
  m.frustumCulled = false; m.renderOrder = 5; m.name = 'cloudDeck'; S.scene.add(m);
});
