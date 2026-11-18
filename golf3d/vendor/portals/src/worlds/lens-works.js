// THE LIGHTHOUSE LENS
// An 1860s Paris optical works, built 25 times life size so that the camera is a moth. A first-order lighthouse lens
// (src/parts/lens-works.js) is under test in the middle of the hall: it turns once in 96 s and throws twenty-two
// blades of white-gold light round the workshop, each a slab of lit dust that ends in a patch sliding over brick,
// rack and bench. Floor y 0, x east, z south, the lens axis is the origin.
// Flight: THE AISLE (enter at z 210 heading north between the panel racks, the lens dead ahead; the gaze drifts east so
// the hall opens: birds cross, the sleeper lies on its stack of crates, the hatch glows far off) -> THE CLOSE SWEEP (up and
// out to the west, then in on the lens: from 73 m at u 0.25 to 49 m in the west at u 0.34, level with the bull's-eyes,
// the optic filling the frame's height with both flanks in view, each boss holding the flame) -> THE CLIMB (north-west,
// up to y 85 by u 0.43: the lens from above its shoulder, the benches and the fan of blades beyond) -> THE PULL-BACK
// (north, looking back as it shrinks, to a tight turn under the north windows at u 0.53, 124 m off: the whole hall, the
// lens small and blazing) -> THE TURN-IN (straight back down at the two hinged leaves as they stand open) -> THE HOLLOW
// (round the lamp with the flame on our left; at the top of the lap the gaze goes up the chimney into the crown rings;
// on the way down the empty bay stands on the hatch, the lamp at our left hand and the portal in the bay at our right)
// -> out east-north-east through the one bay that has no glass, over the cradle, straight at the photometry hatch in
// the east wall, met 18 degrees off square between its folded shutters and two signal lanterns, and 30 m down the
// black riveted photometry tunnel through six nested ribs to the portal. The route's last eighth is re-timed (makeRoute):
// we hang back inside the lens while the bay's two standards frame the hatch, then run out to it.
// The lens angle is a function of u, so leaves and empty bay meet the path at any speed.
// No three.js lights: every surface uses the hero's shared light (overcast top light + the beam term + the flame).
// Looks by seed: pewter afternoon (cool grey air, gold only in the blades), snow-light morning (blue-white, snow sliding
// down the roof glass), thick day (the far hall lost, blades near solid), slate-blue dusk with gas jets. Rare: the
// blinds run down the roof on the pull-back (u 0.45 to 0.54) and the hall falls to half light.
// The prism rings also throw a few slow sheets of spectrum (the part's lwRainbow): arcs on the floor, bands on wall, rack and truss.
// SWITCHED OFF (uRain 0, and the rim thread kept in the rim colour): the brief says "No spectra, no rainbow fringes, no coloured caustics anywhere".
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import * as INT from '../kit/interior.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import { buildHero, makeLensLight, LENS, SID, sf, strut, wheelGeometry, panelGeometry } from '../parts/lens-works.js';

const TAU = Math.PI * 2, PITCH = LENS.PITCH, DUR = 50;
const X0 = -160, X1 = 80, Z0 = -150, Z1 = 230, EAVES = 110, RIDGE = 160, RIDGE_X = -40;
const ENTRY_B = 155, LAP_R = 13, EXIT_B = 18;      // the leaves stand north-north-east; the lap round the lamp is flown 13 m off the axis and left at bearing 18, heading east-north-east
const EXB = EXIT_B * Math.PI / 180, TSH = Math.tan(EXB);      // so we meet the east wall 18 degrees off square: the hatch is seen three-quarter, never flat on
// the hatch's centre in the east wall (on the line we leave the lamp by); the photometry tunnel's mouth is 24 m square and
// draws in to 19 m at the portal 30 m inside; the tunnel runs along our line, skewed to the wall
const HZ = LAP_R * Math.cos(EXB) - TSH * (80 - LAP_R * Math.sin(EXB)), HY = 47, TUN = 30, TUN0 = 8, HM = 12, HE = 9.6;
// a place in the tunnel: a metres in from the wall, c metres to the right of its centre line (south), at height y
const tunAt = (a, c = 0, y = HY) => [80 + a, y, HZ + c - a * TSH];
const SPIRAL = [[311, 76, 55], [298, 64, 52], [285, 55, 49], [272, 50, 46.5], [259, 48, 46], [246, 49, 47.5], [233, 53, 52], [222, 60, 60], [213, 68, 70], [206, 76, 80], [200, 84, 87]];
const PULL = [[-24, 85, -96], [-20.5, 78, -108], [-15.5, 70, -117], [-7, 64.5, -123], [3.5, 62.5, -124.5], [13, 62, -120], [18.5, 60.5, -111], [20, 58, -98], [19.5, 55, -82], [17.5, 52, -64], [14.5, 49.5, -46]];
const RARE0 = 0.45, RARE1 = 0.54;      // the rare event: the blinds run down the roof between these places on the route
const ss = THREE.MathUtils.smoothstep, clamp = THREE.MathUtils.clamp, lerp = THREE.MathUtils.lerp;
const lin = (hex, k = 1) => new THREE.Color(hex).multiplyScalar(k);
const box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const cyl = (rt, rb, h, seg = 10, open = false) => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open);
const bear = (b, r = 1, y = 0) => [Math.sin(b) * r, y, Math.cos(b) * r];

const BRICK = '#8E3F30', IRON = '#34383b', IRON_L = '#4a4f53', BRASS = '#c79a45', OAK = '#6a4a2c', OAK_D = '#3a2a1c', PINE = '#b08a55', STRAW = '#c9a857', LEATHER = '#5a3a24';
const S_BRICK = sf(SID.BRICK, 0.06), S_FLOOR = sf(SID.FLOOR, 0.12), S_IRON = sf(SID.PLAIN, 0.35, 0.55), S_IRONM = sf(SID.PLAIN, 0.1, 0.2), S_BRASS = sf(SID.PLAIN, 0.8, 1);
const S_RIB = sf(SID.PLAIN, 0.6, 0.7), LAN = [-2.6, 8.4, 9.3], LAN2 = [13.4, 6.9, 7.9];      // ribbed iron that takes a highlight; a signal lantern's place off the hatch's centre (out from the wall, up, sideways)
const S_WOOD = sf(SID.WOOD, 0.2), S_WOODG = sf(SID.WOOD, 0.45), S_CLOTH = sf(SID.FABRIC, 0.04), S_STONE = sf(SID.STONE, 0.1), S_PAINT = sf(SID.PLAIN, 0.08);

// The hall is never bright: the overcast gives a dim cool top light, and the blades and their patches carry the picture.
const LOOKS = {
  // pewter: cool grey air, clean; the gold is in the blades and their patches only
  pewter: { title: 'The Lighthouse Lens', top: '#b3bcc8', topK: 1.2, roof: '#c6ced6', roofK: 1.15, fog: '#878d96', fogK: 0.22, fogDen: 0.0024, beam: '#FFDFA0', beamGain: 3.3,
    bladeDen: 0.07, bladeGain: 0.18, hot: 1.5, veil: 0.03, snow: 0, jet: 0, exposure: 1.15, tint: '#f0f3f8', shadowTint: '#14161c', sat: 1.1, rain: 1.9, lamp: 1.0, bladeK: 0.62 },
  // snow light: the roof white and blue with snow sliding down it, a blue-white hall, thin pale blades: the narrowest of the four
  // looks, with dark air between them, so the hall reads through the fan
  snow: { title: 'The Lighthouse Lens, Snow Light', top: '#cfdcf4', topK: 1.3, roof: '#f0f5ff', roofK: 1.5, fog: '#b3c1da', fogK: 0.27, fogDen: 0.0024, beam: '#FFE7B4', beamGain: 3.3,
    bladeDen: 0.1, bladeGain: 0.27, hot: 1.5, veil: 0.06, snow: 1, jet: 0, exposure: 1.08, tint: '#e2ebfb', shadowTint: '#0a1428', sat: 1.08, rain: 1.8, lamp: 1.15, bladeK: 1.3 },
  // thick day: the air full of rouge and dust; the far end of the hall is lost and the blades are near solid
  thick: { title: 'The Lighthouse Lens, Thick Day', top: '#b2aea6', topK: 1.0, roof: '#cbc8c0', roofK: 1.05, fog: '#9c978c', fogK: 0.3, fogDen: 0.0058, beam: '#FFE2AC', beamGain: 3.4,
    bladeDen: 0.15, bladeGain: 0.135, hot: 1.2, veil: 0.1, snow: 0, jet: 0, exposure: 1.06, tint: '#f8f5ee', shadowTint: '#1c150e', sat: 1.1, rain: 1.3, lamp: 1.0, bladeK: 0.42 },
  dusk: { title: 'The Lighthouse Lens, Late Dusk', top: '#6d83ac', topK: 1.2, roof: '#7088b8', roofK: 0.8, fog: '#44516c', fogK: 0.42, fogDen: 0.0030, beam: '#FFDE9C', beamGain: 3.2,
    bladeDen: 0.065, bladeGain: 0.115, hot: 1.9, veil: 0.03, snow: 0, jet: 1, exposure: 1.3, tint: '#eef2ff', shadowTint: '#0c1020', sat: 1.1, rain: 1.9, lamp: 1.7, bladeK: 0.5 },
};

// ---- the route. Returns the path and the places on it that everything else is keyed to.
export function makeRoute() {
  const D = Math.PI / 180;
  // the aisle, level at first, then up and out to the west over the rack and past the north ends of the benches
  const P = [[0, 42, 210], [0, 42.2, 190], [0.5, 43.2, 172], [1, 45, 155], [-5, 48, 138], [-17, 52, 121], [-29, 55, 105], [-40, 56.5, 88], [-52, 57, 72]];
  // the spiral: round the south-west with the lens on our right, out to 98 m in the west, then in on it to 74 m in the
  // north-west, level with the bull's-eyes (the close pass)
  for (const [b, r, y] of SPIRAL) P.push(bear(b * D, r, y));
  // the pull-back: north, the lens falling away behind our right shoulder, and a tight turn to the right under the north windows
  P.push(...PULL);
  // the turn-in: straight back down at the two hinged leaves as they open
  // inside: in past the lamp and round it with the flame on our left, once round climbing to the top of the drum and
  // down again, then most of a second turn, easing outward
  P.push(bear(ENTRY_B * D, 27.06, 47), bear((ENTRY_B + 10.7) * D, 19.1, 47.2), bear((ENTRY_B + 42.4) * D, 14.2, 48));
  // the way out: the lap is left at bearing EXIT_B and from there the line is straight: through the empty bay, over the
  // cradle, into the hatch. The portal is in sight from inside the lens all the way.
  const b0 = ENTRY_B + 86.2, b1 = 720 + EXIT_B, nl = Math.round((b1 - b0) / 24);
  for (let i = 0; i < nl; i++) { const t = i / nl; P.push(bear((b0 + (b1 - b0) * t) * D, LAP_R, 47 + 9.5 * Math.pow(Math.sin(Math.PI * Math.min(1, t / 0.72)), 2))); }
  const lp = bear(EXB, LAP_R, 47), pe = tunAt(TUN), tl = Math.hypot(pe[0] - lp[0], pe[2] - lp[2]);
  for (let t = 0; t < tl - 6; t += 11) P.push([lp[0] + (pe[0] - lp[0]) * t / tl, 47, lp[2] + (pe[2] - lp[2]) * t / tl]);
  P.push(pe);
  // THE WAY OUT, RE-TIMED. The tunnel is 30 m deep (it was 8), so the line is longer at its far end only. The route
  // keeps its old length and its old places up to u 0.872; from there the place on the line runs first a little behind
  // (we hang back inside the lens while the bay's two standards frame the hatch), then ahead (out over the cradle, in
  // between the lanterns and down the tunnel), and meets the portal at the line's true end at its old speed.
  const inner = makePath(P), LN = inner.length - (TUN - TUN0) / Math.cos(EXB), EX = inner.length - LN;
  const WK = [[0.872, 0, 0], [0.905, -5.5, 0], [0.94, 12, 250], [0.97, 19.5, 140], [1, EX, 45]];      // u, metres ahead of the plain place, metres per u
  const warp = (d) => {
    const u = d / LN; if (u <= WK[0][0]) return d; if (u >= 1) return d + EX;
    let i = 0; while (i < WK.length - 2 && u > WK[i + 1][0]) i++;
    const a = WK[i], b = WK[i + 1], h = b[0] - a[0], t = (u - a[0]) / h, t2 = t * t, t3 = t2 * t;
    return d + (2 * t3 - 3 * t2 + 1) * a[1] + (t3 - 2 * t2 + t) * h * a[2] + (-2 * t3 + 3 * t2) * b[1] + (t3 - t2) * h * b[2];
  };
  const path = { ...inner, length: LN, inner,
    posAtDist(d, out = new THREE.Vector3()) { return inner.posAtDist(warp(d), out); },
    tangentAtDist(d, out = new THREE.Vector3()) { return inner.tangentAtDist(warp(d), out); },
    pointAt(u, out = new THREE.Vector3()) { return inner.posAtDist(warp(u * LN), out); },
    tangentAt(u, out = new THREE.Vector3()) { return inner.tangentAtDist(warp(u * LN), out); },
    nearestXZ(x, z) { const n = inner.nearestXZ(x, z); n.u = Math.min(1, n.u * inner.length / LN); return n; } };
  const v = new THREE.Vector3(), N = 1600;
  let uIn = 0.75, uOut = 0.9, uTurn = 0.7, uNear = 0.4, uFar = 0.5, prev = 99, best = 1e9, rMin = 1e9, rMax = 0;
  for (let i = 0; i <= N; i++) {
    const u = i / N; path.pointAt(u, v); const r = Math.hypot(v.x, v.z);
    if (u > 0.5 && prev > LENS.RD && r <= LENS.RD) uIn = u;
    if (u > 0.5 && prev < LENS.RD && r >= LENS.RD) uOut = u;
    if (u > 0.2 && u < 0.5 && r < rMin) { rMin = r; uNear = u; }
    if (u > 0.3 && u < 0.7 && v.z < -100 && r > rMax) { rMax = r; uFar = u; }
    prev = r;
  }
  for (let i = 0; i <= N; i++) { const u = i / N; path.pointAt(u, v); const d = Math.hypot(v.x - 19.5, v.z + 82); if (u > 0.45 && d < best) { best = d; uTurn = u; } }
  const pIn = path.pointAt(uIn - 0.004, new THREE.Vector3()), pOut = path.pointAt(uOut, new THREE.Vector3());
  return { path, uIn, uOut, uTurn, uNear, uFar, bIn: Math.atan2(pIn.x, pIn.z), bOut: Math.atan2(pOut.x, pOut.z), exitB: EXIT_B };
}

// ---- the camera and its gaze, as a function of the route (the world and the offline framing check both use it)
export function flightPlan(R, rare) {
  // The gaze. One long look keyed to u: [u, degrees to the right of the lens axis as seen from the camera, height]. The
  // lens is on our right all the way round, so a look to the right of it sets the optic whole in the left of the frame
  // with the hall it lights beyond (the east wall and the far hatch from the aisle, the south hall from the west), and it
  // keeps the lens in the picture for a viewer whose camera follows the route more than the gaze. At the close pass the
  // lens is centred; on the pull-back we look over our shoulder at it; then the gaze settles on the leaves as they open.
  const KEY = [[0, 0, 50], [0.03, 0, 50], [0.08, 18, 50], [0.16, 18, 52], [0.25, 13, 30], [R.uNear - 0.04, 6, 48], [R.uNear + 0.012, 15, 48], [R.uNear + 0.06, 3, 53], [R.uNear + 0.1, -4, 60], [R.uFar - 0.03, -12, 49], [R.uFar + 0.05, -10, 46], [R.uIn - 0.06, 0, 58], [R.uIn + 0.02, 0, 48.5]];
  const gaze = new THREE.Vector3(), cp = new THREE.Vector3(), flameAt = new THREE.Vector3();
  const gazeAt = (t, u) => {
    let i = 0; while (i < KEY.length - 2 && u > KEY[i + 1][0]) i++;
    const a = KEY[i], b = KEY[i + 1], f = ss(u, a[0], b[0]), dg = lerp(a[1], b[1], f) * Math.PI / 180;
    // on a rare visit the gaze lifts a little toward the roof while the blinds run down it
    const lift = rare ? 15 * ss(u, RARE0 + 0.03, RARE0 + 0.08) * (1 - ss(u, RARE1 + 0.03, RARE1 + 0.09)) : 0;
    R.path.pointAt(clamp(u, 0, 1), cp);
    const c = Math.cos(dg), s = Math.sin(dg);      // the line from the eye to the axis, turned about the eye
    return gaze.set(cp.x + (-cp.x) * c + cp.z * s, lerp(a[2], b[2], f) + lift, cp.z + (-cp.z) * c - cp.x * s);
  };
  return {
    camera: { fov: 66, near: 0.3, far: 900, lookAhead: 22, sway: 0.7, bank: 0.2 },
    pois: [
      { at: gazeAt, from: -0.04, to: R.uIn + 0.01, weight: 1, fade: 0.1 },
      { at: gazeAt, from: 0.08, to: R.uNear + 0.02, weight: 0.4, fade: 0.15 },
      { at: gazeAt, from: 0.2, to: R.uFar - 0.04, weight: 1, fade: 0.25 }, { at: gazeAt, from: 0.22, to: R.uNear + 0.1, weight: 1, fade: 0.25 },      // and twice more round the close sweep, where the lens is square off the steady camera's line of travel      // the same look again, lightly: it changes nothing for the sweeping camera and steadies the lens in the frame of the steady one
      { at: (t, u) => flameAt.set(0, 48.5 - 1.5 * ss(u, R.uIn + 0.03, R.uIn + 0.065), 0), from: R.uIn - 0.012, to: R.uIn + 0.09, weight: 0.82, fade: 0.25 },      // the flame as we come in, and held in the frame as we climb past it
      { at: new THREE.Vector3(0, 67.5, 0), from: R.uIn + 0.066, to: R.uIn + 0.15, weight: 0.85, fade: 0.3 },        // up the chimney to the smoke bell and the spokes of the crown, from the top of the lap
      { at: new THREE.Vector3(0, 67.5, 0), from: R.uIn + 0.066, to: R.uIn + 0.15, weight: 0.6, fade: 0.3 }, { at: new THREE.Vector3(0, 67.5, 0), from: R.uIn + 0.066, to: R.uIn + 0.15, weight: 0.6, fade: 0.3 },      // the same look twice more: next to nothing for the sweeping camera, and it brings chimney and bell into the steady one's frame
      { at: new THREE.Vector3(17, 48, -5), from: R.uOut - 0.108, to: R.uOut - 0.02, weight: 0.8, fade: 0.3 },      // the empty bay and the hatch beyond it in the middle of the frame, the lamp at our left hand
      { at: new THREE.Vector3(...tunAt(TUN)), from: R.uOut - 0.03, to: 0.99, weight: 0.85, fade: 0.2 },             // the portal in its hatch
    ],
  };
}

export default {
  id: 'lens-works',
  name: 'The Lighthouse Lens',
  category: 'interior',
  weirdness: 0.15,
  media: ['interior', 'tiny'],
  async build(ctx) {
    const { rng } = ctx, Q = ctx.quality?.detail ?? 1, vary = ctx.vary || {}, dens = vary.density ?? 1;
    const scene = new THREE.Scene();

    // ------------------------------------------------------------------ the visit: look and cast
    const V = rng.fork('visit');
    const pick = V.pick(['snow', 'snow', 'pewter', 'pewter', 'thick', 'dusk', 'thick', 'pewter']);
    const lookName = vary.hour === 'dawn' ? 'snow' : vary.hour === 'night' ? 'dusk' : vary.hour === 'golden' ? 'pewter' : vary.hour === 'day' ? (pick === 'dusk' ? 'thick' : pick) : pick;
    const look = LOOKS[lookName], rare = !!vary.rare;
    const rimPick = lookName === 'dusk' ? '#1f8a66' : V.pick(['#3FBF9F', '#62d4b4', '#3FBF9F']), rimHex = lookName === 'snow' ? '#62dcc0' : rimPick;
    const flameHex = V.chance(0.35) ? '#fff1d6' : '#ffdf9c', swallows = V.chance(0.4), tv = V(), terrier = tv > 0.1 && tv < 0.42;

    // ------------------------------------------------------------------ route, timing, the lens angle as a function of u
    await ctx.yield();
    const R = makeRoute(), path = R.path;
    await ctx.yield();
    // quick on the long way round, easing past the close pass, slower down the turn-in, slowest round the lamp, then out at an even pace
    const pace = (u) => { const kn = (u - R.uNear) / 0.045; return 1.2 - 0.2 * Math.exp(-kn * kn) - 0.3 * ss(u, R.uTurn - 0.06, R.uTurn + 0.01) - 0.25 * ss(u, R.uIn - 0.02, R.uIn + 0.04) + 0.35 * ss(u, R.uOut - 0.07, R.uOut + 0.01) - 0.28 * Math.exp(-((u - 0.927) / 0.019) * ((u - 0.927) / 0.019)); };      // (the last term evens out the rush from the bay to the hatch, where the route itself runs ahead)
    const TN = 256, TT = new Float32Array(TN + 1);
    { let acc = 0; for (let i = 1; i <= TN; i++) { acc += 2 / (clamp(pace((i - 1) / TN), 0.35, 2.5) + clamp(pace(i / TN), 0.35, 2.5)); TT[i] = acc; } for (let i = 0; i <= TN; i++) TT[i] *= DUR / acc; }
    const timeAt = (u) => { const x = clamp(u, 0, 1) * TN, i = Math.min(TN - 1, Math.floor(x)); return TT[i] + (TT[i + 1] - TT[i]) * (x - i); };
    // the empty bay (local bearing PITCH) must stand on the path at uOut, the leaf pair at uIn; the leaves take the bay that keeps the turning nearest 3.75 deg/s
    const OMEGA = TAU / 96, tIn = timeAt(R.uIn - 0.004), tOut = timeAt(R.uOut);
    // as we leave, the bay stands a little south of the path, so that from inside the hatch is seen through the middle of
    // it between its two standards, and the bare flame's faint blade of dust (the part's uBayBeam, the bay's northern half)
    // lies from the lens to the hatch's near jamb: we fly out beside it
    const angOut = R.bOut - PITCH + 0.063;      // (and 3.6 degrees north of it, so that the hatch stands midway between the two standards while we hang back inside)
    // seconds of full-speed turning by the time d (seconds from the way out): the lens eases to a third of its speed over
    // the last three seconds inside, so the bay is already standing open on the portal while we finish the lap, and creeps after
    const soft = (x) => -Math.log(1 + Math.exp(-1.5 * x)) / 1.5, turned = (d) => (d > 0 ? 0.3 * d : 0.3 * d + 0.7 * (soft(d + 3.5) - soft(3.5)));
    let LEAF = 14, omega = OMEGA, bestErr = 1e9;
    for (let s = 4; s <= 20; s += 2) for (let k = -2; k <= 2; k++) { const angIn = R.bIn - (s + 1) * PITCH + k * TAU, w = (angOut - angIn) / -turned(tIn - tOut); if (Math.abs(w - OMEGA) < bestErr) { bestErr = Math.abs(w - OMEGA); LEAF = s; omega = w; } }
    const lensAngle = (u) => angOut + omega * turned(timeAt(u) - tOut);
    await ctx.yield();

    // ------------------------------------------------------------------ the shared light, set for this look
    const LT = makeLensLight({ leafStation: LEAF }), U = LT.uniforms;
    U.uTopCol.value.copy(lin(look.top, look.topK)); U.uRoofCol.value.copy(lin(look.roof, look.roofK)); U.uFogCol.value.copy(lin(look.fog, look.fogK));
    U.uFogDen.value = look.fogDen; U.uBeamCol.value.copy(lin(look.beam)); U.uBeamGain.value = look.beamGain; U.uBladeDen.value = look.bladeDen;
    U.uBladeGain.value = look.bladeGain; U.uRain.value = 0; U.uBladeK.value = look.bladeK; U.uBladeHot.value = look.hot; U.uBladeVeil.value = look.veil; U.uSnow.value = look.snow; U.uJet.value = look.jet * 1.0;
    U.uRimCol.value.copy(lin(rimHex, lookName === 'dusk' ? 0.8 : 1)); U.uFlameCol.value.copy(lin(flameHex));
    const portalHex = '#c8f4e6'; U.uPortalPos.value.copy(R.path.end); U.uHatch.value.set(X1, HY, HZ); U.uLan.value.set(LAN[0], LAN[1], LAN[2]); U.uLan2.value.set(LAN2[0], LAN2[1], LAN2[2]); U.uTun.value = TSH; U.uBayBeam.value = 0.45; U.uPortalCol.value.copy(lin(portalHex, 1));
    scene.background = U.uFogCol.value.clone();
    const matW = LT.surface(), matW2 = LT.surface({ side: THREE.DoubleSide }), matO = LT.surface({ obj: true }), matSpin = LT.surface({ spin: true }), stock = LT.glass('stock');
    const o3 = new THREE.Object3D();
    const lamps = [];              // the flames of the workers' oil lamps [x, y, z, pool x, pool y]: glows and pools of light are laid on them at the end
    const lampAt = (b, x, y, z, px) => {
      b.add(cyl(0.9, 1.1, 0.5, 10), { p: [x, y + 0.25, z], c: BRASS, surf: S_BRASS }); b.add(new THREE.SphereGeometry(1.0, 10, 7), { p: [x, y + 1.2, z], s: [1, 0.7, 1], c: BRASS, surf: S_BRASS });
      b.add(cyl(0.42, 0.62, 0.7, 8), { p: [x, y + 2.2, z], c: '#8a6a34', surf: S_BRASS }); b.add(new THREE.TorusGeometry(0.7, 0.08, 4, 10), { p: [x + 0.9, y + 1.3, z], c: BRASS, surf: S_BRASS });
      b.add(cyl(0.3, 0.52, 2.9, 8, true), { p: [x, y + 3.95, z], c: '#ffd9a0', surf: sf(SID.PLAIN, 0.8, 0, 1.5) });      // the lit chimney
      lamps.push([x, y + 3.5, z, px, y + 0.07]);
    };
    const place = (im, i, p, r = [0, 0, 0], s = 1) => { o3.position.set(p[0], p[1], p[2]); o3.rotation.set(r[0], r[1], r[2], 'YXZ'); if (typeof s === 'number') o3.scale.set(s, s, s); else o3.scale.set(s[0], s[1], s[2]); o3.updateMatrix(); im.setMatrixAt(i, o3.matrix); };

    // ------------------------------------------------------------------ the hero
    const hero = await buildHero(ctx, { light: LT, leafStation: LEAF });
    scene.add(hero.object);
    await ctx.yield();

    // ------------------------------------------------------------------ the hall: floor, brick, glass roof, north windows, hatch
    {
      let b = INT.makeBuilder();
      b.quad([X0, 0, Z1], [X1, 0, Z1], [X1, 0, Z0], [X0, 0, Z0], '#6e655b', S_FLOOR);
      b.quad([X0, 0, Z1], [X0, 0, Z0], [X0, EAVES, Z0], [X0, EAVES, Z1], BRICK, S_BRICK);                                   // west
      b.quad([X0, 0, Z0], [X1, 0, Z0], [X1, EAVES, Z0], [X0, EAVES, Z0], BRICK, S_BRICK);                                   // north
      b.quad([X1, 0, Z1], [X0, 0, Z1], [X0, EAVES, Z1], [X1, EAVES, Z1], BRICK, S_BRICK);                                   // south
      b.quad([X1, 0, Z0], [X1, 0, HZ - HM], [X1, EAVES, HZ - HM], [X1, EAVES, Z0], BRICK, S_BRICK);                         // east, round the hatch
      b.quad([X1, 0, HZ + HM], [X1, 0, Z1], [X1, EAVES, Z1], [X1, EAVES, HZ + HM], BRICK, S_BRICK);
      b.quad([X1, 0, HZ - HM], [X1, 0, HZ + HM], [X1, HY - HM, HZ + HM], [X1, HY - HM, HZ - HM], BRICK, S_BRICK);
      b.quad([X1, HY + HM, HZ - HM], [X1, HY + HM, HZ + HM], [X1, EAVES, HZ + HM], [X1, EAVES, HZ - HM], BRICK, S_BRICK);
      for (const z of [Z0, Z1]) b.quad([X0, EAVES, z], [X1, EAVES, z], [RIDGE_X, RIDGE, z], [RIDGE_X, RIDGE, z], BRICK, S_BRICK);   // gables
      b.quad([X0, EAVES, Z0], [X0, EAVES, Z1], [RIDGE_X, RIDGE, Z1], [RIDGE_X, RIDGE, Z0], '#ffffff', sf(SID.ROOF));
      b.quad([RIDGE_X, RIDGE, Z0], [RIDGE_X, RIDGE, Z1], [X1, EAVES, Z1], [X1, EAVES, Z0], '#ffffff', sf(SID.ROOF));
      // six tall ground-glass windows in the north wall, stone sills and heads
      for (let k = 0; k < 6; k++) {
        const x0 = X0 + 8.57 + k * 38.57, x1 = x0 + 30, z = Z0 + 0.7;
        b.quad([x0, 18, z], [x1, 18, z], [x1, 100, z], [x0, 100, z], '#ffffff', sf(SID.WINDOW));
        b.add(box(33, 2.4, 3.2), { p: [x0 + 15, 16.8, Z0 + 1.6], c: '#8a8378', surf: S_STONE }); b.add(box(33, 3, 2.4), { p: [x0 + 15, 101.5, Z0 + 1.2], c: '#8a8378', surf: S_STONE });
        for (const x of [x0 - 0.8, x1 + 0.8]) b.add(box(1.6, 82, 2.0), { p: [x, 59, Z0 + 1.0], c: '#7a4034', surf: S_BRICK });
      }
      await ctx.yield();
      scene.add(new THREE.Mesh(b.build(), matW2)); b = INT.makeBuilder();
      await ctx.yield();
      // THE PHOTOMETRY TUNNEL behind the hatch: a black gallery of riveted plate, 17 m square at the mouth and drawing in
      // to 13 m at the portal, bending away to the south, with four riveted ribs, a pair of rails down the floor on the
      // south side, the photometer on its carriage, and a graduated rule along the north wall
      const hw = (a) => HM - (HM - HE) * Math.min(a, TUN) / TUN, S_TUN = sf(SID.TUNNEL, 0.46, 0.3), TUNC = '#282c31', TSL = (HM - HE) / TUN;
      for (let k = 0; k < 14; k++) {
        const a0 = (TUN + 4.5) * k / 14, a1 = (TUN + 4.5) * (k + 1) / 14, h0 = hw(a0), h1 = hw(a1);
        for (const s of [-1, 1]) {
          b.quad(tunAt(a0, -h0, HY + s * h0), tunAt(a1, -h1, HY + s * h1), tunAt(a1, h1, HY + s * h1), tunAt(a0, h0, HY + s * h0), TUNC, S_TUN);
          b.quad(tunAt(a0, s * h0, HY - h0), tunAt(a1, s * h1, HY - h1), tunAt(a1, s * h1, HY + h1), tunAt(a0, s * h0, HY + h0), TUNC, S_TUN);
        }
      }
      b.quad(tunAt(TUN + 4.5, -HE - 3, HY - HE - 3), tunAt(TUN + 4.5, HE + 3, HY - HE - 3), tunAt(TUN + 4.5, HE + 3, HY + HE + 3), tunAt(TUN + 4.5, -HE - 3, HY + HE + 3), '#101214', S_TUN);
      const rivet = new THREE.CylinderGeometry(0.17, 0.24, 0.26, 6);
      // six ribs, a nest of square frames drawing in toward the portal: black iron, darker and lighter by turns, each
      // deeper than the plate so that it stands as a frame of its own against the lit plate behind it
      for (let k = 0; k < 6; k++) {
        const a = 2.0 + k * 4.6, h = hw(a), n = Math.round(h * 2 / 1.9), ry = 0, rc = k % 2 ? '#2b3034' : '#33393e', fc = k % 2 ? '#3d454b' : '#4a5258';
        for (const s of [-1, 1]) {
          b.add(box(1.0, 1.5, h * 2), { p: tunAt(a, 0, HY + s * (h - 0.75)), r: [0, ry, 0], c: rc, surf: S_RIB }); b.add(box(1.0, h * 2 - 3.0, 1.5), { p: tunAt(a, s * (h - 0.75)), r: [0, ry, 0], c: rc, surf: S_RIB });
          b.add(box(1.7, 0.28, h * 2 - 3.0), { p: tunAt(a, 0, HY + s * (h - 1.6)), r: [0, ry, 0], c: fc, surf: S_RIB }); b.add(box(1.7, h * 2 - 3.5, 0.28), { p: tunAt(a, s * (h - 1.6)), r: [0, ry, 0], c: fc, surf: S_RIB });      // the flange
          for (let q = 0; q < n; q++) { const t = (q + 0.5) / n * 2 - 1, w = t * (h - 1.7);
            b.add(rivet, { p: tunAt(a - 0.52, w, HY + s * (h - 0.75)), r: [0, ry, Math.PI / 2], c: '#7c858b', surf: S_RIB }); b.add(rivet, { p: tunAt(a - 0.52, s * (h - 0.75), HY + w), r: [0, ry, Math.PI / 2], c: '#7c858b', surf: S_RIB });
            if (q % 2 === 0) { b.add(rivet, { p: tunAt(a + 0.5, w, HY + s * (h - 1.76)), r: [s > 0 ? Math.PI : 0, 0, 0], c: '#6c757b', surf: S_RIB }); b.add(rivet, { p: tunAt(a + 0.5, s * (h - 1.76), HY + w), r: [-s * Math.PI / 2, 0, 0], c: '#6c757b', surf: S_RIB }); } }
        }
        await ctx.yield();
      }
      {
        const fy = (a) => HY - hw(a), S_RAIL = sf(SID.PLAIN, 0.85, 0.9), kz = (a) => hw(a) / HM;
        for (const dz of [7.4, 10.2]) for (let k = 0; k < 6; k++) { const a0 = 0.5 + (TUN - 1) * k / 6, a1 = 0.5 + (TUN - 1) * (k + 1) / 6;
          strut(b, tunAt(a0, dz * kz(a0), fy(a0) + 0.6), tunAt(a1, dz * kz(a1), fy(a1) + 0.6), 0.3, 0.42, [0, 1, 0], '#9aa2a8', S_RAIL);
          strut(b, tunAt(a0, dz * kz(a0), fy(a0) + 0.36), tunAt(a1, dz * kz(a1), fy(a1) + 0.36), 0.6, 0.18, [0, 1, 0], '#3a3f43', S_IRON); }
        for (let a = 1.6; a < TUN - 1; a += 2.1) b.add(box(0.7, 0.3, 4.6 * kz(a)), { p: tunAt(a, 8.8 * kz(a), fy(a) + 0.18), r: [0, 0, TSL], c: '#2e2a26', surf: S_WOOD });
        await ctx.yield();
        // the photometer on its carriage: a low truck, a brass column, the head with its two sighting tubes and a white screen
        const ca = 22.6, kc = kz(ca), cy = fy(ca) + 0.8, cr = 0, cp = (da, dc, dy) => tunAt(ca + da, 8.8 * kc + dc, cy + dy);
        for (const da of [-1.6, 1.6]) for (const dc of [-1.4, 1.4]) b.add(wheelGeometry({ teeth: 0, spokes: 4, thick: 0.36, color: '#4a5055', surf: S_IRON }), { p: cp(da, dc * kc, 0.1), r: [Math.PI / 2, 0, 0], s: 0.75 });
        b.add(box(4.8, 0.4, 3.4), { p: cp(0, 0, 0.8), r: [0, cr, 0], c: '#3d3027', surf: S_WOODG }); for (const dc of [-1.6, 1.6]) b.add(box(5.1, 0.55, 0.3), { p: cp(0, dc, 0.7), r: [0, cr, 0], c: '#4a5055', surf: S_IRON });
        b.add(cyl(0.7, 1.0, 0.5, 12), { p: cp(0, 0, 1.25), c: BRASS, surf: S_BRASS }); b.add(cyl(0.27, 0.34, 2.0, 10), { p: cp(0, 0, 2.5), c: BRASS, surf: S_BRASS });
        b.add(new THREE.TorusGeometry(0.4, 0.1, 6, 14).rotateX(Math.PI / 2), { p: cp(0, 0, 2.2), c: '#d9b25a', surf: S_BRASS });
        b.add(box(1.6, 1.2, 2.0), { p: cp(0, 0, 4.1), r: [0, cr, 0], c: '#2a2622', surf: sf(SID.PLAIN, 0.5, 0.2) }); for (const s of [-1, 1]) b.add(box(1.66, 0.12, 2.06), { p: cp(0, 0, 4.1 + s * 0.48), r: [0, cr, 0], c: BRASS, surf: S_BRASS });
        for (const s of [-1, 1]) { b.add(cyl(0.34, 0.34, 1.9, 10), { p: cp(s * 1.7, 0, 4.1), r: [0, cr, Math.PI / 2], c: BRASS, surf: S_BRASS }); b.add(new THREE.TorusGeometry(0.38, 0.08, 5, 12).rotateY(Math.PI / 2), { p: cp(s * 2.65, 0, 4.1), r: [0, cr, 0], c: '#d9b25a', surf: S_BRASS }); }
        b.add(cyl(1.0, 1.0, 0.1, 16), { p: cp(0, -1.15, 4.1), r: [Math.PI / 2, 0, 0], c: '#dcd6c6', surf: S_CLOTH });
        b.add(cyl(0.1, 0.1, 2.0, 6), { p: cp(-1.1, 0.9, 1.9), r: [0, 0, 0.5], c: BRASS, surf: S_BRASS });      // the brake lever
        await ctx.yield();
        // the rule on the north wall: an oak rail with white graduations, every fifth one long
        for (let i = 0, a = 1.2; a < TUN - 0.8; a += 1.05, i++) { const tall = i % 5 === 0;
          b.add(box(0.12, tall ? 1.1 : 0.55, 0.1), { p: tunAt(a, -hw(a) + 0.2, HY - 2.75 + (tall ? 0.28 : 0)), r: [0, -TSL, 0], c: '#9c968a', surf: S_CLOTH }); }
        for (let k = 0; k < 6; k++) { const a0 = 0.5 + (TUN - 1) * k / 6, a1 = 0.5 + (TUN - 1) * (k + 1) / 6; strut(b, tunAt(a0, -hw(a0) + 0.22, HY - 3.3), tunAt(a1, -hw(a1) + 0.22, HY - 3.3), 0.45, 0.3, [0, 0, 1], OAK, S_WOOD); }
      }
      // two more lanterns hang inside, between the third and fourth ribs, one in each upper corner
      for (const s of [-1, 1]) { const [lx, ly, lz] = tunAt(LAN2[0], s * LAN2[2], HY + LAN2[1]), top = HY + hw(LAN2[0]);
        b.add(cyl(0.07, 0.07, top - ly - 1.6, 5), { p: [lx, (top + ly + 1.6) / 2, lz], c: '#6a5a3a', surf: S_BRASS }); b.add(new THREE.TorusGeometry(0.3, 0.06, 5, 10), { p: [lx, ly + 1.7, lz], c: BRASS, surf: S_BRASS });
        b.add(new THREE.ConeGeometry(0.95, 0.75, 8), { p: [lx, ly + 1.25, lz], c: '#8a6a34', surf: S_BRASS }); b.add(cyl(0.7, 0.58, 1.6, 8), { p: [lx, ly + 0.05, lz], c: '#ffd9a0', surf: sf(SID.PLAIN, 0.8, 0, 1.6) });
        b.add(cyl(0.68, 0.85, 0.32, 8), { p: [lx, ly - 0.9, lz], c: BRASS, surf: S_BRASS }); b.add(new THREE.SphereGeometry(0.18, 6, 4), { p: [lx, ly - 1.18, lz], c: BRASS, surf: S_BRASS });
        for (let q = 0; q < 4; q++) b.add(box(0.07, 1.65, 0.07), { p: [lx + Math.cos(q * 1.571 + 0.4) * 0.68, ly + 0.05, lz + Math.sin(q * 1.571 + 0.4) * 0.68], c: '#6a5a3a', surf: S_BRASS }); }
      await ctx.yield();
      // the hatch's iron frame with its bolts, and the two shutters folded back flat on the wall: plate in a frame, ribbed, on strap hinges
      const SHUT = '#40484c', SHUT_L = '#5e686f', FR = HM + 1.2, HB = HM + 2.9;
      for (const s of [-1, 1]) {
        b.add(box(2.2, FR * 2 + 2.4, 2.4), { p: [X1 - 0.9, HY, HZ + s * FR], c: IRON, surf: S_IRON }); b.add(box(2.2, 2.4, FR * 2 + 2.4), { p: [X1 - 0.9, HY + s * FR, HZ], c: IRON, surf: S_IRON });
        for (let q = 0; q < 11; q++) { const w = (q - 5) * 2.5; b.add(new THREE.SphereGeometry(0.4, 6, 4), { p: [X1 - 2.05, HY + w, HZ + s * FR], c: IRON_L, surf: S_RIB }); b.add(new THREE.SphereGeometry(0.4, 6, 4), { p: [X1 - 2.05, HY + s * FR, HZ + w], c: IRON_L, surf: S_RIB }); }
        const zc = HZ + s * (HB + 0.3 + HM / 2), W2 = HM / 2;
        b.add(box(0.5, HM * 2, HM), { p: [X1 - 0.3, HY, zc], c: SHUT, surf: S_RIB });
        for (const dz of [-W2 + 0.4, W2 - 0.4]) b.add(box(0.75, HM * 2, 0.8), { p: [X1 - 0.75, HY, zc + dz], c: SHUT_L, surf: S_RIB });
        for (const dy of [-HM + 0.4, 0, HM - 0.4]) b.add(box(0.75, 0.8, HM - 1.6), { p: [X1 - 0.75, HY + dy, zc], c: SHUT_L, surf: S_RIB });
        for (let q = 0; q < 5; q++) for (const dy of [-HM / 2, HM / 2]) b.add(cyl(0.34, 0.34, HM - 1.1, 8), { p: [X1 - 0.6, HY + dy, zc + (q - 2) * 1.3], c: q % 2 ? '#4a5358' : SHUT, surf: S_RIB });      // the ribs, half sunk in the plate
        for (const y of [-HM * 0.72, 0, HM * 0.72]) {        // strap hinges: a barrel on the frame, a long strap tapering across the leaf, bolt heads
          b.add(cyl(0.55, 0.55, 2.6, 10), { p: [X1 - 1.25, HY + y, HZ + s * HB], c: IRON_L, surf: S_RIB });
          strut(b, [X1 - 1.15, HY + y, HZ + s * (HB + 0.1)], [X1 - 1.15, HY + y, HZ + s * (HB + 3.8)], 0.3, 1.3, [0, 1, 0], '#2b3033', S_IRON); strut(b, [X1 - 1.15, HY + y, HZ + s * (HB + 3.8)], [X1 - 1.15, HY + y, HZ + s * (HB + 7.6)], 0.28, 0.8, [0, 1, 0], '#2b3033', S_IRON);
          for (const dz of [1.2, 2.8, 4.6, 6.2, 7.3]) b.add(rivet, { p: [X1 - 1.4, HY + y, HZ + s * (HB + dz)], r: [0, 0, Math.PI / 2], c: '#6c757b', surf: S_RIB });
        }
        for (let q = 0; q < 9; q++) for (const dz of [-W2 + 0.4, W2 - 0.4]) b.add(rivet, { p: [X1 - 1.2, HY - HM + 0.9 + q * (HM * 2 - 1.8) / 8, zc + dz], r: [0, 0, Math.PI / 2], c: '#626a70', surf: S_RIB });
        b.add(new THREE.TorusGeometry(0.95, 0.15, 6, 14), { p: [X1 - 1.3, HY - 2.2, zc + s * 2.6], r: [0, Math.PI / 2, 0], c: BRASS, surf: S_BRASS }); b.add(cyl(0.26, 0.26, 0.7, 8), { p: [X1 - 1.1, HY - 1.3, zc + s * 2.6], r: [0, 0, Math.PI / 2], c: BRASS, surf: S_BRASS });
        b.add(box(0.5, 0.6, 4.0), { p: [X1 - 1.2, HY + 3.2, zc + s * 2.0], c: '#2b3033', surf: S_IRON }); b.add(box(0.6, 1.3, 0.6), { p: [X1 - 1.25, HY + 3.2, zc + s * 0.2], c: IRON_L, surf: S_RIB });       // the bar that holds it shut
        // a signal lantern hung in each upper corner of the mouth: the tunnel is in use
        const lz = HZ + s * LAN[2], ly = HY + LAN[1], lx = X1 + LAN[0];
        strut(b, [X1 - 1.4, HY + FR, lz], [lx, ly + 3.2, lz], 0.26, 0.26, [0, 1, 0], BRASS, S_BRASS); strut(b, [X1 - 1.4, HY + FR, lz + s * 1.4], [lx + 0.3, ly + 3.2, lz], 0.16, 0.16, [0, 1, 0], BRASS, S_BRASS);
        b.add(cyl(0.06, 0.06, 1.5, 5), { p: [lx, ly + 2.45, lz], c: '#6a5a3a', surf: S_BRASS }); b.add(new THREE.TorusGeometry(0.3, 0.06, 5, 10), { p: [lx, ly + 1.7, lz], c: BRASS, surf: S_BRASS });
        b.add(new THREE.ConeGeometry(0.95, 0.75, 8), { p: [lx, ly + 1.25, lz], c: '#8a6a34', surf: S_BRASS }); b.add(cyl(0.7, 0.58, 1.6, 8), { p: [lx, ly + 0.05, lz], c: '#ffd9a0', surf: sf(SID.PLAIN, 0.8, 0, 1.6) });
        b.add(cyl(0.68, 0.85, 0.32, 8), { p: [lx, ly - 0.9, lz], c: BRASS, surf: S_BRASS }); b.add(new THREE.SphereGeometry(0.18, 6, 4), { p: [lx, ly - 1.18, lz], c: BRASS, surf: S_BRASS });
        for (let q = 0; q < 4; q++) b.add(box(0.07, 1.65, 0.07), { p: [lx + Math.cos(q * 1.571 + 0.4) * 0.68, ly + 0.05, lz + Math.sin(q * 1.571 + 0.4) * 0.68], c: '#6a5a3a', surf: S_BRASS });
        await ctx.yield();
      }
      b.add(box(1.4, 2.6, HM * 2 + 9), { p: [X1 - 0.7, HY + HM + 4.0, HZ], c: '#8a8378', surf: S_STONE });
      b.add(box(1.8, 1.4, HM * 2 + 7), { p: [X1 - 0.9, HY - HM - 3.3, HZ], c: '#7d776c', surf: S_STONE });
      // the hatch stands in a shallow bay of the wall: a brick pilaster either side on a stone base, a stone cornice on
      // dentils across their heads, a keystone over the lintel and a string course under the sill
      for (const s of [-1, 1]) { const pz = HZ + s * 30.6;
        b.add(box(2.4, 62, 4.4), { p: [X1 - 1.2, 37, pz], c: '#7c382c', surf: S_BRICK }); b.add(box(3.0, 5, 5.2), { p: [X1 - 1.5, 2.5, pz], c: '#857e73', surf: S_STONE });
        b.add(box(3.2, 2.2, 5.6), { p: [X1 - 1.6, 68.6, pz], c: '#8f887c', surf: S_STONE }); b.add(box(2.8, 1.2, 5.0), { p: [X1 - 1.4, 66.9, pz], c: '#7d776c', surf: S_STONE });
        for (let q = 0; q < 7; q++) b.add(box(2.7, 1.5, 4.9), { p: [X1 - 1.35, 10 + q * 8.4, pz], c: '#8a8378', surf: S_STONE }); }
      b.add(box(2.6, 2.4, 66.8), { p: [X1 - 1.3, 71.0, HZ], c: '#8f887c', surf: S_STONE }); b.add(box(3.4, 0.9, 68), { p: [X1 - 1.7, 72.6, HZ], c: '#9a9386', surf: S_STONE });
      for (let q = -15; q <= 15; q++) b.add(box(1.9, 1.3, 1.1), { p: [X1 - 0.95, 69.2, HZ + q * 2.1], c: '#857e73', surf: S_STONE });
      b.add(box(2.2, 5.2, 3.4), { p: [X1 - 1.1, HY + HM + 6.4, HZ], c: '#9a9386', surf: S_STONE }); b.add(box(1.2, 1.6, 55), { p: [X1 - 0.6, 27.4, HZ], c: '#857e73', surf: S_STONE });
      await ctx.yield();
      scene.add(new THREE.Mesh(b.build(), matW2)); b = INT.makeBuilder();
      await ctx.yield();
      // brick piers under every truss, a stone course at the eaves, the great south door
      for (let k = -5; k <= 7; k++) { const z = 3 + 30 * k; b.add(box(2.6, EAVES, 5), { p: [X0 + 1.3, EAVES / 2, z], c: '#84392c', surf: S_BRICK }); if (z < HZ - 24 || z > HZ + 24) b.add(box(2.6, EAVES, 5), { p: [X1 - 1.3, EAVES / 2, z], c: '#84392c', surf: S_BRICK }); }
      for (const x of [X0 + 1, X1 - 1]) b.add(box(2.4, 2.6, Z1 - Z0), { p: [x, EAVES - 1.3, (Z0 + Z1) / 2], c: '#857e73', surf: S_STONE });
      for (const z of [Z0 + 1, Z1 - 1]) b.add(box(X1 - X0, 2.6, 2.4), { p: [(X0 + X1) / 2, EAVES - 1.3, z], c: '#857e73', surf: S_STONE });
      for (const s of [-1, 1]) { b.add(box(21.4, 64, 1.6), { p: [s * 11, 32, Z1 - 1.2], c: OAK_D, surf: S_WOOD });
        for (const y of [10, 32, 54]) b.add(box(20, 1.6, 0.6), { p: [s * 11, y, Z1 - 2.2], c: IRON, surf: S_IRON });
        for (let q = 0; q < 5; q++) b.add(box(0.5, 64, 0.5), { p: [s * (2.6 + q * 4.2), 32, Z1 - 2.1], c: '#2c2016', surf: S_WOOD }); }
      b.add(box(50, 5, 3.2), { p: [0, 66.5, Z1 - 1.6], c: '#8a8378', surf: S_STONE }); for (const s of [-1, 1]) b.add(box(3, 64, 3), { p: [s * 23.5, 32, Z1 - 1.5], c: '#8a8378', surf: S_STONE });
      // purlins under the glass
      for (let k = 1; k <= 5; k++) for (const s of [-1, 1]) b.add(box(1.3, 1.7, Z1 - Z0), { p: [RIDGE_X + s * 20 * k, RIDGE - 20 * k * (50 / 120) - 1.4, (Z0 + Z1) / 2], c: '#2c3033', surf: S_IRON });
      b.add(box(2.2, 2.4, Z1 - Z0), { p: [RIDGE_X, RIDGE - 1.6, (Z0 + Z1) / 2], c: '#2c3033', surf: S_IRON });
      // no column stands before the hatch: a riveted girder carries those two trusses between their neighbours
      b.add(box(2.6, 4.6, 90), { p: [66, 106.2, -12], c: '#3d4a48', surf: S_IRON }); for (const dy of [-2.3, 2.3]) b.add(box(4.4, 0.6, 90), { p: [66, 106.2 + dy, -12], c: '#55625e', surf: S_IRON });
      for (let q = 0; q < 18; q++) b.add(box(3.0, 4.2, 0.5), { p: [66, 106.2, -54.5 + q * 5], c: '#4a5754', surf: S_IRON });
      await ctx.yield();
      scene.add(new THREE.Mesh(b.build(), matW2));
    }
    await ctx.yield();
    // trusses every 30 m and two rows of cast-iron columns
    {
      const b = INT.makeBuilder(), roofY = (x) => RIDGE - Math.abs(x - RIDGE_X) * (50 / 120) - 2.2;
      b.add(box(X1 - X0, 2.6, 1.5), { p: [(X0 + X1) / 2, EAVES, 0], c: '#2e3235', surf: S_IRON });
      for (const s of [-1, 1]) strut(b, [RIDGE_X, RIDGE - 2.2, 0], [RIDGE_X + s * 120, EAVES + 0.4, 0], 1.3, 2.0, [0, 1, 0], '#2e3235', S_IRON);
      const xs = [-140, -120, -100, -80, -60, -40, -20, 0, 20, 40, 60];
      xs.forEach((x, i) => { strut(b, [x, EAVES, 0], [x, roofY(x), 0], 0.7, 0.9, [0, 0, 1], IRON, S_IRON);
        if (i < xs.length - 1) { const x2 = xs[i + 1], up = x < RIDGE_X; strut(b, [up ? x : x2, EAVES, 0], [up ? x2 : x, roofY(up ? x2 : x), 0], 0.45, 0.6, [0, 0, 1], IRON, S_IRON); }
        b.add(box(3.2, 3.2, 0.3), { p: [x, EAVES, 0.9], c: IRON_L, surf: S_IRON }); });
      const tg = b.build(), tm = new THREE.InstancedMesh(tg, matW, 13);
      for (let k = 0; k < 13; k++) place(tm, k, [0, 0, 3 + 30 * (k - 5)]);
      tm.computeBoundingSphere(); scene.add(tm);
      const c = INT.makeBuilder();
      const prof = [[3.4, 0], [3.4, 2.2], [2.5, 3.4], [2.3, 6.5], [1.75, 7.6], [1.45, 96], [1.7, 97], [1.5, 98.4], [2.8, 103], [3.3, 104.2], [3.3, 108.7]].map((p) => new THREE.Vector2(p[0], p[1]));
      c.add(new THREE.LatheGeometry(prof, 12), { c: '#5d6e69', surf: S_IRON, grad: [0, 30, 0.6, 1] });
      for (const y of [30, 60, 90]) c.add(new THREE.TorusGeometry(1.75, 0.3, 5, 12).rotateX(Math.PI / 2), { p: [0, y, 0], c: '#55625e', surf: S_IRON });
      for (const s of [-1, 1]) { strut(c, [0, 96, 0], [s * 11, 108.4, 0], 0.5, 0.8, [0, 0, 1], '#3d4a48', S_IRON); strut(c, [0, 99, 0], [0, 108.4, s * 5], 0.5, 0.8, [1, 0, 0], '#3d4a48', S_IRON); }
      const cg = c.build(), cm = new THREE.InstancedMesh(cg, matW, 26);
      for (let k = 0; k < 13; k++) { place(cm, k * 2, [-104, 0, 3 + 30 * (k - 5)]); place(cm, k * 2 + 1, [66, k === 4 || k === 5 ? -400 : 0, 3 + 30 * (k - 5)]); }
      cm.computeBoundingSphere(); scene.add(cm);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ panel racks either side of the aisle: finished panels on edge like plates
    const stockPanels = [];        // [x, y, z, rotX, rotY, rotZ] of every loose panel (racks and cradle), one instanced draw
    const prismBars = [], drips = [];      // prism bars [x, y, z, rotY, rotZ]; drip cans [x, y, z, fall]
    {
      let b = INT.makeBuilder(); const rr = rng.fork('racks');
      const rack = (xc, s, z0, n) => {
        const len = n * 3.2 + 4.2, zc = z0 + len / 2;
        b.add(box(10.4, 3.4, len), { p: [xc, 1.7, zc], c: OAK_D, surf: S_WOOD, grad: [0, 3.4, 0.6, 1] });
        b.add(box(10.8, 0.5, len + 0.4), { p: [xc, 3.6, zc], c: OAK, surf: S_WOODG });
        for (const [dx, y, w] of [[4.9, 30.2, 1.2], [4.9, 16, 0.9], [-4.9, 9, 0.9], [-4.9, 22, 0.7]]) b.add(box(w, w, len), { p: [xc + s * dx, y, zc], c: OAK, surf: S_WOOD });
        for (let z = z0 + 0.5; z < z0 + len; z += 12) {
          b.add(box(1.2, 30.4, 1.2), { p: [xc + s * 4.9, 15.2, z], c: OAK_D, surf: S_WOOD, grad: [0, 30, 0.65, 1.05] }); b.add(box(1.0, 22.4, 1.0), { p: [xc - s * 4.9, 11.2, z], c: OAK_D, surf: S_WOOD, grad: [0, 22, 0.65, 1.05] });
          strut(b, [xc - s * 4.9, 22, z], [xc + s * 4.9, 30, z], 0.6, 0.8, [0, 0, 1], OAK, S_WOOD);
          b.add(cyl(0.35, 0.35, 1.5, 6), { p: [xc + s * 4.9, 30.2, z], r: [0, 0, Math.PI / 2], c: IRON, surf: S_IRON }); }
        for (let i = 0; i < n; i++) {
          const z = z0 + 3.2 + i * 3.2;
          b.add(box(9.2, 1.1, 0.5), { p: [xc, 4.3, z - 1.5], c: '#7c5c38', surf: S_WOOD });                                 // the slot's batten, felt-topped
          b.add(box(9.0, 0.25, 0.6), { p: [xc, 4.95, z - 1.5], c: '#6e2f28', surf: S_CLOTH });
          if (rr.chance(0.86)) stockPanels.push([xc + rr.range(-0.5, 0.5), 15.9, z, rr.range(0.03, 0.08) * (rr.chance(0.5) ? 1 : -1), rr.range(-0.03, 0.03)]);
        }
      };
      for (const s of [-1, 1]) {
        const xc = s * 25.4; rack(xc, s, 105, 29);
        // a chamois left over the rim of one panel, a paper label wired to another
        const pz = 108.2 + 3.2 * (s < 0 ? 4 : 9);
        b.add(box(3.4, 0.25, 1.5), { p: [xc - s * 1.2, 27.95, pz], c: '#d8b45a', surf: sf(SID.FABRIC, 0.04, 0, 0, 0.5) }); b.add(box(3.2, 2.2, 0.2), { p: [xc - s * 1.2, 26.8, pz + 0.75], c: '#cfa94e', surf: sf(SID.FABRIC, 0.04, 0, 0, 0.8) });
      }
      await ctx.yield();
      scene.add(new THREE.Mesh(b.build(), matW)); b = INT.makeBuilder();
      await ctx.yield();
      rack(28, 1, -132, 10); rack(50, -1, -132, 10);        // two short racks on the north-east floor, against the windows
      await ctx.yield();
      rack(-60, -1, -34, 12); rack(-34, 1, -92, 9);         // and two out on the open floor west and north of the lens, where the blades and the spectra cross them
      await ctx.yield();
      // wall racks of finished glass either side of the hatch and down the east wall: two tiers of panels standing face out,
      // a shelf of prism bars above them
      const wallRack = (z0) => {
        const len = 32, zc = z0 + len / 2, xb = X1 - 1.5;
        b.add(box(8.4, 2.6, len + 1), { p: [X1 - 4.6, 1.3, zc], c: OAK_D, surf: S_WOOD, grad: [0, 2.6, 0.6, 1] });
        for (const [y, w, x] of [[30.4, 6.4, X1 - 3.8], [56.4, 4.6, X1 - 2.9]]) { b.add(box(w, 0.8, len + 0.6), { p: [x, y, zc], c: OAK, surf: S_WOODG }); b.add(box(0.5, 1.5, len + 0.6), { p: [x - w / 2, y + 0.9, zc], c: OAK_D, surf: S_WOOD }); }
        for (let k = 0; k <= 4; k++) { const z = z0 + k * 8;
          b.add(box(1.0, 62, 1.0), { p: [xb, 31, z], c: OAK_D, surf: S_WOOD, grad: [0, 62, 0.6, 1.05] }); b.add(box(0.9, 30.4, 0.9), { p: [X1 - 7.6, 15.2, z], c: OAK_D, surf: S_WOOD, grad: [0, 30, 0.6, 1.05] });
          strut(b, [X1 - 7.4, 30.6, z], [xb, 40, z], 0.5, 0.7, [0, 0, 1], OAK, S_WOOD); b.add(cyl(0.3, 0.3, 1.4, 6), { p: [X1 - 7.6, 30.6, z], r: [Math.PI / 2, 0, 0], c: IRON, surf: S_IRON }); }
        b.add(box(1.0, 1.0, len), { p: [xb, 61.6, zc], c: OAK, surf: S_WOOD });
        for (let i = 0; i < 4; i++) { const z = z0 + 4 + i * 8;
          if (rr.chance(0.9)) stockPanels.push([X1 - 5.3, 15.0, z, -0.085, -Math.PI / 2 + rr.range(-0.02, 0.02), 0]);
          if (rr.chance(0.8)) stockPanels.push([X1 - 3.9, 43.2, z, -0.07, -Math.PI / 2 + rr.range(-0.02, 0.02), 0]);
          b.add(box(6.6, 0.3, 0.9), { p: [X1 - 4.4, 2.9, z], c: '#6e2f28', surf: S_CLOTH }); }
        for (let i = 0; i < 5; i++) if (rr.chance(0.8)) prismBars.push([X1 - 3.0 + rr.range(-0.4, 0.4), 57.5, z0 + 3.4 + i * 6.3, Math.PI / 2 + rr.range(-0.1, 0.1), 0]);
      };
      wallRack(-96); await ctx.yield(); wallRack(78);
      await ctx.yield();
      scene.add(new THREE.Mesh(b.build(), matW));
    }
    await ctx.yield();

    // ------------------------------------------------------------------ benches, laps, belts, line shafts (west of the aisle)
    const stations = [];
    for (const z of [84, 110, 136, 162, 188]) stations.push([-42, z, -53]);
    for (const z of [97, 123, 149, 175]) stations.push([-64, z, -53]);
    for (const z of [-112, -86, 20, 46, 72, 124, 150]) stations.push([-88, z, -102]);
    for (const z of [-100, 8, 60, 112]) stations.push([-116, z, -102]);
    const wallWheels = [-96, -52, 30, 82, 134, 186];
    {
      let b = INT.makeBuilder(); const br = rng.fork('bench');
      const bench = (x, z0, z1) => {
        const len = z1 - z0, zc = (z0 + z1) / 2;
        b.add(box(10.4, 1.5, len), { p: [x, 21.25, zc], c: OAK, surf: S_WOODG });
        for (const s of [-1, 1]) b.add(box(0.6, 3.2, len - 1), { p: [x + s * 4.7, 19, zc], c: OAK_D, surf: S_WOOD });
        b.add(box(8.4, 0.6, len - 2), { p: [x, 7.5, zc], c: OAK_D, surf: S_WOOD, grad: [0, 8, 0.6, 0.85] });
        const n = Math.max(2, Math.round(len / 15));
        for (let k = 0; k <= n; k++) { const z = z0 + 1.2 + (len - 2.4) * k / n;
          for (const s of [-1, 1]) b.add(box(1.5, 20.5, 1.5), { p: [x + s * 4.1, 10.25, z], c: OAK_D, surf: S_WOOD, grad: [0, 20, 0.5, 1] });
          b.add(box(7.2, 1.2, 1.0), { p: [x, 3.6, z], c: OAK_D, surf: S_WOOD }); }
        const m = Math.round(len / 5.5 * dens);
        for (let k = 0; k < m; k++) {        // clutter: rouge pots, tins, pitch blocks, a board of prism blanks
          const z = z0 + 2 + br() * (len - 4), dx = br.range(-3.6, 3.6), t = br();
          if (stations.some((st) => st[0] === x && Math.abs(st[1] - z) < 7.5)) continue;
          if (t < 0.3) { b.add(cyl(0.9, 0.75, 1.6, 9), { p: [x + dx, 22.8, z], c: '#7a2a20', surf: sf(SID.PLAIN, 0.5) }); b.add(cyl(0.72, 0.72, 0.1, 9), { p: [x + dx, 23.62, z], c: '#b0281c', surf: sf(SID.PLAIN, 0.7) }); }
          else if (t < 0.55) b.add(cyl(0.6, 0.6, br.range(1.2, 2.6), 8), { p: [x + dx, 22.9, z], c: br.chance(0.5) ? '#8f9496' : BRASS, surf: br.chance(0.5) ? S_IRON : S_BRASS });
          else if (t < 0.8) b.add(box(br.range(2, 4), 0.9, br.range(1.4, 2.4)), { p: [x + dx, 22.45, z], r: [0, br.range(0, 3), 0], c: '#2a2420', surf: S_PAINT });
          else prismBars.push([x + dx * 0.6, 22.7, z, br.range(0, 3.1), 0]);
        }
      };
      bench(-42, 72, 200); await ctx.yield(); bench(-64, 72, 200);
      for (const x of [-88, -116]) { await ctx.yield(); bench(x, -128, -74); bench(x, -52, 200); }
      await ctx.yield(); bench(-147, -124, 204);
      await ctx.yield(); bench(-52, -100, -70);        // the inspection bench out on the floor north-west of the lens, two lamps burning on it
      lampAt(b, -55, 22.0, -92, -52); lampAt(b, -49.2, 22.0, -77, -52);
      for (const z of [-96, -86.5, -82, -73.5]) prismBars.push([-52 + br.range(-2.5, 2.5), 22.7, z, br.range(0, 3.1), 0]);
      await ctx.yield();
      scene.add(new THREE.Mesh(b.build(), matW)); b = INT.makeBuilder();
      await ctx.yield();
      for (const [x, z, sx] of stations) {
        await ctx.yield();
        const d = Math.sign(sx - x), px = x + d * 3.6;
        b.add(cyl(5.0, 4.6, 0.9, 20), { p: [x - d * 0.4, 22.45, z], c: '#2e3234', surf: S_IRON });                          // splash pan
        b.add(new THREE.TorusGeometry(4.95, 0.22, 5, 24).rotateX(Math.PI / 2), { p: [x - d * 0.4, 23.0, z], c: IRON_L, surf: S_IRON });
        b.add(cyl(0.9, 1.2, 2.0, 10), { p: [x - d * 0.4, 23.6, z], c: IRON, surf: S_IRON });
        for (const s of [-1, 1]) strut(b, [px, 22, z + s * 1.5], [px, 28.0, z + s * 0.9], 0.5, 0.7, [1, 0, 0], IRON, S_IRON);       // countershaft frame
        b.add(cyl(0.22, 0.22, 3.2, 6), { p: [px, 27.6, z], r: [Math.PI / 2, 0, 0], c: '#8f9496', surf: sf(0, 0.7, 0.8) });
        strut(b, [px - 1.45, 27.6, z], [sx - 2.7, 95, z], 1.3, 0.2, [0, 0, 1], LEATHER, sf(SID.BELT, 0.25, 0, 1));                // the belt's two runs
        strut(b, [px + 1.45, 27.6, z], [sx + 2.7, 95, z], 1.3, 0.2, [0, 0, 1], LEATHER, sf(SID.BELT, 0.25, 0, 0));
        // grinding post with a prism cemented on, and the drip can on its stand
        const gz = z + 7.2;
        b.add(cyl(0.45, 0.6, 5.2, 8), { p: [x, 24.6, gz], c: IRON, surf: S_IRON }); b.add(cyl(1.0, 0.5, 0.8, 8), { p: [x, 27.4, gz], c: '#2a2420', surf: S_PAINT });
        prismBars.push([x, 28.4, gz, br.range(-0.5, 0.5), 0.2]);
        strut(b, [x - d * 4.4, 22, z - 2.5], [x - d * 3.2, 31, z - 1.6], 0.22, 0.22, [0, 0, 1], BRASS, S_BRASS); strut(b, [x - d * 3.2, 31, z - 1.6], [x - d * 1.2, 31.4, z - 0.4], 0.22, 0.22, [0, 1, 0], BRASS, S_BRASS);
        b.add(cyl(0.95, 0.8, 1.9, 10), { p: [x - d * 1.2, 30.3, z - 0.4], c: '#9aa3a6', surf: sf(0, 0.6, 0.7) });
        drips.push(x - d * 1.2, 29.2, z - 0.4, 3.6);
        lampAt(b, x - d * 3.9, 22.0, z + 5.4, x);
      }
      for (const z of wallWheels) { lampAt(b, -149.6, 22.0, z + 8, -147); b.add(box(1.2, 5.5, 5.2), { p: [-147, 24.7, z], c: IRON, surf: S_IRON }); strut(b, [-145.2, 27.5, z], [-138.6, 95, z], 1.2, 0.2, [0, 0, 1], LEATHER, sf(SID.BELT, 0.25, 0, 1)); }
      // three line shafts at y 95 with hangers from every truss
      for (const sx of [-53, -102, -137]) {
        b.add(cyl(0.62, 0.62, 366, 8), { p: [sx, 95, 38], r: [Math.PI / 2, 0, 0], c: '#7d8386', surf: sf(0, 0.7, 0.85) });
        for (let k = -5; k <= 7; k++) { const z = 3 + 30 * k; for (const s of [-1, 1]) strut(b, [sx + s * 1.6, 110, z], [sx + s * 0.5, 96, z], 0.4, 0.6, [0, 0, 1], IRON, S_IRON); b.add(box(2.4, 1.8, 1.6), { p: [sx, 95, z], c: IRON, surf: S_IRON }); }
      }
      await ctx.yield();
      scene.add(new THREE.Mesh(b.build(), matW));
    }
    await ctx.yield();
    {
      // pulleys on the shafts and countershafts, flywheels by the west wall: one instanced, self-turning draw
      const pg = wheelGeometry({ teeth: 0, spokes: 6, thick: 0.34, color: '#4b5154', surf: S_IRON, rim: 0.12 });
      const list = [];
      for (const [x, z, sx] of stations) { const d = Math.sign(sx - x); list.push([sx, 95, z, 2.7, 1.25], [x + d * 3.6, 27.6, z, 1.45, 2.33]); }
      for (const z of wallWheels) list.push([-137, 95, z, 2.7, 1.25], [-146, 27.5, z, 3.3, 1.02]);
      for (const sx of [-53, -102, -137]) for (const z of [-132, 214]) list.push([sx, 95, z, 3.4, 1.25]);
      const pm = new THREE.InstancedMesh(pg, matSpin, list.length), sp = [];
      list.forEach(([x, y, z, r, w], i) => { place(pm, i, [x, y, z], [Math.PI / 2, 0, 0], [r, 2.2, r]); sp.push(w, i * 0.7); });
      pg.setAttribute('aSpin', new THREE.InstancedBufferAttribute(new Float32Array(sp), 2)); pm.computeBoundingSphere(); scene.add(pm);
      // the laps: iron discs red with wet rouge (the streaks turn in the shader)
      const lb = INT.makeBuilder();
      lb.add(cyl(1, 1, 0.09, 28), { c: '#3a3d3e', surf: sf(SID.LAP, 0.5, 0.6) }); lb.add(cyl(0.16, 0.2, 0.3, 8), { p: [0, 0.14, 0], c: BRASS, surf: S_BRASS });
      const lg = lb.build(), lm = new THREE.InstancedMesh(lg, matO, stations.length);
      stations.forEach(([x, z, sx], i) => place(lm, i, [x - Math.sign(sx - x) * 0.4, 24.75, z], [0, i * 1.1, 0], [4.2, 4.2, 4.2]));
      lm.computeBoundingSphere(); scene.add(lm);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ props: crates and straw, the foreman's desk, aprons, crane, cradle, drawing office
    const CAT = [52, 41.2, 100], STOOL = [-31.5, 0, 87], HOOK = [50, 51.5, 62], CUP = [45, 20.3, 44.5], DESK_LAMP = [71.1, 26.6, 50];
    {
      const b = INT.makeBuilder(), pr = rng.fork('props');
      const crate = (x, y0, z, w, h, d, ry) => {
        const pre = new THREE.Matrix4().makeRotationY(ry).setPosition(x, y0, z), add = (g, o) => b.add(g, { ...o, pre });
        add(box(w, h, d), { p: [0, h / 2, 0], c: PINE, surf: S_WOOD, grad: [y0, y0 + h, 0.72, 1.05] });
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(1.0, h + 0.3, 1.0), { p: [sx * (w / 2 - 0.3), h / 2, sz * (d / 2 - 0.3)], c: '#8c6a3e', surf: S_WOOD });
        for (const yy of [0.6, h - 0.6]) { for (const sz of [-1, 1]) add(box(w + 0.5, 1.1, 0.5), { p: [0, yy, sz * (d / 2 + 0.1)], c: '#8c6a3e', surf: S_WOOD }); for (const sx of [-1, 1]) add(box(0.5, 1.1, d + 0.5), { p: [sx * (w / 2 + 0.1), yy, 0], c: '#8c6a3e', surf: S_WOOD }); }
        for (const sz of [-1, 1]) { const m = new THREE.Matrix4().makeRotationZ(Math.atan2(h - 2, w - 2) * sz).setPosition(0, h / 2, sz * (d / 2 + 0.12)); add(box(Math.hypot(w - 2, h - 2), 0.9, 0.4), { m, c: '#94703f', surf: S_WOOD }); }
        const nb = Math.round(w / 2.2); for (let i = 0; i < nb; i++) add(box(w / nb - 0.25, 0.4, d + 0.3), { p: [-w / 2 + (i + 0.5) * w / nb, h + 0.1, 0], c: i % 2 ? '#b8935a' : '#a8834e', surf: S_WOOD });
        add(box(3.4, 2.2, 0.1), { p: [w * 0.18, h * 0.62, d / 2 + 0.36], c: '#2a2622', surf: S_PAINT });       // a stencilled mark
      };
      const straw = (x, y, z, r, n, flat = 0.35) => {
        b.add(new THREE.SphereGeometry(r, 10, 6), { p: [x, y, z], s: [1, flat, 1], c: STRAW, surf: sf(SID.FABRIC, 0.05, 0, 0, 0.12), grad: [y - r * flat, y + r * flat, 0.6, 1.1] });
        for (let i = 0; i < n; i++) { const a = pr() * TAU, q = Math.sqrt(pr()) * r * 1.25; b.add(box(0.14, pr.range(2.2, 5), 0.14), { p: [x + Math.cos(a) * q, y + pr.range(0, r * flat), z + Math.sin(a) * q], r: [pr.range(0.9, 1.6), a, pr.range(-0.5, 0.5)], c: pr.chance(0.5) ? '#d9bd6c' : '#b8964a', surf: sf(SID.FABRIC, 0.05, 0, 0, 0.5) }); }
      };
      crate(52, 0, 100, 15, 16, 13, 0.08); crate(51.7, 16.4, 100.3, 13, 14.4, 11.6, -0.14); crate(52.2, 31.2, 99.8, 11.5, 9.6, 10.4, 0.22);      // the sleeper's stack, level with our eye as we swing out of the aisle
      await ctx.yield();
      straw(CAT[0], CAT[1] - 0.1, CAT[2], 6.2, Math.round(46 * dens), 0.16); straw(44.5, 0.4, 92, 5, Math.round(40 * dens)); straw(59, 0.4, 109, 4, 24);
      for (const [x, z, w, h, d] of [[36, 134, 16, 15, 12], [58, 152, 14, 18, 14], [44, 176, 18, 13, 13], [70, 126, 12, 12, 12], [-10, 221, 14, 12, 9], [8, -118, 15, 14, 12], [-22, -128, 13, 17, 13], [-54, -120, 16, 12, 12]]) { await ctx.yield(); crate(x, 0, z, w, h, d, pr.range(-0.4, 0.4)); if (pr.chance(0.7)) straw(x + w * 0.6, 0.4, z + 3, 4, 22); }
      await ctx.yield();
      crate(57.4, 18.4, 152.4, 10, 10, 10, 0.5);
      await ctx.yield();
      // the foreman's desk by the east wall: cup, rolled drawings, ledger, an unlit lamp
      b.add(INT.tableGeometry({ rng: pr.fork('desk'), scale: 25, width: 1.5, depth: 0.72, height: 0.8, legs: 'square', drawers: true, color: '#5a3a22' }), { p: [60, 0, 48] });
      b.add(INT.cupGeometry({ rng: pr.fork('cup'), scale: 25, color: '#e6dfcf', tea: true }), { p: [CUP[0], 20.05, CUP[2]] });
      b.add(INT.lampGeometry({ rng: pr.fork('lamp'), scale: 22, kind: 'desk', color: BRASS, shadeColor: '#2f6a58', glow: 0.4 }), { p: [72, 20.05, 51], r: [0, -2.4, 0] });
      for (let i = 0; i < 5; i++) { const z = 42.5 + i * 2.6 + pr.range(-0.4, 0.4); b.add(cyl(0.95, 0.95, pr.range(11, 15), 10), { p: [60 + pr.range(-1, 1), 21.0 + (i === 2 ? 1.7 : 0), z - (i === 2 ? 1.3 : 0)], r: [0, pr.range(-0.12, 0.12), Math.PI / 2], c: i % 2 ? '#d9cfb4' : '#c9c2ae', surf: S_CLOTH }); }
      b.add(box(9, 0.9, 12), { p: [50, 20.5, 51], r: [0, 0.2, 0], c: '#4a2a22', surf: S_CLOTH }); b.add(box(8.4, 0.25, 11.2), { p: [50, 21.05, 51], r: [0, 0.2, 0], c: '#d8d0ba', surf: S_CLOTH });
      b.add(cyl(1.0, 1.2, 2.2, 8), { p: [44.5, 21.1, 53], c: '#1c2230', surf: sf(SID.PLAIN, 0.8) });
      await ctx.yield();
      // leather aprons on a row of hooks along the east wall
      b.add(box(0.8, 1.2, 52), { p: [X1 - 0.6, 46.6, 150], c: OAK_D, surf: S_WOOD });
      for (let i = 0; i < 5; i++) {
        const z = 130 + i * 10 + pr.range(-1, 1), g = new THREE.PlaneGeometry(10.5, 25, 4, 10), pa = g.attributes.position;
        for (let v = 0; v < pa.count; v++) { const y = pa.getY(v), k = y > 4 ? 0.52 : 1; pa.setX(v, pa.getX(v) * k * (1 - 0.06 * Math.sin(y * 0.4 + i))); pa.setZ(v, 0.5 * Math.sin(pa.getX(v) * 0.7 + i) * (0.4 + (12.5 - y) / 25)); }
        g.computeVertexNormals();
        b.add(g, { p: [X1 - 1.6, 33.2, z], r: [0, -Math.PI / 2, 0], c: i % 2 ? '#6b4428' : '#7d6a4c', surf: sf(SID.FABRIC, 0.14), sway: [20.5, 46, 0.75, 0], grad: [20, 46, 0.8, 1.05] });
        b.add(new THREE.TorusGeometry(1.7, 0.16, 5, 12), { p: [X1 - 1.4, 46.6, z], r: [0, Math.PI / 2, 0], c: '#3a2416', surf: S_CLOTH }); b.add(cyl(0.2, 0.2, 1.6, 6), { p: [X1 - 1.2, 47.4, z], r: [0, 0, Math.PI / 2], c: BRASS, surf: S_BRASS });
      }
      await ctx.yield();
      // the hand crane: mast, jib, tie, winch
      b.add(cyl(1.2, 1.7, 46, 10), { p: [62, 23, 66], c: IRON, surf: S_IRON, grad: [0, 46, 0.65, 1.05] }); b.add(cyl(2.6, 3.2, 2.4, 10), { p: [62, 1.2, 66], c: '#2a2d2f', surf: S_IRON });
      strut(b, [62, 40, 66], [HOOK[0], HOOK[1] + 0.8, HOOK[2]], 1.0, 1.5, [0, 1, 0], IRON, S_IRON); strut(b, [62, 46, 66], [HOOK[0], HOOK[1] + 1.4, HOOK[2]], 0.3, 0.3, [0, 1, 0], '#6a6f72', sf(0, 0.6, 0.8));
      strut(b, [62, 26, 66], [56, 38.6, 63.6], 0.6, 0.8, [0, 1, 0], IRON, S_IRON);
      b.add(wheelGeometry({ teeth: 24, thick: 0.3 }), { p: [63.6, 14, 66], r: [0, 0, Math.PI / 2], s: 3.2 }); b.add(cyl(1.3, 1.3, 3.2, 12), { p: [62, 14, 67.9], r: [Math.PI / 2, 0, 0], c: '#7a6a4a', surf: S_CLOTH });
      // the wheeled cradle below the empty bay's way out, on its rails, with the two panels still to be fitted
      const CX = 46, CZ = HZ + TSH * (80 - CX);
      for (const s of [-1, 1]) { b.add(box(32, 0.5, 0.7), { p: [CX - 1, 0.25, CZ + s * 5.2], c: '#5a5f62', surf: sf(0, 0.6, 0.8) }); b.add(box(21, 1.3, 1.1), { p: [CX, 5.1, CZ + s * 5.2], c: IRON, surf: S_IRON });
        for (const dx of [-7.5, 7.5]) b.add(wheelGeometry({ teeth: 0, spokes: 5, thick: 0.4, color: '#40464a', surf: S_IRON }), { p: [CX + dx, 3.1, CZ + s * 5.2], r: [Math.PI / 2, 0, 0], s: 2.9 }); }
      for (const dx of [-9.5, 0, 9.5]) b.add(box(1.1, 1.1, 11), { p: [CX + dx, 5.1, CZ], c: IRON, surf: S_IRON });
      b.add(box(25, 0.7, 9.6), { p: [CX, 5.95, CZ], c: '#7c5c38', surf: S_WOOD });
      for (const dx of [-8.5, 8.5]) for (const dz of [-3.4, 3.4]) strut(b, [CX + dx, 6, CZ + dz], [CX + dx, 13.6, CZ], 0.8, 1.0, [1, 0, 0], OAK, S_WOOD);
      b.add(box(18.4, 0.9, 0.9), { p: [CX, 13.6, CZ], c: OAK, surf: S_WOOD }); for (const dx of [-11.6, 11.6]) b.add(box(0.6, 1.2, 8.6), { p: [CX + dx, 6.8, CZ], c: '#6e2f28', surf: S_CLOTH });
      stockPanels.push([CX, 9.5, CZ - 1.25, 0.3, 0, Math.PI / 2], [CX, 9.5, CZ + 1.25, -0.3, 0, Math.PI / 2]);
      await ctx.yield();
      // the drawing office: a glazed timber box on a gallery in the north-west corner, pelargoniums on its sill
      const GX = X0 + 27, GZ = Z0 + 24, paneC = look.jet ? '#ffd296' : '#7c8a90', paneS = sf(SID.PLAIN, 0.8, 0, look.jet ? 0.9 : 0.1);
      b.add(box(54, 2.2, 48), { p: [GX, 59, GZ], c: OAK_D, surf: S_WOOD });
      for (const [x, z] of [[GX + 25, GZ + 22], [GX + 25, GZ - 2], [GX - 2, GZ + 22]]) b.add(cyl(1.1, 1.4, 58, 10), { p: [x, 29, z], c: '#3d4a48', surf: S_IRON, grad: [0, 30, 0.6, 1] });
      b.add(box(44, 24, 1.0), { p: [GX - 3, 72, GZ + 16], c: '#6a4c30', surf: S_WOOD }); b.add(box(1.0, 24, 36), { p: [GX + 19, 72, GZ - 2], c: '#6a4c30', surf: S_WOOD }); b.add(box(46, 1.4, 38), { p: [GX - 3, 84.6, GZ - 2], c: OAK_D, surf: S_WOOD });
      for (let i = 0; i < 6; i++) { b.add(box(5.6, 13, 0.4), { p: [GX - 21 + i * 7.1, 73.5, GZ + 16.6], c: paneC, surf: paneS }); b.add(box(0.5, 13.4, 0.9), { p: [GX - 24.5 + i * 7.1, 73.5, GZ + 16.7], c: '#e6dfcf', surf: S_PAINT }); }
      for (let i = 0; i < 5; i++) b.add(box(0.4, 13, 5.4), { p: [GX + 19.6, 73.5, GZ - 16 + i * 6.8], c: paneC, surf: paneS });
      b.add(box(6, 0.4, 13), { p: [GX - 21 + 5 * 7.1, 77, GZ + 19.5], r: [0.9, 0, 0], c: paneC, surf: paneS });                  // the propped pane
      b.add(box(46, 0.8, 3.6), { p: [GX - 3, 66.2, GZ + 18.4], c: '#e6dfcf', surf: S_PAINT });
      for (let i = 0; i < 6; i++) { await ctx.yield(); b.add(i === 4 ? INT.plantGeometry({ rng: pr.fork('fern'), scale: 16, kind: 'fern' }) : INT.vaseGeometry({ rng: pr.fork('pel' + i), scale: 17, color: '#a4553a', height: 0.24, flowers: 11, flowerColors: ['#c8281e', '#d8402c', '#b01c1c'] }), { p: [GX - 22 + i * 7.4, 66.6, GZ + 18.6] }); }
      await ctx.yield();
      for (let i = 0; i <= 13; i++) { b.add(box(0.5, 6, 0.5), { p: [GX - 26 + i * 4, 63, GZ + 23.4], c: IRON, surf: S_IRON }); if (i < 12) b.add(box(0.5, 6, 0.5), { p: [GX + 26.4, 63, GZ + 23.4 - i * 4], c: IRON, surf: S_IRON }); }
      b.add(box(53, 0.5, 0.6), { p: [GX, 66, GZ + 23.4], c: BRASS, surf: S_BRASS }); b.add(box(0.6, 0.5, 47), { p: [GX + 26.4, 66, GZ], c: BRASS, surf: S_BRASS });
      for (const s of [-1, 1]) strut(b, [GX + 30, 0, GZ + 8 + s * 2.4], [GX + 27, 60, GZ + 8 + s * 2.4], 0.5, 0.7, [0, 0, 1], OAK, S_WOOD);
      for (let i = 1; i < 20; i++) b.add(box(0.4, 0.4, 4.8), { p: [GX + 30 - i * 0.15, i * 3, GZ + 8], c: OAK, surf: S_WOOD });
      // gas brackets along the long walls (lit only at dusk)
      for (let k = 0; k < 6; k++) for (const [x, z, s] of [[X0, -135 + 60 * k, 1], [X1, -120.5 + 61 * k, -1]]) { if (x > 0 && Math.abs(z - HZ) < 30) continue; strut(b, [x + s * 0.4, 33, z], [x + s * 3.6, 34.5, z], 0.3, 0.3, [0, 1, 0], BRASS, S_BRASS); b.add(cyl(0.5, 0.3, 1.2, 8), { p: [x + s * 3.6, 35.2, z], c: BRASS, surf: S_BRASS }); }
      await ctx.yield();
      scene.add(new THREE.Mesh(b.build(), matW2));
    }
    await ctx.yield();

    // ------------------------------------------------------------------ glass in stock: panels on edge, prism bars on the benches
    {
      const pg = panelGeometry(5), pm = new THREE.InstancedMesh(pg, stock, stockPanels.length);
      stockPanels.forEach(([x, y, z, rx, ry, rz = 0], i) => place(pm, i, [x, y, z], [rx, ry, rz]));
      pm.computeBoundingSphere(); scene.add(pm);
      const bar = box(5.4, 1.25, 1.35); bar.setAttribute('aK', new THREE.BufferAttribute(new Float32Array(bar.attributes.position.count), 1));
      const bm = new THREE.InstancedMesh(bar, stock, prismBars.length);
      prismBars.forEach(([x, y, z, ry, rz], i) => place(bm, i, [x, y, z], [0, ry, rz]));
      bm.computeBoundingSphere(); scene.add(bm);
    }
    await ctx.yield();
    // ------------------------------------------------------------------ the sleeper on the crates (cat or terrier), the rocking stool, the crane hook
    const sleeper = new THREE.Group(), tailTip = new THREE.Group();
    {
      const b = INT.makeBuilder(), fur = terrier ? '#84704f' : '#676b73', dark = terrier ? '#6b593e' : '#34373d', S_FUR = sf(SID.FABRIC, 0.06);
      const coat = (x, y, z, c, lx, ly, lz) => { const st = terrier ? (Math.sin(lx * 1.3 + lz * 0.9) > 0.55 ? 1 : 0) : (Math.sin(lz * 2.4 + Math.sin(lx * 1.1) * 1.2) > 0.25 ? 0.75 : 0); c.lerp(_c.set(dark), st * (ly > -0.5 ? 1 : 0.3)); };
      const _c = new THREE.Color();
      // curled with its head toward the aisle: a low back, the head lifted on the paws so the ears stand clear of the body's
      // outline, and the tail wrapped round the front (the cat's; the terrier keeps his by his flank)
      b.add(new THREE.SphereGeometry(1, 22, 14), { p: [0.2, 1.95, -0.6], s: [3.4, 2.05, 4.9], c: fur, surf: S_FUR, tint: coat, grad: [0, 3.2, 0.55, 1.08] });
      b.add(new THREE.SphereGeometry(1, 14, 10), { p: [0.7, 2.0, -3.6], s: [3.1, 2.25, 2.8], c: fur, surf: S_FUR, tint: coat, grad: [0, 3.2, 0.55, 1.08] });      // haunch
      b.add(new THREE.SphereGeometry(1, 12, 8), { p: [-0.5, 2.3, 2.9], s: [2.5, 2.0, 2.0], c: fur, surf: S_FUR, tint: coat, grad: [0, 3.2, 0.6, 1.08] });       // shoulders
      b.add(new THREE.SphereGeometry(1, 16, 12), { p: [-0.7, 3.0, 4.6], s: [2.15, 1.85, 2.0], c: fur, surf: S_FUR, grad: [1, 5, 0.7, 1.1] });                   // head
      for (const s of [-1, 1]) {
        if (terrier) { b.add(new THREE.ConeGeometry(0.95, 1.3, 6), { p: [-0.7 + s * 1.75, 4.2, 4.3], r: [0.2, 0, -s * 1.0], s: [1, 1, 0.5], c: '#665338', surf: S_FUR }); }
        else { b.add(new THREE.ConeGeometry(0.95, 2.5, 6), { p: [-0.7 + s * 1.2, 5.45, 4.35], r: [0.1, 0, -s * 0.22], s: [1, 1, 0.5], c: fur, surf: S_FUR });
          b.add(new THREE.ConeGeometry(0.55, 1.6, 5), { p: [-0.7 + s * 1.2, 5.2, 4.62], r: [0.1, 0, -s * 0.22], s: [1, 1, 0.3], c: '#b98a84', surf: S_FUR }); }
        b.add(new THREE.SphereGeometry(0.8, 8, 6), { p: [s * 1.5 - 0.7, 0.6, 5.9], s: [1, 0.6, 1.6], c: fur, surf: S_FUR });                 // paws
      }
      await ctx.yield();
      if (terrier) b.add(new THREE.SphereGeometry(1, 10, 7), { p: [-0.5, 2.0, 6.1], s: [1.0, 0.8, 1.25], c: '#7a6748', surf: S_FUR, tint: coat });      // the snout, tucked down on the paws
      const TIP = terrier ? [3.7, 0.9, 2.6] : [0.9, 0.9, 7.1];
      const tail = new THREE.CatmullRomCurve3((terrier ? [[0.6, 1.6, -5.8], [2.9, 1.0, -5.3], [4.2, 0.9, -3.0], [4.3, 0.9, 0.2], TIP]
        : [[0.6, 1.5, -5.9], [3.3, 1.0, -5.0], [4.5, 0.9, -1.4], [4.4, 0.9, 2.6], [3.3, 0.9, 5.7], TIP]).map((p) => new THREE.Vector3(...p)));
      b.add(new THREE.TubeGeometry(tail, 18, terrier ? 0.42 : 0.55, 7, false), { c: fur, surf: S_FUR, tint: coat });
      const body = new THREE.Mesh(b.build(), matO); sleeper.add(body); sleeper.userData.body = body;
      const t = INT.makeBuilder();
      t.add(new THREE.CylinderGeometry(0.3, 0.55, 2.8, 7), { p: [0, 0, 1.4], r: [Math.PI / 2, 0, 0], c: terrier ? fur : dark, surf: S_FUR }); t.add(new THREE.SphereGeometry(0.36, 7, 5), { p: [0, 0, 2.8], c: terrier ? fur : dark, surf: S_FUR });
      tailTip.add(new THREE.Mesh(t.build(), matO)); tailTip.position.set(TIP[0], TIP[1], TIP[2]); sleeper.userData.tail = terrier ? -0.3 : -1.75; tailTip.rotation.y = sleeper.userData.tail;
      sleeper.add(tailTip); sleeper.position.set(CAT[0], CAT[1], CAT[2]); sleeper.rotation.y = -0.95; scene.add(sleeper);
    }
    await ctx.yield();
    const stool = new THREE.Mesh(INT.chairGeometry({ rng: rng.fork('stool'), scale: 25, style: 'stool', color: '#6a4a2c', seatColor: '#5a3a24' }), matO);
    stool.position.set(STOOL[0], STOOL[1], STOOL[2]); scene.add(stool);
    await ctx.yield();
    const hook = new THREE.Group();
    {
      const b = INT.makeBuilder();
      b.add(cyl(0.16, 0.16, 15, 6), { p: [0, -7.5, 0], c: '#b8a880', surf: S_CLOTH }); b.add(cyl(1.0, 1.0, 1.4, 12), { p: [0, -15.6, 0], r: [Math.PI / 2, 0, 0], c: IRON, surf: S_IRON });
      b.add(box(0.5, 2.6, 1.8), { p: [0, -16.4, 0], c: IRON_L, surf: S_IRON });
      b.add(new THREE.TorusGeometry(1.25, 0.3, 6, 14, Math.PI * 1.45), { p: [0, -19.0, 0], r: [0, 0, -2.2], c: '#2a2d2f', surf: S_IRON });
      hook.add(new THREE.Mesh(b.build(), matO)); hook.position.set(HOOK[0], HOOK[1], HOOK[2]); scene.add(hook);
    }
    await ctx.yield();

    // ------------------------------------------------------------------ steam off the cup, gas jets, drips, dust
    const time = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    set.add(fx.makeSmokeColumn({ rng: rng.fork('steam'), time, position: [CUP[0], CUP[1] + 1.6, CUP[2]], height: 10, radius: [0.25, 1.2], size: [0.7, 2.4], count: 26, color: '#d6dadb', colorTop: '#c2c8ca', shadowColor: '#6e7478',
      ambient: '#3a3d40', opacity: 0.13, rate: 0.12, wind: [0.25, 0, 0.12], bend: 0.3, sunDir: [0.1, 1, 0.1], sunColor: look.top }));
    await ctx.yield();
    const jets = fx.makeGlows({ rng: rng.fork('jets'), time, positions: Array.from({ length: 12 }, (_, i) => (i < 6 ? [X0 + 3.6, 36.6, -135 + 60 * i] : [X1 - 3.6, i === 8 ? -60 : 36.6, -120.5 + 61 * (i - 6)])),
      color: '#ffc27a', size: 7, intensity: look.jet ? 2.4 : 0, flicker: 0.5, halo: 1 });
    jets.object.visible = !!look.jet; set.add(jets);
    await ctx.yield();
    // the workers' lamps: a small warm glow on every flame and a pool of light on the bench (or desk) under it
    lamps.push([DESK_LAMP[0], DESK_LAMP[1], DESK_LAMP[2], 66, 20.14]);
    set.add(fx.makeGlows({ rng: rng.fork('lamps'), time, positions: lamps.map((l) => [l[0], l[1], l[2]]).concat([[X1 + LAN[0], HY + LAN[1], HZ - LAN[2]], [X1 + LAN[0], HY + LAN[1], HZ + LAN[2]], tunAt(LAN2[0], -LAN2[2], HY + LAN2[1]), tunAt(LAN2[0], LAN2[2], HY + LAN2[1])]), color: '#ffb866', size: 5.5, intensity: 1.5 * look.lamp, flicker: 0.3, halo: 1 }));
    await ctx.yield();
    {
      const pg = new THREE.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
      const pm = new THREE.InstancedMesh(pg, new THREE.ShaderMaterial({ uniforms: { ...U, uLamp: { value: 0.3 * look.lamp } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        vertexShader: LT.GLSL_UNI + /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
        fragmentShader: LT.GLSL_UNI + /* glsl */`uniform float uLamp; varying vec2 vUv; varying vec3 vW; void main(){ float a = max(1.0 - length(vUv - 0.5) * 2.0, 0.0); a = a * a * (0.5 + 0.5 * a);
          gl_FragColor = vec4(uJetCol * uLamp * a * (0.94 + 0.06 * sin(uTime * 9.0 + vW.x * 1.7)) * exp(-distance(vW, cameraPosition) * uFogDen), 1.0); }` }), lamps.length);
      lamps.forEach((l, i) => place(pm, i, [l[3], l[4], l[2]], [0, 0, 0], [10, 1, i === lamps.length - 1 ? 13 : 18]));
      pm.computeBoundingSphere(); pm.renderOrder = 2; scene.add(pm);
    }
    await ctx.yield();
    const size = new THREE.Vector2(), UP = { uPx: { value: 400 } };
    const NDUST = Math.round(6000 * Q * clamp(dens, 0.8, 1.25) * (lookName === 'thick' ? 1.5 : 1));
    {
      const dr = rng.fork('dust'), seed = new Float32Array(NDUST * 4);
      for (let i = 0; i < NDUST * 4; i++) seed[i] = dr();
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NDUST * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
      const m = new THREE.ShaderMaterial({ uniforms: { ...U, ...UP }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: LT.GLSL_UNI + LT.GLSL_FN + /* glsl */`attribute vec4 aSeed; uniform float uPx; varying vec3 vCol;
          void main(){ vec3 B = vec3(150.0, 64.0, 150.0);
            vec3 p = aSeed.xyz * B + vec3(sin(uTime * 0.13 + aSeed.w * 40.0) * 3.0 + uTime * 0.5, uTime * 0.35 * (aSeed.w - 0.35) + sin(uTime * 0.21 + aSeed.x * 30.0), cos(uTime * 0.11 + aSeed.w * 23.0) * 3.0 - uTime * 0.3);
            p = mod(p - cameraPosition + 0.5 * B, B) - 0.5 * B + cameraPosition;
            float r = length(p.xz); vec3 Lf = vec3(0.0, 47.0, 0.0) - p;
            float lit = 0.012 * uTopGain + lwBeam(p) * uBeamGain * 0.6 + (1.0 - smoothstep(22.0, 27.0, r)) * 22.0 / (dot(Lf, Lf) + 60.0) * uFlameGain;
            vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; float d = max(-mv.z, 0.1);
            float px = (0.09 + 0.1 * aSeed.w) * uPx / d; gl_PointSize = clamp(px, 1.5, max(1.5, 0.0062 * uPx));
            float fade = smoothstep(1.5, 7.0, d) * (1.0 - smoothstep(55.0, 74.0, d)) * min(1.0, px / 1.5) * exp(-d * uFogDen);
            vCol = (mix(uTopCol, uBeamCol, clamp(lit * 8.0, 0.0, 1.0)) * min(lit, 0.85) * 0.85 + lwRainbow(p) * 0.55) * fade * (0.6 + 0.8 * fract(aSeed.w * 7.3)); }`,
        fragmentShader: /* glsl */`varying vec3 vCol; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(vCol * (1.0 - smoothstep(0.25, 1.0, d)), 1.0); }` });
      const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 7; scene.add(pts);
      // drips: a bead of water falling from every can onto its lap
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(drips.length / 4 * 3), 3)); dg.setAttribute('aDrip', new THREE.BufferAttribute(new Float32Array(drips), 4));
      dg.boundingSphere = new THREE.Sphere(new THREE.Vector3(-80, 26, 40), 190);
      const dm = new THREE.ShaderMaterial({ uniforms: { ...U, ...UP }, transparent: true, depthWrite: false,
        vertexShader: LT.GLSL_UNI + /* glsl */`attribute vec4 aDrip; uniform float uPx; varying float vA;
          void main(){ float f = fract(uTime * 0.9 + aDrip.x * 0.37 + aDrip.z * 0.11); vec3 p = aDrip.xyz - vec3(0.0, f * f * aDrip.w, 0.0);
            vec4 mv = viewMatrix * vec4(p, 1.0); gl_Position = projectionMatrix * mv; float d = max(-mv.z, 0.1); gl_PointSize = clamp(0.5 * uPx / d, 1.6, 8.0); vA = 1.0 - smoothstep(120.0, 170.0, d); }`,
        fragmentShader: LT.GLSL_UNI + /* glsl */`varying float vA; void main(){ float d = length(gl_PointCoord - 0.5) * 2.0; gl_FragColor = vec4(uRoofCol * uTopGain * 0.9, (1.0 - smoothstep(0.5, 1.0, d)) * vA * 0.9); }` });
      scene.add(new THREE.Points(dg, dm));
    }
    await ctx.yield();

    // ------------------------------------------------------------------ sparrows in the trusses, moths round the chimney
    const birdLight = { sunDir: [0.1, 1, 0.1], sunColor: look.top, sunIntensity: 1.3 * look.topK, sky: look.top, skyIntensity: 0.9 * look.topK, ground: '#7a6856', groundIntensity: 0.95 };
    const birdOpts = swallows ? { species: 'swifts', count: 2, size: 9.5, body: '#1c2436', belly: '#d8cdb8', wingC: '#161c2a', spread: [9, 4, 12] }
      : { species: 'starlings', form: 'loose', lod: 'high', count: 9, size: 9.5, body: '#5e4a36', belly: '#8e7c66', wingC: '#46372a', trail: '#52412f', tip: '#2a211a', head: '#4a3828', flap: 11, amp: 0.85, glide: 0.12, speed: 30, spread: [13, 5, 18], wander: [3, 2, 3, 1.1] };
    const birdsA = F.makeFlock({ rng: rng.fork('birdsA'), ...birdOpts, light: birdLight, cross: { path, u: 0.08, lead: 30, height: 12, offset: 28, angle: 50, side: 1, span: 160, rise: 8, duration: DUR } });
    await ctx.yield();
    // the far crossing's line is set down in the hall's own axes (the kit's crossing asks a path only for a place and a heading):
    // from inside the north wall, well east of the pull-back's line, in a long shallow dive across the hall past the optic's east
    // flank, through its beams, to an end in open air before the hatch. By place no bird's reach (its dealt place, its wander's box, its
    // own ball) comes within 2 m of the lens in the picture or 1 m outside it, nor to the optic, a column, a wall or a truss: the
    // swallows are handed a wander of their own here (the swifts' own is 13.5 m wide) and the kit holds every dealt place of this
    // flock within two scatters of the line (maxSigma)
    const lineB = { length: 1, posAtDist: (d, o) => o.set(28.5, 72.5, -74), tangentAtDist: (d, o) => o.set(0.4277, 0, 0.9039) };
    const birdsB = F.makeFlock({ rng: rng.fork('birdsB'), ...birdOpts, ...(swallows ? { wander: [4.5, 2.5, 4, 0.7] } : null), maxSigma: 2, light: birdLight, cross: { path: lineB, u: R.uFar - 0.015, lead: 0, height: 0, offset: 0, angle: 0, side: 1, span: 123.9, rise: -31, bow: 6, duration: DUR } });
    await ctx.yield();
    const mothLight = { sunDir: [0, -1, 0], sunColor: flameHex, sunIntensity: 2.4, sky: look.top, skyIntensity: 0.8, ground: flameHex, groundIntensity: 1.6 };
    const moth1 = F.makeMoths({ rng: rng.fork('moth1'), positions: [[0, 52.5, 0]], jitter: 0, count: 1, size: 12.5, roam: [4.4, 3.4, 1.15, 0.14], selfLit: 0.3, varieties: [['#c9b998', '#6e5c48'], ['#b8ac98', '#5c4c3c']],  light: mothLight });
    const moth2 = F.makeMoths({ rng: rng.fork('moth2'), positions: [[0, 50, 0]], jitter: 0, count: 1, size: 11.5, roam: [5.2, 2.6, 1.4, 0.16], selfLit: 0.3, varieties: [['#c9b998', '#6e5c48'], ['#b8ac98', '#5c4c3c']],  light: mothLight });
    await ctx.yield();
    // and two more that have found the signal lanterns over the hatch
    const moth3 = F.makeMoths({ rng: rng.fork('moth3'), positions: [[X1 + LAN[0], HY + LAN[1], HZ - LAN[2]], [X1 + LAN[0], HY + LAN[1], HZ + LAN[2]]], jitter: 0, count: 2, size: 7.5, roam: [2.2, 1.6, 1.5, 0.2], selfLit: 0.3, varieties: [['#c9b998', '#6e5c48'], ['#b8ac98', '#5c4c3c']],  light: mothLight });
    scene.add(birdsA.object, birdsB.object, moth1.object, moth2.object, moth3.object);
    await ctx.yield();

    // ------------------------------------------------------------------ the flight
    const plan = flightPlan(R, rare), uWest = R.uFar, fogBase = U.uFogCol.value.clone(), beamBase = U.uBeamCol.value.clone(), beamRare = lin('#FFD88A');
    let lastU = -1, lastT = 0, hold = 0;
    return {
      scene, path, duration: DUR, pace, title: look.title, ride: 'none',
      camera: plan.camera, pois: plan.pois,
      portal: { shape: 'rect', width: 18, height: 18, color: portalHex, glow: 0.8, halo: false },      // no halo: the tunnel's plate and ribs carry its light instead
      post: { exposure: look.exposure, bloom: { strength: 0.42, radius: 0.6, threshold: 0.95 },
        grade: { saturation: look.sat, contrast: 1.05, tint: look.tint, shadowTint: look.shadowTint, vignette: 0.34, grain: 0.03, aberration: 0 } },
      update(dt, t, camera, u = 0) {
        time.value = t; U.uTime.value = t;
        // the lens angle follows u; while u stands still (the world seen through a portal, a held frame) it turns on time, inside one bay
        if (u === lastU) { const d = t - lastT; if (d > 0 && d < 4) hold += omega * d; if (hold < -PITCH) hold += 2 * PITCH; else if (hold > PITCH) hold -= 2 * PITCH; }
        else hold -= Math.sign(hold) * Math.min(Math.abs(hold), Math.abs(u - lastU) * 1.2);
        lastU = u; lastT = t;
        hero.setAngle(lensAngle(u) + hold);
        hero.setLeaves(ss(u, R.uIn - 0.135, R.uIn - 0.08) * (1 - ss(u, R.uIn + 0.012, R.uIn + 0.05)));
        hero.setWeight(u);
        // the rare event: canvas blinds run down the roof glass bay by bay as we pull back from the close pass (a few bays stop
        // part way, their battens straight across the bright glass); half light, and every blade stronger, narrower and more golden until we are inside
        const blind = rare ? 0.84 * ss(u, RARE0, RARE1) : 0;
        const strong = blind * (1 - ss(u, R.uIn - 0.01, R.uIn + 0.04));
        U.uBlind.value = blind; U.uTopGain.value = 1 - 0.58 * blind; U.uFogCol.value.copy(fogBase).multiplyScalar(1 - 0.62 * blind);
        scene.background.copy(U.uFogCol.value);
        U.uBeamGain.value = look.beamGain * (1 + 0.5 * strong); U.uBladeGain.value = look.bladeGain * (1 + 0.1 * strong); U.uBladeK.value = look.bladeK + 0.16 * strong;
        U.uBeamCol.value.copy(beamBase).lerp(beamRare, 0.7 * strong);
        // the panel that faces us burns at full strength from the aisle, less on the orbit, and blooms once on the west side
        const kf = (u - uWest) / 0.035; U.uFlare.value = 1 - 0.4 * ss(u, 0.19, 0.29) + 1.5 * Math.exp(-kf * kf);
                hero.update(dt, t, camera);
        // sleeper breathing, tail flicking as we come up the aisle; the stool still rocking; the crane hook swaying
        const br = Math.sin(t * 1.5); sleeper.userData.body.scale.set(1 + 0.025 * br, 1 + 0.05 * br, 1);
        const kt = (u - 0.085) / 0.04, flick = Math.sin(t * 8.5) * Math.exp(-kt * kt) * 0.85 + 0.06 * Math.sin(t * 0.9);
        tailTip.rotation.y = sleeper.userData.tail + flick;
        stool.rotation.z = 0.05 * Math.sin(t * 2.3) * (0.6 + 0.4 * Math.sin(t * 0.37));
        hook.rotation.z = 0.075 * Math.sin(t * 0.9); hook.rotation.x = 0.05 * Math.sin(t * 0.73 + 1);
        birdsA.update(dt, t, camera, u); birdsB.update(dt, t, camera, u); moth1.update(dt, t, camera, u); moth3.update(dt, t, camera, u);
        moth2.object.visible = u > R.uIn + 0.03 || u === 0; if (moth2.object.visible) moth2.update(dt, t, camera, u);
        // while we look up the chimney both moths climb with the hot air and circle its upper length, under the smoke bell
        const lift = ss(u, R.uIn + 0.03, R.uIn + 0.07) * (1 - ss(u, R.uIn + 0.125, R.uIn + 0.16));
        moth1.object.position.y = 9.5 * lift; moth2.object.position.y = 10.5 * lift;
        set.update(dt, t, camera);
        ctx.renderer.getDrawingBufferSize(size); UP.uPx.value = size.y * camera.projectionMatrix.elements[5] * 0.5;
      },
      dispose() { hero.dispose(); LT.dispose(); },
    };
  },
};
