// The House Behind the Waterfall: up a mountain stream where a troop of monkeys lives, over its pools and small falls under peach boughs,
// out onto the lake under the great fall, round its shore, through the curtain of water, and into the place behind it: an iron
// bridge over an underground water and a hall of stone with stone tables, beds and bowls, a garden under a crack in the roof,
// an empty seat and a round moon-door.
//
// Places are in metres: y = 0 is the lake, z grows to the south (we fly north), the fall's foot is at x = 0. The whole place is
// mirrored left to right by the visit's side. Every station of the route is a place (a pool, a fall's lip, the outlet, the leaping
// rock, the curtain, the mouth, the bridge's ends, the gate, the tables, the garden, the seat, the ring).
// The set pieces (fall, cliff, cave, house, mist, the monkey maker) are in src/parts/house-behind-the-waterfall.js.
//
// WHAT IS DRIVEN BY WHAT (the place simply stands; nothing of the story begins, turns or ends as we come)
// THE WORLD'S CLOCK alone (habits, each with a drawn phase, right at any clock): the falling water, mist, spray, drops, drips, flames
//   and smoke; every monkey that moves: the hoppers, the rounds, the swimmers, the swings, the crossers on the fallen pine, the trail
//   runners to and fro on their lanes, the leapers in and out through the curtain, the comers and goers over the bridge; the cranes on
//   their round and on their line over the lake, the swifts, the deer, the butterflies; the petals; the water's ripples and its light's
//   shaking; the tails, heads and hands of those who sit.
// THE VIEWER'S SETTING, fixed for the visit: the hour (sky, sun or moon, haze, exposure, the colours of the fall and the cave).
// PLACE IN THE WORLD (standing states): sun and shade on the ground, the cave's light by a point's distance from the curtain, the
//   shafts under the roof's crack, the fires; a body's light by its own z at the sheet. ROUND 3: THE AIR, by where a thing stands
//   (the day's haze under the sky; the cave's own tone for what stands behind the sheet, as its own constants; for what lies on
//   both sides of the sheet, the two mixed by its own z from 1 to 16 m behind the sheet's plane; the scene's fog is never written
//   after the build), and THE PETAL FALL, each petal by its own z (whole 8 m south of the sheet's plane, gone 1 m before it).
//   The falling drops' box lies across the way at the sheet on purpose: a medium the way goes through.
// THE EYE'S OWN PLACE IN THE WORLD: makes by the eye's distance that are the kit's own (the grass, the flowers and the creatures by
//   their ranges; the cave's own plants still sink away at 165 to 200 m: round 3's A13 is done for the troop, not for them), the
//   water parting into threads within 36 m, a thread or a puff thinning away at the lens; what turns to face the eye (puffs,
//   flames, drips, vines, the shafts' sheaves); the water's mirror and the bow by the eye's angle (the bow no longer by its
//   nearness); the sky's dome, the light rig and the petals' box go with the eye. NO MONKEY sinks away by the eye's distance and
//   no plant under the sky is drawn or left out by it any more (round 3, A12, A13).
// THE METRES OF THE WAY (makes only, worked in build; nothing is seen to begin by them): the land is drawn until 6 m inside the
//   passage (its rock stands between), the hall's things from the first metre the hall can be seen from; a band of the troop, a
//   zone of stones and a clump of plants under the sky from 16 m before the first metre from which any place of it is in sight
//   over the drawn ground (or through the cliff's openings), and from then on; in the house each member of a band by its own
//   places (the band draws so many as are in sight by now); the fruit with its trees' 60 m of z; a band's far shape while the
//   way is more than 45 m from all its places.
// A PLACE OF THE ROUTE: the one pull of the gaze up the great fall (from the turn's end to the leaping rock), the pace (how fast we
//   fly), the portal's reveal from the gate on. Nothing reads the film's clock; nothing reads the camera's direction or projection.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as T from '../kit/terrain.js';
import { buildHero, layoutHouse, layoutHome, homeUniforms, galFloorAt, galFootZ, galRimZ, galRoofAt, galOpening, makeUniforms, placeUniforms, makeMonkeys, monkeyBody, makeMist, PLACE, NOISE_GLSL, AIR_GLSL, fallThrow, fallTime, wallZ, wallTop, WALL_HALF, lin } from '../parts/house-behind-the-waterfall.js';

const TAU = Math.PI * 2;
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
// Every stream this world deals from, by the name of what it deals: each is made from the visit's seed and its own name and draws from
// nothing else (the set pieces' own streams are named in the part: cliff ledges, house things, fall mist, fall veil, sheet spray,
// roof shafts).
const STREAMS = [
  // the visit and the place
  'visit', 'troop coat', 'troop size', 'sky', 'house plan', 'stream course', 'small falls', 'route', 'islet', 'terrain', 'ground', 'cliff rock',
  // rocks and stones
  'islet rock', 'leap rock', 'rock shapes', 'stone rock', 'fall rocks', 'pool rocks', 'bank stones', 'shore rocks', 'foot rocks', 'fall shoulders', 'gate rocks',
  // the green
  'peach shapes', 'slope tree shapes', 'pine shapes', 'bank peaches', 'shore peaches', 'peach tints', 'fruit', 'slope trees', 'slope tree tints',
  'ledge pines', 'ledge peaches', 'cliff vines', 'cliff vine leaves', 'rim pines', 'islet pine', 'pine tints', 'cave plant shapes', 'cave bamboo', 'cave plum', 'cave pine', 'gallery fern shapes', 'gallery ferns', 'gallery fern tints', 'house stoves', 'fruit heaps', 'hangings', 'garland leaves', 'hall vines',
  'grass', 'flowers', 'reed shapes', 'bank reeds', 'shore reeds', 'reed tints', 'fern shapes', 'ferns', 'fern tints', 'bush shapes', 'bushes', 'bush tints',
  'thicket shapes', 'thickets', 'thicket tints',
  // the troop
  'trail runners', 'bank sitters', 'stone sitters', 'bank rounds', 'swimmers', 'fallen pine', 'pine bark', 'swings', 'gorge young', 'lake young', 'house young', 'shore sitters', 'lake stone sitters', 'islet sitters', 'rock sitters', 'shore rounds', 'leapers',
  'bridge runners', 'bench sitters', 'table sitters', 'bed bouncers', 'floor sitters', 'step sitters', 'gallery sitters', 'house rounds', 'column rounds', 'hearth sitters', 'heap pickers', 'crowd',
  // mist, petals, drips, the other life, the rare visit
  'fall mist small', 'gorge mist', 'sheet drops', 'petals', 'hall petals', 'drips', 'gallery drips', 'stove fires', 'stove smoke', 'fauna', 'crane flight', 'cranes', 'small birds', 'waders', 'deer', 'butterflies', 'fireflies', 'summit stone',
];

export default {
  id: 'house-behind-the-waterfall',
  name: 'The House Behind the Waterfall',
  category: 'books',
  placeKind: 'wilderness',
  book: 'Journey to the West',
  author: "Wu Cheng'en, about 1500 to 1582",
  media: ['air', 'water'],
  weirdness: 0.45,
  async build(ctx) {
    const { noise } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();
    const ST = {};
    for (const n of STREAMS) ST[n] = ctx.core.makeRng(ctx.core.hashSeed(n + ':' + ctx.seed));
    const P = PLACE, sm = smoothstep;

    // ------------------------------------------------------------ what this visit is like
    const DUR = 50;
    const V = ST.visit, CT = ST['troop coat'], TS = ST['troop size'];
    // the whole place mirrored left to right; the hour; how thick the green stands and how large the troop is; a rare visit shows the split stone
    const side = V.sign();
    const hour = vary.hour === 'dawn' || vary.hour === 'golden' || vary.hour === 'night' ? vary.hour : 'day';
    const night = hour === 'night';
    const dens = clamp(vary.density ?? 1, 0.7, 1.3), rare = !!vary.rare, mood = clamp(vary.mood ?? 0.5, 0, 1);
    // the troop's coat: from grey-brown to gold, with its own spread from animal to animal
    const densT = lerp(0.85, 1.15, (dens - 0.7) / 0.6);
    const coatHue = CT.range(0, 1), coatSpread = CT.range(0.12, 0.3), troopK = TS.range(0.9, 1.1) * densT;

    // ------------------------------------------------------------ the stream below the lake: its course, its small falls, its pools
    // The course: x of the stream's middle at z, through knots from the lake southward; it swings 44 to 56 m to the west round a spur of the
    // gorge's east side. The spur hides the lake and the great fall's foot from the gorge; the fall's upper half shows over it from about
    // 60 m above the place zE on, some 120 m of the way with its run-in (its first sight, far and small), is lost again under the spur, and stands whole only from the sill.
    await ctx.yield();
    const SC = ST['stream course'];
    const OUT_Z = 172, CZ0 = 140, CZ1 = 480;
    const zK = [150, OUT_Z, 205, 235, 265, 300, 338, 380, 425, 470];
    const xK = [0, SC.range(-4, 4), -8 + SC.range(-4, 4), -44 + SC.range(-6, 6), -50 + SC.range(-6, 6), -26 + SC.range(-7, 7), SC.range(-7, 7), 8 + SC.range(-6, 6), 2 + SC.range(-5, 5), 0];
    const mK = zK.map((z, i) => (i === 0 || i === zK.length - 1 ? 0 : (xK[i + 1] - xK[i - 1]) / (zK[i + 1] - zK[i - 1])));
    const courseRaw = (z) => { if (z <= zK[0]) return xK[0]; if (z >= zK[zK.length - 1]) return xK[xK.length - 1];
      let i = 0; while (z > zK[i + 1]) i++;
      const h = zK[i + 1] - zK[i], t = (z - zK[i]) / h, t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * xK[i] + (t3 - 2 * t2 + t) * h * mK[i] + (-2 * t3 + 3 * t2) * xK[i + 1] + (t3 - t2) * h * mK[i + 1]; };
    // four small falls: one where the lake spills over its sill, three down the gorge; each 4 to 7 m, each over a run of 1.2 m
    const SF = ST['small falls'];
    const falls = [{ z: OUT_Z + 3, d: SF.range(5, 7) }, { z: SF.range(226, 240), d: SF.range(4, 6) }, { z: SF.range(288, 304), d: SF.range(4, 7) }, { z: SF.range(346, 362), d: SF.range(4, 6) }];
    const levelRaw = (z) => { let y = 0; for (const f of falls) y -= f.d * sm(f.z - 0.6, f.z + 0.6, z); return y; };
    // the pool under each fall: the stream is broad there (half breadth up to 8.5 m) and narrows to 4 m at the next lip
    const halfRaw = (z) => { let p = 0; for (const f of falls) { const d = z - f.z; if (d > 0) p = Math.max(p, Math.exp(-d / 16) * sm(0, 4, d)); }
      let lip = 0; for (const f of falls) lip = Math.max(lip, 1 - sm(0, 9, Math.abs(z - f.z + 2)));
      return (4.6 + 3.9 * p + 0.9 * noise.n2(z * 0.05, 7.7)) * (1 - 0.3 * lip); };
    // tables at half-metre steps: the course, its slope, the water's level, the banks' level (the mean of the water's level over the 12 m
    // upstream: a bank never lies under its water, and beside the pool under a fall it stands up as the pool's wall), the half breadth,
    // and the level the route keeps over (the mean from 2 m downstream to 18 m upstream: the way begins to climb 18 m before a fall)
    const CN = (CZ1 - CZ0) * 2, cX = new Float32Array(CN + 1), cS = new Float32Array(CN + 1), cL = new Float32Array(CN + 1), cB = new Float32Array(CN + 1), cH = new Float32Array(CN + 1), cR = new Float32Array(CN + 1);
    for (let i = 0; i <= CN; i++) { const z = CZ0 + i * 0.5; cX[i] = courseRaw(z); cS[i] = (courseRaw(z + 0.5) - courseRaw(z - 0.5)); cL[i] = levelRaw(z); cH[i] = halfRaw(z);
      let b = 0; for (let k = 0; k <= 12; k++) b += levelRaw(z - k); cB[i] = b / 13;
      let r = 0; for (let k = -2; k <= 18; k++) r += levelRaw(z - k); cR[i] = r / 21;
      if (i % 170 === 169) await ctx.yield(); }
    const tab = (a, z) => { const f = clamp((z - CZ0) * 2, 0, CN - 0.001), i = Math.floor(f); return lerp(a[i], a[i + 1], f - i); };
    const courseX = (z) => tab(cX, z), courseSlope = (z) => tab(cS, z), level = (z) => tab(cL, z), bankLevel = (z) => tab(cB, z), half = (z) => tab(cH, z), routeLevel = (z) => tab(cR, z);
    const courseSec = (z) => Math.sqrt(1 + courseSlope(z) ** 2);
    await ctx.yield();

    // ------------------------------------------------------------ the lake under the great fall, the mountain, the ground
    // The lake: level 0; straight shores 60 m to either hand of the fall's line from the cliff down to z = 92, then half an ellipse 80 m
    // long to the outlet. lakeIn: metres inside the shore (negative outside), along the ray from the lake's middle.
    const LAKE = { cz: 92, ax: 60, az: 80 };
    const lakeIn = (x, z) => { if (z > OUT_Z + 2) return -1e3; if (z < LAKE.cz) return LAKE.ax - Math.abs(x);
      const dz = z - LAKE.cz, r = Math.hypot(x / LAKE.ax, dz / LAKE.az), l = Math.hypot(x, dz); return r < 1e-4 ? LAKE.ax : l * (1 / r - 1); };
    const streamIn = (x, z) => (z < 160 ? -1e3 : half(z) - Math.abs(x - courseX(z)) / courseSec(z));
    // the mountain: one great dome with its summit 250 m north of the fall, its own lumps and shoulders; the seed moves and shapes it
    const TR = ST.terrain;
    const MT = { x: TR.range(-45, 45), z: -250 + TR.range(-30, 30), h: TR.range(232, 268), wx: TR.range(235, 290), wz: TR.range(305, 355), ox: TR.range(0, 200), oz: TR.range(0, 200) };
    const mountain = (x, z) => MT.h * Math.exp(-(((x - MT.x) / MT.wx) ** 2 + ((z - MT.z) / MT.wz) ** 2)) * (1 + 0.16 * noise.fbm2(x * 0.004 + MT.ox, z * 0.004 + MT.oz, 3))
      + 16 + 20 * (0.5 + 0.5 * noise.n2(x * 0.011 + MT.oz, z * 0.011 + MT.ox)) + 5 * noise.n2(x * 0.045, z * 0.045 + 9);
    const softPos = (a, k) => (a <= 0 ? 0 : a * a / (a + k));
    // the ground south of the cliff: the lake's bed and the stream's bed under their water (the stream's bed steps down 1.6 m upstream of
    // where its water falls, so a fall's sheet stands clear before its rock), a gentle bank 7 m broad (the troop's trails
    // run on it), then the gorge's and the basin's sides rising at 0.55 to 1.15 until they meet the mountain's own surface
    const groundS = (x, z) => {
      const dl = lakeIn(x, z), ds = streamIn(x, z), dW = Math.max(dl, ds), e = -dW, wl = level(z), bk = bankLevel(z);
      const steep = 0.85 + 0.3 * noise.n2(x * 0.013 + 9, z * 0.013);
      const bankY = bk + 0.35 + 0.22 * clamp(e, 0, 7) + steep * softPos(e - 7, 5) + 1.2 * noise.n2(x * 0.07, z * 0.07) * sm(2, 12, e);
      const bedY = dl >= ds ? wl - 0.35 - 5.5 * sm(0, 16, dW) : level(z + 1.6) - 0.35 - (0.9 + 0.5 * (half(z) - 4)) * sm(0, 3, dW);
      return T.smin(lerp(bedY, bankY, sm(-2.2, 3.2, e)), mountain(x, z), 8);
    };
    // the cliff's own line in the ground: 14 m behind the fall's wall where the wall stands before it (the gallery lies between), coming
    // forward to 4 m before the wall's line at its two ends, which so stand buried in the mountain
    const zRamp = (x) => wallZ(P, x) - 14 + 18 * sm(74, 82, Math.abs(x));
    // the ground north of that line: green slopes rising at 0.6 from the wall's rim to the mountain's own surface, a hanging valley running
    // north from the lip (through its notch the summit shows from the lake); beyond the wall's ends the basin's own sides go on
    const groundN = (x, z) => { const d = Math.max(0, zRamp(x) - z), ax = Math.abs(x);
      const a = Math.min(wallTop(P, x, noise) + 4 + 0.6 * d, 75.2 + 0.1 * d + 0.0022 * d * d + 0.75 * softPos(ax - 15, 8)) + (1.6 * noise.n2(x * 0.045, z * 0.045 + 60) + 0.6 * noise.n2(x * 0.14, z * 0.14)) * sm(2, 14, d);
      return Math.min(mountain(x, z), ax > LAKE.ax ? Math.max(a, groundS(x, z)) : a); };
    const groundRaw = (x, z) => { const zr = zRamp(x), w = lerp(1.6, 5, sm(70, 82, Math.abs(x)));
      if (z > zr + w) return groundS(x, z); if (z < zr - w) return groundN(x, z);
      return lerp(groundN(x, z), groundS(x, z), sm(zr - w, zr + w, z)); };
    // (backHold: the ground's hold under the eye's line behind the entry, a rule of the place set once where the run-in is laid, below;
    // until then, and everywhere but behind the entry, the ground is the ground as written above)
    let backHold = null;
    const groundP = (x, z) => { const g = groundRaw(x, z); return backHold === null ? g : backHold(x, z, g); };
    const ground = (wx, z) => groundP(side * wx, z);
    await ctx.yield();

    // ------------------------------------------------------------ the route, station by station, every station a place (rules R1 to R6)
    const L = layoutHouse(P, ST['house plan']);
    const RT = ST.route, IS = ST.islet, cxH = P.hallX;
    // THE ISLET'S PLACE, BY RULE. The way comes at the fall on the line through the mouth's middle (M0) that lies PHI off the fall's front
    // (34.5 to 37.5 degrees: at 36 the line goes through the sheet 16 m east of the mouth's middle, well inside the curtain's 50 m, and
    // over the leaping rock). Before that it turns round the islet on a circle of TURN = 34 m (at the 14 m/s flown there 24 degrees a
    // second; 23 m from the islet's edge, its own width), which touches that line and reaches to SHORE metres inside the east shore's line
    // (1.5 to 4 m: the troop's shore passes at a rock's width). The islet is that circle's middle: about 23 m east of the fall's line and
    // 86 m south of it; the numbers fall out of the rule.
    const M0 = [P.mouthX - 0.5, 13.2, P.galBack - 2];
    const PHI = IS.range(34.5, 37.5) * Math.PI / 180, SHORE = IS.range(1.5, 4), ISLET = { r: 11, h: IS.range(14, 18) }, TURN = ISLET.r + 23;
    { const sp = Math.sin(PHI), cp = Math.cos(PHI); ISLET.x = LAKE.ax - SHORE - TURN; const s = (ISLET.x - M0[0] + TURN * cp) / sp; ISLET.z = M0[2] + s * cp + TURN * sp; }
    // the line of a tangent from a place q to the turn's circle, the islet on the left hand (hand = 1) or on the right (hand = -1) of someone going out from q
    const tangent = (q, hand) => { const vx = ISLET.x - q[0], vz = ISLET.z - q[1], D = Math.hypot(vx, vz), a = Math.asin(TURN / D) * hand, c = Math.cos(a), s = Math.sin(a);
      const dx = (vx * c - vz * s) / D, dz = (vx * s + vz * c) / D, len = Math.sqrt(D * D - TURN * TURN); return { dx, dz, len, x: q[0] + dx * len, z: q[1] + dz * len }; };
    const pts = [];
    // R1 the opening: 4.5 m over the lowest pool, the lowest small fall ahead on the line.
    // THE RUN-IN (the owner's rule: a world is entered through a portal with the camera on the level entry frame, the yaw of the way's
    // first tangent with no pitch, so the first pose must lie along it). The lowest pool keeps one level from the lowest small fall to
    // the stream's end, 96 m and more. The way begins RUN = 62.5 m (five of its places) below the place zE that lies 16 to 22 m under
    // that fall, over the pool's middle, and flies level on ONE STRAIGHT LINE to its first place above the fall (zE - 25, 87.5 m of z
    // on): the gaze's 26 m lie on that line and level, and the steady camera's 88 m end at that place, 2 degrees up. Where the pool
    // bends the line passes over the low inner bank (the margin asked of the ground and of all that grows there, as everywhere).
    const zE = falls[3].z + RT.range(16, 22), wvPh = RT.range(0, TAU), wvLen = RT.range(70, 95), RUN = 62.5, zS = zE + RUN;
    const weave = (z) => Math.sin(wvPh + TAU * z / wvLen) * clamp(half(z) - 2.6, 0, 3.6);
    // R2 first third: up the stream, 4.5 m over the level the way keeps (so over each small fall's lip with 3.7 m and more to spare), swinging
    // from bank to bank where a pool is broad
    // THE WAY'S TURNING IS HELD TO WHAT THE PACE ALLOWS (the eased camera under 30 degrees a second): up the gorge we fly up to 18 m/s (the
    // run-in's 62 m more in the same 50 s), so the way turns on no radius under EASE_R = 54 m, three seconds of that flight; where three neighbouring places of it turn more than their spacing allows on that radius, the
    // middle one moves toward the line between its neighbours, as far as its own room goes (the stream and 5 m of its bank; a quarter
    // of that at a small fall, which stays under the way; 1.5 m at the sill; 9 m out on the lake). The same for every place and every seed.
    const EASE_R = 54;
    // (a place moves only ACROSS the way: along the normal of the line between the places before and after it as they were laid; never
    // along the way, so two places cannot crowd together into a kink, as they did at a small fall in a bend)
    const easeTurns = (q, R) => { for (let i = 0; i < q.length; i++) { const a = q[Math.max(0, i - 1)], c = q[Math.min(q.length - 1, i + 1)], l = Math.hypot(c.x - a.x, c.z - a.z) || 1; q[i].nx = (c.z - a.z) / l; q[i].nz = -(c.x - a.x) / l; }
      const move = (w, dx, dz) => { if (!(w.room > 0)) return; const across = dx * w.nx + dz * w.nz; w.x += across * w.nx; w.z += across * w.nz;
        const ex = w.x - w.ox, ez = w.z - w.oz, d = Math.hypot(ex, ez); if (d > w.room) { w.x = w.ox + ex / d * w.room; w.z = w.oz + ez / d * w.room; } };
      for (let it = 0; it < 400; it++) for (let i = 1; i < q.length - 1; i++) { const a = q[i - 1], b = q[i], c = q[i + 1];
        const ux = b.x - a.x, uz = b.z - a.z, vx = c.x - b.x, vz = c.z - b.z, lu = Math.hypot(ux, uz), lv = Math.hypot(vx, vz);
        const turn = Math.abs(Math.atan2(ux * vz - uz * vx, ux * vx + uz * vz)), lim = 0.5 * (lu + lv) / R; if (turn <= lim) continue;
        // the middle place goes toward the line between its neighbours and the neighbours half as far the other way (so a place with
        // little room, a small fall's lip, has its turn taken up by the places before and after it)
        const f = lu / Math.max(1e-6, lu + lv), k = 0.5 * (1 - lim / turn), dx = (lerp(a.x, c.x, f) - b.x) * k, dz = (lerp(a.z, c.z, f) - b.z) * k;
        move(b, dx, dz); move(a, -0.5 * dx, -0.5 * dz); move(c, -0.5 * dx, -0.5 * dz); } };
    const atFall = (z) => { let n = 0; for (const f of falls) n = Math.max(n, 1 - sm(3, 12, Math.abs(z - f.z))); return n; };
    const way = [];
    // THE RUN-IN KEEPS THE MARGIN OVER THE GROUND TOO: it flies level at 4.5 m over the pool, or higher where the bank under its line
    // asks: the highest ground under the line (asked every 1.25 m, from 30 m behind the entry to its last place before the fall) plus
    // the margin and 0.25 m. The lift is the same for all its places (it stays level and straight) and is given back over the next two
    // places above the fall. (On most seeds the line stays over the pool and its low edge and nothing is lifted.)
    let runLift = 0;
    { const zA = zE - 25, ax = courseX(zA) + weave(zA), bx = courseX(zS), xAt = (z) => lerp(bx, ax, (zS - z) / (zS - zA)); let zLast = zS;
      for (let z = zS; z > zA + 1; z -= 12.5) { way.push({ x: xAt(z), z, room: 0, run: 1 }); zLast = z; }
      for (let z = zS + 30; z >= zLast; z -= 1.25) runLift = Math.max(runLift, groundP(xAt(z), z) + 2.75 /* the margin (MARGIN = 2.5 m, stated below) and 0.25 m */ - (routeLevel(Math.min(z, zS)) + 4.5));
      // THE GROUND BEHIND THE ENTRY LIES UNDER THE EYE'S LINE, TO THE LAND'S END. The place is first seen through the ring of the place
      // before it, by an eye on the run-in's straight line continued back behind the entry, level, at the entry's height. The stream's
      // course bends away from that line and the bank would rise over it some 95 m back. So, by place, a dell is held under that
      // line: measured in metres BEHIND the entry along the line itself and in metres ASIDE of it, from 30 m behind the entry (to
      // there the lift above keeps the margin) the ground within 5 m of the line is held 3 m and more under the run-in's height;
      // beside that it may rise from there at 1 in 2 as far as 15 m aside and at 2 in 1 beyond (so the dell is some 25 m to either
      // hand at the widest and the hill beyond it stands as written); the hold comes on over the 12 m from 30 m to 42 m behind the
      // entry and stands from there to the land's end. It only ever lowers the ground, never to less than 1.5 m over the way's own
      // level at the entry (so never to the water of the lowest pool, which keeps one level to the stream's end), and it is set
      // before the land is made, before anything is stood on the ground and before any place is asked but the lift's own (which
      // lie before it): all that stands behind the entry stands on the ground as held.
      { const eyeY = routeLevel(zS) + 4.5 + runLift, ux = bx - ax, uz = zS - zA, ul = Math.hypot(ux, uz);
        backHold = (x, z, g) => { const rx = x - bx, rz = z - zS, back = (rx * ux + rz * uz) / ul; if (back <= 30) return g;
          const aside = Math.abs(rx * uz - rz * ux) / ul, top = eyeY - 3 + (aside <= 5 ? 0 : aside <= 15 ? 0.5 * (aside - 5) : 5 + 2 * (aside - 15));
          return top < g ? lerp(g, top, sm(30, 42, back)) : g; }; } }
    for (let z = zE - 25, k = 0; z > OUT_Z + 7; z -= 12.5, k++) { const w = weave(z); way.push({ x: courseX(z) + w, z, room: (half(z) + 5 - Math.abs(w)) * (1 - 0.75 * atFall(z)), run: k === 0 ? 2 / 3 : k === 1 ? 1 / 3 : 0 }); }
    // over the sill where the lake spills, then out on the lake with the great fall front on, two of its heights away
    way.push({ x: courseX(OUT_Z + 1), z: OUT_Z + 1, room: 1.5 });
    const B1 = [RT.range(1, 5), 5.5, P.sheetZ + 2 * P.H - 12];
    // R2 second third: along the east shore to the turn round the islet, then straight at the curtain on the line that leads through it into
    // the cave's mouth (about 35 degrees off the fall's front), rising from 8 m to 14.5 m
    const t1 = tangent([B1[0], B1[2]], 1), t2 = tangent([M0[0], M0[2]], -1);
    // from there to the turn's beginning, a place every 13 m or so (the corner at the front-on place opens into a curve by the same rule)
    { const n = Math.max(2, Math.round(t1.len / 13)); for (let i = 0; i < n; i++) way.push({ x: lerp(B1[0], t1.x, i / n), z: lerp(B1[2], t1.z, i / n), y: lerp(5.5, 7, i / n), room: 9 }); }
    way.push({ x: t1.x, z: t1.z, y: 7, room: 0 });
    for (const w of way) { w.ox = w.x; w.oz = w.z; }
    easeTurns(way, EASE_R);
    for (const w of way) pts.push([w.x, w.y ?? routeLevel(w.z) + 4.5 + runLift * (w.run || 0), w.z]);
    { const a1 = Math.atan2(t1.z - ISLET.z, t1.x - ISLET.x); let a2 = Math.atan2(t2.z - ISLET.z, t2.x - ISLET.x); while (a2 > a1) a2 -= TAU; while (a2 < a1 - TAU) a2 += TAU;
      const n = Math.max(1, Math.round((a1 - a2) * TURN / 13));
      for (let i = 1; i < n; i++) { const a = lerp(a1, a2, i / n); pts.push([ISLET.x + Math.cos(a) * TURN, lerp(7, 8, i / n), ISLET.z + Math.sin(a) * TURN]); } }
    pts.push([t2.x, 8, t2.z]);
    // the approach's line, from the turn's end (f = 0) to the place where it goes through the sheet (f = 1)
    const apLen = (t2.z - P.sheetZ) / t2.dz, apX = (f) => t2.x - t2.dx * apLen * f, apZ = (f) => t2.z - t2.dz * apLen * f, apY = (f) => lerp(8, 14.5, f);
    for (const f of [0.28, 0.56, 0.8]) pts.push([apX(f), apY(f), apZ(f)]);
    const CROSS = [apX(1), 14.5, P.sheetZ];
    pts.push(CROSS);
    // the leaping rock stands under the line, its middle 9 m before the sheet, its top 3.5 m under the way (the margin and a metre: those
    // who wait on it sit to either hand of the line, the small ones nearest it)
    const LEAP = { x: apX(1 - 9 / apLen), z: apZ(1 - 9 / apLen), top: apY(1 - 9 / apLen) - 3.5, r: 4.6 };
    // R2 last third: through the gallery to the mouth, over the bridge 3.7 m over its deck, through the gate, low over the tables' ends,
    // into the garden, then (R3; round 3, A3) the last 62 m straight and level to the ring, 2.55 m over the seat's back
    pts.push([lerp(CROSS[0], M0[0], 0.55), 14.1, lerp(CROSS[2], M0[2], 0.55)], M0);
    // THE WAY OVER THE HOUSE'S FLOORS, BY ONE RULE (round 3, A8 with A2): from the bridge's head to the tables' ends it flies level,
    // WAY_IN = 4.05 m over the highest floor the troop runs on under it, the gate's threshold (0.21 m over the deck and the hall's
    // floor, which lie at one height): the margin for a body the clock moves (2.55 m), a young runner's true height (1.2 m: its
    // tail carried up) and its stride's lift (0.26 m), with what is left of 0.04 m. So it lies 4.26 m over the deck and the hall's
    // floor. (It lay 3.7 m over the deck and 3.9 m over the hall's floor; under that no runner of the bridge kept the margin by
    // its true body, and those who sat on the floor under it kept 2 m only.)
    const WAY_IN = 4.05, yIn = P.deckY + 0.21 + WAY_IN;
    pts.push([P.bridgeX, yIn, P.bridgeZ0], [P.bridgeX, yIn, (P.bridgeZ0 + P.bridgeZ1) / 2], [P.bridgeX, yIn, P.bridgeZ1], [cxH, yIn, P.hallZ0 - 1]);
    for (const t of L.tables) pts.push([cxH + 0.5 * (t.x - cxH), yIn, t.z]);
    pts.push([cxH + Math.sign(L.plum.x - cxH), 13.8, L.garden.z0 + 2]);
    // THE LAST 60 m STRAIGHT AND LEVEL (round 3, A3). A piece of this line between two knots is straight only where the knot before
    // it and the knot after it lie on the same straight line too. The three knots on the ring's line followed the garden's knot,
    // which lies off it, so only the last 31 m were straight (the 31 m before them still came down from 0.35 m over the ring's
    // height, up to 3.3 degrees off). A FOURTH KNOT ON THE LINE now stands before the three, at hallZ1 + 72: the way has climbed to
    // the ring's height and come onto the hall's line there, and from hallZ1 + 62 on it is straight and level to the third decimal
    // (asked every 0.625 m of it below: stations.lastStraight). The reader's place for the knot, hallZ1 + 93, lies 4 m past the
    // garden's knot and 5.2 m over it (a ramp of 65 degrees); at hallZ1 + 72 the climb out of the garden is 13.7 degrees at its
    // steepest (it was 10.0) and bends by 2 degrees a metre at the most.
    pts.push([cxH, L.ringY, P.hallZ1 + 72], [cxH, L.ringY, P.hallZ1 + 62], [cxH, L.ringY, P.hallZ1 + 31], [cxH, L.ringY, P.hallZ1]);
    await ctx.yield();
    const path = makePath(pts.map((p) => [side * p[0], p[1], p[2]])), PL = path.length;
    // the route in the place's own coordinates at every 2.5 m (R5: every clearance is tested against these), and the metres of its places
    const RN = Math.ceil(PL / 2.5), RX = new Float32Array(RN + 1), RY = new Float32Array(RN + 1), RZ = new Float32Array(RN + 1), tv = new THREE.Vector3();
    for (let i = 0; i <= RN; i++) { path.posAtDist(Math.min(PL, i * 2.5), tv); RX[i] = side * tv.x; RY[i] = tv.y; RZ[i] = tv.z; }
    // (distances are taken to the way's own line: the straight pieces between those places)
    const lineDist = (x, y, z, flat) => { let b = 1e9;
      for (let i = 0; i < RN; i++) { const ax = RX[i], ay = flat ? 0 : RY[i], az = RZ[i], ux = RX[i + 1] - ax, uy = flat ? 0 : RY[i + 1] - ay, uz = RZ[i + 1] - az;
        const t = clamp(((x - ax) * ux + (y - ay) * uy + (z - az) * uz) / (ux * ux + uy * uy + uz * uz || 1), 0, 1), dx = ax + ux * t - x, dy = ay + uy * t - y, dz = az + uz * t - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; }
      return Math.sqrt(b); };
    const routeDist = (x, y, z) => lineDist(x, y, z, false), routeDistXZ = (x, z) => lineDist(x, 0, z, true);
    // THE MARGIN (A6). Nothing solid stands or goes nearer the way than MARGIN = 2.5 m, measured from the way's line (asked every 0.625 m
    // of it) to the thing's nearest part. Every thing is asked as the upright round body that holds all of it: from its foot (y0) to its
    // top (y1), so far out from its middle line (rho): a stone by its radius, a monkey from its feet to its head and out to the end of
    // its limbs and tail, a leap, a run and a lane at every 0.625 m of it or finer.
    // ONE MARGIN FOR EVERYTHING (round 3, A8): what stands still on the house's own floors straight under the way keeps the whole
    // 2.5 m too, as beside it. BOTH were needed: the way is lifted over the house's floors by one rule for all its places there (WAY_IN
    // above: 4.26 m over the deck and the hall's floor, where it lay 3.7 and 3.9 m), and those who sit under it are asked by their
    // true body at the whole margin and sit smaller there, or do not sit; the seat's back is 0.15 m lower than it was (2.55 m under
    // the ring's middle, which the way's end does not leave). MARGIN_UNDER = 2.0 is kept for the dealing alone (see sizeDealt below):
    // nothing is placed by it.
    // A body the clock moves (a runner on its round, a leaper, one who hops) is asked for MARGIN_GO = 2.55 m (the test's own grain:
    // the way is asked every 0.625 m, which can overstate a distance of 2.5 m by 0.02 m, and a body's course likewise; counted at the
    // entry clocks no body then comes under 2.5 m).
    // What would stand nearer is not placed (a grown monkey gives its place to a smaller one where that one fits). The least
    // distance found for every kind of thing is kept (stations.margins).
    const MARGIN = 2.5, MARGIN_UNDER = 2.0, MARGIN_GO = MARGIN + 0.05, margins = {}, counts = {};
    // THE ENTRY AXIS BEHIND THE ENTRY. The camera that draws this place inside the opening of the place before flies the way's first
    // tangent continued backward, level, at the entry's height. The margin's line is therefore continued along that axis for BACK = 60 m
    // (places QN + 1 to QM): every thing keeps its margin from it exactly as from the way, by the one test.
    const BACK = 60, QN = Math.ceil(PL / 0.625), QM = QN + Math.round(BACK / 0.625), QX = new Float32Array(QM + 1), QY = new Float32Array(QM + 1), QZ = new Float32Array(QM + 1);
    for (let i = 0; i <= QN; i++) { path.posAtDist(Math.min(PL, i * 0.625), tv); QX[i] = side * tv.x; QY[i] = tv.y; QZ[i] = tv.z; }
    const T0 = path.tangentAtDist(0, new THREE.Vector3()), t0n = Math.hypot(T0.x, T0.z) || 1, backX = -side * T0.x / t0n, backZ = -T0.z / t0n;
    for (let i = QN + 1; i <= QM; i++) { const d = (i - QN) * 0.625; QX[i] = QX[0] + backX * d; QY[i] = QY[0]; QZ[i] = QZ[0] + backZ * d; }
    // (A3's count, kept in the stations: over the last 60 m of the way, asked every 0.625 m, the most it lies aside of the hall's line,
    // off the ring's height, and its heading off the line in degrees)
    const lastStraight = [0, 0, 0]; { const tt = new THREE.Vector3(); for (let d = PL - 60; d <= PL; d += 0.625) { path.posAtDist(d, tv); path.tangentAtDist(d, tt);
        lastStraight[0] = Math.max(lastStraight[0], Math.abs(side * tv.x - cxH)); lastStraight[1] = Math.max(lastStraight[1], Math.abs(tv.y - L.ringY)); lastStraight[2] = Math.max(lastStraight[2], Math.atan2(Math.hypot(tt.x, tt.y), -tt.z) * 180 / Math.PI); } }
    // (the way's places are kept by 8 m of z, so that a thing is asked only against the way near it; a thing with no place of the way within
    // FAR = 16 m of its z, beyond its own breadth, is that far off or further, and FAR is what is kept for it)
    const FAR = 16, QB = new Map(); for (let i = 0; i <= QM; i++) { const k = Math.floor(QZ[i] / 8); if (!QB.has(k)) QB.set(k, []); QB.get(k).push(i); }
    // (a place of the way further off on the ground alone than the least found so far cannot be the nearest: it is passed over unmeasured)
    const clearOf = (x, y0, y1, z, rho) => { let b = FAR * FAR, reach = (FAR + rho) * (FAR + rho);
      for (let k = Math.floor((z - FAR - rho) / 8), k1 = Math.floor((z + FAR + rho) / 8); k <= k1; k++) { const q = QB.get(k); if (!q) continue;
        for (let j = 0; j < q.length; j++) { const i = q[j], dz = QZ[i] - z, dx = QX[i] - x, hh = dx * dx + dz * dz; if (hh >= reach) continue;
          const h = Math.max(Math.sqrt(hh) - rho, 0), wy = QY[i], v = wy > y1 ? wy - y1 : wy < y0 ? y0 - wy : 0, d = h * h + v * v; if (d < b) { b = d; const r = Math.sqrt(d) + rho; reach = r * r; } } }
      return Math.sqrt(b); };
    const r2 = (v) => Math.round(v * 100) / 100;
    const keepLeast = (kind, c) => { if (!(margins[kind] <= c)) margins[kind] = Math.round(c * 100) / 100; };
    const fits = (kind, x, y0, y1, z, rho, need = MARGIN) => { const c = clearOf(x, y0, y1, z, rho); if (c < need) return false; keepLeast(kind, c); return true; };
    // THE OPENING'S TUBE BEHIND THE ENTRY (round 3, A1). What grows tall (trees, bushes, the slopes' thickets) is asked against the entry
    // axis as well as the way, as the upright round body of its crown's own radius from its foot to its top: nothing of it within
    // TUBE = 9 m of the axis along its last 30 m, nor within the margin of it from 30 to 60 m. tubeAsk: how much room it has to spare
    // (negative: it stands in the tube). A plant dealt into the tube is not struck out (the kit deals every plant's lean and tint in
    // the order of its list, so a plant less would change every plant after it): it is SET OUT of the tube, straight away from the
    // axis by half metres, to the first place where its own kind's rules hold again (setOut; asked after all its own numbers are
    // drawn, so no other plant moves). It keeps its dealt numbers (size, turn, shape, its place in the kit's list).
    // The slopes' thickets, which had no margin of their own, keep it now by the same test and the same setting out.
    const TUBE = 9, tubeMoved = {};
    const tubeAsk = (x, y0, y1, z, rho) => { const ex = x - QX[0], ez = z - QZ[0], s = ex * backX + ez * backZ; if (s + rho <= 0 || s - rho >= BACK) return 1e9;
      const l = Math.abs(ex * backZ - ez * backX), h = Math.max(l - rho, 0), v = QY[0] > y1 ? QY[0] - y1 : QY[0] < y0 ? y0 - QY[0] : 0;
      return Math.hypot(h, v) - (s - rho < 30 ? TUBE : MARGIN); };
    // (straight away from the line: from the nearest place of the way or of the axis, in plan)
    const setOut = (kind, x, z, okAt) => { let b = 1e18, bi = 0; for (let i = 0; i <= QM; i++) { const dx = x - QX[i], dz = z - QZ[i], d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } }
      let ux = x - QX[bi], uz = z - QZ[bi]; const ul = Math.hypot(ux, uz); if (ul > 1e-3) { ux /= ul; uz /= ul; } else { ux = backZ; uz = -backX; }
      for (let k = 1; k <= 80; k++) { const nx = x + ux * 0.5 * k, nz = z + uz * 0.5 * k; if (okAt(nx, nz)) { (tubeMoved[kind] ||= []).push(k * 0.5); return [nx, nz]; } }
      (tubeMoved[kind + ', none'] ||= []).push(0); return null; };
    // A MONKEY IS ASKED BY ITS DRAWN BODY'S TRUE REACH (round 3, A2). The part reads from its own make how far the body reaches in each
    // way of holding itself, at its fullest pose (monkeyBody: sitting, hopping, going with its starts, stops and rests, leaping,
    // hanging; for the pitch the ground or a leap gives it): its foot, its top and how far out, about the point it stands on. A body
    // of a size at (x, y, z), lifted by so much at the most (its hop, its stride), pitched between p0 and p1, with so much more room
    // to either hand (a runner's weave): its least distance from the line, or -1 where the make holds no such pitch.
    const bodyClear = (way, x, y, z, size, lift = 0, p0 = 0, p1 = p0, more = 0) => { const b = monkeyBody(way, size, p0, p1); return b ? clearOf(x, y + b[0], y + b[1] + lift, z, b[2] + more) : -1; };
    // (sitting, or hopping so high at its place; going on level ground with the 0.26 m its stride lifts it at the most)
    const monkeyClear = (x, y, z, size, going = false, hop = 0) => (going ? bodyClear('run', x, y, z, size, 0.26) : bodyClear(hop > 0 ? 'hop' : 'sit', x, y, z, size, hop));
    // the size at which a monkey fits at a place: its own, or half way to a young one's, or a young one's; 0 where none fits
    const sizeThatFits = (kind, x, y, z, size, young, going, hop, need = MARGIN) => { for (const s of [size, 0.5 * (size + young), young]) { const c = monkeyClear(x, y, z, s, going, hop); if (c >= need) { keepLeast(kind, c); return s; } } return 0; };
    // THE DEALING (kept from the rounds before, for the order of the young ones' numbers alone): the first envelope a sitter was asked
    // by (0.8 of its size high, 0.45 of it out; hopping, a tenth of its size and its hop more). The young ones' numbers are dealt, one
    // set for every grown still sitter this envelope admits, in the order it admits them; whether a sitter, at what size, and its
    // young one in fact sit is asked by the true body. So a sitter the true body turns away or makes smaller moves no other.
    const sizeDealt = (x, y, z, size, young, hop, need) => { for (const s of [size, 0.5 * (size + young), young]) if (clearOf(x, y, y + 0.8 * s + (hop > 0 ? 0.1 * s + hop : 0), z, 0.45 * s) >= need) return s; return 0; };
    const metreAt = (x, z) => { let b = 1e9, bi = 0; for (let i = 0; i <= RN; i++) { const dx = RX[i] - x, dz = RZ[i] - z, d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } } return Math.min(PL, bi * 2.5); };
    // the metres flown at the route's places
    const S = { sill: metreAt(courseX(OUT_Z + 1), OUT_Z + 1), b1: metreAt(B1[0], B1[2]), turn0: metreAt(t1.x, t1.z), turn1: metreAt(t2.x, t2.z), leap: metreAt(LEAP.x, LEAP.z),
      cross: metreAt(CROSS[0], CROSS[2]), mouth: metreAt(M0[0], M0[2]), bridge0: metreAt(P.bridgeX, P.bridgeZ0), bridge1: metreAt(P.bridgeX, P.bridgeZ1), gate: metreAt(cxH, P.hallZ0 - 1),
      garden: metreAt(cxH, L.garden.z0 + 2), straight: metreAt(cxH, P.hallZ1 + 62), seat: metreAt(cxH, L.seat.z) };
    // the garden's standing stones are asked before the house is built: one that would stand within the margin of the way is not set up
    { const all = L.stones.length; L.stones = L.stones.filter((g) => fits('garden stones', g.x, L.floorY - 0.2, L.floorY - 0.2 + g.h, g.z, g.r * 1.5)); counts.gardenStones = [L.stones.length, all]; }
    await ctx.yield();

    // ------------------------------------------------------------ sky and light: the sun stands in the south-east, behind us and to the side
    const SKY = { day: { preset: 'day', el: 38, zenith: '#2a66c4', horizon: '#b4d8f4', fog: '#bfe0e6', fogD: 0.0021, exp: 1.0, amb: 1 },
      dawn: { preset: 'dawn', el: 13, fog: '#f2c4c0', fogD: 0.0036, exp: 1.08, amb: 1.7 },
      golden: { preset: 'goldenHour', el: 17, fog: '#f0c890', fogD: 0.0026, exp: 1.06, amb: 1.6 },
      night: { preset: 'night', el: 44, fog: '#31476e', fogD: 0.0024, exp: 1.5, amb: 1.7 } }[hour];
    // (amb: the shade's share of the light by the hour; a low sun or the moon leaves the shade too dark as the sky gives it)
    // (golden: the low sun stands in the south-west, so the fall is lit amber from the west)
    const sunAz = side * (hour === 'golden' ? -1 : 1) * (hour === 'golden' ? 128 : 136);
    const sky = makeSky({ rng: ST.sky, preset: SKY.preset, sunElevation: SKY.el, sunAzimuth: sunAz, ...(SKY.zenith ? { zenith: SKY.zenith, horizon: SKY.horizon } : {}),
      ...(night ? { bodyOverrides: { 0: { elevation: SKY.el, azimuth: sunAz, phase: 1, size: 3.2 } }, bake: true, renderer: ctx.renderer } : {}),
      clouds: { coverage: lerp(0.3, 0.5, mood), softness: 0.3, lit: night ? '#aeb9d6' : '#fffaf0' }, ground: night ? '#1d2c44' : '#5f9fae' });
    scene.add(sky.object);
    const sunDir = sky.lightDirection.clone().normalize();
    const fogCol = new THREE.Color(SKY.fog), caveFog = new THREE.Color(night ? '#1b2a33' : hour === 'golden' ? '#5a5038' : '#3f5a58');
    scene.fog = new THREE.FogExp2(fogCol.clone(), SKY.fogD); const CAVE_FOG_D = 0.0038;
    const rig = makeLightRig(sky, { bounce: 0.5, ambient: SKY.amb });
    scene.add(rig.object);
    await ctx.yield();

    // ------------------------------------------------------------ the ground
    // how fine the ground is drawn: cells of 1.6 m within some 26 m of the way up the gorge, of 3.2 m to some 50 m and so on by distance; the
    // lake's shore counts as 4 m off, the cliff's line as 14 m off (the lake's bed under the way is under water)
    const FB = [-420, -480, 420, 560], FC = 12, fnx = Math.ceil((FB[2] - FB[0]) / FC), fnz = Math.ceil((FB[3] - FB[1]) / FC), field = new Float32Array((fnx + 1) * (fnz + 1));
    { const src = []; for (let i = 0; i <= RN && i * 2.5 <= S.sill + 8; i += 2) src.push(side * RX[i], RZ[i], 0);
      for (let a = 0; a <= 24; a++) { const an = (a / 24 - 0.5) * Math.PI; src.push(side * Math.sin(an) * LAKE.ax, LAKE.cz + Math.cos(an) * LAKE.az, 4); }
      for (const sd of [-1, 1]) for (let z = wallZ(P, LAKE.ax) + 6; z < LAKE.cz; z += 8) src.push(side * sd * LAKE.ax, z, 4);
      for (let x = -WALL_HALF; x <= WALL_HALF; x += 8) src.push(side * x, wallZ(P, x), 14);
      // (round 3, A15: a place that cannot be the nearest by its squared distance is passed over before any root is taken; the answer
      // is the same. And the loop stands in a small function of its own: written straight into this long build it ran some twenty
      // times slower, as every long loop here does.)
      const sf = Float64Array.from(src), fill = (j0, j1) => { for (let j = j0; j <= j1; j++) for (let i = 0; i <= fnx; i++) { const x = FB[0] + i * FC, z = FB[1] + j * FC; let b = 1e9;
          for (let k = 0; k < sf.length; k += 3) { const dx = sf[k] - x, dz = sf[k + 1] - z, q = b - sf[k + 2], dd = dx * dx + dz * dz; if (q <= 0 || dd >= q * q) continue; const d = Math.sqrt(dd) + sf[k + 2]; if (d < b) b = d; } field[j * (fnx + 1) + i] = b; } };
      for (let j = 0; j <= fnz; j += 22) { fill(j, Math.min(fnz, j + 21)); await ctx.yield(); } }
    const focus = (x, z) => { const fi = clamp((x - FB[0]) / FC, 0, fnx - 0.001), fj = clamp((z - FB[1]) / FC, 0, fnz - 0.001), i = Math.floor(fi), j = Math.floor(fj), u = fi - i, v = fj - j, k = j * (fnx + 1) + i;
      return (field[k] * (1 - u) + field[k + 1] * u) * (1 - v) + (field[k + fnx + 1] * (1 - u) + field[k + fnx + 2] * u) * v; };
    await ctx.yield();
    // the ground's colours: mountain greens, darker with height; by the water a band of pale gravel, wet and dark at the edge; the beds
    const GC = { a: new THREE.Color('#4a8a3c'), b: new THREE.Color('#78a044'), high: new THREE.Color('#2f7040'), gravel: new THREE.Color('#a39c84'), wet: new THREE.Color('#4a5246'),
      bed: new THREE.Color('#6a8f78'), deep: new THREE.Color('#1f4a55') };
    const groundColor = (wx, z, h, ny, out) => { const x = side * wx, n1 = noise.n2(x * 0.02 + 5, z * 0.02), n2 = noise.n2(x * 0.11, z * 0.11 + 30);
      out.copy(GC.a).lerp(GC.b, sm(-0.4, 0.6, n1)).lerp(GC.high, sm(40, 170, h) * 0.7).multiplyScalar(1 + 0.16 * n2);
      if (z > zRamp(x) - 2) { const e = -Math.max(lakeIn(x, z), streamIn(x, z));
        if (e < 3.2) out.lerp(GC.gravel, sm(3.2, 1.2, e + n2 * 0.8)); if (e < 0.9) out.lerp(GC.wet, sm(0.9, 0.1, e));
        if (e < 0) out.lerp(GC.bed, sm(0, -1.5, e)).lerp(GC.deep, sm(-1.5, -9, e)); }
      return out; };
    const terrain = await T.makeTerrainAsync({ rng: ST.ground, noise, height: ground, color: groundColor, biome: 'tropical',
      palette: { rock: '#8b8a76', rockB: '#6c7264', rockSlope: [0.6, 0.86], strata: 0.4, strataScale: 11, streaks: 0.1, varnish: 0.12, patchAmount: 0.18, tufts: 1, pebbles: 0.35, clouds: night ? 0 : 0.35 },
      sunDir, bounds: FB, cell: 1.6, near: 12, levels: 6, focus, corridor: false, maxTriangles: 50000, skirt: 30 }, ctx.yield);
    terrain.object.name = 'the land'; scene.add(terrain.object);
    await ctx.yield();
    // where the cave's passage goes in through the cliff's line the ground's own triangles are left out (26 m broad, behind the gallery's back wall)
    { const ix = terrain.geometry.index.array, pp = terrain.geometry.attributes.position.array;
      for (let i = 0; i < ix.length; i += 3) { const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3, x = side * (pp[a] + pp[b] + pp[c]) / 3, z = (pp[a + 2] + pp[b + 2] + pp[c + 2]) / 3;
        if (Math.abs(x - P.mouthX) < 14 && z > -30 && z < 12) { const zr = zRamp(x); if (z > zr - 3.6 && z < zr + 4.5) ix[i + 1] = ix[i + 2] = ix[i]; }
        if (i % 45000 === 44997) await ctx.yield(); } }
    const groundAt = (x, z) => terrain.surfaceAt(side * x, z);
    const sunAt = (x, z) => terrain.shadeAt(side * x, z).sun;
    await ctx.yield();
    // the ground's height and sun for the troop: a picture of the stream's and the lake's land at 1.25 m (world x across, z down)
    const GB = { x0: -78, z0: 2, w: 156, d: 484 }, gnx = Math.round(GB.w / 1.25), gnz = Math.round(GB.d / 1.25), gd = new Uint16Array(gnx * gnz * 2), gh = new Float32Array(gnx * gnz), hf = THREE.DataUtils.toHalfFloat, so = {};
    for (let j = 0; j < gnz; j++) { const z = GB.z0 + (j + 0.5) * GB.d / gnz;
      for (let i = 0; i < gnx; i++) { const x = GB.x0 + (i + 0.5) * GB.w / gnx, k = (j * gnx + i) * 2, h = terrain.surfaceAt(x, z); gh[j * gnx + i] = h; gd[k] = hf(h); gd[k + 1] = hf(terrain.shadeAt(x, z, so).sun); }
      if (j % 8 === 7) await ctx.yield(); }
    const tGround = new THREE.DataTexture(gd, gnx, gnz, THREE.RGFormat, THREE.HalfFloatType);
    tGround.magFilter = tGround.minFilter = THREE.LinearFilter; tGround.needsUpdate = true;
    // IS A PLACE IN SIGHT FROM A PLACE OF THE WAY, BY THE LAND ALONE? The line between the two is walked every 3 m over the ground's picture;
    // the place is in sight when the ground nowhere stands above the line (the first 2 m and the last 4 m are not asked: a thing stands
    // on its own ground). firstSeen: the first metre of the way (asked every 5 m) from which any of a thing's places is in sight and,
    // if the thing has a reach of sight, within it. Before that metre the land hides it: the gorge's sides, its spur, the lake's sill.
    const hgt = (wx, z) => { const fx = (wx - GB.x0) / GB.w * gnx - 0.5, fz = (z - GB.z0) / GB.d * gnz - 0.5; if (fx < 0 || fz < 0 || fx > gnx - 1.001 || fz > gnz - 1.001) return groundP(side * wx, z);
      const i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, k = j * gnx + i; return lerp(lerp(gh[k], gh[k + 1], a), lerp(gh[k + gnx], gh[k + gnx + 1], a), b); };
    // WHAT IS DRAWN WHEN (round 3, A11, A12, A13). A band of the troop, a zone of stones and a clump of plants under the sky are not
    // drawn or left out by how far the eye is, and no monkey sinks away by the eye's distance. Such a thing is drawn from 16 m of
    // the way before the first place of the way from which ANY of its places is in sight, and from then on; one that is in sight
    // from the entry, or from the 60 m of the entry's axis behind it, is drawn from the first frame. EVERY place of the thing is
    // asked (every member's every place, every stone at its top, every plant at its crown's top), from the axis behind the entry
    // and from the way every 5 m. (NOT so the cave's own plants, the grass and the flowers: they keep the kit's reach of sight.)
    // The sight line is asked against THE DRAWN GROUND (seeH): inside the troop's picture that picture (the drawn ground at 1.25 m);
    // on the rest of the land the drawn ground itself, read every 2.5 m where a line first passes and kept. (The land's rule,
    // which is not what is drawn far from the way, is asked only beyond the land's bounds.)
    const SGC = 2.5, snx = Math.ceil((FB[2] - FB[0]) / SGC) + 1, snz = Math.ceil((FB[3] - FB[1]) / SGC) + 1, sgh = new Float32Array(snx * snz).fill(NaN);
    const sgAt = (i, j) => { const k = j * snx + i; let h = sgh[k]; if (h !== h) h = sgh[k] = terrain.surfaceAt(FB[0] + i * SGC, FB[1] + j * SGC); return h; };
    const seeH = (wx, z) => { const gx = (wx - GB.x0) / GB.w * gnx - 0.5, gz = (z - GB.z0) / GB.d * gnz - 0.5;
      if (gx >= 0 && gz >= 0 && gx <= gnx - 1.001 && gz <= gnz - 1.001) { const i = Math.floor(gx), j = Math.floor(gz), a = gx - i, b = gz - j, k = j * gnx + i; return lerp(lerp(gh[k], gh[k + 1], a), lerp(gh[k + gnx], gh[k + gnx + 1], a), b); }
      const qx = (wx - FB[0]) / SGC, qz = (z - FB[1]) / SGC; if (qx < 0 || qz < 0 || qx > snx - 1.001 || qz > snz - 1.001) return groundP(side * wx, z);
      const i = Math.floor(qx), j = Math.floor(qz), a = qx - i, b = qz - j; return lerp(lerp(sgAt(i, j), sgAt(i + 1, j), a), lerp(sgAt(i, j + 1), sgAt(i + 1, j + 1), a), b); };
    // (memo: where along its line the ground last hid this place; that spot is asked first from the next place of the way, where it
    // mostly hides it still, so a hidden place costs one question)
    const inSight = (ex, ey, ez, tx, ty, tz, memo = null, mi = 0) => { const d = Math.hypot(tx - ex, ty - ey, tz - ez), n = Math.ceil(d / 3);
      if (memo && memo[mi] > 0) { const f = memo[mi], s = f * d; if (s >= 2 && d - s >= 4 && seeH(lerp(ex, tx, f), lerp(ez, tz, f)) > lerp(ey, ty, f) + 0.2) return false; }
      for (let k = 1; k < n; k++) { const f = k / n, s = f * d; if (s < 2 || d - s < 4) continue; if (seeH(lerp(ex, tx, f), lerp(ez, tz, f)) > lerp(ey, ty, f) + 0.2) { if (memo) memo[mi] = f; return false; } }
      return true; };
    // the eyes: the entry's axis from 60 m behind it (a thing seen from there is there from the first frame), then the way every 5 m
    const eyes = []; for (let d = BACK; d > 0; d -= 5) eyes.push([QX[0] + backX * d, QY[0], QZ[0] + backZ * d, -Infinity]); for (let i = 0; i <= RN; i += 2) eyes.push([RX[i], RY[i], RZ[i], i * 2.5]);
    // firstSeen: places [x, y, z] in the world; within(q) says a place lies inside the cliff (the gallery, the passage, the hall), where
    // the sight line is asked through the openings (seenIn, below) and not over the land
    let seenIn = null;
    const firstSeen = (pts, within = null) => { const memo = new Float32Array(pts.length);
      for (const e of eyes) for (let k = 0; k < pts.length; k++) { const q = pts[k];
        if (within && within(q) ? seenIn(e[0], e[1], e[2], side * q[0], q[1], q[2]) : inSight(side * e[0], e[1], e[2], q[0], q[1], q[2], memo, k)) return e[3]; }
      return Infinity; };
    const LEAD = 16, PLANT_ROOM = 260000; let plantTris = 0;
    // what is drawn from a metre of the way on: { object, on, off } (the troop's bands, the stones' zones, the plants' clumps)
    const switches = [], spare = [], m4s = new THREE.Matrix4();
    // (round 3, A12) a scatter of plants under the sky is given to the kit with no cull distance (the kit then leaves its clumps'
    // visibility alone); each of its clumps (one mesh for each shape in each stretch of z) is drawn by its own sight test: every
    // plant of it asked at its crown's top. The typed distances at which the clumps came on (120 to 330 m) are gone.
    const bySight = async (sc) => { for (const mesh of sc.meshes) { const h = mesh.geometry.userData.height || 1, pts = []; let cx = 0, cy = 0, cz = 0;
        for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, m4s); const e = m4s.elements, q = [e[12], e[13] + h * Math.hypot(e[4], e[5], e[6]), e[14]]; pts.push(q); cx += q[0]; cy += q[1]; cz += q[2]; }
        const n = Math.max(1, pts.length); switches.push({ object: mesh, on: firstSeen(pts) - LEAD, off: Infinity, n: pts.length, at: [Math.round(cx / n), Math.round(cy / n), Math.round(cz / n), 0], plants: true }); await ctx.yield(); } };
    // the stream's course for the troop's trails: world x of its middle, how much longer its slanting stretches are, its half breadth, by z
    // (first row), and in the second row the z at which the course has run so many metres of its own length from its lower end (kept as the
    // difference from an even run, so that half floats hold it to a few centimetres): the trails are measured in those metres
    const cd = new Uint16Array((CN + 1) * 8), cArc = new Float32Array(CN + 1);
    for (let i = 0; i <= CN; i++) { const z = CZ0 + i * 0.5; cd[i * 4] = hf(side * cX[i]); cd[i * 4 + 1] = hf(courseSec(z)); cd[i * 4 + 2] = hf(cH[i]); cd[i * 4 + 3] = hf(cL[i]);
      if (i) cArc[i] = cArc[i - 1] + 0.5 * courseSec(z - 0.25); }
    const arcMax = cArc[CN], arcAt = (z) => tab(cArc, z);
    for (let j = 0, i = 0; j <= CN; j++) { const s = j * arcMax / CN; while (i < CN - 1 && cArc[i + 1] < s) i++;
      const z = CZ0 + 0.5 * (i + clamp((s - cArc[i]) / Math.max(1e-6, cArc[i + 1] - cArc[i]), 0, 1)); cd[(CN + 1 + j) * 4] = hf(z - CZ0 - s * (CZ1 - CZ0) / arcMax); }
    const tCourse = new THREE.DataTexture(cd, CN + 1, 2, THREE.RGBAFormat, THREE.HalfFloatType);
    tCourse.magFilter = tCourse.minFilter = THREE.LinearFilter; tCourse.needsUpdate = true;
    await ctx.yield();

    // ------------------------------------------------------------ the light's colours by the hour, shared by every set piece
    const HOURS = {
      day: { fallLit: '#ffffff', fallShade: '#7f9cc6', fallDeep: '#2f5068', inner: '#fff4cf', mistLit: '#ffffff', mistShade: '#9fb8d6', bow: 1, caveAmb: '#48707f', waterLight: '#f0f6ea', waterK: 2.2, shaft: '#ffdc94', shaftK: 3.2, ring: '#ffecc8', ringK: 1.7 },
      dawn: { fallLit: '#ffe9e0', fallShade: '#a48fb6', fallDeep: '#4a4a70', inner: '#ffd9c8', mistLit: '#ffd6d2', mistShade: '#b89cc0', bow: 0.5, caveAmb: '#4a5a74', waterLight: '#ffe4d8', waterK: 2.0, shaft: '#ffc890', shaftK: 2.6, ring: '#ffecc8', ringK: 1.7 },
      golden: { fallLit: '#ffdca0', fallShade: '#a98f96', fallDeep: '#4a4660', inner: '#ffd27a', mistLit: '#ffe2b0', mistShade: '#b89a96', bow: 0.7, caveAmb: '#5a5a58', waterLight: '#ffd898', waterK: 2.2, shaft: '#ffc468', shaftK: 2.9, ring: '#ffecc8', ringK: 1.7 },
      night: { fallLit: '#cfdcf8', fallShade: '#52679a', fallDeep: '#1a2844', inner: '#b9cff4', mistLit: '#b4c6ea', mistShade: '#4a5c88', bow: 0, caveAmb: '#35506f', waterLight: '#b4cdf4', waterK: 2.0, shaft: '#c0d2f4', shaftK: 2.0, ring: '#ffecc8', ringK: 1.9 },
    }[hour];
    const U = makeUniforms(P, L);
    placeUniforms(U, P, L, side);
    U.uSunDir.value.copy(sunDir);
    U.uFallLit.value.set(HOURS.fallLit); U.uFallShade.value.set(HOURS.fallShade); U.uFallDeep.value.set(HOURS.fallDeep); U.uFallInner.value.set(HOURS.inner);
    U.uMistLit.value.set(HOURS.mistLit); U.uMistShade.value.set(HOURS.mistShade); U.uBow.value = HOURS.bow;
    U.uCaveAmb.value.set(HOURS.caveAmb); U.uWaterLight.value.set(HOURS.waterLight).multiplyScalar(HOURS.waterK);
    U.uShaftCol.value.set(HOURS.shaft).multiplyScalar(HOURS.shaftK); U.uRingCol.value.set(HOURS.ring).multiplyScalar(HOURS.ringK);
    // (round 3, A6) the cave's own air, which what stands behind the sheet wears as its own: the hour's tone, the cave's density
    U.uCaveAir.value.set(caveFog.r, caveFog.g, caveFog.b, CAVE_FOG_D);
    // the troop's light outside (the sun and the sky) and inside (the water's light from the curtain, shaking)
    const keyCol = sky.lightColor.clone().multiplyScalar(sky.lightIntensity * 0.42), skyCol = sky.ambientColor.clone().multiplyScalar(sky.ambientIntensity * 0.3 * SKY.amb), gndCol = sky.groundColor.clone().multiplyScalar(sky.ambientIntensity * 0.22 * SKY.amb);
    const UO = { uTime: U.uTime, tGround: { value: tGround }, uGBox: { value: new THREE.Vector4(GB.x0, GB.z0, 1 / GB.w, 1 / GB.d) }, tCourse: { value: tCourse }, uCBox: { value: new THREE.Vector2(CZ0 - 0.25, 1 / (CZ1 - CZ0 + 0.5)) },
      uArc: { value: new THREE.Vector4(CN / (arcMax * (CN + 1)), 0.5 / (CN + 1), CZ0, (CZ1 - CZ0) / arcMax) },
      uKeyDir: { value: sunDir }, uKeyCol: { value: keyCol }, uSky: { value: skyCol }, uGround: { value: gndCol }, uRipple: { value: 0 },
      // (round 3, A6: a troop under the sky wears the day's air; the house's troop the cave's; those who leap through the sheet each by its own z)
      uCaveAir: U.uCaveAir };
    // (round 3, A5: the house's troop reads the picture of the house's own floors where the land's troop reads the land's; made below, once the house is built)
    const UI = { ...UO, uAirZ: { value: 1e6 }, tGround: { value: null }, uGBox: { value: new THREE.Vector4() }, uKeyDir: { value: new THREE.Vector3(0.35 * side, 0.45, 0.82).normalize() }, uKeyCol: { value: U.uWaterLight.value.clone().multiplyScalar(0.5) },
      uSky: { value: U.uCaveAmb.value.clone().multiplyScalar(1.1) }, uGround: { value: U.uCaveAmb.value.clone().multiplyScalar(0.7) }, uRipple: { value: 1 },
      uWayA: { value: new THREE.Vector4(side * P.bridgeX, P.bridgeZ0 + 1.5 + P.headRamp, P.bridgeZ1 - 1.4, P.deckY + 0.03) }, uWayB: { value: new THREE.Vector4(side * cxH, P.hallZ0 - 2, L.floorY + 0.03, P.galY + 0.08) } };
    // the leapers go through the sheet: the sun's light before it, the cave's behind it, each by its own place
    const UL = { ...UO, uAirZ: U.uAirZ, uWayB: UI.uWayB, uSheetZ: { value: P.sheetZ }, uKeyDir2: UI.uKeyDir, uKeyCol2: UI.uKeyCol, uSky2: UI.uSky, uGround2: UI.uGround };

    // ------------------------------------------------------------ the fall, its cliff, the gallery, the cave and the house (the set pieces)
    const rockMat = T.makeRockMaterial({ rng: ST['cliff rock'], terrain, top: '#4f7a3a', topAmount: 0.7, topSlope: [0.45, 0.8], contact: [6, 0.35, 0], strata: 0.5 });
    await ctx.yield();
    // THE HOME (B3): two more stoves, heaps of fruit, garlands, vines and the strands in the roof's crack, laid by the part's rule from three
    // streams of their own; every one is asked with its whole body and stands only where it keeps the margin from the way
    const home = layoutHome(P, L, { stoves: ST['house stoves'], heaps: ST['fruit heaps'], hangs: ST.hangings }, (kind, x, y0, y1, z, r) => fits(kind, x, y0, y1, z, r));
    counts.home = [home.stoves.length, home.heaps.length, home.garlands.length, home.vines.length, home.strands.length];
    homeUniforms(U, L, home, side);
    const hero = await buildHero(ctx, { P, L, side, U, rockMaterial: rockMat, home });
    hero.object.name = 'the fall and the house'; hero.shell.name = 'the cave'; hero.things.name = 'the hall\'s things'; hero.fall.object.name = 'the fall'; hero.mist.object.name = 'mist of the fall'; scene.add(hero.object);
    await ctx.yield();
    // THE HOUSE'S FLOORS AS BUILT (round 3, A5): a picture of the floor's height at every half metre, read from the built shell itself
    // (every face of it that looks up and lies between 1.2 m under the gallery's floor and 0.25 m over the deck: the gallery's and
    // the passage's floor with their lumps, the ramp, the deck, the gate's threshold, the hall's floor, the highest of them over a
    // place, asked at every quarter metre). A half-metre place holds the mean of its highest and its lowest floor, and never less
    // than its highest less 0.05 m: on a slope that is the floor at its middle (the ramp's rise is 0.07 m to a quarter metre),
    // and where the floor steps within the place (the threshold's two risers, the ramp's sides, the deck's edge) it is the step's
    // top, so that no foot goes into a step.
    // The bridge's comers and goers have their feet on it, in the shader and in the asking.
    const FLB = { x0: side > 0 ? -46 : -28, z0: -246, w: 74, d: 244 }, fnxF = FLB.w * 4 + 1, fnzF = FLB.d * 4 + 1, flx = FLB.w * 2, flz = FLB.d * 2, fh = new Float32Array(flx * flz).fill(-1e9), fq = new Float32Array(fnxF * fnzF).fill(-1e9);
    // (worked in small functions of their own, for speed: see the ground's field above; and in pieces with a breath between them, so
    // that no step of the build is long: the shell's faces two thousand at a time, the half-metre places thirty-two rows at a time,
    // the eight passes one by one. The pieces are worked in the one order and nothing else writes these fields: the floors are the
    // same to the last bit as when they were worked in one go.)
    const floorFaces = (iA, iB) => { const g = hero.shell.geometry, pp = g.attributes.position.array, ix = g.index.array, yLo = P.galY - 1.2, yHi = P.deckY + 0.25;
      for (let i = iA; i < iB; i += 3) { const a = ix[i] * 3, b = ix[i + 1] * 3, c = ix[i + 2] * 3, ay = pp[a + 1], by = pp[b + 1], cy = pp[c + 1];
        if (ay < yLo || by < yLo || cy < yLo || ay > yHi || by > yHi || cy > yHi) continue;
        const ax = pp[a], az = pp[a + 2], bx = pp[b], bz = pp[b + 2], cx = pp[c], cz = pp[c + 2], den = (bx - ax) * (cz - az) - (cx - ax) * (bz - az);
        // (a face that looks up or down has some breadth in plan; one that looks down lies under a floor and is the lower of the two)
        if (Math.abs(den) < 1e-6 || Math.abs(den) < 0.5 * Math.hypot((by - ay) * (cz - az) - (cy - ay) * (bz - az), (bx - ax) * (cy - ay) - (cx - ax) * (by - ay), den)) continue;
        const i0 = Math.max(0, Math.ceil((Math.min(ax, bx, cx) - FLB.x0) * 4)), i1 = Math.min(fnxF - 1, Math.floor((Math.max(ax, bx, cx) - FLB.x0) * 4)), j0 = Math.max(0, Math.ceil((Math.min(az, bz, cz) - FLB.z0) * 4)), j1 = Math.min(fnzF - 1, Math.floor((Math.max(az, bz, cz) - FLB.z0) * 4));
        for (let j = j0; j <= j1; j++) for (let k = i0; k <= i1; k++) { const x = FLB.x0 + k * 0.25, z = FLB.z0 + j * 0.25, u = ((x - ax) * (cz - az) - (cx - ax) * (z - az)) / den, v = ((bx - ax) * (z - az) - (x - ax) * (bz - az)) / den;
          if (u < -1e-4 || v < -1e-4 || u + v > 1.0001) continue; const y = ay + u * (by - ay) + v * (cy - ay); if (y > fq[j * fnxF + k]) fq[j * fnxF + k] = y; } } };
    // (a half-metre place: its middle and the eight quarter-metre places on its edge)
    const floorPlaces = (jA, jB) => {
      for (let jj = jA; jj < jB; jj++) for (let ii = 0; ii < flx; ii++) { let hi = -1e9, lo = 1e9;
        for (let j = 2 * jj; j <= 2 * jj + 2; j++) for (let k = 2 * ii; k <= 2 * ii + 2; k++) { const y = fq[j * fnxF + k]; if (y > -1e8) { if (y > hi) hi = y; if (y < lo) lo = y; } }
        fh[jj * flx + ii] = hi > -1e8 ? hi - Math.min(0.05, (hi - lo) / 2) : hi; } };
    // (a place with no floor of the house over it, beside the deck over the water or in the rock, takes its nearest neighbour's,
    // eight places out at the most, then the deck's: none of the troop stands there. Asked from the gallery to 8 m past the gate,
    // where the floors have edges; the hall's floor beyond is whole.)
    const floorPass = (jLo) => { const prev = fh.slice(jLo * flx); for (let j = jLo; j < flz; j++) for (let i = 0; i < flx; i++) { if (fh[j * flx + i] > -1e8) continue; let y = -1e9;
          const o = (j - jLo) * flx + i; if (i > 0) y = Math.max(y, prev[o - 1]); if (i < flx - 1) y = Math.max(y, prev[o + 1]); if (j > jLo) y = Math.max(y, prev[o - flx]); if (j < flz - 1) y = Math.max(y, prev[o + flx]); fh[j * flx + i] = y; } };
    { const nIx = hero.shell.geometry.index.array.length, jLo = Math.max(0, Math.floor((P.hallZ0 - 8 - FLB.z0) * 2));
      for (let i = 0; i < nIx; i += 6000) { floorFaces(i, Math.min(nIx, i + 6000)); await ctx.yield(); }
      for (let j = 0; j < flz; j += 32) { floorPlaces(j, Math.min(flz, j + 32)); await ctx.yield(); }
      for (let pass = 0; pass < 8; pass++) { floorPass(jLo); await ctx.yield(); }
      for (let k = 0; k < flx * flz; k++) { if (!(fh[k] > -1e8)) fh[k] = P.deckY; fh[k] += 0.03; } }
    await ctx.yield();
    { const fd = new Uint16Array(flx * flz * 2); { const one = hf(1); for (let k = 0; k < flx * flz; k++) { fd[k * 2] = hf(fh[k]); fd[k * 2 + 1] = one; } }
      const tFloor = new THREE.DataTexture(fd, flx, flz, THREE.RGFormat, THREE.HalfFloatType); tFloor.magFilter = tFloor.minFilter = THREE.LinearFilter; tFloor.needsUpdate = true;
      UI.tGround.value = tFloor; UI.uGBox.value.set(FLB.x0, FLB.z0, 1 / FLB.w, 1 / FLB.d); spare.push(tFloor); }
    // the floor's height (with the 0.03 m a foot stands over it) at a place, as the troop's shader reads the picture
    const floorAt = (x, z) => { const fx = clamp((side * x - FLB.x0) * 2 - 0.5, 0, flx - 1.001), fz = clamp((z - FLB.z0) * 2 - 0.5, 0, flz - 1.001), i = Math.floor(fx), j = Math.floor(fz), a = fx - i, b = fz - j, k = j * flx + i;
      return lerp(lerp(fh[k], fh[k + 1], a), lerp(fh[k + flx], fh[k + flx + 1], a), b); };
    await ctx.yield();
    // THE HOUSE'S OWN THINGS AND THE WAY (A6), by measure: these stand where the plan puts them, and the way is laid over and between them;
    // the least distance of each kind is kept beside those of the placed things (the plan's rules give them the margin: the tall jars
    // stand on the half of a table away from the way, the seat's back ends 2.4 m under the ring's middle)
    { const fy = L.floorY, m = (kind, x, y0, y1, z, rho) => keepLeast(kind, clearOf(x, y0, y1, z, rho));
      for (const t of L.tables) { const c = Math.cos(t.rot), s = Math.sin(t.rot);
        for (let k = -0.5; k <= 0.51; k += 0.125) { m('tables', t.x + k * t.len * s, fy, t.top, t.z + k * t.len * c, t.w / 2);
          for (const sd of [-1, 1]) { const lx = sd * (t.w / 2 + 1); m('benches', t.x + lx * c + k * 0.92 * t.len * s, fy, fy + 0.63, t.z - lx * s + k * 0.92 * t.len * c, 0.4); } } }
      for (const q of L.tableThings) m('bowls and jars', q.x, q.y0, q.y1, q.z, q.r);
      for (const q of L.teeth) m('roof teeth', q.x, q.y0, q.y1, q.z, q.r);
      for (const p of L.posts) m('posts', p.x, fy, fy + 2 + p.h, p.z, 1.5);
      for (const c of L.columns) m('columns', c.x, fy, fy + P.hallHigh, c.z, c.r * 2.3 + Math.abs(c.lean) * P.hallHigh);
      for (const d of L.beds) m('beds', d.x, fy, d.top + 0.2, d.z, 1.9);
      for (const j of L.jars) m('floor jars', j.x, fy, fy + j.h, j.z, j.r);
      m('the stove', L.stove.x, fy, fy + L.stove.h + 6, L.stove.z, 4);
      m('the seat', L.seat.x, L.seat.y, L.seat.y + P.seatH, L.seat.z - 1.25, 2.3); m('the seat', L.seat.x, L.seat.y, L.seat.y + 3.5, L.seat.z, 3.1);
      for (const sd of [-1, 1]) { m('the gate', P.hallX + sd * 8.6, fy, fy + 12, P.hallZ0 + 1.4, 1.9); for (let z = P.bridgeZ0 + 1.5; z > P.bridgeZ1 - 1.5; z -= 2) m('bridge rails', P.bridgeX + sd * (P.bridgeW / 2 - 0.14), P.deckY - 1, P.deckY + 1.4, z, 0.25); }
      for (let x = -9; x <= 9; x += 1.5) m('the gate', P.hallX + x, fy + 12, fy + 15.2, P.hallZ0 + 1.4, 1.5);
      for (let z = P.bridgeZ0 + 1.5; z > P.bridgeZ1 - 1.5; z -= 2) m('bridge deck', P.bridgeX, P.deckY - 0.3, P.deckY, z, P.bridgeW / 2);
      m('the leaping rock', LEAP.x, -2, LEAP.top + 0.1, LEAP.z, LEAP.r * 1.25); m('the islet', ISLET.x, -2, ISLET.h + 1, ISLET.z, ISLET.r * 1.4);
      // the floors and the water under the way, and the rim of the cave's mouth it goes through
      for (let i = 0; i <= QN; i++) { const z = QZ[i], y = QY[i], x = QX[i];
        if (z < P.hallZ0) keepLeast('hall floor', y - fy); else if (z < P.galBack) keepLeast('passage floor', y - Math.min(P.galY, P.deckY)); else if (z < P.galFront) keepLeast('gallery floor', y - P.galY);
        else if (z < OUT_Z) keepLeast('the lake', y); else keepLeast('the stream', y - level(z));
        if (z > 20) { const c = y - hgt(side * x, z); keepLeast('the ground', c); if (!(counts.groundLeast && counts.groundLeast[0] <= c)) counts.groundLeast = [r2(c), Math.round(i * 0.625)]; } }
      // behind the entry: the axis over the pool's water and the ground under it, and how far to either hand the ground stays under the
      // axis's own height (asked every 0.5 m out to 15 m), for the last 30 m and for 30 to 60 m
      for (let i = QN + 1; i <= QM; i++) { const d = (i - QN) * 0.625, x = QX[i], z = QZ[i], y = QY[i], part = d <= 30 ? 'last 30 m' : '30 to 60 m'; let free = 15;
        keepLeast('entry axis over ground or water, ' + part, y - Math.max(level(z), hgt(side * x, z)));
        for (const sd of [-1, 1]) for (let o = 0.5; o < free; o += 0.5) if (hgt(side * (x - backZ * o * sd), z + backX * o * sd) > y) free = o;
        keepLeast('entry axis, ground under its height to either hand, ' + part, free); }
      keepLeast('the mouth\'s rim', Math.min(9.1 - Math.abs(M0[0] - P.mouthX), P.galY + 13.1 - M0[1])); }
    // what is seen only from outside the rock, and what only from behind the water
    const outside = new THREE.Group(), inside = new THREE.Group();
    scene.add(outside, inside);
    // THE HALL BEHIND ITS GATE. What stands in the hall (its tables, beds, stoves, heaps, columns, trees, hangings, fires) is ringed by the
    // cliff's own rock; from before the water it can be seen only along a straight line that passes the gallery's opening in the cliff, over
    // the gallery's floor, through the cave's mouth in the gallery's back wall and through the throat at the gate (the passage is 9.3 m to
    // either hand and 14.2 m high there). The hall's things are drawn from 5 m before the first metre of the way from which such a line
    // exists (each opening taken a metre wider than it is built; the land before the cliff asked as for everything else), and from then
    // on for the rest of the visit: before that metre the cliff stands between. Thirty-five places of the throat are asked.
    await ctx.yield();
    const hall = new THREE.Group(); inside.add(hall);
    const hallSeen = (i) => { const ex = RX[i], ey = RY[i], ez = RZ[i]; if (ez < P.galBack + 1) return true;
      for (let a = 0; a < 7; a++) for (let c = 0; c < 5; c++) { const gx = P.hallX + (a / 3 - 1) * 10.3, gy = P.deckY - 0.5 + c / 4 * 15.7, gz = P.hallZ0;
        const at = (z) => { const k = (ez - z) / (ez - gz); return [lerp(ex, gx, k), lerp(ey, gy, k)]; };
        // the mouth: 10.5 m to either hand with its lip of 1.6 m, and the metre
        const [mx, my] = at(P.galBack), q = (mx - P.mouthX) / 13.1;
        if (Math.abs(q) >= 1 || my < P.galY - 1 || my > P.galY + 17.2 * Math.pow(1 - q * q, 0.3)) continue;
        // (the eye is in the gallery itself)
        if (ez < P.galFront) return true;
        let zc = wallZ(P, mx), [cx, cy] = at(zc); zc = wallZ(P, cx); [cx, cy] = at(zc);
        // the gallery's opening in the cliff
        const [lo, hi] = galOpening(P, cx); if (cy < lo - 1 || cy > hi + 1) continue;
        // the gallery's floor
        const [rx, ry] = at(galRimZ(P, cx)); if (ry < P.galY - 1 && galRimZ(P, cx) < ez) continue;
        // the land before the cliff
        if (ez > zc + 6 && !inSight(side * ex, ey, ez, side * cx, cy, zc)) continue;
        return true; }
      return false; };
    let hallOn = S.cross; for (let i = 0; i <= RN; i++) if (hallSeen(i)) { hallOn = Math.min(hallOn, i * 2.5 - 5); break; }
    counts.hallOn = Math.round(hallOn); counts.runLift = Math.round(runLift * 100) / 100;
    // (round 3, A11) IS A PLACE INSIDE THE CLIFF IN SIGHT FROM A PLACE OF THE WAY? By the hall's own rule above, for any place: a place
    // behind the gallery's back wall is seen only through the cave's mouth; from before the gallery, only through the gallery's opening
    // in the cliff, over the gallery's floor and over the land before the cliff. (An eye in the passage or beyond sees it.)
    seenIn = (ex, ey, ez, gx, gy, gz) => { if (ez < P.galBack + 1 || Math.abs(ez - gz) < 1e-3) return true;
      const at = (z) => { const k = (ez - z) / (ez - gz); return [lerp(ex, gx, k), lerp(ey, gy, k)]; };
      // (a place beyond the gate: only through the throat at the gate, a metre wider than it is built, as the hall's own rule has it)
      if (gz < P.hallZ0 - 0.5) { const [hx, hy] = at(P.hallZ0); if (Math.abs(hx - P.hallX) > 10.3 || hy < P.deckY - 0.5 || hy > P.deckY + 15.2) return false; }
      if (gz < P.galBack) { const [mx, my] = at(P.galBack), q = (mx - P.mouthX) / 13.1; if (Math.abs(q) >= 1 || my < P.galY - 1 || my > P.galY + 17.2 * Math.pow(1 - q * q, 0.3)) return false; }
      if (ez < P.galFront) return true;
      let zc = wallZ(P, gx), [cx, cy] = at(zc); zc = wallZ(P, cx); [cx, cy] = at(zc);
      const [lo, hi] = galOpening(P, cx); if (cy < lo - 1 || cy > hi + 1) return false;
      // (the gallery's floor at its rim: its lumps lie within 0.36 m of its height; a line 0.45 m under it is in the rock)
      const ry = at(galRimZ(P, cx))[1]; if (ry < P.galY - 0.45 && galRimZ(P, cx) < ez) return false;
      return !(ez > zc + 6 && !inSight(side * ex, ey, ez, side * cx, cy, zc)); };
    await ctx.yield();
    const updaters = [];

    // ------------------------------------------------------------ the water outside: the lake and the stream as one surface
    // Every point of it carries: how deep the water is there, which way and how fast it runs (metres a second), whether it is falling
    // (the small falls' faces), how much white it bears (under a fall, round a lip), and how much sun reaches it.
    const footZ = hero.footZ, wPos = [], wA = [], wB = [], wIdx = [];
    const wVert = (x, y, z, depth, fx, fz, fall, foam, encl, across = 0) => { wPos.push(side * x, y, z); wA.push(depth, side * fx, fz, fall); wB.push(foam, sunAt(x, z), encl, across); return wPos.length / 3 - 1; };
    // the lake: a grid of 2.4 m, left out where no corner is in the water; it runs softly to the outlet and is thrown outward from the fall's foot
    { const x0 = -LAKE.ax - 2.4, z0 = 5.6, nx = 52, nz = 71, id = new Int32Array((nx + 1) * (nz + 1)).fill(-1), dp = new Float32Array((nx + 1) * (nz + 1));
      for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) dp[j * (nx + 1) + i] = -groundS(x0 + i * 2.4, z0 + j * 2.4);
      const vAt = (i, j) => { const k = j * (nx + 1) + i; if (id[k] >= 0) return id[k]; const x = x0 + i * 2.4, z = z0 + j * 2.4;
        const fd = Math.hypot(Math.max(0, Math.abs(x) - P.W / 2), z - footZ), near = Math.exp(-fd / 16), ox = x, oz = OUT_Z - z, ol = Math.hypot(ox, oz) || 1;
        const sx = x / (Math.abs(x) + 30), fx = lerp(-ox / ol * 0.35, sx * 0.9, near), fz = lerp(oz / ol * 0.35, 1.9, near) + 0.9 * Math.exp(-ol / 14);
        return (id[k] = wVert(x, 0.02, z, dp[k], fx, fz, 0, clamp(1.25 * Math.exp(-fd / 11) + 0.5 * Math.exp(-ol / 9), 0, 1), 0.35 + 0.4 * sm(40, 5, lakeIn(x, z)))); };
      for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const k = j * (nx + 1) + i; if (Math.max(dp[k], dp[k + 1], dp[k + nx + 1], dp[k + nx + 2]) < -0.4) continue;
        const a = vAt(i, j), b = vAt(i + 1, j), c = vAt(i, j + 1), d = vAt(i + 1, j + 1); if (side > 0) wIdx.push(a, c, b, b, c, d); else wIdx.push(a, b, c, b, d, c); } }
    await ctx.yield();
    // the stream: rows across the course every metre, every 0.2 m where it falls; twelve cells from bank to bank and 1.6 m into each bank
    { const rows = []; let z = OUT_Z - 2;
      while (z < CZ1 - 2) { rows.push(z); let near = 9; for (const f of falls) near = Math.min(near, Math.abs(z - f.z)); z += near < 2.1 ? 0.2 : near < 3.2 ? 0.5 : 1; }
      const NA = 12; let prev = -1;
      for (const zr of rows) { const cx0 = courseX(zr), sec = courseSec(zr), hw = half(zr) + 1.6, fallRow = clamp(Math.abs(levelRaw(zr + 0.15) - levelRaw(zr - 0.15)) / 0.75, 0, 1); let pool = 0, lip = 0;
        for (const f of falls) { const d = zr - f.z; if (d > 0) pool = Math.max(pool, Math.exp(-d / 7)); else lip = Math.max(lip, Math.exp(d / 2.5)); }
        const sl = courseSlope(zr), base = wPos.length / 3;
        for (let i = 0; i <= NA; i++) { const t = (2 * i / NA - 1), x = cx0 + t * hw * sec, edge = Math.abs(t) * hw - (hw - 1.6);
          // where it falls every strip of the water is thrown its own way out (up to 0.9 m further, a lobe some 3 m broad), so the face stands in lobes
          const zo = zr - 0.9 * (1 - 0.45 * t * t) * clamp(0.5 + 0.75 * noise.n2(x * 0.3 + 3, zr * 0.02), 0, 1), wl = levelRaw(zo), fall = clamp(Math.abs(levelRaw(zo + 0.15) - levelRaw(zo - 0.15)) / 0.75, 0, 1), speed = 1.1 + 2.4 * lip + 1.6 * pool + 4 * fallRow;
          const depth = fall > 0.05 ? 1.2 : Math.min(2.2, wl - groundS(x, zr)), rough = 0.5 + 0.5 * noise.n2(x * 0.4, zr * 0.4);
          wVert(x, wl + 0.05, zr, depth, sl / sec * speed, speed / sec, fall, clamp(0.95 * pool + 0.45 * lip + fall + 0.25 * rough * sm(-1.4, 0.2, edge), 0, 1), 0.85, Math.abs(t)); }
        if (prev >= 0) for (let i = 0; i < NA; i++) { const a = prev + i, b = a + 1, c = base + i, d = c + 1; if (side > 0) wIdx.push(a, c, b, b, c, d); else wIdx.push(a, b, c, b, d, c); }
        prev = base; if (rows.indexOf(zr) % 100 === 99) await ctx.yield(); } }
    await ctx.yield();
    const waterGeo = new THREE.BufferGeometry();
    waterGeo.setAttribute('position', new THREE.Float32BufferAttribute(wPos, 3)); waterGeo.setAttribute('aA', new THREE.Float32BufferAttribute(wA, 4)); waterGeo.setAttribute('aB', new THREE.Float32BufferAttribute(wB, 4));
    waterGeo.setIndex(wIdx); waterGeo.computeBoundingSphere();
    // (round 3, A10) THE WATER AS DRAWN over a place: the highest face of the water's own mesh on the upright line through the place
    // (-Infinity: none). At a small fall the face is thrown out up to 0.9 m beyond the step of the stream's level, and stands over
    // the pool there; one who wades is asked by it (seat, below).
    const waterTopAt = (wx, z) => { let top = -Infinity;
      for (let i = 0; i < wIdx.length; i += 3) { const a = wIdx[i] * 3, b = wIdx[i + 1] * 3, c = wIdx[i + 2] * 3, x0 = wPos[a] - wx, z0 = wPos[a + 2] - z, x1 = wPos[b] - wx, z1 = wPos[b + 2] - z, x2 = wPos[c] - wx, z2 = wPos[c + 2] - z;
        if ((x0 > 0 && x1 > 0 && x2 > 0) || (x0 < 0 && x1 < 0 && x2 < 0) || (z0 > 0 && z1 > 0 && z2 > 0) || (z0 < 0 && z1 < 0 && z2 < 0)) continue;
        const d = x0 * (z1 - z2) + x1 * (z2 - z0) + x2 * (z0 - z1); if (Math.abs(d) < 1e-9) continue; const w0 = (x1 * z2 - x2 * z1) / d, w1 = (x2 * z0 - x0 * z2) / d, w2 = 1 - w0 - w1;
        if (w0 < 0 || w1 < 0 || w2 < 0) continue; top = Math.max(top, w0 * wPos[a + 1] + w1 * wPos[b + 1] + w2 * wPos[c + 1]); }
      return top; };
    await ctx.yield();
    // The water's look, in the world's own metres: ripples of 1.2 m and 0.4 m carried by the flow (drawn twice half a cycle apart and faded
    // into each other, so they never stretch) and by a light wind; the sky above and the banks' green in it by the angle of sight, and the
    // great fall with its rock standing in the lake; turquoise over the shallows, deep green-blue over the deeps, clear at the very edge;
    // the sun's glitter; white with form where it has fallen, where it quickens and round the stones; strands riding down where it falls.
    const waterMat = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false,
      uniforms: { ...fx.fogUniforms(), uTime: U.uTime, uSunDir: { value: sunDir }, uSunCol: { value: sky.lightColor.clone().multiplyScalar(night ? 1.2 : 2.2) },
        uZen: { value: sky.zenithColor.clone() }, uHor: { value: sky.horizonColor.clone() }, uBank: { value: new THREE.Color(night ? '#0d1a20' : '#28562a') },
        uShallow: { value: new THREE.Color('#5cc6c6') }, uDeep: { value: new THREE.Color('#0e5460') }, uFoamLit: U.uFallLit, uFoamShade: U.uFallShade,
        uFall: { value: new THREE.Vector4(footZ, P.W / 2, P.H, 0) }, uRock: { value: new THREE.Color('#66685a') }, uDay: { value: night ? 0.6 : hour === 'day' ? 1 : 0.95 } },
      vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec4 aA, aB; varying vec3 vW; varying vec4 vA, vB;
        void main() { vW = position; vA = aA; vB = aB; vec4 mvPosition = viewMatrix * vec4(position, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
      fragmentShader: fx.GLSL_FOG_PARS_FRAG + NOISE_GLSL + /* glsl */`
        uniform float uTime, uDay; uniform vec3 uSunDir, uSunCol, uZen, uHor, uBank, uShallow, uDeep, uFoamLit, uFoamShade, uRock; uniform vec4 uFall;
        varying vec3 vW; varying vec4 vA, vB;
        float hgt(vec2 p) { return hNoise(p * .85) * .6 + hNoise(p * 2.6 + 4.) * .4; }
        float strands(float ac, float y, float t) { return hNoise(vec2(ac * 1.3, y * .4 + t * 2.4)) * .5 + hNoise(vec2(ac * 4.6 + 7., y * 1.2 + t * 4.6)) * .32 + hNoise(vec2(ac * 11., y * 2.6 + t * 7.)) * .18; }
        void main() {
          float depth = vA.x, fall = clamp(vA.w, 0., 1.), sun = clamp(vB.y, 0., 1.), encl = clamp(vB.z, 0., 1.);
          vec2 fl = vA.yz; float sp = length(fl);
          float ph = fract(uTime * .45), ph2 = fract(uTime * .45 + .5), w1 = 1. - abs(2. * ph - 1.), w2 = 1. - w1;
          vec2 dr = vec2(.23, .11) * uTime, p1 = vW.xz - fl * (ph - .5) * 2.2 + dr, p2 = vW.xz - fl * (ph2 - .5) * 2.2 + dr + 13.7;
          float e = .14, h = hgt(p1) * w1 + hgt(p2) * w2;
          float hx = (hgt(p1 + vec2(e, 0.)) * w1 + hgt(p2 + vec2(e, 0.)) * w2 - h) / e, hz = (hgt(p1 + vec2(0., e)) * w1 + hgt(p2 + vec2(0., e)) * w2 - h) / e;
          float amp = mix(.09, .3, clamp(sp * .35, 0., 1.)) * (1. - .85 * smoothstep(.04, .3, fall));
          vec3 n = normalize(vec3(-hx * amp, 1., -hz * amp)), v = normalize(cameraPosition - vW);
          float nv = clamp(dot(n, v), 0., 1.), fres = .03 + .97 * pow(1. - nv, 5.);
          vec3 r = reflect(-v, n); r.y = abs(r.y);
          vec3 skyc = mix(uHor, uZen, pow(clamp(r.y, 0., 1.), .6));
          float bk = 1. - smoothstep(encl * .35, encl * .95, r.y);
          vec3 refl = mix(skyc, uBank * (.7 + .6 * hNoise(vW.xz * .15 + r.xz * 3.)), bk);
          float tz = (uFall.x - 4. - vW.z) / min(r.z, -.02), hy = r.y * tz, hx2 = vW.x + r.x * tz;
          if (r.z < -.02 && tz > 0.) {
            float inF = (1. - smoothstep(uFall.y - 3., uFall.y, abs(hx2))) * (1. - smoothstep(uFall.z - 6., uFall.z, hy));
            float inR = (1. - smoothstep(50., 80., abs(hx2))) * (1. - smoothstep(uFall.z, uFall.z + 12., hy));
            refl = mix(refl, uRock * (.5 + .5 * sun) * uDay, inR * .85);
            refl = mix(refl, mix(uFoamShade, uFoamLit, .55 + .45 * hNoise(vec2(hx2 * .6, hy * .12 + uTime * 1.5))), inF * .9); }
          vec3 body = mix(uShallow, uDeep, smoothstep(0., 3.2, depth)) * (.3 + .7 * sun) * uDay;
          float alpha = smoothstep(0., .45, depth) * mix(.5, .95, smoothstep(0., 2.6, depth));
          vec3 col = mix(body, refl, fres); alpha = max(alpha, fres * smoothstep(0., .25, depth));
          float sg = pow(clamp(dot(reflect(-uSunDir, n), v), 0., 1.), 140.); col += uSunCol * sg * sun * 1.5;
          float fp = hgt(p1 * 1.7) * w1 + hgt(p2 * 1.7) * w2, fine = hNoise(vW.xz * 5. + dr * 3.);
          float foam = smoothstep(1.02 - vB.x * .95, 1.22 - vB.x * .95, fp * .75 + fine * .35);
          // (B4) the strands of a falling face are laid across it in the world's own metres: across x where the water runs along z, across
          // z where it runs along x, the two mixed by the flow's heading (measured across the flow's own turning heading from the world's
          // middle, as it was, the strands swung by metres between a face's corners and read as a smeared zigzag)
          vec2 fd = fl / max(sp, .2); float wa = fd.y * fd.y, wb = fd.x * fd.x;
          float st = (strands(vW.x, vW.y, uTime) * wa + strands(vW.z + 31., vW.y, uTime) * wb) / max(wa + wb, .001);
          float onFace = smoothstep(.04, .3, fall);
          foam = mix(foam, smoothstep(.3, .62, st + .12), onFace);
          vec3 fc = mix(uFoamShade, uFoamLit, clamp(mix(.25 + .9 * fp, (st - .3) * 2.6, onFace), 0., 1.) * (.45 + .55 * sun)) * max(uDay, .5);
          col = mix(col, fc, foam); alpha = max(alpha, foam * smoothstep(-.05, .2, depth + fall));
          // a falling sheet is ragged at its sides: the rock shows there
          alpha = clamp(alpha, 0., 1.) * (1. - fall * smoothstep(.5, .86, vB.w + (.5 - st) * .7));
          gl_FragColor = vec4(fxApplyFog(col), alpha); }` });
    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    waterMesh.renderOrder = 1; waterMesh.name = 'the water'; outside.add(waterMesh);
    // mist: at the foot of every small fall (boiling up, drifting downstream), and long thin veils lying in the gorge over the stream
    { const FM = ST['fall mist small'], GM = ST['gorge mist'], puffs = [];
      for (const f of falls) { const n = Math.round(5 + f.d); for (let i = 0; i < n; i++) { const z = f.z + FM.range(0.8, 3.2), x = courseX(z) + FM.range(-0.7, 0.7) * half(z);
        puffs.push({ p: [side * x, level(z + 2) + FM.range(0.3, 1.4), z], size: FM.range(1.4, 2.7) * (0.7 + f.d * 0.07), rise: FM.range(0.25, 0.75), drift: [side * FM.range(-0.3, 0.3), FM.range(0.3, 1.2)], life: FM.range(2.4, 4.6), ph: FM(), op: FM.range(0.3, 0.5), grow: 1.9 }); } }
      for (let i = 0; i < 16; i++) { const z = lerp(OUT_Z + 12, CZ1 - 40, (i + GM.range(0.1, 0.9)) / 16), x = courseX(z) + GM.range(-14, 14);
        puffs.push({ p: [side * x, level(z) + GM.range(5, 13), z], size: GM.range(13, 22), rise: GM.range(0.1, 0.5), drift: [side * GM.range(-0.5, 0.5), GM.range(0.3, 1.0)], life: GM.range(11, 18), ph: GM(), op: GM.range(0.07, 0.13) * (hour === 'dawn' ? 1.4 : 1), grow: 1.4 }); }
      { const gm = makeMist(puffs, U).object; gm.name = 'mist of the gorge'; outside.add(gm); } }
    await ctx.yield();

    // ------------------------------------------------------------ rocks: the islet, the leaping rock, stones in and by the water
    const stackOpts = { segments: 16, color: '#8d8a78', colorB: '#63645a', colorTop: '#4f7a3a', roughness: 0.24 };
    // THE ISLET (B4): beds of rock that stand on one another. Every bed is narrower all round than the bed under it (a ledge 0.5 to 1.3 m
    // broad lies on the lower bed's top), its own wall leans in by 0.3 m, and all beds share one lobed plan: every ledge is solid
    // underneath and nothing hangs over. (The kit's stack shifts and undercuts its beds; this one is the islet's own.)
    const solidStack = (R, o) => { const seg = o.segments, nb = o.beds, th = [], lw = []; let sum = 0, lsum = 0.3;
      for (let i = 0; i < nb; i++) { const t = R.range(0.6, 1.4), l = R.range(0.5, 1.3); th.push(t); lw.push(l); sum += t; if (i < nb - 1) lsum += l + 0.3; }
      const p2 = R.range(0, TAU), p3 = R.range(0, TAU), o1 = R.range(0, 90), rings = []; let r = o.topRadius + lsum, y = 0;
      rings.push([-o.sink, r * 1.1, 0, 0]);
      for (let i = 0; i < nb; i++) { const h = th[i] / sum * o.height; rings.push([y + 0.02, r, i, 0], [y + h - 0.06, r - 0.3, i, 0], [y + h, r - 0.4, i, 1]); y += h; r -= 0.3 + (i < nb - 1 ? lw[i] : 0); if (i < nb - 1) rings.push([y + 0.05, r + 0.08, i, 1]); }
      const nr = rings.length, pos = new Float32Array((nr * seg + 1) * 3), col = new Float32Array((nr * seg + 1) * 3), ix = [], ca = new THREE.Color(o.color), cb = new THREE.Color(o.colorB), ct = new THREE.Color(o.colorTop), c = new THREE.Color();
      for (let j = 0; j < nr; j++) { const [ry, rr, bed, kind] = rings[j];
        for (let i = 0; i < seg; i++) { const a = i / seg * TAU, plan = 1 + 0.16 * (0.6 * Math.cos(2 * a + p2) + 0.4 * Math.cos(3 * a + p3)), f = noise.fbm3(Math.cos(a) * 1.3 + o1, ry * 0.12, Math.sin(a) * 1.3, 3), k = (j * seg + i) * 3;
          const rad = rr * plan * (1 + 0.03 * f); pos[k] = Math.cos(a) * rad; pos[k + 1] = ry + (kind ? 0.12 * f : 0); pos[k + 2] = Math.sin(a) * rad;
          c.copy(bed % 2 ? cb : ca).lerp(bed % 2 ? ca : cb, 0.25 + 0.25 * f); if (kind) c.lerp(ct, 0.6); c.multiplyScalar((1 + 0.3 * f) * (1 - 0.45 * (1 - sm(0.3, 2.2, ry + 2 + f * 0.4)))); col[k] = c.r; col[k + 1] = c.g; col[k + 2] = c.b; } }
      const tip = nr * seg; pos[tip * 3 + 1] = o.height + 0.3; col[tip * 3] = ct.r; col[tip * 3 + 1] = ct.g; col[tip * 3 + 2] = ct.b;
      for (let j = 0; j + 1 < nr; j++) for (let i = 0; i < seg; i++) { const a = j * seg + i, b = j * seg + (i + 1) % seg, d = a + seg, e = b + seg; ix.push(a, d, b, b, d, e); }
      for (let i = 0; i < seg; i++) ix.push((nr - 1) * seg + i, tip, (nr - 1) * seg + (i + 1) % seg);
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); sg.setAttribute('color', new THREE.BufferAttribute(col, 3)); sg.setIndex(ix); sg.computeVertexNormals(); return sg; };
    const islet = new THREE.Mesh(solidStack(ST['islet rock'], { ...stackOpts, segments: 20, beds: 5, height: ISLET.h + 2, topRadius: 6.2, sink: 5 }), rockMat);
    islet.position.set(side * ISLET.x, -2, ISLET.z); outside.add(islet);
    await ctx.yield();
    const leapRock = new THREE.Mesh(T.seaStackGeometry({ rng: ST['leap rock'], ...stackOpts, height: LEAP.top + 1.6, radius: LEAP.r / 0.76, ledges: 7, undercut: 0.12, top: 'flat', sink: 5, lean: 0.02, waist: 0.2 }), rockMat);
    leapRock.position.set(side * LEAP.x, -2, LEAP.z); outside.add(leapRock);
    // the height of the leaping rock's own top at a place: the highest of its faces over that place (so who sits there sits on the rock)
    // (round 3, A10: the islet's own top likewise, for those who sit on it)
    const rockTop = (rock, X, Z, above) => { const g = rock.geometry, p = g.attributes.position.array, ix = g.index ? g.index.array : null, n = ix ? ix.length : p.length / 3, tris = [];
      for (let i = 0; i < n; i += 3) { const a = (ix ? ix[i] : i) * 3, b = (ix ? ix[i + 1] : i + 1) * 3, c = (ix ? ix[i + 2] : i + 2) * 3; if (Math.max(p[a + 1], p[b + 1], p[c + 1]) > above) tris.push(a, b, c); }
      return (x, z) => { const lx = side * (x - X), lz = z - Z; let best = -1e9;
        for (let i = 0; i < tris.length; i += 3) { const a = tris[i], b = tris[i + 1], c = tris[i + 2], x0 = p[a] - lx, z0 = p[a + 2] - lz, x1 = p[b] - lx, z1 = p[b + 2] - lz, x2 = p[c] - lx, z2 = p[c + 2] - lz;
          const d = x0 * (z1 - z2) + x1 * (z2 - z0) + x2 * (z0 - z1); if (Math.abs(d) < 1e-9) continue; const w0 = (x1 * z2 - x2 * z1) / d, w1 = (x2 * z0 - x0 * z2) / d, w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue; best = Math.max(best, w0 * p[a + 1] + w1 * p[b + 1] + w2 * p[c + 1]); }
        return best - 2; }; };
    const leapTop = rockTop(leapRock, LEAP.x, LEAP.z, LEAP.top + 1), isletTop = rockTop(islet, ISLET.x, ISLET.z, ISLET.h);
    await ctx.yield();
    // Loose stones: every one its own size, turn and lean; none within the margin of the way (A6). Three large shapes, two small.
    const RSH = ST['rock shapes'], stoneMat = T.makeRockMaterial({ rng: ST['stone rock'], terrain, top: '#5a7f3c', topAmount: 0.5, strata: 0.3 });
    const KINDS = [['boulder', 2, 0.84], ['rock', 2, 0.74], ['slab', 2, 0.36], ['boulder', 1, 0.84], ['rock', 1, 0.74]];
    await ctx.yield();
    const stoneGeo = [], stoneM = KINDS.map(() => [[], [], []]), stoneAt = [[], [], []], seats = [], zoneOf = (z) => (z > 290 ? 0 : z > OUT_Z ? 1 : 2);
    for (const k of KINDS) { stoneGeo.push(T.rockGeometry({ rng: RSH, kind: k[0], detail: k[1], color: '#8f8b7a', colorB: '#5c5c50' })); await ctx.yield(); }
    // (round 3, A10) THE STONES AS BUILT. The highest face of any stone over a place of the land, by the stones' own shapes, turns,
    // leans and sizes (every face of every stone that reaches over the place is asked along the upright line through it): the
    // height one who sits there sits at. -Infinity where no stone lies over the place.
    const stoneCells = new Map(), stoneReach = stoneGeo.map((g) => { g.computeBoundingSphere(); return g.boundingSphere.radius + g.boundingSphere.center.length(); });
    const stoneTopAt = (wx, z) => { let top = -Infinity; const cell = stoneCells.get(Math.floor(wx / 4) * 8192 + Math.floor(z / 4)); if (!cell) return top;
      for (const sb of cell) { const e = sb.inv, g = stoneGeo[sb.k], p = g.attributes.position.array, ix = g.index ? g.index.array : null, n = ix ? ix.length : p.length / 3;
        // (the upright line through the place, in the stone's own measure: where it starts and which way it runs)
        const ox = e[0] * wx + e[8] * z + e[12], oy = e[1] * wx + e[9] * z + e[13], oz = e[2] * wx + e[10] * z + e[14], dx = e[4], dy = e[5], dz = e[6];
        for (let i = 0; i < n; i += 3) { const a = (ix ? ix[i] : i) * 3, b = (ix ? ix[i + 1] : i + 1) * 3, c = (ix ? ix[i + 2] : i + 2) * 3;
          const e1x = p[b] - p[a], e1y = p[b + 1] - p[a + 1], e1z = p[b + 2] - p[a + 2], e2x = p[c] - p[a], e2y = p[c + 1] - p[a + 1], e2z = p[c + 2] - p[a + 2];
          const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x, det = e1x * px + e1y * py + e1z * pz; if (Math.abs(det) < 1e-12) continue;
          const tx = ox - p[a], ty = oy - p[a + 1], tz = oz - p[a + 2], u = (tx * px + ty * py + tz * pz) / det; if (u < 0 || u > 1) continue;
          const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x, v = (dx * qx + dy * qy + dz * qz) / det; if (v < 0 || u + v > 1) continue;
          const t = (e2x * qx + e2y * qy + e2z * qz) / det; if (t > top) top = t; } }
      return top; };
    await ctx.yield();
    const mtx = new THREE.Matrix4(), qt = new THREE.Quaternion(), eu = new THREE.Euler(), v3a = new THREE.Vector3(), v3b = new THREE.Vector3();
    // a stone of radius r with its middle at (x, y, z); where a monkey can sit on it is kept (where: 0 the gorge, 1 the lake). Every
    // number of a stone is drawn before it is asked whether it may stand (ok: its own place's rule; then the margin)
    const putStone = (R, x, y, z, r, where, ok = true) => { const k = r > 1.15 ? R.int(0, 2) : R.int(3, 4), sy = R.range(0.8, 1.15), ex = R.range(-0.25, 0.25), ey = R.range(0, TAU), ez = R.range(-0.25, 0.25);
      if (!ok || !fits('stones', x, y - r * sy, y + r * sy, z, r * 1.1)) return;
      eu.set(ex, ey, ez); qt.setFromEuler(eu);
      const M = new THREE.Matrix4().compose(v3a.set(side * x, y, z), qt, v3b.set(r, r * sy, r)); stoneM[k][zoneOf(z)].push(M); stoneAt[zoneOf(z)].push([side * x, y + r, z]);
      { const reach = r * Math.max(1, sy) * stoneReach[k], sb = { inv: M.clone().invert().elements, k }; // (round 3, A10: the stone as built, kept by 4 m of the land)
        for (let i = Math.floor((side * x - reach) / 4); i <= Math.floor((side * x + reach) / 4); i++) for (let j = Math.floor((z - reach) / 4); j <= Math.floor((z + reach) / 4); j++) { const c = i * 8192 + j; if (!stoneCells.has(c)) stoneCells.set(c, []); stoneCells.get(c).push(sb); } }
      if (r > 0.8 && where >= 0) seats.push({ x, y: y + r * sy * KINDS[k][2] * 0.86, z, r, where }); };
    { const FR = ST['fall rocks'], PR = ST['pool rocks'], BS = ST['bank stones'], SR = ST['shore rocks'], FT = ST['foot rocks'];
      for (const f of falls) {
        // the lip: stones the water parts round; the foot: stones to either hand of the plunge
        const n = FR.int(3, 4); for (let i = 0; i < n; i++) { const z = f.z - FR.range(0.9, 2.2), t = lerp(-0.85, 0.85, (i + FR.range(0.2, 0.8)) / n), r = FR.range(0.8, 1.6);
          putStone(FR, courseX(z) + t * half(z) * courseSec(z), level(z) - 0.25 * r, z, r, 0); }
        for (let i = 0; i < 5; i++) { const z = f.z + FR.range(1.6, 6), t = FR.sign() * FR.range(0.5, 1.1), r = FR.range(0.9, 2.1);
          putStone(FR, courseX(z) + t * half(z) * courseSec(z), level(z) + 0.1 * r, z, r, 0); } }
      // in the stream: stones the water breaks on, none within 2.5 m of a fall's face
      for (let i = 0; i < 44; i++) { const z = PR.range(OUT_Z + 7, CZ1 - 10), t = PR.range(-0.9, 0.9), r = PR.range(0.3, 1.0); let near = 9; for (const f of falls) near = Math.min(near, Math.abs(z - f.z));
        putStone(PR, courseX(z) + t * half(z) * courseSec(z), level(z) - 0.2 * r, z, r, 0, near > 2.5); }
      // on the banks, from the water's edge to 5 m up the bank
      for (let i = 0; i < 120; i++) { const z = BS.range(OUT_Z + 2, CZ1 - 6), s = BS.sign(), e = BS.range(-0.7, 5), r = 0.25 + 1.1 * BS() ** 2.2, x = courseX(z) + s * (half(z) + e) * courseSec(z);
        putStone(BS, x, groundP(x, z) + 0.15 * r, z, r, 0); }
      await ctx.yield();
      // round the lake's shore; and larger rocks standing in the water near the fall's foot and along the cliff, where the troop gathers
      for (let i = 0; i < 80; i++) { const a = SR.range(-1, 1), e = SR.range(-3, 2.5), r = 0.3 + 1.3 * SR() ** 2;
        const onSide = Math.abs(a) > 0.52, x = onSide ? Math.sign(a) * (LAKE.ax + e) : Math.sin(a * 3) * (LAKE.ax + e), z = onSide ? lerp(22, LAKE.cz, (Math.abs(a) - 0.52) / 0.48) : LAKE.cz + Math.cos(a * 3) * (LAKE.az + e);
        putStone(SR, x, Math.max(groundP(x, z), -0.5 * r) + 0.2 * r, z, r, 1, z < OUT_Z - 6); }
      for (let i = 0; i < 26; i++) { const s = FT.sign(), x = s * FT.range(27, 58), z = footZ + FT.range(1, 30) * (0.4 + 0.6 * (Math.abs(x) - 27) / 31), r = FT.range(1.2, 3.1);
        putStone(FT, x, Math.max(groundP(x, z), -0.55 * r) + 0.25 * r, z, r, 1); } }
    // B4, B5: rock with form where the ground alone stood steep. At every small fall a shoulder of rock on each bank at the step (2.3 to
    // 3.6 m, sunk a third into the upper bank, its top over the upper water), so the water goes to its drop between rocks; and THE GATE BEFORE THE SILL:
    // along the last 34 m of the gorge under the lake's outlet, five rocks on each bank from 2 m to 5 m, larger toward the sill and
    // standing at the water's edge, so the gorge draws in before it opens on the lake. None carries a seat (the troop's seats stay as
    // they were); each is asked by the margin like every stone.
    // A ROCK STANDS ON GROUND: a shoulder's whole foot lies on the upper bank (its middle its own radius and up to 0.6 m more above the
    // step), and no rock of these two kinds has its middle more than half its radius over the lowest ground under its foot (five places
    // asked), so at its lowest side it is buried by three tenths of its radius or more and none hangs over a drop.
    { const SHL = ST['fall shoulders'], GT = ST['gate rocks'];
      const footLow = (x, z, r) => Math.min(groundP(x, z), groundP(x - 0.75 * r, z), groundP(x + 0.75 * r, z), groundP(x, z - 0.75 * r), groundP(x, z + 0.75 * r));
      for (const f of falls) for (const sgn of [-1, 1]) { const dz = SHL.range(0, 0.6), r = SHL.range(2.3, 3.6), e = SHL.range(0.3, 1.2), z = f.z - r - dz, x = courseX(z) + sgn * (half(z) + e + 0.5 * r) * courseSec(z);
        putStone(SHL, x, Math.min(level(f.z - 1.5) - 0.35 * r, footLow(x, z, r) + 0.5 * r), z, r, -1); }
      for (const sgn of [-1, 1]) for (let i = 0; i < 5; i++) { const k = (i + GT.range(0.15, 0.85)) / 5, z = falls[0].z + 5 + 34 * k, r = lerp(5, 2, k) * GT.range(0.85, 1.15), e = GT.range(-0.2, 0.9), x = courseX(z) + sgn * (half(z) + e + 0.55 * r) * courseSec(z);
        putStone(GT, x, Math.min(Math.max(groundP(x, z), level(z)) - 0.1 * r, footLow(x, z, r) + 0.5 * r), z, r, -1); } }
    await ctx.yield();
    // the stones stand in three zones (the lower gorge, the upper gorge, the lake), each with its own bounds; a zone is drawn from 16 m before
    // the first metre of the way from which any stone of it is in sight over the drawn ground (round 3, A11: every stone asked)
    for (let zn = 0; zn < 3; zn++) { const grp = new THREE.Group();
      for (let k = 0; k < KINDS.length; k++) if (stoneM[k][zn].length) { grp.add(T.makeInstances(stoneGeo[k], stoneMat, stoneM[k][zn], { brightness: 0.2, tints: ['#ffffff', '#e9efe2', '#f4ecdc'] }).object); await ctx.yield(); }
      grp.name = 'stones'; outside.add(grp); switches.push({ object: grp, on: firstSeen(stoneAt[zn]) - LEAD, off: Infinity, n: stoneAt[zn].length, at: [0, 0, zn, 0] }); await ctx.yield(); }
    await ctx.yield();

    // ------------------------------------------------------------ the green: peach trees by the water, the slopes' woods, pines on the crags
    const wind = flora.makeWind({ direction: [0.5 * side, 0.85], strength: 0.8 }), leafOpts = { wind, backlight: 1.0 }, REACH_PLANTS = 200;
    await flora.prepareLeafTexture(leafOpts, ctx.yield);
    const leafMat = flora.windMaterial(leafOpts);
    await ctx.yield();
    // shapes: peach in blossom (three), peach in leaf (one), the slopes' oak and pine and far peach (drawn simply), crag pines (two)
    const PS = ST['peach shapes'], SS = ST['slope tree shapes'], NS = ST['pine shapes'];
    const BLOSSOM = { leaf: '#f4a7b9', leafLight: '#ffdbe6', leafDark: '#c7708e', bark: '#4a3430' }, LEAFY = { leaf: '#5f9a3c', leafLight: '#a6cf5c', leafDark: '#2c5a2a', bark: '#4a3430' };
    const peachGeo = [];
    peachGeo.push(flora.cherryGeometry({ rng: PS, detail: 1, ...BLOSSOM }));
    await ctx.yield();
    peachGeo.push(flora.cherryGeometry({ rng: PS, detail: 1, ...BLOSSOM, leaf: '#f7b9c6' }));
    await ctx.yield();
    peachGeo.push(flora.cherryGeometry({ rng: PS, detail: 1, ...LEAFY }));
    await ctx.yield();
    peachGeo.push(flora.cherryGeometry({ rng: PS, detail: 1, ...BLOSSOM, leaf: '#ee98b0' }));
    await ctx.yield();
    const peachFar = [0, 1, 2, 3].map((i) => flora.cherryGeometry({ rng: PS, detail: 0, ...(i === 2 ? LEAFY : BLOSSOM) }));
    await ctx.yield();
    const slopeGeo = [flora.oakGeometry({ rng: SS, detail: 0, leaf: '#3f8a3c', leafLight: '#8cc050', leafDark: '#1f4a26' }), flora.pineGeometry({ rng: SS, detail: 0, height: 15 }), flora.cherryGeometry({ rng: SS, detail: 0, ...BLOSSOM }),
      flora.oakGeometry({ rng: SS, detail: 0, leaf: '#4f9a40', leafLight: '#a0cc58', leafDark: '#28562a' })];
    const pineGeo = [flora.pineGeometry({ rng: NS, detail: 1, height: 15 }), flora.pineGeometry({ rng: NS, detail: 1, height: 17 })];
    await ctx.yield();
    // a plant's point for the kit: world x, the ground's height, size, turn, how far from the way, which band of z it lies in
    const band = (z) => clamp((CZ1 - z) / (CZ1 + 80), 0, 0.999);
    const pt = (x, z, s, v, rot, y) => ({ x: side * x, y: y ?? groundAt(x, z), z, s, rot, d: routeDistXZ(x, z), u: band(z), v });
    // R5: a trunk keeps 6 m from the way's line and a crown, taken at its full radius, 6.5 m from the way itself (leaves nearer than that are seen as cards); a tree that cannot is not planted
    const treeFits = (kind, g, x, z, s, y) => { const h = g.userData.height * s, r = g.userData.radius * s, c = routeDist(x, (y ?? groundP(x, z)) + h * 0.66, z) - r;
      if (routeDistXZ(x, z) <= 6 || c <= 6.5) return false; keepLeast(kind, c); return true; };
    // (A1) is a crown of a shape g at a size s clear of the opening's tube at a place? and the tall plants that stand near the entry
    // axis, kept for whoever counts: [world x, foot, top, z, the crown's radius, kind (0 peach, 1 slope tree, 2 bush, 3 thicket)]
    // (the body asked is the plant as the kit draws it: from 0.3 m under the drawn ground, where the kit sinks its foot, to its height
    // with the tenth the kit may stretch it by)
    const crownFree = (g, s, x, z) => { const y = groundAt(x, z); return tubeAsk(x, y - 0.3, y + 1.1 * g.userData.height * s, z, g.userData.radius * s) >= 0; }, tall = [];
    const noteTall = (kind, g, p) => { const x = side * p.x, sb = (x - QX[0]) * backX + (p.z - QZ[0]) * backZ, r = g.userData.radius * p.s;
      if (sb > -12 - r && sb < BACK + 12 + r && Math.abs((x - QX[0]) * backZ - (p.z - QZ[0]) * backX) < 24 + r) tall.push(p.x, p.y - 0.3, p.y + 1.1 * g.userData.height * p.s, p.z, r, kind);
      return p; };
    // (a plant set out of the tube keeps the far-or-near shape and the kit's chunk of its dealt place, so the kit's list stays as dealt)
    const ptOut = (q, x, z, s, v, rot) => { const p = pt(q[0], q[1], s, v, rot); if (q[0] !== x || q[1] !== z) { p.d = routeDistXZ(x, z); p.u = band(z); } return p; };
    const shadeOf = (wx, z) => 0.5 + 0.5 * terrain.shadeAt(wx, z, so).sun;
    const peachPts = [], fruitAt = [];
    // peach trees: along both banks 1.6 to 8 m back from the water, every 6.5 to 9.5 m (closer on a dense visit), their boughs toward the stream;
    // and round the lake's shore
    { const BP = ST['bank peaches'], SP = ST['shore peaches'];
      // (every number of a tree is drawn before it is asked whether it may stand)
      // (A1: a tree dealt into the opening's tube behind the entry is set out of it, away from the axis, to the first place where it
      // stands on the bank, clear of the tube and by the trees' rule; its fruit goes with it)
      const add = (R, x, z, ok = true) => { const v = R.int(0, 3), s = R.range(0.8, 1.25), rot = R.range(0, TAU), g = peachGeo[v]; if (!ok || !treeFits('peach trees', g, x, z, s)) return;
        const q = crownFree(g, s, x, z) ? [x, z] : setOut('peach trees', x, z, (nx, nz) => -Math.max(lakeIn(nx, nz), streamIn(nx, nz)) > 1.6 && crownFree(g, s, nx, nz) && treeFits('peach trees', g, nx, nz, s)); if (!q) return;
        const p = noteTall(0, g, ptOut(q, x, z, s, v, rot)); peachPts.push(p);
        fruitAt.push({ x: q[0], y: p.y + g.userData.height * s * 0.64, z: q[1], r: g.userData.radius * s * 0.8 }); };
      for (const s of [-1, 1]) for (let z = CZ1 - 6 - BP.range(0, 6); z > OUT_Z + 5; z -= BP.range(6.5, 9.5) / densT) { const e = BP.range(1.6, 8); add(BP, courseX(z) + s * (half(z) + e) * courseSec(z), z); }
      const n = Math.round(26 * densT);
      for (let i = 0; i < n; i++) { const a = (i + SP.range(0.1, 0.9)) / n * 2 - 1, e = SP.range(2, 7), onSide = Math.abs(a) > 0.5;
        const x = onSide ? Math.sign(a) * (LAKE.ax + e) : Math.sin(a * Math.PI) * (LAKE.ax + e), z = onSide ? lerp(30, LAKE.cz, (Math.abs(a) - 0.5) / 0.5) : LAKE.cz + Math.cos(a * Math.PI) * (LAKE.az + e);
        add(SP, x, z, z < OUT_Z - 8); } }
    const peaches = flora.makeScatter({ rng: ST['peach tints'], points: peachPts, variants: peachGeo, farVariants: peachFar, farDistance: 45, material: leafMat, chunks: 5, cullDistance: Infinity, heightAt: terrain.surfaceAt, groundShadow: { sunDir, strength: night ? 0.3 : 0.5 }, shade: shadeOf, tint: 0.12, hue: 0.03 });
    peaches.object.name = 'peach trees'; plantTris += peaches.triangles; outside.add(peaches.object); await bySight(peaches); updaters.push((dt, t, cam) => peaches.update(dt, t, cam));
    await ctx.yield();
    // the fruit: ripe peaches hanging in the lower half of every crown, six to ten a tree
    // (round 3, A15: the fruit of the trees of each 60 m of z is one mesh with its own bounds, drawn from 16 m before the first place of
    // the way from which any of those trees' crowns is in sight, where all the fruit was one mesh drawn at every metre under the sky)
    { const FT = ST.fruit, fg = new THREE.IcosahedronGeometry(0.2, 0), fmat = new THREE.MeshLambertMaterial({ color: '#ffffff' }), lots = new Map(), fruits = new THREE.Group(); fruits.name = 'fruit';
      for (const c of fruitAt) { const n = FT.int(6, 10), k = Math.floor(c.z / 60); if (!lots.has(k)) lots.set(k, { fm: [], fc: [], at: [] }); const lot = lots.get(k); lot.at.push([side * c.x, c.y + c.r, c.z]);
        for (let i = 0; i < n; i++) { const a = FT.range(0, TAU), el = FT.range(-0.75, 0.15), rr = c.r * FT.range(0.72, 1.0), s = FT.range(0.8, 1.3);
        lot.fm.push(new THREE.Matrix4().compose(v3a.set(side * (c.x + Math.cos(a) * Math.cos(el) * rr), c.y + Math.sin(el) * rr * 0.6, c.z + Math.sin(a) * Math.cos(el) * rr), qt.identity(), v3b.set(s, s * 1.05, s)));
        lot.fc.push(FT.range(0, 1)); } }
      const c0 = new THREE.Color('#f08a4b'), c1 = new THREE.Color('#f6b05a'), cc = new THREE.Color();
      for (const lot of lots.values()) { const fruit = new THREE.InstancedMesh(fg, fmat, lot.fm.length);
        lot.fm.forEach((m, i) => { fruit.setMatrixAt(i, m); fruit.setColorAt(i, cc.copy(c0).lerp(c1, lot.fc[i])); }); fruit.computeBoundingSphere(); fruits.add(fruit);
        switches.push({ object: fruit, on: firstSeen(lot.at) - LEAD, off: Infinity, n: lot.fm.length, at: [0, 0, Math.round(lot.at[0][2]), 0], plants: true }); }
      outside.add(fruits); }
    await ctx.yield();
    // the slopes' woods: oak, pine and wild peach over the gorge's and the basin's sides and over the rim above the cliff; none in the water's
    // 7.5 m of bank, none on the strip the fall's wall stands on, none on rock steeper than 1.3
    // (a set number of places is asked, every number of a place drawn before any of its tests; about every second one stands)
    let woodsSc = null;
    { const SL = ST['slope trees'], pts = [], asked = Math.round(260 * densT);
      for (let i = 0; i < asked; i++) { const x = SL.range(-200, 200), z = SL.range(-90, CZ1 - 4), s = SL.range(0.75, 1.3), k = SL(), thin = SL(), rot = SL.range(0, TAU), v = k < 0.4 ? 0 : k < 0.62 ? 1 : k < 0.8 ? 2 : 3;
        const zr = zRamp(x), north = z < zr; if (Math.abs(x) < WALL_HALF + 4 && z < zr + 7 && z > zr - 24) continue;
        if (!north && -Math.max(lakeIn(x, z), streamIn(x, z)) < 7.5) continue;
        const y = groundP(x, z); if (y > 150 || Math.abs(groundP(x + 2, z) - groundP(x - 2, z)) > 5.2 || Math.abs(groundP(x, z + 2) - groundP(x, z - 2)) > 5.2) continue;
        // thicker near the water and the cliff than far up the mountain
        const near = Math.min(routeDistXZ(x, z), Math.hypot(x, z - 10)); if (thin > 1.15 - near / 190) continue;
        if (!treeFits('slope trees', slopeGeo[v], x, z, s, y)) continue;
        // (A1: one dealt into the opening's tube is set out of it to the first place where its own rules hold: the bank, the slope, the trees' rule)
        const g = slopeGeo[v], q = crownFree(g, s, x, z) ? [x, z] : setOut('slope trees', x, z, (nx, nz) => { const ny = groundP(nx, nz);
          if (!(nz < zRamp(nx)) && -Math.max(lakeIn(nx, nz), streamIn(nx, nz)) < 7.5) return false;
          if (ny > 150 || Math.abs(groundP(nx + 2, nz) - groundP(nx - 2, nz)) > 5.2 || Math.abs(groundP(nx, nz + 2) - groundP(nx, nz - 2)) > 5.2) return false;
          return crownFree(g, s, nx, nz) && treeFits('slope trees', g, nx, nz, s, ny); });
        if (!q) continue;
        pts.push(noteTall(1, g, ptOut(q, x, z, s, v, rot))); }
      counts.slopeTrees = pts.length;
      const woods = flora.makeScatter({ rng: ST['slope tree tints'], points: pts, variants: slopeGeo, material: leafMat, chunks: 6, cullDistance: Infinity, shade: shadeOf, tint: 0.2, hue: 0.05 });
      woods.object.name = 'trees of the slopes'; plantTris += woods.triangles; outside.add(woods.object); woodsSc = woods; updaters.push((dt, t, cam) => woods.update(dt, t, cam)); }
    await ctx.yield();
    // pines on the crags: on the wall's ledges to either hand of the fall, on its rim, on the islet's top
    // THE CRAG'S TREES STAND ON THE ROCK AS BUILT (round 3, A4). Their places were worked from the face's rule (its beds, its line
    // under the lip), but the wall is drawn as a net of 2.3 m by some 4 m with its top turned back from its own last row: a third of
    // them stood more than 1.5 m from any rock. Now every one, after all its numbers are drawn, is set on the drawn rock itself:
    // on the point of the wall's own triangles (its face, its ledges as the net holds them, its top strip) nearest its dealt foot,
    // 0.25 m into the rock. The wall is whole, so every tree finds rock and none is struck out (none of the kit's numbers for
    // another tree moves). How far each went is kept (stations.cragMoved).
    const rockFoot = (() => { const g = hero.wall.geometry, pp = g.attributes.position.array, ix = g.index.array, nt = ix.length / 3, bx = new Float32Array(nt * 6), q = [0, 0, 0];
      for (let t = 0; t < nt; t++) for (let a = 0; a < 3; a++) { let lo = 1e9, hi = -1e9; for (let c = 0; c < 3; c++) { const v = pp[ix[t * 3 + c] * 3 + a]; if (v < lo) lo = v; if (v > hi) hi = v; } bx[t * 6 + a * 2] = lo; bx[t * 6 + a * 2 + 1] = hi; }
      // (the point of a triangle nearest a point: its corner, its edge or its inside, whichever region the point lies over)
      const near = (p, a, b, c) => { const ax = pp[a], ay = pp[a + 1], az = pp[a + 2], ux = pp[b] - ax, uy = pp[b + 1] - ay, uz = pp[b + 2] - az, wx = pp[c] - ax, wy = pp[c + 1] - ay, wz = pp[c + 2] - az, ex = p[0] - ax, ey = p[1] - ay, ez = p[2] - az;
        const d1 = ux * ex + uy * ey + uz * ez, d2 = wx * ex + wy * ey + wz * ez; let v = 0, w = 0;
        if (!(d1 <= 0 && d2 <= 0)) { const fx = ex - ux, fy = ey - uy, fz = ez - uz, d3 = ux * fx + uy * fy + uz * fz, d4 = wx * fx + wy * fy + wz * fz;
          if (d3 >= 0 && d4 <= d3) v = 1;
          else { const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) v = d1 / (d1 - d3);
            else { const hx = ex - wx, hy = ey - wy, hz = ez - wz, d5 = ux * hx + uy * hy + uz * hz, d6 = wx * hx + wy * hy + wz * hz;
              if (d6 >= 0 && d5 <= d6) w = 1;
              else { const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) w = d2 / (d2 - d6);
                else { const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); v = 1 - w; }
                  else { const den = 1 / (va + vb + vc); v = vb * den; w = vc * den; } } } } } }
        q[0] = ax + ux * v + wx * w; q[1] = ay + uy * v + wy * w; q[2] = az + uz * v + wz * w; };
      return (p) => { let best = 1e18; const o = [p[0], p[1], p[2]];
        for (let t = 0; t < nt; t++) { let d = 0; for (let a = 0; a < 3; a++) { const v = p[a], lo = bx[t * 6 + a * 2], hi = bx[t * 6 + a * 2 + 1], e = v < lo ? lo - v : v > hi ? v - hi : 0; d += e * e; } if (d >= best) continue;
          near(p, ix[t * 3] * 3, ix[t * 3 + 1] * 3, ix[t * 3 + 2] * 3); const dx = q[0] - p[0], dy = q[1] - p[1], dz = q[2] - p[2], dd = dx * dx + dy * dy + dz * dz; if (dd < best) { best = dd; o[0] = q[0]; o[1] = q[1]; o[2] = q[2]; } }
        return [o, Math.sqrt(best)]; }; })();
    // (the kit sinks every plant by 0.03 of its own height, stretched by a tenth more or less: the point is lifted by that, so the drawn
    // foot lies 0.2 m into the rock, give or take 0.04 m)
    const cragGeo = [pineGeo[0], pineGeo[1], peachFar[0], peachFar[1]], cragMoved = [];
    const onRock = (q) => { const [o, d] = rockFoot([q.x, q.y, q.z]); cragMoved.push(r2(d)); q.x = o[0]; q.y = o[1] - 0.2 + 0.03 * (cragGeo[q.v].userData.height || 1) * q.s; q.z = o[2]; return q; };
    hero.wall.name = 'the wall of the fall';
    { const LP2 = ST['ledge pines'], RP = ST['rim pines'], IP = ST['islet pine'], pts = [], face = hero.face;
      for (const l of face.ledges) for (const sd of [-1, 1]) { const x = sd * LP2.range(31, 74), skip = LP2.chance(0.25), s = LP2.range(0.3, 0.52), v = LP2.int(0, 1), rot = LP2.range(0, TAU), top = wallTop(P, x, noise); if (l.y > top - 7 || skip) continue;
        const f = face.faceAt(x, l.y - 0.9), g = face.faceAt(x, l.y + 0.9);
        if (f[2] - g[2] > 1.1) pts.push(onRock(pt(x, lerp(f[2], g[2], 0.6), s, v, rot, l.y - 0.5))); }
      for (let i = 0; i < 9; i++) { const x = RP.sign() * RP.range(27, 78), z = wallZ(P, x) - RP.range(5, 13), s = RP.range(0.35, 0.6); pts.push(onRock(pt(x, z, s, RP.int(0, 1), RP.range(0, TAU), wallTop(P, x, noise) + 5 * (wallZ(P, x) - z) / 18 - 0.7))); }
      pts.push(pt(ISLET.x + IP.range(-1.5, 1.5), ISLET.z + IP.range(-1.5, 1.5), IP.range(0.42, 0.55), 0, IP.range(0, TAU), ISLET.h - 0.3));
      // (B4) peach trees rooted on the same ledges: small, in blossom, one asked on each hand of every ledge that is a step of a metre or more
      const LQ = ST['ledge peaches']; let peachN = 0;
      for (const l of face.ledges) for (const sd of [-1, 1]) { const x = sd * LQ.range(29, 72), skip = LQ.chance(0.3), s = LQ.range(0.42, 0.7), v = 2 + LQ.int(0, 1), rot = LQ.range(0, TAU), top = wallTop(P, x, noise); if (l.y > top - 6 || skip) continue;
        const f = face.faceAt(x, l.y - 0.9), g = face.faceAt(x, l.y + 0.9);
        if (f[2] - g[2] > 1.1) { pts.push(onRock(pt(x, lerp(f[2], g[2], 0.55), s, v, rot, l.y - 0.4))); peachN++; } }
      const crag = flora.makeScatter({ rng: ST['pine tints'], points: pts, variants: cragGeo, material: leafMat, chunks: 1, tilt: 0.16, tint: 0.15 });
      crag.object.name = 'trees of the crags'; plantTris += crag.triangles; outside.add(crag.object); updaters.push((dt, t, cam) => crag.update(dt, t, cam));
      // (B4) vines hang down the cliff from its ledges: on each hand of every ledge one is asked, its rope lying along the lip of the bed
      // under the ledge for 6 to 13 m (a place every 3 m or so, each on the face itself), and from each of those places a strand of 3 to
      // 8 m hanging down the bed's face (its foot on the face too)
      const CV = ST['cliff vines'], csp = []; let vineN = 0, vineAsked = 0;
      for (const l of face.ledges) for (const sd of [-1, 1]) { const x0 = CV.range(28, 62), len = CV.range(6, 13), skip = CV.chance(0.25), n = Math.max(2, Math.round(len / 3.1)), drop = [0, 1, 2, 3, 4].map(() => [CV.range(3, 8), CV.range(-0.6, 0.6)]); vineAsked++;
        if (skip || l.y > wallTop(P, sd * (x0 + len / 2), noise) - 5) continue;
        const q = []; let ok = true;
        for (let k = 0; k <= n; k++) { const x = sd * (x0 + len * k / n), fz = face.faceAt(x, l.y - 0.9)[2] + 0.35; q.push([x, l.y - 0.3, fz]); if (!fits('cliff vines', x, l.y - 5, l.y, fz, 0.8)) ok = false; }
        if (!ok) continue;
        for (let k = 0; k < n; k++) csp.push([[side * q[k][0], q[k][1], q[k][2]], [side * q[k + 1][0], q[k + 1][1], q[k + 1][2]]]);
        for (let k = 0; k <= n; k++) { const [dl, dx] = drop[k], yb = Math.max(q[k][1] - dl, 2), xb = q[k][0] + dx; csp.push([[side * q[k][0], q[k][1], q[k][2]], [side * xb, yb, Math.max(face.faceAt(xb, yb)[2], face.faceAt(xb, (yb + q[k][1]) / 2)[2]) + 0.35]]); }
        vineN++; }
      if (csp.length) { const cv = flora.makeVines({ rng: ST['cliff vine leaves'], spans: csp, sag: 0.02, hangers: 0.5, leaves: 1.3, flower: '#ffe6ee', material: leafMat }); outside.add(cv.object); counts.cliffVineTris = Math.round(cv.triangles || 0); }
      counts.cliff = [peachN, vineN, vineAsked]; }
    await ctx.yield();
    // what grows in the cave, in the garden under the roof's crack: clumps of bamboo, a plum in pale blossom, a pine (the seed deals which
    // stands where and how tall), on the hall's floor
    { const CS = ST['cave plant shapes'], CB = ST['cave bamboo'], CPL = ST['cave plum'], CPN = ST['cave pine'];
      const bambooGeo = [flora.bambooGeometry({ rng: CS, detail: 2, height: 8, stalks: 9 }), flora.bambooGeometry({ rng: CS, detail: 1, height: 8, stalks: 8, spread: 1.5 })];
      await ctx.yield();
      const plumGeo = flora.cherryGeometry({ rng: CS, detail: 2, height: 9, leaf: '#f6e9ee', leafLight: '#ffffff', leafDark: '#c9a3b4', bark: '#2c2220' });
      await ctx.yield();
      const cavePine = flora.pineGeometry({ rng: CS, detail: 2, height: 16 });
      await ctx.yield();
      // every clump is asked with its whole height and breadth and stands only where it keeps the margin (A6); the plum and the pine keep
      // the trees' rule (the crown at its full radius 6.5 m from the way): each stands where the plan puts it, moved away from the hall's
      // line by half metres until it does
      const bp = [], fy = L.floorY; let nb = 0;
      for (const b of L.bamboo) { const out = Math.sign(b.x - cxH), s0 = lerp(1.25, 1.75, (b.h - 13) / 7), rot0 = CB.range(0, TAU), x1 = b.x + out * CB.range(2, 3.6), z1 = b.z + CB.range(-2.6, 2.6), s1 = s0 * CB.range(0.7, 0.92), rot1 = CB.range(0, TAU);
        const g0 = bambooGeo[0].userData, g1 = bambooGeo[1].userData; nb += 2;
        if (fits('cave bamboo', b.x, fy, fy + g0.height * s0, b.z, g0.radius * s0)) bp.push({ x: side * b.x, y: fy, z: b.z, s: s0, rot: rot0, d: 0, u: 0, v: 0 });
        if (fits('cave bamboo', x1, fy, fy + g1.height * s1, z1, g1.radius * s1)) bp.push({ x: side * x1, y: fy, z: z1, s: s1, rot: rot1, d: 0, u: 0, v: 1 }); }
      counts.caveBamboo = [bp.length, nb];
      const stand = (kind, g, o, sc) => { const out = Math.sign(o.x - cxH) || 1; let x = o.x, k = 0; while (k < 20 && !treeFits(kind, g, x, o.z, sc, fy)) { x += out * 0.5; k++; } counts[kind] = k * 0.5; return x; };
      const plumX = stand('cave plum', plumGeo, L.plum, L.plum.h / 9), pineX = stand('cave pine', cavePine, L.pine, L.pine.h / 16);
      // (its fallen petals lie under the plum where it stands)
      U.uPlum.value.x = side * plumX;
      // THE CAVE'S PLANTS WEAR THE CAVE'S AIR (round 3, A6) as their own constants: the kit's leaf material is not changed; this one
      // material's own shader, as the kit hands it over to be compiled, has the scene's fog lines put by the same lines with the
      // cave's colour and density (should the kit's shader ever not hold those two lines, it is left as the kit made it).
      // (They still take the kit's own reach of sight, sinking away between 165 and 200 m from the eye: A13 is done for the troop
      // and NOT for them; see the head of this file.)
      const caveAirOn = (mat) => { const before = mat.onBeforeCompile, key = mat.customProgramCacheKey;
        mat.onBeforeCompile = function (sh, r) { before.call(this, sh, r); const a = '#include <fog_pars_fragment>', b = '#include <fog_fragment>';
          if (sh.fragmentShader.split(a).length !== 2 || sh.fragmentShader.split(b).length !== 2) return;
          sh.uniforms.uCaveAir = U.uCaveAir;
          sh.fragmentShader = sh.fragmentShader.replace(a, a + '\nuniform vec4 uCaveAir;').replace(b, '#ifdef USE_FOG\n\tgl_FragColor.rgb = mix( gl_FragColor.rgb, uCaveAir.rgb, 1.0 - exp( - uCaveAir.w * uCaveAir.w * vFogDepth * vFogDepth ) );\n#endif'); };
        mat.customProgramCacheKey = function () { return key.call(this) + ' in the cave air'; };
        return mat; };
      const caveLeaf = caveAirOn(flora.windMaterial({ ...leafOpts, fade: [165, REACH_PLANTS] }));
      const bamboo = flora.makeScatter({ rng: CB, points: bp, variants: bambooGeo, material: caveLeaf, chunks: 1, tint: 0.14, sink: 0 });
      await ctx.yield();
      const plum = flora.makeScatter({ rng: CPL, points: [{ x: side * plumX, y: fy, z: L.plum.z, s: L.plum.h / 9, rot: CPL.range(0, TAU), d: 0, u: 0, v: 0 }], variants: [plumGeo], material: caveLeaf, chunks: 1, sink: 0 });
      const pine = flora.makeScatter({ rng: CPN, points: [{ x: side * pineX, y: fy, z: L.pine.z, s: L.pine.h / 16, rot: CPN.range(0, TAU), d: 0, u: 0, v: 0 }], variants: [cavePine], material: caveLeaf, chunks: 1, sink: 0 });
      bamboo.object.name = 'cave bamboo'; hall.add(bamboo.object, plum.object, pine.object); updaters.push((dt, t, cam) => { bamboo.update(dt, t, cam); plum.update(dt, t, cam); pine.update(dt, t, cam); });
      await ctx.yield();
      // ferns in the gallery's wet (B2): along the foot of its back wall (none in the mouth's opening) and along the rim of its ledge over the
      // lake, where the spray keeps the rock wet; each is asked with its own height and breadth and keeps the margin; they stand in the
      // cliff's shade
      const GF = ST['gallery ferns'], GS = ST['gallery fern shapes'], gGeo = [flora.fernGeometry({ rng: GS, size: 1.0 }), flora.fernGeometry({ rng: GS, size: 1.5 })], gp = [];
      for (let i = 0; i < 46; i++) { const x = GF.range(-21, 21), back = GF.chance(0.6), off = GF.range(0.25, 1.1), sc = GF.range(0.7, 1.3), v = GF.int(0, 1), rot = GF.range(0, TAU);
        if (back && Math.abs(x - P.mouthX) < 13.5) continue;
        const z = back ? galFootZ(P, noise, x) + off : galRimZ(P, x) - 0.8 * off, y = galFloorAt(P, noise, x, z) - 0.05, gd = gGeo[v].userData;
        if (fits('gallery ferns', x, y, y + gd.height * sc, z, gd.radius * sc)) gp.push({ x: side * x, y, z, s: sc, rot, d: 0, u: 0, v }); }
      counts.galleryFerns = [gp.length, 46];
      const gferns = flora.makeScatter({ rng: ST['gallery fern tints'], points: gp, variants: gGeo, material: caveLeaf, chunks: 1, tint: 0.12, sink: 0, shade: () => 0.5 });
      gferns.object.name = 'gallery ferns'; inside.add(gferns.object); updaters.push((dt, t, cam) => gferns.update(dt, t, cam));
      await ctx.yield();
      // the hall's hangings (B3, B5), the kit's vines at the plan's places: garlands of leaf and flower under the gate's lintel and from post
      // to post down each hand (no dangling strands on these: the way goes under the first), vines down the columns and strands hanging in
      // the roof's crack (leafy, with strands that dangle and sway in the cave's air)
      const gsp = [], vsp = [];
      for (const gl of home.garlands) { let q = null; for (let i = 0; i <= 6; i++) { const t = i / 6, p = [side * lerp(gl.a[0], gl.b[0], t), lerp(gl.a[1], gl.b[1], t) - gl.sag * Math.sin(Math.PI * t), lerp(gl.a[2], gl.b[2], t)]; if (q) gsp.push([q, p]); q = p; } }
      for (const vn of home.vines) for (let i = 0; i + 1 < vn.pts.length; i++) vsp.push([[side * vn.pts[i][0], vn.pts[i][1], vn.pts[i][2]], [side * vn.pts[i + 1][0], vn.pts[i + 1][1], vn.pts[i + 1][2]]]);
      for (const sd of home.strands) vsp.push([[side * sd.x, L.roofY + 2, sd.z], [side * (sd.x - sd.sd * 0.3), L.roofY - sd.len, sd.z + 0.3 * Math.cos(sd.sway)]]);
      if (gsp.length) { const garlands = flora.makeVines({ rng: ST['garland leaves'], spans: gsp, sag: 0.03, hangers: 0, leaves: 1.2, flower: '#f4a7b9', material: caveLeaf }); hall.add(garlands.object); }
      await ctx.yield();
      if (vsp.length) { const hvines = flora.makeVines({ rng: ST['hall vines'], spans: vsp, sag: 0.04, hangers: 0.8, leaves: 1, flower: '#fff0f4', material: caveLeaf }); hall.add(hvines.object); } }
    await ctx.yield();
    // ------------------------------------------------------------ ground cover: grass and flowers on the banks, reeds at the water's edge, ferns, flowering bushes
    // metres beyond the water's edge (negative in the water), in the place's coordinates
    const edgeOut = (x, z) => -Math.max(lakeIn(x, z), streamIn(x, z));
    const gcTmp = new THREE.Color(), groundTint = (wx, z, y) => groundColor(wx, z, y, 1, gcTmp);
    // grass and flowers keep the margin as everything does (A6): none grows where its tip would come within it under the way
    // (asked many thousand times: a plan of the way in squares of 4 m, marked 8 m to every hand of each of its places, answers first. In an
    // unmarked square the way is more than 5 m off in plan, so the margin holds and nothing more is asked: the answer is the same)
    const nearWay = new Set(); for (let i = 0; i <= QM; i += 2) for (let a = -2; a <= 2; a++) for (let c = -2; c <= 2; c++) nearWay.add((Math.floor(QX[i] / 4) + a + 512) * 4096 + Math.floor(QZ[i] / 4) + c + 512);
    const lowGrowth = (wx, z, h) => { if (!nearWay.has((Math.floor(side * wx / 4) + 512) * 4096 + Math.floor(z / 4) + 512)) return 1;
      const y = terrain.surfaceAt(wx, z), c = clearOf(side * wx, y, y + h, z, 0.1); if (c < MARGIN) return 0; keepLeast('grass and flowers', c); return 1; };
    const uOut = [0, (S.cross - 14) / PL];
    const grass = await flora.makeGrassAsync({ rng: ST.grass, path, uRange: uOut, radius: 34, count: Math.round(8000 * densT), heightAt: terrain.surfaceAt, wind, map: leafMat.map, groundColor: groundTint,
      density: (wx, z) => { const k = sm(1.6, 3.4, edgeOut(side * wx, z)); return k > 0 ? k * lowGrowth(wx, z, 0.85) : 0; }, shade: [peaches], chunks: 6, fade: [55, 80], flowers: 0.05, flowerColors: ['#fff4f6', '#f4a7b9', '#ffe27a'], height: [0.4, 0.85] }, ctx.yield);
    grass.object.name = 'grass'; outside.add(grass.object); updaters.push((dt, t, cam) => grass.update(dt, t, cam));
    await ctx.yield();
    const flowers = flora.makeFlowers({ rng: ST.flowers, path, uRange: uOut, radius: 30, count: Math.round(560 * densT), heightAt: terrain.surfaceAt, wind, map: leafMat.map, groundColor: groundTint,
      density: (wx, z) => { const k = sm(2, 4, edgeOut(side * wx, z)); return k > 0 ? k * lowGrowth(wx, z, 0.6) : 0; }, colors: ['#fff4f6', '#f4a7b9', '#ffd84a', '#f08ab0'], shade: [peaches], chunks: 4 });
    flowers.object.name = 'flowers'; outside.add(flowers.object); updaters.push((dt, t, cam) => flowers.update(dt, t, cam));
    await ctx.yield();
    { // reeds: clumps at the water's edge, where the stream is not falling and the bank is not rock: along both banks and round the shore
      const RS = ST['reed shapes'], RB = ST['bank reeds'], RL = ST['shore reeds'], pts = [], reedGeo = [flora.reedGeometry({ rng: RS }), flora.reedGeometry({ rng: RS, height: 2.2 }), flora.reedGeometry({ rng: RS, height: 2.6 })];
      // (every number of a clump is drawn before it is asked: its patch of the bank, no fall within 3.5 m, the margin of the way)
      const tryReed = (R, x, z) => { const sc = R.range(0.45, 0.85), v = R.int(0, 2), rot = R.range(0, TAU), y = Math.max(groundP(x, z), level(z) - 0.35), g = reedGeo[v].userData;
        if (noise.n2(x * 0.09 + 40, z * 0.09) < -0.05) return; let near = 9; for (const f of falls) near = Math.min(near, Math.abs(z - f.z));
        if (near > 3.5 && fits('reeds', x, y, y + g.height * sc, z, g.radius * sc)) pts.push(pt(x, z, sc, v, rot, y)); };
      for (const s of [-1, 1]) for (let z = CZ1 - 4; z > OUT_Z + 4; z -= RB.range(2.2, 5) / densT) tryReed(RB, courseX(z) + s * (half(z) + RB.range(-0.6, 0.7)) * courseSec(z), z);
      const n = Math.round(80 * densT);
      for (let i = 0; i < n; i++) { const a = (i + RL()) / n * 2 - 1, e = RL.range(-0.8, 0.8), onSide = Math.abs(a) > 0.5;
        tryReed(RL, onSide ? Math.sign(a) * (LAKE.ax + e) : Math.sin(a * Math.PI) * (LAKE.ax + e), onSide ? lerp(24, LAKE.cz, (Math.abs(a) - 0.5) / 0.5) : LAKE.cz + Math.cos(a * Math.PI) * (LAKE.az + e)); }
      const reeds = flora.makeScatter({ rng: ST['reed tints'], points: pts, variants: reedGeo, material: leafMat, chunks: 5, cullDistance: Infinity, shade: shadeOf, sink: 0.02 });
      reeds.object.name = 'reeds'; plantTris += reeds.triangles; outside.add(reeds.object); await bySight(reeds); updaters.push((dt, t, cam) => reeds.update(dt, t, cam)); }
    await ctx.yield();
    { // ferns under the trees and bushes in flower on the banks and the basin's foot, 2 to 22 m from the water; a bush keeps 5 m from the way
      const FN = ST.ferns, BU = ST.bushes, FS = ST['fern shapes'], BS2 = ST['bush shapes'], fp = [], bp = [];
      const fernGeo = [flora.fernGeometry({ rng: FS }), flora.fernGeometry({ rng: FS, size: 1.4 })];
      const bushGeo = [flora.bushGeometry({ rng: BS2, flowers: 0.7, flowerColor: '#f4a7b9' }), flora.bushGeometry({ rng: BS2, flowers: 0.5, flowerColor: '#fff0f4' }), flora.bushGeometry({ rng: BS2, flowers: 0.15, flowerColor: '#f08a4b' })];
      const spot = (R, far) => { const lake = R.chance(0.35), z = lake ? R.range(20, OUT_Z) : R.range(OUT_Z, CZ1 - 4), s = R.sign(), e = R.range(2, far);
        const x = lake ? (z < LAKE.cz ? s * (LAKE.ax + e) : s * (LAKE.ax * Math.sqrt(Math.max(0, 1 - ((z - LAKE.cz) / LAKE.az) ** 2)) + e)) : courseX(z) + s * (half(z) + e) * courseSec(z);
        return edgeOut(x, z) > 1.8 ? [x, z] : null; };
      // (every number of a fern or a bush is drawn before it is asked; a fern keeps the margin, a bush 5 m from the way's line and the margin)
      const plant = (kind, R, far, s0, s1, geo, lineD, out) => { const q = spot(R, far), sc = R.range(s0, s1), v = R.int(0, geo.length - 1), rot = R.range(0, TAU); if (!q || routeDistXZ(q[0], q[1]) <= lineD) return;
        const y = groundAt(q[0], q[1]), g = geo[v].userData; if (!fits(kind, q[0], y, y + g.height * sc, q[1], g.radius * sc)) return;
        // (A1: a bush dealt into the opening's tube is set out of it to the first place on the bank where its own rules hold)
        if (lineD > 0 && !crownFree(geo[v], sc, q[0], q[1])) { const o = setOut(kind, q[0], q[1], (nx, nz) => { const ny = groundAt(nx, nz);
            return edgeOut(nx, nz) > 1.8 && routeDistXZ(nx, nz) > lineD && crownFree(geo[v], sc, nx, nz) && fits(kind, nx, ny, ny + g.height * sc, nz, g.radius * sc); });
          if (o) out.push(noteTall(2, geo[v], ptOut(o, q[0], q[1], sc, v, rot))); return; }
        const p = pt(q[0], q[1], sc, v, rot, y); out.push(lineD > 0 ? noteTall(2, geo[v], p) : p); };
      for (let i = 0, n = Math.round(300 * densT); i < n; i++) plant('ferns', FN, 16, 0.7, 1.4, fernGeo, 0, fp);
      for (let i = 0, n = Math.round(64 * densT); i < n; i++) plant('bushes', BU, 22, 0.7, 1.5, bushGeo, 5, bp);
      const ferns = flora.makeScatter({ rng: ST['fern tints'], points: fp, variants: fernGeo, material: leafMat, chunks: 5, cullDistance: Infinity, shade: shadeOf });
      const bushes = flora.makeScatter({ rng: ST['bush tints'], points: bp, variants: bushGeo, material: leafMat, chunks: 4, cullDistance: Infinity, shade: shadeOf });
      ferns.object.name = 'ferns'; bushes.object.name = 'bushes'; plantTris += ferns.triangles + bushes.triangles; outside.add(ferns.object, bushes.object); await bySight(ferns); await bySight(bushes); updaters.push((dt, t, cam) => { ferns.update(dt, t, cam); bushes.update(dt, t, cam); }); }
    await ctx.yield();

    // ------------------------------------------------------------ THE TROOP (rule R7; every one of them a standing state or a habit on the world's clock)
    // No monkey is marked out: no first one, no crown, no staff. Sizes are those of large macaques; the coat's colour is the visit's, with each
    // animal's own shade. What sits, grooms, hops, runs its rounds, runs the banks' trails, leaps in and out through the curtain or comes and
    // goes over the bridge does so on the clock alone, each on a round of its own with a drawn phase (every phase reads): none begins, turns
    // or ends because we come, and none knows where we are. We see them because the way passes their places.
    const coat = (R) => { const h = clamp(coatHue + R.range(-1, 1) * coatSpread, 0, 1), v = R.range(0.85, 1.12); return [lerp(0.78, 1.18, h) * v, lerp(0.8, 1.0, h) * v, lerp(0.86, 0.72, h) * v]; };
    const sizeOf = (R) => (R.chance(0.2) ? R.range(0.95, 1.2) : R.range(1.45, 2.0));
    const yawTo = (x, z, tx, tz) => Math.atan2(side * (tx - x), tz - z);
    // One who sits at a place: every number of it is drawn first (its phase, its size and the size a young one would have there, its
    // coat); then it is asked whether it fits (A6): at its own size, or smaller. It is null where its place's own rule says no (ok) or
    // where none fits; put() takes only those who sit.
    // One who hops or bounces at its place is a body the clock moves: it keeps the whole margin at the top of its hop, also where the
    // smaller margin is stated for what stands still under the way in the house; where it cannot, it sits still there (by the smaller one).
    // (round 3, A2 and A8: asked by the true body, at the whole margin under the way in the house as everywhere; under: a place on the
    // house's own floors, where one who cannot hop sits still. What the dealing admits and the true body turns away stays in its
    // list as one who is gone (it has no body and no place; it only keeps the young ones' numbers in their order) until the troop is made.)
    const seat = (kind, R, x, y, z, yaw, o = {}, ok = true, under = false) => { const ph = R(), size0 = sizeOf(R), young = R.range(0.95, 1.2), tint = coat(R), needD = under ? MARGIN_UNDER : MARGIN;
      let hopD = o.hop || 0, sizeD = ok ? sizeDealt(x, y, z, size0, young, hopD, hopD ? MARGIN_GO : needD) : 0;
      if (ok && !sizeD && hopD && under) { hopD = 0; sizeD = sizeDealt(x, y, z, size0, young, 0, needD); }
      if (!sizeD) return null;
      // (round 3, A10) WHERE IT SITS: on the highest face of the stones as built over its own place. One dealt to a stone sits on
      // that face (not on a top reckoned from the stone's radius); where no stone lies under its place it is gone. One dealt to the
      // ground whose place a stone stands over sits on the stone. (The dealing above keeps the dealt height, so that no other moves.)
      // One dealt to the ground under the sky (the banks, the shore) sits on the ground AS DRAWN at its place (the land's own mesh, not
      // the land's picture); one who stands in the shallows, on the drawn ground or at its wading depth, the higher.
      const onStone = kind === 'stone sitters', onGround = kind === 'bank sitters' || kind === 'shore sitters', top = under ? -Infinity : stoneTopAt(side * x, z);
      const gd = onGround ? Math.max(terrain.surfaceAt(side * x, z), o.wade ?? -Infinity) : y, ys = top > -Infinity && (onStone || top > gd) ? top : gd;
      if (top > -Infinity && Math.abs(ys - y) > 0.1) counts.sitOnStone = (counts.sitOnStone || 0) + 1;
      if (onStone && top === -Infinity) { counts.sitNoStone = (counts.sitNoStone || 0) + 1; return { mode: 0, a: [side * x, y, z, yaw], b: [0, 0, 0, 0], ph, size: 0, carry: 0, tint, look: 0, sun: 1, dealt: [sizeD, hopD], gone: true }; }
      // ONE WHO WADES STANDS IN THE WATER AS DRAWN: where the drawn water over its place is not the stream's own level there (a
      // small fall's face stands over the place, thrown out beyond the step), or none is drawn there and the ground lies deeper
      // than it wades, it is gone (after its numbers; one who has a stone under it there sits on the stone and stays)
      if (o.wade !== undefined && !(top > -Infinity && ys === top)) { const wt = waterTopAt(side * x, z);
        if (wt > -Infinity ? Math.abs(wt - 0.05 - level(z)) > 0.15 : !(gd > o.wade)) { counts.sitInFall = (counts.sitInFall || 0) + 1; return { mode: 0, a: [side * x, y, z, yaw], b: [0, 0, 0, 0], ph, size: 0, carry: 0, tint, look: 0, sun: 1, dealt: [sizeD, hopD], gone: true }; } }
      let hop = hopD, size = sizeThatFits(hop ? kind + ', hopping' : kind, x, ys, z, size0, young, false, hop, hop ? MARGIN_GO : MARGIN);
      if (!size && hop && under) { hop = 0; size = sizeThatFits(kind, x, ys, z, size0, young, false, 0, MARGIN); }
      size = Math.min(size, sizeD);
      return { mode: 0, a: [side * x, ys, z, yaw], b: [0, 0, o.rate || 0, hop], ph, size, carry: o.carry || 0, tint, look: o.look || 0, sun: o.sun ?? 1, dealt: [sizeD, hopD], gone: !size, stone: top > -Infinity, ground: onGround, rock: o.rock || null }; };
    const put = (list, m) => { if (m) list.push(m); };
    // (those who are gone leave their list before the troop is made)
    const here = (list) => { for (let i = list.length - 1; i >= 0; i--) if (list[i].gone) list.splice(i, 1); return list; };
    // A MOTHER WITH HER YOUNG ONE (B5): of the grown ones who sit still at a place, about one in six has an infant (0.6 to 0.75 of a
    // metre's measure, a third of her size) sitting close before her, turned as she is or a little aside. Every number is drawn for every
    // such sitter; the infant sits only where it keeps the margin its troop keeps.
    // (the numbers are dealt for every grown still sitter of the dealing; the young one sits where its mother in fact sits, grown and still)
    const withYoung = (R, list) => { let n = 0;
      for (const m of list.slice()) { if (m.mode !== 0 || (m.dealt ? m.dealt[0] < 1.45 || m.dealt[1] > 0 : m.size < 1.45 || m.b[3] > 0)) continue;
        const take = R.chance(0.16), a = R.range(-0.8, 0.8), d = R.range(0.3, 0.42), sz = R.range(0.6, 0.75), turn = R.range(-0.5, 0.5), ph = R(), tint = coat(R); if (!take || m.gone || m.size < 1.45 || m.b[3] > 0) continue;
        const yaw = m.a[3], x = side * m.a[0] + side * Math.sin(yaw + a) * d * m.size, z = m.a[2] + Math.cos(yaw + a) * d * m.size;
        // (round 3, A10: the young one on the stones as built too: on the face under its own place where that lies within half a
        // metre of its mother's height; where its mother sits on a stone and its own place has none, or the face is further off, none)
        // (the young one of one who sits on the leaping rock or the islet: on that rock's own top as built under its own place,
        // where that lies within half a metre of its mother's height; else none)
        const t2 = m.stone !== undefined ? stoneTopAt(side * x, z) : -Infinity, yy = m.rock ? m.rock(x, z) + 0.03 : t2 > -Infinity ? t2 : m.ground && !m.stone ? terrain.surfaceAt(side * x, z) : m.a[1];
        if (m.rock ? !(Math.abs(yy - m.a[1]) <= 0.5) : m.stone !== undefined && (t2 > -Infinity ? Math.abs(t2 - m.a[1]) > 0.5 : m.stone || Math.abs(yy - m.a[1]) > 0.5)) continue;
        const c = monkeyClear(x, yy, z, sz);
        if (c < MARGIN) continue; keepLeast('young ones', c);
        list.push({ mode: 0, a: [side * x, yy, z, yaw + turn], b: [0, 0, 0, 0], ph, size: sz, carry: 0, tint, look: -0.25, sun: m.sun }); n++; }
      return n; };
    const carryOf = (R, p) => (R.chance(p) ? 1 : 0);
    // the z at which the stream's course has run so many metres of its own length, and a runner's least distance from the way along its
    // whole lane at a size (asked every 0.625 m of the lane: between two asked places a lane that keeps 2.5 m at both cannot come nearer
    // than 2.48 m; asked every 2.5 m, as it was, it could come to 2.2 m between them, and the count at the entry clocks found 2.4)
    const zAtArc = (a) => { let lo = 0, hi = CN; while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (cArc[mid] < a) lo = mid; else hi = mid; } return CZ0 + 0.5 * (lo + clamp((a - cArc[lo]) / Math.max(1e-6, cArc[hi] - cArc[lo]), 0, 1)); };
    // (round 3, A2: asked by the runner's true body. A lane's places every 0.625 m are laid once: where its feet are, on the ground's
    // picture the troop itself runs on, and how the ground pitches it there, measured as its own law measures it, to the place 0.8 m
    // behind; then every size is asked along them, pitched either way, with the 0.1 m its stride lifts it)
    // (the lead's mend of 9 Oct: a lane is laid and asked with breaths between its places, so that no lane holds the page; no number changes)
    const laneLaid = async (a0, a1, sgn, l0, l1) => { const o = [], at = (aa) => { const z = zAtArc(aa), lane = lerp(l0, l1, 1 - sm(a1, a1 + 14, aa)), x = courseX(z) + sgn * (half(z) + lane) * courseSec(z); return [x, hgt(side * x, z), z]; };
      for (let a = a0; a > a1 - 0.625; a -= 0.625) { const aa = Math.max(a, a1), q = at(aa), q2 = at(aa - 0.8); o.push(q[0], q[1], q[2], Math.atan(Math.abs(q2[1] - q[1]) / 0.8)); if ((o.length & 63) === 0) await ctx.yield(); }
      return o; };
    const laneClear = async (laid, size) => { let b = 1e9;
      for (let i = 0; i < laid.length; i += 4) { b = Math.min(b, bodyClear('run', laid[i], laid[i + 1], laid[i + 2], size, 0.1, -laid[i + 3], laid[i + 3]));
        if (b < MARGIN_GO) return b;   // (it does not fit already: the rest of the lane is not asked)
        if ((i & 31) === 28) await ctx.yield(); }
      return b; };
    // (a lane's own places every 1.25 m of it, in the world's coordinates: kept with its runner for whoever counts the clock's bodies)
    const lanePlaces = (a0, a1, sgn, l0, l1) => { const o = [];
      for (let a = a0; a > a1 - 1.25; a -= 1.25) { const aa = Math.max(a, a1), z = zAtArc(aa), lane = lerp(l0, l1, 1 - sm(a1, a1 + 14, aa)), x = courseX(z) + sgn * (half(z) + lane) * courseSec(z); o.push(r2(side * x), r2(groundAt(x, z)), r2(z)); }
      return o; };
    const gorgeTroop = [], lakeTroop = [], houseTroop = [];
    // a round: two or three chasing one another round a spot, on the clock (under the sky on the ground; in the house on a floor at o.y).
    // Every number of the round and of three runners is drawn first; the round is run only where its place's own rule allows (o.ok) and
    // its whole circle, with a grown runner on it, keeps the margin (A6)
    const rounds = (kind, R, list, xDealt, z, r, lag, o = {}) => { const sp = R.sign() * R.range(2.6, 4.6), n = R.int(2, 3), ph = R(), who = [];
      for (let k = 0; k < 3; k++) who.push({ dwell: R.range(0.1, 0.4), size: sizeOf(R), tint: coat(R) });
      // (round 3, A9) UNDER THE SKY NO ROUND IS RUN THROUGH A STONE. Where a stone as built stands over its circle (a hundred and
      // twenty-eight places of it, 0.16 m apart at the most, at its radius and 0.3 m to either hand: with thirty-two a stone's rim
      // lay between two of them once in 42 seeds), the spot is set out, after all its numbers are drawn, away from the water by
      // 0.75 m at a time to the first place where none does (6 m at the most); where none is found the round is not run.
      let x = xDealt;
      if (o.y === undefined) { const stony = (cx) => { for (let a = 0; a < 128; a++) for (const rr of [r - 0.3, r, r + 0.3]) if (stoneTopAt(side * (cx + Math.cos(a * 0.0490874) * rr), z + Math.sin(a * 0.0490874) * rr) > -Infinity) return true; return false; };
        let k = 0; while (k < 8 && stony(x)) { k++; x = xDealt + (o.away || 0) * 0.75 * k; }
        if (k) { counts.roundsSetOut = (counts.roundsSetOut || 0) + 1; if (stony(x)) { counts.roundsOnStone = (counts.roundsOnStone || 0) + 1; return false; } } }
      // (round 3, A2: asked by the true body of the largest of its runners, pitched as the ground under the circle pitches it: sixteen
      // places of the circle on the ground's picture the troop runs on, each with the place 0.7 m on along the circle either way)
      let y0 = o.y ?? 1e9, y1 = o.y ?? -1e9, pm = 0; if (o.y === undefined) for (let a = 0; a < 16; a++) { const an = a * 0.3927, px = x + Math.cos(an) * r, pz = z + Math.sin(an) * r, y = hgt(side * px, pz); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        for (const sg of [-0.7, 0.7]) pm = Math.max(pm, Math.atan(Math.abs(hgt(side * (px - sg * Math.sin(an)), pz + sg * Math.cos(an)) - y) / 0.7)); }
      let big = 0; for (let k = 0; k < n; k++) big = Math.max(big, o.young ? 0.95 + 0.25 * (who[k].size - 0.95) / 1.05 : who[k].size);
      const body = monkeyBody('run', big, -pm, pm), c = body ? clearOf(x, y0 + body[0], y1 + body[1] + (o.lift ?? 0.08), z, r + body[2]) : -1;
      if (o.ok === false || c < MARGIN_GO) return false; keepLeast(kind, c);
      // (o.young: the round is run by young ones: each one's drawn size is taken down into a young one's range, 0.95 to 1.2)
      for (let k = 0; k < n; k++) list.push({ mode: 1, gy: [r2(y0), r2(y1)], a: [side * x, o.y ?? -999, z, 0], b: [r, sp, who[k].dwell, o.lift ?? 0.08], ph: ph + k * lag, size: o.young ? 0.95 + 0.25 * (who[k].size - 0.95) / 1.05 : who[k].size, carry: k === 0 ? o.carry0 || 0 : 0, tint: who[k].tint });
      return true; };
    { // ----- in the gorge
      const TR2 = ST['trail runners'], BSI = ST['bank sitters'], SSI = ST['stone sitters'], BR = ST['bank rounds'];
      // THE TRAIL RUNNERS (a habit on the clock): each has its own lane (the stream's course, 0.8 to 5.5 m back from the water) between a
      // lower end of its own and an upper end (a place of the bank, or the lake's outlet), and goes to and fro along it at a ground speed
      // of its own (4.5 to 8 m/s), resting a share of each crossing (0.08 to 0.3) at the end it has reached, from a drawn phase: at any
      // clock about half of them go up the stream and half down
      const nRun = Math.round(46 * troopK);
      for (let i = 0; i < nRun; i++) { const z0 = lerp(zS - 6, OUT_Z + 40, (i + TR2()) / nRun), toLake = TR2.chance(0.55), far = TR2.range(60, 200), end = OUT_Z + TR2.range(4, 16), s = TR2.sign();
        const lane0 = TR2.range(0.8, 5.5), lane1 = TR2.range(2.5, 6), speed = TR2.range(4.5, 8), rest = TR2.range(0.08, 0.3), z1 = Math.min(toLake ? end : Math.max(OUT_Z + 4, z0 - far), z0 - 5);
        const ph = TR2(), size0 = sizeOf(TR2), young = TR2.range(0.95, 1.2), carry = carryOf(TR2, 0.35), tint = coat(TR2), a0 = arcAt(z0), a1 = arcAt(z1);
        // its whole lane is asked (A6) at its own size, then smaller; where none fits the lane is laid 2 m, then 4 m further from the water
        // (the whole lane, so the margin holds at every phase of its round)
        let size = 0, out = 0;
        for (const o of [0, 2, 4]) { const laid = await laneLaid(a0, a1, s, lane0 + o, lane1 + o); for (const sz of [size0, 0.5 * (size0 + young), young]) { const c = await laneClear(laid, sz); if (c >= MARGIN_GO) { size = sz; out = o; keepLeast('trail runners', c); break; } await ctx.yield(); } if (size) break; }
        if (size) gorgeTroop.push({ mode: 2, a: [a0, a1, side * s * (lane0 + out), side * s * (lane1 + out)], b: [speed, rest, 0, 0], ph, size, carry, tint, z0, z1, lane: lanePlaces(a0, a1, s, lane0 + out, lane1 + out) });
        await ctx.yield(); }
      counts.trailRunners = [gorgeTroop.length, nRun];
      // sitters: on the banks (facing the water, or each other), on the stones, in the shallows (splashing: they hop)
      const nSit = Math.round(48 * troopK);
      for (let i = 0; i < nSit; i++) { const z = BSI.range(OUT_Z + 3, CZ1 - 8), s = BSI.sign(), wet = BSI.chance(0.2), eW = BSI.range(-1.7, -0.5), eD = BSI.range(0.6, 6.5), hops = BSI.chance(0.15), turn = BSI.range(-0.9, 0.9), carry = carryOf(BSI, 0.3), hopH = BSI.range(0.3, 0.6), rate = BSI.range(0.6, 1.1);
        const x = courseX(z) + s * (half(z) + (wet ? eW : eD)) * courseSec(z), hop = wet || hops;
        put(gorgeTroop, seat('bank sitters', BSI, x, wet ? Math.max(groundAt(x, z), level(z) - 0.45) : groundAt(x, z), z, yawTo(x, z, courseX(z), z) + turn, { carry: wet ? 0 : carry, hop: hop ? hopH : 0, rate, sun: sunAt(x, z), wade: wet ? level(z) - 0.45 : undefined })); if (i % 6 === 5) await ctx.yield(); }
      await ctx.yield();
      for (const st of seats) if (st.where === 0) { const take = SSI.chance(0.6), yaw = SSI.range(0, TAU), carry = carryOf(SSI, 0.4); put(gorgeTroop, seat('stone sitters', SSI, st.x, st.y, st.z, yaw, { carry, sun: sunAt(st.x, st.z) }, take)); }
      // rounds on the clock: pairs and threes chasing one another round a spot of the bank
      const nRnd = Math.round(8 * troopK);
      for (let i = 0; i < nRnd; i++) { const z = BR.range(OUT_Z + 6, CZ1 - 12), s = BR.sign(), r = BR.range(1.3, 3), x = courseX(z) + s * (half(z) + r + BR.range(1.4, 4)) * courseSec(z); rounds('bank rounds', BR, gorgeTroop, x, z, r, 0.047, { away: s * courseSec(z) }); await ctx.yield(); }
      await ctx.yield();
      // THE POOL'S SWIMMERS (B5): in the pool under the last small fall before the sill's (4 to 16 m below it), nine young ones in the water
      // toward either bank, sunk to the shoulders, leaping up out of it and dropping back on the clock; spray breaks where each one drops
      // (a puff at its place, of the leap's own period, in the mist's own picture)
      const SW = ST.swimmers, pool = falls[1], splash = []; let nSwim = 0;
      for (let i = 0; i < 9; i++) { const z = pool.z + SW.range(4, 16), t = SW.sign() * SW.range(0.3, 0.85), hopH = SW.range(0.45, 0.8), rate = SW.range(0.45, 0.8), yaw = SW.range(0, TAU), ph = SW(), sz = SW.range(0.95, 1.2), tint = coat(SW), ps = SW.range(0.8, 1.3);
        const x = courseX(z) + t * half(z) * courseSec(z), y = level(z) - 0.42 * sz, c = monkeyClear(x, y, z, sz, false, hopH);
        // (round 3, A10: none swims where a stone as built stands over its place; asked after its numbers are drawn)
        if (c < MARGIN || groundAt(x, z) > level(z) - 0.25 || stoneTopAt(side * x, z) > y) continue; keepLeast('swimmers', c); nSwim++;
        gorgeTroop.push({ mode: 0, a: [side * x, y, z, yaw], b: [0, 0, rate, hopH], ph, size: sz, carry: 0, tint, look: 0, sun: sunAt(x, z) });
        splash.push({ p: [side * x, level(z) + 0.25, z], size: ps, rise: 0.7, drift: [0, 0.3], life: 1 / rate, ph: ph + 0.12, op: 0.5, grow: 2.2 }); }
      if (splash.length) { const sp = makeMist(splash, U).object; sp.name = 'splash of the swimmers'; outside.add(sp); }
      await ctx.yield();
      // THE FALLEN PINE (B5): in the reach between the first and the second small fall up the gorge a pine lies across the stream, its two
      // ends on the banks 1.6 m beyond the water's edge (each end on its bank's own height, at least half a metre over the water), bowed
      // in its middle, moss on its back. Its place is the one of that reach (every 2 m, 8 m and more from either fall) where its whole
      // body lies furthest from the way; where even that is nearer than the margin there is no pine. Three young ones go to and fro over
      // it on the clock, each asked along the whole trunk. Every number is drawn before the asking.
      const FPn = ST['fallen pine'], skew = FPn.range(-1.5, 1.5), hand = FPn.sign(), r0 = FPn.range(0.34, 0.42), bow = FPn.range(0.15, 0.35), stubs = [], cr = [];
      for (let i = 0; i < 4; i++) stubs.push([FPn.range(0.2, 0.9), FPn.range(-1.2, 1.2), FPn.range(0.5, 1)]);
      for (let i = 0; i < 3; i++) cr.push({ ph: FPn(), sp: FPn.range(0.9, 1.6), rest: FPn.range(0.15, 0.4), size: FPn.range(0.95, 1.2), tint: coat(FPn), in0: FPn.range(0.8, 2.2), in1: FPn.range(0.8, 2.2) });
      const lie = (bz) => { const za = bz + skew, zb = bz - skew, xa = courseX(za) + hand * (half(za) + 1.6) * courseSec(za), xb = courseX(zb) - hand * (half(zb) + 1.6) * courseSec(zb);
        const ya = Math.max(groundAt(xa, za), level(bz) + 0.5) + 0.2, yb = Math.max(groundAt(xb, zb), level(bz) + 0.5) + 0.2; let c = 1e9;
        for (let i = 0; i <= 8; i++) { const t = i / 8, y = lerp(ya, yb, t) - bow * Math.sin(Math.PI * t); c = Math.min(c, clearOf(lerp(xa, xb, t), y - 0.45, y + 1.1, lerp(za, zb, t), 0.6)); }
        return { a: [xa, ya, za], b: [xb, yb, zb], c }; };
      let log = null; for (let z = falls[2].z + 8; z < falls[3].z - 8; z += 2) { const q = lie(z); if (!log || q.c > log.c) log = q; }
      counts.fallenPine = [log && log.c >= MARGIN ? 1 : 0, log ? +log.c.toFixed(2) : 0, 0];
      if (log && log.c >= MARGIN) { keepLeast('fallen pine', log.c); const A = log.a, B = log.b, len = Math.hypot(B[0] - A[0], B[2] - A[2]), pos = [], col = [], ix = [], NS = 7, NR = 13, ca = new THREE.Color('#5a4030'), cb = new THREE.Color('#33261c'), cc = new THREE.Color();
        const at = (t) => [side * lerp(A[0], B[0], t), lerp(A[1], B[1], t) - bow * Math.sin(Math.PI * clamp(t, 0, 1)), lerp(A[2], B[2], t)], ux = (B[2] - A[2]) / len, uz = -side * (B[0] - A[0]) / len;
        for (let j = 0; j <= NR; j++) { const t = j === 0 ? -0.04 : (j - 1) / (NR - 1), c = at(t), r = r0 * lerp(1, 0.62, clamp(t, 0, 1)) * (j === 0 ? 2.1 : j === NR ? 0.5 : 1);
          for (let i = 0; i < NS; i++) { const a = i / NS * TAU, k = 1 + 0.12 * noise.n3(t * 9, Math.cos(a), Math.sin(a) + 7); pos.push(c[0] + ux * Math.cos(a) * r * k, c[1] + Math.sin(a) * r * k, c[2] + uz * Math.cos(a) * r * k);
            cc.copy(ca).lerp(cb, 0.5 + 0.5 * noise.n3(t * 14, a * 2, 3)); col.push(cc.r, cc.g, cc.b); } }
        for (let j = 0; j < NR; j++) for (let i = 0; i < NS; i++) { const a = j * NS + i, b = j * NS + (i + 1) % NS; ix.push(a, b, a + NS, b, b + NS, a + NS); }
        for (const [t, lean, l] of stubs) { const c = at(t), base = pos.length / 3, r = 0.11; for (let i = 0; i < 4; i++) { const a = i / 4 * TAU; pos.push(c[0] + Math.cos(a) * r, c[1] + r0 * 0.3, c[2] + Math.sin(a) * r); col.push(cb.r, cb.g, cb.b); }
          pos.push(c[0] + ux * lean * 0.5, c[1] + r0 * 0.5 + l, c[2] + uz * lean * 0.5); col.push(ca.r, ca.g, ca.b); for (let i = 0; i < 4; i++) ix.push(base + i, base + 4, base + (i + 1) % 4); }
        const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); lg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); lg.setIndex(ix); lg.computeVertexNormals();
        outside.add(new THREE.Mesh(lg, T.makeRockMaterial({ rng: ST['pine bark'], terrain, top: '#5a7f3c', topAmount: 0.75, topSlope: [0.3, 0.8], strata: 0, contact: [0.3, 0.2, 0] })));
        for (const q of cr) { const t0 = q.in0 / len, t1 = 1 - q.in1 / len, a = at(t0), b = at(t1), top = (t) => r0 * lerp(1, 0.62, t) * 0.9; let c = 1e9;
          const nc = Math.max(4, Math.ceil((t1 - t0) * len / 0.625));
          for (let i = 0; i <= nc; i++) { const t = lerp(t0, t1, i / nc), p = at(t); c = Math.min(c, monkeyClear(side * p[0], p[1] + top(t), p[2], q.size, true)); }
          if (c < MARGIN_GO) continue; keepLeast('pine crossers', c); counts.fallenPine[2]++;
          gorgeTroop.push({ mode: 5, a: [a[0], lerp(A[1], B[1], t0) + top(t0), a[2], 0], b: [b[0], b[2], q.sp, q.rest], arc: lerp(A[1], B[1], t1) + top(t1), kRun: bow * 0.9, ph: q.ph, size: q.size, carry: 0, tint: q.tint, sun: sunAt(side * a[0], a[2]) }); }
        // (round 3, A10) NONE SITS OR WADES THROUGH THE FALLEN PINE: one of the gorge whose true body, at its place (with its hop),
        // reaches the trunk as it lies is gone (asked after every number of it is drawn; the pine's place is found after the sitters')
        for (const m of gorgeTroop) { if (m.mode !== 0 || m.gone) continue; const ax = side * A[0], bx = side * B[0], ux2 = bx - ax, uz2 = B[2] - A[2];
          const t = clamp(((m.a[0] - ax) * ux2 + (m.a[2] - A[2]) * uz2) / (ux2 * ux2 + uz2 * uz2 || 1), -0.04, 1), p = at(t), body = monkeyBody(m.b[3] > 0 ? 'hop' : 'sit', m.size, 0, 0), rr = r0 * (t <= 0 ? 2.1 : 1.15);
          if (body && Math.hypot(m.a[0] - p[0], m.a[2] - p[2]) < rr + body[2] && m.a[1] + body[0] < p[1] + rr && m.a[1] + body[1] + m.b[3] > p[1] - rr) { m.gone = true; counts.sitAtPine = (counts.sitAtPine || 0) + 1; } } }
      await ctx.yield();
      // THE SWINGS (B5): up the gorge from the gate before the sill to the first small fall, from the boughs of the peach trees by the
      // water (every tree of the banks is asked; three in five of those in that stretch carry one): a vine 2.4 to 3.6 m long hangs from the
      // crown, a third to three fifths of the crown's breadth out toward the stream, and a young one swings on it along the stream as a
      // pendulum of that length does, on the clock. The vine is shortened where the swinger would touch the ground; the swinger's whole
      // arc and the vine keep the margin, or there is no swing.
      const SWG = ST.swings, ropes = [], swc = [0, 0, 0, 0];
      for (const c of fruitAt) { const take = SWG.chance(0.6), len0 = SWG.range(2.4, 3.6), amp = SWG.range(0.45, 0.7), ph = SWG(), sz = SWG.range(0.95, 1.2), tint = coat(SWG), toward = SWG.range(0.35, 0.6);
        if (c.z < falls[0].z + 40 || c.z > falls[3].z - 6) continue; swc[1]++; if (!take) continue;
        const sgn = Math.sign(courseX(c.z) - c.x) || 1, px = c.x + sgn * toward * c.r, py = c.y + 0.15 * c.r, pz = c.z, sl = courseSlope(pz), sec = courseSec(pz), dx = sl / sec, dz = 1 / sec;
        const len = Math.min(len0, py - 0.85 * sz - groundAt(px, pz) - 0.35); if (len < 1.6) { swc[2]++; continue; }
        let cl = clearOf(px, py - len, py, pz, 0.1);
        for (const k of [-1, -0.5, 0, 0.5, 1]) { const th = k * amp, rr = len + 0.85 * sz, x = px + dx * Math.sin(th) * rr, z = pz + dz * Math.sin(th) * rr, y = py - Math.cos(th) * rr; cl = Math.min(cl, bodyClear('swing', x, y, z, sz, 0, -1.25 - th - 0.25 * amp, -1.25 - th + 0.25 * amp)); }   // (A2: its true body as it hangs, pitched down by 1.25 and its swing)
        if (cl < MARGIN) { swc[3]++; continue; } keepLeast('swingers', cl); swc[0]++;
        gorgeTroop.push({ mode: 6, a: [side * px, py, pz, 0], b: [side * dx, dz, len, amp], ph, size: sz, carry: 0, tint, sun: sunAt(px, pz) });
        ropes.push(side * px, py, pz, len, side * dx, dz, amp, ph); }
      // (counted: swings hung, trees of the reach, too low a bough, too near the way)
      counts.swings = swc;
      if (ropes.length) { const n = ropes.length / 8, A = new Float32Array(n * 4), B = new Float32Array(n * 4); for (let i = 0; i < n; i++) { A.set(ropes.slice(i * 8, i * 8 + 4), i * 4); B.set(ropes.slice(i * 8 + 4, i * 8 + 8), i * 4); }
        const rg = new THREE.InstancedBufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3)); rg.setIndex([0, 1, 2, 2, 1, 3]);
        rg.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); rg.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4)); rg.instanceCount = n;
        // (the vine itself: a thin band from where it is fixed to the swinger's hands, turned about its own length to face the eye)
        const rm = new THREE.ShaderMaterial({ fog: true, side: THREE.DoubleSide, uniforms: { ...fx.fogUniforms(), uTime: U.uTime, uCol: { value: new THREE.Color(night ? '#141c12' : '#3a4a22') } },
          vertexShader: `attribute vec4 iA, iB; uniform float uTime; ${fx.GLSL_FOG_PARS_VERT}
            void main() { float th = iB.z * sin(uTime * sqrt(9.81 / iA.w) + iB.w * 6.2832); vec3 end = iA.xyz + iA.w * vec3(iB.x * sin(th), -cos(th), iB.y * sin(th));
              vec3 c = mix(iA.xyz, end, position.y), r = normalize(cross(end - iA.xyz, cameraPosition - c) + 1e-5);
              vec4 mvPosition = viewMatrix * vec4(c + r * position.x * .035, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
          fragmentShader: `uniform vec3 uCol; ${fx.GLSL_FOG_PARS_FRAG} void main() { gl_FragColor = vec4(fxApplyFog(uCol), 1.); }` });
        const rope = new THREE.Mesh(rg, rm); rope.frustumCulled = false; outside.add(rope); }
      counts.swimmers = [nSwim, 9]; counts.young = [withYoung(ST['gorge young'], gorgeTroop)]; }
    await ctx.yield();
    // THE TROOP'S BANDS (A1; round 3, A11 and A13). Sitters and rounds stand in bands of 60 m of z, every kind of goer in a band of its
    // own. A band is drawn from 16 m before the first place of the way from which any place any of its members ever stands at is in
    // sight (over the drawn ground under the sky; through the gallery's opening and the cave's mouth inside the cliff), and from then
    // on: no member sinks away or comes on by the eye's distance (the 165 to 200 m in which a monkey sank to nothing are gone
    // from its shader). Far off it wears the far shape, as before. (Round 3, A15: the runners of the trails stand in bands of 60 m of z
    // too, by the middle of each one's lane, where all of them were one band the whole gorge long: what lies behind the eye is
    // then not drawn, and a far band wears the far shape.)
    const spanOf = (m) => { const y = (x, z) => groundAt(side * x, z);
      if (m.mode > 5.5) return [[m.a[0], m.a[1] - m.b[2], m.a[2]]];
      if (m.mode > 4.5) return [[m.a[0], m.a[1], m.a[2]], [m.b[0], m.a[1], m.b[1]]];
      if (m.mode < 0.5) return [[m.a[0], m.a[1], m.a[2]]];
      if (m.mode < 1.5) { const yy = m.a[1] < -900 ? y(m.a[0], m.a[2]) : m.a[1], r = m.b[0]; return [[m.a[0] - r, yy, m.a[2]], [m.a[0] + r, yy, m.a[2]], [m.a[0], yy, m.a[2] - r], [m.a[0], yy, m.a[2] + r]]; }
      if (m.mode < 2.5) { const o = []; for (let z = m.z0; z > m.z1 - 15; z -= 15) { const zz = Math.max(z, m.z1), x = side * courseX(zz) + Math.sign(m.a[2]) * (half(zz) + Math.abs(m.a[2])) * courseSec(zz); o.push([x, y(x, zz), zz]); } return o; }
      if (m.mode < 3.5) return [[m.a[0], m.a[1] + m.arc, m.a[2]], [m.b[0], P.galY, m.b[1]], [m.b[2], P.galY, m.b[3]]];
      return [[m.a[0], P.galY, m.a[1]], [side * P.bridgeX, P.deckY, P.bridgeZ0], [side * P.bridgeX, P.deckY, P.bridgeZ1], [m.b[0], L.floorY, m.b[1]]]; };
    // (the lead's mend of 9 Oct: a troop is made with breaths between its members' sight tests and between its bands; no number changes)
    const troopOf = async (list, UU, land = false, each = !land) => { const g = new THREE.Group(), bands = new Map();
      for (const m of list) { const k = m.mode < 2 || m.mode > 4.5 ? Math.floor(m.a[2] / 60) * 2 + (m.a[0] < 0 ? 1 : 0) : m.mode > 1.5 && m.mode < 2.5 ? 2000 + Math.floor((m.z0 + m.z1) / 120) : 1000 + m.mode; if (!bands.has(k)) bands.set(k, []); bands.get(k).push(m); }
      for (const b0 of bands.values()) { const inCliff = (q) => q[2] < P.galFront + 0.5;
        // (round 3, A15) IN THE HOUSE EACH MEMBER HAS ITS OWN FIRST METRE OF SIGHT. A band of the house is seen from before the water
        // by its highest members long before the gallery's floor lets the eye see those on the hall's floor; so each member is
        // asked by its own places (at its head, with its hop, and at its feet), the band's members are kept in the order of their
        // first metres, and the band draws so many of them as are in sight by now (16 m before each one's first eye; none is put
        // out again). Nothing else of a member goes by its place in the band.
        const per = []; for (const m of b0) { const feet = spanOf(m), head = feet.map((q) => [q[0], q[1] + m.size + (m.mode < 0.5 ? m.b[3] : 0), q[2]]); per.push({ m, head, at: each ? firstSeen(land ? head : [...head, ...feet], land ? null : inCliff) - LEAD : 0 }); if (each && (per.length & 3) === 0) await ctx.yield(); }
        if (each) per.sort((p, q) => (p.at === q.at ? 0 : p.at < q.at ? -1 : 1));
        const b = per.map((p) => p.m), ats = per.map((p) => p.at), mk = makeMonkeys(b, UU), o = mk.object, pts = per.flatMap((p) => p.head), c = new THREE.Vector3(); let r = 0;
        for (const q of pts) c.add(v3a.set(q[0], q[1], q[2])); c.divideScalar(pts.length);
        for (const q of pts) r = Math.max(r, v3a.set(q[0], q[1], q[2]).distanceTo(c));
        // (round 3, A15: BOTH shapes carry the band's own bounds. The far shape had none of its own, so a band wearing it was asked
        // against a metre about the world's middle, the fall's foot: it was drawn whenever the fall's foot lay in the view, behind the
        // eye too, and not drawn where the foot lay outside the view)
        const sph = new THREE.Sphere(c, r + 4); o.traverse((x) => { if (x.isMesh) { x.geometry.boundingSphere = sph; x.frustumCulled = true; } }); for (const g2 of mk.geometries) g2.boundingSphere = sph;
        // on: 16 m before the first metre from which any place of any member is in sight (every place asked; a place behind the
        // gallery's front edge is asked through the openings); it is not put out again (what lies behind the eye is not drawn)
        const on = each ? ats[0] : firstSeen(pts, null) - LEAD, off = Infinity; let shown = -1;
        const grow = each ? (m) => { let k = 0; while (k < ats.length && ats[k] <= m) k++; if (k !== shown) { shown = k; for (const g2 of mk.geometries) g2.instanceCount = k; if (mk.shadow) mk.shadow.geometry.instanceCount = k; } } : null;
        // THE BAND'S TWO SHAPES. While the whole way within sight of it lies more than NEAR = 45 m from every place its members stand at, the
        // band wears the monkey's far shape (the same animal, parts and joints in under half the faces: no ears, eyes or muzzle, which at
        // 45 m are a pixel across); from the first to the last metre of the way that comes within NEAR of any of those places it wears
        // the whole shape. Worked in build from the way and the places alone, as the band's reach of sight is.
        let nearOn = Infinity, nearOff = -Infinity;
        for (let i = 0; i <= RN; i++) { if (Math.hypot(side * RX[i] - c.x, RY[i] - c.y, RZ[i] - c.z) >= NEAR + r) continue;
          for (const q of pts) if (Math.hypot(side * RX[i] - q[0], RY[i] - q[1], RZ[i] - q[2]) < NEAR) { nearOn = Math.min(nearOn, i * 2.5); nearOff = i * 2.5; break; } }
        spare.push(...mk.geometries);
        switches.push({ object: o, on, off, grow, ats: each ? ats : null, far: mk.setFar, nearOn: nearOn - 2.5, nearOff: nearOff + 2.5, n: b.length, at: [Math.round(c.x), Math.round(c.y), Math.round(c.z), Math.round(r)] }); g.add(o); await ctx.yield(); }
      return { object: g }; };
    const NEAR = 45;
    const gorgeMonkeys = await troopOf(here(gorgeTroop), UO, true);
    gorgeMonkeys.object.name = 'troop of the gorge'; outside.add(gorgeMonkeys.object);
    await ctx.yield();
    const leapers = [];
    { // ----- at the lake: the troop gathered under the fall, looking up; from the leaping rock they leap in and out through the curtain, on the clock
      const SH = ST['shore sitters'], LS = ST['lake stone sitters'], IT = ST['islet sitters'], RK = ST['rock sitters'], LP = ST.leapers, SRD = ST['shore rounds'];
      // one who sits looking up at the fall (every number of it first; still: it does not hop)
      // (round 3, A10: rock: the top as built of the rock it sits on, for the young one that may sit before it)
      const upAt = (kind, R, x, y, z, ok = true, still = false, rock = null) => { const tx = R.range(-12, 12), turn = R.range(-0.3, 0.3), look = -R.range(0.25, 0.55), hops = R.chance(0.25), hopH = R.range(0.3, 0.7), rate = R.range(0.6, 1.1), carry = carryOf(R, 0.15);
        return seat(kind, R, x, y, z, yawTo(x, z, tx, P.sheetZ) + turn, { look, hop: still || !hops ? 0 : hopH, rate, carry, sun: sunAt(x, z), rock }, ok); };
      // on the stones in and by the lake, one or two to a stone
      for (const st of seats) if (st.where === 1) { const take = LS.chance(0.85), two = LS.chance(0.6), dx = LS.range(-0.5, 0.5), dz = LS.range(-0.5, 0.5);
        put(lakeTroop, upAt('stone sitters', LS, st.x, st.y, st.z, take)); put(lakeTroop, upAt('stone sitters', LS, st.x + dx * st.r, st.y - 0.12, st.z + dz * st.r, take && two && st.r > 1.8)); }
      // on the shore's gravel to either hand of the fall and round the lake, thickest near the fall
      const nShore = Math.round(84 * troopK);
      for (let i = 0; i < nShore; i++) { const s = SH.sign(), e = SH.range(0.5, 5.5), k = SH() ** 1.6, z = lerp(20, OUT_Z - 12, k);
        const x = z < LAKE.cz ? s * (LAKE.ax + e) : s * (LAKE.ax * Math.sqrt(Math.max(0, 1 - ((z - LAKE.cz) / LAKE.az) ** 2)) + e);
        put(lakeTroop, upAt('shore sitters', SH, x, groundAt(x, z), z)); }
      // on the islet's top, and on the leaping rock's top to either hand of the way (those wait their turn): each sits on the rock's own top
      for (let i = 0; i < 3; i++) { const a = IT.range(0, TAU), r = IT.range(0.8, 2.6); const x = ISLET.x + Math.cos(a) * r, z = ISLET.z + Math.sin(a) * r, y = isletTop(x, z); put(lakeTroop, upAt('islet sitters', IT, x, y > 0 ? y + 0.03 : ISLET.h + 0.15, z, true, true, isletTop)); }
      for (let i = 0; i < 8; i++) { const a = RK.range(0, TAU), r = RK.range(1.4, 3.8), x = LEAP.x + Math.cos(a) * r, z = LEAP.z + Math.sin(a) * r, y = leapTop(x, z); put(lakeTroop, upAt('rock sitters', RK, x, y + 0.03, z, y > LEAP.top - 0.8, true, leapTop)); }
      // THE LEAPERS (a habit on the clock), one body each, in and out through the curtain at every moment: each sits at its place on the
      // rock's top, leaps over 9 m of water and through the sheet (the leap takes 1.0 to 1.5 s), lands on the gallery's floor, runs on at
      // 5 to 8 m/s to a place of its own there, rests, runs back, leaps out again to its seat on the rock and rests; its round takes 15 to
      // 30 s (never less than its going and 4 s of rest), from a drawn phase, so at any clock a few are in the air, either way.
      // To either hand of the way's line, never on it: 2.4 to 3.6 m aside on the rock, 4 to 7.5 m aside where it lands. Its whole way is
      // asked (A6): where it sits, its leap and its run every 0.625 m or finer, its place; at its own size, or smaller, or it does not
      // leap. The same places both ways, so the margin holds at every phase of its round.
      const nLeap = Math.round(26 * troopK), px = t2.dz, pz = -t2.dx, gy = P.galY + 0.08;
      for (let i = 0; i < nLeap; i++) { const hand = i % 2 ? 1 : -1, la = hand * LP.range(2.4, 3.6), lb = hand * LP.range(4, 7.5), back = LP.range(-1.6, 1.6), g = LP.range(6.8, 14), period0 = LP.range(15, 30);
        const tLeap = LP.range(1.0, 1.5), vRun = LP.range(5, 8), arc = LP.range(1.4, 2.2), sx = LP.range(-19, 19), sz = LP.range(-6, 4.5), ph = LP(), size0 = sizeOf(LP), young = LP.range(0.95, 1.2), tint = coat(LP);
        const ax = LEAP.x + px * la + t2.dx * back, az = LEAP.z + pz * la + t2.dz * back, bx = CROSS[0] - t2.dx * g + px * lb, bz = Math.min(CROSS[2] - t2.dz * g + pz * lb, P.galFront - 0.8), ay = leapTop(ax, az) + 0.03;
        const lenL = Math.max(Math.hypot(bx - ax, bz - az), 0.5), lenR = Math.max(Math.hypot(sx - bx, sz - bz), 0.01), vLeap = lenL / tLeap, period = Math.max(period0, 2 * (tLeap + lenR / vRun) + 4);
        const wayClear = (q) => { let c = monkeyClear(ax, ay, az, q);
          // (the leap and the run are asked every 0.625 m or finer, as a trail's lane is)
          const nl = Math.max(10, Math.ceil(Math.hypot(bx - ax, bz - az, gy - ay) / 0.625)), nr = Math.max(4, Math.ceil(Math.hypot(sx - bx, sz - bz) / 0.625));
          // (round 3, A2: the leaper's true body in the air, pitched as its arc pitches it at that share of the leap, either way)
          for (let k = 1; k < nl; k++) { const t = k / nl, y = lerp(ay, gy, t) + arc * 4 * t * (1 - t), pl = Math.atan(Math.abs(arc * 4 * (1 - 2 * t)) / lenL); c = Math.min(c, bodyClear('leap', lerp(ax, bx, t), y, lerp(az, bz, t), q, 0, -pl, pl)); }
          for (let k = 0; k <= nr; k++) c = Math.min(c, monkeyClear(lerp(bx, sx, k / nr), gy, lerp(bz, sz, k / nr), q, true));
          return c; };
        let size = 0; if (ay > LEAP.top - 0.8) for (const q of [size0, 0.5 * (size0 + young), young]) { const c = wayClear(q); if (c >= MARGIN_GO) { size = q; keepLeast('leapers', c); break; } }
        if (size) leapers.push({ mode: 3, a: [side * ax, ay, az, period], b: [side * bx, bz, side * sx, sz], ph, size, carry: 0, tint, arc, kLeap: vLeap, kRun: vRun, sun: 1 });
        if (i % 3 === 2) await ctx.yield(); }
      counts.leapers = [leapers.length, nLeap];
      // rounds on the clock on the shore
      for (let i = 0; i < 4; i++) { const s = SRD.sign(), z = SRD.range(40, 120), r = SRD.range(1.4, 2.6), x = s * ((z < LAKE.cz ? LAKE.ax : LAKE.ax * Math.sqrt(Math.max(0, 1 - ((z - LAKE.cz) / LAKE.az) ** 2))) + r + SRD.range(1.5, 3));
        rounds('shore rounds', SRD, lakeTroop, x, z, r, 0.05, { away: s }); } }
    counts.young.push(withYoung(ST['lake young'], lakeTroop));
    await ctx.yield();
    const lakeMonkeys = await troopOf(here(lakeTroop), UO, true);
    lakeMonkeys.object.name = 'troop of the lake'; outside.add(lakeMonkeys.object);
    await ctx.yield();
    // the leapers are neither the land's nor the house's: they stand in the scene itself and go by the troop's reach alone
    const leapMonkeys = await troopOf(leapers, UL);
    leapMonkeys.object.name = 'leapers'; scene.add(leapMonkeys.object);
    await ctx.yield();
    { // ----- behind the water: the gallery, the bridge with its comers and goers, the house lived in (all standing or on the clock)
      const BRN = ST['bridge runners'], BN = ST['bench sitters'], TB = ST['table sitters'], BB = ST['bed bouncers'], FL = ST['floor sitters'], SP2 = ST['step sitters'], GL = ST['gallery sitters'], HR = ST['house rounds'], fy = L.floorY;
      // is a place on the hall's floor taken by a thing of the house (with room to pass it)?
      const blocked = (x, z) => { for (const t of L.tables) { const c = Math.cos(t.rot), s = Math.sin(t.rot), dx = x - t.x, dz = z - t.z, lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < t.w / 2 + 2.1 && Math.abs(lz) < t.len / 2 + 0.9) return true; }
        for (const c of L.columns) if (Math.hypot(x - c.x, z - c.z) < c.r * 1.95 + 0.8) return true;
        for (const b of L.beds) if (Math.hypot(x - b.x, z - b.z) < 2.4) return true;
        for (const j of L.jars) if (Math.hypot(x - j.x, z - j.z) < j.r + 0.7) return true;
        for (const j of home.jars) if (Math.hypot(x - j.x, z - j.z) < j.r + 0.7) return true;
        for (const h of home.heaps) if (Math.hypot(x - h.x, z - h.z) < h.r + 0.8) return true;
        for (const st of home.stoves) if (Math.hypot(x - st.x, z - st.z) < 5) return true;
        for (const g of L.stones) if (Math.hypot(x - g.x, z - g.z) < g.r + 0.8) return true;
        for (const b of L.bamboo) if (Math.hypot(x - b.x, z - b.z) < 2.2) return true;
        for (const p of L.posts) if (Math.hypot(x - p.x, z - p.z) < 1.9) return true;
        if (Math.hypot(x - L.stove.x, z - L.stove.z) < 5 || Math.hypot(x - L.plum.x, z - L.plum.z) < 1.4 || Math.hypot(x - L.pine.x, z - L.pine.z) < 1.2) return true;
        return Math.abs(x - cxH) > P.hallHalf * 0.74 || z < L.step.z + 4.5; };
      const blockedBut = (x, z) => { for (const t of L.tables) { const c = Math.cos(t.rot), s = Math.sin(t.rot), dx = x - t.x, dz = z - t.z, lx = dx * c - dz * s, lz = dx * s + dz * c; if (Math.abs(lx) < t.w / 2 + 1.6 && Math.abs(lz) < t.len / 2 + 0.6) return true; }
        for (const b of L.beds) if (Math.hypot(x - b.x, z - b.z) < 2.2) return true;
        for (const j of [...L.jars, ...home.jars]) if (Math.hypot(x - j.x, z - j.z) < j.r + 0.5) return true;
        for (const b of L.bamboo) if (Math.hypot(x - b.x, z - b.z) < 2.2) return true;
        for (const st of home.stoves) if (Math.abs(x - st.x) < st.d / 2 + 1.4 && Math.abs(z - st.z) < st.w / 2 + 0.6) return true;
        for (const h of home.heaps) if (Math.hypot(x - h.x, z - h.z) < h.r + 0.4) return true;
        return Math.abs(x - cxH) > P.hallHalf * 0.8; };
      const clearRun = (ax, az, bx, bz) => { const n = Math.ceil(Math.hypot(bx - ax, bz - az) / 1.2); for (let i = 1; i <= n; i++) if (blocked(lerp(ax, bx, i / n), lerp(az, bz, i / n))) return false; return true; };
      // THE BRIDGE RUNNERS (a habit on the clock): a standing coming and going over the bridge. Each one's whole way (its place in the
      // gallery, the bridge's head, the bridge, the gate, a free place of the hall's floor) is one body's round: in at a ground speed of
      // its own (4 to 7.5 m/s), a rest at its place in the hall, out again the same way, a rest in the gallery (a share of 0.1 to 0.35 of
      // each crossing), from a drawn phase. Going in they keep 0.5 to 1.9 m to one hand of the bridge's and the gate's middle, coming
      // out the same to the other hand, so none meets another head on. Every number of a runner is drawn first (six places in the hall
      // among them: it takes the first that is free and can be run to, else it stops just inside the gate); its whole way on both hands
      // is asked at its own size, or smaller (A6: as a body the clock moves it keeps the whole margin, at every phase of its round).
      // (round 3, A5: the bridge's head is the foot of the ramp before the deck; a runner's feet are on the floor as built, the
      // picture's height at every place of its way, on both hands)
      const nRun = Math.round(40 * troopK), zHead = P.bridgeZ0 + 1.5 + P.headRamp, zFoot = P.bridgeZ1 - 1.4; let nr = 0;
      for (let i = 0; i < nRun; i++) { const speed = BRN.range(4, 7.5), ox = BRN.range(0.5, 1.9), rest = BRN.range(0.1, 0.35), size0 = sizeOf(BRN), young = BRN.range(0.95, 1.2), tint = coat(BRN), ph = BRN(), carry = BRN.chance(0.3) ? 1 : 0;
        const gx = P.mouthX + BRN.range(-6, 6), gz = P.galBack + BRN.range(1, 5), inGate = BRN.range(0, 3), ends = []; for (let t = 0; t < 6; t++) ends.push([cxH + BRN.range(-22, 22), BRN.range(P.hallZ0 - 10, L.garden.z1)]);
        // (the lane's hand in the place's own x: the shader lays it in the world's x, the same for both mirrors)
        const hx = side * ox; let dx = cxH + hx, dz = P.hallZ0 - 4 - inGate;
        for (const e of ends) if (!blocked(e[0], e[1]) && clearRun(cxH + hx, P.hallZ0 - 2, e[0], e[1]) && clearRun(cxH - hx, P.hallZ0 - 2, e[0], e[1])) { dx = e[0]; dz = e[1]; break; }
        const wayClear = (q) => { let c = 1e9; for (const h of [hx, -hx]) { const w = [[gx, P.galY + 0.08, gz], [P.bridgeX + h, P.deckY + 0.03, zHead], [P.bridgeX + h, P.deckY + 0.03, zFoot], [cxH + h, fy + 0.03, P.hallZ0 - 2], [dx, fy + 0.03, dz]];
            for (let j = 0; j < 4; j++) { const A = w[j], B = w[j + 1], n = Math.max(1, Math.ceil(Math.hypot(B[0] - A[0], B[2] - A[2]) / 0.625));
              // (round 3, A2: the runner's true body, with its stride's lift and the 0.42 m it weaves to either hand)
              for (let t = 0; t <= n; t++) { const x = lerp(A[0], B[0], t / n), z = lerp(A[2], B[2], t / n); c = Math.min(c, bodyClear('run', x, floorAt(x, z), z, q, 0.26, 0, 0, 0.42)); } } }
          return c; };
        let size = 0; for (const q of [size0, 0.5 * (size0 + young), young]) { const c = wayClear(q); if (c >= MARGIN_GO) { size = q; keepLeast('bridge runners', c); break; } }
        if (size) { houseTroop.push({ mode: 4, ph, size, carry, tint, a: [side * gx, gz, ox, 0], b: [side * dx, dz, speed, rest] }); nr++; }
        await ctx.yield(); }
      counts.bridgeRunners = [nr, nRun];
      await ctx.yield();
      // those already in: on the benches (some with a bowl), on the tables among the bowls, on the beds (half of them bouncing), on the floor
      for (const b of L.benchSeats) { const take = BN.chance(0.7), turn = BN.range(-0.4, 0.4), bowl = BN.chance(0.4); put(houseTroop, seat('bench sitters', BN, b.x, b.y, b.z, side * b.yaw + turn, { carry: bowl ? 2 : 0 }, take, true)); }
      for (const b of L.bowls) { const take = TB.chance(0.35), dx = TB.range(-0.5, 0.5), dz = TB.range(-0.4, 0.4), yaw = TB.range(0, TAU), hops = TB.chance(0.4), hopH = TB.range(0.25, 0.5), rate = TB.range(0.6, 1.1);
        put(houseTroop, seat('table sitters', TB, b.x + dx, b.y + 0.02, b.z + dz, yaw, { carry: 2, hop: hops ? hopH : 0, rate }, take, true)); }
      for (const b of L.bedTops) { const n = BB.int(1, 2), c = Math.cos(b.rot), s = Math.sin(b.rot);
        for (let i = 0; i < 2; i++) { const bounce = BB.chance(0.55), lx = BB.range(-1.1, 1.1), lz = BB.range(-0.5, 0.5), yaw = BB.range(0, TAU), hopH = BB.range(0.6, 1.1), rate = BB.range(0.7, 1.2);
          put(houseTroop, seat('bed bouncers', BB, b.x + lx * c + lz * s, b.y + 0.03, b.z - lx * s + lz * c, yaw, { hop: bounce ? hopH : 0, rate }, i < n, true)); } }
      await ctx.yield();
      const nFloor = Math.round(46 * troopK);
      for (let i = 0; i < nFloor; i++) { const x = cxH + FL.range(-24, 24), z = FL.range(P.hallZ0 - 6, L.step.z + 5), yaw = FL.range(0, TAU), carry = FL.int(0, 2), hops = FL.chance(0.12), hopH = FL.range(0.3, 0.6), rate = FL.range(0.6, 1.1);
        put(houseTroop, seat('floor sitters', FL, x, fy + 0.03, z, yaw, { carry, hop: hops ? hopH : 0, rate }, !blocked(x, z), true)); }
      // on the step before the seat (the seat itself stays empty), looking down the hall; in the gallery, looking at the bright curtain
      for (let i = 0; i < 9; i++) { const x = cxH + SP2.sign() * SP2.range(4.5, 22), back = SP2.range(1.5, 6), turn = SP2.range(-0.4, 0.4), carry = SP2.int(0, 2);
        put(houseTroop, seat('step sitters', SP2, x, L.step.y + 0.03, L.step.z - back, yawTo(x, L.step.z, cxH, L.step.z + 40) + turn, { carry }, true, true)); }
      for (let i = 0; i < 9; i++) { const x = GL.range(-19, 19), z = GL.range(-4.5, 4.5), turn = GL.range(-0.5, 0.5); put(houseTroop, seat('gallery sitters', GL, x, galFloorAt(P, noise, x, z) + 0.05, z, yawTo(x, z, x, 12) + turn, { look: -0.3 })); }
      await ctx.yield();
      // rounds on the clock: squabbles round free spots of the floor
      for (let i = 0; i < 7; i++) { const x = cxH + HR.range(-20, 20), z = HR.range(P.hallZ0 - 10, L.garden.z0 - 4), r = HR.range(1.4, 3); let ok = true;
        for (let a = 0; a < 8 && ok; a++) ok = !blocked(x + Math.cos(a * 0.785) * r, z + Math.sin(a * 0.785) * r);
        rounds('house rounds', HR, houseTroop, x, z, r, 0.045, { y: fy + 0.03, ok, carry0: 2, lift: 0.1 }); }
      await ctx.yield();
      // THE HOME'S TROOP (B3): young ones chasing one another round every column (the round 1.3 to 2 m off its foot, run only where its
      // whole circle is free of the house's things); at every stove two by the fire, turned to it; at every heap of fruit one or two
      // picking, turned to it, some with a peach in hand; and a crowd gathered before the step, turned to the seat, thicker toward it
      // (a place's distance from the step is 26 m by the square of a drawn share: half of them stand within 6.5 m of it), one in five
      // hopping where it stands. Every number of each is drawn first; each sits only on free floor and by the margin.
      const CR = ST['column rounds'], HE = ST['hearth sitters'], HP = ST['heap pickers'], CW = ST.crowd; let nCol = 0, nCrowd = 0;
      for (const c of L.columns) { const r = c.r * 1.95 + CR.range(1.3, 2); let ok = true;
        for (let a = 0; a < 8 && ok; a++) { const px = c.x + Math.cos(a * 0.785) * r, pz = c.z + Math.sin(a * 0.785) * r; ok = !L.columns.some((q) => q !== c && Math.hypot(px - q.x, pz - q.z) < q.r * 1.95 + 0.8) && !blockedBut(px, pz); }
        if (rounds('column rounds', CR, houseTroop, c.x, c.z, r, 0.06, { y: fy + 0.03, ok, lift: 0.1, young: true })) nCol++; }
      for (const st of home.stoves) { const sd = Math.sign(st.x - cxH) || 1; for (let i = 0; i < 2; i++) { const off = HE.range(3.4, 5.2), dz = HE.range(-3, 3), turn = HE.range(-0.3, 0.3), bowl = HE.chance(0.5), x = st.x - sd * off, z = st.z + dz;
          put(houseTroop, seat('hearth sitters', HE, x, fy + 0.03, z, yawTo(x, z, st.x, st.z) + turn, { carry: bowl ? 2 : 0 }, !blockedBut(x, z), true)); } }
      for (const h of home.heaps) for (let i = 0; i < 2; i++) { const take = i === 0 || HP.chance(0.5), a = HP.range(0, TAU), off = h.r + HP.range(0.55, 1.1), turn = HP.range(-0.3, 0.3), peach = HP.chance(0.6), x = h.x + Math.cos(a) * off, z = h.z + Math.sin(a) * off;
        put(houseTroop, seat('heap pickers', HP, x, fy + 0.03, z, yawTo(x, z, h.x, h.z) + turn, { carry: peach ? 1 : 0 }, take && !blockedBut(x, z), true)); }
      for (let i = 0, n = Math.round(44 * troopK); i < n; i++) { const k = CW(), x = cxH + CW.range(-21, 21), turn = CW.range(-0.35, 0.35), hops = CW.chance(0.2), hopH = CW.range(0.3, 0.6), rate = CW.range(0.7, 1.2), carry = CW.int(0, 2), z = L.step.z + 4.6 + 26 * k * k;
        const m = seat('crowd', CW, x, fy + 0.03, z, yawTo(x, z, L.seat.x, L.seat.z) + turn, { carry, hop: hops ? hopH : 0, rate }, !blocked(x, z), true); if (m && !m.gone) nCrowd++; put(houseTroop, m); }
      counts.homeTroop = [nCol, L.columns.length, nCrowd, Math.round(44 * troopK)]; }
    await ctx.yield();
    counts.young.push(withYoung(ST['house young'], houseTroop));
    await ctx.yield();
    const houseMonkeys = await troopOf(here(houseTroop), UI);
    houseMonkeys.object.name = 'troop of the house'; inside.add(houseMonkeys.object);
    await ctx.yield();

    // ------------------------------------------------------------ thickets on the slopes (round shrubs in clumps of three to six, some in flower)
    // (a set number of places is asked; every number of a clump and of its six shrubs is drawn before any test)
    { const TK = ST.thickets, TS = ST['thicket shapes'], pts = [], geo = [flora.bushGeometry({ rng: TS, detail: 0, leaf: '#3c8438' }), flora.bushGeometry({ rng: TS, detail: 0, leaf: '#55953c', flowers: 0.5, flowerColor: '#f4a7b9' }), flora.bushGeometry({ rng: TS, detail: 0, leaf: '#2f6e36' })];
      const asked = Math.round(156 * densT); let stood = 0;
      for (let c = 0; c < asked; c++) { const x = TK.range(-190, 190), z = TK.range(-70, CZ1 - 4), thin = TK(), n = TK.int(3, 6), zr = zRamp(x), sh = [];
        for (let i = 0; i < 6; i++) sh.push([TK.range(-5, 5), TK.range(-5, 5), TK.range(2, 4.2), TK.int(0, 2), TK.range(0, TAU)]);
        if (Math.abs(x) < WALL_HALF + 4 && z < zr + 7 && z > zr - 24) continue;
        if (z > zr && -Math.max(lakeIn(x, z), streamIn(x, z)) < 9) continue;
        const near = Math.min(routeDistXZ(x, z), Math.hypot(x, z - 10)); if (near < 14 || thin > 1.2 - near / 170) continue;
        for (let i = 0; i < n; i++) { const q = sh[i], bx = x + q[0], bz = z + q[1], y = groundP(bx, bz); if (y > 150 || Math.abs(groundP(bx + 2, bz) - y) > 3.2 || Math.abs(groundP(bx, bz + 2) - y) > 3.2) continue;
          // (A1: a shrub keeps the margin from the whole line, the way and the axis behind the entry, with its own radius and height; one
          // dealt into the opening's tube or within the margin is set out, away from the axis, to the first place where it stands by its rules)
          const g = geo[q[3]], sFree = (nx, nz, ny) => crownFree(g, q[2], nx, nz) && clearOf(nx, ny, ny + g.userData.height * q[2], nz, g.userData.radius * q[2]) >= MARGIN;
          const o = sFree(bx, bz, y) ? [bx, bz] : setOut(crownFree(g, q[2], bx, bz) ? 'thickets, by the way' : 'thickets', bx, bz, (nx, nz) => { const ny = groundP(nx, nz); return !(ny > 150 || Math.abs(groundP(nx + 2, nz) - ny) > 3.2 || Math.abs(groundP(nx, nz + 2) - ny) > 3.2) && sFree(nx, nz, ny); });
          if (!o) continue;
          const p = noteTall(3, g, ptOut(o, bx, bz, q[2], q[3], q[4])); keepLeast('thickets', clearOf(o[0], p.y, p.y + g.userData.height * q[2], o[1], g.userData.radius * q[2])); pts.push(p); }
        stood++; }
      counts.thickets = stood;
      const thick = flora.makeScatter({ rng: ST['thicket tints'], points: pts, variants: geo, material: leafMat, chunks: 6, cullDistance: Infinity, shade: shadeOf, tint: 0.2, hue: 0.05 });
      thick.object.name = 'thickets'; outside.add(thick.object); updaters.push((dt, t, cam) => thick.update(dt, t, cam));
      // (round 3, A15) THE PLANTS' ROOM. All the trees, shrubs, ferns and reeds under the sky hold PLANT_ROOM triangles at the most
      // (where the basin opens before the sill nearly all of them are in view at once, with the troop and the stones). Where the
      // dealing gives more, what is over is left out of THE FAR WOODS: the slopes' trees and the thickets' shrubs that stand
      // over 90 m, in plan, from every place of the way, which are small in every picture and many; evenly among them (every
      // so-manyth, in their own order; never more than half of them), after all numbers are drawn and all clumps made, so that
      // no other plant moves or changes. On nearly every seed none is left out.
      { const far = [], drop = new Map(); let sum = 0, left = 0; plantTris += thick.triangles;
        for (const sc of [woodsSc, thick]) for (const mesh of sc.meshes) { const t = mesh.geometry.userData.triangles || 0;
          for (let i = 0; i < mesh.count; i++) { mesh.getMatrixAt(i, m4s); const e = m4s.elements; if (routeDistXZ(side * e[12], e[14]) >= 90) { far.push([mesh, i]); sum += t; } } }
        if (plantTris > PLANT_ROOM && sum > 0) { const out = Math.min(0.5, (plantTris - PLANT_ROOM) / sum); let acc = 0;
          for (const [mesh, i] of far) { acc += out; if (acc < 1) continue; acc -= 1; left++; if (!drop.has(mesh)) drop.set(mesh, new Set()); drop.get(mesh).add(i); }
          for (const [mesh, set] of drop) { const M = mesh.instanceMatrix.array, K = mesh.instanceColor.array; let j = 0;
            for (let i = 0; i < mesh.count; i++) { if (set.has(i)) continue; if (j !== i) { M.copyWithin(j * 16, i * 16, i * 16 + 16); K.copyWithin(j * 3, i * 3, i * 3 + 3); } j++; }
            mesh.count = j; mesh.instanceMatrix.needsUpdate = true; mesh.instanceColor.needsUpdate = true; mesh.computeBoundingSphere(); mesh.boundingSphere.radius += 3; } }
        counts.farWoods = [Math.round(sum), far.length, left]; counts.plantTris = Math.round(plantTris); }
      await bySight(woodsSc); await bySight(thick); }
    await ctx.yield();

    // ------------------------------------------------------------ the other life of the place (all on the clock, in loops that read at every phase:
    // no share of the flight is handed to the fauna, so the cranes' crossing too flies on the kit's own clock)
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene), rng: ST.fauna });
    // THE BIRDS FLY AT PLACES, OVER THE GROUND (A9). The kit has no crane on the wing: these are its long-necked, long-legged flyers with
    // the neck and bill set by its own shape numbers (a neck of 0.5, so the bill is straight, and a bill twice as long), white, the neck
    // dark, the head white (the kit paints a whole head, so the red crown is left out).
    const CRANE = { body: '#f6f6f2', belly: '#ffffff', wingC: '#f0f0ee', trail: '#1c1c20', tip: '#1c1c20', beak: '#8a8468', head: '#f6f6f2', neckC: '#2a2a2e', legC: '#3a3a3a', palette: { neck: 0.5, beakLen: 0.2 } };
    // the highest ground (or water) under a round patch, asked on rings 6 m apart
    const highest = (cx, cz, r) => { let h = Math.max(0, groundP(cx, cz)); for (let q = 6; q <= r; q += 6) for (let a = 0; a < 16; a++) h = Math.max(h, groundP(cx + Math.cos(a * 0.3927) * q, cz + Math.sin(a * 0.3927) * q)); return h; };
    // The crossing (a habit on the clock): nine cranes fly one line over the lake again and again (the line, a gap of three tenths of
    // it, the line again, from the flock's own drawn phase), over the place where the way begins its turn round the islet, toward the
    // fall's western foot. Their line (the kit's: 330 m long, bowed 20 m) is walked
    // every 5 m with 12 m to either hand for the flock's breadth: it lies 26 m over the way at its middle, or higher where the ground asks,
    // and rises toward its two ends so that it is nowhere less than 12 m over the ground or the water under it.
    { const dC = S.turn0, pC = path.posAtDist(dC, new THREE.Vector3()), tC = path.tangentAtDist(dC, new THREE.Vector3()); tC.y = 0; tC.normalize();
      const dir = new THREE.Vector3(side * -P.W / 2 - pC.x, 0, footZ - pC.z).normalize(), rgt = new THREE.Vector3(-tC.z, 0, tC.x), hand = Math.sign(rgt.dot(dir)) || 1;
      const angle = Math.acos(clamp(tC.dot(dir), -1, 1)) * 180 / Math.PI, span = 330, bow = span * 0.06, bx = new THREE.Vector3(-dir.z, 0, dir.x), CL = 12;
      const under = (t) => { const x = pC.x + dir.x * t * span + bx.x * bow * (1 - 4 * t * t), z = pC.z + dir.z * t * span + bx.z * bow * (1 - 4 * t * t); let g = 0;
        for (const o of [-CL, 0, CL]) g = Math.max(g, ground(x + bx.x * o, z + bx.z * o)); return g; };
      let height = 26, sag = 0; for (let t = -0.12; t <= 0.121; t += 5 / span) height = Math.max(height, under(t) + CL - pC.y);
      for (let t = -0.5; t <= 0.501; t += 5 / span) if (Math.abs(t) > 0.12) sag = Math.max(sag, (under(t) + CL - pC.y - height) / (4 * t * t));
      counts.cranes = [Math.round(angle), Math.round(height), Math.round(sag)];
      // (the whole line with the flock's breadth and 6 m over and under it, asked of the margin: it holds at every clock)
      for (let t = -0.5; t <= 0.501; t += 5 / span) { const x = pC.x + dir.x * t * span + bx.x * bow * (1 - 4 * t * t), z = pC.z + dir.z * t * span + bx.z * bow * (1 - 4 * t * t), y = pC.y + height + sag * 4 * t * t; keepLeast('the cranes\' line', clearOf(side * x, y - 6, y + 6, z, CL)); }
      fauna.add(F.makeFlock({ rng: ST['crane flight'], species: 'flamingos', count: 9, size: 1.9, ...CRANE, cross: { path, u: (S.sill + 6) / PL, lead: dC - S.sill - 6, angle, side: hand, height, sag, span, duration: DUR } }), { range: 500 });
      // (u and lead only say WHERE the line lies: over the way's place dC; nothing reads the share of the flight while we fly)
    }
    // six more circle over the lake's middle, on a round of 0.8 of the lake's half breadth, at 0.6 of the fall's height (under its lip, over
    // its mist), and never less than 12 m over the highest ground under their round (the kit lets the round swell by 0.3 and wave 12 m)
    { const r = 0.8 * LAKE.ax, y = Math.max(0.6 * P.H, highest(0, LAKE.cz, r * 1.3 + 6) + 12 + 12);
      keepLeast('the cranes\' round', clearOf(0, y - 18, y + 18, LAKE.cz, r * 1.3 + 8));
      fauna.add(F.makeFlock({ rng: ST.cranes, species: 'flamingos', count: 6, size: 1.9, ...CRANE, speed: 9, center: [0, y, LAKE.cz], radius: r, height: 10 }), { range: 500 }); }
    // swifts hawk over the pool under the third small fall: a round of 9 m over the pool's middle (8 m below the fall), the flock 8 m broad,
    // 4 m over the highest ground within its reach (the round's swell, the flock's breadth, what each bird wanders)
    { const zc = falls[2].z + 8, xc = courseX(zc), reach = 9 * 1.3 + 0.9 * 8 + 3, y = highest(xc, zc, reach) + 4 + 1.2 * 3 + 0.9 * 4 + 2;
      // (their whole room, asked of the margin: the round's swell, the flock's breadth and what each bird wanders, at every clock)
      keepLeast('swifts', clearOf(xc, y - 9.2, y + 9.2, zc, reach));
      fauna.add(F.makeFlock({ rng: ST['small birds'], species: 'swifts', count: 18, size: 0.8, spread: [8, 4, 8], wander: [3, 2, 3, 0.7], center: [side * xc, y, zc], radius: 9, height: 3 }), { range: 260 }); }
    await ctx.yield();
    { // cranes standing in the lake's shallows on the west shore and by the outlet; a few deer at the water on the far shore; butterflies over the banks
      const WD = ST.waders, wp = [], bp = [];
      for (let i = 0; i < 6; i++) { const z = WD.range(60, 150), s = i < 4 ? -1 : 1, edge = z < LAKE.cz ? LAKE.ax : LAKE.ax * Math.sqrt(Math.max(0, 1 - ((z - LAKE.cz) / LAKE.az) ** 2)), x = s * (edge - WD.range(1.2, 3));
        if (routeDistXZ(x, z) > 9) { wp.push([side * x, 0, z]); keepLeast('waders', clearOf(x, 0, 2.4, z, 1.5)); } }
      if (wp.length) fauna.add(F.makeWaders({ rng: WD, species: 'crane', positions: wp, count: wp.length, level: 0, heightAt: terrain.surfaceAt, size: 1.15 }), { range: 260 });
      await ctx.yield();
      const DE = ST.deer, dz = DE.range(96, 132), dxp = -(LAKE.ax * Math.sqrt(Math.max(0, 1 - ((dz - LAKE.cz) / LAKE.az) ** 2)) + 7);
      keepLeast('deer', clearOf(dxp, groundAt(dxp, dz), groundAt(dxp, dz) + 2.4, dz, 9));
      fauna.add(F.makeHerd({ rng: DE, species: 'deer', count: 3, center: [side * dxp, groundAt(dxp, dz), dz], radius: 7, heightAt: terrain.surfaceAt, path, clear: 9, mode: 'graze', coat: '#a8743c' }), { range: 260 });
      await ctx.yield();
      const BF = ST.butterflies;
      // (a butterfly's home keeps 6 m from the way: the margin and the 2.4 m it roams, with a metre)
      for (let i = 0; i < 26; i++) { const z = BF.range(OUT_Z + 4, CZ1 - 10), s = BF.sign(), x = courseX(z) + s * (half(z) + BF.range(2, 9)) * courseSec(z), up = BF.range(0.8, 2.2), y = groundAt(x, z) + up; if (fits('butterflies', x, y, y, z, 0, 6)) bp.push([side * x, y, z]); }
      for (let i = 0; i < 10; i++) { const z = BF.range(40, 150), s = BF.sign(), x = s * ((z < LAKE.cz ? LAKE.ax : LAKE.ax * Math.sqrt(Math.max(0, 1 - ((z - LAKE.cz) / LAKE.az) ** 2))) + BF.range(2, 8)), up = BF.range(0.8, 2.2), y = groundAt(x, z) + up; if (fits('butterflies', x, y, y, z, 0, 6)) bp.push([side * x, y, z]); }
      // (two butterflies to a home, each AT its home: the kit strews whatever it is given beyond its list of homes about a
      //  home by a law with no bound, and such a one's box of wander came within 2 m of the way; so every home is named twice)
      fauna.add(F.makeButterflies({ rng: BF, count: bp.length * 2, positions: bp.concat(bp), size: 2.2, roam: [2.4, 1.0, 0.6, 0.04] }), { range: 120 });
      if (night) { const FF = ST.fireflies, fp = []; for (let i = 0; i < 40; i++) { const z = FF.range(OUT_Z, CZ1 - 8), x = courseX(z) + FF.range(-1, 1) * (half(z) + 10); fp.push([side * x, Math.max(groundAt(x, z), level(z)) + FF.range(0.6, 3.5), z]); }
        // (each firefly is dealt to its own place here, about one of the homes, and stays only where it keeps 7 m from the way:
        //  its roam and the 4 m within which the kit's own guard would dim it at the lens; the kit's own strewing has no bound)
        const fl = []; for (let i = 0; i < 560; i++) { const q = fp[i % fp.length], x = side * q[0] + Math.max(-12, Math.min(12, FF.gauss() * 5)), z = q[2] + Math.max(-12, Math.min(12, FF.gauss() * 5)), y = Math.max(groundAt(x, z), level(z)) + FF.range(0.6, 3.5);
          if (fits('fireflies', x, y, y, z, 0, 7)) fl.push([side * x, y, z]); }
        if (fl.length) fauna.add(F.makeFireflies({ rng: FF, count: fl.length, positions: fl, color: '#d8ff7a', size: 0.2 }), { range: 200 }); } }
    await ctx.yield();

    // ------------------------------------------------------------ petals: over the stream and the lake (the kit's field, round the eye, on the clock);
    // in the hall a fixed box of them before the moon-door, drifting in on its light
    const PETAL = night ? ['#c9c4e6', '#e6e2f6', '#a9a6d6'] : hour === 'golden' ? ['#ffc0a8', '#ffe2c8', '#ff9d8a'] : ['#ffc4d6', '#ffe6ee', '#ff9dbb'];
    const petals = fx.makeParticles({ rng: ST.petals, preset: 'petals', count: Math.round(760 * dens), box: [46, 26, 46], colors: PETAL, size: [0.09, 0.19], time: U.uTime,
      velocity: [side * 1.1, -0.9, 0.9], lightDir: [sunDir.x, sunDir.y, sunDir.z] });
    // EACH PETAL IS THERE BY ITS OWN PLACE (round 3, A7). The petal fall belongs to the open air south of the sheet. The whole field
    // was dimmed together while the eye went from 8 to 1 m before the sheet; now nothing of it goes by the eye: every petal has its own
    // strength by its own z in the world, whole 8 m and more south of the sheet's plane and gone 1 m before it, so the fall stands
    // in the air outside and thins toward the water, wherever it is seen from. The kit's field has no such option and the kit is
    // not changed: this field's own material (this one object's two shader strings, before they are first compiled) takes one more
    // number, the sheet's z, and one more factor in the petal's strength. Should the kit's lines ever read otherwise, the two
    // places are not found: then the field is not put in the scene at all (counts.petalsByOwnZ says which).
    { const mat = petals.material, a = 'vAlpha = edge * ', b = 'uniform vec2 uSize, uNear;', ok = mat.vertexShader.split(a).length === 2 && mat.vertexShader.split(b).length === 2;
      if (ok) { mat.vertexShader = mat.vertexShader.replace(b, b + ' uniform float uSheetZ;').replace(a, 'vAlpha = smoothstep(uSheetZ + 1., uSheetZ + 8., world.z) * edge * ');
        mat.uniforms.uSheetZ = { value: P.sheetZ }; mat.needsUpdate = true; scene.add(petals.object); }
      counts.petalsByOwnZ = ok; }
    const hallPetals = fx.makeParticles({ rng: ST['hall petals'], preset: 'petals', count: Math.round(300 * dens), follow: false, time: U.uTime, colors: PETAL, size: [0.09, 0.2],
      center: [side * L.ring[0], L.ring[1] - 1, L.ring[2] + 17], box: [24, 20, 34], velocity: [0.15, -0.55, 1.5], velocityRandom: [0.6, 0.3, 0.7], turbulence: [0.8, 0.3, 0.6], intensity: 1.5 });
    hall.add(hallPetals.object);
    // DROPS FLY PAST AT THE SHEET (B1): a box of falling drops fixed in the world along the whole sheet where it passes the gallery (the
    // fall's breadth, from the ledge's foot to the gallery's roof, 3.5 m to either side of the sheet), on the clock; they fall as fast as
    // the sheet does there (some 33 m/s after 58 m) and are thrown out as it is
    const drops = fx.makeParticles({ rng: ST['sheet drops'], preset: 'rain', count: 1500, follow: false, time: U.uTime, center: [0, (P.galY - 3 + P.galTop) / 2, P.sheetZ], box: [P.W, P.galTop - P.galY + 3, 7],
      velocity: [0, -30, 2.3], velocityRandom: [0.8, 7, 0.9], colors: [HOURS.fallLit, HOURS.fallShade, HOURS.fallLit], size: [0.02, 0.05], stretch: 0.035, intensity: 1.1 });
    scene.add(drops.object);
    updaters.push((dt, t) => { petals.update(dt, t); hallPetals.update(dt, t); drops.update(dt, t); });
    await ctx.yield();

    // ------------------------------------------------------------ drips from the hall's roof: each falls from its own stone tooth to the floor, on the clock
    // and from the gallery's roof (B2): eighteen places between the back wall's foot and the drip line, each from the roof's own height there
    // to the floor's. A drop's whole fall keeps the margin (its numbers are drawn first), so none falls through the eye.
    { const DR = ST.drips, GD = ST['gallery drips'], list = [];
      for (const d of L.drips) { const T = DR.range(2.6, 6.5), ph = DR(), w = DR.range(0.7, 1.2); if (fits('roof drips', d[0], L.floorY, d[1], d[2], 0)) list.push([d[0], d[1], d[2], Math.max(d[1] - L.floorY, 1), T, ph, w]); }
      for (let i = 0; i < 18; i++) { const x = GD.range(-19, 19), k = GD(), T = GD.range(2.2, 5), ph = GD(), w = GD.range(0.8, 1.3), z = lerp(galFootZ(P, noise, x) + 1.5, P.lipZ + 1.5, k), top = galRoofAt(P, noise, x, z) - 0.3, bot = galFloorAt(P, noise, x, z);
        if (fits('gallery drips', x, bot, top, z, 0)) list.push([x, top, z, top - bot, T, ph, w]); }
      counts.drips = [list.length, L.drips.length + 18];
      const n = list.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4);
      list.forEach((d, i) => { A.set([side * d[0], d[1], d[2], d[3]], i * 4); B.set([d[4], d[5], d[6], 0], i * 4); });
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, -1, 1, 0, 1, 1, 0], 3)); g.setIndex([0, 1, 2, 2, 1, 3]);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4)); g.instanceCount = n;
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(side * P.hallX, P.deckY + 14, (P.galFront + P.hallZ1) / 2), 140);
      const mat = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        uniforms: { ...fx.fogUniforms(), uTime: U.uTime, uCol: { value: U.uWaterLight.value.clone().multiplyScalar(0.55) }, uCaveAir: U.uCaveAir },
        vertexShader: `attribute vec4 iA, iB; uniform float uTime; varying vec2 vQ; varying float vA; ${fx.GLSL_FOG_PARS_VERT}
          void main() { vQ = position.xy;
            // a drop swells at the tooth for most of its turn, then falls (9.8 m/s2) and is gone at the floor
            float T = iB.x, f = fract(uTime / T + iB.y) * T, tf = sqrt(max(iA.w, 0.) / 4.9), hang = max(T - tf, 0.), s = max(f - hang, 0.), y = iA.y - 4.9 * s * s;
            float grow = clamp(f / max(hang, .01), 0., 1.), len = .05 + .03 * min(s * 9.8, 14.);
            vec3 c = vec3(iA.x, y, iA.z), toEye = cameraPosition - c, r = normalize(vec3(toEye.z, 0., -toEye.x) + 1e-5);
            vec3 w = c + r * position.x * .034 * iB.z * (.4 + .6 * grow) + vec3(0., position.y * len * (s > 0. ? 1. : .5 * grow), 0.);
            vA = step(y, iA.y + .001) * step(iA.y - iA.w, y) * (s > 0. ? 1. : grow);
            vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
        fragmentShader: `uniform vec3 uCol; varying vec2 vQ; varying float vA; ${fx.GLSL_FOG_PARS_FRAG} ${AIR_GLSL}
          void main() { float a = (1. - vQ.x * vQ.x) * (1. - vQ.y * vQ.y) * vA; if (a < .01) discard; gl_FragColor = vec4(uCol * a * (1. - airAmt(1.)), 1.); }` });
      const drips = new THREE.Mesh(g, mat); drips.renderOrder = 3; inside.add(drips); }
    await ctx.yield();

    // ------------------------------------------------------------ the stoves' fires and their smoke (B3), on the clock
    // A flame licks out of each of a stove's three mouths (a thin sheet that turns about its upright to face the eye; its tongues climb on the
    // clock, every phase reads); smoke climbs from each flue's top toward the roof, thinning as it goes (the mist's own puffs in the smoke's colours).
    { const FI = ST['stove fires'], SK = ST['stove smoke'], fl = [], puffs = [], fy = L.floorY;
      for (const st of home.stoves) { const c = Math.cos(st.rot), sn = Math.sin(st.rot), sd = Math.sign(st.x - cxH) || 1;
        for (const hx of [-0.3, 0, 0.3]) { const lx = hx * st.w, lz = st.d / 2 - 0.2; fl.push(side * (st.x + lx * c + lz * sn), fy + 0.5, st.z - lx * sn + lz * c, FI.range(0.75, 1.15), FI(), FI.range(0.8, 1.3), FI.range(0, 99), 0); }
        const fx0 = st.x + sd * (st.d / 2 - 0.3), top = fy + st.h + 6;
        for (let i = 0; i < 7; i++) puffs.push({ p: [side * (fx0 + SK.range(-0.4, 0.4)), top + SK.range(-0.3, 0.6), st.z + SK.range(-0.4, 0.4)], size: SK.range(1.3, 2.4), rise: SK.range(1.1, 1.9), drift: [side * -sd * SK.range(0.05, 0.3), SK.range(-0.15, 0.15)], life: SK.range(9, 14), ph: SK(), op: SK.range(0.16, 0.3), grow: 2.6 }); }
      const smoke = makeMist(puffs, { ...U, uMistLit: { value: new THREE.Color(night ? '#7f8894' : '#cfc4b4') }, uMistShade: { value: new THREE.Color(night ? '#3a4048' : '#6a6056') }, uBow: { value: 0 }, uMistAmt: { value: 1 } });
      smoke.object.name = 'smoke of the stoves'; hall.add(smoke.object);
      const n = fl.length / 8, A = new Float32Array(n * 4), B = new Float32Array(n * 4); for (let i = 0; i < n; i++) { A.set(fl.slice(i * 8, i * 8 + 4), i * 4); B.set(fl.slice(i * 8 + 4, i * 8 + 8), i * 4); }
      const fg = new THREE.InstancedBufferGeometry();
      fg.setAttribute('position', new THREE.Float32BufferAttribute([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0], 3)); fg.setIndex([0, 1, 2, 2, 1, 3]);
      fg.setAttribute('iA', new THREE.InstancedBufferAttribute(A, 4)); fg.setAttribute('iB', new THREE.InstancedBufferAttribute(B, 4)); fg.instanceCount = n;
      fg.boundingSphere = new THREE.Sphere(new THREE.Vector3(side * P.hallX, P.deckY + 4, (P.hallZ0 + P.hallZ1) / 2), 110);
      const fm = new THREE.ShaderMaterial({ fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { ...fx.fogUniforms(), uTime: U.uTime, uCaveAir: U.uCaveAir },
        vertexShader: `attribute vec4 iA, iB; varying vec2 vQ; varying vec2 vS; ${fx.GLSL_FOG_PARS_VERT}
          void main() { vQ = position.xy; vS = vec2(iB.x, iB.z);
            vec3 c = iA.xyz, toEye = cameraPosition - c, r = normalize(vec3(toEye.z, 0., -toEye.x) + 1e-5);
            vec3 w = c + r * position.x * .8 * iA.w + vec3(0., position.y * 2.1 * iA.w * iB.y, 0.);
            vec4 mvPosition = viewMatrix * vec4(w, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
        fragmentShader: `uniform float uTime; varying vec2 vQ; varying vec2 vS; ${fx.GLSL_FOG_PARS_FRAG} ${AIR_GLSL} ${NOISE_GLSL}
          void main() { float t = uTime * 2.6 + vS.x * 20.;
            float n = hNoise(vec2(vQ.x * 2.4 + vS.y, vQ.y * 2.8 - t)) * .65 + hNoise(vec2(vQ.x * 5.5 - vS.y, vQ.y * 6. - t * 1.7)) * .35;
            float body = (1. - vQ.y) * (1. - abs(vQ.x) * (1.15 + 1.4 * vQ.y)) + (n - .5) * (.45 + .7 * vQ.y);
            float a = smoothstep(.12, .42, body); if (a < .01) discard;
            vec3 col = mix(vec3(1., .22, .03), vec3(1., .78, .3), smoothstep(.3, .75, body)) * (1.1 + .9 * smoothstep(.6, 1., body));
            gl_FragColor = vec4(col * a * (1. - airAmt(1.)), 1.); }` });
      const flames = new THREE.Mesh(fg, fm); flames.renderOrder = 3; hall.add(flames); }
    await ctx.yield();

    // ------------------------------------------------------------ the rare visit: on the summit the stone, split in two, and two thin beams of gold going up from it
    if (rare) { const SS = ST['summit stone']; let sx = MT.x, sz = MT.z, sy = groundP(sx, sz);
      // the highest ground within 60 m of the dome's middle
      for (let i = -6; i <= 6; i++) for (let j = -6; j <= 6; j++) { const y = groundP(MT.x + i * 10, MT.z + j * 10); if (y > sy) { sy = y; sx = MT.x + i * 10; sz = MT.z + j * 10; } }
      const rockG = T.rockGeometry({ rng: SS, kind: 'boulder', detail: 2, color: '#a39c88', colorB: '#6a675c' }), open = SS.range(0.24, 0.34), yaw = SS.range(0, TAU), R0 = SS.range(6.5, 8);
      for (const h of [-1, 1]) { const half = new THREE.Mesh(rockG, stoneMat); half.scale.set(R0 * 0.62, R0 * 1.5, R0 * (h < 0 ? 1 : 0.9));
        half.rotation.set(0, yaw + (h < 0 ? 0 : 0.4), h * open, 'YXZ'); half.position.set(side * sx + Math.cos(yaw) * h * R0 * 0.62, sy + R0 * 0.9, sz - Math.sin(yaw) * h * R0 * 0.62); outside.add(half); }
      const BH = 1400, bg = new THREE.BufferGeometry(), pos = [], uv = [], idx = [];
      for (const h of [-1, 1]) for (let k = 0; k < 2; k++) { const a = k * Math.PI / 2 + 0.4, cx = Math.cos(a) * 1.7, cz = Math.sin(a) * 1.7, lean = h * 0.022 * BH, b0 = pos.length / 3, x0 = side * sx + h * 1.1, y0 = sy + R0 * 0.9;
        pos.push(x0 - cx, y0, sz - cz, x0 + cx, y0, sz + cz, x0 - cx + lean, y0 + BH, sz - cz, x0 + cx + lean, y0 + BH, sz + cz); uv.push(-1, 0, 1, 0, -1, 1, 1, 1); idx.push(b0, b0 + 1, b0 + 2, b0 + 2, b0 + 1, b0 + 3); }
      bg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); bg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); bg.setIndex(idx); bg.computeBoundingSphere();
      const beams = new THREE.Mesh(bg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false,
        uniforms: { uTime: U.uTime, uCol: { value: new THREE.Color('#ffcf4a').multiplyScalar(night ? 1.3 : 2.1) } },
        vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform float uTime; uniform vec3 uCol; varying vec2 vUv;
          void main() { float x = clamp(abs(vUv.x), 0., 1.), core = exp(-x * x * 9.), a = core * (1. - x) * smoothstep(0., .004, vUv.y) * (1. - smoothstep(.45, 1., vUv.y)) * (.86 + .14 * sin(uTime * 2.6 + vUv.y * 90.));
            gl_FragColor = vec4(uCol * a, 1.); }` }));
      beams.renderOrder = 2; outside.add(beams); }
    await ctx.yield();
    const paceAt = (m) => 1.14 - 0.14 * sm(S.sill - 20, S.sill + 30, m) - 0.18 * sm(S.turn1, S.leap, m) + 0.06 * sm(S.bridge1, S.gate + 30, m) - 0.06 * sm(S.straight - 10, S.straight + 30, m);
    const pullRamp = 1.5 * PL / DUR * 0.5 * (paceAt(S.turn1) + paceAt(S.leap));
    return {
      scene, path, duration: DUR,
      // where the places of the route lie, in metres flown (the engine reads nothing of it; it is for whoever checks the route)
      // (for whoever counts: the way's places every 1.25 m in the world's coordinates with the pace there, the entry axis behind the
      // entry, and every body the clock moves with its own numbers; the engine reads nothing of it)
      stations: { length: PL, ...S, margin: MARGIN, marginUnder: MARGIN, margins, counts, duration: DUR, laneStep: 1.25, tube: TUBE, tall, tubeMoved, lastStraight, cragMoved,
        way: (() => { const o = []; for (let i = 0; i <= QN; i += 2) o.push(r2(side * QX[i]), r2(QY[i]), r2(QZ[i]), Math.round(paceAt(Math.min(PL, i * 0.625)) * 1e4) / 1e4); return o; })(),
        back: [r2(side * backX), r2(backZ), BACK], backDir: [side * backX, backZ], entry: [side * QX[0], QY[0], QZ[0]],
        floors: { gallery: P.galY, deck: P.deckY, hall: L.floorY, wayA: [side * P.bridgeX, P.bridgeZ0 + 1.5 + P.headRamp, P.bridgeZ1 - 1.4, P.deckY + 0.03], wayB: [side * cxH, P.hallZ0 - 2, L.floorY + 0.03, P.galY + 0.08] },
        movers: [...gorgeTroop, ...lakeTroop, ...leapers, ...houseTroop].filter((m) => m.mode > 0 || m.b[3] > 0).map((m) => ({ mode: m.mode, a: m.a.map(r2), b: m.b.map(r2), ph: m.ph, size: r2(m.size), arc: m.arc, kLeap: m.kLeap, kRun: m.kRun, gy: m.gy, lane: m.lane })),
        bands: switches.map((s) => [Math.round(s.on), Math.round(s.off), s.n, ...s.at, ...(s.far ? [Math.round(s.nearOn), Math.round(s.nearOff)] : [])]),
        // (round 3, A15) the house's bands: each member's own first metre, in the band's order
        bandEach: switches.filter((s) => s.ats).map((s) => [s.n, ...s.at, s.ats.map((v) => (v === -Infinity ? null : Math.round(v)))]) },
      camera: { fov: 62, near: 0.3, far: 2600, lookAhead: 26, sway: 0.7, bank: 0.6 },
      // THE ONE PULL OF THE GAZE (0.3): as we come in under the great fall the eye is drawn up its face a little. Its aim is the middle of
      // the fall's free sheet, half way between the gallery's roof at the drip line and the lip. It is full where the way straightens out
      // of the islet's turn and gone at the leaping rock (from there the gaze is free for the water and the mouth); it comes and goes over
      // a second and a half of flight at the pace flown there, which the engine takes as a share of the window's length.
      pois: [{ at: [0, (P.galTop + 2.6 + P.H) / 2, P.sheetZ], from: (S.turn1 - pullRamp) / PL, to: S.leap / PL, weight: 0.3, fade: pullRamp / (S.leap - S.turn1 + pullRamp) }],
      // the pace, from the stations in metres: brisk up the gorge, our mean over the lake, slower in under the fall, through it and over
      // the bridge, a little quicker down the hall, slower again on the last straight to the seat
      pace(u) { return paceAt(clamp(u, 0, 1) * PL); },
      portal: { shape: 'circle', radius: P.ringR, color: '#ffe9a8', glow: 1, revealDistance: PL - S.gate },
      post: { exposure: SKY.exp, bloom: { strength: 0.35, radius: 0.6, threshold: 0.92 }, grade: { saturation: 1.08, contrast: 1.05, tint: '#ffffff', shadowTint: '#081424', vignette: 0.26, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        const m = clamp(u, 0, 1) * PL;
        U.uTime.value = time;
        // A THING IS THERE WHENEVER IT COULD BE SEEN (makes, worked in build as metres of the way; nothing is seen to begin or end by
        // them). The sky, the fall, the cliff and the cave's shell stand for the whole visit. The land and what stands on it is drawn
        // until the eye is 6 m inside the passage behind the gallery: from there the passage's own rock stands between (its one opening
        // lies behind the eye, and the gaze is never more than 75 degrees off the heading). The troop's bands go by their reach of sight.
        const land = m < S.mouth + 6;
        outside.visible = land; terrain.object.visible = land;
        hall.visible = hero.things.visible = m >= hallOn;
        for (const s of switches) { s.object.visible = m >= s.on && m <= s.off; if (s.far) s.far(m < s.nearOn || m > s.nearOff); if (s.grow) s.grow(m); }
        // THE AIR BELONGS TO THE PLACE A THING STANDS IN (round 3, A6): the scene's fog is the day's haze from the first frame to the
        // last and nothing here writes it. What stands behind the sheet wears the cave's own tone as its own constants; what lies on
        // both sides of the sheet wears the two mixed by its own z (the part's AIR_GLSL). Nothing of the light or the air goes by
        // where the eye is or by the metres flown. The water's light keeps one strength from the first frame to the last.
        sky.update(dt, time, camera); rig.update(dt, time, camera); terrain.update(dt, time);
        hero.update(dt, time, camera);
        fauna.update(dt, time, camera, undefined, land);
        for (const f of updaters) f(dt, time, camera, m);
      },
      dispose() { sky.dispose(); tGround.dispose(); tCourse.dispose(); for (const g of spare) g.dispose(); },
    };
  },
};
