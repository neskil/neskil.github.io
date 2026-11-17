// The Storm That Drowned No One
// A disc of black cloud, rain and great green seas stands over the open sea off an island's headland. In it rides a
// three-masted ship whose mast tops, yards and bowsprit wear a pale running fire that burns nothing. The cloud's torn,
// sunlit edge hangs over the headland and its wooded ridge; north of the ridge lies a deep still nook where a ship of
// the same build sleeps furled on calm water, then yellow sands with springs and brine pits, a cloven pine, a grove of
// limes round a cell, cornfields; over the island a rainbow that stands opposite the sun for whoever looks, and towers,
// palaces and temples of cloud that sink from their crowns and heap up again, a ring of light standing in the last arch.
//
// Space: metres, +Y up, sea level y = 0. An azimuth a means the direction (sin a, 0, -cos a). Every place below is
// written for the unmirrored island; the island may also lie mirrored (every x changes sign).
// Two frames of the island: (r, n) = metres along the ridge's line (azimuth 290) from the knoll's middle and metres
// north of it (azimuth 20); (a, c) = metres along the sands' line from abeam of the knoll's middle and metres to its
// right. The sands' line is the ridge's line moved 145 m north.
//
// WHAT STANDS WHERE: the storm is the field stormAt(x, z); every surface takes its weather from the field at its own
// place. WHAT THE EYE WEARS, all of it: the sea's sheet (a grid that goes with the eye; its waves, foam and colour are
// those of the water's own place), the sky's dome, the fog, the scene's two lights (the sun's and the sky's, by value
// only), the rain's box and THE SPINDRIFT'S BOX, the rain's twin: a medium we fly through, the kit's box of streaks 70 m
// by 9 m by 70 m low over the sea, kept about the eye by the kit's own law as the rain's is, its strength the square
// of the field at the eye's place. These read the field at the eye's place.
// So does THE RAINBOW, a companion: the kit's bow, worn by the eye as every rainbow is. Its station:
// whole, opposite the sun, drawn 340 m from the eye, at every place of the island; it has no place of its own in the
// world. (Along the sands' line its right foot stands straight ahead: seen from the sands, beyond the limes over the
// first corn; seen from the corn, over the corn under the climb. Its crown stands 35 degrees to the left and 20 up,
// its left foot over the sea.) Its ONE state: it stands at one strength, its colours breathing on the world's clock;
// the storm's field at the eye's place veils it as the fog would. It begins, turns and ends nothing, and nothing
// begins, turns or ends where the eye passes under it.
// WHAT ELSE READS THE EYE'S PLACE, all of it, each a thing at its own place of the world that only looks as such a
// thing looks from where it is seen: the water's skin (the sea's and the inner bed's: less of what lies under it at a
// grazing look, its sky and its glints by the look's angle); the gleam of the running fire on the wet ship; the
// outlines (the cloud's and the lime leaves' ragged rims: a face seen edge-on is eaten by its own grain); the
// grove's haze (the metres of the sight line that lie inside the grove's own box, at one density: the fog of that
// place); the halo of the cell's lamp (a ball of glow at the lamp, brightest where it faces the eye); the shafts
// under the limes (the kit's rays: sheets about their own axes, dimmed by the kit's law where the eye stands in
// one: wholly within 0.3 of a shaft's width of its axis, not at all beyond 1.2); the limes' leaf bodies (each is a ball at its own place, of its own size and turn, built as a case of twenty
// faces that holds it: the leaf shader finds where the look meets the ball inside the case and draws the ball's own
// surface there, so the ball is one thing from everywhere and only the side of it that is seen follows the eye);
// the storm's bank seen from outside (its heads are balls at their own places in the cloud's metres, 22 m and
// more inside its edge; the dome lays the sight ray from the eye's place against them wherever the eye is not
// under the cloud, so nearer heads slide before farther ones as standing things do); the doubles in the still
// water (the pageant's bodies, the inner water's rocks, the strand's first four stones in the water, the pine: each at its own
// place, met by the sight's mirrored ray from the water's own place, on still water only, and, like the mirror's
// own law there, for an eye that is not under the cloud: within 12 m of the cloud's edge the one law passes into
// the other, as the dome's two skies do); the wet
// band on the sands (the sky's gleam on it by the look's angle, as on the water's skin, along the lip's straight).
// The colonnade's bed of mist is not among them: it is as thick as its own place makes it. The limes' light
// through their leaves is not among them: it is a rule of the leaf and the sun.
// ONE RULE OF DRAWING: the sleeping ship's copy in the still water stands at its own mirrored place; only the depth at
// which its fragments are written is taken from the sight ray, so that it shows under the water's skin (see the part).
// Flames ply one lane from the burning ship round the headland to the sleeping one, every cloud building sinks and
// heaps on a turn of its own, the dancers' two rings thin and gather half a turn apart: each on the world's clock, for ever.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, makeNoise, hashSeed } from '../kit/core.js';
import * as T from '../kit/terrain.js';
import * as flora from '../kit/flora.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, makeFlames, SHIP, CloudBuilder, PAGEANT, GREAT, CLOUD_BUILDINGS, makeCloudMaterial } from '../parts/storm-that-drowned-no-one.js';

const TAU = Math.PI * 2, RAD = Math.PI / 180;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const azDir = (deg) => [Math.sin(deg * RAD), -Math.cos(deg * RAD)];

// ---------------------------------------------------------------- places of the island (unmirrored), metres
const KNOLL = { x: 50, z: -208, r: 32, h: 38 };
const RIDGE = { len: 170, az: 290, half: 27, h: 45 };
const RD = azDir(RIDGE.az), ND = azDir(RIDGE.az + 90);
// the sands' line lies this far north of the ridge's line; the waves' mean lip this far to its right. (The design's
// line lies 200 m north of a ridge 110 m thick. This ridge is 54 m thick: 118 m of water lie between its foot and the
// sands, and the nook's straight is as long as that leaves it.)
const SANDS_N = 145, LIP_C = 3.5;
// THE SEA'S WAVE TRAINS: [length in metres, height, the share of it that comes into the nook]
const SEA_TRAINS = [[140, 1.2, 0.09], [86, 1.9, 0.045], [52, 1.25, 0.014], [33, 0.75, 0.008], [21, 0.42, 0.006], [13, 0.2, 0.006]];
// the swash's longer wave along the shore is the sea's own 33 m train, the longest of the short ones that reach the
// sands (radians to the metre): on any 100 m of shore the lip is far up the sand on some stretches and drawn back on
// others at every moment. One number for the sea and for the steps.
const SWASH_K = TAU / SEA_TRAINS[3][0];
// a place given in the sands' frame: a metres along the line, c metres to its right
const fr = (a, c) => [KNOLL.x + RD[0] * a + ND[0] * (SANDS_N + c), KNOLL.z + RD[1] * a + ND[1] * (SANDS_N + c)];
// THE STORM: whole where n <= n0 (to seaward of the ridge's line), none where n >= n1 (the nook's mouth); a disc whose
// middle lies discN along the ridge's normal, whole to r0 and gone at r1. The band's two edges by the knoll (32 m in
// radius): the storm side 32 m to seaward of the knoll's seaward foot, the clear side 6 m north of its north foot,
// where the nook's mouth opens between the knoll and the east point.
const STORM = { n0: -64, n1: 38, discN: -440, r0: 580, r1: 700 };
const stormRaw = (x, z) => {
  const dx = x - KNOLL.x, dz = z - KNOLL.z, n = dx * ND[0] + dz * ND[1];
  return (1 - smoothstep(STORM.n0, STORM.n1, n)) * (1 - smoothstep(STORM.r0, STORM.r1, Math.hypot(dx - ND[0] * STORM.discN, dz - ND[1] * STORM.discN)));
};
// the cloven pine stands where the shore leaves the sands' line; the cell's door looks on the grove's line from its right
const PINE = { a: 160, c: 11 };
const CELL = { a: 240, c: 14 };
const HILL = { a: 405, c: 420, h: 60, r: 190 };
// the pageant's floor of mist stands this high over the sea; the line ends at the height of the colonnade's capitals.
// (The design: a floor 30 m up and an end 75.5 m up. Here the columns, 30 m tall, stand on the floor itself, their
// feet 3 m in it, so the line at their capitals ends 25.5 m over the floor.)
const MIST = 34, END_Y = MIST + 25.5;
// the water of the nook, as a ring of shore points: out past the island's south edge at the mouth, up the east shore,
// along the lip of the sands, and back down the west shore to the ridge
const COVE = [[-30, -235], [40, -150], [230, -170], [165, -232], [146, -262], [142, -300], [128, -336], [100, -353], [70, -362], fr(58, LIP_C), fr(150, LIP_C), fr(165, -12), fr(172, -40), fr(168, -80), fr(160, -125)];
// the island's own edge
const ISLAND = [[222, -222], [300, -260], [345, -400], [330, -700], [200, -1050], [-250, -1230], [-800, -1150], [-1150, -800], [-1100, -560], [-900, -430], [-650, -380], [-400, -335], [-200, -300], [-95, -262], [-60, -250], [0, -230], [60, -215], [150, -205]];

// one corner-cutting pass, so that shores are rounded
const chaikin = (pts) => { const o = []; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } return o; };
// signed distance to a closed ring: positive inside
function ringSD(ring) {
  const n = ring.length, ax = new Float64Array(n), az = new Float64Array(n), ex = new Float64Array(n), ez = new Float64Array(n), il = new Float64Array(n);
  for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; ax[i] = a[0]; az[i] = a[1]; ex[i] = b[0] - a[0]; ez[i] = b[1] - a[1]; il[i] = 1 / (ex[i] * ex[i] + ez[i] * ez[i]); }
  return (x, z) => {
    let best = Infinity, inside = false;
    for (let i = 0; i < n; i++) {
      const px = x - ax[i], pz = z - az[i], t = clamp((px * ex[i] + pz * ez[i]) * il[i], 0, 1), dx = px - ex[i] * t, dz = pz - ez[i] * t, d = dx * dx + dz * dz;
      if (d < best) best = d;
      const z0 = az[i], z1 = az[i] + ez[i];
      if ((z0 > z) !== (z1 > z) && x < ax[i] + ex[i] * (z - z0) / (z1 - z0)) inside = !inside;
    }
    return inside ? Math.sqrt(best) : -Math.sqrt(best);
  };
}

// The island's ground. MX is +1 or -1 (the mirror); every function takes world coordinates.
function makeIsland(MX, noise, V) {
  const sdCove = ringSD(chaikin(COVE)), sdIsle = ringSD(chaikin(ISLAND));
  const rx0 = KNOLL.x, rz0 = KNOLL.z;
  const sdKnoll = (x, z) => KNOLL.r - Math.hypot(x - KNOLL.x, z - KNOLL.z);
  const ridgeT = (x, z) => clamp(((x - rx0) * RD[0] + (z - rz0) * RD[1]) / RIDGE.len, 0, 1);
  const sdRidge = (x, z) => { const t = ridgeT(x, z); return RIDGE.half - Math.hypot(x - rx0 - RD[0] * RIDGE.len * t, z - rz0 - RD[1] * RIDGE.len * t); };
  // distance inland from the nearest shore (negative: metres out in the water), memoised on a 10 m lattice
  const G = 10, X0 = -1320, Z0 = -1400, NX = 184, NZ = 139, memo = new Float32Array(NX * NZ).fill(NaN);
  const sdRaw = (x, z) => Math.max(Math.min(sdIsle(x, z), -sdCove(x, z)), sdKnoll(x, z), sdRidge(x, z));
  const node = (i, j) => { const k = j * NX + i; let v = memo[k]; if (v !== v) { v = sdRaw(X0 + i * G, Z0 + j * G); memo[k] = v; } return v; };
  const shore = (wx, wz) => {
    const x = wx * MX, fx = (x - X0) / G, fz = (wz - Z0) / G, i = Math.floor(fx), j = Math.floor(fz);
    if (i < 0 || j < 0 || i >= NX - 1 || j >= NZ - 1) return sdRaw(x, wz);
    const tx = fx - i, tz = fz - j;
    return lerp(lerp(node(i, j), node(i + 1, j), tx), lerp(node(i, j + 1), node(i + 1, j + 1), tx), tz);
  };
  // the two frames: (a, c) along and to the right of the sands' line; n north of the ridge's line
  const Q = fr(0, 0), hd = RD, rt = ND;
  const lineAC = (wx, wz) => { const x = wx * MX - Q[0], z = wz - Q[1]; return [x * hd[0] + z * hd[1], x * rt[0] + z * rt[1]]; };
  const northOf = (wx, wz) => (wx * MX - KNOLL.x) * ND[0] + (wz - KNOLL.z) * ND[1];
  const storm = (wx, wz) => stormRaw(wx * MX, wz);
  const heightAt = (wx, wz) => {
    const x = wx * MX, z = wz, sd = shore(wx, wz);
    if (sd < 0) {
      // the bed shelves gently only inside the nook (north of the ridge's line); on the open sea and under the knoll's cliffs it falls away at once
      const nook = smoothstep(14, 44, northOf(wx, wz));
      const gentle = sd < -30 ? -0.9 + (sd + 30) * 0.11 : sd * 0.03;
      return Math.max(-16, lerp(sd * 0.45 - 0.4, gentle, nook));
    }
    const [a, c] = lineAC(wx, wz);
    let h = sd <= 40 ? sd * 0.03 : 1.2 + 3.2 * smoothstep(40, 150, sd);
    // dunes behind the sands and along the nook's east shore, with a lane left along the sands' line
    const east = smoothstep(120, 170, x);
    const lane = a > 0 ? smoothstep(12, 34, Math.abs(c)) : 1;
    if (sd > 40) {
      const dn = 0.5 + 0.5 * noise.n2(x * 0.021 + 3.1, z * 0.021 - 7.7) + 0.25 * noise.n2(x * 0.06, z * 0.06 + 11);
      h += (3.2 + 8.5 * east) * dn * smoothstep(40, 62, sd) * (1 - smoothstep(95, 170, sd) * (1 - 0.5 * east)) * lane;
    }
    // the meadow rolls by two metres; the land rises to a rocky edge on the far side of the vines
    if (sd > 60) h += 2 * V.roll * noise.n2(x * 0.008 + 5, z * 0.008 + 2) * smoothstep(60, 160, sd) * (0.35 + 0.65 * lane);
    if (c < -110 && a > 235) h += 20 * smoothstep(110, 270, -c) * smoothstep(235, 405, a) * smoothstep(0, 60, sd);
    // the turf hill
    const dh = Math.hypot(a - HILL.a, c - HILL.c) / HILL.r;
    if (dh < 2) h += HILL.h * V.hill * Math.exp(-dh * dh * 2.4) * smoothstep(0, 80, sd);
    // the knoll: a rock with cliffs to the water and a rough crown; and the wooded ridge that ties it to the island
    const dk = Math.hypot(x - KNOLL.x, z - KNOLL.z) / KNOLL.r;
    if (dk < 1.25) {
      const rough = 0.82 + 0.3 * noise.n2(x * 0.045, z * 0.045) + 0.1 * noise.n2(x * 0.16 + 9, z * 0.16);
      h = Math.max(h, KNOLL.h * rough * (1 - Math.pow(smoothstep(0.42, 1.04, dk), 1.6)));
    }
    const sr = x > -150 && x < 110 && z > -330 && z < -150 ? sdRidge(x, z) : -99;
    if (sr > -6) {
      const t = ridgeT(x, z), crest = lerp(27, RIDGE.h, smoothstep(0.08, 0.5, t)) * (0.86 + 0.2 * noise.n2(x * 0.02 + 40, z * 0.02));
      h = Math.max(h, crest * Math.pow(clamp((sr + 4) / (RIDGE.half + 4), 0, 1), 0.75));
    }
    return h;
  };
  return { heightAt, shore, lineAC, northOf, storm, Q, hd, rt };
}

// ---------------------------------------------------------------- the plan: the mirror and the island's measures, the ground, the route
// It needs nothing but the island's own numbers.
// planSteps is the same plan made in short steps (the build breathes between them); plan runs it to its end.
export function plan(seed, vary = {}) { const it = planSteps(seed, vary); let r = it.next(); while (!r.done) r = it.next(); return r.value; }
export function* planSteps(seed, vary = {}) {
  const rv = makeRng(hashSeed('storm-plan:' + seed));
  const MX = rv.chance(0.5) ? -1 : 1;
  const moodDraw = rv();
  const V = { roll: rv.range(0.8, 1.2), hill: rv.range(0.85, 1.15), mood: vary.mood ?? moodDraw, fleet: rv.int(2, 5), dancers: rv.int(16, 32), globeSide: rv.chance(0.5) ? 1 : -1, order: rv.shuffle([0, 1, 2]), tall: [rv.range(0.85, 1.15), rv.range(0.85, 1.15), rv.range(0.85, 1.15), rv.range(0.9, 1.1)] };
  const isle = makeIsland(MX, makeNoise(hashSeed('storm-isle:' + seed)), V);
  // the line: pieces from the entry on; sampled every 2 m on the flat
  const P = []; let x = 0, z = 6, az = 0;
  const step = (d) => { const v = azDir(az); x += v[0] * d; z += v[1] * d; P.push({ x, z, az }); };
  const straight = (len) => { const n = Math.max(1, Math.round(len / 2)); for (let i = 0; i < n; i++) step(len / n); return P.length - 1; };
  const arc = (R, sweep) => { const len = R * Math.abs(sweep) * RAD, n = Math.max(1, Math.round(len / 2)); for (let i = 0; i < n; i++) { az += sweep / n / 2; step(2 * R * Math.sin(Math.abs(sweep) * RAD / n / 2)); az += sweep / n / 2; } return P.length - 1; };
  // where a left arc of radius R through sweep degrees would end, from a state (no point is laid)
  const arcEnd = (st, R, sweep) => { const a0 = st.az * RAD, a1 = (st.az - sweep) * RAD; return { x: st.x - R * (Math.cos(a0) - Math.cos(a1)), z: st.z - R * (Math.sin(a0) - Math.sin(a1)), az: st.az - sweep }; };
  P.push({ x, z, az });
  const M = {};
  // (26 m straight on the entry's own heading before the first arc)
  straight(26); M.P1 = arc(60, 45);
  // the pass: her length beside her, from taffrail to bowsprit end
  M.bow = straight(SHIP.LENGTH);
  // to the headland: 20 m on, then a left arc of radius 100 until the line ahead is tangent to the circle round the
  // knoll's middle that keeps the line ROUND_KNOLL from it; round that circle to heading 350 at the nook's mouth.
  // (The design rounds a knoll 106 m across on a radius of 80; this knoll is 64 m across, and the round that keeps
  // the line 28 m off its foot has a radius of 60.)
  straight(20);
  const ROUND_KNOLL = KNOLL.r + 28, leftOf = (st) => (KNOLL.x - st.x) * -Math.cos(st.az * RAD) + (KNOLL.z - st.z) * -Math.sin(st.az * RAD);
  let lo = 0, hi = 60;
  for (let i = 0; i < 30; i++) { const mid = (lo + hi) / 2; if (leftOf(arcEnd({ x, z, az }, 100, mid)) > ROUND_KNOLL) lo = mid; else hi = mid; }
  arc(100, -(lo + hi) / 2);
  { const v = azDir(az); M.P3 = straight(Math.max(2, (KNOLL.x - x) * v[0] + (KNOLL.z - z) * v[1])); }
  M.P4 = arc(ROUND_KNOLL, -(az + 10));
  // the nook: straight on heading 350 for as long as it takes the last left arc (radius 70, to the sands' heading) to end
  // on the sands' line. (The design's arc has a radius of 60; on 70 the line rounds her stern gallery 13 m off.)
  { const e = arcEnd({ x, z, az }, 70, az + 360 - RIDGE.az), cEnd = (e.x - isle.Q[0]) * ND[0] + (e.z - isle.Q[1]) * ND[1], v = azDir(az);
    M.P5 = straight(-cEnd / (v[0] * ND[0] + v[1] * ND[1])); }
  const calmEnd = { x, z, az };
  M.Q = arc(70, RIDGE.az - 360 - az);
  M.grove0 = straight(120); M.grove1 = straight(92); M.climb0 = straight(110);
  // the climb: at 20 degrees to the height of the colonnade's capitals, then level along the colonnade to the last arch.
  // (The design's level end is 70 m. This one is as long as its colonnade: 10 m from the climb's top to the first
  // pitch, room for five columns a side at 15 m, and 34 m before the arch for its piers and steps.)
  const climbRun = (END_Y - 5.5) / Math.tan(20 * RAD);
  M.climb1 = straight(climbRun); M.end = straight(130);
  // heights: keyed over the water, the ground plus a clearance over the land, the climb, then smoothed
  const key = [[0, 25], [M.P1, 21], [M.bow, 19], [M.P3, 10.5], [M.P4, 6.5], [M.P5 - 25, 4], [M.P5, 4], [M.Q, 2.2]];
  const n = P.length, y = new Float64Array(n), gnd = new Float64Array(n), seas = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    gnd[i] = Math.max(0, isle.heightAt(P[i].x * MX, P[i].z));
    // 9 m over mean sea wherever the great seas stand under the line
    seas[i] = 9 * smoothstep(0.12, 0.3, stormRaw(P[i].x, P[i].z));
    let k = 0; while (k < key.length - 2 && i > key[k + 1][0]) k++;
    const keyed = lerp(key[k][1], key[k + 1][1], clamp((i - key[k][0]) / (key[k + 1][0] - key[k][0]), 0, 1));
    const clr = i <= M.grove0 ? 2.2 : i <= M.grove1 ? lerp(2.2, 5, (i - M.grove0) / (M.grove1 - M.grove0)) : 5.2;
    y[i] = Math.max(keyed, seas[i], gnd[i] + clr);
    if (i > M.climb0) y[i] = Math.min(END_Y, Math.max(y[i], y[M.climb0] + (i - M.climb0) * 2 * Math.tan(20 * RAD)));
    if (i % 60 === 59) yield;
  }
  for (let pass = 0; pass < 3; pass++) {
    const o = Float64Array.from(y);
    for (let i = 0; i < n; i++) { let s = 0, c = 0; for (let d = -4; d <= 4; d++) { const j = clamp(i + d, 0, n - 1); s += o[j]; c++; } y[i] = s / c; }
  }
  // never nearer the ground than nine tenths of the stretch's clearance, nor the great seas than 9 m, at every 2 m of the line
  for (let i = 0; i < n; i++) y[i] = Math.max(y[i], seas[i], gnd[i] + (i <= M.grove0 ? 2.0 : 2.0 + 2.6 * smoothstep(M.grove0, M.grove1, i)));
  const pts = [], sAt = new Float64Array(n);
  for (let i = 0; i < n; i++) { pts.push(new THREE.Vector3(P[i].x * MX, y[i], P[i].z)); if (i) sAt[i] = sAt[i - 1] + pts[i].distanceTo(pts[i - 1]); }
  const marks = {}; for (const k of Object.keys(M)) marks[k] = sAt[M[k]];
  // places that follow from the line: the storm ship lies SHIP.FLYBY to port of the pass, her taffrail abeam of the arc's end;
  // the calm ship lies CALM_OFF to port of the nook's straight, bow to the mouth, her taffrail abeam of the straight's end
  const at = (i, right, y2 = 0) => { const p = P[i], r = azDir(p.az + 90); return new THREE.Vector3((p.x + r[0] * right) * MX, y2, p.z + r[1] * right); };
  const mid = Math.round((M.P1 + M.bow) / 2 - (SHIP.SPRIT + SHIP.STERN) / 4);
  const CALM_OFF = 14.5, cv = azDir(calmEnd.az), cl = azDir(calmEnd.az - 90);
  const calmShip = new THREE.Vector3((calmEnd.x + cv[0] * SHIP.STERN + cl[0] * CALM_OFF) * MX, 0, calmEnd.z + cv[1] * SHIP.STERN + cl[1] * CALM_OFF);
  const places = { stormShip: at(mid, -SHIP.FLYBY), stormAz: P[M.P1].az, calmShip, calmAz: calmEnd.az + 180, end: pts[n - 1].clone(), endAz: P[n - 1].az };
  marks.ship0 = marks.P5 - SHIP.LENGTH;
  return { MX, V, isle, pts, sAt, marks, places, flat: P, gnd };
}

// ---------------------------------------------------------------- the storm's field and the sky
// The same field as stormRaw, for shaders: uKn the knoll's middle, uNd the ridge's normal, uBand (n0, n1, discN, r0), uDiscR r1.
const STORM_GLSL = /* glsl */`
  uniform vec2 uKn, uNd; uniform vec4 uBand; uniform float uDiscR;
  float stormF(vec2 p) {
    vec2 d = p - uKn; float n = dot(d, uNd);
    return (1. - smoothstep(uBand.x, uBand.y, n)) * (1. - smoothstep(uBand.w, uDiscR, length(d - uNd * uBand.z)));
  }`;
// (NBANK: the lobes of the storm's bank as it is seen from outside)
const NBANK = 32, BANK_H = 290;
// The sky is one dome worn by the eye. The storm's cloud stands over the field's ground: its edge stands uEdge.x
// north of the ridge's line, its skirts hang to uEdge.y at the edge, its heads by the knoll stand uEdge.z high. A sight
// ray from the eye's place (uAt) is laid against it: from under it the ray leaves below the skirt (the strip of clear
// sky), from outside it meets the cloud's torn edge or passes over its heads. skyAt(d) is shared with the sea, which mirrors it.
// THE CLOUD FROM OUTSIDE IS A BANK OF CUMULUS HEADS, and every form of it is written in the cloud's own metres and the
// world's clock (nothing of the eye but where its sight ray starts): r along the ridge's line from the knoll's
// middle (uRd), height, and metres in from the cloud's edge. Eight heads stand along it (uBank, placed in build),
// each of four round lobes 22 to 220 m in from the edge, so that a sight ray meets the nearer lobe before the farther
// and the heads slide before one another as the eye goes by. Three sizes: heads 40 to 150 m across; on every lobe
// lumps of 0.45 and 0.2 of its radius (6 to 34 m) with creases between; tufts of 6 to 11 m that fray its outline; all
// of it crawls. Behind the heads the storm's own body is a dark level roof at 0.40 to 0.55 of the bank's height.
// THE BANK'S HEIGHT (bankTop): uEdge.z by the knoll and to seaward of it (a head's crown at 0.62 to 1.02 of it: 180
// to 296 m, four to six and a half times the ridge); along the ridge's line from the knoll it falls, to 0.45 of that
// 200 m on (crowns 81 to 133 m), and on toward a fifth of that at 640 m and at its seaward end. ITS LIGHT is the
// going storm's: a lobe's face toward the sun cream, toward its shade's edge gold; its lee, its creases, what
// another lobe shades and what stands low blue-black; the soft glows inside it are the storm's own, on the same
// turns of the world's clock as those seen from under it, each at a place of the bank; rain hangs under its skirt
// with the sun in its sheets.
const SKY_GLSL = STORM_GLSL + /* glsl */`
  uniform vec3 uSunDir, uZen, uHor, uSunCol, uCloudDark, uCloudBelly, uEye, uStrip, uLow, uAt, uEdge, uShipAt, uGlowCol; uniform vec2 uRd; uniform vec4 uBank[${NBANK}];
  uniform float uSkyTime, uDisc, uGlowPh[3], uGlowT[3]; uniform sampler2D uNoise;
  // the noise (128 texels across) read with a smooth step between its texels, so its grain never shows as a lattice in the sky
  vec4 skyTex(vec2 p) { vec2 r = p * 128. + .5, i = floor(r), f = r - i; f = f * f * (3. - 2. * f); return texture2D(uNoise, (i + f - .5) / 128.); }
  float skyN(vec2 p) { return skyTex(p).r * .5 + skyTex(p * 2.03 + .31).g * .3 + skyTex(p * 4.4 + .73).g * .2; }
  float hash1(float n) { return fract(sin(n * 12.9898) * 43758.5453); }
  vec3 clearSky(vec3 d, float n, float disc) {
    float h = clamp(d.y, 0., 1.);
    vec3 c = mix(uHor, mix(uZen, vec3(.66, .8, .95), .5), smoothstep(0., .14, h));
    c = mix(c, uZen, smoothstep(.07, .55, h));
    float sd = clamp(dot(d, uSunDir), 0., 1.);
    float s2 = sd * sd, s8 = s2 * s2 * s2 * s2, s64 = s8 * s8 * s8 * s8 * s8 * s8 * s8 * s8, s512 = s64 * s64 * s64 * s64 * s64 * s64 * s64 * s64;
    c += uSunCol * (s8 * .07 + s64 * .16 + s512 * .4);
    c += uSunCol * disc * 9. * smoothstep(.99962, .99978, sd);
    // thin high cirrus
    vec2 p = d.xz / (h + .3);
    float cir = smoothstep(.52, .78, skyTex(p * vec2(.08, .21) + vec2(uSkyTime * .0012, 0.)).a * .6 + n * .4) * smoothstep(.1, .45, h);
    c = mix(c, mix(uHor, vec3(1.), .55) + uSunCol * .12, cir * .3);
    return mix(c, uLow, smoothstep(0., -.12, d.y));
  }
  // the cloud seen from under it
  vec3 stormSky(vec3 d, float n) {
    float h = clamp(d.y, 0., 1.);
    vec3 c = mix(uCloudDark, uCloudBelly, smoothstep(.25, .8, n));
    c = mix(c, uEye, smoothstep(.45, .95, h) * (.45 + .55 * n));
    // the dimmed sun: a pale silver coin behind the cloud
    float sd = clamp(dot(d, uSunDir), 0., 1.);
    float s2 = sd * sd, s8 = s2 * s2 * s2 * s2, s64 = s8 * s8 * s8 * s8 * s8 * s8 * s8 * s8;
    c += vec3(.82, .88, .92) * ((smoothstep(.99915, .9994, sd) * .8 + s64 * s64 * s64 * .16) * (.45 + .55 * n) + s8 * .05);
    // soft glows inside the cloud, each on its own turn (eased; never a bolt)
    for (int k = 0; k < 3; k++) {
      float q = uSkyTime / uGlowT[k] + uGlowPh[k], id = floor(q), f = q - id, hs = id + uGlowPh[k] * 57.;
      float a = hash1(hs) * 6.2832, el = .22 + .5 * hash1(hs * 1.7 + 3.1);
      vec3 g = vec3(sin(a) * cos(el), sin(el), -cos(a) * cos(el));
      float gd = clamp(dot(d, g), 0., 1.), g2 = gd * gd, g8 = g2 * g2 * g2 * g2;
      float env = smoothstep(0., .12, f) * (1. - smoothstep(.12, .6, f)) * step(.4, hash1(hs * 2.3 + 1.));
      c += vec3(.62, .74, .82) * (g8 * g2 * env * .55 * (.4 + .6 * n));
    }
    return mix(c, uCloudDark * .9, smoothstep(0., -.1, d.y));
  }
  // the bank's height at r metres along the ridge's line from the knoll
  float bankTop(float r) { return uEdge.z * (1. - .55 * smoothstep(0., 200., r)) * (1. - .8 * smoothstep(240., 640., abs(r))); }
  // The lumps on a lobe of the bank: rounded domes with creases between them, some 0.45 and 0.2 of its radius across,
  // by the direction n from the lobe's middle; they crawl on the world's clock.
  float lobeLump(vec3 n, float id) {
    float w = uSkyTime * .013 + id * 2.4;
    return .17 * abs(sin(n.x * 6.3 + w + .6 * sin(n.z * 5. + id)) * sin(n.y * 6.3 + id * 1.7 + .6 * sin(n.x * 5. - w))) + .07 * abs(sin(n.z * 13. - w * 1.3) * sin((n.y + n.x) * 11. + id * .9));
  }
  vec3 skyAt(vec3 d, float disc) {
    vec2 p = d.xz / (max(d.y, 0.) + .28);
    float n = skyN(p * .11 + vec2(uSkyTime * .003, uSkyTime * .0017));
    // metres north of the cloud's edge (negative: under the cloud), and how far the ray leans north
    float nE = dot(uAt.xz - uKn, uNd) - uEdge.x, dn = dot(d.xz, uNd);
    float t = abs(nE) / max(abs(dn), .02), yh = uAt.y + t * d.y;
    // where along the edge the ray meets it, for the tearing of skirt and top
    float rh = dot(uAt.xz + d.xz * t - uKn, vec2(-uNd.y, uNd.x));
    vec4 e1 = skyTex(vec2(rh * .0031 + uSkyTime * .0016, yh * .0026 - uSkyTime * .0007));
    float skirt = uEdge.y * (.55 + 1.1 * e1.a);
    float under = 1. - smoothstep(-12., 12., nE + (n - .5) * 16.);
    // from under: clear below the skirt, towards the island
    float seenUnder = 1. - step(0., dn) * (1. - smoothstep(skirt * .7, skirt * 1.3, yh));
    // FROM OUTSIDE, towards the sea, the sight ray is laid against the bank's lobes (uBank: each a ball in the bank's
    // own frame: metres along the ridge's line from the knoll, height, metres in from the cloud's edge; its radius),
    // lumped by lobeLump and frayed at its outline into tufts of 6 to 11 m; the nearest it meets is the one seen
    vec2 bq = uAt.xz - uKn, dp = vec2(dot(d.xz, uRd), -dn); float t1 = max(nE, 0.) / max(-dn, .02);
    vec3 bo = vec3(dot(bq, uRd), uAt.y, -nE), bd = vec3(dp.x, d.y, dp.y);
    vec4 wn = skyTex(vec2(rh * .011 + uSkyTime * .0026, yh * .011 - uSkyTime * .0011)); float tuft = .2 * smoothstep(.5, .85, wn.g) - .04 + .06 * (wn.r - .5);
    float tB = 1e5, lobeA = 0., idB = 0., rB = 1.; vec3 cB = vec3(0., -1., 0.);
    for (int i = 0; i < ${NBANK}; i++) {
      vec3 oc = uBank[i].xyz - bo; float tc = dot(oc, bd); vec3 pp = bd * tc - oc;
      float d2 = dot(pp, pp), R = uBank[i].w * (1. + lobeLump(pp * inversesqrt(max(d2, 1e-4)), float(i)) + tuft), in2 = R * R - d2, th = tc - sqrt(max(in2, 0.));
      float sel = step(0., in2) * step(0., th) * step(th, tB);
      lobeA = max(lobeA, smoothstep(0., .12 * R * R, in2) * step(0., th));
      tB = mix(tB, th, sel); cB = mix(cB, uBank[i].xyz, sel); rB = mix(rB, R, sel); idB = mix(idB, float(i), sel);
    }
    // (the place met: which way its lobe's face looks, how near another lobe stands to it, and whether one stands between it and the sun)
    float sunL = length(uSunDir.xz); vec2 sunP = vec2(dot(uSunDir.xz, uRd), -dot(uSunDir.xz, uNd));
    vec3 pS = bo + bd * min(tB, 3000.), nS = (pS - cB) / max(rB, 1.), sun3 = vec3(sunP.x, uSunDir.y, sunP.y); float occ = 1., shd = 0.;
    for (int i = 0; i < ${NBANK}; i++) {
      vec3 oc = uBank[i].xyz - pS; float R = uBank[i].w, other = step(.5, abs(float(i) - idB)), tc = dot(oc, sun3), l2 = dot(oc, oc);
      occ = min(occ, mix(1., clamp((sqrt(l2) - R) / (R * .45), 0., 1.), other));
      shd = max(shd, other * step(0., tc) * (1. - smoothstep(.55 * R * R, 1.1 * R * R, l2 - tc * tc)));
    }
    // (behind the heads the storm's own body stands as a level roof, 160 m in from its edge at four to five and a half
    // tenths of the bank's height, its top lumped by 13 m up and down and lit along its brow)
    float tR = t1 + 160. / max(-dn, .02), yR = uAt.y + tR * d.y, rR = bo.x + dp.x * tR, roofTop = bankTop(rR) * (.4 + .15 * skyTex(vec2(rR * .0031 - uSkyTime * .0006, .37)).r) + 26. * (wn.a - .5);
    float roofA = 1. - smoothstep(roofTop - 7., roofTop + 7., yR + 16. * (wn.b - .5)), bank = 1. - (1. - lobeA) * (1. - roofA);
    // (its skirt is lower as the bank is lower, and lower again along the ridge)
    float rE = bo.x + dp.x * t1, sk = skirt * bankTop(rE) / max(uEdge.z, 1.) * (1. - .55 * smoothstep(0., 200., rE)), veil = 1. - smoothstep(sk * .8, sk * 1.6, yh);
    float seenOut = step(dn, 0.) * max(bank, veil);
    float cover = mix(seenOut, seenUnder, under);
    vec3 clr = clearSky(d, n, disc * (1. - cover));
    clr = mix(clr, uStrip * (.8 + .4 * n), under * .72 * smoothstep(.3, -.02, d.y));
    // the bank from outside in the going storm's light: a lobe's face toward the sun cream, toward its shade's edge
    // gold, the higher the brighter; its lee, its creases, what another lobe shades and what stands low blue-black;
    // the level roof behind dark; the storm's soft glows at their places of it
    float lmp = lobeLump(nS, idB), fold = smoothstep(0., .07, lmp), lam = dot(nS, sun3) + 5. * (lmp - lobeLump(normalize(nS + sun3 * .14), idB)), hgt = clamp(pS.y / max(bankTop(pS.x), 1.), 0., 1.);
    float light = smoothstep(-.3, .95, lam) * (1. - .85 * shd) * (.5 + .5 * occ) * (.5 + .5 * smoothstep(.05, .5, hgt)) * (.5 + .5 * fold);
    float amb = (.3 + .7 * (.5 + .5 * nS.y)) * (.45 + .55 * occ) * (1. - .4 * shd) * (.5 + .5 * hgt) * (.45 + .55 * fold) * (.8 + .4 * wn.b);
    vec3 litC = mix(mix(uSunCol, vec3(1., .7, .38), .5), mix(vec3(1., .9, .72), uSunCol, .4), smoothstep(.15, .85, lam)) * .88;
    vec3 wall = mix(mix(uCloudDark * .7, uCloudBelly * 1.15, clamp(amb, 0., 1.)), litC, light) * (.86 + .28 * wn.g) * lobeA + (1. - lobeA) * mix(mix(uCloudDark * .7, uCloudBelly, clamp(.15 + .35 * clamp(yR / max(roofTop, 1.), 0., 1.) + .5 * (wn.a - .5) + .3 * (wn.b - .5), 0., 1.)), litC * .7, smoothstep(roofTop - 22., roofTop - 2., yR) * (.25 + .5 * wn.g));
    for (int k = 0; k < 3; k++) {
      float q = uSkyTime / uGlowT[k] + uGlowPh[k], id = floor(q), f = q - id, hs = id + uGlowPh[k] * 57.;
      float gr = mix(-260., 480., hash1(hs));
      vec2 dg = (mix(vec2(rR, yR), pS.xy, lobeA) - vec2(gr, bankTop(gr) * (.25 + .4 * hash1(hs * 1.7 + 3.1)))) / vec2(90., 60.);
      wall += vec3(.62, .74, .82) * (exp(-min(dot(dg, dg), 30.)) * smoothstep(0., .12, f) * (1. - smoothstep(.12, .6, f)) * step(.4, hash1(hs * 2.3 + 1.)) * .5);
    }
    // under its skirt the rain falls in slanting sheets, the sun in them
    float sheets = skyTex(vec2(rh * .012 + yh * .006 + uSkyTime * .021, yh * .0016 + rh * .0007)).g;
    vec3 rain = mix(uCloudDark * .8, uCloudBelly * .95, sheets * .6) + uSunCol * (.06 * smoothstep(.55, .9, sheets));
    wall = mix(wall, rain, veil);
    vec3 cl = mix(wall, stormSky(d, n), under);
    // her fire in the rain and on the cloud's belly over her: a glow that stands where she is
    vec3 toShip = uShipAt - uAt; float sdist = length(toShip); toShip /= max(sdist, 1.);
    float ga = 1. - clamp(dot(d, toShip), -1., 1.), gw = clamp(5000. / (sdist * sdist + 1.), .004, .12);
    float flick = .8 + .2 * skyTex(vec2(uSkyTime * .09, .33)).r;
    cl += uGlowCol * (exp(-ga / gw) * flick * (.22 + .5 * smoothstep(60., 320., sdist)));
    float edge = cover * (1. - cover) * 4.;
    return mix(clr, cl, cover) + uSunCol * (edge * edge * edge * .1 * (1. - under));
  }
  // For a thing that stands in the clear, dist metres off along d: how much of the storm stands between it and the eye.
  // The skirts hide what the slab above hides of the sky; the rain veils the rest by the metres of storm the sight crosses.
  float stormVeil(vec3 d, float dist) {
    vec2 p = d.xz / (max(d.y, 0.) + .28);
    float n = skyN(p * .11 + vec2(uSkyTime * .003, uSkyTime * .0017));
    float nE = dot(uAt.xz - uKn, uNd) - uEdge.x, dn = dot(d.xz, uNd);
    float t = abs(nE) / max(abs(dn), .02), yh = uAt.y + t * d.y;
    float rh = dot(uAt.xz + d.xz * t - uKn, vec2(-uNd.y, uNd.x));
    float skirt = uEdge.y * (.55 + 1.1 * skyTex(vec2(rh * .0031 + uSkyTime * .0016, yh * .0026 - uSkyTime * .0007)).a);
    float under = 1. - smoothstep(-12., 12., nE + (n - .5) * 16.);
    float open = step(0., dn) * (1. - smoothstep(skirt * .7, skirt * 1.3, yh)), wet = min(t, dist) * .0036;
    return under * (1. - open * exp(-wet * wet));
  }`;
const SKY_VERT = /* glsl */`
  varying vec3 vDir;
  void main() {
    vDir = position;
    vec4 p = projectionMatrix * viewMatrix * vec4(position + cameraPosition, 1.);
    if (abs(p.w) < 1e-4) p.w = 1e-4;
    gl_Position = p.xyww;
  }`;
const SKY_FRAG = SKY_GLSL + /* glsl */`
  varying vec3 vDir;
  void main() { gl_FragColor = vec4(skyAt(normalize(vDir), uDisc), 1.); }`;

// ---------------------------------------------------------------- the sea: one sheet for the storm, the calm cove and the lip on the sands
// A ring grid worn by the eye; waves are sums of trochoids whose height follows the storm's field at the water's own
// place and dies in shallow and sheltered water. It is drawn after everything solid and is clear in the shallows over the
// sands, so the sand ribs show through it.
// (NLANE: the flames of the lane; each lays its own light on the water under it)
const NWAVE = 6, NCAP = 11, NROCK = 12, NLANE = 12, NSTAND = 12;
const SEA_VERT = STORM_GLSL + /* glsl */`
  uniform float uTime; uniform vec4 uWave[${NWAVE}]; uniform float uCalmK[${NWAVE}];
  uniform sampler2D uDepth; uniform vec4 uDepthRect; uniform vec4 uBeach;
  uniform vec4 uSwell;
  varying vec3 vW; varying vec2 vP; varying float vAmp, vDepth, vH;
  #include <fog_pars_vertex>
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.);
    vP = wp.xz;
    // the depth of the water and the shelter of the cove, baked over the island; beyond the map the sea is deep and open
    vec2 duv = (wp.xz - uDepthRect.xy) * uDepthRect.zw;
    float inMap = step(0., duv.x) * step(duv.x, 1.) * step(0., duv.y) * step(duv.y, 1.);
    vec4 dt = texture2D(uDepth, clamp(duv, 0., 1.));
    float depth = mix(30., dt.r, inMap);
    float along = dot(wp.xz - uBeach.xy, uBeach.zw);
    vDepth = depth;
    float amp = smoothstep(.15, 8., depth) * mix(1., dt.g, inMap);
    vAmp = amp;
    vec3 disp = vec3(0.);
    // the weather of this water's own place
    float st = stormF(wp.xz), st2 = st * st;
    for (int i = 0; i < ${NWAVE}; i++) {
      float k = uWave[i].z, ph = dot(uWave[i].xy, wp.xz) * k - sqrt(9.81 * k) * uTime + float(i) * 1.7;
      float a = uWave[i].w * amp * (st2 + uCalmK[i] * (1. - st2));
      disp.y += a * sin(ph); disp.xz += uWave[i].xy * (a * .75 * cos(ph));
    }
    // the swash: the thin edge of the water slides up the sand and draws back, each stretch of shore in its own time
    float sw = .1 * sin(uTime * .62 - along * ${SWASH_K}) + .045 * sin(uTime * 1.13 + along * .11);
    disp.y += sw * (1. - smoothstep(.3, 2.5, depth)) * (1. - st);
    // the long low swell that comes in through the mouth and dies in the shallows (uSwell: heading, wave number, height)
    disp.y += uSwell.w * sin(dot(uSwell.xy, wp.xz) * uSwell.z - sqrt(9.81 * uSwell.z) * uTime) * smoothstep(.3, 3., depth) * (1. - st);
    vH = disp.y;
    wp.xyz += disp;
    vW = wp.xyz;
    vec4 mvPosition = viewMatrix * wp;
    gl_Position = projectionMatrix * mvPosition;
    #include <fog_vertex>
  }`;
const SEA_FRAG = SKY_GLSL + /* glsl */`
  uniform float uTime; uniform vec4 uWave[${NWAVE}]; uniform float uCalmK[${NWAVE}];
  uniform vec3 uDeep, uCrest, uFoamCol, uCalmCol, uShallowCol, uFireCol, uCapLit, uCapBelly; uniform vec4 uFire[${6 + NLANE}], uSwell, uCap[${NCAP}], uBeach, uRock[${NROCK}]; uniform vec3 uRockAx[${NROCK}]; uniform float uCapTop[${NCAP}]; uniform vec4 uStand[${NSTAND}]; uniform float uStandY[${NSTAND}]; uniform vec3 uStandCol[6];
  uniform vec4 uRing[4]; uniform vec2 uWind; uniform sampler2D uDepth, tDetail; uniform vec4 uDepthRect, uTCloud; uniform vec3 uLandLow, uLandHigh;
  varying vec3 vW; varying vec2 vP; varying float vAmp, vDepth, vH;
  #include <fog_pars_fragment>
  // how high the land (with what grows on it) stands over the water at a place; nothing beyond the baked map
  float landUp(vec2 p) {
    vec2 uv = (p - uDepthRect.xy) * uDepthRect.zw;
    return texture2D(uDepth, clamp(uv, 0., 1.)).b * step(0., uv.x) * step(uv.x, 1.) * step(0., uv.y) * step(uv.y, 1.);
  }
  void main() {
    float st = stormF(vP), st2 = st * st, amp = clamp(vAmp, 0., 1.);
    // the slope of the same waves, taken at this pixel
    vec2 g = vec2(0.); float crest = 0.;
    for (int i = 0; i < ${NWAVE}; i++) {
      float k = uWave[i].z, ph = dot(uWave[i].xy, vP) * k - sqrt(9.81 * k) * uTime + float(i) * 1.7;
      float a = uWave[i].w * amp * (st2 + uCalmK[i] * (1. - st2));
      g += uWave[i].xy * (a * k * cos(ph)); crest += a * k * sin(ph);
    }
    float dist = length(vW - cameraPosition), far = smoothstep(120., 900., dist);
    // the swell's own slope (drawn three times as steep as it stands, so that the still water shows it in what it mirrors)
    g += uSwell.xy * (uSwell.w * uSwell.z * 3. * cos(dot(uSwell.xy, vP) * uSwell.z - sqrt(9.81 * uSwell.z) * uTime) * smoothstep(.3, 3., vDepth) * (1. - st));
    // small waves: crossing layers of ripples that keep their size in metres. Each is read smoothly between the noise's
    // texels and the layers lie turned against one another, so that still water never shows the noise's own weave
    vec2 rp = vP * .052 + uWind * uTime * .05, rq = vec2(.8 * rp.x - .6 * rp.y, .6 * rp.x + .8 * rp.y) * 2.7, rs3 = vec2(.47 * vP.x + .88 * vP.y, -.88 * vP.x + .47 * vP.y) * .31;
    vec3 r1 = skyTex(rp).rgb, r2 = skyTex(rq - uWind.yx * uTime * .08).rgb, r3 = skyTex(rs3 + uWind * uTime * .16).rgb;
    float breeze = smoothstep(.46, .7, texture2D(uNoise, vP * .0052 + uWind * uTime * .006).a * .7 + r1.b * .3) * (1. - st);
    float chop = mix(.035 + .3 * breeze, 1., st) * mix(1., .25, far) * (.25 + .75 * amp) + .02;
    // (the finest ripples, a hand to a foot across, belong to wind: the storm's and a cat's-paw's. Still water carries
    // only the broad ones, so its face is never a weave of small cells)
    float wild = max(st, breeze);
    g += ((r1.rg - .5) * 1.1 + (mix(r2.rg, r2.gb, wild) - .5) * .7 + (r3.br - .5) * .5 * (1. - far) * wild) * chop;
    // rings where fish rise on the still water
    for (int i = 0; i < 4; i++) {
      vec2 dv = vP - uRing[i].xy; float rr = length(dv), age = uRing[i].z, front = age * 1.5;
      float w = sin((rr - front) * 5.) * exp(-abs(rr - front) * 1.4) * uRing[i].w / (1. + age);
      g += dv / max(rr, .05) * w * .12;
    }
    vec3 n = normalize(vec3(-g.x, 1., -g.y));
    vec3 v = normalize(cameraPosition - vW);
    float nv = clamp(dot(n, v), 0., 1.), f1 = 1. - nv, fres = .02 + .98 * f1 * f1 * f1 * f1 * f1;
    vec3 r = reflect(-v, n); r.y = abs(r.y) + .02; r = normalize(r);
    vec3 sky = skyAt(r, 0.);
    // the pageant in still water: each great building and the globe as an upright body of cloud (place, reach, foot, top)
    // (still: 1 on still water, 0 wherever more than an eighth of the storm stands over the water; and the mirror's
    // law is for an eye that is not under the cloud: from under it the far still water keeps the law it had, as the
    // dome keeps the storm's sky there, the one passing into the other over the same 24 m across the cloud's edge)
    float calm = 1. - st, still = (1. - smoothstep(0., .12, st)) * smoothstep(-12., 12., dot(uAt.xz - uKn, uNd) - uEdge.x);
    if (calm > .01) {
      float rl = max(dot(r.xz, r.xz), 1e-4);
      for (int i = 0; i < ${NCAP}; i++) {
        vec2 dc = uCap[i].xy - vP; float t = max(dot(dc, r.xz) / rl, 0.), y = r.y * t, d = length(dc - r.xz * t), y0 = uCap[i].w, y1 = uCapTop[i];
        float m = (1. - smoothstep(uCap[i].z * .7, uCap[i].z * 1.25, d)) * smoothstep(y0 - 15., y0 + 15., y) * (1. - smoothstep(y1 - 50., y1 + 20., y));
        // (in STILL water each stands whole and clear: its head as wide as its reach for half that reach up from its
        // foot, over it the building half as wide, narrowing to a quarter of the reach at its top; its outline sharp)
        float hh = y0 + .5 * uCap[i].z, wide = uCap[i].z * mix(1., mix(.5, .25, smoothstep(hh, y1, y)), smoothstep(hh - 10., hh + 10., y));
        m = mix(m, (1. - smoothstep(wide * .88, wide * 1.06, d)) * smoothstep(y0 - 5., y0 + 5., y) * (1. - smoothstep(y1 - 24., y1 + 6., y)), still);
        sky = mix(sky, mix(uCapBelly, uCapLit, smoothstep(y0, y0 + .22 * (y1 - y0), y)), m * calm * mix(.85, .96, still));
      }
    }
    // still water mirrors its shores: what the mirrored line of sight meets within 200 m (dunes, woods, the limes)
    vec2 rd = normalize(r.xz + vec2(1e-5, 0.)); float rs = r.y / max(length(r.xz), 1e-3);
    float h1 = landUp(vP + rd * 8.), h2 = landUp(vP + rd * 18.), h3 = landUp(vP + rd * 36.), h4 = landUp(vP + rd * 70.), h5 = landUp(vP + rd * 120.), h6 = landUp(vP + rd * 200.);
    float l1 = smoothstep(0., 1.5, h1 - rs * 8.), l2 = smoothstep(0., 1.5, h2 - rs * 18.), l3 = smoothstep(0., 2., h3 - rs * 36.), l4 = smoothstep(0., 3., h4 - rs * 70.), l5 = smoothstep(0., 4., h5 - rs * 120.), l6 = smoothstep(0., 5., h6 - rs * 200.);
    float land = max(max(max(l1, l2), max(l3, l4)), max(l5, l6)), ltop = max(max(max(h1 * l1, h2 * l2), max(h3 * l3, h4 * l4)), max(h5 * l5, h6 * l6));
    sky = mix(sky, mix(uLandLow, uLandHigh, smoothstep(2.5, 9., ltop)) * (.8 + .4 * r1.g), land * (1. - st) * .88);
    // what stands in the still water or at its edge is doubled in it: the inner water's rocks and the cloven pine, each
    // an upright round body (uStand: its place, half-width and half-height; uStandY: the height of its middle;
    // uStandCol: 0 the rocks' colour, 1 the pine's, 2 to 5 the colours of the strand's four stones in places 8 to 11;
    // a place nothing fills has no width and is not drawn)
    { float rl = max(dot(r.xz, r.xz), 1e-4);
      for (int i = 0; i < ${NSTAND}; i++) {
        vec2 dc = uStand[i].xy - vP; float t = max(dot(dc, r.xz) / rl, 0.), d = length(dc - r.xz * t) / max(uStand[i].z, .01), y = (r.y * t - uStandY[i]) / max(uStand[i].w, .01);
        sky = mix(sky, (i < 2 ? uStandCol[1] : i < 8 ? uStandCol[0] : uStandCol[max(i - 6, 0)]) * (.7 + .5 * r1.g), (1. - smoothstep(.8, 1.05, sqrt(d * d + y * y))) * still * .92 * step(1e-3, uStand[i].z));
      } }
    // the body of the water: storm green with translucent crests, or the calm cove with the morning in it
    float hN = clamp(vH / 4.2, -1., 1.);
    // (faces that lean towards the eye show the deep green; backs and crests take the light)
    float face = clamp(dot(g, normalize(v.xz + vec2(1e-5, 0.))) * 1.6, -1., 1.);
    vec3 body = mix(uCalmCol, uDeep * (.62 + .45 * hN - .3 * face), st) * (.75 + .25 * (1. - st));
    // cat's-paws: where a breath of wind crosses the still water it lies darker and bluer
    body = mix(body, uCalmCol * vec3(.55, .8, 1.25), breeze * .5);
    body = mix(uShallowCol, body, smoothstep(0., 3.5, vDepth) * .85 + .15 * st);
    float thin = smoothstep(.42, 1., hN * .8 + crest * .9) * st;
    body += uCrest * thin * (.2 + .5 * clamp(1. - nv * 1.3, 0., 1.));
    float deepK = mix(.45, 1., smoothstep(0., 2.2, vDepth));
    // the cloud shadows that drift over the land lie on the water too (the same field in world metres)
    float shadow = uTCloud.w * smoothstep(.46, .66, texture2D(tDetail, vP * uTCloud.z + uTCloud.xy).r) * (1. - st);
    body *= 1. - .55 * shadow;
    // STILL WATER IS A MIRROR: at a grazing sight it gives back nearly all of what stands over it, and its bed's
    // colour shows only where the sight goes steeply down (over deep water from 15 degrees down, wholly from 50; in
    // the clear shallows from 7 degrees, wholly from 30) and where the water thins to nothing at its lip. The storm's
    // sea keeps its own law.
    float mir = mix(1. - smoothstep(.12, .5, nv), 1. - smoothstep(.25, .78, nv), smoothstep(.5, 2.5, vDepth)) * smoothstep(0., .1, max(vDepth + vH, 0.));
    float give = mix(clamp(fres + .04, 0., 1.) * mix(.92, .75, st) * (1. - .42 * breeze) * deepK, mir * (1. - .42 * breeze), still);
    vec3 col = mix(body, sky, give);
    // the sun's road, and the fire's roads wavering on the wave faces
    float sd = clamp(dot(r, uSunDir), 0., 1.), s4 = sd * sd * sd * sd, s16 = s4 * s4 * s4 * s4, s64 = s16 * s16 * s16 * s16;
    col += uSunCol * (s64 * s64 * 2.2 + s64 * .22) * (1. - .8 * st) * (1. - shadow);
    // SUN AND SHADE ON THE STILL WATER: pools some 13 to 60 m across (their middle size 32 m) that drift on the world's
    // clock (the land's cloud field, read two and a half times finer). In a pool of shade what the water gives back is dimmer and cooler; in the sun its small
    // faces glitter, most toward the sun's own bearing.
    float pools = smoothstep(.42, .6, texture2D(tDetail, vP * (uTCloud.z * 2.5) + uTCloud.xy * 2.3 + .37).r) * still;
    col *= mix(vec3(1.), vec3(.7, .76, .84), pools);
    float glit = smoothstep(.86, .96, texture2D(uNoise, vP * .9 + uWind * uTime * .05).g * .5 + texture2D(uNoise, vP * 1.7 - uWind.yx * uTime * .08).r * .5);
    col += uSunCol * (glit * (1. - pools) * still * (.1 + .6 * s4));
    for (int i = 0; i < ${6 + NLANE}; i++) {
      vec3 L = uFire[i].xyz - vW; float d2 = dot(L, L); vec3 l = L * inversesqrt(max(d2, 1e-3));
      float c = clamp(dot(r, l), 0., 1.), c4 = c * c * c * c, c16 = c4 * c4 * c4 * c4;
      col += uFireCol * (uFire[i].w * (c16 * c16 * .9 + c4 * .05) / (1. + d2 / 2600.));
      col += uFireCol * body * (uFire[i].w * .3 / (1. + d2 / 500.));
    }
    // foam: born on breaking crests, ageing into lace behind them; and a white lip where the water ends on the sand
    float lace = texture2D(uNoise, vec2(dot(vP, uWind) * .022, dot(vP, vec2(-uWind.y, uWind.x)) * .06) + uTime * .01).g * .6 + r3.g * .4;
    float born = smoothstep(.62, .98, crest * 1.1 + hN * .4 + (lace - .5) * .55) * st;
    float old = smoothstep(.7, .9, lace + hN * .3) * smoothstep(.2, .9, st) * .28;
    // (the water's own thickness here and now: the swash carries its edge up the sand and back)
    float thick = max(vDepth + vH, 0.);
    // the waterline is a lace of foam, never a band: fine threads in the last hand's depth of water, thickest as the
    // swash runs up its own stretch of shore, thinning as it draws back and sinks into the sand
    float along = dot(vP - uBeach.xy, uBeach.zw), rush = .5 + .5 * cos(uTime * .62 - along * ${SWASH_K});
    float fine = texture2D(uNoise, vP * .83 + uWind * uTime * .013).g * .55 + texture2D(uNoise, vP * 2.1 - uWind.yx * uTime * .02).r * .45;
    float shoal = 1. - smoothstep(.0, .1, thick);
    float lip = shoal * smoothstep(.62 - .3 * rush * shoal, .86 - .2 * rush * shoal, fine + .25 * shoal) * (.45 + .4 * rush) * (1. - st);
    // (on still water the very edge is a bright line of that lace, half a metre wide, going up the sand and back with the swash)
    lip = max(lip, (1. - smoothstep(.008, .024, thick)) * (.5 + .5 * fine) * (.65 + .35 * rush) * still);
    float surf = (1. - smoothstep(.2, 2.6, vDepth)) * smoothstep(.4, .7, lace + .25 * sin(uTime * .9 + vP.x * .07)) * (.06 + .94 * st);
    // surf round each sea rock: a ring of foam about its waterline that the surge widens and draws in (uRock: place,
    // radius, strength; uRockAx: its long axis and how long)
    float ring = 0.;
    for (int i = 0; i < ${NROCK}; i++) {
      vec2 dr = vP - uRock[i].xy; float al = dot(dr, uRockAx[i].xy), ac = dot(dr, vec2(-uRockAx[i].y, uRockAx[i].x));
      float d = length(vec2(al / uRockAx[i].z, ac * sqrt(uRockAx[i].z))) / uRock[i].z;
      ring = max(ring, (1. - smoothstep(1.05, 1.5 + .22 * sin(uTime * .9 + float(i) * 2.1), d + (lace - .5) * .5)) * uRock[i].w);
    }
    float foam = clamp(max(max(born, old), max(max(lip, surf), ring * smoothstep(.2, .5, lace + .12))), 0., 1.);
    vec3 fcol = uFoamCol * (.38 + .5 * clamp(n.y * .5 + dot(n, uSunDir) * .6, 0., 1.) * (1. - .6 * st) + .3 * st) ;
    col = mix(col, fcol + uSunCol * .12 * (1. - st), foam);
    // clear in the shallows, so the sand's ribs show through
    float alpha = clamp(max(max(mix(.16, 1., smoothstep(0., 1.8, thick)), max(fres * .8 * deepK, give * still)), foam), 0., 1.);
    gl_FragColor = vec4(col, alpha);
    #include <fog_fragment>
  }`;

// the hours the island can have (its night is the golden hour: the storm stays bright)
const HOURS = {
  any: { el: 20, sun: '#ffd9a0', sunI: 3.2, zen: '#3b78c8', hor: '#f0d3a8', lit: '#f3ead6', shade: '#8f8fb8', hollow: '#5d5f86', hemi: '#9fc4e6', calm: '#7fb6b0' },
  dawn: { el: 9, sun: '#ffc09a', sunI: 2.9, zen: '#4a74b8', hor: '#f6c7a4', lit: '#f8e2d0', shade: '#8f86b4', hollow: '#5e5a86', hemi: '#a8bfe0', calm: '#8fb4b4' },
  day: { el: 26, sun: '#fff0d0', sunI: 3.3, zen: '#2f74d2', hor: '#dfe4e0', lit: '#f6f3ea', shade: '#8a9cc8', hollow: '#5a6a98', hemi: '#a4cbee', calm: '#6fb2bc' },
  golden: { el: 12, sun: '#ffbe6a', sunI: 3.1, zen: '#3f6fb4', hor: '#f4c489', lit: '#f6d8ae', shade: '#8c80b2', hollow: '#5c5684', hemi: '#a2b8dc', calm: '#86b0a6' },
};

export default {
  id: 'storm-that-drowned-no-one',
  name: 'The Storm That Drowned No One',
  category: 'books',
  placeKind: 'ocean',
  book: 'The Tempest',
  author: 'William Shakespeare, 1564 to 1616',
  media: ['air', 'open'],
  weirdness: 0.5,
  async build(ctx) {
    const seed = ctx.seed, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const density = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare;
    const hourName = HOURS[vary.hour] ? vary.hour : vary.hour === 'night' ? 'golden' : 'any', HOUR = HOURS[hourName];
    // every stream of chance this world draws from, each under a name of its own
    const fork = (name) => makeRng(hashSeed('storm:' + name + ':' + seed));
    const R = { birds: fork('birds'), bow: fork('bow'), cell: fork('cell'), cleft: fork('cleft'), clothes: fork('clothes'), conifers: fork('conifers'),
      corn: fork('corn'), dancers: fork('dancers'), ferns: fork('ferns'), fleet: fork('fleet'), grove: fork('grove'), gulls: fork('gulls'), hero: fork('hero'),
      lane: fork('lane'), leaders: fork('leaders'), marram: fork('marram'), melt: fork('melt'), mist: fork('mist'), motes: fork('motes'),
      rain: fork('rain'), rare: fork('rare'), reefs: fork('reefs'), rings: fork('rings'), sands: fork('sands'), sea: fork('sea'),
      sheep: fork('sheep'), shrooms: fork('shrooms'), skerries: fork('skerries'), sky: fork('sky'), spray: fork('spray'), steps: fork('steps'), terrain: fork('terrain'),
      vines: fork('vines'), wisps: fork('wisps'), woods: fork('woods'), ears: fork('ears'), hedges: fork('hedges'),
      // the pageant, a stream to each set (and, below, one to each cumulus head: fork('head-' + its tag))
      flanks: fork('flanks'), third: fork('third'), slender: fork('slender'), colonnade: fork('colonnade'), great: fork('great'),
      // one to each flock, to each bundle of shafts, and to each tree form the kit draws
      flockKnoll: fork('flock-knoll'), flockShip: fork('flock-ship'), flockColumn: fork('flock-column'), flockPier: fork('flock-pier'), flockRound: fork('flock-round'),
      beamFlanks: fork('beam-flanks'), beamColonnade: fork('beam-colonnade'), beamCorn: fork('beam-corn'),
      conifers2: fork('conifers2'), leaders2: fork('leaders2'), lamp: fork('lamp'), windows: fork('windows'),
      // the limes' crowns and boles, the wood's undergrowth, its litter, and the sun's shafts through the roof's gaps
      crowns: fork('crowns'), boles: fork('boles'), undergrowth: fork('undergrowth'), litter: fork('litter'), sunshafts: fork('sunshafts'),
      // the inner water's rocks and the birds that sit on them; the brook's bed
      innerRocks: fork('inner-rocks'), rockBirds: fork('rock-birds'), brook: fork('brook'),
      // the way each field's rows run; the banks between fields
      rows: fork('rows'), banks: fork('banks'),
      // the heads of the storm's bank as it is seen from outside; what is set where the strand would be bare
      bank: fork('bank'), strand: fork('strand'),
      // the beds of the knoll's seaward cliff
      ledges: fork('ledges') };
    const isleNoise = makeNoise(hashSeed('storm-ground:' + seed));
    await ctx.yield();
    const planIt = planSteps(seed, vary); let planned = planIt.next();
    while (!planned.done) { await ctx.yield(); planned = planIt.next(); }
    const PL = planned.value, { MX, V, isle } = PL;
    await ctx.yield();
    const scene = new THREE.Scene();

    // ------------------------------------------------------------ the route: a curve through the plan's line, every 10 m
    const ctrl = []; for (let i = 0; i < PL.pts.length - 1; i += 5) ctrl.push(PL.pts[i]);
    ctrl.push(PL.pts[PL.pts.length - 1]);
    const path = makePath(ctrl), LEN = path.length, KS = LEN / PL.sAt[PL.sAt.length - 1];
    // (the curve is a hair shorter than the plan's line of chords: its marks are scaled by that)
    const m = {}; for (const k of Object.keys(PL.marks)) m[k] = PL.marks[k] * KS;
    await ctx.yield();
    // the storm's field at a place of the world as it lies (mirrored or not)
    const stormAt = (x, z) => isle.storm(x, z);
    const moodC = (a, b) => new THREE.Color(a).lerp(new THREE.Color(b), V.mood);
    const C = (hex) => new THREE.Color(hex);

    // ------------------------------------------------------------ sun, sky, light, fog
    const sunAz = 75 * MX, sunDir = new THREE.Vector3(Math.sin(sunAz * RAD) * Math.cos(HOUR.el * RAD), Math.sin(HOUR.el * RAD), -Math.cos(sunAz * RAD) * Math.cos(HOUR.el * RAD));
    const sunCol = C(HOUR.sun), fireColor = moodC('#cfeaff', '#dcd8ff');
    const cloudDark = moodC('#1b3338', '#2a2b40'), cloudBelly = moodC('#4d666b', '#5a5a78'), stormFog = moodC('#31494d', '#3c3f55');
    // the light of each weather: what falls under the cloud, and what falls in the clear
    const LIGHT = { sunStorm: C('#aab8c0'), skyStorm: moodC('#5f8088', '#70749a'), groundStorm: moodC('#24443e', '#2c3048'), skyClear: C(HOUR.hemi), groundClear: C('#c9a878') };
    const waterTint = C(HOUR.calm).multiplyScalar(0.85);
    const lightOf = (st) => {
      const sc = sunCol.clone().lerp(LIGHT.sunStorm, st).multiplyScalar(lerp(HOUR.sunI, 0.55, st) * 0.85);
      const sk = LIGHT.skyClear.clone().lerp(LIGHT.skyStorm, st).multiplyScalar(lerp(0.96, 1.36, st));
      const gr = LIGHT.groundClear.clone().lerp(LIGHT.groundStorm, st).multiplyScalar(lerp(0.66, 0.94, st));
      return { sun: new THREE.Vector3(sc.r, sc.g, sc.b), sky: new THREE.Vector3(sk.r, sk.g, sk.b), ground: new THREE.Vector3(gr.r, gr.g, gr.b) };
    };

    // ------------------------------------------------------------ the hero: the ship wearing fire in the storm, and her twin asleep in the nook
    const hero = await buildHero(ctx, { fireColor, rng: R.hero, glimmer: R.windows.range(0, TAU) });
    const noiseTex = hero.noiseTexture;
    hero.object.position.copy(PL.places.stormShip); hero.object.rotation.y = Math.PI - MX * PL.places.stormAz * RAD;
    scene.add(hero.object);
    const twin = hero.twin();
    twin.object.position.copy(PL.places.calmShip); twin.object.rotation.y = Math.PI - MX * PL.places.calmAz * RAD;
    scene.add(twin.object);
    // each ship is lit by the weather of her own place, for good
    for (const [L, st] of [[hero.light, stormAt(PL.places.stormShip.x, PL.places.stormShip.z)], [twin.light, stormAt(PL.places.calmShip.x, PL.places.calmShip.z)]]) {
      const l = lightOf(st); L.uSunDir.value.copy(sunDir); L.uSunCol.value.copy(l.sun); L.uSky.value.copy(l.sky); L.uGround.value.copy(l.ground); L.uWaterTint.value.set(waterTint.r, waterTint.g, waterTint.b);
    }
    await ctx.yield();
    const kn = new THREE.Vector2(KNOLL.x * MX, KNOLL.z), nd = new THREE.Vector2(ND[0] * MX, ND[1]);
    const shipGlowAt = PL.places.stormShip.clone().setY(46), skyPh = R.sky.range(0, 3600);
    // THE BANK'S HEADS: eight along the ridge's line, from 170 m to seaward of the knoll's middle to 610 m along the
    // ridge, each at a drawn place in its own stretch of 98 m. A head is four lobes: its crown, up to the head's drawn
    // share (0.62 to 1.02) of the bank's height there; a shoulder before it; a flank beside it; a foot low at the
    // front. No lobe, with its lumps and tufts (up to 1.45 of its radius), comes nearer the cloud's edge than 22 m: the
    // dome draws the bank only for an eye that is not under the cloud, and such an eye is never in a lobe.
    const bankLobes = [];
    { const bankTopAt = (r) => BANK_H * (1 - 0.55 * smoothstep(0, 200, r)) * (1 - 0.8 * smoothstep(240, 640, Math.abs(r)));
      for (let i = 0; i < NBANK / 4; i++) {
        const r0 = -170 + (i + R.bank.range(0.2, 0.8)) * 98, top = bankTopAt(r0) * R.bank.range(0.62, 1.02), R0 = clamp(top * 0.3, 20, 75), s0 = Math.max(R.bank.range(75, 115), R0 * 1.45 + 22);
        const R1 = R0 * R.bank.range(0.75, 0.95), R2 = R0 * R.bank.range(0.6, 0.85), R3 = R0 * R.bank.range(0.5, 0.7), side = R.bank.chance(0.5) ? 1 : -1;
        bankLobes.push(new THREE.Vector4(r0, top - R0, s0, R0),
          new THREE.Vector4(r0 + R.bank.range(-0.6, 0.6) * R0, top * R.bank.range(0.38, 0.5), Math.max(s0 - R.bank.range(25, 45), R1 * 1.45 + 22), R1),
          new THREE.Vector4(r0 + side * R.bank.range(0.7, 1.1) * R0, top * R.bank.range(0.3, 0.55), Math.max(s0 + R.bank.range(-20, 20), R2 * 1.45 + 22), R2),
          new THREE.Vector4(r0 - side * R.bank.range(0.3, 1) * R0, Math.max(top * R.bank.range(0.16, 0.26), R3 * 0.9), R3 * 1.45 + R.bank.range(22, 38), R3));
      } }
    const SU = {
      uSunDir: { value: sunDir }, uZen: { value: C(HOUR.zen) }, uHor: { value: C(HOUR.hor) }, uSunCol: { value: sunCol.clone() }, uLow: { value: C(HOUR.hor).lerp(C(HOUR.calm), 0.6) },
      uCloudDark: { value: cloudDark }, uCloudBelly: { value: cloudBelly }, uEye: { value: moodC('#7f9c9c', '#8c8cae') }, uStrip: { value: C('#e0b060').multiplyScalar(1.5) },
      uKn: { value: kn }, uNd: { value: nd }, uBand: { value: new THREE.Vector4(STORM.n0, STORM.n1, STORM.discN, STORM.r0) }, uDiscR: { value: STORM.r1 },
      uAt: { value: new THREE.Vector3(0, 25, 6) }, uEdge: { value: new THREE.Vector3(10, 30, BANK_H) }, uRd: { value: new THREE.Vector2(RD[0] * MX, RD[1]) }, uBank: { value: bankLobes }, uShipAt: { value: shipGlowAt }, uGlowCol: { value: fireColor.clone() },
      uGlowPh: { value: [R.sky.range(0, 1), R.sky.range(0, 1), R.sky.range(0, 1)] }, uGlowT: { value: [R.sky.range(2.6, 3.4), R.sky.range(3.4, 4.2), R.sky.range(4.2, 5)] }, uSkyTime: { value: 0 }, uDisc: { value: 1 }, uNoise: { value: noiseTex },
    };
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 20), new THREE.ShaderMaterial({ uniforms: SU, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false }));
    dome.renderOrder = -10; dome.frustumCulled = false; scene.add(dome);
    const sun = new THREE.DirectionalLight(sunCol, HOUR.sunI), hemi = new THREE.HemisphereLight(C(HOUR.hemi), C('#c9a878'), 1.45);
    sun.position.copy(sunDir).multiplyScalar(600); scene.add(sun, sun.target, hemi);
    const fogClear = C(HOUR.hor).lerp(C(HOUR.zen), 0.38);
    scene.fog = new THREE.FogExp2(stormFog.clone(), 0.0036);
    // what the eye wears: the scene's two lights and the fog follow the storm's field at the eye's own place
    const setWeather = (st) => {
      const k = st * st;
      sun.color.copy(sunCol).lerp(LIGHT.sunStorm, st); sun.intensity = lerp(HOUR.sunI, 0.55, st);
      hemi.color.copy(LIGHT.skyClear).lerp(LIGHT.skyStorm, st); hemi.groundColor.copy(LIGHT.groundClear).lerp(LIGHT.groundStorm, st); hemi.intensity = lerp(1.45, 6, st);
      scene.fog.color.copy(fogClear).lerp(stormFog, st); scene.fog.density = lerp(0.0007, 0.0036, k);
    };

    // ------------------------------------------------------------ the sea
    // six trochoids running before the wind (towards azimuth 335, mirrored with the island), spread by a draw
    const windAz = 335 * MX, waves = [], calmK = [];
    for (const [len, a, ck] of SEA_TRAINS) {
      const d = azDir(windAz + R.sea.range(-34, 34));
      waves.push(new THREE.Vector4(d[0], d[1], TAU / (len * R.sea.range(0.9, 1.1)), a)); calmK.push(ck);
    }
    // the water keeps a clock of its own: the world's, set on by a drawn offset (the waves, the swash, the lip the steps
    // follow, the gulls that ride it, and the wind's waves over the corn all read this one)
    const seaPh = R.sea.range(0, 120);
    // the same waves for whatever rides them (vertical part), by the storm's field at the place itself, as in the shader
    const seaHeightAt = (x, z, time) => {
      const st = stormAt(x, z), st2 = st * st, t = time + seaPh; let h = 0;
      for (let i = 0; i < NWAVE; i++) { const w = waves[i]; h += w.w * (st2 + calmK[i] * (1 - st2)) * Math.sin((w.x * x + w.y * z) * w.z - Math.sqrt(9.81 * w.z) * t + i * 1.7); }
      return h;
    };
    hero.heightAt = seaHeightAt;
    // a place given by the sands' line: a metres along it, c metres to its right
    const lineW = (a, c) => [MX * (isle.Q[0] + isle.hd[0] * a + isle.rt[0] * c), isle.Q[1] + isle.hd[1] * a + isle.rt[1] * c];
    // nearest metres from a place to the route between two of its metres (at every 2 m)
    const gp = new THREE.Vector3();
    // (THE LINE IS WALKED ONCE for each stretch that is asked about: its places at every 2 m from one of its metres to
    // another are kept, and whatever asks about the same stretch again reads them)
    const lineRuns = new Map();
    const lineRun = (s0, s1) => {
      const key = s0 + ':' + s1; let run = lineRuns.get(key);
      if (!run) { const pts = []; for (let sq = s0; sq <= s1; sq += 2) { path.posAtDist(sq, gp); pts.push(gp.x, gp.y, gp.z); } run = new Float64Array(pts); lineRuns.set(key, run); }
      return run;
    };
    const offLine = (x, z, s0, s1) => { const run = lineRun(s0, s1); let off = 1e9; for (let i = 0; i < run.length; i += 3) off = Math.min(off, Math.hypot(run[i] - x, run[i + 2] - z)); return off; };
    hero.object.updateMatrixWorld(true);
    const spritEnd = hero.anchors.bowspritEnd.clone().applyMatrix4(hero.object.matrixWorld);
    // THE LANE OF THE FLAMES: from her bowsprit end straight to the circle 10 m off the knoll's rock, round the knoll's
    // seaward side, in at the mouth, up the nook along the sleeping ship's keel line and up over her main truck
    const LANE = (() => {
      // (laid on the unmirrored island, then mirrored with it)
      const R0 = KNOLL.r + 10, kx = KNOLL.x, kz = KNOLL.z, pts = [];
      // the two tangents: from her bowsprit end on to the circle, and off it towards a point 60 m before the calm ship on her keel line
      const tangent = (px, pz, sign) => { const dx = px - kx, dz = pz - kz, d = Math.hypot(dx, dz); return Math.atan2(dz, dx) + sign * Math.acos(clamp(R0 / d, -1, 1)); };
      const cs = [PL.places.calmShip.x * MX, PL.places.calmShip.z], cd = azDir(PL.places.calmAz), far = [cs[0] + cd[0] * 60, cs[1] + cd[1] * 60], sp = [spritEnd.x * MX, spritEnd.z];
      const t0 = tangent(sp[0], sp[1], -1); let t1 = tangent(far[0], far[1], 1);
      while (t1 > t0) t1 -= TAU;
      const push = (x, z, y) => pts.push(new THREE.Vector3(x * MX, y, z));
      const a0 = [kx + R0 * Math.cos(t0), kz + R0 * Math.sin(t0)], a1 = [kx + R0 * Math.cos(t1), kz + R0 * Math.sin(t1)];
      const seg = (ax, az, bx, bz) => { const n = Math.max(1, Math.round(Math.hypot(bx - ax, bz - az) / 2)); for (let i = 0; i < n; i++) push(lerp(ax, bx, i / n), lerp(az, bz, i / n), 3); };
      seg(sp[0], sp[1], a0[0], a0[1]);
      { const n = Math.max(2, Math.round(Math.abs(t1 - t0) * R0 / 2)); for (let i = 0; i < n; i++) { const t = lerp(t0, t1, i / n); push(kx + R0 * Math.cos(t), kz + R0 * Math.sin(t), 3); } }
      seg(a1[0], a1[1], far[0], far[1]);
      // the last 60 m climb to 4 m over her main truck
      const mast = [cs[0] + cd[0] * SHIP.MAIN.z, cs[1] + cd[1] * SHIP.MAIN.z], n = Math.round((60 - SHIP.MAIN.z) / 2);
      for (let i = 0; i <= n; i++) { const t = i / n; push(lerp(far[0], mast[0], t), lerp(far[1], mast[1], t), lerp(3, SHIP.MAIN.truck + 4, t * t * (3 - 2 * t))); }
      const sAt = new Float32Array(pts.length); for (let i = 1; i < pts.length; i++) sAt[i] = sAt[i - 1] + pts[i].distanceTo(pts[i - 1]);
      const length = sAt[pts.length - 1];
      // the place at d metres along the lane
      const at = (d, out) => { let i = 1; const dd = clamp(d, 0, length); while (i < pts.length - 1 && sAt[i] < dd) i++; return out.lerpVectors(pts[i - 1], pts[i], clamp((dd - sAt[i - 1]) / Math.max(1e-6, sAt[i] - sAt[i - 1]), 0, 1)); };
      const off = (x, z) => { let o = 1e9; for (const q of pts) o = Math.min(o, Math.hypot(q.x - x, q.z - z)); return o; };
      return { pts, sAt, length, at, off };
    })();
    await ctx.yield();
    // a ball as its corners and faces: twenty faces, each split `fine` times (12 corners and 20 faces unsplit: the case of
    // every leaf body of the limes; 42 corners and 80 faces at one split; finer ones for the sea rocks)
    const ball = (fine) => {
      const p = new THREE.IcosahedronGeometry(1, fine).attributes.position, key = new Map(), pos = [], idx = [];
      for (let i = 0; i < p.count; i++) {
        const k = Math.round(p.getX(i) * 1e3) + ',' + Math.round(p.getY(i) * 1e3) + ',' + Math.round(p.getZ(i) * 1e3); let q = key.get(k);
        if (q === undefined) { q = pos.length / 3; key.set(k, q); pos.push(p.getX(i), p.getY(i), p.getZ(i)); }
        idx.push(q);
      }
      return { pos, idx, n: pos.length / 3 };
    };
    // THE GULLS OF THE NOOK'S STILL WATER ARE DEALT HERE, before any rock is stood, so that every rock can ask where they
    // sit and wheel (their bodies are made further down): one in each of nine even stretches of the line from the nook's
    // mouth to the sands, 6 to 15 m off it, either hand in turn (the other hand where the first is not water).
    const GULLS = [];
    { const q = new THREE.Vector3(), tn = new THREE.Vector3(), NG = 9, s0 = m.P4 + 8, s1 = m.Q - 12;
      // THE SLEEPING SHIP IS A BODY TO THEM, read from her own built skin where she lies: the faces of her hull, decks,
      // spars and furled sails; her ropes, each with its own width; and her cable. A gull's whole course is one level
      // round through its seat (the shader's law: of radius clock[2], its centre that far out from the seat) on which
      // it rises to clock[3] and comes down again; the bird reaches no further from its place than birdReach, across
      // or up and down. It is seated only where a metre and more of clear air lies between the bird and her at every moment:
      //   her faces, in plan: every face with a corner lower than a metre over the bird's highest keeps a metre and
      //   the bird's reach from the whole round (no face of hers is as wide as a round, so its edges speak for it);
      //   her ropes and her cable, thin and slanting, in space: at each of 360 even moments of the round the bird's
      //   place keeps from each a metre, the ball round the bird's reach and half a step of the round.
      // The test draws nothing; a place that fails on both hands is not stood, and no rock is asked to stand clear of it.
      // (Three things that are made further down are taken here by their own figures, as each has them where it is
      // made. birdReach: the farthest corner of the bird's figure from its place, a wing's tip 0.08 m aft, 0.15 m up
      // and 0.62 m out. swell: what the swell lifts and lowers a seated bird, 0.07 m. Her cable: the sands' block
      // lays it from her hawse, 1.2 m abaft her stem and 3.4 m up, by a place 5 m ahead of her stem at 0.9 m, to
      // 12 m ahead of it at -1.2 m, a round limb of 0.09 m; it is kept here as those two stretches, a rope of that half width.)
      const shipFaces = [], shipRopes = [], birdReach = Math.hypot(0.08, 0.15, 0.62), swell = 0.07;
      twin.object.updateMatrixWorld(true);
      for (const o of twin.upright.children) {
        const A = o.geometry.attributes, ix = o.geometry.index, at = [];
        for (let i = 0; i < A.position.count; i++) { q.fromBufferAttribute(A.position, i).applyMatrix4(o.matrixWorld); at.push(q.x, q.y, q.z); }
        // (a rope: its two ends and half its width. A face: its three corners in plan, its lowest corner's height, and
        // how far it reaches from its first corner)
        if (A.aOther) for (let i = 0; i < A.position.count; i += 4) { q.fromBufferAttribute(A.aOther, i).applyMatrix4(o.matrixWorld); shipRopes.push([at[i * 3], at[i * 3 + 1], at[i * 3 + 2], q.x, q.y, q.z, A.aSW.getY(i) / 2]); }
        else for (let i = 0; i < ix.count; i += 3) {
          const a = ix.getX(i) * 3, b = ix.getX(i + 1) * 3, c = ix.getX(i + 2) * 3;
          shipFaces.push([at[a], at[a + 2], at[b], at[b + 2], at[c], at[c + 2], Math.min(at[a + 1], at[b + 1], at[c + 1]), Math.max(Math.hypot(at[b] - at[a], at[b + 2] - at[a + 2]), Math.hypot(at[c] - at[a], at[c + 2] - at[a + 2]))]);
        }
      }
      { const cs = PL.places.calmShip, d = azDir(PL.places.calmAz), at = (f, y) => [cs.x + MX * d[0] * f, y, cs.z + d[1] * f], h = at(SHIP.STEM - 1.2, 3.4), mid = at(SHIP.STEM + 5, 0.9), e = at(SHIP.STEM + 12, -1.2);
        shipRopes.push([...h, ...mid, 0.09], [...mid, ...e, 0.09]); }
      // (her skin is read: the dealing is a build step of its own)
      await ctx.yield();
      // (the distance in space from a point to the stretch between two points)
      const stretchDist = (px, py, pz, ax, ay, az, bx, by, bz) => {
        const ex = bx - ax, ey = by - ay, ez = bz - az, t = clamp(((px - ax) * ex + (py - ay) * ey + (pz - az) * ez) / (ex * ex + ey * ey + ez * ez || 1), 0, 1);
        return Math.hypot(px - ax - ex * t, py - ay - ey * t, pz - az - ez * t);
      };
      const shipClear = (x, z, ox, oz, round, rise) => {
        const top = rise + swell + birdReach + 1, cx = x + ox * round, cz = z + oz * round, far = round + 1 + birdReach;
        for (const f of shipFaces) {
          if (f[6] >= top || Math.hypot(cx - f[0], cz - f[1]) >= far + f[7]) continue;
          if (stretchDist(cx, 0, cz, f[0], 0, f[1], f[2], 0, f[3]) < far || stretchDist(cx, 0, cz, f[2], 0, f[3], f[4], 0, f[5]) < far || stretchDist(cx, 0, cz, f[4], 0, f[5], f[0], 0, f[1]) < far) return false;
        }
        const N = 360, ball = 1 + birdReach * Math.SQRT2 + Math.PI / N * Math.hypot(round, rise / 2);
        const low = shipRopes.filter((r) => Math.min(r[1], r[4]) < top && stretchDist(cx, 0, cz, r[0], 0, r[2], r[3], 0, r[5]) - r[6] < round + ball);
        for (let j = 0; j < N && low.length; j++) {
          const ang = j / N * TAU, u = round * (1 - Math.cos(ang)), v = round * Math.sin(ang), px = x + ox * u + oz * v, py = rise * Math.sin(ang / 2), pz = z + oz * u - ox * v;
          for (const r of low) if (stretchDist(px, py, pz, r[0], r[1], r[2], r[3], r[4], r[5]) - r[6] < ball) return false;
        }
        return true;
      };
      for (let k = 0; k < NG; k++) {
        const sq = lerp(s0, s1, (k + R.gulls.range(0.15, 0.85)) / NG), off = R.gulls.range(6, 15), clock = [R.gulls.range(26, 48), R.gulls.range(0, 1), R.gulls.range(4, 6.5), R.gulls.range(1.6, 3)];
        path.posAtDist(sq, q); path.tangentAtDist(sq, tn); const tl = Math.hypot(tn.x, tn.z) || 1;
        for (const side of k % 2 ? [1, -1] : [-1, 1]) {
          // (out: the level direction away from the line on this hand; the bird sits where 0.6 m and more of water lies under it and under its wheel)
          const ox = -tn.z / tl * side, oz = tn.x / tl * side, x = q.x + ox * off, z = q.z + oz * off;
          if (isle.heightAt(x, z) > -0.6 || isle.heightAt(x + ox * clock[2] * 2, z + oz * clock[2] * 2) > -0.3) continue;
          // (and where its seat and its whole round keep a metre and more clear of the sleeping ship)
          if (!shipClear(x, z, ox, oz, clock[2], clock[3])) continue;
          GULLS.push({ x, z, ox, oz, hd: Math.atan2(-ox, oz), clock }); break;
        }
      } }
    // (the gulls are dealt: the rocks' forms are the next build step)
    await ctx.yield();
    // THE FORM OF A SEA ROCK, by its own number alone (not by where it stands): the unevenness of its skin at every
    // corner of its ball, and its reach, the furthest its skin stands from its middle on the level at the water and over it.
    const rockBalls = [null, null];
    const rockForm = (ph, rad, far) => {
      const B = rockBalls[far ? 1 : 0] || (rockBalls[far ? 1 : 0] = ball(far ? 2 : 3)), long = 1.25 + 0.4 * Math.sin(ph * 1.9), n = new Float64Array(B.n); let reach = 0;
      for (let i = 0; i < B.n; i++) {
        const x = B.pos[i * 3], y = B.pos[i * 3 + 1], z = B.pos[i * 3 + 2];
        n[i] = isleNoise.n3(x * 1.3 + ph, y * 1.3, z * 1.3) * 0.3 + isleNoise.n3(x * 3.7, y * 3.7 + ph, z * 3.7) * 0.1;
        if (y > -0.35) reach = Math.max(reach, rad * (1 + n[i]) * Math.hypot(x * long, z / Math.sqrt(long)));
      }
      return { B, n, reach };
    };
    // PLACES DECIDE: a rock is stood only where no gull's wheel (and so no gull's seat, which lies on it) comes within
    // the rock's reach and a metre of its middle. A test by place: it draws nothing.
    const gullsClear = (x, z, reach) => {
      for (const g of GULLS) { const rr = g.clock[2]; if (Math.abs(Math.hypot(x - g.x - g.ox * rr, z - g.z - g.oz * rr) - rr) < reach + 1) return false; }
      return true;
    };
    // THE BARREN HALF: skerries of worn sea rock in the surf to seaward of the line, their nearest face 10 to 20 m from it,
    // one in each equal part of the way from 40 m past her bowsprit end to 10 m short of the nook's mouth; and a far
    // scatter 102 to 135 m from the knoll's middle. None within 60 m of the storm ship, 12 m of the flames' lane or 10 m of the line.
    const skerries = [];
    { const q = new THREE.Vector3(), t = new THREE.Vector3(), NK = 7, s0 = m.bow + 40, s1 = m.P4 - 10;
      const fits = (x, z, rad) => Math.hypot(x - PL.places.stormShip.x, z - PL.places.stormShip.z) > 60 + rad && LANE.off(x, z) > 12 + rad && offLine(x, z, 0, m.P5) > 10 + rad;
      for (let k = 0; k < NK; k++) {
        const sq = lerp(s0, s1, (k + R.skerries.range(0.15, 0.85)) / NK), rad = R.skerries.range(3, 6.5), off = R.skerries.range(10, 20) + rad, hk = R.skerries.range(0.5, 0.95), ph = R.skerries.range(0, 40);
        path.posAtDist(sq, q); path.tangentAtDist(sq, t); const tl = Math.hypot(t.x, t.z) || 1, x = q.x - MX * t.z / tl * off, z = q.z + MX * t.x / tl * off;
        if (fits(x, z, rad)) { const fm = rockForm(ph, rad, false); if (gullsClear(x, z, fm.reach)) skerries.push({ x, z, rad, h: rad * hk, ph, fm }); }
      }
      for (let k = 0; k < 5; k++) {
        const d = azDir(lerp(92, 172, (k + R.reefs.range(0.15, 0.85)) / 5)), r = R.reefs.range(102, 135), x = (KNOLL.x + d[0] * r) * MX, z = KNOLL.z + d[1] * r, rad = R.reefs.range(3, 6.5), hk = R.reefs.range(0.5, 0.95), ph = R.reefs.range(0, 40);
        if (fits(x, z, rad + 12)) { const fm = rockForm(ph, rad, true); if (gullsClear(x, z, fm.reach)) skerries.push({ x, z, rad, h: rad * hk, ph, far: true, fm }); }
      } }
    await ctx.yield();
    // THE INNER WATER'S ROCKS: six worn rocks (their half-width 1.6 to 3.2 m, their height 0.55 to 0.95 of it) in the
    // shallows beside the line, one in each equal part of the way from where the sleeping ship's stern comes abeam to
    // 45 m short of the first lime. Each stands on the hand where water 0.3 to 1.4 m deep lies nearest the line, its
    // near face 12 m and more from it (looked for out to 26 m), no nearer than 30 m to the sleeping ship's middle, and
    // clear of every gull's wheel by its own reach and a metre. Where its own place along the line has no such
    // water, it is looked for 2 m further on and back, then 4, and so to 12 m, inside its own part of the way.
    { const q = new THREE.Vector3(), t = new THREE.Vector3(), NR = 6, s0 = m.P5, s1 = m.grove0 - 45, cs = PL.places.calmShip;
      for (let k = 0; k < NR; k++) {
        const sq = lerp(s0, s1, (k + R.innerRocks.range(0.15, 0.85)) / NR), rad = R.innerRocks.range(1.6, 3.2), hk = R.innerRocks.range(0.55, 0.95), ph = R.innerRocks.range(0, 40), first = R.innerRocks.range(12, 16);
        const fm = rockForm(ph, rad, true); let best = null;
        for (const along of [0, 2, -2, 4, -4, 6, -6, 8, -8, 10, -10, 12, -12]) {
          const sa = sq + along; if (sa < lerp(s0, s1, k / NR) || sa > lerp(s0, s1, (k + 1) / NR)) continue;
          path.posAtDist(sa, q); path.tangentAtDist(sa, t); const tl = Math.hypot(t.x, t.z) || 1;
          for (const side of [1, -1]) for (let off = first + rad; off <= 26 + rad; off += 1) {
            const x = q.x - t.z / tl * side * off, z = q.z + t.x / tl * side * off, h = isle.heightAt(x, z);
            if (h < -0.3 && h > -1.4 && Math.hypot(x - cs.x, z - cs.z) > 30 + rad && gullsClear(x, z, fm.reach) && offLine(x, z, m.P4, m.grove0) > 12 + rad) { if (!best || off < best.off) best = { x, z, off, ox: -t.z / tl * side, oz: t.x / tl * side }; break; }
          }
          if (best) break;
        }
        if (best) skerries.push({ x: best.x, z: best.z, rad, h: rad * hk, ph, far: true, inner: true, tops: [], out: [best.ox, best.oz], fm });
        await ctx.yield();
      } }
    await ctx.yield();
    // depth of the water and shelter of the nook, baked over the near island
    const DR = { x0: -420, z0: -640, w: 840, h: 580, nx: 140, nz: 97 };
    const aAt = (s) => { const q = path.posAtDist(s, new THREE.Vector3()); return isle.lineAC(q.x, q.z)[0]; };
    const groveA0 = aAt(m.grove0), groveA1 = aAt(m.grove1);
    const depthData = new Uint16Array(DR.nx * DR.nz * 4);
    const depthRow = (j) => {
      // (only the rocks that can reach this row are asked on it)
      const zr = DR.z0 + (j + 0.5) / DR.nz * DR.h, rowRocks = skerries.filter((rk) => Math.abs(zr - rk.z) <= rk.rad * 2.2);
      for (let i = 0; i < DR.nx; i++) {
        const x = DR.x0 + (i + 0.5) / DR.nx * DR.w, z = DR.z0 + (j + 0.5) / DR.nz * DR.h;
        let hgt = isle.heightAt(x, z); const ux = x * MX;
        if (hgt < 8) for (const rk of rowRocks) { const dx = Math.abs(x - rk.x), dz = Math.abs(z - rk.z), far = rk.rad * 2.2; if (dx > far || dz > far) continue; const d = Math.hypot(dx, dz) / rk.rad; if (d < 2.2) hgt = Math.max(hgt, rk.h * (1 - d * d) - 0.25 * Math.max(0, d - 1)); }
        // sheltered: the water north of the ridge's line
        const inCove = smoothstep(14, 44, isle.northOf(x, z));
        depthData[(j * DR.nx + i) * 4] = THREE.DataUtils.toHalfFloat(clamp(-hgt, -8, 40));
        depthData[(j * DR.nx + i) * 4 + 1] = THREE.DataUtils.toHalfFloat(1 - 0.97 * inCove);
        // how high the shore stands over the water with what grows on it: the pines where the land is over 14 m between
        // the knoll and the ridge's end, the limes of the grove (for the water's mirror of its shores)
        let up = 0;
        if (hgt > 0) { const ac = isle.lineAC(x, z); up = hgt + (hgt > 14 && ux > -140 && ux < 100 && z > -330 ? 13 : 0) + (ac[0] > groveA0 - 2 && ac[0] < groveA1 + 4 && Math.abs(ac[1]) < 26 ? 24 : 0); }
        depthData[(j * DR.nx + i) * 4 + 2] = THREE.DataUtils.toHalfFloat(up);
      }
    };
    for (let j = 0; j < DR.nz; j++) { depthRow(j); if (j % 2 === 1) await ctx.yield(); }
    const depthTex = new THREE.DataTexture(depthData, DR.nx, DR.nz, THREE.RGBAFormat, THREE.HalfFloatType);
    depthTex.magFilter = depthTex.minFilter = THREE.LinearFilter; depthTex.wrapS = depthTex.wrapT = THREE.ClampToEdgeWrapping; depthTex.generateMipmaps = false; depthTex.needsUpdate = true;
    // the sheet: rings that widen with distance; it is worn by the eye
    const seaGeo = (() => {
      const SEG = 96, RINGS = 104, pos = [0, 0, 0], idx = [];
      for (let r = 0; r < RINGS; r++) { const rad = 0.6 * Math.pow(1.0855, r); for (let k = 0; k < SEG; k++) { const a = k / SEG * TAU; pos.push(Math.cos(a) * rad, 0, Math.sin(a) * rad); } }
      for (let k = 0; k < SEG; k++) idx.push(0, 1 + (k + 1) % SEG, 1 + k);
      for (let r = 0; r < RINGS - 1; r++) for (let k = 0; k < SEG; k++) { const a = 1 + r * SEG + k, b = 1 + r * SEG + (k + 1) % SEG, c = a + SEG, d = b + SEG; idx.push(a, b, c, b, d, c); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 4000);
      return g;
    })();
    const hdW = azDir(290 * MX), Qw = [isle.Q[0] * MX, isle.Q[1]], windV = azDir(windAz);
    const rings = [0, 1, 2, 3].map(() => new THREE.Vector4(0, 0, 0, 0));
    // the fire the water shows: her six gatherings of flame, and every flame of the lane
    const laneFire = Array.from({ length: NLANE }, () => new THREE.Vector4(0, 0, 0, 0));
    const seaU = {
      ...SU, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 },
      uTime: { value: 0 }, uWave: { value: waves }, uCalmK: { value: calmK }, uDepth: { value: depthTex }, uDepthRect: { value: new THREE.Vector4(DR.x0, DR.z0, 1 / DR.w, 1 / DR.h) },
      uBeach: { value: new THREE.Vector4(Qw[0], Qw[1], hdW[0], hdW[1]) }, uDeep: { value: moodC('#1f6b58', '#2a8a72').multiplyScalar(0.8) }, uCrest: { value: C('#5fd0a4') }, uFoamCol: { value: C('#e6f1ee') },
      uCalmCol: { value: C(HOUR.calm).multiplyScalar(0.4) }, uShallowCol: { value: C('#8fd6c4') }, uLandLow: { value: C('#dcb26a').multiplyScalar(0.7) }, uLandHigh: { value: C('#35582c').multiplyScalar(0.8) }, uFireCol: { value: fireColor }, uFire: { value: [...hero.fire, ...laneFire] }, uRing: { value: rings },
      uWind: { value: new THREE.Vector2(windV[0], windV[1]) },
      // the land's own drifting cloud shadows (the kit terrain's field), handed over when the land is made
      tDetail: { value: null }, uTCloud: { value: new THREE.Vector4(0, 0, 1 / 520, 0) },
      // the swell runs in through the mouth along the nook's own axis: 22 m from crest to crest, 7 cm high
      uSwell: { value: new THREE.Vector4(MX * ND[0], ND[1], TAU / 22, 0.07) },
      // the pageant's great bodies, for the still water to mirror (filled where the pageant is made)
      // the sea rocks, for the surf round each (filled where they are made)
      uRock: { value: Array.from({ length: NROCK }, () => new THREE.Vector4(0, 0, 1, 0)) }, uRockAx: { value: Array.from({ length: NROCK }, () => new THREE.Vector3(1, 0, 1)) },
      uStand: { value: Array.from({ length: NSTAND }, () => new THREE.Vector4(0, 0, 0, 1)) }, uStandY: { value: new Array(NSTAND).fill(0) }, uStandCol: { value: [C('#7d6c59').multiplyScalar(0.6), C('#2f5a3a').multiplyScalar(0.7), C('#7d6c59').multiplyScalar(0.6), C('#7d6c59').multiplyScalar(0.6), C('#7d6c59').multiplyScalar(0.6), C('#7d6c59').multiplyScalar(0.6)] },
      uCap: { value: Array.from({ length: NCAP }, () => new THREE.Vector4(0, 0, 1, 1e6)) }, uCapTop: { value: new Array(NCAP).fill(0) }, uCapLit: { value: new THREE.Color() }, uCapBelly: { value: new THREE.Color() },
    };
    const sea = new THREE.Mesh(seaGeo, new THREE.ShaderMaterial({ uniforms: seaU, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, fog: true, transparent: true, depthWrite: true }));
    sea.frustumCulled = false; sea.renderOrder = 1; scene.add(sea);
    await ctx.yield();


    // ------------------------------------------------------------ the island
    const tick = [];
    // THE CORN'S FIELDS, of unlike size: strips 12 to 34 m wide run along the island's long axis, each cut across into
    // fields 50 to 130 m long; two fields that meet end to end never carry the same crop. Every field is edged by a
    // baulk of grass; four strips in ten have a hedge down their left side, three cuts in ten a hedge across.
    // (a, c) = metres along the sands' line and to its right.
    const CROPS = [{ name: 'wheat', col: lin('#d2a53c'), h: 1.45 }, { name: 'barley', col: lin('#d9c67a'), h: 1.3 }, { name: 'rye', col: lin('#a3a86a'), h: 1.6 }, { name: 'peas', col: lin('#6f9a4e'), h: 1.0 }];
    // the meadow begins 8 m before the grove's last lime, so that the corn runs in under the last boughs; the dancers'
    // mown round lies 80 m past the last lime, 48 m to the left of the line
    const climbA0 = aAt(m.climb0), MEADOW = { a0: groveA1 - 8, a1: climbA0 + 520, half: 205 };
    const DANCE = { a: groveA1 + 80, c: -48, r: 13 };
    const strips = [];
    { let c = -215, last = -1;
      while (c < 215) {
        const w = R.corn.range(12, 34), cuts = [MEADOW.a0 - 4], fields = [];
        for (let a = MEADOW.a0 + R.corn.range(20, 130); a < MEADOW.a1 - 30; a += R.corn.range(50, 130)) cuts.push(a);
        cuts.push(MEADOW.a1 + 4);
        for (let i = 0; i < cuts.length - 1; i++) { let k = R.corn.int(0, 3); if (k === last) k = (k + 1) % 4; last = k; fields.push({ crop: k, tone: R.corn(), hedge: R.corn.chance(0.3) }); }
        strips.push({ c0: c, c1: c + w, cuts, fields, hedge: R.corn.chance(0.4) }); c += w;
      } }
    // EACH FIELD'S ROWS run its own way: along its strip or across it (an even chance), up to 7 degrees off true; every
    // eighth gap between rows is a wheeling, set off from the field's edge by the field's own draw. (Where the crop
    // stands as walls of stalks, within 40 m of the avenue's axis and as far as 90 m past the climb's foot, the walls
    // stand across the strips: a field that reaches into that ground keeps its rows along its strip.)
    for (const sp of strips) for (let i = 0; i < sp.fields.length; i++) {
      const f = sp.fields[i], across = R.rows.chance(0.5), walled = sp.c0 < 40 && sp.c1 > -40 && sp.cuts[i] < climbA0 + 90;
      f.turn = (across && !walled ? Math.PI / 2 : 0) + R.rows.range(-0.12, 0.12); f.set = R.rows();
      f.row = [127.5 + 127.5 * Math.cos(f.turn), 127.5 + 127.5 * Math.sin(f.turn), f.set * 255];
    }
    const stripAt = (c) => { for (const sp of strips) if (c < sp.c1) return sp; return strips[strips.length - 1]; };
    // the field at a place, written into FLD: its crop, its tone (0..1), metres to its nearest edge, and (as the rows' map holds them) the way its rows run and its wheelings' offset
    const FLD = [0, 0, 0, 0, 0, 0];
    const fieldAt = (a, c) => { const sp = stripAt(c), ct = sp.cuts; let i = 0; while (i < ct.length - 2 && a >= ct[i + 1]) i++; const f = sp.fields[i]; FLD[0] = f.crop; FLD[1] = f.tone; FLD[2] = Math.min(c - sp.c0, sp.c1 - c, a - ct[i], ct[i + 1] - a); FLD[3] = f.row[0]; FLD[4] = f.row[1]; FLD[5] = f.row[2]; return FLD; };
    // the beaten path: from the avenue's mouth it winds across the corn to the dancers' round (metres right of the line at a)
    const PATHWAY = { a0: MEADOW.a0 - 2, a1: DANCE.a - 6, ph: R.corn.range(0, TAU) };
    const pathC = (a) => { const t = smoothstep(PATHWAY.a0 + 10, PATHWAY.a1, a); return DANCE.c * t + 4 * Math.sin(t * Math.PI) * Math.sin(a * 0.085 + PATHWAY.ph); };
    // 0 outside the meadow .. 1 in standing corn (0 too on the dancers' mown round)
    const cornAt = (a, c) => smoothstep(MEADOW.a0, MEADOW.a0 + 14, a) * (1 - smoothstep(MEADOW.a1 - 30, MEADOW.a1, a)) * (1 - smoothstep(MEADOW.half - 12, MEADOW.half, Math.abs(c))) * smoothstep(DANCE.r - 1, DANCE.r + 2, Math.hypot(a - DANCE.a, c - DANCE.c));
    const ROCK = lin('#7d6c59'), ROCK_D = lin('#4f463c'), WET_ROCK = lin('#8f9598'), GROVE_A0 = groveA0;
    const SAND = lin('#dcb26a'), SAND_WET = lin('#8f7146'), TURF = lin('#5a8a3e'), TURF_D = lin('#44703a'), BED = lin('#2f6f6a'), DUNE = lin('#b9b06a'), MOWN = lin('#7f9a4e'), EARTH = lin('#9a7a50'), LITTER = lin('#8a7048'), MOSS = lin('#5d7a34');
    // the vines' slope: from 52 m past the grove's first lime for 348 m, 152 to 260 m to the left
    const VINES = { c0: -152, c1: -260, a0: groveA0 + 52, a1: groveA0 + 400 };
    // THE STORM'S SHADE, laid on a surface's own colour from the field at its own place: darker, cooler, wet
    const stormShade = (col, x, z) => { const f = stormAt(x, z); return [col[0] * lerp(1, 0.5, f), col[1] * lerp(1, 0.56, f), col[2] * lerp(1, 0.62, f)]; };
    const groundRGB = (x, z, h) => stormShade(groundRaw(x, z, h), x, z);
    const groundRaw = (x, z, h) => {
      if (h < 0) return mix3(mix3(SAND_WET, SAND, smoothstep(-0.6, -0.05, h)), mul3(BED, 0.5), smoothstep(-0.8, -5, h));
      const sd = isle.shore(x, z), [a, c] = isle.lineAC(x, z), n = isleNoise.n2(x * 0.03, z * 0.03), n2 = isleNoise.n2(x * 0.11 + 7, z * 0.11);
      let col = mix3(SAND_WET, SAND, smoothstep(0.04, 0.42, h + n2 * 0.08));
      col = mix3(col, DUNE, smoothstep(38, 60, sd + n * 8) * 0.55);
      const turf = mix3(TURF_D, TURF, 0.5 + 0.5 * n);
      // turf inland, and on the grove's own floor from 12 m before its first lime
      col = mix3(col, turf, Math.max(smoothstep(55, 95, sd + n * 14), smoothstep(GROVE_A0 - 14, GROVE_A0 + 4, a + n * 5) * (1 - smoothstep(34, 52, Math.abs(c)))));
      // under the limes the floor is leaf litter with moss in it, from the first lime to the last
      col = mix3(col, mix3(LITTER, MOSS, smoothstep(0.1, 0.7, n2 * 0.5 + 0.5) * 0.45), smoothstep(GROVE_A0 - 6, GROVE_A0 + 6, a) * (1 - smoothstep(groveA1 - 4, groveA1 + 8, a)) * (1 - smoothstep(40, 48, Math.abs(c))));
      // bare rock and dark earth where the land stands higher than a beach would: the knoll's cliffs, the ridge's foot
      if (sd < 48) col = mix3(col, mix3(ROCK_D, ROCK, 0.5 + 0.5 * n2), smoothstep(1.2, 4.5, h - sd * 0.03) * (1 - smoothstep(30, 48, sd)));
      // (the knoll's crown over its bedded cliff is the same wet rock, paler than the ridge's)
      if (h > 6) { const kx = x - KNOLL.x * MX, kz = z - KNOLL.z, k2 = kx * kx + kz * kz; if (k2 < 1.21 * KNOLL.r * KNOLL.r) col = mix3(col, mul3(mix3(ROCK, [0.48, 0.45, 0.38], 0.3 + 0.3 * n2), 1.9), smoothstep(1.1, 0.95, Math.sqrt(k2) / KNOLL.r) * smoothstep(6, 12, h)); }
      const corn = cornAt(a, c);
      if (corn > 0) col = mix3(col, mul3(CROPS[fieldAt(a, c)[0]].col, 0.62), corn * 0.9);
      // bare earth between the vine rows
      col = mix3(col, EARTH, 0.7 * smoothstep(VINES.c0 + 6, VINES.c0 - 4, c) * smoothstep(VINES.c1 - 6, VINES.c1 + 4, c) * smoothstep(VINES.a0 - 8, VINES.a0 + 6, a) * (1 - smoothstep(VINES.a1 - 4, VINES.a1 + 10, a)));
      const dd = Math.hypot(a - DANCE.a, c - DANCE.c);
      if (dd < DANCE.r + 2) col = mix3(MOWN, col, smoothstep(DANCE.r - 1, DANCE.r + 2, dd));
      return col;
    };
    const tb = MX > 0 ? [-1260, -1330, 430, -120] : [-430, -1330, 1260, -120];
    const terrain = await T.makeTerrainAsync({
      rng: R.terrain, noise: ctx.noise, path, corridor: false, height: isle.heightAt, bounds: tb, cell: 4, near: 30, levels: 5, refine: 1, maxTriangles: 30000,
      biome: 'tropical', palette: { rock: '#8a7a68', rockB: '#6a5a4c', rockSlope: [0.5, 0.72], tufts: 0, pebbles: 0, clouds: 0.5, cloudSize: 520, cloudSpeed: 9, patchAmount: 0, altAmount: 0, cracks: 0, detail: 0.55, streaks: 0.1, ripples: 0.3, rippleLength: 0.18, bump: 0.5, wind: azDir(20 * MX), wet: 0.35, wetRange: 0.4, wetRoughness: 0.12, sparkle: 0.5 },
      color: (x, z, h, ny, out) => { const c = groundRGB(x, z, h); return out.setRGB(c[0], c[1], c[2]); },
      waterLevel: 0, heightRange: [0, 70], sunDir, skirt: 20,
    }, ctx.yield);
    scene.add(terrain.object);
    seaU.tDetail.value = terrain.detailTexture; if (terrain.uniforms.uTCloud) seaU.uTCloud = terrain.uniforms.uTCloud;
    tick.push((dt, time) => terrain.update(dt, time));
    await ctx.yield();

    // ------------------------------------------------------------ what grows on the island: one wind, one leaf material
    const wind = flora.makeWind({ direction: [windV[0], windV[1]], strength: 0.9 });
    await flora.prepareLeafTexture({}, ctx.yield);
    const leafMat = flora.windMaterial({ wind });
    tick.push((dt, time) => flora.updateWind(wind, time));
    const groundAt = (x, z) => Math.max(0, isle.heightAt(x, z));
    const plain = new THREE.MeshLambertMaterial({ vertexColors: true }), plain2 = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    // Solid things that never move (rock, bark, driftwood; and leaves seen from both sides) are gathered and drawn as
    // one body of each kind.
    // (the facing of a body's corners as the library reckons it, to the last digit: each face's cross product added to
    // its three corners, then every corner's made one long; written straight into one store)
    const cornerNormals = (pos, idx) => {
      const N = new Float32Array(pos.length);
      for (let i = 0; i < idx.length; i += 3) {
        const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3, cx = pos[c] - pos[b], cy = pos[c + 1] - pos[b + 1], cz = pos[c + 2] - pos[b + 2], ax = pos[a] - pos[b], ay = pos[a + 1] - pos[b + 1], az = pos[a + 2] - pos[b + 2];
        const nx = cy * az - cz * ay, ny = cz * ax - cx * az, nz = cx * ay - cy * ax, a0 = N[a], a1 = N[a + 1], a2 = N[a + 2], b0 = N[b], b1 = N[b + 1], b2 = N[b + 2], c0 = N[c], c1 = N[c + 1], c2 = N[c + 2];
        N[a] = a0 + nx; N[a + 1] = a1 + ny; N[a + 2] = a2 + nz; N[b] = b0 + nx; N[b + 1] = b1 + ny; N[b + 2] = b2 + nz; N[c] = c0 + nx; N[c + 1] = c1 + ny; N[c + 2] = c2 + nz;
      }
      for (let o = 0; o < N.length; o += 3) { const x = N[o], y = N[o + 1], z = N[o + 2], k = 1 / (Math.sqrt(x * x + y * y + z * z) || 1); N[o] = x * k; N[o + 1] = y * k; N[o + 2] = z * k; }
      return N;
    };
    const gathered = [[], []];
    const gather = (g, bothSides) => gathered[bothSides ? 1 : 0].push(g);
    const drawGathered = async () => {
      for (let k = 0; k < 2; k++) {
        let nv = 0, ni = 0; for (const g of gathered[k]) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
        if (!nv) continue;
        const P = new Float32Array(nv * 3), N = new Float32Array(nv * 3), Cc = new Float32Array(nv * 3), I = new Uint32Array(ni); let o = 0, io = 0;
        for (const g of gathered[k]) {
          const n = g.attributes.position.count;
          P.set(g.attributes.position.array, o * 3); N.set(g.attributes.normal.array, o * 3); Cc.set(g.attributes.color.array, o * 3);
          if (g.index) { const src = g.index.array; for (let i = 0; i < src.length; i++) I[io + i] = src[i] + o; io += src.length; } else { for (let i = 0; i < n; i++) I[io + i] = o + i; io += n; }
          o += n; await ctx.yield();
        }
        const all = new THREE.BufferGeometry(); all.setAttribute('position', new THREE.BufferAttribute(P, 3)); all.setAttribute('normal', new THREE.BufferAttribute(N, 3)); all.setAttribute('color', new THREE.BufferAttribute(Cc, 3)); all.setIndex(new THREE.BufferAttribute(I, 1));
        scene.add(new THREE.Mesh(all, k ? plain2 : plain));
        await ctx.yield();
      }
    };
    const BALL = ball(1), CASE = ball(0);
    // WHAT EVERY SURFACE OF THE GROVE READS: the roof's own map (made below from the crowns as they stand), in the
    // sands' frame at half a metre to a texel: r the sun on the floor (the roof read as one screen 14 m over the
    // floor, each gap thrown down-sun by the sun's own height, at most 40 m; the underwood's and the boles' shadows in
    // it), g the crowns seen from straight above, b the nearness of a bole, a the undergrowth's drifts. A thing that
    // stands y metres over the floor reads the sun at the foot of its own ray. And the grove's thin haze: by the metres
    // of the sight line that lie under the roof, so that row stands behind row.
    const upSunAC = (() => { const fl = Math.hypot(sunDir.x, sunDir.z) || 1, sx = sunDir.x / fl, sz = sunDir.z / fl; return [sx * hdW[0] + sz * hdW[1], sx * MX * isle.rt[0] + sz * isle.rt[1], Math.min(Math.hypot(sunDir.x, sunDir.z) / sunDir.y, 40 / 14)]; })();
    const groveU = { uGMap: { value: null }, uGTex: { value: new THREE.Vector2(1, 1) }, uGBox: { value: new THREE.Vector4(groveA0 - 20, -70, 1 / (groveA1 - groveA0 + 64), 1 / 120) }, uGRows: { value: new THREE.Vector4(groveA0, groveA1, 42, 0.0075) },
      uGSun: { value: new THREE.Vector3(upSunAC[0], upSunAC[1], upSunAC[2]) }, uGHaze: { value: C(HOUR.hemi).lerp(C(HOUR.sun), 0.3).multiply(C('#c8d8a8')).multiplyScalar(0.62) },
      uGQ: { value: new THREE.Vector2(Qw[0], Qw[1]) }, uGHd: { value: new THREE.Vector2(hdW[0], hdW[1]) }, uGRt: { value: new THREE.Vector2(MX * isle.rt[0], isle.rt[1]) },
      uGFloor: { value: (() => { const h = (a) => { const [x, z] = lineW(a, 0); return groundAt(x, z); }; return new THREE.Vector2(h(groveA0), (h(groveA1) - h(groveA0)) / (groveA1 - groveA0)); })() } };
    const GROVE_GLSL = /* glsl */`
      uniform sampler2D uGMap; uniform vec4 uGBox, uGRows; uniform vec3 uGSun, uGHaze; uniform vec2 uGQ, uGHd, uGRt, uGFloor, uGTex;
      vec2 gAC(vec2 xz) { vec2 d = xz - uGQ; return vec2(dot(d, uGHd), dot(d, uGRt)); }
      // (the map is read smoothly: between four texels by a curve that is level at each texel's middle, so its half-metre net shows no creases)
      vec4 gMap(vec2 ac) { vec2 st = (ac - uGBox.xy) * uGBox.zw * uGTex - .5, i = floor(st), f = st - i; return texture2D(uGMap, (i + .5 + f * f * (3. - 2. * f)) / uGTex); }
      float gOver(vec2 ac, float y) { return max(y - (uGFloor.x + (ac.x - uGRows.x) * uGFloor.y), 0.); }
      float gSun(vec2 ac, float y) { return gMap(ac - uGSun.xy * (gOver(ac, y) * uGSun.z)).r; }
      // LIGHT COMES THROUGH LIME LEAVES: the floor under the roof takes the sky's light through the roof's open share
      // and, where the roof stands over it, the sun's light let through the leaves, yellow-green (the map's crowns read wide; k: the land's cloud shadow)
      vec3 gUnder(vec2 ac, vec3 sky, vec3 sun, float k) { float c = texture2D(uGMap, (ac - uGBox.xy) * uGBox.zw, 2.).g; return sky * (.5 - .2 * c) + sun * (vec3(.1, .13, .07) + vec3(.5, .75, .13) * (c * k)); }
      float gHaze(vec3 w, vec3 cam) {
        vec2 p0 = gAC(cam.xz), d = gAC(w.xz) - p0;
        d = mix(vec2(1e-3), d, step(vec2(1e-3), abs(d)));
        vec2 ta = (vec2(uGRows.x - 4., -uGRows.z) - p0) / d, tb = (vec2(uGRows.y + 4., uGRows.z) - p0) / d, t0 = min(ta, tb), t1 = max(ta, tb);
        float len = max(min(min(t1.x, t1.y), 1.) - max(max(t0.x, t0.y), 0.), 0.) * length(w - cam);
        return 1. - exp(-len * uGRows.w);
      }`;
    // the limes' leaves: balls of leaves that stir; ragged at the rim where the leaves stand against the sky; sunlit on
    // the sun's side where no crown stands before them, and everywhere else alight with the sun let through the
    // leaves. The land's cloud shadows lie on the roof as on the ground.
    // A BODY IS ROUND IN ITS SHADING: what is drawn of it is a case of twenty faces round a ball of leaves (see the
    // lump, below). On every look through the case the shader finds where that look meets the ball and shades the
    // ball there, at its own place and facing; a look that passes the ball by shows what lies behind it.
    const leafRoof = new THREE.ShaderMaterial({
      uniforms: { ...groveU, uTime: seaU.uTime, uSunDir: { value: sunDir }, uSun: twin.light.uSunCol, uSky: twin.light.uSky, uNoise: { value: noiseTex }, tDetail: { value: terrain.detailTexture }, uTCloud: seaU.uTCloud, uGreens: { value: [] }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } },
      fog: true,
      vertexShader: /* glsl */`
        attribute vec3 aMid; attribute vec4 aBall; uniform float uTime; varying vec3 vP, vMid; varying vec4 vBall;
        #include <fog_pars_vertex>
        void main() {
          // (the whole body stirs as one, by its middle's own place)
          float ph = aMid.x * .21 + aMid.z * .17;
          vec3 stir = .7 * vec3(.22 * sin(uTime * 1.1 + ph), .07 * sin(uTime * 1.9 + ph * 2.1), .18 * sin(uTime * .9 + ph * 1.3));
          vP = position + stir; vMid = aMid + stir; vBall = aBall;
          vec4 mvPosition = viewMatrix * vec4(vP, 1.);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunDir, uSun, uSky, uGreens[8]; uniform sampler2D uNoise, tDetail; uniform vec4 uTCloud; uniform float uTime; varying vec3 vP, vMid; varying vec4 vBall;
        ${GROVE_GLSL}
        #include <fog_pars_fragment>
        void main() {
          // where the look meets the ball (in the ball's own measure, where it is a ball of radius one about its middle)
          vec3 rad = vec3(vBall.x, vBall.y, vBall.x), eye = (cameraPosition - vMid) / rad, d = normalize((vP - vMid) / rad - eye);
          float along = dot(eye, d), hit = along * along - dot(eye, eye) + 1.;
          if (hit < 0.) discard;
          vec3 on = eye + d * (-along - sqrt(hit)), vW = vMid + on * rad, Ng = normalize(on / rad), V = normalize(cameraPosition - vW);
          int green = int(vBall.z + .5);
          vec3 vC = mix(uGreens[green * 2 + 1], uGreens[green * 2], .5 + .5 * on.y);
          // clumps of leaves half a metre and two metres across, lighter and darker; and the leaves themselves at the rim,
          // which is eaten deeper where the body's own shape (its number) is hollow
          vec3 n1 = texture2D(uNoise, vW.xz * .023 + vW.y * .012 + uTime * .002).rgb, n2 = texture2D(uNoise, vW.xz * .071 + vW.y * .03).rgb;
          float leaf = texture2D(uNoise, vW.xz * .31 + vW.y * .27).g * .6 + texture2D(uNoise, vW.zx * .83 - vW.y * .61).r * .4;
          float hollow = texture2D(uNoise, on.xz * .19 + on.y * .13 + vBall.w).b;
          float rim = 1. - abs(dot(Ng, V));
          if (leaf < smoothstep(.5 - .22 * hollow, .95 - .22 * hollow, rim) * .64) discard;
          vec3 N = normalize(Ng + (n2 - .5) * .7);
          vec2 ac = gAC(vW.xz);
          float cloud = uTCloud.w * smoothstep(.46, .66, texture2D(tDetail, vW.xz * uTCloud.z + uTCloud.xy).r);
          // the sun reaches a leaf where no crown stands within 3.5 m up-sun of it, and every crown's top
          float open = 1. - .5 * (gMap(ac + uGSun.xy * 3.5).g + gMap(ac + uGSun.xy * 7.).g), over = gOver(ac, vW.y);
          float lit = max(open, smoothstep(17., 21., over)) * (1. - cloud);
          float facing = dot(N, uSunDir), sunL = clamp(facing * .6 + .4, 0., 1.) * lit;
          float under = smoothstep(.15, -.45, N.y), thin = smoothstep(.35, .8, n1.r * .55 + n2.g * .45);
          vec3 col = vC * (.7 + .6 * n2.g) * (.75 + .5 * leaf) * (uSky * mix(.55, .4, under) + uSun * (vec3(.04, .07, .03) + sunL * .36));
          col *= mix(vec3(1.), vec3(.82, .95, 1.08), under);
          // LIGHT COMES THROUGH LIME LEAVES: a face the sun does not strike (turned from it, or in another crown's
          // shade) is not dark. It carries the sun's light let through the leaves, yellow-green: two fifths less
          // where the face is turned flat away from the sun (the longest way through its own body), and less the
          // more roof stands between it and the sun up the sun's own ray (the map's crowns, by the metres of roof
          // still above the face). A rule of the leaf and the sun; nothing of the eye is in it.
          float rise = max(22. - over, 0.), run = uGSun.z * rise;
          float roofed = .5 * (gMap(ac + uGSun.xy * (run * .3)).g + gMap(ac + uGSun.xy * (run * .8)).g);
          float through = (1. - .4 * smoothstep(-.2, -.9, facing)) * exp(-roofed * rise * .035) * (1. - cloud);
          col += vC * vec3(1.9, 1.55, .22) * uSun * (through * (1. - sunL) * (1.55 + .5 * thin));
          col = mix(col, uGHaze, gHaze(vW, cameraPosition) * .8);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }` });
    // the boles' bark: furrows a hand apart that run up the bole, plates between them, moss on the foot and on the side
    // away from the sun; lit by the roof's map at its own place, hazed with the grove
    const barkMat = new THREE.ShaderMaterial({
      uniforms: { ...groveU, uSunDir: { value: sunDir }, uSun: twin.light.uSunCol, uSky: twin.light.uSky, uNoise: { value: noiseTex }, tDetail: { value: terrain.detailTexture }, uTCloud: seaU.uTCloud, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } },
      vertexColors: true, fog: true, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        varying vec3 vN, vW, vC;
        #include <fog_pars_vertex>
        void main() { vN = normal; vW = position; vC = color; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uSunDir, uSun, uSky; uniform sampler2D uNoise, tDetail; uniform vec4 uTCloud; varying vec3 vN, vW, vC;
        ${GROVE_GLSL}
        #include <fog_pars_fragment>
        void main() {
          vec3 N = normalize(vN); vec2 ac = gAC(vW.xz); float over = gOver(ac, vW.y);
          vec2 wt = abs(N.xz) + 1e-3; wt /= wt.x + wt.y;
          vec2 f1 = texture2D(uNoise, vec2(vW.z * 1.3, vW.y * .1)).rg, f2 = texture2D(uNoise, vec2(vW.x * 1.3, vW.y * .1)).rg, f = f1 * wt.x + f2 * wt.y;
          float fine = texture2D(uNoise, vec2((vW.x + vW.z) * 3.7, vW.y * .45)).b;
          float plate = smoothstep(.36, .58, f.r * .75 + fine * .25);
          vec3 col = vC * mix(.42, 1.25, plate) * (.8 + .4 * f.g);
          float moss = smoothstep(.7, .9, f.g * .5 + texture2D(uNoise, vW.xz * .13 + vW.y * .07).r * .4 + (1. - smoothstep(0., 3.5, over)) * .42 - dot(N.xz, normalize(uSunDir.xz)) * .12);
          col = mix(col, vec3(.2, .3, .09) * (.6 + .9 * fine), moss * .7);
          float cloud = uTCloud.w * smoothstep(.46, .66, texture2D(tDetail, vW.xz * uTCloud.z + uTCloud.xy).r);
          float sunL = clamp(dot(N, uSunDir) * .8 + .2, 0., 1.) * gSun(ac, vW.y) * (1. - cloud);
          col *= uSky * vec3(.36, .42, .5) * (.8 + .2 * N.y) + uSun * (vec3(.1, .13, .07) + sunL * 1.1);
          col = mix(col, uGHaze, gHaze(vW, cameraPosition) * .8);
          gl_FragColor = vec4(col, 1.);
          #include <fog_fragment>
        }` });
    // THE LIME GROVE: an avenue of limes round a cell, roofed by their crowns. Limes 22 to 28 m tall, clear of boughs
    // for 7 to 9 m; four rows either side of the line (the nearest 6 to 8 m from it, the others 9 to 10 m further each),
    // a lime every 8 to 9.5 m along a row. EACH LIME CARRIES ITS OWN CROWN: a dome over its bole, a ring of leaf masses
    // on boughs that fork up into them, and small clumps on forks of those boughs. A crown reaches half the way to the
    // lime's nearest neighbour (times a draw of its own, 0.88 to 1.12), so crowns touch along the rows and sky stands
    // between them where the trunks stand widest; one factor on every reach alike is set so that the share of the roof
    // that is open, seen from straight above between the first lime and the last, is the grove's own draw (0.26 to
    // 0.32). Each lime of the two nearest rows throws one mass out over the line, so the way is roofed. The cell keeps
    // a clearing of 9 m. THE BOLES: 0.5 to 1.3 m through at a man's breast, each its own, flared at the foot into four
    // to six roots; about one in six forks low (its first bough leaves it 1.6 to 3 m up, as thick as a second stem).
    const limes = [], skirt = [], cellAC = [CELL.a, CELL.c + 4], cellW = lineW(CELL.a, CELL.c), pineW = lineW(PINE.a, PINE.c);
    // what the grove's own surfaces share: its frame, its roof's map (made below), its light and its haze
    const GROVE = { a0: groveA0, a1: groveA1, half: 40, roofY: 14, open: 0, share: 0, gaps: [], tex: null, tx: 0.5 };
    {
      const bark = lin('#77726a');
      // (the boles' stores, sized once the limes are dealt: a lime has at most 154 corners and 390 index entries)
      let BP, BN, BC, BI, bn = 0, bi = 0;
      // (the leaves' stores, sized once the limes are dealt)
      let LP, LM, LK, LI, ln = 0, li = 0;
      // three greens, each lighter above than under; the underwood's is the darkest
      const GREENS = [[lin('#3a6b3c'), lin('#1f4428')], [lin('#2f6646'), lin('#1b3f30')], [lin('#47703a'), lin('#254a2a')], [lin('#2c5633'), lin('#1a3a24')]];
      // eight uneven shapes of a leaf body, each by a number of its own (where the body's outline is eaten deeper)
      const WORN = []; for (let v = 0; v < 8; v++) WORN.push(R.grove.range(0, 40));
      const shades = (rng, n) => { const s = new Float32Array(n); for (let i = 0; i < n; i++) s[i] = rng(); return s; };
      // a tapering limb of n sides from p0 to p1, each corner's shade from sh
      const limb = (p0, p1, r0, r1, n, sh) => {
        const base = bn, d = new THREE.Vector3().subVectors(p1, p0).normalize(), u = new THREE.Vector3().crossVectors(d, Math.abs(d.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize(), v = new THREE.Vector3().crossVectors(d, u);
        let j = 0;
        for (let e = 0; e < 2; e++) { const q = e ? p1 : p0, r = e ? r1 : r0; for (let k = 0; k < n; k++) { const an = k / n * TAU, ca = Math.cos(an), sa = Math.sin(an), s = 0.78 + 0.22 * sh[j++], nx = u.x * ca + v.x * sa, ny = u.y * ca + v.y * sa, nz = u.z * ca + v.z * sa, o = bn++ * 3; BP[o] = q.x + nx * r; BP[o + 1] = q.y + ny * r; BP[o + 2] = q.z + nz * r; BN[o] = nx; BN[o + 1] = ny; BN[o + 2] = nz; BC[o] = bark[0] * s; BC[o + 1] = bark[1] * s; BC[o + 2] = bark[2] * s; } }
        for (let k = 0; k < n; k++) { const p = base + k, q = base + (k + 1) % n; BI[bi] = p; BI[bi + 1] = q; BI[bi + 2] = p + n; BI[bi + 3] = q; BI[bi + 4] = q + n; BI[bi + 5] = p + n; bi += 6; }
      };
      // A LUMP OF LEAVES IS ROUND IN ITS SHADING. What is built of it is a case of twenty faces that holds it (a ball
      // rx across and ry tall about its middle; the case's corners stand 1.27 of that out, turned by the lump's own
      // turn); the leaf shader finds, on every look through the case, where that look meets the ball, and draws the
      // ball there: its own facing, its own place, lighter above, ragged at the rim. Each corner carries the
      // ball's middle, its two half-widths, its green and its shape's number.
      const lump = (cx, cy, cz, rx, ry, wornI, turn, green) => {
        const ct = Math.cos(turn) * 1.27, st = Math.sin(turn) * 1.27, base = ln, shape = (WORN[wornI] * 0.173 + turn * 0.41) % 1;
        for (let i = 0; i < CASE.n; i++) {
          const x0 = CASE.pos[i * 3], y = CASE.pos[i * 3 + 1], z0 = CASE.pos[i * 3 + 2], o = ln * 3, o4 = ln * 4; ln++;
          LP[o] = cx + (x0 * ct - z0 * st) * rx; LP[o + 1] = cy + y * 1.27 * ry; LP[o + 2] = cz + (x0 * st + z0 * ct) * rx;
          LM[o] = cx; LM[o + 1] = cy; LM[o + 2] = cz; LK[o4] = rx; LK[o4 + 1] = ry; LK[o4 + 2] = green; LK[o4 + 3] = shape;
        }
        for (let i = 0; i < CASE.idx.length; i++) LI[li++] = base + CASE.idx[i];
      };
      // every lime as the rows deal it: its place, height, lean, its dome, its boughs and their masses
      const lime = (a, c, near) => {
        const [x, z] = lineW(a, c), y = groundAt(x, z), H = R.grove.range(22, 28), clear = R.grove.range(7, 9), r = R.grove.range(0.3, 0.45), foot = new THREE.Vector3(x, y - 0.3, z), top = new THREE.Vector3(x + R.grove.range(-0.6, 0.6), y + H * 0.74, z + R.grove.range(-0.6, 0.6));
        const t = { x, y, z, a, c, near, H, clear, r, foot, top, trunk: [shades(R.grove, 16), shades(R.grove, 16), shades(R.grove, 16)], boughs: [], over: null, clumps: [] };
        limes.push(t);
        t.dome = { rx: R.grove.range(5.6, 6.8), ry: H * 0.24, worn: R.grove.int(0, 7), turn: R.grove.range(0, TAU) };
        const nb = near ? 4 : 3, a0 = R.grove.range(0, TAU);
        for (let k = 0; k < nb; k++) {
          const an = a0 + (k + R.grove.range(-0.2, 0.2)) / nb * TAU, out = R.grove.range(4.2, 5.6), ly = y + R.grove.range(13.4, 16), sh = shades(R.grove, 10);
          t.boughs.push({ an, out, ly, sh, at: (clear + k * 0.9 - 0.3) / (H * 0.74), rx: R.grove.range(3.8, 4.8), ry: R.grove.range(2.8, 3.3), worn: R.grove.int(0, 7), turn: R.grove.range(0, TAU) });
        }
        if (near) t.over = { a: a + R.grove.range(-1.5, 1.5), c: c * 0.36, y: y + R.grove.range(14, 16), rx: R.grove.range(4.4, 5.2), ry: 3, worn: R.grove.int(0, 7), turn: R.grove.range(0, TAU) };
      };
      for (const side of [-1, 1]) for (let row = 0; row < 4; row++) {
        const c0 = row ? 7 + row * 9.5 : 7;
        for (let a = groveA0 + R.grove.range(0, 3) + (row % 2) * 4; a < groveA1 + (row ? 3 : -1); a += R.grove.range(8, 9.5)) {
          const c = side * (c0 + R.grove.range(-1, 1));
          if (Math.hypot(a - cellAC[0], c - cellAC[1]) < 9) continue;
          lime(a, c, row === 0);
        }
        await ctx.yield();
      }
      // the grove's skirt: an underwood of low leaf lumps (3 to 7 m) along both its long sides beyond the outermost rows,
      // so that no open land shows between the boles
      for (const side of [-1, 1]) for (let a = groveA0 - 4; a < groveA1 + 6; a += R.grove.range(4.5, 6)) {
        const c = side * R.grove.range(41, 45), [x, z] = lineW(a, c), h = R.grove.range(3, 7);
        skirt.push({ a, c, x, z, h, y: groundAt(x, z) + h * 0.45, rx: R.grove.range(3.4, 4.6), ry: h * 0.62, worn: R.grove.int(0, 7), turn: R.grove.range(0, TAU) });
      }
      await ctx.yield();
      // each lime's reach (half the way to its nearest neighbour, on the flat), its bole and roots, its clumps
      const reaches = (t) => {
        let d = 1e9; for (const o of limes) if (o !== t) d = Math.min(d, Math.hypot(o.x - t.x, o.z - t.z));
        t.reach = clamp(d / 2, 3.6, 5.4) * R.crowns.range(0.88, 1.12); t.green = R.crowns.int(0, 2);
        for (let k = 0; k < 5; k++) t.clumps.push({ bough: k % t.boughs.length, an: R.crowns.range(-0.9, 0.9), out: R.crowns.range(0.55, 1), up: R.crowns.range(-0.6, 2.6), r: R.crowns.range(1.3, 2.1), worn: R.crowns.int(0, 7), turn: R.crowns.range(0, TAU), green: R.crowns.int(0, 2), sh: shades(R.crowns, 6) });
        // (the bole is 2.24 times its girth number through at a man's breast: 0.5 to 1.3 m)
        t.girth = t.r * R.boles.range(0.75, 1.29); t.forked = R.boles.chance(0.17) ? R.boles.range(1.6, 3) : 0;
        t.roots = []; const nr = R.boles.int(4, 6), r0 = R.boles.range(0, TAU);
        for (let k = 0; k < nr; k++) t.roots.push({ an: r0 + (k + R.boles.range(-0.3, 0.3)) / nr * TAU, len: R.boles.range(2.6, 4.4), h: R.boles.range(0.5, 1.1), sh: R.boles.range(0.7, 1) });
      };
      for (const t of limes) reaches(t);
      GROVE.share = R.crowns.range(0.26, 0.32);
      await ctx.yield();
      // a lime's crown at the factor F on every reach: the leaf bodies it carries
      const crown = (t, F, out) => {
        const s = t.reach * F, d = t.dome;
        out.push({ x: t.top.x, y: t.y + t.H * 0.75, z: t.top.z, rx: d.rx / 6.2 * 0.72 * s, ry: d.ry * 0.85, worn: d.worn, turn: d.turn, green: t.green, small: false });
        for (const b of t.boughs) { const o = b.out / 4.9 * 0.5 * s; b.x = t.x + Math.cos(b.an) * o; b.z = t.z + Math.sin(b.an) * o; out.push({ x: b.x, y: b.ly, z: b.z, rx: b.rx / 4.3 * 0.56 * s, ry: b.ry, worn: b.worn, turn: b.turn, green: t.green, small: false }); }
        if (t.over) { const v = t.over, [ox, oz] = lineW(v.a, v.c); out.push({ x: ox, y: v.y, z: oz, rx: v.rx / 4.8 * 0.9 * s, ry: v.ry, worn: v.worn, turn: v.turn, green: t.green, small: false }); }
        for (const q of t.clumps) { const b = t.boughs[q.bough], an = b.an + q.an, o = q.out * s; q.x = t.x + Math.cos(an) * o; q.z = t.z + Math.sin(an) * o; q.y = b.ly + q.up; out.push({ x: q.x, y: q.y, z: q.z, rx: q.r, ry: q.r * 0.8, worn: q.worn, turn: q.turn, green: q.green, small: true }); }
        return out;
      };
      // the share of the roof that is open between the first lime and the last, 40 m either side, on a net of half metres
      // (the net is held a byte to a cell, in a store of whole fours of bytes so that it can be counted four cells at a time)
      const NA2 = Math.ceil((groveA1 - groveA0) * 2), NC2 = 160, netStore = new ArrayBuffer(Math.ceil(NA2 * NC2 / 4) * 4), net = new Uint8Array(netStore, 0, NA2 * NC2), net4 = new Uint32Array(netStore);
      // (every body's place and size run straight with the factor: each is held as its place and size at factor 0 and what one whole factor adds)
      const BODY = [];
      const bodies = (t) => { const q0 = crown(t, 0, []), q1 = crown(t, 1, []); for (let k = 0; k < q0.length; k++) { const [a0, c0] = isle.lineAC(q0[k].x, q0[k].z), [a1, c1] = isle.lineAC(q1[k].x, q1[k].z); BODY.push(a0, c0, a1 - a0, c1 - c0, q0[k].rx, q1[k].rx - q0[k].rx); } };
      for (const t of limes) bodies(t);
      const openAt = (F) => {
        net.fill(0);
        for (let b = 0; b < BODY.length; b += 6) {
          const a = BODY[b] + BODY[b + 2] * F, c = BODY[b + 1] + BODY[b + 3] * F, rr = (BODY[b + 4] + BODY[b + 5] * F) * 0.97, i0 = Math.max(0, Math.floor((a - rr - groveA0) * 2)), i1 = Math.min(NA2 - 1, Math.ceil((a + rr - groveA0) * 2)), j0 = Math.max(0, Math.floor((c - rr + 40) * 2)), j1 = Math.min(NC2 - 1, Math.ceil((c + rr + 40) * 2));
          // (row by row: the cells whose middles lie inside the body's round)
          for (let j = j0; j <= j1; j++) {
            const dc = (j + 0.5) / 2 - 40 - c, h2 = rr * rr - dc * dc; if (h2 <= 0) continue;
            const h = Math.sqrt(h2), ia = Math.max(i0, Math.floor(2 * (a - h - groveA0) - 0.5) + 1), ib = Math.min(i1, Math.ceil(2 * (a + h - groveA0) - 0.5) - 1);
            if (ib >= ia) net.fill(1, j * NA2 + ia, j * NA2 + ib + 1);
          }
        }
        return 1 - covered() / net.length;
      };
      // (the covered cells, counted four at a time: each byte is 0 or 1, and the four of a word add up in its top byte)
      const covered = () => { let n = 0; for (let k = 0; k < net4.length; k++) n += Math.imul(net4[k], 0x01010101) >>> 24; return n; };
      let F0 = 0.6, F1 = 1.6;
      for (let it = 0; it < 12; it++) { const F = (F0 + F1) / 2; if (openAt(F) > GROVE.share) F0 = F; else F1 = F; if (it % 2 === 1) await ctx.yield(); }
      const FACTOR = (F0 + F1) / 2; GROVE.open = openAt(FACTOR); GROVE.factor = FACTOR; GROVE.net = { cells: net, na: NA2, nc: NC2 };
      await ctx.yield();
      // no leaf body within 2 m of the line: a body that would stand so near is not grown (tested at every 2 m of the line)
      const lineAt = []; for (let s = m.grove0 - 40; s <= m.grove1 + 40; s += 2) lineAt.push(path.posAtDist(s, new THREE.Vector3()));
      // (a place of the line further along the grove's frame than the body's need is further than that from it: only the others are measured)
      const lineA = lineAt.map((p) => isle.lineAC(p.x, p.z)[0]);
      const clearOfLine = (q) => { const need = Math.max(q.rx, q.ry) * 1.22 + 2, n2 = need * need, qa = isle.lineAC(q.x, q.z)[0], lo = qa - need - 0.01, hi = qa + need + 0.01; for (let k = 0; k < lineAt.length; k++) { const la = lineA[k]; if (la < lo || la > hi) continue; const p = lineAt[k], dx = p.x - q.x, dy = p.y - q.y, dz = p.z - q.z; if (dx * dx + dy * dy + dz * dz < n2) return false; } return true; };
      const roof = []; GROVE.roof = roof; GROVE.lineAt = lineAt;
      { const nv = (limes.length * 11 + skirt.length) * CASE.n; LP = new Float32Array(nv * 3); LM = new Float32Array(nv * 3); LK = new Float32Array(nv * 4); LI = new Uint32Array((limes.length * 11 + skirt.length) * CASE.idx.length); BP = new Float32Array(limes.length * 154 * 3); BN = new Float32Array(limes.length * 154 * 3); BC = new Float32Array(limes.length * 154 * 3); BI = new Uint32Array(limes.length * 390); }
      const grow = (t) => {
        for (const q of crown(t, FACTOR, [])) if (clearOfLine(q)) { roof.push(q); lump(q.x, q.y, q.z, q.rx, q.ry, q.worn, q.turn, q.green); }
        const g = t.girth, f = t.foot, top = t.top, at = (k) => f.clone().lerp(top, k), hip = f.clone().setY(t.y + 0.9);
        limb(f, hip, g * 1.5, g * 1.12, 8, t.trunk[0]); limb(hip, at(0.42), g * 1.12, g * 0.9, 8, t.trunk[1]); limb(at(0.42), top, g * 0.9, g * 0.4, 8, t.trunk[2]);
        // boughs leave the bole above its clear height (a forked lime's first bough far lower, and thick) and rise into their masses
        t.boughs.forEach((b, k) => {
          const low = k === 0 && t.forked, from = at(low ? (t.forked + 0.3) / (t.H * 0.74) : b.at), to = new THREE.Vector3(b.x, b.ly, b.z);
          limb(from, to, g * (low ? 0.74 : 0.42), g * (low ? 0.22 : 0.16), 5, b.sh); b.from = from; b.to = to;
        });
        for (const q of t.clumps) { const b = t.boughs[q.bough]; limb(b.from.clone().lerp(b.to, 0.62), new THREE.Vector3(q.x, q.y, q.z), g * 0.13, g * 0.05, 3, q.sh); }
        // the roots: ridges from the bole's flank down and out to the floor
        for (const rt of t.roots) {
          const ca = Math.cos(rt.an), sa = Math.sin(rt.an), P = (an, rad, y) => new THREE.Vector3(t.x + Math.cos(an) * rad, y, t.z + Math.sin(an) * rad);
          const A = P(rt.an, g * 1.3, t.y + rt.h), tx = t.x + ca * g * rt.len, tz = t.z + sa * g * rt.len, Tt = new THREE.Vector3(tx, groundAt(tx, tz) - 0.06, tz), B1 = P(rt.an - 0.62, g * 1.8, t.y - 0.2), B2 = P(rt.an + 0.62, g * 1.8, t.y - 0.2);
          for (const [p, q, r2] of [[A, B1, Tt], [A, Tt, B2]]) {
            const base = bn, n = new THREE.Vector3().subVectors(q, p).cross(new THREE.Vector3().subVectors(r2, p)).normalize(); if (n.y < 0) n.negate();
            for (const v of [p, q, r2]) { const o = bn++ * 3, s = rt.sh * (v === Tt ? 0.7 : 0.9); BP[o] = v.x; BP[o + 1] = v.y; BP[o + 2] = v.z; BN[o] = n.x; BN[o + 1] = n.y; BN[o + 2] = n.z; BC[o] = bark[0] * s; BC[o + 1] = bark[1] * s; BC[o + 2] = bark[2] * s; }
            BI[bi] = base; BI[bi + 1] = base + 1; BI[bi + 2] = base + 2; bi += 3;
          }
        }
      };
      for (let ti = 0; ti < limes.length; ti++) { if (ti % 12 === 11) await ctx.yield(); grow(limes[ti]); }
      await ctx.yield();
      for (const q of skirt) lump(q.x, q.y, q.z, q.rx, q.ry, q.worn, q.turn, 3);
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.BufferAttribute(BP.slice(0, bn * 3), 3)); bg.setAttribute('normal', new THREE.BufferAttribute(BN.slice(0, bn * 3), 3)); bg.setAttribute('color', new THREE.BufferAttribute(BC.slice(0, bn * 3), 3)); bg.setIndex(new THREE.BufferAttribute(BI.slice(0, bi), 1));
      GROVE.boles = bg;
      await ctx.yield();
      const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.BufferAttribute(LP.slice(0, ln * 3), 3)); lg.setAttribute('aMid', new THREE.BufferAttribute(LM.slice(0, ln * 3), 3)); lg.setAttribute('aBall', new THREE.BufferAttribute(LK.slice(0, ln * 4), 4)); lg.setIndex(new THREE.BufferAttribute(LI.slice(0, li), 1));
      leafRoof.uniforms.uGreens.value = GREENS.flatMap((g) => [new THREE.Color(g[0][0], g[0][1], g[0][2]), new THREE.Color(g[1][0], g[1][1], g[1][2])]);
      lg.computeBoundingSphere();
      GROVE.leaves = lg;
    }
    { const boles = new THREE.Mesh(GROVE.boles, barkMat); boles.name = 'lime-boles'; scene.add(boles); }
    { const roofMesh = new THREE.Mesh(GROVE.leaves, leafRoof); roofMesh.name = 'lime-crowns'; roofMesh.userData = { open: GROVE.open, share: GROVE.share, factor: GROVE.factor, limes: limes.length, bodies: GROVE.roof.length }; scene.add(roofMesh); }
    // THE ROOF'S MAP, from the crowns, the underwood and the boles as they stand
    {
      const B = groveU.uGBox.value, a0 = B.x, c0 = B.y, TX = GROVE.tx, W = Math.round(1 / B.z / TX), Hh = Math.round(1 / B.w / TX), ux = upSunAC[0], uc = upSunAC[1], cot = upSunAC[2];
      // (cover: under a crown; dark: in the roof's shade; nine: how many of the nine texels about one are in that shade)
      const cover = new Uint8Array(W * Hh), dark = new Uint8Array(W * Hh), nine = new Uint8Array(W * Hh), data = new Uint8Array(W * Hh * 4);
      // every texel within rr of the stretch from (a, c) to (a1, c1), with its distance from it (row by row; on each
      // row only the texels the stretch can reach)
      const stamp = (a, c, a1, c1, rr, f) => {
        const i0 = Math.max(0, Math.floor((Math.min(a, a1) - rr - a0) / TX)), i1 = Math.min(W - 1, Math.ceil((Math.max(a, a1) + rr - a0) / TX)), j0 = Math.max(0, Math.floor((Math.min(c, c1) - rr - c0) / TX)), j1 = Math.min(Hh - 1, Math.ceil((Math.max(c, c1) + rr - c0) / TX));
        const da = a1 - a, dc = c1 - c, l2 = da * da + dc * dc || 1, r2 = rr * rr, slant = Math.abs(dc) > 0.2 * Math.sqrt(l2), wide = slant ? rr * Math.sqrt(l2) / Math.abs(dc) + TX : 0;
        for (let j = j0; j <= j1; j++) {
          const pc = c0 + (j + 0.5) * TX - c; let ia = i0, ib = i1;
          if (slant) { const mid = a + da * pc / dc; ia = Math.max(i0, Math.floor((mid - wide - a0) / TX)); ib = Math.min(i1, Math.ceil((mid + wide - a0) / TX)); }
          for (let i = ia; i <= ib; i++) {
            const pa = a0 + (i + 0.5) * TX - a, t = clamp((pa * da + pc * dc) / l2, 0, 1), ea = pa - da * t, ec = pc - dc * t, d2 = ea * ea + ec * ec;
            if (d2 < r2) f(j * W + i, d2);
          }
        }
      };
      // (a crown's round, row by row)
      const round = (a, c, rr) => {
        const j0 = Math.max(0, Math.floor((c - rr - c0) / TX)), j1 = Math.min(Hh - 1, Math.ceil((c + rr - c0) / TX));
        for (let j = j0; j <= j1; j++) {
          const dc = c0 + (j + 0.5) * TX - c, h2 = rr * rr - dc * dc; if (h2 <= 0) continue;
          const h = Math.sqrt(h2), ia = Math.max(0, Math.floor((a - h - a0) / TX - 0.5) + 1), ib = Math.min(W - 1, Math.ceil((a + h - a0) / TX - 0.5) - 1);
          if (ib >= ia) cover.fill(1, j * W + ia, j * W + ib + 1);
        }
      };
      for (let k = 0; k < GROVE.roof.length; k++) { const q = GROVE.roof[k], [a, c] = isle.lineAC(q.x, q.z); round(a, c, q.rx * 0.97); if (k % 300 === 299) await ctx.yield(); }
      await ctx.yield();
      // the crowns' screen thrown down-sun; then the underwood's shadows and the boles'
      const S = GROVE.roofY * cot, di = Math.round(ux * S / TX), dj = Math.round(uc * S / TX);
      const thrown = () => { const i0 = Math.max(0, -di), e = Math.min(W, W - di); if (e > i0) for (let j = Math.max(0, -dj); j < Math.min(Hh, Hh - dj); j++) dark.set(cover.subarray((j + dj) * W + i0 + di, (j + dj) * W + e + di), j * W + i0); };
      thrown();
      await ctx.yield();
      // (a lump's shadow, a stretch with a round at either end, row by row: on each row what the two rounds and the band between them cover)
      const shade = (a, c, a1, c1, rr) => {
        const j0 = Math.max(0, Math.floor((Math.min(c, c1) - rr - c0) / TX)), j1 = Math.min(Hh - 1, Math.ceil((Math.max(c, c1) + rr - c0) / TX)), da = a1 - a, dc = c1 - c, len = Math.hypot(da, dc) || 1;
        for (let j = j0; j <= j1; j++) {
          const pc = c0 + (j + 0.5) * TX; let lo = 1e9, hi = -1e9;
          for (let e = 0; e < 2; e++) { const ea = e ? a1 : a, ec = e ? c1 : c, h2 = rr * rr - (pc - ec) * (pc - ec); if (h2 > 0) { const h = Math.sqrt(h2); lo = Math.min(lo, ea - h); hi = Math.max(hi, ea + h); } }
          // (the band: within rr of the stretch's line and between its two ends)
          if (Math.abs(dc) > 1e-6) {
            const mid = a + da * (pc - c) / dc, wide = rr * len / Math.abs(dc), e0 = a + (0 - (pc - c) * dc) / (da || 1e-9), e1 = a + (len * len - (pc - c) * dc) / (da || 1e-9);
            const bl = Math.max(mid - wide, Math.min(e0, e1)), bh = Math.min(mid + wide, Math.max(e0, e1));
            if (bh > bl) { lo = Math.min(lo, bl); hi = Math.max(hi, bh); }
          }
          const ia = Math.max(0, Math.floor((lo - a0) / TX - 0.5) + 1), ib = Math.min(W - 1, Math.ceil((hi - a0) / TX - 0.5) - 1);
          if (ib >= ia) dark.fill(1, j * W + ia, j * W + ib + 1);
        }
      };
      for (const q of skirt) { const L = q.h * 1.07 * cot; shade(q.a, q.c, q.a - ux * L, q.c - uc * L, q.rx * 0.9); }
      await ctx.yield();
      // the sun's own width softens every edge of the roof's shade by half a metre either way: a texel is as dark as the
      // share of the nine about it that are in shade. (Along each row first, by its runs of shade: three inside a run,
      // two at its ends, one beside it; then the rows above and below are added as the map is written.)
      const along = () => {
        let ia = dark.indexOf(1);
        while (ia !== -1) {
          const r0 = ia - ia % W, r1 = r0 + W; let ib = dark.indexOf(0, ia); if (ib === -1 || ib > r1) ib = r1; ib--;
          if (ia > r0) nine[ia - 1]++; if (ib < r1 - 1) nine[ib + 1]++;
          if (ib === ia) nine[ia]++; else { nine[ia] += 2; nine[ib] += 2; if (ib - ia > 1) nine.fill(3, ia + 1, ib); }
          ia = dark.indexOf(1, ib + 1);
        }
      };
      along();
      const LIT = [255, 227, 198, 170, 142, 113, 85, 57, 28, 0];
      const pack = () => { for (let j = 1; j < Hh - 1; j++) for (let i = 1, k = j * W + 1; i < W - 1; i++, k++) { data[k * 4] = LIT[nine[k - W] + nine[k] + nine[k + W]]; data[k * 4 + 1] = cover[k] * 255; } };
      pack();
      await ctx.yield();
      // then the boles' own shadows, each by a texel's own distance from the bole's ray (soft over one texel), and the nearness of a bole
      const boleShade = (t) => {
        const L = Math.min(t.H * 0.74 * cot, 40), rr = t.girth * 1.1;
        stamp(t.a, t.c, t.a - ux * L, t.c - uc * L, rr + TX / 2, (k, d2) => { const v = Math.floor(smoothstep(rr - TX / 2, rr + TX / 2, Math.sqrt(d2)) * 255 + 0.5); if (v < data[k * 4]) data[k * 4] = v; });
        stamp(t.a, t.c, t.a, t.c, 3.2, (k, d2) => { const v = Math.floor((1 - Math.sqrt(d2) / 3.2) * 255 + 0.5); if (v > data[k * 4 + 2]) data[k * 4 + 2] = v; });
      };
      for (let ti = 0; ti < limes.length; ti++) { boleShade(limes[ti]); if (ti % 30 === 29) await ctx.yield(); }
      await ctx.yield();
      // (the map's rim is open sun, under no crown and near no bole)
      for (let i = 0; i < W; i++) for (const k of [i, (Hh - 1) * W + i]) { data[k * 4] = 255; data[k * 4 + 1] = 0; data[k * 4 + 2] = 0; }
      for (let j = 0; j < Hh; j++) for (const k of [j * W, j * W + W - 1]) { data[k * 4] = 255; data[k * 4 + 1] = 0; data[k * 4 + 2] = 0; }
      GROVE.data = data; GROVE.size = [W, Hh];
      const tex = new THREE.DataTexture(data, W, Hh, THREE.RGBAFormat); tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 8; tex.needsUpdate = true;
      GROVE.tex = tex; groveU.uGMap.value = tex; groveU.uGTex.value.set(W, Hh);
      await ctx.yield();
      // THE GAPS: where the open roof is widest between crowns (the middles of its open places, by the metres to the
      // nearest crown on the net of half metres; a place 1.2 m and more from every crown, the widest for 2 m round)
      const { cells, na, nc } = GROVE.net, dt = new Float32Array(na * nc), wide = [];
      const widest = () => {
        // (a cell under a crown is 0 and asks nothing. An open cell is no further from a crown than any neighbour is, and
        // one step more: swept forward, then back; on the way back the cells 1.2 m and more from every crown are noted)
        for (let j = 0; j < nc; j++) for (let i = 0, k = j * na; i < na; i++, k++) {
          if (cells[k]) continue;
          if (!i || !j || i === na - 1 || j === nc - 1) { dt[k] = 1; continue; }
          let v = 1e3, w = dt[k - 1] + 1; if (w < v) v = Math.fround(w); w = dt[k - na] + 1; if (w < v) v = Math.fround(w); w = dt[k - na - 1] + 1.414; if (w < v) v = Math.fround(w); w = dt[k - na + 1] + 1.414; if (w < v) v = Math.fround(w); dt[k] = v;
        }
        for (let j = nc - 2; j > 0; j--) for (let i = na - 2, k = j * na + i; i > 0; i--, k--) {
          let v = dt[k]; if (v === 0) continue;
          let w = dt[k + 1] + 1; if (w < v) v = Math.fround(w); w = dt[k + na] + 1; if (w < v) v = Math.fround(w); w = dt[k + na + 1] + 1.414; if (w < v) v = Math.fround(w); w = dt[k + na - 1] + 1.414; if (w < v) v = Math.fround(w); dt[k] = v;
          if (v >= 2.4 && i >= 4 && i < na - 4 && j >= 4 && j < nc - 4) wide.push(k);
        }
        // (of those, the widest for 2 m round, in the order of the net)
        for (let n = wide.length - 1; n >= 0; n--) {
          const k = wide[n], d = dt[k]; if (dt[k - 1] > d || dt[k + 1] > d || dt[k - na] > d || dt[k + na] > d) continue;
          const i = k % na, j = (k - i) / na;
          let top = true; for (let q = -4; q <= 4 && top; q++) for (let p = -4; p <= 4; p++) { const o = k + q * na + p; if (o !== k && (dt[o] > d || (dt[o] === d && o < k))) { top = false; break; } }
          if (top) GROVE.gaps.push({ a: groveA0 + (i + 0.5) / 2, c: (j + 0.5) / 2 - 40, r: d / 2 });
        }
      };
      widest();
    }
    await ctx.yield();
    // pines on the knoll's crown and along the wooded ridge (the headland's blue-green shade); a few on the dunes' backs
    const PINEC = { leaf: '#24402e', leafLight: '#3f6a44', leafDark: '#182c22', bark: '#6e4a36' };
    const pineGeo = [flora.pineGeometry({ rng: R.conifers, detail: 0, height: 15, ...PINEC })];
    await ctx.yield();
    pineGeo.push(flora.pineGeometry({ rng: R.conifers2, detail: 0, height: 19, ...PINEC }));
    await ctx.yield();
    const woods = flora.makeScatter({
      rng: R.woods, variants: pineGeo, material: leafMat, heightAt: groundAt, count: Math.round(70 * density), spacing: 4.5, scale: [0.75, 1.3], falloff: 0, corridor: 0,
      bounds: MX > 0 ? [-140, -330, 100, -170] : [-100, -330, 140, -170],
      density: (x, z) => { const h = isle.heightAt(x, z); return h > 14 ? 1 : 0; },
    });
    scene.add(woods.object); tick.push((dt, time, camera) => woods.update(dt, time, camera));
    await ctx.yield();
    {
      // the skerries: sea-worn bedded rock. Each is longer one way than the other, its beds dip to one side and stand
      // out as ledges; black and wet at the water, a paler band of barnacles over it, grey-brown above, its crown
      // whitened by birds. The storm's shade lies on it by the field at its own place.
      const PALE = lin('#b9b2a2'), WEED = lin('#2a3320'), total = skerries.reduce((sum, rk) => sum + rk.fm.B.idx.length * 3, 0), P = new Float32Array(total), N = new Float32Array(total), Cc = new Float32Array(total); let o = 0;
      // (the sea's doubles: the pine takes the first two places, its stem and its head; the inner water's rocks, up to six, the next; the first four of the strand's stones that stand in the water the last four)
      let nStand = 0; seaU.uStand.value[0].set(pineW[0], pineW[1], 0.5, 10); seaU.uStand.value[1].set(pineW[0], pineW[1], 3.5, 5.5); seaU.uStandY.value[1] = 14;
      const rock = (q) => {
        const rk = skerries[q], B = rk.fm.B, turn = rk.ph * 0.37, ct = Math.cos(turn), st = Math.sin(turn), long = 1.25 + 0.4 * Math.sin(rk.ph * 1.9), dip = 0.3 * Math.sin(rk.ph * 2.7);
        if (rk.inner && nStand < 6) seaU.uStand.value[2 + nStand++].set(rk.x, rk.z, rk.rad * 1.05, rk.h);
        if (q < NROCK && !rk.inner) { seaU.uRock.value[q].set(rk.x, rk.z, rk.rad * 1.08, 0.35 + 0.65 * stormAt(rk.x, rk.z)); seaU.uRockAx.value[q].set(ct, st, long); }
        const vp = new Float32Array(B.n * 3), vc = new Float32Array(B.n * 3);
        for (let i = 0; i < B.n; i++) {
          const x = B.pos[i * 3], y = B.pos[i * 3 + 1], z = B.pos[i * 3 + 2], n = rk.fm.n[i], k = 1 + n;
          // (the beds: height taken in soft steps along the dipping bedding, three to the rock)
          const bed = Math.max(0, y + dip * x), stepped = bed - 0.55 * Math.sin(bed * TAU * 3) / (TAU * 3), py = y > 0 ? stepped * rk.h * 1.3 * k : y * 2.5, lx = x * long * k, lz = z / Math.sqrt(long) * k;
          vp[i * 3] = rk.x + (lx * ct - lz * st) * rk.rad; vp[i * 3 + 1] = py; vp[i * 3 + 2] = rk.z + (lx * st + lz * ct) * rk.rad;
          const t = clamp(0.55 + n * 1.8, 0, 1), wet = smoothstep(0.1, 1.1, py), top = smoothstep(0.5, 0.95, y) * 0.65, band = smoothstep(0.4, 0.9, py) * (1 - smoothstep(1.1, 2.0, py)) * 0.5;
          let col = stormShade(mul3(mix3(mul3(mix3(ROCK, PALE, 0.25 + 0.3 * t), 0.5 + 0.7 * wet), PALE, Math.max(top, band)), 1.5), rk.x, rk.z);
          // (a rock of the still inner water stands in the sun: its stone darker and greyer, a skirt of dark weed to 0.6 m over the water, only its crown whitened)
          if (rk.inner) col = mix3(mix3(mul3(mix3(ROCK_D, ROCK, 0.3 + 0.5 * t), 0.75 + 0.35 * wet), PALE, Math.max(top * 0.9, band * 0.5)), WEED, smoothstep(0.75, 0.2, py) * 0.8);
          vc[i * 3] = col[0]; vc[i * 3 + 1] = col[1]; vc[i * 3 + 2] = col[2];
          // (where a bird can sit: the corners of an inner rock's crown)
          if (rk.inner && y > 0.62) rk.tops.push([vp[i * 3], py, vp[i * 3 + 2]]);
        }
        // (faceted: every face keeps its own light, so the beds read as rock)
        rk.v0 = o;
        for (let f = 0; f < B.idx.length; f += 3) {
          const i0 = B.idx[f] * 3, i1 = B.idx[f + 1] * 3, i2 = B.idx[f + 2] * 3, ux = vp[i1] - vp[i0], uy = vp[i1 + 1] - vp[i0 + 1], uz = vp[i1 + 2] - vp[i0 + 2], wx = vp[i2] - vp[i0], wy = vp[i2 + 1] - vp[i0 + 1], wz = vp[i2 + 2] - vp[i0 + 2];
          let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
          for (let e = 0; e < 3; e++) { const v = e === 0 ? i0 : e === 1 ? i1 : i2; P[o] = vp[v]; P[o + 1] = vp[v + 1]; P[o + 2] = vp[v + 2]; N[o] = nx; N[o + 1] = ny; N[o + 2] = nz; Cc[o] = vc[v]; Cc[o + 1] = vc[v + 1]; Cc[o + 2] = vc[v + 2]; o += 3; }
        }
        rk.v1 = o;
      };
      for (let q = 0; q < skerries.length; q++) { rock(q); await ctx.yield(); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
      // (every rock keeps its own skin, face by face, for the birds that will be sent round it)
      for (const rk of skerries) rk.skin = P.subarray(rk.v0, rk.v1);
      gather(g, false);
    }
    await ctx.yield();
    {
      // THE KNOLL'S SEAWARD CLIFF is the skerries' own rock: bedded, its beds standing out as LEDGES. Wherever the knoll
      // stands straight out of the sea its face is clad in strata from the water to its crown: a shelf at the head of
      // each bed (0.6 to 1.6 m out, 0.4 to 0.8 m thick, broken along the cliff), the wall of the bed above set back to
      // the rock, uneven and parted by upright joints; the whole stands 0.3 m and more proud of the knoll's ground, which
      // it hides. All the beds dip together as they run round the knoll. Black
      // and wet at the water, a paler band over it where the surf's spray reaches, grey-brown above, the shelves' tops
      // a little paler than the walls under them; faceted, so that every face keeps its own light. The storm's shade
      // lies on it by the field at its own place.
      const NB = 96, kx = KNOLL.x * MX, kz = KNOLL.z, PALE = lin('#b9b2a2'), OFF = 1.5, beds = [], DIP = { h: R.ledges.range(0.8, 1.6), ph: R.ledges.range(0, TAU) };
      for (let y = R.ledges.range(0.9, 1.6); y < 30; y += R.ledges.range(2.4, 4)) beds.push({ y, out: R.ledges.range(0.6, 1.6), thick: R.ledges.range(0.4, 0.8), ph: R.ledges.range(0, 40), tone: R.ledges.range(0.1, 0.4) });
      // (a bearing is seaward where the water lies a tenth of the knoll's radius outside its foot; the cladding thins away over three bearings at either end of the seaward run)
      const sea = []; for (let i = 0; i < NB; i++) { const th = i / NB * TAU; sea.push(isle.shore(kx + Math.cos(th) * KNOLL.r * 1.12, kz + Math.sin(th) * KNOLL.r * 1.12) < 0); }
      const edge = (i) => { let k = 0; while (k < 3 && sea[(i + k + 1) % NB] && sea[(i - k - 1 + NB) % NB]) k++; return k / 3; };
      const cols = [];
      const column = (i) => {
        if (!sea[i]) return null;
        const th = i / NB * TAU, cx = Math.cos(th), cz = Math.sin(th), prof = [], full = edge(i);
        for (let r = 36; r >= 14; r -= 0.5) prof.push(isle.heightAt(kx + cx * r, kz + cz * r));
        // the rock's radius at a height on this bearing
        const rAt = (y) => { let k = 0; while (k < prof.length - 1 && prof[k + 1] < y) k++; const h0 = prof[k], h1 = prof[Math.min(prof.length - 1, k + 1)]; return 36 - 0.5 * (k + clamp((y - h0) / Math.max(h1 - h0, 1e-3), 0, 1)); };
        const ring = [[rAt(0) + OFF * full + 0.3, -0.6, 0, 0]], dip = DIP.h * Math.sin(th * 2 + DIP.ph), o = OFF * full - 0.3 * (1 - full);
        // (the wall's unevenness at a place, metres out or in; a joint: a cleft 0.7 m deep where this bed's own noise runs high)
        const rough = (r, y, k) => 0.5 * isleNoise.n3((kx + cx * r) * 0.33, y * 0.5, (kz + cz * r) * 0.33) - 0.7 * smoothstep(0.3, 0.5, isleNoise.n2(cx * 8 + k * 3.1, cz * 8 - k * 1.7));
        for (let k = 0; k < beds.length; k++) {
          const b = beds[k], y = b.y + dip + 0.25 * isleNoise.n2(cx * 4 + b.ph, cz * 4), out = b.out * full * smoothstep(-0.15, 0.25, isleNoise.n2(cx * 2.6 + b.ph, cz * 2.6 + b.ph * 1.7));
          const yw = y - b.thick * 1.3 - 0.8, r0 = rAt(yw), rw = r0 + o + full * rough(r0, yw, k), ya = y - b.thick * 1.3, r1 = rAt(ya), ra = r1 + o + full * rough(r1, ya, k), ry = rAt(y);
          ring.push([rw, yw, b.tone, 0], [ra, ya, b.tone, 0], [Math.max(ra, ry + o + out * 0.85), y - b.thick, b.tone, 0.3], [Math.max(ra, ry + o + out), y, b.tone, 1], [rAt(y + 0.15) + o + full * rough(ry, y, k + 1), y + 0.15 + out * 0.1, b.tone, 1]);
        }
        const top = ring[ring.length - 1][1] + 2.5; ring.push([rAt(top) - 0.6, top, 0.3, 0]);
        return ring.map(([r, y, tone, shelf]) => {
          const x = kx + cx * r, z = kz + cz * r, n = isleNoise.n3(x * 0.23, y * 0.4, z * 0.23) * 0.3 + isleNoise.n3(x * 0.7, y * 0.9 + 7, z * 0.7) * 0.2;
          const wet = smoothstep(0.1, 1.4, y), spray = smoothstep(0.5, 1.6, y) * (1 - smoothstep(3, 7.5, y)) * 0.35;
          const col = stormShade(mul3(mix3(mul3(mix3(ROCK, PALE, clamp(tone + n * 1.4, 0, 1)), 0.55 + 0.5 * wet), PALE, Math.max(spray, shelf * 0.22)), 0.9), kx, kz);
          return [x + n * 0.5 * cz, y, z - n * 0.5 * cx, col];
        });
      };
      for (let i = 0; i < NB; i++) { cols.push(column(i)); if (i % 12 === 11) await ctx.yield(); }
      await ctx.yield();
      let nf = 0; for (let i = 0; i < NB; i++) { const A = cols[i], B = cols[(i + 1) % NB]; if (A && B) nf += (A.length - 1) * 2; }
      const P = new Float32Array(nf * 9), N = new Float32Array(nf * 9), Cc = new Float32Array(nf * 9); let o = 0;
      const corner = (q, nx, ny, nz, up) => { const c = q[3]; P[o] = q[0]; P[o + 1] = q[1]; P[o + 2] = q[2]; N[o] = nx; N[o + 1] = ny; N[o + 2] = nz; Cc[o] = c[0] * up; Cc[o + 1] = c[1] * up; Cc[o + 2] = c[2] * up; o += 3; };
      // (a face that looks down, the underside of a shelf, is wet and takes the surf's light from below: it is written paler by as much as it looks down; an upright face by half)
      const face = (a, b, c) => {
        const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = c[0] - a[0], wy = c[1] - a[1], wz = c[2] - a[2];
        let nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx; const nl = Math.hypot(nx, ny, nz) || 1; nx /= nl; ny /= nl; nz /= nl;
        const up = 1 + 2.4 * Math.max(0, -ny) + 0.3 * (1 - Math.abs(ny));
        corner(a, nx, ny, nz, up); corner(b, nx, ny, nz, up); corner(c, nx, ny, nz, up);
      };
      const strip = (i) => { const A = cols[i], B = cols[(i + 1) % NB]; if (A && B) for (let j = 0; j < A.length - 1; j++) { face(A[j], A[j + 1], B[j]); face(B[j], A[j + 1], B[j + 1]); } };
      for (let i = 0; i < NB; i++) { if (i % 24 === 23) await ctx.yield(); strip(i); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.BufferAttribute(N, 3)); g.setAttribute('color', new THREE.BufferAttribute(Cc, 3));
      gather(g, false);
    }
    await ctx.yield();
    // THE CLOVEN PINE, 26 m: ONE trunk, whole to a man's height (1.8 m), cloven from there up to its fork at 12 m: the
    // two halves lean 9 degrees apart, pale inner wood on their flat faces and clear sky between; each half carries its
    // own leader and crown above the fork. The cleft opens towards the sun.
    {
      const P = [], Cc = [], I = [], bark = lin('#7a5c4a'), wood = lin('#f2dcae'), FORK = 12, WHOLE = 1.8, LEAN = Math.tan(9 * RAD);
      for (const side of [-1, 1]) {
        const base = P.length / 3, NL = 18, NA = 8;
        for (let j = 0; j <= NL; j++) {
          const y = j / NL * FORK, t = j / NL, gap = LEAN * Math.max(0, y - WHOLE), r = lerp(0.74, 0.46, t) + 0.3 * Math.pow(1 - t, 6);
          for (let k = 0; k <= NA; k++) { const an = (k / NA - 0.5) * Math.PI, sh = 0.75 + 0.25 * R.cleft(); P.push(side * (gap + Math.cos(an) * r), y, Math.sin(an) * r); Cc.push(bark[0] * sh, bark[1] * sh, bark[2] * sh); }
          P.push(side * gap, y, r, side * gap, y, -r); Cc.push(...wood, ...wood);
        }
        const W = NA + 3;
        for (let j = 0; j < NL; j++) {
          for (let k = 0; k < NA; k++) { const p0 = base + j * W + k, p1 = p0 + 1, p2 = p0 + W, p3 = p2 + 1; if (side > 0) I.push(p0, p2, p1, p1, p2, p3); else I.push(p0, p1, p2, p1, p3, p2); }
          const p0 = base + j * W + NA + 1, p1 = p0 + 1, p2 = p0 + W, p3 = p2 + 1; if (side > 0) I.push(p0, p1, p2, p1, p3, p2); else I.push(p0, p2, p1, p1, p2, p3);
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I); g.computeVertexNormals();
      const px = pineW[0], py = groundAt(pineW[0], pineW[1]), cleft = new THREE.Mesh(g, plain), pine = new THREE.Group();
      // (the two halves stand either side of the sun's bearing, so the cleft opens towards the sun and daylight stands in it)
      pine.position.set(px, py - 0.2, pineW[1]); pine.rotation.y = Math.atan2(sunDir.x, sunDir.z);
      pine.add(cleft);
      await ctx.yield();
      for (const side of [-1, 1]) {
        const top = new THREE.Mesh(flora.pineGeometry({ rng: side > 0 ? R.leaders : R.leaders2, detail: 1, height: side > 0 ? 14.4 : 13, flex: 0.5, leaf: '#2f5a3a', leafLight: '#5f8f54', leafDark: '#1f3a2a', bark: '#7a5c4a' }), leafMat);
        top.position.set(side * (LEAN * (FORK - WHOLE) + 0.1), FORK - 0.6, 0); top.rotation.z = -side * 9 * RAD; top.rotation.y = side > 0 ? 0 : Math.PI; pine.add(top);
        await ctx.yield();
      }
      scene.add(pine);
    }
    await ctx.yield();
    // THE CELL: a rock face 7 m high among the limes, fronting the sea as the ridge does (square to the ridge's bearing), a
    // round-topped dark mouth 3 m high in it with one amber lamp, a stack of carried logs beside it
    const cellGround = groundAt(cellW[0], cellW[1]), south = new THREE.Vector3(-MX * ND[0], 0, -ND[1]);
    const cell = new THREE.Group(); cell.position.set(cellW[0], cellGround, cellW[1]); cell.rotation.y = Math.atan2(south.x, south.z);
    {
      const rock = new THREE.IcosahedronGeometry(1, 4), rp = rock.attributes.position, rc = new Float32Array(rp.count * 3), ca = lin('#8a7a68'), cb2 = lin('#5c5046');
      for (let i = 0; i < rp.count; i++) {
        let x = rp.getX(i), y = rp.getY(i), z = rp.getZ(i);
        const n = isleNoise.n3(x * 1.7 + 4, y * 1.7, z * 1.7) * 0.5 + isleNoise.n3(x * 4.3, y * 4.3 + 9, z * 4.3) * 0.2, k = 1 + n * 0.5;
        x *= 7.5 * k; y = Math.max(-0.08, y) * 7.2 * k; z *= 5 * k; if (z > 2.6) z = 2.6 + (z - 2.6) * 0.25;
        rp.setXYZ(i, x, y, z - 2.6);
        const sh = 0.5 + 0.5 * isleNoise.n3(x * 0.4, y * 0.4, z * 0.4), t = clamp(0.5 + n, 0, 1); rc.set([lerp(cb2[0], ca[0], t) * (0.7 + 0.3 * sh), lerp(cb2[1], ca[1], t) * (0.7 + 0.3 * sh), lerp(cb2[2], ca[2], t) * (0.7 + 0.3 * sh)], i * 3);
      }
      rock.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3)); rock.computeVertexNormals();
      cell.add(new THREE.Mesh(rock, plain));
      // the mouth: a round-topped dark opening set just proud of the face
      const ms = new THREE.Shape(); ms.moveTo(-1.25, 0); ms.lineTo(-1.25, 1.75); ms.absarc(0, 1.75, 1.25, Math.PI, 0, true); ms.lineTo(1.25, 0); ms.lineTo(-1.25, 0);
      const mouth = new THREE.Mesh(new THREE.ShapeGeometry(ms, 10), new THREE.MeshBasicMaterial({ color: '#15110f' })); mouth.position.set(0, 0, 0.28); cell.add(mouth);
      const lampGlow = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), new THREE.MeshBasicMaterial({ color: new THREE.Color('#f09a3a').multiplyScalar(3) })); lampGlow.position.set(0.55, 1.9, 0.5); cell.add(lampGlow);
      // (and its glow in the grove's haze: a round of amber 1 m about it, brightest at its middle from every side)
      const halo = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), new THREE.ShaderMaterial({ uniforms: { uCol: { value: new THREE.Color('#f09a3a').multiplyScalar(1.5) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`varying vec3 vN, vW; void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; varying vec3 vN, vW; void main() { float k = clamp(dot(normalize(vN), normalize(cameraPosition - vW)), 0., 1.); gl_FragColor = vec4(uCol * (k * k * k * k), 1.); }` }));
      halo.position.copy(lampGlow.position); halo.renderOrder = 4; cell.add(halo);
      const lamp = new THREE.PointLight('#f09a3a', 30, 16, 1.6); lamp.position.set(0.55, 1.9, 1.1); cell.add(lamp);
      const lampPh = [R.lamp.range(0, TAU), R.lamp.range(0, TAU)];
      tick.push((dt, time) => { lamp.intensity = 30 * (0.8 + 0.14 * Math.sin(time * 9.1 + lampPh[0]) + 0.08 * Math.sin(time * 23.7 + lampPh[1])); });
      // the logs: ten of them, 2.6 m long and 0.6 m thick, stacked four, three, two and one to one side of the mouth
      const logGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.6, 8).rotateZ(Math.PI / 2), logs = new THREE.InstancedMesh(logGeo, new THREE.MeshLambertMaterial({ color: '#8a6a48' }), 10), mm = new THREE.Matrix4();
      let li = 0; for (let row = 0; row < 4; row++) for (let k = 0; k < 4 - row; k++) { mm.makeRotationX(R.cell.range(0, 6)); mm.setPosition(5 + R.cell.range(-0.15, 0.15), 0.3 + row * 0.53, 1.3 + (k + row * 0.5) * 0.63); logs.setMatrixAt(li++, mm); }
      logs.count = li; cell.add(logs);
    }
    scene.add(cell);
    await ctx.yield();
    const clothesAt = new THREE.Vector3();
    // THE HUNG CLOTHES: six plain garments (shirts, hose, smocks: bodies, sleeves, legs) on a line between two limes of
    // the outermost row on the cell's side, 30 to 40 m from the line, stirring; the rope with them
    {
      const side = cellAC[1] < 0 ? -1 : 1, row = limes.filter((t) => t.c * side > 30).sort((p, q) => p.a - q.a);
      let bi = 0, bd = 1e9;
      for (let i = 0; i < row.length - 1; i++) { const d = Math.abs((row[i].a + row[i + 1].a) / 2 - (cellAC[0] - 12)); if (d < bd) { bd = d; bi = i; } }
      const A = new THREE.Vector3(row[bi].x, row[bi].y + 2.7, row[bi].z), B = new THREE.Vector3(row[bi + 1].x, row[bi + 1].y + 2.7, row[bi + 1].z), along = B.clone().sub(A), len = along.length(); along.normalize();
      const nrm = new THREE.Vector3(along.z, 0, -along.x), P = [], Cc = [], H = [], I = [];
      clothesAt.copy(A).lerp(B, 0.5);
      const dyes = R.clothes.shuffle(['#efe9dc', '#d9c9a4', '#9fb8cc', '#b8643c', '#f4f1e8', '#8a9a6a']).map(lin);
      // one hanging piece: from u0..u1 along the rope at drop y0, h long, its foot shifted by du and widened by k; folds run down it
      const piece = (mid, u0, u1, y0, h, du, k, dye, ph) => {
        const base = P.length / 3, NI = 4, NJ = 5;
        for (let j = 0; j <= NJ; j++) for (let i = 0; i <= NI; i++) {
          const t = j / NJ, u = lerp(u0, u1, i / NI), q = A.clone().addScaledVector(along, mid + (u0 + u1) / 2 + (u - (u0 + u1) / 2) * lerp(1, k, t) + du * t); P.push(q.x, q.y - 0.03 - y0 - t * h, q.z);
          const sh = (0.8 + 0.2 * Math.cos(i * 2.6 + ph)) * (0.9 + 0.1 * R.clothes()); Cc.push(dye[0] * sh, dye[1] * sh, dye[2] * sh); H.push(y0 + t * h, ph + i * 0.9);
        }
        for (let j = 0; j < NJ; j++) for (let i = 0; i < NI; i++) { const p0 = base + j * (NI + 1) + i; I.push(p0, p0 + NI + 1, p0 + 1, p0 + 1, p0 + NI + 1, p0 + NI + 2); }
      };
      for (let k = 0; k < 6; k++) {
        const mid = len * (0.14 + 0.72 * (k + 0.5) / 6), ph = R.clothes.range(0, TAU), dye = dyes[k], sc = R.clothes.range(0.9, 1.15), kind = k % 3;
        if (kind === 0) { piece(mid, -0.3 * sc, 0.3 * sc, 0, 0.8 * sc, 0, 1.08, dye, ph); piece(mid, -0.64 * sc, -0.3 * sc, 0.02, 0.46 * sc, -0.14, 0.8, dye, ph + 1); piece(mid, 0.3 * sc, 0.64 * sc, 0.02, 0.46 * sc, 0.14, 0.8, dye, ph + 2); }
        else if (kind === 1) { piece(mid, -0.27 * sc, 0.27 * sc, 0, 0.3 * sc, 0, 1, dye, ph); piece(mid, -0.27 * sc, -0.02 * sc, 0.3 * sc, 0.75 * sc, -0.03, 0.85, dye, ph + 1); piece(mid, 0.02 * sc, 0.27 * sc, 0.3 * sc, 0.75 * sc, 0.03, 0.85, dye, ph + 2); }
        else { piece(mid, -0.33 * sc, 0.33 * sc, 0, 1.1 * sc, 0, 1.4, dye, ph); piece(mid, -0.56 * sc, -0.33 * sc, 0.02, 0.3 * sc, -0.08, 0.9, dye, ph + 1); piece(mid, 0.33 * sc, 0.56 * sc, 0.02, 0.3 * sc, 0.08, 0.9, dye, ph + 2); }
      }
      // the rope: a thin flat strip
      { const base = P.length / 3; for (const q of [A, B]) for (const dy of [0.02, -0.02]) { P.push(q.x, q.y + dy, q.z); Cc.push(0.5, 0.42, 0.3); H.push(0, 0); } I.push(base, base + 1, base + 2, base + 1, base + 3, base + 2); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aHang', new THREE.Float32BufferAttribute(H, 2)); g.setIndex(I);
      const clothU = { ...groveU, uTime: { value: 0 }, uPush: { value: nrm }, uLight: twin.light.uSunCol, uSkyL: twin.light.uSky, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } };
      const clothes = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: clothU, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec3 color; attribute vec2 aHang; uniform float uTime; uniform vec3 uPush; varying vec3 vC, vW; varying float vS;
          #include <fog_pars_vertex>
          void main() {
            float sw = sin(uTime * 1.6 + aHang.y) * .5 + sin(uTime * 2.7 + aHang.y * 1.7) * .25 + .35;
            vec3 p = position + uPush * (sw * aHang.x * .42) + vec3(0., sw * aHang.x * aHang.x * .1, 0.);
            vC = color; vS = sw; vW = p;
            vec4 mvPosition = viewMatrix * vec4(p, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uLight, uSkyL; varying vec3 vC, vW; varying float vS;
          ${GROVE_GLSL}
          #include <fog_pars_fragment>
          void main() { gl_FragColor = vec4(vC * (uSkyL * .5 + uLight * (.14 + .3 * gSun(gAC(vW.xz), vW.y) + .06 * vS)), 1.); 
            #include <fog_fragment>
          }` }));
      scene.add(clothes); tick.push((dt, time) => { clothU.uTime.value = time; });
    }
    // rings of darker grass with pale mushrooms, 4 to 8 m off the line among the limes
    {
      const stem = new THREE.CylinderGeometry(0.025, 0.035, 0.11, 6).translate(0, 0.055, 0), cap = new THREE.SphereGeometry(0.09, 8, 5, 0, TAU, 0, Math.PI / 2).scale(1, 0.75, 1).translate(0, 0.1, 0);
      const sp = stem.attributes.position, cp = cap.attributes.position, si = stem.index.array, ci = cap.index.array, P = [...sp.array, ...cp.array], I = [...si]; for (const k of ci) I.push(k + sp.count);
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); mg.setIndex(I); mg.computeVertexNormals();
      const NR = 6, rings = new THREE.InstancedMesh(new THREE.RingGeometry(0.88, 1.1, 28).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#3d6a30' }), NR), shrooms = new THREE.InstancedMesh(mg, new THREE.MeshLambertMaterial({ color: '#efe6d0' }), NR * 18), mm = new THREE.Matrix4();
      let mi = 0;
      for (let k = 0; k < NR; k++) {
        const [x, z] = lineW(lerp(groveA0 + 6, groveA1 - 6, (k + R.shrooms.range(0.2, 0.8)) / NR), (k % 2 ? 1 : -1) * R.shrooms.range(4, 8)), rad = R.shrooms.range(1.2, 2.1), y = groundAt(x, z);
        mm.makeScale(rad, 1, rad); mm.setPosition(x, y + 0.15, z); rings.setMatrixAt(k, mm);
        const n = R.shrooms.int(11, 18);
        for (let j = 0; j < n; j++) { const an = (j + R.shrooms.range(-0.3, 0.3)) / n * TAU, sc = R.shrooms.range(0.6, 1.2), mx = x + Math.cos(an) * rad, mz = z + Math.sin(an) * rad; mm.makeScale(sc, sc, sc); mm.setPosition(mx, groundAt(mx, mz) + 0.1, mz); shrooms.setMatrixAt(mi++, mm); }
      }
      shrooms.count = mi; scene.add(rings, shrooms);
    }
    await ctx.yield();
    // THE CORN stands in rows 0.8 m apart that run each field's own way. The fields' map is baked once in the sands'
    // frame, 2 m to a cell: crop, metres to the field's edge, the field's tone, metres to the beaten path; and beside
    // it, cell by cell, the way the field's rows run. The meadow's ground is drawn from them in world metres (rows and
    // the soil between them, a bare wheeling at every eighth gap, the crop's tone drawn out in streaks along the rows,
    // baulks, the path, the mown round); on it the crop stands as walls of stalks and ears, 0.8 to 1 m apart, each crop
    // to its own height, within 40 m of the avenue's axis and as far as 90 m past the climb's foot. Long waves of wind
    // cross all the fields together, gusts go down the wind over them and lay the ears over, and the land's cloud
    // shadows lie on them.
    const ROW = 0.8;
    const FT = { a0: MEADOW.a0 - 4, c0: -218, cell: 2 }; FT.nx = Math.ceil((MEADOW.a1 + 4 - FT.a0) / FT.cell); FT.nz = Math.ceil(436 / FT.cell);
    const fieldData = new Uint8Array(FT.nx * FT.nz * 4), rowData = new Uint8Array(FT.nx * FT.nz * 4);
    const fieldRow = (j) => {
      const c = FT.c0 + (j + 0.5) * FT.cell, nearPath = c > DANCE.c - 14 && c < 14;
      for (let i = 0; i < FT.nx; i++) {
        const a = FT.a0 + (i + 0.5) * FT.cell, f = fieldAt(a, c), k = (j * FT.nx + i) * 4;
        let pd = 8; if (nearPath && a > PATHWAY.a0 && a < PATHWAY.a1 + 8) { const slope = (pathC(a + 1) - pathC(a - 1)) / 2; pd = Math.abs(c - pathC(a)) / Math.sqrt(1 + slope * slope); }
        fieldData[k] = f[0] * 85; fieldData[k + 1] = clamp(f[2] / 8, 0, 1) * 255; fieldData[k + 2] = f[1] * 255; fieldData[k + 3] = clamp(pd / 8, 0, 1) * 255;
        rowData[k] = f[3]; rowData[k + 1] = f[4]; rowData[k + 2] = f[5]; rowData[k + 3] = 255;
      }
    };
    for (let j = 0; j < FT.nz; j++) { fieldRow(j); if (j % 12 === 11) await ctx.yield(); }
    const fieldTex = new THREE.DataTexture(fieldData, FT.nx, FT.nz, THREE.RGBAFormat);
    fieldTex.magFilter = fieldTex.minFilter = THREE.LinearFilter; fieldTex.wrapS = fieldTex.wrapT = THREE.ClampToEdgeWrapping; fieldTex.generateMipmaps = false; fieldTex.needsUpdate = true;
    // (the way each field's rows run, cell by cell and never blended: the across-the-rows direction and the wheelings' offset)
    const rowTex = new THREE.DataTexture(rowData, FT.nx, FT.nz, THREE.RGBAFormat);
    rowTex.magFilter = rowTex.minFilter = THREE.NearestFilter; rowTex.wrapS = rowTex.wrapT = THREE.ClampToEdgeWrapping; rowTex.generateMipmaps = false; rowTex.needsUpdate = true;
    const FIELD_GLSL = /* glsl */`
      uniform sampler2D uField, uRows, uNoise, tDetail; uniform vec4 uFieldRect, uTCloud, uRound, uH; uniform vec3 uMeadow, uCrop[4], uSun, uSky; uniform vec2 uQ, uHd, uRt, uWind, uStand; uniform float uTime;
      varying vec2 vP;
      vec2 acOf(vec2 p) { vec2 d = p - uQ; return vec2(dot(d, uHd), dot(d, uRt)); }
      vec3 cropCol(float k) { return k < .5 ? uCrop[0] : k < 1.5 ? uCrop[1] : k < 2.5 ? uCrop[2] : uCrop[3]; }
      float meadowAt(vec2 ac) { return smoothstep(uMeadow.x, uMeadow.x + 14., ac.x) * (1. - smoothstep(uMeadow.y - 30., uMeadow.y, ac.x)) * (1. - smoothstep(uMeadow.z - 12., uMeadow.z, abs(ac.y))); }
      // how far the crop stands at a place: not on a baulk, the path or the mown round (f: the fields' map there)
      float standAt(vec2 ac, vec4 f, float n) { return smoothstep(1.1, 1.9, f.g * 8. + (n - .5) * 1.2) * smoothstep(1., 1.4, f.a * 8. + (n - .5) * .4) * smoothstep(uRound.z, uRound.z + 1.2, length(ac - uRound.xy)); }
      // the long waves of wind (0..1) and the cloud's shadow (0..1) at a place
      float windAt(vec2 p, float n) { float w = sin(dot(p, uWind) * .085 - uTime * 1.2 + n * 5.) * .5 + .5; return w * w; }
      // gusts: patches some 40 m across that go down the wind at 6 m a second and lay the ears over, pale side up
      float gustAt(vec2 p) { return smoothstep(.42, .78, texture2D(uNoise, (p - uWind * (uTime * 6.)) * .011).r); }
      // a field's rows at a place: x metres across the rows, y metres along them, z the wheelings' offset in rows
      vec3 rowsAt(vec2 ac) { vec4 r = texture2D(uRows, (ac - uFieldRect.xy) * uFieldRect.zw); vec2 d = normalize(r.xy * 2. - 1.); return vec3(dot(ac, vec2(-d.y, d.x)), dot(ac, d), r.b * 8.); }
      // a wheeling (0..1): the bare track at every eighth gap, lost where the rows are too far to tell apart
      float wheelAt(vec3 rw, float fw) { float d = abs(fract((rw.x / ${ROW} + rw.z) / 8.) - .5) * ${(8 * ROW).toFixed(2)}; return (1. - smoothstep(.22, .4, d)) * (1. - smoothstep(1.2, 3.5, fw)); }
      float shadowAt(vec2 p) { return uTCloud.w * smoothstep(.46, .66, texture2D(tDetail, p * uTCloud.z + uTCloud.xy).r); }`;
    const fieldU = { uField: { value: fieldTex }, uRows: { value: rowTex }, uNoise: { value: noiseTex }, tDetail: { value: terrain.detailTexture }, uFieldRect: { value: new THREE.Vector4(FT.a0, FT.c0, 1 / (FT.nx * FT.cell), 1 / (FT.nz * FT.cell)) }, uTCloud: seaU.uTCloud,
      uRound: { value: new THREE.Vector4(DANCE.a, DANCE.c, DANCE.r, 0) }, uH: { value: new THREE.Vector4(CROPS[0].h, CROPS[1].h, CROPS[2].h, CROPS[3].h) }, uMeadow: { value: new THREE.Vector3(MEADOW.a0, MEADOW.a1, MEADOW.half) },
      uCrop: { value: CROPS.map((k) => new THREE.Color(k.col[0], k.col[1], k.col[2])) }, uSun: twin.light.uSunCol, uSky: twin.light.uSky, uQ: { value: new THREE.Vector2(Qw[0], Qw[1]) }, uHd: { value: new THREE.Vector2(hdW[0], hdW[1]) }, uRt: { value: new THREE.Vector2(MX * isle.rt[0], isle.rt[1]) },
      uWind: { value: new THREE.Vector2(windV[0], windV[1]) }, uStand: { value: new THREE.Vector2(34, 40) }, uTime: seaU.uTime, uSoil: { value: new THREE.Color(EARTH[0] * 0.55, EARTH[1] * 0.55, EARTH[2] * 0.55) }, uBaulk: { value: new THREE.Color(TURF[0], TURF[1], TURF[2]) },
      uPathCol: { value: C('#d8c79a') }, uMown: { value: new THREE.Color(MOWN[0], MOWN[1], MOWN[2]) }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } };
    {
      // the meadow's ground: a sheet on the land, 8 m to a cell
      const NA = Math.ceil((MEADOW.a1 - MEADOW.a0) / 8), NC = Math.ceil(MEADOW.half * 2 / 8), P = new Float32Array((NA + 1) * (NC + 1) * 3), I = [];
      for (let j = 0; j <= NC; j++) {
        for (let i = 0; i <= NA; i++) { const [x, z] = lineW(lerp(MEADOW.a0, MEADOW.a1, i / NA), lerp(-MEADOW.half, MEADOW.half, j / NC)); P.set([x, groundAt(x, z) + 0.3, z], (j * (NA + 1) + i) * 3); }
        if (j % 8 === 7) await ctx.yield();
      }
      for (let j = 0; j < NC; j++) for (let i = 0; i < NA; i++) { const p0 = j * (NA + 1) + i; I.push(p0, p0 + 1, p0 + NA + 1, p0 + 1, p0 + NA + 2, p0 + NA + 1); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setIndex(I);
      const fields = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: fieldU, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
        vertexShader: /* glsl */`
          varying vec2 vP;
          #include <fog_pars_vertex>
          void main() { vP = position.xz; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: FIELD_GLSL + /* glsl */`
          uniform vec3 uSoil, uBaulk, uPathCol, uMown;
          #include <fog_pars_fragment>
          void main() {
            vec2 ac = acOf(vP); vec4 f = texture2D(uField, (ac - uFieldRect.xy) * uFieldRect.zw);
            vec3 n1 = texture2D(uNoise, vP * .037).rgb, n2 = texture2D(uNoise, vP * .31).rgb;
            float k = floor(f.r * 3. + .5), stand = standAt(ac, f, n1.r);
            // each row's band of crop and the dark soil between two rows (the rows run together where they are too far to tell apart)
            // (in the field's own direction; the crop's tone is drawn out in long streaks along the rows, which hold where the rows no longer do)
            vec3 rw = rowsAt(ac);
            float rc = rw.x / ${ROW}, fw = fwidth(rc), row = abs(fract(rc) - .5) * 2., gap = smoothstep(.5, .85, row) * (1. - smoothstep(.25, .8, fw));
            float streak = texture2D(uNoise, vec2(rw.x * .05, rw.y * .0045)).r, drill = texture2D(uNoise, vec2(rw.x * .31, rw.y * .011)).g;
            vec3 crop = cropCol(k) * (.8 + .3 * f.b) * (.82 + .36 * n2.r) * (.9 + .25 * windAt(vP, n1.g)) * (.8 + .4 * streak) * (.9 + .2 * drill);
            crop = mix(crop, crop * vec3(1.22, 1.2, 1.08), gustAt(vP) * .6);
            crop = mix(crop, uSoil, max(gap * .75, wheelAt(rw, fw * ${ROW}) * .8));
            vec3 col = mix(uBaulk * (.7 + .6 * n2.g), crop, stand);
            col = mix(uPathCol * (.85 + .3 * n2.b), col, smoothstep(.7, 1.15, f.a * 8. + (n2.g - .5) * .5));
            float dr = length(ac - uRound.xy);
            col = mix(uMown * (.85 + .3 * n2.g) * (.92 + .08 * sin(dr * 9.)), col, smoothstep(uRound.z - .6, uRound.z + .6, dr));
            col *= uSky * .8 + uSun * (.34 * (1. - shadowAt(vP)));
            gl_FragColor = vec4(col, meadowAt(ac));
            #include <fog_fragment>
          }` }));
      scene.add(fields);
      await ctx.yield();
      // the standing crop: walls across the rows
      const WA1 = Math.min(MEADOW.a1 - 30, climbA0 + 90), HALF = 40, SEG = 8, HMAX = 1.9, WP = [], WY = [], WI = [];
      let nw = 0;
      for (let a = MEADOW.a0 + 2; a < WA1; a += R.ears.range(0.8, 1.0)) {
        const base = WP.length / 3, n = 2 * HALF / SEG;
        for (let i = 0; i <= n; i++) { const [x, z] = lineW(a, -HALF + i * SEG), y = groundAt(x, z); WP.push(x, y, z, x, y + HMAX, z); WY.push(0, HMAX); }
        for (let i = 0; i < n; i++) { const p0 = base + i * 2; WI.push(p0, p0 + 2, p0 + 1, p0 + 1, p0 + 2, p0 + 3); }
        if (++nw % 40 === 0) await ctx.yield();
      }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(WP, 3)); wg.setAttribute('aY', new THREE.Float32BufferAttribute(WY, 1)); wg.setIndex(WI);
      const crop = new THREE.Mesh(wg, new THREE.ShaderMaterial({ uniforms: fieldU, fog: true, side: THREE.DoubleSide,
        vertexShader: FIELD_GLSL + /* glsl */`
          attribute float aY; varying float vY;
          #include <fog_pars_vertex>
          void main() {
            vP = position.xz; vY = aY;
            // the ears lean with each wave of wind
            vec3 p = position; p.xz += uWind * (((windAt(vP, texture2D(uNoise, vP * .037).g) - .3) * .24 + gustAt(vP) * .2) * aY);
            vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: FIELD_GLSL + /* glsl */`
          varying float vY;
          #include <fog_pars_fragment>
          void main() {
            vec2 ac = acOf(vP); vec4 f = texture2D(uField, (ac - uFieldRect.xy) * uFieldRect.zw);
            vec3 n1 = texture2D(uNoise, vP * .037).rgb;
            float k = floor(f.r * 3. + .5), hk = k < .5 ? uH.x : k < 1.5 ? uH.y : k < 2.5 ? uH.z : uH.w;
            float stand = standAt(ac, f, n1.r) * meadowAt(ac) * (1. - smoothstep(uStand.x, uStand.y, abs(ac.y)));
            // a clump of stalks at each row, a furrow between two rows; the ears' line is ragged
            vec3 rw = rowsAt(ac);
            float row = abs(fract(rw.x / ${ROW}) - .5) * 2.;
            float rag = texture2D(uNoise, vec2(ac.y * .9, ac.x * .41)).g, fine = texture2D(uNoise, vec2(ac.y * 5.3, ac.x * .13 + vY * .5)).r, furrow = smoothstep(.5, .95, row);
            // (and broken in clumps of one to two and a half metres along the row, a fifth of the crop's height up and down)
            float clump = texture2D(uNoise, vec2(ac.y * .1, ac.x * .043)).r;
            float top = hk * stand * (.76 + .14 * rag + .22 * clump) * (1. - .16 * furrow) * (1. - wheelAt(rw, 0.));
            if (top < .05) discard;
            float t = vY / max(top, .05);
            // (the top quarter is ears: single heads against what lies behind, thinning upwards)
            if (t > 1. || fine < smoothstep(.72, 1.05, t) * .8) discard;
            vec3 col = cropCol(k) * (.8 + .3 * f.b) * mix(.34, 1.05, t * t) * (.75 + .5 * fine) * (.78 + .5 * windAt(vP, n1.g)) * (1. - .5 * furrow * (1. - .4 * t)) * (.88 + .24 * rag) * (.84 + .32 * clump);
            col = mix(col, col * vec3(1.22, 1.2, 1.08), gustAt(vP) * .6 * t);
            col *= uSky * .8 + uSun * (.36 * (1. - shadowAt(vP)));
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }` }));
      scene.add(crop);
    }
    await ctx.yield();
    // THE HEDGES: low banks of leaves 1.8 to 2.4 m tall and 1.4 to 1.9 m thick along the hedged sides and cuts of the
    // fields, open where the path crosses and round the dancers' round; here and there a small tree 4.5 to 7 m tall
    // stands in one (none within 25 m of the avenue's axis). A hedge is uneven by the place it stands in (taller and
    // lower by a fifth, its top leaning up to 0.3 m to either side) and closed at its ends.
    // THE BANKS: every side and cut that has no hedge carries a grass bank 0.7 to 1.1 m high and 2.2 to 3 m through on
    // its baulk, open where the hedges are. So no two fields meet on the flat.
    {
      const P = [], Cc = [], I = [], hedgeC = lin('#4a7a36'), barkC = lin('#5c4a3a'), trees = [];
      const shut = (a, c) => cornAt(a, c) < 0.9 || Math.hypot(a - DANCE.a, c - DANCE.c) < DANCE.r + 4 || (a < PATHWAY.a1 + 8 && Math.abs(c - pathC(a)) < 2.4);
      const cap = (b, flip) => { for (let q = 1; q < 4; q++) flip ? I.push(b, b + q + 1, b + q) : I.push(b, b + q, b + q + 1); };
      // (a hedge's section: five corners, each its place across the hedge, its height and its shade)
      const SECTION = [-1, 0, 0.4, -0.9, 0.72, 0.75, 0, 1, 1.15, 0.9, 0.72, 0.75, 1, 0, 0.4];
      const run = (a0, c0, a1, c1) => {
        const len = Math.hypot(a1 - a0, c1 - c0), n = Math.max(1, Math.round(len / 4)), ta = (a1 - a0) / len, tc = (c1 - c0) / len; let open = true, last = -1;
        for (let i = 0; i <= n; i++) {
          const a = lerp(a0, a1, i / n), c = lerp(c0, c1, i / n);
          if (shut(a, c)) { if (!open) cap(last, true); open = true; continue; }
          const [x, z] = lineW(a, c), y = groundAt(x, z), h = R.hedges.range(1.8, 2.4), w = R.hedges.range(0.7, 0.95), base = P.length / 3;
          const tall = 1 + 0.2 * isleNoise.n2(x * 0.21 + 3, z * 0.21), over = 0.3 * isleNoise.n2(x * 0.17 - 9, z * 0.17 + 5);
          for (let e = 0; e < 15; e += 3) { const dh = SECTION[e + 1], dv = SECTION[e] * w + over * dh, la = a - tc * dv, lc = c + ta * dv, k = SECTION[e + 2] * (0.75 + 0.25 * R.hedges()); P.push(MX * (isle.Q[0] + isle.hd[0] * la + isle.rt[0] * lc), y + dh * h * tall - 0.05, isle.Q[1] + isle.hd[1] * la + isle.rt[1] * lc); Cc.push(hedgeC[0] * k, hedgeC[1] * k, hedgeC[2] * k); }
          if (!open) for (let q = 0; q < 4; q++) { const p0 = base - 5 + q, p1 = base + q; I.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); } else cap(base, false);
          open = false; last = base;
          if (Math.abs(c) > 25 && R.hedges.chance(0.06)) trees.push([x, y, z]);
        }
        if (!open) cap(last, true);
      };
      // (a bank: three corners to a section, 8 m apart; its crest paler than its feet)
      const turfC = TURF, bank = (a0, c0, a1, c1) => {
        const len = Math.hypot(a1 - a0, c1 - c0), n = Math.max(1, Math.round(len / 8)), ta = (a1 - a0) / len, tc = (c1 - c0) / len; let open = true;
        for (let i = 0; i <= n; i++) {
          const a = lerp(a0, a1, i / n), c = lerp(c0, c1, i / n);
          if (shut(a, c)) { open = true; continue; }
          const [x, z] = lineW(a, c), y = groundAt(x, z), h = R.banks.range(0.7, 1.1), w = R.banks.range(1.1, 1.5), off = R.banks.range(-0.3, 0.3), base = P.length / 3;
          for (let e = 0; e < 3; e++) { const dw = e === 0 ? -1 : e === 1 ? off : 1, dh = e === 1 ? 1 : 0, la = a - tc * dw * w, lc = c + ta * dw * w, k = (e === 1 ? 1.3 : 0.7) * (0.8 + 0.2 * R.banks()); P.push(MX * (isle.Q[0] + isle.hd[0] * la + isle.rt[0] * lc), y + dh * h - 0.05, isle.Q[1] + isle.hd[1] * la + isle.rt[1] * lc); Cc.push(turfC[0] * k * 1.05, turfC[1] * k, turfC[2] * k * 0.8); }
          if (!open) for (let q = 0; q < 2; q++) { const p0 = base - 3 + q, p1 = base + q; I.push(p0, p0 + 1, p1, p0 + 1, p1 + 1, p1); }
          open = false;
        }
      };
      let banks = 0;
      for (const sp of strips) {
        if (sp.hedge) run(MEADOW.a0 + 6, sp.c0, MEADOW.a1 - 30, sp.c0); else { bank(MEADOW.a0 + 6, sp.c0, MEADOW.a1 - 30, sp.c0); banks++; }
        for (let i = 1; i < sp.cuts.length - 1; i++) if (sp.fields[i].hedge) run(sp.cuts[i], sp.c0 + 0.7, sp.cuts[i], sp.c1 - 0.7); else { bank(sp.cuts[i], sp.c0 + 1.6, sp.cuts[i], sp.c1 - 1.6); banks++; }
        await ctx.yield();
      }
      await ctx.yield();
      // (hedges and banks are one body with a leaf of its own: mottled at a hand's and at a stride's size in world metres, lit by the sun's bearing, under the land's cloud shadows)
      {
        const hg = new THREE.BufferGeometry(); hg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); hg.setAttribute('aCol', new THREE.Float32BufferAttribute(Cc, 3)); hg.setIndex(I); hg.setAttribute('normal', new THREE.BufferAttribute(cornerNormals(hg.attributes.position.array, I), 3));
        const hedgerows = new THREE.Mesh(hg, new THREE.ShaderMaterial({ uniforms: { uNoise: fieldU.uNoise, tDetail: fieldU.tDetail, uTCloud: fieldU.uTCloud, uSun: fieldU.uSun, uSky: fieldU.uSky, uSunDir: { value: sunDir }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } }, fog: true, side: THREE.DoubleSide,
          vertexShader: /* glsl */`
            attribute vec3 aCol; varying vec3 vW, vN, vC;
            #include <fog_pars_vertex>
            void main() { vW = position; vN = normal; vC = aCol; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
              #include <fog_vertex>
            }`,
          fragmentShader: /* glsl */`
            uniform sampler2D uNoise, tDetail; uniform vec4 uTCloud; uniform vec3 uSun, uSky, uSunDir; varying vec3 vW, vN, vC;
            #include <fog_pars_fragment>
            void main() {
              vec3 n = normalize(vN); if (!gl_FrontFacing) n = -n;
              float m1 = texture2D(uNoise, vW.xz * .83 + vW.y * vec2(.37, .61)).r, m2 = texture2D(uNoise, vW.xz * .19 + vW.y * .13).g;
              float lit = clamp(dot(n, uSunDir) * .6 + .4, 0., 1.), sh = uTCloud.w * smoothstep(.46, .66, texture2D(tDetail, vW.xz * uTCloud.z + uTCloud.xy).r);
              vec3 col = vC * (.5 + 1. * smoothstep(.3, .75, m1)) * (.8 + .4 * m2);
              col *= uSky * .8 + uSun * (.55 * lit * (1. - sh));
              gl_FragColor = vec4(col, 1.);
              #include <fog_fragment>
            }` }));
        hedgerows.name = 'hedgerows'; hedgerows.userData = { banks, tris: I.length / 3 }; scene.add(hedgerows);
        P.length = 0; Cc.length = 0; I.length = 0;
      }
      await ctx.yield();
      const hedgeTree = (ti) => {
        const [x, y, z] = trees[ti], H = R.hedges.range(4.5, 7), r = H * R.hedges.range(0.24, 0.3), base = P.length / 3;
        for (const [yy, rr] of [[0, 0.22], [H * 0.6, 0.1]]) for (let k = 0; k < 5; k++) { const an = k / 5 * TAU; P.push(x + Math.cos(an) * rr, y + yy, z + Math.sin(an) * rr); Cc.push(barkC[0], barkC[1], barkC[2]); }
        for (let k = 0; k < 5; k++) { const p0 = base + k, p1 = base + (k + 1) % 5; I.push(p0, p0 + 5, p1, p1, p0 + 5, p1 + 5); }
        // the crown: one lump above and two lower at its sides, uneven, lighter above than below
        const turn = R.hedges.range(0, TAU);
        for (const [ox, oy, k0] of [[0, H - r * 0.9, 1], [0.75, H - r * 1.5, 0.72], [-0.7, H - r * 1.35, 0.66]]) {
          const cb0 = P.length / 3, cx = x + Math.cos(turn) * ox * r, cz = z + Math.sin(turn) * ox * r, ph = R.hedges.range(0, 40), rr = r * k0;
          for (let i = 0; i < BALL.n; i++) { const x0 = BALL.pos[i * 3], y0 = BALL.pos[i * 3 + 1], z0 = BALL.pos[i * 3 + 2], k = 1 + 0.24 * isleNoise.n3(x0 * 1.7 + ph, y0 * 1.7, z0 * 1.7), sh = lerp(0.5, 1.2, 0.5 + 0.5 * y0) * (0.85 + 0.15 * R.hedges());
            P.push(cx + x0 * rr * k, y + oy + y0 * rr * 0.85 * k, cz + z0 * rr * k); Cc.push(hedgeC[0] * sh * 1.1, hedgeC[1] * sh, hedgeC[2] * sh * 0.9); }
          for (let i = 0; i < BALL.idx.length; i++) I.push(cb0 + BALL.idx[i]);
        }
      };
      for (let ti = 0; ti < trees.length; ti++) { hedgeTree(ti); if (ti % 6 === 5) await ctx.yield(); }
      await ctx.yield();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setIndex(I);
      await ctx.yield();
      g.setAttribute('normal', new THREE.BufferAttribute(cornerNormals(g.attributes.position.array, I), 3));
      gather(g, true);
    }
    await ctx.yield();
    // FERNS on the wood's floor: one in every cell of 5 m by 5 m under the limes, wherever in its cell the draw puts it,
    // none on the line's own strip of floor (1.5 m either side); six arching fronds each, 0.7 to 1.2 m long
    {
      const dk = lin('#2f5a24'), lt = lin('#6aa03a'), most = (Math.ceil((groveA1 - groveA0 + 4) / 5) + 1) * 16 * 6;
      const FP = new Float32Array(most * 24), FC = new Float32Array(most * 24), FI = new Uint32Array(most * 18); let fn = 0, fi = 0;
      // (a frond: four pairs of corners along its arch, paler toward its tip)
      const frond = (x, y, z, an, L, sh) => {
        const dx = Math.cos(an), dz = Math.sin(an), base = fn;
        for (let j = 0; j <= 3; j++) {
          const t = j / 3, out = L * t, up = L * (0.75 * t - 0.62 * t * t), w = 0.14 * (1 - t * 0.92), c0 = lerp(dk[0], lt[0], t) * sh, c1 = lerp(dk[1], lt[1], t) * sh, c2 = lerp(dk[2], lt[2], t) * sh;
          for (let sd = -1; sd <= 1; sd += 2) { const o = fn++ * 3; FP[o] = x + dx * out - dz * w * sd; FP[o + 1] = y + up; FP[o + 2] = z + dz * out + dx * w * sd; FC[o] = c0; FC[o + 1] = c1; FC[o + 2] = c2; }
          if (j < 3) { const q = base + j * 2; FI[fi] = q; FI[fi + 1] = q + 1; FI[fi + 2] = q + 2; FI[fi + 3] = q + 1; FI[fi + 4] = q + 3; FI[fi + 5] = q + 2; fi += 6; }
        }
      };
      const fern = (a, c) => {
        const fa = a + R.ferns.range(0.5, 4.5), fc = c + R.ferns.range(0.5, 4.5), nf = 6, L = R.ferns.range(0.7, 1.2), a0 = R.ferns.range(0, TAU);
        if (Math.abs(fc) < 1.5 || Math.hypot(fa - cellAC[0], fc - cellAC[1]) < 5) return;
        const [x, z] = lineW(fa, fc), y = groundAt(x, z);
        for (let f = 0; f < nf; f++) { const an = a0 + (f + R.ferns.range(-0.25, 0.25)) / nf * TAU, sh = 0.75 + 0.25 * R.ferns(); frond(x, y, z, an, L, sh); }
      };
      for (let a = groveA0 - 2; a < groveA1 + 2; a += 5) for (let c = -40; c < 40; c += 5) fern(a, c);
      GROVE.ferns = { pos: FP.subarray(0, fn * 3), col: FC.subarray(0, fn * 3), idx: FI.subarray(0, fi) };
    }
    await ctx.yield();
    // THE UNDERGROWTH, in drifts between the trunks: 26 drifts of 2.5 to 5.5 m, more of them toward the rows' outer side
    // (a drift's distance from the line is drawn by the square root, so twice as far is twice as likely); in each, 8 to
    // 12 plants: ferns, low shrubs (0.4 to 0.9 m), and tufts of the island's small flowers (white, primrose, violet).
    // None within 1.5 m of the line, on a bole's foot or in the cell's clearing. The ferns of the wood's floor are of
    // the same body: every plant takes the sun from the roof's map at its own place.
    {
      const fdk = lin('#2f5a24'), flt = lin('#6aa03a'), sdk = lin('#1f4426'), slt = lin('#4a7a3a'), petals = ['#f4f1e4', '#f0e08a', '#9a8ae0'].map(lin), SMALL = ball(0), U = R.undergrowth;
      // (the plants' stores: 26 drifts of 12 plants at most, a plant of 20 faces at most; the wood's ferns follow them in the same stores)
      const FERNS = GROVE.ferns, most = 26 * 12 * 60 * 3, AP = new Float32Array(most + FERNS.pos.length), AC = new Float32Array(most + FERNS.col.length); let un = 0;
      const put = (v, k) => { const o = un++ * 3; AP[o] = v[0]; AP[o + 1] = v[1]; AP[o + 2] = v[2]; AC[o] = k[0]; AC[o + 1] = k[1]; AC[o + 2] = k[2]; };
      const tri = (a, b, c, col, cb, cc) => { put(a, col); put(b, cb || col); put(c, cc || col); };
      const drifts = [];
      const plant = (da, dc, rd) => {
          const rr = Math.sqrt(U()) * rd, an = U.range(0, TAU), pa = da + Math.cos(an) * rr, pc = dc + Math.sin(an) * rr, kind = U(), size = U.range(0.75, 1.25), turn = U.range(0, TAU), tone = U.range(0.75, 1.1), petal = petals[U.int(0, 2)];
          const [x, z] = lineW(pa, pc), y = groundAt(x, z) + 0.08;
          if (Math.abs(pc) < 1.5 + size || Math.abs(pc) > 45 || Math.hypot(pa - cellAC[0], pc - cellAC[1]) < 6) return;
          // (no bole's foot reaches 3 m, so only the limes within 3 m either way are asked)
          for (const t of limes) if (Math.abs(t.x - x) < 3 && Math.abs(t.z - z) < 3 && Math.hypot(t.x - x, t.z - z) < t.girth * 2 + 0.6) return;
          if (kind < 0.36) {
            // a fern: four arching fronds, 0.8 to 1.4 m
            for (let f = 0; f < 4; f++) {
              const fa = turn + f / 4 * TAU + 0.4 * Math.sin(f * 2.3 + turn), dx = Math.cos(fa), dz = Math.sin(fa), L = 1.1 * size, row = [];
              for (let j = 0; j <= 2; j++) { const t = j / 2, out = L * t, up = L * (0.8 * t - 0.62 * t * t), w = 0.17 * (1 - t * 0.9); row.push([x + dx * out - dz * w, y + up, z + dz * out + dx * w], [x + dx * out + dz * w, y + up, z + dz * out - dx * w]); }
              for (let j = 0; j < 2; j++) { const c0 = mul3(mix3(fdk, flt, j / 2 + 0.25), tone); tri(row[j * 2], row[j * 2 + 1], row[j * 2 + 2], c0); tri(row[j * 2 + 1], row[j * 2 + 3], row[j * 2 + 2], c0); }
            }
          } else if (kind < 0.66) {
            // a low shrub: a rough ball of leaves, darker under
            const rx = 0.62 * size, ry = 0.5 * size, ct = Math.cos(turn), st = Math.sin(turn), V = [];
            for (let i = 0; i < SMALL.n; i++) { const x0 = SMALL.pos[i * 3], yy = SMALL.pos[i * 3 + 1], z0 = SMALL.pos[i * 3 + 2], k2 = 1 + 0.25 * Math.sin(i * 2.1 + turn * 3); V.push([x + (x0 * ct - z0 * st) * rx * k2, y + ry * 0.7 + yy * ry * k2, z + (x0 * st + z0 * ct) * rx * k2, 0.5 + 0.5 * yy]); }
            for (let i = 0; i < SMALL.idx.length; i += 3) { const a = V[SMALL.idx[i]], b = V[SMALL.idx[i + 1]], c = V[SMALL.idx[i + 2]]; if (a[1] + b[1] + c[1] < (y + ry * 0.25) * 3) continue; tri(a, b, c, mul3(mix3(sdk, slt, a[3]), tone), mul3(mix3(sdk, slt, b[3]), tone), mul3(mix3(sdk, slt, c[3]), tone)); }
          } else {
            // a tuft of small flowers: eight heads a hand across on a low green rosette
            for (let f = 0; f < 3; f++) { const fa = turn + f / 3 * TAU, dx = Math.cos(fa) * 0.38 * size, dz = Math.sin(fa) * 0.38 * size; tri([x - dz * 0.4, y, z + dx * 0.4], [x + dz * 0.4, y, z - dx * 0.4], [x + dx, y + 0.22 * size, z + dz], mul3(flt, tone * 0.8)); }
            for (let f = 0; f < 8; f++) {
              const fa = turn + f * 2.4, fr = (0.12 + 0.07 * f) * size, fx2 = x + Math.cos(fa) * fr, fz = z + Math.sin(fa) * fr, fy = y + (0.16 + 0.03 * ((f * 5) % 4)) * size, w = 0.055 * size + 0.02;
              tri([fx2 - w, fy, fz], [fx2 + w, fy, fz], [fx2, fy + 0.03, fz + w * 1.6], petal); tri([fx2 - w, fy, fz], [fx2, fy + 0.03, fz - w * 1.6], [fx2 + w, fy, fz], petal);
            }
          }
      };
      for (let d = 0; d < 26; d++) {
        const da = U.range(groveA0 - 2, groveA1 + 2), dc = (U.chance(0.5) ? 1 : -1) * 40 * Math.sqrt(U()), rd = U.range(2.5, 5.5), n = U.int(8, 12);
        drifts.push([da, dc, rd]);
        for (let k = 0; k < n; k++) plant(da, dc, rd);
        if (d % 4 === 3) await ctx.yield();
      }
      await ctx.yield();
      // the drifts darken the floor under them (the map's fourth part)
      { const B = groveU.uGBox.value, [W, Hh] = GROVE.size, TX = GROVE.tx;
        for (const [da, dc, rd] of drifts) { const i0 = Math.max(0, Math.floor((da - rd - B.x) / TX)), i1 = Math.min(W - 1, Math.ceil((da + rd - B.x) / TX)), j0 = Math.max(0, Math.floor((dc - rd - B.y) / TX)), j1 = Math.min(Hh - 1, Math.ceil((dc + rd - B.y) / TX));
          for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const d = Math.hypot(B.x + (i + 0.5) * TX - da, B.y + (j + 0.5) * TX - dc) / rd; if (d < 1) { const k = (j * W + i) * 4 + 3; GROVE.data[k] = Math.max(GROVE.data[k], Math.round(255 * (1 - d * d))); } } }
        GROVE.tex.needsUpdate = true; }
      // the wood's ferns join them
      const fi = FERNS.idx, nu = un * 3, all = nu + FERNS.pos.length, AI = new Uint32Array(un + fi.length);
      AP.set(FERNS.pos, nu); AC.set(FERNS.col, nu);
      const join = () => { for (let i = 0; i < un; i++) AI[i] = i; for (let i = 0; i < fi.length; i++) AI[un + i] = fi[i] + un; };
      join();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(AP.slice(0, all), 3)); g.setAttribute('color', new THREE.BufferAttribute(AC.slice(0, all), 3)); g.setIndex(new THREE.BufferAttribute(AI, 1));
      const under = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...groveU, uNoise: { value: noiseTex }, uSun: twin.light.uSunCol, uSky: twin.light.uSky, tDetail: { value: terrain.detailTexture }, uTCloud: seaU.uTCloud, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } },
        vertexColors: true, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          varying vec3 vW, vC;
          #include <fog_pars_vertex>
          void main() { vW = position; vC = color; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform sampler2D tDetail, uNoise; uniform vec4 uTCloud; uniform vec3 uSun, uSky; varying vec3 vW, vC;
          ${GROVE_GLSL}
          #include <fog_pars_fragment>
          void main() {
            vec2 ac = gAC(vW.xz);
            float cloud = uTCloud.w * smoothstep(.46, .66, texture2D(tDetail, vW.xz * uTCloud.z + uTCloud.xy).r);
            // (leaves a hand across, lighter and darker)
            vec3 col = vC * (.62 + .8 * texture2D(uNoise, vW.xz * 1.9 + vW.y * 1.3).g) * (uSky * .55 + uSun * (vec3(.1, .13, .07) + gSun(ac, vW.y) * (1. - cloud) * .42));
            col = mix(col, uGHaze, gHaze(vW, cameraPosition) * .8);
            gl_FragColor = vec4(col, 1.);
            #include <fog_fragment>
          }` }));
      under.name = 'undergrowth'; under.userData = { drifts: drifts.length }; scene.add(under);
    }
    await ctx.yield();
    // LIGHT UNDER THE LIMES. The floor's light and shade are the roof's own: its map (above) says where the sun comes
    // down. At each gap of the roof a shaft of the sun stands in the grove's haze, from the gap down the sun's own ray
    // to its pool, as wide as the gap; a gap whose shaft's axis would pass within its own half-width and 2 m of the
    // line has none. THE FLOOR: fallen leaves and moss written in world metres. The litter is a tile of 256 texels to
    // 3.2 m (a texel is 1.25 cm; a leaf 5 to 10 cm), read once at that scale and once turned and six times as large
    // (the drifts of it), filtered by its own mip levels and eight-fold along the view, so that from 2 to 5 m up every
    // leaf reads and at a grazing view far ahead it settles to its mean and never streaks; moss lies in patches of 5 to
    // 20 m and round the boles' feet.
    {
      const TS = 256, lt = new Uint8Array(TS * TS * 4), tones = ['#4e3e2a', '#6e5434', '#8a7048', '#a08458', '#59452c', '#6a6a3a', '#7a5a30'].map(lin);
      // (a tone as the tile holds it, written out where it is asked for 65 thousand times and more)
      const mould = (k0, k1) => { const t0 = tones[0][0], t1 = tones[0][1], t2 = tones[0][2]; for (let k = k0, o = k0 * 4; k < k1; k++, o += 4) { const s = 0.8 + 0.4 * R.litter(); lt[o] = Math.round(Math.sqrt(Math.min(1, Math.max(0, t0 * s))) * 255); lt[o + 1] = Math.round(Math.sqrt(Math.min(1, Math.max(0, t1 * s))) * 255); lt[o + 2] = Math.round(Math.sqrt(Math.min(1, Math.max(0, t2 * s))) * 255); lt[o + 3] = 255; } };
      const strew = (n0, n1) => {
        for (let n = n0; n < n1; n++) {
          const cx = R.litter() * TS, cy = R.litter() * TS, len = R.litter.range(2.1, 4), wd = len * R.litter.range(0.38, 0.6), an = R.litter.range(0, Math.PI), ca = Math.cos(an), sa = Math.sin(an), tone = tones[R.litter.int(1, 6)], sh = R.litter.range(0.75, 1.2);
          for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
            const u = (dx * ca + dy * sa) / len, v = (dy * ca - dx * sa) / wd; if (u * u + v * v > 1) continue;
            const k = (((Math.floor(cy) + dy) & 255) * TS + ((Math.floor(cx) + dx) & 255)) * 4, s = sh * (0.72 + 0.28 * Math.abs(v));
            lt[k] = Math.round(Math.sqrt(Math.min(1, Math.max(0, tone[0] * s))) * 255); lt[k + 1] = Math.round(Math.sqrt(Math.min(1, Math.max(0, tone[1] * s))) * 255); lt[k + 2] = Math.round(Math.sqrt(Math.min(1, Math.max(0, tone[2] * s))) * 255);
          }
        }
      };
      for (let q = 0; q < 4; q++) { mould(q * TS * TS / 4, (q + 1) * TS * TS / 4); await ctx.yield(); }
      for (let q = 0; q < 3; q++) { strew(q * 500, (q + 1) * 500); await ctx.yield(); }
      const litter = new THREE.DataTexture(lt, TS, TS, THREE.RGBAFormat); litter.wrapS = litter.wrapT = THREE.RepeatWrapping; litter.magFilter = THREE.LinearFilter; litter.minFilter = THREE.LinearMipmapLinearFilter; litter.generateMipmaps = true; litter.anisotropy = 8; litter.needsUpdate = true;
      await ctx.yield();
      // the floor's sheet: 4 m to a cell, from 24 m before the first lime to 12 m past the last, 48 m either side. Before
      // the wood it is the turf the ground has there (from some 16 m before the first lime, its edge wandering; none
      // on the beach), its blades and the first fallen leaves written at the litter's own scale; under the limes it is
      // the litter.
      const NA = Math.ceil((groveA1 - groveA0 + 36) / 4), NC = 24, FP = new Float32Array((NA + 1) * (NC + 1) * 3), FI = [];
      for (let j = 0; j <= NC; j++) for (let i = 0; i <= NA; i++) { const [x, z] = lineW(groveA0 - 24 + i * 4, -48 + j * 4); FP.set([x, groundAt(x, z) + 0.1, z], (j * (NA + 1) + i) * 3); }
      for (let j = 0; j < NC; j++) for (let i = 0; i < NA; i++) { const p0 = j * (NA + 1) + i; FI.push(p0, p0 + 1, p0 + NA + 1, p0 + 1, p0 + NA + 2, p0 + NA + 1); }
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(FP, 3)); fg.setIndex(FI);
      const floor = new THREE.Mesh(fg, new THREE.ShaderMaterial({ uniforms: { ...groveU, uTime: seaU.uTime, uLitter: { value: litter }, uNoise: { value: noiseTex }, tDetail: { value: terrain.detailTexture }, uTCloud: seaU.uTCloud, uSun: twin.light.uSunCol, uSky: twin.light.uSky, uMoss: { value: C('#4f6f2c') }, uTurf: { value: new THREE.Color((TURF[0] + TURF_D[0]) / 2, (TURF[1] + TURF_D[1]) / 2, (TURF[2] + TURF_D[2]) / 2) }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } },
        transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
        vertexShader: /* glsl */`
          varying vec3 vW;
          #include <fog_pars_vertex>
          void main() { vW = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform sampler2D uLitter, uNoise, tDetail; uniform vec4 uTCloud; uniform vec3 uSun, uSky, uMoss, uTurf; uniform float uTime; varying vec3 vW;
          ${GROVE_GLSL}
          #include <fog_pars_fragment>
          void main() {
            vec2 ac = gAC(vW.xz), p = vW.xz; vec4 gm = gMap(ac);
            vec3 l1 = texture2D(uLitter, p / 3.2).rgb, l2 = texture2D(uLitter, vec2(.8 * p.x - .6 * p.y, .6 * p.x + .8 * p.y) / 19.2).rgb;
            l1 *= l1; l2 *= l2;
            vec3 col = l1 * (.8 + 3.4 * l2.g);
            float moss = smoothstep(.6, .8, texture2D(uNoise, p * .021).r * .55 + texture2D(uNoise, p * .09).g * .3 + gm.b * .5);
            col = mix(col, uMoss * (.5 + 3. * l1.g), moss * .85);
            col *= 1. - .4 * smoothstep(.6, 1., gm.b);
            col = mix(col, vec3(.05, .11, .04), gm.a * .55);
            // (before the first lime: turf, with leaves blown out on it)
            float wood = smoothstep(uGRows.x - 8., uGRows.x + 2., ac.x), blown = smoothstep(.55, .8, texture2D(uNoise, p * .37).b) * .7;
            col = mix(uTurf * (.42 + 2.7 * l1.g) * (.75 + .5 * texture2D(uNoise, p * .17).r), col, max(wood, blown));
            float cloud = uTCloud.w * smoothstep(.46, .66, texture2D(tDetail, p * uTCloud.z + uTCloud.xy).r);
            // (THE SUN'S POOLS: where the roof's gaps let the sun down the floor is gold-green and bright, the shade
            // about it darker; a pool's edge goes with the leaves, on the world's clock)
            vec2 stir = (texture2D(uNoise, p * .09 + vec2(uTime * .021, -uTime * .016)).rg - .5) * 1.6;
            float pool = smoothstep(.25, .7, gMap(ac + stir).r) * (1. - cloud);
            col *= gUnder(ac, uSky, uSun, 1. - cloud) * mix(.62, 1., pool) + uSun * vec3(1., .96, .7) * (pool * 1.5);
            col = mix(col, uGHaze, gHaze(vW, cameraPosition) * .8);
            float inG = smoothstep(uGRows.x - 17.5, uGRows.x - 14.5, ac.x + (texture2D(uNoise, p * .05).g - .5) * 7. + (texture2D(uNoise, p * .31).r - .5) * 2.) * (1. - smoothstep(uGRows.y - 6., uGRows.y + 6., ac.x)) * (1. - smoothstep(40., 47., abs(ac.y)));
            // (never on the beach: the sand keeps what lies under a third of a metre over the water)
            inG *= max(wood, smoothstep(.38, .5, vW.y + (texture2D(uNoise, p * .31).r - .5) * .12));
            gl_FragColor = vec4(col, inG);
            #include <fog_fragment>
          }` }));
      floor.name = 'grove-floor'; floor.renderOrder = 1; scene.add(floor);
      await ctx.yield();
      // the shafts, by the kit's rays: one to each gap, from the gap in the roof's screen to its pool on the floor; bodies
      // of gold-green light that keep most of their strength down to the floor
      const fl = Math.hypot(sunDir.x, sunDir.z) || 1, cot = upSunAC[2], dir = new THREE.Vector3(-sunDir.x / fl * cot, -1, -sunDir.z / fl * cot).normalize(), Ls = GROVE.roofY * Math.hypot(cot, 1);
      const [mx, mz] = lineW((groveA0 + groveA1) / 2, 0), mid = new THREE.Vector3(mx, groundAt(mx, mz) + GROVE.roofY, mz), tops = [];
      // (a shaft is clear when every 2 m of the line lies further than need from its axis, from the roof to the floor;
      // need is the shaft's radius and 2.3 m, so that between two such places no part of the line comes within 2.0 m of its sheet)
      const clearShaft = (top, need) => {
        const n2 = need * need, L = GROVE.lineAt;
        for (let k = 0; k < L.length; k++) { const p = L[k], px = p.x - top.x, py = p.y - top.y, pz = p.z - top.z, t = clamp(px * dir.x + py * dir.y + pz * dir.z, 0, Ls), dx = px - dir.x * t, dy = py - dir.y * t, dz = pz - dir.z * t; if (dx * dx + dy * dy + dz * dz < n2) return false; }
        return true;
      };
      for (const g of GROVE.gaps) {
        const [x, z] = lineW(g.a, g.c), top = new THREE.Vector3(x, groundAt(x, z) + GROVE.roofY, z);
        if (clearShaft(top, g.r + 2.3)) tops.push([top, g.r]);
      }
      await ctx.yield();
      if (tops.length) {
        const rays = fx.makeGodRays({ rng: R.sunshafts, position: mid, direction: dir, radius: 1, count: tops.length, length: Ls, width: [0.85, 1], color: C(HOUR.sun).lerp(C('#cfe070'), 0.4), intensity: 1.15, falloff: 0.5, near: [0.3, 1.2], fogAmount: 0.3, speed: 0.3, fog: true });
        const org = rays.object.geometry.attributes.aOrigin, par = rays.object.geometry.attributes.aParam;
        tops.forEach(([top, r], i) => { org.setXYZ(i, top.x - mid.x, top.y - mid.y, top.z - mid.z); par.setX(i, r); par.setY(i, 1); });
        org.needsUpdate = true; par.needsUpdate = true; rays.object.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, -6, 0), 120);
        rays.object.name = 'grove-shafts'; rays.object.userData = { gaps: GROVE.gaps.length, shafts: tops.length };
        scene.add(rays.object); tick.push((dt, time) => rays.update(dt, time));
      }
    }
    await ctx.yield();
    const marram = await flora.makeGrassAsync({
      rng: R.marram, path, uRange: [(m.P5 + 20) / LEN, (m.grove0 + 10) / LEN], radius: 85, bias: 1.2, count: Math.round(3000 * density), width: [0.7, 1.2], height: [0.6, 1.25],
      heightAt: groundAt, density: (x, z) => { const sd = isle.shore(x, z); return smoothstep(38, 50, sd) * (1 - smoothstep(90, 120, sd)); }, root: '#7d7a40', tip: '#cfc27a',
      wind, map: leafMat.map, chunks: 2, fade: [120, 160], flowers: 0,
    }, ctx.yield);
    scene.add(marram.object); tick.push((dt, time, camera) => marram.update(dt, time, camera));
    await ctx.yield();
    // ------------------------------------------------------------ where the eye is drawn: one pull, never two at once
    // Each look belongs to a stretch of the line between two places and to one thing; it rises over the stretch's first
    // metres and lets go as its thing bears further off the heading, so nothing is looked at over the shoulder.
    const LOOK_AHEAD = 13, GAZE_W = 0.6;
    const shipPt = (v) => v.clone().applyMatrix4(hero.object.matrixWorld);
    const G1 = [shipPt(hero.anchors.mainTop), shipPt(hero.anchors.foreYard), shipPt(hero.anchors.bowspritEnd)];
    const knollAt = new THREE.Vector3(KNOLL.x * MX, 26, KNOLL.z);
    const calmAt = PL.places.calmShip.clone().setY(16), calmStern = (() => { const d = azDir(PL.places.calmAz); return new THREE.Vector3(calmAt.x + MX * d[0] * SHIP.STERN, 10, calmAt.z + d[1] * SHIP.STERN); })(), pineAt = new THREE.Vector3(pineW[0], 14, pineW[1]), headAt = (() => { const [x, z] = lineW(groveA0, 0); return new THREE.Vector3(x, 12, z); })();
    // the near cloud buildings beside the climb, in the order the line passes them: { s: the metre abeam, at: where to look }
    const looks = { rank: [] };
    const ga = new THREE.Vector3(), gd = new THREE.Vector3(), gt = new THREE.Vector3(), gtan = new THREE.Vector3(), gOut = new THREE.Vector3(), gTarget = new THREE.Vector3();
    // the angle (degrees) between the route's heading at gp and the way to a point, on the flat
    const bearingTo = (pt) => { const dx = pt.x - gp.x, dz = pt.z - gp.z, l = Math.hypot(dx, dz) || 1, tl = Math.hypot(gtan.x, gtan.z) || 1; return Math.acos(clamp((dx * gtan.x + dz * gtan.z) / (l * tl), -1, 1)) / RAD; };
    const gazeAt = (time, u) => {
      const s = clamp(u, 0, 1) * LEN;
      path.posAtDist(s, gp); path.posAtDist(s + LOOK_AHEAD, ga); path.tangentAtDist(s, gtan);
      gd.subVectors(ga, gp).normalize();
      let w = 0;
      if (s < m.bow + 30) {
        // the storm ship: main top, then her fore yard, then her bowsprit end, as we go along her
        gTarget.copy(G1[0]).lerp(G1[1], smoothstep(m.P1 - 10, m.P1 + 24, s)).lerp(G1[2], smoothstep(m.P1 + 20, m.bow - 8, s));
        w = 0.6 * smoothstep(30, 70, s) * (1 - smoothstep(36, 90, bearingTo(G1[2])));
      } else if (s < m.P4 - 20) {
        // the headland: the knoll's crown over its cliffs
        gTarget.copy(knollAt); w = 0.4 * smoothstep(m.bow + 30, m.bow + 70, s) * (1 - smoothstep(40, 76, bearingTo(knollAt)));
      } else if (s < m.grove1) {
        // the sleeping ship: her tops as we come in at the mouth, her stern lanterns as we come up her side. As her stern
        // comes abeam (15 m off; no look can follow her round it) the look goes over to the head beach and the limes
        // under the cloud buildings, and over the sands' first 40 m to the cloven pine beside the line. One look, handed
        // on: its share and its letting go (by the bearing of what it holds) pass from the ship's to the pine's
        // between her stern and the sands.
        const kw = smoothstep(m.P5, m.Q, s);
        gTarget.copy(calmAt).lerp(calmStern, smoothstep(m.ship0, m.P5, s)).lerp(headAt, smoothstep(m.P5 - 10, m.P5 + 30, s)).lerp(pineAt, smoothstep(m.Q, m.Q + 40, s));
        w = lerp(0.5, 0.35, kw) * smoothstep(m.P4 - 20, m.P4 + 20, s) * (1 - smoothstep(lerp(42, 22, kw), lerp(90, 60, kw), bearingTo(gTarget)));
      } else if (looks.rank.length) {
        // the climb: the near buildings in the order they come abeam. The look is on the first, and slides to each next
        // one between 110 m and 40 m before the one it leaves comes abeam: the next has hold before the last lets go
        const rk = looks.rank;
        gTarget.copy(rk[0].at);
        for (let i = 1; i < rk.length; i++) gTarget.lerp(rk[i].at, smoothstep(rk[i - 1].s - 110, rk[i - 1].s - 40, s));
        w = 0.34 * smoothstep(m.grove1, m.grove1 + 40, s) * (1 - smoothstep(30, 70, bearingTo(gTarget)));
      }
      gt.subVectors(gTarget, gp).normalize();
      // (the look is shared with the way ahead at GAZE_W; this is the point that makes the share w)
      gOut.copy(gd).multiplyScalar(GAZE_W - w).addScaledVector(gt, w).normalize();
      return gOut.multiplyScalar(100).add(gp);
    };
    const pace = (u) => {
      const s = clamp(u, 0, 1) * LEN;
      // slowest along her side, from her taffrail to her bowsprit end; slow again up the sleeping ship's side and round her stern
      let p = lerp(0.65 - 0.15 * smoothstep(m.P1 - 30, m.P1 + 5, s) * (1 - smoothstep(m.bow - 5, m.bow + 30, s)), 0.9, smoothstep(m.bow + 30, m.P3, s));
      p = lerp(p, 0.6, smoothstep(m.P4, m.ship0, s));
      p = lerp(p, 0.75, smoothstep(m.P5, m.Q, s));
      p = lerp(p, 1.1, smoothstep(m.grove1 - 20, m.grove1 + 40, s));
      return lerp(p, 1, smoothstep(m.climb1 - 50, m.climb1, s));
    };

    // ------------------------------------------------------------ THE PAGEANT: cloud shaped as towers, palaces, temples and a globe.
    // The near rank stands on a floor of mist MIST over the sea beside the climb; the great rank stands on cumulus heads
    // 100 m and more up, behind it and on both hands. Every one of them has a number: its front is uFront[number].
    // the metre of the route that is abeam of a place (the nearest on the flat)
    const abeamOf = (x, z) => { let best = 1e9, sb = 0; const q = new THREE.Vector3(); for (let s = m.Q; s <= LEN; s += 2) { path.posAtDist(s, q); const d = Math.hypot(q.x - x, q.z - z); if (d < best) { best = d; sb = s; } } return sb; };
    const edgeK = detail < 0.75 ? 1.9 : 1.45, cb = new CloudBuilder(edgeK), fronts = new Array(CLOUD_BUILDINGS).fill(null);
    // (a building's pieces are made one after another, the build breathing between them)
    const raise = async (gen) => { let r = gen.next(); while (!r.done) { await ctx.yield(); r = gen.next(); } return r.value; };
    // a cumulus head under a building: R across, k its height against a free head's, its base at y. It never reaches
    // nearer the line than 22 m (the clear way through the floor is 40 m wide and more).
    // (each head draws from a stream of its own, named by its tag: its count of lobes follows its size)
    const headUnder = (b, x, z, y, rad, k, index, tag = index) => {
      const lobes = [], n = rad > 60 ? 5 : 4, rh = fork('head-' + tag);
      for (let i = 0; i < n; i++) lobes.push([(i + rh.range(0.1, 0.9)) / n * TAU, rh.range(0.5, 0.72), rh.range(0.5, 0.8)]);
      PAGEANT.heap(b, 0, 0, rad, lobes, k, 16);
      b.place(x, y - 16, z, rh.range(0, TAU), index, (0.46 * rad * k + 16) * 4);
    };
    const climbA1 = aAt(m.climb1), END = PL.places.end, hdw = new THREE.Vector3(MX * isle.hd[0], 0, isle.hd[1]), aEnd = isle.lineAC(END.x, END.z)[0];
    // a front turned T from square to the line faces back down it and in towards it
    const frontYaw = (side, T) => Math.atan2(MX * (-side * isle.rt[0] * Math.cos(T) - isle.hd[0] * Math.sin(T)), -side * isle.rt[1] * Math.cos(T) - isle.hd[1] * Math.sin(T));
    const KINDS = [
      { hx: 31, hz: 13, scale: 1, make: (b) => PAGEANT.towers(b, 122 * V.tall[0], 100 * V.tall[0]) },
      { hx: 82, hz: 25, scale: V.tall[1], make: (b) => PAGEANT.palace(b) },
      { hx: 44.5, hz: 30.5, scale: V.tall[2], make: (b) => PAGEANT.temple(b) },
    ];
    // ROOM. Every body of the cloud has a footprint on the plan: a rectangle in the sands' frame, its middle (a, c), its
    // half length hx along the unit (ux, uc), its half width hz. No two footprints of one rank stand nearer than ROOM
    // metres: one that is drawn nearer than that to any that stood before it stands further off, along its own way out,
    // a step at a time, until it has room. The same rule for all of them.
    const rimOf = (p) => {
      const out = [], grain = Math.max(3, p.hz / 6), nx = Math.ceil(p.hx / grain), nz = Math.ceil(p.hz / grain), at = (x, z) => out.push([p.a + x * p.ux - z * p.uc, p.c + x * p.uc + z * p.ux]);
      for (let i = -nx; i <= nx; i++) { at(i / nx * p.hx, p.hz); at(i / nx * p.hx, -p.hz); }
      for (let j = -nz; j <= nz; j++) { at(p.hx, j / nz * p.hz); at(-p.hx, j / nz * p.hz); }
      return out;
    };
    const offOf = (p, w) => { const da = w[0] - p.a, dc = w[1] - p.c; return Math.hypot(Math.max(0, Math.abs(da * p.ux + dc * p.uc) - p.hx), Math.max(0, Math.abs(dc * p.ux - da * p.uc) - p.hz)); };
    const apart = (p, q) => { let d = 1e9; p.rim = p.rim || rimOf(p); q.rim = q.rim || rimOf(q); for (const w of p.rim) d = Math.min(d, offOf(q, w)); for (const w of q.rim) d = Math.min(d, offOf(p, w)); return d; };
    // (foot(n) gives the footprint after n steps out; the one that has room is entered in the rank's list and returned)
    const giveRoom = (rank, room, foot, most = 60) => { let n = 0, f = foot(0); while (n < most && rank.some((q) => apart(f, q) < room)) f = foot(++n); rank.push(f); return f; };
    // The colonnade and the last arch stand where the line puts them (below), so their footprints are entered first:
    // each row of columns with its heads of heaped cloud, 13.5 to 29.5 m off the line, and the arch across its end.
    const ROOM = 8, STEP = 2, nearRank = [];
    const COL = { a0: climbA1 + 10, a1: aEnd - 34, pitch: 15, y: END_Y - 28.5 };
    for (const side of [-1, 1]) nearRank.push({ a: (COL.a0 + COL.a1) / 2, c: side * 21.5, hx: (COL.a1 - COL.a0) / 2 + 5, hz: 8, ux: 1, uc: 0 });
    nearRank.push({ a: aEnd, c: 0, hx: 29, hz: 11.5, ux: 0, uc: 1 });
    // one building of the near rank: its nearest corner is drawn at (aNear, side * gap) in the sands' frame, its front turned
    // T; it stands there, or as many steps further off on its own hand as ROOM asks
    const stand = async (index, K, side, aNear, gap0, T) => {
      const top = await raise(K.make(cb)), H = top * K.scale, cT = Math.cos(T), sT = Math.sin(T), hx = K.hx * K.scale, hz = K.hz * K.scale;
      const mid = (gap) => [aNear - (hx * cT - hz * sT), side * (gap + hx * sT + hz * cT)];
      const f = giveRoom(nearRank, ROOM, (n) => { const [a, c] = mid(gap0 + n * STEP); return { a, c, hx, hz, ux: cT, uc: -side * sT, gap: gap0 + n * STEP }; });
      const [x, z] = lineW(f.a, f.c), r = Math.hypot(K.hx, K.hz) * K.scale, near = lineW(aNear, side * f.gap);
      cb.place(x, MIST, z, frontYaw(side, T), index, top, K.scale, 1, 1);
      headUnder(cb, x, z, MIST - 9, Math.min(r * 0.85, Math.abs(f.c) - 24), 0.38, index);
      fronts[index] = { x, z, y: MIST, H, r: r * 0.6 };
      // (the climb's look goes to its flank: half way from its nearest corner to its middle, two fifths of the way up it)
      return { s: abeamOf(near[0], near[1]), at: new THREE.Vector3((x + near[0]) / 2, MIST + 0.4 * H, (z + near[1]) / 2), near };
    };
    // TWO flank the line, one on either hand, where it has come up through the floor: their nearest corners 25 to 40 m
    // off it, their fronts turned 50 to 70 degrees so that they open like a gate towards the fields. The whole run from
    // the climb's foot to the arch, in metres of the island's line, is four even strata: the line comes up through the
    // floor in the first, the colonnade closes the last, and the two flanks' corners are drawn one in the second and one
    // in the third. Which building takes which hand, and which hand comes first, is drawn.
    const RUN = aEnd - climbA0, firstSide = R.flanks.chance(0.5) ? 1 : -1;
    const flankAt = [1, 2].map((k) => ({ a: climbA0 + RUN * (k + R.flanks.range(0, 1)) / 4, gap: R.flanks.range(27, 38), T: R.flanks.range(50, 70) * RAD }));
    const flank = [];
    for (let i = 0; i < 2; i++) flank.push(await stand(i, KINDS[V.order[i]], i ? -firstSide : firstSide, flankAt[i].a, flankAt[i].gap, flankAt[i].T));
    // (the shaft of sun between them stands over the middle of the line that joins their nearest corners)
    const gateMid = [(flank[0].near[0] + flank[1].near[0]) / 2, (flank[0].near[1] + flank[1].near[1]) / 2];
    flank.sort((p, q) => p.s - q.s); looks.rank.push(...flank);
    await ctx.yield();
    // a THIRD stands behind, beside the last arch, 55 to 80 m clear of the line on a drawn hand; three slender towers on the other
    const thirdSide = R.third.chance(0.5) ? 1 : -1;
    await stand(2, KINDS[V.order[2]], thirdSide, aEnd + R.third.range(0, 50), R.third.range(55, 80), 40 * RAD);
    { const top = await raise(PAGEANT.slender(cb, [135 * V.tall[3], 118 * V.tall[3], 104 * V.tall[3]])), c0 = R.slender.range(120, 145), a0 = climbA1 + R.slender.range(60, 90), T = 40 * RAD;
      const f = giveRoom(nearRank, ROOM, (n) => ({ a: a0, c: -thirdSide * (c0 + n * STEP), hx: 30, hz: 11, ux: Math.cos(T), uc: thirdSide * Math.sin(T) })), [x, z] = lineW(f.a, f.c);
      cb.place(x, MIST, z, frontYaw(-thirdSide, T), 3, top, 1, 1, 1); headUnder(cb, x, z, MIST - 8, 44, 0.38, 3); fronts[3] = { x, z, y: MIST, H: top, r: 22 }; }
    await ctx.yield();
    // THE COLONNADE: along the level end, a row either hand, the columns (30 m tall, 6 m thick) 20 to 23 m from the line
    // at an even pitch with a drawn start, the two rows out of step; their heads stand at the line's height. Each row is
    // one building (numbers 4 and 5) on a long bank of the floor.
    for (let sd = 0; sd < 2; sd++) {
      const side = sd ? -1 : 1, nCol = Math.floor((COL.a1 - COL.a0) / COL.pitch), start = COL.a0 + (sd ? 0.5 : 0) * COL.pitch + R.colonnade.range(0, 0.4) * COL.pitch, mid = lineW((COL.a0 + COL.a1) / 2, side * 21);
      for (let k = 0; k < nCol; k++) {
        const [x, z] = lineW(start + k * COL.pitch, side * R.colonnade.range(20, 23));
        PAGEANT.column(cb, x - mid[0], z - mid[1], R.colonnade.range(0, TAU), [R.colonnade.range(-0.05, 0.05), R.colonnade.range(-0.05, 0.05)]);
        if (k % 3 === 2) await ctx.yield();
      }
      cb.place(mid[0], COL.y, mid[1], 0, 4 + sd, 33, 1, 1, 1);
      for (let k = 0; k < 3; k++) { const [x, z] = lineW(lerp(COL.a0, COL.a1, (k + 0.5) / 3), side * 46); headUnder(cb, x, z, MIST - 8, 22, 0.5, 4 + sd, (4 + sd) + '-' + k); }
      fronts[4 + sd] = { x: mid[0], z: mid[1], y: COL.y, H: 33, r: (COL.a1 - COL.a0) * 0.4 };
    }
    await ctx.yield();
    // THE LAST ARCH stands across the line's end, its opening round the ring, a small head of the floor under either pier
    { const top = await raise(PAGEANT.arch(cb)); cb.place(END.x, MIST, END.z, Math.atan2(hdw.x, hdw.z), 6, top);
      for (const side of [-1, 1]) { const [x, z] = lineW(aEnd, side * 38); headUnder(cb, x, z, MIST - 7, 14, 0.6, 6, side > 0 ? 'arch-right' : 'arch-left'); }
      fronts[6] = { x: END.x, z: END.z, y: MIST, H: top, r: 26 }; }
    await ctx.yield();
    // THE GREAT RANK: ten buildings 350 to 600 m tall on cumulus heads whose bases stand 100 to 150 m up. Seven stand
    // behind, by even strata of bearing 75 degrees either side of the heading from the arch, 460 to 900 m out (off the
    // line's own continuation and off the globe's bearing); two on the right hand, by strata of the line from the limes
    // to the climb's end, 230 to 330 m off it; one on the left hand beside the limes, in the room between the line and the
    // storm's edge, where only a tower has room. Each fronts the sun, turned up to 25 degrees either way. On the hands a kind is taken only if its head keeps 40 m off the line's
    // ground track at the drawn height (a tower always does). None stands in the storm's field: one drawn there moves out
    // until clear.
    // ROOM holds among them and the globe as it does in the near rank, at their own size: the room is ROOM times the
    // building's scale, the way out is its bearing from the arch (behind) or straight off the line (on the hands), the
    // step 40 m; the globe stands first, where its bearing puts it. One drawn within 8 degrees of the heading stands 8
    // to 12 degrees off it on its own side, and one within 16 degrees of the globe's bearing 17 to 22 off that.
    const globeBearing = 34 * V.globeSide, greatAt = [], Rg = R.great;
    for (let k = 0; k < 7; k++) {
      let be = lerp(-75, 75, (k + Rg.range(0.15, 0.85)) / 7);
      if (Math.abs(be) < 8) be = (be < 0 ? -1 : 1) * (8 + Math.abs(be) / 2);
      if (Math.abs(be - globeBearing) < 16) be = globeBearing + (be < globeBearing ? -1 : 1) * (17 + 5 * Math.abs(be - globeBearing) / 16);
      const r = Rg.range(460, 900);
      greatAt.push({ a: aEnd + r * Math.cos(be * RAD), c: r * Math.sin(be * RAD), out: [Math.cos(be * RAD), Math.sin(be * RAD)], kind: Rg.int(0, 3), H: Rg.range(350, 600), b: 0 });
    }
    const HEAD = 1.2;
    for (let k = 0; k < 2; k++) {
      const c = Rg.range(230, 330), H = Rg.range(350, 600), kinds = Rg.shuffle([0, 1, 2, 3]);
      greatAt.push({ a: lerp(groveA0, climbA1, (k + Rg.range(0.2, 0.8)) / 2), c, out: [0, 1], kind: kinds.find((q) => q === 3 || GREAT[q].reach * H / GREAT[q].H * HEAD <= c - 40), H, b: 1 });
    }
    greatAt.push({ a: lerp(groveA0, groveA1, Rg.range(0.4, 1)), c: -62, out: [0, 1], kind: 3, H: 350, b: 1 });
    for (const g of greatAt) { g.base = Rg.range(100, 150); g.yaw = Math.atan2(sunDir.x, sunDir.z) + Rg.range(-25, 25) * RAD; }
    const gbs = [new CloudBuilder(1), new CloudBuilder(1)];
    // (a building's own x axis, turned by its yaw, as a unit in the sands' frame)
    const axisOf = (yaw) => { const p = isle.lineAC(0, 0), q = isle.lineAC(Math.cos(yaw), -Math.sin(yaw)); return [q[0] - p[0], q[1] - p[1]]; };
    const GLOBE_AT = [aEnd + 480 * Math.cos(globeBearing * RAD), 480 * Math.sin(globeBearing * RAD)], greatRank = [{ a: GLOBE_AT[0], c: GLOBE_AT[1], hx: 125, hz: 125, ux: 1, uc: 0 }];
    for (let k = 0; k < greatAt.length; k++) {
      const g = greatAt[k], G = GREAT[g.kind], scale = g.H / G.H, reach = G.reach * scale, base = g.base, headR = reach * HEAD, [ux, uc] = axisOf(g.yaw);
      const inStorm = (a, c) => { for (const [da, dc] of [[0, 0], [reach, 0], [-reach, 0], [0, reach], [0, -reach]]) { const w = lineW(a + da, c + dc); if (stormAt(w[0], w[1]) > 0.02) return true; } return false; };
      let n = 0; while (n < 30 && inStorm(g.a + g.out[0] * 40 * n, g.c + g.out[1] * 40 * n)) n++;
      const f = giveRoom(greatRank, ROOM * scale, (i) => ({ a: g.a + g.out[0] * 40 * (n + i), c: g.c + g.out[1] * 40 * (n + i), hx: G.hx * scale, hz: G.hz * scale, ux, uc }), 40);
      const [x, z] = lineW(f.a, f.c), cbk = gbs[g.b], foot = base + 0.3 * headR;
      PAGEANT.great(cbk, g.kind); cbk.place(x, foot, z, g.yaw, 8 + k, G.H, scale, 1, 0);
      headUnder(cbk, x, z, base, headR, 1, 8 + k);
      fronts[8 + k] = { x, z, y: foot, H: g.H, r: reach * 0.6 };
      seaU.uCap.value[1 + k].set(x, z, headR, base); seaU.uCapTop.value[1 + k] = foot + g.H;
      if (k % 2) await ctx.yield();
    }
    // THE GREAT GLOBE, 250 m across, stands 480 m beyond the arch, 34 degrees to one side of the heading (a drawn side), its
    // foot in a head of its own; it turns for ever, once in 110 to 140 s, and its banding shows the turning
    const globeAt = lineW(GLOBE_AT[0], GLOBE_AT[1]), GLOBE_Y = 128;
    headUnder(gbs[0], globeAt[0], globeAt[1], 100, 105, 1, 7);
    const gl = new CloudBuilder(1); PAGEANT.globe(gl); gl.place(0, 0, 0, 0, 7, 250);
    fronts[7] = { x: globeAt[0], z: globeAt[1], y: GLOBE_Y, H: 250, r: 70 };
    seaU.uCap.value[0].set(globeAt[0], globeAt[1], 112, 100); seaU.uCapTop.value[0] = GLOBE_Y + 250;
    await ctx.yield();
    // one cloud for all of it. Lit faces warm; shade at half their value, hollows and undersides at a third.
    const windW = azDir(255 * MX), ringAt = new THREE.Vector4(END.x, END.y, END.z, 0.5);
    const litC = C(HOUR.lit).lerp(C(HOUR.sun), 0.6).multiplyScalar(0.9), litV = Math.max(...litC.clone().convertLinearToSRGB().toArray());
    const toned = (hex, v) => { const c = C(hex).convertLinearToSRGB(), k = v / Math.max(c.r, c.g, c.b); return c.multiplyScalar(k).convertSRGBToLinear(); };
    const cloudMat = makeCloudMaterial({ wind: new THREE.Vector3(windW[0], 0, windW[1]), lit: litC, shade: toned(HOUR.shade, 0.5 * litV), hollow: toned(HOUR.hollow, 0.34 * litV), gold: C('#ffcf7a'), ring: C('#d6ecff'), haze: C(HOUR.hor).lerp(C(HOUR.zen), 0.45), ringAt, sky: { glsl: SKY_GLSL, uniforms: SU } });
    await ctx.yield();
    seaU.uCapLit.value.copy(cloudMat.uniforms.uLit.value); seaU.uCapBelly.value.copy(cloudMat.uniforms.uHollow.value);
    // (drawn as four bodies, each with its own sphere, so that what lies out of sight is not drawn)
    const cloudMesh = (b) => { const g = b.geometry(); g.boundingSphere.radius += 90; const me = new THREE.Mesh(g, cloudMat); scene.add(me); return me; };
    cloudMesh(cb); await ctx.yield(); cloudMesh(gbs[0]); await ctx.yield(); cloudMesh(gbs[1]);
    const globe = cloudMesh(gl); globe.position.set(globeAt[0], GLOBE_Y, globeAt[1]);
    await ctx.yield();
    // THE FLOOR OF MIST UNDER THE COLONNADE: either row stands in a bed of mist 3.2 m deep whose foot is at the floor's
    // height (MIST): from 13 m off the line (thinning to nothing there over 10 m, so that the clear way between the
    // rows is 26 m wide and more) out to 74 m, from 30 m before the first column to 40 m past the arch. It lies
    // 25.5 m below the line; the columns' feet and the banks under them stand in it.
    // THE BED IS AS THICK AS ITS OWN PLACE MAKES IT AND LOOKS THE SAME FROM EVERYWHERE. It is five level sheets through
    // its depth, one draw. A sheet's strength is the bed's own stuff at its place (one crawling field of heaps, on
    // the world clock; a sheet higher in the bed holds only the taller heaps, and its edges stand further in, so
    // the bed is heaped and not a slab; the heaps stand closest about the rows' feet and thin to wisps over the
    // fields from 28 to 62 m off the line; each sheet reads the finest grain with a slip of its own) times its
    // soft edges by place times one constant. Nothing in it reads the eye's place, height or angle of view.
    {
      const a0 = COL.a0 - 30, a1 = aEnd + 40, P = [], AC = [], I = [], SHEETS = 5, DEEP = 3.2;
      for (let k = 0; k < SHEETS; k++) for (const side of [-1, 1]) {
        const base = P.length / 3, lv = k / (SHEETS - 1);
        for (const [a, c] of [[a0, 8], [a1, 8], [a1, 76], [a0, 76]]) { const [x, z] = lineW(a, side * c); P.push(x, MIST + lv * DEEP, z); AC.push(a, c, lv); }
        I.push(base, base + 1, base + 2, base, base + 2, base + 3);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aAC', new THREE.Float32BufferAttribute(AC, 3)); g.setIndex(I);
      const bedMist = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime: cloudMat.uniforms.uTime, uNoise: { value: noiseTex }, uLit: cloudMat.uniforms.uLit, uShade: cloudMat.uniforms.uShade, uA: { value: new THREE.Vector2(a0, a1) }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } },
        transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, forceSinglePass: true,
        vertexShader: /* glsl */`
          attribute vec3 aAC; varying vec3 vAC, vW;
          #include <fog_pars_vertex>
          void main() { vAC = aAC; vW = position; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform sampler2D uNoise; uniform float uTime; uniform vec3 uLit, uShade; uniform vec2 uA; varying vec3 vAC, vW;
          #include <fog_pars_fragment>
          void main() {
            // lv: this sheet's height in the bed, 0 at its foot to 1 at its top. The heaps lean a little with height; the grain is each sheet's own.
            float lv = vAC.z; vec2 p = vW.xz + lv * vec2(3., 1.6);
            float n1 = texture2D(uNoise, p * .011 + uTime * vec2(.0016, .0009)).r, n2 = texture2D(uNoise, p * .037 - uTime * vec2(.0021, .0014)).g, n3 = texture2D(uNoise, (p + lv * vec2(41., 23.)) * .13 + uTime * vec2(.004, .002)).b;
            float soft = n1 * .45 + n2 * .37 + n3 * .18;
            float thin = .34 + .16 * lv + .14 * smoothstep(28., 62., vAC.y), stuff = smoothstep(thin, thin + .14 + .08 * lv, soft);
            float edge = smoothstep(13. + 4. * lv, 23. + 9. * lv, vAC.y + (soft - .5) * 9.) * (1. - smoothstep(56. - 8. * lv, 74. - 6. * lv, vAC.y + (n1 - .5) * 12.)) * smoothstep(uA.x + 8. * lv, uA.x + 28. + 8. * lv, vAC.x + (n2 - .5) * 14.) * (1. - smoothstep(uA.y - 28. - 8. * lv, uA.y - 8. * lv, vAC.x + (n2 - .5) * 14.));
            // ONE CONSTANT: a sheet at its fullest hides this share of what lies behind it
            float a = edge * stuff * .34;
            if (a < .004) discard;
            gl_FragColor = vec4(mix(uShade, uLit, .35 + .45 * lv + .2 * smoothstep(.35, .68, n2 * .6 + n3 * .4)) * (.94 + .12 * n1), a);
            #include <fog_fragment>
          }` }));
      bedMist.name = 'colonnade-floor'; bedMist.renderOrder = 5; scene.add(bedMist);
    }
    // MELTING IS WHAT THIS CLOUD ALWAYS DOES: each building sinks from its crown to its lowest quarter, storey after storey,
    // and heaps up again, on a turn of its own (40 to 70 s). One turn: whole for 0.55 of it, sinking
    // for 0.2, a stump for 0.05, heaping for 0.2. The six of the near rank share one period and stand evenly round it;
    // the great rank's ten have a period and a phase each. The arch keeps one state, its crown breathing between 0.6
    // and 0.75 of its height; the globe's crown breathes between 0.77 and 0.91 of its.
    const meltAt = (p) => {
      if (p < 0.55) return 1.06;
      if (p < 0.75) { const q = (p - 0.55) / 0.2 * 4, k = Math.floor(q); return 1.06 - 0.81 * (k + smoothstep(0.3, 1, q - k)) / 4; }
      return p < 0.8 ? 0.25 : 0.25 + 0.81 * smoothstep(0, 1, (p - 0.8) / 0.2);
    };
    const CYC = { near: R.melt.range(50, 64), turn: R.melt.range(0, 1), order: R.melt.shuffle([0, 1, 2, 3, 4, 5]), arch: { T: R.melt.range(19, 27), ph: R.melt.range(0, TAU) }, globe: { T: R.melt.range(31, 43), ph: R.melt.range(0, TAU), spin: R.melt.range(110, 140), turn0: R.melt.range(0, TAU) },
      great: greatAt.map(() => ({ T: R.melt.range(40, 70), ph: R.melt.range(0, 1) })) };
    tick.push((dt, time) => {
      const fr = cloudMat.uniforms.uFront.value; cloudMat.uniforms.uTime.value = time;
      for (let i = 0; i < 6; i++) fr[i] = meltAt((time / CYC.near + CYC.turn + CYC.order[i] / 6) % 1);
      fr[6] = 0.675 + 0.075 * Math.sin(time * TAU / CYC.arch.T + CYC.arch.ph);
      fr[7] = 0.84 + 0.07 * Math.sin(time * TAU / CYC.globe.T + CYC.globe.ph);
      for (let k = 0; k < CYC.great.length; k++) fr[8 + k] = meltAt((time / CYC.great[k].T + CYC.great[k].ph) % 1);
      globe.rotation.y = CYC.globe.turn0 + time * TAU / CYC.globe.spin;
    });
    await ctx.yield();

    // WISPS stream to the lee (to azimuth 255) from every front: soft sheets sized in metres (the taller the building the
    // larger), each in its own time, born at its building's front wherever that now stands; a faint banner
    // while the building is whole. The arch has three shares of them, the globe two, every other building one.
    // Each is born over its own building's body (a colonnade row's along the row). None is kept whose whole course, at
    // any height its building's front can stand, would bring its sheet within 1.5 m of the line: such a one is drawn
    // again, up to eight times, and then left out.
    const NW = Math.round(340 * density), wq = new THREE.InstancedBufferGeometry(), share = [];
    for (let i = 0; i < CLOUD_BUILDINGS; i++) for (let k = i === 6 ? 3 : i === 7 ? 2 : 1; k > 0; k--) share.push(i);
    wq.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); wq.setIndex([0, 1, 2, 0, 2, 3]);
    { const sd = new Float32Array(NW * 4), ps = new Float32Array(NW * 4), near = [];
      for (let sq = m.climb0; sq <= LEN; sq += 1) { path.posAtDist(sq, gp); near.push(gp.x, gp.y, gp.z); }
      // (the line's metres in runs of 32 with the box each run fills: a sheet clear of a run's box is clear of the run)
      const runs = [];
      for (let j = 0; j < near.length; j += 96) { const e = Math.min(near.length, j + 96), bx = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let q = j; q < e; q++) { bx[q % 3] = Math.min(bx[q % 3], near[q]); bx[3 + q % 3] = Math.max(bx[3 + q % 3], near[q]); } runs.push(j, e, ...bx); }
      // (a building whose lowest front stands higher over the line's end than its largest sheet reaches down streams clear of the line)
      const high = fronts.map((f) => f.y + 0.25 * f.H - 29 * Math.max(1, f.H / 110) > END_Y + 5);
      // has a wisp's sheet 1.5 m of room from the line over its whole course (as the sheet is drawn: place, rise and size by age)?
      // (the front's own range of heights is taken whole: the arch's breathes, the globe's breathes, every other sinks to its lowest quarter)
      const room = (bi, ox, oz, size, reach) => {
        const f = fronts[bi], big = Math.max(1, f.H / 110), lo = bi === 6 ? 0.6 : bi === 7 ? 0.77 : 0.25, hi = bi === 6 ? 0.75 : bi === 7 ? 0.91 : 1;
        for (let age = 0; age <= 1.001; age += 0.0625) {
          const k = age * (28 + 34 * reach) * big, x = f.x + ox * f.r + windW[0] * k, rise = 1 + (age * age * 16 + age * 3) * big, y0 = f.y + lo * f.H + rise, y1 = f.y + hi * f.H + rise, z = f.z + oz * f.r + windW[1] * k;
          const keep = 1.15 * size * (0.55 + 1.5 * age) * big + 1.5, keep2 = keep * keep;
          for (let r = 0; r < runs.length; r += 8) {
            const ex = Math.max(0, runs[r + 2] - x, x - runs[r + 5]), ey = Math.max(0, runs[r + 3] - y1, y0 - runs[r + 6]), ez = Math.max(0, runs[r + 4] - z, z - runs[r + 7]);
            if (ex * ex + ey * ey + ez * ez >= keep2) continue;
            for (let j = runs[r], j1 = runs[r + 1]; j < j1; j += 3) { const dx = near[j] - x, dy = Math.max(0, y0 - near[j + 1], near[j + 1] - y1), dz = near[j + 2] - z; if (dx * dx + dy * dy + dz * dz < keep2) return false; }
          }
        }
        return true;
      };
      const rowHalf = (COL.a1 - COL.a0) / 2;
      for (let i = 0; i < NW; i++) {
        const bi = share[i % share.length], f = fronts[bi]; let ox = 0, oz = 0, size = 0, reach = 0, ok = false;
        for (let tries = 0; tries < 8 && !ok; tries++) {
          if (bi === 4 || bi === 5) { const al = R.wisps.range(-1, 1) * rowHalf, ac = R.wisps.range(-1.5, 1.5); ox = (hdw.x * al + MX * isle.rt[0] * ac) / f.r; oz = (hdw.z * al + isle.rt[1] * ac) / f.r; }
          else { const an = R.wisps.range(0, TAU), rr = Math.sqrt(R.wisps()) * 0.8; ox = Math.cos(an) * rr; oz = Math.sin(an) * rr; }
          size = R.wisps.range(6, 12); reach = R.wisps.range(0, 1);
          ok = high[bi] || room(bi, ox, oz, size, reach);
        }
        sd.set([bi, ox, oz, R.wisps()], i * 4);
        ps.set([ok ? size : 0, R.wisps.range(0, 1), reach, R.wisps.range(0, 1)], i * 4);
        if (i % 60 === 59) await ctx.yield();
      }
      wq.setAttribute('aSeed', new THREE.InstancedBufferAttribute(sd, 4)); wq.setAttribute('aVar', new THREE.InstancedBufferAttribute(ps, 4)); }
    wq.instanceCount = NW; wq.boundingSphere = new THREE.Sphere(new THREE.Vector3(END.x, 300, END.z), 1400);
    const wispMat = new THREE.ShaderMaterial({
      uniforms: { uB: { value: fronts.map((f) => new THREE.Vector4(f.x, f.z, f.r, f.H)) }, uBy: { value: fronts.map((f) => f.y) }, uFront: cloudMat.uniforms.uFront, uTime: cloudMat.uniforms.uTime, uWindDir: cloudMat.uniforms.uWindDir, uNoise: { value: noiseTex },
        uLit: cloudMat.uniforms.uLit, uShade: cloudMat.uniforms.uShade, uGold: cloudMat.uniforms.uGold },
      vertexShader: /* glsl */`
        attribute vec4 aSeed, aVar; uniform vec4 uB[${CLOUD_BUILDINGS}]; uniform float uBy[${CLOUD_BUILDINGS}], uFront[${CLOUD_BUILDINGS}]; uniform float uTime; uniform vec3 uWindDir;
        varying vec2 vUv; varying vec3 vA;
        void main() {
          int bi = int(aSeed.x + .5); vec4 B = uB[bi]; float fr = uFront[bi], big = max(1., B.w / 110.);
          float T = (7. + 6. * aSeed.w) * sqrt(big), age = fract(uTime / T + aVar.y * 7.31);
          vec3 c = vec3(B.x + aSeed.y * B.z, uBy[bi] + clamp(fr, 0., 1.) * B.w + 1., B.y + aSeed.z * B.z);
          c += (uWindDir * (age * (28. + 34. * aVar.z)) + vec3(0., age * age * 16. + age * 3., 0.)) * big;
          float size = aVar.x * (.55 + 1.5 * age) * big;
          float melting = 1. - smoothstep(1., 1.22, fr), there = smoothstep(-.12, .06, fr);
          vA = vec3(sin(age * 3.14159) * mix(.16, .75, melting) * there, aVar.w, melting);
          vUv = position.xy;
          vec4 mv = viewMatrix * vec4(c, 1.); mv.xy += position.xy * size * vec2(1.6, 1.);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform sampler2D uNoise; uniform vec3 uLit, uShade, uGold; uniform float uTime;
        varying vec2 vUv; varying vec3 vA;
        void main() {
          float r = length(vUv);
          vec3 n = texture2D(uNoise, vUv * .21 + vA.y * 3.7 + vec2(uTime * .006, 0.)).rgb;
          float a = smoothstep(.95, .2, r + (n.r - .5) * .5) * (1. - smoothstep(.72, 1., r)) * smoothstep(.2, .65, n.g * .6 + n.r * .4) * vA.x;
          if (a < .004) discard;
          vec3 col = mix(uShade, uLit, clamp(.62 + vUv.y * .3 + (n.b - .5) * .3, 0., 1.)) + uGold * (.12 * vA.z);
          gl_FragColor = vec4(col, a);
        }`,
      transparent: true, depthWrite: false,
    });
    const wisps = new THREE.Mesh(wq, wispMat); wisps.renderOrder = 6; scene.add(wisps);
    // SHAFTS of sunlight stand in three gaps of the pageant and slant along the sun's own rays to the land: between the two
    // flanks (over the middle of the line that joins their nearest corners), between the colonnade and the slender
    // towers, and over the corn under the right hand's great pair (abeam of the middle of the two, 110 m to the right of
    // the line). Few and wide; they waver slowly.
    const shaftAt = [[...gateMid, MIST + 6, R.beamFlanks], [...lineW(climbA1 + 50, -thirdSide * 70), MIST + 4, R.beamColonnade], [...lineW((greatAt[7].a + greatAt[8].a) / 2, 110), 6, R.beamCorn]];
    for (const [x, z, y, rb] of shaftAt) {
      const L = 300, rays = fx.makeGodRays({ rng: rb, position: [x + sunDir.x * L, y + sunDir.y * L, z + sunDir.z * L], direction: [-sunDir.x, -sunDir.y, -sunDir.z], radius: 34, count: 5, length: L, width: [9, 26], color: HOUR.sun, intensity: 0.34, speed: 0.35, fog: false });
      scene.add(rays.object); tick.push((dt, time) => rays.update(dt, time));
    }
    // THE RAINBOW is worn by the eye (see the head): whole, opposite the sun, a broad band 340 m off; it lies across the far
    // cloud faces, and what stands nearer hides it. Its colours breathe. It is drawn over the fog, so the storm's field
    // at the eye's place veils it as the fog would.
    const BOW = 1;
    const bow = fx.makeRainbow({ sunDir, intensity: BOW, horizon: -0.1, width: 2.1, radius: 340, inner: 0.2 });
    scene.add(bow.object);
    const bowPh = R.bow.range(0, TAU), bowT = R.bow.range(9, 13);
    await ctx.yield();
    // ------------------------------------------------------------ the storm's own air: rain in slanting sheets, spindrift low over the crests
    const rain = fx.makeParticles({ rng: R.rain, preset: 'rain', count: Math.round(5200 * density), box: [56, 40, 56], velocity: [windV[0] * 9, -23, windV[1] * 9], near: [3, 7], colors: ['#cfe3ea', '#a8c4cc', '#e8f4ff'], opacity: 0.55 });
    const spin = fx.makeParticles({ rng: R.spray, preset: 'rain', count: Math.round(1500 * density), box: [70, 9, 70], follow: 'xz', center: [0, 4.5, 0], velocity: [windV[0] * 26, -1.2, windV[1] * 26], velocityRandom: [5, 1.5, 5], near: [3, 7], size: [0.05, 0.12], colors: ['#e6f1ee', '#ffffff', '#cfe6e0'], opacity: 0.6 });
    scene.add(rain.object, spin.object);
    // (both boxes are worn by the eye, as the head of this file declares: rain falls about it wherever the cloud is overhead,
    // spindrift flies where the great seas stand under it)
    tick.push((dt, time, camera, u, eyeF, eyeRain) => {
      bow.uniforms.uIntensity.value = BOW * (1 - eyeF) * (0.88 + 0.12 * Math.sin(time * TAU / bowT + bowPh));
      rain.setOpacity(0.55 * eyeRain); spin.setOpacity(0.6 * eyeF * eyeF); rain.update(dt, time, camera); spin.update(dt, time, camera);
    });
    // THE FLEET: 2 to 5 other ships far off in the storm, each tossing on the sea under her own keel, one amber lantern each.
    // Their ground: 280 to 480 m round the burning ship where the storm stands whole, on open water, never within 250 m
    // of the line from the entry to the nook's mouth (at every 2 m of it), 90 m apart.
    {
      // one ship of 34 m, bow to +z: a hull with sheer, a high stern and a pointed bow, three masts with their yards,
      // two bellied sails on the fore and the main, a furled mizzen. Her colours carry the storm's shade (she is never in sun).
      const P = [], Cc = [], shade = (c) => [c[0] * 0.5, c[1] * 0.56, c[2] * 0.62], hullC = shade(lin('#4a3a2c')), deckC = shade(lin('#7a6850')), sailC = shade(lin('#d9cfb6'));
      const tri = (a, b, c, col) => { P.push(...a, ...b, ...c); for (let i = 0; i < 3; i++) Cc.push(col[0], col[1], col[2]); };
      const quad = (a, b, c, d, col) => { tri(a, b, c, col); tri(a, c, d, col); };
      // the hull: nine sections from taffrail to stem; each (keel, bilge, wale, rail) a side
      const NS = 9, sec = [];
      for (let i = 0; i < NS; i++) {
        const u = i / (NS - 1), z = lerp(-17, 17, u), bw = 4.3 * Math.pow(Math.sin(Math.PI * clamp(0.12 + 0.88 * u, 0, 1) * 0.94), 0.6) * (u > 0.8 ? 1 - smoothstep(0.8, 1, u) * 0.92 : 1), rail = 3.6 + 3.4 * (1 - smoothstep(0.08, 0.3, u)) + 1.5 * smoothstep(0.78, 1, u);
        sec.push([[0, -1.6, z], [bw * 0.8, 0, z], [bw, 2.2, z], [bw * 0.86, rail, z]]);
      }
      for (let i = 0; i < NS - 1; i++) for (const sx of [-1, 1]) {
        const A = sec[i].map((q) => [q[0] * sx, q[1], q[2]]), B = sec[i + 1].map((q) => [q[0] * sx, q[1], q[2]]);
        for (let k = 0; k < 3; k++) { if (sx > 0) quad(A[k], B[k], B[k + 1], A[k + 1], hullC); else quad(A[k], A[k + 1], B[k + 1], B[k], hullC); }
        if (sx > 0) quad([-A[3][0], A[3][1] - 0.9, A[3][2]], [A[3][0], A[3][1] - 0.9, A[3][2]], [B[3][0], B[3][1] - 0.9, B[3][2]], [-B[3][0], B[3][1] - 0.9, B[3][2]], deckC);
      }
      { const T = sec[0]; quad([-T[3][0], T[3][1], -17], [T[3][0], T[3][1], -17], [T[2][0], T[2][1], -17], [-T[2][0], T[2][1], -17], hullC); quad([-T[2][0], T[2][1], -17], [T[2][0], T[2][1], -17], [T[1][0], 0, -17], [-T[1][0], 0, -17], hullC); }
      // a spar from p to q, r thick, square
      const spar = (p, q, r) => { const d = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], up = Math.abs(d[1]) > Math.abs(d[0]) ? [[r, 0, 0], [0, 0, r]] : [[0, r, 0], [0, 0, r]];
        for (const [e, f] of [[up[0], up[1]], [up[1], up[0].map((v) => -v)], [up[0].map((v) => -v), up[1].map((v) => -v)], [up[1].map((v) => -v), up[0]]]) quad([p[0] + e[0], p[1] + e[1], p[2] + e[2]], [p[0] + f[0], p[1] + f[1], p[2] + f[2]], [q[0] + f[0] * 0.5, q[1] + f[1] * 0.5, q[2] + f[2] * 0.5], [q[0] + e[0] * 0.5, q[1] + e[1] * 0.5, q[2] + e[2] * 0.5], hullC); };
      // a sail hung from a yard at height y, w wide and h deep, bellying forward
      const sail = (z, y, w, h) => { const N = 3, pt = (i, j) => { const u = i / N - 0.5, v = j / N; return [u * w * (1 - 0.12 * v), y - v * h, z + 0.4 + 2.2 * Math.sin(Math.PI * v) * (1 - 2.4 * u * u) * h / 12]; };
        for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) quad(pt(i, j), pt(i + 1, j), pt(i + 1, j + 1), pt(i, j + 1), sailC); };
      for (const [z, h, set] of [[2, 34, 1], [12, 29, 1], [-11, 24, 0]]) {
        spar([0, 3, z], [0, h, z], 0.3);
        spar([-h * 0.28, h * 0.56, z], [h * 0.28, h * 0.56, z], 0.16); spar([-h * 0.2, h * 0.84, z], [h * 0.2, h * 0.84, z], 0.13);
        if (set) { sail(z, h * 0.56, h * 0.52, h * 0.34); sail(z, h * 0.84, h * 0.38, h * 0.26); }
      }
      spar([0, 5.2, 16], [0, 8.6, 25], 0.22);
      const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); fg.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); fg.computeVertexNormals();
      const lantern = new THREE.SphereGeometry(0.9, 8, 6), lanternMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#f09a3a').multiplyScalar(4) }), ships = [];
      // The fleet's ground is open storm water 280 to 480 m from the burning ship, 80 m and more off every shore and
      // 250 m clear of the line. Not every bearing from her has such water (the island and the line take more than half
      // the compass), so the ships stand by even strata of the bearings that do, a draw in each, 90 m and more apart.
      const SS = PL.places.stormShip, sea0 = (x, z) => stormAt(x, z) >= 0.9 && isle.shore(x, z) <= -80 && offLine(x, z, 0, m.P4) >= 250, arc = [];
      for (let i = 0; i < 72; i++) { const an = i / 72 * TAU; if ([300, 380, 460].some((r) => sea0(SS.x + Math.cos(an) * r, SS.z + Math.sin(an) * r))) arc.push(an); }
      for (let k = 0; k < V.fleet && arc.length; k++) for (let tries = 0; tries < 40; tries++) {
        const an = arc[Math.min(arc.length - 1, Math.floor((k + R.fleet.range(0, 1)) / V.fleet * arc.length))] + R.fleet.range(0, TAU / 72), r = R.fleet.range(280, 480), x = SS.x + Math.cos(an) * r, z = SS.z + Math.sin(an) * r, yaw = (windAz + R.fleet.range(150, 210)) * RAD, ph = R.fleet.range(0, TAU);
        if (!sea0(x, z) || ships.some((sh) => Math.hypot(sh.x - x, sh.z - z) < 90)) continue;
        ships.push({ x, z, yaw, ph, pitchT: R.fleet.range(8, 10.5), rollT: R.fleet.range(10.5, 13.5) }); break;
      }
      const hulls = new THREE.InstancedMesh(fg, plain2, Math.max(1, ships.length)), lamps = new THREE.InstancedMesh(lantern, lanternMat, Math.max(1, ships.length));
      hulls.count = lamps.count = ships.length; hulls.frustumCulled = lamps.frustumCulled = false; scene.add(hulls, lamps);
      const mm = new THREE.Matrix4(), ee = new THREE.Euler(0, 0, 0, 'YXZ'), qq = new THREE.Quaternion(), pp = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), lp = new THREE.Vector3();
      // each pitches 5 degrees and rolls 7 on periods of her own, and rides the sea under her own keel
      const toss = (time) => {
        for (let i = 0; i < ships.length; i++) {
          const k = ships[i]; ee.set(0.09 * Math.sin(time * TAU / k.pitchT + k.ph), k.yaw, 0.12 * Math.sin(time * TAU / k.rollT + k.ph * 1.7)); qq.setFromEuler(ee);
          mm.compose(pp.set(k.x, -1.2 + seaHeightAt(k.x, k.z, time) * 0.5, k.z), qq, one); hulls.setMatrixAt(i, mm);
          lp.set(0, 9, -17.5).applyMatrix4(mm); mm.setPosition(lp); lamps.setMatrixAt(i, mm);
        }
        hulls.instanceMatrix.needsUpdate = lamps.instanceMatrix.needsUpdate = true;
      };
      toss(0); tick.push((dt, time) => toss(time));
    }
    await ctx.yield();
    // THE FLAMES ON THE LANE: one parts from her bowsprit end every 2 to 3.2 s, on the world's clock (the line is beside
    // her for longer than the longest gap, so whoever passes, at whatever moment, is there when one parts), and skims
    // the lane at a speed of its own. Twelve partings make the round (24 to 38 s), which begins at a drawn point of its
    // whole length; four or five are on the lane at most moments. Each stays one flame: the slowest goes 15 m a second,
    // and none goes faster than lets a flame that parts one shortest gap behind the slowest still be APART (12 m: the
    // widest glow is 9 m across) behind it at the lane's end. Over the sleeping ship's main truck each thins away.
    {
      const GAP = [2, 3.2], V_SLOW = 15, APART = 12, V_FAST = (LANE.length - APART) / (LANE.length / V_SLOW - GAP[0]), sched = []; let at = 0;
      for (let i = 0; i < NLANE; i++) { sched.push({ at, v: R.lane.range(V_SLOW, V_FAST), h: R.lane.range(2.2, 3.4), ph: R.lane.range(0, 1), bob: R.lane.range(0, TAU) }); at += R.lane.range(GAP[0], GAP[1]); }
      const loop = at, phase = R.lane.range(0, loop), flames = makeFlames(NLANE, noiseTex, fireColor), q = new THREE.Vector3();
      scene.add(flames.mesh);
      tick.push((dt, time) => {
        for (let i = 0; i < NLANE; i++) {
          const f = sched[i], age = (((time + phase - f.at) % loop) + loop) % loop, d = age * f.v;
          // it grows out of the bowsprit's fire over its first 8 m and thins away over the lane's last 14
          const h = d > LANE.length ? 0 : f.h * smoothstep(0, 8, d) * (1 - smoothstep(LANE.length - 14, LANE.length, d));
          LANE.at(d, q); q.y += 0.6 * Math.sin(time * 1.3 + f.bob) + seaHeightAt(q.x, q.z, time) * smoothstep(8, 30, d);
          flames.set(i, q.x, q.y, q.z, h, f.ph);
          laneFire[i].set(q.x, q.y + h * 0.4, q.z, h > 0 ? 0.2 * Math.pow(h, 0.7) : 0);
        }
        flames.commit(); flames.uniforms.uTime.value = time;
      });
    }
    // ------------------------------------------------------------ life: sea birds over the cove and among the cloud columns, larks over the corn, sheep on the turf hill
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene), rng: R.birds });
    // gulls wheel over the knoll's crown, over the sleeping ship's tops and (placed with the pageant) among the cloud columns; swifts over the dancers' round
    fauna.add(F.makeFlock({ rng: R.flockKnoll, species: 'gulls', count: Math.round(9 * density), center: [KNOLL.x * MX, 44, KNOLL.z], radius: 44, height: 8 }));
    await ctx.yield();
    // THE GULLS OVER THE SLEEPING SHIP'S TOPS FLY OVER THEM, NEVER THROUGH THEM. The wheel's ring and its level are
    // taken from her own built skin where she lies (the faces of her hull, decks, spars and furled sails and the ropes
    // of her rig, under her own matrix); the spread is the gulls' own, as the kit gives it.
    // THE RING: the call's radius is her length in plan as she lies (from the point of hers furthest from her place,
    // her bowsprit's end, to the point of hers furthest from that: 52.3 m). The kit lays the loop's nine points
    // between 0.45 and 1.3 of the radius from her place: a wheel round her at about her own length. The loop's own
    // rise and fall (the call's height) is 8 m, a figure of the flock and not of her.
    // THE WANDER, written out: the gulls' own, 5, 2.5 and 4 m at the gulls' own rate, which by the shader's law is a
    // box of 7.5 m across (one and a half times the first figure), 2.5 m up and down and 4 m along about a bird's
    // place. The kit spends R.flockShip draw for draw as it always did, whatever these figures are.
    // THE LEVEL: the call's centre stands over her highest point by what a bird that passes right over it asks (the
    // wander's depth, then the slack: the reach, the metre and the grain): 5.49 m over it, 41.6 m up. Then the flock
    // as the kit dealt it is read back from the kit's own made thing (the baked loop, each bird's own offset from it,
    // the wander's box) and EACH BIRD IS LIFTED BY ITS OWN NEED, never lowered, never moved sideways: at every
    // station of its course (the loop moved by its offset, STEP of the loop apart) a thing of hers whose distance d
    // in plan from the bird's box is under the slack asks the box's floor to stand the root of (slack squared less d
    // squared) over it, and a thing further off than the slack asks nothing; the greatest ask along the course is
    // added to the bird's own offset in height (the kit's attribute). So a bird dealt low over her fore truck is
    // lifted over it by itself, the wheel stays where it is, and whatever of hers is not under a bird stands the
    // reach and the metre off to its side. The kit's bounds are grown by the greatest lift. It reads nothing but her
    // skin and the kit's dealt flock, and it draws nothing.
    {
      // (GULL_REACH: the reach a gull of the flock is counted by; the kit's gull at its largest dealt size, 1.5 x
      // 1.12, has its wing tips 1.28 m from its place. AIR: the clear metre. GRAIN: her tops are kept as the highest
      // point of hers over each square of that side. STEP: how far apart along the loop the stations are read.)
      const GULL_REACH = 1.7, AIR = 1, GRAIN = 0.5, STEP = 0.5, cs = PL.places.calmShip, q = new THREE.Vector3(), limbs = [];
      let top = -Infinity, x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity, thick = 0, away = -1, span = 0, most = 0;
      const fore = [0, 0];
      twin.object.updateMatrixWorld(true);
      // (her corners where she lies: her highest point, her reach in plan, the point of hers furthest from her place
      // in plan, half the width of her thickest rope)
      for (const o of twin.upright.children) {
        const A = o.geometry.attributes, at = (A.aOther ? [A.position, A.aOther] : [A.position]).map((S) => {
          const w = new Float64Array(S.count * 3);
          for (let i = 0; i < S.count; i++) {
            q.fromBufferAttribute(S, i).applyMatrix4(o.matrixWorld); w[i * 3] = q.x; w[i * 3 + 1] = q.y; w[i * 3 + 2] = q.z;
            if (q.y > top) top = q.y; if (q.x < x0) x0 = q.x; if (q.x > x1) x1 = q.x; if (q.z < z0) z0 = q.z; if (q.z > z1) z1 = q.z;
            const d = (q.x - cs.x) * (q.x - cs.x) + (q.z - cs.z) * (q.z - cs.z);
            if (d > away) { away = d; fore[0] = q.x; fore[1] = q.z; }
          }
          return w;
        });
        if (A.aOther) for (let i = 0; i < A.aSW.count; i++) thick = Math.max(thick, A.aSW.getY(i) / 2);
        limbs.push({ at, ix: o.geometry.index });
      }
      // (her length in plan: from that furthest point to the point of hers furthest from it)
      for (const { at } of limbs) for (const w of at) for (let i = 0; i < w.length; i += 3) span = Math.max(span, (w[i] - fore[0]) * (w[i] - fore[0]) + (w[i + 2] - fore[1]) * (w[i + 2] - fore[1]));
      span = Math.sqrt(span);
      // (the field: squares of GRAIN over her reach in plan, each as high as the highest point of hers over it)
      const gx = x0, gz = z0, nx = Math.floor((x1 - gx) / GRAIN) + 1, nz = Math.floor((z1 - gz) / GRAIN) + 1, tops = new Float64Array(nx * nz).fill(-Infinity);
      // (every square that the plan box of a piece of her touches stands as high as that piece's highest point)
      const mark = (xa, xb, za, zb, y) => {
        const i1 = Math.floor((xb - gx) / GRAIN), j1 = Math.floor((zb - gz) / GRAIN);
        for (let j = Math.floor((za - gz) / GRAIN); j <= j1; j++) for (let i = Math.floor((xa - gx) / GRAIN); i <= i1; i++) if (y > tops[j * nx + i]) tops[j * nx + i] = y;
      };
      for (const { at: [P, O], ix } of limbs) {
        // (a rope, end to end in pieces no longer than GRAIN in plan, each as high as its higher end)
        if (O) for (let i = 0; i < P.length; i += 12) {
          const n = Math.ceil(Math.hypot(O[i] - P[i], O[i + 2] - P[i + 2]) / GRAIN) || 1;
          for (let k = 0; k < n; k++) {
            const xa = lerp(P[i], O[i], k / n), xb = lerp(P[i], O[i], (k + 1) / n), za = lerp(P[i + 2], O[i + 2], k / n), zb = lerp(P[i + 2], O[i + 2], (k + 1) / n);
            mark(Math.min(xa, xb), Math.max(xa, xb), Math.min(za, zb), Math.max(za, zb), Math.max(lerp(P[i + 1], O[i + 1], k / n), lerp(P[i + 1], O[i + 1], (k + 1) / n)));
          }
        }
        // (a face: its three corners)
        else for (let i = 0; i < ix.count; i += 3) {
          const a = ix.getX(i) * 3, b = ix.getX(i + 1) * 3, c = ix.getX(i + 2) * 3;
          mark(Math.min(P[a], P[b], P[c]), Math.max(P[a], P[b], P[c]), Math.min(P[a + 2], P[b + 2], P[c + 2]), Math.max(P[a + 2], P[b + 2], P[c + 2]), Math.max(P[a + 1], P[b + 1], P[c + 1]));
        }
      }
      // (her tops are laid; the call and the birds' stations are a build step of their own)
      await ctx.yield();
      // (slack: the reach, the metre, half a STEP and half a rope's width, a rope being kept as its middle line)
      const slack = GULL_REACH + AIR + STEP / 2 + thick, wander = [5, 2.5, 4, 0.35];
      const overTops = F.makeFlock({ rng: R.flockShip, species: 'gulls', count: Math.round(12 * density), center: [cs.x, top + wander[1] + slack, cs.z], radius: span, height: 8, wander });
      const W = overTops.uniforms.uWander.value, iA = overTops.geometry.attributes.iA, iB = overTops.geometry.attributes.iB, bx = 1.5 * W.x, bz = W.z;
      const loop = []; for (let s = 0; s < overTops.route.length; s += STEP) { overTops.route.pointAt(s, q); loop.push(q.x, q.y, q.z); }
      for (let b = 0; b < overTops.count; b++) {
        // (a bird's stations: the loop's, moved by its offset; floor: the level of its box's under side; low: its
        // lowest floor; lift: its greatest ask so far)
        const ox = iA.getX(b), oy = iA.getY(b) - W.y, oz = iB.getW(b); let lift = 0, low = Infinity, ia = nx, ib = -1, ja = nz, jb = -1;
        for (let k = 1; k < loop.length; k += 3) if (loop[k] + oy < low) low = loop[k] + oy;
        // (only what of hers stands higher than the slack under that lowest floor can ask anything of this bird:
        // the box of its squares in the field)
        for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) if (tops[j * nx + i] + slack > low) { if (i < ia) ia = i; if (i > ib) ib = i; if (j < ja) ja = j; if (j > jb) jb = j; }
        for (let k = 0; k < loop.length; k += 3) {
          const x = loop[k] + ox, floor = loop[k + 1] + oy, z = loop[k + 2] + oz;
          const i1 = Math.min(ib, Math.floor((x + bx + slack - gx) / GRAIN)), j1 = Math.min(jb, Math.floor((z + bz + slack - gz) / GRAIN));
          for (let j = Math.max(ja, Math.floor((z - bz - slack - gz) / GRAIN)); j <= j1; j++) for (let i = Math.max(ia, Math.floor((x - bx - slack - gx) / GRAIN)); i <= i1; i++) {
            const t = tops[j * nx + i];
            if (t + slack <= floor + lift) continue;
            // (d: the least distance in plan from the box to the square, nothing where the square lies under the box)
            const dx = Math.max(0, Math.abs(gx + (i + 0.5) * GRAIN - x) - bx - GRAIN / 2), dz = Math.max(0, Math.abs(gz + (j + 0.5) * GRAIN - z) - bz - GRAIN / 2), dd = dx * dx + dz * dz;
            if (dd < slack * slack) lift = Math.max(lift, t + Math.sqrt(slack * slack - dd) - floor);
          }
        }
        if (lift > 0) { iA.setY(b, iA.getY(b) + lift); most = Math.max(most, lift); }
      }
      overTops.bounds.radius += most;
      fauna.add(overTops);
    }
    await ctx.yield();
    // THE GULLS AMONG THE CLOUD COLUMNS AND THE SWIFTS OVER THE DANCERS' ROUND FLY OVER OR UNDER THE ROUTE, NEVER
    // ALONG IT AT ITS OWN LEVEL. Each of the three wheels is called as it was (its stream, count, centre, radius and
    // height; the gulls' spread of 2.5, 3 and 12 m; the swifts' size, and for their spread the kit's own for swifts),
    // and the kit spends each stream draw for draw as it always did.
    // THE WANDER, written out in each call. The gulls': the gulls' own, 5, 2.5 and 4 m at the gulls' own rate 0.35,
    // which by the shader's law is a box about a bird's place of 7.5 m either way along the world's x (one and a
    // half times the first figure), 2.5 m up and down and 4 m either way along its z. The swifts': two fifths of
    // the swifts' own (9, 5 and 8 m) at the swifts' own rate 0.7, that is 3.6, 2 and 3.2 m: a box of 5.4 m either
    // way along x, 2 m up and down and 3.2 m either way along z, so that a swift keeps to the air about its own
    // place, and one that is lifted over the route by the least that the rule below asks flies 3 to 7 m over it.
    // THE ROUTE AS A PLACE: the world's own route (the curve laid through the plan's line) is read at points LINE
    // of its length apart, and at its end; of them those over the flock's own ground in plan are kept (its loop, its
    // widest offsets, its box, the slack and EYE to every hand). The route is flown along that curve, so the place
    // flown is never further than half of LINE from a point read: EYE.
    // EACH BIRD IS MOVED BY ITS OWN NEED, UP OR DOWN, ONCE. The flock as the kit dealt it is read back from the
    // kit's own made thing (the baked loop, each bird's own offset from it, the wander's box). At every station of
    // a bird's course (the loop moved by its offset, PACE of the loop apart) a point of the route whose distance d
    // in plan from the bird's box is under the slack asks either that the box's floor stand the root of (slack
    // squared less d squared) over it or that the box's top stand as much under it; a point further off asks
    // nothing. The slack: BAR (the clear air kept about the route), the bird's reach (a gull's as over the sleeping
    // ship, GULL; a swift's as built at the call's size: the farthest corner of the kit's bird from its own place
    // at the largest size dealt, about 0.25 m), half of PACE, and EYE: 4.45 m for a gull, about 3 m for a swift. A
    // bird whose every station stands so already as dealt is not touched. Any other is given one move in height
    // for its whole course: the lesser of the least lift and the least lowering after which every station stands
    // either over all or under all that the route asks there; a lowering that would bring the box's floor nearer
    // than the reach to the ground or the sea (read under the box's middle and its four corners at stations SQ of
    // the loop apart) is not taken, and the lift is. The move is added to the bird's own offset in height (the
    // kit's attribute); no bird is moved sideways, none is removed, made smaller or faded. The kit's bounds are
    // grown by the greatest move. It reads nothing but the route, the ground and the kit's dealt flock, and it
    // draws nothing.
    // (BAR: the clear air. GULL: the reach a gull is counted by. PACE: how far apart along its loop a bird's
    // stations are read. LINE: how far apart along the route its points are read. EYE: how far the place flown
    // can be from the nearest point read. SQ: the side of the squares in plan that the route's points are kept by,
    // and how far apart along the loop the ground under a lowered box is read.)
    const BAR = 2, GULL = 1.7, PACE = 0.5, LINE = 1, EYE = LINE / 2, SQ = 4;
    const offRoute = (fl, reach) => {
      const W = fl.uniforms.uWander.value, iA = fl.geometry.attributes.iA, iB = fl.geometry.attributes.iB, bx = 1.5 * W.x, by = W.y, bz = W.z;
      const slack = BAR + reach + PACE / 2 + EYE, q = new THREE.Vector3(), loop = [], P = [], ask = [];
      let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity, ox = 0, oz = 0, most = 0;
      // (the flock's ground in plan: its loop, its widest offsets to either hand, its box, the slack and EYE)
      for (let s = 0; s < fl.route.length; s += PACE) { fl.route.pointAt(s, q); loop.push(q.x, q.y, q.z); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); z0 = Math.min(z0, q.z); z1 = Math.max(z1, q.z); }
      for (let b = 0; b < fl.count; b++) { ox = Math.max(ox, Math.abs(iA.getX(b))); oz = Math.max(oz, Math.abs(iB.getW(b))); }
      x0 -= ox + bx + slack + EYE; x1 += ox + bx + slack + EYE; z0 -= oz + bz + slack + EYE; z1 += oz + bz + slack + EYE;
      // (the route's points over that ground, LINE of the route apart and its end; to each square of SQ in plan, the
      // points that the box of a bird standing anywhere in it could come within the slack of)
      for (let s = 0; s < LEN + LINE; s += LINE) { path.posAtDist(Math.min(s, LEN), q); if (q.x > x0 && q.x < x1 && q.z > z0 && q.z < z1) P.push(q.x, q.y, q.z); }
      const nx = Math.floor((x1 - x0) / SQ) + 1, nz = Math.floor((z1 - z0) / SQ) + 1, sq = new Array(nx * nz), rx = bx + slack, rz = bz + slack;
      for (let p = 0; p < P.length; p += 3) {
        const i1 = Math.min(nx - 1, Math.floor((P[p] + rx - x0) / SQ)), j1 = Math.min(nz - 1, Math.floor((P[p + 2] + rz - z0) / SQ));
        for (let j = Math.max(0, Math.floor((P[p + 2] - rz - z0) / SQ)); j <= j1; j++) for (let i = Math.max(0, Math.floor((P[p] - rx - x0) / SQ)); i <= i1; i++) (sq[j * nx + i] || (sq[j * nx + i] = [])).push(p);
      }
      for (let b = 0; b < fl.count; b++) {
        const ax = iA.getX(b), ay = iA.getY(b), az = iB.getW(b); let up = 0, down = 0, need = false; ask.length = 0;
        for (let k = 0; k < loop.length; k += 3) {
          const x = loop[k] + ax, floor = loop[k + 1] + ay - by, z = loop[k + 2] + az, here = sq[Math.floor((z - z0) / SQ) * nx + Math.floor((x - x0) / SQ)];
          if (!here) continue;
          // (what the route asks at this station: the floor over every point of it that is within the slack of the
          // box in plan, by lift, or the top under every such point, by drop)
          let lift = -Infinity, drop = -Infinity;
          for (let n = 0; n < here.length; n++) {
            // (d: the least distance in plan from the box to the point, nothing where the point lies over or under the box)
            const p = here[n]; let dx = P[p] - x, dz = P[p + 2] - z;
            if (dx < 0) dx = -dx; dx -= bx; if (dx < 0) dx = 0; if (dz < 0) dz = -dz; dz -= bz; if (dz < 0) dz = 0;
            const dd = dx * dx + dz * dz; if (dd >= slack * slack) continue;
            const h = Math.sqrt(slack * slack - dd), over = P[p + 1] + h - floor, under = floor + 2 * by - P[p + 1] + h;
            if (over > 0 && under > 0) need = true; if (over > lift) lift = over; if (under > drop) drop = under;
          }
          if (lift > -Infinity) ask.push(lift, drop);
        }
        if (!need) continue;
        // (the least lift that leaves every station either over or under what the route asks there, and the least
        // lowering if it is the lesser: the stations are gone through forwards and backwards until nothing more is asked)
        for (let go = true; go;) {
          go = false;
          for (let i = 0; i < ask.length; i += 2) if (ask[i] > up && ask[i + 1] > -up) { up = ask[i]; go = true; }
          for (let i = ask.length - 2; go && i >= 0; i -= 2) if (ask[i] > up && ask[i + 1] > -up) up = ask[i];
        }
        for (let go = true; go && down < up;) {
          go = false;
          for (let i = 0; i < ask.length; i += 2) if (ask[i + 1] > down && ask[i] > -down) { down = ask[i + 1]; go = true; }
          for (let i = ask.length - 2; go && i >= 0; i -= 2) if (ask[i + 1] > down && ask[i] > -down) down = ask[i + 1];
        }
        // (the lowering is taken where it is the lesser and leaves the floor the reach over the ground and the sea
        // along the course: under the box's middle and its four corners, at stations SQ of the loop apart)
        let lower = down < up;
        for (let k = 0; lower && k < loop.length; k += 3 * SQ / PACE) {
          const x = loop[k] + ax, z = loop[k + 2] + az;
          lower = loop[k + 1] + ay - by - down >= reach + Math.max(groundAt(x, z), groundAt(x - bx, z - bz), groundAt(x + bx, z - bz), groundAt(x - bx, z + bz), groundAt(x + bx, z + bz));
        }
        iA.setY(b, ay + (lower ? -down : up)); most = Math.max(most, lower ? down : up);
      }
      fl.bounds.radius += most;
      return fl;
    };
    // (round a column of one row and round the arch's pier on the other hand, 11 to 30 m from the line, a few metres under it)
    for (const [a, c, n, rf] of [[lerp(COL.a0, COL.a1, 0.45), 21 * thirdSide, 9, R.flockColumn], [aEnd, -20 * thirdSide, 7, R.flockPier]]) {
      const [x, z] = lineW(a, c);
      const gulls = F.makeFlock({ rng: rf, species: 'gulls', count: Math.round(n * density), center: [x, END_Y - 4, z], radius: 9, height: 5, spread: [2.5, 3, 12], wander: [5, 2.5, 4, 0.35] });
      // (the kit's call is a build step, the reading and the moving the next)
      await ctx.yield();
      fauna.add(offRoute(gulls, GULL));
      await ctx.yield();
    }
    {
      const [x, z] = lineW(DANCE.a, DANCE.c);
      const swifts = F.makeFlock({ rng: R.flockRound, species: 'swifts', count: Math.round(14 * density), size: 0.6, center: [x, groundAt(x, z) + 14, z], radius: 44, height: 7, wander: [3.6, 2, 3.2, 0.7] });
      await ctx.yield();
      // (a swift's reach as built: the farthest corner of the kit's bird from its own place, at the largest size dealt)
      const S = swifts.geometry.attributes; let tip = 0, big = 0;
      for (let i = 0; i < S.position.count; i++) tip = Math.max(tip, Math.hypot(S.position.getX(i), S.position.getY(i), S.position.getZ(i)));
      for (let b = 0; b < swifts.count; b++) big = Math.max(big, S.iB.getX(b));
      fauna.add(offRoute(swifts, tip * big));
    }
    tick.push((dt, time, camera, u) => fauna.update(dt, time, camera, u));
    await ctx.yield();
    {
      const body = new THREE.SphereGeometry(1, 8, 6).scale(0.62, 0.42, 0.34).translate(0, 0.62, 0), head = new THREE.SphereGeometry(0.17, 6, 5).translate(0.66, 0.74, 0);
      const P = [...body.toNonIndexed().attributes.position.array, ...head.toNonIndexed().attributes.position.array], nb = body.toNonIndexed().attributes.position.count, Cc = [];
      for (let i = 0; i < P.length / 3; i++) Cc.push(...(i < nb ? [0.86, 0.83, 0.74] : [0.2, 0.17, 0.14]));
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); sg.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); sg.computeVertexNormals();
      const hillW = lineW(HILL.a, HILL.c), NS = Math.round(60 * density), sheep = new THREE.InstancedMesh(sg, plain, NS), flock = [], mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), one = new THREE.Vector3(1, 1, 1), pp = new THREE.Vector3();
      for (let i = 0; i < NS; i++) { const an = R.sheep.range(0, TAU), rr = Math.sqrt(R.sheep()) * HILL.r * 0.62; flock.push({ x: hillW[0] + Math.cos(an) * rr, z: hillW[1] + Math.sin(an) * rr, ph: R.sheep.range(0, TAU), w: R.sheep.range(0.02, 0.05), yaw: R.sheep.range(0, TAU) }); }
      // each grazes on a slow loop of its own, a few metres across
      const graze = (time) => { for (let i = 0; i < NS; i++) { const f = flock[i], x = f.x + 3 * Math.sin(time * f.w + f.ph), z = f.z + 3 * Math.cos(time * f.w * 0.8 + f.ph * 1.3); qq.setFromAxisAngle(up, f.yaw + 0.6 * Math.sin(time * f.w + f.ph)); mm.compose(pp.set(x, groundAt(x, z), z), qq, one); sheep.setMatrixAt(i, mm); } sheep.instanceMatrix.needsUpdate = true; };
      graze(0); sheep.frustumCulled = false; scene.add(sheep); tick.push((dt, time) => graze(time));
    }
    await ctx.yield();
    // THE VINES: trimmed rows on the slope 150 to 260 m to the left of the line, each row a clipped hedge laid on the ground in 10 m lengths
    {
      const rows = [], mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), ee = new THREE.Euler(0, 0, 0, 'YXZ'), pp = new THREE.Vector3(), ss = new THREE.Vector3(), yaw = Math.atan2(hdw.x, hdw.z);
      for (let c = VINES.c0; c > VINES.c1; c -= R.vines.range(4.2, 5)) for (let a = VINES.a0 + R.vines.range(0, 6); a < VINES.a1; a += 10) {
        if (R.vines.chance(0.04)) continue;
        const [x0, z0] = lineW(a, c), [x1, z1] = lineW(a + 10, c), y0 = groundAt(x0, z0), y1 = groundAt(x1, z1);
        rows.push([(x0 + x1) / 2, (y0 + y1) / 2 + 0.5, (z0 + z1) / 2, Math.atan2(y1 - y0, 10), R.vines.range(0.85, 1.15)]);
      }
      const vines = new THREE.InstancedMesh(new THREE.BoxGeometry(0.9, 1.1, 10.3), new THREE.MeshLambertMaterial({ color: '#4d7a34' }), rows.length);
      rows.forEach((r, i) => { ee.set(-r[3], yaw, 0); qq.setFromEuler(ee); mm.compose(pp.set(r[0], r[1], r[2]), qq, ss.set(1, r[4], 1)); vines.setMatrixAt(i, mm); });
      scene.add(vines);
    }
    // at dawn thin mist lies on the nook under the ridge: low heaps along the ridge's north foot, 30 to 44 m north of its line
    if (hourName === 'dawn') {
      const lows = [];
      for (let k = 0; k < 8; k++) {
        const r = lerp(24, 150, (k + R.mist.range(0.1, 0.9)) / 8), n = R.mist.range(30, 44), sc = R.mist.range(0.4, 0.6);
        lows.push({ position: [(KNOLL.x + RD[0] * r + ND[0] * n) * MX, 2.5, KNOLL.z + RD[1] * r + ND[1] * n], scale: sc });
      }
      const coveMist = fx.makeCloudPuffs({ rng: R.mist, sunDir, clouds: lows, puffs: 9, size: [14, 24], color: HOUR.lit, shadowColor: HOUR.shade, opacity: 0.5, rim: 0.3, drift: [0, 0, 0], veil: 0 });
      scene.add(coveMist.object);
      tick.push((dt, time, camera) => { coveMist.update(dt, time, camera); });
    }
    // THE CLOUDS OPEN (on one day in eight): a rift of gold light stands in the mist floor over the meadow and slow bright grains pour
    // from it; two peacocks with long trains, drawing a small bright car, keep a round of their own on the world's clock
    // (26 to 34 s, from a drawn phase): down a slant of light from over the first flank's crown to the rift's head, and
    // round again, for ever
    if (rare) {
      const side = R.rare.chance(0.5) ? 1 : -1, [rx, rz] = lineW(aAt(m.climb0) + 60, 95 * side), ry = groundAt(rx, rz), RH = MIST - 4 - ry, gold = C('#ffd98a');
      const shaftMat = new THREE.ShaderMaterial({ uniforms: { uTime: cloudMat.uniforms.uTime, uCol: { value: gold }, uNoise: { value: noiseTex } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true,
        vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform float uTime; uniform vec3 uCol; uniform sampler2D uNoise; varying vec2 vUv;
          void main() {
            float x = abs(vUv.x - .5) * 2., n = texture2D(uNoise, vec2(vUv.x * .7, vUv.y * .15 + uTime * .02)).r;
            gl_FragColor = vec4(uCol * (smoothstep(1., .1, x) * (.08 + .3 * vUv.y * vUv.y) * (.6 + .8 * n) * smoothstep(0., .08, vUv.y)), 1.);
          }` });
      // (two crossed sheets, one body)
      { const sg2 = new THREE.BufferGeometry(), P2 = [], U2 = [], I2 = [];
        for (const yaw of [0.4, 0.4 + Math.PI / 2]) { const pl = new THREE.PlaneGeometry(34, RH).rotateY(yaw), base = P2.length / 3; P2.push(...pl.attributes.position.array); U2.push(...pl.attributes.uv.array); for (const i of pl.index.array) I2.push(base + i); }
        sg2.setAttribute('position', new THREE.Float32BufferAttribute(P2, 3)); sg2.setAttribute('uv', new THREE.Float32BufferAttribute(U2, 2)); sg2.setIndex(I2);
        const sheet = new THREE.Mesh(sg2, shaftMat); sheet.position.set(rx, ry + RH / 2, rz); sheet.renderOrder = 6; scene.add(sheet); }
      // the grains: sized in metres (18 cm: bright flakes a span across, for none is ever nearer the line than 80 m and a
      // smaller one could not be seen from there), falling 2 to 4.5 m a second from the rift to the corn, each in its own
      // time, within 14 m of the rift's own axis. A medium, under the motes' law: never drawn smaller to the eye than
      // 0.0016 rad, and then as much dimmer as it is drawn too large (by the square), so that its light is what an 18 cm
      // grain sends; the scene's fog lies over it; no light is kept at any distance
      const NG = Math.round(420 * density), gg = new THREE.InstancedBufferGeometry(), ga = new Float32Array(NG * 4);
      gg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); gg.setIndex([0, 1, 2, 0, 2, 3]);
      for (let i = 0; i < NG; i++) { const an = R.rare.range(0, TAU), rr = Math.sqrt(R.rare()) * 13; ga.set([Math.cos(an) * rr, Math.sin(an) * rr, R.rare(), R.rare.range(2, 4.5)], i * 4); }
      gg.setAttribute('aG', new THREE.InstancedBufferAttribute(ga, 4)); gg.instanceCount = NG; gg.boundingSphere = new THREE.Sphere(new THREE.Vector3(rx, ry + RH / 2, rz), RH);
      const grains = new THREE.Mesh(gg, new THREE.ShaderMaterial({ uniforms: { uTime: cloudMat.uniforms.uTime, uCol: { value: gold }, uTop: { value: new THREE.Vector3(rx, ry + RH, rz) }, uFall: { value: RH }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } },
        fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute vec4 aG; uniform float uTime, uFall, fogDensity; uniform vec3 uTop; varying vec2 vUv; varying float vA;
          void main() {
            float f = fract(uTime * aG.w / uFall + aG.z);
            vec3 c = uTop + vec3(aG.x, -f * uFall, aG.y) + vec3(sin(uTime * .7 + aG.z * 40.), 0., cos(uTime * .6 + aG.z * 31.)) * .6;
            vec4 mv = viewMatrix * vec4(c, 1.); float dist = max(-mv.z, .01), size = max(.18, dist * .0016), away = length(mv.xyz), thin = min(1., .18 / (dist * .0016));
            mv.xy += position.xy * size * 2.5; vUv = position.xy;
            vA = sin(f * 3.14159) * thin * thin * exp(-fogDensity * fogDensity * away * away) * (.7 + .3 * sin(uTime * 4. + aG.z * 90.));
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`uniform vec3 uCol; varying vec2 vUv; varying float vA; void main() { float r = dot(vUv, vUv); gl_FragColor = vec4(uCol * (exp(-r * 6.) * 1.6 * vA * (1. - smoothstep(.8, 1., r))), 1.); }` }));
      grains.renderOrder = 7; scene.add(grains);
      // the peacocks and the car: plain small shapes, each bird 5 m from beak to the end of its train
      const P = [], Cc = [], blue = lin('#1f5fb4'), green = lin('#2f9a6a'), eye = lin('#d8c04a');
      const part = (g, col) => { const a2 = g.toNonIndexed().attributes.position.array; for (let i = 0; i < a2.length; i += 3) { P.push(a2[i], a2[i + 1], a2[i + 2]); Cc.push(col[0], col[1], col[2]); } };
      part(new THREE.SphereGeometry(1, 8, 6).scale(0.55, 0.32, 0.3), blue); part(new THREE.SphereGeometry(0.15, 6, 5).translate(0.78, 0.42, 0), blue); part(new THREE.CylinderGeometry(0.06, 0.1, 0.5, 5).rotateZ(-0.7).translate(0.6, 0.24, 0), blue);
      for (let k = 0; k < 8; k++) { const x0 = -0.4 - k * 0.5, w0 = 0.2 + 0.75 * Math.sin(Math.PI * (k + 0.5) / 9), w1 = 0.2 + 0.75 * Math.sin(Math.PI * (k + 1.5) / 9), y0 = -0.03 * k * k, y1 = -0.03 * (k + 1) * (k + 1), col = k % 2 ? eye : green;
        P.push(x0, y0, -w0, x0, y0, w0, x0 - 0.5, y1, w1, x0, y0, -w0, x0 - 0.5, y1, w1, x0 - 0.5, y1, -w1); for (let q = 0; q < 6; q++) Cc.push(col[0], col[1], col[2]); }
      for (const sz of [-1, 1]) { P.push(0.3, 0.1, sz * 0.25, -0.35, 0.1, sz * 0.25, -0.1, 0.32, sz * 1.7); for (let q = 0; q < 3; q++) Cc.push(green[0] * 0.8, green[1] * 0.8, green[2]); }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); bg.computeVertexNormals();
      const birdMat = plain2, team = new THREE.Group(), birds = [];
      for (const sz of [-1, 1]) { const b2 = new THREE.Mesh(bg, birdMat); b2.position.set(2.4, 0, sz * 1.3); team.add(b2); birds.push(b2); }
      const carM = new THREE.Mesh(new THREE.SphereGeometry(0.75, 10, 8).scale(1.3, 0.8, 1), new THREE.MeshBasicMaterial({ color: gold.clone().multiplyScalar(2.2) })); carM.position.set(-3.6, -0.2, 0); team.add(carM);
      const A0 = new THREE.Vector3(fronts[0].x, MIST + fronts[0].H + 40, fronts[0].z), A1 = new THREE.Vector3(rx, ry + RH + 6, rz), slant = new THREE.Vector3().subVectors(A1, A0).normalize();
      team.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), slant); scene.add(team);
      const ph = R.rare.range(0, 1), roundT = R.rare.range(26, 34);
      tick.push((dt, time) => {
        const p2 = (time / roundT + ph) % 1, sc = 1.7 * smoothstep(0, 0.07, p2) * (1 - smoothstep(0.9, 1, p2)) + 1e-4;
        team.position.lerpVectors(A0, A1, p2); team.position.y += 0.8 * Math.sin(time * 0.9); team.scale.setScalar(sc);
        birds[0].rotation.x = 0.25 * Math.sin(time * 1.1); birds[1].rotation.x = 0.25 * Math.sin(time * 1.1 + 1.4);
      });
    }
    await ctx.yield();
    // THE DANCERS: reapers in straw hats and nymphs crowned with green, two rings turning opposite ways in the mown round.
    // Vanishing is their habit: on one drawn turn of 40 to 60 s each ring thins to motes over 3 s, is gone for a
    // moment and gathers again over 3 s; the two rings' thin spells stand half a turn apart, so the round is never empty.
    const [danceX, danceZ] = lineW(DANCE.a, DANCE.c), danceU = { uTime: { value: 0 }, uThin: { value: new THREE.Vector2(0, 0) }, uCentre: { value: new THREE.Vector3(danceX, groundAt(danceX, danceZ), danceZ) }, uSunDir: { value: sunDir }, uLight: twin.light.uSunCol, uSkyL: twin.light.uSky, uMote: { value: fireColor },
      fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } };
    {
      const figure = (hat) => {
        const P = [], Cc = [], A = [];
        const part = (g, col, arm) => { const a = g.toNonIndexed().attributes.position.array; for (let i = 0; i < a.length; i += 3) { P.push(a[i], a[i + 1], a[i + 2]); Cc.push(col[0], col[1], col[2]); A.push(arm); } };
        const dress = hat ? lin('#d8c8a0') : lin('#9fd0c0'), skin = hat ? lin('#b07a4e') : lin('#e6c8a8');
        part(new THREE.CylinderGeometry(0.15, 0.34, 0.95, 7).translate(0, 0.48, 0), dress, 0);
        part(new THREE.CylinderGeometry(0.17, 0.15, 0.5, 7).translate(0, 1.2, 0), hat ? lin('#e8e0cc') : dress, 0);
        part(new THREE.SphereGeometry(0.13, 7, 5).translate(0, 1.58, 0), skin, 0);
        for (const sx of [-1, 1]) part(new THREE.CylinderGeometry(0.045, 0.045, 0.62, 5).translate(0, 0.31, 0).rotateZ(-sx * 0.75).translate(sx * 0.16, 1.4, 0), skin, sx);
        if (hat) part(new THREE.ConeGeometry(0.31, 0.13, 9).translate(0, 1.73, 0), lin('#e2c36a'), 0);
        else part(new THREE.TorusGeometry(0.125, 0.04, 5, 10).rotateX(Math.PI / 2).translate(0, 1.67, 0), lin('#4f9a3c'), 0);
        const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aArm', new THREE.Float32BufferAttribute(A, 1)); g.computeVertexNormals();
        return g;
      };
      const mat = new THREE.ShaderMaterial({ uniforms: danceU, fog: true,
        vertexShader: /* glsl */`
          attribute vec3 color; attribute float aArm; attribute vec4 aRing;
          uniform float uTime; uniform vec2 uThin; uniform vec3 uCentre; varying vec3 vC, vN; varying float vH, vThin;
          #include <fog_pars_vertex>
          void main() {
            // aRing: the ring's radius, the place in it, the way it turns, the dancer's own phase
            float an = aRing.y + aRing.z * uTime * .34, hop = abs(sin(uTime * 2.6 + aRing.w));
            vec3 p = position; p.x += aArm * sin(uTime * 2.6 + aRing.w) * .12 * step(1.2, p.y); p.y += hop * .22 + aArm * aArm * hop * .1;
            float ca = cos(an), sa = sin(an), cf = aRing.z * -sa, sf = aRing.z * ca;
            vec3 q = vec3(p.x * sf + p.z * cf, p.y, -p.x * cf + p.z * sf) + uCentre + vec3(ca, 0., sa) * aRing.x;
            vThin = aRing.z > 0. ? uThin.y : uThin.x;
            q.y += vThin * vThin * 2.5 * fract(aRing.w * 7.3 + position.y * 3.1);
            vN = normalize(vec3(normal.x * sf + normal.z * cf, normal.y, -normal.x * cf + normal.z * sf)); vC = color; vH = fract(dot(position, vec3(37.1, 91.7, 53.3)) + aRing.w);
            vec4 mvPosition = viewMatrix * vec4(q, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uSunDir, uLight, uSkyL, uMote; varying vec3 vC, vN; varying float vH, vThin;
          #include <fog_pars_fragment>
          void main() {
            float h = fract(sin(dot(floor(gl_FragCoord.xy), vec2(12.9898, 78.233)) + vH * 40.) * 43758.5453);
            if (h < vThin * 1.25 - .1) discard;
            vec3 col = vC * (uSkyL * .55 + uLight * (.08 + .3 * clamp(dot(normalize(vN), uSunDir), 0., 1.)));
            gl_FragColor = vec4(mix(col, uMote * 1.6, smoothstep(.05, .7, vThin)), 1.);
            #include <fog_fragment>
          }` });
      for (const hat of [1, 0]) {
        const g = figure(hat), n = Math.ceil(V.dancers / 2), ring = new Float32Array(n * 4);
        // reapers and nymphs stand alternately: the inner ring (6 m) turns one way, the outer (9 m) the other
        for (let i = 0; i < n; i++) { const k = i * 2 + (hat ? 0 : 1), outer = k % 4 < 2; ring.set([outer ? 9 : 5.6, (k + R.dancers.range(-0.15, 0.15)) / V.dancers * TAU * 2, outer ? 1 : -1, R.dancers.range(0, TAU)], i * 4); }
        g.setAttribute('aRing', new THREE.InstancedBufferAttribute(ring, 4)); g.instanceCount = n; g.boundingSphere = new THREE.Sphere(danceU.uCentre.value.clone(), 16);
        scene.add(new THREE.Mesh(g, mat));
      }
      const turnT = R.dancers.range(40, 60), turnPh = R.dancers.range(0, 1), turns = [0, 1].map((i) => ({ T: turnT, ph: turnPh + i * 0.5 }));
      // 0 whole .. 1 all motes, at a point p of a ring's turn of T seconds
      const thinAt = (p, T) => { const sec = p * T; return smoothstep(0, 3, sec) * (1 - smoothstep(4.5, 7.5, sec)); };
      tick.push((dt, time) => {
        danceU.uTime.value = time;
        danceU.uThin.value.set(thinAt((time / turns[0].T + turns[0].ph) % 1, turns[0].T), thinAt((time / turns[1].T + turns[1].ph) % 1, turns[1].T));
      });
    }
    await ctx.yield();
    // MOTES OF LIGHT, the island's music seen: strings of 8 to 20 blue-white motes rising and falling together like a
    // phrase, hung over the nook, the sands, the avenue of limes and the fields up to the arch, thickest among the limes.
    // Each string drifts 36 m along its own heading and comes round again. None hangs where any part of its round would
    // come within 1.5 m of the line. Sized in metres. They are a medium, as the rain and the mist are: light hung in the
    // air, flown among, with no body to meet. The eye's distance thins them by three things only: their size in metres
    // (4 cm), the fog, and the floor of 0.0018 rad under which a mote is not drawn smaller but as much dimmer as it is
    // drawn too large, so that its light is what a 4 cm mote sends. Close to the lens they go out between 2.5 m and
    // 0.6 m of it, evenly.
    {
      const base = [], dir = [], kk = [], q = new THREE.Vector3(), t = new THREE.Vector3(), NSTR = Math.round(90 * density);
      for (let i = 0; i < NSTR; i++) {
        const inGrove = R.motes.chance(0.45), s0 = inGrove ? R.motes.range(m.grove0 - 10, m.grove1 + 10) : R.motes.range(m.P4, LEN - 20), n = R.motes.int(8, 20);
        path.posAtDist(s0, q); path.tangentAtDist(s0, t);
        const side = (R.motes.chance(0.5) ? 1 : -1) * R.motes.range(inGrove ? 1.6 : 4, inGrove ? 8 : 26), upY = R.motes.range(-0.8, inGrove ? 3.2 : 9), ph = R.motes.range(0, TAU), amp = R.motes.range(0.3, 0.9), gap = R.motes.range(0.5, 0.9), sp = R.motes.range(0.6, 1.5);
        let al = 0; const keep = base.length, keepK = kk.length;
        for (let k = 0; k < n; k++) { const jx = R.motes.range(-0.3, 0.3), jy = R.motes.range(-0.25, 0.25); base.push(q.x - t.z * (side + jx), Math.max(q.y + upY, groundAt(q.x - t.z * side, q.z + t.x * side) + 0.6) + jy, q.z + t.x * (side + jx)); dir.push(t.x, t.y, t.z); kk.push(al, ph, amp, sp); al += gap * R.motes.range(0.4, 1.9); }
        // (its whole round, from 18 m behind its first mote to 18 m before its last, against the line near it; the motes of a string stand up to 0.3 m to either side of it)
        { const bx = q.x - t.z * side, by = Math.max(q.y + upY, groundAt(q.x - t.z * side, q.z + t.x * side) + 0.6), bz = q.z + t.x * side, d0 = -18, d1 = al + 18, slack = 1.3 * amp + 0.25; let least = 1e9;
          // (first against the whole line as it was walked at every 2 m, to past its end: no place of the line is further than a metre from
          // one of those, so a string that stands 3.6 m and more from all of them is clear, and only the others are measured at every metre)
          const coarse = lineRun(0, LEN + 2); let rough = 1e9;
          for (let i = 3 * Math.max(0, Math.floor((s0 + d0 - 30) / 2) - 1), e = Math.min(coarse.length, 3 * (Math.ceil((s0 + d1 + 30) / 2) + 2)); i < e; i += 3) {
            const d = clamp((coarse[i] - bx) * t.x + (coarse[i + 1] - by) * t.y + (coarse[i + 2] - bz) * t.z, d0, d1);
            rough = Math.min(rough, Math.hypot(coarse[i] - bx - t.x * d, Math.max(0, Math.abs(coarse[i + 1] - by - t.y * d) - slack), coarse[i + 2] - bz - t.z * d));
          }
          if (rough < 3.6) for (let sq = Math.max(0, s0 + d0 - 30); sq <= Math.min(LEN, s0 + d1 + 30); sq += 1) {
            path.posAtDist(sq, gp); const d = clamp((gp.x - bx) * t.x + (gp.y - by) * t.y + (gp.z - bz) * t.z, d0, d1);
            least = Math.min(least, Math.hypot(gp.x - bx - t.x * d, Math.max(0, Math.abs(gp.y - by - t.y * d) - slack), gp.z - bz - t.z * d));
          }
          if (least < 1.85) { base.length = keep; dir.length = keep; kk.length = keepK; } }
      }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('aBase', new THREE.InstancedBufferAttribute(new Float32Array(base), 3)); g.setAttribute('aDir', new THREE.InstancedBufferAttribute(new Float32Array(dir), 3)); g.setAttribute('aK', new THREE.InstancedBufferAttribute(new Float32Array(kk), 4));
      g.instanceCount = base.length / 3; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      const moteU = { uTime: { value: 0 }, uCol: { value: fireColor }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } };
      const motes = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: moteU, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute vec3 aBase, aDir; attribute vec4 aK; uniform float uTime, fogDensity; varying vec2 vUv; varying float vA;
          void main() {
            // the whole string drifts 36 m along its heading and comes round again, faint at both ends of the round
            float turn = fract(uTime * aK.w / 36. + aK.y), along = aK.x + turn * 36. - 18.;
            vec3 c = aBase + aDir * along + vec3(0., aK.z * sin(aK.y * 3. + aK.x * .55 - uTime * 1.5) + .3 * aK.z * sin(uTime * .6 + aK.y + aK.x * .21), 0.);
            vec4 mv = viewMatrix * vec4(c, 1.);
            // 4 cm across, and never drawn smaller to the eye than 0.0018 rad: then dimmer by the square of what it is drawn too large
            float dist = max(-mv.z, .01), size = max(.04, dist * .0018), away = length(mv.xyz), thin = min(1., .04 / (dist * .0018));
            mv.xy += position.xy * size * 3.;
            vUv = position.xy;
            vA = sin(turn * 3.14159) * smoothstep(.6, 2.5, away) * thin * thin * exp(-fogDensity * fogDensity * away * away) * (.7 + .3 * sin(uTime * 3.1 + aK.x * 5.));
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; varying vec2 vUv; varying float vA;
          void main() { float r = dot(vUv, vUv); gl_FragColor = vec4(uCol * (exp(-r * 9.) * 1.5 + exp(-r * 2.5) * .14) * vA * (1. - smoothstep(.8, 1., r)), 1.); }` }));
      motes.frustumCulled = false; motes.renderOrder = 7; scene.add(motes);
      tick.push((dt, time) => { moteU.uTime.value = time; });
    }
    // ------------------------------------------------------------ the sands: printless steps, springs and rills, brine pits
    // The steps: about 30 files, evenly along the beach with a drawn place in each stretch (from 4 m past the sands'
    // first metre to a = 146, 4 m short of where the lip's straight ends). Each is a runner who chases the water's lip
    // down the sand as it draws back and flies it as it comes, at his own place along the shore: he keeps his own drawn
    // height above the lip (0.4 to 1.2 m) and goes down no farther than his own drawn turning mark (1.85 to 2.85 m to
    // the right of the line: the lane that is kept clear by place is 1.5 m, and a print's sheet is 0.3 m to each side).
    // The lip is the sea shader's own (same numbers): its 33 m wave stands high on some stretches of the sands and low
    // on others at every moment, so where it is low the runners are down at their marks, 1.85 to 2.85 m from the line
    // (and run along the shore there, each to his own reach of 2 to 5 m and back, at his own pace),
    // and where it is high they are up the sand beyond the water. Nothing of this reads the eye. The last 16 footfalls of
    // each show, each a foot-sized dark wet dent with a gleam on it, smoothed away in two seconds.
    const SHORE_C = LIP_C, SLOPE = 0.03, sandA0 = aAt(m.Q);
    {
      const NL = Math.round(30 * density), ln = new Float32Array(NL * 16 * 4), fl = new Float32Array(NL * 16 * 3);
      for (let i = 0; i < NL; i++) { const a = lerp(sandA0 + 4, 146, (i + R.steps.range(0.1, 0.9)) / NL), ph = R.steps.range(0, 1), tau = R.steps.range(0.12, 0.17); for (let j = 0; j < 16; j++) ln.set([a, ph, tau, j], (i * 16 + j) * 4); }
      // (drawn after all the places, so every file keeps the place, the phase and the pace it had)
      for (let i = 0; i < NL; i++) { const up = R.steps.range(0.4, 1.2), mark = R.steps.range(1.85, 2.85); for (let j = 0; j < 16; j++) fl.set([up, mark], (i * 16 + j) * 3); }
      // (and each file's reach along the shore, 2 to 5 m, for when its wave has drawn back below its mark)
      for (let i = 0; i < NL; i++) { const reach = R.steps.range(2, 5); for (let j = 0; j < 16; j++) fl[(i * 16 + j) * 3 + 2] = reach; }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, -1, 1, 0, -1, 1, 0, 1, -1, 0, 1], 3)); g.setIndex([0, 2, 1, 0, 3, 2]);
      g.setAttribute('aLine', new THREE.InstancedBufferAttribute(ln, 4)); g.setAttribute('aFile', new THREE.InstancedBufferAttribute(fl, 3)); g.instanceCount = NL * 16; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      const stepU = { uTime: { value: 0 }, uCol: { value: fireColor }, uQ: { value: new THREE.Vector2(Qw[0], Qw[1]) }, uHd: { value: new THREE.Vector2(hdW[0], hdW[1]) }, uRt: { value: new THREE.Vector2(MX * isle.rt[0], isle.rt[1]) }, uShore: { value: new THREE.Vector2(SHORE_C, SLOPE) } };
      const steps = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: stepU, transparent: true, depthWrite: false,
        vertexShader: /* glsl */`
          attribute vec4 aLine; attribute vec3 aFile; uniform float uTime; uniform vec2 uQ, uHd, uRt, uShore; varying vec2 vUv; varying float vA, vT;
          // metres to the right of the line at which the water's lip stands, at a place along the shore and a time
          float lip(float a, float t) { return uShore.x + (.1 * sin(t * .62 - a * ${SWASH_K}) + .045 * sin(t * 1.13 + a * .11)) / uShore.y; }
          void main() {
            float tau = aLine.z, n = floor(uTime / tau + aLine.y) - aLine.w, t = (n - aLine.y) * tau, age = uTime - t;
            float foot = mod(n, 2.) * 2. - 1.;
            // where its wave has drawn back below its mark the runner does not stand: he runs along the shore at his own
            // pace (a third of a metre to a step), to his reach and back
            float low = lip(aLine.x, t) + aFile.x, pace = .33 / tau, tri = abs(fract(t * pace / (2. * aFile.z) + aLine.y) * 2. - 1.) * 2. - 1.;
            float c = max(aFile.y, low), a = aLine.x + foot * .11 + .5 * sin(n * .7 + aLine.y * 40.) + aFile.z * tri * smoothstep(0., .5, aFile.y - low);
            vec2 xz = uQ + uHd * (a + position.x * .2) + uRt * (c + position.z * .3);
            vUv = position.xz; vT = age; vA = (1. - age * .5) * (1. - age * .5) * step(0., age) * step(age, 2.);
            gl_Position = projectionMatrix * viewMatrix * vec4(xz.x, max(0., (c - uShore.x) * uShore.y) + .035, xz.y, 1.);
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; varying vec2 vUv; varying float vA, vT;
          void main() {
            // the print: a dark wet dent the shape of a small foot (0.15 by 0.23 m) with a gleam on its far lip, fading;
            // and its little splash, a ring that widens for half a second
            vec2 q = vUv * vec2(2.6, 1.7), q2 = (vUv - vec2(.07, -.12)) * vec2(4.2, 2.8);
            float r = length(vUv), dent = exp(-dot(q, q) * 3.) * .8 * vA, gleam = exp(-dot(q2, q2) * 3.) * vA, ring = exp(-(r - vT * 1.7) * (r - vT * 1.7) * 60.) * clamp(1. - vT * 2., 0., 1.);
            float al = clamp(dent + gleam + ring, 0., 1.) * (1. - smoothstep(.8, 1., r));
            gl_FragColor = vec4((vec3(.09, .065, .04) * dent + uCol * (gleam * .55 + ring * .6)) / max(dent + gleam + ring, 1e-3), al);
          }` }));
      steps.frustumCulled = false; steps.renderOrder = 2; scene.add(steps); tick.push((dt, time) => { stepU.uTime.value = time + seaPh; });
      // each footfall's little splash: a few bright drops thrown up 20 cm and fallen again within half a second (0.44 m by 0.6 m, standing)
      const sg = new THREE.InstancedBufferGeometry(); sg.setAttribute('position', g.attributes.position); sg.setIndex([0, 2, 1, 0, 3, 2]);
      sg.setAttribute('aLine', g.attributes.aLine); sg.setAttribute('aFile', g.attributes.aFile); sg.instanceCount = NL * 16; sg.boundingSphere = g.boundingSphere;
      const splashes = new THREE.Mesh(sg, new THREE.ShaderMaterial({ uniforms: stepU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true,
        vertexShader: /* glsl */`
          attribute vec4 aLine; attribute vec3 aFile; uniform float uTime; uniform vec2 uQ, uHd, uRt, uShore; varying vec2 vUv; varying float vT, vS;
          float lip(float a, float t) { return uShore.x + (.1 * sin(t * .62 - a * ${SWASH_K}) + .045 * sin(t * 1.13 + a * .11)) / uShore.y; }
          void main() {
            float tau = aLine.z, n = floor(uTime / tau + aLine.y) - aLine.w, t = (n - aLine.y) * tau, age = uTime - t;
            float foot = mod(n, 2.) * 2. - 1.;
            // where its wave has drawn back below its mark the runner does not stand: he runs along the shore at his own
            // pace (a third of a metre to a step), to his reach and back
            float low = lip(aLine.x, t) + aFile.x, pace = .33 / tau, tri = abs(fract(t * pace / (2. * aFile.z) + aLine.y) * 2. - 1.) * 2. - 1.;
            float c = max(aFile.y, low), a = aLine.x + foot * .11 + .5 * sin(n * .7 + aLine.y * 40.) + aFile.z * tri * smoothstep(0., .5, aFile.y - low);
            vec2 xz = uQ + uHd * a + uRt * c;
            // (a splash only where the foot falls in the sheet of water the wave leaves, within 0.9 m above its lip: on
            // the sand above it a foot leaves its dent and no more)
            float on = step(0., age) * step(age, .5) * (1. - smoothstep(.7, .95, c - lip(aLine.x, t)));
            vec4 mv = viewMatrix * vec4(xz.x, max(0., (c - uShore.x) * uShore.y) + .03, xz.y, 1.);
            mv.xy += vec2(position.x * .22, (position.z * .5 + .5) * .45) * on;
            vUv = vec2(position.x, position.z * .5 + .5); vT = age; vS = n * 1.7 + aLine.y * 60.;
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; varying vec2 vUv; varying float vT, vS;
          void main() {
            float tt = clamp(vT * 2., 0., 1.), a = 0.;
            for (int i = 0; i < 5; i++) {
              float fi = float(i); vec2 d = vec2((fi - 2.) * .3 + .14 * sin(fi * 7.3 + vS), 1.1 + .35 * sin(fi * 3.1 + vS * 2.));
              vec2 q = vUv - vec2(d.x * tt, .04 + max(d.y * (tt - tt * tt), 0.)); q.x *= .37;
              a += exp(-dot(q, q) * 520.);
            }
            gl_FragColor = vec4(uCol * (a * (1. - tt) * .75), 1.);
          }` }));
      splashes.frustumCulled = false; splashes.renderOrder = 3; scene.add(splashes);
    }
    // THE SANDS' THINGS. The whole sand, from the nook's inner corner to 6 m short of the first lime, is laid out in eight
    // even stretches; each holds one thing whose middle lies 6.5 to 9.5 m to the right of the sands' line (its near side
    // 3 to 8 m off) in the middle half of its stretch, so two things are never nearer than half a stretch: driftwood, a
    // spring, a brine pit or worn boulders, two of each, in a drawn order. None stands within 5 m of the pine's foot.
    {
      const P = [], Cc = [], I = [], RP = [], RU = [], RI = [], SHADE = [], LOGS = [], NEAR = [];
      const crust = lin('#f4efe4'), brine = lin('#8fb0b4'), bleached = lin('#b6ad9c'), heart = lin('#6e6252'), pool = lin('#a9d8cf'), moss = lin('#4f8a34');
      const sandY = (a, c) => { const w = lineW(a, c); return groundAt(w[0], w[1]); };
      // a round limb along points [[a, y, c], ...] in the sands' frame with a radius at each, 7 round
      const limb = (pts, rad, col) => {
        const base = P.length / 3, NA = 7;
        for (let j = 0; j < pts.length; j++) {
          const q = pts[j], q0 = pts[Math.max(0, j - 1)], q1 = pts[Math.min(pts.length - 1, j + 1)], ta = q1[0] - q0[0], tc = q1[2] - q0[2], tl = Math.hypot(ta, tc) || 1, sh = 0.8 + 0.2 * R.sands();
          for (let k = 0; k < NA; k++) { const an = k / NA * TAU, off = Math.cos(an) * rad[j], [x, z] = lineW(q[0] - tc / tl * off, q[2] + ta / tl * off); P.push(x, q[1] + Math.sin(an) * rad[j], z); Cc.push(col[0] * sh, col[1] * sh, col[2] * sh); }
        }
        // (the rings are laid in the line's own frame, which the mirror turns over: the faces' order turns with it, so that they face outward on either hand)
        for (let j = 0; j < pts.length - 1; j++) for (let k = 0; k < NA; k++) { const p0 = base + j * NA + k, p1 = base + j * NA + (k + 1) % NA; if (MX > 0) I.push(p0, p0 + NA, p1, p1, p0 + NA, p1 + NA); else I.push(p0, p1, p0 + NA, p1, p1 + NA, p0 + NA); }
      };
      // driftwood: a bleached trunk lying on the sand, bent a little, its butt thick and its top broken; two or three stubs of boughs
      const wood = (a, c, len) => {
        const dir = R.sands.range(-0.5, 0.5), bend = R.sands.range(-0.12, 0.12), r0 = len * R.sands.range(0.05, 0.065), pts = [], rad = [], N = 9;
        for (let j = 0; j <= N; j++) { const t = j / N - 0.5, ang = dir + bend * t * 4, aa = a + Math.cos(ang) * t * len, cc = c + Math.sin(ang) * t * len, r = r0 * (j === 0 || j === N ? 0.35 : lerp(1, 0.55, j / N)); pts.push([aa, sandY(aa, cc) + r0 * 0.7, cc]); rad.push(r); }
        limb(pts, rad, bleached); LOGS.push([pts, r0]);
        for (let q = 0, n = R.sands.int(2, 3); q < n; q++) { const j = R.sands.int(2, N - 2), o = pts[j], sl = len * R.sands.range(0.12, 0.22), sa = dir + (q % 2 ? 1 : -1) * R.sands.range(0.7, 1.2); limb([o, [o[0] + Math.cos(sa) * sl * 0.5, o[1] + sl * 0.3, o[2] + Math.sin(sa) * sl * 0.5], [o[0] + Math.cos(sa) * sl, o[1] + sl * 0.75, o[2] + Math.sin(sa) * sl]], [rad[j] * 0.5, rad[j] * 0.36, rad[j] * 0.12], heart); }
      };
      // a stone's colour by the depth of water it stands in: the sand's brown on the sand, a slate grey from half a metre of water on
      const stoneCol = (deep) => { const w = clamp(deep / 0.5, 0, 1); return [lerp(ROCK[0], WET_ROCK[0], w), lerp(ROCK[1], WET_ROCK[1], w), lerp(ROCK[2], WET_ROCK[2], w)]; };
      // a worn boulder: a rounded lump, flattened, half sunk in the sand
      const boulder = (a, c, r, rng = R.sands, deep = 0) => {
        // (deep: the water's depth where it stands in the water; its lower half is then drawn out so that its foot is on the bottom, and it is wet: the sand's brown goes to a slate grey over the first half metre of depth, with no step at the water's edge)
        const base = P.length / 3, NU = 9, NV = 6, [x, z] = lineW(a, c), y = groundAt(x, z), ph = rng.range(0, TAU), col = stoneCol(deep);
        if (y > 0) SHADE.push([x, z, r, r * 0.82]);
        for (let j = 0; j <= NV; j++) for (let i = 0; i < NU; i++) {
          const th = i / NU * TAU, la = j / NV * Math.PI, rr = r * (1 + 0.18 * Math.sin(th * 2 + ph) * Math.sin(la) + 0.1 * Math.sin(th * 3 + la * 2 + ph * 2)), sh = 0.72 + 0.28 * Math.sin(la) * (0.7 + 0.3 * rng());
          P.push(x + Math.cos(th) * Math.sin(la) * rr, y + r * 0.2 - Math.cos(la) * (deep > 0 && j < NV / 2 ? Math.max(rr * 0.62, deep + r * 0.2 + 0.1) : rr * 0.62), z + Math.sin(th) * Math.sin(la) * rr); Cc.push(col[0] * sh, col[1] * sh, col[2] * sh);
        }
        // (faces outward: the rings run from the foot up and round with the angle)
        for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const p0 = base + j * NU + i, p1 = base + j * NU + (i + 1) % NU; I.push(p0, p0 + NU, p1, p1, p0 + NU, p1 + NU); }
      };
      // a flat round of rings on the sand: [share of the radius, colour] from the middle out, its outline uneven
      const round = (a, c, rad, rings) => {
        const [x, z] = lineW(a, c), y = groundAt(x, z) + 0.05, base = P.length / 3, ph = R.sands.range(0, TAU), nr = rings.length;
        P.push(x, y, z); Cc.push(...rings[0][1]);
        for (const [rk, col] of rings) for (let i = 0; i < 20; i++) { const an = i / 20 * TAU, rr = rad * rk * (1 + 0.16 * Math.sin(an * 3 + ph) + 0.08 * Math.sin(an * 7 + ph * 2)); P.push(x + Math.cos(an) * rr, y, z + Math.sin(an) * rr); Cc.push(col[0], col[1], col[2]); }
        for (let i = 0; i < 20; i++) { const j = (i + 1) % 20; I.push(base, base + 1 + j, base + 1 + i); for (let r = 0; r < nr - 1; r++) { const p0 = base + 1 + r * 20 + i, p1 = base + 1 + r * 20 + j; I.push(p0, p1, p0 + 20, p1, p1 + 20, p0 + 20); } }
      };
      // A SPRING'S BROOK: from its pool down the sand to the water's mean lip, wandering, IN A BED OF ITS OWN: cut 0.2
      // to 0.4 m into the sand (deepest along its middle course, shoaling to nothing where it fans out at the lip),
      // 0.9 m wide at the spring and 1.8 m at its mouth; its banks' faces of damp sand, its bed darker with pebbles on it and along its
      // banks, clear water standing half-way up the cut and running on the world clock; a margin of wet dark sand 0.7 m
      // either side. (The cut is drawn as a cut: where its opening shows, the ground's depth is set aside and the bed,
      // the banks and the water are drawn in it.)
      const BK = { P: [], C: [], I: [], MP: [], MI: [] }, pebbleTones = ['#8c8a84', '#b9a074', '#d8d2c2', '#5e5a54'].map(lin);
      const rill = (a0, c0) => {
        const ph = R.sands.range(0, TAU), NSEG = 40, deep = R.brook.range(0.2, 0.4), rows = [];
        // (down the sand to half a metre below the water's mean lip: the swash covers its mouth and bares it)
        const cEnd = LIP_C - 0.5;
        const at = (a, c, dy) => { const [x, z] = lineW(a, c); return [x, groundAt(x, z) + dy, z]; };
        for (let i = 0; i <= NSEG; i++) {
          const t = i / NSEG, c = lerp(c0, cEnd, t), a = a0 + 1.6 * Math.sin(c * 0.5 + ph) * t + 3 * t * t, w = lerp(0.45, 0.9, t), d = deep * smoothstep(0, 0.12, t) * (1 - smoothstep(0.7, 1, t)), run = t * (c0 - cEnd) * 2 + ph;
          rows.push({ a, c, w, d, t });
          const rb = RP.length / 3, bb = BK.P.length / 3, mb = BK.MP.length / 3;
          for (const sd of [-1, 1]) {
            const top = at(a + sd * w, c, 0.035), out = at(a + sd * (w + 0.7), c, 0.035), bot = at(a + sd * (w - 0.1), c, 0.035 - d), wat = at(a + sd * (w - 0.04), c, 0.03 - d * 0.5);
            // the margin (across 20 at the bank to 21 at its outer edge) and the water (across -1..1)
            RP.push(...top, ...out, ...wat); RU.push(20 + 0.6 * smoothstep(0.75, 1, t), run, 21, run, sd, run);
            BK.MP.push(...top);
            const k = 0.85 + 0.15 * R.brook(); BK.P.push(...top, ...bot); BK.C.push(SAND[0] * 0.8 * k, SAND[1] * 0.8 * k, SAND[2] * 0.8 * k, SAND_WET[0] * 0.5 * k, SAND_WET[1] * 0.5 * k, SAND_WET[2] * 0.5 * k);
          }
          if (i < NSEG) {
            // (per row: margin top/out and water for either side at rb + 0..5; bank top/bottom for either side at bb + 0..3)
            RI.push(rb, rb + 1, rb + 6, rb + 1, rb + 7, rb + 6, rb + 3, rb + 9, rb + 4, rb + 4, rb + 9, rb + 10, rb + 2, rb + 5, rb + 8, rb + 5, rb + 11, rb + 8);
            BK.I.push(bb, bb + 4, bb + 1, bb + 1, bb + 4, bb + 5, bb + 2, bb + 3, bb + 6, bb + 3, bb + 7, bb + 6, bb + 1, bb + 5, bb + 3, bb + 3, bb + 5, bb + 7);
            BK.MI.push(mb, mb + 1, mb + 2, mb + 1, mb + 3, mb + 2);
          }
        }
        // pebbles, 5 to 13 cm, on the bed and along the banks
        for (let k = 0; k < 26; k++) {
          const r0 = rows[R.brook.int(2, NSEG - 3)], lat = R.brook.range(-1, 1) * (r0.w + 0.35), r = R.brook.range(0.05, 0.13), tone = pebbleTones[R.brook.int(0, 3)], turn = R.brook.range(0, TAU), sh = R.brook.range(0.75, 1.1);
          const inBed = Math.abs(lat) < r0.w - 0.12, c = at(r0.a + lat, r0.c, (inBed ? 0.035 - r0.d : 0.035) + r * 0.3), base = BK.P.length / 3, ct = Math.cos(turn), st = Math.sin(turn);
          for (const [x, y, z] of [[1.3, 0, 0], [-1.3, 0, 0], [0, 0, 1], [0, 0, -1], [0, 0.6, 0], [0, -0.6, 0]]) { BK.P.push(c[0] + (x * ct - z * st) * r, c[1] + y * r, c[2] + (x * st + z * ct) * r); const q = sh * (y > 0 ? 1.1 : 0.75); BK.C.push(tone[0] * q, tone[1] * q, tone[2] * q); }
          BK.I.push(base, base + 2, base + 4, base + 2, base + 1, base + 4, base + 1, base + 3, base + 4, base + 3, base, base + 4, base + 2, base, base + 5, base + 1, base + 2, base + 5, base + 3, base + 1, base + 5, base, base + 3, base + 5);
        }
      };
      const SLOTS = 8, beachA0 = sandA0 + 6, beachA1 = groveA0 - 6, kinds = R.sands.shuffle(['wood', 'spring', 'pit', 'rock', 'wood', 'spring', 'pit', 'rock']);
      let woods = 0;
      for (let k = 0; k < SLOTS; k++) {
        let a = lerp(beachA0, beachA1, (k + R.sands.range(0.25, 0.75)) / SLOTS); const c = R.sands.range(6.5, 9.5), kind = kinds[k];
        if (Math.abs(a - PINE.a) < 5.5) a = PINE.a + (a < PINE.a ? -5.5 : 5.5);
        NEAR.push([kind, ...lineW(a, c)]);
        // (the first driftwood is the large one, 6 to 7.5 m; the second 2.5 to 4 m)
        if (kind === 'wood') wood(a, c, woods++ ? R.sands.range(2.5, 4) : R.sands.range(6, 7.5));
        else if (kind === 'rock') { const r = R.sands.range(0.9, 1.5); boulder(a, c, r); boulder(a + R.sands.range(1.6, 2.4), c + R.sands.range(0.8, 1.6), r * R.sands.range(0.45, 0.7)); }
        else if (kind === 'pit') round(a, c, R.sands.range(1.5, 2.3), [[0.5, brine], [0.66, crust], [0.9, crust], [1.25, SAND]]);
        else { round(a, c, R.sands.range(1.0, 1.4), [[0.55, pool], [0.75, SAND_WET], [1.0, moss], [1.3, SAND]]); rill(a, c - 0.8); }
        await ctx.yield();
      }
      await ctx.yield();
      // THE STRAND IS NOT LEFT BARE (a fork of its own). The flown line is walked from the nook's mouth to the first lime
      // in steps of 5 m; at a step where none of the near things (the sands' things above, the inner water's rocks,
      // the gulls' seats, the sleeping ship, the pine, and what this walk has already set) lies within 12 m of the
      // line's point, one worn boulder is set 7 to 10 m from the line on a drawn hand (the other, where the first will
      // not do): on the sand, or standing in the water where it is no deeper than 1.8 m (its round sits at the water's
      // level as a boulder's sits on the sand, and its foot is on the bottom). Where the water is deeper nothing is
      // set (so at the nook's mouth, over 5 to 6 m of water, the line's first metres, m 262 to at most m 267, have
      // nothing at all within 15 m on some seeds: the nearest thing is 15 to 20 m off, counted on seeds 1 to 40), AND NOTHING IS EVER SET AFLOAT: a thing afloat by the sleeping ship reads as her
      // boat or as wreckage, and the place has neither. For the same reason every stone keeps 12 m and its reach
      // from her whole length, her stern to the foot of her cable. Each keeps clear of every gull's wheel by its own
      // reach and a metre, and 5 m and its reach from the whole line.
      { const q = new THREE.Vector3(), t = new THREE.Vector3(), cs = PL.places.calmShip, have = NEAR.map((n) => [n[1], n[2], 1]); let awash = 0;
        const sd = azDir(PL.places.calmAz), offShip = (x, z) => { const f = clamp((x - cs.x) * MX * sd[0] + (z - cs.z) * sd[1], SHIP.STERN, SHIP.STEM + 12); return Math.hypot(x - cs.x - MX * sd[0] * f, z - cs.z - sd[1] * f); };
        for (const rk of skerries) if (rk.inner) have.push([rk.x, rk.z, rk.rad]);
        for (const gl of GULLS) have.push([gl.x, gl.z, 0.3]);
        have.push([cs.x, cs.z, 14], [pineW[0], pineW[1], 0.6]);
        for (let sq = m.P4; sq <= m.grove0; sq += 5) {
          path.posAtDist(sq, q); if (have.some((h) => Math.hypot(h[0] - q.x, h[1] - q.z) - h[2] < 12)) continue;
          path.tangentAtDist(sq, t); const tl = Math.hypot(t.x, t.z) || 1, off = R.strand.range(7, 10), first = R.strand.chance(0.5) ? 1 : -1, r = R.strand.range(0.9, 1.4), reach = r * 1.3;
          for (const side of [first, -first]) {
            const x = q.x - t.z / tl * side * off, z = q.z + t.x / tl * side * off, h = isle.heightAt(x, z);
            if (h < -1.8 || offShip(x, z) < 12 + reach || !gullsClear(x, z, reach) || offLine(x, z, m.P4 - 20, m.grove0 + 20) < 5 + reach) continue;
            const [a, c] = isle.lineAC(x, z); boulder(a, c, r, R.strand, Math.max(0, -h));
            // its double in the still water (the first four that stand in it): as wide as the boulder, as high as its crown stands out of the water, in the stone's own colour
            if (h < 0 && awash < 4) { const k = stoneCol(-h); seaU.uStandCol.value[2 + awash].setRGB(k[0] * 0.6, k[1] * 0.6, k[2] * 0.6); seaU.uStand.value[8 + awash++].set(x, z, r * 1.1, r * 0.9); }
            have.push([x, z, r]); NEAR.push(['stone', x, z, r]); break;
          }
        } }
      await ctx.yield();
      // the sleeping ship's cable: from her hawse (1.2 m abaft her stem, 3.4 m up) down ahead of her into the water
      { const cs = PL.places.calmShip, d = azDir(PL.places.calmAz), at = (f) => isle.lineAC(cs.x + MX * d[0] * f, cs.z + d[1] * f), h = at(SHIP.STEM - 1.2), mid = at(SHIP.STEM + 5), e = at(SHIP.STEM + 12);
        limb([[h[0], 3.4, h[1]], [mid[0], 0.9, mid[1]], [e[0], -1.2, e[1]]], [0.09, 0.09, 0.09], lin('#5a4a38')); }
      const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); pg.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); pg.setIndex(I); pg.computeVertexNormals();
      gather(pg, false);
      if (BK.MI.length) {
        // the brooks' openings set the ground's depth aside (drawn after every solid thing, writing no colour), then their beds and banks
        const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(BK.MP, 3)); mg.setIndex(BK.MI);
        const opening = new THREE.Mesh(mg, new THREE.ShaderMaterial({ colorWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -8,
          vertexShader: /* glsl */`void main() { gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`, fragmentShader: /* glsl */`void main() { gl_FragColor = vec4(0.); gl_FragDepth = 1.; }` }));
        opening.renderOrder = 10; scene.add(opening);
        const bg2 = new THREE.BufferGeometry(); bg2.setAttribute('position', new THREE.Float32BufferAttribute(BK.P, 3)); bg2.setAttribute('color', new THREE.Float32BufferAttribute(BK.C, 3)); bg2.setIndex(BK.I); bg2.computeVertexNormals();
        const beds = new THREE.Mesh(bg2, plain2); beds.name = 'brook-beds'; beds.renderOrder = 11; scene.add(beds);
      }
      // the wrack line: a dark wandering band of weed and shells where the highest swash reaches, 5 to 6 m above the mean lip
      { const base = RP.length / 3, a0 = sandA0, a1 = PINE.a - 6, NSEG = Math.round((a1 - a0) / 1.5);
        for (let i = 0; i <= NSEG; i++) {
          const a = lerp(a0, a1, i / NSEG), c = SHORE_C + 5.4 + 0.5 * Math.sin(a * 0.21) + 0.3 * Math.sin(a * 0.57);
          for (const sd of [-1, 1]) { const [x, z] = lineW(a, c + sd * 0.8); RP.push(x, groundAt(x, z) + 0.04, z); RU.push(11 + sd, a); }
          if (i < NSEG) { const q = base + i * 2; RI.push(q, q + 1, q + 2, q + 1, q + 3, q + 2); }
        } }
      // SHADOWS ON THE SAND, by the sun's own direction (a metre of height throws 1 / tan(the sun's height) metres, at
      // most 4.5): under each boulder a round of shade drawn out down-sun by its height; beside each driftwood trunk a
      // band as long as the trunk and as wide as its top throws. Soft at their rims (the across runs 30 at the core to 31 at the rim).
      { const sl = Math.hypot(sunDir.x, sunDir.z) || 1, cotS = Math.min(sl / sunDir.y, 4.5), sx = -sunDir.x / sl * cotS, sz = -sunDir.z / sl * cotS;
        const put = (x, z, e) => { RP.push(x, groundAt(x, z) + 0.045, z); RU.push(30 + e, 0); };
        for (const [x, z, r, h] of SHADE) {
          const base = RP.length / 3; put(x + sx * h * 0.5, z + sz * h * 0.5, 0);
          for (let i = 0; i < 12; i++) { const an = i / 12 * TAU, ux = Math.cos(an), uz = Math.sin(an), fwd = Math.max(0, (ux * sx + uz * sz) / cotS); put(x + ux * r * 1.15 + sx * h * fwd, z + uz * r * 1.15 + sz * h * fwd, 1); }
          for (let i = 0; i < 12; i++) RI.push(base, base + 1 + (i + 1) % 12, base + 1 + i);
        }
        for (const [pts, r0] of LOGS) {
          const base = RP.length / 3, n = pts.length, h = r0 * 1.7;
          for (let j = 0; j < n; j++) { const [x, z] = lineW(pts[j][0], pts[j][2]), end = j === 0 || j === n - 1 ? 1 : 0; put(x, z, end); put(x + sx * h * 0.55, z + sz * h * 0.55, end ? 1 : 0.1); put(x + sx * h * 1.15, z + sz * h * 1.15, 1); }
          for (let j = 0; j < n - 1; j++) { const q = base + j * 3; RI.push(q, q + 1, q + 3, q + 1, q + 4, q + 3, q + 1, q + 2, q + 4, q + 2, q + 5, q + 4); }
        } }
      // THE SHINING WET BAND: the sand the swash has just left, from the water's lip up to its highest reach, along the
      // lip's straight (58 to 150 m along the sands' line, fading out over its last metres at either end; the across
      // runs 40 to 41 along it, the second figure the metres above the mean lip). At a low sight it mirrors the sky; at
      // a steep one it is dark wet sand.
      { const base = RP.length / 3, NSEG = 62, NCOL = 4;
        for (let i = 0; i <= NSEG; i++) for (let j = 0; j <= NCOL; j++) { const a = lerp(58, 150, i / NSEG), cc = lerp(-5, 5, j / NCOL), [x, z] = lineW(a, SHORE_C + cc); RP.push(x, Math.max(groundAt(x, z), 0) + 0.03, z); RU.push(40 + (a - 58) / 100, cc); }
        for (let i = 0; i < NSEG; i++) for (let j = 0; j < NCOL; j++) { const q = base + i * (NCOL + 1) + j; RI.push(q, q + 1, q + NCOL + 1, q + 1, q + NCOL + 2, q + NCOL + 1); } }
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(RP, 3)); rg.setAttribute('aU', new THREE.Float32BufferAttribute(RU, 2)); rg.setIndex(RI);
      const rillU = { uTime: { value: 0 }, uSkyC: { value: C(HOUR.zen).lerp(C('#ffffff'), 0.45) }, uSunC: { value: sunCol }, uNoise: { value: noiseTex }, uSeaT: seaU.uTime };
      const rills = new THREE.Mesh(rg, new THREE.ShaderMaterial({ uniforms: rillU, transparent: true, depthWrite: false, side: THREE.DoubleSide,
        vertexShader: /* glsl */`attribute vec2 aU; varying vec2 vU; varying vec3 vV; void main() { vU = aU; vV = cameraPosition - position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform float uTime, uSeaT; uniform vec3 uSkyC, uSunC; uniform sampler2D uNoise; varying vec2 vU; varying vec3 vV;
          void main() {
            if (vU.x > 39.) {
              // (the wet band: wet from the lip as it stands now, by the sea's own swash, up to 4.9 m above the mean
              // lip; shining most where the water has only just left)
              float a = (vU.x - 40.) * 100. + 58., lipNow = (.1 * sin(uSeaT * .62 - a * ${SWASH_K}) + .045 * sin(uSeaT * 1.13 + a * .11)) / ${SLOPE}, up = vU.y - lipNow;
              float wet = smoothstep(-.1, .15, up) * (1. - smoothstep(3.4, 4.9, vU.y)) * (.2 + .8 * exp(-max(up, 0.) * 1.1)) * smoothstep(58., 66., a) * (1. - smoothstep(138., 150., a)), n = texture2D(uNoise, vec2(a * .13, vU.y * .21)).r;
              float f1 = 1. - clamp(normalize(vV + vec3(0., 1e-3, 0.)).y, 0., 1.), gleam = f1 * f1 * f1;
              gl_FragColor = vec4(mix(vec3(.17, .125, .07), uSkyC * 1.3 + uSunC * (.12 * smoothstep(.6, .9, n)), gleam), wet * (.45 + .45 * gleam));
              return;
            }
            if (vU.x > 29.) { gl_FragColor = vec4(.05, .05, .09, (1. - smoothstep(.35, 1., vU.x - 30.)) * .55); return; }
            if (vU.x > 5. && vU.x < 15.) {
              // (the wrack line's band, whose across runs 10 to 12: weed in dark blotches, shells as pale specks)
              float wx = vU.x - 11.; vec3 wn = texture2D(uNoise, vec2(vU.y * .31, wx * .2)).rgb; float sp = texture2D(uNoise, vec2(vU.y * 1.7, wx * 1.1 + .4)).g;
              float weed = smoothstep(.42, .62, wn.r * .6 + wn.g * .4) * (1. - wx * wx), shell = smoothstep(.83, .87, sp) * (1. - wx * wx);
              gl_FragColor = vec4(mix(vec3(.1, .085, .045) * (.6 + wn.b), vec3(.9, .86, .78), shell), max(weed * .85, shell));
              return;
            }
            if (vU.x > 15.) {
              // (the brook's margin, whose across runs 20 at the bank to 21: green at the bank, then wet dark sand, ragged outward)
              float e = vU.x - 20., rag = texture2D(uNoise, vec2(vU.y * .4, e * .3)).r;
              float green = 1. - smoothstep(.1, .6, e + (rag - .5) * .5);
              gl_FragColor = vec4(mix(vec3(.2, .15, .085), vec3(.16, .34, .09), green) * (.8 + .4 * rag), (1. - smoothstep(.25, 1., e + (rag - .5) * .6)) * mix(.7, .9, green));
              return;
            }
            // the brook's water: a bright ribbon of the sky's light, braided where it runs fastest, with glints
            // going down with it
            vec3 nn = texture2D(uNoise, vec2(vU.x * .23, vU.y * .07 - uTime * .1)).rgb; float n2 = texture2D(uNoise, vec2(vU.x * .6 + .3, vU.y * .2 - uTime * .23)).g;
            float braid = smoothstep(.5, .75, nn.g * .6 + n2 * .4), glint = smoothstep(.66, .8, n2 * .6 + nn.b * .4);
            gl_FragColor = vec4(mix(vec3(.16, .22, .2), uSkyC * 1.05, .35 + .65 * braid) + uSunC * glint * .5, .55 + .3 * braid + .15 * glint);
          }` }));
      rills.name = 'sands-marks'; rills.userData = { things: NEAR }; rills.renderOrder = 2; scene.add(rills); tick.push((dt, time) => { rillU.uTime.value = time; });
    }
    await ctx.yield();
    // THE INNER WATER'S BED, seen through the clear water within 45 m of the shore where it is under 2.4 m deep: sand
    // ribs 0.7 m apart that run along the shore and waver (in water a hand to a man's chest deep), dark beds of weed 3 to
    // 10 m across (knee-deep to 2 m), the swell's net of light drifting over both on the world clock; and on the
    // water's face the swell's glints, sharp sparks that come and go, most toward the sun. The bed shows as the water
    // lets it: plainly where the eye looks down, hardly at all at a grazing view. One sheet, 4 m to a cell, 0.11 m over
    // the still water.
    {
      const aLo = Math.min(aAt(m.P5), sandA0) - 44, NA = Math.ceil((150 - aLo) / 4), NC = 22, V = [], D = [], I = [], id = new Int32Array((NA + 1) * (NC + 1)).fill(-1), dep = new Float32Array((NA + 1) * (NC + 1)), sho = new Float32Array((NA + 1) * (NC + 1));
      for (let j = 0; j <= NC; j++) for (let i = 0; i <= NA; i++) { const [x, z] = lineW(aLo + i * 4, -72 + j * 4), k = j * (NA + 1) + i; dep[k] = -isle.heightAt(x, z); sho[k] = -isle.shore(x, z); }
      const use = (i, j) => { const k = j * (NA + 1) + i; if (id[k] < 0) { const [x, z] = lineW(aLo + i * 4, -72 + j * 4); id[k] = V.length / 3; V.push(x, 0.11, z); D.push(clamp(dep[k], -1, 4), 1 - smoothstep(34, 45, sho[k])); } return id[k]; };
      for (let j = 0; j < NC; j++) for (let i = 0; i < NA; i++) {
        let wet = false; for (const [p, q] of [[i, j], [i + 1, j], [i, j + 1], [i + 1, j + 1]]) { const k = q * (NA + 1) + p; if (dep[k] > 0.02 && dep[k] < 2.4 && sho[k] < 45) wet = true; }
        if (!wet) continue;
        const p0 = use(i, j), p1 = use(i + 1, j), p2 = use(i, j + 1), p3 = use(i + 1, j + 1); I.push(p0, p1, p2, p1, p3, p2);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(V, 3)); g.setAttribute('aD', new THREE.Float32BufferAttribute(D, 2)); g.setIndex(I);
      const bed = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uTime: seaU.uTime, uNoise: { value: noiseTex }, uSun: twin.light.uSunCol, uSky: twin.light.uSky, uSunDir: { value: sunDir }, uQ: groveU.uGQ, uHd: groveU.uGHd, uRt: groveU.uGRt },
        transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4,
        vertexShader: /* glsl */`attribute vec2 aD; varying vec2 vD; varying vec3 vW; void main() { vD = aD; vW = position; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.); }`,
        fragmentShader: /* glsl */`
          uniform sampler2D uNoise; uniform float uTime; uniform vec3 uSun, uSky, uSunDir; uniform vec2 uQ, uHd, uRt; varying vec2 vD; varying vec3 vW;
          void main() {
            vec2 p = vW.xz, d0 = p - uQ; float c = dot(d0, uRt), dep = vD.x;
            vec3 V = normalize(cameraPosition - vW);
            float k = 1. - clamp(V.y, 0., 1.), see = (1. - k * k * k) * vD.y, inW = smoothstep(.03, .2, dep);
            float wob = texture2D(uNoise, p * .035).r * 5. + texture2D(uNoise, p * .11).g * 1.2;
            float ribs = smoothstep(-.2, .9, sin((c + wob) * 9.)) * inW * (1. - smoothstep(.9, 1.7, dep));
            float wn = texture2D(uNoise, p * .028 + 3.7).r * .6 + texture2D(uNoise, p * .09).g * .28 + texture2D(uNoise, p * .37).b * .12;
            float weed = smoothstep(.54, .62, wn) * smoothstep(.35, .8, dep) * (1. - smoothstep(1.8, 2.4, dep));
            float c1 = texture2D(uNoise, p * .19 + uTime * vec2(.012, .008)).r, c2 = texture2D(uNoise, p * .23 - uTime * vec2(.01, .013)).g;
            float net = (1. - smoothstep(0., .05, abs(c1 - c2))) * inW * (1. - smoothstep(1., 2., dep));
            float g1 = texture2D(uNoise, p * 1.7 + uTime * vec2(.05, .03)).g, g2 = texture2D(uNoise, p * 2.9 - uTime * vec2(.04, .06)).r;
            float toSun = clamp(dot(normalize(-V.xz + vec2(1e-4)), normalize(uSunDir.xz)), 0., 1.);
            float glint = smoothstep(.7, .78, g1) * smoothstep(.6, .72, g2) * smoothstep(.1, .5, dep) * vD.y * (.3 + .7 * toSun * toSun);
            float a = max(ribs * .3, weed * .62) * see;
            vec3 bedCol = mix(vec3(.3, .22, .11), vec3(.03, .07, .04) * (.7 + .8 * wn), smoothstep(0., .3, weed)) * (uSky * .5 + uSun * .25);
            gl_FragColor = vec4(bedCol * a + uSun * (net * .045 * see + glint * .3), a);
          }` }));
      bed.name = 'inner-bed'; bed.renderOrder = 2; scene.add(bed);
    }
    await ctx.yield();
    // GULLS SIT ON THE NOOK'S STILL WATER: one in each of nine even stretches of the line from the nook's mouth to the
    // sands, 6 to 15 m off it, either hand in turn (the other hand where the first is not water or is not clear of
    // the sleeping ship; no gull in a stretch where neither hand will do). Each rides the swell and, in a time of its
    // own (26 to 48 s), lifts, wheels once over the water on the side away from the line and settles where it sat.
    {
      const P = [], Cc = [], K = [], AT = [], CL = [], PE = [], I = [], white = lin('#f4f2ec'), grey = lin('#9aa2ac'), dark = lin('#2a2c30'), beak = lin('#e8b030'), q = new THREE.Vector3(), tn = new THREE.Vector3();
      // one bird in its own metres, beak to +x: body (nose, tail, back, keel, two sides), head and beak, a wing either side (two roots and a tip)
      const BIRD = [[0.24, 0.1, 0, white, 0], [-0.26, 0.12, 0, grey, 0], [0, 0.2, 0, white, 0], [0, 0, 0, white, 0], [0, 0.1, 0.09, white, 0], [0, 0.1, -0.09, white, 0], [0.2, 0.25, 0, white, 0], [0.34, 0.22, 0, beak, 0],
        [0.1, 0.15, 0.06, grey, 0], [-0.14, 0.15, 0.06, grey, 0], [-0.08, 0.15, 0.62, dark, 1], [0.1, 0.15, -0.06, grey, 0], [-0.14, 0.15, -0.06, grey, 0], [-0.08, 0.15, -0.62, dark, -1]];
      const TRIS = [[0, 2, 4], [0, 5, 2], [0, 4, 3], [0, 3, 5], [1, 4, 2], [1, 2, 5], [1, 3, 4], [1, 5, 3], [2, 6, 4], [2, 5, 6], [6, 7, 4], [6, 5, 7], [0, 4, 7], [0, 7, 5], [8, 9, 10], [11, 13, 12]];
      // (dealt above, before the rocks were stood)
      for (const gl of GULLS) {
        const b = P.length / 3;
        for (const v of BIRD) { P.push(v[0], v[1], v[2]); Cc.push(...v[3]); K.push(v[4]); AT.push(gl.x, gl.z, gl.hd); CL.push(...gl.clock); PE.push(0); }
        for (const t of TRIS) I.push(b + t[0], b + t[1], b + t[2]);
      }
      // SEA BIRDS SIT ON THE INNER WATER'S ROCKS: two to four on each rock's crown (half as large again as the gulls on
      // the water), each on a corner of the rock of its own; each, in a time of its own (30 to 60 s), lifts, wheels
      // once round and settles where it sat. They do not ride the swell.
      // PLACES DECIDE WHERE EACH WHEELS. The middle of a bird's wheel lies on the bearing from its rock's middle out
      // through its seat (by the bird's own small turn of it), so that it leaves its rock on the side away from the
      // middle. The whole round is then tried where it would be flown: against the skin of every rock (never under
      // one; half a metre and more clear of any skin within half a metre on the level, save over its own rock while
      // its wings open and fold), against the line (no part within 8 m of it), the sleeping ship (8 m off her keel's
      // line, stern to bowsprit end) and the land (water under all of it). A round that would touch is turned, 15
      // degrees at a time, first to the hand that carries its middle away from what it touched and then to the
      // other, wider each time, and takes the first bearing that is clear; a corner from which no round is clear is
      // left bare and the bird takes the next one round the crown.
      const lineXZ = []; { const run = lineRun(m.P4, m.grove0); for (let i = 0; i < run.length; i += 3) lineXZ.push(run[i], run[i + 2]); }
      const keel = (() => { const cs = PL.places.calmShip, d = azDir(PL.places.calmAz); return [cs.x + MX * d[0] * SHIP.STERN, cs.z + d[1] * SHIP.STERN, MX * d[0] * (SHIP.SPRIT - SHIP.STERN), d[1] * (SHIP.SPRIT - SHIP.STERN)]; })();
      // (a rock's skin for the trying, made when a round first comes near it: its faces sorted into half-metre squares, for the skin's true height
      // at a place; and W, over a net of a quarter of a metre, the highest corner of any face that lies within half a metre: never less than the skin)
      const skinMap = (rk) => {
        if (rk.map) return rk.map;
        const c = 0.25, rr = rk.fm.reach + 0.75, n = Math.ceil(2 * rr / c) + 1, x0 = rk.x - rr, z0 = rk.z - rr, W = new Float32Array(n * n).fill(-9), S = rk.skin, bn = (n >> 1) + 1, faces = Array.from({ length: bn * bn }, () => []);
        for (let f = 0; f < S.length; f += 9) {
          const ax = S[f], ay = S[f + 1], az = S[f + 2], bx = S[f + 3], by = S[f + 4], bz = S[f + 5], cx = S[f + 6], cy = S[f + 7], cz = S[f + 8], top = Math.max(ay, by, cy);
          if (top <= 0) continue;
          const xa = (Math.min(ax, bx, cx) - x0) / c, xb = (Math.max(ax, bx, cx) - x0) / c, za = (Math.min(az, bz, cz) - z0) / c, zb = (Math.max(az, bz, cz) - z0) / c;
          for (let j = Math.floor(za) >> 1; j <= Math.floor(zb) >> 1; j++) for (let i = Math.floor(xa) >> 1; i <= Math.floor(xb) >> 1; i++) faces[j * bn + i].push(f);
          const i0 = Math.max(0, Math.ceil(xa - 2)), i1 = Math.min(n - 1, Math.floor(xb + 2)), j0 = Math.max(0, Math.ceil(za - 2)), j1 = Math.min(n - 1, Math.floor(zb + 2));
          for (let j = j0; j <= j1; j++) for (let i = i0, o = j * n + i0; i <= i1; i++, o++) if (top > W[o]) W[o] = top;
        }
        return (rk.map = { c, n, x0, z0, W, bn, faces, S });
      };
      const skinWide = (M, x, z) => { const i = Math.round((x - M.x0) / M.c), j = Math.round((z - M.z0) / M.c); return i < 0 || j < 0 || i >= M.n || j >= M.n ? -9 : M.W[j * M.n + i]; };
      const skinTop = (M, x, z) => {
        const i = Math.floor((x - M.x0) / (M.c * 2)), j = Math.floor((z - M.z0) / (M.c * 2)), S = M.S; let h = -9;
        if (i < 0 || j < 0 || i >= M.bn || j >= M.bn) return h;
        for (const f of M.faces[j * M.bn + i]) {
          const ax = S[f], az = S[f + 2], bx = S[f + 3], bz = S[f + 5], cx = S[f + 6], cz = S[f + 8], det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz), u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det, v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det, w = 1 - u - v;
          if (u >= -1e-6 && v >= -1e-6 && w >= -1e-6) h = Math.max(h, u * S[f + 1] + v * S[f + 4] + w * S[f + 7]);
        }
        return h;
      };
      // (the round's own shape, once for all: where it is tried. Every three quarters of a degree while the wings open and fold, which come first; every three degrees between)
      const RF = [], RC = [], RS = [], RL = []; let nLift = 0;
      for (const mid of [false, true]) for (let k = 1; k < 480; k++) {
        const f = k / 480, lifting = f < 0.12 || f > 0.88; if (lifting === mid || (mid && k % 4)) continue;
        RF.push(f); RC.push(1 - Math.cos(f * TAU)); RS.push(Math.sin(f * TAU)); RL.push(Math.sin(Math.PI * f)); if (!mid) nLift++;
      }
      // (the places where the wings open and fold are tried lowest first: a round that cannot leave its rock is known soonest there)
      const LOW = Array.from({ length: nLift }, (v, k) => k).sort((a, b) => RL[a] - RL[b] || a - b);
      // (one round tried where it would be flown: nothing where it is clear, or the place and the name of what it would touch.
      // nearLine: the line's points within 30 m of the rock; shipNear: whether the rock stands within 40 m of the ship's keel line)
      const tryRound = (rk, top, beta, rr, lift, nearLine, shipNear) => {
        const cx = top[0] + Math.cos(beta) * rr, cz = top[2] + Math.sin(beta) * rr, hd = beta - Math.PI / 2, ch = Math.cos(hd) * rr, sh = Math.sin(hd) * rr, own = skinMap(rk);
        for (let i = 0; i < nearLine.length; i += 2) if (Math.hypot(nearLine[i] - cx, nearLine[i + 1] - cz) < rr + 8) return [nearLine[i], nearLine[i + 1], 'line'];
        // (the skin's true height is asked only where the bird is lower than the highest the skin stands within half a metre)
        for (let n = 0; n < nLift; n++) { const k = LOW[n], x = top[0] - sh * RC[k] + ch * RS[k], z = top[2] + ch * RC[k] + sh * RS[k], y = top[1] - 0.03 + lift * RL[k]; if (y < skinWide(own, x, z) - 0.04 && y < skinTop(own, x, z) - 0.04) return [rk.x, rk.z, 'lift']; }
        const near = []; for (const o of skerries) if (Math.hypot(o.x - cx, o.z - cz) < rr + o.fm.reach + 0.75) near.push(o);
        for (let k = 0; k < RF.length; k++) {
          const x = top[0] - sh * RC[k] + ch * RS[k], z = top[2] + ch * RC[k] + sh * RS[k], y = top[1] - 0.03 + lift * RL[k];
          for (const o of near) if (k >= nLift || o !== rk) { const w = skinWide(skinMap(o), x, z); if (w > 0 && y < w + 0.5) return [o.x, o.z, o === rk ? 'own' : 'other']; }
          if (shipNear) {
            const t = clamp(((x - keel[0]) * keel[2] + (z - keel[1]) * keel[3]) / (keel[2] * keel[2] + keel[3] * keel[3]), 0, 1), sx = keel[0] + keel[2] * t, sz = keel[1] + keel[3] * t;
            if (Math.hypot(x - sx, z - sz) < 8) return [sx, sz, 'ship'];
          }
        }
        for (let k = nLift + 2; k < RF.length; k += 5) { const x = top[0] - sh * RC[k] + ch * RS[k], z = top[2] + ch * RC[k] + sh * RS[k]; if (isle.heightAt(x, z) > -0.15) return [x, z, 'land']; }
        return null;
      };
      // (kept with the mesh for the prints: rounds flown on their first bearing, rounds turned, corners left bare, and what the first bearings touched)
      const rounds = { asBearing: 0, turned: 0, corners: 0, unseated: 0 };
      for (const rk of skerries) if (rk.inner && rk.tops.length) {
        const nb = R.rockBirds.int(2, 4), taken = new Set(), nearLine = [];
        for (let i = 0; i < lineXZ.length; i += 2) if (Math.hypot(lineXZ[i] - rk.x, lineXZ[i + 1] - rk.z) < 30) nearLine.push(lineXZ[i], lineXZ[i + 1]);
        const kt = clamp(((rk.x - keel[0]) * keel[2] + (rk.z - keel[1]) * keel[3]) / (keel[2] * keel[2] + keel[3] * keel[3]), 0, 1), shipNear = Math.hypot(rk.x - keel[0] - keel[2] * kt, rk.z - keel[1] - keel[3] * kt) < 40;
        for (let j = 0; j < nb; j++) {
          let ti = R.rockBirds.int(0, rk.tops.length - 1), beta = null; const own = R.rockBirds.range(-0.5, 0.5), clock = [R.rockBirds.range(30, 60), R.rockBirds.range(0, 1), R.rockBirds.range(3.5, 6), R.rockBirds.range(1.5, 3)];
          while (taken.size < rk.tops.length) {
            while (taken.has(ti)) ti = (ti + 1) % rk.tops.length;
            taken.add(ti); const top = rk.tops[ti], dx = top[0] - rk.x, dz = top[2] - rk.z, b0 = (Math.hypot(dx, dz) > 0.05 ? Math.atan2(dz, dx) : Math.atan2(rk.out[1], rk.out[0])) + own, hit = tryRound(rk, top, b0, clock[2], clock[3], nearLine, shipNear);
            if (!hit) { beta = b0; rounds.asBearing++; break; }
            rounds[hit[2]] = (rounds[hit[2]] || 0) + 1;
            // (the first hand: the one that carries the wheel's middle away from what the round touched)
            const hand = (-Math.sin(b0) * (top[0] + Math.cos(b0) * clock[2] - hit[0]) + Math.cos(b0) * (top[2] + Math.sin(b0) * clock[2] - hit[1])) >= 0 ? 1 : -1;
            for (let st = 1; st <= 12 && beta === null; st++) for (const sg of st < 12 ? [hand, -hand] : [hand]) { const bb = b0 + sg * st * TAU / 24; if (!tryRound(rk, top, bb, clock[2], clock[3], nearLine, shipNear)) { beta = bb; break; } }
            if (beta !== null) { rounds.turned++; break; }
            rounds.corners++;
          }
          if (beta === null) { rounds.unseated++; continue; }
          const top = rk.tops[ti], b = P.length / 3, hd = beta - Math.PI / 2;
          for (const v of BIRD) { P.push(v[0] * 1.5, v[1] * 1.5 + top[1] + 0.02, v[2] * 1.5); Cc.push(...v[3]); K.push(v[4]); AT.push(top[0], top[2], hd); CL.push(...clock); PE.push(1); }
          for (const t of TRIS) I.push(b + t[0], b + t[1], b + t[2]);
        }
      }
      const g = new THREE.BufferGeometry(), l0 = lightOf(0);
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(K, 1)); g.setAttribute('aPerch', new THREE.Float32BufferAttribute(PE, 1));
      g.setAttribute('aAt', new THREE.Float32BufferAttribute(AT, 3)); g.setAttribute('aClock', new THREE.Float32BufferAttribute(CL, 4)); g.setIndex(I);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(PL.places.calmShip.x, 0, PL.places.calmShip.z), 260);
      const gullU = { uTime: seaU.uTime, uSwell: seaU.uSwell, uLit: { value: l0.sky.clone().multiplyScalar(0.55).addScaledVector(l0.sun, 0.24) }, fogColor: { value: new THREE.Color() }, fogDensity: { value: 0 }, fogNear: { value: 1 }, fogFar: { value: 2000 } };
      const sitting = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: gullU, vertexColors: true, fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          attribute vec3 aAt; attribute vec4 aClock; attribute float aWing, aPerch; uniform float uTime; uniform vec4 uSwell; varying vec3 vC;
          #include <fog_pars_vertex>
          void main() {
            // the last fifth of its time is the flight: once round a circle through its sitting place, wings spread and beating
            float f = clamp((fract(uTime / aClock.x + aClock.y) - .8) / .2, 0., 1.), up = smoothstep(0., .12, f) * (1. - smoothstep(.88, 1., f));
            vec3 q = position;
            if (aWing != 0.) { q.z = mix(sign(aWing) * .09 * (1. + .5 * aPerch), q.z, up); q.x = mix(-.2 * (1. + .5 * aPerch), q.x, up); q.y += up * .2 * sin(uTime * 9. + aClock.y * 40.); }
            float ang = f * 6.2832, hd = aAt.z + ang, c = cos(hd), s = sin(hd);
            vec2 at = aAt.xy + vec2(-sin(aAt.z), cos(aAt.z)) * (aClock.z * (1. - cos(ang))) + vec2(cos(aAt.z), sin(aAt.z)) * (aClock.z * sin(ang));
            float ride = uSwell.w * sin(dot(uSwell.xy, aAt.xy) * uSwell.z - sqrt(9.81 * uSwell.z) * uTime);
            vec3 w = vec3(at.x + q.x * c - q.z * s, q.y - .05 + ride * (1. - up) * (1. - aPerch) + aClock.w * sin(3.14159 * f), at.y + q.x * s + q.z * c);
            vC = color;
            vec4 mvPosition = viewMatrix * vec4(w, 1.);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uLit; varying vec3 vC;
          #include <fog_pars_fragment>
          void main() { gl_FragColor = vec4(vC * uLit, 1.); 
            #include <fog_fragment>
          }` }));
      sitting.name = 'sitting-birds'; sitting.userData = { birds: PE.length / BIRD.length, perched: PE.reduce((p, q) => p + q, 0) / BIRD.length, rocks: skerries.filter((r) => r.inner).length, rounds, skins: skerries.map((r) => ({ x: r.x, z: r.z, rad: r.rad, reach: r.fm.reach, inner: !!r.inner, skin: r.skin })), ground: isle.heightAt, keel }; scene.add(sitting);
    }
    await ctx.yield();
    // rings where fish rise on the nook's still water: four at a time, each on a round of sixteen places and a period of
    // its own, the places drawn over the nook's water at least 8 m from any shore
    {
      const slots = [];
      for (let k = 0; k < 4; k++) {
        const per = R.rings.range(4.5, 8), ph = R.rings.range(0, 16), at = [];
        for (let j = 0, tries = 0; j < 16 && tries < 400; tries++) { const r = R.rings.range(-55, 185), n = R.rings.range(40, 150), x = (KNOLL.x + RD[0] * r + ND[0] * n) * MX, z = KNOLL.z + RD[1] * r + ND[1] * n; if (isle.shore(x, z) < -8) { at.push([x, z]); j++; } }
        slots.push({ per, ph, at });
      }
      tick.push((dt, time) => {
        for (let k = 0; k < 4; k++) {
          const sl = slots[k], turn = time / sl.per + sl.ph, id = Math.floor(turn), age = (turn - id) * sl.per, q = sl.at[((id % sl.at.length) + sl.at.length) % sl.at.length];
          if (q) rings[k].set(q[0], q[1], age, Math.max(0, 1 - age / sl.per));
        }
      });
    }
    await ctx.yield();
    await drawGathered();
    await ctx.yield();
    // ==== RETURN ====
    const camPos = new THREE.Vector3();
    setWeather(1);
    return {
      scene, path, duration: 48, pace,
      camera: { fov: 62, near: 0.3, far: 4000, lookAhead: LOOK_AHEAD, sway: 0.8, bank: 0.6 },
      pois: [{ at: gazeAt, from: 0, to: 1, weight: GAZE_W, fade: 0.001 }],
      portal: { shape: 'circle', radius: 9, color: '#d6ecff', glow: 1, revealDistance: 280 },
      post: { exposure: 1, bloom: { strength: 0.4, radius: 0.6, threshold: 0.92 }, grade: { saturation: 1.06, contrast: 1.03, tint: '#ffffff', shadowTint: '#0a1418', vignette: 0.26, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        camPos.setFromMatrixPosition(camera.matrixWorld);
        // what the eye wears reads the storm's field at the eye's own place: fog, the two lights, the rain and the spindrift about it, the sky's dome, the sea's sheet
        const eyeF = stormAt(camPos.x, camPos.z), eyeRain = eyeF * (1 - smoothstep(SU.uEdge.value.x - 30, SU.uEdge.value.x + 6, isle.northOf(camPos.x, camPos.z)));
        setWeather(eyeF);
        SU.uAt.value.copy(camPos); SU.uSkyTime.value = time + skyPh; seaU.uTime.value = time + seaPh;
        sea.position.set(camPos.x, 0, camPos.z);
        hero.update(dt, time, camera);
        for (const f of tick) f(dt, time, camera, u, eyeF, eyeRain);
      },
      dispose() { hero.dispose(); depthTex.dispose(); },
    };
  },
};
