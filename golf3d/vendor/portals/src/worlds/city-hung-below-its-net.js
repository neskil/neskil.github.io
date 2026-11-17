// The City Hung Below Its Net: between two steep mountains, over a void where clouds drift far below, a whole city hangs
// from a net of ropes, chains and catwalks. The flight begins level and straight, out from the first mountain past a
// gatehouse hung from the net's head stay (a drawn hand, a drawn place: the first stretch differs from visit to
// visit), high over the anchor chains and the net's head for some 60 m; comes down in one slope and one long S over
// the top of the net (in the first mountain's shade at the low hours, until the sun strikes), drops through a great
// hatch in the mesh into a street of hung houses with
// the town hanging below and beside it, passes the heart of the city (the hero set piece,
// src/parts/city-hung-below-its-net.js: sack-houses in three strong drawn colours round a gondola terrace with a
// chandelier under it), then the city's great hall hung under the middle of the sag with its bridges and neighbours,
// crosses under the deepest houses on a diagonal past a lit house and a boat, turns beside the far crag under the
// net's guys, and flies a hung gangway along the crag's face (ledges, shrines, stairs, roped houses on booms, goats),
// past a lamp-lit gallery cut for the city's anchor works, to the portal in its ring of rope and iron.
//
// Everything that hangs is one instanced kit (the part file): each thing sways from its own point in the vertex shader,
// gust fronts cross the gulf on the clock (never held for the flight), ropes are tubes of their own thickness in
// metres at any distance. What reads the camera, said outright: the engine's fog and the kit's shaders use the
// camera's position for fog, for rim light and sheen, for which face of the mesh is seen, and for the fades of the
// shafts of light and of the lamps' glows within a few metres of the eye; the lamps' glows are sprites that face the
// view, stand up to half a metre nearer the eye than their lamp and read the projection's scale to keep a floor of
// 2.2 pixels (paid back in brightness); smoke ribbons turn their flat to the eye; line patterns fade by their screen
// derivatives. The rare visit's mist thickens by metres flown, over one whole stretch between two places. Nothing
// else is placed, hidden, moved, sized or timed by the camera's position, its matrix or the view's edges.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig, makeCloudField } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import { buildHero, makeHungKit, makeNetFn, buildNet, hangString, reachClear, makeCableCar, makeShadowSheet, faceRock, SWAY, PLUME, COLORS, PAT, TERRACE_ROPE } from '../parts/city-hung-below-its-net.js';

const TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mulc = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// What each hour looks like. Every hour has the same clear air near the net and the same cloud sea far below; the hours
// differ in the colour of the light, in how high the sun stands and on which side of the gulf it stands ('turn' is
// added to the drawn bearing, 'flip' puts the dawn sun on the other side from the evening one). At dawn and at golden
// the sun stands behind the first mountain's shoulder (144 to 166 degrees from the first heading), so that mountain's
// shadow lies over the anchorage and the sun strikes farther out along the net. The sky is one key
// from horizon to zenith; the cloud's lit colour stays under white.
const HOURS = {
  day: { preset: 'day', elevation: 35, turn: 0, flip: 1, sea: -262, fog: '#b9d6f8', den: 0.00052, lampK: 0.8, lantern: 0, exposure: 1.0, fill: 0.4, amb: 1, lamp: 0.5,
    sky: { zenith: '#1c4fa8', mid: '#4a89d8', horizon: '#a9cdf5', ground: '#c9e0f8', groundFalloff: 2.2, horizonPow: 4.4, cloudLit: '#e6ebf1', cloudShade: '#7388ae' } },
  golden: { preset: 'goldenHour', elevation: 17, turn: 40, flip: 1, sea: -258, fog: '#c79a86', den: 0.00054, lampK: 1.15, lantern: 0.12, exposure: 1.04, fill: 1.0, amb: 1.3, lamp: 0.9,
    sky: { zenith: '#35366a', mid: '#70709f', horizon: '#eba76c', ground: '#b98e7c', groundFalloff: 2.4, horizonPow: 3.8, cloudLit: '#e4ad7c', cloudShade: '#54568a', lightIntensity: 3.1, ambientIntensity: 1.6 } },
  dawn: { preset: 'dawn', elevation: 14, turn: 40, flip: -1, sea: -258, fog: '#c99aa4', den: 0.00056, lampK: 1.3, lantern: 0.2, exposure: 1.06, fill: 1.15, amb: 1.35, lamp: 1,
    sky: { zenith: '#302b5c', mid: '#6c5c92', horizon: '#e69f92', ground: '#b88c9e', groundFalloff: 2.4, horizonPow: 2.9, cloudLit: '#e9ab9f', cloudShade: '#4f538c', lightColor: '#ffb496', lightIntensity: 2.9, ambientColor: '#858fd8', ambientIntensity: 1.65 } },
  night: { preset: 'night', elevation: 42, turn: 0, flip: 1, sea: -254, fog: '#26365c', den: 0.0008, lampK: 2.1, lantern: 1.25, exposure: 1.12, fill: 0.8, amb: 1, lamp: 1.2,
    sky: { ground: '#1c2a4e', groundFalloff: 2.6 } },
};

export default {
  id: 'city-hung-below-its-net',
  name: 'The City Hung Below Its Net',
  category: 'books',
  placeKind: 'city',
  book: 'Invisible Cities',
  author: 'Italo Calvino, 1923 to 1985',
  media: ['air', 'cable', 'open'],
  weirdness: 0.7,
  async build(ctx) {
    const { rng, noise } = ctx;
    const scene = new THREE.Scene();
    const vary = ctx.vary || {}, detail = ctx.quality ? ctx.quality.detail : 1;

    // ------------------------------------------------------------ what this visit is like
    const R = {}; for (const k of ['vary', 'sky', 'terrain', 'ridges', 'kit', 'net', 'heart', 'town', 'ends', 'cars', 'sea', 'drift', 'life', 'hour', 'sack', 'crowd', 'stays', 'works', 'drift2', 'far', 'tier', 'cloud', 'lay', 'under', 'gallery', 'billow']) R[k] = rng.fork(k);
    for (const [k, parent] of [['beds', 'terrain'], ['swifts', 'life'], ['swifts2', 'life'], ['eagle', 'life'], ['motes', 'life'], ['towers', 'billow'], ['banks', 'billow']]) R[k] = R[parent].fork(k);
    // streams new in round 5 (and round 6's two: stayLamp, lipLamp), each made from the world's seed and its own name (they draw nothing from any parent); every stream is taken here, before the first yield
    for (const k of ['gust', 'street', 'hammock', 'guy0', 'guy1', 'guy2', 'guy3', 'guy4', 'guy5', 'arrive', 'hall', 'face', 'colours', 'flagS', 'flag0', 'flag1', 'flag2', 'flag3', 'flag4', 'flag5', 'stayLamp', 'lipLamp']) R[k] = ctx.core.makeRng(ctx.core.hashSeed(k + ':' + ctx.seed));
    const rv = R.vary;
    const hourDrawn = R.hour.pick(['day', 'day', 'day', 'day', 'golden', 'golden', 'dawn', 'night']);      // its own stream, and no draw on any other stream depends on the hour: forcing the hour changes nothing else
    const hourName = HOURS[vary.hour] ? vary.hour : hourDrawn;
    const night = hourName === 'night';
    const HR = HOURS[hourName], rare = !!vary.rare, density = clamp((vary.density ?? 1), 0.7, 1.3) * (detail < 1 ? 0.55 + 0.45 * detail : 1);
    const sunSide = rv.chance(0.5) ? 1 : -1, sunAz = HR.flip * sunSide * (rv.range(104, 126) + HR.turn);     // the light comes from behind one shoulder, so the far crag's face is lit
    const cover = rv.range(0.22, 0.4);                                 // the high cloud's cover: drawn at every hour, used where the hour has such cloud
    const NET = { zA: 0, zB: -540, yA: 0, yB: 28, sag: rv.range(57, 66), wA: 24, wM: rv.range(68, 80), wB: 62, dish: rv.range(9, 14), bow: rv.range(-13, 13), cell: 1.7, lanes: 2, cross: 12 };
    const net = makeNetFn(NET), L = net.L;      // wB: the far end is made fast along 124 m of the crag, as wide as the hung gangway (60 m along the face) is long, so the net is overhead all along it
    const heroS = rv.range(0.49, 0.57), heroT = rv.range(0.06, 0.16);    // the heart's place along the net (z -265 to -308) and off its centre line: drawn, so every place after it moves from visit to visit
    const palBias = rv.shuffle([0, 1, 2, 3, 4, 5, 6]);                  // which canvas colours this city favours

    // ------------------------------------------------------------ sky, light, haze
    const sky = makeSky({ rng: R.sky, preset: HR.preset, ...HR.sky, sunElevation: HR.elevation, sunAzimuth: sunAz,
      ...(hourName === 'night' ? { bodies: [{ elevation: HR.elevation, azimuth: sunAz, size: 3.1, phase: 1, color: '#fff6e0', texture: 0.5, intensity: 1.25, glow: 0.3, glowColor: '#a9bcff', glowSize: 4 }], key: 0, bake: true, renderer: ctx.renderer, stars: 0.8 } : {}),
      clouds: false, clouds2: hourName === 'night' ? false : { coverage: cover, stretch: 1, opacity: 0.6, scale: 1.3 }, quality: 0.5 });
    scene.add(sky.object);
    const rig = makeLightRig(sky, { intensity: 1, ambient: hourName === 'night' ? 1.25 : 0.9, bounce: 0.45 });
    scene.add(rig.object);
    const fogCol = new THREE.Color(HR.fog).lerp(sky.fogColor, 0.3);
    scene.fog = new THREE.FogExp2(fogCol, HR.den);
    const sunDir = sky.lightDirection.clone().normalize();
    await ctx.yield();

    // ------------------------------------------------------------ the hung kit, the places, and the things the flight is laid beside
    const kit = makeHungKit(ctx, { net, rng: R.kit });
    const canvasTint = (r) => { const c = COLORS.canvas[palBias[Math.min(6, Math.floor(Math.pow(r(), 1.7) * 7))]], k = r.range(0.74, 1.08), d = r.range(-0.035, 0.035); return [clamp(c[0] * k + d, 0.03, 0.9), clamp(c[1] * k, 0.03, 0.9), clamp(c[2] * k - d, 0.03, 0.9)]; };
    // AT THE HEART the houses' own colours: three strong colours drawn for the visit (stream 'colours') out of seven;
    // the heart's own cluster, the great hall and its neighbours take them five times in seven, the city's canvas colours
    // otherwise (the same three draws a tint as before, so the heart's layout is not dealt anew)
    const STRONG = ['#d2341c', '#eea512', '#2140ad', '#1c8a5e', '#b3246a', '#17a0a6', '#efe8d8'].map(lin);
    const strong3 = R.colours.shuffle([0, 1, 2, 3, 4, 5, 6]).slice(0, 3).map((i) => STRONG[i]);
    const heartTint = (r) => { const i = r.pick([0, 1, 2, 3, 4, 5, 6]), k = r.range(0.78, 1.12), d = r.range(-0.04, 0.04), c = i < 5 ? strong3[i % 3] : COLORS.canvas[palBias[i - 5]]; return [clamp(c[0] * k + d, 0.02, 0.95), clamp(c[1] * k, 0.02, 0.95), clamp(c[2] * k - d, 0.02, 0.95)]; };
    // ------------------------------------------------------------ the two mountains and the gulf between them
    // Each mountain is a promontory: its face toward the gulf curves away on both sides, so there is open air and far
    // ranges beside it; the faces are cut into ribs and gullies that the side light rakes.
    const n2 = noise.n2, ss = smoothstep;
    const eS = 1, side = eS;                                           // the entry's side of the net (+x); the camera passes the heart on the side it came in on
    const TH = 0.25;                                                   // the line of the net the top run flies over and the hatch lies on: the inner mid cable on the entry's side
    const ledge = [TH * 43 + 1, 56], ledgeY = 13;                      // the ledge we leave from: midway between the feet of the two anchor chains t = 0 and t = 0.5 (their bolts stand at 43 t, + 2 for t > 0)
    const nearLedge = (x) => Math.exp(-(((x - ledge[0]) / 30) ** 2));
    const bend = (x, kL, kR) => { const k = x < 0 ? kL : kR; return k * x * x / (1 + Math.abs(x) / 480); };
    const kA = [rv.range(0.0022, 0.0036), rv.range(0.0022, 0.0036)], kB = [rv.range(0.0024, 0.004), rv.range(0.0024, 0.004)];
    const rimA = (x) => lerp(45 + 13 * n2(x * 0.0065 + 3.1, 1.7) + 4 * n2(x * 0.021, 7.7), 44, nearLedge(x)) + bend(x, kA[0], kA[1]);
    const rimB = (x) => -553 + (12 * n2(x * 0.0065 - 6.3, 4.4) + 4 * n2(x * 0.021, 2.2)) * ss(25, 120, Math.abs(x)) - bend(x, kB[0], kB[1]);
    const crestA = (x) => lerp(2 + 9 * n2(x * 0.009 + 1.3, 0.4), ledgeY, nearLedge(x)) - 30 * ss(200, 700, Math.abs(x));
    const crestB = (x) => 31 + 9 * n2(x * 0.009 + 8.3, 5.4) - 30 * ss(200, 700, Math.abs(x));
    const peakA = { x: rv.range(-120, 120), h: rv.range(250, 320), w: rv.range(300, 380) }, peakB = { x: rv.range(-130, 130), h: rv.range(390, 480), w: rv.range(250, 330) };
    const rough = T.mountains({ noise, height: 190, scale: 290, ridge: 0.6, sharpness: 1.3, foothills: 0.3, offset: [rv.range(0, 900), rv.range(0, 900)] });
    // gullies only ever cut the faces back from the rim line (the ribs between them stay on it), so nothing grows toward the net
    const soft = (v, e) => Math.sqrt(v * v + e) - Math.sqrt(e);
    const gully = (x, z) => 46 * soft(n2(x * 0.0078 + 11, z * 0.0078), 0.01) + 12 * soft(n2(x * 0.015, z * 0.015 + 5), 0.02) + 2.5 * (1 + n2(x * 0.05 + 9, z * 0.05));
    // buttresses that stand out from the far crag's face (up to 7 m, some 20 m broad) and chimneys cut into it (up to 9 m, narrow)
    const worksRelief = (x) => 7 * ss(0.12, 0.45, n2(x * 0.045 + 3.3, 2.2)) - 9 * ss(0.3, 0.5, n2(x * 0.07 + 17.1, 9.4));
    const height = (x, z) => {
      const rA = rimA(x), rB = rimB(x), cA = 1 / Math.sqrt(1 + ((rimA(x + 6) - rimA(x - 6)) / 12) ** 2), cB = 1 / Math.sqrt(1 + ((rimB(x + 6) - rimB(x - 6)) / 12) ** 2);
      const wob = gully(x, z), calm = 1 - Math.exp(-(((x - ledge[0]) / 40) ** 2));
      // the far crag along the last run: the great gullies calmed, and built relief in their place (see worksRelief)
      const wk = Math.exp(-(((x + eS * 45) / 150) ** 2)), dB0 = (z - rB) + wob * ss(-60, 30, z - rB) * (1 - 0.8 * wk);
      const dA = ((rA - z) + wob * ss(-60, 30, rA - z) * calm) * cA, dB = (dB0 - worksRelief(x) * wk * ss(10, 28, dB0)) * cB;
      if (dA > 0 && dB > 0) {
        const d = Math.min(dA, dB), crest = lerp(crestA(x), crestB(x), ss(-60, 60, dA - dB));
        const bench = 13 * ss(0.3, 0.55, n2(x * 0.009 + 4, z * 0.009)) * ss(34, 60, d) * (1 - ss(110, 170, d));
        let fall = 150 * ss(0, 55, d);
        if (dB < dA) fall += 3.8 * Math.sin(fall * 0.26 + 2 * n2(x * 0.02, 5.5)) * wk * ss(8, 20, d);      // ledges: the fall stepped every 24 m of height along the last run
        return crest - fall - 420 * Math.pow(ss(25, 300, d), 1.3) + bench + 12 * noise.fbm2(x * 0.009, z * 0.009, 3) * ss(60, 200, d);
      }
      const onA = dA <= 0, b = onA ? -dA : -dB, pk = onA ? peakA : peakB, e = Math.exp(-(((x - pk.x) / pk.w) ** 2));
      let y = (onA ? crestA(x) : crestB(x)) + (pk.h * (1 - Math.exp(-b / 150)) * (0.16 + 0.84 * e) + rough(x, z) * ss(4, 150, b) * (0.4 + 0.6 * e)) * (1 - 0.7 * ss(420, 900, b));
      if (onA) { const q = Math.hypot(x - ledge[0], z - ledge[1]); y = lerp(ledgeY, y, ss(8, 15, q)); }
      return y;
    };
    const segD = (x, z, zr) => Math.hypot(Math.max(Math.abs(x) - 150, 0), z - zr);
    // The first mountain's shadow, from the sun's direction and the mountain's own shape. Along every line that runs
    // toward the sun (32 lines, 40 m apart across the sun's bearing) the mountain is marched every 20 m, and the highest
    // ray it cuts is kept: G = max(height - a tan(elevation)), a = metres toward the sun. A point is in the mountain's
    // shade where it lies under that ray: y < a tan(elevation) + G(c). The kit's shaders, the rock of the far crag and
    // the shadow on the cloud all use this one function, so the anchorage lies in cool shade and the sun strikes where
    // the shadow ends, wherever that is on this visit.
    const sunHz = Math.max(Math.hypot(sunDir.x, sunDir.z), 1e-3), sunX = sunDir.x / sunHz, sunZ = sunDir.z / sunHz, sunTan = sunDir.y / sunHz;
    const SG = { n: 32, c0: -620, step: 40, g: new Float32Array(32) };
    for (let i = 0; i < SG.n; i++) {
      const c = SG.c0 + i * SG.step; let g = -1e5;
      for (let a = -300; a <= 1500; a += 20) { const x = a * sunX - c * sunZ, z = a * sunZ + c * sunX; if (z > 40 && z < 1100 && Math.abs(x) < 1100) g = Math.max(g, height(x, z) - a * sunTan); }
      SG.g[i] = g;
      if (i % 8 === 7) await ctx.yield();
    }
    const shadeH = (x, z) => { const k = clamp((-x * sunZ + z * sunX - SG.c0) / SG.step, 0, SG.n - 1.001), i = Math.floor(k); return (x * sunX + z * sunZ) * sunTan + lerp(SG.g[i], SG.g[i + 1], k - i); };      // the height under which (x, z) is in the mountain's shade
    kit.uniforms.uShadeG.value = SG.g; kit.uniforms.uShadeP.value.set(sunX, sunZ, sunTan, 1 / SG.step); kit.uniforms.uShadeQ.value.set(SG.c0, 5);
    const windA = rv.range(-0.5, 0.5);
    kit.uniforms.uWind.value.set(Math.cos(windA) * sunSide, Math.sin(windA), TAU / rv.range(190, 260), rv.range(0.8, 1.05));
    // the gust: a front that crosses the gulf with this wind, on the clock, with a drawn phase and no term of place: a
    // cycle of 9 to 13 s, the fronts travelling at 15 to 20 m/s (so 135 to 260 m apart); the part file's SWAY table
    // gives its shape and its greatest value
    { const gr = R.gust, T = gr.range(9, 13), c = gr.range(15, 20); kit.uniforms.uGustF.value.set(1 / (c * T), 1 / T, gr.range(0, 64), gr.range(0, 100)); }
    // THE LANE: 6.5 m of clear air between the route's line and the skin of anything that hangs, AT THE GUST'S FULL
    // SWING. A thing 'arm' metres under its hang point can move swA x arm along the wind, swB x arm across it and
    // swH up and down (the part file's SWAY table at the gust's greatest value); the lane's own function (laneGap,
    // below, once the route is laid) measures from the route to that whole box. The one stated exception is the hung
    // gangway we fly along at the end: its planks lie under us (the line is 4.4 m over the deck), and its own posts,
    // hangers, hand ropes, lamps, pots and pennants keep 2.5 m, not 6.5, tested by the same function with that
    // margin (see THE GANGWAY'S OWN STAND-OFF).
    const LANE = 6.5;
    const swAmp = SWAY.amp0 + SWAY.ampG * SWAY.gMax, swA = SWAY.along * swAmp, swB = SWAY.across * swAmp, swH = SWAY.heave0 + SWAY.heaveG * SWAY.gMax;
    const windX = kit.uniforms.uWind.value.x, windZ = kit.uniforms.uWind.value.y;
    // how far a thing 'arm' metres under its hang point swings along the unit direction (nx, nz)
    const swingTo = (arm, nx, nz) => arm * (swA * Math.abs(nx * windX + nz * windZ) + swB * Math.abs(-nx * windZ + nz * windX));
    const EYE = 4.4;                                                   // metres the route flies over the deck of the hung gangway
    const X = (s) => net.cx(s), PZ = (z, dx, y) => [X(net.sOf(z)) + dx, y, z];      // x is measured from the net's own centre line
    // The entry is on the +x side of the net. The great hatch lies on the line of the inner mid cable (t = 0.25), midway
    // between two cross cables: that cable ends on the hatch's rim at both sides, the two cross cables are led round
    // the rim, and no cable and no walk crosses the hatch. Its radius is what the dive needs: 11.5 m or more, measured
    // by the lane's own function once the route is laid (see gapR below).
    const lay = R.lay;                                                 // the layout's own stream: the hatch's bay, the street's stations and sides
    const crossZ = (j) => lerp(NET.zA, NET.zB, j / (NET.cross * 2)), between = (j) => (crossZ(j) + crossZ(j + 1)) / 2;
    const gapZ = between(lay.pick([5, 6, 7])), gap = net.at(net.sOf(gapZ), TH * eS);      // the hatch's place along the net: one of three bays, 45 m from the first to the last
    const over = (z, t, up) => { const p = net.at(net.sOf(z), t); return [p[0], p[1] + up, z]; };      // 'up' metres over the net at (z, t)
    // the heart: the terrace's own place and frame (lx along it, toward the far crag; lz abeam of it)
    const heroAt = net.at(heroS, heroT), hx = heroAt[0], hz = heroAt[2], hyNet = heroAt[1];
    const tYaw = Math.PI / 2 + R.heart.range(-0.28, 0.28), cyw = Math.cos(tYaw), syw = Math.sin(tYaw);      // the terrace lies along the net, like a boat moored beside the catwalks
    const TI = kit.info('terrace'), deckY = hyNet - (TERRACE_ROPE - TI.deck);
    const W = (lx, lz, y) => [hx + lx * cyw + lz * syw, y, hz - lx * syw + lz * cyw];
    // The far anchorage. The ring hangs at the net's centre line, 41 m under the net (so the gangway comes up to it from
    // under the deepest houses), and it stands off the crag by 18 m: its own radius and 10 m of air for the works between
    // it and the rock. The foremost rock is looked for along the whole of the last run (130 m before the ring to 40 m past it)
    // at the heights the route flies there. The ring's plane is square to the face's line (rimB is straight for 25 m either
    // side of the centre), so the hung gangway, the last 60 m, runs ALONG the face with the rock on the left hand.
    const wallZ = (x, y, z0) => { let z = z0; while (height(x, z) < y && z > z0 - 160) z -= 2; z += 2; while (height(x, z) < y && z > z0 - 162) z -= 0.25; return z; };      // where the crag's face stands at height y (looked for from the gulf's side)
    const xRing = X(0.95), yRing0 = net.yC(0.95) - 41;
    await ctx.yield();
    let zFront = -1e9; for (let dx = -130, k = 0; dx <= 40; dx += 3, k++) { for (const dy of [-8, 0, 8]) zFront = Math.max(zFront, wallZ(xRing + dx, yRing0 + dy, NET.zB + 70)); if (k % 12 === 11) await ctx.yield(); }
    await ctx.yield();
    const zRing = zFront + 18, ringAt = [xRing, net.yC(Math.min(net.sOf(zRing), 1)) - 41, zRing];
    const GL = 60, GW = (a, b, y) => [xRing - eS * a, y, zRing + b];   // the gangway's frame: a metres before the ring, b metres to the right of the flight (toward the open gulf)
    const deckG = (a) => ringAt[1] - EYE - a * (8 / GL);               // the gangway's deck climbs 8 m to the ring; the route flies EYE over it
    // Things are hung first and untested, and the route is then laid past them: at each the knot stands off by the
    // thing's own half breadth plus the lane plus 1 m, level with a house's middle (+1 m, its windows) or 2 m over a
    // boat's deck, so the pass is equally close on every seed. One rule for all of them (the street's, the lit house,
    // the far boat): beside(stream, Q, dir, sg, boat, o) hangs one beside the point Q of a straight stretch of the route
    // that runs along dir (unit, in plan), on the right of the flight (sg +1) or on its left (-1).
    const beats = [];
    const beside = (r, Q, dir, sg, boat, o = {}) => {
      const n = [-dir[1] * sg, dir[0] * sg], sc = o.scale ?? 1, off = (boat ? 2.1 : 5) * sc + LANE + 1 + (boat ? 0 : 4 * sc);      // about where it will stand; its knot is laid from the thing itself below
      const px = Q[0] + n[0] * off, pz = Q[2] + n[1] * off, py = net.y(px, pz);
      const rope = Math.max(3, py - Q[1] + (boat ? 2 - 8 * sc : 1 - 6.5 * sc));
      const hs = hangString(kit, r, [px, py, pz], { depth: 400, tint: canvasTint, kind: boat ? 'gondola' : 'big', rope, yaw: boat ? Math.atan2(-dir[1], dir[0]) : undefined, ...o }), h = hs[0];
      const b = { c: [h.top[0], (h.top[1] + h.bottom[1]) / 2, h.top[2]], r: boat ? h.info.reach.zMax * h.sc : h.info.r * h.sc, l: boat ? Math.max(0, (h.info.L - h.info.B) / 2 * h.sc) : 0, ax: dir, boat, top: h.top[1], bottom: h.bottom[1], hs };
      // the knot's stand-off from the thing's own axis: its TRUE half breadth toward the line (every thing of its
      // string counted, the pots at its sides too) + its swing toward the line at the gust's full value + the lane
      // + 1 m; and a great house (9 m tall or more) is passed at one and a half of its own height or more
      let reach = b.r, arm = 0;
      for (const t of hs) { arm = Math.max(arm, py - t.bottom[1]); if (!boat) reach = Math.max(reach, Math.hypot(t.top[0] - px, t.top[2] - pz) + t.info.reach.rMax * t.sc); else reach = Math.max(reach, Math.hypot(t.top[0] - px, t.top[2] - pz) + (t === h ? 0 : t.info.reach.rMax * t.sc)); }
      const great = !boat && h.info.H * h.sc >= 9 ? 1.5 * h.info.H * h.sc : 0;
      b.off = Math.max(reach + swingTo(arm, n[0], n[1]) + LANE + 1, great);
      b.sg = sg; b.k = [b.c[0] - n[0] * b.off, boat ? h.top[1] + h.info.deck * h.sc + 2 : b.c[1] + 1, b.c[2] - n[1] * b.off];
      beats.push(b); return b;
    };
    const unit2 = (ax, az, bx, bz) => { const l = Math.hypot(bx - ax, bz - az) || 1; return [(bx - ax) / l, (bz - az) / l, l]; };
    // the heart's knots: in 10 m before the bow and 2.5 m wider than the pass, 5 m over the deck (the street comes down to
    // it); abeam of the terrace at half its beam + the lane + 7 m (the outboard fringe of pots 2.5, the deck's swing 2.4,
    // 2.1 to spare), 3 m over the deck (eye level of a tall man on a table: under the awning's edge); out 16 m past the stern
    const pass = TI.B / 2 + LANE + 7;
    const H1 = W(-(TI.L / 2 + 10), side * (pass + 2.5), deckY + 5), H2 = W(-TI.L / 4, side * pass, deckY + 3), H3 = W(TI.L / 4, side * pass, deckY + 3), H4 = W(TI.L / 2 + 16, side * (pass - 3.5), deckY + 3.5);
    // the dive: through the hatch's centre at 40 degrees to the mesh (which itself falls some 15 degrees along the
    // route here), its two knots 7.5 m over the mesh 9 m before the centre and 7.5 m under it 9 m beyond, so the rim
    // is a lane's width away all round
    const D0 = over(gapZ + 9, TH * eS, 7.5), D1 = over(gapZ - 9, TH * eS, -7.5);
    // the street: one straight line in plan from under the hatch to the heart's first knot, 12 m under the net at its
    // head (a big house hung on 4 to 5 m of rope is then level with us). Stations: the first a drawn 8 to 20 m in, then
    // every drawn 34 to 42 m, as long as they stand outside the heart's clearing; sides alternate from a drawn side
    // (the street's own stream 'street': the count of its draws depends on the street's length, so nothing else
    // draws from it; the first house alone is the old large house of stream 'sack', moved to the street);
    // the large house first (smoke at its stovepipe), then a boat lying along the street, then a big house, and so on
    const heartR = 48;
    const sd = unit2(gap[0], gapZ, H1[0], H1[2]), S0 = [gap[0] + sd[0] * 22, 0, gapZ + sd[1] * 22]; S0[1] = net.y(S0[0], S0[2]) - 12;
    const sLen = Math.hypot(H1[0] - S0[0], H1[2] - S0[2]), street = [];
    { const st = R.street; let sg = st.chance(0.5) ? 1 : -1;
      for (let d = st.range(8, 20), i = 0; d < sLen; d += st.range(34, 42), i++, sg = -sg) {
        const Q = [S0[0] + sd[0] * d, lerp(S0[1], H1[1], d / sLen), S0[2] + sd[1] * d];
        if (Math.hypot(Q[0] - hx, Q[2] - hz) < heartR + 8) break;
        street.push(beside(i ? st : R.sack, Q, sd, sg, i % 2 === 1, i === 0 ? { scale: 1.15, smoke: true } : i % 2 ? { scale: 1.6 } : { scale: 1 }));
      } }
    const sack = street[0] || null;
    await ctx.yield();
    // the far third: a straight diagonal leg from the heart's last knot to the head of a 135 degree right turn (the
    // look-ahead is 26 m) that brings the crag's face round onto the left hand and ends at the gangway's head; then
    // the gangway, 60 m along the face to the ring. The leg and the turn climb evenly to the gangway. The turn's
    // radius is the layout's draw, 34 to 48 m: 34 leaves the works' look its two 40 m fades, 48 keeps the turn within
    // the stretch of face searched for the foremost rock; so the turn's head moves from visit to visit.
    // THE TURN ENDS TANGENT TO THE GANGWAY'S AXIS AND THE LINE KEEPS THE AXIS: knots on the turn's circle at 135, 90,
    // 45, 22.5 and 10 degrees (those at 90 and 45 lie 0.4 m inside the circle: the turn takes the line round a
    // little sooner, and the steady camera, whose gaze rests 88 m on, looks 73.6 degrees off the heading at the
    // most where the plain circle of 34 m gave 74.3); then five knots on the axis' own line and the gangway's own slope: 1.5 m before the
    // gangway's head (the circle is within 4 cm of the axis there), at its head, and at 45, 30 and 15 m before the
    // ring; then the ring. From the head on, every span of the line is laid through knots that all lie on one
    // straight line in space: the last 60 m are straight, on the axis, at the gangway's own pitch (7.6 degrees up).
    const TR = lay.range(34, 48), arc = (deg, e = 0) => { const a = deg * Math.PI / 180; return GW(GL + (TR - e) * Math.sin(a), TR - (TR - e) * Math.cos(a), 0); };
    const axisG = (a) => GW(a, 0, deckG(a) + EYE);                     // a point of the line a metres before the ring: on the gangway's axis, EYE over its deck
    const A135 = arc(135), A90 = arc(90, 0.4), A45 = arc(45, 0.4), A22 = arc(22.5), A10 = arc(10), GE = axisG(GL + 1.5), G0 = axisG(GL);
    const ld = unit2(H4[0], H4[2], A135[0], A135[2]), legLen = ld[2], farLen = legLen + TR * Math.PI * 0.75;
    const yFar = (d) => lerp(H4[1], G0[1], clamp(d / farLen, 0, 1));    // d: metres from the heart's last knot along the leg and round the turn
    A135[1] = yFar(legLen); A90[1] = yFar(legLen + TR * Math.PI * 0.25); A45[1] = yFar(legLen + TR * Math.PI * 0.5);
    A22[1] = Math.min(yFar(legLen + TR * Math.PI * 0.625), GE[1]); A10[1] = Math.min(yFar(legLen + TR * Math.PI * 125 / 180), GE[1]);
    // the lit house and the boat hang first beside the leg, at one third and two thirds of the part of it that has the
    // net over both its sides (3 m inside the edge rope), on opposite sides (the house's side is drawn)
    let legIn = 0; for (let d = 0; d <= legLen; d += 2) { const x = H4[0] + ld[0] * d, z = H4[2] + ld[1] * d; if (net.inside(x - ld[1] * 14, z + ld[0] * 14, 3) && net.inside(x + ld[1] * 14, z - ld[0] * 14, 3)) legIn = d; else break; }
    const litSide = R.far.chance(0.5) ? 1 : -1, legQ = (d) => [H4[0] + ld[0] * d, yFar(d), H4[2] + ld[1] * d];
    const lit = beside(R.far, legQ(legIn / 3), ld, litSide, false, { scale: 1.1, smoke: true }), boat = beside(R.far, legQ(legIn * 2 / 3), ld, -litSide, true, { scale: 1.3 });
    await ctx.yield();
    // THE ARRIVAL AND THE TOP RUN (round 5; the start and the first straight are round 6's, below). The five anchor chains' own places are drawn here (stream
    // 'ends', the same draws in the same order as before) so that the first knots can be laid from them. A HEAD STAY,
    // of the family of the far end's guys: one great cable from a staple high on the first mountain (58 to 66 m over
    // the ledge, midway between the bolts of two chains on a drawn hand of the ledge) down over the chains to the
    // net's next mid cable on that hand, 0.16 to 0.2 of the net out. Its first great load is the GATEHOUSE, hung
    // first: a house 1.3 times the common size, a drawn 50 to 56 m out from the ledge (over the last of the chains,
    // just before the net's head), its door turned to where we come from, a lamp over the door, a long pot at
    // either side, washing on a pole under it; its canvas is amber, the colour of the city's lamps.
    const chainPts = (A, B, sag, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n; o.push([lerp(A[0], B[0], t), lerp(A[1], B[1], t) - sag * 4 * t * (1 - t), lerp(A[2], B[2], t)]); } return o; };
    const er = R.ends, ar = R.arrive, chainEnds = [];
    for (const t of [-1, -0.5, 0, 0.5, 1]) {
      const a = net.at(0.003, t), bx = t * 43 + er.range(-3, 3) + (t > 0 ? 2 : 0); let bz = rimA(bx) + 3; const want = ledgeY + er.range(5.5, 9);
      while (height(bx, bz) < want && bz < rimA(bx) + 40) bz += 1.5;
      chainEnds.push({ t, a: [a[0], a[1] + 0.3, a[2]], b: [bx, height(bx, bz) + 0.3, bz], sag: er.range(3, 4.6) });
    }
    const h1 = ar.chance(0.5) ? 1 : -1, stX = (chainEnds[h1 > 0 ? 3 : 2].b[0] + chainEnds[h1 > 0 ? 4 : 1].b[0]) / 2, stY = ledgeY + ar.range(58, 66);
    let stZ = rimA(stX) + 3; while (height(stX, stZ) < stY && stZ < rimA(stX) + 160) stZ += 1.5;
    const stN = net.at(ar.range(0.16, 0.2), (TH + h1 * 0.5) * eS), stay = chainPts([stX, stY, stZ - 0.6], [stN[0], stN[1] + 0.3, stN[2]], ar.range(3, 5), 18);
    const stayAt = (z) => { for (let i = 0; i < 18; i++) if ((stay[i][2] - z) * (stay[i + 1][2] - z) <= 0) { const f = (z - stay[i][2]) / (stay[i + 1][2] - stay[i][2] || 1); return [lerp(stay[i][0], stay[i + 1][0], f), lerp(stay[i][1], stay[i + 1][1], f) - 0.3, z]; } return [stay[18][0], stay[18][1], stay[18][2]]; };
    const RUN = LANE + 0.17 + swH + 0.93;                              // the height over the mesh at the dive's start, over the inner mid cable: the lane, the cable's radius, the net's heave at the gust's full value, and the route's own sag between knots (8.05 m)
    const gate = { h1 }, pts = [];
    {
      const gp = stayAt(ledge[1] - ar.range(50, 56)), name = ar.pick(['sackA', 'sackB', 'sackC']), GI = kit.info(name), sc = 1.3, rope = ar.range(3.5, 5);
      // THE TOP RUN'S PLAN, from the gatehouse to the dive's start B (20 m before the hatch's middle, on the hatch's
      // line): not straight down the net any more but one long S over its top. A first leg slants across the net's
      // head AWAY from the stay's hand to a corner C (a drawn 0.36 to 0.42 of the way down, a drawn 0.22 to 0.27 of
      // the run's length aside of the hatch's line, never nearer than 8 m to the edge rope); a second leg slants back
      // to the hatch's line 26 m before B; the last stretch runs down that line. The corners are arcs of 46 and 40 m.
      // So the far crag stands to one hand, then to the other, and the dive alone is head-on. (Round 6: where the
      // start's search turns the first straight, the first corner lies on that straight's own line at the drawn
      // place down the net, and the S is the slimmer for it; the second corner ends where the drawn S's does.)
      const zD = gapZ + 20, B = over(zD, TH * eS, RUN), span = gp[2] - zD, zS = gp[2] - span * ar.range(0.36, 0.42), sS = net.sOf(zS);
      const xS = clamp(net.at(sS, TH * eS)[0] - h1 * span * ar.range(0.22, 0.27), net.cx(sS) - net.half(sS) + 8, net.cx(sS) + net.half(sS) - 8);
      // the first leg's direction f; the gatehouse stands 'off' aside of it on the stay's hand (n: from the house to our line)
      let f = unit2(gp[0] - h1 * 18, gp[2], xS, zS), n = [h1 * f[1], -h1 * f[0]];
      const aDoor = Math.atan2(GI.door[2], GI.door[0]), aLine = Math.atan2(n[1] - 0.6 * f[1], n[0] - 0.6 * f[0]), yaw = aDoor - aLine, rDoor = Math.hypot(GI.door[0], GI.door[2]) * sc;
      const add = (kind, o) => { const r = kit.add(kind, { pivot: gp, seed: ar(), ...o }); r.rope = o.rope ?? 0; r.name = kind; return r; };
      const hs = [add(name, { rope, scale: sc, yaw, tint: mulc(STRONG[1], ar.range(0.82, 1)), smoke: true })], h = hs[0], mid = rope + (GI.nk + GI.H * 0.58) * sc, rad = GI.R * sc + 0.45;
      hs.push(add('lamp', { at: [Math.cos(aLine) * rDoor, -rope + (GI.door[1] + 2.0) * sc, Math.sin(aLine) * rDoor], rope: 0, scale: 1.7, glow: 1.4 }));
      for (const sg of [-1, 1]) hs.push(add('potLong', { at: [Math.cos(aLine + sg * 1.9) * rad, -mid, Math.sin(aLine + sg * 1.9) * rad], rope: 0, scale: 1.3 }));
      hs.push(add('laundryB', { at: [0, -(rope + GI.h * sc + 1.1), 0], rope: 1.1, yaw: Math.PI / 2, scale: 1.25 }));
      // the knot abeam of it (KA), by the rule of things hung first: 1.6 of the house's whole height from its axis, or
      // the lane's stand-off (its true breadth, its swing, the lane, 1 m) if that is more; level with its middle + 1 m
      // here (the start's search below lays it 0 to 16 m higher, never lower).
      // The leg's direction and the knot turn on each other: three passes settle them.
      let reach = 0, arm = 0; for (const t of hs) { reach = Math.max(reach, Math.hypot(t.top[0] - gp[0], t.top[2] - gp[2]) + t.info.reach.rMax * t.sc); arm = Math.max(arm, gp[1] - t.bottom[1]); }
      const yMid = h.top[1] - (GI.nk + GI.H * 0.5) * sc, KA = [0, yMid + 1, 0]; let off = 0;
      const standOff = (m) => Math.max(1.6 * GI.h * sc, reach + swingTo(arm, m[0], m[1]) + LANE + 1);
      for (let k = 0; k < 3; k++) { off = standOff(n); KA[0] = gp[0] + n[0] * off; KA[2] = gp[2] + n[1] * off; f = unit2(KA[0], KA[2], xS, zS); n = [h1 * f[1], -h1 * f[0]]; }
      // THE START AND THE FIRST STRAIGHT (round 6). The flight begins LEVEL and STRAIGHT: one line in plan through the
      // start, that knot and on to the S's first corner, level at the knot's height (the gatehouse's middle + 1 m) or
      // 2, 4, ... 16 m over it until LEVEL metres in; then it curves over and comes down in one even slope to round
      // 5's line over the mesh (see the knots' heights below). The first mountain stands 35 to 45 m behind the knot
      // and the head stay comes down over it, so there is little room: the candidates are run-ins of 36, 34, ... 12 m
      // before the knot, at those nine heights, along the drawn first leg's own direction or that leg turned toward the net's own axis by 5, 10, ...
      // degrees (the knot always abeam of the gatehouse at its stand-off, square to the straight). THE TESTS of a
      // candidate, after the draws: (1) no ground within 15 m of the start in space (a ball of 15.2 m, to be sure of
      // it): the height function under it, on rings of 16 points every 2.5 m out to 15 m about it, and at those six
      // distances straight behind it; (2) no thing of the
      // gatehouse within 15 m of the start; (3) the head stay and every anchor chain 15 m or more from the start in
      // space, skin to point (the stay is 0.6 m thick, a chain's iron 0.4 m and its links a metre broad: twenty
      // thicknesses are 12 and 8 m, so the 15 m rule: 15.3 m to the stay's middle line, 15 m to a chain's);
      // (4) all along the level stretch the ground 12 m or more under the line, every chain 15 m or more from it, the
      // stay 12 m or more from it and always on the gatehouse's hand of it: the line never passes under or over the
      // stay. OF THE CANDIDATES THAT PASS, THE ONE FROM WHICH THE LINE COMES DOWN MOST GENTLY IS TAKEN (the slope
      // below), a turn counting one degree of slope for every 5 degrees, a shortened level stretch one degree for
      // every 3 m, a run-in under 28 m (from which the gatehouse is hardly seen) one degree for every 8 m, and every
      // degree over 4 by which the point 88 m on lies off the start's own level line (where the S's first corner or
      // the descent comes early: the steady camera's gaze rests on that point) one and a half degrees.
      const run0 = ar.range(38, 44), rise0 = ar.range(3, 5), phi = Math.atan2(Math.abs(f[0]), -f[1]), sgx = f[0] < 0 ? -1 : 1;
      const LEVEL = 20 + run0, CURVE = 6 * rise0;                     // the level stretch's length (58 to 64 m) and the length over which the line then curves down (18 to 30 m): the two draws that were the old run-in's length and rise
      const segGap = (p, a, b) => { const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], t = clamp(((p[0] - a[0]) * ab[0] + (p[1] - a[1]) * ab[1] + (p[2] - a[2]) * ab[2]) / Math.max(ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2], 1e-6), 0, 1); return Math.hypot(a[0] + ab[0] * t - p[0], a[1] + ab[1] * t - p[1], a[2] + ab[2] * t - p[2]); };
      const ropeGap = (p, P) => { let g = 1e9; for (let i = 0; i + 1 < P.length; i++) g = Math.min(g, segGap(p, P[i], P[i + 1])); return g; };
      const chainsP = chainEnds.map((ce) => chainPts(ce.a, ce.b, ce.sag, 12));
      const free15 = (p, g) => {
        if (height(p[0], p[2]) > p[1] - 15.2) return false;
        for (const r of [2.5, 5, 7.5, 10, 12.5, 15]) {
          const dy = Math.sqrt(Math.max(15.2 * 15.2 - r * r, 0));
          for (let k = 0; k < 16; k++) if (height(p[0] + Math.cos(k * TAU / 16) * r, p[2] + Math.sin(k * TAU / 16) * r) > p[1] - dy) return false;
          if (height(p[0] - g[0] * r, p[2] - g[1] * r) > p[1] - dy) return false;
        }
        return true;
      };
      const abeam = (turn) => {                                       // the straight's direction and the knot abeam of the gatehouse for a turn of the drawn leg
        if (!turn) return { g: [f[0], f[1]], K: [KA[0], KA[1], KA[2]], off };
        const a = Math.max(phi - turn, 0), g = [sgx * Math.sin(a), -Math.cos(a)], m = [h1 * g[1], -h1 * g[0]], o = standOff(m);
        return { g, K: [gp[0] + m[0] * o, yMid + 1, gp[2] + m[1] * o], off: o };
      };
      const passes = (A, run, up) => {
        const g = A.g, K = A.K, y = K[1] + up, S = [K[0] - g[0] * run, y, K[2] - g[1] * run], side = K[0] > stayAt(K[2])[0];
        for (const t of hs) if (Math.hypot(Math.max(Math.hypot(S[0] - t.top[0], S[2] - t.top[2]) - t.info.reach.rMax * t.sc, 0), y - clamp(y, t.bottom[1], t.top[1])) < 15) return null;
        if (ropeGap(S, stay) < 15.3) return null;
        for (const c of chainsP) if (ropeGap(S, c) < 15) return null;
        if (!free15(S, g)) return null;
        for (let d = 0; d <= LEVEL; d += 4) {
          const p = [S[0] + g[0] * d, y, S[2] + g[1] * d];
          if (ropeGap(p, stay) < 12 || (p[0] > stayAt(p[2])[0]) !== side) return null;
          for (const c of chainsP) if (ropeGap(p, c) < 15) return null;
          for (let k = 0; k < 9; k++) if (height(p[0] + (k % 3 - 1) * 6, p[2] + (Math.floor(k / 3) - 1) * 6) + 12 > y) return null;
        }
        return S;
      };
      // THE KNOTS OF THE TOP RUN for a start, in plan: the straight (a knot every 22 m or less), the S's first corner
      // on the straight's own line at its drawn place down the net, its arc, the second leg (a knot every 30 m), the
      // second corner's arc; and THEIR HEIGHTS: level at the start's height until LEVEL metres in (by the plan's own
      // length), then the line curves over across CURVE metres and comes down in one even slope to the round 5
      // height, 13 m over the mesh under it (clear of every post, pennant and walk on the net's top by the lane and
      // more; 12 and 10.5 m over it on the second corner): a slope of 23 degrees, or the slope that meets that
      // height at the second corner's end if that is steeper. The last knots before the dive are round 5's own.
      // WHERE THE HATCH LIES IN THE NEAREST BAY THE TOP RUN IS SHORT: if that slope would pass 38 degrees, the level
      // stretch is shortened (to 45 m at the least) until it does not.
      const fillet = (ax, az, cx, cz, bx, bz, R, T0) => {                // the arc of radius R (or less, if the legs are short; or of the tangent length T0, if given) that rounds the corner (cx, cz) of the legs a-c-b: its start, middle, end and the leg lengths left
        const d1 = unit2(ax, az, cx, cz), d2 = unit2(cx, cz, bx, bz), hf = Math.acos(clamp(d1[0] * d2[0] + d1[1] * d2[1], -1, 1)) / 2, tn = Math.max(Math.tan(hf), 1e-3);
        const T = T0 || Math.min(R * tn, d1[2] * 0.6, d2[2] * 0.6), r = T / tn, bi = unit2(0, 0, d2[0] - d1[0], d2[1] - d1[1]), q = r / Math.max(Math.cos(hf), 0.2) - r;
        return { p1: [cx - d1[0] * T, cz - d1[1] * T], pm: [cx + bi[0] * q, cz + bi[1] * q], p2: [cx + d2[0] * T, cz + d2[1] * T], d1, d2, T };
      };
      const zC2 = zD + 26, xC2 = net.at(net.sOf(zC2), TH * eS)[0], T2 = fillet(xS, zS, xC2, zC2, B[0], B[2], 40).T, sC = net.sOf(zS);
      const zN = NET.zA - 6, meshY = (k) => (k[1] < zN ? net.y(k[0], k[1]) + k[2] : -1e9), ramp = (x) => (x <= 0 ? 0 : x < CURVE ? x * x / (2 * CURVE) : x - CURVE / 2), STEEP = 0.78, FAR = 88.4;
      const layTop = (A, S, turn) => {
        const g = A.g, K = A.K, xC = turn ? clamp(K[0] + g[0] * (zS - K[2]) / Math.min(g[1], -0.2), net.cx(sC) - net.half(sC) + 8, net.cx(sC) + net.half(sC) - 8) : xS;
        const F1 = fillet(K[0], K[2], xC, zS, xC2, zC2, 46), F2 = fillet(xC, zS, xC2, zC2, B[0], B[2], 40, turn ? T2 : 0), bend = F1.T >= 6;      // the second corner ends where the drawn S's does on every visit: the line into the dive is round 5's; a first corner of next to no angle is one knot, not an arc
        // the knots in plan for a list of places (metres in) where the first straight wants a knot of its own: the
        // start, the knot abeam, those places (if they lie on the straight, 5 m or more from its ends and from the
        // knot abeam) and the straight's end, with a knot every 22 m or less between them
        const lay = (want) => {
          const plan = [], put = (x, z, up = 13) => { const l = plan[plan.length - 1]; plan.push([x, z, up, l ? l[3] + Math.hypot(x - l[0], z - l[1]) : 0]); return plan.length - 1; };
          const leg = (a, b, step) => { const u = unit2(a[0], a[1], b[0], b[1]), m = Math.max(1, Math.round(u[2] / step)); for (let i = 1; i < m; i++) put(a[0] + u[0] * u[2] * i / m, a[1] + u[1] * u[2] * i / m); };
          const e = bend ? F1.p1 : [xC, zS], l1 = unit2(S[0], S[2], K[0], K[2]), l2 = unit2(K[0], K[2], e[0], e[1]), dK = l1[2], dE = dK + l2[2];
          const at = (d) => (d <= dK ? [S[0] + l1[0] * d, S[2] + l1[1] * d] : [K[0] + l2[0] * (d - dK), K[2] + l2[1] * (d - dK)]);
          const ds = [0, dK, ...want.filter((d) => d > 5 && d < dE - 5 && Math.abs(d - dK) > 5)].sort((p, q) => p - q); ds.push(dE);
          put(S[0], S[2]);
          for (let i = 1; i < ds.length; i++) { const m = Math.max(1, Math.ceil((ds[i] - ds[i - 1]) / 22 - 1e-6)); for (let j = 1; j <= m; j++) if (i < ds.length - 1 || j < m) put(...(ds[i] === dK && j === m ? [K[0], K[2]] : at(lerp(ds[i - 1], ds[i], j / m)))); }
          if (bend) put(...F1.p1); const iC = bend ? put(...F1.pm) : put(xC, zS); if (bend) put(...F1.p2); leg(bend ? F1.p2 : [xC, zS], F2.p1, 30);
          put(...F2.p1); put(...F2.pm, 12); const iF = put(...F2.p2, 10.5);
          return { plan, iC, iF };
        };
        const bare = lay([]), drop = S[1] - meshY(bare.plan[bare.iF]), dF = bare.plan[bare.iF][3] - CURVE / 2, level = drop / Math.max(dF - LEVEL, 30) > STEEP ? clamp(dF - drop / STEEP, 45, LEVEL) : LEVEL;
        const slope = Math.max(drop / Math.max(dF - level, 30), 0.42);
        // a knot 10 m before the level stretch's end, one at it and one 8 m after it: the line holds its height to
        // that end (the spline has no knot to dip toward before it) and curves over from there
        const { plan, iC } = lay([level - 10, level, level + 8]);
        // how far the point FAR metres on (the reach of the steady camera's gaze: 3.4 look-aheads) lies off the start's own level line, in radians: its bearing off the straight, and its drop (which that camera counts 0.55)
        let i = 1; while (i < plan.length - 1 && plan[i][3] < FAR) i++;
        const u = clamp((FAR - plan[i - 1][3]) / Math.max(plan[i][3] - plan[i - 1][3], 1e-3), 0, 1), fx = lerp(plan[i - 1][0], plan[i][0], u) - S[0], fz = lerp(plan[i - 1][1], plan[i][1], u) - S[2];
        const bear = Math.acos(clamp((fx * g[0] + fz * g[1]) / Math.max(Math.hypot(fx, fz), 1), -1, 1)), nod = Math.hypot(bear, Math.atan(0.55 * slope * ramp(FAR - level) / FAR));
        return { plan, iC, level, slope, nod };
      };
      await ctx.yield();
      let st = null;
      for (let turn = 0; turn <= phi + 0.09; turn += 5 * Math.PI / 180) {
        const A = abeam(turn);
        for (let up = 0; up <= 16; up += 2) {
          for (let run = 36; run >= 12; run -= 2) {
            const S = passes(A, run, up); if (!S) continue;
            const top = layTop(A, S, turn), cost = Math.atan(top.slope) + turn / 5 + 1.5 * Math.max(top.nod - 0.07, 0) + ((LEVEL - top.level) / 3 + Math.max(28 - run, 0) / 8) * Math.PI / 180;
            if (!st || cost < st.cost - 1e-9) st = { A, S, turn, run, up, top, cost };
            break;
          }
          await ctx.yield();
        }
      }
      if (!st) { const A = abeam(0), S = [A.K[0] - A.g[0] * 12, A.K[1] + 16, A.K[2] - A.g[1] * 12]; st = { A, S, turn: 0, run: 12, up: 16, top: layTop(A, S, 0), cost: 0 }; }
      const K0 = st.S, yL = K0[1], plan = st.top.plan, slope = st.top.slope; KA[0] = st.A.K[0]; KA[1] = yL; KA[2] = st.A.K[2]; off = st.A.off;
      Object.assign(gate, { gp, K0, K1: KA });
      beats.push({ c: [gp[0], (h.top[1] + h.bottom[1]) / 2, gp[2]], r: reach, l: 0, ax: [0, -1], boat: false, top: h.top[1], bottom: h.bottom[1], hs });
      for (const k of plan) pts.push([k[0], Math.max(meshY(k), yL - slope * ramp(k[3] - st.top.level)), k[1]]);
      pts.push(B);
      gate.corner = pts[st.top.iC];
    }
    // the dive starts beyond the hatch's rim: level until 20 m before its centre
    pts.push(D0, [gap[0], gap[1], gapZ], D1, S0, ...street.map((b) => b.k), H1, H2, H3, H4, lit.k, boat.k, A135, A90, A45, A22, A10, GE, G0, axisG(45), axisG(30), axisG(15), ringAt);
    const path = makePath(pts);
    await ctx.yield();
    const endP = path.end.clone();
    // places on the route, in metres flown from the start
    const Lr = path.length, _pv = new THREE.Vector3();
    const mAt = (x, y, z) => { let bm = 0, bd = 1e18; for (let m = 0; m <= Lr; m += 1) { path.posAtDist(m, _pv); const d = (_pv.x - x) ** 2 + (_pv.y - y) ** 2 + (_pv.z - z) ** 2; if (d < bd) { bd = d; bm = m; } } return bm; };
    const uM = (m) => clamp(m / Lr, 0, 1);
    // The lane's own function: the route sampled every metre into a grid of 32 m cells. laneGap(x, y, z, arm) is the
    // least distance from the route to the box that a ball's centre resting at (x, y, z), 'arm' metres under its hang
    // point, can reach at the gust's full swing (see swA, swB, swH above); a static rope has arm 0 and only heaves.
    const lanePts = new Float32Array((Math.floor(Lr) + 2) * 3), laneGrid = new Map();
    for (let m = 0, n = 0; m < Lr + 1; m += 1, n++) {
      path.posAtDist(Math.min(m, Lr), _pv); lanePts[n * 3] = _pv.x; lanePts[n * 3 + 1] = _pv.y; lanePts[n * 3 + 2] = _pv.z;
      const k = Math.floor(_pv.x / 32) + ':' + Math.floor(_pv.z / 32); let l = laneGrid.get(k); if (!l) laneGrid.set(k, l = []); l.push(n * 3);
    }
    const laneGap = (x, y, z, arm = 0) => {
      const a = swA * arm, b = swB * arm, cx = Math.floor(x / 32), cz = Math.floor(z / 32); let best = 1e9;
      for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) {
        const l = laneGrid.get(i + ':' + j); if (!l) continue;
        for (let q = 0; q < l.length; q++) {
          const s = l[q], dx = lanePts[s] - x, dy = lanePts[s + 1] - y, dz = lanePts[s + 2] - z;
          const u = Math.max(Math.abs(dx * windX + dz * windZ) - a, 0), w = Math.max(Math.abs(dz * windX - dx * windZ) - b, 0), v = Math.max(Math.abs(dy) - swH, 0), d = u * u + w * w + v * v;
          if (d < best) best = d;
        }
      }
      return Math.sqrt(best);
    };
    // the test every hung thing passes by its true reach (hangString's lane): the lane at the gust's full swing, and a
    // great house (9 m tall or more) keeps one and a half of its own height from the line
    const lane = (x, y, z, r, arm, great) => { const g = laneGap(x, y, z, arm); return g > r + LANE + 0.2 && (!great || g > 1.5 * great); };      // 0.2 m to spare: a form turns a little as it swings
    // THE START'S OWN ROOM (round 6): nothing that hangs from the head stay (a load and every thing of its string, a
    // lantern, a pennant) stands within 15 m of the start in space at the gust's full swing. startGap is the lane's
    // own measure (the swing box of a ball 'arm' metres under its hang point) taken to the start's one point;
    // laneStart is the lane's test with that room added (15.2 m, to be sure of 15). The stay's things are tested by
    // it with their true reach, as every hung thing is by the lane (see the head stay, below).
    const startGap = (x, y, z, arm = 0) => { const dx = gate.K0[0] - x, dy = gate.K0[1] - y, dz = gate.K0[2] - z; return Math.hypot(Math.max(Math.abs(dx * windX + dz * windZ) - swA * arm, 0), Math.max(Math.abs(dz * windX - dx * windZ) - swB * arm, 0), Math.max(Math.abs(dy) - swH, 0)); };
    const laneStart = (x, y, z, r, arm, great) => lane(x, y, z, r, arm, great) && startGap(x, y, z, arm) > r + 15.2;
    // A CHIMNEY'S PLUME is tested by the same function when the kit is finished: the plume's middle line from the pipe's
    // top to its own top, at the gust's greatest lean and at its least, with its half width, the pipe swinging with
    // its house; a house whose plume would come into the lane has no plume (the stove is out)
    kit.plumeTest = (px, py, pz, ax, ay, az, sc, seed) => {
      const H = PLUME.height(sc, seed), arm = Math.hypot(ax, ay, az);
      for (const lean of [PLUME.leanMax, PLUME.leanMin]) for (let k = 1; k <= 7; k++) {
        const v = k / 7, q = PLUME.at(H, lean, v);
        if (!lane(px + ax + windX * q[1], py + ay + q[0], pz + az + windZ * q[1], PLUME.half(sc, v), arm, 0)) return false;
      }
      return true;
    };
    // PLAIN FORMS: a string whose hang point, at its top's depth, is farther than FAR metres from the route's line in
    // space is hung in the plain form of each kind (same size and outline, fewer sides, no fittings): a rule of
    // distance in space, the same for every string of the city; it pays for the town's thickness
    const FAR = 36, farAt = (x, y, z) => { for (let s = 0; s < lanePts.length; s += 9) { const dx = lanePts[s] - x, dy = lanePts[s + 1] - y, dz = lanePts[s + 2] - z; if (dx * dx + dy * dy + dz * dz < FAR * FAR) return false; } return true; };
    // one rule for every cable that is not the gangway's own: points every 2 m at most, its own radius, its heave
    const cableClear = (pts, rad) => {
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2));
        for (let k = 0; k <= n; k++) if (laneGap(lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n), lerp(a[2], b[2], k / n), 0) <= rad + LANE) return false;
      }
      return true;
    };
    const mGate = mAt(...gate.K1), mCorner = mAt(...gate.corner), mHatch = mAt(gap[0], gap[1], gapZ), mStreet = mAt(...S0), mSack = sack ? mAt(...sack.k) : mStreet, mH1 = mAt(...H1), mHero = mAt(hx, deckY + 3, hz), mH4 = mAt(...H4);
    let mNet = mGate; for (let m = 0; m <= Lr; m++) { path.posAtDist(m, _pv); if (_pv.z < NET.zA) { mNet = m; break; } }      // where the route comes over the net's head
    const mLit = mAt(...lit.k), mBoat = mAt(...boat.k), mTurn = mAt(...A135), mGang = mAt(...G0);
    // where the route's own line first comes out of the first mountain's shade into the sun (the whole length if it never does)
    let mSun = Lr; for (let m = 0; m <= Lr; m += 2) { path.posAtDist(m, _pv); if (_pv.y > shadeH(_pv.x, _pv.z)) { mSun = m; break; } }
    // where the route comes into the heart's clearing and where it leaves it
    let mNear = -1, mLeave = mHero; for (let m = mHatch; m <= mTurn; m++) { path.posAtDist(m, _pv); if (Math.hypot(_pv.x - hx, _pv.z - hz) < heartR) { if (mNear < 0) mNear = m; mLeave = m; } } if (mNear < 0) mNear = mHero;
    await ctx.yield();
    const clearOf = (m) => (x, y, z, r) => path.distanceTo(x, y, z) > r + m;
    const edgeP = (s, t, drop) => { const p = net.at(s, t); return [p[0], p[1] - drop, p[2]]; };
    // the two cable cars cross far below the route (their cables hang 40 to 50 m under the net's edges, the route 12 to 24 m
    // under its middle): one 14 m astern of the terrace's middle, one at the far edge of the heart's clearing; each cable
    // is slewed a little (0.04 of the net's length end to end) so the two are not parallel
    // THE LAST 60 M'S OWN ROOM (round 6): nothing that rides or is built beside the line's last 60 m (a cable car on its
    // way, the works' gallery) comes within 15 m of that stretch of the line: endFree is the lane's own measure (the
    // distance to the line's own points, a metre apart) kept to the last 60 m with that margin. A car's way that fails
    // is slung 0.03 of the net's length nearer the head, as often as it takes (ten times at most).
    const endGap = (x, y, z) => { let b = 1e18; for (let s = Math.max(0, Math.floor(Lr) - 60) * 3; s < lanePts.length; s += 3) { const dx = lanePts[s] - x, dy = lanePts[s + 1] - y, dz = lanePts[s + 2] - z; b = Math.min(b, dx * dx + dy * dy + dz * dz); } return Math.sqrt(b); };
    const endFree = (x, y, z, r) => endGap(x, y, z) > r + 15;
    const carFree = (A, B, sag) => { for (let i = 0; i <= 28; i++) { const t = i / 28; if (!endFree(lerp(A[0], B[0], t), lerp(A[1], B[1], t) - sag * 4 * t * (1 - t) - 1.8, lerp(A[2], B[2], t), 2.5)) return false; } return true; };
    const carWay = (mk) => { let way = mk(0); for (let j = 1; j <= 10 && !carFree(way[0], way[1], way[2]); j++) way = mk(j * 0.03); return way; };
    const sCar = net.sOf(hz - 14), sCar2 = net.sOf(hz - heartR - 10), sIn = (s) => clamp(s, 0.03, 0.97);
    const carLines = [carWay((d) => [edgeP(sIn(sCar - d + 0.02), -0.86 * side, 44), edgeP(sIn(sCar - d - 0.02), 0.86 * side, 50), 10]), carWay((d) => [edgeP(sIn(sCar2 - d - 0.02), -0.8, 40), edgeP(sIn(sCar2 - d + 0.02), 0.84, 46), 9])];
    const nearCar = (x, y, z, r) => {
      for (const [A, B, sag] of carLines) {
        const dx = B[0] - A[0], dz = B[2] - A[2], t = clamp(((x - A[0]) * dx + (z - A[2]) * dz) / (dx * dx + dz * dz), 0, 1), cy = lerp(A[1], B[1], t) - sag * 4 * t * (1 - t);
        if (Math.hypot(x - A[0] - dx * t, z - A[2] - dz * t) < r + 2.6 && y - r < cy + 1.5 && y + r > cy - 5.5) return true;
      }
      return false;
    };
    const walks = [];                                                  // the lower tier's walkways, as segments [ax, ay, az, bx, by, bz]
    const nearWalk = (x, y, z, r) => {
      for (const w of walks) {
        const dx = w[3] - w[0], dy = w[4] - w[1], dz = w[5] - w[2], t = clamp(((x - w[0]) * dx + (y - w[1]) * dy + (z - w[2]) * dz) / (dx * dx + dy * dy + dz * dz), 0, 1);
        if (Math.hypot(x - w[0] - dx * t, y - w[1] - dy * t + 1.5, z - w[2] - dz * t) < r + 3.2) return true;
      }
      return false;
    };
    const nearBeat = (x, z, r) => { for (const b of beats) { const dx = x - b.c[0], dz = z - b.c[2], al = dx * b.ax[0] + dz * b.ax[1], ab = dx * b.ax[1] - dz * b.ax[0]; if (Math.hypot(ab, Math.max(0, Math.abs(al) - b.l)) < b.r + r + 2.5) return true; } return false; };   // b.l: half a boat's length less its half beam, along its own axis b.ax
    // a lane round the route, 3.5 m wider for the big houses; nothing hangs into a cable car's way, a walkway or a thing hung first (house or boat)
    // and no string hangs through another: every thing hung (its body and the rope above it, as upright rods) is entered
    // in a grid of 12 m cells, and a new thing keeps 0.5 m from all of them
    const occ = new Map(), occKey = (x, z) => Math.floor(x / 12) + ':' + Math.floor(z / 12);
    const occPut = (x, z, y0, y1, r) => { const k = occKey(x, z); let l = occ.get(k); if (!l) occ.set(k, l = []); l.push(x, z, y0, y1, r); };
    const occAdd = (h) => { occPut(h.top[0], h.top[2], h.bottom[1], h.top[1], h.info.r * h.sc); if (h.rope > 0.5) occPut(h.top[0], h.top[2], h.top[1], h.top[1] + h.rope, 0.25); };
    const occFree = (x, y, z, r) => {
      const cx = Math.floor(x / 12), cz = Math.floor(z / 12);
      for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) { const l = occ.get(i + ':' + j); if (!l) continue; for (let k = 0; k < l.length; k += 5) if (y + r > l[k + 2] - 0.5 && y - r < l[k + 3] + 0.5 && Math.hypot(x - l[k], z - l[k + 1]) < r + l[k + 4] + 0.5) return false; }
      return true;
    };
    const hang = (r, P, o) => { const out = hangString(kit, r, P, { lane, far: farAt(P[0], P[1] - (o.rope ?? 8), P[2]), ...o }); for (const h of out) occAdd(h); return out; };
    for (const b of beats) for (const h of b.hs) occAdd(h);
    const pathClear = clearOf(LANE), clear = (x, y, z, r) => pathClear(x, y, z, r > 3 ? r + 3.5 : r) && !nearCar(x, y, z, r) && !nearWalk(x, y, z, r) && !nearBeat(x, z, r) && occFree(x, y, z, r) && ((z > NET.zB + 70 && z < NET.zA - 70) || height(x, z) < y - r - 1.5);

    // ------------------------------------------------------------ the rock (its shape is worked out above, before the places)
    await ctx.yield();
    const beds = T.makeStrata({ rng: R.beds, rock: '#8b8f92', rockB: '#63696f', accent: '#a09682', dark: '#454c55', beds: 14, thickness: 19, contrast: 0.8, seams: 0.2 });
    const terrain = await T.makeTerrainAsync({
      rng: R.terrain, noise, height, corridor: false, bounds: [-1000, -1500, 1000, 760], cell: 4, near: 56, levels: 5, refine: 2, maxTriangles: 76000,
      focus: (x, z) => Math.min(segD(x, z, 60), segD(x, z, -570)), biome: 'alpine', strata: beds, sunDir, heightRange: [-560, 560], skirt: 60,
      palette: { ramp: [[0, '#555d66'], [0.35, '#6f767d'], [0.6, '#84898d'], [1, '#9a9d9f']], alt: '#8c8468', altAmount: 0.45, rock: '#8b8f92', rockB: '#5f656b', rockSlope: [0.5, 0.74], strata: 0.5, strataWarp: 16, joints: 0.4, streaks: 0, varnish: 0,
        snow: '#f2f6fb', snowLine: 0.485, snowBlend: 0.05, snowNoise: 0.34, snowSlope: [0.34, 0.62], patch: '#8e8a6e', patchAmount: 0.3, tufts: 0.3, clouds: 0.3 },
    }, ctx.yield);
    // the rock's own light: the sky's bounce in the shade (so no face goes under a readable dark), the lamps of the far
    // anchorage on the wall round the ring, and a soft even band of mist where the rock goes into the cloud
    const rockLight = faceRock(terrain.material, { snow: [-20, 230, 150, 420], footLow: HR.sea + 4, footHigh: HR.sea + 60, footAmount: 1, mist: sky.cloudShade.clone().lerp(sky.cloudLit, 0.5).lerp(fogCol, 0.3), shadeG: SG.g, shadeP: [sunX, sunZ, sunTan, 1 / SG.step], shadeQ: [SG.c0, 18],
      fill: sky.ambientColor.clone().lerp(sky.horizonColor, 0.25).multiplyScalar(HR.fill), fillDir: [-sunDir.x, 0.55, -sunDir.z], lampColor: new THREE.Color('#ffb968').multiplyScalar(HR.lamp), bounce: sky.cloudLit.clone().multiplyScalar(night ? 0.12 : hourName === 'day' ? 0.42 : 0.22) });
    scene.add(terrain.object);
    await ctx.yield();
    const ridges = T.makeHorizonRidges({ rng: R.ridges, layers: 4, radius: [1700, 3600], height: [300, 900], base: -260, fog: scene.fog, sunDir, sunColor: sky.lightColor, sunIntensity: night ? 0.4 : 1, snow: true, snowLine: 0.48, jagged: 0.34 });
    scene.add(ridges.object);
    await ctx.yield();

    // ------------------------------------------------------------ the net and everything that hangs from it
    // at dawn and at golden the sun is low: a stronger warm key against a cooler, weaker bounce from below (the fog's pink is
    // kept out of the fill), so every pod has a lit side and a cool side
    const low = hourName === 'dawn' || hourName === 'golden';
    const PI = Math.PI, hemiG = rig.hemi.groundColor, sunK = sky.lightIntensity / PI, ambK = rig.hemi.intensity / PI * HR.amb;
    kit.setLight({
      sunDir, sunCol: sky.lightColor.clone().multiplyScalar(sunK * (night ? 1.5 : low ? 1.35 : 1)), sky: sky.ambientColor.clone().multiplyScalar(ambK), ground: hemiG.clone().lerp(fogCol, night ? 0.3 : low ? 0.35 : 0.7).multiplyScalar(ambK * (night || low ? 1 : 1.5)).add(sky.lightColor.clone().multiplyScalar(sunK * (night ? 0.1 : 0.2))),
      fog: fogCol, fogDensity: HR.den, lampK: HR.lampK, lantern: HR.lantern,
      hemp: night ? new THREE.Color(1.5, 1.62, 1.9) : new THREE.Color().setRGB(COLORS.hemp[0], COLORS.hemp[1], COLORS.hemp[2]),
    });
    const hatch = (s, t, r) => { const p = net.at(s, t); return [p[0], p[2], r]; };
    // the great hatch's radius is measured: the least from 11.5 m up at which every point of its rim rope (0.16 m thick,
    // 0.3 m outside the radius) keeps the lane by the lane's own function, the net's heave counted
    let gapR = 11.5;
    for (; gapR < 15; gapR += 0.25) { let ok = true; for (let k = 0; k < 44 && ok; k++) { const a = k / 44 * TAU, x = gap[0] + Math.cos(a) * (gapR + 0.3), z = gapZ + Math.sin(a) * (gapR + 0.3); ok = laneGap(x, net.y(x, z) + 0.2, z, 0) > LANE + 0.16 + 0.2; } if (ok) break; }
    // three small hatches (ladder holes, 3.2 to 3.6 m): one in each of three stretches of the net (before the great
    // hatch's bays, beyond the heart's middle, toward the far end), each in a field between a catwalk and a mid cable
    // (t 0.33 to 0.42 or 0.58 to 0.67 of the half width); the first and last on the side away from the top run
    const holes = [[gap[0], gapZ, gapR], hatch(lay.range(0.18, 0.26), -lay.range(0.33, 0.42) * eS, 3.2), hatch(lay.range(0.56, 0.64), lay.range(0.58, 0.67) * eS, 3.6), hatch(lay.range(0.7, 0.78), -lay.range(0.33, 0.42) * eS, 3.2)];
    await ctx.yield();
    const netBits = await buildNet(kit, R.net, { path, holes, density, far: 34, plain: FAR, yield: ctx.yield });
    scene.add(netBits.surface);
    await ctx.yield();
    const hero = await buildHero(ctx, { kit, rng: R.heart, origin: [hx, hz], clear, lane, density, yaw: tYaw, tint: heartTint, awning: strong3[1] });
    for (const h of hero.strings) occAdd(h);
    await ctx.yield();
    // one walkway of the lower tier from A to B (it sags 2.2 m): plank ties, a hanger up to the net every 5.6 m on both
    // sides (leaning out by 'lean' metres), hand ropes, lamps. It is laid only where it (deck and hangers) clears the lane, the hatches, the other
    // walkways and everything hung so far (and, when asked, the heart's clearing); returns whether it was laid.
    const walkway = (r, A, B, keepHeart, lean = 2.5, least = 36) => {
      const CC = COLORS, n = Math.round(Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]) / 0.7);
      if (n < least) return false;
      const at = (t) => [lerp(A[0], B[0], t), lerp(A[1], B[1], t) - 2.2 * 4 * t * (1 - t), lerp(A[2], B[2], t)];
      for (let i = 0; i <= n; i += 3) { const q = at(i / n); if (!clear(q[0], q[1] + 0.8, q[2], 2.2) || laneGap(q[0], q[1] + 0.8, q[2], 0) <= 2.2 + LANE || (keepHeart && Math.hypot(q[0] - hx, q[2] - hz) < heartR + 6) || netBits.inHole(q[0], q[2], 3) || !net.inside(q[0], q[2], 4)) return false; }
      const dl = Math.hypot(B[0] - A[0], B[2] - A[2]), dir = [(B[0] - A[0]) / dl, (B[2] - A[2]) / dl], yawW = Math.atan2(dir[0], dir[1]), rt = [dir[1], -dir[0]];
      // its hangers too keep the lane, as lines from the deck to the net (tested every 2 m or less)
      for (let i = 0; i <= n; i += 8) for (const sg of [-1, 1]) {
        const q = at(i / n), fx = q[0] + sg * rt[0] * 0.95, fz = q[2] + sg * rt[1] * 0.95, tx = fx + sg * rt[0] * lean, tz = fz + sg * rt[1] * lean, ty = net.y(tx, tz), nk = Math.max(2, Math.ceil((ty - q[1]) / 2));
        for (let k = 0; k <= nk; k++) if (laneGap(lerp(fx, tx, k / nk), lerp(q[1], ty, k / nk), lerp(fz, tz, k / nk), 0) <= 0.07 + LANE) return false;
      }
      const railL = [], railR = [], baseL = [], baseR = [];
      for (let i = 0; i <= n; i++) {
        const q = at(i / n);
        if (!r.chance(0.04)) kit.add(path.distanceTo(q[0], q[1], q[2]) > 36 ? 'plankFar' : 'plank', { pivot: q, yaw: yawW + r.range(-0.06, 0.06), scale: r.range(0.94, 1.06), tint: mulc(CC.plank, r.range(0.62, 1.1)), seed: r() });
        if (i % 8) continue;
        for (const sg of [-1, 1]) {
          const f = [q[0] + sg * rt[0] * 0.95, q[1], q[2] + sg * rt[1] * 0.95], hp = [f[0], f[1] + 1.1, f[2]], top = [f[0] + sg * rt[0] * lean, net.y(f[0] + sg * rt[0] * lean, f[2] + sg * rt[1] * lean), f[2] + sg * rt[1] * lean];
          if (!net.inside(top[0], top[2], 0.5) || nearBeat(top[0], top[2], 1) || nearBeat((f[0] + top[0]) / 2, (f[2] + top[2]) / 2, 1)) continue;      // no hanger through a thing hung first
          kit.cable([f, hp, top], 0.07, i % 16 ? CC.hemp : CC.hempDark, PAT.ROPE, 1, 4);
          for (let k = 0; k < 4; k++) { const t0 = k / 4, t1 = (k + 1) / 4; occPut(lerp(f[0], top[0], (t0 + t1) / 2), lerp(f[2], top[2], (t0 + t1) / 2), lerp(f[1], top[1], t0), lerp(f[1], top[1], t1), 0.4 + lean / 8); }
          (sg < 0 ? railL : railR).push(hp); (sg < 0 ? baseL : baseR).push([f[0], f[1] - 0.05, f[2]]);
          if ((i / 8 + (sg < 0 ? 0 : 1)) % 3 === 0) kit.add('lamp', { pivot: [hp[0], hp[1] + 1.3, hp[2]], rope: 0.5, scale: 1.3, seed: r(), glow: 1 });
        }
      }
      kit.cable(railL, 0.04, CC.hemp, PAT.ROPE, 1, 3); kit.cable(railR, 0.04, CC.hemp, PAT.ROPE, 1, 3); kit.cable(baseL, 0.08, CC.hempDark, PAT.ROPE, 1, 4); kit.cable(baseR, 0.08, CC.hempDark, PAT.ROPE, 1, 4);
      walks.push([A[0], A[1], A[2], B[0], B[1], B[2]]);
      return true;
    };
    // ------------------------------------------------------------ THE GREAT HALL (round 5): the one thing to stare at in the heart
    // One sack-hall about three times a common house in every measure (the part file's 'hall'), hung under the deep
    // middle of the sag beyond the terrace. The route is not moved: the hall is hung FROM the leg's line (its place is
    // found below), its skin a drawn 1.5 to
    // 1.7 of its own whole height from the line, its gallery 1 m under our height there, its door turned to us. It is
    // moored: four cables from the net meet at its hang point. Rope bridges go from its gallery (they end a step short
    // of it: it swings a little, they do not) to three hung stages, each with a ladder up to the net and a big house
    // hung by it. It keeps a clearing of its own: nothing but these within 18 m of its gallery's rail.
    let hallV = null, mHall = mHero;
    {
      const hl = R.hall, HI = kit.info('hall'), CC = COLORS, d0 = hl.range(26, 40), offH = HI.r + HI.h * hl.range(1.5, 1.7);
      // its place: of all the places beside the leg, on either side, from the drawn distance to 80 m farther down it
      // (steps of 4 m), where it has the net over all of it and stands clear of the heart's own cluster (its clearing
      // does not reach into the heart's) and of everything hung before it: the one nearest the middle of the sag
      let Qh = null, ax = 0, az = 0, best = 1e9; const deep = net.at(0.5, 0);
      for (let d = d0; d < Math.min(legLen - 30, d0 + 80); d += 4) {
        const Q = legQ(d);
        for (const sg of [1, -1]) {
          const x = Q[0] - ld[1] * sg * offH, z = Q[2] + ld[0] * sg * offH, far = Math.hypot(x - deep[0], z - deep[2]);
          if (far >= best || !net.inside(x, z, HI.r + 8) || Math.hypot(x - hx, z - hz) < heartR + HI.galR + 18 || nearBeat(x, z, HI.r) || nearCar(x, Q[1] - 1, z, HI.r + 2)) continue;
          const top = Math.min(Q[1] - 1, net.y(x, z) - 6 + HI.gallery) - HI.gallery; let ok = true;
          for (let k = 0; k <= HI.h && ok; k += 4) ok = occFree(x, top - k, z, HI.r) && !nearWalk(x, top - k, z, HI.r);
          if (ok) { Qh = Q; ax = x; az = z; best = far; }
        }
      }
      if (Qh) {
      const galY = Math.min(Qh[1] - 1, net.y(ax, az) - 6 + HI.gallery), piv = [ax, galY - HI.gallery, az];
      const toLine = Math.atan2(Qh[2] - az, Qh[0] - ax);
      kit.add('hall', { pivot: piv, rope: 0, yaw: -toLine, tint: mulc(strong3[0], 0.92), seed: hl(), glow: 1.3, smoke: true });
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, x = ax + Math.cos(a) * 8, z = az + Math.sin(a) * 8; kit.cable([[x, net.y(x, z), z], [piv[0], piv[1] + 0.1, piv[2]]], 0.15, mixc(CC.hemp, CC.hempDark, 0.5), PAT.ROPE, 1, 5); }
      for (let k = 0; k < 3; k++) {
        const a = toLine + Math.PI + (k - 1) * 1.25 + hl.range(-0.15, 0.15), c = Math.cos(a), s = Math.sin(a), r0 = HI.galR + 1.3, len = hl.range(17, 21), yB = galY + hl.range(-1.5, 2.5), sd0 = hl(), sd1 = hl();
        const A = [ax + c * r0, galY + 0.1, az + s * r0], B = [ax + c * (r0 + len), yB, az + s * (r0 + len)];
        if (!walkway(hl, A, B, false, 2.5, 22)) continue;
        const sx = ax + c * (r0 + len + 1.9), sz = az + s * (r0 + len + 1.9), kS = kit.static;
        kS.flex = 1; kS.set(CC.plankPale, PAT.WOOD); kS.push(sx, yB - 0.05, sz, -a, 0, 0, 1); kS.box(-1.9, -0.14, -1.9, 1.9, 0, 1.9); kS.pop(); kS.flex = 0;
        for (const [u, v] of [[-1.8, -1.8], [1.8, -1.8], [1.8, 1.8], [-1.8, 1.8]]) { const x = sx + c * u - s * v, z = sz + s * u + c * v, tx = x + c * u * 0.5 - s * v * 0.5, tz = z + s * u * 0.5 + c * v * 0.5; kit.cable([[x, yB - 0.1, z], [tx, net.y(tx, tz), tz]], 0.05, CC.hemp, PAT.ROPE, 1, 3); }
        kit.add('lamp', { pivot: [sx + c * 1.8 - s * 1.8, yB + 2.7, sz + s * 1.8 + c * 1.8], rope: 0.5, scale: 1.5, seed: sd0, glow: 1.2 });
        const lx = sx + c * 2.3, lz = sz + s * 2.3, ly = net.y(lx, lz);
        kit.add('ladderLong', { pivot: [lx, ly, lz], rope: 0, scale: (ly - yB) / 24, yaw: -a + Math.PI / 2, seed: sd1 }); occPut(lx, lz, yB, ly, 0.6); occPut(sx, sz, yB - 1, yB + 3, 2.8);
        const nx = sx + c * 8.2, nz = sz + s * 8.2, ny = net.y(nx, nz);
        hang(hl, [nx, ny, nz], { kind: 'big', rope: Math.max(4, ny - (yB + 8.5)), depth: 400, clear, tint: heartTint });
      }
      occPut(ax, az, piv[1] - HI.h, piv[1], HI.r);
      beats.push({ c: [ax, galY, az], r: HI.galR + 15.5, l: 0, ax: [0, -1], boat: false, top: piv[1], bottom: piv[1] - HI.h, hs: [] });
      hallV = new THREE.Vector3(ax, galY + 1, az); mHall = mAt(...Qh);
      }
    }
    await ctx.yield();
    // ------------------------------------------------------------ the town under the route
    // Where the route has the net overhead (the street from the hatch to the heart, and the leg beyond the heart as far as
    // the net reaches over both its sides) two things of the city lie beside its line (the town itself hangs by the net's own rule, below):
    //  - lower walkways parallel to the line, 22 m aside (beyond the things hung first) and 14 m below it, on alternate
    //    sides, in lengths of 40 to 60 m with gaps of 6 to 14 m, on near-upright hangers (none nearer the route than 20 m);
    //  - one second terrace: a boat 2.2 times the common size hung at the street's middle, 12 m aside or more on the side away
    //    from the large house, its deck 22 m below the line, with a rope ladder from the net to each of its ends.
    {
      const ur = R.under, runs = [[S0, H1, sd, sLen], [H4, legQ(legIn), ld, legIn]];
      if (street.length) {
        // it is a thing hung first too: its stand-off from the street's line is the least from 12 m up at which the
        // boat (either of its two forms) and its two ladders pass the lane's test at the gust's full swing
        const d = sLen / 2, sg = -street[0].sg, sc = 2.2, yDeck = lerp(S0[1], H1[1], 0.5) - 22, GI = [kit.info('gondola'), kit.info('gondolaB')], LI = kit.info('ladderLong');
        let off = 12, x = 0, z = 0, py = 0, rope = 3;
        for (; off <= 30; off++) {
          x = S0[0] + sd[0] * d - sd[1] * sg * off; z = S0[2] + sd[1] * d + sd[0] * sg * off; py = net.y(x, z); rope = Math.max(3, py - (yDeck + 8 * sc));
          let ok = GI.every((I) => reachClear(I, lane, [x, py, z], 0, 0, rope, rope, sc));
          for (const e of [-1, 1]) for (const I of GI) { const lx = x + sd[0] * e * (I.L / 2 - 1.5) * sc, lz = z + sd[1] * e * (I.L / 2 - 1.5) * sc, ly = net.y(lx, lz); ok = ok && reachClear(LI, lane, [lx, ly, lz], 0, 0, 0, 0, (ly - (py - rope + I.deck * sc)) / 24); }
          if (ok) break;
        }
        const hs = hangString(kit, ur, [x, py, z], { kind: 'gondola', scale: sc, rope, yaw: Math.atan2(-sd[1], sd[0]), depth: 400, tint: canvasTint }), h = hs[0];
        beats.push({ c: [x, (h.top[1] + h.bottom[1]) / 2, z], r: h.info.B / 2 * h.sc, l: (h.info.L - h.info.B) / 2 * h.sc, ax: sd, boat: true, top: h.top[1], bottom: h.bottom[1], hs });
        for (const o of hs) occAdd(o);
        for (const e of [-1, 1]) { const lx = x + sd[0] * e * (h.info.L / 2 - 1.5) * h.sc, lz = z + sd[1] * e * (h.info.L / 2 - 1.5) * h.sc, ly = net.y(lx, lz); kit.add('ladderLong', { pivot: [lx, ly, lz], rope: 0, scale: (ly - (h.top[1] + h.info.deck * h.sc)) / 24, yaw: Math.atan2(-sd[1], sd[0]) + Math.PI / 2, seed: ur() }); occPut(lx, lz, h.bottom[1], ly, 0.6); }
      }
      for (const [A, B, dir, len] of runs) {
        for (let d0 = ur.range(4, 16), wsg = ur.chance(0.5) ? 1 : -1; len - d0 > 30;) {
          const wl = Math.min(ur.range(40, 60), len - d0 - 2), pA = (d) => [A[0] + dir[0] * d - dir[1] * wsg * 22, lerp(A[1], B[1], d / len) - 14, A[2] + dir[1] * d + dir[0] * wsg * 22];
          walkway(ur, pA(d0), pA(d0 + wl), false);
          d0 += wl + ur.range(6, 14); wsg = -wsg;
        }
      }
      await ctx.yield();
    }
    // the lower tier: walkways slung far under the net on long ropes, with lamps along them, and great hammock-nets.
    // Each is tried at a drawn place and kept where it clears the lane, the heart's clearing, the hatches and the others.
    {
      const tr2 = R.tier; let made = 0;
      for (let tries = 0; tries < 20 && made < 5; tries++) {
        const s0 = tr2.range(0.3, 0.78), along = tr2.chance(0.4), t0 = tr2.range(-0.8, 0.3), len = tr2.range(34, 60), drop = tr2.range(24, 38), tilt = tr2.range(-3, 3), ds = tr2.range(-0.02, 0.02);
        const a = net.at(s0, t0), b = along ? net.at(Math.min(s0 + len / L, 0.86), t0) : net.at(s0 + ds, clamp(t0 + len / net.half(s0), -0.85, 0.85));
        if (walkway(tr2, [a[0], a[1] - drop, a[2]], [b[0], b[1] - drop + tilt, b[2]], true)) made++;
      }
      // hammock-nets on long ropes, on a stream of their own (the walkways' tries above draw a number that depends on the layout)
      const hr = R.hammock, HI = kit.info('hammock');
      for (let i = 0; i < Math.round(9 * density); i++) {
        const q = net.at(hr.range(0.28, 0.8), hr.range(-0.85, 0.85)), rope = hr.range(20, 40), sc = hr.range(2.3, 3.2), tint = canvasTint(hr), seed = hr(), yaw = hr.range(0, TAU);
        let ok = !netBits.inHole(q[0], q[2], 3) && Math.hypot(q[0] - hx, q[2] - hz) > heartR; for (let k = 0; k <= rope + 4 && ok; k += 3) ok = clear(q[0], q[1] - k, q[2], k > rope - 2 ? 1.6 * sc : 0.5);
        if (ok && reachClear(HI, lane, q, 0, 0, rope, rope, sc)) kit.add(farAt(q[0], q[1] - rope, q[2]) ? 'hammockFar' : 'hammock', { pivot: q, rope, scale: sc, tint, yaw, seed });
      }
    }
    await ctx.yield();
    // THE TOWN. Its depth is a rule of the net and the gulf over the WHOLE city, with no term of the route: strings
    // of things under a jittered grid of net points GRID m apart, and each string's top hangs at a depth under the NET
    // drawn from five tiers of the gulf (3..9, 9..18, 18..30, 30..44, 44..60 m, drawn with weights 0.14, 0.24, 0.28,
    // 0.22, 0.12: thickest in the gulf's middle depths), each times deepK: 1 under the middle of the sag, 0.3 at the
    // net's ends, less toward its edges. The route then goes through the town: a string that would stand in the lane
    // (its true reach, at the gust's full swing) is drawn again, at another point of its own cell and another depth,
    // three times, then left out. A single small thing keeps its short cord (2 to 12 m): the fringe under the mesh.
    const sr = R.town;
    const TIERS = [[3, 9, 0.14], [9, 18, 0.24], [18, 30, 0.28], [30, 44, 0.22], [44, 60, 0.12]], GRID = 7.4;
    const deepK = (s, t) => 0.3 + 0.7 * Math.pow(Math.max(Math.sin(Math.PI * s), 0), 0.8) * (1 - 0.6 * t * t);
    const tierTop = (r, s, t) => { let q = r(), i = 0; while (i < 4 && q > TIERS[i][2]) { q -= TIERS[i][2]; i++; } return r.range(TIERS[i][0], TIERS[i][1]) * deepK(s, t); };
    let strings = 0;
    for (let d = 14; d < L - 12; d += GRID) {
      const s = d / L, h = net.half(s), nAcross = Math.max(1, Math.floor((2 * h - 6) / GRID));
      for (let j = 0; j < nAcross; j++) {
        const t0 = ((j + 0.5) / nAcross * 2 - 1) * (1 - 3 / h), t = t0 + sr.range(-0.35, 0.35) * GRID / h, s2 = s + sr.range(-0.4, 0.4) * GRID / L, p = net.at(s2, t);
        const r = sr(), kindR = sr();
        const dHero = Math.hypot(p[0] - hx, p[2] - hz);
        if (dHero < 47 || netBits.inHole(p[0], p[2], 2.5) || nearBeat(p[0], p[2], 3)) continue;
        // open air round the heart's own cluster, and clearings here and there: the town hangs in bunches, not in a sheet
        const open = Math.max(1 - smoothstep(47, 62, dHero) * (1 - smoothstep(78, 96, dHero)) * 0.8, 0) * smoothstep(-0.42, -0.08, n2(p[0] * 0.013 + 31, p[2] * 0.013 - 7));
        if (r > 0.86 * Math.min(1.15, density + 0.12) * open) continue;
        const kind = kindR < 0.38 ? 'house' : kindR < 0.62 ? 'small' : kindR < 0.82 ? 'solo' : kindR < 0.92 ? 'big' : 'gondola';
        if (kind === 'solo') { hang(sr, p, { kind, depth: 16, clear, tint: canvasTint }); strings++; continue; }
        for (let tries = 0, q = p, tq = t, sq = s2; tries < 3; tries++) {
          const top = tierTop(sr, sq, tq); if (hang(sr, q, { kind, rope: top, depth: top + 40, strict: true, clear, tint: canvasTint }).length) { strings++; break; }
          tq = t0 + sr.range(-0.45, 0.45) * GRID / h; sq = s + sr.range(-0.45, 0.45) * GRID / L; q = net.at(sq, tq);
          if (netBits.inHole(q[0], q[2], 2.5) || nearBeat(q[0], q[2], 3) || Math.hypot(q[0] - hx, q[2] - hz) < 47) break;
        }
      }
      await ctx.yield();
    }
    await ctx.yield();
    // the last houses crowd the far anchorage: long strings from the narrowing net, down either side of the gangway and the ring
    const cr = R.crowd;
    for (let d = L * 0.855, k = 0; d < L * 0.985; d += 6.2, k++) {
      for (const sg of [-1, 1]) {
        const s = d / L + cr.range(-0.004, 0.004), t = sg * cr.range(0.62, 0.98), p = net.at(s, t), kr = cr();
        if (netBits.inHole(p[0], p[2], 2.5) || nearBeat(p[0], p[2], 3)) continue;
        hang(cr, p, { kind: kr < 0.42 ? 'house' : kr < 0.62 ? 'small' : kr < 0.92 ? 'solo' : 'big', depth: (p[1] + 44) * cr.range(0.55, 1), clear, tint: canvasTint });
      }
    }
    await ctx.yield();

    // ------------------------------------------------------------ the first anchorage: chains as thick as trees bolted into the rock, a gangway out from the ledge
    const m4 = new THREE.Matrix4(), qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), vX = new THREE.Vector3(), vY = new THREE.Vector3(), vZ = new THREE.Vector3();
    const chain = (A, B, sag, sc) => {                                // real links, every other one turned a quarter
      const len = Math.hypot(B[0] - A[0], B[1] - A[1], B[2] - A[2]), n = Math.max(2, Math.round(len / (1.52 * sc))), P = chainPts(A, B, sag, n);
      for (let i = 0; i < n; i++) {
        const a = P[i], b = P[i + 1];
        vX.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]).normalize(); vY.set(0, 1, 0); vZ.crossVectors(vX, vY).normalize(); vY.crossVectors(vZ, vX);
        qA.setFromRotationMatrix(m4.makeBasis(vX, vY, vZ)); qB.setFromAxisAngle(vY.set(1, 0, 0), (i % 2) * Math.PI / 2 + 0.2); qA.multiply(qB);
        kit.add('link', { pivot: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2], quat: qA, scale: sc, seed: 0.5 });
      }
      return P;
    };
    const S = kit.static, C = COLORS;
    const PEN = kit.info('pennant'), flagYaw = -Math.atan2(windZ, windX);      // pennants fly down the wind
    const eye = (p, sc) => { S.set(C.iron, PAT.METAL); S.flex = 0; S.push(p[0], p[1], p[2], 0, 0, 0, sc); S.box(-0.9, -0.9, -0.3, 0.9, 0.9, 0.5); S.ring(0, 0.7, 0.2, 8, 5); S.pop(); };
    const chainsA = [];
    for (const ce of chainEnds) { chainsA.push({ t: ce.t, P: chain(ce.a, ce.b, ce.sag, 1.05) }); eye(ce.b, 1.2); }      // their places were drawn before the route (see THE ARRIVAL)
    // the head stay: its cable, the staple and its lantern, the ring where it is made fast to the net; and like every
    // guy it is never bare: a load every 13 m of its length wherever it stands 13 m or more over rock and mesh (the
    // lane's test, the rock, the gatehouse and everything hung so far are kept clear by the one rule of every string).
    // IT IS A ROPE OF THE PLACE (round 6): pale hemp like the net's own ropes (it was the guys' darker mix, and in the
    // first mountain's shade it read as a black bar), a pennant every 3 m, and a lit lantern hung under it midway
    // between its loads all the way down (stream 'stayLamp'), each by the lane's rule. AND BY THE START'S OWN ROOM:
    // a load, a lantern or a pennant that would stand within 15 m of the start at the gust's full swing is left out
    // (laneStart; draws before tests): near the start the stay carries only what keeps outside that room.
    {
      kit.cable(stay, 0.3, C.hemp, PAT.ROPE, 0, 6);
      eye(stay[0], 2); kit.add('lamp', { pivot: [stay[0][0], stay[0][1] - 1.6, stay[0][2] - 0.6], rope: 0.6, scale: 2.2, seed: ar(), glow: 1.4 });
      S.flex = 1; S.set(C.iron, PAT.METAL); S.push(stay[18][0], stay[18][1], stay[18][2], 0, 0, 0, 1); S.ring(0, 0.7, 0.14, 8, 4); S.pop(); S.flex = 0;
      let len = 0; const cum = [0]; for (let i = 0; i < 18; i++) { len += Math.hypot(stay[i + 1][0] - stay[i][0], stay[i + 1][1] - stay[i][1], stay[i + 1][2] - stay[i][2]); cum.push(len); }
      const d0 = ar.range(5, 11), sl = R.stayLamp, LAMP = kit.info('lamp');
      for (let d = d0 + 6.5; d < len - 3; d += 13) {
        let i = 0; while (i < 17 && cum[i + 1] < d) i++;
        const u = (d - cum[i]) / (cum[i + 1] - cum[i]), p = [lerp(stay[i][0], stay[i + 1][0], u), lerp(stay[i][1], stay[i + 1][1], u) - 0.3, lerp(stay[i][2], stay[i + 1][2], u)], seed = sl(), rope = sl.range(1, 1.6);
        const room = p[1] - Math.max(net.inside(p[0], p[2], 0) ? net.y(p[0], p[2]) : -1e9, height(p[0], p[2]));
        if (room > 6 && Math.abs(p[2] - gate.gp[2]) > 6 && reachClear(LAMP, laneStart, p, 0, 0, rope, rope, 1.8)) kit.add(farAt(p[0], p[1] - rope, p[2]) ? 'lampFar' : 'lamp', { pivot: p, rope, scale: 1.8, seed, glow: 1.3 });
      }
      for (let d = d0; d < len - 8; d += 13) {
        let i = 0; while (i < 17 && cum[i + 1] < d) i++;
        const u = (d - cum[i]) / (cum[i + 1] - cum[i]), p = [lerp(stay[i][0], stay[i + 1][0], u), lerp(stay[i][1], stay[i + 1][1], u) - 0.3, lerp(stay[i][2], stay[i + 1][2], u)], kr = ar(), rope = ar.range(3, 6);
        const room = p[1] - Math.max(net.inside(p[0], p[2], 0) ? net.y(p[0], p[2]) : -1e9, height(p[0], p[2])) - 3;
        if (room < 10 || Math.abs(p[2] - gate.gp[2]) < 9) continue;
        hang(ar, p, { kind: room > 17 && kr < 0.6 ? 'house' : 'small', rope: Math.min(rope, room - 6), depth: Math.min(room, rope + 20), clear, lane: laneStart, tint: canvasTint });
      }
      // and it is dressed along its whole length like every guy: a pennant tied on the cable every 3 m (see the guys);
      // the pennants are on a stream of their own (their number goes with the cable's drawn length)
      const fl = R.flagS;
      for (let d = fl.range(0.5, 3); d < len - 1; d += 3) {
        let i = 0; while (i < 17 && cum[i + 1] < d) i++;
        const u = (d - cum[i]) / (cum[i + 1] - cum[i]), p = [lerp(stay[i][0], stay[i + 1][0], u), lerp(stay[i][1], stay[i + 1][1], u) - 0.3, lerp(stay[i][2], stay[i + 1][2], u)], tq = fl(), sq = fl();
        if (reachClear(PEN, laneStart, p, 0, 0, 0, 0, 1.4)) kit.add('pennant', { pivot: p, yaw: flagYaw + (tq - 0.5) * 0.5, pitch: 0, roll: 0, scale: 1.4, tint: C.canvas[Math.floor(tq * 7) % 7], seed: sq });
      }
    }
    // the gangway from the ledge down to the net, slung under the two chains that flank us
    const gw0 = [ledge[0], ledgeY + 0.25, 49], gwE = net.at(0.03, TH), gw1 = [gwE[0], gwE[1] + 0.2, gwE[2]];
    {
      const len = Math.hypot(gw1[0] - gw0[0], gw1[1] - gw0[1], gw1[2] - gw0[2]), n = Math.round(len / 0.66), sagG = 1.6;
      const at = (t) => [lerp(gw0[0], gw1[0], t), lerp(gw0[1], gw1[1], t) - sagG * 4 * t * (1 - t), lerp(gw0[2], gw1[2], t)];
      vX.set(gw1[0] - gw0[0], 0, gw1[2] - gw0[2]).normalize(); const yawG = Math.atan2(vX.x, vX.z), right = [vX.z, -vX.x];
      for (let i = 0; i <= n; i++) {
        if (er.chance(0.03)) continue;
        const p = at(i / n), k = er.range(0.62, 1.1);
        kit.add('plank', { pivot: p, yaw: yawG + er.range(-0.06, 0.06), pitch: 0.2, scale: er.range(0.94, 1.06), tint: er.chance(0.12) ? mulc(C.plankPale, 1.15) : mulc(C.plank, k), seed: er() });
      }
      const railL = [], railR = [], chL = chainsA[2].P, chR = chainsA[3].P;
      const onChain = (P, z) => { for (let i = 0; i < P.length - 1; i++) if ((P[i][2] - z) * (P[i + 1][2] - z) <= 0) { const f = (z - P[i][2]) / (P[i + 1][2] - P[i][2] || 1); return [lerp(P[i][0], P[i + 1][0], f), lerp(P[i][1], P[i + 1][1], f) - 0.3, z]; } return null; };
      for (let i = 0; i <= n; i += 6) {
        const p = at(i / n), l = [p[0] - right[0] * 0.95, p[1], p[2] - right[1] * 0.95], r = [p[0] + right[0] * 0.95, p[1], p[2] + right[1] * 0.95];
        const cl = onChain(chL, l[2]), cr = onChain(chR, r[2]);
        if (cl) kit.cable([l, cl], 0.04, C.hemp, PAT.ROPE, 0, 4); if (cr) kit.cable([r, cr], 0.04, C.hemp, PAT.ROPE, 0, 4);
        railL.push([l[0], l[1] + 1.1, l[2]]); railR.push([r[0], r[1] + 1.1, r[2]]);
        kit.cable([l, [l[0], l[1] + 1.1, l[2]]], 0.035, C.plank, PAT.WOOD, 0, 3); kit.cable([r, [r[0], r[1] + 1.1, r[2]]], 0.035, C.plank, PAT.WOOD, 0, 3);
      }
      kit.cable(railL, 0.03, C.hemp, PAT.ROPE, 0, 3); kit.cable(railR, 0.03, C.hemp, PAT.ROPE, 0, 3);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the far anchorage: the cables gather on the crag; the portal's ring hangs under them at the end of a hung gangway
    // How it holds: the net's end goes to nine rings by nine chains, and its two edges are gathered, a stretch before
    // the end, into great chains that run up and out to rings let into the crag.
    const zFace = NET.zB + 70, tr = R.stays;                          // wallZ looks for the face from here, out in the gulf
    const ringBolt = (x, y, sc) => {                                   // a plate bolted to the rock and a ring through its eye
      const z = wallZ(x, y, zFace), pts = []; for (let k = 0; k < 8; k++) { const a = k / 8 * TAU; pts.push([Math.cos(a) * 0.75, -0.55 + Math.sin(a) * 0.75, 0.62]); }
      S.flex = 0; S.set(C.iron, PAT.METAL); S.push(x, y, z, 0, 0, 0, sc); S.box(-0.8, -0.8, -0.6, 0.8, 0.8, 0.4, 'z'); S.sweep(pts, 0.17, 4, false, true); S.pop();
      return [x, y - 0.5 * sc, z + 0.6 * sc];
    };
    for (let t = -1; t <= 1.001; t += 0.25) {
      const a = net.at(0.997, t), b = ringBolt(a[0] * 1.03 + tr.range(-1, 1), NET.yB + 3 + Math.abs(t) * 5 + tr.range(0, 2), 1.5);
      chain([a[0], a[1] + 0.3, a[2]], b, 0.5, 1.15);
    }
    for (const sg of [-1, 1]) for (let k = 0; k < 4; k++) {
      const a = net.at(0.865 + 0.036 * k + tr.range(-0.006, 0.006), sg);
      const b = ringBolt(a[0] + sg * (8 + 12 * k + tr.range(-3, 3)), a[1] + 17 + 9 * k + tr.range(-3, 3), 2.4);
      kit.cable(chainPts([a[0], a[1] + 0.3, a[2]], b, tr.range(2, 4), 12), 0.42, C.iron, PAT.CHAIN, 0, 5);
      kit.add('lamp', { pivot: [b[0], b[1] - 1.6, b[2] + 0.5], rope: 0.6, scale: 2.4, seed: tr(), glow: 1.5 });       // a lantern at every ring
    }
    await ctx.yield();
    // The net's windward edge (the side away from the entry) is guyed down to the crag: six guy cables, each as thick as a
    // body, from the edge rope out to great staples in the face 14 m lower: four from 0.75, 0.80, 0.85 and 0.90 of the
    // net to staples 34 to 46 m beyond the edge, two long ones from 0.63 and 0.69 to staples 70 to 95 m beyond it on the
    // crag's shoulder. ONE RULE FOR EVERY CABLE: a guy is tested by the lane's own function at points every 2 m with its
    // own radius; a guy that fails is made fast to another staple (12 m farther out along the crag, up to four times),
    // then left out. Each guy has a stream of its own. A guy is never bare: it carries a load every 9 m of its length,
    // and every load's top hangs at the LEVEL OF THE FAR ANCHORAGE (12 m below to 4 m above the ring's height, where
    // the gangway's people and the windlass reach them): a rule of the guys and the anchorage, with no term of the route.
    {
      const yAnch = ringAt[1];
      [0.63, 0.69, 0.75, 0.8, 0.85, 0.9].forEach((sG, gi) => {
        const gr = R['guy' + gi], long = sG < 0.72, rad = long ? 0.26 : 0.2;
        const a = net.at(sG, -eS), by = a[1] - 14, sag = gr.range(2.5, 4);
        let bx = a[0] - eS * (long ? gr.range(70, 95) : gr.range(34, 46)), P = null;
        for (let tries = 0; tries < 5 && !P; tries++, bx -= eS * 12) {
          const pts = chainPts([a[0], a[1] + 0.2, a[2]], [bx, by - 1.1, wallZ(bx, by, zFace) + 1.32], sag, 14);
          if (cableClear(pts, rad)) { ringBolt(bx, by, 2.2); P = pts; }
        }
        if (!P) return;
        const b = P[14]; let len = 0; for (let i = 0; i < 14; i++) len += Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1], P[i + 1][2] - P[i][2]);
        kit.cable(P, rad, mixc(C.hemp, C.hempDark, 0.6), PAT.ROPE, 0, 6);
        kit.add('lamp', { pivot: [b[0], b[1] - 1.5, b[2] + 0.5], rope: 0.6, scale: 2.2, seed: gr(), glow: 1.4 });
        const n = Math.max(3, Math.round(len / 9));
        for (let k = 0; k < n; k++) {
          const f = (k + gr.range(0.3, 0.7)) / n, i = Math.min(13, Math.floor(f * 14)), u = f * 14 - i, p = [lerp(P[i][0], P[i + 1][0], u), lerp(P[i][1], P[i + 1][1], u) - 0.2, lerp(P[i][2], P[i + 1][2], u)], kr = gr();
          const rope = Math.max(gr.range(3, 8), p[1] - (yAnch + gr.range(-12, 4)));
          hang(gr, p, { kind: kr < 0.25 ? 'big' : kr < 0.7 ? 'house' : 'small', rope, depth: rope + 30, clear, tint: canvasTint });
        }
        // A CABLE IS SEEN WITH WHAT IT HOLDS: where the lane's rule leaves a guy without a load it is still dressed, for
        // a guy carries a pennant tied on the cable itself every 3 m of its WHOLE length, flying down the wind (each by
        // the lane's own test with its true reach); no term of the route. Each guy's pennants are on a stream of their own.
        const fl = R['flag' + gi];
        for (let dq = fl.range(0.5, 3); dq < len - 1; dq += 3) {
          const fq = dq / len * 14, i = Math.min(13, Math.floor(fq)), u = fq - i, p = [lerp(P[i][0], P[i + 1][0], u), lerp(P[i][1], P[i + 1][1], u) - rad, lerp(P[i][2], P[i + 1][2], u)], tq = fl(), sq = fl();
          if (reachClear(PEN, lane, p, 0, 0, 0, 0, 1.4)) kit.add('pennant', { pivot: p, yaw: flagYaw + (tq - 0.5) * 0.5, pitch: 0, roll: 0, scale: 1.4, tint: C.canvas[Math.floor(tq * 7) % 7], seed: sq });
        }
      });
    }
    await ctx.yield();
    const ringR = 7.75, E = endP;
    // the ring's own frame: dx to the right of the flight (toward the gulf), dy up the ring, dz back toward where we come
    // from. THE RING STANDS SQUARE TO THE LINE, which comes up the gangway at its pitch of 8 in 60 (7.6 degrees): it
    // leans back by that much, and the portal is handed 'tilt', so the way out is square to the flight (an upright
    // ring would hand the next world a camera 7.6 degrees nose-up of its level entry frame)
    const pitchG = Math.atan2(8, GL), cG = Math.cos(pitchG), sG = Math.sin(pitchG);
    const RG = (dx, dy, dz) => [E.x - eS * (dz * cG + dy * sG), E.y + dy * cG - dz * sG, E.z + dx];
    rockLight.uCityLamp.value.set(E.x - eS * 14, E.y + 5, E.z - 5, 50);  // the lamps round the ring and along the gangway warm the wall beside them for some 50 m round
    // the lamps round the ring and the portal's own glow fall on the rock behind it: one warm light, never switched
    const ringLight = new THREE.PointLight(new THREE.Color('#ffcf7a'), night ? 420 : 620, 110, 2);
    ringLight.position.set(E.x, E.y + 3, E.z - 6); scene.add(ringLight);
    {
      S.flex = 0; S.set(C.iron, PAT.METAL);
      const ringPts = []; for (let k = 0; k < 30; k++) { const a = k / 30 * TAU; ringPts.push(RG(Math.cos(a) * ringR, Math.sin(a) * ringR, 0)); }
      S.sweep(ringPts, 0.36, 6, false, true);
      const wrap = []; for (let k = 0; k <= 180; k++) { const a = k / 180 * TAU, w = a * 26, rr = ringR + Math.cos(w) * 0.44; wrap.push(RG(Math.cos(a) * rr, Math.sin(a) * rr, Math.sin(w) * 0.44)); }
      kit.cable(wrap, 0.085, C.hemp, PAT.ROPE, 0, 4);
      for (const a of [PI * 0.5, PI * 0.26, PI * 0.74]) {              // three chains up to the gathered cables
        const p = RG(Math.cos(a) * ringR, Math.sin(a) * ringR, 0), tz = p[2] + Math.cos(a) * 3.2, top = [E.x, net.y(E.x, tz), tz];
        kit.cable([p, top], 0.13, C.iron, PAT.CHAIN, 0, 5);
      }
      for (let k = 0; k < 14; k++) {                                  // lamps, pots and pennants hung round the ring
        const a = PI * (1.08 + 0.84 * k / 13) + (k % 2 ? 0 : 0.02), p = RG(Math.cos(a) * (ringR + 0.3), Math.sin(a) * (ringR + 0.3) - 0.3, 0.35);
        const rope = er.range(0.5, 1.6);
        kit.add(k % 3 === 0 ? 'lamp' : k % 3 === 1 ? 'potLong' : 'pot', { pivot: p, rope, scale: k % 3 === 0 ? 1.7 : er.range(1.2, 1.7), seed: er(), glow: 1.2 });
      }
      for (let k = 0; k < 16; k++) { const a = PI * (0.08 + 0.84 * k / 15), p = RG(Math.cos(a) * (ringR + 0.45), Math.sin(a) * (ringR + 0.45), 0.2); kit.add('pennant', { pivot: p, yaw: Math.cos(a) > 0 ? -PI / 2 : PI / 2, pitch: 0, roll: 0, scale: 1.1, tint: er.pick(C.canvas), seed: er() }); }
    }
    await ctx.yield();
    // the works of the city on the crag where the net is made fast: stairs cut in the stone, lamp-lit doorways, pulleys
    // with their baskets going up and down, spare rings with a few links left hanging
    {
      const wr = R.works, stone = [0.33, 0.33, 0.35], stoneD = [0.23, 0.24, 0.26];
      const door = (x, y) => {
        const z = wallZ(x, y + 1.3, zFace) + 0.2;
        S.flex = 0; S.push(x, y, z, 0, 0, 0, 1);
        S.set(stone, PAT.PLAIN); S.box(-1.0, -0.1, -0.6, -0.66, 2.5, 0.3, 'z'); S.box(0.66, -0.1, -0.6, 1.0, 2.5, 0.3, 'z'); S.box(-1.15, 2.5, -0.6, 1.15, 2.9, 0.36, 'z'); S.box(-1.5, -0.32, -0.9, 1.5, -0.1, 1.1, 'yz');
        S.set(C.lamp, PAT.GLASS, 2.2); S.quad(S.v(-0.66, -0.1, -0.15, 0, 0, 1), S.v(0.66, -0.1, -0.15, 0, 0, 1), S.v(0.66, 2.5, -0.15, 0, 0, 1), S.v(-0.66, 2.5, -0.15, 0, 0, 1));
        S.pop();
        kit.add('lamp', { pivot: [x + (wr.chance(0.5) ? 1.4 : -1.4), y + 3.2, z + 0.9], rope: 0.35, scale: 1.6, seed: wr(), glow: 1.3 });
      };
      const flight = (x0, y0, dir, n) => {                             // n steps climbing sideways across the face
        for (let i = 0; i < n; i++) { const x = x0 + dir * 0.56 * i, y = y0 + 0.3 * i, z = wallZ(x, y + 0.15, zFace); S.flex = 0; S.set(i % 6 === 5 ? stoneD : stone, PAT.PLAIN); S.box(x - 0.46, y - 0.32, z - 0.9, x + 0.46, y, z + 0.78, 'yz'); }
        return [x0 + dir * 0.56 * n, y0 + 0.3 * n];
      };
      const pulley = (x, y) => {
        const z = wallZ(x, y, zFace), tip = [x, y + 0.5, z + 3.4];
        S.flex = 0; S.set(C.plank, PAT.WOOD); S.pole([[x, y, z - 0.4], tip], 0.13, 4); S.pole([[x, y - 1.6, z - 0.2], [x, y + 0.3, z + 2.2]], 0.09, 4);
        S.set(C.iron, PAT.METAL); S.push(tip[0], tip[1] - 0.35, tip[2], 0, 0, Math.PI / 2, 1); S.ring(0, 0.3, 0.07, 6, 3); S.pop();
        kit.add('basket', { pivot: [tip[0], tip[1] - 0.6, tip[2]], rope: wr.range(9, 17), scale: wr.range(1.2, 1.6), tint: wr.pick(C.canvas), motion: wr.range(0.6, 0.85), seed: wr() });
      };
      for (const sg of [-1, 1]) {
        let x = net.cx(1) + sg * wr.range(11, 14), y = E.y - wr.range(7, 10);
        door(x - sg * 1.8, y);
        for (let leg = 0, dir = sg; leg < 3; leg++, dir = -dir) {
          [x, y] = flight(x, y, dir, wr.int(26, 38));
          door(x + dir * 1.8, y); if (leg !== 1) pulley(x + dir * wr.range(5, 8), y + wr.range(2.5, 5));
          x += dir * 0.2;
          await ctx.yield();
        }
        const rb = ringBolt(net.cx(1) + sg * wr.range(15, 22), E.y + wr.range(-3, 6), 1.3);
        chain(rb, [rb[0] + wr.range(-0.4, 0.4), rb[1] - wr.range(4, 7), rb[2] + 0.5], 0, 0.8);
      }
    }
    // ------------------------------------------------------------ THE CITY'S LIFE ON THE CRAG'S FACE (round 5)
    // A rule along the WHOLE face wherever it stands within 120 m of the route's line from the boat on the leg to the
    // ring (the leg looks at it, the turn sweeps it, the gangway runs along it), on both hands of the anchorage's own
    // works (which reach 48 m aside of the net's end): a station every drawn 8 to 11 m along the face on each of three
    // levels (18 m below, 4 m below and 10 m above the ring's height, each 3 m up or down), and at each station one of:
    // a ledge of stone with snow, or with a garden hanging from its lip and goats or pigeons on it; a niche with a lit
    // shrine, a pot and a lamp; a staple and ring with a rope going up to the net and a lantern; a flight of stairs cut
    // in the rock up to a lit doorway; a timber boom with a house or a pouch roped under it 6 to 7 m out from the rock
    // (near enough to read); or bare rock. The levels differ by rule: ledges and stairs low, the string of roped houses
    // at the middle level, the ropes up to the net from the high one. Every piece keeps the lane by the lane's own
    // function and stands clear of what hangs there already; beyond the plain forms' distance the hung things are in
    // their plain forms. The stream is its own ('face').
    {
      const fr = R.face, stone = [0.34, 0.33, 0.33], stoneD = [0.24, 0.24, 0.26], yA = ringAt[1], mB3 = Math.floor(mBoat) * 3, xN = net.cx(1);
      const wx = E.x - eS * (GL - 6), wy = deckG(GL - 6) + 7;
      const MIX = [[0.34, 0.46, 0.52, 0.72, 0.9], [0.16, 0.3, 0.4, 0.52, 0.92], [0.3, 0.4, 0.74, 0.84, 0.9]];
      const routeFar = (x, y, z) => { let b = 1e18; for (let s = mB3; s < lanePts.length; s += 9) { const dx = lanePts[s] - x, dy = lanePts[s + 1] - y, dz = lanePts[s + 2] - z; b = Math.min(b, dx * dx + dy * dy + dz * dz); } return Math.sqrt(b); };
      const free = (x, y, z, r) => laneGap(x, y, z, 0) > r + LANE + 0.2 && occFree(x, y, z, r);
      const ropeFree = (pts) => { for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) / 2)); for (let k = 0; k <= n; k++) if (!occFree(lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n), lerp(a[2], b[2], k / n), 0.3)) return false; } return true; };
      const plain = (name, p) => (farAt(p[0], p[1], p[2]) ? name + 'Far' : name);
      const lampAt = (p, sc, glow) => kit.add(plain('lamp', p), { pivot: p, rope: 0.4, scale: sc, seed: fr(), glow });
      for (const sd of [-eS, eS]) for (let a = 48 + fr.range(0, 4); a < (sd === eS ? 170 : 330); a += fr.range(8, 11)) {
        const x = xN + sd * a;
        for (let lv = 0; lv < 3; lv++) {
          const y = yA + [-18, -4, 10][lv] + fr.range(-3, 3), r = fr(), q = fr(), u = fr(), mix = MIX[lv];
          const z = wallZ(x, y, zFace);
          if (routeFar(x, y, z) > 120 || (Math.abs(x - wx) < 8 && Math.abs(y - wy) < 8)) continue;
          if (r < mix[0]) {                                            // a ledge: snow, or a garden; goats or pigeons
            const w = 3 + 5 * q, out = 1.4 + 1.2 * u;
            if (!free(x, y, z + out, w / 2)) continue;
            S.flex = 0; S.set(lv % 2 ? stone : stoneD, PAT.PLAIN); S.box(x - w / 2, y - 0.55, z - 1.4, x + w / 2, y, z + out, 'z');
            if (q > 0.45) { S.set([0.9, 0.93, 0.98], PAT.PLAIN); S.box(x - w / 2 + 0.1, y, z - 0.8, x + w / 2 - 0.1, y + 0.17, z + out - 0.15, 'yz'); }
            else {
              S.set(mixc(C.leafDark, C.leaf, 0.7), PAT.LEAF); for (let i = 0; i < 3; i++) S.ball(x + (i - 1) * w * 0.3, y + 0.3, z + out * 0.45, w * 0.17, 0.42, 0.6, 5, 2);
              for (let i = 0; i < 2; i++) { const p = [x + (i - 0.5) * w * 0.6, y - 0.05, z + out + 0.12]; kit.add(plain('potLong', p), { pivot: p, rope: 0.05, scale: fr.range(1.1, 1.6), seed: fr() }); }
            }
            const top = y + (q > 0.45 ? 0.17 : 0);
            if (u > 0.55) for (let i = 0; i < (u > 0.8 ? 2 : 1); i++) kit.add('goat', { pivot: [x + fr.range(-0.3, 0.3) * w, top, z + out * fr.range(0.3, 0.7)], yaw: fr.range(0, TAU), scale: fr.range(1.15, 1.5), seed: fr() });
            else if (u < 0.3) for (let i = 0; i < 3; i++) kit.add('pigeon', { pivot: [x + fr.range(-0.45, 0.45) * w, top, z + out - 0.2], yaw: fr.range(0, TAU), scale: fr.range(0.9, 1.2), seed: fr() });
            occPut(x, z + out * 0.5, y - 0.6, y + 1.2, w / 2);
          } else if (r < mix[1]) {                                     // a niche with a lit shrine
            if (!free(x, y + 1, z + 0.6, 1.6)) continue;
            S.flex = 0; S.push(x, y, z + 0.15, 0, 0, 0, 1);
            S.set(stone, PAT.PLAIN); S.box(-0.95, -0.1, -0.7, -0.6, 2.0, 0.3, 'z'); S.box(0.6, -0.1, -0.7, 0.95, 2.0, 0.3, 'z'); S.box(-1.1, 2.0, -0.7, 1.1, 2.4, 0.38, 'z'); S.box(-1.3, -0.34, -0.9, 1.3, -0.1, 0.9, 'z');
            S.set(C.lamp, PAT.GLASS, 1.8); S.quad(S.v(-0.6, -0.1, -0.2, 0, 0, 1), S.v(0.6, -0.1, -0.2, 0, 0, 1), S.v(0.6, 2.0, -0.2, 0, 0, 1), S.v(-0.6, 2.0, -0.2, 0, 0, 1));
            S.set(stoneD, PAT.PLAIN); S.lathe([[0.05, 1.25], [0.22, 1.05], [0.14, 0.8], [0.3, 0.3], [0.34, -0.1]], 5, {});
            S.pop();
            lampAt([x + (u < 0.5 ? 1.3 : -1.3), y + 2.9, z + 0.8], 1.5, 1.3);
            const p = [x + (u < 0.5 ? -0.8 : 0.8), y + 0.45, z + 0.75]; kit.add(plain('pot', p), { pivot: p, rope: 0.05, scale: 1.1, seed: fr() });
            occPut(x, z + 0.4, y - 0.4, y + 3, 1.4);
          } else if (r < mix[2]) {                                     // a staple and ring, a rope going up to the net, a lantern
            if (!free(x, y, z + 0.9, 1.4)) continue;
            const rb = ringBolt(x, y, 1.3), tz = z + 9 + 6 * q, tp = net.inside(x, tz, 0.5) ? [x + (u - 0.5) * 8, 0, tz] : net.at(clamp(net.sOf(tz), 0.01, 0.995), clamp(net.tOf(x, tz), -1, 1));
            tp[1] = net.y(tp[0], tp[2]);
            const rope = chainPts(rb, tp, 1.2 + 1.5 * q, 8);
            if (Math.hypot(tp[0] - rb[0], tp[2] - rb[2]) < 60 && cableClear(rope, 0.06) && ropeFree(rope)) kit.cable(rope, 0.06, lv % 2 ? C.hemp : C.hempDark, PAT.ROPE, 0, 4);
            else chain(rb, [rb[0] + (u - 0.5) * 0.6, rb[1] - 4.5, rb[2] + 0.5], 0, 0.8);
            lampAt([rb[0], rb[1] - 1.2, rb[2] + 0.45], 1.8, 1.3);
          } else if (r < mix[3]) {                                     // stairs cut in the rock, up to a lit doorway
            const dir = u < 0.5 ? 1 : -1, ns = 10 + Math.floor(q * 7), steps = []; let ok = true;
            for (let i = 0; i < ns && ok; i++) { const sx = x + dir * 0.56 * i, sy = y + 0.3 * i, sz = wallZ(sx, sy + 0.15, zFace); ok = free(sx, sy, sz + 0.8, 0.6); steps.push([sx, sy, sz]); }
            const dx = x + dir * (0.56 * ns + 1.6), dy = y + 0.3 * ns, dz = wallZ(dx, dy + 1.3, zFace) + 0.2;
            if (!ok || !free(dx, dy + 1.2, dz + 0.5, 1.6)) continue;
            S.flex = 0; for (let i = 0; i < ns; i++) { const [sx, sy, sz] = steps[i]; S.set(i % 6 === 5 ? stoneD : stone, PAT.PLAIN); S.box(sx - 0.46, sy - 0.32, sz - 0.9, sx + 0.46, sy, sz + 0.78, 'yz'); }
            S.push(dx, dy, dz, 0, 0, 0, 1);
            S.set(stone, PAT.PLAIN); S.box(-1.0, -0.1, -0.6, -0.66, 2.5, 0.3, 'z'); S.box(0.66, -0.1, -0.6, 1.0, 2.5, 0.3, 'z'); S.box(-1.15, 2.5, -0.6, 1.15, 2.9, 0.36, 'z'); S.box(-1.5, -0.32, -0.9, 1.5, -0.1, 1.1, 'yz');
            S.set(C.lamp, PAT.GLASS, 2.2); S.quad(S.v(-0.66, -0.1, -0.15, 0, 0, 1), S.v(0.66, -0.1, -0.15, 0, 0, 1), S.v(0.66, 2.5, -0.15, 0, 0, 1), S.v(-0.66, 2.5, -0.15, 0, 0, 1));
            S.pop();
            lampAt([dx + dir * 1.4, dy + 3.2, dz + 0.9], 1.6, 1.3);
            occPut(x + dir * 0.28 * ns, z + 0.4, y - 0.4, dy + 3, 0.28 * ns + 2.6);
          } else if (r < mix[4]) {                                     // a timber boom, a house or a pouch roped under it
            const tip = [x, y + 0.9, z + 6.2 + q];
            if (!cableClear([[x, y, z], tip], 0.25) || !occFree(tip[0], tip[1], tip[2], 0.6)) continue;
            S.flex = 0; S.set(C.plank, PAT.WOOD); S.pole([[x, y, z - 0.5], tip], 0.17, 5); S.pole([[x, y - 2.2, z - 0.2], [x, y + 0.5, z + 3.6]], 0.11, 4);
            S.set(C.iron, PAT.METAL); S.push(tip[0], tip[1] - 0.3, tip[2], 0, 0, Math.PI / 2, 1); S.ring(0, 0.3, 0.07, 6, 3); S.pop();
            lampAt([x, y + 0.45, z + 3.1], 1.5, 1.2);
            const back = Math.max(wallZ(x, y - 5, zFace), wallZ(x - 3, y - 8, zFace), wallZ(x + 3, y - 8, zFace), wallZ(x, y - 11, zFace));
            if (back < tip[2] - 3.6) hang(fr, [tip[0], tip[1] - 0.3, tip[2]], { kind: u < 0.4 ? 'house' : 'small', rope: 2 + 2 * q, depth: 22, clear, tint: canvasTint });
            else { const p = [tip[0], tip[1] - 0.3, tip[2]]; kit.add(plain('basket', p), { pivot: p, rope: 3 + 5 * q, scale: 1.4, tint: fr.pick(C.canvas), motion: 0.7, seed: fr() }); }
          }
        }
        await ctx.yield();
      }
    }
    let galleryAt = null;
    // the gallery: seven arches built out from the face on the left of the gangway's last 26 m, lamp-lit inside, its
    // floor 2 m under the ring's middle, on stepped corbels, in the crag's own stone as the light finds it, with
    // lanterns hung under the lip of its floor (stream 'lipLamp'); its back stands just clear of the foremost rock of
    // its own span, or deeper where its own room asks it. And a windlass on a ledge by the gangway's head, its rope
    // going down to a load.
    {
      const gq = R.gallery, bays = 7, bw = 3.2, gh = 4.2, Wg = bays * bw, xm = E.x - eS * (4 + Wg / 2), y0 = E.y - 2;
      let zG = -1e9; for (let dx = -Wg / 2 - 1; dx <= Wg / 2 + 1; dx += 1.5) zG = Math.max(zG, wallZ(xm + dx, y0 + 0.5, zFace), wallZ(xm + dx, y0 + gh, zFace));
      // its own room (round 6): the lip of its floor and of its roof keep 15 m from the last 60 m of the line (endFree);
      // where they do not, the gallery is cut a quarter metre deeper into the face, as often as it takes (2 m at most:
      // its arches then stand half a metre proud of the foremost rock); where even that is not enough the face is
      // too near the gangway for a gallery and none is built on that visit (its draws are made all the same, in
      // their order, before the test).
      const lipFree = (z) => { for (let dx = -Wg / 2 - 0.8; dx <= Wg / 2 + 0.81; dx += 1.6) if (!endFree(xm + dx, y0 - 0.5, z + 3.6, 0) || !endFree(xm + dx, y0 + gh + 1.05, z + 3.6, 0)) return false; return true; };
      for (let j = 0; j < 8 && !lipFree(zG); j++) zG -= 0.25;
      const built = lipFree(zG), lipLamps = [1, 3, 5].map(() => [R.lipLamp.range(0.5, 1.1), R.lipLamp()]), lampSeeds = [0, 2, 4, 6].map(() => gq()), folk = [];
      for (let i = 0; i < 3; i++) folk.push({ kind: gq.chance(0.5) ? 'figureHat' : 'figure', x: gq.range(-Wg / 2 + 1, Wg / 2 - 1), z: gq.range(1.2, 2.2), yaw: gq.range(0, TAU), scale: gq.range(0.95, 1.08), tint: mulc(gq.pick(C.canvas), gq.range(0.6, 1.1)), seed: gq() });
      const stone = [0.34, 0.31, 0.29], stoneD = [0.26, 0.24, 0.23];
      galleryAt = [xm, y0 + gh / 2, zG + 1.5];
      if (built) {
      S.flex = 0; S.push(xm, y0, zG, 0, 0, 0, 1);
      S.set(stoneD, PAT.PLAIN); S.box(-Wg / 2 - 0.8, -0.5, -6, Wg / 2 + 0.8, 0, 3.6); S.box(-Wg / 2 - 0.8, gh + 0.7, -6, Wg / 2 + 0.8, gh + 1.05, 3.5);
      S.set([0.5, 0.33, 0.17], PAT.PLAIN, 0.5); S.box(-Wg / 2 - 0.3, 0, -0.2, Wg / 2 + 0.3, gh + 0.7, 0.2, 'xXyYz');      // the back wall, warm in the lamps' light
      S.set(stone, PAT.PLAIN); S.box(-Wg / 2 - 0.5, gh - 0.1, 2.5, Wg / 2 + 0.5, gh + 0.7, 3.2);
      for (let i = 0; i <= bays; i++) {
        const x = -Wg / 2 + i * bw;
        S.set(i % 2 ? stone : stoneD, PAT.PLAIN); S.box(x - 0.32, 0, 2.5, x + 0.32, gh - 0.1, 3.2); S.box(x - 0.45, 0, 2.4, x + 0.45, 0.35, 3.3);
        S.set(stone, PAT.PLAIN); S.box(x - 0.75, gh - 0.9, 2.55, x + 0.75, gh - 0.1, 3.15, 'Y'); S.box(x - 1.15, gh - 0.45, 2.55, x + 1.15, gh - 0.1, 3.15, 'Y');      // the springing of the arches, stepped
        if (i === 0 || i === bays) S.box(x - 0.32, 0, -0.2, x + 0.32, gh + 0.7, 2.5);                 // the end walls
        S.set(i % 2 ? stoneD : stone, PAT.PLAIN); S.box(x - 0.3, -1.3, -3, x + 0.3, -0.5, 2.6); S.box(x - 0.3, -2.1, -3, x + 0.3, -1.3, 1.2);      // a stepped corbel under every pier carries the floor
      }
      S.set([0.5, 0.33, 0.17], PAT.PLAIN, 0.3); S.box(-Wg / 2 - 0.7, -0.56, -1, Wg / 2 + 0.7, -0.5, 3.5, 'xXYzZ');      // the floor's underside, warm in the light of the lanterns hung under its lip
      S.pop();
      [1, 3, 5].forEach((i, k) => kit.add('lamp', { pivot: [xm - Wg / 2 + (i + 0.5) * bw, y0 - 0.5, zG + 3.3], rope: lipLamps[k][0], scale: 1.5, seed: lipLamps[k][1], glow: 1.3 }));
      [0, 2, 4, 6].forEach((i, k) => kit.add('lamp', { pivot: [xm - Wg / 2 + (i + 0.5) * bw, y0 + gh - 0.15, zG + 2.85], rope: 0.45, scale: 1.5, seed: lampSeeds[k], glow: 1.3 }));
      for (const fk of folk) kit.add(fk.kind, { pivot: [xm + fk.x, y0, zG + fk.z], yaw: fk.yaw, scale: fk.scale, tint: fk.tint, seed: fk.seed });
      }
      // the windlass
      const wx = E.x - eS * (GL - 6), wy = deckG(GL - 6) + 7, wz = wallZ(wx, wy + 0.5, zFace);
      S.push(wx, wy, wz, 0, 0, 0, 1);
      S.set(stoneD, PAT.PLAIN); S.box(-2.6, -0.45, -5, 2.6, 0, 3.2);
      S.set(C.plank, PAT.WOOD); for (const sx of [-1.5, 1.5]) { S.pole([[sx, 0, 1.2], [sx, 1.5, 2.1], [sx, 0, 3.0]], 0.12, 5); }
      S.pole([[-1.9, 1.45, 2.1], [1.9, 1.45, 2.1]], 0.5, 9); S.set(C.iron, PAT.METAL); S.pole([[1.9, 1.45, 2.1], [2.3, 1.45, 2.1], [2.3, 0.75, 2.1], [2.7, 0.75, 2.1]], 0.06, 5);
      S.set(C.hemp, PAT.ROPE); S.pole([[-1.1, 1.45, 2.1], [1.1, 1.45, 2.1]], 0.58, 9);      // the rope wound on the drum
      S.pop();
      kit.cable([[wx, wy + 1.45, wz + 2.66], [wx, wy + 1.0, wz + 3.5]], 0.07, C.hemp, PAT.ROPE, 0, 4);
      kit.add('basket', { pivot: [wx, wy + 1.0, wz + 3.5], rope: gq.range(8, 14), scale: 1.8, tint: gq.pick(C.canvas), motion: 0.7, seed: gq() });
      kit.add('lamp', { pivot: [wx - 2.2, wy + 2.6, wz + 1.5], rope: 0.4, scale: 1.6, seed: gq(), glow: 1.3 });
    }
    await ctx.yield();
    // the hung gangway: plank ties on two ropes, lamps and pots on its posts, 60 m along the crag's face to the ring and
    // 7 m on through it. The net's broad far end is overhead all along it: every second post is hung by a hanger that
    // leans outward to the net, so the two rows stand apart like the sides of a V and each rope is seen by itself.
    // No ladder comes down to its head any more: none can reach the deck and keep the lane (tested by the lane's rule).
    // THE GANGWAY'S OWN STAND-OFF (round 6): the line is the gangway's axis, 4.4 m over the planks. The posts lean
    // out from the base ropes (0.98 m from the axis) to tops 2.68 m from it, the hand ropes run on the posts, the
    // hangers go up from the post tops, and a lamp or a pot hangs plumb from a post's top: outboard of the leaning
    // post. Every post, hanger, lamp, pot and pennant is tested by the lane's own function with a margin of 2.5 m
    // at the gust's full swing (gangFree; draws before tests) and left out if it fails.
    {
      const gangFree = (x, y, z, r, arm) => laneGap(x, y, z, arm) > r + 2.5;
      const gangRope = (q, rad) => { for (let i = 0; i + 1 < q.length; i++) { const a = q[i], b = q[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) * 2)); for (let k = 0; k <= n; k++) if (!gangFree(lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n), lerp(a[2], b[2], k / n), rad, 0)) return false; } return true; };
      for (let a = GL; a > -7; a -= 0.66) { if (er.chance(0.03)) continue; kit.add('plank', { pivot: GW(a, 0, deckG(a)), yaw: -eS * PI / 2 + er.range(-0.06, 0.06), pitch: 0.13, scale: er.range(0.94, 1.06), tint: er.chance(0.12) ? mulc(C.plankPale, 1.15) : mulc(C.plank, er.range(0.62, 1.1)), seed: er() }); }
      const railL = [], railR = [], baseL = [], baseR = [];
      for (let a = GL, i = 0; a > -7; a -= 3.3, i++) {
        for (const sg of [-1, 1]) {
          const b = GW(a, sg * 0.98, deckG(a)), hp = [b[0], b[1] + 2.3, b[2] + sg * 1.7], under = net.inside(b[0], b[2] + sg * 9, 1), hung = i % 2 === 0 && under;
          const top = [b[0], net.y(b[0], b[2] + sg * 9), b[2] + sg * 9];
          const post = gangRope([b, hp], 0.045), hanger = hung && post && gangRope([hp, top], 0.045);
          if (Math.abs(a) > 1.7 && post) kit.cable(hanger ? [b, hp, top] : [b, hp], 0.045, C.hemp, PAT.ROPE, 1, 4);      // the hangers are ropes of the posts' own thickness and pale hemp (at 14 cm and dark they read as poles beside us)
          (sg < 0 ? railL : railR).push([b[0], b[1] + 1.08, b[2] + sg * 0.8]); (sg < 0 ? baseL : baseR).push([b[0], b[1] - 0.05, b[2]]);
          const r = er();
          if (Math.abs(a) < 5) continue;
          if (i % 3 === (sg < 0 ? 0 : 1)) { const seed = er(); if (post && reachClear(kit.info('lamp'), gangFree, hp, 0, 0, 0.5, 0.5, 1.3)) kit.add('lamp', { pivot: hp, rope: 0.5, scale: 1.3, seed, glow: 1 }); }
          else if (r < 0.35) { const kind = er.chance(0.5) ? 'potLong' : 'pot', rope = er.range(0.6, 1.4), scale = er.range(0.9, 1.25), seed = er(); if (post && reachClear(kit.info(kind), gangFree, hp, 0, 0, rope, rope, scale)) kit.add(kind, { pivot: hp, rope, scale, seed }); }
          else if (r < 0.6 && hung && under) { const f = 6.5 / Math.max(top[1] - hp[1], 8), q = [hp[0], hp[1] + 6.5, lerp(hp[2], top[2], f)], tint = er.pick(C.canvas), seed = er(); if (hanger && reachClear(PEN, gangFree, q, 0, 0, 0, 0, 0.9)) kit.add('pennant', { pivot: q, yaw: sg > 0 ? -PI / 2 : PI / 2, scale: 0.9, tint, seed }); }      // a pennant tied on the hanger itself, 6.5 m over the post's top (its reach is 2.1 m)
        }
      }
      kit.cable(railL, 0.04, C.hemp, PAT.ROPE, 1, 3); kit.cable(railR, 0.04, C.hemp, PAT.ROPE, 1, 3); kit.cable(baseL, 0.08, C.hempDark, PAT.ROPE, 1, 4); kit.cable(baseR, 0.08, C.hempDark, PAT.ROPE, 1, 4);
    }
    await ctx.yield();

    // ------------------------------------------------------------ cable cars on their own cables under the net
    // Each cable's end is slung from the net: a rope straight up to the edge of the net and two stays up along it, and an
    // iron ring where the three meet the cable.
    for (const [A, B] of carLines) for (const e of [A, B]) {
      const s0 = net.sOf(e[2]), t0 = net.tOf(e[0], e[2]);
      for (const ds of [0, -0.016, 0.016]) { const q = net.at(clamp(s0 + ds, 0.01, 0.99), clamp(t0 * (ds ? 0.96 : 1.04), -1, 1)); kit.cable([e, [lerp(e[0], q[0], 0.5), lerp(e[1], q[1], 0.5) - (ds ? 1.2 : 0), lerp(e[2], q[2], 0.5)], q], ds ? 0.07 : 0.1, ds ? C.hemp : mixc(C.hemp, C.hempDark, 0.4), PAT.ROPE, 1, 4); }
      S.flex = 1; S.set(C.iron, PAT.METAL); S.push(e[0], e[1], e[2], 0, 0, 0, 1); S.ring(0, 0.55, 0.13, 8, 4); S.pop(); S.flex = 0;
    }
    const car1 = makeCableCar(kit, carLines[0][0], carLines[0][1], carLines[0][2], { tint: COLORS.canvas[palBias[0]], seed: R.cars() });
    const car2 = makeCableCar(kit, carLines[1][0], carLines[1][1], carLines[1][2], { tint: COLORS.canvas[palBias[1]], seed: R.cars() });
    scene.add(car1.mesh, car2.mesh);
    const carT = [R.cars.range(24, 40), R.cars.range(24, 40)], carPh = [R.cars(), R.cars()];       // seconds there and back (a crossing every 12 to 20 s), and where each starts
    await ctx.yield();

    // ------------------------------------------------------------ cloud far below, and the shadows lying on it
    const bl = R.billow, gulfZ = (NET.zA + NET.zB) / 2 + 8;            // the middle of the gulf between the two faces
    // drifting cumulus at two heights between the cloud sea and the deepest houses, at every hour. They do not blow
    // away: each field goes slowly there and back along the gulf about its own place (a drawn reach, period and phase,
    // drawn first), so it is right at any clock. A cloud is given a place only where the rock stays clear of it along
    // its WHOLE slide, by the world's own height function: the cloud taken as a ball of its full breadth (its heaps
    // reach that far), looked at in eight directions, at its full and its half breadth, at both ends and the middle of
    // the slide, against rock standing over its base.
    const swayOf = (r) => ({ a: r.range(45, 75), w: (Math.PI * 2) / r.range(150, 240), p: r.range(0, Math.PI * 2) }), sway1 = swayOf(R.drift), sway2 = swayOf(R.drift2);
    const rockFree = (x, y, z, w, reach) => {
      for (const dx of [-reach, 0, reach]) for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, px = x + dx + Math.cos(a) * w, pz = z + Math.sin(a) * w; if (height(px, pz) > y - 5 || height(x + dx + Math.cos(a) * w * 0.5, z + Math.sin(a) * w * 0.5) > y - 5) return false; }
      return true;
    };
    await ctx.yield();                                                 // the first field makes the kit's noise texture: one call into the kit, a step of its own
    const drifting = makeCloudField({ rng: R.drift, mode: 'cumulus', sky, count: Math.round(13 * Math.min(1.15, density)), altitude: HR.sea + 62, altitudeJitter: 46,
      size: [80, 150], height: 0.42, center: [0, 0, gulfZ], extent: [1700, 240], wind: [0, 0, 0], silver: night ? 1 : 0.7, filter: (x, y, z, w) => rockFree(x, y, z, w, sway1.a) });
    scene.add(drifting.object);
    await ctx.yield();
    // the sea is one call into the kit, a step of its own; it takes the noise texture the first field has made
    const sea = makeCloudField({ rng: R.sea, mode: 'sea', sky, noiseTexture: drifting.noiseTexture, altitude: HR.sea, relief: 96, towers: 0.5, silver: night ? 1 : 0.7 });
    await ctx.yield();
    // form and contrast: the tops stay under white, the shade goes deeper and bluer (most at the low hours)
    sea.uniforms.uLit.value.multiplyScalar(low ? 0.86 : 0.95); sea.uniforms.uShade.value.lerp(new THREE.Color('#3a3d8a'), low ? 0.4 : 0.2).multiplyScalar(low ? 0.85 : 0.9); sea.uniforms.uBottom.value.copy(sea.uniforms.uShade.value).multiplyScalar(0.78);
    scene.add(sea.object);
    await ctx.yield();
    const drifting2 = makeCloudField({ rng: R.drift2, mode: 'cumulus', sky, noiseTexture: sea.noiseTexture, count: Math.round(8 * Math.min(1.15, density)), altitude: HR.sea + 128, altitudeJitter: 18,
      size: [60, 120], height: 0.4, center: [0, 0, gulfZ], extent: [1500, 330], wind: [0, 0, 0], silver: night ? 1 : 0.7, filter: (x, y, z, w) => rockFree(x, y, z, w, sway2.a) });
    scene.add(drifting2.object);
    await ctx.yield();
    // Towers: six great heaps standing up out of the sea beside the city's line: five drawn 120 to 260 m aside on
    // alternate sides down the gulf, the sixth across the city's line from the third and as far aside (a place of the
    // cloud sea and the city's line alone). And banks: cloud lapping round the foot of both mountains, a heap every
    // 80 m along each face, its middle 0.55 of its breadth out from where the rock stands 30 m over the sea.
    // ONE RULE FOR EVERY HEAP AND BANK, so that the great heaps stand and nothing stands in rock: a cloud's ROOM is the
    // least distance from its middle to rock standing over its base (looked for in sixteen directions, every 10 m). A
    // heap without 150 m of room is moved straight away from the city's line, 30 m at a time (eight times at most); a
    // bank without room for half its breadth is moved out from the foot by a quarter of its breadth (six times at
    // most). Then its breadth is cut to its room (the kit sets a cloud's puffs no farther from its middle than its
    // breadth, so none is centred in rock); a heap left under 100 m or a bank under 40 m is left out.
    const footOf = (x, y, dz, z0) => { let z = z0; for (let k = 0; k < 150 && height(x, z) < y; k++) z += dz * 6; return z; };
    const heaps = [], banks = [];
    for (let i = 0, sg = bl.chance(0.5) ? 1 : -1; i < 5; i++, sg = -sg) { const z = lerp(-60, -480, (i + bl.range(0.2, 0.8)) / 5), w = bl.range(160, 220); heaps.push([X(net.sOf(z)) + sg * bl.range(120, 260), HR.sea - 20, z, w]); }
    heaps.push([2 * X(net.sOf(heaps[2][2])) - heaps[2][0], HR.sea - 20, heaps[2][2], bl.range(180, 230)]);
    for (const dz of [-1, 1]) { for (let x = -640; x <= 640; x += 80) { const xx = x + bl.range(-25, 25), w = bl.range(130, 200); banks.push([xx, HR.sea - 14, footOf(xx, HR.sea + 30, dz, gulfZ + dz * 150) - dz * w * 0.55, w, dz]); } await ctx.yield(); }
    const roomAt = (x, y, z, most) => {
      if (height(x, z) > y - 5) return 0;
      let best = most;
      for (let k = 0; k < 16; k++) { const a = k * Math.PI / 8, c = Math.cos(a), s = Math.sin(a); for (let d = 10; d < best; d += 10) if (height(x + c * d, z + s * d) > y - 5) { best = d; break; } }
      return best;
    };
    const stand = [], lap = [];
    for (const h of heaps) {
      const sg = h[0] < X(net.sOf(h[2])) ? -1 : 1; let room = 0;
      for (let k = 0; k < 9; k++) { room = roomAt(h[0], h[1], h[2], h[3] * 1.05); if (room >= Math.min(150, h[3] * 1.05)) break; if (k < 8) h[0] += sg * 30; }
      const w = Math.min(h[3], room / 1.05); if (w >= 100) stand.push([h[0], h[1], h[2], w]);
      await ctx.yield();
    }
    for (let i = 0; i < banks.length; i++) {
      const b = banks[i]; let room = 0;
      for (let k = 0; k < 7; k++) { room = roomAt(b[0], b[1], b[2], b[3] * 1.05); if (room >= b[3] * 0.5) break; if (k < 6) b[2] -= b[4] * b[3] * 0.25; }
      const w = Math.min(b[3], room / 1.05); if (w >= 40) lap.push([b[0], b[1], b[2], w]);
      if (i % 4 === 3) await ctx.yield();
    }
    const towers = makeCloudField({ rng: R.towers, mode: 'cumulus', sky, noiseTexture: sea.noiseTexture, at: stand, height: 0.62, wind: [0, 0, 0], silver: night ? 1 : 0.7 });
    const lapping = makeCloudField({ rng: R.banks, mode: 'cumulus', sky, noiseTexture: sea.noiseTexture, at: lap, height: 0.3, puffs: 36, wind: [0, 0, 0], silver: night ? 1 : 0.7 });
    for (const f of [towers, lapping]) { f.uniforms.uShade.value.copy(sea.uniforms.uShade.value); f.uniforms.uBottom.value.copy(sea.uniforms.uBottom.value); scene.add(f.object); }
    await ctx.yield();
    const shadow = makeShadowSheet(kit, HR.sea + 18, 2800, { strength: hourName === 'night' ? 0.55 : 0.9, color: hourName === 'night' ? [0.02, 0.04, 0.12] : hourName === 'day' ? [0.17, 0.26, 0.46] : [0.26, 0.2, 0.4] });
    scene.add(shadow);
    await ctx.yield();

    // ------------------------------------------------------------ life: swifts by the terrace and to and fro over the net's top,
    // eagles below, motes in the bright air of the heart (a box of air that stays where it is)
    // BOTH FLOCKS OF SWIFTS are laid off the flown line by the place's own measure and dealt with maxSigma 3 (no bird's
    // dealt place lies farther than three scatters from its course on any axis), each with its wander written out; so
    // a flock's whole reach is bounded (its course, three scatters, the wander's whole box, the largest body's 1.03 m)
    // and that bound stands 2.5 m and more off the line. No keepClear is handed: nothing is searched at the build.
    // THE SWIFTS BY THE TERRACE wheel on its far side, across the deck from the line. Their round turns about a point
    // abeam of the terrace's middle, 22 m off its far rail (the far edge of the terrace's own clearing), 7 m over the
    // deck: 15 m in radius (19.7 m at the most with its wobble, so the course itself stays 2.3 m and more off that
    // rail), rising and falling 6 m. The line passes on the other side, at half the beam + the lane + 7 m:
    // 51.0 m from that point in plan where it is nearest. The flock's reach from the point in plan: the round 19.7 m,
    // three scatters of 0.45 x 12 m on both axes 22.9 m, the wander's box (4.05 by 2.4 m) 4.7 m, the body 1.03 m:
    // 48.3 m, so 2.7 m of clear air at the least whatever the deal; counted by place (the line every 0.1 m against
    // every bird's whole reach over its whole course, the body's ball taken off) the nearest reach is 12 m. The
    // scatter in height (16) and the wander's height (5) are the kit's own for swifts, written out.
    // THE SWIFTS OVER THE NET quarter it squarely across the city's line: out along one line across the mesh 22 m
    // before the hatch and back along another 48 m before it, turning 30 m beyond the edge ropes, ALL ON ONE LEVEL
    // 11 m above the top of the line's slope (the height of its level start, gate.K0: the line flies no higher but
    // for 0.4 m where it curves over), which is 51 to 85 m over the mesh under them. The flock is thin in height
    // (three scatters 4.05 m, 2 m of wander, the body 1.03 m: 7.1 m), so its lowest reach is 3.9 m over that top and
    // the line comes down its slope to the hatch under it; counted by place as above the nearest reach is 9 m. They
    // fly on the clock, at every hour of the flight; nothing in their course is taken from the route but that height.
    // The eagles soar over the deepest part of the gulf's floor under the city (looked for on the world's own height
    // function under the middle three fifths of the net), 30 m below the lowest thing the city hangs (and never
    // less than 60 m over the cloud sea's level): under us.
    const DUR = 50, lr = R.life;
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene) });
    fauna.add(F.makeFlock({ rng: R.swifts, species: 'swifts', count: Math.round(26 * density), size: 1.8, center: W(0, -side * (TI.B / 2 + 22), deckY + 7), radius: 15, height: 5, wobble: 0.3, spread: [12, 16, 40], wander: [2.7, 5, 2.4, 0.7], maxSigma: 3 }));      // by the terrace's far rail, across the deck from where we pass it
    const swiftWay = [];
    {
      const yOver = () => gate.K0[1] + 11;                           // one level for the whole round: 11 m above the slope's top
      const lineAt = (z, dir) => { const s = net.sOf(z), c = net.cx(s), h = net.half(s) + 30; for (let k = 0; k <= 8; k++) { const x = c + dir * h * (k / 4 - 1); swiftWay.push([x, yOver(x, z), z]); } return [c + dir * (h + 13), yOver(c + dir * h, z)]; };
      const z1 = gapZ + 22, z2 = gapZ + 48, e1 = lineAt(z1, 1); swiftWay.push([e1[0], e1[1], (z1 + z2) / 2]);
      const e2 = lineAt(z2, -1); swiftWay.push([e2[0], e2[1], (z1 + z2) / 2]);
    }
    fauna.add(F.makeFlock({ rng: R.swifts2, species: 'swifts', count: Math.round(16 * density), size: 1.8, route: swiftWay, spread: [26, 3, 40], wander: [9, 2, 8, 0.7], maxSigma: 3 }));
    const eagleAt = [0, 0, 0];
    {
      let floor = 1e9, deep = 1e9;
      for (let s = 0.2; s <= 0.8001; s += 0.04) for (let dx = -200; dx <= 200; dx += 25) { const x = net.cx(s) + dx, z = NET.zA - s * net.L, h = height(x, z); if (h < floor) { floor = h; eagleAt[0] = x; eagleAt[2] = z; } }
      for (const l of occ.values()) for (let i = 0; i < l.length; i += 5) deep = Math.min(deep, l[i + 2]);
      eagleAt[1] = Math.max(HR.sea + 60, deep - 30);
    }
    fauna.add(F.makeFlock({ rng: R.eagle, species: 'eagles', count: lr.int(2, 3), size: 2.6, center: eagleAt, radius: 30, soarRadius: 30 }));
    const tU = { value: 0 };
    const motes = fx.makeParticles({ rng: R.motes, preset: 'pollen', time: tU, follow: false, center: [hx, deckY + 8, hz], box: [96, 40, 96], count: Math.round(3000 * density), colors: ['#ffffff', '#fff3d8', '#e8f2ff'], size: [0.02, 0.05], intensity: hourName === 'night' ? 0.5 : 1.1 });
    scene.add(motes.object);
    // The rare visit: a cloud rises through the far half of the city, between the heart's clearing and the boat, and for a
    // few seconds everything hangs in white mist with only the lamps and the nearest ropes showing. It is fog (the
    // scene's and the kit's, thickened by metres flown), a wall of cloud that stands in the world round that stretch and
    // hides the sky from inside it, and dabs of mist that rise there, each about its own place.
    const mistCol = fogCol.clone().lerp(new THREE.Color('#ffffff'), 0.6);
    let cloud = null;
    if (rare) {
      const pA = path.posAtDist(mLeave, new THREE.Vector3()), pB = path.posAtDist(mBoat, new THREE.Vector3()), mid = pA.clone().lerp(pB, 0.5), span = pA.distanceTo(pB);
      const wall = new THREE.Mesh(new THREE.SphereGeometry(span / 2 + 80, 28, 16), new THREE.MeshBasicMaterial({ color: mistCol, side: THREE.BackSide, transparent: true, opacity: 0, depthWrite: false, fog: false }));
      wall.position.copy(mid); wall.renderOrder = 2.8; scene.add(wall);
      const dabs = fx.makeParticles({ rng: R.cloud, preset: 'dust', time: tU, follow: false, center: [mid.x, mid.y, mid.z], box: [130, 70, span + 60], count: 240, size: [7, 15], velocity: [0, 1.5, 0], velocityRandom: [0.4, 0.5, 0.4], turbulence: [0.6, 0.2, 0.6],
        colors: ['#ffffff', '#f4f6fa', '#ffffff'], intensity: 1, opacity: 0, additive: 0, core: 0, twinkle: 0, near: [3, 12], minAngle: 0 });
      scene.add(dabs.object); cloud = { wall, dabs };
    }
    // shafts of light: under every hatch whose place lies in the sun, a beam of lit air along the sun's own ray from the
    // hatch (as wide as the hatch, 70 m long, fading along its length and toward its edge). Nothing switches: a hatch
    // in the first mountain's shade simply has none.
    {
      const beam = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        uniforms: { uCol: { value: sky.lightColor.clone().multiplyScalar(night ? 0.025 : low ? 0.1 : 0.05) }, uFogDen: { value: HR.den } },
        vertexShader: 'varying vec3 vW; varying vec3 vN; varying float vT; void main(){ vT = uv.y; vec4 w = modelMatrix * vec4(position, 1.); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
        fragmentShader: `varying vec3 vW; varying vec3 vN; varying float vT; uniform vec3 uCol; uniform float uFogDen;
          void main(){ vec3 V = cameraPosition - vW; float d = length(V); float e = abs(dot(normalize(vN), V / max(d, 1e-3)));
            float a = e * sqrt(e) * vT * (1. - smoothstep(0.9, 1., vT)) * smoothstep(5., 22., d) * exp(-d * d * uFogDen * uFogDen);
            gl_FragColor = vec4(uCol * a, 1.); }` });
      const axis = new THREE.Vector3(0, 1, 0);
      for (const h of holes) {
        const y = net.y(h[0], h[1]); if (y < shadeH(h[0], h[1])) continue;
        const len = 70, g = new THREE.CylinderGeometry(h[2], h[2] * 1.2, len, 20, 1, true), m = new THREE.Mesh(g, beam);
        m.quaternion.setFromUnitVectors(axis, sunDir); m.position.set(h[0], y, h[1]).addScaledVector(sunDir, -len / 2 - 1);
        m.renderOrder = 4.5; m.frustumCulled = false; m.name = 'shaft'; scene.add(m);
      }
    }
    const hungGroup = await kit.finish();
    scene.add(hungGroup);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);

    const bell = (x, a, b, w) => smoothstep(a, a + w, x) * (1 - smoothstep(b - w, b, x));
    kit.uniforms.uMist.value.set(mistCol.r, mistCol.g, mistCol.b, 0);
    const hatchView = new THREE.Vector3(S0[0], S0[1], S0[2]);            // the head of the street under the hatch
    const first = new THREE.Vector3(hx, hyNet - 16, hz), worksV = new THREE.Vector3(galleryAt[0], galleryAt[1], galleryAt[2]);      // the middle of the city (16 m under the net over the heart: the depth of its first houses); the middle of the lamp-lit gallery on the face beside the ring
    const fadeOf = (a, b) => Math.min(0.5, 40 / Math.max(b - a, 80));    // a gaze fade of 40 m of flight, as a share of its window
    const mFirst = Math.max(mGate, 30);                                  // where the first pull begins: abeam of the gatehouse, and never before the first 30 m
    const hand = hallV ? clamp(Math.min(40, (mHero - mHatch) / 2, mHall - mHero), 1, 40) : 40;      // the length of the stretch across which the terrace's pull hands over to the hall's (40 m unless a window is shorter)
    let mX1 = mNet; for (let m = mGate; m <= mHatch; m++) { path.posAtDist(m, _pv); if (_pv.z < crossZ(1)) { mX1 = m; break; } }      // where the route crosses the net's first cross cable

    return {
      scene, path, duration: DUR,
      title: hourName === 'night' ? 'The City Hung Below Its Net, by Moonlight' : 'The City Hung Below Its Net',
      camera: { fov: 62, near: 0.3, far: 5400, lookAhead: 26, sway: 1, bank: 0.15 },
      // slower through the heart: slowing from the hatch (where we are through the mesh) to where the route comes into
      // the heart's clearing, back to speed from abeam of the terrace to where the route leaves the clearing
      pace: (u) => (1.1 - 0.3 * smoothstep(uM(mHatch), uM(mNear), u) * (1 - smoothstep(uM(mHero), uM(mLeave), u))) * (0.72 + 0.28 * smoothstep(uM(mGate - 5), uM(mGate + 45), u)),
      pois: [
        // ONE PULL AT A TIME, each window a place in metres. NO PULL AT THE FIRST METRES: the first pose lies along the
        // level entry frame. The gatehouse hangs abeam 12 to 36 m in: a pull on it could only look back, so it has
        // none (it stands in the view ahead, to the stay's hand and below, from the first metre). The first pull
        // begins at the knot abeam of the gatehouse or 30 m in, whichever is later, and rises from nothing over half
        // its window (23 to 37 m).
        { at: first, from: uM(mFirst), to: uM(mX1 + 30), weight: 0.3, fade: fadeOf(mFirst, mX1 + 30) },          // the whole city under its net, from the gatehouse until 30 m past where the route crosses the net's first cross cable
        { at: hatchView, from: uM(mCorner), to: uM(mHatch), weight: 0.45, fade: fadeOf(mCorner, mHatch) },            // down into the hatch, along the top of the net
        { at: hero.anchors.terrace, from: uM(mHatch), to: uM(mHero), weight: 0.6, fade: hand / Math.max(mHero - mHatch, 2 * hand) },   // the terrace, from the hatch until it is abeam
        // the great hall: its pull begins where the terrace's fade begins and rises across that fade's own length
        // ('hand' metres: one shared stretch, the two weights adding to 0.6 at its head and 0.54 at its end, never
        // more), on the same hand; so the gaze has come round BEFORE the line's own turn out of the heart (the turn
        // then adds no whip); until the hall is abeam
        ...(hallV ? [{ at: hallV, from: uM(mHero - hand), to: uM(mHall), weight: 0.54, fade: hand / Math.max(mHall - mHero + hand, 2 * hand) }] : []),
        { at: worksV, from: uM(mBoat), to: uM(mGang), weight: 0.4, fade: fadeOf(mBoat, mGang) },                // the works on the crag by the ring: from abeam of the boat on the leg (so the gaze has come round before the turn begins and the turn adds no whip), round the turn, to the gangway's head (the pull's end: the last 60 m to the ring are left to the ring itself)
      ],
      portal: { shape: 'circle', radius: 7, color: hourName === 'night' ? '#ffd08a' : '#ffe6b4', glow: 1, revealDistance: 340, tilt: true },
      post: {
        exposure: HR.exposure, bloom: { strength: hourName === 'night' ? 0.6 : 0.36, radius: 0.6, threshold: 0.92 },
        grade: { saturation: night ? 0.96 : hourName === 'day' ? 1.14 : 1.16, contrast: night ? 1.06 : hourName === 'day' ? 1.1 : 1.12, tint: '#ffffff', shadowTint: hourName === 'night' ? '#060a22' : '#0a1226', vignette: 0.28, grain: 0.02, aberration: 0 },
      },
      update(dt, time, camera, u) {
        tU.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera); terrain.update(dt, time); ridges.update(dt, time, camera);
        drifting.object.position.x = sway1.a * Math.sin(time * sway1.w + sway1.p); drifting2.object.position.x = sway2.a * Math.sin(time * sway2.w + sway2.p);
        sea.update(dt, time, camera); drifting.update(dt, time, camera); drifting2.update(dt, time, camera); towers.update(dt, time, camera); lapping.update(dt, time, camera);
        const mu = u * Lr;
        kit.update(dt, time, camera);
        car1.place(0.5 - 0.44 * Math.cos(TAU * (time / carT[0] + carPh[0]))); car2.place(0.5 - 0.44 * Math.cos(TAU * (time / carT[1] + carPh[1])));
        fauna.update(dt, time, camera, u); motes.update(dt, time, camera);
        if (cloud) {
          const m = bell(mu, mLeave, mBoat, 28);
          kit.uniforms.uMist.value.w = m; scene.fog.density = HR.den * (1 + 30 * m); scene.fog.color.copy(fogCol).lerp(mistCol, m); cloud.wall.material.opacity = 0.92 * m; cloud.dabs.setOpacity(0.2 * m); cloud.dabs.update(dt, time);
        }
      },
      dispose() { sky.dispose?.(); },
    };
  },
};
