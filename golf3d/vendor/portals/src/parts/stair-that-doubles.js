// THE STAIR THAT DOUBLES: the whole world's stair (0.1 m to 1,638 m), the eleven things of lit paper on its treads,
// the half built step with its crane, the two dotted frames, and the style kit the rest of the world is made from.
//
// AXES. Everything inside is built in the BRIEF's axes (x along the stair from its foot, y up, z across; the first riser at
// x 0, the ground at y 0). The part's contract wants the front toward +Z, so hero.object holds one inner group turned a quarter:
//   local X = brief z,  local Y = brief y,  local Z = minus brief x   (the stair climbs toward local -Z).
// A world that wants the brief's axes as its own sets hero.object.rotation.y = -Math.PI / 2. anchors are given in LOCAL axes
// (anchors.flyThroughBrief and everything under anchors.things are in BRIEF axes, and say so).
//
// EXPORTS. The law: R0, rise(k), riserX(k), treadTop(k), halfWidth(k), thingX(k), numberOf(k), numberSeat(k), numberBox(k), SIGHT, sightShare(k, eye); flownLine() (the
// flown line, brief axes: makePath(flownLine())), flownMarks() (its named places), VIADUCT (the viaduct's figures the line is drawn by), TRAIN (the train's and its pool's figures), NAVE_Y, ROSE_X, DOOR_X; beatAt(k, time), beatAmp(k), breathAt(k, time), BEAT_STEP,
// BEAT_CYCLE; GLSL_COMMON (uTime, beatOf, beatAmp, breathOf for the world's own shaders); poolAt(x, y, z, foot, reach) and POOL[k] = { foot, reach } (the pool of light, the same sum the stone shader does);
// CATH, ROOM, TOWN, CRANE (the figures of the big things); treeLines(h, w, round) (the stair's own tree); shown(hex) (the linear colour the ordinary pipeline SHOWS as that hex);
// FR (plane frames); makeStyle(ctx, opts); buildHero(ctx, opts).
//
// buildHero(ctx, opts) -> { object, radius 2300, height 1638.3, center, anchors, style, triangles, calls, update(dt, time, camera),
//   dispose(), ground: false }. opts: style (the world's one makeStyle instance), palette (the brief's seven hex strings),
//   detail (0.6 .. 1: thins the town's house fronts only), paper (a hex, to fix the paper's white), moonSide (+1 or -1), gains.
//   anchors: portalSeat { position, facing, radius 7 } (the rose's middle, x 380, y 128: its paper stands 7.0 m from the line, at the ring's own rim);
//   flyThrough (the flown line, local), flyThroughBrief; viewpoints { entry, foot, reveal, westDoor }; things[name] = { k, at, box
//   { min, max } padded for every attitude (rocking, sails, jib, smoke, birds), clearBelowLine (the straight rise up the stair's
//   middle, which the flown line keeps to the ship's mastheads, over the thing's middle, less its box's top), and the thing's own figures }.
//   By seed: the paper's white (#F4EFE2 or the cooler #EEF1F4), the moon's side, the ship's sail set, the town (its houses'
//   breadths, kinds and heights, which windows are lit), the birds' rings and beats, the nave's lanterns' bearings and phases, the heights of the scaffold's pole tops,
//   and the swell and overshoot of every ink line.
// TIME. update() reads time only (dt is ignored): the same time and the same eye give the same picture. Nothing goes by route metres. THE BEAT and
//   the breathing are in the shaders (uTime). Nothing is made in update. No lights. Cost: about 94,000 triangles, 31 draw calls
//   (stone 1, gold numbers and dotted frames 1, one card for each thing, three more for the nave's room (its stone, its glass, its
//   lanterns), one for the balustrade, twelve flocks of fifteen birds); the build yields between things.
// THE EYE. Besides the kit's footprint filters (ink's breadth in pixels, the joints, the lamps' least size), ONE THING READS THE EYE'S PLACE: THE
//   LAW OF SIGHT (SIGHT). A cut number is gilt only while the whole of it, with its cut's dark edge, stands in sight of the eye over the nearer
//   steps and the viaduct; while a nearer step would cut it, it is not drawn at all; between, over a band of clear over the step's top of a
//   sixteenth of the number's own height (0.625 m for the three greatest, less for each lesser one: SIGHT tells every figure), it comes whole out
//   of the stone. The viaduct is counted for 512, 1024 and 2048 as a plain box a metre larger than its own figures every way, with a band of 2 m
//   of clear past its edge. The gold's vertex shader works it from the eye's place alone, for whatever eye draws the picture; sightShare(k, eye)
//   is the same sum. Only the nearer steps and the viaduct are counted, and nothing of the stair is moved by it; the numbers keep their seat and
//   their cap.
//
// makeStyle(ctx, opts) -> the style kit, FIVE STUFFS AND NO OTHERS:
//   palette  linear colours to write as they are (the brief's hexes, shown as written under post.flat 1; with opts.filmic, the
//            same hexes corrected for the tone map): night, indigo, stone, stoneLit, ink, paper, hot (the whiter white of
//            openings), gold, vermilion, tissueVermilion, tissueBlue.
//   stone    the one stone ShaderMaterial: flat blue grey, ink joints by the face's own place (courses a twelfth of its step's
//            rise, dissolved under two pixels; the top course of the wall under the balustrade one long stone, COPING), the pool of light (and the train's own, on the stone the viaduct lights), a moon rim on top edges. Geometry by stoneFace() / stoneMesh().
//   room     the same stone program with ROOM defined, for the stone inside the cathedral (see ROOM and naveRoom): the bare stone under no
//            lamp and no moon, a tone by the way a face looks, its joints by the piece's own two measures (each family of joints dissolved by
//            its own breadth in the picture), and the windows' light laid on the floor and the piers' sides by place. Geometry by roomPiece().
//   paper(motions)  the one program for LIT PAPER, INK, GOLD, VERMILION and TISSUE (unlit; transparent only so that thin ink can
//            pale instead of thinning). Use it through card(k, y0, y1, inkWidth): sheet / rect / box (flat sheets, holes cut
//            through, edge: ink the outline, holeEdge: a hole's own edge breadth), ink / line (brush strokes as ribbons: they
//            swell, thin and pool at the end, never under 1.6 pixels, never over 5; a card's fine: FINE INK, its true breadth,
//            a pixel at the least; taper: a blade of grass), joint (JOINT INK between paper blocks: pale, of its true breadth, a pixel at the least, paler under 0.7 of a pixel and gone under 0.35), motion({ kind 1 rock | 2 turn | 3 rise, drift and dwindle | 4 slide |
//            5 window | 6 tissue's shimmer, pane by pane | 7 run one way and come round, cut at its ends (the train, the
//            world's clouds), ... }) and flut (a sheet's bow: sails, wings, smoke, pennons), lamp (a disc of light never under
//            1.7 pixels in radius: the dotted frames), then mesh() (every mesh is named). Layers: 0 paper (hotter low down),
//            1 patch (vermilion, tissue, hot openings, ink shapes), 2 ink, 3 light (gold, lamps: never paled), 4 lamp disc;
//            patches, ink and gold lie over their sheet by a fixed step of the depth buffer a layer. Every paper vertex
//            carries its step k, so it breathes (3 in 100, 4 to 7 s) and takes THE BEAT (one step every 0.5 s, 2 s rest); a
//            card's row delays the beat along its length (the nave: bay by bay, its east wall last), and motion 6 may carry
//            it along a row too. THE BEAT'S SWELL GOES BY SIZE, one law for every thing: a quarter on the candle, halved for
//            every 3.2 doublings (beatAmp(k): 3.6 in 100 on the cathedral), so a thing that stands all round the eye never
//            pulses the picture; the gold (cut numbers, dotted lights) carries the beat whole.
//   masonry() draws the courses of the cathedral's paper walls in ink; treeLines() is the stair's own tree.
//   sky(moonDir)  the night dome's material (two flat blues, about 1,500 pin prick stars going in and out, a paper moon drawn on in
//            ink): put it on a unit sphere, scale it under the far plane, keep it on the eye, renderOrder low.
//   uniforms { uTime, uViewH, uGain, uStoneGain, uMoonSide } and update(dt, time, camera), which drives them (call it once a frame;
//            hero.update calls it too).
// ASSUMED OF POST: post.flat 1, exposure 1, saturation 1, contrast 1, bloom strength 0 and a bloom threshold far above 1: the
//   colour written is the colour shown and nothing glows. At rest nothing is written above 1.33 (the dotted lights' gold); with
//   shimmer, breath and beat at their tops together nothing is written above 1.52 (the nave's vermilion tissue).
//   THE BEAT shows as each thing's paper whitening a little in turn, its gold paling toward its own light, and its pool on the
//   stone. makeStyle(ctx, { filmic: 1 }) writes the same hexes corrected for the engine's tone map instead, for a world that
//   keeps the filmic curve.
import * as THREE from 'three';

// ------------------------------------------------------------------ the law (brief axes: x along the stair, y up, z across)
export const R0 = 0.1, KBUILT = 10, KHALF = 11, KLAST = 13;
export const rise = (k) => R0 * 2 ** k;                        // step k's rise
export const riserX = (k) => 0.5 * (2 ** k - 1);               // where its riser stands
export const treadTop = (k) => R0 * (2 ** (k + 1) - 1);        // its tread's top (treadTop(-1) = 0, the ground)
export const halfWidth = (k) => 3 * rise(k);                   // the tread runs z -3r .. 3r
export const thingX = (k) => riserX(k) + 2.75 * rise(k);       // the middle of the thing on tread k
export const numberOf = (k) => 2 ** k;                         // the number cut in riser k
// THE FLOWN LINE (brief axes). To the ship it is the brief's: a level run in, then one straight line y = 2.4 + 0.56 (x + 1) up the
// stair's middle (as flown it dips to 2.33 m at x -2). FROM THE SHIP'S MASTHEADS it goes LOW: it levels off LOW m over tread
// 8's paving within FLAT m, and eases to the left of the stair's middle by half the viaduct's own pitch, to the middle of the
// arch that stands next left of the middle pier; it is on that arch's line BEFORE m short of the viaduct's near face and flies
// straight in z THROUGH THE ARCH, under the deck, to the far face. From that same place BEFORE m short of the near face it
// begins to rise, one curve (it goes through the arch 6 to 10 m over the paving), to pass OVER m over the top edge of riser
// 9's wall (rising SLOPE in 1 there), and on, a second curve, over the forecourt to the nave's height; from the viaduct's far
// face it bears back to the stair's middle; it is level, straight and on the middle LAST m before the west door. From the
// door to the rose it is level at the nave's height.
export const NAVE_Y = treadTop(9) + 25.7, ROSE_X = 380, DOOR_X = 300;
// the cathedral's own figures (brief axes; v is height above tread 9)
export const CATH = { x0: DOOR_X, x1: ROSE_X, floor: treadTop(9), naveHalf: 11, aisleZ: 26, arcadeTop: 52, archApex: 32, archSpring: 24, aisleTop: 20, door: { half: 8, spring: 20, apex: 34 }, towerZ: 22, towerHalf: 7, towerTop: 95, crossingX: 340, roseV: NAVE_Y - treadTop(9), roseClear: 7 / Math.cos(Math.PI / 48) + 0.02, bay: 8.25, firstPier: 314 };
// THE NAVE'S ROOM: inside the cathedral's paper stands a room of the stair's own stone (the room's make and the stone's shader read the
// same figures). wall: under the clerestory the stone stands this far inside the nave wall's paper and as far outside it, into the aisle (the
// arcade is twice this thick); upper: the clerestory's stone stands this far inside the paper; aisle: and the aisle wall's this far inside its
// paper; course: its courses, a fortieth of step 9's rise, twice the viaduct's block; paving: the floor's course (slabs two courses by three,
// as every tread: rows 2.88 m deep). glass: EACH WINDOW LAYS ITS OWN OUTLINE ON THE
// FLOOR BEFORE IT, by place only: the outline laid flat, its foot `out` m from its own wall's face and its head toward the nave's middle,
// its upright part at `size` of its length and its pointed head whole, as tall as the window's own (its breadth whole), its edge soft over `soft` m; an aisle window's on the aisle's floor, a clerestory window's on
// the nave's. wash: an aisle window's colour also lies on the two faces of the arch before it that look along the nave (the piers' sides), a
// band between the heights lo and hi, soft over `edge` m either end, strongest (`most`) at the pier's aisle edge and less to its nave edge.
export const ROOM = { wall: 0.8, upper: 0.2, aisle: 0.65, course: rise(9) / 40, paving: 0.96,
  glass: { soft: 0.45, most: 0.85, aisle: { half: 2.9, foot: 4.5, spring: 13.5, apex: 18, out: 1.0, size: 0.75 }, clere: { half: 2.5, foot: CATH.archApex + 3.2, spring: CATH.arcadeTop - 5.6, apex: CATH.arcadeTop - 1.4, out: 1.2, size: 0.41 }, wash: { lo: 4.5, hi: 18, edge: 3, most: 0.5 } } };
export const VIADUCT = { deck: 35.2, pitch: 100 / 6, half: 4, long: 100 };   // over tread 8: the deck; along z: one arch and its pier (the middle pier stands on z 0); along x: its two faces stand this far either side of its middle; its length
// THE TRAIN on the viaduct's deck (the viaduct's make and the stone's shader read the same figures): n cars of car m with gap m between; it runs one way
// and comes round, one round every period s, out of one gatehouse's mouth (mouth m from the viaduct's middle) and into the other's. IT IS A LIT
// THING AND LAYS ITS POOL OF LIGHT ON THE STONE like the others, by the distance from the train's place only, and the pool goes with it: its
// place is the line of its lit windows (light m over its floor) for as much of its length as is out of the gatehouses; a metre along the stair
// counts `across` of a metre (its windows look out to either side, onto the paving before it and the wall behind it), an upright metre 0.8 as in
// every pool; ITS REACH IS ITS OWN LENGTH (reach), and it falls on the stone the viaduct itself lights: tread 8's paving and the wall of riser 9.
export const TRAIN = (() => { const car = 5.0, gap = 0.6, n = 8, len = n * car + (n - 1) * gap, mouth = 51.4; return { car, gap, n, len, mouth, amp: mouth + len / 2 + 1, period: 14, phase: 0.18, floor: VIADUCT.deck + 0.15, light: 1.9, reach: len, across: 0.35 }; })();
// THE LAW OF SIGHT: A NUMBER IS GILT ONLY WHILE THE WHOLE OF IT STANDS IN SIGHT OF THE EYE OVER THE NEARER STEPS AND THE VIADUCT. It reads the eye's place and
// nothing else (not where the eye looks, not the picture's edges, no clock, no memory, no lens, no seed): the gold's vertex shader works it for
// whatever eye draws the picture, and sightShare(k, eye) is the same sum in plain figures. For number k: its box is its digits with the cut's dark
// edge (numberBox); two sight lines run from the eye to the box's two lower corners. Every nearer step j < k is a box (from riserX(j) on, across to
// halfWidth(j) both ways, up to treadTop(j)); a line that has left a step's breadth before it reaches that step's riser passes beside it. THE CLEAR
// is the least height, in metres, by which the two lines pass over the top of every such step along the stretch where they are over it (the least
// is at an end of that stretch: as a rule over the front edge of the step's tread, or over its side). Clear at or under 0: the number is not drawn at all,
// and its riser is plain stone there. From 0 up to THE BAND it comes whole, its gold and its dark edge by the same share, out of the stone behind
// it; over the band it stands as it is cut. THE BAND is `band` of the number's own height, a sixteenth: 1.75 mm of clear for 1, 3.5 mm for 2, 7 mm
// for 4, 14 mm for 8, 28 mm for 16, 56 mm for 32, 0.112 m for 64, 0.224 m for 128, 0.448 m for 256, and 0.625 m for 512, 1024 and 2048 (the three
// the cap holds to one height). No step, riser or thing is moved or hidden by this law; only the number's gold and its dark edge come and go.
// WITH THE NEARER STEPS ONE BODY MORE IS COUNTED, THE VIADUCT, for the three numbers that stand behind it (512, 1024, 2048): a plain box by its own
// figures and `pad` m more every way (not under its tread): along the stair its middle, thingX(8), and its half breadth either side (192.9 to 202.9
// m); up from its tread to its gatehouses' ridges, `roof` m over the deck (51.1 to 101.9 m); across to its gatehouses' ends at `gate` m either side
// (-57 to +57 m). Seen from the eye, a number's whole box is a rectangle on every upright plane across the stair; between the box's near face and
// its far face that rectangle must lie wholly beside the box (to either hand), over it or under it: THE CLEAR PAST THE BOX is the greatest of those
// four, each the least over the two faces (with the eye between the faces: over the eye's own place and the far face), in metres at the box;
// with the eye past the far face it is the eye's own distance past it. At or under 0 (some part of the number would be hidden by the box): not
// drawn at all. From 0 up to `past` m (THE BOX'S BAND: 2 m of clear past its edge, a
// broader band than the steps', for the box's end crosses a far number sideways and fast) it comes whole; the share drawn is the lesser of the
// two. No other thing is counted: a thing that stands before a number hides it as it hides the stone it is cut in.
export const SIGHT = { band: 1 / 16, pad: 1, gate: 56, roof: 14.6, past: 2 };
const SIGHT_BOX = { x0: thingX(8) - VIADUCT.half - SIGHT.pad, x1: thingX(8) + VIADUCT.half + SIGHT.pad, y0: treadTop(8), y1: treadTop(8) + VIADUCT.deck + SIGHT.roof + SIGHT.pad, z0: -SIGHT.gate - SIGHT.pad, z1: SIGHT.gate + SIGHT.pad };
// THE COPING. The wall of step `k` (the riser numbered 512, on whose crest the balustrade stands) has for its top course ONE LONG STONE: the last
// of its courses of a twelfth of its rise (4.27 m: from 98.13 m up to the crest at 102.3 m) carries no upright joint and one shade from end to
// end; its bed joint is drawn as every course's. BY PLACE, this one course of this one wall, the same from wherever it is seen: the stone's
// law is otherwise one for every face of the stair (STONE_FRAG works it from the face, the step and the course alone).
export const COPING = { k: 9 };
// metres over tread 8's paving on the low run, and the metres from the mastheads within which the line comes down to it; the straight before the viaduct's near
// face; the height over riser 9's top edge and the line's rise there; the straight before the door
const BEND = { low: 4, flat: 30, before: 12, over: 4.5, slope: 0.9, last: 7 };
function lineParts() {
  const m = 0.56, p = [[-40, 6, 0], [-32, 5.8, 0], [-24, 4.2, 0], [-16, 2.6, 0], [-10, 2.4, 0], [-4, 2.4, 0], [-1, 2.45, 0]];
  const SX = thingX(7), VX = thingX(8), V = VIADUCT, Q = BEND, yS = m * (SX + 1) + 2.4;
  for (let X = 2.2; X - 1 < SX - 3; X *= 1.45) p.push([X - 1, m * X + 2.4, 0]);
  const ss = (a0, b0, v) => { const t = Math.min(1, Math.max(0, (v - a0) / (b0 - a0))); return t * t * (3 - 2 * t); };
  // a curve from (xa, ya) rising sa in 1 to (xb, yb) rising sb in 1
  const curve = (xa, ya, sa, xb, yb, sb, x) => { const h = xb - xa, t = (x - xa) / h; return ya * (2 * t * t * t - 3 * t * t + 1) + sa * h * (t * t * t - 2 * t * t + t) + yb * (3 * t * t - 2 * t * t * t) + sb * h * (t * t * t - t * t); };
  const zA = -V.pitch / 2, x0 = SX + Q.flat, x1 = VX - V.half - Q.before, x2 = VX + V.half, xW = riserX(9), xe = DOOR_X - Q.last, yLow = treadTop(8) + Q.low, yW = treadTop(9) + Q.over;
  const zAt = (x) => x <= x1 ? zA * ss(SX, x1, x) : x <= x2 ? zA : zA * (1 - ss(x2, xe, x));
  const yAt = (x) => x <= x0 ? curve(SX, yS, m, x0, yLow, 0, x) : x <= x1 ? yLow : x <= xW ? curve(x1, yLow, 0, xW, yW, Q.slope, x) : x <= xe ? curve(xW, yW, Q.slope, xe, NAVE_Y, 0, x) : NAVE_Y;
  // the points: each named place, and between two of them points no farther apart than 7 m of x
  const at = { ship: SX, low: x0, before: x1, arch: VX, wall: xW, straight: xe, door: DOOR_X }, named = {}, ks = Object.keys(at);
  for (let i = 0; i < ks.length; i++) {
    const xa = at[ks[i]]; named[ks[i]] = [xa, yAt(xa), zAt(xa)];
    if (i + 1 === ks.length) { p.push(named[ks[i]]); break; }
    const xb = at[ks[i + 1]], n = Math.max(1, Math.ceil((xb - xa) / 7)); for (let j = 0; j < n; j++) { const x = xa + (xb - xa) * j / n; p.push([x, yAt(x), zAt(x)]); }
  }
  p.push([(DOOR_X + ROSE_X) / 2, NAVE_Y, 0], [ROSE_X, NAVE_Y, 0]);
  return { points: p, marks: named };
}
export function flownLine() { return lineParts().points; }
export function flownMarks() { return lineParts().marks; }     // named places on the line: ship, low, before, arch, wall, straight, door
// THE BEAT: a swell that climbs one step every 0.5 s from the candle (k 0) to the last dotted frame (k 13), rests 2 s, begins again
export const BEAT_STEP = 0.5, BEAT_CYCLE = (KLAST + 1) * BEAT_STEP + 2;
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export function beatAt(k, time) { const tb = ((time % BEAT_CYCLE) + BEAT_CYCLE) % BEAT_CYCLE - k * BEAT_STEP; return sstep(0, 0.15, tb) * (1 - sstep(0.15, 0.5, tb)); }
export function breathAt(k, time) { return 1 + 0.03 * Math.sin(time * 6.2832 / (4 + 3 * ((k * 0.618) % 1)) + k * 2.4); }
// the pool of light a thing lays on stone: 0 (bare stone #5E6C96) .. 1 (lit stone #AEB9D6), by distance from the thing's place only.
// c = [x, y, z] the thing's foot, s = the pool's reach in metres (POOL[k]); it rests at 0.7 of s and swells to s on the beat
// (give time and k as the sixth and seventh arguments for the moving pool; without them, the pool at rest)
export function poolAt(x, y, z, c, s, time, k = 0) { const sw = time === undefined ? 0.7 : 0.7 + 10 * (breathAt(k, time) - 1) + 0.3 * beatAt(k, time) * 4 * beatAmp(k), d = Math.hypot(x - c[0], (y - c[1]) * 0.8, z - c[2]) / (s * sw); const f = Math.max(0, 1 - d); return f * f * (3 - 2 * f); }

// THE BEAT'S SWELL BY SIZE (one law for every thing): a quarter on the candle, falling by half for every 3.2 doublings of
// the thing (a tenth on the clock, a few parts in a hundred on the cathedral and the town), so a thing that stands all round
// the eye never pulses the picture; the gold (the cut numbers, the dotted lights) carries the beat whole up the stair.
export const beatAmp = (k) => 0.25 * 2 ** (-k / 3.2);
export const GLSL_COMMON = /* glsl */`
uniform float uTime;
float beatAmp(float k) { return .25 * exp2(-k / 3.2); }
float beatOf(float k) { float tb = mod(uTime, ${BEAT_CYCLE.toFixed(1)}) - k * ${BEAT_STEP.toFixed(1)}; return smoothstep(0., .15, tb) * (1. - smoothstep(.15, .5, tb)); }
float breathOf(float k) { return 1. + .03 * sin(uTime * 6.2832 / (4. + 3. * fract(k * .618)) + k * 2.4); }
`;
const NM = 16;   // motions a paper mesh can carry
// PAPER, INK, GOLD, VERMILION, TISSUE: one unlit program. Per vertex: aCol (linear colour), aFx (layer, step k, height 0 low .. 1 high,
// flutter amount in metres), aSide (ink ribbon: side direction times half width; w = motion number, 0 none).
const PAPER_VERT = /* glsl */`
attribute vec3 aCol; attribute vec4 aFx; attribute vec4 aSide;
uniform float uViewH, uGain; uniform vec4 uMA[${NM}], uMB[${NM}], uMC[${NM}], uMD[${NM}];
varying vec4 vCol;
${GLSL_COMMON}
vec3 rotAbout(vec3 p, vec3 ax, float a) { float c = cos(a), s = sin(a); return p * c + cross(ax, p) * s + ax * dot(ax, p) * (1. - c); }
#ifdef SIGHT
// THE LAW OF SIGHT (SIGHT), on the gold's card only. For each number: uSightA (its riser's x, its box's foot, its left end, its right end) and
// uSightBand (its band, in metres of clear over a step's top), uSightTop (its box's top, for the viaduct's box).
uniform vec4 uSightA[12]; uniform float uSightBand[12], uSightTop[12];
// the least height by which the sight line from the eye e to the foot corner c of number k passes over the tops of the steps under it
float sightOver(vec3 e, vec3 c, float k) {
  float D = c.x - e.x, dz = c.z - e.z, lo = 1e9, p = 1.; if (abs(dz) < 1e-6) dz = 1e-6;
  for (int j = 0; j < 11; j++) {
    float T = ${R0.toFixed(4)} * (2. * p - 1.), hw = ${(3 * R0).toFixed(4)} * p, a = (-hw - e.z) / dz, b = (hw - e.z) / dz;
    float ta = max(max(min(a, b), (.5 * (p - 1.) - e.x) / D), 0.), tb = min(max(a, b), 1.);          // where the line is over this step: from its riser, or its side, on
    float g = min(e.y + (c.y - e.y) * ta, e.y + (c.y - e.y) * tb) - T;                               // its least height over the step's top there
    if (float(j) < k - .5 && ta < tb) lo = min(lo, g);
    p *= 2.;
  }
  return lo;
}
// by how many metres the sight lines from the eye e to the whole box of a number (A, and its top) pass clear of the viaduct's box, at the box
float sightPast(vec3 e, vec4 A, float top) {
  if (e.x >= ${SIGHT_BOX.x1.toFixed(3)}) return e.x - ${SIGHT_BOX.x1.toFixed(3)};                                                                  // the eye past its far face
  float D = A.x - e.x, ta = max(${SIGHT_BOX.x0.toFixed(3)} - e.x, 0.) / D, tb = (${SIGHT_BOX.x1.toFixed(3)} - e.x) / D;                             // the box's near face (or the eye, inside) and far face
  float hi = min(e.z + (A.z - e.z) * ta, e.z + (A.z - e.z) * tb) - ${SIGHT_BOX.z1.toFixed(3)}, lo = ${SIGHT_BOX.z0.toFixed(3)} - max(e.z + (A.w - e.z) * ta, e.z + (A.w - e.z) * tb);   // beside it, to either hand
  float ov = min(e.y + (A.y - e.y) * ta, e.y + (A.y - e.y) * tb) - ${SIGHT_BOX.y1.toFixed(3)}, un = ${SIGHT_BOX.y0.toFixed(3)} - max(e.y + (top - e.y) * ta, e.y + (top - e.y) * tb);   // over it, under it
  return max(max(hi, lo), max(ov, un));
}
#endif
void main() {
  vec3 p = position, side = aSide.xyz; float lit = 1.; int mi = int(aSide.w + .5);
  if (mi > 0) {
    vec4 A = uMA[mi - 1], B = uMB[mi - 1], C = uMC[mi - 1], D = uMD[mi - 1]; int kind = int(A.w + .5);
    if (kind < 5) p += D.xyz * (aFx.w * (D.w + sin(uTime * C.z + C.w)));                       // the sheet bows: sails fill, wings beat, smoke curls
    if (kind == 1) { float a = B.w * sin(uTime * C.x + C.y); p = A.xyz + rotAbout(p - A.xyz, B.xyz, a); side = rotAbout(side, B.xyz, a); }      // rock
    else if (kind == 2) { float a = uTime * C.x + C.y; p = A.xyz + rotAbout(p - A.xyz, B.xyz, a); side = rotAbout(side, B.xyz, a); }       // turn
    else if (kind == 3) { float ph = fract(uTime * C.x + C.y), s = smoothstep(0., .15, ph) * (1. - ph); p = A.xyz + (p - A.xyz) * s + B.w * vec3(B.x * ph * ph, B.y * smoothstep(0., .3, ph), B.z * ph * ph); side *= s; }   // smoke: it leaves, rises the axis's upright share in the first 0.3 of its round, then drifts its level share, dwindling to nothing, and begins again
    else if (kind == 4) { p += B.xyz * (B.w * sin(uTime * C.x + C.y)); }                           // slide to and fro
    else if (kind == 7) {                                                                          // run one way and come round: along B from -amp to amp about A, then again;
      p += D.xyz * (aFx.w * sin(uTime * C.z + C.w));                                               // what stands beyond D.w either way is cut off there (it has gone behind a wall's end)
      float s0 = dot(p - A.xyz, B.xyz), s1 = s0 + B.w * (2. * fract(uTime * C.x + C.y) - 1.), sc = clamp(s1, -D.w, D.w);
      p += B.xyz * (sc - s0); side *= step(abs(s1), D.w);
    }
    else if (kind == 6) { lit = 1. + B.w * (sin(uTime * C.x + aFx.w * 6.2832) + .45 * sin(uTime * C.x * 1.83 + aFx.w * 17.)); }   // tissue: its light shimmers, each pane its own phase
    if (kind == 6) lit += D.w * beatOf(D.x + D.y * dot(position - A.xyz, B.xyz));       // THE BEAT passing along a row (a nave): D.y steps to a metre from A along B
    else if (kind == 5) { float ph = fract(uTime * C.x + aFx.w); lit = mix(B.w, 1., smoothstep(.0, .04, ph) * (1. - smoothstep(C.y, C.y + .04, ph))); }   // a window, a running light
  }
  float layer = aFx.x; vec3 col = aCol;
  float fk = fract(aFx.y + .01), kk = floor(aFx.y + .01), full = step(.2, fk) * (1. - step(.3, fk)), row = step(.39, fk) * (fk - .4) * 10.;   // the step; gold carries the beat whole; a row's place delays it
  if (layer < 1.5 || layer > 2.5) col *= lit * uGain * breathOf(kk) * (1. + mix(beatAmp(kk), .25, full) * beatOf(kk + row)) * (layer < .5 ? 1.1 - .2 * aFx.z : 1.);
  if (full > .5) col = mix(col, vec3(1., .95, .7), .8 * beatOf(kk));                                  // on the beat the gold pales toward its own light
  vec4 mv = modelViewMatrix * vec4(p, 1.); float alpha = 1.;
  float hw = length(side);
  if (hw > 0.) {                                                                                   // an ink ribbon: never under 1.6 pixels (paler when it would be), never over 5
    float px = 2. * length(mv.xyz) / max(projectionMatrix[1][1] * uViewH, 1.);                   // metres to a pixel here
    float want = layer > 3.5 ? max(hw, 1.7 * px) : clamp(hw, .8 * px, max(2.5 * px, 1e-6)); alpha = layer > 2.5 ? 1. : clamp(hw / max(.8 * px, 1e-6), .4, 1.);
    if (abs(layer - 2.25) < .1) { want = max(hw, .5 * px); alpha = clamp(hw / max(.5 * px, 1e-6), .3, 1.); }   // FINE INK (inside the cathedral): its true breadth, a pixel at the least and paler then
    if (abs(layer - 1.9) < .04) { want = max(hw, .5 * px); alpha = smoothstep(.35, .7, hw / max(.5 * px, 1e-6)); if (alpha < .004) want = 0.; }   // JOINT INK (the joints of paper blocks): its true breadth, a pixel at the least; paler as it falls under 0.7 of a pixel, and gone (no breadth at all) under 0.35
    mv = modelViewMatrix * vec4(p + side * (want / hw), 1.);
  }
#ifdef SIGHT
  float seen = 1.;
  if (full > .5 && kk < 11.5) {                                                                    // a cut number: THE LAW OF SIGHT, by the eye's place in the stair's own axes
    int ki = int(kk + .5); vec4 A = uSightA[ki];
    vec3 e = -(modelViewMatrix[3].xyz * mat3(modelViewMatrix)) / dot(modelViewMatrix[0].xyz, modelViewMatrix[0].xyz);
    if (A.x - e.x > 1e-3) seen = smoothstep(0., uSightBand[ki], min(sightOver(e, vec3(A.x, A.y, A.z), kk), sightOver(e, vec3(A.x, A.y, A.w), kk)));
    if (kk > 8.5 && A.x - e.x > 1e-3) seen = min(seen, smoothstep(0., ${SIGHT.past.toFixed(3)}, sightPast(e, A, uSightTop[ki])));   // 512, 1024, 2048: the viaduct
    alpha *= seen;                                                                                 // the gold and its dark edge by the same share, over the stone behind
  }
#endif
  vCol = vec4(col, alpha);
  gl_Position = projectionMatrix * mv;
  gl_Position.z -= 2.5e-6 * min(layer, 3.) * gl_Position.w;                                        // patches, ink and gold lie over their sheet: one fixed step of the depth buffer a layer (as a polygon offset is), the same at every distance; nothing moves in the picture
#ifdef SIGHT
  if (seen <= 0.) gl_Position = vec4(2., 2., 2., 1.);                                              // not in sight whole: not drawn at all
#endif
}`;
const PAPER_FRAG = /* glsl */`
varying vec4 vCol;
void main() { gl_FragColor = vCol; }`;
// STONE: flat blue grey, ink joints by the face's own place in courses of a twelfth of its step's rise (so every step is drawn
// alike; ONE COURSE BY PLACE: the wall's coping, COPING, no upright joint and one shade), the pool of light of the thing that stands on it (and, on the tread and the wall the viaduct lights, the train's pool, added to it), a thin moon rim on top edges. Per vertex: aSt (course size in metres,
// k of the thing that lights it, face 0 riser / 1 tread / 2 flank, depth under the face's top edge in courses), aPool (thing's foot, reach).
const STONE_VERT = /* glsl */`
attribute vec4 aSt; attribute vec4 aPool;
varying vec3 vP; varying vec4 vSt; varying vec4 vPool;
void main() { vP = position; vSt = aSt; vPool = aPool; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`;
const STONE_FRAG = /* glsl */`
uniform vec3 uStone, uStoneLit, uInk, uRim; uniform float uMoonSide, uStoneGain;
varying vec3 vP; varying vec4 vSt; varying vec4 vPool;
${GLSL_COMMON}
float h1(float n) { return fract(sin(n * 127.1 + 3.7) * 43758.5453); }
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// the train's pool of light at a place P (TRAIN): where its middle is now, what of its length is out of the gatehouses, the pool's soft law
float trainPool(vec3 P) {
  float zc = ${TRAIN.amp.toFixed(2)} * (2. * fract(uTime * ${(1 / TRAIN.period).toFixed(6)} + ${TRAIN.phase.toFixed(3)}) - 1.);
  float z0 = max(zc - ${(TRAIN.len / 2).toFixed(2)}, -${TRAIN.mouth.toFixed(2)}), z1 = max(min(zc + ${(TRAIN.len / 2).toFixed(2)}, ${TRAIN.mouth.toFixed(2)}), z0), shown = clamp((z1 - z0) / ${TRAIN.car.toFixed(2)}, 0., 1.);
  vec3 d = vec3((P.x - ${thingX(8).toFixed(3)}) * ${TRAIN.across.toFixed(3)}, (P.y - ${(treadTop(8) + TRAIN.floor + TRAIN.light).toFixed(3)}) * .8, P.z - clamp(P.z, z0, z1));
  float f = max(0., 1. - length(d) / ${TRAIN.reach.toFixed(2)}); return f * f * (3. - 2. * f) * shown;
}
#ifdef ROOM
uniform vec3 uGlassA, uGlassB;
// THE ROOM'S GLASS (ROOM.glass). Inside a lancet laid flat: p = (across from its middle, along from its foot), its half breadth, its springing
// and its apex along; 1 inside, 0 outside, soft over e m and never more (its head: two arcs of twice the half breadth about the far springing
// points, squeezed along)
float lancetIn(vec2 p, float hb, float sp, float ap, float e) {
  float k = 2. * hb * .8660254 / (ap - sp);
  float d = p.y < sp ? min(hb - abs(p.x), p.y) : 2. * hb - length(vec2(abs(p.x) + hb, (p.y - sp) * k));
  return smoothstep(0., e, d);
}
// the windows' light at a place P of the room's stone: on the floor (kind 1) the outlines of the bay's aisle window and clerestory window (and
// of the clerestory window between the towers); on a pier's side (kind 2) the wash of the aisle window before it. rgb: whose light (the two
// tissues by turns, as the windows are), a: how much.
vec4 glassAt(vec3 P, float kind) {
  float az = abs(P.z), s = step(0., P.z), bu = (P.x - ${CATH.firstPier.toFixed(3)}) / ${CATH.bay.toFixed(3)}, i = floor(bu), dx = (fract(bu) - .5) * ${CATH.bay.toFixed(3)}, inb = step(-.5, i) * step(i, 7.5), amt = 0., par = 0.;
  if (kind > .5 && kind < 1.5) {
    float a1 = inb * lancetIn(vec2(dx, ${(CATH.aisleZ - ROOM.aisle).toFixed(3)} - az - ${ROOM.glass.aisle.out.toFixed(3)}), ${ROOM.glass.aisle.half.toFixed(3)}, ${((ROOM.glass.aisle.spring - ROOM.glass.aisle.foot) * ROOM.glass.aisle.size).toFixed(3)}, ${((ROOM.glass.aisle.spring - ROOM.glass.aisle.foot) * ROOM.glass.aisle.size + ROOM.glass.aisle.apex - ROOM.glass.aisle.spring).toFixed(3)}, ${ROOM.glass.soft.toFixed(3)});
    float a2 = inb * lancetIn(vec2(dx, ${(CATH.naveHalf - ROOM.wall).toFixed(3)} - az - ${ROOM.glass.clere.out.toFixed(3)}), ${ROOM.glass.clere.half.toFixed(3)}, ${((ROOM.glass.clere.spring - ROOM.glass.clere.foot) * ROOM.glass.clere.size).toFixed(3)}, ${((ROOM.glass.clere.spring - ROOM.glass.clere.foot) * ROOM.glass.clere.size + ROOM.glass.clere.apex - ROOM.glass.clere.spring).toFixed(3)}, ${ROOM.glass.soft.toFixed(3)});
    float a3 = lancetIn(vec2(P.x - ${(CATH.x0 + 7).toFixed(3)}, ${(CATH.naveHalf - ROOM.wall).toFixed(3)} - az - ${ROOM.glass.clere.out.toFixed(3)}), ${ROOM.glass.clere.half.toFixed(3)}, ${((ROOM.glass.clere.spring - ROOM.glass.clere.foot) * ROOM.glass.clere.size).toFixed(3)}, ${((ROOM.glass.clere.spring - ROOM.glass.clere.foot) * ROOM.glass.clere.size + ROOM.glass.clere.apex - ROOM.glass.clere.spring).toFixed(3)}, ${ROOM.glass.soft.toFixed(3)});
    amt = ${ROOM.glass.most.toFixed(3)} * max(a1, max(a2, a3)); par = a1 > max(a2, a3) ? mod(i + s, 2.) : a2 > a3 ? mod(i + 1. + s, 2.) : s;
  } else if (kind > 1.5 && kind < 2.5) {
    float v = P.y - ${CATH.floor.toFixed(3)};
    amt = ${ROOM.glass.wash.most.toFixed(3)} * inb * smoothstep(${ROOM.glass.wash.lo.toFixed(3)}, ${ROOM.glass.wash.lo.toFixed(3)} + ${ROOM.glass.wash.edge.toFixed(3)}, v) * (1. - smoothstep(${ROOM.glass.wash.hi.toFixed(3)} - ${ROOM.glass.wash.edge.toFixed(3)}, ${ROOM.glass.wash.hi.toFixed(3)}, v)) * mix(.35, 1., smoothstep(${(CATH.naveHalf - ROOM.wall).toFixed(3)}, ${(CATH.naveHalf - ROOM.wall).toFixed(3)} + ${(2 * ROOM.wall).toFixed(3)}, az)); par = mod(i + s, 2.);
  }
  return vec4(mix(uGlassA, uGlassB, par), amt);
}
#endif
void main() {
  float c = max(vSt.x, 1e-4), face = vSt.z;
#ifdef ROOM
  vec2 q = vPool.xy / c;                                                            // the room's faces carry their own two measures (metres along the courses, metres across them)
#else
  vec2 q = (face < .5 ? vP.zy : face < 1.5 ? vP.zx : vP.xy) / c;
#endif
  if (face > .5 && face < 1.5) q *= vec2(.5, .3333);                                // treads are laid in slabs two courses by three
  vec2 fw = fwidth(q); float f = max(max(fw.x, fw.y), 1e-5);
  float row = floor(q.y), fy = fract(q.y), L = 2.2 + 1.2 * h1(row * 1.31);
  float bx = (q.x + 7.3 * h1(row)) / L, col = floor(bx), fx = fract(bx), id = h2(vec2(col, row));
  // the brush: a joint swells and thins along its length, and pools where it ends
  float swell = .55 + .45 * sin(q.x * .83 + row * 2.1) * sin(q.x * .31 + row);
#ifdef ROOM
  // IN THE ROOM each family of joints goes by its own breadth in the picture (a wall seen along its length keeps its courses when its upright
  // joints have closed up): fH a course's, fV an upright joint's; the upright joints go with their courses too; the blocks' own shade dissolves with them
  float fH = max(fw.y, 1e-5), fV = max(fw.x, 1e-5), goneH = 1. - smoothstep(.3, .55, fH);
  float wH = max(.05 + .045 * swell, .75 * fH), dH = min(fy, 1. - fy);
  float lineH = (1. - smoothstep(wH - fH * .6, wH + fH * .6, dH)) * clamp(.07 / fH, 0., 1.) * goneH;
  float miss = step(.72, id) * .22, endY = 1. - miss;                               // a joint that misses its corner
  float pool = smoothstep(.16, .0, abs(fy - endY + .08)) * step(.5, id) * .07;
  float wV = max(.045 + .03 * sin(fy * 3.1 + id * 6.) + pool, .75 * fV), dV = min(fx, 1. - fx) * L;
  float lineV = (1. - smoothstep(wV - fV * .6, wV + fV * .6, dV)) * step(fy, endY) * clamp(.07 / fV, 0., 1.) * (1. - smoothstep(.3, .55, fV)) * goneH;
  float ink = max(lineH, lineV);
  // no pool of any lamp, no moon's rim: the bare stone, a shade toward the lit stone by the face's own tone (vSt.y), and the windows' light
  vec3 colr = mix(uStone, uStoneLit, vSt.y) * (1. - .05 * id * clamp(1. - 2. * max(fV / L, fH), 0., 1.)) * uStoneGain;
  vec4 gl = glassAt(vP, face); colr = mix(colr, gl.rgb, gl.a);
  colr = mix(colr, uInk, ink * .82);
#else
  float wH = max(.05 + .045 * swell, .75 * f), dH = min(fy, 1. - fy);
  float lineH = 1. - smoothstep(wH - f * .6, wH + f * .6, dH);
  float miss = step(.72, id) * .22, endY = 1. - miss;                               // a joint that misses its corner
  float pool = smoothstep(.16, .0, abs(fy - endY + .08)) * step(.5, id) * .07;
  float wV = max(.045 + .03 * sin(fy * 3.1 + id * 6.) + pool, .75 * f), dV = min(fx, 1. - fx) * L;
  float lineV = (1. - smoothstep(wV - f * .6, wV + f * .6, dV)) * step(fy, endY);
  // THE COPING (COPING): the top course of the wall the balustrade stands on is one long stone: no upright joint, one shade
  float cope = face < .5 && abs(vSt.y - ${(COPING.k - 1).toFixed(1)}) < .5 && row + 1.5 > q.y + vSt.w ? 1. : 0.;
  lineV *= 1. - cope; id = mix(id, .5, cope);
  float ink = max(lineH, lineV);
  ink *= clamp(.07 / f, 0., 1.) * (1. - smoothstep(.3, .55, f));                    // paler as the courses shrink, gone under two pixels
  // the pool of light: by distance from the thing's foot, and the thing breathes and takes the beat
  float bt = beatOf(vSt.y) * beatAmp(vSt.y) * 4., br = breathOf(vSt.y);
  vec3 dp = vP - vPool.xyz; dp.y *= .8; float pf = max(0., 1. - length(dp) / max(vPool.w * (.7 + 10. * (br - 1.) + .3 * bt), 1e-3)); pf = pf * pf * (3. - 2. * pf);
  pf *= br * (1. + .25 * bt);
  vec3 colr = mix(uStone, uStoneLit, clamp(pf + (abs(vSt.y - 8.) < .5 ? trainPool(vP) : 0.), 0., 1.2)) * (1. - .05 * id) * uStoneGain;
  float rim = (1. - smoothstep(.10, .10 + f * 1.2 + .04, vSt.w)) * (face > 1.5 ? (vP.z * uMoonSide > 0. ? 1. : .25) : face < .5 ? .7 : 0.);
  colr = mix(colr, uInk, ink * .82);
  colr = mix(colr, uRim * uStoneGain, rim * .8);
#endif
  gl_FragColor = vec4(colr, 1.);
}`;
// NIGHT: two flat blues, pin prick stars that go in and out, one paper moon drawn on in ink. A dome that follows the eye.
const SKY_VERT = /* glsl */`
uniform float uViewH;
varying vec3 vDir; varying float vPx;
void main() { vDir = position; vPx = 2. / max(projectionMatrix[1][1] * uViewH, 1.);                 // a picture element's breadth on the dome at the picture's middle, by the camera's own lens
  vec4 p = projectionMatrix * vec4(mat3(modelViewMatrix) * position, 1.); if (abs(p.w) < 1e-4) p.w = 1e-4; gl_Position = p.xyww; }`;
const SKY_FRAG = /* glsl */`
uniform vec3 uNight, uIndigo, uPaper, uInk, uMoon; uniform float uTime, uViewH, uStarGain;
varying vec3 vDir; varying float vPx;
float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float mAng(vec2 v) { return atan(v.y, abs(v.x) + abs(v.y) > 1e-5 ? v.x : 1.); }                  // an angle, defined at the middle too
// a blot of ink about c, its half axes ax turned by rot, its outline uneven (three waves round it, set off by ph): 1 inside, 0 outside
float mBlot(vec2 q, vec2 c, vec2 ax, float rot, float ph, float px) {
  vec2 v = q - c, p = vec2(cos(rot) * v.x + sin(rot) * v.y, cos(rot) * v.y - sin(rot) * v.x) / ax; float th = mAng(p), e = px / min(ax.x, ax.y);
  float R = 1. + .20 * sin(2. * th + ph) + .14 * sin(3. * th + 2.3 * ph) + .07 * sin(5. * th + 4.1 * ph);
  return 1. - smoothstep(R - e, R + e, length(p)); }
float mLine(float dist, float hw, float px) { float w = max(hw, .8 * px); return (1. - smoothstep(w, w + px, abs(dist))) * clamp(hw / (.8 * px), .45, 1.); }   // a line of half breadth hw at dist from its middle
void main() {
  vec3 d = vDir / max(length(vDir), 1e-4);
  vec3 colr = mix(uIndigo, uNight, smoothstep(.02, .30, d.y));
  // stars: one to a cell of a grid on the dome, a disc two to four pixels across by the picture's own height
  vec3 a = abs(d); vec2 uv = a.y > a.x && a.y > a.z ? d.xz / a.y : a.x > a.z ? d.zy / a.x : d.xy / a.z;
  float fc = a.y > a.x && a.y > a.z ? 0. : a.x > a.z ? 1. : 2.;
  vec2 g = uv * 14., cell = floor(g), fr = fract(g) - .5;
  float id = h2(cell + fc * 37.), has = step(.38, id);
  vec2 o = (vec2(h2(cell + 3.1 + fc), h2(cell + 7.7 + fc)) - .5) * .7;
  float pix = 17. / max(uViewH, 1.), rad = pix * (1.0 + 1.0 * h2(cell + 1.3));
  float tw = .55 + .45 * sin(uTime * (.5 + 1.3 * h2(cell + 5.5)) + id * 40.);
  float star = has * (1. - smoothstep(rad * .6, rad, length(fr - o))) * smoothstep(.0, .06, d.y) * smoothstep(.15, .5, tw);
  colr = mix(colr, uPaper * uStarGain, star);
  float md = length(d - uMoon), mr = .035;
  float disc = 1. - smoothstep(mr, mr + .0012, md);
  colr = mix(colr, uPaper * uStarGain, disc);
  if (disc > 0.) {
    // THE MOON IS A ROUND SHEET OF PAPER DRAWN ON IN INK, in its own flat axes (q: the sheet's radius is 1): its rim one brush line that
    // swells and thins as it goes round; inside, three blots of pale ink, seas of our own drawing: a large one that runs out under
    // the rim, a middling one and a small one, each of uneven outline, each lying its own way. A FOOTPRINT FILTER (px: a picture element's breadth on the sheet): the rim is not drawn under 1.6 pixels broad (finer, it is drawn that broad and paler) and a blot's edge is a pixel soft.
    vec3 e1 = normalize(cross(vec3(0., 1., 0.), uMoon)), e2 = cross(uMoon, e1);
    vec2 q = vec2(dot(d - uMoon, e1), dot(d - uMoon, e2)) / mr; float px = vPx / mr, r = length(q), ink = 0.;
    float rw = .05 + .045 * (1. + sin(mAng(q) - .6)) + .012 * sin(3. * mAng(q) + 1.);
    ink = max(ink, mLine(r - (.985 - rw), rw, px));
    float sea = max(mBlot(q, vec2(-.40, .38), vec2(.46, .30), -.5, .7, px), max(mBlot(q, vec2(.36, -.02), vec2(.25, .16), 1.0, 2.9, px), mBlot(q, vec2(.14, -.50), vec2(.13, .09), 2.3, 4.6, px)));
    colr = mix(colr, uInk, sea * .42 * disc);
    colr = mix(colr, uInk, ink * .9 * disc);
  }
  gl_FragColor = vec4(colr, 1.);
}`;

// the inverse of the engine's tone map (src/core/post.js: aces(colour / 0.6)): the linear colour that is SHOWN as this hex
const _inM = [[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]], _outM = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
const _mul = (M, v) => M.map((r) => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const _aces = (c) => _mul(_outM, _mul(_inM, c.map((x) => x / 0.6)).map((x) => (x * (x + 0.0245786) - 0.000090537) / (x * (0.983729 * x + 0.432951) + 0.238081))).map((x) => Math.min(1, Math.max(0, x)));
export function shown(hex) {
  const t = new THREE.Color(hex), T = [t.r, t.g, t.b]; let x = T.slice();
  for (let i = 0; i < 300; i++) { const y = _aces(x); x = x.map((v, j) => Math.max(0, v + (T[j] - y[j]) * 0.8 * (1 + v))); }
  return new THREE.Color(x[0], x[1], x[2]);
}
const DEFAULT_PALETTE = ['#16246B', '#0E1540', '#5E6C96', '#AEB9D6', '#F4EFE2', '#F2C14E', '#E2452B'];
const V3 = (x, y, z) => new THREE.Vector3(x, y, z);
// plane frames in brief axes: a sheet's own (u, v) coordinates
export const FR = {
  yz: (x, z0 = 0, y0 = 0) => ({ O: V3(x, y0, z0), U: V3(0, 0, 1), V: V3(0, 1, 0) }),      // a front: u across the stair, v up
  xy: (z, x0 = 0, y0 = 0) => ({ O: V3(x0, y0, z), U: V3(1, 0, 0), V: V3(0, 1, 0) }),      // a side: u up the stair, v up
  xz: (y, x0 = 0, z0 = 0) => ({ O: V3(x0, y, z0), U: V3(0, 0, 1), V: V3(1, 0, 0) }),      // a floor: u across, v up the stair
  of: (O, U, V) => ({ O: V3(...O), U: V3(...U).normalize(), V: V3(...V).normalize() }),
};

// CARD: the batcher every paper thing is made with. One Card becomes one mesh (one draw call) of sheets, patches and ink.
class Card {
  constructor(style, k, y0, y1) { this.s = style; this.k = k; this.y0 = y0; this.y1 = Math.max(y1, y0 + 1e-3); this.w = 0.02 * rise(Math.min(k, 10)); this.pos = []; this.col = []; this.fx = []; this.side = []; this.idx = []; this.mot = []; this.n = 0; this.rng = style.rng; this.full = 0; this.fine = 0; this.row = null; }
  // a motion: kind 1 rock, 2 turn, 3 rise and loop, 4 slide, 5 window, 6 shimmer, 7 run and come round (amp, freq in rounds a second,
  // phase 0..1, clip) (see PAPER_VERT). Kind 6 may carry the beat along a row: beatK, beatPer, beatAmp. Returns its number for the m option.
  motion(o) { const p = o.pivot || [0, 0, 0], a = o.axis || [1, 0, 0], f = o.flutDir || [0, 0, 0]; this.mot.push([p[0], p[1], p[2], o.kind || 0, a[0], a[1], a[2], o.amp || 0, o.freq || 0, o.phase || 0, o.flutFreq || 0, o.flutPhase || 0, o.beatAmp ? o.beatK || 0 : f[0], o.beatAmp ? o.beatPer || 0 : f[1], f[2], o.kind === 7 ? o.clip ?? 1e9 : o.beatAmp ? o.beatAmp : o.flutBias || 0]); if (this.mot.length > NM) throw new Error('stair: too many motions on one card'); return this.mot.length; }
  _v(P, c, layer, flut, sx, sy, sz, m) { this.pos.push(P.x, P.y, P.z); this.col.push(c.r, c.g, c.b); this.fx.push(layer, this.k + (this.full ? 0.25 : this.row ? 0.4 + 0.1 * Math.min(5.8, Math.max(0, (P.x - this.row.x0) * this.row.per)) : 0), Math.min(1, Math.max(0, (P.y - this.y0) / (this.y1 - this.y0))), flut); this.side.push(sx, sy, sz, m); return this.n++; }
  at(fr, u, v, out = new THREE.Vector3()) { return out.copy(fr.O).addScaledVector(fr.U, u).addScaledVector(fr.V, v); }
  // a flat sheet: pts = [[u, v], ...] its outline in the frame; o: col, holes [[...]], m, layer (0 paper, 1 patch, 3 light), flut (u, v) => metres, edge (ink the outline, in line widths), gap (one side of the outline left bare of that ink: the side that ends at point number gap)
  sheet(fr, pts, o = {}) {
    const c = o.col || this.s.palette.paper, layer = o.layer ?? 0, m = o.m || 0, base = this.n, all = pts.concat(...(o.holes || []));
    const P = new THREE.Vector3();
    for (const q of all) { this.at(fr, q[0], q[1], P); if (o.bow) P.addScaledVector(o.bowDir, o.bow(q[0], q[1])); this._v(P, c, layer, o.flut ? o.flut(q[0], q[1]) : 0, 0, 0, 0, m); }
    const tri = pts.length === 4 && !o.holes ? [[0, 1, 2], [0, 2, 3]] : pts.length === 3 && !o.holes ? [[0, 1, 2]] : THREE.ShapeUtils.triangulateShape(pts.map((q) => new THREE.Vector2(q[0], q[1])), (o.holes || []).map((h) => h.map((q) => new THREE.Vector2(q[0], q[1]))));
    for (const t of tri) this.idx.push(base + t[0], base + t[1], base + t[2]);
    if (o.edge) { this.ink(fr, pts, this.w * o.edge, { m, closed: true, flut: o.flut, gap: o.gap }); for (const h of o.holes || []) this.ink(fr, h, this.w * (o.holeEdge ?? o.edge * 0.8), { m, closed: true, flut: o.flut }); }
    return this;
  }
  rect(fr, u0, v0, u1, v1, o) { return this.sheet(fr, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], o); }
  // an ink stroke through pts in the frame, w metres wide at its fullest: it swells, thins and pools at its end (o.gap: the piece that ends at
  // point number gap is not drawn; the rest of the stroke is as it would be with it)
  ink(fr, pts, w, o = {}) {
    const c = o.col || this.s.palette.ink, layer = o.layer ?? (this.fine ? 2.25 : 2), m = o.m || 0, rng = this.rng; w = w || this.w;
    let p = pts.map((q) => [q[0], q[1]]);
    if (o.closed) p.push([p[0][0], p[0][1]]);
    else if (!o.exact) { const j = w * 0.9, a = p[0], b = p[p.length - 1], a1 = p[1], b1 = p[p.length - 2]; const la = Math.hypot(a[0] - a1[0], a[1] - a1[1]) || 1, lb = Math.hypot(b[0] - b1[0], b[1] - b1[1]) || 1, ea = rng.range(-0.6, 1.2) * j, eb = rng.range(-0.6, 1.2) * j; p[0] = [a[0] + (a[0] - a1[0]) / la * ea, a[1] + (a[1] - a1[1]) / la * ea]; p[p.length - 1] = [b[0] + (b[0] - b1[0]) / lb * eb, b[1] + (b[1] - b1[1]) / lb * eb]; }
    if (p.length === 2) { const a = p[0], b = p[1]; p = [a, [a[0] + (b[0] - a[0]) * 0.36, a[1] + (b[1] - a[1]) * 0.36], [a[0] + (b[0] - a[0]) * 0.74, a[1] + (b[1] - a[1]) * 0.74], b]; }
    let len = 0; const cum = [0]; for (let i = 1; i < p.length; i++) { len += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); cum.push(len); }
    const P = new THREE.Vector3(), S = new THREE.Vector3(), base = this.n, n = p.length, ph = rng.range(0, 3);
    for (let i = 0; i < n; i++) {
      const a = p[o.closed ? (i - 1 + (n - 1)) % (n - 1) : Math.max(0, i - 1)], b = p[o.closed ? (i + 1) % (n - 1) : Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
      const t = len > 0 ? cum[i] / len : 0;
      const hw = 0.5 * w * (o.taper ? 1 - 0.86 * t : o.even ? 1 : o.closed ? 0.8 + 0.25 * Math.sin(t * 9 + ph) : (0.62 + 0.42 * Math.sin(Math.PI * Math.min(1, t * 1.1)) + (i === n - 1 ? 0.45 : 0)));
      this.at(fr, p[i][0], p[i][1], P); if (o.bow) P.addScaledVector(o.bowDir, o.bow(p[i][0], p[i][1]));
      S.copy(fr.U).multiplyScalar(-dy).addScaledVector(fr.V, dx).multiplyScalar(hw);
      const fl = o.flut ? o.flut(p[i][0], p[i][1]) : 0;
      this._v(P, c, layer, fl, S.x, S.y, S.z, m); this._v(P, c, layer, fl, -S.x, -S.y, -S.z, m);
      if (i > 0 && i !== o.gap) { const q = base + 2 * i; this.idx.push(q - 2, q - 1, q, q - 1, q + 1, q); }
    }
    return this;
  }
  // a lamp: a small disc of light whose radius is never under 1.7 pixels (layer 4); o: col, m, ph (its phase for a running light)
  lamp(fr, u, v, r, o = {}) {
    const c = o.col || this.s.palette.gold, base = this.n, P = this.at(fr, u, v), S = new THREE.Vector3();
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; S.copy(fr.U).multiplyScalar(r * Math.cos(a)).addScaledVector(fr.V, r * Math.sin(a)); this._v(P, c, 4, o.ph || 0, S.x, S.y, S.z, o.m || 0); }
    for (let i = 1; i < 7; i++) this.idx.push(base, base + i, base + i + 1);
    return this;
  }
  // a joint between blocks: a straight ribbon of JOINT INK w metres broad, of even breadth, in pieces no longer than 2.6 m (each piece fades by its own distance);
  // no hand in it: it takes nothing from the stream
  joint(fr, u0, v0, u1, v1, w, col) {
    const c = col || this.s.palette.ink, P = new THREE.Vector3(), S = new THREE.Vector3(), base = this.n, l = Math.hypot(u1 - u0, v1 - v0) || 1, n = Math.max(1, Math.ceil(l / 2.6));
    S.copy(fr.U).multiplyScalar(-(v1 - v0) / l).addScaledVector(fr.V, (u1 - u0) / l).multiplyScalar(0.5 * w);
    for (let i = 0; i <= n; i++) { this.at(fr, u0 + (u1 - u0) * i / n, v0 + (v1 - v0) * i / n, P); this._v(P, c, 1.9, 0, S.x, S.y, S.z, 0); this._v(P, c, 1.9, 0, -S.x, -S.y, -S.z, 0); if (i > 0) { const q = base + 2 * i; this.idx.push(q - 2, q - 1, q, q - 1, q + 1, q); } }
    return this;
  }
  line(fr, u0, v0, u1, v1, w, o) { return this.ink(fr, [[u0, v0], [u1, v0 === v1 && u0 === u1 ? v1 + 1e-3 : v1]], w, o); }
  // a card box: four walls of paper standing on v = y0 (no lid), x0..x1 along the stair, z0..z1 across
  box(x0, x1, y0, y1, z0, z1, o = {}) { this.rect(FR.yz(x0), z0, y0, z1, y1, o); this.rect(FR.yz(x1), z0, y0, z1, y1, o); this.rect(FR.xy(z0), x0, y0, x1, y1, o); this.rect(FR.xy(z1), x0, y0, x1, y1, o); return this; }
  get triangles() { return this.idx.length / 3; }
  mesh(pad = 0) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3)); g.setAttribute('aCol', new THREE.Float32BufferAttribute(this.col, 3));
    g.setAttribute('aFx', new THREE.Float32BufferAttribute(this.fx, 4)); g.setAttribute('aSide', new THREE.Float32BufferAttribute(this.side, 4));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.boundingSphere.radius += pad + 4 * this.w;
    const me = new THREE.Mesh(g, this.s.paper(this.mot)); me.renderOrder = 30 - this.k; me.matrixAutoUpdate = false;
    this.pos = this.col = this.fx = this.side = this.idx = null;
    return me;
  }
}

// ------------------------------------------------------------------ THE STYLE KIT
export function makeStyle(ctx, opts = {}) {
  const pal = opts.palette || DEFAULT_PALETTE, rng = ctx.rng.fork ? ctx.rng.fork('stair-style') : ctx.rng;
  for (let i = 0; i < 5; i++) rng();
  // C(hex, gain): the colour as written is the colour shown (the world returns post.flat 1: no tone curve, no bloom), times a gain.
  // Written so, the paper is no brighter than 1 and the nave does not haze over when the post eases to the next world's bloom
  // on the way out. opts.filmic: the hexes corrected for the tone map (shown(hex)), for a world that keeps the filmic curve.
  const C = (h, g = 1) => (opts.filmic ? shown(h) : new THREE.Color(h)).multiplyScalar(g);
  const cool = opts.paper ? false : rng.chance(0.4), paperHex = opts.paper || (cool ? '#EEF1F4' : pal[4]);
  const G = { paper: 1, hot: 1, gold: opts.filmic ? 1.5 : 1, verm: 1, stone: 1, ...(opts.gains || {}) };
  const palette = {
    night: C(pal[0]), indigo: C(pal[1]), stone: C(pal[2]), stoneLit: C(pal[3]), ink: C(pal[1]),
    paper: C(paperHex, G.paper), hot: (opts.filmic ? new THREE.Color(3.4, 3.2, 2.8) : new THREE.Color(1, 1, 1)).multiplyScalar(G.hot), gold: C(pal[5], G.gold), vermilion: C(pal[6], G.verm),
    tissueVermilion: C(pal[6], opts.filmic ? 1.5 : 1.3), tissueBlue: C('#2F49C8', opts.filmic ? 1.7 : 1.5), paperHex,
  };
  const moonSide = opts.moonSide ?? (rng.chance(0.5) ? 1 : -1);
  const U = { uTime: { value: 0 }, uViewH: { value: 450 }, uGain: { value: 1 }, uStoneGain: { value: G.stone }, uMoonSide: { value: moonSide } };
  const zero = () => { const a = []; for (let i = 0; i < NM; i++) a.push(new THREE.Vector4()); return a; };
  const style = {
    palette, uniforms: U, moonSide, rng, cool, gains: G,
    // a paper material carrying up to 16 motions (rows of 16 numbers, see Card.motion). All share one program (the gold's card: the same with SIGHT defined).
    paper(motions = []) {
      const A = zero(), B = zero(), Cc = zero(), D = zero();
      motions.forEach((m, i) => { A[i].set(m[0], m[1], m[2], m[3]); B[i].set(m[4], m[5], m[6], m[7]); Cc[i].set(m[8], m[9], m[10], m[11]); D[i].set(m[12], m[13], m[14], m[15]); });
      return new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uViewH: U.uViewH, uGain: U.uGain, uMA: { value: A }, uMB: { value: B }, uMC: { value: Cc }, uMD: { value: D } },
        vertexShader: PAPER_VERT, fragmentShader: PAPER_FRAG, side: THREE.DoubleSide, transparent: true, depthWrite: true, forceSinglePass: true,
        blending: THREE.CustomBlending, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
      });
    },
    // the stone material (one instance): geometry needs aSt and aPool, see stoneFace()
    stone: null,
    // the room's stone (one instance): the stone's own program with ROOM defined; geometry by roomPiece(), see ROOM
    room: null,
    // the night dome: a sphere of radius 1 scaled by the world, drawn first; uMoon is the moon's direction in the dome's own axes
    sky(moonDir) {
      return new THREE.ShaderMaterial({
        uniforms: { uTime: U.uTime, uViewH: U.uViewH, uNight: { value: palette.night }, uIndigo: { value: palette.indigo }, uPaper: { value: C(paperHex) }, uInk: { value: palette.ink }, uStarGain: { value: opts.filmic ? 1.3 : 1.1 }, uMoon: { value: (moonDir || new THREE.Vector3(0.2, 0.34, moonSide * 0.92)).clone().normalize() } },
        vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: THREE.BackSide, depthWrite: false, depthTest: false,
      });
    },
    // a new batcher for a thing on step k whose paper spans y0..y1 (for the "hotter low down" rule)
    card(k, y0, y1, w) { const c = new Card(style, k, y0, y1); if (w) c.w = w; return c; },
    // push one stone rectangle into arrays {pos, st, pool, idx}: corners a, b, c, d in order (a-b the top edge), course size, lighting
    // thing's k, face (0 riser, 1 tread, 2 flank), the thing's foot [x, y, z] and reach, depth of the bottom edge under the top in metres
    stoneFace(S, a, b, c, d, course, k, face, foot, reach, depth) {
      const n = S.pos.length / 3; S.pos.push(...a, ...b, ...c, ...d);
      S.st.push(course, k, face, 0, course, k, face, 0, course, k, face, depth / course, course, k, face, depth / course);
      for (let i = 0; i < 4; i++) S.pool.push(foot[0], foot[1], foot[2], reach);
      S.idx.push(n, n + 1, n + 2, n, n + 2, n + 3);
    },
    // push one flat piece of the room's stone into arrays {pos, st, pool, idx}: fr its frame, pts its outline [[u, v], ...]; o: holes (cut through),
    // course (metres), tone (0 bare stone .. 1 lit stone), kind (0 plain, 1 floor: slabs, and the windows' outlines lie on it, 2 a pier's side: the
    // aisle window's wash lies on it), ju, jv (the piece's own measures at the frame's origin: metres along its courses run with u, across them with v)
    roomPiece(S, fr, pts, o = {}) {
      const all = pts.concat(...(o.holes || [])), base = S.pos.length / 3, P = new THREE.Vector3();
      for (const q of all) { P.copy(fr.O).addScaledVector(fr.U, q[0]).addScaledVector(fr.V, q[1]); S.pos.push(P.x, P.y, P.z); S.st.push(o.course, o.tone || 0, o.kind || 0, 0); S.pool.push(q[0] + (o.ju || 0), q[1] + (o.jv || 0), 0, 0); }
      const tri = pts.length === 4 && !o.holes ? [[0, 1, 2], [0, 2, 3]] : THREE.ShapeUtils.triangulateShape(pts.map((q) => new THREE.Vector2(q[0], q[1])), (o.holes || []).map((h) => h.map((q) => new THREE.Vector2(q[0], q[1]))));
      for (const t of tri) S.idx.push(base + t[0], base + t[1], base + t[2]);
    },
    stoneMesh(S, mat) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(S.pos, 3)); g.setAttribute('aSt', new THREE.Float32BufferAttribute(S.st, 4)); g.setAttribute('aPool', new THREE.Float32BufferAttribute(S.pool, 4));
      g.setIndex(S.idx); g.computeBoundingSphere();
      const me = new THREE.Mesh(g, mat || style.stone); me.matrixAutoUpdate = false; return me;
    },
    // drive the shared uniforms: by time only (dt is ignored: a frame at dt 0 changes nothing, the same time gives the same picture)
    update(dt, time, camera) { U.uTime.value = time; const r = ctx.renderer; if (r && r.getDrawingBufferSize) { r.getDrawingBufferSize(_size); if (_size.y > 0) U.uViewH.value = _size.y; } },
  };
  style.stone = new THREE.ShaderMaterial({
    uniforms: { uTime: U.uTime, uStoneGain: U.uStoneGain, uMoonSide: U.uMoonSide, uStone: { value: palette.stone }, uStoneLit: { value: palette.stoneLit }, uInk: { value: palette.ink }, uRim: { value: C('#C4CEE6') } },
    vertexShader: STONE_VERT, fragmentShader: STONE_FRAG, side: THREE.DoubleSide,
  });
  // the light a window lays on the room's stone: its tissue's colour thinned with paper by 35 in 100 (so that it is lighter than the stone it lies on)
  const glass = (t) => t.clone().lerp(palette.paper, 0.35);
  style.room = new THREE.ShaderMaterial({
    defines: { ROOM: 1 },
    uniforms: { uTime: U.uTime, uStoneGain: U.uStoneGain, uMoonSide: U.uMoonSide, uStone: { value: palette.stone }, uStoneLit: { value: palette.stoneLit }, uInk: { value: palette.ink }, uRim: { value: C('#C4CEE6') }, uGlassA: { value: glass(palette.tissueBlue) }, uGlassB: { value: glass(palette.tissueVermilion) } },
    vertexShader: STONE_VERT, fragmentShader: STONE_FRAG, side: THREE.DoubleSide,
  });
  return style;
}
const _size = new THREE.Vector2();

// ------------------------------------------------------------------ THE STAIR
// where each built step's light comes from: the foot of the thing on tread k and the reach of its pool (brief axes)
export const POOL = [];
for (let k = 0; k <= 8; k++) POOL.push({ foot: [thingX(k), treadTop(k), 0], reach: 5.6 * rise(k) });
POOL.push({ foot: [350, treadTop(9), 0], reach: 320 });            // the cathedral, x 300 .. 380
POOL.push({ foot: [640, treadTop(10), 0], reach: 500 });           // the town, at the front of its tread
POOL.push({ foot: [1100, treadTop(11), 300], reach: 340 });        // the crane's lamp
// block digits of our own cutting, three cells by five, each row a run of rectangles
const DIGITS = { 0: '111101101101111', 1: '110010010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001', 5: '111100111001111', 6: '111100111101111', 7: '111001001001001', 8: '111101111101111', 9: '111101111001111' };
// THE NUMBER'S SEAT: at its riser's head, its top 0.03 of the rise under the riser's top, 0.28 r tall, 2.25 r to the left hand:
// small and high, so that the tread before it, seen from our line, covers it as little as may be (no cloud stands before a
// riser's left half). A NUMBER IS NEVER TALLER THAN NUMBER_CAP, and a capped number's top stands a tenth of its own height under
// its riser's top: from low before the stair only the top of a far riser shows over the nearer treads, however great the riser,
// so 512, 1024 and 2048, capped, need 11.2 m of their riser's top to stand whole (at 0.28 r they would need 16, 32 and 64 m) and
// sink behind the nearer treads only when the eye has come low, as every far thing does; the numbers to 256 are under the cap
// and keep their seats. AND WHILE A NEARER TREAD OR THE VIADUCT WOULD CUT A NUMBER IT IS NOT DRAWN AT ALL: THE LAW OF SIGHT (SIGHT, numberBox, sightShare).
const NUMBER_CAP = 10;                                           // metres: the cutter's own figure
export const numberSeat = (k) => 0.28 * rise(k) <= NUMBER_CAP
    ? { x: riserX(k), y: treadTop(k) - (0.03 + 0.14) * rise(k), z: -2.25 * rise(k), tall: 0.28 * rise(k) }
    : { x: riserX(k), y: treadTop(k) - 0.6 * NUMBER_CAP, z: -2.25 * rise(k), tall: NUMBER_CAP };
// the number's box with its cut's dark edge (cutNumber's own measures) and its band in metres, for THE LAW OF SIGHT (SIGHT)
export const numberBox = (k) => { const s = numberSeat(k), ch = s.tall / 5, e = ch * 0.2, total = (String(numberOf(k)).length * 4 - 1) * ch * 0.84;
  return { x: s.x, foot: s.y - s.tall / 2 - 0.4 * e, top: s.y + s.tall / 2 + e, left: s.z - total / 2 - e, right: s.z + total / 2 + 0.4 * e, band: SIGHT.band * s.tall }; };
// THE LAW OF SIGHT in plain figures (the gold's shader does the same sum): the share, 0 none to 1 whole, of number k's gold for an eye at [x, y, z]
export function sightShare(k, eye) {
  const b = numberBox(k), D = b.x - eye[0]; let clear = 1e9; if (D <= 1e-3) return 1;
  for (const z of [b.left, b.right]) for (let j = 0, dz = Math.abs(z - eye[2]) < 1e-6 ? 1e-6 : z - eye[2]; j < k; j++) {
    const T = treadTop(j), hw = halfWidth(j), a = (-hw - eye[2]) / dz, c = (hw - eye[2]) / dz;
    const ta = Math.max(Math.min(a, c), (riserX(j) - eye[0]) / D, 0), tb = Math.min(Math.max(a, c), 1);
    if (ta < tb) clear = Math.min(clear, Math.min(eye[1] + (b.foot - eye[1]) * ta, eye[1] + (b.foot - eye[1]) * tb) - T);
  }
  const soft = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); }, V = SIGHT_BOX; let past = 1e9;
  if (k >= 9) {                                                                                    // 512, 1024, 2048: the viaduct's box
    if (eye[0] >= V.x1) past = eye[0] - V.x1;
    else { const ta = Math.max(V.x0 - eye[0], 0) / D, tb = (V.x1 - eye[0]) / D, at = (q, o, t) => o + (q - o) * t;
      past = Math.max(Math.min(at(b.left, eye[2], ta), at(b.left, eye[2], tb)) - V.z1, V.z0 - Math.max(at(b.right, eye[2], ta), at(b.right, eye[2], tb)),
        Math.min(at(b.foot, eye[1], ta), at(b.foot, eye[1], tb)) - V.y1, V.y0 - Math.max(at(b.top, eye[1], ta), at(b.top, eye[1], tb))); } }
  return Math.min(soft(clear / b.band), soft(past / SIGHT.past));
}
function cutNumber(card, k) {
  const s = numberSeat(k), str = String(numberOf(k)), ch = s.tall / 5, cw = ch * 0.84, total = (str.length * 4 - 1) * cw, pal = card.s.palette;
  const fr = FR.yz(s.x - 0.002 * rise(k)), e = ch * 0.2; card.k = k; card.y0 = s.y - s.tall; card.y1 = s.y + s.tall;
  for (let i = 0; i < str.length; i++) {
    const g = DIGITS[str[i]], u0 = s.z - total / 2 + i * 4 * cw;
    for (let row = 0; row < 5; row++) for (let c0 = 0; c0 < 3; c0++) {
      if (g[row * 3 + c0] !== '1') continue; let c1 = c0; while (c1 < 2 && g[row * 3 + c1 + 1] === '1') c1++;
      const a = u0 + c0 * cw, b = u0 + (c1 + 1) * cw, top = s.y + s.tall / 2 - row * ch, bot = top - ch;
      card.rect(fr, a - e, bot - e * 0.4, b + e * 0.4, top + e, { col: pal.ink, layer: 1 });      // the cut's dark edge: the stone is thick
      card.rect(fr, a, bot, b, top, { col: pal.gold, layer: 3 });
      c0 = c1;
    }
  }
}
async function buildStair(ctx, style) {
  const S = { pos: [], st: [], pool: [], idx: [] }, gold = style.card(0, 0, 1); gold.full = 1;
  for (let k = 0; k <= KHALF; k++) {
    const r = rise(k), X = riserX(k), X1 = riserX(k + 1), top = treadTop(k), c = r / 12, hw = halfWidth(k), z0 = -hw, z1 = k === KHALF ? 0 : hw;
    const lo = POOL[Math.max(0, k - 1)], own = POOL[k];
    style.stoneFace(S, [X, top, z0], [X, top, z1], [X, 0, z1], [X, 0, z0], c, Math.max(0, k - 1), 0, lo.foot, lo.reach, top);                // the riser
    style.stoneFace(S, [X, top, z0], [X, top, z1], [X1, top, z1], [X1, top, z0], c, k, 1, own.foot, own.reach, X1 - X);                       // the tread
    style.stoneFace(S, [X, top, z0], [X1, top, z0], [X1, 0, z0], [X, 0, z0], c, k, 2, own.foot, own.reach, top);                              // the flanks
    style.stoneFace(S, [X, top, z1], [X1, top, z1], [X1, 0, z1], [X, 0, z1], c, k, 2, own.foot, own.reach, top);
    cutNumber(gold, k);
  }
  await ctx.yield();
  const lampGold = style.palette.gold.clone().multiplyScalar(1.5);
  // the steps to come: risers 12 and 13 as dotted frames of gold lights (top edge and two sides), lights running upward. THE LAW: on
  // every edge the lights stand a tenth of the frame's rise apart: ten up each side, sixty along the top (6 r), on both frames alike
  for (let k = KHALF + 1; k <= KLAST; k++) {
    const r = rise(k), X = riserX(k), y0 = treadTop(k - 1), y1 = treadTop(k), hw = halfWidth(k), rad = 0.012 * r, fr = FR.yz(X);
    gold.k = k; gold.y0 = y0; gold.y1 = y1;
    const m = gold.motion({ kind: 5, amp: 0.4, freq: 0.22, phase: 0.45 });
    const dot = (u, v, ph) => gold.lamp(fr, u, v, rad, { col: lampGold, m, ph });
    const apart = 0.1 * r, nSide = Math.round((y1 - y0) / apart), nTop = Math.round(2 * hw / apart);
    for (let i = 0; i < nSide; i++) { const t = (i + 0.5) / nSide; dot(-hw, y0 + (y1 - y0) * t, 1 - t * 0.5); dot(hw, y0 + (y1 - y0) * t, 1 - t * 0.5); }
    for (let i = 0; i < nTop; i++) { const t = (i + 0.5) / nTop; dot(-hw + 2 * hw * t, y1, 0.5 - 0.5 * (1 - Math.abs(2 * t - 1))); }
  }
  const stone = style.stoneMesh(S), goldMesh = gold.mesh(0); goldMesh.renderOrder = 5; goldMesh.frustumCulled = false; stone.frustumCulled = false; stone.name = 'stone'; goldMesh.name = 'gold';
  // THE LAW OF SIGHT (SIGHT): the gold's card alone carries it; each number's box, band and top go to its shader once, here
  const sightA = [], sightBand = [], sightTop = []; for (let k = 0; k <= KHALF; k++) { const b = numberBox(k); sightA.push(new THREE.Vector4(b.x, b.foot, b.left, b.right)); sightBand.push(b.band); sightTop.push(b.top); }
  goldMesh.material.defines = { SIGHT: 1 }; goldMesh.material.uniforms.uSightA = { value: sightA }; goldMesh.material.uniforms.uSightBand = { value: sightBand }; goldMesh.material.uniforms.uSightTop = { value: sightTop };
  return { stone, gold: goldMesh };
}

// ------------------------------------------------------------------ THE HERO
const THINGS = [];                                    // builders, in order: each returns { name, meshes, info }
const toLocal = (p) => [p[2], p[1], -p[0]];           // brief (x, y, z) -> the part's local (X, Y, Z)
export async function buildHero(ctx, opts = {}) {
  const style = opts.style || makeStyle(ctx, opts), detail = opts.detail ?? 1;
  const object = new THREE.Group(), inner = new THREE.Group();
  inner.rotation.y = Math.PI / 2; inner.updateMatrix(); inner.matrixAutoUpdate = false; object.add(inner);   // brief axes inside, the contract's outside
  const stair = await buildStair(ctx, style); inner.add(stair.stone, stair.gold);
  const things = {}; let triangles = stair.stone.geometry.index.count / 3 + stair.gold.geometry.index.count / 3, calls = 2;
  for (const make of THINGS) {
    await ctx.yield();
    const res = await make(ctx, style, { detail, opts });
    for (const m of res.meshes) { inner.add(m); triangles += m.geometry.index.count / 3; calls++; }
    things[res.name] = res.info;
  }
  await ctx.yield();
  const lp = lineParts(), line = lp.points;
  const anchors = {
    axes: 'local X = brief z (across), local Y = brief y (up), local Z = minus brief x (the stair climbs toward -Z)',
    portalSeat: { position: toLocal([ROSE_X, NAVE_Y, 0]), facing: toLocal([-1, 0, 0]), radius: 7 },
    flyThrough: line.map(toLocal), flyThroughBrief: line,
    viewpoints: { entry: toLocal([-40, 6, 0]), foot: toLocal([-1, 2.45, 0]), reveal: toLocal(lp.marks.wall), westDoor: toLocal([DOOR_X, NAVE_Y, 0]) },
    things,
  };
  return {
    object, radius: 2300, height: treadTop(KLAST), center: new THREE.Vector3(0, treadTop(9), -340), anchors, style, triangles, calls,
    update(dt, time, camera) { style.update(dt, time, camera); },
    dispose() {}, ground: false, groundY: 0,
  };
}

// helpers for the things: frames about a thing's own foot, a mirrored outline, a disc, the box a card fills (padded for its motion)
const mirror = (half) => half.concat(half.slice().reverse().map((p) => [-p[0], p[1]]));     // half: u >= 0, bottom to top
const disc = (u, v, r, n = 12, a0 = 0) => { const p = []; for (let i = 0; i < n; i++) { const a = a0 + i * 2 * Math.PI / n; p.push([u + r * Math.cos(a), v + r * Math.sin(a)]); } return p; };
const scl = (pts, s, du = 0, dv = 0) => pts.map((p) => [p[0] * s + du, p[1] * s + dv]);
function boundsOf(card, pad = 0) { const a = [1e9, 1e9, 1e9], b = [-1e9, -1e9, -1e9], p = card.pos; for (let i = 0; i < p.length; i += 3) for (let j = 0; j < 3; j++) { if (p[i + j] < a[j]) a[j] = p[i + j]; if (p[i + j] > b[j]) b[j] = p[i + j]; } return { min: a.map((v) => v - pad), max: b.map((v) => v + pad) }; }
const done = (name, card, pad, extra = {}) => { const box = boundsOf(card, pad), m = card.mesh(pad); m.name = name; return { name, meshes: [m], info: { k: card.k, at: [box.min[0] / 2 + box.max[0] / 2, box.min[1], 0], box, clearBelowLine: 2.4 + 0.56 * ((box.min[0] + box.max[0]) / 2 + 1) - box.max[1], ...extra } }; };

// CUT AWAY WHAT STANDS UNDER A ROOF: of the card's triangles from index i0 on, the parts that lie more than d metres inside the roof whose
// line is `curve` ([[z, v], ...] across the stair, v over y0; the roof runs along x) are taken out; what is left is the same sheet and the
// same ink (a cut triangle's new corners carry its own colour, layer, flutter and ribbon side, by the straight rule)
function cutUnder(card, i0, curve, y0, d) {
  const planes = [], ref = curve[0][1];
  for (let j = 0; j + 1 < curve.length; j++) { const a = curve[j], b = curve[j + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); let nz = -(b[1] - a[1]) / l, nv = (b[0] - a[0]) / l; if (nz * -a[0] + nv * (ref - a[1]) < 0) { nz = -nz; nv = -nv; } planes.push([nz, nv, nz * (a[0] + d * nz) + nv * (a[1] + d * nv)]); }
  const depth = (i, pl) => pl[0] * card.pos[3 * i + 2] + pl[1] * (card.pos[3 * i + 1] - y0) - pl[2];                 // over 0: inside
  const lerp = (arr, n, i, j, t) => { for (let q = 0; q < n; q++) arr.push(arr[n * i + q] + (arr[n * j + q] - arr[n * i + q]) * t); };
  const between = (i, j, t) => { lerp(card.pos, 3, i, j, t); lerp(card.col, 3, i, j, t); lerp(card.fx, 4, i, j, t); lerp(card.side, 4, i, j, t); card.side[card.side.length - 1] = card.side[4 * i + 3]; card.fx[card.fx.length - 4] = card.fx[4 * i]; card.fx[card.fx.length - 3] = card.fx[4 * i + 1]; return card.n++; };
  const old = card.idx.splice(i0);
  for (let t = 0; t < old.length; t += 3) {
    let poly = [old[t], old[t + 1], old[t + 2]];
    for (const pl of planes) {
      const out = [], inn = [];
      for (let q = 0; q < poly.length; q++) { const i = poly[q], j = poly[(q + 1) % poly.length], di = depth(i, pl), dj = depth(j, pl); (di > 0 ? inn : out).push(i); if ((di > 0) !== (dj > 0)) { const m = between(i, j, di / (di - dj)); out.push(m); inn.push(m); } }
      for (let q = 1; q + 1 < out.length; q++) card.idx.push(out[0], out[q], out[q + 1]);
      poly = inn; if (poly.length < 3) break;
    }
  }
}

// 0 THE CANDLE, 0.2 m to the flame's tip with its ink edge (0.199): a stick of three crossed sheets on a saucer, a flame 0.07 m that leans
THINGS.push(async function candle(ctx, style) {
  const k = 0, X = thingX(k), Y = treadTop(k), c = style.card(k, Y, Y + 0.2), P = style.palette;
  c.sheet(FR.xz(Y + 0.003, X, 0), disc(0, 0, 0.05, 10), { edge: 1 });
  for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3, fr = FR.of([X, Y, 0], [Math.sin(a), 0, Math.cos(a)], [0, 1, 0]); c.sheet(fr, [[-0.017, 0], [0.017, 0], [0.016, 0.118], [0.006, 0.124], [-0.012, 0.117]], { edge: 0.8 }); c.ink(fr, [[0.009, 0.118], [0.01, 0.085], [0.006, 0.07]], 0.0035); }
  c.ink(FR.yz(X), [[0, 0.12], [0.002, 0.137]], 0.004);
  const m = c.motion({ kind: 1, pivot: [X, Y + 0.128, 0], axis: [1, 0, 0], amp: 0.22, freq: 1.7, phase: 0.4, flutDir: [0, 0, 1], flutFreq: 5.3 });
  const flame = scl([[0, 0], [0.013, 0.012], [0.016, 0.03], [0.008, 0.055], [0.001, 0.078], [-0.009, 0.05], [-0.015, 0.028], [-0.011, 0.01]], 0.9);
  for (const fr of [FR.yz(X, 0, Y + 0.128), FR.xy(0, X, Y + 0.128)]) c.sheet(fr, flame, { col: P.hot, layer: 1, m, flut: (u, v) => v * 0.12, edge: 0.6 });
  return done('candle', c, 0.03);
});

// 1 THE FOLDED BOAT, vermilion, 0.4 by 0.7 (its peak 0.392, 0.395 with its ink edge), lying across the stair, rocking
THINGS.push(async function boat(ctx, style) {
  const k = 1, X = thingX(k), Y = treadTop(k), c = style.card(k, Y, Y + 0.4), P = style.palette;
  const m = c.motion({ kind: 1, pivot: [X, Y + 0.02, 0], axis: [1, 0, 0], amp: 0.11, freq: 1.25, phase: 1 });
  const hull = [[-0.13, 0.0], [0.13, 0.0], [0.35, 0.2], [0.12, 0.165], [-0.12, 0.165], [-0.35, 0.2]];
  for (const s of [-1, 1]) {
    const fr = FR.of([X, Y + 0.012, 0], [0, 0, 1], [s * 0.42, 0.9, 0]);
    c.sheet(fr, hull, { col: P.vermilion, m, edge: 1.5 }); c.ink(fr, [[-0.1, 0.02], [-0.2, 0.15]], 0, { m }); c.ink(fr, [[0.1, 0.02], [0.2, 0.15]], 0, { m });
  }
  const peak = [[-0.16, 0.13], [0.16, 0.13], [0, 0.392]];
  c.sheet(FR.yz(X, 0, Y), peak, { col: P.vermilion, m, edge: 1.5 }); c.ink(FR.yz(X, 0, Y), [[0, 0.38], [0, 0.14]], 0, { m });
  c.sheet(FR.xy(0, X, Y), [[-0.07, 0.15], [0.07, 0.15], [0, 0.392]], { col: P.vermilion, m, edge: 1.2 });
  return done('boat', c, 0.05);
});

// 2 THE ROCKING HORSE, 0.8 by 1.0, two profiles and two rockers, rocking on its runners: its ears stand 0.76 m at rest and rise to
// 0.795 m at the end of each rock (its ink edge counted), under its step's 0.8
const HORSE = [[-46, 36], [-37, 50], [-30, 58], [-12, 54], [8, 57], [20, 74], [22, 83], [27, 76], [34, 72], [45, 61], [43, 56], [33, 60], [28, 55], [25, 44], [27, 30], [32, 13], [24, 11], [19, 30], [14, 37], [-14, 37], [-18, 30], [-21, 11], [-29, 12], [-27, 30], [-36, 42], [-39, 46]];
THINGS.push(async function horse(ctx, style) {
  const k = 2, X = thingX(k), Y = treadTop(k), c = style.card(k, Y, Y + 0.8), P = style.palette, R = 1.3, S = 0.95;
  const m = c.motion({ kind: 1, pivot: [X, Y + R, 0], axis: [1, 0, 0], amp: 0.13, freq: 1.5, phase: 0.2 });
  const body = scl(HORSE, 0.0096 * S, 0, 0.0), rock = [], sc = (pts) => scl(pts, S);
  for (let i = 0; i <= 10; i++) { const a = -0.4 + 0.8 * i / 10; rock.push([R * Math.sin(a), R - R * Math.cos(a)]); }
  for (let i = 10; i >= 0; i--) { const a = -0.4 + 0.8 * i / 10; rock.push([(R - 0.06) * Math.sin(a), R - (R - 0.06) * Math.cos(a)]); }
  for (const s of [-1, 1]) {
    const fr = FR.yz(X + s * 0.055, 0, Y);
    c.sheet(fr, body, { m, edge: 1.5 });
    c.sheet(fr, disc(0.325 * S, 0.665 * S, 0.012 * S, 6), { col: P.ink, layer: 1, m });                                   // the eye
    c.ink(fr, sc([[0.2, 0.71], [0.13, 0.66]]), 0, { m }); c.ink(fr, sc([[0.17, 0.66], [0.1, 0.6]]), 0, { m }); c.ink(fr, sc([[0.14, 0.61], [0.08, 0.56]]), 0, { m });   // the mane
    c.ink(fr, sc([[0.3, 0.69], [0.33, 0.59]]), 0, { m }); c.ink(fr, sc([[-0.37, 0.47], [-0.43, 0.38]]), 0, { m });    // the bridle, the tail
    c.sheet(fr, sc([[-0.13, 0.53], [0.05, 0.56], [0.03, 0.44], [-0.1, 0.43]]), { col: P.vermilion, layer: 1, m, edge: 1 });   // the saddle cloth
    c.sheet(FR.yz(X + s * 0.14, 0, Y), rock, { m, edge: 1.3 });
  }
  for (const z of [-0.3, 0.3]) c.rect(FR.of([X, Y + R - R * Math.cos(z / R) + 0.035, z], [1, 0, 0], [0, 0, 1]), -0.14, -0.03, 0.14, 0.03, { m, edge: 1 });   // cross bars
  c.rect(FR.of([X, Y + 0.56 * S, -0.04 * S], [1, 0, 0], [0, 0.1, 1]), -0.055, -0.1 * S, 0.055, 0.12 * S, { col: P.vermilion, m });                                          // the saddle's top
  return done('horse', c, 0.12);
});

// 3 THE CHAIR, 1.0 by 0.5, plain, facing up the stair: its back is toward the way we come
THINGS.push(async function chair(ctx, style) {
  const k = 3, X = thingX(k), Y = treadTop(k), c = style.card(k, Y, Y + 1.0);
  const back = [[-0.25, 0], [-0.19, 0], [-0.19, 0.4], [0.19, 0.4], [0.19, 0], [0.25, 0], [0.25, 0.96], [0.2, 1.0], [-0.2, 1.0], [-0.25, 0.96]];
  const fb = FR.of([X - 0.22, Y, 0], [0, 0, 1], [-0.07, 1, 0]);
  c.sheet(fb, back, { edge: 1.5, holes: [[[-0.19, 0.56], [0.19, 0.56], [0.19, 0.84], [-0.19, 0.84]]] });
  for (const u of [-0.065, 0.065]) c.rect(fb, u - 0.022, 0.56, u + 0.022, 0.84, { edge: 0.8 });                    // two slats across the cut opening
  c.ink(fb, [[-0.19, 0.9], [0.19, 0.9]], 0); c.ink(fb, [[-0.19, 0.47], [0.19, 0.47]], 0);
  c.sheet(FR.yz(X + 0.22, 0, Y), [[-0.25, 0], [-0.19, 0], [-0.19, 0.4], [0.19, 0.4], [0.19, 0], [0.25, 0], [0.25, 0.48], [-0.25, 0.48]], { edge: 1.5 });
  const seat = FR.xz(Y + 0.48, X, 0); c.rect(seat, -0.25, -0.22, 0.25, 0.24, { edge: 1.5 });
  c.ink(seat, [[-0.085, -0.2], [-0.085, 0.22]], 0); c.ink(seat, [[0.085, -0.2], [0.085, 0.22]], 0);
  for (const z of [-0.25, 0.25]) c.sheet(FR.xy(z, X, Y), [[-0.22, 0.4], [0.22, 0.4], [0.22, 0.48], [-0.22, 0.48]], { edge: 1.2 });
  return done('chair', c, 0.01);
});

// 4 THE LONGCASE CLOCK, 2.2 by 0.55: a blank dial, two hands, a pendulum swinging behind a cut opening. Its face is toward the way we come.
THINGS.push(async function clock(ctx, style) {
  const k = 4, X = thingX(k), Y = treadTop(k), c = style.card(k, Y, Y + 2.2), P = style.palette, d = 0.16;
  const prof = mirror([[0.275, 0], [0.275, 0.46], [0.19, 0.5], [0.19, 1.5], [0.275, 1.55], [0.275, 2.02], [0.2, 2.06], [0.12, 2.16], [0, 2.2]]);
  const open = [[-0.1, 0.66], [0.1, 0.66], [0.1, 1.3], [0.06, 1.38], [-0.06, 1.38], [-0.1, 1.3]];
  const ff = FR.yz(X - d, 0, Y), fbk = FR.yz(X + d, 0, Y);
  c.sheet(ff, prof, { edge: 1.5, holes: [open] }); c.sheet(fbk, prof, { edge: 1.5 });
  c.sheet(FR.yz(X + d * 0.5, 0, Y), [[-0.19, 0.5], [0.19, 0.5], [0.19, 1.5], [-0.19, 1.5]], { col: P.hot, layer: 0 });      // the lit inside seen through the opening
  for (const [w, a, b] of [[0.275, 0, 0.46], [0.19, 0.5, 1.5], [0.275, 1.55, 2.02]]) for (const s of [-1, 1]) c.rect(FR.xy(s * w, X, Y), -d, a, d, b, { edge: 1.2 });
  c.ink(ff, [[-0.275, 0.46], [0.275, 0.46]], 0); c.ink(ff, [[-0.275, 1.55], [0.275, 1.55]], 0); c.ink(ff, [[-0.2, 0.1], [0.2, 0.1], [0.2, 0.38], [-0.2, 0.38]], 0, { closed: true });
  // the dial: blank, an ink ring, two hands that turn
  const dy = 1.79, dial = FR.yz(X - d - 0.004, 0, Y);
  c.sheet(dial, disc(0, dy, 0.19, 20), { col: P.hot, layer: 1 }); c.ink(dial, disc(0, dy, 0.19, 20), c.w * 1.3, { closed: true });
  const mh = c.motion({ kind: 2, pivot: [X - d, Y + dy, 0], axis: [1, 0, 0], freq: -6.2832 / 60, phase: 1.1 }), hh = c.motion({ kind: 2, pivot: [X - d, Y + dy, 0], axis: [1, 0, 0], freq: -6.2832 / 720, phase: 4.0 });
  c.ink(dial, [[0, dy - 0.02], [0, dy + 0.16]], c.w * 1.2, { m: mh, exact: true }); c.ink(dial, [[0, dy - 0.02], [0, dy + 0.1]], c.w * 1.8, { m: hh, exact: true });
  // the pendulum: a rod and a bob of ink, swinging across the opening
  const pm = c.motion({ kind: 1, pivot: [X - d * 0.4, Y + 1.46, 0], axis: [1, 0, 0], amp: 0.15, freq: Math.PI, phase: 0 }), pf = FR.yz(X - d * 0.4, 0, Y);
  c.ink(pf, [[0, 1.46], [0, 0.86]], c.w * 0.9, { m: pm, exact: true, even: true }); c.sheet(pf, disc(0, 0.84, 0.06, 12), { col: P.ink, layer: 1, m: pm });
  return done('clock', c, 0.02);
});

// THE STAIR'S OWN TREE, h tall and w broad: a leaf-shaped crown on a trunk (one outline; round: the hut's tree, else a poplar), the
// vein up its middle and three branch strokes. The paper trees are cut to it; the world draws the ridges' ink trees by it.
export function treeLines(h, w, round) {
  const half = round ? [[0.04 * w, 0], [0.05 * w, 0.3 * h], [0.42 * w, 0.36 * h], [0.5 * w, 0.58 * h], [0.4 * w, 0.82 * h], [0.2 * w, 0.96 * h], [0, h]] : [[0.05 * w, 0], [0.06 * w, 0.12 * h], [0.34 * w, 0.2 * h], [0.5 * w, 0.42 * h], [0.4 * w, 0.72 * h], [0.16 * w, 0.93 * h], [0, h]];
  return { outline: mirror(half), vein: [[0, 0.02 * h], [0.01 * w, 0.5 * h], [0, 0.8 * h]], branches: [[0.36, 0.5, 1], [0.48, 0.66, -1], [0.6, 0.76, 1]].map(([a, b, s]) => [[0, a * h], [s * 0.26 * w, b * h]]) };
}
// a paper tree: two crossed sheets of that outline, its vein and branch strokes in ink, swaying from its foot
function paperTree(c, x, y, z, h, w, round, m) {
  const t = treeLines(h, w, round);
  for (const fr of [FR.yz(x, z, y), FR.xy(z, x, y)]) { c.sheet(fr, t.outline, { m, edge: 1.3 }); c.ink(fr, t.vein, c.w * 1.2, { m }); for (const b of t.branches) c.ink(fr, b, 0, { m }); }
}
// 5 THE HUT, 5.0 by 4.5 with its chimney: plank walls, a roof whose ridge lies across the stair, one vermilion door, a lit window, paper smoke
const SMOKE = { y: 5.1, z: 1.3, r: 0.41, rise: 0.9, dx: 0.3, dz: 3.9, top: 6.34 };   // the curls' birth over the tread and to the side, the sheet's radius (0.85 of it is the largest it is drawn), the rise, the drift, the height nothing passes
THINGS.push(async function hut(ctx, style) {
  const k = 5, X = thingX(k), Y = treadTop(k), c = style.card(k, Y, Y + 5.0), P = style.palette, hw = 2.25, hd = 1.6, wall = 2.4, ridge = 3.9;
  const front = FR.yz(X - hd, 0, Y), backF = FR.yz(X + hd, 0, Y);
  c.rect(front, -hw, 0, hw, wall, { edge: 1.4, holes: [[[0.5, 1.0], [1.5, 1.0], [1.5, 1.9], [0.5, 1.9]]] }); c.rect(backF, -hw, 0, hw, wall, { edge: 1.4 });
  c.rect(FR.yz(X - hd * 0.4, 0, Y), -hw, 0, hw, wall, { col: P.hot });                                         // the lit inside behind the cut window
  c.ink(front, [[1.0, 1.0], [1.0, 1.9]], 0); c.ink(front, [[0.5, 1.45], [1.5, 1.45]], 0);
  c.rect(FR.yz(X - hd - 0.01, 0, Y), -1.35, 0, -0.4, 1.85, { col: P.vermilion, layer: 1, edge: 1.2 }); c.sheet(FR.yz(X - hd - 0.02, 0, Y), disc(-0.55, 0.9, 0.05, 6), { col: P.ink, layer: 1 });
  for (const v of [0.6, 1.2, 1.8]) for (const fr of [front, backF]) { c.ink(fr, [[-hw, v], [-1.4, v]], 0); if (fr === backF) c.ink(fr, [[-1.3, v], [hw, v]], 0); else if (v < 0.9 || v > 1.95) c.ink(fr, [[-0.35, v], [hw, v]], 0); else c.ink(fr, [[1.55, v], [hw, v]], 0); }
  for (const s of [-1, 1]) { const g = FR.xy(s * hw, X, Y); c.sheet(g, [[-hd, 0], [hd, 0], [hd, wall], [0, ridge - 0.1], [-hd, wall]], { edge: 1.4 }); for (const v of [0.6, 1.2, 1.8]) c.ink(g, [[-hd, v], [hd, v]], 0); }
  for (const s of [-1, 1]) {                                                                                   // the roof: two slopes, shingle courses
    const fr = FR.of([X + s * 1.95, Y + 2.25, 0], [0, 0, 1], [-s * 1.95, ridge - 2.25, 0]), L = Math.hypot(1.95, ridge - 2.25);
    c.rect(fr, -2.6, 0, 2.6, L + 0.04, { edge: 1.5 });
    for (let i = 1; i <= 3; i++) { c.ink(fr, [[-2.6, L * i / 4], [2.6, L * i / 4]], 0); for (let j = 0; j < 6; j++) c.ink(fr, [[-2.2 + j * 0.86 + (i % 2) * 0.43, L * (i - 1) / 4 + 0.08], [-2.2 + j * 0.86 + (i % 2) * 0.43, L * i / 4 - 0.06]], c.w * 0.7); }
  }
  c.box(X - 0.3, X + 0.3, Y + 3.1, Y + 5.0, 1.0, 1.6, { edge: 1.2 }); c.ink(FR.yz(X - 0.3, 0, Y), [[1.0, 4.7], [1.6, 4.7]], 0);       // the chimney
  // paper smoke: five small curls (0.35 m at their largest) that leave the chimney one after another, rise what room there is
  // under the riser behind (SMOKE.rise, to SMOKE.top at the most: 2 r is 6.40) and then drift level to +z (never over the flown
  // line), dwindling to nothing as they go, and begin again
  const curl = []; for (let i = 0; i <= 14; i++) { const a = i * 0.5, r = SMOKE.r * (0.94 - 0.056 * i); curl.push([r * Math.cos(a), r * Math.sin(a)]); }
  for (let i = 0; i < 5; i++) {
    const m = c.motion({ kind: 3, pivot: [X, Y + SMOKE.y, SMOKE.z], axis: [SMOKE.dx, SMOKE.rise, SMOKE.dz], amp: 1, freq: 1 / 7.5, phase: i / 5, flutDir: [1, 0, 0], flutFreq: 1.3, flutPhase: i * 2 });
    const fr = FR.yz(X + (i - 2) * 0.02, SMOKE.z, Y + SMOKE.y);
    c.sheet(fr, disc(0, 0, SMOKE.r, 12), { m, flut: (u, v) => 0.25 * u, edge: 1.2 }); c.ink(fr, curl, c.w * 1.3, { m, flut: (u, v) => 0.25 * u });
  }
  const tm = c.motion({ kind: 1, pivot: [X + 0.6, Y, -5.2], axis: [1, 0, 0], amp: 0.035, freq: 0.8, phase: 2 });
  paperTree(c, X + 0.6, Y, -5.2, 4.6, 3.4, true, tm);
  return done('hut', c, 0.4, { smoke: { from: [X, Y + SMOKE.y, SMOKE.z], to: [X + SMOKE.dx, Y + SMOKE.y + SMOKE.rise, SMOKE.z + SMOKE.dz], radius: 0.35, top: Y + SMOKE.top, note: 'curls of 0.35 m at the most rise from the first point and drift level to the second; nothing of them stands over top' } });
});

// 6 THE WINDMILL, 12.2 m to the upper sail tip: a tapered tower, a cap, four lattice sails 11 m across turning in the plane across the stair
THINGS.push(async function windmill(ctx, style) {
  const k = 6, X = thingX(k), Y = treadTop(k), c = style.card(k, Y, Y + 12.2), P = style.palette, hub = 6.7, sx = X - 1.75;
  const tower = mirror([[2.0, 0], [1.3, 6.2], [1.55, 6.35], [1.2, 7.3], [0.5, 7.75]]);
  for (const fr of [FR.yz(X - 1.2, 0, Y), FR.yz(X + 1.2, 0, Y), FR.xy(-0.0, X, Y)]) {
    c.sheet(fr, tower, { edge: 1.5 });
    for (const v of [1.5, 3.0, 4.5]) { const w = 2.0 - 0.7 * v / 6.2; c.ink(fr, [[-w, v], [w, v]], 0); }
    c.ink(fr, [[-1.3, 6.2], [1.3, 6.2]], c.w * 1.2);
  }
  const f = FR.yz(X - 1.22, 0, Y);
  c.sheet(f, [[-0.5, 0], [0.5, 0], [0.5, 1.3], [0, 1.75], [-0.5, 1.3]], { col: P.ink, layer: 1 });                 // a dark door, an arch
  for (const v of [2.3, 3.8]) { c.rect(f, -0.28, v, 0.28, v + 0.6, { col: P.hot, layer: 1, edge: 1 }); c.ink(f, [[0, v], [0, v + 0.6]], c.w * 0.7); }
  c.sheet(FR.xz(Y + 3.0, X, 0), disc(0, 0, 2.5, 8, Math.PI / 8), { edge: 1.3, holes: [disc(0, 0, 1.55, 8, Math.PI / 8)] });   // the gallery
  const m = c.motion({ kind: 2, pivot: [sx, Y + hub, 0], axis: [1, 0, 0], freq: 0.42, phase: 0.3 }), sf = FR.yz(sx, 0, Y + hub);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a), T = (p) => p.map((q) => [q[0] * ca - q[1] * sa, q[0] * sa + q[1] * ca]);
    const holes = []; for (let r = 0; r < 5; r++) for (let q = 0; q < 2; q++) holes.push(T([[0.22 + q * 0.6, 1.25 + r * 0.82], [0.7 + q * 0.6, 1.25 + r * 0.82], [0.7 + q * 0.6, 1.93 + r * 0.82], [0.22 + q * 0.6, 1.93 + r * 0.82]]));
    c.sheet(sf, T([[0.08, 1.1], [1.44, 1.1], [1.44, 5.5], [0.08, 5.5]]), { m, holes, edge: 1.1 });
    c.sheet(sf, T([[-0.12, 0], [0.12, 0], [0.1, 5.5], [-0.1, 5.5]]), { m, edge: 1.2 });
  }
  c.sheet(FR.yz(sx - 0.02, 0, Y + hub), disc(0, 0, 0.36, 8), { col: P.vermilion, layer: 1, m, edge: 1 });
  c.ink(FR.xy(0, X, Y + hub), [[-1.75, 0], [-1.2, 0]], c.w * 2, { exact: true, even: true });
  const t1 = c.motion({ kind: 1, pivot: [X + 2, Y, 9.5], axis: [1, 0, 0], amp: 0.03, freq: 0.7, phase: 0.5 }), t2 = c.motion({ kind: 1, pivot: [X + 3.5, Y, 12.6], axis: [1, 0, 0], amp: 0.035, freq: 0.75, phase: 2.2 });
  paperTree(c, X + 2, Y, 9.5, 9.6, 2.9, false, t1); paperTree(c, X + 3.5, Y, 12.6, 7.4, 2.4, false, t2);
  return done('windmill', c, 0.5, { sails: { hub: [sx, Y + hub, 0], radius: 5.5, plane: 'x = ' + sx.toFixed(2), tipTop: Y + hub + 5.5 } });
});

// 7 THE SHIP UNDER SAIL, lying across the stair: 30 m long, three masts to 24 m, nine sails that fill and slacken, a vermilion pennant,
// five sliding sheets of paper waves. Our own vessel: a high lantern stern, a stepped deck, a long beak.
THINGS.push(async function ship(ctx, style) {
  const k = 7, X = thingX(k), Y = treadTop(k), c = style.card(k, Y, Y + 24), P = style.palette, reefed = style.rng.chance(0.4);
  const hull = [[-13.8, 6.5], [-8.6, 6.2], [-8.6, 4.4], [7.6, 4.2], [7.8, 5.1], [12.4, 5.2], [14.6, 6.0], [11.4, 2.4], [9.4, 1.0], [-10.5, 1.0], [-12.9, 2.5]];
  const rock = (ph, ff) => c.motion({ kind: 1, pivot: [X, Y + 2, 0], axis: [1, 0, 0], amp: 0.022, freq: 0.55, phase: 0.7, flutDir: [1, 0, 0], flutFreq: ff, flutPhase: ph, flutBias: 1.25 });
  const M = [rock(0, 0.5), rock(1.9, 0.43), rock(3.7, 0.57)], mh = M[1];
  for (const s of [-1, 1]) {
    const fr = FR.of([X + s * 1.5, Y, 0], [0, 0, 1], [s * 0.2, 1, 0]);
    c.sheet(fr, hull, { m: mh, edge: 1.6 });
    c.ink(fr, [[-12.6, 3.9], [-4, 3.3], [6, 3.3], [12.6, 4.4]], c.w * 1.3, { m: mh }); c.ink(fr, [[-12.2, 2.9], [-4, 2.3], [6, 2.3], [11.6, 3.2]], 0, { m: mh });
    for (let i = 0; i < 6; i++) c.rect(fr, -6.6 + i * 2.3, 3.45, -5.7 + i * 2.3, 4.05, { col: P.hot, layer: 1, m: mh, edge: 0.9 });      // lit ports
    for (let i = 0; i < 3; i++) c.rect(fr, -12.6 + i * 1.3, 4.7, -11.8 + i * 1.3, 5.7, { col: P.hot, layer: 1, m: mh, edge: 0.9 });      // the stern cabin's lights
  }
  c.rect(FR.xz(Y + 4.3, X, 0), -8.6, -2.3, 7.8, 2.3, { m: mh }); c.rect(FR.xz(Y + 6.3, X, 0), -13.6, -2.6, -8.6, 2.6, { m: mh }); c.rect(FR.xy(-13.5, X, Y), -2.4, 2.8, 2.4, 6.5, { m: mh, edge: 1.3 });
  const f0 = FR.yz(X, 0, Y);
  c.ink(f0, [[12.4, 5.3], [15.6, 7.0]], c.w * 1.6, { m: mh, exact: true });                                                    // the beak
  const masts = [[-7.6, 20.4, 0.86], [0.6, 24, 1], [8.4, 22.2, 0.92]];
  masts.forEach(([u, top, sc], i) => {
    const m = M[i], base = u < -8 ? 6.3 : 4.3;
    c.sheet(f0, [[u - 0.2, base], [u + 0.2, base], [u + 0.09, top], [u - 0.09, top]], { m, edge: 1 });
    const sf = FR.yz(X - 0.45, 0, Y);
    let v = base + 2.1;
    [[8.2, 4.7], [6.6, 4.2], [5.0, 3.4]].forEach(([w, h], tier) => {
      w *= sc; h *= sc; const furl = reefed && tier === 2, hh = furl ? 0.7 : h, v1 = v + h, v0 = v1 - hh, amp = furl ? 0.05 : 0.1 * w;
      const fl = (uu, vv) => amp * Math.sin(Math.PI * Math.min(1, Math.max(0, (uu - (u - w / 2)) / w))) * Math.sin(Math.PI * Math.min(1, Math.max(0, 0.12 + 0.88 * (v1 - vv) / hh)) * 0.62);
      const xs = [0, 0.25, 0.5, 0.75, 1].map((t) => u - w / 2 + w * t), ys = [0, 0.4, 0.75, 1].map((t) => v1 - hh * t), dip = (t) => (furl ? 0 : 0.22 * h * Math.sin(Math.PI * t));
      const pt = (a, b) => [xs[a], ys[b] + (b === 3 ? dip(a / 4) : 0)];
      for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) c.sheet(sf, [pt(a, b), pt(a + 1, b), pt(a + 1, b + 1), pt(a, b + 1)], { m, flut: fl });
      c.ink(sf, [pt(0, 0), pt(0, 1), pt(0, 2), pt(0, 3), pt(1, 3), pt(2, 3), pt(3, 3), pt(4, 3), pt(4, 2), pt(4, 1), pt(4, 0)], c.w * 1.3, { m, flut: fl, exact: true });
      if (!furl) for (const a of [1, 2, 3]) c.ink(sf, [pt(a, 0), pt(a, 1), pt(a, 2), pt(a, 3)], c.w * 0.8, { m, flut: fl, exact: true });
      c.ink(f0, [[u - w / 2 - 0.4, v1 + 0.08], [u + w / 2 + 0.4, v1 + 0.08]], c.w * 1.9, { m, exact: true, even: true });        // the yard
      v = v1 + 0.5 * sc;
    });
    for (const s of [-1, 1]) c.ink(f0, [[u, top - 2.5], [u + s * 2.6, base + 0.2]], c.w * 0.8, { m });                       // shrouds
  });
  c.ink(f0, [[0.6, 23.6], [15.4, 6.9]], c.w * 0.8, { m: mh }); c.ink(f0, [[-7.6, 20], [-13.6, 6.6]], c.w * 0.8, { m: mh }); c.ink(f0, [[-7.6, 20.2], [0.6, 23.4], [8.4, 22]], c.w * 0.7, { m: mh });
  const pm = c.motion({ kind: 1, pivot: [X, Y + 2, 0], axis: [1, 0, 0], amp: 0.022, freq: 0.55, phase: 0.7, flutDir: [1, 0, 0], flutFreq: 3.1 });
  c.sheet(f0, [[0.6, 23.9], [0.6, 22.7], [-3.4, 23.2]], { col: P.vermilion, m: pm, flut: (u) => (0.6 - u) * 0.16, edge: 1 });
  // the sea: five sheets of paper waves, scalloped, sliding to and fro along the ship
  [[-6.4, 1.5, 0.5, 0], [-3.6, 2.3, 0.37, 2], [1.2, 2.9, 0.44, 4], [4.2, 2.5, 0.33, 1], [6.8, 1.8, 0.47, 3]].forEach(([dx, h, f, ph], i) => {
    const m = c.motion({ kind: 4, axis: [0, 0, 1], amp: 1.7, freq: f, phase: ph }), fr = FR.yz(X + dx, 0, Y), n = 13, L = 21 - Math.abs(dx) * 0.6, top = [];
    for (let j = 0; j <= n * 4; j++) { const t = j / (n * 4), q = (j % 4) / 4; top.push([L - 2 * L * t, h * (0.62 + 0.38 * Math.pow(Math.abs(Math.sin(Math.PI * (q + (i % 2) * 0.5))), 0.7)) * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, Math.max(0, t * 1.0))) ** 0.5)]); }
    c.sheet(fr, [[-L, 0], [L, 0], ...top], { m }); c.ink(fr, top, c.w * 1.2, { m, exact: true });
    for (let j = 0; j < n; j++) { const u = L - 2 * L * (j + 0.5 + (i % 2) * 0.5) / n; if (Math.abs(u) < L - 2) c.ink(fr, [[u - 0.9, h * 0.34], [u, h * 0.2], [u + 0.9, h * 0.34]], c.w * 0.8, { m }); }
  });
  return done('ship', c, 2.2, { reefed, mastTop: Y + 24, masts: masts.map((q) => [X, Y + q[1], q[0]]), sails: { plane: 'x = ' + (X - 0.45).toFixed(2), bowTo: [X - 0.45 + 0, 0, 0], maxBow: 0.1 * 8.2 * 2.25 }, waves: { x0: X - 6.4, x1: X + 6.8, slide: 1.7, top: Y + 2.9 } });
});

// 8 THE VIADUCT across the stair: 100 m long, 40 m high with its train, six pointed arches; an engine and seven carriages cross it
THINGS.push(async function viaduct(ctx, style) {
  const k = 8, X = thingX(k), Y = treadTop(k), c = style.card(k, Y, Y + 40), P = style.palette, pitch = VIADUCT.pitch, pier = 3.6, spring = 19, apex = 31, deck = VIADUCT.deck, half = VIADUCT.half;
  const arch = (zc) => { const a = (pitch - pier) / 2, p = [[zc - a, 0], [zc + a, 0], [zc + a, spring]]; for (let i = 1; i < 6; i++) { const t = i / 6, an = t * Math.PI / 3; p.push([zc - a + 2 * a * Math.cos(an), spring + (apex - spring) * Math.sin(an) / Math.sin(Math.PI / 3)]); } p.push([zc, apex]); for (let i = 5; i >= 1; i--) { const t = i / 6, an = t * Math.PI / 3; p.push([zc + a - 2 * a * Math.cos(an), spring + (apex - spring) * Math.sin(an) / Math.sin(Math.PI / 3)]); } p.push([zc - a, spring]); return p; };
  const holes = []; for (let i = 0; i < 6; i++) holes.push(arch(-50 + pitch * (i + 0.5)));
  for (const s of [-1, 1]) {
    const fr = FR.yz(X + s * half, 0, Y);
    c.sheet(fr, [[-50, 0], [50, 0], [50, deck + 1.6], [-50, deck + 1.6]], { holes, edge: 1.5 });
    c.ink(fr, [[-50, deck - 1.2], [0, deck - 1.25], [50, deck - 1.2]], c.w * 1.5); c.ink(fr, [[-50, deck + 0.4], [50, deck + 0.4]], 0);
    for (let i = 0; i <= 6; i++) {
      const z = -50 + pitch * i, a = i === 0 ? 0 : -pier / 2, b = i === 6 ? 0 : pier / 2;
      for (const v of [3.2, 6.4, 9.6, 12.8, 16]) c.ink(fr, [[z + a + 0.2, v], [z + b - 0.2, v]], 0);
      c.ink(fr, [[z + a, spring], [z + b, spring]], c.w * 1.4); c.ink(fr, [[z, spring + 1.5], [z, deck - 2.2]], 0);
      for (let j = 0; j < 4; j++) c.ink(fr, [[z + (j - 1.5) * 1.0, deck + 0.5], [z + (j - 1.5) * 1.0, deck + 1.5]], c.w * 0.7);
    }
    for (let i = 0; i < 6; i++) { const h = holes[i]; c.ink(fr, scl(h.slice(2, 14), 1.0, 0, 1.3).map((q, j) => [q[0] + (j < 6 ? 0.9 : j > 6 ? -0.9 : 0), q[1]]), 0); }   // the arch rings
  }
  // A PIER'S SIDE under an arch is inked down its two arrises and along its foot, NOT ALONG ITS TOP (the outline's gap): there the arch's
  // underside springs from it, paper to paper, and the outline's ink on that fold would lie half under the underside and, by the corners'
  // mitre on a sheet 8 m by 19 m, 0.39 of its breadth across: a hairline. All twelve sides alike; the fine joints carry the fold.
  // (the sides of the two piers of the arch we fly through, OURS, carry no strong course: close to the eye its ends read as slashes, and
  // there the fine joints carry the face; the stream moves on by the draws those two lines would take)
  const pass = (n) => { for (let i = 0; i < n; i++) style.rng(); }, OURS = (i, s) => (i === 2 && s > 0) || (i === 3 && s < 0);
  for (let i = 0; i <= 6; i++) for (const s of [-1, 1]) { const z = -50 + pitch * i + s * pier / 2; if (Math.abs(z) < 50) { const g = FR.xy(z, X, Y); c.rect(g, -half, 0, half, spring, { edge: 1.1, gap: 3 }); for (const v of [6.4, 12.8]) if (OURS(i, s)) pass(3); else c.ink(g, [[-half, v], [half, v]], 0); } }
  c.rect(FR.xz(Y + deck, X, 0), -50, -half, 50, half, {}); for (const s of [-1, 1]) c.rect(FR.xy(s * 50, X, Y), -half, 0, half, deck, { edge: 1.2 });
  await ctx.yield();
  // ITS BLOCKS. Each arch is closed overhead by its underside (paper, from the springing to the apex, between the two faces), and the
  // piers, the spandrels, the rings' fronts and the undersides carry the joints of their blocks in JOINT INK (the card's joint(): pale ink
  // of its true breadth, gone where it would be under 0.35 of a pixel broad, so that from afar the viaduct is clean paper with its
  // few courses): level courses J.h apart and blocks J.len long breaking bond; on the rings and the undersides the joints run with the
  // arch, J.n voussoirs to a side. The strong courses already drawn on the piers are every fifth of these.
  const J = { h: 0.64, len: 1.28, w: 0.05, n: 18, ring: [0.9, 1.3], col: P.paper.clone().lerp(P.ink, 0.5) }, a0 = (pitch - pier) / 2, sk = (apex - spring) / Math.sin(Math.PI / 3), top = deck + 1.6;
  const halfOpen = (v) => v <= spring ? a0 : v >= apex ? 0 : -a0 + 2 * a0 * Math.cos(Math.asin((v - spring) / sk));                            // an opening's half breadth at a height
  const halfRing = (v) => v < spring ? a0 : v > apex + J.ring[1] ? -1 : halfOpen(Math.max(spring, v - J.ring[1])) + J.ring[0];                  // and its ring's (none over the ring's top)
  const onArc = (zc, sg, an) => [zc + sg * (-a0 + 2 * a0 * Math.cos(an)), spring + sk * Math.sin(an)];                                         // a point of an arch's curve, an from 0 (the springing) to a sixth of a turn (the apex)
  for (let i = 0; i < 6; i++) for (const sg of [-1, 1]) for (let m = 0; m < 6; m++) {                                                          // the undersides, six flat pieces to a side, and their joints
    const zc = -50 + pitch * (i + 0.5), A = onArc(zc, sg, m * Math.PI / 18), B = onArc(zc, sg, (m + 1) * Math.PI / 18), ls = Math.hypot(B[0] - A[0], B[1] - A[1]), g = FR.of([X - half, Y + A[1], A[0]], [1, 0, 0], [0, B[1] - A[1], B[0] - A[0]]);
    c.rect(g, 0, 0, 2 * half, ls, {});
    for (let q = 0; q < 3; q++) { const t = m * 3 + q, f0 = q / 3 * ls, f1 = (q + 1) / 3 * ls; if (t > 0) c.joint(g, 0, f0, 2 * half, f0, J.w, J.col); for (let u = J.len * (t % 2 ? 1 : 0.5); u < 2 * half - 0.2; u += J.len) c.joint(g, u, f0, u, f1, J.w, J.col); }
  }
  for (const s of [-1, 1]) {                                                                                                                   // the two faces: courses, bond, and the rings' voussoirs
    const fr = FR.yz(X + s * half, 0, Y);
    for (let j = 1; j * J.h < top - 0.2; j++) {
      const v = j * J.h, hr = halfRing(v); if (j % 5 === 0 && v < spring) continue; let u = -50;
      if (hr >= 0) for (let i = 0; i < 6; i++) { const zc = -50 + pitch * (i + 0.5); c.joint(fr, u, v, zc - hr, v, J.w, J.col); u = zc + hr; }
      c.joint(fr, u, v, 50, v, J.w, J.col);
    }
    for (let j = 0; (j + 1) * J.h < top; j++) {
      const v0 = j * J.h, v1 = v0 + J.h, hr = Math.max(halfRing(v0), halfRing(v1)) + 0.05;
      for (let u = -50 + J.len * (j % 2 ? 1 : 0.5); u < 50 - 0.2; u += J.len) { const d = Math.abs(((u + 50) % pitch + pitch) % pitch - pitch / 2); if (d >= hr) c.joint(fr, u, v0, u, v1, J.w, J.col); }
    }
    for (let i = 0; i < 6; i++) { const zc = -50 + pitch * (i + 0.5);
      for (const sg of [-1, 1]) for (let t = 1; t < J.n; t++) { const an = t / J.n * Math.PI / 3, q = onArc(zc, sg, an), lr = J.ring[0] * Math.cos(an) + J.ring[1] * Math.sin(an); c.joint(fr, q[0], q[1], q[0] + sg * Math.cos(an) * lr, q[1] + Math.sin(an) * lr, J.w, J.col); }
      c.joint(fr, zc, apex, zc, apex + J.ring[1], J.w, J.col);
    }
  }
  await ctx.yield();
  for (let i = 0; i <= 6; i++) for (const s of [-1, 1]) {                                                                                      // the piers' sides under the arches
    const z = -50 + pitch * i + s * pier / 2; if (Math.abs(z) >= 50) continue; const g = FR.xy(z, X, Y);
    for (let j = 1; j * J.h < spring; j++) if (j % 10 || OURS(i, s)) c.joint(g, -half, j * J.h, half, j * J.h, J.w, J.col);
    for (let j = 0; (j + 1) * J.h < spring; j++) for (let u = -half + J.len * (j % 2 ? 1 : 0.5); u < half - 0.2; u += J.len) c.joint(g, u, j * J.h, u, (j + 1) * J.h, J.w, J.col);
  }
  // THE HAND'S STREAM is one for the whole stair (every ink line takes its swell and overshoot from it, and the town and the birds their deal).
  // The deck's top and the roofs' slopes are never seen from above and carry no lines; the stream still moves on here by the draws such
  // lines would take (one for a ruled line, three for a free one), so that every thing built after this keeps its own hand and deal by seed.
  pass(2 + 41);
  await ctx.yield();
  // the train (TRAIN): an engine and seven carriages of lit paper, windows cut through, three puffs of paper steam. IT GOES ROUND: one way,
  // engine first, off the viaduct into the gatehouse at one end and on again out of the gatehouse at the other, one round every
  // 14 s by the world's clock (a run-and-come-round motion: what has passed the gatehouse's dark mouth is cut off there).
  const T = TRAIN, ty = T.floor, car = T.car, gap = T.gap, n = T.n, L = T.len, mouth = T.mouth, gh = deck + 12;
  const slide = { kind: 7, pivot: [X, 0, 0], axis: [0, 0, 1], amp: T.amp, freq: 1 / T.period, phase: T.phase, clip: mouth }, tm = c.motion(slide);
  for (const s of [-1, 1]) {                                                                             // the two gatehouses: a tower on the end pier, a pointed mouth over the rails
    for (const sx of [-1, 1]) { const fr = FR.yz(X + sx * half, 0, Y); c.rect(fr, Math.min(s * 50, s * 56), 0, Math.max(s * 50, s * 56), gh, { edge: 1.3 }); for (const v of [6.4, 12.8, 19, 25.6, deck - 1.2, deck + 1.6]) c.ink(fr, [[s * 50, v], [s * 56, v]], 0); c.ink(fr, [[s * 53, deck + 4], [s * 53, deck + 8.5]], c.w * 1.6); }
    c.sheet(FR.xy(s * 56, X, Y), [[-half, 0], [half, 0], [half, gh], [0, gh + 2.6], [-half, gh]], { edge: 1.2 });
    c.sheet(FR.xy(s * 50, X, Y), [[-half, deck], [half, deck], [half, gh], [0, gh + 2.6], [-half, gh]], { holes: [lancet(0, 2.1, ty, ty + 3.9, ty + 5.6, 3)], edge: 1.2, holeEdge: 1.1 });
    c.rect(FR.xy(s * (mouth + 0.1), X, Y), -half + 0.2, deck, half - 0.2, gh - 0.3, { col: P.ink, layer: 1 });      // the mouth's dark
    for (const sx of [-1, 1]) { const rf = FR.of([X + sx * half, Y + gh, s * 53], [0, 0, 1], [-sx * half, 2.6, 0]), rl = Math.hypot(half, 2.6); c.sheet(rf, [[-3, 0], [3, 0], [3, rl], [-3, rl]], { edge: 1 }); pass(2 * 3); }   // its roof
  }
  for (let i = 0; i < n; i++) {
    const z0 = -L / 2 + i * (car + gap), eng = i === n - 1;
    for (const s of [-1, 1]) {
      const fr = FR.yz(X + s * 1.25, 0, Y);
      if (eng) { c.sheet(fr, [[z0, ty], [z0 + car, ty], [z0 + car + 0.5, ty + 0.9], [z0 + car, ty + 2.2], [z0 + 2.4, ty + 2.2], [z0 + 2.4, ty + 3.3], [z0, ty + 3.3]], { m: tm, edge: 1.2 }); c.rect(fr, z0 + 0.5, ty + 1.9, z0 + 1.8, ty + 2.9, { col: P.hot, layer: 1, m: tm, edge: 0.8 }); c.sheet(fr, disc(z0 + 3.6, ty + 0.75, 0.6, 8), { col: P.vermilion, layer: 1, m: tm, edge: 0.8 }); }
      else { c.rect(fr, z0, ty, z0 + car, ty + 3.0, { m: tm, edge: 1.2 }); for (let j = 0; j < 3; j++) c.rect(fr, z0 + 0.55 + j * 1.45, ty + 1.35, z0 + 1.55 + j * 1.45, ty + 2.4, { col: P.hot, layer: 1, m: tm, edge: 0.8 }); c.ink(fr, [[z0, ty + 0.9], [z0 + car, ty + 0.9]], 0, { m: tm }); }
    }
    c.rect(FR.xz(Y + ty + (eng ? 2.2 : 3.0), X, 0), z0, -1.25, z0 + car, 1.25, { m: tm, edge: 1 });
    if (eng) c.box(X - 0.4, X + 0.4, Y + ty + 2.2, Y + ty + 3.9, z0 + 3.6, z0 + 4.4, { m: tm, edge: 1 });
  }
  const ez = L / 2 - 1.0;
  for (let i = 0; i < 3; i++) {
    const m = c.motion({ ...slide, flutDir: [0, 1, 0], flutFreq: 1.6, flutPhase: i * 2.1 }), r = 1.1 + i * 0.45, fr = FR.yz(X, 0, Y), u = ez - i * 2.3, v = ty + 5.2 + i * 1.9;
    c.sheet(fr, disc(u, v, r, 10), { m, flut: () => 0.45, edge: 1.1 }); c.ink(fr, [[u - r * 0.5, v - r * 0.1], [u, v + r * 0.4], [u + r * 0.45, v]], 0, { m, flut: () => 0.45 });
  }
  return done('viaduct', c, 1.0, { top: Y + deck + 1.6, train: { y0: Y + ty, y1: Y + ty + 3.9, steamTop: Y + ty + 5.2 + 3.8 + 1.65 + 0.45, zRange: [-mouth, mouth], period: 14, note: 'one way and round: off into one gatehouse, on from the other, one round every 14 s' }, gatehouseTop: Y + gh + 2.6 });
});

// MASONRY: the courses of a paper wall drawn in ink (level strokes a course apart, upright joints staggered row by row, a few
// left out as a hand would), broken at the wall's openings. o: holes (outlines), clip (u, v) => on the sheet, pad, joint, w.
const inPoly = (u, v, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a[1] > v) !== (b[1] > v) && u < (b[0] - a[0]) * (v - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
function masonry(c, fr, u0, u1, v0, v1, h, o = {}) {
  const pad = o.pad ?? 0.35, w = o.w || c.w * 0.75, jl = o.joint || 2.4 * h;
  const boxes = (o.holes || []).map((hl) => { let a = 1e9, b = -1e9, d = 1e9, e = -1e9; for (const q of hl) { a = Math.min(a, q[0]); b = Math.max(b, q[0]); d = Math.min(d, q[1]); e = Math.max(e, q[1]); } return { hl, a: a - pad, b: b + pad, d: d - pad, e: e + pad }; });
  const free = (u, v) => { if (o.clip && !o.clip(u, v)) return false; for (const bx of boxes) if (u > bx.a && u < bx.b && v > bx.d && v < bx.e && (inPoly(u, v, bx.hl) || inPoly(u - pad, v, bx.hl) || inPoly(u + pad, v, bx.hl) || inPoly(u, v - pad, bx.hl) || inPoly(u, v + pad, bx.hl))) return false; return true; };
  let row = 0;
  for (let v = v0 + h; v < v1 - 0.2 * h; v += h, row++) {
    let a = null;
    for (let u = u0; u <= u1 + 1e-6; u += 0.5) { const f = free(u, v) && u < u1 - 0.2; if (f && a === null) a = u; else if (!f && a !== null) { if (u - 0.5 - a > 0.9) c.ink(fr, [[a + 0.1, v], [u - 0.6, v]], w); a = null; } }
  }
  row = 0;
  for (let v = v0; v < v1 - 0.6 * h; v += h, row++) for (let i = 0, u = u0 + jl * (0.3 + (row % 2) * 0.5); u < u1 - 0.3; u += jl, i++) if ((i * 7 + row * 13) % 10 >= 3 && free(u, v + 0.15 * h) && free(u, v + 0.85 * h)) c.ink(fr, [[u, v + 0.14 * h], [u, v + 0.86 * h]], w * 0.85, { exact: true });
}
// a pointed opening: a rectangle from v0 to the springing, then two arcs to the apex (the outline of every door, window and arch here)
function lancet(uc, half, v0, spring, apex, n = 5) {
  const p = [[uc - half, v0], [uc + half, v0], [uc + half, spring]], k3 = Math.sin(Math.PI / 3);
  for (let i = 1; i < n; i++) { const an = (i / n) * Math.PI / 3; p.push([uc - half + 2 * half * Math.cos(an), spring + (apex - spring) * Math.sin(an) / k3]); }
  p.push([uc, apex]);
  for (let i = n - 1; i >= 1; i--) { const an = (i / n) * Math.PI / 3; p.push([uc + half - 2 * half * Math.cos(an), spring + (apex - spring) * Math.sin(an) / k3]); }
  p.push([uc - half, spring]); return p;
}
const archLine = (uc, half, v0, spring, apex, n = 5) => lancet(uc, half, v0, spring, apex, n).slice(1);     // the same, as an open stroke from foot to foot

// 9 THE CATHEDRAL, part one: the west front with its two bell towers and the door we fly in by
THINGS.push(async function cathedralWest(ctx, style) {
  const k = 9, F = CATH, Y = F.floor, c = style.card(k, Y, Y + 95, 0.9), P = style.palette, X = F.x0, tz = F.towerZ, th = F.towerHalf, body = 76;
  const front = FR.yz(X, 0, Y), door = lancet(0, F.door.half, 0, F.door.spring, F.door.apex, 7);
  // the middle: a gable over the door, three lancets of tissue above it (no round window: the only rose is the way out)
  const lanc = [-4.2, 0, 4.2].map((u, i) => lancet(u, 1.5, 38, i === 1 ? 47.5 : 45.5, i === 1 ? 51 : 49, 3));
  const shim = c.motion({ kind: 6, amp: 0.26, freq: 2.2 });
  c.sheet(front, [[-15, 0], [15, 0], [15, 54], [0, 63], [-15, 54]], { holes: [door], edge: 1.6 });
  lanc.forEach((l, i) => { c.sheet(front, l, { col: i === 1 ? P.tissueVermilion : P.tissueBlue, layer: 1, edge: 0.28, m: shim, flut: () => i * 0.31 }); });
  for (const s of [1.12, 1.26]) c.ink(front, archLine(0, F.door.half * s, 0, F.door.spring, F.door.apex + (s - 1) * 14, 7), c.w * (s > 1.2 ? 0.9 : 1.2));
  c.ink(front, [[-15, 36], [15, 36]], c.w * 1.3); c.ink(front, [[-15, 54], [15, 54]], 0);
  for (let i = 0; i < 9; i++) { const u = -12.8 + i * 3.2; if (Math.abs(u) > 0.1) c.ink(front, archLine(u, 1.1, 54.6, 57.2, 59 - Math.abs(u) * 0.28, 2), c.w * 0.8); }
  // beside the door two tall windows of blue tissue, a mullion and two heads in each; the wall's courses in ink round them
  const flank = [-11.6, 11.6].map((u) => lancet(u, 1.9, 5, 25, 29.5, 4));
  flank.forEach((l, i) => { const u = i ? 11.6 : -11.6; c.sheet(front, l, { col: P.tissueBlue, layer: 1, edge: 0.35, m: shim, flut: () => 0.15 + 0.55 * i }); c.ink(front, [[u, 5], [u, 24.5]], c.w * 0.35); c.ink(front, archLine(u - 0.95, 0.95, 19, 23, 25.6, 2), c.w * 0.3); c.ink(front, archLine(u + 0.95, 0.95, 19, 23, 25.6, 2), c.w * 0.3); c.ink(front, [[u - 1.9, 12], [u + 1.9, 12]], c.w * 0.3); });
  masonry(c, front, -15, 15, 0, 36, 4, { holes: [lancet(0, F.door.half * 1.3, 0, F.door.spring, F.door.apex + 4.5, 7), ...flank] });
  masonry(c, front, -15, 15, 36, 54, 4.5, { holes: lanc, joint: 7 });
  await ctx.yield();
  // the towers: square, three stages, open belfries with a bell swinging in each, a spire of four sheets
  for (const s of [-1, 1]) {
    const zc = s * tz, faces = [FR.yz(X, zc, Y), FR.yz(X + 2 * th, zc, Y), FR.xy(zc - th, X + th, Y), FR.xy(zc + th, X + th, Y)];
    faces.forEach((fr, fi) => {
      const bel = [lancet(0, 4.3, 55, 66.5, 72.5, 4)];                         // the open belfry: one pointed opening to a face, the bell seen whole in it against the night
      c.sheet(fr, [[-th, 0], [th, 0], [th, body], [th - 1.2, body + 2.5], [-th + 1.2, body + 2.5], [-th, body]], { holes: bel, edge: 1.25, holeEdge: 0.25 });
      for (const v of [30, 52, 74]) c.ink(fr, [[-th, v], [th, v]], c.w * 1.2);
      for (const u of [-th + 1.3, th - 1.3]) c.ink(fr, [[u, 1], [u, 29]], 0);
      if (fi !== 1) { c.sheet(fr, lancet(0, 2.1, 33, 44, 48, 3), { col: fi === 0 ? P.tissueBlue : P.tissueVermilion, layer: 1, edge: 0.38, m: shim, flut: () => (fi * 0.23 + (s > 0 ? 0.5 : 0.1)) % 1 }); c.ink(fr, [[0, 33], [0, 47]], c.w * 0.38); c.sheet(fr, lancet(0, 1.7, 8, 20, 23.5, 3), { col: P.hot, layer: 1, edge: 0.3 }); }
      masonry(c, fr, -th, th, 0, 30, 5, { holes: fi !== 1 ? [lancet(0, 1.7, 8, 20, 23.5, 3)] : [], joint: 6 });
      masonry(c, fr, -th, th, 30, 52, 5.5, { holes: fi !== 1 ? [lancet(0, 2.1, 33, 44, 48, 3)] : [], joint: 6 });
      masonry(c, fr, -th, th, 52, 74, 5.5, { holes: bel, joint: 6 });
    });
    const tip = [X + th, Y + F.towerTop, zc], bx = X + th;
    for (const [O, U] of [[[bx, Y + body + 2.5, zc - th + 1.2], [1, 0, 0]], [[bx, Y + body + 2.5, zc + th - 1.2], [1, 0, 0]], [[X + 1.2, Y + body + 2.5, zc], [0, 0, 1]], [[X + 2 * th - 1.2, Y + body + 2.5, zc], [0, 0, 1]]]) {
      const Vv = [tip[0] - O[0], tip[1] - O[1], tip[2] - O[2]], L = Math.hypot(...Vv), fr = FR.of(O, U, Vv);
      c.sheet(fr, [[-th + 1.2, 0], [th - 1.2, 0], [0, L]], { edge: 1.05 }); c.ink(fr, [[-(th - 1.2) * 0.5, L * 0.5], [(th - 1.2) * 0.5, L * 0.5]], 0); c.ink(fr, [[0, 1], [0, L * 0.9]], c.w * 0.8);
    }
    const bm = c.motion({ kind: 1, pivot: [X + th, Y + 70.5, zc], axis: [1, 0, 0], amp: 0.5, freq: 1.15, phase: s > 0 ? 0 : 2.2 });
    const bell = mirror([[0.5, 0], [0.9, -1.2], [1.4, -3.6], [2.3, -5.2], [2.5, -6.0]]).map((q) => [q[0] * 1.4, q[1] * 1.4]);   // 7 m across, 8.4 m tall
    for (const fr of [FR.yz(X + th, zc, Y + 70.5), FR.xy(zc, X + th, Y + 70.5)]) { c.sheet(fr, bell, { m: bm, edge: 0.6 }); c.ink(fr, [[-2.66, -6.4], [2.66, -6.4]], c.w * 0.6, { m: bm }); c.ink(fr, [[-1.4, -2.4], [1.4, -2.4]], c.w * 0.5, { m: bm }); }
    c.sheet(FR.yz(X + th, zc, Y + 70.5), disc(0, -8.8, 0.8, 8), { col: P.ink, layer: 1, m: bm });
  }
  return done('cathedralWest', c, 1.0, { doorClear: { atLineHalfWidth: 6.9, apexAboveLine: F.door.apex - F.roseV }, bells: [[X + th, Y + 70.5, -tz], [X + th, Y + 70.5, tz]], towerTop: Y + F.towerTop });
});

// 9 THE CATHEDRAL, part two: the nave. ITS SHELL IS LIT PAPER, what is seen from outside: over the arcades a clerestory wall with a
// lancet of tissue to each bay, the paper vault that is its roof, each aisle's wall of tissue windows under a lean-to roof, the
// flying ribs and the crossing's lantern; and the east wall whose rose is the way out. INSIDE THE SHELL STANDS THE ROOM OF STONE
// (naveRoom, below): it hides the shell's inner face but for its glass and the rose's wall.
THINGS.push(async function cathedralNave(ctx, style) {
  const k = 9, F = CATH, Y = F.floor, c = style.card(k, Y, Y + 95, 0.16), P = style.palette, X = F.x0, nh = F.naveHalf, top = F.arcadeTop, len = F.x1 - F.x0;
  // INK ON THE NAVE'S PAPER (the law): no ink line is broader than a twelfth of the least breadth of the sheet it is drawn on, and it
  // is FINE ink, drawn at its true breadth (a pixel at the least, paler then). Only the east wall's outline and the rose's rings, on
  // a wall 52 m broad, and the clerestory windows' frames (TRACERY, a quarter of a metre) keep the heavier line. THE BEAT passes down
  // the nave bay by bay (ROW: 0.07 of a step to a metre from the door: the last bay takes it 5.3 steps after the door, and the east
  // wall with the rose's frame LAST, 5.6 steps, 2.8 s, after the door): on the paper by the one law of size (3.6 in 100), on the
  // tissue by its own.
  // THE AISLE WALL stands 20 m (AH) by the cathedral's own make; the aisle's lean-to roof runs from its head to the nave wall at RH,
  // over the arcade's arches. Inside, the night shows only through the rose's round opening and back through the door.
  // THE HAND'S STREAM: hand(n) moves the kit's stream on by n draws; the count is part of the deal: every stroke made after it,
  // here and on the later things, has its hand by it.
  const hand = (n) => { for (let i = 0; i < n; i++) style.rng(); };
  const ROW = 0.07, AH = F.aisleTop, RH = F.archApex + 1.7, HEAVY = 0.9, CL = F.archApex + 2, TRACERY = 0.25, WEST = 1.6; c.fine = 1; c.row = { x0: X, per: ROW };
  const sizeAmp = (m) => beatAmp(Math.log2(m / 0.185));     // the beat's swell by a thing's size (the candle 0.3 m a quarter, the cathedral 95 m 3.6 in 100)
  const shim = c.motion({ kind: 6, amp: 0.26, freq: 2.0, pivot: [X, 0, 0], axis: [1, 0, 0], beatK: k, beatPer: ROW, beatAmp: sizeAmp(13) }), tis = [P.tissueBlue, P.tissueVermilion];
  const piers = []; for (let i = 0; i <= 8; i++) piers.push(F.firstPier - X + F.bay * i);
  for (const s of [-1, 1]) {
    const fr = FR.xy(s * nh, X, Y), holes = [lancet(7, 3, 0, 25, 30, 4)];
    for (let i = 0; i < 8; i++) holes.push(lancet(piers[i] + F.bay / 2, F.bay / 2 - 1, 0, F.archSpring, F.archApex, 5));
    c.sheet(fr, [[WEST, 0], [len, 0], [len, top], [WEST, top]], { holes, edge: 1.3 });                // (from WEST: its west edge's ink, seen edge on, must not stand in the west front's paper)
    c.ink(fr, [[WEST, CL], [len / 2, CL + 0.05], [len, CL]], c.w * 2);                                     // the string course: the clerestory stands on it
    // between the towers the wall's tall opening is a screen of tissue: twelve leaded panes and a head, each pane shimmering by itself
    for (let q = 0; q < 2; q++) for (let r = 0; r < 6; r++) c.rect(fr, 4.12 + q * 3, 0.6 + r * 4.1, 6.88 + q * 3, 4.4 + r * 4.1, { col: (q * 2 + r + (s > 0 ? 2 : 0)) % 5 === 0 ? P.tissueVermilion : P.tissueBlue, layer: 1, m: shim, flut: () => (q * 0.43 + r * 0.19 + (s > 0 ? 0.31 : 0)) % 1 });
    c.sheet(fr, lancet(7, 2.88, 25.2, 25.25, 29.75, 4), { col: P.tissueBlue, layer: 1, m: shim, flut: () => (s > 0 ? 0.77 : 0.52) });
    c.ink(fr, [[7, 0.3], [7, 29.2]], c.w * 0.9, { exact: true }); for (let r = 1; r <= 6; r++) c.ink(fr, [[4.05, 0.5 + r * 4.1], [9.95, 0.5 + r * 4.1]], c.w * 0.8, { exact: true });
    for (let i = 0; i <= 8; i++) { const u = piers[i]; c.ink(fr, [[u - 1, F.archSpring], [u + 1, F.archSpring]], 0, { exact: true }); c.ink(fr, [[u - 1, F.archSpring - 1.1], [u + 1, F.archSpring - 1.1]], c.w * 0.7, { exact: true }); c.ink(fr, [[u - 1, 3], [u + 1, 3]], 0, { exact: true }); }   // a pier: its capital and its base; its shafts are the arches' mouldings
    const cler = [];
    for (let i = -1; i < 8; i++) {                                                                       // THE CLERESTORY: in each bay one tall lancet of tissue, the two tissues by turns, in a frame of ink TRACERY broad
      const u = i < 0 ? 7 : piers[i] + F.bay / 2, wl = lancet(u, 2.5, CL + 1.2, top - 5.6, top - 1.4, 4);
      c.sheet(fr, wl, { col: tis[(i + 1 + (s > 0 ? 1 : 0)) % 2], layer: 1, m: shim, flut: () => ((i + 1) * 0.61 + (s > 0 ? 0.3 : 0)) % 1 });
      c.ink(fr, wl, TRACERY, { closed: true, layer: 2, even: true });
      c.ink(fr, [[u, CL + 1.2], [u, top - 7.2]], c.w * 0.8, { exact: true });                                           // its mullion and its two lights' heads, in fine ink
      for (const d of [-1.25, 1.25]) c.ink(fr, archLine(u + d, 1.25, top - 9.6, top - 8.4, top - 6.4, 2), c.w * 0.7);
      cler.push(wl);
    }
    masonry(c, fr, 0, len, 0, top - 0.5, 3.7, { holes: holes.concat(cler), joint: 5.2, pad: 0.2 });
    for (let i = 0; i < 8; i++) c.ink(fr, archLine(piers[i] + F.bay / 2, F.bay / 2 - 0.45, 0.4, F.archSpring, F.archApex + 0.9, 5), c.w * 0.9);   // the arch's moulding: a shaft half a metre into the pier
    await ctx.yield();
    // the aisle wall: low, with windows of coloured tissue that shimmer
    const af = FR.xy(s * F.aisleZ, X, Y);
    c.sheet(af, [[14, 0], [len, 0], [len, AH], [14, AH]], { edge: 1.4 }); c.ink(af, [[14, 4], [len, 4]], 0);
    const awin = [];
    for (let i = 0; i < 8; i++) { const u = piers[i] + F.bay / 2, w = lancet(u, 2.9, 4.5, 13.5, 18, 3); c.sheet(af, w, { col: tis[(i + (s > 0 ? 1 : 0)) % 2], layer: 1, m: shim, flut: () => (i * 0.37 + (s > 0 ? 0.2 : 0)) % 1, edge: 1 }); c.ink(af, [[u, 4.5], [u, 14]], c.w * 0.8); c.ink(af, [[u - 2.9, 9.2], [u + 2.9, 9.2]], c.w * 0.7); c.ink(af, archLine(u - 1.45, 1.45, 9.2, 12.8, 15.6, 2), c.w * 0.7); c.ink(af, archLine(u + 1.45, 1.45, 9.2, 12.8, 15.6, 2), c.w * 0.7); awin.push(w); }
    masonry(c, af, 14, len, 0, AH, 3.3, { holes: awin, joint: 5.5 });
    // the aisle's lean-to roof, bay by bay, from the aisle wall's head to the nave wall at RH; west of the first pier it covers the
    // slot between the nave wall and the tower; a sheet closes the aisle's east end over the east wall's shoulder
    const slope = [0, RH - AH, s * (nh - F.aisleZ)], rl = Math.hypot(RH - AH, F.aisleZ - nh), slot = rl * (F.aisleZ - F.towerZ + F.towerHalf) / (F.aisleZ - nh);
    for (let i = -1; i < 8; i++) { const u0 = i < 0 ? 0 : piers[i], u1 = i < 0 ? piers[0] : piers[i + 1], rf = FR.of([X + u0, Y + AH, s * F.aisleZ], [1, 0, 0], slope); c.rect(rf, 0, i < 0 ? slot : 0, u1 - u0, rl, {}); if (i >= 0) c.ink(rf, [[0, 0], [0, rl]], c.w * 0.8, { exact: true }); }   // a rafter at each pier
    c.sheet(FR.of([X + len - 0.2, Y, 0], [0, 0, s], [0, 1, 0]), [[nh, AH - 0.5], [F.aisleZ, AH - 0.5], [F.aisleZ, AH], [nh, RH]], {});
    for (let i = 0; i <= 8; i++) {                                                                       // a flying rib from each aisle pier to the nave wall
      const u = piers[i], g = FR.of([X + u, Y, 0], [0, 0, s], [0, 1, 0]);
      c.sheet(g, [[25.4, 0], [27.4, 0], [27.4, AH + 6], [26.4, AH + 11], [25.4, AH + 6], [nh, 45], [nh, 41.5], [25.4, AH + 1.5]], { edge: 1 });
      c.ink(g, [[25.2, AH + 3.9], [18.2, 33.4], [11.2, 43.1]], c.w * 0.8, { exact: true });                           // the rib's profile: a bead along it, its voussoirs across
      for (let q = 1; q < 6; q++) { const t = q / 6, uu = 25.4 + (nh - 25.4) * t, vv = AH + 1.5 + 20 * t; c.ink(g, [[uu + 0.25, vv + 0.5], [uu + 0.25, vv + 3.6]], c.w * 0.6, { exact: true }); }
      for (const vv of [5, 10, 15, 20]) c.ink(g, [[25.5, vv], [27.3, vv]], c.w * 0.7, { exact: true });
    }
  }
  await ctx.yield();
  hand(64);
  await ctx.yield();
  hand(166);
  await ctx.yield();
  // THE VAULT: paper webs closed between the ribs, on the ribs' own outer line (springing at the wall's head, 12 m to the apex),
  // from the west front to the east wall; on each bay's webs the ridge, a line half way up either side and the two diagonal ribs
  // in fine ink. A crescent of paper at either end closes the vault against the gable under it.
  const vl = lancet(0, nh, top, top, 64, 6).slice(2);                                                   // from (+nh, top) over the apex to (-nh, top)
  for (let b = 0; b < 9; b++) for (let j = 0; j + 1 < vl.length; j++) {
    const a = vl[j], q = vl[j + 1], u0 = b ? piers[b - 1] : 0, bl = piers[b] - u0, sl = Math.hypot(q[0] - a[0], q[1] - a[1]), g = FR.of([X + u0, Y + a[1], a[0]], [1, 0, 0], [0, q[1] - a[1], q[0] - a[0]]);
    c.rect(g, 0, 0, bl, sl, {});
    const r = j < 6 ? j : 11 - j, e0 = bl / 2 * (j < 6 ? r : r + 1) / 6, e1 = bl / 2 * (j < 6 ? r + 1 : r) / 6;
    c.ink(g, [[e0, 0], [e1, sl]], c.w * 0.8, { exact: true }); c.ink(g, [[bl - e0, 0], [bl - e1, sl]], c.w * 0.8, { exact: true });
    if (j === 6) c.ink(g, [[0, 0], [bl, 0]], c.w, { exact: true }); else if (j === 3 || j === 9) c.ink(g, [[0, 0], [bl, 0]], c.w * 0.5, { exact: true });
    if (j === 5) await ctx.yield();
  }
  for (const u of [0.25, len - 0.25]) c.sheet(FR.yz(X + u, 0, Y), [[0, 62.3]].concat(vl), {});
  hand(57);
  // over the crossing, outside, a lantern of eight ribs; what of it stands under the roof (0.4 m and more inside the paper vault, where the
  // room's stone vault hides it from below and the paper from above) is cut away, so that nothing of it hangs in the room
  const lantern0 = c.idx.length;
  const cx = F.crossingX, ring = (v, r, wd) => c.sheet(FR.xz(Y + v, cx, 0), disc(0, 0, r, 8, Math.PI / 8), { holes: [disc(0, 0, r - wd, 8, Math.PI / 8)], edge: 0.5 });
  ring(56, 11.9, 1.3); ring(72, 8.4, 1.0);
  for (let i = 0; i < 8; i++) {
    const a = Math.PI / 8 + i * Math.PI / 4, g = FR.of([cx, Y, 0], [Math.sin(a), 0, Math.cos(a)], [0, 1, 0]), o = [], inn = [];
    for (let j = 0; j <= 8; j++) { const t = j / 8, v = 56 + 32 * t, r = 11.3 * (1 - Math.pow(t, 1.7)); o.push([r, v]); inn.push([Math.max(0, r - 1.1), v - 0.6]); }
    c.sheet(g, o.concat(inn.reverse()), { edge: 0.55 });
  }
  c.ink(FR.yz(cx, 0, Y), [[0, 88], [0, 93]], c.w * 1.4, { exact: true });
  cutUnder(c, lantern0, vl, Y, 0.4);
  await ctx.yield();
  // the east wall and the rose: the wall's paper closes up to the ring's own rim (a round opening of 48 sides, nowhere nearer the
  // flown line than 7.0 m: nothing of the stair's stone or the night shows between the rose and the ring), a ring of twenty tissue beads outside it
  const ef = FR.yz(F.x1, 0, Y), rv = F.roseV;
  const eOut = [[-F.aisleZ, 0], [F.aisleZ, 0], [F.aisleZ, AH], [nh + 0.6, AH + 4], [nh + 0.6, top], [0, 63], [-nh - 0.6, top], [-nh - 0.6, AH + 4], [-F.aisleZ, AH]];
  c.sheet(ef, eOut, { holes: [disc(0, rv, F.roseClear, 48)] }); c.ink(ef, eOut, HEAVY * 1.6, { closed: true, layer: 2 });   // the rose's cut edge is left bare: its ink ring stands outside it
  c.ink(ef, disc(0, rv, 9.85, 28), HEAVY * 1.2, { closed: true, layer: 2 }); c.ink(ef, disc(0, rv, 11.8, 28), HEAVY, { closed: true, layer: 2 });   // the rose's two ink rings stand 9.85 and 11.8 m from the line
  for (let i = 0; i < 20; i++) { const a = (i + 0.5) * Math.PI / 10; c.sheet(ef, disc(10.95 * Math.sin(a), rv + 10.95 * Math.cos(a), 0.5, 8), { col: tis[i % 2], layer: 1, m: shim, flut: () => (i * 0.29) % 1, edge: 0.5 }); }   // a ring of tissue beads
  for (const s of [-1, 1]) { c.sheet(ef, lancet(s * 19, 2.6, 4, 12, 16, 3), { col: tis[s > 0 ? 0 : 1], layer: 1, m: shim, flut: () => 0.4 + 0.3 * s, edge: 1 }); c.sheet(ef, lancet(s * 3.4, 1.5, 44, 50, 53.5, 3), { col: tis[s > 0 ? 1 : 0], layer: 1, m: shim, flut: () => 0.1 + 0.4 * s, edge: 1 }); }
  c.ink(ef, [[-F.aisleZ, 4], [-13, 4]], 0); c.ink(ef, [[13, 4], [F.aisleZ, 4]], 0);
  masonry(c, ef, -F.aisleZ, F.aisleZ, 0, 63, 3.4, { joint: 6, pad: 0.5, clip: (u, v) => inPoly(u - 0.6, v, eOut) && inPoly(u + 0.6, v, eOut) && inPoly(u, v + 0.6, eOut) && Math.hypot(u, v - rv) > 12.6, holes: [lancet(-19, 2.6, 4, 12, 16, 3), lancet(19, 2.6, 4, 12, 16, 3), lancet(-3.4, 1.5, 44, 50, 53.5, 3), lancet(3.4, 1.5, 44, 50, 53.5, 3)] });
  const res = done('cathedralNave', c, 0.5, { naveClear: { halfWidth: nh - ROOM.wall, floor: Y, ribsFrom: Y + top, lineY: NAVE_Y }, rose: { centre: [F.x1, NAVE_Y, 0], clearRadius: F.roseClear }, crossing: [cx, Y, 0], lanternTop: Y + 93 });
  await ctx.yield();
  const room = await naveRoom(ctx, style);
  res.meshes.push(room.stone, room.glass, room.paper); res.info.lanterns = room.lanterns;
  return res;
});

// 9 THE CATHEDRAL, part three: THE ROOM. From the west door to the rose the inside is A ROOM OF THE STAIR'S OWN STONE AT NIGHT: the
// same blue grey, the same ink joints, in courses of ROOM.course (1.28 m; the floor in slabs of ROOM.paving, two courses by three, as
// every tread), with no pool of any lamp on it and no moon's rim: the bare stone, and no darker. A FACE'S TONE GOES BY THE WAY IT LOOKS
// (no light is reckoned): a face that looks across the nave, up or down is the bare stone; a face that looks along the nave (a pier's
// side, a window's reveal, the west wall) is SIDE (16 in 100) toward the lit stone, so a pier's corner reads; the courses that carry
// (a pier's base and capital, the string course, the wall's head, the aisle wall's foot, the vault's ribs) are PALE (half way to the
// lit stone).
// THE STONE STANDS INSIDE THE PAPER and touches none of it that is seen from outside. The arcade is a wall 1.6 m thick about the nave
// wall's paper (ROOM.wall either side), on piers 2.12 m by 1.6 m, each on a base 1.6 m high and under a capital of 1.6 m, its shaft
// (1 m broad, 0.4 m proud) rising from the base through the capital to the vault's springing, where its rib lands. Over the string
// course the clerestory's stone is thin (ROOM.upper inside the paper), so its glass is seen from along the nave. The aisle wall is
// lined ROOM.aisle inside its paper, the aisle roofed in stone 0.3 m under its paper roof. THE VAULT is twelve stone webs 0.8 m under
// the paper vault, with BUILT RIBS of pale stone: a rib 0.9 m broad and 0.5 m deep over every pier and against the west wall, two
// diagonal bands 0.6 m broad to each bay, a ridge rib 0.9 m broad. The west wall stands 0.4 m inside the west front's paper.
// THE LIGHT IS IN THE GLASS: every opening in the stone is a window: the clerestory lancets (the opening 15.3 m of the clerestory's
// 18) and the aisle windows, each with its inner pane of tissue in a quarter metre frame of ink; the screens of tissue between the
// towers (stone behind their leads); the west front's three lancets; the aisles' east windows; and the rose's wall of lit paper at
// the nave's east end. Each window lays its outline on the floor, and an aisle window washes the piers' sides before it (ROOM.glass,
// in the stone's shader, by place only).
// PAPER LANTERNS, fourteen, the room's life with the tissue's shimmer: two rows of seven, 8.2 m either side of the flown line, one
// to a bay from the bay between the towers to the arcade's sixth (the last two bays before the rose are left to the ring), hung on
// ink cords from the vault at four heights by turns, their middles 18 to 23.5 m over the floor and their caps' tops 25.6 m at the
// most (our eye passes at 25.7). Our own make: a six sided drum of paper 2.3 m across and 3 m tall, pleated in ink, under a
// vermilion cap, a vermilion tail below. Each swings as a weight on its cord swings (its own cord's time, 11.7 to 12.6 s a round;
// its own phase; 0.9 m either way at its middle), along the nave and a little across (its own bearing, within 0.3 of the nave's):
// by place its paper keeps 6.7 m and more from the flown line.
async function naveRoom(ctx, style) {
  const F = CATH, RM = ROOM, P = style.palette, X = F.x0, Y = F.floor, len = F.x1 - F.x0, nh = F.naveHalf, nz = nh - RM.wall, uz = nh - RM.upper, oz = nh + RM.wall, az = F.aisleZ - RM.aisle, CL = F.archApex + 2, top = F.arcadeTop, AH = F.aisleTop, RH = F.archApex + 1.7, SPR = F.archSpring;
  const S = { pos: [], st: [], pool: [], idx: [] }, PALE = 0.5, SIDE = 0.16, TRACERY = 0.25;
  const piece = (fr, pts, o) => style.roomPiece(S, fr, pts, { course: RM.course, ...o }), rect = (fr, u0, v0, u1, v1, o) => piece(fr, [[u0, v0], [u1, v0], [u1, v1], [u0, v1]], o);
  // a block: u0..u1 from the door, v0..v1 over the floor, z0..z1 across; its faces that look along the nave a shade paler
  const block = (u0, u1, v0, v1, z0, z1, tone) => {
    for (const z of [z0, z1]) rect(FR.xy(z, X, Y), u0, v0, u1, v1, { tone });
    for (const u of [u0, u1]) rect(FR.yz(X + u, 0, Y), z0, v0, z1, v1, { tone: tone + SIDE });
    for (const v of [v0, v1]) if (v > 0) rect(FR.xz(Y + v, X, 0), z0, u0, z1, u1, { tone });
  };
  // the reveal of an opening: the outline o (in a wall's own frame fr) carried from the wall's face d metres along n to the shell's paper
  const reveal = (fr, o, n, d, kind, from = 0) => { let run = 0; for (let i = from; i < o.length; i++) { const a = o[i], b = o[(i + 1) % o.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]); const A = new THREE.Vector3().copy(fr.O).addScaledVector(fr.U, a[0]).addScaledVector(fr.V, a[1]), B = new THREE.Vector3().copy(fr.O).addScaledVector(fr.U, b[0]).addScaledVector(fr.V, b[1]); rect(FR.of(A.toArray(), n, B.sub(A).toArray()), 0, 0, d, l, { tone: SIDE, kind, jv: run }); run += l; } };
  const piers = []; for (let i = 0; i <= 8; i++) piers.push(F.firstPier - X + F.bay * i);
  const W0 = 0.4;                                                                            // the room's west wall stands this far inside the west front's paper: no stone touches the front
  const ah = F.bay / 2 - 1.06, apex = F.archApex - 0.06, pw = F.bay / 2 - ah;                // the stone's arch stands 6 cm inside the paper's, so the paper's cut edge is in the stone
  const roofAt = (z) => AH + (F.aisleZ - Math.abs(z)) * (RH - AH) / (F.aisleZ - nh) - 0.3;     // the aisle's stone roof
  const G = RM.glass, cw = (u) => lancet(u, G.clere.half - 0.05, G.clere.foot + 0.05, G.clere.spring, G.clere.apex - 0.06, 4);   // a clerestory opening: 5 cm inside its tissue's outline, so that nothing of the shell's white paper shows round the glass
  const cframe = (u) => lancet(u, G.clere.half - 0.175, G.clere.foot + 0.175, G.clere.spring, G.clere.apex - 0.2, 4);                                 // and its frame's middle line: a quarter metre of ink inside the opening's edge
  const aw = (u) => lancet(u, G.aisle.half + 0.04, G.aisle.foot - 0.04, G.aisle.spring, G.aisle.apex + 0.05, 3);                  // an aisle opening: the tissue's outline and its drawn edge
  // the floor: one paving from aisle wall to aisle wall, 0.1 m over the tread
  rect(FR.xz(Y + 0.1, X, 0), -az, 0.03, az, len, { course: RM.paving, kind: 1 });
  // the paper of the room, two cards (their strokes take their hand from a stream of their own): the lanterns; and the windows' INNER PANES:
  // in each aisle opening and each clerestory opening a pane of its window's own tissue stands inside the shell's (0.15 m, 0.08 m), and 3 cm
  // before it a quarter metre frame of ink with the window's mullion and heads; it shimmers and takes the beat as its window does (the same
  // phase). The panes' ink is on the tissue's own layer and inside the shell's tissue's outline, so the kit's layer step never brings it
  // before the shell's glass, at any distance: from outside the windows are the shell's alone.
  const ROW = 0.07, c = style.card(9, Y, Y + 30, 0.1); c.fine = 1; c.row = { x0: X, per: ROW }; c.rng = ownStream(ctx, 'naveRoom');
  const g = style.card(9, Y, Y + 30, 0.16); g.fine = 1; g.row = { x0: X, per: ROW }; g.rng = c.rng;
  const shim = g.motion({ kind: 6, amp: 0.26, freq: 2.0, pivot: [X, 0, 0], axis: [1, 0, 0], beatK: 9, beatPer: ROW, beatAmp: beatAmp(Math.log2(13 / 0.185)) }), tis = [P.tissueBlue, P.tissueVermilion];
  for (const s of [-1, 1]) {
    const fi = FR.xy(s * nz, X, Y), fu = FR.xy(s * uz, X, Y), fo = FR.xy(s * oz, X, Y), fa = FR.xy(s * az, X, Y), n = [0, 0, s];
    // the arcade's nave face: the bay between the towers (its screen of tissue, its clerestory window), then pier, arch and wall, bay by bay
    const screen = lancet(7, 2.94, 0.6, 25, 29.9, 4);
    piece(fi, [[W0, 0], [piers[0] - pw, 0], [piers[0] - pw, SPR], [piers[0], SPR], [piers[0], CL], [W0, CL]], { holes: [screen] }); piece(fu, [[W0, CL], [piers[0], CL], [piers[0], top], [W0, top]], { holes: [cw(7)] });
    reveal(fi, screen, n, RM.wall, 0);
    // a clerestory opening: its reveal, and in it the window's inner pane (as the aisle's, 0.08 m inside the shell's tissue) with its frame, mullion and two heads
    const fg = FR.xy(s * (nh - 0.08), X, Y), fk = FR.xy(s * (nh - 0.11), X, Y), clere = (u, i) => {
      reveal(fu, cw(u), n, RM.upper - 0.08, 0);
      g.sheet(fg, cw(u), { col: tis[(i + 1 + (s > 0 ? 1 : 0)) % 2], layer: 1, m: shim, flut: () => ((i + 1) * 0.61 + (s > 0 ? 0.3 : 0)) % 1 });
      g.ink(fk, cframe(u), TRACERY, { closed: true, layer: 1, even: true });
      g.ink(fk, [[u, G.clere.foot], [u, top - 7.2]], g.w * 0.8, { exact: true, layer: 1 });
      for (const d of [-1.25, 1.25]) g.ink(fk, archLine(u + d, 1.25, top - 9.6, top - 8.4, top - 6.4, 2), g.w * 0.7, { layer: 1 });
    };
    clere(7, -1);
    rect(FR.xy(s * (nh + 0.5), X, Y), 3.4, 0, 10.6, 30.6, {});                                 // behind the screen's leads: stone
    const zb0 = Math.min(s * (nz - 0.65), s * (oz + 0.3)), zb1 = Math.max(s * (nz - 0.65), s * (oz + 0.3));
    for (let i = 0; i <= 8; i++) {
      const u = piers[i], u0 = u - pw, u1 = Math.min(len, u + pw);
      rect(fi, u0, 0, u1, SPR, {}); rect(fo, Math.max(u0, piers[0]), 0, u1, SPR, {});
      block(u0 - 0.25, Math.min(len, u1 + 0.25), 0, 1.6, zb0, zb1, PALE);          // its base
      block(u0 - 0.25, Math.min(len, u1 + 0.25), SPR - 1.6, SPR, zb0, zb1, PALE);  // its capital
      rect(FR.xy(s * (nz - 0.4), X, Y), u - 0.5, 1.6, Math.min(len, u + 0.5), top, {});                                                                         // its shaft, to the vault's springing
      for (const d of [-0.5, 0.5]) if (u + d < len) rect(FR.yz(X + u + d, 0, Y), s * (nz - 0.4), 1.6, s * uz, top, { tone: SIDE });
    }
    for (let i = 0; i < 8; i++) {
      const uc = piers[i] + F.bay / 2, arch = lancet(uc, ah, 0, SPR, apex, 5).slice(2).reverse(), h = F.bay / 2;
      piece(fi, [[uc - h, SPR], ...arch, [uc + h, SPR], [uc + h, CL], [uc - h, CL]], {}); piece(fu, [[uc - h, CL], [uc + h, CL], [uc + h, top], [uc - h, top]], { holes: [cw(uc)] });
      piece(fo, [[uc - h, SPR], ...arch, [uc + h, SPR], [uc + h, roofAt(oz)], [uc - h, roofAt(oz)]], {});
      clere(uc, i);
      for (const d of [-ah, ah]) rect(FR.yz(X + uc + d, 0, Y), s * nz, 0, s * oz, SPR, { tone: SIDE, kind: 2 });     // the arch's two jambs (the piers' sides): the aisle window's wash lies on them
      let run = 0; for (let j = 0; j + 1 < arch.length; j++) { const a = arch[j], b = arch[j + 1], l = Math.hypot(b[0] - a[0], b[1] - a[1]); rect(FR.of([X + a[0], Y + a[1], s * nz], n, [b[0] - a[0], b[1] - a[1], 0]), 0, 0, oz - nz, l, { tone: SIDE, jv: run }); run += l; }   // its soffit
    }
    // the string course, and the ledge on it: over it the clerestory's wall stands thinner (ROOM.upper inside the paper); the wall's head, where the vault springs
    rect(FR.xy(s * (nz - 0.1), X, Y), W0, CL - 0.6, len, CL, { tone: PALE }); rect(FR.xz(Y + CL, X, 0), Math.min(s * (nz - 0.1), s * uz), W0, Math.max(s * (nz - 0.1), s * uz), len, { tone: PALE });
    rect(fi, W0, top - 0.7, len, top, { tone: PALE }); rect(FR.xz(Y + top - 0.7, X, 0), Math.min(s * nz, s * uz), W0, Math.max(s * nz, s * uz), len, { tone: PALE });
    await ctx.yield();
    // the aisle: its wall lined, a window's opening to each bay; its stone roof; its two ends
    const wins = []; for (let i = 0; i < 8; i++) wins.push(aw(piers[i] + F.bay / 2));
    piece(fa, [[piers[0], 0], [len, 0], [len, roofAt(az)], [piers[0], roofAt(az)]], { holes: wins });
    const fp = FR.xy(s * (F.aisleZ - 0.15), X, Y), fq = FR.xy(s * (F.aisleZ - 0.18), X, Y);
    for (let i = 0; i < 8; i++) {
      const u = piers[i] + F.bay / 2, A = G.aisle;
      reveal(fa, wins[i], n, RM.aisle - 0.15, 0);
      g.sheet(fp, wins[i], { col: tis[(i + (s > 0 ? 1 : 0)) % 2], layer: 1, m: shim, flut: () => (i * 0.37 + (s > 0 ? 0.2 : 0)) % 1 });
      g.ink(fq, lancet(u, A.half - 0.085, A.foot + 0.085, A.spring, A.apex - 0.09, 3), TRACERY, { closed: true, layer: 1, even: true });
      g.ink(fq, [[u, A.foot], [u, 14]], g.w * 0.8, { layer: 1 }); g.ink(fq, [[u - A.half, 9.2], [u + A.half, 9.2]], g.w * 0.7, { layer: 1 });
      for (const d of [-1.45, 1.45]) g.ink(fq, archLine(u + d, 1.45, 9.2, 12.8, 15.6, 2), g.w * 0.7, { layer: 1 });
    }
    rect(FR.xy(s * (az - 0.1), X, Y), piers[0], 0, len, 1.6, { tone: PALE });                             // its base course
    rect(FR.of([X + piers[0], Y + roofAt(az), s * az], [1, 0, 0], [0, roofAt(oz) - roofAt(az), s * (oz - az)]), 0, 0, len - piers[0], Math.hypot(roofAt(oz) - roofAt(az), oz - az), {});
    const end = [[s * oz, 0], [s * az, 0], [s * az, roofAt(az)], [s * oz, roofAt(oz)]], east = lancet(s * 19, 2.55, 4.05, 12, 15.94, 3);
    piece(FR.yz(X + piers[0] + 0.3, 0, Y), end, { tone: SIDE });
    piece(FR.yz(X + len - 0.4, 0, Y), end, { tone: SIDE, holes: [east] }); reveal(FR.yz(X + len - 0.4, 0, Y), east, [1, 0, 0], 0.4, 0);
    g.ink(FR.yz(X + len - 0.11, 0, Y), lancet(s * 19, 2.425, 4.175, 12, 15.8, 3), TRACERY, { closed: true, layer: 1, even: true });
    await ctx.yield();
  }
  // THE VAULT: twelve webs on a pointed line from wall head to wall head (11.2 m to its apex), from the west wall to the rose's wall
  const VA = 63.2, RB = 0.9, RD = 0.5, DB = 0.6, vs = lancet(0, nz, top, top, VA, 6).slice(2), vi = lancet(0, nz - RD, top, top, VA - RD, 6).slice(2);
  const bays = [[W0 + RB, piers[0]]]; for (let i = 0; i < 8; i++) bays.push([piers[i], piers[i + 1]]);     // the first bay from the west wall's rib
  let run = 0;
  for (let j = 0; j + 1 < vs.length; j++) {
    const a = vs[j], b = vs[j + 1], sl = Math.hypot(b[0] - a[0], b[1] - a[1]), dir = [0, (b[1] - a[1]) / sl, (b[0] - a[0]) / sl];
    rect(FR.of([X, Y + a[1], a[0]], [1, 0, 0], dir), W0, 0, len, sl, { jv: run });
    // the diagonal ribs: on every web a band from either end of the bay toward its middle, 0.12 m under the web
    let nv = [0, -dir[2], dir[1]]; if (nv[1] * (top - a[1]) + nv[2] * (0 - a[0]) < 0) nv = [0, dir[2], -dir[1]];
    const r = j < 6 ? j : 11 - j, g = FR.of([X + nv[0] * 0.12, Y + a[1] + nv[1] * 0.12, a[0] + nv[2] * 0.12], [1, 0, 0], dir);
    for (const [u0, u1] of bays) { const bl = u1 - u0, e0 = bl / 2 * (j < 6 ? r : r + 1) / 6, e1 = bl / 2 * (j < 6 ? r + 1 : r) / 6; for (const m of [0, 1]) { const p0 = m ? u1 - e0 : u0 + e0, p1 = m ? u1 - e1 : u0 + e1; piece(g, [[p0 - DB / 2, 0], [p0 + DB / 2, 0], [p1 + DB / 2, sl], [p1 - DB / 2, sl]], { tone: PALE, jv: run }); } }
    // the ribs over the piers (and one against the west wall): a soffit RB broad, RD under the web, and its two sides
    const c0 = vi[j], c1 = vi[j + 1], il = Math.hypot(c1[0] - c0[0], c1[1] - c0[1]);
    for (const u of [RB / 2 + W0, ...piers]) {
      const u0 = u - RB / 2, u1 = Math.min(len, u + RB / 2);
      rect(FR.of([X + u0, Y + c0[1], c0[0]], [1, 0, 0], [0, c1[1] - c0[1], c1[0] - c0[0]]), 0, 0, u1 - u0, il, { tone: PALE, jv: run });
      for (const uu of [u0, u1]) if (uu < len) piece(FR.yz(X + uu, 0, Y), [a, b, c1, c0], { tone: PALE - SIDE, jv: 0 });
    }
    run += sl;
    if (j === 5) await ctx.yield();
  }
  rect(FR.xz(Y + VA - 0.55, X, 0), -RB / 2, W0, RB / 2, len, { tone: PALE });                                          // the ridge rib
  for (const z of [-RB / 2, RB / 2]) rect(FR.xy(z, X, Y), W0, VA - 0.55, len, VA - 0.1, { tone: PALE - SIDE });
  // the west wall, W0 inside the west front's paper: the door (its reveal, to 3 cm short of the paper), the front's three lancets
  const fw = FR.yz(X + W0, 0, Y), door = lancet(0, F.door.half, 0, F.door.spring, F.door.apex, 7), wl = [-4.2, 0, 4.2].map((u, i) => lancet(u, 1.45, 38.05, i === 1 ? 47.5 : 45.5, (i === 1 ? 51 : 49) - 0.06, 3));
  piece(fw, [[-nz, 0], door[0], ...door.slice(1).reverse(), [nz, 0], ...vs], { tone: SIDE, holes: wl });
  reveal(fw, door, [-1, 0, 0], W0 - 0.03, 0, 1);                                                             // (from its second edge: not across its sill)
  for (const w of wl) reveal(fw, w, [-1, 0, 0], W0 - 0.03, 0);
  const stone = style.stoneMesh(S, style.room); stone.name = 'naveStone';
  await ctx.yield();
  // THE LANTERNS
  const vaultAt = (z) => { for (let j = 0; j + 1 < vs.length; j++) { const a = vs[j], b = vs[j + 1]; if (z <= a[0] && z >= b[0]) return a[1] + (b[1] - a[1]) * (a[0] - z) / (a[0] - b[0]); } return top; };
  const LZ = 8.2, R = 1.15, HH = 1.5, CAP = 0.55, TAIL = 2.6, SWING = 0.9, heights = [23.5, 19.5, 22, 18], rng = c.rng, lanterns = [];
  for (let li = 0; li < 14; li++) {
    const s = li % 2 ? 1 : -1, n = li >> 1, u = n === 0 ? 7 : piers[n - 1] + F.bay / 2, z = s * LZ, hv = heights[(n + (s > 0 ? 2 : 0)) % 4], hang = vaultAt(z) - 0.05, cord = hang - hv;
    const x0 = X + u, yc = Y + hv, be = rng.range(-0.3, 0.3), w = Math.sqrt(9.81 / cord);
    c.y0 = yc - HH - 0.5; c.y1 = yc + HH + CAP;
    const m = c.motion({ kind: 1, pivot: [x0, Y + hang, z], axis: [Math.sin(be), 0, Math.cos(be)], amp: SWING / cord, freq: w, phase: rng.range(0, 6.2832), flutDir: [0, 0, 1], flutFreq: 1.1 + 0.2 * (li % 5), flutPhase: li * 1.7 });
    const cor = []; for (let q = 0; q < 6; q++) { const a = q * Math.PI / 3 + (li % 2) * Math.PI / 6; cor.push([R * Math.cos(a), R * Math.sin(a)]); }
    for (let q = 0; q < 6; q++) {
      const a = cor[q], b = cor[(q + 1) % 6], side = Math.hypot(b[0] - a[0], b[1] - a[1]), dx = (b[0] - a[0]) / side, dz = (b[1] - a[1]) / side;
      const fr = FR.of([x0 + a[0], yc - HH, z + a[1]], [dx, 0, dz], [0, 1, 0]);
      c.rect(fr, 0, 0, side, 2 * HH, { m });                                                       // a side of the drum, its edge and its four pleats
      c.ink(fr, [[0, 0], [0, 2 * HH]], c.w * 0.7, { m, exact: true });
      for (let t = 1; t < 5; t++) c.ink(fr, [[0, 2 * HH * t / 5], [side, 2 * HH * t / 5]], c.w * 0.5, { m, exact: true });
      for (const [v0, v1, col, layer] of [[2 * HH, 2 * HH + CAP, P.vermilion, 1], [0, -0.45, null, 0]]) {   // the cap above (vermilion), the foot below
        const A = [x0 + a[0], yc - HH + v0, z + a[1]], V = [0.45 * a[0] - a[0], v1 - v0, 0.45 * a[1] - a[1]], hgt = Math.hypot(...V);   // a skew frame: along the drum's edge, and up the slope's own edge
        c.sheet(FR.of(A, [dx, 0, dz], V), [[0, 0], [side, 0], [0.45 * side, hgt], [0, hgt]], { m, col: col || undefined, layer });
      }
    }
    c.sheet(FR.xz(yc + HH + CAP, x0, z), cor.map((q) => [0.45 * q[1], 0.45 * q[0]]), { m, col: P.vermilion, layer: 1 });           // the cap's lid
    for (const v of [0, 2 * HH]) c.ink(FR.xz(yc - HH + v, x0, z), cor.map((q) => [q[1], q[0]]), c.w * 0.8, { m, closed: true });   // the drum's two rims
    for (const fr of [FR.yz(x0, z, yc - HH - 0.45), FR.xy(z, x0, yc - HH - 0.45)]) c.sheet(fr, [[-0.16, 0], [0.16, 0], [0.05, -TAIL], [-0.05, -TAIL]], { m, col: P.vermilion, layer: 1, flut: (uu, v) => 0.3 * Math.pow(-v / TAIL, 1.5) });   // the tail
    c.ink(FR.yz(x0, z, yc + HH + CAP), [[0, 0], [0, hang - hv - HH - CAP]], 0.1, { m, exact: true, even: true });       // its cord, to the vault
    lanterns.push({ at: [x0, yc, z], cord, round: 2 * Math.PI / w });
    if (li % 4 === 3) await ctx.yield();
  }
  c.y0 = Y; c.y1 = Y + 30;
  const glass = g.mesh(0.5); glass.name = 'naveGlass';                       // made before the lanterns' card: a lantern's pale ink is laid over the glass behind it
  const paper = c.mesh(1.5); paper.name = 'naveLanterns';
  return { stone, glass, paper, lanterns };
}

// 10 THE HILL TOWN, at the front of its tread like a town on a cliff: terraces of paper walls, some 400 house fronts, towers, a keep
// 150 m up and 200 m back, windows that go on and off one at a time. Our own town: no real place.
export const TOWN = { x0: riserX(10) + 6, back: 200, across: 300, keepTop: 150, terraces: 9, step: 22, lift: 12 };
THINGS.push(async function town(ctx, style, env) {
  const k = 10, T = TOWN, Y = treadTop(k), c = style.card(k, Y, Y + T.keepTop, 0.7), P = style.palette, rng = style.rng, n400 = env.detail;
  const win = c.motion({ kind: 5, amp: 0.16, freq: 1 / 26, phase: 0.62 }); let roofs = 0;
  const house = (x, z, base, w, eave, kind, depth) => {
    const fr = FR.yz(x, z, Y + base), h = w / 2; let o;
    if (kind === 0) o = [[-h, 0], [h, 0], [h, eave], [0, eave + h * rng.range(0.7, 1.1)], [-h, eave]];                                               // a gable
    else if (kind === 1) { const s = h / 3, t = h * 0.36; o = [[-h, 0], [h, 0], [h, eave], [h - s, eave], [h - s, eave + t], [h - 2 * s, eave + t], [h - 2 * s, eave + 2 * t], [-h + 2 * s, eave + 2 * t], [-h + 2 * s, eave + t], [-h + s, eave + t], [-h + s, eave], [-h, eave]]; }   // a stepped gable
    else if (kind === 2) o = [[-h, 0], [h, 0], [h, eave], [h + 0.8, eave], [h * 0.55, eave + h * 0.62], [-h * 0.55, eave + h * 0.62], [-h - 0.8, eave], [-h, eave]];      // a hipped front
    else o = [[-h, 0], [h, 0], [h, eave], [0, eave + w * rng.range(1.0, 1.5)], [-h, eave]];                                                         // a tower with a spire
    c.sheet(fr, o, { edge: 1 });
    if (kind === 2) c.ink(fr, [[-h - 0.8, eave], [h + 0.8, eave]], 0);
    for (const s of [-1, 1]) c.rect(FR.xy(z + s * h, x, Y + base), 0, 0, depth, eave, {});
    const cols = Math.max(1, Math.floor(w / 5.2)), rows = Math.max(1, Math.floor((eave - 1.5) / 6.2));
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      if (rng.chance(0.2)) continue; const u = (q + 0.5 - cols / 2) * (w / cols), v = 2.8 + r * 6.2, dark = rng.chance(0.22);
      c.rect(fr, u - 1.25, v, u + 1.25, v + 3.6, { col: dark ? P.ink : P.hot, layer: 1, m: dark ? 0 : win, flut: () => 0 });
      if (!dark) { const ph = rng(); const f = c.fx.length; for (let j = 1; j <= 4; j++) c.fx[f - 4 * j + 3] = ph; }
    }
    if (kind !== 3 && rng.chance(0.35)) c.rect(fr, h * 0.3, eave, h * 0.3 + 1.1, eave + h * 0.9, {});                                               // a chimney
    roofs++;
  };
  for (let i = 0; i < T.terraces; i++) {
    const x = T.x0 + i * T.step, base = i * T.lift, hw = T.across / 2 - i * 12;
    if (i > 0) {                                                                                                                              // the terrace wall: courses, buttresses, a few dark arches, a stair
      const wf = FR.yz(x - 2.5, 0, Y); c.sheet(wf, [[-hw - 5, base - T.lift - 3], [hw + 5, base - T.lift - 3], [hw + 3, base], [-hw - 3, base]], { edge: 1 });
      c.ink(wf, [[-hw - 3, base - 4], [0, base - 4.1], [hw + 3, base - 4]], 0);
      for (let u = -hw + rng.range(4, 14); u < hw - 6; u += rng.range(14, 30)) { if (rng.chance(0.5)) c.sheet(wf, lancet(u, 1.6, base - T.lift + 1.5, base - 6.5, base - 4.6, 2), { col: P.ink, layer: 1 }); else c.ink(wf, [[u, base - T.lift], [u + 5, base - 6], [u + 10, base - T.lift]], 0); }
    }
    for (let row = 0; row < 2; row++) {
      let z = -hw + rng.range(0, 3); const xr = x + row * 9;
      while (z < hw - 5) {
        const w = rng.range(6.0, 10.4) * (row ? 1.1 : 1), kind = rng.chance(0.07) ? 3 : rng.int(0, 2), eave = kind === 3 ? rng.range(20, 30) + row * 6 : row ? rng.range(15, 21) : rng.range(7, 12.5);
        if (rng() < n400) house(xr + rng.range(-1.5, 1.5), z + w / 2, base, w, eave, kind, 7);
        z += w + (rng.chance(0.2) ? rng.range(1.5, 4) : 0.15);
      }
      await ctx.yield();
    }
  }
  // the keep: a tall house of four gables between two turrets, a vermilion pennant at 150 m
  const kx = T.x0 + T.back - 8, kb = T.terraces * T.lift - T.lift + 4, kf = FR.yz(kx, 20, Y + kb), kh = T.keepTop - kb - 7;
  c.sheet(FR.yz(kx - 6, 20, Y), [[-34, kb - 16], [34, kb - 16], [30, kb], [-30, kb]], { edge: 1 });
  const crown = [[-11, 0], [11, 0], [11, kh - 6]]; for (let i = 0; i < 5; i++) { const u = 11 - i * 4.4; crown.push([u, kh - 3], [u - 2.2, kh - 3], [u - 2.2, kh - 6], [u - 4.4, kh - 6]); } crown.pop(); crown.push([-11, kh - 6]);
  c.sheet(kf, crown, { edge: 1.2 }); for (const s of [-1, 1]) c.rect(FR.xy(20 + s * 11, kx, Y + kb), 0, 0, 14, kh - 6, {});
  for (let r = 0; r < 5; r++) for (let q = 0; q < 4; q++) { const u = -7.5 + q * 5, v = 5 + r * 5.6; c.sheet(kf, lancet(u, 0.9, v, v + 2.2, v + 3.4, 2), { col: P.hot, layer: 1, m: win, flut: () => (r * 0.23 + q * 0.37) % 1 }); }
  c.ink(kf, [[-11, kh - 9], [11, kh - 9]], 0); c.sheet(kf, lancet(0, 2.2, 0, 3.4, 6, 2), { col: P.ink, layer: 1 });
  for (const s of [-1, 1]) { const tf = FR.yz(kx - 1, 20 + s * 14.5, Y + kb - 6); c.sheet(tf, [[-3.5, 0], [3.5, 0], [3.5, kh - 8], [4.6, kh - 8], [0, kh + 3], [-4.6, kh - 8], [-3.5, kh - 8]], { edge: 1.2 }); c.rect(tf, -0.7, kh - 16, 0.7, kh - 13, { col: P.hot, layer: 1 }); }
  c.ink(kf, [[0, kh - 3], [0, kh + 7]], c.w * 1.5, { exact: true });
  const pm = c.motion({ kind: 0, flutDir: [1, 0, 0], flutFreq: 2.6 });
  c.sheet(kf, [[0, kh + 7], [0, kh + 3.2], [-9, kh + 5]], { col: P.vermilion, m: pm, flut: (u) => -u * 0.14, edge: 1 });
  return done('town', c, 1.5, { roofs, keep: [kx, Y + T.keepTop, 20], firstRowX: T.x0, note: 'windows change one at a time (each its own phase of a 26 s round); the pennant is the one vermilion' });
});

// 11 THE HALF BUILT STEP: on its right half (z 0 .. 614) a bare scaffold of lit paper poles and ledgers, and on top a crane 90 m tall
// whose 190 m jib swings 40 degrees to and fro in 20 s with a sheet of stone-coloured paper hanging from it; one vermilion lamp
export const CRANE = { x: riserX(11) + 46, z: 300, base: treadTop(11), tall: 90, jib: 190, swing: 0.349, period: 20, sheet: [60, 40], drop: 46 };
THINGS.push(async function scaffold(ctx, style) {
  const k = 11, X = riserX(k), y0 = treadTop(10), y1 = treadTop(11), W = halfWidth(k), c = style.card(k, y0, y1 + 90, 2.6), P = style.palette, rng = style.rng;
  // LIT PAPER, drawn thin (it pales as thin ink does when it would be under its least breadth). EVERY POLE STANDS DOWN TO WHAT IS
  // UNDER IT by the stair's own law: the top of the built step there (tread 10 runs to this riser's plane and to z 307.2), else
  // the valley's ground. So the frame in the riser's plane stands on tread 10 as far as z 307.2 and on the ground beyond, and the
  // frame 34 m behind it, where step 11's own block is not yet built, stands on the ground all along.
  const under = (x, z) => { for (let j = KBUILT; j >= 0; j--) if (x > riserX(j) && x <= riserX(j + 1) && Math.abs(z) <= halfWidth(j)) return treadTop(j); return 0; };
  const o = { col: P.paper, layer: 1 }, H = y1 - y0, led = H / 8;
  for (const [dx, bays] of [[0, 16], [34, 8]]) {
    const fr = FR.yz(X + dx, 0, 0), bw = W / bays, foot = []; for (let i = 0; i <= bays; i++) foot.push(under(X + dx, i * bw));
    for (let i = 0; i <= bays; i++) c.ink(fr, [[i * bw, foot[i]], [i * bw, y1 + (i % 3 === 1 ? rng.range(8, 26) : 4)]], dx ? 2.0 : 2.6, o);
    for (let j = -7; j <= 8; j++) {                                                                      // ledgers, one every eighth of the rise, as far as poles stand at that height
      const v = y0 + j * led, i0 = foot.findIndex((f) => f < v - 1); if (i0 < 0) continue;
      const u0 = i0 * bw; c.ink(fr, [[u0, v], [(u0 + W) * 0.5, v + 0.4], [W, v]], dx ? 1.8 : 2.2, o);
    }
    if (!dx) for (let i = 0; i < bays; i += 2) for (let j = -8; j < 8; j++) {                             // braces, bay and bay about
      if (((j + i / 2) % 2 + 2) % 2 !== 0) continue; const lo = Math.max(foot[i], foot[i + 1]), v0 = y0 + j * led, v1 = v0 + led; if (v1 <= lo + 1) continue;
      const t = Math.max(0, (lo - v0) / led); c.ink(fr, [[(i + t) * bw, v0 + t * led], [(i + 1) * bw, v1]], 1.6, o);
    }
  }
  for (let i = 0; i <= 16; i += 2) c.ink(FR.xy(i * W / 16, X, y0), [[0, H], [34, H]], 2, o);
  c.rect(FR.xz(y1, X, 0), W * 0.3, 4, W * 0.68, 90, { edge: 0.5 });                                     // the staging the crane stands on
  await ctx.yield();
  // the crane: a lattice mast, a cab, a long jib and a short counter jib; the jib swings about the mast
  const K = CRANE, mx = K.x, mz = K.z, mf = FR.yz(mx, mz, K.base), mf2 = FR.xy(mz, mx, K.base);
  for (const fr of [mf, mf2]) { for (const s of [-1, 1]) c.ink(fr, [[s * 4, 0], [s * 4, K.tall - 8]], 2.2, o); for (let j = 0; j < 10; j++) c.ink(fr, [[j % 2 ? -4 : 4, j * 8.2], [j % 2 ? 4 : -4, (j + 1) * 8.2]], 1.5, o); }
  const jm = c.motion({ kind: 1, pivot: [mx, K.base, mz], axis: [0, 1, 0], amp: K.swing, freq: 2 * Math.PI / K.period, phase: 0.8, flutDir: [1, 0, 0], flutFreq: 0.9, flutPhase: 1 });
  const jf = FR.of([mx, K.base + K.tall - 8, mz], [-0.34, 0, -0.94], [0, 1, 0]), oj = { ...o, m: jm };
  c.ink(jf, [[-46, 0], [K.jib, 0]], 2.4, oj); c.ink(jf, [[-46, 0], [0, 15], [K.jib, 1.5]], 2.0, oj); c.ink(jf, [[0, 0], [0, 18]], 2.6, oj);
  for (let i = 0; i < 12; i++) { const u0 = i * K.jib / 12, u1 = (i + 1) * K.jib / 12, t = (u) => 15 - 13.5 * u / K.jib; c.ink(jf, i % 2 ? [[u0, t(u0)], [u1, 0]] : [[u0, 0], [u1, t(u1)]], 1.4, oj); }
  c.rect(jf, -42, -9, -26, 0, { m: jm, edge: 0.6 }); c.rect(jf, -6, -9, 6, 0, { m: jm, edge: 0.6 }); c.rect(jf, -3, -7, 2, -3, { col: P.hot, layer: 1, m: jm });
  c.sheet(jf, disc(0, 20.5, 3.4, 10), { col: P.vermilion, layer: 3, m: jm });                                                // the lamp: vermilion as written, like every vermilion thing
  const hu = K.jib - 38, sw = K.sheet[0] / 2, sh = K.sheet[1], sv = -K.drop, sway = (u, v) => -v * 0.07;
  for (const s of [-1, 1]) c.ink(jf, [[hu + s * 4, 0], [hu + s * sw * 0.8, sv]], 1.3, { ...oj, flut: sway });
  const stoneCol = P.stoneLit.clone(), q = [[hu - sw, sv - sh], [hu + sw, sv - sh], [hu + sw, sv], [hu - sw, sv]];
  c.sheet(jf, q, { col: stoneCol, layer: 1, m: jm, flut: sway, edge: 0.9 });
  for (let j = 1; j < 4; j++) { const v = sv - sh * j / 4; c.ink(jf, [[hu - sw, v], [hu + sw, v]], 1.1, { m: jm, flut: sway }); for (let i = 0; i < 4; i++) { const u = hu - sw + (i + 0.5 + (j % 2) * 0.5) * 2 * sw / 4.5; c.ink(jf, [[u, v], [u, v + sh / 4]], 0.9, { m: jm, flut: sway }); } }
  const r = done('scaffold', c, 30, { crane: K, jibTipRest: [mx - 0.34 * K.jib, K.base + K.tall - 8, mz - 0.94 * K.jib], jibReach: K.jib, note: 'the jib sweeps a sector of 40 degrees about the mast; everything here is over 600 m from the flown line' });
  r.meshes[0].frustumCulled = false; return r;
});

// THE PAPER BIRDS: fifteen about the cathedral's towers, fifteen about the crane, on set rings (never nearer the flown line than 12 m);
// ringOf(i, rng), when given, sets a bird's ring: { ce, r }; rng, when given, is the flock's own stream (the hand's stream otherwise)
function flock(style, k, n, centres, rad, hgt, span, name, ringOf, rng = style.rng) {
  const c = style.card(k, 0, 1, span * 0.03), rings = []; c.rng = rng;
  for (let i = 0; i < n; i++) {
    const own = ringOf ? ringOf(i, rng) : null, ce = own ? own.ce : centres[i % centres.length], r = own ? own.r : rng.range(rad[0], rad[1]), h = rng.range(hgt[0], hgt[1]), sg = rng.chance(0.5) ? 1 : -1, sp = sg * rng.range(0.16, 0.3) * 20 / r;
    const m = c.motion({ kind: 2, pivot: [ce[0], ce[1] + h, ce[2]], axis: [0, 1, 0], freq: sp, phase: rng.range(0, 6.28), flutDir: [0, 1, 0], flutFreq: rng.range(5, 7.5) * 3.2 / Math.max(3.2, span * 0.6), flutPhase: rng.range(0, 6) });
    const fr = FR.of([ce[0] + r, ce[1] + h, ce[2]], [1, 0, 0], [0, 0, -sg]), s = span / 2, fl = (u) => Math.abs(u) * 0.55;
    c.y0 = ce[1] + h - 1; c.y1 = ce[1] + h + 1;
    for (const d of [-1, 1]) c.sheet(fr, [[0, 0.3 * s], [d * s, 0.02 * s], [d * 0.55 * s, -0.12 * s], [0, -0.22 * s]], { m, flut: fl, edge: 1 });
    c.sheet(fr, [[0, 0.62 * s], [0.09 * s, 0.1 * s], [0, -0.5 * s], [-0.09 * s, 0.1 * s]], { m, edge: 1 });
    rings.push({ centre: [ce[0], ce[1] + h, ce[2]], radius: r, span });
  }
  const res = done(name, c, rad[1] + span, { rings }); res.meshes[0].frustumCulled = false; return res;
}
THINGS.push(async function towerBirds(ctx, style) { const F = CATH; return flock(style, 9, 15, [[F.x0 + F.towerHalf, F.floor, -F.towerZ], [F.x0 + F.towerHalf, F.floor, F.towerZ]], [16, 34], [62, 100], 5.5, 'towerBirds'); });
THINGS.push(async function craneBirds(ctx, style) { const K = CRANE; return flock(style, 11, 15, [[K.x, K.base, K.z]], [60, 150], [40, 120], 11, 'craneBirds'); });
// FORTY-FIVE ABOUT THE VIADUCT (three flocks), wheeling through its arches: each on a level ring about a pier, half a pitch in radius, so that
// it crosses the viaduct through the middles of two arches, 18.5 m and more over the paving. The rings are about the second pier to the left of the middle one (eighteen birds)
// and the first and the second to its right (eighteen and nine): none through the arch the flown line takes, NO BIRD OF ANY FLOCK WITHIN 7 m OF THE LINE; and FIFTEEN BEFORE ITS NEAR FACE, over tread 8's paving, on level rings 17 m and more over it (the flown line
// runs 4 m over it there), none within 2 m of the face. FIFTEEN OVER THE WALL OF RISER 9 and fifteen over the forecourt's edge behind it, crossing the sky as we rise before it: level rings 9 m and more over the wall's
// top, to either hand, no ring reaching nearer the stair's middle than 13 m (a wing 10 m) nor any bird within 7 m of the west front; and FIFTEEN HIGH OVER THE FORECOURT'S MIDDLE, on level
// rings 38 m and more over its paving (the flown line is under 26 m over it there), none within 6 m of the west front.
// FORTY-FIVE BEHIND THE VIADUCT (three flocks), over the back of tread 8's paving between its far face and the wall of riser 9, 13 m and more over the paving: two on level rings to either
// hand of the flown line (which rises between them), one on small rings before the wall's foot, where the line has risen well over them: seen through the arches as we come under ours.
// each of these flocks has its own stream by seed and takes nothing from the hand's stream
const ownStream = (ctx, name) => ctx.core.makeRng(ctx.core.hashSeed('stair-birds:' + name + ':' + ctx.seed));
const aboutArches = (name) => async function (ctx, style) {
  const X = thingX(8), Y = treadTop(8), V = VIADUCT, piers = [-2, 1, -2, 1, 2];
  return flock(style, 8, 15, null, [0, 0.5 * V.pitch + 0.6], [18.5, 23], 5.5, name, (i, rng) => ({ ce: [X, Y, piers[i % piers.length] * V.pitch], r: 0.5 * V.pitch + rng.range(-0.6, 0.6) }), ownStream(ctx, name));
};
THINGS.push(aboutArches('viaductBirds'));
THINGS.push(aboutArches('archBirds'));
THINGS.push(aboutArches('pierBirds'));
THINGS.push(async function pavingBirds(ctx, style) {
  const X = thingX(8), Y = treadTop(8), RAD = [8, 13];
  return flock(style, 8, 15, null, RAD, [17, 24], 5.5, 'pavingBirds', (i, rng) => ({ ce: [X - rng.range(23, 46), Y, rng.range(-16, 8)], r: rng.range(RAD[0], RAD[1]) }), ownStream(ctx, 'pavingBirds'));
});
const behind = (name, RAD, hgt, seat) => async function (ctx, style) {
  const X = thingX(8), Y = treadTop(8);
  return flock(style, 8, 15, null, RAD, hgt, 5.5, name, (i, rng) => { const r = rng.range(RAD[0], RAD[1]); return { ce: seat(X, Y, i, r, rng), r }; }, ownStream(ctx, name));
};
const toEitherHand = (X, Y, i, r, rng) => [X + rng.range(24, 41), Y, -6 + (i % 2 ? 1 : -1) * (r + rng.range(11.5, 20))];
THINGS.push(behind('backBirds', [7, 11], [14, 24], toEitherHand));
THINGS.push(behind('yardBirds', [7, 11], [14, 24], toEitherHand));
THINGS.push(behind('footBirds', [5, 6.5], [13, 21], (X, Y, i, r, rng) => [X + rng.range(44, 46), Y, -6.5 + rng.range(-5, 5)]));
const overWall = (name, x0, x1, RAD) => async function (ctx, style) {
  const xw = riserX(9), top = treadTop(9);
  return flock(style, 9, 15, null, RAD, [9, 30], 5.5, name, (i, rng) => { const r = rng.range(RAD[0], RAD[1]); return { ce: [xw + rng.range(x0, x1), top, (i % 2 ? 1 : -1) * (r + rng.range(13, 40))], r }; }, ownStream(ctx, name));
};
THINGS.push(overWall('wallBirds', -14, 4, [14, 30]));
THINGS.push(overWall('forecourtBirds', 2, 8, [14, 24]));
THINGS.push(async function courtBirds(ctx, style) {
  const xw = riserX(9), top = treadTop(9), RAD = [10, 15];
  return flock(style, 9, 15, null, RAD, [38, 58], 5.5, 'courtBirds', (i, rng) => ({ ce: [xw + rng.range(12, 20), top, rng.range(-10, 10)], r: rng.range(RAD[0], RAD[1]) }), ownStream(ctx, 'courtBirds'));
});

// 9 THE BALUSTRADE on the crest of the wall of riser 9 (the front edge of the cathedral's tread), ACROSS THE STAIR'S WHOLE BUILT
// BREADTH (307.2 m): lit paper drawn in fine ink, 1.37 m to the top of its posts (its rail at 1.28): a plinth, a rail, and between
// them 512 cut balusters in 32 bays of sixteen between 33 posts, the night showing between them. Our own make: a flat cut
// baluster, a waist over a belly. It stands 0.15 m back from the wall's face and does not move; the flown line passes 4.5 m over
// the crest and keeps 2.4 m and more by place from its paper. Its strokes take their hand from a stream of their own.
THINGS.push(async function balustrade(ctx, style) {
  const k = 9, Y = treadTop(k), hw = halfWidth(k), c = style.card(k, Y, Y + 1.4, 0.035), fr = FR.yz(riserX(k) + 0.15, 0, Y); c.fine = 1; c.rng = ownStream(ctx, 'balustrade');
  const BAYS = 32, EACH = 16, PW = 0.8, pitch = (2 * hw - (BAYS + 1) * PW) / (BAYS * EACH), PL = 0.16, RL = 1.04, RT = 1.28, PT = 1.34;
  const half = [[0.07, PL], [0.17, 0.30], [0.17, 0.44], [0.06, 0.66], [0.06, 0.92], [0.13, RL]];
  for (let b = 0; b <= BAYS; b++) {
    const z0 = -hw + b * (PW + EACH * pitch);
    c.rect(fr, z0, 0, z0 + PW, PT, { edge: 1 }); c.ink(fr, [[z0, RT], [z0 + PW, RT]], c.w * 0.8, { exact: true });     // a post, its cap
    if (b === BAYS) break;
    const a = z0 + PW, e = a + EACH * pitch;
    c.rect(fr, a, 0, e, PL, {}); c.ink(fr, [[a, PL], [e, PL]], c.w, { exact: true });                                  // the plinth
    c.rect(fr, a, RL, e, RT, {}); c.ink(fr, [[a, RL], [e, RL]], c.w, { exact: true }); c.ink(fr, [[a, RT], [e, RT]], c.w * 1.2, { exact: true });   // the rail
    for (let j = 0; j < EACH; j++) { const zc = a + (j + 0.5) * pitch; c.sheet(fr, mirror(half).map((q) => [zc + q[0], q[1]]), { edge: 1 }); }
    if (b % 8 === 7) await ctx.yield();
  }
  return done('balustrade', c, 0.1, { top: Y + PT + 0.03, rail: Y + RT, balusters: BAYS * EACH, posts: BAYS + 1 });
});
