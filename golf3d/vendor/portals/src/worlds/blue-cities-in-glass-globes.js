// The Blue Cities in Glass Globes: in the middle of a grey stone city stands a building of iron and bronze with a
// crystal globe in every room, and in every globe a small blue city, each one different. The flight begins level over
// the slate roofs of the grey city (a viaduct with its trams under it; the city climbs away on every side in tiers
// of streets, towers, spires and domes until the evening air takes it), comes down a broad stone stair between lamp
// standards and in under the porch through the open bronze doors; goes down one long gallery of rooms, each divided
// from the next by a great open iron arch, past each room's great globe on its bronze stand (the city of canals with
// its pond of jellyfish, the city of the elephants' avenue, the city of the spiral slide, in an order drawn for the
// visit), high enough to look down into each; comes out on the top gallery of the rotunda (the hero set piece,
// src/parts/blue-cities-in-glass-globes.js: four storeys of iron galleries with a globe in every alcove, round a
// crystal globe 160 m across that holds the grandest city); swings out to one hand, climbs over the great globe's
// shoulder, and dives through the MIDDLE of the bronze ring in its crown, straight down toward the harbour among the
// towers; pulls out, turns once round the harbour and its light, and flies the avenue to the square, over the small
// globe on its plinth, to the ring in the square's arch.
// (An original place from one city of Invisible Cities by Italo Calvino, 1923 to 1985. The place stands: nothing
// here begins, turns or ends as we come.)
//
// WHAT IS DRIVEN BY WHAT
//   by the metres flown (u): the pace of the flight and the gaze's pulls, nothing else. No light, fog, sky, door or
//     mover reads u, the route or the eye's place. The pace changes at six places only (the viaduct, the stair's
//     foot, the gallery's last arch, the great globe's shoulder, the crown's ring, the avenue's first metre). The
//     first change is eased from the viaduct as far as the stair's head; each of the other five is eased over ONE
//     length, the stair's own; the pulls hand over across that length.
//   by the world's clock (time): every mover, each from a phase drawn from its own stream: the small cities' boats,
//     elephants, sliders, walkers, ships, jellyfish, sails, banners, fountains and smoke (laws LOOP, ROCK, WAVE, HELIX,
//     PUFF in the part file's vertex shader); the seven trams on their viaduct and the grey city's chimney smoke (the
//     same laws); lit windows coming and going; the lamps' flicker; water's ripples; the shimmer of the globes' light
//     on floor, wall and vault; the rain that comes and goes on the tall windows on a round of its own; the small globe
//     turning on its plinth; the pigeons and the gulls (the kit's flocks, on loops of their own); dust motes (live's
//     low mist over the harbour is struck, p1m1 O1). (Polish round 1 adds, each from a phase of a stream of its own: the works chimneys'
//     smoke on the far tiers, leaning in the one evening wind; three flags on the building; the walkers on the
//     stair, the forecourt, the fountain square and the viaduct's street; a third flock, pigeons over one yard of
//     the forecourt; the great pendulum under the dome's lantern; the gallery's hanging lanterns, swaying; the
//     harbour's light going round with its leaf of light on the water; more jellyfish, boats, elephants, sliders
//     and walkers in the rooms' great globes; light travelling slowly over every crystal; dust in the beams.)
//   by the hour drawn for the visit (a standing state): the sky, the light's colour and height, the panes' glow, how
//     many windows are lit (in the small cities, in the grey city, in the near roofs' dormers), the lamps' strength,
//     the warm light of the dome and of the open door. By the rare draw (a standing state): one room's globe holds a city
//     all in gold.
//   by the view, as shine is: the crystal's reflections, rim and glints; the engine's fog; the kit's particles' and
//     birds' own near laws; the kit's shadow map, which is laid round the eye. Nothing is placed, hidden, moved, sized
//     or timed by the camera.
//   Smoke and fountain water (law PUFF) leave a chimney's or a jet's mouth from nothing and thin to nothing at the top
//     of their rise, each on its own round of the clock; the sliders of the spiral city (law HELIX) come out of the
//     tower's body at its head and go into it at its foot.
// NO FIGURE REGARDS THE VISITOR; no figure has a face; nothing gives way: globes, rails, towers and the crown's ring
// keep a lane round the route by place (tested in build on the seed's own layout, every 2 m of route). The camera
// does not roll: no bank, no sway.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, Geo, Shells, townMaterial, crystalMaterial, buildCity, tinyCity, cityPalette, standInto, crownInto, railInto, lampInto, bracketInto, meshOf, LAWS, BODIES, CITY_KINDS, COLORS, PAT, GLOBE, HALL, INSIDE, INSIDE_E, lin, mulc, moverAt } from '../parts/blue-cities-in-glass-globes.js';

const TAU = Math.PI * 2, DEG = Math.PI / 180;

// What each hour looks like: a standing state of the whole visit. The light always has a side (it comes through the
// tall windows and the glazed vault from one hand, 20 to 46 degrees up, and the iron throws true shadow), so every
// form has a lit and a shaded face. pane: the glazed roofs' glow; lit / litT: the small cities' window lights and how
// many are on; glow: the blue cities' own light; fill: the lamps' standing light in the rooms; hall: the same in the
// rotunda; blue: the light every great globe sheds; lamp: the lamps themselves; win: the building's windows seen from
// outside. cityLit: how many of the grey city's windows are lit (the pattern's threshold: 0.15 some four in ten
// at a time, -1.05 every one); dome: the warm light the building's glazed dome, lantern and fanlight shine with from
// inside, seen from the city; door: the warm light that falls out of the open door on the leaves, the reveal, the
// forecourt and the stair. The common hour ('day') is a lit early evening: a sky with colour, a low warm light with a
// side, lamps and windows lit; 'golden' is a sunset; dawn keeps its low pink light with the lamps still lit; night
// stays night with every window and lamp lit.
const HOURS = {
  day: { preset: 'goldenHour', elevation: 32, light: '#ffc48c', li: 5.4, amb: 0.85, ambCol: '#93a4d8', fog: '#bfa79c', den: 0.00095, pane: [0.38, 0.44, 0.64], lit: [1.6, 1.6, 1.7], litT: 0.35, glow: 0.42, gain: 0.7, fill: [0.17, 0.13, 0.085], hall: [0.3, 0.22, 0.13], blue: 0.9, veil: 0.012, ice: [0.7, 0.8, 0.96], lamp: 3.2, grey: 0.8, win: [0.45, 1.0, 2.6], exposure: 1.02, sun: 1.1, cityLit: 0.15, dome: [1.0, 0.6, 0.26], door: [1.3, 0.77, 0.29],
    sky: { sunElevation: 12, sunIntensity: 11 } },
  golden: { preset: 'sunset', elevation: 21, light: '#ff9c5e', li: 5.2, amb: 0.9, ambCol: '#8d88cc', fog: '#b58f8e', den: 0.001, pane: [0.5, 0.36, 0.52], lit: [1.8, 1.7, 1.6], litT: 0.25, glow: 0.46, gain: 0.74, fill: [0.22, 0.155, 0.09], hall: [0.36, 0.255, 0.14], blue: 1.0, veil: 0.012, ice: [0.8, 0.74, 0.86], lamp: 3.4, grey: 0.78, win: [0.4, 0.95, 2.8], exposure: 1.02, sun: 1.2, cityLit: 0.0, dome: [1.1, 0.62, 0.26], door: [1.4, 0.82, 0.3],
    sky: { sunElevation: 4, sunIntensity: 12 } },
  dawn: { preset: 'dawn', elevation: 20, light: '#ffb8a6', li: 3.8, amb: 0.9, ambCol: '#9aa2d6', fog: '#bfa9b4', den: 0.001, pane: [0.6, 0.42, 0.46], lit: [1.8, 1.8, 1.9], litT: 0.25, glow: 0.5, gain: 0.78, fill: [0.3, 0.21, 0.13], hall: [0.42, 0.3, 0.17], blue: 1.1, veil: 0.012, ice: [0.74, 0.74, 0.95], lamp: 3.4, grey: 0.78, win: [0.45, 1.0, 2.9], exposure: 1.05, sun: 0.9, cityLit: 0.45, dome: [0.85, 0.58, 0.34], door: [1.15, 0.74, 0.33],
    sky: { sunElevation: 6, bodies: [] } },
  night: { preset: 'night', elevation: 40, light: '#aebfff', li: 2.2, amb: 1.15, ambCol: '#4660b0', fog: '#1a2440', den: 0.0011, pane: [0.035, 0.05, 0.11], lit: [1.9, 1.9, 2], litT: 0.0, glow: 0.46, gain: 0.8, fill: [0.5, 0.35, 0.2], hall: [0.56, 0.39, 0.21], blue: 1.0, veil: 0.01, ice: [0.35, 0.5, 1], lamp: 4.2, grey: 0.62, win: [0.5, 1.15, 3.2], exposure: 1.16, sun: 0.6, cityLit: -1.05, dome: [1.15, 0.7, 0.3], door: [1.7, 1.0, 0.38],
    sky: {} },
};

export default {
  id: 'blue-cities-in-glass-globes',
  name: 'The Blue Cities in Glass Globes',
  category: 'books',
  placeKind: 'interior',
  book: 'Invisible Cities',
  author: 'Italo Calvino, 1923 to 1985',
  media: ['interior'],
  weirdness: 0.8,
  async build(ctx) {
    const scene = new THREE.Scene(), C = COLORS;
    const vary = ctx.vary || {}, detail = ctx.quality ? ctx.quality.detail : 1;
    // ------------------------------------------------------------ every stream, taken here before anything is built
    // (this world has never been live: round 2 deals every stream anew, by the names below)
    const R = {}; for (const k of ['vary', 'hour', 'sky', 'plan', 'grey', 'roofs', 'tram', 'front', 'rooms', 'shelves', 'hero', 'pigeons', 'gulls', 'motes', 'mist', 'rain', 'lamps']) R[k] = ctx.core.makeRng(ctx.core.hashSeed(k + '2:' + ctx.seed));
    // (polish round 1: every NEW thing takes a stream of its own, made here from the world's seed and the thing's
    // name; it draws nothing from any stream above, and none of the streams above deals a draw more or less than live)
    const OWN = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + '3:' + ctx.seed));
    const roomR = [0, 1, 2, 3].map((i) => { const rr = R.rooms.fork('room' + i); return { rr, city: rr.fork('city'), small: [rr.fork('small-1'), rr.fork('small1')], shelf: R.shelves.fork('room' + i) }; });
    const hourDrawn = R.hour.pick(['day', 'day', 'day', 'golden', 'golden', 'dawn', 'night', 'night']);
    const hourName = HOURS[vary.hour] ? vary.hour : hourDrawn, HR = HOURS[hourName], night = hourName === 'night';
    const rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3) * (detail < 1 ? 0.6 + 0.4 * detail : 1);
    // the plan: how many rooms (three on two visits in three, four on the third: the seed's draw alone), which kind of
    // city in which room (the three the place is known by, and a fourth of the crew's own where there are four rooms),
    // on which hand each room's great globe stands, to which hand the flight swings out in the rotunda and how far,
    // and from which hand the light comes
    const P = R.plan, nRooms = P.pick([3, 3, 4]), RL = nRooms === 3 ? 68 : 54, Lg = nRooms * RL;
    const roomKinds = P.shuffle(['canal', 'avenue', 'minaret']); if (nRooms === 4) roomKinds.splice(P.int(0, 3), 0, P.pick(['bridges', 'harbour', 'towers', 'ring', 'stairs', 'sails']));
    const hand0 = P.chance(0.5) ? 1 : -1, hook = P.chance(0.5) ? 1 : -1, hookA = P.range(22, 30) * DEG, goldRoom = P.int(0, nRooms - 1);
    const sunHand = R.vary.chance(0.5) ? 1 : -1, sunAz = sunHand * R.vary.range(62, 108);
    // ------------------------------------------------------------ sky, light, haze
    // (the kit's makeSky stands alone between two hand-backs)
    await ctx.yield();
    const sky = makeSky({ rng: R.sky, preset: HR.preset, ...HR.sky, sunElevation: (HR.sky && HR.sky.sunElevation) ?? HR.elevation, sunAzimuth: sunAz, lightElevationMin: HR.elevation,
      lightColor: HR.light, lightIntensity: HR.li, ambientColor: HR.ambCol, ambientIntensity: HR.amb * 2, quality: 0.5 });
    await ctx.yield();
    scene.add(sky.object);
    const rig = makeLightRig(sky, { intensity: 1, ambient: 1, bounce: 0.35, shadow: true, shadowRange: 170, shadowSize: 2048 });
    scene.add(rig.object);
    if (rig.sun && rig.sun.shadow) { rig.sun.shadow.bias = -0.0006; rig.sun.shadow.normalBias = 0.6; }
    scene.fog = new THREE.FogExp2(new THREE.Color(HR.fog), HR.den);
    const sunDir = sky.lightDirection.clone().normalize();
    await ctx.yield();
    // ------------------------------------------------------------ the plan in metres
    // The gallery runs down -z from the front wall at z = 0; its floor is y = 0. The rotunda's well lies beyond it:
    // the gallery's last arch opens on the rotunda's TOP gallery, so the great globe's middle G lies under the eye.
    const EYE = 26, DIP = 1.2, WR = 48, HW = 56, VR = 22, zG = -Lg - HALL.RW, heroY = -HALL.door.level, G = new THREE.Vector3(0, heroY + HALL.GH, zG), RG = GLOBE.R;
    const ENTRY = [0, 58, 165], STREET = 18, STAIR = [60, 24];
    // each room's globes: the great one 5.5 m off one wall, small ones on pedestals by the other
    const rooms = [];
    for (let i = 0; i < nRooms; i++) {
      const rr = roomR[i].rr, hand = hand0 * (i % 2 ? -1 : 1), r = nRooms === 3 ? rr.range(12.4, 14.6) : rr.range(11, 12.6), zc = -(i + 0.5) * RL + rr.range(-3, 3), hs = 9;
      const small = []; for (const dz of [-1, 1]) small.push({ r: rr.range(3.3, 4.8), x: -hand * rr.range(31, 35), z: zc + dz * rr.range(RL * 0.2, RL * 0.3), hs: rr.range(6.5, 8.5), kind: rr.pick(CITY_KINDS), yaw: rr.range(0, TAU), rng: roomR[i].small[dz < 0 ? 0 : 1] });
      rooms.push({ i, rr, hand, r, hs, x: hand * (WR - 5.5 - r), y: hs + r, z: zc, kind: roomKinds[i], yaw: rr.range(0, TAU), small, gold: rare && i === goldRoom, cityRng: roomR[i].city });
    }
    // ------------------------------------------------------------ the materials the whole place shares
    // the light the great globes shed (the rooms' and the rotunda's): places with radius, and colours
    const tU = { value: 0 }, lightC = new THREE.Color(HR.light);
    const globes = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, -1e4, 0, 1)), globeC = [0, 1, 2, 3, 4, 5].map(() => new THREE.Color(0, 0, 0));
    rooms.forEach((g, i) => { globes[i].set(g.x, g.y, g.z, g.r); if (g.gold) globeC[i].setRGB(1.25, 0.78, 0.2); else globeC[i].setRGB(0.17, 0.4, 1.3); globeC[i].multiplyScalar(HR.blue * 3); });
    globes[4].set(G.x, G.y, G.z, RG); globeC[4].setRGB(0.17, 0.4, 1.3).multiplyScalar(HR.blue * 1.6);
    const lights = { globes, globeC };
    // the warm light that falls out of the open door (the hall's lamps behind it): one standing source in the middle of
    // the opening at the wall's outer face, 22 m up, shed by the globes' own law on the front, the forecourt, the
    // stair and whatever of the grey city stands near (a law of the place: nothing reads the eye)
    const doorG = [0, 1, 2, 3, 4, 5].map(() => new THREE.Vector4(0, -1e4, 0, 1)), doorC = [0, 1, 2, 3, 4, 5].map(() => new THREE.Color(0, 0, 0));
    doorG[0].set(0, 22, 5, 36); doorC[0].setRGB(HR.door[0], HR.door[1], HR.door[2]);
    const doorL = { globes: doorG, globeC: doorC };
    const greyO = { time: tU, glow: 0, lit: [2.4, 1.7, 0.8], litT: HR.cityLit, litWarm: [1.15, 0.74, 0.42], lamp: HR.lamp, wet: 0.45, shutter: lin('#c9ced3'), ...doorL };
    const mats = {
      time: tU, light: sunDir,
      arch: townMaterial({ time: tU, glow: 0, fill: HR.fill, lamp: HR.lamp, pane: HR.pane, wet: 0.25, lit: HR.win, litT: -0.35, shutter: mulc(C.bronze, 0.8), ...lights }),
      // the front stands in the weather: it has a fifth of the rooms' lamp light on it (what its own lamps give)
      front: townMaterial({ time: tU, glow: 0, fill: mulc(HR.fill, 0.2), lamp: HR.lamp, pane: HR.dome, wet: 0.45, lit: HR.win, litT: -0.35, shutter: mulc(C.bronze, 0.8), ...doorL }),
      hall: townMaterial({ time: tU, glow: 0, fill: HR.hall, lamp: HR.lamp, pane: HR.pane, wet: 0.25, lit: HR.win, litT: -0.35, shutter: mulc(C.bronze, 0.8), ...lights }),
      grand: townMaterial({ time: tU, glow: HR.glow * 0.5, skyGlow: 0.5, gain: HR.gain * 0.85, winC: [0.3, 0.55, 1.9], lit: HR.lit, litT: HR.litT, litWarm: [1.2, 0.8, 0.4], lamp: 2.4 }),
      grandM: townMaterial({ time: tU, movers: true, glow: HR.glow * 0.5, skyGlow: 0.5, gain: HR.gain * 0.85, lamp: 2.4, side: THREE.DoubleSide }),
      town: townMaterial({ time: tU, glow: HR.glow, skyGlow: 0.7, gain: HR.gain, winC: [0.3, 0.55, 1.9], lit: HR.lit, litT: HR.litT, litWarm: [1.2, 0.8, 0.4], lamp: 3 }),
      townM: townMaterial({ time: tU, movers: true, glow: HR.glow, skyGlow: 0.7, gain: HR.gain, lamp: 3, side: THREE.DoubleSide }),
      grey: townMaterial(greyO),
      // (polish round 1) the hall's own material for what moves in it: the pendulum, the hanging lamps
      hallM: townMaterial({ time: tU, movers: true, glow: 0, fill: HR.hall, lamp: HR.lamp, pane: HR.pane, wet: 0.25, side: THREE.DoubleSide, ...lights }),
      greyM: townMaterial({ time: tU, movers: true, glow: 0, lit: [2.4, 1.7, 0.8], lamp: 3, side: THREE.DoubleSide, ...doorL }),
      // (p1m1, O4) the far chimneys' smoke: the movers' own material made thin (a third there), writing no depth
      smoke: Object.assign(townMaterial({ time: tU, movers: true, glow: 0 }), { transparent: true, opacity: 0.32, depthWrite: false }),
      proxy: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    };
    await ctx.yield();
    const crys = { light: sunDir, lightColor: [lightC.r, lightC.g, lightC.b], sky: mulc(HR.pane, night ? 3 : 1.5), lamp: C.gold, sun: HR.sun, time: tU };
    mats.crystalF = crystalMaterial(crys); mats.crystalB = crystalMaterial({ ...crys, back: true, veil: [0.05, 0.3, 0.3, 0.05] });
    // the great globe's crystal is clear in its middle from both sides: a thin line of light at its rim, sharp glints
    mats.greatF = crystalMaterial({ ...crys, thin: 1 }); mats.greatB = crystalMaterial({ ...crys, back: true, thin: 1, ice: HR.ice, veil: [HR.veil, 0.5, 0.1, 0.015] });
    const add = (m) => { scene.add(m); return m; };
    await ctx.yield();
    // ------------------------------------------------------------ the route
    // 1 the approach: 60 m level over the roofs, down over the stair, level in under the porch through the door
    const knots = [[ENTRY[0], ENTRY[1], ENTRY[2]], [0, 57.7, 135], [0, 57, 105], [0, 45.5, 68], [0, 32.5, 34], [0, EYE + 1, 8]];
    // 2 the gallery: straight down its axis through the middle of every arch, all but level: abeam of a room's globe
    //   the eye is over the ball's middle by a fifth of its radius, and never more than DIP (1.2 m) under the arches'
    //   level (so the line does not nod from room to room)
    for (const g of rooms) { knots.push([0, Math.max(g.hs + g.r * 1.2, EYE - DIP), g.z]); if (g.i < nRooms - 1) knots.push([0, EYE, -(g.i + 1) * RL]); }
    // 3 the rotunda, in plan (X, Z metres from the globe's axis; the last arch is at Z = HALL.RW): straight on to the
    //   dome's foot, a swing of radius 100 to one hand through hookA, one arc back that ends on a straight 64 m long to
    //   the globe's axis: the way in goes on along that straight.
    const RK = (X, Z, y) => [X, y, zG + Z], Ra = 100, Ls = 64, Z0 = HALL.RW, Z1 = HALL.RR, S0 = Z0 - Z1;
    const P1 = [hook * Ra * (1 - Math.cos(hookA)), Z1 - Ra * Math.sin(hookA)], nB = [-hook * Math.cos(hookA), -Math.sin(hookA)];
    const Rb = (P1[0] * P1[0] + P1[1] * P1[1] - Ls * Ls) / (-2 * (P1[0] * nB[0] + P1[1] * nB[1])), Cb = [P1[0] + Rb * nB[0], P1[1] + Rb * nB[1]], cb2 = Cb[0] * Cb[0] + Cb[1] * Cb[1];
    const th1 = Math.atan2(P1[1] - Cb[1], P1[0] - Cb[0]), sgn = Math.sign((P1[0] - Cb[0]) * -Math.cos(hookA) - (P1[1] - Cb[1]) * hook * Math.sin(hookA));
    // the arc's end: the point of its circle from which the straight to the axis leaves along the arc's own heading
    let Tt = null; for (const s2 of [-1, 1]) { const q = [Cb[0] * Ls * Ls / cb2 - s2 * Cb[1] * Ls * Rb / cb2, Cb[1] * Ls * Ls / cb2 + s2 * Cb[0] * Ls * Rb / cb2], tx = -sgn * (q[1] - Cb[1]), tz = sgn * (q[0] - Cb[0]); if (tx * -q[0] + tz * -q[1] > 0) Tt = q; }
    const thT = Math.atan2(Tt[1] - Cb[1], Tt[0] - Cb[0]), sw = sgn * ((((thT - th1) * sgn) % TAU + TAU) % TAU), SA = Ra * hookA, SB = Rb * Math.abs(sw), SO = S0 + SA + SB + Ls;
    const eW = [-Tt[0] / Ls, -Tt[1] / Ls];
    const hookAt = (m) => {
      if (m <= S0) return [0, Z0 - m];
      if (m <= S0 + SA) { const t = (m - S0) / Ra; return [hook * Ra * (1 - Math.cos(t)), Z1 - Ra * Math.sin(t)]; }
      if (m <= S0 + SA + SB) { const th = th1 + sw * (m - S0 - SA) / SB; return [Cb[0] + Rb * Math.cos(th), Cb[1] + Rb * Math.sin(th)]; }
      const t = m - S0 - SA - SB; return [Tt[0] + eW[0] * t, Tt[1] + eW[1] * t];
    };
    //   in height: level out through the last arch, and from that arch a climb that eases in over 40 m to one slope, then one vertical arc of
    //   radius 30 over the top into the way's own dive, which begins INSIDE.lead metres before the crown's ring. The
    //   one unknown, the climb's slope, is found so that the heights meet.
    const yL = EYE, mL = 0, Rv = 30, Le = 40, kD = INSIDE_E[2], aD = Math.atan(kD), mD = SO - INSIDE_E[3], yD0 = G.y + INSIDE_E[4];
    const climbGap = (al) => yL + Math.tan(al) * (mD - Rv * (Math.sin(al) + Math.sin(aD)) - mL - Le / 2) - yD0 - Rv * (Math.cos(al) - Math.cos(aD));
    let al0 = 0.02, al1 = 1.0; for (let i = 0; i < 50; i++) { const am = (al0 + al1) / 2; if (climbGap(am) < 0) al0 = am; else al1 = am; }
    const aC = (al0 + al1) / 2, m1 = mD - Rv * (Math.sin(aC) + Math.sin(aD)), y1 = yD0 + Rv * (Math.cos(aC) - Math.cos(aD));
    const yHook = (m) => {
      const q = m - mL; if (q <= Le) return yL + Math.tan(aC) * q * q / (2 * Le);
      if (m <= m1) return yL + Math.tan(aC) * (q - Le / 2);
      const sn = clamp(Math.sin(aC) - (m - m1) / Rv, -1, 1); return y1 + Rv * (Math.sqrt(1 - sn * sn) - Math.cos(aC));
    };
    const nK = Math.round((mD - 5) / 10);
    for (let i = 0; i <= nK; i++) { const m = (mD - 5) * i / nK, q = hookAt(m); knots.push(RK(q[0], q[1], yHook(m))); }
    // 4 inside the great globe: the part file's own way (the dive through the ring's middle, the pull-out, the turn
    //   round the harbour, the avenue), turned so that its first heading is the hook's last
    const cityYaw = Math.atan2(INSIDE_E[1], INSIDE_E[0]) - Math.atan2(eW[1], eW[0]);
    await ctx.yield();
    const hero = await buildHero(ctx, { rng: R.hero, density, yaw: cityYaw, mats, more: OWN });
    hero.object.position.set(0, heroY, zG);
    scene.add(hero.object);
    const hW = (p) => [p[0], p[1] + heroY, p[2] + zG];
    { const wy = hero.anchors.way; wy.forEach((p, i) => { if (i % 4 === 0 || i === wy.length - 1) knots.push(hW(p)); }); }
    await ctx.yield();
    const path = makePath(knots, { samples: 480 }), Lr = path.length, uM = (m) => clamp(m / Lr, 0, 1);
    await ctx.yield();
    // the route sampled every 2 m (and 60 m behind the entry, level, for the eye that looks in through the ring before)
    const _v = new THREE.Vector3(), line = [];
    for (let m = -60; m <= Lr; m += 2) { path.posAtDist(m, _v); line.push([_v.x, _v.y, _v.z, m]); }
    const gapTo = (x, y, z) => { let b = 1e9; for (const p of line) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2 + (p[2] - z) ** 2; if (d < b) b = d; } return Math.sqrt(b); };
    // the least distance from the route to an upright box (plan half sizes hx, hz about (x, z), from y0 to y1)
    const gapBox = (x, z, hx, hz, y0, y1) => { let b = 1e9; for (const p of line) { const dx = Math.max(0, Math.abs(p[0] - x) - hx), dz = Math.max(0, Math.abs(p[2] - z) - hz), dy = Math.max(0, y0 - p[1], p[1] - y1), d = dx * dx + dy * dy + dz * dz; if (d < b) b = d; } return Math.sqrt(b); };
    const mAt = (x, y, z) => { let b = 1e9, bm = 0; for (const p of line) { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2 + (p[2] - z) ** 2; if (d < b) { b = d; bm = p[3]; } } return bm; };
    // the metre at which the route first answers a test of its place (a sill crossed, a rail passed), found on the line
    const mWhere = (fn) => { for (let i = 1; i < line.length; i++) if (line[i][3] > 0 && fn(line[i])) return line[i][3]; return Lr; };
    const LANE = 6, counts = { lane: LANE, least: {}, dropped: {} };
    const note = (kind, d) => { counts.least[kind] = Math.min(counts.least[kind] ?? 1e9, d); };
    const drop = (kind) => { counts.dropped[kind] = (counts.dropped[kind] || 0) + 1; };
    await ctx.yield();
    // ------------------------------------------------------------ the grey city
    // A plateau of streets (y = 18) from the stair's head back for 544 m, and the lower town (y = 0) round the
    // building. THE PLAN: rows of houses along the tram street. On the street's own axis stands the OLD ROW, the
    // city's first houses, which the viaduct was later carried over: low (eaves at 10 to 13 m), pitched roofs only,
    // on the plateau only, from behind the viaduct back. A row stands either side of it at 31 m, and further rows
    // every 46 m; along a row a house every 50 m on the plateau and every 46 m in the lower town. No house stands in
    // the building's place, the forecourt or the stair. Every house keeps the law's clearance (LANE) and one nearer is
    // left out. Smoke rises, in three small puffs, from the first chimney of 35 in 100 of the houses (by each lot's
    // own draw; none from the old row) whose measure "far" is over 0 and under 260 m: far is a house's metres beyond
    // 60 m from the street's axis plus 0.4 of its metres behind z = -100 (so beside the street and the building it is
    // the houses 60 to 320 m from the axis, and fewer further back).
    const grey = [new Geo({ cap: 1 << 15 }), new Geo({ cap: 1 << 14 }), new Geo({ cap: 1 << 14 })], greyM = new Geo({ movers: true, cap: 1 << 15 }), shade = new Geo({ cap: 1 << 14 });
    const stone = (r, k = 1) => { const t = r.range(0.72, 1.08) * HR.grey * k, w = r.range(-0.02, 0.02); return [C.stone[0] * t + w, C.stone[1] * t, C.stone[2] * t - w]; };
    const VZ = STAIR[0] + 47, vy = STREET + 24;
    // (p1m1, R4 R5) THE PLAN OF WHAT STANDS, kept as boxes [x0, x1, z0, z1] while it is built: BOXES the walls of
    // every house that stands and the two depots (a kerb lamp is tested by these, padded 1.5 m); THINGS all a
    // walker may not walk through (the same with their cornices, the colonnades, the lamps' posts, the porch's
    // plinths, the front wall, the stair's cheek walls). hits(L, x, z, pad): does the place lie in a box of L?
    const BOXES = [], THINGS = [], hits = (L, x, z, pad) => L.some((b) => x > b[0] - pad && x < b[1] + pad && z > b[2] - pad && z < b[3] + pad);
    const boxAt = (L, x, z, hx, hz) => L.push([x - hx, x + hx, z - hz, z + hz]);
    // (polish round 1) the pools of the evening's street lamps: each [middle, half axis, half axis, colour, 0], laid
    // with the rooms' own pools further down, their phases from a stream of their own
    const evePools = [];
    {
      const g = grey[0], gr = R.grey;
      // the lower town's ground, open where the building stands (its gallery's floor and the rotunda's well are its own)
      g.set(mulc(C.stone, 0.5 * HR.grey), PAT.PAVE);
      const BQ = 186, zq0 = zG + BQ, zq1 = zG - BQ;
      for (const [xa, xb, za, zb] of [[-1300, 1300, 600, 0], [-1300, -52, 0, zq0], [52, 1300, 0, zq0], [-1300, -BQ, zq0, zq1], [BQ, 1300, zq0, zq1], [-1300, 1300, zq1, -1500]]) g.quad([xa, 0, za], [xb, 0, za], [xb, 0, zb], [xa, 0, zb], xa, za, xb, zb);
      g.lathe(0, -0.3, zG, [[264, 0], [173, 0]], 48, { cap: false });
      g.set(mulc(C.stone, 0.62 * HR.grey), PAT.STONE).box(0, 0, STAIR[0] + 272, 2600, STREET, 544, { top: false });
      g.set(mulc(C.stone, 0.55 * HR.grey), PAT.PAVE).quad([-1300, STREET, 604], [1300, STREET, 604], [1300, STREET, STAIR[0]], [-1300, STREET, STAIR[0]], -1300, 604, 1300, STAIR[0]);
      // the broad stair: eighteen steps down to the forecourt, cheek walls with lamp standards
      const run = (STAIR[0] - STAIR[1]) / STREET;
      for (let k = 0; k < STREET; k++) g.set(mulc(C.stone, (0.86 + 0.06 * (k % 2)) * HR.grey), PAT.STONE).box(0, 0, STAIR[0] - (k + 0.5) * run, 72, STREET - k - 1 + 0.01, run, {});
      for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) {
        const z = STAIR[0] - (k + 0.5) * 12, y = STREET - k * 6;
        g.set(mulc(C.stone, 0.7 * HR.grey), PAT.STONE).box(sg * 40, 0, z, 8, y + 2, 12, {}).box(sg * 40, y + 2, z, 9, 0.8, 13, { bot: true });
        lampInto(g, sg * 40, y + 2.8, z, 9, { k: 1.5 });
      }
      await ctx.yield();
      // the houses: every lot's draws are made before it is tested against the building, the forecourt and the lane
      // (the forecourt's and the stair's place is padded by a lot's reach on every side, the stair's head too: no
      // lot of the lower row reaches into the stair or the forecourt; one that would is left out after its draws)
      const lot = 46, inPlace = (x, z, rr) => (Math.abs(x) < 64 + rr && z > -8 - rr && z < STAIR[0] + rr) || (Math.abs(x) < 72 + rr && z < 8 + rr && z > -Lg - 12 - rr) || (Math.abs(x) < 142 + rr && z < 22 + rr && z > -84 - rr) || Math.hypot(x, z - zG) < 190 + rr;
      // THE NEAR ROOFS ARE WORKED ROOFS (polish round 1; by the plan since p1m1, R1, never by the line): the lots of
      // the two columns either side of the forecourt's axis (gx -2 to 2) in the rows WORK[0] to WORK[1], and the old
      // row on the axis, the same lots on every seed. Such a house has dormers with a window each (lit by the hour's
      // share, the lot's own draw),
      // a ridge of lead, gutters at its eaves, a corniced stack with two pots on every chimney, and on some gabled
      // roofs a sweep's cat-walk under the ridge with its rail; a flat roof has a stair hut. All of it lies within
      // 1.3 m of the box the house was tested by (its ridge and 6 m over it); its own clearance is counted by the
      // eaves' box, 1.3 m wider on every side (counts.least.workedRoof). The draws are the lot's own stream's.
      const WORK = [1, 7], roofOut = { dormers: 0, huts: 0, walkOther: 0, walkShort: 0 }, dormLit = clamp(0.5 - 0.6 * HR.cityLit, 0.25, 1), pot = mulc([0.42, 0.2, 0.12], HR.grey), lead = mulc([0.5, 0.53, 0.58], HR.grey);
      const workRoof = (g, wr, x, y, z, w, d, rk, roofH, wc, stacks) => {
        const hz = d / 2 + 0.9, yAt = (dz) => y + roofH * (1 - Math.abs(dz) / hz), side0 = wr.chance(0.5) ? 1 : -1, walk = wr.chance(0.55), hut = [wr.range(-0.25, 0.25), wr.range(-0.2, 0.2)];
        for (const [px, pz, top] of stacks) {
          g.set(mulc(wc, 0.62), PAT.STONE).box(px, top - 0.5, pz, 3.3, 0.5, 3.3, {});
          for (const dx of [-0.62, 0.62]) g.set(pot, PAT.PLAIN).cyl(px + dx, top, pz, 0.36, 0.28, 1.15, 5, { cap: false });
        }
        if (rk === 2) {
          // the flat roof's stair hut and the rail of its walk
          const hx = x + hut[0] * w, hz2 = z + hut[1] * d;
          // (p1m1, R7) a hut keeps clear of every stack (3.9 m between their middles, so 3.5 m and the eaves' and the
          // cap's reach), its rail too; one that would not is left out, after its draws
          if (stacks.some(([px, pz]) => Math.max(Math.abs(px - hx), Math.abs(pz - hz2)) < 3.9 || (Math.abs(px - hx) < 6.3 && Math.abs(pz - hz2 - 3) < 1.9))) { roofOut.huts++; return; }
          // (p1m3, M3) HUT AND RAIL STAND ON THE ROOF THEY ARE ON. The "flat" roof is a low hip to one point: roofH at
          // its middle, nothing at its eaves' edge (half sizes w / 2 + 0.8 and d / 2 + 0.8); yR is its height at a
          // place. The hut's walls begin at the eaves' height inside the hip (the same box carried down) and end
          // 2.6 m over the roof under the hut's middle, the hut's own roof on them. The rail is a sheet 1.1 m high
          // whose foot lies on the roof (0.04 m in it): along its 9 m the hip is level between its two creases and
          // falls beyond them, so the sheet is laid in one, two or three lengths, parted at the creases it crosses,
          // each a face to either hand. The same draws; the test against the stacks above is the old one.
          const kx = w / 2 + 0.8, kz = d / 2 + 0.8, yR = (px, pz) => y + roofH * (1 - Math.max(Math.abs(px - x) / kx, Math.abs(pz - z) / kz)), yh = yR(hx, hz2) + 2.6;
          g.set(mulc(wc, 0.8), PAT.STONE).box(hx, y, hz2, 3.4, yh - y, 3, { top: false }); g.set(lead, PAT.SLATE).hip(hx, yh, hz2, 3.9, 3.5, 0.9, {});
          const zr = hz2 + 3, xk = kx * Math.abs(zr - z) / kz, xs = [hx - 4.5, ...[x - xk, x + xk].filter((q) => q > hx - 4.45 && q < hx + 4.45), hx + 4.5];
          g.set(mulc(C.iron, 0.9), PAT.PLAIN);
          for (let i = 0; i + 1 < xs.length; i++) { const a = xs[i], b = xs[i + 1], ya = yR(a, zr) - 0.04, yb = yR(b, zr) - 0.04;
            g.quad([a, ya, zr + 0.06], [b, yb, zr + 0.06], [b, yb + 1.1, zr + 0.06], [a, ya + 1.1, zr + 0.06], 0, 0, b - a, 1.1).quad([b, yb, zr - 0.06], [a, ya, zr - 0.06], [a, ya + 1.1, zr - 0.06], [b, yb + 1.1, zr - 0.06], 0, 0, b - a, 1.1); }
          return;
        }
        // dormers on the two slopes that look along the street (a gable's two slopes; a hip's two faces)
        const nd = rk === 0 ? Math.max(1, Math.floor(w / 9)) : 1, f = rk === 0 ? 0.44 : 0.3;
        for (const s of [1, -1]) for (let i = 0; i < nd; i++) {
          const lit = wr() < dormLit, warm = wr.range(0.16, 0.3), dx = x + (i - (nd - 1) / 2) * (w / nd) + wr.range(-0.5, 0.5);
          // (p1m1, R7) a dormer within 2.65 m of a stack in x, on the stack's slope, is left out after its draws
          if (stacks.some(([px, pz]) => Math.abs(px - dx) < 2.65 && s * (pz - z) > -1.65)) { roofOut.dormers++; continue; }
          const zf = z + s * hz * (1 - f) + s * 1.2, yb = yAt(zf - z), yT = yb + 2.3, zr = z + s * hz * (1 - (yT - y) / roofH), a = dx - s * 1.35, b = dx + s * 1.35;
          g.set(mulc(wc, 0.9), PAT.STONE).quad([a, yb, zf], [b, yb, zf], [b, yT, zf], [a, yT, zf], 0, 0, 2.7, 2.3);
          g.set(lit ? mulc(C.gold, warm) : [0.03, 0.035, 0.05], lit ? PAT.LIGHT : PAT.PLAIN).quad([a + s * 0.45, yb + 0.5, zf + s * 0.04], [b - s * 0.45, yb + 0.5, zf + s * 0.04], [b - s * 0.45, yT - 0.35, zf + s * 0.04], [a + s * 0.45, yT - 0.35, zf + s * 0.04]);
          g.set(mulc(wc, 0.8), PAT.STONE).quad([b, yb, zf], [b, yT, zr], [b, yT, zr], [b, yT, zf], 0, 0, 1, 1).quad([a, yb, zf], [a, yT, zf], [a, yT, zr], [a, yT, zr], 0, 0, 1, 1);
          g.set(lead, PAT.SLATE).quad([a - s * 0.25, yT, zf + s * 0.3], [b + s * 0.25, yT, zf + s * 0.3], [b + s * 0.25, yT + 0.12, zr], [a - s * 0.25, yT + 0.12, zr], 0, 0, 3.2, 3);
        }
        if (rk === 0) {
          g.set(lead, PAT.PLAIN).box(x, y + roofH - 0.14, z, w + 1.7, 0.42, 0.56, {});
          for (const s of [1, -1]) g.set(mulc(C.iron, 0.8), PAT.PLAIN).box(x, y - 0.3, z + s * (hz + 0.1), w + 1.9, 0.34, 0.42, {});
          if (walk) {
            // (p1m1, R7) the cat-walk lies on the slope that has no stack in its band; where the stacks stand on the
            // ridge itself (in both bands) it stops 0.6 m short of each stack's cap
            const hit = (sd) => stacks.some(([, pz]) => Math.abs(pz - z - sd * 1.7) < 2.4), sd = !hit(side0) ? side0 : !hit(-side0) ? -side0 : side0;
            let xa = x - w * 0.37, xb = x + w * 0.37; if (hit(sd)) for (const [px] of stacks) { if (px > x) xb = Math.min(xb, px - 2.25); else xa = Math.max(xa, px + 2.25); }
            if (sd !== side0) roofOut.walkOther++; else if (hit(sd)) roofOut.walkShort++;
            const zc = z + sd * 1.7, yc = yAt(1.7) + 0.22, xm = (xa + xb) / 2;
            g.set(mulc(C.wood, 1.6), PAT.WOOD).box(xm, yc, zc, xb - xa, 0.12, 0.95, {}); g.set(mulc(C.iron, 0.9), PAT.PLAIN).box(xm, yc + 1.05, zc + sd * 0.45, xb - xa, 0.09, 0.09, {}); for (const xe of [xa, xm, xb]) g.box(xe, yc, zc + sd * 0.45, 0.1, 1.1, 0.1, { top: false }); }
        } else g.set(lead, PAT.PLAIN).cyl(x, y + roofH - 0.3, z, 0.5, 0.12, 1.6, 4, { cap: false });
      };
      let nH = 0, nW = 0;
      for (let gx = -9; gx <= 9; gx++) for (let gz = -16; gz <= 11; gz++) {
        const up = gz >= 2, old = gx === 0, x = old ? gr.range(-2, 2) : Math.sign(gx) * (31 + (Math.abs(gx) - 1) * lot) + gr.range(-2, 2), z = (up ? STAIR[0] + 22 + (gz - 2) * 50 : 61 + (gz - 1) * lot) + gr.range(-3, 3), y0 = up ? STREET : 0;
        const far = Math.max(Math.abs(x) - 60, 0) + Math.max(0, -z - 100) * 0.4, w = gr.range(24, 32), d = gr.range(24, 32), hh = gr.range(19, 27) + gr.range(0, 18) * smoothstep(40, 200, far), kind = gr.pick([0, 0, 1, 1, 2]), wc = stone(gr), ch = gr.int(1, 2), tall = gr.chance(0.12) && far > 150, smoke = gr.chance(0.35), ph = gr(), sp = gr.range(5, 8), cx = gr.range(-0.3, 0.3), col = gr.chance(0.4), u0 = gr.range(0, 30), sl = gr.range(0.8, 1.15);
        // the old row on the street's axis: low eaves, no flat roofs; it stands on the plateau, behind the viaduct
        const h = old ? 10 + (hh - 19) * 0.4 : hh, rk = old && kind === 2 ? 0 : kind, rr = Math.max(w, d) / 2;
        if (old && (!up || z < VZ + 12 + rr)) continue;
        if (inPlace(x, z, rr)) continue;
        const roofH = rk === 2 ? 2 : Math.min(old ? 7.5 : 99, Math.min(w, d) * (rk ? 0.34 : 0.4)), top = y0 + h + roofH + 6;
        if (gapBox(x, z, w / 2, d / 2, y0, top) < LANE) { drop('greyHouse'); continue; }
        note('greyHouse', gapBox(x, z, w / 2, d / 2, y0, top));
        const g2 = grey[z > 0 ? 0 : x < 0 ? 1 : 2]; nH++;
        boxAt(BOXES, x, z, w / 2, d / 2); boxAt(THINGS, x, z, w / 2 + 0.8, d / 2 + 0.8); if (col && Math.abs(gx) === 1 && up) boxAt(THINGS, x - Math.sign(gx) * (w / 2 + 2.2), z, 1.5, d / 2);
        g2.set(wc, PAT.WALL).box(x, y0, z, w, h, d, { top: false, u0 });
        g2.set(mulc(wc, 0.8), PAT.STONE).box(x, y0, z, w + 1.2, 3.2, d + 1.2, {}).box(x, y0 + h - 1.4, z, w + 1.6, 1.4, d + 1.6, { bot: true, top: rk === 0 });
        // the roof: slates in courses (the ROOF pattern: eave, ridge, weather, soot, skylights); a "flat" roof is a
        // low lead-ridged hip of 2 m inside its cornice
        g2.set(mulc(C.slate, HR.grey * sl), PAT.ROOF);
        if (rk === 0) g2.gable(x, y0 + h, z, w, d, roofH, { eave: 0.9, end: [wc, PAT.STONE], code: true }); else if (rk === 1) g2.hip(x, y0 + h, z, w + 1.8, d + 1.8, roofH, { code: true }); else g2.hip(x, y0 + h, z, w + 1.6, d + 1.6, 2, { code: true });
        const stacks = [];
        for (let c = 0; c < ch; c++) { const px = x + (c ? -1 : 1) * w * 0.28, pz = z + cx * d; stacks.push([px, pz, y0 + h + roofH + 4.5]); g2.set(mulc(wc, 0.7), PAT.STONE).box(px, y0 + h, pz, 2.6, roofH + 4.5, 2.6, {}); if (smoke && !old && c === 0 && far > 0 && far < 260) for (let q = 0; q < 3; q++) { LAWS.puffOn(greyM, [px, y0 + h + roofH + 5.5, pz], 15, (ph + q / 3) % 1, 1 / sp, [3 * sunHand, 1.5]); BODIES.blobBody(greyM, mulc(C.pearl, 0.62 * HR.grey), 1.6, true); greyM.move(null); } }
        if (tall) { g2.set(wc, PAT.WALL).box(x, y0 + h, z, w * 0.36, h * 0.9, w * 0.36, { top: false }); g2.set(mulc(C.slate, HR.grey), PAT.ROOF).hip(x, y0 + h * 1.9, z, w * 0.4, w * 0.4, h * 0.7, { code: true }); }
        if (col && Math.abs(gx) === 1 && up) { const sx = x - Math.sign(gx) * (w / 2 + 2.2); for (let c = 0; c < 6; c++) g2.set(mulc(C.stone, 1.05 * HR.grey), PAT.PLAIN).cyl(sx, y0, z - d / 2 + 1.5 + (d - 3) * c / 5, 1.1, 0.95, 10.5, 8, { cap: false }); g2.set(mulc(C.stone, 0.95 * HR.grey), PAT.STONE).box(sx, y0 + 10.5, z, 3, 1.8, d, { bot: true }); }
        if (old || (Math.abs(gx) <= 2 && gz >= WORK[0] && gz <= WORK[1])) { note('workedRoof', gapBox(x, z, w / 2 + 1.3, d / 2 + 1.3, y0, top)); workRoof(g2, OWN('roof' + gx + ',' + gz), x, y0 + h, z, w, d, rk, roofH, wc, stacks); nW++; }
        shade.box(x, y0, z, w * 0.96, h + roofH * 0.5, d * 0.96, {});
        if (nH % 20 === 0) await ctx.yield();
      }
      counts.greyHouses = nH; counts.workedRoofs = nW; counts.roofOut = roofOut;
    }
    await ctx.yield();
    {
      const g = grey[0];
      // the viaduct across the street under the first metres, and the seven trams of lit windows that go to and fro on
      // it at even sevenths of one round (so at every clock one of them is within 51 m of the street's middle); a
      // tram shed over each end of the round, where the trams turn
      const TA = 200;
      g.set(mulc(C.stone, 0.78 * HR.grey), PAT.STONE).box(0, vy, VZ, 900, 2.6, 9.5, { bot: true });
      for (const sg of [-1, 1]) g.box(0, vy + 2.6, VZ + sg * 4.4, 900, 1.5, 0.7, {});
      g.set(mulc(C.iron, 0.9), PAT.PLAIN); for (const sg of [-1, 1]) for (const tt of [-1, 1]) g.box(0, vy + 2.6, VZ + sg * 1.7 + tt * 0.75, 900, 0.16, 0.22, { bot: false });
      g.set(mulc(C.stone, 0.78 * HR.grey), PAT.STONE);
      for (let x = -442; x <= 442; x += 34) if (Math.abs(x) > 14) { g.box(x, STREET, VZ, 7, 24, 8.5, { top: false }); g.box(x, vy - 4.2, VZ, 16, 4.2, 8.5, { top: false, bot: true }); }
      // a tram depot over each end of the round, on a stone base as high as the deck: each car turns inside it
      for (const sg of [-1, 1]) { boxAt(BOXES, sg * (TA + 6), VZ, 20, 12); boxAt(THINGS, sg * (TA + 6), VZ, 20, 12); }
      for (const sg of [-1, 1]) { g.set(mulc(C.stone, 0.7 * HR.grey), PAT.STONE).box(sg * (TA + 6), STREET, VZ, 40, vy + 2.6 - STREET, 24, {}); g.set(mulc(C.iron, 1.1), PAT.IRON).box(sg * (TA + 6), vy + 2.6, VZ, 38, 8, 22, { skip: [sg > 0 ? 3 : 1] }); g.set(mulc(C.slate, HR.grey), PAT.SLATE).gable(sg * (TA + 6), vy + 10.6, VZ, 39, 23, 5, {}); }
      const tr = R.tram, tph = tr(), tT = tr.range(64, 84), dph = 15.4 / (TAU * TA);
      for (let k = 0; k < 7; k++) for (const half of [-0.5, 0.5]) {
        LAWS.loopOn(greyM, [0, vy + 2.6, VZ], [TA, 0], [0, 1.7], (tph + k / 7 + half * dph + 1) % 1, 1 / tT);
        greyM.set(mulc(C.iron, 1.2), PAT.IRON).box(0, 0.5, 0, 14, 3.3, 2.9, { bot: true }); greyM.set(mulc(C.gold, 0.14 + 0.1 * HR.lamp), PAT.LIGHT).box(0, 1.9, 0, 12.4, 1.1, 3.0, { top: false });
        greyM.set(mulc(C.iron, 1.2), PAT.IRON); for (let q = -2; q <= 2; q++) greyM.box(q * 2.2, 1.9, 0, 0.5, 1.1, 3.12, { top: false, bot: false });
        greyM.move(null);
      }
      note('tram', gapBox(0, VZ, TA + 9, 9, vy + 2.6, vy + 6.4));
      // the square at the stair's head: a round stone basin whose jets play on the clock, lamp standards round it
      const fz = STAIR[0] + 20, fr = 8.5, fo = R.roofs;
      g.set(mulc(C.stone, 0.92 * HR.grey), PAT.STONE).lathe(0, STREET, fz, [[fr + 1.4, 0], [fr + 1.4, 1.5], [fr, 1.5], [fr, 0.9]], 24, { cap: false }).lathe(0, STREET, fz, [[2.2, 0.9], [1.6, 4.4], [2.6, 4.8], [0, 5.6]], 10, {});
      g.set(mulc([0.34, 0.42, 0.5], HR.grey), PAT.WATER).disc(0, STREET + 1.2, fz, fr, 24);
      for (let i = 0; i < 12; i++) { const a = TAU * i / 12; LAWS.puffOn(greyM, [0, STREET + 5.8, fz], 4.6, fo(), 1 / fo.range(1.5, 2.1), [Math.cos(a) * 5.4, Math.sin(a) * 5.4]); BODIES.blobBody(greyM, mulc(C.pearl, 1.05), 0.8); greyM.move(null); }
      for (let i = 0; i < 8; i++) { const a = TAU * (i + 0.5) / 8; lampInto(g, Math.cos(a) * 17, STREET, fz + Math.sin(a) * 17, 7.5, { k: 1.2 }); }
    }
    await ctx.yield();
    // ------------------------------------------------------------ THE CITY BEYOND, BY ITS OWN PLAN (polish round 1)
    // The metal building stands in the hollow of a great grey city. Round the old quarter (the rows above, inside
    // |x| <= QX and z from QZ0 to QZ1) the city climbs away on every side in TIERS, the same on every bearing: tier k
    // is a street TIER m deep that lies from TIER (k - 1) to TIER k metres outside the quarter's rectangle and stands
    // RISE k metres high; its retaining wall toward the hollow is the fronts of the houses of the street below it
    // (windows, some lit). Along every tier's edge stands a row of houses under pitched slate roofs, each a block of
    // 86 m and more of frontage (longer the further out), every one of its own height, depth and stone; one lot in
    // twelve holds a landmark instead: a church tower under a spire, a dome on a drum, a plain bell tower, or a tall
    // works chimney that smokes in the evening's one wind. The plan is the place's: it reads the quarter's rectangle
    // and nothing else, stands the same from anywhere, and runs out until the evening air takes it (the last tier
    // lies 1.3 km and more beyond the quarter). Every draw of a lot is made before anything is built on it.
    // (p1m1, O3) at night the far tiers' slate is darker (0.28 of the evening's), so that no moonlit slope out there
    // stands as a pale band: no roof reads as snowy. (p1m2, O3) and the far tiers' stone and pavement stand dark with
    // it at night (0.22 of the evening's: the slate's own darkness), so that a far tier reads by its lit windows and lamps
    const QX = 440, QZ0 = -760, QZ1 = 610, TIER = 100, RISE = 24, NT = 14, wind = [3 * sunHand, 1.5], farSlate = night ? 0.28 : 1, farStone = night ? 0.22 : 1;
    {
      const far = new Geo({ cap: 1 << 14 }), farSmoke = new Geo({ movers: true, cap: 1 << 11 }), tr = OWN('tiers'), lm = OWN('landmarks'); let nB = 0, nL = 0;
      const tri3 = (g, a, b, c, n) => { const i = g.v(a[0], a[1], a[2], n[0], 0, n[1], 0, 0); g.v(b[0], b[1], b[2], n[0], 0, n[1], 8, 0); g.v(c[0], c[1], c[2], n[0], 0, n[1], 4, 6); g.tri(i, i + 1, i + 2); };
      // a landmark through its block's roof (lh, lq: its two own measures; none carries a clock's face, a sign or a name)
      const landmark = (g, kind, c, yt, yaw, lh, lq, wc, ph, sp) => {
        const x = c[0], z = c[2], yb = yt - 2;
        if (kind === 1) {
          // a church tower: square, under a slate spire, a lit lantern's band under the spire's foot
          const s = 9 + 4 * lq, H = 46 + 50 * lh, sh = 28 + 20 * lq;
          g.set(mulc(wc, 0.95), PAT.STONE).box(x, yb, z, s, H, s, { yaw, top: false });
          g.set(mulc(C.gold, 0.2), PAT.LIGHT).box(x, yb + H - 7, z, s + 0.3, 3.4, s + 0.3, { yaw, top: false });
          g.set(mulc(C.slate, HR.grey * farSlate), PAT.ROOF).hip(x, yb + H, z, s + 1.4, s + 1.4, sh, { yaw, code: true });
        } else if (kind === 2) {
          // a dome on a drum of windows, a lit lantern on its crown
          const r = 13 + 6 * lq, H = 14 + 8 * lh;
          g.set(wc, PAT.WALL).cyl(x, yb, z, r, r, H, 7, { cap: false });
          g.set(mulc(C.slate, 1.25 * HR.grey * farSlate), PAT.SLATE).dome(x, yb + H, z, r * 1.04, r * (0.8 + 0.4 * lh), 7, 2);
          g.set(mulc(C.gold, 0.22), PAT.LIGHT).box(x, yb + H + r * (0.8 + 0.4 * lh) - 1, z, 3.2, 4.2, 3.2, { yaw, top: false });
          g.set(mulc(C.slate, HR.grey * farSlate), PAT.SLATE).hip(x, yb + H + r * (0.8 + 0.4 * lh) + 3.2, z, 4.2, 4.2, 4.5, { yaw });
        } else if (kind === 3) {
          // a plain bell tower: slender and square, an open lit belfry under a low roof (no clock on it)
          const s = 6.5 + 2 * lq, H = 60 + 45 * lh;
          g.set(wc, PAT.STONE).box(x, yb, z, s, H, s, { yaw, top: false });
          g.set(mulc(C.gold, 0.18), PAT.LIGHT).box(x, yb + H, z, s - 1.4, 6, s - 1.4, { yaw, top: false });
          g.set(mulc(wc, 0.85), PAT.STONE).box(x, yb + H + 6, z, s + 1.2, 1.4, s + 1.2, { yaw, bot: true });
          g.set(mulc(C.slate, HR.grey * farSlate), PAT.SLATE).hip(x, yb + H + 7.4, z, s + 1.6, s + 1.6, 5 + 3 * lq, { yaw });
        } else {
          // a tall works chimney of stone, banded under its lip, that smokes: soft puffs on the clock, leaning in the wind
          const H = 55 + 40 * lh, r0 = 3.4 + lq, r1 = r0 * 0.6;
          g.set(mulc(wc, 0.8), PAT.STONE).cyl(x, yb, z, r0, r1, H, 6, { cap: false }).cyl(x, yb + H - 4, z, r1 * 1.25, r1 * 1.25, 2.4, 6, { cap: false });
          // (p1m1, O4) soft smoke: four round puffs, each a third there (mats.smoke), that swell, thin and overlap
          for (let q = 0; q < 4; q++) { LAWS.puffOn(farSmoke, [x, yb + H + 2, z], 70, (ph + q / 4) % 1, 1 / (sp * 2), [wind[0] * 9, wind[1] * 9]); BODIES.blobBody(farSmoke, mulc(C.pearl, 0.6 * HR.grey), q % 2 ? 8.5 : 6.5, true); farSmoke.move(null); }
        }
      };
      for (let k = 1; k <= NT; k++) {
        const X0 = QX + TIER * (k - 1), X1 = X0 + TIER, za = QZ0 - TIER * (k - 1), zb = QZ1 + TIER * (k - 1), y0 = RISE * (k - 1), y1 = RISE * k;
        // the tier's street (four strips round the hollow) and its wall of house fronts toward the hollow
        far.set(mulc(C.stone, 0.5 * HR.grey * farStone), PAT.PAVE);
        for (const [xa, xb, zc, zd] of [[-X1, -X0, za - TIER, zb + TIER], [X0, X1, za - TIER, zb + TIER], [-X0, X0, za - TIER, za], [-X0, X0, zb, zb + TIER]]) far.quad([xa, y1, zd], [xb, y1, zd], [xb, y1, zc], [xa, y1, zc], xa, zd, xb, zc);
        far.set(mulc(stone(tr, 0.92), farStone), PAT.WALL);
        far.quad([-X0, y0, zb], [-X0, y0, za], [-X0, y1, za], [-X0, y1, zb], 0, 0, zb - za, RISE).quad([X0, y0, za], [X0, y0, zb], [X0, y1, zb], [X0, y1, za], 0, 0, zb - za, RISE);
        far.quad([-X0, y0, za], [X0, y0, za], [X0, y1, za], [-X0, y1, za], 0, 0, 2 * X0, RISE).quad([X0, y0, zb], [-X0, y0, zb], [-X0, y1, zb], [X0, y1, zb], 0, 0, 2 * X0, RISE);
        // the rows along the tier's edge: each side from its start S along e, the hollow on the hand n
        const L = 70 + 16 * k;
        for (const [S, e, n, len] of [[[-X0, zb], [0, -1], [1, 0], zb - za], [[X0, za], [0, 1], [-1, 0], zb - za], [[-X0, za], [1, 0], [0, 1], 2 * X0], [[X0, zb], [-1, 0], [0, -1], 2 * X0]]) {
          const m = Math.max(1, Math.round(len / L)), sl = len / m;
          for (let j = 0; j < m; j++) {
            const gap = tr.range(3, 10), sb = tr.range(1, 7), dp = tr.range(26, 40), hh = tr.range(14, 30) + (tr.chance(0.3) ? tr.range(6, 16) : 0), wc = mulc(stone(tr), farStone), rs = tr.range(0.8, 1.15), u0 = tr.range(0, 30), kind = lm.chance(1 / 12) ? lm.int(1, 4) : 0, lh = lm.range(0, 1), lq = lm.range(0, 1), ph = lm(), sp = lm.range(7, 11);
            const a = j * sl + gap / 2, b = (j + 1) * sl - gap / 2, rh = Math.min(dp * 0.3, 9), yt = y1 + hh;
            const at = (s, back, y) => [S[0] + e[0] * s - n[0] * (sb + back), y, S[1] + e[1] * s - n[1] * (sb + back)];
            const F0 = at(a, 0, y1), F1 = at(b, 0, y1), F0t = at(a, 0, yt), F1t = at(b, 0, yt), B0 = at(a, dp, y1), B1 = at(b, dp, y1), B0t = at(a, dp, yt), B1t = at(b, dp, yt), R0 = at(a, dp / 2, yt + rh), R1 = at(b, dp / 2, yt + rh);
            far.set(wc, PAT.WALL).quad(F0, F1, F1t, F0t, u0, 0, u0 + b - a, hh).quad(B0, F0, F0t, B0t, 0, 0, dp, hh).quad(F1, B1, B1t, F1t, 0, 0, dp, hh);
            far.set(mulc(wc, 0.9), PAT.STONE); tri3(far, B0t, F0t, R0, [-e[0], -e[1]]); tri3(far, F1t, B1t, R1, e);
            const N = Math.max(1, Math.round(Math.hypot(dp / 2, rh) * 2)), uo = 64 * N + 1;
            far.set(mulc(C.slate, HR.grey * rs * farSlate), PAT.ROOF).quad(F0t, F1t, R1, R0, uo, 0, uo + b - a, N / 2);
            if (y1 < 70) far.quad(B1t, B0t, R0, R1, uo, 0, uo + b - a, N / 2);
            nB++;
            if (kind) { nL++; landmark(far, kind, at((a + b) / 2, dp / 2, 0), yt, Math.atan2(-e[1], e[0]), lh, lq, wc, ph, sp); }
          }
          await ctx.yield();
        }
      }
      // (p1m1) THE VIADUCT'S TWO ABUTMENTS, by the plan: the deck runs 450 m to either hand and the first tier's wall
      // stands at 440 m with its house fronts 1 to 7 m behind it, so the deck's end lay inside those fronts. A stone
      // gate tower stands on the tier's wall at each end (14 m by 18 m, to 12 m over the deck, under a slate hip) and
      // takes the deck in through a dark mouth under a stone lintel; the viaduct's last pier stands inside it
      for (const sg of [-1, 1]) {
        far.set(mulc(C.stone, 0.74 * HR.grey * farStone), PAT.STONE).box(sg * 445, 0, VZ, 14, vy + 12, 18, {}).box(sg * 437.8, vy + 9.6, VZ, 0.7, 1.3, 11.4, {});
        far.set([0.03, 0.035, 0.05], PAT.PLAIN).box(sg * 437.95, vy + 2.6, VZ, 0.12, 7, 9.8, {});
        far.set(mulc(C.slate, HR.grey * farSlate), PAT.SLATE).hip(sg * 445, vy + 12, VZ, 15.6, 19.6, 5, {});
      }
      counts.far = { tiers: NT, blocks: nB, landmarks: nL, triangles: far.triangles };
      // (p1m2, O3) the far city's own material at night: the grey city's, less the moon's mirror light. That shine on
      // the wet slate of the moon's hand was the snow (26 times the slate's matt light there); no colour darkens it
      const farMat = night ? townMaterial(greyO) : mats.grey;
      if (night) { const on = farMat.onBeforeCompile; farMat.onBeforeCompile = (sh) => { on(sh); sh.fragmentShader = sh.fragmentShader.replace('#include <lights_fragment_end>', '#include <lights_fragment_end>\nreflectedLight.directSpecular *= 0.;'); }; farMat.customProgramCacheKey = () => 'bcgg-town-far'; }
      add(meshOf(far, farMat, 'farCity'));
      if (farSmoke.n) add(meshOf(farSmoke, mats.smoke, 'farSmoke', { sphere: [0, 40, 100, 900], receive: false }));
    }
    await ctx.yield();
    // ------------------------------------------------------------ THE EVENING'S STREET LAMPS AND WALKERS (polish
    // round 1). Lamps of a man's measure (a post of 5.6 m, a lantern half a metre square) stand by the plan: down both
    // kerbs of the viaduct's street every 28 m, along the street at the plateau's foot, round the forecourt's two
    // yards, and at the head, the middle and the foot of the stair on its two balustrades. Each has its pool of warm
    // light on the paving. A few walkers, small, plain and faceless, go their standing rounds on the world's clock:
    // across the stair's treads, about the forecourt's yards, round the fountain, along the viaduct's street. None
    // regards the visitor; every one stands 12 m and more under the line.
    {
      const g = grey[0], wk = OWN('walkers'), run = (STAIR[0] - STAIR[1]) / STREET;
      // (p1m1, R5) a lamp whose post would stand within 1.5 m of a house's or a depot's walls is left out with its
      // pool (the pool keeps its place in the list with no size and no light, so every later pool keeps its phase).
      // (R6) A lamp may be given the pool it sheds (the newels': on the stair's own tread).
      let lampsOut = 0;
      const lampStd = (x, y, z, h = 5.6, k = 1, rad = 7, pool = null) => {
        if (hits(BOXES, x, z, 1.5)) { evePools.push([[x, y, z], [0, 0, 0], [0, 0, 0], [0, 0, 0], 0]); lampsOut++; return; }
        boxAt(THINGS, x, z, 0.15 * k, 0.15 * k);
        g.set(mulc(C.iron, 0.9), PAT.PLAIN).box(x, y, z, 0.24 * k, h, 0.24 * k, { tx: 0.6, tz: 0.6, top: false });
        g.set(mulc(C.gold, 0.85), PAT.LIGHT).box(x, y + h, z, 0.5 * k, 0.7 * k, 0.5 * k, { tx: 1.25, tz: 1.25, top: false });
        g.set(mulc(C.iron, 0.8), PAT.PLAIN).hip(x, y + h + 0.7 * k, z, 0.8 * k, 0.8 * k, 0.35 * k, {});
        evePools.push(pool || [[x, y + 0.14, z], [rad, 0, 0], [0, 0, rad], [1, 0.62, 0.24], 0]);
        note('streetLamp', gapTo(x, y + h + k, z) - 0.6 * k);
      };
      for (let x = 20; x <= 400; x += 28) for (const sg of [-1, 1]) for (const dz of [-10, 10]) lampStd(sg * x, STREET, VZ + dz);
      for (let x = 76; x <= 400; x += 36) for (const sg of [-1, 1]) lampStd(sg * x, 0, 38);
      for (const sg of [-1, 1]) for (const z of [50, 36, 22, 8]) lampStd(sg * 58, 0, z);
      // the stair's two balustrades (they part it into three flights; the line goes down the middle one, 13 m and
      // more over them): a stone rail on a baluster to every step, a newel with a lamp at the head, the middle and the foot
      for (const sg of [-1, 1]) {
        const bx = sg * 18;
        g.set(mulc(C.stone, 0.95 * HR.grey), PAT.STONE).tube([[bx, STREET + 1.15, STAIR[0]], [bx, 1.15, STAIR[1]]], 0.2, 4);
        for (let k = 0; k < STREET; k++) g.box(bx, STREET - k - 1, STAIR[0] - (k + 0.5) * run, 0.26, 1.65, 0.26, { top: false });
        for (const k of [0, 9, 17]) { const y = STREET - k - 1, z = STAIR[0] - (k + 0.5) * run + (k === 0 ? 0.8 : k === 17 ? -0.8 : 0); g.set(mulc(C.stone, 0.9 * HR.grey), PAT.STONE).box(bx, y, z, 0.9, 2.3, 0.9, {}); boxAt(THINGS, bx, z, 0.45, 0.45);
          // (p1m1, R6) the newel lamp's pool lies on the tread the newel stands by: 6 m along it, the tread's own depth
          lampStd(bx, y + 2.3, z, 3.4, 1, 3, [[bx, y + 0.14, STAIR[0] - (k + 0.5) * run], [3, 0, 0], [0, 0, run / 2 - 0.05], [1, 0.62, 0.24], 0]); }
        boxAt(THINGS, bx, (STAIR[0] + STAIR[1]) / 2, 0.2, (STAIR[0] - STAIR[1]) / 2);
      }
      note('balustrade', Math.min(gapBox(18, (STAIR[0] + STAIR[1]) / 2, 0.5, 18, 0, STREET + 3), gapBox(-18, (STAIR[0] + STAIR[1]) / 2, 0.5, 18, 0, STREET + 3)));
      await ctx.yield();
      // (p1m1, R4) what else stands on the walkers' ground, by the plan: the front wall with its leaves and pilasters,
      // the wings' walls, the four plinths of the porch's piers, the stair's cheek walls, the fountain's eight lamps
      THINGS.push([-64, 64, -20, 7.85], [-140, 140, -20, -3]);
      for (const sg of [-1, 1]) { for (const px of [35.4, 58]) boxAt(THINGS, sg * px, 15, 4.9, 4.9); boxAt(THINGS, sg * 40, (STAIR[0] + STAIR[1]) / 2, 4.5, (STAIR[0] - STAIR[1]) / 2 + 0.5); }
      for (let i = 0; i < 8; i++) { const a = TAU * (i + 0.5) / 8; boxAt(THINGS, Math.cos(a) * 17, STAIR[0] + 20 + Math.sin(a) * 17, 0.6, 0.6); }
      // a round is free when no place of it (every half metre of it) lies within 1 m of a thing (the body's reach of
      // 0.4 m and 0.6 m more); a round is first laid on free ground by the plan, and one that is still not free is
      // left out AFTER its draws
      const freeRound = (c, A, B) => { const n = Math.max(48, Math.ceil(8 * (Math.hypot(A[0], A[1]) + Math.hypot(B[0], B[1])))); for (let i = 0; i < n; i++) { const a = TAU * i / n; if (hits(THINGS, c[0] + A[0] * Math.cos(a) + B[0] * Math.sin(a), c[2] + A[1] * Math.cos(a) + B[1] * Math.sin(a), 1)) return false; } return true; };
      let nWalk = 0, walkOut = 0, walkMoved = 0, walkEnd = 0;
      // (p1m3, M1) NO TWO WALKERS' ROUNDS CAN MEET. Every round that stands is kept in `laid` (its level, its box,
      // its middle and half axes; its rim as a line of points, made when first needed). A new round stands only
      // where it keeps GAPW (0.8 m: a body is 0.56 m wide at the most) from every round laid before it on its own
      // level, at every place of both rims, so at every clock and from any phases. The test is rim against rim
      // (each rim's points against the other's line), passed at once where the two boxes are GAPW apart, and along
      // a kerb (thin) by the boxes alone. A walker's kind hands its rounds by the plan in order, the drawn one
      // first; the first that is free of the plan's things and of the rounds laid stands. All of it after the
      // walker's draws: no draw moves. The pace stays the walker's own (the round's time follows its length); its
      // phase is its own.
      const laid = [], GAPW = 0.8, NEARW = GAPW - 0.02;
      const rimOf = (c, A, B) => { const n = clamp(Math.ceil(6 * (Math.hypot(A[0], A[1]) + Math.hypot(B[0], B[1]))), 32, 96), p = []; for (let i = 0; i < n; i++) { const a = TAU * i / n; p.push(c[0] + A[0] * Math.cos(a) + B[0] * Math.sin(a), c[2] + A[1] * Math.cos(a) + B[1] * Math.sin(a)); } return p; };
      const scan = (p, r) => { const N2 = NEARW * NEARW;
        for (let i = 0; i < p.length; i += 2) for (let j = 0, k = r.length - 2; j < r.length; k = j, j += 2) {
          const ex = r[j] - r[k], ez = r[j + 1] - r[k + 1], t = clamp(((p[i] - r[k]) * ex + (p[i + 1] - r[k + 1]) * ez) / (ex * ex + ez * ez || 1), 0, 1);
          const dx = p[i] - r[k] - t * ex, dz = p[i + 1] - r[k + 1] - t * ez; if (dx * dx + dz * dz < N2) return true;
        }
        return false; };
      const meets = (c, A, B, thin, list = laid) => {
        const hx = Math.abs(A[0]) + Math.abs(B[0]), hz = Math.abs(A[1]) + Math.abs(B[1]); let p = null;
        for (const q of list) {
          if (Math.abs(q[0] - c[1]) > 0.5 || Math.max(q[1] - c[0] - hx, c[0] - hx - q[2], q[3] - c[2] - hz, c[2] - hz - q[4]) >= NEARW) continue;
          if (thin && q[6]) return true;
          // two rounds about one middle (the fountain's rings, a nest's): one lies inside the other, and the gap is
          // the least difference of their reaches over the directions (each a round with its half axes along x, z)
          if (Math.abs(q[7][0] - c[0]) < 1e-6 && Math.abs(q[7][2] - c[2]) < 1e-6) { let lo = 1e9, hi = -1e9; for (let i = 0; i <= 16; i++) { const a = Math.PI * i / 32, cs = Math.cos(a), sn = Math.sin(a), d = Math.hypot(A[0] * cs, B[1] * sn) - Math.hypot(q[8][0] * cs, q[9][1] * sn); lo = Math.min(lo, d); hi = Math.max(hi, d); } if ((lo < NEARW && hi > -NEARW)) return true; continue; }
          const r = q[5] || (q[5] = rimOf(q[7], q[8], q[9])); p = p || rimOf(c, A, B);
          if (scan(p, r) || scan(r, p)) return true;
        }
        return false;
      };
      // the walkers: each round [middle, half round along, half round across] by its place; every draw before the body
      const cols =[mulc(C.stone, 0.42), [0.2, 0.16, 0.14], [0.3, 0.3, 0.34], [0.5, 0.46, 0.4], [0.14, 0.15, 0.2]], draw = () => ({ ph: wk(), dir: wk.chance(0.5) ? 1 : -1, pace: wk.range(1.0, 1.5), col: wk.pick(cols), ht: wk.range(1.62, 1.86) });
      const entry = (c, A, B, thin) => { const hx = Math.abs(A[0]) + Math.abs(B[0]), hz = Math.abs(A[1]) + Math.abs(B[1]); return [c[1], c[0] - hx, c[0] + hx, c[2] - hz, c[2] + hz, null, thin, c, A, B]; };
      const stand = (dw, rounds, fit = true, thin = false) => {
        const rd = fit ? rounds.find(([c, A, B]) => freeRound(c, A, B) && !meets(c, A, B, thin)) : null;
        if (!rd) { walkOut++; return null; }
        const [c, A, B] = rd, len = Math.hypot(A[0], A[1]) + Math.hypot(B[0], B[1]);
        laid.push(entry(c, A, B, thin));
        nWalk++; if (rd !== rounds[0]) walkMoved++;
        LAWS.loopOn(greyM, c, A, B, dw.ph, dw.dir * dw.pace / (4 * len)); BODIES.personBody(greyM, dw.col, dw.ht); greyM.move(null);
        return rd;
      };
      const walker = (rounds, fit, thin) => stand(draw(), rounds, fit, thin);
      const treads = new Set(), yd = [];
      for (let i = 0; i < 7; i++) { const k = wk.int(1, 16), cx = wk.range(-24, 24), len = wk.range(5, 10);
        // on the stair a round lies along one tread inside ONE flight: the middle one between the two balustrades, or
        // a side one between a balustrade and its cheek wall, 1 m and more from rail, newel and wall
        const mid = Math.abs(cx) < 18, lo = mid ? -16.4 : 19.6, hi = mid ? 16.4 : 34.4, L = Math.min(len, (hi - lo) / 2), xc = mid ? clamp(cx, lo + L, hi - L) : (Math.sign(cx) || 1) * clamp(Math.abs(cx), lo + L, hi - L);
        // (M1) ONE ROUND TO A TREAD OF A FLIGHT: the drawn tread, or the nearest tread of that flight that has none
        // yet (the next below first, then the next above, and so outward), the same place across and the same length
        const fl = mid ? 0 : Math.sign(cx) || 1, ks = [k]; for (let q = 1; q < 16; q++) for (const t of [k + q, k - q]) if (t >= 1 && t <= 16) ks.push(t);
        const kk = ks.find((t) => !treads.has(fl + ':' + t));
        if (walker([[[xc, STREET - kk - 1 + 0.02, STAIR[0] - (kk + 0.5) * run], [L, 0], [0, 0.4]]])) { treads.add(fl + ':' + kk); if (kk !== k) walkMoved++; } }
      for (let i = 0; i < 8; i++) { const sg = i % 2 ? 1 : -1, z = wk.range(4, 50), ra = wk.range(3, 6), rb = wk.range(4, 9);
        // about a yard: in the open yard beside the stair (between the cheek wall and the lamps' row, clear of the
        // pier's plinth and of the plateau's face) or, nearer the wall, under the porch between its two piers' plinths
        const open = z >= 21, A = Math.min(ra, open ? 5.6 : 5.3), B = Math.min(rb, open ? 9 : 6.6), zc = open ? clamp(z, 21.2 + B, 56.8 - B) : clamp(z, 8.9 + B, 22.2 - B);
        yd.push({ sg, open, rd: [[sg * (open ? 51.2 : 46.7), 0.02, zc], [A, 0], [0, B]], dw: draw() }); }
      // (M1) A YARD'S ROUNDS, ONE INSIDE THE OTHER. The eight are drawn first, each with its own draws in the old
      // order; then each side's two grounds are laid. Where the rounds of a ground meet none of one another they
      // stand as drawn. Where two of them would meet, the ground's walkers go on its NEST instead: rings about the
      // ground's middle, the first the ground's widest, each next one 1.1 m inside the last on both half axes (the
      // open yard: 5.6 by 9 m about z 39; the porch: 5.3 by 5.65 m about z 14.55, so that it ends a metre short of
      // the open yard's ground). The porch goes on its nest as well where one of its rounds would meet a round of
      // the open yard. Each walker keeps its phase, its way round, its pace, its coat and its height.
      const ent = (q) => entry(q.rd[0], q.rd[1], q.rd[2], false), clash = (qs, rs) => qs.some((q, i) => meets(q.rd[0], q.rd[1], q.rd[2], false, (rs === qs ? rs.slice(i + 1) : rs).map(ent)));
      const nest = (qs, open) => qs.forEach((q, r) => { const [Am, Bn, zm] = open ? [5.6, 9, 39] : [5.3, 5.65, 14.55]; q.rd = [[q.rd[0][0], 0.02, zm], [Am - 1.1 * r, 0], [0, Bn - 1.1 * r]]; q.nest = true; });
      for (const sg of [-1, 1]) { const op = yd.filter((q) => q.sg === sg && q.open), po = yd.filter((q) => q.sg === sg && !q.open);
        if (clash(op, op)) nest(op, true);
        if (clash(po, po) || clash(po, op)) nest(po, false); }
      for (const q of yd) if (stand(q.dw, [q.rd]) && q.nest) walkMoved++;
      // round the fountain: the ring lies inside the nearest thing's line (the colonnades', the houses', the eight
      // lamps') by 1 m and outside the basin's rim (9.9 m) by 1 m; a ring with no such room is left out
      const fz = STAIR[0] + 20, ringMax = THINGS.reduce((m, b) => Math.min(m, Math.hypot(Math.max(b[0], -b[1], 0), Math.max(b[2] - fz, fz - b[3], 0))), 1e9) - 1.05;
      // (each on a ring of its own, 0.8 m apart, the first 1.2 m outside the rim; the old drawn radius is still drawn)
      // (where the square has room for one ring or none, the next two walkers go to and fro past the fountain
      // instead, one on the stair's side of it and one on the viaduct's, between the basin and the lamps, 8 m to
      // either hand; the rest are left out after their draws)
      const nRing = ringMax >= 11.1 ? Math.min(6, Math.floor((ringMax - 11.1) / 0.8) + 1) : 0;
      for (let i = 0; i < 6; i++) { const ra = wk.range(11.5, 15), r2 = 11.1 + 0.8 * i;
        if (i < nRing) walker([[[0, STREET + 0.02, fz], [r2, 0], [0, r2]]], ra > 0); else walker([[[0, STREET + 0.02, fz + ((i - nRing) % 2 ? 12.5 : -12.5)], [8, 0], [0, 0.6]]], nRing <= 1 && i < nRing + 2); }
      // (M1) ALONG A KERB EVERY WALKER HAS A LANE OF ITS OWN: the pavement between the viaduct's piers and the kerb's
      // lamps (5.25 to 8.85 m from the viaduct's middle line, a metre off both) holds four lanes a metre apart: the
      // kerb's old line (7.5 m), then 6.5, 8.5 and 5.5 m. A walker goes to and fro on a line there (a round 0.2 m
      // wide), on the first lane whose length along its whole stretch is free; where all four are taken along its
      // stretch it walks END TO END with the others: the longest free piece of its stretch on a lane (8 m at the
      // least). It stands, as before, only where the kerb's old strip along its whole drawn stretch is free.
      const LANES = [7.5, 6.5, 8.5, 5.5];
      for (let i = 0; i < 9; i++) { const cx = wk.range(-150, 150), len = wk.range(8, 22), sd = wk.chance(0.5) ? 1 : -1;
        const ys = STREET + 0.02, cand = LANES.map((dl) => [[cx, ys, VZ + sd * dl], [len, 0], [0, 0.1]]), ends = [];
        for (const dl of LANES) { let pc = [[cx - len, cx + len]]; for (const q of laid) if (q[6] && Math.abs((q[3] + q[4]) / 2 - VZ - sd * dl) < 0.5) pc = pc.flatMap(([a, b]) => [[a, Math.min(b, q[1] - GAPW)], [Math.max(a, q[2] + GAPW), b]]);
          for (const [a, b] of pc) if (b - a >= 8 && b - a < 2 * len) ends.push([[(a + b) / 2, ys, VZ + sd * dl], [(b - a) / 2, 0], [0, 0.1]]); }
        ends.sort((p, q) => q[1][0] - p[1][0]);
        const rd = walker(cand.concat(ends), freeRound([cx, ys, VZ + sd * 7.5], [len, 0], [0, 0.6]), true); if (rd && ends.includes(rd)) walkEnd++; }
      counts.walkers = nWalk; counts.walkersOut = walkOut; counts.walkersMoved = walkMoved; counts.walkersEndToEnd = walkEnd; counts.lampsOut = lampsOut; counts.ringMax = ringMax;
      // the plan itself, for a count from outside (not listed with the counts' own keys)
      Object.defineProperty(counts, 'plan', { value: { boxes: BOXES, things: THINGS }, enumerable: false });
    }
    await ctx.yield();
    // ------------------------------------------------------------ the building's front: a great house of dark iron and
    // bronze: a deep porch of four iron piers under a bronze entablature and pediment, the open door behind it (its
    // bronze leaves folded flat against the wall), a slate roof with the glazed lantern on it, wings with their own
    // roofs, blue light in every tall window
    const front = new Geo({ cap: 1 << 14 }), glowBlue = [0.1, 0.24, 0.62], FW = 64, FH = 78, PZ = 15, PH = 58;
    // the door is the hall's own mouth: an open arch 60 m wide and 52 m high under an elliptical head (the rooms'
    // arches behind it are 86 m wide), its jambs 30 m from the middle and 4 m deep (the front wall's thickness: its
    // inner face is the first room's own end). Nothing stands inside the jambs' line: the porch's inner piers stand
    // 5.4 m outside it (their bronze feet 1.2 m clear of it), and each leaf stands flat on the wall behind its pier
    const DOOR = { w: 60, s: 26, rise: 26 }, PIERS = [DOOR.w / 2 + 5.4, 58], LEAF = DOOR.w / 2 + 5.4, WALL = { z: 2, t: 4 }, WIN = { c: 45, w: 12, s: 40 };
    // a brass stud on a face that looks along +z: a low pyramid s wide
    const stud = (g, x, y, z, s) => { const h = s / 2, i = g.set(C.brass, PAT.GOLD).v(x, y, z + s * 0.6, 0, 0, 1); g.v(x - h, y - h, z, -0.6, -0.6, 0.5); g.v(x + h, y - h, z, 0.6, -0.6, 0.5); g.v(x + h, y + h, z, 0.6, 0.6, 0.5); g.v(x - h, y + h, z, -0.6, 0.6, 0.5); g.tri(i, i + 1, i + 2); g.tri(i, i + 2, i + 3); g.tri(i, i + 3, i + 4); g.tri(i, i + 4, i + 1); };
    {
      const g = front;
      g.set(C.iron, PAT.IRON).wall(-FW, FW, 0, FH, WALL.z, WALL.t, [{ c: 0, w: DOOR.w, s: DOOR.s, arch: 1, rise: DOOR.rise }, { c: -WIN.c, w: WIN.w, s: WIN.s, arch: 1, sill: 12 }, { c: WIN.c, w: WIN.w, s: WIN.s, arch: 1, sill: 12 }], { k: 14 });
      // (polish round 1) THE FANLIGHT in the door arch's head: a slight bronze transom across the opening, by the
      // door's own measure: 0.715 of the arch's rise over its springing (26 + 0.715 x 26 = 44.6 m up; its clearance is
      // counted, counts.least.fanlight), brass bars fanning from
      // its middle to the arch, two brass half rings; its glass is a thin warm veil lit from inside by the hall (the
      // vault and the far rooms show through it)
      { const hy = 44.6, zf = WALL.z, k0 = (hy - DOOR.s) / DOOR.rise, reach = (ph) => { const c = Math.cos(ph), s = Math.sin(ph), A = (c / (DOOR.w / 2)) ** 2 + (s / DOOR.rise) ** 2, B = 2 * k0 * s / DOOR.rise, Cq = k0 * k0 - 1; return (-B + Math.sqrt(B * B - 4 * A * Cq)) / (2 * A); };
        g.set(C.bronze, PAT.BRONZE).box(0, hy - 0.6, zf, 2 * reach(0), 0.6, 1.2, { bot: true });
        g.set(C.brass, PAT.GOLD); for (let i = 1; i < 8; i++) { const ph = Math.PI * i / 8, t = reach(ph) - 0.2; g.tube([[2.2 * Math.cos(ph), hy + 2.2 * Math.sin(ph), zf], [t * Math.cos(ph), hy + t * Math.sin(ph), zf]], 0.22, 4); }
        g.torus(0, hy, zf, 2.2, 0.3, 6, 4, { axis: 'z', arc: Math.PI, a0: Math.PI }).torus(0, hy, zf, 5, 0.22, 10, 4, { axis: 'z', arc: Math.PI, a0: Math.PI });
        const nf = 14, FP = new Float32Array((nf + 2) * 3), FI = []; FP.set([0, hy, zf], 0);
        for (let i = 0; i <= nf; i++) { const ph = Math.PI * i / nf, t = reach(ph); FP.set([t * Math.cos(ph), hy + t * Math.sin(ph), zf], (i + 1) * 3); if (i < nf) FI.push(0, i + 1, i + 2); }
        const fg = new THREE.BufferGeometry(); fg.setAttribute('position', new THREE.BufferAttribute(FP, 3)); fg.setIndex(FI);
        const fm = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(HR.dome[0] * 0.2, HR.dome[1] * 0.2, HR.dome[2] * 0.2), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
        fm.name = 'fanlight'; fm.renderOrder = 2; scene.add(fm);
        for (let i = 0; i <= nf; i++) note('fanlight', gapTo(FP[(i + 1) * 3], FP[(i + 1) * 3 + 1], zf)); note('fanlight', gapBox(0, zf, reach(0), 0.6, hy - 0.6, hy)); }
      { const band = []; for (let j = 0; j <= 14; j++) { const a = Math.PI * j / 14; band.push([-(DOOR.w / 2 + 1.2) * Math.cos(a), DOOR.s + (DOOR.rise + 1.2) * Math.sin(a), 4.6]); } g.set(C.brass, PAT.GOLD).tube(band, 0.9, 4); }
      for (const sg of [-1, 1]) {
        // the tall windows: blue light behind glazing bars, a brass arch over each
        g.set(glowBlue, PAT.LIGHT).quad([sg * WIN.c - WIN.w / 2 - 0.5, 12, 1], [sg * WIN.c + WIN.w / 2 + 0.5, 12, 1], [sg * WIN.c + WIN.w / 2 + 0.5, WIN.s + WIN.w / 2 + 1, 1], [sg * WIN.c - WIN.w / 2 - 0.5, WIN.s + WIN.w / 2 + 1, 1]);
        g.set(C.iron, PAT.IRON); for (const dx of [-2, 2]) g.box(sg * WIN.c + dx, 12, 2.4, 0.8, WIN.s - 12 + WIN.w / 2, 1.2, {}); for (const yy of [26, 40]) g.box(sg * WIN.c, yy, 2.4, WIN.w, 0.8, 1.2, {});
        g.set(C.brass, PAT.GOLD).torus(sg * WIN.c, WIN.s, 4.4, WIN.w / 2 + 0.7, 0.5, 12, 4, { axis: 'z', arc: Math.PI, a0: Math.PI });
        // the door's leaves: four bronze panels folded together, standing flat against the OUTER wall behind the
        // porch's inner pier, 2.4 m outside the jamb
        { const lx = sg * LEAF;
          g.set(mulc(C.bronze, 0.5), PAT.BRONZE).box(lx, 0, 5.4, 6, 30, 2.4, {});
          for (const dx of [-1.5, 1.5]) for (const y0 of [1.4, 10.9, 20.4]) g.set(mulc(C.bronze, 0.85), PAT.BRONZE).box(lx + dx, y0, 6.7, 2.4, 8.1, 0.5, { skip: [2] });
          g.set(C.brass, PAT.GOLD).box(lx, 9.8, 6.75, 5.6, 0.5, 0.5, {}).box(lx, 19.3, 6.75, 5.6, 0.5, 0.5, {});
          // (polish round 1: the make of a great door, on the leaf where it stands) a raised field in every panel, a
          // brass rail at the foot and the head, brass studs up the three stiles every 2.3 m, and at the foot of the
          // leaf's inner half a WICKET of a person's height (1 m by 2.1 m) in a brass frame on a stone step, a line
          // of the hall's light at its edge
          for (const dx of [-1.5, 1.5]) for (const y0 of [1.4, 10.9, 20.4]) g.set(mulc(C.bronze, 1.05), PAT.BRONZE).box(lx + dx, y0 + 0.8, 7.0, 1.5, 6.5, 0.2, { skip: [2] });
          g.set(C.brass, PAT.GOLD).box(lx, 0.25, 6.75, 5.8, 0.6, 0.5, {}).box(lx, 29.2, 6.75, 5.8, 0.6, 0.5, {});
          for (const dx of [-2.85, 0, 2.85]) for (let i = 0; i < 12; i++) stud(g, lx + dx, 2.2 + 2.3 * i, 6.6, 0.34);
          { const xw = lx - sg * 1.5, zw = 7.14;
            g.set(mulc(C.bronze, 0.32), PAT.PLAIN).quad([xw - 0.5, 0.3, zw], [xw + 0.5, 0.3, zw], [xw + 0.5, 2.4, zw], [xw - 0.5, 2.4, zw]);
            g.set(C.brass, PAT.GOLD).box(xw - 0.56, 0.3, zw, 0.12, 2.2, 0.14, {}).box(xw + 0.56, 0.3, zw, 0.12, 2.2, 0.14, {}).box(xw, 2.4, zw, 1.24, 0.12, 0.14, {});
            g.set(mulc(C.gold, 0.6), PAT.LIGHT).quad([xw - sg * 0.5 - 0.035, 0.3, zw + 0.01], [xw - sg * 0.5 + 0.035, 0.3, zw + 0.01], [xw - sg * 0.5 + 0.035, 2.4, zw + 0.01], [xw - sg * 0.5 - 0.035, 2.4, zw + 0.01]);
            stud(g, xw + sg * 0.34, 1.25, zw, 0.14);
            g.set(mulc(C.stone, 0.8 * HR.grey), PAT.STONE).box(xw, 0, 7.45, 1.7, 0.3, 0.8, {}); } }
        // the porch's piers on bronze feet, with bronze heads
        for (const px of PIERS) { g.set(mulc(C.iron, 1.1), PAT.IRON).box(sg * px, 0, PZ, 6.4, PH, 6.4, { top: false }); g.set(C.bronze, PAT.BRONZE).box(sg * px, 0, PZ, 8.4, 4, 8.4, {}).box(sg * px, PH - 4, PZ, 8, 4, 8, { bot: true }).box(sg * px, 19, PZ, 7.2, 1.2, 7.2, { bot: true }).box(sg * px, 38, PZ, 7.2, 1.2, 7.2, { bot: true }); g.set(mulc(C.iron, 1.1), PAT.IRON).box(sg * px, 0, 4.6, 6.4, PH, 1.4, { top: false });
          // (polish round 1: the pier's make, on the pier where it stands) a stone plinth under the bronze foot and a
          // bronze moulding on it, a course's joint of darker iron every 4.75 m, a brass necking under the head, an
          // abacus on it
          g.set(mulc(C.stone, 0.85 * HR.grey), PAT.STONE).box(sg * px, 0, PZ, 9.8, 1.4, 9.8, {});
          g.set(C.bronze, PAT.BRONZE).box(sg * px, 4, PZ, 7.4, 0.8, 7.4, {}).box(sg * px, PH - 1.1, PZ, 9, 1.1, 9, { bot: true });
          for (const yc of [8.75, 13.5, 23.75, 28.5, 33.25, 42.75, 47.5]) g.set(mulc(C.iron, 0.7), PAT.PLAIN).box(sg * px, yc, PZ, 6.62, 0.3, 6.62, { top: false });
          g.set(C.brass, PAT.GOLD).box(sg * px, 52.4, PZ, 6.9, 0.6, 6.9, {}); }
      }
      // the porch's entablature (its underside a deep shade over the door), its pediment, the house's cornice
      g.set(mulc(C.iron, 1.1), PAT.IRON).box(0, PH, PZ / 2 + 2.5, 126, 7, PZ + 9, { bot: true });
      g.set(C.bronze, PAT.BRONZE).box(0, PH, PZ / 2 + 2.5, 127.2, 1.2, PZ + 10.2, { bot: true }).box(0, PH + 5.8, PZ / 2 + 2.5, 128, 1.2, PZ + 11, { bot: true });
      g.set(mulc(C.slate, 0.9), PAT.SLATE).gable(0, PH + 7, PZ / 2 + 2.5, PZ + 9, 126, 15, { yaw: Math.PI / 2, end: [mulc(C.iron, 0.9), PAT.IRON] });
      // in the pediment a round window of blue light in a brass ring; bronze rails along its two slopes
      { const zf = PZ + 7.06, cy = PH + 12.6; g.set([0.3, 0.55, 1.15], PAT.LIGHT).quad([-4.4, cy, zf], [0, cy - 4.4, zf], [4.4, cy, zf], [0, cy + 4.4, zf]); g.set(C.brass, PAT.GOLD).torus(0, cy, zf, 4.6, 0.5, 20, 5, { axis: 'z' });
        for (const sg of [-1, 1]) g.set(C.bronze, PAT.BRONZE).tube([[sg * 63, PH + 7.3, zf + 0.3], [0, PH + 22.3, zf + 0.3]], 0.7, 4); }
      g.set(C.bronze, PAT.BRONZE).box(0, FH - 5, 1.5, FW * 2 + 5, 5, 10, { bot: true }).box(0, FH + 1, -33, FW * 2 + 5, 1.5, 76, { bot: true });
      // the roof (it lies over the gallery's first vault, clear of it): slate, hipped in to a flat deck; on it the lantern: a drum of blue light between iron mullions, a
      // ribbed dome of panes on a bronze ring, a brass finial
      g.set(mulc(C.slate, 0.9), PAT.SLATE).box(0, FH + 2.5, -33, FW * 2 + 2, 12, 72, { tx: 0.74, tz: 0.62 });
      const dz = -33, dr = 30, dy = FH + 14.5, dp = []; for (let i = 0; i <= 8; i++) { const a = Math.PI / 2 * 0.97 * i / 8; dp.push([dr * Math.cos(a), dr * 0.9 * Math.sin(a)]); }
      g.set([0.3, 0.55, 1.15], PAT.LIGHT).cyl(0, dy, dz, dr - 0.6, dr - 0.6, 9, 32, { cap: false });
      for (let k = 0; k < 24; k++) { const a = TAU * k / 24; g.set(C.iron, PAT.IRON).box(Math.cos(a) * dr, dy, dz + Math.sin(a) * dr, 1.4, 9, 1.6, { yaw: -a, top: false }); }
      g.set(C.bronze, PAT.BRONZE).lathe(0, dy + 9, dz, [[dr + 2.2, 0], [dr + 2.2, 2.4], [dr, 3]], 32, { cap: false }).lathe(0, dy - 1.2, dz, [[dr + 2.6, 0], [dr + 2.6, 1.6], [dr + 0.4, 1.6]], 32, { cap: false });
      g.set(C.iron, PAT.PANE).lathe(0, dy + 12, dz, dp, 32, { smooth: true, cap: false, ur: 7 * 28 / TAU });
      for (let k = 0; k < 12; k++) { const a = TAU * k / 12; g.set(C.iron, PAT.IRON).tube(dp.map((q) => [Math.cos(a) * q[0] * 1.01, dy + 12 + q[1] * 1.01, dz + Math.sin(a) * q[0] * 1.01]), 0.8, 5, {}); }
      g.set(C.brass, PAT.GOLD).lathe(0, dy + 12 + dr * 0.9, dz, [[2.4, -0.6], [3, 1.5], [1.2, 3], [1.8, 6], [0, 11]], 8, { smooth: true });
      await ctx.yield();
      // the wings: iron walls with arched windows (blue light, glazing bars, iron ribs between), a bronze cornice, a
      // slate roof hipped in, a ventilator's small lantern on each
      for (const sg of [-1, 1]) {
        g.set(C.iron, PAT.IRON).wall(sg > 0 ? FW : -138, sg > 0 ? 138 : -FW, 0, 56, -6, 6, [0, 1].map((k) => ({ c: sg * (FW + 19 + 36 * k), w: 20, s: 30, arch: 1, sill: 8 })), { k: 8, back: false });
        g.set(glowBlue, PAT.LIGHT).quad([sg * FW + (sg > 0 ? 0 : -74), 8, -8], [sg * FW + (sg > 0 ? 74 : 0), 8, -8], [sg * FW + (sg > 0 ? 74 : 0), 48.5, -8], [sg * FW + (sg > 0 ? 0 : -74), 48.5, -8]);
        g.set(C.iron, PAT.IRON);
        for (let k = 0; k < 2; k++) { const c = sg * (FW + 19 + 36 * k); for (const dx of [-3.4, 3.4]) g.box(c + dx, 8, -6, 0.9, 40, 1.2, {}); g.box(c, 24, -6, 20, 0.9, 1.2, {}); g.set(C.brass, PAT.GOLD).torus(c, 38, -2.6, 10.6, 0.5, 12, 4, { axis: 'z', arc: Math.PI, a0: Math.PI }); g.set(C.iron, PAT.IRON); }
        for (let k = 0; k < 3; k++) { g.set(mulc(C.iron, 1.15), PAT.IRON).box(sg * (FW + 1 + 36 * k), 0, -2.2, 3.4, 52, 2.6, { top: false }); g.set(C.bronze, PAT.BRONZE).box(sg * (FW + 1 + 36 * k), 0, -2, 4.6, 3, 3.4, {}).box(sg * (FW + 1 + 36 * k), 49, -2, 4.4, 3, 3.2, {}); }
        g.set(C.iron, PAT.IRON).box(sg * 136.5, 0, -40, 3, 56, 68, {}).box(sg * 100, 0, -72, 76, 56, 3, {});
        g.set(C.bronze, PAT.BRONZE).box(sg * 101, 52, -38, 78, 4, 74, { bot: true });
        g.set(mulc(C.slate, 0.9), PAT.SLATE).box(sg * 101, 56, -38, 76, 10, 70, { tx: 0.7, tz: 0.6 });
        g.set([0.3, 0.55, 1.15], PAT.LIGHT).box(sg * 101, 66, -38, 18, 4, 14, { top: false }); g.set(mulc(C.slate, 0.9), PAT.SLATE).hip(sg * 101, 70, -38, 21, 17, 5, {});
      }
      // the rotunda's drum and dome seen from outside: iron with lit windows, a glazed dome
      // (open toward the gallery, which runs into it)
      const gapA = Math.asin(58 / 174.5);
      g.set(C.iron, PAT.WALL).lathe(0, 0, zG, [[174.5, 0], [174.5, 82]], 44, { cap: false, a0: Math.PI / 2 + gapA, arc: TAU - 2 * gapA });
      const prof = [], s1 = Math.acos(HALL.oculus / HALL.RR), s0 = 0.32; for (let i = 0; i <= 10; i++) { const s = s0 + (s1 - s0) * i / 10; prof.push([HALL.RR * Math.cos(s) * 1.165, heroY + HALL.top + HALL.domeH * Math.sin(s) + 2]); }
      g.set(C.iron, PAT.PANE).lathe(0, 0, zG, prof, 48, { smooth: true, cap: false, ur: 7 * 156 / TAU });
      g.set(C.bronze, PAT.BRONZE).lathe(0, 0, zG, [[175.5, 79], [178.5, 81], [178.5, 84], [165, 86]], 48, { cap: false });
    }
    // (polish round 1) three plain blue flags fly in the evening's one wind (the smoke's): on the roof lantern's
    // finial and on each wing's ventilator; no device on them. Cloth by the law WAVE, each from a phase of its own
    // stream. (p1m1, R8: the first flew from the pediment's apex, in the middle of live's pigeons' wheel; it gives
    // way to them and flies from the lantern's finial, 142 m up and 43 m behind the front: the wheel reaches 23 m.)
    const FLAGS = [[0, FH + 64, -33, 16, 9], [-101, 75, -38, 10, 6], [101, 75, -38, 10, 6]];
    {
      const fr = OWN('flags'), wl = Math.hypot(wind[0], wind[1]), wd = [wind[0] / wl, wind[1] / wl];
      for (const [fx, fy, fz, ht, len] of FLAGS) {
        const ph = fr(), sp = fr.range(2.2, 3.2), hgt = len * 0.6;
        front.set(mulc(C.iron, 1.1), PAT.PLAIN).box(fx, fy, fz, 0.36, ht, 0.36, { tx: 0.6, tz: 0.6 }); front.set(C.brass, PAT.GOLD).cyl(fx, fy + ht, fz, 0.4, 0, 0.9, 5, {});
        const fn = (u, v) => [fx + wd[0] * (0.2 + u * len), fy + ht - 0.3 - v * hgt - u * u * 0.9, fz + wd[1] * (0.2 + u * len)];
        LAWS.waveOn(greyM, ph, sp, 0.55, 5); greyM.set(mulc(C.ultra, 0.9), PAT.CLOTH).sheet(5, 2, fn).sheet(5, 2, fn, { flip: true }); greyM.move(null);
        note('flag', gapBox(fx, fz, len + 1, len + 1, fy, fy + ht + 1));
      }
    }
    await ctx.yield();
    // ------------------------------------------------------------ the gallery of rooms
    // One long hall of bays under a glazed vault on iron ribs. Every room: a floor of patterned iron over dark wood;
    // iron walls of riveted plates with three tall arched windows a side (the grey city beyond, rain on the panes on a
    // round of its own), dark wood panelling under a brass rail, iron piers with bronze feet and heads between the
    // windows, a bracket lamp and two shelves with small globes on every pier, a bronze cornice; a great open arch on
    // piers to the next room; one great globe on its bronze stand within a brass rail and velvet rope, two smaller
    // globes on pedestals. The iron throws true shadow: the light lies on the floor in the windows' and the ribs' shapes.
    const lampsAt = [], globesAt = [], pools = [], panes = [], shelfN = { n: 0 };
    // a pool of light painted on a face: its middle, its two half axes along the face, its colour, 1 if it shimmers as
    // a globe's light does (0: it flickers as a lamp's)
    const pool = (c, a, b, col, shim = 0) => pools.push([c, a, b, col, shim]);
    const vaultY = (x) => HW + VR * Math.sqrt(Math.max(0, 1 - (x / (WR + 2)) ** 2));
    // a room divider at z: an iron screen from the round arch (half width hw, springing sp) up to the vault and out to
    // the walls, its piers, a brass archivolt on both faces
    const archScreen = (A, z, hw, sp, T) => {
      const n = 20, pts = []; for (let j = 0; j <= n; j++) { const a = Math.PI * j / n, x = -hw * Math.cos(a); pts.push([x, sp + hw * Math.sin(a)]); }
      A.set(C.iron, PAT.IRON);
      for (let j = 0; j < n; j++) {
        const [xa, ya] = pts[j], [xb, yb] = pts[j + 1], ua = Math.min(vaultY(xa) + 0.5, HW + VR), ub = Math.min(vaultY(xb) + 0.5, HW + VR);
        A.quad([xa, ya, z + T / 2], [xb, yb, z + T / 2], [xb, ub, z + T / 2], [xa, ua, z + T / 2], xa, ya, xb, ub);
        A.quad([xb, yb, z - T / 2], [xa, ya, z - T / 2], [xa, ua, z - T / 2], [xb, ub, z - T / 2], xb, yb, xa, ua);
        A.quad([xa, ya, z - T / 2], [xb, yb, z - T / 2], [xb, yb, z + T / 2], [xa, ya, z + T / 2], 0, 0, Math.hypot(xb - xa, yb - ya), T);
      }
      for (const sg of [-1, 1]) {
        // the wall from the arch's foot out to the room's wall, in four upright strips that follow the vault
        for (let k = 0; k < 4; k++) { const xa = sg * (hw + (WR + 1 - hw) * k / 4), xb = sg * (hw + (WR + 1 - hw) * (k + 1) / 4), x0 = Math.min(xa, xb), x1 = Math.max(xa, xb), u0 = vaultY(x0) + 0.5, u1 = vaultY(x1) + 0.5; A.set(C.iron, PAT.IRON).quad([x0, 0, z + T / 2], [x1, 0, z + T / 2], [x1, u1, z + T / 2], [x0, u0, z + T / 2], x0, 0, x1, u1).quad([x1, 0, z - T / 2], [x0, 0, z - T / 2], [x0, u0, z - T / 2], [x1, u1, z - T / 2], x1, 0, x0, u0); }
        A.quad([sg * hw, 0, z + sg * T / 2], [sg * hw, 0, z - sg * T / 2], [sg * hw, sp, z - sg * T / 2], [sg * hw, sp, z + sg * T / 2], 0, 0, T, sp);
        // the pier's face toward the opening: an iron rib with a bronze foot and a bronze head at the springing
        A.set(mulc(C.iron, 1.15), PAT.IRON).box(sg * (hw + 1.9), 0, z, 3.8, sp + 4, T + 2.4, { top: false });
        A.set(C.bronze, PAT.BRONZE).box(sg * (hw + 1.9), 0, z, 5, 3.2, T + 3.6, {}).box(sg * (hw + 1.9), sp - 1, z, 4.8, 3.4, T + 3.4, { bot: true });
      }
      for (const dz of [-1, 1]) A.set(C.brass, PAT.GOLD).torus(0, sp, z + dz * (T / 2 + 0.2), hw + 0.9, 0.7, 24, 5, { axis: 'z', arc: Math.PI, a0: Math.PI });
    };
    // the dress of a wall's face (in the wall's own frame: x along it, zf its face, li the hand it faces): a bronze
    // skirting, dark wood panelling, the brass rail on it
    const dadoInto = (A, len, zf, li) => {
      A.set(C.bronze, PAT.BRONZE).box(0, 0, zf + li * 0.55, len, 1.2, 1.1, {});
      A.set(C.wood, PAT.PANEL).box(0, 1.2, zf + li * 0.4, len, 6.3, 0.8, {});
      A.set(C.brass, PAT.GOLD).box(0, 7.5, zf + li * 0.5, len, 0.4, 1, {});
    };
    // a pier on a wall's face: an iron rib on a bronze foot with a bronze head; a bracket lamp with its pool of warm
    // light on the rib; shelves up it, a small globe on each
    const pierInto = (A, px, zf, li, H, shelfR, wallGlobes) => {
      A.set(mulc(C.iron, 1.15), PAT.IRON).box(px, 0, zf + li * 1.1, 3.6, H, 2.2, { top: false });
      A.set(C.bronze, PAT.BRONZE).box(px, 0, zf + li * 1.3, 4.8, 3, 2.8, {}).box(px, H - 4, zf + li * 1.3, 4.6, 4, 2.8, { bot: true });
      lampsAt.push(A.toWorld(...bracketInto(A, px, 15.5, zf + li * 2.2, 0, li, { k: 1.3 })));
      { const d = A.toDir(1.75, 0); pool(A.toWorld(px, 17.5, zf + li * 2.24), [d[0], 0, d[1]], [0, 5.5, 0], [1, 0.62, 0.24], 0); }
      for (const sy of [23, 32.5, 42]) {
        if (sy + 6.5 > H - 4) continue;
        const q = shelfR.fork('g' + wallGlobes.length), rs = q.range(1.9, 2.4);
        A.set(C.bronze, PAT.BRONZE).box(px, sy - 0.5, zf + li * 3.7, 4.4, 0.5, 3.4, { bot: true }).box(px, sy - 2.1, zf + li * 2.7, 0.5, 1.6, 1, {});
        wallGlobes.push([A.toWorld(px, sy + rs + 0.6, zf + li * 3.8), rs, q]);
      }
    };
    // one side wall of a room, built in its own frame (x along the room, z through the wall, li the inward hand)
    const sideWall = (A, sg, zm, len, shelfR, wallGlobes) => {
      const li = -sg, nW = 3, sp = len / nW, T = 5, W0 = 12;
      A.sub(sg * (WR + T / 2), 0, zm, Math.PI / 2);
      A.set(C.iron, PAT.IRON).wall(-len / 2, len / 2, 0, HW, 0, T, [-1, 0, 1].map((k) => ({ c: k * sp, w: W0, s: 36, arch: 1, sill: 9 })), { k: 8 });
      for (const k of [-1, 0, 1]) {
        for (const dx of [-2, 2]) A.set(C.iron, PAT.IRON).box(k * sp + dx, 9, 0, 0.6, 33, 0.9, { top: false }); for (const yy of [20, 31]) A.box(k * sp, yy, 0, W0, 0.6, 0.9, {});
        A.set(C.brass, PAT.GOLD).torus(k * sp, 36, li * (T / 2 + 0.1), W0 / 2 + 0.5, 0.4, 12, 4, { axis: 'z', arc: Math.PI, a0: Math.PI });
        // the sill: a plain bronze sill no deeper than a sill is, and nothing stands on it
        A.set(C.bronze, PAT.BRONZE).box(k * sp, 8.5, li * (T / 2 + 0.4), W0 + 1.2, 0.5, 1.2, { bot: true });
        panes.push([A.toWorld(k * sp - W0 / 2, 9, -li * 0.6), A.toWorld(k * sp + W0 / 2, 9, -li * 0.6), 42, sg]);
      }
      // skirting, dark wood panelling and the brass rail on it; the bronze cornice under the vault's foot; the piers
      // between the windows
      dadoInto(A, len - 9, li * T / 2, li);
      A.set(C.bronze, PAT.BRONZE).box(0, HW - 3, li * (T / 2 + 0.8), len, 3, 1.6, { bot: true });
      A.set(C.brass, PAT.GOLD).box(0, HW - 3.7, li * (T / 2 + 0.4), len, 0.5, 0.8, { bot: true });
      for (const px of [-sp / 2, sp / 2]) pierInto(A, px, li * T / 2, li, HW - 3, shelfR, wallGlobes);
      A.pop();
    };
    // the small globes of a wall's shelves: each a city of its own colours on a bronze foot (one is left
    // out where a room's great globe would touch it: its draws are its own stream's)
    const shelfGlobes = async (A, S, shT, wallGlobes, g) => {
      let wn = 0;
      for (const [p, rs, q] of wallGlobes) {
        const yw = q.range(0, TAU), pal = cityPalette(q);
        if (++wn % 8 === 0) await ctx.yield();
        if (g && Math.hypot(p[0] - g.x, p[1] - g.y, p[2] - g.z) < g.r + rs + 0.6) { drop('shelfGlobe'); continue; }
        note('shelfGlobe', gapTo(p[0], p[1], p[2]) - rs);
        A.set(C.bronze, PAT.BRONZE).lathe(p[0], p[1] - rs - 0.6, p[2], [[rs * 0.62, 0], [rs * 0.3, 0.3], [rs * 0.52, 0.6 + rs * 0.14]], 6, { cap: false });
        S.frame(p[0], p[1], p[2], yw, rs / RG); tinyCity(S, q, pal); shT.add(p[0], p[1], p[2], rs, { nu: 12, nv: 7 }); shelfN.n++;
      }
      S.frame();
    };
    // the rooms' own geometry: A the iron, bronze and wood (it throws shadow), V the glazing over it (it throws none)
    for (const g of rooms) {
      const A = new Geo({ cap: 1 << 15 }), V = new Geo({ cap: 1 << 10 }), S = new Geo({ cap: 1 << 14 }), M = new Geo({ movers: true, cap: 1 << 12 }), sh = new Shells(), shT = new Shells();
      const z0 = -g.i * RL, z1 = z0 - RL, zm = (z0 + z1) / 2, sp = RL / 3, wallGlobes = [], last = g.i === nRooms - 1;
      A.set(C.iron, PAT.FLOOR).quad([-WR - 3, 0, z0], [WR + 3, 0, z0], [WR + 3, 0, z1], [-WR - 3, 0, z1], -WR - 3, z0, WR + 3, z1);
      for (const sg of [-1, 1]) sideWall(A, sg, zm, RL, roomR[g.i].shelf.fork(sg > 0 ? 'east' : 'west'), wallGlobes);
      await ctx.yield();
      // the arch to the next room (the last one opens on the rotunda's top gallery: the part's own doorway)
      archScreen(A, z1, last ? HALL.door.w / 2 : 43, last ? HALL.door.s : 26, 5);
      // the vault: panes in iron glazing bars, on two great ribs that spring from the piers and one at each arch, with
      // five purlins along it
      const vault = (u, v) => { const a = Math.PI * u; return [(WR + 2) * Math.cos(a), HW + VR * Math.sin(a), z0 + (z1 - z0) * v]; };
      V.set(C.iron, PAT.PANE).sheet(12, 2, vault, { su: 157, sv: RL });
      for (const zz of [zm - sp / 2, zm + sp / 2, z0 - 3.6, z1 + 3.6]) A.set(mulc(C.iron, 1.15), PAT.IRON).torus(0, HW, zz, WR + 0.6, 1.5, 14, 4, { axis: 'z', arc: Math.PI, a0: Math.PI, sy: VR / (WR + 0.6) });
      for (const k of [1, 2, 3, 4, 5]) { const a = Math.PI * k / 6, x = (WR + 1) * Math.cos(a), y = HW + (VR - 1) * Math.sin(a); A.set(C.iron, PAT.IRON).tube([[x, y, z0], [x, y, z1]], 0.55, 4); }
      await ctx.yield();
      // the great globe (kept only if the lane holds: its crystal is laid 13.5 m and more from the line, so it does)
      const gd = gapTo(g.x, g.y, g.z) - g.r; note('roomGlobe', gd);
      if (gd >= LANE) {
        standInto(A, g.x, 0, g.z, g.r, g.hs, { n: 20 }); crownInto(A, g.x, g.y, g.z, g.r);
        railInto(A, g.x, 0, g.z, g.r + 4.2, { h: 4.6, a0: g.yaw }); note('roomRail', gapBox(g.x, g.z, g.r + 4.7, g.r + 4.7, 0, 5.2));
        S.frame(g.x, g.y, g.z, g.yaw, g.r / RG); M.frame(g.x, g.y, g.z, g.yaw, g.r / RG);
        buildCity(g.kind, S, M, g.cityRng, { q: 1, gold: g.gold, more: OWN('life' + g.i) });
        sh.add(g.x, g.y, g.z, g.r, { nu: 40, nv: 24, tint: g.gold ? 1 : 0 });
        shade.lathe(g.x, 0, g.z, [[g.r * 0.8, 0], [g.r * 0.2, g.hs * 0.5], [g.r * 0.66, g.hs + g.r * 0.25]], 10, { cap: false });
        globesAt.push([g.x, g.y, g.z, g.r, g.kind, mAt(g.x, g.y, g.z)]);
      } else { drop('roomGlobe'); globes[g.i].set(0, -1e4, 0, 1); globeC[g.i].setRGB(0, 0, 0); }
      await ctx.yield();
      // the two smaller globes on their pedestals, a pool of their blue on the floor under each
      for (const q of g.small) {
        const cy = q.hs + q.r, gs = gapTo(q.x, cy, q.z) - q.r; note('smallGlobe', gs);
        if (gs < LANE) { drop('smallGlobe'); continue; }
        standInto(A, q.x, 0, q.z, q.r, q.hs, { n: 10 }); crownInto(A, q.x, cy, q.z, q.r);
        S.frame(q.x, cy, q.z, q.yaw, q.r / RG); M.frame(q.x, cy, q.z, q.yaw, q.r / RG);
        buildCity(q.kind, S, M, q.rng, { q: 0 });
        sh.add(q.x, cy, q.z, q.r, { nu: 24, nv: 14 });
        pool([q.x, 0.12, q.z], [q.r * 2.4, 0, 0], [0, 0, q.r * 2.4], [0.1, 0.3, 1.0], 1);
        await ctx.yield();
      }
      // the small globes on the piers' shelves (none on any window sill)
      await shelfGlobes(A, S, shT, wallGlobes, g);
      S.frame(); M.frame();
      const sph = [0, 30, zm, 100];
      await ctx.yield();
      add(meshOf(A, mats.arch, 'room' + g.i, { cast: true })); add(meshOf(V, mats.arch, 'roomVault' + g.i));
      await ctx.yield();
      add(meshOf(S, mats.town, 'roomCities' + g.i)); if (M.ni) add(meshOf(M, mats.townM, 'roomMovers' + g.i, { sphere: sph }));
      await ctx.yield();
      const sg = sh.build(); if (sh.triangles) { add(meshOf(sg, mats.crystalB, 'roomGlassB' + g.i, { order: 3, receive: false })); add(meshOf(sg, mats.crystalF, 'roomGlassF' + g.i, { order: 4, receive: false })); }
      if (shT.triangles) add(meshOf(shT.build(), mats.crystalF, 'shelfGlass' + g.i, { order: 4, receive: false }));
      await ctx.yield();
    }
    // ------------------------------------------------------------ the way from the last room into the rotunda: the
    // two piers of the rotunda's door bay stand 22 m deep at either hand of it; their faces toward the way are dressed
    // as the rooms' walls are: panelling under a brass rail, a long bronze shelf of small globes, two iron ribs with
    // bracket lamps and a shelf each, a bronze cornice
    {
      const A = new Geo({ cap: 1 << 12 }), S = new Geo({ cap: 1 << 12 }), shT = new Shells(), hb2 = Math.PI / HALL.bays, wallGlobes = [], H = heroY + HALL.top - 7, sr = R.shelves.fork('passage');
      for (const sg of [-1, 1]) {
        // the pier's face toward the bay, in a frame whose x runs along it and whose z looks into the bay
        const sh2 = Math.sin(hb2), ch2 = Math.cos(hb2), fxp = sg * (sh2 * 161.5 - ch2 * 3.5), fzp = zG + ch2 * 161.5 + sh2 * 3.5, fr = sr.fork(sg > 0 ? 'east' : 'west');
        A.sub(fxp, 0, fzp, Math.atan2(-sg * ch2, sh2));
        dadoInto(A, 21, 0, 1);
        A.set(C.bronze, PAT.BRONZE).box(0, 8.3, 1.6, 21, 0.7, 3.6, { bot: true }).box(0, H, 0.8, 23, 3, 1.6, { bot: true });
        A.set(C.brass, PAT.GOLD).box(0, H - 0.7, 0.4, 23, 0.5, 0.8, { bot: true });
        for (const dx of [-9.6, -2.4, 2.4, 9.6]) { const q = fr.fork('g' + wallGlobes.length), rs = q.range(1.5, 1.9); wallGlobes.push([A.toWorld(dx, 9.6 + rs, 1.9), rs, q]); }
        for (const px of [-6, 6]) pierInto(A, px, 0, 1, H, fr, wallGlobes);
        A.pop();
      }
      await ctx.yield();
      await shelfGlobes(A, S, shT, wallGlobes, null);
      add(meshOf(A, mats.hall, 'passage')); add(meshOf(S, mats.town, 'passageCities')); add(meshOf(shT.build(), mats.crystalF, 'passageGlass', { order: 4, receive: false }));
    }
    await ctx.yield();
    // ------------------------------------------------------------ WHAT MOVES IN THE HALL (polish round 1), by the
    // world's clock, each from a phase of its own stream. A GREAT PENDULUM hangs from the dome's lantern over the
    // great globe's crown (the rotunda's floor lies under the globe: the crown is the place under the lantern): a
    // brass bob 9 m through on a wire some 60 m long, swinging 9 m to either hand once in some 16 s, ACROSS the hall's
    // own axis (in x, about a level axis along z: the same on every seed, whatever way is flown); its least distance
    // from the line over its whole swing is counted below (counts.least.pendulum). (p1m1, R3) The wire hangs from a
    // bronze boss held in the oculus by a spider of eight bronze stays from the oculus' ring. In every room of
    // the gallery two bronze LANTERNS hang on chains from the vault's two great ribs, 25 m and more over the line,
    // and sway a little (law ROCK); each sheds a pool on the floor under it.
    {
      const hm = new Geo({ movers: true, cap: 1 << 11 }), pr = OWN('pendulum'), hl = OWN('hangLamps');
      const pv = [0, heroY + HALL.top + HALL.domeH - 2, zG], bobY = heroY + 200, pph = pr(), psp = TAU / (TAU * Math.sqrt((pv[1] - bobY) / 9.81)), amp = 0.15;
      LAWS.rockOn(hm, pv, [0, 1], pph, psp, amp, 0);
      hm.set(C.brass, PAT.GOLD).tube([pv, [0, bobY + 6.9, zG]], 0.2, 3).lathe(0, bobY, zG, [[0, -6.6], [2.25, -4.8], [4.5, -0.3], [3.75, 2.7], [1.05, 5.1], [0.45, 7.2]], 10, { smooth: true });
      hm.set(C.bronze, PAT.BRONZE).torus(0, bobY + 0.6, zG, 4.57, 0.32, 12, 4);
      hm.move(null);
      // the bob's ball (4.9 m about its middle) at 48 clocks of one swing against the line
      { const q = [0, 0, 0], T = TAU / psp; for (let i = 0; i < 48; i++) { moverAt([0, bobY, zG], pv, [2, pph, psp, 0], [0, 1, amp, 0], T * i / 48, q); note('pendulum', gapTo(q[0], q[1], q[2]) - 4.9); } }
      // (p1m1, R3) the spider that holds the wire: a boss at the wire's head, eight stays to the oculus' ring (which
      // lies 24 m out at the dome's opening); they stand still (no mover on them), in the hall's own bronze
      { const yr = heroY + HALL.top + Math.sqrt(HALL.RR * HALL.RR - HALL.oculus * HALL.oculus) * HALL.domeH / HALL.RR;
        hm.set(C.bronze, PAT.BRONZE).lathe(0, pv[1], zG, [[0, -1.5], [0.9, -1], [1.3, 0], [0.9, 1], [0, 1.4]], 8, { smooth: true });
        for (let k = 0; k < 8; k++) { const a = (k + 0.5) * TAU / 8, cx = Math.cos(a), cz = Math.sin(a); hm.tube([[cx * 0.9, pv[1] + 0.3, zG + cz * 0.9], [cx * (HALL.oculus - 1), yr, zG + cz * (HALL.oculus - 1)]], 0.3, 3); note('spider', gapTo(cx * 12, pv[1], zG + cz * 12) - 0.3); } }
      for (const g of rooms) {
        const zm = -(g.i + 0.5) * RL, sp = RL / 3;
        for (const zz of [zm - sp / 2, zm + sp / 2]) {
          const ph = hl(), a = hl.range(0, TAU), spd = hl.range(0.6, 0.75), rock = hl.range(0.025, 0.04), top = HW + VR - 1.6, y = 54;
          LAWS.rockOn(hm, [0, top, zz], [Math.cos(a), Math.sin(a)], ph, spd, rock, 0);
          hm.set(C.bronze, PAT.BRONZE).tube([[0, top, zz], [0, y + 3.6, zz]], 0.13, 3).cone(0, y + 3.2, zz, 1.5, 1.1, 6, {}).cone(0, y - 0.9, zz, 0.5, 0.9, 6, { cap: false });
          hm.set(C.gold, PAT.LIGHT).lathe(0, y, zz, [[0.45, 0], [1.3, 0.9], [1.2, 2.5], [0.5, 3.2]], 6, { smooth: true, cap: false });
          hm.move(null);
          evePools.push([[0, 0.14, zz], [11, 0, 0], [0, 0, 11], [1, 0.62, 0.24], 0]);
          note('hangLamp', gapTo(0, y - 1, zz) - 2.2);
        }
      }
      add(meshOf(hm, mats.hallM, 'hallMovers', { sphere: [0, 40, zG / 2, 700] }));
    }
    await ctx.yield();
    // ------------------------------------------------------------ the grey city's, the front's and the shade's meshes
    grey.forEach((g, i) => add(meshOf(g, mats.grey, 'greyCity' + i)));
    add(meshOf(greyM, mats.greyM, 'greyMovers', { sphere: [0, 40, 100, 900] }));
    add(meshOf(front, mats.front, 'front'));
    add(meshOf(shade, mats.proxy, 'shade', { cast: true, receive: false }));
    await ctx.yield();
    // ------------------------------------------------------------ light painted on the faces it falls on: the warm
    // pool of every bracket lamp on its pier, the blue pool of every small globe on the floor under it (the rooms'
    // pedestal globes, the rotunda's alcove globes). Light only: nothing is darkened. The lamps' pools flicker and the
    // globes' pools shimmer on the world's clock, each from its own drawn phase.
    {
      for (const a of hero.anchors.alcoves) pool([a[0], a[1] - a[3] - 4.5 + heroY + 0.12, a[2] + zG], [a[3] * 2, 0, 0], [0, 0, a[3] * 2], [0.1, 0.3, 1.0], 1);
      const nLive = pools.length, er = OWN('lamps'); for (const p of evePools) pools.push(p);
      const n = pools.length, Pp = new Float32Array(n * 12), Q = new Float32Array(n * 8), Cc = new Float32Array(n * 12), D = new Float32Array(n * 8), I = new Uint32Array(n * 6), lr = R.lamps;
      pools.forEach((d, i) => {
        const [c, a, b, col, shim] = d, ph = i < nLive ? lr.range(0, TAU) : er.range(0, TAU);
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach((q, k) => { Pp.set([c[0] + a[0] * q[0] + b[0] * q[1], c[1] + a[1] * q[0] + b[1] * q[1], c[2] + a[2] * q[0] + b[2] * q[1]], i * 12 + k * 3); Q.set(q, i * 8 + k * 2); Cc.set(col, i * 12 + k * 3); D.set([shim, ph], i * 8 + k * 2); });
        I.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
      });
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); dg.setAttribute('aQ', new THREE.BufferAttribute(Q, 2)); dg.setAttribute('aC', new THREE.BufferAttribute(Cc, 3)); dg.setAttribute('aD', new THREE.BufferAttribute(D, 2)); dg.setIndex(new THREE.BufferAttribute(I, 1));
      const dm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, blending: THREE.AdditiveBlending,
        uniforms: { uT: tU, uK: { value: new THREE.Vector2(HR.lamp * 0.2, HR.blue * 0.75) } },
        vertexShader: 'attribute vec2 aQ; attribute vec3 aC; attribute vec2 aD; varying vec2 vQ; varying vec3 vC; varying vec2 vD; void main(){ vQ = aQ; vC = aC; vD = aD; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform float uT; uniform vec2 uK; varying vec2 vQ; varying vec3 vC; varying vec2 vD;
          void main(){ float rho = length(vQ), f = exp(-rho * rho * 3.4) * (1. - smoothstep(.75, 1., rho));
            float lampF = .92 + .08 * sin(uT * 6.1 + vD.y) * sin(uT * 2.3 + vD.y * 1.7), blueF = .8 + .2 * sin(uT * .8 + vD.y + vQ.x * 2.) * sin(uT * .47 + vD.y * 2.3 + vQ.y * 2.);
            gl_FragColor = vec4(vC * f * mix(uK.x * lampF, uK.y * blueF, vD.x), 1.); }` });
      const dmesh = new THREE.Mesh(dg, dm); dmesh.name = 'lightPools'; dmesh.renderOrder = 1; dmesh.frustumCulled = false; scene.add(dmesh);
    }
    await ctx.yield();
    // ------------------------------------------------------------ rain on the tall windows' panes, on a round of its
    // own (a drawn length and phase; every runnel's rate is a whole share of it, so the whole glass comes round), and
    // the light that falls in through the windows of the sun's hand, standing in the room's air as soft shafts
    {
      const rr = R.rain, rainT = rr.range(22, 30), rainP = rr(), n = panes.length, Pp = new Float32Array(n * 12), U = new Float32Array(n * 12), I = new Uint16Array(n * 6);
      panes.forEach((p, i) => {
        const [a, b, top] = p, w = Math.hypot(b[0] - a[0], b[2] - a[2]), h = top - a[1], o = rr.range(0, 97);
        [[a, 0, 0], [b, 1, 0], [b, 1, 1], [a, 0, 1]].forEach(([q, u, v], k) => { Pp.set([q[0], a[1] + h * v, q[2]], i * 12 + k * 3); U.set([u * w + o, v * h, o], i * 12 + k * 3); });
        I.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6);
      });
      const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); rg.setAttribute('aU', new THREE.BufferAttribute(U, 3)); rg.setIndex(new THREE.BufferAttribute(I, 1));
      const rm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        uniforms: { uT: tU, uR: { value: new THREE.Vector2(1 / rainT, rainP) }, uC: { value: new THREE.Color().setRGB(HR.pane[0], HR.pane[1], HR.pane[2]).multiplyScalar(night ? 3 : 1.1) } },
        vertexShader: 'attribute vec3 aU; varying vec3 vU; void main(){ vU = aU; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: `uniform float uT; uniform vec2 uR; uniform vec3 uC; varying vec3 vU;
          float h1(float n){ return fract(sin(n * 127.1) * 43758.5453); }
          void main(){ float col = floor(vU.x / .55), fx = fract(vU.x / .55) - .5, k = 1. + floor(h1(col) * 3.), len = 5. + 9. * h1(col + 31.);
            float head = fract(uT * uR.x * k + uR.y + h1(col + 7.)) * 60. - 12., d = vU.y - (48. - head);
            float run = smoothstep(0., .5, d) * (1. - smoothstep(len * .2, len, d)) * exp(-fx * fx * 60.);
            float bead = exp(-(d * d * 3. + fx * fx * 40.));
            gl_FragColor = vec4(uC * (.04 + .5 * run + .9 * bead), 1.); }` });
      const rmesh = new THREE.Mesh(rg, rm); rmesh.name = 'rain'; rmesh.renderOrder = 2; rmesh.frustumCulled = false; scene.add(rmesh);
    }
    await ctx.yield();
    {
      // the shafts: from each window of the sun's hand three upright sheets of lit air, along the light's own way
      // (they stand where the light stands: the hour's, the same all visit). ONE RULE FOR EVERY WINDOW OF EVERY ROOM:
      // a shaft ends where its light meets the floor or the iron screen at its room's end (light does not go through
      // iron), and it thins with its own distance from its window to nothing SHAFT metres from it in plan: the room
      // is 96 m wide and a shaft is spent 20 m short of the room's middle. So the middle third of every room holds
      // no sheet at any hour; the light that goes on lies on the floor and the far wall as the sun's own patches.
      const SHAFT = WR - 20, NS = 6, d = [-sunDir.x, -sunDir.y, -sunDir.z], hz = Math.max(Math.hypot(d[0], d[2]), 1e-6), dn = Math.max(-d[1], 0.05);
      const hs = Math.sign(sunDir.x) || 1, list = panes.filter((p) => p[3] === hs), n = list.length * 3;
      const Pp = new Float32Array(n * 12), U = new Float32Array(n * 8), I = new Uint16Array(n * 6);
      let i = 0, nearest = 1e9, longest = 0;
      for (const [a, b, top] of list) for (const t of [1 / 6, 1 / 2, 5 / 6]) {
        const x = lerp(a[0], b[0], t), z = lerp(a[2], b[2], t), y0 = a[1], room = clamp(Math.floor(-z / RL), 0, nRooms - 1);
        // the plan reach at which the light is spent, meets the floor, or meets the screen at the room's end
        const zEnd = d[2] > 0 ? (room ? -room * RL - 2.5 : -4) : -(room + 1) * RL + 2.5, rz = Math.abs(d[2]) > 1e-6 ? Math.max(0, (zEnd - z) / d[2]) * hz : 1e9;
        const rEnd = Math.min(SHAFT, top / dn * hz, rz); longest = Math.max(longest, rEnd);
        // one sheet: from the window's height to the light's height at its end (the floor at the lowest)
        const k = rEnd / hz, ex = x + d[0] * k, ez = z + d[2] * k, yb1 = Math.max(y0 - dn * k, 0.3), yt1 = Math.max(top - dn * k, 0.3), o = i * 4;
        Pp.set([x, y0, z, x, top, z, ex, yb1, ez, ex, yt1, ez], o * 3); U.set([0, 0, 0, 1, 1, 0, 1, 1], o * 2); I.set([o, o + 1, o + 3, o, o + 3, o + 2], i * 6);
        for (let j = 0; j <= NS; j++) { const f = j / NS, px = lerp(x, ex, f), pz = lerp(z, ez, f), yb = lerp(y0, yb1, f), yt = lerp(top, yt1, f); nearest = Math.min(nearest, gapTo(px, yb, pz), gapTo(px, yt, pz), gapTo(px, (yb + yt) / 2, pz)); }
        i++;
      }
      if (n) note('shaft', nearest); counts.shafts = { sheets: n, reach: SHAFT, longest };
      const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(Pp, 3)); sg.setAttribute('uv', new THREE.BufferAttribute(U, 2)); sg.setIndex(new THREE.BufferAttribute(I, 1));
      const sm = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
        uniforms: { uC: { value: new THREE.Color(HR.light).multiplyScalar(0.05 * HR.sun * (night ? 0.5 : 1)) } },
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }',
        fragmentShader: 'uniform vec3 uC; varying vec2 vUv; void main(){ float a = sin(3.14159 * vUv.y); gl_FragColor = vec4(uC * a * a * (1. - smoothstep(.25, 1., vUv.x)) * smoothstep(0., .04, vUv.x), 1.); }' });
      if (n) { const smesh = new THREE.Mesh(sg, sm); smesh.name = 'shafts'; smesh.renderOrder = 2; smesh.frustumCulled = false; scene.add(smesh); }
    }
    await ctx.yield();
    // ------------------------------------------------------------ life on the world's clock
    // pigeons wheel round the porch's pediment (the roost: its apex; the round's radius is the pediment's own half
    // depth and a wing more, its height a round's radius over the apex); gulls wheel round the harbour light inside
    // the great globe, about its shaft 9 m over the basin, on a round of 9 m radius; (polish round 1) a third flock,
    // pigeons, wheels low over one yard of the forecourt (which yard: its own stream's draw). (p1m1, R9) The yard's
    // open air is 18.7 m wide (the stair's cheek wall to the houses' cornices) by 37 m (the porch to the plateau),
    // over the lamps' tops. (p1m3, M2) The yard's flock has a natural spread again (2.6, 1.8, 3 for birds of 1 m,
    // as live's gulls have 3, 2, 3 for birds of 0.8): its birds stand apart as live's do. That air is too narrow
    // for a broad wheel beside such a spread, so the wheel is a small one (2.8 m, about the middle of the air) and
    // the birds go round it at 4 m a second (the kit's 12 would spin so small a wheel once in a second and a
    // half). THE WHOLE REACH (the wheel as the kit baked it, every bird's dealt place within maxSigma 3, the
    // wander's box, the bird's own ball) keeps a metre and more from the cheek wall's cap, the houses' cornices,
    // the porch's piers and beam, the plateau and the lamps' tops, on each axis by place, read from the made
    // flock as it hangs in the scene (counts.flocks.yard.clear and .reach).
    // EVERY FLOCK'S BOUND IS COUNTED BY THE KIT'S MEASURE (counts.flocks): the kit sets each bird off its course by
    // a scatter of 0.45 of the spread on each axis (across and along by the spread's first measure, in height by its
    // second) and lets it wander in a box of 1.5 times the wander's first measure across, its second in height and
    // its third along. So a bird keeps within reach = the far corner of (three scatters and the wander's box, on
    // each axis) and its own ball, of the course AS THE KIT BAKED IT (the route's own points); least is the least
    // distance from the flown line to that course, less the reach. The bar is 2.5 m. Each call hands the kit its own
    // wander and spread, written out, and maxSigma 3; no keepClear is asked, each course being laid off the line.
    // Dust stands in the gallery's light (a field that stands where it is)
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    await ctx.yield();
    const apex = [0, PH + 22, PZ / 2 + 2.5], pigR = (PZ + 9) / 2 + 2, pig = [apex[0], apex[1] + pigR, apex[2]];
    const hbA = hero.anchors.harbour, gulR = 9, hb = hW([hbA.x, hbA.y + 9, hbA.z]);
    const pigO = { radius: pigR, wobble: 0.2, spread: [8, 4, 5], wander: [1.5, 1, 1.5, 0.3] }, gulO = { radius: gulR, wobble: 0.15, spread: [3, 2, 3], wander: [1, 0.8, 1, 0.3] };
    const flk = {};
    flk.pigeons = [F.makeFlock({ rng: R.pigeons, species: 'gulls', count: Math.round(15 * density), size: 2.6, center: pig, height: 6, maxSigma: 3, ...pigO }), pigO, 2.6, pig];
    await ctx.yield();
    flk.gulls = [F.makeFlock({ rng: R.gulls, species: 'gulls', count: Math.round(9 * density), size: 0.8, center: hb, height: 3, maxSigma: 3, ...gulO }), gulO, 0.8, hb];
    await ctx.yield();
    const yr = OWN('yardPigeons'), yard = [(yr.chance(0.5) ? 1 : -1) * 53.85, 15, 41], yardO = { radius: 2.8, wobble: 0.1, speed: 4, spread: [2.6, 1.8, 3], wander: [0.4, 0.3, 0.4, 0.3] };
    flk.yard = [F.makeFlock({ rng: yr, species: 'gulls', count: Math.round(12 * density), size: 1, center: yard, height: 1, maxSigma: 3, ...yardO }), yardO, 1, yard];
    // each flock's reach by the kit's measure (see above), and its bound against the line on the kit's own course
    const flockBox = (o, size) => Math.hypot(3 * 0.45 * o.spread[0] + 1.5 * o.wander[0], 3 * 0.45 * o.spread[1] + o.wander[1], 3 * 0.45 * o.spread[0] + o.wander[2]) + 1.32 * 1.12 * size;
    counts.flocks = {};
    for (const k in flk) { const [f, o, size, c] = flk[k], D = f.route.data, st = D.length / f.route.N; let far = 1e9; for (let i = 0; i < f.route.N; i++) far = Math.min(far, gapTo(D[i * st], D[i * st + 1], D[i * st + 2])); fauna.add(f); counts.flocks[k] = { center: c, radius: o.radius, box: flockBox(o, size), course: far, least: far - flockBox(o, size) }; }
    // every flock's course as the kit baked it, as a box
    for (const k in flk) { const [f] = flk[k], D = f.route.data, st = D.length / f.route.N, bb = [1e9, -1e9, 1e9, -1e9, 1e9, -1e9]; for (let i = 0; i < f.route.N; i++) for (let a = 0; a < 3; a++) { const p = D[i * st + a]; bb[a * 2] = Math.min(bb[a * 2], p); bb[a * 2 + 1] = Math.max(bb[a * 2 + 1], p); } counts.flocks[k].courseBox = bb; }
    // (p1m3, M2; rule text V) THE YARD FLOCK'S WHOLE REACH BY PLACE, read from the made flock as it hangs in the
    // scene: every point of the baked course (through the object's own matrix), with every bird's dealt place and
    // its own ball by its size as instanced, and the wander's box, on each axis. Against the yard's air: the cheek
    // wall's cap (x 44.5), the houses' cornices (63.2), the porch's piers (z 19.9; the porch's beam stands over
    // them from 58 m up), the plateau (60), the lamps' tops (6.65 m up). clear is the least of the six.
    { const [f, , , c] = flk.yard, g = f.geometry, iA = g.attributes.iA.array, iB = g.attributes.iB.array, D = f.route.data, st = D.length / f.route.N, wr = f.reach.wander, s = Math.sign(c[0]), lo = [1e9, 1e9, 1e9], hi = [-1e9, -1e9, -1e9], p = new THREE.Vector3();
      let big = 0; for (let i = 0; i < g.instanceCount; i++) big = Math.max(big, iB[i * 4]);
      f.object.updateWorldMatrix(true, false);
      for (let j = 0; j < f.route.N; j++) { p.set(D[j * st], D[j * st + 1], D[j * st + 2]).applyMatrix4(f.object.matrixWorld); const q = [p.x, p.y, p.z];
        for (let i = 0; i < g.instanceCount; i++) { const o = [iA[i * 4], iA[i * 4 + 1], iB[i * 4 + 3]], b = f.reach.body * iB[i * 4] / big; for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], q[a] + o[a] - wr[a] - b); hi[a] = Math.max(hi[a], q[a] + o[a] + wr[a] + b); } } }
      const x0 = s > 0 ? lo[0] : -hi[0], x1 = s > 0 ? hi[0] : -lo[0];
      counts.flocks.yard.reach = [x0, x1, lo[1], hi[1], lo[2], hi[2]]; counts.flocks.yard.asMade = f.object.matrixWorld.equals(new THREE.Matrix4());
      counts.flocks.yard.clear = Math.min(x0 - 44.5, 63.2 - x1, lo[2] - 19.9, 60 - hi[2], lo[1] - 6.65, 58 - hi[1]); }
    // (R8) every flag (its pole and its cloth's whole sweep, as a box) against every flock's course box, less the reach
    { let m = 1e9; for (const [fx, fy, fz, ht, len] of FLAGS) for (const k of ['pigeons', 'yard']) { const bb = counts.flocks[k].courseBox, [, o, size] = flk[k];
        m = Math.min(m, Math.hypot(Math.max(bb[0] - fx - len - 0.5, fx - len - 0.5 - bb[1], 0), Math.max(bb[2] - fy - ht - 1, fy - bb[3], 0), Math.max(bb[4] - fz - len - 0.5, fz - len - 0.5 - bb[5], 0)) - flockBox(o, size)); }
      counts.flagClear = m; }
    await ctx.yield();
    const motes = fx.makeParticles({ rng: R.motes, preset: 'dust', time: tU, follow: false, center: [0, 28, -Lg / 2], box: [88, 50, Lg], count: Math.round(2800 * density), colors: ['#ffffff', '#fff0d0', '#cfe6ff'], size: [0.07, 0.17], intensity: night ? 0.5 : 0.9 });
    scene.add(motes.object);
    // (polish round 1) dust in the beams from the tall panes: a second field of motes, warm, that stands in the 30 m of
    // the gallery's air next the windows of the light's hand, where the shafts stand (a field by place)
    const beamDust = fx.makeParticles({ rng: OWN('beamDust'), preset: 'dust', time: tU, follow: false, center: [(Math.sign(sunDir.x) || 1) * (WR - 15), 24, -Lg / 2], box: [30, 44, Lg], count: Math.round(500 * density), colors: ['#ffe2b0', '#ffd0a0', '#fff4e0'], size: [0.08, 0.2], intensity: night ? 0.6 : 1.5 });
    scene.add(beamDust.object);
    // (p1m1, O1) no field of round white discs stands over the harbour any more (live's mist is struck: nothing over
    // the water may be taken for snow in a globe); the stream R.mist is still forked above, and draws nothing
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    // ------------------------------------------------------------ the lane round the route, counted on this seed's own
    // layout in the world's own coordinates (the route every 2 m; the part's city was tested on its own way in build)
    {
      const ring = (x, y, z, rad, n = 96) => { let b = 1e9; for (let i = 0; i < n; i++) { const a = i / n * TAU; b = Math.min(b, gapTo(x + rad * Math.cos(a), y, z + rad * Math.sin(a))); } return b; };
      for (const a of hero.anchors.alcoves) note('alcoveGlobe', gapTo(a[0], a[1] + heroY, a[2] + zG) - a[3]);
      await ctx.yield();
      note('galleryRail', Math.min(ring(0, 2.5, zG, HALL.rail, 256), ring(0, 5.5, zG, HALL.rail, 256)) - 0.6);
      await ctx.yield();
      // the crown's ring: its bore, and the least distance from the line that goes through its middle
      const ringR = GLOBE.crown + 0.02 * RG, ringT = 0.028 * RG;
      counts.bore = 2 * (ringR - ringT); counts.bowl = hero.anchors.bowl;
      note('crownRing', ring(0, G.y + INSIDE.ringY, zG, ringR) - ringT);
      // the crystal of the great globe, away from the opening in its crown (there the ring is the nearest thing)
      const hole = Math.asin(GLOBE.crown / RG);
      for (const p of line) { const dx = p[0] - G.x, dy = p[1] - G.y, dz = p[2] - G.z, d = Math.hypot(dx, dy, dz); if (Math.acos(clamp(dy / Math.max(d, 1e-6), -1, 1)) > hole * 1.05) note('greatCrystal', Math.abs(d - RG)); }
      await ctx.yield();
      const bl = hero.anchors.blocks;
      for (let i = 0; i < bl.length; i++) { const b = bl[i]; let m = 1e9; for (const p of line) { const dxz = Math.max(0, Math.hypot(p[0] - b[0], p[2] - zG - b[1]) - b[2]), dy = Math.max(0, p[1] - heroY - b[3]); m = Math.min(m, Math.hypot(dxz, dy)); } note('cityBlock', m); if (i % 60 === 59) await ctx.yield(); }
      // (the towers alone, by the same measure: counts.least.cityTower; counts.towerGaps: each tower's least distance
      // and the line's metre there)
      counts.towerGaps = [];
      for (const b of hero.anchors.towersAt) { let m = 1e9, at = 0; for (const p of line) { const dxz = Math.max(0, Math.hypot(p[0] - b[0], p[2] - zG - b[1]) - b[2]), dy = Math.max(0, p[1] - heroY - b[3]), d = Math.hypot(dxz, dy); if (d < m) { m = d; at = p[3]; } } note('cityTower', m); counts.towerGaps.push([m, at]); }
      // the small turning globe on its plinth in the square, under the avenue's line: under the lane's test like
      // every other thing (were it nearer than the lane it would not be shown)
      const pl = hero.anchors.plinth, dP = gapTo(pl[0], pl[1] + heroY, pl[2] + zG) - pl[3]; note('plinthGlobe', dP);
      if (dP < LANE) { const o = hero.object.getObjectByName('plinth'); if (o) o.visible = false; drop('plinthGlobe'); }
      await ctx.yield();
      // the arches between the rooms: their piers, and the arch itself over the line
      for (const g of rooms) {
        const lastA = g.i === nRooms - 1, hw = lastA ? HALL.door.w / 2 : 43, sp = lastA ? HALL.door.s : 26, z1 = -(g.i + 1) * RL;
        for (const sg of [-1, 1]) note('archPier', gapBox(sg * (hw + 2.5), z1, 2.5, 4.3, 0, sp + 4));
        for (let j = 0; j <= 20; j++) { const a = Math.PI * j / 20; note('arch', gapTo(-hw * Math.cos(a), sp + hw * Math.sin(a), z1)); }
      }
      await ctx.yield();
      // the front: the door's folded leaves, its jambs and its arch, the porch's piers and its entablature
      // the door: its folded leaves, its jambs (the wall either side of the opening), the porch's inner piers, the
      // arch's soffit through the wall's whole thickness
      for (const sg of [-1, 1]) { note('doorLeaf', gapBox(sg * LEAF, 5.4, 3.3, 1.6, 0, 30)); note('doorJamb', gapBox(sg * (DOOR.w / 2 + FW) / 2, WALL.z, (FW - DOOR.w / 2) / 2, WALL.t / 2, 0, FH)); note('porchPier', gapBox(sg * PIERS[0], PZ, 4.2, 4.2, 0, PH)); }
      for (let j = 0; j <= 20; j++) { const a = Math.PI * j / 20; for (const zz of [WALL.z - WALL.t / 2, WALL.z, WALL.z + WALL.t / 2]) note('doorArch', gapTo(-DOOR.w / 2 * Math.cos(a), DOOR.s + DOOR.rise * Math.sin(a), zz)); }
      note('porchBeam', gapBox(0, PZ / 2 + 2.5, 63, PZ / 2 + 4.5, PH, PH + 22));
      counts.door = Math.min(counts.least.doorLeaf, counts.least.doorJamb, counts.least.porchPier, counts.least.doorArch, counts.least.porchBeam);
      for (const p of lampsAt) note('roomLamp', gapTo(p[0], p[1], p[2]) - 1.2);
      await ctx.yield();
      // the rotunda where the line comes into it through the door bay: the dome's springing ring over it, the two
      // piers of the bay, the bronze fascias of the bays at either hand
      note('domeRing', ring(0, heroY + HALL.top, zG, HALL.RR, 256) - 3.2);
      { const hb2 = Math.PI / HALL.bays;
        for (const sg of [-1, 1]) {
          for (let rr = 150; rr <= 173; rr += 4) for (let yy = 0; yy <= heroY + HALL.top; yy += 6) note('hallPier', gapTo(sg * Math.sin(hb2) * rr, yy, zG + Math.cos(hb2) * rr) - 3.5);
          for (let k = 0; k <= 8; k++) { const a = hb2 * (1 + 2 * k / 8); for (let yy = 31; yy <= heroY + HALL.top; yy += 4) note('hallFascia', gapTo(sg * Math.sin(a) * 150.6, yy, zG + Math.cos(a) * 150.6)); }
        } }
      // the street: the viaduct's deck, the fountain and its lamps, the stair's cheek walls and their lamps
      note('viaduct', gapBox(0, VZ, 450, 4.75, vy - 4.2, vy + 4.1));
      note('fountain', gapBox(0, STAIR[0] + 20, 18.5, 18.5, STREET, STREET + 11.5));
      for (const sg of [-1, 1]) note('stairLamp', gapBox(sg * 40, (STAIR[0] + STAIR[1]) / 2, 4.5, 18, 0, STREET + 16));
    }
    await ctx.yield();
    // ------------------------------------------------------------ the flight: its pace and its pulls, laid at places
    // Places of the route in metres from the start, found on this seed's own line. ONE length of the place eases
    // every change of pace and every pull's rise, fall and hand-over: HAND, the stair's own length along the line
    // (from its head to its foot). One ramp is longer, because it is made where the flight is at its fastest: the
    // slowing from the street's pace to the stair's runs between two places, from the viaduct to the stair's head.
    // Every ramp lasts 1.65 s and more AS FLOWN (counted on the film as it runs, after it is held to 50 s;
    // counts.route.ramps names each ramp's two metres).
    const after = (m0, fn) => mWhere((p) => p[3] >= m0 && fn(p));
    const mHead = after(0, (p) => p[2] <= STAIR[0]), mFoot = after(0, (p) => p[2] <= STAIR[1]), HAND = mFoot - mHead;
    const mVia = after(0, (p) => p[2] <= VZ), mSill = after(0, (p) => p[2] <= 0), mThresh = after(0, (p) => p[2] <= -Lg);
    const mShoulder = after(mThresh, (p) => Math.hypot(p[0] - G.x, p[2] - G.z) <= RG);
    const w0 = hW(hero.anchors.way[0]), mDive = mAt(w0[0], w0[1], w0[2]), mRing = mAt(G.x, G.y + INSIDE.ringY, G.z);
    const tc = hW([hero.anchors.turn.x, 0, hero.anchors.turn.z]), mTurn = after(mRing, (p) => Math.hypot(p[0] - tc[0], p[2] - tc[2]) <= INSIDE.turn + 0.4);
    const portalAt = new THREE.Vector3(...hW([hero.anchors.portal.x, hero.anchors.portal.y, hero.anchors.portal.z])), aDir = hero.anchors.avenueDir;
    const join = [portalAt.x - aDir[0] * (INSIDE.end - INSIDE.join), portalAt.z - aDir[1] * (INSIDE.end - INSIDE.join)];
    const mAve = after(mTurn + 20, (p) => (p[0] - join[0]) * aDir[0] + (p[2] - join[1]) * aDir[1] >= 0 && Math.abs((p[0] - join[0]) * aDir[1] - (p[2] - join[1]) * aDir[0]) < 3);
    // speeds in metres a second AS TYPED, each taken up from its place on over its ramp: over the street; from the
    // viaduct slowing to the stair's pace, reached at the stair's head; slow from the stair's foot in through the door
    // and the rooms; from the last arch out over the rotunda; slower from over the great globe's shoulder; slowest
    // from the crown's ring down into the city and round the harbour; an even pace from the avenue's start to the
    // ring in the arch. AS FLOWN every speed is a little more: the film's length by these speeds
    // (counts.route.seconds) is over 50 s and the film is held to 50 s, so each flown speed is the typed one times
    // seconds / 50 (counts.route.flown gives both). On seeds 1 to 100 the film by the typed speeds is 54.9 to 55.9 s,
    // so every speed is flown 10 to 12 in 100 faster: the street's 27 at 29.7 to 30.2, the stair's 19.2 at 21.1 to
    // 21.5, the rooms' 18.4 at 20.2 to 20.6, the rotunda's 17.5 at 19.2 to 19.6, the shoulder's 13.2 at 14.5 to
    // 14.8, the ring's and the harbour's 10.8 at 11.9 to 12.1, the avenue's 18 at 19.8 to 20.1.
    const V = [[0, 27, HAND, 'entry'], [mVia, 19.2, mHead - mVia, 'viaduct'], [mFoot, 18.4, HAND, 'stairFoot'], [mThresh, 17.5, HAND, 'lastArch'], [mShoulder, 13.2, HAND, 'shoulder'], [mRing, 10.8, HAND, 'ring'], [mAve, 18, HAND, 'avenueStart']];
    const vAt = (m) => { let v = V[0][1]; for (let i = 1; i < V.length; i++) v = lerp(v, V[i][1], smoothstep(V[i][0], V[i][0] + V[i][2], m)); return v; };
    let secs = 0; for (let m = 1; m < Lr; m += 2) secs += 2 / vAt(m);
    const duration = clamp(secs, 36, 50), vMean = Lr / secs;
    await ctx.yield();
    // a pull's window in metres: it rises over its first HAND metres and falls over its last
    const ramps = V.slice(1).map((k) => ['pace ' + k[3], k[0], k[0] + k[2]]);
    const pull = (name, at, m0, m1, weight) => { const fade = clamp(HAND / Math.max(m1 - m0, 1), 0.05, 0.5), len = fade * (m1 - m0); ramps.push([name + ' rise', m0, m0 + len], [name + ' fall', m1 - len, m1]); return { at, from: uM(m0), to: uM(m1), weight, fade }; };
    const pois = [], _h = new THREE.Vector3();
    // each room's globe takes the gaze until it is abeam (the place where the line is nearest its middle); over the
    // HAND metres before that place the gaze leaves it for the next room's globe, which stands ahead on the other
    // hand. The first rises from the stair's head and is full at the stair's foot: its globe shows in the open door.
    let m0 = mHead; const ends = [];
    for (const g of globesAt) { const e = g[5]; ends.push(e); pois.push(pull('room' + ends.length, new THREE.Vector3(g[0], g[1], g[2]), m0, e, 0.42)); m0 = e - HAND; }
    // the great globe (a point 10 m over its middle: the heart of its city) takes the gaze from the last room's globe
    // and holds it out over the rotunda until the flight is over the globe's shoulder
    pois.push(pull('greatGlobe', new THREE.Vector3(G.x, G.y + 10, G.z), m0, mShoulder, 0.75));
    // over the HAND metres before the shoulder the harbour light takes the gaze, at a point on its shaft 10 m over the
    // basin's water, in one long fall (no pull of the ring's own: the gaze does not lift before the dive). The line
    // goes through the ring's middle and the gaze through the ring down at the harbour: down the dive the eye looks
    // into the harbour, and round it the eye looks inward and down, on the light, the water and the quays with the
    // city beyond, until the avenue's start
    const lt = hW([hero.anchors.harbour.x, hero.anchors.harbour.y + 10, hero.anchors.harbour.z]);
    pois.push(pull('harbourLight', new THREE.Vector3(lt[0], lt[1], lt[2]), mShoulder - HAND, mAve, 0.75));
    counts.route = { length: Lr, seconds: secs, HAND, ramps, flown: V.map((k) => [k[3], k[1], k[1] * secs / duration]), places: { viaduct: mVia, stairHead: mHead, stairFoot: mFoot, frontSill: mSill, lastArch: mThresh, shoulder: mShoulder, diveStart: mDive, ring: mRing, turnStart: mTurn, avenueStart: mAve }, pullEnds: ends,
      hook, hookA: hookA / DEG, Rb, SO, climb: aC / DEG, rooms: nRooms, kinds: roomKinds, hour: hourName, rare, shelfGlobes: shelfN.n, sun: [sunDir.x, sunDir.y, sunDir.z], portalGap: portalAt.distanceTo(path.posAtDist(Lr, _v)) };
    return {
      scene, path, duration, pace: (u) => vAt(u * Lr) / vMean,
      camera: { fov: 62, near: 0.3, far: 5200, lookAhead: 16, sway: 0, bank: 0 },
      pois,
      portal: { shape: 'circle', radius: 7, color: '#bfe4ff', glow: 1.15 },
      post: { exposure: HR.exposure, bloom: { strength: night ? 0.38 : 0.32, radius: 0.6, threshold: 0.95 }, grade: { saturation: 1.06, contrast: 1.05, tint: '#ffffff', shadowTint: night ? '#04060e' : '#05060a', vignette: 0.26, grain: 0.02, aberration: 0 } },
      counts,
      update(dt, time, camera, u) {
        tU.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera);
        hero.update(dt, time);
        fauna.update(dt, time, camera, u);
        motes.update(dt, time, camera); beamDust.update(dt, time, camera);
      },
      dispose() { sky.dispose?.(); },
    };
  },
};
