// WHAT THE OCEAN BUILDS: at the end of a day under two suns we skim a black, slowly breathing ocean toward a disc of
// sea that has turned to glass; a mirror-bright dome swells on it and bursts into a tower of froth, the froth falls
// away from a white and rose hall of mirrored arches six hundred metres long, and we climb its nave while it is still
// growing ahead of us, come out through the open vault as the second sun rises, see the whole thing from above, and
// dive back in as it begins to sag into the sea. Hours are compressed into the flight.
//
// MAP OF THIS FILE
//   1. SUNS, HOURS     the two suns' looks and the three seeded hours (which sun sets and which rises, or both up)
//   2. build(ctx)      the forks and the seeded variations (part: takeForks, dealWorld) -> shared light uniforms
//                      (makeShared) -> the hall (buildHero) -> THE ROUTE, worked out from the hall's arches and chosen
//                      by a clearance test (part: chooseRoute) -> sea and floor, sky, far things
//                      (parts/what-the-ocean-builds-sea.js) -> kit: fog banks and wisps (fx.makeMist), flakes
//                      (fx.makeParticles) -> the suns as functions of the journey -> two gaze pulls (never both at once), pace -> return
//   3. update()        the journey (u): both suns' places, strengths and colours, the fog's colours, the hall's progress
//                      (hero.setProgress), rings and shine on the glass, flakes; the clock (time, from a seeded start):
//                      swell, foam, tremble, pulse, drift
// Space: sea level y 0, the flight heads -Z, x = 0 is the mirror plane of everything the ocean builds here; the gate of
// the hall is at the origin and its axis runs to z = -610, where the portal sits in a collar of froth in the last arch.
// Light: no three.js lights. Two analytic suns in every shader (sun A sets, sun B rises), fog tinted by direction.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeShared, chooseRoute, takeForks, dealWorld, vAt, TL, towerAt, frontZ, TOWER, STANDOFF, DOME } from '../parts/what-the-ocean-builds.js';
import { buildSea, buildSky, buildFar, buildWork } from '../parts/what-the-ocean-builds-sea.js';

const DUR = 50, HALL_BAY = 610 / 12;      // the flight's seconds; a mean bay of the hall (m)
// ---------------------------------------------------------------- 1. suns and hours
const RED = { light: '#FF9C8A', disc: '#E8332A', rad: 6, r: 2.2, horLo: '#3A1230', horHi: '#A8242E', fogLo: '#2A1220', fogHi: '#5A1E2C' };
const BLUE = { light: '#B4C8FF', disc: '#CFE0FF', rad: 12, r: 0.5, horLo: '#121A3E', horHi: '#4668C4', fogLo: '#141C3C', fogHi: '#2A3E7C' };
// THE SECOND DECLARED PACING: the suns' courses are paced to the flight (hours are compressed into it). Sun A sinks by
// so much per hundred metres flown (h = metres flown / 100). Sun B's height hangs on a place: r = the metres flown over
// the metres at which we come out through the vault over the crown of arch 4; its disc's centre is on the horizon there
// (r = 1) and it goes on rising to the end. Everything else about sun B (its strength, the horizon's and the fog's colour toward it, the
// stars, the Station's dawn) is a function of its elevation e in degrees, so it follows the sun in every hour.
const comeUp = (h, r) => -4 + 4 * r * r;
const HOURS = {
  // the brief's default: the red day ends, the blue sun rises
  dusk: { A: RED, B: BLUE, elA: (h) => 6 - 0.47 * h, elB: comeUp, stA: (h) => 2.3 - 0.1 * h, stB: (h, e) => 0.25 + 2.0 * smoothstep(-1, 3.5, e),
    lvA: (h) => 1 - 0.042 * h, lvB: (h, e) => smoothstep(-2.2, 3.2, e), stars: 1 },
  // the reverse: a hard silver-blue day ends as the red sun comes up; the hall is born white and dies rose
  dawn: { A: BLUE, B: RED, elA: (h) => 11 - 0.95 * h, elB: comeUp, stA: (h) => 3.2 - 0.2 * h, stB: (h, e) => 0.2 + 1.8 * smoothstep(-1, 3.5, e),
    lvA: (h) => 1 - 0.047 * h, lvB: (h, e) => smoothstep(-2.2, 3.2, e), stars: 0 },
  // both suns up: clear air, hard double shadows from first to last, a sea of two glares
  both: { A: RED, B: BLUE, elA: (h) => 20 - 0.32 * h, elB: (h) => 30 + 0.32 * h, stA: (h) => 2.0 - 0.028 * h, stB: (h) => 2.2 + 0.053 * h,
    lvA: () => 0.5, lvB: () => 0.5, stars: 0 },
};
const FROTH = { rose: ['#F4E6E2', '#E8A0A8'], ivory: ['#F2E8D4', '#DDA79C'], pearl: ['#DCD9DE', '#C59AAE'] };

export default {
  id: 'what-the-ocean-builds',
  name: 'What the Ocean Builds',
  category: 'books',
  placeKind: 'alien',
  book: 'Solaris',
  author: 'Stanisław Lem, 1921 to 2006',
  weirdness: 0.8,
  async build(ctx) {
    const detail = ctx.quality?.detail ?? 1;
    // ---- every fork of the generator, in one fixed list (the part's FORKS), then the seeded variations by their shares
    // (dealWorld in the part: the hour, the suns' sides, the weather, the mathematics, the froth, the far cast)
    const F = takeForks(ctx.rng);
    const { hourKey, sideA, heavy, ratio, tiers, frothKey, structures, swellSide } = dealWorld(F.deal), HR = HOURS[hourKey];
    const T0 = 240 * F.clock();                                   // the world's clock starts here (seconds): swell, foam, pulse, breath, drift
    const wa = F.wind() * Math.PI * 2, wx = Math.cos(wa), wz = Math.sin(wa);      // the wind's heading: one for all that drifts
    const scene = new THREE.Scene();
    const S = makeShared();
    S.uFroth.value.set(FROTH[frothKey][0]); S.uRose.value.set(FROTH[frothKey][1]);
    const fogDen = heavy ? 0.0015 : hourKey === 'both' ? 0.00038 : 0.00055;
    S.uFogDen.value = fogDen; S.uBank.value = heavy ? 1.6 : 1;
    scene.fog = new THREE.FogExp2('#2A1838', fogDen * 1.3);       // for the kit's mist and flakes only
    await ctx.yield();
    // ---- the hall, the path, the sea, the sky, the far things
    const hero = await buildHero(ctx, { shared: S, driven: true, ratio, tiers, sideA, forks: F });
    scene.add(hero.object); await ctx.yield();
    // THE DIVE IS CHOSEN BY TEST on this seed's own layout (chooseRoute in the part): one straight line, the least steep
    // that keeps 10 m clear of every rib, gallery arch, leg, film, fringe and web as the fall has left them, walked in
    // 2 m steps, nowhere steeper than 45 degrees; where the layout's far arches are too narrow for 10 m, the 45 degrees
    // are kept and the line that keeps furthest is taken (chosen.stands says which)
    const plan = hero.plan, A = plan.arches;
    const chosen = await chooseRoute(plan, -sideA, makePath, () => ctx.yield()), path = chosen.path, dive = chosen;
    if (chosen.clear < 6 || chosen.climb.skin < 8) console.warn('what-the-ocean-builds: the route comes within ' + chosen.clear.toFixed(1) + ' m of the growth');      // (whether the dive keeps its 10 m is in chosen.stands and chosen.dive: see the report)
    // v: the lens's progress along the axis (the hero's clock), from a table of the route; a pure function of u
    const NT = 256, zTab = new Float32Array(NT + 1), yTab = new Float32Array(NT + 1), tmp = new THREE.Vector3();
    for (let i = 0; i <= NT; i++) { path.pointAt(i / NT, tmp); zTab[i] = tmp.z; yTab[i] = tmp.y; }
    const tab = (T, u) => { const x = clamp(u, 0, 1) * NT, i = Math.min(NT - 1, Math.floor(x)); return lerp(T[i], T[i + 1], x - i); };
    const vOf = (u) => Math.max(0, vAt(tab(zTab, u)));
    const uOf = (x, z) => path.nearestXZ(x, z).u, uVault = uOf(0, A[4].z);      // where we come out through the vault
    // the u at which the route is level with a place z on the axis, by halving on the route itself (the route goes -Z all the way)
    const uAtZ = (z) => { let a = 0, b = 1; for (let i = 0; i < 40; i++) { const m = 0.5 * (a + b); if (path.pointAt(m, tmp).z > z) a = m; else b = m; } return 0.5 * (a + b); };
    await ctx.yield();
    const sea = buildSea(ctx, S, plan, hero.mirrored); scene.add(sea.object); sea.uniforms.uSwell.value = 1.5; sea.uniforms.uWind.value.set(wx, wz); await ctx.yield();      // (polish 1) what floats drifts down the world's one wind
    // (polish 1, Q2 c; second part, R6 a) the ocean's small things, from a named stream of their own: each stands where
    // it is dealt. The sea part builds the copies within its one stated distance of the hall's own middle (third part,
    // U1: no road is read for that); it is given the road's line (every 1/400 of the route) for one thing only: it
    // leaves out the copies within its keep-clear of that line
    { const road = []; for (let i = 0; i <= 400; i++) { path.pointAt(i / 400, tmp); road.push([tmp.x, tmp.y, tmp.z]); }
      const work = buildWork(ctx, S, sea.uniforms, ctx.core.makeRng(ctx.core.hashSeed('ocean-work:' + ctx.seed)), road); scene.add(work.object); await ctx.yield(); }
    const sky = buildSky(ctx, S); scene.add(sky.object); await ctx.yield();
    const far = await buildFar(ctx, S, { side: swellSide, structures, forks: F }); scene.add(far.object); await ctx.yield();
    // ---- kit: fog banks on the sea, wisps that cross the lens, flakes of froth inside the hall
    const time = { value: 0 }, bankOp = heavy ? 0.5 : 0.36;
    const banks = fx.makeMist({ rng: F.banks, time, follow: true, count: Math.round(60 * detail), area: [900, 9, 900], center: [0, 5, 0], size: [44, 96], flatten: 0.14, color: '#74405A', shadowColor: '#2E1A34', sunColor: '#5A1C24', opacity: heavy ? 0.5 : 0.36, drift: [1.75 * wx, 0, 1.75 * wz] });
    scene.add(banks.object); await ctx.yield();
    const wisps = fx.makeMist({ rng: F.wisps, time, follow: true, count: Math.round(46 * detail), area: [300, 7, 300], center: [0, 5, 0], size: [14, 34], color: '#4E3E66', shadowColor: '#241A34', sunColor: '#30182A', opacity: 0.16, drift: [2.6 * wx, 0, 2.6 * wz] });
    scene.add(wisps.object); await ctx.yield();
    const flakes = fx.makeParticles({ rng: F.flakes, preset: 'snow', time, count: Math.round(7000 * detail), box: [90, 60, 90], size: [0.09, 0.36],
      colors: [FROTH[frothKey][0], FROTH[frothKey][1], '#FFFFFF'], velocity: [0.7 * wx, -1.5, 0.7 * wz], intensity: 1.1 });
    flakes.setOpacity(0); scene.add(flakes.object); await ctx.yield();

    // ---- the suns: everything that depends on where they are, as functions of the journey
    const DEG = Math.PI / 180, AZ = 38 * DEG, col = (h) => new THREE.Color(h);
    const cA = col(HR.A.light), cB = col(HR.B.light), dA = col(HR.A.disc), dB = col(HR.B.disc);
    const hA = [col(HR.A.horLo), col(HR.A.horHi)], hB = [col(HR.B.horLo), col(HR.B.horHi)], fA = [col(HR.A.fogLo), col(HR.A.fogHi)], fB = [col(HR.B.fogLo), col(HR.B.fogHi)];
    S.uRadA.value.set(dA.r, dA.g, dA.b, HR.A.rad); S.uRadB.value.set(dB.r, dB.g, dB.b, HR.B.rad);
    if (hourKey === 'both') S.uZen.value.set('#10122A');
    S.uAzA.value.set(sideA * Math.sin(AZ), -Math.cos(AZ)); S.uAzB.value.set(-sideA * Math.sin(AZ), -Math.cos(AZ));
    const vis = (e) => smoothstep(-0.6 * DEG, 0.9 * DEG, e);
    let eB = -4;                                                   // sun B's elevation now, degrees
    function suns(u) {
      const h = u * path.length / 100;
      eB = HR.elB(h, u / uVault);
      const ea = HR.elA(h) * DEG, eb = eB * DEG, la = HR.lvA(h), lb = HR.lvB(h, eB);
      S.uSunA.value.set(sideA * Math.sin(AZ) * Math.cos(ea), Math.sin(ea), -Math.cos(AZ) * Math.cos(ea));
      S.uSunB.value.set(-sideA * Math.sin(AZ) * Math.cos(eb), Math.sin(eb), -Math.cos(AZ) * Math.cos(eb));
      S.uSunACol.value.copy(cA).multiplyScalar(HR.stA(h)); S.uSunBCol.value.copy(cB).multiplyScalar(HR.stB(h, eB));
      S.uHorA.value.copy(hA[0]).lerp(hA[1], la); S.uHorB.value.copy(hB[0]).lerp(hB[1], lb);
      S.uFogA.value.copy(fA[0]).lerp(fA[1], la); S.uFogB.value.copy(fB[0]).lerp(fB[1], lb);
      S.uDisc.value.set(HR.A.r, HR.B.r, vis(ea), vis(eb));
      sea.uniforms.uShadA.value.set(-S.uAzA.value.x, -S.uAzA.value.y, Math.min(14, 1 / Math.tan(Math.max(ea, 0.03))));
      sea.uniforms.uShadB.value.set(-S.uAzB.value.x, -S.uAzB.value.y, Math.min(14, 1 / Math.tan(Math.max(eb, 0.03))));
      sky.uniforms.uStars.value = HR.stars * (1 - smoothstep(-2, 2.2, eB));      // the stars go as the second sun comes
      scene.fog.color.copy(S.uFogMid.value).lerp(S.uFogA.value, 0.35 * la).lerp(S.uFogB.value, 0.35 * lb);
    }
    suns(0);
    // ---- gaze: in the hall ONE pull, for the whole stretch in which the route's own line points above the hall (from
    // under the first arch, up through the vault and over the top, to the arch before the dive): the floor of the nave
    // under the front of growth, the place where the hall is being made. It runs ahead of the lens and stops at the
    // portal's seat, so the growing hall stands in the middle of what we see as we rise and from above.
    // Before it, ONE pull follows the froth while the tower stands (from the place where the dome bursts to the place
    // where the tower is gone): a point on its axis at 0.4 of the height that still stands (nearer its foot than its
    // head, as one looks at a tall thing from the sea). The two pulls' stretches do not meet; each has weight 0.9
    const frontFloor = new THREE.Vector3(), towerEye = new THREE.Vector3();
    const frontFloorAt = (t, u) => frontFloor.set(0, 0, Math.max(plan.seat.z, frontZ(vOf(u))));
    const towerEyeAt = (t, u) => { const [up, slough] = towerAt(vOf(u)); return towerEye.set(0, 4 + 0.4 * TOWER.H * up * (1 - smoothstep(0.08, 0.45, slough)), 0); };      // the head lets go at slough 0.08 and the foot is gone at 0.45 (the release rule of the tower's lumps in the part)
    const pois = [{ at: towerEyeAt, from: uAtZ(STANDOFF + DOME.r), to: uAtZ(1.5 * HALL_BAY), weight: 0.9 },
      { at: frontFloorAt, from: uOf(0, A[1].z), to: uOf(0, A[dive.k - 1].z), weight: 0.9 }];
    // pace: a little brisker over the long approach until the tower is gone (it eases to 1 between that place and the gate), slower
    // again while we are above the crowns (from 30 m under the crown of arch 4 upward), 1 for the rest
    const pace = (u) => lerp(lerp(1.1, 1, smoothstep(TL.gone, vAt(0), vOf(u))), 0.82, smoothstep(A[4].H - 30, A[4].H + 10, tab(yTab, u)));
    return {
      scene, path, duration: DUR, pace, pois,
      camera: { fov: 64, near: 0.5, far: 9000, sway: 0.5, bank: 0.3 },
      portal: { shape: 'circle', radius: 7, color: '#CFE0FF', revealDistance: 300 },
      post: { exposure: 1.05, bloom: { strength: 0.5, radius: 0.7, threshold: 0.9 },
        grade: { saturation: 1.08, contrast: 1.06, tint: '#FFF4F4', shadowTint: '#0A0612', vignette: 0.36, grain: 0.03 } },
      update(dt, t, camera, u) {
        const tw = t + T0; time.value = tw; S.uTime.value = tw;
        const v = vOf(u), camY = tab(yTab, u), camZ = tab(zTab, u);
        suns(u);
        hero.setProgress(v); hero.update(dt, tw, camera);
        const sag = S.uSag.value;
        // the glass: the light under its skin grows while the dome swells and dies between the place where the tower is gone and the gate;
        // rings run out over it from the first metre until the tower is gone; it starts to move again as the hall sags
        sea.uniforms.uShine.value = (0.5 + 0.5 * smoothstep(0, TL.burst, v)) * (1 - smoothstep(TL.gone, vAt(0), v));
        sea.uniforms.uRing.value = clamp(v / TL.gone, 0, 1);
        sea.uniforms.uCalm.value = 1 - 0.7 * sag;
        for (const m of sea.mounds) m.visible = m.userData.e.value.w > 0.02;      // a swelling is drawn once it has begun to rise
        far.update(tw, v, hourKey === 'dusk' ? 1.6 * smoothstep(-2.5, 0.6, eB) : 0);      // the Station is 820 m up: it has the second sun before we do
        // flakes fall inside the hall (thin above its crowns): from where the tower stood on, thick as it sags
        const within = 1 - 0.75 * smoothstep(A[4].H * 0.8, A[4].H + 20, camY);
        flakes.setOpacity(ctx.through ? 0 : (0.4 * smoothstep(TL.gone, vAt(0), v) + 0.6 * smoothstep(0, 0.35, sag)) * within);
        // the banks and wisps lie on the open sea; over the glass, inside the hall, the air is clear
        const open = smoothstep(-40, 90, camZ);      // 1 on the open sea before the gate (z 0), 0 past it
        banks.uniforms.uOpacity.value = bankOp * open; wisps.uniforms.uOpacity.value = 0.16 * open;
      },
      dispose() {},
    };
  },
};
