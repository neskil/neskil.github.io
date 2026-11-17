// A Light in Every Dark Place. One winter night and the small lights people keep in it. What stands where:
// a snowing city street of fire-lit parlour windows and shop fronts, a market square with a church front, stalls and
// braziers, a narrow lane, the last cottages and lamps along a rutted road that goes on over the moor; south of the
// road a frozen moor of big rough boulders lying scattered, iced-over pools, gorse and rough grass, and one lit
// hut; black cliffs with a cove of sea caves; a lone sea tower on its reef in breaking seas (the hero set piece,
// src/parts/light-in-every-dark-place.js); a ship far out, lanterns lit; and a ring of light beyond her bow. One fire
// colour is in every one of these places: the darker the place, the smaller the light. The route is one line from
// the town over its moor to its coast and out to sea.
//
// Axes: x east, z south, y up. Sea level y 0, the street's surface y 40, the moor about y 32, the cliff top y 30.
//
// LAYOUT    every thing is placed in world metres or in metres along the route from a place; nothing is placed,
//           timed or lit by a share of the flight. A window (pace, gaze) is metres between two places.
// HOUR      ONE hour stands for the whole visit: the red lies low in the west at one height and one strength, and
//           night with the moon behind torn cloud stands overhead and in the south and east. Mist, snow and sleet
//           differ by PLACE, written from the eye's world x and z (see PLACE): the same for anyone standing there.
// LAMPS     lamplighters walk their rounds on the world's clock (three rounds: the street's north kerb, the
//           square's north side, the cottages' road; none in the lane; none within 6 m of the line: see layRounds),
//           and each lamp on a round is lit where its lighter has been: alight from when he reaches it until it
//           gutters out, dark until he comes again. Nothing of them reads the metres flown or the eye. No pacing is
//           declared: nothing in this world begins, turns or ends because we come.
// LIGHTS    every light is the place's own: windows, lamps, braziers, the hut's fire, the tower's lantern and slit,
//           the ship's lamps, the ring; over them one moon and one red west. The camera wears nothing and carries
//           no light: nothing is drawn at the eye's place and nothing is lit from it.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { makeSky, makeLightRig } from '../kit/sky.js';
import * as T from '../kit/terrain.js';
import * as Water from '../kit/water.js';
import * as fx from '../kit/fx.js';
import { buildHero, FIRE, FIRE_GLSL, LAMP_GLSL, makeFireGlows, makeBursts, makeGeo, makeSeaBirds, birdReach } from '../parts/light-in-every-dark-place.js';

const lin = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

// ---- the places (metres) -------------------------------------------------------------------------------------
const STREET_Y = 40, EYE = 5.2, FRONT = 7.5, KERB = 5.3;
const DRIFT = 8 / 176;
// THE TOWN, in the street's own frame: s = metres west of the entry along the street's line (which drifts south
// 8 m in 176), l = metres north of that line. The entry stands at x OX. The first street runs to s1, where it opens
// into the square (to sq, between lS and lN); a lane half as wide (fronts LANE_FRONT either side) leads out of the
// square to `lane`; then the terraces give way to cottages, which thin out to `cot`; the last lamp stands at `lamp`,
// and the road goes on over the moor to `road`.
const OX = 240, X_BACK = 36;
const TOWN = { s1: 120, sq: 166, lS: -24, lN: 28, lane: 250, cot: 365, lamp: 360, road: 790 };
// where the line leaves the road for the open moor (metres along the street's axis)
const OFF_ROAD = 430;
const LANE_FRONT = 5.5, LANE_KERB = 3.5;
const TH = Math.atan(DRIFT), AX0 = [-Math.cos(TH), 0, Math.sin(TH)], NX0 = [-Math.sin(TH), 0, -Math.cos(TH)];
// a place of the street's frame in the world; y is metres above the street's surface
const SPW = (s, l, y) => [OX + AX0[0] * s + NX0[0] * l, STREET_Y + y, AX0[2] * s + NX0[2] * l];
// and back: [s, l] of a world place
const toStreet = (x, z) => [(x - OX) * AX0[0] + z * AX0[2], (x - OX) * NX0[0] + z * NX0[2]];
// THE ROAD out of the town: the street's own line as far as `turn` (metres from the entry along it), then an arc of
// radius R to the north-west through `phi`, then straight on toward the northern hills. It is built and rutted as far
// as TOWN.road and is a line over the moor beyond. d: metres along it from the entry; lat: metres to its north side.
const ROAD = { turn: 592, R: 140, phi: 0.76, far: 1420 };
// [x, z, heading x, heading z] of the road's line at d
function roadAtD(d, lat = 0) {
  const a = clamp((d - ROAD.turn) / ROAD.R, 0, ROAD.phi), over = Math.max(d - ROAD.turn - ROAD.R * ROAD.phi, 0), ds = Math.min(d, ROAD.turn);
  const c = Math.cos(a), sn = Math.sin(a), hx = AX0[0] * c + NX0[0] * sn, hz = AX0[2] * c + NX0[2] * sn, nx = NX0[0] * c - AX0[0] * sn, nz = NX0[2] * c - AX0[2] * sn;
  return [OX + AX0[0] * ds + (AX0[0] * sn + NX0[0] * (1 - c)) * ROAD.R + hx * over + nx * lat, AX0[2] * ds + (AX0[2] * sn + NX0[2] * (1 - c)) * ROAD.R + hz * over + nz * lat, hx, hz];
}
// [metres along the road, metres to its north side] of a world place (the nearest point of the road's line)
function toRoad(x, z) {
  const sl = toStreet(x, z);
  if (sl[0] <= ROAD.turn) return sl;
  // about the arc's centre: the angle turned, measured from the turn
  const u = sl[0] - ROAD.turn, v = ROAD.R - sl[1], a = Math.atan2(u, v);
  if (a >= 0 && a <= ROAD.phi) return [ROAD.turn + a * ROAD.R, ROAD.R - Math.hypot(u, v)];
  const e = roadAtD(ROAD.turn + ROAD.R * ROAD.phi), dx = x - e[0], dz = z - e[1], al = dx * e[2] + dz * e[3];
  // beyond the arc: along the straight; (a place that lies behind the arc's centre is far from any of it)
  return al >= 0 ? [ROAD.turn + ROAD.R * ROAD.phi + al, dz * e[2] - dx * e[3]] : [ROAD.turn, 1e4];
}
// the moor's own level; the cliff's line and the height of its top; COAST_FALL: the metres back from the cliff's line
// over which the land comes down from the moor's level to the cliff top's
const MOOR_Y = 32, CLIFF_Z = 215, CLIFF_TOP = 30, COAST_FALL = 85;
// THE PREVAILING WIND (where it comes from: x, z); each visit's own wind is dealt a little to either hand of it
const WIND = [0.26, -0.96], WIND_L = Math.hypot(WIND[0], WIND[1]);
// THE TOWN'S HILL: the shelf the town stands on falls to the moor's own level between HILL[0] metres before the last
// cottage and HILL[1] metres past it (along the street's line); the road's walls run as far as its foot
const HILL = [-20, 150];
// the land's level under a place of the moor's plan (the land's rule lays the ground under the line by it: layLand2)
const moorLevel = (x, z) => lerp(STREET_Y - 0.15, MOOR_Y, smoothstep(TOWN.cot + HILL[0], TOWN.cot + HILL[1], toStreet(x, z)[0]));
// THE MOOR'S SWELLS: long low rises and hollows lying across the wind's way, in world metres. Three wave trains, each
// `long` metres from crest to crest and turned `turn` radians from the wind's bearing, their shares adding to one;
// SWELL.h metres is the most a crest stands over (a hollow lies under) the land's own level: 1 to 2.4 m from hollow
// to crest over 30 to 70 m. swellWaves(wind's x, z): each train's [k x, k z, metres]; swellOf: the height to add at a place.
const SWELL = { h: 1.2, long: [67, 43, 31], turn: [-0.3, 0.25, 0.7], share: [0.5, 0.3, 0.2] };
// THE TONES' RULE: a face is bare where its lean into the wind (times `lean`) and its height on its swell (a crest
// counts `crest`) pass a mark, and drifted where they fall under one (see the land's material)
const TONES = { lean: 7, crest: 0.8 };
const swellWaves = (wx, wz) => SWELL.long.map((len, i) => { const c = Math.cos(SWELL.turn[i]), sn = Math.sin(SWELL.turn[i]), k = 2 * Math.PI / len; return [(wx * c - wz * sn) * k, (wx * sn + wz * c) * k, SWELL.share[i] * SWELL.h]; });
const swellOf = (wx, wz) => {
  const K = swellWaves(wx, wz);
  return (x, z) => K[0][2] * Math.sin(K[0][0] * x + K[0][1] * z) + K[1][2] * Math.sin(K[1][0] * x + K[1][1] * z) + K[2][2] * Math.sin(K[2][0] * x + K[2][1] * z);
};
// ---- THE MOOR'S PLAN: every place by a reason of the land, the same on every visit (as the town's plan is) --------
// THE HUT stands where the road turns away to the hills: straight seaward (south) of the road's bend, on the last
// level ground of the moor before the land begins its fall to the cliff (COAST_FALL back from the cliff's line). It
// lies end-on to the prevailing wind (its long walls run down the wind: HUT.U) and its lit side (one small window
// and the open door) is the eastern one, the side the track comes to (HUT.N: that side's outward normal).
// THE WAY runs straight from the middle of the gate in the road's south wall (MOOR.gate metres past the last
// cottage) to the place abeam of the middle of the hut's lit wall, HUT.pass metres out from it (HUT_ABEAM).
// THE TWO TORS stand where the way comes to the foot of the town's hill (FOOT metres from the gate: where the
// land's level, moorLevel, has done falling): the rock breaks out where the fall ends. They are a pair by the great
// stones' own rule (STONE.pair): one on each hand of the way, each one's near face half the pair's middle gap from it.
// THE LONG POOL is the water that bar of rock holds back on the hill's last fall: its long axis lies on the way and
// its bank's far end (POOL_BANK of its half length from its middle: the land's rule for every pool's bank) at the
// tors' gap.
// EVERY STONE'S RULE: no stone's nearest face comes nearer than `gap` metres to the line, and none taller than `low`
// metres stands within `tall` metres of it; where two stand on both hands at once (`pair`) there are 2 `tall` metres
// and up to 8 more between their faces and the line runs through the middle; its foot goes `sunk` metres under the
// lowest ground of its own round (read at `ring` places round each of the `rings`: shares of its width out from
// its middle); `foot`: how many small boulders lie about a great one's foot
export const STONE = { gap: 12, low: 5, tall: 20, pair: [40, 48], sunk: 1.0, ring: 32, rings: [0.5, 0.375, 0.25, 0.125], foot: [3, 6] };
const WALL_L = 5.4, MOOR = { gate: 36, clear: (STONE.pair[0] + STONE.pair[1]) / 4 }, POOL_BANK = 1.7;
// the hut: 13 by 5 m; `pass`: the metres the line keeps from its lit wall as it goes by; `sight`: the straight
// metres at which its open door is taken for seen
const HUT = { w: 13, d: 5, eaves: 2.4, ridge: 4.2, U: [-WIND[0] / WIND_L, -WIND[1] / WIND_L], N: [-WIND[1] / WIND_L, WIND[0] / WIND_L], pass: 14, sight: 150 };
const ROAD_BEND = roadAtD(ROAD.turn);
HUT.x = ROAD_BEND[0]; HUT.z = CLIFF_Z - COAST_FALL;
const HUT_ABEAM = [HUT.x + HUT.N[0] * (HUT.d / 2 + HUT.pass), HUT.z + HUT.N[1] * (HUT.d / 2 + HUT.pass)];
const GATE = roadAtD(TOWN.cot + MOOR.gate, -WALL_L), WAY_L = Math.hypot(HUT_ABEAM[0] - GATE[0], HUT_ABEAM[1] - GATE[1]);
const WAY = [(HUT_ABEAM[0] - GATE[0]) / WAY_L, (HUT_ABEAM[1] - GATE[1]) / WAY_L], WAY_N = [-WAY[1], WAY[0]];
// the hill's foot on the way: where the way's place on the street's line reaches the end of the hill's fall
const FOOT = (TOWN.cot + HILL[1] - toStreet(GATE[0], GATE[1])[0]) / (WAY[0] * AX0[0] + WAY[1] * AX0[2]);
const TOR_MID = [GATE[0] + WAY[0] * FOOT, GATE[1] + WAY[1] * FOOT];
// the long pool: its half axes (a along the way), its middle, its turn (c, sn: the way's own bearing)
const POOL = { a: 30, b: 13, c: WAY[0], sn: WAY[1] };
POOL.x = TOR_MID[0] - WAY[0] * POOL_BANK * POOL.a; POOL.z = TOR_MID[1] - WAY[1] * POOL_BANK * POOL.a;
// the two tors: one on each hand of the way (side 1: the right hand, north-west), w across
const torAt = (side, w, h, kind) => ({ x: TOR_MID[0] + side * WAY_N[0] * (MOOR.clear + w / 2), z: TOR_MID[1] + side * WAY_N[1] * (MOOR.clear + w / 2), w, h, kind });
const GREAT = [torAt(1, 16, 15, 'rock'), torAt(-1, 20, 18, 'boulder')];
// THE LINE over the moor and the coast (metres): `over`, its height over the land's level under each knot of the
// moor (moorLevel: the town's shelf falling to the moor's own level); `hut`, over the hut's floor as it passes (its
// eaves' height and 0.3); `brink`, over the cliff's top at the cove knot; `cove`, `bend`: metres seaward and inland
// of the cliff's line
const LINE = { eaves: 3.9, over: 3.7, hut: 2.7, brink: 2, cove: 20, bend: 40 };
// ---- THE COAST, FROM THE MOOR'S PLAN -----------------------------------------------------------------------------
// From abeam of the hut the line runs straight on down the hut's own wall (HUT.U, the prevailing wind's way): THE
// HUT'S SIGHTLINE (sightX: its x at a z). THE COVE's middle lies where that sightline meets the cliff's line; its two
// headlands (their middles; each HEAD_HALF wide) stand COVE.half to either hand of it and reach COVE.deep out from
// the cliff's line. THE TWO SKERRIES stand off its mouth, a pair by the great stones' rule again: one on each hand
// of the cove's middle line, its near face (its reach SKERRY.reach of its height) MOOR.clear from that line; the
// lower in the line of the headlands' tips, the taller SKERRY.off[1] metres further out.
const sightX = (z) => HUT_ABEAM[0] + HUT.U[0] * (z - HUT_ABEAM[1]) / HUT.U[1];
const COVE = { half: 49, deep: 75 }, COVE_X = sightX(CLIFF_Z);
const HEAD_E = COVE_X + COVE.half, HEAD_W = COVE_X - COVE.half, HEAD_HALF = 14, HEAD_Z = CLIFF_Z + COVE.deep;
const SKERRY = { reach: 0.42, off: [0, 12], h: [16, 22] }, SKERRY_R = SKERRY.reach;
const SKERRIES = [1, -1].map((hand, i) => ({ x: COVE_X + hand * (MOOR.clear + SKERRY.h[i] * SKERRY.reach), z: HEAD_Z + SKERRY.off[i], h: SKERRY.h[i] }));
// THE TOWER stands on the hut's sightline, TOWER.off metres off the cliff's line: its axis (x, z), the metres from it
// at which the line rounds it, its top; the reef's half length (east to west); the bearing its keepers' slit looks
// out on (east)
const TOWER = { off: 185, r: 60, top: 30, reef: 15.5, slit: 90 };
TOWER.z = CLIFF_Z + TOWER.off; TOWER.x = sightX(TOWER.z);
// THE SHIP, BY HER OWN MEASURES FROM THE TOWER: she has weathered the reef and stands on to the west; her course's
// line lies SHIP_CLEAR metres south of the tower's axis and her stern SHIP_ASTERN metres west of it; then her bow and
// jib-boom's end (x), beam, mastheads and main yard over the sea; `off`: the metres the line keeps from her lee
// (south) side while it runs along her; `slant`: the angle to her course at which the line closes on her lee
// quarter; `wake`: the length of her wake. THE LINE HOLDS OFF UNTIL THE REEF'S WEST END LIES DUE NORTH OF IT and
// closes from there (the lee knot: see the route), so `wide`, the metres of that closing run, is measured, not given.
const SHIP_CLEAR = 33, SHIP_ASTERN = 175, SHIP_LEN = 42, SHIP_BOOM = 15;
const SHIP = { z: TOWER.z + SHIP_CLEAR, stern: TOWER.x - SHIP_ASTERN, bow: TOWER.x - SHIP_ASTERN - SHIP_LEN, boom: TOWER.x - SHIP_ASTERN - SHIP_LEN - SHIP_BOOM, beam: 11, mast: 40, yard: 18, off: 24, slant: 12 * Math.PI / 180, wake: 120 };
SHIP.wide = (TOWER.x - TOWER.reef - (SHIP.stern + SHIP_LEN)) / Math.cos(SHIP.slant);
// the ring: `past` metres beyond the jib-boom's end on her lee bow, on the line's own z, its centre RING.y over the sea
const RING_GLORY = 54, RING_PAST = 85, RING = { x: SHIP.boom - RING_PAST, y: 11, z: SHIP.z + SHIP.beam / 2 + SHIP.off, r: 7.5 };
// the bearing of a place from the tower's axis (degrees clockwise from north)
const towerBearing = (p) => (Math.atan2(p[0] - TOWER.x, TOWER.z - p[2]) * 180 / Math.PI + 360) % 360;
// a place by its bearing from the tower's axis (the same way) and its metres from it
const byTower = (b, r, y) => { const a = b * Math.PI / 180; return [TOWER.x + Math.sin(a) * r, y, TOWER.z - Math.cos(a) * r]; };

// the middle of the clear gap between two round masses' nearest faces (each: x, z, its reach r)
const gapMid = (a, ra, b, rb) => { const d = Math.hypot(b.x - a.x, b.z - a.z), t = (ra + (d - ra - rb) / 2) / d; return [lerp(a.x, b.x, t), lerp(a.z, b.z, t)]; };
// the route: down the street at the height of its first-floor sills, through the square past its stalls, down the
// lane (its windows 5 m off either side), out along the cottages' road, along the walled road past the last lamp and
// out over the gate in its south wall; then the moor's way: over the long pool's ice down its long axis, between the
// two tors at its far end, past the hut's lit wall HUT.pass metres off, and from there straight for the tower: over
// the bend to the cliff's brink, down across the cove and out between the skerries; then round the tower by the east and south TOWER.r metres from
// its axis, out on the ship's lee (south) side, in on her lee quarter at a slant, along her at SHIP.off metres
// from her side at the height of her main yard, and down past her bow, straight and level, to the ring.
// EVERY KNOT OF THE MOOR AND THE COAST STANDS BY A REASON OF THE PLACE, and every height of the moor is LINE.over
// above the land's level under the knot (moorLevel), the hut's knot LINE.hut above the hut's floor.
// Returns the knots and the index of each named place among them.
export function routePoints() {
  const P = [], K = {}, add = (name, p) => { K[name] = P.length; P.push(p); };
  const onMoor = (x, z) => [x, moorLevel(x, z) + LINE.over, z];
  add('entry', SPW(0, 0, EYE)); add('street', SPW(50, 0, EYE)); add('level', SPW(100, 0, EYE));
  add('square', SPW((TOWN.s1 + TOWN.sq) / 2, -3.2, EYE)); add('lane', SPW(TOWN.sq + 14, 0.5, EYE)); add('laneEnd', SPW(TOWN.lane - 4, 0.5, EYE));
  // (along the cottages' road and past the last lamp: LINE.eaves over the street's level, a little over the eaves)
  add('cottages', SPW((TOWN.lane + TOWN.cot) / 2, -1.5, LINE.eaves)); add('lamp', SPW(TOWN.lamp + 2, -WALL_L, LINE.eaves));
  // over the middle of the gate in the road's south wall (the knot keeps the name of what happens there)
  add('offRoad', onMoor(GATE[0], GATE[1]));
  // over the long pool's ice, on its long axis, at its middle
  add('pool', onMoor(POOL.x, POOL.z));
  // midway of the clear gap between the two tors' nearest faces
  add('stones', onMoor(...gapMid(GREAT[0], GREAT[0].w / 2, GREAT[1], GREAT[1].w / 2)));
  // abeam of the middle of the hut's lit wall, HUT.pass metres out from it along the hut's own normal
  add('hut', [HUT_ABEAM[0], HUT_Y + LINE.hut, HUT_ABEAM[1]]);
  // FROM ABEAM OF THE HUT THE LINE RUNS ON DOWN THE HUT'S SIGHTLINE, on which the tower stands: the bend and the
  // cove's knot both lie on it, the bend LINE.bend metres inland of the cliff's line (at the moor's clearance), the
  // cove's knot LINE.cove metres seaward of it, over the brink
  add('bend', onMoor(sightX(CLIFF_Z - LINE.bend), CLIFF_Z - LINE.bend)); add('cove', [sightX(CLIFF_Z + LINE.cove), CLIFF_TOP + LINE.brink, CLIFF_Z + LINE.cove]);
  // midway of the clear gap between the two skerries' nearest faces, at the lower one's height
  const sg = gapMid(SKERRIES[0], SKERRIES[0].h * SKERRY_R, SKERRIES[1], SKERRIES[1].h * SKERRY_R);
  add('skerries', [sg[0], Math.min(SKERRIES[0].h, SKERRIES[1].h), sg[1]]);
  // the ship, by her own measures: `side` is the line's z along her; the quarter knot lies one of her lengths astern of
  // her stern on that line; the lee knot lies due south of the reef's west end, where a run on a slant of SHIP.slant
  // to her course comes down on the quarter knot (SHIP.wide metres of it)
  const side = SHIP.z + SHIP.beam / 2 + SHIP.off, len = SHIP.stern - SHIP.bow, qx = SHIP.stern + len;
  const lee = [TOWER.x - TOWER.reef, 15, side + SHIP.wide * Math.sin(SHIP.slant)];
  // round the tower. The bearings are read off places: TOWER.slit, the face the keepers' slit looks out of; bL, where
  // the lee knot lies from the tower's axis. Abeam of the slit the line is at TOWER.r; it holds that through the first
  // third of the sweep from the slit to the lee knot's bearing and opens through the second
  const bL = towerBearing(lee), rL = Math.hypot(lee[0] - TOWER.x, lee[2] - TOWER.z);
  add('east', byTower(TOWER.slit, TOWER.r, 11));
  add('round', byTower(TOWER.slit + (bL - TOWER.slit) / 3, TOWER.r, 12)); add('south', byTower(TOWER.slit + (bL - TOWER.slit) * 2 / 3, (2 * TOWER.r + rL) / 3, 13.5));
  add('lee', lee); add('quarter', [qx, SHIP.yard, side]);
  add('stern', [SHIP.stern, SHIP.yard, side]); add('waist', [(SHIP.stern + SHIP.bow) / 2, SHIP.yard, side]); add('bow', [SHIP.bow, SHIP.yard - 1, side]);
  // down from her yard's height to the ring's, then 60 m straight and level
  add('straight', [RING.x + 60, RING.y, RING.z]); add('ring', [RING.x, RING.y, RING.z]);
  return { P, K };
}

// The route's places: RT, the route sampled every metre (x, y, z); S, the metres flown at each named knot, at the
// places of the town (the point of the route abeam of a place of the street's frame) and at the cliff's edge.
export function routePlaces(RP, path) {
  const L = path.length, _p = new THREE.Vector3(), RT = new Float32Array((Math.floor(L) + 1) * 3);
  for (let i = 0; i * 3 < RT.length; i++) { path.posAtDist(i, _p); RT[i * 3] = _p.x; RT[i * 3 + 1] = _p.y; RT[i * 3 + 2] = _p.z; }
  const sNear = (x, y, z) => {
    let best = Infinity, bs = 0;
    for (let i = 0; i < RT.length; i += 3) { const d = (RT[i] - x) ** 2 + (RT[i + 1] - y) ** 2 + (RT[i + 2] - z) ** 2; if (d < best) { best = d; bs = i / 3; } }
    return bs;
  };
  const S = { cliff: 0 };
  for (const name of Object.keys(RP.K)) S[name] = sNear(...RP.P[RP.K[name]]);
  for (const [name, s] of [['s1', TOWN.s1], ['sq', TOWN.sq], ['laneOut', TOWN.lane], ['cot', TOWN.cot], ['lastLamp', TOWN.lamp]]) S[name] = sNear(...SPW(s, 0, EYE));
  for (let i = Math.round(S.hut); i < S.cove; i++) { if (RT[i * 3 + 2] >= CLIFF_Z) { S.cliff = i; break; } }
  // places the looks and the pace run between: `sight`, where the hut's open door first lies within HUT.sight metres
  // (straight) of the line; `yardEnd`, abeam of the far end of the hut's yard wall; `wakeEnd`, abeam of where the
  // ship's wake ends astern of her. (sNear goes back with them: the build asks it where its BUILT marks lie abeam.)
  const door = hutAt(HUT_DOOR.a, HUT.d / 2, 1.0);
  S.sight = S.hut;
  for (let i = Math.round(S.offRoad); i < S.hut; i++) { if (Math.hypot(RT[i * 3] - door[0], RT[i * 3 + 2] - door[2]) <= HUT.sight) { S.sight = i; break; } }
  S.yardEnd = sNear(...hutAt(HUT.w / 2 + HUT_YARD * 1.5, HUT.d / 2 + HUT.pass, LINE.hut));
  S.wakeEnd = sNear(SHIP.stern + SHIP.wake, SHIP.yard, SHIP.z + SHIP.beam / 2 + SHIP.off);
  return { RT, S, sNear };
}

// a point of the hut's frame: a metres along its lit wall from the hut's middle, b metres out from its middle toward
// the lit side, y metres over its floor
const HUT_Y = 32.1;
const hutAt = (a, b, y) => [HUT.x + HUT.U[0] * a + HUT.N[0] * b, HUT_Y + y, HUT.z + HUT.U[1] * a + HUT.N[1] * b];
// the hut's open door (its middle along the wall, its width and height) and its one small window
const HUT_DOOR = { a: 1.6, w: 1.15, h: 1.9 }, HUT_WIN = { a: -3.4, w: 0.8, h: 0.7, y: 1.25 };
// the hearth stands against the back wall, HUT_FIRE_A metres along from the hut's middle: seen through the window
// from the whole of the line's approach
const HUT_FIRE_A = -1.0;
// the yard lies off the hut's far end (the end away from the line's approach): its wall runs HUT_YARD metres out
// from the lit wall's far corner and half as far again along (the line passes outside it)
const HUT_YARD = 4.6;
// the last cottage: the one on the road's south side that ends the town; its front stands `back` metres from the
// road's middle and its nearer window `s` metres along the road
const LAST_COT = { s0: TOWN.cot - 13, s1: TOWN.cot - 4, back: 13.5 };

// the walled road, by the road's own frame (s along it from the entry, l north of its middle): drystone walls on both
// verges from the last cottage for WALLS.run metres; in the south wall a gate of bars, where the cart track leaves the
// road for the hut (and the line with it: the sheep's reach of the wall's lee begins 14 m past the gate, where the
// line has drawn off from it); a slab bridge where a frozen runnel crosses the road; a stone trough in the south wall's lee; a
// fold south of the road
const WALLS = { l: WALL_L, s0: TOWN.cot + 1, run: HILL[1], h: 1.15, gate: TOWN.cot + MOOR.gate, gateW: 3.2, runnel: TOWN.cot + 14, trough: TOWN.cot + 29, sheep: [TOWN.cot + MOOR.gate + 14, TOWN.cot + MOOR.gate + 60] };
const FOLD = { s: TOWN.cot + 55, l: -34, w: 12, d: 9, h: 1.3 };

// The pace and the looks, by places of the route (S: metres flown at each place; L: the route's length).
// The pace: slow through the town; quicker along the walled road; slow from where the hut's door has come clear until
// the hut is abeam; quick over the moor's end and off the cliff; slow in toward the tower and round it; quickest over
// the open water between the tower's south side and the ship's lee quarter; slow along her; near 1 into the ring.
// The looks: one pull at a time, each at a standing thing. EVERY LOOK TAKES HOLD AND LETS GO BETWEEN PLACES OF THE
// ROUTE: it begins at `from`, is gone at `to`, and begins to let go at `ease` (it takes hold over as many metres as
// it lets go over); no look has a share of its window given as a number.
// M, from what the build has BUILT: cot, the middle of the last cottage's lit pane, and cotS, the metres flown where
// it lies abeam; door, the middle of the hut's open door; towerS, the metres flown where the tower first stands
// clear of the land (see the build: a sight test from the line's eyes).
// the look to the ship pulls at a point of her `fore` of the way from stern to bow, y metres over the sea (her bows:
// so that she stays before the eye the whole way along her)
const SHIP_LOOK = { fore: 1, y: 14 };
export const TOWER_LOOK = [TOWER.x, TOWER.top * 0.55, TOWER.z];
export function looksOf(S, L, M) {
  const paceS = (s) => {
    let p = 0.6;
    // (every ramp runs between two named places of the route)
    p = lerp(p, 1.0, smoothstep(S.lamp, S.offRoad, s));
    p = lerp(p, 0.62, smoothstep(S.sight, S.pool, s));
    p = lerp(p, 0.5, smoothstep(S.stones, S.hut, s));
    p = lerp(p, 1.2, smoothstep(S.hut, S.bend, s));
    p = lerp(p, 0.66, smoothstep(S.skerries, S.east, s));
    p = lerp(p, 1.5, smoothstep(S.south, S.lee, s));
    p = lerp(p, 0.62, smoothstep(S.wakeEnd, S.quarter, s));
    p = lerp(p, 0.95, smoothstep(S.bow, S.ring, s));
    return p;
  };
  const ship = [lerp(SHIP.stern, SHIP.bow, SHIP_LOOK.fore), SHIP_LOOK.y, SHIP.z];
  const rows = [
    // the last cottage's lit window, from the lane's end until it is abeam; it lets go from the middle of the
    // cottages' road (the knot there)
    { at: M.cot, from: S.laneEnd, ease: S.cottages, to: M.cotS, weight: 0.4 },
    // the hut's open door, from where it first lies within the hut's sight until the hut is abeam; it lets go from
    // between the tors
    { at: M.door, from: S.sight, ease: S.stones, to: S.hut, weight: 0.5 },
    // the tower, from where it first stands clear of the land past the hut (so the look is on well before the line
    // dives from the cliff's edge and holds the gaze level through the dive); it lets go from abeam of the keepers'
    // slit, where the look to the ship begins, and is gone at the south knot of the rounding
    { at: TOWER_LOOK, from: M.towerS, ease: S.east, to: S.south, weight: 0.66, steady: true },
    // the ship (her bows: see SHIP_LOOK), from abeam of the keepers' slit (she lies beyond the tower from there on);
    // the look holds whole along her lee side until her waist is abeam and lets go from there to the straight
    { at: ship, from: S.east, ease: S.waist, to: S.straight, weight: 0.52, steady: true },
  ];
  const pois = rows.map((q) => ({ at: q.at, from: q.from / L, to: q.to / L, weight: q.weight, fade: (q.to - q.ease) / Math.max(q.to - q.from, 1), steady: q.steady }));
  return { pois, paceS };
}

// ---- what a lit face takes from the PLACE it stands in (its own world x, z; never the eye's, never the line's) ------
// The moon is one body for the whole world, but the cloud before it differs by place: the fronts and the snow sky
// stand before it in the town, the lid over the moor makes it a blur, at sea it is clear. The west's red lies on
// every face turned to it: the town's own dusk, strongest on the open moor, thinned at sea and never put out. The joins are ramps
// across named places: town to moor across the cottages' road (the lane's end to the last lamp), moor to sea across
// the cliff (the last great stone's z to the outer skerry's). And the hut's fire, out through its window and its
// open door: a fan from each opening, widening with the metres from it, cut off by the hut's own wall, lying on the
// faces turned to it, long on the snow and gone by PLACE_LIT.reach[1] m. zStone: the last great stone's z, known once the land is laid.
// THE TOWN'S OWN LIGHT (the street, the square, the lane and the cottages' road are lit by nothing else but the moon
// and the west): `floor`, the strength of the windows' and the lit lamps' light where it lies on the trodden snow;
// `glow`, the gold of the lit town on what stands in it; `pool`, where light from several fires meets on the snow it
// does not sum without end: up to pool[0] it lies as it falls, past that it nears pool[1] and never passes it (snow
// under a lamp before a lit shop keeps its ruts and its grain)
const TOWN_LIT = { floor: 2.2, glow: 3.1, pool: [0.4, 0.9] };
const PLACE_LIT = { moon: [0.3, 0.9, 1], red: [1, 2.0, 0.5], fire: 9, reach: [28, 46], fall: 110 };
// placeOf: [the town's share, the sea's share] of a world place (x, z)
const placeOfGLSL = (zStone) => /* glsl */`
vec2 placeOf(vec2 p){
  float s = dot(p - vec2(${OX.toFixed(1)}, 0.), vec2(${AX0[0].toFixed(5)}, ${AX0[2].toFixed(5)}));
  return vec2(1. - smoothstep(${TOWN.lane.toFixed(1)}, ${TOWN.lamp.toFixed(1)}, s), smoothstep(${zStone.toFixed(1)}, ${SKERRIES[1].z.toFixed(1)}, p.y));
}
`;
// THE SKY BY PLACE: every point of the sky takes its cloud, its sleet and the thinning of the west's red from the
// WORLD PLACE UNDER IT: where the sight line from the eye meets the cloud's deck, SKY.deck metres over the sea (no
// further off than SKY.reach). underSky: that place. skyOf: [the town's share (on the land), the sea's, the far sea's] of what
// stands over a place at the deck's height: the same joins as the land's weather (the cottages' road; the cliff; the
// water between the reef's west end and the ship's stern), each spread SKY.ramp metres either way, as weather at
// that height is (a join 100 m wide would stand in the sky as a wall).
// (RED_SCALE_C: the degrees over which the west's red falls to 1/e of its strength, upward)
// (RED_SIDE_C: the square of the degrees from due west over which it falls to 1/e, to either hand)
const RED_SCALE_C = 4.6, RED_SIDE_C = 3400;
const SKY = { deck: 700, reach: 5000, ramp: 900, cover: [0.3, 0.9], redThin: [0.6, 0.2] };
const SKY_UNDER = /* glsl */`
vec2 underSky(vec3 d, vec3 eye){ vec2 run = d.xz*((${SKY.deck.toFixed(1)} - eye.y)/max(d.y, .02)); return eye.xz + run*min(1., ${SKY.reach.toFixed(1)}/max(length(run), 1.)); }
vec3 skyOf(vec2 p){
  float s = dot(p - vec2(${OX.toFixed(1)}, 0.), vec2(${AX0[0].toFixed(5)}, ${AX0[2].toFixed(5)}));
  float sea = smoothstep(${(CLIFF_Z - SKY.ramp).toFixed(1)}, ${(SKERRIES[1].z + SKY.ramp).toFixed(1)}, p.y);
  return vec3((1. - smoothstep(${(TOWN.lane - SKY.ramp).toFixed(1)}, ${(TOWN.lamp + SKY.ramp).toFixed(1)}, s))*(1. - sea), sea, sea*(1. - smoothstep(${(SHIP.stern - SKY.ramp).toFixed(1)}, ${(TOWER.x - TOWER.reef + SKY.ramp).toFixed(1)}, p.x)));
}
`;
// THE WEATHER'S CLOUD along a sight line d from the eye (the sky's dome draws it; the ice mirrors it): masses in the
// sky's own frame (a noise of the direction: the same size every way and at every height), drifting with the wind;
// how much of it stands at a sky point is the place's under that point (sp: skyOf of it): none over the town, some
// over the moor, heavy over the sea; away from the town it closes low down; rents open about the moon. Its body is the shade of
// the town's cloud, lit on the side turned to the moon, with a silver rim where it thins.
// Returns [colour, cover]. ma: degrees from the moon; elp: degrees up
const CLOUD_FACE = { from: 45, to: 110, k: 1, c: [0.225, 0.265, 0.365] };
const SKY_CLOUD = /* glsl */`
vec4 skyCloud(vec3 d, vec3 sp, vec3 moonDir, vec2 wind, float time, float openK, float ma, float elp){
  float heavy = (1. - sp.x)*mix(${SKY.cover[0].toFixed(2)}, ${SKY.cover[1].toFixed(2)}, sp.y);
  vec3 q = d*4.4 + vec3(wind.x, 0., wind.y)*time*.008, qm = q + moonDir*.11;
  float n = vnoise(q)*.52 + vnoise(q*2.2 + 7.)*.28 + vnoise(q*4.9 + 13.)*.15 + vnoise(q*10.7 + 3.)*.05;
  float nm = vnoise(qm)*.5 + vnoise(qm*2.2 + 7.)*.27 + vnoise(qm*4.9 + 13.)*.15;
  float open = (1. - smoothstep(8., 46., ma))*(.5 + .5*openK);
  float th = mix(.82, .33, heavy) + .2*open - .36*(1. - sp.x)*(1. - smoothstep(4., 30., elp));
  float aC = smoothstep(th - .04, th + .06, n)*smoothstep(0., .12, heavy)*smoothstep(3., 9., ma);
  float rim = aC*(1. - smoothstep(th + .02, th + .24, n)), lit = smoothstep(0., .1, n - nm)*(1. - .75*smoothstep(th + .04, th + .3, n));
  vec3 c = mix(vec3(.014, .02, .045), vec3(.1, .125, .19), lit)*(.7 + .9*exp(-clamp(ma/38., 0., 30.)));
  // across the sky from the moon a mass takes her light full on its face: pale where it is thick, with the night
  // still showing in its torn edges (toward her it stands dark against her, lit only at its rims, as above)
  float face = smoothstep(${CLOUD_FACE.from.toFixed(1)}, ${CLOUD_FACE.to.toFixed(1)}, ma)*(.3 + .7*smoothstep(th + .02, th + .3, n))*(.75 + .25*lit);
  c = mix(c, vec3(${CLOUD_FACE.c.join(', ')}), face*${CLOUD_FACE.k.toFixed(2)});
  c += vec3(.75, .82, .95)*rim*(.02 + .4*exp(-clamp(ma/20., 0., 30.)));
  return vec4(c, aC);
}
`;
const placeGLSL = (zStone) => /* glsl */`
uniform vec3 uPMoonDir, uPMoonCol, uPRedCol; uniform float uPTime, uPFire;
${placeOfGLSL(zStone)}
float fireFan(vec3 wp, vec3 nW, vec3 src, float hw, float spread){
  const vec2 N = vec2(${HUT.N[0].toFixed(5)}, ${HUT.N[1].toFixed(5)});
  vec3 v = wp - src; float dn = dot(v.xz, N), lat = abs(dot(v.xz, vec2(-N.y, N.x))), d2 = dot(v, v), d = sqrt(max(d2, 1e-4));
  float fan = smoothstep(0., .5, dn)*(1. - smoothstep(hw + dn*spread*.6, hw + dn*spread + .5, lat))*(1. - smoothstep(${PLACE_LIT.reach[0].toFixed(1)}, ${PLACE_LIT.reach[1].toFixed(1)}, d))/(1. + d2/${PLACE_LIT.fall.toFixed(1)});
  return fan*clamp(dot(nW, -v/d)*3. + .3, 0., 1.);
}
// irradiance to add to what the scene's own lights have given the face at wp whose world normal is nW
vec3 placeLight(vec3 wp, vec3 nW){
  vec2 pl = placeOf(wp.xz);
  float mk = mix(mix(${PLACE_LIT.moon[1].toFixed(2)}, ${PLACE_LIT.moon[0].toFixed(2)}, pl.x), ${PLACE_LIT.moon[2].toFixed(2)}, pl.y) - 1.;
  vec3 irr = mk*uPMoonCol*max(dot(nW, uPMoonDir), 0.);
  irr += uPRedCol*mix(mix(${PLACE_LIT.red[1].toFixed(2)}, ${PLACE_LIT.red[0].toFixed(2)}, pl.x), ${PLACE_LIT.red[2].toFixed(2)}, pl.y)*max(dot(nW, vec3(-.9945, .1044, 0.)), 0.);
  vec3 w0 = vec3(${hutAt(HUT_WIN.a, HUT.d / 2, HUT_WIN.y).map((v) => v.toFixed(2)).join(', ')}), d0 = vec3(${hutAt(HUT_DOOR.a, HUT.d / 2, HUT_DOOR.h * 0.5).map((v) => v.toFixed(2)).join(', ')});
  float fire = fireFan(wp, nW, w0, ${(HUT_WIN.w / 2).toFixed(2)}, .62) + fireFan(wp, nW, d0, ${(HUT_DOOR.w / 2).toFixed(2)}, .9);
  irr += vec3(${FIRE.lin.map((v) => v.toFixed(3)).join(', ')})*${PLACE_LIT.fire.toFixed(1)}*fire*fireBreath(uPFire, uPTime);
  return irr;
}
`;
// the two lines that put it into a lit material's fragment shader (wp: the name of its world-position varying)
const PLACE_APPLY = (wp) => `#include <lights_fragment_end>\nreflectedLight.directDiffuse = max(reflectedLight.directDiffuse + placeLight(${wp}, inverseTransformDirection(geometryNormal, viewMatrix))*RECIPROCAL_PI*material.diffuseColor, vec3(0.));`;

// ---- the town's one lit material -------------------------------------------------------------------------------
// Brick, stone, paint, snow and the street's floor, with the fire's glow. aux of a vertex:
//   x  0 plain, 1 sooty brick, 2 snow, 3 the street's floor (ruts and trodden snow), 4 mud and rough stone,
//      5 a wall of rough unsquared stones
//   y  the fire's level on this surface (lamp glass, a lit pane's surround); on the floor: light pooled from shops and lamps
//   z  a street lamp's code (see LAMP_GLSL in the part): which round lights it, when in that round, for how long;
//      under 0: a fire that burns always. On the floor: the code of the lamp whose pool lies there
//   w  the fire's seed; on the floor: light pooled from that lamp (z says whether it is alight)
// U: uTime, uRoundNow, uRoundT (the lamplighters' rounds on the world's clock), uLighter (vec4 x 3: where each
//    lamplighter's flame is, and its level: it warms what stands within 30 m of him), uGlow (gold of the lit town on
//    what stands in it), uStreet (vec4: the street's axis x, z and the world x, z of its start), uRing (the ring's
//    place and level), uRingCol
function townMaterial(U, o = {}) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: o.roughness ?? 0.92, metalness: 0, side: o.side ?? THREE.FrontSide });
  const f = (v) => v.toFixed(1);
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aux; varying vec4 vAux; varying vec3 vWp; varying float vLamp; uniform float uTime;\n' + LAMP_GLSL)
      .replace('#include <begin_vertex>', /* glsl */`#include <begin_vertex>
vAux = aux; vLamp = lampAlight(aux.z, uTime);
#ifdef USE_INSTANCING
vWp = (modelMatrix*instanceMatrix*vec4(position, 1.)).xyz;
#else
vWp = (modelMatrix*vec4(position, 1.)).xyz;
#endif`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_VORONOI + /* glsl */`
varying vec4 vAux; varying vec3 vWp; varying float vLamp; uniform float uTime, uGlow; uniform vec2 uStreetSeed; uniform vec4 uStreet, uRing, uLighter[3]; uniform vec3 uRingCol; float townFloor = 0.;${o.place}
// the town's plan along the street's line (metres): the first street, the square, the lane's end, the last cottage;
// the middle of the cottages' row; where the line leaves the road. (The roadway narrows to a cart road, and the
// town's gold thins, from the lane's end to the middle of the row; the gold is gone where the line leaves the road)
const float T_S1 = ${f(TOWN.s1)}, T_SQ = ${f(TOWN.sq)}, T_LANE = ${f(TOWN.lane)}, T_COT = ${f(TOWN.cot)}, T_MID = ${f((TOWN.lane + TOWN.cot) / 2)}, T_OFF = ${f(OFF_ROAD)}, R_TURN = ${f(ROAD.turn)}, R_R = ${f(ROAD.R)}, R_PHI = ${ROAD.phi.toFixed(3)};`)
      .replace('#include <color_fragment>', /* glsl */`#include <color_fragment>
vec2 sq_ = vWp.xz - uStreet.zw;
float sAl = dot(sq_, uStreet.xy), sLat = dot(sq_, vec2(uStreet.y, -uStreet.x));
float inSq = smoothstep(T_S1 - 4., T_S1 + 4., sAl)*(1. - smoothstep(T_SQ - 4., T_SQ + 4., sAl)), inLane = smoothstep(T_SQ - 4., T_SQ + 4., sAl), past = smoothstep(T_LANE, T_MID, sAl);
if (vAux.x > .5 && vAux.x < 1.5) {
  float n = vnoise(vWp*vec3(1.9, 3.3, 1.9)), c = vnoise(vWp*.31 + 7.);
  float cy = vWp.y/.12, row = floor(cy), cx = (sAl + sLat)/.3 + .5*mod(row, 2.);
  float joint = max(1. - smoothstep(.0, .12, abs(fract(cy) - .5)*2. - .8), (1. - smoothstep(.0, .1, abs(fract(cx) - .5)*2. - .86)));
  float fine = 1. - smoothstep(.12, .45, fwidth(cy));
  diffuseColor.rgb *= (.66 + .42*n + .3*c)*(1. - .3*joint*fine)*(.9 + .2*hash12(vec2(row, floor(cx)))*fine);
} else if (vAux.x > 1.5 && vAux.x < 2.5) {
  diffuseColor.rgb *= .84 + .22*(vnoise(vWp*1.4)*.6 + vnoise(vWp*5.3)*.4);
} else if (vAux.x > 4.5) {
  // a wall of rough unsquared stones of every size, bedded in brown earth (or laid dry), rime in the joints
  vec3 nq = inverseTransformDirection(normalize(vNormal), viewMatrix);
  vec2 tq = abs(nq.y) > .7 ? vWp.xz : vec2(dot(vWp.xz, normalize(vec2(-nq.z, nq.x) + 1e-5)), vWp.y*1.4);
  vec3 vs = voronoi(tq*3.6 + (vnoise(tq*1.1) - .5)*1.4);
  float joint = (1. - smoothstep(.02, .09, vs.y))*(1. - smoothstep(30., 90., length(vViewPosition))), g2 = vnoise(vWp*5.3);
  vec3 stone = diffuseColor.rgb*(.7 + .55*vs.z)*(.82 + .36*g2);
  diffuseColor.rgb = mix(stone, vec3(.06, .048, .038)*(.7 + .6*g2), joint*.85);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.6, .66, .78), joint*smoothstep(.4, .7, vnoise(vWp*1.9 + 3.))*.6);
} else if (vAux.x > 3.5) {
  float st = vnoise(vWp*2.1), cl = vnoise(vWp*vec3(1.2, 3.1, 1.2) + 9.);
  diffuseColor.rgb *= .6 + .7*st;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.2, .18, .16), smoothstep(.55, .72, cl)*.55);
} else if (vAux.x > 2.5) {
  // the roadway: between the kerbs in the streets, all of the square, the cart road beyond the last fronts
  // (where the road leaves the street's line on its arc and beyond, along and across are the road's own)
  if (sAl > R_TURN) {
    float ru = sAl - R_TURN, rv = max(R_R + sLat, 1.), ra = atan(ru, rv);
    vec2 pe = vec2(sAl - R_TURN - R_R*sin(R_PHI), -sLat - R_R*(1. - cos(R_PHI)));
    if (ra <= R_PHI) { sLat = length(vec2(ru, rv)) - R_R; sAl = R_TURN + ra*R_R; }
    else { sAl = R_TURN + R_R*R_PHI + pe.x*cos(R_PHI) + pe.y*sin(R_PHI); sLat = pe.x*sin(R_PHI) - pe.y*cos(R_PHI); }
  }
  float half_ = mix(mix(mix(5.15, 40., inSq), 3.35, inLane), 2.5, past), fit = min(half_/5.15, 1.);
  // three cart tracks, each a pair of wheel ruts 1.5 m apart, wandering across the road and wearing in and out
  float c1 = (vnoise(vec2(sAl*.06, 3.)) - .5)*6.4*fit, c2 = ((vnoise(vec2(sAl*.041, 9.)) - .5)*7. + 1.)*fit, c3 = ((vnoise(vec2(sAl*.083, 17.)) - .5)*5.6 - 1.2)*fit;
  float k1 = smoothstep(.2, .5, vnoise(vec2(sAl*.027, 31.))), k2 = smoothstep(.3, .6, vnoise(vec2(sAl*.033, 37.))), k3 = smoothstep(.35, .6, vnoise(vec2(sAl*.021, 43.)));
  float rut = (1. - smoothstep(.06, .17, abs(abs(sLat - c1) - .75)))*max(k1, past);
  rut = max(rut, (1. - smoothstep(.06, .17, abs(abs(sLat - c2) - .75)))*k2);
  rut = max(rut, (1. - smoothstep(.05, .15, abs(abs(sLat - c3) - .7)))*k3);
  float churn = vnoise(vWp.xz*1.7)*.6 + vnoise(vWp.xz*5.1)*.4;
  float road = 1. - smoothstep(half_ - .25, half_ + .25, abs(sLat));
  // slush in the town; out on the moor the ruts hold ice with a white rim
  vec3 slush = mix(vec3(.2, .19, .2), vec3(.2, .27, .36), past);
  float wide = (1. - smoothstep(.1, .3, abs(abs(sLat - c1) - .75)))*past;
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.62, .68, .78), wide*(1. - rut)*.7);
  diffuseColor.rgb = mix(diffuseColor.rgb, slush, road*clamp(rut*.85 + smoothstep(.45, .8, churn)*.5*(1. - .6*past), 0., 1.));
  diffuseColor.rgb *= .88 + .2*churn;
  townFloor = 1.;
}`)
      .replace('#include <lights_fragment_end>', PLACE_APPLY('vWp'))
      .replace('#include <emissivemap_fragment>', /* glsl */`#include <emissivemap_fragment>
float lampOn = clamp(vLamp, 0., 1.);
// a lamplighter's own flame warms what stands within 30 m of him
vec3 nrmW = inverseTransformDirection(normal, viewMatrix);
for (int i = 0; i < 3; i++) {
  vec3 toL = uLighter[i].xyz - vWp; float d2 = dot(toL, toL);
  totalEmissiveRadiance += diffuseColor.rgb*fireColor(1.)*uLighter[i].w*(1. - smoothstep(320., 900., d2))/(1. + d2/7.)*(.35 + .65*max(dot(nrmW, toL/sqrt(max(d2, 1e-4))), 0.));
}
if (townFloor > .5) {
  float pooled = ${TOWN_LIT.floor.toFixed(2)}*(vAux.y*fireBreath(uStreetSeed.x, uTime) + vAux.w*lampOn*fireBreath(uStreetSeed.y, uTime));
  float over = max(pooled - ${TOWN_LIT.pool[0].toFixed(2)}, 0.);
  pooled = min(pooled, ${TOWN_LIT.pool[0].toFixed(2)}) + ${(TOWN_LIT.pool[1] - TOWN_LIT.pool[0]).toFixed(2)}*(1. - exp(-clamp(over/${(TOWN_LIT.pool[1] - TOWN_LIT.pool[0]).toFixed(2)}, 0., 30.)));
  totalEmissiveRadiance += diffuseColor.rgb*fireColor(1.)*pooled;
} else {
  totalEmissiveRadiance += fireColor(1.15)*vAux.y*lampOn*fireBreath(vAux.w, uTime);
  // the gold of the lit town on what stands in it: widest in the square, narrow in the lane, dying along the cottages.
  // It lies low; a share climbs the fronts, and more of it where they stand closer (the lane's: by the square of
  // the street's width over the lane's)
  float wIn = mix(mix(8.6, 36., inSq), 6.6, inLane), wOut = mix(mix(19., 52., inSq), 15., inLane);
  float inSt = (1. - smoothstep(wIn, wOut, abs(sLat)))*smoothstep(-48., -34., sAl)*(1. - .82*smoothstep(T_LANE, T_MID, sAl))*(1. - smoothstep(T_COT, T_OFF, sAl));
  float hgt = max(vWp.y - 40., 0.);
  // (beyond the lane the gold is the windows' and the lamps' alone and comes from low down: what looks up at the sky
  // there, the roofs' snow and the fields', takes little of it and keeps the dusk's blue, from the lane's end on)
  inSt *= 1. - .85*smoothstep(T_LANE, T_LANE + 16., sAl)*smoothstep(.45, .9, nrmW.y);
  totalEmissiveRadiance += diffuseColor.rgb*fireColor(1.)*uGlow*inSt*(exp(-clamp(hgt/3.4, 0., 30.)) + mix(.3, ${(0.3 * (FRONT / LANE_FRONT) ** 2).toFixed(2)}, inLane*(1. - smoothstep(T_LANE - 4., T_LANE + 4., sAl)))*exp(-clamp(hgt/14., 0., 30.)))*(.65 + .5*vnoise(vec2(sAl*.13, sLat*.2)));
  // the ring's own light on what stands near it
  vec3 toR = uRing.xyz - vWp; float dR = length(toR);
  totalEmissiveRadiance += diffuseColor.rgb*uRingCol*uRing.w/(1. + dR*dR/1600.)*(.2 + .8*max(dot(nrmW, toR/max(dR, .01)), 0.));
}`);
  };
  mat.customProgramCacheKey = () => 'lidp-town-r6' + (o.side ?? 0) + o.placeKey;
  return mat;
}

// ---- one shader for every window ---------------------------------------------------------------------------------
// Each window is a quad on its wall with a cheap room behind it (a box the eye's ray is carried into): the fire on the
// back wall, the walls in its light, people as dark shapes between the pane and the fire, red curtains half drawn; or
// a drawn blind with the shadows of guests crossing it; or a dark pane, darker than the brick; or a shop's window
// with shelves of goods and, in some, a bowl of gold and silver fish. Kinds: 0 fire, 1 blind, 2 dark, 3 shop,
// 4 candle, 5 the hut's window, 6 a door's fanlight, 7 a church window of plain coloured glass under a pointed arch,
// 8 a shop's door that opens on the light within and shuts again, 9 the hut's door, which stands open, 10 a steady
// fire room (as 0, but its curtain is never drawn across: its pane burns at every clock). A lit room behaves the same
// at every distance: its fire flickers and, in some, a curtain is drawn across and back; `sway`: where in its sway
// the hut's one swaying figure stands at the clock's zero. list: [{ c, out: [x,y,z], w, h, kind, seed, level }]
function makeWindows(list, time, sway, hutSeed) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const cen = new Float32Array(n * 3), frm = new Float32Array(n * 4), knd = new Float32Array(n * 3);
  list.forEach((w, i) => { cen.set(w.c, i * 3); frm.set([w.out[0], w.out[2], w.w, w.h], i * 4); knd.set([w.kind, w.seed, w.level ?? 1], i * 3); });
  g.setAttribute('aCen', new THREE.InstancedBufferAttribute(cen, 3)); g.setAttribute('aFrm', new THREE.InstancedBufferAttribute(frm, 4)); g.setAttribute('aKnd', new THREE.InstancedBufferAttribute(knd, 3));
  g.instanceCount = n;
  const uniforms = { ...fx.fogUniforms(), uTime: time, uSway: { value: sway }, uHutSeed: { value: hutSeed }, uCold: { value: new THREE.Color('#31456e') } };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute vec3 aCen, aKnd; attribute vec4 aFrm;
varying vec2 vP, vHalf; varying vec3 vE, vK;
void main(){
  vec3 nrm = vec3(aFrm.x, 0., aFrm.y), right = vec3(nrm.z, 0., -nrm.x);
  vec3 wp = aCen + right*(position.x*aFrm.z*.5) + vec3(0., position.y*aFrm.w*.5, 0.);
  vec3 E = wp - cameraPosition;
  vE = vec3(dot(E, right), E.y, dot(E, nrm));
  vP = position.xy*aFrm.zw*.5; vHalf = aFrm.zw*.5; vK = aKnd;
  vec4 mvPosition = viewMatrix*vec4(wp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FOG_PARS_FRAG + /* glsl */`
uniform float uTime, uSway, uHutSeed; uniform vec3 uCold;
varying vec2 vP, vHalf; varying vec3 vE, vK;
// a head and shoulders seen against the light: 0..1
float figure(vec2 p, vec2 c, float r, float soft){
  float head = 1. - smoothstep(r*(1. - soft), r*(1. + soft), length(p - c));
  vec2 q = p - c + vec2(0., r*1.25);
  float sh = (1. - smoothstep(r*(1.75 - soft), r*(1.75 + soft), abs(q.x) + max(q.y, 0.)*1.6))*(1. - smoothstep(-r*soft, r*soft, q.y - r*.35));
  return max(head, sh);
}
void main(){
  // (the hut's window, kind 5, and its open door, kind 9, look into ONE room: for them vK.y is the opening's place
  // along the hut's wall, and both breathe with the one fire)
  float kind = vK.x, isHDoor = step(8.5, kind)*step(kind, 9.5), isSteady = step(9.5, kind), isHut = step(4.5, kind)*step(kind, 5.5) + isHDoor, hutA = vK.y, seed = mix(vK.y, uHutSeed, isHut);
  float isBlind = step(.5, kind)*step(kind, 1.5), isDark = step(1.5, kind)*step(kind, 2.5), isShop = step(2.5, kind)*step(kind, 3.5);
  float isCandle = step(3.5, kind)*step(kind, 4.5), isFan = step(5.5, kind)*step(kind, 6.5);
  float isGlass = step(6.5, kind)*step(kind, 7.5), isDoor = step(7.5, kind)*(1. - isHDoor);
  float isRoom = 1. - max(max(isBlind, isDark), max(isFan, max(isGlass, isDoor)));
  vec2 hs = max(vHalf, vec2(.01));
  vec3 d = normalize(vE); d.z = min(d.z, -.06);
  float breath = fireBreath(seed, uTime);
  // the room: depth, half width, floor and ceiling
  float D = mix(3.3, 1.5, isShop), hw = mix(1.9, hs.x + .3, isShop), ox = (hash11(seed*7.1 + 1.) - .5)*1.2*(1. - isShop);
  float yf = -(hs.y + .9), yc = hs.y + .5;
  vec3 p0 = vec3(vP, 0.);
  // the hut's one room, in the hut's own frame: across from its middle, up from its floor, in from the panes
  float hcy = mix(${HUT_WIN.y.toFixed(2)}, ${(HUT_DOOR.h / 2).toFixed(2)}, isHDoor);
  D = mix(D, ${(HUT.d - 0.95).toFixed(2)}, isHut); hw = mix(hw, ${(HUT.w / 2 - 0.5).toFixed(2)}, isHut); ox = mix(ox, 0., isHut); yf = mix(yf, -hcy, isHut); yc = mix(yc, 2.45 - hcy, isHut);
  p0.x += hutA*isHut;
  float sx = step(0., d.x)*2. - 1., sy = step(0., d.y)*2. - 1.;
  float tb = -D/d.z, tx = (ox + sx*hw - p0.x)/(sx*max(abs(d.x), 1e-4)), ty = (mix(yf, yc, step(0., d.y)) - p0.y)/(sy*max(abs(d.y), 1e-4));
  float t = min(tb, min(tx, ty));
  vec3 hit = p0 + d*t;
  float onBack = step(tb, t + 1e-4), onSide = (1. - onBack)*step(tx, t + 1e-4), onFC = (1. - onBack)*(1. - onSide);
  float fxp = mix(ox + (hash11(seed*3.3 + 2.) - .5)*1.5*(1. - isShop), ${HUT_FIRE_A.toFixed(2)}, isHut);
  vec3 F = vec3(fxp, yf + mix(1.1, .55, isHut), -D + .3);
  F = mix(F, vec3(0., yc - .35, -D*.45), isShop); F = mix(F, vec3(fxp*.4, yf + 1.05, -D*.55), isCandle);
  float I = mix(mix(mix(1.9, 3.0, isShop), .6, isCandle), 2.2, isHut);
  vec3 Lv = hit - F; float att = I*breath/(.35 + dot(Lv, Lv)*mix(.7, .13, isHut));
  float h1 = hash11(seed*11.3 + 3.), h2 = hash11(seed*17.9 + 4.);
  vec3 paper = mix(mix(vec3(.5, .3, .2), vec3(.4, .42, .26), step(.5, h1)), vec3(.64, .56, .42), h2*.7);
  paper = mix(paper, vec3(.62, .52, .34), isShop); paper = mix(paper, vec3(.3, .24, .18), isHut);
  vec3 base = paper*mix(1., .55, step(hit.y, yf + .95)*(1. - isShop));
  base = mix(base, paper*.82, onSide);
  base = mix(base, mix(vec3(.13, .085, .05), mix(vec3(.5, .46, .4), vec3(.15, .1, .065), isHut), step(0., d.y)), onFC);
  // a shop's shelves of goods on its back wall
  vec2 cell = vec2(hit.x/.24, (hit.y - yf)/.52), ci = floor(cell), cf = fract(cell);
  float gh = hash12(ci + seed*31.);
  vec3 gcol = mix(mix(vec3(.85, .38, .06), vec3(.62, .08, .06), step(.4, gh)), mix(vec3(.4, .5, .12), vec3(.8, .62, .12), step(.8, gh)), step(.62, gh));
  float disc = (1. - smoothstep(.3, .38, length((cf - vec2(.5, .36))*vec2(1., 2.1))))*step(.12, gh);
  base = mix(base, mix(mix(base, vec3(.2, .13, .07), step(cf.y, .1)), gcol, disc), isShop*onBack);
  vec3 col = base*att*fireColor(1.15);
  // the hearth and its flames (rooms with a fire)
  float hearth = onBack*(1. - isShop)*(1. - isCandle);
  float ax = abs(hit.x - fxp), hy = hit.y - yf - mix(.55, .1, isHut);
  col = mix(col, vec3(.4, .38, .36)*att*fireColor(1.), hearth*step(ax, .8)*step(hy, 1.3));
  float fl = vnoise(vec2(hit.x*7., hy*5. - uTime*2.6))*.6 + vnoise(vec2(hit.x*17., hy*11. - uTime*4.3))*.4;
  float flame = (1. - smoothstep(.12, .9, hy + (fl - .5)*.5))*(1. - smoothstep(.28, .44, ax));
  col = mix(col, fireColor(.5 + 1.6*flame*fl)*(1. + 5.*flame)*breath, hearth*step(ax, .44)*step(hy, .9));
  // people between the pane and the fire
  float zs = mix(-1.25, -.7, isShop), ts = zs/d.z; vec2 ps = p0.xy + d.xy*ts;
  float nf = mix(mix(floor(hash11(seed*5.7 + 5.)*3.4), step(.55, h2), isShop), 0., isHut), m = 0.;
  for (int i = 0; i < 4; i++) {
    float fi = float(i), sway = sin(uTime*(.5 + .17*fi) + seed*20. + fi*2.1);
    vec2 c = vec2(ox + (fi - (nf - 1.)*.5)*mix(.62, .42, isHut) + .1*sway*(1. + isHut*step(fi, .5)), yf + mix(1.95, 1.12, isHut) - .2*hash11(seed*3. + fi));
    m = max(m, figure(ps, c, mix(.1, .115, isHut), .12)*step(fi + .5, nf));
  }
  // a table between the pane and the fire: its cloth catches a little of the light, its legs are dark
  float tz = zs - .25, tt = tz/d.z; vec2 pt = p0.xy + d.xy*tt; float tx0 = abs(pt.x - ox - .15);
  float cloth = step(tx0, .62)*step(abs(pt.y - (yf + .8)), .05), legs = step(abs(tx0 - .52), .04)*step(pt.y, yf + .78)*step(yf, pt.y);
  col = mix(col, vec3(.42, .36, .27)*att*.6 + vec3(.02, .012, .006), cloth*step(tt, t)*(1. - isShop)*(1. - isCandle)*(1. - isHut));
  col = mix(col, vec3(.01, .006, .003), legs*step(tt, t)*(1. - isShop)*(1. - isCandle)*(1. - isHut));
  col = mix(col, col*.05 + vec3(.012, .006, .003), m*step(ts, t)*.95);
  // the hut's people: plain dark shapes seated in a half ring round the fire, none turned to us; the one at the
  // fire's far side sways (a habit on the world's clock)
  float hm = 0.;
  for (int i = 0; i < 6; i++) {
    float fi = float(i), th = 3.1416*(fi + .5)/6., rr = 1.5 + .3*hash11(fi*3.7 + 1.), small = step(3.5, fi)*step(fi, 4.5);
    float fz = min(-D + .45 + rr*sin(th), -.5), tf = fz/d.z; vec2 pf = p0.xy + d.xy*tf;
    float sway = .08*sin(uTime*.85 + uSway)*step(fi, .5);
    hm = max(hm, figure(pf, vec2(fxp + rr*cos(th)*1.3 + sway, yf + mix(mix(.95, 1.2, hash11(fi*5.1 + 2.)), .68, small)), mix(.14, .1, small), .12)*step(tf, t));
  }
  col = mix(col, col*.04 + vec3(.012, .006, .003), hm*.96*isHut);
  // the fire's flicker lies on the whole room, the same at every distance (a lit window has ONE behaviour: nothing of
  // it reads how far the eye is)
  col *= 1. + .2*(vnoise(vec2(uTime*3.1, seed*40.)) - .5)*(1. - isShop)*(1. - isHut);
  // a bowl of gold and silver fish in some shop windows
  float bowl = isShop*step(.7, h1);
  vec2 pb = p0.xy + d.xy*(-.28/d.z), bc = vec2(hs.x*(h2 - .5)*1.3, -hs.y + .34);
  float bl = length(pb - bc), inb = (1. - smoothstep(.25, .27, bl))*bowl;
  col = mix(col, col*vec3(.8, .92, 1.) + vec3(.05, .06, .07), inb*.55);
  for (int k = 0; k < 2; k++) {
    // (each bowl's fish swim on a phase of the bowl's own)
    float a = uTime*(.9 + .2*float(k)) + float(k)*3.3 + seed*61., e = length((pb - bc - vec2(cos(a)*.15, sin(a*2.)*.04 - .03))*vec2(1., 2.3));
    col = mix(col, mix(vec3(2.6, 1.3, .2), vec3(1.7, 1.8, 2.), float(k)), (1. - smoothstep(.03, .058, e))*inb);
  }
  col += vec3(.5, .45, .35)*inb*smoothstep(.2, .25, bl)*.5 + vec3(.6)*inb*(1. - smoothstep(.02, .05, length(pb - bc - vec2(-.1, .12))));
  // red curtains half drawn, a pelmet over them
  float cw = hs.x*(.2 + .2*hash11(seed*13.1 + 6.))*step(.42, hash11(seed*23.7 + 7.));
  // in some rooms a curtain is being drawn right across, and back (never in a steady room, kind 10: its pane burns
  // at every clock)
  cw *= 1. + 3.2*smoothstep(.2, .8, .5 + .5*sin(uTime*.4 + seed*50.))*step(.72, hash11(seed*41.3 + 2.))*(1. - isSteady);
  float folds = .5 + .5*sin(vP.x*36. + sin(vP.y*2.3)*1.6);
  float cur = max(smoothstep(hs.x - cw - .02, hs.x - cw + .02, abs(vP.x)), step(hs.y - .17, vP.y))*isRoom*(1. - isShop)*(1. - isHut);
  col = mix(col, vec3(.55, .05, .06)*(.12 + .4*folds)*breath*I*.4, cur);
  // a drawn blind with the shadows of guests crossing it
  vec3 blind = fireColor(1.2)*(1.05 + .25*vnoise(vP*vec2(70., 3.)))*(.72 + .28*(1. - abs(vP.y)/hs.y))*breath;
  float bm = 0.;
  for (int i = 0; i < 3; i++) {
    float fi = float(i), dir = step(.5, hash11(seed*9. + fi))*2. - 1.;
    vec2 c = vec2(hs.x*1.35*sin(uTime*(.17 + .06*fi)*dir + seed*17. + fi*2.4), -hs.y*.1 + .12*fi);
    bm = max(bm, figure(vP, c, .19, .3)*step(fi + .5, 1. + floor(h1*2.99)));
  }
  col = mix(col, blind*(1. - .74*bm), isBlind);
  // a dark pane: darker than the brick, with the cold sky faint in it
  col = mix(col, vec3(.004, .005, .009) + uCold*(.035 + .1*(1. - abs(d.z)))*(.6 + .4*vP.y/hs.y), isDark);
  col = mix(col, fireColor(1.2)*1.3*breath*(.65 + .35*vnoise(vP*9. + seed*30.)), isFan);
  // plain coloured glass: small lozenges of dull red, blue, green and gold in leads, lit from within; two stone
  // mullions; stone outside the pointed arch
  vec2 gq = vP/.4, dq = vec2(gq.x + gq.y, gq.x - gq.y), df = fract(dq); float gh2 = hash12(floor(dq) + seed*7.);
  vec3 gc = mix(mix(vec3(.8, .1, .06), vec3(.1, .22, .8), step(.3, gh2)), mix(vec3(.12, .5, .2), vec3(.95, .62, .12), step(.78, gh2)), step(.55, gh2));
  float lead = 1. - smoothstep(.05, .11, min(min(df.x, 1. - df.x), min(df.y, 1. - df.y)));
  vec3 glass = mix(gc*(.9 + .9*vnoise(vP*2.3 + seed*9.))*(.75 + .25*breath)*1.7, vec3(.012), lead);
  float spring = hs.y - 1.732*hs.x, inArch = 1. - step(spring, vP.y)*step(2.*hs.x, length(vec2(abs(vP.x) + hs.x, vP.y - spring)));
  float mull = 1. - smoothstep(.07, .1, abs(abs(vP.x) - hs.x/3.));
  glass = mix(glass, vec3(.03, .03, .034), max(mull*step(vP.y, spring + hs.x*.9), 1. - smoothstep(.0, .12, 2.*hs.x - length(vec2(abs(vP.x) + hs.x, max(vP.y - spring, 0.))))));
  col = mix(col, mix(vec3(.045, .045, .05)*(.7 + .6*vnoise(vP*1.7)), glass, inArch), isGlass);
  // a door that opens on the light within, stands open a while with someone in it, and shuts
  float dper = 7. + 6.*hash11(seed*5.3 + 1.), dph = fract(uTime/dper + seed*7.), dopen = smoothstep(0., .07, dph)*(1. - smoothstep(.34, .42, dph));
  float lit = step(hs.x - 2.*hs.x*dopen, vP.x);
  vec3 within = fireColor(1.25)*(1.5 + .5*vP.y/hs.y)*breath;
  float who = max(figure(vP, vec2(hs.x*(1. - dopen), hs.y*.42), .13, .15), step(abs(vP.x - hs.x*(1. - dopen)), .21)*step(vP.y, hs.y*.42 - .2))*step(.5, hash11(seed*9.7));
  col = mix(col, mix(vec3(.028, .02, .016)*(.8 + .4*step(.5, fract(vP.x*4.))), within*(1. - .93*who), lit), isDoor);
  // glazing bars and the frame
  vec2 cells = mix(vec2(3., 4.), vec2(max(floor(hs.x*2./.8), 2.), 2.), isShop); cells = mix(cells, vec2(2.), isHut); cells = mix(cells, vec2(4., 1.), isFan);
  vec2 cs = hs*2./cells, de = (.5 - abs(fract((vP/hs*.5 + .5)*cells) - .5))*cs;
  float bar = max(1. - smoothstep(.014, .028, min(de.x, de.y)), 1. - smoothstep(.04, .055, min(hs.x - abs(vP.x), hs.y - abs(vP.y))));
  col = mix(col, vec3(.02, .017, .015) + col*.06, bar*(1. - isGlass)*(1. - isDoor)*(1. - isHDoor));
  gl_FragColor = vec4(fxApplyFog(col*vK.z), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

// ---- one shape for every person ----------------------------------------------------------------------------------
// A small rounded figure (legs, a body with shoulders, two upper limbs, a head), instanced, its walk made in the vertex shader,
// and dressed by bits: 1 a greatcoat's skirts, 2 a skirt's bell to the ground, 3 a shawl, 4 a bonnet, 5 a cap, 6 a
// low-crowned hat, 7 an apron, 8 a basket hung at the elbow, 9 a goose carried in the hand, 10 a comforter round the neck.
// aux of a vertex: x the part (0 body, 1 head, 2 3 legs, 4 5 the upper limbs, 6 7 the lamplighter's pole and ladder), y the
// height of its joint, z its colour (0 its own, 1 the coat's, 2 the second colour's, 3 a flame), w the bit that shows it.
// list: [{ a, b, speed, phase, scale, kind, color, color2, dress }]; kinds: 0 walks to and fro between a and b, turning
// at each end; 1 runs to and fro (a child); 2 stands at a looking toward b; 3 a lamplighter, who trots where uLampAt
// says (his feet's place and the way he heads, worked out each frame from his round on the world's clock); 4 stands
// with both hands forward on a wheel and works it; 5 stands with one hand raised.
const DRESS = { coat: 1, bell: 2, shawl: 4, bonnet: 8, cap: 16, hat: 32, apron: 64, basket: 128, goose: 256, comforter: 512 };
function folkGeometry(who) {
  // who: 'man' (and boys, the ship's people), 'woman' (and girls), 'lighter' (a man with the lamplighter's kit): each
  // shape carries only the dress its kind can wear
  const G = makeGeo(), dark = [0.022, 0.022, 0.028], skin = [0.42, 0.29, 0.22], wood = [0.09, 0.06, 0.04], W = [1, 1, 1], pale = [0.5, 0.47, 0.4];
  const X = (part, joint, slot, bit) => [part, joint, slot, bit];
  for (const [x, part] of [[-0.09, 2], [0.09, 3]]) G.tube([x, 0.0, 0.01], [x, 0.84, 0], 0.07, 0.085, 4, dark, X(part, 0.84, 0, 0));
  // hips, chest, shoulders and neck in the coat's colour; upper limbs from the shoulders, hands
  G.lathe(0, 0, [[0.15, 0.8], [0.19, 1.28], [0.17, 1.42], [0.06, 1.47]], 6, () => W, () => X(0, 0, 1, 0));
  G.tube([-0.24, 1.385, 0], [0.24, 1.385, 0], 0.076, 0.076, 5, W, X(0, 0, 1, 0));
  for (const [x, part] of [[-0.265, 4], [0.265, 5]]) {
    G.tube([x, 1.4, 0], [x * 1.04, 0.86, 0.02], 0.062, 0.048, 4, [0.85, 0.85, 0.85], X(part, 1.38, 1, 0));
    G.tube([x * 1.04, 0.86, 0.02], [x * 1.04, 0.77, 0.03], 0.04, 0.03, 3, skin, X(part, 1.38, 0, 0));
  }
  G.lathe(0, 0.01, [[0.0, 1.455], [0.09, 1.49], [0.104, 1.6], [0.07, 1.69], [0.0, 1.71]], 6, () => skin, () => X(1, 0, 0, 0));
  G.lathe(0.34, 0.1, [[0.0, 0.7], [0.09, 0.7], [0.13, 0.88]], 5, () => wood, () => X(5, 1.38, 0, 8));
  if (who === 'woman') {
    G.lathe(0, 0, [[0.4, 0.05], [0.31, 0.55], [0.165, 1.04]], 8, () => [0.9, 0.9, 0.9], () => X(0, 0, 1, 2));
    G.lathe(0, 0, [[0.3, 1.02], [0.27, 1.3], [0.09, 1.5]], 6, () => W, () => X(0, 0, 2, 3));
    G.lathe(0, -0.01, [[0.11, 1.5], [0.127, 1.62], [0.0, 1.74]], 6, () => W, () => X(1, 0, 2, 4));
    G.tube([0, 1.6, 0.0], [0, 1.61, 0.17], 0.125, 0.15, 6, W, X(1, 0, 2, 4));
    G.quad([-0.2, 0.3, 0.375], [0.2, 0.3, 0.375], [0.12, 1.25, 0.2], [-0.12, 1.25, 0.2], pale, X(0, 0, 0, 7));
  } else {
    G.lathe(0, 0, [[0.235, 0.42], [0.2, 0.8], [0.175, 1.02]], 6, () => W, () => X(0, 0, 1, 1));
    G.lathe(0, 0.01, [[0.108, 1.66], [0.125, 1.7], [0.0, 1.755]], 6, () => W, () => X(1, 0, 2, 5));
    G.box(0, 1.665, 0.13, 0.07, 1.68, 0.05, dark, { aux: X(1, 0, 0, 5) });
    G.lathe(0, 0.01, [[0.2, 1.665], [0.105, 1.685], [0.1, 1.775], [0.0, 1.785]], 6, () => dark, () => X(1, 0, 0, 6));
    G.lathe(-0.3, 0.07, [[0.0, 0.28], [0.1, 0.36], [0.07, 0.62], [0.02, 0.78]], 5, () => pale, () => X(4, 1.38, 0, 9));
    G.lathe(0, 0, [[0.11, 1.42], [0.128, 1.47], [0.1, 1.52]], 6, () => W, () => X(0, 0, 2, 10));
    G.box(0.07, 1.14, 0.2, 0.04, 1.45, 0.018, W, { aux: X(0, 0, 2, 10) });
  }
  if (who === 'lighter') {
    // the lamplighter's pole (a stout staff, its tip alight) and the ladder on his shoulder
    G.box(0.3, 0.9, 0.06, 0.03, 3.2, 0.03, wood, { aux: X(6, 0, 0, 0) });
    G.box(0.3, 3.2, 0.06, 0.055, 3.38, 0.055, W, { aux: X(6, 0, 3, 0) });
    for (const x of [-0.2, -0.46]) G.tube([x, 1.42, -1.0], [x, 1.72, 1.1], 0.028, 0.028, 4, wood, X(7, 0, 0, 0));
    for (let i = 0; i < 6; i++) { const k = (i + 0.5) / 6; G.tube([-0.2, 1.42 + 0.3 * k, -1.0 + 2.1 * k], [-0.46, 1.42 + 0.3 * k, -1.0 + 2.1 * k], 0.02, 0.02, 4, wood, X(7, 0, 0, 0)); }
  }
  return G.toGeometry();
}
// U: uTime, uLampAt (vec4: where a lamplighter's feet are, and his heading as a yaw), uWalk (vec2: the metres he has
// come along his round, by which his stride goes, and 1 while he walks, 0 while he stands), uAmb, uMoon, uMoonDir,
// uGlow
function makeFolk(list, U, base) {
  const n = list.length, g = new THREE.InstancedBufferGeometry(), src = base || folkGeometry('man');
  for (const k of ['position', 'normal', 'color', 'aux']) g.setAttribute(k, src.getAttribute(k));
  const m = Math.max(1, n), A = new Float32Array(m * 3), B = new Float32Array(m * 3), M = new Float32Array(m * 4), C = new Float32Array(m * 3), C2 = new Float32Array(m * 4);
  list.forEach((f, i) => {
    A.set(f.a, i * 3); B.set(f.b, i * 3); M.set([f.speed ?? 1.3, f.phase ?? 0, f.scale ?? 1, f.kind ?? 0], i * 4); C.set(f.color, i * 3);
    C2.set(f.color2 || f.color, i * 4); C2[i * 4 + 3] = f.dress ?? 0;
  });
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(A, 3)); g.setAttribute('aB', new THREE.InstancedBufferAttribute(B, 3));
  g.setAttribute('aM', new THREE.InstancedBufferAttribute(M, 4)); g.setAttribute('aC', new THREE.InstancedBufferAttribute(C, 3)); g.setAttribute('aC2', new THREE.InstancedBufferAttribute(C2, 4));
  g.instanceCount = n;
  const uniforms = { ...fx.fogUniforms(), ...U };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute vec3 color, aA, aB, aC; attribute vec4 aux, aM, aC2;
uniform float uTime; uniform vec3 uAmb, uMoon, uMoonDir, uGlow; uniform vec4 uLampAt; uniform vec2 uWalk;
varying vec3 vCol;
vec2 rot(vec2 p, float a){ float c = cos(a), s = sin(a); return vec2(p.x*c - p.y*s, p.x*s + p.y*c); }
float bitOf(float v, float b){ return floor(mod(v/exp2(b - 1.), 2.)); }
void main(){
  float kind = aM.w, part = aux.x, sc = aM.z, show = mix(1., bitOf(aC2.w, max(aux.w, 1.)), step(.5, aux.w)), skirt = bitOf(aC2.w, 2.);
  float isRun = step(.5, kind)*step(kind, 1.5), isStand = step(1.5, kind)*step(kind, 2.5), isLamp = step(2.5, kind)*step(kind, 3.5);
  float isHelm = step(3.5, kind)*step(kind, 4.5), isLook = step(4.5, kind), still = max(isStand, max(isHelm, isLook));
  vec3 ab = aB - aA; float len = max(length(ab), .01); vec3 dir = ab/len;
  // to and fro with a pause and a turn at each end
  float T = 2.*len/max(aM.x, .05), ph = fract(uTime/T + aM.y), e = clamp(2.4/T, .02, .2);
  float tri = abs(ph*2. - 1.), along = clamp((tri - e)/(1. - 2.*e), 0., 1.);
  float turn = 1. - smoothstep(.5 - e*.5, .5 + e*.5, ph) + .5*smoothstep(1. - e*.5, 1., ph) - .5*(1. - smoothstep(0., e*.5, ph));
  float moving = smoothstep(0., .02, along)*smoothstep(0., .02, 1. - along);
  float dist = along*len;
  // a lamplighter's stride goes by the metres he has come along his round
  dist = mix(dist, uWalk.x, isLamp); moving = mix(moving, uWalk.y, isLamp); turn = mix(turn, 0., isLamp);
  dist *= 1. - still; moving *= 1. - still; turn *= 1. - still;
  float stride = 6.2832/max(1.5*sc*mix(1., 1.5, max(isRun, isLamp)), .1);
  float g = dist*stride, swing = mix(.55, .95, max(isRun, isLamp))*moving;
  float lean = mix(.14, .3, max(isRun, isLamp))*moving;
  vec3 p = position*show; vec3 nrm = normal;
  float side = step(2.5, part)*step(part, 3.5) + step(4.5, part)*step(part, 5.5);
  float isLeg = step(1.5, part)*step(part, 3.5), isLimb = step(3.5, part)*step(part, 5.5), isKit = step(5.5, part);
  // a skirt hides most of a stride; a limb that carries something hangs nearly still
  float carry = max(bitOf(aC2.w, 8.)*step(4.5, part), bitOf(aC2.w, 9.)*step(part, 4.5))*isLimb;
  float ang = sin(g + side*3.1416)*swing*(isLeg*mix(1., .4, skirt) - isLimb*.8*(1. - .8*carry));
  // standing folk shift and gesture; the helmsman's hands go forward to the wheel and work it; the look-out's hand is up
  float idle = sin(uTime*(.7 + fract(aM.y*7.)) + aM.y*40.);
  ang += isLimb*isStand*(-.25 - .3*idle*side)*(1. - carry);
  ang += isLimb*isHelm*(-1.25 + .35*sin(uTime*.9 + aM.y*6.2832 + side*3.1416));
  ang += isLimb*isLook*side*(-2.3 + .1*idle);
  p.yz = mix(p.yz, vec2(aux.y, 0.) + rot(p.yz - vec2(aux.y, 0.), ang), (isLeg + isLimb)*show);
  nrm.yz = mix(nrm.yz, rot(nrm.yz, ang), isLeg + isLimb);
  p *= mix(1., step(.5, isLamp), isKit);
  p.yz = rot(p.yz, lean + .06*idle*still);
  p.y += abs(sin(g))*.05*moving*mix(1., 2., isRun);
  p *= sc;
  float yaw = mix(atan(dir.x, dir.z) + 3.1416*turn, uLampAt.w, isLamp);
  p.xz = rot(p.xz, -yaw); nrm.xz = rot(nrm.xz, -yaw);
  vec3 wp = mix(aA + dir*dist, uLampAt.xyz, isLamp) + p;
  vec3 wn = normalize(mat3(modelMatrix)*nrm);
  vec4 world = modelMatrix*vec4(wp, 1.);
  vec3 base = mix(mix(color, color*aC, step(.5, aux.z)*step(aux.z, 1.5)), color*aC2.rgb, step(1.5, aux.z)*step(aux.z, 2.5));
  vCol = base*(uAmb*(.55 + .45*wn.y) + uMoon*max(dot(wn, uMoonDir), 0.) + uGlow*(.75 + .25*wn.y));
  vCol = mix(vCol, vec3(3.2, 1.5, .35), step(2.5, aux.z));
  vec4 mvPosition = viewMatrix*world;
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: fx.GLSL_FOG_PARS_FRAG + /* glsl */`
varying vec3 vCol;
void main(){ gl_FragColor = vec4(fxApplyFog(vCol), 1.); }`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return { mesh, uniforms, geometry: src };
}

// ---- one shape for every beast of the moor -----------------------------------------------------------------------
// A woolly body, a dark head, four legs: instanced, its one habit made in the vertex shader on the world's clock.
// A sheep lies with its legs under it and snow on its back; on a period and a phase of its own (38 to 80 s, by its
// seed) it gets up, stands a few seconds and lies down again. The dog only lies, its side rising as it sleeps.
// Nothing here reads the eye but light and mist. list: [{ p: [x, y, z], yaw, kind (0 sheep, 1 dog), scale, seed }];
// U: uTime, uAmb, the place's light (see placeGLSL); place: that chunk's text.
function makeBeasts(list, U, place) {
  const pos = [], nor = [], part = [];
  const blob = (geo, sx, sy, sz, ox, oy, oz, k) => {
    const g = geo.toNonIndexed(), a = g.getAttribute('position');
    for (let i = 0; i < a.count; i++) {
      const x = a.getX(i), y = a.getY(i), z = a.getZ(i), l = Math.hypot(x / sx, y / sy, z / sz) || 1;
      pos.push(x * sx + ox, y * sy + oy, z * sz + oz); nor.push(x / sx / l, y / sy / l, z / sz / l); part.push(k);
    }
  };
  blob(new THREE.IcosahedronGeometry(1, 1), 0.52, 0.27, 0.3, 0, 0.3, 0, 0);
  blob(new THREE.IcosahedronGeometry(1, 0), 0.15, 0.12, 0.1, 0.56, 0.36, 0.02, 2);
  for (const [lx, lz] of [[0.3, 0.13], [0.3, -0.13], [-0.3, 0.13], [-0.3, -0.13]]) blob(new THREE.BoxGeometry(1, 1, 1), 0.07, 0.34, 0.07, lx, -0.17, lz, 1);
  const g = new THREE.InstancedBufferGeometry(), n = list.length, at = new Float32Array(n * 3), par = new Float32Array(n * 4);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1));
  list.forEach((q, i) => { at.set(q.p, i * 3); par.set([q.yaw, q.scale, q.seed, q.kind], i * 4); });
  g.setAttribute('aAt', new THREE.InstancedBufferAttribute(at, 3)); g.setAttribute('aPar', new THREE.InstancedBufferAttribute(par, 4));
  g.instanceCount = n;
  const material = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...U }, fog: true,
    vertexShader: fx.GLSL_HASH + fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute vec3 aAt; attribute vec4 aPar; attribute float aPart; uniform float uTime;
varying vec3 vWp, vN; varying vec3 vK;
// how far up a beast is at the clock t: 0 lying, 1 standing (the dog never stands)
float beastUp(float seed, float kind, float t){
  float per = mix(38., 80., hash11(seed*7.3 + 1.)), ph = fract(t/per + seed);
  return smoothstep(0., .04, ph)*(1. - smoothstep(.17, .21, ph))*(1. - step(.5, kind));
}
void main(){
  float up = beastUp(aPar.z, aPar.w, uTime), leg = step(.5, aPart)*step(aPart, 1.5), head = step(1.5, aPart);
  vec3 p = position;
  // the legs are folded under the body while it lies; the body rises on them; the head comes up with it
  p.y = mix(p.y, .08 + p.y*mix(.1, 1., up), leg) + up*.32*(1. - leg) + head*up*.1;
  p.yz *= 1. + (1. - leg)*(1. - head)*.035*sin(uTime*1.3 + aPar.z*30.);
  // the dog lies curled: its head laid back along its side
  p.xz = mix(p.xz, vec2(p.x*.55 + .08, p.z + .2), head*step(.5, aPar.w));
  float c = cos(aPar.x), s = sin(aPar.x);
  vec3 q = vec3(p.x*c + p.z*s, p.y, -p.x*s + p.z*c)*aPar.y;
  vN = vec3(normal.x*c + normal.z*s, normal.y, -normal.x*s + normal.z*c);
  vWp = aAt + q; vK = vec3(aPart, aPar.w, up);
  vec4 mvPosition = viewMatrix*vec4(vWp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FOG_PARS_FRAG + place + /* glsl */`
uniform vec3 uAmb; varying vec3 vWp, vN; varying vec3 vK;
void main(){
  vec3 n = normalize(vN); float dog = step(.5, vK.y), dark = step(.5, vK.x);
  float wool = .75 + .5*vnoise(vWp*19.);
  vec3 base = mix(mix(vec3(.42, .4, .35)*wool, vec3(.035, .03, .028), dark), vec3(.075, .05, .035)*wool, dog);
  // snow lies on a back that has lain long; less on one that has just got up, little on the dog
  float snow = smoothstep(.45, .8, n.y + .25*(vnoise(vWp*7.) - .5))*(1. - .6*vK.z)*(1. - dark)*(1. - .7*dog);
  base = mix(base, vec3(.78, .83, .93), snow);
  vec3 irr = uAmb*3.1416*(.55 + .45*n.y) + uPMoonCol*max(dot(n, uPMoonDir), 0.) + placeLight(vWp, n);
  gl_FragColor = vec4(fxApplyFog(base*max(irr, vec3(0.))*.3183), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return { mesh };
}

// ---- tussocks: the moor's coarse dead grass --------------------------------------------------------------------
// One clump of five stiff blades that stand out and droop, instanced; each stands 0.3 to 0.7 m by its scale, dark
// at its foot, straw above, frost at its tips, and bends in the wind on the world's clock (the gusts cross the moor
// with the wind). list: [{ p, yaw, scale, seed }]; U: uTime, uWind (vec2, the way it blows), uAmb, the place's
// light; place: that chunk's text.
function makeTussocks(list, U, place) {
  const pos = [], aT = [], nor = [], h01 = (i, k) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
  for (let b = 0; b < 5; b++) {
    const a = b / 5 * 6.2832 + h01(b, 1) * 0.7, inner = b % 3 === 2, out = inner ? 0.15 + 0.15 * h01(b, 2) : 0.5 + 0.3 * h01(b, 2), h = inner ? 1 : 0.62 + 0.3 * h01(b, 3), w = 0.13;
    const ca = Math.cos(a), sa = Math.sin(a), P = (rad, y, sw) => [ca * rad - sa * sw, y, sa * rad + ca * sw];
    const bl = P(0.1, 0, -w), br = P(0.1, 0, w), mr = P(0.1 + out * 0.45, h * 0.62, w * 0.55), tip = P(0.1 + out, h * (inner ? 1 : 0.9), 0);
    for (const [q, t] of [[bl, 0], [br, 0], [mr, 0.62], [bl, 0], [mr, 0.62], [tip, 1]]) { pos.push(q[0], q[1], q[2]); aT.push(t); nor.push(ca * 0.45, 0.89, sa * 0.45); }
  }
  const g = new THREE.InstancedBufferGeometry(), n = list.length, at = new Float32Array(n * 3), par = new Float32Array(n * 3);
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(aT, 1));
  list.forEach((q, i) => { at.set(q.p, i * 3); par.set([q.yaw, q.scale, q.seed], i * 3); });
  g.setAttribute('aAt', new THREE.InstancedBufferAttribute(at, 3)); g.setAttribute('aPar', new THREE.InstancedBufferAttribute(par, 3));
  g.instanceCount = n;
  const material = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...U }, fog: true, side: THREE.DoubleSide,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute vec3 aAt, aPar; attribute float aT; uniform float uTime; uniform vec2 uWind;
varying vec3 vWp, vN; varying vec2 vK;
void main(){
  float c = cos(aPar.x), s = sin(aPar.x), sc = aPar.y;
  vec3 q = vec3(position.x*c + position.z*s, position.y, -position.x*s + position.z*c)*vec3(sc*1.15, sc, sc*1.15);
  // the wind: gusts that cross the moor the way it blows; a blade leans with the square of its height
  float gust = .5 + .5*sin(uTime*1.9 - dot(aAt.xz, uWind)*.33 + aPar.z*2.);
  gust *= .55 + .45*sin(uTime*.6 - dot(aAt.xz, uWind)*.045 + 1.3);
  q.xz += uWind*(.08 + .3*gust)*aT*aT*sc;
  q.y -= .1*gust*aT*aT*sc;
  vN = vec3(normal.x*c + normal.z*s, normal.y, -normal.x*s + normal.z*c);
  vWp = aAt + q; vK = vec2(aT, aPar.z);
  vec4 mvPosition = viewMatrix*vec4(vWp, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: FIRE_GLSL + fx.GLSL_FOG_PARS_FRAG + place + /* glsl */`
uniform vec3 uAmb; varying vec3 vWp, vN; varying vec2 vK;
void main(){
  vec3 n = normalize(vN); float t = vK.x, tone = .8 + .4*fract(vK.y*7.3);
  vec3 base = mix(vec3(.035, .028, .02), vec3(.3, .25, .15)*tone, smoothstep(0., .5, t));
  base = mix(base, vec3(.7, .76, .88), smoothstep(.5, 1., t)*.75);
  vec3 irr = uAmb*3.1416*(.5 + .5*t) + uPMoonCol*max(dot(n, uPMoonDir), 0.) + placeLight(vWp, n);
  gl_FragColor = vec4(fxApplyFog(base*max(irr, vec3(0.))*.3183), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return { mesh };
}

// ---- the frozen pools -------------------------------------------------------------------------------------------
// Dark cracked ice that mirrors the sky (and the red of the west in it), a rim of white ice where it meets
// its bank, wind-packed snow in patches, snow snaking across it with the wind.
// pools: [{ x, z, y, a, b, c, sn }] (half axes, the cosine and sine of its turn); shore(q, x, z): 1 at its ragged rim.
// The sheet reaches a third beyond the rim: the bank rises through it, so its edge is the land's own line.
const ICE_DRAW = 0.4, ICE_STEP = 1.6;
const ICE_DRIFT = [0.27, 0.31, 0.36], ICE_DIVE = 0.25;
function makeIcePools(pools, shore, U) {
  // (a sheet's rim is cut every ICE_STEP metres or finer, and in rings no wider: the edge's measure runs smoothly)
  const pos = [], aE = [], idx = [], rings = [0.4, 0.68, 0.8, 0.88, 0.94, 1.0, 1.07, 1.14, 1.3];
  for (const q of pools) {
    const base = pos.length / 3, SEG = clamp(Math.round(6.2832 * Math.sqrt((q.a * q.a + q.b * q.b) / 2) / ICE_STEP), 24, 96);
    pos.push(q.x, q.y, q.z); aE.push(shore(q, q.x, q.z));
    for (const e of rings) for (let i = 0; i < SEG; i++) {
      const a = i / SEG * Math.PI * 2, ex = Math.cos(a) * q.a * e, ez = Math.sin(a) * q.b * e, x = q.x + ex * q.c - ez * q.sn, z = q.z + ex * q.sn + ez * q.c;
      // (beyond its shore the sheet goes down under the bank, ICE_DIVE of the bank's width for each of its reach: no
      // piece of it lies out on the moor where the ground dips)
      pos.push(x, q.y - Math.max(0, e - 1) * ICE_DIVE * q.b, z); aE.push(shore(q, x, z));
    }
    for (let i = 0; i < SEG; i++) idx.push(base, base + 1 + (i + 1) % SEG, base + 1 + i);
    for (let r = 0; r < rings.length - 1; r++) for (let i = 0; i < SEG; i++) {
      const a = base + 1 + r * SEG + i, b = base + 1 + r * SEG + (i + 1) % SEG, c = a + SEG, d = b + SEG;
      idx.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aE', new THREE.Float32BufferAttribute(aE, 1)); g.setIndex(idx);
  const uniforms = { ...fx.fogUniforms(), ...U };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute float aE; varying vec3 vWp; varying float vE;
void main(){
  vec4 wp = modelMatrix*vec4(position, 1.); vWp = wp.xyz; vE = aE;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_VORONOI + fx.GLSL_FOG_PARS_FRAG + SKY_UNDER + SKY_CLOUD + /* glsl */`
uniform float uTime, uRed, uOpen, uFireSeed; uniform vec3 uAmb, uMoon, uMoonDir, uFire; uniform vec2 uWind; uniform vec4 uStones[8];
varying vec3 vWp; varying float vE;
void main(){
  if (vE > 1.12) discard;
  vec3 E = vWp - cameraPosition; float dist = length(E); vec3 V = E/max(dist, .01);
  vec2 p = vWp.xz;
  // cracks: few, white, branching; the edges of great plates of ice, shown only in runs (so they never close into
  // cells); 2 to 6 cm wide in the world's own metres, thinning to nothing where that is under a pixel
  vec2 pw = p + (vec2(vnoise(p*.05), vnoise(p*.05 + 30.)) - .5)*9. + (vec2(vnoise(p*.31 + 9.), vnoise(p*.31 + 70.)) - .5)*1.3;
  vec3 v1 = voronoi(pw*.11 + 3.), v2 = voronoi(pw*.31 + 11.);
  float pix = max(fwidth(p.x) + fwidth(p.y), 1e-4);
  float w1 = .02 + .04*vnoise(pw*.4 + 3.), w2 = .02 + .015*vnoise(pw*.7);
  float c1 = (1. - smoothstep(w1*.5, w1*.5 + pix, v1.y/.11))*smoothstep(.47, .6, vnoise(pw*.09 + 17.))*clamp(w1/pix, 0., 1.);
  float c2 = (1. - smoothstep(w2*.5, w2*.5 + pix, v2.y/.31))*smoothstep(.62, .74, vnoise(pw*.16 + 51.))*clamp(w2/pix, 0., 1.)*.6;
  float crack = max(c1, c2);
  vec3 N = normalize(vec3((vnoise(p*.9) - .5)*.05, 1., (vnoise(p*.9 + 40.) - .5)*.05));
  vec3 Rr = reflect(V, N); Rr.y = abs(Rr.y);
  // THE MIRROR SHOWS THE ONE SKY as the sky's own shaders draw it, along the mirrored sight line from this place of
  // the ice: the night's blue, the west's red as its graded glow (the same law: its height, its width, its core),
  // the weather's cloud of the place under each mirrored point; then the moon's blur, the great stones as dark
  // shapes, the hut's fire
  vec2 rd = Rr.xz; float rl = max(length(rd), 1e-3); rd /= rl; float slope = Rr.y/rl, el = atan(slope)*57.3, az = atan(-rd.y, -rd.x)*57.2958;
  float ma = acos(clamp(dot(Rr, uMoonDir), 0., 1.))*57.2958;
  vec3 refl = mix(vec3(.05, .066, .12), vec3(.014, .022, .058), smoothstep(0., 40., el));
  vec4 cl = skyCloud(Rr, skyOf(underSky(Rr, vWp)), uMoonDir, uWind, uTime, uOpen, ma, el);
  refl = mix(refl, cl.rgb, cl.a);
  // (ice is no glass: what stands low in the sky is drawn out down the mirror toward the eye, so the west's red lies
  // LONG on it: its height in the mirror is read at ICE_DRAW of the mirrored sight line's)
  // FROST ROUGHENS THE MIRROR, BY THE ICE'S OWN PLACE: frost is world noise at this place of the ice (0 where the
  // wind has swept it bare, 1 where rime stands on it). A rimed mirror spreads what it shows: the red's width to
  // either hand and its height grow with the frost, its height the more the flatter the sight line lies on the ice
  // (a rough sheet seen along itself draws a low light out toward the eye), and what is spread is dimmed by as
  // much. That is the whole law; the air's own mist takes what distance takes (the fog below), as from every surface.
  float frost = smoothstep(.5, .8, vnoise(p*.045 + 13.)*.55 + vnoise(p*.19 + 5.)*.3 + vnoise(p*.8)*.15);
  float graze = 1. - clamp(-V.y, 0., 1.), tall = 1. + frost*(.6 + 2.4*graze*graze), wideSq = 1. + 3.*frost, dim = 1./(tall*sqrt(wideSq));
  float elI = el*${ICE_DRAW.toFixed(2)}/tall, core = exp(-clamp(elI/${RED_SCALE_C.toFixed(2)}, 0., 30.))*exp(-clamp(az*az/(${RED_SIDE_C.toFixed(1)}*wideSq), 0., 30.))*dim;
  // (the glow's own colours as the sky has them: deep red where it is faint, red-orange in its core, and the bright
  // band low in it; the faint of it leaves the night's blue in the mirror)
  float gq = (elI - .35*${RED_SCALE_C.toFixed(2)})/(.3*${RED_SCALE_C.toFixed(2)});
  vec3 glow = mix(vec3(.4, .028, .01), vec3(1.55, .38, .055), core*core)*core*1.2 + vec3(1.7, .5, .09)*exp(-clamp(gq*gq, 0., 30.))*exp(-clamp(az*az/(700.*wideSq), 0., 30.))*.75*dim;
  refl = mix(refl, glow, clamp(core*1.6, 0., 1.)*clamp(uRed, 0., 1.));
  float md = max(dot(Rr, uMoonDir), 0.); md *= md; md *= md;
  refl += uMoon*.22*md*md;
  // the great stones as dark shapes in the mirror: each a rounded mass (no straight side), its outline the softer
  // the more rime lies on the ice
  float stone = 0.;
  for (int i = 0; i < 8; i++) {
    vec4 q = uStones[i]; vec2 c = q.xy - p; float t = dot(c, rd), lat = abs(c.x*rd.y - c.y*rd.x), up = slope*max(t - q.z*.5, 0.);
    float round2 = (lat*lat)/max(q.z*q.z, .01) + (up*up)/max(q.w*q.w, .01);
    stone = max(stone, step(0., t)*step(0., q.w)*(1. - smoothstep(.7 - .3*frost, 1. + .3*frost, sqrt(round2) + .18*(vnoise(p*.35 + q.xy) - .5))));
  }
  refl = mix(refl, vec3(.005, .006, .009), stone);
  // the hut's fire, where the mirror looks toward its door: a streak of gold drawn down the ice
  vec3 tf = uFire - vWp; float ft = dot(tf.xz, rd), fl = abs(tf.x*rd.y - tf.z*rd.x);
  float fq = (slope*ft - tf.y)/max(.08*ft, .5);
  refl += FIRE_GOLD*1.6*step(0., ft)*exp(-clamp(fl*fl/6., 0., 30.))*exp(-clamp(fq*fq, 0., 30.))*fireBreath(uFireSeed, uTime)/(1. + ft*ft/2500.);
  float fr1 = 1. - clamp(dot(-V, N), 0., 1.), fres = (.16 + .84*fr1*fr1*fr1)*(1. - .45*frost);
  vec3 col = mix(vec3(.02, .032, .056) + vec3(.014, .03, .055)*(.5*vnoise(p*.13) + .5*v1.z), refl, fres);
  vec3 snow = vec3(.66, .72, .82)*(uAmb*1.5 + uMoon*.7 + vec3(1.2, .2, .03)*.3*uRed);
  // THE POOL IS ICE, by its own measure e (0 at its middle, 1 at its ragged rim; pushed in and out by fine world
  // noise, so no line of it is straight): a bare dark middle that the wind keeps swept, rime in patches on it (frost)
  // and thick toward the rim, where the water froze first; long white cracks; and at the rim a LIP OF SNOW, blown
  // over the edge in tongues that lie down the wind. The bank comes up through that lip: snow against snow.
  float e = vE + .05*(vnoise(p*.9) - .5) + .025*(vnoise(p*2.7 + 9.) - .5);
  float along = dot(p, uWind), across = dot(p, vec2(-uWind.y, uWind.x));
  float tongue = vnoise(vec2(along*.08, across*.45) + 3.)*.6 + vnoise(vec2(along*.25, across*1.3))*.4;
  float lip = smoothstep(.84, .95, e + .2*(tongue - .5));
  float rime = max(smoothstep(.6, .9, e + .16*(vnoise(p*.21 + 3.) - .5)), frost*.6);
  // (rime stands up from the ice: seen along the sheet it hides the bare ice between its crystals, the more the
  // flatter the sight line lies; looked down on, the bare ice shows between. No ice is wholly without it.)
  float veil = 1. - pow(1. - max(rime*.55, .05), clamp(.35/max(-V.y, .02), 1., 9.));
  col = mix(col, snow*(.5 + .16*vnoise(p*3.1))*(.8 + .2*vnoise(p*.6 + 5.)), veil);
  col += vec3(.75, .85, 1.)*crack*(.3 + uAmb*1.2)*(1. - .5*rime);
  // packed snow in patches out on the ice; snow snaking across it on the wind
  float sn = .8*smoothstep(.7, .84, vnoise(p*.11 + 5.)*.6 + vnoise(p*.43)*.4);
  float wisp = smoothstep(.74, .93, vnoise(vec2(along*.07 - uTime*.9, across*1.5 + sin(along*.05)*2.)));
  // (the drift on the ice is the moor's own snow in the moor's own light: ICE_DRIFT of the rime's white, a little
  // to the blue, so that where the bank's snow runs onto the sheet there is no line between them)
  col = mix(col, snow*vec3(${ICE_DRIFT.map((v) => v.toFixed(2)).join(', ')})*(.8 + .4*vnoise(p*2.3)), clamp(max(sn, lip) + wisp*.12, 0., 1.));
  gl_FragColor = vec4(fxApplyFog(col), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

// ---- fire light lying on the ground: flat pools of gold under a window or a lantern -----------------------------
// list: [{ p, u: [x,y,z] half-extent, v: [x,y,z] half-extent, level, seed, yAt }]; with yAt(x, z) the pool is laid on
// the ground in a grid of small pieces, each corner at the ground's own height
function makeLightPools(list, time) {
  const pos = [], uv = [], par = [], idx = [];
  for (const q of list) {
    const n = q.yAt ? 8 : 1, Y = [];
    if (q.yAt) for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const a = i / n * 2 - 1, b = j / n * 2 - 1; Y.push(q.yAt(q.p[0] + q.u[0] * a + q.v[0] * b, q.p[2] + q.u[2] * a + q.v[2] * b) + 0.1); }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const base = pos.length / 3;
      for (const [da, db] of [[0, 0], [1, 0], [1, 1], [0, 1]]) {
        const a = (i + da) / n * 2 - 1, b = (j + db) / n * 2 - 1, x = q.p[0] + q.u[0] * a + q.v[0] * b, z = q.p[2] + q.u[2] * a + q.v[2] * b;
        pos.push(x, q.yAt ? Y[(j + db) * (n + 1) + i + da] : q.p[1] + q.u[1] * a + q.v[1] * b, z); uv.push(a, b); par.push(q.level ?? 1, q.seed ?? 0.5);
      }
      idx.push(base, base + 2, base + 1, base, base + 3, base + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aPar', new THREE.Float32BufferAttribute(par, 2)); g.setIndex(idx);
  const material = new THREE.ShaderMaterial({
    // (light laid on what is lit already adds only what that still lacks of white: src*(1 - dst) + dst)
    uniforms: { ...fx.fogUniforms(), uTime: time }, fog: true, transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneMinusDstColorFactor, blendDst: THREE.OneFactor, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: FIRE_GLSL + fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute vec2 aPar; uniform float uTime; varying vec2 vUv; varying float vK;
void main(){
  vUv = uv; vK = aPar.x*fireBreath(aPar.y, uTime);
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: FIRE_GLSL + fx.GLSL_FOG_PARS_FRAG + /* glsl */`
varying vec2 vUv; varying float vK;
void main(){
  float r2 = dot(vUv, vUv), a = exp(-r2*3.2)*(1. - smoothstep(.7, 1., r2));
  gl_FragColor = vec4(min(FIRE_GOLD*vK*a*(1. - fxFog()), vec3(1.)), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = 2;
  return { mesh };
}

// ---- what rides the sea beside the ship: her wake, the foam along her sides, her lanterns' light on the water ------
// One sheet of small pieces whose corners are set on the sea's own surface every frame (update sets position.y).
// A cell of light is PAINT ON THE SEA'S SURFACE: a lantern (or the ring) at `lamp` shows in the water as a broken
// glitter in the wave facets, by the law of a light mirrored in a rough surface: brightest where a level facet
// would throw the lamp to the eye, spread by the waves' slopes, falling off with the metres from the lamp; its
// facets flash and go on the world's clock. So the glitter lies between each lamp and whoever looks, never afloat.
// A cell of light 2 is the tower's BEAM on the sea: a pale patch on the wave crests under each of its two shafts,
// travelling round the tower as the lantern turns (uBeam: the tower's x, z and the beam's angle now, from the clock),
// as wide as the shaft over it; its cell's fade ends it where the shafts end.
// cells: [{ at(i, j) => [x, z], ni, nj, fade(i, j) => 0..1, light: 0 | 1 | 2, lamp: [x, y, z, strength], seed }]. U: uTime, uFoam, uBeam, uBeamCol
// (foam rides RIDE_OVER.foam metres over the sea's surface at its corners; a cell of light rides RIDE_OVER.light over
// it, the height of the short chop that the far sea no longer draws, so that no trough of that chop stands through)
const RIDE_OVER = { foam: 0.1, light: 0.35 };
function makeSeaRiders(cells, U) {
  const pos = [], uv = [], par = [], idx = [], lampA = [], over = [];
  for (const c of cells) {
    const base = pos.length / 3, lp = c.lamp || [0, 0, 0, 0];
    for (let j = 0; j <= c.nj; j++) for (let i = 0; i <= c.ni; i++) { const q = c.at(i, j); pos.push(q[0], 0, q[1]); uv.push(i / c.ni * 2 - 1, j / c.nj * 2 - 1); par.push(c.fade(i, j), c.light, c.seed ?? 0.5); lampA.push(lp[0], lp[1], lp[2], lp[3]); over.push(c.light ? RIDE_OVER.light : RIDE_OVER.foam); }
    for (let j = 0; j < c.nj; j++) for (let i = 0; i < c.ni; i++) { const a = base + j * (c.ni + 1) + i, b = a + 1, d = a + c.ni + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
  }
  const g = new THREE.BufferGeometry(), P = new THREE.Float32BufferAttribute(pos, 3);
  g.setAttribute('position', P); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('aPar', new THREE.Float32BufferAttribute(par, 3)); g.setAttribute('aLamp', new THREE.Float32BufferAttribute(lampA, 4)); g.setIndex(idx);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...U }, fog: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    vertexShader: FIRE_GLSL + fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute vec3 aPar; attribute vec4 aLamp; uniform float uTime; varying vec2 vUv; varying vec3 vPar, vWp; varying vec4 vLamp;
void main(){
  vUv = uv; vPar = aPar; vWp = position; vLamp = aLamp;
  vec4 mvPosition = modelViewMatrix*vec4(position, 1.);
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FOG_PARS_FRAG + /* glsl */`
uniform float uTime; uniform vec3 uFoam, uBeam, uBeamCol; varying vec2 vUv; varying vec3 vPar, vWp; varying vec4 vLamp;
void main(){
  vec2 p = vWp.xz; float isLamp = step(.5, vPar.y)*(1. - step(1.5, vPar.y)), isBeam = step(1.5, vPar.y);
  // foam: torn white lace that drifts aft and thins as it goes
  float lace = smoothstep(.34, .62, vnoise(p*.55 + vec2(uTime*1.3, 0.))*.6 + vnoise(p*1.9 + vec2(uTime*2.1, uTime*.3))*.4);
  float a = clamp(vPar.x*(.25 + 1.1*lace), 0., .92)*(1. - min(vPar.y, 1.));
  // a lamp's light in the water (see above): the facet that would mirror it to the eye, the waves' spread of slopes
  vec3 L = vLamp.xyz - vWp, Ev = cameraPosition - vWp; float dl2 = dot(L, L);
  vec3 H = normalize(L/sqrt(max(dl2, 1e-4)) + Ev/max(length(Ev), 1e-3));
  float hy2 = max(H.y*H.y, 1e-3), lobe = exp(-(1. - hy2)/(hy2*.085));
  // (each facet that flashes is one small round glint at its own place in its cell; far off, where a cell is less
  // than a dot of the picture, the cell's whole flash stands for it)
  vec2 pc = p*2.4 + vec2(uTime*.6, 0.), cell = floor(pc), cf = fract(pc) - .5 - (vec2(hash12(cell + 3.1), hash12(cell + 9.7)) - .5)*.5;
  float fl = hash12(cell + floor(uTime*4. + hash12(cell)*7.)), fw = length(fwidth(pc));
  float glint = mix((1. - smoothstep(.05, .25, length(cf)))*2.4, 1., smoothstep(.35, 1.1, fw));
  float spark = smoothstep(.7, .97, fl)*(.5 + .5*vnoise(p*.9 + uTime*.7))*glint;
  float edge = 1. - smoothstep(.72, 1., max(abs(vUv.x), abs(vUv.y)));
  vec3 gold = mix(FIRE_GOLD, vec3(1., .72, .4), step(4.5, vLamp.w))*vLamp.w*lobe*(.1 + 2.8*spark)*fireBreath(vPar.z, uTime)*edge*isLamp/(1. + dl2/(40.*vLamp.w + 1e-3));
  // the beam's patch: under the shaft, on the crests (the same facets, flashing)
  vec2 tb = p - uBeam.xy; float tr = max(length(tb), 1e-3), lat = abs(tb.x*sin(uBeam.z) + tb.y*cos(uBeam.z)), bw = 2.5 + tr*.085;
  vec3 pale = uBeamCol*exp(-lat*lat/(bw*bw))*vPar.x*(.1 + .55*vnoise(p*.35 + vec2(uTime*.5, 0.)) + 1.6*spark)*isBeam;
  float f = 1. - fxFog();
  gl_FragColor = vec4((uFoam*a + gold + pale)*f, a*f);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = 2;
  // set every corner on the sea (corners of two sheets that stand at one place are read once: FIRST[k] is the first
  // corner at corner k's place)
  const FIRST = new Int32Array(pos.length / 3), seen = new Map();
  for (let k = 0; k < FIRST.length; k++) { const key = pos[k * 3].toFixed(2) + ',' + pos[k * 3 + 2].toFixed(2); if (!seen.has(key)) seen.set(key, k); FIRST[k] = seen.get(key); }
  const ride = (seaAt, t) => { const A = P.array; for (let k = 0, i = 0; i < A.length; i += 3, k++) A[i + 1] = FIRST[k] === k ? seaAt(A[i], A[i + 2], t) + over[k] : A[FIRST[k] * 3 + 1]; P.needsUpdate = true; };
  return { mesh, ride };
}

// ---- the ring's glory: gold standing in the sleet round its opening -----------------------------------------------
// One sheet that turns to the eye about the ring's centre, `across` metres across (a stated size of the world): gold
// thickest just outside the opening and thinning outward to nothing at its edge, streaked by the sleet that drives
// through it, breathing slowly on the world's clock. It stands: it neither opens nor grows as anyone comes.
// U: uTime, uCol, uPhase (where in its breath it stands at the clock's zero: dealt); at: [x, y, z]; open: the opening's radius
function makeGlory(at, open, across, U) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const material = new THREE.ShaderMaterial({
    uniforms: { ...fx.fogUniforms(), ...U, uAt: { value: new THREE.Vector3(...at) }, uSize: { value: new THREE.Vector2(open, across / 2) } }, fog: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
uniform vec3 uAt; uniform vec2 uSize; varying vec2 vUv;
void main(){
  vec4 mvPosition = viewMatrix*vec4(uAt, 1.);
  mvPosition.xy += position.xy*uSize.y; vUv = position.xy*uSize.y;
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FOG_PARS_FRAG + /* glsl */`
uniform float uTime, uPhase; uniform vec3 uCol; uniform vec2 uSize; varying vec2 vUv;
void main(){
  float r = length(vUv), ang = atan(vUv.y, vUv.x);
  float halo = smoothstep(uSize.x*.86, uSize.x*1.08, r)*exp(-max(r - uSize.x, 0.)/(uSize.y*.3))*(1. - smoothstep(uSize.y*.72, uSize.y, r));
  // the sleet driving through the light: slanting streaks that move on the clock
  float sleet = .62 + .38*vnoise(vec2((vUv.x + vUv.y*.45)*.8 + uTime*1.9, vUv.y*.16 - uTime*.7));
  float rays = .8 + .2*vnoise(vec2(ang*5., r*.12 - uTime*.25));
  float breathe = .92 + .08*sin(uTime*.45 + uPhase);
  gl_FragColor = vec4(uCol*halo*sleet*rays*breathe*(1. - .5*fxFog()), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = 4;
  return { mesh };
}

// ---- sails: sheets of canvas that belly and shiver in the wind ------------------------------------------------------
// list: [{ c: [headA, headB, footB, footA] (corners, each [x,y,z]), n: [x,y,z] the way it bellies, amp (m), seed, reef }]
function makeSails(list, U) {
  const pos = [], uv = [], belly = [], par = [], tu = [], tv = [], idx = [], NU = 10, NV = 7;
  for (const s of list) {
    const base = pos.length / 3, [a, b, c, d] = s.c;
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) {
      const u = i / NU, v = j / NV;
      for (let k = 0; k < 3; k++) pos.push(lerp(lerp(a[k], b[k], u), lerp(d[k], c[k], u), v));
      uv.push(u, v); belly.push(s.n[0] * s.amp, s.n[1] * s.amp, s.n[2] * s.amp); par.push(s.seed, s.reef ?? 0);
      for (let k = 0; k < 3; k++) { tu.push(lerp(b[k] - a[k], c[k] - d[k], v)); tv.push(lerp(d[k] - a[k], c[k] - b[k], u)); }
    }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const q = base + j * (NU + 1) + i; idx.push(q, q + 1, q + NU + 2, q, q + NU + 2, q + NU + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aBelly', new THREE.Float32BufferAttribute(belly, 3)); g.setAttribute('aPar', new THREE.Float32BufferAttribute(par, 2));
  g.setAttribute('aTu', new THREE.Float32BufferAttribute(tu, 3)); g.setAttribute('aTv', new THREE.Float32BufferAttribute(tv, 3)); g.setIndex(idx);
  const uniforms = { ...fx.fogUniforms(), ...U };
  const material = new THREE.ShaderMaterial({
    uniforms, fog: true, side: THREE.DoubleSide,
    vertexShader: fx.GLSL_FOG_PARS_VERT + /* glsl */`
attribute vec3 aBelly, aTu, aTv; attribute vec2 aPar; uniform float uTime;
varying vec3 vWp, vN; varying vec2 vUv; varying float vSeed, vReef;
void main(){
  float u = uv.x, v = uv.y, seed = aPar.x;
  float vv = min(v*1.15, 1.), sv = sqrt(max(sin(3.1416*vv), 0.));
  float full = sin(3.1416*u)*sv;
  float live = 1. + .14*sin(uTime*1.6 + seed*40. + u*4.) + .08*sin(uTime*3.3 + v*6. + seed*17.);
  float shiver = .06*sin(uTime*9. + u*23. + seed*9.)*smoothstep(.7, 1., v)*sin(3.1416*u);
  vec3 p = position + aBelly*(full*live + shiver);
  // the sheet's normal from its own slope
  float fu = 3.1416*cos(3.1416*u)*sv*live, fv = sin(3.1416*u)*live*step(v*1.15, 1.)*1.806*cos(3.1416*vv)/max(sv, .35);
  vN = mat3(modelMatrix)*cross(aTu + aBelly*fu, aTv + aBelly*fv);
  vec4 wp = modelMatrix*vec4(p, 1.); vWp = wp.xyz; vUv = uv; vSeed = seed; vReef = aPar.y;
  vec4 mvPosition = viewMatrix*wp;
  gl_Position = projectionMatrix*mvPosition;
  ${fx.GLSL_FOG_VERT}
}`,
    fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + fx.GLSL_FOG_PARS_FRAG + /* glsl */`
uniform vec3 uAmb, uMoon, uMoonDir, uRingCol; uniform vec4 uRing, uLamps[3];
varying vec3 vWp, vN; varying vec2 vUv; varying float vSeed, vReef;
void main(){
  vec3 E = vWp - cameraPosition, n = normalize(vN);
  n *= -sign(dot(n, E) + 1e-6);
  // canvas: sewn cloths, weather stains, bands of reef points
  float seam = 1. - .2*(1. - smoothstep(.0, .06, abs(fract(vUv.x*9.) - .5)*2. - .0));
  float stain = .78 + .3*vnoise(vec2(vUv.x*5. + vSeed*30., vUv.y*3.));
  float band = 1. - .28*vReef*(1. - smoothstep(.0, .025, abs(vUv.y - .16)))*step(.5, fract(vUv.x*40.));
  vec3 cloth = vec3(.4, .39, .36)*seam*stain*band;
  float nl = dot(n, uMoonDir);
  vec3 light = uAmb*(.7 + .3*n.y) + uMoon*(max(nl, 0.) + .4*max(-nl, 0.));
  vec3 toR = uRing.xyz - vWp; float dr = length(toR), rl = dot(n, toR/max(dr, .01));
  light += uRingCol*uRing.w/(1. + dr*dr/1600.)*(max(rl, 0.) + .45*max(-rl, 0.));
  // each lantern's pool on the canvas near it
  for (int i = 0; i < 3; i++) { vec3 tl = uLamps[i].xyz - vWp; float d2 = dot(tl, tl), ll = dot(n, tl/sqrt(max(d2, 1e-4))); light += vec3(1., .456, .103)*uLamps[i].w*.9*(1. - smoothstep(320., 900., d2))/(1. + d2/16.)*(max(ll, 0.) + .5*max(-ll, 0.)); }
  gl_FragColor = vec4(fxApplyFog(cloth*light), 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

// ---- sparks (in the world's frame) ---------------------------------------------------------------------------------
// Sparks are things of the world. Each leaves its fire (a brazier, a lamplighter's pole) at a moment of the world's
// clock, from where that fire then is; from there it flies with what threw it, slows in the air, drifts with the wind
// and falls, and is shed again when it has died.
// list: [{ o: [x,y,z] where it is shed, v: [x,y,z] m/s, seed, life (s), size (m) }]. U: uTime, uWind (vec3, m/s)
function makeWorldSparks(list, U) {
  const n = list.length, g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
  const O = new Float32Array(Math.max(1, n) * 4), V = new Float32Array(Math.max(1, n) * 4), S = new Float32Array(Math.max(1, n) * 3);
  list.forEach((q, i) => { O.set([q.o[0], q.o[1], q.o[2], 0], i * 4); V.set([q.v[0], q.v[1], q.v[2], 0], i * 4); S.set([q.seed, q.life, q.size], i * 3); });
  g.setAttribute('aO', new THREE.InstancedBufferAttribute(O, 4)); g.setAttribute('aV', new THREE.InstancedBufferAttribute(V, 4)); g.setAttribute('aS', new THREE.InstancedBufferAttribute(S, 3));
  g.instanceCount = n;
  const material = new THREE.ShaderMaterial({
    uniforms: U, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */`
attribute vec4 aO, aV; attribute vec3 aS; uniform float uTime; uniform vec3 uWind;
varying vec2 vUv; varying float vK;
void main(){
  float life = max(aS.y, .05), age = fract(uTime/life + aS.x)*life, k = age/life;
  vec3 org = aO.xyz, v0 = aV.xyz;
  // what threw it carries it on while the air slows it (drag 1.7 a second); then the wind has it, and it falls
  float a = age, e = (1. - exp(-1.7*a))/1.7;
  vec3 vel = v0*exp(-1.7*a) + uWind*(1. - exp(-1.7*a)) + vec3(0., -2.4*a, 0.);
  vec3 p = org + v0*e + uWind*(a - e) + vec3(0., -1.2*a*a, 0.);
  p += vec3(sin(aS.x*40. + a*7.), cos(aS.x*31. + a*6.), sin(aS.x*17. + a*5.))*.05*a;
  vec4 mv = viewMatrix*vec4(p, 1.);
  // a short streak along the way it moves past the eye
  vec3 rel = (viewMatrix*vec4(vel, 0.)).xyz; vec2 along = rel.xy; float al = length(along);
  along = mix(vec2(0., 1.), along/max(al, 1e-3), step(1e-3, al));
  float len = aS.z*(1. + .06*min(al, 9.)), wid = aS.z*.34;
  mv.xy += (along*position.y*len + vec2(along.y, -along.x)*position.x*wid);
  vUv = position.xy; vK = smoothstep(0., .05, k)*(1. - smoothstep(.55, 1., k))*(.55 + .45*sin(uTime*23. + aS.x*60.));
  // sparks are a medium of the air: the one lens law (none is drawn large in the lens)
  vK *= smoothstep(.6, 2.5, length(mv.xyz));
  gl_Position = projectionMatrix*mv;
}`,
    fragmentShader: FIRE_GLSL + /* glsl */`
varying vec2 vUv; varying float vK;
void main(){
  float a = (1. - smoothstep(.2, 1., abs(vUv.x)))*(1. - smoothstep(.5, 1., abs(vUv.y)));
  gl_FragColor = vec4(fireColor(1.3)*a*vK*5., 1.);
}`,
  });
  const mesh = new THREE.Mesh(g, material);
  mesh.frustumCulled = false; mesh.renderOrder = 10;
  return mesh;
}

// ---- the rude mass --------------------------------------------------------------------------------------------------
// ONE MAKER FOR EVERY GREAT STONE of the place (the moor's tors and fallen masses, the lesser stones, the cliff's crags,
// the caves' roofs, the skerries). A mass is a HEAP OF LUMPS: great worn boulders and slabs, o.lumps of them, lying
// as weather has left them: a low mass is slabs side by side; a higher one has boulders lying on boulders, each
// sitting down into what it rests on (MASS.sit of its height; an upper tier is MASS.upper as broad); a mass taller
// than it is broad is one standing lump with the others leaning against its foot. Each is tipped its own way
// (MASS.tip radians). A LUMP is one round body with no flat face and no edge: its plan and its upright section are
// rounded figures (MASS.plan, MASS.round: the power of each outline; 2 is an ellipse, and at 4 an edge's radius is
// still a fifth of the side, so none is squarer than 3.6), its top and bed flattened by that same figure, its faces
// bulging in and out (MASS.bulge of its reach, two to four swells round it) with one shoulder broken away. The
// lumps of a mass are unlike in size and outline. No lump carries a cap: where two lumps meet, the hollow between
// them is marked for snow (the fourth number of a colour), and the rock's own material lays snow on lee shoulders.
// Given in the mass's own frame: x, z in plan from its middle, y up from the ground at its foot; its farthest reach in
// plan above the ground is exactly o.w / 2 and its top stands o.h over the ground (so a rule that places it by its
// nearest face is exact), and it goes o.sink metres down into the ground. The whole mass leans as ONE (o.lean).
// o: { w, h, sink (m), lean: [x, z], yaw, lumps, K (corners round a lump), taper (how far the upper tiers draw in),
// bury (how much of the base tier's height lies under the foot besides: MASS.bury), lite (a small boulder: one
// lump), side (colour) }
// Returns { p, n, c: [r, g, b, snow ...] } (three corners a face, wound outward; n are the worn, rounded normals)
export const MASS = { plan: [2.1, 2.9], round: [2.5, 3.6], bulge: [0.05, 0.13], tip: 0.2, sit: [0.3, 0.5], bury: 0.3, facet: 0.2, tiers: 2.3, upper: 0.86, lean: [0.3, 0.5, 0.72], draw: 0.6, head: [2.0, 2.5] };
export function rudeMass(r, o) {
  const P = [], N = [], C = [], n = o.lite ? 1 : Math.max(1, o.lumps ?? 3), W = o.w / 2, H = o.h, taper = o.taper ?? 0.45;
  const K = o.K + 3, M = Math.max(4, Math.round(K * 0.55));
  const cxl = Math.cos(o.lean[0]), sxl = Math.sin(o.lean[0]), czl = Math.cos(o.lean[1]), szl = Math.sin(o.lean[1]), cyw = Math.cos(o.yaw), syw = Math.sin(o.yaw);
  // a place of the heap (metres, y from the ground) leaning as one mass and turned
  const place = (x, y, z) => {
    const y1 = y * cxl - z * sxl, z1 = y * sxl + z * cxl, x2 = x * czl - y1 * szl, y2 = x * szl + y1 * czl;
    return [x2 * cyw + z1 * syw, y2, -x2 * syw + z1 * cyw];
  };
  // one lump: its middle in plan, its foot and top (metres from the ground), its half length; `tip`: how far it may tip
  const lumps = [], lump = (x, z, lo, hi, A, tip) => lumps.push({ x, y: (lo + hi) / 2, z, A, B: (hi - lo) / 2, C: A * r.range(0.62, 0.95), yaw: r.range(0, 6.2832), tx: r.range(-tip, tip), tz: r.range(-tip, tip), e1: r.range(MASS.plan[0], MASS.plan[1]), e2: r.range(MASS.round[0], MASS.round[1]),
    sw: [2, 3, 4].map((k) => [k, r.range(MASS.bulge[0], MASS.bulge[1]) * (r.chance(0.5) ? 1 : -1), r.range(0, 6.2832)]), swl: [r.range(MASS.bulge[0], MASS.bulge[1]), r.range(0, 6.2832)],
    bite: [r.range(0, 6.2832), r.range(-0.2, 0.9), r.chance(0.75) ? r.range(0.1, 0.24) : 0, r.range(0.5, 0.9)], tone: r.range(0.8, 1.2), draw: 0 });
  // THE HEAP'S PLAN: how many tiers (by the mass's height to its width), how many lumps to each (the base takes the
  // most), each tier's share of the height (the lower the thicker)
  const tiers = clamp(Math.round(H / (2 * W) * MASS.tiers), 1, Math.min(3, n)), count = new Array(tiers).fill(1), bury = o.sink + (o.bury ?? MASS.bury) * H / tiers;
  for (let k = 0; k < n - tiers; k++) count[tiers === 1 ? 0 : [0, 0, 1, 0][k % 4]]++;
  if (tiers === 3) {
    // A STANDING MASS (taller than it is broad): one lump stands its whole height; the others lean against its
    // foot round about, the first of them the tallest (MASS.lean: their tops, of the mass's height)
    const ring = r.range(0, 6.2832);
    lump(W * r.range(-0.08, 0.08), W * r.range(-0.08, 0.08), -bury, H, W * r.range(0.6, 0.72), MASS.tip * 0.5);
    // (the standing lump draws in toward its head, MASS.draw of the mass's taper, and its head is rounder than a
    // lying lump's: MASS.head, the figure's power up and down)
    { const st = lumps[lumps.length - 1]; st.draw = taper * MASS.draw; st.e2 = lerp(MASS.head[0], MASS.head[1], (st.e2 - MASS.round[0]) / (MASS.round[1] - MASS.round[0])); }
    for (let j = 1; j < n; j++) {
      const a = ring + j * 6.2832 / (n - 1) + r.range(-0.35, 0.35), d = W * r.range(0.4, 0.55);
      lump(Math.cos(a) * d, Math.sin(a) * d, -bury, H * (j === 1 ? r.range(MASS.lean[1], MASS.lean[2]) : r.range(MASS.lean[0], MASS.lean[1])), W * r.range(0.4, 0.56), MASS.tip);
    }
  } else {
    const share = count.map((c, t) => (1.3 - 0.35 * t) * r.range(0.8, 1.2)), sum = share.reduce((a, b) => a + b, 0);
    for (let t = 0, y0 = 0; t < tiers; t++) {
      const ht = H * share[t] / sum, m = count[t], Rt = W * (t ? (1 - taper * t / tiers) * MASS.upper : 1), ring = r.range(0, 6.2832);
      for (let j = 0; j < m; j++) {
        const a = ring + j * 6.2832 / m + r.range(-0.35, 0.35), d = m === 1 ? Rt * r.range(0, t ? 0.3 : 0.08) : Rt * (m === 2 ? 0.42 : 0.5) * r.range(0.8, 1.15);
        const big = (m === 1 ? 0.95 : m === 2 ? 0.64 : 0.54) * (j ? r.range(0.72, 1) : 1.12), sit = t ? r.range(MASS.sit[0], MASS.sit[1]) * ht : bury;
        // (a lump stands a little lower or higher than its fellows of the tier: unlike tops)
        lump(Math.cos(a) * d, Math.sin(a) * d, y0 - sit, y0 + ht * (j ? r.range(0.72, 1) : 1), Rt * big, MASS.tip * (t ? 1.5 : 1));
      }
      y0 += ht;
    }
  }
  // each lump's own frame in the heap's (tipped two ways, turned), and back (for what lies inside another lump)
  for (const L of lumps) {
    const cy = Math.cos(L.yaw), sy = Math.sin(L.yaw), cx = Math.cos(L.tx), sx = Math.sin(L.tx), cz = Math.cos(L.tz), sz = Math.sin(L.tz);
    L.to = (x, y, z) => { const y1 = y * cx - z * sx, z1 = y * sx + z * cx, x2 = x * cz - y1 * sz, y2 = x * sz + y1 * cz; return [L.x + x2 * cy + z1 * sy, L.y + y2, L.z - x2 * sy + z1 * cy]; };
    L.from = (p) => { const X = p[0] - L.x, Y = p[1] - L.y, Z = p[2] - L.z, x2 = X * cy - Z * sy, z1 = X * sy + Z * cy, y1 = -x2 * sz + Y * cz; return [x2 * cz + Y * sz, y1 * cx + z1 * sx, -y1 * sx + z1 * cx]; };
    // (how far out of the lump's middle a place lies, by the lump's own figure: 1 on its face)
    L.out = (p) => {
      const X = p[0] - L.x, Y = p[1] - L.y, Z = p[2] - L.z, x2 = X * cy - Z * sy, z1 = X * sy + Z * cy, y1 = -x2 * sz + Y * cz, qx = x2 * cz + Y * sz, qy = y1 * cx + z1 * sx, qz = -y1 * sx + z1 * cx;
      const tp = 1 - L.draw * clamp(0.5 * (1 + qy / L.B), 0, 1);
      return ((Math.abs(qx / (L.A * tp)) ** L.e1 + Math.abs(qz / (L.C * tp)) ** L.e1) ** (L.e2 / L.e1) + Math.abs(qy / L.B) ** L.e2) ** (1 / L.e2);
    };
  }
  // (a face's corners take the worn normal turned MASS.facet of the way to the face's own: a little break, soft edges)
  const emit = (a, b, c2, na, nb, nc, ca, cb, cc) => {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c2[0] - a[0], vy = c2[1] - a[1], vz = c2[2] - a[2];
    let fx2 = uy * vz - uz * vy, fy2 = uz * vx - ux * vz, fz2 = ux * vy - uy * vx;
    const fl = Math.sqrt(fx2 * fx2 + fy2 * fy2 + fz2 * fz2);
    if (fl < 1e-9) return;
    if (fx2 * (na[0] + nb[0] + nc[0]) + fy2 * (na[1] + nb[1] + nc[1]) + fz2 * (na[2] + nb[2] + nc[2]) < 0) { [b, c2, nb, nc, cb, cc] = [c2, b, nc, nb, cc, cb]; fx2 = -fx2; fy2 = -fy2; fz2 = -fz2; }
    P.push(a[0], a[1], a[2], b[0], b[1], b[2], c2[0], c2[1], c2[2]);
    for (const m of [na, nb, nc]) N.push(m[0] * (1 - MASS.facet) + fx2 * MASS.facet / fl, m[1] * (1 - MASS.facet) + fy2 * MASS.facet / fl, m[2] * (1 - MASS.facet) + fz2 * MASS.facet / fl);
    C.push(ca[0], ca[1], ca[2], ca[3], cb[0], cb[1], cb[2], cb[3], cc[0], cc[1], cc[2], cc[3]);
  };
  const pw = (t, p) => (t < 0 ? -1 : 1) * Math.abs(t) ** p, grid = [], nrm = [], col = [], gone = [];
  lumps.forEach((L, li) => {
    const p1 = 2 / L.e1, p2 = 2 / L.e2, bd = [Math.cos(L.bite[0]) * Math.cos(L.bite[1]), Math.sin(L.bite[1]), Math.sin(L.bite[0]) * Math.cos(L.bite[1])];
    grid.length = 0; nrm.length = 0; col.length = 0; gone.length = 0;
    for (let i = 0; i <= M; i++) for (let j = 0; j < K; j++) {
      const b = -1.5708 + 3.1416 * i / M, a = j / K * 6.2832, cb = i === 0 || i === M ? 0 : Math.cos(b), sb = Math.sin(b), ca = Math.cos(a), sa = Math.sin(a);
      // its swells (none at the poles, where every corner of a ring is one place) and its broken shoulder
      let rr = 1 + L.swl[0] * Math.sin(2 * b + L.swl[1]);
      for (const [k, amp, ph] of L.sw) rr += amp * Math.sin(k * a + ph) * cb;
      rr *= 1 - L.bite[2] * Math.exp(-((Math.acos(clamp(ca * cb * bd[0] + sb * bd[1] + sa * cb * bd[2], -1, 1)) / L.bite[3]) ** 2));
      const h = pw(cb, p2) * (1 - L.draw * 0.5 * (1 + pw(sb, p2)));
      grid.push(L.to(L.A * h * pw(ca, p1) * rr, L.B * pw(sb, p2) * rr, L.C * h * pw(sa, p1) * rr));
    }
    for (let i = 0; i <= M; i++) for (let j = 0; j < K; j++) {
      const g0 = grid[i * K + j], ox = g0[0] - L.x, oy = g0[1] - L.y, oz = g0[2] - L.z;
      let nx = ox, ny = oy, nz = oz;
      if (i > 0 && i < M) {
        // the worn normal: across its neighbours round the lump and up it
        const A2 = grid[i * K + (j + 1) % K], B2 = grid[i * K + (j + K - 1) % K], U = grid[(i + 1) * K + j], D = grid[(i - 1) * K + j];
        const ux = A2[0] - B2[0], uy = A2[1] - B2[1], uz = A2[2] - B2[2], vx = U[0] - D[0], vy = U[1] - D[1], vz = U[2] - D[2];
        nx = vy * uz - vz * uy; ny = vz * ux - vx * uz; nz = vx * uy - vy * ux;
        if (nx * ox + ny * oy + nz * oz < 0) { nx = -nx; ny = -ny; nz = -nz; }
      }
      const l = Math.hypot(nx, ny, nz) || 1;
      nx /= l; ny /= l; nz /= l;
      // how deep this place lies in the hollow against another lump (1 on or in it, 0 clear of it by a third of its reach)
      let crev = 0, deep = 9;
      for (let k = 0; k < lumps.length; k++) if (k !== li) { const gv = lumps[k].out(g0); deep = Math.min(deep, gv); crev = Math.max(crev, 1 - smoothstep(0.92, 1.35, gv)); }
      const ao = (0.6 + 0.4 * smoothstep(-0.6, 0.3, ny)) * (1 - 0.5 * crev) * L.tone;
      nrm.push(place(nx, ny, nz)); col.push([o.side[0] * ao, o.side[1] * ao, o.side[2] * ao, crev * smoothstep(-0.1, 0.4, ny)]); gone.push(deep < 0.6);
    }
    for (let k = 0; k < grid.length; k++) grid[k] = place(grid[k][0], grid[k][1], grid[k][2]);
    for (let i = 0; i < M; i++) for (let j = 0; j < K; j++) {
      const j2 = (j + 1) % K, a = i * K + j, b = i * K + j2, c2 = (i + 1) * K + j2, d = (i + 1) * K + j;
      // (a face wholly inside another lump is not drawn)
      if (gone[a] && gone[b] && gone[c2] && gone[d]) continue;
      if (i > 0) emit(grid[a], grid[c2], grid[b], nrm[a], nrm[c2], nrm[b], col[a], col[c2], col[b]);
      if (i < M - 1) emit(grid[a], grid[d], grid[c2], nrm[a], nrm[d], nrm[c2], col[a], col[d], col[c2]);
    }
  });
  // its reach and its top are made exact
  let reach = 1e-6, top = 1e-6;
  for (let i = 0; i < P.length; i += 3) { if (P[i + 1] > 0) reach = Math.max(reach, P[i] * P[i] + P[i + 2] * P[i + 2]); top = Math.max(top, P[i + 1]); }
  reach = Math.sqrt(reach);
  const kx = W / reach, ky = o.h / top;
  for (let i = 0; i < P.length; i += 3) {
    P[i] *= kx; P[i + 2] *= kx; if (P[i + 1] > 0) P[i + 1] *= ky;
    const nx = N[i] / kx, ny = N[i + 1] / (P[i + 1] > 0 ? ky : 1), nz = N[i + 2] / kx, l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
    N[i] = nx / l; N[i + 1] = ny / l; N[i + 2] = nz / l;
  }
  return { p: P, n: N, c: C };
}

// The rock's own material: near-black stone whose lit faces rise to slate, in fine grain; lichen in small pale and
// ochre spots, moss low on the lee side. SNOW LIES WHERE THE WIND LETS IT: on the crown of a lump only where the wind
// has not scoured it (scour: a world noise; the lee half of a crown keeps its snow), on every shoulder turned from
// the wind that leans back enough to hold it, and in the hollows between lumps (the fourth number of the maker's
// colour): no even cap. Within reach of the sea's wash the rock is wet, bare and takes the moon. Lit by the scene's
// lights and its place's (the moon, the sky, the west's red on the faces turned west). U: uWindFrom (vec2)
function rockMaterial(U, place, placeKey) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.93, metalness: 0 });
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, U);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRp;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvRp = (modelMatrix*vec4(position, 1.)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + place + '\nvarying vec3 vRp; uniform vec2 uWindFrom; float rockWet = 0.;')
      .replace('#include <lights_fragment_end>', PLACE_APPLY('vRp'))
      .replace('#include <color_fragment>', /* glsl */`float snowMark = vColor.a;
diffuseColor.rgb *= vColor.rgb;
vec3 nW = inverseTransformDirection(normalize(vNormal), viewMatrix);
float rd = length(vViewPosition);
// (FINE GRAIN: three grains of 20, 9 and 4 cm, each read at a place pushed about by a slow noise so that no lattice
// shows as squares, and each let go where it would be finer than two dots of the picture: px2 metres at this face)
float px2 = rd*.0054;
vec3 rq = vRp + .4*vec3(vnoise(vRp*1.3 + 7.), vnoise(vRp*1.3 + 13.), vnoise(vRp*1.3 + 19.));
float g1 = mix(.5, vnoise(rq*5.), 1. - smoothstep(.5, 1., px2*5.)), g2 = mix(.5, vnoise(rq*11.), 1. - smoothstep(.5, 1., px2*11.)), g3 = mix(.5, vnoise(rq*27.), 1. - smoothstep(.5, 1., px2*27.));
float grain = g1*.45 + g2*.35 + g3*.2, broad = vnoise(rq*.8 + 3.), mid = vnoise(rq*2.3 + 17.);
diffuseColor.rgb *= (.74 + .52*grain)*(.86 + .28*broad);
float up = nW.y, wind = dot(nW.xz, uWindFrom);
// lichen: small crusts, pale and ochre, where the stone is dry and stands in the light
float crust = smoothstep(.62, .7, g1*.65 + g2*.35)*(1. - smoothstep(.3, .8, px2*5.));
diffuseColor.rgb = mix(diffuseColor.rgb, mix(vec3(.085, .095, .08), vec3(.1, .078, .036), step(.5, mid))*(.7 + .6*g3), crust*.55);
float moss = smoothstep(.1, .6, -wind)*smoothstep(.5, .72, vnoise(rq*1.6 + 5.)*.7 + .3*grain)*(1. - smoothstep(.3, .7, up));
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.05, .07, .03)*(.7 + .6*grain), moss*.55);
// the sea's reach: within the wash (to 24 m over the sea) the rock is wet and holds no plaster; within the surf's
// splash (to 7 m) no snow lies on it either
float wash = 1. - smoothstep(8., 24., vRp.y), splash = 1. - smoothstep(2.5, 7., vRp.y);
// snow: NO EVEN CAP. It lies in the hollows where two lumps meet (the maker's mark), on the shoulders turned down
// the wind, and on the crowns, where the wind has scoured bare patches on every side but the lee; plastered to windward
float sheet = smoothstep(.46, .6, vnoise(rq*.42 + 31.)*.55 + mid*.27 + grain*.18);
float upn = up + .25*(grain - .5), leeSide = smoothstep(-.15, .45, -wind), scour = smoothstep(.36, .6, vnoise(vRp*.3 + 23.)*.6 + broad*.4);
float crown = smoothstep(.6, .8, upn)*mix(1. - .85*scour, 1., leeSide), shoulder = smoothstep(.22, .5, upn)*leeSide*(.55 + .45*sheet);
float lying = max(max(crown, shoulder), snowMark*smoothstep(0., .3, upn));
float plaster = smoothstep(.2, .85, wind + .5*(broad - .5))*mix(sheet, .3, smoothstep(.6, 1.6, px2*.42))*smoothstep(-.5, -.1, up);
float snow = clamp(max(lying*(1. - splash), .9*plaster*(1. - wash)), 0., 1.);
rockWet = wash*(1. - snow);
diffuseColor.rgb = mix(diffuseColor.rgb*mix(1., .6, rockWet), vec3(.72, .77, .88)*(.9 + .2*grain), snow);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, .3, rockWet);');
  };
  mat.customProgramCacheKey = () => 'lidp-rock-r6' + placeKey;
  return mat;
}

// the shore under the cliffs: the shelf's height over the sea's level, the metres from the cliff's line at which it
// goes down into deep water
const SHORE = { y: [0.5, 1.5], out: [15, 21] };
// ---- the land's rule ------------------------------------------------------------------------------------------------
// The moor's stones and pools are dealt here, before the ground, so that the ground can sit round them (a hollow and a
// bank for each pool, a drift in the lee of each stone). No renderer is needed: the same seed gives the same land.
// o: { noise, path, S (metres of the route's places), R: { great, stones, pools, cliffStones }, windFrom: [x, z], detail }
export function layLand(o) {
  const { noise, path, S, R, detail = 1 } = o, wx = o.windFrom[0], wz = o.windFrom[1];
  const _v = new THREE.Vector3(), _t = new THREE.Vector3();
  // the route from the lane's end to the cliff, every 2 m (x, y, z)
  const rs = [];
  for (let s = S.laneOut; s <= S.cliff + 12; s += 2) { path.posAtDist(s, _v); rs.push(_v.x, _v.y, _v.z); }
  // [metres from the route's line in plan, the route's height there]
  const nearRoute = (x, z) => {
    let best = 1e12, bi = 0;
    for (let i = 0; i < rs.length; i += 24) { const d = (rs[i] - x) ** 2 + (rs[i + 2] - z) ** 2; if (d < best) { best = d; bi = i; } }
    let by = rs[bi + 1];
    for (let i = Math.max(0, bi - 24), i1 = Math.min(rs.length, bi + 27); i < i1; i += 3) { const d = (rs[i] - x) ** 2 + (rs[i + 2] - z) ** 2; if (d <= best) { best = d; by = rs[i + 1]; bi = i; } }
    return [Math.sqrt(best), by, bi];
  };
  const moorAt = (x, z) => {
    let h = MOOR_Y + 2.4 * noise.fbm2(x * 0.011 + 3.1, z * 0.011 - 1.7, 3) + 0.9 * noise.n2(x * 0.045, z * 0.045);
    // hills far to the west and to the north
    if (x < -720) h += 26 * smoothstep(-720, -1350, x) * (0.55 + 0.45 * noise.n2(x * 0.0035, z * 0.0035 + 9));
    if (z < -230) h += 18 * smoothstep(-230, -430, z) * (0.5 + 0.5 * noise.n2(x * 0.004 + 5, z * 0.004));
    return h;
  };
  // ---- the coast's line: the main cliff along z 215, two headlands as blocks of rock reaching out to z 290 or so;
  // west of the western headland the land falls away to the north, so that from the ship no shore is near
  const FACE_E = HEAD_E - HEAD_HALF * 0.9, FACE_W = HEAD_W + HEAD_HALF * 0.9, OUT_E = HEAD_E + 30, OUT_W = HEAD_W - 30;
  const baseEdge = (x) => CLIFF_Z + 6 * noise.n2(x * 0.021, 3.3) + 3 * noise.n2(x * 0.085, 6.1) + 34 * Math.max(0, noise.n2(x * 0.007, 8.8)) * smoothstep(50, 130, Math.min(Math.abs(x - HEAD_E), Math.abs(x - HEAD_W)))
    - 420 * smoothstep(OUT_W - 14, OUT_W - 150, x);
  const tipZ = (x) => CLIFF_Z + (HEAD_Z - CLIFF_Z) * (0.86 + 0.14 * noise.n2(x * 0.06, 2.2));
  // metres out to sea from that line (negative on land)
  const coast = (x, z) => { const t = z - tipZ(x); return Math.min(z - baseEdge(x), Math.max(FACE_E - x, x - OUT_E, t), Math.max(x - FACE_W, OUT_W - x, t)); };
  // z of the land's last edge on the line x
  const edgeZ = (x) => ((x > FACE_E && x < OUT_E) || (x > OUT_W && x < FACE_W) ? tipZ(x) : baseEdge(x));
  // THE SEA CAVES: each headland's inner face (its run from the cliff's line out to the headland's tip) is cut into
  // even shares, CAVE.n of them, and one mouth opens in each share: its middle is drawn over the WHOLE of its share
  // (less the mouth's own half width and CAVE.pillar of rock at each end, so that it lies in its share and rock stands
  // between two mouths); its half width is CAVE.k of the height of the bench of rock it is cut through, at its place.
  // Each: z of the mouth, the face it opens in, which way it runs in, half width
  const benchAt = (x, z) => 7.5 + 1.8 * noise.n2(x * 0.11, z * 0.11);
  const CAVE = { n: [2, 1], k: 0.8, pillar: 2 }, rc = R.caveMouths, run = HEAD_Z - CLIFF_Z, CAVES = [];
  [FACE_E, FACE_W].forEach((face, f) => {
    for (let k = 0, share = run / CAVE.n[f]; k < CAVE.n[f]; k++) {
      const t = rc(), mid = CLIFF_Z + (k + 0.5) * share, w = CAVE.k * benchAt(face, mid), z = mid + (t - 0.5) * Math.max(share - 2 * (w + CAVE.pillar), 0);
      CAVES.push({ face, z, into: f ? -1 : 1, w });
    }
  });

  // ---- the stones: scattered, lying and tilted, piled two and three together; none on end, none in a ring ------
  // each: { x, z, w (m across), h (m above the ground), kind, yaw, lean: [x, z], sink (share of h in the ground), great }
  const STONES = [];
  const poolE = (q, x, z) => { const dx = x - q.x, dz = z - q.z; return Math.hypot((dx * q.c + dz * q.sn) / q.a, (dz * q.c - dx * q.sn) / q.b); };
  const mainPool = { ...POOL, fixed: true };
  // the hut's sight: the fan between its open door and the 150 m of the line before it; nothing may stand in it
  const door = hutAt(HUT_DOOR.a, HUT.d / 2, 0), SIGHT = [];
  for (let s = S.sight; s <= S.yardEnd; s += 2) { path.posAtDist(s, _v); SIGHT.push(_v.x, _v.z); }
  const inSight = (x, z, r) => {
    for (let i = 0; i < SIGHT.length; i += 2) {
      const ax = SIGHT[i], az = SIGHT[i + 1], bx = door[0] - ax, bz = door[2] - az, t = clamp(((x - ax) * bx + (z - az) * bz) / Math.max(bx * bx + bz * bz, 1e-6), 0, 1);
      if (Math.hypot(x - ax - bx * t, z - az - bz * t) < r) return true;
    }
    return false;
  };
  // THE CART TRACK, LAID BY THE LAND from the gate to the hut's door (never through a place of the line): out of the
  // gate and down the way TRACK_AT.down metres, round the long pool's north-west bank TRACK_AT.bank metres outside
  // its ice, through the tors' gap TRACK_AT.side metres to the right of its middle, and so to the hut's door.
  // Sampled every 1.5 m (x, z)
  const TRACK = [], TRACK_AT = { down: 12, bank: 2.4, side: 6 };
  {
    const d1 = hutAt(HUT_DOOR.a - 1.5, HUT.d / 2 + 10, 0), d0 = hutAt(HUT_DOOR.a, HUT.d / 2 + 3.2, 0), pts = [[GATE[0], 0, GATE[1]], [GATE[0] + WAY[0] * TRACK_AT.down, 0, GATE[1] + WAY[1] * TRACK_AT.down]];
    // (a place of the pool's own frame: t of its half length along the way from its middle, k of its half width and m metres to the right)
    const byPool = (t, k, m) => pts.push([POOL.x + WAY[0] * POOL.a * t + WAY_N[0] * (POOL.b * k + m), 0, POOL.z + WAY[1] * POOL.a * t + WAY_N[1] * (POOL.b * k + m)]);
    byPool(-1.25, 0.75, 0); byPool(-0.6, 0.85, TRACK_AT.bank); byPool(0, 1, TRACK_AT.bank); byPool(0.6, 0.85, TRACK_AT.bank); byPool(1.2, 0.6, 0);
    pts.push([TOR_MID[0] + WAY_N[0] * TRACK_AT.side, 0, TOR_MID[1] + WAY_N[1] * TRACK_AT.side], [d1[0], 0, d1[2]], [d0[0], 0, d0[2]]);
    const tp = makePath(pts);
    for (let d = 0; d <= tp.length; d += 1.5) { tp.posAtDist(d, _v); TRACK.push(_v.x, _v.z); }
  }
  const onTrack = (x, z) => { let best = 1e12; for (let i = 0; i < TRACK.length; i += 2) { const d = (TRACK[i] - x) ** 2 + (TRACK[i + 1] - z) ** 2; if (d < best) best = d; } return Math.sqrt(best); };
  const fold = roadAtD(FOLD.s, FOLD.l);
  // may a stone w across stand at (x, z)? `gap` = clear metres it must keep from the route's line
  const free = (x, z, w, gap, shore = 1.12 + w / (2 * mainPool.b)) => {
    if (nearRoute(x, z)[0] < w / 2 + gap || z > edgeZ(x) - 10 - w) return false;
    const [s, l] = toRoad(x, z);
    if (s < TOWN.cot + 30 || (s < TOWN.road + 12 && Math.abs(l) < w / 2 + 7) || Math.hypot(x - fold[0], z - fold[1]) < w / 2 + 11 || onTrack(x, z) < w / 2 + 2.2) return false;
    if (poolE(mainPool, x, z) < shore || Math.hypot(x - HUT.x, z - HUT.z) < 17 + w / 2 || inSight(x, z, w / 2 + 1.5)) return false;
    return !STONES.some((q) => Math.hypot(q.x - x, q.z - z) < (q.w + w) * 0.56);
  };
  const KINDS = ['boulder', 'rock', 'slab'], CAST = { stand: 0.07, fallen: [0.2, 0.38] };
  const cast = (r, x, z, h, w, great) => {
    // (a standing mass leans no more than CAST.stand radians either way, 4 degrees; a fallen one, the `slab`, is
    // longer and lies over as ONE mass, CAST.fallen radians; each lump of a mass is tipped its own way besides: MASS.tip)
    const kind = r.pick(KINDS), yaw = r.range(0, 6.283), lean = [r.range(-CAST.stand, CAST.stand), r.range(-CAST.stand, CAST.stand)];
    if (kind === 'slab') lean[1] = (lean[1] < 0 ? -1 : 1) * r.range(CAST.fallen[0], CAST.fallen[1]);
    return { x, z, h, w: kind === 'slab' ? w * 1.25 : w, kind, yaw, lean, great };
  };
  // the two tors that have their places by the moor's plan keep them (nothing stands on end)
  for (const g of GREAT) STONES.push({ ...g, yaw: R.great.range(0, 6.283), lean: [R.great.range(-CAST.stand, CAST.stand), R.great.range(-CAST.stand, CAST.stand)], great: true, fixed: true });
  // THE GREAT STONES' RULE, from where the line has left the road (the off-road knot) to the cliff: one for every
  // GS.step metres of the line or closer, on alternate hands, 12 to 25 m across, its nearest face 8 to 16 m from the
  // line; twice (at two dealt turns of the count) two stand on both hands at once with 20 to 26 m between their faces
  // and the line through the middle. A stone keeps out of the road, the long pool, the hut's yard and the hut's
  // sight; where its hand has no room at one place the other hand is tried, then the place 5 m on. A fixed stone
  // counts for its hand where it stands.
  const GS = { step: [24, 32], w: [13, 25], h: [10, 20], gap: [STONE.tall, STONE.tall + 10], gate: STONE.pair };
  const hand = (x, z) => { const i = nearRoute(x, z)[2], j = Math.min(i, rs.length - 6); return (rs[j + 3] - rs[j]) * (z - rs[j + 2]) - (rs[j + 5] - rs[j + 2]) * (x - rs[j]) > 0 ? 1 : -1; };
  // (a fixed stone serves for its place of the line only where its own nearest face stands within the rule's reach)
  const fixedAt = STONES.map((g) => ({ s: S.laneOut + nearRoute(g.x, g.z)[2] / 3 * 2, hand: hand(g.x, g.z), d: nearRoute(g.x, g.z)[0] - g.w / 2 }));
  const greatOf = (r, w) => { const st = cast(r, 0, 0, clamp(w * r.range(0.62, 0.95), GS.h[0], GS.h[1]), w, true); st.w = w; return st; };
  const put = (r, st, s, side, gap) => {
    path.posAtDist(s, _v); path.tangentAtDist(s, _t);
    const tl = Math.hypot(_t.x, _t.z) || 1, lat = side * (gap + st.w / 2);
    st.x = _v.x - _t.z / tl * lat; st.z = _v.z + _t.x / tl * lat;
    // the line bends: what counts is the nearest of the whole line, and no face may come nearer than GS.gap[0]
    // (a great stone may stand at the long pool's shore, its foot in the ice)
    const face = nearRoute(st.x, st.z)[0] - st.w / 2;
    return face >= GS.gap[0] && face <= GS.gap[1] && free(st.x, st.z, st.w, GS.gap[0], 1.06);
  };
  // Two stretches (before the hut and after it; the hut is the subject of its own place). In each the stream picks the
  // pair's place among those with room on both hands; the line either side of it is dealt out in equal steps of
  // GS.step[1] or less, a stone to each step, on alternate hands. Each stone is tried at its place, then 4 and 8 m
  // either way, on its hand and on the other, with the dealt size and then the least the rule allows.
  for (const [r, s0, s1] of [[R.great, S.offRoad + R.great.range(0, 8), S.hut - GS.step[1]], [R.cliffStones, S.hut + GS.step[0] + R.cliffStones.range(0, 6), S.cliff - GS.step[1]]]) {
    let side = r.chance(0.5) ? 1 : -1;
    const room = [], trial = { w: GS.w[0] }, GG = [GS.gate[0] / 2 + 0.3, (GS.gate[0] + GS.gate[1]) / 4, GS.gate[1] / 2 - 0.3];
    for (let s = s0 + GS.step[0]; s < s1 - GS.step[0]; s += 4) if (GG.some((g) => put(r, trial, s, 1, g) && put(r, trial, s, -1, g))) room.push(s);
    const gateS = room.length ? room[r.int(0, room.length - 1)] : -1, marks = [];
    const deal = (a, b, first, last) => { const n = Math.max(1, Math.ceil((b - a) / GS.step[1])); for (let k = first ? 0 : 1; k <= n - (last ? 0 : 1); k++) marks.push([a + (b - a) * k / n, false]); };
    // (the pair is set first, so that no single stone has taken its room)
    if (gateS > 0) { marks.push([gateS, true]); deal(s0, gateS, true, false); deal(gateS, s1, false, true); } else deal(s0, s1, true, true);
    for (const [sm, gate] of marks) {
      const w = r.range(GS.w[0], GS.w[1]), wg = r.range(GS.w[0], 15), wm = r.range(GS.w[0], 15), gapG = r.range(GS.gate[0], GS.gate[1]) / 2, gap = r.range(GS.gap[0], GS.gap[1]), st = greatOf(r, w), a = greatOf(r, wg), m = greatOf(r, wm);
      // a fixed stone standing within half a step of this place serves for it
      const fx = fixedAt.find((f) => Math.abs(f.s - sm) < GS.step[0] * 0.5 && f.d <= GS.gap[1]);
      if (fx && !gate) { side = -fx.hand; continue; }
      let done = false;
      if (gate) for (const g of [gapG, ...GG, -GG[0], -GG[1], -GG[2]]) {
        // two on both hands at once, at the same place of the line, the same distance off
        if (g < 0) a.w = m.w = GS.w[0];
        if (!(put(r, a, sm, side, Math.abs(g)) && put(r, m, sm, -side, Math.abs(g)))) continue;
        a.gate = m.gate = true; STONES.push(a, m); side = -side; done = true; break;
      }
      for (const [off, least] of [[0, 0], [0, 1], [4, 0], [-4, 0], [4, 1], [-4, 1], [8, 1], [-8, 1]]) {
        if (done) break;
        if (least) st.w = GS.w[0];
        for (const [sd, g] of [[side, gap], [-side, gap], [side, GS.gap[1] - 0.2], [-side, GS.gap[1] - 0.2], [side, GS.gap[0] + 0.2], [-side, GS.gap[0] + 0.2]]) {
          if (!put(r, st, sm + off, sd, g)) continue;
          STONES.push(st); side = -sd; done = true; break;
        }
      }
    }
  }
  // one or two lesser masses thrown against each great one, on whichever side is free and away from the line (a stream
  // of their own: the count of great stones before them varies)
  for (const g of STONES.slice()) {
    for (let k = 0, n = R.piles.int(1, 2); k < 2; k++) {
      const h = g.h * R.piles.range(0.35, 0.6), w = h * R.piles.range(1.0, 1.6), a = R.piles.range(0, 6.283), st = cast(R.piles, 0, 0, h, w, false);
      st.x = g.x + Math.cos(a) * (g.w * 0.5 + w * 0.22); st.z = g.z + Math.sin(a) * (g.w * 0.5 + w * 0.22); st.lean[0] *= 1.6; st.piled = true;
      if (k < n && nearRoute(st.x, st.z)[0] > st.w / 2 + STONE.gap && poolE(mainPool, st.x, st.z) > 1.15 + st.w / (2 * mainPool.b) && Math.hypot(st.x - HUT.x, st.z - HUT.z) > 17 + st.w / 2 && !inSight(st.x, st.z, st.w / 2 + 1.5) && st.z < edgeZ(st.x) - 10 - st.w) STONES.push(st);
    }
  }
  // the lesser stones, 2 to 8 m, alone or two and three together, out to 110 m either side of the route
  for (let tries = 0, want = STONES.length + Math.round(R.stones.int(36, 46) * (detail < 0.75 ? 0.7 : 1)); STONES.length < want && tries < 900; tries++) {
    const w = 2 + 6 * R.stones() ** 2, s = R.stones.range(S.offRoad - 10, S.cliff - 6), side = R.stones.chance(0.5) ? 1 : -1, lat = side * (2.5 * w + 3 + 105 * R.stones() ** 1.8);
    const st = cast(R.stones, 0, 0, w * R.stones.range(0.45, 0.85), w, false), more = R.stones.chance(0.4) ? R.stones.int(1, 2) : 0, a = R.stones.range(0, 6.283), k2 = R.stones.range(0.5, 0.8);
    path.posAtDist(s, _v); path.tangentAtDist(s, _t);
    const tl = Math.hypot(_t.x, _t.z) || 1;
    st.x = _v.x - _t.z / tl * lat; st.z = _v.z + _t.x / tl * lat;
    if (!free(st.x, st.z, st.w, Math.max(STONE.gap, 2 * st.w + 2))) continue;
    STONES.push(st);
    for (let k = 0; k < more; k++) {
      const b2 = a + k * 2.2, w2 = w * k2, pile = { ...st, x: st.x + Math.cos(b2) * (w + w2) * 0.38, z: st.z + Math.sin(b2) * (w + w2) * 0.38, w: w2, h: st.h * k2, yaw: st.yaw + 1.3 + k, lean: [st.lean[1] * 1.4, -st.lean[0] * 1.4], piled: true };
      if (nearRoute(pile.x, pile.z)[0] > Math.max(STONE.gap + w2 / 2, 2.5 * w2 + 2) && !inSight(pile.x, pile.z, w2 / 2 + 1.5)) STONES.push(pile);
    }
  }
  // EVERY STONE ALIKE: one whose nearest face stands within STONE.tall metres of the line is no taller than STONE.low
  for (const st of STONES) if (nearRoute(st.x, st.z)[0] - st.w / 2 < STONE.tall) st.h = Math.min(st.h, STONE.low);
  return layLand2(o, { rs, nearRoute, moorAt, coast, edgeZ, baseEdge, benchAt, CAVES, FACE_E, FACE_W, STONES, poolE, mainPool, inSight, TRACK, onTrack, fold });
}

// The second half of the land's rule: the pools, then the height of the ground and its colour.
function layLand2(o, A) {
  const { noise, path, S, R } = o, wx = o.windFrom[0], wz = o.windFrom[1], { nearRoute, moorAt, coast, edgeZ, CAVES, STONES, poolE, mainPool } = A;
  const _v = new THREE.Vector3(), _t = new THREE.Vector3();
  // ---- frozen water everywhere: the long pool under the route, pools about the moor, pools at the
  // feet of great stones, flooded ruts along the road's last reach. Each: { x, z, a, b (half axes), c, sn (its turn), y }
  const pools = [mainPool];
  const turn = (q, yaw) => { q.c = Math.cos(yaw); q.sn = Math.sin(yaw); return q; };
  const room = (q) => {
    if (q.z > edgeZ(q.x) - 30 - q.a || Math.hypot(q.x - HUT.x, q.z - HUT.z) < q.a + 24 || A.onTrack(q.x, q.z) < q.a + 2.5 || Math.hypot(q.x - A.fold[0], q.z - A.fold[1]) < q.a + 10) return false;
    const [s, l] = toRoad(q.x, q.z);
    if (s < TOWN.cot + 16 || (!q.rut && s < TOWN.road + 10 && Math.abs(l) < q.a + 5)) return false;
    if (pools.some((p) => Math.hypot(p.x - q.x, p.z - q.z) < p.a + q.a + 5)) return false;
    return !STONES.some((st) => Math.hypot(st.x - q.x, st.z - q.z) < q.a * 0.85 + st.w * 0.5);
  };
  // THREE KINDS OF POOL, A STREAM EACH: the ruts' puddles (R.rutPools), the pools at the great stones' feet
  // (R.footPools), the moor's own (R.pools: their count, then their places, tried until the count is met: that loop
  // comes last and alone on its stream). Every value of a pool is drawn before it is tested.
  // flooded ruts: long and narrow, lying along the road
  for (let k = 0; k < 3; k++) {
    const rr = R.rutPools, s = lerp(TOWN.cot + 30, ROAD.turn - 20, (k + rr.range(0.1, 0.9)) / 3), q = turn({ a: rr.range(9, 16), b: rr.range(1.2, 1.9), rut: true }, -TH + rr.range(-0.05, 0.05));
    const p = SPW(s, rr.range(-1.1, 1.1), 0); q.x = p[0]; q.z = p[2];
    if (room(q)) pools.push(q);
  }
  // one at the foot of some of the great stones, on the side the route passes
  for (const st of STONES) {
    if (!st.great) continue;
    const want = R.footPools.chance(0.45), a = R.footPools.range(7, 12), b = R.footPools.range(3, 5), yaw = R.footPools.range(-0.5, 0.5);
    const [d] = nearRoute(st.x, st.z), e = 0.01 * Math.max(d, 1);
    // toward the route: the way the distance to it falls
    const gx = nearRoute(st.x + 1, st.z)[0] - nearRoute(st.x - 1, st.z)[0], gz = nearRoute(st.x, st.z + 1)[0] - nearRoute(st.x, st.z - 1)[0], gl = Math.hypot(gx, gz) || 1;
    const q = turn({ a, b, x: st.x - gx / gl * (st.w * 0.5 + b + 0.5 + e), z: st.z - gz / gl * (st.w * 0.5 + b + 0.5 + e) }, Math.atan2(-gx, gz) + yaw);
    if (want && room(q)) pools.push(q);
  }
  // and about the moor, out to 70 m from the route
  const MOOR_POOLS = R.pools.int(9, 13);
  for (let tries = 0, want = pools.length + MOOR_POOLS; pools.length < want && tries < 300; tries++) {
    const s = R.pools.range(S.lastLamp + 40, S.cliff - 30), lat = (R.pools.chance(0.5) ? 1 : -1) * R.pools.range(0, 70), q = turn({ a: R.pools.range(6, 19), b: R.pools.range(3.5, 8.5) }, R.pools.range(0, 3.1416));
    path.posAtDist(s, _v); path.tangentAtDist(s, _t);
    const tl = Math.hypot(_t.x, _t.z) || 1;
    q.x = _v.x - _t.z / tl * lat; q.z = _v.z + _t.x / tl * lat;
    if (room(q)) pools.push(q);
  }
  // ---- the ground before the pools are let into it ---------------------------------------------------------------
  const shelf = (s, l) => (1 - smoothstep(TOWN.cot + HILL[0], TOWN.cot + HILL[1], s)) * (1 - smoothstep(140, 196, -l)) * (1 - smoothstep(215, 265, l));
  // the road's own height: read off every 8 m of its line (level with the town's floor on the shelf, the moor's own
  // height beyond) and straight between, from the entry to ROAD.far; the built road and whoever goes along it use it
  const RY = new Float32Array(Math.ceil(ROAD.far / 8) + 2);
  for (let k = 0; k < RY.length; k++) { const p = roadAtD(k * 8); RY[k] = lerp(STREET_Y - 0.15, moorAt(p[0], p[1]), 1 - shelf(k * 8, 0)); }
  const roadAt = (d) => { const f = clamp(d / 8, 0, RY.length - 1.001), k = Math.floor(f); return lerp(RY[k], RY[k + 1], f - k); };
  // the swells stand on the open moor: none on the town's shelf, coming in from the last lamp to where the line
  // leaves the road
  const swell = swellOf(wx, wz);
  const swellOn = (x, z) => { const [s, l] = toStreet(x, z); return s <= TOWN.lamp ? 0 : swell(x, z) * smoothstep(TOWN.lamp, OFF_ROAD, s) * (1 - shelf(s, l)); };
  // THE GROUND UNDER THE LINE, from the off-road knot to the cliff: within 8 m of the line the land's own level lies
  // HOLD.hi to HOLD.lo metres under it and the swells ride on that whole (so the line runs HOLD.hi - SWELL.h to
  // HOLD.lo + SWELL.h metres over ground, and no deeper than 4.35 m over ice); the hold loosens with every metre
  // further out and comes on between the last lamp and the off-road knot. s of the route's samples: S.laneOut + 2 m each
  const HOLD = { near: 8, lo: 4.4, hi: 3.9 }, ICE = { lo: 3.6, hi: 3.2 };
  const hold = (x, z, top, sw = swellOn(x, z)) => {
    if (!(x < OX - TOWN.cot && x > HEAD_W && z > -60 && z < 250)) return top;
    const [d, by, i] = nearRoute(x, z);
    if (d > 60) return top;
    const sR = S.laneOut + i / 3 * 2, k = smoothstep(S.lamp, S.offRoad, sR) * (1 - smoothstep(S.cliff + 2, S.cliff + 10, sR)), out = Math.max(0, d - HOLD.near);
    return lerp(top, clamp(top - sw, by - HOLD.lo - out * 0.5, by - HOLD.hi + out * 0.22) + sw, k);
  };
  const base = (x, z) => {
    const sw = swellOn(x, z);
    let top = moorAt(x, z) + sw;
    const [s, l] = toStreet(x, z);
    if (s > -400 && s < TOWN.cot + HILL[1] + 2) top = lerp(top, STREET_Y - 0.15, shelf(s, l));
    // the road: level across, falling with the land along its length, dying out in the frost where it is built no further
    if (s > TOWN.lane - 10) {
      const [d, lr] = toRoad(x, z);
      if (d < TOWN.road + 4 && Math.abs(lr) < 9) top = lerp(top, roadAt(d), (1 - smoothstep(3.4, 8.5, Math.abs(lr))) * (1 - smoothstep(TOWN.road - 40, TOWN.road, d)));
    }
    top = hold(x, z, top, sw);
    // the hut's floor and yard lie level
    const dh = Math.hypot(x - HUT.x, z - HUT.z);
    if (dh < 26) top = lerp(HUT_Y, top, smoothstep(13, 26, dh));
    return top;
  };
  // each pool's ice lies 0.3 m under the lowest point of its own rim; its banks are shaped to it (see land)
  for (const q of pools) {
    let low = 1e9;
    for (let k = 0; k < 14; k++) { const a = k / 14 * 6.2832, ex = Math.cos(a) * q.a * 1.15, ez = Math.sin(a) * q.b * 1.15; low = Math.min(low, base(q.x + ex * q.c - ez * q.sn, q.z + ex * q.sn + ez * q.c)); }
    q.y = low - 0.3;
    // under the line the ice lies no deeper than ICE.lo and no nearer than ICE.hi metres under it (its banks are
    // raised or cut to hold it: see land), so that neither ice nor bank comes nearer the line than the ground may
    const [d, by] = nearRoute(q.x, q.z);
    if (d < q.a + 4) q.y = Math.max(q.y, by - ICE.lo);
    // (a pool's bank reaches POOL_BANK of its half axes: its ice keeps ICE.hi under the lowest point of the line over it)
    let lowBy = 1e9;
    for (let i = 0; i < A.rs.length; i += 3) if (poolE(q, A.rs[i], A.rs[i + 2]) < POOL_BANK + 0.05) lowBy = Math.min(lowBy, A.rs[i + 1]);
    if (lowBy < 1e9) q.y = Math.min(q.y, lowBy - ICE.hi);
  }
  // the shore of a pool is ragged: its rim rides in and out
  const shore = (q, x, z) => poolE(q, x, z) * (1 + 0.2 * noise.n2(x * 0.13 + q.a, z * 0.13) + 0.07 * noise.n2(x * 0.5, z * 0.5 + q.b));
  // THE SNOW ABOUT EVERY STONE over 3 m, by the wind's bearing: a drift lies up its lee side (its crest against the
  // lee face, DRIFT.h of the stone's height, tailing away down the wind) and the wind has scoured a hollow at its
  // weather foot (DRIFT.scour metres and a share of its width deep). Each: its middle, half axes along and across
  // the wind, its height (a hollow's is under nought)
  const lee = [], DRIFT = { h: [0.2, 0.5, 2.6], scour: [0.3, 0.03] };
  for (const st of STONES) if (st.w > 3) {
    lee.push({ x: st.x - wx * (st.w * 0.5 + 0.6), z: st.z - wz * (st.w * 0.5 + 0.6), a: st.w * 0.95 + 2, b: st.w * 0.45 + 1, h: clamp(DRIFT.h[0] * st.h, DRIFT.h[1], DRIFT.h[2]) });
    lee.push({ x: st.x + wx * (st.w * 0.5 + 1.2), z: st.z + wz * (st.w * 0.5 + 1.2), a: st.w * 0.25 + 1.6, b: st.w * 0.5 + 1, h: -(DRIFT.scour[0] + DRIFT.scour[1] * st.w) });
  }
  // which pools and drifts can reach a place: a grid of 32 m cells over the moor
  const CELL = 32, cells = new Map(), leeCells = new Map(), key = (x, z) => Math.floor(x / CELL) * 4096 + Math.floor(z / CELL);
  const reach = (map, q, r) => {
    for (let i = Math.floor((q.x - r) / CELL); i <= Math.floor((q.x + r) / CELL); i++) for (let j = Math.floor((q.z - r) / CELL); j <= Math.floor((q.z + r) / CELL); j++) {
      const k = i * 4096 + j, c = map.get(k) || []; c.push(q); map.set(k, c);
    }
  };
  for (const q of pools) reach(cells, q, q.a * (POOL_BANK + 0.05));
  for (const d of lee) reach(leeCells, d, Math.max(d.a, d.b));
  // metres of drift lying at a place (the deepest that reaches it), less the deepest hollow scoured there
  const drift = (x, z) => {
    const near = leeCells.get(key(x, z));
    let k = 0, low = 0;
    if (near) for (const d of near) {
      const dx = x - d.x, dz = z - d.z, m = Math.max(d.a, d.b);
      if (Math.abs(dx) > m || Math.abs(dz) > m) continue;
      const al = -(dx * wx + dz * wz) / d.a, ac = (dx * wz - dz * wx) / d.b, e = al * al + ac * ac;
      if (e < 1) { const v = (1 - e) * (1 - e) * d.h; if (v > 0) k = Math.max(k, v); else low = Math.min(low, v); }
    }
    return k + low;
  };
  const land = (x, z) => {
    // well out from the land's edge there is only deep water (the caves are cut no deeper than it)
    const inland = z < CLIFF_Z - 100 - 420 * smoothstep(HEAD_W - 46, HEAD_W - 186, x), D = inland ? -100 : coast(x, z);
    if (D > SHORE.out[1] + 6) return -6 - 0.04 * D;
    let top = base(x, z);
    // (a drift in a stone's lee lies on the ground as the line's hold leaves it, and is held in its turn)
    if (x < OX - TOWN.cot && x > HEAD_W) { const dr = drift(x, z); if (dr !== 0) top = hold(x, z, top + dr); }
    const near = cells.get(key(x, z));
    if (near) for (const q of near) {
      const e = shore(q, x, z);
      // the bed 0.6 m under the ice; the bank's crest 0.3 to 0.6 m over it, then the land's own height by POOL_BANK
      if (e < POOL_BANK) top = lerp(q.y - 0.6 + (1.05 + 0.15 * noise.n2(x * 0.21, z * 0.21 + q.a)) * smoothstep(0.8, 1.1, e), Math.max(top, q.y + 0.3), smoothstep(1.1, POOL_BANK, e));
    }
    // and well inland the coast has no say
    if (inland) return top;
    // (toward its edge the land comes to the cliff top's own height, and the ground under the line keeps its hold)
    top = hold(x, z, lerp(CLIFF_TOP + 0.8 * noise.n2(x * 0.06, z * 0.06), top, smoothstep(0, COAST_FALL, -D)));
    // THE LAND ENDS IN A SHORE: the cliff falls in crags (a ledge two thirds of the way up, a bench above the surf),
    // and at its foot lies a shelf of black rock and shingle SHORE.y metres over the sea's level, out to SHORE.out
    // metres from the cliff's line, where the swell breaks; then deep water
    const dr = D + 1.6 * noise.n2(x * 0.23, z * 0.23) + 1.2 * noise.n2(x * 0.09 + 5, z * 0.09);
    const ledge = 19 + 3 * noise.n2(x * 0.07, z * 0.07 + 3), benchY = A.benchAt(x, z);
    const k1 = smoothstep(-1.5, 1.5, dr), k2 = smoothstep(3.5, 6.5 + 2 * noise.n2(x * 0.05, 4.1), dr), k3 = smoothstep(8.5, 12 + 3 * noise.n2(x * 0.05, 7.7), dr);
    const shoreY = SHORE.y[0] + (SHORE.y[1] - SHORE.y[0]) * (0.5 + 0.5 * noise.n2(x * 0.31, z * 0.31 + 9)), k4 = smoothstep(SHORE.out[0], SHORE.out[1] + 3 * noise.n2(x * 0.06, 12.3), dr);
    let h = lerp(lerp(lerp(lerp(top, ledge, k1), benchY, k2), shoreY, k3), -6 - 0.04 * Math.max(0, D), k4);
    // the sea caves: clefts cut through bench and face, 14 to 17 m into the rock
    for (const c of CAVES) {
      const dep = (x - c.face) * c.into;
      if (dep > -15 && dep < 18 && Math.abs(z - c.z) < c.w + 2) h = Math.min(h, lerp(h, -3.5, (1 - smoothstep(c.w - 1, c.w + 1, Math.abs(z - c.z))) * (1 - smoothstep(14, 17.5, dep))));
    }
    return h;
  };
  // how near a pool's rim a place lies (the least of shore() over the pools that can reach it; 9 where none can)
  const shoreAt = (x, z) => { const near = cells.get(key(x, z)); let m = 9; if (near) for (const q of near) m = Math.min(m, shore(q, x, z)); return m; };
  return { ...A, pools, land, base, shelf, roadAt, shore, shoreAt, drift, HOLD, swellOn };
}

// ---- the lamplighters' rule (no renderer is needed) ---------------------------------------------------------------
// Lamplighters walk their rounds on the world's clock, whoever comes, and each lamp of the north kerb is lit where
// its lighter has been. A round is a length of the town's north side, out and home again at a trot, for ever:
//   0  the first street's north pavement, from the entry's end to the square's mouth
//   1  the square's north side, straight on from the street's pavement (the line swings to the square's south)
//   2  the road's north verge before the cottages' garden walls, out to the town's last lamp
// NO LIGHTER COMES WITHIN LIGHTER.clear METRES OF THE LINE, body or pole, at any moment of his round: a round is
// laid only where a man walking LIGHTER.lat in from the kerb (clear of the lamp posts on the kerb and of the goods
// boards under the shop windows, which reach 1.1 m out from fronts 2.2 m behind the kerb; the square's stalls,
// braziers and rail are set clear of his strip) keeps that far from it. So NO ROUND ENTERS THE LANE, whose pavement
// is too near the line: the lane's lamps burn always, as the south kerb's do; and the road's round begins at
// `roadFrom`, the first metre of the verge from which the gap holds all the way out (the build measures it against
// the line; a lamp of the road nearer the lane than that burns always too).
// A round's period is its length, twice, at its lighter's own trot (dealt), and a turn-about at each end; the three
// set out a third of a round apart, from one dealt turn. A lamp comes alight when its lighter comes abeam of it on his
// way out, burns for its own dealt share of the round (two thirds to four fifths) and gutters out until he comes
// again: a length of kerb behind each lighter is alight, a length before him dark. The lamps of the south kerb are on
// no round and burn the whole visit. Wherever the dealt shares would leave fewer than half of the lamps of any 80 m
// of the town (that holds two lamps or more) alight at some moment, the dark shares of the round with most dark there are shortened (counted here,
// on the lamps as they stand). r: the lamplighters' stream; lamps: [{ s, side }] (the street's frame). Sets on every
// lamp its round (-1: none), at (the share of the round at which he reaches it) and burn (its share alight).
// planLamps: where the town's lamps stand, by metres along the street's line (side +1: the north kerb).
// ---- the crags' rule ------------------------------------------------------------------------------------------------
// Every CRAG.step metres or so along the land's last edge (the cove's back, both headlands' faces and fronts) stand
// three masses one under another: a buttress under the brow, another from the shelf down to the bench, a fallen
// block in the surf at the foot. A crag fills a round of half width hw about its middle from y - hh to y + hh (its
// shape, a heap of worn lumps, reaches exactly so far: rudeMass). NO CRAG STANDS WITHIN CRAG.clear METRES OF THE LINE: the
// gap from every metre of the line to that round, in space, is measured and the crag left out if it is less; none
// stands in a cave's mouth. No renderer is needed. o: { LAND, path, S, L, r (the stream of their places) }
export const CRAG = { clear: STONE.gap, step: [7, 11], tiers: [[1.2, 0], [5.6, 13, 7.6], [10.8, 2.6, 5.6]] };
export function layCrags(o) {
  const { LAND, path, S, L, r } = o, { edgeZ, land, FACE_E, FACE_W, CAVES } = LAND, _p = new THREE.Vector3(), RC = [], list = [];
  for (let d = S.cliff - 40; d < Math.min(L, S.cliff + 300); d += 1) { path.posAtDist(d, _p); RC.push(_p.x, _p.y, _p.z); }
  const gap = (x, y, z, hw, hh) => {
    let m = 1e9;
    for (let i = 0; i < RC.length; i += 3) { const dh = Math.max(0, Math.hypot(RC[i] - x, RC[i + 2] - z) - hw), dv = Math.max(0, Math.abs(RC[i + 1] - y) - hh); m = Math.min(m, Math.hypot(dh, dv)); }
    return m;
  };
  // the land's last edge as runs: [from, to, where(t) -> [x, z], outward normal]
  const zb = (x) => edgeZ(x), runs = [
    [zb(FACE_W + 1) + 4, zb(FACE_W - 1) - 3, (t) => [FACE_W, t], [1, 0]], [zb(FACE_E - 1) + 4, zb(FACE_E + 1) - 3, (t) => [FACE_E, t], [-1, 0]],
    [FACE_W + 4, FACE_E - 4, (t) => [t, zb(t)], [0, 1]], [HEAD_W - 30 + 3, FACE_W - 2, (t) => [t, zb(t)], [0, 1]], [FACE_E + 2, HEAD_E + 30 - 3, (t) => [t, zb(t)], [0, 1]],
    [zb(HEAD_E + 31) + 4, zb(HEAD_E + 29) - 3, (t) => [HEAD_E + 30, t], [1, 0]], [zb(HEAD_W - 31) + 4, zb(HEAD_W - 29) - 3, (t) => [HEAD_W - 30, t], [-1, 0]],
  ];
  for (const [t0, t1, where, nrm] of runs) for (let t = t0 + r.range(0, 5); t < t1; t += r.range(CRAG.step[0], CRAG.step[1])) {
    const [fx, fz] = where(t), top = land(fx - nrm[0] * 5, fz - nrm[1] * 5), yaw0 = Math.atan2(nrm[0], nrm[1]);
    // [metres out from the edge, centre height, half height] (the buttress under the brow hangs from the land's top)
    for (const [out, yc0, hh0] of CRAG.tiers) {
      const yc = hh0 === undefined ? (19 + top) / 2 + 0.5 : yc0, hh = hh0 === undefined ? Math.max(3, (top - 19) / 2 + 1.2) : hh0;
      const hw = r.range(4.6, 7.4), oo = out + r.range(-0.8, 0.8), x = fx + nrm[0] * oo, z = fz + nrm[1] * oo, y = yc + r.range(-1.2, 1.2);
      const yaw = yaw0 + r.range(-0.3, 0.3), lx = r.range(-0.12, 0.12), lz = r.range(-0.12, 0.12), g = gap(x, y, z, hw, hh);
      if (g < CRAG.clear || (out > 3 && CAVES.some((c) => Math.abs(fx - c.face) < 1 && Math.abs(fz - c.z) < c.w + 5))) continue;
      list.push({ x, y, z, hw, hh, yaw, lx, lz, gap: g });
    }
  }
  return list;
}

export function planLamps() {
  const plan = [];
  for (let s = TOWN.lamp; s > 2; s -= s > TOWN.lane + 10 ? 44 : 22) plan.push({ s, side: 1 });
  for (let s = TOWN.lane - 9; s > 2; s -= 22) plan.push({ s, side: -1 });
  return plan;
}
export const LIGHTER = { clear: 6, lat: 0.84, verge: 4.95, top: 3.55, margin: 0.12 };
// where a lighter walks, metres north of the street's line: LIGHTER.lat in from the kerb in the street and straight on
// across the square, on the road's verge before the garden walls beyond the lane
export const lighterLat = (s) => lerp(KERB + LIGHTER.lat, LIGHTER.verge, smoothstep(TOWN.lane, TOWN.lane + 14, s));
// the first metre of the road's verge from which a lighter keeps LIGHTER.clear from the line all the way to the last
// lamp: his feet at lighterLat on the road's own height (roadY(s)), his pole's tip LIGHTER.top over them; RT: the
// line's own points [x, y, z ...]
export function roadRoundFrom(RT, roadY) {
  let from = TOWN.lamp + 2;
  for (let s = TOWN.lamp + 2; s >= TOWN.lane; s -= 1) {
    const p = roadAtD(s, lighterLat(s)), y0 = roadY(s);
    let m = 1e9;
    for (let i = 0; i < RT.length; i += 3) { const dh = Math.hypot(RT[i] - p[0], RT[i + 2] - p[1]); if (dh < 30) m = Math.min(m, Math.hypot(dh, Math.max(0, y0 - RT[i + 1], RT[i + 1] - y0 - LIGHTER.top))); }
    if (m < LIGHTER.clear + LIGHTER.margin) break;
    from = s;
  }
  return from;
}
export function layRounds(r, lamps, rShare = r, roadFrom = TOWN.lane + 44) {
  const TURN = 2.4, turn = r(), rounds = [[4, TOWN.s1 - 2], [TOWN.s1 + 2, TOWN.sq - 2], [roadFrom, TOWN.lamp + 2]].map(([s0, s1], i) => {
    const v = r.range(2.3, 2.8), T = 2 * (s1 - s0) / v + 2 * TURN;
    return { s0, s1, len: s1 - s0, v, T, ph: (turn + i / 3) % 1, e: TURN / T, k: 1 };
  });
  const frac = (x) => ((x % 1) + 1) % 1;
  for (const lp of lamps) {
    const i = lp.s <= rounds[0].s1 ? 0 : lp.s <= rounds[1].s1 ? 1 : 2, q = rounds[i];
    lp.share = rShare.range(2 / 3, 4 / 5);
    // a lamp is on a round only if it stands on the north kerb within that round's own length; THE TOWN'S LAST LAMP,
    // where the road leaves for the moor, is on none: the road's lighter turns about under it and it burns always
    lp.round = lp.side > 0 && lp.s < TOWN.lamp && lp.s >= q.s0 - 1 && lp.s <= q.s1 + 1 ? i : -1;
    // he stands e of the round at each end (turning about) and walks the rest: out over the first half, home over the second
    lp.at = (q.e + (1 - 2 * q.e) * clamp((lp.s - q.s0) / q.len, 0, 1)) / 2;
  }
  // the most of round i's lamps between a and b that are dark at one moment: a lamp is dark for the last part of the
  // round before its lighter reaches it, so the most are dark just before he reaches one of them
  const darkMost = (i, a, b) => {
    const mine = lamps.filter((lp) => lp.round === i && lp.s >= a && lp.s <= b);
    let most = 0;
    for (const j of mine) { let n = 0; for (const lp of mine) { const d = frac(lp.at - j.at + 1e-4); if (d < (1 - lp.share) * rounds[i].k) n++; } most = Math.max(most, n); }
    return most;
  };
  const first = Math.min(...lamps.map((lp) => lp.s)), last = Math.max(...lamps.map((lp) => lp.s));
  for (let pass = 0; pass < 80; pass++) {
    let worst = -1;
    for (let a = first; a <= last - 80 && worst < 0; a += 2) {
      const n = lamps.filter((lp) => lp.s >= a && lp.s <= a + 80).length, d = rounds.map((q, i) => darkMost(i, a, a + 80));
      // (of two rounds with as many dark, the one shortened least so far is shortened)
      // (a stretch that holds one lamp alone, on the road where they stand 44 m apart, is not counted: half of one lamp is no rule)
      if (n > 1 && d[0] + d[1] + d[2] > Math.floor(n / 2)) for (let i = 0; i < 3; i++) if (d[i] > 0 && (worst < 0 || d[i] > d[worst] || (d[i] === d[worst] && rounds[i].k > rounds[worst].k))) worst = i;
    }
    if (worst < 0) break;
    rounds[worst].k *= 0.92;
  }
  for (const lp of lamps) lp.burn = lp.round < 0 ? 1 : Math.ceil((1 - (1 - lp.share) * rounds[lp.round].k) * 63) / 63;
  // metres north of the street's line that a lighter keeps: a metre in from the kerb in the street and straight on
  // across the square, on the lane's narrower pavement, on the road's verge before the garden walls
  const latAt = lighterLat;
  // lighter i at the clock t: [x, z, heading x, heading z (the road's own, outward), metres along the street's line,
  // 0 going out .. 1 going home (he turns about while he stands at an end), where in his round he is (0..1)]
  const at = (i, t) => {
    const q = rounds[i], c = frac(t / q.T + q.ph), tri = 1 - Math.abs(2 * c - 1), along = q.len * clamp((tri - q.e) / (1 - 2 * q.e), 0, 1), s = q.s0 + along;
    const home = c > 0.25 && c < 0.75 ? smoothstep(0.5 - q.e / 2, 0.5 + q.e / 2, c) : 1 - smoothstep(-q.e / 2, q.e / 2, c < 0.5 ? c : c - 1);
    const p = roadAtD(s, latAt(s));
    return [p[0], p[1], p[2], p[3], s, home, c];
  };
  return { rounds, at, latAt };
}

export default {
  id: 'light-in-every-dark-place',
  name: 'A Light in Every Dark Place',
  category: 'books',
  placeKind: 'city',
  book: 'A Christmas Carol',
  author: 'Charles Dickens, 1812 to 1870',
  media: ['air', 'snow'],
  weirdness: 0.3,
  async build(ctx) {
    const scene = new THREE.Scene(), noise = ctx.noise, detail = ctx.quality?.detail ?? 1;
    // a hand-back of the page between two pieces of work
    const rest = () => ctx.yield();
    const NEW = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // every stream of the world, by name, before any loop runs (the tower's own are in the part)
    // (each thing has a stream of its own, so that a change in the count of one deals no other thing anew)
    const R = {
      look: NEW('look'), sky: NEW('sky'), land: NEW('land'), street: NEW('street-fronts'), panes: NEW('street-windows'), shops: NEW('street-shops'),
      square: NEW('market-square'), lane: NEW('lane-fronts'), laneEnd: NEW('lane-end'), fields: NEW('town-fields'), cottages: NEW('cottages'), roofs: NEW('back-roofs'), backPanes: NEW('back-windows'),
      walkers: NEW('walkers'), shoppers: NEW('shoppers'), children: NEW('children'), lamplighter: NEW('lamplighter'), slips: NEW('eave-slips'), smoke: NEW('smoke'), smokePuffs: NEW('smoke-puffs'),
      great: NEW('great-stones'), stones: NEW('moor-stones'), pools: NEW('moor-pools'), furze: NEW('moor-furze'),
      hut: NEW('hut'), coast: NEW('coast'), crags: NEW('coast-crags'), sea: NEW('sea'), ship: NEW('ship'), wake: NEW('ship-wake'),
      snowStreet: NEW('snow-street'), snowMoor: NEW('snow-moor'), snowSea: NEW('snow-sea'), embers: NEW('brazier-embers'), spindrift: NEW('spindrift'), puffs: NEW('white-water-puffs'), ends: NEW('end-windows'), cliffStones: NEW('cliff-stones'),
      // r3: one stream a thing. The lamps, their shares alight, the pole sparks, the lighters' coats; the lane's and the
      // square's windows and shops; the church, the pump, each stall, each brazier, the rail; the chasing children; the
      // shapes of the great and of the lesser stones, of the crags and of the cave roofs; the surge of the caves, of the
      // skerries and of the headlands; the ship's hands and her look-out; and every new thing of this round
      lamps: NEW('street-lamps'), lampShares: NEW('lamp-shares'), poleSparks: NEW('pole-sparks'), lighterCoats: NEW('lighter-coats'),
      lanePanes: NEW('lane-windows'), laneShops: NEW('lane-shops'), sqPanes: NEW('square-windows'), sqShops: NEW('square-shops'),
      church: NEW('church-front'), pump: NEW('market-pump'), stalls: [0, 1, 2, 3, 4, 5, 6].map((k) => NEW('market-stall-' + k)), braziers: [0, 1, 2].map((k) => NEW('market-brazier-' + k)), rail: NEW('poulterers-rail'),
      chase: NEW('chasing-children'), doorways: [0, 1, 2, 3, 4].map((k) => NEW('doorway-' + k)), bedGreat: NEW('great-stone-beds'), bedLesser: NEW('lesser-stone-beds'), cragBeds: NEW('crag-beds'), caveRoofs: [0, 1, 2].map((k) => NEW('cave-roof-' + k)), skerryRock: [0, 1].map((k) => NEW('skerry-rock-' + k)),
      caves: NEW('cave-surge'), skerries: NEW('skerry-surge'), heads: NEW('headland-surge'), hands: NEW('ship-hands'), lookout: NEW('ship-lookout'),
      hutThings: NEW('hut-things'), beasts: NEW('moor-beasts'), walls: NEW('road-walls'), yards: NEW('cottage-yards'), backTrees: NEW('back-trees'), lastCot: NEW('last-cottage'), tussocks: NEW('moor-tussocks'), lineFurze: NEW('line-furze'),
      gulls: NEW('sea-gulls'), gullWings: NEW('sea-gull-wings'), piles: NEW('stone-piles'),
      // r5: the small boulders about the great stones' feet
      footStones: NEW('foot-boulders'), rushes: NEW('pool-rushes'), windlass: NEW('hut-windlass'), rutPools: NEW('rut-puddles'), footPools: NEW('stone-foot-pools'),
      // where in its breathing each fire of the place stands at the clock's zero: the hut's hearth, the ship's
      // binnacle, the street's light on its floor (its windows', its lamps'): each from a stream of its own
      hutFire: NEW('hut-fire'), binnacle: NEW('ship-binnacle'), streetLight: NEW('street-light'),
      // r4: the spire's place and its panes; the stalls' and the braziers' people (the shop-gazers keep `shoppers`);
      // the bow wave; the cave mouths; the clock phases of the hut's figure, the glory, the ship's lamps, the riders' cells
      spire: NEW('church-spire'), spirePanes: NEW('spire-windows'), stallFolk: NEW('stall-people'), brazierFolk: NEW('brazier-people'),
      bowWave: NEW('bow-wave'), caveMouths: NEW('cave-mouths'), hutFigure: NEW('hut-figure'), glory: NEW('glory-breath'), shipLamps: NEW('ship-lamps'), riderCells: NEW('rider-cells'),
    };
    const SEEDS = { hut: R.hutFire(), binnacle: R.binnacle(), street: [R.streetLight(), R.streetLight()] };
    const time = { value: 0 };
    // the lamplighters' rounds on the world's clock: where in its round each is now, and their periods; where each
    // lighter's flame is and its level (all set in update from the clock alone)
    const roundU = { uRoundNow: { value: new THREE.Vector3() }, uRoundT: { value: new THREE.Vector3(1, 1, 1) } };
    const lighterU = { value: [0, 1, 2].map(() => new THREE.Vector4(0, -1e4, 0, 0)) };

    // ---- what this visit is like ------------------------------------------------------------------------------
    const vary = ctx.vary || { hour: 'any', rare: false, density: 1, mood: 0.5 };
    const hour = vary.hour === 'night' ? 'night' : vary.hour === 'dawn' ? 'moon' : 'dusk';
    // each look is ONE hour that stands for the whole visit: the red lying low in the west, and night with the moon
    // behind torn cloud and stars in the gaps overhead and in the south and east. How much of each a view holds is a
    // matter of where it is taken from: between the fronts in the town's brown mist, on the open moor, in the sleet at sea
    const LOOK = {
      dusk: { red: 1, stars: 0.6, cover: 0.56, moon: 3.0, hemi: 1.45, blinds: 0.16, zen: '#0e1634', mid: '#1f2e5a', hor: '#3d5186' },
      night: { red: 0.5, stars: 0.95, cover: 0.46, moon: 3.2, hemi: 1.25, blinds: 0.34, zen: '#090f26', mid: '#162142', hor: '#2c3c66' },
      moon: { red: 0.3, stars: 0.6, cover: 0.32, moon: 3.7, hemi: 1.3, blinds: 0.22, zen: '#0f1838', mid: '#213260', hor: '#40558a' },
    }[hour];
    // the sky's fill: the brief's blue, greyed a little so that shade keeps its form
    const HEMI = '#66779f';
    const rare = !!vary.rare, density = clamp(vary.density ?? 1, 0.7, 1.3), gale = clamp(vary.mood ?? 0.5, 0, 1);
    const litShare = clamp(0.62 + 0.14 * (density - 0.7) / 0.6 + R.look.range(0, 0.08), 0.6, 0.9);
    // the wind is northerly (a little east in it): it comes from windFrom (x east, z south)
    const windFrom = new THREE.Vector2(WIND[0] + R.look.range(-0.15, 0.15), WIND[1]).normalize();

    // ---- the route and its places ----------------------------------------------------------------------------
    const RP = routePoints();
    const path = makePath(RP.P);
    const L = path.length, _p = new THREE.Vector3();
    await rest();
    const { RT, S, sNear } = routePlaces(RP, path);
    // the marks the looks pull at, each set where the thing itself is built (see looksOf)
    const MARKS = {};
    await rest();

    // ---- sky, moon, light, mist --------------------------------------------------------------------------------
    // the moon stands in the south behind torn racing cloud. The red of the west is a graded glow low on that side (the
    // lid's mesh below, which also carries the bank of cloud over it); the sky's own wash only tints the cloud near it
    const RED = [1.5, 0.27, 0.045], RED_SCALE = RED_SCALE_C, RED_FALL = 57.3 / RED_SCALE;
    // on a rare visit the cloud is torn wide open and the moon stands clear, the whole visit long
    const COVER = rare ? 0.26 : LOOK.cover;
    const sky = makeSky({
      rng: R.sky, preset: 'night', bake: true, renderer: ctx.renderer,
      zenith: LOOK.zen, mid: LOOK.mid, horizon: LOOK.hor, ground: '#0a101e', horizonPow: 3,
      scatterColor: RED, scatter: 0.16 * LOOK.red, scatterPow: 16, scatterHigh: 0, scatterFall: RED_FALL, sunElevation: -3, sunAzimuth: 270, sunIntensity: 0, sunGlow: 0, veil: 0,
      stars: LOOK.stars, milkyWay: 0,
      bodies: [{ elevation: 44, azimuth: 180, size: 2.3, phase: 0.96, color: '#e9eef6', intensity: 1.15, dark: 0.03, glow: 0.32, glowColor: '#cdd7e6', glowSize: 5 }], key: 0,
      clouds: { coverage: COVER, softness: 0.34, scale: 0.8, opacity: 0.94, detail: 0.75, silver: 1.3, absorb: 2, wind: [0.034, 0.013], lit: '#aab9d8', shade: '#1c2644' },
      clouds2: false, cloudShade: '#22304f',
      lightColor: '#cdd7e6', lightIntensity: LOOK.moon * 2.3, ambientColor: HEMI, groundLight: '#3a4052', ambientIntensity: LOOK.hemi * 2.1,
    });
    scene.add(sky.object);
    // the sky's bake runs in steps of its own, one after each hand-back: give it those before the next work begins
    for (let i = 0; i < 12; i++) await ctx.yield();
    const rig = makeLightRig(sky, { intensity: 1, ambient: 1, bounce: 0.35 });
    scene.add(rig.object);
    const moonDir = sky.lightDirection.clone().normalize();
    // what every lit face takes from its own place (see placeGLSL): the moon as the rig has it, the west's red
    const placeU = { uPMoonDir: { value: moonDir }, uPMoonCol: { value: rig.sun.color.clone().multiplyScalar(rig.sun.intensity) }, uPRedCol: { value: new THREE.Color('#ff5a22').multiplyScalar(0.55 * LOOK.red) }, uPTime: time, uPFire: { value: SEEDS.hut } };
    // ---- weather by PLACE, written from where the eye stands in the world (x, z): the same for anyone who stands
    // there, at any moment and from whichever side they came ---------------------------------------------------------
    //   town   1 between the fronts, falling to 0 across the cottages' road (the lane's end to the last lamp, by metres
    //          along the street's line): the dull brown mist and the thick slow snow
    //   sea    0 on the land, 1 from the outer skerry out, across the cliff from the last great stone's z: sleet, haze
    //   far    within the sea: the sleet thickens westward across the open water from the reef's west end to the
    //          ship's stern, until from the ship no land shows
    const PLACE = { town: 1, sea: 0, far: 0 }, PLACE_Z = { stone: CLIFF_Z - 40 };
    const placeAt = (x, z) => {
      const sl = toStreet(x, z);
      PLACE.town = 1 - smoothstep(TOWN.lane, TOWN.lamp, sl[0]);
      PLACE.sea = smoothstep(PLACE_Z.stone, SKERRIES[1].z, z);
      PLACE.far = smoothstep(TOWER.x - TOWER.reef, SHIP.stern, x) * PLACE.sea;
      return PLACE;
    };
    // mist: brown-violet in the street, clear cold air on the moor, sleet haze at sea
    const FOG = {
      street: { c: new THREE.Color('#3b3146'), d: 1.5 / 260 }, moor: { c: new THREE.Color('#252d44'), d: 1.5 / 900 }, sea: { c: new THREE.Color('#475574'), d: 1.5 / 700 }, far: { c: new THREE.Color('#586689'), d: 1.5 / 240 },
    };
    scene.fog = new THREE.FogExp2(FOG.street.c.clone(), FOG.street.d);
    // A RULE OF THE AIR: how far a small fire's shaft of lit air is drawn in air of density d: to where that air has
    // put out AIR.share of its light (the mist's own law, 1 - exp(-(d x)^2)). The slit's ray takes its length from it.
    const AIR = { share: 1 / 50 }, AIR_REACH = (d) => Math.sqrt(-Math.log(1 - AIR.share)) / d;
    const fogAt = (pl) => {
      scene.fog.color.copy(FOG.moor.c).lerp(FOG.street.c, pl.town).lerp(FOG.sea.c, pl.sea).lerp(FOG.far.c, pl.far);
      scene.fog.density = lerp(lerp(lerp(FOG.moor.d, FOG.street.d, pl.town), FOG.sea.d, pl.sea), FOG.far.d, pl.far);
    };

    // ---- ONE SKY (r5). The town's sky (the kit's: crisp torn cloud with lit edges, stars and the moon in its rents)
    // is the sky of the whole world. Over it stand two things, each written at every sky point from the WORLD PLACE
    // UNDER that point (SKY_UNDER), never from where the eye stands, the metres flown or the clock:
    //  - THE WEST'S RED (the lid's mesh): a graded glow low on that side, at one height (RED_SCALE degrees) and one
    //    strength the whole visit long, from every place; above it a dark ragged bank of torn cloud, its underside lit
    //    by the glow. Where the place under a point of it is sea, the sleet standing there thins it (SKY.redThin: by
    //    the sea's share and the far sea's); it is never gone. uv: degrees from due west, degrees up.
    //  - THE WEATHER'S CLOUD (the dome): more cloud of the town's own make (masses with crisp edges, silver where
    //    they thin toward the moon, rents between them through which the one sky's stars and moon show), none over the
    //    town, more over the moor (SKY.cover[0]) and heavy over the sea (SKY.cover[1]), closing low down there, with
    //    the sleet's grey under it. Its masses are forms of the sky's own frame (a noise of the sight line's
    //    direction, the same size every way and at every height: nothing is drawn out toward the horizon).
    // The moon is one body at one place for the whole world: only the cloud before it differs. Both meshes ride with
    // the eye (a sky is at no distance); uEye tells them where it is, for the place under each point.
    const westU = { uTime: time, uRed: { value: LOOK.red }, uEye: { value: new THREE.Vector3() }, uFall: { value: RED_FALL }, uLid: { value: new THREE.Color('#0d1222') } };
    const skyU = { uTime: time, uRed: westU.uRed, uEye: westU.uEye, uMoonDir: { value: moonDir }, uWind: { value: new THREE.Vector2(-windFrom.x, -windFrom.y) }, uOpen: { value: rare ? 1 : 0 } };
    let lid, dome;
    const buildSkies = () => {
      const v3 = (c) => `vec3(${c.r.toFixed(4)}, ${c.g.toFixed(4)}, ${c.b.toFixed(4)})`;
      {
        const pos = [], uv = [], idx = [], NA = 56, NE = 12, RAD = 3000, E0 = -1.5, E1 = 25, SPAN = 115;
        for (let j = 0; j <= NE; j++) for (let i = 0; i <= NA; i++) {
          const az = (i / NA * 2 - 1) * SPAN, el = lerp(E0, E1, (j / NE) ** 1.5), a = az * Math.PI / 180, e = el * Math.PI / 180;
          // west is -x; az > 0 swings toward the north (-z)
          pos.push(-Math.cos(a) * Math.cos(e) * RAD, Math.sin(e) * RAD, -Math.sin(a) * Math.cos(e) * RAD); uv.push(az, el);
        }
        for (let j = 0; j < NE; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
        lid = new THREE.Mesh(g, new THREE.ShaderMaterial({
          uniforms: westU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
          vertexShader: 'varying vec2 vUv; varying vec3 vD; void main(){ vUv = uv; vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
          fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + SKY_UNDER + /* glsl */`
uniform float uTime, uRed; uniform vec3 uLid, uEye; varying vec2 vUv; varying vec3 vD;
const float SC = ${RED_SCALE.toFixed(2)};
void main(){
  float az = vUv.x, el = max(vUv.y, 0.), red = clamp(uRed, 0., 1.);
  // how much of the glow comes through the air of the place under this point (the sleet over the sea thins it)
  vec3 sp = skyOf(underSky(normalize(vD), uEye));
  float thin = 1. - ${SKY.redThin[0].toFixed(2)}*sp.y - ${SKY.redThin[1].toFixed(2)}*sp.z;
  // the glow: red-orange in its core, deepest red where it is faint, falling away upward and to both sides with no
  // edge. Where it is faint it darkens the sky it lies on (so that red over blue does not turn to pink)
  float side = exp(-az*az/${RED_SIDE_C.toFixed(1)}), core = exp(-clamp(el/SC, 0., 30.))*side;
  vec3 glow = mix(vec3(.4, .028, .01), vec3(1.55, .38, .055), core*core)*core*1.2;
  float gq = (el - .35*SC)/(.3*SC);
  glow += vec3(1.7, .5, .09)*exp(-gq*gq)*exp(-az*az/700.)*.75;
  float aG = sqrt(clamp(core*1.3, 0., 1.))*red;
  // the lid of cloud above it: a long dark bank torn into masses, ragged below, thinning to nothing above and to
  // both sides, its underside lit by the glow
  float rag = vnoise(vec2(az*.19 + uTime*.006, 1.7))*.6 + vnoise(vec2(az*.52 - uTime*.01, 4.2))*.4;
  float torn = vnoise(vec2(az*.11 + uTime*.004, el*.33 + 7.))*.65 + vnoise(vec2(az*.37 - uTime*.007, el*.9))*.35;
  float foot = SC*(1.15 + .6*rag);
  float bank = smoothstep(foot - .35*SC, foot + .6*SC, el)*(1. - smoothstep(foot + .5*SC + 1., foot + 1.9*SC + 4.5, el + 5.*(torn - .5)))*exp(-az*az/6500.);
  bank *= smoothstep(.2, .55, torn + .25*(1. - smoothstep(foot, foot + SC, el)));
  vec3 under = vec3(.95, .11, .02)*red*thin*(1. - smoothstep(foot - .2*SC, foot + 1.5*SC, el))*side;
  // glow and bank both die away to nothing well inside the mesh's own ends and top: no edge of it is ever seen
  float edge = (1. - smoothstep(72., 110., abs(az)))*(1. - smoothstep(15., 23.5, vUv.y));
  float a = clamp(bank*1.05, 0., .96)*edge;
  aG *= edge;
  gl_FragColor = vec4(glow*red*thin*(1. - a)*edge + (uLid + under*.65)*a, aG*(.35 + .65*thin)*(1. - a) + a);
}`,
        }));
        // (drawn after the weather's cloud: the red stands before it, thinned by the place's sleet)
        lid.frustumCulled = false; lid.renderOrder = -0.4;
        scene.add(lid);
      }
      {
        const pos = [], idx = [], NA = 40, NE = 16, RAD = 2900;
        for (let j = 0; j <= NE; j++) for (let i = 0; i <= NA; i++) { const e = lerp(-7, 90, (j / NE) ** 1.6) * Math.PI / 180, a = i / NA * Math.PI * 2; pos.push(Math.cos(a) * Math.cos(e) * RAD, Math.sin(e) * RAD, Math.sin(a) * Math.cos(e) * RAD); }
        for (let j = 0; j < NE; j++) for (let i = 0; i < NA; i++) { const a = j * (NA + 1) + i, b = a + 1, c = a + NA + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
        dome = new THREE.Mesh(g, new THREE.ShaderMaterial({
          uniforms: skyU, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
          vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.); }',
          fragmentShader: fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + SKY_UNDER + SKY_CLOUD + /* glsl */`
uniform float uTime, uRed, uOpen; uniform vec3 uMoonDir, uEye; uniform vec2 uWind; varying vec3 vD;
void main(){
  vec3 d = normalize(vD); float el = asin(clamp(d.y, -1., 1.))*57.2958, elp = max(el, 0.);
  float ma = acos(clamp(dot(d, uMoonDir), 0., 1.))*57.2958, west = smoothstep(.25, .85, -d.x/max(length(d.xz), 1e-4));
  // the place under this sky point, and what stands over that place
  vec3 sp = skyOf(underSky(d, uEye));
  vec4 cl = skyCloud(d, sp, uMoonDir, uWind, uTime, uOpen, ma, elp); vec3 c = cl.rgb; float aC = cl.a;
  // the west's red on the undersides of what hangs low on that side
  c += vec3(.5, .06, .014)*uRed*west*exp(-clamp(elp/7., 0., 30.))*(1. - ${SKY.redThin[0].toFixed(2)}*sp.y);
  // the sleet under the sea's cloud, thicker over the far sea; a little haze low over the moor
  float sleet = (1. - smoothstep(1.5, 15., elp))*sp.y*(.62 + .38*sp.z), haze = exp(-clamp(elp/2.4, 0., 30.))*(1. - sp.x)*(1. - sp.y)*.55*(1. - west);
  vec3 grey = mix(mix(${v3(FOG.moor.c)}, ${v3(FOG.sea.c)}, sp.y), ${v3(FOG.far.c)}, sp.z);
  float aV = max(sleet, haze), a = aC + (1. - aC)*aV, low = smoothstep(-6.8, -5.5, el);
  gl_FragColor = vec4(mix(c*aC, grey*a, aV)*low, a*low);
}`,
        }));
        dome.frustumCulled = false; dome.renderOrder = -0.5;
        scene.add(dome);
      }
    };
    await rest();
    // ---- the land: the town's shelf, the road, the frozen moor with its stones and pools, the cliffs, the cove -------
    const LAND = layLand({ noise, path, S, R, windFrom: [windFrom.x, windFrom.y], detail });
    const { land, pools, coast, edgeZ, CAVES, FACE_E, FACE_W, nearRoute } = LAND;
    // the last great stone (the one furthest toward the cliff): the moor's weather ends across the cliff from its z
    const zStone = LAND.STONES.reduce((m, q) => (q.great && !q.piled ? Math.max(m, q.z) : m), -1e9), PLACE_TXT = placeGLSL(zStone), PLACE_KEY = zStone.toFixed(1);
    PLACE_Z.stone = zStone;
    buildSkies();
    await rest();
    // dark frozen earth and dead grass with frost on every blade; thin snow only in the lee of things and in a few
    // hollows; snow lying in the town's yards; black rock where it is steep or wet
    const cFrost = lin('#a3aec4'), cFrostB = lin('#818da4'), cGrass = lin('#4d4836'), cEarth = lin('#26221e'), cThin = lin('#c5cfe1'), cRock = lin('#2c2f37'), cYard = lin('#c9d2e3'), cShingle = lin('#111216');
    const groundColor = (x, z, h, ny, out) => {
      const m = 0.5 + 0.5 * noise.n2(x * 0.21, z * 0.21), w = 0.5 + 0.5 * noise.n2(x * 0.012 + 2, z * 0.012);
      const hag = 1 - smoothstep(0.03, 0.12, Math.abs(noise.n2(x * 0.022 + 11, z * 0.022 - 6))), tuft = smoothstep(0.35, 0.75, 0.5 + 0.5 * noise.n2(x * 0.08 - 3, z * 0.08 + 8));
      let c = mix3(cEarth, cGrass, clamp(0.25 + 0.75 * tuft - 0.6 * hag, 0, 1));
      c = mix3(c, mix3(cFrostB, cFrost, w), 0.2 + 0.24 * m);
      c = mix3(c, cThin, Math.max(smoothstep(0.05, 0.3, LAND.drift(x, z)), 0.7 * smoothstep(0.7, 0.82, 0.5 + 0.5 * noise.n2(x * 0.03 + 40, z * 0.03))));
      // every pool's bank is a lip of drifted snow where it goes down to the ice (the ice's own drift lies against it:
      // snow to snow), thinning into the moor's ground over a third of the pool's reach
      const pe = LAND.shoreAt(x, z);
      if (pe < 1.45) c = mix3(c, cThin, 0.9 * (1 - smoothstep(1.04, 1.42, pe + 0.08 * (m - 0.5))));
      const sl = toStreet(x, z), town = LAND.shelf(sl[0], sl[1]);
      if (town > 0) c = mix3(c, cYard, town);
      c = mix3(cRock, c, smoothstep(0.55, 0.8, ny) * smoothstep(3, 9, h));
      // the shore's shelf: black shingle and wet rock, up to the wash's reach
      c = mix3(cShingle, c, smoothstep(2.2, 4.5, h + 0.8 * (m - 0.5)));
      return out.setRGB(c[0], c[1], c[2]);
    };
    await rest();
    // the ground is finest along the route where it is seen from near: from the lane's end to the sea (the town's own
    // floor lies over its flat shelf)
    const landPath = makePath(RP.P.slice(RP.K.laneEnd, RP.K.skerries + 1));
    const terrain = await T.makeTerrainAsync({
      rng: R.land, noise, path: landPath, corridor: false, height: land, bounds: [-1150, -530, OX + 150, 345], biome: 'tundra', color: groundColor,
      palette: { rock: '#30333a', rockB: '#1d1f25', rockSlope: [0.5, 0.74], strata: 0.5, snow: null, patchAmount: 0, tufts: 0.85, pebbles: 0.4, cracks: 0.15, sparkle: 0.9, drift: 0.2, clouds: 0,
        wind: [-windFrom.x, -windFrom.y] },
      sunDir: moonDir, cell: 3.5, near: 34, levels: 5, maxTriangles: 44000, skirt: 30, waterLevel: 0, focus: [[(HEAD_E + HEAD_W) / 2, (CLIFF_Z + 2 * HEAD_Z) / 3 - 7, 1.2]],
    }, ctx.yield, 12);
    scene.add(terrain.object);
    // the land's own material takes its place's light as every lit face does (the moon by place, the west's red, the
    // hut's fire through window and door): one more term after the kit's own
    {
      const m = terrain.material, prev = m.onBeforeCompile, key = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
      // (the wind's bearing, where it comes from, and the swells' three trains, for the ground's tones)
      const groundU = { uGWind: { value: new THREE.Vector2(windFrom.x, windFrom.y) }, uSwell: { value: swellWaves(windFrom.x, windFrom.y).map((k) => new THREE.Vector3(k[0], k[1], k[2])) } };
      m.onBeforeCompile = (sh, rnd) => {
        if (prev) prev.call(m, sh, rnd);
        Object.assign(sh.uniforms, placeU, groundU);
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec2 uGWind; uniform vec3 uSwell[3];\n' + FIRE_GLSL + fx.GLSL_HASH + fx.GLSL_VALUE_NOISE + PLACE_TXT).replace('#include <lights_fragment_end>', PLACE_APPLY('vTWorld'))
          // THE MOOR'S TWO TONES, laid by the wind's bearing and the land's slope in world metres: on every face that
          // leans into the wind and on every crest the thin snow is scoured off and dark frozen earth, heather and
          // peat show (snow left only in streaks that run with the wind); in every lee a white drift lies, rippled
          // across the wind. On the open moor only (from the last lamp on; not on rock, not at sea). And the earth's
          // own clods, as before, where it is bare. No grain is drawn under two dots of the picture (cd fades it).
          .replace('#include <roughnessmap_fragment>', /* glsl */`{
  vec2 cp = vTWorld.xz; vec2 cpl = placeOf(cp); float cd = length(vViewPosition); vec3 gn = normalize(vTNormal);
  float sAx = dot(cp - vec2(${OX.toFixed(1)}, 0.), vec2(${AX0[0].toFixed(5)}, ${AX0[2].toFixed(5)}));
  float open = smoothstep(${TOWN.lamp.toFixed(1)}, ${OFF_ROAD.toFixed(1)}, sAx)*(1. - cpl.y)*smoothstep(.75, .95, gn.y);
  float lean = dot(gn.xz, uGWind)/max(gn.y, .2), sw = 0.;
  for (int i = 0; i < 3; i++) sw += uSwell[i].z*sin(dot(cp, uSwell[i].xy));
  float along = dot(cp, uGWind), across = dot(cp, vec2(-uGWind.y, uGWind.x));
  float n5 = vnoise(cp*.19 + 3.), n20 = vnoise(cp*.047 + 11.), fine = 1. - smoothstep(40., 90., cd);
  float expo = lean*${TONES.lean.toFixed(1)} + sw*${(TONES.crest / SWELL.h).toFixed(3)};
  float bare = smoothstep(.1, .7, expo + (n5 - .5)*.9 + (n20 - .5)*.7);
  float drift = smoothstep(.45, 1.2, -expo + (n20 - .5)*.6 + (n5 - .5)*.3);
  float streak = vnoise(vec2(along*.11, across*.9) + 5.)*.6 + vnoise(vec2(along*.3, across*2.3))*.4;
  bare *= 1. - .8*mix(smoothstep(.42, .62, streak), .5, smoothstep(60., 160., cd));
  vec3 earth = mix(vec3(.066, .053, .042), vec3(.086, .06, .057), smoothstep(.4, .6, vnoise(cp*.13 + 31.)));
  earth = mix(earth, vec3(.032, .029, .026), smoothstep(.6, .8, vnoise(cp*.06 + 7.)));
  earth *= mix(1., .7 + .6*vnoise(cp*2.3), fine);
  vec3 white = vec3(.72, .77, .88)*(1. - .12*fine*(.5 + .5*sin(across*5. + vnoise(cp*.4)*6.)));
  diffuseColor.rgb = mix(diffuseColor.rgb, earth, bare*open*.78);
  diffuseColor.rgb = mix(diffuseColor.rgb, white, drift*open*.85);
  float cn = vnoise(cp*1.9)*.55 + vnoise(cp*4.7 + 3.)*.3 + vnoise(cp*.37 + 9.)*.15;
  float aa = clamp(cd*.004, .012, .2), moor = (1. - cpl.x)*(1. - cpl.y)*smoothstep(.75, .95, gn.y)*(1. - smoothstep(60., 140., cd))*(1. - drift*open);
  cn -= .1*(1. - smoothstep(.35, .7, vnoise(cp*.09 + 21.)));
  float clod = smoothstep(.7 - aa, .7 + aa, cn), rimS = smoothstep(.65 - aa, .65 + aa, cn + .05*(vnoise(cp*1.9 + uGWind*-.12)*.55 - vnoise(cp*1.9)*.55)*8.)*(1. - clod);
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.62, .68, .8), rimS*moor*.3*(1. - bare*open));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(.05, .042, .036)*(.7 + .6*vnoise(cp*11.)), clod*moor*.6);
}
#include <roughnessmap_fragment>`);
      };
      m.customProgramCacheKey = () => key + '|lidp-place-r6-' + PLACE_KEY;
    }
    await rest();

    // ---- the sea ---------------------------------------------------------------------------------------------
    // WATER, NOT SNOW: a deep green-black sea in long swells (SEA.long metres from crest to crest, SEA.high metres
    // high, by the visit's mood) that stand as shapes; it shows the night sky darker than it stands and the moon's
    // broken road; it is white only where a crest breaks, in streaks down the wind and where it bursts on rock; the
    // wave faces turned west hold the red of the west
    const SEA_WEST = { amount: 1, up: 3, side: 0.24, high: 0.03 }, SEA_FAR = { from: 60, to: 1000 };
    const seaLight = Water.waterLight(sky);
    const silver = new THREE.Color('#cdd7e6');
    seaLight.zenith.set(LOOK.zen).multiplyScalar(0.8).lerp(silver, 0.06); seaLight.mid.set(LOOK.mid).multiplyScalar(0.8).lerp(silver, rare ? 0.2 : 0.12); seaLight.horizon.copy(FOG.sea.c);
    seaLight.sunColor.multiplyScalar(rare ? 1.2 : 0.95); seaLight.ambient.multiplyScalar(rare ? 4.3 : 4);
    seaLight.scatterColor.setRGB(RED[0] * LOOK.red, RED[1] * LOOK.red, RED[2] * LOOK.red);
    // THE SEA MIRRORS THE WEST: the sky the water shows has its red where the west's red stands and as the lid draws
    // it: due west, falling to either hand by the lid's own law (RED_SIDE_C, over SEA_WEST.side of its square of
    // degrees: the glow's colour falls faster than its core) and upward over SEA_WEST.up times the
    // lid's height (rough water smears what it mirrors), SEA_WEST.amount of it (the sleet between), SEA_WEST.high of
    // it overhead. So the red lies as a long broken road on the swells toward the west and on every wave face turned
    // to it. AND THE FAR SEA GOES INTO THE SKY BEYOND IT: from SEA_FAR.from to SEA_FAR.to metres off the water is
    // lost in the mist of the place the eye stands in (seaFar, set each frame), and toward the west that
    // mist holds the glow that stands behind it.
    const seaPow = (deg, f) => -1 / Math.log(f(deg * Math.PI / 180));
    seaLight.scatDir.set(-1, 0.03, 0).normalize(); seaLight.skyQ.x = SEA_WEST.high;
    seaLight.skyP.w = seaPow(Math.sqrt(RED_SIDE_C * SEA_WEST.side), (a) => 0.5 + 0.5 * Math.cos(a)); seaLight.skyQ.y = seaPow(SEA_WEST.up * RED_SCALE_C, (a) => 1 - Math.sin(a));
    const reefAt = (x, z) => Math.hypot((x - TOWER.x) / 17, (z - TOWER.z) / 9.5);
    const depthAt = (x, z) => {
      let d = -land(x, z);
      d = Math.min(d, 9 * reefAt(x, z) - 7.5);
      for (const k of SKERRIES) d = Math.min(d, (Math.hypot(x - k.x, z - k.z) - k.h * 0.3) * 0.8 - 1);
      return d;
    };
    // (SEA.spread: how far the swell's trains lie to either hand of the wind, each wavelength its own way, so that
    // crests cross and no two faces turned west stand in a row; SEA.detail: the weight of the small waves, 0.85 to
    // 5 m, that lie on the swells at every bearing: what the water mirrors is broken by faces of every size)
    const SEA = { long: [58, 46], high: [2.6, 3.4], foam: [0.17, 0.28], spread: [0.62, 0.8], detail: 0.5 };
    const ocean = Water.makeOcean({
      rng: R.sea, light: seaLight, level: 0, height: lerp(SEA.high[0], SEA.high[1], gale), wavelength: lerp(SEA.long[0], SEA.long[1], gale), steepness: lerp(0.6, 0.78, gale), spread: lerp(SEA.spread[0], SEA.spread[1], gale),
      foam: lerp(SEA.foam[0], SEA.foam[1], gale), detail: SEA.detail, speed: 1.05, contrast: 0.8, glitter: 0.1, roughness: 0.07, reflectivity: 0.85, spray: false, windAngle: Math.atan2(-windFrom.y, -windFrom.x),
      deep: '#12292a', scatter: '#2a4a44', foamColor: '#d3dae6', shallowColor: '#1d3a3a', depthAt, depthRect: [HEAD_W - 226, CLIFF_Z - 19, HEAD_E + 116, TOWER.z + 80], depthRes: 96, shoalDepth: 5, shoalWidth: 12, radius: 3600, fadeStart: SEA_FAR.from / 3600, fadeEnd: SEA_FAR.to / 3600,
    });
    // (the sea keeps a light of its own, copied from seaLight when it is made, with the mirror's red left out: the
    // two things written on it afterwards are written on its own uniforms)
    ocean.uniforms.uSkyP.value.z = SEA_WEST.amount;
    const seaFar = ocean.uniforms.uHorizon.value;
    scene.add(ocean.object);
    const seaAt = (x, z, t) => ocean.heightAt(x, z, t);
    await rest();

    // ---- the sea tower (hero) ---------------------------------------------------------------------------------
    const hero = await buildHero(ctx, { time, windFrom: [windFrom.x, windFrom.y], seaAt: (lx, lz, t) => seaAt(lx + TOWER.x, lz + TOWER.z, t), rayReach: AIR_REACH(FOG.sea.d), birds: Math.round(40 * clamp(density, 0.8, 1.2)) });
    hero.object.position.set(TOWER.x, 0, TOWER.z);
    scene.add(hero.object);
    // ---- the gulls: GULLS.n of them wheeling over the sea beyond the tower's dark birds, each on a ring of its own, from
    // about the tower on toward the ship. Rules of the place, held by geometry for every phase of every ring (a ring's
    // whole reach is known without the clock: birdReach): none comes nearer the tower's axis than GULLS.axis metres,
    // none nearer the line than GULLS.clear, none into the ship's rig (GULLS.rig m about her hull, to her mastheads).
    // Rings come from the gulls' stream (the last thing it deals); wings, beats and phases from a stream of their own.
    const GULLS = { n: Math.round(72 * clamp(density, 0.9, 1.3)), axis: 75, clear: 8, rig: 26, size: 1.1, r: [7, 19], y: [6, 30], bob: [0.8, 2.6], side: 95 };
    const gullRings = [];
    {
      const line = [], shipX = (SHIP.stern + SHIP.boom) / 2, SHIP_LEN_ALL = SHIP.stern - SHIP.boom;
      for (let s = S.cliff; s <= L; s += 1.5) { path.posAtDist(s, _p); line.push(_p.x, _p.y, _p.z); }
      const far = (q) => {
        const o = birdReach(q[2], q[3], q[4], GULLS.size);
        if (o.y0 < 2.5) return false;
        if (Math.hypot(q[0] - TOWER.x, q[1] - TOWER.z) - o.r1 < GULLS.axis) return false;
        const dxs = Math.max(0, Math.abs(q[0] - shipX) - SHIP_LEN_ALL / 2), dzs = Math.abs(q[1] - SHIP.z);
        if (Math.hypot(dxs, dzs) - o.r1 < GULLS.rig && o.y0 < SHIP.mast + 6) return false;
        if (Math.hypot(q[0] - RING.x, q[1] - RING.z) - o.r1 < RING_GLORY / 2 && o.y0 < RING.y + RING_GLORY / 2) return false;
        for (let k = 0; k < line.length; k += 3) {
          const dh = Math.hypot(line[k] - q[0], line[k + 2] - q[1]), dr = Math.max(0, o.r0 - dh, dh - o.r1), dy = Math.max(0, o.y0 - line[k + 1], line[k + 1] - o.y1);
          if (dr * dr + dy * dy < GULLS.clear * GULLS.clear) return false;
        }
        return true;
      };
      for (let tries = 0; gullRings.length < GULLS.n && tries < GULLS.n * 40; tries++) {
        // a place between the tower and the ship (a third of them about the tower itself), off to either hand
        const about = R.gulls.chance(0.34), k = R.gulls(), a = R.gulls.range(0, Math.PI * 2), d = R.gulls.range(GULLS.axis + 12, GULLS.side), lat = R.gulls.range(-GULLS.side, GULLS.side);
        const q = [about ? TOWER.x + Math.cos(a) * d : lerp(TOWER.x - GULLS.axis, SHIP.bow, k), about ? TOWER.z + Math.sin(a) * d : lerp(TOWER.z, SHIP.z, k) + lat,
          R.gulls.range(GULLS.r[0], GULLS.r[1]), R.gulls.range(GULLS.y[0], GULLS.y[1]), R.gulls.range(GULLS.bob[0], GULLS.bob[1])];
        if (far(q)) gullRings.push(q);
      }
    }
    const gulls = makeSeaBirds(R.gullWings, gullRings.length, time, { centre: (i) => gullRings[i], size: GULLS.size, floor: 2.5, speed: [8, 12], dark: '#0d0f15', pale: '#9aa5bb', gain: 0.8 });
    scene.add(gulls.mesh);
    await rest();

    // ---- the street ------------------------------------------------------------------------------------------
    // the street's frame (see TOWN): s = metres west of the entry along the street's line, l = metres to the north
    // (right) of it. A row of houses that faces another way is built in a frame of its own: `frame` turns it and
    // sets where it starts, builds, and puts the street's frame back.
    let AX = AX0, NX = NX0, ORG = [OX, 0];
    const SP = (s, l, y) => [ORG[0] + AX[0] * s + NX[0] * l, STREET_Y + y, ORG[1] + AX[2] * s + NX[2] * l];
    const frame = (org, ax, nx, fn) => { const k = [AX, NX, ORG]; AX = ax; NX = nx; ORG = [org[0], org[2]]; fn(); AX = k[0]; NX = k[1]; ORG = k[2]; };
    const S_BACK = -X_BACK;
    const ringU = { value: new THREE.Vector4(RING.x, RING.y, RING.z, 2.2) }, ringCol = { value: new THREE.Color('#ffe2b0') };
    // uStreet: the street's axis and where it starts in the world (the lit town's ground plan is worked out from these)
    const townU = { uTime: time, ...placeU, ...roundU, uLighter: lighterU, uGlow: { value: TOWN_LIT.glow }, uStreetSeed: { value: new THREE.Vector2(SEEDS.street[0], SEEDS.street[1]) }, uStreet: { value: new THREE.Vector4(AX0[0], AX0[2], OX, 0) }, uRing: ringU, uRingCol: ringCol };
    const NONE = -1e6;
    // a flat face that looks toward `out`
    const face = (G, P, out, color, aux) => {
      const ux = P[1][0] - P[0][0], uy = P[1][1] - P[0][1], uz = P[1][2] - P[0][2], vx = P[2][0] - P[0][0], vy = P[2][1] - P[0][1], vz = P[2][2] - P[0][2];
      const d = (uy * vz - uz * vy) * out[0] + (uz * vx - ux * vz) * out[1] + (ux * vy - uy * vx) * out[2];
      if (d >= 0) G.quad(P[0], P[1], P[2], P[3], color, aux); else G.quad(P[3], P[2], P[1], P[0], color, aux);
    };
    const triOut = (G, a, b, c, out, color, aux) => {
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
      if ((uy * vz - uz * vy) * out[0] + (uz * vx - ux * vz) * out[1] + (ux * vy - uy * vx) * out[2] >= 0) G.tri(a, b, c, color, aux); else G.tri(c, b, a, color, aux);
    };
    const UP = [0, 1, 0], DOWN = [0, -1, 0], neg = (v) => [-v[0], -v[1], -v[2]];
    // a box in the street frame; o.top: [color, aux] of its top face, o.skip: string of faces to leave out (s S l L t b)
    const sbox = (G, s0, s1, l0, l1, y0, y1, color, aux = [0, 0, NONE, 0], o = {}) => {
      const k = o.skip || 'b', P = (s, l, y) => SP(s, l, y);
      if (!k.includes('s')) face(G, [P(s0, l0, y0), P(s0, l1, y0), P(s0, l1, y1), P(s0, l0, y1)], neg(AX), color, aux);
      if (!k.includes('S')) face(G, [P(s1, l0, y0), P(s1, l1, y0), P(s1, l1, y1), P(s1, l0, y1)], AX, color, aux);
      if (!k.includes('l')) face(G, [P(s0, l0, y0), P(s1, l0, y0), P(s1, l0, y1), P(s0, l0, y1)], l0 < l1 ? neg(NX) : NX, color, aux);
      if (!k.includes('L')) face(G, [P(s0, l1, y0), P(s1, l1, y0), P(s1, l1, y1), P(s0, l1, y1)], l0 < l1 ? NX : neg(NX), color, aux);
      if (!k.includes('t')) face(G, [P(s0, l0, y1), P(s1, l0, y1), P(s1, l1, y1), P(s0, l1, y1)], UP, o.top ? o.top[0] : color, o.top ? o.top[1] : aux);
      if (!k.includes('b')) face(G, [P(s0, l0, y0), P(s1, l0, y0), P(s1, l1, y0), P(s0, l1, y0)], DOWN, color, aux);
    };
    const BRICK = [1, 0, NONE, 0], SNOW = [2, 0, NONE, 0], PLAIN = [0, 0, NONE, 0], ROUGH5 = [5, 0, NONE, 0];
    const cSnow = lin('#d3dcec'), cStone = lin('#6a6c72'), cSlate = lin('#1b1d22');
    const brickTones = ['#5d544c', '#4f4947', '#655850', '#57504a', '#494646', '#6c5b4e'].map(lin);
    const paints = ['#1a3a25', '#4a1714', '#16171b', '#18233a', '#3a2616', '#2a2f36'].map(lin);
    const snowCap = (G, s0, s1, l0, l1, y, t = 0.07) => sbox(G, s0, s1, l0, l1, y, y + t, cSnow, SNOW);
    const WIN = [], GOODS = [], LEAVES = [], CHIM = [], LAMPS = [], DOORS = [], SHOPS = [], SMOKE = [], WHITE = [], GLOWS = [], POOLS_OF_LIGHT = [];
    // a window of the one window shader: centre, the wall's outward normal, size, kind, seed, level
    const pane = (c, out, w, h, kind, seed, level = 1) => WIN.push({ c, out, w, h, kind, seed, level });
    const K = { FIRE: 0, BLIND: 1, DARK: 2, SHOP: 3, CANDLE: 4, HUT: 5, FAN: 6, GLASS: 7, DOOR: 8, HUTDOOR: 9, STEADY: 10 };
    const pickKind = (r, floor) => {
      const x = r();
      if (x > litShare) return K.DARK;
      const y = r();
      if (y < LOOK.blinds) return K.BLIND;
      return y < (floor === 1 ? 0.86 : 0.6) ? K.FIRE : K.CANDLE;
    };
    // (ONE DEAL FOR EVERY WINDOW OF THE TOWN, whichever house it is in)
    // one house of a street front: side +1 = north row, -1 = south row; its front stands at l = side * FRONT
    const houseInto = (G, h) => {
      const { s0, s1, side, floors, shop } = h, w = s1 - s0, r = h.rng || R.street, rp = h.panes || R.panes, FR = h.front ?? FRONT;
      const lf = side * FR, lb = side * (FR + h.depth), out = side > 0 ? neg(NX) : NX, tone = r.pick(brickTones), stone = mul(cStone, r.range(0.8, 1.1));
      const fy = [0, 3.6, 6.7, 9.8, 12.5], eave = fy[floors] + 0.45, rise = r.range(2.6, 3.4), ridgeL = side * (FR + h.depth * 0.5);
      const fr = (l) => lf - side * l;
      // walls: front, back and both ends
      face(G, [SP(s0, lf, 0), SP(s1, lf, 0), SP(s1, lf, eave), SP(s0, lf, eave)], out, tone, BRICK);
      face(G, [SP(s0, lb, 0), SP(s1, lb, 0), SP(s1, lb, eave), SP(s0, lb, eave)], neg(out), tone, BRICK);
      for (const [s, o2] of [[s0, neg(AX)], [s1, AX]]) {
        face(G, [SP(s, lf, 0), SP(s, lb, 0), SP(s, lb, eave), SP(s, lf, eave)], o2, tone, BRICK);
        triOut(G, SP(s, lf, eave), SP(s, lb, eave), SP(s, ridgeL, eave + rise), o2, tone, BRICK);
      }
      // an end wall that looks out on an open place (the square, the road beyond the lane) has windows of its own,
      // two to a floor; NO SUCH WALL IS WHOLLY DARK: where the deal leaves it so, the middle one of its panes burns
      for (const e of h.open || []) {
        const s = e < 0 ? s0 : s1, o2 = e < 0 ? neg(AX) : AX, re = h.dress ? R.laneEnd : R.ends, w0 = WIN.length;
        for (let f = 0; f < floors; f++) {
          const wh = f === 0 ? 1.9 : f === 1 ? 2.0 : f === 2 ? 1.8 : 1.35, sill = fy[f] + (f === 0 ? 1.15 : f === 1 ? 0.75 : 0.8);
          for (const k of [0.28, 0.72]) {
            const lc = side * (FR + h.depth * k);
            pane(SP(s + e * 0.05, lc, sill + wh / 2), o2, 1.2, wh, pickKind(re, Math.max(f, 1)), re());
            sbox(G, Math.min(s, s + e * 0.2), Math.max(s, s + e * 0.2), lc - 0.74, lc + 0.74, sill - 0.13, sill, stone, PLAIN, { top: [cSnow, SNOW] });
          }
        }
        if (!WIN.slice(w0).some((q) => q.kind !== K.DARK)) WIN[w0 + ((WIN.length - w0) >> 1)].kind = K.FIRE;
      }
      // cornice with snow on it, the white roof, the party wall's coping
      sbox(G, s0, s1, fr(0.32), lf, eave - 0.3, eave, stone, PLAIN, { top: [cSnow, SNOW] });
      face(G, [SP(s0, fr(0.25), eave - 0.05), SP(s1, fr(0.25), eave - 0.05), SP(s1, ridgeL, eave + rise), SP(s0, ridgeL, eave + rise)], [out[0], 1.5, out[2]], cSnow, SNOW);
      face(G, [SP(s0, lb, eave - 0.05), SP(s1, lb, eave - 0.05), SP(s1, ridgeL, eave + rise), SP(s0, ridgeL, eave + rise)], [-out[0], 1.5, -out[2]], cSnow, SNOW);
      // chimney stack on the west party wall, pots, snow on its shoulders
      const cl = side * (FR + h.depth * r.range(0.36, 0.64)), ch = eave + rise + r.range(1.1, 2.0), cw = r.range(0.45, 0.7);
      sbox(G, s1 - 0.5, s1 + 0.5, cl - cw, cl + cw, eave + rise * 0.35, ch, mul(tone, 0.85), BRICK, { top: [cSnow, SNOW] });
      const pots = r.int(2, 4);
      for (let i = 0; i < pots; i++) { const pl = cl + (i - (pots - 1) / 2) * (2 * cw / pots); sbox(G, s1 - 0.13, s1 + 0.13, pl - 0.11, pl + 0.11, ch, ch + r.range(0.35, 0.6), lin('#3a221a'), PLAIN); }
      CHIM.push({ p: SP(s1, cl, ch + 0.6), smoke: r.chance(0.92) });
      // upper floors: bays of windows with stone sills (snow on them) and lintels
      const bays = w > 7.1 ? 3 : 2;
      for (let f = 1; f < floors; f++) {
        const wh = f === 1 ? 2.0 : f === 2 ? 1.8 : 1.35, ww = f === 3 ? 1.05 : 1.2, sill = fy[f] + (f === 1 ? 0.75 : 0.8);
        for (let b = 0; b < bays; b++) {
          const sc = s0 + (b + 0.5) * w / bays;
          pane(SP(sc, fr(0.05), sill + wh / 2), out, ww, wh, pickKind(rp, f), rp());
          sbox(G, sc - ww / 2 - 0.14, sc + ww / 2 + 0.14, fr(0.2), lf, sill - 0.13, sill, stone, PLAIN, { top: [cSnow, SNOW] });
          sbox(G, sc - ww / 2 - 0.1, sc + ww / 2 + 0.1, fr(0.05), lf, sill + wh, sill + wh + 0.2, stone, PLAIN);
        }
      }
      return { tone, stone, out, fr, lf, w, eave, r };
    };
    const good = (p, sx, sy, sz, color) => GOODS.push({ p, sx, sy, sz, color }), leaf = (p, sx, sy, sz, color) => LEAVES.push({ p, sx, sy, sz, color });
    const fruits = ['#d9701c', '#a3211c', '#5d7a2a', '#d6a626', '#7a4a22', '#c23a1a'].map(lin), cHolly = lin('#1d3d27'), cBerry = lin('#9a1f24');
    // a sprig of holly: a small fan of dark leaves with a few berries at its foot; and a trail of ivy hung in a swag
    const sprigAt = (s, l, y, n, size) => {
      for (let i = 0; i < n; i++) { const a = (i / (n - 1) - 0.5) * 2.0; leaf(SP(s + Math.sin(a) * size, l, y + Math.cos(a) * size * 0.8), 0.075, 0.1, 0.045, mul(cHolly, 0.8 + 0.5 * (i % 2))); }
      for (let i = 0; i < 3; i++) leaf(SP(s + (i - 1) * 0.05, l, y - 0.03 * (i % 2)), 0.036, 0.036, 0.036, cBerry);
    };
    const ivyAt = (s0, s1, l, y, sag, rsh = R.shops) => {
      for (let s = s0; s <= s1; s += 0.2) { const k = (s - s0) / (s1 - s0); leaf(SP(s, l, y - sag * 4 * k * (1 - k) + rsh.range(-0.03, 0.03)), 0.09, 0.07, 0.05, mul(cHolly, rsh.range(0.7, 1.3))); }
    };
    const doorInto = (G, h, info, ds) => {
      const { fr, out, stone, r } = info, dc = r.pick(paints);
      face(G, [SP(ds - 0.5, fr(0.03), 0.15), SP(ds + 0.5, fr(0.03), 0.15), SP(ds + 0.5, fr(0.03), 2.35), SP(ds - 0.5, fr(0.03), 2.35)], out, dc, PLAIN);
      sbox(G, ds - 0.68, ds + 0.68, fr(0.5), info.lf, 0, 0.15, stone, PLAIN, { top: [cSnow, SNOW] });
      for (const e of [-0.6, 0.6]) sbox(G, ds + e - 0.08, ds + e + 0.08, fr(0.08), info.lf, 0.15, 2.95, stone, PLAIN);
      pane(SP(ds, fr(0.05), 2.66), out, 1.0, 0.42, K.FAN, (h.panes || R.panes)(), 1);
      if (r.chance(0.75)) { if (r.chance(0.5)) sprigAt(ds, fr(0.09), 1.62, 6, 0.17); else ivyAt(ds - 0.6, ds + 0.6, fr(0.12), 3.0, 0.22, h.shops || R.shops); }
      DOORS.push({ p: SP(ds, info.lf, 0), out, s: ds, s0: h.s0, main: AX === AX0 });
    };
    // the ground floor: a shop front spilling gold on the snow, or a house door and parlour windows
    const groundInto = (G, h, info) => {
      const { s0, s1, side } = h, { fr, out, lf, stone, r } = info, rs = h.shops || R.shops, rp = h.panes || R.panes, pil = 0.35, doorW = 1.4;
      if (!h.shop) {
        const ds = lerp(s0 + 1.2, s1 - 1.2, r.chance(0.5) ? 0.5 : r.pick([0.12, 0.88]));
        doorInto(G, h, info, ds);
        for (const sc of [s0 + 1.35, s1 - 1.35]) {
          if (Math.abs(sc - ds) < 1.7) continue;
          pane(SP(sc, fr(0.05), 2.1), out, 1.2, 1.9, pickKind(rp, 1), rp());
          sbox(G, sc - 0.74, sc + 0.74, fr(0.2), lf, 1.02, 1.15, stone, PLAIN, { top: [cSnow, SNOW] });
          if (rs.chance(0.45)) sprigAt(sc, fr(0.12), 1.3, 5, 0.14);
        }
        sbox(G, s0, s1, fr(0.1), lf, 3.3, 3.5, stone, PLAIN, { top: [cSnow, SNOW] });
        return;
      }
      const west = r.chance(0.5), paint = r.pick(paints), ws0 = s0 + pil + (west ? 0 : doorW), ws1 = s1 - pil - (west ? doorW : 0), wm = (ws0 + ws1) / 2, ww = ws1 - ws0;
      sbox(G, ws0, ws1, fr(0.14), lf, 0, 0.9, paint, PLAIN);
      for (const sp of [s0 + pil / 2, s1 - pil / 2, west ? ws1 + 0.1 : ws0 - 0.1]) sbox(G, sp - pil / 2, sp + pil / 2, fr(0.17), lf, 0, 3.05, paint, PLAIN);
      sbox(G, s0, s1, fr(0.28), lf, 3.05, 3.52, paint, PLAIN, { top: [cSnow, SNOW] });
      pane(SP(wm, fr(0.05), 1.93), out, ww, 2.06, K.SHOP, rp(), 1);
      SHOPS.push({ p: SP(wm, lf, 0), out, w: ww, s: wm, main: AX === AX0 });
      const dsh = west ? s1 - pil - doorW / 2 : s0 + pil + doorW / 2, opens = rs.chance(0.45), dseed = rs();
      doorInto(G, h, info, dsh);
      if (opens) pane(SP(dsh, fr(0.045), 1.25), out, 1.0, 2.2, K.DOOR, dseed, 1);
      // goods on a sloping board under the window (some shops), hung birds, sacks, holly along the fascia
      const kind = rs.pick(['fruit', 'fruit', 'fruit', 'poultry', 'grocer']), dn = clamp(density, 0.75, 1.25);
      const by = (d) => 1.02 - 0.3 * d;
      face(G, [SP(ws0 + 0.15, fr(0.14), by(0)), SP(ws1 - 0.15, fr(0.14), by(0)), SP(ws1 - 0.15, fr(1.1), by(1)), SP(ws0 + 0.15, fr(1.1), by(1))], [out[0], 2.4, out[2]], lin('#2c2118'), PLAIN);
      face(G, [SP(ws0 + 0.15, fr(1.1), 0), SP(ws1 - 0.15, fr(1.1), 0), SP(ws1 - 0.15, fr(1.1), by(1)), SP(ws0 + 0.15, fr(1.1), by(1))], out, lin('#231a13'), PLAIN);
      if (kind !== 'poultry') {
        for (let b = ws0 + 0.35; b < ws1 - 0.5; b += 0.82) {
          const c = kind === 'fruit' ? rs.pick(fruits) : rs.pick([lin('#a8752a'), lin('#4a2e1c'), lin('#8a6a3a')]), rad = kind === 'fruit' ? rs.range(0.085, 0.12) : rs.range(0.07, 0.1);
          for (let i = 0, n = Math.round(11 * dn); i < n; i++) {
            const u = rs.range(0, 0.66), v = rs.range(0.1, 0.92), hgt = 0.34 * Math.max(0, 1 - Math.hypot((u - 0.33) / 0.36, (v - 0.5) / 0.5)) * rs.range(0.4, 1);
            good(SP(b + u, fr(0.14 + v * 0.96), by(v) + rad * 0.8 + hgt), rad, rad, rad, mul(c, rs.range(0.75, 1.15)));
          }
        }
      } else {
        for (let b = ws0 + 0.3; b < ws1 - 0.2; b += rs.range(0.4, 0.52)) {
          const len = rs.range(0.3, 0.42), y = 2.86 - len;
          good(SP(b, fr(0.42), y), 0.11, len * 0.8, 0.1, mul(lin('#9a8a6a'), rs.range(0.7, 1.1)));
          good(SP(b, fr(0.42), y - len * 0.8 - 0.08), 0.035, 0.09, 0.035, lin('#8a7a5c'));
        }
        for (let i = 0; i < 3; i++) good(SP(lerp(ws0 + 0.5, ws1 - 0.5, rs()), fr(0.6), by(0.5) + 0.12), 0.26, 0.15, 0.2, lin('#cfc0a0'));
      }
      if (kind === 'grocer') for (let i = 0, n = rs.int(2, 4); i < n; i++) good(SP(lerp(ws0, ws1, rs()), fr(1.5 + rs.range(0, 0.4)), 0.3), 0.32, 0.36, 0.3, lin('#6a5334'));
      if (rs.chance(0.6)) for (let b = s0 + 0.4; b < s1 - 0.3; b += 0.3) { leaf(SP(b, fr(0.31), 3.02 + rs.range(-0.05, 0.05)), 0.13, 0.1, 0.07, cHolly); if (rs.chance(0.3)) leaf(SP(b, fr(0.37), 3.0), 0.04, 0.04, 0.04, cBerry); }
    };
    // THE END OF A ROW THAT ENDS THE TOWN'S FRONTS (the lane's two last houses): its end wall has windows of its own
    // (h.open: dealt as every window is), and its front carries a rain pipe at the corner (a hopper under
    // the cornice, snow on it) and a lamp on an iron bracket over the ground floor, burning, its light on the snow
    // below. (stream lane-end: the lamp's place along the front, its flicker)
    const endDress = (G, h, info) => {
      const { s1 } = h, { fr, lf, eave } = info, re = R.laneEnd, iron = lin('#14161a'), ls = s1 - re.range(2.2, 3.2), seed = re(), ps = s1 - 0.3;
      G.tube(SP(ps, fr(0.12), 0.1), SP(ps, fr(0.12), eave - 0.72), 0.06, 0.06, 5, iron, PLAIN);
      sbox(G, ps - 0.17, ps + 0.17, fr(0.3), lf, eave - 0.72, eave - 0.36, iron, PLAIN, { top: [cSnow, SNOW] });
      for (const y of [1.1, 3.9, 6.6]) sbox(G, ps - 0.1, ps + 0.1, fr(0.2), lf, y, y + 0.07, iron, PLAIN);
      const a0 = SP(ls, fr(0.02), 3.95), a1 = SP(ls, fr(0.85), 4.05), lp = SP(ls, fr(0.85), 3.86);
      G.tube(a0, a1, 0.025, 0.02, 4, iron, PLAIN); G.tube(SP(ls, fr(0.02), 3.6), SP(ls, fr(0.6), 4.02), 0.016, 0.016, 3, iron, PLAIN); G.tube(a1, lp, 0.01, 0.01, 3, iron, PLAIN);
      G.box(lp[0], lp[1] - 0.26, lp[2], 0.1, lp[1], 0.1, [1, 1, 1], { aux: [0, 3.4, NONE, seed] });
      sbox(G, ls - 0.13, ls + 0.13, fr(0.98), fr(0.72), 3.86, 3.9, iron, PLAIN, { top: [cSnow, SNOW] });
      GLOWS.push({ p: [lp[0], lp[1] - 0.13, lp[2]], size: 1.1, level: 1.4, seed, heat: 1.05 });
      POOLS_OF_LIGHT.push({ p: SP(ls, fr(1.5), 0.09), u: [AX[0] * 2.6, 0, AX[2] * 2.6], v: [NX[0] * 2.0, 0, NX[2] * 2.0], level: 0.7, seed });
    };
    // a row of houses from s0 to s1 on one side of the frame's line, its fronts `front` m from it
    const rowInto = async (G, r, s0, s1, side, front, o = {}) => {
      for (let s = s0, built = 0; s < s1 - 3;) {
        let w = r.range(6, 8);
        if (s1 - (s + w) < 5) w = s1 - s;
        const h = { s0: s, s1: s + w, side, front, rng: r, panes: o.panes, shops: o.shopStream, floors: r.chance(o.tall ?? 0.45) ? 4 : 3, shop: r.chance(o.shops ?? 0.72), depth: o.depth ?? 9, open: [] };
        const last = s + w >= s1 - 3;
        if (o.openStart && s === s0) h.open.push(-1);
        if ((o.openEnd || o.dressEnd) && last) h.open.push(1);
        h.dress = !!o.dressEnd && last;
        const info = houseInto(G, h);
        groundInto(G, h, info);
        if (h.dress) endDress(G, h, info);
        s += w;
        if (++built % 3 === 0) await rest();
      }
    };
    // both rows of the first street, from behind the entry to where it opens into the square; then both rows of the
    // lane that leads out of the square (its fronts LANE_FRONT from the line: parlour windows 5 m off either side)
    const GN = makeGeo(), GSo = makeGeo(), GL = makeGeo(), GQ = makeGeo(), GF = makeGeo(), GC = makeGeo();
    for (const side of [1, -1]) await rowInto(side > 0 ? GN : GSo, R.street, S_BACK - R.street.range(0, 3), TOWN.s1, side, FRONT, { openEnd: true });
    for (const side of [1, -1]) await rowInto(GL, R.lane, TOWN.sq, TOWN.lane, side, LANE_FRONT, { shops: 0.4, tall: 0.3, depth: 8, openStart: true, dressEnd: true, panes: R.lanePanes, shopStream: R.laneShops });
    await rest();
    // ---- the square: the first street opens into it; a church front on its north side, houses and shops round it ----
    const BRAZIERS = [], STALLS = [], EMBERS = [];
    {
      const r = R.square, G = GQ, lN = TOWN.lN, lS = -TOWN.lS, c0 = (TOWN.s1 + TOWN.sq) / 2, CW = 9.5, stone = lin('#4d4b52'), stoneB = lin('#3a393f');
      // the south side, and the north side either hand of the church
      await rowInto(G, r, TOWN.s1, TOWN.sq, -1, lS, { shops: 0.85, panes: R.sqPanes, shopStream: R.sqShops });
      await rowInto(G, r, TOWN.s1, c0 - CW, 1, lN, { shops: 0.6, panes: R.sqPanes, shopStream: R.sqShops });
      await rowInto(G, r, c0 + CW, TOWN.sq, 1, lN, { shops: 0.6, panes: R.sqPanes, shopStream: R.sqShops });
      // the corners: houses that look into the square from its east and west ends, beside the mouths of street and lane
      for (const [sF, a, b, west] of [[TOWN.s1, FRONT + 9, lN, true], [TOWN.s1, -lS, -(FRONT + 9), true], [TOWN.sq, LANE_FRONT + 8, lN, false], [TOWN.sq, -lS, -(LANE_FRONT + 8), false]]) {
        // (rowInto is async for its hand-backs only: inside a turned frame it must run to its end before the frame is put back)
        frame(SPW(sF, a, -STREET_Y), NX0, west ? neg(AX0) : AX0, () => {
          for (let s = 0, n = Math.max(1, Math.round((b - a) / 7)), w = (b - a) / n; s < b - a - 0.1; s += w) {
            const h = { s0: s, s1: s + w, side: 1, front: 0, rng: r, panes: R.sqPanes, shops: R.sqShops, floors: r.chance(0.4) ? 4 : 3, shop: r.chance(0.7), depth: 9 };
            groundInto(G, h, houseInto(G, h));
          }
        });
        await rest();
      }
      // the church: a plain gabled front of dark stone, a door, and over it one tall window of plain coloured glass,
      // lit from within; buttresses at its corners, a bell-cote on the gable, snow on every ledge
      const out = neg(NX0), wallY = 14.5, apex = 22;
      face(G, [SP(c0 - CW, lN, 0), SP(c0 + CW, lN, 0), SP(c0 + CW, lN, wallY), SP(c0 - CW, lN, wallY)], out, stone, BRICK);
      triOut(G, SP(c0 - CW, lN, wallY), SP(c0 + CW, lN, wallY), SP(c0, lN, apex), out, stone, BRICK);
      for (const sg of [-1, 1]) {
        face(G, [SP(c0 + sg * CW, lN, 0), SP(c0 + sg * CW, lN + 26, 0), SP(c0 + sg * CW, lN + 26, wallY), SP(c0 + sg * CW, lN, wallY)], sg < 0 ? neg(AX0) : AX0, stoneB, BRICK);
        face(G, [SP(c0 + sg * (CW + 0.3), lN - 0.3, wallY - 0.1), SP(c0 + sg * (CW + 0.3), lN + 26, wallY - 0.1), SP(c0, lN + 26, apex), SP(c0, lN - 0.3, apex)], [sg * AX0[0], 1.3, sg * AX0[2]], cSnow, SNOW);
        sbox(G, c0 + sg * CW - 0.8, c0 + sg * CW + 0.8, lN - 1.3, lN, 0, 11, stoneB, BRICK, { top: [cSnow, SNOW] });
        sbox(G, c0 + sg * CW - 0.6, c0 + sg * CW + 0.6, lN - 0.7, lN, 11, wallY + 1.2, stoneB, BRICK, { top: [cSnow, SNOW] });
      }
      sbox(G, c0 - 0.9, c0 + 0.9, lN - 0.4, lN + 0.5, apex - 0.4, apex + 2.6, stoneB, BRICK, { top: [cSnow, SNOW] });
      sbox(G, c0 - CW, c0 + CW, lN - 0.35, lN, 4.4, 4.7, stoneB, PLAIN, { top: [cSnow, SNOW] });
      // the door in a stone surround, two steps under snow; the window above it
      sbox(G, c0 - 1.9, c0 + 1.9, lN - 0.45, lN, 0, 4.0, stoneB, BRICK, { top: [cSnow, SNOW] });
      face(G, [SP(c0 - 1.25, lN - 0.47, 0.3), SP(c0 + 1.25, lN - 0.47, 0.3), SP(c0 + 1.25, lN - 0.47, 3.4), SP(c0 - 1.25, lN - 0.47, 3.4)], out, lin('#2a1a12'), PLAIN);
      sbox(G, c0 - 2.6, c0 + 2.6, lN - 1.5, lN - 0.45, 0, 0.3, stone, PLAIN, { top: [cSnow, SNOW] });
      pane(SP(c0, lN - 0.06, 10.1), out, 5.2, 9.4, K.GLASS, R.church(), 1);
      sbox(G, c0 - 2.9, c0 + 2.9, lN - 0.3, lN, 5.05, 5.4, stoneB, PLAIN, { top: [cSnow, SNOW] });
      SHOPS.push({ p: SP(c0, lN, 0), out, w: 4, s: c0, main: true });
      GLOWS.push({ p: SP(c0, lN - 0.8, 10), size: 5.5, level: 0.5, seed: R.church(), heat: 0.9 });
    }
    await rest();
    // ---- in the square: a pump on its stone steps, fruit stalls under canvas, chestnut braziers, a poulterer's rail --
    {
      // (one stream a thing: the pump, each stall, each brazier and the rail deal from streams of their own, so that a
      // change to one deals no other anew; within a stream nothing is dealt after a loop whose count varies)
      const G = GF, c0 = (TOWN.s1 + TOWN.sq) / 2, wood = lin('#3a2c1e'), stone = lin('#5a5a60'), iron = lin('#14161a');
      const canvas = ['#6d6453', '#5a3a30', '#3f4a3a', '#59523f', '#4a4654'].map(lin), taken = [];
      // a free place for a thing r0 m across: off the carriage way and clear of what stands there already. On the
      // square's north side nothing is set nearer the street's line than lminN: the lighter's strip (lighterLat) is
      // kept clear by half a metre and more. It deals PLACE_TRIES places from the thing's own stream, always all of
      // them, and takes the first that is free
      const PLACE_TRIES = 40;
      const place = (r, r0, lminS, lminN, lmax) => {
        const tries = [];
        for (let t = 0; t < PLACE_TRIES; t++) { const side = r.chance(0.5) ? 1 : -1, lmin = side > 0 ? lminN : lminS; tries.push([side, r.range(TOWN.s1 + 4, TOWN.sq - 4), r.range(lmin, Math.min(lmax, (side > 0 ? TOWN.lN : -TOWN.lS) - 3.5 - r0)), lmin]); }
        for (const [side, s, la, lmin] of tries) {
          const l = side * la;
          if (la < lmin || taken.some((q) => Math.hypot(q[0] - s, q[1] - l) < q[2] + r0 + 1.2)) continue;
          taken.push([s, l, r0]);
          return [s, l];
        }
        return null;
      };
      // the pump: north of the carriage way in the middle of the square
      const ps = c0 + R.pump.range(-3, 3), pl = 11 + R.pump.range(-1.5, 1.5);
      taken.push([ps, pl, 2.6]);
      sbox(G, ps - 2.0, ps + 2.0, pl - 2.0, pl + 2.0, 0, 0.28, stone, PLAIN, { top: [cSnow, SNOW] });
      sbox(G, ps - 1.3, ps + 1.3, pl - 1.3, pl + 1.3, 0.28, 0.56, stone, PLAIN, { top: [cSnow, SNOW] });
      sbox(G, ps - 0.2, ps + 0.2, pl - 0.2, pl + 0.2, 0.56, 2.1, iron, PLAIN);
      sbox(G, ps - 0.27, ps + 0.27, pl - 0.27, pl + 0.27, 2.1, 2.25, iron, PLAIN, { top: [cSnow, SNOW] });
      G.tube(SP(ps, pl, 2.25), SP(ps, pl, 2.6), 0.08, 0.03, 6, iron, PLAIN);
      G.tube(SP(ps + 0.2, pl, 1.45), SP(ps + 0.62, pl, 1.36), 0.06, 0.05, 6, iron, PLAIN);
      G.tube(SP(ps - 0.2, pl, 1.9), SP(ps - 0.95, pl, 1.25), 0.035, 0.03, 5, iron, PLAIN);
      sbox(G, ps + 0.4, ps + 1.25, pl - 0.42, pl + 0.42, 0.56, 1.0, stone, PLAIN, { top: [lin('#93a4bd'), SNOW] });
      // fruit stalls: a trestle table heaped with fruit under a canvas on four poles, a lantern hung beneath
      for (let k = 0, n = Math.round(5 * clamp(density, 0.8, 1.2)); k < n; k++) {
        const r = R.stalls[k], at = place(r, 2.2, 7.5, 8.8, 21), len = r.range(2.4, 3.2), cv = r.pick(canvas), turn = r.chance(0.3), hi = r.range(2.5, 2.8), fruit = [r.pick(fruits), r.pick(fruits), r.pick(fruits)], seed = r();
        if (!at) continue;
        const [s, l] = at, sg = l > 0 ? -1 : 1, hs = turn ? 0.6 : len / 2, hl = turn ? len / 2 : 0.6;
        sbox(G, s - hs, s + hs, l - hl, l + hl, 0.82, 0.9, wood, PLAIN);
        for (const [a, b] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) G.tube(SP(s + a * (hs + 0.15), l + b * (hl + 0.15), 0), SP(s + a * (hs + 0.15), l + b * (hl + 0.15), hi - 0.25 * (turn ? a : b) * sg), 0.04, 0.04, 4, wood, PLAIN);
        const cq = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => SP(s + a * (hs + 0.45), l + b * (hl + 0.45), hi - 0.25 * (turn ? a : b) * sg));
        face(G, cq, UP, cv, PLAIN); face(G, cq.map((q) => [q[0], q[1] - 0.03, q[2]]), DOWN, mul(cv, 0.6), PLAIN);
        face(G, cq.map((q) => [q[0], q[1] + 0.04, q[2]]), UP, cSnow, SNOW);
        for (let i = 0, m = Math.round(34 * clamp(density, 0.8, 1.2)); i < m; i++) {
          const u = r.range(-1, 1), v = r.range(-1, 1), heap = Math.floor((u * 0.5 + 0.5) * 2.999), hgt = 0.3 * Math.max(0, 1 - Math.hypot(((u * 0.5 + 0.5) * 3 % 1 - 0.5) * 2, v)) * r.range(0.4, 1), rad = r.range(0.08, 0.115);
          good(SP(s + (turn ? v * 0.5 : u * hs * 0.92), l + (turn ? u * hl * 0.92 : v * 0.5), 0.9 + rad * 0.8 + hgt), rad, rad, rad, mul(fruit[heap], r.range(0.75, 1.15)));
        }
        const lp = SP(s, l, hi - 0.55);
        G.tube(SP(s, l, hi - 0.1), lp, 0.012, 0.012, 3, iron, PLAIN);
        G.box(lp[0], lp[1] - 0.2, lp[2], 0.09, lp[1], 0.09, [1, 1, 1], { aux: [0, 3.4, NONE, seed] });
        GLOWS.push({ p: [lp[0], lp[1] - 0.1, lp[2]], size: 1.2, level: 1.5, seed, heat: 1.05 });
        POOLS_OF_LIGHT.push({ p: SP(s, l + sg * 1.3, 0.09), u: [AX0[0] * 2.6, 0, AX0[2] * 2.6], v: [NX0[0] * 2.2, 0, NX0[2] * 2.2], level: 0.5, seed });
        STALLS.push({ s, l, sg });
      }
      // chestnut braziers: an iron drum on legs, coals heaped in it, a glow on the snow round it, smoke and sparks
      for (let k = 0, n = 3; k < n; k++) {
        const r = R.braziers[k], at = place(r, 1.6, 6.8, 7.3, 19), seed = r(), per = r.range(2.6, 3.6);
        if (!at) continue;
        const [s, l] = at, p = SP(s, l, 0);
        for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283; G.tube(SP(s + Math.cos(a) * 0.3, l + Math.sin(a) * 0.3, 0), SP(s + Math.cos(a) * 0.22, l + Math.sin(a) * 0.22, 0.55), 0.03, 0.03, 4, iron, PLAIN); }
        G.lathe(p[0], p[2], [[0.2, p[1] + 0.5], [0.34, p[1] + 0.58], [0.36, p[1] + 1.0], [0.39, p[1] + 1.02]], 9, () => iron);
        G.lathe(p[0], p[2], [[0.37, p[1] + 0.96], [0.2, p[1] + 1.08], [0.0, p[1] + 1.12]], 9, () => [1, 1, 1], () => [0, 2.6, NONE, seed]);
        GLOWS.push({ p: [p[0], p[1] + 1.2, p[2]], size: 2.4, level: 1.7, seed, heat: 0.8 });
        POOLS_OF_LIGHT.push({ p: [p[0], p[1] + 0.1, p[2]], u: [3.6, 0, 0], v: [0, 0, 3.6], level: 1.0, seed });
        SMOKE.push({ p: [p[0], p[1] + 1.3, p[2]], dir: [-windFrom.x * 0.35, 1, -windFrom.y * 0.35], speed: 1.5, spread: 0.2, size: 0.9, period: per, life: per * 0.95, puffs: 7, stagger: per, warm: 0.5 });
        BRAZIERS.push({ p: [p[0], p[1] + 1.1, p[2]], s, l });
      }
      // the poulterer's rail: geese hung by the feet in a row, a lantern at each end
      const r = R.rail, at = place(r, 2.6, 7.5, 7.5, 20), railSeed = r();
      if (at) {
        const [s, l] = at, len = 4.4, top = 2.7;
        for (const e of [-1, 1]) { G.tube(SP(s + e * len / 2, l, 0), SP(s + e * len / 2, l, top + 0.1), 0.05, 0.05, 5, wood, PLAIN); GLOWS.push({ p: SP(s + e * (len / 2 + 0.2), l, top - 0.4), size: 1.1, level: 1.5, seed: r(), heat: 1.05 }); }
        G.tube(SP(s - len / 2 - 0.2, l, top), SP(s + len / 2 + 0.2, l, top), 0.04, 0.04, 5, wood, PLAIN);
        for (let b = -len / 2 + 0.3; b < len / 2 - 0.2; b += r.range(0.42, 0.56)) {
          const bl = r.range(0.34, 0.44), y = top - 0.32 - bl, pale = mul(lin('#b4a584'), r.range(0.8, 1.1));
          good(SP(s + b, l, y), 0.15, bl, 0.13, pale); good(SP(s + b, l, y - bl - 0.2), 0.045, 0.22, 0.045, pale); good(SP(s + b + 0.03, l, y - bl - 0.44), 0.055, 0.075, 0.05, mul(pale, 0.8));
          good(SP(s + b, l, top - 0.17), 0.02, 0.17, 0.02, lin('#8a6a3a'));
        }
        POOLS_OF_LIGHT.push({ p: SP(s, l, 0.09), u: [AX0[0] * 3.4, 0, AX0[2] * 3.4], v: [NX0[0] * 2.4, 0, NX0[2] * 2.4], level: 0.5, seed: railSeed });
        STALLS.push({ s, l, sg: l > 0 ? -1 : 1, rail: true });
      }
    }
    await rest();
    // gas lamps on both kerbs every 22 m, staggered, through the street, the square and the lane; beyond the lane only on
    // the north verge and twice as far apart, the last of them at TOWN.lamp. Those of the north side are on the
    // lamplighters' rounds (see layRounds): each is alight from when its lighter reaches it until it gutters out.
    // kerbAt: metres from the line to the kerb (or the road's verge) at s.
    const cIron = lin('#101216');
    const kerbAt = (s) => lerp(lerp(KERB, LANE_KERB, smoothstep(TOWN.sq - 6, TOWN.sq + 2, s)), 4.2, smoothstep(TOWN.lane, TOWN.lane + 16, s));
    const lampInto = (lp) => {
      const { s, side } = lp, l = side * kerbAt(s), seed = R.lamps(), y0 = LAND.roadAt(s) - STREET_Y + 0.15;
      // the lamp's code for the shaders: its round, its share alight (in 63rds), when in the round it is reached
      const roundCode = lp.round < 0 ? NONE : lp.round * 64 + Math.round(lp.burn * 63) + lp.at * 0.99;
      sbox(GF, s - 0.13, s + 0.13, l - 0.13, l + 0.13, y0 - 0.3, y0 + 0.7, cIron, PLAIN);
      GF.tube(SP(s, l, y0 + 0.7), SP(s, l, y0 + 2.66), 0.07, 0.05, 6, cIron, PLAIN);
      GF.tube(SP(s - 0.32, l, y0 + 2.3), SP(s + 0.32, l, y0 + 2.3), 0.025, 0.025, 4, cIron, PLAIN);
      const q = (ds, dl, y, hw) => SP(s + ds * hw, l + dl * hw, y0 + y);
      for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) {
        GF.quad(q(a[0], a[1], 2.66, 0.1), q(b[0], b[1], 2.66, 0.1), q(b[0], b[1], 3.12, 0.2), q(a[0], a[1], 3.12, 0.2), [1, 1, 1], [0, 3.4, roundCode, seed]);
        GF.quad(q(b[0], b[1], 2.66, 0.1), q(a[0], a[1], 2.66, 0.1), q(a[0], a[1], 3.12, 0.2), q(b[0], b[1], 3.12, 0.2), [1, 1, 1], [0, 3.4, roundCode, seed]);
      }
      sbox(GF, s - 0.24, s + 0.24, l - 0.24, l + 0.24, y0 + 3.12, y0 + 3.2, cIron, PLAIN, { top: [cSnow, SNOW] });
      LAMPS.push({ s, l, y: y0, side, roundCode, seed, p: SP(s, l, y0), round: lp.round, at: lp.at, burn: lp.burn });
    };
    const ROAD_ROUND_FROM = roadRoundFrom(RT, LAND.roadAt), lampPlan = planLamps(), ROUNDS = layRounds(R.lamplighter, lampPlan, R.lampShares, ROAD_ROUND_FROM);
    roundU.uRoundT.value.set(ROUNDS.rounds[0].T, ROUNDS.rounds[1].T, ROUNDS.rounds[2].T);
    for (const lp of lampPlan) lampInto(lp);
    await rest();
    // the town's floor: rutted, trodden snow between raised pavements in the street and the lane, snow heaped at the
    // kerbs; the square trodden all over; gold pooled on it from the shop fronts and from the lamps (each lamp's pool
    // goes with that lamp's own state). warmAt: the floor's aux at a world place.
    const warmAt = (p, shops = SHOPS, lamps = LAMPS) => {
      let a = 0, b = 0, on = NONE;
      for (const sh of shops) {
        const dx = p[0] - sh.p[0], dz = p[2] - sh.p[2], d2 = dx * sh.out[0] + dz * sh.out[2];
        if (d2 < -0.5 || d2 > 16) continue;
        const d1 = Math.max(Math.abs(dx * sh.out[2] - dz * sh.out[0]) - sh.w / 2, 0);
        if (d1 < 9) a += 0.95 / (1 + (d1 * d1 + d2 * d2 * 0.55) / 5);
      }
      for (const lp of lamps) {
        const d = (p[0] - lp.p[0]) ** 2 + (p[2] - lp.p[2]) ** 2;
        if (d > 150) continue;
        const k = 0.85 / (1 + d / 4.5);
        if (k > b) { b = k; on = lp.roundCode; }
      }
      return [3, Math.min(a, 1.6), on, b];
    };
    // one strip of floor from s0 to s1: ls = the stations across it, yAt its height above the street, every metre along
    // (each row asks only the shops and lamps that can reach it)
    const floorInto = async (s0, s1, ls, yAt, cAt, PT = SP) => {
      const mid = (ls[0] + ls[ls.length - 1]) / 2, hw = Math.abs(ls[ls.length - 1] - ls[0]) / 2;
      const rowAt = (s) => {
        const c = PT(s, mid, 0), shops = SHOPS.filter((sh) => Math.hypot(sh.p[0] - c[0], sh.p[2] - c[2]) < hw + 18 + sh.w), lamps = LAMPS.filter((lp) => Math.hypot(lp.p[0] - c[0], lp.p[2] - c[2]) < hw + 13);
        return ls.map((l) => { const p = PT(s, l, yAt(s, l)); return { p, c: cAt(s, l), w: warmAt(p, shops, lamps) }; });
      };
      let row = rowAt(s0);
      for (let s = s0; s < s1; s += 1) {
        const next = rowAt(Math.min(s + 1, s1));
        for (let j = 0; j < ls.length - 1; j++) GF.quad4([row[j].p, row[j + 1].p, next[j + 1].p, next[j].p], [row[j].c, row[j + 1].c, next[j + 1].c, next[j].c], [row[j].w, row[j + 1].w, next[j + 1].w, next[j].w]);
        row = next;
        if ((Math.round(s - s0) & 31) === 31) await rest();
      }
    };
    const cFloor = (s, l) => mul(cSnow, 0.8 + 0.08 * noise.n2(s * 0.6, l * 0.6));
    // heaps of shovelled snow along a kerb `k` m from the line
    const kerbY = (k, heap) => (s, l) => {
      const a = Math.abs(l), hp = Math.max(0, noise.n2(s * 0.31, Math.sign(l) * 7.7 + 0.5));
      return a > k ? 0.16 + 0.05 * noise.n2(s * 0.9, l * 0.9) : 0.02 + heap * hp * hp * smoothstep(k - 1.7, k - 0.6, a) + 0.03 * noise.n2(s * 1.3, l * 1.3);
    };
    const stY = kerbY(KERB, 0.55), laneY0 = kerbY(LANE_KERB, 0.4), laneY = (s, l) => lerp(laneY0(s, l), 0.02, smoothstep(TOWN.lane - 3, TOWN.lane, s));
    await floorInto(S_BACK - 2, TOWN.s1, [-FRONT, -(KERB + 0.01), -KERB, -4.4, -2.9, -1.4, 0, 1.4, 2.9, 4.4, KERB, KERB + 0.01, FRONT], stY, cFloor);
    {
      // the square: trodden all over, a raised flagged walk along its north and south fronts
      const ls = [TOWN.lS, TOWN.lS + 2.2, TOWN.lS + 2.21];
      for (let l = TOWN.lS + 4.4; l < TOWN.lN - 3; l += 2.4) ls.push(l);
      ls.push(TOWN.lN - 2.21, TOWN.lN - 2.2, TOWN.lN);
      await floorInto(TOWN.s1, TOWN.sq, ls, (s, l) => (l < TOWN.lS + 2.205 || l > TOWN.lN - 2.205 ? 0.16 : 0.02 + 0.035 * noise.n2(s * 0.8, l * 0.8) + 0.12 * Math.max(0, noise.n2(s * 0.23 + 4, l * 0.23)) ** 2), cFloor);
    }
    await floorInto(TOWN.sq, TOWN.lane, [-LANE_FRONT, -(LANE_KERB + 0.01), -LANE_KERB, -2.2, -0.8, 0.8, 2.2, LANE_KERB, LANE_KERB + 0.01, LANE_FRONT], laneY, cFloor);
    {
      // the road out of the town: a ribbon lying on the land along the road's own line from the lane's end, frozen mud
      // more and more as the snow of the town's treading is left behind, its edges and its far end going into the frost
      const cMud = lin('#2b2723'), _c = new THREE.Color();
      const RP3 = (d, l, y) => { const q = roadAtD(d, l); return [q[0], STREET_Y + y, q[1]]; };
      const gY = (d, l) => { const q = roadAtD(d, l); return lerp(0.02, terrain.surfaceAt(q[0], q[1]) + 0.09 - STREET_Y, smoothstep(TOWN.lane, TOWN.lane + 5, d)); };
      const cRoad = (d, l) => {
        const q = roadAtD(d, l), k = Math.max(smoothstep(2.3, 4.4, Math.abs(l)), smoothstep(TOWN.road - 50, TOWN.road - 4, d)) * smoothstep(TOWN.lane, TOWN.lane + 8, d);
        groundColor(q[0], q[1], 30, 1, _c);
        return mix3(mix3(cFloor(d, l), mul(cMud, 0.8 + 0.3 * noise.n2(d * 0.4, l * 0.4)), 0.93 * smoothstep(TOWN.lane, TOWN.cot - 30, d)), [_c.r, _c.g, _c.b], k);
      };
      await floorInto(TOWN.lane, TOWN.road, [-4.4, -3.3, -2.2, -1.1, 0, 1.1, 2.2, 3.3, 4.4], gY, cRoad, RP3);
    }
    // ---- the town's end: low stone cottages either side of the road, fewer and further apart as it goes, the land
    // beginning to fall. Each: thatch or slate under snow with eaves that overhang, a smoking chimney, a plank door, two
    // small windows whose light lies on the snow before them; a yard walled in stone (a coping, a cap of snow, a
    // gate, drifts in its corners) holding two or three of a bare tree, a cart with its shafts down, a woodpile, a
    // midden. The LAST cottage (see LAST_COT) ends the town on the road's south side: its windows burn the whole
    // visit, and the road's south wall goes on from its garden wall.
    {
      const r = R.cottages, G = GC, RUB = [4, 0, NONE, 0], tones = ['#a39a8c', '#b3a999', '#8f887d', '#beb2a0'].map(lin), wallC = lin('#5a5753'), wood = lin('#4b3c2c'), straw = lin('#5d4d30');
      const gY = (s, l) => { const p = SPW(s, l, 0); return land(p[0], p[2]) - STREET_Y; };
      // a yard wall from (sa, la) to (sb, lb) along one axis of the frame, stepping down with the ground: stone, a
      // coping a little wider, a cap of snow on that
      const wallRun = (sa, la, sb, lb) => {
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(sb - sa), Math.abs(lb - la)) / 2.6));
        for (let i = 0; i < n; i++) {
          const s0 = lerp(sa, sb, i / n), s1 = lerp(sa, sb, (i + 1) / n), l0 = lerp(la, lb, i / n), l1 = lerp(la, lb, (i + 1) / n), y = Math.max(gY(s0, l0), gY(s1, l1));
          const A = Math.min(s0, s1), B = Math.max(s0, s1), C = Math.min(l0, l1), D = Math.max(l0, l1);
          sbox(G, A - 0.2, B + 0.2, C - 0.2, D + 0.2, y - 0.9, y + 0.95, wallC, ROUGH5, { skip: 'tb' });
          sbox(G, A - 0.26, B + 0.26, C - 0.26, D + 0.26, y + 0.95, y + 1.05, mul(wallC, 0.75), RUB);
          sbox(G, A - 0.3, B + 0.3, C - 0.3, D + 0.3, y + 1.05, y + 1.15, cSnow, SNOW);
        }
      };
      // a drift of snow blown into a corner (at s, l; the yard lies toward ds, dl)
      const drift = (s, l, ds, dl) => {
        const y = gY(s, l), c = SP(s + ds * 0.25, l + dl * 0.25, y + 0.62), a = SP(s + ds * 2.3, l + dl * 0.3, y + 0.02), b = SP(s + ds * 0.3, l + dl * 2.3, y + 0.02);
        triOut(G, c, a, b, UP, cSnow, SNOW);
      };
      const YARDS = [];
      const COTS = [];
      const cottage = (c) => {
        COTS.push(c);
        const { s0, s1, side, d, back, eave, rise, tone, ds, kinds, seeds, thatch } = c, lf = side * back, lb = side * (back + d), lc = side * (back + d / 2), out = side > 0 ? neg(NX0) : NX0;
        const y = Math.min(gY(s0, lf), gY(s1, lf), gY(s0, lb), gY(s1, lb)) + 0.15, ov = thatch ? 0.55 : 0.4, tk = thatch ? 0.32 : 0.1, edge = thatch ? straw : cSlate;
        sbox(G, s0, s1, lf, lb, y - 1.2, y + eave, tone, RUB, { skip: 'tb' });
        for (const [sg, o2] of [[s0, neg(AX0)], [s1, AX0]]) triOut(G, SP(sg, lf, y + eave), SP(sg, lb, y + eave), SP(sg, lc, y + eave + rise), o2, tone, RUB);
        // the roof: two slopes that overhang the walls, snow on them, the thatch's (or the slates') edge dark under it
        for (const [l, sg2] of [[lf, -side], [lb, side]]) {
          const e0 = SP(s0 - ov, l + sg2 * ov, y + eave - ov * 0.55), e1 = SP(s1 + ov, l + sg2 * ov, y + eave - ov * 0.55), r0 = SP(s0 - ov, lc, y + eave + rise + 0.1), r1 = SP(s1 + ov, lc, y + eave + rise + 0.1), up = [NX0[0] * sg2, 1.3, NX0[2] * sg2], dn = (q) => [q[0], q[1] - tk, q[2]];
          face(G, [e0, e1, r1, r0], up, cSnow, SNOW);
          face(G, [dn(e0), dn(e1), e1, e0], [NX0[0] * sg2, 0, NX0[2] * sg2], edge, PLAIN);
          face(G, [dn(e0), dn(e1), SP(s1 + ov, l, y + eave - 0.05), SP(s0 - ov, l, y + eave - 0.05)], DOWN, mul(edge, 0.6), PLAIN);
          for (const [sg, o2] of [[s0 - ov, neg(AX0)], [s1 + ov, AX0]]) { const a2 = SP(sg, l + sg2 * ov, y + eave - ov * 0.55), b2 = SP(sg, lc, y + eave + rise + 0.1); face(G, [dn(a2), dn(b2), b2, a2], o2, edge, PLAIN); }
        }
        sbox(G, s1 - 0.5, s1 + 0.4, lc - 0.45, lc + 0.45, y + eave + rise * 0.4, y + eave + rise + 1.0, mul(tone, 0.8), RUB, { top: [cSnow, SNOW] });
        CHIM.push({ p: SP(s1 - 0.05, lc, y + eave + rise + 1.3), smoke: true, low: true });
        // a plank door and two small windows in the front, each lit one with its light on the snow before it
        const dS = lerp(s0 + 1.1, s1 - 1.1, ds);
        face(G, [SP(dS - 0.45, lf - side * 0.03, y), SP(dS + 0.45, lf - side * 0.03, y), SP(dS + 0.45, lf - side * 0.03, y + 1.85), SP(dS - 0.45, lf - side * 0.03, y + 1.85)], out, lin('#2a2018'), PLAIN);
        const lit = [];
        [s0 + 1.2, s1 - 1.2].forEach((sc, i) => {
          if (Math.abs(sc - dS) < 1.25) return;
          const mid = SP(sc, lf - side * 0.04, y + 1.35);
          pane(mid, out, 0.95, 1.0, kinds[i], seeds[i], 1);
          if (kinds[i] !== K.DARK) lit.push(mid);
          sbox(G, sc - 0.6, sc + 0.6, lf - side * 0.14, lf, y + 0.74, y + 0.85, mul(tone, 1.15), PLAIN, { top: [cSnow, SNOW] });
          if (kinds[i] !== K.DARK) { SHOPS.push({ p: SP(sc, lf, y), out, w: 0.9, s: sc, main: false, small: true }); POOLS_OF_LIGHT.push({ p: SP(sc, lf - side * 2.6, y + 0.12), u: [AX0[0] * 1.7, 0, AX0[2] * 1.7], v: [NX0[0] * 2.5, 0, NX0[2] * 2.5], level: 0.75, seed: seeds[i], yAt: (x, z) => terrain.surfaceAt(x, z) }); }
        });
        DOORS.push({ p: SP(dS, lf, y), out, s: dS, main: false });
        // the yard: a wall along the road with a gate in it, and back to the cottage's corners; drifts in its corners
        const lw = side * 5.4, yA = s0 - 1.5, yB = s1 + 1.5;
        wallRun(yA, lw, dS - 0.7, lw); wallRun(dS + 0.7, lw, yB, lw); wallRun(yA, lw, yA, lf); wallRun(yB, lw, yB, lf);
        { const yg = gY(dS, lw); for (let k = 0; k < 3; k++) G.tube(SP(dS - 0.5, lw, yg + 0.25 + k * 0.3), SP(dS + 0.5, lw, yg + 0.25 + k * 0.3), 0.03, 0.03, 4, wood, PLAIN); for (const e of [-0.5, 0.5]) G.tube(SP(dS + e, lw, yg), SP(dS + e, lw, yg + 1.0), 0.045, 0.045, 4, wood, PLAIN); }
        drift(yA + 0.2, lw - side * -0.2, 1, side); drift(yB - 0.2, lw + side * 0.2, -1, side);
        YARDS.push({ s0: yA, s1: yB, l0: Math.min(lw, lb), l1: Math.max(lw, lb) });
        return { y, lw, lf, yA, yB, dS, side, lit };
      };
      // what stands in a yard: `picks` of tree, cart, woodpile, midden, each at a place of its own between the wall
      // and the front
      const yardThings = (q, picks, ry) => {
        const { lw, lf, yA, yB, dS, side } = q, mid = (lw + lf) / 2, room = Math.abs(lf - lw);
        const spot = [[yA + 1.3, lw + side * 1.2], [yB - 1.4, lw + side * 1.3], [yA + 1.6, lf - side * 1.3], [yB - 1.8, lf - side * 1.3]];
        picks.forEach((pick, i) => {
          const [ps, pl] = spot[i], y = gY(ps, pl), tw = ry.range(0, 6.283), k = ry.range(0.85, 1.15), w0 = SPW(ps, pl, 0);
          // (a tree is planted only where its boughs, which reach 2.5 m, stay 4.5 m clear of the line: else logs)
          const what = pick === 0 && nearRoute(w0[0], w0[2])[0] < 7 ? 2 : pick;
          if (what === 0) {
            // a bare tree: a leaning trunk, boughs and twigs, a line of snow along each bough's upper side
            const base = SP(ps, pl, y - 0.2), top = SP(ps + 0.4 * Math.cos(tw), pl + 0.4 * Math.sin(tw), y + 2.6 * k);
            G.tube(base, top, 0.17 * k, 0.1 * k, 6, lin('#221d1a'), PLAIN);
            for (let b = 0; b < 7; b++) {
              const a = tw + b * 2.4, h0 = lerp(1.2, 2.6, b / 6) * k, len = ry.range(1.2, 2.2) * k, o0 = SP(ps + 0.4 * Math.cos(tw) * h0 / 2.6, pl + 0.4 * Math.sin(tw) * h0 / 2.6, y + h0), o1 = SP(ps + Math.cos(a) * len, pl + Math.sin(a) * len, y + h0 + len * ry.range(0.5, 0.95));
              G.tube(o0, o1, 0.06 * k, 0.018, 4, lin('#221d1a'), PLAIN);
              G.tube([o0[0], o0[1] + 0.05 * k, o0[2]], [o1[0], o1[1] + 0.02, o1[2]], 0.035 * k, 0.012, 3, cSnow, SNOW);
              const o2 = SP(ps + Math.cos(a + 0.5) * len * 1.25, pl + Math.sin(a + 0.5) * len * 1.25, y + h0 + len * 1.25);
              G.tube([lerp(o0[0], o1[0], 0.6), lerp(o0[1], o1[1], 0.6), lerp(o0[2], o1[2], 0.6)], o2, 0.022, 0.008, 3, lin('#221d1a'), PLAIN);
            }
          } else if (what === 1 && room > 4) {
            // a cart with its shafts down on the snow: a bed of planks, two wheels, snow lying in it
            const c = Math.cos(tw * 0.15), sn = Math.sin(tw * 0.15), B = (x, yy, z) => SP(ps + x * c - z * sn, pl + x * sn + z * c, y + yy);
            for (const [P, o2, col, aux] of [[[B(-1, 0.75, -0.55), B(1, 0.75, -0.55), B(1, 0.75, 0.55), B(-1, 0.75, 0.55)], DOWN, wood, PLAIN], [[B(-1, 1.02, -0.5), B(1, 1.02, -0.5), B(1, 1.02, 0.5), B(-1, 1.02, 0.5)], UP, cSnow, SNOW]]) face(G, P, o2, col, aux);
            for (const z of [-0.55, 0.55]) { face(G, [B(-1, 0.75, z), B(1, 0.75, z), B(1, 1.1, z), B(-1, 1.1, z)], [0, 0, z], wood, PLAIN); face(G, [B(-1, 0.75, z), B(1, 0.75, z), B(1, 1.1, z), B(-1, 1.1, z)], [0, 0, -z], mul(wood, 0.7), PLAIN); G.tube(B(0, 0.5, z * 1.15), B(0, 0.5, z * 1.3), 0.5, 0.5, 10, mul(wood, 0.8), PLAIN); G.tube(B(1, 0.8, z * 0.8), B(2.7, 0.06, z * 0.7), 0.04, 0.035, 4, wood, PLAIN); }
            for (const x of [-1, 1]) face(G, [B(x, 0.75, -0.55), B(x, 0.75, 0.55), B(x, 1.1, 0.55), B(x, 1.1, -0.55)], [x, 0, 0], wood, PLAIN);
          } else if (what === 2) {
            // a woodpile: three courses of cut logs, their sawn ends to the yard, snow on the top course
            for (let row = 0; row < 3; row++) for (let j = 0; j < 6 - row; j++) G.tube(SP(ps + (j - (5 - row) / 2) * 0.27, pl - 0.45, y + 0.12 + row * 0.24), SP(ps + (j - (5 - row) / 2) * 0.27, pl + 0.45, y + 0.12 + row * 0.24), 0.125, 0.125, 6, mul(wood, ry.range(0.8, 1.3)), PLAIN);
            sbox(G, ps - 0.55, ps + 0.55, pl - 0.5, pl + 0.5, y + 0.74, y + 0.84, cSnow, SNOW);
          } else {
            // a midden: a low dark heap, snow on its weather side
            const p0 = SP(ps, pl, y);
            G.lathe(p0[0], p0[2], [[1.3 * k, p0[1] - 0.1], [0.8 * k, p0[1] + 0.35], [0.0, p0[1] + 0.6 * k]], 8, (j, i) => (Math.cos(i / 8 * 6.283 + 0.4) * windFrom.x + Math.sin(i / 8 * 6.283 + 0.4) * windFrom.y > 0.15 ? cSnow : lin('#2a221a')), (j, i) => (Math.cos(i / 8 * 6.283 + 0.4) * windFrom.x + Math.sin(i / 8 * 6.283 + 0.4) * windFrom.y > 0.15 ? SNOW : RUB));
          }
        });
      };
      for (let s = TOWN.lane + 5; s < TOWN.cot - 6;) {
        const k = (s - TOWN.lane) / (TOWN.cot - TOWN.lane), step = r.range(8.5, 11) + 14 * k * k;
        for (const side of [1, -1]) {
          const w = r.range(6.2, 8.8), d = r.range(4.4, 5.4), back = r.range(7.2, 9.5) + 5 * k, eave = r.range(2.2, 2.7), rise = r.range(1.5, 2.0), tone = mul(r.pick(tones), r.range(0.85, 1.1)), ds = r.range(0.3, 0.7), kinds = [pickKind(r, 1), pickKind(r, 1)], seeds = [r(), r()], thatch = r.chance(0.55), off = r.range(0, 2), here = r.chance(1 - 0.5 * k);
          const n = R.yards.int(2, 3), picks = R.yards.shuffle([0, 1, 2, 3]).slice(0, n);
          // (no cottage of the row stands where the last cottage's yard is)
          if (!here || (side < 0 && s + off + w + 1.5 > LAST_COT.s0 - 4)) continue;
          yardThings(cottage({ s0: s + off, s1: s + off + w, side, d, back, eave, rise, tone, ds, kinds, seeds, thatch }), picks, R.yards);
        }
        s += step;
        await rest();
      }
      // the last cottage: both its windows lit by a fire, whatever the visit
      {
        const rl = R.lastCot, q = cottage({ s0: LAST_COT.s0, s1: LAST_COT.s1, side: -1, d: rl.range(4.6, 5.2), back: LAST_COT.back, eave: rl.range(2.3, 2.6), rise: rl.range(1.6, 1.9), tone: mul(rl.pick(tones), rl.range(0.9, 1.1)), ds: 0.5, kinds: [K.STEADY, K.STEADY], seeds: [rl(), rl()], thatch: true });
        yardThings(q, [2, 1, 0], rl);
        // (the first look's mark: its lit pane further along the road)
        MARKS.cot = q.lit[q.lit.length - 1];
      }
      // THE FIELDS about the cottages' road (stream town-fields; every bush's values are drawn before its test).
      // HEDGES: one along the backs either side, FIELD.back metres from the road's middle, from FIELD.from past the
      // lane's end to FIELD.to past the last cottage; and FIELD.cross of them either side running out from the road's
      // wall's side (FIELD.near metres from its middle) to FIELD.out metres, one to each equal share of that length. A hedge is a row of bushes FIELD.step apart:
      // dark thorn, round-headed, a cap of snow; a bush is left out where a cottage or its yard stands, on the road,
      // and within FIELD.clear metres of the line. A HAYSTACK under snow stands somewhere in the north field behind
      // the backs, the whole field its plot; a bare TREE, leaning with the wind, somewhere by the road's north wall
      // between the last yard and the hill's foot, where the walls end (see THE STACK and THE TREE below). Each keeps a
      // round of its own about it (stack.r, tree.r metres): its room.
      {
        const rf = R.fields, FIELD = { back: 31, from: 14, to: 12, cross: 4, near: 12, out: 58, step: 2.6, clear: 4.5, verge: 6.6, stack: { r: 4.5 }, tree: { r: 3 } }, thorn = lin('#1e1a16'), BUSHES = [];
        const bush = (s, l) => {
          const rad = rf.range(1.0, 1.45), h = rf.range(1.2, 1.9), ds = rf.range(-0.4, 0.4), dl = rf.range(-0.4, 0.4), tone = rf.range(0.7, 1.2), w = SPW(s + ds, l + dl, 0);
          if (Math.abs(l) < FIELD.verge || YARDS.some((q) => s > q.s0 - 1.5 && s < q.s1 + 1.5 && l > q.l0 - 1.5 && l < q.l1 + 1.5) || nearRoute(w[0], w[2])[0] < FIELD.clear + rad) return;
          BUSHES.push({ s, l, rad, h, ds, dl, tone });
        };
        for (const side of [1, -1]) {
          for (let s = TOWN.lane + FIELD.from; s < TOWN.cot + FIELD.to; s += FIELD.step) bush(s, side * FIELD.back);
          for (let k = 0; k < FIELD.cross; k++) {
            const sc = lerp(TOWN.lane + FIELD.from, TOWN.cot + FIELD.to, (k + rf.range(0.2, 0.8)) / FIELD.cross);
            for (let l = FIELD.near; l < FIELD.out; l += FIELD.step) if (Math.abs(l - FIELD.back) > 1.2) bush(sc, side * l);
          }
          await rest();
        }
        // THE STACK stands anywhere in the north field behind the backs: along the road from the hedges' first metre
        // past the lane's end to the last cottage; across it from the north yards' back walls (`backs`: the greatest of
        // them, read from YARDS; the cross hedges' near end where no yard stands) to the back hedge, its round clear of
        // both. Its two values are drawn once and stand untested.
        // THE TREE stands by the road's north wall, its round behind it: anywhere along the wall from the last yard's
        // far wall (`yardsEnd`, read from YARDS, and the tree's round past it) to the foot of the town's hill, where
        // the land ends the road's walls (HILL[1] metres past the last cottage). Its place along the wall is drawn
        // once; whether a tree is planted there is said at the tree, below.
        // The hedges' bushes, dealt before them, are left out within `r` of either
        const backs = YARDS.reduce((m, q) => Math.max(m, q.l1), FIELD.near), yardsEnd = YARDS.reduce((m, q) => Math.max(m, q.s1), TOWN.cot);
        const STACK = [rf.range(TOWN.lane + FIELD.from, TOWN.cot), rf.range(backs + FIELD.stack.r, FIELD.back - FIELD.stack.r)], TREE = [rf.range(yardsEnd + FIELD.tree.r, TOWN.cot + HILL[1]), WALLS.l + FIELD.tree.r];
        for (const { s, l, rad, h, ds, dl, tone } of BUSHES) {
          if (Math.hypot(s - STACK[0], l - STACK[1]) < FIELD.stack.r || Math.hypot(s - TREE[0], l - TREE[1]) < FIELD.tree.r) continue;
          const p0 = SP(s + ds, l + dl, gY(s + ds, l + dl)), c = mul(thorn, tone);
          G.lathe(p0[0], p0[2], [[rad * 0.75, p0[1] - 0.2], [rad, p0[1] + h * 0.55], [rad * 0.72, p0[1] + h * 0.92], [0, p0[1] + h + 0.1]], 5, (j) => (j >= 2 ? cSnow : j ? mix3(c, cSnow, 0.3) : c), (j) => (j >= 2 ? SNOW : RUB));
        }
        // the haystack: a round stack with a domed head, its thatch showing under the snow's edge
        {
          const [hs, hl] = STACK, p0 = SP(hs, hl, gY(hs, hl)), k = rf.range(0.9, 1.1), hay = lin('#6b5a34');
          G.lathe(p0[0], p0[2], [[2.1 * k, p0[1] - 0.2], [2.35 * k, p0[1] + 1.7 * k], [2.0 * k, p0[1] + 2.3 * k], [1.0 * k, p0[1] + 3.3 * k], [0, p0[1] + 3.75 * k]], 10, (j) => (j >= 2 ? cSnow : mul(hay, j ? 0.75 : 1)), (j) => (j >= 2 ? SNOW : RUB));
        }
        // A WIND-BENT TREE: a trunk in three reaches bent down the wind, every bough streaming the same way, a line of
        // snow along each bough's weather side. Of size k it stands 5.2*k m tall and reaches BENT.reach*k m down the
        // wind, its boughs BENT.swing*k m to either hand. bentDeal: its boughs' values, drawn before any test.
        const BENT = { reach: 8.1, swing: 3.1, boughs: 9 }, lee = [-windFrom.x, -windFrom.y], bark = lin('#1d1916');
        const bentDeal = (rt) => Array.from({ length: BENT.boughs }, () => [rt.range(0.25, 1), rt.range(1.6, 3.2), rt.range(-0.7, 0.7), rt.range(0.05, 0.6)]);
        const bentTree = (base, k, deal) => {
          const T = (out, up) => [base[0] + lee[0] * out * k, base[1] + up * k, base[2] + lee[1] * out * k], J = [T(0, 0), T(0.5, 2.2), T(1.7, 4.0), T(3.3, 5.2)];
          for (let i = 0; i < 3; i++) G.tube(J[i], J[i + 1], (0.3 - 0.07 * i) * k, (0.23 - 0.07 * i) * k, 6, bark, PLAIN);
          for (const [t, l0, sw, rise] of deal) {
            const seg = Math.min(2, Math.floor(1 + t * 2)), u = (1 + t * 2) % 1, o = [0, 1, 2].map((q) => lerp(J[seg][q], J[Math.min(3, seg + 1)][q], seg === 2 && u === 0 ? 1 : u));
            const len = l0 * k, dx = lee[0] * Math.cos(sw) - lee[1] * Math.sin(sw), dz = lee[0] * Math.sin(sw) + lee[1] * Math.cos(sw);
            const e = [o[0] + dx * len, o[1] + len * rise, o[2] + dz * len], e2 = [e[0] + lee[0] * len * 0.5, e[1] - len * 0.08, e[2] + lee[1] * len * 0.5];
            G.tube(o, e, 0.07 * k, 0.03, 4, bark, PLAIN); G.tube(e, e2, 0.03, 0.01, 3, bark, PLAIN);
            G.tube([o[0], o[1] + 0.06, o[2]], [e[0], e[1] + 0.04, e[2]], 0.04 * k, 0.015, 3, cSnow, SNOW);
          }
        };
        // how near the line a tree of size k planted at (s, l) comes: the least over five places along its reach down
        // the wind
        const reachNear = (s, l, k) => { const w0 = SPW(s, l, 0); let near = 1e9; for (let j = 0; j <= 4; j++) near = Math.min(near, nearRoute(w0[0] + lee[0] * BENT.reach * k * j / 4, w0[2] + lee[1] * BENT.reach * k * j / 4)[0]); return near; };
        // THE FIELD'S TREE: its size and its boughs are drawn before any test. It is planted only where its whole reach
        // down the wind stays FIELD.clear metres clear of the line (the rule of the trees at the cottages' backs, below)
        // and where its round is open ground (no stone of the moor in it, no pool's ice or bank at its foot): else the
        // field has no tree on that visit.
        {
          const [ts, tl] = TREE, k = rf.range(0.9, 1.1), deal = bentDeal(rf), w0 = SPW(ts, tl, 0);
          const open = LAND.shoreAt(w0[0], w0[2]) > POOL_BANK && !LAND.STONES.some((q) => Math.hypot(q.x - w0[0], q.z - w0[2]) < q.w / 2 + FIELD.tree.r);
          if (open && reachNear(ts, tl, k) >= FIELD.clear + BENT.swing * k) bentTree(SP(ts, tl, gY(ts, tl) - 0.3), k, deal);
        }
        // A TREE AT A COTTAGE'S BACK (stream back-trees): BACK_TREE.share of the cottages have one, BACK_TREE.off metres
        // behind the back wall, BACK_TREE.k times the field tree's size, so that it stands over the roof. It is planted
        // only where its whole reach down the wind stays BACK_TREE.clear metres clear of the line and outside the stack's
        // round (as the hedges' bushes are): else the plot has none.
        {
          const BACK_TREE = { share: 0.75, off: [1.8, 3.2], k: [1.15, 1.6], clear: 4.5 }, rb = R.backTrees;
          for (const c of COTS) {
            const ts = rb.range(c.s0 + 1, c.s1 - 1), tl = c.side * (c.back + c.d + rb.range(BACK_TREE.off[0], BACK_TREE.off[1])), k = rb.range(BACK_TREE.k[0], BACK_TREE.k[1]), has = rb.chance(BACK_TREE.share), deal = bentDeal(rb);
            if (!has || reachNear(ts, tl, k) < BACK_TREE.clear + BENT.swing * k || Math.hypot(ts - STACK[0], tl - STACK[1]) < FIELD.stack.r) continue;
            bentTree(SP(ts, tl, gY(ts, tl) - 0.3), k, deal);
          }
        }
      }
    }
    // ---- the walled road (see WALLS, FOLD): drystone walls on both verges from the last cottage's garden wall for
    // WALLS.run metres, each piece of its own height with its own cap of snow, a tumbled gap here and there; in the
    // south wall a gate of bars standing open, where the cart track leaves the road; a slab bridge where a frozen
    // runnel crosses the road; a stone trough in the south wall's lee; a fold south of the road. All of it stands.
    const cWall = lin('#514f4c');
    const dryWall = (G, r, a, b, h, o = {}) => {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(len / 1.8)), yaw = Math.atan2(-(b[1] - a[1]), b[0] - a[0]);
      for (let i = 0; i < n; i++) {
        const x0 = lerp(a[0], b[0], i / n), z0 = lerp(a[1], b[1], i / n), x1 = lerp(a[0], b[0], (i + 1) / n), z1 = lerp(a[1], b[1], (i + 1) / n), hh = h * r.range(0.86, 1.1), tone = r.range(0.8, 1.1), thick = r.range(0.27, 0.34), fallen = r.range(0, 1);
        const g0 = land(x0, z0), g1 = land(x1, z1), top = (g0 + g1) / 2 + hh, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
        if (o.skip && o.skip((i + 0.5) / n * len)) continue;
        if (o.gaps && fallen < o.gaps) {
          // a tumbled gap: the wall's foot and a few fallen stones
          G.box(cx, Math.min(g0, g1) - 0.5, cz, len / n / 2 + 0.03, (g0 + g1) / 2 + hh * 0.3, thick + 0.25, mul(cWall, tone), { yaw, aux: ROUGH5, top: cSnow, auxTop: SNOW });
          continue;
        }
        G.box(cx, Math.min(g0, g1) - 0.5, cz, len / n / 2 + 0.03, top, thick, mul(cWall, tone), { yaw, aux: ROUGH5, top: cSnow, auxTop: SNOW });
        G.box(cx, top, cz, len / n / 2 + 0.05, top + 0.08, thick + 0.05, cSnow, { yaw, aux: SNOW });
      }
    };
    {
      const r = R.walls, G = GC, W2 = (s, l) => { const p = SPW(s, l, 0); return [p[0], p[2]]; }, gy = (s, l) => { const p = SPW(s, l, 0); return land(p[0], p[2]) - STREET_Y; };
      const s0 = LAST_COT.s1 + 1.5, s1 = s0 + WALLS.run, gA = WALLS.gate - WALLS.gateW / 2, gB = WALLS.gate + WALLS.gateW / 2;
      dryWall(G, r, W2(s0, WALLS.l), W2(s1, WALLS.l), WALLS.h, { gaps: 0.06 });
      dryWall(G, r, W2(s0, -WALLS.l), W2(gA - 0.2, -WALLS.l), WALLS.h, { gaps: 0.05 });
      dryWall(G, r, W2(gB + 0.2, -WALLS.l), W2(s1, -WALLS.l), WALLS.h, { gaps: 0.07 });
      await rest();
      // the gate: two stone posts, a leaf of five bars swung open into the field
      const wood = lin('#4b3c2c');
      for (const sg of [gA, gB]) { const y = gy(sg, -WALLS.l); sbox(G, sg - 0.2, sg + 0.2, -WALLS.l - 0.22, -WALLS.l + 0.22, y - 0.5, y + 1.5, mul(cWall, 0.9), ROUGH5, { top: [cSnow, SNOW] }); }
      {
        const y = gy(gB, -WALLS.l), ang = r.range(1.1, 1.35), B = (t, h) => SP(gB - 0.25 - Math.cos(ang) * t * (WALLS.gateW - 0.5), -WALLS.l - 0.2 - Math.sin(ang) * t * (WALLS.gateW - 0.5), y + h);
        for (let k = 0; k < 5; k++) G.tube(B(0, 0.22 + k * 0.23), B(1, 0.22 + k * 0.23), 0.032, 0.032, 5, wood, PLAIN);
        G.tube(B(0, 1.2), B(1, 1.2), 0.037, 0.037, 5, cSnow, SNOW);
        for (const t of [0.02, 0.98]) G.tube(B(t, 0.02), B(t, 1.3), 0.045, 0.045, 5, wood, PLAIN);
        G.tube(B(0.02, 0.2), B(0.98, 1.14), 0.028, 0.028, 5, wood, PLAIN);
      }
      // the frozen runnel across the road, and the bridge of three great slabs that carries the road over it
      {
        const sr = WALLS.runnel, ice = lin('#2b3a52'), rim = lin('#c9d3e6');
        for (let k = 0; k < 16; k++) {
          const l0 = lerp(WALLS.l + 9, -WALLS.l - 12, k / 16), l1 = lerp(WALLS.l + 9, -WALLS.l - 12, (k + 1) / 16), w0 = 0.5 * noise.n2(l0 * 0.3, 5.5), w1 = 0.5 * noise.n2(l1 * 0.3, 5.5), ya = gy(sr + w0, l0) + 0.03, yb = gy(sr + w1, l1) + 0.03;
          for (const [d0, d1, c, aux] of [[-0.42, -0.28, rim, SNOW], [-0.28, 0.28, ice, PLAIN], [0.28, 0.42, rim, SNOW]]) face(G, [SP(sr + w0 + d0, l0, ya), SP(sr + w0 + d1, l0, ya), SP(sr + w1 + d1, l1, yb), SP(sr + w1 + d0, l1, yb)], UP, c, aux);
        }
        for (let k = 0; k < 3; k++) { const l0 = -2.7 + k * 1.8, y = gy(sr, l0 + 0.9); sbox(G, sr - 1.15 - 0.1 * k, sr + 1.2, l0 + 0.04, l0 + 1.76, y - 0.1, y + 0.2 + 0.03 * (k % 2), mul(cStone, 0.75 + 0.1 * k), ROUGH5, { top: [mix3(cStone, cSnow, 0.5), SNOW] }); }
        for (const l of [-2.9, 2.9]) { const y = gy(sr, l); sbox(G, sr - 1.5, sr + 1.5, l - 0.2, l + 0.2, y - 0.2, y + 0.55, mul(cWall, 0.9), ROUGH5, { top: [cSnow, SNOW] }); }
      }
      // the trough: a hollowed block of stone in the south wall's lee, ice in it, snow on its rim
      {
        const st = WALLS.trough, lt = -WALLS.l - 1.0, y = gy(st, lt);
        sbox(G, st - 0.95, st + 0.95, lt - 0.38, lt + 0.38, y - 0.3, y + 0.52, mul(cStone, 0.8), ROUGH5, { top: [cSnow, SNOW] });
        face(G, [SP(st - 0.78, lt - 0.24, y + 0.53), SP(st + 0.78, lt - 0.24, y + 0.53), SP(st + 0.78, lt + 0.24, y + 0.53), SP(st - 0.78, lt + 0.24, y + 0.53)], UP, lin('#0d1622'), PLAIN);
      }
      // the fold: four walls of the same stone, a way in on its lee side
      {
        const c = FOLD, q = (ds, dl) => W2(c.s + ds, c.l + dl), a = c.w / 2, b = c.d / 2;
        dryWall(G, r, q(-a, b), q(a, b), c.h, { gaps: 0.04 }); dryWall(G, r, q(a, b), q(a, -b), c.h); dryWall(G, r, q(-a, b), q(-a, -b), c.h);
        dryWall(G, r, q(-a, -b), q(a, -b), c.h, { skip: (m) => m > c.w * 0.38 && m < c.w * 0.38 + 2.2 });
      }
      await rest();
    }
    const townMat = townMaterial(townU, { place: PLACE_TXT, placeKey: PLACE_KEY }), townMat2 = townMaterial(townU, { side: THREE.DoubleSide, place: PLACE_TXT, placeKey: PLACE_KEY });
    for (const G of [GN, GSo, GL, GQ, GF, GC]) { scene.add(new THREE.Mesh(G.toGeometry(), townMat)); await rest(); }
    // ---- the town behind the fronts: rows of white roofs out into the mist as far as the lane's end, a spire
    const GB = makeGeo();
    {
      const r = R.roofs, rp = R.backPanes, tones = ['#2e2b2b', '#353030', '#2a2828', '#3a3330'].map(lin);
      const roofInto = (s0, s1, l0, l1, eave, rise, tone) => {
        const lc = (l0 + l1) / 2;
        for (const [s, o2] of [[s0, neg(AX)], [s1, AX]]) triOut(GB, SP(s, l0, eave), SP(s, l1, eave), SP(s, lc, eave + rise), o2, tone, BRICK);
        face(GB, [SP(s0, l0 - 0.25, eave - 0.1), SP(s1, l0 - 0.25, eave - 0.1), SP(s1, lc, eave + rise), SP(s0, lc, eave + rise)], [-NX[0], 1.5, -NX[2]], cSnow, SNOW);
        face(GB, [SP(s0, l1 + 0.25, eave - 0.1), SP(s1, l1 + 0.25, eave - 0.1), SP(s1, lc, eave + rise), SP(s0, lc, eave + rise)], [NX[0], 1.5, NX[2]], cSnow, SNOW);
      };
      const backHouse = (s0, s1, lc, depth, eave, rise, lit, smokes) => {
        const l0 = lc - depth / 2, l1 = lc + depth / 2, tone = r.pick(tones);
        sbox(GB, s0, s1, l0, l1, 0, eave, tone, BRICK, { skip: 'tb' });
        roofInto(s0, s1, l0, l1, eave, rise, tone);
        const cl = lc + r.range(-0.3, 0.3) * depth, ch = eave + rise + r.range(0.9, 1.7);
        sbox(GB, s1 - 0.45, s1 + 0.45, cl - 0.5, cl + 0.5, eave + rise * 0.3, ch, mul(tone, 0.8), BRICK, { top: [cSnow, SNOW] });
        if (r.chance(smokes)) CHIM.push({ p: SP(s1, cl, ch + 0.4), smoke: true });
        for (const [l, o2] of [[l0 - 0.04, neg(NX)], [l1 + 0.04, NX]]) {
          for (let b = 0, n = s1 - s0 > 8 ? 3 : 2; b < n; b++) {
            if (!r.chance(lit)) continue;
            pane(SP(s0 + (b + 0.5) * (s1 - s0) / n, l, eave - 1.7), o2, 1.1, 1.6, pickKind(rp, 2), rp(), 0.85);
          }
        }
      };
      // rows parallel to the street, 21 m apart, from behind the entry to the lane's end; none where the square, its
      // houses and the church stand; the south side has room for five before the land falls to the moor
      const inSquare = (s0, s1, lc) => s1 > TOWN.s1 - 10 && s0 < TOWN.sq + 9 && (lc > 0 ? lc < TOWN.lN + 31 : -lc < -TOWN.lS + 15);
      for (const side of [1, -1]) {
        for (let row = 0, rows = side > 0 ? 9 : 5; row < rows; row++) {
          const lc = side * (FRONT + 22 + 21 * row + r.range(-1.5, 1.5)), far = row > 3;
          for (let s = S_BACK - 44 + r.range(0, 6); s < TOWN.lane - 4;) {
            const w = far ? r.range(9, 15) : r.range(6, 9), depth = r.range(7, 9), eave = r.pick([6.9, 6.9, 9.9, 10.2, 12.8]) + (far ? 0 : 0.3), rise = r.range(2.4, 3.3), gap = r.chance(0.1);
            if (!gap && !inSquare(s, s + w, lc)) backHouse(s, s + w, lc, depth, eave, rise, far ? 0.3 : 0.75, row < 3 ? 0.35 : 0.12);
            s += w;
          }
          await rest();
        }
      }
      // one plain spire on the north side, far in the mist: a tower, a nave's roof, a slated point with snow on its weather side
      const cs = lerp(70, 130, R.spire()), cl = 150 + R.spire.range(-12, 12), stone = lin('#3b3a40'), rs = R.spirePanes;
      sbox(GB, cs - 3.6, cs + 3.6, cl - 3.6, cl + 3.6, 0, 27, stone, BRICK, { top: [cSnow, SNOW] });
      sbox(GB, cs - 34, cs - 3.6, cl - 6.5, cl + 6.5, 0, 12, stone, BRICK, { skip: 'tb' });
      roofInto(cs - 34, cs - 3.6, cl - 6.5, cl + 6.5, 12, 7, stone);
      const tip = SP(cs, cl, 52), q = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => SP(cs + a * 3.2, cl + b * 3.2, 27));
      for (let i = 0; i < 4; i++) {
        const a = q[i], b = q[(i + 1) % 4], mid = [(a[0] + b[0]) / 2 - SP(cs, cl, 27)[0], 0.4, (a[2] + b[2]) / 2 - SP(cs, cl, 27)[2]];
        const wind = mid[0] * windFrom.x + mid[2] * windFrom.y > 0;
        triOut(GB, a, b, tip, mid, wind ? cSnow : cSlate, wind ? SNOW : PLAIN);
      }
      for (const [dl, o2] of [[-3.64, neg(NX)], [3.64, NX]]) pane(SP(cs, cl + dl, 21), o2, 0.9, 3.2, K.DARK, rs(), 1);
      pane(SP(cs - 18, cl - 6.54, 7), neg(NX), 1.6, 5, K.BLIND, rs(), 0.5);
    }
    const backs = new THREE.Mesh(GB.toGeometry(), townMat);
    scene.add(backs);
    await rest();
    // ---- the people of the town --------------------------------------------------------------------------------
    const hemiC = new THREE.Color(HEMI).multiplyScalar(LOOK.hemi * 2.1 / Math.PI), moonC = new THREE.Color('#cdd7e6').multiplyScalar(LOOK.moon * 2.3 / Math.PI);
    const folkU = { uTime: time, uLampAt: { value: new THREE.Vector4() }, uWalk: { value: new THREE.Vector2() }, uAmb: { value: hemiC }, uMoon: { value: moonC.clone().multiplyScalar(0.3) },
      uMoonDir: { value: moonDir }, uGlow: { value: new THREE.Color(...FIRE.lin).multiplyScalar(0.55) } };
    // where lighter i is at the clock t (his round is the world's: see layRounds): his feet, his heading as a yaw,
    // the metres he has come, whether he walks; and where his pole's flame then is. Nothing here reads the route.
    const POLE = [0.3, 3.29, 0.06], LIGHTER_SCALE = 1.02;
    const lighterNow = (i, t, o) => {
      const q = ROUNDS.at(i, t), d = q[4], inSq = smoothstep(TOWN.s1 - 1, TOWN.s1 + 1, d) * (1 - smoothstep(TOWN.sq - 1, TOWN.sq + 1, d));
      const sg = 1 - 2 * q[5], yaw = Math.atan2(q[2], q[3]) + Math.PI * q[5], moving = Math.abs(sg) > 0.999 ? 1 : 0;
      o.x = q[0]; o.z = q[1]; o.y = lerp(STREET_Y + lerp(0.17, 0.03, inSq), LAND.roadAt(d) + 0.02, smoothstep(TOWN.lane - 1, TOWN.lane + 4, d));
      o.yaw = yaw; o.walk = d; o.moving = moving; o.c = q[6];
      // the pole's tip: carried upright at his side, leaning forward with him as he trots (as the figures' shader has it)
      const lean = 0.3 * moving, py = POLE[1] * Math.cos(lean) - POLE[2] * Math.sin(lean), pz = POLE[1] * Math.sin(lean) + POLE[2] * Math.cos(lean), cy = Math.cos(yaw), sy = Math.sin(yaw);
      o.fx = o.x + (POLE[0] * cy + pz * sy) * LIGHTER_SCALE; o.fy = o.y + py * LIGHTER_SCALE; o.fz = o.z + (-POLE[0] * sy + pz * cy) * LIGHTER_SCALE;
      return o;
    };
    // metres north of the street's line of the route's own line, by metres along the street: no one walks or stands
    // within 2.6 m of the line the eye flies down
    const routeLat = new Float32Array(TOWN.cot + 60);
    for (let i = 0; i * 3 < RT.length; i++) { const sl = toStreet(RT[i * 3], RT[i * 3 + 2]), k = Math.floor(sl[0]); if (k >= 0 && k < routeLat.length - 1) { routeLat[k] = sl[1]; routeLat[k + 1] = sl[1]; } }
    const clearOf = (s, l, gap = 2.6) => Math.abs(l - routeLat[clamp(Math.round(s), 0, routeLat.length - 1)]) >= gap;
    const FOLK = [], coats = ['#2a2a30', '#3a2a22', '#1f3328', '#3d1c1e', '#2b3148', '#4a4038', '#51483a', '#33353c'].map(lin);
    const shawls = ['#6e3a30', '#4c5a6a', '#7a6a3c', '#46583e', '#8a8272', '#5a4458', '#74604a'].map(lin);
    // how one person is dressed: a man, a woman, a girl or a boy
    const dressOf = (r, who) => {
      const D = DRESS, c = mul(r.pick(coats), r.range(0.8, 1.35)), c2 = mul(r.pick(shawls), r.range(0.7, 1.1));
      let d = 0;
      if (who === 'man') d = (r.chance(0.6) ? D.coat : 0) + r.pick([D.cap, D.cap, D.hat, 0]) + (r.chance(0.35) ? D.comforter : 0) + r.pick([0, 0, 0, 0, D.basket, D.goose]);
      else if (who === 'woman') d = D.bell + (r.chance(0.65) ? D.shawl : 0) + (r.chance(0.72) ? D.bonnet : 0) + (r.chance(0.35) ? D.apron : 0) + (r.chance(0.4) ? D.basket : 0);
      else if (who === 'girl') d = D.bell + (r.chance(0.5) ? D.bonnet : 0) + (r.chance(0.4) ? D.apron : 0);
      else d = (r.chance(0.6) ? D.cap : 0) + (r.chance(0.4) ? D.comforter : 0);
      return { color: who === 'girl' || who === 'boy' ? mul(c, 1.5) : c, color2: c2, dress: d };
    };
    const grown = (r) => (r.chance(0.5) ? 'man' : 'woman'), child = (r) => (r.chance(0.5) ? 'girl' : 'boy');
    const PAVE = 0.17;
    {
      // walkers: on both pavements of the street and of the lane, some in pairs, a few at the road's edge; along the
      // square's flagged walks and its carriage way; a few on the road past the cottages
      const r = R.walkers;
      const walk = (s0, s1, l, y0, y1, pairL) => {
        const speed = r.range(1.1, 1.6), phase = r(), scale = r.range(0.9, 1.08), pair = r.chance(0.35), k2 = r.range(0.86, 0.98), d1 = dressOf(r, grown(r)), d2 = dressOf(r, grown(r));
        if (!clearOf(s0, l) || !clearOf(s1, l) || !clearOf((s0 + s1) / 2, l)) return;
        FOLK.push({ a: SP(s0, l, y0), b: SP(s1, l, y1), speed, phase, scale, kind: 0, ...d1 });
        if (pair && clearOf(s0, l + pairL) && clearOf(s1, l + pairL)) FOLK.push({ a: SP(s0 + 0.2, l + pairL, y0), b: SP(s1 + 0.2, l + pairL, y1), speed, phase, scale: scale * k2, kind: 0, ...d2 });
      };
      for (let i = 0, n = Math.round(26 * density); i < n; i++) {
        const road = r.chance(0.2), side = r.chance(0.5) ? 1 : -1, s0 = r.range(S_BACK + 6, TOWN.s1 - 30), len = r.range(22, 60), lr = r.range(2.8, 4.4), lp = r.range(KERB + 0.65, FRONT - 0.8);
        walk(s0, Math.min(s0 + len, TOWN.s1 + 8), side * (road ? lr : lp), road ? 0.04 : PAVE, road ? 0.04 : PAVE, side * (road ? 0.6 : -0.55));
      }
      for (let i = 0, n = Math.round(14 * density); i < n; i++) {
        const side = r.chance(0.5) ? 1 : -1, s0 = r.range(TOWN.sq + 2, TOWN.lane - 26), len = r.range(18, 44), l = side * r.range(LANE_KERB + 0.95, LANE_FRONT - 0.6);
        walk(s0, Math.min(s0 + len, TOWN.lane - 3), l, PAVE, PAVE, -side * 0.5);
      }
      for (let i = 0, n = Math.round(14 * density); i < n; i++) {
        const band = r.pick([[26.4, 27.4, PAVE], [-23.4, -22.4, PAVE], [3.0, 4.6, 0.05], [3.0, 4.6, 0.05], [-6.3, -5.9, 0.05]]), s0 = r.range(TOWN.s1 + 1.5, TOWN.sq - 16), len = r.range(12, 40);
        walk(s0, Math.min(s0 + len, TOWN.sq - 1.5), r.range(band[0], band[1]), band[2], band[2], 0.5);
      }
      for (let i = 0, n = Math.round(5 * density); i < n; i++) {
        const side = r.chance(0.5) ? 1 : -1, s0 = r.range(TOWN.lane + 4, TOWN.cot - 40), s1 = s0 + r.range(20, 50), l = side * r.range(2.9, 3.8);
        walk(s0, s1, l, LAND.roadAt(s0) - STREET_Y + 0.26, LAND.roadAt(s1) - STREET_Y + 0.26, side * 0.5);
      }
    }
    await rest();
    {
      // people stopped at shop windows and at the church door, looking in; a seller behind each stall and buyers before
      // it; two or three round each brazier with a hand out to it
      // (a stream each: the shop-gazers, the stalls' people, the braziers' people)
      let r = R.shoppers;
      const stand = (a, b, d) => FOLK.push({ a, b, phase: r(), scale: r.range(0.88, 1.05), kind: 2, ...d });
      for (const sh of SHOPS) {
        const want = r.chance(0.3 * density), n = r.int(1, 2), off = [r.range(-0.4, 0.4), r.range(-0.4, 0.4)], ds = [dressOf(r, grown(r)), dressOf(r, grown(r))];
        if (!want || sh.small) continue;
        for (let k = 0; k < n; k++) {
          const t = off[k] * sh.w + k * 0.6, tx = sh.out[2] * t, tz = -sh.out[0] * t;
          stand([sh.p[0] + sh.out[0] * 1.75 + tx, sh.p[1] + PAVE, sh.p[2] + sh.out[2] * 1.75 + tz], [sh.p[0] + tx, sh.p[1] + PAVE, sh.p[2] + tz], ds[k]);
        }
      }
      r = R.stallFolk;
      for (const st of STALLS) {
        const n = r.int(1, 2), at = [r.range(-0.9, 0.9), r.range(-0.9, 0.9)], ds = [dressOf(r, 'woman'), dressOf(r, grown(r)), dressOf(r, grown(r))];
        ds[0].dress |= DRESS.apron;
        if (st.rail) stand(SP(st.s + 2.9, st.l + st.sg * 0.3, 0.04), SP(st.s, st.l + st.sg * 2, 0.04), ds[0]); else stand(SP(st.s, st.l - st.sg * 1.0, 0.04), SP(st.s, st.l + st.sg, 0.04), ds[0]);
        for (let k = 0; k < n; k++) stand(SP(st.s + at[k], st.l + st.sg * (1.35 + 0.3 * k), 0.04), SP(st.s + at[k] * 0.5, st.l, 0.04), ds[k + 1]);
      }
      r = R.brazierFolk;
      for (const bz of BRAZIERS) {
        const n = r.int(2, 3), a0 = r.range(0, 6.283), ds = [dressOf(r, 'man'), dressOf(r, grown(r)), dressOf(r, child(r))];
        for (let k = 0; k < n; k++) { const a = a0 + k * 2.1 + 0.3 * k * k; stand(SP(bz.s + Math.cos(a) * 1.05, bz.l + Math.sin(a) * 1.05, 0.04), SP(bz.s, bz.l, 0.04), k === 2 ? { ...ds[2], scale: 0.62 } : ds[k]); }
      }
    }
    await rest();
    {
      // children: running out of doorways to grown people who have stopped for them; chasing one another along the
      // pavements and over the square's carriage way
      // THE DOORWAYS: DOORWAYS.n welcomes at doors of the street, the square's mouths and the lane: any door of a house
      // that begins past the entry, as far as the lane's end (named places both). Two welcomes stand DOORWAYS.apart
      // house widths apart or more (HOUSE_W: the widest a house is dealt), because a welcome's children and its
      // grown people take a house width and a half of pavement either way: nearer, two welcomes would run through
      // one another. The stream `children` deals DOORWAYS.tries doors, always all of them, and the first that keep
      // the rule are taken; each welcome's people are dealt from a stream of its own.
      const DOORWAYS = { n: 5, tries: 60, apart: 3 }, HOUSE_W = 8, picked = [], picks = [];
      for (let t = 0; t < DOORWAYS.tries; t++) picks.push(R.children.pick(DOORS));
      for (const d of picks) {
        if (picked.length >= DOORWAYS.n) break;
        if (!d.main || !(d.s0 >= 0) || d.s > TOWN.lane || picked.some((q) => Math.hypot(q.p[0] - d.p[0], q.p[2] - d.p[2]) < DOORWAYS.apart * HOUSE_W)) continue;
        const r = R.doorways[picked.length], n = Math.round(3 * clamp(density, 0.8, 1.34)), ds = [dressOf(r, grown(r)), dressOf(r, grown(r))], off = r.range(-0.8, 0.8);
        // how far out from the door they run: to the road's edge in the street, to the kerb in the lane, well out into the square
        const reach = d.s < TOWN.s1 ? FRONT - 3.4 : d.s > TOWN.sq ? 1.7 : 5.5, tx = d.out[2], tz = -d.out[0];
        const at = (o, t, y) => [d.p[0] + d.out[0] * o + tx * t, d.p[1] + y, d.p[2] + d.out[2] * o + tz * t];
        picked.push(d);
        for (let k = 0; k < 2; k++) FOLK.push({ a: at(reach + 0.7, off + (k ? 0.7 : -0.5), 0.05), b: at(0, 0, 0.05), phase: r(), scale: r.range(0.92, 1.06), kind: 2, ...ds[k] });
        for (let k = 0; k < n; k++) FOLK.push({ a: at(-1.1, r.range(-0.15, 0.15), PAVE), b: at(reach + r.range(-0.3, 0.3), off + r.range(-0.6, 0.6), 0.06), speed: r.range(2.6, 3.6), phase: r(), scale: r.range(0.52, 0.68), kind: 1, ...dressOf(r, child(r)) });
      }
      // children chasing one another along the pavements and across the square: a stream of their own (three are dealt
      // for every chase, two or three of them run)
      for (let i = 0, n = Math.round(6 * density), r = R.chase; i < n; i++) {
        const where = r.pick(['street', 'street', 'square', 'square', 'lane']), side = r.chance(0.5) ? 1 : -1, m = r.int(2, 3), len = r.range(11, 22), speed = r.range(2.8, 3.8), phase = r();
        const s0 = where === 'street' ? r.range(8, TOWN.s1 - 24) : where === 'square' ? r.range(TOWN.s1 + 2, TOWN.sq - 24) : r.range(TOWN.sq + 3, TOWN.lane - 26);
        const l = where === 'street' ? side * r.range(KERB + 0.7, FRONT - 0.9) : where === 'square' ? r.range(3.1, 4.5) : side * r.range(LANE_KERB + 0.7, LANE_FRONT - 0.7), y = where === 'square' ? 0.05 : PAVE;
        for (let k = 0; k < 3; k++) { const one = { a: SP(s0 + k * 1.3, l + (k % 2) * 0.35, y), b: SP(s0 + len + k * 1.3, l + (k % 2) * 0.35, y), speed, phase: phase + 0.004 * k, scale: r.range(0.5, 0.68), kind: 1, ...dressOf(r, child(r)) }; if (k < m) FOLK.push(one); }
      }
    }
    // smoke from every chimney that has a fire under it, leaning with the wind; snow slipping from eaves here and there
    // A LOW CHIMNEY'S SMOKE (every cottage's: its pot stands under the wind that the town's tall stacks clear): thick
    // and slow, caught at the roof and carried long down the wind, LOW.life seconds before it thins, LOW.size times a
    // tall stack's puffs, leaning LOW.lean with the wind for LOW.rise of rising
    const LOW = { life: 8, size: 1.7, lean: 1.1, rise: 0.9, speed: 0.8 };
    for (const c of CHIM) {
      const speed = R.smoke.range(1.3, 2.1), size = R.smoke.range(1.3, 2.1), period = R.smoke.range(4.5, 6);
      if (!c.smoke) continue;
      if (c.low) SMOKE.push({ p: c.p, dir: [-windFrom.x * LOW.lean, LOW.rise, -windFrom.y * LOW.lean], speed: speed * LOW.speed, spread: 0.3, size: size * LOW.size, period: period + LOW.life - 4.5, life: LOW.life, puffs: detail < 0.75 ? 7 : 12, stagger: LOW.life + 1.5 });
      else SMOKE.push({ p: c.p, dir: [-windFrom.x * 0.5, 1, -windFrom.y * 0.5], speed, spread: 0.22, size, period, life: 4.5, puffs: detail < 0.75 ? 5 : 8, stagger: 6 });
    }
    for (let i = 0, n = Math.round(14 * density); i < n; i++) {
      const r = R.slips, lane = r.chance(0.35), side = r.chance(0.5) ? 1 : -1, s = lane ? r.range(TOWN.sq + 4, TOWN.lane - 4) : r.range(10, TOWN.s1 - 4), per = r.range(6, 11), high = r.chance(0.5), offset = r.range(0, per);
      WHITE.push({ p: SP(s, side * ((lane ? LANE_FRONT : FRONT) - 0.3), 10.2 + (high ? 2.7 : 0)), dir: [-side * NX0[0], -0.2, -side * NX0[2]], across: AX0, speed: 1.5, spread: 1.1, size: 1.1, period: per, offset, life: 1.7, puffs: 9, stagger: 0.6 });
    }
    // men and boys are one shape, women and girls another
    const folk = makeFolk(FOLK.filter((f) => !(f.dress & DRESS.bell)), folkU), women = makeFolk(FOLK.filter((f) => f.dress & DRESS.bell), folkU, folkGeometry('woman'));
    scene.add(folk.mesh, women.mesh);
    // the three lamplighters: pole and ladder, a cap and a short coat; each is a mesh of his own with his own place
    // (uLampAt, uWalk), set from his round each frame
    const lighterGeo = folkGeometry('lighter'), LIGHTERS = [0, 1, 2].map((i) => {
      const U = { ...folkU, uLampAt: { value: new THREE.Vector4() }, uWalk: { value: new THREE.Vector2() } }, tone = R.lighterCoats.range(0.85, 1.2);
      const m = makeFolk([{ a: SP(0, 0, 0), b: SP(10, 0, 0), phase: 0, scale: LIGHTER_SCALE, kind: 3, color: mul(lin('#2c2a2a'), tone), color2: lin('#4a3a2a'), dress: DRESS.cap + DRESS.coat }], U, lighterGeo);
      scene.add(m.mesh);
      return { U, now: { x: 0, y: 0, z: 0, yaw: 0, walk: 0, moving: 0, c: 0, fx: 0, fy: 0, fz: 0 }, seed: R.lighterCoats() };
    });
    await rest();
    // every lamp's halo (it goes with the lamp's own state)
    for (const lp of LAMPS) GLOWS.push({ p: SP(lp.s, lp.l, lp.y + 2.9), size: 1.5, level: 1.8, seed: lp.seed, lamp: lp.roundCode, heat: 1.1 });
    // ---- the moor's stones: the land's rule has cast them about (LAND.STONES); here each is given its shape by the
    // one maker (rudeMass) and SUNK: its foot goes STONE.sunk metres under the lowest ground of its own round (read
    // at STONE.ring places round each of STONE.rings and at its middle), so no part of its foot stands on the
    // snow; the land's rule has laid a drift up its lee side and scoured a hollow to windward ------------------------
    const STONES = LAND.STONES;
    // a great one is three to six lumps; a mass of 6 m and more two to four; a lesser stone one or two (the great
    // ones' shapes and the lesser ones' are dealt by a stream each)
    const cTor = lin('#33353c'), rockMat = rockMaterial({ ...placeU, uWindFrom: { value: new THREE.Vector2(windFrom.x, windFrom.y) } }, PLACE_TXT, PLACE_KEY);
    const massGeo = () => {
      const P = [], N = [], C = [];
      return {
        add(m, x, y, z) { const p = m.p; for (let i = 0; i < p.length; i += 3) P.push(x + p[i], y + p[i + 1], z + p[i + 2]); for (const v of m.n) N.push(v); for (const v of m.c) C.push(v); },
        mesh() {
          const g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 4));
          return new THREE.Mesh(g, rockMat);
        },
      };
    };
    const footOf = (x, z, w) => {
      let low = land(x, z);
      for (const rr of STONE.rings) for (let k = 0; k < STONE.ring; k++) { const a = k / STONE.ring * 6.2832; low = Math.min(low, land(x + Math.cos(a) * w * rr, z + Math.sin(a) * w * rr)); }
      return low;
    };
    {
      const GR = massGeo();
      for (const st of STONES) {
        const great = st.great, big = great || st.h >= 6 || st.w >= 6, r = big ? R.bedGreat : R.bedLesser;
        st.y0 = footOf(st.x, st.z, st.w);
        // (a great mass is the longest single piece of this work: the page is handed back before it too)
        if (big) await rest();
        GR.add(rudeMass(r, { w: st.w, h: st.h, sink: STONE.sunk, lean: st.lean, yaw: st.yaw, lumps: great ? r.int(3, 6) : big ? r.int(2, 4) : r.int(1, 2), K: great ? 10 : big ? 8 : 6, side: cTor }), st.x, st.y0, st.z);
        await rest();
      }
      // SMALL BOULDERS ABOUT THE FOOT of every great stone: STONE.foot of them each, half a metre to a metre and a half
      // across, lying at its foot round the weather side and the flanks, sunk as it is (a stream of their own; a
      // boulder that would lie within STONE.gap metres of the line is left out)
      const rf = R.footStones, wa = Math.atan2(windFrom.y, windFrom.x);
      for (const st of STONES) {
        if (!st.great) continue;
        for (let k = 0, m = rf.int(STONE.foot[0], STONE.foot[1]); k < STONE.foot[1]; k++) {
          const a = wa + rf.range(-2.3, 2.3), d = st.w / 2 * rf.range(0.92, 1.22), w = rf.range(0.6, 1.7), h = w * rf.range(0.45, 0.75), yaw = rf.range(0, 6.2832), lean = [rf.range(-0.15, 0.15), rf.range(-0.15, 0.15)];
          const x = st.x + Math.cos(a) * d, z = st.z + Math.sin(a) * d, rock = rudeMass(rf, { w, h, sink: STONE.sunk, lean, yaw, K: 5, side: cTor, lite: true });
          if (k < m && nearRoute(x, z)[0] >= STONE.gap + w / 2) GR.add(rock, x, footOf(x, z, w), z);
        }
        await rest();
      }
      scene.add(GR.mesh());
      await rest();
      // contact shade on the ground round every stone of 3 m and more (one kit call)
      terrain.addContact(STONES.filter((st) => st.w > 3).map((st) => [st.x, st.z, st.w * 0.5]), { reach: 1.5, strength: 0.6 });
    }
    await rest();
    // ---- furze: dark bushes in clumps, each dome under a cap of lying snow, its sprays rimed to windward. By the
    // line they are more and larger: a clump for every FURZE.step metres of it, on alternate hands, bushes of
    // FURZE.big times the size, FURZE.lat metres out (stream line-furze); smaller clumps scattered over the moor
    // beyond (stream moor-furze). No spray of any bush comes within FURZE.clear metres of the line.
    {
      // one bush: a low dark dome of three masses, and standing out of it all over a bristle of stiff sprays, each a
      // thin blade; the dome's crown and the sprays' tips are rimed, the windward ones most
      const FURZE = { clear: 4, step: [12, 17], lat: [6.5, 10], big: [1.15, 1.75], reach: 1.4 };
      const r = R.furze, G = makeGeo(), ico = new THREE.IcosahedronGeometry(1, 0), ip = ico.getAttribute('position'), dark = [0.02, 0.032, 0.018], rime = [0.42, 0.48, 0.58], capC = [0.7, 0.76, 0.88], X = [0, 0, NONE, 0];
      const windK = (n) => clamp(0.45 * smoothstep(0.3, 0.95, n[1]) + 0.4 * smoothstep(0.2, 0.9, n[0] * windFrom.x + n[2] * windFrom.y), 0, 0.7);
      for (let k = 0; k < 2; k++) {
        const a = k / 2 * 6.283 + r.range(-0.3, 0.3), d = k ? r.range(0.3, 0.5) : 0, w = r.range(0.46, 0.62), h = r.range(0.3, 0.44), cy = h * 0.7 + (k ? 0 : 0.12);
        for (let i = 0; i < ip.count; i += 3) {
          const V = [0, 1, 2].map((j) => { const n = [ip.getX(i + j), ip.getY(i + j), ip.getZ(i + j)], jg = 0.8 + 0.4 * (((n[0] * 12.9 + n[1] * 78.2 + n[2] * 37.7 + k) % 1 + 1) % 1); return { n, p: [Math.cos(a) * d + n[0] * w * jg, cy + n[1] * h * jg, Math.sin(a) * d + n[2] * w * jg] }; });
          for (const v of V) G.vert(v.p, v.n, mix3(dark, rime, windK(v.n) * 0.8 * smoothstep(0.3, 0.95, v.n[1])), X);
          // the cap of lying snow: the dome's upper faces again, a little out from it and flattened
          if (V[0].n[1] + V[1].n[1] + V[2].n[1] > 1.6) for (const v of V) G.vert([Math.cos(a) * d + v.n[0] * w * 0.95, cy + h * 0.5 + v.n[1] * h * 0.62, Math.sin(a) * d + v.n[2] * w * 0.95], [v.n[0] * 0.5, 1, v.n[2] * 0.5], capC, X);
        }
      }
      for (let i = 0; i < 30; i++) {
        const a = r.range(0, 6.283), up = r.range(0.25, 1.25), dir = [Math.cos(a) * Math.cos(up), Math.sin(up), Math.sin(a) * Math.cos(up)], len = r.range(0.55, 1.0), w = r.range(0.035, 0.06), b0 = r.range(0.05, 0.4), ya = r.range(0, 6.283);
        const base = [dir[0] * b0, 0.16 + dir[1] * b0 * 0.6, dir[2] * b0], tip = [dir[0] * (b0 + len), 0.16 + dir[1] * (b0 * 0.6 + len), dir[2] * (b0 + len)], sx = Math.cos(ya) * w, sz = Math.sin(ya) * w, kt = windK(dir) * 1.1;
        const nrm = [dir[0] * 0.5, 0.85, dir[2] * 0.5];
        G.vert([base[0] - sx, base[1], base[2] - sz], nrm, dark, X); G.vert([base[0] + sx, base[1], base[2] + sz], nrm, dark, X); G.vert(tip, nrm, mix3(dark, rime, kt), X);
      }
      const at = [], _v = new THREE.Vector3(), _t = new THREE.Vector3();
      const ok = (x, z, sc) => {
        const sl = toRoad(x, z);
        if (nearRoute(x, z)[0] < FURZE.clear + FURZE.reach * sc || z > edgeZ(x) - 5 || Math.hypot(x - HUT.x, z - HUT.z) < 9 || (sl[0] < TOWN.road + 6 && Math.abs(sl[1]) < 5.2) || sl[0] < TOWN.lane + 10) return false;
        if (LAND.inSight(x, z, FURZE.reach * sc) || LAND.onTrack(x, z) < 2.4 + FURZE.reach * sc || Math.hypot(x - LAND.fold[0], z - LAND.fold[1]) < 10) return false;
        return !pools.some((q) => Math.abs(q.x - x) < q.a * 1.3 && Math.abs(q.z - z) < q.a * 1.3 && LAND.shore(q, x, z) < 1.2) && !STONES.some((st) => Math.hypot(st.x - x, st.z - z) < st.w * 0.55);
      };
      for (let c = 0, n = Math.round(54 * clamp(detail, 0.6, 1)); c < n; c++) {
        const s = r.range(S.laneOut + 30, S.cliff - 4), lat = (r.chance(0.5) ? 1 : -1) * (5 + 85 * r() ** 1.6), m = r.int(3, 8);
        path.posAtDist(s, _v); path.tangentAtDist(s, _t);
        const tl = Math.hypot(_t.x, _t.z) || 1, cx = _v.x - _t.z / tl * lat, cz = _v.z + _t.x / tl * lat;
        for (let k = 0; k < m; k++) { const a = r.range(0, 6.283), d = 3.6 * Math.sqrt(r()), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, sc = r.range(0.8, 1.3), sq = r.range(0.85, 1.05), yaw = r.range(0, 6.283), tone = r.range(0.75, 1.25); if (ok(x, z, sc)) at.push({ x, z, sc, sq, yaw, tone }); }
      }
      {
        const rl = R.lineFurze;
        let side = rl.chance(0.5) ? 1 : -1;
        for (let s = S.lastLamp + 20 + rl.range(0, 8); s < S.cliff - 6; s += rl.range(FURZE.step[0], FURZE.step[1]), side = -side) {
          const lat = side * rl.range(FURZE.lat[0], FURZE.lat[1]), m = rl.int(2, 4);
          path.posAtDist(s, _v); path.tangentAtDist(s, _t);
          const tl = Math.hypot(_t.x, _t.z) || 1, cx = _v.x - _t.z / tl * lat, cz = _v.z + _t.x / tl * lat;
          for (let k = 0; k < 4; k++) { const a = rl.range(0, 6.283), d = 2.3 * Math.sqrt(rl()), x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, sc = rl.range(FURZE.big[0], FURZE.big[1]), sq = rl.range(0.85, 1.05), yaw = rl.range(0, 6.283), tone = rl.range(0.75, 1.25); if (k < m && ok(x, z, sc) && nearRoute(x, z)[0] <= 14) at.push({ x, z, sc, sq, yaw, tone }); }
        }
      }
      const mesh = new THREE.InstancedMesh(G.toGeometry(), townMat2, at.length), m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), c = new THREE.Color();
      at.forEach((b, i) => { mesh.setMatrixAt(i, m4.compose(_v.set(b.x, terrain.surfaceAt(b.x, b.z) - 0.12 * b.sc, b.z), _q.setFromEuler(_e.set(0, b.yaw, 0)), _t.set(b.sc, b.sc * b.sq, b.sc))); mesh.setColorAt(i, c.setScalar(b.tone)); });
      mesh.frustumCulled = false;
      scene.add(mesh);
      terrain.addContact(at.filter((b) => b.sc > 1.1).map((b) => [b.x, b.z, b.sc * 1.2]), { reach: 1.4, strength: 0.4 });
    }
    await rest();
    const GK = massGeo();
    // ---- the coast: roofs of rock over the three sea caves, the two skerries, white water on the world's clock -----
    // SPRAY AT EVERY CLOCK: each cave mouth has CAVE_BURSTS bursts set evenly round one period, and the period is never
    // longer than their lives laid end to end: white water is rising, hanging or falling in every mouth always.
    // Streams: places and tilts from `coast`; each roof's and each skerry's shape (a kit call) from a stream of its
    // own; the caves', the skerries' and the headlands' surge from a stream each.
    {
      const r = R.coast, CAVE_BURSTS = 3, ROCK_BURSTS = 2, LIFE = 2.4;
      for (let ci = 0; ci < CAVES.length; ci++) {
        // a wedged mass of rock roofs the cleft from 9 to 12 m above the sea up to the headland's top: the one
        // maker's, three lumps wedged together (their undersides are the cave's roof), its reach the cleft's half
        // width and 3.4 m more
        const c = CAVES[ci], mouth = r.range(9, 12), yaw = r.range(-0.3, 0.3), tilt = r.range(-0.08, 0.08), top = CLIFF_TOP + 1.5;
        GK.add(rudeMass(R.caveRoofs[ci], { w: 2 * (c.w + 3.4), h: top - mouth + 2.4, sink: 0, lean: [tilt, 0], yaw, lumps: 3, K: 8, taper: 0.25, bury: 0, side: cTor }), c.face + c.into * 6.5, mouth - 1.2, c.z);
        const per = R.caves.range(5.4, CAVE_BURSTS * LIFE - 0.2), off = R.caves.range(0, per);
        for (let b = 0; b < CAVE_BURSTS; b++) {
          WHITE.push({ p: [c.face + c.into * 2, 1.5, c.z + (b - (CAVE_BURSTS - 1) / 2) * c.w * 0.4], dir: [-c.into, 0.5, 0], across: [0, 0, 1], speed: 17 - 1.5 * b, spread: 0.32, size: 4.4, period: per, offset: off + per * b / CAVE_BURSTS, life: LIFE,
            puffs: detail < 0.75 ? 7 : 11, stagger: 0.5 });
        }
        await rest();
      }
      SKERRIES.forEach((k, ki) => {
        // (a skerry is the one maker's too: a standing lump drawing in to a rounded head, four more leaning against
        // its foot, the foot 6 m under the sea, its reach SKERRY_R of its height)
        GK.add(rudeMass(R.skerryRock[ki], { w: 2 * k.h * SKERRY_R, h: k.h + 2, sink: 6, lean: [0.06, -0.05], yaw: 0, lumps: 5, K: 9, taper: 0.72, side: cTor }), k.x, -0.5, k.z);
        // (as the caves: a skerry's bursts share ONE dealt period and stand evenly round it, and the period is shorter
        // than their count times a burst's life, so that white water stands on it at every clock)
        const per = R.skerries.range(ROCK_BURSTS * 2.5 - 0.8, ROCK_BURSTS * 2.5 - 0.2), off = R.skerries.range(0, per);
        for (let i = 0; i < ROCK_BURSTS; i++) {
          const a = Math.atan2(windFrom.y, windFrom.x) + (i ? 0.7 : -0.5), rad = k.h * SKERRY_R;
          WHITE.push({ p: [k.x + Math.cos(a) * rad, 0.8, k.z + Math.sin(a) * rad], dir: [-Math.cos(a) * 0.35, 1, -Math.sin(a) * 0.35], speed: 12 + k.h * 0.2, spread: 0.3, size: 4, period: per, offset: off + per * i / ROCK_BURSTS, life: 2.5, puffs: 18, stagger: 0.5 });
        }
      });
      // the swell bursting on the two headlands' seaward feet
      // (the same rule: one dealt period a headland, its bursts evenly round it)
      for (const hx of [HEAD_E, HEAD_W]) {
        const per = R.heads.range(ROCK_BURSTS * 2.6 - 0.8, ROCK_BURSTS * 2.6 - 0.2), off = R.heads.range(0, per);
        for (let i = 0; i < ROCK_BURSTS; i++) {
          const x = hx + R.heads.range(-9, 9), z = edgeZ(x) + 9;
          WHITE.push({ p: [x, 0.8, z], dir: [-windFrom.x * 0.3, 1, -0.35], speed: 14, spread: 0.4, size: 4.6, period: per, offset: off + per * i / ROCK_BURSTS, life: 2.6, puffs: 18, stagger: 0.6 });
        }
      }
    }
    await rest();
    // ---- the cliffs' own rock: the whole line of the cove and of both headlands is hung with crags (layCrags: the
    // rule of their places, CRAG.clear metres or more from the line by geometry). Each is a mass by the one maker, as
    // the moor's stones are (two or three worn lumps, snow in the hollows between and on the lee shoulders, wet and
    // bare within reach of the wash), in the rock's own material; shapes from a stream of their own, after every place is fixed
    {
      const list = layCrags({ LAND, path, S, L, r: R.crags });
      await rest();
      let k = 0;
      for (const c of list) {
        GK.add(rudeMass(R.cragBeds, { w: c.hw * 2, h: c.hh * 2, sink: 0, lean: [c.lx, c.lz], yaw: c.yaw, lumps: R.cragBeds.int(2, 3), K: 6, taper: 0.35, bury: 0, side: cTor }), c.x, c.y - c.hh, c.z);
        if (++k % 2 === 0) await rest();
      }
      scene.add(GK.mesh());
    }
    await rest();
    // ---- the frozen pools, their reeds, the frosted grass -------------------------------------------------------------
    // (the ice shows the sky's own colours and the red of the west as the sky has them)
    // (what the ice mirrors: the eight stones of 6 m and more nearest the long pool, each as its place, half width and height
    // over the ice; the hut's door)
    const mirrored = STONES.filter((q) => q.h >= 6).sort((a, b) => Math.hypot(a.x - POOL.x, a.z - POOL.z) - Math.hypot(b.x - POOL.x, b.z - POOL.z)).slice(0, 8);
    const iceU = { uTime: time, uOpen: skyU.uOpen, uFireSeed: { value: SEEDS.hut }, uRed: westU.uRed, uAmb: { value: hemiC }, uMoon: { value: moonC.clone() }, uMoonDir: { value: moonDir }, uWind: { value: new THREE.Vector2(-windFrom.x, -windFrom.y) },
      uFire: { value: new THREE.Vector3(...hutAt(HUT_DOOR.a, HUT.d / 2, 1)) },
      uStones: { value: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (mirrored[i] ? new THREE.Vector4(mirrored[i].x, mirrored[i].z, mirrored[i].w * 0.5, mirrored[i].h) : new THREE.Vector4(0, 0, 0, -1))) } };
    const ice = makeIcePools(pools, LAND.shore, iceU);
    scene.add(ice.mesh);
    await rest();
    // is a place in a pool (within `e` of its ragged rim)?
    const inPool = (x, z, e) => pools.some((q) => Math.abs(q.x - x) < q.a * 1.4 && Math.abs(q.z - z) < q.a * 1.4 && LAND.shore(q, x, z) < e);
    {
      // tussocks: growth only within 40 m of the line, thickest nearest it, from the last cottage to the cliff; none on
      // the road, in a stone, in the hut's yard or out on the ice; and a fringe of them frozen into the margin of
      // every pool. Each try draws the same, whether it stands or not
      const r = R.tussocks, TU = [], _v = new THREE.Vector3(), _t = new THREE.Vector3(), N = Math.round(2850 * clamp(detail, 0.5, 1));
      for (let i = 0; i < N; i++) {
        const sT = r.range(S.lastLamp, S.cliff + 2), lat = (r.chance(0.5) ? 1 : -1) * 40 * r() ** 2.1, yaw = r.range(0, 6.283), scale = r.range(0.3, 0.7), seed = r();
        path.posAtDist(sT, _v); path.tangentAtDist(sT, _t);
        const tl = Math.hypot(_t.x, _t.z) || 1, x = _v.x - _t.z / tl * lat, z = _v.z + _t.x / tl * lat, sl = toRoad(x, z);
        if (sl[0] < LAST_COT.s1 + 1.5 || (sl[0] < TOWN.road && Math.abs(sl[1]) < WALLS.l + 0.5) || Math.hypot(x - HUT.x, z - HUT.z) < 9 || z > edgeZ(x) - 2 || inPool(x, z, 0.86)) continue;
        if (STONES.some((st) => Math.abs(st.x - x) < st.w * 0.5 && Math.hypot(st.x - x, st.z - z) < st.w * 0.5)) continue;
        TU.push({ p: [x, terrain.surfaceAt(x, z) - 0.03, z], yaw, scale, seed });
        if (i % 700 === 699) await rest();
      }
      for (const q of pools) {
        if (q.rut) continue;
        for (let k = 0, n = Math.round((q.a + q.b) * 1.5); k < n; k++) {
          const a = r.range(0, 6.283), e = r.range(0.84, 0.99), yaw = r.range(0, 6.283), scale = r.range(0.35, 0.7), seed = r(), ex = Math.cos(a) * q.a * e, ez = Math.sin(a) * q.b * e, x = q.x + ex * q.c - ez * q.sn, z = q.z + ex * q.sn + ez * q.c, sh = LAND.shore(q, x, z);
          if (sh < 0.8 || sh > 1.02 || nearRoute(x, z)[0] < 1.5) continue;
          TU.push({ p: [x, q.y - 0.02, z], yaw, scale, seed });
        }
      }
      // RUSHES stand frozen into the long pool's margin: RUSH.clumps clumps, one to each equal share of its rim, each
      // RUSH.stems stems within RUSH.spread metres, two to three times a tussock's height; none within RUSH.clear
      // metres of the line in plan. (stream pool-rushes; every value of a stem is drawn before its test)
      {
        const rr = R.rushes, RUSH = { clumps: [9, 12], stems: [6, 9], spread: 1.3, scale: [1.0, 1.6], clear: 3 }, q = LAND.mainPool, nc = rr.int(RUSH.clumps[0], RUSH.clumps[1]);
        for (let k = 0; k < nc; k++) {
          const a = (k + rr.range(0.1, 0.9)) / nc * 6.2832, e = rr.range(0.9, 0.98), ns = rr.int(RUSH.stems[0], RUSH.stems[1]), ex = Math.cos(a) * q.a * e, ez = Math.sin(a) * q.b * e, cx = q.x + ex * q.c - ez * q.sn, cz = q.z + ex * q.sn + ez * q.c;
          for (let j = 0; j < ns; j++) {
            const x = cx + rr.range(-RUSH.spread, RUSH.spread), z = cz + rr.range(-RUSH.spread, RUSH.spread), yaw = rr.range(0, 6.283), scale = rr.range(RUSH.scale[0], RUSH.scale[1]), seed = rr(), sh = LAND.shore(q, x, z);
            if (sh < 0.8 || sh > 1.02 || nearRoute(x, z)[0] < RUSH.clear) continue;
            TU.push({ p: [x, q.y - 0.02, z], yaw, scale, seed });
          }
        }
      }
      const tussocks = makeTussocks(TU, { uTime: time, uWind: { value: new THREE.Vector2(-windFrom.x, -windFrom.y) }, uAmb: { value: hemiC }, ...placeU }, PLACE_TXT);
      scene.add(tussocks.mesh);
    }
    await rest();
    // ---- the hut: low and long, walls of rough stones in earth that lean a little inward, a frosted roof of turf, a
    // squat chimney over the hearth. In its lit wall one small deep-set window and a door that STANDS open: both look
    // into one fire-lit room (see makeWindows) and glow at one strength. All in the hut's own frame (hutAt).
    const GH = makeGeo(), BEASTS = [];
    {
      const r = R.hut, N = [HUT.N[0], 0, HUT.N[1]], U = [HUT.U[0], 0, HUT.U[1]], H = hutAt, ROUGH = [5, 0, NONE, 0], ha = HUT.w / 2, hb = HUT.d / 2, EV = HUT.eaves, IN = 0.45;
      const stone = lin('#5b554d'), dark = lin('#2c2620'), lk = (y) => 0.24 * (1 - clamp(y / EV, 0, 1));
      const Q = (a, y, sb = 1) => H(a, sb * (hb + lk(y)), y);
      // a panel of a long wall between two places along it and two heights
      const panel = (a0, a1, y0, y1, sb = 1) => face(GH, [Q(a0, y0, sb), Q(a1, y0, sb), Q(a1, y1, sb), Q(a0, y1, sb)], sb > 0 ? N : neg(N), mul(stone, r.range(0.9, 1.1)), ROUGH);
      const w0 = HUT_WIN.a - HUT_WIN.w / 2, w1 = HUT_WIN.a + HUT_WIN.w / 2, wy0 = HUT_WIN.y - HUT_WIN.h / 2, wy1 = HUT_WIN.y + HUT_WIN.h / 2, d0 = HUT_DOOR.a - HUT_DOOR.w / 2, d1 = HUT_DOOR.a + HUT_DOOR.w / 2, dh = HUT_DOOR.h;
      panel(-ha, w0, -0.5, EV); panel(w0, w1, -0.5, wy0); panel(w0, w1, wy1, EV); panel(w1, d0, -0.5, EV); panel(d0, d1, dh, EV); panel(d0, d1, -0.5, 0); panel(d1, ha, -0.5, EV);
      panel(-ha, ha, -0.5, EV, -1);
      for (const [a, o2] of [[-ha, neg(U)], [ha, U]]) {
        face(GH, [Q(a, -0.5, -1), Q(a, -0.5, 1), Q(a, EV, 1), Q(a, EV, -1)], o2, stone, ROUGH);
        triOut(GH, Q(a, EV, -1), Q(a, EV, 1), H(a, 0, HUT.ridge), o2, stone, ROUGH);
      }
      // the openings' cheeks, sill and head, through the thick wall: the fire's light grows on them toward the room
      const reveal = (a0, a1, y0, y1, sill) => {
        const out = (a, y) => Q(a, y), inn = (a, y) => H(a, hb - IN, y), lit = [5, 0.55, NONE, SEEDS.hut], cold = [5, 0.04, NONE, SEEDS.hut], c = mul(stone, 0.9);
        for (const [A, B] of [[[a0, y0], [a0, y1]], [[a1, y1], [a1, y0]], [[a0, y1], [a1, y1]], ...(sill ? [[[a1, y0], [a0, y0]]] : [])]) {
          const P = [out(A[0], A[1]), out(B[0], B[1]), inn(B[0], B[1]), inn(A[0], A[1])], mid = H((a0 + a1) / 2, hb, (y0 + y1) / 2);
          const nrm = [mid[0] - (P[0][0] + P[1][0]) / 2, mid[1] - (P[0][1] + P[1][1]) / 2, mid[2] - (P[0][2] + P[1][2]) / 2];
          const ux = P[1][0] - P[0][0], uy = P[1][1] - P[0][1], uz = P[1][2] - P[0][2], vx = P[2][0] - P[0][0], vy = P[2][1] - P[0][1], vz = P[2][2] - P[0][2];
          const fl = (uy * vz - uz * vy) * nrm[0] + (uz * vx - ux * vz) * nrm[1] + (ux * vy - uy * vx) * nrm[2] < 0;
          GH.quad4(fl ? [P[3], P[2], P[1], P[0]] : P, [c, c, c, c], fl ? [lit, lit, cold, cold] : [cold, cold, lit, lit]);
        }
      };
      reveal(w0, w1, wy0, wy1, true); reveal(d0, d1, 0, dh, false);
      face(GH, [Q(w0 - 0.1, wy0), Q(w1 + 0.1, wy0), H(w1 + 0.1, hb - IN, wy0 + 0.02), H(w0 - 0.1, hb - IN, wy0 + 0.02)], UP, cSnow, SNOW);
      pane(H(HUT_WIN.a, hb - IN, HUT_WIN.y), N, HUT_WIN.w + 0.06, HUT_WIN.h + 0.06, K.HUT, HUT_WIN.a, 1.3);
      MARKS.door = H(HUT_DOOR.a, hb - IN, dh / 2);
      pane(MARKS.door, N, HUT_DOOR.w + 0.06, dh, K.HUTDOOR, HUT_DOOR.a, 1.3);
      // the door's leaf of planks, swung out and back against the wall on the side away from the line's approach
      const lf = [H(d1 + 0.04, hb + 0.3, 0.02), H(d1 + 0.42, hb + 1.32, 0.02), H(d1 + 0.42, hb + 1.32, dh - 0.05), H(d1 + 0.04, hb + 0.3, dh - 0.05)];
      face(GH, lf, neg(U), lin('#4a3a2a'), [0, 0.22, NONE, SEEDS.hut]); face(GH, lf, U, lin('#2a2018'), PLAIN);
      // the roof: thick turf, frosted white, sagging a little, a dark fringe at the eaves and the verges
      const turf = lin('#2f3020'), frost = lin('#b4bdcd'), RUB = [4, 0, NONE, 0];
      for (const sgn of [1, -1]) {
        const NA = 10, NB = 4, at = (i, j) => H(lerp(-ha - 0.4, ha + 0.4, i / NA), sgn * lerp(hb + 0.5, 0, j / NB), lerp(EV - 0.2, HUT.ridge + 0.1, j / NB) - 0.22 * Math.sin(Math.PI * i / NA) * (j / NB) + 0.09 * noise.n2(i * 1.7 + sgn * 9, j * 2.3));
        const ct = (i, j) => mix3(turf, frost, clamp(0.62 + 0.45 * noise.n2(i * 0.9 + sgn * 5, j * 1.4 + 3) + (j === NB ? 0.3 : 0), 0.15, 0.97));
        for (let j = 0; j < NB; j++) for (let i = 0; i < NA; i++) {
          const P = [at(i, j), at(i + 1, j), at(i + 1, j + 1), at(i, j + 1)], C = [ct(i, j), ct(i + 1, j), ct(i + 1, j + 1), ct(i, j + 1)];
          if (sgn < 0) GH.quad4(P, C, [RUB, RUB, RUB, RUB]); else GH.quad4([P[3], P[2], P[1], P[0]], [C[3], C[2], C[1], C[0]], [RUB, RUB, RUB, RUB]);
        }
        for (let i = 0; i < NA; i++) {
          const A = at(i, 0), B = at(i + 1, 0), A2 = [A[0], A[1] - 0.3, A[2]], B2 = [B[0], B[1] - 0.3, B[2]];
          face(GH, [A2, B2, B, A], [N[0] * sgn, 0, N[2] * sgn], dark, RUB);
          face(GH, [A2, B2, Q(lerp(-ha - 0.4, ha + 0.4, (i + 1) / NA), EV - 0.25, sgn), Q(lerp(-ha - 0.4, ha + 0.4, i / NA), EV - 0.25, sgn)], DOWN, dark, PLAIN);
        }
        for (const i of [0, NA]) for (let j = 0; j < NB; j++) { const A = at(i, j), B = at(i, j + 1); face(GH, [[A[0], A[1] - 0.3, A[2]], [B[0], B[1] - 0.3, B[2]], B, A], i ? U : neg(U), dark, RUB); }
      }
      // the squat chimney over the hearth, on the back slope by the ridge; its smoke torn flat, lit from below
      const ca = HUT_FIRE_A, cb = -hb * 0.45, cy0 = EV + 0.4, cy1 = HUT.ridge + 0.6, cq = (da, db, y) => H(ca + da * 0.62, cb + db * 0.5, y);
      for (const [A, B, o2] of [[[-1, 1], [1, 1], N], [[1, -1], [-1, -1], neg(N)], [[-1, -1], [-1, 1], neg(U)], [[1, 1], [1, -1], U]]) face(GH, [cq(A[0], A[1], cy0), cq(B[0], B[1], cy0), cq(B[0] * 0.86, B[1] * 0.86, cy1), cq(A[0] * 0.86, A[1] * 0.86, cy1)], o2, mul(stone, 0.9), ROUGH);
      face(GH, [cq(-0.86, -0.86, cy1), cq(0.86, -0.86, cy1), cq(0.86, 0.86, cy1), cq(-0.86, 0.86, cy1)], UP, [1, 1, 1], [0, 0.5, NONE, SEEDS.hut]);
      SMOKE.push({ p: H(ca, cb, cy1 + 0.25), dir: [-windFrom.x, 0.2, -windFrom.y], speed: 4.4, spread: 0.18, size: 1.7, period: 3.0, life: 3.4, puffs: 16, stagger: 4 });
      GLOWS.push({ p: H(ca, cb, cy1 + 0.5), size: 2.4, level: 0.55, seed: SEEDS.hut, heat: 0.5 });
      // the fire's halo in the air before each opening, at one strength
      GLOWS.push({ p: H(HUT_WIN.a, hb + 0.25, HUT_WIN.y), size: 2.2, level: 1.3, seed: SEEDS.hut, heat: 1 }, { p: H(HUT_DOOR.a, hb + 0.25, dh * 0.55), size: 3.0, level: 1.3, seed: SEEDS.hut, heat: 1 });
      // snow banked at the wall's foot (not before the door), deepest at the weather end
      const bank = (a0, a1, b0, hgt, sb = 1) => face(GH, [H(a0, sb * (b0 + 0.05), hgt), H(a1, sb * (b0 + 0.05), hgt), H(a1, sb * (b0 + 0.3 + hgt * 2.2), -0.02), H(a0, sb * (b0 + 0.3 + hgt * 2.2), -0.02)], [N[0] * sb, 1.5, N[2] * sb], cSnow, SNOW);
      bank(-ha - 0.3, w0 + 1.4, hb + 0.2, 0.5); bank(w0 + 1.4, d0 - 0.25, hb + 0.2, 0.32); bank(d1 + 1.6, ha + 0.3, hb + 0.2, 0.3); bank(-ha - 0.3, ha + 0.3, hb + 0.2, 0.55, -1);
      face(GH, [H(-ha - 0.05, -hb - 0.4, 0.75), H(-ha - 0.05, hb + 0.4, 0.75), H(-ha - 1.9, hb + 0.6, -0.02), H(-ha - 1.9, -hb - 0.6, -0.02)], [-U[0], 1.5, -U[2]], cSnow, SNOW);
    }
    {
      // the miners' things, by the wall beyond the door on the side away from the line's approach, lit by the fire
      // and standing before neither light: two picks and two or three long shovels leaning, a wooden barrow; off the
      // far end a heap of broken stone, snow on its weather side; a low yard wall of the same stone; by the wall
      // between window and door a small dog lies curled (see the beasts)
      const r = R.hutThings, H = hutAt, hb = HUT.d / 2, ha = HUT.w / 2, wood = lin('#5a4630'), iron = lin('#23252a'), stone = lin('#5b554d'), ROUGH = [5, 0, NONE, 0];
      const d1 = HUT_DOOR.a + HUT_DOOR.w / 2, nShovel = r.int(2, 3);
      for (let k = 0; k < 2 + nShovel; k++) {
        const a = d1 + 1.0 + k * 0.42 + r.range(-0.08, 0.08), len = r.range(1.25, 1.5), foot = H(a + r.range(-0.15, 0.15), hb + 0.3 + len * 0.36, 0.02), top = H(a, hb + 0.2, len * 0.93);
        GH.tube(foot, top, 0.022, 0.02, 5, mul(wood, r.range(0.85, 1.1)), PLAIN);
        if (k < 2) { const t0 = H(a - 0.34, hb + 0.24, len * 0.86), t1 = H(a + 0.34, hb + 0.24, len * 0.86); GH.tube(t0, top, 0.012, 0.03, 5, iron, PLAIN); GH.tube(top, t1, 0.03, 0.012, 5, iron, PLAIN); }
        else { const bl = [H(a - 0.11, hb + 0.3 + len * 0.36, 0.0), H(a + 0.11, hb + 0.3 + len * 0.36, 0.0), H(a + 0.1, hb + 0.3 + len * 0.27, 0.3), H(a - 0.1, hb + 0.3 + len * 0.27, 0.3)]; face(GH, bl, [HUT.N[0], 0.3, HUT.N[1]], iron, PLAIN); face(GH, bl, [-HUT.N[0], -0.3, -HUT.N[1]], iron, PLAIN); }
      }
      // the barrow: a tray of planks on one wheel, its two shafts down on the snow, snow lying in it
      {
        const ba = d1 + 3.3 + r.range(-0.2, 0.2), bb = hb + 1.7 + r.range(-0.2, 0.3), yaw = r.range(-0.5, 0.5), c = Math.cos(yaw), sn = Math.sin(yaw), B = (x, y, z) => H(ba + x * c - z * sn, bb + x * sn + z * c, y);
        const tray = [[-0.5, -0.32], [0.45, -0.3], [0.45, 0.3], [-0.5, 0.32]];
        for (let i = 0; i < 4; i++) { const p = tray[i], q = tray[(i + 1) % 4]; face(GH, [B(p[0] * 0.8, 0.38, p[1] * 0.8), B(q[0] * 0.8, 0.38, q[1] * 0.8), B(q[0], 0.72, q[1]), B(p[0], 0.72, p[1])], [0, -1, 0], wood, PLAIN); face(GH, [B(p[0] * 0.8, 0.38, p[1] * 0.8), B(q[0] * 0.8, 0.38, q[1] * 0.8), B(q[0], 0.72, q[1]), B(p[0], 0.72, p[1])], [0, 1, 0], mul(wood, 0.7), PLAIN); }
        face(GH, tray.map((p) => B(p[0] * 0.93, 0.62, p[1] * 0.93)), UP, cSnow, SNOW);
        GH.tube(B(0.62, 0.3, -0.05), B(0.62, 0.3, 0.05), 0.3, 0.3, 10, mul(wood, 0.8), PLAIN);
        for (const z of [-0.26, 0.26]) { GH.tube(B(0.62, 0.3, z * 0.4), B(-1.35, 0.12, z * 1.3), 0.03, 0.025, 5, wood, PLAIN); GH.tube(B(-0.35, 0.4, z), B(-0.42, 0.0, z * 1.1), 0.028, 0.028, 5, wood, PLAIN); }
      }
      // the heap of broken stone, about 1.2 m high and 3 m across: a low mound and angular pieces lying on it
      {
        const hx = ha + 2.4, hz = 0.6, top = 1.15;
        GH.lathe(H(hx, hz, 0)[0], H(hx, hz, 0)[2], [[1.6, HUT_Y - 0.1], [1.15, HUT_Y + 0.5], [0.5, HUT_Y + 0.95], [0.0, HUT_Y + top]], 9, () => mul(stone, 0.55), () => ROUGH);
        for (let k = 0; k < 46; k++) {
          const a = r.range(0, 6.283), rad = 1.55 * Math.sqrt(r()), y = top * (1 - rad / 1.6) ** 0.8, sz = r.range(0.12, 0.3), p = H(hx + Math.cos(a) * rad, hz + Math.sin(a) * rad, y), north = Math.cos(a) * HUT.U[1] * -1 + 0 > 0.2;
          GH.box(p[0], p[1] - sz * 0.5, p[2], sz, p[1] + sz * r.range(0.3, 0.7), sz * r.range(0.6, 1), mul(stone, r.range(0.5, 1.0)), { yaw: r.range(0, 3.14), aux: PLAIN, top: Math.sin(a) * HUT.U[1] + Math.cos(a) * HUT.U[0] < -0.1 || Math.cos(a) < -0.3 ? cSnow : undefined, auxTop: SNOW });
        }
      }
      // THE SHAFT AND ITS HAND WINDLASS, in the yard beyond the heap: a square collar of four baulks about a black
      // mouth; two stows (each a pair of legs set astride the collar) carrying a barrel with a crank at each end, a
      // few turns of rope on it and a rope down to a kibble that hangs in the mouth; on one stow's head a short crook
      // with a LANTERN hung from it, burning: its glow, and its light lying on the snow about the collar.
      // (stream hut-windlass: its turn, where its cranks stand, the lantern's flicker)
      {
        const rw = R.windlass, WL = { a: ha + 5.3, b: hb + 1.5, half: 0.8, head: 1.25, span: 0.95 }, yaw = rw.range(-0.35, 0.35), crank = rw.range(0, 6.283), seed = rw(), c = Math.cos(yaw), sn = Math.sin(yaw);
        const B = (x, y, z) => H(WL.a + x * c - z * sn, WL.b + x * sn + z * c, y), rope = lin('#8a7a5c');
        face(GH, [B(-WL.half, 0.07, -WL.half), B(WL.half, 0.07, -WL.half), B(WL.half, 0.07, WL.half), B(-WL.half, 0.07, WL.half)], UP, [0.004, 0.004, 0.005], PLAIN);
        for (const [x0, z0, x1, z1] of [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]]) {
          GH.tube(B(x0 * WL.half * 1.12, 0.14, z0 * WL.half), B(x1 * WL.half * 1.12, 0.14, z1 * WL.half), 0.11, 0.11, 5, mul(wood, rw.range(0.7, 1)), PLAIN);
          GH.tube(B(x0 * WL.half * 1.1, 0.26, z0 * WL.half), B(x1 * WL.half * 1.1, 0.26, z1 * WL.half), 0.06, 0.06, 4, cSnow, SNOW);
        }
        for (const e of [-1, 1]) {
          for (const z of [-0.45, 0.45]) GH.tube(B(e * WL.span, 0, z), B(e * WL.span, WL.head + 0.06, 0), 0.06, 0.05, 5, wood, PLAIN);
          // the crank: a crook out from the barrel's end and a handle along
          const ca = crank + (e > 0 ? 1.57 : 0), hy = WL.head + Math.sin(ca) * 0.3, hz = Math.cos(ca) * 0.3;
          GH.tube(B(e * (WL.span + 0.12), WL.head, 0), B(e * (WL.span + 0.12), hy, hz), 0.02, 0.02, 4, iron, PLAIN);
          GH.tube(B(e * (WL.span + 0.12), hy, hz), B(e * (WL.span + 0.42), hy, hz), 0.022, 0.022, 4, iron, PLAIN);
        }
        GH.tube(B(-WL.span - 0.12, WL.head, 0), B(WL.span + 0.12, WL.head, 0), 0.1, 0.1, 7, mul(wood, 0.85), PLAIN);
        GH.tube(B(-0.26, WL.head, 0), B(0.26, WL.head, 0), 0.135, 0.135, 7, rope, PLAIN);
        GH.tube(B(0.05, WL.head - 0.12, 0), B(0.05, 0.62, 0), 0.016, 0.016, 3, rope, PLAIN);
        GH.tube(B(0.05, 0.22, 0), B(0.05, 0.56, 0), 0.19, 0.24, 8, mul(wood, 0.8), PLAIN);
        GH.tube(B(-0.17, 0.56, 0), B(0.05, 0.66, 0), 0.012, 0.012, 3, iron, PLAIN); GH.tube(B(0.27, 0.56, 0), B(0.05, 0.66, 0), 0.012, 0.012, 3, iron, PLAIN);
        // the lantern: on a crook from the head of the stow nearer the hut
        const head = B(-WL.span, WL.head + 0.06, 0), up = B(-WL.span, WL.head + 0.62, 0), crook = B(-WL.span, WL.head + 0.58, 0.42), lp = [crook[0], crook[1] - 0.14, crook[2]];
        GH.tube(head, up, 0.045, 0.04, 4, wood, PLAIN); GH.tube(up, crook, 0.03, 0.025, 4, wood, PLAIN); GH.tube(crook, lp, 0.01, 0.01, 3, iron, PLAIN);
        GH.box(lp[0], lp[1] - 0.22, lp[2], 0.085, lp[1], 0.085, [1, 1, 1], { aux: [0, 3.4, NONE, seed] });
        GLOWS.push({ p: [lp[0], lp[1] - 0.11, lp[2]], size: 1.5, level: 1.6, seed, heat: 1.05 });
        const gp = B(-0.3, 0.1, 0.3);
        POOLS_OF_LIGHT.push({ p: gp, u: [3.4, 0, 0], v: [0, 0, 3.4], level: 0.9, seed, yAt: (x, z) => terrain.surfaceAt(x, z) });
      }
      // the yard wall: out from the lit wall's far corner, then along; rough stones, snow on its top
      const yw = (a0, b0, a1, b1) => {
        const n = Math.max(1, Math.round(Math.hypot(a1 - a0, b1 - b0) / 1.6));
        for (let i = 0; i < n; i++) {
          const pa = H(lerp(a0, a1, i / n), lerp(b0, b1, i / n), 0), pb = H(lerp(a0, a1, (i + 1) / n), lerp(b0, b1, (i + 1) / n), 0), hgt = r.range(0.85, 1.1), cx = (pa[0] + pb[0]) / 2, cz = (pa[2] + pb[2]) / 2;
          GH.box(cx, HUT_Y - 0.4, cz, Math.hypot(pb[0] - pa[0], pb[2] - pa[2]) / 2 + 0.06, HUT_Y + hgt, 0.3, mul(stone, r.range(0.85, 1.1)), { yaw: Math.atan2(-(pb[2] - pa[2]), pb[0] - pa[0]), aux: ROUGH, top: cSnow, auxTop: SNOW });
        }
      };
      yw(ha, hb + 0.3, ha + 0.4, hb + HUT_YARD); yw(ha + 0.4, hb + HUT_YARD, ha + 0.4 + HUT_YARD * 1.5, hb + HUT_YARD - 0.6);
      BEASTS.push({ p: H(0.35, hb + 0.75, 0), yaw: Math.atan2(HUT.U[0], HUT.U[1]), kind: 1, scale: 0.62, seed: r() });
    }
    {
      // the sheep: thirteen to seventeen lying in the lee of the road's south wall (the wind is northerly), dealt one
      // to each equal share of the wall between two places of it, 0.8 to 3 m out from its foot; four or five more in
      // the lee of the fold's north wall. Where each lies is dealt once; when each gets up is its own clock's matter
      const r = R.beasts, n = r.int(13, 17), m = r.int(4, 5);
      // (no beast lies in the line's way: one whose place is within SHEEP_CLEAR metres of the line in plan, as where the
      // line goes out over the gate, is left out; its values are drawn before the test)
      const SHEEP_CLEAR = 6;
      const lie = (s, l) => { const p = SPW(s, l, 0), yaw = r.range(0, 6.283), scale = r.range(1.0, 1.25), seed = r(); if (nearRoute(p[0], p[2])[0] >= SHEEP_CLEAR) BEASTS.push({ p: [p[0], terrain.surfaceAt(p[0], p[2]) - 0.02, p[2]], yaw, kind: 0, scale, seed }); };
      for (let k = 0; k < n; k++) lie(lerp(WALLS.sheep[0], WALLS.sheep[1], (k + r.range(0.15, 0.85)) / n), -WALLS.l - r.range(0.8, 3.0));
      for (let k = 0; k < m; k++) lie(FOLD.s + lerp(-FOLD.w / 2 + 1.2, FOLD.w / 2 - 1.2, (k + r.range(0.2, 0.8)) / m), FOLD.l + FOLD.d / 2 - r.range(1.0, 2.6));
      const beasts = makeBeasts(BEASTS, { uTime: time, uAmb: { value: hemiC }, ...placeU }, PLACE_TXT);
      scene.add(beasts.mesh);
    }
    {
      // the cart track (the land's rule lays it: LAND.TRACK): two wheel tracks 1.5 m apart PRESSED INTO THE SNOW,
      // unbroken from the gate in the road's south wall to the hut's door. Each is a shallow trough: its floor the
      // ground's own tone trodden a little darker (crisp snow where snow lies, frozen mud where the wind has scoured
      // the earth: the moor's own rule, read here from the land's slope and the swell without its grain), its wall
      // on the moon's side in shade. Where the track's own noise runs high the trough holds a FROZEN PUDDLE for a
      // few metres: dark ice with a thread of frost along each side. (RUT: half the gauge; half a trough's width;
      // the shaded wall's width; the frost's; the noise over which a puddle lies)
      const RUT = { half: 0.75, floor: 0.13, edge: 0.09, frost: 0.04, puddle: 0.42 };
      const GT = makeGeo(), T2 = LAND.TRACK, ice = lin('#1c2636'), frost = lin('#c9d3e6'), mud = [0.075, 0.066, 0.06], n = T2.length / 2, W3 = swellWaves(windFrom.x, windFrom.y);
      const bareAt = (i) => {
        const x = T2[i * 2], z = T2[i * 2 + 1], e = 1.5, gx = (terrain.surfaceAt(x + e, z) - terrain.surfaceAt(x - e, z)) / (2 * e), gz = (terrain.surfaceAt(x, z + e) - terrain.surfaceAt(x, z - e)) / (2 * e);
        let sw = 0; for (const k of W3) sw += k[2] * Math.sin(x * k[0] + z * k[1]);
        return smoothstep(0.1, 0.7, -(gx * windFrom.x + gz * windFrom.y) * TONES.lean + sw * TONES.crest / SWELL.h) * smoothstep(TOWN.lamp, OFF_ROAD, toStreet(x, z)[0]);
      };
      // a place of the track: lat metres to the left of its i-th point; and which hand of it the moon stands on
      const dirAt = (i) => { const i0 = Math.max(0, i - 1), i1 = Math.min(n - 1, i + 1), dx = T2[i1 * 2] - T2[i0 * 2], dz = T2[i1 * 2 + 1] - T2[i0 * 2 + 1], l = Math.hypot(dx, dz) || 1; return [dx / l, dz / l]; };
      const at = (i, lat) => { const [dx, dz] = dirAt(i), x = T2[i * 2] - dz * lat, z = T2[i * 2 + 1] + dx * lat; return [x, terrain.surfaceAt(x, z) + 0.05, z]; };
      for (let i = 0; i < n - 1; i++) {
        const [dx, dz] = dirAt(i), moonHand = -dz * moonDir.x + dx * moonDir.z > 0 ? 1 : -1, bare = bareAt(i), floorC = mix3(mul(cSnow, 0.74), mud, bare), shadeC = mix3(mul(cSnow, 0.4), mul(mud, 0.6), bare), aux = bare > 0.5 ? PLAIN : SNOW;
        for (const side of [-RUT.half, RUT.half]) {
          // (each track wanders a little about its own line)
          const w0 = side + 0.16 * noise.n2(i * 0.21, side * 3), w1 = side + 0.16 * noise.n2((i + 1) * 0.21, side * 3), puddle = noise.n2(i * 0.33 + 40, side * 7) > RUT.puddle;
          const strip = (d0, d1, c, ax) => face(GT, [at(i, w0 + d0), at(i, w0 + d1), at(i + 1, w1 + d1), at(i + 1, w1 + d0)], UP, c, ax);
          strip(-RUT.floor, RUT.floor, puddle ? ice : floorC, puddle ? PLAIN : aux);
          strip(moonHand > 0 ? RUT.floor : -RUT.floor - RUT.edge, moonHand > 0 ? RUT.floor + RUT.edge : -RUT.floor, shadeC, aux);
          if (puddle) for (const e of [-1, 1]) strip(e * (RUT.floor - RUT.frost), e * RUT.floor, frost, SNOW);
        }
        if (i % 40 === 39) await rest();
      }
      const over = townMaterial(townU, { place: PLACE_TXT, placeKey: PLACE_KEY });
      over.polygonOffset = true; over.polygonOffsetFactor = -2; over.polygonOffsetUnits = -2;
      scene.add(new THREE.Mesh(GT.toGeometry(), over));
    }
    scene.add(new THREE.Mesh(GH.toGeometry(), townMat));
    await rest();
    // ---- the ship: a black hull heading west, three masts, reefed canvas, four lanterns ------------------------------
    // her own frame: x forward (toward the bow), y up from the sea, z to starboard (north). The wind is northerly: it
    // comes over her starboard beam, so her yards are braced with their weather ends forward, every sail bellies to
    // port, and she heels to port: toward the line, which passes down her lee side with her deck shown to it
    const ship = new THREE.Group();
    const SHIP_LEN = SHIP.stern - SHIP.bow, HALF = SHIP_LEN / 2;
    ship.position.set((SHIP.stern + SHIP.bow) / 2, 0, SHIP.z); ship.rotation.order = 'YZX'; ship.rotation.y = Math.PI;
    scene.add(ship);
    const GS = makeGeo(), SAILS = [], CREW = [], SHIPGLOWS = [], SHIP_LAMPS = [];
    // where her three lanterns are in the world at this moment (set each frame as she rides), and their level: they
    // light her deck, her spars and her sails, each a pool round its lantern
    const shipLampU = { value: [0, 1, 2].map(() => new THREE.Vector4(0, -1e4, 0, 0)) };
    const deckAt = (t) => 4.0 + 1.5 * (2 * t - 1) ** 2 + (t < 0.26 ? 1.2 : 0) + (t > 0.84 ? 0.8 : 0);
    const beamAt = (t) => lerp(3.3, SHIP.beam / 2, smoothstep(0, 0.28, t)) * (1 - Math.pow(smoothstep(0.5, 1, t), 2.4)) + 0.12;
    const lxAt = (t) => -HALF + SHIP_LEN * t, tAt = (lx) => (lx + HALF) / SHIP_LEN;
    const MASTS = [{ x: 11, top: 37, name: 'fore' }, { x: 0, top: SHIP.mast, name: 'main' }, { x: -12, top: 33, name: 'mizzen' }];
    const BRACE = 0.42, yardDir = [Math.sin(BRACE), 0, Math.cos(BRACE)], sailN = [Math.cos(BRACE), 0, -Math.sin(BRACE)], HEEL = 0.12;
    {
      const NS = 22, black = lin('#17181d'), band = lin('#8a8270'), deckC = lin('#7a6a52'), wood = lin('#4a3a28'), spar = lin('#6a553a');
      const prof = (t) => { const d = deckAt(t); return [[-2.6, 0.04], [-1.2, 0.56], [0.6, 0.93], [2.5, 1.0], [d - 0.35, 0.975], [d + 0.2, 0.965], [d + 1.0, 0.94]]; };
      const cols = [black, black, black, black, band, black];
      for (let i = 0; i < NS; i++) {
        const t0 = i / NS, t1 = (i + 1) / NS, p0 = prof(t0), p1 = prof(t1), b0 = beamAt(t0), b1 = beamAt(t1), x0 = lxAt(t0), x1 = lxAt(t1);
        for (const sg of [1, -1]) {
          for (let k = 0; k < 6; k++) {
            face(GS, [[x0, p0[k][0], sg * b0 * p0[k][1]], [x1, p1[k][0], sg * b1 * p1[k][1]], [x1, p1[k + 1][0], sg * b1 * p1[k + 1][1]], [x0, p0[k + 1][0], sg * b0 * p0[k + 1][1]]], [0, k === 0 ? -1 : 0.1, sg], cols[k], PLAIN);
          }
          face(GS, [[x0, p0[6][0], sg * b0 * 0.92], [x1, p1[6][0], sg * b1 * 0.92], [x1, deckAt(t1), sg * b1 * 0.92], [x0, deckAt(t0), sg * b0 * 0.92]], [0, 0, -sg], wood, PLAIN);
          face(GS, [[x0, p0[6][0], sg * b0 * 0.94], [x1, p1[6][0], sg * b1 * 0.94], [x1, p1[6][0], sg * b1 * 0.92], [x0, p0[6][0], sg * b0 * 0.92]], UP, wood, PLAIN);
        }
        face(GS, [[x0, deckAt(t0), -b0 * 0.92], [x1, deckAt(t1), -b1 * 0.92], [x1, deckAt(t1), b1 * 0.92], [x0, deckAt(t0), b0 * 0.92]], UP, deckC, PLAIN);
      }
      // the flat stern (no name on it)
      const ps = prof(0), bs = beamAt(0);
      for (let k = 0; k < 6; k++) face(GS, [[-HALF, ps[k][0], -bs * ps[k][1]], [-HALF, ps[k][0], bs * ps[k][1]], [-HALF, ps[k + 1][0], bs * ps[k + 1][1]], [-HALF, ps[k + 1][0], -bs * ps[k + 1][1]]], [-1, 0, 0], cols[k], PLAIN);
      // masts in two lengths with a top between, yards braced to the wind, the bowsprit and its boom, gaff and boom aft
      for (const m of MASTS) {
        const d = deckAt(tAt(m.x)), mid = lerp(d, m.top, 0.5);
        GS.tube([m.x, d - 0.5, 0], [m.x, mid + 1.5, 0], 0.42, 0.32, 8, spar, PLAIN);
        GS.tube([m.x - 0.35, mid, 0], [m.x - 0.35, m.top, 0], 0.26, 0.12, 6, spar, PLAIN);
        GS.box(m.x - 0.2, mid - 0.1, 0, 0.95, mid + 0.08, 1.3, wood, { aux: PLAIN });
        m.mid = mid; m.deck = d;
      }
      const yard = (x, y, w, r) => GS.tube([x + yardDir[0] * w / 2, y, yardDir[2] * w / 2], [x - yardDir[0] * w / 2, y, -yardDir[2] * w / 2], r, r, 6, spar, PLAIN);
      for (const m of MASTS) {
        const k = m.name === 'mizzen' ? 0.72 : m.name === 'fore' ? 0.94 : 1;
        m.yards = [{ y: m.mid - 3.2, w: 17 * k }, { y: lerp(m.mid, m.top, 0.42), w: 13.6 * k }, { y: lerp(m.mid, m.top, 0.86), w: 9.5 * k }];
        for (const q of m.yards) yard(m.x + 0.5, q.y, q.w, 0.17 * k);
      }
      const dB = deckAt(1);
      GS.tube([HALF - 3, dB + 0.2, 0], [HALF + 8, dB + 3.2, 0], 0.3, 0.22, 6, spar, PLAIN);
      GS.tube([HALF + 6, dB + 2.9, 0], [SHIP.bow - SHIP.boom + HALF, dB + 5.6, 0], 0.18, 0.1, 6, spar, PLAIN);
      const mz = MASTS[2];
      GS.tube([mz.x - 0.4, mz.deck + 2.2, 0], [mz.x - 10.5, mz.deck + 2.9, -1.2], 0.16, 0.12, 6, spar, PLAIN);
      GS.tube([mz.x - 0.4, mz.mid - 2, 0], [mz.x - 8, mz.mid + 1.5, -0.9], 0.13, 0.09, 6, spar, PLAIN);
      // her stern windows: a row of small lit panes across the flat stern, dark bars between; a wale along each side
      {
        const y0 = deckAt(0) - 2.1, bw = beamAt(0) * 0.78;
        for (let k = 0; k < 5; k++) { const z0 = lerp(-bw, bw, k / 5) + 0.12, z1 = lerp(-bw, bw, (k + 1) / 5) - 0.12; face(GS, [[-HALF - 0.03, y0, z0], [-HALF - 0.03, y0, z1], [-HALF - 0.03, y0 + 0.95, z1], [-HALF - 0.03, y0 + 0.95, z0]], [-1, 0, 0], [1, 1, 1], [0, 2.4, NONE, 0.2 + 0.13 * k]); }
        face(GS, [[-HALF - 0.05, y0 + 0.44, -bw], [-HALF - 0.05, y0 + 0.44, bw], [-HALF - 0.05, y0 + 0.51, bw], [-HALF - 0.05, y0 + 0.51, -bw]], [-1, 0, 0], black, PLAIN);
        for (let i = 0; i < NS; i++) for (const sg of [1, -1]) {
          const t0 = i / NS, t1 = (i + 1) / NS, ya = deckAt(t0) - 1.25, yb = deckAt(t1) - 1.25;
          face(GS, [[lxAt(t0), ya, sg * (beamAt(t0) * 0.985 + 0.05)], [lxAt(t1), yb, sg * (beamAt(t1) * 0.985 + 0.05)], [lxAt(t1), yb + 0.22, sg * (beamAt(t1) * 0.98 + 0.05)], [lxAt(t0), ya + 0.22, sg * (beamAt(t0) * 0.98 + 0.05)]], [0, 0.1, sg], lin('#3d3a34'), PLAIN);
        }
      }
      // the wheel and the binnacle before it, a skylight, the capstan, hatches
      const wd = deckAt(0.12), wx = lxAt(0.12);
      for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, b = (i + 1) / 8 * Math.PI * 2; GS.tube([wx, wd + 1.05 + Math.cos(a) * 0.55, Math.sin(a) * 0.55], [wx, wd + 1.05 + Math.cos(b) * 0.55, Math.sin(b) * 0.55], 0.035, 0.035, 4, wood, PLAIN); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI; GS.tube([wx, wd + 1.05 + Math.cos(a) * 0.7, Math.sin(a) * 0.7], [wx, wd + 1.05 - Math.cos(a) * 0.7, -Math.sin(a) * 0.7], 0.025, 0.025, 4, wood, PLAIN); }
      GS.box(wx - 0.25, wd, 0, 0.12, wd + 1.05, 0.12, wood, { aux: PLAIN });
      GS.box(wx + 1.1, wd, 0, 0.3, wd + 1.1, 0.34, wood, { aux: PLAIN, top: [1, 1, 1], auxTop: [0, 2.6, NONE, SEEDS.binnacle] });
      GS.box(lxAt(0.4), deckAt(0.4), 0, 1.5, deckAt(0.4) + 0.5, 1.1, wood, { aux: PLAIN });
      GS.box(lxAt(0.62), deckAt(0.62), 0, 1.2, deckAt(0.62) + 0.45, 1.0, wood, { aux: PLAIN });
      GS.box(lxAt(0.74), deckAt(0.74), 0, 0.45, deckAt(0.74) + 1.0, 0.45, wood, { aux: PLAIN });
    }
    await rest();
    // her canvas (the set is dealt by the seed: topsails and foresail always, reefed), her standing rigging, her lights
    {
      const r = R.ship, rope = lin('#15130f'), canvas = lin('#8f8a7c'), wood = lin('#4a3a28');
      const railAt = (lx) => deckAt(tAt(lx)) + 1.0, sideAt = (lx) => beamAt(tAt(lx)) * 0.95;
      const yardEnd = (x, y, w, sg) => [x + 0.5 + sg * yardDir[0] * w / 2 + 0.3, y, sg * yardDir[2] * w / 2];
      const square = (m, hi, lo, amp, reef) => SAILS.push({ c: [yardEnd(m.x, hi.y - 0.25, hi.w * 0.94, -1), yardEnd(m.x, hi.y - 0.25, hi.w * 0.94, 1), yardEnd(m.x, lo.y + 0.35, lo.w * 0.92, 1), yardEnd(m.x, lo.y + 0.35, lo.w * 0.92, -1)],
        n: sailN, amp, seed: r(), reef });
      const furl = (m, q) => GS.tube([m.x + 0.5 + yardDir[0] * q.w * 0.42, q.y + 0.22, yardDir[2] * q.w * 0.42], [m.x + 0.5 - yardDir[0] * q.w * 0.42, q.y + 0.22, -yardDir[2] * q.w * 0.42], 0.27, 0.27, 6, canvas, PLAIN);
      const [fore, main, miz] = MASTS;
      const set = { mainCourse: r.chance(0.35), mizTop: r.chance(0.6), spanker: r.chance(0.5), foreGallant: r.chance(0.2) };
      square(fore, fore.yards[0], { y: fore.deck + 1.9, w: fore.yards[0].w * 1.02 }, 1.7, 1);
      square(fore, fore.yards[1], fore.yards[0], 1.35, 1);
      square(main, main.yards[1], main.yards[0], 1.45, 1);
      if (set.mainCourse) square(main, main.yards[0], { y: main.deck + 1.9, w: main.yards[0].w * 1.02 }, 1.8, 1); else furl(main, main.yards[0]);
      if (set.mizTop) square(miz, miz.yards[1], miz.yards[0], 1.0, 1); else furl(miz, miz.yards[1]);
      if (set.foreGallant) square(fore, fore.yards[2], fore.yards[1], 0.8, 0); else furl(fore, fore.yards[2]);
      furl(main, main.yards[2]); furl(miz, miz.yards[2]); furl(miz, miz.yards[0]);
      if (set.spanker) SAILS.push({ c: [[miz.x - 0.5, miz.mid - 2.1, 0], [miz.x - 7.9, miz.mid + 1.4, -0.9], [miz.x - 10.3, miz.deck + 3.0, -1.2], [miz.x - 0.5, miz.deck + 2.4, 0]], n: [0, 0, -1], amp: 0.9, seed: r(), reef: 1 });
      // head sails: a jib from the boom's end and a staysail from the bowsprit, sheeted to leeward
      const dB = deckAt(1), boomEnd = [SHIP.bow - SHIP.boom + HALF, dB + 5.6, 0];
      const jibHead = [fore.x + 0.1, fore.top - 4, 0], stayHead = [fore.x + 0.4, fore.mid + 2.2, 0];
      SAILS.push({ c: [jibHead, jibHead, [fore.x + 3.6, fore.deck + 3.6, -1.7], [boomEnd[0] - 1.2, boomEnd[1] - 0.2, 0]], n: [0.2, 0, -1], amp: 1.0, seed: r(), reef: 0 });
      SAILS.push({ c: [stayHead, stayHead, [fore.x + 2.3, fore.deck + 2.7, -1.4], [HALF + 6.6, dB + 2.95, 0]], n: [0.2, 0, -1], amp: 0.85, seed: r(), reef: 0 });
      // shrouds, backstays and stays (thin three-sided ropes)
      const line = (a, b, rad = 0.035) => GS.tube(a, b, rad, rad, 3, rope, PLAIN);
      for (const m of MASTS) for (const sg of [1, -1]) {
        for (let j = 0; j < 4; j++) { const lx = m.x - 0.3 - 0.75 * j; line([lx, railAt(lx), sg * sideAt(lx)], [m.x, m.mid - 0.2, sg * 0.45]); }
        for (let j = 0; j < 2; j++) line([m.x - 0.2 - 0.6 * j, m.mid + 0.1, sg * 1.25], [m.x - 0.35, lerp(m.mid, m.top, 0.84), sg * 0.1], 0.03);
        const bx = m.x - 5.5;
        line([bx, railAt(bx), sg * sideAt(bx)], [m.x - 0.35, lerp(m.mid, m.top, 0.9), sg * 0.1], 0.03);
      }
      line([fore.x, fore.mid, 0], [HALF + 7.6, dB + 3.15, 0]); line(jibHead, boomEnd); line([fore.x - 0.35, fore.top - 0.5, 0], [boomEnd[0] - 0.3, boomEnd[1], 0], 0.03);
      line([main.x, main.mid, 0], [fore.x - 0.6, fore.deck + 0.8, 0]); line([main.x - 0.35, main.top - 3, 0], [fore.x, fore.mid, 0], 0.03);
      line([miz.x, miz.mid, 0], [main.x - 0.6, main.deck + 0.8, 0]); line([miz.x - 0.35, miz.top - 3, 0], [main.x, main.mid, 0], 0.03);
      line(boomEnd, [HALF - 0.3, 1.2, 0], 0.04);
      // four lanterns: at the stern rail, in the binnacle, on the main mast, in the look-out's hand at the bow
      const lamp = (p, post) => {
        SHIP_LAMPS.push(p);
        if (post) GS.tube([p[0], post, p[2]], [p[0], p[1] - 0.22, p[2]], 0.04, 0.04, 4, rope, PLAIN);
        GS.box(p[0], p[1] - 0.22, p[2], 0.14, p[1] + 0.2, 0.14, [1, 1, 1], { aux: [0, 3.6, NONE, r()] });
        GS.box(p[0], p[1] + 0.2, p[2], 0.18, p[1] + 0.27, 0.18, rope, { aux: PLAIN });
        SHIPGLOWS.push({ p, size: 1.5, level: 1.5, seed: r(), heat: 1.05 });
      };
      const wd = deckAt(0.12), wx = lxAt(0.12), dM = main.deck, tL = 0.9;
      lamp([-HALF + 0.5, deckAt(0) + 2.7, 0], deckAt(0) + 1.0);
      SHIPGLOWS.push({ p: [wx + 1.1, wd + 1.25, 0], size: 1.1, level: 1.1, seed: r(), heat: 1 });
      lamp([main.x + 0.75, dM + 3.3, -0.2], 0);
      lamp([lxAt(tL) + 0.25, deckAt(tL) + 1.95, -0.62], 0);
      // her people: one helmsman at the wheel, officers on the quarterdeck, hands on the main deck, the look-out forward
      // (the helmsman and the watch aft from the ship's stream; the hands in the waist, whose number goes with the
      // visit, from a stream of their own, and the look-out from his own)
      const coat = (q) => mul(q.pick(coats), q.range(0.8, 1.2));
      const crewAdd = (q, f) => CREW.push({ ...f, color2: mul(q.pick(coats), 1.3), dress: q.pick([DRESS.cap, DRESS.cap, DRESS.cap + DRESS.comforter, DRESS.coat]) });
      crewAdd(r, { a: [wx - 0.8, wd, 0], b: [wx + 0.2, wd, 0], phase: r(), scale: 1, kind: 4, color: coat(r) });
      crewAdd(r, { a: [lxAt(0.2), deckAt(0.2), -1.9], b: [lxAt(0.2) + 1, deckAt(0.2), -3], phase: r(), scale: 1.02, kind: 2, color: coat(r) });
      crewAdd(r, { a: [lxAt(0.05), deckAt(0.05), -2.2], b: [lxAt(0.05), deckAt(0.05), 2.2], speed: 0.9, phase: r(), scale: 0.98, kind: 0, color: coat(r) });
      for (let i = 0, n = Math.round(2 * density), q = R.hands; i < n; i++) {
        const z = (i ? -1 : 1) * 2.3;
        crewAdd(q, { a: [lxAt(0.34), deckAt(0.34), z], b: [lxAt(0.7), deckAt(0.7), z], speed: q.range(0.9, 1.3), phase: q(), scale: q.range(0.94, 1.04), kind: 0, color: coat(q) });
      }
      crewAdd(R.lookout, { a: [lxAt(tL), deckAt(tL), -0.3], b: [lxAt(tL) + 1, deckAt(tL), -0.3], phase: R.lookout(), scale: 1, kind: 5, color: coat(R.lookout) });
    }
    // (her own instance of the lit material: wet wood that takes a sheen of the moon; its three near lights are her lanterns)
    ship.add(new THREE.Mesh(GS.toGeometry(), townMaterial({ ...townU, uLighter: shipLampU }, { roughness: 0.5, place: PLACE_TXT, placeKey: PLACE_KEY })));
    const sailU = { uTime: time, uAmb: { value: hemiC }, uMoon: { value: moonC }, uMoonDir: { value: moonDir }, uRing: ringU, uRingCol: ringCol, uLamps: shipLampU };
    const sails = makeSails(SAILS, sailU);
    ship.add(sails.mesh);
    const crew = makeFolk(CREW, { ...folkU, uMoon: { value: moonC }, uGlow: { value: new THREE.Color(...FIRE.lin).multiplyScalar(0.22) } }, folk.geometry);
    ship.add(crew.mesh);
    const shipGlows = makeFireGlows(SHIPGLOWS, { fog: 0.6 });
    shipGlows.mesh.material.uniforms.uTime = time;
    ship.add(shipGlows.mesh);
    // what rides the sea beside her: her wake astern, torn foam along both her sides (most at the bow), and the light
    // of her stern, main and bow lanterns lying broken on the water to either hand
    const beamU = { value: new THREE.Vector3(TOWER.x, TOWER.z, 0) };
    const riders = (() => {
      const cells = [], cx = (SHIP.stern + SHIP.bow) / 2, env = (k) => 1 - k * k, LAMP_ROAD = 44;
      cells.push({ ni: 18, nj: 6, light: 0, seed: R.wake(), at: (i, j) => [SHIP.stern + 1 + SHIP.wake * i / 18, SHIP.z + (j / 6 * 2 - 1) * (4.5 + 15 * i / 18)], fade: (i, j) => 0.98 * (1 - i / 18) ** 1.15 * env(j / 6 * 2 - 1) });
      for (const sg of [1, -1]) {
        cells.push({ ni: 14, nj: 3, light: 0, seed: R.wake(), at: (i, j) => { const t = 1.04 - 1.08 * i / 14; return [SHIP.bow - 3 + (SHIP_LEN + 6) * i / 14, SHIP.z + sg * (beamAt(clamp(t, 0, 1)) * 0.9 + 0.2 + 5.5 * j / 3)]; },
          fade: (i, j) => lerp(1, 0.6, i / 14) * (1 - j / 3) * smoothstep(0, 1.5, i) });
      }
      // her three lanterns' glitter, on the water to either hand of each (the lamp's place is the world's: she heaves
      // a metre about it); and the ring's gold on the crests before it, along the line's last reach
      for (const lp of SHIP_LAMPS) {
        const wx = (SHIP.stern + SHIP.bow) / 2 - lp[0], wy = lp[1] - 1.1, wz = SHIP.z - lp[2];
        // (to windward a square of sea beside her; on her lee side, where the line comes up from astern, a long reach
        // of it: LAMP_ROAD metres astern of the lamp and out past the line's own distance from her)
        cells.push({ ni: 7, nj: 7, light: 1, lamp: [wx, wy, wz, 3], seed: R.wake(), at: (i, j) => [wx + (i / 7 * 2 - 1) * 9, SHIP.z - (4.6 + 16 * j / 7)], fade: () => 1 });
        cells.push({ ni: 12, nj: 7, light: 1, lamp: [wx, wy, wz, 3], seed: R.wake(), at: (i, j) => [wx - 9 + (9 + LAMP_ROAD) * i / 12, SHIP.z + 4.6 + (SHIP.off + 6) * j / 7], fade: () => 1 });
      }
      // (the line's last reach runs low along the ring's sheet from end to end: its cells are RING_ROAD.cell metres,
      // half the lantern's below, so that no crest of the cross sea stands through it between its corners)
      const RING_ROAD = { back: 14, long: 100, half: 26, cell: 4 }, gni = Math.ceil(RING_ROAD.long / RING_ROAD.cell), gnj = Math.ceil(2 * RING_ROAD.half / RING_ROAD.cell);
      cells.push({ ni: gni, nj: gnj, light: 1, lamp: [RING.x, RING.y, RING.z, 9], seed: R.wake(), at: (i, j) => [RING.x - RING_ROAD.back + RING_ROAD.long * i / gni, RING.z + (j / gnj * 2 - 1) * RING_ROAD.half], fade: () => 1 });
      // ---- of the tower. The seas wash over its low reef: one sheet of foam on the sea's own surface over and round the
      // reef, whole where the rock is awash and thinning outward to nothing where it lies REEF_FOAM.deep under (the rock
      // itself stands through it wherever it is higher than the sea is at that moment: a clear line of contact)
      const REEF_FOAM = { awash: -0.7, deep: -2.5 }, rh = hero.reefHeight;
      cells.push({ ni: 44, nj: 6, light: 0, seed: R.wake(), at: (i, j) => { const a = i / 44 * Math.PI * 2, e = lerp(0.28, 1.6, j / 6); return [TOWER.x + Math.cos(a) * TOWER.reef * e, TOWER.z + Math.sin(a) * TOWER.reef * 0.503 * e]; },
        fade: (i, j) => { const a = i / 44 * Math.PI * 2, e = lerp(0.28, 1.6, j / 6); return j === 6 ? 0 : 0.95 * smoothstep(REEF_FOAM.deep, REEF_FOAM.awash, rh(Math.cos(a) * TOWER.reef * e, Math.sin(a) * TOWER.reef * 0.503 * e)); } });
      // the keepers' fire on the water: a streak of broken gold east of the reef, from SLIT_STREAK[0] to [1] metres
      // from the tower's axis (the mirror law above: it lies between the slit and whoever looks)
      const sl = hero.anchors.slit, SLIT_STREAK = [25, 70];
      cells.push({ ni: 10, nj: 6, light: 1, lamp: [TOWER.x + sl.x, sl.y, TOWER.z + sl.z, 4.4], seed: hero.keepers.seed, at: (i, j) => [TOWER.x + lerp(SLIT_STREAK[0], SLIT_STREAK[1], i / 10), TOWER.z + (j / 6 * 2 - 1) * (5 + 9 * i / 10)], fade: () => 1 });
      // the lantern's own road: the great light's broken gold on the crests between the tower and whoever looks, by
      // the same law, all round the tower out to where the beam's shafts end
      const BM = hero.BEAM, ln = hero.anchors.lantern;
      // (both sheets lie on one grid of corners round the tower, no cell of it longer than RIDE.cell metres outward,
      // nor round the ring the line flies: a sheet is set on the sea at its corners only, and between corners further
      // apart a swell's crest stands through it)
      const RIDE = { cell: 8 }, ringIn = TOWER.reef + 6, rnj = Math.ceil((BM.end - ringIn) / RIDE.cell), rni = Math.ceil(2 * Math.PI * TOWER.r / RIDE.cell);
      const ringAt = (i, j) => { const a = i / rni * Math.PI * 2, r = lerp(ringIn, BM.end, j / rnj); return [TOWER.x + Math.cos(a) * r, TOWER.z + Math.sin(a) * r]; };
      cells.push({ ni: rni, nj: rnj, light: 1, lamp: [TOWER.x + ln.x, ln.y, TOWER.z + ln.z, 8], seed: R.riderCells(), at: ringAt, fade: () => 1 });
      // the beam's pale patch on the crests, out to where its shafts end
      cells.push({ ni: rni, nj: rnj, light: 2, seed: R.riderCells(), at: ringAt,
        fade: (i, j) => { const r = lerp(ringIn, BM.end, j / rnj); return smoothstep(ringIn, ringIn + (BM.end - ringIn) / 6, r) * (1 - smoothstep(BM.fade, BM.end, r)); } });
      return makeSeaRiders(cells, { uTime: time, uFoam: { value: new THREE.Color('#dfe6f1') }, uBeam: beamU, uBeamCol: { value: new THREE.Color('#cdd7e6').multiplyScalar(0.5) } });
    })();
    scene.add(riders.mesh);
    // the ring's glory in the sleet: RING_GLORY metres across round its opening
    scene.add(makeGlory([RING.x, RING.y, RING.z], RING.r, RING_GLORY, { uTime: time, uPhase: { value: R.glory.range(0, 6.2832) }, uCol: { value: new THREE.Color('#ffe2b0').multiplyScalar(0.9) } }).mesh);
    await rest();
    const _tq = new THREE.Vector3();
    // ---- snow the whole way: slow thick flakes in the street, driving flat across the moor, sleet at sea -----------
    const snowStreet = fx.makeParticles({ rng: R.snowStreet, preset: 'snow', time, count: Math.round(4200 * density * clamp(detail, 0.5, 1)), velocity: [-windFrom.x * 1.1, -1.5, -windFrom.y * 1.1], size: [0.04, 0.1], opacity: 0.9 });
    const snowMoor = fx.makeParticles({ rng: R.snowMoor, preset: 'snow', time, count: Math.round(4200 * density * clamp(detail, 0.5, 1)), velocity: [-windFrom.x * 13, -2.6, -windFrom.y * 13], mode: 'streak', stretch: 0.022, size: [0.03, 0.06], opacity: 0.7 });
    const snowSea = fx.makeParticles({ rng: R.snowSea, preset: 'snow', time, count: Math.round(3600 * density * clamp(detail, 0.5, 1)), velocity: [-windFrom.x * 17, -7, -windFrom.y * 17], mode: 'streak', stretch: 0.016, size: [0.03, 0.06], opacity: 0.55 });
    scene.add(snowStreet.object, snowMoor.object, snowSea.object);
    snowMoor.setOpacity(0); snowSea.setOpacity(0);
    // ---- her bow wave; spindrift torn off the crests beside the route from the tower's circle to the ring ------------
    for (const sg of [1, -1]) WHITE.push({ p: [SHIP.bow - 0.8, 0.9, SHIP.z + sg * 1.4], dir: [-0.35, 0.8, sg], speed: 7.5, spread: 0.35, size: 2.3, period: R.bowWave.range(2.4, 3.2), offset: R.bowWave.range(0, 3), life: 1.6, puffs: 12, stagger: 1.6 });
    for (let s = S.south + 8; s < L - 6; s += 19) {
      path.posAtDist(s + R.spindrift.range(-6, 6), _p);
      const sg = R.spindrift.chance(0.5) ? 1 : -1, lat = R.spindrift.range(7, 20), per = R.spindrift.range(3.5, 6.5), offset = R.spindrift.range(0, per);
      if (Math.abs(_p.z + sg * lat - SHIP.z) < SHIP.beam / 2 + 3 && _p.x < SHIP.stern + 6 && _p.x > SHIP.bow - 6) continue;
      WHITE.push({ p: [_p.x, 1.4, _p.z + sg * lat], dir: [-windFrom.x, 0.3, -windFrom.y], speed: 9, spread: 0.3, size: 2.5, period: per, offset, life: 2.0, puffs: 9, stagger: 0.9 });
    }
    await rest();
    // ---- the instanced things, once every place has added its own ------------------------------------------------
    const windows = makeWindows(WIN, time, R.hutFigure.range(0, 6.2832), SEEDS.hut);
    scene.add(windows.mesh);
    // goods, hung birds and sacks: one instanced low ball; holly, ivy and berries: one instanced lower one; both lit
    // like the street they stand in
    for (const [list, shape] of [[GOODS, new THREE.IcosahedronGeometry(1, 0)], [LEAVES, new THREE.OctahedronGeometry(1, 0)]]) {
      const bp = shape.getAttribute('position');
      shape.setAttribute('normal', new THREE.Float32BufferAttribute(Array.from(bp.array), 3));
      shape.setAttribute('aux', new THREE.Float32BufferAttribute(new Float32Array(bp.count * 4).map((v, i) => (i % 4 === 2 ? NONE : 0)), 4));
      shape.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(bp.count * 3).fill(1), 3));
      const mesh = new THREE.InstancedMesh(shape, townMat, list.length), m = new THREE.Matrix4(), c = new THREE.Color();
      list.forEach((q, i) => { m.makeScale(q.sx, q.sy, q.sz).setPosition(q.p[0], q.p[1], q.p[2]); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.setRGB(q.color[0], q.color[1], q.color[2])); });
      mesh.frustumCulled = false;
      scene.add(mesh);
      await rest();
    }
    const glows = makeFireGlows(GLOWS, { fog: 0.6, rounds: roundU, over: true });
    glows.mesh.material.uniforms.uTime = time;
    scene.add(glows.mesh);
    await rest();
    // all smoke one mesh; all white water, spindrift and slipping snow another
    const smoke = makeBursts(SMOKE, { rng: R.smokePuffs, lit: '#8f93a6', shade: '#3b3e4e', opacity: 0.42, gravity: -0.35, wind: [-windFrom.x * 1.5, 0, -windFrom.y * 1.5], warm: 0, stretch: 0.15 });
    smoke.mesh.material.uniforms.uTime = time;
    scene.add(smoke.mesh);
    const white = makeBursts(WHITE, { rng: R.puffs, lit: '#e3eaf6', shade: '#7d8cab', opacity: 0.8, gravity: 7.5, wind: [-windFrom.x * 2, 0, -windFrom.y * 2], warm: 1, stretch: 0.9 });
    white.mesh.material.uniforms.uTime = time;
    scene.add(white.mesh);
    await rest();
    const lightPools = makeLightPools(POOLS_OF_LIGHT, time);
    scene.add(lightPools.mesh);
    // ---- the pace and the looks, by places of the route (see looksOf) ------------------------------------------------
    // where the tower first stands clear of the land: from abeam of the hut on, at the line's eyes every 2 m, the sight
    // line to the look's point on the tower is walked every 4 m; clear when the land lies under all of it
    let towerS = S.cliff;
    for (let s = S.hut; s < S.cliff; s += 2) {
      path.posAtDist(s, _p);
      const dx = TOWER_LOOK[0] - _p.x, dy = TOWER_LOOK[1] - _p.y, dz = TOWER_LOOK[2] - _p.z, n = Math.ceil(Math.hypot(dx, dz) / 4);
      let clear = true;
      for (let i = 1; i < n && clear; i++) clear = land(_p.x + dx * i / n, _p.z + dz * i / n) < _p.y + dy * i / n;
      if (clear) { towerS = s; break; }
      if ((s - S.hut) % 16 === 14) await rest();
    }
    const { pois, paceS } = looksOf(S, L, { cot: MARKS.cot, cotS: sNear(...MARKS.cot), door: MARKS.door, towerS });
    const DURATION = 50;
    // ---- sparks thrown up by the braziers of the square, each on the world's clock from its own brazier ------------
    const SPARKS = [], sparkU = { uTime: time, uWind: { value: new THREE.Vector3(-windFrom.x * 1.1, 0, -windFrom.y * 1.1) } };
    {
      for (const bz of BRAZIERS) for (let i = 0; i < 16; i++) {
        const e = R.embers;
        SPARKS.push({ o: [bz.p[0] + e.range(-0.2, 0.2), bz.p[1], bz.p[2] + e.range(-0.2, 0.2)], v: [e.range(-0.5, 0.5), e.range(1.6, 3.4), e.range(-0.5, 0.5)], seed: e(), life: e.range(1.1, 2.2), size: e.range(0.018, 0.035) });
      }
    }
    const sparks = makeWorldSparks(SPARKS, sparkU);
    scene.add(sparks);
    // each lamplighter's flame: a halo at his pole's tip, and sparks shed where he is. A spark's age runs on the
    // world's clock; it leaves the pole's tip where that was at the moment it was shed (worked out each frame from his
    // round at that moment) and falls and drifts there in the town's light wind
    const poleGlows = makeFireGlows(LIGHTERS.map((lt) => ({ p: [0, -1e4, 0], size: 1.3, level: 2.6, seed: lt.seed, heat: 1.2 })), { fog: 0.6 });
    poleGlows.mesh.material.uniforms.uTime = time;
    scene.add(poleGlows.mesh);
    const POLE_SPARKS = [];
    for (let i = 0; i < 3; i++) for (let k = 0; k < 10; k++) {
      const e = R.poleSparks;
      POLE_SPARKS.push({ who: i, o: [0, -1e4, 0], v: [e.range(-0.5, 0.5), e.range(0.3, 1.5), e.range(-0.5, 0.5)], seed: e(), life: e.range(1.0, 1.9), size: e.range(0.022, 0.04) });
    }
    const poleSparks = makeWorldSparks(POLE_SPARKS, sparkU), poleSparkAt = poleSparks.geometry.getAttribute('aO'), _lt = { x: 0, y: 0, z: 0, yaw: 0, walk: 0, moving: 0, c: 0, fx: 0, fy: 0, fz: 0 };
    scene.add(poleSparks);
    await rest();
    // the ring shows what lies beyond it from where the rounding of the tower ends (the south knot): the straight
    // distance from the ring to that point of the route
    const REVEAL = Math.round(path.posAtDist(S.south, new THREE.Vector3()).distanceTo(new THREE.Vector3(RING.x, RING.y, RING.z)));
    const _cp = new THREE.Vector3();
    // where in its flicker each of the ship's lamps stands at the clock's zero (dealt)
    const LAMP_PH = [0, 1, 2].map(() => [R.shipLamps.range(0, 6.2832), R.shipLamps.range(0, 6.2832)]);
    return {
      scene, path, duration: DURATION, pace: (u) => paceS(u * L), pois,
      camera: { fov: 62, near: 0.3, far: 4200, bank: 0.45 },
      portal: { shape: 'circle', radius: RING.r, color: '#ffe2b0', glow: 1.1, revealDistance: REVEAL },
      post: { exposure: 1.3, bloom: { strength: 0.5, radius: 0.65, threshold: 0.9 }, grade: { saturation: 1.05, contrast: 1.04, vignette: 0.3, grain: 0.02 } },
      ride: 'none', companion: 'none',
      update(dt, t, camera) {
        time.value = t;
        camera.getWorldPosition(_cp);
        // the weather of the place the eye stands in: mist, and how much of the west's glow comes through the air
        // (all of it on the land, a fifth of it through the sleet at sea)
        const pl = placeAt(_cp.x, _cp.z);
        fogAt(pl); seaFar.copy(scene.fog.color);
        lid.position.copy(_cp); dome.position.copy(_cp);
        // (the skies read the place under each of their points from the eye's own place in the world)
        westU.uEye.value.copy(_cp);
        // the lamplighters: each where his round has him at this moment of the world's clock; his flame is a light
        // of the world at his pole's tip; the lamps read where in its round each round is
        for (let i = 0; i < 3; i++) {
          const lt = LIGHTERS[i], n = lighterNow(i, t, lt.now);
          lt.U.uLampAt.value.set(n.x, n.y, n.z, n.yaw); lt.U.uWalk.value.set(n.walk, n.moving);
          lighterU.value[i].set(n.fx, n.fy, n.fz, 2.4 * (0.9 + 0.1 * Math.sin(t * 9.7 + lt.seed * 40) * Math.sin(t * 6.1 + lt.seed * 17)));
          poleGlows.setPosition(i, n.fx, n.fy, n.fz);
          roundU.uRoundNow.value.setComponent(i, n.c);
        }
        for (let k = 0; k < POLE_SPARKS.length; k++) {
          const q = POLE_SPARKS[k], x = t / q.life + q.seed, n = lighterNow(q.who, t - (x - Math.floor(x)) * q.life, _lt);
          poleSparkAt.setXYZ(k, n.fx, n.fy, n.fz);
        }
        poleSparkAt.needsUpdate = true;
        // snow by place: thick slow flakes in the town, driving flat over the moor, sleet at sea
        snowStreet.setOpacity(0.9 * pl.town); snowMoor.setOpacity(0.75 * (1 - pl.town) * (1 - pl.sea)); snowSea.setOpacity(0.55 * pl.sea);
        snowStreet.update(dt, t, camera); snowMoor.update(dt, t, camera); snowSea.update(dt, t, camera);
        // the ship rides the real swell, deep in it: heave, pitch and roll from the sea's height under her
        const sx = ship.position.x, hb = seaAt(sx - HALF * 0.8, SHIP.z, t), hs = seaAt(sx + HALF * 0.8, SHIP.z, t), hp = seaAt(sx, SHIP.z + 4, t), hq = seaAt(sx, SHIP.z - 4, t);
        ship.position.y = (hb + hs + hp + hq) * 0.25 * 0.8 - 1.1;
        ship.rotation.z = Math.atan2(hb - hs, HALF * 1.6) * 0.55;
        ship.rotation.x = -HEEL + Math.atan2(hq - hp, 8) * 0.3;
        ship.updateMatrixWorld();
        for (let i = 0; i < 3; i++) { _tq.set(SHIP_LAMPS[i][0], SHIP_LAMPS[i][1], SHIP_LAMPS[i][2]).applyMatrix4(ship.matrixWorld); shipLampU.value[i].set(_tq.x, _tq.y, _tq.z, 2.6 * (0.9 + 0.1 * Math.sin(t * 8.3 + LAMP_PH[i][0]) * Math.sin(t * 5.7 + LAMP_PH[i][1]))); }
        riders.ride(seaAt, t); beamU.value.z = hero.beamAngle(t);
        sky.update(dt, t, camera); rig.update(dt, t, camera);
        terrain.update(dt, t); ocean.update(dt, t, camera); hero.update(dt, t, camera);
      },
      dispose() { sky.dispose?.(); },
    };
  },
};
