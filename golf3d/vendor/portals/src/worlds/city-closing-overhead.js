// CITY CLOSING OVERHEAD (the rebuild; design/film/city-closing-overhead.redesign.md; a working name: The Town That Curls
// Overhead; the shown title is the owner's). Inspired by the film the header's screen field names: the idea only, a town
// that bends over on itself. THE JOINER'S FILE: the route, the gaze, the pace, the ring, the looks' deal, the materials, the promenade's
// ground, the street's end, the plain blocks, the birds, update and dispose. All that bends is the parts': the kept law and
// the land (src/parts/city-closing-overhead.js), the plan (-plan.js), the town (-town.js), the light and far land (-light.js).
//
// THE PLACE: an old town at the blue hour. We fly a lamp-lit promenade of polished stone toward +z. On our LEFT (world +x,
// from the hinge line x 90, the promenade's own left kerb) the town's other half bends up off the ground, steepens into a
// wall of lit windows and comes over our heads as a ceiling of lit streets, roofs and chimneys pointing down, yet joined
// to our ground in one unbroken sweep. On our RIGHT (world -x) the same town lies flat, and beyond it the afterglow stands
// along the open side. THE CURL DOES NOT MOVE: b is 1 at every metre (B0); nothing here sets the bend again.
// EVERY x IS WORLD x. Paving is at y 7. S is the cubic smooth step, ramp(m, p, q) = S((m - p) / (q - p)), m the metres flown.
//
// EVERY RULE THAT READS THE EYE'S PLACE (the design's section 13 and the builders' own lists as their CHANGES lines give
// them; nothing joins it unsaid):
//   THIS FILE'S: (1) THE GAZE: seven looks, each AT ONE FIXED PLACE of the plan (the hills' is the far land's own light),
//   each window from one named place of the plan to another, abreast of it on the route; their weights are weakened in
//   build till the engine's own mix of the route's heading and the looks, counted along the route, never lifts the gaze
//   over LIFT_CAP (24 degrees): a law of the route and the places; the lens is not read. (2) THE PACE: its ramps run
//   between the metres flown at named places (the hinge square's near edge, tower A, the last straight, the ring).
//   (3) THE PROMENADE'S SHEEN, A REFLECTION (it reads the sight line by its nature): the lamps' streaks, from the lamps
//   the mirrored sight line passes nearest; the afterglow mirrored in dry polished stone and in a few puddles' level
//   water; no image of the ring. (4) Filtering by a pixel's footprint: fwidth on every drawn joint, band, drain, kerb and
//   tone of the paving, and the pools' mean under a long footprint. (5) THE FLOCK's keepClear (birds keep 20 m from the
//   route: a law of the route's place, made in build; the birds' update reads the world's clock alone).
//   BUILDER A'S (the core's and the plan's): (1) THE LAND'S BACK FACE (gl_FrontFacing): the side turned from its own
//   town is uBack, unlit. (2) THE LAND'S WET SHEEN, a reflection, on paved ground within 60 m of the hinge line: F from
//   the sight line's angle to the ground; the afterglow mirrored; each lamp's streak, the pools' texture read along the
//   mirrored sight line on the ground; the puddles mirror more (F to 0.6); the puddles' PLACES are the ground's own, not
//   the eye's. (3) fwidth (a pixel's footprint): the paving's lines, the places' grain, the puddles' fade, the streaks'
//   mip level; the plan textures' mipmaps and anisotropy. The engine's culling against the sweep spheres; three's fog.
//   BUILDER B'S (the town's): none.
//   BUILDER C'S (the light's and the far land's): (1) THE ONE LEVEL-OF-DETAIL CUT OF THE WORLD: THE LANTERN'S FORM BY THE
//   PIXEL'S FOOTPRINT ALONE (a lantern under about 4 pixels wide is drawn as its point, whatever the gaze). (2) THE LAMP
//   SPRITES' DEPTH RULE: a lamp's sprite is depth-tested its own core radius (0.08 to 0.25 m, true metres) nearer the
//   eye than its middle, the same at every distance; a puff of smoke by its own radius in metres; a pool of light not
//   at all. (3) fwidth on faces and on the far plain's metres; the sprites' facing; their footprint filter (their least
//   drawn size, radiance times true area over drawn area; the view's height from the renderer's target). (4) viewMatrix
//   and cameraPosition used to take a face's place and the afterglow's way between the world's axes and the eye's own (the
//   rim-light on the hanging town's edge, a puff's shading). (5) Air by distance, at the medium's own 0.4 on lamps; the
//   dome round the camera. (The roll's own air and the pools of light on the ground are laws of the drawn place.)
//   All else reads the world's clock alone: the windows' law, the smoke, the trees' and strings' sway, the birds.
//   NOT USED: nothing is placed, sized, shown, hidden, lit or timed by the lens's direction, a share of the view, the
//   gaze, a seed's chance or the wall clock. The seed deals three looks within typed ranges and nothing else. No
//   level-of-detail cut by the eye's distance is made in this file.
//
// THE ROUTE (section 3 as the second finishing pass rules it: A FLIGHT WITH A MIDDLE OF UNLIKE PASSAGES): points every
// 10 m of z from the entry to the ring; x(z) and y(z) in makeRoute, every knot a place of the plan. (1) THE STREET: level
// in the entry (x 80, y 16), rising from the first wide cross street. (2) OUT OVER THE FLAT TOWN'S ROOFS from the hinge
// square's near edge, round tower A on its open side (never within 45 m of its shaft; a look at its belfry while the
// way is below it). (3) UP INTO THE HOLLOW in one climb to the hanging tower's belfry, passed level 48 m off (30 m and
// more of clear air to every hanging mass), 100 m inside the free edge. (4) LEVEL UNDER THE HANGING SQUARE to its
// fountain. (5) THE WAY DOWN, back across under the ceiling to the ring's axis, hanging streets overhead all the way.
// (6) THE LAST STRAIGHT, 120 m level on the ring's axis under the full roll. About 1,290 m. DURATION 56 (over the guide's
// 35 to 50, said here): at the pace's shares (0.6 in the street, 1 from tower A, 0.88 at the ring) the street passes at
// about 15 m/s and the hollow at 26. CAMERA: fov 66, bank 0 and sway 0 (the horizon level, no roll), near 0.5, far
// 6,000 (the ridge's far side is 2.4 km out and the dome sits at the far plane); NO nearThrough. THE RING: the engine's
// portal, radius 12, centre (72, 22, 1,200), on the promenade under the full roll; it sets neither drawWithin nor drawIn.
// BEHIND THE ENTRY: the tube of 14 m about the level entry axis (x 80, y 16) from z -60 to 0 holds nothing (the parts'
// lamps and fronts stand 15.8 m and more off it; this file puts nothing nearer than the paving 9 m under it).
//
// REAL WORLD (none copied street for street; none of them is Paris):
//   REAL WORLD: Bern, Switzerland: arcaded streets on stout piers, a column fountain.
//   REAL WORLD: Telc, Czechia: a long square of gabled houses over arcades.
//   REAL WORLD: Bologna, Italy: tower houses.
//   REAL WORLD: Siena, Italy: a slender brick bell tower.
//   REAL WORLD: Torun, Poland: a brick hall church with no tower.
//   REAL WORLD: Dubrovnik, Croatia: a street of polished limestone, its setts and drains.
//   REAL WORLD: Cuenca, Spain: houses on the brink.
//   REAL WORLD: Bolzano, Italy: a bowl of mountains.
//   REAL WORLD: Albi, France and Ferrara, Italy: thin brick walls. Girona, Spain and Evora, Portugal: stucco and lime wash.
// Nothing lettered anywhere, no figure, no vehicle, no boat, no long water.
import * as THREE from 'three';
import { makePath } from '../kit/core.js';
import { makeFlockAsync } from '../kit/fauna.js';
import { PLAN, B0, bendAt, makeBend, makeSwayUniforms, bendMaterials, Writer, makePlainBlocks, PALETTES, planTextures, makeLand, WET_GLSL } from '../parts/city-closing-overhead.js';
import { makeTownPlan } from '../parts/city-closing-overhead-plan.js';
import { makeTown } from '../parts/city-closing-overhead-town.js';
import { makeLight, makeFar, makeGlow } from '../parts/city-closing-overhead-light.js';
import { buildLife } from '../parts/city-closing-overhead-life.js';

const DEG = Math.PI / 180;
const S = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
const ramp = (m, m0, m1) => S((m - m0) / (m1 - m0));
const C = (hex) => new THREE.Color(hex);

// ---- THE PLACES THIS FILE TYPES (the entry's axis and the ring's approach); EVERY OTHER PLACE IS THE PLAN'S, read in
// build by places(): no street's, square's or tower's metre is typed here
const PLACE = {
  ENTRY: 0,                    // the entry: the route's first point
  ENTRY_X: 80, ENTRY_Y: 16,    // the entry's level axis: 9 m over the paving, 10 m inside the hinge line (the empty tube's own axis)
  RING: PLAN.RING_Z,           // the ring
  LEVEL: PLAN.RING_Z - 120,    // the last straight: from here the way is level on the ring's axis
  RING_CLEAR: PLAN.RING_Z - 60, // 60 m before the ring: from here on the gaze is the engine's alone
  PAVING_START: -360,          // the promenade's first slab, far behind the entry (the opening never shows bare land under it)
};
// the belfry of a tower of the core's kind stands from 6.5 m to 2 m under its tip: its middle, 4.25 m under the tip
const BELFRY = 4.25;
// THE LIFT'S CAP (the auditor's AU8, one figure for the whole flight): the gaze is never lifted more than 24 degrees over
// the level, so with the lens's 33 degrees below its middle the level line stands 9 degrees and more over the view's
// foot: the plain and the hill line never leave it. The route's own steepest climb is 22 degrees.
const LIFT_CAP = 24;

// places(plan, K): the plan's places this file flies by and looks at, each by its NAME in the plan (builder A moves them)
function places(plan, K) {
  const at = (a, n, z) => bendAt(K, a, 0, n, z).clone();
  const TA = plan.flat.towerA, TB = plan.sites.towerB, SQ = plan.squares.hanging, HS = plan.squares.hinge, CH = plan.sites.church;
  const aMid = (SQ.a0 + SQ.a1) / 2, fnt = (k) => plan.sites.fountains.find((f) => f.square === k);
  const wides = plan.cross.filter((c) => c.wide && (c.aStart ?? 0) < 1).map((c) => (c.z0 + c.z1) / 2).sort((p, q) => p - q);
  const wideAfter = (z) => wides.find((w) => w > z) ?? z, wideBefore = (z) => [...wides].reverse().find((w) => w < z) ?? z;
  const longWide = plan.longs.find((l) => l.wide) || plan.longs[plan.longs.length - 1];
  const edgeA = (z) => (plan.brink.edgeA ? plan.brink.edgeA(z) : PLAN.L);
  const P = {
    at, TA, TB, SQ, aMid, edgeA,
    zHinge: HS.paved.z0,                                     // the hinge square's near edge: the street's end
    zHingeF: (fnt('hinge') || { z: (HS.z0 + HS.z1) / 2 }).z,  // abreast of the hinge square's fountain
    zWide1: wideAfter(PLACE.ENTRY),                          // the first wide cross street past the entry
    zA: TA.z,                                                // tower A's middle
    zWideA: wideAfter(TA.z),                                 // the wide cross street past tower A
    zB: TB.z,                                                // the hanging tower
    zF: (fnt('hanging') || { z: (SQ.z0 + SQ.z1) / 2 }).z,    // the hanging square's fountain
    zSqWide: wides.find((w) => w > SQ.z0 + 20 && w < SQ.z1 - 20) ?? (SQ.z0 + SQ.z1) / 2,   // the wide street that parts the hanging square
    zLastWide: wideBefore(PLACE.LEVEL),                      // the last wide cross street before the last straight
  };
  P.zMidWide = wideBefore(P.zLastWide);                      // the wide cross street before that one
  P.belfryA = new THREE.Vector3(TA.x, PLAN.Y0 + TA.h - BELFRY, TA.z);
  P.belfryB = at(TB.a, TB.h - BELFRY, TB.z);
  P.squareFar = at(aMid, 0, SQ.z1);                          // the hanging square's far end on its middle line, under the church
  P.crossing = at((longWide.a0 + longWide.a1) / 2, 0, P.zWideA);   // where the ceiling's wide long street crosses the wide street past tower A
  // A PARK (the plan's two parks, plan.parks, lie at dealt places beside and behind the way down: no look is at them):
  // the plan's green of the hanging town that lies ahead on the way down, an ORCHARD of the hanging outskirts
  // (plan.outskirts.fields on the ceiling; with no orchard dealt there, its garden plots or its field), the one nearest
  // the hanging square's own line; with no outskirts in the plan, the wide long street's far end on the full roll
  const green = ((plan.outskirts && plan.outskirts.fields) || []).filter((f) => f.a0 >= longWide.a0);
  const rank = (f) => (f.kind === 'orchard' ? 0 : f.kind === 'plots' ? 1e4 : 2e4) + Math.abs((f.a0 + f.a1) / 2 - aMid);
  const orch = green.sort((p, q) => rank(p) - rank(q))[0];
  P.parkKind = orch ? orch.kind : 'street end';
  P.park = orch ? at((orch.a0 + orch.a1) / 2, 0, (orch.z0 + orch.z1) / 2) : at((longWide.a0 + longWide.a1) / 2, 0, PLAN.Z_FULL1);
  // THE RISE BESIDE THE RING: the flank's long street nearest four tenths of the way up it (the flank: the hinge line to
  // the ceiling's first street), where the first cross street past the ring climbs it: the land seen going up
  const foot = plan.longs.filter((l) => l.zone === 'foot'), aUp = 0.4 * (foot.length ? Math.max(...foot.map((l) => l.a1)) : 266);
  const mid = foot.sort((p, q) => Math.abs((p.a0 + p.a1) / 2 - aUp) - Math.abs((q.a0 + q.a1) / 2 - aUp))[0];
  const past = plan.cross.filter((c) => (c.aStart ?? 0) < 1 && c.z0 > PLAN.RING_Z).map((c) => (c.z0 + c.z1) / 2).sort((p, q) => p - q)[0];
  P.rise = at(mid ? (mid.a0 + mid.a1) / 2 : aUp, 0, past ?? PLAN.RING_Z);
  return P;
}

// ---- THE ROUTE (section 3 as the second finishing pass rules it), two laws of z alone, every knot a place of the plan
// x: the entry's axis to the hinge square's near edge; there OUT OVER THE FLAT TOWN'S ROOFS, round tower A on its open
// side, to the line that passes the hanging tower's belfry 48 m off on its brink side (the middle of the 40 to 70 m the
// pass is given), reached 70 m past tower A; held to the hanging square's fountain; from there back to the ring's axis
// by the last wide cross street. Tower A's shaft is never nearer than 45 m; the line lies 100 m inside the free edge.
// y: level in the entry; from the first wide cross street ONE CLIMB to the hanging belfry's own height less 7 m (the
// belfry is passed level, its tip 30 m and more off), reached at the hanging tower; level to the hanging square's
// fountain; ONE DESCENT to the ring's height by the last straight. Over the flat town's rows the line is 30 m and
// more over the paving (their envelope 18 m), over the promenade's trees 10 m and more.
function makeRoute(P) {
  const xPass = P.belfryB.x - 48, yTop = P.belfryB.y - 7;
  const x = (z) => PLACE.ENTRY_X + (xPass - PLACE.ENTRY_X) * S((z - P.zHinge) / (P.zA + 70 - P.zHinge)) + (PLAN.RING_X - xPass) * S((z - P.zF) / (P.zLastWide - P.zF));
  const y = (z) => PLACE.ENTRY_Y + (yTop - PLACE.ENTRY_Y) * S((z - P.zWide1) / (P.zB - P.zWide1)) + (PLAN.RING_Y - yTop) * S((z - P.zF) / (PLACE.LEVEL - P.zF));
  // where the way rises past tower A's belfry's own height (below it a look is at the belfry: S3)
  let zOverA = P.zHinge; while (zOverA < P.zA && y(zOverA) < P.belfryA.y) zOverA += 2;
  return { x, y, xPass, yTop, zOverA };
}

// ---- THE LOOKS DEALT BY THE SEED (section 7): three, each from its own stream; nothing else is dealt (not the hour, the
// bend, the route, the typed places or the lamps' colours). Brightest: amber, thin. Dimmest: rose, thick.
const GLOWS = [{ name: 'rose', core: '#ff8f6a', band: '#d9708a' }, { name: 'amber', core: '#ffa24e', band: '#e08a5a' }];
const HAZES = [{ name: 'thin', density: 0.0009 }, { name: 'mid', density: 0.0011 }, { name: 'thick', density: 0.0013 }];
export function dealLooks(seed, core) {
  const die = (n) => core.makeRng(core.hashSeed(n + ':' + seed))();
  const p = die('closing-walls'), g = die('closing-glow'), h = die('closing-haze');
  return {
    palette: ['albi', 'girona', 'evora', 'ferrara'][Math.min(3, Math.floor(p * 4))],
    glow: GLOWS[g < 0.5 ? 0 : 1], haze: HAZES[Math.min(2, Math.floor(h * 3))],
  };
}

// THE STREET'S END'S TWO LANTERNS (section 4): on piers astride the parapet, 15 m each side of the ring's axis (x 57 and
// x 87), their glass 3.5 m over the paving; the sheen program and the piers' maker both read them here
// THE PAVING'S END is the plan's own (plan.flat.z1: the flat land's last metre, past the outskirts): the parapet stands there
const pavingEnd = (plan) => plan.flat.z1;
const pierOf = (plan) => ({ x0: PLAN.RING_X - 15, x1: PLAN.RING_X + 15, y: PLAN.Y0 + 3.5, z: pavingEnd(plan) + 0.25 });
// THE STREET'S END AS A SMALL SQUARE: a ring of 8 low lamps on the base's first step (radius 15, the middle of the step's
// 14 to 16 m; at 45 deg from 22.5, so none stands on the ring's axis; glass 1.5 m over the paving, the lamp's top at
// y 8.85, under the forecourt's y 9), and a paved round on the promenade about the base, out to 19.5 m (3.5 m of setts)
const END = { lampR: 15, round: 19.5, lampY: PLAN.Y0 + 1.5, n: 8 };
// every lamp of this file (the two pier lanterns, the ring of 8), as places for builder C's sprites (makeGlow's own)
const endLamps = (plan) => {
  const PIER = pierOf(plan);
  const out = [{ x: PIER.x0, y: PIER.y, z: PIER.z, kind: 'gate' }, { x: PIER.x1, y: PIER.y, z: PIER.z, kind: 'gate' }];
  for (let k = 0; k < END.n; k++) { const a = (k + 0.5) * 2 * Math.PI / END.n; out.push({ x: PLAN.RING_X + END.lampR * Math.cos(a), y: END.lampY, z: PLAN.RING_Z + END.lampR * Math.sin(a), kind: 'gate' }); }
  return out;
};

// WHERE THE LEFT SIDE OPENS (the plan's anchor): the back of the far taper's last row of houses (the last step of the brink
// that holds a row; with none, the island's tip, PLAN.Z_TIP): from there to the parapet no land of the curl lies beside the promenade, the paving
// is 6 m wider (to x 96, the parapet's end) and a return of the parapet closes its open edge. With no steps: the tip.
const openZ = (plan) => { const st = ((plan.brink && plan.brink.steps) || []).filter((q) => q.a1 > q.a0); return st.length ? st[st.length - 1].z1 : PLAN.Z_TIP; };

// ---------------------------------------------------------------- THE PROMENADE'S GROUND AND ITS SHEEN PROGRAM
// Flat, y 7, x 56 to 90 (to 96 where the left side opens, up to the parapet that closes the street's end), z -360 to 1,222.
// DRY POLISHED STONE (Dubrovnik's street), never a strip of gloss: slabs 1.2 m by 0.6 m in a running bond, courses
// across the street, joints 2 cm, a grid of darker band courses 0.3 m wide every 9.6 m, each slab its own tone; the
// pattern's origin is the hinge line (a = x - 90) and z 0, so the land's slabs beyond the kerb carry on from it. Every
// line is box-filtered to its own mean by fwidth. A DARK KERB 0.3 m wide on the hinge line, BROKEN at every street mouth
// (the plan's cross streets that meet the hinge line: uMouth) and along the hinge square, inside the town's length.
// THE POOLS: the lamps stand on a lattice the program knows (both rows at z = z0 + step k, the left row on the curl's
// foot, none along the hinge square's open side; each row's first and last lamp are the plan's); a fragment takes the 3 nearest a side (a constant loop of 6) and adds
// its own colour x the pool colour x the plan's own pool law, (1 + (d / 6)^2)^-1.5 less its value at 20 m, summed, clamped;
// where a pixel's footprint is longer than the lamps' spacing, each row's own mean along z in its place (no sparkle).
// THE SHEEN, A REFLECTION (named at the head): spec = F x pow(max(dot(R, D), 0.0001), 220) x 6 / (1 + d^2 / 90), D the
// way to the lamp, R the sight line mirrored in the slab's normal (tilted 0.06 by its slab's hash, faded by fwidth);
// the streaks' three lamps a side are those nearest the place where the mirrored sight line reaches the lamps' height;
// F = min(0.35, 0.05 + 0.95 f^5), f = 1 - N.V; plus F x mix(uBack, uBand, w), w = (1 - smoothstep(0.10, 0.20, R.y)) x
// max(0, dot(R.xz, uGlowDir)): only mirrored rays under about 10 deg clear the hanging town and carry the afterglow.
// ALL of it x 0.35 on a joint or band line, x 1 on stone: stone always shows; the lamps' streaks are the gloss.
const PROM_PARS = /* glsl */`
uniform vec4 uLat;        // the lamps' lattice: z0, step, the left row's x, the right row's x
uniform vec4 uLatB;       // the lamps' y; the kerb's width; the street mouths' own share of the hinge line; the rows' first lattice place
uniform vec2 uMouth[32];  // the street mouths on the hinge line (the plan's cross streets that meet it): z from and to; unused ones far off
uniform vec4 uRows;       // the left row's first and last lamp's z, then the right row's (the plan's own)
uniform vec3 uString;     // the bulb strings' stretch, z from and to, and their mean on the paving
uniform vec4 uPier;       // the street's end: the two pier lanterns' x, their y and their z
uniform vec4 uOnL; uniform vec4 uOnR;   // the rows' lamps as the plan stands them: 24 lattice places a component, a bit a place, from the place uLatB.w
uniform vec2 uGapL;       // the left row's gap: the hinge square's open side, z from and to
uniform vec2 uTownZ;      // the town's first house and its last street's end: the kerb and the arcades' light lie between
uniform vec4 uPool;       // the pools' colour and gain (the land's own)
uniform vec3 uBack; uniform vec3 uBand; uniform vec2 uGlowDir; uniform vec3 uLampC;
uniform vec4 uEnd;        // the street's end: the ring's foot x and z, the radius of its ring of lamps, the paved round's edge
uniform vec4 uField;      // the setts' band: its middle (x - 90) and half width; the pools' trim; the arcades' line (x - 90)
varying vec3 vPromW;
// the share of [c - fw / 2, c + fw / 2] covered by lines w wide, one every p, centred on the multiples of p
float pmLine(float c, float p, float w, float fw) {
  float a = c - 0.5 * fw + 0.5 * w, b = c + 0.5 * fw + 0.5 * w;
  float ia = floor(a / p) * w + min(a - p * floor(a / p), w), ib = floor(b / p) * w + min(b - p * floor(b / p), w);
  return clamp((ib - ia) / fw, 0.0, 1.0);
}
float pmHash(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float pmJoint; float pmTilt; float pmFar; vec2 pmSlab; float pmPuddle; float pmRe; vec2 pmCe;
// the share of [c - fw / 2, c + fw / 2] covered by ONE line w wide centred on c0
float pmOne(float c, float c0, float w, float fw) { return clamp((min(c + 0.5 * fw, c0 + 0.5 * w) - max(c - 0.5 * fw, c0 - 0.5 * w)) / fw, 0.0, 1.0); }
float pmNoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(pmHash(i), pmHash(i + vec2(1.0, 0.0)), f.x), mix(pmHash(i + vec2(0.0, 1.0)), pmHash(i + vec2(1.0, 1.0)), f.x), f.y); }
// a lamp of a row stands where the plan stands one: the row's own bit at that lattice place (96 places a row from the
// place uLatB.w; each component holds 24 whole bits, exact in a float)
float pmOn(float lz, vec2 rz, float side) {
  float k = floor((lz - uLat.x) / uLat.y + 0.5) - uLatB.w;
  if (k < 0.0 || k > 95.0) return 0.0;
  vec4 m = side < 0.5 ? uOnL : uOnR;
  float w = floor(k / 24.0), b = k - 24.0 * w, word = w < 0.5 ? m.x : w < 1.5 ? m.y : w < 2.5 ? m.z : m.w;
  return floor(mod(floor(word / exp2(b)), 2.0));
}
vec3 promStone(vec3 base) {
  vec2 pq = vec2(vPromW.x - 90.0, vPromW.z), fw = max(fwidth(pq), vec2(0.0005));
  // THE FIELDS (unlike panels, each a rule of the plan's own metres): a MIDDLE BAND OF SETTS 6 m wide about the promenade's
  // axis (0.24 by 0.12 m), with no line along it; either side slab fields between the band
  // courses, two fields in five laid in half-size slabs (0.6 by 0.3 m), the rest in whole ones (1.2 by 0.6 m)
  vec2 panel = floor(pq / 9.6);
  float setts = step(abs(pq.x - uField.x), uField.y), small = step(pmHash(panel + 9.0), 0.4);
  float sc = mix(mix(1.0, 0.5, small), 0.2, setts), wj = mix(0.02 / sc, 0.05, setts);
  vec2 q = pq / sc, fq = fw / sc;
  float row = floor(q.y / 0.6), off = 0.6 * mod(row, 2.0), far = clamp(fq.y / 0.6, 0.0, 1.0);
  float jz = pmLine(q.y, 0.6, wj, fq.y);
  float jx = mix(pmLine(q.x + off, 1.2, wj, fq.x), 0.5 * (pmLine(q.x, 1.2, wj, fq.x) + pmLine(q.x + 0.6, 1.2, wj, fq.x)), far);
  float joint = jz + jx - jz * jx;
  float band = pmLine(pq.y, 9.6, 0.3, fw.y) * (1.0 - setts);   // (band courses ACROSS the promenade only, as on the land's slabs: no line runs down it)
  float drain = 0.0;   // NO LINE RUNS ALONG THE PROMENADE (the auditor's AU7): the setts' band has no drain course at its edges; it is read by its grain alone
  // THE PAVED ROUND about the ring's stepped base (to uEnd.w from the ring's foot): rings of setts 0.5 m wide, each sett
  // 0.5 m of the ring's own arc, inside a border course 0.4 m wide
  pmCe = vPromW.xz - uEnd.xy; pmRe = length(pmCe);
  float fr = max(fwidth(pmRe), 0.0005), inRound = step(pmRe, uEnd.w), edge = pmOne(pmRe, uEnd.w, 0.4, fr);
  joint = mix(joint, pmLine(pmRe, 0.5, 0.03, fr), inRound); band *= 1.0 - inRound; drain *= 1.0 - inRound;
  pmSlab = mix(vec2(row, floor((q.x + off) / 1.2)) + 13.0 * panel, vec2(floor(pmRe / 0.5), floor(atan(pmCe.y, pmCe.x) * pmRe / 0.5)), inRound);
  pmTilt = 1.0 - smoothstep(0.3, 1.2, max(fq.x, fq.y));       // a slab's own tone and tilt fade to their mean under a pixel
  pmJoint = max(max(joint, band), max(drain, edge));
  pmFar = smoothstep(8.0, 32.0, fw.y);                         // a footprint as long as the lamps' spacing (16 m) and more: the rows' own mean
  // A FEW PUDDLES: THE LAND'S OWN LAW (builder A's wetPuddle, in the metres both grounds share, so a puddle runs on across
  // the hinge line with no step; about a fifteenth of the paving); none on the setts' crown or the round. Standing water
  // that holds the afterglow: no joint shows in it, the stone x 0.6, F = min(0.6, 0.08 + 0.92 f^5) as on the land
  pmPuddle = wetPuddle(pq) * (1.0 - setts) * (1.0 - inRound);
  // a slab's own tone (to its mean under a pixel), its field's (one delivery: 13 in 100 either way), the setts' and the round's darker stone
  float tone = (1.0 + 0.16 * (pmHash(pmSlab) - 0.5) * pmTilt) * (1.0 + 0.26 * (pmHash(panel + 3.0) - 0.5) * (1.0 - setts) * (1.0 - smoothstep(4.8, 19.2, max(fw.x, fw.y))));
  // (NO DARK CENTRE LINE: the setts are the slabs' own stone and tone, read by their grain alone; the drains a fifth darker)
  tone *= mix(1.0, 0.84, inRound) * mix(1.0, 1.05, small * (1.0 - setts)) * mix(1.0, 0.8, drain) * mix(1.0, 0.5, edge) * mix(1.0, 0.6, pmPuddle);
  // the kerb on the hinge line, open at the street mouths and the hinge square
  float mouth = 0.0;
  for (int i = 0; i < 32; i++) mouth = max(mouth, step(uMouth[i].x, pq.y) * step(pq.y, uMouth[i].y));
  float open = max(mouth, step(uGapL.x, pq.y) * step(pq.y, uGapL.y));
  open = mix(open, uLatB.z, smoothstep(4.0, 16.0, fw.y));      // under a long footprint the mouths' own share of the line (the plan's)
  float kerb = clamp((pq.x + uLatB.y) / fw.x + 0.5, 0.0, 1.0) * clamp(-pq.x / fw.x + 0.5, 0.0, 1.0) * (1.0 - open) * step(pq.y, uTownZ.y);
  return base * tone * mix(1.0, 0.9, band) * mix(1.0, 0.5, joint * (1.0 - pmPuddle)) * mix(1.0, 0.82, kerb);
}
vec3 promGlow(vec3 albedo) {
  vec3 V = normalize(cameraPosition - vPromW);
  float ang = 6.2831853 * pmHash(pmSlab + 17.0);
  float tilt = 0.06 * pmTilt * (1.0 - pmPuddle);              // (standing water lies level)
  vec3 Ns = normalize(vec3(tilt * cos(ang), 1.0, tilt * sin(ang)));
  vec3 R = reflect(-V, Ns);
  float f = 1.0 - max(dot(Ns, V), 0.0), f2 = f * f, F = min(0.35, 0.05 + 0.95 * f2 * f2 * f);
  F = mix(F, min(0.6, 0.08 + 0.92 * f2 * f2 * f), pmPuddle);   // (standing water: the land's own law)
  float kz = floor((vPromW.z - uLat.x) / uLat.y + 0.5), pool = 0.0, spec = 0.0;
  // THE STREAKS' LAMPS: the sight line mirrored in the level paving reaches the lamps' height over the place
  // Q = P + (P - E) h / H (h the lamps' height over the paving, H the eye's); the three lamps a side nearest Q.z are
  // the ones whose streaks can lie here (the lobe decides; a lamp not taken only leaves its streak out)
  float kq = floor((vPromW.z + (vPromW.z - cameraPosition.z) * (uLatB.x - vPromW.y) / max(cameraPosition.y - vPromW.y, 0.5) - uLat.x) / uLat.y + 0.5);
  for (int i = 0; i < 6; i++) {
    float side = i < 3 ? 0.0 : 1.0, j = float(i < 3 ? i - 1 : i - 4), lx = mix(uLat.z, uLat.w, side);
    vec2 rz = mix(uRows.xy, uRows.zw, side);
    float lz = uLat.x + (kz + j) * uLat.y, sz = uLat.x + (kq + j) * uLat.y;
    vec2 dl = vec2(lx, lz) - vPromW.xz;
    float q = 1.0 + dot(dl, dl) / 36.0;
    pool += pmOn(lz, rz, side) * max(0.0, 1.0 / (q * sqrt(q)) - 0.02372);
    vec3 Lv = vec3(lx, uLatB.x, sz) - vPromW;
    float d2 = dot(Lv, Lv);
    spec += pmOn(sz, rz, side) * pow(max(dot(R, Lv * inversesqrt(d2)), 0.0001), 220.0) * 6.0 / (1.0 + d2 / 90.0);
  }
  spec *= 1.0 - pmFar;                                         // (under a long footprint the streaks are under the sight's grain: left out, never sparkling)
  // UNDER A LONG FOOTPRINT the pools are each row's own mean along z (the law summed along the row: 12 / (1 + dx^2 / 36)
  // a lamp, one lamp in 16 m, less the cut's share), so the far paving glows evenly and never sparkles
  vec2 dxr = vec2(uLat.z, uLat.w) - vPromW.x;
  vec2 rowMean = max(vec2(0.0), 0.75 / (1.0 + dxr * dxr / 36.0) - 0.09);   // (within 0.015 of the exact sum's mean from 0.6 to 19 m off the row)
  float inL = step(uRows.x, vPromW.z) * step(vPromW.z, uRows.y) * (1.0 - step(uGapL.x, vPromW.z) * step(vPromW.z, uGapL.y));
  pool = mix(pool, inL * rowMean.x + step(uRows.z, vPromW.z) * step(vPromW.z, uRows.w) * rowMean.y, pmFar);
  // the two pier lanterns of the street's end, by the same two laws, within their pools' 20 m
  if (vPromW.z > uPier.w - 20.0) for (int i = 0; i < 2; i++) {
    vec3 Lv = vec3(i == 0 ? uPier.x : uPier.y, uPier.z, uPier.w) - vPromW;
    float dg2 = dot(Lv.xz, Lv.xz), d2 = dot(Lv, Lv), q = 1.0 + dg2 / 36.0;
    pool += max(0.0, 1.0 / (q * sqrt(q)) - 0.02372);
    spec += pow(max(dot(R, Lv * inversesqrt(d2)), 0.0001), 220.0) * 6.0 / (1.0 + d2 / 90.0);
  }
  // the bulb strings' mean over their stretch (eased over 6 m at each end, about twice the bulbs' height over the paving)
  float bulbs = uString.z * smoothstep(uString.x - 6.0, uString.x + 6.0, vPromW.z) * (1.0 - smoothstep(uString.y - 6.0, uString.y + 6.0, vPromW.z));
  float w = (1.0 - smoothstep(0.10, 0.20, R.y)) * max(0.0, dot(R.xz, uGlowDir));
  // THE RING OF LAMPS on the base's first step (8, at 45 deg, none on the ring's axis): the 3 nearest, the pool law at
  // a low lamp's 4 m
  if (pmRe < uEnd.z + 24.0) { float kk = floor(atan(pmCe.y, pmCe.x) / 0.7853982);
    for (int i = -1; i <= 1; i++) { float a = (kk + 0.5 + float(i)) * 0.7853982; vec2 dl = uEnd.z * vec2(cos(a), sin(a)) - pmCe; float q = 1.0 + dot(dl, dl) / 16.0; pool += max(0.0, 1.0 / (q * sqrt(q)) - 0.02372); } }
  // WARM LIGHT OUT OF THE ARCADES (the curl's foot row, its lit bays on the line uField.w, 6 m beyond the hinge line:
  // e-folding 7 m across the paving, none at a street mouth or along the hinge square) and out of the right-hand
  // fronts' ground floors (the paving's own right edge, e-folding 4 m), inside the town's length
  float shut = 0.0;                                            // (no arcade at a street mouth: eased over 4 m beside it)
  for (int i = 0; i < 32; i++) shut = max(shut, 1.0 - smoothstep(0.0, 4.0, max(uMouth[i].x - vPromW.z, vPromW.z - uMouth[i].y)));
  shut = max(shut, smoothstep(uGapL.x - 4.0, uGapL.x, vPromW.z) * (1.0 - smoothstep(uGapL.y, uGapL.y + 4.0, vPromW.z)));
  float inTown = smoothstep(uTownZ.x, uTownZ.x + 6.0, vPromW.z) * (1.0 - smoothstep(uTownZ.y - 6.0, uTownZ.y, vPromW.z));
  float spill = inTown * (0.9 * exp(-(uField.w + 90.0 - vPromW.x) / 7.0) * (1.0 - shut) + 0.35 * exp(-(vPromW.x - 56.0) / 4.0));
  vec3 sheen = F * (spec * uPool.rgb + mix(uBack, uBand, w));   // (the streaks in the pools' own colour, as on the land: no step at the kerb)
  return (albedo * uPool.rgb * ((min(pool, 1.0) + bulbs + spill) * uPool.w * uField.z) + sheen) * mix(1.0, 0.35, pmJoint * (1.0 - pmPuddle));
}
`;
// makePromenade(plan, light): one flat mesh in a patched Lambert program (the two lights and the haze as every ground has
// them); its uniforms are the plan's lattice and builder C's shared ones (the pool's colour and gain, uBack, uBand, uGlowDir)
function makePromenade(plan, light) {
  const PIER = pierOf(plan);
  const lat = plan.flat.lattice, x0 = plan.flat.x0, x1 = plan.flat.x1, y = PLAN.Y0;
  const pos = [], idx = [];
  const strip = (xa, xb, za, zb, nx, nz) => {               // a grid of nx by nz quads, facing up
    const o = pos.length / 3;
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) pos.push(xa + (xb - xa) * i / nx, y, za + (zb - za) * j / nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) { const a = o + j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  };
  // quads about 17 m by 20 m (2 by 79): 316 triangles; the street's end, 6 m wider where the left side opens, 1 by 3 more: 6
  strip(x0, x1, PLACE.PAVING_START, pavingEnd(plan), 2, Math.ceil((pavingEnd(plan) - PLACE.PAVING_START) / 20));
  if (openZ(plan) < pavingEnd(plan)) strip(x1, x1 + 6, openZ(plan), pavingEnd(plan), 1, 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const nrm = new Float32Array(pos.length); for (let i = 1; i < nrm.length; i += 3) nrm[i] = 1;
  g.setAttribute('normal', new THREE.BufferAttribute(nrm, 3)); g.setIndex(idx); g.computeBoundingSphere();
  // the bulb strings' stretch from the plan's promenade strings (none: no wash)
  const st = plan.strings.filter((q) => q.kind === 'promenade');
  const sz = st.length ? [Math.min(...st.map((q) => Math.min(q.z0, q.z1))), Math.max(...st.map((q) => Math.max(q.z0, q.z1)))] : [0, 0];
  // THE ROWS' LAMPS AS THE PLAN STANDS THEM (it leaves places empty at street mouths, squares and the outskirts): a bit a
  // lattice place, 24 to a number, 96 places a row from the first lamp of either row; a lamp beyond them would be counted
  // in holesOver for the proofs. The row lanterns' kinds are the plan's: bracket, arcade, wall.
  const ROW = new Set(['bracket', 'arcade', 'wall']), kOf = (z) => Math.round((z - lat.z0) / lat.step);
  const zs = (list) => { const b = list.filter((l) => ROW.has(l.kind)).map((l) => l.z); return b.length ? [Math.min(...b), Math.max(...b)] : [1, 0]; };
  const rowsOf = [plan.lamps.filter((l) => ROW.has(l.kind) && l.a < 8), plan.flat.lamps.filter((l) => ROW.has(l.kind))];
  const rowL = zs(rowsOf[0]), rowR = zs(rowsOf[1]), k0 = kOf(Math.min(rowL[0], rowR[0]));
  let holesOver = 0;
  const bits = rowsOf.map((list) => { const v = [0, 0, 0, 0]; for (const l of list) { const k = kOf(l.z) - k0; if (k < 0 || k > 95) holesOver++; else v[Math.floor(k / 24)] += 2 ** (k % 24) * ((v[Math.floor(k / 24)] / 2 ** (k % 24)) % 2 < 1 ? 1 : 0); } return new THREE.Vector4(v[0], v[1], v[2], v[3]); });
  // THE STREET MOUTHS on the hinge line: the plan's cross streets that meet it (plan.cross, a from 0), never a lattice of
  // typed metres; up to 32 are known to the program (more would be counted in mouthsOver for the proofs)
  const townZ1 = PLAN.TOWN_Z1 ?? openZ(plan);
  const mouthList = plan.cross.filter((c) => (c.aStart ?? 0) < 1 && c.z1 > PLAN.TOWN_Z0 && c.z0 < townZ1).sort((p, q) => p.z0 - q.z0);
  const mouths = mouthList.slice(0, 32).map((c) => new THREE.Vector2(c.z0, c.z1)), mouthsOver = Math.max(0, mouthList.length - 32);
  const mouthShare = mouths.reduce((t, m) => t + m.y - m.x, 0) / Math.max(1, townZ1 - PLAN.TOWN_Z0);
  while (mouths.length < 32) mouths.push(new THREE.Vector2(1e9, -1e9));
  const uniforms = {
    uMouth: { value: mouths },
    uLat: { value: new THREE.Vector4(lat.z0, lat.step, lat.xL, lat.xR) },
    uOnL: { value: bits[0] }, uOnR: { value: bits[1] },
    uLatB: { value: new THREE.Vector4(lat.y, 0.3, mouthShare, k0) },
    uRows: { value: new THREE.Vector4(rowL[0], rowL[1], rowR[0], rowR[1]) },
    // THE BULBS' MEAN: 1.5 m apart on lines that cross the 39 m between the rows once in 29 m of z, 0.029 bulbs a square
    // metre; a bulb is A TWELFTH OF A LAMP, as the land's own pools take it (the core's planTextures: one law on both
    // sides of the hinge, under the one shared gain), and a lamp's pool law sums to 161 square metres at its foot's
    // level: 0.029 x 161 / 12 = 0.39, typed 0.35 for the trees' shade
    uString: { value: new THREE.Vector3(sz[0], sz[1], st.length ? 0.35 : 0) },
    uGapL: { value: new THREE.Vector2(lat.gapL[0], lat.gapL[1]) },
    uPier: { value: new THREE.Vector4(PIER.x0, PIER.x1, PIER.y, PIER.z) },
    uTownZ: { value: new THREE.Vector2(PLAN.TOWN_Z0, townZ1) },   // the town's first house and its last street's end (the plan's): the kerb and the arcades' light lie between
    uPool: light.landUniforms.uPool, uBack: light.lit.uBack, uBand: light.lit.uBand, uGlowDir: light.lit.uGlowDir,
    uLampC: { value: C('#ffd9a0') },                          // the promenade's lamps (section 5)
    uEnd: { value: new THREE.Vector4(PLAN.RING_X, PLAN.RING_Z, END.lampR, END.round) },
    // the setts' band about the promenade's axis (x 73, the middle of x 56 to 90), 3 m each way; THE POOLS' TRIM 0.7 (R4:
    // the street and the ring read over 0.38 of white; the paving's lamp light is this file's share of it); the arcades'
    // line, 6 m beyond the hinge line
    uField: { value: new THREE.Vector4((x0 + x1) / 2 - PLAN.HX, 3, 0.7, 6) },
  };
  const mat = new THREE.MeshLambertMaterial({ color: C('#8a8078') });   // the slabs' stone (section 4)
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uniforms);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vPromW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vPromW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + WET_GLSL + PROM_PARS)
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb = promStone(diffuseColor.rgb);')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += promGlow(diffuseColor.rgb);');
  };
  mat.customProgramCacheKey = () => 'closing-promenade';
  const mesh = new THREE.Mesh(g, mat); mesh.name = 'closing-promenade';
  return { mesh, tris: idx.length / 3, uniforms, holesOver, mouthsOver, dispose() { g.dispose(); mat.dispose(); } };
}

// ---------------------------------------------------------------- THE STREET'S END (section 4)
// Under the ring a round three-step base (radii 16, 14 and 12.5 m about the ring's own foot (72, 1,200); steps of 0.4 m,
// the top at y 8.2, 1.8 m under the ring's lowest point); the paving ends at the plan's flat.z1 in a parapet 1.1 m high from x 45
// to x 96 with a lantern pier (0.8 m square, 4 m) at x 57 and at x 87, 15 m each side of the ring's axis; the parapet
// returns along the open left edge to the curl's last row. Stone bodies
// of the flat world in the house program (class 0, plain; the lanterns' glass class 7, lit plain, its gain 4 in the seed
// channel): each body's own origin is on the paving, so the height up its face is its height over the paving.
function makeStreetsEnd(materials, plan) {
  const PIER = pierOf(plan), PAVING_END = pavingEnd(plan);
  const W = new Writer(), STONE = C('#8a8078'), PALE = C('#a39a8c'), DARK = C('#4a443e'), GLASS = C('#fff0c8');
  const TOP_A = C('#a39a8c').multiplyScalar(0.28), TOP_B = C('#8a8078').multiplyScalar(0.28);   // (class 7 gives 2.5 times its colour: seven tenths of the stone's own)
  const y = PLAN.Y0, N = 48, R3 = [16, 14, 12.5], STEP = 0.4;
  W.body(-1, 0, { x: PLAN.RING_X, y, z: PLAN.RING_Z, yaw: 0 }); W.look(0);
  for (let s = 0; s < 3; s++) {
    const r = R3[s], rin = s < 2 ? R3[s + 1] : 0, ya = STEP * s, yb = ya + STEP;
    for (let i = 0; i < N; i++) {
      const a0 = 2 * Math.PI * i / N, a1 = 2 * Math.PI * (i + 1) / N, am = (a0 + a1) / 2;
      const c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
      W.quad([r * c0, ya, r * s0], [r * c1, ya, r * s1], [r * c1, yb, r * s1], [r * c0, yb, r * s0], PALE, [Math.cos(am), 0, Math.sin(am)]);
      if (rin) W.quad([r * c0, yb, r * s0], [r * c1, yb, r * s1], [rin * c1, yb, rin * s1], [rin * c0, yb, rin * s0], STONE, [0, 1, 0]);
      else {
        // THE TOP IS PAVED: three rings of slabs 3.5 m deep about a middle stone 2 m in radius, two tones turn about, in
        // the lit plain class (7: its own radiance, seven tenths of the stone's colour, the ring's and the eight lamps'
        // light on it by this typed share), never a bare dark disc
        W.look(7);
        const RT = [12.5, 9, 5.5, 2];
        for (let k = 0; k < 3; k++) W.quad([RT[k] * c0, yb, RT[k] * s0], [RT[k] * c1, yb, RT[k] * s1], [RT[k + 1] * c1, yb, RT[k + 1] * s1], [RT[k + 1] * c0, yb, RT[k + 1] * s0], (i + k) % 2 ? TOP_A : TOP_B, [0, 1, 0]);
        W.tri([2 * c0, yb, 2 * s0], [2 * c1, yb, 2 * s1], [0, yb, 0], TOP_A, [0, 1, 0]);
        W.look(0);
      }
      // A LOW SEAT WALL on the first step's rim (0.4 m thick, 0.55 m high) round the two sides, 56 deg either way of
      // the cross axis; the way in and the way out stay open as steps
      if (s === 0 && Math.abs(Math.cos(am)) > 0.5556) {
        const ri = r - 0.4, yw = yb + 0.55;
        W.quad([r * c0, yb, r * s0], [r * c1, yb, r * s1], [r * c1, yw, r * s1], [r * c0, yw, r * s0], PALE, [Math.cos(am), 0, Math.sin(am)]);
        W.quad([ri * c0, yb, ri * s0], [ri * c1, yb, ri * s1], [ri * c1, yw, ri * s1], [ri * c0, yw, ri * s0], PALE, [-Math.cos(am), 0, -Math.sin(am)]);
        W.quad([r * c0, yw, r * s0], [r * c1, yw, r * s1], [ri * c1, yw, ri * s1], [ri * c0, yw, ri * s0], STONE, [0, 1, 0]);
      }
    }
  }
  // THE RING OF LAMPS on the first step: a stone shaft 0.24 m square to 0.9 m over the step, a glass lantern, a small roof
  for (const l of endLamps(plan).slice(2)) {
    W.body(-1, 0, { x: l.x, y: y + STEP, z: l.z, yaw: 0 }); W.look(0);
    W.box(-0.12, 0.12, 0, 0.9, -0.12, 0.12, PALE);
    W.look(7, 4); W.box(-0.16, 0.16, 0.9, 1.3, -0.16, 0.16, GLASS);
    W.look(0); W.pyramid(-0.22, 0.22, -0.22, 0.22, 1.3, 0.15, DARK);
  }
  const baseTris = W.tris;
  // the parapet across the street's end: a wall 0.5 m thick, 0.98 m high, under a coping 0.12 m thick that oversails 0.08 m
  W.body(-1, 0, { x: 0, y, z: PAVING_END, yaw: 0 }); W.look(0);
  const xE = plan.flat.x1 + 6, zO = Math.min(-0.5, openZ(plan) - PAVING_END);   // the parapet's left end; where the left side opens, from the end
  W.box(45, xE + 0.5, 0, 0.98, 0, 0.5, PALE);
  W.box(44.92, xE + 0.58, 0.98, 1.1, -0.08, 0.58, STONE, true);
  // its return along the open left edge (x 96) back to where the curl's last row ends, and across the 6 m to the hinge
  // line there: the same wall and coping; the terrace is closed where the plain begins
  W.box(xE, xE + 0.5, 0, 0.98, zO + 0.5, 0, PALE);
  W.box(xE - 0.08, xE + 0.58, 0.98, 1.1, zO + 0.58, -0.08, STONE, true);
  W.box(plan.flat.x1, xE + 0.5, 0, 0.98, zO, zO + 0.5, PALE);
  W.box(plan.flat.x1 - 0.08, xE + 0.58, 0.98, 1.1, zO - 0.08, zO + 0.58, STONE, true);
  // the two lantern piers, astride the parapet: shaft 0.8 m square to 3.1 m, a cap, a glass lantern, a small roof: 4.0 m
  for (const px of [PIER.x0, PIER.x1]) {
    W.body(-1, 0, { x: px, y, z: PIER.z, yaw: 0 }); W.look(0);
    W.box(-0.4, 0.4, 0, 3.1, -0.4, 0.4, PALE);
    W.box(-0.5, 0.5, 3.1, 3.25, -0.5, 0.5, STONE, true);
    W.look(7, 4); W.box(-0.25, 0.25, 3.25, 3.8, -0.25, 0.25, GLASS);
    W.look(0); W.pyramid(-0.34, 0.34, -0.34, 0.34, 3.8, 0.2, DARK);
  }
  // THE PROMENADE'S FURNITURE, by the plan's own places (one rule, on every seed): A TREE PIT at every promenade tree's
  // foot: a stone kerb 2 m square, 3 cm proud, about 1.6 m of dark earth. NO LAMP STANDARD stands on the promenade's
  // kerbs (the auditor's AU1 and AU7): its light is the wall lanterns' and the arcade lanterns', the light part's own.
  const endTris = W.tris, EARTH = C('#3a332c');
  for (const t of plan.flat.trees) if (t.where === 'promenade') {
    W.body(-1, 0, { x: t.x, y, z: t.z, yaw: 0 }); W.look(0);
    W.quad([-1, 0.03, -1], [1, 0.03, -1], [1, 0.03, 1], [-1, 0.03, 1], PALE, [0, 1, 0]);
    W.quad([-0.8, 0.05, -0.8], [0.8, 0.05, -0.8], [0.8, 0.05, 0.8], [-0.8, 0.05, 0.8], EARTH, [0, 1, 0]);
  }
  const g = W.geometry(); g.computeBoundingSphere();
  const mesh = new THREE.Mesh(g, materials.house.colour); mesh.name = 'closing-streets-end';
  return { mesh, tris: endTris, furniture: W.tris - endTris, baseTris, dispose() { g.dispose(); } };
}

export default {
  id: 'city-closing-overhead',
  name: 'The Town That Curls Overhead',
  category: 'screen',
  placeKind: 'city',
  screen: 'Inception',
  screenYear: '2010',
  screenKind: 'film',
  media: ['air', 'open'],
  weirdness: 0.55,
  async build(ctx) {
    const scene = new THREE.Scene();
    const stream = (name) => ctx.core.makeRng(ctx.core.hashSeed(name + ':' + ctx.seed));
    // ctx.vary: its density thins the starlings alone, between 0.7 and 1 of their typed most (never over the budget); its
    // hour and rare are not read, for the hour, the bend, the route and the typed places are not dealt (section 7)
    const vary = ctx.vary || {}, dens = Math.min(1, Math.max(0.7, vary.density ?? 1));
    const look = dealLooks(ctx.seed, ctx.core), pal = PALETTES[look.palette];
    // ---- THE LIGHT (builder C's): the dome, the fog's colour (the dome's own), the two lights, the shared uniforms
    const light = makeLight(ctx, { look });
    scene.add(light.sky.object);
    for (const l of light.lights) { scene.add(l); if (l.target) scene.add(l.target); }
    scene.fog = new THREE.FogExp2(light.fogColor, look.haze.density);
    await ctx.yield();

    // ---- THE BEND, UNMOVING (b is B0 at every metre; never set again), and THE MATERIALS: the kept pairs { colour, depth },
    // each carrying the bend and builder C's night strings; the trees' pair carries the sway (reach 0.15 m, the kept sway;
    // its wind blows along the promenade toward +z and a little off the open side, 0.7 rad from +x as kept)
    const bend = makeBend(B0);
    const sway = makeSwayUniforms(0.15, 0.7);
    const materials = {
      house: bendMaterials(bend, 'house', { night: light.night.house }),
      tree: bendMaterials(bend, 'tree', { night: light.night.tree, sway }),
    };
    await ctx.yield();

    // ---- THE PLAN (builder A's pure data), its textures (the pools in their alpha), THE LAND and the flat town's ground
    const plan = await makeTownPlan(ctx);
    await ctx.yield();                                        // (the plan is one step of its own)
    // ---- THE ROUTE, from the plan's places: points every 10 m of z from the entry to the ring
    const P = places(plan, bend.knots), route = makeRoute(P);
    const pts = []; for (let z = PLACE.ENTRY; z <= PLACE.RING + 1e-6; z += 10) pts.push([route.x(z), route.y(z), z]);
    const path = makePath(pts), LEN = path.length;
    // the metres flown at a place's z (the route's own length, summed metre by metre of z from its two laws)
    const mAtZ = (() => {
      const cum = [0]; for (let z = 1; z <= PLACE.RING; z++) cum.push(cum[z - 1] + Math.hypot(route.x(z) - route.x(z - 1), route.y(z) - route.y(z - 1), 1));
      return (z) => LEN * cum[Math.min(PLACE.RING, Math.max(0, Math.round(z)))] / cum[PLACE.RING];
    })();
    await ctx.yield();
    const tex = await planTextures(plan, ctx); await ctx.yield();
    const flatTex = await planTextures(plan.flat, ctx); await ctx.yield();
    const land = await makeLand(ctx, { bend, plan, tex, flatTex, light });
    scene.add(land.group);
    await ctx.yield();

    // ---- THE TOWN (builder B's): the curl's and the flat town's houses, landmarks and trees
    const town = await makeTown(ctx, { bend, plan, pal, materials });
    scene.add(town.group);
    await ctx.yield();

    // ---- THE FAR LAND and THE GLOW (builder C's): the plain's sheet and the ridge; the lamps' sprites and the smoke
    const far = await makeFar(ctx, { light, plan });
    scene.add(far.group);
    await ctx.yield();
    const glow = await makeGlow(ctx, { bend, plan, light, chimneys: town.chimneys, far: far.lights, own: endLamps(plan) });
    scene.add(glow.group);
    await ctx.yield();

    // ---- THE PROMENADE'S GROUND with its sheen program (this file's; flat, from the plan's lattice and the shared uniforms)
    const prom = makePromenade(plan, light);
    scene.add(prom.mesh);
    await ctx.yield();

    // ---- THE STREET'S END (this file's): the ring's stepped base, the parapet, the two lantern piers
    const end = makeStreetsEnd(materials, plan);
    scene.add(end.mesh);
    await ctx.yield();

    // ---- THE PLAIN BLOCKS (the kept maker, with the pairs): lit low blocks on the plain at the town's own level, from 40 m
    // to 600 m out on the open sides: (1) the right, beyond the flat town's outskirts (x -170), along the town's whole
    // length; (2) beyond the paving's end (the plan's flat.z1) and (3) the left of the far tip (beyond x 96, from PLAN.Z_TIP), where the
    // curl has ended and the plain lies open. Cells of 110 by 140 m (the maker's), whole cells only; the maker's share by
    // distance is held at its most (dist 0: the plain is as built up at 600 m as at 40). None before z -60 (bare land).
    // AT THE STREET'S END the blocks begin one lane (14 m) beyond the parapet and its return, so the square is among houses
    const OUT0 = 40, OUT1 = 600, RIGHT = -170, PAST = pavingEnd(plan), LEFT = plan.flat.x1 + 6, LANE = 14;
    const plain = await makePlainBlocks(ctx, {
      house: materials.house, tree: materials.tree, pal, most: 18000, inside: () => true, dist: () => 0,
      areas: [
        [[RIGHT - OUT0 - 5 * 110, RIGHT - OUT0, PLAN.TOWN_Z0, PLAN.TOWN_Z0 + Math.ceil((PAST - PLAN.TOWN_Z0) / 140) * 140]],
        [[RIGHT - OUT0 - 5 * 110, RIGHT - OUT0 - 5 * 110 + 8 * 110, PAST + LANE, PAST + LANE + 4 * 140], [LEFT + LANE, LEFT + LANE + 6 * 110, openZ(plan) + LANE, openZ(plan) + LANE + 4 * 140]],
      ],
    });
    scene.add(plain.group);
    await ctx.yield();

    // ---- THE STARLINGS (the kit's flock; section 6): ONE murmuration wheeling about (-60, 96, 900), over the flat town's
    // roofs on the open side, where the way comes down out of the hollow: 600 at twice life size (the typed most; vary's
    // density may thin it), unlit dark blue against the afterglow. Its course is a loop 30 m in radius about that place;
    // its cloud is held within three scatters (maxSigma 3), its roam, morph and bands small and of this call's own, and
    // by keepClear no bird comes within 20 m of the route, by place, over the stretch it flies beside (the wide street
    // that parts the hanging square to the last straight); kept.short is printed and must be 0.
    // ITS PLACE: x -60, over the flat town on the open side, 10 m beyond the line the way holds through the hollow; y 96,
    // under the hollow's eye and over the way down's; z 900, beside the way down (the way is 100 m and more to the
    // roll's side of it there), against the afterglow. The cloud's
    // half-widths (20, 9, 16 m) keep it inside its 30 m loop; 12 m/s takes it round in about 16 s.
    const BIRD = '#141a33';
    const flock = await makeFlockAsync({
      species: 'starlings', form: 'murmuration', rng: stream('closing-starlings'), count: Math.round(600 * dens), size: 2, speed: 12,
      center: [-60, 96, 900], radius: 30, height: 4, wobble: 0.2,
      spread: [20, 9, 16], maxSigma: 3, wander: [0.8, 0.4, 0.6, 0.4], morph: 3, bands: 0.3,
      body: BIRD, belly: BIRD, wingC: BIRD, trail: BIRD, tip: BIRD, beak: BIRD, head: BIRD, rim: 0, translucency: 0,
      light: { sunDir: [0, 1, 0], sunColor: '#000000', sunIntensity: 0, sky: '#ffffff', skyIntensity: Math.PI, ground: '#ffffff', groundIntensity: Math.PI },
      keepClear: { path, dist: 20, from: mAtZ(P.zSqWide) / LEN, to: mAtZ(PLACE.LEVEL) / LEN, step: 2 },
    }, ctx.yield);
    scene.add(flock.object);
    await ctx.yield();
    // ---- THE LIFE (the life part's: birds, smoke, the lamps' breath, cloth; ambient, on the world's clock alone)
    const life = await buildLife(ctx, { bend, plan, path, chimneys: town.chimneys });
    scene.add(life.group);
    await ctx.yield();

    // ---- THE LOOKS (section 3, the second finishing pass): SIX, EACH AT ONE FIXED PLACE OF THE PLAN (the far land's is
    // builder C's own light), each window FROM ONE NAMED PLACE TO ANOTHER (abreast of it on the route), following one
    // another to unlike kinds of places and to unlike sides. ONE CAP ON THE LIFT (LIFT_CAP) for the whole flight: the
    // engine's own mix of the route's heading and the looks is counted along the route in build, every 5 m, and where
    // it would lift the gaze over the cap the looks open there are weakened (x 0.9 a turn) till it does not: a law of
    // the route and the places; the lens is not read. No look is an angle held off a bearing.
    const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
    const lookEnds = [];
    // fadeM: the ease at each end, in metres flown (never over 0.45 of the run); lead: metres of the ease-in that lie
    // BEFORE the first place (LOOK ONE's ease lies behind the entry: it is open at the first metre, under the engine's guard)
    const lookAt = (name, place, zFrom, zTo, weight, fadeM, lead = 0) => {
      const m0 = mAtZ(zFrom) - lead, m1 = mAtZ(zTo), rec = { name, from: zFrom, to: zTo, eyeY: [+route.y(zFrom).toFixed(1), +route.y(zTo).toFixed(1)], weight };
      lookEnds.push(rec);
      return { at: () => place, from: m0 / LEN, to: m1 / LEN, fade: Math.min(0.45, fadeM / (m1 - m0)), weight, rec };
    };
    // THE OPEN SIDE'S HILLS: the far land's own light on a ridge (builder C's hamlets; a village if none) nearest the
    // afterglow's way from the hanging square's fountain: one fixed place of the far land
    const gd = light.lit.uGlowDir.value, hi = V3(route.x(P.zF), route.y(P.zF), P.zF);
    const farOf = (kind) => { let best = -2, out = null; for (const l of far.lights) { if (l.kind !== kind) continue; const dx = l.x - hi.x, dz = l.z - hi.z, c = (dx * gd.x + dz * gd.y) / Math.hypot(dx, dz); if (c > best) { best = c; out = V3(l.x, l.y, l.z); } } return out; };
    const hills = farOf('hamlet') || farOf('village') || farOf('farm') || V3(hi.x + 3200 * gd.x, PLAN.Y0 + 150, hi.z + 3200 * gd.y);
    const pois = [
      // (a) THE ENTRY: the ceiling's wide street where the wide cross street past tower A crosses it (overhead, ahead);
      // from the entry to the hinge square's near edge (weight 0.3: the street keeps the gaze low)
      lookAt('the ceiling\'s wide crossing', P.crossing, PLACE.ENTRY, P.zHinge, 0.3, 60, 120),
      // (b) OUT OVER THE ROOFS, ROUND TOWER A: its belfry (on the roll's side); while the way is below the belfry's
      // own height, to where it rises past it
      lookAt('tower A\'s belfry', P.belfryA, P.zHinge, route.zOverA, 0.5, 60),
      // (c) UP INTO THE HOLLOW: the hanging tower's belfry (ahead, then beside, level with the eye at the pass); it opens
      // abreast of the hinge square's fountain, inside (b), so the gaze stays on the roll while the way swings out
      lookAt('the hanging tower\'s belfry', P.belfryB, P.zHingeF, P.zB, 0.6, 110),
      // (d) UNDER THE HANGING TOWN: the hanging square's far end under the church (the roll's side, up)
      lookAt('the hanging square\'s far end', P.squareFar, P.zB, P.zSqWide, 0.45, 60),
      // (e) OUT OF THE OPEN SIDE: the hills under the afterglow (the other side, level); from the hanging square's
      // fountain to the wide street before the last. (e), (f) and (g) open one inside the other, so the gaze is never
      // the bare way down
      lookAt('the open side\'s hills', hills, P.zF, P.zMidWide, 0.4, 80),
      // (f) THE WAY DOWN: a park of the hanging town ahead (an orchard of the hanging outskirts beyond the ring): from the
      // wide street that parts the hanging square to the last straight; it holds the gaze level while the way falls,
      // so hanging streets stand over the way all the way down
      lookAt('a park of the hanging town (' + P.parkKind + ')', P.park, P.zSqWide, PLACE.LEVEL, 0.6, 110),
      // (g) UNDER THE FULL ROLL TO THE RING: the rise beside the ring: the land seen going up; it closes 60 m before the
      // ring, where the gaze is the engine's alone
      lookAt('the rise beside the ring', P.rise, P.zLastWide, PLACE.RING_CLEAR, 0.35, 60),
    ];
    {
      // the engine's mix, as it makes it (the heading 30 m ahead; each look by its bell and its weight, in turn)
      const pos = V3(0, 0, 0), ahead = V3(0, 0, 0), d = V3(0, 0, 0), q = V3(0, 0, 0), bell = ctx.core.bell, sst = ctx.core.smoothstep;
      const liftAt = (m, over) => {
        const u = m / LEN; path.posAtDist(m, pos); path.posAtDist(Math.min(LEN, m + 30), ahead); d.subVectors(ahead, pos).normalize();
        const guard = sst(0, 0.04, u) * (1 - sst(0.93, 0.985, u));
        for (const p of pois) { const w = bell(u, p.from, p.to, p.fade) * p.weight * guard; if (w <= 0.001) continue; over.push(p); q.copy(p.at()).sub(pos).normalize(); d.multiplyScalar(1 - w).addScaledVector(q, w).normalize(); }
        return Math.asin(d.y) / DEG;
      };
      let worst = 0;
      for (let turn = 0; turn < 60; turn++) {
        worst = 0; let who = null;
        for (let m = 0; m <= LEN; m += 5) { const over = [], l = liftAt(m, over); if (l > worst) { worst = l; who = over; } }
        if (worst <= LIFT_CAP || !who || !who.length) break;
        for (const p of who) p.weight *= 0.9;
      }
      for (const p of pois) { p.rec.weight = +p.weight.toFixed(3); delete p.rec; }
      lookEnds.lift = +worst.toFixed(1);
      await ctx.yield();
    }
    // THE PACE: 0.6 in the street (the entry to the hinge square's near edge), 1 by tower A's middle (over the roofs
    // and through the hollow), 0.88 at the ring, eased over the last straight (from where the way is level to the
    // ring): each ramp a cubic smooth step between the metres flown AT THOSE PLACES
    const mHinge = mAtZ(P.zHinge), mA = mAtZ(P.zA), mLevel = mAtZ(PLACE.LEVEL), mRing = mAtZ(PLACE.RING);
    const pace = (u) => 0.6 + 0.4 * ramp(u * LEN, mHinge, mA) - 0.12 * ramp(u * LEN, mLevel, mRing);

    // (the kit's prewarm is handed a camera of the route's own: the lens at the entry, turned along the way)
    const cam0 = new THREE.PerspectiveCamera(66, 16 / 9, 0.5, 6000);
    cam0.position.set(route.x(0), route.y(0), 0); cam0.lookAt(route.x(30), route.y(30), 30); cam0.updateMatrixWorld();
    await light.prewarm(ctx.renderer, cam0, scene);
    scene.userData.closing = {
      look, length: LEN, dens, looks: lookEnds, lift: lookEnds.lift, route: { x: route.x, y: route.y, xPass: route.xPass, yTop: route.yTop }, places: P,
      // this file's counts against section 9 (promenade 600, street's end 1,500, plain blocks 18,000, birds 10,200)
      own: { promenade: prom.tris, lampHolesOver: prom.holesOver, mouthsOver: prom.mouthsOver, streetsEnd: end.tris, furniture: end.furniture, plain: plain.tris, plainCount: plain.count, birds: flock.triangles, birdCount: flock.count, flockKept: flock.kept && { need: flock.kept.need, moved: flock.kept.moved, short: flock.kept.short } },
      parts: { land: land.tris, town: town.tris, townCount: town.count, far: far.tris, glow: glow.tris, glowCount: glow.count },
      life: life.stats,
    };
    function update(dt, time, camera, u) {
      sway.uSwayP.value.x = time;                             // the trees' and strings' sway: an ambient loop of the world's clock
      light.update(dt, time, camera);                         // the windows' law (uClock) and the dome
      glow.update(time);                                      // the smoke, by the same clock
      life.update(dt, time, camera, u);                       // the life part's one clock uniform
      flock.update(dt, time);                                 // the starlings wheel by the clock alone (a loop: the kit's step reads no camera and no share of the way)
    }
    return {
      scene, path, duration: 56,
      camera: { fov: 66, near: 0.5, far: 6000, lookAhead: 30, sway: 0, bank: 0 },
      pois, pace,
      portal: { shape: 'circle', radius: PLAN.RING_R, color: '#ffe4bd', glow: 1 },
      post: light.post,
      ride: 'none', companion: 'none', style: 'none',
      update,
      // (the land's dispose frees the plan's four textures too; a second dispose of a texture does nothing)
      dispose() {
        prom.dispose(); end.dispose(); flock.geometry.dispose(); flock.material.dispose(); life.dispose();
        for (const m of plain.group.children) m.geometry.dispose();
        land.dispose(); town.dispose(); far.dispose(); glow.dispose(); light.dispose();
        for (const pair of [materials.house, materials.tree]) { if (pair.dispose) pair.dispose(); else { pair.colour.dispose(); pair.depth.dispose(); } }   // (the core's pairs free their own two)
        tex.mean.dispose(); tex.cls.dispose(); flatTex.mean.dispose(); flatTex.cls.dispose();
      },
    };
  },
};
