// SKY WITH A SEAM: THE RIGS ON THE SKY WALL. What tells a visitor that people keep this sky in repair, and nobody
// is there: along the wall a stretch NOT YET PAINTED (bare primed steel from the water up, a half-made cloud on
// it), three large work stages and five painters' cradles hung before the wall on ropes, two tube scaffolds on
// floats at the wall's foot; the lamp of a moon on its crane, which stands on a moored pontoon before the lit
// seam, inside the tail's loop; the working lamps of the gantry in the opening; and THE PAINTERS' BARGE with its HOIST MAST at the
// wall's foot (the second file makes the gantry's lamps, the barge and mast, the stages, the wall scaffolds and
// the shadows).
//
// World frame as the hero part's: still water y = 0, north -Z, east +X, the shell a sphere of radius SHELL.R. Every
// place here is taken AT BUILD from the route as built (opts.path, opts.length, opts.marks C, D, E), from the
// shell's laws (wallPoint, dirOf, bearingOf), from the hero's law of our boat's shadow (shadowWholeFrom,
// shadowWall, LOOKS.shadow) and from the sky's own gap (sky.gap) and the ring's place (opts.ring): no mark,
// heading or wall bearing of the route, the shadow, the gap or the ring is copied here.
//
// THE RULES OF PLACE (metres from the route or from a mark of the place, true for the whole stretch on every seed;
// tools/film/sky-rigs-proof.mjs counts them):
// THE SHADOW'S WALL IS KEPT CLEAR (the owner's term: the mast's shadow on the clouds is the turn). The hero's law
//   tells, at build, the stretch of route over which our boat's whole shadow stands on the wall and its look is
//   open (from shadowWholeFrom to the mark D and LOOKS.shadow.hold + LOOKS.shadow.open m of the leg) and the band
//   of wall our sail's shade sweeps over it (shadowWall: its first and last bearing and its top, both looks, the
//   lamp's whole creep). OVER THOSE BEARINGS the wall is the hero's painted sky: nothing of this part stands at
//   the wall's foot there, no steel is primed there, and what hangs there (two stages, two cradles, their ropes
//   up to the rail) hangs far over the band (lowest skin 9.8 m as built, the band's top 5.8 m), so no sight line
//   from the eye on that stretch to the band is crossed. Everything at the wall's foot and the primed stretch
//   stand BEYOND the band's last bearing, on the leg's far part and past its end: AHEAD off the port bow through
//   the turn and along the leg (the proof counts the band, the sight lines and the places).
// THE WALL IS NEVER BARE: the great things on the wall's hand are the hung cradles, the work stages, the wall
//   scaffolds (and the hoist mast). From 200 m before the mark C to the mark E, at every place of the line at
//   least two of them stand ahead of it within 80 m of the line (three as built); from the mark C on, the
//   second of them stands 150 m off or so at the most (the proof prints it); at the mark C the first stage
//   hangs ahead within 100 m (the wall's foot dead ahead there is the shadow's).
// THE CRADLES (five, each 10 m long), each turned 22 degrees about its ropes, its far end out toward the line:
//   two right before the unpainted stretch; three dealt: two HIGH ones over the shadow's wall (one between the
//   first stage and the second, one between the second and the unpainted stretch), their decks 12 to 25 m up;
//   and one that hangs LOW AND FREE before the unpainted stretch's near part, beyond the shadow's wall, its deck
//   8 m up, plumb under the rail, 13 m off the wall's foot, 12 to 20 m to port of the line (the nearest cradle
//   to the line); each carries two lanterns and hangs on four wire ropes 0.05 m thick.
// THE LARGE WORK STAGES (three, in the wall's order: 24, 28 and 26 m long, 2.6 m wide, decks 11, 13 and 9 m over
//   the water, 1.5 m off the paint, eight lit lanterns under each, on stout dark wire ropes from dark brackets
//   at the rail: three pairs of bridge strand 0.12 m thick) stand still: one at the leg's start and one 0.55 of the way from it to the unpainted stretch
//   (both over the shadow's wall), one 5 m past the unpainted stretch's middle under the half-made cloud (it
//   carries a spray rig and pots); nearest skin 18 to 30 m from the line (23 to 25 m as built).
// THE WALL SCAFFOLDS (two: 5 bays by 9 lifts and 4 bays by 8 lifts; bays 4.5 m, lifts 2.4 m; 24 and 22 m tall;
//   heavy tubes: uprights 0.18 m across, ledgers 0.10 m, braces 0.09 m)
//   stand against the wall on green floats, cross-braced bays only, BEYOND THE UNPAINTED STRETCH, past the leg's
//   end: the first's float 5 m of wall past the stretch's far side (and 20 m or more past the mark E's bearing:
//   clear of the paddles' bank at the wall's foot), the second's 7 m beyond the first's; as built some 35 and
//   66 m of wall past the mark E, by the line's turn off the wall, 23 m and more from the line.
// THE UNPAINTED STRETCH lies ON the wall as drawn (0.07 m off it): 72 m along the wall, from the wall's foot at
//   the water to 46 m up it, ITS NEAR BRUSHED SIDE 4 m OF WALL BEYOND THE SHADOW'S WALL AT THE WALL'S FOOT. Its
//   skin is a clear metre wider at each side and as many metres wide at every height, so its corners lean
//   toward the shadow's wall as the wall curves in: THE SKIN BEGINS 3.0 m beyond the shadow's wall at the foot
//   and 2.8 m at its top corner, the least, which the proof measures and prints (it needs 1). (As built it lies
//   over the leg's last 55 m and 17 m of wall past the mark E.) It is opaque bare primed steel in THREE
//   TONES OF PRIMER, PLATE BY PLATE (an earth red, a grey earth, a paler earth; plate seams, rivets). ITS EDGE
//   STEPS PLATE BY PLATE, never a plain rectangle: no tape and no band; the sky's own painting, the wall as it
//   stands, has been carried in over it one plate at a time (a plate whose middle is less than 2.2 to 8.7 m, by
//   its own die, inside the stretch's sides or top is painted already; the skin is clear there), lapping over
//   the seams by a brush's wobble, with drips; on it THE HALF-MADE CLOUD (46 m wide, 23 m tall, its flat base
//   13 m up), plainly one cloud: its near half painted in as whole rounded heaps (white, a warm shade, a soft
//   flat base), the rest blocked in with chalk (its outline, a pale hatched scumble inside it); five test
//   swatches (three blues, two whites) beside it; two cradles right before it. Its image in the sea is the same
//   paint, mirrored.
// THE SHADOWS of the cradles, the stages and their ropes lie on the wall as drawn behind them, fixed at build (the
//   lamp-sun at the middle of its swing: the hero's undealt lampPlace at clock 0).
// THE BARGE AND ITS HOIST MAST (barge 44 by 14 m, 3 m of freeboard; mast 18 m wide, its top deck 65.7 m and its
//   gallows 71.1 m over the water, on stout standards 0.26 m across) stand at the wall's foot before (anticlockwise of) the stretch of wall where
//   our boat's shadow first climbs, 6 m of wall and more short of it, and BY THE LAW OF DISTANCE BY HEIGHT at
//   least 1.8 times the mast's height, level, skin to line, from the route along its whole length: 128 m and more
//   (some 130 m as built, where the line curves onto its last heading before the wall).
// THE MOON'S CRANE STANDS BEFORE THE LIT SEAM, on the water inside the tail's loop: its tower's axis 70 m to port
//   of the line's place 90 m before the line's end at the ring (on the last straight into the seam), its pontoon
//   lying along that straight. So from the turn off the wall, the run and the first of the swing (258 m of the
//   tail as built, from the mark E on) the tower stands within 15 degrees, level, of the sight line to the seam's
//   foot, nearer than the seam; and the last straight passes it to port, the tower's steel 60 to 110 m level
//   from the line at the nearest (68 m as built), a crane 44.5 m tall, its slewing ring 34.5 m up, its tower a
//   dark plated box 3.2 m square inside its four legs and their cross-braces. THE RING'S
//   SIGHT LINES: on the last straight no point of it stands across a line to the ring's rim plus 3 m (least miss
//   90 m as built); from the rest of the route it stands before the seam BY THIS RULE, and from some of it (the
//   proof tells the metres: 88 m after the mark E, on the run, and the far bay line and wall leg) its hull lies across a line to
//   the ring's disc. Its PONTOON IS A HULL FROM AFAR: 24 by 14 m, 4.4 m of freeboard in ochre, a dark waterline
//   band 1.3 m tall, a white band, six lit deck lamps on posts, the tower's feet on four yellow blocks on its
//   deck, moored to two buoys 7 m off its ends; its image in the sea. The jib is 60 m long (a dark plated girder
//   1.1 to 2.3 m deep) and slews 24 degrees either way about the line's own heading abreast of the tower (the
//   last straight's: it points on toward the seam's wall, which stands 70 m and more off along it); the globe is
//   12 m across on a plated yoke 55 m out, its middle 27.7 m up, well over the boat's eye; jib and globe 30 m and
//   more from the line at every phase of the slew (48 m as built); the globe's lit face is not built in: at each
//   draw the paint lights the face toward the lamp-sun's place then (the built sky's own lamp, sky.lampAt), so
//   the bright side faces the lamp at every phase of the slew.
//
// WHAT THE CLOCK MOVES (a world is entered at any clock; each is a bounded course, counted whole by the proof;
// NO PHASE IS TYPED: each is drawn once at build, all dice first, the cradles' from the stream sky-cradles, the
// slew's from sky-moon, every other from sky-movers, each with the seed):
// each cradle's sway about its rail (two sines); the crane's jib slewing to and fro with the globe (a sine); the
// mast's lift cage up and down its cables (a sine); the gantry's hook, beacons, sheaves and endless cable (they
// turn in place); the dust in the work lamps' cones (a medium, wrapped). Nothing here reads the metres of route
// flown but the two lamps that ride the panels' cut edges, which go where the panels go.
//
// AN IMAGE IN THE SEA: the crane, its globe, the low cradle, the barge and its mast, the wall scaffolds (their
// floats, uprights, decks and tarps) and the unpainted stretch are
// drawn once more as their mirror images under the still water (MIRROR), by the law the hero's sea gives (over the
// sea's sheet, under the hero's thin layers): an image is a sheen, not a body (it is listed neither in movers nor
// in statics); a thin member's image is thinned by the same true cover as the member and, where the member is
// drawn wider than it is, blended without writing depth (in the netting's image's draw). EVERY SOLID'S IMAGE IS
// LAID ONCE, ITS NEAREST SKIN, whatever the order its corners were built in: the image's depth (the level the
// sea's law gives) is worked from the pixel's own place, the same for every skin there (levelAim), the solids'
// depth is laid before any colour, and a colour is blended only where it is nearer than what stands (RIG_FRAG,
// joinDraws). OUR BOAT'S SHADOW lies on the rigs as on the wall (the hero's GLSL_SHADOW).
//
// WHAT DETAIL THINS (opts.detail under 1: a phone's build). The decks, hulls, masts, ropes and every mover's
// course are the same at any detail. What is thinned is NOT a part of the whole build left
// standing: a row that is evenly spaced (bearers, posts, lanterns, bays) is spaced anew along the same
// piece by its smaller count, and the small dealt things of a cradle or a stage (drums, tarps, sheets, poles)
// and the moths of dust take their dice by a running count, so those that remain stand at other dealt places
// and in other tones. On
// each cradle the cross bearers 7 to 5, rail posts 7 to 5, drums 5 to 3, roller poles 3 to 2; the unpainted
// stretch's skin 44 by 22 squares to 30 by 16 (its image's skin is 16 by 8 at any detail); the pontoon's rail posts 6 to 4 a side, the
// crane tower's bays 8 to 6, the jib's bays 19 to 13, the globe 30 by 14 faces to 20 by 10, the festoons 8 to 5;
// on each stage the cross bearers 6 to 4, rail posts 8 to 5, tarps 3 to 2, drums 6 to 4, lanterns 8 to 5; on the
// gantry the work lamps' cones 16 sides to 10 and the moths of dust per lamp 44 times the detail. (The barge, the
// mast and the wall scaffolds are the same at any detail.)
//
// THE LAW OF FILTERING AND OF BEARING IN THIS PART (the owner's rule: a thing narrower than a pixel's footprint
// may be thinned in strength by its true width over the footprint, never made wider so as to be seen and never
// given a floor; a pattern is let go to ITS OWN MEAN, never to nothing; a term of the eye's bearing reads it as
// light does).
//   THE THIN MEMBERS are every round member built with its axis (Geo.tube, thin): the cradles' ropes, rails,
//   posts, stirrups and poles; the rail far above and its stand-offs; the stages' ropes, guard rails, hanging
//   frames, bumper arms and hoses; the wall scaffolds' and the mast's tubes, the mast's gallows and cables; the
//   crane's legs, ties and cross-braces, the jib's chords, lacing, pendants and festooned cable, the pontoon's
//   rails, lamp posts and mooring lines; the barge's lanyards, chains and hose; the gantry's booms, stays, cables,
//   chain and hook. Where one would be under 1.5 pixels wide it is drawn 1.5 pixels wide AT THE COVER IT TRULY
//   HAS, its radius over the radius drawn, whole (the law stands at Geo and at the paint): no floor, no share.
//   So a rope far off is a faint line and comes up as the eye nears it. What must read from afar reads by ITS
//   BODY: the stages' strand, the scaffolds' and the mast's tubes are stout, the crane's tower and jib are plated.
//   AS DRAWN, a thin member is ONE STRIP along its axis, turned to the eye and as wide as the member is from
//   every side (twice its radius), with a round bar's normal across it: a round member's own look from any side,
//   as the kit's wire is drawn. (Its skin, kept for the proof and the movers, is the round tube as built.)
//   THE UNPAINTED STRETCH'S MARKS (seams, rivets, chalk grid, hatch, outline, drips) are filtered by the pixel's
//   footprint to their own means (the law and each mean stand in its paint). No mark or member here is faded,
//   thinned, sized or hidden by its distance from the eye: the scene's own fog is the only air.
//   THE EYE'S BEARING is read only as light does: a beacon's dome is brighter toward where its reflector is
//   turned (a lamp's glare by how it faces the eye); a globe of lit glass is a little dimmer toward its limb;
//   an image in the sea is as strong as water mirrors at the ray's slant; a work lamp's cone glows by the length
//   of lit air the ray crosses (the second file). No sheet or card here is faded by how it faces the eye.
//
// HOW IT IS DRAWN (the world's draws are held to a budget): TEN DRAWS for the whole part, the same at every place
// of the route (no draw of it is culled by the frame): every painted body joined in one draw, their thin members
// once more in the paint's blended twin's, their images in the sea in one (joinDraws); the netting and its
// image (whose draw also lays the thin members' images where they are drawn wider than they are); the
// unpainted stretch and its image; the shadows on the wall; all the light in the air (cones, pools,
// beams) in one; the moths of dust. The bodies' own meshes are kept as skins and not drawn: movers and statics
// list them as before, the movers pose them, and the joined draw takes each mover's pose by its slot.
// `triangles` is what the frame is sent, every draw counted (a thin member's strip counts in the paint's draw
// and again in the twin's; an imaged solid's corners count twice in the image's draw, once for its depth and
// once for its colour; an imaged thin member's strip counts in the image's draw and again in the netting's
// image's; a skin counts for nothing): the proof counts the same from the root and holds it to the
// part's budget.
//
// NO LIGHT: every lamp is emissive. The ring has no double: no lamp here is ring-shaped, the beacons are small
// amber domes high on the steel. Nothing lettered, nobody, NOTHING STAIR-LIKE OR LADDER-LIKE and no door at or
// before the sky wall: the mast is cross-braced tubes, plain decks reached by the cage alone, the barge's
// deckhouse has windows and no door; the cradles' poles lean apart; the crane's tower is cross-braced; the stages
// are plain decks on ropes.
//
//   await makeRigs(ctx, { look, sky, path, length, marks: { C, D, E }, ring, detail }) ->
//     { object, update(dt, time, camera), dispose(), moonAt(time, out), movers, statics, triangles, material, skin,
//       sites, stages, scaffolds, shadowWall, turret, pontoon, scaffold, dice }
//   ALL THREE MARKS ARE NEEDED: C (the metre where the bay's straight line ends: the hero's shadow law and the
//   mast's place are reckoned from it), D and E (the wall leg's first and last metre).
//   (`object` holds what is drawn; the meshes in movers and statics are the bodies' skins, kept out of the scene)
//   (the result's `scaffold` is the barge and hoist mast's record: the name is kept for who reads it; `scaffolds`
//   are the two wall scaffolds' sites; `shadowWall` is the shadow's wall as this build read it from the hero's
//   law ({ from, to: metres of route; lo, hi: wall bearings; top: metres up }); `dice` tells, for the mast, the stages and the wall scaffolds, how many
//   dice were drawn and how many read)
//   movers: [{ name, meshes, dims, set(a, b) }]: each body the clock moves, with its course as one or two numbers
//   from -1 to 1 (or a turn), for the proof to walk whole; statics: the meshes that stand still.
import * as THREE from 'three';
import { SHELL, LAMP, LAMP_LIGHT, PAINTS, GLSL_SHADOW, LOOKS, dirOf, bearingOf, wallPoint, lampPlace, shadowWholeFrom, shadowWall } from './sky-with-a-seam.js';
import { makeGantryLamps, makeScaffold, makeStages, makeWallShadows, makeWallScaffolds, WSCAF, scaffoldDice } from './sky-with-a-seam-rigs-b.js';

const RAD = Math.PI / 180;
// THE RIGS' typed measures (metres; arcs are metres up the wall along its curve)
export const RIGS = {
  rail: { arc: 101, inset: 0.7 },                       // the cradles' rail far above: a plumb line from it falls 13 m off the wall's foot
  // off: its nearer end's deck from the painted face; turn: degrees each is turned about its ropes, its far end out
  // toward the line (so that its long side shows to who comes along the wall); heights: arcs dealt to the free ones
  // rope: the radius of its four wire ropes (0.05 m thick: a cradle 10 m long hangs 76 to 93 m under the rail. A
  // rope narrower than one and a half of a pixel's footprint is drawn that wide and carries only its true cover,
  // its thickness over the width drawn, so it is a faint line far off and comes up as the eye nears it: 0.6 of
  // its line where a pixel covers 5.6 cm of it, 0.2 where a pixel covers 17 cm)
  cradle: { len: 10, wide: 1.3, off: 1.5, turn: 22, lowY: 8, heights: [13.5, 18.5, 23.5], sway: 0.1, swayIn: 0.03, lowSway: 0.28, rope: 0.025 },
  // the unpainted stretch: wide m along the wall between its brushed sides, from the wall's foot up to arc a1. IT
  // LIES BEYOND THE SHADOW'S WALL: its near brushed side, at the wall's foot, `clear` m of wall past the last
  // bearing our sail's shade sweeps (the hero's shadowWall; its skin, a metre wider, 2.8 m at the least: the
  // head). The cloud to be: half its width, its height, its base's arc, the chalked squares'
  // side; cradles: the two that hang before it (m from the stretch's middle, the deck's arc): one over the
  // cloud's painted half, one over its chalked half; low: where the LOW cradle hangs before the stretch's near
  // part (m from its middle: its place is dealt between the two)
  patch: { wide: 72, a1: 46, clear: 4, cloudHalf: 23, cloudH: 23, cloudBase: 13, square: 4, cradles: [[-15, 14.5], [25, 22.5]], low: [-31, -27] },
  // the moon's crane, BEFORE THE LIT SEAM: its tower's axis stands `near` m to port of the line's place `before`
  // m before the line's end at the ring (on the last straight into the seam), on the water inside the tail's
  // loop, on a pontoon that lies along the straight; the tower's slewing ring `ring` m up, the jib's foot `foot`
  // m over it; the jib slews `slew` degrees either way about the line's own heading at that place
  moon: { before: 90, near: 70, pontoon: [24, 14], deck: 4.4, ring: 34.5, foot: 2.6, tower: 3.2, apex: 9.4, jib: 60, reach: 55, tail: 12,
    globe: 6, drop: 3.4, slew: 24, period: 44 },
  // the wall scaffolds (the second file's) stand BEYOND THE UNPAINTED STRETCH, past the leg's end: the first's
  // float `gap` m of wall past the stretch's far side and no less than `pastE` m of wall past the mark E's
  // bearing (clear of the paddles' bank at the wall's foot, which ends within one flap of the leg's end: the
  // proof reads the machines' own law); the second's float `between` m of wall beyond the first's
  front: { gap: 5, pastE: 20, between: 7 },
  // the large work stages hung from the wall along the leg: wide m across, off m between its wall side and the
  // paint; each one's length and its deck's height over the water, IN THE WALL'S ORDER: the first at the leg's
  // start; the second `mid` of the way from the first to the unpainted stretch (both hang over the shadow's wall,
  // far over its band); the third at the unpainted stretch, `at` m along the wall from its middle (the spray rig's)
  stage: { wide: 2.6, off: 1.5, at: 5, mid: 0.55, list: [{ len: 24, y: 11 }, { len: 28, y: 13 }, { len: 26, y: 9 }] },
};
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);

// ---- the builder of every solid here: flat-shaded triangles with a colour, a glow (emissive: x strength, y kind:
// 0 a steady lamp, 1 to 3 a beacon's dome) and, for a THIN ROUND MEMBER (a tube, a rope, a rail, a lattice's
// lacing), its axis and its true radius. THE LAW OF A THIN MEMBER (as the kit's wire's): where it would be under
// 1.5 pixels wide it is drawn 1.5 pixels wide AND CARRIES ONLY THE COVER IT TRULY HAS, its own radius over the
// radius drawn, whole (no floor, no share): far off a rope is a faint line and comes up as the eye nears it. So
// the thin members are kept apart (this.thin) and laid after the solids in the geometry, as a second group that
// the mesh draws once more with the paint's blended twin (mesh, rigMaterial below). AS BUILT every such mesh is
// kept as a skin and its thin members are drawn as strips in the part's joined draws (joinDraws, RIG_VERT): the
// round tubes here are what the proof measures and what a body drawn by itself would show.
export class Geo {
  constructor() { this.P = []; this.N = []; this.C = []; this.G = []; this.A = []; this.thin = { P: [], N: [], C: [], G: [], A: [] }; this.col = new THREE.Color('#888888'); this.glow = [0, 0]; }
  color(hex, m = 1) { this.col.set(hex).multiplyScalar(m); return this; }
  lamp(s = 0, kind = 0) { this.glow = [s, kind]; return this; }
  tri(a, b, c, ax) {
    const ux = b.x - a.x, uy = b.y - a.y, uz = b.z - a.z, vx = c.x - a.x, vy = c.y - a.y, vz = c.z - a.z;
    let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx; const l = Math.hypot(nx, ny, nz) || 1; nx /= l; ny /= l; nz /= l;
    const q = [a, b, c], S = ax && ax[3] > 0 ? this.thin : this;         // (a thin member's triangles: the second group)
    for (let i = 0; i < 3; i++) { S.P.push(q[i].x, q[i].y, q[i].z); S.N.push(nx, ny, nz); S.C.push(this.col.r, this.col.g, this.col.b); S.G.push(this.glow[0], this.glow[1]);
      if (ax) S.A.push(ax[i].x, ax[i].y, ax[i].z, ax[3]); else S.A.push(0, 0, 0, 0); }
    return this;
  }
  quad(a, b, c, d, ax) { this.tri(a, b, c, ax && [ax[0], ax[1], ax[2], ax[4]]); return this.tri(a, c, d, ax && [ax[0], ax[2], ax[3], ax[4]]); }
  // a box about c with half sizes hx, hy, hz along the unit axes ex, ey, ez
  box(c, ex, ey, ez, hx, hy, hz) {
    const v = (i, j, k) => c.clone().addScaledVector(ex, i * hx).addScaledVector(ey, j * hy).addScaledVector(ez, k * hz);
    const p = [v(-1, -1, -1), v(1, -1, -1), v(1, 1, -1), v(-1, 1, -1), v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1)];
    this.quad(p[1], p[0], p[3], p[2]); this.quad(p[4], p[5], p[6], p[7]); this.quad(p[3], p[7], p[6], p[2]); this.quad(p[0], p[1], p[5], p[4]); this.quad(p[5], p[1], p[2], p[6]); return this.quad(p[0], p[4], p[7], p[3]);
  }
  // a round member from a to b: radii ra, rb, n sides; thin = true: a thin member (the law above); caps close its ends
  tube(a, b, ra, n = 6, thin = false, rb = ra, caps = false) {
    const d = V().subVectors(b, a), u = Math.abs(d.y) > 0.9 * d.length() ? V(1, 0, 0) : V(0, 1, 0);
    const e1 = V().crossVectors(u, d).normalize(), e2 = V().crossVectors(d, e1).normalize();
    const pt = (i, base, r) => { const an = (i / n) * 2 * Math.PI; return base.clone().addScaledVector(e1, Math.cos(an) * r).addScaledVector(e2, Math.sin(an) * r); };
    for (let i = 0; i < n; i++) { this.quad(pt(i, a, ra), pt(i + 1, a, ra), pt(i + 1, b, rb), pt(i, b, rb), thin ? [a, a, b, b, Math.max(ra, rb)] : null);
      if (caps) { this.tri(a, pt(i + 1, a, ra), pt(i, a, ra)); this.tri(b, pt(i, b, rb), pt(i + 1, b, rb)); } }
    return this;
  }
  // a ball about c, or a zone of one from the height angle e0 up to e1: nb bands by ns sides
  ball(c, r, ns = 12, nb = 6, e0 = -Math.PI / 2, e1 = Math.PI / 2) {
    const pt = (i, j) => { const e = e0 + (e1 - e0) * j / nb, an = (i / ns) * 2 * Math.PI; return V(c.x + Math.cos(an) * Math.cos(e) * r, c.y + Math.sin(e) * r, c.z + Math.sin(an) * Math.cos(e) * r); };
    for (let j = 0; j < nb; j++) for (let i = 0; i < ns; i++) this.quad(pt(i, j), pt(i, j + 1), pt(i + 1, j + 1), pt(i + 1, j));
    return this;
  }
  // the solids first, the thin members after them. Where there are thin members: two groups, 0 the whole of it
  // (the paint's: it leaves out what is drawn wider than it is), 1 the thin members alone (the blended twin's).
  // Every corner carries the slot 0 (the root's own frame) and the side 0 (no strip): what the paint reads of a
  // mesh drawn by itself (the netting, its image, a body beyond the slots) is then its own and no card's default
  geometry() {
    const g = new THREE.BufferGeometry(), T = this.thin, all = (k) => (T[k].length ? this[k].concat(T[k]) : this[k]), ns = this.P.length / 3, nt = T.P.length / 3;
    g.setAttribute('position', new THREE.Float32BufferAttribute(all('P'), 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(all('N'), 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(all('C'), 3)); g.setAttribute('aGlow', new THREE.Float32BufferAttribute(all('G'), 2)); g.setAttribute('aAxis', new THREE.Float32BufferAttribute(all('A'), 4));
    g.setAttribute('aSlot', new THREE.BufferAttribute(new Float32Array(ns + nt), 1)); g.setAttribute('aSide', new THREE.BufferAttribute(new Float32Array(ns + nt), 1));
    if (nt) { g.addGroup(0, ns + nt, 0); g.addGroup(ns, nt, 1); }
    g.computeBoundingSphere(); return g;
  }
  get triangles() { return (this.P.length + this.thin.P.length) / 9; }
}
// ---- THE RIGS' ONE MATERIAL: painted steel, timber, rope and lamps. Inside the shell it is lit by the dome's fill
// and the lamp-sun's key from the lamp's own place; beyond the wall only by the work lamps and the turning beacons
// (their light is this shader's law: there is no three.js light). A lamp is emissive: its colour times aGlow.x.
// A beacon's dome (aGlow.y 1 to 3) is bright toward where its reflector is turned, as a turning lamp is.
// A THIN MEMBER'S WIDENING (vWide): the radius it is drawn at over its true radius: 1 where it is 1.5 pixels
// wide or wider (0.75 pixel of radius at its place; uPix: two over the frame's rows, set at each draw), more
// where it is drawn wider than it is. Where vWide is 1 the member is drawn AS IT IS, a solid, by the paint
// itself (in a joined draw, a strip as wide as the member, turned to the eye, its normal a round bar's: the
// branch on aSide below; a mesh drawn by itself widens its round skin about its axis: the other branch);
// where it is over 1 the paint leaves it out and the paint's blended twin (THIN) draws it 1.5 pixels
// wide at the alpha 1 / vWide: THE COVER IT TRULY HAS, its own radius over the radius drawn, whole. In an image
// in the sea the same cover thins the image.
// A JOINED DRAW (joinDraws below): every corner carries its body's slot (aSlot); slot 0 stands still, the others
// are the movers', whose frames (uMove) are set at each draw from the movers' own poses.
const NMOVE = 20;                                      // the slots a joined draw has (the movers are 15 as built)
// THE LEVEL AN IMAGE IN THE SEA STANDS AT IN DEPTH (the hero's sea gives it: just over the swell's crest), AND
// ITS DEPTH AS A LAW OF THE PIXEL'S PLACE. The depth a flat level has in a picture is one plane law of the
// pixel's place: a x + b y + c (uLevel). levelAim gives the hook that works it out AS AN IMAGE IS DRAWN (three
// calls a mesh's onBeforeRender before each draw of it, with the eye it is drawn for), from the eye's own
// matrices (its place and axes, its projection) and the rectangle being drawn into, whatever target that is:
// the world's up in the eye's axes (the view matrix's second column), the fall of a pixel's ray per metre of
// depth before the eye, and the eye's height over the level; the depth where the ray meets the level follows
// as the projection writes any depth. It reads the projection and the rectangle ONLY TO KNOW WHICH RAY A PIXEL
// IS: what it gives is the place where that ray meets the level, which is the same whatever the picture's
// size. Why so, and not from the image's own corners: what a triangle hands on at a pixel is true to a
// fraction of a pixel only (a card sets its corners on a grid of sixteenths of a pixel or finer), and by the
// water that fraction of a pixel is more depth than lies between a solid's two skins; so two skins' depths
// fell either way round in patches (seen: the far side of the crane's globe showed through its near side's
// image). The bay's image works its depth from the pixel's ray likewise (its uRay). The hook makes nothing:
// its one vector is made here, at build.
const LEVEL = 0.24;
const levelAim = (uLevel) => { const vp = new THREE.Vector4();
  return (renderer, scene, camera, geometry, material) => {
    const p = camera.projectionMatrix.elements, v = camera.matrixWorldInverse.elements; renderer.getCurrentViewport(vp);
    // a pixel at x, y stands at nx = 2 (x - vp.x) / vp.z - 1, ny likewise, and its ray runs ((nx + p[8]) / p[0],
    // (ny + p[9]) / p[5], -1) per metre of depth; the world's up is (v[4], v[5], v[6]) in those axes; the ray's
    // fall per metre is minus their product: gx x + gy y + g0
    const ux = v[4] / p[0], uy = v[5] / p[5], gx = -2 * ux / vp.z, gy = -2 * uy / vp.w, g0 = ux * (2 * vp.x / vp.z + 1 - p[8]) + uy * (2 * vp.y / vp.w + 1 - p[9]) + v[6];
    // the level is met at the depth (the eye's height over it) / fall; the projection writes a depth z as 0.5 - p[10] / 2 + (p[14] / 2) / z
    const k = 0.5 * p[14] / Math.max(camera.matrixWorld.elements[13] - LEVEL, 1e-3);
    uLevel.value.set(k * gx, k * gy, 0.5 - 0.5 * p[10] + k * g0); if (material) material.uniformsNeedUpdate = true; }; };
const RIG_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aAxis; attribute vec2 aGlow; attribute float aSlot, aSide;
uniform float uPix; uniform vec3 uBeaconP[3]; uniform vec4 uBeam[3]; uniform mat4 uMove[${NMOVE}];
varying vec3 vCol, vN, vW; varying float vGlow, vKind, vWide;
#ifdef NET
varying vec2 vNet;                                    // a net's corner carries its place on the cloth (metres) in aAxis.xy
#endif
#ifdef MIRROR
varying float vPre;                                   // 1: a corner that lays an image's depth before its colour (aSide 3); -1: a strip's corner (aSide 1 or -1); else 0
#endif
#include <fog_pars_vertex>
void main(){
  vec3 p = position, eye = cameraPosition;
#ifdef MIRROR
  eye.y = -eye.y;                                     // an image is seen as from the eye's own image under the water
#endif
  mat4 mm = modelMatrix * uMove[int(aSlot + .5)];     // (the body's own frame: its slot's)
  vWide = 1.;                                         // (a solid, or a member drawn as it is)
  vec4 wp;
  if (aAxis.w > 0. && abs(aSide) > .5) {
    // A ROUND MEMBER AS ONE STRIP TURNED TO THE EYE (a joined draw's; as the kit's wire is drawn): this corner is
    // an end of its axis (position), aAxis.xyz the other end, aSide the side of the axis it stands on. The strip
    // is as wide as the member is from every side (twice its radius, or the 1.5 pixels of the law) and its
    // normal goes round from one edge to the other as a round bar's does
    vec3 a = (mm * vec4(position, 1.)).xyz, d = normalize((mm * vec4(aAxis.xyz, 1.)).xyz - a), v = eye - a;
    vec3 sd = cross(d, v); sd *= inversesqrt(max(dot(sd, sd), 1e-8));
    float want = max(aAxis.w, .75 * uPix * length(v) / projectionMatrix[1][1]); vWide = want / aAxis.w;
    wp = vec4(a + sd * (aSide * want), 1.); vN = sd * aSide + .35 * cross(sd, d);
  } else {
    if (aAxis.w > 0.) { vec4 cw = mm * vec4(aAxis.xyz, 1.); float dist = length(eye - cw.xyz);
      float want = max(aAxis.w, .75 * uPix * dist / projectionMatrix[1][1]); vec3 off = position - aAxis.xyz; vWide = want / aAxis.w; p = aAxis.xyz + off * vWide; }
    wp = mm * vec4(p, 1.); vN = normalize(mat3(mm) * normal);
  }
  vW = wp.xyz; vCol = color;
#ifdef NET
  vNet = aAxis.xy;
#endif
  float g = aGlow.x;
  for (int i = 0; i < 3; i++) { if (abs(aGlow.y - float(i + 1)) < .5) {
    vec2 e = cameraPosition.xz - uBeaconP[i].xz; e *= inversesqrt(max(dot(e, e), 1e-4));
    float lobe = smoothstep(.35, 1., dot(e, uBeam[i].xy)); g = aGlow.x * (.22 + 1.9 * lobe * lobe * uBeam[i].z); } }
  vGlow = g; vKind = aGlow.y;
#ifdef MIRROR
  wp.y = -wp.y; vPre = step(2.5, aSide) - step(.5, abs(aSide)) * step(abs(aSide), 1.5);
#endif
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const RIG_FRAG = /* glsl */`
uniform vec3 uLampCol, uFillCol, uAmber, uWorkCol, uBeaconP[3], uMoonAt, uMoonSun, uMoonDark; uniform vec4 uBeam[3], uWork[4]; uniform float uKey, uFill;
varying vec3 vCol, vN, vW; varying float vGlow, vKind, vWide; uniform float uClock;
#ifdef NET
varying vec2 vNet;
#endif
#ifdef MIRROR
varying float vPre; uniform vec3 uLevel;              // (uLevel: the depth of the level an image stands at, as a law of the pixel's place: levelAim)
#endif
#include <fog_pars_fragment>
${GLSL_SHADOW}
// (h21 IS THE KIT'S OWN hash12, of src/kit/fx.js, carried here as the kit has it: it follows "Hash without Sine",
// David Hoskins, 2014, MIT, whose notice the kit's head names and the site ships: covered by section 181 a,
// nothing brought in anew. vn is the common value noise: four hashed corners and a cubic fade)
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
void main(){
  // EVERY DERIVATIVE OF THIS PAINT IS TAKEN HERE, FIRST, into plain values, before any discard (a card that ends
  // a discarded pixel there and then hands its neighbours a wrong derivative): the footprint of the place itself
  // (for our boat's shadow), of the still water's place where the eye's ray to an image crosses it (for the
  // ripples), of a net's cloth (for its strands)
  vec3 E = cameraPosition; float footW = min(length(fwidth(vW)), 2.);
#ifdef MIRROR
  float k0 = clamp(E.y / max(E.y + vW.y, 1e-3), 0., 1.); vec2 wxz = E.xz + (vW.xz - E.xz) * k0; float fww = max(length(fwidth(wxz)), 1e-4);
#endif
#ifdef NET
  vec2 netQ = vNet * 10., netF = max(fwidth(netQ), vec2(1e-4));
#endif
  // a thin member drawn wider than it is is the blended twin's (THIN: alpha its true cover); drawn as it is, the paint's own
  float wide = step(1.0005, vWide), cover = 1. / max(vWide, 1.);
#ifdef THIN
  if (wide < .5) discard;
#else
#ifndef MIRROR
  if (wide > .5) discard;
#endif
#endif
#ifdef MIRROR
  // A STRIP'S IMAGE (vPre -1: a thin member of the joined draws) IS LAID BY TWO DRAWS, each pixel of it by one.
  // Where the member is drawn AS WIDE AS IT IS its image is the joined image's: a solid's, which writes its depth.
  // Where it is drawn WIDER THAN IT IS its image is the netting's image's draw's (NET, which carries the same
  // strips after its veils: joinDraws): blended at the cover it truly has over what stands, WRITING NO DEPTH, so
  // that a faint line 1.5 pixels wide cuts nothing out of an image that is laid after it and stands behind it
#ifdef NET
  if (vPre < -.5 && wide < .5) discard;
#else
  if (vPre < -.5 && wide > .5) discard;
#endif
  // (in an image, where a thin member is drawn wider than it is, one face of it alone is drawn, so that its cover
  // is laid once: of a round skin the half toward the eye, which an image, the body turned over, shows wound the
  // other way round; a strip's one face likewise)
  if (wide > .5 && gl_FrontFacing) discard;
  E.y = -E.y;                                         // (from here on the eye is its own image under the water; wxz, fww above: the still water's place and the ripples' footprint there)
#endif
  vec3 n = normalize(vN + 1e-5), vd = E - vW; vd *= inversesqrt(max(dot(vd, vd), 1e-4)); if (dot(n, vd) < 0.) n = -n;
  vec3 L = uLamp - vW; float ld = max(length(L), 1.); L /= ld;
  float inside = 1. - step(${(SHELL.R - 0.3).toFixed(2)}, length(vW));
  vec3 lit = uFillCol * uFill * mix(.1, 1., inside) * (.74 + .26 * n.y) + uLampCol * uKey * 1.25 * max(dot(n, L), 0.) * inside * (1. - boatShadeOn(vW, n, footW));   // (our boat's shadow lies on the rigs too)
  // the work lamps' pools (beyond the wall there is no other steady light)
  for (int i = 0; i < 4; i++) { vec3 d = uWork[i].xyz - vW; float dd = max(dot(d, d), 1e-2);
    lit += uWorkCol * uWork[i].w * (.25 + .75 * max(dot(n, d * inversesqrt(dd)), 0.)) / (1. + dd / 240.); }
  // the beacons' turning beams on the steel: an eased lobe about each beacon's own upright axis
  for (int i = 0; i < 3; i++) { vec3 d = vW - uBeaconP[i]; float dd = max(dot(d, d), 1e-2);
    vec2 h = d.xz * inversesqrt(max(dot(d.xz, d.xz), 1e-4)); float lobe = smoothstep(.45, 1., dot(h, uBeam[i].xy)); lobe *= lobe;
    lit += uAmber * uBeam[i].z * lobe * (.3 + .7 * max(dot(n, -d * inversesqrt(dd)), 0.)) / (1. + dd / 70.); }
  // a globe lamp (kind 4) is a little dimmer toward its limb, as a lit ball of glass is
  float limb = mix(1., .7 + .3 * abs(dot(n, vd)), step(3.5, vKind));
  vec3 col = mix(vCol * lit, vCol * vGlow * limb, step(.001, vGlow));
  // THE MOON'S GLOBE (kind 4): its face toward the lamp-sun's place is lit cream, its other face is shaded
  // blue-grey paint, a soft terminator between. uMoonAt (the globe's middle) and uMoonSun (the unit direction
  // from it to the lamp-sun) are set at each draw: the bright side faces the lamp at every phase of the slew
  if (vKind > 3.5) { float mk = clamp((dot(normalize(vW - uMoonAt), uMoonSun) + .12) / .4, 0., 1.); mk = mk * mk * (3. - 2. * mk);
    col = mix(uMoonDark, vCol, mk) * ((.42 + (vGlow - .42) * mk) * limb); }
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
#ifdef THIN
  gl_FragColor.a = cover;                            // THE COVER IT TRULY HAS: its radius over the radius drawn
#endif
#ifdef NET
  // SAFETY NETTING: a mesh of 0.1 m whose strands are a quarter of it. Over a pixel's footprint the strands are
  // counted exactly (a box filter), so that far off the net is its mean cover: a veil
  { vec2 q = netQ, f = netF, q0 = q - .5 * f, q1 = q + .5 * f;      // (the cloth's place and its footprint, taken at the head)
    vec2 cv = ((floor(q1) * .25 + min(fract(q1), .25)) - (floor(q0) * .25 + min(fract(q0), .25))) / f;
    float na = clamp(1. - (1. - cv.x) * (1. - cv.y), 0., 1.);
#ifdef MIRROR
    na = max(na, step(.5, -vPre));                     // (a strip's image, which the netting's image's draw carries, is no veil: whole here, thinned below by its own cover)
#endif
    gl_FragColor = vec4(gl_FragColor.rgb * na, na); }
#endif
#ifdef MIRROR
  // AN IMAGE IN THE SEA, by the law the hero's sea gives: as strong as the water mirrors by the ray's slant, its
  // edge broken by the ripples at the water's own place (their pattern filtered by its footprint), its depth the
  // depth where the eye's ray meets the level ${LEVEL} m (just over the swell's crest); what stands under the water
  // has no image
  float cosT = cameraPosition.y / max(length(vec3(wxz.x - cameraPosition.x, cameraPosition.y, wxz.y - cameraPosition.z)), 1e-3), gz = 1. - clamp(cosT, 0., 1.);
  float rp = vn(wxz * .55 + uClock * vec2(.1, .16)) * .55 + vn(wxz * 1.9 - uClock * vec2(.27, .12)) * .45;
  float al = (.74 + .24 * gz * gz) * mix(1., mix(smoothstep(.36, .64, rp), .5, smoothstep(.5, 2., fww)), .24) * cover;      // (a thin member's image: by its true cover)
  gl_FragColor = vec4(gl_FragColor.rgb * (.88 * al), gl_FragColor.a * al);
  // THAT DEPTH IS WORKED FROM THE PIXEL'S OWN PLACE, not from what a triangle hands on (uLevel: levelAim), so
  // that every skin of an image has THE VERY SAME level's depth at a pixel, to the last bit; the one thing that
  // then tells two skins apart is the term after it, by each skin's own true depth: the nearer skin stands a
  // little nearer (0.02 of its true depth's share: the same term every part's image of this world carries).
  // EVERY SOLID'S IMAGE IS LAID ONCE, BY ITS PLACE AND NOT BY THE ORDER OF THE CORNERS. In the joined image's
  // draw every imaged solid stands twice (joinDraws). Its FIRST corners (pre 1) lay NO COLOUR and write this
  // depth alone, ONE STEP deeper (2 to the power -24: one step of a 24 bit depth and of a float's from 0.5 up,
  // added last, so the sum is exact), so that when the second come the nearest skin's depth, and one step,
  // already stands at every pixel. The second are blended only where they are NEARER than what stands (the
  // image's paint tests "nearer", not "as near"): the first of them that stands at the nearest depth is, by
  // that one step, and then stands itself; every other skin (the same solid's far side, a solid within or
  // behind another, a skin the depth cannot tell from the nearest) is no nearer and fails. So one skin and no
  // more is blended at a pixel: the nearest, or where the depth cannot tell two apart (from afar: with the
  // world's near plane at 0.4 m a step of the depth is 6 cm of true depth at 90 m, 0.3 m at 200 m) the first of
  // them among the corners, which joinDraws orders by their place. THE STEP IS TYPED FOR A DEPTH OF 24 BITS OR A
  // FLOAT'S (the engine's targets are 24 bit; three r170 gives no coarser one unless a 16 bit depth texture is
  // asked for): under a 16 bit depth it would be no step, and the image would not be laid at all.
  // WHAT IS LOST IN A TIE: a thin member drawn as wide as it is lays its image in this draw after the solids'
  // and, as they do, only where it is NEARER than what stands, so where it stands less than one step before a
  // solid's image the two tie at some pixels and the member's image is lost there (the crane tower's lacing, 2 cm
  // proud of its plates, where a step is 3.4 cm of true depth at 68 m, the nearest the flown line comes to it,
  // and more beyond); where it is drawn wider than it is, its image is the netting's image's draw's, which
  // tests "as near", and is not lost so
  float pre = step(.5, vPre);
  gl_FragDepth = clamp(dot(uLevel.xy, gl_FragCoord.xy) + uLevel.z - .02 * (1. - gl_FragCoord.z), 0., 1.) + pre / 16777216.;
  if (vW.y < 0.) discard;
  gl_FragColor *= 1. - pre;
#endif
}`;
function rigMaterial(look, SU) {
  const P = PAINTS[look], LL = LAMP_LIGHT[look];
  const mat = new THREE.ShaderMaterial({ vertexShader: RIG_VERT, fragmentShader: RIG_FRAG, fog: true, side: THREE.DoubleSide,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLamp: SU.uLamp, uBoat: SU.uBoat, uPix: { value: 2 / 720 },
      uLampCol: { value: new THREE.Color().setRGB(LL.color[0], LL.color[1], LL.color[2]) }, uFillCol: { value: new THREE.Color(P.fill) },
      uAmber: { value: new THREE.Color('#ff9a1e') }, uWorkCol: { value: new THREE.Color('#ffe2b0') }, uKey: { value: LL.key }, uFill: { value: LL.fill },
      uBeaconP: { value: [0, 1, 2].map(() => new THREE.Vector3(0, -1e4, 0)) }, uBeam: { value: [0, 1, 2].map(() => new THREE.Vector4(1, 0, 0, 0)) },
      uWork: { value: [0, 1, 2, 3].map(() => new THREE.Vector4(0, -1e4, 0, 0)) }, uClock: { value: 0 }, uMove: { value: Array.from({ length: NMOVE }, () => new THREE.Matrix4()) }, uLevel: { value: new THREE.Vector3(0, 0, 1) },
      uMoonAt: { value: new THREE.Vector3(0, -1e4, 0) }, uMoonSun: { value: new THREE.Vector3(0, 1, 0) }, uMoonDark: { value: new THREE.Color('#4f6190') } } });
  // THE PAINT'S BLENDED TWIN, for the thin members where they are drawn wider than they are (THIN: the same
  // shaders and uniforms; its alpha is the member's true cover): blended over what stands behind, writing no
  // depth, its outer faces alone (a round member's outer faces cover its outline once, so its cover is laid once;
  // a strip has the one face, turned to the eye)
  mat.userData.thin = new THREE.ShaderMaterial({ vertexShader: RIG_VERT, fragmentShader: RIG_FRAG, fog: true, side: THREE.FrontSide, uniforms: mat.uniforms,
    defines: { THIN: 1 }, transparent: true, depthWrite: false });
  return mat;
}
// the same paint for an image in the sea (MIRROR; the same uniforms), as the hero's sea says a part lays one:
// drawn after the sea's sheet, over it, and before the hero's thin layers (render orders 1.5 to 1.99), transparent
// with premultiplied alpha, writing depth. THIS PART'S THREE IMAGE DRAWS HAVE EACH AN ORDER OF ITS OWN: the
// unpainted stretch's image 1.5, the rigs' joined image 1.56 (apart from the town's image at 1.55: three lays
// draws that share an order farthest middle first, which changes with the eye's place), the netting's image
// 1.6, which carries the thin members' images where they are drawn wider than they are, blended, writing no
// depth (RIG_FRAG, joinDraws). ONE PASS: three r170 draws a see-through two-sided paint
// twice (its back faces, then its front) unless forceSinglePass is set, and sets it of itself on every
// ShaderMaterial; every see-through paint of this part is a ShaderMaterial, so each was and is drawn once (it is
// written out on each so that it stays so). An image writes its depth; the joined image lays every solid's
// depth before any solid's colour, in its one draw, and blends only what is NEARER than what stands (depthFunc:
// "less"), so that each is blended once, its nearest skin (RIG_FRAG, joinDraws); a veil, a skin on the wall and
// light in the air are single sheets or sums
const imageMaterial = (mat) => new THREE.ShaderMaterial({ vertexShader: RIG_VERT, fragmentShader: RIG_FRAG, fog: true, side: THREE.DoubleSide, uniforms: mat.uniforms,
  defines: { MIRROR: 1 }, transparent: true, premultipliedAlpha: true, depthWrite: true, depthFunc: THREE.LessDepth, forceSinglePass: true });
// the same paint for SAFETY NETTING (NET: a veil with premultiplied alpha, drawn after the solids) and for its
// image, which writes no depth and tests "as near or nearer": the draw that also lays the joined bodies' thin
// members' images where they are drawn wider than they are (their strips stand after the veils in its geometry:
// joinDraws; RIG_FRAG tells a strip from a veil and gives it its own cover)
const netMaterial = (mat, mirror) => new THREE.ShaderMaterial({ vertexShader: RIG_VERT, fragmentShader: RIG_FRAG, fog: true, side: THREE.DoubleSide, uniforms: mat.uniforms,
  defines: mirror ? { NET: 1, MIRROR: 1 } : { NET: 1 }, transparent: true, premultipliedAlpha: true, depthWrite: false, forceSinglePass: true });
// a mesh of the builder's geometry. Where it has thin members and the paint has a blended twin, the paint draws
// the whole of it (and leaves out what is drawn wider than it is) and the twin draws the thin members' group
// after it (renderOrder 2: over the sea's images, under the nets and the lamps' air); an image's or a net's
// paint draws it whole and thins the thin members itself. (As built, every such mesh is then joined into the
// part's three draws and kept as a skin: joinDraws)
const mesh = (geo, mat, name) => { const g = geo.isBufferGeometry ? geo : geo.geometry(), twin = mat.userData && mat.userData.thin, both = !!twin && g.groups.length > 1;
  const m = new THREE.Mesh(g, both ? [mat, twin] : mat); if (both) m.renderOrder = 2; m.frustumCulled = false; m.name = name; return m; };
// ---- A PAINTERS' CRADLE, in the frame of its hanging point on the rail: x along the wall (anticlockwise), y up, z out
// toward the painted face. A working platform C.len m long: an aluminium deck on bearers, toe boards, two
// rails on the bay's side, a low rail on the wall's, a stirrup frame with its hoist at either end, each on a pair of
// wire ropes (0.05 m thick) from the rail's trolley; on it paint drums in two colours (sky blue, white), rollers on long
// poles, a dust sheet over the bay's rail, a folded tarpaulin, a tray, a bucket, and a work lamp (emissive) on the
// end frame. o: { H (m from the rail down to its deck), dz (m its deck stands outward of the plumb line), paint,
// rope (the wire ropes' paint: the sky's own blue), detail, rng }. Nobody on it.
function cradleParts(g, o) {
  const C = RIGS.cradle, hl = C.len / 2, hw = C.wide / 2, y0 = -o.H, z0 = o.dz, rng = o.rng, lite = o.detail < 1;
  // (the platform is turned C.turn degrees about the plumb line through its deck's middle: its far end out toward the line)
  const cs = Math.cos(C.turn * RAD), sn = -Math.sin(C.turn * RAD), X = V(cs, 0, -sn), Z = V(sn, 0, cs);
  const at = (x, y, z) => V(x * cs + z * sn, y0 + y, z0 - x * sn + z * cs), ALU = '#b4bac1', STEEL = '#4d535b', WHITE = '#f1eee4';
  // the deck: three aluminium planks on two long bearers and cross bearers (the underside is what a boat sees)
  for (let i = 0; i < 3; i++) { g.color(ALU, 0.86 + 0.2 * rng()); g.box(at(0, 0, (i - 1) * C.wide / 3), X, UP, Z, hl, 0.03, C.wide / 6 - 0.01); }
  g.color(STEEL); for (const z of [-hw + 0.08, hw - 0.08]) g.box(at(0, -0.12, z), X, UP, Z, hl + 0.06, 0.09, 0.05);
  const nb = lite ? 5 : 7; for (let i = 0; i < nb; i++) g.box(at(-hl + (C.len * i) / (nb - 1), -0.1, 0), X, UP, Z, 0.05, 0.06, hw);
  // the toe boards round the deck (the bay's spattered with both paints)
  g.color(ALU, 0.8); g.box(at(0, 0.1, -hw), X, UP, Z, hl, 0.1, 0.015); g.color(ALU, 0.7); g.box(at(0, 0.1, hw), X, UP, Z, hl, 0.1, 0.015);
  for (const x of [-hl, hl]) g.box(at(x, 0.1, 0), X, UP, Z, 0.015, 0.1, hw);
  for (let i = 0; i < 4; i++) { g.color(i % 2 ? WHITE : o.paint, 1.05); g.box(at(-hl + 1 + rng() * (C.len - 2), 0.07 + 0.06 * rng(), -hw - 0.018), X, UP, Z, 0.12 + 0.3 * rng(), 0.03 + 0.04 * rng(), 0.003); }
  // the guard rails: posts, a top and a middle rail on the bay's side and the ends, one rail on the wall's side
  g.color('#c3c8ce');
  const posts = lite ? 5 : 7;
  for (let i = 0; i < posts; i++) { const x = -hl + (C.len * i) / (posts - 1); g.tube(at(x, 0, -hw), at(x, 1.15, -hw), 0.03, 4, true); g.tube(at(x, 0, hw), at(x, 0.8, hw), 0.03, 4, true); }
  for (const y of [0.62, 1.15]) { g.tube(at(-hl, y, -hw), at(hl, y, -hw), 0.032, 4, true); for (const x of [-hl, hl]) g.tube(at(x, y, -hw), at(x, y > 1 ? 0.8 : y, hw), 0.03, 4, true); }
  g.tube(at(-hl, 0.8, hw), at(hl, 0.8, hw), 0.03, 4, true);
  // the two end frames (stirrups) with their hoists; from each a pair of wire ropes up to the rail's trolley;
  // a bumper wheel toward the wall
  for (const sd of [-1, 1]) { const x = sd * (hl - 0.45);
    g.color('#c2562c'); g.tube(at(x, 0, -hw), at(x, 2.3, -hw * 0.45), 0.05, 5, true); g.tube(at(x, 0, hw), at(x, 2.3, hw * 0.45), 0.05, 5, true); g.tube(at(x, 2.3, -hw * 0.45), at(x, 2.3, hw * 0.45), 0.05, 5, true);
    g.color('#3a3f46'); g.box(at(x, 1.85, 0), X, UP, Z, 0.14, 0.24, 0.2);
    g.color('#ffd28a').lamp(3.4, 0); g.ball(at(x - sd * 0.42, 2.02, 0), 0.19, 8, 4); g.color('#ffc878').lamp(0.7, 0);      // a lantern that glows, and its pool of light on the deck
    g.quad(at(x, 0.045, -hw + 0.06), at(x - sd * 1.9, 0.045, -hw + 0.06), at(x - sd * 1.9, 0.045, hw - 0.06), at(x, 0.045, hw - 0.06)); g.lamp(0, 0);
    g.color(o.rope); for (const k of [-0.1, 0.1]) g.tube(V((x + k) * cs, 0, 0), at(x + k, 2.3, 0), C.rope, 4, true);
    g.color('#3b3f46'); g.box(V(x * cs, 0.05, 0), V(1, 0, 0), UP, V(0, 0, 1), 0.3, 0.16, 0.14);
    g.color(STEEL); g.tube(at(x, 0.02, hw), at(x, 0.02, hw + 0.25), 0.035, 4, true);
    g.color('#22252a'); g.tube(at(x - 0.14, 0.02, hw + 0.25), at(x + 0.14, 0.02, hw + 0.25), 0.14, 6, false, 0.14, true); }
  // paint drums in two colours (sky blue, white), one open with the paint showing; a run down each one's side
  const drums = lite ? 3 : 5;
  for (let i = 0; i < drums; i++) { const x = -3.5 + i * 0.72 + 0.08 * rng(), z = -0.24 + 0.1 * (rng() - 0.5), open = i === 1, white = i % 2 === 1;
    g.color(white ? WHITE : o.paint, 0.9 + 0.15 * rng()); g.tube(at(x, 0.04, z), at(x, 0.92, z), 0.3, 9);
    g.color(open ? (white ? '#fbf9f2' : o.paint) : '#c9c4b6', open ? 1.1 : 1); g.tube(at(x, open ? 0.8 : 0.92, z), at(x, open ? 0.81 : 0.94, z), 0.29, 9, false, 0.29, true);
    g.color(white ? o.paint : WHITE, 1.05); g.box(at(x + 0.1, 0.66, z - 0.3), X, UP, Z, 0.05, 0.24, 0.006); }
  // a dust sheet over the bay's rail: hung outside to a wavy hem, tucked inside
  const ns = 6, sx = -0.2, sl = 3.2;
  for (let i = 0; i < ns; i++) { const xa = sx + sl * i / ns, xb = sx + sl * (i + 1) / ns, ha = 0.2 + 0.16 * Math.sin(i * 1.9 + 0.5), hb = 0.2 + 0.16 * Math.sin((i + 1) * 1.9 + 0.5), bz = -hw - 0.07 - 0.05 * (i % 2);
    g.color('#e2dccb', 0.9 + 0.12 * rng());
    g.quad(at(xa, 1.2, -hw - 0.04), at(xb, 1.2, -hw - 0.04), at(xb, hb, bz), at(xa, ha, bz));
    g.quad(at(xa, 1.2, -hw - 0.04), at(xb, 1.2, -hw - 0.04), at(xb, 1.2, -hw + 0.05), at(xa, 1.2, -hw + 0.05));
    g.quad(at(xa, 1.2, -hw + 0.05), at(xb, 1.2, -hw + 0.05), at(xb, 0.7, -hw + 0.09), at(xa, 0.7, -hw + 0.09)); }
  // a folded tarpaulin and a paint tray on the deck
  for (let i = 0; i < 3; i++) { g.color('#8a8f6a', 0.8 + 0.25 * rng()); g.box(at(1.5 + 0.03 * i, 0.1 + i * 0.08, 0.12), X, UP, Z, 0.6 - 0.04 * i, 0.04, 0.36 - 0.03 * i); }
  g.color('#70757c'); g.box(at(0.2, 0.07, 0.1), X, UP, Z, 0.24, 0.035, 0.18); g.color(o.paint); g.box(at(0.2, 0.11, 0.1), X, UP, Z, 0.21, 0.004, 0.15);
  // rollers on long poles, stood on the deck and leant out over the bay's rail, leaning apart and crossing (never
  // side by side: nothing here is ladder-like)
  const poles = lite ? 2 : 3;
  for (let i = 0; i < poles; i++) { const x = 2.6 + i * 0.9, top = at(x + (i === 1 ? 1.5 : -1.3) * (0.7 + 0.3 * rng()), 3.3 + 0.7 * rng(), -hw - 0.3 - 0.2 * rng()), foot = at(x, 0.05, hw * 0.4);
    g.color('#c8b890'); g.tube(foot, top, 0.024, 4, true);
    g.color('#8d9299'); g.tube(top, top.clone().add(V(0, 0.2, 0)), 0.014, 4, true);
    g.color(i === 1 ? '#f4f1e8' : o.paint, 1.1); g.tube(top.clone().add(V(-0.24, 0.26, 0)), top.clone().add(V(0.24, 0.26, 0)), 0.075, 7, false, 0.075, true); }
  // a bucket on a short rope from the bay's rail
  const bx = -4.3, bz = -hw - 0.09, by = 0.12;
  g.color('#8d97a3'); g.tube(at(bx, 1.15, -hw), at(bx, by + 0.3, bz), 0.011, 4, true);
  g.color('#8a9097'); g.tube(at(bx, by, bz), at(bx, by + 0.3, bz), 0.13, 8, false, 0.165); g.color(o.paint, 0.9); g.tube(at(bx, by + 0.27, bz), at(bx, by + 0.28, bz), 0.15, 8, false, 0.15, true);
  // a work lamp on the end frame: a hooded box, its faces alight (emissive: there is no light here)
  const lx = hl - 0.45;
  g.color(STEEL); g.tube(at(lx, 2.3, 0), at(lx, 2.75, 0), 0.03, 4, true); g.box(at(lx, 2.86, 0), X, UP, Z, 0.2, 0.12, 0.13);
  g.color('#ffe6b4').lamp(2.6, 0); g.box(at(lx - 0.205, 2.86, 0), X, UP, Z, 0.006, 0.1, 0.11); g.box(at(lx, 2.735, 0), X, UP, Z, 0.17, 0.006, 0.1); g.lamp(0, 0);
  // what throws its shadow on the wall (in this frame): its bay side from under the deck to the top rail, its two pairs of ropes
  return { quad: [at(-hl, -0.2, -hw), at(hl, -0.2, -hw), at(hl, 1.15, -hw), at(-hl, 1.15, -hw)], ropes: [-1, 1].map((sd) => [V(sd * (hl - 0.45) * cs, 0, 0), at(sd * (hl - 0.45), 2.3, 0)]) };
}
// the signed difference of two bearings (degrees, -180 to 180)
const turnTo = (a, b) => ((b - a + 540) % 360) - 180;
// the frame of a place on the wall: t along it (clockwise), r outward
const frameAt = (bearing) => ({ t: dirOf(bearing + 90), r: dirOf(bearing) });
const basisQ = (ex, ey, ez) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(ex, ey, ez));

const _X = V(1, 0, 0), _Z = V(0, 0, 1);
// ---- THE CRADLES along the wall: five. Two hang right before the unpainted stretch (one over the cloud's
// painted half, one over its chalked half); three are dealt by the seed: two HIGH ones (12 to 25 m up the wall)
// in the two stretches the stages leave free OVER THE SHADOW'S WALL (between the first stage and the second,
// between the second and the unpainted stretch: far over the band our sail's shade sweeps), and THE LOW ONE,
// which hangs LOW AND FREE (plumb under the rail) before the unpainted stretch's near part, BEYOND THE SHADOW'S
// WALL (RIGS.patch.low). Each is turned a little about its ropes, its far end out toward the line, so that its
// long side, its drums, rails and poles show to who comes along the wall. The low one has its image in the sea.
// It also deals the large stages' places (stages). o: { ctx, detail, mat, image, bD (the wall leg's first
// bearing), bS (the last bearing of the shadow's wall), paint, blue }. ASYNC: it yields after each cradle.
async function makeCradles(o) {
  const ctx = o.ctx, C = RIGS.cradle, RL = RIGS.rail, PA = RIGS.patch, detail = o.detail;
  const rng = ctx.core.makeRng(ctx.core.hashSeed('sky-cradles:' + ctx.seed));
  // every die first, and NO DIE THAT NOTHING READS: the three dealt places' jitters (the two high ones', the low
  // one's); then the five cradles' two sway phases each (ten); the heights' order (two); the two high ones' own
  // heights' jitters (two)
  const jit = [], ph = [], hts = C.heights.slice();
  for (let i = 0; i < 3; i++) jit.push(rng() - 0.5);
  for (let i = 0; i < 3 + PA.cradles.length; i++) ph.push([rng() * 6.283, rng() * 6.283]);
  for (let i = hts.length - 1; i > 0; i--) { const k = Math.floor(rng() * (i + 1)), w = hts[i]; hts[i] = hts[k]; hts[k] = w; }
  const hj = [(rng() - 0.5) * 3, (rng() - 0.5) * 3];
  const deg = (m, arc) => (m / (SHELL.R * Math.cos(arc / SHELL.R))) / RAD, half = deg(PA.wide / 2, 0);
  // THE UNPAINTED STRETCH LIES BEYOND THE SHADOW'S WALL: its near side PA.clear m of wall past the last bearing
  // our sail's shade sweeps (o.bS); bF is its middle
  const near = o.bS + deg(PA.clear, 0), bF = near + half;
  // THE LARGE STAGES' PLACES (fixed), in the wall's order: one at the leg's start, one RIGS.stage.mid of the way
  // from it to the unpainted stretch (both hung over the shadow's wall), one at the unpainted stretch under the
  // half-made cloud; and the two stretches of wall they leave free for the high dealt cradles
  const SG = RIGS.stage.list, sa = deg(SG[0].len / 2, 0), sm = deg(SG[1].len / 2, 0);
  const s1 = o.bD + 1.3 + sa, a0 = s1 + sa + 0.5, c1 = near - 1.3, cm = a0 + (c1 - a0) * RIGS.stage.mid, a1 = cm - sm - 0.4, c0 = cm + sm + 0.4;
  const stages = [{ bearing: s1, ...SG[0] }, { bearing: cm, ...SG[1] }, { bearing: bF + deg(RIGS.stage.at, 0), ...SG[2], spray: true }];
  const places = [[a0, a1], [c0, c1]].map(([b0, b1], k) => ({ b: (b0 + b1) / 2 + jit[k] * Math.max(0, b1 - b0 - 1.6), arc: hts[k] + hj[k] }));
  places.push({ b: bF + deg((PA.low[0] + PA.low[1]) / 2 + jit[2] * (PA.low[1] - PA.low[0]), 0), low: true, arc: C.lowY });      // THE LOW ONE, before the stretch's near part
  for (const [x, arc] of PA.cradles) places.push({ b: bF + deg(x, arc), arc, field: true });
  places.sort((p, q) => (turnTo(p.b, q.b) < 0 ? 1 : -1));
  const group = new THREE.Group(); group.name = 'painters-cradles';
  const movers = [], sites = [], shades = [], pivot = V(), deck = V();
  let tris = 0;
  for (let i = 0; i < places.length; i++) {
    const pl = places[i], F = frameAt(pl.b); wallPoint(pl.b, RL.arc, RL.inset + 0.55, pivot);
    let H = pivot.y - C.lowY, dz = 0;
    if (!pl.low) { wallPoint(pl.b, pl.arc, C.off + (C.len / 2) * Math.sin(C.turn * RAD), deck); H = pivot.y - deck.y; dz = Math.hypot(deck.x, deck.z) - Math.hypot(pivot.x, pivot.z); }
    const g = new Geo(), prng = ctx.core.makeRng(ctx.core.hashSeed('sky-cradle-' + i + ':' + ctx.seed));
    const cast = cradleParts(g, { H, dz, paint: o.paint, rope: o.blue, detail, rng: prng });
    const G = new THREE.Group(), m = mesh(g, o.mat, 'cradle-' + i), base = basisQ(F.t.clone().negate(), UP, F.r); G.position.copy(pivot); G.quaternion.copy(base); G.add(m); group.add(G);
    tris += g.triangles; G.updateMatrixWorld(true);
    shades.push({ quad: cast.quad.map((q) => m.localToWorld(q)), ropes: cast.ropes.map((r) => r.map((q) => m.localToWorld(q))), soft: pl.low ? 1.1 : 0.3, dark: pl.low ? 0.24 : 0.42 });
    if (pl.low) { const im = mesh(m.geometry, o.image, 'image:cradle-' + i); im.renderOrder = 1.5; G.add(im); tris += g.triangles; }
    const L = Math.hypot(H, dz), A1 = (pl.low ? C.lowSway : C.sway) / L, A2 = (pl.low ? C.lowSway * 0.6 : C.swayIn) / L, T = 2.0 * Math.sqrt(L), q1 = new THREE.Quaternion(), q2 = new THREE.Quaternion();
    const set = (a, c) => { q1.setFromAxisAngle(_Z, a * A1); q2.setFromAxisAngle(_X, c * A2); G.quaternion.copy(base).multiply(q1).multiply(q2); G.updateMatrixWorld(true); };
    movers.push({ name: 'cradle ' + i + (pl.low ? ' (the low one)' : pl.field ? ' (before the unpainted stretch)' : ''), meshes: [m], dims: 2, set, low: !!pl.low,
      at: (time) => set(Math.sin(time * 2 * Math.PI / T + ph[i][0]), Math.sin(time * 2 * Math.PI / (T * 0.83) + ph[i][1])) });
    sites.push({ bearing: pl.b, arc: pl.arc, low: !!pl.low, field: !!pl.field, H });
    await ctx.yield();
  }
  // the rail far above, on stand-offs from the wall, along the whole leg and on past its end, 8 m beyond the last
  // cradle before the unpainted stretch (painted the sky's own blue: a thing meant not to be seen from the town)
  const R = new Geo(), r0 = o.bD + 0.4, span = bF + deg(Math.max(...PA.cradles.map((q) => q[0])) + C.len / 2 + 8, 0) - r0, n = Math.ceil(span / 0.75), ra = (k) => wallPoint(r0 + span * k / n, RL.arc, RL.inset + 0.55);
  for (let k = 0; k < n; k++) { R.color(o.blue, 0.92); R.tube(ra(k), ra(k + 1), 0.11, 5, true);
    if (k % 3 === 0) { const bb = r0 + span * k / n; R.color(o.blue, 0.8); R.tube(ra(k), wallPoint(bb, RL.arc + 0.4, 0.05), 0.07, 4, true); R.tube(ra(k), wallPoint(bb, RL.arc - 1.6, 0.05), 0.05, 4, true); } }
  const rail = mesh(R, o.mat, 'cradles-rail'); group.add(rail); tris += R.triangles;
  return { group, movers, statics: [rail], sites, shades, stages, field: { bearing: bF }, triangles: tris };
}
// (the field's skin carries each place's metres along the wall and up it: aUV)
const SKIN_VERT = /* glsl */`
attribute vec2 aUV; varying vec2 vUV; varying vec3 vW;
#include <fog_pars_vertex>
void main(){
  vUV = aUV; vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz;
#ifdef MIRROR
  wp.y = -wp.y;                                       // (its image in the sea: the same skin under the still water)
#endif
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// ---- THE UNPAINTED STRETCH AND THE HALF-MADE CLOUD: one thin OPAQUE skin just off the wall, painted by a place's
// metres along the wall (x, from the stretch's middle, the way the line flies) and up it (y, the wall's arc).
// BARE PRIMED STEEL from the wall's foot at the water up (an earth red primer; the plates' seams and their rivet
// rows show), IN THREE TONES OF PRIMER, PLATE BY PLATE. No tape, no band, no paint of its own at the edges, and
// never a plain rectangle: ITS EDGE STEPS PLATE BY PLATE. The sky's own painting, the wall as it stands beside
// it, has been carried in over the primer one plate at a time from the sides and the top (bareAt: there the
// skin is CLEAR), lapping over the seams by a brush's wobble, with drips run down from the lowest painted
// plate. On the primer the cloud to be at giant size, plainly one cloud: its near half PAINTED IN as whole
// rounded heaps (white tops, a warm shade under them and toward the flat base, which is brushed out soft; white
// runs under it); the rest of the same cloud BLOCKED IN WITH CHALK (its outline, a pale hatched scumble inside
// it; a faint grid of squares too; no chalk on paint); beside it five test swatches (three blues, two whites).
// EVERY LINE, DOT AND DRAWN EDGE IS FILTERED BY THE PIXEL'S FOOTPRINT (the law stands at ln, dotc, row and cov
// in the paint): a line or a dot narrower than the footprint is drawn one footprint wide AT THE COVER IT TRULY
// HAS (a line's width over the width drawn; a dot's area over its sum as drawn); the rows of lines (the seams,
// the rivet rows, the grid, the hatch) are counted over the footprint and far off ARE THEIR OWN MEANS (each
// worked beside its mark); the outline, the drips and the runs are single lines and carry their true cover at
// every footprint; the drips' and runs' ends, the scumble's edge (its flat base too), the drawn-through arcs'
// start, the swatches' and the painted heaps' edges are edges by their cover over the footprint (cov). No ramp
// lets a mark go to nothing or to bare primer. WHAT MEETS IN A PLAIN STEP, said truly: THE PLATES THEMSELVES,
// along their seams. Each plate's tone of primer is its own up to its seam (the seam's darker line, 0.06 m
// wide, lies on that step; a footprint wider than a plate takes the three tones' mean), and a plate is bare or
// painted whole (bareAt): where the sky's paint laps onto a bare plate by less than its edge's softness (0.35
// m, or the footprint if that is more) the lap's ramp ends at the seam in a step, 0.3 of the skin's cover at
// the most near to and up to a half of it under a wide footprint. No other edge of the paint is a step.
// It is a stretch of wall not yet painted, never a pane in the air.
// the cloud to be, as its painter chalked it: heaps on a flat base ([x in half widths, y and radius in heights])
const HEAPS = [[-0.62, 0.2, 0.3], [-0.25, 0.34, 0.42], [0.18, 0.42, 0.5], [0.58, 0.26, 0.36], [-0.02, 0.68, 0.34], [0.36, 0.7, 0.26], [0.86, 0.12, 0.19], [-0.88, 0.1, 0.17]];
const fl = (v) => { const s = String(Math.round(v * 1e4) / 1e4); return /[.e]/.test(s) ? s : s + '.'; };
const heapLine = ([x, y, r]) => `  { vec2 e = q - vec2(${fl(x)} * uCloud.z, ${fl(y)} * uCloud.w); float l = length(e), f = ${fl(r)} * uCloud.w - l; if (f > d) { d2 = d; d = f; n = e; } else d2 = max(d2, f); }`;
const PRIMER = '#80604f';                              // the bare steel's primer: a soft earth red
const FIELD_FRAG = /* glsl */`
uniform vec3 uFresh, uHaze, uCloudLit, uCloudShade, uLamp, uLampCol, uFillCol, uGrid, uPrimer; uniform float uKey, uFill, uBlush, uLs, uClock; uniform vec4 uBox, uCloud;
varying vec2 vUV; varying vec3 vW;
#ifdef MIRROR
uniform vec3 uLevel;
#endif
#include <fog_pars_fragment>
const float SQ = ${fl(RIGS.patch.square)};
// (h11 AND h21 ARE THE KIT'S OWN hash11 AND hash12, of src/kit/fx.js, carried here as the kit has them: they
// follow "Hash without Sine", David Hoskins, 2014, MIT, whose notice the kit's head names and the site ships:
// covered by section 181 a, nothing brought in anew. vn is the common value noise)
float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
// THE LAW OF FILTERING HERE (fw: the pixel's footprint on the wall, metres: the diagonal of its box). A LINE OR A
// DOT DRAWN WIDER THAN IT IS CARRIES THE COVER IT TRULY HAS, WHOLE (as the kit's wire does: no floor, no share).
// ln: a line of half width w at distance d, never drawn under one footprint wide (half width fw / 2), at the
// strength w over the half width drawn (the ramp's sum across the line is twice the half width drawn, so the
// line's sum is 2 w, its own width, at every footprint). dotc: a round dot of radius r, the same BY AREA: it is
// drawn to the radius rr (r, or half a footprint if that is more) with the same ramp one footprint wide, whose
// sum over the wall is pi (rr rr + fw fw / 12) (a disc and its sloping rim; a cone when rr is half a
// footprint), so it is weighed by r r over (rr rr + fw fw / 12): THE DOT'S SUM IS pi r r, ITS OWN AREA, AT
// EVERY FOOTPRINT (summed in node: 1.000 of it from a footprint of a hundredth of the radius to thirty radii).
// So a hairline far off is a faint line and comes up as the eye nears it.
float ln(float d, float w, float fw){ float ww = max(w, .5 * fw); return clamp((ww - d) / fw + .5, 0., 1.) * (w / ww); }
float dotc(float d, float r, float fw){ float rr = max(r, .5 * fw); return clamp((rr - d) / fw + .5, 0., 1.) * (r * r) / (rr * rr + fw * fw / 12.); }
// LINES IN A ROW (plate seams, rivet rows, a chalk grid, a hatch: half width w, one every P metres, at t = 0, P,
// 2 P ...): their cover over a footprint f metres wide about t, COUNTED EXACTLY (a box filter, as the nets'). A
// line narrower than the footprint carries its true cover, 2 w over f; a footprint wider than the pitch holds
// THE ROW'S OWN MEAN, 2 w over P. A row is never let go to nothing and never to bare primer.
float row(float t, float P, float w, float f){ float k = 2. * w / P, a = (t - .5 * f + w) / P, b = (t + .5 * f + w) / P;
  return ((floor(b) * k + min(fract(b), k)) - (floor(a) * k + min(fract(a), k))) * P / f; }
// an edge's cover: d metres inside it
float cov(float d, float fw){ return clamp(d / fw + .5, 0., 1.); }
// the cloud to be: q in metres from the middle of its flat base. x: metres inside its outline (negative outside);
// yz: the place from the middle of the heap that makes the outline there; w: metres inside the next heap (the drawn-through arcs)
vec4 cloudIn(vec2 q){
  float d = -1e3, d2 = -1e3; vec2 n = vec2(0., 1.);
${HEAPS.map(heapLine).join('\n')}
  return vec4(min(d, q.y), n, min(d2, q.y)); }
// THE HEAPS ALREADY PAINTED IN (whole rounded heaps: the cloud's near half). x: metres inside their tops' outline;
// yz: the place from that heap's middle; w: metres inside the next painted heap
vec4 paintIn(vec2 q){
  float d = -1e3, d2 = -1e3; vec2 n = vec2(0., 1.);
${HEAPS.filter((h) => h[0] < 0.1).map(heapLine).join('\n')}
  return vec4(d, n, d2); }
// IS THE WALL'S PLATE AT p (metres along the wall from the stretch's middle, metres up it) STILL BARE PRIMER? The
// plates (5.4 by 2.7 m, staggered) are painted over one by one from the stretch's sides and top inward: a plate
// whose middle stands less than 2.2 to 8.7 m (by its own die) inside the stretch's box is painted already; the
// plates under the cloud to be (its chalked squares' width, from 1 m under its base to 2 m over its top) are all bare
float bareAt(vec2 p){ float r = floor(p.y / 2.7), o = .5 * step(1., mod(r, 2.)), c = floor(p.x / 5.4 + o);
  vec2 m = vec2((c + .5 - o) * 5.4, (r + .5) * 2.7); float d = min(min(m.x - uBox.x, uBox.y - m.x), uBox.w - m.y);
  float under = step(abs(m.x - uCloud.x), uGrid.x + 1.) * step(uCloud.y - uGrid.y - 1., m.y) * step(m.y, uCloud.y + uCloud.w + 2.);
  return max(step(2.2 + 6.5 * h21(vec2(c, r) + 17.3), d), under); }
void main(){
  float x = vUV.x, y = vUV.y, fw = max(length(fwidth(vUV)), 1e-3);
  vec2 f2 = max(1.5 * fwidth(vUV), vec2(1e-3));        // the rows' footprint: a pixel and a half along the wall, and up it
  // near, mid: ramps on variations that are as often light as dark (their mean is nothing: they obey the law as
  // they stand). fine: the rivet heads are told apart while the pixel is under a fifth of their pitch (0.3 m)
  // and are their row's mean once it is two fifths of it
  float near = 1. - smoothstep(.5, 1.6, fw), mid = 1. - smoothstep(.15, .6, fw), fine = 1. - smoothstep(.06, .12, fw);
  // THE STRETCH'S EDGE STEPS PLATE BY PLATE (ragged: never a plain rectangle, no tape, no band): the sky's own
  // painting (the wall as it stands beside it: this skin is clear there) has been carried in over the primer one
  // plate at a time (bareAt), so the bare steel's outline follows the plates' seams, in and out by whole plates;
  // where a bare plate meets a painted one the paint laps over the seam by a brush's wobble (0.1 to 0.7 m)
  vec2 pq = vec2(x / 5.4 + .5 * step(1., mod(floor(y / 2.7), 2.)), y / 2.7), pf = fract(pq), pd = min(pf, 1. - pf) * vec2(5.4, 2.7);
  float soft = max(fw, .35), wob = .1 + .6 * vn(vec2(x / 1.9 + 7., y / 1.3));
  float box = bareAt(vec2(x, y)) * mix(smoothstep(-soft, soft, pf.x * 5.4 - wob), 1., bareAt(vec2(x - 5.4, y))) * mix(smoothstep(-soft, soft, (1. - pf.x) * 5.4 - wob), 1., bareAt(vec2(x + 5.4, y)))
    * mix(smoothstep(-soft, soft, pf.y * 2.7 - wob), 1., bareAt(vec2(x, y - 2.7))) * mix(smoothstep(-soft, soft, (1. - pf.y) * 2.7 - wob), 1., bareAt(vec2(x, y + 2.7)));
  // drips of the sky's paint run down over the primer from the lowest painted plate's seam (each to a bead)
  float drip = 0.;
  for (int i = 0; i < 5; i++){ float fi = float(i), xr = mix(uBox.x + 9., uBox.y - 9., (fi + h11(fi * 3.7 + 1.3)) / 5.), len = 1.5 + 3.5 * h11(fi * 5.1 + 2.);
    float yd = floor(uBox.w / 2.7) * 2.7, go = 1.; for (int r = 0; r < 3; r++){ go *= 1. - bareAt(vec2(xr, yd - 1.35)); yd -= 2.7 * go; }
    float t = (yd - y) / len, dxr = abs(x - xr - .06 * sin(y * 2.1 + fi * 4.));
    // (its two ends are edges like any other: each by its cover over the footprint, metres inside the end)
    drip = max(drip, max(ln(dxr, mix(.09, .045, clamp(t, 0., 1.)), fw) * cov((t + .05) * len, fw) * cov((1. - t) * len, fw), dotc(length(vec2(dxr, (y - yd + len) * .7)), .1, fw))); }
  box *= 1. - drip;
  // BARE PRIMED STEEL from the wall's foot up: PRIMER IN THREE TONES, PLATE BY PLATE (an earth red, a grey, a
  // paler pink earth, by each plate's own die; a pixel wider than a plate takes their mean) on the wall's own
  // plates (5.4 by 2.7 m, staggered). THEIR SEAMS a shade darker (0.06 m wide: rows of lines 2.7 m apart up the
  // wall and 5.4 m apart along it, counted over the footprint): THEIR MEAN far off is 0.06 / 2.7 + 0.06 / 5.4 =
  // 0.033 of a seam's shade. RIVET HEADS (radius 0.035 m, one every 0.3 m, in a row 0.13 m off each seam on
  // either side): near to, each head is a dot (dotc); once the pixel outgrows their pitch (fine) a row is THE
  // MEAN OF ITS HEADS, a band as wide as a head at the strength pi * 0.035 / (2 * 0.3) = 0.18 (a head's area
  // over the band's, per pitch), and the bands are rows of lines again, so far off the rivets are THEIR MEAN,
  // 0.18 * (2 * 0.07 / 2.7 + 2 * 0.07 / 5.4) = 0.014 of a head's shine
  float xs = x + 2.7 * step(1., mod(floor(y / 2.7), 2.));      // (staggered: an odd row's seams stand half a plate along)
  float seam = 1. - (1. - row(xs, 5.4, .03, f2.x)) * (1. - row(y, 2.7, .03, f2.y));
  float rvx = length(vec2((fract(x / .3) - .5) * .3, pd.y - .13)), rvy = length(vec2(pd.x - .13, (fract(y / .3) - .5) * .3));
  float bands = 1. - (1. - min(row(xs - .13, 5.4, .035, f2.x) + row(xs + .13, 5.4, .035, f2.x), 1.)) * (1. - min(row(y - .13, 2.7, .035, f2.y) + row(y + .13, 2.7, .035, f2.y), 1.));
  float rivet = mix(.18 * bands, max(dotc(rvx, .035, fw), dotc(rvy, .035, fw)), fine);
  float tn = h21(floor(pq) + 5.1); vec3 t1 = mix(uPrimer, vec3(.4, .41, .4), .6), t2 = uPrimer * 1.14 + vec3(.025, .015, 0.);
  vec3 tone = mix(mix(mix(uPrimer, t1, step(.45, tn)), t2, step(.75, tn)), uPrimer * .45 + t1 * .3 + t2 * .25, smoothstep(1.2, 3.5, fw));
  vec3 prim = tone * (1. + (vn(vec2(x / 2.3, y / 3.1)) - .5) * .2 * near);
  prim = mix(prim, prim * .68, seam * .7); prim = mix(prim, prim * 1.3 + .02, rivet * (1. - seam));
  vec3 col = prim; float a = box;
  // THE HALF-MADE CLOUD: its near half PAINTED IN as whole rounded heaps (white tops, a warm shade under them and
  // toward its flat base, which is brushed out soft); the rest of it only chalked in outline on the primer
  vec2 q = vec2(x - uCloud.x, y - uCloud.y); vec4 ci = cloudIn(q), pn = paintIn(q);
  float hl = max(length(pn.yz), 1e-3); vec2 hn = pn.yz / hl;
  float st = vn(vec2(atan(hn.y, hn.x + 1e-4) * 4.5, hl / .45)), lit = .56 + .44 * dot(hn, normalize(vec2(uLs * .8, .62)));
  lit = (lit - .12 * (1. - smoothstep(0., 2.5, pn.x - pn.w)) * smoothstep(1., 4., pn.x)) * (.45 + .55 * smoothstep(-.02, .45, q.y / uCloud.w));
  lit = clamp(lit + (vn(q / 2.3) - .5) * .2 + (st - .5) * .14 * mid, 0., 1.);
  vec3 warm = mix(uCloudShade, vec3(.78, .62, .54), .55), white = vec3(1., .985, .95);
  vec3 painted = mix(warm, white, smoothstep(.2, .78, lit));
  painted = mix(painted, painted * vec3(1.06, .9, .82), uBlush * (1. - lit) * .6);
  float pm = cov(pn.x - .1 + .5 * (vn(q / 1.1) - .5) * near, fw) * smoothstep(0., 1.8, q.y + .6 * (vn(vec2(q.x / 1.7, 2.)) - .5)) * box;
  col = mix(col, painted, pm);
  // THE REST OF THE SAME CLOUD, blocked in with chalk on the primer: a pale scumble inside its outline, hatched
  // aslant (plainly one cloud: part painted, part chalked). THE HATCH: strokes 0.2 m wide, 1.13 m apart (a row
  // of lines, counted over the footprint across them): ITS MEAN far off is 0.2 / 1.13 = 0.18 of a stroke
  float ht = (q.x + q.y) * .70711, wash = cov(ci.x - .15, fw) * (1. - pm) * box;      // (ci.x is metres inside the outline, its flat base too: the one edge, by its cover)
  col = mix(col, vec3(.93, .95, .94), wash * (.2 + .3 * row(ht - .56569, 1.13137, .1, max(1.5 * fwidth(ht), 1e-3))));
  // THE CHALK ON THE PRIMER. THE GRID OF SQUARES (lines 0.08 m wide, one every SQ m both ways, at 0.45 of the
  // chalk): rows of lines counted over the footprint; near to a faint grid, far off ITS OWN MEAN, 0.45 * (0.08 /
  // SQ + 0.08 / SQ) = 0.018 of the chalk with squares of 4 m (never nothing). THE CLOUD'S OUTLINE (0.32 m wide)
  // and its drawn-through arcs (0.09 m wide, half as strong): each is ONE line, not a row: under a pixel wider
  // than itself it carries its true cover (ln), which is its own mean over that pixel at every footprint, so no
  // ramp ends it
  float inG = cov(min(min(q.x + uGrid.x, uGrid.x - q.x), min(q.y + uGrid.y, uGrid.z - q.y)) + .06, fw);
  float grid = (1. - (1. - row(q.x, SQ, .04, f2.x)) * (1. - row(q.y, SQ, .04, f2.y))) * inG * .45;
  // (under the base no place is nearer the outline than the base itself, so the line ends by its own ramp there;
  // the drawn-through arcs show from 0.3 m inside the outline on: that edge by its cover)
  float outl = max(ln(abs(ci.x), .16, fw), .5 * ln(abs(ci.w), .045, fw) * cov(ci.x - .3, fw));
  float ch = max(grid, outl) * (1. - pm) * box * .9;        // chalk lies only on the primer
  col = mix(col, vec3(.93, .95, .94), ch);
  // a few test swatches beside the cloud, brushed on the primer: a column of three blues, a column of two whites
  for (int i = 0; i < 5; i++){ float fi = float(i), wh = mod(fi, 2.); vec2 c = vec2(uCloud.x - uCloud.z - 3.6 + 2.2 * wh, uCloud.y + 9. + 2.1 * floor(fi / 2.));
    vec2 e = abs(vec2(x, y) - c) - vec2(.9, .8) - .14 * (vn(vec2(x, y) / .35 + fi * 7.) - .5) * mid;
    float sw = cov(-max(e.x, e.y), fw) * box;
    col = mix(col, mix(mix(uFresh, uHaze, .25 * fi), mix(white, warm, .5 * step(2.5, fi)), wh), sw); }
  // white runs come down under the painted heaps' base (each to a bead)
  float wruns = 0.;
  for (int i = 0; i < 3; i++){ float fi = float(i), xr = uCloud.x + uCloud.z * (-.75 + .3 * fi + .1 * h11(fi * 2.9 + 7.)), len = 1.2 + 2.6 * h11(fi * 4.3 + 5.);
    float t = (uCloud.y - y) / len, dxr = abs(x - xr - .05 * sin(y * 2.6 + fi * 3.));
    wruns = max(wruns, max(ln(dxr, mix(.07, .04, clamp(t, 0., 1.)), fw) * cov((t + .02) * len, fw) * cov((1. - t) * len, fw), dotc(length(vec2(dxr, (y - uCloud.y + len) * .7)), .09, fw))); }
  col = mix(col, vec3(.92, .925, .9), wruns * box);
  // light as the wall's own: the dome's fill and the lamp-sun's key
  vec3 nrm = -normalize(vW), Lv = uLamp - vW; vec3 Ln = Lv * inversesqrt(max(dot(Lv, Lv), 1.));
  col *= uFillCol * uFill + uLampCol * (uKey * .87 * smoothstep(0., .22, clamp(dot(nrm, Ln), 0., 1.)));
  #ifdef USE_FOG
    float ff = 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth); col = mix(col, fogColor, ff);
  #endif
  gl_FragColor = vec4(col * a, a);
#ifdef MIRROR
  // ITS IMAGE IN THE SEA, by the law the hero's sea gives (as the rigs' own images are laid): as strong as the
  // water mirrors by the ray's slant, its edge broken by the ripples at the water's own place, its depth the depth
  // where the eye's ray meets the level ${LEVEL} m, worked from the pixel's own place as theirs is (uLevel, the
  // rigs' own: levelAim); what stands under the water has no image
  { vec3 E = cameraPosition; float k0 = clamp(E.y / max(E.y + vW.y, 1e-3), 0., 1.); vec2 wxz = E.xz + (vW.xz - E.xz) * k0; float fww = max(length(fwidth(wxz)), 1e-4);
    float cosT = E.y / max(length(vec3(wxz.x - E.x, E.y, wxz.y - E.z)), 1e-3), gz = 1. - clamp(cosT, 0., 1.);
    float rp = vn(wxz * .55 + uClock * vec2(.1, .16)) * .55 + vn(wxz * 1.9 - uClock * vec2(.27, .12)) * .45;
    float al = (.74 + .24 * gz * gz) * mix(1., mix(smoothstep(.36, .64, rp), .5, smoothstep(.5, 2., fww)), .24);
    gl_FragColor = vec4(gl_FragColor.rgb * (.88 * al), gl_FragColor.a * al);
    // (TWO STEPS OF THE DEPTH DEEPER THAN ITS OWN: this image is laid before the rigs', and what hangs before the
    // wall, however near it and however far off, then has its image's depth, and the one step its first corners
    // add, nearer than the wall's image: so a rig's image is always laid over the wall's, never lost in a tie)
    gl_FragDepth = clamp(dot(uLevel.xy, gl_FragCoord.xy) + uLevel.z - .02 * (1. - gl_FragCoord.z), 0., 1.) + 2. / 16777216.;
    if (vW.y < 0.) discard; }
#endif
}`;
// THE WALL AS DRAWN: the shell is drawn in flat facets that stand a hand to a forearm inside the true sphere, so a
// skin is laid by the wall's own law (wallPoint gives the direction) at the drawn facet's own distance: a ray from
// the dome's middle through the shell's triangles near the place. Returns (unit direction) -> metres, or the
// sphere's own radius where no facet is met.
function drawnWall(sky, bMid, halfDeg, yTop) {
  const geo = sky && sky.shell && sky.shell.shell && sky.shell.shell.geometry, tris = [];
  if (geo && geo.index) { const P = geo.attributes.position.array, I = geo.index.array;
    for (let k = 0; k < I.length; k += 3) { const a = I[k] * 3, b = I[k + 1] * 3, c = I[k + 2] * 3, cx = (P[a] + P[b] + P[c]) / 3, cy = (P[a + 1] + P[b + 1] + P[c + 1]) / 3, cz = (P[a + 2] + P[b + 2] + P[c + 2]) / 3;
      if (cy > yTop || cy < -20 || Math.abs(turnTo(bMid, bearingOf(cx, cz))) > halfDeg) continue;
      // (a facet is kept as its three corners, its plane's normal as the corners give it, not made unit, and that normal's product with a corner)
      const nx = (P[b + 1] - P[a + 1]) * (P[c + 2] - P[a + 2]) - (P[b + 2] - P[a + 2]) * (P[c + 1] - P[a + 1]), ny = (P[b + 2] - P[a + 2]) * (P[c] - P[a]) - (P[b] - P[a]) * (P[c + 2] - P[a + 2]), nz = (P[b] - P[a]) * (P[c + 1] - P[a + 1]) - (P[b + 1] - P[a + 1]) * (P[c] - P[a]);
      tris.push([P[a], P[a + 1], P[a + 2], P[b], P[b + 1], P[b + 2], P[c], P[c + 1], P[c + 2], nx, ny, nz, nx * P[a] + ny * P[a + 1] + nz * P[a + 2]]); } }
  // WHERE A RAY FROM THE DOME'S MIDDLE MEETS A FACET (this part's own reckoning). The ray's place t metres out is
  // t d; it lies in the facet's plane where n . (t d) = n . (a corner): t = (n . corner) / (n . d). That place
  // is within the facet when it stands on the inner side of each of its three edges: side(i, j) is (the edge
  // from corner i to corner j) crossed with (the place from corner i), along n: a share of n . n that is 0 on
  // the edge and 1 at the corner across it. A place a millionth of that share outside an edge still counts
  // (the facets meet edge to edge: no ray slips between two); the nearest such place beyond a metre is the wall
  const side = (T, i, j, x, y, z) => { const ex = T[j] - T[i], ey = T[j + 1] - T[i + 1], ez = T[j + 2] - T[i + 2], px = x - T[i], py = y - T[i + 1], pz = z - T[i + 2];
    return (ey * pz - ez * py) * T[9] + (ez * px - ex * pz) * T[10] + (ex * py - ey * px) * T[11]; };
  return (d) => { let best = Infinity;
    for (const T of tris) { const along = T[9] * d.x + T[10] * d.y + T[11] * d.z; if (Math.abs(along) < 1e-9) continue;      // (the ray runs along the plane)
      const t = T[12] / along; if (!(t > 1 && t < best)) continue;
      const x = d.x * t, y = d.y * t, z = d.z * t, slack = -1e-6 * (T[9] * T[9] + T[10] * T[10] + T[11] * T[11]);
      if (side(T, 0, 3, x, y, z) >= slack && side(T, 3, 6, x, y, z) >= slack && side(T, 6, 0, x, y, z) >= slack) best = t; }
    return best < Infinity ? best : SHELL.R; };
}
// the painters' blue by the look (the drums' paint, the swatches'): the hero's paints (the wall's haze, its blue,
// its zenith) mixed as the sky stands a little up the wall, no stronger than the sky beside it (linear)
const freshPaint = (look) => { const P = PAINTS[look], c = new THREE.Color(P.haze).lerp(new THREE.Color(P.mid), 0.95).lerp(new THREE.Color(P.zen), 0.6), l = 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b;
  return c.setRGB(Math.max(0, l + (c.r - l) * 1.05), Math.max(0, l + (c.g - l) * 1.05), Math.max(0, l + (c.b - l) * 1.05)); };
// the unpainted stretch's mesh on the wall as drawn, and its image's skin. o: { ctx, detail, sky, look, bearing (its middle), fresh (Color) }
function makeField(o) {
  const PA = RIGS.patch, look = o.look, P = PAINTS[look], LL = LAMP_LIGHT[look], c = (h) => ({ value: new THREE.Color(h) }), lite = o.detail < 1;
  const bc = o.bearing, hw = PA.wide / 2 + 1, y0 = -0.6, y1 = PA.a1 + 1, nx = lite ? 30 : 44, ny = lite ? 16 : 22, SQ = PA.square;
  const radius = drawnWall(o.sky, bc, (hw / SHELL.R) / RAD + 5, 140), pos = [], uv = [], idx = [], d = V();
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) { const x = -hw + 2 * hw * i / nx, y = y0 + (y1 - y0) * j / ny;
    const b = bc + (x / (SHELL.R * Math.cos(y / SHELL.R))) / RAD; wallPoint(b, y, 0, d).normalize();
    const r = radius(d) - 0.07; pos.push(d.x * r, d.y * r, d.z * r); uv.push(x, y); }
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const k = j * (nx + 1) + i; idx.push(k, k + 1, k + nx + 2, k, k + nx + 2, k + nx + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aUV', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeBoundingSphere();
  const ls = Math.max(-1, Math.min(1, Math.sin((LAMP.looks[look].bearing - bc) * RAD) * 2.5));      // the lamp's side of the cloud, by the hero's own law
  const mat = new THREE.ShaderMaterial({ vertexShader: SKIN_VERT, fragmentShader: FIELD_FRAG, fog: true, transparent: true, premultipliedAlpha: true, depthWrite: false, side: THREE.DoubleSide, forceSinglePass: true,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLamp: o.sky.shadow.uLamp, uFresh: { value: o.fresh }, uHaze: c(P.haze), uCloudLit: c(P.cloudLit), uCloudShade: c(P.cloudShade),
      uLampCol: { value: new THREE.Color().setRGB((1 + LL.color[0]) / 2, (1 + LL.color[1]) / 2, (1 + LL.color[2]) / 2) }, uFillCol: c(P.fill), uPrimer: c(PRIMER), uKey: { value: LL.key }, uFill: { value: LL.fill }, uBlush: { value: P.blush }, uLs: { value: ls },
      uBox: { value: new THREE.Vector4(-PA.wide / 2, PA.wide / 2, 0, PA.a1) }, uCloud: { value: new THREE.Vector4(0, PA.cloudBase, PA.cloudHalf, PA.cloudH) },
      uGrid: { value: new THREE.Vector3(Math.ceil(PA.cloudHalf * 1.08 / SQ) * SQ, SQ, Math.ceil(PA.cloudH * 1.06 / SQ) * SQ) }, uClock: o.clock, uLevel: o.level } });
  const m = new THREE.Mesh(g, mat); m.frustumCulled = false; m.renderOrder = 1; m.name = 'unpainted-stretch-and-half-made-cloud';
  // ITS IMAGE IN THE SEA, TRUE TO THE THING: the same paint (FIELD_FRAG with MIRROR: the primer, the heaps, the
  // chalk, the brushed edges) on a coarse skin of the same stretch half a metre inside the wall, by the sea's law
  const ip = [], iu = [], ii = [], ix = 16, iy = 8;
  for (let j = 0; j <= iy; j++) for (let i = 0; i <= ix; i++) { const x = -hw + (2 * hw * i) / ix, y = (y1 * j) / iy;
    wallPoint(bc + (x / (SHELL.R * Math.cos(y / SHELL.R))) / RAD, y, 0.5, d); ip.push(d.x, d.y, d.z); iu.push(x, y); }
  for (let j = 0; j < iy; j++) for (let i = 0; i < ix; i++) { const k = j * (ix + 1) + i; ii.push(k, k + 1, k + ix + 2, k, k + ix + 2, k + ix + 1); }
  const ig = new THREE.BufferGeometry(); ig.setAttribute('position', new THREE.Float32BufferAttribute(ip, 3)); ig.setAttribute('aUV', new THREE.Float32BufferAttribute(iu, 2)); ig.setIndex(ii); ig.computeBoundingSphere();
  // (laid BEFORE the rigs' joined image and the netting's, order 1.5 against 1.56 and 1.6: the image of what
  // hangs before the wall, its thin ropes' too, is then blended over the wall's image; its depth stands two steps deeper than
  // its own so that no rig's image is lost in a tie with it: FIELD_FRAG)
  const imat = new THREE.ShaderMaterial({ vertexShader: SKIN_VERT, fragmentShader: FIELD_FRAG, fog: true, transparent: true, premultipliedAlpha: true, depthWrite: true, side: THREE.DoubleSide, forceSinglePass: true, defines: { MIRROR: 1 }, uniforms: mat.uniforms });
  const im = new THREE.Mesh(ig, imat); im.frustumCulled = false; im.renderOrder = 1.5; im.name = 'image:unpainted-stretch';
  return { mesh: m, material: mat, bearing: bc, image: im, imageMaterial: imat, triangles: idx.length / 3 + ii.length / 3 };
}
// ---- THE LAMP OF A MOON ON ITS CRANE, BEFORE THE LIT SEAM: a broad pontoon moored on the water inside the tail's
// loop (RIGS.moon: its tower's axis `near` m to port of the line's place `before` m before the ring), a hull
// from afar (ochre sides 4.4 m tall, a dark waterline band, a white line along its deck's edge, a pale deck, six
// lit deck lamps, fenders, yellow bollards, mooring lines to two buoys, a rail, a white generator house, the power
// cable's reel, ballast); bolted on it (a base plate, a yellow block a man's height across under each leg) a
// cross-braced lattice tower up to the slewing ring RIGS.moon.ring m up (legs dark, the
// lacing the sky's own blue); on the ring a turntable with a cab (dark windows, nobody in it), a cat head with its
// pendants (a small red lamp on it and one at the jib's end), a counter jib with its winch house and
// counterweight slabs, and a plated girder jib RIGS.moon.jib m long that carries, under a trolley, a globe lamp
// 12 m across with a seam round its middle: plainly a moon, a steady lit cream face and a shaded blue-grey one
// (no window, no room in it, no beam from it); a cable looped along the jib in festoons and down to the globe.
// The jib slews to and fro by the clock about the tower's upright axis, either way about the line's own heading
// abreast of the tower (a sine: a bounded swing; its phase drawn
// once from the stream sky-moon with the seed); the globe's lit face is set at each draw (light); jib and globe
// stay 30 m and more from the line at every phase. The crane and its globe have their image in the sea.
// o: { ctx, detail, mat, image, look, sky (the built sky: its lampAt), path, length, blue }. ASYNC:
// it yields between the standing part and the slewing part.
async function makeCrane(o) {
  const M = RIGS.moon, lite = o.detail < 1, blue = o.blue;
  const slew0 = o.ctx.core.makeRng(o.ctx.core.hashSeed('sky-moon:' + o.ctx.seed))() * 2 * Math.PI;      // the slew's phase: drawn once, from the moon's own stream
  // ITS PLACE, FROM THE ROUTE AND THE SEAM: the line's place M.before m before its end at the ring (on the last
  // straight into the seam) and its heading there (fw); the tower's axis M.near m to port of it, on the water
  // inside the tail's loop; the pontoon lies along that heading (th), its fendered side toward the line (inn)
  const mB = (o.length - M.before) / o.length, pm = o.path.pointAt(mB, V()), fw = o.path.tangentAt(mB, V()).setY(0).normalize(), port = V(fw.z, 0, -fw.x);
  const O = pm.clone().setY(0).addScaledVector(port, M.near);                                // the pontoon's middle (the tower's axis), at the still water
  const th = fw.clone(), inn = port.clone().negate();
  const at = (a, y, b) => O.clone().addScaledVector(th, a).addScaledVector(inn, b).setY(y);    // a metres along the pontoon (the straight's heading), b metres toward the line
  const S = new Geo(), hl = M.pontoon[0] / 2, hw = M.pontoon[1] / 2, dk = M.deck;
  // THE PONTOON, A HULL FROM AFAR: a broad raft 24 by 14 m with 4.4 m of freeboard in strong ochre, a dark
  // waterline band 1.3 m tall, a white band along its deck's edge, a pale deck; fenders on the line's side; yellow
  // bollards, and from two of them MOORING LINES to two buoys off its ends (white drums with a red band);
  // the rail along both long sides; SIX DECK LAMPS on posts (emissive: no light), lit at any hour
  S.color('#d39a26'); S.box(at(0, dk / 2 - 0.4, 0), th, UP, inn, hl, dk / 2 + 0.4, hw);
  S.color('#1c150d'); S.box(at(0, 0.5, 0), th, UP, inn, hl + 0.03, 0.8, hw + 0.03);
  for (const sa of [-1, 0, 1]) for (const sb of [-1, 1]) { const q = at(sa * (hl - 0.7), dk, sb * (hw - 0.7));
    S.color('#2b3037'); S.tube(q, q.clone().setY(dk + 3.4), 0.06, 4, true);
    S.color('#ffe2a6').lamp(3.2, 0); S.tube(q.clone().setY(dk + 3.4), q.clone().setY(dk + 3.95), 0.3, 5, false, 0.22, true); S.lamp(0, 0); }
  S.color('#f6f3ea'); S.box(at(0, dk - 0.4, 0), th, UP, inn, hl + 0.05, 0.36, hw + 0.05);
  S.color('#c9c5b6'); S.box(at(0, dk + 0.02, 0), th, UP, inn, hl - 0.15, 0.02, hw - 0.15);
  S.color('#17191c'); for (const a of [-9, -3, 3, 9]) S.tube(at(a, 0.6, hw + 0.33), at(a, 2.8, hw + 0.33), 0.32, 6, false, 0.32, true);
  const posts = (a, b) => { S.color('#d6a92b'); for (const k of [-0.3, 0.3]) S.tube(at(a + k, dk, b), at(a + k, dk + 0.7, b), 0.16, 6, false, 0.2, true); };
  for (const sa of [-1, 1]) { for (const sb of [-1, 1]) posts(sa * (hl - 1.1), sb * (hw - 0.8));
    // a buoy 7 m off the pontoon's end, a little to its far side from the line; its mooring line sags toward the water
    const by = at(sa * (hl + 7), 0, -2.5), bo = at(sa * (hl - 1.1), dk + 0.5, -(hw - 0.8));
    S.color('#f1ecdc'); S.tube(by.clone().setY(-0.3), by.clone().setY(0.85), 0.75, 8, false, 0.75, true); S.color('#c7492b'); S.tube(by.clone().setY(0.45), by.clone().setY(0.7), 0.77, 8);
    S.color('#3a3d44'); S.tube(by.clone().setY(0.85), by.clone().setY(1.5), 0.06, 4, true);
    S.color('#d9d2bd'); let p = bo; for (let i = 1; i <= 5; i++) { const f = i / 5, q = bo.clone().lerp(by.clone().setY(0.9), f); q.y -= 1.3 * 4 * f * (1 - f); S.tube(p, q, 0.035, 3, true); p = q; } }
  S.color('#c3c8ce'); const np = lite ? 3 : 5;
  for (const sb of [-1, 1]) { for (let i = 0; i <= np; i++) { const a = -hl + 2.4 + (2 * hl - 4.8) * i / np; S.tube(at(a, dk, sb * (hw - 0.2)), at(a, dk + 1.1, sb * (hw - 0.2)), 0.03, 4, true); }
    for (const y of [0.6, 1.1]) S.tube(at(-hl + 2.4, dk + y, sb * (hw - 0.2)), at(hl - 2.4, dk + y, sb * (hw - 0.2)), 0.03, 4, true); }
  // the generator house (white, louvres, no door), the power cable's reel, ballast slabs
  S.color('#f1ede2'); S.box(at(-6.3, dk + 1.3, -2.2), th, UP, inn, 1.7, 1.3, 1.5); S.color('#3b4149'); S.box(at(-6.3, dk + 2.68, -2.2), th, UP, inn, 1.9, 0.08, 1.7);
  S.color('#2a2f36'); for (const k of [-1, 0, 1]) S.box(at(-6.3 + k * 1.0, dk + 1.5, -0.68), th, UP, inn, 0.36, 0.6, 0.02);
  S.color('#c2562c'); for (const sd of [-1, 1]) S.tube(at(6.1 + sd * 0.75, dk + 1.25, -2.6), at(6.1 + sd * 0.82, dk + 1.25, -2.6), 1.2, 10, false, 1.2, true);
  S.color('#1c1f24'); S.tube(at(6.1 - 0.75, dk + 1.25, -2.6), at(6.1 + 0.75, dk + 1.25, -2.6), 0.8, 10);
  S.color('#a8a59c'); for (let k = 0; k < 3; k++) S.box(at(6.3, dk + 0.3 + k * 0.56, 3.6), th, UP, inn, 1.8, 0.26, 0.9);
  // THE CRANE'S FOOT, bolted on the deck: a dark base plate under the tower, a yellow foot pad under each leg
  S.color('#2f353c'); S.box(at(0, dk + 0.13, 0), th, UP, inn, 3.9, 0.11, 3.9);
  S.color('#d6a92b'); for (const sa of [-1, 1]) for (const sb of [-1, 1]) S.box(at(sa * 3.1, dk + 0.7, sb * 3.1), th, UP, inn, 0.8, 0.46, 0.8);      // (blocks a man's height across: the tower's foot reads on the deck from afar)
  // the tower: a base frame spread on the deck, then a square lattice (four chords; a tie and a diagonal to each
  // face of each bay) up to the slewing ring's seat
  const h = M.tower / 2, yb = dk + 4.5, bays = lite ? 6 : 8, ty = (k) => yb + (M.ring - 1.2 - yb) * k / bays, cn = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  S.color(blue, 0.8);
  cn.forEach(([sa, sb], k) => { const [na, nb] = cn[(k + 1) % 4];
    S.tube(at(sa * 3.1, dk + 1.1, sb * 3.1), at(sa * h, yb, sb * h), 0.2, 5, true); S.tube(at(sa * 3.1, dk + 1.1, sb * 3.1), at(na * 3.1, dk + 1.1, nb * 3.1), 0.16, 4, true);
    S.tube(at(sa * 3.1, dk + 1.1, sb * 3.1), at(na * h, yb, nb * h), 0.09, 4, true); S.tube(at(sa * h, yb, sb * h), at(na * h, yb, nb * h), 0.09, 4, true); });
  for (let k = 0; k < bays; k++) cn.forEach(([sa, sb], f) => { const [na, nb] = cn[(f + 1) % 4], ya = ty(k), yc = ty(k + 1), flip = (k + f) % 2;
    S.color('#2f353c'); S.tube(at(sa * h, ya, sb * h), at(sa * h, yc, sb * h), 0.2, 4, true);       // (dark legs, 0.4 m across)
    S.color(blue, 0.78); S.tube(at(sa * h, yc, sb * h), at(na * h, yc, nb * h), 0.08, 4, true);
    S.tube(at((flip ? na : sa) * h, ya, (flip ? nb : sb) * h), at((flip ? sa : na) * h, yc, (flip ? sb : nb) * h), 0.08, 4, true);
    S.tube(at((flip ? sa : na) * h, ya, (flip ? sb : nb) * h), at((flip ? na : sa) * h, yc, (flip ? nb : sb) * h), 0.08, 4, true); });      // (cross-braced: no zigzag up the tower)
  // THE TOWER'S FACES ARE PLATED (a body, as the jib's webs are: a dark box tower 3.2 m square inside its legs and
  // lacing). A leg 0.4 m across is drawn as it is while a pixel covers under 27 cm of it (0.4 / 1.5); from there
  // on it is drawn one and a half footprints wide and carries only its true cover (0.5 of its line where a pixel
  // covers 53 cm, 0.3 where 89 cm), so a bare lattice is a veil from far off: the plates are what reads there,
  // the legs and the cross-braces stand proud of them near to
  S.color('#3b4149'); cn.forEach(([sa, sb], f) => { const [na, nb] = cn[(f + 1) % 4], hp = h - 0.02; S.quad(at(sa * hp, ty(0), sb * hp), at(na * hp, ty(0), nb * hp), at(na * hp, ty(bays), nb * hp), at(sa * hp, ty(bays), sb * hp)); });
  S.color(blue, 0.7); S.tube(at(0, M.ring - 1.2, 0), at(0, M.ring - 0.1, 0), 2.0, 12, false, 2.0, true);
  const fixed = mesh(S, o.mat, 'moon-crane (pontoon and tower)'), fixedImage = mesh(fixed.geometry, o.image, 'image:moon-crane'); fixedImage.renderOrder = 1.5;
  await o.ctx.yield();
  // the slewing part, in its own frame: x along the jib, y up from the slewing ring, z across
  const J = new Geo(), X = V(1, 0, 0), Z = V(0, 0, 1), fy = M.foot, L = M.jib;
  J.color(blue, 0.75); J.tube(V(0, -0.1, 0), V(0, 0.9, 0), 1.9, 12, false, 1.9, true);
  J.color(blue, 0.85); J.box(V(0.4, 1.05, 0), X, UP, Z, 2.6, 0.16, 1.7);
  // the cab, hung to one side of the jib's foot: dark windows before it and to both sides (nobody in it)
  const cab = V(2.5, 1.3, 3.05);
  J.color('#ece8dc'); J.box(cab, X, UP, Z, 1.5, 1.3, 1.1); J.color(blue, 0.8); J.box(cab.clone().add(V(0, -0.85, 0)), X, UP, Z, 1.52, 0.14, 1.12);
  J.color('#3b4149'); J.box(cab.clone().add(V(0, 1.36, 0)), X, UP, Z, 1.65, 0.06, 1.25);
  J.color('#0c1118'); J.box(cab.clone().add(V(1.51, 0.3, 0)), X, UP, Z, 0.012, 0.72, 0.95);
  for (const s of [-1, 1]) J.box(cab.clone().add(V(0.2, 0.35, s * 1.11)), X, UP, Z, 1.15, 0.62, 0.012);
  // the cat head over the tower
  const head = V(-0.4, M.apex, 0);
  J.color(blue, 0.85); for (const [sx, sz] of [[1.6, 1.1], [1.6, -1.1], [-2.2, 1.1], [-2.2, -1.1]]) J.tube(V(sx, 1.2, sz), head, 0.14, 4, true);
  // the jib: a lattice of three chords (two below, one above), laced; two pendants from the cat head
  const nbay = lite ? 13 : 19, x0 = 1.6, chord = (x, k) => { const f = (x - x0) / (L - x0), w = 1.05 - 0.45 * f, hg = 2.3 - 1.2 * f; return k === 2 ? V(x, fy + hg, 0) : V(x, fy, (k ? 1 : -1) * w); };
  for (let i = 0; i < nbay; i++) { const xa = x0 + (L - x0) * i / nbay, xb = x0 + (L - x0) * (i + 1) / nbay;
    J.color('#2f353c'); for (let k = 0; k < 3; k++) J.tube(chord(xa, k), chord(xb, k), k === 2 ? 0.16 : 0.14, 4, true);
    J.color('#3b4149'); for (const k of [0, 1]) J.quad(chord(xa, k), chord(xb, k), chord(xb, 2), chord(xa, 2));      // plated webs: a dark girder that reads from 300 m
    J.color(blue, 0.8); J.tube(chord(xa, 0), chord(xb, 2), 0.06, 4, true); J.tube(chord(xa, 1), chord(xb, 2), 0.06, 4, true); J.tube(chord(xa, 2), chord(xb, 0), 0.06, 4, true); J.tube(chord(xa, 2), chord(xb, 1), 0.06, 4, true);
    J.tube(chord(xb, 0), chord(xb, 1), 0.06, 4, true); if (i % 2 === 0) J.tube(chord(xa, 0), chord(xb, 1), 0.05, 4, true); }
  J.color(blue, 1.05); for (const f of [0.42, 0.84]) J.tube(head, chord(x0 + (L - x0) * f, 2), 0.05, 4, true);
  J.color('#ff3a24').lamp(2.2, 0); J.ball(head.clone().add(V(0, 0.35, 0)), 0.28, 8, 4); J.ball(chord(L, 2).add(V(0, 0.35, 0)), 0.24, 8, 4); J.lamp(0, 0);
  // the counter jib: two beams and a deck, the winch house, the counterweight slabs hung at its end, two pendants
  J.color(blue, 0.85); for (const z of [-1, 1]) J.box(V(-M.tail / 2 - 0.4, fy, z), X, UP, Z, M.tail / 2 - 0.4, 0.2, 0.13);
  J.color(blue, 0.7); J.box(V(-M.tail / 2 - 0.4, fy + 0.2, 0), X, UP, Z, M.tail / 2 - 0.8, 0.03, 0.9);
  J.color('#ece8dc'); J.box(V(-5.2, fy + 1.15, 0), X, UP, Z, 1.5, 0.9, 0.85);
  J.color('#a8a59c'); for (let k = 0; k < 4; k++) J.box(V(-M.tail + 0.38 + k * 0.74, fy - 1.0, 0), X, UP, Z, 0.32, 1.35, 1.3);
  J.color(blue, 1.05); for (const z of [-1, 1]) J.tube(head, V(-M.tail + 0.8, fy + 0.2, z), 0.05, 4, true);
  // the trolley under the jib, its hanger, and the globe: two cream halves, a steel seam round its middle, a cap
  const xr = M.reach, gr = M.globe, gc = V(xr, fy - M.drop - gr, 0);
  J.color('#3b4149'); J.box(V(xr, fy - 0.28, 0), X, UP, Z, 1.2, 0.2, 0.75);
  for (const sx of [-1, 1]) J.tube(V(xr + sx * 1.7, fy - 0.4, 0), V(xr + sx * 0.7, gc.y + gr + 0.9, 0), 0.16, 4, true);
  J.color('#2f353c'); for (const z of [-0.5, 0.5]) J.quad(V(xr - 1.7, fy - 0.4, z), V(xr + 1.7, fy - 0.4, z), V(xr + 0.7, gc.y + gr + 0.9, z), V(xr - 0.7, gc.y + gr + 0.9, z));   // the hanger: a plated yoke
  J.color('#4a515b'); J.tube(gc.clone().add(V(0, gr - 0.1, 0)), gc.clone().add(V(0, gr + 0.95, 0)), 0.85, 8, false, 0.5, true);
  // the globe, PLAINLY A MOON: cream glass with three grey seas (fixed on the globe, about the face it turns to
  // the lamp-sun at the slew's middle). WHICH FACE IS LIT IS NOT BUILT IN: the paint lights the face toward the
  // lamp-sun's place at each draw (uMoonAt, uMoonSun: `light` below sets them in update), the other face is
  // shaded blue-grey, so the bright side faces the lamp at every phase of the slew and of the lamp's swing
  const nsd = lite ? 20 : 30, nbd = lite ? 10 : 14, glow = o.look ? 1.02 : 1.08;
  const d0 = fw.clone(), z0 = V().crossVectors(d0, UP), gw = at(0, M.ring, 0).addScaledVector(d0, gc.x); gw.y += gc.y;
  // (the seas' place is fixed at build: about the face toward the lamp at the middle of its swing, the undealt lampPlace at clock 0)
  const lw = lampPlace(o.look, 0).sub(gw).normalize(), sun = V(lw.dot(d0), lw.y, lw.dot(z0)).normalize(), su = V().crossVectors(sun, UP).normalize(), sv = V().crossVectors(su, sun);
  const seas = [[0.42, 0.3, 0.32], [-0.3, 0.45, 0.26], [0.1, -0.38, 0.3]].map(([a, b, r]) => [sun.clone().addScaledVector(su, a).addScaledVector(sv, b).normalize(), Math.cos(r)]);
  const lit = new THREE.Color('#fff1d2'), gp = (i, j) => { const e = -Math.PI / 2 + (Math.PI * j) / nbd, an = (i / nsd) * 2 * Math.PI; return V(gc.x + Math.cos(an) * Math.cos(e) * gr, gc.y + Math.sin(e) * gr, gc.z + Math.sin(an) * Math.cos(e) * gr); };
  for (let j = 0; j < nbd; j++) for (let i = 0; i < nsd; i++) { const n = gp(i + 0.5, j + 0.5).sub(gc).normalize(), sea = seas.some(([q, c]) => n.dot(q) > c) ? 0.8 : 1;
    J.col.copy(lit).multiplyScalar(sea); J.lamp(glow, 4); J.quad(gp(i, j), gp(i, j + 1), gp(i + 1, j + 1), gp(i + 1, j)); }
  J.lamp(0, 0).color('#6f6a5e'); J.tube(gc.clone().add(V(0, -0.14, 0)), gc.clone().add(V(0, 0.14, 0)), gr + 0.09, nsd);
  // the cable: looped along under the jib in festoons, and one long loop down to the globe's cap
  const hang = (a, b, sag, n) => { let p = a.clone(); for (let i = 1; i <= n; i++) { const f = i / n, q = a.clone().lerp(b, f); q.y -= sag * 4 * f * (1 - f); J.tube(p, q, 0.1, 4, true); p = q; } };
  const loops = lite ? 5 : 8, cx = (i) => 3 + (xr - 12) * i / loops; J.color('#20242a');
  for (let i = 0; i < loops; i++) hang(V(cx(i), fy - 0.12, 0.3), V(cx(i + 1), fy - 0.12, 0.3), 1.5, 5);
  hang(V(xr - 9, fy - 0.12, 0.3), gc.clone().add(V(-0.6, gr + 0.95, 0.2)), 3.2, 8);
  // the slew: the jib's own direction in the world, M.slew degrees either way about the line's heading abreast of the tower
  const T = at(0, M.ring, 0), arm = mesh(J, o.mat, 'moon-jib'), armImage = mesh(arm.geometry, o.image, 'image:moon-jib'), G = new THREE.Group(); armImage.renderOrder = 1.5;
  G.name = 'moon-jib'; G.position.copy(T); G.add(arm, armImage);
  const amp = M.slew * RAD, d = V(), zz = V(), mb = new THREE.Matrix4();
  const aim = (a) => { const an = a * amp; return d.copy(fw).multiplyScalar(Math.cos(an)).addScaledVector(port, Math.sin(an)); };
  const set = (a) => { aim(a); zz.crossVectors(d, UP); G.quaternion.setFromRotationMatrix(mb.makeBasis(d, UP, zz)); G.updateMatrixWorld(true); };
  const course = (time) => Math.sin(time * 2 * Math.PI / M.period + slew0);
  const globeAt = (time, out = V()) => { aim(course(time)); return out.copy(T).addScaledVector(d, gc.x).setY(T.y + gc.y); };
  set(0);
  // the globe's light at a clock: its middle and the direction from it to the lamp-sun's place then (the paint's
  // uMoonAt, uMoonSun). The lamp is THE BUILT SKY'S OWN (sky.lampAt: its creep at the phase dealt in makeSky)
  const U = o.mat.uniforms, lampNow = V(), light = (time) => { globeAt(time, U.uMoonAt.value); o.sky.lampAt(time, lampNow); U.uMoonSun.value.copy(lampNow).sub(U.uMoonAt.value).normalize(); };
  return { group: G, fixed, images: [fixedImage], place: O, head: T, globeAt, light, triangles: 2 * (S.triangles + J.triangles),
    mover: { name: 'the moon\'s jib and globe', meshes: [arm], dims: 1, set, at: (time) => set(course(time)) } };
}
// ---- THE RIGS' PAINTED BODIES ARE DRAWN JOINED (the world's count of draws is held to a budget). Every body in
// the rigs' one paint (the cradles, the rail, the stages, the scaffolds, the crane and its jib, the barge, the
// mast, its cable and cage, the gantry's steel and tackle) is built as its own mesh, as before; here, at build,
// their corners are laid into ONE geometry, in this order: the solids of the bodies that have an image in the
// sea, ONCE FOR THE IMAGE'S DEPTH (below); those solids; the thin members of the imaged bodies; the thin
// members of the rest; the solids of the rest (each thin member as one strip of two triangles: below). So the
// paint draws all but the first run in one draw, its blended twin draws the thin members in one, and the
// image's paint draws the first three runs in one: three draws for all of them, the solids' own corners and
// the same paints as when each was drawn alone (an imaged solid's triangles in the order `outer` gives them:
// below). A body the clock moves keeps its own frame: its corners stay in its own frame and carry its slot
// (aSlot); at each draw the slot's frame (uMove) is set from the body's own pose, which the movers set as
// before. THE SLOTS' FRAMES ARE WORLD FRAMES (each body's matrixWorld), laid over the root's own: they hold
// while the root stands at the world's own frame, as the world adds it (a world that moved or turned the root
// would lay its frame twice on every mover). THE BODIES THEMSELVES ARE KEPT, NOT DRAWN (skins: the same meshes
// in the same groups, listed in movers and statics as before: the proof walks their skins and the movers pose
// them), out of the scene, so nothing of them is sent to the graphics card.
// THE IMAGED THIN MEMBERS' STRIPS STAND ONCE MORE IN THE NETTING'S IMAGE'S DRAW (veilImage: its paint), after
// its veils: that draw blends and writes no depth, and lays a strip's image where the member is drawn wider
// than it is, the joined image's draw where it is drawn as wide as it is (RIG_FRAG). No draw is added.
// o: (ctx, object (the rigs' root), mat, image, movers, veilImage). ASYNC: it yields as it lays the corners.
// Returns { skins (the root the kept bodies hang from), pose() (sets the slots' frames), dispose() }.
async function joinDraws(ctx, object, mat, image, movers, veilImage) {
  object.updateMatrixWorld(true);
  const moving = new Set(), bodies = [], images = [], imaged = new Set(), ident = new THREE.Matrix4(), paintOf = (n) => (Array.isArray(n.material) ? n.material[0] : n.material);
  for (const mv of movers) for (const m of mv.meshes) moving.add(m);
  object.traverse((n) => { if (!n.isMesh) return; if (paintOf(n) === mat) bodies.push(n); else if (paintOf(n) === image) images.push(n); });
  // the slots: one for each body that moves or does not stand in the root's own frame (a body beyond the slots
  // there are stays drawn by itself: none as built)
  const slots = [null], slotOf = new Map();
  for (const b of bodies) { const own = moving.has(b) || !b.matrixWorld.equals(ident); if (!own) slotOf.set(b, 0); else if (slots.length < NMOVE) { slotOf.set(b, slots.length); slots.push(b); } }
  const taken = bodies.filter((b) => slotOf.has(b)), geos = new Set(taken.map((b) => b.geometry)), takenImages = images.filter((n) => geos.has(n.geometry));
  for (const n of takenImages) imaged.add(n.geometry);
  // the runs, in the joined order: [body, its first corner, how many corners are laid, its members]. A SOLID'S
  // corners are laid as they are. A THIN MEMBER IS LAID AS ONE STRIP, two triangles along its axis, which the
  // paint turns to the eye and makes as wide as the member is (RIG_VERT): so a member costs the frame two
  // triangles in the paint's draw and two in the twin's, not its whole round skin twice. A body's thin run is
  // read member by member (the corners of one member carry the same two axis ends and the same radius): members
  // lists the first corner of each
  const split = (b) => { const g = b.geometry, th = g.groups.length > 1 ? g.groups[1] : null; return th ? [th.start, th.count] : [g.attributes.position.count, 0]; };
  const members = (b, first, count) => { const ax = b.geometry.attributes.aAxis.array, list = []; let pa = -1, pb = -1;
    for (let t = first; t < first + count; t += 3) { const ia = t * 4, ib = (t + 2) * 4;
      if (pa >= 0 && ax[ia] === ax[pa] && ax[ia + 1] === ax[pa + 1] && ax[ia + 2] === ax[pa + 2] && ax[ia + 3] === ax[pa + 3] && ax[ib] === ax[pb] && ax[ib + 1] === ax[pb + 1] && ax[ib + 2] === ax[pb + 2]) continue;
      pa = ia; pb = ib; if (Math.hypot(ax[ib] - ax[ia], ax[ib + 1] - ax[ia + 1], ax[ib + 2] - ax[ia + 2]) > 1e-5) list.push(t); }
    return list; };
  // OF SKINS THAT LIE CLOSE AND LOOK THE SAME WAY THE OUTER STANDS FIRST: an imaged body's solid triangles are
  // laid by how far out each one's plane stands along its own normal, the farthest first (outer: their order).
  // Where the image's depth cannot tell two such skins apart (a band a few centimetres proud of a hull, from
  // afar), the first laid is the one blended: the outer, by its place and not by the order it was built in
  const outer = (b, count) => { const P = b.geometry.attributes.position.array, Q = b.geometry.attributes.normal.array, key = new Float32Array(count / 3), order = Array.from(key, (_, i) => i);
    for (let i = 0, v = 0; i < key.length; i++, v += 9) key[i] = (Q[v] * (P[v] + P[v + 3] + P[v + 6]) + Q[v + 1] * (P[v + 1] + P[v + 4] + P[v + 7]) + Q[v + 2] * (P[v + 2] + P[v + 5] + P[v + 8])) / 3;
    return order.sort((p, q) => key[q] - key[p] || p - q); };
  const runs = [[], [], [], []];
  for (const b of taken) { const im = imaged.has(b.geometry), [ns, nt] = split(b); if (ns) runs[im ? 1 : 0].push([b, 0, ns, null, im ? outer(b, ns) : null]);
    if (nt) { const list = members(b, ns, nt); if (list.length) runs[im ? 2 : 3].push([b, ns, 6 * list.length, list]); } }
  // THE ORDER THEY ARE LAID IN: FIRST the imaged solids ONCE MORE, marked (aSide 3): the image's paint lays no
  // colour for these and writes their depth alone, so that each solid's image is then laid once, its nearest
  // skin, whatever the order of the corners (RIG_FRAG; the image's draw alone reaches them); then the imaged
  // solids, the imaged thin members, the other thin members, the other solids
  const sizes = runs.map((r) => r.reduce((a, q) => a + q[2], 0)), PRE = sizes[1], N = PRE + sizes[0] + sizes[1] + sizes[2] + sizes[3];
  const names = ['position', 'normal', 'color', 'aGlow', 'aAxis'], width = [3, 3, 3, 2, 4], out = width.map((w) => new Float32Array(N * w)), slot = new Float32Array(N), side = new Float32Array(N);
  // a strip's six corners: [the end of the axis it stands at (0: the first, 1: the other), its side]; the side is
  // told about the axis as it runs FROM the corner's own end, so the far end's sides are the near end's turned over
  const CORNERS = [[0, -1], [0, 1], [1, -1], [0, -1], [1, -1], [1, 1]];
  let at = 0, since = 0;
  for (const [run, mark] of [[runs[1], 3], [runs[1], 0], [runs[2], 0], [runs[3], 0], [runs[0], 0]]) for (const [b, first, count, list, order] of run) {
    const A = b.geometry.attributes;
    if (!list && order) { names.forEach((k, i) => { const w3 = width[i] * 3, src = A[k].array; order.forEach((t, j) => out[i].set(src.subarray(t * w3, (t + 1) * w3), at * width[i] + j * w3)); }); if (mark) side.fill(mark, at, at + count); }
    else if (!list) names.forEach((k, i) => { const w = width[i]; out[i].set(A[k].array.subarray(first * w, (first + count) * w), at * w); });
    else { const ax = A.aAxis.array, col = A.color.array, gl = A.aGlow.array; let v = at;
      for (const t of list) for (const [end, sd] of CORNERS) { const me = (t + 2 * end) * 4, other = (t + 2 - 2 * end) * 4;
        out[0][v * 3] = ax[me]; out[0][v * 3 + 1] = ax[me + 1]; out[0][v * 3 + 2] = ax[me + 2]; out[1][v * 3 + 1] = 1;
        out[2][v * 3] = col[t * 3]; out[2][v * 3 + 1] = col[t * 3 + 1]; out[2][v * 3 + 2] = col[t * 3 + 2]; out[3][v * 2] = gl[t * 2]; out[3][v * 2 + 1] = gl[t * 2 + 1];
        out[4][v * 4] = ax[other]; out[4][v * 4 + 1] = ax[other + 1]; out[4][v * 4 + 2] = ax[other + 2]; out[4][v * 4 + 3] = ax[t * 4 + 3]; side[v] = sd; v++; } }
    slot.fill(slotOf.get(b), at, at + count); at += count; since += count;
    if (since > 30000) { since = 0; await ctx.yield(); }
  }
  const g = new THREE.BufferGeometry(); names.forEach((k, i) => g.setAttribute(k, new THREE.BufferAttribute(out[i], width[i]))); g.setAttribute('aSlot', new THREE.BufferAttribute(slot, 1)); g.setAttribute('aSide', new THREE.BufferAttribute(side, 1));
  // (the paint's group: all but the first run; its twin's: the two runs of thin members)
  g.addGroup(PRE, N - PRE, 0); if (sizes[2] + sizes[3]) g.addGroup(PRE + sizes[1], sizes[2] + sizes[3], 1);
  await ctx.yield();
  g.computeBoundingSphere();                             // (made at build: three asks for it when it orders the see-through draws)
  // (order 2.1: the thin members are blended after the sea's images and the layers that lie on the water, before the nets and the lamps' air)
  const body = new THREE.Mesh(g, [mat, mat.userData.thin]); body.name = 'rigs (every painted body, joined)'; body.renderOrder = 2.1; body.frustumCulled = false;
  // the images: the same corners (the same buffers): the first three runs (the imaged solids' depth, the imaged
  // solids, the imaged thin members), in that order in the one draw
  const ig = new THREE.BufferGeometry(); for (const k of Object.keys(g.attributes)) ig.setAttribute(k, g.attributes[k]); ig.setDrawRange(0, PRE + sizes[1] + sizes[2]); ig.boundingSphere = g.boundingSphere;
  const im = new THREE.Mesh(ig, image); im.name = 'image:rigs (every imaged body, joined)'; im.renderOrder = 1.56; im.frustumCulled = false;      // (an order of its own: after the unpainted stretch's image at 1.5 and the town's at 1.55, before the netting's at 1.6)
  // THE IMAGED THIN MEMBERS' STRIPS ONCE MORE, FOR THE NETTING'S IMAGE'S DRAW: that image takes a geometry of its
  // own, its veils first (one mesh in the root's own frame: slot 0, no side) and the strips after them with
  // their slots and sides. It keeps the veils' own bounding sphere (three reads it when it orders the
  // see-through draws). Were there no netting's image in the root's frame, the strips would take one draw of
  // their own with its paint (none as built: the mast's netting is always built)
  const o2 = PRE + sizes[1], n2 = sizes[2], more = [];
  if (n2) { let veil = null; object.traverse((n) => { if (!veil && n.isMesh && n.material === veilImage && n.matrixWorld.equals(ident)) veil = n; });
    const VA = veil ? veil.geometry.attributes : null, nv = veil ? VA.position.count : 0, vg = new THREE.BufferGeometry();
    names.forEach((k, i) => { const w = width[i], a = new Float32Array((nv + n2) * w); if (veil) a.set(VA[k].array.subarray(0, nv * w)); a.set(out[i].subarray(o2 * w, (o2 + n2) * w), nv * w); vg.setAttribute(k, new THREE.BufferAttribute(a, w)); });
    const vs = new Float32Array(nv + n2), vd = new Float32Array(nv + n2); vs.set(slot.subarray(o2, o2 + n2), nv); vd.set(side.subarray(o2, o2 + n2), nv);
    vg.setAttribute('aSlot', new THREE.BufferAttribute(vs, 1)); vg.setAttribute('aSide', new THREE.BufferAttribute(vd, 1)); vg.boundingSphere = veil ? veil.geometry.boundingSphere : g.boundingSphere;
    if (veil) veil.geometry = vg; else { const vm = new THREE.Mesh(vg, veilImage); vm.name = 'image:rigs (thin members drawn wider than they are)'; vm.renderOrder = 1.6; vm.frustumCulled = false; more.push(vm); } }
  // the kept bodies leave the scene with their groups; what is still drawn by itself (the nets, the unpainted
  // stretch, the shadows on the wall, the light in the air, the dust) goes back under the root where it stood
  const gone = new Set([...taken, ...takenImages]), stay = [], skins = new THREE.Group(); skins.name = 'rigs-skins (kept, not drawn)';
  object.traverse((n) => { if ((n.isMesh || n.isPoints) && !gone.has(n) && !n.userData.joined) stay.push(n); });      // (a skin marked joined is drawn in another's draw: the beams')
  for (const c of [...object.children]) skins.add(c);
  for (const n of stay) object.attach(n);
  object.add(im, body, ...more); object.updateMatrixWorld(true);
  const frames = mat.uniforms.uMove.value;
  return { skins, pose() { for (let k = 1; k < slots.length; k++) frames[k].copy(slots[k].matrixWorld); }, dispose() { skins.traverse((n) => { if (n.geometry) n.geometry.dispose(); }); } };
}
// THE TRIANGLES THE PART SENDS TO THE CARD AT EACH FRAME: every draw of every mesh under the root (a mesh of
// several paints sends each paint's group; a geometry with a draw range sends that range alone)
const sentTriangles = (object) => { let n = 0;
  object.traverse((m) => { if (!m.isMesh) return; const g = m.geometry, whole = g.index ? g.index.count : g.attributes.position.count, r0 = g.drawRange.start, r1 = Math.min(whole, r0 + g.drawRange.count);
    n += (Array.isArray(m.material) ? g.groups.reduce((a, q) => a + Math.max(0, Math.min(r1, q.start + q.count) - Math.max(r0, q.start)), 0) : r1 - r0) / 3; });
  return n; };
// ---- THE RIGS, whole. opts: { look, sky (the hero's makeSky result), path, length, detail, marks: { C, D, E } (C: where the line's last heading before the wall ends; D, E: the wall
// leg's first and last metre of route), ring (Vector3: the ring's middle) }. ASYNC: it yields between its pieces.
// update(dt, time, camera) moves every body by the clock alone; moonAt(time, out) is the globe's middle at a clock.
export async function makeRigs(ctx, opts) {
  const look = opts.look, sky = opts.sky, LEN = opts.length, object = new THREE.Group(); object.name = 'sky-rigs';
  // the build's detail (1 whole; under 1 a phone's: small counts are thinned and what remains is spaced and dealt
  // anew by the smaller count, as the head says; the big shapes and the movers' courses are the same)
  const detail = opts.detail != null ? opts.detail : (ctx.quality && ctx.quality.detail ? ctx.quality.detail : 1);
  const mat = rigMaterial(look, sky.shadow);
  // EVERY PHASE of a thing the clock moves (but the cradles' and the moon's, which have their own streams) is
  // drawn once here, all dice first, from the part's own stream: the three beacons' turns, the winch's weight,
  // the gantry hook's two swings, the mast's lift cage
  const mv = ctx.core.makeRng(ctx.core.hashSeed('sky-movers:' + ctx.seed)), TAU = 2 * Math.PI;
  const phases = { beacons: [mv(), mv(), mv()], weight: mv() * TAU, hook: [mv() * TAU, mv() * TAU], cage: mv() * TAU };
  const pD = opts.path.pointAt(opts.marks.D / LEN, V()), pE = opts.path.pointAt(opts.marks.E / LEN, V());
  const bD = bearingOf(pD.x, pD.z), bE = bD + turnTo(bD, bearingOf(pE.x, pE.z));      // the wall leg's first and last bearing
  // THE SHADOW'S WALL, BY THE HERO'S OWN LAW (read at build, nothing of it typed): from the metre the whole shadow
  // of our boat stands on the wall (shadowWholeFrom) to where the shadow's look is closed (the mark D and
  // LOOKS.shadow.hold + LOOKS.shadow.open m of the leg), the bearings of wall our sail's shade sweeps (shadowWall:
  // both looks, the lamp's whole creep). bS is the last of them: everything of this part that stands at the
  // wall's foot or is primed steel stands beyond it
  const sWhole = shadowWholeFrom(opts.path, LEN, opts.marks.C, opts.marks.D), sEnd = opts.marks.D + LOOKS.shadow.hold + LOOKS.shadow.open;
  const SW = shadowWall(opts.path, LEN, sWhole, sEnd), bS = bD + turnTo(bD, SW.hi);
  await ctx.yield();
  const blue = '#' + new THREE.Color(PAINTS[look].mid).lerp(new THREE.Color(PAINTS[look].haze), 0.25).getHexString();
  const image = imageMaterial(mat), fresh = freshPaint(look);
  const cr = await makeCradles({ ctx, detail, mat, image, bD, bS, paint: fresh, blue }); object.add(cr.group);
  await ctx.yield();
  const skin = makeField({ ctx, detail, sky, look, bearing: cr.field.bearing, fresh, clock: mat.uniforms.uClock, level: mat.uniforms.uLevel }); object.add(skin.mesh, skin.image);
  await ctx.yield();
  // the large work stages hung from the wall (the second file); they stand still
  const nsd = (detail < 1 ? 21 : 30) * cr.stages.length, sdice = ctx.core.makeRng(ctx.core.hashSeed('sky-stages:' + ctx.seed)), stg = makeStages({ Geo, mesh, V, UP }, { mat, detail, blue, paint: fresh, wide: RIGS.stage.wide, off: RIGS.stage.off, list: cr.stages,
    top: (b) => wallPoint(b, RIGS.rail.arc, RIGS.rail.inset + 0.55), fix: (b) => wallPoint(b, RIGS.rail.arc + 0.6, 0.05), dice: Array.from({ length: nsd }, () => sdice()) }); object.add(stg.mesh);   // as many dice as the stages read, no more
  await ctx.yield();
  // THE WALL SCAFFOLDS (the second file) stand BEYOND THE UNPAINTED STRETCH, past the leg's end: the first's
  // float RIGS.front.gap m of wall past the stretch's far side and no less than RIGS.front.pastE m of wall past
  // the mark E's bearing; the second's float RIGS.front.between m of wall beyond the first's (w2d: metres of the
  // wall's foot to degrees; hf: each float's half length)
  const FR = RIGS.front, w2d = (m) => m / SHELL.R / RAD, hf = WSCAF.list.map((q) => w2d(q.bays * WSCAF.bay / 2 + WSCAF.over));
  const b0 = Math.max(cr.field.bearing + w2d(RIGS.patch.wide / 2 + FR.gap), bE + w2d(FR.pastE)) + hf[0], b1 = b0 + hf[0] + w2d(FR.between) + hf[1];
  const wdice = ctx.core.makeRng(ctx.core.hashSeed('sky-wall-scaffolds:' + ctx.seed));
  const wsc = makeWallScaffolds({ Geo, mesh, V, UP }, { mat, image, detail, blue, paint: fresh, dice: Array.from({ length: scaffoldDice() }, () => wdice()),
    list: [{ bearing: b0, ...WSCAF.list[0] }, { bearing: b1, ...WSCAF.list[1] }] }); object.add(wsc.group);
  await ctx.yield();
  // the cradles', the stages' and their ropes' soft shadows on the painted wall (things that stand on the wall as drawn)
  const shade = makeWallShadows({ V }, { look, list: [...cr.shades, ...stg.shades], wall: (b) => drawnWall(sky, b, 5, 140) }); object.add(shade.mesh);
  await ctx.yield();
  const moon = await makeCrane({ ctx, detail, mat, image, look, sky, path: opts.path, length: LEN, blue }); object.add(moon.fixed, moon.group, ...moon.images);
  await ctx.yield();
  const movers = [...cr.movers, moon.mover], statics = [...cr.statics, moon.fixed, skin.mesh, shade.mesh, stg.mesh, ...wsc.statics], extras = [];
  // the gantry's working lamps in the opening (the second file)
  const gl = makeGantryLamps({ Geo, mesh, V, UP }, { ctx, detail, mat, sky, length: LEN, ring: opts.ring, phases }); object.add(gl.group); extras.push(gl);
  movers.push(...gl.movers); statics.push(...gl.statics);
  await ctx.yield();
  // the painters' barge and its hoist mast at the wall's foot (the second file)
  const net = netMaterial(mat, false), netImage = netMaterial(mat, true);
  const scaf = await makeScaffold({ Geo, mesh, V, UP }, { ctx, detail, mat, image, net, netImage, look, path: opts.path, length: LEN, C: opts.marks.C, D: opts.marks.D, blue, phases });
  object.add(scaf.group); movers.push(...scaf.movers); statics.push(...scaf.statics);
  await ctx.yield();
  // every painted body joined into three draws (the paint's, its blended twin's, the image's): joinDraws above
  const joined = await joinDraws(ctx, object, mat, image, movers, netImage);
  // every image this part still draws (the joined one, the nets', the unpainted stretch's) takes the level's
  // depth by the pixel's place as it is drawn (levelAim: one hook and one vector for them all)
  const aim = levelAim(mat.uniforms.uLevel);
  object.traverse((n) => { if (n.isMesh && !Array.isArray(n.material) && n.material.defines && n.material.defines.MIRROR) n.onBeforeRender = aim; });
  await ctx.yield();
  const size = new THREE.Vector2();
  const api = { object, movers, statics, material: mat, skin, sites: cr.sites, stages: cr.stages, scaffolds: wsc.sites, shadowWall: { from: sWhole, to: sEnd, lo: SW.lo, hi: SW.hi, top: SW.top }, turret: moon.head, pontoon: moon.place, scaffold: scaf,
    triangles: sentTriangles(object),                    // (what the frame is sent, every draw counted: the strips twice, the kept skins not)
    moonAt: moon.globeAt,
    dice: { mast: scaf.dice, stages: [nsd, stg.diceRead], scaffolds: [scaffoldDice(), wsc.diceRead] },      // each: [drawn, read]: every die drawn is read (the proof counts)
    update(dt, time, camera) {
      for (const m of movers) m.at(time);
      moon.light(time);
      for (const e of extras) e.update(dt, time, camera);
      joined.pose();                                     // (the joined draw's slots take the movers' poses)
      mat.uniforms.uClock.value = time;
      if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); mat.uniforms.uPix.value = 2 / Math.max(size.y, 1); }
    },
    dispose() { object.traverse((n) => { if (n.geometry) n.geometry.dispose(); }); joined.dispose(); mat.dispose(); mat.userData.thin.dispose(); image.dispose(); net.dispose(); netImage.dispose(); skin.material.dispose(); skin.imageMaterial.dispose(); shade.material.dispose(); for (const e of extras) if (e.dispose) e.dispose(); },
  };
  api.update(0, 0, null);
  return api;
}
