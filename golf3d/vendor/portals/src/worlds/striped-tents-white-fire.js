// Striped Tents Round a White Fire
// Night, always. A dark meadow of fields, hedges and a far wood lies under the moon. In it an iron fence stands in a
// circle with its gate open, and inside the fence black and white striped tents stand ring within ring, small white
// lights scattered over their cloth. In the middle a fire of white flame burns in an iron hearth. A clock that is never
// still stands in the lane between the gate and the fire. One long tent holds a garden made wholly of ice; the tallest
// tent holds cloud standing in steps up to its open crown; on the far side a bare black tree covered in candles stands
// up through a ring of canvas, and the portal hangs in its fork. Nothing has any colour but a scrap of red on a few
// far visitors. Here and there a tent's lights nap and wake by the world clock, whoever is or is not there.
//
// The place itself (tents, fence, gate, ground, fire, meadow, and the builders of the clock, the garden of ice, the
// cloud steps, the candle tree and the visitors) lives in src/parts/striped-tents-white-fire.js; this file lays the
// sky, the air, the route's looks and its pace, every one of them found from the places.
//
// DECLARED PACING: the looks and the pace go by metres flown along the route, between named places, and by nothing
// else. Five looks, one leading at a time: the fire (round the courtyard), the clock (down its lane), the fountain (in
// the garden of ice), the way out of the cloud steps' crown and the camp under the moon (one look: from under the
// roof's third rib short of the hoop to the hoop's plane the gaze goes up and out through the open round, to a place
// over the hoop's rim on the moon's side, so that the round of sky with the moon, the mast's head and the lamps of
// the rim stands in the middle and the cloth is its frame; from the hoop's plane on it comes down, at an even turn,
// onto a place over the roofs of the inner ring midway between the crown's side and the moon's, so that the lit camp
// lies under the moon with the fire beside), and the fire's column from above (it takes over on the high turn as
// the fire comes round ahead, and is let go where the fire stands abeam of the last straight). Nothing in the world
// begins, turns or ends by them.
import * as THREE from 'three';
import { clamp, lerp, smoothstep, makePath } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { buildHero, buildClock, buildGardenOfIce, buildCloudSteps, buildCandleTree, buildVisitors, buildMeadow, fallingSnow, routePoints, routeOf, makeLight, stream, PLACES, FIRE, at } from '../parts/striped-tents-white-fire.js';

const RAD = Math.PI / 180, TAU = Math.PI * 2;

export default {
  id: 'striped-tents-white-fire',
  name: 'Striped Tents Round a White Fire',
  category: 'books',
  placeKind: 'bizarre',
  book: 'The Night Circus',
  author: 'Erin Morgenstern, born 1978',
  media: ['air'],
  weirdness: 0.6,
  async build(ctx) {
    const scene = new THREE.Scene(), vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1, P = PLACES;
    // every stream of draws this file takes, in one list (the part's builders list their own at their heads)
    const forks = { sky: stream(ctx, 'sky'), moths: stream(ctx, 'moths'),
      snow: stream(ctx, 'snow from a flap'), feathers: stream(ctx, 'feathers from a flap'), fall: stream(ctx, 'falling snow'), stars: stream(ctx, 'falling stars'), flicker: stream(ctx, 'fire flicker') };

    // ------------------------------------------------------------ how far the night has gone
    // early: just after nightfall, a pearl-grey band low behind the gate, few stars; deep: the night as written;
    // late: the last hour, the moon low and large, long shadows, mist to the eaves in the meadow, one edge of the sky paling.
    const hour = vary.hour === 'golden' || vary.hour === 'day' ? 'early' : vary.hour === 'dawn' ? 'late' : 'deep';
    const wind = clamp(vary.mood ?? 0.5, 0, 1), snowing = !!vary.rare, dens = vary.density ?? 1;
    const moonEl = hour === 'late' ? 12 : 28, moonAz = 130, gateAz = Math.atan2(P.gate[0] - FIRE[0], -(P.gate[1] - FIRE[1])) / RAD;
    await ctx.yield();
    const SK = {
      early: { zenith: '#161d2b', mid: '#232c3c', horizon: '#56606e', scatterColor: '#b9c0c8', scatter: 0.55, scatterPow: 5, sunAzimuth: gateAz, stars: 0.3, starDensity: 0.2 },
      deep: { zenith: '#1c2330', mid: '#273144', horizon: '#445068', scatterColor: '#59647a', scatter: 0.25, scatterPow: 4, sunAzimuth: moonAz, stars: 0.7, starDensity: 0.32 },
      late: { zenith: '#151b27', mid: '#202836', horizon: '#3a4352', scatterColor: '#9aa3ad', scatter: 0.5, scatterPow: 6, sunAzimuth: moonAz + 170, stars: 0.5, starDensity: 0.26 },
    }[hour];
    const sky = makeSky({
      rng: forks.sky, preset: 'night', ...SK, ground: SK.horizon, horizonPow: 3, scatterHigh: 0.05, sunElevation: -8, sunColor: '#dfe6f2', cloudLightColor: '#dfe6f2', milkyWay: 0, starColor: 0.15,
      bodies: [{ elevation: moonEl, azimuth: moonAz, size: hour === 'late' ? 2.9 : 1.7, phase: 1, color: '#eef2f8', color2: '#aeb7c6', texture: 0.45, intensity: 1.25, glow: 0.22, glowColor: '#aeb7c6', glowSize: 4 }],
      key: 0, lightElevationMin: 10, clouds: false, clouds2: { coverage: 0.34, stretch: 1, opacity: 0.4, lit: '#9aa3b2', shade: '#2a303b', wind: [0.006 + 0.012 * wind, 0.003] },
      lightColor: '#dfe6f2', lightIntensity: 1.6, ambientColor: '#4a5568', groundLight: '#1c2024', ambientIntensity: 1.0, fogColor: '#2b3443',
      bake: false, renderer: ctx.renderer, quality: 0.5, renderOrder: 1000,
    });
    scene.add(sky.object);
    await ctx.yield();
    const rig = makeLightRig(sky, { intensity: 1, ambient: 1.6 });
    scene.add(rig.object);
    const fogCol = new THREE.Color(hour === 'early' ? '#343d4b' : '#2b3443');
    scene.fog = new THREE.FogExp2(fogCol, 1 / 900);
    const moonDir = (sky.bodyDirections && sky.bodyDirections[0] ? sky.bodyDirections[0] : sky.lightDirection).clone().normalize();
    const light = makeLight({ moonDir, wind, snow: snowing, fire: 1.6, fog: '#' + fogCol.getHexString(), fogDensity: 1 / 900, phases: [0, 1, 2, 3].map(() => forks.flicker() * TAU) });
    await ctx.yield();

    // ------------------------------------------------------------ the place and the flight
    const laid = routePoints(), path = makePath(laid.pts);
    await ctx.yield();
    const route = routeOf(path, laid), LEN = path.length;
    await ctx.yield();
    const hero = await buildHero(ctx, { light, route, vary, early: hour === 'early' });
    scene.add(hero.object);
    await ctx.yield();
    const things = [hero], M = hero.metres, U = (m) => clamp(m / LEN, 0, 1);
    // the clock: its face pale early in the night, a deep grey in the deep of it, black in the last hour; one tone for a visit
    const clock = await buildClock(ctx, light, { face: hour === 'early' ? 0.8 : hour === 'late' ? 0.012 : 0.1, route, span: [M.gap2, M.flapA] });
    const mClock = route.metreNear(clock.at[0], clock.at[1], M.gap2, M.flapA);
    scene.add(clock.object);
    const garden = await buildGardenOfIce(ctx, light, { tent: hero.lay.garden, route, density: dens });
    scene.add(garden.object); things.push(garden);
    const steps = await buildCloudSteps(ctx, light, { tent: hero.lay.steps, route, density: dens, moonDir });
    scene.add(steps.object); things.push(steps);
    const tree = await buildCandleTree(ctx, light, { route, density: dens });
    scene.add(tree.object);
    const visitors = await buildVisitors(ctx, light, { route, tents: hero.lay.tents, within: hero.lay.steps, floorTop: 0.9, density: dens });
    scene.add(visitors.object);
    await ctx.yield();

    // ------------------------------------------------------------ the meadow and the air
    // fields, hedges and their trees, the cart track and its walkers, low mist, grass by the line, the wood
    const meadow = await buildMeadow(ctx, light, { route, hero, hour, density: dens, detail });
    scene.add(meadow.object); things.push(meadow);
    await ctx.yield();
    // moths about the first lights of the lane's mouth, low among them: their box tops out 5 m up, 2.5 m under the line
    const mouth = [(P.mouth[0][0] + P.mouth[1][0]) / 2, (P.mouth[0][1] + P.mouth[1][1]) / 2];
    const moths = fx.makeParticles({ rng: forks.moths, count: Math.round(260 * dens), follow: false, center: [mouth[0], 2.9, mouth[1] + 6], box: [64, 4.2, 36], mode: 'tumble', shape: 'petal', size: [0.05, 0.1], aspect: 1.5, spin: 9,
      colors: ['#d9d6cc', '#f3f0e6', '#a9a8a2'], intensity: 1.3, opacity: 1, additive: 0.3, velocity: [0.2, 0.05, 0.1], velocityRandom: [1.4, 0.8, 1.4], turbulence: [2.4, 1.1, 1.3], near: [0.6, 2.5] });
    scene.add(moths.object); things.push(moths);
    await ctx.yield();
    // snow blowing out of one open flap beside the lane in, feathers out of another beside the lane on; both drift
    // low, in boxes that top out under the line (snow 3.85 m up, feathers 3 m up; the line is over 5 m there).
    // Near the lens each thins to nothing: the moths and the feathers from 2.5 m to 0.6 m, the blown snow from 3 m to
    // 0.6 m. The snow's 3 m is not 2.5 m because it is the kit's own figure for its snow (the kit thins snow from 3 m
    // to 0.5 m), kept as the kit has it; the world sets only where the thinning ends, 0.6 m, as for the other two.
    const wd = light.windDir, ws = 0.6 + 1.6 * wind, sd = hero.snowDoor, fd = hero.featherDoor;
    const flurry = fx.makeParticles({ rng: forks.snow, preset: 'snow', shape: 'disc', count: Math.round(620 * dens), follow: false, center: [sd.at.x + sd.out.x * 5.5, 2, sd.at.z + sd.out.z * 5.5], box: [15, 3.7, 15],
      velocity: [sd.out.x * 1.6 + wd[0] * ws, -0.5, sd.out.z * 1.6 + wd[1] * ws], size: [0.05, 0.13], intensity: 1.5, near: [0.6, 3] });
    await ctx.yield();
    const feathers = fx.makeParticles({ rng: forks.feathers, count: Math.round(170 * dens), follow: false, center: [fd.at.x + fd.out.x * 6, 1.5, fd.at.z + fd.out.z * 6], box: [18, 3, 18], mode: 'tumble', shape: 'petal', size: [0.09, 0.17], aspect: 0.45, spin: 1.4,
      colors: ['#f4f4f0', '#dcdcd8', '#ffffff'], intensity: 1.15, opacity: 1, additive: 0, velocity: [fd.out.x * 0.7 + wd[0] * ws * 0.5, -0.32, fd.out.z * 0.7 + wd[1] * ws * 0.5], velocityRandom: [0.5, 0.25, 0.5], turbulence: [0.9, 0.35, 0.6], near: [0.6, 2.5] });
    scene.add(flurry.object, feathers.object); things.push(flurry, feathers);
    await ctx.yield();
    // on a rare night fine round snow falls over everything in the open: it stands in the world, in boxes along the
    // route's line, and no flake is drawn under the roof of a tent that is flown through
    if (snowing) scene.add(fallingSnow(light, forks.fall, route, hero.lay, Math.round(10000 * detail), [wd[0] * ws * 1.2, -1.5, wd[1] * ws * 1.2]).object);
    await ctx.yield();
    const stars = fx.makeShootingStars({ rng: forks.stars, count: 5, period: [9, 22], minElevation: 0.3, color: '#ffffff', tailColor: '#c5ccd8' });
    scene.add(stars.object); things.push(stars);
    await ctx.yield();

    // ------------------------------------------------------------ the flight's own measures, in metres found from places
    const Gd = P.garden, mFlapB = route.metreNear(Gd.flaps[1][0], Gd.flaps[1][1], M.flapA, M.flapA + 160), mSteps = route.metreNear(P.steps.flap[0], P.steps.flap[1], mFlapB, mFlapB + 140);
    const sAx = [Math.sin(P.steps.heading * RAD), Math.cos(P.steps.heading * RAD)], crownXZ = [P.steps.flap[0] + sAx[0] * P.steps.crownAlong, P.steps.flap[1] + sAx[1] * P.steps.crownAlong];
    const mCrown = route.metreNear(crownXZ[0], crownXZ[1], mSteps, mSteps + 160);
    // (the roof's ribs stand every 15 m down from the crown: the third short of the hoop crosses the tent's long axis 45 m before it)
    const ribXZ = [crownXZ[0] - sAx[0] * 45, crownXZ[1] - sAx[1] * 45], mRib = route.metreNear(ribXZ[0], ribXZ[1], mSteps, mCrown);
    const mCourt0 = route.metreNear(garden.courtSpan[0][0], garden.courtSpan[0][1], M.flapA, mFlapB), mCourt1 = route.metreNear(garden.courtSpan[1][0], garden.courtSpan[1][1], M.flapA, mFlapB);
    const midRing = at(P.rings[1], 10.5), mMidRing = route.metreNear(midRing[0], midRing[1], M.fence, M.rim);
    const rimOut = at(P.courtR, 186), mRimOut = route.metreNear(rimOut[0], rimOut[1], M.rim + 20, M.gap2);
    const gapIn = at(P.rings[0], P.gaps[0]), mGapIn = route.metreNear(gapIn[0], gapIn[1], mMidRing, M.rim);
    const mTurnEnd = route.metreNear(route.straightStart[0], route.straightStart[1], mCrown, LEN);
    const knot = [route.straightStart[0] + route.hOut[0] * 130, route.straightStart[1] + route.hOut[1] * 130], mKnot = route.metreNear(knot[0], knot[1], mTurnEnd, LEN);
    // how far off the heading (in plan, degrees) a place stands at a metre of the route
    const tv = new THREE.Vector3(), pv = new THREE.Vector3();
    const offAt = (x, z, m) => { path.tangentAtDist(m, tv); path.posAtDist(m, pv); const dx = x - pv.x, dz = z - pv.z; return Math.acos(clamp((tv.x * dx + tv.z * dz) / (Math.hypot(tv.x, tv.z) * Math.hypot(dx, dz) + 1e-9), -1, 1)) / RAD; };
    const firstPast = (x, z, m0, m1, deg) => { let m = m0; while (m < m1 && offAt(x, z, m) <= deg) m += 2; return m; };
    const aheadAt = (x, z, m0, m1) => { let b = m0; for (let m = m0; m < m1; m += 2) if (offAt(x, z, m) < offAt(x, z, b)) b = m; return b; };
    // from the crown's hoop the tall tent of the middle ring that the lane in bends round comes dead ahead on the high
    // turn; later the fire does, and on the straight it falls abeam and then behind to the left
    const LT = P.laneTent, mTentAhead = aheadAt(LT[0], LT[1], mCrown, mTurnEnd), mFireAhead = aheadAt(FIRE[0], FIRE[1], mTentAhead, mKnot), mFireOut = firstPast(FIRE[0], FIRE[1], mFireAhead, mKnot, 90);
    // pace, in metres a second, eased between marks that stand at places: quick over the meadow and down the lane to
    // the middle ring, slow from the courtyard's rim round the fire, past the clock and through the garden, steady on
    // the climb, quicker round the high turn and down the straight to the knot where it goes level
    const marks = [[0, 27.5], [M.fence, 27.5], [mMidRing, 25.5], [M.rim, 11.2], [mRimOut, 11.2], [M.gap2, 12.5], [mClock, 12], [M.flapA, 14], [mFlapB, 13.6], [mSteps, 15.2], [mCrown, 13.2], [mTentAhead, 25], [mTurnEnd, 31], [mKnot, 28.5], [LEN, 24.5]];
    const speedAt = (m) => { let i = 1; while (i < marks.length - 1 && marks[i][0] < m) i++; const a = marks[i - 1], b = marks[i]; return lerp(a[1], b[1], smoothstep(a[0], b[0], m)); };
    const fireEye = new THREE.Vector3(FIRE[0], 8, FIRE[1]), clockEye = new THREE.Vector3(clock.at[0], 5.6, clock.at[1]), fountainEye = new THREE.Vector3(garden.fountain[0], 4.5, garden.fountain[1]);
    // the camp under the moon: over the roofs of the inner ring at the bearing midway between the crown's and the
    // moon's, 52 m up (some 20 m under the line's top, so that the gaze comes down to the camp as the climb levels);
    // the fire's column from above
    const bCrown = Math.atan2(crownXZ[0] - FIRE[0], crownXZ[1] - FIRE[1]) / RAD, bMoon = Math.atan2(light.moonDir.x, light.moonDir.z) / RAD, campXZ = at(P.rings[0], (bCrown + bMoon) / 2);
    const campEye = new THREE.Vector3(campXZ[0], 52, campXZ[1]), fireFromAbove = new THREE.Vector3(FIRE[0], 20, FIRE[1]);
    // the way out through the open round: the place over the hoop's rim on the moon's side (the hoop's middle moved
    // toward the moon's bearing by the hoop's own radius), lifted a quarter of the way from the hoop to the masts'
    // heads: from within, the round of sky with the moon, the mast's head, its stays and the lamps of the rim
    const roundEye = new THREE.Vector3(crownXZ[0] + Math.sin(bMoon * RAD) * P.steps.crownR, P.steps.crownY + (P.steps.mast - P.steps.crownY) / 4, crownXZ[1] + Math.cos(bMoon * RAD) * P.steps.crownR);
    // the looks, each between two places; one leads at a time. The fire: from the gap in the inner ring that the lane
    // comes in by to the courtyard's rim on the way out. The clock: from the courtyard's gap at bearing 200 until it is
    // abeam. The fountain: from the garden's flap to where its court ends. The way out and the camp under the moon:
    // from under the roof's third rib short of the hoop until the tall tent of the middle ring is dead ahead on the
    // high turn; it rises over the way from that rib to where the line stands over the eave of the tallest tent's high
    // end (a place found below on the built tent and the laid line, some 22 m beyond the hoop: the first metre at
    // which nothing of that tent lies under the line any more). Its aim is the round's place until the lens is
    // through the hoop's plane, so that the cloth is the frame of the round of sky and not the picture, and then
    // comes down onto the camp (the aim by the metre flown, below): the camera never turns 30 degrees a second
    // there, and the gaze stays within 75 degrees of the heading.
    // The fire's column: it takes hold over a stretch of the same length that ends where that
    // tent is dead ahead, the one rising over the stretch the other falls over (their weights never add to more than
    // the larger), and is let go, over the same length again, where the fire stands abeam of the straight.
    // Three of these ends are not the plan's, each for a reason measured on the laid line. The fire's look runs one
    // ring earlier at both ends than 'rim to the gap at bearing 200': held to that gap it pulls against the turn out
    // of the courtyard and the camera turns 34.7 degrees a second for 2.3 s there (29.6 at most as it stands). The
    // fountain's look begins at the flap and not where its court begins: the court is 18 m of the line, and a look
    // that rises and falls within it turns the camera 48 degrees a second. The last look is let go abeam and not at
    // 60 degrees off the heading because every end stands at a named place and abeam is one; the camera's measures
    // are the same either way.
    // where the flown line stands over the eave of the tallest tent's high end: the first metre beyond the crown at
    // which the line, in plan, has left that tent's own footprint (the built tent, the laid line)
    const stp = hero.lay.steps, overSteps = (m) => { path.posAtDist(m, pv); const dx = pv.x - stp.x, dz = pv.z - stp.z, lx = dx * stp.cr + dz * stp.sr; return Math.hypot(lx - clamp(lx, -stp.L, stp.L), dz * stp.cr - dx * stp.sr) < stp.R; };
    let mEave = mCrown; while (mEave < mTentAhead && overSteps(mEave)) mEave += 0.5;
    const rise = mEave - mRib;
    // the way out and down, one look's aim by the metre flown. Up to where the laid line crosses the hoop's plane (the
    // roof's own slope through the hoop's middle: the first metre beyond the rib at which the lens stands over it) the
    // aim is the round's place. From there the gaze comes down onto the camp's place: its direction turns at an even
    // rate from the direction it had at the plane to the camp's, with no soft start (the camera is already turning as
    // the lens comes to the plane) and eased at its end over a fifth of the way; the aim is set 100 m along it from the
    // lens, since a fixed place this near the line would swing the gaze as the lens passes it. Beyond: the camp's place.
    // WHERE THE TURN IS DONE. Not at the eave itself: done there, the eased camera turns 46 degrees a second (its law
    // is 30). It is done at the nearest place beyond the eave that the built tent itself gives and that keeps the law:
    // where the laid line stands, in plan, as far outside the wall of that tent's high end as the crown's middle stands
    // inside it (the plan's own measure along the tent's axis), found on the built tent and the laid line as the eave is.
    // (One place nearer was tried: over the pegs of the high end's guy ropes the camera turns 30.5 degrees a second.)
    const slope = Math.atan2(P.steps.wall1 - P.steps.wall0, P.steps.len), overHoop = (m) => { path.posAtDist(m, pv); return (pv.y - P.steps.crownY) * Math.cos(slope) > ((pv.x - crownXZ[0]) * sAx[0] + (pv.z - crownXZ[1]) * sAx[1]) * Math.sin(slope); };
    let mPlane = mRib; while (mPlane < mEave && !overHoop(mPlane)) mPlane += 0.5;
    const inBy = P.steps.len - P.steps.crownAlong, outBy = (m) => { path.posAtDist(m, pv); const dx = pv.x - stp.x, dz = pv.z - stp.z, lx = dx * stp.cr + dz * stp.sr; return Math.hypot(lx - clamp(lx, -stp.L, stp.L), dz * stp.cr - dx * stp.sr) - stp.R; };
    let mDown = mEave; while (mDown < mTentAhead && outBy(mDown) < inBy) mDown += 0.5;
    const dOut = new THREE.Vector3(), dCamp = new THREE.Vector3(), aim = new THREE.Vector3();
    path.posAtDist(mPlane, pv); dOut.subVectors(roundEye, pv).normalize();
    const even = (x) => { const e = 0.2, k = 1 / (1 - e / 2); return x > 1 - e ? 1 - k * (1 - x) * (1 - x) / (2 * e) : k * x; };
    const outAndDown = (t, u) => {
      const m = u * LEN; if (m <= mPlane) return roundEye; if (m >= mDown) return campEye;
      path.posAtDist(m, aim); dCamp.subVectors(campEye, aim).normalize();
      const om = Math.acos(clamp(dOut.dot(dCamp), -1, 1)), so = Math.sin(om) || 1, s = even((m - mPlane) / (mDown - mPlane));
      return aim.addScaledVector(dOut, 100 * Math.sin((1 - s) * om) / so).addScaledVector(dCamp, 100 * Math.sin(s * om) / so);
    };
    const windows = { fire: [mGapIn, mRimOut], clock: [M.gap2, mClock], fountain: [M.flapA, mCourt1], camp: [mRib, mTentAhead], fireAgain: [mTentAhead - rise, mFireOut] };
    const pull = (at, w, weight, fade) => ({ at, from: U(w[0]), to: U(w[1]), weight, fade });
    const pois = [pull(fireEye, windows.fire, 0.52, 0.5), pull(clockEye, windows.clock, 0.34, 0.5), pull(fountainEye, windows.fountain, 0.35, 0.5), pull(outAndDown, windows.camp, 0.8, rise / (mTentAhead - mRib)),
      pull(fireFromAbove, windows.fireAgain, 0.6, rise / (mFireOut - mTentAhead + rise))];

    return {
      scene, path, duration: 50, pace: (u) => speedAt(u * LEN) / 20,
      camera: { fov: 62, near: 0.3, far: 2600, nearThrough: 0.3, lookAhead: 24, sway: 0.6, bank: 0.6 },
      pois,
      portal: { shape: 'circle', radius: P.ringR, color: '#fff4dc', glow: 1, revealDistance: 260 },
      post: { exposure: 1.5, bloom: { strength: 0.5, radius: 0.6, threshold: 0.95 }, grade: { saturation: 0.74, contrast: 1, tint: '#ffffff', shadowTint: '#05070b', vignette: 0.3, grain: 0.02, aberration: 0 } },
      style: 'none', ride: 'none', companion: 'none',
      update(dt, time, camera, u) {
        light.update(time);
        sky.update(dt, time, camera); rig.update(dt, time, camera);
        for (const t of things) t.update(dt, time, camera);
      },
      dispose() { sky.dispose?.(); },
    };
  },
};
