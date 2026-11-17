// The Wood Behind the Coats: out between the fur coats of a wardrobe into a snowbound wood at blue hour where one lamp-post
// burns, up a frozen stream past a frozen fall, and then the long winter breaks as we fly: the snow goes, the stream runs,
// flowers open in a wave ahead of us and the wood comes into leaf, to a glade of silver birches and a second lamp-post.
//
// One value drives the change: every spot of the wood has a thaw moment (in u), set by how far along the route it lies plus a
// seeded ragged term, and everything there (snow on ground and bough, ice, grass, flowers, leaves) reads u against it.
// The set pieces (lamp-post, wardrobe and coats, season material, flakes) are in src/parts/wood-behind-the-coats.js.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as T from '../kit/terrain.js';
import { buildHero, makeSeason, seasonize, seasonInstances, firVariant, makeLampPost, makeFlakes, SGeo, SNOW, SEASON_SPAN, LAMP_GLSL, LAMP_COLOR, WARDROBE_DEPTH } from '../parts/wood-behind-the-coats.js';

const TAU = Math.PI * 2;
const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const bellS = (x, a, b, f) => smoothstep(a, a + f, x) * (1 - smoothstep(b - f, b, x));
const GNOISE = /* glsl */`
float gHash(vec2 p) { vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float gNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(gHash(i), gHash(i + vec2(1., 0.)), f.x), mix(gHash(i + vec2(0., 1.)), gHash(i + vec2(1., 1.)), f.x), f.y); }
`;
// Every stream this world deals from, by the name of what it deals. Each is made from the visit's seed and its own name and draws from nothing else
// (the set pieces' own streams are listed in the part).
const STREAMS = [
  'visit', 'winter sky', 'spring sky', 'stream course', 'step', 'first lamp turn', 'second lamp',
  'sledge', 'reindeer', 'bells', 'spray',
  'mouth firs', 'firs stretch', 'fir gate', 'great fir', 'fallen trunk', 'capped boulder', 'animal trail', 'lamp firs', 'ring hawthorns', 'glade planting', 'tall blossom', 'ring birches', 'wood',
  'great fir shape', 'oak shape', 'far oak shape', 'beech shape', 'birch shape', 'small birch shape', 'far birch shape', 'laburnum shape', 'hawthorn shape', 'tree dress',
  'snowfall', 'ledge rocks', 'great rock shape', 'small rock shape', 'bank stones', 'boulders', 'stream stones', 'ice falls', 'icicles',
  'flowers', 'flower shapes', 'currant', 'currant shape', 'grass', 'tuft shape',
  'robin', 'robin perches', 'robin puff', 'mist', 'mist shapes', 'sun shafts', 'snow slides', 'pollen', 'petals', 'rare motes',
  'thrushes', 'thrush crossing', 'chorus', 'chorus crossing', 'bees', 'butterflies', 'butterfly place', 'arch hawthorn', 'arch laburnum', 'hills', 'far stars',
];
// The kit builds each fir shape twice from one seed (green, and under snow): these five are kept as seeds, made the same way from the visit's seed and the name.
const TWIN_SHAPES = ['slim fir shape', 'broad fir shape', 'near fir shape', 'far fir shape', 'larch shape'];
// The heaviest wood the triangle budget carries (see where the visit's density is read).
const DENSITY_TOP = 1.15;

export default {
  id: 'wood-behind-the-coats',
  name: 'The Wood Behind the Coats',
  category: 'books',
  placeKind: 'wilderness',
  book: 'The Lion, the Witch and the Wardrobe',
  author: 'C. S. Lewis, 1898 to 1963',
  media: ['air', 'snow'],
  weirdness: 0.35,
  async build(ctx) {
    const { noise } = ctx, vary = ctx.vary || {}, detail = ctx.quality?.detail ?? 1;
    const scene = new THREE.Scene();
    const ST = {}, SEED = {};
    for (const n of STREAMS) ST[n] = ctx.core.makeRng(ctx.core.hashSeed(n + ':' + ctx.seed));
    for (const n of TWIN_SHAPES) SEED[n] = ctx.core.hashSeed(n + ':' + ctx.seed);

    // ------------------------------------------------------------ what this visit is like
    // the film's length in seconds
    const DUR = 46;
    const V = ST.visit;
    const side = V.sign();                                               // the whole wood mirrored left to right
    const night = vary.hour === 'night';
    const pale = !night && (vary.hour === 'day' || vary.hour === 'golden');
    // how thick the wood stands. Under 0.8 the firs' stretch shows open snow between the trunks beside the way; the top is the heaviest wood that stays inside the triangle budget
    const dens = clamp(vary.density ?? 1, 0.8, DENSITY_TOP), rare = !!vary.rare;
    const mistK = lerp(0.27, 0.42, clamp(vary.mood ?? 0.5, 0, 1));                      // how thick the thaw mist stands on this visit
    const meltSide = V.sign(), meltTilt = V.range(0.36, 0.83);                          // which side of the route the thaw reaches first, and how many metres of our flight sooner per metre to that side
    const thawPick = V.range(-0.5, 0.5), FRONT = V.range(0.27, 0.32);                   // where in the foot of the ledge the thaw line lies, and how fast its front outruns us
    const lampSide = V.sign();
    const flowerMix = V.range(0, 1), birdKind = V.pick(['swifts', 'rooks']);

    // ------------------------------------------------------------ the route (its control points are places of the world)
    const sx = side;
    const path = makePath([
      [0, 5.5, 0], [0, 5.4, -28], [2 * sx, 4.9, -72], [0.5 * sx, 4.5, -120], [-1 * sx, 4.4, -160], [-6 * sx, 4.5, -198], [-18 * sx, 4.2, -236],
      [-33 * sx, 7.4, -268], [-48 * sx, 9.9, -302], [-60 * sx, 9.6, -350], [-62 * sx, 10.0, -405], [-52 * sx, 10.6, -462], [-36 * sx, 10.8, -520], [-20 * sx, 10.8, -578],
    ]);
    const PL = path.length;
    // three places are set in metres from the start: the first lamp-post, the ledge of rock across the hollow, the glade's edge. Every other place below is found from the land or drawn
    const sLamp = 164, sLedge = 281, GLADE0 = 430;
    // sizes of the land, in metres: the ring; the hollow's half breadth and depth; the ledge's and the step's height; the half width of the lane our own flight sways in and how far outside
    // a lane a lamp-post stands; the half width the wood keeps clear along the way; the clearing's half width at the ring; the rise across the glade's end (half length, height); how high the glade's sides stand above its floor
    const PORTAL_R = 9, HOLLOW_W = 30, BOWL_D = 1.7, LEDGE_H = 5.3, STEP_H = 1.25, LANE_FLY = 3.2, LAMP_OUT = 0.6, LANE_WOOD = 7.5, CLEAR_W1 = PORTAL_R + 7, RISE_L = 30, RISE_H = 3, GLADE_RIM = 2.6;
    // the planting turns from wood to glade over twice the clearing's full half width; the rise's foot
    const GLADE1 = GLADE0 + 2 * CLEAR_W1, sRise = PL - RISE_L;
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();
    // a point of the route's own frame: s metres along, d metres to the right
    const route = (s, d, out = [0, 0]) => { path.posAtDist(s, _p); path.tangentAtDist(s, _t); const l = Math.hypot(_t.x, _t.z) || 1; out[0] = _p.x - _t.z / l * d; out[1] = _p.z + _t.x / l * d; return out; };

    // ------------------------------------------------------------ the field: for every node of a grid, how far along the route it is and how far to its right
    const CELL = 2.6, REACH = 128;
    let bx0 = 1e9, bx1 = -1e9, bz0 = 1e9, bz1 = -1e9;
    const NS = Math.ceil(PL / 2), psx = new Float32Array(NS + 1), psz = new Float32Array(NS + 1), ptx = new Float32Array(NS + 1), ptz = new Float32Array(NS + 1);
    for (let i = 0; i <= NS; i++) {
      path.posAtDist(i / NS * PL, _p); path.tangentAtDist(i / NS * PL, _t); const l = Math.hypot(_t.x, _t.z) || 1;
      psx[i] = _p.x; psz[i] = _p.z; ptx[i] = _t.x / l; ptz[i] = _t.z / l;
      bx0 = Math.min(bx0, _p.x); bx1 = Math.max(bx1, _p.x); bz0 = Math.min(bz0, _p.z); bz1 = Math.max(bz1, _p.z);
    }
    bx0 -= REACH; bx1 += REACH; bz0 -= REACH; bz1 += 40;
    const GW = Math.ceil((bx1 - bx0) / CELL) + 1, GH = Math.ceil((bz1 - bz0) / CELL) + 1;
    const fS = new Float32Array(GW * GH), fD = new Float32Array(GW * GH);
    await ctx.yield();
    for (let j = 0; j < GH; j++) {
      const z = bz0 + j * CELL;
      for (let i = 0; i < GW; i++) {
        const x = bx0 + i * CELL; let best = 1e18, bi = 0;
        for (let k = 0; k <= NS; k += 7) { const dx = x - psx[k], dz = z - psz[k], d2 = dx * dx + dz * dz; if (d2 < best) { best = d2; bi = k; } }
        for (let k = Math.max(0, bi - 7), k1 = Math.min(NS, bi + 7); k <= k1; k++) { const dx = x - psx[k], dz = z - psz[k], d2 = dx * dx + dz * dz; if (d2 < best) { best = d2; bi = k; } }
        // refine along the tangent, so s and d are continuous between samples; past the ring the metres run on along the route's last heading
        const dx = x - psx[bi], dz = z - psz[bi], al = dx * ptx[bi] + dz * ptz[bi];
        fS[j * GW + i] = bi / NS * PL + clamp(al, -2, bi === NS ? 1e6 : 2); fD[j * GW + i] = dx * -ptz[bi] + dz * ptx[bi];
      }
      if (j % 10 === 9) await ctx.yield();
    }
    const fieldAt = (x, z, out) => {
      const gx = clamp((x - bx0) / CELL, 0, GW - 1.001), gz = clamp((z - bz0) / CELL, 0, GH - 1.001), i = Math.floor(gx), j = Math.floor(gz), fx_ = gx - i, fz = gz - j, a = j * GW + i;
      out.s = lerp(lerp(fS[a], fS[a + 1], fx_), lerp(fS[a + GW], fS[a + GW + 1], fx_), fz);
      out.d = lerp(lerp(fD[a], fD[a + 1], fx_), lerp(fD[a + GW], fD[a + GW + 1], fx_), fz);
      return out;
    };
    const _f = { s: 0, d: 0 };

    // ------------------------------------------------------------ the sledge's draws (its road shapes the land, so they come first)
    // the flank it keeps to; its lane's distance from the route's line (two to three sledge lengths, and clear of the stream's banks, which reach about 10 m from the line);
    // how far beyond the rim it starts; how far past the lamp it ends and how far out into the firs it swings there; its pace as a multiple of ours
    // (reindeer in harness at a fast trot to a canter, 9 to 13 m/s, against our own 13 m/s)
    const SL = ST.sledge, sledSide = SL.sign(), laneD = SL.range(11, 14), startBack = SL.range(26, 38), endPast = SL.range(20, 32), endOut = SL.range(14, 22), PACE = SL.range(0.7, 1.0);
    // its road down the ledge: a ramp cut through the rock (length, half breadth); beyond the rim it starts in a dell deeper than the team is tall (2.7 m with antlers)
    const RAMP_L = 36, RAMP_W = 5, DELL_D = 3.4, DELL_R = 11;
    // the frozen fall's half width at its top: a fifth of the hollow's half breadth; it widens by a third to its foot
    const FALL_W0 = HOLLOW_W / 5, FALL_W1 = FALL_W0 * 4 / 3;

    // ------------------------------------------------------------ the stream (we fly up it), the land, the thaw
    const SC = ST['stream course'], sPh = SC.range(0, TAU), sAmp = SC.range(2.0, 3.0);
    // the clearing that opens down the glade to the ring: its half width at s metres
    const clearW = (s) => lerp(LANE_WOOD, CLEAR_W1, clamp((s - GLADE0) / (PL - GLADE0), 0, 1));
    const wander = (s) => (sAmp * Math.sin(s * 0.021 + sPh) + 1.2 * Math.sin(s * 0.053 + sPh * 2)) * smoothstep(60, 110, s);
    // the stream wanders about the route's line; for 40 m either side of the first lamp it keeps 5.5 m to the other side of the line (the lamp stands on level snow, not on its bank);
    // in the glade it runs 3 m outside the clearing's edge on the side away from the second lamp, and comes round the foot of the rise out of the wood
    const streamOff = (s) => lerp(lerp(wander(s), -lampSide * 5.5, bellS(s, sLamp - 40, sLamp + 40, 30)), -lampSide * (clearW(s) + 3), smoothstep(GLADE0, GLADE1, s)) - lampSide * 20 * smoothstep(sRise - RISE_L, sRise, s);
    const S_END = sRise + RISE_L / 2;
    // where the stream comes over the ledge (the frozen fall), and where the sledge's road comes down it: on the lane's own line, or beside the fall where the fall hangs across that line
    // (the fall's half width at its foot, the road's half breadth and 2 m of rock between them)
    const fallLat = streamOff(sLedge), rampLat = sledSide * Math.max(laneD, sledSide * fallLat + FALL_W1 + RAMP_W + 2);
    const streamDist = (s, d) => (s < 44 || s > S_END + 2 ? 99 : Math.abs(d - streamOff(s)) + 30 * (1 - smoothstep(44, 60, s)));
    // the white hollow under the ledge: a bowl from the first lamp to the ledge, a third of that length at each end taken by its slopes; how deep in it a spot lies (1 on its floor, 0 outside)
    const bowlAt = (s, d) => bellS(s, sLamp, sLedge, (sLedge - sLamp) / 3) * Math.exp(-(d * d) / (HOLLOW_W * HOLLOW_W));
    const ledgeLine = (d) => sLedge + 2.6 * noise.n2(d * 0.05, 3.3) - Math.abs(d) * 0.04;
    const ledgeAt = (s, d) => { const w = lerp(1.5, RAMP_L / 2, Math.exp(-(((d - rampLat) / RAMP_W) ** 2))); return smoothstep(-w, w, s - ledgeLine(d)); };
    // the low step further up (its place is drawn once the rim is found) and the dell where the sledge's road starts (once the road's own rim is found)
    let sStep = Infinity, dell = null;
    // the land without the stream's bed
    const landSD = (x, z, s, d) => {
      let h = 1.0 * noise.fbm2(x * 0.011 + 5, z * 0.011, 3) + 0.42 * noise.n2(x * 0.045, z * 0.045 + 9) + 0.14 * noise.n2(x * 0.17, z * 0.17);
      h *= smoothstep(30, 70, s) * (0.4 + 0.6 * smoothstep(3, 30, Math.abs(d)));
      h += LEDGE_H * ledgeAt(s, d) + STEP_H * smoothstep(-1.6, 1.6, s - sStep - 2 * noise.n2(d * 0.07, 8.1));
      h -= BOWL_D * bowlAt(s, d);
      // the glade is a shallow bowl: its floor level (the stream runs along it), its sides rising from just outside the clearing's edge, a rise across its end that goes on climbing behind the ring
      h += GLADE_RIM * smoothstep(clearW(s) + 4, clearW(s) + 34, Math.abs(d)) * smoothstep(GLADE0, GLADE1, s);
      h += RISE_H * smoothstep(PL - RISE_L, PL + RISE_L, s) + 0.06 * Math.max(0, s - PL);
      if (dell) h -= DELL_D * Math.exp(-((x - dell[0]) ** 2 + (z - dell[1]) ** 2) / (DELL_R * DELL_R));
      h += 0.02 * Math.max(0, Math.abs(d) - 30) - 9 * smoothstep(REACH - 20, REACH - 2, Math.abs(d));
      return h;
    };
    const groundSD = (x, z, s, d) => {
      let h = landSD(x, z, s, d);
      h -= 1.25 * (1 - smoothstep(1.7, 5.6, streamDist(s, d))) * (1 - smoothstep(sRise, S_END, s));
      if (s < 52) h = lerp(-0.42, h, smoothstep(26, 52, s));                                                 // level under the wardrobe floor
      return h;
    };
    const groundAt = (x, z) => { fieldAt(x, z, _f); return groundSD(x, z, _f.s, _f.d); };
    await ctx.yield();

    // ------------------------------------------------------------ places found from the land
    // the land along the route's line, metre by metre from the lamp to beyond the ledge: the mean of five lines across 16 m
    const prof = [];
    for (let s = sLamp; s <= sLedge + 30; s++) { let m = 0; for (const d of [-8, -4, 0, 4, 8]) { const q = route(s, d); m += landSD(q[0], q[1], s, d); } prof.push(m / 5); }
    const profAt = (s) => prof[clamp(Math.round(s) - sLamp, 0, prof.length - 1)];
    // the hollow's floor: its lowest metre. Its mouth: the first metre past the lamp where the land has dropped half the bowl's depth below its level at the lamp.
    // The foot of the ledge: the first metre past the floor where the land has risen a metre above the floor. The rim: the first metre within 0.3 m of the level 25 m past the ledge.
    let sFloor = sLamp; for (let s = sLamp; s <= sLedge; s++) if (profAt(s) < profAt(sFloor)) sFloor = s;
    let sMouth = sLamp; while (sMouth < sFloor && profAt(sMouth) > profAt(sLamp) - BOWL_D / 2) sMouth++;
    let sFoot = sFloor; while (sFoot < sLedge + 25 && profAt(sFoot) < profAt(sFloor) + 1) sFoot++;
    let sRim = sFoot; while (sRim < sLedge + 25 && profAt(sRim) < profAt(sLedge + 25) - 0.3) sRim++;
    const footLen = Math.max(4, sRim - sFoot);
    // the winter breaks at the foot of the ledge: the thaw line lies within half the foot's own length either side of the found foot
    const sThaw = sFoot + thawPick * footLen;
    // the stream comes down one more small fall in the upper wood, clear of the ledge and of the glade: its place is drawn between 45 and 70 percent of the way from the rim to the glade's edge
    sStep = lerp(sRim, GLADE0, ST.step.range(0.45, 0.7));
    // the sledge road's own rim: on the road's line, the first metre within 0.3 m of the level 12 m past the ramp's upper end
    const roadLand = (s) => { const q = route(s, rampLat); return landSD(q[0], q[1], s, rampLat); };
    let sRoadRim = Math.round(sLedge - RAMP_L / 2); { const top = roadLand(sLedge + RAMP_L / 2 + 12); while (sRoadRim < sLedge + RAMP_L / 2 + 12 && roadLand(sRoadRim) < top - 0.3) sRoadRim++; }
    // the track: from its start in the dell beyond the rim, down the road, in to its lane (where the road lies outside it) between the foot and the floor, along the lane the length of the hollow, past the mouth and the lamp, out into the firs
    const sTrack0 = sRoadRim + startBack, sTrack1 = sLamp - endPast;
    const laneAt = (s) => laneD + (Math.abs(rampLat) - laneD) * smoothstep(sFloor, sFoot, s) + endOut * (1 - smoothstep(sTrack1, sLamp, s));
    dell = route(sTrack0, rampLat);
    // how far a spot (in the route's frame) lies from the track
    const trackOff = (s, d) => (s > sTrack0 + 4 || s < sTrack1 - 4 ? 99 : Math.abs(d - sledSide * laneAt(clamp(s, sTrack1, sTrack0))));
    // thaw moment of a spot, counted in metres of our own flight past the start (and handed on as the film's u): later the further along the route, earlier on the side the warmth comes from, ragged by noise.
    // The strip under the rock warms first: from the thaw line to one foot-length beyond it the thaw starts as we pass the first lamp, so the line is seen from the hollow before we reach it
    // (band 0: without that early strip; the ice of the fall and the icicles of the ledge keep to it and stay frozen until we come to them). The packed snow of the sledge's road is the last
    // to go: within 3 m of the track's middle line there is no early strip, and it comes in over the next 5 m
    const thawSD = (x, z, s, d, band = 1) => (sThaw + Math.max(0, s - sThaw) * FRONT + Math.min(0, s - sThaw) * 0.04 - (band && s > sThaw ? (sThaw - sLamp) * Math.exp(-(s - sThaw) / footLen) * smoothstep(3, 8, trackOff(s, d)) : 0)
      + 20 * noise.n2(x * 0.028 + 31, z * 0.028) + 8 * noise.n2(x * 0.09, z * 0.09 + 17) - meltSide * meltTilt * clamp(d, -40, 40)) / PL;
    const thawAt = (x, z, band = 1) => { fieldAt(x, z, _f); return thawSD(x, z, _f.s, _f.d, band); };
    await ctx.yield();

    // ------------------------------------------------------------ two skies (winter dusk or moonlit night; spring morning), one light rig blended between them
    // each sky has its own stream and draws the same count whatever the hour, so the hour changes the winter sky and nothing else
    const WS = ST['winter sky'], moonEl = WS.range(30, 40), moonAz = WS.range(18, 36), coverNight = WS.range(0.3, 0.42), coverDusk = WS.range(0.52, 0.66);
    const SS = ST['spring sky'], endAz = Math.atan2(16 * sx, 58) * 180 / Math.PI, sunAz = endAz + side * SS.range(24, 40), sunEl = SS.range(19, 26), coverSpring = SS.range(0.3, 0.4);
    const WINTER = night
      ? { preset: 'night', zenith: '#040a1e', mid: '#0e2048', horizon: '#2a4680', ground: '#1a2a52', stars: 1, milkyWay: 0.6,
        bodies: [{ elevation: moonEl, azimuth: -side * moonAz, size: 2.6, phase: 0.96, intensity: 1.0, dark: 0.03, glow: 0.22, glowColor: '#9db8ff', glowSize: 5 }], key: 0,
        clouds: { coverage: coverNight, softness: 0.4, lit: '#8a9fd4', shade: '#1a2850', opacity: 0.85 }, clouds2: false,
        lightColor: '#cfdcff', lightIntensity: 2.3, ambientColor: '#5674c4', groundLight: '#2a3c70', ambientIntensity: 1.8 }
      : { preset: 'blueHour', zenith: pale ? '#27407c' : '#0d1b4a', mid: pale ? '#5a78b8' : '#2a4690', horizon: pale ? '#aebce2' : '#7089cc', ground: pale ? '#5a6c9c' : '#33487c', horizonPow: 3,
        scatterColor: pale ? '#f0b0a0' : '#c890b0', scatter: pale ? 0.5 : 0.3, scatterPow: 6, sunAzimuth: -side * 68, sunElevation: -5, stars: pale ? 0 : 0.22, milkyWay: 0, bodies: [],
        clouds: { coverage: coverDusk, softness: 0.5, lit: pale ? '#a9b6da' : '#7d92cc', shade: pale ? '#4a5c90' : '#243668', opacity: 0.9, silver: 0.4 }, clouds2: false,
        lightElevationMin: 38, lightColor: pale ? '#e6ecff' : '#d4e0ff', lightIntensity: pale ? 2.7 : 2.4, ambientColor: pale ? '#8ea2de' : '#6480d6', groundLight: '#34467e', ambientIntensity: pale ? 1.75 : 1.6 };
    const skyW = makeSky({ rng: WS, ...WINTER, quality: 0.5, bake: night, renderer: ctx.renderer, transparent: true });
    await ctx.yield();
    // spring: a deep blue sky, a narrow pale band at the horizon, a few defined white clouds and no haze layer
    const skyS = makeSky({ rng: SS, preset: 'day', zenith: '#1a55b4', mid: '#4690e2', horizon: '#a9d0f6', horizonPow: 3, ground: '#7a9a6a', scatterColor: '#ffe6b0', scatter: 0.45, scatterPow: 6,
      sunElevation: sunEl, sunAzimuth: sunAz, sunColor: '#fff2d2', sunSize: 1.6, sunIntensity: 12, sunGlow: 0.8,
      clouds: { coverage: coverSpring, softness: 0.22, lit: '#ffffff', shade: '#8fa8d2', opacity: 0.95 }, clouds2: false,
      lightColor: '#ffe9c0', lightIntensity: 3.1, ambientColor: '#a6c6ff', groundLight: '#6a8a4a', ambientIntensity: 1.25, quality: 0.5, transparent: true });
    skyS.setOpacity(0);
    scene.add(skyW.object, skyS.object);
    const rig = makeLightRig(skyW, { bounce: 0.45 }); scene.add(rig.object);
    const fogW = new THREE.Color(night ? '#26407c' : pale ? '#8799c8' : '#566fb6'), fogM = new THREE.Color('#ffe2a6'), fogS = new THREE.Color('#bcd9f8');
    scene.fog = new THREE.FogExp2(fogW.clone(), 0.0095);
    const sunDir = skyS.lightDirection.clone(), sunFlat = Math.hypot(sunDir.x, sunDir.z) || 1;
    await ctx.yield();

    // ------------------------------------------------------------ the set pieces: season, lamp-posts, wardrobe
    const S = makeSeason(), tU = { value: 0 };
    const wind = flora.makeWind({ direction: [0.7 * sx, 0.5], strength: 0.75, speed: 0.8 });
    const hero = await buildHero(ctx, { world: true, season: S, time: tU, wind });
    const treeMat = hero.material;
    // both lamp-posts stand LAMP_OUT outside our own flight's lane, so we pass each of them near: the first where the firs open to the hollow, the second in the open half-way up the rise
    // before the ring (seen against the ring's light the length of the glade)
    const lampXZ = route(sLamp, lampSide * (LANE_FLY + LAMP_OUT)), lampY = groundAt(lampXZ[0], lampXZ[1]) - 0.08;
    hero.lamp.object.position.set(lampXZ[0], lampY, lampXZ[1]); hero.lamp.object.rotation.y = ST['first lamp turn'].range(0, TAU);
    scene.add(hero.lamp.object);
    S.uLampPos.value[0].set(lampXZ[0], lampY + hero.lamp.lantern.y, lampXZ[1]);
    const LAMP_COL = new THREE.Vector3(LAMP_COLOR[0], LAMP_COLOR[1], LAMP_COLOR[2]);
    scene.add(hero.wardrobe.object);
    const lamp2 = await makeLampPost(S, { rng: ST['second lamp'], snow: false, time: tU, pause: ctx.yield });
    const lamp2XZ = route(PL - RISE_L / 2, lampSide * (LANE_FLY + LAMP_OUT)), lamp2Y = groundAt(lamp2XZ[0], lamp2XZ[1]) - 0.05;
    lamp2.object.position.set(lamp2XZ[0], lamp2Y, lamp2XZ[1]); lamp2.setLevel(0.8); scene.add(lamp2.object);
    S.uLampPos.value[1].set(lamp2XZ[0], lamp2Y + lamp2.lantern.y, lamp2XZ[1]); S.uLampCol.value[1].set(3.4, 2.1, 0.75);
    await ctx.yield();

    // ------------------------------------------------------------ tree shapes (kit geometry, given a winter by the part)
    const G = {};
    const fir = (name, o) => firVariant(ctx.core, SEED[name], o, ctx.yield);
    const leafy = async (make, o, so) => { const g = make(o); await ctx.yield(); const r = seasonize(g, so); await ctx.yield(); return r; };
    G.firA = await fir('slim fir shape', { detail: 1, height: 17, slim: 0.84 }); await ctx.yield();
    G.firB = await fir('broad fir shape', { detail: 1, height: 13, slim: 1.05, droop: 0.95 }); await ctx.yield();
    G.firH = await fir('near fir shape', { detail: 2, height: 19, slim: 0.8 }); await ctx.yield();
    G.firF = await fir('far fir shape', { detail: 0, height: 16, slim: 0.9 }); await ctx.yield();
    G.larch = await fir('larch shape', { detail: 1, height: 16, slim: 0.9, droop: 0.9, leaf: '#7fb83e', leafLight: '#d8f08a', leafDark: '#2f6a22' }); await ctx.yield();
    // one great fir: a massive fluted trunk and a high crown of loaded boughs (the kit's redwood shape at a fir's size)
    const GREAT_H = 36, GREAT_GIRTH = 0.036;
    G.great = await leafy(flora.redwoodGeometry, { rng: ST['great fir shape'], detail: 1, height: GREAT_H, girth: GREAT_GIRTH, leaf: '#2c5a3a', leafLight: '#7fa65c', leafDark: '#10281c', bark: '#6a4a38', barkDark: '#2e1c16', barkLight: '#94705c' }, { woodSnow: 0.7, leafSnow: 0.95 });
    await ctx.yield();
    const BLACK = { bark: '#5c4c3e', barkDark: '#2c241f', barkLight: '#8a7663' };
    G.oak = await leafy(flora.oakGeometry, { rng: ST['oak shape'], detail: 1, height: 15, ...BLACK, leaf: '#5f9c36', leafLight: '#bfe36a', leafDark: '#2f5e22' }, { pivot: 'buds' }); await ctx.yield();
    G.oakF = await leafy(flora.oakGeometry, { rng: ST['far oak shape'], detail: 0, height: 14, ...BLACK, leaf: '#5f9c36', leafLight: '#bfe36a', leafDark: '#2f5e22' }, { pivot: 'buds' });
    await ctx.yield();
    G.beech = await leafy(flora.oakGeometry, { rng: ST['beech shape'], detail: 1, height: 17, fullness: 1.12, bark: '#77756c', barkDark: '#3c3b38', barkLight: '#9a978c', leaf: '#8fd04a', leafLight: '#dcf78c', leafDark: '#4f8f2c' }, { pivot: 'buds' }); await ctx.yield();
    G.birchA = await leafy(flora.birchGeometry, { rng: ST['birch shape'], detail: 1, height: 15, leaf: '#9fd456', leafLight: '#dcf08a', leafDark: '#4f8a2e' }, { pivot: 'buds', woodSnow: 0.6 });
    await ctx.yield();
    G.birchB = await leafy(flora.birchGeometry, { rng: ST['small birch shape'], detail: 1, height: 12.5, leaf: '#a8d860', leafLight: '#e2f296', leafDark: '#568f30' }, { pivot: 'buds', woodSnow: 0.6 }); await ctx.yield();
    G.birchF = await leafy(flora.birchGeometry, { rng: ST['far birch shape'], detail: 0, height: 14, leaf: '#9fd456', leafLight: '#dcf08a', leafDark: '#4f8a2e' }, { pivot: 'buds', woodSnow: 0.6 });
    await ctx.yield();
    // laburnum: long chains of clear yellow; hawthorn: white
    G.laburnum = await leafy(flora.willowGeometry, { rng: ST['laburnum shape'], detail: 1, height: 10.5, leaf: '#ffe14a', leafLight: '#fff6ae', leafDark: '#dcbc34', bark: '#5a5044', barkDark: '#2a241e' }, { pivot: 'top' }); await ctx.yield();
    G.hawthorn = await leafy(flora.cherryGeometry, { rng: ST['hawthorn shape'], detail: 1, height: 8.6, leaf: '#f7fbee', leafLight: '#ffffff', leafDark: '#a3c486', bark: '#4a3f36', barkDark: '#231c18' }, { pivot: 'buds' }); await ctx.yield();
    // how far a shape's leaves reach from its stem below a height (both in the shape's own metres)
    const reachBelow = (g, yMax) => { const P = g.attributes.position.array, W = g.attributes.wind.array; let r = 0; for (let i = 0; i < P.length / 3; i++) if (W[i * 4 + 2] > 0.5 && P[i * 3 + 1] <= yMax) r = Math.max(r, Math.hypot(P[i * 3], P[i * 3 + 2])); return r; };

    // ------------------------------------------------------------ the wood: where every tree stands
    const trees = [], hash = new Map(), HC = 8;
    const hkey = (x, z) => Math.floor(x / HC) * 4096 + Math.floor(z / HC);
    const near = (x, z, r) => { const cx = Math.floor(x / HC), cz = Math.floor(z / HC); for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const l = hash.get((cx + a) * 4096 + cz + b); if (l) for (const t of l) if ((t.x - x) ** 2 + (t.z - z) ** 2 < (r + t.r) ** 2) return true; } return false; };
    // something that is not a tree but takes its room among them (a boulder, a fallen trunk)
    const block = (x, z, r) => { const k = hkey(x, z); let l = hash.get(k); if (!l) hash.set(k, l = []); l.push({ x, z, r }); };
    const KIND = { fir: { clear: 7.4, r: 2.0, sc: [0.7, 1.3] }, larch: { clear: 7.2, r: 1.9, sc: [0.75, 1.15] }, oak: { clear: 9.0, r: 2.8, sc: [0.8, 1.25] }, beech: { clear: 9.0, r: 2.8, sc: [0.85, 1.3] },
      birch: { clear: 5.8, r: 1.6, sc: [0.8, 1.25] }, laburnum: { clear: 8.0, r: 2.6, sc: [0.8, 1.1] }, hawthorn: { clear: 8.5, r: 2.4, sc: [0.9, 1.15] }, great: { clear: 0, r: 3, sc: [1, 1] } };
    const addTree = (kind, x, z, sc, o, R) => {
      fieldAt(x, z, _f); const s = _f.s, d = _f.d;
      const t = { kind, x, z, y: groundSD(x, z, s, d), s: sc, rot: R.range(0, TAU), sp: s, lat: d, r: KIND[kind].r * sc, thaw: thawSD(x, z, s, d) + R.range(-0.008, 0.008), ...o };
      trees.push(t); const k = hkey(x, z); let l = hash.get(k); if (!l) hash.set(k, l = []); l.push(t);
      return t;
    };
    // planted by rule, each kind of thing from its own stream, before the scatter (which fits itself round them):
    // small firs carrying on the rows of coats beyond the wardrobe's mouth
    { const MF = ST['mouth firs'];
      for (let r = 0; r < 4; r++) for (const sg of [-1, 1]) for (let j = 0; j < 2; j++) {
        const q = route(WARDROBE_DEPTH + 3.5 + r * 5.6 + MF.range(-0.8, 0.8), sg * (7.8 + r * 0.5 + j * MF.range(3.4, 4.4)) + MF.range(-0.3, 0.3));
        addTree('fir', q[0], q[1], MF.range(0.62, 0.8) + r * 0.04, { mouth: 1 }, MF);
      } }
    // the firs' stretch, from 18 m past the wardrobe's mouth (where the mouth's small firs end) to 30 m before the lamp: five different things beside or over the way, in a drawn order,
    // the first 4 to 10 m in and each next one 13 to 18 m on, sides in turn from a drawn first side
    const thing = {};
    { const FSR = ST['firs stretch']; let s = WARDROBE_DEPTH + 18 + FSR.range(4, 10), sg = FSR.sign();
      for (const k of FSR.shuffle(['gate', 'great fir', 'fallen trunk', 'capped boulder', 'trail'])) { thing[k] = { s, side: sg }; s += FSR.range(13, 18); sg = -sg; } }
    // the gate: two great firs bowed together under their snow over the way, tops resting on each other. They are tall and slim (GATE_SY times the height of their breadth) and stand as far
    // to each side as their bowed height reaches, so their tops meet above the route and their boughs hang clear of it
    const GATE_SY = 1.45, gateMid = route(thing.gate.s, 0);
    { const GT = ST['fir gate'], lean = GT.range(0.44, 0.5), pair = [-1, 1].map((sg) => { const sc = GT.range(0.9, 1); return { sc, at: route(thing.gate.s + sg * GT.range(0.5, 1.6), sg * G.firH.userData.height * sc * GATE_SY * Math.sin(lean) * 0.98) }; });
      pair.forEach((f, k) => { const o = pair[1 - k].at, dx = o[0] - f.at[0], dz = o[1] - f.at[1], dl = Math.hypot(dx, dz) || 1;   // each bows toward the other
        const tz = -Math.asin(dx / dl * Math.sin(lean)), tx = Math.asin(clamp(dz / dl * Math.sin(lean) / Math.cos(tz), -1, 1));
        addTree('fir', f.at[0], f.at[1], f.sc, { lean: [tx, tz], r: 5.5 * f.sc }, GT); }); }
    // the great fir: its root flare stands 2.6 m clear of the way's own line, and its crown begins far above the eye and reaches over the way
    { const GF = ST['great fir'], sc = GF.range(0.95, 1.06), flare = GREAT_GIRTH * GREAT_H * 1.75 * sc, g = thing['great fir'], q = route(g.s, g.side * (flare + 2.6));
      addTree('great', q[0], q[1], sc, { great: 1, r: flare + 0.6 }, GF); }
    // the fallen trunk: its root plate stands nearest the way, its middle 2.6 m outside our lane; the bole lies on from there away into the wood, 55 to 77 degrees off the way's own
    // heading, so its whole length is seen from the side as we come
    { const FT = ST['fallen trunk'], f = thing['fallen trunk'], len = FT.range(15, 19), ang = FT.range(0.95, 1.35), q0 = route(f.s, f.side * (LANE_FLY + 2.2 + 0.4));
      path.tangentAtDist(f.s, _t); const tl = Math.hypot(_t.x, _t.z) || 1, tx = _t.x / tl, tz = _t.z / tl, ox = -tz * f.side, oz = tx * f.side;
      f.at = q0; f.dir = [tx * Math.cos(ang) + ox * Math.sin(ang), tz * Math.cos(ang) + oz * Math.sin(ang)]; f.len = len;
      for (let k = 0; k <= 4; k++) block(q0[0] + f.dir[0] * len * k / 4, q0[1] + f.dir[1] * len * k / 4, 1.6); }
    // the boulder: its near side 0.4 m outside our lane
    { const CB = ST['capped boulder'], b = thing['capped boulder']; b.r = CB.range(3.2, 4.0); b.at = route(b.s, b.side * (LANE_FLY + 0.4 + b.r)); block(b.at[0], b.at[1], b.r + 0.8); }
    // an animal's trail across the way: a line of prints from 26 m on one side to 26 m on the other, slantwise
    { const AT = ST['animal trail'], a = thing.trail, ang = AT.range(0.9, 1.4) * AT.sign(), q = route(a.s, 0); path.tangentAtDist(a.s, _t); const tl = Math.hypot(_t.x, _t.z) || 1, tx = _t.x / tl, tz = _t.z / tl;
      a.dir = [tx * Math.cos(ang) - tz * Math.sin(ang), tz * Math.cos(ang) + tx * Math.sin(ang)]; a.len = 52; a.at = [q[0] - a.dir[0] * 26, q[1] - a.dir[1] * 26]; }
    // firs bent with snow round the first lamp-post: eight places an eighth of a turn apart from a seeded bearing, left empty where the way's own lane or the sledge's track runs
    { const LF = ST['lamp firs'], a0 = LF.range(0, TAU);
      for (let i = 0; i < 8; i++) { const a = a0 + i * TAU / 8 + LF.range(-0.2, 0.2), r = LF.range(4.6, 6.2), sc = LF.range(0.8, 1.05), x = lampXZ[0] + Math.sin(a) * r, z = lampXZ[1] + Math.cos(a) * r;
        fieldAt(x, z, _f); if (Math.abs(_f.d) < KIND.fir.clear || trackOff(_f.s, _f.d) < 3.6 + KIND.fir.r * sc * 0.45) continue;
        addTree('fir', x, z, sc, {}, LF); } }
    // hawthorn beside the ring (5.5 m outside it, their crowns closing over the arch) and at the clearing's edge 15 m before it
    { const RW = ST['ring hawthorns'];
      for (const sg of [-1, 1]) { const q = route(PL + 3, sg * (PORTAL_R + 5.5)); addTree('hawthorn', q[0], q[1], 1.12, { arch: 1 }, RW); const q2 = route(PL - 15, sg * (clearW(PL - 15) + 3.7)); addTree('hawthorn', q2[0], q2[1], 0.95, { arch: 1 }, RW); } }
    // tall blossom in pairs down the glade, hawthorn and laburnum in turn: each stands so that its boughs up to 1.5 m above the eye stay 1.2 m short of the route's line;
    // a hawthorn's higher boughs then reach over the way, a laburnum's chains hang beside it. On the second lamp-post's side they stand in the glade's first half only,
    // so that from the glade's middle on the post is seen across open ground
    { const TB = ST['tall blossom']; let turn = TB.chance(0.5) ? 0 : 1;
      for (let s = GLADE0 + TB.range(14, 28); s < sRise; s += TB.range(28, 40)) for (const sg of [-1, 1]) {
        const kind = turn++ % 2 ? 'laburnum' : 'hawthorn', sc = (kind === 'hawthorn' ? 1.5 : 1.3) * TB.range(0.94, 1.08), sy = kind === 'hawthorn' ? 1.6 : 1.5, sj = s + TB.range(-3, 3);
        const q0 = route(sj, sg * LANE_WOOD), eye = path.posAtDist(sj, _p).y - groundAt(q0[0], q0[1]) + 1.5, q = route(sj, sg * (sc * reachBelow(G[kind], eye / (sc * sy)) + 1.2));
        fieldAt(q[0], q[1], _f); if (streamDist(_f.s, _f.d) < 4.5 || (sg === lampSide && sj > (GLADE0 + PL) / 2)) continue;
        addTree(kind, q[0], q[1], sc, { tall: sy, r: 1.6 }, TB);
      } }
    // hawthorn in white blossom and laburnum in gold down both edges of the clearing (on the stream's side they stand on its far bank)
    { const GP = ST['glade planting'];
      for (const sg of [-1, 1]) for (let s = GLADE0 + GP.range(6, 13); s < PL + 6; s += GP.range(8.5, 13)) {
        const kind = GP.chance(0.56) ? 'hawthorn' : 'laburnum', bank = sg === -lampSide && s < sRise ? 6 : 0, lat = sg * (clearW(s) + bank + KIND[kind].r + GP.range(0.8, 6.5)), sc = lerp(KIND[kind].sc[0], KIND[kind].sc[1], GP()), q = route(s, lat);
        if (s > PL - 2 && Math.abs(lat) < 13) continue;
        fieldAt(q[0], q[1], _f);
        if ((q[0] - lamp2XZ[0]) ** 2 + (q[1] - lamp2XZ[1]) ** 2 < 20 || near(q[0], q[1], KIND[kind].r * sc) || streamDist(_f.s, _f.d) < 4.5) continue;
        addTree(kind, q[0], q[1], sc, {}, GP);
      } }
    // a thicket of young birches by the ring's side, on the second lamp-post's flank: ten places a tenth of a turn apart from a seeded bearing round a spot just outside the ring,
    // left empty where the ring and its mouth are
    { const LB = ST['ring birches'], a0 = LB.range(0, TAU), c = route(PL, lampSide * (PORTAL_R + LAMP_OUT));
      for (let i = 0; i < 10; i++) { const a = a0 + i * TAU / 10 + LB.range(-0.15, 0.15), r = LB.range(2.6, 5.2), sc = LB.range(0.34, 0.52), x = c[0] + Math.sin(a) * r, z = c[1] + Math.cos(a) * r;
        fieldAt(x, z, _f); if (Math.abs(_f.d) < PORTAL_R + 2.2) continue;
        addTree('birch', x, z, sc, { young: 1 }, LB); } }
    // the scatter: the wood itself
    const WD = ST.wood, nTry = Math.round(4300 * dens);
    for (let i = 0; i < nTry; i++) {
      const s0 = WD.range(-25, PL + 95), lat = (6 + (REACH - 30) * Math.pow(WD(), 1.7)) * (WD() < 0.5 ? -1 : 1), q = route(s0, lat);
      const pick = WD(), scR = WD(), acc = WD();
      fieldAt(q[0], q[1], _f); const s = _f.s, d = _f.d, ad = Math.abs(d);
      // firs below the ledge; from its foot the wood turns to mixed wood over three foot-lengths; birch and blossom in the glade
      const glade = smoothstep(GLADE0, GLADE1, s) * (1 - smoothstep(38, 60, ad)), thawZ = smoothstep(sFoot, sFoot + 3 * footLen, s) * (1 - glade);
      const wFir = lerp(lerp(0.66, 0.4, thawZ), 0.05, glade), wOak = lerp(lerp(0.24, 0.17, thawZ), 0.03, glade), wBeech = lerp(lerp(0.1, 0.14, thawZ), 0.13, glade),
        wLarch = lerp(lerp(0, 0.1, thawZ), 0.07, glade), wBirch = lerp(lerp(0, 0.19, thawZ), 0.6, glade), wLab = 0.12 * glade;
      let c = pick * (wFir + wOak + wBeech + wLarch + wBirch + wLab), kind = 'fir';
      if ((c -= wFir) < 0) kind = 'fir'; else if ((c -= wOak) < 0) kind = 'oak'; else if ((c -= wBeech) < 0) kind = 'beech'; else if ((c -= wLarch) < 0) kind = 'larch'; else if ((c -= wBirch) < 0) kind = 'birch'; else kind = 'laburnum';
      const K = KIND[kind], sc = lerp(K.sc[0], K.sc[1], scR);
      if (i % 150 === 149) await ctx.yield();
      if (ad < K.clear + (kind === 'laburnum' ? 3 : 0) || ad > REACH - 26) continue;
      if (acc > lerp(1, 0.62, glade) * (0.4 + 0.6 * smoothstep(55, 18, ad)) * (1 - 0.45 * smoothstep(52, 80, ad)) * (s0 > PL + 6 ? 0.55 : 1) * (1 - 0.4 * glade * smoothstep(30, 50, ad))) continue;
      if (streamDist(s, d) < 5.0 + K.r * 0.4) continue;
      if (s < WARDROBE_DEPTH + 3 && ad < hero.wardrobe.halfWidth + 4.8) continue;               // the wardrobe
      if ((q[0] - lampXZ[0]) ** 2 + (q[1] - lampXZ[1]) ** 2 < 16 || (q[0] - lamp2XZ[0]) ** 2 + (q[1] - lamp2XZ[1]) ** 2 < 30) continue;
      if (trackOff(s, d) < 3.6 + K.r * sc * 0.45) continue;                                       // the sledge's track
      if (bowlAt(s, d) > 0.6) continue;                                                           // the hollow's floor is open snow: the wood stands round it, from a little way up its sides
      if (s > GLADE0 && ad < clearW(s) + K.r * sc * 0.35) continue;                               // the glade's clearing
      if (kind !== 'fir' && (q[0] - gateMid[0]) ** 2 + (q[1] - gateMid[1]) ** 2 < 100) continue;  // nothing but firs under the fir gate
      if (Math.abs(s - sLedge) < 5 && ad < 22) continue;                                          // the ledge's face stays rock
      if (s > PL - 2 && ad < 12) continue;                                                        // nothing behind the ring's opening but the rise and far trees
      if (near(q[0], q[1], K.r * sc * 1.05)) continue;
      addTree(kind, q[0], q[1], sc, { beyond: s0 > PL + 6 }, WD);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the trees' instances
    const DELAY = { oak: 0.56, beech: 0.46, birch: 0.4, laburnum: 0.62, hawthorn: 0.36 };
    const buckets = new Map(), IR = ST['tree dress'];
    let heroFirs = 0, binned = 0;
    for (const t of trees) {
      const ad = Math.abs(t.lat), far = ad > 19 || t.beyond, bloom = t.kind === 'hawthorn' || t.kind === 'laburnum'; let key;
      if (t.great) key = 'great';
      else if (t.kind === 'fir') key = t.mouth ? 'firB' : far ? 'firF' : ad < 12.5 && heroFirs++ < 16 ? 'firH' : IR() < 0.55 ? 'firA' : 'firB';
      else if (t.young) key = 'birchB';
      else if (t.kind === 'larch') key = far ? 'firF' : 'larch';
      else if (t.kind === 'oak') key = far ? 'oakF' : 'oak';
      else if (t.kind === 'beech') key = far ? 'oakF' : 'beech';
      else if (t.kind === 'birch') key = far ? 'birchF' : IR() < 0.5 ? 'birchA' : 'birchB';
      else key = t.kind;
      const br = IR.range(0.86, 1.12), hue = IR.range(-0.05, 0.05);
      const p = { x: t.x, y: t.y - 0.18 * t.s, z: t.z, s: t.s, sy: IR.range(0.92, 1.1), rot: t.rot, tiltX: IR.range(-0.035, 0.035), tiltZ: IR.range(-0.035, 0.035), thaw: t.thaw,
        delay: (DELAY[t.kind] ?? 0) + IR.range(-0.06, 0.1), snow: 1, kind: t.kind === 'fir' || t.kind === 'larch' || t.great ? 0 : 1, col: bloom ? [br, br, br] : [br * (1 + hue), br, br * (1 - hue * 1.5)] };
      if (t.lean) { key = 'firH'; p.rot = 0; p.tiltX = t.lean[0]; p.tiltZ = t.lean[1]; p.sy = GATE_SY; p.y -= 0.5; }
      // blossom trees stand taller than the kit's shapes are broad; the tall ones by their own measure
      if (t.tall) p.sy = t.tall; else if (bloom) p.sy *= t.kind === 'hawthorn' ? 1.3 : 1.2;
      if (t.great) { p.sy = 1; p.tiltX = 0; p.tiltZ = 0; p.y = t.y - 0.4; }
      t.H = G[key].userData.height * t.s * p.sy; t.R = G[key].userData.radius * t.s;
      const ch = clamp(Math.floor(t.sp / 50), 0, 11), bk = key + ':' + ch; let l = buckets.get(bk); if (!l) buckets.set(bk, l = { g: G[key], list: [], ch }); l.list.push(p);
      if (++binned % 300 === 0) await ctx.yield();
    }
    const treeMeshes = [];
    await ctx.yield();
    for (const b of buckets.values()) { const m = seasonInstances(b.g, treeMat, b.list); m.userData.ch = b.ch; scene.add(m); treeMeshes.push(m); if (treeMeshes.length % 6 === 0) await ctx.yield(); }
    await ctx.yield();
    // ------------------------------------------------------------ the ground: one grid over the field, snow and what is under it in one shader
    const H = new Float32Array(GW * GH), TH = new Float32Array(GW * GH), mask = new Uint8Array(GW * GH);
    // one slow field decides which kind of flower a spot bears, for the flowers themselves and for their far speckle on the ground
    const kindField = (x, z) => clamp(noise.n2(x * 0.05 + 70, z * 0.05) * 0.5 + 0.5 + (flowerMix - 0.5) * 0.3, 0, 1);
    for (let j = 0; j < GH; j++) {
      const z = bz0 + j * CELL;
      for (let i = 0; i < GW; i++) { const a = j * GW + i, x = bx0 + i * CELL; H[a] = groundSD(x, z, fS[a], fD[a]); TH[a] = thawSD(x, z, fS[a], fD[a]); mask[a] = Math.abs(fD[a]) < REACH - 2 ? 1 : 0; }
      if (j % 16 === 15) await ctx.yield();
    }
    const vid = new Int32Array(GW * GH).fill(-1), gp = [], gn = [], ga = [], gt = [], gi = [];
    let nv = 0;
    for (let j = 0; j < GH; j++) {
      const z = bz0 + j * CELL;
      for (let i = 0; i < GW; i++) {
        const a = j * GW + i; if (!mask[a]) continue;
        const x = bx0 + i * CELL, hx = H[a + (i < GW - 1 ? 1 : 0)] - H[a - (i > 0 ? 1 : 0)], hz = H[a + (j < GH - 1 ? GW : 0)] - H[a - (j > 0 ? GW : 0)];
        const nl = Math.hypot(hx, 2 * CELL, hz);
        // contact shade of the trunks standing near
        let ao = 1; { const cx = Math.floor(x / HC), cz = Math.floor(z / HC); for (let q = -1; q <= 1; q++) for (let w = -1; w <= 1; w++) { const l = hash.get((cx + q) * 4096 + cz + w); if (l) for (const t of l) { const d2 = (t.x - x) ** 2 + (t.z - z) ** 2, rr = t.r * 1.5; if (d2 < rr * rr * 4) ao *= 1 - 0.42 * Math.exp(-d2 / (rr * rr)); } } }
        const sd = streamDist(fS[a], fD[a]), glade = smoothstep(GLADE0, GLADE1, fS[a]) * (1 - smoothstep(40, 62, Math.abs(fD[a])));
        ao *= 1 - 0.3 * bowlAt(fS[a], fD[a]);
        vid[a] = nv++; gp.push(x, H[a], z); gn.push(-hx / nl, 2 * CELL / nl, -hz / nl); ga.push(TH[a], ao, Math.min(sd, 20), glade);
        // the sledge's track as the ground knows it: metres to the side of its middle line (true across the track where it slants), metres along it; and the field the flowers' kinds are dealt by
        const ts = fS[a], onTrack = ts > sTrack1 - 3 && ts < sTrack0 + 3, slant = onTrack ? (laneAt(ts + 1) - laneAt(ts - 1)) / 2 : 0;
        gt.push(onTrack ? (fD[a] - sledSide * laneAt(ts)) / Math.sqrt(1 + slant * slant) : 99, sTrack0 - ts, kindField(x, z));
      }
      if (j % 20 === 19) await ctx.yield();
    }
    for (let j = 0; j < GH - 1; j++) {
      for (let i = 0; i < GW - 1; i++) {
        const a = vid[j * GW + i], b = vid[j * GW + i + 1], c = vid[(j + 1) * GW + i], d = vid[(j + 1) * GW + i + 1];
        if (a < 0 || b < 0 || c < 0 || d < 0) continue;
        if ((i + j) & 1) gi.push(a, c, b, b, c, d); else gi.push(a, c, d, a, d, b);
      }
      if (j % 20 === 19) await ctx.yield();
    }
    await ctx.yield();
    const groundG = new THREE.BufferGeometry();
    groundG.setAttribute('position', new THREE.Float32BufferAttribute(gp, 3)); groundG.setAttribute('normal', new THREE.Float32BufferAttribute(gn, 3));
    groundG.setAttribute('aG', new THREE.Float32BufferAttribute(ga, 4)); groundG.setAttribute('aTr', new THREE.Float32BufferAttribute(gt, 3)); groundG.setIndex(gi);
    await ctx.yield();
    // the trunks nearest the lamp throw long shadows away from it across the snow
    const trunkU = []; { const l = trees.map((t) => ({ t, d: Math.hypot(t.x - lampXZ[0], t.z - lampXZ[1]) })).filter((q) => q.d < 30).sort((a, b) => a.d - b.d).slice(0, 12);
      for (let i = 0; i < 12; i++) trunkU.push(l[i] ? new THREE.Vector3(l[i].t.x, l[i].t.z, 0.34 * l[i].t.s + 0.1) : new THREE.Vector3(0, 0, 0)); }
    const gU = { uSeason: S.uSeason, uLampPos: S.uLampPos, uLampCol: S.uLampCol, uTrunks: { value: trunkU }, uSpring: { value: 0 }, uGlint: { value: new THREE.Color(0.5, 0.6, 0.9) }, uMix: { value: flowerMix },
      uTrail: { value: new THREE.Vector4(thing.trail.at[0], thing.trail.at[1], thing.trail.dir[0], thing.trail.dir[1]) }, uTrailLen: { value: thing.trail.len },
      uSunD: { value: new THREE.Vector2(sunDir.x / sunFlat, sunDir.z / sunFlat) }, uPortal: { value: new THREE.Vector3() } };
    { const c = route(PL, 0); gU.uPortal.value.set(c[0], path.posAtDist(PL, _p).y, c[1]); S.uPortal.value.set(c[0], gU.uPortal.value.y, c[1], 2.4); }
    const groundMat = new THREE.MeshLambertMaterial({ color: '#ffffff' });
    groundMat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, gU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aG; attribute vec3 aTr; varying vec4 vG; varying vec3 vT; varying vec3 vWp;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvG = aG; vT = aTr; vWp = (modelMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vG; varying vec3 vT; varying vec3 vWp; uniform vec4 uSeason; uniform vec3 uTrunks[12]; uniform float uSpring, uMix, uTrailLen; uniform vec3 uGlint, uPortal; uniform vec4 uTrail; uniform vec2 uSunD;\n' + LAMP_GLSL + GNOISE)
        .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
          vec2 gx = vWp.xz;
          float gP = (uSeason.x - vG.x) * uSeason.y;
          float n1 = gNoise(gx * .21), n2 = gNoise(gx * 1.7 + 7.), n3 = gNoise(gx * .055 + 3.), n4 = gNoise(gx * 6.3);
          float gBank = 1. - smoothstep(3., 8., vG.z);
          float gCover = 1. - smoothstep(.36, .52, gP + (n1 - .5) * .62 + (n3 - .5) * .3 + (n2 - .5) * .2 + gBank * .12);
          float gSoft = gCover * (1. - gCover) * 4.;                                   // the wet rim of a melting patch
          float gGreen = smoothstep(.12, .85, gP + n3 * .3 + n1 * .2 - .15);
          vec3 earth = mix(vec3(.13, .1, .055), vec3(.34, .28, .12), n2 * .6 + n4 * .4);                 // wet dark earth where the snow has just gone
          vec3 grass = mix(vec3(.06, .16, .03), vec3(.25, .43, .08), n1 * .55 + n2 * .25 + n4 * .2);
          grass = mix(grass, vec3(.5, .68, .2), smoothstep(.55, .95, n3) * .4);
          vec3 under = mix(earth, grass, gGreen);
          { float peb = gNoise(gx * 3.1 + 2.); under = mix(mix(vec3(.16, .15, .13), vec3(.42, .4, .36), step(.5, peb) * n4), under, smoothstep(2.6, 4.8, vG.z + (n2 - .5) * 1.5)); }
          // far carpets of flowers: speckles that open after the grass, in drifts by kind (white snowdrops, purple and gold crocuses, yellow celandines) from the same field the flowers are dealt by
          { vec2 cq = gx * 1.9, ci = floor(cq); float h = gHash(ci), h2 = gHash(ci + 5.3);
            vec2 cf = fract(cq) - .5 - (vec2(h2, gHash(ci + 9.1)) - .5) * .55;
            float gPatch = smoothstep(.35, .7, gNoise(gx * .09 + 11.) * .7 + n1 * .3 + vG.w * .1);
            float open = smoothstep(.7, 1.25, gP - h * .3 + gPatch * .2);
            float dotm = (1. - smoothstep(.1, .24, length(cf))) * step(1. - gPatch * .75, h) * open * smoothstep(16., 42., length(vViewPosition));
            float kk = vT.z + (h2 - .5) * .12;
            vec3 fc = kk > mix(1.1, .42, vG.w) ? vec3(.95, .76, .08) : kk < mix(.47, .22, vG.w) ? vec3(.85, .85, .8) : (h < .55 ? vec3(.3, .12, .5) : h < .8 ? vec3(.9, .62, .08) : vec3(.8, .78, .9));
            under = mix(under, fc, dotm * .9); }
          vec3 snow = vec3(.78, .85, .97) * (.94 + .1 * n2);
          snow = mix(snow, vec3(.62, .74, .9), gSoft * .35);
          // the sledge's track: two runner grooves and the hoof prints of two reindeer abreast, along its whole length (it has come this way before)
          { float al = vT.y, pd = vT.x;
            float gr = 1. - smoothstep(.05, .17, abs(abs(pd) - .75));
            float hoof = 1. - smoothstep(.06, .15, length(vec2((fract(al * .7 + step(0., pd) * .5) - .5) / .7, abs(abs(pd) - .85) - .12)));
            snow = mix(snow, vec3(.3, .4, .66), max(gr, hoof * .85) * .8); }
          // an animal's trail across the way: paired prints in a line that wavers a little
          { vec2 tr = gx - uTrail.xy; float al = dot(tr, uTrail.zw), pd = tr.x * uTrail.w - tr.y * uTrail.z + .5 * sin(al * .31);
            float paw = 1. - smoothstep(.07, .15, length(vec2((fract(al * 1.1) - .5) / 1.1, abs(pd) - .13 - .1 * step(.5, fract(al * .55)))));
            snow = mix(snow, vec3(.3, .4, .66), paw * step(0., al) * step(al, uTrailLen) * .85); }
          diffuseColor.rgb = mix(under, snow, gCover) * mix(.55, 1., vG.y);`)
        .replace('#include <normal_fragment_maps>', /* glsl */`#include <normal_fragment_maps>
          { float e = .35; vec2 gd = vec2(gNoise((gx + vec2(e, 0.)) * .55) - gNoise((gx - vec2(e, 0.)) * .55), gNoise((gx + vec2(0., e)) * .55) - gNoise((gx - vec2(0., e)) * .55));
            gd += (vec2(gNoise(gx * 2.3 + 1.7), gNoise(gx * 2.3 + 8.3)) - .5) * mix(.5, .16, gCover);
            normal = normalize(normal - mat3(viewMatrix) * vec3(gd.x, 0., gd.y) * mix(.5, .34, gCover)); }`)
        .replace('#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
          // the trees' shadows: long soft streaks lying along the sun's own bearing, with the leaves' dapple in them
          { vec2 sq = vec2(gx.x * uSunD.y - gx.y * uSunD.x, dot(gx, uSunD));
            float dap = smoothstep(.34, .66, gNoise(vec2(sq.x * .2, sq.y * .035) + uSeason.z * .01) * .62 + gNoise(gx * .47 - uSeason.z * .02) * .38);
            reflectedLight.directDiffuse *= mix(1., .16 + 1.2 * dap, uSpring); }
          // the ring's gold lies on the ground round it
          { vec3 pl = uPortal - vWp; float p2 = dot(pl, pl); reflectedLight.directDiffuse += diffuseColor.rgb * vec3(1., .82, .42) * (2.4 * clamp(1. - p2 / 1600., 0., 1.) / (1. + p2 / 60.)); }
          { vec3 sL = (viewMatrix * vec4(uLampPos[0], 1.0)).xyz + vViewPosition; float sD2 = dot(sL, sL);
            float sN = clamp(dot(normal, sL * inversesqrt(max(sD2, 1e-4))) * .75 + .25, 0., 1.), sh = 1.;
            vec2 la = vWp.xz - uLampPos[0].xz;
            for (int i = 0; i < 12; i++) { vec2 lb = uTrunks[i].xy - uLampPos[0].xz; float bl = max(length(lb), .001); vec2 bn = lb / bl;
              float along = dot(la, bn), perp = abs(la.x * bn.y - la.y * bn.x), w = uTrunks[i].z * max(along, 0.) / bl;
              sh *= 1. - step(.5, uTrunks[i].z * 10.) * smoothstep(bl, bl * 1.12, along) * (1. - smoothstep(w * .6, w * 1.5 + .2, perp)) * .8; }
            // on the snow the lamp's pool lies wide: half its strength 17 m out, gone at 60 m
            float pool = clamp(1. - sD2 / 3600., 0., 1.); pool = pool * pool / (1. + sD2 / 300.);
            reflectedLight.directDiffuse += diffuseColor.rgb * uLampCol[0] * (pool * 1.25 * sN * sh * RECIPROCAL_PI);
            sL = (viewMatrix * vec4(uLampPos[1], 1.0)).xyz + vViewPosition; sD2 = dot(sL, sL);
            reflectedLight.directDiffuse += diffuseColor.rgb * uLampCol[1] * (lampFall(sD2) * RECIPROCAL_PI * .8);
            // glitter: single crystals that catch the light as the eye moves, and the wet shine of melting rims
            vec2 gq = floor(gx * 26.); float gs = gHash(gq + floor(dot(normalize(vViewPosition), vec3(7., 5., 3.)) * 9.));
            float glint = step(.988, gs) * gCover + step(.975, gs) * gSoft * .8;
            totalEmissiveRadiance += (uGlint * (.45 + 2. * lampFall(sD2 * 0. + dot(uLampPos[0] - vWp, uLampPos[0] - vWp))) + uLampCol[0] * lampFall(dot(uLampPos[0] - vWp, uLampPos[0] - vWp)) * .25) * glint * 1.6; }`);
    };
    groundMat.customProgramCacheKey = () => 'wbc-ground';
    const ground = new THREE.Mesh(groundG, groundMat); scene.add(ground);
    await ctx.yield();

    // ------------------------------------------------------------ air: the falling snow
    const flakes = makeFlakes(S, { rng: ST.snowfall, time: tU, count: Math.round(7000 * dens * detail), box: [84, 36, 84] });
    scene.add(flakes.object);
    flakes.uniforms.uRoof.value.set(0, hero.wardrobe.halfWidth + 0.7, -hero.wardrobe.depth, 1);
    await ctx.yield();

    // ------------------------------------------------------------ the stream: ice that breaks up from the middle and runs, sky and sun on it
    const waterU = { uSeason: S.uSeason, uLampPos: S.uLampPos, uLampCol: S.uLampCol, uZenith: { value: new THREE.Color() }, uHorizon: { value: new THREE.Color() }, uAmb: { value: new THREE.Color() },
      uSunCol: { value: new THREE.Color() }, uKey: { value: new THREE.Color() }, uSunDir: { value: sunDir.clone() }, uSpring: gU.uSpring, ...fx.fogUniforms() };
    const carveAt = (s, sd) => 1.25 * (1 - smoothstep(1.7, 5.6, sd)) * (1 - smoothstep(sRise, S_END, s));
    const SS0 = 50, SS1 = S_END, SN = Math.round((SS1 - SS0) / 2), wl = new Float32Array(SN + 1);
    for (let i = 0; i <= SN; i++) {
      const s = SS0 + (SS1 - SS0) * i / SN; let m = 1e9;
      for (const o of [-5, -2.5, 0, 2.5, 5]) { const q = route(s, streamOff(s) + o); fieldAt(q[0], q[1], _f); m = Math.min(m, groundSD(q[0], q[1], _f.s, _f.d) + carveAt(_f.s, streamDist(_f.s, _f.d))); }
      wl[i] = m - 0.62;
      if (i % 40 === 39) await ctx.yield();
    }
    await ctx.yield();
    for (let i = 1; i <= SN; i++) wl[i] = Math.max(wl[i], wl[i - 1]);                // water never runs uphill (we fly upstream)
    const waterAt = (s) => { const f = clamp((s - SS0) / (SS1 - SS0) * SN, 0, SN - 0.001), i = Math.floor(f); return lerp(wl[i], wl[i + 1], f - i); };
    {
      const wp = [], wa = [], wi = [];
      for (let i = 0; i <= SN; i++) {
        const s = SS0 + (SS1 - SS0) * i / SN, hw = 5.0 * smoothstep(SS0, SS0 + 10, s) * (1 - smoothstep(SS1 - 14, SS1, s)) + 0.05, c = streamOff(s);
        for (let k = -1; k <= 1; k++) { const q = route(s, c + k * hw); wp.push(q[0], wl[i], q[1]); wa.push(k, s, thawAt(q[0], q[1])); }
        if (i > 0 && wl[i] - wl[i - 1] < 0.9) { const a = (i - 1) * 3, b = i * 3; wi.push(a, b, a + 1, a + 1, b, b + 1, a + 1, b + 1, a + 2, a + 2, b + 1, b + 2); }
      }
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wp, 3)); wg.setAttribute('aW', new THREE.Float32BufferAttribute(wa, 3)); wg.setIndex(wi);
      const water = new THREE.Mesh(wg, new THREE.ShaderMaterial({
        uniforms: waterU, fog: true, side: THREE.DoubleSide, transparent: true, depthWrite: false,
        vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec3 aW; varying vec3 vA; varying vec3 vWp;
          void main(){ vA = aW; vec4 w = modelMatrix * vec4(position, 1.); vWp = w.xyz; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
        fragmentShader: fx.GLSL_FOG_PARS_FRAG + LAMP_GLSL + GNOISE + /* glsl */`
          uniform vec4 uSeason; uniform vec3 uZenith, uHorizon, uAmb, uSunCol, uSunDir, uKey; uniform float uSpring; varying vec3 vA; varying vec3 vWp;
          void main(){
            float p = (uSeason.x - vA.z) * uSeason.y, t = uSeason.z;
            vec2 q = vec2(vA.x * 5., vA.y);
            float n1 = gNoise(q * .33), n2 = gNoise(q * 1.5 + 3.), ax = abs(vA.x);
            float ice = 1. - smoothstep(0., .75, p + (n1 - .5) * .6 + (n2 - .5) * .2 - ax * .3 + .12);
            vec3 V = normalize(cameraPosition - vWp);
            // ice: dark clear glass in patches with a web of white cracks, snow drifted over it in tongues from the banks
            float crack = (1. - smoothstep(0., .03, abs(gNoise(q * .7 + 5.) - .5))) * .8 + (1. - smoothstep(0., .028, abs(gNoise(q * 1.9 + 9.) - .5))) * .5;
            float dust = max(smoothstep(.42, .8, gNoise(q * .4 + 20.) * .7 + n2 * .3) * .9 + .04, smoothstep(.34, .85, ax + (n1 - .5) * .7));
            vec3 iceA = mix(vec3(.1, .2, .38), vec3(.24, .4, .62), n1);
            iceA = mix(iceA, vec3(.6, .74, .95), clamp(crack, 0., 1.) * .8);
            vec3 Ni = normalize(vec3((n2 - .5) * .1, 1., (n1 - .5) * .1)), Ri = reflect(-V, Ni);
            float fi = 1. - clamp(dot(Ni, V), 0., 1.); fi = fi * fi * fi;
            vec3 lampL = uLampPos[0] - vWp; float lf = lampFall(dot(lampL, lampL));
            vec3 iceC = iceA * (uAmb * 1.6 + uKey * .6 + uSunCol * .5 + uLampCol[0] * lf * .3) + mix(uHorizon, uZenith, clamp(Ri.y, 0., 1.)) * (.1 + .75 * fi);
            float ls = clamp(dot(normalize(Ri * vec3(1., .6, 1.)), normalize(lampL * vec3(1., .6, 1.))), 0., 1.); ls *= ls; ls *= ls; ls *= ls; ls *= ls;
            iceC += uLampCol[0] * (.015 + lf * 2.) * ls * ls * .12;
            iceC = mix(iceC, vec3(.78, .85, .97) * (uAmb * 3.1 + uKey + uLampCol[0] * lf * .3), dust);
            // water: clear and bright, running down toward us; the bed's stones show through it with the sun's net of light on them, the sky lies on it, the bank trees stand in it as soft dark streaks
            vec2 fq = vec2(q.x, q.y + t * 2.4);
            float w1 = gNoise(vec2(fq.x * 1.5, fq.y * .22)), w2 = gNoise(vec2(fq.x * 3.3 + 7., fq.y * .55)), w3 = gNoise(fq * vec2(.5, .13) + 3.);
            vec3 Nw = normalize(vec3((w1 - .5) * .7 + (w2 - .5) * .35, 1., (w3 - .5) * .3)), Rw = reflect(-V, Nw);
            float fw = 1. - clamp(dot(Nw, V), 0., 1.); fw = fw * fw * fw;
            vec2 bq = q * 1.3 + (vec2(w1, w2) - .5) * .3;
            float peb = gNoise(bq * 2.1), peb2 = gNoise(bq * 5.3 + 4.);
            vec3 bed = mix(vec3(.2, .16, .09), vec3(.6, .53, .36), peb * .6 + peb2 * .4);
            bed = mix(bed, vec3(.1, .3, .27), (1. - smoothstep(0., .5, ax)) * .6);
            float caust = smoothstep(.56, .86, gNoise(bq * 3.1 + vec2(t * .7, -t * .9)) * .5 + gNoise(bq * 2.2 - vec2(t * .5, t * .6)) * .5);
            bed *= uAmb * 1.5 + uSunCol * (.42 + 1.5 * caust);
            vec3 sky = mix(uHorizon, uZenith, clamp(Rw.y * 1.2 + .7, 0., 1.)) * vec3(.82, .95, 1.1);
            float tre = smoothstep(.42, .7, gNoise(vec2(q.x * .3 + Rw.x * 2.5, q.y * .07))) * (1. - smoothstep(.12, .5, Rw.y));
            sky = mix(sky, vec3(.05, .13, .05) * (uAmb * 2.2 + uSunCol * .7), tre * .7);
            // seen from far and low, the water mirrors the wood beyond it, not the bare sky
            sky = mix(sky, vec3(.1, .2, .15) * (uAmb * 2.2 + uSunCol * .7), (1. - smoothstep(.03, .3, Rw.y)) * .62);
            vec3 wat = mix(bed, sky, clamp(.2 + .9 * fw, 0., 1.));
            float sr = clamp(dot(normalize(Rw * vec3(1., .5, 1.)), normalize(uSunDir * vec3(1., .5, 1.))), 0., 1.), s8 = sr * sr; s8 *= s8; s8 *= s8;
            wat += uSunCol * uSpring * (s8 * s8 * .35 + step(.86, gNoise(fq * vec2(6.5, 2.4))) * step(.5, w2) * (.2 + 1.6 * s8));
            float riffle = smoothstep(.6, .74, w1 * .55 + w2 * .45) * (.2 + .8 * smoothstep(.3, .8, ax));
            wat = mix(wat, vec3(.9, .96, 1.) * (uAmb * 1.7 + uSunCol * .45), riffle * .22);
            float edge = ice * (1. - ice) * 4.;
            vec3 col = mix(wat, iceC, ice) + vec3(.7, .8, 1.) * uAmb * edge * .8;
            float shore = (1. - smoothstep(.62, .98, ax + (gNoise(q * .55 + 40.) - .5) * .5)) * smoothstep(56., 78., vA.y + (n1 - .5) * 8.);
            gl_FragColor = vec4(fxApplyFog(col), shore);
          }`,
      }));
      water.renderOrder = 1;
      scene.add(water);
    }
    await ctx.yield();

    // ------------------------------------------------------------ the stream's banks: a strip of the wood's own floor down each side, with the cut lip the coarse floor grid cannot hold; the water's width goes with it
    {
      const bp = [], bn = [], ba = [], bt = [], bi = []; let bc = 0;
      const gridH = (x, z) => { const gx = clamp((x - bx0) / CELL, 0, GW - 1.001), gz = clamp((z - bz0) / CELL, 0, GH - 1.001), i = Math.floor(gx), j = Math.floor(gz), fx_ = gx - i, fz = gz - j, a = j * GW + i;
        return lerp(lerp(H[a], H[a + 1], fx_), lerp(H[a + GW], H[a + GW + 1], fx_), fz); };
      const lipAt = (s, sg) => 2.7 + 0.55 * Math.sin(s * 0.083 + sPh + sg) + 0.3 * Math.sin(s * 0.23 + sPh * 2 - sg);
      const PROF = [[-0.5, 0], [-0.14, 0], [0.1, 0], [0.9, 1], [2.1, 1], [3.5, 2]];
      for (const sg of [-1, 1]) {
        let prev = -1;
        for (let i = 0; i <= SN; i++) {
          const s = SS0 + (SS1 - SS0) * i / SN;
          if (s < 62 || s > SS1 - 18 || (i > 0 && wl[i] - wl[i - 1] >= 0.9) || (i < SN && wl[i + 1] - wl[i] >= 0.9)) { prev = -1; continue; }
          const L = lipAt(s, sg), c = streamOff(s), row = bc, fade = smoothstep(62, 72, s) * (1 - smoothstep(SS1 - 30, SS1 - 18, s));
          for (let k = 0; k < PROF.length; k++) {
            const o = L + PROF[k][0], q = route(s, c + sg * o), gH = gridH(q[0], q[1]);
            const y = k === 0 ? wl[i] - 0.55 : k === 1 ? wl[i] + 0.02 : k === 2 ? Math.max(gH + 0.05, wl[i] + 0.4 * fade) : PROF[k][1] === 1 ? Math.max(gH + 0.05, wl[i] + (0.44 - 0.2 * (PROF[k][0] - 0.9)) * fade) : gH - 0.22;
            const n = k < 2 ? [-sg * 0.8, 0.6] : k === 2 ? [-sg * 0.45, 0.9] : [0, 1], t = path.tangentAtDist(s, _t), tl = Math.hypot(t.x, t.z) || 1;
            bp.push(q[0], y, q[1]); bn.push(-t.z / tl * n[0], n[1], t.x / tl * n[0]);
            ba.push(thawAt(q[0], q[1]), k === 0 ? 0.55 : k === 1 ? 0.75 : 1, o, smoothstep(GLADE0, GLADE1, s)); bt.push(99, 0, kindField(q[0], q[1])); bc++;
          }
          if (prev >= 0) for (let k = 0; k < PROF.length - 1; k++) { const a = prev + k, b = row + k; if (sg > 0) bi.push(a, b, a + 1, a + 1, b, b + 1); else bi.push(a, a + 1, b, a + 1, b + 1, b); }
          prev = row;
          if (i % 100 === 99) await ctx.yield();
        }
      }
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(bp, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(bn, 3));
      bg.setAttribute('aG', new THREE.Float32BufferAttribute(ba, 4)); bg.setAttribute('aTr', new THREE.Float32BufferAttribute(bt, 3)); bg.setIndex(bi);
      const banks = new THREE.Mesh(bg, groundMat); banks.frustumCulled = false; scene.add(banks);
    }
    await ctx.yield();
    // ------------------------------------------------------------ rock: the ledge across the hollow, boulders by the water, snow on all of it
    const RK = ST['ledge rocks'], rocks = { big: [], small: [] }, lips = [], RSHAPE = { big: ST['great rock shape'], small: ST['small rock shape'] };
    const offTrack = (x, z) => { fieldAt(x, z, _f); return trackOff(_f.s, _f.d); };
    const rockGeo = (kind, det, seed) => { const g = T.rockGeometry({ rng: RSHAPE[seed], kind, radius: 1, detail: det, color: '#9a948c', colorB: '#6a6668' }), n = g.attributes.position.count;
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2).fill(0).map((v, i) => (i % 2 ? 0.75 : 0.875)), 2)); g.setAttribute('wind', new THREE.BufferAttribute(new Float32Array(n * 4), 4));
      return seasonize(g, { woodSnow: 0.97 }); };
    const rockBig = rockGeo('boulder', 2, 'big'); await ctx.yield();
    const rockSmall = rockGeo('rock', 1, 'small'); await ctx.yield();
    const addRock = (list, x, y, z, r, o, R) => list.push({ x, y, z, s: r, sy: o.sy ?? R.range(0.6, 0.95), rot: R.range(0, TAU), tiltX: R.range(-0.06, 0.06), tiltZ: R.range(-0.06, 0.06), thaw: thawAt(x, z) + R.range(-0.01, 0.02), snow: 1, kind: 2, ch: clamp(Math.floor(_f.s / 100), 0, 5), col: mul3([1, 1, 1], R.range(0.8, 1.15)) });
    for (let d = -36; d <= 36; d += RK.range(2.0, 2.7)) {
      const sL = ledgeLine(d), q0 = route(sL - 3.2, d), base = groundAt(q0[0], q0[1]), q = route(sL - 0.5 + RK.range(-0.5, 0.5), d), r1 = RK.range(2.0, 2.8), sy1 = RK.range(0.85, 1.1);
      const lip = RK.chance(0.85), q2 = route(sL + (lip ? -0.9 : 0.9) + RK.range(-0.3, 0.3), d + RK.range(-0.5, 0.5)), r2 = RK.range(1.8, 2.5), y2 = base + LEDGE_H - r2 * 0.42 + RK.range(-0.3, 0.2), sy2 = RK.range(0.5, 0.7);
      // no rock where the ice fall hangs, none where the sledge's road comes down
      if (Math.abs(d - fallLat) < FALL_W0 - 0.8 || Math.abs(d - rampLat) < RAMP_W + 3) continue;
      addRock(rocks.big, q[0], base + r1 * 0.3, q[1], r1, { sy: sy1 }, RK);
      addRock(rocks.big, q2[0], y2, q2[1], r2, { sy: sy2 }, RK);
      if (lip || Math.abs(d - fallLat) < FALL_W0 + 4) lips.push({ s: sL + (lip ? -0.9 : 0.9) - r2 * 0.72, d, y: y2 - r2 * 0.18, w: r2 * 0.8 });
    }
    for (let d = -15; d <= 15; d += RK.range(1.6, 2.4)) {                                   // the low step further up, where the water comes down in a small fall
      const q = route(sStep + 2 * noise.n2(d * 0.07, 8.1) + RK.range(-0.5, 0.5), d), r = RK.range(0.8, 1.5);
      if (Math.abs(d - streamOff(sStep)) < 3.6) continue;
      addRock(rocks.small, q[0], groundAt(q[0], q[1]) + 0.1, q[1], r, {}, RK);
    }
    // the boulder of the firs' stretch, capped with snow
    { const b = thing['capped boulder']; b.y = groundAt(b.at[0], b.at[1]) + b.r * 0.2; addRock(rocks.big, b.at[0], b.y, b.at[1], b.r, { sy: 0.8 }, ST['capped boulder']); }
    { const BS = ST['bank stones'];
      for (let s = 62; s < SS1 - 6; s += BS.range(4, 9)) {                                   // stones along the banks
        const sg = BS.sign(), d = streamOff(s) + sg * BS.range(4.6, 7.6), q = route(s, d), r = BS.range(0.45, 1.25), more = BS.chance(0.3);
        if (Math.abs(s - sLedge) < 6 || offTrack(q[0], q[1]) < 2.4 + r) continue;
        addRock(rocks.small, q[0], groundAt(q[0], q[1]) + r * 0.12, q[1], r, {}, BS);
        if (more) { const q3 = route(s + 1.3, d + sg * 1.2); addRock(rocks.small, q3[0], groundAt(q3[0], q3[1]) + 0.05, q3[1], r * 0.6, {}, BS); }
      } }
    { const BO = ST.boulders;
      for (let i = 0; i < 26; i++) {                                                         // a few great boulders out among the trees
        const q = route(BO.range(70, PL - 30), BO.sign() * BO.range(9.5, 34)), r = BO.range(1.4, 2.9);
        if (near(q[0], q[1], r * 0.9) || offTrack(q[0], q[1]) < 3 + r || streamDist(_f.s, _f.d) < 4 + r || Math.abs(groundAt(q[0], q[1]) - groundAt(q[0] + 2, q[1] + 2)) > 1.5) continue;
        addRock(rocks.big, q[0], groundAt(q[0], q[1]) + r * 0.15, q[1], r, {}, BO);
      } }
    { const SK = ST['stream stones'];
      for (let s = 66 + SK.range(0, 6); s < SS1 - 24; s += SK.range(5, 11)) {
        const d = streamOff(s) + SK.range(-1.9, 1.9), q = route(s, d), r = SK.range(0.34, 0.8); fieldAt(q[0], q[1], _f);
        const rec = { x: q[0], y: waterAt(s) - 0.12 + r * 0.1, z: q[1], s: r, sy: SK.range(0.55, 0.85), rot: SK.range(0, TAU), tiltX: SK.range(-0.06, 0.06), tiltZ: SK.range(-0.06, 0.06), thaw: thawAt(q[0], q[1]) + SK.range(-0.01, 0.02), snow: 1, kind: 2, ch: clamp(Math.floor(_f.s / 100), 0, 5), col: mul3([1, 1, 1], SK.range(0.75, 1.05)) };
        if (Math.abs(s - sLedge) < 9 || Math.abs(s - sStep) < 6 || s > sRise - 4) continue;
        rocks.small.push(rec);
      } }
    const rockMeshes = [];
    await ctx.yield();
    // the fallen trunk under its snow: a long bole, its root plate torn up at the end nearest the way, the stubs of broken boughs
    { const f = thing['fallen trunk'], FT = ST['fallen trunk'], g = new SGeo(), bark = lin('#4a382c'), barkD = lin('#2a1e18'), wood = lin('#8a6a48'), earth = lin('#3a2c24'), pts = [], rad = [];
      // the bole lies on the ground, 1.25 m thick at the root and 0.6 m at the top, its flanks dark under the snow along its back
      for (let i = 0; i <= 8; i++) { const t = i / 8, r = lerp(1.25, 0.6, t) * (1 + 0.35 * Math.exp(-t * 9)); pts.push([0.5 * Math.sin(t * 2.4), r * 0.82 + 0.2 * Math.sin(t * 5), t * f.len]); rad.push(r); }
      g.tube(pts, rad, 10, (t, k) => (k % 3 ? bark : barkD), { snow: 1 });
      // the root plate: a disc of frozen earth stood on edge, roots reaching out of it all round
      g.tube([[0, 1.3, 0.5], [0, 1.3, 0.1], [0, 1.3, -0.25]], [1.3, 1.9, 1.5], 9, (t, k) => (k % 2 ? earth : barkD), { snow: 0.8 });
      for (let i = 0; i < 7; i++) { const a = i / 7 * TAU + FT.range(-0.35, 0.35), r = FT.range(1.5, 3.2), b = a + FT.range(-0.5, 0.5); g.tube([[Math.cos(a) * 1.0, 1.3 + Math.sin(a) * 1.0, -0.1], [Math.cos(a) * r * 0.6, 1.3 + Math.sin(a) * r * 0.6, -0.4], [Math.cos(b) * r, 1.3 + Math.sin(b) * r, -0.7 + FT.range(-0.5, 0.5)]], [0.4, 0.24, 0.06], 5, () => barkD, { snow: 0.8 }); }
      // the stubs of its boughs, broken off on the upper side
      for (let i = 0; i < 6; i++) { const z = f.len * FT.range(0.3, 0.92), a = FT.range(0.5, 2.6), len = FT.range(1.6, 3.6); g.tube([[0, 1.0, z], [Math.cos(a) * len * 0.5, 1.0 + Math.sin(a) * len * 0.5, z + 0.3], [Math.cos(a) * len, 1.0 + Math.sin(a) * len * 0.9, z + 0.8]], [0.24, 0.15, 0.07], 5, (t) => (t > 0.9 ? wood : bark), { snow: 0.9 }); }
      const m = seasonInstances(g.build(), treeMat, [{ x: f.at[0], y: groundAt(f.at[0], f.at[1]) - 0.1, z: f.at[1], s: 1, rot: Math.atan2(f.dir[0], f.dir[1]), thaw: thawAt(f.at[0], f.at[1]), snow: 1, kind: 2 }]);
      m.userData.c0 = Math.floor(f.s / 100) * 100; m.userData.len = 100; m.userData.ahead = 400; scene.add(m); rockMeshes.push(m); }
    await ctx.yield();
    for (const [g, list] of [[rockBig, rocks.big], [rockSmall, rocks.small]]) for (let ch = 0; ch < 6; ch++) { const l = list.filter((r) => r.ch === ch); if (!l.length) continue; const m = seasonInstances(g, treeMat, l); m.userData.c0 = ch * 100; m.userData.len = 100; m.userData.ahead = 400; scene.add(m); rockMeshes.push(m); }
    await ctx.yield();

    // ------------------------------------------------------------ ice: the frozen fall at the ledge, a smaller one at the step that frees itself, icicles under every lip
    const ip = [], inn = [], ia = [], iac = [], ii = [], IF = ST['ice falls'], IC = ST.icicles; let ic = 0;
    const iceFall = (sTop, run, cLat, hw0, hw1, thawBias) => {
      const NU = 14, NV = 11, yTop = waterAt(sTop + 0.6) + 0.12, yBot = waterAt(sTop - run - 0.6) - 0.1, base = ic, ph = IF.range(0, 9);
      const tq = route(sTop, cLat), th = thawAt(tq[0], tq[1], 0) + thawBias;
      for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
        const u = i / NU * 2 - 1, v = j / NV, col = Math.pow(Math.abs(Math.sin(u * 5.1 + ph)), 0.6), fringe = (yTop - yBot) * 0.08 * Math.sin(u * 11 + ph * 2) * v * v;
        const bulge = (0.25 + 0.55 * col) * Math.sin(Math.PI * Math.min(1, v * 1.15)) * (0.6 + 0.4 * (1 - u * u)) + 0.5 * v;
        // its top edge reaches upstream over the stream's ice in ragged tongues, 0 to 2.6 m
        const rag = (1 - smoothstep(0, 0.2, v)) * (1.3 + 0.8 * Math.sin(u * 6.1 + ph) + 0.5 * Math.sin(u * 14.3 + ph * 2));
        const s = sTop + rag - run * (0.25 * v + 0.75 * Math.sqrt(v)) * 0.55 - bulge, q = route(s, cLat + u * lerp(hw0, hw1, v) * (1 + 0.06 * Math.sin(v * 9 + u * 3)));
        ip.push(q[0], lerp(yTop, yBot, Math.pow(v, 1.25)) + fringe, q[1]); inn.push(0, 0, 0); ia.push(v, th, 1); iac.push(u * lerp(hw0, hw1, v) + ph * 3); ic++;
      }
      for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = base + j * (NU + 1) + i, b = a + NU + 1; ii.push(a, a + 1, b, b, a + 1, b + 1); }
    };
    iceFall(ledgeLine(fallLat) + 1.6, 5.2, fallLat, FALL_W0, FALL_W1, 0.02);
    iceFall(sStep + 1.9, 3.4, streamOff(sStep), 3.3, 4.2, -0.01);
    const fallEnd = ic;
    const icicle = (x, y, z, len, r, th) => {
      const base = ic, n = 5;
      for (let k = 0; k < n; k++) { const a = k / n * TAU; ip.push(x + Math.cos(a) * r, y, z + Math.sin(a) * r); inn.push(Math.cos(a), 0.15, Math.sin(a)); ia.push(0, th, 0); iac.push(x * 0.8 + z * 0.6); ic++; }
      ip.push(x, y - len, z); inn.push(0, -1, 0); ia.push(1, th, 0); iac.push(x * 0.8 + z * 0.6); ic++;
      for (let k = 0; k < n; k++) ii.push(base + k, base + (k + 1) % n, base + n);
    };
    for (const l of lips) for (let k = 0, n = IC.int(4, 8); k < n; k++) { const q = route(l.s + IC.range(-0.25, 0.25), l.d + IC.range(-1, 1) * l.w); icicle(q[0], l.y + IC.range(-0.15, 0.1), q[1], IC.range(0.8, 3.2), IC.range(0.07, 0.17), thawAt(q[0], q[1], 0) + 0.03); }
    for (let k = 0; k < 44; k++) { const u = IC.range(-1, 1), q = route(ledgeLine(fallLat) + 0.1, fallLat + u * (FALL_W0 - 0.4)); icicle(q[0], waterAt(sLedge + 4) - 0.2 - Math.abs(u) * 0.3, q[1], IC.range(0.8, 2.6), IC.range(0.08, 0.2), thawAt(q[0], q[1], 0) + 0.03); }
    // icicles under the bulge of the capped boulder, on its side toward the way
    { const b = thing['capped boulder'], w = route(b.s, 0), a0 = Math.atan2(w[0] - b.at[0], w[1] - b.at[1]);
      for (let k = 0; k < 16; k++) { const a = a0 + IC.range(-1.2, 1.2), x = b.at[0] + Math.sin(a) * b.r, z = b.at[1] + Math.cos(a) * b.r; icicle(x, b.y + b.r * IC.range(-0.08, 0.08), z, IC.range(0.7, 2.0), IC.range(0.07, 0.15), thawAt(x, z) + 0.03); } }
    const iceG = new THREE.BufferGeometry();
    iceG.setAttribute('position', new THREE.Float32BufferAttribute(ip, 3)); iceG.setAttribute('normal', new THREE.Float32BufferAttribute(inn, 3)); iceG.setAttribute('aIce', new THREE.Float32BufferAttribute(ia, 3)); iceG.setAttribute('aAcross', new THREE.Float32BufferAttribute(iac, 1)); iceG.setIndex(ii);
    { const keep = Float32Array.from(inn); iceG.computeVertexNormals(); const nn = iceG.attributes.normal.array; for (let k = fallEnd * 3; k < nn.length; k++) nn[k] = keep[k]; }
    const ice = new THREE.Mesh(iceG, new THREE.ShaderMaterial({
      uniforms: waterU, fog: true, side: THREE.DoubleSide,
      vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec3 aIce; attribute float aAcross; uniform vec4 uSeason; varying vec3 vI; varying vec3 vWp; varying vec3 vN; varying float vAc;
        void main(){ vI = aIce; vAc = aAcross; vec3 p = position; float pp = (uSeason.x - aIce.y) * uSeason.y;
          if (aIce.z < .5) p.y += aIce.x * smoothstep(.1, .9, pp) * 3.;                     // an icicle draws back up into its root as it melts
          vec4 w = modelMatrix * vec4(p, 1.); vWp = w.xyz; vN = mat3(modelMatrix) * normal; vec4 mvPosition = viewMatrix * w; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
      fragmentShader: fx.GLSL_FOG_PARS_FRAG + LAMP_GLSL + GNOISE + /* glsl */`
        uniform vec4 uSeason; uniform vec3 uZenith, uHorizon, uAmb, uSunCol, uSunDir; varying vec3 vI; varying vec3 vWp; varying vec3 vN; varying float vAc;
        void main(){
          vec3 N = normalize(vN), V = normalize(cameraPosition - vWp); if (dot(N, V) < 0.) N = -N;
          float p = (uSeason.x - vI.y) * uSeason.y, t = uSeason.z, across = vAc, down = vWp.y - vI.x * 1.5 * vI.z;
          float st = gNoise(vec2(across * 3.2, vWp.y * .55)), f = 1. - clamp(dot(N, V), 0., 1.);
          vec3 base = mix(vec3(.42, .68, .92), vec3(.9, .97, 1.), st * .6 + f * .4);
          base += vec3(.5, .7, .9) * step(.93, gNoise(vec2(across * 21., vWp.y * 9.))) * .5;
          vec3 lampL = uLampPos[0] - vWp;
          vec3 col = base * (uAmb * 2.3 + uSunCol * (.25 + .5 * clamp(dot(N, uSunDir) * .5 + .5, 0., 1.)) + uLampCol[0] * lampFall(dot(lampL, lampL)) * .3);
          col += mix(uHorizon, uZenith, .5) * f * f * 1.3 + base * uAmb * .5 * (1. - f);
          float melt = smoothstep(.05, .85, p + (st - .5) * .5) * vI.z;
          float run = smoothstep(.3, .9, gNoise(vec2(across * 9., down * 1.6 + t * 5.5)) * .55 + gNoise(vec2(across * 21., down * 3.4 + t * 8.)) * .45);
          // falling water: pale, streaked down its length, white with foam where it lands
          vec3 wat = mix(mix(vec3(.5, .68, .8), vec3(.94, .98, 1.), run), vec3(1.), smoothstep(.7, 1., vI.x) * .85) * (uAmb * 1.3 + uSunCol * .55);
          gl_FragColor = vec4(fxApplyFog(mix(col, wat, melt)), 1.);
        }`,
    }));
    scene.add(ice);
    await ctx.yield();

    // ------------------------------------------------------------ the floor of the wood in spring: snowdrops, crocuses, celandines and grass, each waiting under the snow for its own moment
    const FLR = ST.flowers, smallMeshes = rockMeshes.slice(), SMALL_AHEAD = 84;
    const flowerGeo = (kind) => {
      const g = new SGeo(), R = ST['flower shapes'], stem = lin('#5a9434'), leafA = lin('#2f6a2c'), leafB = lin('#86bc4c'), W = [1, 1, 1];
      const LEAF = (t) => [0.03 * t, 0.25 * t, 1, 0], PET = (t) => [0.04 * t, 0.2, 2, 0];
      const blade = (x, z, a, len, w, lean) => { const dx = Math.cos(a), dz = Math.sin(a), n = [dx * 0.35, 0.9, dz * 0.35];
        g.tri(g.v([x + dz * w, 0, z - dx * w], n, leafA, leafA, LEAF(0)), g.v([x - dz * w, 0, z + dx * w], n, leafA, leafA, LEAF(0)), g.v([x + dx * lean, len, z + dz * lean], n, leafB, leafB, LEAF(1))); };
      // a petal as a kite from root to tip; bud: where the petal lies while the flower is shut
      const petal = (root, mid, tip, side, n, bud, c0 = W, c1 = W) => {
        const a = g.v(root, n, c0, c0, PET(0.6), undefined, bud(root)), b = g.v([mid[0] + side[0], mid[1], mid[2] + side[2]], n, c1, c1, PET(0.8), undefined, bud(mid)),
          c = g.v([mid[0] - side[0], mid[1], mid[2] - side[2]], n, c1, c1, PET(0.8), undefined, bud(mid)), d = g.v(tip, n, c1, c1, PET(1), undefined, bud(tip));
        g.tri(a, b, c); g.tri(b, d, c);
      };
      if (kind === 'snowdrop') {
        for (let i = 0; i < 3; i++) {
          const a = i / 3 * TAU + R.range(-0.4, 0.4), dx = Math.cos(a), dz = Math.sin(a), x0 = dx * 0.07, z0 = dz * 0.07, h = R.range(0.36, 0.5), w = 0.016, n = [dx * 0.3, 0.9, dz * 0.3];
          const top = [x0 + dx * 0.08, h, z0 + dz * 0.08], hang = [x0 + dx * 0.19, h - 0.05, z0 + dz * 0.19];
          const v0 = g.v([x0 + dz * w, 0, z0 - dx * w], n, stem), v1 = g.v([x0 - dz * w, 0, z0 + dx * w], n, stem), v2 = g.v([top[0] + dz * w, top[1], top[2] - dx * w], n, leafB, leafB, LEAF(1)), v3 = g.v([top[0] - dz * w, top[1], top[2] + dx * w], n, leafB, leafB, LEAF(1));
          const v4 = g.v([hang[0], hang[1], hang[2]], n, leafB, leafB, LEAF(1));
          g.tri(v0, v1, v2); g.tri(v1, v3, v2); g.tri(v2, v3, v4);
          const bud = (p) => [hang[0] + (p[0] - hang[0]) * 0.3, p[1], hang[2] + (p[2] - hang[2]) * 0.3];
          for (let k = 0; k < 3; k++) { const b = a + k / 3 * TAU + 0.5, ox = Math.cos(b), oz = Math.sin(b);
            petal(hang, [hang[0] + ox * 0.07, hang[1] - 0.1, hang[2] + oz * 0.07], [hang[0] + ox * 0.075, hang[1] - 0.2, hang[2] + oz * 0.075], [-oz * 0.05, 0, ox * 0.05], [ox * 0.6, 0.75, oz * 0.6], bud, [0.8, 1, 0.75], W); }
          blade(x0 * 0.4, z0 * 0.4, a + 2.2, R.range(0.24, 0.34), 0.022, 0.1);
        }
      } else if (kind === 'crocus') {
        for (let i = 0; i < 3; i++) {
          const a = i / 3 * TAU + R.range(-0.5, 0.5), r0 = i === 0 ? 0 : R.range(0.12, 0.2), cx = Math.cos(a) * r0, cz = Math.sin(a) * r0, h = R.range(0.2, 0.3) * (i === 0 ? 1.15 : 1), y0 = 0.05;
          const bud = (p) => [cx + (p[0] - cx) * 0.3, p[1], cz + (p[2] - cz) * 0.3];
          for (let k = 0; k < 5; k++) { const b = k / 5 * TAU + i, ox = Math.cos(b), oz = Math.sin(b);
            petal([cx, y0, cz], [cx + ox * 0.085, y0 + h * 0.55, cz + oz * 0.085], [cx + ox * 0.13, y0 + h, cz + oz * 0.13], [-oz * 0.06, 0, ox * 0.06], [ox * 0.5, 0.8, oz * 0.5], bud, [0.92, 0.92, 0.86], W); }
          const or = lin('#ff8a10'); g.tri(g.v([cx - 0.02, y0 + h * 0.3, cz], [0, 1, 0], or, or, [0, 0, 1, 0.4]), g.v([cx + 0.02, y0 + h * 0.3, cz], [0, 1, 0], or, or, [0, 0, 1, 0.4]), g.v([cx, y0 + h * 0.8, cz], [0, 1, 0], or, or, [0, 0, 1, 0.4]));
          blade(cx, cz, a + 1.3, R.range(0.2, 0.3), 0.014, 0.12); blade(cx, cz, a - 1.6, R.range(0.2, 0.3), 0.014, 0.12);
        }
      } else {
        const yel = lin('#f7d21e'), yel2 = lin('#ffe85a');
        for (let i = 0; i < 4; i++) {
          const a = i / 4 * TAU + R.range(-0.5, 0.5), r0 = i === 0 ? 0.03 : R.range(0.16, 0.3), cx = Math.cos(a) * r0, cz = Math.sin(a) * r0, y = R.range(0.1, 0.19), rr = R.range(0.095, 0.125), tl = R.range(-0.25, 0.25);
          const bud = (p) => [cx + (p[0] - cx) * 0.22, y + Math.hypot(p[0] - cx, p[2] - cz) * 0.9, cz + (p[2] - cz) * 0.22];
          const c = g.v([cx, y, cz], [0, 1, 0], lin('#e09a08'), undefined, PET(0.5));
          for (let k = 0; k < 6; k++) { const b = k / 6 * TAU, b1 = b + TAU / 12 * 0.8, b0 = b - TAU / 12 * 0.8, yy = (q) => y + 0.02 + tl * rr * Math.cos(q);
            const p1 = [cx + Math.cos(b0) * rr * 0.86, yy(b0), cz + Math.sin(b0) * rr * 0.86], p2 = [cx + Math.cos(b1) * rr * 0.86, yy(b1), cz + Math.sin(b1) * rr * 0.86], p3 = [cx + Math.cos(b) * rr * 1.1, yy(b), cz + Math.sin(b) * rr * 1.1];
            const v1 = g.v(p1, [0, 1, 0], yel, yel, PET(1), undefined, bud(p1)), v2 = g.v(p2, [0, 1, 0], yel, yel, PET(1), undefined, bud(p2)), v3 = g.v(p3, [0, 1, 0], yel2, yel2, PET(1), undefined, bud(p3));
            g.tri(c, v2, v1); g.tri(v1, v2, v3); }
          // a glossy heart-shaped leaf lying low
          const la = a + 2.4, lx = cx + Math.cos(la) * 0.13, lz = cz + Math.sin(la) * 0.13, lw = 0.085, ldx = Math.cos(la), ldz = Math.sin(la);
          const q0 = g.v([cx, 0.02, cz], [0, 1, 0], leafA, leafA, LEAF(0)), q1 = g.v([lx + ldz * lw, 0.06, lz - ldx * lw], [0, 1, 0], leafA, leafA, LEAF(1)), q2 = g.v([lx - ldz * lw, 0.06, lz + ldx * lw], [0, 1, 0], leafB, leafB, LEAF(1)), q3 = g.v([lx + ldx * 0.1, 0.04, lz + ldz * 0.1], [0, 1, 0], leafB, leafB, LEAF(1));
          g.tri(q0, q1, q2); g.tri(q1, q3, q2);
        }
      }
      return g.build();
    };
    const FG = {};
    for (const k of ['snowdrop', 'crocus', 'celandine']) { FG[k] = flowerGeo(k); await ctx.yield(); }
    const PETAL = { snowdrop: [[1, 1, 1]], crocus: [lin('#8a55d0'), lin('#f6b414'), lin('#f4f0ff'), lin('#6a3fb0')], celandine: [[1, 1, 1]] };
    const fBuckets = new Map(), flowerAt = (kind, x, z, sc, s, o = {}) => {
      const th = thawAt(x, z), k = kind + ':' + clamp(Math.floor(s / 50), 0, 12); let l = fBuckets.get(k); if (!l) fBuckets.set(k, l = { kind, ch: clamp(Math.floor(s / 50), 0, 12), list: [] });
      const pc = PETAL[kind], ci = kind === 'crocus' ? Math.floor(clamp(noise.n2(x * 0.11 + 40, z * 0.11) * 0.5 + 0.5 + FLR.range(-0.22, 0.22) + (flowerMix - 0.5) * 0.3, 0, 0.999) * 3.2) % 4 : 0;
      l.list.push({ x, y: groundAt(x, z) - 0.02, z, s: sc, sy: 1, rot: FLR.range(0, TAU), tiltX: FLR.range(-0.12, 0.12), tiltZ: FLR.range(-0.12, 0.12), thaw: th, snow: 0, kind: 3.25,
        delay: (kind === 'snowdrop' ? 0.28 : kind === 'crocus' ? 0.52 : 0.78) + FLR.range(-0.05, 0.12) + (o.delay || 0), petal: pc[ci], col: mul3([1, 1, 1], FLR.range(0.85, 1.1)) });
    };
    // flowers and grass are scattered from the nearest place the thaw line can lie, onward. Flowers stand in drifts, each drift of one kind: the kind is read from one slow field
    // (snowdrops where it is low, celandines where it is high and only in the glade, crocuses between)
    const S_FL0 = sFoot - footLen / 2, nFl = Math.round(6600 * dens * (0.6 + 0.4 * detail));
    for (let i = 0; i < nFl; i++) {
      const s0 = FLR.range(S_FL0, PL + 22), lat = (1.2 + 17 * Math.pow(FLR(), 1.5)) * FLR.sign(), q = route(s0, lat), acc = FLR(), pick = FLR(), sc = FLR.range(0.9, 1.5);
      fieldAt(q[0], q[1], _f); const s = _f.s, d = _f.d;
      if (streamDist(s, d) < 5.2 || Math.abs(s - sLedge) < 4 || (s > PL - 1 && Math.abs(d) < 8)) continue;
      if (i % 500 === 499) await ctx.yield();
      const glade = smoothstep(GLADE0, GLADE1, s), drift = smoothstep(0.38, 0.62, noise.n2(q[0] * 0.075 + 11, q[1] * 0.075) * 0.5 + 0.5 + glade * 0.08 + 0.1 * noise.n2(q[0] * 0.3, q[1] * 0.3));
      if (acc > drift * lerp(0.85, 1, glade)) continue;
      const kk = kindField(q[0], q[1]) + (pick - 0.5) * 0.12;
      const kind = kk > lerp(1.1, 0.42, glade) ? 'celandine' : kk < lerp(0.47, 0.22, glade) ? 'snowdrop' : 'crocus';
      flowerAt(kind, q[0], q[1], sc * (kind === 'celandine' ? 1.25 : 1.15), s);
    }
    await ctx.yield();
    for (const b of fBuckets.values()) { const m = seasonInstances(FG[b.kind], treeMat, b.list); m.userData.c0 = b.ch * 50; m.userData.ahead = SMALL_AHEAD; scene.add(m); smallMeshes.push(m); if (smallMeshes.length % 4 === 0) await ctx.yield(); }
    await ctx.yield();
    {
      const CU = ST.currant, cg = seasonize(flora.bushGeometry({ rng: ST['currant shape'], size: 1.7, detail: 0, flowers: 1, flowerColor: '#d8457a', leaf: '#4f9a3a', leafLight: '#a6d85e', leafDark: '#2a6426' }), { pivot: 'base', woodSnow: 0.5 });
      await ctx.yield();
      const cB = new Map();
      for (const sg of [-1, 1]) for (let s = sRim + CU.range(8, 28); s < PL + 4; s += CU.range(7, 19)) {
        const n = CU.int(2, 4), lat0 = sg * (Math.max(8.5, s > GLADE0 ? clearW(s) + 1.5 : 0) + CU.range(0, 9));
        for (let k = 0; k < n; k++) { const q = route(s + CU.range(-2.2, 2.2), lat0 + CU.range(-2.2, 2.2)), sc = CU.range(0.8, 1.35), rot = CU.range(0, TAU), br = CU.range(0.85, 1.1), dl = CU.range(0, 0.2);
          fieldAt(q[0], q[1], _f); if (streamDist(_f.s, _f.d) < 6.5 || (_f.s > PL - 2 && Math.abs(_f.d) < 13) || trackOff(_f.s, _f.d) < 4) continue;
          const ch = clamp(Math.floor(_f.s / 100), 0, 5); let l = cB.get(ch); if (!l) cB.set(ch, l = []);
          l.push({ x: q[0], y: groundSD(q[0], q[1], _f.s, _f.d) - 0.12, z: q[1], s: sc, sy: 1, rot, thaw: thawSD(q[0], q[1], _f.s, _f.d), delay: 0.5 + dl, snow: 0.6, kind: 1, col: [br, br, br] }); }
      }
      for (const [ch, l] of cB) { const m = seasonInstances(cg, treeMat, l); m.userData.c0 = ch * 100; m.userData.len = 100; m.userData.ahead = 170; scene.add(m); smallMeshes.push(m); }
    }
    await ctx.yield();
    {
      const GRS = ST.grass, tuft = [0, 1].map((k) => seasonize(flora.grassTuftGeometry({ rng: ST['tuft shape'], cards: 2 + k, width: 1.2, height: 0.7 + k * 0.2, root: '#2f5c1c', tip: '#9fca4a' }), { pivot: 'base', woodSnow: 0, leafSnow: 0 }));
      const gB = new Map(), nG = Math.round(9000 * dens * (0.5 + 0.5 * detail));
      for (let i = 0; i < nG; i++) {
        if (i % 1500 === 1499) await ctx.yield();
        const s0 = GRS.range(S_FL0, PL + 30), lat = (0.5 + 23 * Math.pow(GRS(), 1.3)) * GRS.sign(), q = route(s0, lat), acc = GRS(), v = GRS() < 0.3 ? 1 : 0, sc = GRS.range(0.7, 1.5), br = GRS.range(0.75, 1.15);
        fieldAt(q[0], q[1], _f); const s = _f.s, d = _f.d;
        if (streamDist(s, d) < 4.6 || Math.abs(s - sLedge) < 3) continue;
        if (acc > 0.35 + 0.65 * smoothstep(0.3, 0.7, noise.n2(q[0] * 0.06 + 3, q[1] * 0.06 + 50) * 0.5 + 0.5)) continue;
        const ch = clamp(Math.floor(s / 50), 0, 12), k = v + ':' + ch; let l = gB.get(k); if (!l) gB.set(k, l = { v, ch, list: [] });
        l.list.push({ x: q[0], y: groundSD(q[0], q[1], s, d) - 0.03, z: q[1], s: sc, sy: GRS.range(0.8, 1.3), rot: GRS.range(0, TAU), thaw: thawSD(q[0], q[1], s, d), delay: 0.3 + GRS.range(0, 0.25), snow: 0, kind: 1.25, col: [br * 0.9, br, br * 0.8] });
      }
      await ctx.yield();
      for (const b of gB.values()) { const m = seasonInstances(tuft[b.v], treeMat, b.list); m.userData.c0 = b.ch * 50; m.userData.ahead = SMALL_AHEAD; scene.add(m); smallMeshes.push(m); if (smallMeshes.length % 4 === 0) await ctx.yield(); }
    }
    await ctx.yield();

    // ------------------------------------------------------------ the team that meets us: two white reindeer abreast and a low dark sledge, coming the other way down the hollow on a track of its own
    const lightW = { sunDir: skyW.lightDirection.clone(), sunColor: new THREE.Color(WINTER.lightColor).multiplyScalar(WINTER.lightIntensity), sky: new THREE.Color(WINTER.ambientColor).multiplyScalar(WINTER.ambientIntensity * 1.15), ground: new THREE.Color('#6276b4') };
    const lightS = { sunDir: sunDir.clone(), sunColor: new THREE.Color('#ffe9c0').multiplyScalar(3.1), sky: new THREE.Color('#a6c6ff').multiplyScalar(1.35), ground: new THREE.Color('#6a8a4a').multiplyScalar(0.9) };
    const faunaW = F.makeFauna(scene, { light: lightW }), faunaS = F.makeFauna(scene, { light: lightS });
    // a reindeer's height at the shoulder (a large bull's, a little over life); half the distance between the two; how far ahead of the sledge's middle they run
    const RH = 1.5, TEAM_W = 0.88, DB = 4.2;
    // they run on the ice where the ground is the stream's, not on its bed
    const walkAt = (x, z) => { fieldAt(x, z, _f); const s = _f.s, d = _f.d, h = groundSD(x, z, s, d); return streamDist(s, d) < 5.2 ? Math.max(h, waterAt(s) + 0.02) : h; };
    // the track's middle line, a point every 2 m of the route from its start in the dell to its end in the firs
    const trackPts = []; for (let s = sTrack0; s > sTrack1 - 1; s -= 2) { const q = route(s, sledSide * laneAt(s)); trackPts.push(new THREE.Vector3(q[0], 0, q[1])); }
    const trackCurve = new THREE.CatmullRomCurve3(trackPts, false, 'centripetal'), TRACK_L = trackCurve.getLength();
    // metres the team has run along its track when we have flown camS metres: it stands at its start (the sledge's tail a metre inside the track) until we pass the first lamp-post,
    // then runs PACE metres for each metre we fly, to its track's end
    const teamRun = (camS) => clamp(DB + 3.3 + PACE * Math.max(0, camS - sLamp), 0, TRACK_L);
    const reindeer = F.makeHerd({ rng: ST.reindeer, preset: { ...F.HERD_PRESETS.deer, neck: [0.17, 0.105], leg: [0.07, 0.046, 0.03], headR: 0.095, antlers: 0.9 }, count: 2, sizes: [1], size: RH, mode: 'migrate', gait: 'run',
      route: trackPts, closed: false, spread: [0, 0], heightAt: walkAt,
      glow: '#eef2ff', glowIntensity: 0.3, coat: '#f7f8fc', belly: '#ffffff', legs: '#e8ebf4', sock: '#ffffff', accent: '#ffffff', rump: '#ffffff', horn: '#f0a812', hoof: '#33333a', varieties: 1, pattern: 'none', fill: 0.55, shadowOpacity: 0.7 });
    // abreast: each reindeer's own line lies TEAM_W to one side of the track's middle line, square to it
    { const tex = reindeer.uniforms.uTracks.value, data = tex.image.data, W = tex.image.width, tan = new THREE.Vector3();
      for (let i = 0; i < 2; i++) for (let j = 0; j < W; j++) { trackCurve.getPointAt(j / (W - 1), _p); trackCurve.getTangentAt(j / (W - 1), tan);
        const off = (i ? 1 : -1) * TEAM_W, x = _p.x - tan.z * off, z = _p.z + tan.x * off, k = (i * W + j) * 4; data[k] = x; data[k + 1] = walkAt(x, z); data[k + 2] = z; }
      tex.needsUpdate = true; }
    faunaW.add(reindeer, { always: true });
    await ctx.yield();
    const sledge = new THREE.Group(), harn = new THREE.Group(); harn.position.z = DB; sledge.add(harn); sledge.rotation.order = 'YXZ';
    {
      // the sledge: low, plain dark timber on iron-shod runners, a bench, a shapeless heap of white furs; no driver, nothing upright
      const g = new SGeo(), tim = lin('#3d2b1c'), timD = lin('#1f1610'), timL = lin('#63492f'), iron = lin('#24262b'), furs = [lin('#f0efea'), lin('#d6d2c8'), lin('#a9a7ac')];
      const face = (n, a, b, c, d, col) => g.quad(g.v(a, n, col), g.v(b, n, col), g.v(c, n, col), g.v(d, n, col));
      const box = (x0, x1, y0, y1, z0, z1, c, ct = c) => {
        face([0, 1, 0], [x0, y1, z0], [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], ct); face([0, -1, 0], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], c);
        face([-1, 0.2, 0], [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], c); face([1, 0.2, 0], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1], c);
        face([0, 0.2, -1], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], [x1, y0, z0], c); face([0, 0.2, 1], [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], c);
      };
      for (const sx of [-1, 1]) {
        const pts = [], rad = [];
        for (let i = 0; i <= 11; i++) { const z = lerp(-2.3, 2.9, i / 11), k = clamp((z - 1.9) / 1.0, 0, 1); pts.push([sx * 0.75, 0.06 + 0.85 * k * k, z - 0.35 * k * k * k]); rad.push(i === 11 ? 0.03 : 0.065); }
        g.tube(pts, rad, 4, () => iron, { snow: 0 });
        for (const z of [-1.6, -0.3, 1.1]) g.tube([[sx * 0.75, 0.06, z], [sx * 0.72, 0.52, z]], [0.05, 0.05], 4, () => timD, { snow: 0, cap: false });
        box(sx * 0.82 - 0.05, sx * 0.82 + 0.05, 0.6, 0.94, -2.0, 1.7, tim, timL);
      }
      box(-0.82, 0.82, 0.48, 0.6, -2.0, 1.9, timD, tim);
      box(-0.86, 0.86, 0.6, 1.08, -2.1, -2.0, tim, timL); box(-0.8, 0.8, 0.6, 0.9, 1.8, 1.9, tim, timL);
      box(-0.78, 0.78, 0.6, 0.98, -0.55, 0.25, timD, tim);
      const heap = (cx, cy, cz, rx, ry, rz, ph) => { const rows = [];
        for (let j = 0; j <= 4; j++) { const th = j / 4 * Math.PI * 0.56, row = []; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU, x = Math.sin(th) * Math.cos(a), y = Math.cos(th), z = Math.sin(th) * Math.sin(a), k = 1 + 0.16 * Math.sin(i * 2.3 + j * 1.7 + ph);
          row.push(g.v([cx + x * rx * k, cy + (y - 0.12) * ry * k, cz + z * rz * k], [x, y, z], furs[(i * 3 + j + Math.floor(ph)) % 3])); } rows.push(row); }
        for (let j = 0; j < 4; j++) for (let i = 0; i < 8; i++) g.quad(rows[j][i], rows[j][(i + 1) % 8], rows[j + 1][(i + 1) % 8], rows[j + 1][i]); };
      heap(0.05, 1.0, -0.2, 0.74, 0.3, 0.8, 0.4); heap(-0.22, 0.84, -1.25, 0.6, 0.34, 0.66, 2.1); heap(0.28, 0.96, 0.75, 0.5, 0.24, 0.6, 4.3); heap(0.8, 0.9, -0.7, 0.2, 0.24, 0.55, 5.7);
      g.tube([[0, 0.56, 1.9], [0, 0.66 * RH, DB * 0.55], [0, 0.72 * RH, DB + 0.45 * RH]], [0.05, 0.045, 0.04], 4, () => tim, { snow: 0 });
      const sm = seasonInstances(g.build(), treeMat, [{ x: 0, y: 0, z: 0, s: 1, thaw: 9, snow: 0, kind: 2 }]); sm.frustumCulled = false; sledge.add(sm);
    }
    await ctx.yield();
    {
      // the harness: scarlet leather on each of them (collar, girth, back strap, breast straps, traces back to the sledge), hung with gold bells
      const h = new SGeo(), red = lin('#e0141c'), redD = lin('#a00c14'), gold = lin('#f6c244'), H = RH, bp = [], bc = [];
      const bell = (x, y, z, r = 0.05 * H) => { h.tube([[x, y + r, z], [x, y, z], [x, y - r, z]], [0.004, r, 0.004], 5, () => gold, { snow: 0, cap: false }); };
      for (const sg of [-1, 1]) {
        const X = sg * TEAM_W, girth = [], collar = [];
        for (let i = 0; i <= 10; i++) { const a = i / 10 * TAU; girth.push([X + Math.cos(a) * 0.185 * H, 0.81 * H + Math.sin(a) * 0.25 * H, 0.12 * H]); collar.push([X + Math.cos(a) * 0.15 * H, 0.97 * H - Math.sin(a) * 0.469 * 0.18 * H, 0.57 * H + Math.sin(a) * 0.883 * 0.18 * H]); }
        h.tube(girth, girth.map(() => 0.045 * H), 4, (t, k) => (k % 2 ? red : redD), { snow: 0, cap: false });
        h.tube(collar, collar.map(() => 0.05 * H), 4, (t, k) => (k % 2 ? red : redD), { snow: 0, cap: false });
        h.tube([[X, 1.05 * H, 0.5 * H], [X, 1.075 * H, 0.3 * H], [X, 1.075 * H, 0.12 * H], [X, 1.06 * H, -0.2 * H], [X, 1.03 * H, -0.46 * H]], [0.03 * H, 0.03 * H, 0.03 * H, 0.03 * H, 0.03 * H], 4, () => red, { snow: 0, cap: false });
        for (const so of [-1, 1]) {
          h.tube([[X + so * 0.15 * H, 0.95 * H, 0.57 * H], [X + so * 0.19 * H, 0.84 * H, 0.14 * H]], [0.026 * H, 0.026 * H], 4, () => red, { snow: 0, cap: false });
          const ex = Math.sign(X) * (so * sg > 0 ? 0.74 : 0.3), tr = [[X + so * 0.19 * H, 0.8 * H, 0.1 * H], [lerp(X + so * 0.19 * H, ex, 0.5), 0.62 * H, (0.1 * H - DB + 1.9) * 0.5], [ex, 0.78, -DB + 1.9]];
          h.tube(tr, [0.022 * H, 0.022 * H, 0.022 * H], 4, () => red, { snow: 0, cap: false });
          for (const f of [0.3, 0.62]) { const q = [lerp(tr[0][0], tr[2][0], f), lerp(lerp(tr[0][1], tr[1][1], f), lerp(tr[1][1], tr[2][1], f), f) - 0.07, lerp(tr[0][2], tr[2][2], f)]; bell(q[0], q[1], q[2], 0.045 * H); bp.push([q[0], q[1], q[2] + DB]); bc.push('#ffd88a'); }
          bell(X + so * 0.2 * H, 0.74 * H, 0.12 * H); bp.push([X + so * 0.22 * H, 0.74 * H, 0.12 * H + DB]); bc.push('#fff0c0');
          // where the gilded antlers catch the light
          bp.push([X + so * 0.32 * H, 2.1 * H, 0.82 * H + DB], [X + so * 0.2 * H, 1.75 * H, 0.8 * H + DB]); bc.push('#ffcf5a', '#ffe9a0');
        }
        bell(X, 0.8 * H, 0.66 * H, 0.06 * H); bp.push([X, 0.8 * H, 0.68 * H + DB]); bc.push('#ffd88a');
      }
      const hm = seasonInstances(h.build(), treeMat, [{ x: 0, y: 0, z: 0, s: 1, thaw: 9, snow: 0, kind: 2 }]); hm.frustumCulled = false; harn.add(hm);
      // the bells' glints twinkle each on its own phase, dealt from the bells' stream
      const bells = fx.makeGlows({ rng: ST.bells, time: tU, positions: bp, colors: bc, size: 0.34, intensity: 2.4, flicker: 1, halo: 0.25 }); sledge.add(bells.object);
    }
    await ctx.yield();
    // the snow the runners and the hooves throw up, and the reindeer's breath in the cold
    const sprayU = { uTime: tU, uGo: { value: 0 }, uTint: { value: new THREE.Color(0.8, 0.86, 1) }, ...fx.fogUniforms() };
    {
      const NS2 = 84, sp = new Float32Array(NS2 * 4 * 3), sc = new Float32Array(NS2 * 4 * 2), si = [], SR = ST.spray;
      for (let i = 0; i < NS2; i++) { const r = [SR(), SR(), SR()]; for (let k = 0; k < 4; k++) { sp.set(r, (i * 4 + k) * 3); sc.set([k % 2 ? 1 : -1, k > 1 ? 1 : -1], (i * 4 + k) * 2); } si.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(sp, 3)); g.setAttribute('aCorner', new THREE.BufferAttribute(sc, 2)); g.setIndex(si);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: sprayU, fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec2 aCorner; uniform float uTime, uGo; varying vec2 vC; varying float vA;
          void main(){ float ph = fract(uTime * (.8 + position.y * .6) + position.x * 7.3), team = step(.45, position.z), breath = step(.8, position.z), r1 = fract(position.z * 9.1), r2 = fract(position.z * 5.7);
            // behind the runners; under the hooves; from the two muzzles
            vec3 p = vec3((position.x - .5) * mix(1.9, 2.6, team), .2 + ph * (.5 + position.y * mix(1.5, .8, team)), mix(-1.6 - r1 * 1.6, ${(DB - 1.0).toFixed(2)} + r2 * 2.2, team) - ph * mix(4.5, 2.5, team));
            vec3 pb = vec3((step(.5, r1) * 2. - 1.) * ${TEAM_W.toFixed(2)} + (position.x - .5) * .3, ${(1.2 * RH).toFixed(2)} + ph * (.3 + position.y * .5), ${(DB + 0.98 * RH).toFixed(2)} - ph * (1.2 + r2));
            p = mix(p, pb, breath);
            vec4 mvPosition = modelViewMatrix * vec4(p, 1.); mvPosition.xy += aCorner * mix(.14 + ph * mix(.55, .34, team), .1 + ph * .5, breath);
            gl_Position = projectionMatrix * mvPosition; vC = aCorner; vA = (1. - ph) * smoothstep(0., .12, ph) * mix(.3 * uGo, .2, breath); ${fx.GLSL_FOG_VERT} }`,
        fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`uniform vec3 uTint; varying vec2 vC; varying float vA;
          void main(){ float a = vA * (1. - smoothstep(.1, 1., dot(vC, vC))); if (a < .004) discard; gl_FragColor = vec4(fxFogPremult(uTint * a, a), a); }` }));
      m.frustumCulled = false; m.renderOrder = 3; sledge.add(m);
    }
    scene.add(sledge);
    // where the reindeer are when we have flown u of the way: the gaze's second pull (worked out from u alone, here, each time it is asked)
    const _s1 = new THREE.Vector3(), _s2 = new THREE.Vector3(), teamEye = new THREE.Vector3();
    const teamAt = (u) => { trackCurve.getPointAt(clamp(teamRun(u * PL) / TRACK_L, 0, 1), teamEye); teamEye.y = walkAt(teamEye.x, teamEye.z) + 1.2; return teamEye; };
    await ctx.yield();
    // ------------------------------------------------------------ the robin: one bird, a little way ahead all the way, bough to bough, waiting to be followed
    const robinU = { uWing: { value: new THREE.Vector2(0, 0) }, uLampPos: S.uLampPos, uLampCol: S.uLampCol };
    const robin = (() => {
      const P = [], N = [], C = [], W = [], Fd = [], I = []; let n = 0;
      const brown = lin('#7a6240'), red = lin('#dc4a14'), cream = lin('#ece6d6'), dark = lin('#191512'), Y0 = 0.46;
      const v = (p, nr, c, wing = 0, fold = p) => { P.push(p[0], p[1] + Y0, p[2]); N.push(nr[0], nr[1], nr[2]); C.push(c[0], c[1], c[2]); W.push(wing); Fd.push(fold[0], fold[1] + Y0, fold[2]); return n++; };
      const ball = (c, r, nu, nv, colOf) => { const b = n;
        for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) { const th = j / nv * Math.PI, ph = i / nu * TAU, x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph); v([c[0] + x * r[0], c[1] + y * r[1], c[2] + z * r[2]], [x, y, z], colOf(x, y, z)); }
        for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = b + j * (nu + 1) + i, d = a + nu + 1; I.push(a, a + 1, d, d, a + 1, d + 1); } };
      ball([0, 0, 0], [0.27, 0.27, 0.42], 10, 7, (x, y, z) => { const r = smoothstep(-0.05, 0.3, z) * smoothstep(0.62, 0.25, y), c = smoothstep(-0.05, -0.45, y) * (1 - r); return mix3(mix3(brown, cream, c), red, r); });
      ball([0, 0.2, 0.33], [0.19, 0.19, 0.2], 8, 6, (x, y, z) => mix3(brown, red, smoothstep(0.0, 0.35, z) * smoothstep(0.5, 0.1, y)));
      for (const sx of [-1, 1]) ball([sx * 0.125, 0.26, 0.43], [0.035, 0.035, 0.035], 4, 3, () => dark);
      { const b = n; for (let i = 0; i < 5; i++) { const a = i / 5 * TAU; v([Math.cos(a) * 0.045, 0.19 + Math.sin(a) * 0.04, 0.5], [Math.cos(a), Math.sin(a), 0.3], dark); } const t = v([0, 0.18, 0.68], [0, 0, 1], dark); for (let i = 0; i < 5; i++) I.push(b + i, b + (i + 1) % 5, t); }
      { const a = v([-0.06, 0.03, -0.32], [0, 1, 0], brown), b = v([0.06, 0.03, -0.32], [0, 1, 0], brown), c = v([0.14, 0.12, -0.9], [0, 1, 0], mul3(brown, 0.6)), d = v([-0.14, 0.12, -0.9], [0, 1, 0], mul3(brown, 0.6)); I.push(a, b, c, a, c, d); }
      for (const sx of [-1, 1]) {
        const wc = mul3(brown, 0.85), wd = mul3(brown, 0.55), up = [0, 1, 0];
        const a = v([sx * 0.2, 0.1, 0.24], up, wc, sx * 0.02, [sx * 0.27, 0.06, 0.2]), b = v([sx * 0.2, 0.08, -0.2], up, wc, sx * 0.02, [sx * 0.26, 0.0, -0.18]);
        const c = v([sx * 0.62, 0.13, 0.22], up, wc, sx * 0.5, [sx * 0.3, 0.02, 0.0]), d = v([sx * 0.64, 0.1, -0.24], up, wd, sx * 0.5, [sx * 0.21, -0.03, -0.42]), e = v([sx * 1.02, 0.13, -0.06], up, wd, sx, [sx * 0.14, 0.02, -0.62]);
        I.push(a, c, b, b, c, d, c, e, d);
        const l0 = v([sx * 0.08 - 0.02, -0.22, 0.02], [0, 0, 1], dark), l1 = v([sx * 0.08 + 0.02, -0.22, 0.02], [0, 0, 1], dark), l2 = v([sx * 0.09, -0.46, 0.05], [0, 0, 1], dark), l3 = v([sx * 0.09 - 0.05, -0.46, 0.14], [0, 0, 1], dark), l4 = v([sx * 0.09 + 0.05, -0.46, 0.14], [0, 0, 1], dark);
        I.push(l0, l1, l2, l2, l3, l4);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('aWing', new THREE.Float32BufferAttribute(W, 1)); g.setAttribute('aFold', new THREE.Float32BufferAttribute(Fd, 3)); g.setIndex(I);
      const m = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
      m.onBeforeCompile = (sh) => {
        Object.assign(sh.uniforms, robinU);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aWing; attribute vec3 aFold; uniform vec2 uWing;')
          .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
            if (abs(aWing) > 0.001) { float sg = sign(aWing), an = uWing.y * sg * smoothstep(0.0, 0.3, abs(aWing)); vec2 sh0 = vec2(sg * 0.2, 0.1 + ${Y0.toFixed(2)}), r = transformed.xy - sh0;
              r = vec2(cos(an) * r.x - sin(an) * r.y, sin(an) * r.x + cos(an) * r.y); transformed = mix(aFold, vec3(r + sh0, transformed.z), uWing.x); }`);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + LAMP_GLSL).replace('#include <lights_fragment_end>', /* glsl */`#include <lights_fragment_end>
            { vec3 sL = (viewMatrix * vec4(uLampPos[0], 1.0)).xyz + vViewPosition; float sD2 = dot(sL, sL);
              reflectedLight.directDiffuse += diffuseColor.rgb * uLampCol[0] * (lampFall(sD2) * RECIPROCAL_PI * (0.4 + 0.6 * clamp(dot(normal, sL * inversesqrt(max(sD2, 1e-4))), 0.0, 1.0))); }
            totalEmissiveRadiance += diffuseColor.rgb * vec3(0.22, 0.17, 0.17);`);
      };
      m.customProgramCacheKey = () => 'wbc-robin';
      const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; mesh.scale.setScalar(0.92);
      return mesh;
    })();
    scene.add(robin);
    // its perches, by rule: one every RB_GAP metres along the way from just beyond the wardrobe's mouth, in the tree that stands nearest the way there, sides in turn (in the glade: in the
    // blossom at the clearing's edge); it lands on the side of the tree it comes to (the side toward its last perch) and, perched, looks back the way it came. The lamp-posts' bars are perches too
    const RBR = ST.robin, RB_GAP = 24, RB_S0 = WARDROBE_DEPTH + RBR.range(0.25, 1.25) * RB_GAP, RB_TAKE = 9.5, RB_FLY = 10, perches = [], PR = ST['robin perches'], rbP = [RBR.range(0, TAU), RBR.range(0, TAU), RBR.range(0, TAU), RBR.range(0, TAU)];
    const barEnd = (lamp, xz, y) => { const ry = lamp.object.rotation.y, sg = PR.sign(); return { x: xz[0] + Math.cos(ry) * 0.86 * sg, y: y + 4.86 + (lamp === hero.lamp ? 0.1 : 0), z: xz[1] - Math.sin(ry) * 0.86 * sg, thaw: 9, snowy: lamp === hero.lamp ? 1 : 0 }; };
    for (let k = 0, s = RB_S0; s < PL - 6; k++, s += RB_GAP) {
      const sg = (k % 2 ? 1 : -1) * (PR.chance(0.2) ? -1 : 1), reach = s > GLADE0 ? clearW(s) + 9 : 12, hfF = PR.range(0.24, 0.36), hfL = PR.range(0.4, 0.5); let best = null, bs = 1e9;
      for (const t of trees) { const ds = Math.abs(t.sp - s), al = Math.abs(t.lat); if (ds > 12 || al > reach || t.beyond || t.lean || t.young || t.great || t.tall) continue; const sc = ds * 0.7 + al + (Math.sign(t.lat) === sg ? 0 : 7) + (t.kind === 'fir' ? 0 : 5) + (t.H < 7 ? 6 : 0); if (sc < bs) { bs = sc; best = t; } }
      if (Math.abs(s - sLamp) < RB_GAP / 2) { perches.push(barEnd(hero.lamp, lampXZ, lampY)); continue; }
      const last = perches.length ? perches[perches.length - 1] : { x: 0, z: 0 };
      if (!best) { const q = route(s, (trackOff(s, sg * 3.1) >= trackOff(s, -sg * 3.1) ? sg : -sg) * 3.1); perches.push({ x: q[0], y: groundAt(q[0], q[1]) + 0.02, z: q[1], thaw: thawAt(q[0], q[1]), snowy: 0 }); continue; }
      const dx = last.x - best.x, dz = last.z - best.z, dl = Math.hypot(dx, dz) || 1, fir = best.kind === 'fir' || best.kind === 'larch', bloom = best.kind === 'hawthorn' || best.kind === 'laburnum', hf = fir ? hfF : bloom ? hfL + 0.12 : hfL;
      const rr = fir ? best.R * Math.pow(1 - hf, 0.9) * 0.74 : bloom ? best.R * 0.8 : 0.9;
      perches.push({ x: best.x + dx / dl * rr, y: best.y + best.H * hf + (fir ? 0.12 : 0), z: best.z + dz / dl * rr, thaw: best.thaw, snowy: fir ? 1 : 0.6 });
    }
    perches.push(barEnd(lamp2, lamp2XZ, lamp2Y));
    // the little fall of snow it shakes down where it lands
    const puffU = { uPuff: { value: new THREE.Vector4(0, -99, 0, 0) }, uAmt: { value: 0 }, uTint: { value: new THREE.Color(0.8, 0.86, 1) }, ...fx.fogUniforms() };
    {
      const NP = 30, pp = new Float32Array(NP * 4 * 3), pc = new Float32Array(NP * 4 * 2), pi = [];
      for (let i = 0, PF = ST['robin puff']; i < NP; i++) { const r = [PF(), PF(), PF()]; for (let k = 0; k < 4; k++) { pp.set(r, (i * 4 + k) * 3); pc.set([k % 2 ? 1 : -1, k > 1 ? 1 : -1], (i * 4 + k) * 2); } pi.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3); }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pp, 3)); g.setAttribute('aCorner', new THREE.BufferAttribute(pc, 2)); g.setIndex(pi);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: puffU, fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec2 aCorner; uniform vec4 uPuff; uniform float uAmt; varying vec2 vC; varying float vA;
          void main(){ float age = uPuff.w, life = .8 + position.x * .9, k = clamp(age / life, 0., 1.);
            vec3 p = uPuff.xyz + (position - vec3(.5, .3, .5)) * vec3(1.3, .5, 1.3) + vec3((position.z - .5) * .7, -.5 - 2.2 * age * (.5 + position.y), (position.x - .5) * .7) * age;
            vec4 mvPosition = viewMatrix * vec4(p, 1.); mvPosition.xy += aCorner * (.05 + .12 * position.y) * (1. + 1.4 * k);
            gl_Position = projectionMatrix * mvPosition; vC = aCorner; vA = uAmt * step(0.001, age) * (1. - k) * smoothstep(0., .08, age) * .5 * smoothstep(2., 6., -mvPosition.z); ${fx.GLSL_FOG_VERT} }`,
        fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`uniform vec3 uTint; varying vec2 vC; varying float vA;
          void main(){ float a = vA * (1. - smoothstep(.1, 1., dot(vC, vC))); if (a < .004) discard; gl_FragColor = vec4(fxFogPremult(uTint * a, a), a); }` }));
      m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
    }
    const _rb = new THREE.Vector3();
    await ctx.yield();

    // ------------------------------------------------------------ the thaw in the air: mist that goes from white to gold and clears, shafts of sun, snow sliding from the firs
    // mist stands from the nearest place the thaw line can lie to the rise behind the ring
    const MI = ST.mist, mistPos = [];
    for (let i = 0; i < 84; i++) { const q = route(MI.range(S_FL0, PL + RISE_L), MI.range(-62, 62)); mistPos.push([q[0], groundAt(q[0], q[1]) + MI.range(1.2, 5.5), q[1]]); }
    const mist = fx.makeMist({ rng: ST['mist shapes'], positions: mistPos, size: [20, 44], color: '#eef2ff', opacity: 0, flatten: 0.36, sunDir, time: tU });
    scene.add(mist.object);
    await ctx.yield();
    // Sun shafts. They are planted from the ledge's rim on, one sheaf every 40 to 70 m, sides in turn, each 1.5 to 8 m inside the trees from the edge of the lane the wood keeps clear
    // (so each comes down through the canopy, none across the open clearing). A sheaf is nine thin beams (0.4 to 1.2 m half width) within 4.5 m of its place, each from SHAFT_TOP above the
    // ground (the underside of the crowns) down the sun's own direction to SHAFT_END above it; a beam fades out as the eye comes within 24 m to 6 m of it. A beam is a ribbon turned about its own axis to face the eye, bright along its middle and feathered to nothing at both
    // sides and both ends, laid on the picture additively; bright motes hang in it.
    const SHAFT_TOP = 9, SHAFT_END = 2, shaftU = { uAmt: { value: 0 }, uTime: tU, uCol: { value: new THREE.Color('#ffe4a6') }, ...fx.fogUniforms() };
    let sShaft0 = 0;
    {
      const SH = ST['sun shafts'], P = [], AX = [], INF = [], IX = [], MP = [], MC = [], MI2 = []; let n = 0, nm = 0, sg = SH.sign();
      const run = (SHAFT_TOP - SHAFT_END) / sunDir.y;
      for (let s = sRim + SH.range(40, 70); s < PL; s += SH.range(40, 70), sg = -sg) {
        if (!sShaft0) sShaft0 = s;
        const c = route(s, sg * (clearW(s) + SH.range(1.5, 8)));
        for (let k = 0; k < 9; k++) {
          const a = SH.range(0, TAU), r = 4.5 * Math.sqrt(SH()), x = c[0] + Math.cos(a) * r, z = c[1] + Math.sin(a) * r, y = groundAt(x, z), hw = SH.range(0.4, 1.2), ph = SH.range(0, TAU), len = run * SH.range(0.8, 1);
          const top = [x + sunDir.x * (SHAFT_TOP / sunDir.y), y + SHAFT_TOP, z + sunDir.z * (SHAFT_TOP / sunDir.y)], ax = [-sunDir.x * len, -sunDir.y * len, -sunDir.z * len];
          for (const [cx, cy] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) { P.push(top[0], top[1], top[2]); AX.push(ax[0], ax[1], ax[2]); INF.push(cx, cy, hw, ph); }
          IX.push(n, n + 1, n + 2, n + 2, n + 1, n + 3); n += 4;
          for (let j = 0; j < 5; j++) { const t = SH.range(0.15, 0.85), o = [SH.range(-1, 1) * hw * 0.6, SH.range(-1, 1) * hw * 0.6, SH.range(-1, 1) * hw * 0.6], pr = [SH(), SH(), SH()];
            for (const [cx, cy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { MP.push(top[0] + ax[0] * t + o[0], top[1] + ax[1] * t + o[1], top[2] + ax[2] * t + o[2]); MC.push(cx, cy, pr[0], pr[1]); }
            MI2.push(nm, nm + 1, nm + 2, nm + 2, nm + 1, nm + 3); nm += 4; }
        }
      }
      const add = { transparent: true, depthWrite: false, fog: true, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, side: THREE.DoubleSide };
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aAxis', new THREE.Float32BufferAttribute(AX, 3)); g.setAttribute('aInfo', new THREE.Float32BufferAttribute(INF, 4)); g.setIndex(IX);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: shaftU, ...add,
        vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec3 aAxis; attribute vec4 aInfo; varying vec2 vC; varying float vK;
          void main(){ vec3 c = position + aAxis * aInfo.y, ax = normalize(aAxis), toEye = cameraPosition - c; float dist = length(toEye);
            vec3 p = c + normalize(cross(ax, toEye)) * aInfo.x * aInfo.z * (1. + .5 * aInfo.y);
            // a beam looked at along its own length, or one the eye is inside, is not drawn
            vK = (1. - smoothstep(.8, .97, abs(dot(ax, toEye / dist)))) * smoothstep(6., 24., dist); vC = aInfo.xy;
            vec4 mvPosition = viewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
        fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`uniform float uAmt; uniform vec3 uCol; varying vec2 vC; varying float vK;
          void main(){ float x = 1. - vC.x * vC.x, a = x * x * smoothstep(0., .25, vC.y) * (1. - smoothstep(.45, 1., vC.y)) * vK * uAmt * .2;
            if (a < .002) discard; gl_FragColor = vec4(uCol * a * (1. - fxFog()), 0.); }` }));
      m.frustumCulled = false; m.renderOrder = 4; scene.add(m);
      const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.Float32BufferAttribute(MP, 3)); mg.setAttribute('aInfo', new THREE.Float32BufferAttribute(MC, 4)); mg.setIndex(MI2);
      const mm = new THREE.Mesh(mg, new THREE.ShaderMaterial({ uniforms: shaftU, ...add,
        vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec4 aInfo; uniform float uTime; varying vec2 vC; varying float vK;
          void main(){ float ph = aInfo.z * 6.2832, tw = .5 + .5 * sin(uTime * (1.2 + aInfo.w * 2.) + ph * 3.);
            vec3 p = position + vec3(sin(uTime * .31 + ph), sin(uTime * .23 + ph * 1.7) * .6, cos(uTime * .27 + ph * 2.3)) * .35;
            vec4 mvPosition = viewMatrix * vec4(p, 1.); mvPosition.xy += aInfo.xy * (.035 + .05 * aInfo.w);
            vK = (.35 + .65 * tw) * smoothstep(1.5, 5., -mvPosition.z); vC = aInfo.xy; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
        fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`uniform float uAmt; uniform vec3 uCol; varying vec2 vC; varying float vK;
          void main(){ float a = (1. - smoothstep(.0, 1., dot(vC, vC))) * vK * uAmt * 2.2; if (a < .004) discard; gl_FragColor = vec4(uCol * a * (1. - fxFog()), 0.); }` }));
      mm.frustumCulled = false; mm.renderOrder = 4; scene.add(mm);
    }
    await ctx.yield();
    const puffTint = puffU.uTint;
    {
      // a soft fall of snow from a fir's boughs at the moment its load lets go: all in the shader, keyed to the tree's own thaw. From the hollow's floor on (the firs before it keep their snow as we pass)
      const SLD = ST['snow slides'], list = trees.filter((t) => (t.kind === 'fir' || t.kind === 'larch') && Math.abs(t.lat) < 30 && t.sp > sFloor && !t.beyond), NQ = 9, n = list.length * 2 * NQ;
      const sp = new Float32Array(n * 4 * 3), si = new Float32Array(n * 4 * 4), sc = new Float32Array(n * 4 * 2), ix = new Uint32Array(n * 6); let q = 0;
      for (const t of list) for (let k = 0; k < 2; k++) {
        const a = SLD.range(0, TAU), hf = SLD.range(0.3, 0.72), r = t.R * (1 - hf) * SLD.range(0.5, 0.9), u0 = t.thaw + SEASON_SPAN * SLD.range(0.1, 0.42), x = t.x + Math.cos(a) * r, z = t.z + Math.sin(a) * r, y = t.y + t.H * hf;
        for (let j = 0; j < NQ; j++, q++) {
          const p = [x + SLD.range(-0.9, 0.9), y + SLD.range(-0.9, 0.9), z + SLD.range(-0.9, 0.9)], inf = [u0 + SLD.range(0, 0.006), t.H * hf * SLD.range(0.75, 1.05), SLD(), SLD.range(0.7, 1.5)];
          for (let c = 0; c < 4; c++) { sp.set(p, (q * 4 + c) * 3); si.set(inf, (q * 4 + c) * 4); sc.set([c % 2 ? 1 : -1, c > 1 ? 1 : -1], (q * 4 + c) * 2); }
          ix.set([q * 4, q * 4 + 1, q * 4 + 2, q * 4 + 2, q * 4 + 1, q * 4 + 3], q * 6);
        }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(sp, 3)); g.setAttribute('aInfo', new THREE.BufferAttribute(si, 4)); g.setAttribute('aCorner', new THREE.BufferAttribute(sc, 2)); g.setIndex(new THREE.BufferAttribute(ix, 1));
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uSeason: S.uSeason, uTint: puffTint, ...fx.fogUniforms() }, fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec2 aCorner; attribute vec4 aInfo; uniform vec4 uSeason; varying vec2 vC; varying float vA;
          void main(){ float k = (uSeason.x - aInfo.x) / .028, live = step(0., k) * step(k, 1.); k = clamp(k, 0., 1.);
            vec3 p = position + vec3((aInfo.z - .5) * 2.4 * k, -aInfo.y * k * k * (.8 + .4 * aInfo.z), (fract(aInfo.z * 7.3) - .5) * 2.4 * k);
            vec4 mvPosition = viewMatrix * vec4(p, 1.); mvPosition.xy += aCorner * vec2(1., 1.7) * aInfo.w * (.16 + .34 * k) * live;
            gl_Position = projectionMatrix * mvPosition; vC = aCorner; vA = live * sin(k * 3.14159) * .4 * smoothstep(3., 9., -mvPosition.z); ${fx.GLSL_FOG_VERT} }`,
        fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`uniform vec3 uTint; varying vec2 vC; varying float vA;
          void main(){ float a = vA * (1. - smoothstep(.05, 1., dot(vC, vC))); if (a < .004) discard; gl_FragColor = vec4(fxFogPremult(uTint * a, a), a); }` }));
      m.frustumCulled = false; m.renderOrder = 3; scene.add(m);
    }
    await ctx.yield();
    const pollen = fx.makeParticles({ rng: ST.pollen, preset: 'pollen', count: Math.round(1500 * dens), time: tU }); pollen.setOpacity(0); scene.add(pollen.object);
    const petals = fx.makeParticles({ rng: ST.petals, preset: 'petals', count: Math.round(130 * dens), colors: ['#ffffff', '#fbfff4', '#ffffff'], time: tU }); petals.setOpacity(0); scene.add(petals.object);
    // petals fall where blossom stands open: for every 10 m of the way, how many hawthorns and laburnums stand within 30 m of it and the moment (in u) their blossom is out
    const NB = Math.ceil(PL / 10) + 1, bloomN = new Float32Array(NB), bloomU = new Float32Array(NB);
    for (const t of trees) if ((t.kind === 'hawthorn' || t.kind === 'laburnum') && Math.abs(t.lat) < 30 && !t.beyond) { const i = clamp(Math.floor(t.sp / 10), 0, NB - 1); bloomN[i]++; bloomU[i] += t.thaw + (DELAY[t.kind] + 0.6) * SEASON_SPAN; }
    for (let i = 0; i < NB; i++) if (bloomN[i]) bloomU[i] /= bloomN[i];
    // full where three or more such trees stand in the 30 m we are flying through
    const bloomNear = (camS, u) => { let n = 0; for (let i = Math.floor(camS / 10), k = 0; k < 3 && i < NB; i++, k++) if (i >= 0) n += bloomN[i] * smoothstep(0, SEASON_SPAN, u - bloomU[i] + SEASON_SPAN); return clamp(n / 3, 0, 1); };
    await ctx.yield();

    // ------------------------------------------------------------ spring's creatures: a thrush and then the whole chorus, bees over the flowers, two butterflies among the flowers at the second lamp-post's foot
    const SONG = { body: '#6e5236', belly: '#eadfc6', wingC: '#5a4028', tip: '#3a2a1c', head: '#6e5236', tailC: '#4a3626', beak: '#d8a020' };
    // Both flocks cross over the way, each on a course laid off the flown line by its own numbers. Each is handed its wander written out (a bird roams a box about its dealt place: one and a half
    // times the first figure along x, the middle one up and down, the third along z) and maxSigma 3 (on each axis no place is dealt beyond three scatters of the course, a scatter being 0.45 of the
    // spread). So the lowest a bird reaches under its course is three scatters up and down, the wander's up-and-down figure and the kit's own body radius (flock.reach.body), and the crossing's
    // height is that reach, 2.5 m of clear air under it, and room for the line's own rise under the flock's breadth. The kit moves nothing: no keepClear is handed and the build pays nothing for it.
    // The count is by place: the whole flown line every 0.1 m against each bird's whole course, with its wander's whole box and its body's ball about it, on three hundred visits.
    // The thrushes: 8.1 + 2.5 + 0.63 m of reach and 2.5 m clear make 13.73 m, and the line rises up to 0.86 m under them: laid at 14.75. Counted: no bird's reach within 3.35 m of the line; the whole box of three scatters and the wander, less the ball, no nearer than 2.65 m
    faunaS.add(F.makeFlock({ rng: ST.thrushes, species: 'crows', count: 14, size: 0.62, flap: 7.5, glide: 0.25, speed: 10, spread: [20, 6, 24], wander: [5, 2.5, 5, 0.7], maxSigma: 3, ...SONG,
      cross: { path, u: lerp(sShaft0, sStep, ST['thrush crossing'].range(0.2, 0.8)) / PL, lead: 40, span: 230, angle: 50, side: -lampSide, height: 14.75, duration: DUR } }), { always: true });
    await ctx.yield();
    // The chorus, where the line rises no more than 0.04 m under the flock. Swifts are handed their spread written out as 40, 8, 40 (the kind's own is 40, 16, 40: the first figure deals both level axes, the middle one up and down, the third the lag along the course),
    // halved up and down so that they cross near the way, and their up-and-down wander as 2 m (the rooks' own figure; the swifts' own is 5): 10.8 + 2 + 1.09 m of reach and 2.5 m clear make 16.39 m, laid at 16.75.
    // Counted: no bird's reach within 2.87 m of the line; the box no nearer than 2.81 m.
    // Rooks, with the wander of their kind: 13.5 + 2 + 0.71 m of reach and 2.5 m clear make 18.71 m, laid at 19. Counted: no bird's reach within 2.79 m of the line; the box no nearer than 2.74 m
    faunaS.add(F.makeFlock({ rng: ST.chorus, species: birdKind === 'swifts' ? 'swifts' : 'crows', count: birdKind === 'swifts' ? 22 : 12, wander: birdKind === 'swifts' ? [9, 2, 8, 0.7] : [4, 2, 4, 0.4], maxSigma: 3,
      ...(birdKind === 'swifts' ? { spread: [40, 8, 40] } : { size: 0.7, ...SONG, body: '#2a2622', belly: '#3a342e', wingC: '#221e1a', head: '#2a2622' }),
      cross: { path, u: lerp(GLADE0, PL, ST['chorus crossing'].range(0.25, 0.7)) / PL, lead: 46, span: 240, angle: 58, side: lampSide, height: birdKind === 'swifts' ? 16.75 : 19, duration: DUR } }), { always: true });
    await ctx.yield();
    faunaS.add(F.makeBees({ rng: ST.bees, path, uFrom: GLADE0 / PL, uTo: 1, clear: 1.6, spread: 11, lift: [-3.4, -1.4], count: Math.round(110 * dens), size: 2.6, cluster: 9 }), { range: 90 });
    await ctx.yield();
    { const bx = lamp2XZ[0], bz = lamp2XZ[1], by = lamp2Y, a0 = ST['butterfly place'].range(0, TAU);
      faunaS.add(F.makeButterflies({ rng: ST.butterflies, count: 2, positions: [[bx + Math.cos(a0) * 1.6, by + 1.3, bz + Math.sin(a0) * 1.6], [bx - Math.cos(a0) * 1.3, by + 1.9, bz - Math.sin(a0) * 1.3]], size: 2.3, roam: [2.6, 1.0, 0.6, 0.04] }), { range: 110 }); }
    await ctx.yield();

    // ------------------------------------------------------------ the end of the glade: an arch of hawthorn and laburnum boughs over the way out
    {
      const c = route(PL + 0.6, 0), cy = path.posAtDist(PL, _p).y, tq = path.tangentAtDist(PL, _t), tl = Math.hypot(tq.x, tq.z) || 1, rx = -tq.z / tl, rz = tq.x / tl, fxn = tq.x / tl, fz = tq.z / tl, spansH = [], spansL = [];
      for (let k = 0; k < 4; k++) { const R = PORTAL_R + 1.5 + k * 0.5, off = (k - 1.5) * 0.6, n = 14; let prev = null;
        for (let i = 0; i <= n; i++) { const a = -0.42 + (Math.PI + 0.84) * i / n, w = 1 + 0.05 * Math.sin(i * 1.7 + k * 2), p = [c[0] + rx * Math.cos(a) * R * w + fxn * (off + 0.5 * Math.sin(i * 0.9 + k)), cy + Math.sin(a) * R * w, c[1] + rz * Math.cos(a) * R * w + fz * (off + 0.5 * Math.sin(i * 0.9 + k))];
          if (prev) (k % 2 ? spansL : spansH).push([prev, p]); prev = p; } }
      const ag = await leafy(flora.vineGeometry, { rng: ST['arch hawthorn'], spans: spansH, sag: 0.05, thickness: 0.19, leaves: 1.8, hangers: 0.5, detail: 1, leaf: '#f4faea', leafLight: '#ffffff', leafDark: '#93bb6c', stem: '#4a382c', flower: '#ffffff' }, { pivot: 'buds', woodSnow: 0.5 });
      await ctx.yield();
      const lg = await leafy(flora.vineGeometry, { rng: ST['arch laburnum'], spans: spansL, sag: 0.05, thickness: 0.14, leaves: 1.3, hangers: 2.4, detail: 1, leaf: '#ffe14a', leafLight: '#fff6ae', leafDark: '#dcbc34', stem: '#5a5044', flower: '#ffe14a' }, { pivot: 'buds', woodSnow: 0.5 });
      const th = thawAt(c[0], c[1]);
      scene.add(seasonInstances(ag, treeMat, [{ x: 0, y: 0, z: 0, s: 1, thaw: th - 0.03, delay: 0.3, snow: 1, kind: 1 }]));
      scene.add(seasonInstances(lg, treeMat, [{ x: 0, y: 0, z: 0, s: 1, thaw: th - 0.03, delay: 0.42, snow: 1, kind: 1 }]));
    }
    await ctx.yield();
    // The far light of each lamp: a warm star seen from the other end of the wood. Its phases are dealt from its own stream; it takes the fog in full, keeps the kit's own least size,
    // and each star fades (the kit's own near fade, counted in the star's own sizes) as the eye comes within 60 m of the first lamp down to 14 m, 42 m to 10 m for the second's smaller star:
    // there the lantern's own glass and halo are what is seen. Its strength follows the season and nothing else
    const FAR_STAR = 3.4, farGlow = fx.makeGlows({ rng: ST['far stars'], time: tU, positions: [S.uLampPos.value[0].toArray(), S.uLampPos.value[1].toArray()], colors: ['#ffb347', '#ffd9a0'], sizes: [1, 0.7], size: FAR_STAR, intensity: 1.6, flicker: 0.15, halo: 1.2, near: [14 / FAR_STAR, 60 / FAR_STAR] });
    scene.add(farGlow.object);
    // the land beyond the grid: one wide sheet, white and then green, kept just under the edge of the wood floor (its height is read from a table by the metres we have flown)
    const farMat = new THREE.MeshLambertMaterial({ color: '#c7d9f7' }), farLand = new THREE.Mesh(new THREE.PlaneGeometry(5000, 5000).rotateX(-Math.PI / 2), farMat);
    const FARN = Math.ceil(PL / 10), farY = new Float32Array(FARN + 1); for (let i = 0; i <= FARN; i++) { let m = 1e9; for (const d of [-80, -40, -12, 0, 12, 40, 80]) for (const ds of [-70, 0]) { const a = route(clamp(i * 10 + ds, 0, PL), d); m = Math.min(m, groundAt(a[0], a[1])); } farY[i] = m - 2.4; }
    { const c = route(PL / 2, 0); farLand.position.set(c[0], farY[0], c[1]); } scene.add(farLand);
    await ctx.yield();
    // far hills round the whole horizon (the kit's ridges, which keep their distance from the eye the kit's own way): blue, standing well above the trees, the last snow lying along their tops
    const hills = T.makeHorizonRidges({ rng: ST.hills, layers: 3, radius: [800, 1700], height: [110, 280], base: -14, jagged: 0.34, coverage: 0.9, colorNear: '#3f5f96', fog: scene.fog, hazeNear: 0.22, hazeFar: 0.62, sunDir, sunColor: '#ffe9c0', sunIntensity: 1, snow: true, snowLine: 0.6, rim: 0.35 });
    scene.add(hills.object);
    await ctx.yield();
    const farW = new THREE.Color().setRGB(SNOW[0], SNOW[1], SNOW[2]), farS = new THREE.Color('#4f8a2a');
    // A rare visit: the thaw is led by a warm wind made visible. Bright gold motes hang in a field fixed over the stretch from the thaw line to the glade's edge (40 m to each side of the way,
    // 1 to 9 m above the ground); each one is lit while its own spot of the wood thaws, so the light runs through the wood ahead of us as the thaw does and ends with it
    if (rare) {
      const RM = ST['rare motes'], NM = 1500, mp = new Float32Array(NM * 4 * 3), mi = new Float32Array(NM * 4 * 4), ix = new Uint32Array(NM * 6);
      for (let i = 0; i < NM; i++) {
        const q = route(RM.range(sThaw, GLADE0), RM.range(-40, 40)), p = [q[0], groundAt(q[0], q[1]) + RM.range(1, 9), q[1]], th = thawSD(q[0], q[1], _f.s, _f.d), r = RM();
        for (let c = 0; c < 4; c++) { mp.set(p, (i * 4 + c) * 3); mi.set([c % 2 ? 1 : -1, c > 1 ? 1 : -1, th, r], (i * 4 + c) * 4); }
        ix.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 2, i * 4 + 1, i * 4 + 3], i * 6);
      }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(mp, 3)); g.setAttribute('aInfo', new THREE.BufferAttribute(mi, 4)); g.setIndex(new THREE.BufferAttribute(ix, 1));
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { uSeason: S.uSeason, uCol: { value: new THREE.Color('#ffd070') }, ...fx.fogUniforms() }, fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
        vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`attribute vec4 aInfo; uniform vec4 uSeason; varying vec2 vC; varying float vK;
          void main(){ float t = uSeason.z, ph = aInfo.w * 6.2832, p = (uSeason.x - aInfo.z) * uSeason.y, lit = smoothstep(-.5, .1, p) * (1. - smoothstep(.7, 1.5, p));
            vec3 q = position + vec3(sin(t * .41 + ph), sin(t * .29 + ph * 1.7) * .5, cos(t * .37 + ph * 2.3)) * .8;
            vec4 mvPosition = viewMatrix * vec4(q, 1.); mvPosition.xy += aInfo.xy * (.05 + .07 * aInfo.w) * step(.01, lit);
            vK = lit * (.4 + .6 * sin(t * (1.5 + aInfo.w * 2.) + ph * 5.)) * smoothstep(1.5, 5., -mvPosition.z); vC = aInfo.xy; gl_Position = projectionMatrix * mvPosition; ${fx.GLSL_FOG_VERT} }`,
        fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`uniform vec3 uCol; varying vec2 vC; varying float vK;
          void main(){ float a = (1. - smoothstep(0., 1., dot(vC, vC))) * vK * 2.6; if (a < .004) discard; gl_FragColor = vec4(uCol * a * (1. - fxFog()), 0.); }` }));
      m.frustumCulled = false; m.renderOrder = 4; scene.add(m);
    }
    await ctx.yield();

    await ctx.yield();
    await skyW.prewarm(ctx.renderer, null, scene); await ctx.yield();
    await skyS.prewarm(ctx.renderer, null, scene);
    await ctx.yield();
    const camP = new THREE.Vector3(), col = new THREE.Color(), tintW = new THREE.Color(night ? '#7f98e0' : pale ? '#c4d0f4' : '#a4b8f2'), tintS = new THREE.Color('#fff4dc');
    const glintW = new THREE.Color(0.5, 0.62, 0.95), glintS = new THREE.Color(1.0, 0.9, 0.6), mistWhite = new THREE.Color('#e6ecfa'), mistPale = new THREE.Color('#eef2ff');
    // rose light on the highest snow, where the hour gives it: at dusk and at the golden hour, a little on a pale day, none by night
    const ROSE = night ? 0 : vary.hour === 'golden' ? 1 : vary.hour === 'day' ? 0.35 : 0.8, roseTo = new THREE.Vector3(1.9, 1.02, 0.96);
    // where the team comes abeam of us (in metres along the way): found from its own run and its track
    let sMeet = sLamp; while (sMeet < sRim) { teamAt(sMeet / PL); fieldAt(teamEye.x, teamEye.z, _f); if (_f.s <= sMeet) break; sMeet++; }
    return {
      scene, path, duration: DUR,
      camera: { fov: 62, near: 0.3, far: 3000, lookAhead: 26, sway: 0.8, bank: 0.6 },
      // the gaze is pulled twice, each between two places and fading over 40 m of flight at either end (over half its stretch where that is shorter): to the first lamp-post from the start of the firs' stretch until we pass it,
      // then to the team from there (where it sets off) until it comes abeam of us: we watch it come, and look to the way again as it passes
      pois: [{ at: S.uLampPos.value[0], from: (WARDROBE_DEPTH + 18) / PL, to: sLamp / PL, weight: 0.4, fade: 40 / (sLamp - WARDROBE_DEPTH - 18) },
        { at: (time, u) => teamAt(u), from: sLamp / PL, to: sMeet / PL, weight: 0.45, fade: Math.min(0.5, 40 / Math.max(sMeet - sLamp, 1)) }].filter((q) => q.to - q.from > 10 / PL),
      // the ring is shown from the glade's edge
      portal: { shape: 'circle', radius: PORTAL_R, color: '#ffe9a8', glow: 1, revealDistance: PL - GLADE0 },
      post: { exposure: 1.06, bloom: { strength: 0.5, radius: 0.7, threshold: 0.9 }, grade: { saturation: 1.08, contrast: 1.04, tint: '#ffffff', shadowTint: '#0a1030', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        tU.value = time; S.set(u, time); wind.update(time);
        camera.getWorldPosition(camP);
        // metres flown; then, each between two places: winter's sky and light give way to spring's from the thaw line to the glade's edge; the mist rises from the thaw line to the first shaft of sun
        // and clears from there to the glade's edge; it turns from white to gold between the ledge's rim and the first shaft; open: how far the clearing has opened (0 in the wood, 1 at the ring)
        const camS = u * PL, g = smoothstep(sThaw, GLADE0, camS), mist01 = camS < sShaft0 ? smoothstep(sThaw, sShaft0, camS) : 1 - smoothstep(sShaft0, GLADE0, camS), gold = smoothstep(sRim, sShaft0, camS);
        const open = (clearW(camS) - LANE_WOOD) / (CLEAR_W1 - LANE_WOOD);
        skyS.setOpacity(g); skyW.update(dt, time, camera); skyS.update(dt, time, camera);
        rig.match(skyW, skyS, g); rig.update(dt, time, camera);
        scene.fog.color.copy(fogW).lerp(fogS, g).lerp(col.copy(mistWhite).lerp(fogM, gold), mist01 * 0.8);
        scene.fog.density = lerp(0.0095, 0.0036, g) + 0.0042 * mist01;
        const fl = hero.lamp.flicker(time); lamp2.flicker(time);
        S.uLampCol.value[0].copy(LAMP_COL).multiplyScalar(fl * lerp(1, 0.45, g));
        hero.lamp.setLevel(lerp(1, 0.55, g));
        S.uRose.value.set(1, 1, 1).lerp(roseTo, ROSE * (1 - g));
        flakes.uniforms.uAmount.value = 1 - smoothstep(sThaw, sShaft0, camS); flakes.uniforms.uTint.value.copy(tintW).lerp(tintS, g).multiplyScalar(0.8);
        gU.uSpring.value = g; gU.uGlint.value.copy(glintW).lerp(glintS, g);
        waterU.uZenith.value.copy(skyW.zenithColor).lerp(skyS.zenithColor, g); waterU.uHorizon.value.copy(skyW.horizonColor).lerp(skyS.horizonColor, g);
        waterU.uAmb.value.copy(rig.hemi.color).multiplyScalar(rig.hemi.intensity * 0.3); waterU.uSunCol.value.copy(rig.sun.color).multiplyScalar(rig.sun.intensity * 0.3 * g);
        waterU.uKey.value.copy(rig.sun.color).multiplyScalar(rig.sun.intensity * 0.3 * lerp(skyW.lightDirection.y, skyS.lightDirection.y, g));
        hero.wardrobe.update(time, camP);
        faunaW.update(dt, time, camera, u); faunaS.update(dt, time, camera, u); hills.update(dt, time, camera);
        // the team: where it is on its track is set by the metres we have flown and nothing else; the sledge follows DB behind the reindeer, turned and tilted along the track
        { const run = teamRun(camS); reindeer.uniforms.uTravel.value = run; sprayU.uGo.value = camS > sLamp && run < TRACK_L ? 1 : 0;
          trackCurve.getPointAt(clamp((run - DB) / TRACK_L, 0, 1), _s1); trackCurve.getPointAt(clamp(run / TRACK_L, 0, 1), _s2);
          const y1 = walkAt(_s1.x, _s1.z), y2 = walkAt(_s2.x, _s2.z), dx = _s2.x - _s1.x, dz = _s2.z - _s1.z;
          sledge.position.set(_s1.x, y1 + 0.04, _s1.z); sledge.rotation.set(-Math.atan2(y2 - y1, Math.hypot(dx, dz) || 1), Math.atan2(dx, dz), 0); }
        mist.uniforms.uOpacity.value = mistK * mist01; mist.uniforms.uColor.value.copy(mistPale).lerp(fogM, gold);
        // the shafts come with the gold and dim as the clearing opens
        shaftU.uAmt.value = gold * lerp(1, 0.55, open);
        // pollen rises from the first shaft to the step, and never over less than 40 m of the way before the step (the step is always more than that past the rim)
        pollen.setOpacity(smoothstep(Math.min(sShaft0, sStep - 40), sStep, camS) * 0.9); petals.setOpacity(bloomNear(camS, u));
        { const fi = clamp(camS / 10, 0, FARN - 0.001), i0 = Math.floor(fi); farLand.position.y = lerp(farY[i0], farY[i0 + 1], fi - i0); farMat.color.copy(farW).lerp(farS, smoothstep(sThaw, sStep, camS)); }
        farGlow.uniforms.uIntensity.value = lerp(1, 0.4, g);
        { const f = (u * PL + RB_TAKE - RB_S0) / RB_GAP, k = clamp(Math.floor(f), -1, perches.length - 2), fr = f < 0 ? 1 : k >= perches.length - 2 && f > perches.length - 2 + RB_FLY / RB_GAP ? 1 : f - Math.floor(f), tf = fr / (RB_FLY / RB_GAP);
          const A = perches[Math.max(k, 0)], B = perches[k + 1];
          if (tf < 1) {
            const e = tf * tf * (3 - 2 * tf), wide = smoothstep(0, 0.1, tf) * (1 - smoothstep(0.9, 1, tf));
            robin.position.set(lerp(A.x, B.x, e), lerp(A.y, B.y, e) + Math.sin(Math.PI * e) * 1.5 + 0.12 * Math.sin(time * 9 + rbP[0]) * wide, lerp(A.z, B.z, e));
            robin.rotation.set(-0.25 * Math.cos(Math.PI * e), Math.atan2(B.x - A.x, B.z - A.z), 0.25 * Math.sin(time * 4.3 + rbP[1]) * wide);
            robinU.uWing.value.set(wide, Math.sin(time * 54 + rbP[2]) * 0.95 + 0.15); puffU.uPuff.value.w = 0;
          } else {
            const look = Math.atan2(A.x - B.x, A.z - B.z) + 0.55 * Math.sign(Math.sin(time * 1.3 + rbP[3] + 0.8 * Math.sin(time * 0.7 + rbP[0])));
            robin.position.set(B.x, B.y + 0.035 * Math.abs(Math.sin(time * 5.2 + rbP[1])), B.z);
            robin.rotation.set(-0.12 + 0.1 * Math.max(0, Math.sin(time * 7.1 + rbP[2])) * Math.max(0, Math.sin(time * 0.9 + rbP[3])), look, 0);
            robinU.uWing.value.set(0, 0);
            puffU.uPuff.value.set(B.x, B.y - 0.1, B.z, (fr - RB_FLY / RB_GAP) * RB_GAP / (PL / DUR));
            puffU.uAmt.value = B.snowy * (1 - smoothstep(0.05, 0.4, (u - B.thaw) / SEASON_SPAN));
          } }
        // what lies far behind us or beyond the fog is not drawn: trees by 50 m of the way, small things by their own stretch
        const vis = clamp(2 / scene.fog.density, 180, 440);
        for (const m of treeMeshes) { const c0 = m.userData.ch * 50; m.visible = c0 + 50 > camS - 14 && c0 < camS + vis; }
        for (const m of smallMeshes) m.visible = m.userData.c0 + (m.userData.len || 50) > camS - 12 && m.userData.c0 < camS + Math.min(vis, m.userData.ahead);
        hero.wardrobe.object.visible = camS < sLamp; flakes.object.visible = camS < sShaft0;
      },
      dispose() { skyW.dispose(); skyS.dispose(); },
    };
  },
};
