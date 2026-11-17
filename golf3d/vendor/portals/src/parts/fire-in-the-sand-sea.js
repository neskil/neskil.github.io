// The Sand Sea Drowns: hero set piece for "fire-in-the-sand-sea" (Botucatu desert, 134 million years ago).
//
// WHAT IT IS   The drowned desert itself: rose dune ridges standing out of a level black flood of sheet lava, a thin
//   line of fire round every island; the home ridge with its knife crest, the saddle where the west lake spills east
//   as a 30 m tongue of slow glowing cloth, the islet, the spur with its notch and two horns (the portal's gate), ridge
//   after ridge to +-6.5 km; budding toes along the near shores; three-toed trackways (one walks into the lava); and
//   the two animals: a filament-coated theropod that stands on the shore of the west lake's bay, turns, runs up the
//   windward flank to the crest and north along it, and stops broadside to look over the flood; and its paler twin
//   standing by the notch. (Polish 1: the run line, makeRoute and makeTiming were re-staged; see shots/<id>/polish1/notes.md.) The world coder adds only sky, stars, fume, streamers, hoppers, avalanche and the path.
//   (Polish 2: no dune is a plane any more: the home crest winds in plan and rises and sags, its brink is rounded, broad
//   secondary dunes lie across the windward flanks, slip faces are fluted, the spur and the islet have rounded crests on a
//   finer grid, far linking arms stand in the flood as islands; the lava is a calm satin sheet at range with long clean
//   clefts; makeRoute goes out over the flood and back; see shots/<id>/polish2/notes.md.)
//   (Polish 4: the lava's light on sand has a direction and every ripple scale takes an orange and a blue side; ripples 3.2 m and
//   19 m apart; avalanche tongues drawn as shapes on slip faces; the saddle tongue rebuilt as displaced folds with a heaped lip;
//   the long islet nearer the glide; a fresh trackway down the lit wall; see shots/<id>/polish1/notes.md.)
//   (Polish 5, shots/<id>/polish2/notes.md: the saddle tongue is a stream of open lava between two levees of crust with a fan of
//   folds at its foot, not arcs of fire across a 32 degree face (a contour map); slip faces are darker, lit by the lava from the
//   foot up, softly fluted, with a few spindle-shaped avalanche tongues (no drips, no combed lines); the growing dawn is a decided
//   light on the spur; the neighbouring ridges are meshed every 66 m; an old trackway crosses the long islet.)
//   (Polish k1, shots/<id>/polish-k1-1/notes.md: fresh sheets of lava creep over the older skin on both lakes (flow bands, open
//   seams, a bright budding edge) and one fans out from the foot of the pour; every trackway is laid with the runner's own
//   0.2 m print; avalanche tongues and trickles are short shapes, not streaks from brink to foot.)
//
// SPACE   Local x = east, z = south (north is -z), y up. y 0 = the east lake; the west lake stands at y 18.
//   The home crest crosses the origin at y 55 (anchors.crossing). Not rotated to "+Z front": the brief's map is used
//   as written (entry from the west). radius 200 / height 44 / center (70, 66, -215) are only the orbit of the set-piece viewer;
//   the piece itself reaches 6.5 km. ground: false (it brings its own).
//
// OPTS   palette: 7 hex strings [sand, pale sand, sky mid, zenith, lava skin, peach, lava fire] (brief order).
//   detail: 0.6..1 thins the toes only.   focus: 'runner' | 'twin' | 'shore' | 'tongue': close-up framing for
//   judging; runner/twin scale the piece x3.2. Never set it in the world.
//
// RETURNS  { object, radius, height, center, anchors, update(dt, time, camera), dispose, ground: false,
//   setProgress(p)  the lava's progress 0..1: at 0.5-0.63 a 2 m toe closes over the last print; at 0.63-0.7 the whaleback
//                   swells 3 m and splits (the world maps its u onto this with makeTiming(...).heroProgress).
//   setRunTime(t)   the runner's script seconds (makeTiming(...).runTime(u)): it stands until 1.0, turns and runs (9 m/s,
//                   1.7 m footfalls, a print and a puff at each), slows, turns broadside and stops at script.RUN_T1.
//                   Until these are first called a demo loop runs (so the viewer shows the run).
//   heightAt(x, z), levelAt(x, z)   the dune surface and the lava level of that hollow (carve / place things with these)
//   dunes    the whole height model (crestX(z), crestY(z), spurZ(x), shore(...), normal(...), SEAT, HD, ISLET)
//   lights   shared uniforms: uSkyUp, uSkyLow (blue fill), uRakeDir, uRakeCol (peach rake from the east), uLava,
//            uLavaLit, uLavaGain (1; raise for the deep-night look), uWind + uVeilSpeed (veils of blown sand on the
//            windward flanks), uSunCol + uSunY (first sun on everything above uSunY; black = off), uTime
//   runner, twin  { mesh, bones, uniforms, pose(state) };  script (the runner's timeline);  parts: sand, lava, toes, tongue, prints, puffs }
//   Also exported for instancing elsewhere: buildTheropodGeometry(), makeTheropod(geometry, palette, lights, { pale, hue }),
//   poseTheropod(bones, state), theropodCycle(speed), makeDunes(rng, noise), secondsAtU(u).
//
// ANCHORS (local space)
//   entry { position, heading }   brief entry point, level, heading east
//   flyThrough [Vector3 x18]      the brief's camera line on this seed's terrain: climb the prints 2.6 m over the ripples,
//                                 follow the crest 3 m to windward, down the slip face 4 m off the sand, shore at 5 m,
//                                 lake at y 12, then the last 135 m dead straight at 12 degrees up a scoured corridor
//                                 (6.8 m clear) to the ring. Low on purpose where the brief is low; lift it if you want 6 m.
//   portalSeat { position, facing, radius 7, floorY }   ring centre in the notch, facing back down the approach
//   horns [2], crossing, runnerStand, runnerStop, twin, tongueLip, tongueFoot, islet, lastPrint, whaleback, westBay,
//   viewpoints { crest, shore, lake } ({ position, lookAt }), lakeLevels { east, west }
//
// LAVA (fix 1)  The skin is black-brown and rough: a capped pewter sheen, never a mirror. Its crust is laid in patches
//   with their own heading (rope folds 0.3 m apart, draped pleats 2-3 m apart, a few pleats split and glowing), drawn in
//   albedo and normal so it reads at any view angle. Shores carry a standing rank of old pillows (black wrinkled crowns,
//   dull red flanks, fire in the seam) with the budding toes pushing out of it; the tongue is dark cloth with thin creases
//   and fades into the lake. Sand has larger ripples, broad swells with a lit side, and thin travelling streamers.
// COST   (polish 4: ~365k triangles with the world, 49 draw calls at most)   earlier: ~180k triangles, 9 draw calls (sand 1, lava 1, toes 1, tongue 1, prints 1, puffs 1, animals 2), one 256x224 R8
//   texture, no lights, ~200-250 ms of build on the test machine in yielded steps. Everything is created in build;
//   update() only sets uniforms (20 bone matrices per animal).
//
// LIGHT   It lights itself and ignores scene lights: a blue sky fill (uSkyUp / uSkyLow), a faint peach rake from the
//   east, and the lava's own light from below (falls off with height above the lake of that hollow). Scene fog is
//   honoured (use a dark blue FogExp2 of about 0.00012-0.0002). Bloom on the lava only: fire is HDR 2.5-4.5, sand
//   stays under 0.6. Naturalistic, no drawn style.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, saturate, makeRng, hashSeed } from '../kit/core.js';

const DEFAULT_PALETTE = ['#C98B6B', '#E2B58C', '#2B3350', '#121A33', '#18110F', '#F3C9A0', '#FF6A1F'];
const TAU = Math.PI * 2;
const SLIP = 0.625, WIND = 0.194;      // tan 32 deg (slip face), tan 11 deg (windward flank)
const FLOOR = -45;                      // the old desert floor, far under the flood
const SPACING = 900;                    // ridge to ridge
export const LAKE_EAST = 0, LAKE_WEST = 18;

// ---------------------------------------------------------------------------------------------
// The dunes: ONE analytic height function. x east, z south (north is -z), y up, y 0 = east lake.
// The home ridge crest crosses the origin at y 55; everything in the brief hangs off that.
// ---------------------------------------------------------------------------------------------
export function makeDunes(rng, noise) {
  const P = {
    scA: rng.range(20, 34), scPh: rng.range(-0.5, 0.5),          // home crest scallops
    sc2A: rng.range(5, 10), sc2L: rng.range(190, 260), sc2Ph: rng.range(0, TAU),
    und: rng.range(1.0, 1.8),                                      // windward undulation, metres
    isletL: rng.range(17, 22), isletH: rng.range(8.5, 9.5),
    hornW: rng.range(-1.5, 1.5), hornE: rng.range(-1.5, 1.5),
    spurBow: rng.range(70, 95),
    ridges: [],
  };
  for (let k = -6; k <= 13; k++) P.ridges.push({ k, ph: rng.range(0, TAU), a: rng.range(18, 40), top: rng.range(44, 62), sad: rng.range(22, 36), sz: rng.range(-300, 300), ph2: rng.range(0, TAU) });
  const byK = P.ridges;                                             // byK[k + 6]
  const gauss = (x) => Math.exp(-x * x);
  // home crest line (x as a function of z); exactly 0 at z 0
  const cx0 = (z) => P.scA * 0.8 * Math.cos(TAU * (z + 235) / 600 + P.scPh * 0.5) + P.sc2A * Math.sin(TAU * z / P.sc2L + P.sc2Ph)
    + 6.5 * Math.sin(TAU * z / 86 + P.sc2Ph * 1.7) * smoothstep(20, 90, Math.abs(z + 250));                // (polish 2) a shorter scallop: the knife edge winds, it is never a ruled line
  const cxAt0 = cx0(0);
  const crestX = (z) => cx0(z) - cxAt0;
  // home crest height: 55, with a narrow saddle (y 17) every 600 m; the one we use is at z -250
  const crestY = (z) => {
    const zs = ((z + 250) % 600 + 900) % 600 - 300;                // distance to the nearest saddle
    const deep = Math.abs(z + 250) < 300 ? 38 : 29;                // only our saddle lets the west lake over
    // (polish 2) the crest rises and sags by some metres along its length: a skyline with a line, not a ruler
    const wave = 1.6 * Math.sin(z * 0.021) + 3.6 * Math.sin(z * 0.0127 + P.sc2Ph) + 2.0 * Math.sin(z * 0.0346 + P.scPh * 5.) - 3.6 * Math.sin(P.sc2Ph) - 2.0 * Math.sin(P.scPh * 5.);
    return 55 - deep * gauss(zs / 78) + wave * smoothstep(0, 200, Math.abs(z + 250));
  };
  const ridgeProfile = (d, H) => (d < 0 ? Math.max(FLOOR, H + d * WIND) : Math.max(FLOOR, H - d * SLIP));
  // far ridges: same family, each with its own scallop phase, heights and saddle places
  const ridgeX = (r, z) => r.k * SPACING + r.a * Math.cos(TAU * z / 640 + r.ph) + 9 * Math.sin(TAU * z / 230 + r.ph2);
  const ridgeY = (r, z) => { const zs = ((z + r.sz) % 700 + 1050) % 700 - 350; return r.top - (r.top - r.sad) * gauss(zs / 90) + 3 * Math.sin(z * 0.004 + r.ph) + 6 * Math.sin(z * 0.0021 + r.ph2) + 3.5 * Math.sin(z * 0.0083 + r.ph * 2.); };
  // the spur: an arm of the home ridge curling east across the hollow, north of the east lake.
  // crest line z = spurZ(x); gentle flank to the south (+z), slip face to the north.
  const spurZ = (x) => -585 + P.spurBow * smoothstep(40, 185, x) + 26 * smoothstep(230, 520, x);
  const spurTop = (x) => 44 + (8.0 + P.hornW) * gauss((x - 167) / 12.5) + (8.0 + P.hornE) * gauss((x - 213) / 12.5) - 22 * smoothstep(560, 760, x);
  const NOTCH_X = 190;
  const spurH = (x, z) => {
    const ds = z - spurZ(x);
    const dip = 11.5 * gauss((x - NOTCH_X) / 12.5) * (ds > 0 ? Math.exp(-ds / 120) : 1);
    const H = spurTop(x) - dip;
    const fa = ds * WIND, fb = -ds * SLIP;                             // (polish 2) a rounded crest: the grid is not laid along this ridge, a knife here showed as saw teeth
    return H - (0.5 * (fa + fb + Math.sqrt((fa - fb) * (fa - fb) + 40.)) - 3.162);
  };
  // the islet: one drowned dune top standing in the east lake
  const ISLET = { x: 141.3, z: -315 };                              // 200 m short of the ring, 21 m right of the final line
  const isletH = (x, z) => {
    const dx = x - ISLET.x, dz = (z - ISLET.z) / P.isletL;
    const fa = -dx * 0.42, fb = dx * SLIP;
    return P.isletH - (0.5 * (fa + fb + Math.sqrt((fa - fb) * (fa - fb) + 4.)) - 1.) - dz * dz * P.isletH;
  };
  // (polish 3) more drowned dune tops stand in the east lake where the flight glides out over it and turns: small
  // crescents (horns downwind), each with its own line of fire, so the flood is an archipelago and the middle of the
  // flight has a near subject. Fixed places (no draws), all inside the fine part of the sand grid.
  // each: centre, half-length L along its crest, height H, the crest's heading (ax) and the side its slip face falls to (lee)
  const ISLETS = [
    { x: 214, z: -117, L: 41, H: 10.6, bow: -7, ax: [1, 0], lee: [0, -1] },   // (polish 4: 40 m nearer the glide, which now crosses its low west end: the islet is the near subject of that leg)          // an arm lying east-west, dead ahead on the glide: we look along its knife crest
    { x: 150, z: -223, L: 15, H: 6.4, bow: 7, ax: [0, 1], lee: [1, 0] },            // a small crescent north of the turn, in the middle of the picture as we come round: its lit slip face toward us
    { x: 334, z: -34, L: 46, H: 11.5, bow: 10, ax: [0.97, 0.24], lee: [0.24, -0.97] },
    { x: 322, z: -214, L: 24, H: 7.2, bow: 6, ax: [0.89, -0.45], lee: [0.45, 0.89] }];
  const isletsH = (x, z) => {
    let best = -99;
    for (const I of ISLETS) {
      const rx = x - I.x, rz = z - I.z; if (rx * rx + rz * rz > (I.L + 45) * (I.L + 45)) continue;
      const t = (rx * I.ax[0] + rz * I.ax[1]) / I.L, ac = rx * I.lee[0] + rz * I.lee[1] - I.bow * t * t;
      const fa = -ac * 0.36, fb = ac * SLIP, t2 = Math.min(t * t, 4);
      // a knife crest that rises and sags a little along its length, falling to nothing at both ends
      const v = I.H * (1 - t2 * (1 + 0.3 * t2)) * (1 + 0.1 * Math.sin(t * 5.3 + I.x)) - (0.5 * (fa + fb + Math.sqrt((fa - fb) * (fa - fb) + 0.5)) - 0.354);
      if (v > best) best = v;
    }
    return best;
  };
  // the portal's seat in the notch, and the wind-scoured corridor that leads the last 135 m of the flight up to it
  const NZ = spurZ(NOTCH_X), NY = spurTop(NOTCH_X) - 11.5;
  const SEAT = [NOTCH_X, NY + 7.2, NZ + 3], HD = [0.342, -0.94];
  function h(x, z) {
    const cx = crestX(z), d = x - cx;
    let y = ridgeProfile(d, crestY(z));
    // neighbours: only the ridge to the west (its slip face) and the one to the east (its windward flank) can matter
    const kf = Math.floor(x / SPACING);
    for (let k = kf; k <= kf + 1; k++) {
      const r = byK[k + 6], dk = x - k * SPACING;
      if (!r || k === 0 || dk < -615 || dk > 235) continue;
      const v = ridgeProfile(x - ridgeX(r, z), ridgeY(r, z));
      if (v > y) y = v;
    }
    if (x > -200 && x < 900 && z < -235 && z > -675) { const s = spurH(x, z); if (s > y) y = s; }
    // a blowout trough on the windward flank lets the west lake reach in beside the entry line
    if (d < 0 && d > -400) y -= 22 * gauss((z - 58) / 34) * (1 - smoothstep(-128, -38, d));
    if (z < -280 && x > 40 && x < 260) {
      const rx = x - SEAT[0], rz = z - SEAT[2], dd = -(rx * HD[0] + rz * HD[1]), lat = Math.abs(rx * 0.94 + rz * 0.342);
      // a bay: the foot of the spur's flank is drowned for 30 m more, so the lake runs with us to the mouth of the corridor
      if (dd > 90 && dd < 300) y -= 11.8 * gauss((dd - 184) / 32) * gauss(((rx * 0.94 + rz * 0.342) - 10) / 45);
      if (dd > -5 && dd < 260 && lat < 36) {
        const lim = Math.max(12, SEAT[1] - 0.2126 * dd) - 6.8; const ex = y - lim; if (ex > 0) y -= (ex * ex / (ex + 1.2)) * (1 - smoothstep(9, 36, lat));
        const ls = rx * 0.94 + rz * 0.342;                                 // signed: + is right of the line of flight
        y += 3.1 * gauss((dd - 28.5) / 11) * gauss((ls - 6.5) / 4.2);     // the twin's rise, 3 m high; (k1c) 6.5 m right of the line (it was 2.9 m): the design stands the pale one 6 m right of our line, where it is beside the ring in the picture and never across its disc
      }
    }
    if (x > 60 && x < 220 && z < -230 && z > -360) { const s = isletH(x, z); if (s > y) y = s; }
    if (x > 110 && x < 430 && z < 40 && z > -270) { const s = isletsH(x, z); if (s > y) y = s; }
    // soft undulation of the windward flanks; none on slip faces (they are planes of sliding sand)
    if (y > FLOOR + 1) {
      const fl = smoothstep(0, 60, -d) + (x > SPACING * 0.5 || x < -SPACING * 0.5 ? 0.6 : 0);
      if (fl > 0) y += P.und * Math.min(1, fl) * noise.n2(x * 0.011, z * 0.008) * smoothstep(-40, 5, y);
      // (polish 2) no flank is a plane: a convex shoulder below the crest and broad secondary dunes lying obliquely across it
      if (d < 0 && d > -520) {
        const k2 = smoothstep(6, 80, -d) * (1 - smoothstep(330, 520, -d));
        y += 3.0 * (1 - Math.exp(d / 20)) * (1 - smoothstep(110, 300, -d));       // the brink is rounded: the flank eases as it nears the knife edge
        y += k2 * (3.4 * noise.n2(x * 0.0058 + z * 0.0031 + 9.3, z * 0.0043 - x * 0.0012 - 4.1) + 1.5 * Math.sin((x * 0.82 + z * 0.57) * 0.045 + 2.2 * noise.n2(x * 0.004, z * 0.004 + 7.)));
      }
    }
    return y;
  }
  // lava level of the hollow a point belongs to
  const level = (x, z) => (x < crestX(z) ? LAKE_WEST : LAKE_EAST);
  // find where the surface crosses height y going from (x0,z0) to (x1,z1) (bisection)
  function shore(x0, z0, x1, z1, y) {
    let a = 0, b = 1; const fa = h(x0, z0) - y;
    for (let i = 0; i < 26; i++) { const m = (a + b) / 2, f = h(lerp(x0, x1, m), lerp(z0, z1, m)) - y; if ((f > 0) === (fa > 0)) a = m; else b = m; }
    return [lerp(x0, x1, a), lerp(z0, z1, a)];
  }
  const normal = (x, z, out = new THREE.Vector3()) => out.set(h(x - 0.4, z) - h(x + 0.4, z), 0.8, h(x, z - 0.4) - h(x, z + 0.4)).normalize();
  return { P, h, level, crestX, crestY, ridgeX, ridgeY, spurZ, spurTop, shore, normal, NOTCH_X, ISLET, ISLETS, SEAT, HD, ridges: P.ridges };
}

// ---------------------------------------------------------------------------------------------
// Sand geometry: a near grid warped to the home crest line (a doubled vertex column on the crest
// keeps it a knife), plus one strip per far ridge out to +-6.5 km. One geometry, one draw call.
// ---------------------------------------------------------------------------------------------
const NEAR = { dW: -350, dE: 650, zS: 250, zN: -700 };
function nearColumns() {
  const west = [], east = [];
  let d = 0, s = 0.6;
  while (d < -NEAR.dW) { d += s; west.push(-Math.min(d, -NEAR.dW)); s = Math.min(d < 215 ? 5 : 14, s * 1.2); }   // (polish 2: 5 m cells down to the bay; its head wall showed 14 m facets)
  d = 0; s = 0.6;
  while (d < 110) { d += s; east.push(d); s = Math.min(4.5, s * 1.15); }
  while (d < 318) { d += (d >= 148 && d < 262) ? 1.8 : 2.6; east.push(d); }                       // (polish 2: 2.6 m cells out past the east horn; at 5 m the horns and the islet showed their facets)
  s = 6;
  while (d < NEAR.dE) { d += s; east.push(Math.min(d, NEAR.dE)); s = Math.min(24, s * 1.2); }
  return { cols: [...west.reverse(), 0, 0, ...east], crestI: west.length };   // cols[crestI] = west copy, [crestI+1] = east copy
}
function nearRows() {
  const rows = []; let z = NEAR.zS;
  while (z > NEAR.zN) {
    rows.push(z);
    z -= (z <= 34 && z > -440) ? 3.5 : (z <= -440 && z > -602) ? (z <= -476 ? 1.8 : 2.6) : 6;
  }
  rows.push(NEAR.zN);
  return rows;
}
async function buildSandGeometry(ctx, dunes) {
  const { cols, crestI } = nearColumns(), rows = nearRows();
  const nc = cols.length, nr = rows.length;
  const pos = [], nor = [], lev = [], idx = [];
  // near grid
  const P = new Float32Array(nc * nr * 3);
  for (let j = 0; j < nr; j++) {
    const z = rows[j], cx = dunes.crestX(z);
    for (let i = 0; i < nc; i++) {
      const x = cx + cols[i], o = (j * nc + i) * 3;
      P[o] = x; P[o + 1] = dunes.h(x, z); P[o + 2] = z;
    }
    if (j % 6 === 0) await ctx.yield();
  }
  const a = new THREE.Vector3(), b = new THREE.Vector3(), n = new THREE.Vector3();
  for (let j = 0; j < nr; j++) {
    const j0 = Math.max(0, j - 1), j1 = Math.min(nr - 1, j + 1);
    for (let i = 0; i < nc; i++) {
      // one-sided across the crest so the two copies of the crest column keep their own face normal
      let i0 = Math.max(0, i - 1), i1 = Math.min(nc - 1, i + 1);
      if (i === crestI) i1 = i; if (i === crestI + 1) i0 = i;
      const A = (j * nc + i1) * 3, B = (j * nc + i0) * 3, C = (j1 * nc + i) * 3, D = (j0 * nc + i) * 3;
      a.set(P[A] - P[B], P[A + 1] - P[B + 1], P[A + 2] - P[B + 2]);
      b.set(P[C] - P[D], P[C + 1] - P[D + 1], P[C + 2] - P[D + 2]);
      n.crossVectors(a, b); if (n.y < 0) n.negate(); n.normalize();
      const o = (j * nc + i) * 3;
      pos.push(P[o], P[o + 1], P[o + 2]); nor.push(n.x, n.y, n.z);
      lev.push(i <= crestI ? LAKE_WEST : LAKE_EAST);
    }
    if (j % 40 === 0) await ctx.yield();
  }
  for (let j = 0; j < nr - 1; j++) for (let i = 0; i < nc - 1; i++) {
    if (i === crestI) continue;
    const q = j * nc + i;
    idx.push(q, q + 1, q + nc, q + 1, q + nc + 1, q + nc);
  }
  await ctx.yield();
  // far ridges
  const DS = [-335, -205, -105, -36, 0, 0, 30, 108], ZR = 6600;
  for (const r of [{ k: 0 }, ...dunes.ridges]) {
    if (r.k === 0 && r.ph !== undefined) continue;
    const ZSTEP = (r.k >= -1 && r.k <= 2) ? 66 : 200, nz = Math.round(2 * ZR / ZSTEP) + 1;   // (polish 5: the neighbouring ridges every 66 m: at 200 m their skylines were stepped)
    const base = pos.length / 3;
    const keep = new Uint8Array(nz);
    for (let j = 0; j < nz; j++) {
      if (j % 50 === 49) await ctx.yield();
      const z = -ZR + j * ZSTEP - 150;
      const cx = r.k === 0 ? dunes.crestX(z) : dunes.ridgeX(r, z);
      // rows wholly inside the near box are left to the near grid
      const home = dunes.crestX(z);
      // (the home ridge's own coarse strip must not bridge the saddle: every row inside the near box is dropped,
      //  or its 200 m cells lie as a slab up to 7 m above the fine saddle and hide the slip face under the flight)
      keep[j] = (r.k === 0 ? (z > NEAR.zN && z < NEAR.zS) : (z > NEAR.zN + ZSTEP && z < NEAR.zS - ZSTEP && cx + DS[0] > home + NEAR.dW + 20 && cx + DS[7] < home + NEAR.dE - 20)) ? 0 : 1;
      for (let i = 0; i < DS.length; i++) {
        const x = cx + DS[i] + (i === 4 ? -0.05 : i === 5 ? 0.05 : 0);
        const y = dunes.h(x, z);
        if (Math.abs(z) < 1700 && r.k >= -1 && r.k <= 2) {
          const ex = i <= 4 ? -3 : 3;                                 // one-sided normals again
          n.set(-(dunes.h(x + ex, z) - y) / ex, 1, -(dunes.h(x, z + 6) - dunes.h(x, z - 6)) / 12).normalize();
        } else n.set(i <= 4 ? -WIND : SLIP, 1, 0).normalize();
        pos.push(x, y - 0.6, z); nor.push(n.x, n.y, n.z); lev.push(dunes.level(x, z));
      }
    }
    for (let j = 0; j < nz - 1; j++) {
      if (!keep[j] && !keep[j + 1]) continue;
      for (let i = 0; i < DS.length - 1; i++) {
        if (i === 4) continue;
        const q = base + j * DS.length + i;
        idx.push(q, q + DS.length, q + 1, q + 1, q + DS.length, q + DS.length + 1);
      }
    }
    await ctx.yield();
  }
  // (polish 2) the linking arms of the far ridges: the sand sea is a net of linked crescents, so arms like our spur cross
  // the hollows further off too. Seen north along the crest or over the flood they are the layered rose islands that
  // give the horizon a line (it was a ruled edge); each takes its fire line where it stands in the flood.
  {
    const ARMS = [[-1650, -2300, 3300, 34, 40], [-2500, -3300, 4200, 46, 50], [-3500, -4200, 5200, 56, 60], [-4800, -5200, 6200, 70, 70], [1500, -2500, 3200, 36, 44], [2700, -3600, 4300, 52, 56],
      [-20, 420, 1010, 27, 30], [-345, 450, 1000, 33, 30]];   // and two arms of the next ridge east reach into our own lake: islands in the flood, seen from the glide
    const AF = [1, 0.4, 0.14, 0, 0, 0.14, 0.45, 1];                       // across the arm: 4 columns down its gentle southern flank, 4 down its slip face
    ARMS.forEach(([zc, x0, x1, top, step], ai) => {
      const base = pos.length / 3, nx = Math.round((x1 - x0) / step) + 1;
      for (let i = 0; i < nx; i++) {
        const x = x0 + (x1 - x0) * i / (nx - 1), t = i / (nx - 1);
        const zl = zc + 220 * Math.sin(x * 0.0017 + ai * 2.1) + 70 * Math.sin(x * 0.0061 + ai);
        // a chain of crescent tops with low saddles between them; lower where the ring's line of sight crosses it
        const sx = (x - (190 + 0.364 * (-585 - zl))) / 330, sight = Math.exp(-sx * sx);
        const hump = 0.5 + 0.5 * Math.sin(x * 0.0052 + ai * 1.7 + 2. * Math.sin(x * 0.0019 + ai));
        const H = (top * (0.42 + 0.58 * hump * Math.sqrt(hump)) + 9 * Math.sin(x * 0.013 + ai * 4.)) * Math.sqrt(Math.sin(Math.PI * t)) * (1 - 0.5 * sight) + 2;
        for (let k = 0; k < 8; k++) {
          const f = AF[k], south = k < 4;
          pos.push(x, H - f * (H + 8), zl + (south ? f * (H + 8) / WIND : -f * (H + 8) / SLIP) + (k === 3 ? 0.05 : k === 4 ? -0.05 : 0));
          n.set(0, 1, south ? WIND : -SLIP).normalize(); nor.push(n.x, n.y, n.z); lev.push(LAKE_EAST);
        }
      }
      for (let i = 0; i < nx - 1; i++) for (let k = 0; k < 7; k++) {
        if (k === 3) continue;
        const q = base + i * 8 + k;
        idx.push(q, q + 8, q + 1, q + 1, q + 8, q + 9);
      }
    });
    await ctx.yield();
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('aLevel', new THREE.Float32BufferAttribute(lev, 1));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 9500);
  return g;
}

// ---------------------------------------------------------------------------------------------
// Shared GLSL
// ---------------------------------------------------------------------------------------------
const GLSL_NOISE = /* glsl */`
float hash21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash21(i), hash21(i + vec2(1., 0.)), f.x), mix(hash21(i + vec2(0., 1.)), hash21(i + vec2(1., 1.)), f.x), f.y); }
float fbm3(vec2 p){ float s = 0.5 * vnoise(p); p = p * 2.03 + 17.1; s += 0.25 * vnoise(p); p = p * 2.01 + 5.3; s += 0.125 * vnoise(p); return s * 1.143; }
`;
// the two lights of this world, shared by every material of the piece (see header)
function makeLightUniforms(pal) {
  return {
    uSkyUp: { value: new THREE.Color(0.155, 0.33, 1.0) },      // soft blue fill on upward faces
    uSkyLow: { value: new THREE.Color(pal[2]).multiplyScalar(1.5) },        // fill on downward / side faces
    uRakeDir: { value: new THREE.Vector3(0.985, 0.17, 0.05).normalize() }, // faint peach rake from the east
    uRakeCol: { value: new THREE.Color(pal[5]).multiplyScalar(0.34) },
    uLava: { value: new THREE.Color(pal[6]) },                              // lava colour (emissive)
    uLavaLit: { value: new THREE.Color(pal[6]).multiplyScalar(0.72).add(new THREE.Color(pal[5]).multiplyScalar(0.3)) },   // the light it throws on sand and skin
    uLavaGain: { value: 1.0 },
    uVeilSpeed: { value: 6.5 },                                               // how fast those veils travel, m/s
    uWind: { value: 1.0 },                                                    // 0 calm .. 1 strong: veils of blown sand snaking over the windward flanks
    uSunCol: { value: new THREE.Color(0, 0, 0) }, uSunY: { value: 46 },      // "first sun" look: rose-gold on everything above uSunY (black = off)
    uTime: { value: 0 },
  };
}

// fog uniforms (cloned) + the shared light uniforms (by reference) + the material's own
const U = (L, own) => Object.assign(THREE.UniformsUtils.merge([THREE.UniformsLib.fog]), L, own);

function makeSandMaterial(pal, L, dunes) {
  return new THREE.ShaderMaterial({
    fog: true,
    uniforms: U(L, { uSeat: { value: new THREE.Vector2(dunes.SEAT[0], dunes.SEAT[2]) }, uTongue: { value: new THREE.Vector3(dunes.crestX(SADDLE_Z), dunes.shore(dunes.crestX(SADDLE_Z) + 150, SADDLE_Z, dunes.crestX(SADDLE_Z) + 5, SADDLE_Z, -0.2)[0], SADDLE_Z) }, uSand: { value: new THREE.Color(pal[0]) }, uPale: { value: new THREE.Color(pal[1]) }, uStreak: { value: new THREE.Color('#8A5E50') } }),
    vertexShader: /* glsl */`
      attribute float aLevel;
      varying vec3 vW; varying vec3 vN; varying float vLevel;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.);
        vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vLevel = aLevel;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSand, uPale, uStreak, uSkyUp, uSkyLow, uRakeDir, uRakeCol, uLava, uLavaLit;
      uniform float uTime, uLavaGain, uWind, uVeilSpeed, uSunY; uniform vec3 uSunCol; uniform vec2 uSeat; uniform vec3 uTongue;
      varying vec3 vW; varying vec3 vN; varying float vLevel;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      float flickG(vec3 w, float t){ return 0.75 + 0.25 * vnoise(vec2((w.x + w.z) * 0.22, t * 0.6)); }
      // (polish 4) one avalanche tongue per cell along the face: a narrow head below the brink widening to a rounded toe.
      // tc: cells along the face, h: metres above the lake. -> (inside, lit toe front, signed side edge, dark outline)
      vec4 avLobe(float tc, float h, float sd){
        float ti = floor(tc), tf = (fract(tc) - 0.5) * 2.;
        float r1 = hash21(vec2(ti, sd)), r2 = hash21(vec2(ti, sd + 3.7));
        float foot = mix(1.2, 46., r1 * sqrt(r1)), len = mix(5., 14., r2);   // (polish k1: a tongue is three to six times as long as it is wide; at 36 m they were pale streaks from brink to foot, a stretched texture)
        float hT = h - foot, k = clamp(hT / len, 0., 1.);
        float wid = (0.26 + 0.24 * r2) * sqrt(clamp(k * (1. - k) * 4., 0., 1.)) * step(0., hT) * step(0.48, hash21(vec2(ti, sd + 9.2)));   // (polish 5: two cells in five carry one: a face is mostly clean)   // (polish 5: no bulb at the toe: wide and bulbed, they read as drips of paint)
        float e = wid - abs(tf);
        float aa = min(fwidth(tc) * 2., 0.5) + 0.03;
        float inside = smoothstep(0., aa, e);
        float edge = inside * (1. - smoothstep(aa, aa + 0.24, e));
        float low = 1. - smoothstep(1.5, 5., hT);
        return vec4(inside * (0.55 + 0.45 * r2), edge * low, edge * (1. - low) * sign(tf), (1. - inside) * smoothstep(-0.14 - aa, 0., e) * (0.25 + 0.75 * low));
      }
      vec4 avLobes(float al, float h){
        vec4 a = avLobe(al * 0.21 + (vnoise(vec2(al * 0.05, 3.3)) - 0.5) * 1.4, h, 5.1);   // (polish 5) tongues a metre or two wide, as grain flows are
        vec4 b = avLobe(al * 0.12 + 31.7, h * 0.8 + 1., 8.3);
        return vec4(max(a.x, b.x * (1. - a.x)), a.y + b.y * (1. - a.x), a.z + b.z * (1. - a.x), a.w + b.w * (1. - a.x));
      }
      void main(){
        vec3 n = normalize(vN);
        vec3 n0 = n;                                              // (polish 4) the face itself, before ripples: which way the lake lies
        float dist = length(cameraPosition - vW);
        float steep = 1. - n.y;                                   // 0.018 on the windward flank, 0.152 on a slip face
        float slip = smoothstep(0.128, 0.15, steep);                 // true slip faces only (0.152)
        // the wind-scoured corridor up to the ring is firm sand: no grain flows on its sides
        vec2 rs = vW.xz - uSeat; float cdd = -(rs.x * 0.342 - rs.y * 0.94), clat = abs(rs.x * 0.94 + rs.y * 0.342);
        slip *= 1. - (1. - smoothstep(38., 52., clat)) * smoothstep(-12., -6., cdd) * (1. - smoothstep(240., 270., cdd));
        float bayK = step(9.25, vLevel) * smoothstep(-430., -380., vW.x);
        slip *= 1. - bayK;      // (polish 4) nor is the wall of the west lake's bay: a wind-scoured blowout, firm and rippled
        // --- wind ripples: crests run across the wind (wind blows toward +x). Two trains of slightly different
        //     wavelength and heading are cross-faded by a slow noise, so crests waver, fork where the trains meet and
        //     die out in patches; each train fades to its average as it nears one crest per pixel (no moire, no rings).
        float kSp = 1. - smoothstep(-358., -338., vW.z);
        vec2 wdr = normalize(mix(vec2(1., 0.), vec2(0.42, -0.9), kSp));        // over the spur the wind blows up the corridor
        vec2 q = vec2(dot(vW.xz, wdr), dot(vW.xz, vec2(-wdr.y, wdr.x)));
        float warp = vnoise(q * vec2(0.9, 0.22)) * 2.6 + vnoise(q * vec2(0.13, 0.05)) * 5.;
        float phA = (q.x + 0.15 * q.y + warp * 0.11) * 46.5;      // 0.135 m ripples, crests swung 9 degrees
        float phB = (q.x - 0.11 * q.y + warp * 0.07) * 57.1;      // 0.11 m ripples, swung the other way
        float fwA = fwidth(phA), fwB = fwidth(phB);
        float wAB = smoothstep(0.43, 0.57, vnoise(q * vec2(0.6, 0.17) + 7.3));   // (polish 4: a narrower seam between the two trains: where both showed they wove a plaid)
        float rPatch = 0.3 + 0.7 * smoothstep(0.22, 0.7, vnoise(q * vec2(0.19, 0.06) + 21.));
        float keep = (1. - slip) * rPatch;
        float aA = (1. - wAB) * (1. - smoothstep(0.55, 1.6, fwA)) * keep;
        float aB = wAB * (1. - smoothstep(0.55, 1.6, fwB)) * keep;
        float f1 = aA + aB;                                        // how much ripple relief is left at this pixel
        float sA = sin(phA), sB = sin(phB);
        float r1 = sA * aA + sB * aB;
        // crests a little sharper than troughs (a second harmonic), like real ripples
        float tilt = (cos(phA) + 0.3 * cos(2. * phA + 0.6)) * aA * 0.17 + (cos(phB) + 0.3 * cos(2. * phB + 0.6)) * aB * 0.17;
        // --- the middle scales, so no stretch of sand is a bare plane: larger ripples about 1.4 m apart (crests waver,
        //     fork and die out in patches; they melt away before they near a crest per pixel), and broad low swells
        //     10 to 25 m across. Both tilt the normal and take a lit (east) and a shaded (west) side. ---
        float warpM = vnoise(q * vec2(0.21, 0.06) + 31.) * 4.2 + vnoise(q * vec2(0.05, 0.02) + 5.) * 9.;
        warpM += vnoise(q * vec2(0.27, 0.31) + 17.) * 3.4 + vnoise(q * vec2(0.6, 0.7) + 5.) * 1.1;   // (polish 3) their crests wind and fork every few metres: straight, they drew dark rays down the flank
        float phM = (q.x + 0.2 * q.y + warpM * 0.5) * 4.6;
        float aM = (1. - smoothstep(0.6, 1.9, fwidth(phM))) * (0.45 + 0.55 * smoothstep(0.38, 0.7, vnoise(q * vec2(0.05, 0.03) + 44.))) * (1. - slip);
        // (polish 2) they fork and die out every few metres, and seen along their own length (down a crest) they are held back: there they drew a fan of dark rays
        vec2 vdr = (cameraPosition.xz - vW.xz) / max(length(cameraPosition.xz - vW.xz), 1e-3);
        aM *= (0.3 + 0.7 * smoothstep(0.3, 0.58, vnoise(q * vec2(0.2, 0.17) + 63.))) * mix(0.3, 1., smoothstep(0.25, 0.75, abs(dot(vdr, wdr))));
        float hM = sin(phM) * aM;
        float tiltM = (cos(phM) + 0.35 * cos(2. * phM + 0.7)) * aM * 0.13;
        // (polish 4) and a family between them, 3.2 m apart, which is the one that reads on a flank or an islet 30 to 90 m off
        float warpN = vnoise(q * vec2(0.09, 0.03) + 83.) * 5. + vnoise(q * vec2(0.16, 0.21) + 57.) * 2.6;
        warpN = warpN * 1.5 + vnoise(q * vec2(0.3, 0.37) + 19.) * 1.6;
        float phN = (q.x - 0.24 * q.y + warpN) * 1.95;
        float aN = (1. - smoothstep(0.5, 1.6, fwidth(phN))) * (0.15 + 0.85 * smoothstep(0.36, 0.62, vnoise(q * vec2(0.085, 0.07) + 67.))) * (1. - slip) * mix(0.35, 1., smoothstep(0.25, 0.75, abs(dot(vdr, wdr)))) * smoothstep(14., 38., dist);   // (not under the eye: there the 1.4 m ripples and the fine ones are the picture)
        float tiltN = (cos(phN) + 0.4 * cos(2. * phN + 0.9)) * aN * 0.1;
        float warpL = vnoise(q * vec2(0.035, 0.012) + 71.) * 7. + vnoise(q * vec2(0.011, 0.006) + 13.) * 16.;
        warpL += vnoise(q * vec2(0.05, 0.075) + 37.) * 5.5 + vnoise(q * vec2(0.12, 0.2) + 3.) * 1.6;   // (polish 3) their crests wind every dozen metres: straight, they drew dark rays to the vanishing point
        float phL = (q.x * 0.84 + 0.55 * q.y + warpL) * 0.86;          // (polish 2: swung 33 degrees off the small ripples, so along a crest they cross the view instead of fanning out of its vanishing point)                // low transverse ridges 7 m apart: a long windward back, a short steep lee
        float aL = (1. - smoothstep(0.5, 1.7, fwidth(phL))) * (0.35 + 0.65 * smoothstep(0.3, 0.62, vnoise(q * vec2(0.012, 0.008) + 91.))) * (1. - slip) * (0.25 + 0.75 * smoothstep(0.36, 0.62, vnoise(q * vec2(0.05, 0.035) + 17.)));
        aL *= mix(0.3, 1., smoothstep(0.2, 0.7, abs(dot(vdr, normalize(wdr * 0.84 + vec2(-wdr.y, wdr.x) * 0.55)))));
        float sawL = cos(phL) + 0.5 * cos(2. * phL + 1.1) + 0.2 * cos(3. * phL + 2.0);
        float tiltL = sawL * aL * 0.062 * mix(1. - smoothstep(0.06, 0.125, steep), 1., bayK);
        // (polish 4) the scale that still reads across a whole flank: megaripples some 19 m apart, a long windward back and a
        // short lee, winding and forking; with the lava's light now coming FROM the lake they take an orange side and a blue side
        float warpX = vnoise(q * vec2(0.016, 0.006) + 51.) * 9. + vnoise(q * vec2(0.035, 0.05) + 77.) * 4.;
        float phX = (q.x * 0.93 - 0.37 * q.y + warpX) * 0.33;
        float aX = (1. - smoothstep(0.45, 1.5, fwidth(phX))) * (0.4 + 0.6 * smoothstep(0.3, 0.6, vnoise(q * vec2(0.006, 0.004) + 29.))) * (1. - slip);
        aX *= mix(1., 0.42, smoothstep(170., 420., dist));   // (polish k1) across a far flank they are soft swells: at full strength they stood on the far ridges as stepped dark slabs
        float sawX = cos(phX) + 0.45 * cos(2. * phX + 1.0) + 0.15 * cos(3. * phX + 1.9);
        float tiltX = sawX * aX * 0.085 * mix(1. - smoothstep(0.07, 0.125, steep), 1., bayK);
        float fS = (1. - smoothstep(140., 460., dist)) * (1. - slip);
        // (polish 2: the swells lie obliquely and are as long as they are wide; laid north-south they drew dark tram lines along every crest)
        vec2 qs = vec2(q.x * 0.77 - q.y * 0.64, q.x * 0.64 + q.y * 0.77);
        float sw0 = vnoise(qs * vec2(0.075, 0.05) + 3.1), swx = vnoise((qs + vec2(1.155, 0.96)) * vec2(0.075, 0.05) + 3.1);
        float tiltS = (swx - sw0) / 1.5 * 1.5 * fS;
        float east = clamp(-(0.4 * tilt + tiltM + 0.8 * tiltN + 0.7 * tiltL + tiltX + tiltS), -0.4, 0.5);          // + on faces that lean toward the dawn
        n = normalize(n + vec3(wdr.x, 0., wdr.y) * (-(tilt + tiltM + tiltN + tiltL + tiltX + tiltS)) * (0.6 + 0.4 * n.y));
        // --- albedo: rose quartz, dark mineral streaks in some troughs, broad pale and dark drifts ---
        float drift = fbm3(q * vec2(0.012, 0.004) + 3.);
        float fine = (vnoise(q * 23.) - 0.5) * (1. - smoothstep(2.5, 11., dist));
        vec3 alb = mix(uSand, uPale, 0.18 + 0.34 * drift);
        float streakN = smoothstep(0.42, 0.8, vnoise(q * vec2(0.05, 0.4) + 9.));
        alb = mix(alb, uStreak, (0.5 - 0.5 * r1 / max(f1, 0.05)) * f1 * (0.07 + 0.38 * streakN));
        // long faint mineral streaks that stay when the ripples are too fine to see
        alb = mix(alb, uStreak, 0.07 * smoothstep(0.4, 0.95, vnoise(q * vec2(0.012, 0.1) + 14.)) * (1. - slip));
        alb *= (1. + 0.1 * fine) * (1. + 0.07 * hM + 0.14 * (sw0 - 0.5) * fS);
        // --- grain flows: pale tongues of fresh sand sliding down every slip face ---
        // (the coordinate along the face is world z on the north-south ridges and world x on the spur, cross-faded, so
        //  a curved face such as the islet's never turns the streaks into rings)
        // (polish 2: chosen by place, not by the face's heading: the ridges round the flight run north-south and only the spur
        //  and the far arms run east-west; cross-fading by the normal drew rings wherever a face curved)
        float wEW = max(1. - smoothstep(-440., -400., vW.z), step(1400., abs(vW.z)) * smoothstep(0.3, 0.7, n.z * n.z / max(dot(n.xz, n.xz), 1e-4)));
        vec2 fy = vec2(vW.y * 0.085 + uTime * 0.045, vW.y * 0.3 + uTime * 0.16);   // (polish k1: trickles two or three times as long as they are wide; six and eight times, they were soft streaks down the whole wall, a stretched texture)
        float flowA = mix(vnoise(vec2(vW.z * 0.22, fy.x)), vnoise(vec2(vW.x * 0.22 + 7., fy.x)), wEW);
        float flowB = mix(vnoise(vec2(vW.z * 0.9 + 4., fy.y)), vnoise(vec2(vW.x * 0.9 + 11., fy.y)), wEW);
        float flow = smoothstep(0.5, 0.85, flowA) * (0.25 + 0.45 * (1. - smoothstep(60., 500., dist))) * (0.3 + 0.7 * smoothstep(20., 70., dist)) + smoothstep(0.55, 0.9, flowB) * 0.34 * (1. - smoothstep(30., 160., dist)) * smoothstep(12., 40., dist);
        alb = mix(alb, uPale * 1.04, slip * flow * 0.4);
        float tc = mix(vW.z, vW.x + 7., wEW) * 0.17 + (vnoise(vec2(mix(vW.z, vW.x, wEW) * 0.05, 3.3)) - 0.5) * 1.4;
        float ti = floor(tc), tf = (fract(tc) - 0.5) * 2.;
        float tEnd = mix(3., 34., hash21(vec2(ti, 5.1))) + 9. * tf * tf + 1.5 * vnoise(vec2(tc * 6., 1.7));   // height above the lake where this tongue's foot lies
        float hT = vW.y - vLevel - tEnd;
        float inT = smoothstep(-0.4, 0.6, hT) * (1. - smoothstep(0.82, 1., abs(tf)));
        float rimT = smoothstep(-1.2, 0., hT) * (1. - smoothstep(0., 1.6, hT)) + smoothstep(0.7, 0.86, abs(tf)) * (1. - smoothstep(0.86, 1., abs(tf))) * step(0., hT);
        float tFar = 1. - smoothstep(110., 340., dist);
        // (polish 2) tongues only on the tall straight faces east of the home crest: on the bay's curved wall and round the saddle their feet closed into rings
        tFar *= (1. - smoothstep(9., 9.5, vLevel)) * smoothstep(85., 135., abs(vW.z + 250.)) * (1. - wEW);
        // (polish 5: the older family of tongues with parabolic feet is no longer drawn: on the tall wall its feet were U-shaped loops, drips of paint)
        // (polish 4) avalanche tongues on every slip face and steep wall, drawn as shapes: fresh pale sand inside, a dark line
        // round each, the bulging toe lit from below by the lava, one side of each tongue brighter than the other
        float wN = smoothstep(0.3, 0.7, n0.z * n0.z / max(dot(n0.xz, n0.xz), 1e-4));
        float hAb = max(vW.y - vLevel, 0.);
        vec4 lb = mix(avLobes(vW.z, hAb), avLobes(vW.x + 13., hAb), wN);
        float alF = mix(vW.z, vW.x + 13., wN);
        float lobeK = slip * (1. - smoothstep(380., 900., dist)) * (0.5 + 0.5 * smoothstep(0.3, 0.62, vnoise(vec2(alF * 0.021, 7.7)))) * (0.12 + 0.88 * smoothstep(16., 60., dist));   // (close to the eye they are fainter: long thin lines there read as a blur)   // in clusters: some stretches of a face have slid tonight, some have not
        float lobeN = slip * (0.5 + 0.5 * smoothstep(0.3, 0.62, vnoise(vec2(alF * 0.021, 7.7)))) * (1. - smoothstep(16., 60., dist)) * 0.5;   // (polish k1) near the eye a tongue keeps its pale body and lit toe; only its thin outline fades
        alb *= 1. + (lobeK + lobeN) * 0.24 * lb.x - lobeK * 0.1 * lb.w;
        // close to the eye a slip face is combed: fine lines of grains down the fall line, and the pocks of older slides
        float nearS = slip * (1. - smoothstep(40., 170., dist));
        alb *= 1. + nearS * (0.17 * (vnoise(vec2(alF * 0.9, hAb * 0.5)) - 0.5) + 0.15 * (vnoise(vec2(alF * 0.31 + 9., hAb * 0.2)) - 0.5) + 0.1 * (vnoise(vec2(alF * 4., hAb * 2.2 + 3.)) - 0.5) * (1. - smoothstep(6., 30., dist)));   // (polish 5: soft dimples, as long as they are wide: the fine lines down the fall line read as a smear)
        // --- blown sand: pale veils snaking downwind over the ripples (saltation streamers), in gusts ---
        vec2 wdv = normalize(mix(vec2(1., 0.), vec2(0.5, -0.866), (1. - smoothstep(-345., -285., vW.z))));   // over the spur the wind swings north-east
        vec2 sp = vec2(dot(vW.xz, wdv) - uTime * uVeilSpeed, dot(vW.xz, vec2(-wdv.y, wdv.x)));
        // streamers: long thin ribbons of blown sand snaking downwind in lanes, each with a sharp head and a soft tail
        float gustS = 0.6 + 0.4 * vnoise(vec2(vW.x * 0.012 - uTime * 0.21, vW.z * 0.017));
        float lane = sp.y / 14. + (vnoise(vec2(sp.x * 0.035, sp.y * 0.02)) - 0.5) * 0.8;
        float li = floor(lane), lf = fract(lane) - 0.5;
        float hA1 = hash21(vec2(li, 3.7)), hA2 = hash21(vec2(li, 9.1));
        float wR = 0.013 + 0.013 * hA2 + dist * 0.0004;                   // half width in lanes: 0.3 to 0.6 m, never under a pixel
        float lat = (lf - (hA1 - 0.5) * 0.5) / wR;
        float tt = sp.x / mix(24., 44., hA2) + hA1 * 13.;
        float tv = fract(tt);
        float on = step(0.7, hash21(vec2(li * 1.37 + 0.3, floor(tt))));
        float ribbon = exp(-min(lat * lat * lat * lat, 30.)) * tv * sqrt(tv) * (1. - smoothstep(0.965, 1., tv)) * on;
        float veil = ribbon * 0.0 * gustS * (1. - smoothstep(60., 160., dist)) * (1. - slip) * uWind;
        // and, nearer, quicker threads of sand running between them (soft, a metre or two wide)
        float thr = vnoise(vec2((sp.x - uTime * uVeilSpeed * 0.6) * 0.16, sp.y * 0.75));
        veil += smoothstep(0.5, 0.95, thr) * 0.2 * gustS * (1. - smoothstep(30., 120., dist)) * (1. - slip) * uWind;
        alb = mix(alb, uPale * 1.22, min(veil, 1.) * 0.6);
        // single grains skittering along the ripples close to the eye
        float grain = smoothstep(0.9, 0.99, vnoise(vec2((dot(vW.xz, wdv) - uTime * 7.) * 2.2, dot(vW.xz, vec2(-wdv.y, wdv.x)) * 9.))) * (1. - smoothstep(6., 24., dist)) * (1. - slip) * uWind;
        alb += uPale * 0.09 * grain;
        // --- light 1: the sky ---
        vec3 col = alb * mix(uSkyLow, uSkyUp, n.y * 0.5 + 0.5) * (1. + 0.9 * east);
        // (polish 5) a slip face is steep and in the lee: it sees less of the sky and little of the dawn's rake, so it is the lava that
        // lights it, rose-orange at the foot and cooling to the sky's blue at the brink (it was one pale pink from top to bottom)
        col *= mix(vec3(1.), vec3(0.5, 0.6, 0.84), slip);
        col *= mix(vec3(1.), vec3(0.8, 0.9, 1.14), clamp((0.4 * tilt + tiltM + 0.7 * tiltN + 0.4 * tiltL + 0.6 * tiltX + tiltS) * 2.6, 0., 1.));   // (polish 2) two tones: the windward side of every ripple goes blue,
        col += alb * uRakeCol * max(east + 0.3 * tiltL, 0.) * 4.2;                    // and its lee side leans to the dawn and takes its peach
        // (polish 2) slip faces are fluted: broad chutes some 20 m across and the rounded backs of the avalanche tongues,
        // each with a lit and a shaded side, so a face is never one flat pink plane
        float fAl = mix(vW.z, vW.x + 7., wEW);
        float fcP = fAl * 0.047 + (vnoise(vec2(fAl * 0.021, 1.3)) - 0.5) * 1.7 + (vnoise(vec2(fAl * 0.045, vW.y * 0.016 + 3.)) - 0.5) * 0.8 + (vnoise(vec2(fAl * 0.12, vW.y * 0.03 + 8.)) - 0.5) * 0.3;
        float fluSeg = smoothstep(0.28, 0.62, vnoise(vec2(fAl * 0.06, vW.y * 0.05 + 11.)));          // (polish k1) a chute begins and ends on the face: ruled from brink to foot they read as a stretched texture
        float flute = sin(fcP * 6.2832) * (0.55 + 0.45 * vnoise(vec2(fAl * 0.013, vW.y * 0.02 + 5.))) * (0.45 + 0.55 * fluSeg) + 0.3 * sin(fcP * 15.1 + 2.) * (1. - smoothstep(60., 220., dist)) * fluSeg * smoothstep(0.3, 0.6, vnoise(vec2(fAl * 0.11 + 5., vW.y * 0.09)));
        float mott = fbm3(vec2(fAl * 0.033, vW.y * 0.011) + 23.) - 0.5;                      // broad soft drifts across the face
        float fluteK = slip * (1. - smoothstep(500., 1500., dist));
        col *= 1. + fluteK * (0.09 * flute + 0.14 * mott);
        col += alb * uRakeCol * fluteK * max(0.5 * flute + 1.2 * mott, 0.) * 0.9;
        col += uPale * uRakeCol * min(veil, 1.) * 0.5;                 // sand in the air takes the warm low light
        col += alb * uRakeCol * max(dot(n, uRakeDir), 0.) * (1. - 0.6 * slip);
        col += alb * uSunCol * (0.35 + 0.65 * max(dot(n, uRakeDir), 0.)) * smoothstep(uSunY, uSunY + 7., vW.y);
        // (polish 5) as the dawn grows (the world raises uRakeCol on the spur) it becomes a decided light: every face and ripple that
        // leans to the east takes rose-gold and every one that leans away falls into a cool blue shade
        float dawnK = clamp((uRakeCol.r - 0.36) * 2.3, 0., 1.), eR = dot(n, uRakeDir);
        col *= 1. - 0.36 * dawnK * (1. - smoothstep(-0.3, 0.12, eR)) * (1. - slip);
        col += alb * vec3(1., 0.56, 0.36) * 0.52 * dawnK * smoothstep(0.02, 0.45, eR) * (1. - slip);
        // --- light 2: the lava, from below: strongest on faces that look at the lake, dying with height ---
        float hA = max(vW.y - vLevel, 0.);
        // (polish 4) the lava's light has a direction: it comes from the lake, low, so a face that leans toward the flood is
        // orange and one that leans away keeps only the sky's blue (every ripple, swell and ridge: one orange side, one blue)
        vec2 lk = n0.xz / max(length(n0.xz), 0.06);
        float lam = max(dot(n, normalize(vec3(lk.x, 0.15, lk.y))), 0.);
        float facing = min(0.03 + 2.7 * lam * lam, 1.08);
        // and every ripple, at every scale, has a side that takes the fire and a side that keeps the sky: windward backs orange, lees blue (and peach from the dawn)
        facing *= clamp(1. + 3.2 * (0.2 * tilt + tiltM + tiltN + tiltL + tiltX) + 1.5 * tiltS, 0.3, 1.9);
        // (polish 4) the west lake is a bay, not a sea: its light dies sooner with height, so the wall above it goes from fire at
        // the foot through rose to the sky's violet-blue at the crest instead of one pink from top to bottom
        float lavaL = facing * (exp(-hA / mix(13., 8.5, bayK)) * mix(0.8, 0.95, slip) + exp(-hA / 2.4) * 0.5 - 0.035 * slip * smoothstep(8., 40., hA));
        float shim = 0.85 + 0.15 * sin(uTime * 0.7 + vW.z * 0.05 + vW.x * 0.031);
        col += alb * uLavaLit * lavaL * shim * uLavaGain;
        // (polish 5) and on the spur, whatever looks back down at the lake (the flank, the corridor's floor, the near side of every
        // ripple there) keeps some of its fire a long way up: one orange side, one blue
        float lk2 = max(dot(n, vec3(-0.302, 0.302, 0.905)), 0.); lk2 *= lk2;
        col += alb * uLavaLit * uLavaGain * 0.7 * lk2 * exp(-hA / 34.) * kSp * shim;
        col += alb * uLavaLit * uLavaGain * (exp(-hA / 22.) * 0.85 + 0.08) * lb.y * 0.62 * (lobeK + lobeN);      // the toes of the avalanche tongues
        col *= 1. + 0.2 * lb.z * (lobeK + lobeN);
        // (polish 4) the saddle tongue lights the sand beside it (it lay on the face like a decal: nothing glowed round it)
        float tGlow = exp(-max(abs(vW.z - uTongue.z) - 11., 0.) / 9.) * smoothstep(uTongue.x - 8., uTongue.x + 3., vW.x) * (1. - smoothstep(uTongue.y - 4., uTongue.y + 8., vW.x));
        col += alb * uLavaLit * uLavaGain * tGlow * 1.3 * shim;
        col += uLava * (0.5 * exp(-hA / 0.55) + 0.16 * exp(-hA / 1.6)) * flickG(vW, uTime) * uLavaGain * (1. - smoothstep(9., 9.5, vLevel) * 0.4);   // (polish 3)
        // --- the fire line where lava touches sand (kept at least a pixel tall at any range) ---
        float band = 0.22 + dist * 0.0016;
        float fl = 1. - smoothstep(0., band, hA);
        float flick = 0.6 + 0.4 * vnoise(vec2((vW.x + vW.z) * 0.35, uTime * 0.8));
        float nearFl = 0.5 + 0.5 * smoothstep(3., 22., dist);              // right under the eye the line is a glowing seam, not a white beam
        col += (uLava * (fl * fl) * 3.6 + vec3(1., 0.75, 0.3) * (fl * fl * fl * fl) * 1.2 * nearFl) * flick * uLavaGain * nearFl;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
}


// ---------------------------------------------------------------------------------------------
// Lava: one mesh for both lakes. East lake (y 0): a grid that is fine near the flight line and
// stretches to the horizon. West lake (y 18): a sheet whose east edge follows the home crest.
// A small R8 map of "sand height above the local lava level" lets the lava shader find its shores.
// ---------------------------------------------------------------------------------------------
const HMAP = { x0: -400, z0: -720, w: 1120, d: 1000, nx: 256, nz: 224, range: 8 };
async function buildHeightMap(ctx, dunes) {
  const { nx, nz } = HMAP, data = new Uint8Array(nx * nz);
  for (let j = 0; j < nz; j++) {
    const z = HMAP.z0 + (j + 0.5) / nz * HMAP.d;
    for (let i = 0; i < nx; i++) {
      const x = HMAP.x0 + (i + 0.5) / nx * HMAP.w;
      const rel = dunes.h(x, z) - dunes.level(x, z);
      data[j * nx + i] = Math.round(clamp(rel / HMAP.range * 0.5 + 0.5, 0, 1) * 255);
    }
    if (j % 6 === 0) await ctx.yield();
  }
  const tex = new THREE.DataTexture(data, nx, nz, THREE.RedFormat, THREE.UnsignedByteType);
  tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.generateMipmaps = false; tex.needsUpdate = true;
  return tex;
}
function spread(from, to, step0, grow, max) {            // distances from `from` toward `to`, steps growing
  const out = []; const sgn = Math.sign(to - from); let d = from, s = step0;
  while ((to - d) * sgn > 1e-6) { d += s * sgn; if ((to - d) * sgn < 0) d = to; out.push(d); s = Math.min(max, s * grow); }
  return out;
}
function buildLavaGeometry(dunes) {
  const pos = [], amp = [], idx = [];
  // east lake
  const xs = [...spread(60, -100, 6, 1.3, 30).reverse(), ...spread(57, 262, 3, 1, 3), ...spread(262, 7400, 4, 1.27, 2200)];
  const zs = [...spread(-120, 6600, 4, 1.27, 2200).reverse(), ...spread(-123, -363, 3, 1, 3), ...spread(-363, -6800, 4, 1.27, 2200)];
  const nx = xs.length, nz = zs.length;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    pos.push(xs[i], LAKE_EAST, zs[j]);
    amp.push(1 - smoothstep(380, 1400, Math.hypot(xs[i] - 160, zs[j] + 240)));
  }
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) { const q = j * nx + i; idx.push(q, q + nx + 1, q + 1, q, q + nx, q + nx + 1); }
  // west lake
  const ds = [2, -14, -38, -80, -140, -230, -400, -900, -2500, -7400];
  const zw = [...spread(260, 6600, 40, 1.5, 2500).reverse(), ...spread(276, -700, 16, 1, 16), ...spread(-700, -6800, 40, 1.5, 2500)];
  const base = pos.length / 3;
  for (let j = 0; j < zw.length; j++) for (let i = 0; i < ds.length; i++) { pos.push(dunes.crestX(zw[j]) + ds[i], LAKE_WEST, zw[j]); amp.push(0); }
  for (let j = 0; j < zw.length - 1; j++) for (let i = 0; i < ds.length - 1; i++) { const q = base + j * ds.length + i; idx.push(q, q + 1, q + ds.length + 1, q, q + ds.length + 1, q + ds.length); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aAmp', new THREE.Float32BufferAttribute(amp, 1));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 10500);
  return g;
}

const GLSL_HMAP = /* glsl */`
uniform sampler2D uH; uniform vec4 uHBox;
// sand height above the local lava level in metres (-8..8); 8 (= far from any mapped shore) outside the map
float sandRel(vec2 xz){
  vec2 uv = (xz - uHBox.xy) * uHBox.zw;
  float inside = step(0.004, uv.x) * step(uv.x, 0.996) * step(0.004, uv.y) * step(uv.y, 0.996);
  return mix(-8., (textureLod(uH, uv, 0.).r * 2. - 1.) * 8., inside);
}`;
const GLSL_SWELL = /* glsl */`
uniform vec2 uWhaleP, uWhaleD; uniform float uWhaleU;
float swell(vec2 p, float t){
  return 0.5 * sin(p.x * 0.045 + sin(p.y * 0.03 + t * 0.1) * 1.3 + t * 0.21) * sin(p.y * 0.038 - t * 0.17 + 1.7) + 0.22 * sin(p.x * 0.11 - p.y * 0.09 + t * 0.3);
}
vec2 whaleCo(vec2 p){ vec2 r = p - uWhaleP; return vec2(dot(r, uWhaleD), dot(r, vec2(-uWhaleD.y, uWhaleD.x))); }
float whale(vec2 p){ vec2 c = whaleCo(p); return 3.0 * uWhaleU * exp(-(c.x * c.x) / 240. - (c.y * c.y) / 34.); }
`;
function makeLavaMaterial(pal, L, hmap) {
  return new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: U(L, {
      uH: { value: hmap }, uHBox: { value: new THREE.Vector4(HMAP.x0, HMAP.z0, 1 / HMAP.w, 1 / HMAP.d) },
      uSkin: { value: new THREE.Color(pal[4]) }, uSandCol: { value: new THREE.Color(pal[0]) },
      uZen: { value: new THREE.Color(pal[3]).multiplyScalar(2.2) }, uHor: { value: new THREE.Color('#66708C').multiplyScalar(0.8) },
      uDawn: { value: new THREE.Color(pal[5]).multiplyScalar(0.6) },
      uWhaleP: { value: new THREE.Vector2(102, -290) }, uWhaleD: { value: new THREE.Vector2(0.342, -0.94) }, uWhaleU: { value: 0 }, uWhaleGlow: { value: 0 }, uOff: { value: new THREE.Vector2() }, uDelta: { value: new THREE.Vector3(1e5, 1e5, 0) },
    }),
    vertexShader: /* glsl */`
      attribute float aAmp;
      uniform float uTime;
      varying vec3 vW; varying vec3 vN; varying float vRel;
      #include <common>
      #include <fog_pars_vertex>
      ${GLSL_HMAP}
      ${GLSL_SWELL}
      float bump(vec2 p, float k){ return (swell(p, uTime) * 0.55 + whale(p)) * k; }
      void main(){
        vec4 w = modelMatrix * vec4(position, 1.);
        float rel = sandRel(w.xz);
        float k = aAmp * (1. - smoothstep(-5., -0.5, rel));          // the skin lies still where it meets sand
        float b0 = bump(w.xz, k);
        vN = normalize(vec3(b0 - bump(w.xz + vec2(1.5, 0.), k), 1.5, b0 - bump(w.xz + vec2(0., 1.5), k)));
        w.y += b0; vW = w.xyz; vRel = rel;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSkin, uSandCol, uZen, uHor, uDawn, uLava, uSkyUp, uSkyLow;
      uniform float uTime, uLavaGain, uWhaleGlow; uniform vec2 uOff; uniform vec3 uDelta;
      varying vec3 vW; varying vec3 vN; varying float vRel;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_HMAP}
      ${GLSL_SWELL}
      float folds(vec2 p){ vec2 q = p * 0.034; return fbm3(q + vec2(vnoise(q * 1.7 + 3.1), vnoise(q * 1.7 + 7.7)) * 1.7); }
      // nearest point of a jittered grid: xy = offset from it (in cells), z = its id, w = how far inside its patch
      vec4 cell(vec2 p){
        vec2 i = floor(p), f = fract(p), bo = vec2(0.); float best = 9., sec = 9., id = 0.;
        for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
          vec2 gq = vec2(float(x), float(y)); float h = hash21(i + gq);
          vec2 o = gq + vec2(h, fract(h * 57.31)) * 0.8 + 0.1 - f; float d = dot(o, o);
          if (d < best) { sec = best; best = d; bo = o; id = h; } else if (d < sec) sec = d;
        }
        return vec4(-bo, id, sqrt(sec) - sqrt(best));
      }
      // (polish k1) FRESH SHEETS. Sheet lava grows by new sheets creeping out over the older skin: each is a low terrace of flow
      // bands (festoons a couple of metres wide, laid one behind the other as the front advanced), the seams between the newest
      // bands still open and glowing, the bands behind them cooled to dark satin, and along its front a bright creeping edge that
      // buds in lobes. One smooth field in the skin's own frame (it creeps north with the skin) says where the fresh sheets lie,
      // on both lakes, everywhere; one more fans out over the east lake from the foot of the saddle's pour (uDelta: x, z, reach).
      float tF(vec2 q){ return vnoise(q * 0.017 + 21.) * 0.62 + vnoise(q * 0.047 + 5.) * 0.38; }
      vec3 skyCol(vec3 r){
        float up = clamp(r.y, 0., 1.);
        vec3 c = mix(uHor, uZen, sqrt(up));
        float e = max(r.x, 0.); float low = 1. - up; low *= low; low *= low;
        return c + uDawn * (e * e * e) * low;
      }
      void main(){
        vec3 toCam = cameraPosition - vW; float dist = length(toCam); vec3 V = toCam / max(dist, 1e-3);
        vec2 p = vW.xz + uOff + vec2(0., uTime * 1.0);                       // the whole skin creeps north at 1 m/s
        float rel0 = sandRel(vW.xz);
        // --- the crust: one warped field (the billows of the skin, swelling like rising bread). Its contour lines are
        //     drawn at two scales, as relief in the albedo AND the normal so they read at any view angle: draped pleats
        //     2-3 m apart and, on them, rope folds 0.3 m apart; each melts into a smooth tone before it can alias. ---
        float fB = 1. - 0.75 * smoothstep(150., 1500., dist), fM = 1. - smoothstep(30., 260., dist);
        float w0 = folds(p), wx = folds(p + vec2(0.35, 0.)), wz = folds(p + vec2(0., 0.35));
        vec2 gw = vec2(wx - w0, wz - w0) / 0.35;                       // slope of the broad billows
        float m0 = vnoise(p * 0.31 + 40.), mx = vnoise((p + vec2(0.4, 0.)) * 0.31 + 40.), mz = vnoise((p + vec2(0., 0.4)) * 0.31 + 40.);
        // the crust is laid in patches, each with its own heading: rope folds 0.3 m apart festooned across a patch
        // some 5 m wide, and draped pleats 2 m apart across fans some 17 m wide (most flow north with the skin)
        vec4 cA = cell(p * 0.2), cB = cell(p * 0.058 + 7.);
        float thA = -1.5708 + (cA.z - 0.5) * 2.8, thB = -1.5708 + (cB.z - 0.5) * 2.3;
        vec2 dA = vec2(cos(thA), sin(thA)), dB = vec2(cos(thB), sin(thB));
        vec2 lA = cA.xy * 5., lB = cB.xy / 0.058;
        float acA = dot(lA, vec2(-dA.y, dA.x)), acB = dot(lB, vec2(-dB.y, dB.x));
        float ph1 = (dot(lA, dA) + 0.17 * acA * acA) * 21. + m0 * 3.;
        float ph2 = (dot(lB, dB) + 0.035 * acB * acB) * 3.0 + m0 * 1.1 + w0 * 5. + vnoise(p * 0.5 + 12.) * 1.1 + vnoise(p * 0.13 + 7.) * 2.4;   // (polish 3: festoons bowed across each fan; the heavy warp drew smeared swirls)
        float a1 = step(0.5, fract(cA.z * 7.31)) * smoothstep(0.02, 0.22, cA.w) * (1. - smoothstep(0.3, 1.0, fwidth(ph1))) * (1. - step(9., vW.y));   // (polish 3: none on the west lake: at the entry a patch of them cut by the frame corner read as a comb)
        float a2 = (0.4 + 0.6 * step(0.4, fract(cB.z * 5.7))) * smoothstep(0.02, 0.14, cB.w) * (1. - smoothstep(0.45, 1.3, fwidth(ph2))) * (0.6 + 0.4 * smoothstep(0.3, 0.6, vnoise(p * 0.21 + 50.)));
        float s1 = sin(ph1 + 0.7), s2 = sin(ph2 + 0.7);
        // --- fresh sheets: dT = metres behind the creeping front (negative: old skin ahead of it) ---
        float t0 = tF(p); vec2 tg = vec2(tF(p + vec2(1.5, 0.)) - t0, tF(p + vec2(0., 1.5)) - t0);
        float tgl = max(length(tg), 0.006);
        float budT = vnoise(p * 0.21 + vec2(0., uTime * 0.11)) - 0.5;                          // the front buds in lobes a few metres wide
        float d1 = clamp((t0 - 0.6 + 0.03 * budT + 0.01 * sin(uTime * 0.05 + t0 * 20.)) * 1.5 / tgl, -40., 40.);
        vec2 rdl = vW.xz - uDelta.xy; float rdL = max(length(rdl), 0.5);
        float d2 = clamp(uDelta.z - rdL - 11. * (vnoise(vW.xz * 0.045 + 3.) - 0.5) - 2.6 * (vnoise(vW.xz * 0.21 + vec2(0., uTime * 0.1)) - 0.5), -40., 40.);
        float dT = max(d1, d2), isD = step(d1, d2);
        float wT = mix(1. - smoothstep(120., 380., dist), 1., isD) * (1. - smoothstep(-2.6, -1.2, rel0));   // (not on the last metre of a shore: that is the shoreline's own fire)
        vec2 tdir = mix(tg / tgl, -rdl / rdL, isD);
        float fwT = clamp(fwidth(dT), 0., 8.);
        // a free sheet is banded for its newest dozen metres (behind that it is the ordinary skin again); the pour's fan is banded all the way to its source
        float inS = smoothstep(0., 0.5 + fwT, dT) * wT * mix(1. - smoothstep(6.5, 11., dT), 1., isD);
        // flow bands some 2 to 4 m wide, never ruled: they widen and pinch along the front and bow in festoons (even rings read as a contour map)
        float bwT = 2.2 + 1.7 * vnoise(p * 0.06 + 71.);
        float bq = dT / bwT + 0.5 * vnoise(p * 0.12 + 9.) + 0.2 * vnoise(p * 0.37 + 9.), tb = fract(bq), sdT = min(tb, 1. - tb) * bwT;    // sdT: metres to the nearest seam
        float aB = (1. - smoothstep(0.25, 0.9, fwT / 2.8)) * inS;
        vec2 g = dA * cos(ph1) * 0.2 * a1 * (1. - 0.7 * inS) + dB * cos(ph2) * 0.3 * a2 * (1. - 0.7 * inS) + gw * 2.2 * fB + vec2(mx - m0, mz - m0) * 0.3 * fM - tdir * cos(6.2832 * tb) * 0.26 * aB;
        vec3 n = normalize(normalize(vN) + vec3(-g.x, 0., -g.y));
        float crease = (0.5 - 0.5 * sin(ph1)) * a1 * 0.5;                    // dark in the furrow between two ropes
        float cr2 = 0.5 - 0.5 * s2; cr2 = cr2 * cr2 * cr2;                   // (polish 3) drapery, not ripples: broad smooth crowns and narrow dark creases between them
        float shade = clamp(0.96 + 0.15 * a1 * s1 + a2 * (0.12 * s2 - 0.48 * cr2), 0.3, 1.7);
        // broad tone: patch by patch a little greyer or blacker, so the make of the skin still shows from the crest
        float blot = 0.6 + 0.45 * vnoise(p * 0.02 + 5.) + 0.5 * vnoise(p * vec2(0.0045, 0.0022) + 9.);
        float tone = (0.58 + 0.3 * blot) * (0.8 + 0.44 * vnoise(p * 0.045 + 61.)) * (0.88 + 0.24 * vnoise(p * 0.16 + 13.) * fM);   // (smooth: never a field of plates)
        // (polish 2) seen from the crest or the glide the skin is a calm satin sheet: its blotches fade with range, and its
        // make shows instead as flow lines, the contours of the billows drawn as long clean folds some 12 m apart
        float midK = smoothstep(45., 260., dist);
        tone = mix(tone, 0.8, 0.7 * midK);
        float ph3 = w0 * 52. + vnoise(p * 0.02 + 3.) * 9.;
        float a3 = (1. - smoothstep(0.3, 1.0, fwidth(ph3))) * midK * (0.4 + 0.6 * smoothstep(0.35, 0.6, vnoise(p * 0.011 + 80.)));
        shade *= 1. + 0.3 * a3 * (sin(ph3) + 0.35 * sin(2. * ph3 + 1.));
        // a fresh sheet is smoother and glassier than the old crust: each band a satin crown, a dark crease at each seam; the old skin lies in its shade just ahead of the front
        shade = mix(shade, 0.58 + 0.5 * sin(3.1416 * tb) * mix(1., 0.75 + 0.5 * vnoise(p * 0.9 + 3.), fM), 0.85 * aB) * (1. - 0.34 * smoothstep(-1.5, 0., dT) * (1. - smoothstep(0., 0.4, dT)) * wT);
        tone = mix(tone, 0.8, 0.5 * inS);
        // --- the skin: black-brown, the darkest large thing in any frame, with a dull pewter sheen only. It is rough,
        //     so it never mirrors the horizon: at a grazing angle it takes a capped share of a blur of the sky. ---
        vec3 nS = normalize(mix(normalize(vN), n, 0.45));
        float ndv = clamp(dot(nS, V), 0., 1.);
        float fr = (1. - ndv); fr = fr * fr * fr;
        vec3 col = uSkin * mix(uSkyLow, uSkyUp, n.y * 0.5 + 0.5) * 1.6 * tone * shade;
        float lean = smoothstep(0.1, 1., dot(nS, vec3(0.83, 0.5, 0.25)));   // faces of a swell that lean east take a little of the warm horizon
        vec3 pew = mix(vec3(0.036, 0.036, 0.046), vec3(0.068, 0.066, 0.08) + uDawn * 0.035, lean) * (0.45 + 0.55 * uSkyUp.b);
        float sk = clamp(uSkin.r * 110., 0.3, 1.5);                    // the world darkens the skin by scaling uSkin (first-sun look)
        float waver = mix(0.5 + 1.0 * vnoise(vW.xz * 0.03 + vec2(uTime * 0.45, -uTime * 0.3)), 1., 0.75 * smoothstep(45., 260., dist));   // a slow heat waver over the skin: its sheen comes and goes in drifting patches
        col += pew * tone * shade * sk * waver * (1. - 0.3 * midK) * 0.96 * (1. + 0.12 * inS);
        vec3 R = reflect(-V, nS); R.y = abs(R.y);
        vec3 skyR = mix(uHor, uZen, sqrt(clamp(R.y, 0., 1.))); skyR = mix(skyR, vec3(dot(skyR, vec3(0.3, 0.5, 0.2))), 0.45);   // pewter, not navy
        float e = max(R.x, 0.), e2 = e * e, low = 1. - clamp(R.y, 0., 1.); low *= low; low *= low;
        col += sk * (skyR * (0.085 + 0.3 * fr) + uDawn * (e2 * e2 * e) * low * fr * 0.45) * (0.55 + 0.45 * tone) * (0.5 + 0.5 * shade) * mix(waver, 1., 0.5) * (1. + 0.2 * inS);   // (polish 3: a dull pewter sheen on every side; looking west or north the lake was a black slab)
        float rel = rel0;                                              // per pixel: a smooth shore, not one stepped by the lake's cells
        // --- pale rafts of avalanched sand riding the skin ---
        float rf = fbm3(p * 0.05 + 11.) + 0.2 * mix(0.5, vnoise(p * 0.5), fM) - 0.1 - 0.25 * (1. - smoothstep(0.35, 0.6, vnoise(p * 0.006 + 2.)));
        float raft = smoothstep(0.735, 0.79, rf);
        vec3 raftCol = uSandCol * (mix(uSkyLow, uSkyUp, 0.9) * (0.8 + 0.3 * mix(0.5, vnoise(p * 2.1), fM)) + uLava * 0.22 * uLavaGain);   // pale sand, lit like the shore
        col = mix(col, mix(raftCol, vec3(dot(raftCol, vec3(0.33))), 0.45) * 0.6, raft * (0.2 + 0.3 * mix(0.5, smoothstep(0.3, 0.7, vnoise(p * 1.1 + 3.)), fM)));   // a dusting of sand going dark on the skin, not a pink plate
        float raftEdge = smoothstep(0.72, 0.745, rf) * (1. - smoothstep(0.745, 0.77, rf));
        // --- clefts: a few long sinuous splits that open, glow and skin over ---
        vec2 pc = p * 0.0105; pc += vec2(vnoise(pc * 2.3 + 1.7), vnoise(pc * 2.3 + 8.3)) * 0.55;
        float c = abs(fbm3(pc) - 0.5);
        float wc = 0.0035 + dist * 0.00002;
        float act = smoothstep(0.44, 0.7, vnoise(p * 0.0045 + vec2(3., uTime * 0.012)));
        float pulse = 0.55 + 0.45 * sin(uTime * 0.8 + vnoise(p * 0.012) * 14.);
        float fwc = fwidth(c);                                          // (polish 2) far off a thread thinner than a pixel dims instead of breaking into sparks
        float core = (1. - smoothstep(0., wc + fwc, c)) * wc / (wc + 0.6 * fwc);
        float halo = exp(-c / (wc * 2.5 + fwc));
        float cleft = (core * 3.4 + halo * 0.12) * act * pulse * (1. - raft);
        // (polish 2) and a finer family of the same long sinuous splits, so the skin seen from the crest is a clean dark
        // sheet drawn with a few bright threads (lines, never a field of plates); the speckle of short seams is kept to close range
        vec2 pd = p * 0.023 + 17.; pd += vec2(vnoise(pd * 1.9 + 4.), vnoise(pd * 1.9 + 9.)) * 0.6;
        float c2 = abs(fbm3(pd) - 0.5), wc2 = 0.0052 + dist * 0.00005;
        float act2 = smoothstep(0.56, 0.74, vnoise(p * 0.0085 + vec2(11., uTime * 0.014))) * (1. - smoothstep(170., 420., dist));
        float pulse2 = 0.6 + 0.4 * sin(uTime * 0.6 + vnoise(p * 0.02 + 3.) * 11.);
        float fwc2 = fwidth(c2);
        cleft += ((1. - smoothstep(0., wc2 + fwc2, c2)) * wc2 / (wc2 + 0.6 * fwc2) * 2.6 + exp(-c2 / (wc2 * 2.5 + fwc2)) * 0.1) * act2 * pulse2 * (1. - raft);
        // the whaleback splits along its spine
        vec2 wcd = whaleCo(vW.xz);
        float spine = (1. - smoothstep(0., 0.3 + dist * 0.0012 + 0.5 * vnoise(vec2(wcd.x * 0.4, 2.)), abs(wcd.y + sin(wcd.x * 0.3) * 1.2))) * (1. - smoothstep(11., 19., abs(wcd.x)));
        cleft += (spine * 2.8 + exp(-abs(wcd.y) / 1.1) * (1. - smoothstep(11., 19., abs(wcd.x))) * 0.3) * uWhaleGlow;
        // --- the shore: where lava touches sand it is always freshly open ---
        float bud = 0.5 + 0.5 * vnoise(p * 0.45 + vec2(0., uTime * 0.5));
        // (near the eye the open edge is a seam a hand wide, not a beam; far off it is kept a pixel tall)
        float ew = clamp(0.16 + dist * 0.022, 0.2, 0.95);
        float edge = smoothstep(-ew, -0.04, rel) * bud;
        float heat = smoothstep(-0.9, 0., rel) * 0.15;   // (polish 5: narrower again: over the drowned foot of the spur the skin was pink satin, like sand)   // (polish 3: a narrower hot margin; over the shallow bay by the spur the whole skin glowed pink like sand)
        // a few of the pleats are split along their furrow and glow: fire in the seams of the drapery
        float sv = 0.5 - 0.5 * sin(ph2);
        float seamM = step(0.7, fract(cB.z * 13.7)) * smoothstep(0.52, 0.72, vnoise(p * 0.3 + 31.)) * a2 * (1. - raft);
        float seam = smoothstep(0.95, 1., sv) * seamM * (0.6 + 0.4 * pulse) * (1. - smoothstep(70., 240., dist));
        float nearK = 1. - smoothstep(22., 120., dist);
        float seamN = a2 * smoothstep(0.56, 0.74, vnoise(p * 0.3 + 31.)) * (1. - raft) * nearK;
        { float oldK = 1. - 0.85 * inS; seam *= oldK; seamN *= oldK; seamM *= oldK; }        // the old crust's own furrows lie under a fresh sheet
        col *= 1. + 0.3 * nearK * (0.4 + 0.6 * shade);                                   // the folds catch the sky
        // the fresh sheet's fire: open seams between its newest bands (glowing in stretches, cooling with every band behind the front),
        // the bright creeping edge (open and yellow where it is budding, a dull red seam where it has crusted), the red flank of the newest band
        float wS = 0.055 + 0.75 * fwT;
        float heatIn = max(exp(-max(dT, 0.) / 2.4) * (1. - smoothstep(50., 150., dist)), isD * (0.3 + 0.7 * exp(-rdL / 30.)));   // (a free sheet: only its newest seam or two, and only near the eye: rings of fire inside every lobe read as a contour map)   // seams cool band by band behind a front; the pour's fan stays hot toward its source
        float segT = smoothstep(0.34, 0.6, vnoise(p * 0.19 + 44.) * 0.7 + 0.3 * vnoise(p * 0.07 + 13.)) * (0.45 + 0.75 * vnoise(p * 0.11 + 27.));   // a seam is open in stretches, shut and dark between them
        float seamT = (1. - smoothstep(0., wS, sdT)) * (0.055 + 0.2 * fwT) / wS * (3.2 * heatIn + 0.08) * segT * inS * (0.7 + 0.3 * pulse);
        float actE = 0.12 + 0.88 * smoothstep(0.36, 0.62, vnoise(p * 0.035 + vec2(7., uTime * 0.02)));
        float wE = 0.3 + 0.6 * min(fwT, 2.5);
        float edgeT = (1. - smoothstep(0., wE, abs(dT - 0.2))) * min(1., 0.5 / wE) * actE * wT * (0.75 + 0.5 * (budT + 0.5));
        float flankT = smoothstep(-0.1, 0.3, dT) * (1. - smoothstep(0.3, 2.8, dT)) * wT * actE;
        float fire = cleft + edge * edge * mix(2.6, 3.8, smoothstep(4., 30., dist)) + heat + seam * 2.7 + smoothstep(0.55, 1., sv) * seamM * 0.1;
        fire += (smoothstep(0.94, 1., sv) * 1.3 + smoothstep(0.55, 1., sv) * 0.08) * seamN * (0.55 + 0.45 * pulse) + crease * nearK * 0.12;
        col += uLava * uSkin * 7. * smoothstep(0.25, 1., sv) * seamN * (0.5 + 0.5 * s2);     // and the glow of a furrow on the pleat beside it
        col += (uLava * fire + vec3(1., 0.8, 0.35) * max(fire - 2.6, 0.) * 0.5 * smoothstep(3., 25., dist)) * uLavaGain;
        // the glow of a cleft on the skin beside it
        col += uLava * uSkin * 8. * (halo * act * pulse + heat * 2.) * tone;
        col += uLava * ((edgeT * 3.3 + seamT + flankT * 0.2) * (1. - raft * 0.7)) * uLavaGain + vec3(1., 0.8, 0.35) * max(edgeT * 3.3 - 2.3, 0.) * 0.45 * uLavaGain;
        col += uLava * uSkin * 10. * exp(min(dT, 0.) / 1.7) * (1. - smoothstep(0., 0.6, dT)) * wT * actE * tone;   // and its light on the old skin just ahead of it
        col += uLava * 0.035 * exp(-c / (wc * 5. + fwc)) * act * pulse * shade * tone * (1. - raft) * uLavaGain;   // (polish 3) the folds beside a cleft catch its light
        gl_FragColor = vec4(clamp(col, 0., 40.), 1.);
        #include <fog_fragment>
      }`,
  });
}

// ---------------------------------------------------------------------------------------------
// The desert runner: a slim filament-coated theropod, 2.6 m long, 0.9 m at the hip.
// Model space: +z forward, +y up, ground y 0, hip joint over the origin. One skinned geometry
// (two bones per vertex, 20 bones, matrices set on the CPU), so legs bend at real joints.
// Bones: 0 body, 1 unused, 2-4 neck, 5 head, 6-11 tail, 12-15 left leg (thigh, shin, shank, foot), 16-19 right leg.
// ---------------------------------------------------------------------------------------------
const TH = {
  hip: [0.118, 0.88, 0.0], knee: [0.125, 0.70, 0.21], ankle: [0.12, 0.34, -0.035], foot: [0.12, 0.036, 0.04],
  neck: [[0, 0.97, 0.58], [0, 1.085, 0.685], [0, 1.19, 0.72]], head: [0, 1.262, 0.762],
  tail: [0, 1, 2, 3, 4, 5].map((k) => [0, 0.935, -0.2 - k * 0.195]),
  eye: [0.043, 1.297, 0.842],
};
class SkinGeo {
  constructor() { this.pos = []; this.skin = []; this.part = []; this.finUV = []; this.idx = []; this.groups = []; }
  get count() { return this.pos.length / 3; }
  v(p, skin, part, fu = 0, fv = 0) { this.pos.push(p[0], p[1], p[2]); this.skin.push(skin[0], skin[1], skin[2]); this.part.push(part); this.finUV.push(fu, fv); return this.count - 1; }
  // rings: [{ p:[x,y,z], rt, rb, rx, skin:[a,b,w], part }]; cross-sections stand square to the path; side = the ring's "right" vector
  loft(rings, sides, side = [1, 0, 0], capA = true, capB = true) {
    const base = this.count, n = rings.length, S = new THREE.Vector3(...side), t = new THREE.Vector3(), up = new THREE.Vector3(), rt = new THREE.Vector3(), q = new THREE.Vector3();
    for (let i = 0; i < n; i++) {
      const a = rings[Math.max(0, i - 1)].p, b = rings[Math.min(n - 1, i + 1)].p, r = rings[i];
      t.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize();
      up.crossVectors(t, S).normalize(); rt.crossVectors(up, t).normalize();
      for (let k = 0; k < sides; k++) {
        const ang = k / sides * TAU, c = Math.cos(ang), sn = Math.sin(ang);
        // a little squarer than an ellipse: a body, not a tube
        const cs = Math.sign(c) * Math.pow(Math.abs(c), 0.85), ss = Math.sign(sn) * Math.pow(Math.abs(sn), 0.85);
        q.set(r.p[0], r.p[1], r.p[2]).addScaledVector(rt, ss * r.rx).addScaledVector(up, cs * (c > 0 ? r.rt : r.rb));
        this.v([q.x, q.y, q.z], r.skin, r.part ?? 0);
      }
    }
    for (let i = 0; i < n - 1; i++) for (let k = 0; k < sides; k++) {
      const a = base + i * sides + k, b = base + i * sides + (k + 1) % sides, c = a + sides, d = b + sides;
      this.idx.push(a, c, b, b, c, d);
    }
    if (capA) { const c = this.v(rings[0].p, rings[0].skin, rings[0].part ?? 0); for (let k = 0; k < sides; k++) this.idx.push(c, base + k, base + (k + 1) % sides); }
    if (capB) { const o = base + (n - 1) * sides, c = this.v(rings[n - 1].p, rings[n - 1].skin, rings[n - 1].part ?? 0); for (let k = 0; k < sides; k++) this.idx.push(c, o + (k + 1) % sides, o + k); }
  }
  // a limb or toe: round tube through points [[x,y,z,r], ...] on one bone (or blended at the given rings)
  tube(pts, sides, skin, part, side = [1, 0, 0], flat = 1) {
    this.loft(pts.map((p, i) => ({ p, rt: p[3] * flat, rb: p[3] * flat, rx: p[3], skin: Array.isArray(skin[0]) ? skin[i] : skin, part })), sides, side);
  }
  // a fringe of filaments: a strip standing on base points; drawn ragged by the shader (fu along, fv 0 root .. 1 tip)
  fin(pts, part = 4) {   // pts: [{ p, out:[x,y,z], len, skin }]
    const base = this.count; let u = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      if (i) u += Math.hypot(a.p[0] - pts[i - 1].p[0], a.p[1] - pts[i - 1].p[1], a.p[2] - pts[i - 1].p[2]);
      this.v(a.p, a.skin, part, u, 0);
      this.v([a.p[0] + a.out[0] * a.len, a.p[1] + a.out[1] * a.len, a.p[2] + a.out[2] * a.len], a.skin, part, u, 1);
    }
    for (let i = 0; i < pts.length - 1; i++) { const q = base + i * 2; this.idx.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
    this.finRanges = this.finRanges || []; this.finRanges.push([base, this.count]);
  }
  build() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
    g.setIndex(this.idx); g.computeVertexNormals();
    // fins take a soft outward normal so they are lit like the coat they grow from
    const N = g.attributes.normal;
    for (const [a, b] of this.finRanges || []) for (let i = a; i < b; i += 2) {
      const o = new THREE.Vector3(this.pos[i * 3 + 3] - this.pos[i * 3], this.pos[i * 3 + 4] - this.pos[i * 3 + 1], this.pos[i * 3 + 5] - this.pos[i * 3 + 2]).normalize();
      N.setXYZ(i, o.x, o.y, o.z); N.setXYZ(i + 1, o.x, o.y, o.z);
    }
    g.setAttribute('aSkin', new THREE.Float32BufferAttribute(this.skin, 3));
    g.setAttribute('aPart', new THREE.Float32BufferAttribute(this.part, 1));
    g.setAttribute('aFin', new THREE.Float32BufferAttribute(this.finUV, 2));
    return g;
  }
}
// spine profile, tail tip to snout: [z, y centre, top radius, belly radius, half width]
const SPINE = [
  [-1.38, 0.962, 0.006, 0.006, 0.005], [-1.26, 0.960, 0.016, 0.015, 0.012], [-1.1, 0.957, 0.026, 0.024, 0.019], [-0.94, 0.953, 0.037, 0.034, 0.027],
  [-0.78, 0.949, 0.049, 0.045, 0.036], [-0.62, 0.944, 0.062, 0.057, 0.046], [-0.47, 0.939, 0.076, 0.071, 0.058], [-0.33, 0.933, 0.092, 0.09, 0.073],
  [-0.2, 0.927, 0.112, 0.115, 0.094], [-0.08, 0.922, 0.138, 0.15, 0.122], [0.04, 0.92, 0.152, 0.168, 0.14], [0.15, 0.922, 0.146, 0.142, 0.126],
  [0.24, 0.92, 0.142, 0.132, 0.117], [0.34, 0.912, 0.15, 0.2, 0.136], [0.44, 0.908, 0.152, 0.245, 0.15], [0.53, 0.92, 0.135, 0.225, 0.135],
  [0.6, 0.955, 0.108, 0.17, 0.104], [0.655, 1.015, 0.082, 0.105, 0.076], [0.69, 1.085, 0.064, 0.074, 0.058], [0.708, 1.15, 0.054, 0.06, 0.049],
  [0.722, 1.205, 0.05, 0.052, 0.045], [0.742, 1.25, 0.052, 0.05, 0.046], [0.775, 1.278, 0.056, 0.05, 0.05], [0.83, 1.288, 0.054, 0.05, 0.05],
  [0.885, 1.282, 0.043, 0.046, 0.041], [0.94, 1.272, 0.031, 0.039, 0.03], [0.99, 1.262, 0.021, 0.03, 0.021], [1.03, 1.254, 0.012, 0.02, 0.013], [1.048, 1.25, 0.004, 0.008, 0.005],
];
function spineSkin(r, z) {      // r = ring index in SPINE units
  if (r < 9) {                    // tail: blend across each joint
    const f = (-0.2 - z) / 0.195 + 0.5, k = Math.min(5, Math.floor(f));
    if (k < 0) return [0, 0, 0];
    return [k === 0 ? 0 : 5 + k, 6 + k, smoothstep(0.2, 0.8, f - k)];
  }
  if (r < 15.5) return [0, 0, 0];
  if (r < 17) return [0, 2, smoothstep(15.5, 16.8, r)];
  if (r < 19) return [2, 3, smoothstep(17.4, 18.6, r)];
  if (r < 20.8) return [3, 4, smoothstep(19.2, 20.3, r)];
  return [4, 5, smoothstep(20.9, 22.0, r)];
}
function buildTheropodGeometry() {
  const G = new SkinGeo();
  // --- body: one continuous loft, tail tip to snout (profile subdivided once) ---
  const rings = [], cr = (a, b, c, d, t) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t * t * t);
  for (let i = 0; i < SPINE.length - 1; i++) for (let h = 0; h < 2; h++) {
    const t = h * 0.5, A = SPINE[Math.max(0, i - 1)], B = SPINE[i], C = SPINE[i + 1], D = SPINE[Math.min(SPINE.length - 1, i + 2)];
    const v = [0, 1, 2, 3, 4].map((k) => cr(A[k], B[k], C[k], D[k], t));
    rings.push({ r: i + t, p: [0, v[1], v[0]], rt: Math.max(0.003, v[2]), rb: Math.max(0.003, v[3]), rx: Math.max(0.003, v[4]) });
  }
  { const L = SPINE[SPINE.length - 1]; rings.push({ r: SPINE.length - 1, p: [0, L[1], L[0]], rt: L[2], rb: L[3], rx: L[4] }); }
  for (const r of rings) r.skin = spineSkin(r.r, r.p[2]);
  G.loft(rings, 16);
  // dorsal and ventral lines, for the filament fringes
  const dors = [], vent = [];
  for (let i = 0; i < rings.length; i++) {
    const a = rings[Math.max(0, i - 1)].p, b = rings[Math.min(rings.length - 1, i + 1)].p, r = rings[i];
    const ty = b[1] - a[1], tz = b[2] - a[2], l = Math.hypot(ty, tz) || 1, t = [0, ty / l, tz / l], up = [0, t[2], -t[1]];
    dors.push({ r: r.r, p: [0, r.p[1] + up[1] * r.rt * 0.9, r.p[2] + up[2] * r.rt * 0.9], up, t, skin: r.skin });
    vent.push({ r: r.r, p: [0, r.p[1] - up[1] * r.rb * 0.9, r.p[2] - up[2] * r.rb * 0.9], up: [0, -up[1], -up[2]], t, skin: r.skin });
  }
  const fringe = (line, r0, r1, lenAt, lean) => G.fin(line.filter((d) => d.r >= r0 && d.r <= r1).map((d) => {
    const o = [0, d.up[1] - d.t[1] * lean, d.up[2] - d.t[2] * lean], l = Math.hypot(o[1], o[2]);
    return { p: d.p, out: [0, o[1] / l, o[2] / l], len: lenAt(d.r), skin: d.skin };
  }));
  fringe(dors, 15, 22.5, (r) => 0.05 + 0.055 * bellJS(r, 15.5, 22.5), 0.75);          // the neck crest
  fringe(dors, 9, 15, () => 0.042, 1.2);                                                // back
  fringe(dors, 0, 9, (r) => 0.03 + 0.07 * smoothstep(3.5, 0, r), 1.5);                  // tail, above
  fringe(vent, 0, 9, (r) => 0.032 + 0.075 * smoothstep(3.5, 0, r), 1.5);                // tail, below
  fringe(vent, 12, 19.5, (r) => 0.03 + 0.02 * bellJS(r, 13, 17), 1.0);                  // chest and throat
  // --- legs ---
  for (const sg of [1, -1]) {
    const B = sg > 0 ? 12 : 16, X = (v) => [v[0] * sg, v[1], v[2]];
    const H = X(TH.hip), K = X(TH.knee), A = X(TH.ankle), F = X(TH.foot), mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    // thigh: deep fore and aft, thin side to side, its top buried in the body
    G.loft([[-0.25, 0.09, 0.105], [0.1, 0.128, 0.14], [0.5, 0.11, 0.118], [0.85, 0.074, 0.076], [1.02, 0.056, 0.056]].map(([t, rf, rbk]) => ({ p: mix3(H, K, t), rt: rf, rb: rbk, rx: 0.074 - 0.03 * t, skin: [B, B, 1] })), 10);
    // shin: a drumstick, the calf behind, tapering to a thin ankle
    G.loft([[-0.04, 0.05, 0.052, 0.05], [0.14, 0.058, 0.074, 0.054], [0.34, 0.05, 0.068, 0.047], [0.58, 0.035, 0.044, 0.034], [0.82, 0.024, 0.028, 0.023], [1.0, 0.021, 0.024, 0.02]]
      .map(([t, rf, rbk, rx]) => ({ p: mix3(K, A, t), rt: rf, rb: rbk, rx, skin: [B + 1, B + 1, 1] })), 10);
    // shank: bare, thin, with a knob at the ankle and at the toe joint
    G.loft([[-0.05, 0.02, 0.02], [0.02, 0.027, 0.033], [0.12, 0.02, 0.023], [0.5, 0.0165, 0.02], [0.86, 0.018, 0.021], [1.0, 0.025, 0.024]]
      .map(([t, rf, rbk]) => ({ p: mix3(A, F, t), rt: rf, rb: rbk, rx: rf * 0.95, skin: [B + 2, B + 2, 1], part: 1 })), 8);
    // toes: three forward, the middle longest, splayed 54 degrees; a small dewclaw held clear on the inside
    for (const [ang, len] of [[0, 0.2], [0.47 * sg, 0.15], [-0.47 * sg, 0.145]]) {
      const d = [Math.sin(ang), 0, Math.cos(ang)], P = (t, y, r) => [F[0] + d[0] * len * t, y, F[2] + d[2] * len * t, r];
      G.loft([P(-0.08, 0.034, 0.02), P(0.3, 0.021, 0.0175), P(0.55, 0.019, 0.016), P(0.8, 0.014, 0.0115), P(0.9, 0.012, 0.008), P(1.0, 0.003, 0.002)]
        .map((q, i) => ({ p: q, rt: q[3], rb: q[3] * 0.8, rx: q[3] * 1.1, skin: [B + 3, B + 3, 1], part: i >= 4 ? 3 : 1 })), 6, [d[2], 0, -d[0]]);
    }
    G.tube([[A[0] - 0.012 * sg, 0.115, A[2] + 0.03, 0.011], [A[0] - 0.03 * sg, 0.09, A[2] + 0.012, 0.009], [A[0] - 0.042 * sg, 0.066, A[2] + 0.004, 0.003]], 5, [B + 2, B + 2, 1], 3, [0, 0, 1]);
    // filaments down the back of thigh and shin
    G.fin([[H, -0.2, 0.1, B], [H, 0.3, 0.115, B], [H, 0.75, 0.085, B], [K, 0.14, 0.07, B + 1], [K, 0.4, 0.06, B + 1], [K, 0.62, 0.04, B + 1]].map(([J, t, off, bone], i) => {
      const J2 = J === H ? K : A, q = mix3(J, J2, t), ty = J2[1] - J[1], tz = J2[2] - J[2], l = Math.hypot(ty, tz), back = [0, -tz / l, ty / l];
      return { p: [q[0], q[1] + back[1] * off * 0.8, q[2] + back[2] * off * 0.8], out: [0, back[1] * 0.75 - 0.66, back[2] * 0.75], len: 0.05 - 0.004 * i, skin: [bone, bone, 1] };
    }));
    // --- arms: short, folded against the chest, palms facing each other ---
    const S = [0.132 * sg, 0.8, 0.47], E = [0.152 * sg, 0.672, 0.385], W = [0.126 * sg, 0.662, 0.528];
    G.tube([[...S, 0.036], [...mix3(S, E, 0.5), 0.032], [...E, 0.027]], 7, [0, 0, 0], 0, [1, 0, 0]);
    G.tube([[...E, 0.027], [...mix3(E, W, 0.5), 0.024], [...W, 0.017]], 7, [0, 0, 0], 0, [1, 0, 0]);
    for (const [dy, dz, ln] of [[0.012, 0.085, 1], [-0.03, 0.08, 1.1], [-0.062, 0.058, 0.9]])
      G.tube([[...W, 0.012], [W[0] - 0.012 * sg, W[1] + dy * 0.6 * ln, W[2] + dz * 0.6 * ln, 0.0085], [W[0] - 0.022 * sg, W[1] + dy * ln - 0.006, W[2] + dz * ln, 0.0025]], 5, [0, 0, 0], 3, [1, 0, 0]);
    G.fin([0, 0.33, 0.66, 1].map((t) => ({ p: mix3(E, W, t), out: [0.3 * sg, -0.93, -0.2], len: 0.085 - 0.02 * t, skin: [0, 0, 0] })));
    // --- eye: a dark bead standing a little proud of the skull ---
    const er = 0.0225, ex = (TH.eye[0] - 0.003) * sg;
    G.loft([-1, -0.6, 0, 0.6, 1].map((o) => ({ p: [ex + o * er * 0.8, TH.eye[1], TH.eye[2]], rt: er * Math.sqrt(1.02 - o * o), rb: er * Math.sqrt(1.02 - o * o), rx: er * Math.sqrt(1.02 - o * o), skin: [5, 5, 1], part: 2 })), 8, [0, 0, 1]);
  }
  const geo = G.build();
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.8, -0.1), 1.6);
  return geo;
}
const bellJS = (x, a, b) => { const t = clamp((x - a) / (b - a), 0, 1); return Math.sin(t * Math.PI); };

function makeTheropodMaterial(pal, L, o = {}) {
  const bones = []; for (let i = 0; i < 20; i++) bones.push(new THREE.Matrix4());
  const coat = new THREE.Color(pal[0]), pale = new THREE.Color(pal[5]);
  if (o.pale) coat.lerp(pale, o.pale);
  if (o.hue) coat.offsetHSL(o.hue, 0, o.light || 0);
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide,
    uniforms: U(L, {
      uBones: { value: bones }, uBreath: { value: 0 }, uBlink: { value: 0 }, uRuffle: { value: 0.3 },
      uCoat: { value: coat }, uBelly: { value: pale }, uBand: { value: new THREE.Color('#5A3A30') }, uSpeck: { value: new THREE.Color('#A06C54') }, uBare: { value: new THREE.Color('#3A2A26') },
      uLavaDir: { value: new THREE.Vector3(0.75, -0.6, 0.1).normalize() }, uLavaI: { value: 0.9 },
    }),
    vertexShader: /* glsl */`
      attribute vec3 aSkin; attribute float aPart; attribute vec2 aFin;
      uniform mat4 uBones[20]; uniform float uTime, uBreath, uRuffle;
      varying vec3 vRest, vRestN, vW, vN; varying float vPart; varying vec2 vFin;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        vec3 p = position;
        // breathing: the flanks swell and the belly drops a little
        float chest = smoothstep(0.08, 0.3, p.z) * (1. - smoothstep(0.5, 0.64, p.z)) * (1. - step(1.02, p.y)) * (1. - step(0.5, aPart) * step(aPart, 3.5));
        p.x *= 1. + 0.05 * uBreath * chest; p.y -= 0.012 * uBreath * chest * (1. - smoothstep(0.8, 0.95, p.y));
        // filaments lift and shiver in the wind (tips only)
        float tip = aFin.y * step(3.5, aPart);
        p += tip * vec3(0.012 * sin(uTime * 9. + aFin.x * 40.), 0.02 * uRuffle * (0.6 + 0.4 * sin(uTime * 5.3 + aFin.x * 23.)), -0.02 * uRuffle * sin(uTime * 3.1 + aFin.x * 9.));
        mat4 A = uBones[int(aSkin.x + 0.5)], B = uBones[int(aSkin.y + 0.5)];
        vec4 w = modelMatrix * mix(A * vec4(p, 1.), B * vec4(p, 1.), aSkin.z);
        vec3 n = mix(mat3(A) * normal, mat3(B) * normal, aSkin.z);
        vN = mat3(modelMatrix) * n; vRest = position; vRestN = normal; vW = w.xyz; vPart = aPart; vFin = aFin;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uCoat, uBelly, uBand, uSpeck, uBare, uSkyUp, uSkyLow, uRakeDir, uRakeCol, uLavaLit, uLavaDir;
      uniform float uBlink, uLavaI, uLavaGain;
      varying vec3 vRest, vRestN, vW, vN; varying float vPart; varying vec2 vFin;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        vec3 r = vRest; vec3 rn = vRestN / max(length(vRestN), 1e-4);
        float isFin = step(3.5, vPart), isBare = step(0.5, vPart) * step(vPart, 1.5), isEye = step(1.5, vPart) * step(vPart, 2.5), isClaw = step(2.5, vPart) * step(vPart, 3.5);
        // ragged filament edge
        float strand = 0.7 * vnoise(vec2(vFin.x * 210., 3.)) + 0.3 * vnoise(vec2(vFin.x * 700., 7.));
        if (isFin > 0.5 && vFin.y > 0.22 + 0.78 * strand) discard;
        // --- coat: rose above, pale throat and belly ---
        float neckK = smoothstep(0.99, 1.1, r.y) * (1. - smoothstep(1.2, 1.26, r.y)) * step(0.5, r.z);
        vec3 upAx = normalize(mix(vec3(0., 1., 0.), vec3(0., 0.25, -0.97), neckK));
        float under = 1. - smoothstep(-0.6, 0.05, dot(rn, upAx));
        under = max(under, (1. - smoothstep(1.245, 1.262, r.y - (r.z - 0.82) * 0.09)) * step(0.76, r.z) * step(1.2, r.y));   // lower jaw
        vec3 alb = mix(uCoat, uBelly, under * 0.9);
        // fine speckle over back and thighs
        float sp = vnoise(vec2(r.z * 120. + r.x * 53., r.y * 120. - r.x * 31.));
        alb = mix(alb, uSpeck * 0.85, smoothstep(0.6, 0.76, sp) * 0.6 * (1. - under));
        alb *= 0.9 + 0.2 * vnoise(vec2(r.z * 9. + r.x * 5., r.y * 11.));
        // six dark bands on the tail
        float bf = fract((-r.z - 0.3) / 0.168);
        float band = smoothstep(0.46, 0.56, bf) * (1. - smoothstep(0.9, 1.0, bf)) * step(r.z, -0.3) * (1. - 0.5 * under);
        alb = mix(alb, uBand, band * 0.9);
        // head: a dark stripe through the eye, the mouth line, a nostril
        float head = step(0.74, r.z) * step(1.2, r.y);
        float eyeLine = (1. - smoothstep(0.010, 0.019, abs(r.y - (1.297 + (r.z - 0.842) * 0.06)))) * smoothstep(0.75, 0.79, r.z) * (1. - smoothstep(0.95, 1.0, r.z)) * step(0.018, abs(r.x));
        float mouth = (1. - smoothstep(0.0028, 0.0062, abs(r.y - (1.2545 - (r.z - 0.82) * 0.07)))) * smoothstep(0.805, 0.83, r.z) * step(0.006, abs(r.x));
        float nostril = 1. - smoothstep(0.005, 0.009, length(vec2(r.z - 1.003, r.y - 1.266)));
        alb = mix(alb, uBand * 0.8, head * max(eyeLine * 0.9, max(mouth, nostril)));
        float eyeD = length(vec2(r.z - 0.842, r.y - 1.297));
        alb = mix(alb, uBand * 0.7, head * (1. - smoothstep(0.026, 0.036, eyeD)) * step(0.02, abs(r.x)) * (1. - isEye));   // the bead sits in a dark socket (no pale ring)
        // bare scaly shanks and toes, horn claws
        float scute = 0.8 + 0.2 * sin(r.y * 330. + r.z * 250.);
        alb = mix(alb, uBare * scute * 2.7, isBare);
        alb = mix(alb, uBare * 1.5, isClaw);
        alb = mix(alb, mix(vec3(0.012, 0.009, 0.008), uCoat * 0.8, uBlink), isEye);
        alb *= 1. - 0.25 * isFin * vFin.y;
        // --- the two lights ---
        vec3 n = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        if (!gl_FrontFacing) n = -n;
        vec3 col = alb * mix(uSkyLow, uSkyUp, n.y * 0.5 + 0.5) * 1.75;
        col += alb * uRakeCol * max(dot(n, uRakeDir), 0.) * 1.6;
        float ll = clamp(dot(n, uLavaDir) * 0.8 + 0.2, 0., 1.);
        col += alb * uLavaLit * ll * ll * uLavaI * uLavaGain * 2.2;
        // soft rim of the filament coat against the sky
        float rim = 1. - clamp(dot(n, V), 0., 1.); rim = rim * rim * rim;
        col += alb * uSkyUp * rim * 0.45 * (1. - isEye);
        float rl = 1. - clamp(dot(n, V), 0., 1.);
        col += alb * uLavaLit * rl * rl * clamp(dot(n, uLavaDir) + 0.75, 0., 1.) * uLavaI * uLavaGain * 1.7 * (1. - isEye);   // the fire's rim round the far side
        // one glint in the eye
        vec3 Hh = normalize(V + normalize(vec3(0.5, 0.75, 0.2)));
        float g = clamp(dot(n, Hh), 0., 1.); g *= g; g *= g; g *= g; g *= g;
        col += vec3(0.7, 0.8, 1.0) * g * 2.2 * isEye * (1. - uBlink) + vec3(0.25, 0.3, 0.42) * rim * isEye * 0.3;
        gl_FragColor = vec4(col, 1.);
        #include <fog_fragment>
      }`,
  });
  return { mat, bones };
}

// stride cycle length (two footfalls) for a ground speed: 1.0 m ambling, 3.4 m at the 9 m/s run (footfalls 1.7 m apart)
export const theropodCycle = (v) => lerp(1.0, 3.4, smoothstep(0.3, 9, v));
const _A = new THREE.Matrix4(), _B = new THREE.Matrix4(), _C = new THREE.Matrix4(), _T = new THREE.Matrix4(), _R = new THREE.Matrix4();
const rotAbout = (out, j, rx, ry) => {          // rotate about joint j (rest position): T(j) Ry Rx T(-j)
  out.makeTranslation(j[0], j[1], j[2]);
  if (ry) out.multiply(_R.makeRotationY(ry));
  if (rx) out.multiply(_R.makeRotationX(rx));
  return out.multiply(_R.makeTranslation(-j[0], -j[1], -j[2]));
};
const angDown = (dy, dz) => Math.atan2(dz, -dy);                       // angle of a leg segment from straight down, toward the front
const A_FEMUR = angDown(TH.knee[1] - TH.hip[1], TH.knee[2] - TH.hip[2]), L_FEMUR = Math.hypot(TH.knee[1] - TH.hip[1], TH.knee[2] - TH.hip[2]);
const A_TIBIA = angDown(TH.ankle[1] - TH.knee[1], TH.ankle[2] - TH.knee[2]), L_TIBIA = Math.hypot(TH.ankle[1] - TH.knee[1], TH.ankle[2] - TH.knee[2]);
const A_META = angDown(TH.foot[1] - TH.ankle[1], TH.foot[2] - TH.ankle[2]), L_META = Math.hypot(TH.foot[1] - TH.ankle[1], TH.foot[2] - TH.ankle[2]);
// Pose the 20 bones. st: { x, y, z: ground point under the hips (parent space), yaw: heading (0 = +z, atan2(dx, dz)),
//   speed m/s, phase: stride cycles run (see theropodCycle), time s, look: head yaw rad, groundL, groundR: ground height
//   under each foot relative to y (optional), alert 0..1 }
export function poseTheropod(bones, st) {
  const v = st.speed || 0, g = smoothstep(0.05, 0.6, v), r = smoothstep(1.5, 7, v), t = st.time || 0, ph = st.phase || 0;
  const duty = lerp(0.62, 0.26, r), Lc = theropodCycle(v), half = Math.min(Lc * duty * 0.5, 0.45), lift = lerp(0.09, 0.3, r);
  const bob = g * lerp(0.012, 0.04, r) * Math.cos(2 * TAU * ph + 0.9), crouch = 0.055 * r;
  const sway = g * 0.06 * Math.sin(TAU * ph), pitch = 0.07 * r + 0.012 * Math.sin(t * 4.2) * (1 - g);
  const shift = (1 - g) * 0.014 * Math.sin(t * 0.43);                 // standing: weight shifts from foot to foot
  // animal frame (ground-aligned) and body
  _A.makeTranslation(st.x, st.y, st.z).multiply(_R.makeRotationY(st.yaw));
  const hipY = TH.hip[1] + bob - crouch;
  _B.makeTranslation(shift, bob - crouch, 0).multiply(rotAbout(_T, [0, 0.9, 0], pitch, sway));
  bones[0].multiplyMatrices(_A, _B); bones[1].copy(bones[0]);
  // neck and head: stretch forward at speed, keep the skull level and steady while the body bobs
  const look = st.look || 0, reach = 0.3 * r + 0.1 * (st.alert || 0);
  const nrx = [reach * 0.9, reach * 0.45, -reach * 0.25], nry = [look * 0.2, look * 0.25, look * 0.2];
  let par = bones[0], sum = pitch;
  for (let k = 0; k < 3; k++) { bones[2 + k].multiplyMatrices(par, rotAbout(_T, TH.neck[k], nrx[k], nry[k])); par = bones[2 + k]; sum += nrx[k]; }
  bones[5].multiplyMatrices(par, rotAbout(_T, TH.head, -sum + 0.04 * Math.sin(t * 0.9), look * 0.35 - sway));
  // undo most of the bob at the head (pre-multiplied in parent space)
  for (let k = 0; k < 4; k++) { const cb = -(bob) * [0.25, 0.5, 0.7, 0.85][k]; bones[2 + k].premultiply(_T.makeTranslation(0, cb, 0)); }
  // tail: stiff and level, its tip swinging against the hips
  par = bones[0];
  for (let k = 0; k < 6; k++) {
    const ry = -sway * 0.35 + g * (0.035 + 0.012 * k) * Math.sin(TAU * ph - 0.75 - k * 0.55) + (1 - g) * 0.03 * Math.sin(t * 0.8 - k * 0.6);
    const rx = (k === 0 ? pitch * 0.8 : 0) + 0.012 * Math.sin(t * 1.3 - k * 0.7) + bob * 0.5 * (k < 3 ? 1 : 0.4);
    bones[6 + k].multiplyMatrices(par, rotAbout(_T, TH.tail[k], rx, ry)); par = bones[6 + k];
  }
  // legs
  for (let s = 0; s < 2; s++) {
    const sg = s === 0 ? 1 : -1, B = 12 + s * 4, pl = ((ph + s * 0.5) % 1 + 1) % 1, gnd = (s === 0 ? st.groundL : st.groundR) || 0;
    let fz, fy, toe, af;
    if (pl < duty) { const q = pl / duty; fz = 0.05 + half * (1 - 2 * q); fy = 0; toe = 0; af = lerp(1.2, 0.42, q); }
    else {
      const q = (pl - duty) / (1 - duty), e = 0.5 - 0.5 * Math.cos(Math.PI * q);
      fz = 0.05 + half * (2 * e - 1); fy = lift * Math.pow(Math.sin(Math.PI * q), 0.8) + 0.04 * r * Math.sin(Math.PI * Math.min(1, q * 2.2));
      toe = 1.15 * Math.sin(Math.PI * Math.min(1, q * 1.6)) * (0.5 + 0.5 * r) - 0.25 * smoothstep(0.7, 1, q);
      af = lerp(0.42, 1.2, e) + 0.22 * Math.sin(Math.PI * q) * r;
    }
    // blend to the standing pose
    fz = lerp(sg * 0.05 + TH.foot[2], fz, g); fy *= g; toe *= g; af = lerp(A_FEMUR, lerp(A_FEMUR, af, 0.35 + 0.65 * r), g);
    const hy = hipY, hz = TH.hip[2], ky = hy - L_FEMUR * Math.cos(af), kz = hz + L_FEMUR * Math.sin(af);
    const ty = TH.foot[1] + fy + gnd, dy = ty - ky, dz = fz - kz;
    const c = clamp(Math.hypot(dy, dz), 0.16, L_TIBIA + L_META - 0.004), beta = angDown(dy, dz);
    const at = beta - Math.acos(clamp((L_TIBIA * L_TIBIA + c * c - L_META * L_META) / (2 * L_TIBIA * c), -1, 1));
    const ay = ky - L_TIBIA * Math.cos(at), az = kz + L_TIBIA * Math.sin(at);
    // foot joint: where the chain really ends (the target, unless out of reach)
    const ml = Math.hypot(ty - ay, fz - az) || 1, am = angDown((ty - ay) / ml, (fz - az) / ml);
    const py = ay - L_META * Math.cos(am), pz = az + L_META * Math.sin(am), x = TH.hip[0] * sg + shift * 0.5;
    const seg = (bone, jy, jz, ang, a0, j) => bone.copy(_A).multiply(_T.makeTranslation(x - j[0] * sg, jy, jz)).multiply(_R.makeRotationX(a0 - ang)).multiply(_T.makeTranslation(0, -j[1], -j[2]));
    seg(bones[B], hy, hz, af, A_FEMUR, TH.hip); seg(bones[B + 1], ky, kz, at, A_TIBIA, TH.knee);
    seg(bones[B + 2], ay, az, am, A_META, TH.ankle); seg(bones[B + 3], py, pz, -toe, 0, TH.foot);
  }
}
// One animal: { mesh, bones, uniforms, pose(st) }. Geometry is shared: pass the result of buildTheropodGeometry().
export function makeTheropod(geometry, pal, L, o = {}) {
  const { mat, bones } = makeTheropodMaterial(pal, L, o);
  const mesh = new THREE.Mesh(geometry, mat); mesh.frustumCulled = false; mesh.name = o.name || 'theropod';
  const st = { x: 0, y: 0, z: 0, yaw: 0, speed: 0, phase: 0, time: 0, look: 0 };
  return { mesh, bones, uniforms: mat.uniforms, state: st,
    pose(next) {
      Object.assign(st, next); poseTheropod(bones, st);
      const t = st.time;
      mat.uniforms.uBreath.value = Math.sin(t * TAU / lerp(1.5, 0.5, smoothstep(1, 8, st.speed)));
      mat.uniforms.uBlink.value = (t % 4) < 0.13 ? 1 : 0;
      mat.uniforms.uRuffle.value = 0.35 + 0.65 * smoothstep(0, 8, st.speed) + 0.25 * Math.sin(t * 0.6);
    } };
}
export { buildTheropodGeometry };

// ---------------------------------------------------------------------------------------------
// The flight line of the world (kept here so the artist's viewer, the world and the probes share it): in over the bay's
// lava, up the flank at the runner's side, along the crest 2.4 m to windward of the knife edge, over the lip and out
// east over the flood, a wide left turn, back west to the home shore and low over the last print, north past the
// tongue low over the lake, then low up the corridor and one straight rise over the last 56 m to the ring.
// ---------------------------------------------------------------------------------------------
import { makePath } from '../kit/core.js';
export async function makeRoute(hero, tick) {
  const A = hero.anchors, dunes = hero.dunes, hAt = hero.heightAt, sc = hero.script, q = {};
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const clear = (x, z, c) => Math.max(hAt(x, z), hero.levelAt(x, z)) + c;
  // beside the runner's line: `side` metres to the RIGHT of its heading (negative: to its left, which on the crest is windward), `up` over the sand
  const by = (s, side, up) => { sc.at(s, q); const x = q.x - Math.cos(q.yaw) * side, z = q.z + Math.sin(q.yaw) * side; return V(x, clear(x, z, up), z); };
  const shoreE = (z) => dunes.shore(dunes.crestX(z) + 150, z, dunes.crestX(z) + 15, z, 0)[0];
  const seat = A.portalSeat.position, hd = dunes.HD;
  const lineTo = (d, y) => { const x = seat.x - hd[0] * d, z = seat.z - hd[1] * d; return V(x, y ?? Math.max(seat.y - 0.2126 * d, clear(x, z, 6.5)), z); };
  // 1. in low over the skin of the west lake's bay, level, along its north shore: the fire line runs away ahead-left
  //    to the runner standing on the sand above it; then across its tracks and up the flank on its left
  const sJ = sc.sJoin, sStop = sc.total, yE = LAKE_WEST + 4.6;
  // (polish 2: the entry lies 12 m out over the bay's skin, so the lava is the lower half of the first picture and its fire line runs up the middle of it to the animal)
  // (polish 4: the entry is 10 m further on and nearer the shore, so the animal by the fire is a tenth of the first picture, not a speck)
  const pts = [by(-27, 12, 0).setY(yE), by(-9, 9, 0).setY(yE), by(9, 5.5, 3.5), by(30, -1.4, 3.3), by(50, -4.6, 2.9), by(72, -4.4, 2.3), by(sJ - 30, -2.3, 1.6), by(sJ - 6, -2.8, 2.3), by(sJ + 15, -2.5, 2.6)];   // (polish 2: the last of the climb is flown at the animal's own head height, close at its side)
  // (k1f) c3: the height the route's third point, as built just above, keeps over the route's own ground under it (the two functions clear() uses).
  // Over the bay's dry wall, where some seeds lay the first two points, each of them takes the HIGHER of its bay-level height (yE) and that ground
  // plus c3; over the skin and over low sand that is yE as before, to the bit.
  const c3 = pts[2].y - clear(pts[2].x, pts[2].z, 0);
  for (const p of [pts[0], pts[1]]) p.setY(Math.max(p.y, clear(p.x, p.z, c3)));
  // 2. north along the knife crest, 2.4 m to windward of it and of the runner, the east lake beyond the animal
  const nC = Math.max(2, Math.round((sStop - sJ - 14) / 13));          // (polish 2: the crest winds now, so the line is laid every 13 m)
  for (let i = 1; i <= nC; i++) pts.push(by(sJ + 15 + (sStop - sJ - 15) * i / nC, i === nC ? -3.0 : -2.4, 2.3));
  // 3. (polish 2) over the lip and OUT over the flood: a long glide east toward the dawn band, down from 40 m to 13 m over
  //    the skin, with the whole drowned desert ahead; then a wide left turn (radius 35 m) through north, the islet, the spur
  //    and the ring sweeping past, and back WEST toward the home ridge: its slip face stands before us as a wall lit
  //    from below, the saddle tongue hanging down it, the fire line along its foot
  const lip = by(sStop + 14, -1.2, 3.2), sx = shoreE(lip.z), lp = A.lastPrint;
  const g1 = V(lip.x + 38, 0, lip.z - 9); g1.y = clear(g1.x, g1.z, 9.5);
  // (polish 4) the glide stays higher and each leg has its own subject: the long islet close under us (u 0.43), a high turn with the
  // spur's shore, the ring and the far islets below (u 0.52), then down toward the tongue on the lit wall (u 0.61)
  const g2 = V(sx + 6, 23, lip.z - 15), g3 = V(sx + 68, 15, lip.z - 27), g4 = V(sx + 107, 17.5, lip.z - 58), g5 = V(sx + 98, 21.5, lip.z - 90);
  // 4. in to the home shore where the old trackway walks into the lava (the prints come down the face toward us), a
  //    right turn low over the last print, then north past the foot of the tongue and out over the lake
  const w1 = V(lp.x + 64, 13.5, lp.z + 33), w2 = V(lp.x + 38, 9, lp.z + 30), w3 = V(lp.x + 12.5, 5.8, lp.z + 20), over = V(lp.x + 3.4, 4.8, lp.z + 1.5);
  // 5. over the spur's shore and LOW up the scoured corridor (3 m over its floor, beside the one that walks there), rising
  //    to the ring's height for the last 60 m, which are dead straight
  const low = (d, c) => { const x = seat.x - hd[0] * d, z = seat.z - hd[1] * d; return V(x, Math.min(seat.y - 0.2126 * d, clear(x, z, c)), z); };
  pts.push(lip, g1, g2, g3, g4, g5, w1, w2, w3, over, V(lp.x + 25, 8.2, lp.z - 22), lineTo(240, 7.5), lineTo(190, 5.2), low(150, 4.2), low(122, 2.3), low(96, 2.4), low(74, 2.6), low(56, 3.0), lineTo(0, seat.y));   // (polish 2: low beside the walkers to the last 56 m, then one straight rise to the ring)
  // (k1f) the leg north from the point beyond the last print (typed 8.2 m) to lineTo(240, 7.5): on some seeds a foot of the home slip face stands
  // under the straight line between the two, higher than they are. Each of the two takes the HIGHER of its own height and the highest ground
  // under that line (the route's own clear(), every 0.5 m from the first point, and at the second) plus c3, the entry's clearance. No x or z moves.
  const iN = pts.indexOf(over) + 1, nA = pts[iN], nB = pts[iN + 1], dN = Math.hypot(nB.x - nA.x, nB.z - nA.z);
  let topN = -Infinity;
  for (let d = 0; ; d += 0.5) { const k = Math.min(1, d / dN); topN = Math.max(topN, clear(nA.x + (nB.x - nA.x) * k, nA.z + (nB.z - nA.z) * k, c3)); if (k >= 1) break; }
  nA.setY(Math.max(nA.y, topN)); nB.setY(Math.max(nB.y, topN));
  // (k1g) ONE LAST RULE FOR THE WHOLE ROUTE: wherever the lens between two points is nearer the ground than BAR, that leg's two end points are
  // lifted by the shortfall and the route is made again, at most three passes. BAR is twice the camera's near distance, 0.3 m: the engine's default
  // (`c.near ?? 0.3` in src/core/engine.js), which this world's camera line also names (near: 0.3). The lens between two points is the kit's own path
  // through the points (makePath: the maker the world calls on this list), measured every 0.25 m of route from its first metre to its last. The measure
  // (gap) is the SMALLER of two: the lens's height over the route's own ground straight below (the two functions clear() uses), and its
  // straight-line distance to the nearest ground in any direction within REACH (1.5 m; found by stepping from the place straight below to whichever
  // neighbouring place of the ground is nearer the lens, the step halving from half the height to a millimetre). A leg is the stretch of the path
  // between two neighbouring points of the list, whatever laid them; a point that ends two failing legs rises by the larger shortfall. Heights
  // only: no x or z moves. Where no leg is under BAR nothing is written, and every point is the same double as before.
  const BAR = 2 * 0.3, REACH = 1.5, eye = V(0, 0, 0);
  const gap = (p) => {
    const c = p.y - clear(p.x, p.z, 0);
    if (c <= 0 || c >= REACH) return c;
    let bx = p.x, bz = p.z, b2 = c * c;
    for (let st = c / 2; st > 0.001; st /= 2) for (let go = true; go;) {
      go = false; const cx = bx, cz = bz;
      for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { const x = cx + i * st, z = cz + j * st, dy = p.y - clear(x, z, 0), d2 = (x - p.x) * (x - p.x) + (z - p.z) * (z - p.z) + dy * dy; if (d2 < b2) { b2 = d2; bx = x; bz = z; go = true; } }
    }
    return Math.sqrt(b2);
  };
  for (let pass = 0; pass < 3; pass++) {
    if (tick) await tick();
    const line = makePath(pts), nL = pts.length - 1, lack = pts.map(() => 0);
    for (let d = 0; ; d += 0.25) {
      if (tick && d % 200 === 0) await tick();
      const s = Math.min(d, line.length), leg = Math.min(nL - 1, Math.floor(line.curve.getUtoTmapping(s / line.length) * nL));
      lack[leg] = Math.max(lack[leg], BAR - gap(line.posAtDist(s, eye)));
      if (d >= line.length) break;
    }
    if (!lack.some((v) => v > 0)) break;
    pts.forEach((p, i) => { const up = Math.max(lack[i], i ? lack[i - 1] : 0); if (up > 0) p.setY(p.y + up); });
  }
  if (tick) await tick();
  pts.marks = { lip, shore: w2, print: over, whale: A.whaleback, turn: g4, slide: V(sx, 0, lip.z) };
  return pts;
}

// The runner against the world's u. Its script seconds are solved on this seed's path so that it is AHEAD of the camera by
// a chosen distance along its line: it stands as we come in (17 m, then 12 m off), turns and runs, 8 m ahead up the flank,
// 6 m as we top the crest, 4.2 m along the crest, and it slows and stops short of the lip, where we pass it.
// heroProgress(u) is the lava's own progress (the toe over the last print as we reach it, then the whaleback).
export function makeTiming(hero, path) {
  const sc = hero.script, tab = (x, X, Y) => { if (x <= X[0]) return Y[0]; for (let i = 1; i < X.length; i++) if (x <= X[i]) return lerp(Y[i - 1], Y[i], (x - X[i - 1]) / (X[i] - X[i - 1])); return Y[Y.length - 1]; };
  const sJ = sc.sJoin, GS = [-40, -8, -2, 20, 50, sJ - 30, sJ, sJ + 25, sc.total - 26, sc.total - 9, sc.total + 30], GD = [40, 8, 8, 6.5, 3.6, 2.0, 4.4, 4.8, 5.0, 9, 9];
  const p = new THREE.Vector3(), q = {}, U = [], T = [];
  let sPrev = -23;
  for (let i = 0; i <= 220; i++) {
    const u = i / 220 * 0.5; path.pointAt(u, p);
    let best = sPrev, bd = 1e9;                                      // the camera's place along the runner's line
    for (let s = sPrev - 1; s < sPrev + 14; s += 0.25) { sc.at(s, q); const d = (q.x - p.x) * (q.x - p.x) + (q.z - p.z) * (q.z - p.z); if (d < bd) { bd = d; best = s; } }
    sPrev = Math.min(best, sc.sEnd);
    const sR = sPrev + tab(sPrev, GS, GD);
    const t = sR <= 0.02 ? RUN_T0 * smoothstep(-18, -8, sPrev) : sc.timeAtS(sR);
    U.push(u); T.push(Math.max(t, i ? T[i - 1] : 0));
  }
  const pk = (v) => path.nearestXZ(v.x, v.z).u, uP = pk(hero.anchors.lastPrint), uW = pk(hero.anchors.whaleback);
  const EU = [0, uP - 0.1, uP, uP + 0.03, uW + 0.06, 1], EP = [0, 0.5, 0.62, 0.705, 0.77, 1];   // (polish 2: the whaleback has swollen and split by the time we are past the tongue)
  return { runTime: (u) => tab(clamp(u, 0, 1), U, T), heroProgress: (u) => tab(clamp(u, 0, 1), EU, EP), U, T };
}

// ---------------------------------------------------------------------------------------------
// The runner's script: where it is on the crest as a pure function of progress u (brief timings).
// ---------------------------------------------------------------------------------------------
const TL_U = [0, 0.08, 0.21, 0.39, 0.555, 0.62, 0.815, 1], TL_T = [0, 3.5, 9.5, 22, 27, 31, 38.5, 45];
export function secondsAtU(u) {
  u = clamp(u, 0, 1);
  for (let i = 1; i < TL_U.length; i++) if (u <= TL_U[i]) return lerp(TL_T[i - 1], TL_T[i], (u - TL_U[i - 1]) / (TL_U[i] - TL_U[i - 1]));
  return 45;
}
const RUN_T0 = 1.0;                                 // (script seconds, not the clock: the world maps its u onto them, see makeTiming)
function makeRunnerScript(dunes) {
  // the run line by arc length: from the north shore of the west lake's bay (where it stands, lit by the fire) east up the
  // windward flank to the knife crest, then north along the crest a hand's width to windward of the edge
  const ZJ = 8, XB = dunes.crestX(27) - 137, ZB = clamp(dunes.shore(XB, 46, XB, 8, LAKE_WEST)[1] - 3.8, 15, 34);   // 3.8 m up the sand from the fire line
  const offB = XB - (dunes.crestX(ZB) - 0.3);
  const lineX = (z) => { const cx = dunes.crestX(z) - 0.3; if (z <= ZJ) return cx; const k = (ZB - z) / (ZB - ZJ), e = 1 - k; return cx + offB * e * Math.sqrt(e) * (1 + 0.5 * k); };
  const ZL = []; for (let i = 0; i <= 420; i++) ZL.push(ZB - (ZB - ZJ) * i / 420);
  for (let z = ZJ - 0.4; z > -236; z -= 0.4) ZL.push(z);
  const M = ZL.length - 1, CX = new Float32Array(M + 1), CZ = new Float32Array(M + 1), CL = new Float32Array(M + 1);
  for (let i = 0; i <= M; i++) { CZ[i] = ZL[i]; CX[i] = lineX(CZ[i]); if (i) CL[i] = CL[i - 1] + Math.hypot(CX[i] - CX[i - 1], CZ[i] - CZ[i - 1]); }
  let iJ = 0; while (iJ < M && CZ[iJ] > ZJ) iJ++;
  let iS = iJ; while (iS < M && CZ[iS] > -60) iS++;                 // it stops here, short of the lip of our descent
  // 9 m/s from the third step to the last 11 m; the length of the run is the length of the line. Distance and stride
  // phase against script time, integrated once (stride length is tied to speed, so no foot ever slides)
  const T_DEC = 2.6 + (CL[iS] - 15.05) / 9, RUN_T1 = T_DEC + 2.7;
  const runSpeed = (t) => Math.max(0, 1.6 * smoothstep(1.0, 1.2, t) + 7.4 * smoothstep(1.6, 2.6, t) - 9 * smoothstep(T_DEC, T_DEC + 2.5, t));
  const N = Math.ceil((RUN_T1 - RUN_T0) * 60), S = new Float32Array(N + 1), PH = new Float32Array(N + 1);
  for (let i = 1; i <= N; i++) { const v = runSpeed(RUN_T0 + (i - 0.5) / 60); S[i] = S[i - 1] + v / 60; PH[i] = PH[i - 1] + v / 60 / theropodCycle(v); }
  const at = (s, out) => {
    const f = clamp(s, 0, CL[M] - 0.01); let i = Math.min(M - 1, Math.floor(f / CL[M] * M));
    while (i < M - 1 && CL[i + 1] < f) i++; while (i > 0 && CL[i] > f) i--;
    const k = (f - CL[i]) / Math.max(1e-5, CL[i + 1] - CL[i]);
    out.x = lerp(CX[i], CX[i + 1], k); out.z = lerp(CZ[i], CZ[i + 1], k); out.yaw = Math.atan2(CX[i + 1] - CX[i], CZ[i + 1] - CZ[i]);
    if (s < 0) { out.x += Math.sin(out.yaw) * s; out.z += Math.cos(out.yaw) * s; }     // (behind the start: the line carried straight back, for the camera's run-in)
    return out;
  };
  const tmp = { x: 0, z: 0, yaw: 0 };
  // every footfall of the run: { n, t, s, v } (n even = left foot)
  const footfalls = [];
  for (let i = 1, n = 1; i <= N; i++) while (PH[i] >= n * 0.5) { const k = (n * 0.5 - PH[i - 1]) / Math.max(1e-6, PH[i] - PH[i - 1]); footfalls.push({ n, t: RUN_T0 + (i - 1 + k) / 60, s: lerp(S[i - 1], S[i], k), v: runSpeed(RUN_T0 + (i - 1 + k) / 60) }); n++; }
  const yaw0 = at(0.5, tmp).yaw - Math.PI * 0.3;    // standing: turned to look back over the fire of the bay
  return {
    total: S[N], at, footfalls, sJoin: CL[iJ], sEnd: CL[M], RUN_T1,
    timeAtS(s) { if (s <= 0) return RUN_T0; if (s >= S[N]) return RUN_T1; let a = 0, b = N; while (b - a > 1) { const m = (a + b) >> 1; if (S[m] < s) a = m; else b = m; } return RUN_T0 + (a + (s - S[a]) / Math.max(1e-6, S[b] - S[a])) / 60; },
    // -> { x, y, z, yaw, speed, phase, s }
    stateAt(t, out = {}) {
      const f = clamp((t - RUN_T0) * 60, 0, N), i = Math.min(N - 1, Math.floor(f)), k = f - i;
      const s = lerp(S[i], S[i + 1], k); at(s, tmp);
      out.s = s; out.phase = lerp(PH[i], PH[i + 1], k); out.speed = runSpeed(clamp(t, RUN_T0, RUN_T1));
      out.x = tmp.x; out.z = tmp.z; out.y = dunes.h(tmp.x, tmp.z);
      // it stands by the bay looking at the lava, turns away up the slope in its first two steps
      const yr = tmp.yaw < 0 ? tmp.yaw + TAU : tmp.yaw;
      out.turn = smoothstep(RUN_T1 - 1.5, RUN_T1 - 0.1, t);                     // its last steps curve round: it stops broadside, looking east over the flood
      out.yaw = lerp(yaw0 < 0 ? yaw0 + TAU : yaw0, yr, smoothstep(RUN_T0, RUN_T0 + 0.95, t)) - out.turn * Math.PI * 0.44;
      return out;
    },
  };
}
// a bird's way of looking round: holds, then a quick step to the next angle
function birdLook(t, seed, range) {
  const period = 1.35, i = Math.floor(t / period), f = t / period - i;
  const h = (n) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; };
  return lerp(h(i), h(i + 1), smoothstep(0.86, 1, f)) * range;
}

// ---------------------------------------------------------------------------------------------
// Toes: the creeping edge of the flood. Instanced lobes along the near shores, each budding,
// swelling, glowing and skinning over on its own clock (one more is driven by progress).
// ---------------------------------------------------------------------------------------------
async function shorePoints(ctx, dunes, rng, n) {
  const pts = [], nrm = new THREE.Vector3();
  const add = (x, z, lvl, size) => { dunes.normal(x, z, nrm); const l = Math.hypot(nrm.x, nrm.z) || 1; pts.push({ x, z, y: lvl, ang: Math.atan2(-nrm.x / l, -nrm.z / l) + rng.range(-0.35, 0.35), size }); };
  const nA = Math.round(n * 0.36), nB = Math.round(n * 0.3), nC = Math.round(n * 0.1), nD = n - nA - nB - nC;
  for (let i = 0; i < nA; i++) { const fz = (i + rng()) / nA, z = fz < 0.55 ? lerp(-178, -272, fz / 0.55) : lerp(-105, -338, (fz - 0.55) / 0.45), cx = dunes.crestX(z); const [x] = dunes.shore(cx + 150, z, cx + 15, z, 0); add(x, z, 0, rng.range(1.0, 1.9)); if (i % 25 === 24) await ctx.yield(); }
  for (let i = 0; i < nB; i++) {
    if (i % 25 === 24) await ctx.yield();
    const x = lerp(70, 330, (i + rng()) / nB); let z = dunes.spurZ(x) + 60; while (z < -240 && dunes.h(x, z) > 0) z += 3;
    const q = dunes.shore(x, z, x, z - 3, 0); add(q[0], q[1], 0, rng.range(1.3, 2.7));
  }
  for (let i = 0; i < nC; i++) {
    const a = (i + rng()) / nC * TAU, ex = dunes.ISLET.x + Math.cos(a) * 34, ez = dunes.ISLET.z + Math.sin(a) * 34;
    if (dunes.h(ex, ez) > 0) { add(dunes.ISLET.x + Math.cos(a) * 60, dunes.ISLET.z + 40, 0, 1); pts[pts.length - 1].size = 0; continue; }
    const q = dunes.shore(ex, ez, dunes.ISLET.x, dunes.ISLET.z, 0); add(q[0], q[1], 0, rng.range(0.8, 1.8));
  }
  for (let i = 0; i < nD; i++) { const z = lerp(125, -70, (i + rng()) / nD), cx = dunes.crestX(z); const [x] = dunes.shore(cx - 330, z, cx - 30, z, LAKE_WEST); add(x, z, LAKE_WEST, rng.range(1, 2.6)); if (i % 25 === 24) await ctx.yield(); }
  return pts;
}
async function buildToes(ctx, dunes, rng, pal, L, n, special) {
  // one lobe: a low bulb, blunt nose toward +z
  const EL = 5, AZ = 14, pos = [], idx = [];
  for (let e = 0; e <= EL; e++) for (let a = 0; a < AZ; a++) {
    const el = e / EL * Math.PI * 0.5, az = a / AZ * TAU, c = Math.cos(el), zz = c * Math.cos(az);
    pos.push(c * Math.sin(az) * 0.8 * (1 - 0.22 * zz), Math.pow(Math.sin(el), 0.62) * 0.46 - 0.05, zz * (zz > 0 ? 0.78 : 0.55));
  }
  for (let e = 0; e < EL; e++) for (let a = 0; a < AZ; a++) { const q = e * AZ + a, r = e * AZ + (a + 1) % AZ; idx.push(q, r, q + AZ, r, r + AZ, q + AZ); }
  const base = new THREE.BufferGeometry(); base.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); base.setIndex(idx); base.computeVertexNormals();
  const pts = await shorePoints(ctx, dunes, rng, n);
  const inTongue = (z) => Math.abs(z - SADDLE_Z) < 23;                 // the saddle tongue lies over this stretch of the home shore
  for (const q of pts) if (q.y === 0 && q.x < 120 && inTongue(q.z)) q.size = 0;
  if (special) { for (const q of pts) if (Math.abs(q.z - special.z - 3) < 7.5 && Math.abs(q.x - special.x) < 14) q.size = 0; }
  // the standing rank: old full-size lobes shoulder to shoulder along the near shores, so the edge of the flood is one
  // continuous row of overlapping pillows; the budding ones above push out of it onto the sand
  const nrm = new THREE.Vector3();
  const addOld = (x, z, lvl, size) => {
    dunes.normal(x, z, nrm); const l = Math.hypot(nrm.x, nrm.z) || 1, back = 0.4 * size;
    pts.push({ x: x + nrm.x / l * back, z: z + nrm.z / l * back, y: lvl, ang: Math.atan2(-nrm.x / l, -nrm.z / l) + rng.range(-0.3, 0.3), size, old: true });
  };
  let k = 0;
  for (let z = -100; z > -345; z -= rng.range(1.15, 1.6)) {
    if (inTongue(z) || (special && Math.abs(z - special.z) < 1.5)) continue;
    const cx = dunes.crestX(z); const [x] = dunes.shore(cx + 150, z, cx + 15, z, 0); addOld(x, z, 0, rng.range(1.5, 2.3));
    if (++k % 30 === 0) await ctx.yield();
  }
  for (let x = 70; x < 330; x += rng.range(1.8, 2.5)) {
    let z = dunes.spurZ(x) + 60; while (z < -240 && dunes.h(x, z) > 0) z += 3;
    const q = dunes.shore(x, z, x, z - 3, 0); addOld(q[0], q[1], 0, rng.range(1.8, 3.0));
    if (++k % 30 === 0) await ctx.yield();
  }
  for (let i = 0; i < 38; i++) {
    const a = (i + rng()) / 38 * TAU, ex = dunes.ISLET.x + Math.cos(a) * 34, ez = dunes.ISLET.z + Math.sin(a) * 34;
    if (dunes.h(ex, ez) > 0) continue;
    const q = dunes.shore(ex, ez, dunes.ISLET.x, dunes.ISLET.z, 0); addOld(q[0], q[1], 0, rng.range(1.2, 2.0));
  }
  for (const I of dunes.ISLETS) {                                      // (polish 3) a rank of old pillows round each new islet
    const nI = Math.round(I.L * 2.6);
    for (let i = 0; i < nI; i++) {
      const a = (i + rng()) / nI * TAU, ca = Math.cos(a) * (I.L * 1.15 + 14), sa = Math.sin(a) * 44;
      const ex = I.x + I.ax[0] * ca + I.lee[0] * sa, ez = I.z + I.ax[1] * ca + I.lee[1] * sa, sz = rng.range(1.3, 2.4);
      const tx = I.x + I.ax[0] * ca * 0.55, tz = I.z + I.ax[1] * ca * 0.55;      // toward the crest line
      if (dunes.h(ex, ez) > 0 || dunes.h(tx, tz) <= 0) continue;
      const q = dunes.shore(ex, ez, tx, tz, 0); addOld(q[0], q[1], 0, sz);
    }
    await ctx.yield();
  }
  { const sx = dunes.crestX(27) - 152, sz = 30; for (const q of pts) if (q.y === LAKE_WEST && Math.hypot(q.x - sx, q.z - sz) < 15) q.size = 0; }   // (the flight comes in low over this stretch of the bay's shore)
  if (special) pts.push({ ...special, special: true });
  await ctx.yield();
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.attributes.position = base.attributes.position; g.attributes.normal = base.attributes.normal;
  const A = new Float32Array(pts.length * 4), B = new Float32Array(pts.length * 3);
  pts.forEach((q, i) => { A.set([q.x, q.y, q.z, q.ang], i * 4); B.set([q.size, rng(), q.special ? -1 : q.old ? 0 : rng.range(9, 16)], i * 3); });
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 3));
  g.instanceCount = pts.length; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(100, 10, -150), 500);
  const mat = new THREE.ShaderMaterial({
    fog: true,
    uniforms: U(L, { uSkin: { value: new THREE.Color(pal[4]) }, uHor: { value: new THREE.Color('#66708C').multiplyScalar(0.62) }, uToeU: { value: 0 } }),
    vertexShader: /* glsl */`
      attribute vec4 aA; attribute vec3 aB;
      uniform float uTime, uToeU;
      varying vec3 vW, vN, vL; varying float vHeat, vSeed;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        float old = 1. - step(0.001, abs(aB.z));                       // 1 = a lobe of the standing rank
        float ph = aB.z < 0. ? 0.12 + uToeU * 0.4 : fract(uTime / max(aB.z, 1.) + aB.y);
        ph = mix(ph, 0.8, old);
        float grow = smoothstep(0., 0.5, ph), die = mix(1. - smoothstep(0.88, 1., ph), 1., old);
        vec3 p = position; vL = p;
        p.z += (grow - 1.0) * 0.5;
        float tall = mix(1.1, 1.2 + 0.5 * aB.y, old) * (1. + 0.05 * old * sin(uTime * 0.5 + aB.y * 40.));   // old lobes stand high and breathe
        p *= aB.x * (0.3 + 0.7 * grow) * vec3(1., die * (0.75 + 0.25 * grow) * tall, 1.);
        float c = cos(aA.w), s = sin(aA.w);
        vec3 w = vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z) + aA.xyz;
        w.y -= (1. - die) * 0.3;
        vN = vec3(c * normal.x + s * normal.z, normal.y * 1.2, -s * normal.x + c * normal.z);
        vHeat = aB.z < 0. ? mix(1., 0.66, uToeU) : mix((1. - smoothstep(0.1, 0.85, ph)) * die, 0.04 + 0.1 * aB.y, old);
        vSeed = aB.y;
        vec4 wp = modelMatrix * vec4(w, 1.); vW = wp.xyz;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSkin, uHor, uLava, uSkyUp, uSkyLow; uniform float uLavaGain, uTime;
      varying vec3 vW, vN, vL; varying float vHeat, vSeed;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        vec3 n = normalize(vN); vec3 V = normalize(cameraPosition - vW);
        float heat = clamp(vHeat, 0., 1.), sd = clamp(vSeed, 0., 1.) * 37.;
        vec2 q = vL.xz;
        // the crust: rope wrinkles bowed toward the nose, and two or three cracks
        float wob = vnoise(q * 4.2 + sd);
        // (polish k1) no two pillows wear the same rings: each has its own rope spacing and its own centre, its ropes lie in patches
        // with smooth skin between, and its crown has broad dents (every one wore the same 44 rings: a repeated texture on a plain blob)
        float sdn = clamp(vSeed, 0., 1.), sd2 = fract(sdn * 7.31);
        float ph = length(vec2(q.x * 0.85 + (sd2 - 0.5) * 0.5, q.y + 0.62 + (sdn - 0.5) * 0.4)) * mix(27., 50., sd2) + wob * mix(5., 10., sdn) + sd;
        float aR = (1. - smoothstep(0.5, 1.6, fwidth(ph))) * smoothstep(0.34, 0.6, vnoise(q * 1.9 + sd * 1.7 + 3.));
        float sR = sin(ph);
        float up = clamp(n.y, 0., 1.);
        float top = smoothstep(0.3, 0.85, n.y);
        float shade = (1. + 0.32 * aR * sR * (0.4 + 0.6 * top)) * (0.86 + 0.3 * vnoise(q * 1.5 + sd * 2.3 + 11.));
        float ck = abs(vnoise(q * 2.7 + sd + 9.) - 0.5);
        float cw = 0.005 + 0.75 * fwidth(ck);
        float crack = (1. - smoothstep(0., cw, ck)) * smoothstep(0.03, 0.15, vL.y);
        float ndv = clamp(dot(n, V), 0., 1.), fr = (1. - ndv); fr = fr * fr * fr;
        // black-brown skin with the lake's dull pewter on what faces the sky; no mirror
        vec3 col = (uSkin * mix(uSkyLow, uSkyUp, n.y * 0.5 + 0.5) * 1.6 + vec3(0.062, 0.062, 0.074) * (0.16 + 1.1 * up * up) * uSkyUp.b + uHor * (0.07 + 0.2 * fr) * up) * shade;
        // what glows: the nose and the underside of a young lobe, dull red round the flank of an old one; the crown
        // skins over first and only its furrows and cracks stay lit
        float nose = smoothstep(-0.15, 0.6, vL.z);
        float low = 1. - smoothstep(0.03, 0.2, vL.y);
        float h2 = heat * heat;
        float flank = 1. - smoothstep(0.2, 0.72, n.y);                 // the sides of a pillow stay dull red long after its crown is black
        float crust = top * (1. - 0.3 * h2);
        float body = 0.03 + 0.3 * flank + 0.2 * low + 3.0 * h2 * (0.25 + 0.75 * nose) * (0.3 + 0.7 * (1. - up));
        float glow = body * (1. - 0.94 * crust) * (0.8 + 0.25 * wob);
        glow += (0.5 - 0.5 * sR) * aR * top * heat * 0.3;                    // fire in the furrows between the ropes
        glow += crack * (0.12 + 0.5 * step(0.6, fract(sd * 3.3)) + 2.6 * heat) * (0.55 + 0.45 * sin(uTime * 0.4 + sd));
        float seam = (1. - smoothstep(0.0, 0.07, vL.y + 0.03)) * (0.45 + 0.55 * heat) * 2.4;
        float fire = glow + seam;
        vec3 hotCol = mix(vec3(0.8, 0.07, 0.0), uLava, clamp(heat * 1.2 + 0.3 * crack + 0.2 * (1. - top), 0., 1.));
        col += (mix(hotCol, uLava, clamp(seam, 0., 1.)) * fire + vec3(1., 0.8, 0.35) * max(fire - 2.2, 0.) * 0.6) * uLavaGain;
        gl_FragColor = vec4(clamp(col, 0., 40.), 1.);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'toes'; mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------------------------------------
// The saddle tongue: the west lake spilling over the low saddle and hanging down the slip face
// like slow glowing cloth, 30 m wide, fanning onto the east lake.
// ---------------------------------------------------------------------------------------------
const SADDLE_Z = -250;
// (polish 4) The pour is built as relief, not as a painted ribbon: a heaped, lumpy lip that fills the whole gap of the
// saddle (so its top is a skyline of swollen crust, not the lake's ruled edge), a neck that narrows over the brink and
// swells down the face in lobes, a scalloped margin of small toes, and festoons of folds that are real displacement
// (3.6 m crowns with a narrow crease between, sheaves of ropes 0.9 m apart riding them), sliding slowly downhill.
// The same fold function is evaluated in the vertex shader (displacement) and in the fragment shader (normal), so the
// folds hold at close range and have a lit crown, a dark flank and fire only in the crease.
const GLSL_TFOLD = /* glsl */`
// (polish 5) SLOW GLOWING CLOTH: smooth drapery, festooned, each lane of the pour folding on its own beat, the folds of
// several lengths and heights, over the broad swellings of the pour itself. No cubed crowns (they stood on the 32 degree face
// as ruled terraces). -> (relief in metres, c: 0 in the crease .. 1 on the crown, rope sheaf 0..1)
vec3 tFold(float a, float s, float fine, float kf, float hw){
  float w = vnoise(vec2(a * 1.6, s * 0.09)) * 2.4 + vnoise(vec2(a * 4., s * 0.23)) * 0.8;
  float lane = vnoise(vec2(a * 2.1 + 5., 1.7)) * 6. + vnoise(vec2(a * 5.3 + 1., s * 0.04)) * 2.5;
  float ph = s * 1.5 * kf + w * 2.0 + lane;
  float c = 0.5 + 0.5 * sin(ph + 0.5 * sin(ph + 0.8));                 // a rounded crown a little broader than the crease
  float amp = 0.3 + 0.7 * vnoise(vec2(a * 1.3 + 3., s * 0.07));       // some folds stand tall, some lie flat
  float grp = smoothstep(0.3, 0.62, vnoise(vec2(a * 1.5 + 9., s * 0.21)));
  float mid = 0.5 + 0.5 * sin(s * 4.4 * kf + w * 4. + lane * 1.7 + 2.4 * a * a);
  float rope = (0.5 + 0.5 * sin(s * 13. + w * 9. + lane * 3. + 5. * a * a)) * grp;
  float bil = vnoise(vec2(a * 1.25 + 2., s * 0.055)) + 0.5 * vnoise(vec2(a * 2.7 + 8., s * 0.13));
  return vec3((0.4 * c * amp + 0.06 * mid * (0.4 + 0.6 * grp)) / sqrt(kf) + 0.4 * bil + 0.008 * rope * fine * c, c, rope);
}
// a: across -1..1, d: metres down the flow, hw: half width here, dn: 0 lake .. 1 foot
// (polish 5) Transverse folds on a 32 degree face read as terraces, so the steep part of the pour is shaped ALONG the flow, as
// a real overflow is: a stream down its middle, sunk between two raised levees of older crust, fluted lengthwise; the folds
// (festoons across the flow) come only where the pour slows and spreads at the foot. -> (relief m, c, rope)
float tStream(float a, float d){ float ac = a - (vnoise(vec2(d * 0.045, 3.1)) - 0.5) * 0.8 * clamp(1. - a * a, 0., 1.); return ac; }
vec3 tRelief(float a, float d, float t, float rel, float fine, float hw, float dn){
  float edge = clamp(1. - a * a, 0., 1.);
  float foot = smoothstep(0.76, 0.93, dn);                             // (the face ends and the fan on the lake begins at about 0.86)
  float kf = mix(0.6, 1.3, foot);
  vec3 f = tFold(a, d - t * 0.55 - min(0.7 * hw, 9.) * edge, fine, kf, hw);
  float ac = tStream(a, d), ch = exp(-ac * ac / 0.15), lv = abs(ac) - 0.66;
  float flute = vnoise(vec2(a * 7., (d - t * 0.55) * 0.045)) - 0.5;
  float along = (-0.85 * ch + 0.75 * exp(-lv * lv / 0.035) + 0.4 * flute) * (1. - foot) * smoothstep(-8., 5., d - uLip);
  return vec3((f.x * mix(0.1, 1., foot) + along) * edge * rel, f.y, f.z);
}`;
async function buildTongue(ctx, dunes, pal, L) {
  const NA = 44, NV = 280, pos = [], uv = [], idx = [], hwA = [];   // (polish 5: twice the rows: a fold is seven rows long, not three)
  const cx = dunes.crestX(SADDLE_Z), xw = cx - 24, xe = dunes.shore(cx + 150, SADDLE_Z, cx + 5, SADDLE_Z, -0.2)[0] + 9, F = xe - cx;
  let dist = 0, px = xw, py = LAKE_WEST, dLip = 0;
  for (let j = 0; j <= NV; j++) {
    if (j % 20 === 19) await ctx.yield();
    const v = j / NV, x = lerp(xw, xe, v * v * 0.3 + v * 0.7), e = x - cx, t = clamp(e / F, 0, 1);
    // half-width: the heap at the lip spans the gap, the neck narrows over the brink, the pour swells and fans at the foot
    // (polish 5: the heap is as wide as the flooded gap of the saddle and no wider; at 29 m it lay over the dune's shoulders as a sheet)
    const hw0 = 9.0 + 2.6 * (1 - smoothstep(-3, 19, e)) * smoothstep(-26, -12, e) + 5.5 * smoothstep(0.1, 0.45, t) - 2.0 * Math.sin(Math.PI * clamp(t * 1.5, 0, 1)) + 11 * smoothstep(0.62, 1, t)
      + 2 * (1 - smoothstep(-24, -10, e));
    const scal = (ph) => 0.1 * Math.abs(Math.sin(dist * 0.55 + ph)) + 0.03 * Math.abs(Math.sin(dist * 1.3 + ph * 2.));   // small toes along the margin
    const lob = smoothstep(2, 9, e);                                                                                    // (the heap itself keeps a plain outline: it lies on the saddle)
    const hwL = hw0 * (1 + lob * (0.27 * Math.sin(v * 11.3 + 1.3) + 0.11 * Math.sin(v * 27 + 0.4) + scal(0.7)));
    const hwR = hw0 * (1 + lob * (0.27 * Math.sin(v * 9.1 + 4.1) + 0.11 * Math.sin(v * 23 + 2.2) + scal(2.9)));
    const zc = SADDLE_Z + (2.5 * Math.sin(v * 2.4) + 3.6 * Math.sin(e * 0.21 + 0.6)) * smoothstep(0, 9, e);
    const yc = Math.max(dunes.h(x, zc), x < cx ? LAKE_WEST - 0.5 : LAKE_EAST - 0.3);
    if (j) dist += Math.hypot(x - px, yc - py); px = x; py = yc;
    if (e < 0) dLip = dist;
    const heap = 2.0 * Math.exp(-(e - 1) * (e - 1) / 34) + 1.0 * Math.exp(-(e + 9) * (e + 9) / 70);                      // inflated crust heaped at the overflow
    for (let i = 0; i <= NA; i++) {
      const a = i / NA * 2 - 1, z = zc + a * (a < 0 ? hwL : hwR);
      const ground = Math.max(dunes.h(x, z), x < cx ? LAKE_WEST - 0.5 : LAKE_EAST + 0.34);        // the foot rides clear of the lake's swell (and fades out: no cut edge)
      const dome = Math.pow(Math.max(0, 1 - a * a), 0.45);
      const lump = 0.72 + 0.2 * Math.sin(a * 6.3 + 1.1 + e * 0.35) + 0.16 * Math.sin(a * 13.7 + 4.2 - e * 0.5) + 0.1 * Math.sin(a * 23. + e * 0.8);
      const thick = (1.15 - 0.6 * smoothstep(0.75, 1, t)) * dome * smoothstep(0, 0.06, v) + heap * lump * Math.max(0, 1 - a * a);   // (the heap is a rounded welling mound: an arch on the skyline, not a flat lid)
      pos.push(x, ground + thick - 0.12, z); uv.push(a, dist);
      hwA.push(a < 0 ? hwL : hwR, smoothstep(0.02, 0.12, v) * (1 - 0.75 * smoothstep(0.8, 1, t)));   // half width here (m), and how much fold relief this row carries
    }
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NA; i++) { const q = j * (NA + 1) + i; idx.push(q, q + 1, q + NA + 1, q + 1, q + NA + 2, q + NA + 1); }
  // unit tangents along the flow and across it, for turning the fold slopes into a normal
  const al = new Float32Array(pos.length), ac = new Float32Array(pos.length), W = NA + 1, tv = new THREE.Vector3();
  await ctx.yield();
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NA; i++) {
    const q = (j * W + i) * 3, j0 = Math.max(0, j - 1), j1 = Math.min(NV, j + 1), i0 = Math.max(0, i - 1), i1 = Math.min(NA, i + 1);
    const A = (j1 * W + i) * 3, B = (j0 * W + i) * 3, C = (j * W + i1) * 3, D = (j * W + i0) * 3;
    tv.set(pos[A] - pos[B], pos[A + 1] - pos[B + 1], pos[A + 2] - pos[B + 2]); if (tv.lengthSq() < 1e-8) tv.set(1, 0, 0); tv.normalize(); al[q] = tv.x; al[q + 1] = tv.y; al[q + 2] = tv.z;
    tv.set(pos[C] - pos[D], pos[C + 1] - pos[D + 1], pos[C + 2] - pos[D + 2]); if (tv.lengthSq() < 1e-8) tv.set(0, 0, 1); tv.normalize(); ac[q] = tv.x; ac[q + 1] = tv.y; ac[q + 2] = tv.z;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aAl', new THREE.BufferAttribute(al, 3)); g.setAttribute('aAc', new THREE.BufferAttribute(ac, 3)); g.setAttribute('aHw', new THREE.Float32BufferAttribute(hwA, 2));
  await ctx.yield();
  g.setIndex(idx); g.computeVertexNormals();
  await ctx.yield();
  const mat = new THREE.ShaderMaterial({
    fog: true, side: THREE.DoubleSide, transparent: true,
    uniforms: U(L, { uSkin: { value: new THREE.Color(pal[4]) }, uHor: { value: new THREE.Color('#66708C').multiplyScalar(0.62) }, uLen: { value: dist }, uLip: { value: dLip } }),
    vertexShader: /* glsl */`
      attribute vec3 aAl, aAc; attribute vec2 aHw;
      uniform float uTime, uLen, uLip;
      varying vec3 vW, vN, vAl, vAc; varying vec2 vUv, vHw;
      #include <common>
      #include <fog_pars_vertex>
      ${GLSL_NOISE}
      ${GLSL_TFOLD}
      void main(){
        vUv = uv; vHw = aHw;
        vN = normalize(mat3(modelMatrix) * normal); vAl = mat3(modelMatrix) * aAl; vAc = mat3(modelMatrix) * aAc;
        vec3 p = position + normal * tRelief(uv.x, uv.y, uTime, aHw.y, 0., max(aHw.x, 1.), clamp(uv.y / max(uLen, 1.), 0., 1.)).x;
        vec4 w = modelMatrix * vec4(p, 1.); vW = w.xyz;
        vec4 mvPosition = viewMatrix * w;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSkin, uHor, uLava, uSkyUp, uSkyLow, uRakeDir, uRakeCol; uniform float uLavaGain, uTime, uLen, uLip;
      varying vec3 vW, vN, vAl, vAc; varying vec2 vUv, vHw;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      ${GLSL_TFOLD}
      void main(){
        float a = clamp(vUv.x, -1., 1.), d = max(vUv.y, 0.), rel = clamp(vHw.y, 0., 1.), hw = max(vHw.x, 1.);
        vec3 V = normalize(cameraPosition - vW);
        float dist = length(cameraPosition - vW);
        // the folds' own slopes -> normal (the same function that displaced the vertices)
        float fineK = 1. - smoothstep(25., 70., dist);
        float dn = clamp(d / max(uLen, 1.), 0., 1.);
        vec3 f0 = tRelief(a, d, uTime, rel, fineK, hw, dn);
        float h0 = f0.x, hA = tRelief(a + 0.012, d, uTime, rel, fineK, hw, dn).x, hD = tRelief(a, d + 0.06, uTime, rel, fineK, hw, dn).x;
        float lodN = 1. - 0.6 * smoothstep(60., 200., dist);
        vec3 n = normalize(normalize(vN) - normalize(vAl + vec3(1e-5, 0., 0.)) * ((hD - h0) / 0.06) * lodN - normalize(vAc + vec3(0., 0., 1e-5)) * ((hA - h0) / (0.012 * hw)) * lodN);
        float s = d - uTime * 0.55 - min(0.7 * hw, 9.) * clamp(1. - a * a, 0., 1.);
        float c = f0.y, rope = f0.z;                                     // c: 0 in the crease, 1 on the crown
        float grp = smoothstep(0.3, 0.62, vnoise(vec2(a * 1.5 + 9., s * 0.21)));
        float ndv = clamp(dot(n, V), 0., 1.), fr = 1. - ndv; fr = fr * fr * fr;
        float up = clamp(n.y, 0., 1.);
        float below = max(d - uLip, 0.);                                 // metres down the face from the brink
        // (polish 5) SLOW GLOWING CLOTH. The crust is black-brown satin: a pewter sheen on whatever looks at the sky, the dawn's
        // rake on east-leaning crowns, fine ropes close to the eye. The fire is no longer a ruled line in every crease (that
        // drew a contour map): the pour has a HEAT of its own, highest where it comes over the brink and down its fast middle,
        // in drifting patches, and where it is hot the creases gape: a wide soft glow up the flanks of the fold, deep red at
        // its edge through orange to a yellow core. Where it is cool a crease is only a dull red breath, or dark.
        vec3 sky = mix(uSkyLow, uSkyUp, n.y * 0.5 + 0.5);
        vec3 crustC = uSkin * sky * 1.7 + vec3(0.04, 0.05, 0.085) * (0.1 + 1.3 * up * up) * uSkyUp.b + uHor * 0.3 * fr;
        crustC += vec3(0.05, 0.045, 0.05) * uRakeCol * 0.9 * max(dot(n, uRakeDir), 0.);
        crustC *= mix(1., 0.45 + 0.55 * smoothstep(0.0, 0.5, c), smoothstep(0.76, 0.93, dn)) * (0.92 + 0.14 * rope * fineK);
        // the stream: open lava running down the sunk middle of the steep part, brightest where it comes over the brink,
        // dark rafts of skin drawn out along it and gathering downstream until it closes over at the foot
        float foot = smoothstep(0.76, 0.93, dn);
        float ac = tStream(a, d), chan = exp(-ac * ac / 0.15);
        float over = smoothstep(-13., 1., d - uLip);                     // welling up through the heap at the lip
        float heat = (0.36 + 0.44 * exp(-below / 26.) + 0.35 * exp(-below / 6.)) * over;
        float raftN = vnoise(vec2(ac * 6. + 2., s * 0.065)) * 0.6 + vnoise(vec2(ac * 15. + 9., s * 0.2)) * 0.4;
        float skin = smoothstep(0.4, 0.5, raftN + 0.3 * smoothstep(3., 34., below) - 0.3 * exp(-below / 12.) + 0.5 * smoothstep(0.35, 0.8, abs(ac)));
        float stri = 0.7 + 0.6 * vnoise(vec2(ac * 21., s * 0.3));       // fine streaks drawn out down the flow
        float stream = smoothstep(0.4, 0.85, chan) * (1. - smoothstep(0.8, 0.95, dn));
        float T = stream * heat * (1. - 0.96 * skin) * stri * (0.6 + 0.5 * exp(-ac * ac / 0.018));   // a hotter thread down the very middle
        // on the levees: a few long tears where the old crust is pulled thin; at the foot: fire in the creases of the folds,
        // in broken lines, dying as the pour fans into the lake's skin
        float crack = (1. - smoothstep(0.012, 0.05, abs(vnoise(vec2(a * 5. + 3., d * 0.07)) - 0.5))) * smoothstep(2., 8., below) * (1. - smoothstep(0.55, 0.8, dn)) * (0.3 + 0.7 * vnoise(vec2(d * 0.4, a * 3.)));
        float brk = smoothstep(0.3, 0.66, vnoise(vec2(a * 3.3, s * 0.27)));
        float crease = (1. - smoothstep(0., 0.22, c)) * brk * foot * (1. - smoothstep(0.9, 0.99, dn)) * over;
        T = max(T, max(crack * 0.5, crease * (0.42 + 0.3 * chan)));
        crustC *= 1. - 0.35 * (1. - foot) * smoothstep(0.2, 0.6, chan);   // the walls of the stream's bed are in their own shadow
        // the margin: where the pour touches sand it is freshly open, in beads, along the steep part
        float lobeE = smoothstep(0.93, 0.995, abs(a)) * (0.3 + 0.7 * smoothstep(0.35, 0.7, vnoise(vec2(d * 0.45, a * 2.)))) * (1. - smoothstep(0.72, 0.92, dn)) * smoothstep(1., 6., d - uLip);
        T = max(T, lobeE * 0.6);
        vec3 glow = vec3(0.42, 0.03, 0.008) * smoothstep(0., 0.22, T) + uLava * 1.25 * smoothstep(0.14, 0.5, T) + vec3(1., 0.62, 0.2) * 1.1 * smoothstep(0.5, 1.0, T);   // (never a white-out: the newest lava is HDR 3)
        vec3 col = crustC * (1. - 0.8 * smoothstep(0.1, 0.5, T)) + glow * uLavaGain;
        col += vec3(0.6, 0.09, 0.02) * 0.14 * heat * exp(-max(abs(ac) - 0.3, 0.) / 0.16) * (1. - foot) * (1. - smoothstep(0.1, 0.5, T)) * uLavaGain;   // the stream's light on the walls of its bed
        col += vec3(0.5, 0.06, 0.015) * 0.1 * foot * (1. - c) * (1. - smoothstep(0.8, 0.97, dn)) * uLavaGain;      // and the creases' light on the flanks of the folds
        float alpha = (1. - smoothstep(0.92, 0.995, dn)) * (1. - smoothstep(0.8, 1., abs(a)) * smoothstep(0.8, 0.93, dn));
        gl_FragColor = vec4(clamp(col, 0., 40.), alpha);
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'tongue';
  return { mesh, foot: new THREE.Vector3(xe - 9, 0, SADDLE_Z), lip: new THREE.Vector3(cx, dunes.h(cx, SADDLE_Z) + 0.9, SADDLE_Z) };
}

// ---------------------------------------------------------------------------------------------
// Three-toed prints (decals that darken the sand) and the puffs the runner's feet throw.
// ---------------------------------------------------------------------------------------------
// (k1c) the three-toed print and the foot's puff as named shader strings: the hero's trackways and the spur runners' fresh prints share them
const PRINT_FRAG = /* glsl */`
      varying vec2 vQ; varying float vSoft, vDist;
      float toe(vec2 p, float ang, float len){
        vec2 d = vec2(sin(ang), cos(ang)), h = vec2(0., -0.34);
        float t = clamp(dot(p - h, d), 0.1, len);
        return length(p - h - d * t) - mix(0.075, 0.03, t / len);
      }
      void main(){
        vec2 p = vQ;
        float d = min(min(toe(p, 0., 0.82), toe(p, 0.47, 0.62)), min(toe(p, -0.47, 0.6), length(p - vec2(0., -0.27)) - 0.085));
        float fade = 1. - smoothstep(70., 150., vDist);
        if (vSoft > 1.5) {                                              // a slump below a fresh print: a soft spindle of loosened grains down the fall line
          float e = length(vec2(p.x * 3.4, p.y * 2.05)); float sc = (1. - smoothstep(0.35, 1., e)) * (0.5 + 0.5 * smoothstep(-0.5, 0.2, p.x * 2. + p.y)) * (1. - smoothstep(110., 260., vDist));
          gl_FragColor = vec4(mix(vec3(1.), vec3(0.6, 0.6, 0.7), sc * 0.75), 1.); return; }
        float dent = (1. - smoothstep(-0.025, 0.02 + vSoft * 0.07, d)) * (1. - 0.45 * vSoft) * fade;
        float rim = smoothstep(0.0, 0.05, d) * (1. - smoothstep(0.05, 0.14, d)) * (1. - vSoft) * fade;
        vec3 c = mix(vec3(1.), vec3(0.46, 0.5, 0.62), dent) * (1. + 0.16 * rim);
        gl_FragColor = vec4(c, 1.);
      }`;
const PUFF_FRAG = /* glsl */`
      uniform vec3 uSand, uSkyUp, uLavaLit; varying vec2 vQ; varying float vAge;
      #include <common>
      #include <fog_pars_fragment>
      ${GLSL_NOISE}
      void main(){
        float r = length(vQ);
        float a = (1. - smoothstep(0.25, 1., r)) * (0.55 + 0.45 * vnoise(vQ * 3. + vAge * 2.)) * (1. - vAge) * (1. - vAge) * 0.5;
        vec3 col = uSand * (uSkyUp * 0.75 + uLavaLit * 0.12 * (0.5 - 0.5 * vQ.y));
        gl_FragColor = vec4(col, a);
        #include <fog_fragment>
      }`;
// rng: the hero's 'prints' fork. (k1d) It deals exactly as in the live version again, draw for draw: one draw (its toe-out) for
//   every print of the lines the live version had, at the count each line had there, in the same order.
// own: (k1c) the parts' own stream ('trackways-k1c', made from the seed and a name): every draw of everything added since.
function buildPrints(dunes, script, rng, lastPrint, twinPos, own) {
  const A = [], Nn = [], K = [], nrm = new THREE.Vector3();
  const put = (x, z, yaw, size, soft, reveal) => { dunes.normal(x, z, nrm); A.push(x, dunes.h(x, z), z, yaw); Nn.push(nrm.x, nrm.y, nrm.z, reveal); K.push(size, soft); };
  // (polish k1) every line is laid with the runner's own foot: PRINT = 0.27 quad = a three-toed print 0.2 m long (brief, fauna).
  // `scar` (fresh lines on a slip face only): below each print a short soft slump of loosened grains, so the line still reads from the lake
  const PRINT = 0.27;
  // (k1d) Which stream a print's toe-out is drawn from:
  //   a line the live version had, at the step it had there: every print draws from the old fork `rng`, as it did;
  //   such a line laid at a shorter step since (o.was = the step it had): it had nWas = floor(len / was) + 1 prints and that many
  //     draws of the old fork. They are still taken, one a print and in order, by nWas of its prints spread evenly along it; the
  //     prints the shorter step added between them draw from `own`;
  //   a line added since (o.own): every print draws from `own`. So does every scar, and nothing added draws from `rng`.
  const line = (x0, z0, x1, z1, step, soft, wob, size = PRINT, o = {}) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.floor(len / step), yaw = Math.atan2(x1 - x0, z1 - z0), rx = Math.cos(yaw), rz = -Math.sin(yaw), lat = o.lat || 0, ph = o.ph || 0;
    const nOld = o.own ? 0 : o.was ? Math.min(n + 1, Math.floor(len / o.was) + 1) : n + 1;
    for (let i = 0; i <= n; i++) { const t = (i + (o.t0 || 0)) * step / len, sg = i % 2 ? 1 : -1, w = wob * Math.sin(i * 0.31 + ph) + lat; if (o.t0 && t > 1) break;
      const x = lerp(x0, x1, t) + rx * (0.1 * sg + w), z = lerp(z0, z1, t) + rz * (0.1 * sg + w);
      const old = Math.floor((i + 1) * nOld / (n + 1)) > Math.floor(i * nOld / (n + 1));
      put(x, z, yaw + (old ? rng : own).range(-0.08, 0.08) + sg * 0.05, size, soft, -1);
      if (o.scar) { dunes.normal(x, z, nrm); const dl = Math.hypot(nrm.x, nrm.z); if (dl > 0.25) { const fx = nrm.x / dl, fz = nrm.z / dl; put(x + fx * 0.5, z + fz * 0.5, Math.atan2(fx, fz) + own.range(-0.12, 0.12), 0.95, 2.5, -1); } } }
  };
  // an OLD trackway is the path of a small party: the main line and two fainter ones beside it, each foot the same size
  // (o: as for `line`, for the main line; the two side lines were added since and draw from `own`)
  const party = (x0, z0, x1, z1, step, soft, wob, o) => { line(x0, z0, x1, z1, step, soft, wob, PRINT, o); line(x0, z0, x1, z1, step * 1.07, soft + 0.08, wob * 1.6, PRINT, { lat: 0.85, ph: 1.9, t0: 0.4, own: true }); line(x0, z0, x1, z1, step * 0.96, soft + 0.12, wob * 1.4, PRINT * 0.93, { lat: -1.05, ph: 4.2, t0: 0.7, own: true }); };
  { const q = {}; let i = 0;                                                              // an older line of the same feet, beside the run line from the bay to the crest
    // (k1c) It was ruled: every print 0.74 m on, 1.6 m from the run line, all toes pointing up the run line. An animal that walked
    // here alone wandered: the line now swings 1.1 m either way over some 40 m and 0.5 m over some 15 m (on the old slow drift of
    // 0.5 m), its steps are 0.65 to 0.83 m, left and right feet fall 0.24 m apart (the animal's own stance) and each print points
    // the way the line is going there, toed out a little. It stays 0.3 to 4.5 m to the left of the run line and never crosses
    // it. One draw of the old fork per print, as in the live version (count and order); everything new is drawn on `own`.
    // (mend 1: the swings were 0.75 and 0.35 m about a line 1.9 m off, and from the air the line still read as ruled; half as
    //  much again, about a line 2.4 m off so that it still keeps to its own side of the run line, at every place of the climb)
    const m1 = own.range(0, TAU), m2 = own.range(0, TAU);
    const mOff = (s) => 2.4 + 0.5 * Math.sin(s * 0.07) + 1.1 * Math.sin(s / 6.5 + m1) + 0.5 * Math.sin(s / 2.3 + m2);
    for (let s0 = 1.5; s0 < script.sJoin - 3; s0 += 0.74, i++) {
      const sj = s0 + own.range(-0.09, 0.09); script.at(sj, q);
      const sg = i % 2 ? 1 : -1, off = mOff(sj) + 0.118 * sg, turn = Math.atan(mOff(sj + 0.5) - mOff(sj - 0.5));
      put(q.x + Math.cos(q.yaw) * off, q.z - Math.sin(q.yaw) * off, q.yaw + turn + rng.range(-0.08, 0.08) + sg * 0.05, 0.27, 0.3, -1); } }
  const tp = {};
  for (const f of script.footfalls) {                                                   // the run: each print appears as the foot comes down
    const st = script.stateAt(f.t, tp), sg = f.n % 2 === 0 ? 1 : -1, r = smoothstep(1.5, 7, f.v), ahead = 0.05 + Math.min(theropodCycle(f.v) * lerp(0.62, 0.26, r) * 0.5, 0.45);
    put(st.x + Math.cos(st.yaw) * 0.118 * sg + Math.sin(st.yaw) * ahead, st.z - Math.sin(st.yaw) * 0.118 * sg + Math.cos(st.yaw) * ahead, st.yaw, 0.27, 0.05, f.n * 0.5 + 0.03);
    f.x = A[A.length - 4]; f.y = A[A.length - 3]; f.z = A[A.length - 2];
  }
  for (let s0 = script.total + 2.2, i = 0; s0 < script.sEnd; s0 += 0.8, i++) {                   // an older line running on along the crest
    const q = script.at(s0, tp), sg = i % 2 ? 1 : -1; if (q.z < -238) break;
    put(q.x - 0.5 + Math.cos(q.yaw) * 0.09 * sg, q.z - Math.sin(q.yaw) * 0.09 * sg, q.yaw + rng.range(-0.1, 0.1), 0.26, 0.7, -1);
  }
  const lx = lastPrint.x - 0.9, lz = lastPrint.z;                                       // the old trackway that walks into the lava
  { // it comes down along the foot of the slip face, a few metres in from the shore, and turns into the lava
    const z0 = lz + 34, cx0 = dunes.crestX(z0), x0 = dunes.shore(cx0 + 150, z0, cx0 + 15, z0, 0)[0] - 6.5;
    party(x0, z0, lx - 3.6, lz + 6.5, 0.6, 0.14, 0.05, { was: 0.78 }); party(lx - 3.1, lz + 5.8, lx + 2.6, lz - 1.6, 0.6, 0.1, 0.03, { was: 0.78 });   // (polish k1: the brief's 0.2 m print; it was 0.43 m, at a step of 0.78 m)
  }
  { // (polish 4) a FRESH line of the same feet comes obliquely down the lit slip face from the crest to the dry sand above the
    // last print, where one of them stands looking at the old prints going under (the world poses it there)
    const zA = lz + 112, xA = dunes.crestX(zA) + 4, xB = lx - 5.2, zB = lz + 6.4;
    for (let k = 0; k < 4; k++) { const t0 = k / 4, t1 = (k + 1) / 4, bow = (t) => 7 * Math.sin(Math.PI * t);
      line(lerp(xA, xB, t0) + bow(t0), lerp(zA, zB, t0), lerp(xA, xB, t1) + bow(t1), lerp(zA, zB, t1), 0.62, 0.06, 0.12, PRINT, { scar: true, was: 0.95 }); }   // (polish k1: one animal's line, its own foot's size; it was 0.52 m, at a step of 0.95 m)
  }
  { // (polish 5) an old trackway crosses the long islet from shore to shore, over its low west end: it was a dune top when the
    // animal walked it, and both ends of the line now lie under the flood (such trackways really lie under the basalt)
    const I = dunes.ISLETS[0], P0 = [I.x - 44, I.z + 13], P1 = [I.x - 4, I.z - 22];
    const a = dunes.shore(P0[0], P0[1], I.x - 20, I.z - 3, 0.25), b = dunes.shore(P1[0], P1[1], I.x - 20, I.z - 3, 0.25);
    party(a[0], a[1], b[0], b[1], 0.6, 0.2, 0.25, { was: 0.9 });
  }
  if (twinPos) {                                                                        // the twin's own line, up the corridor floor to its rise
    const sx = dunes.SEAT[0] - dunes.HD[0] * 150 + 0.94 * 1.5, sz = dunes.SEAT[2] - dunes.HD[1] * 150 + 0.342 * 1.5;
    // (k1d) one straight line from the corridor's mouth up the floor and the rise to where the pale one stands (the world's `twinPos`,
    // wherever that is): the line it has had since the live version, at the same step, one draw of the old fork a print
    line(sx, sz, twinPos.x - 0.3, twinPos.z + 0.4, 0.74, 0.25, 0.3);
    const lx0 = dunes.SEAT[0] - dunes.HD[0] * 172 - 0.94 * 3.1, lz0 = dunes.SEAT[2] - dunes.HD[1] * 172 - 0.342 * 3.1;
    line(lx0, lz0, lx0 + dunes.HD[0] * 150, lz0 + dunes.HD[1] * 150, 0.6, 0.22, 0.2, 0.24);
    // (polish k1) and older parties' lines crossing the corridor floor obliquely, softened by the wind, the whole way up it
    // (k1d: added since the live version, so their places and every print of them are drawn from `own`)
    for (let k = 0; k < 5; k++) {
      const d0 = 150 - k * 24 + own.range(-4, 4), d1 = d0 - own.range(20, 34), sgn = k % 2 ? 1 : -1, l0 = -sgn * own.range(11, 17), l1 = sgn * own.range(10, 16);
      const at = (d, l) => [dunes.SEAT[0] - dunes.HD[0] * d + 0.94 * l, dunes.SEAT[2] - dunes.HD[1] * d + 0.342 * l];
      const a = at(d0, l0), b = at(d1, l1); if (dunes.h(a[0], a[1]) < 1.5 || dunes.h(b[0], b[1]) < 1.5) continue;
      party(a[0], a[1], b[0], b[1], 0.64, 0.32 + 0.06 * k, 0.35, { own: true });
    }
  }
  const base = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.attributes.position = base.attributes.position;
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('aN', new THREE.InstancedBufferAttribute(new Float32Array(Nn), 4));
  g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(K), 2)); g.instanceCount = K.length / 2;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { uRunPh: { value: 0 } },
    vertexShader: /* glsl */`
      attribute vec4 aA, aN; attribute vec2 aK; uniform float uRunPh;
      varying vec2 vQ; varying float vSoft, vDist;
      void main(){
        float on = (aN.w < 0. || uRunPh >= aN.w) ? 1. : 0.;
        vec3 n = normalize(aN.xyz), f0 = vec3(sin(aA.w), 0., cos(aA.w));
        vec3 rt = normalize(cross(n, f0)), fw = cross(rt, n);
        float dC = length(cameraPosition - (modelMatrix * vec4(aA.xyz, 1.)).xyz);
        float grow = aK.y > 1.5 ? 1. : clamp(dC * 0.0042 / max(aK.x, 0.05), 1., 1.7);   // (thin-line rule) a print keeps about a pixel and a half at range
        vec3 w = aA.xyz + (rt * position.x + fw * position.z) * aK.x * grow * on + n * 0.015;
        vQ = position.xz; vSoft = aK.y;
        vec4 wp = modelMatrix * vec4(w, 1.); vDist = length(cameraPosition - wp.xyz) * 0.27 / clamp(aK.x, 0.2, 0.3);   // (polish 4) larger prints are seen from further off
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: PRINT_FRAG,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'prints'; mesh.frustumCulled = false; mesh.renderOrder = 2;
  return mesh;
}
function buildPuffs(script, pal, L) {
  const ff = script.footfalls, A = new Float32Array(ff.length * 4);
  ff.forEach((f, i) => A.set([f.x, f.y, f.z, f.t], i * 4));
  const base = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.attributes.position = base.attributes.position;
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 4)); g.instanceCount = ff.length;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: U(L, { uRunT: { value: 0 }, uSand: { value: new THREE.Color(pal[1]) } }),
    vertexShader: /* glsl */`
      attribute vec4 aA; uniform float uRunT;
      varying vec2 vQ; varying float vAge;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        float age = uRunT - aA.w; vAge = age / 0.9;
        float on = step(0., age) * step(age, 0.9);
        vec4 c = modelMatrix * vec4(aA.xyz + vec3(0.9 * age, 0.1 + 0.45 * sqrt(max(age, 0.)), 0.), 1.);
        vec4 mvPosition = viewMatrix * c;
        mvPosition.xy += position.xy * (0.16 + 0.75 * sqrt(max(age, 0.))) * on * length(modelMatrix[0].xyz);
        vQ = position.xy * 2.;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: PUFF_FRAG,
  });
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'puffs'; mesh.frustumCulled = false; mesh.renderOrder = 3;
  return mesh;
}
// (k1c) The fresh prints and foot puffs of up to four more runners of the same kind (the world's runners on the spur): the
// hero's own print and puff, one instance per footfall, each shown from the moment its foot comes down.
// runs[i]: the footfalls of runner i, in order: { x, z, yaw (the animal's ground point and heading at the footfall), n (even = left
// foot), t (its own run seconds), v (m/s) }. jit(): a draw from the caller's own stream (print yaw).
// -> { prints, puffs, set(i, phase, t) }: phase = stride cycles run by runner i, t = its run seconds
export function makeRunMarks(dunes, pal, L, runs, jit) {
  const A = [], Nn = [], K = [], PA = [], PW = [], nrm = new THREE.Vector3();
  runs.forEach((ff, who) => {
    for (const f of ff) {
      const sg = f.n % 2 === 0 ? 1 : -1, r = smoothstep(1.5, 7, f.v), ahead = 0.05 + Math.min(theropodCycle(f.v) * lerp(0.62, 0.26, r) * 0.5, 0.45);   // where the foot is planted (poseTheropod)
      const x = f.x + Math.cos(f.yaw) * 0.118 * sg + Math.sin(f.yaw) * ahead, z = f.z - Math.sin(f.yaw) * 0.118 * sg + Math.cos(f.yaw) * ahead, y = dunes.h(x, z);
      dunes.normal(x, z, nrm);
      A.push(x, y, z, f.yaw + (jit() - 0.5) * 0.1 + sg * 0.04); Nn.push(nrm.x, nrm.y, nrm.z, f.n * 0.5 + 0.03); K.push(0.27, 0.05, who);
      PA.push(x, y, z, f.t); PW.push(who);
    }
  });
  const base = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const g = new THREE.InstancedBufferGeometry(); g.index = base.index; g.attributes.position = base.attributes.position;
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(A), 4)); g.setAttribute('aN', new THREE.InstancedBufferAttribute(new Float32Array(Nn), 4));
  g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(K), 3)); g.instanceCount = K.length / 3;
  const uRunPh = { value: new THREE.Vector4(-1, -1, -1, -1) }, uRunT = { value: new THREE.Vector4(-1, -1, -1, -1) };
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.MultiplyBlending, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { uRunPh },
    vertexShader: /* glsl */`
      attribute vec4 aA, aN; attribute vec3 aK; uniform vec4 uRunPh;
      varying vec2 vQ; varying float vSoft, vDist;
      void main(){
        float ph = aK.z < 0.5 ? uRunPh.x : aK.z < 1.5 ? uRunPh.y : aK.z < 2.5 ? uRunPh.z : uRunPh.w;
        float on = ph >= aN.w ? 1. : 0.;
        vec3 n = normalize(aN.xyz), f0 = vec3(sin(aA.w), 0., cos(aA.w));
        vec3 rt = normalize(cross(n, f0)), fw = cross(rt, n);
        float dC = length(cameraPosition - (modelMatrix * vec4(aA.xyz, 1.)).xyz);
        float grow = clamp(dC * 0.0042 / max(aK.x, 0.05), 1., 1.7);     // (thin-line rule, as the hero's prints) a print keeps about a pixel and a half at range
        vec3 w = aA.xyz + (rt * position.x + fw * position.z) * aK.x * grow * on + n * 0.015;
        vQ = position.xz; vSoft = aK.y;
        vec4 wp = modelMatrix * vec4(w, 1.); vDist = length(cameraPosition - wp.xyz) * 0.27 / clamp(aK.x, 0.2, 0.3);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: PRINT_FRAG,
  });
  const prints = new THREE.Mesh(g, mat); prints.name = 'spur-prints'; prints.frustumCulled = false; prints.renderOrder = 2;
  const pb = new THREE.PlaneGeometry(1, 1);
  const pg = new THREE.InstancedBufferGeometry(); pg.index = pb.index; pg.attributes.position = pb.attributes.position;
  pg.setAttribute('aA', new THREE.InstancedBufferAttribute(new Float32Array(PA), 4)); pg.setAttribute('aWho', new THREE.InstancedBufferAttribute(new Float32Array(PW), 1)); pg.instanceCount = PW.length;
  const pmat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, fog: true,
    uniforms: U(L, { uRunT, uSand: { value: new THREE.Color(pal[1]) } }),
    vertexShader: /* glsl */`
      attribute vec4 aA; attribute float aWho; uniform vec4 uRunT;
      varying vec2 vQ; varying float vAge;
      #include <common>
      #include <fog_pars_vertex>
      void main(){
        float rt = aWho < 0.5 ? uRunT.x : aWho < 1.5 ? uRunT.y : aWho < 2.5 ? uRunT.z : uRunT.w;
        float age = rt - aA.w; vAge = clamp(age / 0.9, 0., 1.);
        float on = step(0., age) * step(age, 0.9);
        vec4 c = modelMatrix * vec4(aA.xyz + vec3(0.9 * age, 0.1 + 0.45 * sqrt(max(age, 0.)), 0.), 1.);
        vec4 mvPosition = viewMatrix * c;
        mvPosition.xy += position.xy * (0.16 + 0.75 * sqrt(max(age, 0.))) * on * length(modelMatrix[0].xyz);
        vQ = position.xy * 2.;
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: PUFF_FRAG,
  });
  const puffs = new THREE.Mesh(pg, pmat); puffs.name = 'spur-puffs'; puffs.frustumCulled = false; puffs.renderOrder = 3;
  return { prints, puffs, set(i, phase, t) { uRunPh.value.setComponent(i, phase); uRunT.value.setComponent(i, t); } };
}
//@@PARTS@@

// ---------------------------------------------------------------------------------------------
// The hero
// ---------------------------------------------------------------------------------------------
export async function buildHero(ctx, opts = {}) {
  const pal = (opts.palette && opts.palette.length >= 7) ? opts.palette : DEFAULT_PALETTE;
  const detail = clamp(opts.detail ?? ctx.quality?.detail ?? 1, 0.6, 1);
  const rng = ctx.rng, noise = ctx.noise;
  const object = new THREE.Group(); object.name = 'fire-in-the-sand-sea';
  const mark = () => {};
  const dunes = makeDunes(rng, noise);
  const L = makeLightUniforms(pal);
  await ctx.yield();
  const sand = new THREE.Mesh(await buildSandGeometry(ctx, dunes), makeSandMaterial(pal, L, dunes));
  sand.name = 'sand'; object.add(sand); mark('sand');
  await ctx.yield();
  const hmap = await buildHeightMap(ctx, dunes);
  const lavaMat = makeLavaMaterial(pal, L, hmap);
  const lava = new THREE.Mesh(buildLavaGeometry(dunes), lavaMat);
  lava.name = 'lava'; object.add(lava); mark('lava');
  lavaMat.uniforms.uOff.value.set(rng.range(-900, 900), rng.range(-900, 900));
  await ctx.yield();
  // --- the two animals ---
  const script = makeRunnerScript(dunes);
  await ctx.yield();
  const thGeo = buildTheropodGeometry();
  await ctx.yield();
  const runner = makeTheropod(thGeo, pal, L, { name: 'runner', hue: rng.range(-0.012, 0.012), light: rng.range(-0.02, 0.02) });
  const twin = makeTheropod(thGeo, pal, L, { name: 'twin', pale: rng.range(0.32, 0.48), hue: rng.range(-0.012, 0.012) });
  object.add(runner.mesh, twin.mesh); mark('animals');
  runner.uniforms.uLavaDir.value.set(0.62, -0.78, 0.05).normalize(); runner.uniforms.uLavaI.value = 0.5;
  twin.uniforms.uLavaDir.value.set(-0.2, -0.75, 0.62).normalize(); twin.uniforms.uLavaI.value = 0.45;
  const TWIN_LAT = 6.0;                                              // (k1c) the design: 25 m short of the ring and 6 m right of our line (it stood 2.4 m right: across the ring's disc from the corridor, and 1.5 m from the lens as we passed)
  const twinPos = new THREE.Vector3(dunes.SEAT[0] - dunes.HD[0] * 28.5 + 0.94 * TWIN_LAT, 0, dunes.SEAT[2] - dunes.HD[1] * 28.5 + 0.342 * TWIN_LAT); twinPos.y = dunes.h(twinPos.x, twinPos.z);
  // it stands square across our line, head toward the middle of the picture and a little away from us: we see its whole flank
  const twinYaw = Math.atan2(-0.94 * 0.94 + 0.342 * 0.342, -0.342 * 0.94 - 0.94 * 0.342) + rng.range(-0.25, 0.25) * 0.4;
  const rs = {}, footOff = (st, sg) => dunes.h(st.x + Math.cos(st.yaw) * 0.118 * sg, st.z - Math.sin(st.yaw) * 0.118 * sg) - st.y;
  let progress = -1, focusPhase = false, runT = -1;
  function poseAll(time) {
    const u = progress >= 0 ? progress : 0.175 + ((time * 0.011) % 0.2);       // demo loop until the world drives it
    const t = runT >= 0 ? runT : progress >= 0 ? RUN_T0 : RUN_T0 + ((time * 0.9) % 20);
    script.stateAt(t, rs);
    rs.time = time; rs.groundL = footOff(rs, 1); rs.groundR = footOff(rs, -1);
    const calm = 1 - smoothstep(0.1, 1.5, rs.speed);
    rs.look = calm * (t < RUN_T0 ? birdLook(time, 1.7, 0.55) : birdLook(time, 4.1, 0.4)); rs.alert = smoothstep(0.2, 1.0, t);
    if (focusPhase) { rs.speed = 9; rs.phase = time * 2.647; rs.look = 0; }
    runner.pose(rs);
    prints.material.uniforms.uRunPh.value = focusPhase ? 0 : rs.phase; puffs.material.uniforms.uRunT.value = focusPhase ? 0 : t;
    toes.material.uniforms.uToeU.value = progress >= 0 ? smoothstep(0.5, 0.63, progress) : 0.5 + 0.5 * Math.sin(time * 0.3);
    twin.pose({ x: twinPos.x, y: twinPos.y, z: twinPos.z, yaw: twinYaw, speed: 0, phase: 0, time: time + 1.3, look: birdLook(time, 9.2, 0.8) - 0.3,
      groundL: dunes.h(twinPos.x + Math.cos(twinYaw) * 0.118, twinPos.z - Math.sin(twinYaw) * 0.118) - twinPos.y, groundR: dunes.h(twinPos.x - Math.cos(twinYaw) * 0.118, twinPos.z + Math.sin(twinYaw) * 0.118) - twinPos.y });
  }
  // --- toes along the near shores (+ the one that closes over the last print, driven by progress) ---
  const lastPrint = (() => { const z = -224, cx = dunes.crestX(z); const [x] = dunes.shore(cx + 150, z, cx + 15, z, 0); return { x: x + 0.9, z, y: 0, ang: -Math.PI / 2, size: 2.0 }; })();
  const toes = await buildToes(ctx, dunes, rng.fork('toes'), pal, L, Math.round(400 * detail), lastPrint);
  object.add(toes); mark('toes');
  await ctx.yield();
  const tongue = await buildTongue(ctx, dunes, pal, L);
  object.add(tongue.mesh);
  lavaMat.uniforms.uDelta.value.set(tongue.foot.x - 12, SADDLE_Z, 50);       // (polish k1) the pour feeds a fresh sheet that fans out over the east lake from its foot
  await ctx.yield();
  await ctx.yield();
  const own = makeRng(hashSeed('fire-in-the-sand-sea:trackways-k1c:' + (ctx.seed ?? 0)));     // (k1c) a stream of its own, from the world's seed and a name: it draws nothing from the hero's rng or from its 'prints' fork
  const prints = buildPrints(dunes, script, rng.fork('prints'), lastPrint, twinPos, own), puffs = buildPuffs(script, pal, L);
  object.add(prints, puffs); mark('prints');
  await ctx.yield();
  //@@BUILD@@
  // --- viewer framing (and close-up modes for judging: opts.focus or ?focus=runner|twin|shore|tongue) ---
  let center = new THREE.Vector3(70, 66, -215), radius = 200, height = 44;   // the viewer's orbit then stays above every crest
  const focus = opts.focus || null;
  if (focus === 'runner') { progress = 0.3; runT = 20; focusPhase = true; script.stateAt(20, rs); center = new THREE.Vector3(rs.x, rs.y + 0.75, rs.z); radius = 0.2; height = 3.2; }
  if (focus === 'shore') { center = new THREE.Vector3(lastPrint.x - 2, 1.5, lastPrint.z); radius = 2; height = 9; }
  if (focus === 'tongue') { center = new THREE.Vector3(tongue.foot.x - 8, 7, SADDLE_Z); radius = 14; height = 26; }
  if (focus === 'twin') { center = new THREE.Vector3(twinPos.x, twinPos.y + 0.75, twinPos.z); radius = 0.2; height = 5; }
  if (focus === 'runner' || focus === 'twin') { object.scale.setScalar(3.2); center.multiplyScalar(3.2); }   // the viewer cannot come nearer than 8 m: bring the animal to it
  // --- anchors (local space: x east, z south, y up; y 0 = the east lake) ---
  const h = dunes.h, V3 = (x, y, z) => new THREE.Vector3(x, y, z), over = (x, z, c) => V3(x, h(x, z) + c, z);
  const stand = script.at(0, {}), stop = script.at(script.total, {});
  const seat = V3(...dunes.SEAT), notchY = h(seat.x, seat.z);
  const hd = V3(dunes.HD[0], 0, dunes.HD[1]);                             // final heading: 20 degrees east of north
  const clear = (x, z, c) => Math.max(h(x, z), dunes.level(x, z)) + c;
  const lineTo = (d) => { const x = seat.x - hd.x * d, z = seat.z - hd.z * d; return V3(x, Math.max(12, seat.y - 0.2126 * d, d > 135 ? clear(x, z, 6) : 0), z); };
  const cz = (z, side, up) => V3(dunes.crestX(z) + side, dunes.crestY(z) + up, z);
  const shoreE = (z) => dunes.shore(dunes.crestX(z) + 150, z, dunes.crestX(z) + 15, z, 0)[0];
  const lip = cz(-131, -2, 2.2), sh = V3(shoreE(-200) + 4, 5, -200), down = (t) => { const x = lerp(lip.x, sh.x, t), z = lerp(lip.z, sh.z, t); return V3(x, Math.max(clear(x, z, 4), 5), z); };
  const whaleP = lavaMat.uniforms.uWhaleP.value;
  const anchors = {
    crossing: V3(dunes.crestX(0), h(dunes.crestX(0), 0), 0),                  // where the path crosses the home crest (y 55)
    entry: { position: V3(-153, 38, 0), heading: V3(1, 0, 0) },           // brief entry: level, heading east up the windward flank
    // the brief's camera line, entry to ring, laid on this seed's terrain (2.6 m over the ripples on the climb and the crest,
    // 4 m down the slip face, 5 m at the shore, 12 m over the lake, then the dead-straight 12 degree climb, 6.8 m clear, to the ring)
    flyThrough: [
      V3(-153, 38, 0), V3(-95, Math.max(38, clear(-95, 0, 3)), 0), V3(-50, clear(-50, 0, 2.6), 0), V3(-18, clear(-18, 0, 2.6), 0), V3(0, h(0, 0) + 3, -3),
      cz(-22, -3, 2), cz(-60, -3, 2), cz(-100, -3, 2), lip, down(0.3), down(0.65), sh,
      lineTo(277), lineTo(240), lineTo(190), lineTo(135), lineTo(70), lineTo(0),
    ],
    portalSeat: { position: seat, facing: V3(-hd.x, 0, -hd.z), radius: 7, floorY: notchY },   // 14 m ring in the notch between the two horns
    horns: [over(168, dunes.spurZ(168), 0), over(212, dunes.spurZ(212), 0)],
    runnerStand: V3(stand.x, h(stand.x, stand.z), stand.z), runnerStop: V3(stop.x, h(stop.x, stop.z), stop.z),
    twin: twinPos.clone(),
    tongueLip: tongue.lip, tongueFoot: tongue.foot,
    islet: V3(dunes.ISLET.x, h(dunes.ISLET.x, dunes.ISLET.z), dunes.ISLET.z),
    lastPrint: V3(lastPrint.x - 0.9, 0, lastPrint.z),                      // where the old trackway meets the lava (u 0.59)
    whaleback: V3(whaleP.x, 0, whaleP.y),
    westBay: over(dunes.crestX(58) - 100, 58, 0),                          // the curve of fire lower right of the entry frame
    viewpoints: { crest: { position: V3(0, h(0, 0) + 3, 0), lookAt: V3(260, 0, -120) }, shore: { position: V3(shoreE(-208) + 3, 5, -208), lookAt: tongue.foot }, lake: { position: lineTo(240, 12), lookAt: seat } },
    lakeLevels: { east: LAKE_EAST, west: LAKE_WEST },
  };
  function applyProgress(time) {
    const u = progress;
    const wu = u >= 0 ? smoothstep(0.585, 0.65, u) : 0.5 - 0.5 * Math.cos(time * 0.2);
    lavaMat.uniforms.uWhaleU.value = wu;
    lavaMat.uniforms.uDelta.value.z = 46 + 18 * (u >= 0 ? u : 0.5);          // the pour's sheet reaches further out as the flood rises
    lavaMat.uniforms.uWhaleGlow.value = u >= 0 ? smoothstep(0.625, 0.67, u) * (1 - 0.8 * smoothstep(0.74, 0.83, u)) : smoothstep(0.55, 0.95, wu);
  }
  poseAll(0); applyProgress(0); mark('end');
  return {
    object, radius, height, center, anchors,
    heightAt: dunes.h, levelAt: dunes.level, dunes, runner, twin, script, lights: L, parts: { sand, lava, toes, tongue: tongue.mesh, prints, puffs },
    // progress along the world's path (0..1, the brief's timing): the runner's turn and run, its prints and puffs, the toe over the last print, the whaleback
    setProgress(u) { progress = clamp(u, 0, 1); },
    setRunTime(t) { runT = t; },                    // the runner's script seconds (see makeTiming); independent of the lava's progress
    update(dt, time, camera) { L.uTime.value = time; poseAll(time); applyProgress(time); },
    dispose() {},
    ground: false, groundY: 0,
  };
}
