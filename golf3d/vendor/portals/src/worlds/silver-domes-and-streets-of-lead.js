// The Silver Domes and the Streets of Lead: a city of silver domes by the score, bronze figures on every roofline,
// streets paved with dull shining lead, a theatre built all of crystal and a golden cock on a tower, in one standing
// early evening of late summer with coloured lamps burning at every stall.
// (An original place from the book Invisible Cities by Italo Calvino, 1923 to 1985: the place only, as it stands.)
//
// THE FLIGHT: along a road of lead plates between vines and cypresses, lamp posts and the first stalls, to the east
// gate; through the gate and down a narrow market street over the stalls, under strings of lamps, a great ribbed dome
// closing it; up beside that dome (its flank 34 m off) and over the roofs between two clusters of small domes of four
// makes, the tower with the golden cock before us; round the tower, 66 m out, so that it stands whole; down to the
// round square of the crystal theatre (the hero, src/parts/silver-domes-and-streets-of-lead.js), which fronts the
// tower; round the theatre's glass flank, looking into it; out along the widest street, separate stone basins of
// still water down its middle (a low jet in each, paved crossings between them), between two rows of great bronze
// figures, to the west gate under the last great dome (shallow or ribbed, on a drum), where the ring stands in the arch.
//
// WHAT IS DRIVEN BY WHAT (kept true):
// - THE WORLD'S CLOCK (time), each from a phase drawn from its own stream, each right at every phase: the lamps' swing
//   and flicker; the stir of awnings, hung cloths, banners and cypresses; the people's sway, and the walkers' rounds
//   of their own long ovals; the smoke's rise from grills and chimneys (it wraps); the birds' closed rounds, in
//   flocks; the lit windows' coming and going (each window its own slow rate and phase); the cock's turning with the
//   wind and its crow (a round of 16 to 23 s); the chandelier's turning; the painted clouds' drift on the stage (from
//   a drawn phase); the trembling of the lamps' streaks in the lead; the twinkle of the theatre's glass; the kit
//   sky's stars.
// - THE FILM: only the pace (pace(u)) and the gaze's pulls (pois: windows between places of the route, in its metres).
// - THE EYE'S PLACE, as any mirror, haze or flat picture turned to its viewer does: the lead's, the water's and the
//   silver's mirror, the glass's sheen, the haze; the lamps' glows and the smoke's dabs TURN about their own places
//   to face the eye (each glow is one size in metres at its lamp's own place; a dab's size and thinness are its own
//   rise alone).
// - THE PICTURE'S GRAIN (a filter, as a mip is): arches, doors, windows, shutters, seams, plates, field rows and
//   verges are each drawn as their own mean (the pattern's share of its cell times its depth) where they would be
//   finer than the picture can hold (by the screen derivative of the pattern's own coordinate, never by metres from
//   the eye); no thing changes make, and no window lights as we near.
// - NOTHING is driven by the metres flown, by a place of the route or by the visitor's nearness. No light, lamp, haze
//   or sky comes on as we come; no figure regards the visitor (each bronze figure keeps the bearing it was dealt;
//   the people sway where they stand or walk their own rounds); nothing gives way. The hour (ctx.vary.hour), the wet
//   streets of the rare visit and the shade of the low sun (one map, swept once from the roofs' heights) are standing
//   states of the whole visit. Everything is laid once, at the build, by the place's own plan (THE PLAN, in build):
//   the places from places, the rows by their streets' axes, the birds by the city's places and the wind, the smoke
//   by every chimney's own draw; THE LINE is laid after, from the places.
// - WHAT THE LINE HAS A SAY IN, plainly (a thing that would come inside is left out after its draws; the counts are of
//   seeds 1 to 100). THE CLEARANCE: 2.5 m of air from the line to the whole reach of every small thing. And THREE
//   MARGINS LARGER THAN A CLEARANCE, kept by the lead's orders for the picture, each measured from the line itself:
//   SILVER, 12 m to any dome's silver: it left out 248 domes in a hundred seeds of mending 1 (the separate reader's
//   count) and leaves out 230 now (109 and 92 of the net's blocks under the roofs' way, small and great; 29 of the
//   square's ring; the 17 of the street's own houses are gone with the old climb);
//   GREAT, 6 m to a house or a hall: it leaves out 214 houses in a hundred seeds (213 of the square's ring, where
//   the line comes down into the square; one hall of the east quarter; none of the street's rows, which end at the
//   plan's cross street before the hall: mending 1 lost 194 there);
//   FIG, 6 m to a bronze figure's whole reach: it leaves out 14 figures in a hundred seeds (13 of the square's
//   ring, one elsewhere); the clearance itself leaves out one more of the ring's.
//   And one thing is chosen by the line without leaving anything out: a bronze figure that stands more than 45 m
//   from it is turned of fewer faces (the same make, the same outline; chosen once, at the build).
// - THE HOURS' WEIGHTS are the design's: the golden evening five visits in eight, day, dawn and night one in eight
//   each (the evening is this world's own hour).
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import { buildHero, Geo, M, COL, lin, mulc, mixc, makeUniforms, makeCityMaterial, makeGroundMaterial, makeLampMaterials, lampGeometry, LAMP, makeLifeMaterials, personGeometry, birdGeometry, quadGeometry, birdAt, walkerAt,
  makeDome, makeFigures, makeStall, makeTower, makeCock, bakeSky, THEATRE, TOWER } from '../parts/silver-domes-and-streets-of-lead.js';

const TAU = Math.PI * 2, RAD = Math.PI / 180;
const dirOf = (th) => [Math.sin(th), -Math.cos(th)], rightOf = (th) => [Math.cos(th), Math.sin(th)];

// What each hour is. The evening is this world's own hour and the default on most seeds; the lamps burn at every hour.
// az: the bearing of the sun (or moon) from the avenue's heading, to the drawn hand; el: its height for the kit's sky.
// sil: the gain of the silver's mirror; land: the gain of sun or moon and sky on the fields and trees (both standing states of the hour).
const HOURS = {
  golden: { preset: 'sunset', el: -1.5, az: 30, lightEl: 9, sunCol: '#ffc28c', sunK: 2.3, amb: 0.95, ambTint: [0.8, 0.9, 1.12], lampK: 3.2, win: 1.0, inner: 1.15, exposure: 1.02, fog: '#b79aa8', fogSun: '#ffb27a', den: 0.00105, floor: '#2c2a3a', stars: 0.3,
    sky: { zenith: '#4a4c9c', mid: '#8478b4', horizon: '#b99ab0', scatterColor: '#ffb057', scatter: 0.95, scatterPow: 2.2, scatterHigh: 0.1, horizonPow: 3.2 } },
  day: { preset: 'day', el: 30, az: 48, lightEl: 30, sunCol: '#fff1d6', sunK: 1.5, amb: 0.95, lampK: 1.3, win: 0.25, inner: 0.7, exposure: 0.98, fog: '#c4d6ec', fogSun: '#e6e2d2', den: 0.0008, floor: '#3a3d48', stars: 0,
    sky: { zenith: '#2a5fb4', mid: '#5f97dc', horizon: '#b9d4f2' } },
  dawn: { preset: 'dawn', el: 3.5, az: 152, lightEl: 9, sunCol: '#ffb49a', sunK: 1.5, amb: 1.2, lampK: 2.8, win: 0.8, inner: 1.1, exposure: 1.04, fog: '#b9a3b4', fogSun: '#f2b6a6', den: 0.00115, floor: '#2b2a38', stars: 0.15,
    sky: { zenith: '#4a4b8c', mid: '#8f82a8', horizon: '#eeb0a4' } },
  night: { preset: 'night', el: 38, az: 55, lightEl: 38, sunCol: '#8ea4e8', sunK: 0.8, amb: 3.4, sil: 2.6, land: 3, lampK: 4.2, win: 1.5, inner: 1.5, exposure: 1.12, fog: '#1d2748', fogSun: '#2b3766', den: 0.0011, floor: '#1a1c30', stars: 0.9,
    sky: {} },
};

export default {
  id: 'silver-domes-and-streets-of-lead',
  name: 'The Silver Domes and the Streets of Lead',
  category: 'books',
  placeKind: 'city',
  book: 'Invisible Cities',
  author: 'Italo Calvino, 1923 to 1985',
  media: ['air', 'open'],
  weirdness: 0.55,
  async build(ctx) {
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, detail = ctx.quality ? ctx.quality.detail : 1;
    // ------------------------------------------------------------ the streams: every one made here from the world's seed and its own name
    const R = {};
    for (const k of ['hour', 'plan', 'sky', 'wall', 'street', 'streetStalls', 'strings', 'hall', 'clusters', 'tower', 'cock', 'theatre', 'square', 'avenue', 'avenueStalls', 'gate', 'grid', 'figures', 'land', 'people', 'birds', 'smoke', 'pigeons', 'ridges', 'east', 'doorLamps', 'walkers', 'roadside', 'chimneys', 'banners', 'cat', 'relief', 'swifts', 'bats', 'wheels', 'chimneySmoke']) R[k] = ctx.core.makeRng(ctx.core.hashSeed(k + ':' + ctx.seed));
    const hourDrawn = R.hour.pick(['golden', 'golden', 'golden', 'golden', 'golden', 'day', 'dawn', 'night']);
    const hourName = HOURS[vary.hour] ? vary.hour : hourDrawn, HR = HOURS[hourName], night = hourName === 'night';
    const rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3) * (detail < 1 ? 0.6 + 0.4 * detail : 1);

    // ------------------------------------------------------------ THE PLAN: the places first, each from a place, by the plan's own bearings
    // and metres (all drawn on the plan's stream); the line is laid after, from the places (THE LINE, below).
    // h1: the plan's hand: the hand of the great ribbed dome on which the two clusters and the onion dome stand.
    // ROAD: the length of the dressed road before the east gate (its posts, walkers, cypresses and vines are measured
    //   along it from the gate); the gate at the origin; the market street from G1 on the bearing thS, Ls long.
    // The great ribbed dome (C1) closes the street: R1 + 26 m past its end and SIDE = 16 m off its axis to the hand away
    //   from the plan's hand. On the plan's hand a clear way is kept beside it, FLANK = R1 + 34 m from its axis (34 m of
    //   air to its silver).
    // THE DOME'S FORECOURT is the dome's own measure (a great dome wants a forecourt of its own size): it begins two
    //   breadths of the dome (FORE = 4 R1, 64 to 74 m) before the dome's axis along the street, that is a breadth and
    //   a half before the drum's wall. The dome's axis stands R1 + 26 m past the street's end, so the forecourt takes
    //   in the street's last 3 R1 - 26 m (22 to 29.5 m; mFore is its first metre of the street) and the open ground
    //   before the hall. It is open to the sky: no string of lamps hangs over it. Its fronts are the street's own on
    //   both hands, figures and all, as far as THE CROSS STREET: a street as broad as the market street is between its
    //   fronts (CROSS = twice 9.6 m) crosses the forecourt before the hall, its far side at the market street's end;
    //   on both hands alike no house of the rows reaches past its near side (mCross = Ls - CROSS). The line leaves
    //   the market street by it (THE LINE, below).
    // The tower (Tw) stands from the dome on the bearing th2 (the street's bearing turned dl to the plan's hand):
    //   towerOn m on (about 140) and towerOff m to the other hand (about 15), in a round precinct of rT = 66 m: so far
    //   out that the tower stands whole, from the roofs to the cock's comb at 69 m, to one who goes round it there.
    //   (towerOn and towerOff are written from the drawn L2 and dl so that the precinct's round and the dome's clear
    //   way have one common tangent on the bearing th2, L2 long: the roofs' way.)
    // The two clusters stand to each hand of a court (Qc): L2 / 2 back from the tower along th2 and rT to the plan's
    //   hand of it. The onion dome (C2): 30 m on past the tower along th2 and rT + R2 + 40 m to the plan's hand.
    // The crystal theatre (Hc) stands from the tower on the bearing th3 (th2 turned beta to the other hand): L3 m on
    //   and rT + rH m to the plan's hand, in a round square of rH (its own radius and 24 m).
    // The avenue leaves the square on the bearing thA, its axis rH m to the other hand of the theatre's middle: E0 is
    //   its first metre (abeam the theatre), it is La long, and the west gate (Gw) stands 5 m past its end.
    const pl = R.plan, h1 = pl.chance(0.5) ? 1 : -1;
    const ROAD = pl.range(118, 134), thS = h1 * pl.range(4, 10) * RAD * (pl.chance(0.5) ? 1 : -1), Ls = pl.range(185, 210), R1 = pl.range(16, 18.5);
    const dl = pl.range(6, 12) * RAD, L2 = pl.range(125, 145), beta = pl.range(96, 108) * RAD, L3 = pl.range(150, 172), thA = pl.range(-6, 6) * RAD, La = pl.range(185, 205);
    const Rc = pl.range(9, 11), R2 = pl.range(11.5, 13.5), sunSide = pl.chance(0.5) ? 1 : -1, yT = pl.range(39.5, 41.5);
    const rT = 66, rH = THEATRE.R + 24, SIDE = 16, FLANK = R1 + 34, FORE = 4 * R1, mFore = Ls + R1 + 26 - FORE, CROSS = 19.2, mCross = Ls - CROSS;
    const V2 = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k], mid2 = (a, b, f) => [lerp(a[0], b[0], f), lerp(a[1], b[1], f)];
    const dS = dirOf(thS), rS = rightOf(thS), G1 = [0, -10], S = V2(G1, dS, Ls), C1 = V2(V2(S, dS, R1 + 26), rS, -h1 * SIDE);
    const th2 = thS + h1 * dl, d2 = dirOf(th2), r2 = rightOf(th2), towerOn = L2 + FLANK * Math.sin(dl), towerOff = rT - FLANK * Math.cos(dl), Tw = V2(V2(C1, d2, towerOn), r2, -h1 * towerOff);
    const Qc = V2(V2(Tw, d2, -L2 / 2), r2, h1 * rT), C2 = V2(V2(Tw, d2, 30), r2, h1 * (rT + R2 + 40));
    const th3 = th2 - h1 * beta, d3 = dirOf(th3), r3 = rightOf(th3), Hc = V2(V2(Tw, d3, L3), r3, h1 * (rT + rH));
    const dA = dirOf(thA), rA = rightOf(thA), E0 = V2(Hc, rA, -h1 * rH), Pend = V2(E0, dA, La), Gw = V2(Pend, dA, 5);
    // THE LINE, laid from the places. Along the road from its far end, through the gate and down the street's axis to
    // the forecourt; from the forecourt's first metre across the forecourt to F, the point of the dome's clear way
    // square off the street's axis (it leaves the axis gently, by CLIMB's shares, and crosses only the corner of the
    // cross street's arm on the plan's hand), climbing all the way; the roof leg from F between the
    // two clusters (through their court) to A0, the point of the tower's precinct round abeam the tower on the bearing
    // th2; round the tower on that round through beta to A1; the descent straight from A1 to B0, the point of the
    // theatre's square on the tower's side; round the theatre on its square's round to E0; down the avenue's axis.
    const yStreet = 6.2, yRoad = 5.5, yAve = 7, yF = 33;
    // (the climb's three middle knots, each by its share of the way along the street's axis from the forecourt's first
    // metre to F (of FORE), its share of the way across to the dome's clear way, and its share of the rise)
    const CLIMB = [[0.14, 0.035, 0.03], [0.42, 0.36, 0.36], [0.72, 0.72, 0.84]];
    const F = V2(C1, rS, h1 * FLANK), A0 = V2(Tw, r2, h1 * rT), A1 = V2(Tw, r3, h1 * rT), B0 = V2(Hc, r3, -h1 * rH);
    let gam = h1 * (thA - th3); while (gam < 0) gam += TAU; while (gam > TAU) gam -= TAU;
    // the knots. The road and the street are level as far as the forecourt (the street's last level knot stands 14 m
    // before it); the climb begins at the forecourt's first metre (the last string of lamps is behind it, its lowest
    // lamp 7 m over the line), leaves the street's axis gently, is steepest past the street's end (the dome before us) and has
    // nearly come to the dome's shoulder (33 m) before its flank, so that the look is near level as the dome falls
    // abeam; the roof leg climbs gently (6 to 8 m in its whole length) to the tower's round, which is level; the
    // descent falls evenly to 12 m at the square; the theatre's round comes down to the avenue's 7 m; the avenue is
    // straight and level.
    const pts = [[0, yRoad, ROAD], [0, yRoad, ROAD - 30], [0, yRoad, ROAD - 62], [0, yRoad + 0.1, 45], [0, yRoad, 8], [G1[0], yStreet - 0.3, G1[1]]];
    for (let d = 32; d < mFore - 32; d += 34) { const p = V2(G1, dS, d); pts.push([p[0], yStreet, p[1]]); }
    { const a0 = V2(G1, dS, mFore - 14); pts.push([a0[0], yStreet, a0[1]]); }
    { const a = V2(G1, dS, mFore), K = ([f, g, k]) => { const p = V2(V2(a, dS, f * FORE), rS, h1 * g * (FLANK - SIDE)); return [p[0], lerp(yStreet, yF, k), p[1]]; };
      pts.push([a[0], yStreet, a[1]], ...CLIMB.map(K), [F[0], yF, F[1]]);
      for (const f of [0.25, 0.5, 0.75]) { const p = mid2(F, A0, f); pts.push([p[0], lerp(yF, yT, f), p[1]]); } }
    for (let a = 0; a <= beta + 1e-6; a += beta / 5) { const r = rightOf(th2 - h1 * a), p = V2(Tw, r, h1 * rT); pts.push([p[0], yT, p[1]]); }
    for (const f of [0.22, 0.45, 0.68, 0.86]) { const p = mid2(A1, B0, f); pts.push([p[0], lerp(yT, 12, smoothstep(0, 1, f) * 0.35 + f * 0.65), p[1]]); }
    { const n = Math.max(4, Math.round(gam / (15 * RAD))); for (let i = 0; i <= n; i++) { const r = rightOf(th3 + h1 * gam * i / n), p = V2(Hc, r, -h1 * rH); pts.push([p[0], lerp(12, yAve, smoothstep(0, 0.85, i / n)), p[1]]); } }
    for (const d of [25, 55, La - 90, La - 60, La - 30, La]) { const p = V2(E0, dA, d); pts.push([p[0], yAve, p[1]]); }
    await ctx.yield();
    const path = makePath(pts, { samples: 640 }), Lp = path.length;
    await ctx.yield();
    // the line itself, a point every metre, for every test of the lane (THE LANE: 2.5 m of clear air round the line
    // for small things; great solids keep 6 m); and the metres of the places the pulls and the pace are laid between
    const NL = Math.ceil(Lp), lx = new Float32Array(NL + 1), ly = new Float32Array(NL + 1), lz = new Float32Array(NL + 1), _v = new THREE.Vector3();
    const sampleLine = (i0, i1) => { for (let i = i0; i < i1; i++) { path.posAtDist(Math.min(i, Lp), _v); lx[i] = _v.x; ly[i] = _v.y; lz[i] = _v.z; } };
    for (let i = 0; i <= NL; i += 256) { sampleLine(i, Math.min(NL + 1, i + 256)); await ctx.yield(); }
    // the line's metres by cells of 16 m, so that a test looks only at the metres near it
    const lcell = (v) => Math.floor(v / 16) + 2048, lineCells = new Map();
    for (let i = 0; i <= NL; i++) { const k = lcell(lx[i]) * 4096 + lcell(lz[i]); let a = lineCells.get(k); if (!a) lineCells.set(k, a = []); a.push(i); }
    const lineNear = (x, z, reach, fn) => { const i0 = lcell(x - reach), i1 = lcell(x + reach), j0 = lcell(z - reach), j1 = lcell(z + reach); for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a = lineCells.get(i * 4096 + j); if (a) for (let k = 0; k < a.length; k++) fn(a[k]); } };
    // the least distance from a point to the line, looked for within 48 m (farther off, 48 is returned)
    const lineDist = (x, y, z) => { let b = 2304; lineNear(x, z, 48, (i) => { const dx = lx[i] - x, dy = ly[i] - y, dz = lz[i] - z, d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; }); return Math.sqrt(b); };
    const nearM = (x, z) => { let b = 1e12, bi = 0; for (let i = 0; i <= NL; i += 6) { const dx = lx[i] - x, dz = lz[i] - z, d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } } return bi; };
    const lineDistXZ = (x, z) => { let b = 1e9, bi = 0; for (let i = 0; i <= NL; i++) { const dx = lx[i] - x, dz = lz[i] - z, d = dx * dx + dz * dz; if (d < b) { b = d; bi = i; } } return [Math.sqrt(b), bi]; };
    await ctx.yield();
    const mNear = (p) => lineDistXZ(p[0], p[1])[1];
    // (mDomeView is a place of the plan: one forecourt's length (FORE) before the forecourt's first metre, mFore; there
    // the gaze is first drawn to the dome that closes the street; nothing stands or is left out by it. The slower pace
    // of the street ends at the forecourt's first metre, where the line's climb begins)
    const mGate = mNear([0, 0]), mDomeView = mNear(V2(G1, dS, mFore - FORE)), mForeM = mNear(V2(G1, dS, mFore)), mFlank = mNear(F), mLegQ = mNear(mid2(F, A0, 0.25)), mLegMid = mNear(Qc), mArc0 = mNear(A0), mArc1 = mNear(A1), mSq = mNear(B0), mAve = mNear(E0);
    const uM = (m) => clamp(m / Lp, 0, 1);
    await ctx.yield();

    // ------------------------------------------------------------ sky, light, haze; the uniforms every material of the city shares
    const sunAz = (thA / RAD) + sunSide * HR.az, sky = makeSky({ rng: R.sky, preset: HR.preset, ...HR.sky, sunElevation: HR.el, sunAzimuth: sunAz, stars: HR.stars,
      ...(night ? { bodies: [{ elevation: HR.el, azimuth: sunAz, size: 3, phase: 0.8, color: '#fff3dc', texture: 0.5, intensity: 1.2, glow: 0.3, glowColor: '#a9bcff', glowSize: 4 }], key: 0, bake: true, renderer: ctx.renderer } : {}),
      clouds: false, clouds2: night ? false : { coverage: 0.34, stretch: 1, opacity: 0.55, scale: 1.2 }, quality: 0.5 });
    scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky, { intensity: 1, ambient: night ? 1.3 : 1, bounce: 0.3 }); scene.add(rig.object);
    // (blank: the one-pixel stand-in the four map uniforms start with; the build replaces all four before any frame, and the world's dispose frees it with the maps)
    const U = makeUniforms(), blank = U.uSky.value, fogCol = new THREE.Color(HR.fog);
    scene.fog = new THREE.FogExp2(fogCol, HR.den);
    { const a = sunAz * RAD, e = HR.lightEl * RAD, sd = new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e));
      U.uSunDir.value.copy(sd); U.uSunH.value.set(Math.sin(a), -Math.cos(a)); U.uSunTan.value = Math.tan(e);
      U.uSunCol.value.set(HR.sunCol).multiplyScalar(HR.sunK); U.uAmbK.value = HR.amb; if (HR.ambTint) U.uAmbTint.value.fromArray(HR.ambTint); U.uFogCol.value.copy(fogCol); U.uFogSun.value.set(HR.fogSun); U.uFogDen.value = HR.den;
      U.uLampK.value = HR.lampK; U.uWet.value = rare ? 1 : 0; U.uFloor.value.set(HR.floor); U.uInner.value = HR.inner; U.uWin.value = HR.win; U.uSilK.value = HR.sil || 1; U.uLandK.value = HR.land || 1; }
    await ctx.yield();
    U.uSky.value = await bakeSky((d, c) => sky.colorAt(d, c), [U.uFloor.value.r, U.uFloor.value.g, U.uFloor.value.b], () => ctx.yield());
    await ctx.yield();
    const cityMat = makeCityMaterial(U);

    // ------------------------------------------------------------ the registry of what stands, and the tests every dealt thing passes
    // Solids are kept as upright round bodies {x, z, r, y0, y1} or boxes {x, z, hx, hz, yaw, y0, y1}; a dealt thing is
    // tested against the line (every metre) and against the solids dealt before it, and is dropped AFTER its draws.
    // THE AIR ROUND THE LINE: LANE, 2.5 m of clear air between the line and the whole reach of every small thing (a
    // lamp's swing and the rim of its glow, a cloth's stir, a walker's whole oval, a figure's wings).
    // THE PLACE'S OWN RULES name no point of the line. They are: the stalls' and the plinths' set-back from their
    // street's axis; a stall's lamps hung under its awning; the east arch's garland over its crown; and no string of
    // lamps over the great dome's forecourt, which is the dome's own measure (THE PLAN: two breadths of the dome back
    // from its axis: the street's last 22 to 29.5 m); and no house of the street's rows in the cross street that
    // crosses the forecourt before the hall (THE PLAN: the street's last 19.2 m, on both hands alike). No rule of a
    // place leaves a figure out: both rows of the street bear their figures as far as they stand, the forecourt's
    // fronts as the others, and every house of the square's ring bears one. (What the line leaves out is tallied under its kind's own name, a figure by where it stands and
    // by the test that left it out, ...FigureLane or ...FigureFig; what a place's rule leaves out ends in Place.)
    // THREE MARGINS ARE LEFT THAT ARE LARGER THAN A CLEARANCE, all three by the lead's own orders for the picture and
    // all three measured from the line (the counts are of seeds 1 to 100; the head of this file says them too):
    // SILVER, 12 m from the line to any dome's outline, finial and all (round 2, L2 a: no silver nearer the lens than
    // 12 m, no dome cut by the picture's edge as a wall): the domes of the blocks under the roofs' way are dealt by the
    // plan's own net, and the line leaves out those that would rise within 12 m of it (230: two or three a seed);
    // GREAT, 6 m from the line to a house or a hall: 214 houses (213 of the square's ring, where the line comes down
    // into the square; one hall of the east quarter; none of the street's rows);
    // FIG, 6 m from the line to a bronze figure's whole reach (mending 1's order: figures 6 m and more from the
    // line): 14 figures (13 of the square's ring, one elsewhere); the clearance leaves out one more of the ring's.
    const SILVER = 12, FIG = 6;
    const solids = [], LANE = 2.5, GREAT = 6, solidCells = new Map(), scell = (v) => Math.floor(v / 32) + 2048, skey = (i, j) => i * 4096 + j;
    // every solid that is registered is also kept by cells of 32 m (all the cells its outline's ring touches)
    solids.push = (...bs) => { for (const b of bs) { Array.prototype.push.call(solids, b); const r = b.hx !== undefined ? Math.hypot(b.hx, b.hz) : b.r, i0 = scell(b.x - r), i1 = scell(b.x + r), j0 = scell(b.z - r), j1 = scell(b.z + r);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const k = skey(i, j); let a = solidCells.get(k); if (!a) solidCells.set(k, a = []); a.push(b); } } return solids.length; };
    const boxDist = (b, x, z) => { const c = Math.cos(b.yaw), s = Math.sin(b.yaw), dx = x - b.x, dz = z - b.z, qx = Math.abs(dx * c - dz * s) - b.hx, qz = Math.abs(dx * s + dz * c) - b.hz; return Math.hypot(Math.max(qx, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, qz), 0); };
    const solidDist = (b, x, y, z) => { const dh = b.hx !== undefined ? boxDist(b, x, z) : Math.hypot(x - b.x, z - b.z) - b.r, dv = Math.max(b.y0 - y, y - b.y1); return dh > 0 && dv > 0 ? Math.hypot(dh, dv) : Math.max(dh, dv); };
    // the least distance from the line to a solid (only the metres of the line near it are looked at)
    const lineToSolid = (b) => { let m = 1e9; lineNear(b.x, b.z, (b.hx !== undefined ? Math.hypot(b.hx, b.hz) : b.r) + 40, (i) => { const d = solidDist(b, lx[i], ly[i], lz[i]); if (d < m) m = d; }); return m; };
    const boxBox = (a, b, pad) => { const ca = Math.cos(a.yaw), sa = Math.sin(a.yaw), cb = Math.cos(b.yaw), sb = Math.sin(b.yaw), dx = b.x - a.x, dz = b.z - a.z;
      for (const [ux, uz] of [[ca, -sa], [sa, ca], [cb, -sb], [sb, cb]]) { const ra = a.hx * Math.abs(ux * ca - uz * sa) + a.hz * Math.abs(ux * sa + uz * ca), rb = b.hx * Math.abs(ux * cb - uz * sb) + b.hz * Math.abs(ux * sb + uz * cb); if (Math.abs(dx * ux + dz * uz) > ra + rb + pad) return false; }
      return true; };
    const overlaps = (b, pad = 0.3) => { const rb = b.hx !== undefined ? Math.hypot(b.hx, b.hz) : b.r, i0 = scell(b.x - rb), i1 = scell(b.x + rb), j0 = scell(b.z - rb), j1 = scell(b.z + rb);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const a = solidCells.get(skey(i, j)); if (!a) continue;
        for (const o of a) { if (o.y0 >= b.y1 || b.y0 >= o.y1) continue;
          if (o.hx === undefined && b.hx === undefined) { if (Math.hypot(o.x - b.x, o.z - b.z) < o.r + b.r + pad) return true; }
          else if (o.hx !== undefined && b.hx !== undefined) { if (boxBox(o, b, pad)) return true; }
          else { const bx = b.hx !== undefined ? b : o, ot = bx === b ? o : b; if (boxDist(bx, ot.x, ot.z) < ot.r + pad) return true; } } }
      return false; };
    // the roof under a point: the highest solid's top there (0 where none stands): what a thing 'on a roof' must stand on
    const roofAt = (x, z) => { let h = 0; const a = solidCells.get(skey(scell(x), scell(z))); if (a) for (const o of a) { if (o.roof === false) continue; const d = o.hx !== undefined ? boxDist(o, x, z) : Math.hypot(x - o.x, z - o.z) - o.r; if (d < 0 && o.y1 > h) h = o.y1; } return h; };
    const minLane = { small: 1e9, great: 1e9, lamp: 1e9, dome: 1e9, close: 1e9, smoke: 1e9 }, dropped = {};
    const drop = (k) => { dropped[k] = (dropped[k] || 0) + 1; return false; };
    const okSmall = (kind, x, y, z, r, margin = LANE) => { const d = lineDist(x, y, z) - r; if (d < margin) return drop(kind); if (margin > LANE) { if (d < minLane.close) minLane.close = d; } else if (d < minLane.small) minLane.small = d; return true; };
    const okGreat = (kind, b, margin = GREAT) => { const d = lineToSolid(b); if (d < margin) return drop(kind); if (d < minLane.great) minLane.great = d; return true; };
    // the chunks of the city's still geometry, by the metre of the line each thing stands nearest (five stretches)
    const CH = 5, geos = []; for (let i = 0; i < CH; i++) geos.push(new Geo());
    const chunkOf = (x, z) => geos[clamp(Math.floor(nearM(x, z) / Lp * CH), 0, CH - 1)];
    // the wind's bearing (the cock faces into it; every pennant flies down it): the cock's stream's first draw
    const windB = R.cock.range(0, TAU), windTo = [-Math.sin(windB), -Math.cos(windB)], bannerSites = [];
    const figs = makeFigures(), figsFar = makeFigures(true), lamps = [], people = [], walkers = [], smokes = [], figList = [], domeList = [], zones = [];
    // a walker: a small figure that goes round a long narrow oval of its own on the world's clock (x, z: the oval's
    // middle; a, b: its half length and half breadth; yaw: its bearing; sp: the pace in metres a second at its fastest).
    // The whole oval, every phase at once, is tried against the line (LANE) and against what stands; left out after its draws.
    const addWalker = (r, x, z, yaw, a, b, sp) => { const wk = { x, z, a, b, yaw, w: (r.chance(0.5) ? 1 : -1) * sp / a, ph: r() }, q = [0, 0]; let least = 1e9;
      for (let k = 0; k < 48; k++) { walkerAt(wk, (TAU * k / 48) / wk.w, q); const d = Math.min(lineDist(q[0], 1.75, q[1]), lineDist(q[0], 0.9, q[1])) - 0.35; if (d < LANE) return drop('walker'); if (d < least) least = d;
        if (overlaps({ x: q[0], z: q[1], r: 0.45, y0: 0.2, y1: 1.75 }, 0)) return drop('walkerHit'); }
      if (least < minLane.close) minLane.close = least; walkers.push(wk); return true; };
    const lampCol = (r, pal) => { const c = COL.lamps[pal[Math.floor(r() * pal.length)]], k = r.range(0.85, 1.1); return [c[0] * k, c[1] * k, c[2] * k]; };
    // a lamp: its hang point, its cord; left out where, at any angle of its swing, the rim of its glow would come within LANE of the line
    // (skipLamp: a lamp the place's own rule leaves out; its draws are made all the same)
    const addLamp = (x, y, z, cord, col, r) => { const reach = (cord + LAMP.h) * Math.sin(LAMP.swing) + LAMP.r + LAMP.h / 2, ph = r(), d = lineDist(x, y - cord - LAMP.h / 2, z) - reach - LAMP.glow / 2;
      if (d < LANE) return drop('lamp'); if (d < minLane.lamp) minLane.lamp = d; lamps.push(x, y, z, cord, col[0], col[1], col[2], ph); return true; };
    const skipLamp = (x, y, z, cord, col, r) => { r(); return false; };
    // a bronze figure standing on y at (x, z), s metres to the unit, on a bearing of its own
    // (tag: the place's name for the counts: where the line leaves a figure out it is tallied as <tag>FigureLane when
    // its reach would stand within the clearance, as <tag>FigureFig when within the 6 m ordered for figures)
    const addFigure = (r, x, y, z, s, onRoof = true, tag = 'roof') => { const mk0 = r.int(0, figs.length - 1), yaw = r.range(0, TAU), b = { x, z, r: 0.42 * s, y0: y, y1: y + 1.36 * s, roof: false };
      const fd = lineToSolid({ ...b, r: 0.8 * s }); if (fd < FIG) return drop(tag + (fd < LANE ? 'FigureLane' : 'FigureFig')); if (fd < minLane.close) minLane.close = fd; if (onRoof && Math.abs(roofAt(x, z) - y) > 0.05) return drop('figureAir');
      // no two neighbours of one make: a figure takes the first make after the one it was dealt that none of its three
      // nearest standing fellows has (within 60 m on the plan), nor any fellow whose own nearest it now becomes
      let m1 = -1, m2 = -1, m3 = -1, d1 = 3600, d2 = 3600, d3 = 3600, bar = 0; for (const f of figList) { const d = (f[0] - x) * (f[0] - x) + (f[2] - z) * (f[2] - z); if (d < f[5]) bar |= 1 << f[4];
        if (d < d1) { d3 = d2; m3 = m2; d2 = d1; m2 = m1; d1 = d; m1 = f[4]; } else if (d < d2) { d3 = d2; m3 = m2; d2 = d; m2 = f[4]; } else if (d < d3) { d3 = d; m3 = f[4]; } }
      for (const m of [m1, m2, m3]) if (m >= 0) bar |= 1 << m; if (bar === (1 << figs.length) - 1) bar = m1 >= 0 ? 1 << m1 : 0;
      let mk = mk0; while (bar >> mk & 1) mk = (mk + 1) % figs.length;
      for (const f of figList) { const d = (f[0] - x) * (f[0] - x) + (f[2] - z) * (f[2] - z); if (d < f[5]) f[5] = d; }
      // (a figure more than 45 m from the line is turned of fewer faces: the same make, the same outline)
      chunkOf(x, z).add((lineDist(x, y, z) < 45 ? figs : figsFar)[mk], x, y, z, yaw, s); solids.push(b); figList.push([x, y, z, s, mk, d1, tag, +fd.toFixed(2)]); return true; };
    // a dome's outline as a solid of revolution: the distance from a point to it (0 inside), and its height over a radius
    const profDist = (d, x, y, z) => {
      if (d.kids) { let m = solidDist({ x: d.x, z: d.z, hx: d.box[0], hz: d.box[0], yaw: d.box[1], y0: d.y0, y1: d.prof[1][1] }, x, y, z); for (const k of d.kids) m = Math.min(m, profDist(k, x, y, z)); return m; }
      const rho = Math.hypot(x - d.x, z - d.z), P = d.prof; let m = 1e9, inside = false;
      for (let j = 0; j < P.length - 1; j++) { const ar = P[j][0], ay = P[j][1], br = P[j + 1][0], by = P[j + 1][1], ex = br - ar, ey = by - ay, l2 = ex * ex + ey * ey || 1e-9, t = clamp(((rho - ar) * ex + (y - ay) * ey) / l2, 0, 1);
        m = Math.min(m, Math.hypot(rho - ar - ex * t, y - ay - ey * t)); if (y >= Math.min(ay, by) && y <= Math.max(ay, by) && by !== ay) { if (rho < ar + ex * (y - ay) / ey) inside = true; } }
      return inside ? 0 : m; };
    const lineToDome = (d) => { let m = 1e9; lineNear(d.x, d.z, d.R * 1.5 + 40, (i) => { const q = profDist(d, lx[i], ly[i], lz[i]); if (q < m) m = q; }); return m; };
    const profH = (d, rho) => { const P = d.prof; let h = 0; for (let j = 0; j < P.length - 1; j++) { const ar = P[j][0], br = P[j + 1][0]; if ((rho <= ar && rho >= br) || (rho <= br && rho >= ar)) { const t = Math.abs(br - ar) < 1e-6 ? 1 : (rho - ar) / (br - ar); h = Math.max(h, lerp(P[j][1], P[j + 1][1], t)); } else if (rho < Math.min(ar, br)) h = Math.max(h, Math.max(P[j][1], P[j + 1][1])); } return h; };
    const nearTower = (x, z) => Math.hypot(x - Tw[0], z - Tw[1]) < 150;
    const tintStone = (r) => mulc(mixc(mixc(COL.stone, COL.stone2, r()), COL.stone3, r() * 0.6), r.range(0.84, 1));
    const tintSilver = (r) => { const w = r.range(-0.05, 0.05); return [1 + w, 1, 1 - w * 1.4].map((v) => v * r.range(0.94, 1.04)); };
    // a dome dealt on y0 at (x, z): made in its chunk, tested with its true outline against the line and against what
    // stands, and taken out again where it does not fit. kind names it in the counts. Returns the dome or null.
    const addDome = (r, kind, x, z, y0, Rd, make, o = {}) => {
      const tg = chunkOf(x, z), mk0 = tg.mark(), d = makeDome(tg, { x, z, y0, R: Rd, make, rng: r, tint: tintSilver(r), stone: tintStone(r), yaw: o.yaw || 0, fine: o.fine });
      const b = { x, z, r: Rd * (make === 'five' ? 1.39 : 1.08), y0: y0 + 0.01, y1: d.shellTop, roof: false, dome: true };
      const md = lineToDome(d); if (md < SILVER || (!o.free && overlaps(b))) { tg.back(mk0); return drop(md < SILVER ? kind : kind + 'Hit') || null; }
      if (md < minLane.dome) minLane.dome = md;
      solids.push(b); domeList.push(d); return d; };
    // a house: a block of pale stone with an arcade and rows of arched windows drawn on its fronts, a cornice, a flat roof
    const HH = (k) => 5.2 + 4 * k + 1.6;
    const addHouse = (r, kind, x, z, hx, hz, yaw, H, o = {}) => {
      const st = tintStone(r), b = { x, z, hx, hz, yaw, y0: 0, y1: H + 0.4, kind };
      if (o.out) return null;   // (left out by a rule of its own place, after its draws; its row tallies it)
      if (!okGreat(kind, b, o.margin ?? GREAT)) return null; if (!o.free && overlaps(b, o.pad ?? 0.2)) return drop(kind + 'Hit') || null;
      const g = chunkOf(x, z); g.box(x, 0, z, hx, H - 0.2, hz, yaw, st, M.stone, { par: o.plain ? 0 : 1 + H / 128, top: false });
      g.box(x, H - 0.2, z, hx + 0.4, 0.6, hz + 0.4, yaw, mulc(st, 1.06), M.stone, { topCol: mulc(COL.lead, 1.25), topMid: M.lead, bottom: true });
      solids.push(b); return b; };
    // a point of a house's roof in its own frame
    const onHouse = (b, ax, az) => { const c = Math.cos(b.yaw), s = Math.sin(b.yaw), px = ax * b.hx, pz = az * b.hz; return [b.x + px * c + pz * s, b.z - px * s + pz * c]; };
    // a gate: a block with an arched way through it (ow: the opening's half width, spring: where the arch springs)
    const addGate = (kind, x, z, yaw, hw, hd, H, ow, spring, st) => {
      const g = chunkOf(x, z), c = Math.cos(yaw), s = Math.sin(yaw), W = (px, y, pz) => [x + px * c + pz * s, y, z - px * s + pz * c], pw = (hw - ow) / 2;
      for (const sg of [-1, 1]) { const q = W(sg * (ow + pw), 0, 0); g.box(q[0], 0, q[2], pw, H, hd, yaw, st, M.stone, { par: 0 }); solids.push({ x: q[0], z: q[2], hx: pw, hz: hd, yaw, y0: 0, y1: H + 0.8 }); }
      const n = 14, arc = (i) => { const a = Math.PI * i / n; return [-Math.cos(a) * ow, spring + Math.sin(a) * ow]; };
      for (let i = 0; i < n; i++) { const a = arc(i), b = arc(i + 1);
        g.face([W(a[0], a[1], hd), W(b[0], b[1], hd), W(b[0], H, hd), W(a[0], H, hd)], st, M.stone); g.face([W(b[0], b[1], -hd), W(a[0], a[1], -hd), W(a[0], H, -hd), W(b[0], H, -hd)], st, M.stone);
        g.face([W(a[0], a[1], -hd), W(b[0], b[1], -hd), W(b[0], b[1], hd), W(a[0], a[1], hd)], mulc(st, 0.8), M.stone); }
      g.face([W(-ow, H, hd), W(ow, H, hd), W(ow, H, -hd), W(-ow, H, -hd)], mulc(COL.lead, 1.25), M.lead);
      const q = W(0, 0, 0); solids.push({ x: q[0], z: q[2], hx: ow, hz: hd, yaw, y0: spring + ow, y1: H + 0.8 });
      g.box(x, H, z, hw + 0.5, 0.8, hd + 0.5, yaw, mulc(st, 1.06), M.stone, { topCol: mulc(COL.lead, 1.25), topMid: M.lead, bottom: true });
      // its front (the side the way comes to): a raised band round the arch and down its jambs, four pilasters, a blind
      // arcade under the cornice; all within 0.4 m of the wall's own face and outside the opening
      const lt = mulc(st, 1.1), k = (ow + 0.8) / ow, zf = hd + 0.3, yb = spring + ow + 1.2;
      for (let i = 0; i < n; i++) { const a = arc(i), b = arc(i + 1), a2 = [a[0] * k, spring + (a[1] - spring) * k], b2 = [b[0] * k, spring + (b[1] - spring) * k];
        g.face([W(a[0], a[1], zf), W(b[0], b[1], zf), W(b2[0], b2[1], zf), W(a2[0], a2[1], zf)], lt, M.stone);
        g.face([W(a2[0], a2[1], zf), W(b2[0], b2[1], zf), W(b2[0], b2[1], hd), W(a2[0], a2[1], hd)], lt, M.stone); }
      for (const sg of [-1, 1]) { const j = W(sg * (ow + 0.4), 0, hd + 0.15); g.box(j[0], 0, j[2], 0.4, spring, 0.15, yaw, lt, M.stone);
        for (const px of [ow + 2.4, hw - 1.2]) { const q = W(sg * px, 0, hd + 0.2); g.box(q[0], 0, q[2], 0.6, H, 0.2, yaw, lt, M.stone); } }
      { const q = W(0, 0, hd + 0.12); g.box(q[0], yb, q[2], hw - 0.3, H - 1 - yb, 0.12, yaw, lt, M.stone, { par: 2 }); }
      return { W, top: H + 0.8 }; };
    await ctx.yield();

    // ------------------------------------------------------------ the city's bounds, its wall and the two gates
    // (the city reaches 215 m beyond the outermost of the plan's own points)
    const keyX = [0, S[0], C1[0], F[0], A0[0], Tw[0], A1[0], B0[0], Hc[0], E0[0], Pend[0]], xMin = Math.min(...keyX) - 215, xMax = Math.max(...keyX) + 215;
    const zWest = (x) => Gw[1] + rA[1] * (x - Gw[0]) / rA[0];
    const inCity = (x, z, inset) => x > xMin + inset && x < xMax - inset && z < -inset && (x - Gw[0]) * dA[0] + (z - Gw[1]) * dA[1] < -inset;
    const yawW = -thA, wallSt = mulc(COL.stone2, 0.92);
    {
      const wr = R.wall, gwR = V2(Gw, rA, 22), gwL = V2(Gw, rA, -22);
      const segs = [[[16, 0], [xMax, 0]], [[xMax, 0], [xMax, zWest(xMax)]], [[xMax, zWest(xMax)], gwR], [gwL, [xMin, zWest(xMin)]], [[xMin, zWest(xMin)], [xMin, 0]], [[xMin, 0], [-16, 0]]];
      for (const [a, b] of segs) {
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uz = (b[1] - a[1]) / len, yaw = Math.atan2(-uz, ux), g = chunkOf((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
        g.box((a[0] + b[0]) / 2, 0, (a[1] + b[1]) / 2, len / 2, 10, 1.4, yaw, wallSt, M.stone); solids.push({ x: (a[0] + b[0]) / 2, z: (a[1] + b[1]) / 2, hx: len / 2, hz: 1.4, yaw, y0: 0, y1: 10 });
        const n = Math.max(1, Math.round(len / 66));
        for (let i = 1; i <= n; i++) { const x = a[0] + ux * len * i / n, z = a[1] + uz * len * i / n; if (Math.hypot(x - Gw[0], z - Gw[1]) < 30 || Math.hypot(x, z) < 30) continue;
          chunkOf(x, z).lathe(x, 0, z, [[4.4, 0], [4.2, 14], [4.7, 14.4], [4.7, 15]], 14, wallSt, M.stone); solids.push({ x, z, r: 4.7, y0: 0, y1: 15 }); addDome(wr, 'wallDome', x, z, 15, wr.range(3.6, 4.4), wr.pick(['onion', 'ribbed', 'stepped', 'shallow', 'ribbed']), { free: true }); if (i % 2) bannerSites.push([x + windTo[0] * 5, 12.8, z + windTo[1] * 5, 8.4, 3.4, 1.1]); if (i % 2 === 0) await ctx.yield(); }
        await ctx.yield();
      }
      await ctx.yield();
      // the east gate: an arch 11 m wide and 13 m to its crown, two round towers with domes, a string of lamps round the arch
      // (the two gate towers' domes are of two makes)
      const gr = R.gate, pal = [0, 1, 2, 3, 4], gateMakes = gr.shuffle(['ribbed', 'stepped', 'onion']);
      const ge = addGate('gateE', 0, 0, 0, 16, 4, 18, 5.5, 7.5, tintStone(gr)); await ctx.yield();
      for (const sg of [-1, 1]) { const x = sg * 20.5; geos[0].lathe(x, 0, 0, [[5.4, 0], [5.1, 21], [5.8, 21.6], [5.8, 22.5]], 18, wallSt, M.stone, { par: 2 }); solids.push({ x, z: 0, r: 5.8, y0: 0, y1: 22.5 }); addDome(gr, 'gateDome', x, 0, 22.5, 5.3, gateMakes[sg > 0 ? 0 : 1], { free: true }); await ctx.yield(); }
      // (the garland hangs over the arch's crown, eleven lamps on a round of 6.7 m from 34 degrees over the springing on
      // each hand; none hangs lower or down the jambs: those the stream deals there are left out after their draws)
      for (let i = 0; i <= 16; i++) { const a = Math.PI * i / 16, q = ge.W(-Math.cos(a) * 6.7, 7.5 + Math.sin(a) * 6.7 + 0.2, 4.35); (i > 2 && i < 14 ? addLamp : skipLamp)(q[0], q[1], q[2], 0.25 + 0.2 * gr(), lampCol(gr, pal), gr); }
      for (let i = 0; i < 4; i++) for (const sg of [-1, 1]) { const q = ge.W(sg * 6.5, 7.2 - i * 1.25, 4.35); skipLamp(q[0], q[1], q[2], 0.2, lampCol(gr, pal), gr); }
      addFigure(gr, -10.8, ge.top, 0, 3.6); addFigure(gr, 10.8, ge.top, 0, 3.6); bannerSites.push([-14.2, ge.top, 0, 7, 4.2, 1.3], [14.2, ge.top, 0, 7, 4.2, 1.3]);
      await ctx.yield();
      // the west gate, under the last great dome: the ring stands 2 m inside its front, ringed with coloured lamps
      const gw = addGate('gateW', Gw[0], Gw[1], yawW, 22, 7, 23, 8, 9.5, tintStone(gr));
      // (the last great dome is the shallow or the ribbed make on its drum, by the same draw that chose between two makes before)
      addDome(gr, 'lastDome', Gw[0], Gw[1], gw.top, 15, gr.pick(['shallow', 'ribbed']), { free: true });
      await ctx.yield();
      for (let i = 0; i <= 26; i++) { const a = Math.PI * i / 26, q = gw.W(-Math.cos(a) * 9.1, 9.5 + Math.sin(a) * 9.1, 7.4); addLamp(q[0], q[1], q[2], 0.2 + 0.25 * gr(), COL.lamps[i % 5], gr); }
      for (let i = 0; i < 7; i++) for (const sg of [-1, 1]) { const q = gw.W(sg * 9.1, 9.2 - i * 1.25, 7.4); addLamp(q[0], q[1], q[2], 0.2, COL.lamps[(i + 2) % 5], gr); }
      for (const sg of [-1, 1]) { const q = gw.W(sg * 15.5, 0, 7.6 + 2.2); geos[CH - 1].box(q[0], 0, q[2], 1.7, 3.2, 1.7, yawW, wallSt, M.stone); solids.push({ x: q[0], z: q[2], hx: 1.7, hz: 1.7, yaw: yawW, y0: 0, y1: 3.2 }); addFigure(gr, q[0], 3.2, q[2], 5.2); }
      for (const sg of [-1, 1]) { const q = gw.W(sg * 17, 0, 0); addFigure(gr, q[0], gw.top, q[2], 3.8); }
    }
    await ctx.yield();

    // ------------------------------------------------------------ rows of houses with stalls before them (the street's and the avenue's one rule)
    // o: P (the axis' start), d (its direction), th, from, to (metres along it), front (house fronts' distance from the
    // axis), stall (the stalls' middles' distance), k (house heights to pick from), fig (figure size), dome (chance)
    const CLOTH = ['#b3262a', '#d9902a', '#1f7a78', '#27408f', '#e9dcc0', '#8c3a7a', '#c95a28'].map(lin);
    // the dyes of the cloths hung from the galleries: madder, saffron, indigo, undyed linen
    const DYES = ['#a8302b', '#d89a2c', '#2a3f88', '#e6dcc4'].map(lin);
    const rowOfHouses = async (rr, kind, o) => {
      const d = o.d, rt = rightOf(o.th), yaw = Math.PI / 2 - o.th, made = [];
      for (const sg of [-1, 1]) {
        for (let m = o.from; m < o.to - 8;) {
          const w = rr.pick([10.8, 10.8, 14.4]), hz = rr.range(5, 6.2), H = HH(rr.pick(o.k)), c = V2(V2(o.P, d, m + w / 2), rt, sg * (o.front + hz));
          // (o.last: the last metre of the way a house of the row may reach, by the place's own rule; one dealt past it is left out after its draws)
          const out = o.last !== undefined && m + w > o.last, b = addHouse(rr, kind, c[0], c[1], w / 2, hz, yaw, H, { pad: -0.15, out }); m += w + (rr.chance(0.2) ? 3.6 : 0); if (out) drop(kind + 'Place' + (sg > 0 ? 'R' : 'L'));
          const fs = rr.range(o.fig[0], o.fig[1]), fa = rr.pick([-0.72, 0, 0.72]), wantDome = rr.chance(o.dome), Rd = hz * rr.range(0.62, 0.84), mk = rr.pick(['onion', 'ribbed', 'shallow', 'stepped', 'onion']);
          if (!b) continue; made.push(b); b.side = sg;
          const fp = onHouse(b, fa, -sg * 0.78); addFigure(R.figures, fp[0], H + 0.4, fp[1], fs, true, o.tag + (sg > 0 ? 'R' : 'L'));
          if (wantDome) addDome(rr, kind + 'Dome', b.x + rt[0] * sg * 0.8, b.z + rt[1] * sg * 0.8, H + 0.4, Rd, mk, { free: true });
          if (made.length % 3 === 0) await ctx.yield();
        }
        await ctx.yield();
      }
      return made; };
    const stallAt = (rr, kind, c, yaw, skip, grillP = 0.4) => {
      const w = rr.range(2.8, 4.2), tg = new Geo(), pal = rr.shuffle([0, 1, 2, 3, 4]).slice(0, rr.int(2, 4));
      const st = makeStall(tg, { x: c[0], z: c[1], yaw, w, rng: rr, cloth: mulc(rr.pick(CLOTH), rr.range(0.8, 1.05)), lamps: rr.chance(0.55) ? 'string' : 'cluster', grill: rr.chance(grillP) });
      const cols = st.lamps.map(() => lampCol(rr, pal)), pn = rr.int(1, 2), pp = []; for (let i = 0; i < pn; i++) pp.push([rr.range(-w / 2, w / 2), rr.range(2.5, 3.2), rr.range(0, TAU), rr()]);
      if (skip && skip(c[0], c[1])) return drop(kind + 'Zone');
      const body = { x: c[0], z: c[1], hx: w / 2 + 0.3, hz: 1.25, yaw, y0: 0, y1: st.top, roof: false, kind };
      if (!okSmall(kind, c[0], st.top / 2, c[1], Math.max(st.r, st.top / 2))) return false; if (overlaps(body, 0)) return drop(kind + 'Hit');
      chunkOf(c[0], c[1]).add(tg, 0, 0, 0); solids.push(body);
      st.lamps.forEach((l, i) => addLamp(l[0], l[1], l[2], l[3], cols[i], rr));
      if (st.grill) smokes.push(st.grill);
      const cy = Math.cos(yaw), sy = Math.sin(yaw); for (const q of pp) people.push([c[0] + q[0] * cy + q[1] * sy, 0, c[1] - q[0] * sy + q[1] * cy, q[2], q[3]]);
      return true; };
    const rowOfStalls = async (rr, kind, o) => {
      const d = o.d, rt = rightOf(o.th); let n = 0, tried = 0;
      for (const sg of [-1, 1]) for (let m = o.from + rr.range(0, 5); m < o.to; m += rr.range(o.step[0], o.step[1]) / Math.sqrt(density)) {
        const c = V2(V2(o.P, d, m), rt, sg * o.stall); if (stallAt(rr, kind, c, Math.atan2(-sg * rt[0], -sg * rt[1]), o.skip)) n++; if (++tried % 4 === 0) await ctx.yield(); }
      await ctx.yield(); return n; };
    // a string of lamps across a way, between two points at height y, with a sag; its cord is a thin tube
    const stringSpans = [], lampString = (rr, a, b, y, sag, n, pal, out) => {
      const cols = []; for (let i = 0; i < n; i++) cols.push(lampCol(rr, pal)); if (out) return drop('stringPlace');
      const P = (t) => [lerp(a[0], b[0], t), y - sag * 4 * t * (1 - t), lerp(a[1], b[1], t)];
      for (let i = 0; i <= 10; i++) { const q = P(i / 10); if (lineDist(q[0], q[1] - 0.5, q[2]) < LANE + LAMP.glow / 2 + 0.5) return drop('string'); }
      const g = chunkOf((a[0] + b[0]) / 2, (a[1] + b[1]) / 2); for (let i = 0; i < 10; i++) g.limb(P(i / 10), P((i + 1) / 10), 0.035, 0.035, COL.dark, M.dark, 0, 3);
      const i0 = lamps.length / 8; for (let i = 0; i < n; i++) { const q = P((i + 0.5) / n); addLamp(q[0], q[1], q[2], 0.18 + 0.12 * (i % 2), cols[i], rr); }
      stringSpans.push([i0, lamps.length / 8]); return true; };

    // ------------------------------------------------------------ the market street, from the east gate to the ribbed dome
    // (both rows end at or before the cross street's near side before the hall (THE PLAN: mCross; up to 25 m short of
    // it, as the houses fall) and bear a figure on every house, the
    // forecourt's fronts as the others; the rows are dealt to the street's end as before, and a house that would reach
    // into the cross street is left out after its draws, on both hands alike; the market's stalls run on to 16 m
    // before the street's end as before, so the last of them may stand at the cross street's corners)
    const stO = { P: G1, d: dS, th: thS, from: 4, to: Ls - 2, last: mCross, front: 9.6, stall: 8.3, k: [2, 2, 3, 3, 4], fig: [4.2, 5.4], dome: 0.4, tag: 'street' };
    await rowOfHouses(R.street, 'streetHouse', stO);
    const nStreetStalls = await rowOfStalls(R.streetStalls, 'streetStall', { ...stO, from: 10, to: Ls - 16, step: [6.5, 9.5] });
    // (last: the last metre of the way a string may hang over, by the place's own rule; one dealt beyond it is left out after its draws)
    const stringsOver = (rr, P, d, th, from, to, half, yLo, yHi, sag, n, step, last = 1e9) => { const rt = rightOf(th); let k = 0;
      for (let m = from + rr.range(0, 8); m < to; m += rr.range(step[0], step[1])) { const q = V2(P, d, m), a = V2(q, rt, -half), b = V2(q, rt, half), y = rr.range(yLo, yHi), sg = rr.range(sag[0], sag[1]), pal = rr.shuffle([0, 1, 2, 3, 4]).slice(0, rr.int(3, 5));
        // both its ends are made fast to house fronts: where a front is missing or too low the string is looked for 3 and 6 m up and down the way
        let done = false;
        for (const dm of [0, 3, -3, 6, -6]) { const a2 = V2(a, d, dm), b2 = V2(b, d, dm), ra = roofAt(a2[0] - rt[0] * 0.8, a2[1] - rt[1] * 0.8), rb = roofAt(b2[0] + rt[0] * 0.8, b2[1] + rt[1] * 0.8);
          if (ra >= y - 0.7 && rb >= y - 0.7) { if (lampString(rr, a2, b2, y, sg, n, pal, m + dm > last)) k++; done = true; break; } }
        // (tallies: stringPlace, one with fronts to hang from but over the place's open ground; stringAirPlace, one dealt
        // over that ground that finds no front there either; stringAir, one elsewhere that finds no front high enough)
        if (!done) drop(m > last ? 'stringAirPlace' : 'stringAir'); }
      return k; };
    // the strings hang over the street 15 m over the paving, from the gate to the dome's forecourt (THE PLAN: mFore),
    // which is open to the sky: a string the stream deals over the forecourt is left out after its draws
    const nStreetStrings = stringsOver(R.strings, G1, dS, thS, 14, Ls - 8, 9.55, 15.1, 15.4, [0.6, 0.9], 14, [16, 23], mFore);
    await ctx.yield();
    // (walkers in the street: each oval's long axis lies along the street)
    { const wr = R.walkers, yawSt = Math.PI / 2 - thS; let nw = 0;
      for (let m = 12 + wr.range(0, 4); m < Ls - 12; m += wr.range(5.5, 8.5) / density) { const sg = wr.chance(0.5) ? 1 : -1, c = V2(V2(G1, dS, m), rS, sg * wr.range(3.0, 4.2)); addWalker(wr, c[0], c[1], yawSt + wr.range(-0.05, 0.05), wr.range(6, 14), wr.range(0.4, 0.8), wr.range(0.9, 1.4)); if (++nw % 6 === 0) await ctx.yield(); } }
    zones.push({ a: G1, b: S, r: 25.2 }, { a: [0, 0], b: [0, 0], r: 34 }, { a: S, b: S, r: 24 });
    await ctx.yield();

    // ------------------------------------------------------------ the east front: great domes on tall halls behind the east wall, one about every 64 m
    // across the city's breadth (none on the street), so that the skyline stands dome behind dome over the wall
    // (no two neighbours along the front are of one make: a dome dealt its neighbour's make takes the next make of the list)
    { const er = R.east, NEXT = { onion: 'ribbed', ribbed: 'stepped', stepped: 'shallow', shallow: 'onion', five: 'stepped' }; let lastMk = '';
      for (let x = xMin + 40 + er.range(0, 20); x < xMax - 30; x += er.range(56, 72)) {
        const z = -er.range(48, 100), Rd = er.range(12, 16.5), k = er.pick([3, 4, 4]), mk0 = er.pick(['onion', 'ribbed', 'stepped', 'onion', 'five', 'shallow']), yaw = er.range(-0.1, 0.1), fs = er.range(3.6, 4.6), mk1 = mk0 === 'five' && nearTower(x, z) ? 'stepped' : mk0, mk = mk1 === lastMk ? NEXT[mk1] : mk1;
        if (Math.abs(x - z * Math.tan(thS)) < 46) { drop('eastZone'); continue; }
        const b = addHouse(er, 'eastHall', x, z, Rd + 2, Rd + 2, yaw, HH(k)); if (!b) continue;
        if (addDome(er, 'eastDome', x, z, b.y1, mk === 'five' ? Rd * 0.95 : Rd, mk, { free: true, yaw })) lastMk = mk; zones.push({ a: [x, z], b: [x, z], r: Rd + 4 });
        for (const e of [-0.9, 0.9]) { const q = onHouse(b, e, 0.9); addFigure(er, q[0], b.y1, q[1], fs); }
        { const q = onHouse(b, -0.93, -0.93); bannerSites.push([q[0], b.y1, q[1], 8, 4.6, 1.4]); }
        await ctx.yield(); }
      await ctx.yield(); }

    // ------------------------------------------------------------ the great ribbed dome on its hall at the street's end; the clusters; the onion dome
    const yawS = Math.PI / 2 - thS, yaw2 = Math.PI / 2 - th2;
    const hall1 = addHouse(R.hall, 'hall', C1[0], C1[1], R1 + 3, R1 + 3, yawS, HH(2), { free: true });
    const dome1 = addDome(R.hall, 'greatDome', C1[0], C1[1], HH(2) + 0.4, R1, 'ribbed', { free: true, fine: true });
    if (hall1) for (const [ax, az] of [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]]) { const q = onHouse(hall1, ax, az); addFigure(R.hall, q[0], HH(2) + 0.4, q[1], 4.4); }
    zones.push({ a: C1, b: C1, r: R1 + 12 });
    for (const hb of [hall1]) if (hb) { const q = onHouse(hb, 0, -0.96); bannerSites.push([q[0], hb.y1, q[1], 9, 5, 1.5]); }
    await ctx.yield();
    const clusters = [];
    // the two clusters, one on each hand of their court (Qc): on each hall four small domes of four makes and four sizes,
    // set loosely (never one in the middle of four), on podiums of three heights; each hall's near side 14.5 m from the court's middle
    { const cr = R.clusters, hc = 1.15 * Rc, SPOTS = [[-0.45, -0.35, 0.42, 3], [0.4, -0.45, 0.34, 1.5], [0.05, 0.4, 0.3, 0], [0.62, 0.5, 0.24, 1.5]];
      for (const sg of [-1, 1]) { const c = V2(Qc, r2, sg * (hc + 14.5)), hb = addHouse(cr, 'clusterHall', c[0], c[1], hc, hc, yaw2, HH(3), { free: true }), makes = cr.shuffle(['stepped', 'shallow', 'ribbed', 'onion']), flip = cr.chance(0.5) ? 1 : -1, cy = Math.cos(yaw2), sy = Math.sin(yaw2);
        SPOTS.forEach(([ax, az, rk, pod], i) => { const px = ax * hc * flip, pz = az * hc * sg, x = c[0] + px * cy + pz * sy, z = c[1] - px * sy + pz * cy, Rd = rk * Rc * cr.range(0.94, 1.06), y0 = HH(3) + 0.4;
          if (!hb) return; if (pod) { chunkOf(x, z).lathe(x, y0, z, [[Rd * 1.16, 0], [Rd * 1.16, pod - 0.2], [Rd * 1.22, pod]], 16, tintStone(cr), M.stone, { par: 2 }); solids.push({ x, z, r: Rd * 1.2, y0, y1: y0 + pod, roof: false }); }
          const d = addDome(cr, 'cluster', x, z, y0 + pod, Rd, makes[i], { free: true, fine: true }); if (d) clusters.push(d); });
        if (hb) for (const [ax, az] of [[-0.92, 0.92], [0.92, -0.92]]) { const q = onHouse(hb, ax * flip, az * sg); addFigure(cr, q[0], HH(3) + 0.4, q[1], 3.6); }
        zones.push({ a: c, b: c, r: hc + 9 }); await ctx.yield(); } }
    // the great onion dome (C2: 30 m on past the tower along the roofs' bearing, rT + R2 + 40 m to the plan's hand of it)
    const hall2 = addHouse(R.clusters, 'hall2', C2[0], C2[1], R2 + 2.5, R2 + 2.5, yaw2, HH(3), { free: true });
    const dome2 = addDome(R.clusters, 'onionDome', C2[0], C2[1], HH(3) + 0.4, R2, 'onion', { free: true, fine: true });
    if (hall2) for (const [ax, az] of [[-0.9, -0.9], [0.9, -0.9], [0.9, 0.9], [-0.9, 0.9]]) { const q = onHouse(hall2, ax, az); addFigure(R.clusters, q[0], HH(3) + 0.4, q[1], 4.0); }
    zones.push({ a: C2, b: C2, r: R2 + 11 });
    await ctx.yield();

    // ------------------------------------------------------------ the tower with the golden cock
    const tr = R.tower, towerYaw = tr.range(0, TAU), tower = makeTower(chunkOf(Tw[0], Tw[1]), { x: Tw[0], z: Tw[1], yaw: towerYaw, rng: tr, stone: tintStone(tr) });
    tower.R = 10; domeList.push(tower);
    solids.push({ x: Tw[0], z: Tw[1], r: TOWER.slab * 1.2, y0: 0, y1: tower.ySlab }, { x: Tw[0], z: Tw[1], r: 5, y0: tower.ySlab, y1: tower.top, roof: false, dome: true });
    // four figures on the tower's slab, one toward each of its own corners (the tower's frame, turned by its drawn yaw)
    { const c = Math.cos(towerYaw), s = Math.sin(towerYaw), e = 6.6 * Math.SQRT1_2; for (const [ax, az] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) addFigure(tr, Tw[0] + ax * e * c + az * e * s, tower.ySlab, Tw[1] - ax * e * s + az * e * c, 3.0); }
    zones.push({ a: Tw, b: Tw, r: 17 });
    const cr = R.cock, cock = makeCock(cityMat, { wind: windB, period: cr.range(16, 23), phase: cr(), hunt: cr.range(0.25, 0.45), huntW: cr.range(0.17, 0.29), huntPh: cr.range(0, TAU) });
    // (a great gilt weathercock, 11 m from its perch to its comb, on a tower of 69 m: 1.6 times the part's make)
    const COCK = 1.6;
    cock.group.position.set(tower.perch[0], tower.perch[1], tower.perch[2]); cock.group.scale.setScalar(COCK); cock.group.name = 'cock'; scene.add(cock.group);
    // (the cock's least distance from the line, looked for over the whole line: the line's test reaches 48 m only)
    let cockLane = 1e9; { const cy = tower.perch[1] + 3.5 * COCK; for (let i = 0; i <= NL; i++) cockLane = Math.min(cockLane, Math.hypot(lx[i] - tower.perch[0], ly[i] - cy, lz[i] - tower.perch[2])); cockLane -= 5.5 * COCK; }
    const towerLane = lineToDome(tower);
    await ctx.yield();

    // ------------------------------------------------------------ the crystal theatre in its round square
    const hero = await buildHero(ctx, { U, mat: cityMat, figures: figs, rng: R.theatre });
    // the theatre fronts the tower with the golden cock: its front's axis is the bearing from its middle to the tower's
    { hero.object.position.set(Hc[0], 0, Hc[1]); hero.object.rotation.y = Math.atan2(Tw[0] - Hc[0], Tw[1] - Hc[1]); hero.object.updateMatrixWorld(true); }
    scene.add(hero.object);
    const TR = THEATRE.R;
    solids.push({ x: Hc[0], z: Hc[1], r: TR + THEATRE.steps, y0: 0, y1: 1.5, roof: false }, { x: Hc[0], z: Hc[1], r: TR + 1.6, y0: 0, y1: 25.6, roof: false }, { x: Hc[0], z: Hc[1], r: TR * 0.87, y0: 25.6, y1: 30, roof: false }, { x: Hc[0], z: Hc[1], r: TR * 0.64, y0: 30, y1: 33, roof: false }, { x: Hc[0], z: Hc[1], r: TR * 0.36, y0: 33, y1: 39, roof: false });
    let theatreLane = 1e9; for (let k = solids.length - 5; k < solids.length; k++) theatreLane = Math.min(theatreLane, lineToSolid(solids[k]));
    zones.push({ a: Hc, b: Hc, r: 87 }, { a: E0, b: Gw, r: 31.5 }, { a: Gw, b: Gw, r: 42 });
    const sq = R.square, aveDist = (x, z) => { const t = clamp(((x - E0[0]) * dA[0] + (z - E0[1]) * dA[1]), 0, La); return Math.hypot(x - E0[0] - dA[0] * t, z - E0[1] - dA[1] * t); };
    // houses round the square (fronts 71 m from the theatre's axis), a figure on every one; stalls in a ring 60 m out, facing the hall
    for (let a = sq.range(0, 0.2), k = 0; a < TAU - 0.12; a += 15.6 / 77, k++) {
      const u = [Math.cos(a), Math.sin(a)], hz = sq.range(5.2, 6.4), c = V2(Hc, u, 71 + hz), H = HH(sq.pick([2, 3, 3])), fs = sq.range(3.4, 4.4), fa = sq.pick([-0.7, 0, 0.7]), wantDome = sq.chance(0.45), Rd = hz * sq.range(0.66, 0.84), mk = sq.pick(['shallow', 'ribbed', 'stepped']);
      if (aveDist(c[0], c[1]) < 15 + 7.4) { drop('squareHouseZone'); continue; }
      const b = addHouse(sq, 'squareHouse', c[0], c[1], 6.5, hz, Math.atan2(u[0], u[1]), H, { pad: -0.15 }); if (!b) continue;
      const q = onHouse(b, fa, -0.78); addFigure(R.figures, q[0], H + 0.4, q[1], fs, true, 'ring'); if (wantDome) addDome(sq, 'squareDome', c[0] + u[0] * 0.8, c[1] + u[1] * 0.8, H + 0.4, Rd, mk, { free: true });
      if (k % 2 === 1) await ctx.yield();
    }
    let nSquareStalls = 0, nSqTry = 0;
    for (let a = sq.range(0, 0.2); a < TAU - 0.1; a += sq.range(7.6, 10) / 60 / Math.sqrt(density)) { const u = [Math.cos(a), Math.sin(a)], c = V2(Hc, u, 60); if (stallAt(sq, 'squareStall', c, Math.atan2(-u[0], -u[1]), (x, z) => aveDist(x, z) < 12)) nSquareStalls++; if (++nSqTry % 4 === 0) await ctx.yield(); }
    await ctx.yield();

    // ------------------------------------------------------------ the avenue: two rows of bronze figures on plinths, two rows of stalls, to the west gate
    const avO = { P: E0, d: dA, th: thA, from: 52, to: La - 12, front: 15, stall: 13.2, k: [3, 3, 4, 4], fig: [3.6, 4.6], dome: 0.5, tag: 'avenue' };
    await rowOfHouses(R.avenue, 'avenueHouse', avO);
    let nAveFigures = 0; const aveM = [];
    { const ar = R.avenue, yawA = Math.PI / 2 - thA;
      for (let m = 54 + ar.range(0, 6); m < La - 22; m += ar.range(19, 23)) { aveM.push(m); for (const sg of [-1, 1]) {
        const c = V2(V2(E0, dA, m), rA, sg * 10.5), s = ar.range(4.6, 5.4), b = { x: c[0], z: c[1], hx: 1.35, hz: 1.35, yaw: yawA, y0: 0, y1: 2.4 };
        if (lineToSolid(b) < LANE) { drop('plinth'); continue; }
        geos[CH - 1].box(c[0], 0, c[1], 1.35, 2.4, 1.35, yawA, mulc(COL.stone2, 0.95), M.stone); solids.push(b); if (addFigure(ar, c[0], 2.4, c[1], s, true, 'plinth')) nAveFigures++; } } }
    // THE BASINS: still water down the avenue's middle in four separate stone basins (1.9 m to each hand), each lying
    // between two pairs of the bronze figures, so that every pair flanks a paved crossing 10 m wide; a low jet of
    // water in each (a slim column 1.5 m high and five falling threads; it shimmers on the clock, 0.07 m at the most)
    const BASIN = 1.9, basins = []; for (let k = 0; k + 1 < aveM.length && basins.length < 4; k++) { const b0 = aveM[k] + 5, b1 = aveM[k + 1] - 5; if (b1 <= La - 34 && b1 - b0 > 6) basins.push([b0, b1]); }
    { const yawA = Math.PI / 2 - thA, kc = mulc(COL.stone2, 0.9), g = geos[CH - 1], water = [0.8, 0.88, 0.97];
      for (const [b0, b1] of basins) { const mid = V2(E0, dA, (b0 + b1) / 2), len = (b1 - b0) / 2 + 0.35;
        for (const sg of [-1, 1]) { const c = V2(mid, rA, sg * (BASIN + 0.2)); g.box(c[0], 0, c[1], len, 0.34, 0.24, yawA, kc, M.stone); }
        for (const m of [b0 - 0.2, b1 + 0.2]) { const c = V2(E0, dA, m); g.box(c[0], 0, c[1], 0.24, 0.34, BASIN + 0.44, yawA, kc, M.stone); }
        g.limb([mid[0], 0.02, mid[1]], [mid[0], 1.5, mid[1]], 0.07, 0.025, water, M.cloth, 0.3, 4);
        for (let i = 0; i < 5; i++) { const a = TAU * i / 5 + 0.4, c = Math.cos(a), sn = Math.sin(a), p1 = [mid[0] + c * 0.32, 1.32, mid[1] + sn * 0.32], p2 = [mid[0] + c * 0.62, 0.05, mid[1] + sn * 0.62]; g.limb([mid[0], 1.5, mid[1]], p1, 0.022, 0.02, water, M.cloth, 0.3, 3); g.limb(p1, p2, 0.02, 0.03, water, M.cloth, 0.3, 3); } } }
    const nAveStalls = await rowOfStalls(R.avenueStalls, 'avenueStall', { ...avO, from: 50, to: La - 16, step: [7.5, 10.5] });
    { const wr = R.walkers, yawAv = Math.PI / 2 - thA;
      for (let m = 56 + wr.range(0, 5); m < La - 20; m += wr.range(6.5, 10) / density) { const sg = wr.chance(0.5) ? 1 : -1, c = V2(V2(E0, dA, m), rA, sg * wr.range(4.2, 6.2)); addWalker(wr, c[0], c[1], yawAv + wr.range(-0.05, 0.05), wr.range(8, 16), wr.range(0.5, 0.9), wr.range(0.9, 1.4)); }
      await ctx.yield();
      // round the square: ovals that lie along the round, between the theatre's steps and the stalls
      for (let a = wr.range(0, 0.3); a < TAU; a += wr.range(0.22, 0.36) / density) { const rr = wr.range(37, 54), c = V2(Hc, [Math.cos(a), Math.sin(a)], rr); addWalker(wr, c[0], c[1], -a + Math.PI / 2 + wr.range(-0.2, 0.2), wr.range(5, 9), wr.range(0.5, 1.0), wr.range(0.8, 1.3)); } }
    await ctx.yield();
    const nAveStrings = stringsOver(R.strings, E0, dA, thA, 58, La - 14, 14.95, 16.4, 16.9, [1.0, 1.4], 21, [22, 30]);
    await ctx.yield();

    // ------------------------------------------------------------ the rest of the city: a net of streets between blocks, most of them domed
    const zoneDist = (x, z) => { let m = 1e9; for (const q of zones) { const ex = q.b[0] - q.a[0], ez = q.b[1] - q.a[1], l2 = ex * ex + ez * ez, t = l2 > 0 ? clamp(((x - q.a[0]) * ex + (z - q.a[1]) * ez) / l2, 0, 1) : 0; m = Math.min(m, Math.hypot(x - q.a[0] - ex * t, z - q.a[1] - ez * t) - q.r); } return m; };
    const counts = { blocks: 0, great: 0, domed: 0, flat: 0, courts: 0 };
    // a chimney on a roof's corner; every chimney of the city smokes (its smoke is laid with the grills', on a stream of its own)
    const chimSmokes = [], chimney = (b, ax, az, h) => { const q = onHouse(b, ax, az); chunkOf(q[0], q[1]).box(q[0], b.y1, q[1], 0.45, h, 0.45, b.yaw, mulc(COL.stone3, 0.8), M.stone, { topCol: COL.dark, topMid: M.dark });
      chimSmokes.push([q[0], b.y1 + h + 0.1, q[1]]); };
    // lamps at the doors of the city's blocks: on each of two opposite fronts (seven times in ten) a cluster of three or
    // four on a short bracket 3.5 m up, so that the net of streets is beaded with them when seen from over the roofs
    const doorLamps = (b) => { const dr = R.doorLamps, c = Math.cos(b.yaw), s = Math.sin(b.yaw), g = chunkOf(b.x, b.z);
      for (const sg of [-1, 1]) { const on = dr.chance(0.7), ax = dr.range(-0.6, 0.6), n = dr.int(3, 4), pal = dr.shuffle([0, 1, 2, 3, 4]).slice(0, 2), offs = []; for (let i = 0; i < 4; i++) offs.push([dr.range(-0.4, 0.4), dr.range(-0.3, 0.3), dr.range(0.15, 0.5), lampCol(dr, pal)]);
        if (!on) continue;
        const px = ax * b.hx, W = (lz) => [b.x + px * c + lz * s, b.z - px * s + lz * c], q0 = W(sg * b.hz), q1 = W(sg * (b.hz + 0.95));
        g.limb([q0[0], 3.62, q0[1]], [q1[0], 3.56, q1[1]], 0.05, 0.035, COL.dark, M.dark, 0, 3);
        for (let i = 0; i < n; i++) { const o = offs[i], q = W(sg * (b.hz + 0.8 + o[1] * 0.5)); addLamp(q[0] + o[0] * c, 3.52, q[1] - o[0] * s, o[2], o[3], dr); } } };
    { const gr = R.grid, CELL = 38, zLo = Math.min(zWest(xMin), zWest(xMax)) - 10; let n = 0;
      for (let gx = xMin + 24; gx < xMax - 20; gx += CELL) for (let gz = -26; gz > zLo; gz -= CELL) {
        const x = gx + gr.range(-3, 3), z = gz + gr.range(-3, 3), t = gr(), hx = gr.range(11, 14.5), hz = gr.range(11, 14.5), yaw = gr.range(-0.07, 0.07), k = gr.pick([1, 1, 2, 2, 3]), mk0 = gr.pick(['onion', 'shallow', 'ribbed', 'shallow', 'stepped', 'five', 'ribbed', 'onion', 'stepped']), rs = gr.range(0.42, 0.62), nf = gr.int(0, 2), fsz = gr.range(2.8, 3.8), mk = mk0 === 'five' && nearTower(x, z) ? 'shallow' : mk0;
        const chim = R.chimneys.chance(0.55), chH = R.chimneys.range(1.6, 2.3);
        n++; await ctx.yield();
        if (!inCity(x, z, 20) || zoneDist(x, z) < 19) continue;
        counts.blocks++;
        if (t < 0.16) {
          // a great hall under a great dome
          const b = addHouse(gr, 'gridHall', x, z, 14.5, 14.5, yaw, HH(k)); if (!b) continue;
          if (addDome(gr, 'gridGreat', x, z, b.y1, gr.range(10.5, 13.5), mk === 'five' ? 'ribbed' : mk, { free: true })) counts.great++;
          for (let i = 0; i < 2; i++) { const q = onHouse(b, i % 2 ? 0.9 : -0.9, i % 2 ? 0.9 : -0.9); addFigure(R.figures, q[0], b.y1, q[1], fsz * 1.2); }
          doorLamps(b); if (chim) chimney(b, -0.84, 0.84, chH); { const q = onHouse(b, 0.93, -0.93); bannerSites.push([q[0], b.y1, q[1], 7, 4, 1.2]); }
        } else if (t < 0.88) {
          const b = addHouse(gr, 'gridHouse', x, z, hx, hz, yaw, HH(k)); if (!b) continue;
          if (t < 0.68) { const Rd = Math.min(hx, hz) * (mk === 'five' ? 0.62 : rs); if (addDome(gr, 'gridDome', x, z, b.y1, Rd, mk, { free: true, yaw })) counts.domed++; } else counts.flat++;
          for (let i = 0; i < nf; i++) { const q = onHouse(b, [-0.86, 0.86, 0.86][i], [-0.86, 0.86, -0.86][i]); addFigure(R.figures, q[0], b.y1, q[1], fsz); }
          doorLamps(b); if (chim) chimney(b, -0.84, 0.84, chH);
        } else {
          // a low court with a figure on a tall plinth
          const b = addHouse(gr, 'gridCourt', x, z, hx, hz, yaw, 6.6, { plain: false }); if (!b) continue; counts.courts++;
          chunkOf(x, z).box(x, b.y1, z, 1.6, 3, 1.6, yaw, COL.stone2, M.stone); solids.push({ x, z, hx: 1.6, hz: 1.6, yaw, y0: b.y1, y1: b.y1 + 3 }); addFigure(R.figures, x, b.y1 + 3, z, fsz * 1.5);
        }
      } }
    await ctx.yield();

    // ------------------------------------------------------------ banners on the towers and halls; galleries, hung cloths and awnings on the rows' fronts
    let nBanners = 0, nRelief = 0; const ROD = mixc(COL.bronze, COL.worn, 0.45);
    // cl: a four-cornered cloth (P: its head's first corner, the foot under it, the foot's far corner, the head's far
    // corner). weave 0: even stripes the cloth's whole length (un of them and as many grounds); weave 1: one plain dye
    // with a darker hem at its foot; weave 2: the stripes with the same hem (the part's cloth shader reads the weave
    // from uv.y). A HUNG cloth (nf folds; inw: the way to the wall behind it, or, for a pennant on its pole, square
    // off the wind) is made in folds: its hollows lie 0.03 m back at the rod and 0.07 m back at the foot, its ridges
    // in the cloth's own plane (never forward of it), each fold's two flanks turned their own way to the light.
    { const bn = R.banners, cl = (g, P, col, pars, un, weave = 0, nf = 0, inw = null) => { const v0 = 2 * weave, v1 = v0 + (weave ? 0.999 : 1);
        const put = (Q, pr, u0, u1) => { const k = g.nv, ax = Q[1][0] - Q[0][0], ay = Q[1][1] - Q[0][1], az = Q[1][2] - Q[0][2], bx = Q[3][0] - Q[0][0], by = Q[3][1] - Q[0][1], bz = Q[3][2] - Q[0][2];
          let nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
          const uv = [[u0, v0], [u0, v1], [u1, v1], [u1, v0]]; for (let j = 0; j < 4; j++) g.v(Q[j][0], Q[j][1], Q[j][2], nx, ny, nz, col, M.cloth, pr[j], uv[j][0], uv[j][1]); g.quad(k, k + 1, k + 2, k + 3); };
        if (!nf) return put(P, pars, 0, un);
        const m = 2 * nf, at = (f, top, d) => { const a = top ? P[0] : P[1], b = top ? P[3] : P[2]; return [lerp(a[0], b[0], f) + inw[0] * d, lerp(a[1], b[1], f) + inw[1] * d, lerp(a[2], b[2], f) + inw[2] * d]; };
        for (let i = 0; i < m; i++) { const f0 = i / m, f1 = (i + 1) / m, d0 = i % 2, d1 = 1 - d0;
          put([at(f0, 1, d0 * 0.03), at(f0, 0, d0 * 0.07), at(f1, 0, d1 * 0.07), at(f1, 1, d1 * 0.03)], [lerp(pars[0], pars[3], f0), lerp(pars[1], pars[2], f0), lerp(pars[1], pars[2], f1), lerp(pars[0], pars[3], f1)], un * f0, un * f1); } };
      // a pennant: a pole and a long cloth made fast along the pole, its free end down the wind (it stirs most there)
      for (const [x, y, z, hp, L, wd] of bannerSites) { const col = mulc(bn.pick(CLOTH), bn.range(0.85, 1.1)); if (!okSmall('banner', x + windTo[0] * L / 2, y + hp - 0.6, z + windTo[1] * L / 2, L / 2 + 0.6)) continue;
        const g = chunkOf(x, z), ex = x + windTo[0] * L, ez = z + windTo[1] * L, top = y + hp; g.limb([x, y, z], [x, top, z], 0.09, 0.045, COL.dark, M.dark, 0, 3);
        cl(g, [[x, top - 0.05, z], [x, top - wd, z], [ex, top - wd * 0.8 - 0.35, ez], [ex, top - 0.4, ez]], col, [0, 0, 1, 1], Math.round(L / 0.9), 1, Math.round(L / 0.9), [-windTo[1], 0, windTo[0]]); nBanners++; }
      // two long banners hang down two faces of the tower's shaft under its belfry (the tower's own frame), each in three
      // folds from a bronze rod that stands 0.32 m clear of the face (its foot stirs 0.17 m at the most, its folds'
      // hollows lie 0.07 m back)
      { const c = Math.cos(towerYaw), s = Math.sin(towerYaw), g = chunkOf(Tw[0], Tw[1]), W = (px, pz) => [Tw[0] + px * c + pz * s, Tw[1] - px * s + pz * c];
        for (const sg of [-1, 1]) { const col = mulc(bn.pick(CLOTH), bn.range(0.85, 1.1)), zf = sg * (TOWER.half + 0.32), a = W(-1.5 * sg, zf), b = W(1.5 * sg, zf), y1 = TOWER.shaft - 1.2, y0 = y1 - bn.range(9, 12);
          const a2 = W(-1.75 * sg, zf), b2 = W(1.75 * sg, zf); g.limb([a2[0], y1 + 0.06, a2[1]], [b2[0], y1 + 0.06, b2[1]], 0.06, 0.06, ROD, M.bronze, 0.5, 5); for (const e of [-1.5, 1.5]) { const q0 = W(e * sg, sg * TOWER.half), q1 = W(e * sg, zf); g.limb([q0[0], y1 - 0.15, q0[1]], [q1[0], y1 + 0.06, q1[1]], 0.035, 0.035, ROD, M.bronze, 0.3, 3); }
          cl(g, [[a[0], y1, a[1]], [a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]]], col, [0, 0.55, 0.55, 0], 3, 1, 3, [-sg * s, 0, -sg * c]); nBanners++; } }
      await ctx.yield();
      // THE ROWS' FRONTS (the street, the avenue, the square): on most houses a gallery along the front at the foot of a
      // storey: a slab borne on stone consoles (one to every 2.4 m), a low balustrade (the part's stone draws its
      // balusters), and a bronze rod, 0.09 m thick with a knob at each end, that stands 0.3 m clear of the balustrade's
      // face on three brackets. One to three cloths hang from the rod, each on its own length of it and each made in
      // folds (two to four; cl above), never two overlapping: at rest 0.5 m and more of bare rod lies between two; the
      // stir moves a cloth's foot 0.17 m at the most, so two neighbours both stirred toward each other still keep
      // about 0.28 m between them. Never in the wall: the folds' hollows lie 0.07 m back and the stir 0.17 m more, of
      // the 0.3 m. A hung cloth is one plain dye with a darker hem, or many narrow even stripes its whole length (nine
      // and more), in the city's dyes. On the street and the avenue an awning over the arcade on half of the houses, in
      // nine and more even stripes, stretched from the wall on two bronze arms with a rod along its front edge.
      // Every piece is drawn first, then tried against the line (LANE, by a body that holds the consoles, the rod and the cloths' whole stir).
      const rl = R.relief, rows = solids.filter((b) => b.kind === 'streetHouse' || b.kind === 'avenueHouse' || b.kind === 'squareHouse'); let nr = 0;
      for (const b of rows) { const fz = b.side !== undefined ? -b.side : -1, c = Math.cos(b.yaw), s = Math.sin(b.yaw), W = (px, pz) => [b.x + px * c + pz * s, b.z - px * s + pz * c], g = chunkOf(b.x, b.z), st = mulc(COL.stone2, rl.range(0.86, 1.02));
        const storeys = Math.round((b.y1 - 0.4 - 6.8) / 4), wantG = rl.chance(0.7), j = rl.int(1, Math.max(1, Math.min(2, storeys))), nc = rl.int(1, 3), cloths = [], wantA = rl.chance(0.5), aw = rl.range(3.2, 4.4), ap = rl.range(-1, 1), ac = mulc(rl.pick(CLOTH), rl.range(0.8, 1.05));
        for (let i = 0; i < 3; i++) { const cp = rl.range(-1, 1), cw = rl.range(1.1, 1.6), cd = rl.range(1.2, 1.9), ci = CLOTH.indexOf(rl.pick(CLOTH)), ck = rl.range(0.8, 1.05); cloths.push([cp, cw, cd, mulc(DYES[ci % 4], ck), ci % 4, ck]); }
        // (a rule of the dyers, every house alike: madder and indigo are not hung to dry on one rod; where both are dealt to the cloths a rod bears, the indigo gives way to saffron)
        if (cloths.slice(0, nc).some((q) => q[4] === 0) && cloths.slice(0, nc).some((q) => q[4] === 2)) for (const q of cloths) if (q[4] === 2) q[3] = mulc(DYES[1], q[5]);
        if (wantG) { const yg = 5.2 + 4 * (j - 1) + 0.3, gw = b.hx - 0.8, m = W(0, fz * (b.hz + 0.55)), sb = { x: m[0], z: m[1], hx: gw, hz: 0.55, yaw: b.yaw, y0: yg - 0.25, y1: yg + 0.85, roof: false };
          const mr = W(0, fz * (b.hz + 0.8)); if (lineToSolid({ x: mr[0], z: mr[1], hx: gw, hz: 0.8, yaw: b.yaw, y0: yg - 1.2, y1: yg + 0.9 }) < LANE) drop('gallery'); else { solids.push(sb); nRelief++;
            g.box(m[0], yg - 0.25, m[1], gw, 0.25, 0.55, b.yaw, st, M.stone, { bottom: true }); const e = W(0, fz * (b.hz + 1.04)); g.box(e[0], yg, e[1], gw, 0.8, 0.06, b.yaw, mulc(st, 1.06), M.stone, { par: 3 });
            { const ncs = Math.max(2, Math.round(2 * gw / 2.4)) + 1; for (let i = 0; i < ncs; i++) { const q = W(lerp(-gw + 0.3, gw - 0.3, i / (ncs - 1)), fz * (b.hz + 0.42)); g.box(q[0], yg - 0.53, q[1], 0.12, 0.28, 0.4, b.yaw, mulc(st, 0.94), M.stone, { top: false, bottom: true }); } }
            const zo = fz * (b.hz + 1.4), yr = yg + 0.84, r0 = W(-gw + 0.1, zo), r1 = W(gw - 0.1, zo), sl = 2 * gw / nc; g.limb([r0[0], yr, r0[1]], [r1[0], yr, r1[1]], 0.045, 0.045, ROD, M.bronze, 0.5, 5);
            for (const q of [r0, r1]) g.lathe(q[0], yr - 0.055, q[1], [[0, 0], [0.055, 0.055], [0, 0.11]], 4, ROD, M.bronze, { par: 0.7 });
            for (const bx of [-0.92, 0, 0.92]) { const q0 = W(bx * gw, fz * (b.hz + 1.1)), q1 = W(bx * gw, zo); g.limb([q0[0], yr - 0.12, q0[1]], [q1[0], yr, q1[1]], 0.03, 0.03, ROD, M.bronze, 0.3, 3); }
            for (let i = 0; i < nc; i++) { const [cp, cw0, cd0, col] = cloths[i], cw = Math.min(cw0, sl - 0.7), cd = Math.min(cd0, yg + 0.82 - 4.62), px = -gw + sl * (i + 0.5) + cp * (sl - cw - 0.5) / 2, yt = yr + 0.03, striped = Math.floor(cw0 * 997) % 3 === 0, nf = Math.max(2, Math.round(cw / 0.38)); if (cw < 0.5) continue;
              const A = W(px - cw / 2, zo), B = W(px + cw / 2, zo), P = fz < 0 ? [[A[0], yt, A[1]], [A[0], yt - cd, A[1]], [B[0], yt - cd, B[1]], [B[0], yt, B[1]]] : [[B[0], yt, B[1]], [B[0], yt - cd, B[1]], [A[0], yt - cd, A[1]], [A[0], yt, A[1]]];
              cl(g, P, col, [0, 0.5, 0.5, 0], striped ? Math.max(9, Math.round(cw / 0.13)) : nf, striped ? 2 : 1, nf, [-fz * s, 0, -fz * c]); } } }
        if (wantA && b.kind !== 'squareHouse') { const px = ap * (b.hx - aw / 2 - 0.6), m = W(px, fz * (b.hz + 0.9)), sb = { x: m[0], z: m[1], hx: aw / 2, hz: 0.75, yaw: b.yaw, y0: 4.1, y1: 5.0, roof: false };
          if (lineToSolid(sb) < LANE + 0.2 || overlaps(sb, 0)) drop('awning'); else { nRelief++; const A = W(px - aw / 2, fz * (b.hz + 0.03)), B = W(px + aw / 2, fz * (b.hz + 0.03)), C = W(px + aw / 2, fz * (b.hz + 1.55)), D = W(px - aw / 2, fz * (b.hz + 1.55));
            cl(g, fz < 0 ? [[A[0], 4.95, A[1]], [D[0], 4.2, D[1]], [C[0], 4.2, C[1]], [B[0], 4.95, B[1]]] : [[B[0], 4.95, B[1]], [C[0], 4.2, C[1]], [D[0], 4.2, D[1]], [A[0], 4.95, A[1]]], ac, [0, 0.5, 0.5, 0], Math.max(9, Math.round(aw / 0.36)));
            // (its two arms, from the wall 0.5 m under its head to its front corners, and the rod along its front edge: 0.12 m under the cloth at rest, so that the stirred cloth never passes through them)
            const a0 = W(px - aw / 2, fz * b.hz), b0 = W(px + aw / 2, fz * b.hz); g.limb([a0[0], 4.45, a0[1]], [D[0], 4.08, D[1]], 0.03, 0.025, ROD, M.bronze, 0.3, 3); g.limb([b0[0], 4.45, b0[1]], [C[0], 4.08, C[1]], 0.03, 0.025, ROD, M.bronze, 0.3, 3); g.limb([D[0], 4.08, D[1]], [C[0], 4.08, C[1]], 0.025, 0.025, ROD, M.bronze, 0.5, 3); } }
        if (++nr % 12 === 0) await ctx.yield(); } }
    await ctx.yield();

    // ------------------------------------------------------------ the land outside: the road's cypresses, vines, the stalls by the east gate
    const land = new Geo();
    { const lr = R.land, green = lin('#3c5a30');
      // a cypress: a dark trunk and a tall flame of leaf that swells and narrows three times, paler toward its tip; those
      // by the road are turned of more faces
      const cypress = (x, z, H, r, fine) => { const col = mulc(green, lr.range(0.7, 1.15)); if (lineToSolid({ x, z, r: r + 0.1, y0: 0, y1: H }) < LANE || overlaps({ x, z, r, y0: 0, y1: H, roof: false })) return drop('cypress');
        land.limb([x, 0, z], [x, 2.2, z], 0.28, 0.22, [0.09, 0.07, 0.06], M.dark, 0, 5);
        land.lathe(x, 0, z, fine ? [[0.2, 1.2, 0.7], [r * 0.82, 2.0, 0.78], [r, H * 0.2, 0.9], [r * 0.84, H * 0.33, 0.82], [r * 0.96, H * 0.46, 1], [r * 0.72, H * 0.6, 0.9], [r * 0.78, H * 0.7, 1.08], [r * 0.48, H * 0.84, 1.02], [r * 0.2, H * 0.95, 1.18], [0, H, 1.25]]
          : [[0.25, 1.2, 0.75], [r, 2.4, 0.85], [r * 0.92, H * 0.45, 1], [r * 0.6, H * 0.78, 1.05], [0.1, H, 1.2]], fine ? 9 : 6, col, M.leaf, { par: 0.35, yaw: lr.range(0, 1) });
        solids.push({ x, z, r, y0: 0, y1: H, roof: false, cone: true }); return true; };
      // along the road, both hands, 13.5 to 16 m aside (2.5 widths of their own and more), from 100 m beyond the dressed
      // road's far end in to 26 m before the gate (all the road's things are measured along its own axis from the gate)
      for (const sg of [-1, 1]) for (let z = ROAD + 100 - lr.range(0, 8); z > 26; z -= lr.range(13, 21)) cypress(sg * lr.range(13.5, 16), z, lr.range(14, 18.5), lr.range(1.6, 2.2), true);
      // groves and single trees over the land
      for (let i = 0; i < 170; i++) { const x = lr.range(xMin - 380, xMax + 380), z = lr.range(Gw[1] - 380, ROAD + 300), H = lr.range(10, 17), r = lr.range(1.3, 2); if (Math.abs(x) < 18 || inCity(x, z, -14)) { drop('cypressZone'); continue; } cypress(x, z, H, r); }
      await ctx.yield();
      // the vines: fields of low green rows on both hands of the road, beyond the cypresses
      for (const sg of [-1, 1]) for (let f = 0; f < 4; f++) { const z0 = ROAD + 70 - f * 62 - lr.range(0, 10), across = lr.chance(0.5), n = across ? 9 : 14, vg = mulc(lin('#506e30'), lr.range(0.75, 1.1));
        for (let i = 0; i < n; i++) { if (across) { const z = z0 - i * 5.2; if (z < 12) continue; land.box(sg * 52, 0, z, 30, 1.35, 0.55, 0, vg, M.leaf, { par: 0.12 }); } else { const x = sg * (22 + i * 4.4); land.box(x, 0, z0 - 24, 0.55, 1.35, 23, 0, vg, M.leaf, { par: 0.12 }); } } }
      // the first stalls, outside the gate, two on each hand
      for (const sg of [-1, 1]) for (const z of [13, 22]) stallAt(lr, 'gateStall', [sg * 9.8, z + lr.range(-1, 1)], Math.atan2(-sg, 0), null);
      // THE ROAD'S LAST STRETCH (its own stream): two more stalls on each hand, most with a grill; lamp posts on the verge
      // from there back along the road, a pair about every 13 m, each with two lamps on a cross arm; people going to and
      // from the gate on ovals of their own, and a few standing by the posts
      const rs = R.roadside, pal = [0, 1, 2, 3, 4], zEnd = ROAD - 26;
      for (const sg of [-1, 1]) for (const z of [31.5, 41]) stallAt(rs, 'gateStall', [sg * rs.range(9.9, 10.6), z + rs.range(-1, 1)], Math.atan2(-sg, 0), null, 0.75);
      for (let z = 52 + rs.range(0, 3); z < zEnd; z += rs.range(11.5, 14.5)) for (const sg of [-1, 1]) { const x = sg * rs.range(8.3, 8.8), hp = rs.range(4.4, 5), cols = [lampCol(rs, pal), lampCol(rs, pal)], stand = rs.chance(0.3), sx = rs.range(0.7, 1.2), sy = rs.range(0, TAU), sp = rs();
        if (lineToSolid({ x, z, r: 0.8, y0: 0, y1: hp }) < LANE || overlaps({ x, z, r: 0.5, y0: 0, y1: hp, roof: false })) { drop('post'); continue; }
        land.limb([x, 0, z], [x, hp, z], 0.11, 0.07, COL.dark, M.dark, 0, 5); land.limb([x, hp - 0.25, z - 0.75], [x, hp - 0.25, z + 0.75], 0.045, 0.045, COL.dark, M.dark, 0, 3); solids.push({ x, z, r: 0.2, y0: 0, y1: hp, roof: false });
        addLamp(x, hp - 0.3, z - 0.7, 0.22, cols[0], rs); addLamp(x, hp - 0.3, z + 0.7, 0.3, cols[1], rs);
        if (stand) people.push([x + sg * sx, 0, z + 0.4, sy, sp]); }
      for (let z = 16 + rs.range(0, 5); z < zEnd - 16; z += rs.range(6, 11) / density) { const sg = rs.chance(0.5) ? 1 : -1; addWalker(rs, sg * rs.range(3.5, 5.2), z, Math.PI / 2 + rs.range(-0.04, 0.04), rs.range(6, 13), rs.range(0.35, 0.6), rs.range(0.9, 1.4)); }
      // lamps on the east wall: one about every 6 m under its coping, 130 m to each hand of the gate, and a ring of eight
      // round every wall tower's cornice there
      // (the wall's lamps are amber with a red one here and there, so that their light lies warm and even on the stone)
      const warm = [1, 1, 1, 0];
      for (const sg of [-1, 1]) for (let x = 30 + rs.range(0, 4); x < 160; x += rs.range(5, 7)) addLamp(sg * x, 9.5, 1.75, 0.2 + 0.15 * rs(), lampCol(rs, warm), rs);
      for (const b of solids) if (b.r === 4.7 && Math.abs(b.z) < 1 && Math.abs(b.x) < 230) for (let k = 0; k < 8; k++) { const a = TAU * (k + 0.5) / 8; addLamp(b.x + Math.cos(a) * 5.05, 14.3, b.z + Math.sin(a) * 5.05, 0.25, lampCol(rs, warm), rs); }
    }
    await ctx.yield();

    // ------------------------------------------------------------ life: a cat and pigeons on the street's parapets, birds on closed rounds, smoke
    { const pr = R.pigeons, grey = lin('#8f8f9c');
      const perch = (b, ax, s, cat) => { const q = onHouse(b, ax, -b.side * 1.0), y = b.y1, g = chunkOf(q[0], q[1]), col = cat ? [0.05, 0.045, 0.05] : mulc(grey, pr.range(0.7, 1.1));
        if (lineDist(q[0], y + 0.4, q[1]) < LANE + 0.6) return drop('perch');
        g.lathe(q[0], y, q[1], [[0, 0], [0.5 * s, 0.25 * s], [0.42 * s, 0.7 * s], [0.2 * s, 1.0 * s], [0, 1.05 * s]], 6, col, M.dark, { sz: 1.5, yaw: b.yaw });
        g.lathe(q[0], y + 0.95 * s, q[1], [[0, 0], [0.22 * s, 0.18 * s], [0.2 * s, 0.34 * s], [0, 0.44 * s]], 5, col, M.dark);
        if (cat) { for (const e of [-1, 1]) g.limb([q[0] + e * 0.1 * s, y + 1.3 * s, q[1]], [q[0] + e * 0.16 * s, y + 1.56 * s, q[1]], 0.07 * s, 0, col, M.dark, 0, 3); g.limb([q[0], y + 0.15 * s, q[1]], [q[0] + 0.9 * s * Math.cos(b.yaw), y + 0.5 * s, q[1] - 0.9 * s * Math.sin(b.yaw)], 0.07 * s, 0.03 * s, col, M.leaf, 0.35, 4); }
        return true; };
      const rowHouses = solids.filter((b) => b.side !== undefined);
      for (const b of rowHouses) { const nP = pr.int(0, 3); for (let i = 0; i < nP; i++) perch(b, pr.range(-0.9, 0.9), 0.36, false); }
      // the cat: dealt a house of its own among the rows' houses and a place on its parapet (left out where it does not fit)
      if (rowHouses.length) { const cb = rowHouses[R.cat.int(0, rowHouses.length - 1)], aC = R.cat.range(-0.8, 0.8); perch(cb, aC, 0.55, true); } }
    await ctx.yield();
    // THE BIRDS, in flocks. Every bird flies a closed round of its own on the world's clock (birdAt is the shader's law);
    // the birds of one flock share the round's shape and its rate, each with its own small shift of place and phase, so
    // that they fly together and no bird wanders. Each bird's whole round, every phase at once, is tried against the
    // line and against what stands; a bird that does not fit is left out after its draws (tallied by its kind where
    // the line leaves it out, by its kind and Hit where a wall or a roof does). A flock's box is the
    // least distance of any of its birds' wing tips (0.6 of the span from its middle) to the line, kept in flocks[].
    const birds = [], flocks = [];
    { const q = [0, 0, 0]; let fr = R.swifts;
      const tryRound = (bd) => { let least = 1e9; for (let k = 0; k < 72; k++) { birdAt(bd, (TAU * k / 72) / bd.w, q); const d = lineDist(q[0], q[1], q[2]) - bd.size * 0.6; if (d < LANE + 0.4 * bd.size + 0.6) return -1; if (d < least) least = d;
          const near = solidCells.get(skey(scell(q[0]), scell(q[2]))); if (near) for (const o of near) if (solidDist(o, q[0], q[1], q[2]) < bd.size + 0.6) return -2; } return least; };
      const flock = (kind, c, n) => { let least = 1e9, k = 0; const bat = kind === 'bat', pig = kind === 'pigeon';
        for (let i = 0; i < n; i++) { const sp = pig ? 1.5 : 2.5;
          const bd = { x: c.x + fr.range(-sp, sp), y: c.y + fr.range(-1.2, 1.2), z: c.z + fr.range(-sp, sp), a: c.a * fr.range(0.93, 1.07), b: c.b * fr.range(0.93, 1.07), h: c.h * fr.range(0.7, 1.2), yaw: c.yaw, w: c.w, ph: c.ph + fr.range(-0.4, 0.4), q: c.q + fr.range(-0.3, 0.3), size: bat ? fr.range(0.9, 1.2) : pig ? fr.range(1.1, 1.5) : fr.range(1.4, 2.0), flap: bat ? fr.range(20, 26) : pig ? fr.range(7, 9.5) : fr.range(11, 16) };
          const d = tryRound(bd); if (d < 0) { drop(d < -1.5 ? kind + 'Hit' : kind); continue; } birds.push(bd); k++; if (d < least) least = d; }
        if (k) flocks.push({ kind, n: k, least: +least.toFixed(2), x: Math.round(c.x), z: Math.round(c.z) }); };
      // SWIFTS, by the city's own places (their own stream): long rounds that lie down the wind, each beside a place (to
      // one hand of it across the wind, clear of its walls): five by the great ribbed dome, four by each cluster's hall,
      // two by the onion dome, six by the tower, five over the square beside the theatre, and one by one block in
      // five of the city's whole net. A round's height is taken from the roofs under it: 7 to 16 m over the highest
      // thing that stands under its whole oval (the tower and the theatre apart, which it flies beside). The line's
      // only say is the clearance.
      const windYaw = Math.atan2(-windTo[1], windTo[0]), across = [-windTo[1], windTo[0]];
      const topUnder = (x, z, a, b, yaw) => { const c = Math.cos(yaw), sn = Math.sin(yaw); let top = HH(1);
        for (let k = 0; k < 25; k++) { const t = TAU * k / 12, f = k < 12 ? 1.1 : k < 24 ? 0.55 : 0, px = x + f * (a * Math.cos(t) * c + b * Math.sin(t) * sn), pz = z + f * (-a * Math.cos(t) * sn + b * Math.sin(t) * c), near = solidCells.get(skey(scell(px), scell(pz)));
          if (near) for (const o of near) { if (o.y1 <= top || o.y1 > 45) continue; const dh = o.hx !== undefined ? boxDist(o, px, pz) : Math.hypot(px - o.x, pz - o.z) - o.r; if (dh < 3) top = o.y1; } }
        return top; };
      const swifts = (x, z, half) => { const sg = fr.chance(0.5) ? 1 : -1, a = fr.range(14, 30), b = fr.range(6, 13), off = half + b + fr.range(2, 12), on = fr.range(-10, 10), over = fr.range(7, 16), yaw = windYaw + fr.range(-0.2, 0.2), cx = x + across[0] * sg * off + windTo[0] * on, cz = z + across[1] * sg * off + windTo[1] * on;
        flock('swift', { x: cx, y: topUnder(cx, cz, a, b, yaw) + over, z: cz, a, b, h: fr.range(1, 3.5), yaw, w: (fr.chance(0.5) ? 1 : -1) * fr.range(9, 15) / a, ph: fr.range(0, TAU), q: fr.range(0, TAU) }, fr.int(5, 9)); };
      for (let i = 0; i < 5; i++) { swifts(C1[0], C1[1], R1 + 3); await ctx.yield(); }
      for (const sg of [-1, 1]) { const hc = 1.15 * Rc, c = V2(Qc, r2, sg * (hc + 14.5)); for (let i = 0; i < 4; i++) { swifts(c[0], c[1], hc); await ctx.yield(); } }
      for (let i = 0; i < 2; i++) { swifts(C2[0], C2[1], R2 + 2.5); await ctx.yield(); }
      for (let i = 0; i < 6; i++) { swifts(Tw[0], Tw[1], TOWER.slab * 1.2); await ctx.yield(); }
      for (let i = 0; i < 5; i++) { swifts(Hc[0], Hc[1], TR + 1.6); await ctx.yield(); }
      { let nb = 0; for (const b of solids) { if (b.kind !== 'gridHouse' && b.kind !== 'gridHall' && b.kind !== 'gridCourt') continue; if (fr.chance(0.2 * density)) { swifts(b.x, b.z, Math.max(b.hx, b.hz)); await ctx.yield(); } } }
      await ctx.yield();
      // BATS, by the street's own rule (their own stream): small rounds along the market street (as far as the
      // forecourt, where the strings end) and along the avenue,
      // one about every 30 m of the street's axis, 4.6 to 5.4 m to one hand of it, over the stalls and under the strings
      // and the eaves (10.4 to 11.8 m over the street's paving, 11.2 to 12.6 m over the avenue's)
      fr = R.bats;
      for (const [P0, dd, rt, m0, m1, yLo] of [[G1, dS, rS, 8, mFore, 10.4], [E0, dA, rA, 62, La - 40, 11.2]]) for (let m = m0 + fr.range(0, 10); m < m1; m += fr.range(24, 36) / density) { const sg = fr.chance(0.5) ? 1 : -1, a = fr.range(4, 8), b = fr.range(1.2, 2), c = V2(V2(P0, dd, m), rt, sg * fr.range(4.6, 5.4));
        flock('bat', { x: c[0], y: yLo + fr.range(0, 1.4), z: c[1], a, b, h: fr.range(0.5, 1.1), yaw: Math.atan2(-dd[1], dd[0]), w: (fr.chance(0.5) ? 1 : -1) * fr.range(5, 8) / a, ph: fr.range(0, TAU), q: fr.range(0, TAU) }, fr.int(3, 5)); await ctx.yield(); }
      // PIGEONS wheeling round the domes (their own stream): the great ribbed dome, the onion dome, the first dome of
      // each cluster, the tower's belfry, and one in three of every other dome of 9 m and more over the whole city
      fr = R.wheels;
      const wheel = (x, z, rr, y) => flock('pigeon', { x, y, z, a: rr, b: rr, h: fr.range(1.2, 2.8), yaw: fr.range(0, TAU), w: (fr.chance(0.5) ? 1 : -1) * fr.range(7, 10) / rr, ph: fr.range(0, TAU), q: fr.range(0, TAU) }, fr.int(6, 10));
      const named = [dome1, dome2, clusters[0], clusters[4]].filter(Boolean);
      for (const d of named) { wheel(d.x, d.z, d.R * 1.08 + fr.range(3.5, 7), d.yS + d.R * fr.range(0.25, 0.7)); await ctx.yield(); }
      wheel(Tw[0], Tw[1], TOWER.slab * 1.42 + fr.range(3.5, 6), tower.yBelfry + fr.range(1, 7));
      await ctx.yield();
      for (const d of domeList) { if (d.kids || d === tower || named.includes(d) || d.R < 9) continue; const want = fr.chance(0.34), rr = d.R * 1.08 + fr.range(3.5, 7), y = d.yS + d.R * fr.range(0.25, 0.7);
        if (!want) continue; wheel(d.x, d.z, rr, y); await ctx.yield(); }
    }
    const smokeI = [];
    { const sr = R.smoke; for (const s of smokes) { const rise = sr.range(6, 9.5), drift = sr.range(0.4, 1.0), size = sr.range(0.7, 1.1), rate = sr.range(0.1, 0.17), ph = sr(); let ok = true;
        // its whole box: a dab drifts up to 1.42 times the drift from its column and is up to 0.73 times the size in half breadth; tried every half metre of the rise and at its top
        // (the box is wider than the dab ever is low down; minLane.smoke keeps the least box of the plumes that STAND: one left out is not tallied)
        const box = 1.42 * drift + 0.73 * size; let least = 1e9; for (let h = 0; ok && h < rise + 0.5; h += 0.5) { const d = lineDist(s[0], s[1] + Math.min(h, rise), s[2]) - box; if (d < LANE) ok = false; else if (d < least) least = d; }
        if (!ok) { drop('smoke'); continue; } if (least < minLane.smoke) minLane.smoke = least; for (let k = 0; k < 6; k++) smokeI.push(s[0], s[1], s[2], rise, rate, (ph + k / 6) % 1, size, drift); }
      const cs = R.chimneySmoke; for (const s of chimSmokes) { const rise = cs.range(8, 13), drift = cs.range(0.6, 1.3), size = cs.range(1.0, 1.5), rate = cs.range(0.07, 0.12), ph = cs(); let ok = true;
        const box = 1.42 * drift + 0.73 * size; let least = 1e9; for (let h = 0; ok && h < rise + 0.5; h += 0.5) { const d = lineDist(s[0], s[1] + Math.min(h, rise), s[2]) - box; if (d < LANE) ok = false; else if (d < least) least = d; }
        if (!ok) { drop('chimneySmoke'); continue; } if (least < minLane.smoke) minLane.smoke = least; for (let k = 0; k < 5; k++) smokeI.push(s[0], s[1], s[2], rise, rate, (ph + k / 5) % 1, size, drift); } }
    await ctx.yield();

    // ------------------------------------------------------------ the two maps of the place: roof heights (and what the ground is), and the lamps' light
    // (every loop over texels is a small function of its own, called by rows, so that it runs fast and hands back often)
    const MS = 1024, mapX0 = Math.round((xMin + xMax) / 2) - MS / 2, mapZ0 = 200, hm = new Uint8Array(MS * MS * 4), lmF = new Float32Array(MS * MS * 3);
    U.uMap.value.set(mapX0, mapZ0, 1 / MS, 100);
    // (the map's blue: outside the wall, where the lead mirrors only the sky and the lamps)
    const kindRows = (j0, j1) => { for (let j = j0; j < j1; j++) { const z = mapZ0 - (j + 0.5); for (let i = 0; i < MS; i++) { const x = mapX0 + i + 0.5, k = (j * MS + i) * 4; hm[k + 1] = (inCity(x, z, -3) || (Math.abs(x) < 7 && z > -3 && z < ROAD + 130)) ? 0 : 255; hm[k + 2] = z > 4 ? 255 : 0; hm[k + 3] = 255; } } };
    for (let j = 0; j < MS; j += 32) { kindRows(j, j + 32); await ctx.yield(); }
    const setH = (x, z, h) => { const i = Math.floor(x - mapX0), j = Math.floor(mapZ0 - z); if (i < 2 || j < 2 || i >= MS - 2 || j >= MS - 2) return; const k = (j * MS + i) * 4, v = Math.min(255, Math.round(h * 2.55)); if (v > hm[k]) hm[k] = v; };
    // a box is walked in its own frame, a round body over its own square
    const rasterBox = (b) => { const c = Math.cos(b.yaw || 0), s = Math.sin(b.yaw || 0), nx = Math.ceil(b.hx * 2 / 0.6), nz = Math.ceil(b.hz * 2 / 0.6);
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { const px = -b.hx + 2 * b.hx * i / nx, pz = -b.hz + 2 * b.hz * j / nz; setH(b.x + px * c + pz * s, b.z - px * s + pz * c, b.y1); } };
    const rasterRound = (x, z, r, hOf) => { for (let dz = -r; dz <= r; dz += 0.7) for (let dx = -r; dx <= r; dx += 0.7) { const rho = Math.hypot(dx, dz); if (rho <= r) setH(x + dx, z + dz, hOf(rho)); } };
    { let n = 0;
      for (const b of solids) { if (b.dome || b.y1 < 2.5 || (b.roof === false && b.y1 < 9)) continue; if (b.hx !== undefined) rasterBox(b); else rasterRound(b.x, b.z, b.r, b.cone ? (rho) => b.y1 * (1 - 0.8 * rho / b.r) : () => b.y1); if (++n % 20 === 0) await ctx.yield(); }
      for (const d of domeList) { for (const e of (d.kids ? d.kids : [d])) rasterRound(e.x, e.z, e.prof[0][0], (rho) => profH(e, rho)); if (++n % 6 === 0) await ctx.yield(); } }
    // the map of shade: the roof heights swept once toward the sun (or the moon), so that every place holds the height
    // under which its air is in shade. Each texel takes the greater of its own roof and what its neighbour on the sun's
    // side holds, less the fall of the light over one step; a shadow so lies whole under what casts it and softens with
    // its length. (A standing state of the hour: the sun does not move.)
    const shade = new Float32Array(MS * MS), smH = new Uint16Array(MS * MS);
    { const hRows = (k0, k1) => { for (let k = k0; k < k1; k++) shade[k] = hm[k * 4] / 2.55; };
      for (let k = 0; k < MS * MS; k += 262144) { hRows(k, k + 262144); await ctx.yield(); }
      const di = U.uSunH.value.x, dj = -U.uSunH.value.y, tanE = U.uSunTan.value, at = (i, j) => (i < 0 || j < 0 || i >= MS || j >= MS) ? 0 : shade[j * MS + i];
      const byCols = Math.abs(di) >= Math.abs(dj), sg = (byCols ? di : dj) > 0 ? 1 : -1, slope = byCols ? dj / Math.abs(di) : di / Math.abs(dj), fall = tanE / Math.max(Math.abs(di), Math.abs(dj)), s0 = Math.floor(slope), sf = slope - s0;
      const sweep = (a) => { for (let b = 0; b < MS; b++) { const i = byCols ? a : b, j = byCols ? b : a, ui = byCols ? i + sg : i + s0, uj = byCols ? j + s0 : j + sg;
          const p = at(ui, uj), q = byCols ? at(ui, uj + 1) : at(ui + 1, uj), up = p + (q - p) * sf - fall, k = j * MS + i; if (up > shade[k]) shade[k] = up; } };
      for (let n = 1; n < MS; n++) { sweep(sg > 0 ? MS - 1 - n : n); if (n % 48 === 0) await ctx.yield(); }
      const toHalf = THREE.DataUtils.toHalfFloat, halfRows = (k0, k1) => { for (let k = k0; k < k1; k++) smH[k] = toHalf(shade[k]); };
      for (let k = 0; k < MS * MS; k += 65536) { halfRows(k, k + 65536); await ctx.yield(); }
      const ts = new THREE.DataTexture(smH, MS, MS, THREE.RedFormat, THREE.HalfFloatType); ts.magFilter = ts.minFilter = THREE.LinearFilter; ts.needsUpdate = true; U.uSM.value = ts; }
    const splat = (x, z, col, rad, k) => { const ci = x - mapX0, cj = mapZ0 - z, n = Math.ceil(rad * 2.4), i0 = Math.max(0, Math.floor(ci - n)), i1 = Math.min(MS - 1, Math.ceil(ci + n)), j0 = Math.max(0, Math.floor(cj - n)), j1 = Math.min(MS - 1, Math.ceil(cj + n)), q = 1 / (rad * rad);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) { const dx = i + 0.5 - ci, dz = j + 0.5 - cj, w = k * Math.exp(-(dx * dx + dz * dz) * q), a = (j * MS + i) * 3; lmF[a] += col[0] * w; lmF[a + 1] += col[1] * w; lmF[a + 2] += col[2] * w; } };
    const splatLamps = (i0, i1) => { for (let i = i0; i < i1; i += 8) { const c = [lamps[i + 4], lamps[i + 5], lamps[i + 6]]; splat(lamps[i], lamps[i + 2], c, 1.25, 0.5); splat(lamps[i], lamps[i + 2], c, 4.2, 0.07); } };
    for (let i = 0; i < lamps.length; i += 320) { splatLamps(i, Math.min(lamps.length, i + 320)); await ctx.yield(); }
    for (const s of smokes) splat(s[0], s[2], [1, 0.4, 0.1], 1.6, 0.35);
    // the theatre's light on the lead: every bay throws its own colour outward
    { const ph = hero.object.rotation.y, cp = Math.cos(ph), sp = Math.sin(ph), N = hero.tints.length;
      for (let k = 0; k < N; k++) { const a = TAU * (k + 0.5) / N, ux = Math.cos(a) * cp + Math.sin(a) * sp, uz = -Math.cos(a) * sp + Math.sin(a) * cp, t = hero.tints[k];
        for (let r = TR + 2; r < TR + 34; r += 2.6) splat(Hc[0] + ux * r, Hc[1] + uz * r, [t[0], t[1] * 0.9, t[2] * 0.85], 2.3 + (r - TR) * 0.06, 0.2 * (1 - (r - TR) / 36) * HR.inner);
        if (k % 6 === 5) await ctx.yield(); } }
    const lm = new Uint8Array(MS * MS * 4);
    const encodeRows = (k0, k1) => { for (let k = k0, a = k0 * 3; k < k1; k++, a += 3) { lm[k * 4] = Math.min(255, Math.sqrt(lmF[a]) * 255); lm[k * 4 + 1] = Math.min(255, Math.sqrt(lmF[a + 1]) * 255); lm[k * 4 + 2] = Math.min(255, Math.sqrt(lmF[a + 2]) * 255); lm[k * 4 + 3] = 255; } };
    for (let k = 0; k < MS * MS; k += 65536) { encodeRows(k, k + 65536); await ctx.yield(); }
    { const th = new THREE.DataTexture(hm, MS, MS, THREE.RGBAFormat); th.magFilter = th.minFilter = THREE.LinearFilter; th.needsUpdate = true; U.uHM.value = th;
      const tl = new THREE.DataTexture(lm, MS, MS, THREE.RGBAFormat); tl.magFilter = THREE.LinearFilter; tl.minFilter = THREE.LinearMipmapLinearFilter; tl.generateMipmaps = true; tl.needsUpdate = true; U.uLM.value = tl; }
    await ctx.yield();

    // ------------------------------------------------------------ the meshes
    { const gm = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000).rotateX(-Math.PI / 2), makeGroundMaterial(U, { lead: mulc(COL.lead, rare ? 0.8 : 1), chanA: [E0[0], E0[1], dA[0], dA[1]], basA: [...(basins[0] || [1e6, 1e6]), ...(basins[1] || [1e6, 1e6])], basB: [...(basins[2] || [1e6, 1e6]), ...(basins[3] || [1e6, 1e6])], basH: BASIN })); gm.position.set((xMin + xMax) / 2, 0, Gw[1] / 2); gm.frustumCulled = false; gm.name = 'ground'; scene.add(gm); }
    let trisStill = 0;
    for (let i = 0; i < CH; i++) { if (!geos[i].nv) continue; const m = new THREE.Mesh(await geos[i].buildSlow(() => ctx.yield()), cityMat); m.name = 'city' + i; trisStill += geos[i].tris; scene.add(m); await ctx.yield(); }
    { const m = new THREE.Mesh(await land.buildSlow(() => ctx.yield()), cityMat); m.name = 'land'; trisStill += land.tris; scene.add(m); }
    await ctx.yield();
    const instanced = (base, attrs, n, mat, name, cull) => { const g = new THREE.InstancedBufferGeometry(); g.index = base.index; for (const k in base.attributes) g.setAttribute(k, base.attributes[k]);
      for (const k in attrs) g.setAttribute(k, new THREE.InstancedBufferAttribute(attrs[k], 4)); g.instanceCount = n;
      const m = new THREE.Mesh(g, mat); m.name = name; if (cull) { g.boundingSphere = cull; } else m.frustumCulled = false; scene.add(m); return m; };
    // lamps, by the same five stretches (so that only those near are drawn), each stretch with its own bounding ball
    const lampMats = makeLampMaterials(U), lampGeo = lampGeometry(), quad = quadGeometry(), nLamps = lamps.length / 8;
    { const per = []; for (let i = 0; i < CH; i++) per.push([]);
      for (let i = 0; i < lamps.length; i += 8) per[clamp(Math.floor(nearM(lamps[i], lamps[i + 2]) / Lp * CH), 0, CH - 1)].push(i);
      for (let c = 0; c < CH; c++) { const n = per[c].length; if (!n) continue; const iPos = new Float32Array(n * 4), iCol = new Float32Array(n * 4), bb = new THREE.Box3();
        per[c].forEach((i, k) => { iPos.set([lamps[i], lamps[i + 1], lamps[i + 2], lamps[i + 3]], k * 4); iCol.set([lamps[i + 4], lamps[i + 5], lamps[i + 6], lamps[i + 7]], k * 4); bb.expandByPoint(_v.set(lamps[i], lamps[i + 1], lamps[i + 2])); });
        const sph = bb.getBoundingSphere(new THREE.Sphere()); sph.radius += 4;
        instanced(lampGeo, { iPos, iCol }, n, lampMats.body, 'lamps' + c, sph); const gl = instanced(quad, { iPos, iCol }, n, lampMats.glow, 'glows' + c, sph.clone()); gl.renderOrder = 4; }
      await ctx.yield(); }
    const lifeMats = makeLifeMaterials(U), ROBES = ['#b9892f', '#2f3f7a', '#8a2f2a', '#d8cdb4', '#5a6a2c', '#6a3c6a', '#2c6a66'].map(lin);
    let nPeople = 0, nStanders = 0;
    { const pr = R.people, P = [], C = [];
      for (const q of people) { const col = mulc(pr.pick(ROBES), pr.range(0.7, 1.05)), ph = q[4]; if (Math.min(lineDist(q[0], 1.75, q[2]), lineDist(q[0], 0.9, q[2])) - 0.35 < LANE || overlaps({ x: q[0], z: q[2], r: 0.3, y0: 0, y1: 1.7 }, 0)) { drop('person'); continue; } P.push(q[0], 0, q[2], q[3]); C.push(col[0], col[1], col[2], ph); nPeople++; }
      const W = new Array(nPeople * 4).fill(0); nStanders = nPeople;
      for (const wk of walkers) { const col = mulc(pr.pick(ROBES), pr.range(0.7, 1.05)); P.push(wk.x, 0, wk.z, 0); C.push(col[0], col[1], col[2], wk.ph); W.push(wk.a, wk.b, wk.w, wk.yaw); nPeople++; }
      instanced(personGeometry(), { iPos: new Float32Array(P), iCol: new Float32Array(C), iW: new Float32Array(W) }, nPeople, lifeMats.people, 'people', null); }
    { const n = birds.length, A = new Float32Array(n * 4), B = new Float32Array(n * 4), C = new Float32Array(n * 4);
      birds.forEach((b, k) => { A.set([b.x, b.y, b.z, b.size], k * 4); B.set([b.a, b.b, b.h, b.yaw], k * 4); C.set([b.w, b.ph, b.q, b.flap], k * 4); });
      instanced(birdGeometry(), { iA: A, iB: B, iC: C }, n, lifeMats.birds, 'birds', null);
      const ns = smokeI.length / 8, SA = new Float32Array(ns * 4), SB = new Float32Array(ns * 4); for (let k = 0; k < ns; k++) { SA.set(smokeI.slice(k * 8, k * 8 + 4), k * 4); SB.set(smokeI.slice(k * 8 + 4, k * 8 + 8), k * 4); }
      const sm = instanced(quad, { iA: SA, iB: SB }, ns, lifeMats.smoke, 'smoke', null); sm.renderOrder = 5; }
    await ctx.yield();
    const ridges = T.makeHorizonRidges({ rng: R.ridges, fog: scene.fog, height: [90, 300], colorNear: night ? '#232a4c' : '#5a5682', sunDir: U.uSunDir.value, sunColor: HR.sunCol, rim: 0.4 });
    scene.add(ridges.object);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    // ------------------------------------------------------------ the film: the pace and the gaze's pulls, between places in metres
    const bell = (x, a, b, w) => smoothstep(a, a + w, x) * (1 - smoothstep(b - w, b, x));
    // THE GAZE'S PULLS, each on a thing of the place, each window between two places of the line (in its metres):
    // domeV: the great ribbed dome at the springing of its shell (the top of its drum, so that the look goes level or
    //   a little down as we come up beside it and the dome stands whole, finial and all, over the roofs), from one
    //   forecourt's length before the forecourt (mDomeView) to the roof leg's first knot (a quarter of the leg past the dome's flank,
    //   F): it is full until half a HAND before F, where the dome is still before us and whole, and is let go as the
    //   dome falls abeam, so that the gaze never follows it back;
    // roofV: the tower where its shaft leaves the roofs (the tallest houses' cornice), from where the dome pull begins
    //   to let go (one HAND before the leg's first knot: the two change hands over that one stretch) to the tower's
    //   round: the look goes a little down over the domes and the lit streets, the tower before it;
    // bellV: the tower at the slab under its cap (48 m), from between the two clusters (the leg's middle) to the end of
    //   the tower's round, so that the cock's comb is inside the picture;
    // hallV: the theatre's middle, from the tower's round to where the avenue begins (E0), so that the theatre is seen
    //   whole in its square from above before the descent, and looked into along its flank.
    // WEIGHTS: the engine turns the gaze from the way ahead toward the thing by its weight (a thing abeam is brought
    //   to atan(w / (1 - w)) off the heading: 0.6 gives 56 degrees, 0.65 gives 62, 0.7 gives 67), so that the dome
    //   (48 m off, 40 degrees broad) and the tower stand whole inside the picture as we pass and round them, and the
    //   theatre is looked into along its flank.
    // HAND: where two pulls meet they hand over across one shared stretch, and every such stretch (and each pull's
    //   rise and fall) is as long as the half of the roof leg, from F to between the clusters (58 to 72 m: two and
    //   a half seconds and more at the pace flown there), the weights never adding to more than the larger.
    const domeV = new THREE.Vector3(C1[0], dome1 ? dome1.yS : HH(2) + R1 * 0.5, C1[1]), roofV = new THREE.Vector3(Tw[0], HH(3), Tw[1]), bellV = new THREE.Vector3(Tw[0], tower.ySlab, Tw[1]), hallV = new THREE.Vector3(Hc[0], hero.center.y, Hc[1]);
    const hand = mLegMid - mFlank, shareOf = (a, b) => Math.min(0.5, hand / Math.max(b - a, 1));
    return {
      scene, path, duration: 50,
      title: rare ? 'The Silver Domes and the Streets of Lead, after Rain' : 'The Silver Domes and the Streets of Lead',
      camera: { fov: 62, near: 0.3, far: 4800, lookAhead: 24, sway: 1, bank: 0 },
      // slower down the street (from the gate to the forecourt's first metre), round the tower and round the theatre
      pace: (u) => { const m = u * Lp; return 1.06 - 0.2 * bell(m, mGate - 10, mForeM, 40) - 0.34 * bell(m, mArc0 - 30, mArc1 + 20, 35) - 0.32 * bell(m, mSq - 35, mAve + 15, 40); },
      pois: [
        // none is on at the first metres (the first begins far down the street)
        { at: domeV, from: uM(mDomeView), to: uM(mLegQ), weight: 0.7, fade: shareOf(mDomeView, mLegQ) },
        { at: roofV, from: uM(mLegQ - hand), to: uM(mArc0), weight: 0.6, fade: shareOf(mLegQ - hand, mArc0) },
        { at: bellV, from: uM(mLegMid), to: uM(mArc1), weight: 0.6, fade: shareOf(mLegMid, mArc1) },
        { at: hallV, from: uM(mArc1 - hand), to: uM(mAve), weight: 0.65, fade: shareOf(mArc1 - hand, mAve) },
      ],
      portal: { shape: 'circle', radius: 6, color: night ? '#ffc98a' : '#ffe0b0', glow: 1, revealDistance: 320 },
      post: { exposure: HR.exposure, bloom: { strength: night ? 0.55 : 0.42, radius: 0.6, threshold: 0.9 },
        grade: { saturation: 1.1, contrast: 1.06, tint: '#ffffff', shadowTint: '#0c0a22', vignette: 0.28, grain: 0.02, aberration: 0 } },
      update(dt, time, camera) {
        U.uTime.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera); ridges.update(dt, time, camera);
        cock.update(time); hero.update(dt, time);
      },
      // (every texture this world makes itself is freed here: the stand-in, the baked sky and the maps of shade, roof heights and lamp light)
      dispose() { sky.dispose?.(); blank.dispose(); for (const k of ['uSky', 'uSM', 'uHM', 'uLM']) U[k].value?.dispose?.(); },
      // what a count in node reads (no picture): the line, what stands, what moves and by which law
      info: { hour: hourName, rare, density, Lp, places: { mGate, mDomeView, mFlank, mLegQ, mLegMid, mArc0, mArc1, mSq, mAve }, solids, domeList, birds, flocks, smokeI, lamps, people, walkers, figList, minLane, dropped, counts, cockLane, towerLane, theatreLane,
        n: { lamps: nLamps, people: nPeople, standers: nStanders, walkers: walkers.length, birds: birds.length, smoke: smokeI.length / 8, figures: figList.length, domes: domeList.length, streetStalls: nStreetStalls, squareStalls: nSquareStalls, aveStalls: nAveStalls, aveFigures: nAveFigures, streetStrings: nStreetStrings, aveStrings: nAveStrings, banners: nBanners, relief: nRelief, flocks: flocks.length, trisStill },
        lineToDome, lineToSolid, lineDist, profDist, solidDist, roofAt, basins, BASIN, stringSpans, mFore, mCross, entry: [0, yRoad, ROAD], cock, dome1, dome2, clusters, tower, plan: { h1, thS, thA, sunSide, R1, R2, Rc, rT, rH, Hc, Tw, C1, C2, E0, Gw, Ls, G1 } },
    };
  },
};
