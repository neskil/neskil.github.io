// Lamps Among the Golden Leaves: an evening in a wood of silver-barked giants whose leaves are gold.
//
// The flight goes west, toward the low sun. It begins over a clear stream and follows it up over its first fall
// under the gold roof; leaves it to pass a bole wider than a house and under a guards' platform high in a tree,
// its rope ladder hanging; crosses the stream again by its last fall and comes out into a clearing under the open
// evening sky, where a green mound is crowned with a double ring of trees (white leafless ones outside, tall
// pale-gold ones inside, a white platform in the towering middle tree; a way of flat stones leads up its slope
// and grey stones lie on it); goes up its slope through the white ring, round between the two rings under the
// gold one's boughs, and down its far side onto the straight ride with the city's hill ahead, past two outpost
// trees to the treeless green before the city's wall (a bank under a living hedge, lamps along its top), over the
// fosse by a white bridge and through tall gates hung with lamps; crosses the lawn by the fountain; and CLIMBS
// ROUND THE GREATEST TREE ONCE (hero set piece, src/parts/lamps-among-golden-leaves.js), the tree on our right and
// the great houses of its court standing about it, the round closing from ROUND_R0 to ROUND_R1
// from the trunk: the trunk and its ladder from below, the tree's own outer landing on its north-east
// side; then out over the lesser crowns toward the west, a wide turn, and level down the great
// platform's whole length through the hall on it (a house: walls of green woven work on silver staves, forked
// posts of living bough, a roof of gold leaves, the bole its pillar, two empty chairs at its foot, lamps under
// the eave) to the ring at the platform's far edge, which stands against the open sky. Every tree of the city
// carries open platforms and lamps, and a rope ladder wherever one comes down to a floor; no tree is joined to another.
//
// THE PLACE STANDS. One hour for the whole visit: THE DEEPER DUSK (the sun's disc on the western rim in a broad
// band of amber and rose, bars of cloud lit from below, deep blue-violet above and in the east with the first
// stars), or on a night visit the standing night with its moon; the same from the first frame to the last and
// for a visitor who stands still. The light differs from place to place because of the place: the stream's strip,
// the mound's clearing and everything over the roofs lie open to the west's last amber and the blue-violet sky;
// under the wood's roof it is the last low gold in gold haze; under the city's roof of leaves it is deep blue
// shade, and THE LAMPS ARE ITS LIGHT. EVERY LAMP BURNS from the first frame: those of the wood's platforms,
// the gates, the wall, the paths, every house and the great tree. Seen from the mound the city's hill already
// shows its lamps under its roof. What we see, we see because the line passes it.
//
// WHAT IS DRIVEN BY WHAT
//   by the place (a map of the roofs made from the crowns that stand; nothing of it changes while we fly):
//     the sun's, the sky's and the ground's light on a thing and the strength of a lamp, by THAT POINT'S OWN PLACE;
//     the colour and the thickness of the haze between the eye and a thing, by THAT POINT'S OWN PLACE ALONE and
//     the true distance to it, never by the eye's place nor by a mean with it (see THE LIGHT OF A PLACE; in the
//     part, GL_PLACE and GL_LIGHT)
//   by the visit's look alone, set once at build: the sky, the sun's height, the far haze, the mountains' colours,
//     what the great river carries, the mist's colour, the shafts' strength, the motes, the season, the lamps'
//     colours
//   by the world's clock (each a habit that goes on whether we are near or not, right at any moment of it):
//     the lamps' swing and breath, the leaves' sway and the gusts, the stream's and the river's water, the
//     fountain's drops, the swan-ship's round on the river, the swifts' two rounds, the white birds' round over
//     the mound, the moths at the lamps and the fireflies (all five are always on: none is switched by the
//     eye's distance), the falling leaves and the motes (their drift and the leaf fall's slow thickening and
//     thinning), the patches of mist in the wood's hollows (they slide some 0.9 m a second), the clouds, and
//     on the rare evening the bob and flicker of the lights that stand in a line on the long stair (each in its
//     own place for the whole visit: none walks, none comes or goes). (The spray at the falls stands in place:
//     the kit does not drift a mist that is laid at given places.)
//   by the metres flown: the film's pace (how fast we go at each place) and the gaze's pulls. Nothing else.
//   by the film's own clock: nothing.
//   BY THE EYE'S DISTANCE TO A THING, in metres (how a thing is drawn, never whether it happens; each a fade over
//   a stretch of metres, none a step):
//     the haze over a thing (the fog's own law over the true distance, at that thing's own thickness);
//     a tree's whole form within SWAP0 (198 m) of the eye and its plain form beyond SWAP1 (330 m), point by
//       point between (and, a saving and not a look, a whole set of trees is handed to the renderer only while
//       some of it can lie on its side of those limits);
//     a lamp's body, which goes with its tree's whole form (beyond SWAP1 a lamp is its glow alone: the glow
//       belongs to no set and is drawn at every distance);
//     a lamp's cord, gone between 70 m and 140 m; a rope ladder, between 120 m and 220 m; the fountain's drops,
//       between 90 m and 220 m; the kit's grass blades, sunk away between 80 m and 115 m, and its flowers
//       between 90 m and 125 m (and two savings that are not looks: the greens lie in cells, and the kit hands a
//       cell to the renderer only while some of it can stand nearer than its kind's end; and of the mound's
//       greens, which are dealt as thick as if they stood over the whole mound, those are left unmade that lie
//       further from the route's line than their kind's end, where none could be drawn at any moment of any
//       flight: 6 in 100 of the blades and 3 in 100 of the flowers, some 5,000 triangles);
//     a firefly, within 1.5 to 4 m of the eye (the kit's own); a shaft of sun has NO
//       limit of distance (it stands whole from the first frame: only where the eye is inside the shaft itself,
//       within three of its breadths of its middle line, or looks straight along it, does the kit thin it);
//     the falling leaves and the motes, which are made in a box about the eye (56 by 34 by 56 m) and never
//       nearer it than the lane;
//     the view in the ring at the end, which the engine opens by the metres left to fly: it is whole before the
//       ring first comes into view, and opens while the ring is behind us (REVEAL_AT, worked out at the end of
//       build from the line and the camera's breadth).
//   BY THE SIZE OF A PIXEL AT A THING (not metres; a thing finer than a pixel is drawn as its own mean): a leaf
//     card's fill, the painted leaves and flowers of the ground, a lamp's bright heart, a lamp's cord and a
//     ladder's ropes.
//
// Everything that is a tree, a platform or a lamp comes from the makers in the part file, so the wood, the city
// and the hero share one look. Ground, stream bed, wall, bridge, gate and fountain are built here.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep, bell } from '../kit/core.js';
import { makeSky, makeLightRig, skyDirection } from '../kit/sky.js';
import * as flora from '../kit/flora.js';
import * as F from '../kit/fauna.js';
import * as fx from '../kit/fx.js';
import * as Water from '../kit/water.js';
import * as T from '../kit/terrain.js';
import { buildHero, makeGoldwood, makePacer, trunkRadius, HERO, GL_PLACE, GL_LIGHT } from '../parts/lamps-among-golden-leaves.js';

const TAU = Math.PI * 2;
const C3 = (hex) => { const c = new THREE.Color(hex); return [c.r, c.g, c.b]; };
const mul3 = (c, k) => [c[0] * k, c[1] * k, c[2] * k];
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// the plan (metres): M = the mound's middle tree, C = the foot of the great tree on the city's hill, G = the gate in the wall
const MX = 40, MZ = -335, MOUND_H = 24;
// (the mound's flat top reaches MOUND_TOP_R from its middle tree, its foot lies at MOUND_FOOT_R; the middle tree is
// MID_H tall; the route comes onto the road's line at the mound's foot)
const MOUND_TOP_R = 40, MOUND_FOOT_R = 122, MID_H = 64;
const CX = 40, CZ = -830, HILL_Y = 30, WALL_R = 177, GATE_X = 46, GATE_Z = CZ + WALL_R;
// THE GATE STANDS WIDE: nothing of it (a post's foot, an open leaf, a lamp of either) stands nearer than GATE_ROOM
// to the road's line, as nothing of the hall's bay does (a gate is a way through, and wider than what comes
// through it). Its two posts are SLENDER round shafts, GATE_SHAFT in radius on a foot GATE_FOOT wider, GATE_AXIS
// either side of the gate's middle: the foot's inner face stands GATE_PLAY more than the room asks, for the
// line's own play about the gate's middle. The way through the bank is cut GATE_HALF either side of the middle
// (its cheeks rise behind the posts' feet: GATE_CHEEK from a foot's inner face to where a cheek is cut), and it
// WIDENS TOWARD THE CITY, GATE_FLARE for each metre inside the crest's line. THE LEAVES STAND OPEN, FLAT BACK
// AGAINST THE CHEEKS: each is swung through a right angle and by the flare more, so that from the road a leaf is
// seen edge on behind its post or not at all. Between the posts' shafts GATE_CLEAR either side is free.
const GATE_ROOM = 9, GATE_CHEEK = 1.6, GATE_FOOT = 0.45, GATE_PLAY = 0.25, GATE_HALF = GATE_ROOM + GATE_PLAY + GATE_FOOT + GATE_CHEEK, GATE_CLEAR = GATE_HALF - (GATE_CHEEK + 0.1) - 0.2;
const GATE_SHAFT = 0.6, GATE_AXIS = GATE_ROOM + GATE_PLAY + GATE_FOOT + GATE_SHAFT, GATE_FLARE = 0.3;
// the portal's ring (14 m across: as tall as the hall allows), and the level of the last flight (8 m over the
// great platform's floor)
const PORTAL_R = HERO.portalR;
const WALK_Y = HILL_Y + HERO.deck + HERO.over;
// room kept free of leaf masses round the line from the lawn on: END_ROOM, the ring's own radius (the climb goes up
// BETWEEN the lamp-hung trees, a crown on either hand: a wider room would bare the boughs it passes); the lane itself
const END_ROOM = 7, LANE = 2.5;
// THE ROUND about the great trunk, on which the climb winds up once: it begins ROUND_R0 from the trunk (the great
// crown's radius and two thirds of it again: from there the trunk, its ladder and the lowest boughs' lamps stand
// whole in one look) and closes, bearing by bearing over its first two fifths (ROUND_CLOSE), to ROUND_R1 (the
// crown's radius, the leaf room and a metre: its outermost leaves an arm's length off), which it keeps. The city's
// lesser trees keep their tops under a cone that rises CONE metres per metre from the hill's top at the great trunk.
const ROUND_R0 = Math.round(HERO.crownR * 5 / 3), ROUND_R1 = HERO.crownR + END_ROOM + 1, ROUND_CLOSE = 0.4, CONE = 0.3;
// the turn onto the hall's line: a circle of TURN_RHO that ends on the line LAST_RUN and one knot's step (LAST_STEP)
// before the ring, so that the last LAST_RUN metres are flown straight at the ring's face. The route leaves the
// round on the straight that touches both circles from outside (the trunk and the turn's centre on our right all
// the way), heading out over the lesser crowns toward the west, and turns back on this circle. TURN_RHO is as wide
// as the STEADY camera needs: that camera looks at the line's own point STEADY_AHEAD on (the engine's reach for it),
// and on this circle that point stands no more than 70 degrees off the heading, inside the crew's 75 with room for a pull.
// (LAST_RUN: the 60 m over which the crew measures the last heading. LAST_STEP: the route runs through its knots as
//  a curve whose heading at a knot is its neighbours' chord, so it is the straight's own from the second knot on.)
const LAST_RUN = 60, LAST_STEP = 5, STEADY_AHEAD = 26 * 3.4, RING_CLEAR = 90;
const TURN_RHO = Math.ceil(STEADY_AHEAD / (2 * 70 * Math.PI / 180)), TURN_ZC = HERO.seatZ + LAST_RUN + LAST_STEP;
// THE WOOD'S LINE IS LAID FOR A FLIGHT OF ITS OWN LENGTH AND REF_CLIMB MORE: the run-in before the first corner and
// the first corner's breadth are worked from the mean speed of a flight whose way from the gate to the ring is
// REF_CLIMB long, whatever this climb's own length: so the first pose and the wood's line do not move when the
// climb's line does. REF_CLIMB IS THE BUILDER'S OWN NUMBER, TYPED, AND IS NOT WORKED FROM THIS FILE'S KNOTS: it is
// the length, knot to knot from the gate's knot to the ring, of the climb as an earlier round laid it (it wound
// further about the great trunk than this one does), measured once by the builder's own count when that climb
// was shortened, and kept so that the wood's line stayed where it lay: 1151.91 m, the same on every visit, some
// 430 m longer than the climb now flown (about 725 m from the gate's knot to the ring). It gives the run-in its
// length and the weave's corners their breadth (WEAVE_R); a shorter one would shorten the one and tighten the
// other. Nothing built has this length.
// THE WOOD'S SPEED IS NOT HELD BY IT but by the pace (see THE WOOD KEEPS ITS PACE there): the one number paceK
// shares the REFERENCE film's seconds among the stretches, and what the ride's bound before the gate and the
// turns' bound take is added to the flight's seconds, not taken from the wood.
const REF_CLIMB = 1151.91;
// the mound's two rings of trees (their radii about its middle tree), and the circle half way between them, on which
// the flight passes under the gold ring's boughs
const RING_WHITE = 38, RING_GOLD = 21.5, RING_BETWEEN = (RING_WHITE + RING_GOLD) / 2;
// the straight road from the mound's middle to the gate, and its two outpost trees: one a bowshot (150 m) before the gate on
// the east side of the road, one half as far on the west side, each 26 m from the road's line (20 m of air between the
// flight and a platform's edge)
const roadX = (z) => MX + (GATE_X - MX) * (MZ - z) / (MZ - GATE_Z);
const OUT_SIDE = 26, OUTPOST = [[roadX(GATE_Z + 150) + OUT_SIDE, GATE_Z + 150], [roadX(GATE_Z + 75) - OUT_SIDE, GATE_Z + 75]];
// THE ROAD'S AVENUE. From the mound's foot (MOUND_FOOT_R from its middle tree, along the road) to the gate the road
// runs under an open strip of sky, so that the city's hill stands at its end. Two half-breadths, each measured
// from the road's own straight (roadX) and from nothing else: AVENUE_BOLES, within which no bole of the wood
// stands; AVENUE_AIR, within which (and three fifths of its own reach more) no tree has a bough, a root or a mass
// of leaf. Both are numbers of the plan, as OUT_SIDE is: the outposts stand OUT_SIDE from the same straight,
// just outside the boles' breadth. (ROAD_LEN: the road's length from the mound's middle to the gate's; ROAD_U: its
// heading; inAvenue: is a place abreast of the road between the mound's foot and the gate, or within `reach` of
// that stretch's ends, and nearer the road's straight than `half` and `reach`.)
const AVENUE_AIR = 13, AVENUE_BOLES = 23;
const ROAD_LEN = Math.hypot(GATE_X - MX, GATE_Z - MZ), ROAD_U = [(GATE_X - MX) / ROAD_LEN, (GATE_Z - MZ) / ROAD_LEN];
const inAvenue = (x, z, half, reach = 0) => { const dx = x - MX, dz = z - MZ, on = dx * ROAD_U[0] + dz * ROAD_U[1]; return on > MOUND_FOOT_R - reach && on < ROAD_LEN + reach && Math.abs(dx * ROAD_U[1] - dz * ROAD_U[0]) < half + reach; };
// round the mound's middle tree no tree of the wood stands nearer than one and two thirds of the crown's height over
// the mound's foot (the mound and the middle tree on it: 88 m): from the wood's edge the crown stands whole, 31
// degrees high and 29 broad (the white ring is 76 m across)
const CLEARING = 5 / 3 * (MOUND_H + MID_H);
// round the great tree no tree of the wood stands nearer than this: the wall (177 m), the fosse (to 206 m) and a
// treeless green 56 m wide before it
const OPEN = 262;
// (the lamps' light on the ground: as it falls up to POOL_SOFT, held under POOL_MOST: see the ground's shader)
const POOL_SOFT = 0.6, POOL_MOST = 1.1;
// (the square the fine ground and the shade map cover)
const BX0 = -330, BX1 = 410, BZ0 = -1140, BZ1 = 190;
// the sky's light as it comes down through the wood's roof of leaves (a green-grey: the wood by the stream's own)
const ROOF_SKY = [0.22, 0.27, 0.27], ROOF_HUE = ROOF_SKY.map((v) => (3 * v / (ROOF_SKY[0] + ROOF_SKY[1] + ROOF_SKY[2])).toFixed(4)).join(', ');
// (where the stream rises, 12 m outside the mound's clearing)
const SPRING_Z = -232;
// the broad river north of the city: its near bank (z) at x, and its width
const reachN = (x) => -1064 + 24 * Math.sin(x * 0.0045 + 1.0) + 10 * Math.sin(x * 0.013), REACH_W = 180, REACH_Y = -0.9;
// (what the far bank's floor keeps of its light: see the ground's shader)
const FAR_BANK = '0.26, 0.28, 0.42';

// the stream: rises at its spring by the mound's clearing and flows toward +Z down a bed that steps over small falls;
// the floor of the wood rises with it. z0 = its lower end, z1 = the spring; half its width is HALF.
function makeStream(rv) {
  // (its course swings 8 to 12 m either way over some 220 m, 5 m over some 100 m and 2.2 m over some 37 m: no
  // straight reach. Its width is its own at every place: between 0.7 and 1.25 of the mean along its length, 2.4 m
  // wider in the pool under each fall, narrowing to a third where it rises.)
  const ph = rv.range(0, 6), amp = rv.range(8, 12), HALF = 4.6;
  const xAt = (z) => -21 - amp * Math.sin(z * 0.028 + ph) - 5 * Math.sin(z * 0.063 + ph * 2) - 2.2 * Math.sin(z * 0.17 + ph * 1.3);
  const falls = []; for (let z = 28 - rv.range(0, 18); z > SPRING_Z + 32; z -= rv.range(40, 54)) falls.push({ z, drop: rv.range(1.5, 2.3) });
  // (its lower end lies 160 m below its first fall: the route begins some 110 m below that fall, see RUN_IN, and the
  // water runs on behind the beginning)
  const z0 = falls[0].z + 160, z1 = SPRING_Z;
  const base = (z) => (z0 - Math.max(z, z1)) * 0.006;
  const riseAt = (z) => { let y = base(z); for (const f of falls) y += f.drop * smoothstep(f.z + 16, f.z - 16, z); return y; };
  const bedAt = (z) => { let y = -1.7 + base(z); for (const f of falls) y += f.drop * smoothstep(f.z + 0.8, f.z - 0.8, z); return y; };
  const dist = (x, z) => Math.abs(x - xAt(z)) * 0.97;
  const halfAt = (z) => { let w = HALF * (0.7 + 0.55 * (0.5 + 0.5 * Math.sin(z * 0.11 + ph * 3))); for (const f of falls) w += 2.4 * Math.exp(-Math.pow((z - f.z - 7) / 6, 2)); return w * lerp(0.33, 1, smoothstep(z1, z1 + 30, z)); };
  return { xAt, bedAt, riseAt, falls, dist, halfAt, amp, ph, z0, z1, HALF };
}

function makeGround(noise, stream) {
  // the city's hill, wall and fosse as one radial profile (absolute heights), cut by the gate causeway: the wall is
  // a green BANK, round-backed: it rises from the hill's foot over 11 m to its crest at WALL_R (17 m, some 15 m over
  // the ground before it; `crest` more or less where it stands: the crest's line rises and falls along the wall)
  // and falls from the crest over 11.5 m, easing out into the ground at the fosse's brink; no part of it is flat.
  // The fosse lies 8.2 m deep before it.
  const city = (r, gate, crest) => {
    if (r < 166) return 5 + 25 * (1 - smoothstep(40, 166, r));
    if (r < 188.5) return lerp(r < WALL_R ? lerp(5, 17 + crest, smoothstep(166, WALL_R, r)) : lerp(17 + crest, 2.4, smoothstep(WALL_R, 188.5, r)), 4.2, gate);
    return 2.4 - 8.2 * smoothstep(188.5, 194, r) * (1 - smoothstep(201, 206.5, r));
  };
  const floor = (x, z) => {
    const ds = z < stream.z0 + 40 && z > stream.z1 - 40 ? stream.dist(x, z) : 99, calm = 0.25 + 0.75 * smoothstep(8, 45, ds);
    return stream.riseAt(z) * (1 - smoothstep(-330, -560, z)) + calm * (2.4 * noise.fbm2(x * 0.0055 + 3.1, z * 0.0055 - 1.7, 3) + 0.5 * noise.n2(x * 0.031, z * 0.031));
  };
  const height = (x, z) => {
    let h = floor(x, z);
    const dm = Math.hypot(x - MX, z - MZ);
    if (dm < MOUND_FOOT_R + 3) h += MOUND_H * (1 - smoothstep(MOUND_TOP_R, MOUND_FOOT_R, dm)) + 0.5 * (1 - smoothstep(0, MOUND_TOP_R, dm));
    const dc = Math.hypot(x - CX, z - CZ);
    if (dc < 222) {
      // (the way through the bank widens toward the city, GATE_FLARE for each metre inside the crest's line, where
      //  the gate's open leaves lie back against its cheeks; at the crest and before it the cut is GATE_HALF)
      const gw = z > CZ ? GATE_HALF + GATE_FLARE * clamp(WALL_R - dc, 0, 12) : 0, gate = z > CZ ? 1 - smoothstep(gw - 1.1, gw + 2.4, Math.abs(x - GATE_X)) : 0;
      // (the crest's rise and fall: 1.5 m either way, over some 60 m of the wall's length)
      h = lerp(city(dc, gate, dc > 166 && dc < 188.5 ? 1.5 * noise.n2(x * 0.017 + 5.3, z * 0.017 - 2.1) : 0) + (dc < 166 ? 0.5 * noise.n2(x * 0.03, z * 0.03) * smoothstep(40, 70, dc) : 0), h, smoothstep(206, 220, dc));
    }
    if (z < stream.z0 + 30 && z > stream.z1 - 30) {
      const ds = stream.dist(x, z);
      if (ds < 17) { const k = (1 - smoothstep(stream.halfAt(z) + 0.6, 17, ds)) * smoothstep(stream.z1 - 20, stream.z1 + 10, z); h = lerp(h, Math.min(h, stream.bedAt(z)), k); }
    }
    if (z < -1000) { const rn = reachN(x); if (z < rn + 16) h = lerp(h, -3.6, smoothstep(rn + 16, rn - 3, z)); }
    return h;
  };
  return { height, floor };
}

// ---------------------------------------------------------------------------------------------------------
// ground shader: fallen gold leaves lying in drifts, bare silver-grey earth between them and round the trunks,
// spring grass starred with flowers (in patches where it reaches out into the wood), stream stones; the low sun
// falls through the roof in long bars and the trunks cut long shadows across them (a baked map); lamp light from
// a short list of pools
// ---------------------------------------------------------------------------------------------------------
const GROUND_VERT = /* glsl */`
${GL_PLACE}
attribute vec4 aG; varying vec3 vW, vN; varying vec4 vG;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gwPlaces(vW); vN = normalize(mat3(modelMatrix) * normal); vG = aG; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const GROUND_FRAG = /* glsl */`
uniform float uTime, uShadeK;
${GL_LIGHT}
uniform vec4 uShadeST, uWind; uniform sampler2D uShade;
uniform vec4 uPoolP[12]; uniform vec3 uPoolC[12];
uniform vec4 uStream, uMist, uLampST; uniform float uFallZ[8]; uniform sampler2D uLampMap; uniform vec2 uWaterY;
varying vec3 vW, vN; varying vec4 vG;
float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash2(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * vec3(.1031, .1030, .0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(hash(i), hash(i+vec2(1.,0.)), f.x), mix(hash(i+vec2(0.,1.)), hash(i+vec2(1.,1.)), f.x), f.y); }
// how deep the leaves lie: drifts some 9 m and some 32 m across
float driftAt(vec2 p){ return clamp(0.6 * vnoise(p * 0.11 + 3.) + 0.55 * vnoise(p * 0.031 + 11.) - 0.05, 0., 1.); }
// one layer of fallen leaves: returns vec4(colour, cover)
// (gold 1: a leaf blown onto grass: the gold ones only, a little lighter; the wood floor's browns are left out)
vec4 leafLayer(vec2 p, float cell, float seed, float gold){
  vec2 q = p / cell + seed * 17.3, id = floor(q), f = fract(q) - 0.5; vec2 h = hash2(id + seed);
  f -= (h - 0.5) * 0.45; float a = h.x * 6.2832, ca = cos(a), sa = sin(a); vec2 r = vec2(f.x * ca - f.y * sa, f.x * sa + f.y * ca);
  float d = length(vec2(r.x / 0.46, r.y / (0.2 + 0.06 * h.y))) + 0.35 * abs(r.x) * step(0., r.x);
  float k = fract(h.y * 9.7); vec3 c = k < 0.5 ? mix(vec3(0.80, 0.47, 0.07), vec3(0.93, 0.70, 0.22), k * 2.) : k < 0.86 ? vec3(0.50, 0.26, 0.05) : vec3(0.62, 0.52, 0.12);
  if (gold > 0.5) c = mix(vec3(0.86, 0.55, 0.09), vec3(1.0, 0.80, 0.28), k);
  c *= 0.82 + 0.3 * (1. - d) - 0.25 * (1. - smoothstep(0.0, 0.02, abs(r.y))) * step(d, 0.9);
  return vec4(c, 1. - smoothstep(0.86, 1.0, d));
}
float star(vec2 p){ float a = atan(p.y, p.x + 1e-5), r = length(p); float w = cos(floor(0.5 + a / 1.2566) * 1.2566 - a) * r; return 1. - smoothstep(0.02, 0.045, w - 0.07 + r * 0.38); }
void main(){
  gwLight();
  vec2 p = vW.xz; vec3 toC = cameraPosition - vW; float dist = length(toC);
  float fw = max(fwidth(p.x), fwidth(p.y));
  vec4 sm = texture2D(uShade, p * uShadeST.xy + uShadeST.zw);
  float drift = driftAt(p);
  // fallen leaves: deep in the drifts, few on the bare earth between them and round each trunk's foot
  vec3 mean = mix(vec3(0.50, 0.29, 0.06), vec3(0.74, 0.46, 0.09), vnoise(p * 0.21));
  vec4 l1 = leafLayer(p, 0.62, 1., 0.), l2 = leafLayer(p + 3.7, 0.5, 2., 0.), l3 = leafLayer(p + 9.1, 0.86, 3., 0.);
  float bare = clamp(sm.g * uShadeK * 1.15 + (1. - smoothstep(0.26, 0.44, drift)), 0., 1.) * (1. - vG.y);
  // (in the clearing round the mound the floor lies under the open sky: bare earth there takes the sky's violet and
  //  read as slate between the drifts; three quarters of it lies under blown leaf there)
  bare *= 1. - 0.75 * (1. - smoothstep(${(CLEARING - 14).toFixed(1)}, ${(CLEARING + 6).toFixed(1)}, length(p - vec2(${MX}., ${MZ}.))));
  // (the bare earth is a warm silver-grey: in the roof's shade it is grey-brown, never violet)
  vec3 earth = vec3(0.275, 0.25, 0.215) * (0.7 + 0.55 * vnoise(p * 1.7 + 5.)) * (0.85 + 0.3 * vnoise(p * 7.));
  vec3 under = mix(vec3(0.30, 0.17, 0.04), earth, bare);
  float thin = 1. - 0.8 * bare;
  // (the leaves thin out across the whole ramp of a bare patch, each leaf by its own chance: a patch has no edge)
  vec3 lit = under; lit = mix(lit, l3.rgb * 0.85, l3.a * thin); lit = mix(lit, l2.rgb, l2.a * thin * step(bare, 0.2 + 0.75 * hash(floor((p + 3.7) / 0.5) + 7.))); lit = mix(lit, l1.rgb, l1.a * thin * step(bare, 0.08 + 0.87 * hash(floor(p / 0.62))));
  vec3 alb = mix(lit, mix(mean, earth, bare * 0.8), smoothstep(0.12, 0.5, fw));
  alb *= 0.7 + 0.55 * drift;
  // grass with star flowers: whole on the mound and the lawns, in patches where it reaches out along the stream and the ride
  float g = vG.x;
  if (g > 0.01) {
    float gp = smoothstep(0.3, 0.7, g + (vnoise(p * 0.16 + 5.) * 0.5 + vnoise(p * 0.55 + 9.) * 0.3 + vnoise(p * 2.7 + 2.) * 0.2 - 0.5) * 1.7 * (1. - abs(2. * g - 1.)));
    float gn = vnoise(p * vec2(9., 2.3) + vnoise(p * 0.7) * 3.), g2 = vnoise(p * 0.17 + 3.);
    vec3 gc = mix(vec3(0.05, 0.19, 0.05), vec3(0.17, 0.40, 0.09), 0.35 * gn + 0.65 * g2) * (0.8 + 0.4 * vnoise(p * 0.035));
    // (leaves blown onto the grass lie on it one by one, thicker in drifts: the grass shows between them, and far
    //  off, where a leaf is finer than a pixel, they are a gold tinge on the green in the same drifts. A LEAF ON
    //  GRASS IS A GOLD LEAF LIFTED ON THE BLADES: gold (none of the floor's browns: on green in the evening's light
    //  they read as dark flat flecks), and its shade lies on the grass beside it, on its side away from the sun.)
    float blown = smoothstep(0.45, 0.75, vnoise(p * 0.11 + 20.)) * vG.z, nearK = 1. - smoothstep(0.12, 0.5, fw);
    vec2 toSun = normalize(uSunDir.xz + vec2(1e-4, 0.)) * 0.085;
    vec4 b3 = leafLayer(p + 9.1, 0.86, 3., 1.), b1 = leafLayer(p, 0.62, 1., 1.);
    float a3 = b3.a * blown * nearK, a1 = b1.a * blown * nearK * step(0.4, hash(floor(p / 0.62) + 3.));
    float s3 = leafLayer(p + toSun + 9.1, 0.86, 3., 1.).a, s1 = leafLayer(p + toSun, 0.62, 1., 1.).a * step(0.4, hash(floor((p + toSun) / 0.62) + 3.));
    gc *= 1. - 0.55 * max(s3, s1) * blown * nearK;
    gc = mix(gc, b3.rgb * 0.95, a3); gc = mix(gc, b1.rgb * 1.05, a1);
    gc = mix(gc, vec3(0.80, 0.55, 0.12), 0.3 * blown * (1. - nearK));
    float fl = vG.w * (1. - smoothstep(0.03, 0.14, fw)) * (1. - 0.5 * blown) * gp;
    // far off, where a flower is finer than a pixel, the flowers are a mist of pale gold in drifts on the grass
    gc = mix(gc, vec3(0.80, 0.74, 0.34), 0.42 * vG.w * smoothstep(0.03, 0.14, fw) * (1. - 0.5 * blown) * smoothstep(0.25, 0.7, vnoise(p * 0.09 + 11.)));
    if (fl > 0.01) {
      vec2 q = p / 0.55, id = floor(q), f = fract(q) - 0.5; vec2 h = hash2(id);
      float sway = 0.03 * sin(uTime * 2.2 + id.x * 1.7 + id.y * 2.3 + h.x * 6.);
      f -= (h - 0.5) * 0.5 + vec2(sway, sway * 0.6);
      float kind = fract(h.x * 13.7), spread = smoothstep(0.3, 0.6, vnoise(p * 0.09 + 11.));
      if (kind < 0.42 * (0.5 + spread)) gc = mix(gc, vec3(1.0, 0.72, 0.10) * 1.25, star(f * (1.6 + h.y)) * fl);
      else if (kind > 0.6) gc = mix(gc, mix(vec3(0.97), vec3(0.78, 0.96, 0.72), h.y * h.y), max(star(f * (1.9 + h.y)), 1. - smoothstep(0.06, 0.1, length(f))) * fl);
    }
    alb = mix(alb, gc, gp);
  }
  // the stream's bed and banks, by the stream's own course and width (the same rule the water is laid by): pale
  // stones under the water, dark and wet at its edge, wet moss on the banks for some 3 m beyond
  if (vG.y > 0.01) {
    float sx = -21. - uStream.x * sin(p.y * 0.028 + uStream.y) - 5. * sin(p.y * 0.063 + uStream.y * 2.) - 2.2 * sin(p.y * 0.17 + uStream.y * 1.3);
    float hw = uStream.z * (0.7 + 0.55 * (0.5 + 0.5 * sin(p.y * 0.11 + uStream.y * 3.)));
    for (int i = 0; i < 8; i++) { float dz = (p.y - uFallZ[i] - 7.) / 6.; hw += 2.4 * exp(-min(dz * dz, 30.)); }
    hw *= mix(0.33, 1., smoothstep(uStream.w, uStream.w + 30., p.y));
    float ds = abs(p.x - sx) * 0.97 + (vnoise(p * 0.45 + 7.) - 0.5) * 1.6 + (vnoise(p * 1.9) - 0.5) * 0.5;
    float bed = 1. - smoothstep(hw - 0.2, hw + 0.5, ds), moss = (1. - smoothstep(hw + 1.2, hw + 4.2, ds)) * vG.y;
    vec2 q = p / 0.7, id = floor(q), f = fract(q) - 0.5; vec2 h = hash2(id + 5.); float d = length((f - (h - 0.5) * 0.4) * vec2(1., 1.3 + h.x));
    vec3 st = mix(vec3(0.46, 0.45, 0.40), vec3(0.80, 0.78, 0.70), h.y) * (0.6 + 0.6 * (1. - smoothstep(0.1, 0.5, d)));
    vec3 mo = mix(vec3(0.07, 0.19, 0.05), vec3(0.20, 0.36, 0.08), vnoise(p * 0.8 + 3.)) * (0.75 + 0.5 * vnoise(p * 3.1));
    // (dark wet earth and roots' shadow right at the water's edge)
    mo = mix(mo, vec3(0.07, 0.065, 0.06), (1. - smoothstep(hw + 0.3, hw + 1.3, ds)) * 0.7);
    alb = mix(alb, mo, moss * (0.55 + 0.45 * smoothstep(0.3, 0.6, vnoise(p * 0.3 + 1.))));
    alb = mix(alb, st, bed * vG.y);
  }
  // THE SHORE: where the ground comes down to the fosse's water (uWaterY.x) and to the great river's (uWaterY.y) it
  // is a pale strand for the last metre of its height over the water, pebbled, dark and wet right at the edge
  // (reachZ: the river's near bank, reachN in the shader's words; bankZ: where the ground begins to fall to it)
  float reachZ = -1064. + 24. * sin(p.x * 0.0045 + 1.0) + 10. * sin(p.x * 0.013);
  {
    float rcs = length(p - vec2(${CX}., ${CZ}.)), bankZ = reachZ + 16.;
    float wy = rcs > 186. && rcs < 210. ? uWaterY.x : (p.y < bankZ && p.y > bankZ - 40. ? uWaterY.y : -99.), hgt = vW.y - wy;
    float strand = (1. - smoothstep(0.5, 0.8 + 0.5 * vnoise(p * 0.21 + 9.), hgt)) * step(-90., wy);
    vec3 sand = vec3(0.60, 0.54, 0.42) * (0.8 + 0.35 * vnoise(p * 2.3 + 4.)) * (0.9 + 0.25 * hash(floor(p / 0.3)));
    alb = mix(alb, sand * (0.5 + 0.5 * smoothstep(0.05, 0.3, hgt)), strand);
  }
  // the drifts' relief: the lee side of a drift is in shade
  float e = 0.7, hx = driftAt(p + vec2(e, 0.)) - drift, hz = driftAt(p + vec2(0., e)) - drift;
  vec3 N = normalize(vN + vec3(-hx, 0., -hz) * 3.2 * (1. - g) + vec3(vnoise(p * 1.7) - 0.5, 0., vnoise(p * 1.7 + 31.) - 0.5) * 0.3);
  // bars of low sun through the roof, long in the sun's bearing. The roof is where the wood stands: there is none
  // over the clearing round the mound nor over the open ground round the city (its wall, its fosse and the treeless
  // space before them), and none over grass: there the ground takes the whole sun and the whole sky.
  vec2 sd = normalize(uSunDir.xz + vec2(1e-4, 0.));
  float bars = smoothstep(0.34, 0.6, vnoise(vec2(dot(p, vec2(-sd.y, sd.x)) * 0.085, dot(p, sd) * 0.012) + 7.3));
  float rc = length(p - vec2(${CX}., ${CZ}.)), rm = length(p - vec2(${MX}., ${MZ}.));
  float open = max(max(1. - smoothstep(${(CLEARING - 14).toFixed(1)}, ${(CLEARING + 6).toFixed(1)}, rm), 1. - smoothstep(${OPEN - 14}., ${OPEN + 6}., rc)), smoothstep(0.25, 0.8, g));
  bars = mix(bars, 1., max(open, 1. - uShadeK));
  // flecks of leaf light, fixed in the ground and one to three metres across (finer than a pixel they are their
  // mean): inside every trunk's shadow they let up to six tenths of the sun back, and so they do on bare earth
  // lying in the roof's shade, in the measure the earth is bare
  float fleck = mix(smoothstep(0.5, 0.68, vnoise(p * 0.47 + 41.) * 0.6 + vnoise(p * 1.3 + 17.) * 0.4), 0.3, smoothstep(0.4, 1.4, fw));
  float roof = 0.12 + 0.88 * bars; roof += (1. - roof) * 0.6 * fleck * bare;
  float sh = mix(1., sm.r + (1. - sm.r) * 0.6 * fleck, uShadeK) * roof;
  float ndl = clamp(dot(N, uSunDir), 0., 1.);
  // (the fosse before the city's wall is a ditch: its bottom and sides see little of the sky)
  float ditch = 1. - 0.5 * smoothstep(189., 194.5, rc) * (1. - smoothstep(200.5, 206.5, rc));
  // (lit: the sun's gold; shade: the sky's light, a little cooler than it lies on the leaves, and the gold the
  //  leaves overhead give back: a shade on the floor is a darker gold or green)
  // (UNDER THE ROOF the sky's light has come down through the leaves at every hour of the way: it keeps the hour's
  //  strength and takes the hue it has in the wood by the stream, so a trunk's shadow and the bare earth in it are a
  //  darker gold and a grey-green, never the open evening's violet; in the open it is the sky's own)
  vec3 skyL = mix(uSkyCol, dot(uSkyCol, vec3(0.3333)) * vec3(${ROOF_HUE}), (1. - open) * uShadeK);
  vec3 col = alb * (uSunCol * (ndl * 2.9 + 0.3) * sh + skyL * vec3(1.2, 1.2, 1.4) + uGndCol * 0.3) * ditch;
  // THE FAR BANK IS A WOOD'S FLOOR AT DUSK (by place: beyond the great river's far edge): with the sun this low the
  // trees' shadows lie the whole length of it, and it takes the sky's light alone, darker and cooler. (Seen from
  // the hall's height it was a pale amber plain with tufts standing on it.)
  col *= mix(vec3(1.), vec3(${FAR_BANK}), 1. - smoothstep(reachZ - ${REACH_W + 44}., reachZ - ${REACH_W + 8}., p.y));
  vec3 lamp = vec3(0.);
  for (int i = 0; i < 12; i++) { vec2 d = p - uPoolP[i].xy; float r = uPoolP[i].z; float f = 1. / (1. + dot(d, d) / max(r * r, 1e-3)); lamp += uPoolC[i] * f * f * uPoolP[i].w; }
  // (the city's lamps, summed in their map: see where it is made)
  { vec2 lu = p * uLampST.xy + uLampST.zw; vec4 t = texture2D(uLampMap, lu); lamp += 4. * t.rgb * t.rgb * step(0., lu.x) * step(lu.x, 1.) * step(0., lu.y) * step(lu.y, 1.); }
  // THE LAMPS' LIGHT ON THE GROUND IS HELD UNDER A MIDDLING BRIGHTNESS: up to POOL_SOFT it is as it falls; over
  // that it rises more and more slowly, to POOL_MOST at the most. Under the gate's forty lamps and the wall's the
  // bank and the lawn were a flat pale green without a blade (twice the grass's own colour and more): two pale
  // panes either side of the gate. The grass under many lamps is lit grass; the lamps are the bright things.
  lamp *= uLampGain;
  { float lm = max(lamp.r, max(lamp.g, lamp.b)); if (lm > ${POOL_SOFT.toFixed(2)}) lamp *= (${POOL_SOFT.toFixed(2)} + ${(POOL_MOST - POOL_SOFT).toFixed(2)} * (1. - exp(-(lm - ${POOL_SOFT.toFixed(2)}) / ${(POOL_MOST - POOL_SOFT).toFixed(2)}))) / lm; }
  col += alb * lamp;
  // mist lies in the hollows of the wood toward evening: on the low ground beyond the fine floor (under the stream's
  // lowest bed), in patches some hundreds of metres across that drift slowly; uMist is its colour and how much of it
  // the hour brings. (Beyond the great river it is a third as thick: the far bank is seen across the water from the
  // great tree, a wood on its own dark floor, and under a white floor it read as a lake without a surface.)
  col = mix(col, uMist.rgb, uMist.a * smoothstep(-1.6, -3.3, vW.y) * smoothstep(0.3, 0.62, vnoise(p * 0.0045 + vec2(uTime * 0.004, 3.))) * (1. - 0.67 * step(p.y, reachZ - ${REACH_W}.)));
  float l = dist, fo = clamp(1. - exp(-uFogDen * uFogDen * l * l), 0., 1.);
  float sdot = dot(-toC / max(l, 1e-3), uSunDir), s = clamp(sdot, 0., 1.); s = s * s; s = s * s;
  gl_FragColor = vec4(mix(col, mix(uFogCool, uFogCol, smoothstep(-0.55, 0.75, sdot)) + uFogSun * s * s, fo), 1.);
}`;

// THE GREAT RIVER, and the fosse's still water: a sheet of water with a surface. aT is 0 at the sheet's near bank
// (the city's side) and 1 at the far; uBank = (the sheet's breadth in metres, how high the far bank's trees stand
// in its image or 0 where no wood stands over it, the breadth of the shade and the reeds along a bank, the breadth
// of the strand at the far bank or 0).
//   ripples of three sizes, in metres of the place (31, 8.5 and 2.1 m), each left out where it is finer than the
//     picture's grain, and broad lanes of ruffled water between smoother ones: no stripe runs the river's length;
//   the sky lies in it by the ray thrown back from the rippled water (its high colours seen from high over it, its
//     low colours far off, where the water is seen at a shallow angle; uRefLo and uRefHi go with the light), and the
//     water's own dark shows through from above: it is darkest seen straight down;
//   the low sun lies on it as a long path of glitter under the sun's own place (no light is made for it);
//   the far bank's trees stand dark in it along its far edge, their tops ragged and trembling with the ripples; the
//     near edge lies in shade, with reeds standing in the shallows in clumps; the far edge is a pale strand with a
//     dark fringe of roots;
//   and the long wake of the swan-ship.
const REACH_VERT = /* glsl */`${GL_PLACE}
attribute float aT; varying vec3 vW; varying float vT; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gwPlaces(vW); vT = aT; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const REACH_FRAG = /* glsl */`
uniform float uTime, uSwanK, uAlpha; uniform vec3 uRefLo, uRefHi; uniform vec4 uSwan, uBank;
${GL_LIGHT}
varying vec3 vW; varying float vT;
float rh(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float rn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(rh(i), rh(i+vec2(1.,0.)), f.x), mix(rh(i+vec2(0.,1.)), rh(i+vec2(1.,1.)), f.x), f.y); }
// the water's slope from ripples lam metres long, drifting; fp: the picture's grain there, in metres
vec2 slope(vec2 p, float lam, vec2 drift, float fp){
  vec2 q = p / lam + drift * uTime; float h0 = rn(q);
  return vec2(rn(q + vec2(0.35, 0.)) - h0, rn(q + vec2(0., 0.35)) - h0) * (1. - smoothstep(0.3 * lam, 1.2 * lam, fp));
}
void main(){
  gwLight();
  vec3 toC = cameraPosition - vW; float l = length(toC); vec3 V = toC / max(l, 1e-3); vec2 p = vW.xz;
  float fp = max(length(dFdx(p)), length(dFdy(p)));
  float lane = smoothstep(0.3, 0.7, rn(p * vec2(0.011, 0.027) + vec2(uTime * 0.004, 7.3) + 1.7 * rn(p * 0.006)));
  vec2 sl = (slope(p, 31., vec2(0.02, 0.008), fp) * 0.26 + slope(vec2(p.x * 0.8 + p.y * 0.6, p.y * 0.8 - p.x * 0.6), 8.5, vec2(-0.03, 0.06), fp) * 0.22 + slope(p, 2.1, vec2(0.2, -0.11), fp) * 0.17) * mix(0.45, 1.25, lane);
  vec3 N = normalize(vec3(-sl.x, 1., -sl.y)), R = reflect(-V, N); R.y = abs(R.y) + 1e-3;
  float fres = 1. - clamp(dot(N, V), 0., 1.), F = clamp(0.36 + 0.64 * fres * fres * fres, 0., 1.);
  vec2 sx = normalize(uSunDir.xz + vec2(1e-4, 0.)), vx = normalize(-V.xz + vec2(1e-4, 0.));
  // (what the water gives back: the sky's low colour for a ray thrown back low, its high colour for one thrown
  //  back high. TOWARD THE SUN'S BEARING THE AMBER STANDS HIGHER IN THE SKY, as the sky itself has it there (its
  //  wash over the half toward the sun), so the water under that bearing holds the west's amber from further up.)
  float az = max(dot(vx, sx), 0.), az2 = az * az, toSun = az2 * az2;
  vec3 sky = mix(uRefLo, uRefHi, smoothstep(0.03 + 0.25 * az2, 0.5 + 0.45 * az2, R.y)) + uFogSun * 0.5 * toSun * (1. - smoothstep(0., 0.6, R.y));
  // the banks: how far this water lies from the near one and from the far one, in metres
  float W = uBank.x, dN = vT * W, dF = (1. - vT) * W, wob = (sl.x + sl.y) * 22., shade;
  if (uBank.y > 0.) {
    // (a tree's image reaches as far from its bank as the ray thrown back climbs to its top; never past a third of the breadth)
    float top = uBank.y * (0.6 + 0.6 * rn(vec2(p.x * 0.045, 3.)) + 0.3 * rn(vec2(p.x * 0.19, 9.)));
    float image = (1. - smoothstep(top - 2., top + 2., dF * R.y / max(length(R.xz), 0.05) + wob)) * (1. - smoothstep(0.2 * W, 0.34 * W, dF));
    shade = max(image, 1. - smoothstep(0.3 * uBank.z, uBank.z, dN + wob * 0.5 + 6. * (rn(vec2(p.x * 0.06, 1.)) - 0.5)));
  } else shade = max(1. - smoothstep(0.3 * uBank.z, uBank.z, dN + wob * 0.2), 1. - smoothstep(0.3 * uBank.z, uBank.z, dF + wob * 0.2));
  vec3 lightNow = uSkyCol * 0.9 + uFogSun * 0.25, deep = vec3(0.025, 0.05, 0.065) + uSkyCol * 0.1;
  vec3 col = mix(deep, mix(sky, vec3(0.34, 0.25, 0.09) * (0.3 + dot(uSkyCol, vec3(0.3333))), shade), F);
  // the sun's path: under the sun's own bearing, long (the ripples throw it back from far up and down the water),
  // made of glints near to and one sheen far off
  {
    float up = max(uSunDir.y, 0.02), dv = (V.y - up) / 0.26, glint = smoothstep(0.6, 0.93, rn(p * 0.9 + vec2(uTime * 0.6, -uTime * 0.35)));
    float path = exp(-(1. - az) * mix(900., 260., lane)) * exp(-0.5 * dv * dv) * smoothstep(-0.04, 0.03, uSunDir.y);
    col += uSunCol * path * mix(4. * glint, 0.8, smoothstep(0.5, 2.5, fp)) * (1. - 0.85 * shade) * 1.5;
  }
  // reeds in the near shallows, in clumps; at the far edge a pale strand and a dark fringe of roots before it
  {
    float clump = smoothstep(0.5, 0.72, rn(vec2(p.x * 0.05, 6.))), blade = step(0.42, rn(vec2(p.x * 1.3, floor(dN * 0.7) + 2.)));
    float reed = clump * blade * (1. - smoothstep(0.35 * uBank.z, 0.5 * uBank.z, dN)) * step(0.5, uBank.y);
    col = mix(col, vec3(0.2, 0.2, 0.07) * lightNow, reed * 0.85);
    float sF = dF + 1.6 * (rn(vec2(p.x * 0.11, 5.)) - 0.5), sw = max(uBank.w, 1e-3), strand = (1. - smoothstep(0.7 * sw, sw, sF)) * step(0.01, uBank.w);
    float root = step(0.4, rn(vec2(p.x * 0.8, 2.))) * (1. - smoothstep(sw, sw + 0.6 + 2.6 * rn(vec2(p.x * 0.33, 4.)), sF)) * step(0.01, uBank.w);
    col = mix(col, vec3(0.1, 0.085, 0.05) * lightNow, root * 0.9);
    col = mix(col, vec3(0.74, 0.66, 0.5) * lightNow * (0.85 + 0.3 * rn(p * 0.4)), strand);
  }
  {
    vec2 r = p - uSwan.xy, d = uSwan.zw; float al = -dot(r, d), ab = clamp(al, 0., 80.), ac = dot(r, vec2(-d.y, d.x)) - 0.5 * uSwanK * ab * ab;
    float arm = abs(abs(ac) - al * 0.3), w = 0.9 + al * 0.035;
    float wake = (1. - smoothstep(w * 0.25, w, arm)) * step(0., al) * (1. - smoothstep(6., 70., al)) + (1. - smoothstep(0.5, 3.2, abs(ac))) * step(0., al) * (1. - smoothstep(2., 30., al)) * 0.6;
    col += (sky * 1.1 + uSkyCol * 0.5) * wake * (0.6 + 0.4 * rn(p * 0.8 + uTime * 0.6));
  }
  float fo = clamp(1. - exp(-uFogDen * uFogDen * l * l), 0., 1.);
  float sdot = dot(-V, uSunDir), s = clamp(sdot, 0., 1.); s = s * s; s = s * s;
  gl_FragColor = vec4(mix(col, mix(uFogCool, uFogCol, smoothstep(-0.55, 0.75, sdot)) + uFogSun * s * s, fo), uAlpha);
}`;

// the stream: clear shallow water running over its bed. Its ripples are measured in metres of the place and keep
// their size (three sizes, about 0.5 m, 1.1 m and 2.2 m long, each a little longer down the stream than across,
// moving down it at the water's own pace); between them the bed's stones show through; it gives back the sky over
// it (the roof is open there), the gold of the leaves along its banks and, toward the low sun, the sun's glints; it
// is white where it goes over each fall and for some metres below, and in a thin line along its banks.
// aT: -1 at one bank, 1 at the other; aF: the way the water goes there, in plan.
const STREAM_VERT = /* glsl */`${GL_PLACE}
attribute float aT; attribute vec2 aF; varying vec3 vW; varying float vT; varying vec2 vF;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gwPlaces(vW); vT = aT; vF = aF; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const STREAM_FRAG = /* glsl */`
uniform float uTime; uniform vec3 uRefLo, uRefHi; uniform float uFallZ[8];
${GL_LIGHT}
varying vec3 vW; varying float vT; varying vec2 vF;
float sh1(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float sn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f); return mix(mix(sh1(i), sh1(i+vec2(1.,0.)), f.x), mix(sh1(i+vec2(0.,1.)), sh1(i+vec2(1.,1.)), f.x), f.y); }
// the water's height at q (metres across, metres down the stream), in units of its own ripple
float ht(vec2 q, float t){
  return 0.5 * sn(vec2(q.x * 0.62 + 31., (q.y - t * 1.8) * 0.45)) + 0.32 * sn(vec2(q.x * 1.25, (q.y - t * 2.2) * 0.9)) + 0.18 * sn(vec2(q.x * 2.6 + 9., (q.y - t * 2.6) * 2.0));
}
void main(){
  gwLight();
  vec3 toC = cameraPosition - vW; float l = length(toC); vec3 V = toC / max(l, 1e-3);
  vec2 f = normalize(vF), s = vec2(-f.y, f.x), q = vec2(dot(vW.xz, s), dot(vW.xz, f));
  // the fall's own white: its face (0.8 m either side of its lip) and the broken water for 9 m below it
  float face = 0., below = 0.;
  for (int i = 0; i < 8; i++) { float dz = vW.z - uFallZ[i]; face = max(face, 1. - smoothstep(0.5, 1.1, abs(dz))); below = max(below, step(0., dz) * (1. - smoothstep(1., 9., dz))); }
  float e = 0.12, h0 = ht(q, uTime), hx = (ht(q + vec2(e, 0.), uTime) - h0) / e, hy = (ht(q + vec2(0., e), uTime) - h0) / e;
  float steep = 0.26 * (1. + 2. * below);
  vec3 N = normalize(vec3(0., 1., 0.) - vec3(s.x, 0., s.y) * hx * steep - vec3(f.x, 0., f.y) * hy * steep);
  vec3 R = reflect(-V, N); R.y = abs(R.y);
  float fres = 0.04 + 0.96 * pow(1. - clamp(dot(N, V), 0., 1.), 5.);
  // what the water gives back: the sky over the stream, the haze toward the sun low down, the banks' gold at its sides
  float sdR = dot(normalize(R), uSunDir), sR = clamp(sdR, 0., 1.);
  vec3 low = mix(uFogCool, uFogCol, smoothstep(-0.55, 0.75, sdR)) + uFogSun * sR * sR;
  vec3 sky = mix(low, uRefHi, smoothstep(0.05, 0.6, R.y));
  vec3 gold = vec3(0.80, 0.52, 0.12) * (uSunCol * 1.1 + uSkyCol * 0.8);
  // (a ripple's side slope gives back the bank it leans to, its crest and trough the sky: so the ripples show)
  float side = abs(dot(normalize(R).xz, s));
  vec3 refl = mix(sky, gold, clamp(0.75 * smoothstep(0.3, 0.95, abs(vT) + 0.35 * (sn(q * 0.4) - 0.5)) + 0.8 * smoothstep(0.1, 0.4, side), 0., 1.));
  vec3 deep = vec3(0.09, 0.20, 0.17) * (uSunCol * 0.8 + uSkyCol * 1.2);
  vec3 col = mix(deep, refl, fres);
  float glint = pow(clamp(dot(normalize(R), uSunDir), 0., 1.), 220.);
  col += uSunCol * (5. * glint + 0.35 * pow(sR, 14.));
  // white water: streaks down the fall's face, broken patches below it, a thin line at the banks
  float streak = 0.55 + 0.45 * sn(vec2(q.x * 5., (q.y - uTime * 4.) * 0.6));
  float patchy = smoothstep(0.42, 0.7, sn(vec2(q.x * 1.4, (q.y - uTime * 2.6) * 0.8)) * 0.7 + 0.5 * below);
  float edge = smoothstep(0.8, 0.97, abs(vT)) * smoothstep(0.35, 0.6, sn(vec2(q.x * 2., (q.y - uTime * 1.2) * 0.7)));
  float white = clamp(face * streak + below * patchy + 0.7 * edge, 0., 1.);
  col = mix(col, vec3(0.92, 0.95, 0.95) * (uSunCol * 0.9 + uSkyCol * 1.2 + 0.12), white);
  float alpha = clamp(mix(0.42, 0.96, fres) + white + 2. * glint, 0., 1.) * (1. - smoothstep(0.93, 1., abs(vT)));
  float fo = clamp(1. - exp(-uFogDen * uFogDen * l * l), 0., 1.);
  float sdot = dot(-V, uSunDir), sv = clamp(sdot, 0., 1.); sv = sv * sv; sv = sv * sv;
  gl_FragColor = vec4(mix(col, mix(uFogCool, uFogCol, smoothstep(-0.55, 0.75, sdot)) + uFogSun * sv * sv, fo), alpha);
}`;

// lumpy stone for the stream, from an octahedron split twice (room: false where the stone would lie in the route's
// lane; its numbers are drawn all the same, and then it is not laid)
function rockInto(sb, rng, x, y, z, r, col, room = true) {
  let V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], Fc = [[0, 2, 4], [2, 1, 4], [1, 3, 4], [3, 0, 4], [2, 0, 5], [1, 2, 5], [3, 1, 5], [0, 3, 5]];
  const mid = new Map(), m = (a, b) => { const k = a < b ? a * 1000 + b : b * 1000 + a; let i = mid.get(k); if (i === undefined) { const p = [V[a][0] + V[b][0], V[a][1] + V[b][1], V[a][2] + V[b][2]], l = Math.hypot(p[0], p[1], p[2]); i = V.length; V.push([p[0] / l, p[1] / l, p[2] / l]); mid.set(k, i); } return i; };
  const nf = []; for (const [a, b, c] of Fc) { const ab = m(a, b), bc = m(b, c), ca = m(c, a); nf.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]); } Fc = nf;
  const sq = [rng.range(0.8, 1.3), rng.range(0.5, 0.8), rng.range(0.8, 1.3)], ph = rng.range(0, 9);
  if (!room) return;
  const idx = V.map((v) => { const k = 1 + 0.22 * Math.sin(v[0] * 3.1 + ph) * Math.cos(v[2] * 2.7 + ph * 2) + 0.12 * Math.sin(v[1] * 5 + ph * 3), c = mul3(col, 0.75 + 0.3 * (v[1] * 0.5 + 0.5));
    return sb.v(x + v[0] * r * sq[0] * k, y + v[1] * r * sq[1] * k, z + v[2] * r * sq[2] * k, v[0], v[1] * 1.3, v[2], c); });
  for (const [a, b, c] of Fc) sb.tri(idx[a], idx[b], idx[c]);
}

export default {
  id: 'lamps-among-golden-leaves',
  name: 'Lamps Among the Golden Leaves',
  category: 'books',
  placeKind: 'wilderness',
  book: 'The Lord of the Rings',
  author: 'J. R. R. Tolkien, 1892 to 1973',
  media: ['air'],
  weirdness: 0.3,
  async build(ctx) {
    const { rng, noise } = ctx, vary = ctx.vary || {}, detail = (ctx.quality && ctx.quality.detail) || 1;
    const scene = new THREE.Scene();
    await ctx.yield();

    // ------------------------------------------------------------ the streams of chance: all taken here, one for each kind of thing
    const FK = {
      look: rng.fork('look'), season: rng.fork('season'), stream: rng.fork('stream'), skyA: rng.fork('skyA'), skyB: rng.fork('skyB'), hero: rng.fork('great-tree'),
    };
    await ctx.yield();
    Object.assign(FK, {
      wood: rng.fork('wood'), trees: rng.fork('trees'), canopy: rng.fork('canopy'), fallen: rng.fork('fallen'),
      stones: rng.fork('stones'), gate: rng.fork('gate'), fountain: rng.fork('fountain'), swan: rng.fork('swan'), singers: rng.fork('singers'),
      grass: rng.fork('grass'), moundFlowers: rng.fork('moundFlowers'), lawnFlowers: rng.fork('lawnFlowers'),
      fall: rng.fork('fall'), motes: rng.fork('motes'), rays: rng.fork('rays'), mist: rng.fork('mist'),
    });
    // (the streams are taken in the one order, a few at a time with a hand-back between)
    await ctx.yield();
    Object.assign(FK, {
      swifts1: rng.fork('swifts1'), swifts2: rng.fork('swifts2'), whiteBirds: rng.fork('whiteBirds'), moths: rng.fork('moths'), fireflies: rng.fork('fireflies'), ridges: rng.fork('ridges'),
    });
    await ctx.yield();
    Object.assign(FK, {
      hall: rng.fork('hall'), boleTree: rng.fork('boleTree'), guardTree: rng.fork('guardTree'), city: rng.fork('city'),
      platforms: rng.fork('platforms'), watch: rng.fork('watch'), posts: rng.fork('posts'), swiftsAt: rng.fork('swiftsAt'), hedge: rng.fork('hedge'), tall: rng.fork('tall'), way: rng.fork('way'), under: rng.fork('under'),
    });
    await ctx.yield();
    // ------------------------------------------------------------ what this visit is like
    const rv = FK.look;
    const hour = vary.hour || 'any';
    const mode = hour === 'night' ? 'night' : (hour === 'day' || hour === 'golden') ? 'late' : 'dusk';
    // the season, within the book's own cycle: deep gold, or early spring (new green opening among the gold, yellow blossom on the boughs); an even chance
    const season = FK.season.chance(0.5) ? 'spring' : 'gold';
    const hazy = rv.chance(0.4), rare = !!vary.rare, dens = clamp(vary.density ?? 1, 0.7, 1.3);
    const mix = rv.pick([[1, 1.25, 1], [1.5, 1, 0.8], [0.8, 1, 1.5], [1, 1.6, 0.7]]);
    // (the sun stands on the western rim on an evening visit, a little higher on a day's; a night visit keeps the low
    //  light of its afterglow from where the sun went down)
    const sunAz = -rv.range(17, 32), sunEl = mode === 'late' ? rv.range(9, 10.5) : mode === 'night' ? rv.range(8.5, 11.5) : rv.range(7, 8.5);
    // THE HOUR STANDS. One hour for the whole visit, the same from its first frame to its last and for a visitor who
    // stands still: A DEEP DUSK (the standing evening: the sun on the rim of the western mountains, a broad band of
    // amber and rose under long bars of cloud lit from below, deep clear blue-violet overhead and in the east with
    // the first stars), or on a night visit the standing night (the sun down, its afterglow in the west, the moon up:
    // NIGHT). Nothing of the sky, the sun, the haze or the lamps changes while we fly. The light differs by PLACE,
    // because of the place: see THE LIGHT OF A PLACE further down.
    const NIGHT = mode === 'night', LATE = mode === 'late' ? 1 : 0;

    // ------------------------------------------------------------ sky: one sky for the visit, the evening's or the night's
    // THE EVENING'S SKY HAS A STRONG GRADIENT OF ITS OWN. Overhead and in the east a deep clear blue-violet (zenith,
    // mid); low down all round a thin belt of dusty rose (horizon, hugging the rim: horizonPow); over the half of the
    // sky toward the sun the amber wash (scatter: fallen to a quarter of its strength a right angle from the sun,
    // little of it left high up), and in it the sun itself, a disc SUN_SIZE degrees in radius with a broad glow,
    // standing on the mountains' rim. The cloud is in long bars (stretch 1) lit amber-rose from below with violet
    // shade. The first stars show where the sky is dark.
    // THE NIGHT'S SKY: deep blue overhead, the afterglow low in the west, the moon up, the stars out.
    // (BARS: how much of the evening's sky the bars of cloud cover; drawn on every visit, so that the look's stream is dealt alike)
    // (BAR_SOFT, BAR_SHADE: a bar's edge and its shaded side. The edge is soft and the shade is the sky's own
    //  violet, a little lighter than the sky high up: a shaded bar is a veil on the sky, not a hole in it.)
    const SUN_SIZE = 2.3, BARS = rv.range(0.36, 0.48), BAR_SOFT = 0.7, BAR_SHADE = '#4f4a86';
    await ctx.yield();
    const sky = NIGHT
      ? makeSky({ rng: FK.skyB, preset: 'blueHour', zenith: '#17265e', mid: '#3a5a98', midPow: 1.1, horizon: '#cf9088', ground: '#2a3050', horizonPow: 4.5,
        sunElevation: -4, sunAzimuth: sunAz, scatterColor: '#ffb25c', scatter: 1.0, scatterPow: 1.7, scatterHigh: 0.3, scatterFall: 2.2, stars: 0.3, milkyWay: 0,
        bodies: [{ elevation: rv.range(24, 36), azimuth: sunAz + rv.range(95, 150), size: 2.4, phase: 0.85, color: '#fff3dc', glow: 0.3, glowColor: '#b8c4ff', glowSize: 5 }],
        clouds: false, clouds2: { coverage: 0.42, scale: 0.8, stretch: 1, softness: BAR_SOFT, opacity: 0.7, lit: '#ffb888', shade: '#5a6490' }, bake: true, renderer: ctx.renderer, quality: 0.5 })
      : makeSky({ rng: FK.skyA, preset: 'sunset', sunElevation: sunEl, sunAzimuth: sunAz, sunColor: '#ffc27a', sunSize: SUN_SIZE, sunIntensity: 12, sunGlow: 1.2, sunGlowTight: 0.35,
        zenith: '#131c50', mid: '#33448e', midPow: 1.3, horizon: '#b47888', horizonPow: 5, ground: '#20243e',
        scatterColor: '#ff9a40', scatter: 1.25 + 0.2 * LATE, scatterPow: 2.4, scatterHigh: 0.12, scatterFall: 3.2, stars: 0.5, starDensity: 0.4, milkyWay: 0,
        clouds: false, clouds2: { coverage: BARS, scale: 0.8, stretch: 1, softness: BAR_SOFT, opacity: 0.8, lit: '#f59a66', shade: BAR_SHADE }, quality: 0.5 });
    await ctx.yield();
    scene.add(sky.object);
    const rig = makeLightRig(sky, { intensity: 1, ambient: 1.1, bounce: 0.3 });
    scene.add(rig.object);
    // the haze under the wood's roof: gold toward the sun, violet-blue away from it (the distance between the far trunks)
    const fogA = new THREE.Color(hazy ? '#d9b070' : '#c9a878'), fogCoolA = new THREE.Color(hazy ? '#9aa4c4' : '#8c9cc8'), fogB = new THREE.Color('#b88c80'), fogCoolB = new THREE.Color('#9a8898'), fogDenA = hazy ? 0.0042 : 0.0032, fogDenB = 0.0011;
    scene.fog = new THREE.FogExp2(fogA.clone(), fogDenA);
    // (the one sun's direction, the light's and the shadows': where the sun stands, or at night where it went down)
    const sunDir = skyDirection(sunEl, sunAz).normalize(), sunXZ = new THREE.Vector2(sunDir.x, sunDir.z).normalize();
    await ctx.yield();

    // ------------------------------------------------------------ ground and the flight
    const stream = makeStream(FK.stream), G = makeGround(noise, stream), gy = G.height;
    await ctx.yield();
    // The route's knots, each laid by a place (the length falls where it falls):
    const pts = [], over = (x, z, c) => [x, gy(x, z) + c, z];
    // 1. the stream: over its first fall. The way to it is a straight run-in, laid last with the weave through the
    //    wood (see THE WEAVE AND THE RUN-IN below, where the rest of the route's knots are known).
    const f0 = stream.falls[0], fN = stream.falls[stream.falls.length - 1];
    // 2. through the great trunks east of the stream: 24 m from the axis of the bole that is wider than a house (it
    //    stands 42 m from the stream, 55 m above the first fall), 6 m over the ground; then toward the guard tree (60 m
    //    from the stream, 55 m before the last fall):
    //    straight from the bole's pass to the pass abreast of it, 17 m from its axis, 2 m over its platform's floor
    //    (from below, then from level); then back over the stream at its last fall
    const PASS = [], BOLE = [stream.xAt(f0.z - 55) + 42, f0.z - 55], GUARD = [stream.xAt(fN.z + 55) + 60, fN.z + 55], GUARD_H = 18;
    // (the line passes each of the three places and bends at them as the route's own curve does: of the ways tried
    //  through them this one turns the least in all, and where it turns sharply the pace is cut)
    {
      const pB = over(BOLE[0] - 24, BOLE[1], 6), pG = [GUARD[0] - 17, gy(GUARD[0], GUARD[1]) + GUARD_H + 2, GUARD[1]], pF = [stream.xAt(fN.z), stream.bedAt(fN.z - 1.5) + 9, fN.z];
      PASS.push([stream.xAt(f0.z), stream.bedAt(f0.z - 1.5) + 7.5, f0.z], pB, pG, pF);
    }
    // 3. the mound. The line runs straight from the last fall to touch, on the mound's west side, the circle half way
    //    between its two rings (RING_BETWEEN from the middle tree: the gold ring's trunks 8 m to our right, the white
    //    ring's 8 m to our left with the low sun behind them), 9 m over the grass up the slope and over the top (a
    //    knot every 25 m or less). FROM THE PLACE WHERE IT TOUCHES THAT CIRCLE IT COMES ONTO THE ROAD'S LINE BY TWO
    //    EQUAL WIDE ARCS, the first bending toward the middle tree, the second back onto the road's own heading:
    //    the widest pair that reaches the road by the mound's foot (MOUND_FOOT_R from the middle tree; some 200 m
    //    of radius; a knot every tenth of a radian or less). The line only touches that circle
    //    and does not follow it: it has no bend of the circle's own 30 m on the mound's top and no bend back.
    //    From the touching place on, the line falls in one eased curve to the
    //    first outpost's height, with the city's hill before it.
    // THE RIDE COMES DOWN TO THE GATE IN ONE DESCENT. Its two ends are taken from the ground: RIDE_HIGH over the road
    // abreast of the first outpost (level with its platform) and GATE_OVER over the ground under the gate's garland.
    // Every knot between them (abreast of the second outpost, over the fosse's near brink) stands on the straight
    // between those two heights at its own place along the road (rideAt), and never lower than OVER_GRASS over its
    // own ground: so the line has no rise before the gate and the flight does not nod there.
    const RIDE_HIGH = 26, GATE_OVER = 7, OVER_GRASS = 9, OUT1 = over(roadX(OUTPOST[0][1]), OUTPOST[0][1], RIDE_HIGH), GATE_AT = over(GATE_X, GATE_Z, GATE_OVER);
    const rideAt = (z) => { const x = roadX(z); return [x, Math.max(lerp(OUT1[1], GATE_AT[1], (OUT1[2] - z) / (OUT1[2] - GATE_Z)), gy(x, z) + OVER_GRASS), z]; };
    const OUT2 = rideAt(OUTPOST[1][1]), ROUND0 = [0, 0], LEAVE = [0, 0];
    // (a change of height A over a length L that begins at slope s0 and ends at slope s1 and nowhere bends more
    //  sharply than a circle of radius R: the slope turns at 1 / R to the one steady slope that makes up A, holds it,
    //  and turns at 1 / R to s1. Returns the height gained at a distance along it.)
    const easeRun = (L, A, s0, s1, R) => {
      const n = Math.max(8, Math.ceil(L)), ds = L / n, run = (g) => {
        const h = [0]; let sl = s0;
        for (let i = 0; i < n; i++) {
          const left = L - (i + 0.5) * ds, want = Math.abs(sl - s1) * R >= left ? s1 : g, nx = sl + clamp(want - sl, -ds / R, ds / R);
          h.push(h[i] + (sl + nx) / 2 * ds); sl = nx;
        }
        return h;
      };
      let lo = -3, hi = 3; for (let k = 0; k < 40; k++) { const g = (lo + hi) / 2; if (run(g)[n] < A) lo = g; else hi = g; }
      const h = run((lo + hi) / 2);
      return (s) => { const x = clamp(s / ds, 0, n), i = Math.min(n - 1, Math.floor(x)); return h[i] + (h[i + 1] - h[i]) * (x - i); };
    };
    // (vx, vz: the corner's own point at the last fall, from which the straight is laid; pA: the knot before the first of these)
    // (out2: the ride's second knot, on whose slope the way down ends: the flown ride's, or the reference ride's)
    const moundKnots = (vx, vz, pA, out2 = OUT2) => {
      const pts = [], dF = Math.hypot(vx - MX, vz - MZ), RB = RING_BETWEEN;
      // (b0: where the straight from the fall touches the circle; h0: the line's heading there, along the circle; n0:
      //  from there to the middle tree; u: the road's heading, from the middle tree to the first outpost's place on
      //  it; w: square to the road, on the middle tree's side of the touching place)
      const b0 = Math.atan2(vx - MX, vz - MZ) - Math.acos(RB / dF), T0 = [MX + Math.sin(b0) * RB, MZ + Math.cos(b0) * RB];
      const h0 = [-Math.cos(b0), Math.sin(b0)], n0 = [-Math.sin(b0), -Math.cos(b0)], dOut = Math.hypot(OUT1[0] - MX, OUT1[2] - MZ), ux = (OUT1[0] - MX) / dOut, uz = (OUT1[2] - MZ) / dOut;
      const th = Math.atan2(ux * n0[0] + uz * n0[1], ux * h0[0] + uz * h0[1]), ws = Math.sign(-uz * n0[0] + ux * n0[1]) || 1, wx = -uz * ws, wz = ux * ws;
      // (the two arcs of radius R, the first turning by al toward the middle tree, the second by al - th the other
      //  way, which leaves the line on the road's heading: where the first ends, where the second ends, how far
      //  that is to the side of the road's line and how far along it from the middle tree)
      const arcs = (R, al) => {
        const be = al - th, ca = Math.cos(al), sa = Math.sin(al), h1 = [h0[0] * ca + n0[0] * sa, h0[1] * ca + n0[1] * sa], n1 = [n0[0] * ca - h0[0] * sa, n0[1] * ca - h0[1] * sa];
        const P1 = [T0[0] + R * (n0[0] * (1 - ca) + h0[0] * sa), T0[1] + R * (n0[1] * (1 - ca) + h0[1] * sa)], cb = Math.cos(be), sb = Math.sin(be);
        const P2 = [P1[0] + R * (n1[0] * (cb - 1) + h1[0] * sb), P1[1] + R * (n1[1] * (cb - 1) + h1[1] * sb)];
        return { be, h1, n1, P1, P2, side: (P2[0] - MX) * wx + (P2[1] - MZ) * wz, on: (P2[0] - MX) * ux + (P2[1] - MZ) * uz };
      };
      // (for a radius, the first turn that ends on the road's line; the radius: the widest that ends by the mound's foot)
      const onRoad = (R) => { let lo = Math.max(0, th), hi = 1.5; for (let k = 0; k < 40; k++) { const al = (lo + hi) / 2; if (arcs(R, al).side < 0) lo = al; else hi = al; } return (lo + hi) / 2; };
      let rLo = RB, rHi = 2000; for (let k = 0; k < 40; k++) { const R = (rLo + rHi) / 2; if (arcs(R, onRoad(R)).on > MOUND_FOOT_R) rHi = R; else rLo = R; }
      const RHO = rLo, AL = onRoad(RHO), A = arcs(RHO, AL), dOn = A.on;
      // (the straight up the slope: the height goes over from the fall's own to OVER_GRASS over the ground across the first 40 m)
      const run = Math.hypot(T0[0] - pA[0], T0[1] - pA[2]), nS = Math.ceil(run / 25);
      for (let k = 1; k < nS; k++) { const f = k / nS, x = lerp(pA[0], T0[0], f), z = lerp(pA[2], T0[1], f); pts.push([x, lerp(lerp(pA[1], gy(x, z) + OVER_GRASS, f), gy(x, z) + OVER_GRASS, smoothstep(0, 40, f * run)), z]); }
      pts.push(over(T0[0], T0[1], OVER_GRASS));
      // (the way down: from the touching place along the two arcs and the road to the first outpost, the height
      //  falling in one eased curve that begins level and ends on the slope of the ride between the outposts; it
      //  bends upright no more sharply than the arcs do in plan, or as the widest bend that fits its length: L * L / (4 A))
      const yTop = pts[pts.length - 1][1], s1 = AL * RHO, s2 = A.be * RHO, sAll = s1 + s2 + Math.max(dOut - dOn, 0), down = yTop - OUT1[1];
      const rideSlope = (out2[1] - OUT1[1]) / Math.hypot(out2[0] - OUT1[0], out2[2] - OUT1[2]);
      const fall = easeRun(sAll, -down, 0, rideSlope, Math.min(RHO, 0.95 * sAll * sAll / (4 * Math.max(Math.abs(down), 0.5))));
      const nA = Math.max(1, Math.ceil(AL / 0.1)), nB = Math.max(1, Math.ceil(A.be / 0.1)), TL = [A.P1[0], A.P1[1]]; let left = false;
      for (let k = 1; k <= nA; k++) {
        const a = AL * k / nA, x = T0[0] + RHO * (n0[0] * (1 - Math.cos(a)) + h0[0] * Math.sin(a)), z = T0[1] + RHO * (n0[1] * (1 - Math.cos(a)) + h0[1] * Math.sin(a));
        pts.push([x, yTop + fall(RHO * a), z]);
        // (where the rings are left: the first knot outside the white ring, or the first arc's end)
        if (!left && Math.hypot(x - MX, z - MZ) > RING_WHITE) { left = true; TL[0] = x; TL[1] = z; }
      }
      for (let k = 1; k <= nB; k++) { const a = A.be * k / nB; pts.push([A.P1[0] + RHO * (A.n1[0] * (Math.cos(a) - 1) + A.h1[0] * Math.sin(a)), yTop + fall(s1 + RHO * a), A.P1[1] + RHO * (A.n1[1] * (Math.cos(a) - 1) + A.h1[1] * Math.sin(a))]); }
      // (on the road from where the second arc meets it to the first outpost: a knot every 30 m or less)
      const nD = Math.ceil(Math.max(dOut - dOn, 1) / 30);
      for (let k = 1; k < nD; k++) { const d = lerp(dOn, dOut, k / nD); pts.push([MX + ux * d, yTop + fall(s1 + s2 + d - dOn), MZ + uz * d]); }
      ROUND0[0] = T0[0]; ROUND0[1] = T0[1]; LEAVE[0] = TL[0]; LEAVE[1] = TL[1];
      return pts;
    };
    // 4. the ride: on the road's line abreast of each outpost, over the fosse's near brink, and under the gate: one
    //    even descent from the first outpost's height to the gate's (see rideAt)
    await ctx.yield();
    const BRINK_Z = CZ + 208, FOSSE_DEPTH = 8.2, FOSSE_WATER = 2.4 - FOSSE_DEPTH + 1.6;
    pts.push(OUT1, OUT2, rideAt(BRINK_Z), GATE_AT);
    const GATE_K = pts.length - 1;
    // 5. the lawn: 21 m west of the fountain, on the hill's own line from the gate to the great tree, 12 m over the grass
    const FOUNT = [61, gy(61, -721), -721], lawnK = over(FOUNT[0] - 21, FOUNT[2], 12);
    pts.push(lawnK);
    // 6. up round the great tree, in its own frame (hl: a point of that frame in the world; bearings fall as we go,
    //    the trunk on our right all the way):
    //    from the lawn's knot straight to the round, touching it where it is ROUND_R0 wide; ONE ROUND about the trunk,
    //    closing evenly with the bearing to ROUND_R1; off it on the straight that touches the turn's circle too, out
    //    toward the west over the lesser crowns; back on the turn's circle onto the hall's line; the last LAST_RUN
    //    metres straight at the ring. The line rises from the lawn's knot to the turn's beginning by the metres flown
    //    (one eased slope: it leaves the lawn on the slope it came with and comes level at the turn; nowhere does it
    //    bend upright more sharply than the round's own circle) and is level from the turn on, at the hall's height.
    const hl = (x, y, z) => [CX - x, y, CZ - z];
    const CLIMB = {};
    {
      const pol = (psi, r) => [Math.sin(psi) * r, Math.cos(psi) * r], run = [];
      const gateK = pts[GATE_K], lx = CX - lawnK[0], lz = CZ - lawnK[2], r0 = Math.hypot(lx, lz), p0 = Math.atan2(lx, lz);
      // (the turn's centre; hd: the heading's bearing on the straight that touches both circles; pJ, pE: the bearings
      //  at which the round is joined and left; TS: where the turn begins)
      const tc = [HERO.lineX + TURN_RHO, TURN_ZC], tcl = Math.hypot(tc[0], tc[1]), hd = Math.atan2(tc[0], tc[1]) - Math.asin((ROUND_R1 - TURN_RHO) / tcl);
      const pJ = p0 - Math.acos(ROUND_R0 / r0), pE = hd + Math.PI / 2 - TAU, J = pol(pJ, ROUND_R0), E = pol(pE, ROUND_R1);
      const tl = Math.sqrt(tcl * tcl - (ROUND_R1 - TURN_RHO) * (ROUND_R1 - TURN_RHO)), TS = [E[0] + Math.sin(hd) * tl, E[1] + Math.cos(hd) * tl];
      // (each entry: local x, local z, and whether it rises (1) or is level (0). The leg to the round: a knot every
      //  25 m or less; the round: every 0.15 radian or less; the straight out: every 20 m or less; the turn: every
      //  0.15 radian or less; then the straight: a knot LAST_STEP on, and every 15 m or less to the ring)
      { const d = Math.hypot(J[0] - lx, J[1] - lz), n = Math.ceil(d / 25); for (let k = 1; k < n; k++) run.push([lerp(lx, J[0], k / n), lerp(lz, J[1], k / n), 1]); }
      const iJ = run.length;
      { const n = Math.ceil((pJ - pE) / 0.15); for (let k = 0; k <= n; k++) { const f = k / n; run.push([...pol(lerp(pJ, pE, f), lerp(ROUND_R0, ROUND_R1, smoothstep(0, ROUND_CLOSE, f))), 1]); } }
      const iE = run.length - 1;
      { const n = Math.ceil(tl / 20); for (let k = 1; k <= n; k++) run.push([lerp(E[0], TS[0], k / n), lerp(E[1], TS[1], k / n), 1]); }
      const iT = run.length - 1;
      { const b0 = hd + Math.PI / 2, b1 = -Math.PI / 2, nb = Math.ceil((b0 - b1) / 0.15); for (let k = 1; k <= nb; k++) { const b = lerp(b0, b1, k / nb); run.push([tc[0] + Math.sin(b) * TURN_RHO, tc[1] + Math.cos(b) * TURN_RHO, 0]); } }
      for (let k = 0, nk = Math.ceil(LAST_RUN / 15); k <= nk; k++) run.push([HERO.lineX, HERO.seatZ + LAST_RUN * (1 - k / nk), 0]);
      // heights: by the metres flown in plan from the lawn's knot to the turn's beginning
      const seg = (i) => Math.hypot(run[i][0] - (i ? run[i - 1][0] : lx), run[i][1] - (i ? run[i - 1][1] : lz));
      let sUp = 0; run.forEach((q, i) => { if (q[2]) sUp += seg(i); });
      const slopeIn = (lawnK[1] - gateK[1]) / Math.hypot(lawnK[0] - gateK[0], lawnK[2] - gateK[2]), rise = easeRun(sUp, WALK_Y - lawnK[1], slopeIn, 0, ROUND_R1);
      let c = 0; const k0 = pts.length;
      run.forEach((q, i) => { if (q[2]) c += seg(i); pts.push(hl(q[0], q[2] ? lawnK[1] + rise(c) : WALK_Y, q[1])); });
      // (the places of the climb in the world: where the round is joined and left, and where the turn begins)
      CLIMB.join = pts[k0 + iJ]; CLIMB.out = pts[k0 + iE]; CLIMB.turn = pts[k0 + iT];
      CLIMB.pJ = pJ; CLIMB.pE = pE; CLIMB.hd = hd;
    }
    // THE WEAVE AND THE RUN-IN, laid last (the run-in's length takes the route's own).
    // A visitor comes in at the speed the last world left him (a first world begins at the mean), and the engine
    // brings that speed to this world's pace by EASE a second. So the route begins with a straight: over the stream's
    // water, straight for RUN_IN metres, and only then the first corner. RUN_IN is what the engine flies in two of
    // its easing's time constants (2 / EASE s) coming from V_IN, V_IN_K of the mean (its own limit on any world's
    // pace), down to the wood's pace at its fastest (PACE_TOP of the mean): after that an eighth of the excess is
    // left, and the cap on the first corner is worked from all three entries (see the pace). The mean is the route's
    // length over its seconds: the knots' own length from the first fall on, on plain legs, and the run-in.
    // THE WEAVE through the wood has four corners, at its four places (PASS). Each is rounded by the widest circle
    // its two legs allow (the two corners at a leg's ends share it so that the leg gives both the same radius; the
    // first corner's leg in is the run-in, which is as long as it needs to be; the last has half of the straight to
    // the mound), and no wider than WEAVE_R, on which the wood's fastest pace turns
    // the line by OMEGA a second. What a corner costs in seconds is its angle over OMEGA, whatever its circle, so the
    // angles are left as the places give them: the circle goes by on the corner's inner side, d = R (sec(th/2) - 1)
    // from the place (tried: the corner's point set outward until the circle's apex was the place itself; the angles
    // at the guard tree and the last fall grew by half and the film no longer fitted its seconds).
    // A knot at each end of a circle and every 0.15 radian or less on it; heights run evenly from place to place.
    await ctx.yield();
    const DUR = 50, PACE_TOP = 1.5, V_IN_K = 2.5, EASE = 1.4, OMEGA = 29;
    let RUN_IN = 0, REF_LEN = 0;
    {
      const later = pts.splice(0), n = PASS.length, pF = PASS[n - 1];
      const len3 = (a) => { let s = 0; for (let i = 1; i < a.length; i++) s += Math.hypot(a[i][0] - a[i - 1][0], a[i][1] - a[i - 1][1], a[i][2] - a[i - 1][2]); return s; };
      const secs = (PACE_TOP * 2 + (V_IN_K - PACE_TOP) * (1 - Math.exp(-2))) / EASE;
      // (the length the run-in and the weave are laid for: the knots' own to the gate, and REF_CLIMB. It is taken
      //  over THE REFERENCE RIDE, not the flown one: REF_RIDE[0] over the road abreast of the second outpost and
      //  REF_RIDE[1] over the fosse's near brink, a ride some two metres longer than the flown descent. The plan
      //  of the wood hangs on this length through the run-in, and a plan must not move because a height did: so
      //  the length is laid on heights of its own, which nothing flies.)
      const REF_RIDE = [14, 2 * FOSSE_DEPTH], ref2 = over(roadX(OUTPOST[1][1]), OUTPOST[1][1], REF_RIDE[0]);
      REF_LEN = len3([...PASS, ...moundKnots(pF[0], pF[2], pF, ref2), OUT1, ref2, over(roadX(BRINK_Z), BRINK_Z, REF_RIDE[1]), GATE_AT]) + REF_CLIMB;
      RUN_IN = secs * REF_LEN / (DUR - secs);
      await ctx.yield();
      const WEAVE_R = PACE_TOP * (RUN_IN / secs) / (OMEGA * Math.PI / 180);
      const tangentOf = (vx, vz) => { const b = Math.atan2(vx - MX, vz - MZ) - Math.acos(RING_BETWEEN / Math.hypot(vx - MX, vz - MZ)); return [MX + Math.sin(b) * RING_BETWEEN, MZ + Math.cos(b) * RING_BETWEEN]; };
      const V = PASS.map((p) => [p[0], p[2]]), C = [];
      let S0 = [0, 0], lead = RUN_IN;
      // (the beginning lies on the stream, the run-in and the first circle's own length below the first fall, and
      //  that length turns with the beginning: four rounds settle it, and the circles are taken once more from the
      //  beginning as it then stands)
      for (let it = 0; it < 5; it++) {
        const zs = V[0][1] + lead; S0 = [stream.xAt(zs), zs];
        const Q = [S0, ...V, tangentOf(V[n - 1][0], V[n - 1][1])];
        for (let i = 1; i <= n; i++) {
          const ax = Q[i][0] - Q[i - 1][0], az = Q[i][1] - Q[i - 1][1], bx = Q[i + 1][0] - Q[i][0], bz = Q[i + 1][1] - Q[i][1], la = Math.hypot(ax, az), lb = Math.hypot(bx, bz);
          const th = Math.acos(clamp((ax * bx + az * bz) / (la * lb), -1, 1)), tn = Math.max(Math.tan(th / 2), 1e-4);
          let ox = ax / la - bx / lb, oz = az / la - bz / lb; const ol = Math.hypot(ox, oz) || 1;
          C[i - 1] = { th, tn, la, lb, ox: ox / ol, oz: oz / ol, ix: ax / la, iz: az / la };
        }
        for (let i = 0; i < n; i++) {
          const c = C[i], rIn = i ? c.la / (c.tn + C[i - 1].tn) : WEAVE_R, rOut = i < n - 1 ? c.lb / (c.tn + C[i + 1].tn) : c.lb / 2 / c.tn;
          c.R = Math.min(WEAVE_R, rIn, rOut); c.t = c.R * c.tn;
        }
        if (it === 4) break;
        lead = RUN_IN + C[0].t;
      }
      // the knots in plan, each with its metres from the beginning
      await ctx.yield();
      const plan = [[S0[0], S0[1], 0]], apexS = [];
      let s = 0, cur = S0;
      for (let i = 0; i < n; i++) {
        const c = C[i], v = V[i], p0 = [v[0] - c.ix * c.t, v[1] - c.iz * c.t], run = Math.hypot(p0[0] - cur[0], p0[1] - cur[1]);
        if (i === 0) plan.push([(cur[0] + p0[0]) / 2, (cur[1] + p0[1]) / 2, run / 2]);
        s += run;
        if (c.R * c.th < 1) { plan.push([v[0], v[1], s + c.t]); apexS.push(s + c.t); s += 2 * c.t; cur = v; continue; }
        // (the circle's middle lies on the corner's inner side, square to the leg in)
        const px = -c.ox, pz = -c.oz, dot = px * c.ix + pz * c.iz, qx = px - c.ix * dot, qz = pz - c.iz * dot, ql = Math.hypot(qx, qz) || 1, ux = qx / ql, uz = qz / ql;
        const mx = p0[0] + ux * c.R, mz = p0[1] + uz * c.R, na = Math.max(1, Math.ceil(c.th / 0.15));
        // (where two circles share a leg whole, the one's last knot is the other's first: it is laid once)
        for (let k = 0; k <= na; k++) { const f = c.th * k / na; cur = [mx - ux * c.R * Math.cos(f) + c.ix * c.R * Math.sin(f), mz - uz * c.R * Math.cos(f) + c.iz * c.R * Math.sin(f)]; if (k > 0 || run > 2) plan.push([cur[0], cur[1], s + c.R * f]); }
        apexS.push(s + c.R * c.th / 2); s += c.R * c.th;
      }
      const hs = [[0, stream.bedAt(S0[1]) + 7.5], ...apexS.map((a, i) => [a, PASS[i][1]])];
      const yOf = (m) => { let k = 1; while (k < hs.length - 1 && hs[k][0] < m) k++; return lerp(hs[k - 1][1], hs[k][1], clamp((m - hs[k - 1][0]) / Math.max(hs[k][0] - hs[k - 1][0], 1e-3), 0, 1)); };
      for (const q of plan) pts.push([q[0], yOf(q[2]), q[1]]);
      pts.push(...moundKnots(V[n - 1][0], V[n - 1][1], pts[pts.length - 1]), ...later);
    }
    // (a hand-back before the route's line is made from its knots: laying the knots was a step's work)
    await ctx.yield();
    const path = makePath(pts), LEN = path.length;
    await ctx.yield();
    // dense samples of the route: the clearance tests
    const PS = []; { const v = new THREE.Vector3(), n = Math.ceil(LEN / 2.5); for (let i = 0; i <= n; i++) { path.pointAt(i / n, v); PS.push(v.x, v.y, v.z); if (i % 16 === 15 || i === 0) await ctx.yield(); } }
    const NS = PS.length / 3;
    await ctx.yield();
    // the samples in runs of twelve, each with its box, so a question about a far point costs a few boxes instead of every sample
    const RUN = 12, NR = Math.ceil(NS / RUN), RB = new Float32Array(NR * 6);
    for (let c = 0; c < NR; c++) {
      let x0 = Infinity, y0 = Infinity, z0 = Infinity, x1 = -Infinity, y1 = -Infinity, z1 = -Infinity;
      for (let i = c * RUN * 3, e = Math.min(NS, (c + 1) * RUN) * 3; i < e; i += 3) { x0 = Math.min(x0, PS[i]); x1 = Math.max(x1, PS[i]); y0 = Math.min(y0, PS[i + 1]); y1 = Math.max(y1, PS[i + 1]); z0 = Math.min(z0, PS[i + 2]); z1 = Math.max(z1, PS[i + 2]); }
      RB.set([x0, y0, z0, x1, y1, z1], c * 6);
    }
    await ctx.yield();
    const gap = (v, a, b) => (v < a ? a - v : v > b ? v - b : 0);
    const boxD2 = (c, x, y, z) => { const o = c * 6, dx = gap(x, RB[o], RB[o + 3]), dy = gap(y, RB[o + 1], RB[o + 4]), dz = gap(z, RB[o + 2], RB[o + 5]); return dx * dx + dy * dy + dz * dz; };
    // (a plan of QC m squares, each with the runs whose boxes come within QR of it: a question that reaches no further
    // than QR asks only the runs of its own square, and none at all outside the plan; the answers are the same)
    const QR = 48, QC = 24, ALL_RUNS = Array.from({ length: NR }, (_, c) => c);
    let qx0 = Infinity, qz0 = Infinity, qx1 = -Infinity, qz1 = -Infinity;
    for (let c = 0; c < NR; c++) { qx0 = Math.min(qx0, RB[c * 6] - QR); qx1 = Math.max(qx1, RB[c * 6 + 3] + QR); qz0 = Math.min(qz0, RB[c * 6 + 2] - QR); qz1 = Math.max(qz1, RB[c * 6 + 5] + QR); }
    const qnx = Math.ceil((qx1 - qx0) / QC), qnz = Math.ceil((qz1 - qz0) / QC), cellRuns = Array.from({ length: qnx * qnz }, () => null);
    for (let c = 0; c < NR; c++) {
      const a0 = Math.max(0, Math.floor((RB[c * 6] - QR - qx0) / QC)), a1 = Math.min(qnx - 1, Math.floor((RB[c * 6 + 3] + QR - qx0) / QC)), b0 = Math.max(0, Math.floor((RB[c * 6 + 2] - QR - qz0) / QC)), b1 = Math.min(qnz - 1, Math.floor((RB[c * 6 + 5] + QR - qz0) / QC));
      for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) (cellRuns[b * qnx + a] || (cellRuns[b * qnx + a] = [])).push(c);
    }
    const NO_RUNS = [];
    const runsAt = (x, z) => { const a = Math.floor((x - qx0) / QC), b = Math.floor((z - qz0) / QC); return a < 0 || b < 0 || a >= qnx || b >= qnz ? NO_RUNS : cellRuns[b * qnx + a] || NO_RUNS; };
    // (clearance questions since the last hand-back (work the builders do not count))
    let asked = 0;
    const pathClear = (x, y, z, r) => {
      const r2 = (r + 6) * (r + 6), L = r + 6 <= QR ? runsAt(x, z) : ALL_RUNS; asked++;
      for (let k = 0; k < L.length; k++) {
        const c = L[k]; if (boxD2(c, x, y, z) > r2) continue;
        for (let i = c * RUN * 3, e = Math.min(NS, (c + 1) * RUN) * 3; i < e; i += 3) { const dx = PS[i] - x, dy = PS[i + 1] - y, dz = PS[i + 2] - z; if (dx * dx + dy * dy + dz * dz <= r2) return false; }
      }
      return true;
    };
    // nearest sample in plan among those lower than yMax: { d, u, y }
    // (The run that held the last answer is asked first: the next place asked is most often by the last one, and
    //  with a near sample in hand nearly every other run's box is passed by. The answer is the same as from asking
    //  the runs in their order: the nearest sample, and of two equally near the earlier one on the route.)
    let nearRun = 0;
    const pathNear = (x, z, yMax = Infinity) => {
      let b = Infinity, bi = 0;
      for (let k = -1; k < NR; k++) {
        const c = k < 0 ? nearRun : k; if (k === nearRun) continue;
        const o = c * 6; if (RB[o + 1] > yMax) continue;
        const bx = gap(x, RB[o], RB[o + 3]), bz = gap(z, RB[o + 2], RB[o + 5]); if (bx * bx + bz * bz > b) continue;
        for (let i = c * RUN * 3, e = Math.min(NS, (c + 1) * RUN) * 3; i < e; i += 3) { if (PS[i + 1] > yMax) continue; const dx = PS[i] - x, dz = PS[i + 2] - z, d = dx * dx + dz * dz; if (d < b || (d === b && i < bi)) { b = d; bi = i; } }
      }
      nearRun = Math.floor(bi / 3 / RUN);
      return { d: Math.sqrt(b), u: bi / 3 / (NS - 1), y: PS[bi + 1] };
    };
    // (is any sample of the route within D of the place, in plan: the same answer as pathNear(x, z).d < D, without
    //  looking for the nearest; the run that said yes last is asked first)
    let withinRun = 0;
    const pathWithin = (x, z, D) => {
      const D2 = D * D;
      for (let k = -1; k < NR; k++) {
        const c = k < 0 ? withinRun : k; if (k === withinRun) continue;
        const o = c * 6, bx = gap(x, RB[o], RB[o + 3]), bz = gap(z, RB[o + 2], RB[o + 5]); if (bx * bx + bz * bz >= D2) continue;
        for (let i = c * RUN * 3, e = Math.min(NS, (c + 1) * RUN) * 3; i < e; i += 3) { const dx = PS[i] - x, dz = PS[i + 2] - z; if (dx * dx + dz * dz < D2) { withinRun = c; return true; } }
      }
      return false;
    };
    // (the highest the line goes within D of the place in plan; -Infinity where it does not come within D)
    const lineTop = (x, z, D) => {
      let top = -Infinity; const D2 = D * D;
      for (let c = 0; c < NR; c++) {
        const o = c * 6, bx = gap(x, RB[o], RB[o + 3]), bz = gap(z, RB[o + 2], RB[o + 5]); if (bx * bx + bz * bz > D2 || RB[o + 4] <= top) continue;
        for (let i = c * RUN * 3, e = Math.min(NS, (c + 1) * RUN) * 3; i < e; i += 3) { const dx = PS[i] - x, dz = PS[i + 2] - z; if (dx * dx + dz * dz <= D2 && PS[i + 1] > top) top = PS[i + 1]; }
      }
      return top;
    };
    // (the lowest the line goes within D of the place in plan; Infinity where it does not come within D)
    const lineLow = (x, z, D) => {
      let low = Infinity; const D2 = D * D;
      for (let c = 0; c < NR; c++) {
        const o = c * 6, bx = gap(x, RB[o], RB[o + 3]), bz = gap(z, RB[o + 2], RB[o + 5]); if (bx * bx + bz * bz > D2 || RB[o + 1] >= low) continue;
        for (let i = c * RUN * 3, e = Math.min(NS, (c + 1) * RUN) * 3; i < e; i += 3) { const dx = PS[i] - x, dz = PS[i + 2] - z; if (dx * dx + dz * dz <= D2 && PS[i + 1] < low) low = PS[i + 1]; }
      }
      return low;
    };
    // ------------------------------------------------------------ the lane and the portal's ring, for the test of what gets made
    // Trees keep their boughs, lamps and leaves clear of the route as they grow (pathClear). Everything else (platforms
    // and their struts, ladders, the gate, the bridge, stairs, stones, the great tree's own parts, far canopy) is
    // asked once it is made, on this visit's own layout and at the even 2.5 m samples of the route: nothing may stand
    // within LANE of the eye's line or inside the portal's ring (see kit.sweep for what happens to a thing that does).
    await ctx.yield();
    const REACH = LANE + 12, GC = 4, gx0 = Math.min(...PS.filter((v, i) => i % 3 === 0)) - REACH, gz0 = Math.min(...PS.filter((v, i) => i % 3 === 2)) - REACH;
    const gnx = Math.ceil((Math.max(...PS.filter((v, i) => i % 3 === 0)) + REACH - gx0) / GC), gnz = Math.ceil((Math.max(...PS.filter((v, i) => i % 3 === 2)) + REACH - gz0) / GC);
    const laneLo = new Float32Array(gnx * gnz).fill(Infinity), laneHi = new Float32Array(gnx * gnz).fill(-Infinity);
    // (cornerLo, cornerHi: the same plan for a bare point, a corner of a solid thing, which can be in the way only
    //  within the lane's width of a sample of the route, or within CORNER of the last one: the ring's radius and its
    //  lane's half depth. Most corners of what stands by the way are further off than that and are asked nothing more.)
    const CORNER = Math.max(LANE, PORTAL_R + 0.3 + 2.5), cornerLo = new Float32Array(gnx * gnz).fill(Infinity), cornerHi = new Float32Array(gnx * gnz).fill(-Infinity);
    {
      const span = Math.ceil(REACH / GC), spanLane = Math.ceil(LANE / GC), spanEnd = Math.ceil(CORNER / GC);
      const mark = (i, lo, hi, span) => {
        const cx = Math.floor((PS[i] - gx0) / GC), cz = Math.floor((PS[i + 2] - gz0) / GC), y = PS[i + 1];
        for (let a = Math.max(0, cz - span); a <= Math.min(gnz - 1, cz + span); a++) for (let b = Math.max(0, cx - span); b <= Math.min(gnx - 1, cx + span); b++) { const c = a * gnx + b; if (y < lo[c]) lo[c] = y; if (y > hi[c]) hi[c] = y; }
      };
      for (let i = 0; i < PS.length; i += 3) { mark(i, laneLo, laneHi, span); mark(i, cornerLo, cornerHi, i >= PS.length - 3 ? spanEnd : spanLane); }
    }
    await ctx.yield();
    const endP = path.pointAt(1), endT = path.tangentAt(1);
    // THE ENTRY AXIS BEHIND THE ENTRY IS KEPT AS THE ROUTE IS. The camera that draws this world in the opening of the
    // world before it flies the route's first tangent continued backward, level, at the entry's height, from far
    // behind: BACK_AXIS m of that axis have the lane's room, as every metre of the route has (backNear: is the
    // place within r of it). BACK_AXIS is the far wood's whole breadth (twice FAR_WOOD, the reach of the far wood
    // about its middle): no trunk of the wood, near or far, stands further behind the entry than that, so the lane
    // is kept along the whole of that line to the wood's last trunk, wherever the entry lies in the wood.
    // backOf is how far behind the entry a place lies along the axis, backSide how far to its side.
    // (What lies under that axis: the fine floor to the lattice's edge, the floor's fall behind it (BACK_FALL, where
    //  the ground is laid) and the far ground from there on, all of them under the entry's height.)
    const FAR_WOOD = 1050, BACK_AXIS = 2 * FAR_WOOD, backP = path.pointAt(0), backT = path.tangentAt(0); backT.y = 0; backT.normalize();
    const backOf = (x, z) => -((x - backP.x) * backT.x + (z - backP.z) * backT.z), backSide = (x, z) => (z - backP.z) * backT.x - (x - backP.x) * backT.z;
    const backNear = (x, y, z, r) => { const al = clamp(backOf(x, z), 0, BACK_AXIS), ex = x - backP.x + backT.x * al, ey = y - backP.y, ez = z - backP.z + backT.z * al; return ex * ex + ey * ey + ez * ez < r * r; };
    const blocked = (x, y, z, r) => {
      if (backNear(x, y, z, LANE + r)) return true;
      const cx = Math.floor((x - gx0) / GC), cz = Math.floor((z - gz0) / GC); if (cx < 0 || cz < 0 || cx >= gnx || cz >= gnz) return false;
      const c = cz * gnx + cx; if (y < laneLo[c] - REACH || y > laneHi[c] + REACH) return false;
      if (!pathClear(x, y, z, LANE + r - 6)) return true;
      const dx = x - endP.x, dy = y - endP.y, dz = z - endP.z, al = dx * endT.x + dy * endT.y + dz * endT.z; if (Math.abs(al) > 2.5 + r) return false;
      return Math.sqrt(Math.max(dx * dx + dy * dy + dz * dz - al * al, 0)) < PORTAL_R + 0.3 + r;
    };
    const blockedCorner = (x, y, z) => {
      if (backNear(x, y, z, LANE)) return true;
      const cx = Math.floor((x - gx0) / GC), cz = Math.floor((z - gz0) / GC); if (cx < 0 || cz < 0 || cx >= gnx || cz >= gnz) return false;
      const c = cz * gnx + cx; if (y < cornerLo[c] - CORNER || y > cornerHi[c] + CORNER) return false;
      return blocked(x, y, z, 0);
    };
    await ctx.yield();
    const sweptAll = { cards: 0, lamps: 0, triangles: 0 }, tally = (q) => { if (q) for (const k in sweptAll) sweptAll[k] += q[k]; };

    // ------------------------------------------------------------ the places of the route, in metres from its start
    // Every window further down (the pace, where the eye goes, the open ride, the birds' rounds) lies between
    // these places, found on the route as it is flown; none is typed as a fraction of the flight.
    const sOf = (i) => i / (NS - 1) * LEN, iOf = (m) => clamp(Math.round(m / LEN * (NS - 1)), 0, NS - 1);
    const firstS = (test, from = 0) => { for (let i = iOf(from); i < NS; i++) if (test(PS[i * 3], PS[i * 3 + 1], PS[i * 3 + 2])) return sOf(i); return LEN; };
    const lastS = (test) => { for (let i = NS - 1; i >= 0; i--) if (test(PS[i * 3], PS[i * 3 + 1], PS[i * 3 + 2])) return sOf(i); return 0; };
    const inClearing = (x, y, z) => Math.hypot(x - MX, z - MZ) < CLEARING;
    const lowY = HILL_Y + 40, at = (x, z) => pathNear(x, z, lowY).u * LEN;
    const S = {
      // over the stream's first fall; abreast of the great bole; abreast of the guard tree; over the stream's last fall
      fall0: at(stream.xAt(f0.z), f0.z), bole: at(BOLE[0], BOLE[1]), guard: at(GUARD[0], GUARD[1]), fallN: at(stream.xAt(fN.z), fN.z),
      // the clearing round the mound, where no tree of the wood stands
      clearIn: firstS(inClearing), clearOut: lastS(inClearing),
      // due west of the mound's middle tree; on the mound's brow, where its flat top begins
      mound: firstS((x, y, z) => z < MZ), brow: firstS((x, y, z) => Math.hypot(x - MX, z - MZ) < MOUND_TOP_R),
      // where the mound's round begins, and where it is left for the road
      round: at(ROUND0[0], ROUND0[1]), leave: at(LEAVE[0], LEAVE[1]),
      // abreast of each outpost tree; over the fosse's near brink; under the garland of the gate; abreast of the fountain
      out1: at(OUTPOST[0][0], OUTPOST[0][1]), out2: at(OUTPOST[1][0], OUTPOST[1][1]), brink: at(roadX(BRINK_Z), BRINK_Z),
      gate: at(GATE_X, GATE_Z), lawn: at(lawnK[0], lawnK[2]),
    };
    await ctx.yield();
    const dTrunk = (x, z) => Math.hypot(x - CX, z - CZ);
    // the climb's places (the first sample of the route, from a place on, within 3 m of a knot's own point in the
    // air: the line passes over itself here, so a place of the climb is never asked for in plan): where the round is
    // joined, where it is left for the straight out to the west, and where the turn onto the hall's line begins (the
    // line is level from there); the hall's door
    const nearS = (q, from) => firstS((x, y, z) => Math.hypot(x - q[0], y - q[1], z - q[2]) < 3, from);
    S.join = nearS(CLIMB.join, S.lawn); S.out = nearS(CLIMB.out, S.join + 30); S.turn = nearS(CLIMB.turn, S.out);
    S.door = firstS((x, y, z) => CZ - z < HERO.hall.cz + HERO.hall.b && Math.abs(CX - x - HERO.lineX) < 4, S.turn);
    // (a place of the round by the share of its own sweep that lies behind us there: q from 0, where it is joined,
    //  to 1, where it is left)
    const ROUND_SWEEP = CLIMB.pJ - CLIMB.pE, sweepOf = (x, z) => { const a = ((CLIMB.pJ - Math.atan2(CX - x, CZ - z)) % TAU + TAU) % TAU; return a > TAU - 0.1 ? 0 : a; };
    const roundAt = (q) => Math.min(S.out, firstS((x, y, z) => sweepOf(x, z) >= q * ROUND_SWEEP, S.join));
    // the mound's foot on the way in and on the way out
    S.footIn = firstS((x, y, z) => Math.hypot(x - MX, z - MZ) < MOUND_FOOT_R); S.footOut = lastS((x, y, z) => Math.hypot(x - MX, z - MZ) < MOUND_FOOT_R);
    // RING_CLEAR before the ring: from there on nothing stands between the eye and any part of the ring (see the
    // great tree's view cone)
    S.sight = LEN - RING_CLEAR;
    // (a ramp between two places)
    const dawn = (a, b, m) => smoothstep(a, Math.max(b, a + 1), m);
    // the room kept free of leaf masses: END_ROOM round every sample of the route from the lawn on. Asked of every
    // leaf card as a tree grows, and again of every card made.
    const iClimb = iOf(S.lawn);
    const leafRoom = (x, y, z, r) => {
      const R1 = END_ROOM + r, r1 = R1 * R1, L = R1 <= QR ? runsAt(x, z) : ALL_RUNS, c0 = Math.floor(iClimb / RUN); asked++;
      for (let k = 0; k < L.length; k++) {
        const c = L[k]; if (c < c0 || boxD2(c, x, y, z) > r1) continue;
        for (let i = Math.max(iClimb, c * RUN), e = Math.min(NS, (c + 1) * RUN); i < e; i++) { const dx = PS[i * 3] - x, dy = PS[i * 3 + 1] - y, dz = PS[i * 3 + 2] - z; if (dx * dx + dy * dy + dz * dz < r1) return false; }
      }
      return true;
    };
    const blockedLeaf = (x, y, z, r) => blocked(x, y, z, r * 0.7) || !leafRoom(x, y, z, r);
    await ctx.yield();

    // ------------------------------------------------------------ the makers, and the great tree first
    await flora.prepareLeafTexture({}, ctx.yield);
    const K = makeGoldwood(ctx, { season });
    await ctx.yield();
    // hand-backs counted by work done (see makePacer): every builder made below is watched. A step's worth here is
    // 600 (a third of a millisecond of work once the code has run a while, several times that the first time a
    // maker runs), so that the page is asked for many times in every piece of work and no piece is a long one
    const pacer = makePacer(ctx, 600), rest = (n = 0) => { const a = asked; asked = 0; return pacer.rest(n + a); };
    const P = K.P;
    // the great tree stands turned half a turn: its ladder's face and the hall's far end look to the gate
    const toHero = (f) => (x, y, z, r) => f(CX - x, y + HILL_Y, CZ - z, r);
    // How a tree is drawn far away (one rule for the great tree, the city's trees and the mound's): its plain copy IS
    // the tree (made from the same skeleton in the same call: see growSteps in the part), and the two change places
    // point by point by the DISTANCE from the eye over a stretch of metres (no tree changes all at once): whole within SWAP0 (one
    // and a half of the great tree's height: from the gate, WALL_R from its trunk, the great tree is whole), plain
    // beyond SWAP1 (the great tree's own height further), each thinning into the other between.
    const SWAP0 = 1.5 * HERO.height, SWAP1 = SWAP0 + HERO.height, HERO_GLOW = 1.1, HOUSE_GLOW = [0.8, 1.2], COURT_GLOW = [0.9, 1.15];
    // (its leaves thicken with the visit's density up to 1.15 and no further: the densest visit's budget, see GREEN_K)
    // (what the world hands the great tree of its flight, in the tree's own frame: the eye's places over the last
    //  RING_CLEAR metres, between which and the ring nothing of the tree stands. Nothing else of the tree is laid
    //  from the line: its platforms, its ladder and its outer landing stand where the tree's own plan has them.)
    const ringEyes = []; for (let i = iOf(S.sight); i < NS; i++) ringEyes.push(CX - PS[i * 3], PS[i * 3 + 1] - HILL_Y, CZ - PS[i * 3 + 2]);
    // (counted for whoever asks: rehung, the clumps of leaves of every tree that were dealt in the air off their bough
    //  and were brought in to it: see the part, hangOn)
    const hungTally = scene.userData.tally = { rehung: 0 };
    const hero = await buildHero(ctx, { kit: K, pacer, rng: FK.hero, hallRng: FK.hall, underRng: FK.under, mix, portalR: PORTAL_R, leafK: Math.min(1.15, dens), far: { band: [SWAP0, SWAP1] }, ringEyes,
      // (every lamp of it burns, from the lowest tier to the hall's roof, a little stronger than a house's: HERO_GLOW)
      glow: HERO_GLOW, clear: toHero(pathClear), leafClear: toHero(leafRoom), blocked: toHero(blocked), blockedLeaf: toHero(blockedLeaf) });
    hungTally.rehung += hero.info.rehung || 0;
    tally(hero.stats.swept);
    hero.object.position.set(CX, HILL_Y, CZ); hero.object.rotation.y = Math.PI; hero.object.updateMatrixWorld(true);
    scene.add(hero.object);
    await rest();

    // ------------------------------------------------------------ the trees
    // tw places (where a tree stands, how tall); tr gives every place its tree's stream (boughs, leaves, lamps); tn
    // gives every place of the wood's lattices its far crown's stream (the crown's cards and its sides)
    const tw = FK.wood, tr = FK.trees, tn = FK.canopy;
    // (the wood's near trees stand in sets by the places of the route: the stream's wood in three (to the bole, to the
    // last fall, to the clearing's edge), the clearing's rim in two (before the mound's top and after), the ride in
    // two (to the second outpost, to the gate), and the city's rim in four quarters of the compass about the great
    // tree: see placeOf. Each of the seven places before the gate is two sets, the trees left of the route's line and
    // those right of it (sideOf), so that a set is half as wide and the renderer can leave out one that lies wholly
    // behind us or to one side; the far canopy's cards over them stay one set to a place.)
    const NPL = 11, NCH = 18, allB = [], mk = (lamps, verts, cards, away = false) => { const b = { solid: new K.Solid(verts), leaves: new K.Leaves(cards), lamps: lamps ? new K.Lamps() : null, away }; pacer.watch(b); allB.push(b); return b; };
    // (away: a set that is never near the way: a plain copy, drawn only further than SWAP0 from the eye, or the far
    //  wood, which stands TRUNKS_TO and more from the route's line. The lane's test of what was made passes them by.)
    // (room for about what each will hold, so that the arrays seldom have to double)
    // (with a hand-back between them: making these arrays is work too)
    const woodB = []; for (let i = 0; i < NCH; i++) { woodB.push(mk(true, 8192, 4096)); if (i % 3 === 2) await ctx.yield(); }
    const woodFar = Array.from({ length: NPL }, () => mk(false, 64, 2048)), farB = Array.from({ length: 4 }, () => mk(false, 8192, 4096, true));
    await ctx.yield();
    // (every set of the wood's near trees has its plain half: the same trees plainly, for far away)
    for (let i = 0; i < NCH; i++) { woodB[i].plain = mk(false, 2048, 2048, true); if (i % 6 === 5) await ctx.yield(); }
    // (the city's trees and their plain copies stand in four sets, by quarters of the compass about the great tree, as
    // the wood's rim there does: a quarter that lies wholly beyond the band is not drawn whole)
    const quarterOf = (x, z) => Math.min(3, Math.floor((Math.atan2(x - CX, z - CZ) + Math.PI) / (Math.PI / 2)));
    const cityB = Array.from({ length: 4 }, () => mk(true, 16384, 8192));
    await ctx.yield();
    const moundB = mk(true, 32768, 8192), cityFarB = Array.from({ length: 4 }, () => mk(false, 4096, 2048, true)), moundFarB = mk(false, 4096, 2048, true);
    await ctx.yield();
    // (every rope ladder of the wood and the city)
    const thinB = new K.Solid(512);
    // (roofTrees: every crown that stands, for the roof map: x, z, its boughs' reach, its top's height, 1 if it is of the city)
    const shadeTrees = [], trunks = [[CX, CZ, HERO.height / 16 * 1.6 * 1.035]], cityTrees = [], roofTrees = [[CX, CZ, HERO.crownR, HILL_Y + HERO.height, 1]];
    // THE ROAD'S AVENUE IS OPEN TO THE SKY (see AVENUE_AIR): a place of reach r is in the open air if it lies further
    // from the road's straight than AVENUE_AIR and three fifths of r, or is not abreast of the road between the
    // mound's foot and the gate. It is asked of the PLAN alone: the route's line is not asked (the lane's own
    // clearance is pathClear's, and nothing else reads the line here).
    const avenueOpen = (x, z, r) => !inAvenue(x, z, AVENUE_AIR + r * 0.6);
    // over the stream the roof is open: no leaf mass within 9 m of the water's line, so that the sky and the sun come down to it
    const inStream = (z) => z < stream.z0 && z > stream.z1 - 12;
    const streamOpen = (x, z, r) => !(inStream(z) && stream.dist(x, z) < 9 + r * 0.6);
    // A TRUNK'S ROOM FROM THE LINE. No trunk's FOOT (its bark at the ground, flare and lobes at their widest: footOf)
    // stands nearer the route's line in plan than TRUNK_GAP or the trunk's own breadth, whichever is more (lineRoom:
    // how far its axis must stand off), WHEREVER THE LINE IS LOWER THAN THE TREE'S TOP AND 6 m (trunkOK asks
    // pathNear for the nearest place of the line among those lower than that, along the whole flight: where the
    // line passes higher than that over a tree, the tree may stand under it, as near in plan as may be: the line
    // at the hall's level passes 23 m over the tops of the court's houses); nor its axis nearer than 1.15 of its own width and
    // 8 m; from the start to the first fall, where the flight is lowest among the great trunks, none nearer than
    // three of its own widths from its bark: 7 R from its axis. (The foot is asked, not the stem alone: a broad
    // bole's flare stands out well beyond its stem's half breadth.)
    // (LINE_SAG: what the line may lie nearer than its samples do, between two of them)
    const TRUNK_GAP = 6, LINE_SAG = 0.3, lineRoom = (R, flare, lod) => footOf(R, flare, lod) + Math.max(TRUNK_GAP, 2 * R) + LINE_SAG;
    const trunkOK = (x, z, R, topY, flare, lod) => { const n = pathNear(x, z, topY + 6); return n.d > Math.max(n.u * LEN < S.fall0 ? R * 7 : 0, R * 2.3 + 8, lineRoom(R, flare, lod)); };
    // (a tree of a named place that the line passes: it stands where it is named if it has its room there, else
    //  straight away from the line's nearest place by what it lacks, asked again up to four times)
    const standOff = (x, z, R, H, flare, lod) => {
      for (let k = 0; k < 4; k++) { const n = pathNear(x, z, gy(x, z) + H + 6), need = lineRoom(R, flare, lod) + 0.2; if (n.d >= need) break; const i = Math.round(n.u * (NS - 1)), dx = x - PS[i * 3], dz = z - PS[i * 3 + 2], l = Math.hypot(dx, dz) || 1; x += dx / l * (need - n.d); z += dz / l * (need - n.d); }
      return [x, z];
    };
    // A TRUNK STANDS ASIDE FROM THE ENTRY AXIS. A trunk drawn within its room of that axis behind the entry (1.15 of
    // its own width, as by the route, and the lane) is not stood there: it stands at the edge of that room, straight to
    // the side of where it was drawn. axisEdge gives the two such places, its own side first. A trunk of the wood
    // takes the first of them that every trunk's rules allow (off the stream, off the route): one within its own
    // square's window if there is one; if neither is allowed it is not stood.
    const axisEdge = (x, z, R) => {
      const back = backOf(x, z), side = backSide(x, z), room = R * 2.3 + LANE;
      if (back < 0 || back > BACK_AXIS + room || Math.abs(side) >= room) return null;
      return (side >= 0 ? [1, -1] : [-1, 1]).map((sd) => { const k = sd * room - side; return [x - backT.z * k, z + backT.x * k]; });
    };
    const spaced = (x, z, gap) => { for (const t of trunks) if (Math.hypot(t[0] - x, t[1] - z) < gap) return false; return true; };
    // (how far a trunk's bark stands from its own line at its foot, where its flare and lobes are widest: the part's
    //  own trunk, see trunkRing there; lod 0 flares 0.7 as much)
    function footOf(R, flare = 1.2, lod = 1) { return R * (1 + flare * (lod === 0 ? 0.7 : 1)) * 1.035; }
    // NO TRUNK STANDS IN ANOTHER. Every trunk that stands, grown or plain, is kept in a plan of TCELL m squares
    // (stand: its place and how far its bark stands from its own line at the foot); trunkFree asks, BEFORE a trunk
    // is stood, whether its foot would come within TRUNK_APART of any foot that stands already.
    const TCELL = 36, TRUNK_APART = 0.5, stoodAt = new Map(), stoodKey = (x, z) => Math.floor(x / TCELL) * 16384 + Math.floor(z / TCELL);
    const stand = (x, z, r) => { const k = stoodKey(x, z), L = stoodAt.get(k); if (L) L.push([x, z, r]); else stoodAt.set(k, [[x, z, r]]); };
    const trunkFree = (x, z, r) => {
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const L = stoodAt.get(stoodKey(x + a * TCELL, z + b * TCELL)); if (L) for (const q of L) if (Math.hypot(q[0] - x, q[1] - z) < q[2] + r + TRUNK_APART) return false; }
      return true;
    };
    stand(CX, CZ, trunks[0][2]);
    // (is a place inside a trunk's foot, or within `room` of it: asked of what stands on the ground among the trees)
    const inTrunk = (x, z, room = 0) => { for (const t of trunks) if (Math.hypot(t[0] - x, t[1] - z) < t[2] + room) return true; return false; };
    // (TRUNKS_TO: SWAP0 to the metre's round: beyond it a tree is never drawn whole. FLOOR_TO: a crown and a half of
    // the wood's further. FAR_Y: a metre under the stream's lowest bed. FINE_NEAR: one step of the wood's lattice.)
    // The wood's small trees stand at their full count within TRUNKS_TO of the route's line; over the next 50 m, to
    // FLOOR_TO where the fine floor ends, their count thins evenly to none (a tree of the lattice is kept there if its
    // place's own hash is over its share of that way) and the floor falls to the far ground's level (FAR_Y), keeping
    // its cover. Every other tree of the wood, there and beyond, is a crown on a plain trunk of its own girth
    // (farTrunk): no crown stands without a trunk, at any distance.
    const TRUNKS_TO = 200, FLOOR_TO = 250, FAR_Y = -3.5, FINE_NEAR = 30;
    const floorEnd = (d) => smoothstep(TRUNKS_TO, FLOOR_TO, d), placeHash = (x, z) => { const s = Math.sin(x * 12.9898 + z * 78.233) * 43758.5453; return s - Math.floor(s); };
    const PLAIN_SMALL = { sides: 5, every: 3, bSeg: 1, tiers: 1, share: 3 }, PLAIN_WOOD = { bSeg: 1, share: 3 };
    // A far crown's trunk: the tree's own girth by the wood's own taper (trunkRadius), one length from under the
    // ground to nine tenths of its height where the crown's cards close over it; the bark darker under the crown as
    // on a grown tree. (It is never nearer the eye than TRUNKS_TO: its foot's flare is not drawn.)
    const FAR_CROWN = 0.44, farBark = [0.9, 0.7].map((k) => K.P.bark.map((c) => c * k));
    const farTrunk = (sb, x, y, z, H, R, sides) => {
      sb.kind = 0;
      sb.tube([[x, y - 0.02 * H, z], [x, y + 0.9 * H, z]], [R * 1.1, trunkRadius(R, H, FAR_CROWN, 0.9 * H)], sides, (i) => farBark[i], false);
    };
    const plant = async (B, o) => {
      const y = lerp(gy(o.x, o.z), FAR_Y, o.sink || 0) - 0.3, cr = (o.Lmax ?? o.H * 0.36) * 1.2 + 6, near = pathNear(o.x, o.z), air = inAvenue(o.x, o.z, AVENUE_AIR, cr);
      const byStream = inStream(o.z) && stream.dist(o.x, o.z) < cr + 12, city = Math.hypot(o.x - CX, o.z - CZ) < OPEN;
      // (air: the tree stands where its crown can reach the road's avenue: then what it grows 0.3 m and more in reach
      //  (a bough with its room, a root's end, a mass of leaf) is asked for the avenue's open air as well as for the lane)
      const clear = air ? (x, yy, z, r) => pathClear(x, yy, z, r) && (r < 0.3 || avenueOpen(x, z, r)) : near.d < cr + 8 ? pathClear : null;
      const leafClear = city ? leafRoom : byStream ? (x, yy, z, r) => streamOpen(x, z, r) : null;
      // (o.far: the set of builders that takes this tree's plain copy for far away: the same tree, every second spray of each bough)
      // (fineAt: within FINE_NEAR of the route's line, in space, no leaf card lies as one great card: see the part. It is
      // asked only of a tree whose crown can come that near: by its place and its crown's foot against the line's height there)
      const fineAt = near.d - cr < FINE_NEAR && y + (o.crownBase ?? 0.44) * o.H - near.y < FINE_NEAR ? (x, yy, z) => !pathClear(x, yy, z, FINE_NEAR - 6) : null;
      // (a tree of the wood goes into its set's plain half. A small far tree's plain copy is its trunk through three
      // rings at five sides, its lowest tier of boughs as straight lengths, and every third spray: PLAIN_SMALL; a
      // grown tree of the wood's has its boughs as straight lengths and every third spray: PLAIN_WOOD. The wood's
      // canopy cards stand over both at every distance.)
      const pb = o.far || B.plain || null, pk = o.far ? null : o.lod === 0 ? PLAIN_SMALL : PLAIN_WOOD;
      // (ONE TREE, ONE STREAM, AND ONE STREAM FOR EVERY PLACE: a tree is grown from its PLACE'S own stream (o.rng), and
      //  every place where a tree may stand takes that stream when the place is dealt, WHETHER A TREE STANDS THERE OR
      //  NOT: the lamp tree's place, every place of the city's two rings, of the mound's two rings and its middle,
      //  the two outposts, every place of the wood's lattice (each a fork of the trees' stream, which costs that stream
      //  one number whatever the tree draws); the court's places fork the court's stream; the great bole and the guard
      //  tree have each a stream of the visit's. So no tree's boughs, leaves or lamps depend on what another tree
      //  drew, nor on whether another tree stands: plant takes no stream of its own accord.)
      // (ONE RULE FOR EVERY BOUGH OF EVERY TREE, WHEREVER THE TREE STANDS: a bough ends where the lane's clearance
      //  ends it (pathClear, the room every solid thing keeps from the line) or where it would come into the road's
      //  open avenue (a strip of the plan), and nowhere else. Nothing else of a bough asks where the line is: a
      //  bough whose leaves the leaf room refused stands bare, as a bough of any tree may.)
      // (EVERY CLUMP OF LEAVES HANGS ON ITS OWN BOUGH, on every tree: the part brings one dealt in the air in to
      //  that bough, after its draws. rehung: how many were.)
      const spec = { mix, ...o, rng: o.rng, y, ground: gy, solid: B.solid, leaves: B.leaves, lamps: B.lamps, clear, leafClear, fineAt, field: o.lit ? K.makeLampField() : null, far: pb ? { solid: pb.solid, leaves: pb.leaves, ...pk } : null };
      const info = o.lod === 0 ? K.growTree(spec) : await K.growTreeAsync(spec, o.eager ? ctx.yield : rest);
      hungTally.rehung += info.rehung || 0;
      shadeTrees.push([o.x, o.z, o.R, o.H]); trunks.push([o.x, o.z, footOf(o.R, o.flare, o.lod)]); stand(o.x, o.z, footOf(o.R, o.flare, o.lod)); roofTrees.push([o.x, o.z, o.Lmax ?? o.H * 0.36, y + o.H, city ? 1 : 0]);
      return info;
    };
    // tiers of boughs that keep clear of a tree's platforms
    const tiersFor = (H, tc, n, nb, Lmax, fletH) => Array.from({ length: n }, (_, i) => {
      const f = i / (n - 1); let h = H * (tc + (0.95 - tc) * Math.pow(f, 0.9));
      for (const fh of fletH) if (h > fh - 5.5 && h < fh + 6.5) h = h < fh ? fh - 6 : fh + 7;
      return { h: Math.min(h, H * 0.96), n: nb, L: Lmax * (1 - 0.7 * Math.pow(f, 1.4)), rise: lerp(0.16, 0.42, f), curl: 0.1 };
    });
    const withStruts = (f, R, H, tc) => { f.struts = { r: trunkRadius(R, H, tc, f.h - 3.6) + 0.1, drop: 3.6, n: 6 }; return f; };
    // a rope ladder hangs from a platform through an opening in its floor, to the ground or to the platform below:
    // [x, yTop, z, outX, outZ, yFoot (none: the ground), its tree]
    const ladders = [];
    // A LADDER HANGS CLEAR OF ITS OWN TRUNK. It is one straight strip, and the trunk under a floor is thicker than at
    // it, spreads at its foot and leans its own way: so a ladder hangs LADDER_OFF outside the trunk's bark AT ITS
    // THICKEST over the ladder's own length (barkAt: the part's trunk with its foot's flare and lobes at their
    // widest), and the most the trunk's own line can stand off between the ladder's ends besides (BEND of the
    // metres between).
    // A LADDER IS HUNG ONLY WHERE ITS FOOT COMES TO A FLOOR AND ITS HEAD TO A RIM; where no such place is found NO
    // LADDER IS DRAWN, and none is longer than LADDER_MAX (a rope ladder is let down a tall tree's height, not
    // two). ladderPlan tries, in this order:
    //  1. through an opening in the floor (its rim LADDER_IN inside the floor's own), clear of the trunk all the
    //     way down to THE GROUND or to THE PLATFORM BELOW (there it must come down ON_FLOOR inside that
    //     platform's rim, the trunk's lean between the two counted);
    //  2. to the ground only: through the opening, down ONTO A ROOT'S BACK: where the foot's flare is too broad
    //     for the opening, the ladder hangs as near the trunk as it clears the bark above the flare and comes
    //     down until the flare's back is a hand under it, no higher over the tree's foot than ROOT_BACK of the
    //     trunk's radius (higher than that the flare is the trunk's own wall, and no floor);
    //  3. over the floor's outer rim (RIM_OUT outside it), to the ground, or to the platform below where that is
    //     the broader by ON_FLOOR and more.
    // It gives how far out the ladder hangs (d), the height of its foot over the tree's (hFoot) and the opening in
    // the floor for it (none for a ladder over the rim).
    const LADDER_OFF = 0.45, LADDER_IN = 1.2, BEND = 0.012, LADDER_MAX = 30, ROOT_BACK = 1.15, RIM_OUT = 0.25, ON_FLOOR = 0.5;
    const barkAt = (R, H, tc, h, flare = 1.2, lod = 1) => trunkRadius(R, H, tc, h) * (1 + flare * (lod === 0 ? 0.7 : 1) * Math.exp(-h / (R * 1.15))) * 1.035;
    const ladderPlan = (R, H, tc, hTop, hBelow, rOut, flare, lod, rBelow = 0) => {
      if (hTop - hBelow > LADDER_MAX) return null;
      // (off: how far from the trunk's own line at the ladder's head a thing must hang to be `gap` off the bark at a height)
      const off = (h, gap) => barkAt(R, H, tc, h, flare, lod) + gap + BEND * (hTop - h);
      const need = (h0) => { let d = 0; for (let h = h0; h <= hTop; h += 0.5) d = Math.max(d, off(h, LADDER_OFF)); return d; };
      const lands = (d) => !hBelow || d <= rBelow - ON_FLOOR - BEND * (hTop - hBelow);
      // (skip: the stretch of the rim where a ladder over it hangs: no rim lamp is hung there, a lamp's room either side)
      const through = (d, hFoot) => ({ d, hFoot, way: hFoot === hBelow ? 1 : 2, hatch: (a) => ({ a, half: 0.55 / d, r: d + 0.6 }), skip: () => null });
      const over = (d, hFoot) => ({ d, hFoot, way: 3, hatch: () => null, skip: (a) => [[a - 1.5 / d, a + 1.5 / d]] });
      // (onRoot: the ladder as near the trunk as it clears the bark from a height of the flare up, no further out than
      //  `most`, brought down until the flare's back is a hand under it)
      const onRoot = (most, make) => { for (let h = 0.25; h <= ROOT_BACK * R; h += 0.25) { const d = need(h); if (d <= most) { let e = h; while (e > 0.1 && off(e - 0.1, 0.1) <= d) e -= 0.1; return make(d, e); } } return null; };
      const d0 = need(hBelow), dr = rOut + RIM_OUT;
      if (d0 <= rOut - LADDER_IN && lands(d0)) return through(d0, hBelow);
      if (hBelow) return lands(dr) && dr >= d0 ? over(dr, hBelow) : null;
      return onRoot(rOut - LADDER_IN, through) || (d0 <= dr ? over(dr, 0) : onRoot(dr, over));
    };
    const hang = (info, a, hTop, lp, g) => { const c = info.centre(hTop); ladders.push([c[0] + Math.sin(a) * lp.d, c[1], c[2] + Math.cos(a) * lp.d, Math.sin(a), Math.cos(a), lp.hFoot > 0 ? g + lp.hFoot + 0.1 : null, info]); };

    // THE CITY'S PLANS, each kept once and asked by whatever stands on the city's ground (its houses, the lamp posts,
    // the rare evening's lights): its three stairs, each a line through places of the hill (metres about the great
    // trunk's foot; the long stair begins at the gate's own place, 5 m inside the wall's line) and a breadth; and
    // the rill that spills from the fountain's basin and runs down the lawn. stairGap, rillGap: how far a place
    // lies outside a stair's edge or the rill's (negative: on it).
    // THE EAST STAIR'S FOOT IS LAID FROM THE FOUNTAIN'S BASIN: it begins STAIR_OFF outside the basin's rim (BASIN_R
    // from the fountain's middle) on the straight from the fountain's middle to the stair's next place, and goes
    // straight away from the basin there: so no part of it lies in the bowl, and it leaves the rill's head (which
    // spills on the basin's other quarter, toward the gate) behind it.
    await ctx.yield();
    const BASIN_R = 4.9, STAIR_OFF = 2, EAST_TO = [78, CZ + 100], eastD = Math.hypot(EAST_TO[0] - FOUNT[0], EAST_TO[1] - FOUNT[2]);
    const EAST_FOOT = [FOUNT[0] + (EAST_TO[0] - FOUNT[0]) / eastD * (BASIN_R + STAIR_OFF), FOUNT[2] + (EAST_TO[1] - FOUNT[2]) / eastD * (BASIN_R + STAIR_OFF)];
    const STAIRS = [
      { ctl: [[GATE_X, CZ + WALL_R - 5], [48, CZ + 150], [52, CZ + 126], [52, CZ + 100], [40, CZ + 82], [30, CZ + 58], [34, CZ + 32], [39, CZ + 12]], width: 4.4 },
      { ctl: [EAST_FOOT, EAST_TO, [98, CZ + 66], [96, CZ + 30], [78, CZ + 12], [52, CZ + 9]], width: 3.2 },
      { ctl: [[39, CZ - 12], [22, CZ - 34], [-8, CZ - 44], [-36, CZ - 22], [-58, CZ + 10], [-60, CZ + 50]], width: 3.2 },
    ].map((s) => {
      const curve = new THREE.CatmullRomCurve3(s.ctl.map((q) => new THREE.Vector3(q[0], 0, q[1])), false, 'centripetal'), len = curve.getLength(), line = [], v = new THREE.Vector3();
      for (let i = 0, n = Math.ceil(len / 1.5); i <= n; i++) { curve.getPointAt(i / n, v); line.push([v.x, v.z]); }
      return { ...s, curve, len, line };
    });
    await ctx.yield();
    const RILL_W = 1.7, rillPts = []; { let x = FOUNT[0] + 3.6, z = FOUNT[2] + 3.4; for (let i = 0; i < 16; i++) { rillPts.push([x, gy(x, z) + (i === 0 ? 0.75 : 0.14), z]); x += 1.4 + 0.9 * Math.sin(i * 0.8); z += 3.0; } }
    const segD = (x, z, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, f = clamp(((x - ax) * dx + (z - az) * dz) / Math.max(dx * dx + dz * dz, 1e-6), 0, 1); return Math.hypot(x - ax - dx * f, z - az - dz * f); };
    const stairGap = (x, z) => { let b = Infinity; for (const s of STAIRS) for (let i = 1; i < s.line.length; i++) b = Math.min(b, segD(x, z, s.line[i - 1][0], s.line[i - 1][1], s.line[i][0], s.line[i][1]) - s.width / 2); return b; };
    const rillGap = (x, z) => { let b = Infinity; for (let i = 1; i < rillPts.length; i++) b = Math.min(b, segD(x, z, rillPts[i - 1][0], rillPts[i - 1][2], rillPts[i][0], rillPts[i][2]) - RILL_W / 2); return b; };
    // (a house stands off a stair and off the rill by its roots' reach, ROOT_REACH of its girth, and a step's room)
    const ROOT_REACH = 4.2, STEP_ROOM = 0.62, cityRoom = (x, z, R) => Math.min(stairGap(x, z), rillGap(x, z)) > R * ROOT_REACH + STEP_ROOM;

    // the low spreading tree whose boughs carry the silver lamps over the fountain: 13 m from it, on its side away from the way up the lawn
    // (it stands on the bearing it is named for if the city's plans leave it free ground there: off the rill and the
    //  stairs by its roots' reach, off the line by a trunk's room; else on the nearest bearing either way, LAMP_TURN
    //  at a time, where they do)
    await ctx.yield();
    const LAMP_D = Math.hypot(10, 8), LAMP_A = Math.atan2(10, 8), LAMP_R = 1.7, LAMP_H = 44, LAMP_TURN = 0.2;
    const LAMP_TREE = (() => {
      for (let k = 0; k < 20; k++) { const a = LAMP_A + (k % 2 ? 1 : -1) * Math.ceil(k / 2) * LAMP_TURN, x = FOUNT[0] + Math.sin(a) * LAMP_D, z = FOUNT[2] + Math.cos(a) * LAMP_D; if (cityRoom(x, z, LAMP_R) && trunkOK(x, z, LAMP_R, gy(x, z) + LAMP_H, 1.2, 2)) return [x, z]; }
      return null;
    })(), LAMP_Q = LAMP_TREE ? quarterOf(LAMP_TREE[0], LAMP_TREE[1]) : 0, lampGrow = tr.fork('tree');
    if (LAMP_TREE) await plant(cityB[LAMP_Q], { rng: lampGrow, eager: true, x: LAMP_TREE[0], z: LAMP_TREE[1], H: LAMP_H, R: LAMP_R, lod: 2, far: cityFarB[LAMP_Q], crownBase: 0.27, lit: true, boughLamps: Math.round(26 * dens), cordMax: 4.2, mix: [0.12, 0.12, 1], Lmax: 19, lampScale: 1.15,
      tiers: [{ h: 12.5, n: 6, L: 19, rise: 0.1, curl: 0.06 }, { h: 21, n: 6, L: 16, rise: 0.2, curl: 0.1 }, { h: 30, n: 5, L: 12, rise: 0.3, curl: 0.1 }, { h: 38, n: 5, L: 7, rise: 0.4, curl: 0.1 }] });
    await rest();

    const greenLeaf = (r, b) => mix3(K.leafCol(r, b), mul3(P.leafGreen, b * 1.2), 0.7);
    // (the mound's leafless trees: snow-white bark that gives back 0.92 of the light it gets and no more, so that it
    //  has a lit side and a side in the sky's blue-grey shade and is nowhere a flat white)
    const WHITE_BARK = [0.92, 0.92, 0.95];
    // THE GREAT HOUSES OF THE COURT: the great tree's nearest neighbours, a few tall trees of the hill's top that
    // stand about it between COURT_R[0] and COURT_R[1] from its trunk: outside its crown and their own boughs'
    // reach of it, inside the inner ring. EACH HAS ONE FLOOR, LEVEL WITH THE GREAT TREE'S FIRST PLATFORM (the folk
    // built their neighbours' floors level with the tree's own), in the fork of its lowest boughs, and a crown
    // HOUSE_CROWN deep over it: its top stands well under the hall's floor. A RULE OF THE CITY'S PLAN AND A DEAL
    // (the stream named watch, these houses' own): how many places there are (COURT_N), spread round the tree from
    // a dealt bearing, each up to three tenths of a place's share of the round to either side and at its own
    // dealt distance; each house's lamps' strength and its leaves' kind. EVERY PLACE TAKES ITS NUMBERS WHETHER A
    // HOUSE STANDS THERE OR NOT. A HOUSE STANDS ON FREE GROUND: HOUSE_APART from every trunk that stands, its roots
    // off every stair and the rill (cityRoom), off the fountain; a place that is not free is tried along its own
    // bearing from the great trunk (COURT_SHIFT: 4 m further out, 4 m nearer, 8 m either way), and where none of
    // those is free no house stands. THE COURT HAS COURT_MOST GREAT HOUSES AND NO MORE, COUNTED ON THE PLAN: the
    // places that have free ground are taken in the deal's own order until there are COURT_MOST of them, and the
    // places after them are left as they are (free ground is asked against the places taken before as against the
    // trunks that stand, whether a house stands on them or not). ONLY THEN THE LAW'S ROOM IS ASKED: a taken place
    // whose ground has not that room (the bole clear of the lane at every height, trunkOK; the floor clear of the
    // line by a floor's room, as every house's is) has no house. It is a gap in the court: no later place takes
    // its turn. THE LINE MOVES NO HOUSE AND CHOOSES NONE. (trunkOK asks the line only where it is lower than the
    // house's top and 6 m: against that part of the line no court bole stands nearer than its room, 15 m and
    // more in plan by the builder's count; the line at the hall's level, which passes 23 m over a court
    // house's top, may pass straight over one.)
    // No rail, no wall; on each floor lies its own thing, left there (watchThing: nobody is seen).
    const COURT_R = [60, 76], COURT_N = [5, 6], COURT_MOST = 4, COURT_SHIFT = [0, 4, -4, 8, -8], HOUSE_APART = 22, HOUSE_RO = 7, HOUSE_CROWN = 30, HOUSE_REACH = 17, TALL_TOP = HILL_Y + 0.8 * HERO.height, TALL_GIRTH = 0.03;
    // (o: the thing's place on the floor; [ux, uz]: along the platform's rim; [vx, vz]: outward. A thing is small
    //  white and silver joinery, lit by the platform's own lamps.)
    const watchThing = (k, o, ux, uz, vx, vz, glow, wr) => {
      const at = (u, y, v) => [o[0] + ux * u + vx * v, o[1] + y, o[2] + uz * u + vz * v], wht = mul3(P.white, 0.97), slv = [0.78, 0.82, 0.86];
      // a top or a seat of planks side by side on four legs: w along, d deep, h high
      const board = (s, w, d, h, u0 = 0, v0 = 0) => {
        for (let i = 0, n = Math.max(2, Math.round(d / 0.22)); i < n; i++) { const v = v0 + (i + 0.5) / n * d - d / 2; s.beam(at(u0 - w / 2, h, v), at(u0 + w / 2, h, v), 0.22, wht); }
        for (const su of [-1, 1]) for (const sv of [-1, 1]) s.beam(at(u0 + su * (w / 2 - 0.1), 0, v0 + sv * (d / 2 - 0.1)), at(u0 + su * (w / 2 - 0.1), h, v0 + sv * (d / 2 - 0.1)), 0.11, wht);
      };
      return {
        lamps(L, f) {
          // 0: three lamps standing on a table, one of each colour; 3: one silver lamp on a cord over the loom
          if (k === 0) [[-0.7, [1, 0, 0]], [0, [0, 1, 0]], [0.7, [0, 0, 1]]].forEach(([u, m]) => { const q = at(u, 1.5, 0); K.hangLamp(L, f, wr, q[0], q[1], q[2], 0.15, 0.75, m, glow); });
          if (k === 3) { const q = at(0, 4.4, 0); K.hangLamp(L, f, wr, q[0], q[1], q[2], 1.9, 0.85, [0, 0, 1], glow); }
        },
        geometry(s) {
          s.glow = glow; s.kind = 2;
          // 0: a table; 1: a bench before the plaited screen; 2: a harp left on a seat; 3: a loom left standing, its
          // web half woven (plain white joinery and pale thread)
          if (k === 0) board(s, 2.4, 1.0, 0.85);
          if (k === 1) board(s, 2.6, 0.5, 0.5);
          if (k === 2) {
            board(s, 0.9, 0.9, 0.55);
            s.kind = 7;
            s.beam(at(-0.3, 0.6, 0), at(-0.3, 2.15, 0), 0.09, slv); s.beam(at(-0.26, 0.62, 0), at(0.6, 1.9, 0), 0.2, slv);
            s.tube([at(-0.3, 2.15, 0), at(0.2, 2.25, 0), at(0.6, 1.9, 0)], [0.06, 0.06, 0.06], 5, slv, false);
            for (let i = 0; i < 6; i++) { const g = (i + 0.7) / 7; s.beam(at(lerp(-0.3, 0.6, g), lerp(2.17, 2.0, g) + 0.1 * Math.sin(g * Math.PI), 0), at(lerp(-0.26, 0.6, g), lerp(0.62, 1.9, g), 0), 0.035, wht); }
          }
          if (k === 3) {
            // (two uprights on their feet, a cloth beam and a top beam; the woven web below, the bare warp above; it
            //  stands half a metre out from under the lamp)
            const V = 0.5;
            for (const su of [-1, 1]) { s.beam(at(su * 0.8, 0, V), at(su * 0.8, 1.62, V), 0.12, wht); s.beam(at(su * 0.8, 0.06, V - 0.4), at(su * 0.8, 0.06, V + 0.4), 0.12, wht); }
            for (const h of [0.42, 1.56]) s.beam(at(-0.9, h, V), at(0.9, h, V), 0.11, wht);
            for (let i = 0; i < 11; i++) { const u = -0.6 + i * 0.12; s.beam(at(u, 0.98, V), at(u, 1.56, V), 0.025, wht); }
            s.kind = 5; s.face(at(-0.62, 0.42, V), at(0.62, 0.42, V), at(0.62, 1.0, V), at(-0.62, 1.0, V), mul3(P.screen, 0.95), [0, 0, 1.24, 0, 1.24, 0.58, 0, 0.58]);
          }
        },
      };
    };
    {
      const wr = FK.watch, places = [], taken = [], fy = HILL_Y + HERO.floors[0];
      // (first every place takes its numbers, in the places' order; then the houses are grown, in that order)
      for (let k = 0, n = wr.int(COURT_N[0], COURT_N[1]), a0 = wr.range(0, TAU); k < n; k++) places.push({ a: a0 + (k + wr.range(-0.3, 0.3)) / n * TAU, rr: wr.range(COURT_R[0], COURT_R[1]), glow: wr.range(COURT_GLOW[0], COURT_GLOW[1]), green: wr.chance(0.4), tree: wr.fork('house'), thing: wr.fork('thing') });
      for (let k = 0; k < places.length; k++) {
        const { a, glow, green } = places[k];
        const place = (d) => { const rr = places[k].rr + d, x = CX + Math.sin(a) * rr, z = CZ + Math.cos(a) * rr, g = gy(x, z) - 0.3, fh = fy - g, H = fh + 2 + HOUSE_CROWN; return { x, z, g, fh, H, R: H * 0.036 }; };
        const at = COURT_SHIFT.map(place).find((q) => spaced(q.x, q.z, HOUSE_APART) && taken.every((t) => Math.hypot(t.x - q.x, t.z - q.z) >= HOUSE_APART) && cityRoom(q.x, q.z, q.R) && Math.hypot(q.x - FOUNT[0], q.z - FOUNT[2]) >= 24);
        await ctx.yield();
        // (the plan first: is there free ground, and is the court's count not yet full; then the law's room)
        if (!at || taken.length >= COURT_MOST) continue;
        taken.push(at);
        if (!trunkOK(at.x, at.z, at.R, at.g + at.H, 1.2, 2) || !pathClear(at.x, fy, at.z, HOUSE_RO + 1)) continue;
        const { x, z, g, fh, H, R } = at, tc = (fh + 2) / H;
        const cq = quarterOf(x, z), toTree = Math.atan2(CX - x, CZ - z), rIn = trunkRadius(R, H, tc, fh) * 1.05 + 0.9, lp = ladderPlan(R, H, tc, fh, 0, HOUSE_RO, 1.2, 2);
        // (its thing lies on the floor's half toward the great tree, a radian round from the straight way to it, to
        //  one hand and the other by turns; the screen of the second stands on the rim behind its bench; its
        //  ladder hangs on the side away from the great tree)
        const b = toTree + (k % 2 ? 1 : -1) * 1.0, rb = (rIn + HOUSE_RO) / 2, kind = k % 4;
        const f = { h: fh, rOut: HOUSE_RO, rIn, lampEvery: 1.6 / dens, cord: [0.7, 1.6], screen: kind === 1 ? [b - 0.6, b + 0.6] : null, hatch: lp ? lp.hatch(toTree + Math.PI) : null, lampSkip: lp ? lp.skip(toTree + Math.PI) : null, struts: { r: trunkRadius(R, H, tc, fh - 5) + 0.1, drop: 5, n: 8 } };
        const info = await plant(cityB[cq], { rng: places[k].tree, x, z, H, R, lod: 2, roots: true, masses: true, bare: 0.3, far: cityFarB[cq], crownBase: tc, lit: true, boughLamps: Math.round(40 * dens), Lmax: HOUSE_REACH, glow, leafCol: green ? greenLeaf : undefined,
          tiers: [...tiersFor(H, tc, 5, 6, HOUSE_REACH, [fh]).map((T) => ({ ...T, cards: 20, size: [3.8, 5.6], tiles: 3, dome: 0.14, thick: 0.42 })), { h: fh - 2.2, n: 4, L: 9, rise: 0.22, curl: 0.05, thick: 0.6, cards: 0 }],
          flets: [f], parts: (sk) => { const c = sk.centre(fh); return [watchThing(kind, [c[0] + Math.sin(b) * rb, c[1], c[2] + Math.cos(b) * rb], Math.cos(b), -Math.sin(b), Math.sin(b), Math.cos(b), glow, places[k].thing)]; } });
        cityTrees.push([x, z, Math.hypot(x - FOUNT[0], z - FOUNT[2]), glow]);
        if (lp) hang(info, toTree + Math.PI, fh, lp, g);
        await rest();
      }
    }

    // the city's lesser trees: two rings round the great one, 0.7 and 1.1 of its height from its trunk. No top stands
    // higher than the cone (CONE m per metre from the hill's top at the great trunk); each is grown to between 0.6
    // and 1 of what the cone allows where it stands, so the roofs rise outward and the great tree stands over them
    // all. EACH IS A TREE IN THE GREAT TREE'S MANNER, not a pole with a ball: a stout bole (a twentieth of its height
    // through and more), four whorls of limbs that are bare and silver for their first three tenths and carry their
    // leaves beyond in rounded masses close about each limb (masses: see the part), the lowest whorl the longest;
    // the inner ring's are grown as the close trees are (their limbs round, twigs on them), for the climb passes
    // over and between them. EVERY ONE IS A HOUSE: one to four open platforms (no wall, no rail; a plaited screen
    // on one side of the lowest of about half of them), a white rope ladder from the ground to the lowest and from
    // each to the next, lamps at every platform's rim and through all its tiers of boughs.
    //  The lowest platform lies in the lowest boughs, 2 m under the crown's foot. A higher one lies OVER_BOUGH above a
    //  tier of boughs (which carry it, and are clear of its floor at its rim: they rise by less than that over its
    //  breadth), where that is a storey (STOREY) or more above the platform below and the next tier leaves head room
    //  (HEAD) over it; each is narrower than the one below by a seventh of the lowest, and none narrower than leaves
    //  2.4 m of floor round the trunk. So a tall tree can carry four and a low one carries one or two; how many of
    //  those it does carry is the tree's own (the platforms' stream).
    //  A HOUSE STANDS ON FREE GROUND: off every stair and off the rill by its roots' reach and a step (cityRoom), off
    //  the route, the other trunks, the fountain and the gate. One drawn where it may not stand is stood at the
    //  nearest place on its own bearing from the great trunk where it may (HOUSE_SHIFT: 4 m further out, 4 m
    //  nearer, 8 m, and so to 12 m either way); where none of those is free, no tree stands there.
    {
      const OVER_BOUGH = 1.8, STOREY = 7.5, HEAD = 3, HOUSE_SHIFT = [0, 4, -4, 8, -8, 12, -12], ringPlan = [];
      // (FIRST every place of the two rings takes its numbers and finds its ground, in the rings' order; THEN the
      //  tall houses are dealt among the outer ring's trees so planned (below); THEN every tree is grown, in that
      //  same order. ring: 0 the inner ring, 1 the outer)
      for (const [r, n, jr, gap, lod, ring] of [[0.7 * HERO.height, 10, 6, 22, 2, 0], [1.1 * HERO.height, 14, 8, 27, 1, 1]]) {
        const a0 = tw.range(0, TAU);
        for (let i = 0; i < n; i++) {
          const a = a0 + (i + tw.range(-0.25, 0.25)) / n * TAU, rr0 = r + tw.range(-jr, jr);
          // (each of its own height, 0.6 to 1 of what the cone allows there, its own girth, and its own kind by the city's
          // own stream: gold (three in five) or pale spring green; its lamps' own strength, HOUSE_GLOW: no two houses
          // are lit alike, and every one is lit; and a crown from 0.3 to 0.38 of its height in reach, as the wood's
          // trees have)
          const kr = FK.city, kind = kr() < 0.6 ? 0 : 1, glow = kr.range(HOUSE_GLOW[0], HOUSE_GLOW[1]), wide = kr.range(0.3, 0.38);
          const hk = tw.range(0.6, 1), rk = tw.range(0.032, 0.05) * 1.25, tc = tw.range(0.4, 0.5);
          const sc = tw.range(0, TAU), ro = tw.range(4.4, 6), bl = tw.int(10, 18), screened = tw.chance(0.5);
          // (how many it carries of those it can, and how many lamps hang in its boughs: 1.6 to 2.4 for each one of
          //  the count its tree draws, so that a tree's light is in its own boughs, through all its tiers. Every
          //  place of the two rings takes these two numbers with its others, AND ITS TREE'S OWN STREAM (grow),
          //  whether a tree stands there or not.)
          const pr = FK.platforms, want = pr.int(1, 4), lampsK = pr.range(1.6, 2.4), grow = FK.trees.fork('tree');
          const place = (d) => { const rr = rr0 + d, x = CX + Math.sin(a) * rr, z = CZ + Math.cos(a) * rr, g = gy(x, z) - 0.3, H = (HILL_Y + CONE * rr - g) * hk, R = H * rk; return { rr, x, z, g, H, R }; };
          // (off the trees of the rings planned before it by the same gap as off every trunk that stands)
          // (THE PLAN FIRST: the place is the first of its shifts with free ground by the plan alone. Only then is the
          //  line's room asked, of that place and no other: a place that fails it has no house. The line moves no house.)
          const free = (q) => spaced(q.x, q.z, gap) && ringPlan.every((t) => Math.hypot(t.x - q.x, t.z - q.z) >= gap) && Math.hypot(q.x - FOUNT[0], q.z - FOUNT[2]) >= 24 && !(Math.abs(q.x - GATE_X) < 15 && q.z > CZ + 96) && cityRoom(q.x, q.z, q.R);
          const at0 = HOUSE_SHIFT.map(place).find(free), at = at0 && trunkOK(at0.x, at0.z, at0.R, at0.g + at0.H) ? at0 : null; await ctx.yield(); if (!at) continue;
          const { x, z, g, H, R } = at, Lm = H * wide, f1 = H * tc - 2;
          const tierH = (j) => H * (tc + (0.94 - tc) * Math.pow(j / 3, 0.9)) + (j === 0 ? 4 : 0), tr = (h) => trunkRadius(R, H, tc, h);
          // (can: every level it can carry, the lowest first; levels: as many of them as it draws)
          const can = [f1];
          for (let j = 0; j < 3; j++) { const h = tierH(j) + OVER_BOUGH; if (h - can[can.length - 1] >= STOREY && tierH(j + 1) - h >= HEAD) can.push(h); }
          const levels = can.slice(0, want);
          // (a platform stands where its tree puts it; one the flight would pass through is not built. A ladder
          //  hangs from a platform to the one below, or from the lowest to the ground, only where its foot comes
          //  to that floor: ladderPlan; a platform it finds no such place for has none.
          //  EVERY TREE HERE IS A HOUSE: where none of the levels it drew can be built, its lowest is the next level
          //  up that can; where no level of the tree can, no tree stands at that place.)
          const floorAt = (h, k) => ({ h, ro: Math.max(ro * (1 - k / 7), tr(h) + 2.4) }), stands = (f) => pathClear(x, g + f.h, z, f.ro + 1);
          let fl = levels.map((h, k) => floorAt(h, k)).filter(stands);
          for (let k = levels.length; k < can.length && !fl.length; k++) fl = [floorAt(can[k], 0)].filter(stands);
          if (!fl.length) continue;
          ringPlan.push({ x, z, g, H, R, lod, ring, tc, Lm, tierH, tr, fl, kind, glow, sc, bl, screened, lampsK, grow, tall: null });
        }
      }
      // THE TALL HOUSES OF THE NORTH-WEST QUARTER. The city's tallest lesser trees stand on its OUTER RING in the quarter
      // between its north and its west as the great tree stands (TALL_Q: from the bearing the hall's open end faces,
      // straight away from the gate, a quarter of a turn round to the west; the evening sun stands in that quarter).
      // That is the side the hall looks out on: the folk there raised their floors nearly level with the hall's own,
      // to look across to it, and let those trees grow tall for it. A RULE OF THE CITY'S PLAN AND A DEAL:
      //  WHICH TREES CAN BE: a tree of the outer ring, at the place the rings' plan gave it, whose bearing from the
      //   great tree lies in that quarter, and that has a tall tree's room where it stands: its taller bole clear
      //   of the lane at every height, its roots off every stair and the rill (trunkOK, cityRoom), and its floor,
      //   wherever in its dealt range it lies, clear of the line by a floor's room as every house's floor is
      //   (pathClear). One that has not that room stays the plain ring tree it was planned as.
      //  THE DEAL (the stream named tall, these houses' own): how many of them are tall, two to four (TALL_HOUSES) or
      //   as many as can be; which, one after another by a draw among those left; each one's lamps' strength; how
      //   far its floor lies under the hall's deck; what lies on its floor (nothing, the table with its lamps, or
      //   the bench) and that thing's own stream (its lamps' cords).
      //  HOW TALL: its top stands at 0.8 of the great tree's height over the hill (TALL_TOP: the tallest a lesser
      //   tree is here, just over the hall's deck); its floor lies half a storey to a storey under the hall's deck
      //   (its crown stands a dozen metres deep over it); its girth is TALL_GIRTH of its height. It is grown from
      //   its own place's stream as every tree is; its leaves are of the kind the city's stream gave its place.
      //  HOW IT IS DRESSED: what lies on its floor lies on the side toward the great tree, a radian round from the
      //   straight way to it (one sits there and looks across to the hall); its ladder comes up on the side away
      //   from the great tree, behind whoever sits there.
      {
        const kr = FK.tall, TALL_HOUSES = [2, 4], TALL_Q = [0, Math.PI / 2], floorMid = HILL_Y + HERO.deck - 0.75 * STOREY;
        const can = ringPlan.filter((t) => {
          const b = Math.atan2(CX - t.x, CZ - t.z); if (t.ring !== 1 || b < TALL_Q[0] || b >= TALL_Q[1]) return false;
          const H = TALL_TOP - t.g, R = H * TALL_GIRTH;
          return trunkOK(t.x, t.z, R, t.g + H, 1.2, 2) && cityRoom(t.x, t.z, R) && pathClear(t.x, floorMid, t.z, HOUSE_RO + 1 + 0.25 * STOREY);
        });
        await ctx.yield();
        for (let k = 0, n = Math.min(can.length, kr.int(TALL_HOUSES[0], TALL_HOUSES[1])); k < n; k++) {
          const t = can.splice(kr.int(0, can.length - 1), 1)[0];
          t.tall = { glow: kr.range(COURT_GLOW[0], COURT_GLOW[1]), under: kr.range(0.5, 1) * STOREY, thing: kr.int(-1, 1), thingRng: kr.fork('thing') };
        }
      }
      for (const t of ringPlan) {
        await ctx.yield();
        const { x, z, g, lod, sc, bl, screened, lampsK, fl, tierH, tr, Lm, kind, grow } = t, cq = quarterOf(x, z), lb = (k) => sc + 2.5 + k * 2.1;
        if (t.tall) {
          // (a tall house: one floor, the boughs that carry it under it; toTree: the bearing from it to the great tree;
          //  its thing on the side toward the great tree, its ladder on the side away from it)
          const H = TALL_TOP - g, R = H * TALL_GIRTH, fh = HILL_Y + HERO.deck - t.tall.under - g, tc = (fh + 2) / H, nT = clamp(Math.round((H - fh) / 5), 2, 5), glow = t.tall.glow;
          const toTree = Math.atan2(CX - x, CZ - z), rIn = trunkRadius(R, H, tc, fh) * 1.05 + 0.9, lp = ladderPlan(R, H, tc, fh, 0, HOUSE_RO, 1.2, 2), b = toTree + 1.0, rb = (rIn + HOUSE_RO) / 2;
          const f = { h: fh, rOut: HOUSE_RO, rIn, lampEvery: 1.6 / dens, cord: [0.7, 1.6], screen: null, hatch: lp ? lp.hatch(toTree + Math.PI) : null, lampSkip: lp ? lp.skip(toTree + Math.PI) : null, struts: { r: trunkRadius(R, H, tc, fh - 5) + 0.1, drop: 5, n: 8 } };
          const info = await plant(cityB[cq], { rng: grow, x, z, H, R, lod: 2, roots: true, masses: true, bare: 0.3, far: cityFarB[cq], crownBase: tc, lit: true, boughLamps: Math.round(40 * dens), Lmax: HOUSE_REACH, glow, leafCol: kind === 1 ? greenLeaf : undefined,
            tiers: [...tiersFor(H, tc, nT, 6, HOUSE_REACH, [fh]).map((q) => ({ ...q, cards: 20, size: [3.8, 5.6], tiles: 3, dome: 0.14, thick: 0.42 })), { h: fh - 2.2, n: 4, L: 9, rise: 0.22, curl: 0.05, thick: 0.6, cards: 0 }],
            flets: [f], parts: t.tall.thing < 0 ? undefined : (sk) => { const c = sk.centre(fh); return [watchThing(t.tall.thing, [c[0] + Math.sin(b) * rb, c[1], c[2] + Math.cos(b) * rb], Math.cos(b), -Math.sin(b), Math.sin(b), Math.cos(b), glow, t.tall.thingRng)]; } });
          cityTrees.push([x, z, Math.hypot(x - FOUNT[0], z - FOUNT[2]), glow]);
          if (lp) hang(info, toTree + Math.PI, fh, lp, g);
        } else {
          const { H, R, tc, glow } = t;
          fl.forEach((f, k) => { f.lp = ladderPlan(R, H, tc, f.h, k ? fl[k - 1].h : 0, f.ro, 1.2, lod, k ? fl[k - 1].ro : 0); });
          const info = await plant(cityB[cq], { rng: grow, x, z, H, R, lod, body: true, roots: true, masses: true, bare: 0.3, far: cityFarB[cq], crownBase: tc, lit: true, boughLamps: Math.round(bl * dens * lampsK), Lmax: Lm,
            glow, leafCol: kind === 1 ? greenLeaf : undefined,
            tiers: Array.from({ length: 4 }, (_, j) => ({ h: tierH(j), n: 6, L: Lm * (1 - 0.6 * Math.pow(j / 3, 1.3)), rise: lerp(0.14, 0.4, j / 3), curl: 0.1, cards: 20, size: [3.8, 5.6], tiles: 3, dome: 0.14, thick: 0.42 })),
            flets: fl.map((f, k) => withStruts({ h: f.h, rOut: f.ro, rIn: (k ? tr(f.h) : R) * 1.05 + 0.9, lampEvery: 2.6 / dens, screen: k === 0 && screened ? [sc, sc + 1.3] : null,
              hatch: f.lp ? f.lp.hatch(lb(k)) : null, lampSkip: f.lp ? f.lp.skip(lb(k)) : null }, R, H, tc)) });
          cityTrees.push([x, z, Math.hypot(x - FOUNT[0], z - FOUNT[2]), glow]);
          fl.forEach((f, k) => { if (f.lp) hang(info, lb(k), f.h, f.lp, g); });
        }
        await rest();
      }
    }

    // the mound: a ring of snowy white leafless trees standing well apart (eleven, 21 m from one to the next), each of
    // its own height, lean and number of boughs, many fine boughs and twigs sweeping up; a ring of tall pale-gold ones
    // inside it (every tree of both rings on a spreading foot with its roots running out over the turf, as the
    // wood's trees stand); and the middle tree with its white platform under its crown, 23 m up (its underside is
    // in shade, underK of its white, and lamps of gold and silver hang thick round its rim). We go up through the rings:
    // a tree of either ring whose stem would stand within its foot's room of the route's line (lineRoom: its foot's
    // reach and TRUNK_GAP or its own breadth, as every trunk of the flight) is not there (the rings have their
    // gaps where the way goes through). (Every place of both rings takes its numbers and its tree's stream, whether
    // its tree stands or not.)
    const ringOK = (x, z, R, H, flare) => { const g = gy(x, z), room = lineRoom(R, flare, 2); for (let h = 0; h <= H; h += 3) if (!pathClear(x, g + h, z, room - 6)) return false; return true; };
    const paleLeaf = (r, b) => mix3(K.leafCol(r, b * 1.08), mul3(P.leafLit, b), 0.5);
    {
      const a0 = tw.range(0, TAU), NWH = 11;
      for (let i = 0; i < NWH; i++) {
        const a = a0 + (i + tw.range(-0.2, 0.2)) / NWH * TAU, r = RING_WHITE + tw.range(-2, 2), H = tw.range(24, 34), nb = tw.int(4, 6), up = tw.range(0.45, 0.75);
        const x = MX + Math.sin(a) * r, z = MZ + Math.cos(a) * r, R = tw.range(1.0, 1.3), crownBase = tw.range(0.26, 0.36), bend = tw.range(0.02, 0.06), grow = tr.fork('tree');
        if (!ringOK(x, z, R, H, 0.9)) continue;
        await plant(moundB, { rng: grow, x, z, H, R, lod: 2, far: moundFarB, bSides: 4, twigs: 6, twigPlain: true, twigUp: [0.5, 0.95], crownBase, bark: WHITE_BARK, barkKind: 3, tint: 1, flare: 0.9, roots: true, leafK: 0, leafless: true, top: false, bend,
          tiers: Array.from({ length: 6 }, (_, j) => ({ h: H * (0.3 + 0.115 * j), n: nb, L: H * (0.3 - 0.032 * j), rise: up + 0.12 * j, curl: 0.3, thick: 0.5 })) });
      }
      for (let i = 0; i < 9; i++) {
        const a = a0 + (i + tw.range(-0.15, 0.15)) / 9 * TAU, r = RING_GOLD + tw.range(-1, 1), H = tw.range(40, 48);
        const x = MX + Math.sin(a) * r, z = MZ + Math.cos(a) * r, R = tw.range(1.3, 1.7), crownBase = tw.range(0.56, 0.62), grow = tr.fork('tree');
        if (!ringOK(x, z, R, H, 1.2)) continue;
        await plant(moundB, { rng: grow, x, z, H, R, lod: 2, far: moundFarB, leafK: 1.3, crownBase, leafCol: paleLeaf, Lmax: 13, roots: true, bSides: 4, twigs: 1,
          tiers: Array.from({ length: 5 }, (_, j) => ({ h: H * (0.6 + 0.085 * j), n: 5, L: 13 * (1 - 0.14 * j), rise: 0.18 + 0.06 * j, curl: 0.1, cards: 14, size: [4.2, 6.4], tiles: 4, dome: 0.12 })) });
      }
      const H = MID_H, R = 2.6, tc = 0.5, fh = 23;
      const lp = ladderPlan(R, H, tc, fh, 0, 8, 1.2, 2), la = -Math.PI / 2;
      const info = await plant(moundB, { rng: tr.fork('tree'), x: MX, z: MZ, H, R, lod: 2, far: moundFarB, crownBase: tc, leafCol: paleLeaf, Lmax: 16, lit: true, tiers: tiersFor(H, tc, 5, 6, 16, [fh]),
        flets: [withStruts({ h: fh, rOut: 8, rIn: R + 1.2, lampEvery: 2.8, mix: [0, 0.5, 0.5], cord: [0.8, 1.4], white: true, underK: 0.36, hatch: lp ? lp.hatch(la) : null, lampSkip: lp ? lp.skip(la) : null }, R, H, tc)] });
      if (lp) hang(info, la, fh, lp, gy(MX, MZ) - 0.3);
    }
    await rest();

    // the two outposts of the road: each a great tree (its bole 8.4 m through) with a white platform in the fork of
    // four short stout boughs, braced by ten struts from the bole, a rope ladder down through the opening round its
    // trunk on the side of the road, a plaited screen on the side away from it, and three gold lamps
    const placeOf = (m, x, z) => (m < S.bole ? 0 : m < S.fallN ? 1 : m < S.clearIn ? 2 : m < S.mound ? 3 : m < S.clearOut ? 4 : m < S.out2 ? 5 : m < S.gate ? 6 : 7 + quarterOf(x, z));
    // (which side of the route's line a place lies on: 0 left, 1 right of the way flown, at the nearest of its low samples)
    const sideOf = (x, z) => { const i = clamp(Math.round(pathNear(x, z, lowY).u * (NS - 1)), 1, NS - 2) * 3; return (PS[i + 3] - PS[i - 3]) * (z - PS[i + 2]) - (PS[i + 5] - PS[i - 1]) * (x - PS[i]) > 0 ? 1 : 0; };
    const setOf = (pl, x, z) => (pl < 7 ? pl * 2 + sideOf(x, z) : pl + 7);
    const namedTrees = [], chOf = (x, z) => setOf(placeOf(pathNear(x, z, lowY).u * LEN, x, z), x, z);
    const forked = (H, tc, fh, L) => [...tiersFor(H, tc, 6, 6, L, [fh]), { h: fh - 2.2, n: 4, L: 10, rise: 0.22, curl: 0.05, thick: 0.6, cards: 0 }];
    for (let i = 0; i < 2; i++) {
      const [x, z] = OUTPOST[i], side = Math.sign(x - roadX(z)), g = gy(x, z) - 0.3, H = 84, R = 4.2, tc = 0.3, fh = H * tc - 2, az = -side * Math.PI / 2;
      const lp = ladderPlan(R, H, tc, fh, 0, 7, 1.2, 2);
      const f = withStruts({ h: fh, rOut: 7, rIn: R + 1.2, lampEvery: 14.6, mix: [0, 1, 0], lampSize: 0.9, cord: [1.2, 1.6], screen: [az + 2.2, az + 3.6], white: true, hatch: lp ? lp.hatch(az) : null, lampSkip: lp ? lp.skip(az) : null }, R, H, tc);
      f.struts = { r: trunkRadius(R, H, tc, fh - 5) + 0.1, drop: 5, n: 10 };
      const info = await plant(woodB[chOf(x, z)], { rng: tr.fork('tree'), x, z, H, R, lod: 2, crownBase: tc, lit: true, boughLamps: 0, tiers: forked(H, tc, fh, 25), Lmax: 25, flets: [f] });
      if (lp) hang(info, az, fh, lp, g);
      namedTrees.push([x, z]);
    }
    // east of the stream: the bole wider than a house (13 m through), above the first fall; and further up the guard
    // tree with the guards' platform: a bare wooden floor GUARD_H up in the fork of its lowest boughs, one
    // light plaited screen on its side away from the stream, a rope ladder hanging to the ground; no lamp
    {
      // (the bole stands where it is named, or as much further from the line as its foot's room asks: standOff)
      const boleAt = standOff(BOLE[0], BOLE[1], 6.5, 98, 1.35, 2);
      await plant(woodB[chOf(boleAt[0], boleAt[1])], { rng: FK.boleTree, x: boleAt[0], z: boleAt[1], H: 98, R: 6.5, lod: 2, roots: true, flare: 1.35, crownBase: 0.5 });
      namedTrees.push(boleAt);
      const [x, z] = GUARD, g = gy(x, z) - 0.3, H = 80, R = 3.2, tc = 0.34, fh = GUARD_H + 0.3, az = -Math.PI / 2;
      const lp = ladderPlan(R, H, tc, fh, 0, 6.6, 1.2, 2);
      const f = { h: fh, rOut: 6.6, rIn: R + 1.2, lampEvery: 0, screen: [0.9, 2.2], hatch: lp ? lp.hatch(az) : null, lampSkip: lp ? lp.skip(az) : null, struts: { r: trunkRadius(R, H, tc, fh - 4.5) + 0.1, drop: 4.5, n: 8 } };
      const info = await plant(woodB[chOf(x, z)], { rng: FK.guardTree, x, z, H, R, lod: 2, roots: true, crownBase: tc, tiers: forked(H, tc, fh, 24), Lmax: 24, flets: [f] });
      if (lp) hang(info, az, fh, lp, g);
      namedTrees.push(GUARD);
    }
    // the wood: a jittered lattice of giants, full trees near the route, plainer ones behind, bare canopy far away
    const fallenAt = [];
    // THE WOOD SEEN FROM ABOVE. From the great tree's platforms the wood round the city and out to the haze was one
    // crown stamped in rows. So a crown differs from the wood's mean by rule, from its place alone (no number of
    // chance is drawn for it):
    //   groves: the crowns of one grove are broader and those of the next narrower (0.72 to 1.28 of the mean) and
    //     the trees of a broad grove are taller with it; about one tree in sixteen is a giant, its crown half as
    //     broad again and more, a fifth taller;
    //   tint: one grove is deeper gold, the next greener, and some are paler or darker than the mean;
    //   beyond FLOOR_TO of the route's line, where a crown stands on a plain trunk: it stands up to a third of the
    //     lattice's step off its row, and here and there a glade stands open (no crown and no trunk; its edge is
    //     ragged).
    // It is asked of the wood round the city (the trees whose nearest place of the route lies past the gate) and of
    // the far wood. The wood the flight goes through, seen from its floor, is as it was: nothing of this is asked
    // of a tree within TRUNKS_TO whose nearest place of the route is before the gate.
    const woodVar = (x, z, wide) => {
      const g = clamp(noise.n2(x * 0.0043 + 11.7, z * 0.0043 - 3.9) * 1.5, -1, 1), t = clamp(noise.n2(x * 0.0061 - 6.2, z * 0.0061 + 9.4) * 1.5, -1, 1), b = noise.n2(x * 0.0097 + 2.6, z * 0.0097 - 14.3);
      const giant = placeHash(x * 0.731 + 5.1, z * 0.619 - 2.3) < 0.065, s = giant ? 1.5 + 0.2 * g : 1 + 0.28 * g, k = 1 + 0.16 * b;
      const tint = t > 0 ? [k * (1 + 0.08 * t), k * (1 - 0.07 * t), k * (1 - 0.3 * t)] : [k * (1 + 0.2 * t), k * (1 - 0.02 * t), k * (1 + 0.18 * t)];
      // (grown: what a tree grown bough by bough takes of it: its height, its boughs' reach, its sprays' size and its
      //  leaves' tint, the leaf's colour dealt from the tree's stream as always)
      const h = (1 + 0.12 * g) * (giant ? 1.2 : 1), grown = { spread: s, sprayK: Math.sqrt(s), leafCol: (r, bright) => { const c = K.leafCol(r, bright); c[0] *= tint[0]; c[1] *= tint[1]; c[2] *= tint[2]; return c; } };
      if (!wide) return { s, tint, lay: true, h, grown, dx: 0, dz: 0 };
      const glade = smoothstep(0.4, 0.6, noise.n2(x * 0.0052 + 31.3, z * 0.0052 + 17.9));
      return { s, tint, lay: placeHash(x * 0.913 - 7.7, z * 1.171 + 3.3) >= glade, h, grown, dx: (placeHash(x * 1.31 + 0.7, z * 0.77 - 1.9) - 0.5) * 0.66, dz: (placeHash(x * 0.57 - 3.3, z * 1.43 + 6.1) - 0.5) * 0.66 };
    };
    {
      // a far crown is a rounded mass: its cards lie on a dome (the middle one highest, the outer ones lower, leaning
      // outward and darker), and there is a gap between one crown and the next. Returns how many of its cards stand
      // (none over the river's water, over the stream or in the road's open avenue): a trunk stands only under a crown.
      // (cr: the crown's own stream, which its place took whether a crown stands there or not: its dome's cards first,
      //  then its sides; no crown's cards depend on how many cards another crown has or on whether it stands.)
      // (THE FAR BANK IS WOOD: the far lattice lays its trees beyond the river as on this side, and a card is left
      //  out only over the water's own sheet.)
      // (v: how this crown differs from the wood's mean, see woodVar: its breadth v.s and its tint; v.lay false: the
      //  crown's numbers are drawn and nothing is laid)
      const STEP = 31, far = (lb, cr, x, y, z, H, n = 9, v = null) => {
        const R0 = (n > 6 ? 15 : 11) * (v ? v.s : 1); let made = 0;
        for (let k = 0; k < n; k++) {
          const a = cr.range(0, TAU), e = k === 0 ? 0 : Math.sqrt(cr.range(0.15, 1)), r = R0 * e, sz = (n > 6 ? cr.range(12, 17) : cr.range(20, 27)) * (1 - 0.25 * e) * (v ? v.s : 1);
          const nx = Math.sin(a) * 0.75 * e + cr.range(-0.15, 0.15), nz = Math.cos(a) * 0.75 * e + cr.range(-0.15, 0.15), nl = Math.hypot(nx, 1, nz);
          const cx = x + Math.sin(a) * r, cz = z + Math.cos(a) * r, cy = y + H * (0.95 - 0.2 * e * e), sp = cr.range(0, TAU), ph = cr(), col = K.leafCol(cr, 1.02 - 0.3 * e);
          if (v) { if (!v.lay) continue; col[0] *= v.tint[0]; col[1] *= v.tint[1]; col[2] *= v.tint[2]; }
          if (!avenueOpen(cx, cz, sz) || !streamOpen(cx, cz, sz)) continue;
          { const bk = cz - reachN(cx); if (cz < -1000 && bk < sz * 0.4 && bk > -REACH_W - 12 - sz * 0.4) continue; }
          lb.add(cx, cy, cz, nx / nl, 1 / nl, nz / nl, sp, sz, Math.round(sz * 0.55), 0.8, ph, col, nx / nl, 1 / nl, nz / nl, 0.95 - 0.5 * e); made++;
        }
        // THE CROWN'S SIDES (asked of the wood round the city and of the far wood: where v is given). A dome of
        // cards that lie nearly flat is, from the great tree and from the side, a thin lens on a pole: the far wood
        // read as poles standing apart on a floor. Each such crown has SIDES upright masses hanging round its rim
        // (looking outward, a little up; from the dome's edge down a third of the tree, SIDE_DEEP; darker than the top: they
        // are its shade side), so that crown stands against crown as a ridge of leaf and the trunks are seen only
        // under them. Dealt from the crown's own stream, after its dome's cards.
        if (v) {
          const m = n > 6 ? 4 : 3, a0 = cr.range(0, TAU), SIDE_DEEP = 0.36;
          for (let k = 0; k < m; k++) {
            const a = a0 + (k + cr.range(-0.25, 0.25)) / m * TAU, sz = Math.min(R0 * cr.range(1.25, 1.6), H * SIDE_DEEP), sp = cr.range(-0.35, 0.35), ph = cr(), col = K.leafCol(cr, 0.74);
            const cx = x + Math.sin(a) * R0 * 0.7, cz = z + Math.cos(a) * R0 * 0.7, cy = y + H * 0.93 - sz * 0.42, nl = Math.hypot(1, 0.3);
            if (!v.lay || made === 0) continue;
            col[0] *= v.tint[0]; col[1] *= v.tint[1]; col[2] *= v.tint[2];
            if (!avenueOpen(cx, cz, sz) || !streamOpen(cx, cz, sz)) continue;
            { const bk = cz - reachN(cx); if (cz < -1000 && bk < sz * 0.4 && bk > -REACH_W - 12 - sz * 0.4) continue; }
            lb.add(cx, cy, cz, Math.sin(a) / nl, 0.3 / nl, Math.cos(a) / nl, sp, sz, Math.round(sz * 0.55), 0.8, ph, col, Math.sin(a) * 0.7, 0.7, Math.cos(a) * 0.7, 0.6);
          }
        }
        return made;
      };
      for (let gz = BZ1; gz > BZ0; gz -= STEP) {
        for (let gx = BX0; gx < BX1; gx += STEP) {
          const x0 = gx + tw.range(0.12, 0.88) * STEP, z0 = gz - tw.range(0.12, 0.88) * STEP, H = tw.range(58, 84), R = H * tw.range(0.034, 0.042), keep = tw.chance(0.86);
          // (EVERY PLACE OF THE LATTICE TAKES ITS OWN THREE STREAMS, whether a tree stands there or not: its tree's
          //  (grow), its far crown's (crown) and its fallen bough's (lie: whether one lies by it, and how it lies).
          //  No tree's boughs, no crown's cards and no fallen bough depend on which other places are taken, nor
          //  on how a tree elsewhere is drawn.)
          const grow = tr.fork('tree'), crown = tn.fork('crown'), lie = FK.fallen.fork('bough');
          if (!keep) continue;
          // (the entry axis behind the entry: see axisEdge)
          let x = x0, z = z0;
          {
            const e = axisEdge(x0, z0, R);
            if (e) {
              const may = (q) => !(q[1] < stream.z0 + 20 && q[1] > stream.z1 && stream.dist(q[0], q[1]) < R * 2 + stream.HALF + 4.5) && trunkOK(q[0], q[1], R, gy(q[0], q[1]) + H);
              const own = (q) => q[0] > gx + 0.12 * STEP && q[0] < gx + 0.88 * STEP && q[1] < gz - 0.12 * STEP && q[1] > gz - 0.88 * STEP;
              const q = e.find((q) => own(q) && may(q)) || e.find(may); if (!q) continue;
              x = q[0]; z = q[1];
            }
          }
          const dc = Math.hypot(x - CX, z - CZ), dm = Math.hypot(x - MX, z - MZ);
          if (dc < OPEN || dm < CLEARING) continue;
          const bank = z - reachN(x); if (bank < 14) continue;
          const low = z < -1000 ? lerp(0.42, 1, smoothstep(10, 120, bank)) : 1;
          if (z < stream.z0 + 20 && z > stream.z1 && stream.dist(x, z) < R * 2 + stream.HALF + 4.5) continue;
          const near = pathNear(x, z), g = gy(x, z);
          if (!trunkOK(x, z, R, g + H)) continue;
          const nm = near.u * LEN;
          // (the road's avenue stays open: no bole within AVENUE_BOLES of the road's straight, from the mound's foot to the gate)
          if (inAvenue(x, z, AVENUE_BOLES)) continue;
          // (nor within 24 m of a named great tree: the outposts, the great bole, the guard tree)
          if (namedTrees.some((a) => Math.hypot(a[0] - x, a[1] - z) < 24)) continue;
          const pl = placeOf(nm, x, z), ch = setOf(pl, x, z);
          // (a tree within 46 m of the flight is grown bough by bough, one within 40 m shows its great roots; a fallen bough lies by about one such tree in four)
          // (a tree whose foot would stand in a foot that stands already is not stood: trunkFree; its numbers are drawn)
          if (near.d < 46) { const fell = lie.chance(0.25); if (!trunkFree(x, z, footOf(R, 1.2, 1))) continue; await plant(woodB[ch], { rng: grow, x, z, H, R, lod: 1, roots: near.d < 40 }); far(woodFar[pl].leaves, crown, x, g, z, H, 10); if (fell) fallenAt.push([x, z, R, ch, lie]); }
          else if (near.d < TRUNKS_TO) {
            const v = pl >= 7 ? woodVar(x, z, false) : null, hk = v ? v.h : 1;
            if (!trunkFree(x, z, footOf(R * low * hk, 1.2, 0))) continue;
            await plant(woodB[ch], { rng: grow, x, z, H: H * low * hk, R: R * low * hk, lod: 0, ...(v ? v.grown : null) }); far(woodFar[pl].leaves, crown, x, g, z, H * low * hk, 9, v);
          }
          else {
            // (the thinning rim: its trees grow from their places' own streams as every tree does, their feet on the falling floor; their crowns' far cards lie over them)
            const rv = woodVar(x, z, false);
            if (near.d < FLOOR_TO && placeHash(x, z) > (near.d - TRUNKS_TO) / (FLOOR_TO - TRUNKS_TO)) { if (!trunkFree(x, z, footOf(R * low * rv.h, 1.2, 0))) continue; await plant(woodB[ch], { rng: grow, x, z, H: H * low * rv.h, R: R * low * rv.h, lod: 0, sink: floorEnd(near.d), ...rv.grown }); }
            else {
              // (a far crown on a plain trunk: off its row where that leaves it off the city's ground, the mound's
              //  clearing, the river's bank and the stream AND OFF EVERY TRUNK THAT STANDS (trunkFree: a crown
              //  moved off its row does not stand in its neighbour); else on its row, if it is free there; else
              //  its numbers are drawn and nothing stands, as in a glade)
              const v = woodVar(x, z, true), fr = R * low * 1.1; let px = x + v.dx * STEP, pz = z + v.dz * STEP;
              if (Math.hypot(px - CX, pz - CZ) < OPEN || Math.hypot(px - MX, pz - MZ) < CLEARING || pz - reachN(px) < 14 || (pz < stream.z0 + 20 && pz > stream.z1 && stream.dist(px, pz) < R * 2 + stream.HALF + 4.5) || !trunkFree(px, pz, fr)) { px = x; pz = z; if (!trunkFree(px, pz, fr)) v.lay = false; }
              if (v.lay) { stand(px, pz, fr); shadeTrees.push([px, pz, R, H * v.h]); roofTrees.push([px, pz, 0.36 * H * low * v.h, gy(px, pz) + H * low * v.h, 0]); }
              const fq = farB[(px > CX ? 1 : 0) + (pz > -500 ? 2 : 0)], fg = gy(px, pz);
              if (far(fq.leaves, crown, px, fg, pz, H * low * v.h, 9, v) > 2) farTrunk(fq.solid, px, lerp(fg, FAR_Y, floorEnd(near.d)) - 0.3, pz, H * low * v.h, R * low, 5);
              await rest(450); continue;
            }
            far(farB[(x > CX ? 1 : 0) + (z > -500 ? 2 : 0)].leaves, crown, x, g, z, H * low * rv.h, 9, rv);
          }
          await rest(450);
        }
      }
      // beyond the fine ground: crowns on plain trunks, out to where the haze takes them (a trunk's girth there is
      // the wood's mean, FAR_GIRTH of its height; three-sided beyond FAR_ROUND of the route, where it is never
      // nearer the eye than that: two thirds of a degree across at most)
      const FS = 44, FAR_GIRTH = 0.038, FAR_ROUND = 520, FAR_BROAD = 1.4;
      for (let gz = 760; gz > -1800; gz -= FS) {
        for (let gx = -940; gx < 1020; gx += FS) {
          const x = gx + tw.range(0.1, 0.9) * FS, z = gz - tw.range(0.1, 0.9) * FS, H = tw.range(60, 84), crown = tn.fork('crown');
          if (x > BX0 && x < BX1 && z > BZ0 && z < BZ1) continue;
          if (Math.hypot(x - CX, z - (CZ + 300)) > FAR_WOOD) continue;
          const bank = z - reachN(x); if (bank < 16 && bank > -REACH_W - 16) continue;
          // (out here a tree has few cards and stands 44 m from the next: its crown is FAR_BROAD broader than the
          //  rule gives it, twice the mean at most, so that from the great tree the far wood is a roof of leaf with
          //  glades in it and not trunks standing apart on a pale floor)
          const v = woodVar(x, z, true); let px = x + v.dx * FS, pz = z + v.dz * FS; v.s = Math.min(v.s * FAR_BROAD, 2);
          { const bk = pz - reachN(px); if ((bk < 16 && bk > -REACH_W - 16) || !trunkFree(px, pz, H * v.h * FAR_GIRTH * 1.1)) { px = x; pz = z; } }
          // (by the river the wood stands lower, on either bank, as the nearer wood does on the near one: from the
          //  water its edge is a bank of leaf that rises to the wood's height over 120 m)
          const fh = H * v.h * (z < -1000 ? lerp(0.42, 1, smoothstep(10, 120, bank > 0 ? bank : -bank - REACH_W - 12)) : 1);
          // (the entry axis behind the entry: a far trunk drawn within its room of it stands at that room's edge, on its own side)
          { const e = axisEdge(px, pz, fh * FAR_GIRTH); if (e) { px = e[0][0]; pz = e[0][1]; } }
          // (off every trunk that stands, as the nearer far crowns are: else nothing stands here)
          if (!trunkFree(px, pz, fh * FAR_GIRTH * 1.1)) v.lay = false;
          const nearBy = pathWithin(x, z, FAR_ROUND), fq = farB[(px > CX ? 1 : 0) + (pz > -500 ? 2 : 0)];
          if (far(fq.leaves, crown, px, 0, pz, fh, nearBy ? 8 : 5, v) > 2) { farTrunk(fq.solid, px, FAR_Y - 0.3, pz, fh, fh * FAR_GIRTH, nearBy ? 5 : 3); stand(px, pz, fh * FAR_GIRTH * 1.1); }
          await rest(8);
        }
        await rest(300);
      }
    }
    // fallen silver boughs: one lies on the floor beside each tree drawn above, 2 to 3 trunk-widths from its foot, on a bearing of its own
    // (each dealt from its tree's place's own stream of the fallen: lie)
    let nFallen = 0;
    for (const [tx, tz, R, ch, fr2] of fallenAt) {
      if (++nFallen % 10 === 0) await ctx.yield();
      const a = fr2.range(0, TAU), d = R * fr2.range(4, 6) + 2, len = fr2.range(8, 15), b = a + fr2.range(1.1, 2.0), r0 = fr2.range(0.28, 0.5), sb = woodB[ch].solid;
      const x0 = tx + Math.sin(a) * d, z0 = tz + Math.cos(a) * d, pts3 = [], rad = [];
      for (let i = 0; i <= 4; i++) { const t = i / 4, x = x0 + Math.sin(b) * len * t + Math.sin(b + 1.57) * 0.8 * Math.sin(t * 3.1), z = z0 + Math.cos(b) * len * t + Math.cos(b + 1.57) * 0.8 * Math.sin(t * 3.1); pts3.push([x, gy(x, z) + r0 * (0.75 - 0.4 * t), z]); rad.push(r0 * (1 - 0.7 * t)); }
      if (pts3.every((q) => pathClear(q[0], q[1], q[2], 0) && (!inStream(q[2]) || stream.dist(q[0], q[2]) > stream.HALF + 2))) { sb.kind = 0; sb.field = null; sb.tube(pts3, rad, 6, mul3(P.bark, 0.82)); }
    }
    await ctx.yield();
    for (let i = 0; i < ladders.length; i++) { const L = ladders[i]; K.ladder(thinB, L[0], L[1] - 0.1, L[5] ?? gy(L[0], L[2]) + 0.1, L[2], [L[3], L[4]], 0.9, 0); if (i % 3 === 2) await ctx.yield(); }
    await ctx.yield();

    // ------------------------------------------------------------ the long shadows of the trunks, baked into one map
    // (red: the trunks' shadows; green: the bare earth and roots round each trunk's foot)
    // (a shadow is soft-edged: it fades from its core to nothing across the outer two thirds of its half-width, so
    // its edge grows with it; the ground's shader breaks it with flecks of leaf light)
    const SW = 512, SH = 1024, shadePx = new Uint8Array(SW * SH * 2);
    // (a function of its own: half a million points, and the engine speeds up a small function, not a loop in this long build)
    for (let a = 0; a < shadePx.length; a += 131072) { ((px, e) => { for (let i = a; i < e; i += 2) px[i] = 255; })(shadePx, Math.min(shadePx.length, a + 131072)); await ctx.yield(); }
    await ctx.yield();
    {
      const dx = -sunXZ.x, dz = -sunXZ.y, kx = SW / (BX1 - BX0), kz = SH / (BZ1 - BZ0), LS = mode === 'late' ? 90 : 130;
      // (functions of their own: the engine speeds up a small function, not a loop inside this long build)
      const cast = (tx, tz, R) => {
        for (let s = R * 1.4; s < LS; s += 1.6) {
          const f = s / LS, w = R * (1.05 + 1.1 * f), a = 0.9 * Math.pow(1 - f, 0.6), cx = tx + dx * s, cz = tz + dz * s;
          for (let q = -w - 1.2; q <= w + 1.2; q += 1.25) {
            const px = Math.round((cx - dz * q - BX0) * kx), pz = Math.round((cz + dx * q - BZ0) * kz); if (px < 1 || pz < 1 || px >= SW - 1 || pz >= SH - 1) continue;
            const v = 255 * (1 - a * smoothstep(w + 0.9, w * 0.34, Math.abs(q))), i = (pz * SW + px) * 2; if (v < shadePx[i]) shadePx[i] = v;
          }
        }
      };
      const foot = (tx, tz, R) => {
        const rr = R * 3.6 + 2, x0 = Math.max(1, Math.floor((tx - rr - BX0) * kx)), x1 = Math.min(SW - 2, Math.ceil((tx + rr - BX0) * kx)), z0 = Math.max(1, Math.floor((tz - rr - BZ0) * kz)), z1 = Math.min(SH - 2, Math.ceil((tz + rr - BZ0) * kz));
        for (let pz = z0; pz <= z1; pz++) for (let px = x0; px <= x1; px++) { const d = Math.hypot(px / kx + BX0 - tx, pz / kz + BZ0 - tz), v = 255 * smoothstep(rr, R * 1.5, d), i = (pz * SW + px) * 2 + 1; if (v > shadePx[i]) shadePx[i] = v; }
      };
      for (let ti = 0; ti < shadeTrees.length; ti++) { const t = shadeTrees[ti]; cast(t[0], t[1], t[2]); foot(t[0], t[1], t[2]); await rest(300); }
    }
    const shadeTex = new THREE.DataTexture(shadePx, SW, SH, THREE.RGFormat, THREE.UnsignedByteType);
    shadeTex.minFilter = THREE.LinearFilter; shadeTex.magFilter = THREE.LinearFilter; shadeTex.wrapS = shadeTex.wrapT = THREE.ClampToEdgeWrapping; shadeTex.needsUpdate = true;
    // (the part's one-pixel stand-in is freed where the shade map takes its place)
    { const stand = K.U.uShade.value; K.U.uShade.value = shadeTex; stand.dispose(); } K.U.uShadeST.value.set(1 / (BX1 - BX0), 1 / (BZ1 - BZ0), -BX0 / (BX1 - BX0), -BZ0 / (BZ1 - BZ0)); K.U.uShadeK.value = 1;
    await rest(1500);

    // ------------------------------------------------------------ the ground: wood floor and mound (a lattice), the city's hill (rings), the stream bed (a strip)
    const poolP = Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 1, 9)), poolC = Array.from({ length: 12 }, () => new THREE.Vector3());
    const groundMat = new THREE.ShaderMaterial({ uniforms: { ...K.U, uMist: { value: new THREE.Vector4() }, uLampMap: { value: null }, uWaterY: { value: new THREE.Vector2(FOSSE_WATER, REACH_Y) }, uLampST: { value: new THREE.Vector4(0, 0, -1, -1) }, uPoolP: { value: poolP }, uPoolC: { value: poolC }, uStream: { value: new THREE.Vector4(stream.amp, stream.ph, stream.HALF, stream.z1) }, uFallZ: { value: Array.from({ length: 8 }, (_, i) => (stream.falls[i] ? stream.falls[i].z : 1e5)) } }, vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG });
    const groundMesh = (pos, nor, ag, idx) => {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('aG', new THREE.Float32BufferAttribute(ag, 4));
      g.setIndex(Array.isArray(idx) ? idx : new THREE.BufferAttribute(idx, 1)); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, groundMat); scene.add(m); return m;
    };
    // cover of a point: [grass, stones, leaf drift on the grass, flowers]. The mound's grass thins outward into the
    // leaves over 30 m; the city's green runs from its hill over wall and fosse and the treeless space before it and
    // thins into the wood's floor over 24 m; moss and grass reach out in patches along the stream's banks and along
    // the ride (the ground shader breaks a partial cover into patches).
    const coverAt = (x, z, out) => {
      const dm = Math.hypot(x - MX, z - MZ), dc = Math.hypot(x - CX, z - CZ);
      let g = smoothstep(128, 98, dm), dr = 0.35 * smoothstep(60, 110, dm), fl = g;
      if (dc < OPEN + 4) { const k = smoothstep(OPEN + 2, OPEN - 22, dc); g = Math.max(g, k); dr = lerp(dr, dc < 160 ? 0.75 : 0.3, k); fl = Math.max(fl, k * (dc < 160 ? 0.55 : 0.3)); }
      const ds = inStream(z) ? stream.dist(x, z) : 99;
      if (ds < 22) { const k = 0.62 * smoothstep(22, 9, ds); if (k > g) { g = k; fl = Math.max(fl, k); } }
      if (z < MZ && z > GATE_Z) { const k = 0.55 * smoothstep(17, 3, Math.abs(x - roadX(z))); if (k > g) { g = k; fl = Math.max(fl, k); } }
      out[0] = g; out[1] = inStream(z) ? smoothstep(stream.HALF + 16, stream.HALF + 7, ds) : 0; out[2] = dr; out[3] = fl;
      return out;
    };
    {
      const CELL = 7, NX = Math.round((BX1 - BX0) / CELL), NZ = Math.round((BZ1 - BZ0) / CELL), W = NX + 1, hgt = new Float32Array(W * (NZ + 1)), cov = [0, 0, 0, 0];
      // (each row below is a function of its own: the engine speeds up a small function, not a loop inside this long build)
      // The fine floor is laid within FLOOR_TO (250 m) of the route, outside the city's own ground and off the stream's
      // bed; over its last 50 m it falls to the far ground's level (floorEnd), with its cover whole to its edge.
      // Blocks of four cells by four are asked first: 0 = all beyond the floor, 1 = all within TRUNKS_TO, 2 = on the
      // falling rim; only on the rim is the distance from the line asked corner by corner (dLine, kept).
      const BLK = 4, NBX = Math.ceil(NX / BLK), NBZ = Math.ceil(NZ / BLK), blk = new Uint8Array(NBX * NBZ), half = BLK * CELL * Math.SQRT1_2;
      const blockRow = (bj) => { for (let bi = 0; bi < NBX; bi++) { const d = pathNear(BX0 + (bi + 0.5) * BLK * CELL, BZ0 + (bj + 0.5) * BLK * CELL).d; blk[bj * NBX + bi] = d > FLOOR_TO + half ? 0 : d < TRUNKS_TO - half ? 1 : 2; } };
      for (let bj = 0; bj < NBZ; bj++) { blockRow(bj); await rest(NBX * 3); }
      const keep = new Uint8Array(NX * NZ), need = new Uint8Array(W * (NZ + 1)), dLine = new Float32Array(W * (NZ + 1));
      const dAt = (i, j) => { const a = j * W + i; if (!dLine[a]) dLine[a] = pathNear(BX0 + i * CELL, BZ0 + j * CELL).d + 1e-3; return dLine[a]; };
      const cellRow = (j) => {
        for (let i = 0; i < NX; i++) {
          const x = BX0 + (i + 0.5) * CELL, z = BZ0 + (j + 0.5) * CELL, b = blk[Math.floor(j / BLK) * NBX + Math.floor(i / BLK)];
          if (b === 0 || Math.hypot(x - CX, z - CZ) < OPEN + 8 || (z < stream.z0 - 3 && z > stream.z1 - 6 && stream.dist(x, z) < 16)) continue;
          // (a cell of the rim is laid if any of its corners is within the floor's end)
          if (b === 2 && Math.min(dAt(i, j), dAt(i + 1, j), dAt(i, j + 1), dAt(i + 1, j + 1)) > FLOOR_TO) continue;
          const a = j * W + i; keep[j * NX + i] = 1; need[a] = need[a + 1] = need[a + W] = need[a + W + 1] = 1;
        }
      };
      for (let j = 0; j < NZ; j++) { cellRow(j); await rest(NX * 0.5); }
      // heights at the corners of the kept cells and one step round them (the normals ask their neighbours)
      const heightRow = (j) => {
        for (let i = 0; i <= NX; i++) {
          const a = j * W + i;
          if (need[a] || (i > 0 && need[a - 1]) || (i < NX && need[a + 1]) || (j > 0 && need[a - W]) || (j < NZ && need[a + W])) hgt[a] = gy(BX0 + i * CELL, BZ0 + j * CELL);
        }
      };
      for (let j = 0; j <= NZ; j++) { heightRow(j); await rest(NX * 0.6); }
      const vertRow = (j, j0, map, pos, nor, ag, n0) => {
        let n = n0;
        for (let i = 0; i <= NX; i++) {
          const a = j * W + i; if (!need[a]) continue;
          const x = BX0 + i * CELL, z = BZ0 + j * CELL, h = hgt[a], dc = Math.hypot(x - CX, z - CZ);
          let hx = hgt[j * W + Math.min(NX, i + 1)] - hgt[j * W + Math.max(0, i - 1)], hz = hgt[Math.min(NZ, j + 1) * W + i] - hgt[Math.max(0, j - 1) * W + i];
          // beside the stream the normal is the fine one its bed strip uses
          if (inStream(z) && stream.dist(x, z) < 31) { const k = CELL / 1.2; hx = (gy(x + 1.2, z) - gy(x - 1.2, z)) * k; hz = (gy(x, z + 1.2) - gy(x, z - 1.2)) * k; }
          const l = Math.hypot(hx, 2 * CELL, hz);
          // (a corner whose distance from the line was never asked lies within TRUNKS_TO: the whole floor)
          const fe = dLine[a] ? floorEnd(dLine[a]) : 0;
          pos[n * 3] = x; pos[n * 3 + 1] = dc < OPEN + 15 ? h - 2.5 : lerp(h, FAR_Y + 0.05, fe); pos[n * 3 + 2] = z; nor[n * 3] = -hx / l; nor[n * 3 + 1] = 2 * CELL / l; nor[n * 3 + 2] = -hz / l;
          coverAt(x, z, cov); ag[n * 4] = cov[0]; ag[n * 4 + 1] = cov[1]; ag[n * 4 + 2] = cov[2]; ag[n * 4 + 3] = cov[3];
          map[a - j0 * W] = n++;
        }
        return n;
      };
      const indexRow = (j, j0, map, idx, k0) => {
        let k = k0;
        for (let i = 0; i < NX; i++) {
          if (!keep[j * NX + i]) continue;
          const a = map[(j - j0) * W + i], b = map[(j - j0) * W + i + 1], c = map[(j - j0 + 1) * W + i], d = map[(j - j0 + 1) * W + i + 1];
          idx[k] = a; idx[k + 1] = c; idx[k + 2] = b; idx[k + 3] = b; idx[k + 4] = c; idx[k + 5] = d; k += 6;
        }
        return k;
      };
      const count = (arr, from, to) => { let n = 0; for (let i = from; i < to; i++) n += arr[i]; return n; };
      const BANDS = 4, per = Math.ceil(NZ / BANDS);
      for (let b = 0; b < BANDS; b++) {
        const j0 = b * per, j1 = Math.min(NZ, j0 + per), nv = count(need, j0 * W, (j1 + 1) * W), nc = count(keep, j0 * NX, j1 * NX);
        if (!nc) continue;
        const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), ag = new Float32Array(nv * 4), idx = new Uint32Array(nc * 6), map = new Int32Array((j1 - j0 + 1) * W);
        let n = 0, k = 0;
        for (let j = j0; j <= j1; j++) { n = vertRow(j, j0, map, pos, nor, ag, n); await rest(NX * 1.5); }
        for (let j = j0; j < j1; j++) { k = indexRow(j, j0, map, idx, k); if (j % 32 === 31) await ctx.yield(); }
        await ctx.yield();
        groundMesh(pos, nor, ag, idx);
        await rest(1500);
      }
      // THE FLOOR DOES NOT END IN A STEP BEHIND THE ENTRY. The lattice ends at BZ1, which the route's first metres lie
      // nearer than FLOOR_TO: there the floor stood cut at its full height, as much as 4 m over the far ground, a
      // step across the way of the camera that comes up the entry axis from behind. Beyond that edge the floor is
      // carried back BACK_FALL m, column by column from the lattice's last row, falling to the far ground's level as
      // it does at its other edges, with each place's own cover: one unbroken ground under that axis.
      {
        const BACK_FALL = 56, NK = Math.round(BACK_FALL / CELL), jE = NZ, col = new Int32Array(W).fill(-1), pos = [], nor = [], ag = [], idx = [];
        const edgeY = (i) => { const a = jE * W + i; return lerp(hgt[a], FAR_Y + 0.05, dLine[a] ? floorEnd(dLine[a]) : 0); };
        const has = (i) => i >= 0 && i <= NX && ((i < NX && keep[(NZ - 1) * NX + i]) || (i > 0 && keep[(NZ - 1) * NX + i - 1]));
        const yAt = (i, k) => lerp(edgeY(i), FAR_Y + 0.05, smoothstep(0, NK, k));
        let n = 0;
        for (let i = 0; i <= NX; i++) {
          if (i % 8 === 7) await ctx.yield();
          if (!has(i)) continue; col[i] = n;
          for (let k = 0; k <= NK; k++, n++) {
            const x = BX0 + i * CELL, z = BZ1 + k * CELL, il = has(i - 1) ? i - 1 : i, ir = has(i + 1) ? i + 1 : i, kl = Math.max(0, k - 1), kr = Math.min(NK, k + 1);
            const hx = (yAt(ir, k) - yAt(il, k)) / Math.max(1, ir - il), hz = (yAt(i, kr) - yAt(i, kl)) / Math.max(1, kr - kl), l = Math.hypot(hx, CELL, hz);
            pos.push(x, yAt(i, k), z); nor.push(-hx / l, CELL / l, -hz / l); coverAt(x, z, cov); ag.push(cov[0], cov[1], cov[2], cov[3]);
          }
        }
        for (let i = 0; i < NX; i++) {
          if (!keep[(NZ - 1) * NX + i]) continue;
          for (let k = 0; k < NK; k++) { const a = col[i] + k, b = col[i + 1] + k, c = a + 1, d = b + 1; idx.push(a, c, b, b, c, d); }
        }
        await ctx.yield();
        if (idx.length) groundMesh(pos, nor, ag, idx);
        await ctx.yield();
      }
      // the city: rings round the great tree, close together over wall and fosse, close in angle at the gate
      const rs = [0, 14, 28, 42, 58, 76, 96, 116, 136, 152, 162, 166, 169.5, 173, 175.5, 177, 178.5, 180.5, 182.5, 184.5, 186.5, 188.5, 190.5, 192.5, 194, 197.5, 201, 203, 205, 206.5, 210, 216, 226, 238, 250, OPEN, OPEN + 12, OPEN + 21, OPEN + 25];
      const gateA = Math.atan2(GATE_X - CX, WALL_R), as = [];
      for (let i = 0; i < 100; i++) { const a = i / 100 * TAU; if (Math.abs(((a - gateA + Math.PI * 3) % TAU) - Math.PI) > 0.13) as.push(a); }
      for (let i = -16; i <= 16; i++) as.push(gateA + i * 0.008);
      as.sort((p, q) => (((p % TAU) + TAU) % TAU) - (((q % TAU) + TAU) % TAU));
      const NA = as.length, NR = rs.length, pos = [], nor = [], ag = [], idx = [], H2 = new Float32Array(NA * NR);
      for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) { if (i === 0 && j % 4 === 3) await ctx.yield(); const x = CX + Math.sin(as[i]) * rs[j], z = CZ + Math.cos(as[i]) * rs[j]; H2[j * NA + i] = gy(x, z) + (j === NR - 1 ? -1.4 : rs[j] > OPEN + 4 ? 0.14 : 0); }
      for (let j = 0; j < NR; j++) for (let i = 0; i < NA; i++) {
        if (i === 0 && j % 2 === 1) await ctx.yield();
        const a = as[i], r = rs[j], x = CX + Math.sin(a) * r, z = CZ + Math.cos(a) * r, jp = Math.min(NR - 1, j + 1), jm = Math.max(0, j - 1);
        const dr = (H2[jp * NA + i] - H2[jm * NA + i]) / Math.max(rs[jp] - rs[jm], 1e-3), l = Math.hypot(dr, 1);
        pos.push(x, H2[j * NA + i], z); nor.push(-dr * Math.sin(a) / l, 1 / l, -dr * Math.cos(a) / l); coverAt(x, z, cov); ag.push(cov[0], cov[1], cov[2], cov[3]);
      }
      await ctx.yield();
      for (let j = 0; j < NR - 1; j++) for (let i = 0; i < NA; i++) { const i1 = (i + 1) % NA, a = j * NA + i, b = j * NA + i1, c = a + NA, d = b + NA; idx.push(a, c, b, b, c, d); }
      await ctx.yield();
      groundMesh(pos, nor, ag, idx);
      await rest(8000);
    }
    // the stream's bed: a strip along its course, finer than the lattice it sits in
    {
      // (Its outer bands, from TUCK out, lie 0.8 m under the ground: tucked under the floor's lattice beside it. The
      //  lattice leaves out every cell whose middle is within 16.5 m of the stream; such a cell reaches 3.5 m further
      //  and the stream's swing across its length 3.6 m more: 23.6 m. The strip goes out to 25 m, so that no gap is
      //  left between the two through which the far ground, 8 m below, would show.)
      const TUCK = 19, offs = [-25, -19, -16, -13.2, -11, -9.2, -7.6, -6.2, -4.8, -3.4, -1.7, 0, 1.7, 3.4, 4.8, 6.2, 7.6, 9.2, 11, 13.2, 16, 19, 25], NO = offs.length, zs = [];
      for (let z = stream.z0; z >= stream.z1 - 10; z -= 2) zs.push(z);
      for (const f of stream.falls) for (const d of [-0.9, -0.3, 0.3, 0.9]) zs.push(f.z + d);
      zs.sort((a, b) => b - a);
      const pos = [], nor = [], ag = [], idx = [], cov = [0, 0, 0, 0], hs = [];
      for (let j = 0; j < zs.length; j++) { for (let i = 0; i < NO; i++) { const z = zs[j], x = stream.xAt(z) + offs[i]; hs.push(gy(x, z)); } if (j % 8 === 7) await ctx.yield(); }
      for (let j = 0; j < zs.length; j++) for (let i = 0; i < NO; i++) {
        if (i === 0 && j % 8 === 7) await ctx.yield();
        const z = zs[j], x = stream.xAt(z) + offs[i], ip = Math.min(NO - 1, i + 1), im = Math.max(0, i - 1), jp = Math.min(zs.length - 1, j + 1), jm = Math.max(0, j - 1);
        const hx = (hs[j * NO + ip] - hs[j * NO + im]) / (offs[ip] - offs[im]), hz = (hs[jp * NO + i] - hs[jm * NO + i]) / Math.min(zs[jp] - zs[jm], -1e-3), l = Math.hypot(hx, 1, hz);
        const edge = Math.abs(offs[i]) >= TUCK || j === 0 || j === zs.length - 1, rim = Math.abs(offs[i]) === 16;
        pos.push(x, hs[j * NO + i] + (edge ? -0.8 : rim ? 0.01 : 0.05), z); nor.push(-hx / l, 1 / l, -hz / l); coverAt(x, z, cov); ag.push(cov[0], cov[1], cov[2], cov[3]);
      }
      for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < NO - 1; i++) { const a = j * NO + i, c = a + NO; idx.push(a, a + 1, c, a + 1, c + 1, c); }
      groundMesh(pos, nor, ag, idx);
    }
    // far ground under the far canopy (a metre under the stream's lowest bed, so that it never lies over its water)
    {
      const g = new THREE.RingGeometry(120, 2600, 40, 3).rotateX(-Math.PI / 2), n = g.attributes.position.count, ag = new Float32Array(n * 4);
      g.setAttribute('aG', new THREE.BufferAttribute(ag, 4));
      const m = new THREE.Mesh(g, groundMat); m.position.set(CX, FAR_Y, CZ + 200); scene.add(m);
    }
    await rest(8000);

    // ------------------------------------------------------------ the stream: water, stones at the falls, a little spray
    const sr = FK.stones, stoneB = mk(false), stone = [0.36, 0.35, 0.33];
    // the stream's water: a sheet along its course at the water's own level (DEPTH over the bed), a row every
    // STREAM_ROW m and four across each fall's lip, seven points across, reaching 0.3 m into each bank
    // (refLoU, refHiU: the sky's low and high colours as water gives them back; the great river shares them)
    const refLoU = { value: new THREE.Color() }, refHiU = { value: new THREE.Color() };
    {
      const STREAM_ROW = 1.6, DEPTH = 0.5, ts = [-1, -0.8, -0.45, 0, 0.45, 0.8, 1], NT = ts.length, zs = [];
      for (let z = stream.z0; z >= stream.z1 - 4; z -= STREAM_ROW) zs.push(z);
      for (const f of stream.falls) for (const d of [-0.9, -0.3, 0.3, 0.9]) zs.push(f.z + d);
      zs.sort((a, b) => b - a);
      const n = zs.length * NT, pos = new Float32Array(n * 3), aT = new Float32Array(n), aF = new Float32Array(n * 2), idx = [];
      for (let j = 0; j < zs.length; j++) {
        const z = zs[j], x0 = stream.xAt(z), hw = stream.halfAt(z) + 0.3, dx = stream.xAt(z + 0.5) - stream.xAt(z - 0.5), dl = Math.hypot(dx, 1), y = stream.bedAt(z) + DEPTH;
        for (let i = 0; i < NT; i++) { const k = j * NT + i; pos[k * 3] = x0 + ts[i] * hw; pos[k * 3 + 1] = y - (Math.abs(ts[i]) === 1 ? 0.2 : 0); pos[k * 3 + 2] = z; aT[k] = ts[i]; aF[k * 2] = dx / dl; aF[k * 2 + 1] = 1 / dl; }
        if (j % 40 === 39) await ctx.yield();
      }
      await ctx.yield();
      for (let j = 0; j < zs.length - 1; j++) for (let i = 0; i < NT - 1; i++) { const a = j * NT + i, c = a + NT; idx.push(a, a + 1, c, a + 1, c + 1, c); }
      await ctx.yield();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.BufferAttribute(aT, 1)); g.setAttribute('aF', new THREE.BufferAttribute(aF, 2)); g.setIndex(idx); g.computeBoundingSphere();
      scene.add(new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...K.U, uRefLo: refLoU, uRefHi: refHiU, uFallZ: groundMat.uniforms.uFallZ }, vertexShader: STREAM_VERT, fragmentShader: STREAM_FRAG, transparent: true, depthWrite: false })));
    }
    const fallMist = [];
    stoneB.solid.kind = 6;
    // (a stone lies clear of the route's line by its own reach and the lane: its furthest point is at most
    // STONE_REACH of its radius from its middle, 1.3 by its squash times 1.34 by its lumps)
    const STONE_REACH = 1.75, layStone = (x, y, z, r, col) => rockInto(stoneB.solid, sr, x, y, z, r, col, pathClear(x, y, z, r * STONE_REACH + LANE - 6));
    for (const f of stream.falls) {
      await ctx.yield();
      const x0 = stream.xAt(f.z), top = stream.bedAt(f.z - 1);
      // the ledge: flat stones set under the lip, their tops at or just under the water, staggered up and down the
      // stream, so the water breaks over them; two taller stones stand at the banks' ends of it, none across it
      for (let k = 0; k < 7; k++) { const o = (k - 3) * 1.35 + sr.range(-0.3, 0.3); layStone(x0 + o, top - 0.75 + sr.range(-0.12, 0.1), f.z - 0.2 + sr.range(-1.1, 0.9), sr.range(1.0, 1.5), stone); }
      for (const sd of [-1, 1]) layStone(x0 + sd * (stream.HALF + sr.range(0.2, 1.0)), top + sr.range(0, 0.4), f.z - 0.4 + sr.range(-0.8, 0.8), sr.range(1.0, 1.5), stone);
      // stones in the pool under the fall
      for (let k = 0; k < 5; k++) layStone(x0 + sr.range(-3.8, 3.8), stream.bedAt(f.z + 2) - 0.1, f.z + sr.range(1.8, 5.5), sr.range(0.4, 0.9), mul3(stone, 1.25));
      fallMist.push([x0, stream.bedAt(f.z + 1.5) + 1.0, f.z + 1.6]);
    }
    await ctx.yield();
    for (let z = stream.z0 - 6; z > stream.z1 + 6; z -= sr.range(4, 9)) { const sd = sr.chance(0.5) ? 1 : -1, x = stream.xAt(z) + sd * (stream.HALF + sr.range(-0.6, 1.8)); layStone(x, gy(x, z) + 0.1, z, sr.range(0.45, 1.2), mul3(stone, sr.range(0.8, 1.1))); }
    for (let k = 0; k < 9; k++) { const a = k / 9 * TAU, rr = sr.range(2.5, 5.5), x = stream.xAt(stream.z1) + Math.sin(a) * rr, z = stream.z1 - 3 + Math.cos(a) * rr * 0.8; layStone(x, gy(x, z) + 0.2, z, sr.range(1.0, 2.0), mul3(stone, sr.range(0.8, 1.1))); }
    await ctx.yield();
    // THE WAY UP THE MOUND IS A WAY OF THE PLACE, LAID BY THE PLAN: the folk's way leaves the stream at its last fall
    // and goes straight to the mound's west side, to pass between its two rings of trees: its straight runs from
    // the last fall's place to where it touches the circle half way between the rings (RING_BETWEEN from the
    // middle tree). Flat pale stones are laid in the turf along it from the clearing's edge (CLEARING from the
    // middle tree) to the mound's foot and up its slope to its brow (MOUND_TOP_R, where the flat top begins).
    // Nothing of it asks where the route's line is: the route's own rule (3, the mound) lays the line's straight
    // between the same two places of the plan, so the flight goes up over the way, and where the line rounds
    // its corner at the fall or swings wide the stones stay where the way is. IT IS A WAY THAT IS WALKED, NOT A
    // RULED STRIP: its middle line WINDS about its straight in a slow swing of its own (WAY_SWING metres to either
    // hand over WAY_WAVE metres, and a third of that over a shorter wave), dealt by the way's own stream (FK.way),
    // and comes home onto the straight over the last WAY_HOME metres before the brow. THE STONES ARE OF
    // MANY MAKES: each a six-cornered flag of its own length, breadth, turn, tone and corners, set a hand's breadth
    // to one side or the other, WAY_GAP of turf to the next. EACH LIES IN THE TURF: its corners WAY_LIE over the
    // ground as the slope lies there (and no lower than the ground under its middle), and the mound's blades grow
    // between the flags and up to their edges (onWay: a place on a flag; only there is no blade and no flower).
    // None in the stream's water, none under a trunk's foot, none in the lane. (wayGap: how far a place lies from
    // the way's middle line; the mound's stones keep off it. WAY_W: the broadest flag.)
    const WAY_W = 2.3, WAY_SWING = [1.0, 1.8], WAY_WAVE = [36, 60], WAY_HOME = 14, WAY_GAP = [0.25, 0.8], WAY_LIE = 0.08, WAY_PT = 0.5, way = [], flags = [];
    {
      // (F: the last fall's place; T: where the straight from it touches the circle between the rings, on the mound's
      //  west side; [ux, uz]: the way's heading; back(r): how far before T the straight crosses the circle of
      //  radius r about the middle tree; the stones begin `from` before T, at the clearing's edge or at the fall
      //  if that lies nearer, and go on for `len`, to the brow)
      const wy = FK.way, F = [stream.xAt(fN.z), fN.z], dF = Math.hypot(F[0] - MX, F[1] - MZ), bT = Math.atan2(F[0] - MX, F[1] - MZ) - Math.acos(RING_BETWEEN / dF), T = [MX + Math.sin(bT) * RING_BETWEEN, MZ + Math.cos(bT) * RING_BETWEEN];
      const run = Math.hypot(T[0] - F[0], T[1] - F[1]), ux = (T[0] - F[0]) / run, uz = (T[1] - F[1]) / run, back = (r) => Math.sqrt(r * r - RING_BETWEEN * RING_BETWEEN), from = Math.min(back(CLEARING), run), len = from - back(MOUND_TOP_R);
      const A = wy.range(WAY_SWING[0], WAY_SWING[1]) * (wy.chance(0.5) ? 1 : -1), wave = wy.range(WAY_WAVE[0], WAY_WAVE[1]), ph = wy.range(0, TAU), ph2 = wy.range(0, TAU);
      for (let d = 0; d <= len; d += WAY_PT) {
        if (way.length % 32 === 31) await ctx.yield();
        const o = A * smoothstep(len, len - WAY_HOME, d) * (Math.sin(d / wave * TAU + ph) + Math.sin(d / (wave * 0.37) * TAU + ph2) / 3), s = from - d;
        way.push([T[0] - ux * s - uz * o, T[1] - uz * s + ux * o]);
      }
    }
    const wayGap = (x, z) => { let b = Infinity; for (let i = 1; i < way.length; i++) b = Math.min(b, segD(x, z, way[i - 1][0], way[i - 1][1], way[i][0], way[i][1])); return b; };
    const onWay = (x, z) => { for (const f of flags) { const dx = x - f[0], dz = z - f[1], a = dx * f[2] + dz * f[3], b = dz * f[2] - dx * f[3]; if (Math.abs(a) < f[4] && Math.abs(b) < f[5]) return true; } return false; };
    {
      const sb = stoneB.solid, slab = [0.62, 0.60, 0.55], wy = FK.way, FLAG = [[-1, -0.55], [-0.45, -1], [0.6, -1], [1, -0.5], [0.5, 1], [-0.6, 1]];
      // (the way's own length along its winding middle, and a place on it)
      const run = [0]; for (let i = 1; i < way.length; i++) run.push(run[i - 1] + Math.hypot(way[i][0] - way[i - 1][0], way[i][1] - way[i - 1][1]));
      const at = (t) => { let i = 1; while (i < way.length - 1 && run[i] < t) i++; const f = clamp((t - run[i - 1]) / Math.max(run[i] - run[i - 1], 1e-6), 0, 1), dx = way[i][0] - way[i - 1][0], dz = way[i][1] - way[i - 1][1], dl = Math.hypot(dx, dz) || 1; return [lerp(way[i - 1][0], way[i][0], f), lerp(way[i - 1][1], way[i][1], f), dx / dl, dz / dl]; };
      for (let t = wy.range(0, 1), end = run[run.length - 1]; t < end - 1;) {
        if (flags.length % 6 === 5) await ctx.yield();
        const l = wy.range(0.45, 0.85), w = WAY_W / 2 * wy.range(0.6, 1), side = wy.range(-0.25, 0.25), turn = wy.range(-0.3, 0.3), c = mul3(slab, wy.range(0.74, 1.06)), gap = wy.range(WAY_GAP[0], WAY_GAP[1]);
        const cor = FLAG.map(([a, b]) => { const k = wy.range(0.86, 1.08); return [a * l * k, b * w * k]; });
        const [mx, mz, tx0, tz0] = at(t + l); t += 2 * l + gap;
        const ux = tx0 * Math.cos(turn) - tz0 * Math.sin(turn), uz = tz0 * Math.cos(turn) + tx0 * Math.sin(turn), x = mx - tz0 * side, z = mz + tx0 * side, reach = Math.max(l, w) * 1.08;
        if ((inStream(z) && stream.dist(x, z) < stream.halfAt(z) + reach + 0.5) || inTrunk(x, z, reach) || !pathClear(x, gy(x, z) + 0.2, z, reach + LANE - 6)) continue;
        const q = cor.map(([a, b]) => { const px = x + ux * a - uz * b, pz = z + uz * a + ux * b; return [px, gy(px, pz), pz]; });
        const lift = WAY_LIE + Math.max(0, gy(x, z) - q.reduce((m, p) => m + p[1], 0) / q.length); for (const p of q) p[1] += lift;
        sb.kind = 6; sb.face(q[0], q[1], q[2], q[3], c); sb.face(q[0], q[3], q[4], q[5], c);
        for (let k = 0; k < 6; k++) { const a = q[k], b = q[(k + 1) % 6]; sb.face([a[0], a[1] - 0.3, a[2]], [b[0], b[1] - 0.3, b[2]], b, a, mul3(c, 0.7)); }
        flags.push([x, z, ux, uz, l * 1.08 + 0.1, w * 1.08 + 0.1]);
      }
      await ctx.yield();
      // STONES ON THE MOUND: a few grey stones lie scattered on its slopes, from well under its brow to its foot and
      // a little beyond, most of them small. NONE LIES ON THE BROW AND NONE IN A ROUND: the book puts no stones on
      // this mound, and a green mound with a round of grey stones on its brow is another place's picture. The
      // mound's outline against the sky is its grass, its trees' roots and the white ring of trees. (Each off
      // the way, off every trunk's foot and off the line by its own reach and the lane.)
      const moundStone = (rr, a, r) => { const x = MX + Math.sin(a) * rr, z = MZ + Math.cos(a) * rr, y = gy(x, z); rockInto(sb, sr, x, y + r * 0.12, z, r, mul3(stone, sr.range(0.85, 1.2)), !inTrunk(x, z, r * STONE_REACH) && wayGap(x, z) > WAY_W / 2 + r * STONE_REACH && pathClear(x, y, z, r * STONE_REACH + LANE - 6)); };
      for (let k = 0; k < 16; k++) moundStone(lerp(MOUND_TOP_R + 9, MOUND_FOOT_R + 12, Math.pow(sr(), 0.8)), sr.range(0, TAU), sr.chance(0.12) ? sr.range(1.2, 1.8) : sr.range(0.4, 1.0));
    }
    await ctx.yield();

    // ------------------------------------------------------------ the white bridge, the gates and their lamps, lamps along the wall
    // (FOSSE_WATER: the water stands 1.6 m deep in the fosse. WALL_LAMPS: 21 posts either side of the gate.)
    const gateB = mk(true), gr = FK.gate, gateZ = CZ + WALL_R, white = P.white, gField = K.makeLampField(), WALL_LAMPS = 21;
    {
      // (the gate's lamps and the wall's burn as every lamp does, for the whole visit)
      const sb = gateB.solid, L = gateB.lamps, lampsAt = [];
      // (each lamp's colour is dealt here, by the visit's weights, so that its image in the fosse's water has the same)
      const lamp = (x, y, z, cord, size) => { const t = gr() * (mix[0] + mix[1] + mix[2]), c = t < mix[0] ? 0 : t < mix[0] + mix[1] ? 1 : 2; lampsAt.push([x, y, z, cord, size, [0, 1, 2].map((k) => (k === c ? 1 : 0))]); };
      // lamps first
      const zb0 = CZ + 208.5, zb1 = CZ + 187, bridgeY = (t) => lerp(2.5, 4.3, t) + 1.25 * Math.sin(Math.PI * t), hw = 3.7;
      for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) { const t = (i + 0.5) / 5; lamp(GATE_X + sd * (hw + 0.1), bridgeY(t) + 3.3, lerp(zb0, zb1, t), 0.55, 0.75); }
      // (THE GATE'S OWN MEASURES. A post's fourteen lamps hang from short arms of its own, seven before it and seven
      //  behind, POST_ARM from its axis. A LEAF is LEAF_W wide from its hinge, which is on its post's side toward
      //  the city, and stands from LEAF_Y0 to its top rail, which rises to its free edge (leafTop); it lies along
      //  the cheek of the way through, turned from the road's direction by the flare (leafDir: that turn's sine and
      //  cosine). leafAt(side, s, y, off): the place on a leaf at the share s of its width and the height y, `off`
      //  metres before its face on the road's side. A leaf's five lamps hang from its top rail, on that side.)
      const POST_ARM = 1.3, postArms = [], LEAF_W = 9.4, LEAF_Y0 = 4.8, leafTop = (s) => 14.4 + 3.8 * s * Math.sqrt(s), leafDir = [GATE_FLARE / Math.hypot(1, GATE_FLARE), 1 / Math.hypot(1, GATE_FLARE)];
      const leafAt = (sd, s, y, off = 0) => [GATE_X + sd * (GATE_AXIS + leafDir[0] * s * LEAF_W - leafDir[1] * off), y, gateZ - GATE_SHAFT - 0.25 - leafDir[1] * s * LEAF_W - leafDir[0] * off];
      for (const sd of [-1, 1]) {
        for (let i = 0; i < 7; i++) for (const fz of [-1, 1]) { const q = [GATE_X + sd * GATE_AXIS + 0.5 * gr.range(-0.9, 0.9), 6 + i * 2.6, gateZ + fz * POST_ARM, sd]; postArms.push(q); lamp(q[0], q[1], q[2], gr.range(0.5, 1.1), gr.range(0.85, 1.2)); }
        for (let i = 0; i < 5; i++) { const s = (i + 0.5) / 5, q = leafAt(sd, s, leafTop(s) - 0.12, 0.35); lamp(q[0], q[1], q[2], gr.range(0.6, 1.3), 0.7); }
      }
      const garland = (t) => [GATE_X + (t * 2 - 1) * GATE_AXIS, 24.6 - 3.4 * 4 * t * (1 - t), gateZ];
      for (let i = 1; i < 12; i++) { const q = garland(i / 12); lamp(q[0], q[1], q[2], gr.range(0.8, 2.3), gr.range(1.0, 1.3)); }
      // (a lamp on a white post every 13 m along the wall's top, round the half of the wall that faces the road.
      //  THE POSTS STAND IN THE HEDGE'S TOP AND THEIR LAMPS HANG AMONG ITS LEAVES, meant so: the hedge is grown
      //  over the wall's crest, posts and all, and is not parted for them; a lamp of the wall is seen through the
      //  leaf it lights, as a lamp in a tree's crown is)
      for (let i = -WALL_LAMPS; i <= WALL_LAMPS; i++) { if (Math.abs(i) < 2) continue; const a = Math.atan2(GATE_X - CX, WALL_R) + i * 0.075, x = CX + Math.sin(a) * WALL_R, z = CZ + Math.cos(a) * WALL_R; lamp(x, gy(x, z) + 3.4, z, 0.6, 0.9); }
      for (const q of lampsAt) K.hangLamp(L, gField, gr, q[0], q[1], q[2], q[3], q[4], q[5]);
      // THE LAMPS IN THE FOSSE'S WATER: each lamp's image, as far under the water's face as the lamp hangs over it. It
      // lies under the ground everywhere but under the water, which is seen through (see the fosse's water below).
      for (const q of lampsAt) K.hangLamp(L, null, gr, q[0], 2 * FOSSE_WATER - (q[1] - q[3]) + 0.02, q[2], 0.02, q[4], q[5]);
      // THE GATE'S STONE AND ITS LEAVES UNDER THEIR OWN LAMPS: fourteen lamps hang within half a metre of each post
      // and the garland between them; their light on the stone, the leaves' work and the bridge is HELD under GATE_MOST,
      // a middling brightness (as it falls where it is weak, more and more slowly toward that), as on the hall's
      // walls: a post is pale stone with a lit side and a shaded one and the lamps are the bright things (stone
      // and open leaves a hand's breadth from fourteen lamps would else take their whole light and stand as white
      // as the lamps themselves).
      const GATE_MOST = 0.5, held = (f) => ({ sample(x, y, z, nx, ny, nz, out) { f.sample(x, y, z, nx, ny, nz, out); const m = Math.max(out[0], out[1], out[2]); if (m > 0) { const k = GATE_MOST * (1 - Math.exp(-m / GATE_MOST)) / m; out[0] *= k; out[1] *= k; out[2] *= k; } return out; } });
      sb.field = held(gField);
      // bridge
      const NB = 10;
      for (let i = 0; i < NB; i++) {
        const t0 = i / NB, t1 = (i + 1) / NB, z0 = lerp(zb0, zb1, t0), z1 = lerp(zb0, zb1, t1), y0 = bridgeY(t0), y1 = bridgeY(t1), xl = GATE_X - hw, xr = GATE_X + hw;
        sb.kind = 6; sb.face([xl, y0, z0], [xr, y0, z0], [xr, y1, z1], [xl, y1, z1], white);
        sb.face([xr, y0 - 0.9, z0], [xl, y0 - 0.9, z0], [xl, y1 - 0.9, z1], [xr, y1 - 0.9, z1], mul3(white, 0.6));
        for (const sd of [-1, 1]) {
          const x = GATE_X + sd * hw, xi = x - sd * 0.35;
          sb.face([x, y0 - 0.9, z0], [x, y1 - 0.9, z1], [x, y1 + 1.0, z1], [x, y0 + 1.0, z0], mul3(white, 0.92));
          sb.face([xi, y0, z1 - (z1 - z0)], [xi, y0 + 1.0, z0], [xi, y1 + 1.0, z1], [xi, y1, z1], mul3(white, 0.85));
          sb.face([x, y0 + 1.0, z0], [x, y1 + 1.0, z1], [xi, y1 + 1.0, z1], [xi, y0 + 1.0, z0], white);
        }
      }
      sb.kind = 2;
      for (let i = 0; i < 5; i++) for (const sd of [-1, 1]) { const t = (i + 0.5) / 5, x = GATE_X + sd * (hw - 0.15), z = lerp(zb0, zb1, t), y = bridgeY(t); sb.beam([x, y + 0.9, z], [x + sd * 0.25, y + 3.35, z], 0.1, white); }
      sb.kind = 6;
      for (const t of [0.3, 0.7]) for (const sd of [-1, 1]) { const z = lerp(zb0, zb1, t); sb.tube([[GATE_X + sd * 2.4, -7, z], [GATE_X + sd * 2.4, bridgeY(t) - 0.6, z]], [0.75, 0.6], 8, mul3(white, 0.8), false); }
      // THE GATE'S TWO POSTS ARE SLENDER AND CARVED: a round shaft GATE_SHAFT in radius that narrows upward, fluted
      // (every other of its eight sides a shade darker), on a moulded foot, ringed at three heights, under a spreading
      // head and a bud for a finial; the garland is tied at the bud's neck, and a short arm goes out to each of its
      // lamps. (POST_K: a post is pale stone and not the platforms' white: fourteen lamps hang close by each.)
      // ITS LEAVES ARE OPEN WORK THAT IS SEEN THROUGH, and no sheet: a frame of two stiles and two rails of silver
      // wood, three stems standing in it, and the boughs of each sweeping up to its neighbours' and to the stiles,
      // a leaf of dull gold at the middle and the end of every bough. GATE_WORK: the silver of that work, of the
      // bark's colour and dark, so that it reads against the lit lawn behind it.
      const POST_K = 0.54, GATE_WORK = mul3(P.bark, 0.5), GATE_LEAF = mul3(P.leafDeep, 0.75);
      for (const sd of [-1, 1]) {
        const x = GATE_X + sd * GATE_AXIS, rs = GATE_SHAFT, ys = [], rr = [], kk = [], ring = (y, r, k = 0) => { ys.push(y); rr.push(r); kk.push(k); }, taper = (y) => rs * lerp(1, 0.8, clamp((y - 5.8) / 17, 0, 1));
        ring(2.4, rs + GATE_FOOT); ring(5.0, rs + GATE_FOOT, 1); ring(5.4, rs + 0.32, 1); ring(5.8, rs + 0.06);
        for (const yb of [10, 14.2, 18.4]) { ring(yb - 0.32, taper(yb)); ring(yb, taper(yb) + 0.15, 1); ring(yb + 0.32, taper(yb)); }
        ring(22.8, taper(22.8)); ring(23.7, 0.95, 1); ring(23.95, 0.95, 1); ring(24.1, 0.4); ring(24.6, 0.34); ring(25.0, 0.6, 1); ring(25.5, 0.5); ring(26.3, 0.06);
        sb.kind = 6; sb.tube(ys.map((y) => [x, y, gateZ]), rr, 8, (i, j) => mul3(white, (kk[i] ? POST_K + 0.14 : POST_K) * (j % 2 ? 0.82 : 1)));
        sb.kind = 2; for (const q of postArms) if (q[3] === sd) sb.tube([[x, q[1] + 0.3, gateZ], [q[0], q[1] + 0.03, q[2]]], [0.07, 0.05], 3, GATE_WORK, false);
        // (the leaf: pt(s, y) is a place in it; pm(m, y) the same by metres from the hinge)
        const pt = (s, y) => leafAt(sd, s, y), pm = (m, y) => leafAt(sd, m / LEAF_W, y);
        sb.kind = 0;
        sb.tube([pt(0, LEAF_Y0 - 0.6), pt(0, leafTop(0) + 0.7)], [0.17, 0.14], 5, GATE_WORK);
        sb.tube([pt(1, LEAF_Y0 - 0.6), pt(1, leafTop(1) + 1.0)], [0.14, 0.09], 4, GATE_WORK);
        sb.tube([pt(0, LEAF_Y0), pt(1, LEAF_Y0)], [0.13, 0.13], 4, GATE_WORK, false);
        const rail = []; for (let i = 0; i <= 6; i++) rail.push(pt(i / 6, leafTop(i / 6)));
        sb.tube(rail, rail.map(() => 0.13), 4, GATE_WORK, false);
        for (let t = 0; t < 3; t++) {
          const s0 = (t * 2 + 1) / 6, h = leafTop(s0) - LEAF_Y0;
          sb.kind = 0; sb.tube([pt(s0, LEAF_Y0), pt(s0, LEAF_Y0 + h * 0.5), pt(s0, LEAF_Y0 + h)], [0.13, 0.1, 0.07], 4, GATE_WORK, false);
          for (let b = 0; b < 4; b++) for (const e of [-1, 1]) {
            const yb = LEAF_Y0 + h * (0.14 + 0.2 * b), s1 = s0 + e / 6, y1 = Math.min(yb + h * 0.2, leafTop(s1) - 0.2), m0 = s0 * LEAF_W, m1 = s1 * LEAF_W, mm = m0 + e * 0.1 * LEAF_W, ym = yb + h * 0.05;
            sb.kind = 0; sb.tube([pm(m0, yb), pm(mm, ym), pm(m1, y1)], [0.085, 0.07, 0.05], 3, GATE_WORK, false);
            // (its two leaves: a pointed leaf lying along the bough, at its middle and beyond its end)
            const tl = Math.hypot(m1 - mm, y1 - ym), tx = (m1 - mm) / tl, ty = (y1 - ym) / tl;
            sb.kind = 2;
            for (const f of [0.45, 1.06]) { const cm = lerp(mm, m1, f) - ty * 0.2 * e * (f < 1 ? 1 : 0), cy = lerp(ym, y1, f) + tx * 0.2 * e * (f < 1 ? 1 : 0); sb.face(pm(cm - tx * 0.34, cy - ty * 0.34), pm(cm + ty * 0.17, cy - tx * 0.17), pm(cm + tx * 0.34, cy + ty * 0.34), pm(cm - ty * 0.17, cy + tx * 0.17), GATE_LEAF); }
          }
        }
      }
      const gp = []; for (let i = 0; i <= 12; i++) gp.push(garland(i / 12));
      sb.kind = 2; sb.tube(gp, gp.map(() => 0.06), 4, mul3(white, 0.9), false);
      for (let i = -WALL_LAMPS; i <= WALL_LAMPS; i++) { if (Math.abs(i) < 2) continue; const a = Math.atan2(GATE_X - CX, WALL_R) + i * 0.075, x = CX + Math.sin(a) * WALL_R, z = CZ + Math.cos(a) * WALL_R, y = gy(x, z); sb.beam([x - 0.4, y - 0.2, z], [x - 0.3, y + 3.5, z], 0.11, white); sb.beam([x - 0.3, y + 3.5, z], [x + 0.1, y + 3.45, z], 0.07, white); }
      sb.field = null;
      // THE WALL IS A LIVING WALL: a bank grown over with a dense green hedge. Leaf lies on its outer face from the
      // crest down (five rows, HEDGE_ROW apart down the slope and each mass up to HEDGE_OFF off its row, so that no
      // row reads as a stripe with the bare bank between; a mass every HEDGE_STEP along each) and stands up
      // along its crest in a BROKEN TOP: a row of masses whose height over the crest rises and falls along the
      // wall by the place (0 to HEDGE_TOP), a taller one here and there. Round the half of the wall that faces the
      // road, as its lamps are; none within HEDGE_GATE of the gate's middle (the gate's posts and leaves stand
      // free), none in the lane. Lit by the wall's own lamps and the hour's open light; behind it stand the
      // crowns of the city's outer ring.
      const HEDGE_STEP = 2.6, HEDGE_ROW = 2.1, HEDGE_OFF = 0.9, HEDGE_TOP = 2.6, HEDGE_GATE = GATE_HALF + GATE_CHEEK + 4, hr = FK.hedge, lb = gateB.leaves, gateA = Math.atan2(GATE_X - CX, WALL_R);
      lb.field = gField; lb.glow = 1;
      const hedgeCol = (k) => { const c = mul3(P.leafGreen, k * hr.range(0.55, 0.85)); c[0] *= hr.range(0.6, 0.9); return c; };
      for (let row = 0; row < 6; row++) {
        const r0 = WALL_R + (row === 0 ? 0 : row * HEDGE_ROW - 0.4), n = Math.floor(WALL_LAMPS * 0.075 * 2 * r0 / HEDGE_STEP);
        for (let i = 0; i <= n; i++) {
          const r = r0 + (row === 0 ? 0 : hr.range(-HEDGE_OFF, HEDGE_OFF));
          const a = gateA + (i / n * 2 - 1) * WALL_LAMPS * 0.075 + hr.range(-0.3, 0.3) * HEDGE_STEP / r, x = CX + Math.sin(a) * r, z = CZ + Math.cos(a) * r, ox = Math.sin(a), oz = Math.cos(a);
          const top = row === 0 ? HEDGE_TOP * smoothstep(-0.5, 0.6, noise.n2(a * 41.3, 7.7)) + (hr.chance(0.12) ? hr.range(0.8, 1.8) : 0) : 0, sz = hr.range(4.2, 6.4), y = gy(x, z) + (row === 0 ? 0.4 + top : 1.1);
          // (the crest's masses stand upright along the wall, a second card across each; the face's lie on the slope, leaning out)
          const up = row === 0 ? 0.35 : 0.8, out = 0.9, nl = Math.hypot(out, up), spin = hr() * TAU, ph = hr(), col = hedgeCol(row === 0 ? 1 : 0.85), col2 = hedgeCol(0.7), sp2 = hr() * TAU, ph2 = hr();
          if (Math.abs(a - gateA) * r < HEDGE_GATE || blockedLeaf(x, y, z, sz * 0.5)) continue;
          lb.add(x, y, z, ox * out / nl, up / nl, oz * out / nl, spin, sz, 4, 0.3, ph, col, ox * 0.5, 0.86, oz * 0.5, row === 0 ? 0.9 : 0.75);
          if (row === 0) lb.add(x + oz * 0.8, y - 0.5, z - ox * 0.8, -oz * 0.9, 0.42, ox * 0.9, sp2, sz * 0.85, 4, 0.3, ph2, col2, ox * 0.4, 0.9, oz * 0.4, 0.7);
        }
        await ctx.yield();
      }
      lb.field = null;
    }
    await rest(600); await ctx.yield();

    // ------------------------------------------------------------ the fountain on its lawn: a basin of silver, a jet, a white stream spilling away
    // (JET: the spout's mouth, POOL: the water's level, both in metres over the lawn)
    const fr = FK.fountain, fountB = mk(false), FY = FOUNT[1], JET = 1.3, POOL = 0.86;
    {
      // (silver: a darker body under the sky's reflection and the sun's glint, kind 7)
      const sb = fountB.solid, silver = [0.50, 0.53, 0.60];
      const lathe = (prof, sides, col) => {
        const rows = [];
        for (let i = 0; i < prof.length; i++) {
          const a = prof[Math.max(0, i - 1)], b = prof[Math.min(prof.length - 1, i + 1)]; let tr = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tr, ty) || 1; tr /= tl; ty /= tl;
          const row = []; for (let j = 0; j < sides; j++) { const th = j / sides * TAU, s = Math.sin(th), c = Math.cos(th); row.push(sb.v(FOUNT[0] + s * prof[i][0], FY + prof[i][1], FOUNT[2] + c * prof[i][0], s * ty, -tr, c * ty, col)); }
          rows.push(row);
        }
        for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < sides; j++) { const j1 = (j + 1) % sides; sb.quad(rows[i][j], rows[i][j1], rows[i + 1][j1], rows[i + 1][j]); }
      };
      // one basin; the jet rises from a low spout in its middle
      sb.kind = 7;
      lathe([[BASIN_R, -0.6], [4.75, 0.55], [4.6, 0.95], [4.3, 1.0], [4.15, 0.7], [3.2, 0.3], [0.9, 0.2], [0.42, 0.6], [0.2, 1.0], [0.12, JET], [0.02, JET + 0.05]], 24, silver);
    }
    const fountU = { ...K.U, uColor: { value: new THREE.Vector3(0.8, 0.85, 1) } };
    const fountain = new THREE.Group(); fountain.position.set(FOUNT[0], FY, FOUNT[2]); scene.add(fountain);
    {
      const n = Math.round(300 * Math.max(0.7, detail)), iA = new Float32Array(n * 4), iB = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        // one drop in three is the low crown thrown out round the spout; the rest is the jet. Every drop leaves the
        // spout and lives until it meets the water.
        const low = i % 3 === 0, up = low ? fr.range(0.3, 1.2) : fr.range(6.5, 10.4), rad = low ? fr.range(1.5, 2.3) : fr.range(0.15, 1.5) * (11 - up) / 4;
        iA.set([fr.range(0, TAU), rad, up, fr()], i * 4); iB.set([JET, fr.range(0.07, 0.13), (up + Math.sqrt(up * up + 2 * 9.8 * (JET - POOL))) / 9.8, 0], i * 4);
      }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iA', new THREE.InstancedBufferAttribute(iA, 4)); g.setAttribute('iB', new THREE.InstancedBufferAttribute(iB, 4)); g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 4, 0), 9);
      const spray = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: fountU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        // (a drop keeps its own size in metres at every distance. From further off than it can be seen at that size it
        // is drawn as a soft dot of the least width that shows, and as much fainter as that dot is larger than the
        // drop: the fountain's spray is a mist from the gate and drops from the lawn. It is gone between 90 and 220 m
        // from the eye. The square it is drawn on is wider than the drop by 2 cm for each metre of distance.)
        vertexShader: /* glsl */`uniform float uTime; attribute vec4 iA, iB; varying vec2 vQ; varying float vA, vS;
void main(){ float T = iB.z, t = fract(uTime / T + iA.w) * T; vec3 o = (modelMatrix * vec4(0., iB.x, 0., 1.)).xyz;
  vec3 p = o + vec3(cos(iA.x) * iA.y * t, iA.z * t - 4.9 * t * t, sin(iA.x) * iA.y * t); vec4 mv = viewMatrix * vec4(p, 1.);
  float d = max(length(mv.xyz), 0.1), quad = iB.y * 2. + d * 0.02; mv.xy += position.xy * quad * vec2(1., 1.7);
  vQ = position.xy * quad; vS = iB.y * 0.3;
  vA = smoothstep(0., 0.06, t / T) * (1. - smoothstep(0.9, 1., t / T)) * (1. - smoothstep(90., 220., d)); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`uniform vec3 uColor; varying vec2 vQ; varying float vA, vS;
void main(){ float w = max(fwidth(vQ.x), fwidth(vQ.y)), s0 = vS * vS, s1 = max(s0 + 0.25 * w * w, 1e-7);
  gl_FragColor = vec4(uColor * exp(-clamp(dot(vQ, vQ) / (2. * s1), 0., 40.)) * (s0 / s1) * vA * 1.7, 1.); }` }));
      spray.renderOrder = 3; fountain.add(spray);
      const pool = new THREE.Mesh(new THREE.CircleGeometry(4.2, 28).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ uniforms: fountU,
        vertexShader: /* glsl */`${GL_PLACE}
varying vec3 vW; varying vec2 vP; void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gwPlaces(vW); vP = position.xz; gl_Position = projectionMatrix * viewMatrix * wp; }`,
        fragmentShader: /* glsl */`uniform float uTime; uniform vec3 uColor; varying vec3 vW; varying vec2 vP;
${GL_LIGHT}
void main(){ gwLight(); float r = length(vP); float w = sin(r * 7. - uTime * 3.2) * 0.5 + sin(vP.x * 5.3 + uTime * 1.7) * sin(vP.y * 4.7 - uTime * 1.3) * 0.5;
  vec3 V = normalize(cameraPosition - vW); float fres = 1. - clamp(V.y, 0., 1.); fres *= fres;
  vec3 col = mix(vec3(0.03, 0.07, 0.09), uSkyCol * 1.6, 0.25 + 0.6 * fres) + uColor * (0.10 + 0.22 * smoothstep(0.55, 1., w) + 0.5 * (1. - smoothstep(0.2, 1.6, r)));
  float l = length(cameraPosition - vW), f = clamp(1. - exp(-uFogDen * uFogDen * l * l), 0., 1.); gl_FragColor = vec4(mix(col, uFogCol, f), 1.); }` }));
      pool.position.y = POOL; fountain.add(pool);
    }
    // the stream that spills from the basin and runs down the lawn
    const rill = Water.makeRiver({ rng: fr, light: sky, points: rillPts, width: RILL_W, speed: 2.6, foam: 0.95, bankFoam: 1, opacity: 0.8, deep: '#9fb4c8', shallow: '#e8f0f8', bankFade: 0.35, chop: 0.05 });
    scene.add(rill.object);

    await ctx.yield();
    // ------------------------------------------------------------ paths and many stairs climbing the hill
    const paveB = mk(true);
    {
      const sb = paveB.solid; sb.kind = 6;
      // Every path is lamp-lit: a white post POST_H high stands every POST_EVERY m along it, on one side and the other
      // by turns, POST_OFF from its edge, and a lamp of one of the three colours hangs from its crook over the path's
      // edge. (No post within the lane of the route's line, none in a trunk's foot or within POST_ROOM of it (the
      // great tree's and every tree's that stands: inTrunk), none in the fountain's basin or the rill or within
      // POST_ROOM of them: its lamp's numbers are drawn, and it is not set.)
      const POST_EVERY = 12, POST_H = 2.7, POST_OFF = 0.6, POST_ROOM = 0.3, pr = FK.posts;
      const post = (v, t, width, k) => {
        const sd = k % 2 ? 1 : -1, px = -t.z * sd, pz = t.x * sd, x = v.x + px * (width / 2 + POST_OFF), z = v.z + pz * (width / 2 + POST_OFF), g = gy(x, z), room = pathClear(x, g + POST_H / 2, z, POST_H / 2 + LANE - 6) && !inTrunk(x, z, POST_ROOM) && Math.hypot(x - FOUNT[0], z - FOUNT[2]) > BASIN_R + POST_ROOM && rillGap(x, z) > POST_ROOM;
        K.hangLamp(paveB.lamps, null, pr, x - px * 0.5, g + POST_H - 0.05, z - pz * 0.5, 0.4, pr.range(0.75, 0.95), mix, 1, room);
        if (!room) return;
        sb.kind = 2;
        sb.tube([[x, g - 0.2, z], [x, g + POST_H - 0.4, z], [x - px * 0.2, g + POST_H, z - pz * 0.2], [x - px * 0.5, g + POST_H, z - pz * 0.5]], [0.07, 0.055, 0.045, 0.035], 5, white, true);
        sb.kind = 6;
      };
      const stair = ({ curve, len, width }) => {
        const n = Math.round(len / STEP_ROOM), v = new THREE.Vector3(), t = new THREE.Vector3();
        for (let k = 0, m = Math.floor(len / POST_EVERY); k < m; k++) { curve.getPointAt((k + 0.5) * POST_EVERY / len, v); curve.getTangentAt((k + 0.5) * POST_EVERY / len, t); post(v, t, width, k); }
        let prev = null;
        for (let i = 0; i <= n; i++) {
          curve.getPointAt(i / n, v); curve.getTangentAt(i / n, t); const px = -t.z, pz = t.x, h = width / 2;
          const cur = { l: [v.x - px * h, v.z - pz * h], r: [v.x + px * h, v.z + pz * h], g: gy(v.x, v.z) };
          if (prev) {
            const y = Math.ceil((Math.max(prev.g, cur.g) + 0.1) / 0.3) * 0.3, c = mul3(white, 0.86 + 0.06 * ((i * 7) % 3));
            sb.face([prev.l[0], y, prev.l[1]], [prev.r[0], y, prev.r[1]], [cur.r[0], y, cur.r[1]], [cur.l[0], y, cur.l[1]], c);
            if (prev.y !== undefined && Math.abs(prev.y - y) > 0.01) sb.face([prev.l[0], prev.y, prev.l[1]], [prev.r[0], prev.y, prev.r[1]], [prev.r[0], y, prev.r[1]], [prev.l[0], y, prev.l[1]], mul3(white, 0.7));
            for (const e of ['l', 'r']) sb.face([prev[e][0], y - 0.7, prev[e][1]], [cur[e][0], y - 0.7, cur[e][1]], [cur[e][0], y, cur[e][1]], [prev[e][0], y, prev[e][1]], mul3(white, 0.66));
            cur.y = y;
          }
          prev = cur;
        }
      };
      // (a hand-back before the stairs and after each: a stair asks the ground's height at every step of it)
      for (const s of STAIRS) { await ctx.yield(); stair(s); }
    }
    await rest(1500);

    // ------------------------------------------------------------ the great river beyond the wall, and the one white swan-ship on it
    const reachU = { ...K.U, uSwan: { value: new THREE.Vector4() }, uSwanK: { value: 0 }, uRefLo: refLoU, uRefHi: refHiU, uAlpha: { value: 1 }, uBank: { value: new THREE.Vector4(REACH_W + 12, 14, 16, 5) } };
    {
      const pos = [], idx = [], at = [];
      for (let i = 0; i <= 40; i++) { const x = -900 + i * 50, zn = reachN(x) + 6; pos.push(x, REACH_Y, zn, x, REACH_Y, zn - REACH_W - 12); at.push(0, 1); if (i < 40) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(at, 1)); g.setIndex(idx); g.computeBoundingSphere();
      scene.add(new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: reachU, vertexShader: REACH_VERT, fragmentShader: REACH_FRAG })));
    }
    // the fosse's water: still water round the wall's foot, FOSSE_WATER high, from bank to bank (the ground stands over
    // it wherever it is not fosse). It is the river's own water in every way but one: it is seen through by a fifth,
    // so that the images of the gate's and the wall's lamps show in it.
    {
      const pos = [], idx = [], at = [], N = 96, R0 = 190, R1 = 205;
      for (let i = 0; i <= N; i++) { const a = i / N * TAU, s = Math.sin(a), c = Math.cos(a); pos.push(CX + s * R0, FOSSE_WATER, CZ + c * R0, CX + s * R1, FOSSE_WATER, CZ + c * R1); at.push(0, 1); if (i < N) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); } }
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aT', new THREE.Float32BufferAttribute(at, 1)); g.setIndex(idx); g.computeBoundingSphere();
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...reachU, uAlpha: { value: 0.8 }, uBank: { value: new THREE.Vector4(15, 0, 2.5, 0) } }, vertexShader: REACH_VERT, fragmentShader: REACH_FRAG, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      m.renderOrder = -1; scene.add(m);
    }
    // The ship sails a closed course with no cut in it, on the near water below the city: 220 m down the river 20 m
    // off the near bank, a half circle of 28 m radius, 220 m back up 76 m off the bank, and a half circle again. It
    // runs on the world's clock, which stands anywhere when we arrive: every point of the course is as good as any
    // other (heading and wake follow it round the turns). (The course lies some 250 to 310 m from the great tree's
    // foot in plan: from the climb and the platforms the ship is seen whole on the water below.)
    const SW_LEG = 220, SW_R = 28, SW_OFF = 20, SW_TURN = Math.PI * SW_R, SW_LEN = 2 * SW_LEG + 2 * SW_TURN, SW_X0 = CX - SW_LEG / 2;
    const swanAt = (dist, out) => {
      const q = ((dist % SW_LEN) + SW_LEN) % SW_LEN; let x, off;
      if (q < SW_LEG) { x = SW_X0 + q; off = SW_OFF; }
      else if (q < SW_LEG + SW_TURN) { const a = (q - SW_LEG) / SW_R; x = SW_X0 + SW_LEG + Math.sin(a) * SW_R; off = SW_OFF + SW_R - Math.cos(a) * SW_R; }
      else if (q < 2 * SW_LEG + SW_TURN) { x = SW_X0 + SW_LEG - (q - SW_LEG - SW_TURN); off = SW_OFF + 2 * SW_R; }
      else { const a = (q - 2 * SW_LEG - SW_TURN) / SW_R; x = SW_X0 - Math.sin(a) * SW_R; off = SW_OFF + SW_R + Math.cos(a) * SW_R; }
      out[0] = x; out[1] = reachN(x) - off; return out;
    };
    // (a great swan: 18 m from its tail to its beak, its head 9.5 m over the water)
    const wr = FK.swan, swan = { m: null, s0: wr.range(0, SW_LEN), v: wr.range(1.3, 1.9) }, SWAN_SCALE = 1.8;
    {
      const sb = new K.Solid(), w = mul3(P.white, 1.5); sb.kind = 2;
      sb.tube([[-4.2, 1.0, 0], [-3.4, 0.55, 0], [-2, 0.35, 0], [0, 0.3, 0], [1.8, 0.4, 0], [3.0, 0.7, 0], [3.6, 1.2, 0]], [0.15, 0.7, 1.25, 1.5, 1.3, 0.8, 0.3], 10, w);
      sb.tube([[3.3, 1.0, 0], [3.9, 2.2, 0], [3.5, 3.6, 0], [3.6, 4.8, 0], [4.3, 5.3, 0], [5.0, 5.0, 0]], [0.5, 0.4, 0.32, 0.3, 0.34, 0.2], 7, w);
      sb.tube([[5.0, 5.0, 0], [5.7, 4.7, 0]], [0.16, 0.03], 5, [0.9, 0.45, 0.08]);
      for (const sd of [-1, 1]) { sb.face([1.2, 1.2, sd * 1.3], [-3.6, 2.9, sd * 1.15], [-4.0, 1.0, sd * 0.9], [0.2, 0.6, sd * 1.5], w); sb.face([1.2, 1.25, sd * 1.05], [-3.4, 3.3, sd * 0.7], [-3.6, 2.9, sd * 1.15], [1.2, 1.2, sd * 1.3], w); }
      swan.m = new THREE.Mesh(sb.geometry(), K.mats.solid); swan.m.frustumCulled = false; swan.m.scale.setScalar(SWAN_SCALE); scene.add(swan.m);
    }
    const _sa = [0, 0], _sb = [0, 0], _sc = [0, 0];
    const moveSwan = (time) => {
      const q = swan.s0 + swan.v * time; swanAt(q, _sa); swanAt(q + 1, _sb); swanAt(q - 1, _sc);
      let dx = _sb[0] - _sc[0], dz = _sb[1] - _sc[1]; const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      swan.m.position.set(_sa[0], REACH_Y - 0.15 + 0.06 * Math.sin(time * 0.9), _sa[1]); swan.m.rotation.y = Math.atan2(-dz, dx);
      // (how far the water it crossed 30 m ago lies to the side of its heading now: the wake bends with the turn)
      swanAt(q - 30, _sc);
      reachU.uSwan.value.set(_sa[0], _sa[1], dx, dz); reachU.uSwanK.value = 2 * ((_sc[0] - _sa[0] + 30 * dx) * -dz + (_sc[1] - _sa[1] + 30 * dz) * dx) / 900;
    };
    moveSwan(0);

    // the rare evening: lights held in a line on the long stair, far off, by singers we never see. THEY STAND FOR THE
    // WHOLE VISIT: each light has its own place on the stair (the line's first place is drawn once; 22 lights a
    // fiftieth of the stair apart, the whole line between the stair's foot and its top), where it only bobs and
    // flickers on the world's clock. None walks, none comes or goes.
    if (rare) {
      // (the long stair's own line, from the city's plans)
      const curve = STAIRS[0].curve, NP = 24, uP = [], v = new THREE.Vector3();
      for (let i = 0; i < NP; i++) { curve.getPointAt(i / (NP - 1), v); uP.push(new THREE.Vector3(v.x, gy(v.x, v.z) + 1.9, v.z)); }
      const n = 22, ph = new Float32Array(n * 2), sg = FK.singers; for (let i = 0; i < n; i++) { ph[i * 2] = i * 0.022; ph[i * 2 + 1] = sg(); }
      const g = new THREE.InstancedBufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, -0.5, 0, 0.5, -0.5, 0, 0.5, 0.5, 0, -0.5, 0.5, 0], 3)); g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute('iS', new THREE.InstancedBufferAttribute(ph, 2)); g.instanceCount = n; g.boundingSphere = new THREE.Sphere(new THREE.Vector3(CX, 20, CZ + 90), 120);
      const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: { ...K.U, uPhase: { value: FK.singers() }, uP: { value: uP } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
        // (each light is 2.4 m across at every distance and dimmed by the haze over its distance from the eye)
        vertexShader: /* glsl */`${GL_PLACE}
uniform float uTime, uPhase; uniform vec3 uPDen; uniform vec3 uP[24]; attribute vec2 iS; varying vec2 vQ; varying float vI;
void main(){ float e = 0.03 + 0.46 * uPhase + iS.x, s = e * 23.; int k = int(clamp(floor(s), 0., 22.)); vec3 c = mix(uP[k], uP[k + 1], s - float(k));
  c.y += 0.12 * sin(uTime * 2.1 + iS.y * 40.); vec4 mv = viewMatrix * vec4(c, 1.); float d2 = dot(mv.xyz, mv.xyz);
  mv.xy += position.xy * 2.4; vQ = position.xy * 2.; gwPlaces(c); float den = dot(uPDen, vFg);
  vI = (0.85 + 0.15 * sin(uTime * 3. + iS.y * 70.)) * exp(-clamp(den * den * d2, 0., 40.)); gl_Position = projectionMatrix * mv; }`,
        fragmentShader: /* glsl */`varying vec2 vQ; varying float vI;
void main(){ float r2 = dot(vQ, vQ); if (r2 > 1.) discard; float h = 1. - r2, w = max(fwidth(vQ.x), fwidth(vQ.y)), s0 = 1. / 44., s1 = s0 + 0.25 * w * w;
  gl_FragColor = vec4(vec3(1.0, 0.86, 0.6) * (h * h * 0.3 + exp(-clamp(r2 / (2. * s1), 0., 40.)) * (s0 / s1) * 1.4) * vI, 1.); }` }));
      m.renderOrder = 4; scene.add(m);
    }
    await rest(1500);

    // ------------------------------------------------------------ the lane's test of everything made, then it all becomes meshes
    // (in two parts for each set, a hand-back after each part when it was a step's worth: every card and corner of
    //  every set that can be near the way is asked)
    // (a solid's corners SWEEP_STEP at a time: the mound's trees, all of them beside the way, are some 30,000)
    const SWEEP_STEP = 6000;
    for (const B of allB) {
      if (B.away) continue;
      tally(K.sweep({ leaves: B.leaves, lamps: B.lamps }, blocked, blockedLeaf)); await ctx.yield();
      for (let i = 0; i === 0 || i < B.solid.count; i += SWEEP_STEP) { tally(K.sweep({ solid: B.solid }, blockedCorner, null, i, i + SWEEP_STEP)); await ctx.yield(); }
    }
    tally(K.sweep({ solid: thinB }, blockedCorner)); K.meshes(scene, { thin: thinB });
    // (a mesh costs about a quarter of what its vertices and cards cost to make)
    const meshed = (B, k) => rest(400 + 0.25 * ((!k || k === 'solid') && B.solid ? B.solid.count : 0) + 0.5 * ((!k || k === 'leaves') && B.leaves ? B.leaves.count : 0));
    for (const B of [gateB, stoneB, fountB, paveB, ...farB]) { K.meshes(scene, B); await meshed(B); }
    // The sets of trees. Every set (the great tree, the city's, the mound's, the wood's) changes places with its plain
    // copy between SWAP0 and SWAP1 from the eye (see where the great tree is built), and the plain copy stays at every
    // distance beyond: no tree goes to nothing. The wood's canopy cards and the far crowns' trunks belong to no set.
    // A lamp's glow belongs to no set: it is drawn at every distance.
    const fmWhole = K.fadeMats(SWAP0, SWAP1, true), fmPlain = K.fadeMats(SWAP0, SWAP1, false);
    const sets = [];
    // Where a set's own things stand: boxes of SET_CELL metres on the ground with the heights of what stands in them
    // (every corner of its solids, every leaf card with its size, every lamp on its cord), SET_PAD wider for the sway.
    // The switch in update() asks these boxes, so a set whose trees all stand nearer than the near limit hands no
    // plain copy to the drawing, and one whose trees all stand beyond the far limit no whole one.
    const SET_CELL = 32, SET_PAD = 3;
    // (is some box nearer than d to the eye; does some box reach farther than d from it)
    const nearBox = (b, e, d) => {
      for (let i = 0, d2 = d * d; i < b.length; i += 6) {
        const x = Math.max(b[i] - e.x, 0, e.x - b[i + 3]), y = Math.max(b[i + 1] - e.y, 0, e.y - b[i + 4]), z = Math.max(b[i + 2] - e.z, 0, e.z - b[i + 5]);
        if (x * x + y * y + z * z < d2) return true;
      }
      return false;
    };
    const farBox = (b, e, d) => {
      for (let i = 0, d2 = d * d; i < b.length; i += 6) {
        const x = Math.max(e.x - b[i], b[i + 3] - e.x), y = Math.max(e.y - b[i + 1], b[i + 4] - e.y), z = Math.max(e.z - b[i + 2], b[i + 5] - e.z);
        if (x * x + y * y + z * z > d2) return true;
      }
      return false;
    };
    const boxesOf = async (Bs) => {
      const map = new Map(); let ck = NaN, c = null;
      const put = (x, y, z, r) => {
        const k = Math.floor(x / SET_CELL) * 8192 + Math.floor(z / SET_CELL);
        if (k !== ck) { ck = k; c = map.get(k); if (!c) { map.set(k, c = [x - r, y - r, z - r, x + r, y + r, z + r]); return; } }
        if (x - r < c[0]) c[0] = x - r; if (y - r < c[1]) c[1] = y - r; if (z - r < c[2]) c[2] = z - r;
        if (x + r > c[3]) c[3] = x + r; if (y + r > c[4]) c[4] = y + r; if (z + r > c[5]) c[5] = z + r;
      };
      for (const B of Bs) {
        if (B.solid) { const P = B.solid.p; for (let i = 0, n = B.solid.count * 3; i < n; i += 3) { put(P[i], P[i + 1], P[i + 2], 0); if (i % 12288 === 12285) await ctx.yield(); } }
        if (B.leaves) { const P = B.leaves.pos, Z = B.leaves.sz; for (let i = 0, n = B.leaves.count; i < n; i++) { put(P[i * 3], P[i * 3 + 1], P[i * 3 + 2], Z[i * 4]); if (i % 4096 === 4095) await ctx.yield(); } }
        if (B.lamps) { const H = B.lamps.hang, L = B.lamps.L; for (let i = 0, n = B.lamps.count; i < n; i++) { put(H[i * 3], H[i * 3 + 1], H[i * 3 + 2], L[i * 4 + 1]); put(H[i * 3], H[i * 3 + 1] - L[i * 4], H[i * 3 + 2], L[i * 4 + 1]); } }
      }
      const out = new Float32Array(map.size * 6); let o = 0;
      for (const b of map.values()) { out[o] = b[0] - SET_PAD; out[o + 1] = b[1] - SET_PAD; out[o + 2] = b[2] - SET_PAD; out[o + 3] = b[3] + SET_PAD; out[o + 4] = b[4] + SET_PAD; out[o + 5] = b[5] + SET_PAD; o += 6; }
      return out;
    };
    const treeSet = async (fulls, plains, fm, r0, r1) => {
      const whole = new THREE.Group(), plain = new THREE.Group(), sph = new THREE.Sphere(); let first = true;
      for (const B of fulls) {
        const m = {};
        for (const k of ['solid', 'leaves', 'lamps']) { if (B[k]) { Object.assign(m, K.meshes(whole, { [k]: B[k] }, fm)); await meshed(B, k); } }
        if (m.lampGlow) scene.add(m.lampGlow);
        for (const k of ['solid', 'leaves']) if (m[k]) { const bs = m[k].geometry.boundingSphere; if (first) { sph.copy(bs); first = false; } else sph.union(bs); }
      }
      for (const B of plains) { K.meshes(plain, B, fmPlain); await meshed(B); }
      scene.add(whole, plain);
      await ctx.yield(); const wb = await boxesOf(fulls); await ctx.yield(); const pb = await boxesOf(plains); await ctx.yield();
      sets.push({ whole, plain, c: sph.center.clone(), r: sph.radius, r0, r1, wb, pb });
    };
    for (let i = 0; i < NPL; i++) { K.meshes(scene, woodFar[i]); await meshed(woodFar[i]); }
    for (let i = 0; i < NCH; i++) if (woodB[i].solid.count || woodB[i].leaves.count) await treeSet([woodB[i]], [woodB[i].plain], fmWhole, SWAP0, SWAP1);
    sets.push({ whole: hero.whole, plain: hero.plain, c: new THREE.Vector3(CX, HILL_Y + HERO.height / 2, CZ), r: Math.hypot(HERO.height / 2, HERO.crownR), r0: SWAP0, r1: SWAP1 });
    for (let q = 0; q < 4; q++) if (cityB[q].solid.count) await treeSet([cityB[q]], [cityFarB[q]], fmWhole, SWAP0, SWAP1);
    await treeSet([moundB], [moundFarB], fmWhole, SWAP0, SWAP1);
    await rest(500);

    // ------------------------------------------------------------ lamp light pooled on the ground
    {
      const sum = mix[0] + mix[1] + mix[2], avg = [0, 1, 2].map((c) => (K.LAMPC[0][c] * mix[0] + K.LAMPC[1][c] * mix[1] + K.LAMPC[2][c] * mix[2]) / sum);
      // (a pool is as strong as the lamps over it: under a house, its own strength of lamp-light)
      const set = (i, x, z, r, col, y, glow = 1) => { poolP[i].set(x, z, r, glow); poolC[i].set(col[0], col[1], col[2]); };
      set(0, FOUNT[0], FOUNT[2], 12, mul3(K.LAMPC[2], 0.6), FY + 6); set(1, GATE_X, gateZ, 13, mul3(avg, 0.6), 12); set(2, GATE_X, gateZ + 20, 9, mul3(avg, 0.45), 8);
      set(3, CX, CZ, 24, mul3(avg, 0.5), HILL_Y + 20, HERO_GLOW); set(4, OUTPOST[1][0], OUTPOST[1][1], 10, mul3(K.LAMPC[1], 0.3), gy(OUTPOST[1][0], OUTPOST[1][1]) + 23); set(5, MX, MZ, 12, mul3(K.LAMPC[2], 0.3), gy(MX, MZ) + 23);
      cityTrees.sort((a, b) => a[2] - b[2]);
      for (let i = 0; i < 6 && i < cityTrees.length; i++) set(6 + i, cityTrees[i][0], cityTrees[i][1], 13, mul3(avg, 0.36), gy(cityTrees[i][0], cityTrees[i][1]) + 30, cityTrees[i][3]);
    }
    // THE CITY'S LAMP LIGHT ON ITS GROUND. Every lamp that hangs inside the wall and over it (the city trees', the
    // court's great houses', the gate's and the wall's, the paths' posts) throws a pool on the ground under it, wider and
    // fainter the higher it hangs: the pool's radius is POOL_WIDE of the lamp's height over the ground (between 3 m
    // and 14 m), its strength falls with the square of that height over POOL_NEAR. The pools are summed into one map
    // over the open ground round the great tree, about 2 m to the point, each lamp by its own strength;
    // the ground reads the map (4 t squared is the light, t the map's value), so that the hill
    // is lit where lamps hang and dark between. Where many lamps hang over one place (the gate's posts, the wall
    // beside them) their pools add up as they are to POOL_FULL, one strong pool's light, and beyond it more and more
    // slowly, to POOL_FULL + POOL_OVER at most: the bridge and the fosse under the gate's forty lamps stay a lit
    // floor of their own colours, as a floor under many lamps is to an eye used to them.
    {
      const N = 256, x0 = CX - OPEN, z0 = CZ - OPEN, cell = 2 * OPEN / N, POOL_WIDE = 0.8, POOL_NEAR = 8, POOL_K = 1.2, POOL_FULL = 1, POOL_OVER = 0.6, POOL_END = 0.01;
      const acc = new Float32Array(N * N * 3), best = new Float32Array(N * N);
      const splat = (L, i) => {
        const x = L.hang[i * 3], z = L.hang[i * 3 + 2], ly = L.hang[i * 3 + 1] - L.L[i * 4], g = gy(x, z); if (ly < g - 0.2) return;
        const h = Math.max(1.5, ly - g), r = clamp(POOL_WIDE * h, 3, 14), sz = L.L[i * 4 + 1], I = POOL_K * sz * sz * L.L[i * 4 + 3] / (1 + (h / POOL_NEAR) * (h / POOL_NEAR));
        // (a pool is laid out to where it has fallen to POOL_END of a strong pool's light, and no further than twice
        //  its radius: a lamp high in a crown lays a faint pool over a few points, or none)
        const e = Math.min(2, Math.sqrt(Math.max(0, Math.sqrt(I / POOL_END) - 1))) * r; if (e < cell * 0.5) return;
        const a0 = Math.max(0, Math.floor((x - e - x0) / cell)), a1 = Math.min(N - 1, Math.ceil((x + e - x0) / cell)), b0 = Math.max(0, Math.floor((z - e - z0) / cell)), b1 = Math.min(N - 1, Math.ceil((z + e - z0) / cell));
        for (let b = b0; b <= b1; b++) for (let a = a0; a <= a1; a++) {
          const dx = x0 + (a + 0.5) * cell - x, dz = z0 + (b + 0.5) * cell - z, q = 1 + (dx * dx + dz * dz) / (r * r), w = I / (q * q), k = b * N + a;
          acc[k * 3] += L.col[i * 3] * w; acc[k * 3 + 1] += L.col[i * 3 + 1] * w; acc[k * 3 + 2] += L.col[i * 3 + 2] * w;
          if (w > best[k]) best[k] = w;
        }
      };
      for (const B of [...cityB, gateB, paveB]) { const L = B.lamps; for (let i = 0; i < L.count; i++) { splat(L, i); if (i % 30 === 29) await ctx.yield(); } await ctx.yield(); }
      const data = new Uint8Array(N * N * 4);
      // (a function of its own for each row of the map: the engine speeds up a small function, not a loop in this long build)
      const mapRow = (b) => { for (let k = b * N, k1 = k + N; k < k1; k++) {
        if (!(best[k] > 0)) continue;
        const m = Math.max(acc[k * 3], acc[k * 3 + 1], acc[k * 3 + 2]), over = m - POOL_FULL, f = over > 0 ? (POOL_FULL + over / (1 + over / POOL_OVER)) / m : 1;
        for (let c = 0; c < 3; c++) data[k * 4 + c] = Math.round(255 * Math.sqrt(Math.min(acc[k * 3 + c] * f, 4) / 4)); data[k * 4 + 3] = 255;
      } };
      for (let b = 0; b < N; b++) { mapRow(b); if (b % 16 === 15) await ctx.yield(); }
      await ctx.yield();
      const tex = new THREE.DataTexture(data, N, N, THREE.RGBAFormat); tex.magFilter = tex.minFilter = THREE.LinearFilter; tex.needsUpdate = true;
      groundMat.uniforms.uLampMap.value = tex; groundMat.uniforms.uLampST.value.set(1 / (2 * OPEN), 1 / (2 * OPEN), -x0 / (2 * OPEN), -z0 / (2 * OPEN));
      await ctx.yield();
    }

    // ------------------------------------------------------------ grass and flowers that stand up from the ground (the kit's), on the mound and the lawns
    const wind = flora.makeWind({ direction: [0.8, 0.6], strength: 0.9, speed: 1 });
    const fmat = flora.windMaterial({ wind, backlight: 0.9, backlightTint: '#e8ff9a' });
    await ctx.yield();
    const grassCol = (x, z) => { const n = 0.8 + 0.4 * noise.n2(x * 0.035, z * 0.035); return [0.085 * n, 0.3 * n, 0.07 * n]; };
    const grassMat = { ambient: 1.5, leafAmbient: 1.5, wrap: 0.7, backlight: 0.8 };
    // (the blades thin outward over the mound's last 30 m, as the painted grass under them does)
    const onMound = (x, z) => smoothstep(127, 97, Math.hypot(x - MX, z - MZ));
    const onLawn = (x, z) => { const dc = Math.hypot(x - CX, z - CZ); return dc < 200 ? 0.8 : 0; };
    const greens = [];
    // (placed by areas of the world: the mound's clearing, the lawn round the fountain)
    const moundBox = [MX - 128, MZ - 128, MX + 128, MZ + 128], lawnBox = [FOUNT[0] - 70, FOUNT[2] - 70, FOUNT[0] + 70, FOUNT[2] + 70];
    // THE GREENS ARE LAID IN CELLS, SO THAT WHAT HAS SUNK AWAY IS NOT DRAWN. The kit lets a blade sink into the
    // ground between 80 and 115 m from the eye and a flower between 90 and 125 m, and hands a piece of them to the
    // drawing only while some of it can stand nearer than that (its middle less its reach). So the
    // mound's flowers lie in FLOWER_CELLS by FLOWER_CELLS cells (64 m), its
    // blades in GRASS_CELLS by GRASS_CELLS (85 m) and the lawn's flowers in LAWN_CELLS by LAWN_CELLS (47 m): a
    // cell is not drawn only where every flower of it has sunk away. A cell's count is
    // its share of the whole mound's on one lattice of places, so the greens stand as thick in every cell as they
    // would on the whole mound.
    // A SAVING, DECLARED AT THE HEAD: no blade and no flower is made where none could ever be drawn, further from
    // the route's line than the distance at which its kind has sunk away, GRASS_END for the blades and FLOWER_END
    // for the flowers. The mound's rule is greens over the whole mound at one thickness; what is left unmade is
    // the part of them that lies beyond those distances (6 in 100 of the blades, 3 in 100 of the flowers).
    const GRASS_END = 115, FLOWER_END = 125, GRASS_CELLS = 3, FLOWER_CELLS = 4, LAWN_CELLS = 3, CELL_LAT = 8;
    // (GREEN_K: the mound's blades and flowers thicken with the visit's density up to 1.1 of the mean and no
    // further, and the great tree's leaves up to 1.15 (where it is built): the mound is one open lawn of some
    // 250 m across, the largest sheet of greens in the place, and it stands before the whole wood. At the mean
    // density its flowers are about 70,000 triangles and its blades with the blooms among them 41,000; at 1.1
    // and over, 77,000 and 45,000.)
    const GREEN_K = Math.min(dens, 1.1);
    // (asked for every blade and flower: first whether the place is on the mound's grass at all, then whether the
    //  route comes within the kind's fading distance of it, without looking for the route's nearest place)
    const within = (end) => (x, z) => { const m = onMound(x, z); return m > 0 && pathWithin(x, z, end) && !onWay(x, z) ? m : 0; };
    // (what f gives over a box, on a lattice of n by n places)
    const sumOf = (box, f, n) => { let a = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) a += f(lerp(box[0], box[2], (i + 0.5) / n), lerp(box[1], box[3], (j + 0.5) / n)); return a; };
    const cellsOf = (box, n) => { const out = [], wx = (box[2] - box[0]) / n, wz = (box[3] - box[1]) / n; for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) out.push([box[0] + i * wx, box[1] + j * wz, box[0] + (i + 1) * wx, box[1] + (j + 1) * wz]); return out; };
    {
      const gIn = within(GRASS_END), fIn = within(FLOWER_END), allG = sumOf(moundBox, onMound, GRASS_CELLS * CELL_LAT);
      await ctx.yield();
      const allF = sumOf(moundBox, onMound, FLOWER_CELLS * CELL_LAT);
      for (const box of cellsOf(moundBox, GRASS_CELLS)) {
        await ctx.yield();
        const nG = allG > 0 ? Math.round(4 * 1600 * detail * GREEN_K * sumOf(box, gIn, CELL_LAT) / allG) : 0;
        if (nG > 10) { greens.push(await flora.makeGrassAsync({ rng: FK.grass, bounds: box, count: nG, width: [1.25, 2.1], height: [0.5, 0.95], heightAt: gy, wind, map: fmat.map, materialOptions: grassMat, groundColor: grassCol, density: gIn,
          flowers: 0.3, flowerColors: ['#ffd23a', '#ffffff', '#fffbe6', '#ffffff'], fade: [80, GRASS_END] }, ctx.yield)); await ctx.yield(); }
      }
      for (const box of cellsOf(moundBox, FLOWER_CELLS)) {
        await ctx.yield();
        const nF = allF > 0 ? Math.round(4 * 900 * detail * GREEN_K * sumOf(box, fIn, CELL_LAT) / allF) : 0;
        if (nF > 20) { greens.push(flora.makeFlowers({ rng: FK.moundFlowers, bounds: box, count: nF, heightAt: gy, wind, map: fmat.map, colors: ['#ffd23a', '#ffffff', '#ffc81e', '#ffffff', '#fff6d8', '#e4f6cf'], density: fIn, chunks: 1, groundColor: grassCol })); await ctx.yield(); }
      }
      await ctx.yield();
      const lawnAll = sumOf(lawnBox, onLawn, LAWN_CELLS * CELL_LAT);
      for (const box of cellsOf(lawnBox, LAWN_CELLS)) {
        await ctx.yield();
        const nL = lawnAll > 0 ? Math.round(800 * detail * dens * sumOf(box, onLawn, CELL_LAT) / lawnAll) : 0;
        if (nL > 0) greens.push(flora.makeFlowers({ rng: FK.lawnFlowers, bounds: box, count: nL, heightAt: gy, wind, map: fmat.map, colors: ['#ffffff', '#ffe9a0', '#dff5c8'], density: onLawn, chunks: 1, groundColor: grassCol }));
      }
    }
    for (const g of greens) scene.add(g.object);
    await ctx.yield();

    // ------------------------------------------------------------ air and light: falling leaves, motes, shafts between the trunks, spray at the falls
    const tU = { value: 0 }, set = fx.fxGroup(); scene.add(set.object);
    // (the falling leaves and the motes ride with the eye in the kit's own box, on the world's clock: at every clock
    // some are by the eye. None is drawn within the lane of it: they come in between the lane's width and twice it.)
    const NEAR_AIR = [LANE, 2 * LANE];
    const leafFall = set.add(fx.makeParticles({ rng: FK.fall, preset: 'leaves', time: tU, near: NEAR_AIR, count: Math.round((rare ? 2600 : 760) * detail * dens), box: [56, 34, 56], velocity: rare ? [0.5, -0.8, 0.2] : [1.3, -1.25, 0.5],
      size: rare ? [0.14, 0.26] : [0.18, 0.34], colors: season === 'spring' ? ['#e9b949', '#f6dd8a', '#b9cf5e'] : ['#e9b949', '#f6dd8a', '#d89a2e'], intensity: 0.95, lightDir: [sunDir.x, sunDir.y + 0.4, sunDir.z] }));
    await rest(1500);
    const motes = set.add(fx.makeParticles({ rng: FK.motes, preset: 'dust', time: tU, near: NEAR_AIR, count: Math.round(900 * detail), colors: ['#ffe2a0', '#ffd27a', '#fff2d0'], intensity: 0.8 }));
    await rest(1500);
    const rays = [];
    // shafts of the low sun where the wood's roof is open over the stream: 14 m below each of its falls. (None
    // stands over the open ride or the mound's clearing: there is no roof there to cut the light into shafts,
    // and the ride lies under the whole sky.)
    // THEY STAND WHOLE AT EVERY DISTANCE, from the first frame: no limit of distance is given them.
    // (What is left is the kit's own law of a shaft, which is a sheet turned to the eye about its own line: it
    //  thins away where the eye stands inside the shaft itself or looks straight along it.)
    const shaftAt = [];
    for (const f of stream.falls) shaftAt.push([stream.xAt(f.z + 14), f.z + 14]);
    for (const [x, z] of shaftAt) {
      const k = 30 / Math.max(sunDir.y, 0.05), cx = x + sunDir.x * k, cz = z + sunDir.z * k;
      rays.push(set.add(fx.makeGodRays({ rng: FK.rays, time: tU, position: [cx, gy(x, z) + 38, cz], direction: [-sunDir.x, -sunDir.y, -sunDir.z], radius: 34, count: 11, length: 150, width: [2.2, 7], color: '#ffd58a', intensity: 0.5, falloff: 1.1 })));
    }
    await rest(1500);
    const mist = set.add(fx.makeMist({ rng: FK.mist, time: tU, positions: fallMist, count: fallMist.length, size: [5, 8], color: '#fff3dc', opacity: 0.3, floorFade: 0.6 }));

    // ------------------------------------------------------------ life: small birds between the trunks, moths at the lamps, fireflies over the lawns
    const fauna = F.makeFauna(scene, { light: { sunDir: [sunDir.x, sunDir.y, sunDir.z], sunColor: '#ffc27a', sunIntensity: 2.2, sky: '#8a86b8', skyIntensity: 1.2, ground: '#7a5a28', groundIntensity: 0.9 } });
    await rest(3000);
    // Two flocks of swifts, small and well over the eye's line (12 m and 15 m above it where their rounds pass over
    // it): see THE SWIFTS FLY ROUNDS OF THEIR OWN below.
    // A BIRD IS ASKED FOR ROOM THROUGH ITS WHOLE WANDER. A bird's place is the flock's place on its course and its own
    // place in the flock, and from that it wanders by the kit's measure (to the side, along, up and down) on the
    // world's clock, which stands anywhere when we arrive. So wherever its own track over the ground comes within its
    // wander's reach of the line in plan, a bird flies no lower than the lane, its wings and its wander's fall above
    // the highest the line goes there: one drawn lower in the flock is lifted to that (the flock keeps its shape
    // above). SWIFT_WING is a swift's reach from its middle (0.6 m) and what the line may rise above the higher of two
    // samples of it (0.4 m at the most), WHITE_WING the same for a white bird (1.4 m and 0.4 m); the samples lie 2.5 m
    // apart, and that step is added to the reach in plan, so that both samples about any point of the line within
    // reach are asked. The white birds over the mound are asked the same question (their course is 40 m over the
    // mound's top: none is lifted unless the line climbs to them).
    // (FIREFLY_LIGHT: the half breadth of the largest firefly's light, for the same question of the fireflies further down)
    const FIREFLY_LIGHT = 0.3, SWIFT_WING = 1, WHITE_WING = 1.8, overLine = (fl, wing) => {
      const a = fl.geometry.attributes.iA, b = fl.geometry.attributes.iB, w = fl.uniforms.uWander.value, room = LANE + wing, reach = Math.hypot(1.5 * w.x, w.z) + room + 2.5, p = new THREE.Vector3();
      // (the course every 2 m, laid out once for the whole flock)
      const n = Math.floor(fl.route.length / 2) + 1, c = new Float64Array(n * 3);
      for (let k = 0; k < n; k++) { fl.route.pointAt(k * 2, p); c[k * 3] = p.x; c[k * 3 + 1] = p.y; c[k * 3 + 2] = p.z; }
      for (let i = 0; i < fl.count; i++) {
        let lift = 0; const ax = a.getX(i), ay = a.getY(i), bw = b.getW(i);
        for (let k = 0; k < n; k++) lift = Math.max(lift, lineTop(c[k * 3] + ax, c[k * 3 + 2] + bw, reach) + room + w.y - (c[k * 3 + 1] + ay));
        if (lift > 0) a.setY(i, ay + lift);
      }
      a.needsUpdate = true; return fl;
    };
    {
      // THE SWIFTS FLY ROUNDS OF THEIR OWN on the world's clock, whether we are near or not: each flock hawks up and
      // down one closed course, out across the route's line on one chord and back on another SWIFT_BACK metres
      // further along, the two bowed apart, the turn at either end (some 340 m, 17 s a round). We see them where
      // the line passes their round, at whatever point of it they are. The first flock's round lies over the
      // stream's falls, the second's over the road between the mound's clearing and the second outpost; where on
      // that stretch is drawn for the visit, from a stream of its own (swiftsAt: the first flock's place, then the
      // second's), and THE PLACE DRAWN IS THE ROUND'S MIDDLE: its two chords cross the line half of SWIFT_BACK
      // before that place and half of it after. (No bird of a round comes within the lane of the line: overLine.
      // always: the kit does not switch a flock off by the eye's distance.)
      const speed = 20, SWIFT_BACK = 28;
      const round = (m, span, angle, height, side) => [
        ...F.crossPoints(path, { u: m / LEN, lead: -SWIFT_BACK / 2, span, angle, height, side, bow: side * span * 0.06 }),
        ...F.crossPoints(path, { u: m / LEN, lead: SWIFT_BACK / 2, span, angle, height: height + 3, side, bow: -side * span * 0.06 }).reverse()];
      const b1 = FK.swifts1, lo = Math.max(S.fall0, 5), hi = Math.max(lo, S.fallN), at1 = lerp(lo, hi, FK.swiftsAt()), at2 = lerp(S.clearOut, S.out2, FK.swiftsAt());
      // (a flock is made by the kit; then lifted over the line, the world's own work; then given to the kit's
      //  fauna: a hand-back between each two, so that each call of the kit's stands alone)
      const f1 = F.makeFlock({ rng: b1, species: 'swifts', count: b1.int(14, 22), size: 1.5, speed, body: '#3a3028', belly: '#e8dcc0', route: round(at1, 150, 68, 12, 1) });
      await rest(3000);
      overLine(f1, SWIFT_WING);
      await rest(3000);
      fauna.add(f1, { always: true });
      await rest(3000);
      const b2 = FK.swifts2;
      const f2 = F.makeFlock({ rng: b2, species: 'swifts', count: b2.int(10, 16), size: 1.5, speed, body: '#3a3028', belly: '#e8dcc0', route: round(at2, 170, 110, 15, -1) });
      await rest(3000);
      overLine(f2, SWIFT_WING);
      await rest(3000);
      fauna.add(f2, { always: true });
      await rest(3000);
      // white birds wheel over the mound's ring of trees on a course of their own: a closed loop round the middle tree,
      // 50 m out (between the gold ring's crowns and the flight's line) and 40 m over the mound's top
      const b3 = FK.whiteBirds, y0 = gy(MX, MZ) + 40, a0 = b3.range(0, TAU), loop = [];
      for (let i = 0; i < 10; i++) { const a = a0 + i / 10 * TAU, r = 50 + b3.range(-5, 5); loop.push([MX + Math.sin(a) * r, y0 + 4 * Math.sin(a * 2) + b3.range(-1.5, 1.5), MZ + Math.cos(a) * r]); }
      const f3 = F.makeFlock({ rng: b3, species: 'gulls', count: b3.int(5, 8), size: 1.6, body: '#f4f1ea', wingC: '#ecebe6', tip: '#d8d6d0', route: loop });
      await rest(3000);
      overLine(f3, WHITE_WING);
      await rest(3000);
      fauna.add(f3, { always: true });
      await rest(3000);
    }
    // (moths: at the lamps over the great platform and at those of the fountain. A moth is asked for room through its
    // whole roam, as the birds are through their wander. MOTH_ROAM and MOTH_BOUNCE are the kit's own measures of that
    // roam, given here by name: to the side and along, up and down, how fast, its tremble; its rise at each wing
    // beat. MOTH_ROOM is the furthest these take it from where it is anchored, with its wings (0.3 m) and what the
    // line may lie nearer than its samples do (0.4 m). A lamp without that room has no moth; a moth drawn off its
    // lamp to a place without it circles the lamp itself. HOW MANY: eight moths to every five lamps that have a
    // moth's room, among the lamps hung in the hall over the great platform (the first 60 of them at most) and
    // the fountain's (the low tree's, then any other of the city's within 20 m of it and less than 16 m up: 90
    // lamps in all at most). By the builder's count on seeds 1 to 100 that is 12 to 31 lamps and 19 to 50 moths
    // a visit, 34 in the mean. THEY ARE ALWAYS ON, from the first frame, as the fireflies are: neither is
    // switched by the eye's distance; they are few enough (those moths, 240 to 440 fireflies) to be drawn at any
    // distance, so nothing thins them.)
    {
      const MOTH_ROAM = [1.3, 0.8, 1.5, 0.07], MOTH_BOUNCE = 0.05, mSide = 1.5 * MOTH_ROAM[0] * 0.62 + MOTH_ROAM[3];
      const MOTH_ROOM = Math.hypot(mSide, MOTH_ROAM[1] * 0.62 + MOTH_ROAM[3] + MOTH_BOUNCE, mSide) + 0.3 + 0.4;
      const pos = [], lit = (x, y, z) => { if (!blocked(x, y, z, MOTH_ROOM)) pos.push([x, y, z]); };
      const H = hero.made.lampBody.geometry.attributes.iHang.array, HL = hero.made.lampBody.geometry.attributes.iL.array;
      for (let i = 0; i < H.length / 3 && pos.length < 60; i++) { const x = H[i * 3], y = H[i * 3 + 1] - HL[i * 4], z = H[i * 3 + 2]; if (y > HERO.deck + 1 && y < HERO.deck + 15 && ((x - HERO.hall.cx) / HERO.hall.a) ** 2 + ((z - HERO.hall.cz) / HERO.hall.b) ** 2 < 1) lit(CX - x, y + HILL_Y, CZ - z); }
      // (the fountain's: the lamps of the low tree beside it first, then any other of the city's within 20 m of it)
      for (let q = 0; q < 4; q++) { const C = cityB[(LAMP_Q + q) % 4].lamps; for (let i = 0; i < C.count && pos.length < 90; i++) { const x = C.hang[i * 3], y = C.hang[i * 3 + 1] - C.L[i * 4], z = C.hang[i * 3 + 2]; if (Math.hypot(x - FOUNT[0], z - FOUNT[2]) < 20 && y < FY + 16) lit(x, y, z); } }
      if (pos.length) {
        const mo = F.makeMoths({ rng: FK.moths, positions: pos, count: Math.round(pos.length * 1.6), size: 2.2, jitter: 0.8, roam: MOTH_ROAM, bounce: MOTH_BOUNCE }), a = mo.geometry.attributes.iA;
        for (let i = 0; i < mo.count; i++) if (blocked(a.getX(i), a.getY(i), a.getZ(i), MOTH_ROOM)) { const q = pos[i % pos.length]; a.setXYZ(i, q[0], q[1], q[2]); }
        a.needsUpdate = true; fauna.add(mo, { always: true });
      }
    }
    await rest(3000);
    // fireflies over the lawn round the fountain. (A firefly is asked for room through its whole roam, as a bird is
    // through its wander: where the line passes over its roam it floats no higher than the lane, its own light, its
    // roam's rise and what the line may dip under the lower of two samples of it (0.4 m at the most) beneath the
    // lowest the line goes there; one drawn higher is brought down to that.)
    {
      const fl = F.makeFireflies({ rng: FK.fireflies, center: [FOUNT[0], FY, FOUNT[2]], radius: 80, count: Math.round(340 * detail * dens), heightAt: gy, altitude: [0.4, 3.5], color: '#f6e28a', color2: '#bfe8a0', size: 0.2 }), a = fl.geometry.attributes.iA, rm = fl.uniforms.uRoam.value;
      const side = 1.5 * rm.x * 0.6 + rm.w, rise = rm.y * 0.6 + rm.w, room = LANE + FIREFLY_LIGHT;
      for (let i = 0; i < fl.count; i++) { const top = lineLow(a.getX(i), a.getZ(i), side * Math.SQRT2 + room + 2.5) - room - rise - 0.4; if (a.getY(i) > top) a.setY(i, top); }
      a.needsUpdate = true; fauna.add(fl, { always: true });
    }

    await rest(3000);
    // ------------------------------------------------------------ the mountains in the west
    // (ridge behind ridge, five of them: the nearest the darkest, each further one paler and nearer the haze's own colour,
    // the highest with snow that takes the last rose light: see the light below for their colours by the hour)
    const ridges = T.makeHorizonRidges({ rng: FK.ridges, layers: 5, segments: 200, radius: [1600, 3300], height: [110, 520], base: -30, colorNear: '#3e3a5e', haze: '#d8b890', hazeNear: 0.28, hazeFar: 0.9, sunDir, sunColor: '#ffb070', sunIntensity: 0.8, snow: '#e8dcd8', snowLine: 0.6, rim: 0.45 });
    scene.add(ridges.object);
    await ctx.yield();

    // ------------------------------------------------------------ THE LIGHT OF A PLACE
    // The hour stands (see the visit's look); the light differs from place to place because of the place: by how
    // much sky stands open over a point. Three kinds of place, each with its own light for the whole visit:
    //   UNDER THE OPEN SKY (the stream's strip, the mound's clearing, the open ground before the wall, the lawn
    //     between the houses, the river, and everything over the roofs): the cool blue-violet of the sky overhead,
    //     and from the west the low amber of the sun on the rim, which is weak already: what stands open is lit
    //     cool and has one warm side; thin air, rose toward the sun and blue-violet away from it;
    //   UNDER THE WOOD'S ROOF: the last low gold comes in under the roof from the west, whole (the sun stands lower
    //     than the roof): strong gold on what faces it and on the floor between the trunks' long shadows, and the
    //     shade a violet one (the east's sky, what the gold leaves let down of it); the wood's own gold haze;
    //   UNDER THE CITY'S ROOF: deep blue shade (next to nothing of the sun, a little of the sky's blue), thin blue
    //     air, and the lamps strong in it: there THE LAMPS ARE THE LIGHT.
    // Which a point is in is read from THE ROOF MAP, made below from the crowns that stand (see the part: GL_PLACE).
    // What stands over a roof's top is under the open sky: the topmost leaves take the last amber.
    // Each set: the sun's light, the sky's, the ground's (all divided by pi), what the leaves give of themselves, the
    // haze toward the sun (fog, and fogSun close about the sun) and away from it (cool), its density, the lamps' strength.
    // THE CITY'S SILVER (silver: what a silver bole's shade is of the sky's and the ground's light there; the part's
    // own, a cool violet, where none is given): under the city's roof the boles are pillars of silver, a grey with
    // a little of the lamps' warmth in it, not the blue to indigo the sky's light alone made of them. Set once here.
    // Under the open sky (the far wood's trunks, the far bank's) it is a grey-violet: the trunks stand in the dusk's
    // light, amber on the side to the sun and grey away from it, and no longer as indigo poles. The wood's is the part's.
    const V3 = (r, g, b) => new THREE.Vector3(r, g, b), C3v = (hex) => { const c = new THREE.Color(hex); return V3(c.r, c.g, c.b); };
    const mixV = (a, b, k) => new THREE.Vector3().lerpVectors(a, b, k);
    const leafAmbA = V3(0.05, 0.035, 0.01), leafAmbD = V3(0.34, 0.24, 0.1);
    const EVE = {
      open: { sun: V3(0.40, 0.22, 0.10).multiplyScalar(1 + 0.25 * LATE), sky: V3(0.19, 0.23, 0.50), gnd: V3(0.09, 0.10, 0.12), amb: mixV(leafAmbA, leafAmbD, 0.4),
        fog: V3(0.44, 0.24, 0.19), cool: V3(0.12, 0.14, 0.28), fogSun: V3(0.40, 0.20, 0.07), den: 0.0010, gain: 1.15, silver: V3(1.05, 0.96, 0.74) },
      wood: { sun: V3(1.0, 0.68, 0.30).multiplyScalar(1 + 0.1 * LATE), sky: V3(0.21, 0.21, 0.36), gnd: V3(0.36, 0.26, 0.10), amb: mixV(leafAmbA, leafAmbD, 0.25),
        fog: C3v(hazy ? '#d9aa62' : '#c9a066'), cool: V3(0.16, 0.15, 0.30), fogSun: V3(0.72, 0.42, 0.13), den: fogDenA, gain: 1.0 },
      city: { sun: V3(0.10, 0.06, 0.03), sky: V3(0.10, 0.13, 0.27), gnd: V3(0.07, 0.07, 0.075), amb: mixV(leafAmbA, leafAmbD, 0.45),
        fog: V3(0.20, 0.16, 0.28), cool: V3(0.09, 0.11, 0.24), fogSun: V3(0.36, 0.19, 0.07), den: 0.0012, gain: 1.7, silver: V3(1.5, 1.14, 0.68) },
    };
    // (the standing night: the afterglow still lights what faces west; the sky's light is the east's blue; under
    //  the wood's roof the gold outlasts the open evening's; the city's shade is the darkest and its lamps strong)
    const NIGHTL = {
      open: { sun: V3(0.32, 0.22, 0.14), sky: V3(0.20, 0.24, 0.40), gnd: V3(0.17, 0.14, 0.10), amb: leafAmbD.clone(), fog: C3v('#a07c80'), cool: C3v('#7c7a9c'), fogSun: V3(0.45, 0.25, 0.1), den: 0.0011, gain: 1.15 },
      wood: { sun: V3(0.575, 0.3885, 0.207), sky: V3(0.288, 0.3125, 0.4315), gnd: V3(0.292, 0.2275, 0.1255), amb: mixV(leafAmbA, leafAmbD, 0.85),
        fog: mixV(C3v(fogA), C3v(fogB), 0.85), cool: mixV(C3v(fogCoolA), C3v(fogCoolB), 0.85), fogSun: V3(0.662, 0.3885, 0.149), den: lerp(fogDenA, fogDenB, 0.85), gain: 1.1 },
      city: { sun: V3(0.096, 0.064, 0.036), sky: V3(0.12, 0.136, 0.224), gnd: V3(0.096, 0.08, 0.056), amb: mixV(leafAmbA, leafAmbD, 0.6), fog: C3v('#a07c80'), cool: C3v('#7c7a9c'), fogSun: V3(0.36, 0.2, 0.08), den: 0.0011, gain: 1.45, silver: V3(1.2, 1.1, 0.85) },
    };
    const PL = NIGHT ? NIGHTL : EVE;
    // THE HAZE NEVER GOES TO WHITE. Toward the sun a place's haze is its own colour with the sun's glow in it added
    // (fogSun, close about the sun). Left to add up, the wood's two together pass 1 in the red, and what
    // stands far off toward the sun (the wood's far boles, the wood beyond the mound's clearing) goes to a flat
    // white. So the sum's strongest channel is HAZE_MOST in every place:
    // the glow is taken down by one factor (its colour kept) until the haze toward the sun is the mist's own gold,
    // a little brighter than the mist away from it, and a far bole stands in it as a darker thing with its lit
    // and its shaded side. A rule of the place's light, set once here; the eye's place has no part in it.
    const HAZE_MOST = 0.72;
    for (const q of [PL.open, PL.wood, PL.city]) { const top = Math.max(q.fog.x + q.fogSun.x, q.fog.y + q.fogSun.y, q.fog.z + q.fogSun.z); if (top > HAZE_MOST) q.fogSun.multiplyScalar(Math.max(0, Math.min(...['x', 'y', 'z'].map((k) => q.fogSun[k] > 0 ? (HAZE_MOST - q.fog[k]) / q.fogSun[k] : 1)))); }
    // (what the great river carries: the sky's low and high colours; the mist in the hollows; the mountains' haze and snow)
    const refLo = new THREE.Color(NIGHT ? '#eaa890' : '#f2a468'), refHi = new THREE.Color(NIGHT ? '#7a86b8' : '#4a5a9c');
    const mistD = NIGHT ? new THREE.Vector3(0.62, 0.52, 0.56) : new THREE.Vector3(0.40, 0.29, 0.33), MIST = 0.8;
    // THE ROOF MAP: the country from above, 2.9 m by 2.6 m to the point, over the box the shade map covers. Every
    // crown that stands lays a disc (whole to ROOF_CORE of its boughs' reach, gone at ROOF_EDGE of it) into the red
    // channel if it is of the wood, the green if it is of the city, and its top's height into the blue, a little
    // wider (ROOF_WIDE), so that the height does not fall away before the roof does. Where the city's roof stands
    // it comes before the wood's. The stream's strip is open: the wood's roof is taken off from STRIP_OPEN to
    // STRIP_ROOF metres from the stream's middle (no crown hangs over the water: streamOpen). Alpha is the wood's
    // HAZE: the wood's roof spread HAZE_M metres either way, so that the gold air does not stop at a trunk's foot
    // (it stands over the stream's strip too, and thins away over the first metres of the clearing).
    // THE WOOD'S MIST LIES IN THE OLD WOOD AND CLEARS TOWARD THE CITY (by place): it is whole from the mound outward
    // (HAZE_WHOLE: the mound's middle is that far from the city's) and thins to none HAZE_CLEAR from the city's
    // middle (a hundred metres beyond its open ground): the hill of the city, its wall and the ring of wood about
    // it stand in the evening's own thin air: the city is on a hill, over the hollows the mist lies in. The boles
    // of the wood about it go down to a floor that is seen, and the mist begins beyond, toward the mound. Beyond the box
    // (the far wood seen from above, the river) every point is under the open sky: the map's rim is empty.
    const RW = 256, RH = 512, ROOF_TOP = 200, ROOF_BAND = 14, ROOF_CORE = 0.6, ROOF_EDGE = 1.15, ROOF_WIDE = 1.6, STRIP_OPEN = 7, STRIP_ROOF = 16, HAZE_M = 30, HAZE_CLEAR = OPEN + 100, HAZE_WHOLE = Math.hypot(MX - CX, MZ - CZ), roofPx = new Uint8Array(RW * RH * 4);
    {
      const kx = RW / (BX1 - BX0), kz = RH / (BZ1 - BZ0), topOf = (y) => clamp(Math.round(y / ROOF_TOP * 255), 0, 255);
      // (functions of their own: the engine speeds up a small function, not a loop inside this long build)
      const crown = (tx, tz, cr, top, ch) => {
        const e = cr * ROOF_WIDE, x0 = Math.max(1, Math.floor((tx - e - BX0) * kx)), x1 = Math.min(RW - 2, Math.ceil((tx + e - BX0) * kx)), z0 = Math.max(1, Math.floor((tz - e - BZ0) * kz)), z1 = Math.min(RH - 2, Math.ceil((tz + e - BZ0) * kz)), tv = topOf(top);
        const e2 = e * e, c1 = cr * ROOF_EDGE, c0 = cr * ROOF_CORE, c12 = c1 * c1;
        for (let pz = z0; pz <= z1; pz++) {
          const dz = (pz + 0.5) / kz + BZ0 - tz, dz2 = dz * dz; if (dz2 > e2) continue;
          for (let px = x0; px <= x1; px++) {
            const dx = (px + 0.5) / kx + BX0 - tx, d2 = dx * dx + dz2; if (d2 > e2) continue;
            const i = (pz * RW + px) * 4; if (tv > roofPx[i + 2]) roofPx[i + 2] = tv;
            if (d2 >= c12) continue;
            const v = Math.round(255 * smoothstep(c1, c0, Math.sqrt(d2))); if (v > roofPx[i + ch]) roofPx[i + ch] = v;
          }
        }
        return (x1 - x0 + 1) * (z1 - z0 + 1);
      };
      // (the map's making is handed back by the points it has gone over, ROOF_STEP at a time: none of it is in the
      //  pacer's count. On a loaded machine a point of the last pass was seen to take 3 microseconds.)
      const ROOF_STEP = 4000; let gone = 0;
      for (let i = 0; i < roofTrees.length; i++) { const q = roofTrees[i]; gone += Math.max(0, crown(q[0], q[1], q[2], q[3], q[4])); if (gone >= ROOF_STEP) { gone = 0; await ctx.yield(); } }
      await ctx.yield();
      // (the haze: the wood's roof summed over 2 * n + 1 points along the rows, then along the columns)
      const haze = new Float32Array(RW * RH), tmp = new Float32Array(RW * RH);
      const spread = (src, dst, n, len, step, from) => { let s = 0; for (let k = -n; k <= n; k++) s += src(from + clamp(k, 0, len - 1) * step); for (let k = 0; k < len; k++) { dst[from + k * step] = s / (2 * n + 1); s += src(from + clamp(k + n + 1, 0, len - 1) * step) - src(from + clamp(k - n, 0, len - 1) * step); } };
      const red = (i) => roofPx[i * 4] / 255, got = (i) => tmp[i];
      for (let pz = 0; pz < RH; pz++) { spread(red, tmp, Math.round(HAZE_M * kx), RW, 1, pz * RW); if ((pz + 1) % Math.round(ROOF_STEP / RW) === 0) await ctx.yield(); }
      for (let px = 0; px < RW; px++) { spread(got, haze, Math.round(HAZE_M * kz), RH, RW, px); if ((px + 1) % Math.round(ROOF_STEP / RH) === 0) await ctx.yield(); }
      const row = (pz) => {
        // (the stream's middle at this row: stream.dist is 0.97 of the distance from it along x)
        const z = (pz + 0.5) / kz + BZ0, strip = inStream(z), xs = strip ? stream.xAt(z) : 0;
        for (let px = 0; px < RW; px++) {
          const i = (pz * RW + px) * 4, city = roofPx[i + 1] / 255; let wood = roofPx[i] / 255 * (1 - city);
          if (strip && wood > 0) wood *= smoothstep(STRIP_OPEN, STRIP_ROOF, Math.abs((px + 0.5) / kx + BX0 - xs) * 0.97);
          const rim = px === 0 || pz === 0 || px === RW - 1 || pz === RH - 1;
          roofPx[i] = rim ? 0 : Math.round(255 * wood); roofPx[i + 3] = rim ? 0 : Math.round(255 * Math.min(1, 1.3 * haze[pz * RW + px]) * (1 - city) * smoothstep(HAZE_CLEAR, HAZE_WHOLE, Math.hypot((px + 0.5) / kx + BX0 - CX, z - CZ))); if (rim) roofPx[i + 1] = 0;
        }
      };
      for (let pz = 0; pz < RH; pz++) { row(pz); if ((pz + 1) % Math.round(ROOF_STEP / RW) === 0) await ctx.yield(); }
    }
    const roofTex = new THREE.DataTexture(roofPx, RW, RH, THREE.RGBAFormat, THREE.UnsignedByteType);
    roofTex.minFilter = THREE.LinearFilter; roofTex.magFilter = THREE.LinearFilter; roofTex.wrapS = roofTex.wrapT = THREE.ClampToEdgeWrapping; roofTex.needsUpdate = true;
    // (and the part's one-pixel roof stand-in where the roof map takes its place)
    { const stand = K.U.uRoof.value; K.setRoof(roofTex, [1 / (BX1 - BX0), 1 / (BZ1 - BZ0), -BX0 / (BX1 - BX0), -BZ0 / (BZ1 - BZ0)], ROOF_TOP, ROOF_BAND); stand.dispose(); }
    await ctx.yield();
    // EACH PLACE'S LIGHT, set once.
    const _cp = new THREE.Vector3();
    [PL.open, PL.wood, PL.city].forEach((q, i) => K.setLight(i, { sunDir, sunCol: q.sun, skyCol: q.sky, gndCol: q.gnd, fogSun: q.fogSun, leafAmb: q.amb, fogCol: q.fog, fogCool: q.cool, fogDen: q.den, lampGain: q.gain, silverShade: q.silver }));
    // WHAT STANDS UNDER THE OPEN SKY takes the hour's open light, once: the far haze the engine's own fog gives, the
    // mountains (dark against the west, the nearest the darkest, their snow taking the last rose), what the great
    // river carries (the west's amber low, the sky's blue-violet high), the mist in the wood's hollows, the shafts
    // of sun in the wood and the fountain's water. None of these is touched again while we fly.
    // WHAT LIGHTS THE GRASS AND THE FLOWERS is the kit's rig of two lights (a hemisphere's and the sun's). Their
    // COLOURS are set here, once: the open sky's, the ground's and the low sun's, as the trees have them, each
    // brought to its own brightest channel. Their STRENGTHS are the kit's: the rig takes them from the sky it was
    // made for (times the `ambient` and `intensity` given at its making) and writes them again every frame, the
    // same two numbers from the first frame to the last, on every visit; this world writes no strength of its own.
    scene.fog.color.setRGB(PL.open.fog.x, PL.open.fog.y, PL.open.fog.z); scene.fog.density = PL.open.den;
    ridges.uniforms.uHaze.value.set(NIGHT ? '#a8848e' : '#b07a78'); ridges.uniforms.uSunColor.value.setRGB(1.0, NIGHT ? 0.42 : 0.5, NIGHT ? 0.4 : 0.3).multiplyScalar(NIGHT ? 0.45 : 0.6); ridges.uniforms.uSnow.value.set(NIGHT ? '#f2b4ac' : '#f0b0a0');
    ridges.uniforms.uAmbient.value.setRGB(0.5, 0.52, 0.66).multiplyScalar(NIGHT ? 0.33 : 0.42);
    reachU.uRefLo.value.copy(refLo); reachU.uRefHi.value.copy(refHi);
    groundMat.uniforms.uMist.value.set(mistD.x, mistD.y, mistD.z, MIST);
    {
      const o = PL.open, sk = Math.max(o.sky.x, o.sky.y, o.sky.z), su = Math.max(o.sun.x, o.sun.y, o.sun.z);
      rig.hemi.color.setRGB(o.sky.x / sk, o.sky.y / sk, o.sky.z / sk); rig.hemi.groundColor.setRGB(o.gnd.x / sk, o.gnd.y / sk, o.gnd.z / sk);
      rig.sun.color.setRGB(o.sun.x / su, o.sun.y / su, o.sun.z / su);
    }
    for (const r of rays) r.uniforms.uIntensity.value = NIGHT ? 0 : 0.6;
    fountU.uColor.value.set(0.5, 0.52, 0.6).multiplyScalar(NIGHT ? 0.25 : 0.32).add(new THREE.Vector3(K.LAMPC[2][0], K.LAMPC[2][1], K.LAMPC[2][2]).multiplyScalar(0.6));
    motes.setOpacity(NIGHT ? 0 : 0.7);
    await ctx.yield();
    await sky.prewarm(ctx.renderer, null, scene);
    await ctx.yield();

    // ------------------------------------------------------------ how fast we go (the one declared pacing), and where the eye goes
    // THE BASE PACE, in shares of the REFERENCE flight's mean speed (see REF_CLIMB; REF turns them into shares of this
    // flight's own mean): WOOD_PACE through the wood; a quarter slower across the mound's clearing, where the flight
    // goes up through the rings (easing between the clearing's edge and the mound's foot, in and out); THE RIDE HAS A
    // BOUND OF ITS OWN (rideTab, below); CITY_PACE from the lawn on (easing between the gate and the lawn's knot:
    // the city is climbed between its trees, and its round and its turn are flown as fast as the look allows, no
    // faster); eased down to the engine's own slowest (PACE_LOW) between the turn's beginning and the place where
    // the ring stands clear (S.sight), and held to the ring: the hall is walked, not flown. Under it THE PACE NEVER
    // OUTRUNS THE LOOK (the cap below): the corners and the round are flown slower, and what that costs is shared
    // by all the rest in one proportion (paceK), as the engine itself would share it.
    // (WOOD_PACE: only the ratios between these numbers count, the engine shares the film's seconds by them; 1.12
    // against the hall's 0.35 gives the last 60 m, straight at the ring, about four of the film's seconds.)
    const WOOD_PACE = 1.12, PACE_LOW = 0.35, CITY_PACE = 0.85, REF = (REF_LEN + RUN_IN) / LEN, TOP = PACE_TOP * REF;
    const basePace = (m) => {
      const wood = WOOD_PACE - 0.25 * dawn(S.clearIn, S.footIn, m) * (1 - dawn(S.footOut, S.clearOut, m));
      return REF * lerp(lerp(wood, CITY_PACE, dawn(S.gate, S.lawn, m)), PACE_LOW, dawn(S.turn, S.sight, m));
    };
    // The pace is laid on the engine's own 65 marks of the route (it reads a world's pace there and nowhere else, and
    // runs straight between them). A mark is the least of five: the base pace times the one number paceK; its cap
    // (none until it is worked out below); the ride's bound where it lies; the turns' bound (turnTab, below: none
    // until a turn asks for one); and TOP, one and a half of the reference mean: no stretch is flown faster than
    // that, the first mark like the rest.
    // THE WOOD KEEPS ITS PACE. paceK is the number at which THE REFERENCE FILM lasts its DUR seconds by the engine's
    // own sum: the film of the base pace and the look's caps alone, without the ride's bound and without the
    // turns' (and never more than K_TOP, at which the wood's own pace reaches TOP: more would only hurry the two
    // slow beats, the mound and the hall). What the ride's bound and the turns' bound then take is ADDED TO THE
    // FILM'S SECONDS and taken from no other stretch: the flight lasts FILM = DUR times filmK seconds (filmK: the
    // marks' own sum as the engine sums it), a few seconds more than DUR, and the engine is given that duration
    // (it scales a world's pace so that the world lasts the duration it gives: the speeds flown are these marks'
    // times V_MEAN, the reference film's mean speed, whatever FILM is). On a visit whose corners cost more
    // seconds than DUR leaves, paceK and the bound rise together in the one proportion paceOver (1 where the
    // bound holds).
    const MARKS = 64, MARK = LEN / MARKS, CAP_STEP = 5, NCAP = Math.ceil(LEN / CAP_STEP) + 1, V_MEAN = LEN / DUR, K_TOP = PACE_TOP / WOOD_PACE;
    const capMark = new Float32Array(MARKS + 1).fill(9), markTab = new Float32Array(MARKS + 1);
    // THE RIDE'S OWN BOUND: from the mound's way down to the gate the flight goes no faster than RIDE_MS metres a
    // second, whatever paceK is. WHAT SETS IT IS THE RIDE ITSELF: on the treeless green between the wood's edge and
    // the gate three things are come to one after another, the first outpost, the second outpost and the gate (the
    // plan's OUTPOST and the gate: RIDE_THINGS), and the eye is given the crew's least time for a thing, a second
    // and a half (GAZE_LEAST), for each: the ride's own metres, from the wood's edge to the gate, are flown in no
    // less than that many seconds. So RIDE_MS is those metres over those seconds: no speed is typed, and it falls
    // where the ride's length puts it (near 39 m/s: the outposts stand 75 m apart and the wood's edge 25 m before
    // the first). (The bound is whole RIDE_SETTLE before the wood's edge, the metres flown at it in three of the
    // engine's easing times, so that the speed has settled under it at the edge; it comes in over the two marks
    // before that, on the mound's way down, and holds to the first mark past the gate, so that the pace, which
    // runs straight between marks, is under it at the gate itself; it goes out over the lawn's stretch from
    // there, where the city's pace is its like. What the ride takes is added to the film's seconds (FILM,
    // above): the wood, the mound and the lawn keep their pace.)
    const GAZE_LEAST = 1.5, RIDE_THINGS = OUTPOST.length + 1, RIDE_MS = (S.gate - S.clearOut) / (RIDE_THINGS * GAZE_LEAST), RIDE_SETTLE = 3 * RIDE_MS / EASE, rideIn = S.clearOut - RIDE_SETTLE;
    const rideTab = Float64Array.from({ length: MARKS + 1 }, (_, i) => lerp(V_IN_K, RIDE_MS / V_MEAN, dawn(rideIn - 2 * MARK, rideIn, i * MARK) * (1 - dawn(S.gate + MARK, S.lawn + MARK, i * MARK))));
    // (the base pace at the marks, taken once: it is asked for again each time the one number is sought)
    const baseTab = Float64Array.from({ length: MARKS + 1 }, (_, i) => basePace(i * MARK));
    const pace = (u) => { const x = clamp(u, 0, 1) * MARKS, i = Math.min(MARKS - 1, Math.floor(x)); return markTab[i] + (markTab[i + 1] - markTab[i]) * (x - i); };
    const turnTab = new Float32Array(MARKS + 1).fill(9);
    let paceK = 1, paceOver = 1, filmK = 1;
    const setK = () => {
      // (fill: the marks and their sum as the engine sums it; bound false: the reference film's marks)
      const fill = (K, top, bound) => { let inv = 0; for (let i = 0; i <= MARKS; i++) markTab[i] = clamp(bound ? Math.min(K * baseTab[i], capMark[i], top, rideTab[i], turnTab[i]) : Math.min(K * baseTab[i], capMark[i], top), PACE_LOW, V_IN_K); for (let i = 0; i < MARKS; i++) inv += 2 / (markTab[i] + markTab[i + 1]); return inv / MARKS; };
      paceOver = 1;
      if (fill(K_TOP, TOP, false) <= 1) { let lo = 0.3, hi = K_TOP; for (let k = 0; k < 30; k++) { paceK = (lo + hi) / 2; if (fill(paceK, TOP, false) > 1) lo = paceK; else hi = paceK; } }
      else { let lo = 1, hi = V_IN_K / TOP; for (let k = 0; k < 30; k++) { paceOver = (lo + hi) / 2; if (fill(K_TOP * paceOver, TOP * paceOver, false) > 1) lo = paceOver; else hi = paceOver; } paceK = K_TOP * paceOver; }
      filmK = fill(paceK, TOP * paceOver, true);
    };
    // the speed flown at a place (m/s)
    const speedAt = (m) => V_MEAN * pace(m / LEN);
    setK();
    // what is looked at: the guard tree's platform; the mound's crown; the great tree's middle; the great trunk's
    // axis; the hall's door; the ring (gazeFount, the fountain's spout, is not looked at: it marks where the ride's
    // look hands over to the tree's)
    const gazeHero = new THREE.Vector3(CX, HILL_Y + HERO.height / 2, CZ), gazeCrown = new THREE.Vector3(MX, gy(MX, MZ) + 28, MZ), gazeFount = new THREE.Vector3(FOUNT[0], FY + JET, FOUNT[2]);
    const gazeGuard = new THREE.Vector3(GUARD[0], gy(GUARD[0], GUARD[1]) + GUARD_H, GUARD[1]), gazeDoor = new THREE.Vector3(...hl(HERO.lineX, WALK_Y - 1, HERO.hall.cz + HERO.hall.b));
    const gazeAxis = new THREE.Vector3(), portalAt = path.end.clone();
    // A look at a thing we PASS holds while the thing stands within PASS_OFF of the heading: half a right angle,
    // beyond which a thing passed at d metres is more than d to the side of the point we fly to; held longer, the
    // look swings sideways as the thing goes by. The window is the first run of route between two places for which
    // that is so, taken at the even 2.5 m samples. (A thing we ROUND is looked at between places.)
    const PASS_OFF = 45;
    const gazeRun = (target, mA, mB, off) => {
      const t = new THREE.Vector3(); let a = -1, b = -1;
      for (let i = iOf(mA); i <= iOf(mB); i++) {
        path.tangentAt(i / (NS - 1), t);
        const dx = target.x - PS[i * 3], dz = target.z - PS[i * 3 + 2], d = Math.hypot(dx, dz), tl = Math.hypot(t.x, t.z);
        const ang = Math.acos(clamp((dx * t.x + dz * t.z) / Math.max(d * tl, 1e-4), -1, 1)) * 180 / Math.PI;
        if (ang < off) { if (a < 0) a = i; b = i; } else if (a >= 0) break;
      }
      return a < 0 ? null : { a: sOf(a), b: sOf(b) };
    };
    // the fountain's spout is clear of the gate where the straight line to it passes between the gate's open leaves
    S.spout = firstS((x, y, z) => { if (z <= GATE_Z) return true; const xc = x + (FOUNT[0] - x) * (z - GATE_Z) / (z - FOUNT[2]); return Math.abs(xc - GATE_X) < GATE_CLEAR; }, S.out2);
    const guardRun = gazeRun(gazeGuard, S.fall0, S.fallN, PASS_OFF), fountRun = gazeRun(gazeFount, S.spout, S.join, PASS_OFF), mF1 = fountRun ? fountRun.b : S.lawn;
    // (the mound's crown is a thing we pass: its look ends where it stands PASS_OFF off the heading, among the rings)
    const crownRun = gazeRun(gazeCrown, S.fallN, S.leave, PASS_OFF), mC = crownRun ? crownRun.b : S.round;
    const axisMid = HILL_Y + HERO.height / 2;
    // THE PULLS (metres between places; every fade lasts FADE_S or more at the speeds flown where it lies):
    //  the wood's look, to the kind's weight for a thing ahead, from the start to the last fall: the guard tree's
    //   platform while it stands within PASS_OFF of the heading, then the way out of the wood, the line's own point
    //   over the last fall (the look turns from the one to the other between the bole and the place where the
    //   platform stands PASS_OFF off); so through the weave between the great trunks the eye rests on what is ahead;
    //  the mound's crown, to the kind's weight for a thing rounded, coming in as the wood's look goes out before the
    //   last fall (the wood's edge) and held up the slope,
    //   let go where the crown stands PASS_OFF off the heading as we come in among the rings;
    //  the ride's look, the great tree's middle on the city's hill, takes over across the stretch that ends there, so
    //   that from the mound's brow the eye is on the city. (No glance to the fountain's spout on the way: from where
    //   the spout is clear of the gate to where it stands PASS_OFF off the heading there are under 90 m, flown in
    //   under two seconds: no room for a turn of a second and a half there and another back.)
    //  THE CITY'S LOOK takes over from the ride's across the stretch that ends where the fountain's spout stands
    //   PASS_OFF off the heading (both look at the great tree's middle through it), and holds to the ring. It is one
    //   pull of the whole weight whose point is laid here place by place: the line's own look (the way to the point
    //   AHEAD) turned toward each of the city's PLACES by that place's share at the metre flown (cityAt):
    //    the great trunk: at its middle height as far as the lawn, then (across the leg from the lawn to the round)
    //     at our own height and GAZE_UP over it: the trunk, its ladder from below, the platforms about it. W_TREE
    //     where the round begins AND KEPT ROUND IT: the great tree with its floors stands on
    //     our inner hand the whole way round, the court's houses stand on the outer hand; let go over the
    //     round's last seventh (ROUND_LAST of its sweep to its end). (No share of the round is typed but the
    //     last seventh.)
    //    the west (the wood under the sun, WEST_FAR off at the hill's own height: the look goes a little down to
    //     the land, the river and the wood under the sky): W_WEST, coming in over the round's last seventh as the tree's
    //     share goes out (the west is then on our right, where the tree was: the look does not swing across),
    //     held on the straight out over the crowns, let go across the metres flown in FADE_S either side of the
    //     turn's beginning;
    //    the hall's door: W_ROUND, from the place on the turn where the door stands PASS_OFF off the heading,
    //     over the metres flown in twice FADE_S; and from the door the ring (the point itself goes over from the
    //     one to the other across the metres flown in FADE_S about the door).
    //   Whatever the shares ask, the look is held within GAZE_MAX of the heading (it is brought back toward the
    //   line's own look until it is). pace.ramps lists every stretch over which a share moves.
    //  Where two pulls meet both fade across the SAME stretch, so their weights never add to more than the larger.
    //  A pull's weight is its kind's (W_ROUND round a thing or up to it, W_AHEAD to a thing ahead or passed: three
    //  quarters and under a half of the way from the line's own look to the thing) or less: the largest at which
    //  the look stays within GAZE_MAX degrees of the heading along its whole stretch (wOf).
    // (FADE_S: a turn of the look lasts a second and a half or more, and a fifth over for the pace's play between
    //  marks. GAZE_MAX: the crew's 75 less the two degrees the camera's sway and lean add to the look. AHEAD: the
    //  look's reach along the line, the breadth of a great crown. LEAN: a quarter of the engine's full lean.)
    const FADE_S = 1.7, GAZE_MAX = 73, AHEAD = 26, LEAN = 0.25, W_ROUND = 0.75, W_AHEAD = 0.45, W_TREE = 0.5, W_WEST = 0.6, GAZE_UP = 8, ROUND_LAST = 6 / 7, WEST_FAR = 1500, pois = [];
    const _la = new THREE.Vector3(), _lb = new THREE.Vector3(), _lc = new THREE.Vector3();
    // (what the wood's look and the ride's and the tree's turn to at a place; rW, rT, rD: the lengths of the
    //  wood's turn and of the turns to the door and to the ring)
    let rW = 40, rT = 26, rD = 26, rO = 26;
    const gazeWay = path.posAtDist(S.fallN, new THREE.Vector3()), mPass = guardRun ? guardRun.b : S.guard, gazeWood = new THREE.Vector3();
    const woodAt = (time, u) => gazeWood.copy(gazeGuard).lerp(gazeWay, smoothstep(mPass - rW, mPass, u * LEN));
    const _ld = new THREE.Vector3();
    // (the line at a place, taken once and kept, for it is asked many times over as the pace and the pulls settle:
    // where it is, the way to the point AHEAD, its heading there, its heading at the point AHEAD, and the way to the
    // steady camera's further point, AHEAD_S on)
    const AHEAD_S = Math.min(AHEAD * 3.4, Math.max(AHEAD, LEN * 0.22));
    const lineKept = new Map(), _k0 = new THREE.Vector3(), _k1 = new THREE.Vector3(), _k2 = new THREE.Vector3(), _k3 = new THREE.Vector3(), _k4 = new THREE.Vector3();
    const lineOf = (m) => {
      let L = lineKept.get(m);
      if (!L) { path.posAtDist(m, _k0); path.posAtDist(m + AHEAD, _k1).sub(_k0).normalize(); path.tangentAtDist(m, _k2); path.tangentAtDist(m + AHEAD, _k3); path.posAtDist(m + AHEAD_S, _k4).sub(_k0).normalize(); L = Float64Array.of(_k0.x, _k0.y, _k0.z, _k1.x, _k1.y, _k1.z, _k2.x, _k2.y, _k2.z, _k3.x, _k3.y, _k3.z, _k4.x, _k4.y, _k4.z); lineKept.set(m, L); }
      return L;
    };
    // (the largest weight, up to `kind`, at which a look at `at` stays within GAZE_MAX of the heading from mA to mB:
    //  the look is the way to the point AHEAD on the line, turned toward the thing by the weight)
    const wOf = (at, mA, mB, kind) => {
      const C = Math.cos(GAZE_MAX * Math.PI / 180); let w = kind;
      for (let m = Math.ceil(mA / CAP_STEP) * CAP_STEP; m <= mB; m += CAP_STEP) {
        const L = lineOf(m); _la.set(L[0], L[1], L[2]); _lb.set(L[3], L[4], L[5]); _ld.set(L[6], L[7], L[8]);
        _lc.copy(typeof at === 'function' ? at(0, m / LEN) : at).sub(_la).normalize();
        const off = (x) => _ld.x * (_lb.x * (1 - x) + _lc.x * x) + _ld.y * (_lb.y * (1 - x) + _lc.y * x) + _ld.z * (_lb.z * (1 - x) + _lc.z * x) - C * Math.hypot(_lb.x * (1 - x) + _lc.x * x, _lb.y * (1 - x) + _lc.y * x, _lb.z * (1 - x) + _lc.z * x);
        if (off(w) >= 0) continue;
        let lo = 0, hi = w; for (let k = 0; k < 12; k++) { const mid = (lo + hi) / 2; if (off(mid) >= 0) lo = mid; else hi = mid; }
        w = lo;
      }
      return w;
    };
    // (the metres flown in FADE_S from a place, onward (dir 1) or before it (dir -1))
    const flownIn = (m, dir) => { let s = 0, x = m; while (s < FADE_S && x >= 0 && x <= LEN) { s += CAP_STEP / speedAt(x); x += dir * CAP_STEP; } return Math.abs(x - m); };
    // (the same before a place by the speed AS FLOWN there: the film's first seconds are flown faster than the pace,
    //  the speed still coming down from the entry's. vFlown: the fastest of the three entries at every CAP_STEP
    //  metres, written by fly below; until the film has been flown once, the pace's own speed.)
    const vFlown = new Float32Array(NCAP);
    const flownBefore = (m) => { let s = 0, x = m; while (s < FADE_S && x >= 0) { s += CAP_STEP / Math.max(speedAt(x), vFlown[Math.min(NCAP - 1, Math.floor(x / CAP_STEP))]); x -= CAP_STEP; } return m - x; };
    // (the city's look: see THE PULLS)
    const doorRun = gazeRun(gazeDoor, S.turn, S.door, PASS_OFF), mDoor = doorRun ? doorRun.a : S.turn, gazeWest = new THREE.Vector3(CX + sunXZ.x * WEST_FAR, HILL_Y, CZ + sunXZ.y * WEST_FAR);
    const mLast = roundAt(ROUND_LAST), chain = (m, v, steps) => { for (const s of steps) v = lerp(v, s[2], dawn(s[0], s[1], m)); return v; };
    const C_MAX = Math.cos(GAZE_MAX * Math.PI / 180), FAR_LOOK = 60, _ce = new THREE.Vector3(), _ca = new THREE.Vector3(), _ch = new THREE.Vector3(), _ct = new THREE.Vector3(), _cd = new THREE.Vector3(), _cx = new THREE.Vector3(), cityPoint = new THREE.Vector3();
    const cityRamps = () => [[S.lawn, S.join], [mLast, S.out], [S.turn - rO, S.turn + rO], [mDoor, mDoor + 2 * rT], [S.door - rD, S.door + rD]];
    const cityAt = (time, u) => {
      const m = clamp(u, 0, 1) * LEN;
      path.posAtDist(m, _ce); path.posAtDist(Math.min(LEN, m + AHEAD), _ca).sub(_ce); path.tangentAtDist(m, _ch);
      if (_ca.lengthSq() < 1) _ca.copy(_ch); _ca.normalize();
      const sTree = chain(m, W_AHEAD, [[S.lawn, S.join, W_TREE], [mLast, S.out, 0]]);
      const sWest = chain(m, 0, [[mLast, S.out, W_WEST], [S.turn - rO, S.turn + rO, 0]]), sHall = chain(m, 0, [[mDoor, mDoor + 2 * rT, W_ROUND]]);
      _cd.copy(_ca).multiplyScalar(1 - sTree - sWest - sHall);
      if (sTree > 0) _cd.addScaledVector(_ct.set(CX, lerp(axisMid, _ce.y + GAZE_UP, dawn(S.lawn, S.join, m)), CZ).sub(_ce).normalize(), sTree);
      if (sWest > 0) _cd.addScaledVector(_ct.copy(gazeWest).sub(_ce).normalize(), sWest);
      if (sHall > 0) _cd.addScaledVector(_ct.copy(gazeDoor).lerp(portalAt, smoothstep(S.door - rD, S.door + rD, m)).sub(_ce).normalize(), sHall);
      _cd.normalize();
      // (held within GAZE_MAX of the heading)
      if (_cd.dot(_ch) < C_MAX) { let lo = 0, hi = 1; for (let k = 0; k < 12; k++) { const x = (lo + hi) / 2; if (_cx.copy(_ca).lerp(_cd, x).normalize().dot(_ch) >= C_MAX) lo = x; else hi = x; } _cd.copy(_ca).lerp(_cd, lo).normalize(); }
      return cityPoint.copy(_ce).addScaledVector(_cd, FAR_LOOK);
    };
    const layPulls = () => {
      pois.length = 0;
      rT = flownIn(mDoor, 1) / 2; rO = (flownIn(S.turn, -1) + flownIn(S.turn, 1)) / 2; rD = (flownIn(S.door, -1) + flownIn(S.door, 1)) / 2;
      // (one length for the wood's first turn and the three hand-overs from the wood's edge to the lawn: the longest
      //  any of them needs, and no more than half of the wood's stretch or of the ride's, or the whole of the crown's
      //  from the last fall on: the crown's look comes in before the fall, across the stretch where the wood's goes out)
      const a = S.fallN, r = Math.min(Math.max(flownIn(0, 1), flownIn(a, -1), flownIn(mC, -1), flownIn(mF1, -1)), a / 2, mC - a, (mF1 - mC) / 2);
      rW = Math.max(flownBefore(mPass), mPass - S.bole);
      pois.push({ at: woodAt, from: 0, to: a / LEN, weight: W_AHEAD, fade: r / a });
      pois.push({ at: gazeCrown, from: (a - r) / LEN, to: mC / LEN, weight: wOf(gazeCrown, a, mC - r, W_ROUND), fade: r / (mC - a + r) });
      pois.push({ at: gazeHero, from: (mC - r) / LEN, to: mF1 / LEN, weight: W_AHEAD, fade: r / (mF1 - mC + r) });
      pois.push({ at: cityAt, from: (mF1 - r) / LEN, to: (LEN + 2 * r) / LEN, weight: 1, fade: r / (LEN + 3 * r - mF1) });
    };
    await ctx.yield();
    layPulls();
    // THE PACE NEVER OUTRUNS THE LOOK. The look at a place is worked here as the engine works it: lookAt is a copy of
    // the engine's own pose (src/core/engine.js, _pose: the way to the point AHEAD on the line, turned toward each
    // pull in turn by its weight, the pulls let go over the first 4 hundredths of a route and from 93 to 98.5
    // hundredths by the engine's own guard, the lean into a bend), once for the camera that sweeps and once for the
    // viewer's STEADY camera (the engine's other way of looking: a point AHEAD_S on, the climb flattened, the pulls
    // at 0.35, no lean). Each turns by so many degrees in a metre (lookTurn, steadyTurn, at every CAP_STEP metres).
    // The film is then flown here as the engine flies it (its speed nears the pace at EASE a second; its camera
    // nears the look at CAM_EASE a second, the steady one at CALM_EASE), from each of three entry speeds (the mean,
    // as a first world begins; this world's own first pace; V_IN, the fastest the engine can bring a visitor in at),
    // which gives what each camera turns by in a second at every place. OMEGA is the most either may: the crew's
    // 30 less the degree the camera's own sway adds. A mark whose reach holds a faster turn has its pace cut in that
    // proportion; its reach is a mark either way (the pace runs straight between marks) and, before a corner, the
    // metres flown in the time the speed takes to come down (1 / EASE s). A cap is let up again only where the turn
    // has fallen a twentieth under OMEGA, and then to just under it (the reach moves with the speed, so a cap let up
    // on less would be cut again on the next pass, for ever); a let-up never brings a cap down (a mark held by the
    // ride's bound or a turn's is flown under its cap, and says nothing of where the cap lies).
    // A ONE-WAY TURN OF THE LOOK LASTS TURN_S OR MORE. As the film is flown here each camera's look (the pose's own
    // direction) and each camera's own direction (which nears its look as
    // the engine's camera does) are followed frame by frame: a SPELL is a stretch in which one of the four
    // turns faster than TURN_RATE degrees a second and its turning axis keeps its side; a spell whose two ends
    // lie TURN_NET degrees or more apart and which lasts under TURN_S has the pace of the marks in its reach cut in
    // the proportion of its seconds to TURN_S (a quarter at most in one pass). These cuts are kept in turnTab and
    // are never let up again (a turn flown slower may break in two, and a bound let up would be cut again for
    // ever); they begin once the look's caps have settled (pass TURN_FROM), and the passes go on until no spell is
    // short. (TURN_S IS A RULE OF FLYING: the crew's second and a half for a turn of ten degrees, with two margins
    // on it: a tenth over, because a turn that just holds on the flights flown here comes out a little shorter
    // on a flight entered at another speed or clock; and a twentieth more for the 5 m steps the look is kept at
    // here. TURN_NET: the ten degrees that make a turn, less the
    // degree the sweeping camera's own sway can add in that time at some clock. TURN_RATE: under it the eye does not read a turn.
    // SWAY_RATE: the engine's sway turns the sweeping camera by up to half a degree a second of its own, by the
    // clock, which no world knows, and through one turn it runs one way: with the turn, the spell is read from a
    // slower turning on and is the longer; against it, from a faster one, and a turn that dips toward TURN_RATE
    // in its middle is then two spells, the second of them short (one visit in a hundred has such a turn: a
    // spell of 1.3 s at half the entry clocks). So every spell is followed three times: at TURN_RATE, at
    // SWAY_RATE under it and at SWAY_RATE over it (TURN_RATES), and a spell short by any of the three is cut. At
    // the highest the sway that shortens the spell also takes its degree from the turn, so there the turn is one
    // of ten degrees (TURN_NETS).
    // The spells are followed on the flight that begins at the mean speed, as a first world begins, and on the one
    // that begins at this world's own first pace; not on the fastest entry, whose first seconds are flown at the
    // speed the visitor brings, which no pace of this world can slow.)
    // The pulls' fades are laid from the speeds
    // and the caps from the pulls, over and over, until no cap moves by more than a hundredth (PASSES at most, of
    // which the last four only cut, so the film ends on a state that was flown); pace.off says how far over OMEGA
    // the film as last flown still was, in shares of it (0: settled).
    const CAM_EASE = 2.6, CALM_EASE = 1.1, CALM_PULL = 0.35, CALM_FLAT = 0.55, PASSES = 24, V_IN = V_IN_K * V_MEAN;
    const TURN_S = 1.5 * 1.1 * 1.05, TURN_NET = 9, TURN_RATE = 4, SWAY_RATE = 0.6, TURN_RATES = [TURN_RATE - SWAY_RATE, TURN_RATE, TURN_RATE + SWAY_RATE], TURN_NETS = [TURN_NET, TURN_NET, TURN_NET + 1], TURN_FROM = 4, TURN_PASSES = 40;
    const _lq = new THREE.Matrix4(), _lo = new THREE.Vector3(), _lu = new THREE.Vector3(), _lr = new THREE.Vector3(), _lt = new THREE.Vector3(), _ls = new THREE.Vector3();
    const lookAt = (m, q, calm) => {
      // (gd: the ENGINE's guard on the pulls, not a rule of this world: a copy of src/core/engine.js 476, in _pose)
      const u = clamp(m / LEN, 0, 1), gd = smoothstep(0, 0.04, u) * (1 - smoothstep(0.93, 0.985, u)), d = _ld, L = lineOf(m);
      _la.set(L[0], L[1], L[2]);
      if (calm) { d.set(L[12], L[13] * CALM_FLAT, L[14]).normalize(); } else d.set(L[3], L[4], L[5]);
      for (const p of pois) {
        const w = bell(u, p.from, p.to, p.fade) * p.weight * gd * (calm ? CALM_PULL : 1);
        if (w <= 0.001) continue;
        _lc.copy(typeof p.at === 'function' ? p.at(0, u) : p.at).sub(_la).normalize();
        d.multiplyScalar(1 - w).addScaledVector(_lc, w).normalize();
      }
      // (the lean into a bend, as the engine leans: by the turn of the line over the look ahead; the steady camera does not lean)
      _lt.set(L[6], L[7], L[8]); _ls.set(L[9], L[10], L[11]);
      const lean = calm ? 0 : clamp(-(_lt.z * _ls.x - _lt.x * _ls.z) * 0.55, -0.28, 0.28) * LEAN;
      _lr.crossVectors(d, _lu.set(0, 1, 0)).normalize(); _lu.addScaledVector(_lr, lean).normalize();
      return q.setFromRotationMatrix(_lq.lookAt(_lo.set(0, 0, 0), d, _lu));
    };
    {
      const lookTurn = new Float32Array(NCAP), steadyTurn = new Float32Array(NCAP), camTurn = new Float32Array(NCAP), calmTurn = new Float32Array(NCAP), _l0 = new THREE.Quaternion(), _l1 = new THREE.Quaternion();
      // (the look is worked again only when a pull or a turn's length has moved since the last pass: it depends on nothing else)
      const laid = () => [rW, rT, rD, rO, ...pois.flatMap((p) => [p.from, p.to, p.weight, p.fade])].join(' ');
      // (dirs: the look's own direction at every CAP_STEP metres, kept for the turns' spells)
      const lookDir = new Float32Array((NCAP + 1) * 3), steadyDir = new Float32Array((NCAP + 1) * 3), _lf = new THREE.Vector3();
      const turns = (tab, calm) => {
        const dirs = calm ? steadyDir : lookDir, keep = (i, q) => { _lf.set(0, 0, -1).applyQuaternion(q); dirs[i * 3] = _lf.x; dirs[i * 3 + 1] = _lf.y; dirs[i * 3 + 2] = _lf.z; };
        lookAt(0, _l0, calm); keep(0, _l0);
        for (let i = 0; i < NCAP; i++) { lookAt(Math.min(LEN, (i + 1) * CAP_STEP), _l1, calm); keep(i + 1, _l1); tab[i] = _l0.angleTo(_l1) * 180 / Math.PI / CAP_STEP; _l0.copy(_l1); }
      };
      // (the spells of one look along one flight: st = [the last direction (3), the last axis (3), the spell's
      //  first direction (3), its first second, its first metre, on]; a short spell is written to `short`)
      const short = [], RAD = 180 / Math.PI;
      const dirAt = (dirs, d, o) => {
        const x = Math.min(NCAP - 1e-6, d / CAP_STEP), i = Math.floor(x), g = x - i;
        const ax = dirs[i * 3] + (dirs[i * 3 + 3] - dirs[i * 3]) * g, ay = dirs[i * 3 + 1] + (dirs[i * 3 + 4] - dirs[i * 3 + 1]) * g, az = dirs[i * 3 + 2] + (dirs[i * 3 + 5] - dirs[i * 3 + 2]) * g, l = Math.hypot(ax, ay, az) || 1;
        o[0] = ax / l; o[1] = ay / l; o[2] = az / l; return o;
      };
      // (a camera's own direction: it nears its look as the engine's camera does, by the share k in a frame)
      const near = (e, o, k) => { const ax = e[0] + (o[0] - e[0]) * k, ay = e[1] + (o[1] - e[1]) * k, az = e[2] + (o[2] - e[2]) * k, l = Math.hypot(ax, ay, az) || 1; e[0] = ax / l; e[1] = ay / l; e[2] = az / l; return e; };
      const spell = (st, o, d, t, rate, least) => {
        const ax = o[0], ay = o[1], az = o[2];
        if (st[13] < 0) { st[0] = ax; st[1] = ay; st[2] = az; st[12] = d; st[13] = 0; return; }
        const cx = st[1] * az - st[2] * ay, cy = st[2] * ax - st[0] * az, cz = st[0] * ay - st[1] * ax, sn = Math.hypot(cx, cy, cz), on = Math.asin(Math.min(1, sn)) * RAD * 60 > rate;
        const same = cx * st[3] + cy * st[4] + cz * st[5] > 0;
        if (st[13] === 1 && !(on && same)) {
          // (the spell has ended at the last frame: st[0..2] is its last direction)
          const net = Math.acos(clamp(st[0] * st[6] + st[1] * st[7] + st[2] * st[8], -1, 1)) * RAD, secs = st[11] - st[9];
          if (net >= least && secs < TURN_S) short.push([st[10], st[12], secs]);
          st[13] = 0;
        }
        if (on && st[13] === 0) { st[6] = st[0]; st[7] = st[1]; st[8] = st[2]; st[9] = t - 1 / 60; st[10] = st[12]; st[13] = 1; }
        if (on) st[11] = t;
        st[0] = ax; st[1] = ay; st[2] = az; st[3] = cx; st[4] = cy; st[5] = cz; st[12] = d;
      };
      const DT = 1 / 60, kv = 1 - Math.exp(-DT * EASE), kc = 1 - Math.exp(-DT * CAM_EASE), ks = 1 - Math.exp(-DT * CALM_EASE);
      // (one flight from an entry speed: both cameras eased along it; `secs` cuts a flight short once its entry no longer tells;
      //  a hand-back after every FLY_REST frames of it: three seconds of film)
      const FLY_REST = 180;
      const fly = async (v0, secs, watch) => {
        let d = 0, v = v0, e = 0, es = 0; const sp = TURN_RATES.map(() => [0, 1, 2, 3].map(() => new Float64Array(14).fill(-1))), la = [0, 0, 0], lb = [0, 0, 0], ca = dirAt(lookDir, 0, [0, 0, 0]), cb = dirAt(steadyDir, 0, [0, 0, 0]);
        for (let n = 0, N = secs * 60; n < N && d < LEN; n++) {
          if (n % FLY_REST === FLY_REST - 1) await ctx.yield();
          v += (V_MEAN * pace(d / LEN) - v) * kv; d += v * DT;
          const i = Math.min(NCAP - 1, Math.floor(d / CAP_STEP));
          e += (lookTurn[i] * v - e) * kc; es += (steadyTurn[i] * v - es) * ks;
          if (e > camTurn[i]) camTurn[i] = e; if (es > calmTurn[i]) calmTurn[i] = es; if (v > vFlown[i]) vFlown[i] = v;
          if (watch) {
            const t = (n + 1) * DT; dirAt(lookDir, d, la); dirAt(steadyDir, d, lb); near(ca, la, kc); near(cb, lb, ks);
            for (let r = 0; r < TURN_RATES.length; r++) { const q = sp[r], rate = TURN_RATES[r], least = TURN_NETS[r]; spell(q[0], la, d, t, rate, least); spell(q[1], lb, d, t, rate, least); spell(q[2], ca, d, t, rate, least); spell(q[3], cb, d, t, rate, least); }
          }
        }
      };
      // (an entry speed is forgotten after six of the easing's time constants: 1 part in 400 left)
      const flyAll = async () => { camTurn.fill(0); calmTurn.fill(0); vFlown.fill(0); short.length = 0; await fly(V_MEAN, 150, true); await ctx.yield(); await fly(V_MEAN * pace(0), 6 / EASE, true); await ctx.yield(); await fly(V_IN, 6 / EASE, false); };
      // (the turns' bound: every mark within a mark of a short spell, or before it by the metres the speed takes to
      //  come down, is cut in the spell's proportion; says whether any was)
      const cutTurns = () => {
        let any = false;
        for (const [m0, m1, secs] of short) for (let k = 0; k <= MARKS; k++) {
          const m = k * MARK, lead = speedAt(m) / EASE; if (m < m0 - MARK - lead || m > m1 + MARK) continue;
          const c = markTab[k] * clamp(secs / TURN_S, 0.75, 0.98); if (c < turnTab[k]) { turnTab[k] = Math.max(c, PACE_LOW); any = true; }
        }
        return any;
      };
      // (four passes at least: the first lays the pulls on the base pace alone, the next three on caps that moved)
      let was = '', moved = 1, it = 0;
      for (; it < PASSES && (moved > 0.01 || it < 4); it++) {
        // (a hand-back before every pass and again between working the look and flying it)
        await ctx.yield();
        layPulls();
        const now = laid();
        if (now !== was) { was = now; await ctx.yield(); turns(lookTurn, false); await ctx.yield(); turns(steadyTurn, true); }
        await ctx.yield();
        await flyAll();
        // (flying the film is a step's work of its own: a hand-back before the caps are worked from it)
        await ctx.yield();
        // (a cap is let up by a quarter at most in one pass (up: its pace over 0.8), so that no mark overshoots)
        const cutOnly = it >= PASSES - 4, up = cutOnly ? 1 : 0.8, old = Float32Array.from(markTab);
        for (let k = 0; k <= MARKS; k++) {
          const m = k * MARK, lead = speedAt(m) / EASE;
          let top = 0; for (let i = Math.max(0, Math.floor((m - MARK + lead) / CAP_STEP)); i <= Math.min(NCAP - 1, Math.ceil((m + MARK + lead) / CAP_STEP)); i++) top = Math.max(top, camTurn[i], calmTurn[i]);
          const c = markTab[k] / clamp(top / OMEGA, up, 1.25), free = paceK * baseTab[k];
          if (top > OMEGA) capMark[k] = c; else if (!cutOnly && top < 0.95 * OMEGA) { const r = markTab[k] / clamp(top / (0.98 * OMEGA), up, 1); capMark[k] = Math.max(capMark[k], r >= Math.min(free, TOP * paceOver) ? 9 : r); }
        }
        if (it >= TURN_FROM) cutTurns();
        setK();
        moved = 0; for (let k = 0; k <= MARKS; k++) moved = Math.max(moved, Math.abs(markTab[k] - old[k]) / old[k]);
      }
      // (the pulls stay as the last pass laid and flew them; the marks, cut once since, are flown a last time for the measure)
      // THE CAPS ARE CUT FROM BOTH CAMERAS' TURNS (top, above, is the most of camTurn and calmTurn in a mark's reach):
      // neither the sweeping camera nor the steady one turns faster than OMEGA anywhere, the last turn included.
      await ctx.yield();
      await flyAll();
      await ctx.yield();
      // (the turns' bound alone from here: the film is flown and cut until no spell is short; a cut only slows, so
      //  the look's caps hold through it)
      let turnIt = 0;
      for (; turnIt < TURN_PASSES && short.length; turnIt++) { if (!cutTurns()) break; setK(); await ctx.yield(); await flyAll(); }
      pace.turnPasses = turnIt; pace.short = short.length; pace.film = DUR * filmK;
      let worst = 0, calm = 0; for (let i = 0; i < NCAP; i++) { worst = Math.max(worst, camTurn[i]); calm = Math.max(calm, calmTurn[i]); }
      pace.off = Math.max(0, Math.max(worst, calm) / OMEGA - 1); pace.sweep = worst; pace.calm = calm; pace.passes = it; pace.over = paceOver; pace.K = paceK; pace.ramps = cityRamps(); pace.ref = REF;
    }
    // THE RING'S VIEW IS WHOLE BEFORE THE RING FIRST ENTERS THE PICTURE. The engine opens the view in the ring by the
    // metres left to fly: between the reveal distance and REVEAL_WHOLE of it, eased at REVEAL_EASE a second
    // (engine.js 655 to 665). So the reveal distance is worked out here from the line and the camera's breadth:
    // the film is flown from where the round is left, as the engine flies it (the speed nearing the pace, each
    // camera eased to its look: the sweeping one and the steady one), and mEnter is the first place at which any
    // part of the ring comes within the picture of either (HALF_PIC: half the diagonal of the broadest picture,
    // PIC_WIDE, at this world's field of view, and PIC_PLAY for the sway and the lean). The opening is whole
    // REVEAL_SETTLE of the engine's easing times before that place at the speed flown there, and begins that much
    // earlier: while the ring is behind us, on the way out to the west. No one sees it open.
    const REVEAL_WHOLE = 0.6, REVEAL_EASE = 2.2, REVEAL_SETTLE = 2, PIC_WIDE = 21 / 9, PIC_PLAY = 2, CAM_FOV = 62;
    const HALF_PIC = Math.atan(Math.tan(CAM_FOV / 2 * Math.PI / 180) * Math.hypot(1, PIC_WIDE)) * 180 / Math.PI + PIC_PLAY;
    const _rq = new THREE.Quaternion(), _rf = new THREE.Vector3(), _rd = new THREE.Vector3();
    const _rc = new THREE.Quaternion();
    const ringIn = (m, q) => {
      _rf.set(0, 0, -1).applyQuaternion(q); const L = lineOf(m); _rd.set(portalAt.x - L[0], portalAt.y - L[1], portalAt.z - L[2]);
      const far = _rd.length(); return far < PORTAL_R || (_rf.angleTo(_rd) - Math.asin(PORTAL_R / far)) * 180 / Math.PI < HALF_PIC;
    };
    let mEnter = LEN;
    for (const calm of [false, true]) {
      const DT = 1 / 60, kv = 1 - Math.exp(-DT * EASE), kc = 1 - Math.exp(-DT * (calm ? CALM_EASE : CAM_EASE)); let d = S.out, v = speedAt(d);
      lookAt(d, _rc, calm);
      await ctx.yield();
      for (let n = 1; d < mEnter; n++) { v += (speedAt(d) - v) * kv; d += v * DT; _rc.slerp(lookAt(Math.min(d, LEN), _rq, calm), kc); if (ringIn(Math.min(d, LEN), _rc)) mEnter = d; if (n % 90 === 0) await ctx.yield(); }
    }
    const REVEAL_AT = Math.round((LEN - mEnter + REVEAL_SETTLE * speedAt(mEnter) / REVEAL_EASE) / REVEAL_WHOLE);
    S.enter = mEnter; S.open = LEN - REVEAL_AT;
    return {
      scene, path, duration: DUR * filmK,
      camera: { fov: CAM_FOV, near: 0.3, far: 4200, lookAhead: AHEAD, sway: 0.8, bank: LEAN },
      pace, pois,
      portal: { shape: 'circle', radius: PORTAL_R, color: '#ffd9a0', glow: 1.1, revealDistance: REVEAL_AT },
      post: { exposure: 1.0, bloom: { strength: 0.5, radius: 0.7, threshold: 0.9 }, grade: { saturation: 1.08, contrast: 1.04, tint: '#fff7ec', shadowTint: '#17122c', vignette: 0.3, grain: 0.02, aberration: 0 } },
      update(dt, time, camera, u) {
        tU.value = time; K.U.uTime.value = time;
        sky.update(dt, time, camera); rig.update(dt, time, camera); ridges.update(dt, time, camera);
        camera.getWorldPosition(_cp);
        // (a saving, not a look: a set's whole form is handed to the drawing only while some of it can lie within its far
        // limit of the eye, its plain form only while some of it can lie beyond its near limit; the points themselves
        // are kept or dropped by their own distance in the shader)
        for (const w of sets) {
          const dc = _cp.distanceTo(w.c); let wv = dc - w.r < w.r1, pv = dc + w.r > w.r0;
          if (wv && w.wb) wv = nearBox(w.wb, _cp, w.r1);
          if (pv && w.pb) pv = farBox(w.pb, _cp, w.r0);
          w.whole.visible = wv; w.plain.visible = pv;
        }
        rill.update(dt, time, camera); moveSwan(time);
        for (const g of greens) g.update(dt, time, camera);
        set.update(dt, time, camera); fauna.update(dt, time, camera);
        leafFall.setOpacity(0.72 + 0.28 * Math.sin(time * 0.31) * Math.sin(time * 0.173 + 1.3));
      },
      // (every texture this world makes itself is freed here: the maps of shade, of the roof and of the lamps' light)
      dispose() { sky.dispose && sky.dispose(); for (const t of [K.U.uShade.value, K.U.uRoof.value, groundMat.uniforms.uLampMap.value]) if (t && t.dispose) t.dispose(); },
    };
  },
};
