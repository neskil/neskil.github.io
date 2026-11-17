// THE FIRE COMES ROUND. From The Player of Games (Iain M. Banks). THE WORLD, STAGE D: a wild forest of giants on a
// river, lit by its own lanterns; the fire doubled in drowned shallows; animals going away from it.
//
// Deep dusk on the belt world. A wild forest of dark giant fire-plants covers a plain, riper and taller toward a
// wall of flame that stands across the whole horizon under one wall of smoke (the front: the hero part, taken over
// whole, src/parts/the-fire-comes-round.js, with its gifts: the forest taken, the grounds cleared, its mirror, its
// flame form, its wind). A dark slow river winds through the forest toward the fire and spreads before it into
// drowned shallows; the water runs on by a channel into the castle's moat. THE FLIGHT IS OVER WATER from the place
// where the lens comes down to the ring: we come in over the river among the heads of the giants, sink to ten
// metres over the water within the first fifth of the way, go up the river round its bend between banks of great
// trunks (files of runners come down the bars and through the shallows beside us, away from the fire; shapes swim
// with their sails up), come out over the drowned shallows before the nearest lobe of the flame and fly ALONG it, 135
// to 170 m from the line with the gaze toward it (the wall of flame doubled in broken water; drowned dead trunks
// standing in it; the fuse belt on the far bank and on the islets, plants catching, standing as torches, standing
// black), turn from it over the channel, and fly in over the moat to a pale wet castle and the ring of light in its
// dark wet gate.
// STAGE D, in short (each by place and the world clock; the night stays night and the fire the brightest thing):
//   LIGHT THAT BELONGS TO THE PLACE. Ripeness falls from 1 at 40 m from the line to 0 at 1,700 m, and of the plants
//   at a place a share (a quarter far off, all by the line; every giant) carries lit pods: amber lanterns, hundreds of points,
//   denser toward the fire. Their light lies on the plant, on the ground and the water round its foot (the pod map:
//   one texture the forest writes at build) and in the river as long amber paths. The fire's light reaches the
//   whole forest by a far grade (wFar: what a dark thing makes of a weak light), with the lit smoke overhead as a
//   broad soft light on the fire's side (wLitF); the night's side of everything is deep blue. Mist stands in the
//   river's bends and glades, lit from within by the pods and from behind by the fire (wAir).
//   WATER THAT IS WATER. Ripples at every distance (a field of the place whose length follows a pixel's footprint,
//   steeper along the look than across it: optics), so that every mirrored thing lies in long trembling strokes;
//   the sky's stars and blue between the fire's road and the banks' dark; husks, plume-down and wakes drift on it.
//   The castle is doubled from its part's OUTLINE (twelve plain bodies), broken into strokes, at 0.5 of the given
//   colours; the ring's light lies before the gate as a long path of glints.
//   ANIMALS WHERE THE LIGHT IS (the life part): files down the river beside the line, files across the lit shallows
//   under the route where the plan finds a lawful way, a file wading the lagoon's shore; great fliers passing near;
//   swimmers in rafts. All by the seed's deal.
//   THE BOOK'S RULES AS THE GUARD READ THEM (the forest part's head says how): no plant has a tree of Earth's
//   outline; nothing catches or glows within 60 m of the moat (tested in build: deal.clear.moat); the shallows are
//   [STAGE F2: THE FRONT'S SPARKS AND BRANDS are kept out of the air over the moat and 60 m about it BY PLACE, AT BUILD
//   (hero.keepBrands with the moat's outer edge; the lens's place is not asked); tested in build: deal.clear.air]
//   DROWNED ground, never burnt (the front never advances: nothing on our side of it says that fire passed).
// This file is the plan with its two fits, the land with its one water, the sky, the route, the light and the
// calls. The forest and the animals are parts of this builder's (src/parts/the-fire-comes-round-{forest,life}.js);
// the castle is another builder's part (src/parts/the-fire-comes-round-castle.js), called here and never edited.
//
// COMFORT (the owner's term; the part's proved figures lead and the world adds nothing quicker):
//   - no flicker of the whole picture. The broad lights (the ground's orange wash, the forest's fire side, the
//     smoke's glow, the glow of the low air, the castle's fire side and its lit steam, the water's doubled fire)
//     all breathe by ONE law, the part's own (fcrFlick): at most 17 per cent of their value, at no more than 0.30
//     cycles a second. Nothing of the world breathes by a second law of its own that is faster or deeper;
//   - a surge of the part's comes up over 1.0 to 1.4 s, stands 3 to 4 s and sinks over 4 to 6 s (the part's law);
//     where the visit deals dry lightning it is the part's (1 to 3 flashes 0.34 s apart, each up over 0.1 s and
//     down over 0.3 s, then none for 9 to 16 s, blue-violet, inside a tower of smoke): the world adds none;
//   - A TORCH NEVER GOES TO WHITE OR PALE YELLOW. A plant of the fuse belt catches from its foot to its crown over
//     1.2 to 2.2 s (its seams brighten to orange, each pod goes in its turn as a burst of deep orange sparks and a
//     puff of dark smoke, 3.2 s), stands as a torch (the part's own flame form, one and a third times the plant,
//     its black trunk read inside it) for 7 to 11 s (13 to 18 s in the set piece's belt beside the run), sinks over
//     4 s, stands black for 12 to 16 s (8 to 12 s there) and grows back; a clump's period is 90 to 130 s, 50 to
//     64 s in the set piece's belt (or whole periods of a burst of the part's that leads it); plants of one clump
//     catch one after another at 9 m a second from its heart, so several stages stand in any picture. THE
//     BRIGHTEST VALUE OF A TORCH is linear (1.80, 0.72, 0.09), yellow-orange, in small hearts low in its flame; of
//     a pod's burst (1.40, 0.32, 0.025), deep orange; of a spot fire on an islet the torch's;
//   - what is quicker is small: a torch's licks, sparks, glints on water, a star's twinkle, the spray a wading
//     runner throws (one low card a runner, never over 0.30: 0.12 until stage D) and a swimmer's wake (the same
//     ceiling), spray at a sheet's foot;
//   - the water: ripples at three scales drift at 0.03 to 0.2 m a second; nothing of it flashes;
//   - the castle's waters and lights are its own part's (see its head); the castle itself never changes;
//   - the brightest value drawn is the part's flame heart, linear (2.40, 1.45, 0.26), small, in the wall itself;
//     the seams of a pod 0.68 at most of their amber (1, 0.43, 0.07) (0.62 until stage D), calm, breathing by 15
//     per cent over 5 to 9 s as before, and the skin between the seams 0.075 of that amber at most; what the pods
//     lay on things is at most 0.35 of it (in the water's mirror; less on plant and ground): calmer than the fire; the stars are fewer, smaller and
//     of more sizes than they were (the brightest 0.95, twinkling by a tenth); the castle's doubled image is half
//     of its part's night colour and four tenths of its fire colour, in broken strokes; the ring's glints on the water are at most 0.43 of its teal; the ring's
//     teal is the castle part's and no other thing of the world is teal (the dusk's remnant is blue). Nothing of
//     the world reaches white. Exposure 1, fixed;
//   - the flight: one steady way, the river's broad bend (900 m) running into the first turn (260 m), one more
//     turn (300 m); bank 2.6 degrees at the most; no sway; the steepest slope 9 degrees.
// The constant COMFORT below holds the world's own depths and rates.
// STAGE E (the first third; the book guard's addendum): THE RIVER is a calm dark face: its fine ripples are long
// lines across the stream (the round-celled field that broke its mirror into blotches is all but stilled there),
// the smoke's image is thinner in it, the fire's road a little stronger; where no bar shows along a file's line the
// water is whole (a thin line of ground lay there). THE BANKS are wet silt with clods, damp patches, strand lines
// and split plates, their edge to the water soft and wandering; no ground is pure black. Far off on the night's
// side the water is lost in haze. No fleck of the air within 60 m of the moat's edge. The forest's order along the
// river (open reach, narrows with a gate of two leaning giants, glade), the feet whole above their ground, what
// never catches (by the moat, by the last channel, by a file) and the animals' changes are in their parts' heads.
//
// BY PLACE AND THE WORLD CLOCK. The state of every plant, animal, water and lamp is its place and the world
// clock (the time handed to update). The eye enters optics only (reflection, shine, bows, rims, haze by distance,
// a pixel's footprint). The flight keys two things, both the lens's own: its pace and its gaze, each given in
// metres of way from places of the plan table below (never as values of the route's parameter).
// STAGE F (the last before the bar). LAW: no smoothstep in a shader has its first edge over its second (each such is
// written 1 - smoothstep(lo, hi, x)); no pow, root or division takes a base or a divisor that can be nought or
// under it. THE RIVER (the first third) is a BLUE DUSK place: its water shows the dusk and the lanterns, the fire's
// road on it is narrow (the broad road 0.14 of the fire's far grade for 0.42, the smoke's image 0.38 of the part's
// mirror for 0.65): the tan gloss is gone and the fire is the goal at the river's end. THE DROWNED SHALLOWS before
// the fire take the river's cure (long crests for cells: the fire's image lay in square blocks). THE GAZE: the fire
// lets it go 30 m before the last turn's beginning (eased over 170 m) and the castle holds it at weight 0.9 from
// there: the castle stands near the picture's middle from the turn's beginning. No light flickers by a law of its own.
// THE RING (the site's owner's ruling). (1) This world sets NEITHER portal.drawWithin NOR portal.drawIn: the ring
// is whole from the first frame of the flight to the last. (2) What of the ring the world itself draws, each BY
// PLACE and at every metre of the flight: in this file, the path of glints of the ring's colour on the moat's and
// the lagoon's water before the gate (a light of the ring on water: where it lies is the place's own, metres from
// the castle along and across its axis, out to some 500 m; which ripples' facets send it to the eye is the
// mirror's bearing along the eye's ray, and the pixel's footprint sets the ripples' breadth: shading; the air's
// haze by the eye's distance lies over it as over everything); in the castle's part, the ring's image in the
// court's wet floor (the hoop's light and colour only, no picture inside the hoop) and the ring's colour as light
// on wet stone, falling water and steam. (3) NOTHING of these reads the metres still to fly, the way flown, the
// route's parameter or the clock of the flight; the ring's reveal distance (portal.revealDistance, with
// blendDistance) is the engine's own setting for its ring, handed to it below in metres from a place of the plan:
// nothing this world draws reads it.
// STAGE F. WHAT READS THE EYE IN THIS FILE (every term; each is optics only, none places, shows, hides or times
// anything): (1) THE AIR (wAir): the dusk's haze by the length of the eye's ray, the mist along the ray, the
// fire's glow in the air along the ray and toward the fire's bearing, the smoke's veil along the ray (the part's);
// (2) THE WATER'S MIRROR: where the eye's ray meets the water's level (wFace), the mirrored ray (sky, smoke, the
// fire's road, the castle's image, the ring's column and glints, the lanterns' paths), the mirror's share by the
// ray's angle (fresnel), the ripples' slope taken along the look (facets that send a low light to the eye lie
// along it), the wet ground's shine and rim; (3) A PIXEL'S FOOTPRINT (a filter): the breadth of ripples, grain,
// clods, strand lines, stars and every crisp edge is what a pixel can hold (dFdx, fwidth, the ray's length over
// its slope); (4) THE FLECKS OF THE AIR: each a card facing the lens, never smaller than a pixel (its light kept:
// the square of its size over the square drawn), hazed by the ray's length, and faded out between 5 and 1.5 m
// before the lens (the near plane made soft: no fleck is a sheet on the lens); (5) THE SKY: drawn by compass on
// the far plane (the view's turning only), its stars a pixel wide at the least, the fire's glow in the air along
// the ray from the eye's place. (6) THE FLIGHT'S OWN: pace and gaze, keyed in metres of way from the plan's
// places. Nothing else: every state reads place, the seed's deal and the world clock.
// THE IDLE FORKS (streaks, carpet, lanes) AND THE BURNT DRAWS (a fleck refused by the moat still draws its two
// numbers) STAY: taking them out would move the deal of everything after them.
import * as THREE from 'three';
import { makePath, clamp, lerp, smoothstep } from '../kit/core.js';
import { buildHero } from '../parts/the-fire-comes-round.js';
import { buildForest, buildGround } from '../parts/the-fire-comes-round-forest.js';
import { buildLife, layLanes } from '../parts/the-fire-comes-round-life.js';
import { buildCastle, COURT } from '../parts/the-fire-comes-round-castle.js';
const hyp = (a, b) => Math.sqrt(a * a + b * b), hyp3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);   // lengths (plain roots: these are asked very many times in the build)

const HAZE = 0.00018;            // density of the dusk haze (exp2); the same figure is given to the part
const HAZE_FAR = 2.3;            // the world's own bodies (forest, land, animals, castle) stand in this many times that haze: 0.31 of the dusk at 1.5 km, 0.03 at 400 m
const D2R = Math.PI / 180;
export const COMFORT = {
  broadDepth: 0.17, broadRate: 0.30,          // the part's fcrFlick: every broad light of the world uses it and no other
  seamDepth: 0.15, seamPeriod: [5, 9],        // a plant's seams breathe by 15 per cent over 5 to 9 s, each its own phase
  seamMax: 0.68,                              // linear ceiling of a seam's amber (0.62 until stage D; the flame's heart, the part's, is 2.40, 1.45, 0.26)
  podSkin: 0.075, podLightOnThings: 0.35,     // a lit pod's skin between its seams; the most its amber lays on plant, ground or in the water's mirror (of amber 1, 0.43, 0.07)
  torchBrightest: [1.80, 0.72, 0.09], burstBrightest: [1.40, 0.32, 0.025],   // a torch never goes to white or pale yellow (the forest part's FUSE table leads)
  torch: { rise: [1.2, 2.2], stand: [7, 11], standSet: [13, 18], sink: 4, period: [50, 64] },   // a plant of the fuse belt (s)
  burst: 3.2, runnerSpray: 0.30,              // a pod's burst (s); the most a wading runner's spray or a swimmer's wake adds (linear; 0.12 until stage D)
  castleDoubled: 0.5, ringGlint: 0.43,        // the castle's image in the moat, of its part's given colours; the ring's glints on the water, of its teal
  gust: [6, 10],                              // a gust goes through the crowns every 6 to 10 s (it moves plumes, not light)
  // STAGE E (steady lights, none flickers of its own; each rides the part's fcrFlick or the sky's steady light):
  riverRoad: [0.80, 0.14],                    // the fire's road on the calm river: its glitter and its broad road, of the fire's far grade (0.55 and 0.20 on the other waters, as before). STAGE F: the broad road 0.14 for 0.42 (it lay on the river as a flat tan gloss)
  riverSmokeMirror: 0.38,                     // the smoke's image in the river, of the part's mirror (1 on the other waters)
  groundFloor: [0.015, 0.019, 0.032],         // the least any ground gives (linear): the dusk's blue in the deepest shade
  animalRim: [0.40, 0.26, 0.12],              // an animal's rims: the fire's on its side and against the fire (of the fire's far grade), the night's cool one (of the sky's light); 0.30, 0.20, 0.05 until stage E
};

// ---------- THE PLAN TABLE (metres). The plan is one drawing: the river's axis is E 0, heading north (toward the
// fire); the route begins at N 180 (way 0), bears round with the river from N 560 and tightens into its first turn 780 m of way from the entry. The fit sets the drawing down before the
// part's lobe: beside it (the river's offset) and as far south of it as the line asks (the slide). K is the castle
// group's scale on the brief's figures (the castle and its rock are greater).
const K = 1.3;
export const WATER = -4;         // the level of every water of this world (the moat's own): the river runs on into the moat with no step
export const PLAN = {
  K, n0: 180,
  // the lens's heights by place (m): in over the river among the heads of the giants, down to the water within the
  // first fifth, low up the river, a little higher over the drowned shallows and on over the channel and the moat
  y: { entry: 44, ride: 6, flat: 20, moat: -4 + K * 21, ring: -4 + K * 25 },
  level: 30,                     // the entry is level for this long (way)
  rideLevelAt: 380,              // way at which the lens is at ride height
  rideMouth: 470, bend: 380,     // two marks of the way table (plan N)
  // THE FIRST TURN BEGINS BROAD (stage C: the river bends, and the route with it): from the place where the lens is
  // down at the water the route bears round on a radius of 900 m, the river's own bend (26 degrees over 400 m, 11 s),
  // so that the river's far reach lies hidden behind the plants of its inner bank; then the turn tightens to 260 m
  turn0: { R: 900, from: 380 },
  turn1: { R: 260, N: 960, heading: [40, 110], slide: [-400, 100] },      // the first turn's tighter part: where it begins (metres along the route's line from N 0), its exit heading; how far the drawing may slide (the lobe's tip at N 1290 + the slide's metres south)
  run: { len: [160, 480], near: 135, least: 130, far: 170, want: 380 },   // the run along the front: its length, the band it keeps
  turn2: { R: 300, deg: [10, 60] },
  lastLeg: 300, ringToCastle: 66 * K,
  castleFromLine: 280,
  // a lane begins 215 m from the line (150 m before the fuse belt), 285 m where the set piece's deeper belt is; a lane
  // of fliers across the run begins at 222 m and keeps 110 m from the line; a file of runners across the shallows of
  // the run begins as every lane does and keeps 112 m from the line (the water ends 95 m before it)
  cross: { from: 285, from0: 215, fromAir: 222, keepAir: 110, castle: 60, keepRun: 112 },
  // THE RIVER (stage C: the dry bed is a river). Its middle swings from side to side of the route's line and its
  // breadth changes along it (half: its half breadth at its narrowest and broadest; keep: the route's line is never
  // nearer its drawn bank than this; L: the swing's length over 2 pi). chan: the half breadth of the channel that
  // carries the water on from the shallows to the moat, at its two ends.
  river: { half: [29, 46], keep: 21, L: 58, chan: [66, 52] },
  wander: [4.6, 2.9, 1.2],       // the banks' own wander (m): three waves laid over every water's drawn edge (see wander below)
  // THE FILES' LINES down the river: four, on the bars and through the shallows either side of the route's line
  // (the two nearest pass 8 to 15 m from it). A file's place across the river (E) at N is trailE(e0, N)
  trail: { lanes: [-24, -11.5, 11.5, 24], A: 2.4, L: 31, A2: 0.9, L2: 11.3 },
  flat: { toFire: 106, away: 50, stop: 95 },                              // the drowned shallows along the run: their reach either side of the route; they stop this far before the line
  water: { river: WATER, moat: WATER, pool: WATER, bed: WATER },
  // the castle group in its own frame: a along the last leg (0 at the castle's centre), c to the right of it
  rock: { a: [-126 * K, 90 * K], c: [-95 * K, 95 * K], r: 40 * K, top: -4 + K * 16 },
  moat: { a: [-266 * K, 120 * K], c: [-125 * K, 155 * K], r: 60 * K },
  // speeds by place (m/s), read in "way" below
  speed: { high: 56, bed: 36, flat: 42, run: 39, turn: 42, shore: 36, moat: 29, court: 27 },
};

// the files' law (script); the land's shader holds the same expression (TRAIL_GLSL), made from the same figures
export const trailE = (e0, N) => { const T = PLAN.trail; return e0 + T.A * Math.sin(N / T.L + 0.6 + 0.13 * e0) + T.A2 * Math.sin(N / T.L2 + 2.2 + 0.4 * e0); };
const TRAIL_GLSL = (() => { const T = PLAN.trail, f = (v) => v.toFixed(4); return `e0 + ${f(T.A)}*sin(N/${f(T.L)} + .6 + .13*e0) + ${f(T.A2)}*sin(N/${f(T.L2)} + 2.2 + .4*e0)`; })();
// THE BANKS' WANDER and THE ISLETS, one law for the script and the shaders (world x, z in metres).
// wander: metres by which a water's edge stands off its drawn line (no bank, shore or sheet's end is a ruled line).
// isle: metres inside an islet of the shallows (above 0: land), from one slow field of the place and a finer one that lobes its edge.
const WQ = PLAN.wander;
export const wander = (x, z) => WQ[0] * Math.sin(x * 0.071 + 1.7 * Math.sin(z * 0.043 + 0.6)) + WQ[1] * Math.sin(z * 0.113 + 1.3 * Math.sin(x * 0.057 + 2.0)) + WQ[2] * Math.sin((x + z) * 0.31 + 2.0 * Math.sin(x * 0.19));
export const isle = (x, z) => 22 * (Math.sin(x * 0.052 + 1.9 * Math.sin(z * 0.031)) * Math.sin(z * 0.047 + 1.4 * Math.sin(x * 0.027 + 1.0)) + 0.35 * Math.sin((x - z) * 0.11 + 0.7) - 0.62) + 3.2 * Math.sin(x * 0.41 + 1.3 * Math.sin(z * 0.29 + 2.0)) * Math.sin(z * 0.37 + 0.7);
const WATER_GLSL = /* glsl */`
#define W_LEVEL ${WATER.toFixed(1)}
float wWander(vec2 p){ return ${WQ[0].toFixed(2)}*sin(p.x*.071 + 1.7*sin(p.y*.043 + .6)) + ${WQ[1].toFixed(2)}*sin(p.y*.113 + 1.3*sin(p.x*.057 + 2.)) + ${WQ[2].toFixed(2)}*sin((p.x + p.y)*.31 + 2.*sin(p.x*.19)); }
// a place of the plan in the river's own frame: x metres to the right of the route's line, y metres along it (the
// line is straight to N ${PLAN.n0 + PLAN.turn0.from}, then bears round on ${PLAN.turn0.R} m); beyond the bend's reach the plan's own E, N
vec2 wLeg(vec2 en){ vec2 q = vec2(${PLAN.turn0.R}. - en.x, en.y - ${PLAN.n0 + PLAN.turn0.from}.); if (q.y <= 0. || q.x <= 0.) return en; return vec2(${PLAN.turn0.R}. - length(q), ${PLAN.n0 + PLAN.turn0.from}. + atan(q.y, q.x)*${PLAN.turn0.R}.); }
float wIsle(vec2 p){ return 22.*(sin(p.x*.052 + 1.9*sin(p.y*.031))*sin(p.y*.047 + 1.4*sin(p.x*.027 + 1.)) + .35*sin((p.x - p.y)*.11 + .7) - .62) + 3.2*sin(p.x*.41 + 1.3*sin(p.y*.29 + 2.))*sin(p.y*.37 + .7); }
// metres outside the water at a place (under 0: water), from the plan map's fields: the drawn edge with its wander;
// in the shallows the islets stand out of it
float wWat(vec4 pm, vec2 xz){
  float w = (pm.g - .5)*160. + wWander(xz), ok = (.5 - pm.b)*160.;
  if (ok > 0.) w = max(w, min(wIsle(xz), .5*ok));
  return w;
}
// how much of a water's face mirrors, by the cosine of the look's angle to the upright (optics)
float wFres(float c){ return .07 + .93*pow(1. - clamp(c, 0., 1.), 2.7); }
`;

// ---------- the plan of this seed: the frame and its fit, the fields of the land ----------
export async function makePlan(L, relief = () => 0, pause = async () => {}, rv = [0.9, 0.4, 2.1, 1.0]) {
  const P = PLAN, fz = L.frontZ;
  // THE PART'S LINE, ASKED: its own law read every 4 m of x round the lobe (there is no typed copy of it).
  // d = metres from a place to the nearest point of that line, positive before it (our side): the nearest of the
  // line's points 320 m either way along x.
  const X0 = L.lobe.x - 3200, DX = 4, NX = 1601, zs = new Float32Array(NX);
  for (let i = 0; i < NX; i++) zs[i] = fz(X0 + i * DX);
  const lineD = (x, z) => {
    const f = (x - X0) / DX, i0 = Math.round(f);
    if (i0 < 80 || i0 > NX - 82) return z - fz(x);          // beyond the reach read: far off, the distance straight north serves
    let best = Infinity;
    for (let i = i0 - 80; i <= i0 + 80; i++) { const dx = X0 + i * DX - x, dz = zs[i] - z, d2 = dx * dx + dz * dz; if (d2 < best) best = d2; }
    const k = Math.floor(f), zl = zs[k] + (zs[k + 1] - zs[k]) * (f - k);
    return z >= zl ? Math.sqrt(best) : -Math.sqrt(best);
  };
  // the plan's frame on one side: side 1 is the plan as drawn (the turns go right, the castle stands to the right);
  // side -1 is its mirror image about the river's axis (the turns go left). off: how far the river's axis stands from
  // its drawn place beside the lobe (the lobe's tip is at E -40 - off).
  // sh: the slide (the lobe's tip is at N 1290 - sh; a slide south is negative).
  const frame = (m, off, sh = 0) => { const ox = L.lobe.x + (40 + off) * m, oz = L.lobe.z + 1290 - sh; return { m, off, ox, oz, wx: (E) => ox + m * E, wz: (N) => oz - N, pe: (x) => (x - ox) * m, pn: (z) => oz - z }; };
  // a grid of d for each side over the ground the fit may use (drawn frame: E -520..2080, N 500..2380, 20 m), read bilinearly
  const G = { e0: -520, n0: 500, s: 20, ne: 131, nn: 95 }, grids = {};
  const gridOf = async (m) => {
    if (grids[m]) return grids[m];
    const S = frame(m, 0), d = new Float32Array(G.ne * G.nn);
    for (let j = 0; j < G.nn; j++) { for (let i = 0; i < G.ne; i++) d[j * G.ne + i] = lineD(S.wx(G.e0 + i * G.s), S.wz(G.n0 + j * G.s)); if (j % 32 === 31) await pause(); }
    const e0 = G.e0, n0 = G.n0, sG = G.s, ne = G.ne, mx = G.ne - 1.001, my = G.nn - 1.001;
    grids[m] = (E, N) => {
      let fx = (E - e0) / sG, fy = (N - n0) / sG; fx = fx < 0 ? 0 : fx > mx ? mx : fx; fy = fy < 0 ? 0 : fy > my ? my : fy;
      const i = fx | 0, j = fy | 0, a = fx - i, b = fy - j, o = j * ne + i, v0 = d[o] + (d[o + 1] - d[o]) * a, v1 = d[o + ne] + (d[o + ne + 1] - d[o + ne]) * a;
      return v0 + (v1 - v0) * b;
    };
    return grids[m];
  };
  // the route in plan: north up the river, round its broad bend and the first turn's tighter part (exit heading H1
  // degrees), the run along the front (LL), the last turn (A2 degrees), the last leg to the ring
  const geom = (H1, LL, A2) => {
    const R0 = P.turn0.R, R1 = P.turn1.R, R2 = P.turn2.R, n0 = P.n0, wb = P.turn0.from, w1 = P.turn1.N - n0, Nb = n0 + wb, a0 = (w1 - wb) / R0, a1 = H1 * D2R, a2 = A2 * D2R, h2 = a1 + a2;
    const P1 = [R0 - R0 * Math.cos(a0), Nb + R0 * Math.sin(a0)], C1 = [P1[0] + R1 * Math.cos(a0), P1[1] - R1 * Math.sin(a0)];      // where the turn tightens; the tighter turn's centre
    const T1e = [C1[0] - R1 * Math.cos(a1), C1[1] + R1 * Math.sin(a1)], d1 = [Math.sin(a1), Math.cos(a1)];
    const S2 = [T1e[0] + LL * d1[0], T1e[1] + LL * d1[1]], C2 = [S2[0] + R2 * Math.cos(a1), S2[1] - R2 * Math.sin(a1)];
    const T2e = [C2[0] - R2 * Math.cos(h2), C2[1] + R2 * Math.sin(h2)], d2 = [Math.sin(h2), Math.cos(h2)];
    const ring = [T2e[0] + P.lastLeg * d2[0], T2e[1] + P.lastLeg * d2[1]], castle = [ring[0] + P.ringToCastle * d2[0], ring[1] + P.ringToCastle * d2[1]];
    const w2 = w1 + R1 * (a1 - a0), w3 = w2 + LL, w4 = w3 + R2 * a2, w5 = w4 + P.lastLeg;
    const at = (w) => {                                            // plan E, N and heading (radians) at a way mark
      if (w <= wb) return [0, n0 + w, 0];
      if (w <= w1) { const a = (w - wb) / R0; return [R0 - R0 * Math.cos(a), Nb + R0 * Math.sin(a), a]; }
      if (w <= w2) { const b = a0 + (w - w1) / R1; return [C1[0] - R1 * Math.cos(b), C1[1] + R1 * Math.sin(b), b]; }
      if (w <= w3) { const q = w - w2; return [T1e[0] + q * d1[0], T1e[1] + q * d1[1], a1]; }
      if (w <= w4) { const b = a1 + (w - w3) / R2; return [C2[0] - R2 * Math.cos(b), C2[1] + R2 * Math.sin(b), b]; }
      const q = w - w4; return [T2e[0] + q * d2[0], T2e[1] + q * d2[1], h2];
    };
    return { Nt: P.turn1.N, Nb, R0, a0, P1, H1, LL, A2, T1e, S2, C2, T2e, ring, castle, d1, d2, h2, w: [0, w1, w2, w3, w4, w5], at };
  };
  // THE FIT (by the seed's own line, never by a seed's number). For each side, each place of the river beside the lobe
  // (its drawn place, 80 or 160 m to either hand), each exit heading and each length of the run: the drawing slides
  // to the northernmost place at which bed, turn and run keep 135 m from the line. Then the last turn is tried at
  // each of its angles: the whole route keeps 135 m, the moat's shores 115 m, the castle stands 278 m or more from
  // the line. THE CHOICE is the route with the most metres of turn and run within 170 m of the line (the wall of
  // fire beside us: 380 m is enough; metres within 200 m count for two fifths), less a metre for each metre the
  // castle stands off its 280 m, less what the last turn takes over 30 degrees and what the whole is over 1,950 m.
  const mo = P.moat, shoreAC = [[mo.a[1], mo.c[0] + 60], [mo.a[1] - 60, mo.c[0]], [0, mo.c[0]], [mo.a[0] + 60, mo.c[0]], [mo.a[0], mo.c[0] + 60], [mo.a[1], 0], [mo.a[1], mo.c[1] - 60], [mo.a[1] - 60, mo.c[1]], [mo.a[0], 0]];
  const R1 = P.turn1.R, R2 = P.turn2.R, RUN = P.run, ST = 16, legAll = P.lastLeg + P.ringToCastle;
  let fit = null, work = 0;                                          // (work: places asked since the last pause)
  for (const m of [1, -1]) {
    const D0 = await gridOf(m);
    for (const off of [0, -80, 80, -160, 160]) {
      const D = (E, N) => D0(E + off, N);
      for (let H1 = P.turn1.heading[0]; H1 <= P.turn1.heading[1]; H1 += 5) {
        const G1 = geom(H1, RUN.len[1], P.turn2.deg[0]), a1 = H1 * D2R, wT = G1.w[1], T1 = G1.T1e, d1 = G1.d1, arc = [], str = [];
        for (let w = 420; w < wT; w += 40) { const q = G1.at(w); arc.push([q[0], q[1], 0]); }      // the river, from where the lens is low
        for (let s = 0; s <= G1.w[2] - wT; s += ST) { const q = G1.at(wT + s); arc.push([q[0], q[1], 1]); }
        for (let s = 0; s <= RUN.len[1]; s += ST) str.push([T1[0] + s * d1[0], T1[1] + s * d1[1]]);
        const least = (sh, n) => { let mn = Infinity; work += arc.length + n; for (const p of arc) { const v = D(p[0], p[1] + sh); if (v < mn) { mn = v; if (v < RUN.near) return v; } } for (let k = 0; k < n; k++) { const v = D(str[k][0], str[k][1] + sh); if (v < mn) { mn = v; if (v < RUN.near) return v; } } return mn; };   // (asked only whether it keeps the run's nearest)
        const tryRun = (LL) => {                                           // (a plain function: a loop written inside an async function is left to the engine's slowest tier); true: no longer run need be tried
          const n = Math.round(LL / ST) + 1; let sh, lo = P.turn1.slide[0], hi = P.turn1.slide[1];
          if (least(lo, n) < RUN.near) return true;                        // a longer run only comes nearer
          if (least(hi, n) >= RUN.near) sh = hi; else { for (let k = 0; k < 8; k++) { const mid = 0.5 * (lo + hi); if (least(mid, n) >= RUN.near) lo = mid; else hi = mid; } sh = lo; }
          let band = 0, b200 = 0;
          for (const p of arc) { if (!p[2]) continue; const v = D(p[0], p[1] + sh); if (v <= RUN.far) band += ST; if (v <= 200) b200 += ST; }
          for (let k = 0; k < n; k++) { const v = D(str[k][0], str[k][1] + sh); if (v <= RUN.far) band += ST; if (v <= 200) b200 += ST; }
          const top = Math.min(band, RUN.want) + 0.4 * Math.min(b200 - band, 150) - 0.1 * Math.abs(off);
          if (fit && top <= fit.score) return false;                       // it cannot beat the best so far
          const S2 = [T1[0] + LL * d1[0], T1[1] + LL * d1[1]], C2 = [S2[0] + R2 * Math.cos(a1), S2[1] - R2 * Math.sin(a1)];
          for (let A2 = P.turn2.deg[0]; A2 <= P.turn2.deg[1]; A2 += 5) {
            const a2 = A2 * D2R, h2 = a1 + a2, T2 = [C2[0] - R2 * Math.cos(h2), C2[1] + R2 * Math.sin(h2)], d2 = [Math.sin(h2), Math.cos(h2)], cr = Math.cos(h2), sr = -Math.sin(h2);
            const cast = [T2[0] + legAll * d2[0], T2[1] + legAll * d2[1]], cd = D(cast[0], cast[1] + sh);
            if (cd < P.castleFromLine + 0.5) continue;                     // rule 7: the castle stands 280 m and more from the line (half a metre for the grid's own error)
            const score = top - Math.abs(cd - P.castleFromLine) - 1.5 * Math.max(0, A2 - 30) - 0.25 * Math.max(0, G1.w[2] + LL + R2 * a2 + P.lastLeg - 1950);
            if (fit && score <= fit.score) continue;
            let mn = Infinity;
            for (let s = 0; s <= R2 * a2 && mn >= RUN.near; s += ST) { const b = a1 + s / R2, v = D(C2[0] - R2 * Math.cos(b), C2[1] + R2 * Math.sin(b) + sh); if (v < mn) mn = v; }
            for (let s = 0; s <= legAll && mn >= RUN.near; s += ST) { const v = D(T2[0] + s * d2[0], T2[1] + s * d2[1] + sh); if (v < mn) mn = v; }
            for (const [a, c] of shoreAC) { if (mn < RUN.near) break; const v = D(cast[0] + a * d2[0] + c * cr, cast[1] + a * d2[1] + c * sr + sh) + 20; if (v < mn) mn = v; }
            if (mn < RUN.near) continue;
            fit = { side: m, off, sh, H1, LL, A2, band, b200, cd, score };
          }
          return false;
        };
        for (let LL = RUN.len[0]; LL <= RUN.len[1]; LL += 40) { if (tryRun(LL)) break; if (work > 30000) { work = 0; await pause(); } }
      }
    }
  }
  let tier = 1;
  if (!fit) { fit = { side: 1, off: 0, sh: -400, H1: 110, LL: 240, A2: 40, band: 0, b200: 0, cd: 0, score: 0 }; tier = 4; }   // no line of the part's has asked for this
  // the true distances of the fitted route, by the part's line itself; a last small slide south if the grid flattered it
  const g = geom(fit.H1, fit.LL, fit.A2); let S, nearest = Infinity, nearestWay = 0, inBand = 0, in200 = 0;
  for (let pass = 0; pass < 3; pass++) {
    S = frame(fit.side, fit.off, fit.sh); nearest = Infinity; inBand = 0; in200 = 0;
    for (let w = 300; w <= g.w[5]; w += 2) { const p = g.at(w), d = lineD(S.wx(p[0]), S.wz(p[1])); if (d < nearest) { nearest = d; nearestWay = w; } if (d <= P.run.far) inBand += 2; if (d <= 200) in200 += 2; }
    if (nearest >= P.run.near - 0.5) break;
    fit.sh -= P.run.near - nearest + 0.5;
    await pause();
  }
  const D0 = grids[fit.side], lineG = (E, N) => D0(E + fit.off, N + fit.sh);
  const castleD = lineD(S.wx(g.castle[0]), S.wz(g.castle[1]));
  await pause();
  return finishPlan(L, g, { m: S.m, ox: S.ox, oz: S.oz, wx: S.wx, wz: S.wz, pe: S.pe, pn: S.pn, lineD, lineG, relief, rv, fit: { ...fit, tier, nearest, nearestWay, castleD, inBand, in200 } }, pause);
}

// the fields of the fitted plan: places and way marks, the castle's frame, the one water and its parts as
// signed distances in plan (negative inside; exact within 100 m, "far" beyond), the forest's cover, the ground
async function finishPlan(L, g, F, pause) {
  const P = PLAN, { wx, wz, pe, pn, lineD, lineG, relief, rv } = F, [, w1, w2, w3, w4, w5] = g.w, FAR = 100, Nt = g.Nt;
  // THE PLACES OF THE ROUTE, in metres of way from the entry. The run along the front is from the first turn's end
  // to the last turn's start; "runIn" and "runOut" are where the route is first and last within 170 m of the line.
  let runIn = w2, runOut = w3, seen = false;
  for (let w = w1; w <= w4; w += 4) { const q = g.at(w); if (lineG(q[0], q[1]) <= P.run.far + 2) { if (!seen) { runIn = w; seen = true; } runOut = w; } }
  const way = { entry: 0, bend: P.bend - P.n0, rideMouth: P.rideMouth - P.n0, rideLevel: P.rideLevelAt, rideEnd: w1, runIn, turn1End: w2, runOut, turn2Start: w3,
    turn2End: w4, shore: w5 + P.ringToCastle + P.moat.a[0], apronLip: w5 + P.ringToCastle + P.rock.a[0], gate: w5 - 45 * P.K, ring: w5 };
  // the castle group's frame: a along the last leg, c to its right; 0, 0 at the castle's centre
  const cE = g.castle[0], cN = g.castle[1], aE = g.d2[0], aN = g.d2[1], rE = Math.cos(g.h2), rN = -Math.sin(g.h2);
  const toLocal = (E, N) => [(E - cE) * aE + (N - cN) * aN, (E - cE) * rE + (N - cN) * rN];
  const fromLocal = (a, c) => [cE + a * aE + c * rE, cN + a * aN + c * rN];
  const sdBox = (a, c, b, r) => { const qa = Math.abs(a - 0.5 * (b.a[0] + b.a[1])) - (0.5 * (b.a[1] - b.a[0]) - r), qc = Math.abs(c - 0.5 * (b.c[0] + b.c[1])) - (0.5 * (b.c[1] - b.c[0]) - r); return hyp(Math.max(qa, 0), Math.max(qc, 0)) + Math.min(Math.max(qa, qc), 0) - r; };
  const sdMoat = (E, N) => sdBox((E - cE) * aE + (N - cN) * aN, (E - cE) * rE + (N - cN) * rN, P.moat, P.moat.r);
  const sdRock = (E, N) => sdBox((E - cE) * aE + (N - cN) * aN, (E - cE) * rE + (N - cN) * rN, P.rock, P.rock.r);
  // a line of points [E, N, half width] in pieces of six spans, each with its box: metres outside it (negative inside)
  const lineOf = (pts) => {
    const ch = [];
    for (let k = 0; k < pts.length - 1; k += 6) {
      const seg = pts.slice(k, Math.min(pts.length, k + 7)); let e0 = Infinity, e1 = -Infinity, n0 = Infinity, n1 = -Infinity, hw = 0;
      for (const p of seg) { e0 = Math.min(e0, p[0]); e1 = Math.max(e1, p[0]); n0 = Math.min(n0, p[1]); n1 = Math.max(n1, p[1]); hw = Math.max(hw, p[2]); }
      ch.push({ seg, e0, e1, n0, n1, hw });
    }
    return ch;
  };
  const CG = { e0: -832, n0: -432, s: 32, n: 82 }, calm = new Uint8Array(CG.n * CG.n);     // (filled further down; 0 until then: everything asked in full)
  const calmAt = (E, N) => { const i = Math.floor((E - CG.e0) / CG.s), j = Math.floor((N - CG.n0) / CG.s); return i < 0 || j < 0 || i >= CG.n || j >= CG.n ? 0 : calm[j * CG.n + i]; };
  const polySd = (E, N, ch) => {
    let m = FAR;
    for (const c of ch) {
      const bx = E < c.e0 ? c.e0 - E : E > c.e1 ? E - c.e1 : 0, by = N < c.n0 ? c.n0 - N : N > c.n1 ? N - c.n1 : 0, r = m + c.hw;
      if (r <= 0 || bx * bx + by * by >= r * r) continue;              // nothing of this piece can be nearer than what is found
      const pts = c.seg;
      for (let k = 0; k < pts.length - 1; k++) {
        const a = pts[k], b = pts[k + 1], vx = b[0] - a[0], vy = b[1] - a[1], qx = E - a[0], qy = N - a[1];
        const tt = (qx * vx + qy * vy) / Math.max(vx * vx + vy * vy, 1e-6), t = tt < 0 ? 0 : tt > 1 ? 1 : tt, ex = qx - vx * t, ey = qy - vy * t, d = Math.sqrt(ex * ex + ey * ey) - (a[2] + (b[2] - a[2]) * t);
        if (d < m) m = d;
      }
    }
    return m;
  };
  const smoothLine = (pts, n) => {                    // a rounded line through the points (uniform Catmull-Rom), n pieces to a span
    const out = [], q = (i) => pts[clamp(i, 0, pts.length - 1)];
    for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < n; k++) {
      const t = k / n, p0 = q(i - 1), p1 = q(i), p2 = q(i + 1), p3 = q(i + 2), c = [];
      for (let j = 0; j < 3; j++) c.push(0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t * t * t));
      out.push(c);
    }
    out.push(pts[pts.length - 1].slice()); return out;
  };
  // THE RIVER (the ride): from far to the south, under the entry and up the route's line, round its bend, to where the turn tightens.
  // Its middle swings from side to side of the route's line and its breadth changes along it (by laws of the place
  // along it, their four phases dealt by the visit); the route's line is never nearer its drawn bank than
  // river.keep. South of the entry it wanders more freely.
  const RV = P.river;
  const hwAt = (N) => lerp(RV.half[0], RV.half[1], 0.5 + 0.5 * Math.sin(N / 97 + rv[0] + 1.2 * Math.sin(N / 211 + rv[1])));
  const cAt = (N) => (hwAt(N) - RV.keep) * Math.sin(N / RV.L + rv[2] + 0.9 * Math.sin(N / 171 + rv[3])) + (N < 60 ? (60 - N) * 0.22 * Math.sin(N / 260 + rv[1]) : 0);
  // the river's own frame: v metres along the route's line (N on its straight; on along the broad bend), lat metres to its right
  const Nb = g.Nb, R0 = g.R0;
  const legPt = (v, lat) => { if (v <= Nb) return [lat, v]; const a = (v - Nb) / R0; return [R0 - (R0 - lat) * Math.cos(a), Nb + (R0 - lat) * Math.sin(a)]; };
  const legOf = (E, N) => { const dx = R0 - E, dy = N - Nb; if (dy <= 0 || dx <= 0) return [E, N]; return [R0 - hyp(dx, dy), Nb + Math.atan2(dy, dx) * R0]; };
  const ridePts = []; for (let v = -1840; v <= Nt + 20; v += 30) { const q = legPt(v, cAt(v)); ridePts.push([q[0], q[1], hwAt(v)]); }
  const ride = lineOf(ridePts);
  // THE DROWNED SHALLOWS: the river spreads before the fire along the first turn and the run, from the ride's end to
  // past the last turn's start: 50 m on the side away from the fire, and toward the fire as far as 95 m before the
  // line, where the fuse belt stands on the far bank
  const FL = P.flat, flatMid = 0.5 * (FL.toFire - FL.away), flatPts = [], flatEnd = w3 + 30;
  for (let w = w1 - 10; w <= flatEnd + 30; w += 16) { const q = g.at(w); flatPts.push([q[0] - Math.cos(q[2]) * flatMid, q[1] + Math.sin(q[2]) * flatMid, 0.5 * (FL.toFire + FL.away) * smoothstep(w1 - 30, w1 + 60, w) * smoothstep(flatEnd + 50, flatEnd - 40, w) + 20]); }
  const flat = lineOf(flatPts);
  // THE CHANNEL: the water runs on under the route from the shallows into the moat
  const chanPts = []; for (let w = w3 - 40; w <= way.shore + 30; w += 20) { const q = g.at(w), f = (w - w3 + 40) / (way.shore + 70 - w3); chanPts.push([q[0], q[1], lerp(RV.chan[0], RV.chan[1], f) + 7 * Math.sin(w / 61 + rv[0])]); }
  const chan = lineOf(chanPts);
  // the route's own line from the ride's end to the shore (the islets keep off it)
  const lnPts = []; for (let w = w1 - 80; w <= way.shore; w += 12) { const q = g.at(w); lnPts.push([q[0], q[1], 0]); }
  const routeLn = lineOf(lnPts), routeD = (E, N) => polySd(E, N, routeLn);
  // A LANE OF FLIERS ACROSS THE RUN. It begins (the fliers rise out of the crowns there) where the land is 222 m and
  // more from the part's line: farther along the front, where the line bays away. From there it runs aslant, never
  // within 110 m of the line, crosses the route's line, and from the crossing on goes away from the fire. Tried at
  // every 25 m of the turn and the run, nearest the run's middle first, at four slants either way; the first that
  // will do is taken, and a line of the part's that allows none has none.
  const crossAir = (wA, wB, mid) => {
    const ws = [], C = P.cross, found = [];
    for (let w = wA; w <= wB; w += 25) ws.push(w);
    ws.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
    for (const w of ws) {
      const q = g.at(w), h = q[2];
      slants: for (const t of [50, 65, 35, 78]) for (const sense of [-1, 1]) {
        const c = Math.cos(t * D2R), sn = Math.sin(t * D2R) * sense, dE = Math.cos(h) * c + Math.sin(h) * sn, dN = -Math.sin(h) * c + Math.cos(h) * sn;
        let ok = false, s = 10;
        for (; s <= 700; s += 10) { const d = lineG(q[0] - dE * s, q[1] - dN * s); if (d < C.keepAir) break; if (d >= C.fromAir && s >= 180) { ok = lineD(wx(q[0] - dE * s), wz(q[1] - dN * s)) >= C.fromAir; break; } }
        if (!ok || lineG(q[0] + dE * 150, q[1] + dN * 150) < lineG(q[0], q[1]) + 20) continue;     // beyond the route it goes on away from the fire
        let far = true; for (let t = -s; t <= 460 && far; t += 40) far = hyp(q[0] + dE * t - cE, q[1] + dN * t - cN) >= 110 * P.K + C.castle + 10;   // and never over the castle
        if (!far) continue;
        found.push({ w, E: q[0], N: q[1], dE, dN, back: s, sense, slant: t, beginsFromLine: Math.round(lineG(q[0] - dE * s, q[1] - dN * s)), crossesFromLine: Math.round(lineG(q[0], q[1])) });
        if (found.length >= 40) return found;
        break slants;                                 // (one way to a place of the route)
      }
    }
    return found;                                     // the ways found, best first (whoever lays the lane takes the first whose air is clear)
  };
  const crossFlyAll = crossAir(way.rideEnd + 40, way.turn2Start - 20, 0.5 * (way.runIn + way.turn2Start)), crossFly2All = crossAir(way.turn2Start + 30, way.shore - 30, way.turn2End);
  const crossFly3All = crossAir(way.shore + 5, way.shore + 115, way.shore + 55);   // (stage D) and over the lagoon, between its near shore and the castle's rock
  const crossFly = crossFlyAll[0] || null, crossFly2 = crossFly2All[0] || null;
  // and a file across the opening to the moat (the last ride): from as far toward the fire as its rule allows
  const lastCross = (() => {
    const q = g.at(way.shore - 80), h = q[2];
    for (const t of [25, 0, 45]) for (const sense of [-1, 1]) {
      const c = Math.cos(t * D2R), sn = Math.sin(t * D2R) * sense, dE = Math.cos(h) * c + Math.sin(h) * sn, dN = -Math.sin(h) * c + Math.cos(h) * sn;
      let s = 0; while (s < 170 && lineG(q[0] - dE * (s + 10), q[1] - dN * (s + 10)) >= P.cross.from0 && sdMoat(q[0] - dE * (s + 10), q[1] - dN * (s + 10)) > 30) s += 10;
      if (s >= 70 && sdMoat(q[0] + dE * 150, q[1] + dN * 150) > 30) return { E: q[0], N: q[1], dE, dN, back: s, sense, slant: t };
    }
    return null;
  })();
  // metres outside the shallows (under 0: in them): the sheet by the run, stopped 95 m before the line
  const sdAsh = (E, N) => { const c = polySd(E, N, flat); return c >= FAR ? FAR : Math.max(c, FL.stop - lineG(E, N)); };
  // the set piece's ground: the fuse belt beside the shallows (there the belt is deeper, its clumps smaller and quicker)
  const setPiece = (E, N) => (calmAt(E, N) & 2 ? 0 : smoothstep(40, 0, polySd(E, N, flat)));
  // the moat's outflow, off to the south-east
  const hw = (i) => 17.5 + 4 * Math.sin(i * 1.9 + 0.7);
  const rivOut = lineOf(smoothLine([fromLocal(P.moat.a[1] - 50, P.moat.c[1] - 12), fromLocal(P.moat.a[1] + 10, P.moat.c[1] + 150), fromLocal(P.moat.a[1] + 130, P.moat.c[1] + 560), fromLocal(P.moat.a[1] + 180, P.moat.c[1] + 1700)].map((p, i) => [p[0], p[1], hw(i + 4)]), 5));
  // ONE WATER: the river, the shallows, the channel, the moat and its outflow, joined round (no corner where two
  // meet). watBase: metres outside its drawn edge (under 0: water), a metre in a metre at the most.
  const smin = (a, b, k) => { const h = clamp(0.5 + (0.5 * (b - a)) / k, 0, 1); return b + (a - b) * h - k * h * (1 - h); };
  const watBase = (E, N) => {
    const c = polySd(E, N, chan), cc = c >= FAR ? FAR : Math.max(c, FL.stop - lineG(E, N));
    return Math.min(smin(smin(polySd(E, N, ride), sdAsh(E, N), 14), smin(cc, sdMoat(E, N), 14), 14), polySd(E, N, rivOut));
  };
  // where an islet may stand (metres; above 0: it may): well inside the shallows and off the route's line
  const isletOK = (E, N) => Math.min(-sdAsh(E, N) - 12, routeD(E, N) - 20);
  // metres inside an islet at a place (above 0: on one)
  const isletAt = (E, N) => { const ok = isletOK(E, N); return ok > 0 ? Math.min(isle(wx(E), wz(N)), 0.5 * ok) : -1; };
  // THE WATER AS IT LIES: metres outside it at a place (under 0: water). The drawn edge with the banks' wander; the
  // islets stand out of the shallows. The shaders hold the same law (wWat) over the plan map's fields.
  const watAt = (E, N) => {
    let w = watBase(E, N) + wander(wx(E), wz(N));
    if (w < 0) { const ok = isletOK(E, N); if (ok > 0) w = Math.max(w, Math.min(isle(wx(E), wz(N)), 0.5 * ok)); }
    return w;
  };
  // the forest's cover at a place, 0..1: none on the water, whole from 9 m behind a bank (the line itself is asked
  // by whoever deals plants: nothing stands behind it)
  const cover = (E, N) => (calmAt(E, N) & 1 ? 1 : smoothstep(2.5, 9, watAt(E, N)));
  // THE GROUND: the plain's relief (the part was given the same function, and its flames stand on it), with the
  // waters laid level in it: a bank goes down to the water's level over 7.5 m; an islet lies a hand above it.
  // THE PLAN, COARSELY: squares of 32 m whose middle stands so far from every water (58 m: the square's own reach,
  // the wander and the 9 m of a bank) that the ground there is the plain's relief and the cover whole, with
  // nothing more asked; and those the shallows' set piece cannot reach (65 m).
  await pause();
  // (a row at a time in a plain function: a loop written inside an async function is left to the engine's slowest tier)
  const calmRow = (j) => { for (let i = 0; i < CG.n; i++) { const E = CG.e0 + (i + 0.5) * CG.s, N = CG.n0 + (j + 0.5) * CG.s; calm[j * CG.n + i] = (watBase(E, N) > 58 ? 1 : 0) | (polySd(E, N, flat) > 65 ? 2 : 0); } };
  for (let j = 0; j < CG.n; j++) { calmRow(j); if (j % 8 === 7) await pause(); }
  // FILES OF RUNNERS ACROSS THE SHALLOWS OF THE RUN (stage D), by the law that lets a lane of fliers lie there. A
  // file begins under the plants where the land is as far from the part's line as every lane's beginning (285 m by
  // the set piece's ground, 215 m elsewhere): farther along the front, where the line bays away. From there it wades
  // aslant over the shallows between the route's line and the wall, never within 112 m of the line, passes under the
  // route's line, and from there on goes away from the fire into the plants of the far bank. Tried at every 30 m of
  // the run at four slants either way; whoever lays the lanes takes those that cross no other file.
  const crossRunAll = (() => {
    const C = P.cross, all = [], fromAt = (E, N) => (setPiece(E, N) >= 0.5 ? C.from : C.from0) + 8;
    for (let w = way.runIn - 40; w <= way.turn2Start + 40; w += 30) {
      const q = g.at(w), h = q[2], d0 = lineG(q[0], q[1]);
      for (const t of [62, 72, 50, 80]) for (const sense of [-1, 1]) {
        const c = Math.cos(t * D2R), sn = Math.sin(t * D2R) * sense, dE = Math.cos(h) * c + Math.sin(h) * sn, dN = -Math.sin(h) * c + Math.cos(h) * sn;
        let s = 12, ok = false, least = d0;
        for (; s <= 1000; s += 12) {
          const E = q[0] - dE * s, N = q[1] - dN * s, d = lineG(E, N); if (d < C.keepRun) break; if (d < least) least = d;
          if (s >= 60 && d >= fromAt(E, N) && cover(E, N) >= 0.9) { const E2 = E - dE * 24, N2 = N - dN * 24; ok = lineG(E2, N2) >= fromAt(E2, N2) && cover(E2, N2) >= 0.9; if (ok) break; }
        }
        if (!ok) continue;
        let e = 20; while (e < 420 && !(cover(q[0] + dE * e, q[1] + dN * e) >= 0.9 && cover(q[0] + dE * (e + 30), q[1] + dN * (e + 30)) >= 0.9)) e += 10;
        if (e >= 420 || lineG(q[0] + dE * e, q[1] + dN * e) < d0 + 20) continue;       // beyond the route it goes on away from the fire, to the plants
        let far = true; for (let u = -s - 30; u <= e + 60 && far; u += 30) far = sdMoat(q[0] + dE * u, q[1] + dN * u) > 40;
        if (far) all.push({ w, E: q[0], N: q[1], dE, dN, back: s, on: e, sense, slant: t, crossesFromLine: Math.round(d0), leastFromLine: Math.round(least) });
      }
    }
    return all;
  })();
  const groundAt = (x, z) => {
    const E = pe(x), N = pn(z), h = relief(x, z);
    if (calmAt(E, N) & 1) return h;
    const wb = watBase(E, N) + wander(x, z);
    if (wb >= 9) return h;
    if (wb < 0) { const il = isletAt(E, N); return il > 0 ? WATER + 0.3 * smoothstep(0, 2, il) : WATER; }
    return lerp(h, WATER, smoothstep(9, 1.5, wb));
  };
  const segD = (E, N, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], t = clamp(((E - a[0]) * vx + (N - a[1]) * vy) / Math.max(vx * vx + vy * vy, 1e-6), 0, 1); return hyp(E - a[0] - vx * t, N - a[1] - vy * t); };
  return { ...F, g, way, at: g.at, heading2: g.h2, castle: { E: cE, N: cN, x: wx(cE), z: wz(cN), ax: F.m * aE, az: -aN, rx: F.m * rE, rz: -rN }, toLocal, fromLocal,
    sdMoat, sdRock, sdAsh, watBase, watAt, isletOK, isletAt, routeD, hwAt, cAt, legPt, legOf, mouth: g.P1, a0: g.a0, cover, groundAt, calmAt, segD, ridePts, flatPts, chanPts, setPiece, Nt, lineG, crossFly, crossFly2, crossFlyAll, crossFly2All, crossFly3All, crossRunAll, lastCross, flatSd: (E, N) => polySd(E, N, flat) };
}

// ---------- GLSL every material of the world shares (after hero.glsl.front): the plan, the two lights, the air ----------
// THE FIRE is the part's law (fcrLight: by the place's distance from the part's line, breathing by fcrFlick).
// THE DUSK is a hemisphere (sky over ground) and one weak light from what is left of the day (or the moon).
export const WORLD_GLSL = /* glsl */`
uniform vec3 uAmbSky, uAmbGnd, uDuskCol, uDuskDir, uHazeCol; uniform vec2 uHaze;
uniform vec4 uPlan;              // x, z of the plan's origin in the world; z: side (1 as drawn, -1 mirrored); w unused
uniform vec4 uPlanTex;           // E, N of the plan map's corner; z: 1 / its span (m)
uniform sampler2D uPlanMap;      // r metres outside the shallows, g metres outside the water's drawn edge, b metres outside the ground where islets may stand (each signed, 160 m to the byte's range, 0.5 at the edge), a canopy carpet
uniform vec3 uZen, uMid, uHor, uGlowCol, uMoonDir; uniform vec4 uSkyK;   // uSkyK: xy unit bearing of the day's remnant, z cloud, w moon
uniform vec4 uWind;              // the wind this visit (the part's deal): xy its bearing over the land (world x, z), z its strength (1: a full wind), w how much of the air's draw toward the line is felt
uniform sampler2D uPodMap;       // THE PODS' LIGHT lying on the ground and the water under the ripe plants (0..1 by place; the forest part fills it from its own plants)
vec2 wPlan(vec3 wp){ return vec2((wp.x - uPlan.x)*uPlan.z, uPlan.y - wp.z); }
float wPod(vec2 en){ return textureLod(uPodMap, (en - uPlanTex.xy)*uPlanTex.z, 0.).r; }
// HOW RIPE the forest is at d metres from the part's line (pods swollen, seams amber): 1 at the line, falling slowly;
// the forest along the river is ripe too, the far forest less
float wRipe(float d){ return 1. - smoothstep(40., 1700., d); }
// THE FIRE'S LIGHT FAR FROM THE LINE: the part's law w falls fast (0.15 at 500 m, 0.07 at 1 km); what a dark thing
// makes of it far off is the part's own grade for far land (its round 4: w^0.2/(1 + 1.3 w) x (0.48 + 0.52
// smoothstep(0.012, 0.12, w))), here at 0.62 of it and never under w itself: 0.35 at 200 to 500 m, 0.26 at 1 km,
// 0.13 at 2 km. The wall fills a third of the sky from the river: its light reaches there
float wFar(float w){ return max(w, .62*pow(max(w, 1e-4), .2)/(1. + 1.3*w)*(.48 + .52*smoothstep(.012, .12, w))); }
vec4 wPlanMap(vec2 en){ vec2 uv = (en - uPlanTex.xy)*uPlanTex.z, e = abs(uv - .5);          // beyond the map: forest
  return mix(textureLod(uPlanMap, uv, 0.), vec4(1.), smoothstep(.492, .5, max(e.x, e.y))); }
` + WATER_GLSL + /* glsl */`
// irradiance on a face: n its normal, Lf the part's fcrLight at the place, wrap so that backs are never black
// the sky's light at a place (w: the fire's strength there, the part's law): the dusk's blue, and near the line,
// under the fire's own smoke, the smoke's lit underside in its stead
vec3 wSkyAmb(float w){ return mix(uAmbSky, uAmbSky*.42 + uFire*.40, smoothstep(.12, .5, w)); }
vec3 wLit(vec3 n, vec4 Lf, float wrap, float gain){
  vec3 c = mix(uAmbGnd, wSkyAmb(Lf.w), .5 + .5*n.y) + uDuskCol*max(dot(n, uDuskDir), 0.);
  return c + uFire*(gain*Lf.w*max((dot(n, Lf.xyz) + wrap)/(1. + wrap), 0.));
}
// the same for the world's own dark things (plants, snags, animals): the fire's light by its far grade, and THE LIT
// SMOKE OVERHEAD as a broad soft warm light from above on the fire's side (it fills a third of the sky from the
// river; by the line the sky's own light is already the smoke's: wSkyAmb)
vec3 wLitF(vec3 n, vec4 Lf, float wrap, float gain){
  float wE = wFar(Lf.w), sm = .5 + .5*dot(n, normalize(vec3(Lf.x, 0., Lf.z)*.55 + vec3(0., .83, 0.)));
  vec3 c = mix(uAmbGnd, wSkyAmb(Lf.w), .5 + .5*n.y) + uDuskCol*max(dot(n, uDuskDir), 0.);
  return c + uFire*(gain*wE*(max((dot(n, Lf.xyz) + wrap)/(1. + wrap), 0.) + .30*sm*sm*(1. - smoothstep(.18, .55, Lf.w))));
}
float wFogAt(float dist){ float a = dist*uHaze.x*uHaze.y; return 1. - exp(-a*a); }   // (uHaze.y: the world's own dusk haze is this many times the figure given to the part: far things sit in the dusk)
// the sky's colour in a direction, without its stars (the dome draws it; water mirrors it)
vec3 wSky(vec3 d){
  float el = clamp(d.y, 0., 1.);
  vec3 c = mix(uMid, uZen, smoothstep(.10, .80, el));
  c = mix(uHor, c, smoothstep(0., .12, el));                                   // a paler band of haze to 6 or 7 degrees: a horizon all round
  vec2 az = normalize(d.xz + vec2(1e-5, 1e-5));
  c += uGlowCol*pow(max(dot(az, uSkyK.xy), 0.), 5.)*exp(-el*9.);               // what is left of the day: faint, cool, low, to one side
  return c;
}
// the stars of one size: N cells to a unit of direction, one star in a cell where its number passes thr; rad its
// disc in cells (each star a little its own size), fw the pixel's breadth in direction, gain its light
float wH13(vec3 p){ p = fract(p*.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y)*p.z); }
vec3 wH33(vec3 p){ p = fract(p*vec3(.1031, .1030, .0973)); p += dot(p, p.yxz + 33.33); return fract((p.xxy + p.yxx)*p.zyx); }
float wStarsAt(vec3 sd, float N, float thr, float rad0, float fw, float gain){
  vec3 p = sd*N, ip = floor(p);
  float h = wH13(ip + 7.), rad = max(rad0*(.65 + .7*fract(h*57.3)), fw*N*.9);
  float r = length(p - (ip + .5 + (wH33(ip) - .5)*.72));
  float mag = pow(clamp((h - thr)/max(1. - thr, 1e-3), 0., 1.), 4.)*.95 + .05;
  return step(thr, h)*mag*gain*(1. - smoothstep(rad*.25, rad, r))*min(1., rad0*rad0*1.4/max(rad*rad, 1e-9))*(.82 + .18*sin(uFcrT*(1.5 + 2.5*h) + h*40.));
}
`;

// THE AIR BETWEEN THE EYE AND A PLACE (after the noise chunk and WORLD_GLSL): the dusk's haze by distance, the glow
// of the low air before the fire (the part's), and LOW MIST by place: it lies 9 m deep (thinning upward) in the
// glades and over the river, in broad patches of its own, and is gone toward the line (there the fire's own smoke
// and steam stand). It takes the night's blue, the fire's orange where the look goes toward the fire (lit from
// behind: optics) and the pods' amber where they hang over it. Use: colour = colour*(1. - a.a) + a.rgb.
export const AIR_GLSL = /* glsl */`
float wMistAt(vec3 ro, vec3 p, float w){
  float L = length(p - ro), y0 = max(ro.y - W_LEVEL, 0.)*(1./9.), y1 = max(p.y - W_LEVEL, 0.)*(1./9.), dy = y1 - y0;
  float col = abs(dy) > .03 ? (exp(-y0) - exp(-y1))/dy : exp(-.5*(y0 + y1));
  float mp = .3 + .7*smoothstep(.3, .66, fcrN3(vec3(p.xz*(1./170.), 11.)));
  return (1. - exp(-.0058*L*col*mp))*(1. - smoothstep(.12, .22, w))*.6;
}
vec4 wAir(vec3 p, vec4 Lf, float pod){
  vec3 V = p - cameraPosition; float dist = length(V); vec3 rd = V/max(dist, 1e-3);
  float m = wMistAt(cameraPosition, p, Lf.w), h = wFogAt(dist);
  float fwd = max(dot(normalize(rd.xz + vec2(1e-5, 1e-5)), normalize(Lf.xz + vec2(1e-5, 1e-5))), 0.);
  vec3 mc = uHor*.5 + uAmbSky*.03 + uFire*(wFar(Lf.w)*(.10 + .62*fwd*fwd*fwd)) + vec3(1., .43, .07)*(.11*pod);
  return vec4((mc*m)*(1. - h) + uHazeCol*h + uFire*(.5*fcrAirGlow(cameraPosition, rd, dist)), 1. - (1. - m)*(1. - h));
}
`;

// THE WATER'S FACE, for whatever is drawn doubled in it (after the noise chunk and WORLD_GLSL). A body's double is
// drawn turned over about the water's level, and shown only where the eye's ray meets water: wFace gives the metres
// outside the water at that meeting (under 0: water; the river's bars stand out of it by the land's own law), and
// wDouble the share of the double seen there: the mirror's share at that angle, broken by the ripples (optics).
export const FACE_GLSL = /* glsl */`
uniform float uRideEnd;
float wVn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return textureLod(uNoise, (i + f + .5)/256., 0.).b; }
float wTrailE(float e0, float N){ return ${TRAIL_GLSL}; }
float wBarAt(vec2 lg, float e0, float mid, float fine){
  float wv = wVn(vec2(e0*3.1 + 7., lg.y/14.)), wv2 = wVn(vec2(e0*1.7 + 31., lg.y/9.)), show = smoothstep(.50, .64, wv + .15*(mid - .5))*smoothstep(.15, .55, sin(lg.y/6.1 + e0*2.3));
  float dq = abs(lg.x - wTrailE(e0, lg.y) - sign(e0)*3.*wv2), hwb = (.8 + 4.*smoothstep(.5, .85, wv))*(.7 + .6*wv2);
  return (hwb + .9*(fine - .5))*show - dq - 4.*(1. - show);   // (stage E: where no bar shows the water is whole: a thin line of ground lay along every file's line)
}
float wFace(vec3 ro, vec3 rd, out vec3 hp){
  float t = (W_LEVEL - ro.y)/min(rd.y, -1e-4); hp = ro + rd*t;
  vec2 en = wPlan(hp), lg = wLeg(en); float wb = wWat(wPlanMap(en), hp.xz);
  if (wb < 0. && lg.y < uRideEnd + 20.) {
    float mid = wVn(hp.xz/41. + 17.), fine = wVn(hp.xz/5.7 + 3.);
    float bar = max(max(wBarAt(lg, ${PLAN.trail.lanes[0].toFixed(1)}, mid, fine), wBarAt(lg, ${PLAN.trail.lanes[1].toFixed(1)}, mid, fine)), max(wBarAt(lg, ${PLAN.trail.lanes[2].toFixed(1)}, mid, fine), wBarAt(lg, ${PLAN.trail.lanes[3].toFixed(1)}, mid, fine)));
    wb = max(wb, mix(-1e3, min(bar, 1.4), (1. - smoothstep(uRideEnd - 60., uRideEnd + 20., lg.y))));
  }
  return wb;
}
float wDouble(vec3 hp, vec3 rd, float wat){
  float t = uFcrT, rip = smoothstep(.3, .7, .6*wVn(hp.xz/2.9 + vec2(t*.13, t*.08)) + .4*wVn(hp.xz/.9 + vec2(t*.21, -t*.16) + 3.));
  // fine ripples about five pixels long at every distance break the double into strokes (the land's own law of them)
  float px = length(hp - cameraPosition)*.0031/max(-rd.y, .06), lf = log2(max(px*5., .35)/.35), l0 = floor(lf), k0 = .35*exp2(l0);
  vec2 q = hp.xz + vec2(t*.21, -t*.16);
  float fine = mix(wVn(q/k0), wVn(q/(2.*k0) + 11.7), lf - l0);
  return clamp(1.6*wFres(-rd.y) + .2, 0., .95)*mix(1., .5 + .5*rip, .5)*mix(.42, 1., smoothstep(.28, .66, fine))*(1. - smoothstep(-1.1, -.2, wat));
}
`;

// the rock's height by metres inside its rim (sd, negative inside): rounded ledges of bedded stone, 16 m out of the
// moat. One law for the castle (its mesh) and the forest (the plants on its lower ledges).
export const rockY0 = (sd) => { const t = clamp(-sd, 0, 40); return -4.6 + 5.6 * smoothstep(0, 3.5, t) + 5.2 * smoothstep(7, 11, t) + 5.8 * smoothstep(15, 20, t); };
// the same in the world's metres (the castle group stands K times as great about the moat's level)
export const rockY = (sd) => -4 + PLAN.K * (rockY0(sd / PLAN.K) + 4);

const pick3 = (r, names) => (r < 0.5 ? names[0] : r < 0.75 ? names[1] : names[2]);     // shares 1/2, 1/4, 1/4

export default {
  id: 'the-fire-comes-round',
  name: 'The Fire Comes Round',
  category: 'books',
  placeKind: 'alien',
  book: 'The Player of Games',
  author: 'Iain M. Banks, 1954 to 2013',
  weirdness: 0.6,
  async build(ctx) {
    // EVERY FORK, ONCE, IN ONE LIST. One draw of the visit's generator makes the world's base; all the world's forks
    // come from that base in this fixed order (a later stage adds at the end), so the part's own deal (the line)
    // never moves when the world gains a fork.
    const base = ctx.rng.fork('the-world');
    const forks = {};
    for (const k of ['deal', 'relief', 'sky', 'near', 'mid', 'cards', 'atlas', 'litter', 'streaks', 'carpet', 'lanes', 'runners', 'fliers', 'swimmers', 'castle', 'lamps', 'steam', 'air', 'mist', 'river', 'under', 'gates']) forks[k] = base.fork(k);
    const scene = new THREE.Scene();
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const pause = async () => { await ctx.yield(); };
    const detail = clamp((ctx.quality && ctx.quality.detail) || 1, 0.5, 1);

    // ---------- the deal of this visit (shares as fractions; nothing here asks the seed's number) ----------
    const fd = forks.deal;
    const deal = {
      hour: pick3(fd(), ['dusk', 'night', 'cloud']),               // 1/2 the green-blue remnant of day | 1/4 full night, a small pale moon | 1/4 dusk under high thin cloud
      kind: pick3(fd(), ['pods', 'bottles', 'spires']),            // 1/2 pod-stalks | 1/4 bottle-trunked | 1/4 thin spires hung with strings
      castle: pick3(fd(), ['tiers', 'drum', 'ringwall']),          // 1/2 three tiers, four drum towers | 1/4 two long tiers, one great drum | 1/4 a low ring wall and a keep
      runners: 300 + 12 * Math.floor(fd() * 6), quill: fd.range(0.6, 1.3), tuft: fd.range(0.7, 1.4),
      flierLanes: 3 + Math.floor(fd() * 3), fliers: 380 + 20 * Math.floor(fd() * 8), span: fd.range(4, 6),
      swimmers: 34 + Math.floor(fd() * 13),
      lightning: fd() < 1 / 8,                                     // one visit in eight: dry lightning inside the smoke (the part draws it, on its own dealt schedule)
    };
    deal.wind = pick3(fd(), ['back', 'upright', 'cross']);         // 1/2 the smoke leaning steeply back | 1/4 climbing nearly upright in towers | 1/4 a cross wind drawing it along the front
    const fr = forks.relief;
    const rel = { k: [fr.range(1300, 1700), fr.range(1600, 2200), fr.range(700, 940), fr.range(480, 640)].map((l) => (Math.PI * 2) / l), p: [fr.range(0, 6.2832), fr.range(0, 6.2832), fr.range(0, 6.2832), fr.range(0, 6.2832)] };
    // THE PLAIN'S RELIEF. Slow relief of 5.5 m either way over 500 to 2,000 m, beyond the ground any plan of this
    // world can take (the plan hangs on the part's lobe, which the part deals within 520 m of the Z axis); inside
    // that ground the plain is nearly level (0.7 m either way), so that the waters lie level in it. One function
    // of the place: the part is given it for its flames' feet, and the land is made of it.
    const relief = (x, z) => {
      const far = smoothstep(0, 1300, Math.max(Math.abs(x) - 2300, Math.abs(z - 550) - 1950));
      const small = 0.45 * Math.sin(x * rel.k[2] * 2.3 + rel.p[1]) * Math.sin(z * rel.k[3] * 1.9 + rel.p[0]) + 0.25 * Math.sin((x + 0.7 * z) * rel.k[3] * 3.1 + rel.p[2]);
      if (far <= 0) return small;
      return small + far * (3.0 * Math.sin(x * rel.k[0] + rel.p[0]) * Math.sin(z * rel.k[1] + rel.p[1]) + 1.6 * Math.sin((x + 0.6 * z) * rel.k[2] + rel.p[2]) + 0.9 * Math.sin((x - 0.8 * z) * rel.k[3] + rel.p[3]));
    };

    // ---------- the front (the part): it is given the ground near its line, the haze, and where plants stand ----------
    const hazeCol = new THREE.Color(0.032, 0.050, 0.095);
    const late = { forest: null };
    const hero = await buildHero(ctx, { heightAt: relief, haze: HAZE, hazeColor: hazeCol, forest: (x, z) => (late.forest ? late.forest(x, z) : 0), wind: deal.wind, lightning: deal.lightning });
    scene.add(hero.object);
    await pause();
    const L = hero.layout;
    // THE WIND over the land, from the part's deal (its smoke's own velocity): 'back' draws the low air into the fire,
    // 'upright' is nearly still, 'cross' blows along the line. Plumes, torches, ground smoke, flecks and the castle's
    // steam all lean by this one bearing.
    const wind = (() => { const v = L.vel || [0, 24, -15], h = hyp(v[0], v[2]), x = h > 1e-3 ? v[0] / h : 0, z = h > 1e-3 ? v[2] / h : -1; return { kind: L.wind || 'back', x, z, amp: L.wind === 'upright' ? 0.4 : 1, draw: L.wind === 'cross' ? 0.3 : 1 }; })();
    const rv = [0, 1, 2, 3].map(() => forks.river.range(0, 6.2832));          // the river's own swing and breadth along the ride: four phases dealt by the visit
    const plan = await makePlan(L, relief, pause, rv);
    const { way, wx, wz } = plan, PY = PLAN.y;
    await pause();

    // ---------- the route: the plan's line with the lens's height by place ----------
    const ease = (w, a, b, ya, yb) => lerp(ya, yb, smoothstep(a, b, w));
    // in level over the river among the heads of the giants, then down to the water (10 m over it) within the first
    // fifth of the way; low up the river; up to 24 m over the drowned shallows as the banks fall away, level all along
    // the front and through the turn from the fire; on over the channel to the moat at the same height within a few
    // metres; up to the apron's lip, level to the ring. The steepest slope is 9 degrees.
    const yAt = (w) => {
      if (w <= way.rideLevel) return ease(w, PLAN.level, way.rideLevel, PY.entry, PY.ride);
      if (w <= way.turn2Start) return ease(w, way.rideEnd - 60, way.rideEnd + 140, PY.ride, PY.flat);
      if (w <= way.shore + 122) return ease(w, way.turn2Start, way.shore, PY.flat, PY.moat);
      return ease(w, way.shore + 122, way.apronLip, PY.moat, PY.ring);
    };
    const marks = [];
    const span = (a, b, step) => { const n = Math.max(1, Math.ceil((b - a) / step - 1e-6)); for (let i = 0; i < n; i++) marks.push(a + (b - a) * i / n); };
    span(0, way.rideEnd, 40); span(way.rideEnd, way.turn1End, PLAN.turn1.R * 15 * D2R); span(way.turn1End, way.turn2Start, 40);
    span(way.turn2Start, way.turn2End, PLAN.turn2.R * 15 * D2R); span(way.turn2End, way.ring, 40); marks.push(way.ring);
    const path = makePath(marks.map((w) => { const p = plan.at(w); return [wx(p[0]), yAt(w), wz(p[1])]; }), { samples: 1100 });
    await pause();
    // way (plan metres from the entry) against metres flown: read from the path itself every 2 m
    const NW = Math.ceil(path.length / 2) + 1, wayTab = new Float32Array(NW), q0 = V3(0, 0, 0), q1 = V3(0, 0, 0);
    path.posAtDist(0, q0);
    for (let i = 1; i < NW; i++) { path.posAtDist(Math.min(path.length, i * 2), q1); wayTab[i] = wayTab[i - 1] + hyp(q1.x - q0.x, q1.z - q0.z); q0.copy(q1); }
    const wayK = way.ring / wayTab[NW - 1];
    const wayOfDist = (d) => { const f = clamp(d / 2, 0, NW - 1.001), i = Math.floor(f); return (wayTab[i] + (wayTab[i + 1] - wayTab[i]) * (f - i)) * wayK; };
    const distOfWay = (w) => { let lo = 0, hi = path.length; for (let k = 0; k < 22; k++) { const m = 0.5 * (lo + hi); if (wayOfDist(m) < w) lo = m; else hi = m; } return 0.5 * (lo + hi); };
    const uOfWay = (w) => distOfWay(w) / path.length;
    await pause();
    // GROUND THAT MUST NEVER BURN (rule 19: no flame, brand or scorch touches the castle, its rock or its moat; and no
    // flame can stand in water): every water of the plan, asked of the plan in squares of 6 m and kept as it is
    // asked. The islets of the shallows are ground: a spot fire of the part's may burn on one. AND ALL GROUND WITHIN
    // 64 m OF THE MOAT'S EDGE (stage D, rule 19: no flame of the part's, no low run, no spot fire stands within 60 m
    // of the moat). The part's clearGround is asked with it further down, once the forest stands, and then the
    // route's own clear air.
    // (asked some hundreds of thousands of times by the part's test: the squares about the line are kept in one plain
    // table, 0 not yet asked, 1 dry, 2 never burns; farther off in a map)
    const wetCells = new Map(), WG = { x0: -7302, z0: -900, nx: 2434, nz: 400 }, wetGrid = new Uint8Array(WG.nx * WG.nz); let wetAsked = 0;
    const wet = (x, z) => {
      const i = Math.floor(x / 6), j = Math.floor(z / 6), gi = i - WG.x0 / 6, gj = j - WG.z0 / 6, inG = gi >= 0 && gj >= 0 && gi < WG.nx && gj < WG.nz, k = inG ? gj * WG.nx + gi : (i + 8192) * 16384 + (j + 8192);
      let v = inG ? (wetGrid[k] ? wetGrid[k] === 2 : undefined) : wetCells.get(k);
      if (v === undefined) { const cx = (i + 0.5) * 6, cz = (j + 0.5) * 6; const E = plan.pe(cx), N = plan.pn(cz); v = (cz - L.frontZ(cx) > 40 && !(plan.calmAt(E, N) & 1) && plan.watAt(E, N) < 1.5) || plan.sdMoat(E, N) < 64; wetAsked++; if (inG) wetGrid[k] = v ? 2 : 1; else wetCells.set(k, v); }   // (a calm square of the plan holds no water)
      return v;
    };

    // ---------- the shared uniforms ----------
    const side = plan.m, bearing = (deg, el = 0) => { const b = deg * D2R, c = Math.cos(el * D2R); return V3(side * Math.sin(b) * c, Math.sin(el * D2R), -Math.cos(b) * c); };
    const night = deal.hour === 'night', cloud = deal.hour === 'cloud';
    const glowAz = bearing(265), moonDir = bearing(forks.sky.range(165, 200), forks.sky.range(48, 60));
    const duskDir = night ? moonDir.clone() : bearing(265, 6);
    const TEX = { e0: -800, n0: -400, span: 2500, n: 256 };
    const U = {
      ...hero.uniforms,
      uAmbSky: { value: night ? new THREE.Color(0.30, 0.40, 0.70) : new THREE.Color(0.36, 0.47, 0.78) }, uAmbGnd: { value: new THREE.Color(0.10, 0.10, 0.15) },
      uDuskCol: { value: night ? new THREE.Color(0.20, 0.26, 0.36) : new THREE.Color(0.10, 0.19, 0.31) }, uDuskDir: { value: duskDir },
      uHazeCol: { value: hazeCol }, uHaze: { value: new THREE.Vector2(HAZE, HAZE_FAR) }, uPodMap: { value: null },
      uPlan: { value: new THREE.Vector4(plan.ox, plan.oz, side, 0) }, uRideEnd: { value: plan.Nt }, uPlanTex: { value: new THREE.Vector4(TEX.e0, TEX.n0, 1 / TEX.span, 0) }, uPlanMap: { value: null },
      uZen: { value: new THREE.Color(0.012, 0.022, 0.066) }, uMid: { value: new THREE.Color(0.021, 0.038, 0.100) }, uHor: { value: new THREE.Color(0.055, 0.095, 0.185) },
      uGlowCol: { value: night ? new THREE.Color(0.004, 0.008, 0.012) : new THREE.Color(0.030, 0.072, 0.125) }, uMoonDir: { value: moonDir },
      uSkyK: { value: new THREE.Vector4(glowAz.x, glowAz.z, cloud ? 1 : 0, night ? 1 : 0) },
      uWind: { value: new THREE.Vector4(wind.x, wind.z, wind.amp, wind.draw) },
    };

    // ---------- the plan map (256 x 256 over 2.5 km): what stands where, for every shader ----------
    // r metres outside the shallows, g metres outside the water's drawn edge, b metres outside the ground where an
    // islet may stand (each signed: 0.5 = the edge, 160 m to the byte's range; the shaders add the banks' wander and
    // the islets themselves, by the same law as the script); a the canopy's carpet: the forest beyond the ground where plants stand singly (the corridor along the low
    // route, the ground between the route and the line, the castle's surroundings).
    const g = plan.g, T1s = g.P1, cst = plan.castle, segD = plan.segD;
    const legD = (E, N) => { const q = plan.legOf(E, N), dv = q[1] < 300 ? 300 - q[1] : q[1] > plan.Nt ? q[1] - plan.Nt : 0; return hyp(q[0], dv); };   // metres from the route's line up the river
    const zoneD = (E, N) => {
      let c = Math.min(legD(E, N) - 150, segD(E, N, T1s, g.T1e) - 210, segD(E, N, g.T1e, g.S2) - 200, segD(E, N, g.S2, g.T2e) - 200, segD(E, N, g.T2e, g.castle) - 190, hyp(E - cst.E, N - cst.N) - 330 * PLAN.K);
      if (c > 0 && c < 260 && N > T1s[1] - 100) { const d = plan.lineG(E, N); if (d < 330) c = Math.min(c, d - 330); }     // and all the ground between the route and the line
      return c;
    };
    const map = new Uint8Array(TEX.n * TEX.n * 4), cell = TEX.span / TEX.n, byte = (v) => Math.round(clamp(v, 0, 1) * 255);
    // Asked at every fourth cell first. A block of cells whose four corners all stand more than 62 m from every edge
    // (its own diagonal is 55 m, and each field changes by no more than a metre in a metre) holds no edge: its cells
    // take the corners' values between them. Every other block is asked cell by cell.
    const BL = 4, NB = TEX.n / BL + 1, cs = new Float32Array(NB * NB * 4), EDGE = 62;
    const ask = (E, N, out, o) => { out[o] = plan.sdAsh(E, N); out[o + 1] = plan.watBase(E, N); out[o + 2] = -plan.isletOK(E, N); out[o + 3] = zoneD(E, N); };
    const askRow = (j) => { for (let i = 0; i < NB; i++) ask(TEX.e0 + (i * BL + 0.5) * cell, TEX.n0 + (j * BL + 0.5) * cell, cs, (j * NB + i) * 4); };   // (plain functions for the rows: see the plan's calm grid)
    for (let j = 0; j < NB; j++) { askRow(j); if (j % 32 === 31) await pause(); }
    const put = (o, sa, wb, io, zd) => { map[o] = byte(0.5 + sa / 160); map[o + 1] = byte(0.5 + wb / 160); map[o + 2] = byte(0.5 + io / 160); map[o + 3] = byte(smoothstep(8, 20, wb) * smoothstep(0, 28, zd)); };
    const one = new Float32Array(4); let asked = 0;
    const bakeRow = (bj) => {
      let done = 0;
      for (let bi = 0; bi < NB - 1; bi++) {
        const c0 = (bj * NB + bi) * 4, c1 = c0 + 4, c2 = c0 + NB * 4, c3 = c2 + 4; let calm = true;
        for (const c of [c0, c1, c2, c3]) if (Math.abs(cs[c]) <= EDGE || Math.abs(cs[c + 1]) <= EDGE || Math.abs(cs[c + 2]) <= EDGE || (cs[c + 1] > 0 && Math.abs(cs[c + 3]) <= EDGE)) { calm = false; break; }   // (the carpet's own edge lies 8 to 20 m behind a bank: within the water's reach)
        for (let v = 0; v < BL; v++) for (let u = 0; u < BL; u++) {
          const o = ((bj * BL + v) * TEX.n + bi * BL + u) * 4;
          if (calm) { const a = u / BL, b = v / BL, f = (k) => lerp(lerp(cs[c0 + k], cs[c1 + k], a), lerp(cs[c2 + k], cs[c3 + k], a), b); put(o, f(0), f(1), f(2), f(3)); }
          else if (u === 0 && v === 0) put(o, cs[c0], cs[c0 + 1], cs[c0 + 2], cs[c0 + 3]);
          else { ask(TEX.e0 + (bi * BL + u + 0.5) * cell, TEX.n0 + (bj * BL + v + 0.5) * cell, one, 0); put(o, one[0], one[1], one[2], one[3]); }
        }
        done += calm ? 1 : BL * BL;
      }
      return done;
    };
    for (let bj = 0; bj < NB - 1; bj++) { asked += bakeRow(bj); if (asked >= 1500) { asked = 0; await pause(); } }   // (a pause every few milliseconds of asking)
    const planMap = new THREE.DataTexture(map, TEX.n, TEX.n, THREE.RGBAFormat);
    planMap.magFilter = planMap.minFilter = THREE.LinearFilter; planMap.wrapS = planMap.wrapT = THREE.ClampToEdgeWrapping; planMap.generateMipmaps = false; planMap.needsUpdate = true;
    U.uPlanMap.value = planMap;
    // THE POD MAP (512 x 512 over the same ground): the amber light the ripe plants' pods lay on the ground and the
    // water under them, by place. The forest part fills it from its own plants once they are dealt.
    const podData = new Uint8Array(512 * 512), podMap = new THREE.DataTexture(podData, 512, 512, THREE.RedFormat);
    podMap.magFilter = podMap.minFilter = THREE.LinearFilter; podMap.wrapS = podMap.wrapT = THREE.ClampToEdgeWrapping; podMap.generateMipmaps = false; podMap.needsUpdate = true;
    U.uPodMap.value = podMap;
    await pause();

    // ---------- the land: one mesh, fine under the route, coarse to the horizon; the waters are painted on it ----------
    const lines = (base, extra, lo, hi, step) => {
      let a = []; for (let v = base[0]; v <= base[1] + 1e-6; v += step) a.push(v);
      for (const [e0, e1, s] of extra) { a = a.filter((v) => v < e0 - s * 0.6 || v > e1 + s * 0.6); for (let v = e0; v <= e1 + 1e-6; v += s) a.push(v); }
      a.sort((p, q) => p - q);
      let s = step, v = a[0]; while (v > lo) { s *= 1.3; v -= s; a.unshift(Math.max(v, lo)); }
      s = step; v = a[a.length - 1]; while (v < hi) { s *= 1.3; v += s; a.push(Math.min(v, hi)); }
      return a;
    };
    const mo = PLAN.moat, cor = [[mo.a[0], mo.c[0]], [mo.a[1], mo.c[0]], [mo.a[1], mo.c[1]], [mo.a[0], mo.c[1]]].map(([a, c]) => plan.fromLocal(a, c));
    const cbE = [Math.min(...cor.map((p) => p[0])) - 30, Math.max(...cor.map((p) => p[0])) + 30], cbN = [Math.min(...cor.map((p) => p[1])) - 30, Math.max(...cor.map((p) => p[1])) + 30];
    const lineN = plan.oz - L.zLo + 140;                                    // the farthest north the line stands, and the 60 m behind it
    // fine over the river (its banks are modelled), 12 m over the shallows and the moat; where the plan's lie would
    // make the mesh heavier than 51,000 triangles every spacing is widened alike until it is not
    let gE, gN;
    for (let k = 1, pass = 0; pass < 4; pass++) {
      gE = lines([-230, Math.max(cbE[1] + 80, 700)], [[-70, T1s[0] + 82, 4.3 * k], [T1s[0] + 82, T1s[0] + 300, 12 * k], [cbE[0], cbE[1], 12 * k]], -15000, 15000, 24 * k);
      gN = lines([-250, Math.max(cbN[1] + 80, T1s[1] + 420)], [[120, T1s[1] + 50, 10 * k], [T1s[1] + 50, T1s[1] + 400, 12 * k], [cbN[0], cbN[1], 12 * k]], -9000, Math.max(lineN, cbN[1] + 200), 24 * k);
      const t = (gE.length - 1) * (gN.length - 1) * 2; if (t <= 51000) break;
      k *= Math.sqrt(t / 51000) * 1.01;
    }
    const nE = gE.length, nN = gN.length, gpos = new Float32Array(nE * nN * 3), gnor = new Float32Array(nE * nN * 3), gidx = new Uint32Array((nE - 1) * (nN - 1) * 6);
    const posRow = (j) => { const z = wz(gN[j]); for (let i = 0; i < nE; i++) { const o = (j * nE + i) * 3, x = wx(gE[i]); gpos[o] = x; gpos[o + 1] = plan.groundAt(x, z); gpos[o + 2] = z; } };   // (plain functions for the rows: see the plan's calm grid)
    const norRow = (j) => {
      for (let i = 0; i < nE; i++) {
        const o = (j * nE + i) * 3, i0 = Math.max(i - 1, 0), i1 = Math.min(i + 1, nE - 1), j0 = Math.max(j - 1, 0), j1 = Math.min(j + 1, nN - 1);
        const a = (j * nE + i0) * 3, b = (j * nE + i1) * 3, c = (j0 * nE + i) * 3, d = (j1 * nE + i) * 3;
        const nx = -(gpos[b + 1] - gpos[a + 1]) / (gpos[b] - gpos[a]), nz = -(gpos[d + 1] - gpos[c + 1]) / (gpos[d + 2] - gpos[c + 2]), l = hyp3(nx, 1, nz);
        gnor[o] = nx / l; gnor[o + 1] = 1 / l; gnor[o + 2] = nz / l;
      }
    };
    const idxAll = () => { for (let j = 0, k = 0; j < nN - 1; j++) for (let i = 0; i < nE - 1; i++) { const p = j * nE + i, q = p + nE; gidx[k++] = p; gidx[k++] = q; gidx[k++] = p + 1; gidx[k++] = p + 1; gidx[k++] = q; gidx[k++] = q + 1; } };
    for (let j = 0; j < nN; j++) { posRow(j); if (j % 28 === 27) await pause(); }
    for (let j = 0; j < nN; j++) { norRow(j); if (j % 64 === 63) await pause(); }
    await pause();
    idxAll();
    const ggeo = new THREE.BufferGeometry(); ggeo.setAttribute('position', new THREE.BufferAttribute(gpos, 3)); ggeo.setAttribute('normal', new THREE.BufferAttribute(gnor, 3)); ggeo.setIndex(new THREE.BufferAttribute(gidx, 1));
    await pause();
    const ringPos = (() => { const p = plan.at(way.ring); return V3(wx(p[0]), PY.ring, wz(p[1])); })();
    const landU = {
      ...U,
      uCastC: { value: new THREE.Vector4(cst.x, cst.z, 0, 0) }, uCastA: { value: new THREE.Vector4(cst.ax, cst.az, cst.rx, cst.rz) }, uRing: { value: ringPos },
      uMoat: { value: new THREE.Vector4(0.5 * (mo.a[0] + mo.a[1]), 0.5 * (mo.c[0] + mo.c[1]), 0.5 * (mo.a[1] - mo.a[0]) - mo.r, 0.5 * (mo.c[1] - mo.c[0]) - mo.r) },
      uBoxLo: { value: [V3(0, 0, 0), V3(0, 0, 0)] }, uBoxHi: { value: [V3(0, -1, 0), V3(0, -1, 0)] }, uStone: { value: new THREE.Color(0.2, 0.2, 0.22) },
      uOutA: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 0, 0)) }, uOutB: { value: Array.from({ length: 12 }, () => new THREE.Vector4(0, 0, 0, 0)) },   // the castle's outline (its part's gift): see the land's shader
      uOutNight: { value: new THREE.Color(0.14, 0.168, 0.235) }, uOutLit: { value: new THREE.Color(0.6, 0.48, 0.33) }, uOutK: { value: V3(0, 5.6, 1.45) },
    };
    const landMat = new THREE.ShaderMaterial({
      side: THREE.DoubleSide, uniforms: landU,
      vertexShader: /* glsl */`
        varying vec3 vW; varying vec3 vN;
        void main(){ vW = position; vN = normal; gl_Position = projectionMatrix*viewMatrix*vec4(position, 1.); }`,
      fragmentShader: hero.glsl.front + hero.glsl.noise + hero.glsl.ramp + hero.glsl.ground + hero.glsl.mirror + WORLD_GLSL + AIR_GLSL + LAND_FRAG,
    });
    const land = new THREE.Mesh(ggeo, landMat); land.name = 'land'; land.frustumCulled = false; land.renderOrder = -10; scene.add(land);   // first of all: what the water doubles (the parts' mirror passes) is drawn straight after it, against its depth alone
    await pause();

    // ---------- the sky, whole: one far-plane pass, fixed by compass, never by the eye's place ----------
    // Deep dusk, a paler band of haze all round the land, the day's cool remnant low to one side (or a small moon,
    // or high thin cloud over the fire's half). Stars over the whole dome, a denser band high overhead; they never
    // switch off: toward the fire they thin by one smooth law of bearing and elevation and by the glow of the low
    // air along the ray. The fire's part of the sky is the part's smoke, drawn over this.
    const skyMat = new THREE.ShaderMaterial({
      depthWrite: false, depthTest: true, side: THREE.BackSide, uniforms: U,
      vertexShader: /* glsl */`
        varying vec3 vDir;
        void main(){ vDir = position; vec4 p = projectionMatrix*vec4(mat3(viewMatrix)*position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`,
      fragmentShader: hero.glsl.front + hero.glsl.noise + WORLD_GLSL + SKY_FRAG,
    });
    const sky = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 2), skyMat); sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = 10; scene.add(sky);
    scene.background = hazeCol.clone();
    await pause();

    // ---------- the parts: the forest, the castle with its waters, the animals ----------
    const routePts = []; for (let d = 0; d <= path.length; d += 2) { const p = path.posAtDist(d); p.way = wayOfDist(d); routePts.push(p); }
    const env = { ctx, scene, hero, L, wind, plan, path, way, U, forks, deal, detail, pause, COMFORT, PLAN, HAZE, podMap: { data: podData, n: 512, e0: TEX.e0, n0: TEX.n0, span: TEX.span, tex: podMap }, trailE, yAt, wayOfDist, distOfWay, routePts, side, ringPos, zoneD, rockY, rockY0, TEX,
      glsl: { front: hero.glsl.front, noise: hero.glsl.noise, ramp: hero.glsl.ramp, mirror: hero.glsl.mirror, world: WORLD_GLSL, water: FACE_GLSL, air: AIR_GLSL } };
    env.lanes = await layLanes(env);                         // where the files run: laid first, so that nothing is dealt on a lane
    const forest = await buildForest(env); if (forest.object) scene.add(forest.object); late.forest = forest.heightAt || null; env.forest = forest;
    await pause();
    // THE PART'S GIFTS, in its order: it takes the forest (its belt lies where our plants stand, and black stalks of
    // their height stand among its flames); it clears the grounds that must never burn; it clears the route's air
    // and lays its sparks' tube along the route.
    const took = await hero.takeForest();
    await pause();
    const kept = await hero.clearGround(wet, 5, 0.35); kept.points = wetAsked;   // (the part's reach: a flame's body keeps 5 m from the water, the empty air of its card does not count, so the line stays standing at a shore)
    await pause();
    const clear = await hero.clearRoute(path, 8);
    // RULE 19 IN THE AIR (stage F2): the part's sparks and brands are kept out of the air over the MOAT'S OUTER EDGE
    // (the rock and the castle inside it; not the wet ground, which holds every water of the plan) and 60 m about
    // it: the part bakes a map by place once, here, and each spark asks it at its own place (the lens's place is not
    // asked). PROVED BY CONSTRUCTION: the share of a spark left is asked every 4 m on the moat's ground and out to
    // 60 m from its edge (nought there, or the flag is false), and along the route's run by the fire (which keeps
    // its sparks: the least metres from that run to where the keep-out begins are printed)
    // THE AREA IS HANDED AS A LIST OF PLACES (the part takes either; with the function its one baking step ran over 50 ms):
    // 200 places ON the moat's outer edge (it is convex about the castle: found by halving along a ray from the castle
    // every 1.8 degrees; neighbours lie up to 18.3 m apart, so a place 60 m from the edge midway between two of them
    // is under 60.7 m from both) and the moat's inside every 56 m; the margin asked is 61 m for that
    await pause();
    const moatIn = (x, z) => plan.sdMoat(plan.pe(x), plan.pn(z)) < 0, moatEdge = [], c0 = plan.castle;
    if (moatIn(c0.x, c0.z)) {
      for (let k = 0; k < 200; k++) { const a = (k / 200) * 6.2832, ux = Math.cos(a), uz = Math.sin(a); let lo = 0, hi = 1200; for (let i = 0; i < 18; i++) { const m = 0.5 * (lo + hi); if (moatIn(c0.x + ux * m, c0.z + uz * m)) lo = m; else hi = m; } moatEdge.push({ x: c0.x + ux * lo, z: c0.z + uz * lo }); }
      for (let x = c0.x - 1008; x <= c0.x + 1008; x += 56) for (let z = c0.z - 1008; z <= c0.z + 1008; z += 56) if (plan.sdMoat(plan.pe(x), plan.pn(z)) < -12) moatEdge.push({ x, z });
    }
    await pause();
    const keptAir = hero.keepBrands ? await hero.keepBrands(moatEdge.length ? moatEdge : moatIn, 61) : null;
    await pause();
    {
      const A = { need: 60, ok: false, found: !!(keptAir && keptAir.found) };
      if (A.found) {
        const M = keptAir.map; let most = 0, n = 0, begin = Infinity, full = 0, asked = 0;
        for (let x = M.x0; x <= M.x1; x += 4) for (let z = M.z0; z <= M.z1; z += 4) {
          const sd = plan.sdMoat(plan.pe(x), plan.pn(z)); if (sd > 140) continue; const a = keptAir.at(x, z);
          if (sd <= 60) { n++; if (a > most) most = a; } else { if (a > 0 && sd < begin) begin = sd; if (a < 1 && sd > full) full = sd; }
          if (++asked > 30000) { asked = 0; await pause(); }
        }
        await pause();
        let runLeast = Infinity, runShare = 1, runSoft = 0;
        for (let w = way.runIn; w <= way.runOut; w += 6) { const q = path.posAtDist(distOfWay(w)), sd = plan.sdMoat(plan.pe(q.x), plan.pn(q.z)), a = keptAir.at(q.x, q.z); if (sd < runLeast) runLeast = sd; if (a < runShare) runShare = a; if (a < 0.999) runSoft += 6; }
        Object.assign(A, { ok: n > 0 && most === 0, placesHanded: keptAir.squares, margin: keptAir.margin, soft: keptAir.soft, placesAskedWithin60: n, mostShareWithin60: most, sparksBeginAtMetresFromTheMoat: +begin.toFixed(1), fullFromMetres: +full.toFixed(1),
          theRunByTheFire: { leastToTheMoat: +runLeast.toFixed(1), leastToTheKeepOut: +(runLeast - full).toFixed(1), leastShare: +runShare.toFixed(3), metresOfItInTheSoftEdge: runSoft, itsLength: Math.round(way.runOut - way.runIn), keepsItsSparks: runShare >= 0.999 } });
      }
      clear.air = A;
    }
    clear.openGround = kept; clear.forest = took;
    // RULE 19 AT THE MOAT, TESTED IN BUILD (stage D): the least metres from the moat's edge to the part's line (its
    // flames stand behind the line; what it lays before the line was taken off all ground within 64 m of the moat
    // by its own clearGround, above), and to everything of the forest that catches or glows (the forest's own test)
    let lineToMoat = Infinity; for (let x = -3000; x <= 3000; x += 12) { const s = plan.sdMoat(plan.pe(x), plan.pn(L.frontZ(x))); if (s < lineToMoat) lineToMoat = s; }
    clear.moat = { need: 60, thePartsLine: +lineToMoat.toFixed(1), thePartsFlamesBeforeItsLine: 'none on any ground within 64 m of the moat (taken off by the part)', takenByThePart: { tongues: kept.tonguesTaken, spotFires: kept.spotsTaken, burstPlaces: kept.burstsTaken } };
    await pause();
    const castle = await buildCastle(env); if (castle.object) scene.add(castle.object); env.castle = castle;
    if (castle.mirror) { castle.mirror.lo.forEach((v, i) => landU.uBoxLo.value[i].copy(v)); castle.mirror.hi.forEach((v, i) => landU.uBoxHi.value[i].copy(v)); landU.uStone.value.copy(castle.mirror.color); }
    // THE OUTLINE THE MOAT DOUBLES (the castle part's gift, its round 2): up to twelve plain bodies, nearest first, each
    // a box or a drum in the castle's frame, with how far it stands on the fire's side; and the colours to double it with
    if (castle.outline && castle.outline.pieces && castle.outline.pieces.length) {
      const O = castle.outline, n = Math.min(12, O.pieces.length);
      for (let i = 0; i < n; i++) {
        const q = O.pieces[i];
        if (q.kind === 'drum') { landU.uOutA.value[i].set(q.at.x, q.at.y, q.at.z, q.fire); landU.uOutB.value[i].set(q.r, q.top, 0, 2); }
        else { landU.uOutA.value[i].set(q.lo.x, q.lo.y, q.lo.z, q.fire); landU.uOutB.value[i].set(q.hi.x, q.hi.y, q.hi.z, 1); }
      }
      landU.uOutNight.value.copy(O.night); landU.uOutLit.value.copy(O.lit); landU.uOutK.value.set(n, O.gain, O.ceil);
    }
    await pause();
    const life = await buildLife(env); if (life.object) scene.add(life.object); env.life = life;
    await pause();
    const ground = await buildGround(env); scene.add(ground.object);
    await pause();
    if (forest.info && forest.info.moatLeast) { Object.assign(clear.moat, forest.info.moatLeast); clear.moat.ok = forest.info.moatLeast.ok && lineToMoat >= 60; }
    // NO BOWED GIANT OF A GATE BURNS (the forest refuses a gate's giant within a belt, at its deal): their count, nought by construction
    if (forest.info) clear.gates = { bowedGiantsThatBurn: forest.info.bowedThatBurn, ok: forest.info.bowedThatBurn === 0 };

    // ---------- flecks and plume-down in the air: dealt by place along the route's corridor, thicker toward the front ----------
    // Each belongs to a place (it drifts toward the fire over 40 m of its own and begins again); none follows the
    // lens, and none is dealt whose drift comes within 6 m of the route's line.
    const fa = forks.air, NF = Math.round(1500 * detail), fA = new Float32Array(NF * 4), fB = new Float32Array(NF * 4), tmp = V3(0, 0, 0);
    let nf = 0;
    const RC = 32, rcells = new Map(), rk = (i, j) => (i + 4096) * 8192 + (j + 4096);   // the route's points in squares of 32 m
    for (const p of routePts) { const k = rk(Math.floor(p.x / RC), Math.floor(p.z / RC)); let c = rcells.get(k); if (!c) rcells.set(k, (c = [])); c.push(p); }
    const nearRoute = (x, z, y) => {                                 // a place within 28 m of the route's line in plan and 14 m of its height
      const i0 = Math.floor((x - 28) / RC), i1 = Math.floor((x + 28) / RC), j0 = Math.floor((z - 28) / RC), j1 = Math.floor((z + 28) / RC);
      for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) { const c = rcells.get(rk(i, j)); if (c) for (const p of c) if (Math.abs(p.y - y) < 14 && hyp(p.x - x, p.z - z) < 28) return true; }
      return false;
    };
    const mote = () => {                                             // (a plain function: see the plan's calm grid)
      const d = fa() * path.length, p = path.posAtDist(d, tmp), x = p.x + fa.range(-70, 70), z = p.z + fa.range(-70, 70), dy = fa.range(-22, 26), ph = fa(), sp = fa.range(1.5, 4), sz = fa.range(0.05, 0.12);
      if (fa() > 0.25 + 0.75 * Math.exp(-Math.max(plan.lineD(p.x, p.z), 0) / 420)) return;
      const y = Math.max(plan.groundAt(x, z) + 1.5, p.y + dy);
      let ok = true;
      for (let k = -1; k <= 1 && ok; k++) if (nearRoute(x + wind.x * k * 20, z + wind.z * k * 20, y)) ok = false;   // its whole drift keeps well over 6 m from the line
      if (!ok) return;
      if (plan.sdMoat(plan.pe(x), plan.pn(z)) < 86) { fa(); fa(); return; }       // (stage E, rule 19 by construction: no fleck of the air within 60 m of the moat's edge, its whole drift)
      fA.set([x, y, z, ph], nf * 4); fB.set([sp, sz, fa(), fa()], nf * 4); nf++;
    };
    for (let tries = 0; tries < NF * 6 && nf < NF; tries++) { if (tries % 1300 === 1299) await pause(); mote(); }
    const fgeo = new THREE.InstancedBufferGeometry();
    fgeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
    fgeo.setAttribute('aQ', new THREE.Float32BufferAttribute([-1, -1, 1, -1, 1, 1, -1, 1], 2)); fgeo.setIndex([0, 1, 2, 0, 2, 3]);
    fgeo.setAttribute('aA', new THREE.InstancedBufferAttribute(fA, 4)); fgeo.setAttribute('aB', new THREE.InstancedBufferAttribute(fB, 4)); fgeo.instanceCount = nf;
    const fleckMat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { ...U, uPix: hero.all.uPix },
      vertexShader: hero.glsl.front + WORLD_GLSL + /* glsl */`
        attribute vec2 aQ; attribute vec4 aA, aB; uniform float uPix; varying vec2 vQ; varying vec3 vC;
        void main(){
          float ph = fract(uFcrT*aB.x/40. + aA.w);                                   // 40 m of drift down the wind, then again (the world clock)
          vec3 c = aA.xyz; c.xz += uWind.xy*(40.*(ph - .5));
          c.x += 1.6*sin(uFcrT*.7*aB.z + aB.w*40.) + .8*sin(uFcrT*1.9 + aB.w*17.); c.y += 1.1*sin(uFcrT*.9 + aB.z*30.) - 3.*(ph - .5)*aB.w;
          vec4 Lf = fcrLight(c);
          vec4 mv = viewMatrix*vec4(c, 1.); float dist = max(length(mv.xyz), .1), s = aB.y, sz = max(s, dist*uPix*1.2);
          float str = (s*s)/(sz*sz)*smoothstep(0., .12, ph)*(1. - smoothstep(.88, 1., ph))*(1. - wFogAt(dist))*smoothstep(1.5, 5., dist);
          vC = (uAmbSky*.5 + uFire*3.*Lf.w)*.34*str;
          mv.xy += aQ*sz*vec2(1.6, 1.); gl_Position = projectionMatrix*mv; vQ = aQ;
        }`,
      fragmentShader: /* glsl */`
        varying vec2 vQ; varying vec3 vC;
        void main(){ float r2 = dot(vQ, vQ), g = exp(-r2*2.6)*max(1. - r2, 0.); if (g < .01) discard; gl_FragColor = vec4(vC*g, 0.); }`,
    });
    const flecks = new THREE.Mesh(fgeo, fleckMat); flecks.name = 'flecks'; flecks.frustumCulled = false; flecks.renderOrder = 8; scene.add(flecks);
    await pause();

    // ---------- CLEAR AIR: the route walked every 2 m against every body's whole reach; the result chooses the place ----------
    const air = [];
    for (const part of [forest, castle, life, ground]) if (part.clearAir) { for (const r of await part.clearAir(routePts, 2.0)) air.push(r); await pause(); }
    air.push({ kind: 'the front (sheet of flame)', least: clear.nearestSheet, note: `${clear.tonguesTaken} tongues, ${clear.burstsTaken} burst places taken away by the part` });

    // ---------- pace and gaze: the lens's own, by place (metres of way from places of the plan) ----------
    const SP = PLAN.speed;
    const kn = [[0, SP.high], [110, SP.high],                         // in among the giants' heads
      [way.rideLevel, SP.bed], [way.rideEnd - 40, SP.bed],           // down at the water and up the river
      [way.rideEnd + 90, SP.flat], [way.runIn + 40, SP.run],         // out over the shallows; slower where the wall of fire stands beside us (it is to be looked at)
      [way.turn2Start - 20, SP.run], [way.turn2Start + 70, SP.turn], // the turn from the fire, over the channel
      [way.shore - 46, SP.shore], [way.shore + 54, SP.moat],         // the castle is to be looked at
      [way.shore + 150, SP.court], [way.ring, SP.court]];            // an even pace over the moat and the court, never quickening
    const knots = []; for (const k of kn) knots.push([Math.min(Math.max(k[0], knots.length ? knots[knots.length - 1][0] + 30 : 0), way.ring), k[1]]);   // each change of pace has 30 m at the least
    const speedAt = (w) => { for (let k = 0; k < knots.length - 1; k++) if (w <= knots[k + 1][0]) return lerp(knots[k][1], knots[k + 1][1], smoothstep(knots[k][0], knots[k + 1][0], w)); return knots[knots.length - 1][1]; };
    let duration = 0; for (let d = 1; d < path.length; d += 2) duration += 2 / speedAt(wayOfDist(d));
    const mean = path.length / duration, pace = (u) => speedAt(wayOfDist(u * path.length)) / mean;
    const secs = (wA, wB) => { let t = 0; for (let d = distOfWay(wA) + 1; d < distOfWay(wB); d += 2) t += 2 / speedAt(wayOfDist(d)); return t; };
    // FIRST GAZE PULL (the castle is shown early as a goal): from the entry, while the lens is still among the giants'
    // heads, the gaze is held on a place between the fire's foot at the river's end and the castle (half the way
    // toward the castle; three parts in ten until stage D, which left the castle cut by the picture's edge), so that
    // the wall stands ahead and the castle whole to one side of the picture over the dark forest; it is given back over the 120 m before the lens is down at the water.
    const cst0 = plan.castle, bedEnd = V3(lerp(wx(0), cst0.x, 0.5), 20, lerp(L.frontZ(wx(0)), cst0.z, 0.5)), uLevel = uOfWay(way.rideLevel), uGiven = uLevel, ramp1 = uOfWay(way.rideLevel) - uOfWay(way.rideLevel - 120);
    // SECOND GAZE PULL (the long span of the run along the front): from 40 m before the ride's north end to 30 m
    // BEFORE the last turn's beginning the gaze is held toward the fire, 42 degrees off the heading at weight 0.9
    // (38 degrees in the picture), a little upward, easing in and out over 170 m: the wall stays in the picture
    // through the first turn and along the run, and as it leaves the picture the castle across the water takes it.
    const gz = V3(0, 0, 0), gt = V3(0, 0, 0), lookA = -side * 42 * D2R, lc = Math.cos(lookA), ls = Math.sin(lookA);
    const fireSide = (time, u) => { const d = u * path.length; path.posAtDist(d, gz); path.tangentAtDist(d, gt); const l = hyp(gt.x, gt.z) || 1; gz.x += (gt.x * lc - gt.z * ls) / l * 300; gz.z += (gt.x * ls + gt.z * lc) / l * 300; gz.y += 14; return gz; };
    const pullFrom = way.rideEnd - 40, pullTo = way.turn2Start - 30;   // (stage F: the fire lets the gaze go 30 m before the turn's beginning, eased over 170 m; it held it to 20 m past it)
    // THIRD GAZE PULL (as the fire leaves the picture the castle across the water takes it): from 130 m before the
    // place where the route last stands within 172 m of the line (the run's end, by the plan; or before the last
    // turn's beginning, if that comes first) to 60 m past the last turn's end the gaze is drawn toward the castle at
    // weight 0.9, easing in and out over 150 m and never over more than half its span (stage D: 0.6, 40 m, from
    // 200 m before; to stage F the weight was 0.7). Beyond the turn the route's own line leads to the castle.
    const seeFrom = Math.min(way.runOut, way.turn2Start) - 130, seeTo = way.turn2End + 60, castleAt = V3(cst0.x, PY.moat + 8, cst0.z);
    const pois = [
      { at: bedEnd, from: -ramp1 * 1.05, to: uGiven, fade: ramp1 / (uGiven + ramp1 * 1.05), weight: 0.8 },
      { at: fireSide, from: uOfWay(pullFrom), to: uOfWay(pullTo), fade: 170 / (pullTo - pullFrom), weight: 0.9 },
      { at: castleAt, from: uOfWay(seeFrom), to: uOfWay(seeTo), fade: Math.min(0.5, 150 / (seeTo - seeFrom)), weight: 0.9 },   // (stage F: weight 0.9 for 0.7: from the turn's beginning the castle stands near the picture's middle)
    ];

    const tri = { front: hero.triangles, land: gidx.length / 3, sky: 12, forest: forest.triangles || 0, castle: castle.triangles || 0, life: life.triangles || 0, ground: ground.triangles, air: nf * 2 };
    const callsOf = { front: hero.calls, land: 1, sky: 1, forest: forest.calls || 0, castle: castle.calls || 0, life: life.calls || 0, ground: ground.calls, air: 1 };
    return {
      scene, path, duration, pace, style: 'none',
      camera: { fov: 62, near: 0.5, far: 17000, lookAhead: 60, sway: 0, bank: 0.35 },       // bank: 2.6 degrees at the most on the tighter turn
      pois,
      portal: { shape: 'circle', radius: COURT.ring.portal * PLAN.K, color: '#4FE0C8', glow: 0.9, style: 'ring', revealDistance: path.length - distOfWay(way.turn2Start - 150), blendDistance: 40 },
      post: { exposure: 1.0, bloom: { strength: 0.42, radius: 0.6, threshold: 0.92 },
        grade: { saturation: 1.06, contrast: 1.05, shadowTint: '#060A1E', vignette: 0.3, grain: 0.02, aberration: 0 } },
      // what this seed deals, for the report (read back from the running world, never from memory)
      deal: { ...deal, side, fit: plan.fit, lobe: [L.lobe.x, L.lobe.z], way, length: path.length, duration, meanSpeed: mean, seconds: { besideTheFire: secs(way.runIn, way.runOut), gazeOnTheFire: secs(pullFrom, pullTo), toTheWater: secs(0, way.rideLevel), upTheRiver: secs(way.rideLevel, way.rideEnd), turnToTheShore: secs(way.turn2Start, way.shore), lastLeg: secs(way.shore, way.ring) }, air, tri, calls: callsOf,
        triangles: Object.values(tri).reduce((a, b) => a + b, 0), forest: forest.info, castleInfo: castle.info, life: life.info, ground: ground.info, clear,
        places: Object.fromEntries(Object.entries(way).filter(([, v]) => typeof v === 'number').map(([k, v]) => [k, [Math.round(v), +uOfWay(v).toFixed(3)]])) },
      update(dt, time, camera, u) {
        hero.update(dt, time, camera);
        if (forest.update) forest.update(dt, time, camera);
        if (castle.update) castle.update(dt, time, camera);
        if (life.update) life.update(dt, time, camera);
      },
      dispose() { hero.dispose(); },
    };
  },
};

// ---------- the land's fragment shader: ground and waters by place ----------
const LAND_FRAG = /* glsl */`
#define FIRE_LAND 2.2
uniform float uRideEnd; uniform vec4 uCastC, uCastA, uMoat; uniform vec3 uRing; uniform vec3 uBoxLo[2], uBoxHi[2]; uniform vec3 uStone;
uniform vec4 uOutA[12], uOutB[12]; uniform vec3 uOutNight, uOutLit, uOutK;   // the castle's outline: A a box's low corner or a drum's middle at its foot, w how far on the fire's side; B a box's high corner or a drum's girth and top, w 1 a box, 2 a drum; K: how many, the lit colour's gain and ceiling
varying vec3 vW; varying vec3 vN;
vec2 gDx, gDy;
// value noise from the shared texture, filtered by the pixel's footprint: far ground goes to its mean, no shimmer
float gn(vec2 p, float s){ vec2 i = floor(p), f = fract(p); f = f*f*(3. - 2.*f); return textureGrad(uNoise, (i + f + .5)/256., gDx*s/256., gDy*s/256.).b; }
// a crisp edge in a field (v against a level), as wide as the pixel allows: no soft smear under the eye
float cut(float v, float level, float k, float px){ float w = clamp(px*k, .004, .5); return smoothstep(level - w, level + w, v); }
// how much of a box a ray goes through (0..1 over the first 7 m of its way inside it: a mass's image has no stepped edge)
float boxHit(vec3 ro, vec3 rd, vec3 lo, vec3 hi){
  vec3 sg = mix(vec3(-1.), vec3(1.), step(0., rd)), inv = sg/max(abs(rd), vec3(1e-4));
  vec3 t1 = (lo - ro)*inv, t2 = (hi - ro)*inv, a = min(t1, t2), b = max(t1, t2);
  float tn = max(max(a.x, a.y), a.z), tf = min(min(b.x, b.y), b.z);
  return smoothstep(0., 7., tf - max(tn, 0.))*step(0., tf);
}
// the same for an upright drum (its middle at its foot c, its girth r, its top)
float cylHit(vec3 ro, vec3 rd, vec3 c, float r, float top){
  vec2 oc = ro.xz - c.xz; float a = max(dot(rd.xz, rd.xz), 1e-5), b = dot(oc, rd.xz), disc = b*b - a*(dot(oc, oc) - r*r);
  if (disc <= 0.) return 0.;
  float sq = sqrt(disc), t0 = (-b - sq)/a, t1 = (-b + sq)/a, iy = (rd.y < 0. ? -1. : 1.)/max(abs(rd.y), 1e-4);
  float ya = (c.y - ro.y)*iy, yb = (top - ro.y)*iy, tn = max(t0, min(ya, yb)), tf = min(t1, max(ya, yb));
  return smoothstep(0., 7., tf - max(tn, 0.))*step(0., tf);
}
// where a file of runners goes down the river (the plan's law of the files: the animals' part reads the same figures)
float trailE(float e0, float N){ return ${TRAIL_GLSL}; }
void main(){
  vec3 wp = vW; float d0 = wp.z - fcrFront(wp.x);
  if (d0 < -60.) discard;                                   // behind the line the fire's own foot and the smoke stand (the part's)
  gDx = dFdx(wp.xz); gDy = dFdy(wp.xz);
  float px = max(length(gDx), length(gDy));                 // metres of ground to a pixel
  vec3 V = wp - cameraPosition; float dist = length(V); vec3 rd = V/max(dist, 1e-3);
  vec2 en = wPlan(wp), lg = wLeg(en); vec4 pm = wPlanMap(en);
  float shal = (1. - smoothstep(-8., 10., (pm.r - .5)*160.));      // 1 in the drowned shallows and on their shores
  float wb = wWat(pm, wp.xz);                               // metres outside the water: the banks wander, the islets stand in the shallows
  vec4 Lf = fcrLight(wp);                                   // the fire's light here, by this place's distance from the line
  float wE = wFar(Lf.w), podL = wPod(en)*smoothstep(110., 260., d0);   // what a dark thing makes of it far off; the pods' amber lying here
  float big = gn(wp.xz/310., 1./310.), mid = gn(wp.xz/41. + 17., 1./41.), fine = gn(wp.xz/5.7 + 3., 1./5.7), grit = gn(wp.xz/.9 + 9., 1./.9);
  // THE BARS: here and there along each file's line the bed comes up as a bar of gravel: a short lozenge of its own length
  // and breadth, lying a little to the side of the line away from the route, with a shoal round it under the water
  // (the files run over the bars and wade between them). None is a strip: between two bars the water is whole.
  float inRide = (1. - smoothstep(uRideEnd - 60., uRideEnd + 20., lg.y))*(1. - smoothstep(240., 320., abs(lg.x))), bar = -1e3, shoal = -1e3;   // (stage E: the river's own reach and breadth only: no other water takes the river's face)
  for (int k = 0; k < 4; k++){
    float e0 = k == 0 ? ${PLAN.trail.lanes[0].toFixed(1)} : k == 1 ? ${PLAN.trail.lanes[1].toFixed(1)} : k == 2 ? ${PLAN.trail.lanes[2].toFixed(1)} : ${PLAN.trail.lanes[3].toFixed(1)};
    float wv = gn(vec2(e0*3.1 + 7., lg.y/14.), 1./14.), wv2 = gn(vec2(e0*1.7 + 31., lg.y/9.), 1./9.), show = smoothstep(.50, .64, wv + .15*(mid - .5))*smoothstep(.15, .55, sin(lg.y/6.1 + e0*2.3));   // (no bar longer than 15 m: a shoal, never a strip)
    float dq = abs(lg.x - trailE(e0, lg.y) - sign(e0)*3.*wv2), hwb = (.8 + 4.*smoothstep(.5, .85, wv))*(.7 + .6*wv2);
    bar = max(bar, (hwb + .9*(fine - .5))*show - dq - 4.*(1. - show));               // (stage E: where no bar shows the water is whole)
    shoal = max(shoal, (hwb + 3.2 + 1.5*(mid - .5))*show - dq - 6.*(1. - show));
  }
  bar = mix(-1e3, min(bar, 1.4), inRide); shoal = mix(-1e3, shoal, inRide);
  float wat = wb < 0. ? max(wb, bar) : wb;
  float onBar = step(wb, 0.)*step(0., wat);                 // land that stands in the water: a bar, an islet
  float bankK = (1. - smoothstep(1.5, 9.5, wat)), wetK = (1. - smoothstep(0., 3.5, wat));
  float under = smoothstep(3., 10., wat)*(1. - .6*shal);    // under the plants
  // ---- THE FOREST'S FLOOR: dark litter of plumes and husks, a net of roots; the fire's light comes slanting between
  // the trunks in bars, and the dusk's blue lies in the shade
  float lodC = (1. - smoothstep(.12, .45, px));
  vec2 fwd = normalize(Lf.xz + vec2(1e-4, -1e-4)); float along = dot(wp.xz, fwd), across = dot(wp.xz, vec2(-fwd.y, fwd.x));
  float bars = smoothstep(.40, .66, gn(vec2(across/4.6 + 3., along/48.), 1./4.6) + .35*(gn(vec2(across/1.5, along/17.), 1./1.5) - .5));   // soft-edged: light between trunks
  float root = lodC*(1. - smoothstep(0., .07, abs(gn(wp.xz/2.4 + 57., 1./2.4) - .5)))*cut(gn(wp.xz/7.7 + 11., 1./7.7), .45, .2, px);
  vec3 litter = mix(vec3(.040, .031, .026), vec3(.092, .070, .050), cut(fine*.5 + grit*.5, .5, .5, px)*.7 + .3*big);
  litter = mix(litter, vec3(.020, .016, .014), .7*root);
  // ---- THE BANKS: dark mud, smooth and wet toward the water, the roots' net in it
  vec3 mud = vec3(.056, .044, .037)*(.7 + .6*mid)*(1. - .55*root);
  // ---- THE BARS: dark wet gravel (no stone is drawn by itself: at this height a bar is a dark wet shoulder in the water)
  vec3 gravel = mix(vec3(.034, .031, .030), vec3(.066, .060, .055), .5*fine + .5*grit);
  // ---- THE DROWNED SHALLOWS' ISLETS AND SHORES (stage D: drowned ground, never burnt: the fire has not passed here
  // and never will): dark wet silt; strand lines of pale dead stalks that the water left, lying along the shore;
  // low mats of living growth on what stands driest. (The part's own char lies in it only where the part's law
  // puts it, by the line.)
  float plate = lodC*(1. - smoothstep(0., .05, abs(gn(wp.xz/1.7 + 71., 1./1.7) - .5)));
  float strand = (1. - smoothstep(0., .36, abs(fract(wat*.5 + .9*mid + .35*fine) - .5)))*smoothstep(.15, 1., wat)*(1. - smoothstep(3., 7.5, wat))*lodC;
  float growth = smoothstep(.50, .68, gn(wp.xz/6.3 + 37., 1./6.3) + .25*(grit - .5))*smoothstep(.5, 2.2, wat);
  vec3 silt = vec3(.042, .035, .030)*(.7 + .6*mid)*(.9 + .2*grit);                                  // dark wet silt
  silt = mix(silt, vec3(.088, .076, .058), .55*strand);
  silt = mix(silt, vec3(.030, .026, .031)*(.65 + .7*fine), .8*growth);
  silt *= .6 + .6*smoothstep(.25, .75, big*.4 + mid*.6);      // wet and drier in broad patches: never one even sheet
  vec3 alb = mix(litter, mud, bankK);
  alb = mix(alb, gravel, max(max(onBar, smoothstep(0., 2., shoal)*step(wat, 0.)), (1. - smoothstep(.3, 2.4, wat))*smoothstep(.42, .5, mid))*(1. - shal));
  alb = mix(alb, silt, shal*max(onBar, bankK));
  alb *= mix(1., .55, wetK);
  // THE RIVER'S AND THE CHANNEL'S BANKS (stage E): wet silt and roots, never one flat tone: clods and damp patches,
  // the strand lines of pale drift the water left along the shore, dark plates where the silt has dried and split;
  // a small relief of clods for the low light to rake (below)
  float bankR = bankK*(1. - shal);
  vec2 pB = wp.xz/1.9 + 31.; float clod = gn(pB, 1./1.9), damp = smoothstep(.3, .7, gn(wp.xz/13. + 5., 1./13.));
  alb = mix(alb, alb*(.5 + clod)*(.62 + .6*damp), bankR);
  alb = mix(alb, vec3(.086, .074, .056)*(.7 + .6*grit), .5*strand*bankR*(1. - onBar));
  alb = mix(alb, vec3(.018, .015, .014), .6*plate*bankR*damp);
  // WHERE FIRE MEETS GROUND: the part's own scorch, char and ember fields: on the land and on the islets of the
  // shallows; never in a water, and nowhere within 60 m of the moat (the castle's ground is never scorched)
  vec2 cq = wp.xz - uCastC.xy, lc = vec2(dot(cq, uCastA.xy), dot(cq, uCastA.zw)), mq = abs(lc - uMoat.xy) - uMoat.zw;
  float sdM = length(max(mq, 0.)) + min(max(mq.x, mq.y), 0.) - ${PLAN.moat.r.toFixed(1)};                               // metres outside the moat's drawn edge
  float scK = smoothstep(-.4, .6, wat)*smoothstep(60., 110., sdM);
  vec4 sc = fcrScorchF(wp); sc.xyz *= scK;
  vec2 bn = fcrBurn(wp, sc)*scK;                            // the part's char (x) with its fingers and islands, and the singed margin round it (y)
  alb = mix(alb, vec3(.030, .017, .009), .85*bn.y);
  alb = mix(alb, vec3(.012, .011, .010), .97*bn.x);
  // small relief for the low light to rake: hummocks and root swells under the plants, clods, the silt's swells
  vec2 pA = wp.xz/33. + 5., pF = wp.xz/5.7 + 3., pD = wp.xz/9.3 + 13.;
  float hA = gn(pA, 1./33.), hD = gn(pD, 1./9.3);
  vec2 gH = vec2(gn(pA + vec2(.15, 0.), 1./33.) - hA, gn(pA + vec2(0., .15), 1./33.) - hA)*(1.2/(33.*.15));
  vec2 gF = vec2(gn(pF + vec2(.15, 0.), 1./5.7) - fine, gn(pF + vec2(0., .15), 1./5.7) - fine)*(.25/(5.7*.15));
  vec2 gD = vec2(gn(pD + vec2(.1, 0.), 1./9.3) - hD, gn(pD + vec2(0., .1), 1./9.3) - hD)*(1.1/(9.3*.1))*shal;
  vec2 gB = vec2(gn(pB + vec2(.2, 0.), 1./1.9) - clod, gn(pB + vec2(0., .2), 1./1.9) - clod)*(.55/(1.9*.2))*bankR*lodC;
  vec2 gg = gH*under + gF + gD + gB;
  vec3 n = normalize(normalize(vN) + vec3(-gg.x, 0., -gg.y));
  float rake = clamp(dot(n, Lf.xyz)/max(Lf.y, .04), 0., mix(1.5, 2.6, smoothstep(.2, .5, Lf.w)));   // level ground 1; a slope toward the fire more (most by the line); away from it none
  // the part's law for a plain (albedo x fire x strength x rake) at FIRE_LAND; under the crowns the fire comes in
  // bars between the trunks and the sky's light is the shade's blue
  vec3 light = mix(uAmbGnd, wSkyAmb(Lf.w), .5 + .5*n.y)*mix(1., .8, under) + uDuskCol*max(dot(n, uDuskDir), 0.)*mix(1., .3, under) + uFire*(FIRE_LAND*mix(.7*wE, Lf.w, smoothstep(.2, .45, Lf.w))*mix(.42, 1., smoothstep(15., 150., d0))*rake*mix(fcrRough(wp, Lf), 1., .5*under)*mix(1., .16 + .62*bars, under)*mix(1., .5, max(shal, onBar))) + vec3(1., .43, .07)*(1.5*podL);   // (right before the line the ground is a dark shelf with a rim, not a lit one; under the ripe plants their pods' amber lies on it)   // (wet black ash and wet gravel drink the light)
  // NO PALE FLOOR: what the fire's light gives the ground beyond a deep orange is taken back (by the value alone, as
  // on the plants' skin): ground beside the line is dark with an orange light on it, never a pale sheet
  vec3 col = alb*light; col /= 1. + 1.2*max(col.r - .22, 0.);
  col = max(col, vec3(.015, .019, .032)*(.55 + .9*fine)*(.6 + .8*clod));   // (stage E: no ground is pure black: the dusk's blue lies in the deepest shade, with the ground's grain)
  // the part's ember field, seen through a crust of char: the hot bed at the flames' feet glows in patches and
  // cracks between dark plates (an even glowing sheet reads as a pale floor)
  col += fcrEmberC(wp, sc, bn.x + .42*bn.y)*(scK*(.16 + .84*smoothstep(.40, .74, .6*fine + .4*mid)*(1. - .5*plate)));
  // wet shine on bars and banks (optics): the fire's and the sky's light glancing off wet ground
  vec3 Rg = reflect(rd, n); Rg.y = abs(Rg.y);
  col += wetK*step(0., wat)*(1. - .8*shal)*(uFire*(.30*Lf.w*pow(max(dot(Rg, Lf.xyz), 0.), 7.)) + wSky(Rg)*(.5*pow(1. - clamp(dot(-rd, n), 0., 1.), 3.)));
  if (wat < .6 + 1.7*inRide) {
    // WATER: the sky with its stars, the fire and its smoke, the pods' amber, the banks with their plants and the
    // castle, doubled in a moving face (the kit mirrors a sky only; this takes the part's light and the part's own
    // mirror). RIPPLES AT EVERY DISTANCE: slow swells of 11 m, the air's ripples of 3 m near the eye, and fine
    // ripples whose length is taken by the pixel's footprint (two neighbouring sizes of one field of the place,
    // cross-faded: about three pixels long wherever water is seen), steeper along the look than across it (optics:
    // the facets that send a low light to the eye lie along the look). So every mirrored thing is drawn out into
    // long trembling strokes, at every distance, and none hangs in the water as a slab.
    float t = uFcrT, cal = smoothstep(.02, .6, px); vec2 rp = wp.xz;
    vec2 vd = normalize(rp - cameraPosition.xz + vec2(1e-4, 0.)), vq = vec2(-vd.y, vd.x);
    float lf = log2(max(px*3.2, .35)/.35), lf0 = floor(lf), k0 = .35*exp2(lf0), k1 = 2.*k0, fk = lf - lf0;
    vec2 dr = vec2(t*.21, -t*.16), q0 = (rp + dr)/k0, q1 = (rp + dr)/k1;
    vec2 fine2 = mix(vec2(gn(q0, 1./k0), gn(q0 + 37.3, 1./k0)), vec2(gn(q1 + 11.7, 1./k1), gn(q1 + 53.1, 1./k1)), fk) - .5;
    // (the same field three times as long: about ten pixels along the look wherever water is seen; it breaks the
    // castle's doubled image into strokes that are read as strokes, not as grain)
    float lm = lf + 1.7, lm0 = floor(lm), m0 = .35*exp2(lm0), m1 = 2.*m0, fm2 = lm - lm0;
    float mid2 = mix(gn((rp + dr)/m0 + 71.3, 1./m0), gn((rp + dr)/m1 + 29.9, 1./m1), fm2) - .5;
    float a1 = gn(rp/2.9 + vec2(t*.13, t*.08), 1./2.9), a2 = gn(rp/2.9 + vec2(-t*.10, t*.12) + 19., 1./2.9);
    float l1 = gn(rp/11. + vec2(t*.05, t*.03) + 7., 1./11.), l2 = gn(rp/11. + vec2(-t*.04, t*.05) + 23., 1./11.);
    float cur = (gn(vec2(lg.x/1.7 + 13., lg.y/52. + t*.03), 1./1.7) - .5)*inRide;
    // THE RIVER'S FACE (stage E): a calm dark river. Its fine ripples are LINES, not cells: long low crests lying
    // across the stream (two fields of the place in the river's own frame, a little aslant of each other and each
    // eleven and eight times as long as it is broad, going with the air), their breadth taken by the pixel's
    // footprint as before (so they lengthen with distance). The round-celled field that broke the river's mirror
    // into blotches is all but stilled there; the drowned shallows and the lagoon keep their own face.
    float rk = max(px*2.4, .16), lr = log2(rk/.16), lr0 = floor(lr), r0 = .16*exp2(lr0), r1 = 2.*r0, fr2 = lr - lr0;
    vec2 ra = vec2(lg.x*.97 + lg.y*.24, lg.y*.97 - lg.x*.24 + t*.11), rb = vec2(lg.x*.98 - lg.y*.19, lg.y*.98 + lg.x*.19 + t*.08);
    float lnA = mix(gn(vec2(ra.x/(r0*11.) + 3.3, ra.y/r0), 1./r0), gn(vec2(ra.x/(r1*11.) + 8.1, ra.y/r1 + 5.7), 1./r1), fr2);
    float lnB = mix(gn(vec2(rb.x/(r0*8.) + 21.3, rb.y/(r0*1.3) + 9.), 1./r0), gn(vec2(rb.x/(r1*8.) + 41.9, rb.y/(r1*1.3) + 2.2), 1./r1), fr2);
    float lineS = (lnA + lnB - 1.)*inRide;
    // (stage F: THE DROWNED SHALLOWS BEFORE THE FIRE take the same cure as far as it takes the blocks out of the fire's
    // image: their celled field is brought down to four tenths and long low crests lie across the air's way. By place:
    // the waters 640 m and more from the castle's middle; within 420 m of it the lagoon and the moat keep their face)
    float cureK = (1. - inRide)*smoothstep(420., 640., length(lc));
    vec2 wn = normalize(uWind.xy + vec2(1e-4, 0.)), lw = vec2(dot(rp, vec2(-wn.y, wn.x)), dot(rp, wn));
    vec2 rc = vec2(lw.x*.97 + lw.y*.24, lw.y*.97 - lw.x*.24 + t*.11), re = vec2(lw.x*.98 - lw.y*.19, lw.y*.98 + lw.x*.19 + t*.08);
    float lnC = mix(gn(vec2(rc.x/(r0*9.) + 13.3, rc.y/r0), 1./r0), gn(vec2(rc.x/(r1*9.) + 28.1, rc.y/r1 + 15.7), 1./r1), fr2);
    float lnD = mix(gn(vec2(re.x/(r0*6.) + 61.3, re.y/(r0*1.3) + 19.), 1./r0), gn(vec2(re.x/(r1*6.) + 71.9, re.y/(r1*1.3) + 12.2), 1./r1), fr2);
    lineS += (lnC + lnD - 1.)*(1.25*cureK);
    vec2 sl = vec2(l1 - .5, l2 - .5)*.04 + vec2(a1 - .5, a2 - .5)*(.05*(1. - cal)*(1. - .6*inRide)) + fine2*(mix(.26, .035, inRide) - .155*cureK) + vec2(cur*.08*uPlan.z, 0.);
    sl = vd*dot(sl, vd) + vq*(.35*dot(sl, vq));
    sl += vd*(lineS*.15) + vq*(lineS*.02);
    vec3 nw = normalize(vec3(sl.x, 1., sl.y));
    vec3 R = reflect(rd, nw); R.y = abs(R.y) + .015; R = normalize(R);
    vec3 refl = wSky(normalize(vec3(R.x, max(R.y, .085), R.z)));             // (the sky's pale band at the horizon is steep: mirrored through the swells it lay on the water in plates; the water doubles the sky above it)
    float north = -normalize(R.xz + vec2(1e-5, 1e-5)).y;
    vec3 sdR = vec3(R.x*uPlan.z, R.y, R.z); float fwR = 1.6*px/max(dist, 1.);
    float st = wStarsAt(sdR, 104., .86, .13, fwR, 1.) + wStarsAt(sdR, 31., .93, .075, fwR, 2.6);
    refl += vec3(.86, .92, 1.)*(2.2*st*smoothstep(.02, .22, R.y)*mix(1., mix(.15, 1., smoothstep(0., .5, R.y)), smoothstep(-.34, .2, north)));
    // the smoke and the flames, doubled: the part's own mirror (what its smoke and its belt send down the mirrored ray)
    // (in the river the smoke's image is thinner: the dusk's blue and the stars stand between the lanterns' paths)
    vec4 sm = fcrSmokeMirror(wp, R)*(1. - .62*inRide); refl = refl*(1. - sm.a) + sm.rgb;
    vec4 fm = fcrFlameMirror(wp, R); refl = refl*(1. - fm.a) + fm.rgb;
    // the banks and the dark plants on them, doubled: the mirrored ray is followed 9, 26 and 60 m over the plan (the
    // plants nearest the route are doubled whole by their own part, over this)
    float hlR = max(length(R.xz), 1e-3); vec2 Rxz = R.xz/hlR, Ren = vec2(Rxz.x*uPlan.z, -Rxz.y); float tanR = R.y/hlR;
    float wA = wWat(wPlanMap(en + Ren*9.), rp + Rxz*9.), wB = wWat(wPlanMap(en + Ren*26.), rp + Rxz*26.), wC = wWat(wPlanMap(en + Ren*60.), rp + Rxz*60.);
    float wall = max(max(smoothstep(2., 8., wA)*(1. - smoothstep(21., 27., tanR*9.)), smoothstep(2., 8., wB)*(1. - smoothstep(30., 38., tanR*26.))), smoothstep(2., 8., wC)*(1. - smoothstep(33., 43., tanR*60.)));
    float bankD = smoothstep(-1.6, 0., wat)*smoothstep(.02, .5, tanR + .2);
    vec3 wallC = vec3(.012, .009, .010) + uFire*(.05*wE);
    refl = mix(refl, wallC, max(.9*wall, .7*bankD));
    // THE PODS' AMBER, DOUBLED: under the ripe plants of the banks their lanterns lie in the water as long trembling
    // amber paths (the pod map followed along the mirrored ray: a lantern hangs 6 to 36 m up, and the ripples draw
    // its image out toward the eye)
    float ap = 0.;
    for (int k = 0; k < 6; k++) {
      float tk = k == 0 ? 7. : k == 1 ? 15. : k == 2 ? 27. : k == 3 ? 45. : k == 4 ? 72. : 112., yk = tanR*tk;
      ap += wPod(en + Ren*tk)*smoothstep(3. - .2*tk, 9., yk)*(1. - smoothstep(24., 40. + .35*tk, yk))/(1. + tk*(1./45.));
    }
    refl += vec3(1., .43, .07)*(.22*min(ap, 1.6)*smoothstep(110., 260., d0));
    // the castle, doubled: its masses broken by the ripples into long pale strokes, darker than the castle itself
    vec3 lp = vec3(lc.x, wp.y, lc.y), ld = vec3(dot(R.xz, uCastA.xy), R.y, dot(R.xz, uCastA.zw));
    if (uOutK.x > .5) {
      // THE CASTLE'S OUTLINE (its part's gift): its bodies as the route sees them, the farthest first and the nearest
      // over them; each a box or a drum met by the mirrored ray (soft over the first 7 m of the ray's way inside it:
      // no stepped edge), the night's colour on the night's side and the fire's on the other, as its part gives them
      // The image is taken by a face of its own (the swells, the ten-pixel ripples and a little of the fine ones) at
      // four heights of the mirrored ray: where a ripple tips the ray over the castle the sky shows between, so the
      // image lies in long strokes across the look, soft at every edge, drawn out toward the eye, and it is darker
      // than the castle itself (0.5 of the night's colour given and 0.4 of the fire's, less where a ripple's far side faces the eye).
      if (dot(lc, lc) < 810000.) {
        // (a second ten-pixel field of the place tips the ray sideways, so that no upright edge stands straight in
        // the water; the four heights are taken a little apart sideways too, so that every edge is soft; and away
        // from the rock the ripples' far sides hold no image at all: strokes with the sky between them)
        float mid3 = mix(gn((rp + dr)/m0 + 113.7, 1./m0), gn((rp + dr)/m1 + 87.1, 1./m1), fm2) - .5;
        vec2 slc = sl*.36 + vd*(mid2*.15) + vq*(mid3*.07); vec3 Rc = reflect(rd, normalize(vec3(slc.x, 1., slc.y))); Rc.y = abs(Rc.y) + .015;
        vec3 lc0 = vec3(dot(Rc.xz, uCastA.xy), Rc.y, dot(Rc.xz, uCastA.zw)), sdc = normalize(vec3(-lc0.z, 0., lc0.x) + vec3(1e-5, 0., 0.));
        vec3 q1 = normalize(lc0 + vec3(0., -.034, 0.) + sdc*.013), q2 = normalize(lc0 + vec3(0., -.011, 0.) - sdc*.022), q3 = normalize(lc0 + vec3(0., .011, 0.) + sdc*.022), q4 = normalize(lc0 + vec3(0., .034, 0.) - sdc*.013);
        vec3 litC = uOutLit*uFire*min(uOutK.y*fcrLight(vec3(uCastC.x, 20., uCastC.y)).w, uOutK.z);
        float away = smoothstep(130., 330., length(lc)), thr = -.30 + .16*away;
        float stroke = 1. - .45*smoothstep(-.02, .2, mid2), cov = .24*smoothstep(thr, thr + .22, mid3 - .4*mid2);
        for (int k = 11; k >= 0; k--) {
          vec4 oa = uOutA[k], ob = uOutB[k];
          float h = ob.w < .5 ? 0. : ob.w < 1.5 ? boxHit(lp, q1, oa.xyz, ob.xyz) + boxHit(lp, q2, oa.xyz, ob.xyz) + boxHit(lp, q3, oa.xyz, ob.xyz) + boxHit(lp, q4, oa.xyz, ob.xyz)
            : cylHit(lp, q1, oa.xyz, ob.x, ob.y) + cylHit(lp, q2, oa.xyz, ob.x, ob.y) + cylHit(lp, q3, oa.xyz, ob.x, ob.y) + cylHit(lp, q4, oa.xyz, ob.x, ob.y);
          refl = mix(refl, mix(uOutNight*.5, litC*.4, oa.w)*stroke, h*cov);
        }
      }
    } else {
      float hit = max(boxHit(lp, ld, uBoxLo[0], uBoxHi[0]), boxHit(lp, ld, uBoxLo[1], uBoxHi[1]));
      refl = mix(refl, uStone*.62, hit*.8);
    }
    vec3 tr = uRing - wp; tr /= max(length(tr), 1e-3);
    float inGate = (1. - smoothstep(-175., -130., lp.x))*(1. - smoothstep(.25, .5, abs(lp.z)/max(-lp.x - 78., 1.)))*(1. - smoothstep(400., 640., -lp.x));   // (the ring's light lies on the water before the gate, out to some 500 m: farther off it is spent)
    // the ring's cool light: its own image, and a long path toward the eye: a column under it (by the plain mirror's
    // bearing: optics) of small glints, the ripples' facets that send its light to the eye (never a plate)
    float daz = max(dot(normalize(rd.xz + vec2(1e-5)), normalize(tr.xz + vec2(1e-5))), 0.);
    // (far down the path the glints are fewer and the wash between them is gone: a path of points, never a plate)
    float farP = smoothstep(240., 520., -lp.x), glint = smoothstep(.50 + .2*farP, .72 + .2*farP, fine2.x + .5 + .5*fine2.y);
    refl += vec3(.10, .77, .57)*1.3*inGate*(pow(max(dot(R, tr), 0.), 900.) + pow(daz, 700.)*(1. - smoothstep(.05, .75, -rd.y))*(.03*(1. - farP) + .30*glint));
    // water at night is a mirror wherever it is not looked straight down into: its own body is black-blue
    float fr = mix(wFres(dot(-rd, nw)), 1., .24);
    // the water's own body: black-blue where it is deep; by a bank and over a shoal the bed is dimly seen, with soft edges
    float depth = clamp(-wat/6., 0., 1.); depth = mix(depth, min(depth, .6), max(shal, smoothstep(-5., 4., shoal)));
    vec3 body = mix(col*.35, vec3(.011, .021, .042) + uFire*(.010*Lf.w), smoothstep(0., 1., depth));
    vec3 wcol = mix(body, refl, fr);
    // THE FIRE'S ROAD (optics): the facets of the ripples that face the fire send its light to the eye: a bright
    // narrow glitter under the wall's image and a broad soft road of orange nearer the eye
    float dR = max(dot(R, normalize(vec3(Lf.x, max(Lf.y, .12), Lf.z))), 0.);
    wcol += uFire*(wE*((.55 + .25*inRide)*pow(dR, 90.) + (.20 - .06*inRide)*pow(dR, 9.)));   // (stage E: the calm river carries the road a little stronger)
    // DRIFT on the water (by place and the world clock): husks and flecks of plume-down going with the air's ripples, each
    // a small dark body with the fire's light on its edge; a few embers among them
    float nearW = (1. - smoothstep(.09, .34, px));
    if (nearW > 0.) {
      vec2 dp = (rp + vec2(t*.21, -t*.16))/2.3, di = floor(dp); vec4 dh = textureLod(uNoise, (di + .5)/256., 0.);
      float dd = length(fract(dp) - (.25 + .5*dh.gb)), rad = (.035 + .06*dh.a);   // (stage E: fewer and smaller: flecks, never a leaf shape)
      float husk = step(.915, dh.r)*(1. - smoothstep(rad*.4, rad*.8, dd)), ember = step(.955, dh.r)*(1. - smoothstep(0., rad*.6, dd))*(.6 + .4*sin(t*(1.3 + 3.*dh.a) + dh.g*40.));
      wcol = mix(wcol, vec3(.016, .013, .012) + uFire*(.05*wE), .85*husk*nearW*(1. - step(.955, dh.r)));
      wcol += vec3(1.40, .32, .025)*(.5*ember*nearW);
    }
    // (stage E) FAR OFF on the night's side the water is lost in haze and land: no pale straight band at the horizon
    wcol = mix(wcol, vec3(.016, .017, .026) + uFire*(.012*wE), .8*smoothstep(700., 1500., dist)*(1. - smoothstep(.08, .3, Lf.w)));
    // (stage E) the river's edge is soft and wanders: a wet film over the silt, never a hard outline
    float we = wat + ((fine - .5)*1.5 + (grit - .5)*.5)*inRide, ew = .3 + px + .5*inRide;
    col = mix(col, wcol, (1. - smoothstep(-ew, ew, we)));
  }
  // THE SMOKE BEFORE THE LAND (the part's veil): flown along the wall, the ground and the water of a farther lobe lie
  // behind the smoke of a nearer one; the part's smoke is one pass on the far plane and cannot cover them
  if (d0 < 330.) { vec4 vl = fcrSmokeVeil(cameraPosition, wp); col = col*(1. - vl.a) + vl.rgb; }
  // the air between: low mist by place, the dusk's haze, the glow of the low air before the fire
  vec4 air = wAir(wp, Lf, podL); col = col*(1. - air.a) + air.rgb;
  gl_FragColor = vec4(col, 1.);
}`;

// ---------- the sky's fragment shader ----------
const SKY_FRAG = /* glsl */`
varying vec3 vDir;
void main(){
  vec3 d = normalize(vDir);
  vec3 c = wSky(d);
  float north = -normalize(d.xz + vec2(1e-5, 1e-5)).y;                // 1 toward the fire
  float cl = 0.;
  if (uSkyK.z > .5) {                                                  // high thin cloud over the fire's half of the sky, lit from below
    vec2 q = d.xz/(max(d.y, 0.) + .16);
    float n1 = fcrN3(vec3(q*1.3 + vec2(uFcrT*.002, 0.), 1.)), n2 = fcrN3(vec3(q*3.1 - vec2(0., uFcrT*.003), 4.));
    cl = smoothstep(.38, .78, n1*.65 + n2*.35)*smoothstep(-.35, .35, north)*smoothstep(0., .14, d.y);
    c = mix(c, uHor*.9 + uFire*(.035 + .11*smoothstep(-.2, 1., north)*exp(-max(d.y, 0.)*2.2)), cl*.8);
  }
  c = mix(uHazeCol, c, smoothstep(-.012, .004, d.y));                 // under the horizon: the haze of the far plain
  // STARS in three sizes: a dust of faint ones, the ordinary ones, a few great ones; crowded in places and thin in
  // others (one slow field over the dome), densest in a faint band high overhead. One in a cell of the direction,
  // never smaller than a pixel (its light thinned by the same share).
  vec3 sd = vec3(d.x*uPlan.z, d.y, d.z);
  float fw = max(length(fwidth(d)), 1e-6);
  float bd = dot(sd, vec3(.688, -.229, .688)), band = exp(-bd*bd/.030);
  float crowd = fcrN3(sd*3.3 + 5.)*.65 + fcrN3(sd*8.1 + 2.)*.35, dens = clamp(.22 + .85*band + 1.5*(crowd - .5), 0., 1.);
  float st = wStarsAt(sd, 236., mix(.95, .80, dens), .10, fw, .5) + wStarsAt(sd, 104., mix(.93, .80, dens), .12, fw, 1.) + wStarsAt(sd, 31., mix(.965, .91, dens), .065, fw, 2.6);   // (stage D: about a third as many, smaller, their brightness more unequal: a night sky, never a speckle)
  float glow = fcrAirGlow(cameraPosition, d, 1e9);
  float thin = mix(1., mix(.15, 1., smoothstep(0., .5, d.y)), smoothstep(-.34, .2, north));   // toward the fire: full at 30 degrees up, 0.15 at the horizon
  // HIGH THIN SMOKE drawn out from the fire's side over the night: it dims the stars by degrees (no edge where the
  // smoke's wall ends and the night begins) and takes a little of the fire's colour low down
  float hs = smoothstep(-.55, .45, north)*(1. - smoothstep(.12, .85, d.y))*(.35 + .65*fcrN3(vec3(d.xz*2.1/max(d.y + .3, .02) + vec2(uFcrT*.0015, 0.), 5.)));
  c = mix(c, vec3(.026, .019, .022) + uFire*(.022*exp(-max(d.y, 0.)*3.)), .42*hs*smoothstep(0., .1, d.y));
  float veil = smoothstep(-.01, .16, d.y)*thin/(1. + 14.*glow)*(1. - .85*cl)*(1. - .72*hs);    // thinned by smooth laws; never switched off
  c += vec3(.86, .92, 1.)*(2.5*st*veil) + vec3(.012, .018, .034)*(band*(.35 + crowd)*veil);    // and the band's own faint light
  float md = dot(d, uMoonDir);                                        // a full night's small pale moon
  c += uSkyK.w*(vec3(.85, .92, 1.)*1.1*smoothstep(.99990, .99996, md) + vec3(.05, .07, .10)*exp(-(1. - md)*260.));
  gl_FragColor = vec4(c, 1.);
}`;
