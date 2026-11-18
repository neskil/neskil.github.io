// BLUE SAILS ON A DRY SEA. The old Mars of the book: at the blue hour a fleet of sand ships under tall sails of
// lit blue smoke runs over a dry sea bottom to a white town; we fly low among them to the old shore, up the water
// stairs, through a house of crystal pillars and along a lamp-lit wine-dark canal to a basin where the portal
// stands between two white towers under two hurrying moons.
//
// MAP
//   src/parts/blue-sails-dry-sea.js        the hero (one sand ship; makeFleet instances it) and what all files share
//   src/parts/blue-sails-dry-sea-sky.js    sea bottom, moons, hills, flame birds and canopy, fire globes
//   src/parts/blue-sails-dry-sea-town.js   the town in stone, towers, windows, the mirror under the canal
//   src/parts/blue-sails-dry-sea-life.js   crystal house, water, lamps, boats, fountains, creeper, townsfolk
//   this file: the seeded variations (hour, wind side, fleet), kit sky, lights, fog, path, gaze, update.
// Space: +X east, travel toward -Z, y = 0 the sea bottom. THE ONE PACING: the event is paced to the flight (the ships
// and the flame birds progress along their own courses with the metres we have flown); every slowing, slackening,
// settling and look follows each frame from distances between things; everything else runs on the world clock.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, makeRng, hashSeed } from '../kit/core.js';
import { makeSky } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import { makeShared, makeFleet, makeBanners, skyDir, shipRunAt } from '../parts/blue-sails-dry-sea.js';
import { makeSand, makeMoons, makeHills, makeFlameBirds, makeGlobes, makeBones, makeStones, hillHeight, MAX_SHIPS } from '../parts/blue-sails-dry-sea-sky.js';
import { makeTown, JETTIES, BANNER_MASTS, MAST_H, QUAY_Y } from '../parts/blue-sails-dry-sea-town.js';
import { makeLife } from '../parts/blue-sails-dry-sea-life.js';

const DUR = 42, ZS = -250;                                          // seconds; where we come in (z)
// places we pass (z), by which every window of the flight is given in metres
const STAIR_FOOT = -400, STAIR_HEAD = -430, HOUSE_DOOR = -445, HOUSE_MID = -480, BASIN_MOUTH = -707, BASIN_MID = -745, JETTY_HEAD = -372;
// the three hours a visit can fall in
const HOURS = [
  { key: 'blue', zenith: '#141842', mid: '#4A4496', horizon: '#7C6BB8', band: '#D08C9C', scatter: 0.9, stars: 0.55, dens: 1, fog: '#4C4890', key_: 1.5, moon: 0.6, sky: 1.0, win: 1.0, sail: 1.0, moonGain: 2.5, moonPath: 0.3, exposure: 1.25 },
  { key: 'early', zenith: '#22265E', mid: '#6A5AA8', horizon: '#A888BC', band: '#F0A090', scatter: 1.2, stars: 0.3, dens: 1, fog: '#6A5C9C', key_: 1.9, moon: 0.4, sky: 1.05, win: 0.7, sail: 0.9, moonGain: 2.0, moonPath: 0.15, exposure: 1.15 },
  { key: 'late', zenith: '#0A0E30', mid: '#2A2E78', horizon: '#4A4A98', band: '#8C6490', scatter: 0.5, stars: 0.85, dens: 0.5, fog: '#30327A', key_: 0.9, moon: 1.0, sky: 0.9, win: 1.15, sail: 1.12, moonGain: 3.0, moonPath: 0.8, exposure: 1.35 },
];
// where each ship of the fleet comes to rest (x); the first two places belong to the ship we follow and the one
// that crosses ahead of us, whose courses are laid out below
const LANES = [-15, 16, -34, 36, -56, 60, -80, 88, -110, 120, -24, 26, -150, 165, -190, 205, -230, 250];
// ships that lie moored with slack sails: three off the jetties (the brief's), and one alongside each flank of the
// water stairs: its keel 6.3 m off the flank's outer face (x 22.2: a runner's 3 m and 3.3 m clear), its middle 19 m
// off the face of the sea wall (z -430: half a hull and 11 m of sand before the bow)
const MOORED = [[-70, -398], [52, -398], [96, -398]], MOORED_STAIRS = [-1, 1].map((sd) => [sd * (22.2 + 3 + 3.3), -430 + 8 + 11]);

// EVERY STREAM of this world, one per kind of thing: forked from ctx.rng in this order at the head of build(), before
// anything is drawn or built. Nothing else forks or draws from ctx.rng. (A ship's own sprites take a stream salted
// by the ship's number, which costs no draw.)
const STREAMS = ['vary', 'sky', 'moons', 'lead', 'crosser', 'courses', 'moored', 'bones', 'boneShapes', 'stones', 'marks', 'shore', 'towers', 'windows',
  'banners', 'shoreGlow', 'boats', 'house', 'avenue', 'houseMist', 'creeper', 'creeperWall', 'creeperLeaves', 'leaves', 'treeA', 'treeB', 'treeC', 'trees',
  'folk', 'folkStairs', 'moths', 'flock', 'birds', 'globes', 'devils', 'devilA', 'devilB', 'haze', 'motes', 'fountains'];
// THE SEEDED VARIATIONS, dealt by shares from the stream 'vary'
function deal(v) {
  // the hour: the blue hour 1/2, earlier 1/4, later 1/4
  const hr = v(), hour = hr < 1 / 2 ? 0 : hr < 3 / 4 ? 1 : 2;
  // the wind on either side, 1/2 each
  const tack = v() < 1 / 2 ? 1 : -1;
  // twelve to eighteen ships under way; who comes in fastest: all mixed 1/2, the middle lanes 1/4, the wings 1/4
  const nShips = v.int(12, 18), fr = v(), formation = fr < 1 / 2 ? 'lane' : fr < 3 / 4 ? 'wedges' : 'crescent';
  // the blue of the sails: smoke-grey blue .. the brief's blue .. violet blue
  const sailHue = v();
  // the flame birds come from the west 2/3, from the east 1/3; a second canopy 1/4
  const birdSide = v() < 2 / 3 ? -1 : 1, twoCanopies = v() < 1 / 4;
  // the wine in the canals: lavender 2/3, green 1/3
  const canalGreen = v() < 1 / 3, nBoats = v.int(5, 12);
  const moonPhase = [v.range(0.62, 0.86), v.range(0.55, 0.8)], moonShift = v.range(-3, 3);
  return { hour, tack, nShips, formation, sailHue, birdSide, twoCanopies, canalGreen, nBoats, moonPhase, moonShift };
}

export default {
  id: 'blue-sails-dry-sea',
  name: 'Blue Sails on a Dry Sea',
  category: 'books',
  placeKind: 'alien',
  book: 'The Martian Chronicles',
  author: 'Ray Bradbury, 1920 to 2012',
  weirdness: 0.5,
  async build(ctx) {
    const detail = ctx.quality?.detail ?? 1;
    const S = Object.fromEntries(STREAMS.map((k) => [k, ctx.rng.fork(k)]));
    const shipStream = (i) => makeRng(hashSeed(ctx.seed + ':blue-sails:ship:' + i));
    // where three small things that run on the clock start (the canopies' ripple, the rings round the jets, the flicker
    // of the lamps', boats' and fruit's glows): ONE stream of their own, named from the seed, which no other stream
    // feeds or follows. Drawn in this order: the two canopies here; then in the life part the twelve jets, the lamp
    // glows, their mirror, the boat glows, their mirror, the fruit glows.
    const phases = makeRng(hashSeed('phases:' + ctx.seed)), canopyPh = [phases() * 6.283, phases() * 6.283];
    const scene = new THREE.Scene();
    const V = deal(S.vary), hour = HOURS[V.hour], { tack, nShips, formation, sailHue, birdSide, twoCanopies, canalGreen, nBoats, moonPhase, moonShift } = V;
    await ctx.yield();

    const sailCol = new THREE.Color('#3F7BE6').lerp(new THREE.Color(sailHue < 0.5 ? '#5C80BC' : '#5A58F0'), Math.abs(sailHue - 0.5) * 1.5);
    const SH = makeShared({ tack, sail: '#' + sailCol.getHexString(), sailDeep: '#' + sailCol.clone().lerp(new THREE.Color('#1830A0'), 0.6).getHexString() });
    SH.uSailB.value.multiplyScalar(hour.sail);
    const wine = canalGreen ? '#3C6414' : '#6C3A8E';                 // bottle green, or a red-violet wine
    SH.uPoolCol = { value: new THREE.Color(wine) };                  // the pools of the crystal house hold the same wine
    SH.uKeyCol.value.set('#E0A8C0').multiplyScalar(hour.key_); SH.uMoonCol.value.set('#BFD0FF').multiplyScalar(hour.moon); SH.uSkyCol.value.set('#5868C0').multiplyScalar(0.62 * hour.sky);
    const fogCol = new THREE.Color(hour.fog);
    SH.uFog.value.set(fogCol.r, fogCol.g, fogCol.b, 0.0010);
    scene.fog = new THREE.FogExp2(fogCol, 0.0010);

    // ---- PATH: in over the sea bottom 150 m off the stairs (the sea is a quarter of the way), up the stairs, through
    // the house, along the canal, and one straight line to the portal
    const path = makePath([[0, 3, ZS], [0, 3, -295], [0, 5, -335], [0, 10.5, -390], [0, 13.5, -432],
      [0, 13, -480], [0, 12.5, -515], [0, 11.5, -560], [0, 11.5, -685], [0, 14.25, -747.5], [0, 17, -810]]);
    // a point of the flight is given as a place we pass and metres of our way before (-) or after (+) it
    const L = path.length, dAt = (z, m = 0) => clamp(path.nearestXZ(0, z).u * L + m, 0, L), uOff = (z, m = 0) => dAt(z, m) / L;

    // ---- lights: hemisphere, the afterglow from the west-north-west, the moons' fill (three; no shadows)
    scene.add(new THREE.HemisphereLight('#5868C0', '#8A6470', 1.0 * hour.sky));
    const key = new THREE.DirectionalLight('#E0A8C0', hour.key_); key.position.copy(skyDir(9, -60)).multiplyScalar(500); scene.add(key);
    const fill = new THREE.DirectionalLight('#BFD0FF', hour.moon); fill.position.copy(skyDir(30, 8)).multiplyScalar(500); scene.add(fill);
    await ctx.yield();

    // ---- sky: the kit dome (no bodies: the moons are our own, they move), thin cirrus low in the west
    const sky = makeSky({
      rng: S.sky, preset: 'blueHour', zenith: hour.zenith, mid: hour.mid, horizon: hour.horizon, ground: hour.fog, horizonPow: 3.2, midPow: 1.3,
      scatterColor: hour.band, scatter: hour.scatter, scatterPow: 3.2, scatterHigh: 0.05, scatterFall: 5,
      sunElevation: -7, sunAzimuth: -60, sunIntensity: 0, sunGlow: 0.18, stars: hour.stars, twinkle: 0.5, starDensity: hour.dens, milkyWay: 0.12,
      bodies: [], clouds: false, clouds2: { stretch: 1, coverage: 0.25, lit: '#E8A8B0', shade: '#5A4E8C', opacity: 0.8, wind: [0.006, 0.002] },
      fogColor: hour.fog, bake: true, bakeSize: 256, renderer: ctx.renderer,
    });
    scene.add(sky.object);
    await ctx.yield();
    const moons = makeMoons(SH, { phaseA: moonPhase[0], phaseB: moonPhase[1], gain: hour.moonGain }); scene.add(moons.object);
    await ctx.yield();

    // ---- the sea bottom and the land round the town
    const sand = makeSand(SH, { moonPath: hour.moonPath }); scene.add(sand.object);
    await ctx.yield();
    const hills = makeHills(SH, ctx.noise); scene.add(hills.object);
    await ctx.yield();
    // ---- THE FLEET. Every ship runs one straight course, at a steady share f of our own rate, from where it stands
    // at the entry to where it comes to rest; the courses lean in toward the water stairs, so sails cross the view at
    // every distance and the runner tracks converge on the town.
    const sfx = Math.sin, cfx = Math.cos, moving = [], still = [], lay = S.courses;
    // a ship is given by where it comes to rest, the way it comes in, its share f of our rate and the metres we have
    // flown when it lies still (dHome): it slows over its last B metres (30, or two fifths of a short run: bsRun in the
    // hero part), so its run is R = f * dHome - B, and it stands R back along its course when we come in
    const inbound = (x1, z1, th, f, dHome) => { let R = f * dHome / 1.4; if (R > 75) R = f * dHome - 30; return { x: x1 - sfx(th) * R, z0: z1 + cfx(th) * R, f, th, R }; };
    const between = (x0, z0, x1, z1, dHome) => { const R = Math.hypot(x1 - x0, z1 - z0); return { x: x0, z0, th: Math.atan2(x1 - x0, z0 - z1), R, f: (R + Math.min(30, 0.4 * R)) / dHome }; };
    const ship = (c, r, lead) => moving.push({ ...c, moored: 0, size: lead ? 1.0 : r.range(0.86, 1.08), tint: r(), phase: r() * 6.28, lead });
    // THE SHIP WE FOLLOW (her own stream): when we come in she is 45 to 65 m on along the fairway, 2 to 4 m to leeward
    // of it, and she runs to lie 12 to 16 m to leeward of it, 21.5 m off the foot of the stairs (a hull's length and
    // her runners clear of the lowest step), still by the time we are 0 to 20 m past the head of the stairs. The
    // fairway is the town's axis, which our route follows: we close on her stern and pass to windward of her.
    { const r = S.lead; ship(between(tack * r.range(2, 4), ZS - r.range(45, 65), tack * r.range(12, 16), STAIR_FOOT + 21.5, dAt(STAIR_HEAD, r.range(0, 20))), r, true); }
    // ONE CROSSES the fairway far ahead of us, along the shore (its own stream): from 10 to 20 m inside the leeward
    // jetty's head, 8 m out from it, to 13 m beyond the windward jetty's head, 14 m out; it lies still by the time
    // we are abreast of the jetty heads, or up to 25 m short of them
    { const r = S.crosser; ship(between(tack * (JETTIES[2] - r.range(10, 20)), JETTY_HEAD + 8, -tack * (JETTIES[2] + 13), JETTY_HEAD + 14, dAt(JETTY_HEAD, -r.range(0, 25))), r, false); }
    // the rest of the fleet, all from the stream 'courses'
    for (let i = 2; i < nShips; i++) {
      const lane = LANES[i], a = Math.abs(lane), sd = Math.sign(lane);
      // each is home at a moment of its own, some time between our coming within 60 m of the foot of the stairs and
      // our passing 30 m beyond it (over the head of them)
      const dHome = dAt(STAIR_FOOT, -60 + 90 * lay());
      // where it comes to rest: a ship whose lane runs between two jetties, clear of the moored ones, glides right
      // in to a berth under the wall; the rest lie off, the nearest of them off the foot of the stairs
      const berth = a >= 30 && a <= 200 && !JETTIES.some((j) => Math.abs(j - lane) < 8) && ![...MOORED, ...MOORED_STAIRS].some((m) => Math.abs(m[0] - lane) < 12);
      const zr = berth ? lay.range(-415, -403) : a < 30 ? lay.range(-378, -364) : lay.range(-362, -344);
      // the formation decides who comes in fastest: all mixed, the middle lanes, or the wings
      let f = formation === 'wedges' ? 0.8 - 0.4 * Math.abs(a - 70) / 180 : formation === 'crescent' ? 0.4 + 0.45 * Math.pow(a / 250, 1.3) : 0.42 + 0.4 * lay();
      f = clamp(f + lay.range(-0.06, 0.06), 0.34, 0.86);
      // its course leans in toward the stairs, the more the further out its lane
      ship(inbound(lane, zr, -sd * (berth ? 0.06 : clamp(0.1 + 0.0022 * a, 0.1, 0.42)), f, dHome), lay, false);
    }
    for (const [x, mz] of [...MOORED, ...MOORED_STAIRS]) { const sm = S.moored; still.push({ x, z0: mz + sm.range(-2, 2), f: 0, R: 0, th: 0, moored: 1, size: sm.range(0.9, 1.05), tint: sm(), phase: sm() * 6.28 }); }
    // clearances, as margins in space, walked every 2 m of our way until every ship lies still (the last is the one we
    // follow, by the time we are 20 m past the head of the stairs): no ship but the one
    // we follow comes within 30 m of us, and no two ships within 24 m of each other; one that would is set 24 m
    // further back along its own course
    const shipXZ = (sh, D) => { const g = shipRunAt(sh, D).s; return [sh.x + sfx(sh.th) * g, sh.z0 - cfx(sh.th) * g]; };
    const D_STILL = dAt(STAIR_HEAD, 20), pv = new THREE.Vector3();
    const nearest = (sa, sb) => { let m = 1e9; for (let D = 0; D <= D_STILL; D += 2) { const p = shipXZ(sa, D); let q; if (sb) q = shipXZ(sb, D); else { path.posAtDist(D, pv); q = [pv.x, pv.z]; } m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1])); } return m; };
    for (let i = 1; i < moving.length; i++) for (let tries = 0; tries < 10; tries++) {
      const sh = moving[i];
      let bad = nearest(sh, null) < 30;
      for (let j = 0; j < i && !bad; j++) bad = nearest(sh, moving[j]) < 24;
      for (let j = 0; j < still.length && !bad; j++) bad = nearest(sh, still[j]) < 24;
      if (!bad) break;
      sh.x -= sfx(sh.th) * 24; sh.z0 += cfx(sh.th) * 24;
    }
    const ships = [...moving, ...still];
    await ctx.yield();
    const fleet = makeFleet(ctx, SH, ships, { sprites: shipStream }); scene.add(fleet.object);
    await ctx.yield();
    // how near a place on the bed lies to a ship's course (from where it stands as we come in to where it rests)
    const offCourse = (x, z) => { let m = 1e9; for (const sh of ships) { const ex = sfx(sh.th), ez = -cfx(sh.th), t = clamp((x - sh.x) * ex + (z - sh.z0) * ez, 0, sh.R + 9); m = Math.min(m, Math.hypot(x - sh.x - ex * t, z - sh.z0 - ez * t)); } return m; };

    // ---- the bones of the dead sea, all the way in: small coiled shells and loose vertebrae close under our line,
    // rib cages, great shells and tusks beside it, the biggest far out; none on a ship's course or in our way
    const bz = S.bones, bonePlaces = [], REACH = [4.6, 2.2, 2.6, 2.6], TALL = [2.6, 1.2, 3.6, 0.9];
    for (let z = ZS + 24; z > -364; z -= bz.range(2.2, 4.4)) {
      const zone = bz(), under = zone < 2 / 5, mid = zone < 4 / 5, kind = under ? (bz() < 1 / 2 ? 1 : 3) : bz() < 1 / 3 ? 0 : bz.int(1, 3), side = bz.sign();
      const ax = under ? bz.range(2.4, 7) : mid ? bz.range(8, 30) : bz.range(30, 120);
      const sc = (under ? bz.range(0.3, 0.5) : mid ? bz.range(0.5, 0.95) : bz.range(0.9, 1.6)) * (under && kind === 3 ? 2 : 1);
      const pl = { x: side * ax, z, kind, s: kind === 0 ? Math.max(sc, 0.8) : sc, rot: bz.range(0, 6.283), tilt: bz.range(-0.25, 0.25), roll: bz.range(-0.3, 0.3) * (kind === 0 ? 1.6 : 1), sink: bz.range(0.1, 0.35) };
      const reach = REACH[kind] * pl.s, top = TALL[kind] * pl.s;
      if (kind === 0) pl.sink += 1.2;                                 // every rib cage lies drifted over to near half its height (1.2 m of 2.6 at scale 1): low arches, not a row of strokes
      if (offCourse(pl.x, z) < 4.5 + reach) continue;                // clear of every runner by 1.5 m
      if (Math.hypot(Math.max(ax - reach, 0), Math.max(path.nearestXZ(0, z).y - top, 0)) < 1.6) continue;      // clear of our own line by 1.6 m
      bonePlaces.push(pl);
    }
    scene.add(makeBones(SH, bonePlaces, S.boneShapes).object);
    const st = S.stones, stones = [];
    for (let i = 0; i < Math.round(320 * detail); i++) stones.push({ x: st.sign() * (0.6 + 44 * st() * st()), z: st.range(ZS + 16, -398), s: st.range(0.1, 0.42), rot: st.range(0, 6.283), flat: st.range(0.35, 0.9), tone: st() });
    scene.add(makeStones(SH, stones).object);
    await ctx.yield();

    // ---- the town
    // old sea-marks stand along the fairway, one every 29 m on alternate sides, from 8 m inside our entry to the
    // mooring posts; none where a ship's runners pass
    const mr = S.marks, marks = [];
    for (let k = 0; ZS - 8 - 29 * k > -366; k++) {
      const m = { x: (k % 2 ? 1 : -1) * mr.range(8.3, 9.4), z: ZS - 8 - 29 * k + mr.range(-3, 3), h: mr.range(1.9, 2.6), r: mr.range(0.42, 0.58), tone: mr() };
      if (offCourse(m.x, m.z) > 7.5) marks.push(m);
    }
    const town = await makeTown(ctx, SH, { streams: S, windows: hour.win, marks }); scene.add(town.object);
    await ctx.yield();
    // banners on the masts of the sea wall: three ribbons to a mast
    const banners = [];
    const bnr = S.banners;
    BANNER_MASTS.forEach(([x, z]) => { for (let j = 0; j < 3; j++) banners.push({ x, y: QUAY_Y + MAST_H - 0.1 - j * 1.1, z, len: [9, 7.2, 8.2][j], phase: bnr() * 6.283 }); });
    scene.add(makeBanners(SH, banners));
    await ctx.yield();

    // ---- lamps of the shore (jetty heads, stair posts): glows
    const time = SH.uTime;
    const shoreGlow = fx.makeGlows({ rng: S.shoreGlow, positions: town.lamps, sizes: town.lampSizes, color: '#FFC46A', size: 2.6, intensity: 2.0, flicker: 0.15, time });
    scene.add(shoreGlow.object);
    await ctx.yield();

    // ---- what lives in the town: water, lamps, boats, fountains, the crystal house, creeper, trees, people
    const life = await makeLife(ctx, SH, town, { streams: S, phases, water: wine, boats: nBoats, sky: { zenith: hour.zenith, horizon: hour.horizon } });
    scene.add(life.object);
    await ctx.yield();

    // ---- THE FLAME BIRDS: one flock (sometimes two) crossing ahead of us to settle on the broad drum by the canal.
    // The route is a curve in space. When we come in the canopy has flown some of it already (a share drawn from the
    // flock's own stream, as is the place it sets out from); it flies its own metres as we fly ours (quickest at
    // first, easing down), so that it is over the drum when we top the stairs (the second: when we are in the middle
    // of the house); it settles while it flies its last 30 m.
    const fl = S.flock;
    const routes = [{ p0: [birdSide * fl.range(215, 245), fl.range(84, 96), -fl.range(315, 345)], p1: [birdSide * 10, 64, -470], p2: [-birdSide * 50, 46.6, -700], dHome: dAt(STAIR_HEAD), start: fl.range(0, 0.15) }];
    if (twoCanopies) routes.push({ p0: [-birdSide * fl.range(245, 275), fl.range(106, 118), -fl.range(415, 445)], p1: [-birdSide * 40, 82, -560], p2: [birdSide * 50, 46.6, -700], dHome: dAt(HOUSE_MID), start: fl.range(0, 0.15) });
    const bez = (r, q, out) => { const a = (1 - q) * (1 - q), b = 2 * q * (1 - q), c = q * q; return out.set(a * r.p0[0] + b * r.p1[0] + c * r.p2[0], a * r.p0[1] + b * r.p1[1] + c * r.p2[1], a * r.p0[2] + b * r.p1[2] + c * r.p2[2]); };
    const bA = new THREE.Vector3(), bB = new THREE.Vector3(), NB = 64;
    for (const r of routes) { r.tab = [0]; bez(r, 0, bA); for (let k = 1; k <= NB; k++) { bez(r, k / NB, bB); r.tab.push(r.tab[k - 1] + bA.distanceTo(bB)); bA.copy(bB); } r.len = r.tab[NB]; }
    const canopyAt = (r, D, out, head) => {
      const x = clamp(D / r.dHome, 0, 1), way = r.len * (r.start + (1 - r.start) * (1 - Math.pow(1 - x, 1.6)));       // metres of its own way flown
      let k = 0; while (k < NB - 1 && r.tab[k + 1] < way) k++;
      const q = (k + (way - r.tab[k]) / Math.max(r.tab[k + 1] - r.tab[k], 1e-6)) / NB;
      bez(r, q, out);
      if (head) head.set((1 - q) * (r.p1[0] - r.p0[0]) + q * (r.p2[0] - r.p1[0]), (1 - q) * (r.p1[1] - r.p0[1]) + q * (r.p2[1] - r.p1[1]), (1 - q) * (r.p1[2] - r.p0[2]) + q * (r.p2[2] - r.p1[2])).normalize();
      return smoothstep(r.len - 30, r.len, way);
    };
    const birds = makeFlameBirds(SH, { rng: S.birds, flocks: routes.length, count: 900, phase: canopyPh }); scene.add(birds.object);
    await ctx.yield();

    // ---- the old ones: 36 globes of blue fire over the hills, five of them wandering in low over the tiers
    const gr = S.globes, globes = [];
    for (let i = 0; i < 31; i++) {
      const x = gr.sign() * gr.range(330, 1300), z = -gr.range(560, 1900);
      globes.push({ x, y: Math.max(hillHeight(ctx.noise, x, z), 0) + gr.range(10, 44), z, r: gr.range(1.6, 3.0), ph: gr.range(0, 6.28), roam: gr.range(18, 50) });
    }
    for (let i = 0; i < 5; i++) { const a = (i - 2) * 0.5 + gr.range(-0.15, 0.15), r = gr.range(56, 86); globes.push({ x: Math.sin(a) * r, y: gr.range(31, 40), z: -745 - Math.cos(a) * r, r: gr.range(1.3, 1.9), ph: gr.range(0, 6.28), roam: gr.range(6, 12) }); }
    scene.add(makeGlobes(SH, globes).object);
    await ctx.yield();

    // ---- air: two dust devils far out on the sea bottom, a drifting low haze over the sand, gold motes
    const devils = [-1, 1].map((sd) => fx.makeDustDevil({ rng: sd < 0 ? S.devilA : S.devilB, position: [sd * S.devils.range(270, 330), 0, -S.devils.range(300, 400)], height: 62, radius: [2.2, 15], color: '#B4AAB4', colorTop: '#8E88B8', shadowColor: '#4A3E70',
      opacity: 0.34, sunDir: SH.uKeyDir.value, sunColor: '#E0A8C0', wander: 26, time }));
    for (const d of devils) scene.add(d.object);
    await ctx.yield();
    const haze = fx.makeMist({ rng: S.haze, count: Math.round(64 * detail), area: [300, 3.5, 520], center: [0, 2.0, -170], size: [18, 42], color: '#8E8CB4', opacity: 0.06, drift: [SH.uWind.value.x * 1.6, 0, SH.uWind.value.y * 1.6], time });
    scene.add(haze.object);
    await ctx.yield();
    const motes = fx.makeParticles({ rng: S.motes, preset: 'dust', count: Math.round(900 * detail), colors: ['#FFC46A', '#E8B8C0', '#BFD0FF'], intensity: 0.8, time });
    scene.add(motes.object);
    await ctx.yield();

    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    const size = new THREE.Vector2(), poiV = new THREE.Vector3(), poiC = new THREE.Vector3(), dA = new THREE.Vector3(), dB = new THREE.Vector3(), cv = new THREE.Vector3(), hv = new THREE.Vector3();
    const flag = ships[0], moon0 = S.moons.range(0, 0.25);
    const WU = life.water.uniforms;
    WU.uMoonColA.value.multiplyScalar(hour.moonGain * 0.4); WU.uMoonColB.value.multiplyScalar(hour.moonGain * 0.4);
    function update(dt, t, camera, u) {
      time.value = t;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); SH.uPx.value = 2 / (Math.max(camera.projectionMatrix.elements[5], 0.1) * Math.max(size.y, 1)); }
      // the fleet: a pure function of the way we have come
      const D = u * L;                                               // metres of our way flown
      SH.uG.value = D;
      const SU = sand.uniforms.uShips.value;
      for (let i = 0; i < MAX_SHIPS; i++) {
        if (i < ships.length) { const s = ships[i], q = shipXZ(s, D); SU[i].set(q[0], q[1], s.th, s.moored ? 0 : 1); } else SU[i].set(0, 99999, 0, 0);
      }
      fleet.update(dt, t, camera);
      // the moons hurry across with the flight, all the way from the entry to the portal, each visit from a point of
      // their round drawn from their own stream (near one: azimuth +22 to +4, elevation 11 to 19; far one: -12 to -8
      // at 25)
      const m = moon0 + (1 - moon0) * D / L;
      dA.copy(skyDir(lerp(11, 19, m), lerp(22, 4, m) + moonShift)); dB.copy(skyDir(25, lerp(-12, -8, m) + moonShift * 0.5));
      moons.uniforms.uDir.value[0].copy(dA); moons.uniforms.uDir.value[1].copy(dB);
      WU.uMoonA.value.copy(dA); WU.uMoonB.value.copy(dB);
      // the flame birds: along their route with the flight, settling on the drum
      for (let i = 0; i < routes.length; i++) {
        const st = canopyAt(routes[i], D, cv, hv);
        birds.uniforms.uCanopy.value[i].set(cv.x, cv.y, cv.z, st); birds.uniforms.uHead.value[i].copy(hv);
      }
      sky.update(dt, t, camera);
      shoreGlow.update(dt, t, camera);
      life.update(dt, t, camera);
      for (const d of devils) d.update(dt, t, camera);
      haze.update(dt, t, camera); motes.update(dt, t, camera);
    }

    // GAZE. Each pull is on for the whole flight in the engine's terms; how hard it pulls is a smooth function of
    // where its subject is, in metres: the point handed over lies between straight ahead and the subject.
    const eye = new THREE.Vector3(), fwd = new THREE.Vector3(), toS = new THREE.Vector3();
    const lean = (out, u, sx, sy, sz, kOf) => {
      path.pointAt(u, eye); path.posAtDist(u * L + 24, fwd).sub(eye).normalize(); toS.set(sx, sy, sz).sub(eye);
      const k = kOf(toS.x * fwd.x + toS.z * fwd.z, toS.x * fwd.z - toS.z * fwd.x);       // metres ahead of us (astern: negative), metres off our line
      toS.normalize();
      return out.copy(fwd).lerp(toS, k).normalize().multiplyScalar(40).add(eye);
    };
    // the ship we follow: the pull comes on as she nears, from 60 m ahead (four lengths: she is whole in the frame) to
    // 18 m (a length and a half: her sail stands as high as the frame), and lets go from 22 m to 2 m ahead (her
    // quarter abeam), so that we look where we are going as we pass her; the two ramps overlap, there is no hold
    const leadK = (ahead) => (1 - smoothstep(18, 60, ahead)) * smoothstep(2, 22, ahead);
    // the flame birds: most when their canopy crosses our line, falling off with its distance to either side (half at
    // 37 m, which is how far off the line it still fills a third of the view), less as it settles on the drum, and
    // none once it is abeam
    let settled = 0;
    const birdK = (ahead, off) => Math.exp(-(off * off) / (45 * 45)) * (1 - settled) * smoothstep(0, 40, ahead);
    // pace: quick over the sea; easing from 35 m short of the foot of the stairs (the wall is a cliff ahead) until we are
    // 10 m inside the door of the house; quicker again from 20 m short of the canal's mouth to the middle of the basin
    const pA = uOff(STAIR_FOOT, -35), pB = uOff(HOUSE_DOOR, 10), pC = uOff(BASIN_MOUTH, -20), pD = uOff(BASIN_MID);

    return {
      scene, path, duration: DUR,
      pace: (u) => 1.15 - 0.47 * smoothstep(pA, pB, u) + 0.32 * smoothstep(pC, pD, u),
      camera: { fov: 62, near: 0.3, far: 9000, lookAhead: 24, nearThrough: 0.3, sway: 0.6, bank: 0.5 },
      pois: [
        { at: (time_, u) => { settled = canopyAt(routes[0], u * L, poiC, hv); return lean(poiC, u, poiC.x + hv.x * 30, poiC.y + hv.y * 30, poiC.z + hv.z * 30, birdK); }, from: 0, to: 1, fade: 0.001, weight: 0.25 },
        { at: (time_, u) => { const q = shipXZ(flag, u * L); return lean(poiV, u, q[0] + tack * 1.5, 7, q[1], leadK); }, from: 0, to: 1, fade: 0.001, weight: 0.5 },
      ],
      portal: { shape: 'circle', radius: 7, color: '#CFE0FF', glow: 1, revealDistance: 260 },
      post: { exposure: hour.exposure, bloom: { strength: 0.5, radius: 0.6, threshold: 0.9 },
        grade: { saturation: 1.08, contrast: 1.05, shadowTint: '#141a40', vignette: 0.3, grain: 0.02 } },
      update,
      dispose() { sky.dispose(); },
    };
  },
};
