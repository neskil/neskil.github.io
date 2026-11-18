// Canyon of Light: a flight down a sculpted sandstone slot canyon where beams of noon light stand like
// pillars in the dust, out over a pour-off into an amphitheatre, and on to the Arch on its far rim.
//
// Layout (world space = the hero's local space): the Arch stands at the origin facing +Z. The camera
// comes down the slot from z ~ 600 with the canyon's S-curves, the last 60 m of slot run straight along
// x = 0 to the mouth at z = 200, then 200 m of level flight 22 m above the amphitheatre floor (y = 0)
// to the portal hanging in the Arch's opening. Behind the rim the land falls away to open desert.
//
// Everything rock is one sandstone: the Arch's own self-lit shader (parts/canyon-of-light.js) draws the
// slot walls, the floors, the amphitheatre cliffs, the desert and the far mesas. Bounce light in the slot
// is baked per vertex (pools of light under each beam, the sky slit, the mouth), sun and shadow in the open.
// The walls beside the camera carry real flutes (a row of vertices every 0.48 m for the lowest 19 m) and the shader
// lays crisp flowing strata over them, shaded per pixel by the direction the bounce light comes from.
// The camera climbs over the floor through the first chambers (the walls closing in, the slit of sky above) and comes down
// into the open court, where a slanting beam of sun in dusty air (a bright core that melts away to its sides, fine rays down
// the light, dust and falling grains of sand alight in it) falls beside the path onto a long hot patch of rippled sand with the ONE
// cottonwood sapling and its shadow in it, and a blade of sun picks out the petroglyphs on the wall across from it. Fallen
// banded blocks lie along the walls' feet; low waves of sand cross the floor.
//
// The hero beam stands on the route's centre line at u 0.147 and the camera flies THROUGH it: lit dust with a burning core, a
// hard but dim edge and a wide soft halo, motes blazing in it, over a lobed gold pool whose light spills onto the sand round
// it; near and inside it the dust is held down, not faded out. The chambers round it are held in deep shade on every seed
// (amber and bleached rock get less bounce there): shade is red and deep red-brown, plum only in the deepest folds, orange
// where a beam's first bounce reaches the rock. Two or three smaller pillars of the same kind stand beside the route further
// down (u 0.245, 0.492, 0.545; one of the narrow ones is closed on two visits in three), each with its pool, its halo, its
// motes and its bounce on the nearest wall, and a thread of sand trickles from a ledge beside each beam onto a small cone.
// The walls carry upright scallops across the beds (in the mesh and per pixel); at the pour-off the slit leans over and the
// floor sags into a rounded sill of sand, so the mouth is a tall curved slot.
// Twenty metres and more into the entry hall, where the walls' own shape opens the roof over the sand, ONE lesser shaft
// stands on a little over half the visits (wherever the walls leave its whole soft section 7 m of clear air from the route's line): a
// BREATH OF LIGHT, not a beam with an edge: one volume of lit dust, brightest just over its pool and thinning away upward
// into the dark, narrower above, with no side to it, the wall seen through it; plainly smaller and dimmer than the hero
// beam. Round every pool (the hero beam's, the pillars', the hall's, the lesser shaft's, the court's) the rock and the sand
// within a few metres take added warm light from it, strongest on the faces that look at the pool. That glow does NOT
// move or change (the rock's shader has no clock in it): what drifts is the DUST inside it, slowly ('glow-dust': specks
// homed in the air of the first slot and of the hall's stretch, each lit by the light that falls at its home, more of them
// where there is more light, unseen in the dark). The rock's shader walks the pools for that glow only where a pool is in
// reach: every triangle of the slot is marked at the build by its own place (aFar).
// LIFE IN THE FIRST SLOT: a party of five or six swifts of the world's own lives between the entry hall and the hero chamber
// ('swifts-entry'): each flies a closed loop laid once at the build from the walls and the route's line (low down the slot
// ALONG A WALL, 1.2 m off its rock and 2 m and more above the route's line, never nearer that line than 5.5 m in three
// dimensions; up across the slot at the entry hall; back high; through the hero beam and round), always there and always
// its own size, dark in the shade and warm where light falls on it. Two threads of sand fall at the walls 35 to 75 m in,
// from the best-lit ledge of each wall, each on a small round heap. Falling sand everywhere in the slot (threads and veils)
// is the sand's own colour lit, never white: it fades in below its ledge, swells and thins down its fall and ends in a
// soft puff of dust over its heap.
// THE HALL of slim leaning shafts (rounds 24 to 27) stands in the second slot; its stretch (the bump of the walls, its three
// shafts, their veils and heaps, and the gateposts' threads, whose ledges live's rule now finds on the walls as the hall
// has moved them) reaches from 303 to 348 m of route. Its veils have body where they cannot wash (seven sheets close
// about its line for a veil 12 m and more from the route's line, wider strands from 14 m); its heaps, the gateposts' and the first slot's threads' are
// round smooth drifts whose foot is the floor's own.
// THE BLADES OF THE HALL (its three shafts and its two gateposts) ARE SOFT WARM LIGHT ON GLOWING SAND (the mend of round 27):
// cream-gold dust with no edge (a soft core inside a wider sheath of glowing air, as wide as its 7 m of clear air allow),
// fullest a little over the pool and thinning toward the hole above, each landing in a pool as wide as its core and its
// flank together with a strong warm glow on the sand and the wall's foot round it. All of them are one draw.
//
// TWO LIVE KEYS CHANGED IN ROUND 27. THE FIRST (the designer's yes of 2026-10-09 09:14): LIVE'S PILLAR OF LIGHT AT THE
// HALL'S WAY IN (the third chamber's, u 0.492) TAKES THE HALL'S LAW. THE SECOND (the designer's yes of 2026-10-09 17:54):
// SO DOES LIVE'S FAR GATEPOST PILLAR (the one where the slot straightens, u 0.545, on the visits that have it). Live stood
// each 4.3 m from the route's line with a sheath of lit dust 8.7 m across (the far one 7.5 m), so the route ran through
// the sheath and a milky sheet or column lay over a tenth to a third of the picture for some metres of the flight. Each
// is now a leaning blade of the hall's own section, sheath and slant, on its own side of the route, 7 m and more of clear
// air from the route's whole line (7.0 m at the least for either on seeds 1 to 40), some metres on toward the hall's
// middle (the way-in post 6 to 9 m forward, the far post 7 to 11 m back), its pool, the pool's glow and its thread's heap
// kept on the sand beside it. What of live is changed, by line of this file, and nothing else of live's pillars:
//   line 909 on, the part gateBlade (new): for each of the two pillars, its pool (x, z, y, the side it stands on) and its
//     foot, section (a, b), sheath (SA, SB), turn (e1, e2) and height are set there from the walls and the route's line;
//     live set them in canyonPlan with every other pillar's. The chamber, the walls and the hall's stations are untouched.
//   lines 1647 and 1677 (slotLight): the sand under such a pool takes more of its light, more narrowly (2.3 and 10 for live's 1.5
//     and 14); the broad fill of the opening the pillar came through stays where that opening is (p.ch): live had both at the pool.
//   line 1027 (canyonBlocks): fallen blocks keep off these blades' pools by their own girth; live used 3.4 m for every pillar.
//   line 1898 on (canyonLight): their pools are drawn POOL_A by POOL_B times the blade's core with the spill BLADE_SPILL and
//     the glow BLADE_GLOW (live: the pillar's own section, 0.95 and 0.9, and no glow).
//   line 2273 on (canyonAir): their two volumes of lit dust are no longer drawn there with the pillars' shader; line 2308 on
//     (hallAir): they are drawn with the hall's shafts, in the hall's one draw and by the hall's look (BLADE_COL,
//     HALL_LOOK), with the blade's height and the hall's faded ends. The streams keep their draws.
//   line 2431 (canyonSand): the thread of sand beside each looks for its ledge from the blade's station, not the pillar's
//     old one; line 2443: that thread's cone is drawn as the hall's heaps are (canyonSandDrawn).
// Its pool on the sand, the pool's glow, its motes and its light on the rock round it follow from the same place.
// The slot's rock carries shallow scoops in patches (the beds' lines bow round each). Where a wall is near enough for a pixel
// to resolve them, each of its sets (a metre thick) is drawn as its own beds, a hand to a forearm thick: crisp steps of tone,
// hard pale beds and soft red ones of uneven thickness that sweep down to the set's foot or lean across it, now and then a
// massive bed with nothing in it, a soft shade under a hard bed's nose (never a line of light); far off they melt back into
// the set's broad bands. Desert varnish runs DOWN the walls across the beds: dark curtains that hang from a height and fray
// into threads, and narrow tears, some metres apart and uneven, set out by the metres along each wall and above the floor.
// Between the hero chamber and the court a veil of sand falls from a ledge through a thin blade of sun, and a chockstone is
// wedged high between the walls.
//
// The amphitheatre's floor is slickrock and sand (drawn in the rock's shader from the lie of the ground alone): banded
// benches stepping down toward a dry wash that winds from under the pour-off to the rim, each step with its lit or shaded
// riser, sand drifted at the feet of the steps and the cliffs and lying in tongues down the wind with small dunes on them,
// patches of dark varnished pavement; blocks fallen from the cliffs lie within some tens of metres of the cliffs' feet all
// the way round. Beyond the rim, behind live's mesas, four ranks of buttes, spires and mesas stand on bearings round the Arch
// from a few hundred metres out to the plateau's wall, each rank paler and bluer than the one before; the desert between
// them is red earth, dark flats, dune fields and a dry river's pale bed.
//
// Every pillar and the court's beam are lit dust (soft across, streaked, held to a gold haze from inside and close by); thin blades of sun stand
// along the slot too, each where the slot widens a little for it. Swifts of the world's own stream up the slot from the mouth
// toward the eye and wheel round the three hoodoos, which stand beside the route's swing and throw their shadows per pixel.
// The sapling is a slender cottonwood of trembling leaves in the court's shaft; the petroglyphs are pecked through varnish in
// the rock's own shader under an upright blade of sun; the sky over the desert keeps live's thin drifting cloud; the lip of
// the pour-off is a clean worn sill of slickrock, rounded, with sand spilling over it; the trickles are broken veils of grains, never a line.
// THE KIT'S FLOCKS, the cure of a fault in live (the owner's rule texts R, T and U): each of the kit's three calls could come within 2.0 m of our line. The swifts darting down the slot ahead of us (an escort, a loose flock) STAY NEAR BY THE DESIGNER'S WORD and are laid anew by their own numbers, with no keepClear: spread 1.3, 1.28, 18 (live 2.6, 3.2, 18), wander 0.3, 0.3, 1.2 (live 1.6, 2.2, 5), maxSigma 3 and the course 5.8 m over our line (was 2.2), so that the box of three scatters with the wander and the largest body stays 2.0 m and more off the line and off the eye on every deal, and no bird's box enters the rock at a station where live's does not.
// The ravens riding the thermal (the soar form, where maxSigma holds nothing and keepClear is not to be used) are laid by their own numbers: the centre 42 m up (was 27), height 3 (was 5), soarLift 5 (was 8), spread 30, 4, 30 (live: the crows' own 30, 10, 30) and the crows' own wander 4, 2, 4 written out. The swifts wheeling over the amphitheatre (a low wheel) are as live and still touch the line: that call is left for the kit's per-bird clearing.
// Least from the flown line on forty seeds: the slot's swifts 2.68 m and from the eye 2.76 m (live: touching, both); the ravens 3.56 m (live: touching); the wheel touching, as live. The count rests on maxSigma in live's kit and on each call's own numbers.
//
// Per visit (ctx.vary): golden hours lower and warm the sun; density thins or thickens motes and swifts; mood sets
// how dusty the air is; one visit in eight a dust devil walks across the amphitheatre toward the Arch.
import * as THREE from 'three';
import { makePath, makeRng, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as fx from '../kit/fx.js';
import * as F from '../kit/fauna.js';
import * as flora from '../kit/flora.js';
import { makeWaterfall } from '../kit/water.js';
import { buildHero, computeNormalsInSteps, boundingSphereInSteps } from '../parts/canyon-of-light.js';

const BRIEF_PALETTE = ['#f7e3c0', '#ff9d4d', '#d95f2b', '#8f2f1e', '#4a1a2c', '#1e0f1c', '#6fd6ff'];
const FLOOR_DROP = 7.5;        // slot floor below the camera
const FOOT_W = 5.2;            // half width of the slot at its floor
const HB = 8;                  // height of the keyhole's belly above the floor
const CLEAR = 6.8;             // nothing solid nearer the path than this
const CLEAR_SOFT = 1.5;        // relief within this of the limit is compressed, not cut
const AMPH_C = 85, AMPH_R = 118;   // amphitheatre: centre z and radius of its back wall
const DESERT_Y = -57;
// the hall's walls above the belly: how much of the hall's own standing-back a wall keeps h metres above the sand (none at the
// belly, all of it from some 15 m to 24 m up, none again where the roof closes to the hole)
const hallRise = (h) => smoothstep(HB, HB + 7, h) * (1 - smoothstep(24, 38, h));
// the half width of the slot between its walls hF metres above the sand at a station: the keyhole's own section (its belly at
// the camera's height, the slit above), with the hall's standing-back where the station has one
const slotHalfW = (t, hF) => { const fW = FOOT_W + t.hallF; return hF <= HB ? fW + (t.belly - fW) * Math.pow(Math.sin(clamp(hF / HB, 0, 1) * Math.PI / 2), 0.8) : t.topW + (t.belly - t.topW) * (1 - smoothstep(0, 1, (hF - HB) / t.Hn)) + (t.hallU > 0 ? t.hallU * hallRise(hF) : 0); };
// metres of air between a point of a shaft's section plane (p1 along the section's long axis, p2 along its short one) and the
// ellipse of half axes A and B round the axis: nothing for a point inside it (the rim is walked in a quarter, by symmetry)
// (the warm glow round a pool, its strength by the pool's kind: the hero beam's, a pillar's or a blade's, the hall's shafts', the
// lesser shafts', the court's)
const GLOW = [1.1, 0.9, 0.85, 0.8, 0.6];
// THE BLADES OF THE HALL (its three shafts and its two gateposts), the mend of round 27. Their soft sheath of glowing air: how
// many times the core's long and short half axes it reaches where the clear air allows (it was 1.25 and 1.4: a hard pale pole
// from afar; the long side is the one seen from the court). Their pool on the sand: the light of the core AND of its soft flank lands, so the pool is POOL_A and POOL_B times
// the core's half axes (the rock's shader draws it a third larger again, lobed), with a wider spill and a stronger glow round it.
const SHEATH_A = 1.7, SHEATH_B = 2.4, POOL_A = 1.12, POOL_B = 2.0, BLADE_GLOW = 1.25, BLADE_SPILL = [0.7, 1.0];
const ellGap = (p1, p2, A, B) => {
  p1 = Math.abs(p1); p2 = Math.abs(p2);
  if (p1 * p1 / (A * A) + p2 * p2 / (B * B) <= 1) return 0;
  let m = 1e9;
  for (let i = 0; i <= 24; i++) { const th = i / 24 * Math.PI / 2, g = Math.hypot(p1 - A * Math.cos(th), p2 - B * Math.sin(th)); if (g < m) m = g; }
  return m;
};

export default {
  id: 'canyon-of-light',
  name: 'Canyon of Light',
  category: 'wilderness',
  weirdness: 0.06,
  async build(ctx) {
    await ctx.yield();                                            // hand the page back before anything is built: the module has only just been read
    return buildCanyon(ctx);                                      // (the builder below is a row of parts, each a function of its own: the browser makes each ready on its first call, after a hand-back)
  },
};

// The builder is cut into parts, each a function of its own at the top of the module, run one after another and sharing one
// state object: the browser makes a function ready on its first call, so each part is made ready after a hand-back of its own
// and no one call stalls the world on screen for the whole builder. Each part takes the names it reads from the state and
// leaves there the names later parts read; the order of every statement, and of every random draw, is the one it always was.
async function buildCanyon(ctx) {
    const job = {};
    await ctx.yield();
    await canyonPlan(ctx, job);
    await ctx.yield();
    await canyonWalls(ctx, job);
    await ctx.yield();
    await hallShafts(ctx, job);
    await ctx.yield();
    await gateBlade(ctx, job);
    await ctx.yield();
    await canyonBlocks(ctx, job);
    await ctx.yield();
    await slotShafts(ctx, job);
    await ctx.yield();
    await canyonPlain(ctx, job);
    await ctx.yield();
    await canyonLight(ctx, job);
    await ctx.yield();
    await canyonAir(ctx, job);
    await ctx.yield();
    await hallAir(ctx, job);
    await ctx.yield();
    await canyonSand(ctx, job);
    await ctx.yield();
    await hallVeils(ctx, job);
    await ctx.yield();
    await canyonSandDrawn(ctx, job);
    await ctx.yield();
    await slotLife(ctx, job);
    await ctx.yield();
    await canyonLife(ctx, job);
    await ctx.yield();
    return canyonFlight(ctx, job);
}

async function canyonPlan(ctx, job) {
    await ctx.yield();                                            // (.. and once more now that it is ready, before the first line of it runs)
    // Y() is the engine's own hand-back (it only waits for a frame when a few milliseconds have passed since the last one),
    // asked for inside every loop; a world may not read a clock of its own.
    const Y = () => ctx.yield();
    const yctx = { yield: Y };
    const N = ctx.noise;
    const scene = new THREE.Scene();
    const V = ctx.rng.fork('variety');
    // the hints every world is given: the viewer's hour, how busy, the mood of the air, and one visit in eight a rare event
    const vary = ctx.vary || {}, lowSun = vary.hour === 'golden' || vary.hour === 'dawn';
    const busy = clamp(vary.density ?? 1, 0.7, 1.3) * (ctx.quality?.detail ?? 1), mood = clamp(vary.mood ?? 0.5, 0, 1), rare = !!vary.rare;

    // ------------------------------------------------------------------ per-seed character
    const flip = V.sign();                                        // which way the first bend turns
    const amp = V.range(0.82, 1.1);                               // how hard the canyon swings
    // (golden hours: the sun stands lower and warmer, the beams rake across the slot instead of standing in it)
    const sunSide = V.sign(), sunAz = V.range(28, 58) * Math.PI / 180, sunEl = (V.range(55, 66) - (lowSun ? 13 : 0)) * Math.PI / 180;
    const V2 = makeRng('canyon-of-light:hour:' + ctx.seed);       // a second stream, so the layout above keeps its draws
    const hueShift = lerp(-0.022, 0.022, (V.range(-0.004, 0.026) + 0.004) / 0.03), satShift = V.range(-0.07, 0.04);   // rose Wingate .. amber-orange Navajo sandstone (never yellow)
    const bleach = V2.range(-0.05, 0.075);                        // deep red rock .. pale sun-bleached cream
    const warm = clamp(0.55 * V2() + 0.45 * mood + (lowSun ? 0.25 : 0), 0, 1);   // how dusty and warm the air is
    const dropShaft = V2.int(0, 2);                               // which of the narrow shafts is closed this visit (0 = none)
    const beamGain = [0, 1, 2, 3, 4, 5].map(() => V2.range(0.82, 1.18));
    const swing = V2.sign();                                      // which way the route swings out over the amphitheatre
    const windy = V();                                            // 0 still air .. 1 gusty
    const cirrus = V.range(0.34, 0.52);
    const nSwifts = Math.round(V.int(16, 34) * busy), nRavens = V.chance(0.3) ? 2 : 1;
    const chW = [V.range(12.5, 14.5), V.range(13.2, 15), V.range(12.5, 14)];   // chamber half widths
    const o1 = V.range(0, 100), o2 = V.range(0, 100);
    // cream, orange and red-orange take the seed's hue, saturation and bleach; the deep red and the plum of the folds stay
    // dark and never turn toward magenta, whatever the seed
    const palette = BRIEF_PALETTE.map((h, i) => {
      const c = new THREE.Color(h);
      if (i < 3) c.offsetHSL(hueShift * (hueShift > 0 ? (i === 0 ? 0.4 : 1 - 0.7 * smoothstep(0.015, 0.06, bleach)) : 1), i > 0 && bleach > 0.015 ? Math.max(satShift, 0) : satShift, bleach * (i === 0 ? (bleach > 0 ? 0 : 0.35) : bleach < 0 ? 1 : i === 1 ? 0.6 : 0.3));   // (a pale seed keeps its orange and its red beds: amber, never one yellow)
      else if (i < 6) c.offsetHSL(Math.max(hueShift, -0.006), Math.min(satShift, 0), 0);
      return '#' + c.getHexString();
    });
    const ce = Math.cos(sunEl);
    const SUN = new THREE.Vector3(-Math.sin(sunAz) * sunSide * ce, Math.sin(sunEl), -Math.cos(sunAz) * ce).normalize();

    // ------------------------------------------------------------------ the path
    const yAt = (z) => 22 + 7 * smoothstep(262, 600, z);
    const SL = [[596, 3], [560, 0], [526, -10], [492, -19], [458, -8.5], [424, 6], [392, 14], [362, 10], [338, 0], [316, -8], [294, -7], [276, -1.5]];
    // (the floor keeps the grade of yAt; the camera climbs over it through the first chambers, the walls closing in and the
    // slit of sky above, then comes down into the open court: the first third is not one view at one height)
    const LIFT = [0, 0.5, 3.6, 5.2, 4.6, 2.6, 0.8, 0, 0, 0, 0, 0];
    const pts = SL.map(([z, x], i) => [flip * (x * amp + (i > 1 && i < 10 ? V.range(-1.6, 1.6) : 0)), yAt(z) + LIFT[i], z]);
    pts.push([0, 22, 262], [0, 22, 231], [0, 22, 200], [0, 22, 189]);
    // out of the mouth the route swings wide and low over the sand, round a hoodoo, then banks back and climbs to meet the
    // portal head-on: the Arch crosses the frame and grows, and the plain passes close under the eye
    pts.push([swing * 8, 20.6, 170], [swing * 23, 14.8, 148], [swing * 29.5, 10.6, 122], [swing * 25.5, 10.8, 99], [swing * 13, 15.6, 79], [swing * 2.5, 20.6, 63], [0, 22, 48], [0, 22, 24], [0, 22, 0]);
    await Y();
    const path = makePath(pts);
    await Y();
    const L = path.length, duration = 46;
    const tv = new THREE.Vector3(), tv2 = new THREE.Vector3();
    let dMouth = L * 0.5;
    while (dMouth < L && path.posAtDist(dMouth, tv).z > 200) dMouth += 0.2;
    const uMouth = dMouth / L;
    await Y();

    // ------------------------------------------------------------------ sky, light, air
    // The dome's 256x256 noise texture: the kit's own pixels (makeSkyNoise in src/kit/sky.js: the same generator, the same
    // seed, the same texture settings), made here a few rows at a time and handed to makeSky as its `noiseTexture`, so that
    // making the sky is no longer one long step of the build.
    const npx = new Uint8Array(256 * 256 * 4);
    {
      const S = 256; let a = 0x2545f491;
      const r = () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) & 255; };
      for (let i = 0; i < S * S; i++) { npx[i * 4] = r(); npx[i * 4 + 2] = r(); npx[i * 4 + 3] = 255; if (i % 4096 === 4095) await Y(); }
      for (let y = 0; y < S; y++) { for (let x = 0; x < S; x++) npx[(y * S + x) * 4 + 1] = npx[(((y + 17) & 255) * S + ((x + 37) & 255)) * 4]; if (y % 32 === 31) await Y(); }
    }
    const skyNoise = new THREE.DataTexture(npx, 256, 256, THREE.RGBAFormat);
    skyNoise.wrapS = skyNoise.wrapT = THREE.RepeatWrapping; skyNoise.magFilter = skyNoise.minFilter = THREE.LinearFilter; skyNoise.generateMipmaps = false; skyNoise.colorSpace = THREE.NoColorSpace; skyNoise.needsUpdate = true;
    await Y();
    const sky = makeSky({
      noiseTexture: skyNoise, rng: ctx.rng, preset: 'day', zenith: '#123482', mid: '#1f4fa8', horizon: '#4a7cc6', horizonPow: 7, ground: '#c7a17c',
      sunDirection: SUN.toArray(), sunColor: lowSun ? '#ffe4bd' : '#fff3dd', sunIntensity: 12, sunGlow: 0.5,
      clouds: false, clouds2: { coverage: cirrus, stretch: 1, opacity: 0.5, scale: 0.8 },
    });
    scene.add(sky.object);
    await Y();
    // Kit workaround: the dome is two 16-triangle fans whose apexes sit exactly at (0, +-1, 0). With a dead-level camera
    // (the straight final approach) an apex lands on the w = 0 plane and the whole fan shades as its rim: a flat,
    // cloudless horizon colour instead of deep blue. The shader only uses normalize(position), so fans with the apex
    // nudged off the axis draw the identical sky and never meet that plane on this world's level headings.
    {
      const fan = (apexY) => {
        const n = 16, p = [0.043, apexY, 0.071], ix = [];
        for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; p.push(Math.cos(a), -0.045, Math.sin(a)); ix.push(0, 1 + i, 1 + ((i + 1) % n)); }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setIndex(ix); return g;
      };
      const low = sky.object.children[0];
      if (sky.object.geometry?.attributes?.position?.count === 17 && low?.isMesh && low.geometry?.attributes?.position?.count === 17) {
        sky.object.geometry.dispose(); sky.object.geometry = fan(1);
        low.geometry.dispose(); low.geometry = fan(-1);
      }
    }
    const fogColor = sky.fogColor.clone().lerp(new THREE.Color('#e9c7a2'), 0.14 + 0.14 * warm);
    scene.fog = new THREE.FogExp2(fogColor, 0.00042 + 0.00012 * windy);
    await Y();
    const rig = makeLightRig(sky, { bounce: 0.5 });
    scene.add(rig.object);
    await Y();

    // ------------------------------------------------------------------ the hero: the Arch (at the origin)
    const hero = await buildHero(ctx, { palette, sunDir: SUN.toArray(), sunColor: lowSun ? '#ffe2b8' : '#fff0d8', portalColor: palette[6], portalGlow: 0.5, shimmer: 0.34 + 0.2 * windy, swifts: Math.round(nSwifts * 0.5), yield: Y });
    scene.add(hero.object);
    const rockMat = hero.rockMaterial, sculpt = hero.sculpt;
    await Y();

    // ------------------------------------------------------------------ plan of the open ground
    // escarpment line of the mesa beyond the amphitheatre's side walls: z as a function of |x|
    const ESC = [[126, -27], [139, -27], [170, -24], [240, -10], [340, 10], [480, 20], [650, 60], [900, 140], [5000, 900]];
    const escZ = (ax) => {
      if (ax <= ESC[0][0]) return ESC[0][1];
      for (let i = 1; i < ESC.length; i++) if (ax <= ESC[i][0]) return lerp(ESC[i - 1][1], ESC[i][1], (ax - ESC[i - 1][0]) / (ESC[i][0] - ESC[i - 1][0]));
      return 900;
    };
    // metres inside the mesa's rock (negative in the amphitheatre and the open desert)
    const sdRock = (x, z) => {
      const ax = Math.abs(x);
      const dDisc = Math.sqrt(x * x + (z - AMPH_C) * (z - AMPH_C)) - AMPH_R;
      const dBox = Math.max(ax - 124, z - AMPH_C);
      return Math.min(dDisc, dBox, z - escZ(ax));
    };
    // baked sun: 1 where the mesa does not stand between the point and the sun
    const sunVis = (x, y, z) => {
      let deep = -9;
      for (let k = 0; k < 15; k++) {
        const t = 3 + k * 6.5, qy = y + SUN.y * t;
        if (qy > 70) break;
        const s = Math.min(sdRock(x + SUN.x * t, z + SUN.z * t), 64 - qy);
        if (s > deep) deep = s;
      }
      return 1 - smoothstep(-2.5, 2.5, deep);
    };

    // ------------------------------------------------------------------ pools of light in the slot
    // each is a place where the slot opens to the sky: a chamber with a standing beam, or a narrow shaft
    const U_COURT = 0.384;
    const pools = [
      // THE HERO BEAM: one hard shaft of sun in a chamber of its own beyond the entry hall, standing to the sun's side of the
      // path under a slit that leans over to it. Everything round it is in deep shade; it burns a pool onto the sand and its
      // bounce climbs the nearest walls. (No other shaft stands in the first chambers: the next one is a thin blade at the turn.)
      // (the brief's "0.15: pass through the beam, dust blazing": its foot stands on the route's centre line and the camera flies INTO it)
      { u: 0.147, chamber: -1, power: 1, r: 2.1, hero: true },
      { u: 0.178, chamber: 0, power: 0.42, r: 1.3, R: 11, glow: true },             // the first chamber after it: the slit's own light only
      // (pillar: a standing pillar of the hero's kind, smaller: bright core, soft halo, lit dust, a shaped pool, bounce on the nearest wall)
      { u: 0.245, chamber: -1, power: 0.5, r: 1.2, thin: true, pillar: 0.78 },
      { u: U_COURT, chamber: 1, power: 1.5, r: 2.4, R: 19, court: true },   // the open court: no pillar here but a slanting sunbeam (below)
      { u: 0.492, chamber: 2, power: 0.82, r: 2.0, R: 12, thin: true, pillar: 0.9 },   // (a pillar of sun beside the route: it lights the sand at its foot and the rock within a few metres, not the whole chamber)
      { u: 0.545, chamber: -1, power: 0.72, r: 1.3, R: 11, pillar: 0.78 },             // and one more where the slot straightens
    ];
    if (dropShaft === 1) pools.splice(2, 1); else if (dropShaft === 2) pools.splice(5, 1);
    pools.forEach((p, i) => { p.power *= beamGain[i]; });
    const HLEAN = 0.08;                                           // how far the hero shaft leans out to its side, per metre of height
    const beamLean = lowSun ? 0.3 : 0.24;                         // (a shaft that slants reads as sunlight; one that stands plumb reads as falling sand)
    const beamDir = new THREE.Vector3(-SUN.x * beamLean, -1, -SUN.z * beamLean).normalize();   // near-vertical pillars, leaning with the sun
    const right = (d, out) => { path.tangentAtDist(d, out); const x = -out.z, z = out.x, l = Math.hypot(x, z) || 1; return out.set(x / l, 0, z / l); };
    let sL = 1, hs = 1;                                           // which side of the path the sun stands on at the court, and at the hero beam
    for (const p of pools) {
      p.d = p.u * L;
      if (p.hero) {
        // (it stands on the side of its chamber that the entry looks straight at: from the first frame the whole shaft is in view
        // down the hall, never hidden behind the waist's wall. The slit above leans over to that side.)
        const e0 = path.posAtDist(6, new THREE.Vector3()), t0 = path.tangentAtDist(6, new THREE.Vector3()), hp = path.posAtDist(p.d, new THREE.Vector3());
        const tt = (hp.x - e0.x) * t0.x + (hp.z - e0.z) * t0.z; right(p.d, tv2);
        hs = (e0.x + t0.x * tt - hp.x) * tv2.x + (e0.z + t0.z * tt - hp.z) * tv2.z >= 0 ? 1 : -1;
      }
      // (the court's patch of sun lies well to the side away from the sun and a little beyond the court's middle: the shaft
      // climbs toward the sun, and at the camera's height it must still pass some metres beside the path, never across it.
      // The others stand close to the centre line.)
      if (p.court) { path.posAtDist(p.d, tv); right(p.d, tv2); sL = SUN.x * tv2.x + SUN.z * tv2.z >= 0 ? 1 : -1; }
      const dP = p.d + (p.court ? 9 : 0);
      path.posAtDist(dP, tv); right(dP, tv2);
      const jit = p.court ? 0 : p.chamber >= 0 ? V.range(-2, 2) : V.range(-1, 1);
      // (the hero beam's foot is on the centre line, within about a metre, set so that the leaning shaft crosses the route at the
      // camera's own height: the camera flies through the middle of it, never past its edge. The smaller pillars stand some
      // four metres to the side away from the sun, so each leans back over the route toward the slit it comes through and the
      // camera passes close beside it)
      const sSun = SUN.x * tv2.x + SUN.z * tv2.z >= 0 ? 1 : -1;
      const side = p.court ? -sL * 8.2 : p.hero ? 0.3 * jit - hs * HLEAN * 0.8 * (tv.y - (yAt(tv.z) - FLOOR_DROP + 0.3)) : p.pillar ? -sSun * (4.3 + 0.25 * jit * (p.chamber >= 0 ? 0.5 : 1)) : jit;
      p.x = tv.x + tv2.x * side; p.z = tv.z + tv2.z * side; p.y = yAt(tv.z) - FLOOR_DROP + 0.3;
      p.cy = tv.y; p.dP = dP; p.side = side;
    }
    // Thin blades of sun through the ribbon of sky (the slot widens a little for each, as it does for the other narrow
    // shafts: sun reaches the floor only where the slot widens): one beyond the hero chamber, so the squeeze after the hero beam has a lit place
    // ahead of it, and one along the last straight before the mouth, some fifty metres short of it. Each is
    // a small pillar of the same kind (lit dust, a drifting pool, bounce on the nearest rock, a trickle of sand beside it).
    // (their own streams: the layout's stream keeps its draws)
    {
      const dCourt = U_COURT * L;
      const at = [['hero', (R) => pools.find((q) => q.hero).d + R.range(34, 40)], ['mouth', (R) => dMouth - R.range(48, 53)]];   // (no blade in the last 31 m before the mouth: the first view of the Arch is clear)
      for (const [name, place] of at) {
        const XR = makeRng('canyon-of-light:blade:' + name + ':' + ctx.seed), d = place(XR);   // (a stream of its own for each blade, by its name: a blade left out moves no other blade's deal; both are dealt anew once by this)
        const p = { u: d / L, d, dP: d, chamber: -1, power: XR.range(0.5, 0.64), r: 1.0, thin: true, pillar: XR.range(0.56, 0.64), blade: true };
        if (Math.abs(d - dCourt) < 70 || pools.some((q) => q.pillar && Math.abs(q.d - d) < 11)) continue;   // (never in the court, never on top of a pillar)
        path.posAtDist(d, tv); right(d, tv2);
        const sSun = SUN.x * tv2.x + SUN.z * tv2.z >= 0 ? 1 : -1, side = -sSun * (3.5 + 0.5 * XR());
        p.x = tv.x + tv2.x * side; p.z = tv.z + tv2.z * side; p.y = yAt(tv.z) - FLOOR_DROP + 0.3; p.cy = tv.y; p.side = side;
        pools.push(p);
      }
    }
    // the hero beam's own frame: the way it climbs (leaning out to the sun's side and a little along the canyon), and the
    // two axes of its section, long along the canyon like the slit it comes through
    const pH = pools.find((p) => p.hero), heroUp = new THREE.Vector3(), heroE1 = new THREE.Vector3(), heroE2 = new THREE.Vector3(), heroT = new THREE.Vector3();
    {
      path.tangentAtDist(pH.d, tv); const tl = Math.hypot(tv.x, tv.z) || 1; heroT.set(tv.x / tl, 0, tv.z / tl); right(pH.d, tv2);
      const ka = clamp(0.24 * (SUN.x * heroT.x + SUN.z * heroT.z), -0.1, 0.1);
      heroUp.set(tv2.x * hs * HLEAN + heroT.x * ka, 1, tv2.z * hs * HLEAN + heroT.z * ka).normalize();
      heroE1.copy(heroT).addScaledVector(heroUp, -heroT.dot(heroUp)).normalize(); heroE2.crossVectors(heroUp, heroE1).normalize();
    }
    // the shafts of the hero beam: the main one and a splinter beyond it (foot, half length along the canyon, half width)
    const HSH = [
      { x: pH.x, y: pH.y, z: pH.z, a: 3.2, b: 1.95, k: 1 },
      { x: pH.x + heroT.x * 4.4 + tv2.x * hs * 4.3, y: pH.y, z: pH.z + heroT.z * 4.4 + tv2.z * hs * 4.3, a: 1.7, b: 0.95, k: 0.8 },   // (a soft ray beside it, never a plank)
    ];
    // the smaller pillars: each its own frame (leaning with the sun; the section long along the canyon, like the slit above)
    const beamUp0 = new THREE.Vector3(SUN.x * beamLean, 1, SUN.z * beamLean).normalize();
    const PIL = [];
    for (const p of pools) if (p.pillar) {
      right(p.dP, tv2); path.tangentAtDist(p.dP, tv);
      const e1 = new THREE.Vector3(tv.x, 0, tv.z).normalize(); e1.addScaledVector(beamUp0, -e1.dot(beamUp0)).normalize();
      const e2 = new THREE.Vector3().crossVectors(beamUp0, e1).normalize();
      PIL.push({ p, x: p.x, y: p.y, z: p.z, a: 2.3 * p.pillar, b: 1.3 * p.pillar, k: p.pillar, e1, e2 });
    }
    const heroBump = (d, w) => { const t = (d - pH.d) / w; return Math.exp(-t * t); };
    // how far the first chambers are held in deep shade (1 from the entry to the last bend before the court, 0 from there on)
    const darkAt = (d) => 1 - smoothstep(U_COURT * L - 104, U_COURT * L - 64, d);
    const bendK = (d) => smoothstep(U_COURT * L + 44, U_COURT * L + 84, d);   // the S-bends beyond the court: less fill, so the walls grade from orange by the light to red in the folds
    // light flooding in from the mouth
    const mouthPool = { x: 0, y: 24, z: 197, power: 1.3 };
    const chamberBump = (d, k) => { const p = pools.find((q) => q.chamber === k); const t = (d - p.d) / (k === 1 ? 17 : 13); return Math.exp(-t * t); };
    // The open court (the second chamber): for some 80 m the walls stand only 20 to 26 m high and lean back, so the roof is a
    // slice of deep blue sky; one hard beam of sun comes over the low rim to the floor, the wall under the sun is in blue shade
    const dC = U_COURT * L;
    const court = (d) => smoothstep(dC - 62, dC - 30, d) * (1 - smoothstep(dC + 40, dC + 66, d));
    const coolZone = (d) => smoothstep(dC - 66, dC - 30, d) * (1 - smoothstep(dC + 60, dC + 100, d));
    const courtCot = Math.min(Math.cos(sunEl) / Math.sin(sunEl), 0.5), sunHl0 = Math.hypot(SUN.x, SUN.z) || 1;
    const courtD = new THREE.Vector3(SUN.x / sunHl0 * courtCot, 1, SUN.z / sunHl0 * courtCot).normalize();   // where the court's beam comes from
    const shaftBump = (d) => { let s = 0; for (const p of pools) if (p.chamber < 0) { const t = (d - p.d) / 9; s += Math.exp(-t * t); } return s; };

    // distance from a point to a beam's axis (only below its source)
    const beamVis = (x, y, z) => {
      let v = 0;
      for (const p of pools) {
        const dx = x - p.x, dy = y - p.y, dz = z - p.z;
        if (dx * dx + dz * dz > 400) continue;
        const al = dx * beamDir.x + dy * beamDir.y + dz * beamDir.z;
        const px = dx - beamDir.x * al, py = dy - beamDir.y * al, pz = dz - beamDir.z * al;
        const r = Math.sqrt(px * px + py * py + pz * pz), rr = p.r * (1 + 0.25 * N.n2(x * 0.4 + p.d, z * 0.4));
        v = Math.max(v, 1 - smoothstep(rr * 0.75, rr * 1.2, r));
      }
      return v;
    };

    // ------------------------------------------------------------------ stations: the foot line of each wall
    // In the slot the foot line is the path's centre line offset sideways; past the mouth it swings out
    // round the amphitheatre, down its side walls, round a prow at the far rim and away along the mesa's
    // escarpment. One ribbon of rock per side follows it: keyhole section in the slot, stepped cliff outside.
    const STEP = 1.4;
    // THE HALL (the third chamber made a place of its own). Between the end of the open court (where court() above has fallen
    // to nothing, 66 m past the court's middle) and the start of the straight before the mouth (its 62 m, z 262 to z 200) the
    // slot opens into one tall round hall: the walls stand back from the route's line at the foot and at the belly, they
    // close in higher up than anywhere else in the slot, and over the hall's heart the slit widens to a hole of sky that the
    // hall's shafts come down through. The route's line is not moved. Everything of the hall is a bump of its own along the
    // slot, by the metres along it: exactly nothing two stations inside either end of that stretch and beyond, so the
    // passages into it and out of it are the slot as it was. The slot's own pillars that stand in that stretch (the third
    // chamber's, in the way in; the one where the slot straightens, in the way out, on the visits that have it) are the
    // hall's gateposts: the bump ends two and a half stations short of each, so each stands on the floor it stood on, at the
    // foot of the walls it stood between, and the light it throws down the passages is what it was.
    const dHall0 = dC + 66, dHall1 = dMouth - 62;
    let hallFrom = dHall0 + 2 * STEP, hallTo = dHall1 - 2 * STEP;
    for (const h of PIL) {
      const dp = h.p.dP;
      if (dp < dHall0 - 4 * STEP || dp > dHall1 + 4 * STEP) continue;
      if (dp < 0.5 * (dHall0 + dHall1)) hallFrom = Math.max(hallFrom, dp + 2.5 * STEP); else hallTo = Math.min(hallTo, dp - 2.5 * STEP);
    }
    const dHallC = 0.5 * (hallFrom + hallTo), hallHalf = 0.5 * (hallTo - hallFrom);
    const hallT = (d) => Math.min(1, Math.abs(d - dHallC) / hallHalf);
    const hallW = (d) => { const t = hallT(d), t2 = t * t, q = 1 - t2 * t2 * t2; return q * q; };   // the hall's plan: round, its walls turning in at both ends
    const hallK = (d) => { const t = hallT(d), q = 1 - t * t * t * t; return q * q; };   // the hall's heart: the hole overhead, the height
    right(dHallC, tv2);
    const hallSun = SUN.x * tv2.x + SUN.z * tv2.z >= 0 ? 1 : -1;  // which side of the route the sun stands on at the hall
    const HALL_FOOT = 9.5, HALL_BELLY = 9.5, HALL_UP = 2.5, HALL_TOP = 5, HALL_HN = 14, HALL_LIT = 25;   // metres the hall adds at its heart: half width at the floor and at the belly, half width of the hole, height of the closing-in
    const slotSt = [];
    for (let d = -10; ; d += STEP) {
      const dd = Math.min(d, dMouth);
      path.posAtDist(dd, tv); right(dd, tv2);
      const toMouth = dMouth - dd;
      const flare = 1 - smoothstep(0, 28, toMouth);
      // the entry chamber: wide enough that the previous world's portal (a 14-20 m disc at the entry point,
      // seen a little off-axis) opens into air on every side, never into rock
      const ent = 1 - smoothstep(8, 44, dd), hb = heroBump(dd, 10.5), hbL = heroBump(dd, 15);   // (a waist between the entry hall and the hero beam's chamber)
      const bump = Math.max(chamberBump(dd, 0), chamberBump(dd, 1), chamberBump(dd, 2), ent);
      const cb = [chamberBump(dd, 0), chamberBump(dd, 1), chamberBump(dd, 2)], which = cb.indexOf(Math.max(...cb));
      const shaft = shaftBump(dd);
      const belly = 9.0 + 0.75 * N.n2(dd * 0.021 + o1, 3.3) + (Math.max(chW[which], 9.6) + (which === 1 ? 2.2 : 0) - 9.0) * Math.max(chamberBump(dd, which), 0) + 7.4 * ent + 1.9 * shaft * (1 - ent) + 3.4 * hb * (1 - ent) + 1.5 * flare;
      slotSt.push({
        d: dd, cx: tv.x, cy: tv.y, cz: tv.z, rx: tv2.x, rz: tv2.z, ct: court(dd), cool: coolZone(dd),
        yFloor: yAt(tv.z) - FLOOR_DROP + 0.5 * N.n2(dd * 0.03, o2) - 0.8 * bump,
        belly,
        // (after the hero beam the gaze climbs into the slit: there it is a ribbon of sky a few metres wide, not a hairline crack)
        topW: 1.55 + 0.75 * N.n2(dd * 0.031 + o2, 9.1) + 2.4 * bump + 1.6 * ent + 1.3 * shaft + 1.0 * hb + 3.0 * flare + 1.1 * smoothstep(pH.d - 6, pH.d + 10, dd) * (1 - smoothstep(pH.d + 44, pH.d + 70, dd)),
        // (over the hero beam the slit leans right out to the beam's side, so the shaft really comes down through it and the far wall hangs over the path)
        lean: lerp((4.4 * N.n2(dd * 0.017 + o1, 5.5) + 2.2 * N.n2(dd * 0.052, 7.7 + o2)) * (1 - 0.75 * bump) * smoothstep(8, 55, toMouth) + flip * 4.6 * (1 - smoothstep(4, 46, toMouth)), hs * 38 * HLEAN + pH.side, hbL),   // (at the mouth the slit leans over: the opening is a tall curved slot, never a plumb cut)
        Hn: 25 + 5 * N.n2(dd * 0.02 + o2, 1.1) + 6 * bump,
        rimH: 53 + 6 * N.n2(dd * 0.015 + o1, 2.2),
      });
      {                                                           // (the hall's own bump; a station outside it is given nothing)
        const q = slotSt[slotSt.length - 1], hw = hallW(dd), hk = hallK(dd);
        q.hallF = HALL_FOOT * hw; q.hallW = hw; q.hallU = HALL_UP * hw;
        if (hw > 0) {
          q.belly += HALL_BELLY * hw; q.topW += HALL_TOP * hk; q.Hn += HALL_HN * hk;
          // (the hole stands where the hall's light comes from: the shafts lean with the sun, and the hall's upper walls are
          // carried the same way by as much as a shaft has drifted across the slot 25 m up, so a shaft that stands on the hall's
          // sand stands in open air for its whole lit height and comes down through the hole, never out of the rock)
          q.lean = lerp(q.lean, HALL_LIT * (beamUp0.x * tv2.x + beamUp0.z * tv2.z) / beamUp0.y / smoothstep(0, 1, (HALL_LIT - HB) / q.Hn), hk);
        }
      }
      if (d >= dMouth) break;
    }
    await Y();
    Object.assign(job, { yAt, Y, yctx, N, scene, V, busy, rare, flip, hueShift, bleach, warm, swing, windy, nSwifts, nRavens, o1, o2, palette, SUN, path,
      L, duration, tv, tv2, dMouth, uMouth, sky, rig, hero, rockMat, sculpt, sdRock, sunVis, U_COURT, pools, beamLean, beamDir, right, sL, pH,
      heroUp, heroE1, heroE2, HSH, beamUp0, PIL, heroBump, darkAt, bendK, mouthPool, dC, court, courtD, STEP, dHall0, dHall1, hallFrom, hallTo,
      dHallC, hallHalf, hallW, hallSun, slotSt });
}

async function canyonWalls(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, N, V, o1, o2, path, tv, dMouth, sculpt, sL, pH, HSH, PIL, STEP, slotSt } = job;
    // ------------------------------------------------------------------ shared vertex store for the canyon mesh
    // (typed arrays written in place and grown by doubling: no million-element JS arrays to fill and then copy)
    const VS = {}; VS.CAP = 150000; VS.ICAP = 900000; VS.vcount = 0; VS.icount = 0;
    VS.pos = new Float32Array(VS.CAP * 3); VS.col = new Float32Array(VS.CAP * 3); VS.shd = new Float32Array(VS.CAP * 3); VS.slt = new Float32Array(VS.CAP * 4); VS.ldr = new Float32Array(VS.CAP * 3); VS.idx = new Uint32Array(VS.ICAP);
    await Y();
    const grown = (a, n) => { const b = new a.constructor(n); b.set(a); return b; };
    const push = (x, y, z) => {
      if (VS.vcount === VS.CAP) { VS.CAP *= 2; VS.pos = grown(VS.pos, VS.CAP * 3); VS.col = grown(VS.col, VS.CAP * 3); VS.shd = grown(VS.shd, VS.CAP * 3); VS.slt = grown(VS.slt, VS.CAP * 4); VS.ldr = grown(VS.ldr, VS.CAP * 3); }
      const i = VS.vcount * 3;
      VS.pos[i] = x; VS.pos[i + 1] = y; VS.pos[i + 2] = z; VS.col[i] = 1; VS.col[i + 1] = 1; VS.col[i + 2] = 1; VS.shd[i] = 1; VS.shd[i + 1] = 1;
      return VS.vcount++;
    };
    const setV = (v, r, g, b, ao, vis, sand) => { const i = v * 3; VS.col[i] = r; VS.col[i + 1] = g; VS.col[i + 2] = b; VS.shd[i] = ao; VS.shd[i + 1] = vis; VS.shd[i + 2] = sand; };
    // index a rows x cols grid (row-major) and turn its faces toward (fx,fy,fz), judged at the middle quad
    const gridRows = (base, cols, r0, r1) => {
      const need = VS.icount + (r1 - r0) * (cols - 1) * 6;
      if (need > VS.ICAP) { VS.ICAP = Math.max(VS.ICAP * 2, need); VS.idx = grown(VS.idx, VS.ICAP); }
      for (let i = r0; i < r1; i++) for (let j = 0; j < cols - 1; j++) {
        const a = base + i * cols + j, b = a + 1, c = a + cols, d = c + 1;
        VS.idx[VS.icount] = a; VS.idx[VS.icount + 1] = b; VS.idx[VS.icount + 2] = d; VS.idx[VS.icount + 3] = a; VS.idx[VS.icount + 4] = d; VS.idx[VS.icount + 5] = c; VS.icount += 6;
      }
    };
    const grid = (base, rows, cols, fx_, fy_, fz_) => { const i0 = VS.icount; gridRows(base, cols, 0, rows - 1); gridFace(i0, base, rows, cols, fx_, fy_, fz_); };
    // the same grid for a big sheet, a few rows at a time, so the page keeps drawing while it is indexed
    const gridInSteps = async (per, base, rows, cols, fx_, fy_, fz_) => {
      const i0 = VS.icount;
      for (let r = 0; r < rows - 1; r += per) { gridRows(base, cols, r, Math.min(rows - 1, r + per)); await Y(); }
      gridFace(i0, base, rows, cols, fx_, fy_, fz_);
      await Y();
    };
    const gridFace = (i0, base, rows, cols, fx_, fy_, fz_) => {
      const P = VS.pos, I = VS.idx, m = (base + (rows >> 1) * cols + (cols >> 1)) * 3, b = m + 3, d = m + (cols + 1) * 3;
      const ux = P[b] - P[m], uy = P[b + 1] - P[m + 1], uz = P[b + 2] - P[m + 2], wx = P[d] - P[m], wy = P[d + 1] - P[m + 1], wz = P[d + 2] - P[m + 2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      if (nx * fx_ + ny * fy_ + nz * fz_ < 0) for (let t = i0; t < VS.icount; t += 3) { const s = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = s; }
    };

    // ------------------------------------------------------------------ the two wall ribbons
    // Rows up the face. In the slot the lowest third, the part the camera flies beside, has a row every 0.48 m so that
    // flutes a metre or two across are real geometry; above that the rows open out. The cliffs keep an even spread.
    const KF = 7;                                                 // the wall's row the floor sheet is welded to
    const RW = 52, ROWS = RW + 4, K1 = 40, T1 = 0.34;             // RW + 1 rows up the face, then 3 rounding the rim
    const TROW_S = new Float32Array(RW + 1), TROW_C = new Float32Array(RW + 1);
    for (let k = 0; k <= RW; k++) { TROW_C[k] = Math.pow(k / RW, 1.25); TROW_S[k] = k <= K1 ? T1 * k / K1 : T1 + (1 - T1) * Math.pow((k - K1) / (RW - K1), 1.3); }
    const RIM_O = [0, 1.3, 4.6, 11], RIM_Y = [0, 1.1, 1.7, 0.8];
    const lastSlot = slotSt[slotSt.length - 1], nSlot = slotSt.length;
    // keep the camera's corridor clear. A soft limit: relief that would cross into the corridor is squeezed flat against it
    // instead of being cut off, so the wall nearest the camera keeps its flutes (and is still never nearer than CLEAR)
    const XZ = [0, 0];
    const clearOf = (s, sgn, x, y, z) => {
      const dy = y - s.cy;
      if (Math.abs(dy) < CLEAR + CLEAR_SOFT) {
        const need = Math.sqrt(Math.max(0, CLEAR * CLEAR - dy * dy)), lat = ((x - s.cx) * s.rx + (z - s.cz) * s.rz) * sgn, dl = lat - need;
        if (dl < CLEAR_SOFT) { const mv = need + CLEAR_SOFT * Math.exp(dl / CLEAR_SOFT - 1) - lat; x += sgn * s.rx * mv; z += sgn * s.rz * mv; }
      }
      XZ[0] = x; XZ[1] = z;
    };
    const sides = [];
    for (const sgn of [-1, 1]) {
      const J = V.fork('side' + sgn), j = (m) => J.range(-m, m);
      const st = slotSt.map((s) => {
        // in the open court the wall the sun stands behind is the lower one; both lean back from the belly instead of closing
        const sunny = sgn === sL, rimH = lerp(s.rimH, (sunny ? 19.5 : 25.5) + 3.2 * N.n2(s.d * 0.05 + o1, 31 + sgn * 4), s.ct);
        return {
          ...s, b: 1, a: 0, esc: 0, mw: 1 - smoothstep(0, 27, dMouth - s.d), x: s.cx + sgn * s.rx * FOOT_W, z: s.cz + sgn * s.rz * FOOT_W,
          topW: lerp(s.topW, (sunny ? 9.5 : 13) + 1.5 * N.n2(s.d * 0.04 + o2, 17 + sgn * 3), s.ct), lean: s.lean * (1 - 0.85 * s.ct), rimH,
          yBot: s.yFloor - 1.2, yTop: s.yFloor + rimH + 2.5 * N.n2(s.d * 0.04, 20 + sgn * 7),
          apron: 0, talus: 10, batter: 0.1, step: 2.4,
        };
      });
      const lastTop = st[st.length - 1].yTop, lastSide = st[st.length - 1];
      // past the mouth: out round the amphitheatre, down its side, round the prow, away along the escarpment.
      // (the lip of the mouth is a wide, eased turn: the wall's columns, which stand along the foot line's normals, must
      // not meet inside the rock)
      const ctrl = [[sgn * FOOT_W, 206], [sgn * FOOT_W, 200], [sgn * 8.4, 195.4], [sgn * 15, 193.6], [sgn * 24, 196.4]];
      for (const deg of [17, 27, 38, 50, 62, 74, 85]) { const a = deg * Math.PI / 180, R = AMPH_R + j(6); ctrl.push([sgn * R * Math.sin(a), AMPH_C + R * Math.cos(a)]); }
      ctrl.push([sgn * (121 + j(3)), 62], [sgn * (124 + j(3)), 30], [sgn * (126 + j(2.5)), 2], [sgn * (129 + j(2)), -14]);
      ctrl.push([sgn * 139, -27], [sgn * 170, -24 + j(3)], [sgn * 240, -10 + j(6)], [sgn * 340, 10 + j(10)], [sgn * 480, 20 + j(16)], [sgn * 650, 60 + j(20)], [sgn * 900, 140]);
      const curve = new THREE.CatmullRomCurve3(ctrl.map((c) => new THREE.Vector3(c[0], 0, c[1])), false, 'centripetal');
      curve.arcLengthDivisions = 1600;
      const CL = curve.getLength(), a0 = 6;
      await Y();
      let aProw = Infinity;
      for (let a = a0 + STEP; a < CL;) {
        curve.getPointAt(a / CL, tv);
        const am = a - a0;
        if (aProw === Infinity && tv.z < -13 && Math.abs(tv.x) > 100) aProw = am;
        const esc = aProw < Infinity ? smoothstep(0, 34, am - aProw) : 0;
        const b = 1 - smoothstep(2, 20, am);
        st.push({
          ...lastSide, b, a: am, esc, mw: 1 - smoothstep(0, 23, am), x: tv.x, z: tv.z, cx: 0, cy: 22, cz: tv.z, rx: 1, rz: 0,
          yBot: lerp(lerp(-2.5, DESERT_Y - 1.5, esc), lastSlot.yFloor - 1.2, 1 - smoothstep(0, 14, am)),
          yTop: lerp(66 + 6 * N.n2(am * 0.011 + o1, sgn * 10) + 2.5 * N.n2(am * 0.05, sgn * 3 + o2) - 5 * esc, lastTop, b),
          apron: lerp(7.5 + 2.5 * N.n2(am * 0.02, sgn * 5 + o1), 26, esc), talus: lerp(11, 36, esc),
          batter: 0.1 + 0.04 * N.n2(am * 0.015, 8 + sgn), step: 2.4 + 1.2 * N.n2(am * 0.02, 14 + sgn),
        });
        a += am < 30 ? STEP : aProw === Infinity ? 2.6 : Math.min(14, 2.6 + (am - aProw) * 0.035);
      }
      await Y();
      const n = st.length;
      for (let i = 0; i < n; i++) {
        const p = st[Math.max(0, i - 1)], q = st[Math.min(n - 1, i + 1)];
        const tx = q.x - p.x, tz = q.z - p.z, l = Math.hypot(tx, tz) || 1;
        st[i].nx = sgn * -tz / l; st[i].nz = sgn * tx / l;
      }
      // the radius of the foot line's turn where its normals run together inside the rock (a huge number where they spread)
      const rc0 = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const p = st[Math.max(0, i - 1)], q = st[Math.min(n - 1, i + 1)], ex = q.x - p.x, ez = q.z - p.z;
        const kap = -((q.nx - p.nx) * ex + (q.nz - p.nz) * ez) / (ex * ex + ez * ez || 1);
        rc0[i] = kap > 0.004 ? 1 / kap : 250;
      }
      for (let i = 0; i < n; i++) {
        const a = rc0[Math.max(0, i - 1)], c = rc0[Math.min(n - 1, i + 1)], a2 = rc0[Math.max(0, i - 2)], c2 = rc0[Math.min(n - 1, i + 2)];
        st[i].rc = Math.min(rc0[i], a, c, 0.5 * (a2 + rc0[i]), 0.5 * (c2 + rc0[i]));
      }
      await Y();
      const base = VS.vcount, cavs = new Float32Array(n * ROWS);
      for (let i = 0; i < n; i++) {
        const s = st[i], lim = 0.62 * s.rc;
        for (let k = 0; k < ROWS; k++) {
          const rim = Math.max(0, k - RW);
          const kk = Math.min(k, RW);
          const y = s.yBot + (s.yTop - s.yBot) * lerp(TROW_C[kk], TROW_S[kk], s.b) + RIM_Y[rim];
          const h = y - s.yFloor;
          let oS = 0, oC = 0, rS = 0, rC = 0, cav = 0.6, hiW = 0;
          if (s.b > 0) {                                           // keyhole: belly at the camera's height, a slit above
            const fW = FOOT_W + s.hallF;                         // (the hall's floor is wider than the slot's: its walls stand back at the foot too)
            const W = h <= HB ? fW + (s.belly - fW) * Math.pow(Math.sin(clamp(h / HB, 0, 1) * Math.PI / 2), 0.8)
              : s.topW + (s.belly - s.topW) * (1 - smoothstep(0, 1, (h - HB) / s.Hn)) + (s.hallU > 0 ? s.hallU * hallRise(h) : 0);   // (the hall's walls stand all but plumb above the belly for some fifteen metres before they close in: its shafts stand deep in it and still in open air)
            oS = W - FOOT_W + sgn * s.lean * smoothstep(HB, HB + s.Hn, h);
          }
          if (s.b < 1) {                                           // cliff: talus apron, batter, two benches
            const hh = y - s.yBot, H = s.yTop - s.yBot, tal = 1 - smoothstep(0, s.talus, hh);
            oC = -s.apron * tal * tal + s.batter * hh + s.step * (smoothstep(0.3, 0.36, hh / H) + smoothstep(0.62, 0.68, hh / H));
          }
          // the lip of the mouth is eroded, not cut: each side has its own profile up the face (noses that hang over the opening,
          // alcoves eaten back under them), so the mouth's outline against the sky is irregular and never two plumb lines
          const lipP = s.mw > 0 ? s.mw * smoothstep(1.5, 5.5, h) * (3.4 * N.n2(h * 0.105 + sgn * 17 + o1, 2.2) + 2.6 * N.n2(h * 0.26 + sgn * 5, o2 + 3) + 3.0 * sgn * Math.sin(h * 0.17 + o1) + 1.3 * sgn * Math.sin(h * 0.43 + o2)) : 0;
          const o = RIM_O[rim] * (1 - 0.45 * s.ct) + lerp(oC, oS, s.b) - lipP;
          let x = s.x + s.nx * o, z = s.z + s.nz * o;
          if (s.b > 0) {                                           // water-smoothed flutes and scallops sweeping diagonally
            const sw = y + 7 * Math.sin(s.d * 0.045 + sgn), lat0 = (x - s.cx) * s.rx + (z - s.cz) * s.rz;
            const f1 = N.fbm3(x * 0.035 + o1, sw * 0.03, z * 0.035, 2) * 1.35;
            const rdg = 1 - Math.abs(N.n3(x * 0.07 + o2, sw * 0.055 + s.d * 0.02, z * 0.07));
            const sc = rdg * rdg * 1.8 - 0.65;
            // flutes: long sharp-crested ribs a metre or two apart that run with the beds, and a finer set between them
            const fl1 = 1 - Math.abs(N.n3(s.d * 0.085 + o1, sw * 0.58, sgn * 3.3 + lat0 * 0.05)), fl2 = 1 - Math.abs(N.n3(s.d * 0.19 + o2, sw * 1.05 + 40, sgn * 7.1));
            // (they die out toward the foot, where the wall flares into banked sand: no ribs kinking across the drift)
            // (above 19 m the rows stand metres apart: the ribs fade out there, or each would be drawn as a zigzag from row to row)
            const hiK = smoothstep(17.5, 25, h), flute = (0.62 * fl1 * fl1 * fl1 + 0.2 * fl2 * fl2 - 0.3) * (0.55 + 0.45 * N.n2(s.d * 0.03 + o2, sw * 0.08 + sgn * 5)) * smoothstep(1.2, 4.5, h) * (1 - hiK);
            // upright scallops some five metres across, cut ACROSS the beds: with the light baked from them, a wall seen along its
            // length is a run of lit swells and shaded hollows, not one sheet of streaks
            const scal = N.n3(x * 0.19 + o2, y * 0.055 + sgn * 3, z * 0.19) * smoothstep(1.5, 5, h) * (1 - 0.5 * hiK);
            const ft = smoothstep(-1.5, 2, h);                     // (the broad swells keep a little of themselves down to the foot: no face there is a plane)
            rS = ((f1 + sc) * lerp(0.35, 1, ft) + (flute + 0.95 * scal + N.n3(x * 0.25, y * 0.5, z * 0.25) * 0.16 * (1 - hiK)) * ft) * lerp(1, 0.6, smoothstep(HB, HB + s.Hn, h));
            cav = clamp(0.55 + 0.3 * f1 + 0.42 * sc + 0.95 * flute + 0.28 * scal, 0, 1);
            hiW = hiK;
            if (s.hallW > 0) {
              // the hall's shelf: a harder bed that stands proud of the wall some twelve metres above the sand, broken along
              // its length (whole stretches of wall have none), rounded on top and undercut beneath: a ledge with its own
              // lit top and its own shade under it
              const hL = 12.4 + 1.7 * N.n2(s.d * 0.06 + o1, 40 + sgn * 3), tL = (h - hL) / (h > hL ? 0.55 : 1.0);
              const lg = 1.35 * s.hallW * smoothstep(-0.25, 0.3, N.n2(s.d * 0.085 + o2, 60 + sgn * 5)) * Math.exp(-tL * tL);
              rS += lg; cav = clamp(cav + 0.3 * lg * (h > hL - 0.3 ? 1 : -0.6), 0, 1);
            }
          }
          if (s.b < 1) {
            const tal = 1 - smoothstep(0, s.talus, y - s.yBot);
            rC = sculpt.at(x, y, z, 1) * 1.3 * (1 - 0.8 * tal);
            cav = lerp(sculpt.cav, cav, s.b);
          }
          const r = lerp(rC, rS, s.b) * (rim ? 0.35 : 1);
          // (what goes into the rock is held inside the turn's radius: on the lip of the mouth the columns close up, never cross)
          const off = o - r, offL = off < lim ? off : lim + (off - lim) * 0.12;
          x = s.x + s.nx * offL; z = s.z + s.nz * offL;
          if (s.b > 0 || s.a < 45) { clearOf(s, sgn, x, y, z); x = XZ[0]; z = XZ[1]; }
          const v4 = push(x, y, z) * 4;
          VS.slt[v4] = s.b; VS.slt[v4 + 1] = y + 7 * Math.sin(s.d * 0.045 + sgn); VS.slt[v4 + 2] = -hiW; VS.slt[v4 + 3] = s.d + (sgn > 0 ? 4096 : 0);   // (z: 0 on the low wall .. -1 high up, where the rows are far apart; the floor's flag is positive. w: the metres along the canyon, and 4096 more on one of the two walls, so the shader knows which wall it is on)
          cavs[i * ROWS + k] = cav;
          if (k % 8 === 7) await Y();
        }
        await Y();
      }
      await Y();
      // the lip of the mouth, once more: each row is eased along the wall there, so what the relief leaves is one rounded
      // surface with unbroken beds (then the corridor is cleared again)
      {
        const i0 = Math.max(1, nSlot - 8), i1 = Math.min(n - 2, nSlot + 24), wgt = new Float32Array(i1 + 2), tmpX = new Float32Array(i1 + 2), tmpZ = new Float32Array(i1 + 2);
        for (let i = i0; i <= i1; i++) { const am = i < nSlot ? st[i].d - dMouth : st[i].a; wgt[i] = smoothstep(-8, -2, am) * (1 - smoothstep(18, 27, am)); }
        for (let k = 0; k < ROWS; k++) {
          for (let i = i0 - 1; i <= i1 + 1; i++) { const q = (base + i * ROWS + k) * 3; tmpX[i] = VS.pos[q]; tmpZ[i] = VS.pos[q + 2]; }
          for (let i = i0; i <= i1; i++) {
            const q = (base + i * ROWS + k) * 3, w = wgt[i] * (k > KF + 4 ? 0.6 : 1);
            VS.pos[q] = lerp(tmpX[i], 0.25 * tmpX[i - 1] + 0.5 * tmpX[i] + 0.25 * tmpX[i + 1], w); VS.pos[q + 2] = lerp(tmpZ[i], 0.25 * tmpZ[i - 1] + 0.5 * tmpZ[i] + 0.25 * tmpZ[i + 1], w);
          }
        }
        for (let i = i0; i <= i1; i++) { const s = st[i]; if (s.b > 0 || s.a < 45) for (let k = 0; k < ROWS; k++) { const q = (base + i * ROWS + k) * 3; clearOf(s, sgn, VS.pos[q], VS.pos[q + 1], VS.pos[q + 2]); VS.pos[q] = XZ[0]; VS.pos[q + 2] = XZ[1]; } }
      }
      await Y();
      // the foot of the slot's wall, where the drift is welded to it: its lowest rows are eased once along the canyon, so the
      // bank meets the rock along one soft line and not with a notch at every station
      {
        const i1 = Math.max(2, nSlot - 9), tX = new Float32Array(i1 + 2), tY = new Float32Array(i1 + 2), tZ = new Float32Array(i1 + 2);
        for (let k = 0; k <= KF + 3; k++) {
          const w = k <= KF ? 1 : 1 - (k - KF) / 4;
          for (let i = 0; i <= i1 + 1; i++) { const q = (base + i * ROWS + k) * 3; tX[i] = VS.pos[q]; tY[i] = VS.pos[q + 1]; tZ[i] = VS.pos[q + 2]; }
          for (let i = 1; i <= i1; i++) {
            const q = (base + i * ROWS + k) * 3, w2 = w * smoothstep(i1, i1 - 6, i);
            VS.pos[q] = lerp(tX[i], 0.25 * tX[i - 1] + 0.5 * tX[i] + 0.25 * tX[i + 1], w2); VS.pos[q + 1] = lerp(tY[i], 0.25 * tY[i - 1] + 0.5 * tY[i] + 0.25 * tY[i + 1], w2); VS.pos[q + 2] = lerp(tZ[i], 0.25 * tZ[i - 1] + 0.5 * tZ[i] + 0.25 * tZ[i + 1], w2);
          }
        }
      }
      await Y();
      const mid = st[n >> 1];
      await gridInSteps(12, base, n, ROWS, -mid.nx, 0, -mid.nz);
      sides.push({ sgn, st, base, n, cavs });
      await Y();
    }
    // the row of a wall's column nearest h metres above the floor (the court's walls are lower, so their rows lie closer)
    const rowAtH = (S, i, h) => { const yf = S.st[i].yFloor; let k = 0; while (k < RW && VS.pos[(S.base + i * ROWS + k) * 3 + 1] - yf < h) k++; return k; };

    // ------------------------------------------------------------------ the slot's sand floor
    // A trough of sand: flat down the middle, banked up each side until it meets the wall about 2 m up. The sheet's edge
    // IS the wall's own row KF (the same points, the same normals, the same sand): the wall sinks into the drift along
    // one soft line, and what is left of it below lies buried.
    const FC = 16, floorBase = VS.vcount, nF = slotSt.length;
    for (let i = 0; i < nF; i++) {
      const s = slotSt[i];
      s.fe = sides.map((S) => {
        const q = (S.base + i * ROWS + KF) * 3;
        return { l: Math.max(4.6, ((VS.pos[q] - s.cx) * s.rx + (VS.pos[q + 2] - s.cz) * s.rz) * S.sgn), h: VS.pos[q + 1] - s.yFloor, q };
      });
      if (i % 64 === 63) await Y();
    }
    await Y();
    // low waves of sand lying across the canyon, some ten metres from crest to crest (their shade is baked with the floor's light)
    const fDune = (d, l) => { const n = N.n2(d * 0.055 + 0.012 * l + o2 * 1.3, 4.7 + 0.03 * l), r = 1 - Math.sqrt(n * n + 0.012); return r * r; };
    const chuteX = 1.7 * (N.n2(o1 * 3.1, 8.8) > 0 ? 1 : -1);
    const floorY = (s, l) => {
      const e = s.fe[l < 0 ? 0 : 1], t = Math.min(1, Math.abs(l) / e.l), x = s.cx + s.rx * l, z = s.cz + s.rz * l;
      // (at the pour-off the floor is a worn sill: all but level from wall to wall, the sand lying lower against the walls' feet
      // than further up the slot, with one broad shallow spillway a little off the centre line. The mouth's lower edge is a
      // clean rounded lip, never a notch between two climbing banks)
      const mo = 1 - smoothstep(0, 20, dMouth - s.d), lc = l - chuteX * mo;
      return s.yFloor + e.h * Math.pow(t, lerp(1.7, 2.6, mo)) * lerp(1, 0.6, mo) + (0.2 * N.n2(x * 0.16, z * 0.16) * (1 - 0.5 * mo) + 0.5 * N.n2(s.d * 0.045 + o1, l * 0.18) * (1 - 0.8 * mo) + 0.55 * fDune(s.d, l) * (1 - 0.85 * mo)) * (1 - t * t) - 0.6 * mo * mo * Math.exp(-lc * lc / 110) * (1 - t * t);
    };
    for (let i = 0; i < nF; i++) {
      const s = slotSt[i];
      for (let jx = 0; jx <= FC; jx++) {
        const u = jx / FC * 2 - 1, e = s.fe[u < 0 ? 0 : 1], l = u * e.l, edge = jx === 0 || jx === FC;
        const v4 = (edge ? push(VS.pos[e.q], VS.pos[e.q + 1], VS.pos[e.q + 2]) : push(s.cx + s.rx * l, floorY(s, l), s.cz + s.rz * l)) * 4;
        VS.slt[v4] = 1; VS.slt[v4 + 1] = VS.pos[(v4 >> 2) * 3 + 1] + 7 * lerp(Math.sin(s.d * 0.045 - 1), Math.sin(s.d * 0.045 + 1), (u + 1) / 2); VS.slt[v4 + 2] = edge ? 0 : 1; VS.slt[v4 + 3] = s.d;       // (the floor's own ripples fade out into the bank; its bedding coordinate is the wall's, so nothing smears across the weld)
      }
      if (i % 8 === 7) await Y();
    }
    await Y();
    grid(floorBase, nF, FC + 1, 0, 1, 0);
    await Y();
    // ------------------------------------------------------------------ the lip of the pour-off
    // The floor sheet ends at the mouth in one straight cut, sixteen facets across. Over its last metres and out over the edge
    // lies the lip itself, finely meshed: a clean worn pour-off, low polished swells of bare slickrock along a rim that rounds
    // over evenly and falls away under itself, and sand lying across it and spilling over down the spillway. Seen from up
    // the slot, the mouth's lower edge is this smooth rim, never the sheet's cut and never a row of teeth.
    const lip = { base: VS.vcount, n: 0, d: dMouth };
    {
      const NC = 56, iE = nF - 1, sE = slotSt[iE], INS = 5, OUT = [0.55, 1.15, 1.75, 2.25, 2.55, 2.6, 2.2], DRP = [0.03, 0.16, 0.5, 1.2, 2.4, 4.2, 6.5];
      path.tangentAtDist(dMouth, tv); const tl = Math.hypot(tv.x, tv.z) || 1, Tx = tv.x / tl, Tz = tv.z / tl;
      const hump = (l, a) => Math.pow(Math.max(0, N.n2(l * 0.33 + o1 * 2.3, a * 0.22 + 7.7) + 0.15), 1.4) * 0.24 + 0.04 * Math.max(0, N.n2(l * 0.95 + 3, a * 0.8 + o2));   // (worn low: swells a hand high, not humps)
      const tongue = (l) => Math.max(smoothstep(0.2, 0.5, N.n2(l * 0.4 + o2 * 1.7, 5.1)), Math.exp(-(l - chuteX) * (l - chuteX) / 9));   // (the sand spill: three metres wide down the spillway)
      const rows = INS + OUT.length;
      for (let r = 0; r < rows; r++) {
        const q = r - INS, s = q < 0 ? slotSt[Math.max(0, iE - (INS - 1 - r))] : sE, a = q < 0 ? s.d - dMouth : 0, wIn = smoothstep(-6.2, -0.8, a);
        for (let jx = 0; jx <= NC; jx++) {
          const u = jx / NC * 2 - 1, t = Math.abs(u), e = s.fe[u < 0 ? 0 : 1], l = u * e.l, edgeK = 1 - smoothstep(0.78, 0.98, t), tg = tongue(l);
          const rel = hump(l, a) * wIn * (1 - 0.85 * tg) * (q < 0 ? 1 : 1 - 0.6 * (q + 1) / OUT.length);
          const rim = q < 0 ? smoothstep(-1.3, -0.1, a) : 1;
          const bare = clamp(Math.max(smoothstep(0.08, 0.3, rel), rim * (1 - tg * (q < 3 ? 0.92 : 0.3))), 0, 1) * edgeK;   // bare rock (1) or sand lying on it (0)
          const out = q < 0 ? 0 : OUT[q] * (1 + 0.14 * N.n2(l * 0.5 + o2, 9.3) + 0.05 * N.n2(l * 1.4, o1)) * (1 - t * t * t);   // (an even rim)
          // (it lies a hand above the coarse sheet all the way across, and goes under the sheet's last steep facet at each wall's foot)
          const x = s.cx + s.rx * l + Tx * out, z = s.cz + s.rz * l + Tz * out, y = floorY(s, l) + lerp(0.02, 0.07 + rel, edgeK) * smoothstep(-7.2, -4.4, a) - (q < 0 ? 0 : DRP[q]);
          const v = push(x, y, z), v4 = v * 4;
          VS.slt[v4] = 1; VS.slt[v4 + 1] = y + 7 * lerp(Math.sin(s.d * 0.045 - 1), Math.sin(s.d * 0.045 + 1), (u + 1) / 2); VS.slt[v4 + 2] = q < 0 ? 1 - bare : 0; VS.slt[v4 + 3] = s.d;
          VS.shd[v * 3] = bare;                                       // (kept here until the light is baked)
        }
        await Y();
      }
      grid(lip.base, rows, NC + 1, 0, 1, 0);
      lip.n = rows * (NC + 1);
    }
    await Y();
    // the hero shafts end on the sand where it really lies (their feet stand on the bank, well off the centre line)
    for (const h of HSH) { const sh = slotSt[clamp(Math.round((pH.d + 10) / STEP), 0, nF - 1)], l = (h.x - sh.cx) * sh.rx + (h.z - sh.cz) * sh.rz; h.y = floorY(sh, l) - 0.12; }
    for (const h of PIL) { const sh = slotSt[clamp(Math.round((h.p.dP + 10) / STEP), 0, nF - 1)], l = (h.x - sh.cx) * sh.rx + (h.z - sh.cz) * sh.rz; h.y = floorY(sh, l) - 0.1; h.p.fy = h.y; }
    Object.assign(job, { VS, push, setV, grid, gridInSteps, KF, RW, ROWS, K1, nSlot, sides, rowAtH, FC, floorBase, nF, fDune, floorY, lip });
}

async function hallShafts(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, path, tv, beamUp0, STEP, dHallC, hallHalf, hallSun, slotSt, nF, floorY } = job;
    // THE HALL'S SHAFTS: three shafts of sun that stand in the hall, apart along it, come down through the hole overhead.
    // They are pillars of the slot's own kind (lit dust with a soft sheath, a lobed pool on the sand, bounce on the rock round
    // them, motes, falling sand), of three girths, each with its own small lean, as the ragged rim of the hole would cut
    // them. They stand on every visit (no seed deals one away), on both sides of the route and apart along the hall, so that
    // the route passes one at a time: the thick one in the hall's near half on the sun's side, the thin one near the hall's
    // middle on the side away from the sun, the middle one in the far half on the sun's side again. Each is a BLADE of
    // light: its section is five times as long as it is thick, and its long side lies slanted across the slot (some 45
    // degrees to the slot's line, turned toward the way in on its own side), so that the route passes its thin side and
    // nowhere runs along its broad one. BY PLACE: each stands on the hall's sand; its lit dust (the sheath, its widest)
    // keeps 7 m and more of clear air from the route's whole line (the true distance to the sheath's section, taken every
    // half metre of the route for 45 m either way); and it stands where the hall's walls leave the most of its lit height
    // in open air (22 m and more where the hall allows it), so it is seen to come down from above and not out of rock.
    // (A stream of their own: 'hall'. The slot's own pillar of this chamber stands at the hall's way in, and the pillar where
    // the slot straightens at its way out, as they did.)
    const HALL = [];
    {
      const RH = makeRng('canyon-of-light:hall:' + ctx.seed), HLEN = 40, HALL_AIR = 7, HALL_SLANT = 0.785;   // (HALL_AIR: metres of clear air between the route's whole line and a shaft's lit dust)
      const want = [                                              // how far along the slot from the hall's middle (a share of its half length), side (+1 the sun's), metres off the route's line, girth, strength
        { along: RH.range(-0.45, -0.33), sd: 1, lat: RH.range(12, 13), k: RH.range(0.85, 0.95), power: RH.range(0.95, 1.1) },
        { along: RH.range(0.42, 0.52), sd: 1, lat: RH.range(11.4, 12.4), k: RH.range(0.7, 0.8), power: RH.range(0.8, 0.95) },
        { along: RH.range(0.0, 0.1), sd: -1, lat: RH.range(11.5, 12.5), k: RH.range(0.6, 0.7), power: RH.range(0.72, 0.86) },
      ];
      for (const w of want) {
        const d = dHallC + w.along * hallHalf, sq = slotSt[clamp(Math.round((d + 10) / STEP), 0, nF - 1)], tilt = [RH.range(-0.05, 0.05), RH.range(-0.05, 0.05)], turn = RH.range(-0.5, 0.5), sd1 = RH.range(0, 40), sd2 = RH.range(0, 40);
        path.tangentAtDist(d, tv); const tl = Math.hypot(tv.x, tv.z) || 1, tx = tv.x / tl, tz = tv.z / tl;
        const up = new THREE.Vector3(beamUp0.x + sq.rx * tilt[0] + tx * tilt[1], beamUp0.y, beamUp0.z + sq.rz * tilt[0] + tz * tilt[1]).normalize();
        const side = w.sd * hallSun, e = sq.fe[side < 0 ? 0 : 1], ph = HALL_SLANT + 0.3 * turn;
        const e1 = new THREE.Vector3(tx * Math.cos(ph) + side * sq.rx * Math.sin(ph), 0, tz * Math.cos(ph) + side * sq.rz * Math.sin(ph)); e1.addScaledVector(up, -e1.dot(up)).normalize();
        const e2 = new THREE.Vector3().crossVectors(up, e1).normalize();
        const a = 2.75 * w.k, b = 0.55 * w.k, SA = 1.25 * a, SB = 1.4 * b;
        // the least clear air between the route's line and this shaft's lit dust, were it to stand lat metres off the route
        const clearAt = (lat, A2 = SA, B2 = SB) => {
          const fx_ = sq.cx + sq.rx * side * lat, fz_ = sq.cz + sq.rz * side * lat, fy_ = floorY(sq, side * lat) - 0.1;
          let least = 1e9;
          for (let r = d - 45; r <= d + 45; r += 0.5) {
            path.posAtDist(r, tv);
            const vx = tv.x - fx_, vy = tv.y - fy_, vz = tv.z - fz_, al = clamp(vx * up.x + vy * up.y + vz * up.z, 0, HLEN);
            const cx = vx - up.x * al, cy = vy - up.y * al, cz = vz - up.z * al, cu = cx * up.x + cy * up.y + cz * up.z;
            if (cx * cx + cy * cy + cz * cz > 900) continue;      // (thirty metres off and more: not the nearest)
            least = Math.min(least, Math.hypot(ellGap(cx * e1.x + cy * e1.y + cz * e1.z, cx * e2.x + cy * e2.y + cz * e2.z, A2, B2), cu));   // (the true distance to the sheath's ellipse)
          }
          return least;
        };
        // how many metres of its height the shaft would stand in open air between the hall's walls (their section at each
        // height, a metre allowed for their relief), were it to stand lat metres off the route
        const openAt = (lat) => {
          const fx_ = sq.cx + sq.rx * side * lat, fz_ = sq.cz + sq.rz * side * lat, fy_ = floorY(sq, side * lat) - 0.1, i0 = slotSt.indexOf(sq), rad = 0.45 * (a + b);
          for (let hh = 3; hh <= 30; hh += 1) {
            const x = fx_ + up.x / up.y * hh, z = fz_ + up.z / up.y * hh;
            let bi = i0, ba = 1e9;
            for (let i = Math.max(0, i0 - 8); i <= Math.min(nF - 1, i0 + 8); i++) { const t = slotSt[i], al = Math.abs((x - t.cx) * t.rz - (z - t.cz) * t.rx); if (al < ba) { ba = al; bi = i; } }
            const t = slotSt[bi], hF = fy_ + hh - t.yFloor, fW = FOOT_W + t.hallF;
            const W = hF <= HB ? fW + (t.belly - fW) * Math.pow(Math.sin(clamp(hF / HB, 0, 1) * Math.PI / 2), 0.8) : t.topW + (t.belly - t.topW) * (1 - smoothstep(0, 1, (hF - HB) / t.Hn)) + (t.hallU > 0 ? t.hallU * hallRise(hF) : 0);
            if (Math.abs((x - t.cx) * t.rx + (z - t.cz) * t.rz - t.lean * smoothstep(HB, HB + t.Hn, hF)) + rad > W - 1) return hh;
          }
          return 30;
        };
        // (on the sand, its core a metre and a half clear of the wall's foot; if the wall would close over it lower than 22 m
        // up, it stands nearer the route, as near as its 7 m of clear air allow, where the most of its height is in open air)
        const bound = e.l - Math.hypot(a * (e1.x * sq.rx + e1.z * sq.rz), b * (e2.x * sq.rx + e2.z * sq.rz)) - 1.5;   // (the core's own reach across the slot, as it is turned)
        let lat = Math.min(w.lat, bound), clear = clearAt(lat), open = clear >= HALL_AIR ? openAt(lat) : -1;
        for (let l2 = lat - 0.25; open < 22 && l2 > 4; l2 -= 0.25) { const c2 = clearAt(l2); if (c2 < HALL_AIR) break; const op = openAt(l2); if (op > open) { open = op; lat = l2; clear = c2; } }
        while (clear < HALL_AIR && lat < bound) { lat += 0.25; clear = clearAt(lat); open = openAt(lat); }
        // THE SHEATH AS WIDE AS ITS CLEAR AIR ALLOWS (the mend of round 27; the shaft's PLACE is the one found above with the
        // thin sheath and is not moved by this). Seen from the court and the passage the thin sheath left each blade a hard
        // pale pole; a blade of light in dusty air has a soft flank. So where it stands the sheath is widened toward
        // SHEATH_A times the core's long half axis and SHEATH_B times its short one, in quarter steps, as far as its lit
        // dust still keeps the hall's 7 m of clear air from the route's whole line (the same count as above).
        let SAw = SA, SBw = SB;
        for (let f = 1; f > 0.01; f -= 0.25) { const A2 = lerp(SA, SHEATH_A * a, f), B2 = lerp(SB, SHEATH_B * b, f), c2 = clearAt(lat, A2, B2); if (c2 >= HALL_AIR) { SAw = A2; SBw = B2; clear = c2; break; } }
        HALL.push({ d, x: sq.cx + sq.rx * side * lat, y: floorY(sq, side * lat) - 0.1, z: sq.cz + sq.rz * side * lat, a, b, SA: SAw, SB: SBw, k: w.k, power: w.power, up, e1, e2, len: HLEN, lat: side * lat, clear, open, sd1, sd2 });
        await Y();
      }
    }
    Object.assign(job, { HALL });
}

async function gateBlade(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, scene, path, tv, yAt, beamUp0, PIL, STEP, dHall0, dHall1, dHallC, slotSt, nF, floorY, HALL } = job;
    // THE HALL'S TWO GATEPOSTS TAKE THE HALL'S LAW (two live keys changed, by the designer's yes of 10-09 09:14 for the pillar
    // at the hall's way in and of 10-09 17:54 for the far one: see the head of this file). Live stood each of these pillars
    // of sun 4.3 m from the route's line, its sheath of lit dust some 8.7 m by 6.3 m across, so the route ran through that
    // sheath and a milky sheet or column lay over a tenth to a third of the picture for some metres of the flight. Now each
    // is a leaning BLADE of the hall's kind: the hall's section (five times as long as it is thick, 2.75 k by 0.55 k), its
    // long side slanted 45 degrees across the slot toward the way in on its own side, the hall's soft sheath (SHEATH_A and
    // SHEATH_B times the core), leaning with the sun as every pillar does. BY PLACE: it stands on the sand on its own side
    // of the route (the side away from the sun, as it did), at the first station of the slot, walking from the one it stood
    // at toward the hall's middle (the way-in post forward, the far post back), where the floor is wide enough for it to
    // stand with its core a metre and a half clear of the wall's foot, its lit dust (the sheath, its widest) 7 m and more of
    // clear air from the route's whole line (the true distance to the sheath's section, a point of the route every half
    // metre for 45 m either way), its pool clear of the pools of the hall's own shafts, and GATE_OPEN metres and more of
    // its height in open air between the walls, as the hall's shafts have (so it is seen to come down from above and not
    // out of rock; if no station of the walk has that much, the one with the most); across the slot at that station, the
    // place with the most of its height in open air. Its pool on the sand, the pool's warm glow, its
    // motes, its light on the rock and the sand round it, the thread of sand that falls beside it and that thread's heap
    // all go with it: each is worked out from this pillar's place, as it always was. The stretch of slot it stood in, the
    // hall's gatepost stations (the hall's bump and its three shafts are placed from them) and every wall are what they
    // were. No draw is made for it: its section's turn is the hall's own 45 degrees.
    const GATE_AIR = 7, GATE_OPEN = 22, SLANT = 0.785, up = beamUp0, notes = {};
    for (const h of PIL) {
      const p = h.p;
      if (p.dP < dHall0 - 4 * STEP || p.dP > dHall1 + 4 * STEP) continue;   // (a pillar of the slot's own that stands in the hall's stretch: one of its gateposts, by canyonPlan's own measure)
      const farPost = p.dP >= 0.5 * (dHall0 + dHall1), dir = farPost ? -1 : 1;
      const k = h.k, a = 2.75 * k, b = 0.55 * k, SA = SHEATH_A * a, SB = SHEATH_B * b, side = p.side < 0 ? -1 : 1, LEN = 23 + 5 * k;
      const i0 = clamp(Math.round((p.dP + 10) / STEP), 0, nF - 1), i1 = clamp(Math.round((dHallC + 10) / STEP), 0, nF - 1);
      let found = null;
      for (let i = i0; (i - i1) * dir <= 0 && !(found && found.open >= GATE_OPEN); i += dir) {
        const sq = slotSt[i], d = sq.d, e = sq.fe[side < 0 ? 0 : 1];
        path.tangentAtDist(d, tv); const tl = Math.hypot(tv.x, tv.z) || 1, tx = tv.x / tl, tz = tv.z / tl;
        const e1 = new THREE.Vector3(tx * Math.cos(SLANT) + side * sq.rx * Math.sin(SLANT), 0, tz * Math.cos(SLANT) + side * sq.rz * Math.sin(SLANT)); e1.addScaledVector(up, -e1.dot(up)).normalize();
        const e2 = new THREE.Vector3().crossVectors(up, e1).normalize();
        const bound = e.l - Math.hypot(a * (e1.x * sq.rx + e1.z * sq.rz), b * (e2.x * sq.rx + e2.z * sq.rz)) - 1.5;   // (the core's own reach across the slot, as it is turned)
        // the least clear air between the route's line and its lit dust, were it to stand lat metres off the route
        const clearAt = (lat) => {
          const fx_ = sq.cx + sq.rx * side * lat, fz_ = sq.cz + sq.rz * side * lat, fy_ = floorY(sq, side * lat) - 0.1;
          let least = 1e9;
          for (let r = d - 45; r <= d + 45; r += 0.5) {
            path.posAtDist(r, tv);
            const vx = tv.x - fx_, vy = tv.y - fy_, vz = tv.z - fz_, al = clamp(vx * up.x + vy * up.y + vz * up.z, 0, LEN);
            const cx = vx - up.x * al, cy = vy - up.y * al, cz = vz - up.z * al, cu = cx * up.x + cy * up.y + cz * up.z;
            if (cx * cx + cy * cy + cz * cz > 900) continue;
            least = Math.min(least, Math.hypot(ellGap(cx * e1.x + cy * e1.y + cz * e1.z, cx * e2.x + cy * e2.y + cz * e2.z, SA, SB), cu));
          }
          return least;
        };
        // how many metres of its height it would stand in open air between the walls (their section at each height, a metre allowed for their relief)
        const openAt = (lat) => {
          const fx_ = sq.cx + sq.rx * side * lat, fz_ = sq.cz + sq.rz * side * lat, fy_ = floorY(sq, side * lat) - 0.1, rad = 0.45 * (a + b);
          for (let hh = 3; hh <= 30; hh += 1) {
            const x = fx_ + up.x / up.y * hh, z = fz_ + up.z / up.y * hh;
            let bi = i, ba = 1e9;
            for (let j = Math.max(0, i - 8); j <= Math.min(nF - 1, i + 8); j++) { const t = slotSt[j], al = Math.abs((x - t.cx) * t.rz - (z - t.cz) * t.rx); if (al < ba) { ba = al; bi = j; } }
            const t = slotSt[bi], hF = fy_ + hh - t.yFloor;
            if (Math.abs((x - t.cx) * t.rx + (z - t.cz) * t.rz - t.lean * smoothstep(HB, HB + t.Hn, hF)) + rad > slotHalfW(t, hF) - 1) return hh;
          }
          return 30;
        };
        // (its pool keeps clear of the pools of the hall's own shafts, which lie turned as it is: in its own section's frame,
        // the two pools' half lengths and a metre between them along the long side, their half widths and a metre across)
        const apart = (lat) => {
          const fx_ = sq.cx + sq.rx * side * lat, fz_ = sq.cz + sq.rz * side * lat;
          return HALL.every((q) => { const dx = q.x - fx_, dz = q.z - fz_, p1 = dx * e1.x + dz * e1.z, p2 = dx * e2.x + dz * e2.z, A = 1.32 * POOL_A * (a + q.a) + 1, B = 1.32 * POOL_B * (b + q.b) + 1; return p1 * p1 / (A * A) + p2 * p2 / (B * B) >= 1; });
        };
        let best = null;
        for (let lat = bound; lat >= 4; lat -= 0.25) { const c = clearAt(lat); if (c < GATE_AIR) break; if (!apart(lat)) continue; const op = openAt(lat); if (!best || op > best.open) best = { lat, clear: c, open: op }; }
        if (best && (!found || best.open > found.open)) found = { sq, d, e1, e2, lat: best.lat, clear: best.clear, open: best.open };
        await Y();
      }
      if (found) {
        const { sq, lat } = found, fx_ = sq.cx + sq.rx * side * lat, fz_ = sq.cz + sq.rz * side * lat, fy_ = floorY(sq, side * lat) - 0.1;
        p.ch = { x: p.x, y: p.y, z: p.z };                       // (the broad fill of light of the opening it comes through stays where that opening is)
        p.x = fx_; p.z = fz_; p.y = yAt(sq.cz) - FLOOR_DROP + 0.3; p.fy = fy_; p.side = side * lat; p.footD = found.d; p.gate = true;
        Object.assign(h, { x: fx_, y: fy_, z: fz_, a, b, SA, SB, e1: found.e1, e2: found.e2, up, power: p.power, len: clamp(found.open + 3, 24, 34), d: found.d, lat: side * lat, clear: found.clear, open: found.open, gate: true });
      }
      // (for the round's print: each gatepost blade as the walls placed it)
      notes[farPost ? 'gateFar' : 'gate'] = found ? { from: p.dP, d: found.d, lat: side * found.lat, k, clear: found.clear, open: found.open, len: h.len } : { from: p.dP, d: null };
    }
    Object.assign(scene.userData, notes);
}

async function canyonBlocks(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, N, flip, path, dMouth, pools, sL, pH, PIL, dC, STEP, slotSt, VS, push, grid, ROWS, K1, nSlot, sides, nF, floorY, HALL } = job;
    // ------------------------------------------------------------------ fallen blocks on the slot's floor
    // Banded blocks that came down from the walls lie half buried along their feet, each with its beds at the angle it fell
    // at; the camera passes over and beside them. Their places and shapes here; their light is baked with the walls'.
    const slotRocks = [];
    {
      const block = (d, s, sd, cx, cy, cz, r, sx, sy, sz, po, rot, tx, tz) => {
          const SA = r > 1.2 ? 20 : 14, SV = r > 1.2 ? 12 : 9, base = VS.vcount, slab = sy < 0.52, cr = Math.cos(rot), sr = Math.sin(rot), swp = 7 * Math.sin(d * 0.045 + sd);
          for (let i = 0; i <= SV; i++) {
            const la = (i / SV - 0.5) * Math.PI, cl = Math.cos(la), sl = Math.sin(la);
            for (let j = 0; j <= SA; j++) {
              const th = (j % SA) / SA * Math.PI * 2, nx = cl * Math.cos(th), nz = cl * Math.sin(th);
              const fc = 1 - Math.abs(N.n3(nx * 2.3 + po, sl * 2.3, nz * 2.3)), crease = fc * fc;
              const rr = r * (1 + 0.3 * N.n3(nx * 1.4 + po, sl * 1.4, nz * 1.4 + po) + 0.05 * N.n3(nx * 4 + po, sl * 4, nz * 4)) * (1 - 0.18 * crease);   // (water-worn: rounded, shallow creases)
              const ex = nx * rr * sx, ez = nz * rr * sz, top = slab ? Math.min(sl, 0.4 + 0.05 * N.n2(nx * 2 + po, nz * 2)) : sl;
              const x = cx + ex * cr - ez * sr, y = cy + top * rr * sy, z = cz + ex * sr + ez * cr, v = push(x, y, z), v4 = v * 4;
              VS.slt[v4] = 1; VS.slt[v4 + 1] = y + swp + (tx * (x - cx) + tz * (z - cz)) * 1.6; VS.slt[v4 + 3] = d;
              VS.shd[v * 3] = crease; VS.shd[v * 3 + 1] = sl;                            // (kept here until the light is baked)
            }
          }
          grid(base, SV + 1, SA + 1, -cr, 0, -sr);
          slotRocks.push({ base, n: (SV + 1) * (SA + 1), d, s, x: cx, z: cz, r: r * 1.1 });
      };
      const R = makeRng('canyon-of-light:slotrocks:' + ctx.seed), nR = R.int(34, 42);
      for (let n = 0; n < nR; n++) {
        const d = n < 3 ? [20, 31, 44][n] + R.range(-3, 3) : R.range(50, dMouth - 14), s = slotSt[clamp(Math.round((d + 10) / STEP), 0, nF - 1)];
        const sd = n < 3 ? (n === 1 ? -1 : 1) * flip : R.sign(), e = s.fe[sd < 0 ? 0 : 1], big = n < 2 || R.chance(0.24);
        const r = big ? R.range(1.25, 1.9) : R.range(0.45, 1.05), sy = R.chance(0.35) ? R.range(0.34, 0.5) : R.range(0.6, 0.95);
        const l = sd * Math.max(3.2, e.l - r * R.range(0.4, 1.7)), sx = R.range(0.8, 1.4), sz = R.range(0.8, 1.35), po = R.range(0, 50), rot = R.range(0, 6.28), tx = R.range(-0.6, 0.6), tz = R.range(-0.6, 0.6);
        const cx = s.cx + s.rx * l, cz = s.cz + s.rz * l, cy = floorY(s, l) - r * sy * 0.32;   // (sunk into the drift: no underside shows)
        if (path.distanceTo(cx, cy, cz) < CLEAR + 0.2 + r * 1.5) continue;       // (the corridor stays clear)
        if (Math.hypot(cx - pH.x, cz - pH.z) < 7) continue;                      // (and so does the hero beam's pool)
        if (PIL.some((h) => Math.hypot(cx - h.x, cz - h.z) < (h.gate ? 3.6 + r : 3.4))) continue;     // (and the smaller pillars' pools; the blade at the hall's way in as the hall's shafts)
        if (HALL.some((h) => Math.hypot(cx - h.x, cz - h.z) < 3.6 * Math.max(h.k, 1) + r)) continue;   // (and the pools of the hall's shafts)
        if (s.ct > 0.3 && sd === -sL) continue;                                  // (the court's far side is kept for the patch of sun and the sapling)
        block(d, s, sd, cx, cy, cz, r, sx, sy, sz, po, rot, tx, tz);
        if (n % 3 === 2) await Y();
      }
      // The court's own fall of blocks: banded boulders that came off the low rim lie in and round the patch of sun on the far
      // side (the side the first loop keeps clear), some in the light and some just out of it, so the eye has lit rock in the
      // middle distance from the moment the court opens; none within reach of the sapling's stem or the route's corridor.
      {
        const RC = makeRng('canyon-of-light:courtrocks:' + ctx.seed), pc = pools.find((q) => q.court), sP = slotSt[clamp(Math.round((pc.dP + 10) / STEP), 0, nF - 1)];
        const lP = (pc.x - sP.cx) * sP.rx + (pc.z - sP.cz) * sP.rz;
        for (let n = 0; n < 11; n++) {
          const big = n < 3, along = (n < 3 ? [-10.5, 6.5, 13][n] : RC.range(-15, 17)) + RC.range(-1.5, 1.5), d = pc.dP + along, s = slotSt[clamp(Math.round((d + 10) / STEP), 0, nF - 1)];
          const sd = lP < 0 ? -1 : 1, e = s.fe[sd < 0 ? 0 : 1], r = big ? RC.range(1.5, 2.2) : RC.range(0.5, 1.15), sy = RC.range(0.62, 0.95);
          const l = sd * clamp(Math.abs(lP) + (big ? RC.range(1.8, 4.2) : RC.range(-3.2, 4.6)), 5.2, Math.max(5.4, e.l - r * 0.6));
          const sx = RC.range(0.8, 1.4), sz = RC.range(0.8, 1.35), po = RC.range(0, 50), rot = RC.range(0, 6.28), tx = RC.range(-0.6, 0.6), tz = RC.range(-0.6, 0.6);
          const cx = s.cx + s.rx * l, cz = s.cz + s.rz * l, cy = floorY(s, l) - r * sy * 0.32;
          if (path.distanceTo(cx, cy, cz) < CLEAR + 0.2 + r * 1.5) continue;
          if (Math.hypot(cx - pc.x, cz - pc.z) < 2.6 + r * 1.2) continue;          // (the sapling's own ground stays open)
          if (slotRocks.some((q) => Math.hypot(cx - q.x, cz - q.z) < q.r + r * 0.9)) continue;
          block(d, s, sd, cx, cy, cz, r, sx, sy, sz, po, rot, tx, tz);
          await Y();
        }
      }
    }
    await Y();

    // ------------------------------------------------------------------ chockstones wedged high between the walls
    // Between the hero chamber and the open court the slot is at its tightest overhead. Where the two walls stand a boulder's
    // width apart up there, well above the route, a boulder that came down in a flood is jammed between them, a smaller one
    // lodged on its shoulder: dark underneath, its top catching the slit's light. The place is read off the walls themselves
    // (the station and the height at which the gap fits the stone, some way along the canyon from every shaft so that no beam
    // is cut); nothing is drawn for it but the stone's own shape, on a stream of its own.
    const chocks = [];
    {
      const RK = makeRng('canyon-of-light:chockstones:' + ctx.seed), wantW = RK.range(4.4, 5.8), kB = RK.range(0.52, 0.68), kC = RK.range(0.62, 0.9), po = RK.range(0, 50), roll = RK.range(-0.22, 0.22), po2 = RK.range(0, 50), sd2 = RK.sign(), k2 = RK.range(0.36, 0.46);
      const iA = clamp(Math.round((pH.d + 20 + 10) / STEP), 2, nSlot - 3), iB = clamp(Math.round((dC - 68 + 10) / STEP), 2, nSlot - 3);
      const latW = (S, i, k) => { const q = (S.base + i * ROWS + k) * 3, sq = slotSt[i]; return (VS.pos[q] - sq.cx) * sq.rx + (VS.pos[q + 2] - sq.cz) * sq.rz; };
      let best = null;
      for (let i = iA; i <= iB; i++) {
        const sq = slotSt[i];
        if (pools.some((q) => (q.hero || q.pillar) && Math.abs(q.d - sq.d) < 10)) continue;
        for (let k = K1 - 1; k <= K1 + 4; k++) {
          const l0 = latW(sides[0], i, k), l1 = latW(sides[1], i, k), gap = l1 - l0, y = 0.5 * (VS.pos[(sides[0].base + i * ROWS + k) * 3 + 1] + VS.pos[(sides[1].base + i * ROWS + k) * 3 + 1]);
          const A = gap / 2 + 0.7;
          if (gap < 2.6 || gap > 7.5 || y - 1.4 * A * kB - sq.cy < CLEAR + 1.2) continue;      // (well clear above the route)
          const sc = Math.abs(gap - wantW) + 0.04 * (y - sq.yFloor);
          if (!best || sc < best.sc) best = { sc, i, k, y, lat: 0.5 * (l0 + l1), A, l1 };
        }
        if (i % 16 === 15) await Y();
      }
      const stone = (sq, lat, y, A, B, C, po_, roll_) => {
        const SA = 22, SV = 14, base = VS.vcount, cx = sq.cx + sq.rx * lat, cz = sq.cz + sq.rz * lat, swp = 7 * Math.sin(sq.d * 0.045);
        for (let i = 0; i <= SV; i++) {
          const la = (i / SV - 0.5) * Math.PI, cl = Math.cos(la), sl_ = Math.sin(la);
          for (let j = 0; j <= SA; j++) {
            const th = (j % SA) / SA * Math.PI * 2, nx = cl * Math.cos(th), nz = cl * Math.sin(th);
            const fc = 1 - Math.abs(N.n3(nx * 2.1 + po_, sl_ * 2.1, nz * 2.1)), crease = fc * fc;
            const rr = (1 + 0.26 * N.n3(nx * 1.3 + po_, sl_ * 1.3, nz * 1.3 + po_) + 0.06 * N.n3(nx * 4 + po_, sl_ * 4, nz * 4)) * (1 - 0.16 * crease);
            const a = nx * rr * A, c = nz * rr * C, x = cx + sq.rx * a - sq.rz * c, z = cz + sq.rz * a + sq.rx * c, yy = y + sl_ * rr * B + roll_ * a;
            const v = push(x, yy, z), v4 = v * 4;
            VS.slt[v4] = 1; VS.slt[v4 + 1] = yy + swp + 0.5 * a - 0.35 * c; VS.slt[v4 + 3] = sq.d;      // (its beds lie at the angle it jammed at)
            VS.shd[v * 3] = crease; VS.shd[v * 3 + 1] = sl_;                                           // (kept here until the light is baked)
          }
        }
        grid(base, SV + 1, SA + 1, -sq.rx, 0, -sq.rz);
        chocks.push({ base, n: (SV + 1) * (SA + 1), d: sq.d, yFloor: sq.yFloor, H: sq.rimH });
      };
      if (best) {
        const sq = slotSt[best.i];
        stone(sq, best.lat, best.y, best.A, best.A * kB, best.A * kC, po, roll);
        await Y();
        // (the smaller one sits on its shoulder, against one wall)
        const A2 = best.A * k2;
        stone(sq, best.lat + sd2 * (best.A - A2 * 0.9), best.y + best.A * kB * 0.72 + A2 * 0.45, A2, A2 * 0.8, A2 * 1.1, po2, -roll);
      }
    }
    await Y();
    Object.assign(job, { slotRocks, chocks });
}

async function slotShafts(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, scene, path, tv, beamUp0, STEP, pH, slotSt, nF, floorY, slotRocks } = job;
    // THE LESSER SHAFT OF THE FIRST SLOT: one, between the entry and the hero beam (a lobed pool on the sand, lit dust over
    // it, motes, the warm glow round its pool), plainly smaller and dimmer than the hero beam, which stays the tallest and
    // brightest thing of the slot. It is A BREATH OF LIGHT, not a bar: dust that the sun lights where it comes down, thickest
    // and brightest just over the pool and thinning away upward (its light falls to a third in seven metres of height and is
    // gone into the dark over its last eight), widest at the pool and narrowing to six tenths of that at its top, with no
    // edge anywhere across it (its light dies away from its middle line to nothing at its side) and the wall seen through it;
    // it leans with the sun and a little more by its own draw (along the slot, up to 0.09; across it 0.04 at the most, so
    // its own lean does not carry it over the route). It stands WHERE THE WALLS' OWN SHAPE
    // OPENS THE ROOF: every station of the slot from twenty metres in to the near wall of the hero beam's chamber is tried
    // on both sides, and at each the places on the sand from which a line up the light (the pillars' own lean, with the
    // shaft's small lean of its own) stays in open air between the walls' sections (the keyhole's section at each height,
    // a metre allowed for their relief). A place counts when that line stands OPEN_MIN metres and more in open air, when
    // the shaft's lit dust (the sheath, its widest) keeps 7 m of clear air from the route's whole line (a point every half
    // metre, and a hand's breadth over the 7 m asked so that a finer measure finds no less), and when its pool lies on the sand clear of every fallen block. Of those the one with the most open air is
    // taken, a place further down the slot before a place nearer the entry (ten metres down the slot weigh as five metres
    // of open air); the second shaft the same, nine metres and more along the slot from the first. Where the walls leave
    // no such place a shaft is left out: one shaft, or none, is what such a visit has. (Twenty metres in and more: a shaft
    // nearer the entry than that is passed abeam before its pool is ever met from in front, a pale band and nothing more,
    // and is left out.) The shaft is as tall as its open air and thins out below the rock it would meet. Its section is a
    // blade slanted across the slot toward the way in, as the hall's are. No wall is moved for it and nothing of the slot
    // is dealt anew: the blocks, the walls and the sand are what they were. (A stream of their own: 'lesser'.)
    const LESS = [];
    {
      const RL = makeRng('canyon-of-light:lesser:' + ctx.seed), AIR = 7.1, OPEN_MIN = 14, SLANT = 0.785, dA = 20, dB = pH.d - 16;
      const RT = []; for (let r = 0; r <= pH.d; r += 0.5) { path.posAtDist(r, tv); RT.push(tv.x, tv.y, tv.z); }
      await Y();
      const want = [{ k: RL.range(0.4, 0.48), power: RL.range(0.66, 0.8) }];
      for (const w of want) {
        const tilt = [RL.range(-0.04, 0.04), RL.range(-0.09, 0.09)], turn = RL.range(-0.5, 0.5), sd1 = RL.range(0, 40), sd2 = RL.range(0, 40);
        // (a, b: the half axes of its pool's own section; SA, SB: of the lit dust at its widest, just over the pool, where the dust has spread)
        const a = 2.75 * w.k, b = 0.92 * w.k, SA = 1.2 * a, SB = 2.2 * b, ph = SLANT + 0.3 * turn;
        let best = null;
        for (let i = 0; i < nF; i++) {
          const sq = slotSt[i];
          if (sq.d < dA || sq.d > dB || LESS.some((h) => Math.abs(h.d - sq.d) < 9)) continue;
          path.tangentAtDist(sq.d, tv); const tl = Math.hypot(tv.x, tv.z) || 1, tx = tv.x / tl, tz = tv.z / tl;
          const up = new THREE.Vector3(beamUp0.x + sq.rx * tilt[0] + tx * tilt[1], beamUp0.y, beamUp0.z + sq.rz * tilt[0] + tz * tilt[1]).normalize();
          for (const side of [-1, 1]) {
            // (the section's long side slanted across the slot toward the way in, on its own side: the eye that comes down the slot looks along it)
            const e1 = new THREE.Vector3(tx * Math.cos(ph) + side * sq.rx * Math.sin(ph), 0, tz * Math.cos(ph) + side * sq.rz * Math.sin(ph)); e1.addScaledVector(up, -e1.dot(up)).normalize();
            const e2 = new THREE.Vector3().crossVectors(up, e1).normalize(), e = sq.fe[side < 0 ? 0 : 1];
            const reach = Math.hypot(a * (e1.x * sq.rx + e1.z * sq.rz), b * (e2.x * sq.rx + e2.z * sq.rz));   // (the core's own reach across the slot)
            for (let lat = 6; lat <= e.l - reach - 0.3; lat += 0.25) {
              const fx_ = sq.cx + sq.rx * side * lat, fz_ = sq.cz + sq.rz * side * lat, fy_ = floorY(sq, side * lat) - 0.1;
              if (slotRocks.some((q) => Math.hypot(fx_ - q.x, fz_ - q.z) < q.r + 1.32 * a + 0.3)) continue;
              // open air: how high the line up the light stands clear of the walls
              let open = 2;
              for (let hh = 3; hh <= 40; hh += 1) {
                const x = fx_ + up.x / up.y * hh, z = fz_ + up.z / up.y * hh;
                let bi = i, ba = 1e9;
                for (let j = Math.max(0, i - 6); j <= Math.min(nF - 1, i + 6); j++) { const t = slotSt[j], al = Math.abs((x - t.cx) * t.rz - (z - t.cz) * t.rx); if (al < ba) { ba = al; bi = j; } }
                const t = slotSt[bi], hF = fy_ + hh - t.yFloor;
                if (Math.abs((x - t.cx) * t.rx + (z - t.cz) * t.rz - t.lean * smoothstep(HB, HB + t.Hn, hF)) + reach > slotHalfW(t, hF) - 1) break;
                open = hh;
              }
              if (open < OPEN_MIN) continue;
              const sc = Math.min(open, 28) + 0.5 * (sq.d - dA);
              if (best && sc <= best.sc) continue;
              // clear air: the least distance between the route's line and the sheath of lit dust, as tall as its open air
              let clear = 1e9;
              for (let q = 0; q < RT.length; q += 3) {
                const vx = RT[q] - fx_, vy = RT[q + 1] - fy_, vz = RT[q + 2] - fz_, al = clamp(vx * up.x + vy * up.y + vz * up.z, 0, open + 3);
                const cx = vx - up.x * al, cy = vy - up.y * al, cz = vz - up.z * al;
                if (cx * cx + cy * cy + cz * cz > 400) continue;
                const g = Math.hypot(ellGap(cx * e1.x + cy * e1.y + cz * e1.z, cx * e2.x + cy * e2.y + cz * e2.z, SA, SB), cx * up.x + cy * up.y + cz * up.z);
                if (g < clear) clear = g;
              }
              if (clear < AIR) continue;
              best = { sc, d: sq.d, x: fx_, y: fy_, z: fz_, a, b, SA, SB, k: w.k, power: w.power, up, e1, e2, len: Math.min(open + 3, 26), lat: side * lat, clear, open, sd1, sd2 };
            }
          }
          if (i % 2 === 1) await Y();
        }
        if (best) LESS.push(best);
        await Y();
      }
    }
    // (for the round's print: the lesser shafts as the walls placed them)
    scene.userData.lesser = LESS.map((h) => ({ d: h.d, lat: h.lat, k: h.k, clear: h.clear, open: h.open, len: h.len }));
    Object.assign(job, { LESS });
}

async function canyonPlain(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, N, scene, V, swing, o1, o2, SUN, path, L, tv, tv2, dMouth, hero, rockMat, sculpt, sdRock, sunVis, right, VS, push, setV, grid,
      gridInSteps } = job;
    // ------------------------------------------------------------------ the amphitheatre floor
    const washX = (z) => 16 * Math.sin(z * 0.03 + o1) * (1 - smoothstep(150, 200, z));
    let dune = 0;                                                 // left behind by groundH: 0 in a trough .. 1 on a dune's crest
    const groundH = (x, z) => {
      const sd = sdRock(x, z);
      let h = 0.9 * N.fbm2(x * 0.012 + o1, z * 0.012, 3) + 0.3 * N.n2(x * 0.06, z * 0.06 + o2);
      const ap = smoothstep(-30, 2, sd); h += 6 * ap * ap;                               // sand banked against the walls
      const wd = (x - washX(z)) / 8, e = hero.blockE(x, z);
      // low dunes the sun can model: sharp crests running across the wind, dying out toward the wash, the walls and the Arch
      const dr = 1 - Math.abs(N.n2(x * 0.011 + o2 + 0.6 * N.n2(x * 0.02, z * 0.02 + o1), z * 0.027 + 0.004 * x));
      dune = dr * dr * (0.35 + 0.65 * smoothstep(-0.3, 0.5, N.n2(x * 0.006 + o1, z * 0.006 + 31))) * smoothstep(1.2, 3.6, Math.abs(wd)) * (1 - smoothstep(-34, -8, sd)) * smoothstep(1.15, 1.7, e) * (1 - smoothstep(150, 178, z));
      h += 2.6 * dune;
      h -= (4.5 * Math.exp(-wd * wd) - 0.8 * Math.exp(-Math.pow(Math.abs(wd) - 1.9, 2) * 2.2)) * smoothstep(46, 92, z);   // the wash below the pour-off, with a raised bank
      h -= 2.4 * Math.exp(-(x * x + (z - 192) * (z - 192)) / 70);                           // plunge pothole
      h -= 2.0 * (1 - smoothstep(1.0, 1.3, e));                                             // meet the rim block's dipping edge
      h += (0.75 + 0.35 * N.n2(x * 0.05 + o1, z * 0.05)) * smoothstep(0.9, 0.96, e) * (1 - smoothstep(1.05, 1.28, e));   // a drift lapping onto its sill
      h = lerp(-4.5, h, smoothstep(0.86, 0.93, e));                                         // and stay under the sill further in
      const rimZ = -27 + 2.5 * N.n2(x * 0.03, 4.4 + o2);
      return lerp(DESERT_Y, h, smoothstep(rimZ - 5, rimZ, z));
    };
    const GX = 100, GZ = 86, G0X = -150, G0Z = -36, GS = 3, groundBase = VS.vcount;
    const sunHl = Math.hypot(SUN.x, SUN.z) || 1, sunHx = SUN.x / sunHl, sunHz = SUN.z / sunHl;
    // hoodoos on the plain, beside the route's swing: a tall capped one on the outside of the turn, a low pair inside it
    // (clear of the line from the slot's mouth to the Arch). Their shadows are baked into the sand with the ground's own.
    const HD = [];
    {
      const R = makeRng('canyon-of-light:hoodoos:' + ctx.seed);
      // (the tall one stands a fixed distance from the route's own line on the outside of the first turn, clear of its corridor;
      // the low pair stand where they always have, inside the turn, their tops under the line from the route to the Arch. The
      // stream's draws are the three lines the world has always had, in their order.)
      const l0 = [R.range(46, 49), R.range(136, 142), R.range(23, 28), R.range(4.4, 5.2)];
      const beside = (z0, sd, off) => {                           // the point off metres to one side of the route where it crosses z = z0
        let d = dMouth; while (d < L - 60 && path.posAtDist(d, tv).z > z0) d += 0.5;
        right(d, tv2); const k = (tv2.x * swing >= 0 ? 1 : -1) * sd;   // sd = +1: the outside of the swing
        return [tv.x + tv2.x * k * off, tv.z + tv2.z * k * off];
      };
      const b0 = beside(lerp(141, 147, (l0[1] - 136) / 6), 1, 16 + (l0[0] - 46) / 3);
      HD.push({ x: b0[0], z: b0[1], h: 31 + (l0[2] - 23) * 0.8, r: l0[3] + 0.5, cap: true });
      HD.push({ x: swing * R.range(16.5, 18), z: R.range(109, 114), h: R.range(9.5, 12), r: R.range(2.6, 3.1), cap: true });
      HD.push({ x: HD[1].x - swing * R.range(1, 3), z: HD[1].z - R.range(6.5, 8), h: R.range(4.5, 6), r: R.range(1.9, 2.3), cap: false });
      for (const hd of HD) { hd.yb = groundH(hd.x, hd.z) - 2.5; hd.ph = R.range(0, 6.28); hd.ell = R.range(0.1, 0.28); }
      HD.forEach((hd, i) => { rockMat.uniforms.uHoo.value[i].set(hd.x, hd.yb, hd.z, hd.h + 2.5); rockMat.uniforms.uHooR.value[i].set(hd.r, hd.cap ? 1 : 0, 0); });
    }
    const tanEl = SUN.y / sunHl;
    const hoodooShade = (x, y, z) => {
      let sh = 1;
      for (const hd of HD) {
        const dx = hd.x - x, dz = hd.z - z, s0 = dx * sunHx + dz * sunHz;
        if (s0 <= 0 || s0 > 70) continue;
        const hy = y + s0 * tanEl - hd.yb, t = hy / (hd.h + 2.5);
        if (t > 1) continue;
        const rr = hd.r * (1 - 0.48 * Math.pow(Math.max(t, 0), 0.8)) * (hd.cap && t > 0.8 ? 1.25 : 1), perp = Math.hypot(dx - sunHx * s0, dz - sunHz * s0);
        sh = Math.min(sh, smoothstep(rr * 0.7, rr * 1.25 + 1.2, perp) + 0.0);
      }
      return sh;
    };
    for (let iz = 0; iz <= GZ; iz++) {
      const z = G0Z + iz * GS;
      for (let ix = 0; ix <= GX; ix++) {
        const x = G0X + ix * GS, ySun = groundH(x + sunHx * 4, z + sunHz * 4), y = groundH(x, z), v = push(x, y, z);
        VS.slt[v * 4 + 3] = -1000;                                    // (the amphitheatre's floor: the shader gives it its benches, drifts and wash)
        const sd = sdRock(x, z), lee = clamp((ySun - y) / 2.4, 0, 1) * smoothstep(0.02, 0.2, dune + 0.1 * Math.abs(ySun - y));   // ground rising toward the sun: this slope looks away from it
        const sandy = clamp(0.56 + 0.9 * N.fbm2(x * 0.018 + o2, z * 0.018, 2) + 0.5 * smoothstep(-22, 0, sd) + 0.8 * dune, 0.12, 1);   // (the shader cuts this into drift and bare slickrock)
        const t = (0.94 + 0.12 * N.n2(x * 0.04 + o1, z * 0.04)) * (0.9 + 0.2 * dune);   // pale crests, deeper troughs
        const wd = (x - washX(z)) / 6.5, damp = Math.exp(-wd * wd) * smoothstep(46, 92, z) * (0.75 + 0.25 * N.n2(x * 0.09, z * 0.09));
        const tl = t * (1 - 0.32 * lee);
        setV(v, tl * (1 - 0.45 * damp), tl * (1 - 0.55 * damp) * (1 - 0.05 * lee), tl * (1 - 0.6 * damp) * (1 - 0.03 * lee), lerp(1, 0.6, smoothstep(-14, 0, sd)) * (1 - 0.3 * damp), sunVis(x, y + 0.6, z) * (1 - 0.35 * lee), sandy * (1 - 0.5 * damp));   // (the hoodoos' shadows are thrown per pixel by the rock's shader)
        if (ix % 25 === 24) await Y();
      }
      await Y();
    }
    await Y();
    await gridInSteps(6, groundBase, GZ + 1, GX + 1, 0, 1, 0);

    // ------------------------------------------------------------------ boulders and fallen slabs: along the wash, at the cliffs' feet
    const brushOut = [], groundShade = [];                        // (groundShade: x, z, radius, height, strength of the shade each stone or bush lays on the sand)
    {
      const R = makeRng('canyon-of-light:rocks:' + ctx.seed);
      const boulder = (cx, cz, r, sy) => {
        if (r < 1.4) sy = Math.max(sy, 0.74);                              // (a small stone stands up out of the sand: never a flat chip lying on it like a decal)
        // broken sandstone: creased faces between rounded edges; a slab (low sy) keeps a flat bedding-plane top
        const SA = r > 1.5 ? 20 : 14, SV = r > 1.5 ? 12 : 9, base = VS.vcount, sx = R.range(0.8, 1.4), sz = R.range(0.8, 1.35), po = R.range(0, 50), rot = R.range(0, 6.28), slab = sy < 0.5;
        const cy = groundH(cx, cz) + r * sy * 0.36, cr = Math.cos(rot), sr = Math.sin(rot);
        if (path.distanceTo(cx, cy + r * 0.4, cz) < r * 1.5 + 6.8) return;                 // (the route now passes low over the plain: nothing in its corridor)
        for (const hd of HD) if (Math.hypot(cx - hd.x, cz - hd.z) < hd.r * 1.5 + r) return;
        const vis = sunVis(cx, cy + r, cz), visH = vis * hoodooShade(cx, cy + r * 0.5, cz);
        groundShade.push([cx, cz, r * 1.12 * Math.max(sx, sz), r * sy * 1.3, 0.36 + 0.4 * visH]);
        for (let i = 0; i <= SV; i++) {
          const la = (i / SV - 0.5) * Math.PI, cl = Math.cos(la), sl = Math.sin(la);
          for (let j = 0; j <= SA; j++) {
            const th = (j % SA) / SA * Math.PI * 2, nx = cl * Math.cos(th), nz = cl * Math.sin(th);
            const fc = 1 - Math.abs(N.n3(nx * 2.3 + po, sl * 2.3, nz * 2.3)), crease = fc * fc;
            const rr = r * (1 + 0.3 * N.n3(nx * 1.4 + po, sl * 1.4, nz * 1.4 + po) + 0.07 * N.n3(nx * 4 + po, sl * 4, nz * 4)) * (1 - 0.2 * crease);
            const ex = nx * rr * sx, ez = nz * rr * sz, top = slab ? Math.min(sl, 0.4 + 0.05 * N.n2(nx * 2 + po, nz * 2)) : sl;
            const v = push(cx + ex * cr - ez * sr, cy + top * rr * sy, cz + ex * sr + ez * cr), t = (0.84 + 0.2 * N.n2(po, j * 0.4 + i)) * lerp(1, 0.8, smoothstep(0.3, 0.9, sl));   // (tops held down: the shader's slickrock tops are pale)
            setV(v, t, t * 0.96, t * 0.93, lerp(0.3, 1, smoothstep(-0.75, 0.35, sl)) * (1 - 0.45 * crease * crease), vis, sl < -0.2 ? 0.7 : 0);   // (dark where it meets the sand)
          }
        }
        grid(base, SV + 1, SA + 1, -cr, 0, -sr);
      };
      const nWash = R.int(20, 26) * 2, nFeet = R.int(16, 22) * 2;
      for (let i = 0; i < nWash; i++) {
        const z = R.range(58, 186), sd = R.sign(), x = washX(z) + sd * R.range(7, 20) * (R.chance(0.25) ? 0.25 : 1), big = R.chance(0.2);
        if (hero.blockE(x, z) < 1.25) continue;
        const r = big ? R.range(2.2, 3.6) : Math.pow(R(), 1.6) * 1.6 + 0.5;
        boulder(x, z, r, R.chance(0.3) ? R.range(0.3, 0.45) : R.range(0.6, 0.9));
        if (big) for (let k = 0; k < 3; k++) boulder(x + R.range(-1, 1) * r * 1.9, z + R.range(-1, 1) * r * 1.9, R.range(0.4, 1.0), R.range(0.5, 0.9));
        else if (R.chance(0.5)) brushOut.push([x + R.range(-2.5, 2.5), z + R.range(-2.5, 2.5), R.range(0.8, 1.5)]);
        await Y();
      }
      for (let i = 0, tries = 0; i < nFeet && tries < 400; tries++) {
        const an = R.range(-1.75, 1.75), rad = AMPH_R - R.range(5, 26), x = Math.sin(an) * rad * 1.04, z = AMPH_C + Math.cos(an) * rad * (an * an > 2 ? 0.9 : 1);
        const sd = sdRock(x, z);
        if (sd > -4 || sd < -30 || hero.blockE(x, z) < 1.25 || (Math.abs(x) < 26 && z > 150)) continue;
        if (sd > -16 && R.chance(0.22)) boulder(x, z, R.range(4, 6), R.range(0.28, 0.42));                // a slab fallen from the cliff
        else boulder(x, z, Math.pow(R(), 1.4) * 3.2 + 0.7, R.chance(0.35) ? R.range(0.3, 0.45) : R.range(0.6, 0.95));
        if (R.chance(0.4)) brushOut.push([x + R.range(-3, 3), z + R.range(-3, 3), R.range(0.9, 1.7)]);
        i++;
        await Y();
      }
      for (let i = 0; i < 10; i++) { const z = R.range(60, 180); brushOut.push([washX(z) + R.sign() * R.range(9, 15), z, R.range(0.8, 1.6)]); }
      // brush and small stones close under the route's low pass, and round the hoodoos' feet
      for (let i = 0; i < 46; i++) {
        const d = lerp(dMouth + 40, L - 70, R()), sd = R.sign(), off = R.range(5, 16);
        path.posAtDist(d, tv); right(d, tv2);
        const x = tv.x + tv2.x * sd * off, z = tv.z + tv2.z * sd * off;
        if (hero.blockE(x, z) < 1.3) continue;
        if (R.chance(0.5)) brushOut.push([x, z, R.range(0.8, 1.5)]); else boulder(x, z, R.chance(0.25) ? R.range(1.6, 2.4) : R.range(0.5, 1.3), R.range(0.35, 0.8));
        if (i % 6 === 5) await Y();
      }
      for (const hd of HD) for (let i = 0; i < 5; i++) { const a = R.range(0, 6.28), rr = hd.r * R.range(1.7, 2.6); boulder(hd.x + Math.cos(a) * rr, hd.z + Math.sin(a) * rr, R.range(0.5, 1.4) * Math.min(1, hd.r / 3.5), R.range(0.35, 0.8)); }
      await Y();
      // the hoodoos themselves: weathered pinnacles of the same beds, flared at the foot, a harder cap on a narrow neck
      // (not turned on a lathe: the axis wanders and leans, the section is an ellipse that turns with height, beds of unequal
      // hardness stand out as ledges or are eaten back into undercuts at uneven heights, and the cap is a tilted slab that
      // overhangs on one side)
      const bedH = rockMat.uniforms.uBed.value, bedPh = rockMat.uniforms.uStrataPhase.value;
      const hardOf = (n, ph) => { const v = Math.sin(n * 127.1 + ph * 3.7) * 43758.5453; return v - Math.floor(v); };
      for (const hd of HD) {
        const SA = 24, SV = hd.h > 15 ? 46 : 30, base = VS.vcount, ell = 0.25 + (hd.ell - 0.1) / 0.18 * 0.2, HT = hd.h + 2.5;
        const wx0 = N.n2(hd.ph, 0), wz0 = N.n2(hd.ph + 31, 0), lx = Math.cos(hd.ph * 1.7), lz = Math.sin(hd.ph * 1.7);
        for (let i = 0; i <= SV; i++) {
          const t = i / SV, y0 = hd.yb + HT * t;
          let r = hd.r * (1 - 0.48 * Math.pow(t, 0.8)) * (1 + 0.35 * (1 - smoothstep(0, 0.14, t)));
          const f = (y0 + bedPh) / (bedH * 0.5), b0 = Math.floor(f), kb = smoothstep(1 - 0.5 / bedH, 1, f - b0);   // (a rounded step of a quarter of a metre between beds)
          const hv = lerp(hardOf(b0, hd.ph), hardOf(b0 + 1, hd.ph), kb), body = smoothstep(0.1, 0.2, t);
          r *= lerp(1, 0.84 + 0.32 * hv, body);
          if (hd.cap) r *= 1 - 0.3 * smoothstep(0.6, 0.72, t) * (1 - smoothstep(0.79, 0.83, t));   // the neck under the cap
          const capK = hd.cap ? smoothstep(0.8, 0.84, t) : 0;
          r *= Math.sqrt(Math.max(0, 1 - Math.pow(smoothstep(hd.cap ? 0.955 : 0.9, 1, t), 2)));
          const cx = hd.x + hd.r * (0.5 * (N.n2(hd.ph, t * 1.8) - wx0) + 0.35 * t * lx), cz = hd.z + hd.r * (0.5 * (N.n2(hd.ph + 31, t * 1.8) - wz0) + 0.35 * t * lz);
          const mesaVis = sunVis(hd.x, y0, hd.z);
          for (let j = 0; j <= SA; j++) {
            const th = (j % SA) / SA * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th), e = 1 + ell * Math.cos(2 * (th - hd.ph - 1.6 * t));
            const rr = r * (1 + capK * (0.2 + 0.25 * Math.max(0, Math.cos(th - hd.ph))));
            let x = cx + c * rr * e, z = cz + sn * rr / e;
            const y = y0 + capK * 0.3 * rr * Math.cos(th - hd.ph - 0.8);
            const dsp = sculpt.at(x * 1.7, y * 1.3, z * 1.7, 1) * 0.9 * Math.min(1, rr / 2.5);
            x += c * dsp; z += sn * dsp;
            const v = push(x, y, z), tint = (0.92 + 0.14 * N.n3(x * 0.06, y * 0.06, z * 0.06)) * lerp(1, 0.86 + 0.2 * hv, body);
            setV(v, tint, tint, tint, sculpt.cav * lerp(0.6, 1, smoothstep(0, 0.2, t)) * lerp(1, 0.7 + 0.3 * hv, body), mesaVis, Math.max(1 - smoothstep(0.03, 0.07, t), 0.85 * (1 - smoothstep(0.02, 0.1, t))));   // (the foot goes into the drift: sand, not a flat facet of rock)
          }
          if (i % 4 === 3) await Y();
        }
        grid(base, SV + 1, SA + 1, -1, 0, 0);
        await Y();
      }
    }
    await Y();

    // ------------------------------------------------------------------ blocks fallen from the cliffs onto the amphitheatre's floor
    // Banded blocks that came off the cliffs lie out on the floor all the way round the amphitheatre, the largest within a
    // rock-fall's reach of the cliffs' feet, a few rolled further out, each with one or two smaller ones broken off beside it
    // and each with its own shade on the ground. Placed by the cliffs (metres from their feet), clear of the wash, of the
    // Arch's block, of the hoodoos and of the route's corridor; a stream of their own.
    {
      const RB = makeRng('canyon-of-light:floorblocks:' + ctx.seed);
      const fallen = (cx, cz, r, sy) => {
        const SA = r > 1.5 ? 18 : 12, SV = r > 1.5 ? 10 : 8, base = VS.vcount, sx = RB.range(0.8, 1.4), sz = RB.range(0.8, 1.35), po = RB.range(0, 50), rot = RB.range(0, 6.28), slab = sy < 0.5;
        const cy = groundH(cx, cz) + r * sy * 0.34, cr = Math.cos(rot), sr = Math.sin(rot);
        if (path.distanceTo(cx, cy + r * 0.4, cz) < r * 1.5 + 6.8) return;
        for (const hd of HD) if (Math.hypot(cx - hd.x, cz - hd.z) < hd.r * 1.5 + r + 2) return;
        const vis = sunVis(cx, cy + r, cz), visH = vis * hoodooShade(cx, cy + r * 0.5, cz);
        groundShade.push([cx, cz, r * 1.12 * Math.max(sx, sz), r * sy * 1.3, 0.36 + 0.4 * visH]);
        for (let i = 0; i <= SV; i++) {
          const la = (i / SV - 0.5) * Math.PI, cl = Math.cos(la), sl = Math.sin(la);
          for (let j = 0; j <= SA; j++) {
            const th = (j % SA) / SA * Math.PI * 2, nx = cl * Math.cos(th), nz = cl * Math.sin(th);
            const fc = 1 - Math.abs(N.n3(nx * 2.3 + po, sl * 2.3, nz * 2.3)), crease = fc * fc;
            const rr = r * (1 + 0.3 * N.n3(nx * 1.4 + po, sl * 1.4, nz * 1.4 + po) + 0.07 * N.n3(nx * 4 + po, sl * 4, nz * 4)) * (1 - 0.2 * crease);
            const ex = nx * rr * sx, ez = nz * rr * sz, top = slab ? Math.min(sl, 0.4 + 0.05 * N.n2(nx * 2 + po, nz * 2)) : sl;
            const v = push(cx + ex * cr - ez * sr, cy + top * rr * sy, cz + ex * sr + ez * cr), t = (0.8 + 0.2 * N.n2(po, j * 0.4 + i)) * lerp(1, 0.8, smoothstep(0.3, 0.9, sl));
            setV(v, t, t * 0.9, t * 0.84, lerp(0.3, 1, smoothstep(-0.75, 0.35, sl)) * (1 - 0.45 * crease * crease), vis, sl < -0.2 ? 0.7 : 0);
          }
        }
        grid(base, SV + 1, SA + 1, -cr, 0, -sr);
      };
      for (let i = 0; i < 17; i++) {
        const an = RB.range(-2.6, 2.6), reach = i % 4 === 3 ? RB.range(30, 62) : RB.range(7, 30);   // (metres out from the cliff's foot)
        const rad = AMPH_R - reach, x = Math.sin(an) * rad, z = AMPH_C + Math.cos(an) * rad;
        const r = RB.range(1.5, 3.4) * (reach > 30 ? 0.75 : 1), sy = RB.chance(0.3) ? RB.range(0.34, 0.46) : RB.range(0.6, 0.95);
        const o = [RB.range(-1, 1), RB.range(-1, 1), RB.range(0.5, 1.1), RB.range(0.55, 0.9), RB.range(-1, 1), RB.range(-1, 1), RB.range(0.4, 0.9), RB.range(0.55, 0.9)];
        const sd = sdRock(x, z);
        if (sd > -5 || hero.blockE(x, z) < 1.3 || Math.abs(x - washX(z)) < 15 || (Math.abs(x) < 26 && z > 150)) continue;
        fallen(x, z, r, sy);
        fallen(x + o[0] * r * 1.9, z + o[1] * r * 1.9, o[2], o[3]);
        if (i % 2) fallen(x + o[4] * r * 2.4, z + o[5] * r * 2.4, o[6], o[7]);
        await Y();
      }
    }
    await Y();

    // ------------------------------------------------------------------ the open desert beyond the rim
    const DX = 64, DZ = 52, desertBase = VS.vcount;
    for (let j = 0; j <= DZ; j++) {
      const z = 190 - 4600 * Math.pow(j / DZ, 1.75);
      for (let i = 0; i <= DX; i++) {
        const s = i / DX * 2 - 1, x = 5200 * Math.sign(s) * Math.pow(Math.abs(s), 1.9);
        const r = Math.hypot(x, z);
        let y = DESERT_Y + 5 * N.fbm2(x * 0.004 + o1, z * 0.004, 3) + 2 * N.n2(x * 0.02, z * 0.02 + o2)
          + 30 * N.fbm2(x * 0.0009 + o2, z * 0.0009, 2) * smoothstep(350, 1600, r);
        if (z > -40 && Math.abs(x) < 156) y -= 2.5;                // stay under the amphitheatre sheet's skirt
        const v = push(x, y, z);
        VS.slt[v * 4 + 3] = -2000;                                    // (the open desert: the shader gives it its zones)
        const sandy = clamp(0.62 + 0.5 * N.fbm2(x * 0.003 + o1, z * 0.003 + 9, 2), 0.25, 1);
        const t = 0.95 + 0.12 * N.n2(x * 0.006 + o2, z * 0.006);
        setV(v, t * 1.04, t, t * 0.96, 1, sdRock(x, z) > -40 && z > -30 ? sunVis(x, y + 1, z) : 1, sandy);
      }
      if (j % 3 === 2) await Y();
    }
    await Y();
    grid(desertBase, DZ + 1, DX + 1, 0, 1, 0);
    await Y();

    // ------------------------------------------------------------------ far mesas and buttes
    const M = V.fork('mesas');
    const mesas = [];
    // two that frame the view through the Arch, then a scatter to both sides
    mesas.push({ b: M.range(-11, -5), dist: lerp(1050, 1500, (M.range(1500, 2100) - 1500) / 600), r: M.range(170, 260), H: lerp(225, 300, (M.range(150, 215) - 150) / 65) });
    mesas.push({ b: M.range(5, 12), dist: M.range(900, 1300), r: M.range(70, 120), H: lerp(185, 255, (M.range(120, 170) - 120) / 50) });
    const nMesa = M.int(6, 9);
    for (let i = 0; i < nMesa; i++) {
      const sd = i % 2 ? 1 : -1;
      mesas.push({ b: sd * M.range(16, 80), dist: M.range(750, 2700), r: M.range(60, 300), H: M.range(95, 230) });
    }
    for (const sd of [-1, 1]) mesas.push({ x: sd * M.range(980, 1150), z: M.range(150, 260), r: M.range(200, 300), H: M.range(120, 150) });   // cap the escarpments' ends
    // (each a stack of formations a stranger can read from a mile off: a talus apron, a dark red slope-former, a pale ledge, the
    // main orange cliff ribbed into buttresses, a band of shade under the cap, the pale caprock. Beds this thick survive the
    // distance and the haze; the fine beds of the shader do not, and without these a far mesa is one flat pink block)
    const MC = 40, MT1 = [0.7, 0.56, 0.5], MT2 = [1.14, 1.04, 0.9], MT3 = [0.93, 0.8, 0.7], MT4 = [0.6, 0.47, 0.45], MT5 = [1.1, 1.0, 0.86], MTS = [1, 1, 1];
    // height, radius, tint, sand, ao, relief
    const MPROF = [[0, 2.0, MTS, 0.75, 1, 0], [0.16, 1.5, MTS, 0.75, 1, 0], [0.36, 1.14, MTS, 0.35, 1, 0], [0.4, 1.0, MT1, 0, 0.8, 1], [0.53, 0.985, MT1, 0, 0.8, 1], [0.555, 0.93, MT2, 0.1, 0.95, 1], [0.6, 0.925, MT2, 0, 0.95, 1],
      [0.62, 0.92, MT3, 0, 0.85, 1], [0.8, 0.9, MT3, 0, 0.85, 1], [0.825, 0.85, MT4, 0, 0.55, 1], [0.875, 0.845, MT4, 0, 0.55, 1], [0.895, 0.84, MT5, 0, 0.9, 1], [1, 0.825, MT5, 0.15, 0.9, 1], [1.012, 0.52, MT5, 0.15, 0.85, 0], [1.02, 0, MT5, 0.15, 0.85, 0]];
    for (const m of mesas) {
      const br = (m.b || 0) * Math.PI / 180;
      const mx = m.x ?? Math.sin(br) * m.dist, mz = m.z ?? -Math.cos(br) * m.dist - 60;
      const ell = M.range(0.6, 1.5), rot = M.range(0, 3.14), sd0 = M.range(0, 50), spire = m.r < 100;
      const base = VS.vcount;
      for (let k = 0; k < MPROF.length; k++) {
        const [hv, rv, tn, snd, aoK, rel] = MPROF[k];
        for (let c = 0; c < MC; c++) {
          const a = (c % (MC - 1)) / (MC - 1) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
          const rib = 1 - Math.abs(N.n2(ca * 3.4 + sd0, sa * 3.4 + 11));     // buttresses and the alcoves between them, the same up the whole cliff
          let rr = m.r * rv * (1 + 0.3 * N.n2(ca * 1.3 + sd0, sa * 1.3) + rel * (0.07 * N.n2(ca * 5 + sd0, sa * 5 + k * 0.2) + 0.1 * (rib * rib - 0.4)));
          if (spire && rel) rr *= 0.8;
          const ex = ca * rr * ell, ez = sa * rr / ell;
          const x = mx + ex * Math.cos(rot) - ez * Math.sin(rot), z = mz + ex * Math.sin(rot) + ez * Math.cos(rot);
          const y = DESERT_Y - 12 + (m.H + 12) * hv + (hv >= 1 ? 6 * N.n2(ca * 2 + sd0, sa * 2 + 5) : 0);
          const v = push(x, y, z), t = (0.92 + 0.16 * N.n2(sd0 + c * 0.7, k)) * (rel ? 0.82 + 0.3 * rib * rib : 1);
          setV(v, t * tn[0], t * tn[1], t * tn[2], aoK, 1, snd);
        }
      }
      const am = Math.PI + rot;
      grid(base, MPROF.length, MC, Math.cos(am), 0, Math.sin(am));
    }
    await Y();

    // ------------------------------------------------------------------ the desert's depth: ranks of buttes and mesas into the haze
    // Beyond the rim the land goes down in ranks. Nearest, a few hundred metres out on the desert floor, a line of dark red
    // buttes and spires, sharp against everything behind them; then a rank of small mesas; behind those (and among the far
    // tables above) long mesas that lie across the view; and last, low on the horizon, a plateau's wall, all but gone into the
    // haze. Each rank is spread over the bearings the amphitheatre's open rim looks out on (measured from the Arch), one to
    // a share of the arc, at its own distance; the nearest rank stands on the two wings of the view, and a wing begins where a
    // butte no longer meets the ring's disc as the route's own last stretch sees it (below). None stands on one of the far
    // tables above. Two streams of their own: one for the nearest rank, one for the three behind it (round 29: both dealt anew
    // once against live, whose one stream dealt the near rank first). The two far ranks of tables are raised FIRST, against the
    // far tables alone, and the near rank yields to them: nothing the near rank does moves a far rank, by stream or by place.
    {
      const RM = makeRng('canyon-of-light:ranks:' + ctx.seed), RN = makeRng('canyon-of-light:ranks-near:' + ctx.seed);   // (the near rank deals from its own stream, the three far ranks from theirs)
      const have = mesas.map((m) => { const br = (m.b || 0) * Math.PI / 180; return { x: m.x ?? Math.sin(br) * m.dist, z: m.z ?? -Math.cos(br) * m.dist - 60, r: m.r * 1.3 }; });
      const BUTTE = [[0, 2.5, MTS, 0.75, 1, 0], [0.12, 1.8, MTS, 0.75, 1, 0], [0.28, 1.2, MTS, 0.35, 1, 0], [0.32, 1.0, MT1, 0, 0.8, 1], [0.46, 0.975, MT1, 0, 0.8, 1], [0.48, 0.91, MT2, 0.1, 0.95, 1], [0.53, 0.9, MT2, 0, 0.95, 1],
        [0.55, 0.88, MT3, 0, 0.85, 1], [0.82, 0.83, MT3, 0, 0.85, 1], [0.84, 0.76, MT4, 0, 0.55, 1], [0.885, 0.755, MT4, 0, 0.55, 1], [0.9, 0.75, MT5, 0, 0.9, 1], [1, 0.72, MT5, 0.15, 0.9, 1], [1.012, 0.45, MT5, 0.15, 0.85, 0], [1.02, 0, MT5, 0.15, 0.85, 0]];
      const SPIRE = [[0, 3.0, MTS, 0.75, 1, 0], [0.14, 2.1, MTS, 0.75, 1, 0], [0.3, 1.3, MTS, 0.35, 1, 0], [0.34, 1.0, MT1, 0, 0.8, 1], [0.44, 0.94, MT1, 0, 0.8, 1], [0.455, 0.7, MT2, 0.1, 0.95, 1], [0.5, 0.66, MT3, 0, 0.85, 1],
        [0.7, 0.52, MT3, 0, 0.85, 1], [0.715, 0.4, MT4, 0, 0.55, 1], [0.88, 0.33, MT3, 0, 0.8, 1], [0.895, 0.42, MT5, 0, 0.9, 1], [0.985, 0.38, MT5, 0.1, 0.9, 1], [1, 0.2, MT5, 0.15, 0.85, 0], [1.008, 0, MT5, 0.15, 0.85, 0]];
      // (probe: the outline only, its points written to that array and nothing built: for the near rank's rule below)
      const raise = (b, dist, r, H, ell, prof, dk, skew, cool, NC, sd0, probe) => {
        const br = b * Math.PI / 180, mx = Math.sin(br) * dist, mz = -Math.cos(br) * dist - 60, reach = r * 1.15;
        const rot = br + skew;
        if (!probe) {
          if (have.some((q) => Math.hypot(mx - q.x, mz - q.z) < reach + q.r)) return false;
          have.push({ x: mx, z: mz, r: reach * 0.7 });
        }
        const base = VS.vcount, b0 = DESERT_Y - 12 - 28 * smoothstep(350, 1600, dist);   // (the far ground rolls: a far mesa's talus goes down into it)
        for (let k = 0; k < prof.length; k++) {
          const [hv, rv, tn, snd, aoK, rel] = prof[k];
          for (let c = 0; c < NC; c++) {
            const a = (c % (NC - 1)) / (NC - 1) * Math.PI * 2, ca = Math.cos(a), sa = Math.sin(a);
            const rib = 1 - Math.abs(N.n2(ca * 3.4 + sd0, sa * 3.4 + 11));
            const rr = r * rv * (1 + 0.3 * N.n2(ca * 1.3 + sd0, sa * 1.3) + rel * (0.07 * N.n2(ca * 5 + sd0, sa * 5 + k * 0.2) + 0.1 * (rib * rib - 0.4)));
            const ex = ca * rr * ell, ez = sa * rr / ell;
            const x = mx + ex * Math.cos(rot) - ez * Math.sin(rot), z = mz + ex * Math.sin(rot) + ez * Math.cos(rot);
            const y = b0 + (DESERT_Y + H - b0) * hv + (hv >= 1 ? 0.025 * H * N.n2(ca * 2 + sd0, sa * 2 + 5) : 0);
            if (probe) { const q = (k * NC + c) * 3; probe[q] = x; probe[q + 1] = y; probe[q + 2] = z; continue; }
            const v = push(x, y, z), t = (0.92 + 0.16 * N.n2(sd0 + c * 0.7, k)) * (rel ? 0.82 + 0.3 * rib * rib : 1) * dk;
            setV(v, t * tn[0], t * tn[1] * (1 + 0.1 * cool), t * tn[2] * (1 + 0.42 * cool), aoK, 1, snd);   // (rank on rank paler and bluer: the air between)
          }
        }
        if (probe) return true;
        const am = Math.PI + rot;
        grid(base, prof.length, NC, Math.cos(am), 0, Math.sin(am));
        return true;
      };
      // THE NEAR RANK AND THE RING. Over the route's last hundred metres the ring's disc, as the route sees it, meets no butte
      // of the nearest rank: the eyes are the route's own, one every 2.5 m of it from a hundred metres short of its end to three
      // of the ring's radii short of it (nearer than that the disc is wider across than the two wings are apart, and every
      // butte of every rank is behind it); the disc is the ring's own radius about the route's end; a butte is its own outline,
      // every point of it above the ground. The angle between the two, at its least over those eyes, is what the rule holds
      // at three degrees or more; a butte turned about the Arch keeps its outline, so the first bearing at which it is clear is
      // found by halving, for that butte at that range, and its wing begins there.
      const RR = hero.anchors.portalSeat.radius, ringC = path.posAtDist(L, new THREE.Vector3()), EYES = [], PROBE = new Float32Array(15 * 30 * 3), RING_CLEAR = 3;   // (degrees of clear sky between the ring's rim and the inmost butte: the designer's three)
      for (let s = 100; s >= 3 * RR - 1e-6; s -= 2.5) {
        path.posAtDist(L - s, tv);
        const dx = ringC.x - tv.x, dy = ringC.y - tv.y, dz = ringC.z - tv.z, l = Math.hypot(dx, dy, dz);
        EYES.push(tv.x, tv.y, tv.z, dx / l, dy / l, dz / l, Math.asin(Math.min(RR / l, 1)));
      }
      // (the least angle, in degrees, between the outline in PROBE, as raised on bearing 0 and turned about the Arch to bearing
      // b, and the ring's disc, over the eyes; yG: the ground's height there)
      const leastAngle = (b, rows, NC, yG) => {
        const br = b * Math.PI / 180, cb = Math.cos(br), sb = Math.sin(br);
        let least = 1e9;
        for (let e = 0; e < EYES.length; e += 7) {
          const ex = EYES[e], ey = EYES[e + 1], ez = EYES[e + 2], ux = EYES[e + 3], uy = EYES[e + 4], uz = EYES[e + 5];
          let cm = -1;
          for (let k = 0; k < rows; k++) {
            for (let c = 0; c < NC - 1; c++) {
              const q = (k * NC + c) * 3, q2 = k < rows - 1 ? q + NC * 3 : q;
              for (let h = 0; h < (q2 === q ? 1 : 2); h++) {                 // (each point and the middle of the edge up to the next row)
                const f = h * 0.5, py = PROBE[q + 1] + (PROBE[q2 + 1] - PROBE[q + 1]) * f;
                if (py < yG) continue;
                const px = PROBE[q] + (PROBE[q2] - PROBE[q]) * f, pz = PROBE[q + 2] + (PROBE[q2 + 2] - PROBE[q + 2]) * f + 60;
                const vx = px * cb - pz * sb - ex, vy = py - ey, vz = px * sb + pz * cb - 60 - ez;
                const cs = (vx * ux + vy * uy + vz * uz) / (Math.sqrt(vx * vx + vy * vy + vz * vz) || 1);
                if (cs > cm) cm = cs;
              }
            }
          }
          const a = (Math.acos(clamp(cm, -1, 1)) - EYES[e + 6]) * 180 / Math.PI;
          if (a < least) least = a;
        }
        return least;
      };
      const nearRank = [];
      // rank: how many, half the arc in degrees, distance from the Arch, radius, height above the desert, how drawn out across the view, shape, tint,
      // columns round each (the two far ranks stand a few pixels tall and take fewer)
      const RANKS = [
        { n: 6, arc: 52, d: [380, 720], r: [26, 50], H: [84, 168], ell: [0.75, 1.3], dk: 0.8, cool: 0, nc: 30, near: true },
        { n: 6, arc: 55, d: [820, 1150], r: [70, 135], H: [150, 212], ell: [0.8, 1.6], dk: 0.95, cool: 0.25, nc: 30 },
        { n: 5, arc: 50, d: [1500, 2000], r: [180, 300], H: [170, 232], ell: [1.5, 2.3], dk: 1.05, cool: 0.6, nc: 22 },
        { n: 5, arc: 56, d: [2300, 2750], r: [380, 540], H: [300, 380], ell: [1.9, 2.7], dk: 1.1, cool: 1, nc: 22, wall: true },
      ];
      for (const rk of [RANKS[1], RANKS[2], RANKS[0], RANKS[3]]) {   // (the far ranks before the near one, which finds their places taken and tries again; the plateau's wall last, as it was)
        const RD = rk.near ? RN : RM;
        for (let i = 0; i < rk.n; i++) {
          for (let tries = 0; tries < (rk.near ? 6 : 3); tries++) {   // (a wing is narrow: a butte of the near rank that finds its place taken tries again, at a new range and girth)
            const jit = RD.range(-0.32, 0.32);
            let b = -rk.arc + (i + 0.5 + jit) * 2 * rk.arc / rk.n;
            const dist = RD.range(rk.d[0], rk.d[1]), r = RD.range(rk.r[0], rk.r[1]), H = RD.range(rk.H[0], rk.H[1]), ell = RD.range(rk.ell[0], rk.ell[1]);
            const spire = rk.near && RD.chance(0.45), prof = spire ? SPIRE : rk.near ? BUTTE : MPROF, skew = RD.range(-0.25, 0.25), sd0 = RD.range(0, 50);
            const rB = spire ? r * 0.52 : r;                        // (a spire is a slender thing)
            // (the nearest rank stands on the two wings of the view. A wing begins at the first bearing at which this butte, at
            // its range, is clear of the ring's disc from every eye of the route's last stretch, and the rank's shares of the arc
            // are shares of the wings; a butte too broad to be clear anywhere on its wing tries again as another butte)
            let least = 0;
            if (rk.near) {
              const half = rk.n / 2, k = i < half ? half - 1 - i : i - half, sg = i < half ? -1 : 1, yG = DESERT_Y - 28 * smoothstep(350, 1600, dist) - 2;
              raise(0, dist, rB, H, ell, prof, rk.dk, skew, rk.cool, rk.nc, sd0, PROBE);
              if (leastAngle(sg * rk.arc, prof.length, rk.nc, yG) < RING_CLEAR) { await Y(); continue; }
              let lo = 0, hi = rk.arc;
              for (let it = 0; it < 9; it++) { const mid = 0.5 * (lo + hi); if (leastAngle(sg * mid, prof.length, rk.nc, yG) >= RING_CLEAR) hi = mid; else lo = mid; }
              b = sg * (hi + (tries < 3 ? (k + 0.5 + jit) / half : 0.5 + 1.5 * jit) * (rk.arc - hi));   // (.. its own share of the wing first, then anywhere on it)
              least = leastAngle(b, prof.length, rk.nc, yG);
              await Y();
              if (least < RING_CLEAR) continue;
            }
            if (rk.wall) have.length = mesas.length;                // (the plateau's wall is one wall: its lengths may run into one another)
            if (raise(b, dist, rB, H, ell, prof, rk.dk, skew, rk.cool, rk.nc, sd0)) {
              if (rk.near) { const br = b * Math.PI / 180; nearRank.push({ b, dist, x: Math.sin(br) * dist, z: -Math.cos(br) * dist - 60, r: rB, H, spire, least }); }
              break;
            }
          }
          await Y();
        }
      }
      scene.userData.nearRank = nearRank;                           // (the near rank as raised: each butte's place and its least angle to the ring's disc)
    }
    await Y();
    Object.assign(job, { groundH, sunHl, sunHx, sunHz, HD, brushOut, groundShade });
}

async function canyonLight(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, yctx, N, scene, hueShift, bleach, o1, o2, SUN, path, tv, dMouth, rockMat, sunVis, pools, beamLean, beamDir, sL, heroUp, heroE1,
      heroE2, HSH, PIL, heroBump, darkAt, bendK, mouthPool, dC, court, courtD, STEP, dHallC, hallHalf, hallW, slotSt, VS, setV, KF, RW, ROWS, nSlot,
      sides, FC, floorBase, nF, fDune, lip, HALL, LESS, slotRocks, chocks } = job;
    // ------------------------------------------------------------------ one geometry, then bake its light
    const geo = new THREE.BufferGeometry();
    const posA = VS.pos.slice(0, VS.vcount * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(posA, 3));
    await Y();
    geo.setIndex(new THREE.BufferAttribute(VS.idx.slice(0, VS.icount), 1));
    await Y();
    await computeNormalsInSteps(geo, yctx);
    const nor = geo.attributes.normal.array;
    // the weld of floor and wall: one normal for the two points that share a place
    for (let i = 0; i < nF; i++) {
      for (let sd = 0; sd < 2; sd++) {
        const a = slotSt[i].fe[sd].q, b = (floorBase + i * (FC + 1) + (sd ? FC : 0)) * 3;
        const x = nor[a] + nor[b], y = nor[a + 1] + nor[b + 1], z = nor[a + 2] + nor[b + 2], l = Math.hypot(x, y, z) || 1;
        nor[a] = nor[b] = x / l; nor[a + 1] = nor[b + 1] = y / l; nor[a + 2] = nor[b + 2] = z / l;
      }
      if (i % 64 === 63) await Y();
    }

    // warm bounce reaching a point of the slot: from each pool of light (falling off along the canyon,
    // stronger on faces turned toward it and low down near the lit sand) and from the mouth
    const MOUTH_R = 23;                                           // (the day floods the lip and dies out quickly up the slot: the walls round the mouth keep their beds and their depth of colour)
    const LD = [0, 0, 0];                                         // left behind by slotLight: where that light mostly comes from, times how one-sided it is
    const DARK_BASE = 0.1, DARK_FILL = 0.38, DARK_SAND = 0.4;
    const entK = (d) => 1 - smoothstep(18, 52, d);                // the entry hall keeps a little more of the day than the chambers beyond it: the first view is deep, not murk      // the first chambers' shade: what reaches rock and sand with no beam near
    let ownOnly = false;
    const slotLight = (x, y, z, nx, ny, nz, d, lift) => {
      let Lw = lerp(0.3 - 0.11 * bendK(d), DARK_BASE + 0.08 * entK(d), darkAt(d)), sx = 0, sy = 0, sz = 0, sw = 0.25;
      for (const p of pools) {
        if (p.pillar) {
          // a smaller pillar: its pool and its lit dust light the sand and the rock within a few metres, in the round (the
          // chamber's broader fill, below, is kept at half)
          const hx = p.x - x, hz = p.z - z, r2 = hx * hx + hz * hz;
          if (r2 < 3600) {
            const pw = p.pillar * p.power;
            // (sand, and what lies on it. A gatepost of the hall is a blade whose pool is as wide as its core and its flank
            // together: more light lands in it, so the sand under that pool takes half as much again, and no more than before some
            // metres off: the pool burns against the sand beside it)
            if (lift > 1) { const c = p.gate ? pw * 2.3 / (1 + r2 / 10) : pw * 1.5 / (1 + r2 / 14); Lw += c; sy += c; sw += c; }
            else {
              const dy = (p.fy ?? p.y) + 0.5 - y, l = Math.sqrt(r2 + dy * dy) || 1, fc = Math.max(0, (hx * nx + dy * ny + hz * nz) / l), c1 = 4.6 * pw / (1 + l * l / 20);
              Lw += c1 * (0.12 + 0.88 * fc);
              sx += c1 * hx / l; sy += c1 * dy / l; sz += c1 * hz / l; sw += c1;
              const ey = clamp(y, p.y + 2, p.y + 14), ey2 = ey - y, k = (ey - p.y) * beamLean, ex = hx + SUN.x * k, ez = hz + SUN.z * k, l2 = Math.sqrt(ex * ex + ey2 * ey2 + ez * ez) || 1;
              const c2 = 0.8 * pw / (1 + l2 * l2 / 26);
              Lw += c2 * (0.3 + 0.7 * Math.max(0, (ex * nx + ey2 * ny + ez * nz) / l2));
              sx += c2 * ex / l2; sy += c2 * ey2 / l2; sz += c2 * ez / l2; sw += c2;
            }
          }
        }
        if (p.hero) {
          // the hero beam lights what stands round it and nothing else: its pool from below (so the bounce climbs the nearest
          // walls and dies out up them), the blazing dust of its shaft from beside. Both fall off with distance in the round.
          const hx = p.x - x, hz = p.z - z, r2 = hx * hx + hz * hz;
          if (r2 > 8100) continue;
          if (lift > 1) { const rh = Math.sqrt(r2), c = p.power * (1.1 / (1 + r2 / 30) + 0.46 / (1 + rh / 22) * smoothstep(12, 32, rh)); Lw += c; sy += c; sw += c; continue; }   // (.. a narrow one: the sand a few metres off is in shade, so the pool burns)   // (sand, and what lies on it: a halo round the pool)
          // (.. and a long tail: down the entry hall the faces turned to the beam still catch it, so the hall has a warm side and a dark one)
          const dy = p.y + 0.6 - y, l = Math.sqrt(r2 + dy * dy) || 1, fc = Math.max(0, (hx * nx + dy * ny + hz * nz) / l), c1 = 3.5 * p.power / (1 + l * l / 21);
          Lw += c1 * (0.12 + 0.88 * fc) + 0.6 * p.power / (1 + l / 21) * (0.1 + 0.9 * fc) * smoothstep(14, 34, l);
          sx += c1 * hx / l; sy += c1 * dy / l; sz += c1 * hz / l; sw += c1;
          const ey = clamp(y, p.y + 2, p.y + 24), k = (ey - p.y) / heroUp.y, ex = hx + heroUp.x * k, ez = hz + heroUp.z * k, ey2 = ey - y, l2 = Math.sqrt(ex * ex + ey2 * ey2 + ez * ez) || 1;
          const c2 = 0.42 * p.power / (1 + l2 * l2 / 42);
          Lw += c2 * (0.3 + 0.7 * Math.max(0, (ex * nx + ey2 * ny + ez * nz) / l2));
          sx += c2 * ex / l2; sy += c2 * ey2 / l2; sz += c2 * ez / l2; sw += c2;
          continue;
        }
        const al = Math.abs(d - p.d), R = p.R || (p.chamber >= 0 ? 14 : 9);
        if (al > R * 6) continue;
        const cq = p.ch || p;                                    // (the pool's own place; for the blade at the hall's way in, the middle of the chamber it came from)
        const ey = clamp(y, cq.y + lift, cq.y + 15);
        const dx = cq.x - x, dy = ey - y, dz = cq.z - z;
        const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
        const face = 0.3 + 0.7 * Math.max(0, (dx * nx + dy * ny + dz * nz) / l);
        const vq = Math.max(0, y - cq.y) / 24, vf = 1 / (1 + vq * vq);
        const c = p.power * vf / (1 + (al / R) * (al / R)) * (p.pillar ? 0.5 : 1);
        Lw += c * face;
        sx += c * dx / l; sy += c * dy / l; sz += c * dz / l; sw += c;
      }
      // THE HALL: its shafts light the sand and the rock round them as every pillar does (the pool from below, the lit dust
      // from beside), and their dust stands lit all the way up to the hole, so the hall's walls glow far up; all of it inside
      // the hall's own bump along the slot and nowhere else: gold and orange in its heart, down to nothing at its rim
      const hl = ownOnly ? 0 : hallW(d);                           // (ownOnly: the slot's own light alone, as it was before the hall was built)
      if (hl > 0) Lw *= 1 - 0.5 * hl;                              // (the hall is lit by its shafts: the slot's even fill is held down in it, so its far walls and its rim stand in shade)
      if (hl > 0) for (const p of HALL) {
        const hx = p.x - x, hz = p.z - z, r2 = hx * hx + hz * hz, pw = p.k * p.power * hl;
        if (lift > 1) { const c = pw * 1.5 / (1 + r2 / 7); Lw += c; sy += c; sw += c; continue; }
        const dy = p.y + 0.5 - y, l = Math.sqrt(r2 + dy * dy) || 1, fc = Math.max(0, (hx * nx + dy * ny + hz * nz) / l), c1 = 7 * pw / (1 + l * l / 8);
        Lw += c1 * (0.12 + 0.88 * fc);
        sx += c1 * hx / l; sy += c1 * dy / l; sz += c1 * hz / l; sw += c1;
        const ey = clamp(y, p.y + 2, p.y + 30), ey2 = ey - y, k = (ey - p.y) / p.up.y, ex = hx + p.up.x * k, ez = hz + p.up.z * k, l2 = Math.sqrt(ex * ex + ey2 * ey2 + ez * ez) || 1;
        const c2 = 0.85 * pw / (1 + l2 * l2 / 12);
        Lw += c2 * (0.3 + 0.7 * Math.max(0, (ex * nx + ey2 * ny + ez * nz) / l2));
        sx += c2 * ex / l2; sy += c2 * ey2 / l2; sz += c2 * ez / l2; sw += c2;
      }
      const am = Math.max(0, dMouth - d);
      const dx = mouthPool.x - x, dy = mouthPool.y - y, dz = mouthPool.z - 8 - z;
      const l = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1;
      const c = mouthPool.power / (1 + (am / MOUTH_R) * (am / MOUTH_R));
      Lw += c * (lift > 1 ? 0.3 : 0.13 + 0.87 * Math.max(0, (dx * nx + dy * ny + dz * nz) / l));   // (rock that looks back up the canyon stands dark against the day: a frame for the Arch, not a pale pane)
      sx += c * dx / l; sy += c * dy / l; sz += c * dz / l; sw += c;
      LD[0] = sx / sw; LD[1] = sy / sw; LD[2] = sz / sw;
      return Lw;
    };
    const lightAtD = (d) => slotLight(tv.x, tv.y, tv.z, 0, 1, 0, d, 6) - 0.1;   // (after path.posAtDist(d, tv))
    // the light of the slot's own pools at a place, the hall's shafts left out (and the hall's holding-down of the slot's even
    // fill with them): what a thread of sand beside one of the slot's own pillars is picked out by. A thread chooses its ledge by
    // THIS, so a gatepost's thread falls from the ledge its own pillar lights best whatever stands in the hall beyond it.
    const slotLightOwn = (x, y, z, nx, ny, nz, d, lift) => { ownOnly = true; const v = slotLight(x, y, z, nx, ny, nz, d, lift); ownOnly = false; return v; };
    // the slot's sand, wherever it lies (the floor sheet and the drift banked against the walls' feet): tint and bounce grade
    const sandLook = (x, y, z, d, out) => {
      // (in the open court the sand out of the sun is darker and a little cooler: the patch of sun has something to stand against)
      const ct = court(d), Lw = Math.max(0, slotLight(x, y, z, 0, 1, 0, d, 6) - 0.1), m = (lerp(0.8, DARK_SAND + 0.14 * entK(d), darkAt(d)) + 0.9 * Math.min(Lw, 1.5)) * (1 - 0.46 * ct) * (1 - 0.25 * paleK) * (1 - 0.16 * lumK * darkAt(d)) * (1 - 0.3 * heroBump(d, 14)), w = smoothstep(0.15, 1.0, Lw);
      const dkS = darkAt(d) * (1 - w);                          // (sand in the first chambers' shade: deep red-brown, as dark as before, never violet)
      out[0] = m * 1.1 * (1 - 0.1 * ct) * (1 + 0.02 * dkS); out[1] = m * lerp(0.86, 1.0, w) * (1 - 0.06 * dkS); out[2] = m * lerp(0.78, 0.88, w) * (1 + 0.5 * ct) * (1 - 0.12 * dkS); out[3] = clamp(0.16 + 0.62 * Lw, 0.14, 1) * (1 - 0.45 * ct);
      const hS = hallW(d);
      if (hS > 0) { const kh = hS * (1 - w); out[0] *= 1 - 0.46 * kh; out[1] *= 1 - 0.54 * kh; out[2] *= 1 - 0.52 * kh; }   // (the hall's sand away from its pools lies in shade: the pools burn on it)
      return out;
    };
    const sl4 = [0, 0, 0, 0];
    const paleK = smoothstep(0.015, 0.06, bleach), fillBase = 0.5 - 0.24 * paleK;   // (a pale seed gets less fill: its slot keeps a range of values)
    // (a seed whose rock is turned toward amber is as luminous as a bleached one: in the first chambers both get less bounce and
    // less fill than a red one, so the hero beam stands in the same deep shade on every visit)
    const lumK = Math.max(paleK, smoothstep(0.002, 0.016, hueShift));
    const sandAmt = (x, z) => 0.95 + 0.04 * N.n2(x * 0.2, z * 0.2);   // (sand is sand: the rock under it does not ghost through as wavy bands)

    for (const S of sides) {
      const { sgn, st, base, n, cavs } = S;
      for (let i = 0; i < n; i++) {
        const s = st[i];
        for (let k = 0; k < ROWS; k++) {
          const v = base + i * ROWS + k, q = v * 3;
          const x = posA[q], y = posA[q + 1], z = posA[q + 2], nx = nor[q], ny = nor[q + 1], nz = nor[q + 2];
          const cav = cavs[i * ROWS + k], rim = k > RW;
          let r = 1, g = 1, b = 1, ao = 1, vis = 1, sand = 0;
          let rS = 1, gS = 1, bS = 1, aoS = 0, visS = 0, sandS = 0;
          const t0 = s.b;
          if (s.b > 0) {
            const h = y - s.yFloor, H = s.yTop - s.yFloor;
            const dk = darkAt(s.d);
            // (shade sits in the flutes, not on the wall as stains. In the first chambers the bounce is held: only rock within a few
            // metres of the pool burns, the rest keeps its darks, on a pale seed as on a red one)
            const LwRaw = slotLight(x, y, z, nx, ny, nz, s.d, 0.5);
            const cavL = s.mw > 0 ? lerp(cav, 0.6, 0.7 * s.mw) : cav;   // (the lip's rows are eased smooth: the hollows baked there keep only a little of their contrast)
            let Lw = LwRaw * lerp(0.15 + 1.6 * cavL, 0.42 + 1.05 * cavL, s.ct) * (1 - 0.3 * lumK * dk);   // ribs catch the light, hollows lose it (less so under the court's open sky)
            if (Lw > 0.5) Lw = lerp(Lw, 0.5 + (Lw - 0.5) * lerp(0.6, 0.46, lumK), dk);
            const sk = Math.pow(smoothstep(0.3, 1, h / H), 1.6);                  // the sky slit's own light
            // the light's direction for the shader's fine relief: the pools below and along the canyon, the slit above
            { const q3 = v * 3, up = 0.8 * sk, fade = t0 * clamp((k - KF) / 3, 0, 1); VS.ldr[q3] = LD[0] * fade; VS.ldr[q3 + 1] = Math.min(1, LD[1] + up) * fade; VS.ldr[q3 + 2] = LD[2] * fade; }
            const facing = smoothstep(0.02, 0.25, nx * SUN.x + nz * SUN.z);
            const sunTop = rim ? 1 : smoothstep(H - 11, H - 4, h) * facing;
            // the open court: the sun comes over the low wall and catches the crest of the other one, above a wavering line
            const ct = s.ct, far = sgn !== sL;
            const courtSun = ct <= 0 ? 0 : rim ? 1 : far ? smoothstep(-0.35, 0.35, h - (H - 6.5 + 2.2 * N.n2(s.d * 0.06 + o1, 47))) * facing : smoothstep(H - 3, H - 1, h) * facing;
            visS = lerp(sunTop, courtSun, smoothstep(0, 0.5, ct));              // (the beams' pools are drawn per pixel in the shader)
            aoS = clamp(0.13 + 0.62 * Lw + 0.4 * sk + 0.3 * (cav - 0.5), 0.14, 1);
            // (rock in the court's direct sun is seen against the sky: its tint is held down, or the sun would burn it white)
            // (the brightest rock is held: by a beam it turns orange, not cream. In the first chambers the fill is low and the
            // hollows lower still, so the walls away from the hero beam stand in deep shade with every bed still drawn)
            const Lc = Math.min(Lw, 1.0) + 0.12 * Math.min(Math.max(Lw - 1, 0), 0.6), hot = smoothstep(0.9, 1.5, Lw);
            const mk = 1 - smoothstep(4, 64, dMouth - s.d);                 // the last straight to the mouth: low fill, so the walls frame the day in deep orange
            const bk = bendK(s.d);
            const m = Math.min((lerp(lerp(fillBase - 0.04 * bk, 0.36, mk), (DARK_FILL + 0.27 * entK(s.d)) * (1 - 0.2 * lumK * (1 - 0.6 * entK(s.d))), dk) + 0.62 * Lc) * lerp(1, Math.min(0.62 + 0.75 * cavL, 1.12), Math.max(dk, 0.25 * mk, 0.6 * bk)) + 0.45 * sk * (1 - 0.6 * s.cool) * (1 - 0.25 * dk) * (1 - 0.3 * lumK * dk) + lerp(0.9, 0.2, ct) * visS * (rim ? 0 : 1), lerp(9, lerp(1.9, rim ? 0.6 : 0.72, visS), smoothstep(dC - 66, dC - 46, s.d)));   // (.. and so are the tall crests of the slot beyond it, which stand in the court's sky)
            const w = smoothstep(0.22, 1.0, Lw + 0.7 * sk);                     // plum in the folds .. glowing orange by the light
            const cool = 0.16 * sk * Math.max(0, ny);                           // the sky slit's blue on upturned faces
            // (shade stays red: only the shader's fold term adds violet, and only in the deepest hollows)
            // (by the light the rock is glowing orange, not cream; in open shade it is red and deep red-brown, as dark as before)
            { const mp = m * (1 - 0.3 * Math.max(paleK, 0.5 * lumK * dk)), w2 = smoothstep(0.45, 1.2, Lw), shK = dk * (1 - smoothstep(0.12, 0.6, Lw + 0.5 * sk));
              rS = mp * lerp(0.96, 1, w) * (1 + 0.1 * shK); gS = mp * lerp(0.86, 1.12, w) * (1 - 0.17 * w2 - 0.08 * hot) * (1 - 0.1 * shK) + cool * 0.6; bS = mp * lerp(0.86, 0.92, w) * (1 - 0.38 * w2 - 0.2 * hot) * (1 - 0.2 * shK) + cool * 1.6; }   // (a pale seed's walls are held down: ochre and brown, not one cream)
            if (s.hallW > 0) {                                                  // the hall: rock its shafts' light does not reach stands in deeper shade, redder (the glow has something to stand against)
              // (by the light that reaches the place, whatever its flutes: a broad shade, never darker hollows; the folds' own shade is the shader's, as everywhere)
              const kh = s.hallW * (1 - smoothstep(0.3, 1.05, LwRaw)) * (1 - visS);
              rS *= 1 - 0.5 * kh; gS *= 1 - 0.6 * kh; bS *= 1 - 0.57 * kh;
            }
            if (s.cool > 0) {                                                   // under the open sky the shade is the sky's: deep blue-violet, darker than the bounce-lit slot
              const kc = s.cool * (1 - visS) * (1 - smoothstep(0.3, 0.5, visS)) * (1 - smoothstep(0.5, 1.2, lerp(Lw, LwRaw, 0.8))) * (0.5 + 0.5 * smoothstep(2, 10, h)) * (rim ? 0 : 1);
              rS *= lerp(1, 0.55, kc); gS *= lerp(1, 0.5, kc); bS *= lerp(1, 0.98, kc);   // (deep red-brown shade with a breath of plum: a shadow, not a purple cast)
              aoS = Math.max(aoS, 0.34 * s.cool);                               // (no plum blotches in the hollows here: the shade is already the sky's)
            }
            sandS = k <= KF ? 1 : smoothstep(KF + 9, KF, k);                   // sand banked against the wall's foot: the floor's own, welded to it at row KF
            // (and lying on whatever of the foot is flatter than sand's own angle of rest: where a wall flares out low, the beds do
            // not outcrop as a map of wavy contour lines, they go under a drift)
            if (!rim && h < 10) sandS = Math.max(sandS, 0.92 * smoothstep(0.56, 0.76, ny) * (1 - smoothstep(5.5, 10, h)));
            if (sandS > 0) {
              sandLook(x, y, z, s.d, sl4);
              rS = lerp(rS, sl4[0], sandS); gS = lerp(gS, sl4[1], sandS); bS = lerp(bS, sl4[2], sandS); aoS = lerp(aoS, sl4[3], sandS);
              sandS *= sandAmt(x, z);
            }
          }
          if (s.b < 1) {
            const hh = y - s.yBot, tal = 1 - smoothstep(0, s.talus, hh);
            ao = clamp(0.45 + 0.6 * cav + 0.2 * smoothstep(0, 30, hh), 0, 1);
            vis = rim ? 1 : sunVis(x - s.nx * 0.5, y, z - s.nz * 0.5);
            sand = tal * tal * 0.9;
            r = g = b = 0.88 + 0.12 * N.n2(s.a * 0.03, y * 0.05 + sgn * 9);   // (held a little down: deep reds and creams, not pale orange)
          }
          const t = s.b;
          setV(v, lerp(r, rS, t), lerp(g, gS, t), lerp(b, bS, t), lerp(ao, aoS, t), lerp(vis, visS, t), lerp(sand, sandS, t));
        }
        await Y();
      }
      await Y();
    }
    for (const S of sides) {
      const tmp = new Float32Array(nSlot);
      for (let k = KF + 1; k <= KF + 22; k++) {
        for (let i = 0; i < nSlot; i++) tmp[i] = VS.shd[(S.base + i * ROWS + k) * 3 + 2];
        for (let i = 1; i < nSlot - 1; i++) VS.shd[(S.base + i * ROWS + k) * 3 + 2] = 0.25 * tmp[i - 1] + 0.5 * tmp[i] + 0.25 * tmp[i + 1];
      }
      await Y();
    }
    // the fallen blocks on the slot's floor: the walls' own light, darker in their creases and underneath, sand banked round their feet
    for (const rk of slotRocks) {
      const s = rk.s;
      for (let v = rk.base; v < rk.base + rk.n; v++) {
        const q = v * 3, x = posA[q], y = posA[q + 1], z = posA[q + 2], crease = VS.shd[q], up = VS.shd[q + 1];
        const Lw = slotLight(x, y, z, nor[q], nor[q + 1], nor[q + 2], rk.d, 0.5) * (1.1 - 0.5 * crease);
        VS.ldr[q] = LD[0]; VS.ldr[q + 1] = LD[1]; VS.ldr[q + 2] = LD[2];
        // (the slot's rock is lit from below, by the sand: a block's top would go dark, so it is lifted, and dusted with sand)
        const upN = Math.max(0, nor[q + 1]), m = (lerp(fillBase, DARK_FILL, darkAt(rk.d)) + 0.68 * Math.min(Lw, 1.1)) * (1 - 0.3 * s.ct) * (1 + 0.6 * upN), w = smoothstep(0.22, 1.0, Lw);
        let r_ = m * lerp(0.96, 1, w), g_ = m * lerp(0.86, 1.12, w), b_ = m * lerp(0.86, 0.92, w) * 0.9;   // (red-brown blocks, never violet lumps)
        let ao = Math.max(0.36, clamp(0.16 + 0.62 * Lw - 0.25 * crease, 0.14, 1) * lerp(0.5, 1, smoothstep(-0.6, 0.25, up)));
        if (s.cool > 0) { const kc = s.cool * (1 - smoothstep(0.55, 1.25, Lw)) * 0.25; r_ *= lerp(1, 0.55, kc); g_ *= lerp(1, 0.5, kc); b_ *= lerp(1, 0.98, kc); ao = Math.max(ao, 0.34 * s.cool); }   // (no violet blocks on warm sand)
        let sandS = Math.max(1 - smoothstep(-0.5, -0.1, up), 0.7 * smoothstep(0.5, 0.9, upN) * (1 - 0.8 * crease));
        if (sandS > 0) {
          const kd = up < 0 ? 0.22 : 1;
          sandLook(x, y, z, rk.d, sl4);
          r_ = lerp(r_, sl4[0] * kd, sandS); g_ = lerp(g_, sl4[1] * kd, sandS); b_ = lerp(b_, sl4[2] * kd, sandS); ao = lerp(ao, sl4[3] * kd, sandS);
          sandS *= sandAmt(x, z);
        }
        setV(v, r_, g_, b_, ao, 0, sandS);
      }
      await Y();
    }
    // the chockstones: the slot's bounce on the faces turned down to it, the slit's cool light on their tops, deep shade between
    for (const ck of chocks) {
      for (let v = ck.base; v < ck.base + ck.n; v++) {
        const q = v * 3, x = posA[q], y = posA[q + 1], z = posA[q + 2], crease = VS.shd[q], up = VS.shd[q + 1];
        const Lw = slotLight(x, y, z, nor[q], nor[q + 1], nor[q + 2], ck.d, 0.5) * (1.1 - 0.5 * crease);
        VS.ldr[q] = LD[0]; VS.ldr[q + 1] = Math.min(1, LD[1] + 0.6 * Math.max(0, up)); VS.ldr[q + 2] = LD[2];
        const upN = Math.max(0, nor[q + 1]), top = upN * upN, m = (lerp(fillBase, DARK_FILL, darkAt(ck.d)) * 0.8 + 0.62 * Math.min(Lw, 1.1)) * (1 - 0.35 * smoothstep(0.1, -0.7, up) * (1 - Math.min(Lw, 1))), w = smoothstep(0.22, 1.0, Lw);
        setV(v, m * lerp(0.96, 1, w) + 0.34 * top, m * lerp(0.86, 1.12, w) + 0.36 * top, m * lerp(0.86, 0.92, w) * 0.9 + 0.42 * top, clamp(0.14 + 0.62 * Lw + 0.4 * top - 0.2 * crease, 0.14, 1), 0, 0.5 * smoothstep(0.7, 0.95, upN) * (1 - crease));
      }
      await Y();
    }
    // the lip of the pour-off: its sand is the floor's own (so the sheet under it never shows a seam), its bare rock takes the
    // slot's bounce and the day flooding in at the mouth, on the faces turned to them
    for (let v = lip.base; v < lip.base + lip.n; v++) {
      const q = v * 3, x = posA[q], y = posA[q + 1], z = posA[q + 2], bare = VS.shd[q];
      const Lw = slotLight(x, y, z, nor[q], nor[q + 1], nor[q + 2], lip.d, 0.5);
      VS.ldr[q] = LD[0] * bare; VS.ldr[q + 1] = LD[1] * bare; VS.ldr[q + 2] = LD[2] * bare;
      const m = (0.36 + 0.68 * Math.min(Lw, 1.1)) * (1 + 0.5 * Math.max(0, nor[q + 1])), w = smoothstep(0.22, 1.0, Lw);
      sandLook(x, y, z, lip.d, sl4);
      const sn = 1 - bare;
      setV(v, lerp(m * lerp(0.96, 1, w), sl4[0], sn), lerp(m * lerp(0.86, 1.12, w), sl4[1], sn), lerp(m * lerp(0.86, 0.92, w) * 0.9, sl4[2], sn), lerp(clamp(0.2 + 0.62 * Lw, 0.3, 1), sl4[3], sn), 0, sn * sandAmt(x, z));
      if (v % 128 === 127) await Y();
    }
    await Y();
    // the slot's floor: rippled sand, blazing where a beam lands; its low waves lit on their crests and shaded on the face
    // the camera comes toward; a pool of shade round each fallen block
    for (let i = 0; i < nF; i++) {
      const s = slotSt[i];
      for (let jx = 0; jx <= FC; jx++) {
        const v = floorBase + i * (FC + 1) + jx, q = v * 3, x = posA[q], y = posA[q + 1], z = posA[q + 2];
        sandLook(x, y, z, s.d, sl4);
        let f = 1;
        if (jx > 0 && jx < FC) {
          const l = (x - s.cx) * s.rx + (z - s.cz) * s.rz, du = fDune(s.d, l), g = fDune(s.d + 0.7, l) - fDune(s.d - 0.7, l);
          f = (0.9 + 0.2 * du) * (1 - 0.24 * clamp(g * 2.2, 0, 1));
          for (const rk of slotRocks) if (Math.abs(rk.d - s.d) < 6) f *= 1 - 0.55 * (1 - smoothstep(rk.r * 0.75, rk.r * 2.6, Math.hypot(x - rk.x, z - rk.z)));
        }
        setV(v, sl4[0] * f, sl4[1] * f, sl4[2] * f, sl4[3], 0, sandAmt(x, z));
      }
      if (i % 16 === 15) await Y();
    }
    await Y();
    geo.setAttribute('color', new THREE.BufferAttribute(VS.col.slice(0, VS.vcount * 3), 3));
    geo.setAttribute('aShade', new THREE.BufferAttribute(VS.shd.slice(0, VS.vcount * 3), 3));
    await Y();
    geo.setAttribute('aSlot', new THREE.BufferAttribute(VS.slt.slice(0, VS.vcount * 4), 4));
    await Y();
    geo.setAttribute('aLd', new THREE.BufferAttribute(VS.ldr.slice(0, VS.vcount * 3), 3));
    await Y();
    await boundingSphereInSteps(geo, yctx);
    // the same sandstone, drawn two-sided: a portal view that starts a little inside the rock still meets rock, not sky
    const canyonMat = rockMat.clone(); canyonMat.uniforms = rockMat.uniforms; canyonMat.side = THREE.DoubleSide;
    canyonMat.defines = { CANYON: 1 };                           // the slot variant: flute-following bands, plum folds, rippled floor, per-pixel beam pools
    HSH.forEach((h, i) => { rockMat.uniforms.uHeroF.value[i].set(h.x, h.y, h.z); rockMat.uniforms.uHeroE1.value[i].set(heroE1.x, heroE1.y, heroE1.z, h.a); rockMat.uniforms.uHeroE2.value[i].set(heroE2.x, heroE2.y, heroE2.z, h.b); rockMat.uniforms.uHeroK.value[i].set(i ? 1.3 : 0.75, i ? 0.3 : 1); });
    // (a blade of the hall, its three shafts and its two gateposts alike, lands in a pool as wide as its core and its soft flank
    // together, POOL_A and POOL_B times the core's half axes, with a wider and stronger spill round it: BLADE_SPILL)
    PIL.slice(0, 6).forEach((h, j) => { const i = 2 + j, g = !!h.gate; rockMat.uniforms.uHeroF.value[i].set(h.x, h.y, h.z); rockMat.uniforms.uHeroE1.value[i].set(h.e1.x, h.e1.y, h.e1.z, g ? POOL_A * h.a : h.a); rockMat.uniforms.uHeroE2.value[i].set(h.e2.x, h.e2.y, h.e2.z, g ? POOL_B * h.b : h.b); rockMat.uniforms.uHeroK.value[i].set(g ? BLADE_SPILL[0] : 0.95, g ? BLADE_SPILL[1] : 0.9); });
    // (the hall's pools: the same pool as every pillar's, drawn by the rock's shader inside the hall's own round and nowhere else)
    HALL.forEach((h, i) => { rockMat.uniforms.uHallF.value[i].set(h.x, h.y, h.z); rockMat.uniforms.uHallE1.value[i].set(h.e1.x, h.e1.y, h.e1.z, POOL_A * h.a); rockMat.uniforms.uHallE2.value[i].set(h.e2.x, h.e2.y, h.e2.z, POOL_B * h.b); rockMat.uniforms.uHallK.value[i].set(BLADE_SPILL[0], BLADE_SPILL[1]); });
    { path.posAtDist(dHallC, tv); rockMat.uniforms.uHallC.value.set(tv.x, tv.y, tv.z, hallHalf + STEP); }
    // (the lesser shaft's pool in the first slot: a pillar's pool like the others, in the last of the eight places of that list, which no visit's pillars and blades fill; so its pool costs the rock's shader nothing more)
    if (LESS.length) { const h = LESS[0]; rockMat.uniforms.uHeroF.value[7].set(h.x, h.y, h.z); rockMat.uniforms.uHeroE1.value[7].set(h.e1.x, h.e1.y, h.e1.z, h.a); rockMat.uniforms.uHeroE2.value[7].set(h.e2.x, h.e2.y, h.e2.z, h.b); rockMat.uniforms.uHeroK.value[7].set(0.95, 0.9); }
    // THE WARM GLOW ROUND EACH POOL: where a beam meets the sand, the rock and the sand within a few metres of its pool take
    // added warm light from it (the rock's shader: by the pool's own place, falling off with the distance from the pool,
    // strongest on faces that look at the pool; added only, nothing in the folds, no shade changed). One law for every pool:
    // the hero beam's, the pillars' and the blades', the hall's three, the lesser shafts' and the court's; each kind's strength
    // by how much light its beam brings down.
    rockMat.uniforms.uMouthD.value = dMouth;
    rockMat.uniforms.uAmp.value.set(o1, o2, 0, 0);
    rockMat.uniforms.uHeroA.value.copy(heroUp);
    const pC = pools.find((p) => p.court);
    { path.tangentAtDist(pC.d, tv); const l = Math.hypot(tv.x, tv.z) || 1; rockMat.uniforms.uCourtA.value.set(tv.x / l, tv.z / l, 8.0, 3.2); }
    rockMat.uniforms.uCourtC.value.set(pC.x, pC.y, pC.z, 0.4);
    rockMat.uniforms.uCourtD.value.copy(courtD);
    rockMat.uniforms.uBeamDir.value.copy(beamDir);
    // THE GLOW'S COST, CURED BY PLACE AT THE BUILD. Every pool that throws the glow goes into one list for the rock's shader
    // (its middle on the sand, its long axis, its strength, and the distance beyond which its glow is exactly nothing: the
    // shader's own law, 3.2 times the glow's radius from the pool's middle line, so that far and more from its middle point).
    // Then every triangle of the slot is asked, by its own place, whether any point of it lies in reach of any pool's glow
    // (the distance from its middle to the pool's middle, less its own size), and whether any point of it lies in the hall's
    // round; its three corners are marked accordingly (aFar: 1 = out of reach; a
    // corner any of whose triangles is in reach is 0, so over a triangle in reach the mark is exactly 0 everywhere). The
    // shader walks the pools only where the mark is 0: the picture is what it was, pixel for pixel, and a wall far from
    // every pool pays nothing for the glow.
    {
      const U = rockMat.uniforms, GP = U.uGlowP.value, GE = U.uGlowE.value, GS = U.uGlowS.value;
      const setG = (i, F, E, k) => { const R = 2.2 + 1.2 * Math.min(E.w, 3.2), c = Math.min(30, 3.2 * R + 0.8 * E.w + 0.41); GP[i].set(F.x, F.y, F.z, k > 0 ? c * c : 0); GE[i].copy(E); GS[i] = k; };
      for (let i = 0; i < 8; i++) setG(i, U.uHeroF.value[i], U.uHeroE1.value[i], i === 7 ? (LESS.length ? GLOW[3] : 0) : i === 1 || i >= 2 + PIL.length ? 0 : i === 0 ? GLOW[0] : PIL[i - 2].gate ? BLADE_GLOW : GLOW[1]);
      for (let i = 0; i < 3; i++) setG(8 + i, U.uHallF.value[i], U.uHallE1.value[i], i < HALL.length ? BLADE_GLOW : 0);   // (a blade of the hall, shaft or gatepost: the glow of a pool that reads from the court and the passage)
      setG(11, U.uCourtC.value, new THREE.Vector4(U.uCourtA.value.x, 0, U.uCourtA.value.y, U.uCourtA.value.z), GLOW[4]);
      const nV = VS.vcount, far = new Float32Array(nV * 2).fill(1), I = VS.idx, nI = VS.icount, sltA = VS.slt;
      const hc = U.uHallC.value, hr = hc.w;
      const reach = []; for (let i = 0; i < 12; i++) if (GP[i].w > 0) reach.push(GP[i].x, GP[i].y, GP[i].z, Math.sqrt(GP[i].w));
      // (a run of triangles, as a small function of its own asked run after run, so the engine runs it fast: the same sums
      // written in the part's own body took ten times as long)
      const markRun = (t0, t1) => {
        for (let t = t0; t < t1; t += 3) {
          const a = I[t], b = I[t + 1], c = I[t + 2];
          if (sltA[a * 4] > 0 || sltA[b * 4] > 0 || sltA[c * 4] > 0) {     // (the slot's rock and sand alone take the glow)
            const a3 = a * 3, b3 = b * 3, c3 = c * 3, mx = (posA[a3] + posA[b3] + posA[c3]) / 3, my = (posA[a3 + 1] + posA[b3 + 1] + posA[c3 + 1]) / 3, mz = (posA[a3 + 2] + posA[b3 + 2] + posA[c3 + 2]) / 3;
            const rr = Math.sqrt(Math.max((posA[a3] - mx) ** 2 + (posA[a3 + 1] - my) ** 2 + (posA[a3 + 2] - mz) ** 2, (posA[b3] - mx) ** 2 + (posA[b3 + 1] - my) ** 2 + (posA[b3 + 2] - mz) ** 2, (posA[c3] - mx) ** 2 + (posA[c3 + 1] - my) ** 2 + (posA[c3 + 2] - mz) ** 2)) + 0.05;
            let g = false;
            for (let q = 0; q < reach.length && !g; q += 4) { const dx = mx - reach[q], dy = my - reach[q + 1], dz = mz - reach[q + 2], lim = reach[q + 3] + rr; g = dx * dx + dy * dy + dz * dz < lim * lim; }
            if (g) far[a * 2] = far[b * 2] = far[c * 2] = 0;
            if (Math.hypot(mx - hc.x, mz - hc.z) < hr + rr) far[a * 2 + 1] = far[b * 2 + 1] = far[c * 2 + 1] = 0;
          }
        }
      };
      for (let t = 0; t < nI; t += 12288) { markRun(t, Math.min(nI, t + 12288)); await Y(); }
      geo.setAttribute('aFar', new THREE.BufferAttribute(far, 2));
      await Y();
    }
    const canyon = new THREE.Mesh(geo, canyonMat);
    canyon.name = 'canyon'; canyon.frustumCulled = false;
    scene.add(canyon);
    await Y();
    Object.assign(job, { posA, nor, slotLight, slotLightOwn, lightAtD, sandLook, sl4, LD, canyonMat, pC });
}

async function canyonAir(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, scene, V, busy, warm, windy, palette, path, tv, dMouth, pools, beamDir, heroUp, heroE1, heroE2, HSH, beamUp0, PIL, dC, courtD, STEP,
      slotSt, ROWS, floorY } = job;
    // ------------------------------------------------------------------ shared clock, fx set, wind
    const time = { value: 0 };
    const set = fx.fxGroup(); scene.add(set.object);
    const stationAt = (d) => slotSt[clamp(Math.round((d + 10) / STEP), 0, slotSt.length - 1)];
    const wallV = (S, i, k) => (S.base + i * ROWS + k) * 3;
    const cCream = new THREE.Color(palette[0]), cOrange = new THREE.Color(palette[1]);

    // ------------------------------------------------------------------ the white-hot ribbon of sky above the slot
    {
      const rp = [], rc = [], ri = [];
      let nr = 0;
      for (let i = 0; i < slotSt.length; i += 2) {
        const s = slotSt[i], toMouth = dMouth - s.d;
        if (toMouth < 14) break;
        // (the ribbon lies only over the first stretch of slot. From the open court on, the roof is the real, deep blue sky, and
        // a ribbon further down the canyon would be seen from the court, floating over the rims. Toward the court it tapers to a
        // point inside the slit.)
        if (s.d > dC - 62) break;
        const y = s.yFloor + s.rimH + 5, cx = s.cx + s.rx * s.lean, cz = s.cz + s.rz * s.lean, w = 16 * (1 - smoothstep(dC - 100, dC - 64, s.d)) + 0.05;
        const f = smoothstep(14, 40, toMouth);
        rp.push(cx - s.rx * w, y, cz - s.rz * w, cx + s.rx * w, y, cz + s.rz * w);
        rc.push(f, f, f, f, f, f);
        if (nr) ri.push(nr * 2 - 2, nr * 2 - 1, nr * 2 + 1, nr * 2 - 2, nr * 2 + 1, nr * 2);
        nr++;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(rp, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(rc, 3));
      g.setIndex(ri);
      const m = new THREE.MeshBasicMaterial({ vertexColors: true, fog: false, side: THREE.DoubleSide });
      m.color.setRGB(2.5, 2.25, 1.85);
      const ribbon = new THREE.Mesh(g, m); ribbon.name = 'sky-ribbon'; ribbon.frustumCulled = false;
      scene.add(ribbon);
    }

    // ------------------------------------------------------------------ beams standing in the dust
    const beamCol = cCream.clone().lerp(new THREE.Color('#ffdca4'), 0.55);
    // A standing shaft is a real volume: a prism round the shaft whose shader works out, per pixel, how much lit dust the eye
    // looks through (the chord of the view ray inside an elliptic cylinder, cut off at the sand), so it has a hard edge, the
    // right thickness from every side, rays along its length and dust drifting down it. Added to the picture. Seen from outside
    // its front faces are drawn; once the eye is inside it (the hero beam is flown through) its back faces are, with the chord
    // from the eye to the far side, so the lit dust never vanishes as the camera reaches it: near and inside it is only held
    // down (uNear, uNearMin), a glow of gold dust with the dark walls beyond, not a white-out.
    const SHAFT_VERT = /* glsl */`
      varying vec3 vW;
      void main(){ vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
    const SHAFT_FRAG = /* glsl */`
      uniform vec3 uFoot, uUp, uCol, uEnds; uniform vec4 uE1, uE2; uniform float uTime, uLen, uSeed, uDens, uSoft, uNearMin, uCap; uniform vec2 uNear; uniform vec3 uFar;
      varying vec3 vW;
      float sh31(vec3 p){ p = fract(p*0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
      float sn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
        return mix(mix(mix(sh31(i), sh31(i + vec3(1,0,0)), f.x), mix(sh31(i + vec3(0,1,0)), sh31(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(sh31(i + vec3(0,0,1)), sh31(i + vec3(1,0,1)), f.x), mix(sh31(i + vec3(0,1,1)), sh31(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){
        vec3 rd = vW - cameraPosition; rd /= max(length(rd), 1e-3);
        vec3 oc = cameraPosition - uFoot;
        vec2 o2 = vec2(dot(oc, uE1.xyz)/uE1.w, dot(oc, uE2.xyz)/uE2.w), d2 = vec2(dot(rd, uE1.xyz)/uE1.w, dot(rd, uE2.xyz)/uE2.w);
        float A = max(dot(d2, d2), 1e-6), B = dot(o2, d2), C = dot(o2, o2) - 1.0, disc = B*B - A*C;
        bool inside = C < 0.7;                                            // the eye is in the shaft, or within a step of it
        if (inside == gl_FrontFacing) discard;
        if (disc <= 0.0) discard;
        float sq = sqrt(disc), t0 = max((-B - sq)/A, 0.0), t1 = (-B + sq)/A;
        if (rd.y < -1e-3) t1 = min(t1, -oc.y/rd.y);                       // the shaft ends on the sand
        float ru = dot(rd, uUp);
        if (ru > 1e-3) t1 = min(t1, (uLen - dot(oc, uUp))/ru);            // and at its top
        float ch = t1 - t0;
        if (ch <= 0.0) discard;
        // rays: the shaft is a sheaf of brighter and dimmer blades (the ragged edge of the slit it comes through), seen as
        // streaks that run its whole length; they shift slowly, and change as the eye moves round it
        vec3 pm = oc + rd*(t0 + 0.5*ch);
        vec2 qm = vec2(dot(pm, uE1.xyz), dot(pm, uE2.xyz));
        vec2 vd = vec2(dot(rd, uE1.xyz), dot(rd, uE2.xyz));
        float lat = dot(qm, normalize(vec2(-vd.y, vd.x) + 1e-5));
        float streak = sn3(vec3(lat*1.5 + uSeed, uSeed*0.7, uTime*0.05))*0.78 + sn3(vec3(lat*4.7 - uSeed, 3.0, uTime*0.08))*0.22;
        streak = 0.4 + 1.25*smoothstep(0.2, 0.85, streak);
        float I = 0.0;
        for (int i = 0; i < 3; i++) {
          vec3 p = oc + rd*(t0 + ch*(0.2 + 0.3*float(i)));
          float al = dot(p, uUp);
          vec2 q = vec2(dot(p, uE1.xyz), dot(p, uE2.xyz));
          // rays that run the length of the shaft (the ragged edge of the slit it comes through), slowly shifting
          float ray = sn3(vec3(q*1.5 + uSeed, uTime*0.05))*0.6 + sn3(vec3(q*4.1 - uSeed, uTime*0.09 + 3.0))*0.4;
          // dust sinking through it and drifting across
          float dust = sn3(vec3(q.x*0.9, al*0.3 + uTime*0.24, q.y*0.9 + uTime*0.07) + uSeed)*0.72 + sn3(vec3(q.x*2.6 + 7.0, al*1.0 + uTime*0.55, q.y*2.6))*0.28;
          float clump = sn3(vec3(q*0.35 + uSeed, al*0.13 + uTime*0.07));       // thicker and thinner dust down its length, sinking
          // (it thins toward the sand, where the pool takes over, and melts into it: light in air, not a rod standing on the floor)
          // (.. and a finer grain of dust that sinks faster: seen from close by, the shaft is drifting dust, never one flat tone)
          float fineD = sn3(vec3(q.x*5.3 + 3.0, al*2.3 + uTime*0.9, q.y*5.3 - uTime*0.11));
          I += (0.62 + 0.76*smoothstep(0.28, 0.72, ray))*(0.5 + 0.84*dust + 0.3*(fineD - 0.5))*(0.42 + 1.16*clump)*(1.0 - smoothstep(uLen*uEnds.y, uLen, al))*mix(uEnds.z, 1.0, smoothstep(-0.3, uEnds.x, al))*(1.0 - 0.3*smoothstep(7.0, 30.0, al));
        }
        // (lit dust is thin: the wall behind shows through it. Light, not a plank: the shaft burns along its axis and falls to
        // a third of that at its edge, which is still hard (the dust is lit or it is not); a soft one melts away to nothing)
        float cn = clamp(ch*sqrt(A)*0.5, 0.0, 1.0);                      // 1 on a line through the axis, 0 grazing the edge
        float c2 = cn*cn, prof = mix(mix(0.2, 1.0, c2*c2), c2*cn, uSoft);
        float nearK = smoothstep(uNear.x, uNear.y, t0);
        float a = (0.05 + 0.95*(1.0 - exp(-ch*uDens)))*prof*smoothstep(0.0, mix(0.45, 1.25, uSoft), ch)*mix(streak, 0.8 + 0.25*streak, smoothstep(0.7, 1.0, uSoft))*I/3.0*mix(uNearMin, 1.0, nearK)*(1.0 - uFar.z*smoothstep(uFar.x, uFar.y, t0));   // (a soft sheet far down the canyon is a breath of light, not a pale bar)
        // (from inside and from close by, the lit dust is capped: however long the eye's line through the shaft, it adds no more
        // than a thin gold haze, so the walls beyond keep their beds for the whole crossing; near dust is gold, far dust pale)
        float cap = mix(uCap, 8.0, nearK);
        a = cap*(1.0 - exp(-a/max(cap, 1e-3)));
        gl_FragColor = vec4(uCol*mix(vec3(1.0, 0.72, 0.4), vec3(1.0), nearK)*a, 1.0);
      }`;
    const shaftGeo = (f, up, e1, e2, a, b, len) => {
      const n = 20, k = 1.06 / Math.cos(Math.PI / n), P = [], I = [];
      for (let r = 0; r < 2; r++) for (let i = 0; i < n; i++) {
        const th = i / n * Math.PI * 2, c = Math.cos(th) * a * k, sn = Math.sin(th) * b * k, al = r ? len : 0.25;
        P.push(f.x + up.x * al + e1.x * c + e2.x * sn, f.y + up.y * al + e1.y * c + e2.y * sn, f.z + up.z * al + e1.z * c + e2.z * sn);
      }
      // (closed at both ends, just above the sand and at the top: from inside, every ray leaves through a face)
      P.push(f.x + up.x * 0.25, f.y + up.y * 0.25, f.z + up.z * 0.25, f.x + up.x * len, f.y + up.y * len, f.z + up.z * len);
      for (let i = 0; i < n; i++) { const j = (i + 1) % n; I.push(i, j, n + j, i, n + j, n + i, 2 * n, j, i, 2 * n + 1, n + i, n + j); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); return g;
    };
    const addShaft = (f, up, e1, e2, a, b, len, col, near, seed, dens, soft = 0, ends = [2.6, 0.55, 0], nearMin = 0, far = [1e5, 2e5, 0], cap = 0.16) => {
      const m = new THREE.ShaderMaterial({
        uniforms: {
          uTime: time, uFoot: { value: new THREE.Vector3(f.x, f.y, f.z) }, uUp: { value: up.clone() }, uE1: { value: new THREE.Vector4(e1.x, e1.y, e1.z, a) }, uE2: { value: new THREE.Vector4(e2.x, e2.y, e2.z, b) },
          uCol: { value: col }, uLen: { value: len }, uSeed: { value: seed }, uDens: { value: dens }, uSoft: { value: soft }, uEnds: { value: new THREE.Vector3(ends[0], ends[1], ends[2]) }, uNear: { value: new THREE.Vector2(near[0], near[1]) }, uNearMin: { value: nearMin }, uCap: { value: cap }, uFar: { value: new THREE.Vector3(far[0], far[1], far[2]) },
        },
        vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true,
      });
      const mesh = new THREE.Mesh(shaftGeo(f, up, e1, e2, a, b, len), m); mesh.name = 'shaft'; mesh.frustumCulled = false; mesh.renderOrder = 2;
      scene.add(mesh);
      return m;
    };
    // The court's beam is sun in dusty air: the same volume (an elliptic column down the light, long along the canyon, ending
    // on the sand), but its dust is lit most along its axis and less and less toward its sides, with no edge anywhere: the
    // shader takes the eye's whole line through that falling-off light in closed form, so the beam has a bright core and
    // melts away at its flanks from every side and at every range. Down the light run fine rays (brighter and dimmer
    // streaks of dust, slowly shifting, the finest kept only while they are wider than a pixel): distinct where the sun
    // comes in under the rim, each ending at its own height below it, and melting into one glow toward the sand, where the
    // beam thins and its patch takes over. It is added light and never much of it: what stands behind is seen through it
    // in its own colour. What stands in it and is not air hides the dust behind it (uOcc: the sapling's crown).
    const BEAM_FRAG = /* glsl */`
      uniform vec3 uFoot, uUp, uCol, uFar, uOccR; uniform vec4 uE1, uE2, uOcc; uniform float uTime, uLen, uTop, uSeed, uDens, uNearMin, uCap; uniform vec2 uNear;
      varying vec3 vW;
      float sh31(vec3 p){ p = fract(p*0.3183099 + vec3(0.71, 0.113, 0.419)); p *= 17.0; return fract(p.x*p.y*p.z*(p.x + p.y + p.z)); }
      float sn3(vec3 x){ vec3 i = floor(x), f = fract(x); f = f*f*(3.0 - 2.0*f);
        return mix(mix(mix(sh31(i), sh31(i + vec3(1,0,0)), f.x), mix(sh31(i + vec3(0,1,0)), sh31(i + vec3(1,1,0)), f.x), f.y),
                   mix(mix(sh31(i + vec3(0,0,1)), sh31(i + vec3(1,0,1)), f.x), mix(sh31(i + vec3(0,1,1)), sh31(i + vec3(1,1,1)), f.x), f.y), f.z); }
      void main(){
        vec3 rd = vW - cameraPosition; rd /= max(length(rd), 1e-3);
        vec3 oc = cameraPosition - uFoot;
        vec2 o2 = vec2(dot(oc, uE1.xyz)/uE1.w, dot(oc, uE2.xyz)/uE2.w), d2 = vec2(dot(rd, uE1.xyz)/uE1.w, dot(rd, uE2.xyz)/uE2.w);
        float A = max(dot(d2, d2), 1e-6), B = dot(o2, d2), C = dot(o2, o2) - 1.0, disc = B*B - A*C;
        bool inside = C < 0.7;
        if (inside == gl_FrontFacing) discard;
        if (disc <= 0.0) discard;
        float tm = -B/A, hh = sqrt(disc)/A;                                 // the middle of the line's run through the column, and half its length
        float t0 = max(tm - hh, 0.0), t1 = tm + hh;
        if (rd.y < -1e-3) t1 = min(t1, -oc.y/rd.y);                         // the beam ends on the sand
        float ru = dot(rd, uUp);
        if (ru > 1e-3) t1 = min(t1, (uLen - dot(oc, uUp))/ru);              // and at its top
        float ch = t1 - t0;
        if (ch <= 0.0) discard;
        float seenK = 1.0;                                                  // the share of that dust the eye sees: less where the crown stands in the way
        {
          vec3 pc = (cameraPosition - uOcc.xyz)/uOccR, dc = rd/uOccR;
          float qa = max(dot(dc, dc), 1e-6), qb = dot(pc, dc), qc = dot(pc, pc) - 1.0, qh = qb*qb - qa*qc;
          if (qh > 0.0) { float te = (-qb - sqrt(qh))/qa; if (te > 0.0 && te < t1) seenK = (max(te - t0, 0.0) + (1.0 - uOcc.w)*(t1 - max(te, t0)))/max(ch, 1e-3); }
        }
        // the light across the beam: (1 - r2)^2, and a core (1 - r2)^4, r the share of the way from the axis to the column's
        // side. Along the eye's line 1 - r2 = c2*(1 - s*s), s running -1..1 over the whole chord, so both integrate exactly.
        float c2 = clamp(disc/A, 0.0, 1.0);
        float s0 = clamp((t0 - tm)/max(hh, 1e-4), -1.0, 1.0), s1 = clamp((t1 - tm)/max(hh, 1e-4), -1.0, 1.0);
        float a0 = s0*s0, a1 = s1*s1;
        float F2 = s1*(1.0 - a1*(0.66667 - 0.2*a1)) - s0*(1.0 - a0*(0.66667 - 0.2*a0));
        float F4 = s1*(1.0 - a1*(1.33333 - a1*(1.2 - a1*(0.57143 - 0.11111*a1)))) - s0*(1.0 - a0*(1.33333 - a0*(1.2 - a0*(0.57143 - 0.11111*a0))));
        float W = hh*c2*c2*(0.75*max(F2, 0.0) + 1.3*c2*c2*max(F4, 0.0));     // metres of lit dust on this line, weighted by where they lie in the beam
        // rays: streaks that run the beam's whole length. A line of sight keeps one distance from the beam's axis all the
        // way through it; the rays are read off that distance, so they are streaks down the light from every side
        vec3 pm = oc + rd*(t0 + 0.5*ch);
        vec2 qm = vec2(dot(pm, uE1.xyz), dot(pm, uE2.xyz)), vd = vec2(dot(rd, uE1.xyz), dot(rd, uE2.xyz));
        float lat = dot(qm, normalize(vec2(-vd.y, vd.x) + 1e-5));
        float pxl = (t0 + 0.5*ch)*0.0016;                                   // about a pixel, in metres, at the beam
        float k2 = 1.0 - smoothstep(0.2, 0.5, 2.3*pxl), k3 = 1.0 - smoothstep(0.2, 0.5, 6.1*pxl);
        float rayN = 0.5*sn3(vec3(lat*0.85 + uSeed, 1.7, uTime*0.03)) + 0.3*mix(0.5, sn3(vec3(lat*2.3 - uSeed, 5.1, uTime*0.045)), k2) + 0.2*mix(0.5, sn3(vec3(lat*6.1 + 2.0*uSeed, 9.3, uTime*0.06)), k3);
        float rays = smoothstep(0.36, 0.64, rayN);
        float tip = sn3(vec3(lat*1.3 + 11.0 + uSeed, 3.3, uTime*0.02));     // how far up under the rim each ray is seen
        float I = 0.0;
        for (int i = 0; i < 3; i++) {
          vec3 p = oc + rd*(t0 + ch*(0.2 + 0.3*float(i)));
          float al = dot(p, uUp), hN = al/max(uTop, 1.0);
          vec2 q = vec2(dot(p, uE1.xyz), dot(p, uE2.xyz));
          // dust in slow curls drawn out down the light, sinking
          float dust = sn3(vec3(q.x*0.45 + uSeed, al*0.16 + uTime*0.13, q.y*0.8 + uTime*0.04))*0.65 + sn3(vec3(q.x*1.3, al*0.5 + uTime*0.3, q.y*2.0 - uTime*0.06) + 7.0)*0.35;
          float topE = mix(0.64, 1.0, tip);
          float top = 1.0 - smoothstep(topE - 0.3, topE, hN);               // (no level end: a fringe of rays, gone below the rim)
          float fall = mix(0.45, 1.0, smoothstep(0.0, 0.6, hN));             // (brightest where it comes in; it thins toward the sand)
          float kc = mix(0.5, 0.95, smoothstep(0.08, 0.55, hN));            // (the rays are distinct high up and melt together lower down)
          I += (0.5 + 1.0*dust)*top*fall*mix(1.0, 0.45 + 1.2*rays, kc)*mix(0.5, 1.0, smoothstep(-0.3, 2.5, al));
        }
        float nearK = smoothstep(uNear.x, uNear.y, t0);
        float a = (1.0 - exp(-W*seenK*uDens))*I/3.0*mix(uNearMin, 1.0, nearK)*(1.0 - uFar.z*smoothstep(uFar.x, uFar.y, t0));
        float cap = mix(uCap, 8.0, nearK);                                  // (from inside and close by it is held to a thin gold haze, as every shaft is)
        a = cap*(1.0 - exp(-a/max(cap, 1e-3)));
        gl_FragColor = vec4(uCol*mix(vec3(1.0, 0.72, 0.4), vec3(1.0, 0.9, 0.7), nearK)*a, 1.0);
      }`;
    const addBeam = (f, up, e1, e2, a, b, len, top, col, near, seed, dens, nearMin, far, cap) => {
      const m = new THREE.ShaderMaterial({
        uniforms: {
          uTime: time, uFoot: { value: new THREE.Vector3(f.x, f.y, f.z) }, uUp: { value: up.clone() }, uE1: { value: new THREE.Vector4(e1.x, e1.y, e1.z, a) }, uE2: { value: new THREE.Vector4(e2.x, e2.y, e2.z, b) },
          uCol: { value: col }, uLen: { value: len }, uTop: { value: top }, uSeed: { value: seed }, uDens: { value: dens }, uNear: { value: new THREE.Vector2(near[0], near[1]) }, uNearMin: { value: nearMin }, uCap: { value: cap },
          uFar: { value: new THREE.Vector3(far[0], far[1], far[2]) }, uOcc: { value: new THREE.Vector4(0, -1e4, 0, 0) }, uOccR: { value: new THREE.Vector3(1, 1, 1) },
        },
        vertexShader: SHAFT_VERT, fragmentShader: BEAM_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true,
      });
      const mesh = new THREE.Mesh(shaftGeo(f, up, e1, e2, a, b, len), m); mesh.name = 'court-beam'; mesh.frustumCulled = false; mesh.renderOrder = 2;
      scene.add(mesh);
      return m;
    };
    let courtBeam = null;
    // motes blazing inside a shaft: points that sink slowly down it, each a speck that twinkles as it turns (lit dust is seen
    // only where the light is: these live inside the shafts, nowhere else)
    const moteMats = [];
    const MOTE_VERT = /* glsl */`
      attribute vec4 aSeed;
      uniform vec3 uFoot, uUp; uniform vec4 uE1, uE2; uniform float uTime, uLen, uPx, uFall;
      varying float vA;
      void main(){
        float al = fract(aSeed.x - uTime*uFall*(0.5 + aSeed.w))*uLen;       // (uFall: 0.011 for motes that sink; several times that for grains of sand that fall)
        float ang = aSeed.y*6.2832 + uTime*0.16*(aSeed.w - 0.5), rad = sqrt(aSeed.z)*0.94;
        vec3 p = uFoot + uUp*al + uE1.xyz*(uE1.w*rad*cos(ang)) + uE2.xyz*(uE2.w*rad*sin(ang));
        // (each mote wanders on its own slow eddy as it sinks)
        p += 0.34*vec3(sin(uTime*0.43 + aSeed.x*40.0) + 0.5*sin(uTime*1.1 + aSeed.z*17.0), sin(uTime*0.37 + aSeed.y*31.0), cos(uTime*0.4 + aSeed.z*27.0) + 0.5*cos(uTime*0.9 + aSeed.x*23.0));
        vec4 mv = viewMatrix*vec4(p, 1.0);
        gl_Position = projectionMatrix*mv;
        // (specks: never larger than about a hundred-and-seventieth of the picture's height, and gone before they pass the eye as discs)
        float d = max(-mv.z, 0.5), px = uPx*(0.022 + 0.034*aSeed.w)/d, pmax = max(1.5, uPx*0.0074);
        vA = (0.3 + 0.7*abs(sin(uTime*(1.0 + 2.5*aSeed.w) + aSeed.x*90.0)))*clamp(px/1.3, 0.3, 1.0)*smoothstep(1.4, 5.5, d)*(1.0 - smoothstep(0.75, 1.0, al/uLen));
        gl_PointSize = clamp(px, 1.3, pmax);
      }`;
    const MOTE_FRAG = /* glsl */`
      uniform vec3 uCol; varying float vA;
      void main(){ vec2 d = gl_PointCoord - 0.5; gl_FragColor = vec4(uCol*vA*(1.0 - smoothstep(0.12, 0.5, length(d))), 1.0); }`;
    const addMotes = (h, up, e1, e2, nM, len, rnd, gain, fall = 0.011) => {
      const sd = new Float32Array(nM * 4);
      for (let i = 0; i < nM * 4; i++) sd[i] = rnd();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nM * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
      const m = new THREE.ShaderMaterial({
        uniforms: { uTime: time, uFoot: { value: new THREE.Vector3(h.x, h.y, h.z) }, uUp: { value: up.clone() }, uE1: { value: new THREE.Vector4(e1.x, e1.y, e1.z, h.a) }, uE2: { value: new THREE.Vector4(e2.x, e2.y, e2.z, h.b) }, uCol: { value: new THREE.Color('#ffc978').multiplyScalar(gain) }, uLen: { value: len }, uPx: { value: 400 }, uFall: { value: fall } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: MOTE_VERT, fragmentShader: MOTE_FRAG,
      });
      const pts = new THREE.Points(g, m); pts.name = 'shaft-motes'; pts.frustumCulled = false; pts.renderOrder = 3;
      scene.add(pts); moteMats.push(m);
    };
    const latOf0 = (s, x, z) => (x - s.cx) * s.rx + (z - s.cz) * s.rz;
    const RP_ = makeRng('canyon-of-light:pillars:' + ctx.seed);    // (the pillars' own stream: the layout's stream keeps its draws)
    const beamUp = beamDir.clone().multiplyScalar(-1);
    for (const p of pools) {
      if (p.glow) { if (p.chamber === 0) { V.fork('ray' + p.u); V.fork('mote' + p.u); } continue; }   // (the stream keeps its draws)
      if (p.court) {
        // the court's sunbeam: a slanting beam of sun from the low rim to its hard-edged patch on the floor, dust blazing in it
        const len = 19.5 / courtD.y;                                // (from the low rim's height down)
        const cr = V.fork('ray-court');                             // (the court shaft's own stream)
        // (lit dust, as long along the canyon as the patch it lands on, brightest down its middle. It is seen in the air from
        // the moment the court comes into view, standing on the sapling; beside the eye it is held down to a gold haze)
        {
          path.tangentAtDist(p.d, tv); const tl = Math.hypot(tv.x, tv.z) || 1;
          const e1 = new THREE.Vector3(tv.x / tl, 0, tv.z / tl); e1.addScaledVector(courtD, -e1.dot(courtD)).normalize();
          const e2 = new THREE.Vector3().crossVectors(courtD, e1).normalize(), sC = stationAt(p.dP);
          const foot = { x: p.x, y: floorY(sC, latOf0(sC, p.x, p.z)) - 0.15, z: p.z }, gain = p.power * (0.9 + 0.25 * warm);
          // (its foot on the court's pool, its slant the court's light; it dims with distance and never hides what stands
          // behind it; the sapling's crown stands in it and is not washed out by it)
          courtBeam = addBeam(foot, courtD, e1, e2, 7.4, 2.75, len * 1.04, len, beamCol.clone().multiplyScalar(1.1 * gain), [4, 17], cr.range(0, 40), 0.24, 0.3, [90, 170, 0.35], 0.2);
          // (.. and a breath of glowing air close round it, gone below the rim as the beam is)
          addShaft(foot, courtD, e1, e2, 9.4, 3.9, len, beamCol.clone().multiplyScalar(0.12 * gain), [4, 17], cr.range(0, 40), 0.2, 1, [3.0, 0.45, 0.4], 0.4, [90, 170, 0.4], 0.2);
          await Y();
          const mr = makeRng('canyon-of-light:courtmotes:' + ctx.seed);
          addMotes({ x: foot.x, y: foot.y, z: foot.z, a: 7.0, b: 1.55 }, courtD, e1, e2, Math.round(1500 * busy), len * 0.8, mr, 1.5);   // (the motes blaze in the beam's core, nowhere else)
          // grains of sand let go from the rim fall down the light and catch in it (a stream of their own)
          addMotes({ x: foot.x, y: foot.y, z: foot.z, a: 6.4, b: 1.4 }, courtD, e1, e2, Math.round(300 * busy), len * 0.96, makeRng('canyon-of-light:courtgrains:' + ctx.seed), 2.3, 0.075);
        }
        await Y();
        // (its dust is lit only inside the beam: a narrow column down the light, under the rims, never points against the sky)
        set.add(fx.makeParticles({
          rng: V.fork('mote-court'), preset: 'dust', time, follow: false, center: [p.x + courtD.x * 4.5 / courtD.y, p.y + 4.5, p.z + courtD.z * 4.5 / courtD.y], box: [5, 8, 5],
          count: Math.round(900 * busy), size: [0.02, 0.05], intensity: 1.3, colors: ['#ffe2b4', '#ffd9a0', '#ffb877'], velocity: [0.15 * windy, -0.12, 0.1], turbulence: [0.9, 0.5, 0.9],
        }));
        await Y();
        continue;
      }
      if (p.hero) {
        const sr = V.fork('ray' + p.u), mr = V.fork('mote' + p.u), gain = p.power * (0.95 + 0.2 * warm);
        // (the camera flies into it: near and inside, the lit dust is held to about half, never faded out)
        // (a soft falloff across it, brightest along its axis; the ray beside it softer and fainter still. From inside, the dust
        // blazes gold but is held: the far wall's beds are seen through it for the whole crossing)
        HSH.forEach((h, i) => addShaft(h, heroUp, heroE1, heroE2, h.a, h.b, 46, beamCol.clone().multiplyScalar((i ? 0.5 : 2.0) * gain * h.k), i ? [4, 18] : [3, 20], sr.range(0, 40), i ? 0.6 : 0.5, i ? 0.9 : 0.42, i ? [6, 0.4, 0.04] : [4.5, 0.55, 0.12], i ? 0.08 : 0.2, [1e5, 2e5, 0], i ? 0.085 : 0.22));
        // (and the glow of the air round it: a wide, faint, soft-edged sheath, so the shaft has a halo and never a cut-out edge)
        addShaft(HSH[0], heroUp, heroE1, heroE2, HSH[0].a * 1.9, HSH[0].b * 2.3, 46, beamCol.clone().multiplyScalar(0.2 * gain), [3, 16], 17.3, 0.22, 1, [4, 0.5, 0.45], 0.3, [30, 62, 0.72], 0.12);
        await Y();
        addMotes(HSH[0], heroUp, heroE1, heroE2, Math.round(3600 * busy), 30, mr, 2.2);
        await Y();
        continue;
      }
      // the smaller pillars: the hero's kind. A core of lit dust that burns along its axis and falls away to the sides and with
      // height, a wide soft sheath of glowing air round it, motes in it; soft at every edge, so it reads as light standing in
      // the dust and never as a rod, a rope or a plank
      const big = p.chamber >= 0, h = PIL.find((q) => q.p === p);
      const sr = p.u === 0.545 || p.blade ? RP_ : V.fork('ray' + p.u);
      if (big) V.fork('mote' + p.u);                             // (the stream keeps its draws)
      const gain = (0.9 + 0.25 * warm) * (0.8 + 0.25 * p.power), gate = !!h.gate, len = gate ? h.len : 23 + 5 * h.k;   // (the blade at the hall's way in: the hall's sheath and the hall's upper end, as tall as its open air)
      // (held down near the eye, where it fills the frame, and far down the canyon, where it would be a thin bright line)
      // (beside the eye it is a soft gold haze with dust drifting in it)
      const farC = [42, 90, 0.6], farS = [42, 90, 0.5];         // (live's own numbers, the same for every pillar and blade: the core is not dimmed further for being narrow)
      // (a gatepost of the hall is a blade of the hall: its two volumes of lit dust are drawn with the hall's shafts, in their
      // one draw and by their law, in hallAir; the two draws its volumes always took are taken here as they were)
      if (gate) { h.sd1 = sr.range(0, 40); h.sd2 = RP_.range(0, 40); }
      else {
        addShaft(h, beamUp0, h.e1, h.e2, h.a, h.b, len, beamCol.clone().multiplyScalar(0.95 * gain), [2.5, 17], sr.range(0, 40), 0.75, 0.72, [3.6, 0.3, 0.1], 0.34, farC, 0.2);
        addShaft(h, beamUp0, h.e1, h.e2, h.a * 2.1, h.b * 2.7, len, beamCol.clone().multiplyScalar(0.3 * gain), [2.5, 17], RP_.range(0, 40), 0.3, 1, [3.4, 0.3, 0.4], 0.42, farS, 0.2);
      }
      await Y();
      addMotes(h, beamUp0, h.e1, h.e2, Math.round(900 * h.k * busy), 22, makeRng('canyon-of-light:pillarmotes:' + PIL.indexOf(h) + ':' + ctx.seed), 1.6);   // (each pillar's motes on a stream of their own: how many it has shifts nothing else. With this the pillars' stream is dealt anew once: the sheaths' seeds)
      await Y();
    }
    Object.assign(job, { time, set, stationAt, wallV, cCream, cOrange, beamCol, SHAFT_FRAG, shaftGeo, addShaft, courtBeam, moteMats, MOTE_VERT,
      MOTE_FRAG, addMotes, latOf0 });
}

async function hallAir(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, scene, busy, warm, HALL, LESS, PIL, time, beamCol, cCream, cOrange, SHAFT_FRAG, shaftGeo, moteMats, MOTE_VERT, MOTE_FRAG } = job;
    // THE HALL'S SHAFTS in the air: each the pillars' own two volumes (the core of lit dust and the soft sheath of glowing air,
    // with the pillars' own numbers for how they are held beside the eye and far down the canyon), taller, because here the
    // light is seen all the way up toward the hole it comes through; and their motes, one cloud of points for the three.
    // THE LESSER SHAFT of the first slot is ONE volume of lit dust, the shafts' own shader with two of its laws rewritten for
    // it (BREATH below): across it the light dies away from its middle line to nothing at its side, with no edge, and the
    // section narrows with height; along it the dust is thickest and brightest just over the pool and thins away upward, gone
    // into the dark over its last metres, its falling dust seen as brighter and darker drifts down its length. The wall is
    // seen through it everywhere. Its own motes (a stream of their own) sink in it. A breath of light, never a bar.
    // THE BLADES' LOOK (the mend of round 27: from the court and the passage the hall's blades read as thin hard WHITE poles).
    // The hall's three shafts and its two gateposts, all in the hall's one draw, are SOFT WARM LIGHT: lit dust the colour of
    // the palette's own sun on sand (a cream gold, BLADE_COL, where the pillars' dust is a pale cream), less of it (0.66 for
    // 0.95) in thicker dust; the core with no edge (its light falls away from the middle line to nothing at its side) inside
    // a wider sheath of glowing air that carries more of the light than it did (0.42 for 0.12), so each flank melts with no
    // line; and the tone changes along the height: fullest from a metre or two over the pool, thinning steadily to two fifths
    // toward the hole it comes through, the foot standing bright on its pool (0.7 at the sand for 0.1), with the shafts'
    // own streaks of brighter and dimmer dust kept in it (HALL_LOOK below rewrites those laws of the shafts' shader
    // for the hall's own program; no other shaft's shader is touched). Nothing here reads the eye: the two things the
    // shafts' shader has always asked of the eye's distance (held to a gold haze close by, dimmed far down the canyon) are
    // live's own and are what they were.
    const BLADE_COL = cCream.clone().lerp(cOrange, 0.55), gates = PIL.filter((q) => q.gate);
    let volMat = null, moteMat = null;
    for (const grp of [{ list: HALL, name: 'hall', stream: 'hallmotes', core: [0.66, 1.1, 0.9], sheath: [0.42, 0.45] }, { list: LESS, name: 'slot', stream: 'lessermotes', breath: true }]) {
      if (grp.list !== HALL && !grp.list.length) continue;
      const farC = [42, 90, 0.6], farS = [42, 90, 0.5];
      // (the six volumes are ONE draw: the shafts' own shader, word for word, with each volume's numbers handed to it at its
      // corners instead of as uniforms; the same law beside the eye and far off as every pillar's, nothing added to it)
      const VOL = [];
      for (const h of grp.breath ? grp.list : grp.list.concat(gates)) {
        const gain = (0.9 + 0.25 * warm) * (0.8 + 0.25 * h.power);
        // (the breath: one volume; uEnds here holds the height in which its light falls to a third, and the length of its faded top)
        if (grp.breath) { VOL.push({ h, a: h.SA, b: h.SB, col: beamCol.clone().multiplyScalar(0.52 * gain), near: [2.5, 17], seed: h.sd1, dens: 0.2, soft: 1, ends: [7, 8, 0], nearMin: 0.34, far: farS, cap: 0.2 }); continue; }
        VOL.push({ h, a: h.a, b: h.b, col: BLADE_COL.clone().multiplyScalar(grp.core[0] * gain), near: [2.5, 17], seed: h.sd1, dens: grp.core[1], soft: grp.core[2], ends: [1.8, 0.5, 0.7], nearMin: 0.34, far: farC, cap: 0.2 });
        VOL.push({ h, a: h.SA, b: h.SB, col: BLADE_COL.clone().multiplyScalar(grp.sheath[0] * gain), near: [2.5, 17], seed: h.sd2, dens: grp.sheath[1], soft: 1, ends: [1.8, 0.5, 0.7], nearMin: 0.42, far: farS, cap: 0.2 });
      }
      {
        const P = [], I = [], A3 = { aFoot: [], aUp: [], aCol: [], aEnds: [], aFar: [] }, A4 = { aE1: [], aE2: [], aA: [], aB: [] };
        let nv = 0;
        for (const v of VOL) {
          const h = v.h, g1 = shaftGeo(h, h.up, h.e1, h.e2, v.a, v.b, h.len), pp = g1.attributes.position.array, ii = g1.index.array;
          for (let i = 0; i < pp.length; i += 3) {
            P.push(pp[i], pp[i + 1], pp[i + 2]);
            A3.aFoot.push(h.x, h.y, h.z); A3.aUp.push(h.up.x, h.up.y, h.up.z); A3.aCol.push(v.col.r, v.col.g, v.col.b); A3.aEnds.push(v.ends[0], v.ends[1], v.ends[2]); A3.aFar.push(v.far[0], v.far[1], v.far[2]);
            A4.aE1.push(h.e1.x, h.e1.y, h.e1.z, v.a); A4.aE2.push(h.e2.x, h.e2.y, h.e2.z, v.b); A4.aA.push(h.len, v.seed, v.dens, v.soft); A4.aB.push(v.nearMin, v.cap, v.near[0], v.near[1]);
          }
          for (let i = 0; i < ii.length; i++) I.push(ii[i] + nv);
          nv += pp.length / 3; g1.dispose();
        }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I);
        for (const k in A3) g.setAttribute(k, new THREE.Float32BufferAttribute(A3[k], 3));
        for (const k in A4) g.setAttribute(k, new THREE.Float32BufferAttribute(A4[k], 4));
        const UNI_S = 'uniform vec3 uFoot, uUp, uCol, uEnds; uniform vec4 uE1, uE2; uniform float uTime, uLen, uSeed, uDens, uSoft, uNearMin, uCap; uniform vec2 uNear; uniform vec3 uFar;';
        const VARY = 'varying vec3 uFoot, uUp, uCol, uEnds, uFar; varying vec4 uE1, uE2, vA, vB;';
        const fragVol = SHAFT_FRAG.split(UNI_S).join('uniform float uTime; ' + VARY + '\n#define uLen vA.x\n#define uSeed vA.y\n#define uDens vA.z\n#define uSoft vA.w\n#define uNearMin vB.x\n#define uCap vB.y\n#define uNear vB.zw\n');
        // BREATH: the same shader with five steps along the eye's line through the dust instead of three, and at each step the
        // dust's own law (how far from the middle line, in the section as it has narrowed at that height; how high over the
        // pool; the falling drifts); the eye's line adds what it passes through and nothing for its length alone
        const BREATH = [
          ['for (int i = 0; i < 3; i++) {\n          vec3 p = oc + rd*(t0 + ch*(0.2 + 0.3*float(i)));', 'for (int i = 0; i < 5; i++) {\n          vec3 p = oc + rd*(t0 + ch*(0.1 + 0.2*float(i)));'],
          [SHAFT_FRAG.slice(SHAFT_FRAG.indexOf('          I += (0.62 + 0.76*smoothstep(0.28, 0.72, ray))'), SHAFT_FRAG.indexOf('        }\n        // (lit dust is thin: the wall behind shows through it.')),
            '          float tpr = mix(1.0, 0.6, clamp(al/max(uLen, 1.0), 0.0, 1.0));\n          vec2 qn = q/(vec2(uE1.w, uE2.w)*tpr);\n          float rr = dot(qn, qn);\n'
            + '          float drift = smoothstep(0.3, 0.7, 0.6*dust + 0.4*clump);\n'
            + '          I += (1.0 - smoothstep(0.5, 1.0, rr))*exp(-2.4*rr)*mix(0.14, 1.0, exp(-max(al, 0.0)/max(uEnds.x, 0.5)))*(1.0 - smoothstep(uLen - uEnds.y, uLen, al))*smoothstep(-0.3, 1.0, al)*(0.5 + 1.0*drift + 0.3*(fineD - 0.5))*(0.8 + 0.4*ray);\n'],
          [SHAFT_FRAG.slice(SHAFT_FRAG.indexOf('        float a = (0.05 + 0.95*(1.0 - exp(-ch*uDens)))'), SHAFT_FRAG.indexOf('        // (from inside and from close by, the lit dust is capped')),
            '        float a = 1.0 - exp(-ch*uDens*I/5.0);\n'],   // (what the eye's line passes through, and nothing that knows where the eye is)
        ];
        // HALL_LOOK: the hall's own three laws in the shafts' shader. Along the height: the dust thins steadily from two metres
        // over the pool to two fifths at 24 m (the shafts' own law: three tenths off between 7 and 30 m). Across: a soft volume's
        // light falls from its middle line to nothing at its side as the square of the chord through it, the core's (soft 0.9)
        // nearly as the chord itself, so a blade seen on its broad side shows its breadth (the shafts' own law takes the
        // cube, which left a narrow bright spine: a pole from afar); and the streaks of brighter and dimmer dust keep more
        // than half of their contrast in a soft volume (the shafts' own law flattens them there).
        const HALL_LOOK = [
          ['(1.0 - 0.3*smoothstep(7.0, 30.0, al))', '(1.0 - 0.6*smoothstep(2.0, 24.0, al))'],
          ['prof = mix(mix(0.2, 1.0, c2*c2), c2*cn, uSoft)', 'prof = mix(cn, c2, smoothstep(0.85, 1.0, uSoft))'],
          ['mix(streak, 0.8 + 0.25*streak, smoothstep(0.7, 1.0, uSoft))', 'mix(streak, 0.8 + 0.25*streak, 0.45*smoothstep(0.7, 1.0, uSoft))'],
        ];
        const m = grp.breath ? new THREE.ShaderMaterial({
          uniforms: { uTime: time },
          vertexShader: volMat.vertexShader, fragmentShader: BREATH.reduce((f, [a, b]) => (a && f.includes(a) ? f.split(a).join(b) : f), fragVol),
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true,
        }) : volMat || (volMat = new THREE.ShaderMaterial({
          uniforms: { uTime: time },
          vertexShader: 'attribute vec3 aFoot, aUp, aCol, aEnds, aFar; attribute vec4 aE1, aE2, aA, aB; ' + VARY + ' varying vec3 vW;\n'
            + 'void main(){ uFoot = aFoot; uUp = aUp; uCol = aCol; uEnds = aEnds; uFar = aFar; uE1 = aE1; uE2 = aE2; vA = aA; vB = aB; vec4 wp = modelMatrix * vec4(position, 1.0); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }',
          fragmentShader: HALL_LOOK.reduce((f, [a, b]) => (f.includes(a) ? f.split(a).join(b) : f), fragVol),
          transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, forceSinglePass: true,
        }));
        const mesh = new THREE.Mesh(g, m); mesh.name = grp.name + '-shafts'; mesh.frustumCulled = false; mesh.renderOrder = 2;
        scene.add(mesh);
        await Y();
      }
      // (the motes: the shafts' own shader with each speck's shaft handed to it as attributes instead of uniforms, so the three
      // clouds are one draw; a stream of their own)
      const RMo = makeRng('canyon-of-light:' + grp.stream + ':' + ctx.seed), per = grp.list.map((h) => Math.round(820 * h.k * busy)), nM = per.reduce((q, n) => q + n, 0);
      const sd = new Float32Array(nM * 4), aF = new Float32Array(nM * 3), aU = new Float32Array(nM * 3), a1 = new Float32Array(nM * 4), a2 = new Float32Array(nM * 4);
      let n0 = 0;
      grp.list.forEach((h, j) => {
        for (let i = n0; i < n0 + per[j]; i++) {
          sd[i * 4] = RMo(); sd[i * 4 + 1] = RMo(); sd[i * 4 + 2] = RMo(); sd[i * 4 + 3] = RMo();
          aF[i * 3] = h.x; aF[i * 3 + 1] = h.y; aF[i * 3 + 2] = h.z; aU[i * 3] = h.up.x; aU[i * 3 + 1] = h.up.y; aU[i * 3 + 2] = h.up.z;
          a1[i * 4] = h.e1.x; a1[i * 4 + 1] = h.e1.y; a1[i * 4 + 2] = h.e1.z; a1[i * 4 + 3] = h.a; a2[i * 4] = h.e2.x; a2[i * 4 + 1] = h.e2.y; a2[i * 4 + 2] = h.e2.z; a2[i * 4 + 3] = h.b;
        }
        n0 += per[j];
      });
      await Y();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nM * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 4));
      g.setAttribute('uFoot', new THREE.BufferAttribute(aF, 3)); g.setAttribute('uUp', new THREE.BufferAttribute(aU, 3)); g.setAttribute('uE1', new THREE.BufferAttribute(a1, 4)); g.setAttribute('uE2', new THREE.BufferAttribute(a2, 4));
      const UNI = 'uniform vec3 uFoot, uUp; uniform vec4 uE1, uE2;';
      const m = moteMat || (moteMat = new THREE.ShaderMaterial({
        uniforms: { uTime: time, uCol: { value: new THREE.Color('#ffc978').multiplyScalar(1.6) }, uLen: { value: 26 }, uPx: { value: 400 }, uFall: { value: 0.011 } },
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader: MOTE_VERT.split(UNI).join('attribute vec3 uFoot, uUp; attribute vec4 uE1, uE2;'), fragmentShader: MOTE_FRAG,
      }));
      const pts = new THREE.Points(g, m); pts.name = grp.name + '-motes'; pts.frustumCulled = false; pts.renderOrder = 3;
      scene.add(pts); if (grp.list === HALL) moteMats.push(m);
      await Y();
    }
}

async function canyonSand(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, V, busy, windy, pools, pH, beamUp0, PIL, dC, STEP, dHall0, dHall1, slotSt, KF, RW, sides, rowAtH, floorY, posA, nor, slotLightOwn, time, set, wallV,
      latOf0 } = job;
    // motes everywhere, catching what light there is
    // (faint amber in the shade: the dust blazes only inside the beams, which have motes of their own)
    const motes = set.add(fx.makeParticles({
      rng: V.fork('dust'), preset: 'dust', time, count: Math.round((3400 + 1000 * windy) * busy), colors: ['#d9a070', '#e8a868', '#c89468'],
      intensity: 1.0, size: [0.02, 0.045], velocity: [0.3 + 0.5 * windy, -0.06, -0.5 - 0.5 * windy], turbulence: [0.9, 0.5, 0.6],
    }));
    await Y();

    // ------------------------------------------------------------------ sand trickling from ledges
    const trickles = [];
    {
      const T = V.fork('trickles');
      // One by the hero beam and one by each of the smaller pillars: of a handful of ledges within a few metres of the pool,
      // the one its light reaches best. The thread falls clear of the wall to the sand (or the bank) below, where it has built
      // a small cone. (Only where a beam is near enough to pick the falling sand out: a thread of bright grains, never a grey
      // streak in the shade.)
      for (const p of [pH, ...PIL.map((h) => h.p)]) {
        let best = null;
        for (let tries = 0; tries < 12; tries++) {
          const d = (p.footD ?? p.d) + T.sign() * T.range(3.5, 10), S = T.pick(sides), i = clamp(Math.round((d + 10) / STEP), 2, slotSt.length - 3), k = rowAtH(S, i, T.range(10.5, 18)), q = wallV(S, i, k), s = S.st[i];
          const x = posA[q] + nor[q] * 0.8, y = posA[q + 1], z = posA[q + 2] + nor[q + 2] * 0.8, wd = T.range(0.26, 0.4), sd = T.range(0, 40);
          const lat = (x - s.cx) * s.rx + (z - s.cz) * s.rz, la = Math.abs(lat), e = slotSt[i].fe[lat < 0 ? 0 : 1];
          if (la < 3.8 || s.ct > 0.05 || lat * S.sgn < 0) continue;
          // where the fall line meets the ground: the sand floor, or the wall's own banked foot under the ledge
          let yb = floorY(slotSt[i], lat), hit = la < e.l;
          if (!hit) for (let kk = KF; kk < k - 6; kk++) { const qq = wallV(S, i, kk); if (((posA[qq] - s.cx) * s.rx + (posA[qq + 2] - s.cz) * s.rz) * S.sgn >= la) { yb = posA[qq + 1]; hit = true; break; } }
          if (!hit || y - yb < 5) continue;
          const lw = Math.min(1.6, slotLightOwn(x, yb + 1.5, z, 0, 1, 0, s.d, 6));   // (by the light of the slot's own pillars: the hall's shafts have no say in which ledge a gatepost's thread falls from)
          if (!best || lw > best.lw) best = { x, y, z, yb, lw, len: y - yb - 0.1, w: wd, seed: sd, d: s.d, bright: 0.4 + 0.45 * Math.min(lw, 1.3) };
        }
        // (the thread of a pillar that is one of the hall's gateposts: its heap is drawn as the hall's own heaps are, round and lit where it lies)
        if (best && p.pillar && p.dP > dHall0 - 4 * STEP && p.dP < dHall1 + 4 * STEP) best.heap = true;
        if (best && best.lw > 0.3) trickles.push(best);
      }
      // (none on the amphitheatre's walls: from the plain a thread of falling sand a hundred metres off is a white scratch on the cliff)
    }
    // A veil of sand through the blade of sun beyond the hero chamber. High on a wall beside that blade a
    // ledge lets go a loose veil of sand, several times as wide as the threads and four sheets deep: it falls plumb, pale in
    // the shade, and where its line meets the leaning shaft the grains blaze; a pale cone of fresh sand lies at its foot.
    // Of the ledges on either wall within a few metres of it, the one whose plumb line passes nearest the shaft's axis.
    // (a stream of its own; the threads' stream is not drawn from)
    {
      const pb = pools.find((q) => q.blade && q.d < dC), hb = pb && PIL.find((q) => q.p === pb);
      if (hb) {
        const RV = makeRng('canyon-of-light:veil:' + ctx.seed), wd = RV.range(0.9, 1.2), sd = RV.range(0, 40);
        const iP = clamp(Math.round((pb.d + 10) / STEP), 6, slotSt.length - 7);
        const bx = beamUp0.x / beamUp0.y, bz = beamUp0.z / beamUp0.y, b2 = bx * bx + bz * bz;
        let best = null;
        for (const S of sides) for (let i = iP - 4; i <= iP + 4; i++) for (let k = rowAtH(S, i, 12), k1 = Math.min(RW - 1, rowAtH(S, i, 30)); k <= k1; k++) {
          const q = wallV(S, i, k), sq = S.st[i], x = posA[q] + nor[q] * 0.7, y = posA[q + 1], z = posA[q + 2] + nor[q + 2] * 0.7;
          const lat = latOf0(sq, x, z), la = Math.abs(lat), e = slotSt[i].fe[lat < 0 ? 0 : 1];
          if (la < 4.6 || la >= e.l || lat * S.sgn < 0) continue;      // (it falls well to the side of the route's line, onto the sand: the eye passes beside the veil, never through it)
          const yb = floorY(slotSt[i], lat);
          if (y - yb < 7) continue;
          const hx = x - hb.x, hz = z - hb.z, hh = clamp(b2 > 1e-6 ? (hx * bx + hz * bz) / b2 : 0, 1.5, Math.max(1.5, y - hb.y - 2)), dm = Math.hypot(hx - bx * hh, hz - bz * hh) + 0.02 * (y - yb);
          if (!best || dm < best.dm) best = { x, y, z, yb, dm, d: sq.d };
        }
        if (best && best.dm < 3.5) {
          const litAt = (v) => {                                     // how far inside the shaft the falling sand is, v of the way down
            const yy = best.y - v * (best.y - best.yb), h = yy - hb.y, dx = best.x - hb.x - bx * h, dz = best.z - hb.z - bz * h;
            return 1 - smoothstep(0.7, 3.2, Math.hypot((dx * hb.e1.x + dz * hb.e1.z) / hb.a, (dx * hb.e2.x + dz * hb.e2.z) / hb.b));   // (the veil is wider than the blade: it brightens over metres of its fall, never in a bar)
          };
          trickles.push({ x: best.x, y: best.y, z: best.z, yb: best.yb, lw: 1, len: best.y - best.yb - 0.1, w: wd, seed: sd, d: best.d, bright: 0.44, brightAt: (v) => 0.44 + 1.2 * litAt(v), sheets: 4, coneR: 0.75 });
        }
      }
    }
    // TWO THREADS OF FALLING SAND IN THE FIRST SLOT, of the slot's own kind (what such a canyon does), from the best-lit ledge
    // of each wall between 35 and 75 m in: every ledge of that stretch (a point of the wall 10.5 to 18 m up that stands out
    // over the sand or over its own banked foot, with five metres and more of fall) is given the light that reaches its fall
    // line (the slot's own pools: the hero beam's above all, and the lesser shaft's glow), and on each wall the best lit is
    // taken; the second one nine metres and more along the slot from the first, and neither within six metres of another
    // thread. Each falls AT THE WALL (its ledge is the wall's own; nothing hangs in the route's corridor) and is lit where it
    // falls: every point of the thread by the light at its own height, so it is a thread of warm grains where the beam's
    // light reaches it and a dim one, hardly seen, where it does not. At its foot a small round heap, drawn as the hall's
    // heaps are. (A stream of their own: 'slotthreads'.)
    {
      const RS = makeRng('canyon-of-light:slotthreads:' + ctx.seed), found = [];
      const lightAt = (x, y, z, S, sq) => Math.min(1.6, slotLightOwn(x, y, z, -S.sgn * sq.rx, 0.3, -S.sgn * sq.rz, sq.d, 0.5));   // (on a grain that faces the route and a little upward)
      for (const S of [sides[0], sides[1]]) {
        const wd = RS.range(0.28, 0.42), sd = RS.range(0, 40);
        let best = null;
        for (let i = clamp(Math.round((35 + 10) / STEP), 2, slotSt.length - 3), i1 = clamp(Math.round((75 + 10) / STEP), 2, slotSt.length - 3); i <= i1; i++) {
          const sq = S.st[i];
          if (found.some((t) => Math.abs(t.d - sq.d) < 9)) continue;
          for (let k = rowAtH(S, i, 10.5), k1 = rowAtH(S, i, 18); k <= k1; k++) {
            const q = wallV(S, i, k), x = posA[q] + nor[q] * 0.8, y = posA[q + 1], z = posA[q + 2] + nor[q + 2] * 0.8;
            const lat = latOf0(sq, x, z), la = Math.abs(lat), e = slotSt[i].fe[lat < 0 ? 0 : 1];
            if (la < 6.9 || lat * S.sgn < 0) continue;              // (at the wall: outside the route's corridor)
            let yb = floorY(slotSt[i], lat), hit = la < e.l;
            if (!hit) for (let kk = KF; kk < k - 6; kk++) { const qq = wallV(S, i, kk); if (((posA[qq] - sq.cx) * sq.rx + (posA[qq + 2] - sq.cz) * sq.rz) * S.sgn >= la) { yb = posA[qq + 1]; hit = true; break; } }
            if (!hit || y - yb < 5) continue;
            if (trickles.some((t) => Math.hypot(t.x - x, t.z - z) < 6)) continue;
            const lw = 0.5 * (lightAt(x, yb + 1.2, z, S, sq) + lightAt(x, 0.5 * (y + yb), z, S, sq));
            if (!best || lw > best.lw) best = { x, y, z, yb, lw, len: y - yb - 0.1, w: wd, seed: sd, d: sq.d, S, sq };
          }
          if (i % 8 === 7) await Y();
        }
        if (!best) continue;
        const { S: bS, sq: bq } = best, lv = [];
        for (let j = 0; j <= 14; j++) lv.push(lightAt(best.x, best.y - j / 14 * (best.y - best.yb), best.z, bS, bq));   // (the light at each height of its fall)
        const t = { x: best.x, y: best.y, z: best.z, yb: best.yb, lw: best.lw, len: best.len, w: best.w, seed: best.seed, d: best.d, bright: 0.3 + 0.5 * Math.min(best.lw, 1.3), brightAt: (v) => 0.3 + 0.5 * Math.min(lv[Math.round(clamp(v, 0, 1) * 14)], 1.3), heap: true, slot: true };
        trickles.push(t); found.push(t);
        await Y();
      }
    }
    Object.assign(job, { motes, trickles });
}

async function hallVeils(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, scene, path, L, tv, PIL, STEP, dHall0, dHall1, hallFrom, hallTo, slotSt, RW, sides, rowAtH, floorY, HALL, posA, nor, wallV, latOf0,
      trickles } = job;
    // THE HALL'S VEILS: sand let go from the overhanging rock high in the hall falls plumb BESIDE its shafts and across their
    // edge. For each shaft, of the places on either wall where the rock hangs out over the hall's floor (19 m up and more,
    // within a few metres along the slot), the one whose plumb line passes the shaft's leaning axis just outside its lit dust
    // (at about 1.2 of its section, and within the lowest 18 m of the shaft, where the eye looks): a veil of the slot's own
    // kind, five sheets of grains in parcels, a metre and a half wide half way down, wider at its foot. It crosses the
    // shaft from shade into light: the part of each sheet that hangs inside the lit dust is alight, the rest stands pale
    // against the hall's dark rim, each point of a sheet lit by where it hangs in the shaft's own section; a cone of fresh
    // sand a good three metres across lies at its foot. Its sheets stand beside the route as the shafts' lit dust does: at
    // their widest (the foot, the outer sheets' own offset and their sway counted) VEIL_AIR metres and more of clear air
    // from the route's whole line, taken every half metre of the route past the hall, so a veil is as wide as the air
    // beside it allows (never under VEIL_MIN, where no veil is hung); no two veils within six metres of each other. And a
    // veil hangs no nearer the route's line than its shaft's own axis: beyond the shaft, toward the wall it falls from, so
    // that the route passes the shaft and its veil as one thin thing and never the veil as a pale sheet of its own before it.
    // (A stream of their own: 'hallveils'.)
    const hallVeils = [];
    {
      const RV = makeRng('canyon-of-light:hallveils:' + ctx.seed), RT = [], VEIL_AIR = 7, VEIL_MIN = 0.6, VEIL_FAR = 12;
      for (let r = dHall0 - 30; r <= dHall1 + 30; r += 0.5) { path.posAtDist(r, tv); RT.push(tv.x, tv.z); }
      const offRoute = (x, z) => { let m = 1e9; for (let i = 0; i < RT.length; i += 2) m = Math.min(m, Math.hypot(x - RT[i], z - RT[i + 1])); return m; };
      for (const h of HALL) {
        const wd = RV.range(0.7, 0.9), sd = RV.range(0, 40), iP = clamp(Math.round((h.d + 10) / STEP), 8, slotSt.length - 9);
        const bx = h.up.x / h.up.y, bz = h.up.z / h.up.y;   // (a sheet reaches twice its w to either side at its foot; the outer sheets stand up to 0.55 m off the veil's line and all sway a hand: 0.7 m more)
        // (how far a point hh metres above the shaft's foot is from its axis, in the shaft's own section: 1 at the edge of its core of lit dust)
        const rho = (x, z, hh) => { const dx = x - h.x - bx * hh, dz = z - h.z - bz * hh; return Math.hypot((dx * h.e1.x + dz * h.e1.z) / h.a, (dx * h.e2.x + dz * h.e2.z) / h.b); };
        let best = null;
        for (const S of sides) for (let i = iP - 5; i <= iP + 5; i++) {
          if (S.st[i].hallW <= 0) continue;
          for (let k = rowAtH(S, i, 19), k1 = Math.min(RW - 1, rowAtH(S, i, 36)); k <= k1; k++) {
            const q = wallV(S, i, k), sq = S.st[i], x = posA[q] + nor[q] * 0.8, y = posA[q + 1], z = posA[q + 2] + nor[q + 2] * 0.8;
            const lat = latOf0(sq, x, z), la = Math.abs(lat), e = slotSt[i].fe[lat < 0 ? 0 : 1];
            if (la < 7 || la >= e.l - 0.6 || lat * S.sgn < 0) continue;
            const yb = floorY(slotSt[i], lat);
            if (y - yb < 16) continue;
            const w = Math.min(wd, (offRoute(x, z) - VEIL_AIR - 0.7) / 2);   // (as wide as the air beside it allows)
            if (w < VEIL_MIN) continue;
            if (trickles.some((t) => Math.hypot(t.x - x, t.z - z) < (t.hall ? 6 : 2.5))) continue;
            // (the height at which the plumb line is nearest the axis, and how far off it is there)
            let dm = 1e9, hm = 0;
            for (let hh = 3; hh <= y - h.y - 3; hh += 1.5) { const r = rho(x, z, hh); if (r < dm) { dm = r; hm = hh; } }
            if (dm > 1.8 || hm > 18) continue;
            if (offRoute(x, z) < offRoute(h.x + bx * hm, h.z + bz * hm)) continue;   // (no nearer the route's line than its shaft's own axis: the veil hangs beyond its shaft, toward the wall it falls from)
            // (a ledge whose plumb line passes OUTSIDE the lit core, at 0.9 of its section and more, comes before every ledge whose
            // line falls inside it: the veil then crosses the shaft's edge from shade into light; among those, the crossing weighs
            // more than the width. Rather a veil that passes the shaft part way up than one that only meets it at the sand.)
            const offAxis = Math.abs((x - h.x - bx * hm) * h.e2.x + (z - h.z - bz * hm) * h.e2.z);   // (metres off the line of the blade's long side: a veil on that line stands behind its shaft where the route passes it)
            const sc = (dm < 0.9 ? 10 : 0) + Math.abs(dm - 1.2) + (hm < 4 ? 0.5 : 0) + 0.2 * (wd - w) + 0.5 * offAxis;
            if (!best || sc < best.sc) best = { x, y, z, yb, dm, hm, sc, w, d: sq.d };
          }
        }
        await Y();
        if (!best) continue;
        const litAt = (x, z, yy) => 1 - smoothstep(0.7, 1.7, rho(x, z, yy - h.y));   // (alight inside the lit dust, pale outside it: the shaft's edge is seen on the falling sand)
        // BODY WHERE IT CANNOT WASH: a veil that hangs VEIL_FAR metres and more from the route's whole line (by its place, the
        // same measure as its clear air) is given body: seven sheets for five, hung closer about its line (the three outer
        // ones 0.4 m off it for the thin veil's one at 0.55), so it is a denser strand and no wider one; its grains in the
        // shade above half their fall a little lighter; and its strands widen with its distance from the route's line, from
        // the thin veil's own 0.7 to 0.9 m at 14 m to 1.0 to 1.3 m at 18 m and beyond (the same draw). A veil nearer the
        // route than VEIL_FAR stays the thin one it was. (The ledge is chosen as before, by the thin veil's measure, so the
        // veil hangs where it hung.) Why by distance: filmed past the first shaft, a veil 14 m off with strands a metre and
        // more wide and a sheet 0.85 m off its line made the lit run of shaft and veil wider than the shaft's own.
        const off = offRoute(best.x, best.z), far = off >= VEIL_FAR, wB = far ? Math.min(wd * lerp(1.0, 1.45, smoothstep(14, 18, off)), (off - VEIL_AIR - 1.0) / 2) : best.w, shade = far ? 0.6 : 0.5;
        const t = {
          x: best.x, y: best.y, z: best.z, yb: best.yb, lw: 1, len: best.y - best.yb - 0.1, w: wB, seed: sd, d: best.d, clear: off - 2 * wB - 0.7, dm: best.dm, hm: best.hm, bright: 0.5, off,
          brightAt: (v, px, pz) => lerp(shade, 0.4, smoothstep(0.42, 0.58, v)) + 0.62 * litAt(px, pz, best.y - v * (best.y - best.yb)), sheets: far ? 7 : 5, cols: 5, coneR: 1.6, hall: true,   // (the upper half of its fall has more body in the shade: the curtain is seen against the dark rim from the hall's way in)
        };
        trickles.push(t); hallVeils.push(t);
      }
    }
    // (for the round's print: the hall's stretch, its shafts and veils, and the slot's own pillars that stand inside that stretch)
    scene.userData.hall = {
      from: dHall0, to: dHall1, bumpFrom: hallFrom, bumpTo: hallTo, L,
      shafts: HALL.map((h) => ({ d: h.d, lat: h.lat, k: h.k, clear: h.clear, open: h.open })), veils: hallVeils.map((t) => ({ d: t.d, len: t.len, clear: t.clear, dm: t.dm, hm: t.hm, w: t.w, off: t.off, sheets: t.sheets })),
      pillars: PIL.filter((h) => h.p.d > dHall0 - 6 && h.p.d < dHall1).map((h) => h.p.d), threads: trickles.map((t) => t.d),
    };
}

async function canyonSandDrawn(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, scene, sandLook, sl4, LD, canyonMat, time, cCream, cOrange, latOf0, trickles, VS, FC, floorBase, STEP, slotSt, posA, nor } = job;
    // the small cone of sand each thread has built at its foot: the canyon's own sand, lit like the floor round it
    if (trickles.length) {
      const cp = [], cn = [], cc = [], cs = [], ct = [], ci = [];
      let nv = 0;
      // (the floor sheet's own mesh at a place: its height, normal, colour, shade grade, sand amount and bedding coordinate, read
      // from the sheet's own points on either side, so that a heap's foot IS the floor where it lies)
      const fl = new Float64Array(11), fa = new Float64Array(11);
      const rowAt = (i, px, pz, out) => {
        const s = slotSt[i], lat = latOf0(s, px, pz), e = s.fe[lat < 0 ? 0 : 1], u = clamp(lat / e.l, -1, 1), fj = (u + 1) / 2 * FC, j0 = Math.min(FC - 1, Math.floor(fj)), tj = fj - j0;
        const a = floorBase + i * (FC + 1) + j0, b = a + 1, a3 = a * 3, b3 = b * 3;
        out[0] = lerp(posA[a3 + 1], posA[b3 + 1], tj);
        for (let c = 0; c < 3; c++) { out[1 + c] = lerp(nor[a3 + c], nor[b3 + c], tj); out[4 + c] = lerp(VS.col[a3 + c], VS.col[b3 + c], tj); }
        out[7] = lerp(VS.shd[a3], VS.shd[b3], tj); out[8] = lerp(VS.shd[a3 + 2], VS.shd[b3 + 2], tj); out[9] = lerp(VS.slt[a * 4 + 1], VS.slt[b * 4 + 1], tj); out[10] = lerp(VS.slt[a * 4 + 2], VS.slt[b * 4 + 2], tj);
      };
      const floorAt = (px, pz, i0) => {
        let i = clamp(i0, 0, slotSt.length - 2), al = 0;
        for (let n = 0; n < 4; n++) {
          const s0 = slotSt[i], s1 = slotSt[i + 1], tx = s1.cx - s0.cx, tz = s1.cz - s0.cz;
          al = ((px - s0.cx) * tx + (pz - s0.cz) * tz) / Math.max(tx * tx + tz * tz, 1e-6);
          if (al < 0 && i > 0) i--; else if (al > 1 && i < slotSt.length - 2) i++; else break;
        }
        al = clamp(al, 0, 1); rowAt(i, px, pz, fl); rowAt(i + 1, px, pz, fa);
        for (let c = 0; c < 11; c++) fl[c] = lerp(fl[c], fa[c], al);
        return fl;
      };
      for (const t of trickles) {
        const R0 = t.coneR || 0.55 + 1.2 * t.w, H0 = (t.hall ? 0.45 : t.slot ? 0.5 : 0.62) * R0, pale = t.coneR ? 1.16 : 1;   // (the veil's cone is fresh sand, a metre and a half across)
        const SA = t.hall || t.heap ? 20 : 12, RG = t.hall || t.heap ? 5 : 4;
        if (t.hall || t.heap) {
          // A HEAP (under a veil of the hall, under a gatepost's thread, under a thread of the first slot) is a drift of fresh sand,
          // round and smooth: twenty points round and five rings, a cone with a rounded tip whose slope dies out into the floor.
          // Its height is laid over the floor sheet's own (read from the sheet's points, so its foot lies ON the floor where the
          // floor is, with no step), its normals are those of that height field, each of its points is lit where it lies (a heap
          // that stands half in a pool of sun is half alight, as the sand under it is), fresh and pale at its tip, the side turned
          // to the slot's light a little lighter than the side turned from it; and its outer two rings pass into the floor's own
          // colour, shade and ripple (the last ring IS the floor's: its tone, its normal, its ripples), so no outline is left.
          // A thread that lands on the wall's banked foot beyond the sheet has its heap where its sand runs to: at the sheet's edge.
          const i0 = clamp(Math.round((t.d + 10) / STEP), 0, slotSt.length - 2), s0 = slotSt[i0], lat0 = latOf0(s0, t.x, t.z), e0 = s0.fe[lat0 < 0 ? 0 : 1];
          const pull = Math.max(0, Math.abs(lat0) - (e0.l - 0.25)) * Math.sign(lat0), hx = t.x - s0.rx * pull, hz = t.z - s0.rz * pull;
          const RF = [0, 0.16, 0.36, 0.58, 0.8, 1], c0 = 0.18, cN = Math.sqrt(1 + c0 * c0) - c0;
          const hAt = (dx, dz) => {                                  // (the heap's own height over the floor at a place)
            const f = Math.hypot(dx, dz) / (R0 * (1 + 0.12 * Math.sin(Math.atan2(dz, dx) * 3 + t.seed)));
            if (f >= 1) return 0;
            const fr = (Math.sqrt(f * f + c0 * c0) - c0) / cN;
            return H0 * Math.pow(1 - fr, 1.5);
          };
          for (let r = 0; r <= RG; r++) for (let j = 0; j <= SA; j++) {
            const a = (j % SA) / SA * Math.PI * 2, f = RF[r], rr = R0 * f * (1 + 0.12 * Math.sin(a * 3 + t.seed)), dx = Math.cos(a) * rr, dz = Math.sin(a) * rr, px = hx + dx, pz = hz + dz;
            const F = floorAt(px, pz, i0), y = F[0] - 0.02 + hAt(dx, dz), E = 0.06;
            const gx = (hAt(dx + E, dz) - hAt(dx - E, dz)) / (2 * E), gz = (hAt(dx, dz + E) - hAt(dx, dz - E)) / (2 * E);
            // (the height field's normal: the floor's own slope and the heap's over it)
            const fy = Math.max(F[2], 0.2), nx = F[1] / fy - gx, nz = F[3] / fy - gz, nl = Math.hypot(nx, 1, nz);
            cp.push(px, y, pz); cn.push(nx / nl, 1 / nl, nz / nl);
            sandLook(px, y, pz, t.d, sl4);
            const gl = Math.hypot(gx, 1, gz), side = clamp((-gx * LD[0] - gz * LD[2]) / gl / 0.55, -1, 1), b = lerp(1.19, 1, f) * (1 + 0.3 * side);
            const m = r === RG ? 1 : r === RG - 1 ? 0.5 : 0;         // (how far this ring is the floor's own)
            cc.push(lerp(sl4[0] * b, F[4], m), lerp(sl4[1] * b, F[5], m), lerp(sl4[2] * b, F[6], m)); cs.push(lerp(sl4[3], F[7], m), 0, lerp(1, F[8], m));
            ct.push(1, lerp(y + 7 * Math.sin(t.d * 0.045), F[9], m), lerp(0.6, F[10], m), t.d);
          }
        } else {
        sandLook(t.x, t.yb, t.z, t.d, sl4);
        for (let r = 0; r <= RG; r++) for (let j = 0; j <= SA; j++) {
          const a = (j % SA) / SA * Math.PI * 2, f = r / RG, rr = R0 * f * (1 + 0.12 * Math.sin(a * 3 + t.seed)), y = t.yb - 0.12 + H0 * Math.pow(1 - f, 1.25);
          cp.push(t.x + Math.cos(a) * rr, y, t.z + Math.sin(a) * rr); cn.push(Math.cos(a) * 0.55, 0.83, Math.sin(a) * 0.55);
          const b = (1.06 - 0.12 * f) * pale; cc.push(sl4[0] * b, sl4[1] * b, sl4[2] * b); cs.push(sl4[3], 0, 1); ct.push(1, y + 7 * Math.sin(t.d * 0.045), 0.6, t.d);
        }
        }
        if (t.hall || t.heap) await Y();
        for (let r = 0; r < RG; r++) for (let j = 0; j < SA; j++) { const a = nv + r * (SA + 1) + j, b = a + SA + 1; ci.push(a, b, a + 1, a + 1, b, b + 1); }
        nv += (RG + 1) * (SA + 1);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(cp, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(cn, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(cc, 3));
      g.setAttribute('aShade', new THREE.Float32BufferAttribute(cs, 3)); g.setAttribute('aSlot', new THREE.Float32BufferAttribute(ct, 4)); g.setAttribute('aLd', new THREE.Float32BufferAttribute(new Float32Array(nv * 3), 3));
      g.setAttribute('aFar', new THREE.Float32BufferAttribute(new Float32Array(nv * 2), 2));   // (the heaps lie at pools: never marked out of a glow's reach)
      g.setIndex(ci);
      const cones = new THREE.Mesh(g, canyonMat); cones.name = 'trickle-cones'; cones.frustumCulled = false;
      scene.add(cones);
    }
    await Y();
    const trickleMat = new THREE.ShaderMaterial({
      uniforms: Object.assign(fx.fogUniforms(), { uTime: time, uSand: { value: cCream.clone().lerp(cOrange, 0.82) } }),   // (the sand's own colour lit: nearer the palette's orange than its cream, as the lit sand of the floor is)
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: true,
      vertexShader: /* glsl */`
        #include <common>
        #include <fog_pars_vertex>
        attribute vec2 aUV; attribute vec4 aInfo; attribute float aAxis;
        uniform float uTime;
        varying vec2 vUV; varying vec3 vInfo; varying float vThin;
        void main(){
          float v = aUV.y;
          vec3 p = position;
          p.y -= v * aInfo.x;
          // falling sand, not a thread: a hand's width where it leaves the ledge, a loose veil half a metre across at the foot
          float w = aInfo.w * (0.5 + 0.9 * v + 0.6 * v * v);
          // (falling sand is never one even rope: its width swells and thins in pulses that fall with the grains, never wider
          // than it was; the thread drifts a hand to either side on the air as it falls, more in the middle of its fall)
          float fq = sqrt(v + 0.01) * sqrt(aInfo.x) * 2.2 - uTime * 1.5;
          w *= 0.85 + 0.15 * sin(fq * 1.3 + aInfo.y * 2.0) * sin(fq * 0.37 + aInfo.y);
          p.xz += vec2(sin(uTime * 0.6 + aInfo.y + v * 3.0), cos(uTime * 0.47 + aInfo.y * 1.7 + v * 2.3)) * 0.1 * v
            + vec2(sin(uTime * 0.23 + aInfo.y * 2.3 + v * 5.5), cos(uTime * 0.29 + aInfo.y * 1.3 + v * 4.7)) * 0.05 * sin(v * 3.1416);
          // (two crossed sheets fixed in the world. Far down the canyon it thins out and is gone: it is never held to a pixel's
          // width, which drew it as a wire)
          float dC = distance(cameraPosition, p);
          float wmin = 0.0012 * dC;
          vThin = clamp(w / max(wmin, 1e-4), 0.0, 1.0) * mix(1.0, 0.6, smoothstep(30.0, 80.0, dC));
          p.xz += vec2(cos(aAxis), sin(aAxis)) * aUV.x * max(w, wmin);
          vUV = aUV; vInfo = aInfo.xyz;
          vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mvPosition;
          #include <fog_vertex>
        }`,
      fragmentShader: /* glsl */`
        #include <common>
        #include <fog_pars_fragment>
        uniform float uTime; uniform vec3 uSand;
        varying vec2 vUV; varying vec3 vInfo; varying float vThin;
        float th(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float tn(vec2 x){ vec2 i = floor(x), f = fract(x); f = f*f*(3.0-2.0*f);
          return mix(mix(th(i), th(i+vec2(1,0)), f.x), mix(th(i+vec2(0,1)), th(i+vec2(1,1)), f.x), f.y); }
        void main(){
          float u = vUV.x, v = vUV.y, seed = vInfo.y;
          float q = sqrt(v + 0.01) * sqrt(vInfo.x) * 2.2 - uTime * 1.5;           // constant on a falling parcel
          // parcels of sand let go at the ledge in pulses and are drawn out into streaks as they fall, fine grains between them
          // (.. with clear air between one parcel and the next: a veil of grains that comes and goes, never an unbroken line)
          float parcel = smoothstep(0.34, 0.62, tn(vec2(seed, q * 0.33)) * 0.7 + tn(vec2(seed + 9.0, q * 1.1)) * 0.3);
          float strands = tn(vec2(u * 6.0 + seed * 7.0, q * 0.7)) * 0.55 + tn(vec2(u * 17.0 + seed * 3.0, q * 2.1)) * 0.45;
          float grain = tn(vec2(u * 38.0 + seed, q * 11.0));
          float core = max(1.0 - u*u, 0.0);
          float a = core * sqrt(core) * smoothstep(0.38, 0.72, strands * (0.75 + 0.45 * core)) * (0.55 + 0.9 * grain) * parcel;
          // FALLING SAND, NEVER A RIGID WHITE POLE (the mend of round 27). Its top fades in over the first fifth of its fall (the
          // grains part from the ledge a few at a time); how much sand is in it swells and thins down its length, in drifts
          // that fall with the grains; at its foot the strands break up into a soft puff of dust over the heap, which billows
          // slowly and dies out at the sand. And its grains are the sand's own colour lit: however much light falls on a
          // grain it is never brighter than lit sand, so a thread or a veil in a shaft is warm gold, never white.
          float swell = 0.55 + 0.9 * tn(vec2(seed * 1.7 + 4.0, q * 0.17)), drift = tn(vec2(seed * 2.9 + 1.0, q * 0.62));
          float puff = smoothstep(0.82, 0.97, v);
          a *= smoothstep(0.0, 0.2, v) * mix(1.0, 0.6, v) * (0.6 + 0.4 * swell) * (0.3 + 1.1 * drift);
          // (the puff has no outline: its flank is ragged, eaten by the same slow billows)
          float soft = max(1.0 - u * u * (0.7 + 1.6 * tn(vec2(u * 1.7 + seed, v * 9.0 - uTime * 0.3))), 0.0);
          float aPuff = soft * soft * (0.3 + 0.7 * tn(vec2(u * 2.3 + seed, v * 14.0 - uTime * 0.45))) * (0.45 + 0.55 * tn(vec2(seed + 3.0, uTime * 0.6))) * 0.6;
          a = mix(a, aPuff, puff) * (1.0 - smoothstep(0.965, 1.0, v)) * vThin * vThin;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uSand * min(vInfo.z * (0.6 + 0.8 * grain) * (0.75 + 0.3 * swell), 1.0) * mix(1.0, 0.85, puff), min(a, 1.0) * 0.44);
          #include <fog_fragment>
        }`,
    });
    {
      const P = [], U = [], I = [], A = [], X = [];
      let nv = 0;
      const SEG = 14;
      const U2 = [-1, 1], U5 = [-1, -0.5, 0, 0.5, 1];
      for (const t of trickles) for (let c = 0, nS = t.sheets || 2; c < nS; c++) {     // (two crossed sheets, fixed in the world; the veil four, the second pair a hand's breadth to either side; a hall veil a fifth between them, half a metre off)
        // (.. a far hall veil has seven, its fifth, sixth and seventh 0.4 m off its line, each on its own side)
        const ax = t.seed + c * Math.PI / 2 + (c > 1 ? Math.PI / 4 : 0) + (c > 3 ? Math.PI / 8 : 0), off = c > 3 ? (nS === 7 ? 0.4 : 0.55) : c > 1 ? (c === 2 ? 0.3 : -0.3) : 0, ox = -Math.sin(ax) * off, oz = Math.cos(ax) * off;
        // (a hall veil has five points across each sheet, each lit by where it hangs in its shaft: wv is the sheet's half width v of the way down, as the shader spreads it)
        const US = t.cols === 5 ? U5 : U2, nc = US.length;
        for (let r = 0; r <= SEG; r++) for (const u of US) {
          const v = r / SEG, wv = t.w * (0.5 + 0.9 * v + 0.6 * v * v);
          // (the puff at a thread's foot spreads over its heap: the last tenth of a thread's fall is up to twice as wide; a veil, whose width is the clear air's, keeps its own)
          const wide = t.hall ? 1 : 1 + (t.sheets ? 0.5 : 1.0) * smoothstep(0.86, 1, v);
          P.push(t.x + ox, t.y, t.z + oz); U.push(u, v); I.push(t.len, t.seed + c * 3.1, t.brightAt ? t.brightAt(v, t.x + ox + Math.cos(ax) * u * wv, t.z + oz + Math.sin(ax) * u * wv) : t.bright, t.w * wide); A.push(ax);
        }
        for (let r = 0; r < SEG; r++) for (let j = 0; j < nc - 1; j++) { const a = nv + r * nc + j; X.push(a, a + 1, a + nc + 1, a, a + nc + 1, a + nc); }
        nv += (SEG + 1) * nc;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('aUV', new THREE.Float32BufferAttribute(U, 2));
      g.setAttribute('aInfo', new THREE.Float32BufferAttribute(I, 4));
      g.setAttribute('aAxis', new THREE.Float32BufferAttribute(A, 1));
      g.setIndex(X);
      const mesh = new THREE.Mesh(g, trickleMat); mesh.name = 'trickles'; mesh.frustumCulled = false; mesh.renderOrder = 2;
      scene.add(mesh);
    }
    await Y();
}

async function slotLife(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, scene, path, tv, tv2, right, pH, heroUp, STEP, dHall0, dHall1, slotSt, nF, floorY, HALL, LESS, PIL, rockMat, slotLight, slotLightOwn, LD, time, beamCol,
      moteMats, trickles, sides, rowAtH, RW, wallV, posA } = job;
    // LIFE IN THE FIRST SLOT, AND DUST ALIGHT WHERE THERE IS LIGHT (round 27). Three things, each BY PLACE, each on a stream of
    // its own, none of them reading the eye:
    //   the light that FALLS on a thing in the slot's air (airLight below): what a speck of dust or a bird takes from the pools
    //   and shafts round it. It is the slot's own baked law (slotLight) asked twice at the same place, once for a face turned to
    //   where the light mostly comes from and once for a face turned away, and the difference taken: the even shade that fills
    //   the slot cancels, what is left is light with a direction, the light of a pool or a shaft. To that is added the sun
    //   itself where the place lies inside a shaft's own section, and the warm glow of the lesser shaft's pool.
    //   LIT DUST ('glow-dust'): the glow round a pool does NOT move or change: it is where its light falls (the rock's shader
    //   has no clock in it). What drifts is the DUST inside it, slowly: specks homed in the air round each pool and wherever
    //   else light falls in the two stretches (the first slot from 15 m in to the hero chamber's far wall, and the hall's
    //   stretch), each wandering a metre or so about its home on its own slow eddy, each as bright as the light that falls at
    //   its home and no brighter. More of them where there is more light (a place takes specks in proportion to its light),
    //   none where there is none: in the dark of the slot they are unseen. Their number is the light's, never the seed's.
    //   THE ENTRY SWIFTS (their course is laid further down; canyonFlight flies them).
    const U = rockMat.uniforms, HF = U.uHeroF.value, HE1 = U.uHeroE1.value, HE2 = U.uHeroE2.value;
    const less = LESS.length ? LESS[0] : null, gLess = less ? GLOW[3] : 0;
    // (a shaft's sun at a place: 1 inside its section, down to nothing a quarter beyond its edge; up: the shaft's own unit line)
    const inShaft = (x, y, z, i, up, len) => {
      const F = HF[i], E1 = HE1[i], E2 = HE2[i], vx = x - F.x, vy = y - F.y, vz = z - F.z, al = vx * up.x + vy * up.y + vz * up.z;
      if (al < -0.5 || al > len) return 0;
      const qx = vx - up.x * al, qy = vy - up.y * al, qz = vz - up.z * al;
      return 1 - smoothstep(0.7, 1.25, Math.hypot((qx * E1.x + qy * E1.y + qz * E1.z) / E1.w, (qx * E2.x + qy * E2.y + qz * E2.z) / E2.w));
    };
    const airLight = (x, y, z, d, hall) => {
      const f = hall ? slotLight : slotLightOwn;
      f(x, y, z, 0, 1, 0, d, 0.5);
      const ll = Math.hypot(LD[0], LD[1], LD[2]);
      let Lm = 0;
      if (ll > 1e-4) { const nx = LD[0] / ll, ny = LD[1] / ll, nz = LD[2] / ll; Lm = Math.max(0, f(x, y, z, nx, ny, nz, d, 0.5) - f(x, y, z, -nx, -ny, -nz, d, 0.5)); }
      if (!hall) {
        Lm += 1.4 * inShaft(x, y, z, 0, heroUp, 46);
        if (less) {
          Lm += 0.7 * inShaft(x, y, z, 7, less.up, less.len) * Math.exp(-Math.max(y - less.y, 0) / 9);
          // (the glow of the lesser shaft's pool: the rock shader's own law for it, as a speck of dust takes it)
          const E = HE1[7], F = HF[7], R = 2.2 + 1.2 * Math.min(E.w, 3.2), dx = x - F.x, dy = y - F.y, dz = z - F.z, t = clamp(dx * E.x + dy * E.y + dz * E.z, -0.8 * E.w, 0.8 * E.w);
          const r = Math.hypot(E.x * t - dx, E.y * t + 0.4 - dy, E.z * t - dz);
          Lm += gLess * 0.55 / (1 + r * r / (R * R)) * (1 - smoothstep(1.8 * R, 3.2 * R, r));
        }
      }
      return Lm;
    };
    // (whether a place lat metres off the route's line and hF metres above the floor at a station is in the slot's open air, m metres clear of the walls' own section)
    const airHalf = (s, hF) => slotHalfW(s, hF) - 1, airMid = (s, hF) => s.lean * smoothstep(HB, HB + s.Hn, hF);
    {
      const RG = makeRng('canyon-of-light:glowdust:' + ctx.seed), H = [], S = [];
      // (the light is asked once at a place and KD specks are homed within most of a metre of it, each on an eddy of its own: a
      // speck wanders a metre about its home in any case, and the build asks the slot's light a quarter as often)
      const KD = 4;
      const take = (x, y, z, d, hall, fall = 1) => {
        const Lm = airLight(x, y, z, d, hall);
        if (Lm > 0.04 && RG() < Lm / 0.45) for (let k = 0; k < KD; k++) {
          const a = RG.range(0, Math.PI * 2), cz = RG.range(-1, 1), sr = Math.sqrt(1 - cz * cz), r = 0.85 * Math.cbrt(RG());
          H.push(x + r * sr * Math.cos(a), y + 0.5 * r * cz, z + r * sr * Math.sin(a), Math.min(Lm, 0.9) * fall); S.push(RG(), RG(), RG(), RG());
        }
      };
      // through the air of each stretch: so many places a metre of slot, each asked for its light
      for (const [d0, d1, hall] of [[15, pH.d + 20, false], [dHall0 - 8, dHall1 + 10, true]]) {
        const nC = Math.round((d1 - d0) * 70 / KD);
        for (let c = 0; c < nC; c++) {
          const d = RG.range(d0, d1), s = slotSt[clamp(Math.round((d + 10) / STEP), 0, nF - 1)], u = RG.range(-1, 1), hh = 0.3 + 13 * Math.pow(RG(), 1.5);
          const e = s.fe[u < 0 ? 0 : 1], lat = u * (e.l - 0.3), yf = floorY(s, lat), hF = yf + hh - s.yFloor;
          if (Math.abs(lat - airMid(s, hF)) > airHalf(s, hF) + 0.5) continue;
          take(s.cx + s.rx * lat, yf + hh, s.cz + s.rz * lat, s.d, hall);
          if (c % 400 === 399) await Y();
        }
      }
      // round each pool of the two stretches, low over its sand, where its glow is (and as strong as its glow is there: the
      // rock's own law for a pool's glow, full at the pool's middle line and falling off with the distance from it, so the
      // dust reads as the glow's own haze and not as sparks hung round it)
      const round = [];
      round.push({ F: HF[0], E: HE1[0], d: pH.d, hall: false });
      if (less) round.push({ F: HF[7], E: HE1[7], d: less.d, hall: false });
      HALL.forEach((h, i) => round.push({ F: U.uHallF.value[i], E: U.uHallE1.value[i], d: h.d, hall: true }));
      PIL.forEach((h, j) => { if (h.gate && j < 6) round.push({ F: HF[2 + j], E: HE1[2 + j], d: h.d, hall: true }); });
      for (const q of round) {
        const R = 2.2 + 1.2 * Math.min(q.E.w, 3.2), nC = Math.round(220 * R / KD);
        for (let c = 0; c < nC; c++) {
          const a = RG.range(0, Math.PI * 2), rr = 2.6 * R * Math.pow(RG(), 0.75), t = RG.range(-0.8, 0.8) * q.E.w, hh = 0.25 + 5 * RG() * RG();
          take(q.F.x + q.E.x * t + Math.cos(a) * rr, q.F.y + hh, q.F.z + q.E.z * t + Math.sin(a) * rr, q.d, q.hall, 0.25 + 0.75 / (1 + rr * rr / (R * R)));
          if (c % 400 === 399) await Y();
        }
      }
      // (.. and beside each thread of sand in the first slot, where its grains are lit)
      for (const t of trickles) if (t.slot) for (let c = 0; c < 160 / KD; c++) {
        const a = RG.range(0, Math.PI * 2), rr = 2.2 * Math.sqrt(RG());
        take(t.x + Math.cos(a) * rr, t.yb + 0.3 + (t.y - t.yb) * RG(), t.z + Math.sin(a) * rr, t.d, false);
      }
      await Y();
      const nD = H.length / 4, g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(Math.max(nD, 1) * 3), 3));
      g.setAttribute('aHome', new THREE.BufferAttribute(new Float32Array(nD ? H : [0, -999, 0, 0]), 4)); g.setAttribute('aSeed', new THREE.BufferAttribute(new Float32Array(nD ? S : [0, 0, 0, 0]), 4));
      const m = new THREE.ShaderMaterial({
        uniforms: { uTime: time, uCol: { value: new THREE.Color('#ffb868').multiplyScalar(1.05) }, uPx: { value: 400 } },   // (amber: dust in warm bounced light, never white sparks)
        transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        vertexShader: /* glsl */`
          attribute vec4 aHome, aSeed;
          uniform float uTime, uPx;
          varying float vA;
          void main(){
            // (the dust drifts, the glow does not: each speck wanders about its home on a slow eddy of its own, and is lit as its home is)
            float w = 0.16 + 0.2*aSeed.x, r = 0.6 + 0.8*aSeed.y;
            vec3 p = aHome.xyz + r*vec3(sin(uTime*w + aSeed.z*6.2832) + 0.35*sin(uTime*w*2.3 + aSeed.w*40.0), 0.45*sin(uTime*w*0.8 + aSeed.x*31.0), cos(uTime*w*0.9 + aSeed.w*6.2832) + 0.35*cos(uTime*w*2.1 + aSeed.y*23.0));
            vec4 mv = viewMatrix*vec4(p, 1.0);
            gl_Position = projectionMatrix*mv;
            float d = max(-mv.z, 0.5), px = uPx*(0.031 + 0.021*aSeed.w)/d, pmax = max(1.5, uPx*0.0086);   // (motes of like size: the largest not twice the smallest)
            vA = aHome.w*(0.55 + 0.45*abs(sin(uTime*(0.4 + 0.9*aSeed.z) + aSeed.x*90.0)))*clamp(px/1.3, 0.3, 1.0);   // (a speck: its size by its distance as anything's is, never over a few pixels; nothing else here knows where the eye is)
            gl_PointSize = clamp(px, 1.3, pmax);
          }`,
        fragmentShader: /* glsl */`
          uniform vec3 uCol; varying float vA;
          void main(){ vec2 d = gl_PointCoord - 0.5; float s = 1.0 - smoothstep(0.0, 0.5, length(d)); gl_FragColor = vec4(uCol*vA*s*(0.6 + 0.6*s), 1.0); }`,   // (a soft round mote: brightest at its middle, no rim)
      });
      const pts = new THREE.Points(g, m); pts.name = 'glow-dust'; pts.frustumCulled = false; pts.renderOrder = 3;
      scene.add(pts); moteMats.push(m);
      scene.userData.glowDust = { n: nD };
    }
    await Y();
    // THE ENTRY SWIFTS: a party of five or six of the world's own swifts that live in the first slot, between the entry hall and
    // the hero chamber. THEIR COURSE IS LAID HERE, ONCE, FROM THE WALLS AND THE ROUTE'S LINE, and nothing in it reads the eye
    // or the clock of a visit: a closed loop in the slot's own air, flown round and round at the world's clock.
    //   The LOW LEG runs down the slot toward the way in ALONG THE WALL (the designer's word of 10-09 17:54; it ran 3 to 4.5 m
    //   beside the route's line, and a bird leaving the picture there was a fifth of its width): two lanes, one along each
    //   wall (the party parts round the route), each 1.2 m off its wall's own rock (the nearest point of the wall's mesh
    //   within two stations along the slot and a metre and a half up and down of the bird's height), 2.5 to 3.6 m above the
    //   route's line, weaving; each bird's own weave about its lane is 0.3 m across and 0.3 m up and down at the most. And
    //   NEVER NEARER THE ROUTE'S WHOLE LINE THAN 5.5 m in three dimensions: where the walls would bring the lane nearer than
    //   that (its weave and 0.8 m for the curve between two of its points counted), the lane is lifted there, a quarter metre at a time, until it is not.
    //   At the entry hall it WHEELS UP across the slot (over the route's line, 8 m and more above it), slowing as it climbs
    //   as a bird does, and flies back HIGH up the slot, 9 to 10 m over the route's line where the walls' own section has room
    //   for it (lower where they close in, never under 6.3 m over the line), into the hero chamber, where it flies THROUGH
    //   THE HERO BEAM high over the route's line (8.4 m over it: a bird alight in the beam for a wingbeat), wheels round
    //   beyond it and stoops down along its lane's own wall to the low leg again.
    // Every point of the loop is held inside the walls' section at its own height (the keyhole's width there less a metre
    // for the walls' relief and a metre for the bird). The two lanes are flown in the same time, so the party keeps together.
    // A bird is always somewhere on its loop, at its own size: none is hidden, shrunk or thrown aside, at any place of the
    // route or any clock. Because the loop is long and the party is strung over two seconds of it, the slot is empty of
    // birds more often than not: a quiet place that a party of swifts crosses now and then.
    // THE CLEAR AIR is counted here, at the build, from the LENS'S PLACE: the lens rides the route's line whatever the turn
    // of the head, so the least distance in three dimensions between any point a bird can be at (its lane's loop, widened by
    // the bird's own weave) and any point of the route's whole line holds at every clock of every visit. It is left in the
    // scene's notes (entrySwifts.least, counted to the bird's middle; a wing tip reaches 0.86 m further at the most) for the
    // round's print.
    // THE LIGHT ON A BIRD is the light that falls at its place (airLight, read along the loop at the build): a bird in the
    // hero beam's light or in a pool's glow shows its pale throat and the warm light on its back; in the slot's shade it is a
    // dark shape.
    {
      const RS = makeRng('canyon-of-light:entryswifts:' + ctx.seed), nB = RS.int(5, 6), dLo = 24, dHi = pH.d - 13, M = 384;
      const LINE = []; for (let r = 0; r <= pH.d + 30; r += 0.25) { path.posAtDist(r, tv); LINE.push(tv.x, tv.y, tv.z); }
      const stAt = (d) => slotSt[clamp(Math.round((d + 10) / STEP), 0, nF - 1)];
      // (the point of the route's line nearest a place: its index into LINE, its squared distance left in nearD. A small function
      // of its own, asked many times, so the engine runs it fast: the same sums in the part's own body ran ten times slower)
      let nearD = 0;
      const nearLine = (x, y, z) => {
        let dm = 1e18, im = 0;
        for (let q = 0; q < LINE.length; q += 3) { const dx = x - LINE[q], dy = y - LINE[q + 1], dz = z - LINE[q + 2], d2 = dx * dx + dy * dy + dz * dz; if (d2 < dm) { dm = d2; im = q; } }
        nearD = dm; return im;
      };
      // (a place of the course, given as metres along the route, metres beside its line and metres above it, held in the slot's open air)
      const place = (d, lat, up, out) => {
        path.posAtDist(d, tv); right(d, tv2);
        const s = stAt(d), hF = tv.y + up - s.yFloor, mid = airMid(s, hF), half = Math.max(0, airHalf(s, hF) - 1);
        const l = clamp(lat, mid - half, mid + half);
        return out.set(tv.x + tv2.x * l, tv.y + up, tv.z + tv2.z * l);
      };
      // (how high over the route's line the high leg may fly at a station: 9.6 m where the section has room, lower where it has not)
      const highUp = (d) => { path.posAtDist(d, tv); const s = stAt(d); for (let up = 9.6; up > 6.3; up -= 0.5) if (airHalf(s, tv.y + up - s.yFloor) - 1 >= 0.9) return up; return 6.3; };
      // (how far off the route's line the wall on a lane's side stands at a place, hF metres over the floor: the nearest point
      // of the wall's own mesh within two stations along the slot and a metre and a half up and down)
      const wallOff = (d, sd, hF) => {
        const S = sides.find((q) => q.sgn === sd), ic = clamp(Math.round((d + 10) / STEP), 2, nF - 3);
        let m = 1e9;
        for (let i = ic - 2; i <= ic + 2; i++) { const sq = slotSt[i]; for (let k = Math.max(0, rowAtH(S, i, hF - 1.5) - 1), k1 = Math.min(RW, rowAtH(S, i, hF + 1.5)); k <= k1; k++) { const q = wallV(S, i, k); m = Math.min(m, ((posA[q] - sq.cx) * sq.rx + (posA[q + 2] - sq.cz) * sq.rz) * sd); } }
        return m;
      };
      // (a place of the low leg: at d metres of route, WALL_OFF metres off the wall on the lane's side, up metres and more over
      // the route's line; lifted until it is LINE_OFF metres and more from the route's whole line in three dimensions)
      const WEAVE = Math.hypot(0.3, 0.3), WALL_OFF = 1.2, LINE_OFF = 5.5 + WEAVE + 0.8;
      const wallPlace = (d, sd, up0, out) => {
        for (let up = up0; ; up += 0.25) {
          path.posAtDist(d, tv); right(d, tv2);
          const s = stAt(d), l = sd * Math.max(0, wallOff(d, sd, tv.y + up - s.yFloor) - WALL_OFF);
          out.set(tv.x + tv2.x * l, tv.y + up, tv.z + tv2.z * l);
          nearLine(out.x, out.y, out.z);
          if (nearD >= LINE_OFF * LINE_OFF || up >= 9) return out;
        }
      };
      const lanes = [], ph = [RS.range(0, 6.28), RS.range(0, 6.28)];
      let least = 1e9, period = 0;
      const tabs = [];
      for (const sd of [1, -1]) {
        const C = [], v = new THREE.Vector3();
        const add = (d, lat, up) => C.push(place(d, lat, up, v).clone()), addWall = (d, up) => C.push(wallPlace(d, sd, up, v).clone());
        const lowUp = (d) => clamp(3.05 + 0.55 * Math.sin(d * 0.17 + ph[0] - sd), 2.5, 3.6);   // (the lane's place across the slot is the wall's; the two phases sway its height and the high leg)
        const hiLat = (d) => { path.posAtDist(d, tv); const s = stAt(d); return airMid(s, tv.y + highUp(d) - s.yFloor) - sd * 1.1 + 0.5 * Math.sin(d * 0.13 + ph[1] + sd); };
        const nL = Math.max(4, Math.round((dHi - dLo) / 6)), nW = 2 * nL;   // (the low leg follows its wall: a point of it every three metres)
        for (let j = 0; j <= nW; j++) { const d = lerp(dHi, dLo, j / nW); addWall(d, lowUp(d)); }            // the low leg, along the wall, toward the way in
        addWall(dLo - 3.5, 4.8); add(dLo - 6.4, sd * 3.8, 7.2); add(dLo - 6.8, sd * 0.2, 8.8); add(dLo - 4.6, hiLat(dLo - 4.6), Math.min(9.2, highUp(dLo - 4.6)));   // the wheel up, off the wall and over the line
        for (let j = 0; j <= nL; j++) { const d = lerp(dLo - 1, dHi + 1, j / nL); add(d, hiLat(d), highUp(d) + 0.5 * Math.sin(d * 0.19 + ph[0] + sd)); }   // back up the slot, high
        // the wheel in the hero chamber: on, high, to the hero beam itself (a point of its middle line 8.4 m over the route's
        // line, in the thick of its lit dust), round beyond it and down the lane's own side to the low leg again
        add(pH.d - 5.5, hiLat(pH.d - 5.5) - sd * 0.8, Math.min(9.4, highUp(pH.d - 5.5)));
        { path.posAtDist(pH.d, tv); const k = (tv.y + 8.4 - HF[0].y) / heroUp.y; C.push(new THREE.Vector3(HF[0].x + heroUp.x * k, tv.y + 8.4, HF[0].z + heroUp.z * k)); }
        add(pH.d + 4.5, sd * 1.6, 7.6); add(pH.d + 1.5, sd * 3.6, 6.6); addWall(pH.d - 4.5, 5.0); addWall(pH.d - 9, 3.7);
        const curve = new THREE.CatmullRomCurve3(C, true, 'centripetal'), N0 = 720, P0 = [];
        for (let i = 0; i <= N0; i++) P0.push(curve.getPoint((i % N0) / N0));
        await Y();
        // (a bird slows as it climbs and gathers speed as it stoops: its speed at each point by its height over the loop's lowest)
        let yMin = 1e9; for (const q of P0) yMin = Math.min(yMin, q.y);
        const T0 = [0];
        for (let i = 1; i <= N0; i++) { const ym = 0.5 * (P0[i].y + P0[i - 1].y), sp = Math.sqrt(Math.max(15.5 * 15.5 - 2 * 7.8 * (ym - yMin), 64)); T0.push(T0[i - 1] + P0[i].distanceTo(P0[i - 1]) / sp); }
        lanes.push({ P0, T0, T: T0[N0] });
      }
      period = 0.5 * (lanes[0].T + lanes[1].T);
      for (const ln of lanes) {
        // (the loop at equal steps of time, and the light at each)
        const tab = new Float32Array((M + 1) * 4), { P0, T0, T } = ln;
        let i = 1;
        for (let m = 0; m <= M; m++) {
          const tt = (m % M) / M * T; if (m % M === 0) i = 1;
          while (i < P0.length - 1 && T0[i] < tt) i++;
          const f = clamp((tt - T0[i - 1]) / Math.max(T0[i] - T0[i - 1], 1e-6), 0, 1), a = P0[i - 1], b = P0[i], x = lerp(a.x, b.x, f), y = lerp(a.y, b.y, f), z = lerp(a.z, b.z, f);
          // (the nearest point of the route's line: for the clear air, and for the station whose light is asked)
          const im = nearLine(x, y, z);
          least = Math.min(least, Math.sqrt(nearD));
          tab[m * 4] = x; tab[m * 4 + 1] = y; tab[m * 4 + 2] = z; tab[m * 4 + 3] = Math.min(1.6, airLight(x, y, z, im / 3 * 0.25, false));
          if (m % 48 === 47) await Y();
        }
        tabs.push(tab);
      }
      const birds = [];
      for (let b = 0; b < nB; b++) birds.push({ lane: b % 2, off: RS.range(0, 2.1), ph: RS.range(0, 6.28), wv: RS.range(0.9, 1.6), wl: RS.range(0.15, 0.3), wu: RS.range(0.15, 0.3), size: RS.range(0.8, 1.0), aph: RS() });   // (the size of the world's own swifts; a weave of 0.3 m at the most, so a wing tip stays off the wall its lane follows)
      job.entrySwifts = { birds, tabs, M, period };
      scene.userData.entrySwifts = { n: nB, period, least: least - WEAVE, wing: 0.86, from: dLo - 6.6, to: pH.d + 4.5, lanes: lanes.map((l) => l.T) };
    }
    await Y();
}

async function canyonLife(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, scene, V, busy, warm, swing, windy, SUN, path, L, tv, dMouth, uMouth, rockMat, sunVis, pools, right, sL, HSH, courtD, STEP, slotSt,
      VS, ROWS, K1, sides, rowAtH, floorY, slotRocks, groundH, sunHl, sunHx, sunHz, brushOut, groundShade, posA, nor, slotLight, lightAtD, time,
      stationAt, wallV, beamCol, addShaft, courtBeam, addMotes } = job;
    // ------------------------------------------------------------------ the cottonwood sapling in its beam (second chamber)
    const p1 = pools.find((p) => p.chamber === 1);
    const wind = flora.makeWind({ direction: [0.3, -1], strength: 0.7 + 0.9 * windy, speed: 0.9, gustiness: 0.6 });
    // (one sapling and some dry brush: a leaf atlas of half the usual size, a quarter of the pixel work, drawn in short steps)
    const leafTex = { size: 512, alphaTest: 0.4 };
    await ctx.yield();
    await flora.prepareLeafTexture(leafTex, () => ctx.yield(), 8);
    await ctx.yield();
    const leafOpts = { wind, map: flora.makeLeafTexture(leafTex), backlight: 1.0, backlightTint: '#f4cf94', ambient: 1.1, leafAmbient: 1.6 };   // (the dry brush's material: straw against the light, never green)
    await Y();
    const leafMat = flora.windMaterial(leafOpts);
    await Y();
    const latOf = (s, x, z) => (x - s.cx) * s.rx + (z - s.cz) * s.rz;
    const sapPos = new THREE.Vector3();
    let sapTop = 5.5;
    { const s1 = stationAt(p1.dP), l = latOf(s1, p1.x, p1.z) - sL * 0.4; sapPos.set(s1.cx + s1.rx * l, floorY(s1, l) - 0.15, s1.cz + s1.rz * l); }   // in the middle of the court's patch of sun, on the side nearer the path
    {
      const R = V.fork('sapling');
      // a slim young cottonwood: pale bark, an airy narrow crown
      const sapH = R.range(5.2, 6.2) * 0.9;
      {                                                              // its shadow on the patch: the crown's, thrown down the light, and the trunk's line to it
        const hc = sapH * 0.66, k = hc / courtD.y;
        rockMat.uniforms.uCourtS.value.set(sapPos.x - courtD.x * k, sapPos.z - courtD.z * k, sapH * 0.27, 1);
        rockMat.uniforms.uCourtT.value.set(sapPos.x, sapPos.z, 1);
      }
      // ONE young cottonwood, the single green thing in the canyon: slender, a pale stem with a few ascending boughs and some
      // fifteen hundred small leaves, each on its own stalk. A cottonwood's leaf stalks are flat, so every leaf trembles in the
      // least air: the crown shimmers, yellow-green where its beam strikes it and glows through it, olive inside.
      // (the kit's oak is gone and nothing is built to hold its draws: the brush that draws after it is dealt anew once)
      await Y();
      {
        const R2 = makeRng('canyon-of-light:cottonwood:' + ctx.seed), H = sapH * 1.12, ph = R2.range(0, 6.28);
        const wp = [], wn = [], wi = []; let nw = 0;
        const LA = [], LC = [], LL = [], LK = [], LI = []; let nl = 0;
        const trunkAt = (t, out) => out.set(0.16 * Math.sin(t * 3.1 + ph) * t, H * 0.95 * t, 0.13 * Math.cos(t * 2.6 + ph) * t - 0.13 * t);
        const trunkR = (t) => lerp(0.085, 0.014, Math.pow(t, 0.8));
        const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tD = new THREE.Vector3(), n1 = new THREE.Vector3(), n2 = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0), XA = new THREE.Vector3(1, 0, 0);
        // a tapering tube along a curve (five-sided)
        const tube = (pt, n, r0, r1) => {
          for (let i = 0; i <= n; i++) {
            const t = i / n; pt(t, tA); pt(Math.min(1, t + 0.02), tB); tD.subVectors(tB, tA); if (tD.lengthSq() < 1e-10) { pt(t - 0.02, tB); tD.subVectors(tA, tB); } tD.normalize();
            n1.crossVectors(tD, Math.abs(tD.y) > 0.9 ? XA : UP).normalize(); n2.crossVectors(tD, n1);
            const r = lerp(r0, r1, t);
            for (let c = 0; c < 5; c++) { const a = c * 1.2566, cx = Math.cos(a), sx = Math.sin(a), x = n1.x * cx + n2.x * sx, y = n1.y * cx + n2.y * sx, z = n1.z * cx + n2.z * sx; wp.push(tA.x + x * r, tA.y + y * r, tA.z + z * r); wn.push(x, y, z); }
            if (i < n) for (let c = 0; c < 5; c++) { const a = nw + i * 5 + c, b = nw + i * 5 + (c + 1) % 5; wi.push(a, b, b + 5, a, b + 5, a + 5); }
          }
          nw += (n + 1) * 5;
        };
        // leaves hung along a bough: each on a stalk, blade down and out
        const leavesOn = (pt, n, s0, crownAx) => {
          for (let i = 0; i < n; i++) {
            const s = lerp(s0, 1, Math.pow(R2(), 0.75)); pt(s, tA);
            const x = tA.x + R2.range(-0.16, 0.16), y = tA.y + R2.range(-0.12, 0.2), z = tA.z + R2.range(-0.16, 0.16);
            const out = Math.hypot(x - crownAx.x, z - crownAx.z), yaw = Math.atan2(z - crownAx.z, x - crownAx.x) + R2.range(-1.1, 1.1), pit = R2.range(0.35, 1.25), size = R2.range(0.13, 0.2), phs = R2();
            const kd = clamp(0.25 + 0.75 * smoothstep(0.25, 1.05, out) + 0.25 * smoothstep(0.45, 0.95, y / H), 0, 1);   // lit on the outside and the top of the crown, olive inside
            for (let c = 0; c < 4; c++) { LA.push(x, y, z); LC.push(c === 0 || c === 3 ? -1 : 1, c < 2 ? -1 : 1); LL.push(yaw, pit, size, phs); LK.push(kd); }
            LI.push(nl, nl + 1, nl + 2, nl, nl + 2, nl + 3); nl += 4;
          }
        };
        tube(trunkAt, 14, trunkR(0), trunkR(1));
        const ax0 = new THREE.Vector3(0, 0, 0);
        leavesOn((t, o) => trunkAt(0.74 + 0.26 * t, o), 150, 0, ax0);
        await Y();
        const nB = 10;
        for (let b = 0; b < nB; b++) {
          const tb = 0.3 + 0.62 * (b + R2()) / nB, az = b * 2.39996 + R2.range(-0.4, 0.4), el = lerp(0.86, 0.36, tb) * R2.range(0.85, 1.15), len = H * lerp(0.3, 0.13, tb) * R2.range(0.85, 1.15);
          const st = trunkAt(tb, new THREE.Vector3()), d0 = new THREE.Vector3(Math.sin(el) * Math.cos(az), Math.cos(el), Math.sin(el) * Math.sin(az));
          const bough = (t, o) => o.copy(st).addScaledVector(d0, len * t).addScaledVector(UP, len * 0.3 * t * t);
          tube(bough, 6, trunkR(tb) * 0.62, 0.008);
          leavesOn(bough, Math.round(96 * len / (H * 0.2)), 0.22, ax0);
          for (const [ts, sg] of [[0.42, 1], [0.7, -1]]) {
            const s2 = bough(ts, new THREE.Vector3()), az2 = az + sg * R2.range(0.6, 1.0), d2 = new THREE.Vector3(Math.sin(el) * Math.cos(az2), Math.cos(el) * 0.9, Math.sin(el) * Math.sin(az2)).normalize(), l2 = len * R2.range(0.34, 0.5);
            const twig = (t, o) => o.copy(s2).addScaledVector(d2, l2 * t).addScaledVector(UP, l2 * 0.25 * t * t);
            tube(twig, 3, trunkR(tb) * 0.3, 0.006);
            leavesOn(twig, Math.round(40 * l2 / (H * 0.08)), 0.15, ax0);
          }
          if (b % 3 === 2) await Y();
        }
        await Y();
        const windD = new THREE.Vector2(0.3, -1).normalize();
        const tU = { uTime: time, uLight: { value: courtD.clone() }, uWindD: { value: windD }, uWindS: { value: 0.7 + 0.9 * windy } };
        const SWAY = /* glsl */`
          uniform float uTime, uWindS; uniform vec2 uWindD;
          vec3 sway(vec3 q){ float h = max(q.y, 0.0); return vec3(uWindD.x, 0.0, uWindD.y)*(h*h*0.0034*uWindS*(sin(uTime*1.1 + q.y*0.4) + 0.5*sin(uTime*2.3 + q.x*1.3 + q.z*0.9))); }`;
        const woodMat = new THREE.ShaderMaterial({
          uniforms: Object.assign(fx.fogUniforms(), tU, { uBark: { value: new THREE.Color('#cdbb9c') } }), fog: true,
          vertexShader: /* glsl */`
            #include <common>
            #include <fog_pars_vertex>
            ${SWAY}
            varying vec3 vN; varying float vH;
            void main(){
              vec3 p = position + sway(position); vN = normal; vH = position.y;
              vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
              gl_Position = projectionMatrix * mvPosition;
              #include <fog_vertex>
            }`,
          fragmentShader: /* glsl */`
            #include <common>
            #include <fog_pars_fragment>
            uniform vec3 uBark, uLight; varying vec3 vN; varying float vH;
            void main(){
              float l = 0.3 + 0.9*max(dot(normalize(vN), uLight), 0.0);
              gl_FragColor = vec4(uBark*l*(0.75 + 0.25*sin(vH*23.0)*sin(vH*7.3)), 1.0);   // pale young bark, faintly ringed
              #include <fog_fragment>
            }`,
        });
        const wg = new THREE.BufferGeometry();
        wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('normal', new THREE.Float32BufferAttribute(wn, 3)); wg.setIndex(wi);
        const wood = new THREE.Mesh(wg, woodMat); wood.position.copy(sapPos); wood.name = 'sapling'; wood.frustumCulled = false;
        scene.add(wood);
        await Y();
        const leafMat2 = new THREE.ShaderMaterial({
          uniforms: Object.assign(fx.fogUniforms(), tU), fog: true, side: THREE.DoubleSide,
          vertexShader: /* glsl */`
            #include <common>
            #include <fog_pars_vertex>
            attribute vec2 aC; attribute vec4 aL; attribute float aK;
            uniform vec3 uLight;
            ${SWAY}
            varying vec2 vC; varying float vLit, vK;
            void main(){
              float ph = aL.w*6.2832;
              float gust = 0.5 + 0.5*sin(uTime*0.7 + position.x*0.8 + position.z*0.6 + position.y*0.3);
              float tw = sin(uTime*(4.5 + 4.0*aL.w) + ph)*(0.3 + 0.6*gust*uWindS);          // the blade trembles about its stalk
              float pit = aL.y + 0.22*sin(uTime*1.9 + ph*1.7)*(0.4 + gust);                // and swings on it
              vec3 d = vec3(cos(aL.x)*sin(pit), -cos(pit), sin(aL.x)*sin(pit));            // the stalk's line: down and out from the twig
              vec3 a0 = cross(d, vec3(0.0, 1.0, 0.0)); a0 /= max(length(a0), 1e-3);
              vec3 n0 = cross(a0, d);
              vec3 a = a0*cos(tw) + n0*sin(tw), n = n0*cos(tw) - a0*sin(tw);
              vec3 anchor = position + sway(position);
              // (far off a leaf is held to about a pixel and a half, so the crown stays a body of leaves and never a sparkle)
              float dist = length((modelViewMatrix*vec4(anchor, 1.0)).xyz);
              float sz = max(aL.z, dist*0.0045);
              vec3 p = anchor + d*((aC.y*0.5 + 0.62)*sz) + a*(aC.x*0.46*sz);
              vC = aC; vK = aK; vLit = dot(n, uLight);
              vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
              gl_Position = projectionMatrix * mvPosition;
              #include <fog_vertex>
            }`,
          fragmentShader: /* glsl */`
            #include <common>
            #include <fog_pars_fragment>
            varying vec2 vC; varying float vLit, vK;
            void main(){
              // a cottonwood's leaf: broad and round at the stalk, drawn out to a point
              float y = vC.y, x = abs(vC.x);
              float lo = (-0.3 - y)/0.7, hi = (y + 0.3)/1.3;
              float w = y < -0.3 ? 0.92*sqrt(max(1.0 - lo*lo, 0.0)) : 0.92*pow(max(1.0 - hi, 0.0), 0.85);
              if (x > w) discard;
              float f = abs(vLit);                                      // lit on one face, glowing through on the other
              vec3 shade = vec3(0.07, 0.15, 0.035), lit = vec3(0.47, 0.68, 0.1);
              vec3 col = mix(shade, lit, smoothstep(0.04, 0.8, f)*(0.3 + 0.7*vK)) + lit*0.3*pow(f, 6.0)*vK;   // (.. and a glint as a blade turns flat to the light)
              col *= 1.0 - 0.22*(1.0 - smoothstep(0.0, 0.1, x));        // the midrib
              gl_FragColor = vec4(col, 1.0);
              #include <fog_fragment>
            }`,
        });
        const lg = new THREE.BufferGeometry();
        lg.setAttribute('position', new THREE.Float32BufferAttribute(LA, 3)); lg.setAttribute('aC', new THREE.Float32BufferAttribute(LC, 2));
        lg.setAttribute('aL', new THREE.Float32BufferAttribute(LL, 4)); lg.setAttribute('aK', new THREE.Float32BufferAttribute(LK, 1)); lg.setIndex(LI);
        const leaves = new THREE.Mesh(lg, leafMat2); leaves.position.copy(sapPos); leaves.name = 'sapling-leaves'; leaves.frustumCulled = false;
        scene.add(leaves);
        // its shadow on the patch: the crown's, thrown down the light, and the stem's line to it
        const hc = H * 0.66, k = hc / courtD.y;
        rockMat.uniforms.uCourtS.value.set(sapPos.x - courtD.x * k, sapPos.z - courtD.z * k, H * 0.25, 1);
        sapTop = H;
        // (the crown is leaves, not air: of the beam's lit dust behind it only a fifth is seen through it, so the tree stands green in its light)
        if (courtBeam) { courtBeam.uniforms.uOcc.value.set(sapPos.x, sapPos.y + H * 0.64, sapPos.z, 0.92); courtBeam.uniforms.uOccR.value.set(H * 0.28, H * 0.4, H * 0.28); }
      }
      await Y();
      // dry tumbleweed and brush at the walls' feet
      const bush = flora.bushGeometry({ rng: R, size: 1.1, detail: 1, leaf: '#ac8850', leafLight: '#dcb97c', leafDark: '#6e4e30', bark: '#7a6248' });   // (dry: straw, tan and brown twigs)
      await Y();
      const spots = [];
      for (let i = 0; i < 26; i++) {
        const d = R.range(0.02, uMouth - 0.02) * L, s = stationAt(d), sd = R.sign(), l = sd * Math.min(R.range(4.2, 6.2), s.fe[sd < 0 ? 0 : 1].l - 2.4);
        const x = s.cx + s.rx * l, z = s.cz + s.rz * l, sc = R.range(0.45, 1.0);
        if (Math.hypot(x - HSH[0].x, z - HSH[0].z) < 6.5) continue;                 // (nothing grows in the hero beam's pool)
        spots.push([x, floorY(s, l) - 0.05, z, sc, 0.2 + 0.5 * Math.min(1.5, slotLight(x, s.yFloor + 2.5, z, 0, 1, 0, s.d, 6))]);
      }
      // dry brush out in the amphitheatre: ONE bush to a place (about ninety in all with the slot's), of unequal size, some low
      // and spreading, some upright, straw to brown, each with its patch of shade on the sand
      let nBr = 0;
      for (const b of brushOut) {
        const lv = 0.55 + 0.4 * sunVis(b[0], 2, b[1]), sc = b[2] * R.range(0.7, 1.4), x = b[0], z = b[1], ht = R.range(0.55, 1.15), hue = R();
        spots.push([x, groundH(x, z) - 0.05, z, sc, lv * R.range(0.82, 1.08), ht, hue]);
        groundShade.push([x, z, sc * 0.8, sc * 0.55 * ht, 0.16 + 0.3 * (lv - 0.55) / 0.4]);
        if (++nBr % 6 === 0) await Y();
      }
      await Y();
      // (and a few dry bushes round the court's patch of sun, straw-bright in it: with the fallen blocks they are the lit things
      // of the court's middle distance. They are added after the last bush of the plain, so they shift no other bush's draws)
      {
        const RB = makeRng('canyon-of-light:courtbrush:' + ctx.seed);
        for (let i = 0; i < 4; i++) {
          const d = p1.dP + RB.range(-11, 13), s = stationAt(d), l = latOf(s, p1.x, p1.z) + RB.range(-3.2, 3.2), x = s.cx + s.rx * l, z = s.cz + s.rz * l, sc = RB.range(0.5, 0.85);
          if (Math.hypot(x - sapPos.x, z - sapPos.z) < 2.6 || Math.abs(l) < 5 || slotRocks.some((q) => Math.hypot(x - q.x, z - q.z) < q.r + 0.5)) continue;
          spots.push([x, floorY(s, l) - 0.05, z, sc, 1.15]);
        }
      }
      const im = new THREE.InstancedMesh(bush, leafMat, spots.length);
      const mm = new THREE.Matrix4(), qq = new THREE.Quaternion(), ss = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), ic = new THREE.Color();
      spots.forEach((s, i) => {
        const hue = s[6] ?? 0.5, ht = s[5] ?? 1;
        qq.setFromAxisAngle(up, R.range(0, 6.28)); ss.set(s[3], s[3] * 0.8 * ht, s[3]); mm.compose(tv.set(s[0], s[1], s[2]), qq, ss); im.setMatrixAt(i, mm);
        // (dimmed: the leaf material is tuned for the sapling in its beam)
        ic.setRGB(s[4] * lerp(0.98, 0.84, hue), s[4] * lerp(0.62, 0.48, hue), s[4] * lerp(0.3, 0.24, hue));   // (dry: straw to brown, never green)
        im.setColorAt(i, ic);
      });
      im.frustumCulled = false; im.name = 'brush';
      scene.add(im);
    }
    await Y();
    // ------------------------------------------------------------------ the shade stones and brush lay on the plain
    // One sheet of soft-edged patches lying on the sand, each stretched away from the sun, multiplied into the picture:
    // contact shade and a short cast shadow, so nothing on the plain looks laid on it afterwards.
    {
      const n = groundShade.length, SEG = 8, PV = 2 * SEG + 1, P = new Float32Array(n * PV * 3), C = new Float32Array(n * PV * 3), I = [];
      const cot = Math.min(sunHl / Math.max(SUN.y, 0.2), 1.3), SH = [0.4, 0.33, 0.42];
      const shadeCol = (v, a) => { const t = Math.min(a * a * (3 - 2 * a) * 1.25, 1); C[v * 3] = lerp(1, SH[0], t); C[v * 3 + 1] = lerp(1, SH[1], t); C[v * 3 + 2] = lerp(1, SH[2], t); };
      for (let i = 0; i < n; i++) {
        const [x, z, r, h, k] = groundShade[i], thr = 0.5 * h * cot, len = r + thr, cx = x - sunHx * thr, cz = z - sunHz * thr, b = i * PV;
        P[b * 3] = cx; P[b * 3 + 1] = groundH(cx, cz) + 0.16; P[b * 3 + 2] = cz; shadeCol(b, k);
        for (let rg = 0; rg < 2; rg++) for (let j = 0; j < SEG; j++) {
          const th = j / SEG * Math.PI * 2, f = rg ? 1 : 0.55, al = Math.cos(th) * len * f, ac = Math.sin(th) * r * f, v = b + 1 + rg * SEG + j;
          const px = cx + sunHx * al - sunHz * ac, pz = cz + sunHz * al + sunHx * ac;
          P[v * 3] = px; P[v * 3 + 1] = groundH(px, pz) + 0.16; P[v * 3 + 2] = pz; shadeCol(v, rg ? 0 : k * 0.86);
        }
        for (let j = 0; j < SEG; j++) { const j1 = (j + 1) % SEG, a0 = b + 1 + j, a1 = b + 1 + j1, c0 = a0 + SEG, c1 = a1 + SEG; I.push(b, a1, a0, a0, a1, c1, a0, c1, c0); }
        if (i % 8 === 7) await Y();
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(P, 3)); g.setAttribute('color', new THREE.BufferAttribute(C, 3)); g.setIndex(I);
      // (the sky ribbon's own kind of material, so no further shader: white leaves the picture as it is, the patch's colour darkens it)
      const m = new THREE.MeshBasicMaterial({
        vertexColors: true, fog: false, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.ZeroFactor, blendDst: THREE.SrcColorFactor,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      });
      const mesh = new THREE.Mesh(g, m); mesh.name = 'ground-shade'; mesh.frustumCulled = false; mesh.renderOrder = 1;
      scene.add(mesh);
    }
    await Y();

    // ------------------------------------------------------------------ petroglyphs on the right wall of the second chamber
    const glyphAt = new THREE.Vector3();
    {
      const R = V.fork('glyphs');
      const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512;
      const c = cv.getContext('2d');
      c.strokeStyle = c.fillStyle = '#ffffff'; c.lineCap = 'round'; c.lineJoin = 'round';
      const spiral = (x, y, r, turns) => { c.beginPath(); for (let a = 0; a <= turns * 6.283; a += 0.15) { const rr = r * a / (turns * 6.283); c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.stroke(); };
      const rings = (x, y, r) => { for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(x, y, r * k / 3, 0, 6.283); c.stroke(); } c.beginPath(); c.arc(x, y, r * 0.1, 0, 6.283); c.fill(); };
      const hand = (x, y, s, rot) => {
        c.save(); c.translate(x, y); c.rotate(rot);
        c.beginPath(); c.ellipse(0, 0, s * 0.42, s * 0.5, 0, 0, 6.283); c.fill();
        for (let f = 0; f < 5; f++) { const a = -Math.PI / 2 + (f - 2) * 0.36 + (f === 0 ? -0.35 : 0), l = s * (f === 0 ? 0.75 : 1.05 - Math.abs(f - 2.3) * 0.1); c.lineWidth = s * 0.17; c.beginPath(); c.moveTo(Math.cos(a) * s * 0.35, Math.sin(a) * s * 0.4); c.lineTo(Math.cos(a) * l, Math.sin(a) * l); c.stroke(); }
        c.restore();
      };
      const sheep = (x, y, s, dir) => {
        c.lineWidth = s * 0.1; c.beginPath(); c.ellipse(x, y, s * 0.5, s * 0.2, 0, 0, 6.283); c.fill();
        for (const lx of [-0.38, -0.22, 0.22, 0.38]) { c.beginPath(); c.moveTo(x + lx * s, y + s * 0.1); c.lineTo(x + lx * s, y + s * 0.5); c.stroke(); }
        c.beginPath(); c.moveTo(x + dir * s * 0.45, y - s * 0.05); c.lineTo(x + dir * s * 0.68, y - s * 0.3); c.stroke();
        c.beginPath(); c.arc(x + dir * s * 0.5, y - s * 0.42, s * 0.24, dir > 0 ? -0.3 : Math.PI - 2.4, dir > 0 ? 2.4 : Math.PI + 0.3); c.stroke();
      };
      const figure = (x, y, s) => {
        c.beginPath(); c.moveTo(x - s * 0.3, y - s * 0.5); c.lineTo(x + s * 0.3, y - s * 0.5); c.lineTo(x + s * 0.12, y + s * 0.5); c.lineTo(x - s * 0.12, y + s * 0.5); c.closePath(); c.fill();
        c.beginPath(); c.arc(x, y - s * 0.68, s * 0.14, 0, 6.283); c.fill();
        c.lineWidth = s * 0.07; for (const sd of [-1, 1]) { c.beginPath(); c.moveTo(x + sd * s * 0.3, y - s * 0.45); c.lineTo(x + sd * s * 0.5, y - s * 0.1); c.stroke(); c.beginPath(); c.moveTo(x + sd * s * 0.06, y - s * 0.8); c.lineTo(x + sd * s * 0.16, y - s * 1.0); c.stroke(); }
      };
      const zig = (x, y, w, n) => { c.beginPath(); for (let k = 0; k <= n; k++) c.lineTo(x + w * k / n, y + (k % 2 ? -1 : 1) * 12); c.stroke(); };
      const kinds = ['spiral', 'spiral', 'hand', 'hand', 'hand', 'rings', 'sheep', 'sheep', 'figure', 'zig', 'spiral', 'hand'];
      R.shuffle(kinds);
      for (let i = 0; i < kinds.length; i++) {
        const kind = kinds[i];
        const x = 70 + (i % 6) * 176 + R.range(-36, 36), y = 140 + Math.floor(i / 6) * 220 + R.range(-50, 50);
        c.lineWidth = R.range(6, 9);
        if (kind === 'spiral') spiral(x, y, R.range(46, 74), R.range(2.6, 3.6));
        else if (kind === 'rings') rings(x, y, R.range(42, 60));
        else if (kind === 'hand') { hand(x, y + 20, R.range(34, 44), R.range(-0.4, 0.4)); if (R.chance(0.5)) hand(x + R.range(60, 80), y - 30, R.range(30, 38), R.range(-0.4, 0.4)); }
        else if (kind === 'sheep') { const dir = R.sign(); sheep(x, y, R.range(60, 84), dir); if (R.chance(0.6)) sheep(x - dir * 70, y + 70, 48, dir); }
        else if (kind === 'figure') figure(x, y, R.range(80, 104));
        else zig(x - 60, y, R.range(120, 170), 9);
        if (i % 3 === 2) await Y();
      }
      c.globalCompositeOperation = 'destination-out';                        // pecked, weathered edges
      await Y();
      for (let i = 0; i < 5200; i++) { c.globalAlpha = R.range(0.25, 0.9); c.beginPath(); c.arc(R.range(0, 1024), R.range(0, 512), R.range(0.8, 3.2), 0, 6.283); c.fill(); if (i % 400 === 399) await Y(); }
      await Y();
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      const S = sides.find((q) => q.sgn === sL);                          // the court's shaded wall, lit by the patch of sun in front of it
      const ni = 8, i0 = clamp(Math.round((p1.d + 15 + 10) / STEP), 0, slotSt.length - ni - 2);   // (some way down the court, on the wall the route looks along: it is in the picture well before it passes)
      // (on upright rock, above the sand banked at the wall's foot: the lowest row along the panel that is neither drift nor shelf)
      const iMid = i0 + (ni >> 1);
      let k0 = rowAtH(S, iMid, 3.6);
      for (; k0 < K1 - 12; k0++) { let ok = true; for (let a = 0; a < ni; a++) { const v = S.base + (i0 + a) * ROWS + k0; if (nor[v * 3 + 1] > 0.42 || VS.shd[v * 3 + 2] > 0.06) { ok = false; break; } } if (ok) break; }
      const nk = clamp(rowAtH(S, iMid, posA[wallV(S, iMid, k0) + 1] - S.st[iMid].yFloor + 4.4) - k0 + 1, 8, 40);
      // the blade of sun that picks them out: it rakes down the wall from up the canyon, a lobed patch on the rock (drawn by the
      // rock's shader; no shaft is drawn in the air for it: the eye looks almost straight down that light)
      const qmid = wallV(S, iMid, k0 + (nk >> 1)), gC = new THREE.Vector3(posA[qmid], posA[qmid + 1], posA[qmid + 2]), gL = new THREE.Vector3();
      { path.tangentAtDist(p1.d + 20, tv); const tl = Math.hypot(tv.x, tv.z) || 1; gL.set(nor[qmid] * 0.1 + tv.x / tl * 0.24, 1, nor[qmid + 2] * 0.1 + tv.z / tl * 0.24).normalize(); }   // (a pillar of the slot's own kind, all but upright: it rakes down the face of the wall from its rim, leaning a little down the canyon to where the sun stands, and stands clear of the court's own slanting beam in every view)
      const gW = 2.1;
      rockMat.uniforms.uGlyphC.value.set(gC.x, gC.y, gC.z, gW); rockMat.uniforms.uGlyphL.value.copy(gL);
      // The marks are drawn by the rock's own shader, on the rock itself: a panel of dark desert varnish on this stretch of wall,
      // the figures pecked through it to the paler stone (no sheet laid over the wall: nothing floats, the wall's light, its
      // beds and the sand banked against it all pass across the panel as they do across the rock round it).
      {
        const qa = wallV(S, i0, k0 + (nk >> 1)), qb = wallV(S, i0 + ni - 1, k0 + (nk >> 1)), ax = posA[qb] - posA[qa], az = posA[qb + 2] - posA[qa + 2], al = Math.hypot(ax, az) || 1;
        const nl = Math.hypot(nor[qmid], nor[qmid + 2]) || 1;
        rockMat.uniforms.uGlyphU.value.set(ax / al, 0, az / al, 0.5 * al + 0.3);
        rockMat.uniforms.uGlyphV.value.set(0, 1, 0, 2.3);
        rockMat.uniforms.uGlyphN.value.set(nor[qmid] / nl, 0, nor[qmid + 2] / nl);
        tex.colorSpace = THREE.NoColorSpace; tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;
        rockMat.uniforms.uGlyphTex.value = tex;
      }
      glyphAt.copy(gC);
      // and the blade of sun is drawn in the air too: a thin soft shaft of lit dust down the light's own line, ending on the panel
      {
        const e1 = new THREE.Vector3(0, 1, 0); e1.addScaledVector(gL, -e1.dot(gL)).normalize();
        const e2 = new THREE.Vector3().crossVectors(gL, e1).normalize(), ft = { x: gC.x - gL.x * 1.2, y: gC.y - gL.y * 1.2, z: gC.z - gL.z * 1.2 };
                // (round and soft: brightest along its axis and melting away to nothing at its edge, from whichever side it is seen)
        addShaft(ft, gL, e1, e2, gW * 0.62, gW * 0.74, 26, beamCol.clone().multiplyScalar(0.7 * (0.9 + 0.25 * warm)), [3, 16], 31.7, 0.7, 1, [3, 0.6, 0.25], 0.3, [42, 90, 0.6], 0.15);   // (far down the canyon it is held as the pillars are, by the same numbers)
        addMotes({ x: ft.x + gL.x * 2, y: ft.y + gL.y * 2, z: ft.z + gL.z * 2, a: gW * 0.55, b: gW * 0.65 }, gL, e1, e2, Math.round(220 * busy), 20, makeRng('canyon-of-light:glyphmotes:' + ctx.seed), 1.2);
      }
    }
    await Y();

    // ------------------------------------------------------------------ tumbleweeds rolling on the slot's sand
    const weeds = [], tr0 = new THREE.Vector3();
    {
      // a ball of thin curved twigs: three-sided tubes whose radius lives in the vertex shader, so a twig never gets
      // thinner than about a pixel and a half however far away it rolls
      const R = V.fork('weeds'), wp = [], wn = [], wi = [];
      let nv = 0;
      const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tT = new THREE.Vector3();
      for (let a = 0; a < 46; a++) {
        const ax = new THREE.Vector3(R.gauss(), R.gauss(), R.gauss()).normalize(), ph = R.range(0, 6.28), arc = R.range(1.5, 4.5), tilt = R.range(0.55, 1);
        const e1 = new THREE.Vector3(1, 0.3, 0.2).cross(ax).normalize(), e2 = ax.clone().cross(e1), shell = a % 3 === 0 ? 0.62 : 1;
        const SEGS = 9, pt = (k, out) => {
          const t = ph + arc * k / SEGS, rr = 0.5 * shell * (0.8 + 0.2 * Math.sin(t * 3 + a));
          return out.copy(e1).multiplyScalar(Math.cos(t) * rr).addScaledVector(e2, Math.sin(t) * rr).addScaledVector(ax, (tilt - 1) * 0.5);
        };
        for (let k = 0; k <= SEGS; k++) {
          pt(k, tA); pt(k + 0.1, tB); tT.subVectors(tB, tA).normalize();
          const n1 = tB.crossVectors(tT, ax).normalize(), n2 = new THREE.Vector3().crossVectors(tT, n1);
          for (let c = 0; c < 3; c++) {
            const an = c * 2.0944, cx = Math.cos(an), sx = Math.sin(an);
            wp.push(tA.x, tA.y, tA.z); wn.push(n1.x * cx + n2.x * sx, n1.y * cx + n2.y * sx, n1.z * cx + n2.z * sx);
          }
          if (k < SEGS) for (let c = 0; c < 3; c++) { const p = nv + k * 3 + c, q = nv + k * 3 + (c + 1) % 3; wi.push(p, q, q + 3, p, q + 3, p + 3); }
        }
        nv += (SEGS + 1) * 3;
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(wn, 3));
      g.setIndex(wi);
      g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 0.7);
      const weedMat = (color) => new THREE.ShaderMaterial({
        uniforms: Object.assign(fx.fogUniforms(), { uCol: { value: color } }), fog: true,
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          varying float vSh;
          void main(){
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vec3 wn = normalize(mat3(modelMatrix) * normal);
            wp.xyz += wn * max(0.014, distance(wp.xyz, cameraPosition) * 0.0017);
            vSh = 0.62 + 0.38 * wn.y + 0.25 * (length(position) * 2.0 - 0.7);        // darker toward the heart of the ball
            vec4 mvPosition = viewMatrix * wp;
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uCol; varying float vSh;
          void main(){
            gl_FragColor = vec4(uCol * vSh, 1.0);
            #include <fog_fragment>
          }`,
      });
      const nW = R.int(2, 4);
      for (let i = 0; i < nW; i++) {
        const d0 = (i === 0 ? p1.d + 16 : R.range(0.06, uMouth - 0.06) * L), lat = R.range(-3, 3), size = R.range(0.8, 1.3);
        path.posAtDist(d0, tv);
        const lw = 0.22 + 0.42 * Math.min(1.4, lightAtD(d0));
        const o = new THREE.Mesh(g, weedMat(new THREE.Color('#c9a876').multiplyScalar(lw))); o.scale.setScalar(size); o.name = 'tumbleweed';
        scene.add(o);
        weeds.push({ o, d0, lat, size, ph: R.range(0, 6.28), amp: R.range(3, 7) * (0.5 + windy), rate: R.range(0.16, 0.3) });
      }
      // (one more that keeps to the last straight before the mouth, bowling up and down it on the draught from the pour-off)
      {
        const RW2 = makeRng('canyon-of-light:mouthweed:' + ctx.seed), d0 = dMouth - RW2.range(40, 48), size = RW2.range(0.95, 1.3);
        path.posAtDist(d0, tv);
        const o = new THREE.Mesh(g, weedMat(new THREE.Color('#c9a876').multiplyScalar(0.22 + 0.42 * Math.min(1.4, lightAtD(d0))))); o.scale.setScalar(size); o.name = 'tumbleweed';
        scene.add(o);
        weeds.push({ o, d0, lat: RW2.range(-2.6, 2.6), size, ph: RW2.range(0, 6.28), amp: RW2.range(11, 14), rate: RW2.range(0.3, 0.4) });
      }
      // and two more out on the plain, bowling along beside the route's low pass
      const RP = makeRng('canyon-of-light:plainweeds:' + ctx.seed);
      for (let i = 0; i < 3; i++) {
        const d0 = lerp(dMouth + 52, L - 100, (i + RP()) / 3), sd = i === 1 ? -swing : swing, size = RP.range(0.9, 1.4);
        path.posAtDist(d0, tv); right(d0, tr0);
        const off0 = RP.range(7.5, 12), x0 = tv.x + tr0.x * sd * off0, z0 = tv.z + tr0.z * sd * off0, a = Math.atan2(tr0.z, tr0.x) + RP.range(-0.5, 0.5) + 1.57;
        const o = new THREE.Mesh(g, weedMat(new THREE.Color('#c9a876').multiplyScalar(0.62))); o.scale.setScalar(size); o.name = 'tumbleweed';
        scene.add(o);
        weeds.push({ o, plain: true, x0, z0, dx: Math.cos(a), dz: Math.sin(a), size, ph: RP.range(0, 6.28), amp: RP.range(6, 10), rate: RP.range(0.22, 0.34) });
      }
    }
    await Y();
    Object.assign(job, { wind, sapPos, glyphAt, weeds });
}

async function canyonFlight(ctx, job) {
    await ctx.yield();                                            // (made ready by the call: the hand-back comes before its first line runs)
    const { Y, scene, V, busy, rare, flip, swing, windy, nSwifts, nRavens, palette, path, L, duration, tv, tv2, dMouth, uMouth, sky, rig, hero,
      rockMat, U_COURT, pools, right, pH, heroUp, HSH, court, courtD, STEP, slotSt, sides, rowAtH, floorY, groundH, HD, posA, nor, pC, time, set,
      stationAt, wallV, moteMats, motes, wind, sapPos, glyphAt, weeds, entrySwifts, beamCol } = job;
    // ------------------------------------------------------------------ swifts and ravens
    const fauna = F.makeFauna(scene, { light: F.lightFrom(scene, { groundIntensity: 1.2, ground: palette[1] }) });
    await Y();
    const B = V.fork('birds');
    await ctx.yield();
    fauna.add(F.makeFlock({                                                  // darting down the slot ahead of the camera
      rng: B, species: 'swifts', count: Math.round(nSwifts * 0.35), size: 1.6, spread: [1.3, 1.28, 18], wander: [0.3, 0.3, 1.2, 0.9], maxSigma: 3,   // (the flock cure: an escort laid by its own numbers; the spread was 2.6, 3.2, 18, the wander 1.6, 2.2, 5, 0.9)
      along: { path, side: 0, up: 5.8, lead: 27, from: 0.02, to: uMouth + 0.05, drift: 9 },   // (up was 2.2: at 5.8 the box of three scatters, the wander and the body stay 2.0 m and more over the route's line on every deal)
    }), { always: true });
    await ctx.yield();
    fauna.add(F.makeFlock({                                                  // wheeling over the amphitheatre
      rng: B, species: 'swifts', count: nSwifts, size: 2.8, spread: [30, 10, 30], center: [swing * 13, 19, 120], radius: 40, height: 9,   // (low, round the route's swing over the plain: they cross the frame beside the hoodoos)
    }));
    await ctx.yield();
    // White-throated swifts of the world's own, each steered here and beating its wings in the vertex shader. A stream of them
    // comes in at the mouth and darts UP the slot toward the eye, past it and on through the beams, all the way to the hero
    // chamber, where they climb out through the slit: wherever the camera is in the slot, swifts are coming at it. The others
    // wheel close round the three hoodoos, beside the route's swing over the plain.
    const swiftBirds = [];
    let swiftMesh = null, swiftK = 1, entryMesh = null, entryLit = null, entryL = 0;
    const swA = new THREE.Vector3(), swB = new THREE.Vector3(), swM = new THREE.Matrix4(), swQ = new THREE.Quaternion(), swS = new THREE.Vector3(), swO = new THREE.Object3D();
    {
      const RS = makeRng('canyon-of-light:swifts:' + ctx.seed);
      const nStream = Math.round(14 * busy), nWheel = Math.round(11 * busy), nB = nStream + nWheel;
      // body, forked tail, two swept wings (aWing: how far each point rides the wing beat), a white throat and belly underneath
      const sp = [0, 0, 0.42, -0.06, 0, -0.3, 0.06, 0, -0.3, -0.06, 0, -0.3, -0.1, 0, -0.55, 0, 0, -0.32, 0.06, 0, -0.3, 0, 0, -0.32, 0.1, 0, -0.55];
      const sw = [0, 0, 0, 0, 0, 0, 0, 0, 0], tone = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (const m of [-1, 1]) {
        sp.push(m * 0.03, 0, 0.2, m * 0.03, 0, -0.06, m * 0.45, 0, 0.03, m * 0.45, 0, 0.03, m * 0.03, 0, -0.06, m * 0.4, 0, -0.1, m * 0.45, 0, 0.03, m * 0.4, 0, -0.1, m * 0.86, 0, -0.4);
        sw.push(0, 0, 0.6, 0.6, 0, 0.6, 0.6, 0.6, 1); tone.push(0, 0, 0, 0, 0, 0, 0, 0, 0);
      }
      sp.push(0, -0.014, 0.36, -0.05, -0.014, 0.08, 0.05, -0.014, 0.08, -0.05, -0.014, 0.08, 0.05, -0.014, 0.08, 0, -0.014, -0.24);
      sw.push(0, 0, 0, 0, 0, 0); tone.push(1, 1, 1, 1, 1, 0.6);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3)); g.setAttribute('aWing', new THREE.Float32BufferAttribute(sw, 1)); g.setAttribute('aTone', new THREE.Float32BufferAttribute(tone, 1));
      const phs = new Float32Array(nB); for (let i = 0; i < nB; i++) phs[i] = RS();
      g.setAttribute('aPh', new THREE.InstancedBufferAttribute(phs, 1));
      const m = new THREE.ShaderMaterial({
        uniforms: Object.assign(fx.fogUniforms(), { uTime: time, uBody: { value: new THREE.Color('#1c151c') }, uThroat: { value: new THREE.Color('#e9dfd0') } }), fog: true, side: THREE.DoubleSide,
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          attribute float aWing, aTone, aPh;
          uniform float uTime;
          varying float vTone, vUp;
          void main(){
            float gate = smoothstep(-0.2, 0.3, sin(uTime*1.7 + aPh*50.0));                 // flicker, then glide
            float flap = sin(uTime*31.0 + aPh*100.0)*0.6*gate - 0.12*(1.0 - gate);
            vec3 l = position; l.y += aWing*abs(l.x)*flap;
            vec4 wp = modelMatrix*instanceMatrix*vec4(l, 1.0);
            vTone = aTone; vUp = normalize(mat3(instanceMatrix)*vec3(0.0, 1.0, 0.0)).y;
            vec4 mvPosition = viewMatrix*wp;
            gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uBody, uThroat; varying float vTone, vUp;
          void main(){
            gl_FragColor = vec4(mix(uBody*(0.7 + 0.6*vUp), uThroat*0.55, vTone), 1.0);
            #include <fog_fragment>
          }`,
      });
      swiftMesh = new THREE.InstancedMesh(g, m, nB); swiftMesh.name = 'swifts-own'; swiftMesh.frustumCulled = false;
      scene.add(swiftMesh);
      const dA = dMouth + 34, dB = pH.d - 6;
      for (let i = 0; i < nB; i++) {
        if (i < nStream) {
          // (in loose parties of three or four, each bird on its own line through the slot: beside, above or below the route, never along it)
          const party = Math.floor(i / 4), up = RS.sign() * RS.range(2.1, 3.8);
          swiftBirds.push({ stream: true, off: party * (dA - dB) / Math.ceil(nStream / 4) + RS.range(0, 16), lat: RS.range(-3.4, 3.4), up, speed: RS.range(15, 19), ph: RS.range(0, 6.28), wv: RS.range(0.9, 1.6), size: RS.range(0.72, 0.95) });
        } else {
          const hd = HD[(i - nStream) % HD.length];
          swiftBirds.push({ stream: false, hd, rad: hd.r + RS.range(2.6, 7.5), y: hd.yb + (hd.h + 2.5) * RS.range(0.42, 1.08), w: RS.sign() * RS.range(0.75, 1.25), ph: RS.range(0, 6.28), bob: RS.range(1, 3), size: RS.range(0.95, 1.3) });
        }
      }
      swiftMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      // THE ENTRY SWIFTS (slotLife laid their course and read its light): the same bird, its own mesh and its own shader, which
      // lights it by the light that falls where it is (aLit, handed to each bird from its loop's table every frame): a dark shape
      // in the slot's shade, darker than the wall behind it; in a beam or a glow its throat and its back take the warm light of
      // the rock round it (the designer's word of 10-09 17:54: the lit throat warmed toward the rock's own light). Each bird flies its
      // lane's loop at the world's clock, a little behind or ahead of the others, with a small weave of its own. Always there,
      // always its own size.
      const nE = entrySwifts.birds.length, ge = new THREE.BufferGeometry();
      ge.setAttribute('position', g.attributes.position); ge.setAttribute('aWing', g.attributes.aWing); ge.setAttribute('aTone', g.attributes.aTone);
      ge.setAttribute('aPh', new THREE.InstancedBufferAttribute(new Float32Array(entrySwifts.birds.map((b) => b.aph)), 1));
      entryLit = new THREE.InstancedBufferAttribute(new Float32Array(nE), 1); entryLit.setUsage(THREE.DynamicDrawUsage); ge.setAttribute('aLit', entryLit);
      const me = new THREE.ShaderMaterial({
        uniforms: Object.assign(fx.fogUniforms(), { uTime: time, uBody: { value: new THREE.Color('#1c151c') }, uThroat: { value: new THREE.Color('#e9dfd0') }, uLight: { value: rockMat.uniforms.uSunCol.value.clone().multiply(new THREE.Color(0.35, 0.22, 0.14)) } }), fog: true, side: THREE.DoubleSide,   // (the light on a bird is the rock's own sun turned umber, as the walls throw it back: a lit throat is warm tan, never pale lilac)
        vertexShader: /* glsl */`
          #include <common>
          #include <fog_pars_vertex>
          attribute float aWing, aTone, aPh, aLit;
          uniform float uTime;
          varying float vTone, vUp, vLit;
          void main(){
            float gate = smoothstep(-0.2, 0.3, sin(uTime*1.7 + aPh*50.0));                 // flicker, then glide
            float flap = sin(uTime*31.0 + aPh*100.0)*0.6*gate - 0.12*(1.0 - gate);
            vec3 l = position; l.y += aWing*abs(l.x)*flap;
            vec4 wp = modelMatrix*instanceMatrix*vec4(l, 1.0);
            vTone = aTone; vUp = normalize(mat3(instanceMatrix)*vec3(0.0, 1.0, 0.0)).y; vLit = aLit;
            vec4 mvPosition = viewMatrix*wp;
            gl_Position = projectionMatrix*mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: /* glsl */`
          #include <common>
          #include <fog_pars_fragment>
          uniform vec3 uBody, uThroat, uLight; varying float vTone, vUp, vLit;
          void main(){
            // (in the shade a dark shape, throat and all; where light falls on it, the warm light on its back and its pale throat)
            vec3 base = mix(uBody*(0.7 + 0.6*vUp), uThroat*0.5, vTone);
            gl_FragColor = vec4(base*0.34 + (base + vec3(0.06, 0.045, 0.035))*uLight*(2.2*vLit), 1.0);
            #include <fog_fragment>
          }`,
      });
      entryMesh = new THREE.InstancedMesh(ge, me, nE); entryMesh.name = 'swifts-entry'; entryMesh.frustumCulled = false;
      entryMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      scene.add(entryMesh);
    }
    await Y();
    // (an entry swift's place on its lane's loop at a clock: the table's two nearest steps, and its own small weave across and up)
    const entryAt = (b, t, out) => {
      const tab = entrySwifts.tabs[b.lane], M = entrySwifts.M, f = (((t + b.off) / entrySwifts.period) % 1) * M, i = Math.min(M - 1, Math.floor(f)), k = f - i, q = i * 4;
      const ax = tab[q + 4] - tab[q], az = tab[q + 6] - tab[q + 2], al = Math.hypot(ax, az) || 1, w = b.wl * Math.sin(t * b.wv + b.ph);
      entryL = lerp(tab[q + 3], tab[q + 7], k);
      return out.set(lerp(tab[q], tab[q + 4], k) - az / al * w, lerp(tab[q + 1], tab[q + 5], k) + b.wu * Math.sin(t * b.wv * 1.3 + b.ph * 2), lerp(tab[q + 2], tab[q + 6], k) + ax / al * w);
    };
    const swiftAt = (b, t, out) => {
      if (b.stream) {
        const span = dMouth + 34 - (pH.d - 6), d = dMouth + 34 - ((t * b.speed + b.off) % span);
        path.posAtDist(d, out); right(d, tv2);
        // (they stoop in from high over the plain, and at the hero chamber they climb out through the slit and are gone above it)
        const lat = b.lat + 1.3 * Math.sin(t * b.wv + b.ph), away = 1 - smoothstep(pH.d - 6, pH.d + 22, d), inK = smoothstep(dMouth + 6, dMouth + 34, d);
        out.x += tv2.x * (lat + 26 * inK * inK * Math.sign(b.lat || 1)); out.z += tv2.z * (lat + 26 * inK * inK * Math.sign(b.lat || 1)); out.y += b.up + 0.5 * Math.sin(t * b.wv * 1.3 + b.ph * 2) + 56 * away * away + 38 * inK * inK;
        swiftK = (1 - inK * inK * inK) * (1 - away * away * away);
        return out;
      }
      swiftK = 1;
      const a = b.ph + t * b.w * (5.5 / b.rad + 0.35);
      return out.set(b.hd.x + Math.cos(a) * b.rad * (1 + 0.25 * Math.sin(a * 2 + b.ph)), b.y + b.bob * Math.sin(t * 0.6 + b.ph), b.hd.z + Math.sin(a) * b.rad);
    };
    // The raven: it sits on a ledge of the third chamber, drops off it as the camera comes in (u 0.40), flaps up to a
    // station 15 m ahead and leads the camera for four seconds, then pulls away round the S-bends. All keyed to u.
    const raven = new THREE.Group(); raven.name = 'raven';
    const ravenPerch = new THREE.Vector3(), ravenAt = new THREE.Vector3(), ravenNext = new THREE.Vector3();
    const R_SIT = 0.4, R_LEAD = 0.432, R_END = 0.515, R_GONE = 0.575;
    let wingL, wingR, tipL, tipR;
    {
      const p2 = pools.find((p) => p.chamber === 2), S = sides.find((q) => q.sgn === flip);
      const ic = clamp(Math.round((0.447 * L + 10) / STEP), 6, slotSt.length - 8);
      let best = -9;
      for (let i = ic - 5; i <= ic + 4; i++) for (let k = rowAtH(S, i, 9.9), k1 = rowAtH(S, i, 15); k <= k1; k++) {
        const q = wallV(S, i, k);
        if (nor[q + 1] > best) { best = nor[q + 1]; ravenPerch.set(posA[q] + nor[q] * 0.12, posA[q + 1] + 0.16, posA[q + 2] + nor[q + 2] * 0.12); }
      }
      const tri = (arr) => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(arr, 3)); return g; };
      const P = [];
      const blob = (geo, sx, sy, sz, x, y, z, rx = 0) => {
        const g = geo.toNonIndexed(); g.scale(sx, sy, sz); if (rx) g.rotateX(rx); g.translate(x, y, z);
        P.push(...g.attributes.position.array); g.dispose(); geo.dispose();
      };
      await Y();
      blob(new THREE.SphereGeometry(1, 10, 7), 0.125, 0.115, 0.36, 0, 0, 0);                    // body
      await Y();
      blob(new THREE.SphereGeometry(1, 8, 6), 0.085, 0.085, 0.1, 0, 0.075, 0.36);               // head
      await Y();
      blob(new THREE.ConeGeometry(0.04, 0.17, 5), 1, 1, 1, 0, 0.06, 0.52, Math.PI / 2);         // beak
      await Y();
      P.push(-0.07, 0.01, -0.26, 0.07, 0.01, -0.26, 0.22, 0, -0.74, -0.07, 0.01, -0.26, 0.22, 0, -0.74, -0.22, 0, -0.74, -0.22, 0, -0.74, 0.22, 0, -0.74, 0, 0, -0.86);   // wedge tail, fanned
      P.push(-0.07, -0.05, -0.26, 0.07, -0.05, -0.26, 0.2, -0.035, -0.72, -0.07, -0.05, -0.26, 0.2, -0.035, -0.72, -0.2, -0.035, -0.72);   // (its underside: the tail has depth from behind)
      const rMat = new THREE.MeshBasicMaterial({ color: new THREE.Color('#15121b'), side: THREE.DoubleSide });
      raven.add(new THREE.Mesh(tri(P), rMat));
      await Y();
      const wing = (m) => {
        const piv = new THREE.Group(); piv.position.set(m * 0.09, 0.05, 0.04);
        // (a wing has area from behind too: its chord is tilted nose-up and a cambered under-surface hangs below it, so the bird
        // the camera follows is never a ball with two hairlines)
        const foil = (A, c0, c1, span) => {
          const out = [];
          for (let q = 0; q < A.length; q += 3) out.push(A[q], A[q + 1] + 0.26 * A[q + 2], A[q + 2]);                    // the upper surface, chord tilted
          for (let q = 0; q < A.length; q += 3) out.push(A[q], A[q + 1] + 0.26 * A[q + 2] - lerp(c0, c1, Math.min(1, Math.abs(A[q]) / span)) * (A[q + 2] > 0 ? 1 : 0.25), A[q + 2]);   // the under-surface
          return out;
        };
        piv.add(new THREE.Mesh(tri(foil([0, 0, 0.2, 0, 0, -0.2, m * 0.52, 0, -0.23, 0, 0, 0.2, m * 0.52, 0, -0.23, m * 0.52, 0, 0.16], 0.075, 0.05, 0.52)), rMat));
        const tip = new THREE.Group(); tip.position.set(m * 0.52, 0, 0);
        const F_ = [0, 0, 0.16, 0, 0, -0.23, m * 0.3, 0, -0.3, 0, 0, 0.16, m * 0.3, 0, -0.3, m * 0.36, 0, 0.1];
        for (let k = 0; k < 4; k++) { const z0 = 0.1 - k * 0.1; F_.push(m * 0.3, 0, z0, m * 0.3, 0, z0 - 0.1, m * (0.74 - k * 0.07), 0, z0 - 0.13 - k * 0.03); }   // fingered primaries
        tip.add(new THREE.Mesh(tri(foil(F_, 0.05, 0.012, 0.7)), rMat)); piv.add(tip); raven.add(piv);
        return [piv, tip];
      };
      [wingL, tipL] = wing(-1); [wingR, tipR] = wing(1);
      raven.scale.setScalar(1.5); raven.position.copy(ravenPerch); raven.visible = false;
      scene.add(raven);
    }
    await ctx.yield();
    const ravenPos = (t, u, out) => {
      const pull = smoothstep(R_END, R_GONE, u), d = Math.min(u * L + 15 + 55 * pull, dMouth + 40);
      path.posAtDist(d, out); right(d, tv2);
      const sx = 1.4 * flip + 0.55 * Math.sin(t * 0.9), a = smoothstep(R_SIT, R_LEAD, u);
      out.x += tv2.x * sx; out.z += tv2.z * sx; out.y += 0.6 + 0.35 * Math.sin(t * 1.3) + 4 * pull;
      if (a < 1) { out.lerpVectors(ravenPerch, out, a); out.y -= 1.7 * Math.sin(Math.PI * a) * (1 - 0.4 * a); }
      return out;
    };
    fauna.add(F.makeFlock({                                                  // ravens riding the amphitheatre's thermal
      rng: B, species: 'crows', count: nRavens + 1, size: 2.1, form: 'soar', soarRadius: 24, soarLift: 5, glide: 0.85,   // (the flock cure: soarLift was 8)
      body: '#15131a', belly: '#1c1a22', wingC: '#121016', trail: '#1a1820', tip: '#0c0b10', head: '#15131a',
      center: [swing * 5, 42, 96], radius: 22, height: 3, spread: [30, 4, 30], wander: [4, 2, 4, 0.4],   // (over the route's last turn, between the eye and the Arch; the flock cure, a soar laid by its own numbers: the centre was 27 m up, the height 5, the spread the crows' own 30, 10, 30; the wander is the crows' own written out)
    }));
    await ctx.yield();
    // ------------------------------------------------------------------ the rare visit: a dust devil walks across the amphitheatre
    // toward the Arch as the camera bursts out of the slot and flies the last stretch (keyed to u; it is built here and
    // only ever moved, never created or switched, in update)
    let devil = null;
    const devilSide = swing, devilAt = (u, out) => {
      const k = smoothstep(uMouth - 0.1, 0.93, u), x = devilSide * (lerp(72, 52, k) + 4 * Math.sin(k * 9)), z = lerp(112, 66, k) + 3 * Math.cos(k * 7);
      return out.set(x, groundH(x, z) - 0.3, z);
    };
    if (rare) {
      devil = set.add(fx.makeDustDevil({
        rng: makeRng('canyon-of-light:devil:' + ctx.seed), time, position: devilAt(0, tv).toArray(), height: 44, radius: [1.1, 7.5], size: [3, 10],
        color: '#d9b48a', colorTop: '#f0d9b4', shadowColor: '#8a5a3c', opacity: 0.36, spin: 2.9, sway: 3, count: 80, debris: 160,
      }));
      await Y();
    }
    // sand on the wind over the plain: bright grains streaming past the eye on the low pass (faded in as the camera leaves the slot)
    const windV = rockMat.uniforms.uWind.value, wl = Math.hypot(windV.x, windV.y) || 1;
    const drift = set.add(fx.makeParticles({
      rng: makeRng('canyon-of-light:drift:' + ctx.seed), preset: 'dust', time, follow: 'xz', center: [0, 8, 0], count: Math.round(800 * busy), box: [44, 7, 44], colors: ['#ffe6bd', '#f6cf9a', '#ffd9a8'],
      intensity: 0.62, size: [0.03, 0.07], velocity: [windV.x / wl * (3.2 + 2 * windy), -0.15, windV.y / wl * (3.2 + 2 * windy)], turbulence: [1.3, 0.5, 0.7],
    }));
    drift.setOpacity(0);
    await Y();
    await sky.prewarm(ctx.renderer, null, scene);

    // ------------------------------------------------------------------ the flight
    const seat = hero.anchors.portalSeat;
    const sandTop = hero.anchors.sandfallTop;
    const slitAt = new THREE.Vector3(), heroAt = new THREE.Vector3(HSH[0].x + heroUp.x * 9, HSH[0].y + 9, HSH[0].z + heroUp.z * 9);
    const pois = [
      // the hero beam ahead: the gaze rests on the shaft until it passes beside the camera
      { at: heroAt, from: 0, to: pH.u + 0.004, weight: 0.4 },   // (it is let go as the camera flies into the shaft: inside, the eye looks along the route)
      // then it lifts up the walls into the slit: the ribbon of white sky winding between the dark overhangs, the high rock glowing
      { at: (time, u) => { const sq = stationAt(u * L + 22); return slitAt.set(sq.cx + sq.rx * sq.lean * 0.8, sq.cy + 27, sq.cz + sq.rz * sq.lean * 0.8); }, from: pH.u + 0.004, to: 0.222, weight: 0.46 },
      // coming into the open court the gaze lifts into the sunbeam and the slice of sky it comes from, then drops to the sapling in its patch
      { at: new THREE.Vector3(pC.x + courtD.x * 21, pC.y + courtD.y * 21, pC.z + courtD.z * 21), from: U_COURT - 0.1, to: U_COURT - 0.02, weight: 0.4 },
      { at: sapPos.clone().add(new THREE.Vector3(0, 3, 0)), from: U_COURT - 0.035, to: U_COURT + 0.012, weight: 0.32 },
      { at: glyphAt.clone(), from: U_COURT - 0.002, to: U_COURT + 0.036, weight: 0.3 },   // a look at the lit panel as it comes up
      { at: (time, u) => ravenPos(time, u, ravenAt), from: R_SIT - 0.02, to: R_END, weight: 0.3 },
      { at: hero.center.clone(), from: uMouth - 0.1, to: 0.9, weight: 0.4 },
      { at: new THREE.Vector3(sandTop.x * 0.5, 30, sandTop.z), from: 0.76, to: 0.93, weight: 0.2 },
    ];
    // lingering in the court and over the pour-off; the last tenth runs at the world's own pace
    const pace = (u) => 1 - 0.2 * smoothstep(0.015, 0.05, u) * (1 - smoothstep(0.1, 0.15, u)) - 0.22 * smoothstep(U_COURT - 0.09, U_COURT - 0.04, u) * (1 - smoothstep(U_COURT + 0.01, U_COURT + 0.06, u))
      - 0.16 * smoothstep(uMouth - 0.03, uMouth + 0.01, u) * (1 - smoothstep(uMouth + 0.05, uMouth + 0.11, u));
    const tr = new THREE.Vector3();
    return {
      scene, path, duration, pace,
      camera: { fov: 64, near: 0.3, far: 9000, lookAhead: 24, sway: 0.8, bank: 1.2 },
      pois,
      portal: { shape: 'circle', radius: seat.radius, color: '#' + new THREE.Color(palette[6]).multiplyScalar(0.8).getHexString(), glow: 0.6, revealDistance: 300 },   // a little under full brightness, so its bloom leaves the sky behind it blue
      post: {
        exposure: 1.02,
        bloom: { strength: 0.42, radius: 0.66, threshold: 1.45 },   // above the sunlit sand, so only beams, sky ribbon, veil and portal bloom
        grade: { saturation: 1.0, contrast: 1.03, tint: '#fff4e6', shadowTint: '#1a0b1c', vignette: 0.36, grain: 0.02, aberration: 0 },
      },
      update(dt, t, camera, u) {
        time.value = t;
        sky.update(dt, t, camera);
        // not given the camera: the rig's follow code calls camera.getWorldDirection(), which rebuilds the portal
        // camera's world matrix from its (identity) local matrix and so breaks the view of this world through a portal
        rig.update(dt, t, null);
        hero.setProgress(clamp((u - (uMouth - 0.1)) / (0.98 - (uMouth - 0.1)), 0, 1));
        hero.update(dt, t, camera);
        for (const m of moteMats) m.uniforms.uPx.value = rockMat.uniforms.uBufH.value * 0.8;
        motes.setOpacity((1 - smoothstep(uMouth - 0.11, uMouth - 0.02, u)) * (1 - 0.95 * court(u * L)));   // the motes belong to the slot: all gone before the sky fills the mouth, and thin under the court's open sky
        drift.setOpacity(smoothstep(uMouth - 0.01, uMouth + 0.05, u) * (1 - 0.6 * smoothstep(0.9, 0.97, u)));
        drift.uniforms.uCenter.value.y = camera.matrixWorld.elements[13] - 4.6;   // (the blown sand streams below the eye, over the ground: never bright grains against the sky)
        if (devil) devilAt(u, devil.uniforms.uBase.value);
        set.update(dt, t, camera);
        flora.updateWind(wind, t);
        fauna.update(dt, t, camera, u);
        raven.visible = u > 0.16 && u < R_GONE;
        if (raven.visible) {
          const a = smoothstep(R_SIT, R_SIT + 0.006, u);                   // 0 sitting, 1 on the wing
          ravenPos(t, u, raven.position);
          if (a > 0) { ravenPos(t, u + 0.003, ravenNext); raven.lookAt(ravenNext); raven.rotateZ(0.24 * Math.sin(t * 0.7) * a); }   // (a slow roll: the wing planes never stay edge-on to the eye)
          else { path.posAtDist(u * L, tv); raven.lookAt(tv.x, raven.position.y + 1.2, tv.z); raven.rotateX(-0.75); raven.rotateY(0.5 * Math.sin(t * 0.8) * Math.sin(t * 0.23)); }
          const launch = 1 - smoothstep(R_LEAD, R_LEAD + 0.02, u), glide = smoothstep(0.1, 0.7, Math.sin(t * 0.8 + 1)) * (1 - launch);
          const amp = lerp(0.8, 0.14, glide), ph = t * lerp(9.5, 7.2, 1 - launch);
          const up = lerp(-1.32, 0.12 + amp * Math.sin(ph), a), fold = lerp(2.55, amp * 0.75 * Math.sin(ph - 1.0) - 0.12 - 0.16 * glide, a);
          wingR.rotation.z = up; wingL.rotation.z = -up; tipR.rotation.z = fold; tipL.rotation.z = -fold;
        }
        for (let i = 0; i < swiftBirds.length; i++) {
          const b = swiftBirds[i];
          swiftAt(b, t + 0.06, swB); swiftAt(b, t, swA);
          swO.position.copy(swA); swO.up.set(0, 1, 0); swO.lookAt(swB);
          swO.rotateZ(b.stream ? 0.5 * Math.sin(t * b.wv + b.ph + 1.2) : -0.6 * Math.sign(b.w));   // banked into its weave, or into its wheel
          swS.setScalar(b.size * Math.max(swiftK, 0.001)); swM.compose(swA, swO.quaternion, swS);
          swiftMesh.setMatrixAt(i, swM);
        }
        swiftMesh.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < entrySwifts.birds.length; i++) {
          const b = entrySwifts.birds[i];
          entryAt(b, t + 0.06, swB); entryAt(b, t, swA);
          swO.position.copy(swA); swO.up.set(0, 1, 0); swO.lookAt(swB);
          swO.rotateZ(0.5 * Math.sin(t * b.wv + b.ph + 1.2));                                    // banked into its weave
          swS.setScalar(b.size); swM.compose(swA, swO.quaternion, swS);
          entryMesh.setMatrixAt(i, swM); entryLit.array[i] = entryL;
        }
        entryMesh.instanceMatrix.needsUpdate = true; entryLit.needsUpdate = true;
        for (const w of weeds) {
          const off = w.amp * (Math.sin(t * w.rate + w.ph) + 0.35 * Math.sin(t * w.rate * 2.7 + w.ph * 2));
          if (w.plain) {
            const x = w.x0 + w.dx * off, z = w.z0 + w.dz * off, hop = Math.abs(Math.sin(t * 2.1 + w.ph)) * 0.22 * Math.abs(Math.cos(t * w.rate + w.ph));
            w.o.position.set(x, groundH(x, z) + 0.46 * w.size + hop, z);
            w.o.rotation.set(0, Math.atan2(w.dx, w.dz), 0); w.o.rotateX(off / (0.5 * w.size));
            continue;
          }
          const d = w.d0 + off;
          path.posAtDist(d, tv); right(d, tr);
          const hop = Math.abs(Math.sin(t * 2.1 + w.ph)) * 0.18 * Math.abs(Math.cos(t * w.rate + w.ph));
          w.o.position.set(tv.x + tr.x * w.lat, floorY(stationAt(d), w.lat) + 0.46 * w.size + hop, tv.z + tr.z * w.lat);
          w.o.rotation.set(0, Math.atan2(tr.x, tr.z), 0);
          w.o.rotateX(off / (0.5 * w.size));
        }
      },
      dispose() {},
    };
}
