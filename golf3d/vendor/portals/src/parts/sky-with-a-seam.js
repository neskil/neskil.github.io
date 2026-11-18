// SKY WITH A SEAM: the hero part. A painted sky that is a wall, its lamp of a sun, THE SEAM of it that stands
// parted (two gores of the sky rolled aside on a lit backstage: SEAM below), and the small boat we ride with the
// shadow it throws.
//
// RULES OF THE PLACE (each stands at every metre, for every seed alike):
//   THE SEAM: parted from the water up the curve of the dome, widest at the water, no level top (SEAM); the two
//     panels proud of the face, lapping their neighbours, their painting shifted with them, the left one come
//     further; ribs, galleries with lamps, fly galleries and a lit far wall through its whole height (BEYOND).
//   THE PAINTED EVENING: the painting turns from afternoon to evening by its BEARING, from some 60 degrees either
//     side of the seam inward (gEve in the painting's law), and within some 35 degrees of the seam it is painted
//     DEEPER still (gDusk): a thin gold band at the water, rose over it, violet, a dusk blue above, the clouds violet
//     with rose heads; the seam's gold spills on the wall only by the seam's own edges (strong within some 10 m).
//   THE WATER BEFORE THE SEAM KEEPS ITS MIRROR: the painted dusk and its clouds, the two panels, and in the seam's
//     own image the far wall's bays, the galleries as dark bars and their lamps as long broken streaks.
//   THE ROAD OF GOLD: light on the ripples only, a road of glitter along the gap's own line: at the seam's foot 3 m
//     and three tenths of the seam's half width either hand, 3 m wider for every 100 m out, half strength 300 m out.
//   THE LAMP-SUN IS A CLEAN THING: one plain bright round disc, a soft even round halo, no ray (LAMP_SHOW);
//     its image in the water the same round, its road no wider than the disc and as calm as the sea round it.
//   THE NEAR WALL IS SHARP BECAUSE A PIXEL THERE HOLDS ITS STROKES (gHard: by the pixel's footprint on the wall
//     alone): the painting is laid in strokes some 0.3 m across; where a pixel holds a stroke the painting is cut
//     edges and flat tones, and where it cannot, the pixel has their mean, the soft painting that reads as a sky.
//     THE PLATES ARE JOINED AS RIVETED PLATE IS (PLATE): over every joint a butt strap 0.24 m wide and 25 mm
//     proud, bolted by two rows of domed heads 90 mm across and 30 mm high, 0.25 m apart. No dark line is drawn
//     for a joint where the paint is whole: strap and heads carry the painting and show ONLY AS THE LAMP SHOWS
//     RELIEF (the bevel toward the lamp, the bevel away and its short cast shade; each head's lit side, shaded
//     side and shade), each by its own size, each ending in its own mean; the bristles' hairlines likewise
//     (seen along its face a pixel reaches far along the wall, and the cut edges, the hairlines and the
//     uprights are filtered by that long reach too). Where a shade lies (our sail's, a board's) the lamp's
//     part of the relief goes with it. THE PLATES' OWN TILT: each plate hangs a little out of true (half a
//     degree at the most) and takes the lamp's raking light a shade its own way, a soft step of light at
//     every joint. THE WEAR, BY PLACE (WEAR): on the weather side of the dome, low over the sea, the paint
//     has gone along the joints: a line of bare steel along each edge of a strap, heads here and there
//     rust-dark in a stain of rust, rust weeping down the plate under the level joints; by the wall's own
//     bearing and height and by nothing of the eye, each mark ending in its own mean, the same in the sea's
//     image.
//   THE LINE MEETS THE WALL ASLANT (ASLANT, at THE ROUTE below): before the last straight, wherever the painted
//     wall ahead along the heading is within 200 m, the heading stands 40 degrees or more off square to it; the
//     last straight, which passes through the opening, is the one exception. THE SHADOW stands whole on the wall
//     ahead from the turn onto the wall leg, the lamp on the quarter away from the wall (said there).
//   THE BOAT'S SHADOW IS A BODY WITH AREA AND FOUR CORNERS: our boat carries her STANDING LUGSAIL SET (BOAT.sail:
//     tanned canvas, the very cloth that is built), and what the lamp throws on the painted sky is that sail's
//     broad shade and no other boat's: THE YARD AND THE SAIL'S HEAD CROSS THE MAST (the yard's heel and the
//     sail's upper fore corner stand before the mast's line, the heel by about a quarter of the yard), the fore
//     edge runs from the tack at the mast's foot up and forward to that corner, the head slants up aft along the
//     yard, the yard stands out past the peak, and the mast's head stands clear above the yard, inside the
//     sail's head and not at its fore corner (THE CORNERS READ: the rules at SHADE below, counted by the proof); every
//     shade is its own body's, cast as stout as the body is built. Over THE SHADOW'S STRETCH (from the metre
//     the whole shadow stands on the wall, through the turn and LOOKS.shadow.hold + LOOKS.shadow.open m of the wall
//     leg) that shade stands SHADE.wide degrees wide and SHADE.tall tall at the eye or more (over the tops of the
//     paddles that stand before the wall's foot, which keep its lowest 2 m from the eye), the lamp's whole part
//     is off the paint in it (the paint there SHADE.dark of the same paint beside it, or less), and the wall's own
//     paint under it is painted sky, SHADE.gores gores or more from the seam (what another part sets on that wall
//     or before it there, the proof counts and tells); the shadow's look stands whole from that first metre
//     (SHADE and LOOKS, at the looks below).
//   NO AIR BUT THE SCENE'S: nothing of the wall is thinned by its metres from the eye. Across the bay the wall is
//     a sky and near to it a wall BECAUSE A PIXEL THERE IS LARGER THAN THE MARKS: every mark (strokes, laps,
//     hairlines, runs, patches, seams, straps, bolts, rust) is filtered by the pixel's footprint ON THE WALL to
//     ITS OWN MEAN, by a ramp chosen from the mark's own size (GLSL_FILTER; each mean is worked beside its
//     mark); a line or a thin member drawn wider than it is carries the cover it truly has, whole. The scene's
//     fog is the air. By the opening the straps, belts and rails are wide and heavy BY PLACE: a pixel across the
//     bay holds them. ONE THING STILL GOES BY THE EYE'S PLACE AND IS SAID HERE: the drawn sea sheet eases the
//     swell flat from 150 to 360 m of the eye's foot (swellEase: the sheet is a net about the eye, too coarse
//     out there to carry a 30 m swell; three other parts ride that same ease by its figures). THE HONEST MEND is
//     a sheet fine enough to carry the swell to the wall, those parts following; the water's facing would then
//     be filtered by the pixel's footprint alone.
//   THE LAMP'S GLARE IS LIGHT IN THE EYE, NOT A BODY (GLARE_VERT, GLARE_FRAG): a soft round halo laid over the
//     picture where the lamp's lit face is seen. It is drawn as a card that faces the eye and stands ON THE SIGHT
//     LINE, 45 hundredths of the way from the lamp to the eye, drawn smaller by as much (so that the shell's
//     curve behind the lamp never cuts the halo). WHAT TURNS IT DOWN is the lit face's own facing, as light
//     does: a flat lit disc gives the eye its light by the cosine of the angle between its axis and the sight
//     line, and none from behind. WHAT STAYS UNTRUE: a thing that stands between the card and the lamp hides the
//     lamp and not the halo, and a thing nearer than the card cuts the halo to its own outline. THE HONEST MEND
//     would be to measure how much of the lit face the eye sees (against the depth already drawn) and to lay
//     the halo over the finished picture by that share.
//   DEALT (makeSky's opts): detail and density set how many work lamps are lit backstage; rare leaves one plate
//     of the long wall in its primer. THE CLOCK'S PHASES (the lamp-sun's creep, the hung cables' sway, the drums'
//     turn, the lamps' breathing) are dice of the part's own stream, drawn once and first by makeSky and HELD IN
//     THE SKY IT RETURNS (sky.clock; sky.lampAt(time, out) is that sky's lamp): nothing dealt is kept in the module.
//   NO STAIR: every lattice (the backstage's towers and frames' legs, the gantry's legs, the lamp's rail) is
//     cross-braced, an X in every bay on every face; no diagonal is turned about bay by bay.
//
// World frame: still water y = 0, north -Z, east +X. A bearing is degrees clockwise from north seen from above:
// dir(b) = (sin b, 0, -cos b). The shell is a sphere of radius SHELL.R about the origin, painted on the inside.
//
// HOOKS FOR STAGE 2 (everything a dressing part needs; all exported by name):
//   SHELL            { R, gores, gore (rad), joint (m of arc between cross joints), doorTop (m of arc: the upper
//                    guide rail's line), doorBack (m: negative, the panels stand before the face) }
//   SEAM, seamRake(side, arc), seamHalf(side, arc, width)   THE SEAM'S SHAPE: see at SEAM below
//   seamBearing(k, gapBearing)   THE PANEL LAW: the bearing (degrees) of seam k; seam 0 is the middle of the gap
//   wallPoint(bearing, arc, inset, out)   a point of the shell: arc = metres up the wall along its curve, inset =
//                    metres inside the painted face (cradles, brackets and boards hang at an inset)
//   wallHeight(arc), wallRadius(arc)      height over the water and radius of the place arc metres up the wall
//   dirOf(bearing, out), bearingOf(x, z)  the frame's two conversions
//   RAILS            { foot, top }: the two rails the panels ride, in metres of arc up the wall
//   LAMP             { R, railR, drum, looks: [{ bearing, y }], swing, period }: the lamp-sun and its arc rail
//   lampPlace(look, time, out, phase)     THE LAMP-SUN'S PLACE BY ITS LAW at a clock (it creeps to and fro along its
//                    rail); phase left out: the creep at phase 0 (clock 0: the middle of its swing). A BUILT SKY'S
//                    OWN LAMP, at its dealt phase, is sky.lamp (live) or sky.lampAt(time, out)
//   railDir(angle, out), railNormal(out)  the arc rail's own circle (for a carriage or a hanger on it)
//   LAMP_LIGHT       [{ color, key, fill }] by look: the lamp's colour and how much of a lit thing's light is the
//                    lamp's (key) and the dome's (fill); PAINTS[look] the painting's colours (fill, haze, clouds)
//   GAP, gapWidth(metres, length)         THE GAP'S LAW: metres of opening by the metres of route flown (one line);
//                    GAP.ring is the ring's radius (typed there once), GAP.first is worked from it
//   gapPlace(gapBearing, out)             the middle of the gap on the painted face at the water
//   ASLANT, ROUTE, layRoute(Q)            THE ROUTE and its rule (said at THE ROUTE below): layRoute returns { pts,
//                    marks: { bayTurn, bayLine, C, D, E, swing, straight }, beta, gapBearing, cross, skew, heading,
//                    length, wallStart, wallEnd } (the last two: the wall leg's own bearings, as they fall)
//   LOOKS, seamLook(E, length), rainLook(B, station), shadowLook(whole, D)   the three looks that go by the route's
//                    own marks (the world flies them, the proof counts them: one source); paceAt(m, K) the pace by
//                    the same marks
//   SHADE, shadowHeads(), shadowWholeFrom(path, length, C, D), shadowWall(path, length, m0, m1)   THE SHADOW ON THE
//                    WALL: the rules the proof holds over the shadow's stretch, the metre from which the whole
//                    shadow stands on the wall, and the bearings of wall it sweeps between two metres (for a part
//                    that must keep that wall clear)
//   BOAT             the boat's measures in its own frame (f ahead, y up, s to starboard; origin at the eye's foot);
//                    BOAT.cast (capsules), BOAT.hull (one ellipsoid), BOAT.ends (the hull's two high ends, a blade
//                    each) and BOAT.sail (the set sail's four corners) are the bodies that throw its shadow;
//                    hullSheer(t), hullKeel(t) the hull's own profile along its length
//   PAINT_SEED, MASSES   the painting's one seed and its great cloud masses (for a count of what the wall shows)
//   GLSL_SHADOW      THE SHADOW LAW as GLSL: float boatShade(vec3 worldPoint, float footprintMetres) for a surface
//                    that faces the lamp, float boatShadeOn(vec3 worldPoint, vec3 unitNormal, float footprintMetres)
//                    for any other (a deck, the water: the half-shade is drawn out by the light's slant), with its
//                    uniforms uLamp (vec3) and uBoat (vec4: x, lift, z, heading); a material that includes it
//                    takes the two uniform objects of the sky by reference: sky.shadow.uLamp, sky.shadow.uBoat
//   shadowPoint(lamp, boat, heading, f, y, s, out)   the same law in JS: where the shadow of a point of the boat
//                    lands (on the water, or on the wall where the ray leaves the water inside the shell)
//   await makeSky(ctx, { look, gapBearing, routeLength, beamAim, detail, density, rare }) -> { object, shell,
//                    uniforms, shadow, gap: { bearing, width, half }, lamp (Vector3, live), lampAt(time, out),
//                    clock: { lamp, hung, drums, glow } (this sky's dealt phases), parts, beyond: { at(r, y, t),
//                    material }, works, backstage: { meshes, wall, triangles }, update(dt, time, camera, metres) }
//                    BEHIND THE SEAM STANDS A LIT, DEEP BACKSTAGE (BEYOND): portal frames in rows, catwalks with
//                    rows of warm work lamps (emissive: no light is made), scaffold towers, hung cable loops, and
//                    UP THE WHOLE HEIGHT OF THE SEAM a gallery with its lamps at every cross joint, fly galleries
//                    hung behind it and a far wall of ribs and ring beams in the lamps' gold; the low steel stands
//                    behind the ring's own plane, the steel in the seam itself (galleries, hung weights) over the
//                    ring's height: no sight line from the route to the ring meets any of it (BEYOND gives the
//                    measures, tools/film/sky-proof.mjs counts them), and none of it is ring-shaped
//                    uniforms.uBoardA / uBoardB (18 slots): flat boards whose shade the lamp throws on the painted
//                    sky (A: centre xyz, half width; B: facing bearing in rad, half height, seed, on = 1)
//   makeBoat(ctx) -> { object, mesh, place(point, tangent, lift, pitch, roll, time) }   (time: the world's own
//                    clock, by which the set sail breathes; left out, the sail stands still); SAIL the drawn
//                    cloth's own measures (the proof reads SAIL.breath, and SWELL, for its count of the cloth
//                    against every gaze)
//   makeSea(ctx, sky, { look, gapBearing, routeLength, detail }) -> { object, mesh, uniforms, heightAt, update }:
//                    THE PART'S OWN SEA (the kit's ocean is not used: it cannot mirror this painting). OUR BOAT'S
//                    SHADE ON THE WATER is in its paint, A SHADOW ON A MIRROR (WATER_SHADE, SEA_BODY, and
//                    waterInShade(look, metres, paint), the same light law in JS): the mirror's picture is not
//                    shaded, the lamp's part goes off the water's own body alone
//   await makeLayers(ctx, sea, { path, length, gapBearing, look, shadow }) -> { object, shade, wake, dark, update }:
//                    our thin layer just over that sea (the boat's wake; shade and dark are kept as empty names:
//                    the boat's shade and the dark beyond the wall are the sea's own paint; of the opts only
//                    path, length and look are read now); a rain patch can ride the sea the same way
// What this part never holds: no stair, door or ladder on the sky; nothing lettered; nobody; nothing that watches.
import * as THREE from 'three';
import { clamp, lerp, smoothstep } from '../kit/core.js';

const RAD = Math.PI / 180;
// (doorTop: the line of the upper guide rail, 90 m up; NOTHING ENDS THERE: the seam runs on above it. doorBack: how
// far behind the painted face the two panels' skins hang: NEGATIVE, they stand PROUD of the face, before it; SEAM.proud
// gives each panel's own measure)
export const SHELL = { R: 430, gores: 80, gore: (2 * Math.PI) / 80, joint: 30, doorTop: 90, doorBack: -0.8 };
// the two rails the panels ride (metres of arc up the wall): the foot rail lies on its sill UNDER the still water
// (its top 0.9 m down: our keel, 0.3 m down, passes over it in the opening at every phase of the swell; the
// trucks' wheels turn awash), the upper guide rail on the wall's face either hand of the seam (never across it)
export const RAILS = { foot: -1.1, top: SHELL.doorTop };
// THE SEAM. The opening is no doorway: it is THE SEAM BETWEEN TWO GORES OF THE SKY, PARTED. Two panels, each a
// gore of the dome from under the water to SEAM.top metres of arc (far overhead), stand PROUD of the painted face
// (SEAM.proud, the right one before the left) and overlap their neighbours; they are RIGID and roll LEVEL about the
// dome's own axis by the gap's one law (gapWidth). Their meeting edges are cut PLUMB for the lowest SEAM.plumb
// metres (the ring's whole height and more: there the gap is the law's width) and above that each is cut RAKING
// across toward the other (seamRake: metres of lean, easing in over SEAM.ease m to SEAM.rake at most, the left
// panel's far more than the right's), so that the two still LAP one another high up: what stands open is widest at
// the water and narrows up the curve of the dome to nothing, far up, where the raked edges cross; above that the
// right panel's edge runs on up the sky as a lap line. NO LEVEL TOP ANYWHERE. Closed, the seam would stand SEAM.off m
// to the right of the gap's middle: the left panel has rolled that much further than the right (its clouds stand
// further out of true with its neighbour's), though the opening's foot is even about the gap's middle.
// SEAM.frame: how far behind the painted face the fixed steel behind the seam begins (ribs, galleries, hung cables).
// (HOW PROUD: plates a hand or two thick before the face, the left 0.4 m, the right 0.8 m. No more: a sight line to
// the ring passes a panel's edge aslant (from the first metres on the right hand, along the wall on the left), and
// every metre a panel stands forward takes room from it; so the ring stays whole between the panels with a metre
// to spare from every place of the route (tools/film/sky-proof.mjs counts it). The shade each panel casts on its
// neighbour, its pale steel edge and its trucks show that it stands before the wall.)
export const SEAM = { top: 600, plumb: 30, rake: [13.5, 4.5], ease: 30, off: 6, proud: [0.4, 0.8], frame: 1.6 };
// side: -1 the left panel (the lesser bearings), +1 the right
export const seamRake = (side, arc) => { const a = Math.max(arc - SEAM.plumb, 0); return SEAM.rake[side < 0 ? 0 : 1] * a * a / (a * a + SEAM.ease * SEAM.ease); };
// metres of opening on one hand of the gap's meridian, arc metres up, when the gap at the water is width metres
// (negative: that panel's edge has crossed the meridian there); the seam is open where the two hands' sum is over 0
export const seamHalf = (side, arc, width) => (width / 2) * Math.cos(arc / SHELL.R) - seamRake(side, arc);
// the lamp-sun: a drum 26 m across on a carriage on an arc rail under the shell. Its place by the look: low in
// the west, so that the shadow of a boat 6 m tall can stand on a wall 27 m off (see the world's head): the
// two looks' places lie a little apart on one rail, which climbs from the sea in the west past them to a buffer
// frame on the wall in the south-west (the rail's circle, railDir, runs on over the south; no rail is built there).
export const LAMP = { R: 404, railR: 419, drum: 13, looks: [{ bearing: 252.3, y: 24 }, { bearing: 254, y: 21 }], swing: 0.012, period: 210 };
export const LAMP_LIGHT = [
  { color: [1.0, 0.87, 0.64], key: 0.62, fill: 0.44 },      // AFTERNOON: a cream-gold lamp (gold where it lights, blue in the shade)
  { color: [1.0, 0.70, 0.38], key: 0.66, fill: 0.40 },      // LOW SUN: an amber lamp
];
export const dirOf = (bearing, out = new THREE.Vector3()) => out.set(Math.sin(bearing * RAD), 0, -Math.cos(bearing * RAD));
export const bearingOf = (x, z) => ((Math.atan2(x, -z) / RAD) + 360) % 360;
export const wallHeight = (arc) => SHELL.R * Math.sin(arc / SHELL.R);
export const wallRadius = (arc) => SHELL.R * Math.cos(arc / SHELL.R);
export function wallPoint(bearing, arc, inset = 0, out = new THREE.Vector3()) {
  const e = arc / SHELL.R, r = SHELL.R - inset;
  return out.set(Math.sin(bearing * RAD) * Math.cos(e) * r, Math.sin(e) * r, -Math.cos(bearing * RAD) * Math.cos(e) * r);
}
export const seamBearing = (k, gapBearing) => gapBearing + k * (360 / SHELL.gores);
export const gapPlace = (gapBearing, out = new THREE.Vector3()) => wallPoint(gapBearing, 0, 0, out);

// THE GAP'S LAW (the owner's four conditions are said at the world's head): ONE law of the metres of route flown,
// plain linear from the first metre to the last, always opening. THE RING'S RADIUS IS TYPED HERE AND NOWHERE ELSE
// (GAP.ring: the world's portal takes it from here); the gap at the first metre is WORKED from it: the ring and
// GAP.room m either hand, twice (ring + room), 22 m; at the last metre it is 60 m.
const RING_R = 7, RING_ROOM = 4;
export const GAP = { ring: RING_R, room: RING_ROOM, first: 2 * (RING_R + RING_ROOM), last: 60 };
export const gapWidth = (metres, length) => lerp(GAP.first, GAP.last, clamp(metres / length, 0, 1));

// the rail's great circle passes through the two looks' places; the lamp's place on it is an angle from the first
const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _n = new THREE.Vector3();
function lampDir(i, out) { const L = LAMP.looks[i], e = Math.asin(L.y / LAMP.R); dirOf(L.bearing, out).multiplyScalar(Math.cos(e)); out.y = Math.sin(e); return out; }
export const railNormal = (out = new THREE.Vector3()) => out.crossVectors(lampDir(0, _a), lampDir(1, _b)).normalize();
// a unit direction on the rail's circle, ang radians from the afternoon place (positive toward the low place)
export function railDir(ang, out = new THREE.Vector3()) { railNormal(_n); return lampDir(0, out).applyAxisAngle(_n, ang); }
const LOOK_ANG = [0, lampDir(0, new THREE.Vector3()).angleTo(lampDir(1, new THREE.Vector3()))];
// THE CLOCK'S DICE: each thing of this part that the clock moves starts at a phase of its own, none typed: makeSky
// draws them ONCE at build, all first and in this order, from a stream of the part's own ('sky-clock:' + the seed):
// the lamp-sun's creep, each hung cable's sway, the cable drums' turn, the work lamps' breathing. THEY ARE HELD PER
// BUILD, in the sky that makeSky returns (sky.clock: { lamp, hung, drums, glow }); nothing dealt is kept in this
// module, so two skies built side by side each keep their own.
// THE LAMP-SUN'S PLACE: it creeps to and fro along its rail by the clock (a bounded swing, LAMP.swing rad either
// way). phase: where in its creep it stands at clock 0; left out, the law at phase 0 (at clock 0 the middle of its
// swing: the proofs and the fixed shadows reckon so). THE LAMP OF A BUILT SKY is sky.lamp (live) or
// sky.lampAt(time, out): the same law at that sky's own dealt phase.
export const lampAngle = (look, time, phase = 0) => LOOK_ANG[look] + LAMP.swing * Math.sin((time * 2 * Math.PI) / LAMP.period + phase);
export function lampPlace(look, time, out = new THREE.Vector3(), phase = 0) { return railDir(lampAngle(look, time, phase), out).multiplyScalar(LAMP.R); }
// ---- OUR BOAT's measures, in its own frame: f metres ahead of the eye's foot, y over the water, s to starboard.
// A clinker double-ender of the north, 7.6 m long, with the proud high ends of its kind: the stem head 2.95 m ahead
// of the eye and 0.94 m under it (a body of the place, standing as it truly stands at every place of the route:
// its head 17.7 degrees under the eye's level, and nothing of the boat nearer the eye than half a metre: the
// nearest is the sail's luff, which passes behind it), the mast amidships 0.83 m BEHIND the eye.
// THE SHADOW'S BODIES, EACH CAST AS STOUT AS IT IS BUILT (boatGeometry builds them from these very measures):
//   cast: capsules [ax, ay, as, bx, by, bs, r]: the mast (0), the yard (1), the rising ends of the sheer (2, 3),
//     the stem and stern posts with their squared heads (4, 5: a round of the head's own girth, BOAT.post its two
//     half thicknesses), the four stays (6 to 9: hemp, BOAT.stay its half thickness, cast as thin as it is);
//   hull: one ellipsoid [centre f, y, s, half length, half depth, half beam];
//   ends: the hull's two high ends in profile, a flat blade each in the keel's own plane, by four corners
//     [f, y, s] round it (forefoot, the post's foot, the post's head, the sheer), cut from the hull's own sheer
//     and keel (hullSheer, hullKeel) over BOAT.blade of its length at either end;
//   sail: the set sail, a flat cloth by its four corners [f, y, s] round it (throat, peak, clew, tack).
// THE MAST stands mast.top m tall; mast.r is its mean half thickness, which casts: it is built mast.taper thicker
// at its foot and as much thinner at its head (a centimetre a side, lost in its shade's own soft edge, which is
// 12 cm wide and more on the wall). A capsule's end is
// ROUND, so the mast's head and the yard's two ends are built round too (a dome of the spar's own half thickness).
// THE SAIL IS A STANDING LUGSAIL, SET: a body with area and FOUR CORNERS, which no side shows as a triangle, ITS
// YARD AND ITS HEAD CROSSING THE MAST (that is a lug: a gaff sail's fore edge stands on its mast). THE YARD is a
// stout slanting spar (yard.r its mean half thickness, which casts; built yard.taper thicker at its sling and as
// much thinner at its two ends), slung against the mast's port side yard.y m up, rising aft by yard.rise degrees
// and swung yard.swing degrees to port of the keel's line; it runs yard.lo m before its sling (down and forward,
// past the mast: its HEEL stands before the mast by yard.lo of its yard.lo + yard.hi m, about a quarter of it)
// and yard.hi m abaft it. THE HEAD is laced to it from the throat (yard.throat m along it from the sling, a
// negative measure: BEFORE the mast, a hand's breadth inside the heel) to the peak (yard.peak m abaft the sling:
// the yard stands out past the peak). THE LUFF RUNS UP AND FORWARD: the tack is bowsed down to the mast thwart
// close abaft the mast's foot (BOAT.tackY m up, plumb under the yard's place BOAT.tackAft m abaft its sling:
// BOAT.tack), and from it the luff rises past the mast's port side to the throat before the mast, so the sail's
// upper fore part stands before the mast; the throat stands over the eye's place and a hand behind it, the luff
// passes half a metre behind the eye, and the whole cloth lies behind the eye's place (BEHIND EVERY GAZE: the
// rule at SHADE below, counted by the proof). The
// clew (BOAT.clew) is sheeted over the port quarter. THE LAMP STANDS ON THE STARBOARD QUARTER from the bay line
// to the wall leg's end, and the cloth lies ACROSS its light at every place of that stretch (the proof counts the
// shade's width and its corners), never along it. The starboard backstay is set up aft; the port one, which
// would lie across the cloth, is let go and made up forward by the port shroud.
export const BOAT = {
  eye: 2.7, stem: 2.95, stern: -4.61, mid: -0.83, stemHead: 1.76, sheer: 0.62, halfBeam: 0.98,
  mast: { f: -0.83, foot: 0.25, top: 6.3, r: 0.085, taper: 0.01 }, stay: 0.012,
  yard: { y: 4.99, rise: 25, swing: 10, lo: 0.9, hi: 3.05, r: 0.07, taper: 0.005, throat: -0.8, peak: 2.45 },
  tackY: 0.8, tackAft: 0.12, clew: [-3.9, 1.75, -0.45], blade: 0.12, post: { s: 0.05, f: 0.065 },
  hull: [-0.83, 0.02, 0, 3.3, 0.6, 0.98],
  cast: [], sail: [], ends: [],
};
// the hull's own profile by t along its length (0 at the stern post, 1 at the stem): the sheer's and the keel's heights
export const hullSheer = (t) => BOAT.sheer + (BOAT.stemHead - 0.12 - BOAT.sheer) * Math.pow(Math.abs(2 * t - 1), 2.4);
export const hullKeel = (t) => -0.3 + 0.95 * Math.pow(Math.abs(2 * t - 1), 5);
{ const B = BOAT, m = B.mast, y = B.yard, cr = Math.cos(y.rise * RAD), len = B.stem - B.stern;
  // the mast's half thickness at a height, as built; the yard's own line: its unit way (aft, up, to port), its
  // place against the mast's port side at the sling (side), and its place t metres abaft the sling (at)
  m.rAt = (h) => m.r + m.taper * (1 - 2 * (h - m.foot) / (m.top - m.foot));
  y.dir = [-cr * Math.cos(y.swing * RAD), Math.sin(y.rise * RAD), -cr * Math.sin(y.swing * RAD)];
  y.side = -(m.rAt(y.y) + y.r + y.taper);
  y.at = (t) => [m.f + y.dir[0] * t, y.y + y.dir[1] * t, y.side + y.dir[2] * t];
  B.cast.push([m.f, m.foot, 0, m.f, m.top, 0, m.r]);                                                        // the mast
  B.cast.push([...y.at(-y.lo), ...y.at(y.hi), y.r]);                                                        // the yard, from its fore end to its after end
  B.cast.push([0.9, 0.45, 0, 2.5, 1.1, 0, 0.27], [-2.55, 0.45, 0, -4.15, 1.08, 0, 0.27]);                    // the rising ends of the sheer
  const postR = 2 * (B.post.s + B.post.f) / Math.PI;                                                         // (a round of the squared head's girth: its mean breadth across any light)
  B.cast.push([2.35, 0.95, 0, B.stem, B.stemHead - 0.06, 0, postR], [-4.0, 0.95, 0, B.stern, B.stemHead - 0.1, 0, postR]);   // stem and stern posts
  // the rigging (casters 6 to 9; none ahead of the eye): the port shroud and the port backstay made up forward by
  // it; the starboard shroud and the starboard backstay set up aft
  B.cast.push([m.f, m.top - 0.1, 0, -0.4, 0.66, -0.93, B.stay], [m.f, m.top - 0.1, 0, -0.75, 0.68, -0.95, B.stay]);
  B.cast.push([m.f, m.top - 0.1, 0, -0.4, 0.66, 0.93, B.stay], [m.f, m.top - 0.1, 0, -2.6, 0.72, 0.78, B.stay]);
  // the set sail: its head along the yard from the throat, before the mast, to the peak; then the clew; and the
  // tack close abaft the mast's foot, plumb under the yard's place tackAft m abaft its sling
  const under = y.at(B.tackAft); B.tack = [under[0], B.tackY, under[2]];
  B.sail.push(y.at(y.throat), y.at(y.peak), B.clew, B.tack);
  // the hull's two high ends, a blade each: the forefoot, the post's foot, the post's head, the sheer
  for (const [t0, t1] of [[1 - B.blade, 1], [B.blade, 0]]) { const f0 = B.stern + len * t0, f1 = B.stern + len * t1;
    B.ends.push([[f0, hullKeel(t0), 0], [f1, hullKeel(t1), 0], [f1, B.stemHead, 0], [f0, hullSheer(t0), 0]]); }
}
// ---- THE THINGS THAT STAND BEYOND THE PAINTED FACE, in the gap's own frame: r metres behind the face along the
// gap's bearing, y up, t along the wall clockwise. The builders below and tools/film/sky-proof.mjs read these.
export const BEYOND = {
  ribBack: 3.4, ribHalf: 1.3,                                     // the shell's ribs: metres behind SEAM.frame (itself behind the face), half depth
  // the panels' trucks: metres in from the meeting edge (the left panel's, the right panel's), half length, how far
  // their frames stand out before their panel's skin, their tops over the water (the left panel's stand well in
  // from its edge: no sight line to the ring passes before them)
  trucks: { at: [[18, 34], [8.5, 25]], half: 2.6, out: 1.0, top: 1.8 },
  deck: { r0: 10, r1: 80, t0: 16, t1: 76, top: 1.2, rail: 2.3 },   // the decks either side of the channel
  gantry: { r: 36, legT: 27, top: 38, half: 3 },                   // two lattice legs and the bridge with its floodlamps
  drums: { r: 21, t: 24, y: 4.3, rad: 2.5 },                       // the cable drums on the decks
  hung: [[-0.62, 7], [-0.36, 9.5], [0.38, 8.5], [0.66, 6.5]],      // hung cables: gores off the middle, m behind the panels (their sway's phases: sky.clock)
  hungLow: 13.4,                                                   // the lowest a hung weight comes (m over the water)
  // THE BACKSTAGE, deep behind the ring's own plane: nothing of it stands between any place of the route and the
  // ring (tools/film/sky-proof.mjs draws every sight line from the route as laid and counts each piece)
  frames: { r: [84, 132, 186, 246], legT: 31, top: 42, half: 2.5 },   // portal frames across the channel, receding in a row
  cat: { t: 20.5, y: [13, 27], r0: 13, r1: 300, half: 0.8, every: 12 },   // catwalks either side at two levels, a work lamp every 12 m
  towers: [[52, 46, 34], [68, -60, 52], [38, 68, 26], [118, -52, 64], [150, 58, 46], [212, -44, 78], [262, 66, 58]],   // scaffold towers: r, t, height
  fly: [[75, 30, 26], [135, 55, 30], [195, 36, 24], [255, 70, 30], [315, 44, 22], [375, 80, 26], [435, 50, 20], [495, 66, 18]],   // fly galleries: m of arc up, m out behind the face, half length
  outer: 210,                                                      // the backstage's far wall: metres behind the painted face
};
// ---- THE ROUTE (the world flies it; tools/film/sky-proof.mjs reckons with the very same)
// THE LINE MEETS THE WALL ASLANT (ASLANT; tools/film/sky-proof.mjs counts it at every 2 m of the flown curve): at
// every place before the last straight, wherever the painted wall AHEAD along the heading (level) is within
// ASLANT.within m, the heading stands ASLANT.least degrees or more off square to the wall there (off the wall's
// own level normal where the heading meets it). The boat comes alongside the sky as alongside a quay; the wall
// runs away along the port hand. THE ONE EXCEPTION is the last straight into the seam: there the heading passes
// through the opening, not at painted wall.
// The route's measures (metres, degrees), each by the rule of the place it answers; no bearing of the wall is
// typed and none is fitted to a mark: every mark falls where these put it.
//   x0, z0     the first metre, in the harbour basin; the line leaves due north between the breakwater heads
//   sight      THE SEAM'S PLACE: the seam stands in the wall where the first metre's sight line to its middle meets
//              the wall a third of a right angle off square (so that the ring behind it stands whole between the
//              panels from the harbour on: the owner's condition 2); the gap's bearing is WORKED from that
//   skew, behind  the last straight meets the painted face all but square: skew degrees off, come from the hand the
//              wall leg lies on (the ring faces down the straight: its near rim so stands toward the harbour's sight
//              lines, and the straight runs in down the road of gold, which lies on the seam's own radius); the
//              ring stands behind m behind the face
//   clear      the last straight begins ASLANT.within m and our boat's own length before the face: the swing that
//              comes round for the seam is flown with the wall ahead more than ASLANT.within m off at every place
//   tailR, veer   leaving the wall: veer degrees to starboard on the radius tailR (a quarter turn: the line stands
//              square off the wall into the bay), a straight run AS LONG AS IT FALLS, then the swing to port on the
//              same radius onto the last straight
//   along, off the metres flown along the wall, and how far off the painted face that leg runs. THE LEG IS LAID
//              BACKWARD FROM THE SEAM: it ends where the tail (veer, run, swing, last straight) brings the line to
//              the seam, and begins along m before that
//   aslant, wallTurn   THE BAY LINE meets the wall at half a right angle (aslant: 5 degrees more than the rule asks,
//              the flown curve's own play): the straight that passes R sin(aslant) from the dome's middle, from
//              which the turn onto the wall leg (radius wallTurn, some eleven boat lengths, a turn a boat under
//              way makes) is tangent to the leg's own circle at its start; on that turn the heading only stands
//              further off square
//   bayTurn    the radius of the curve from north onto the bay line; where that curve begins on the north line
//              FALLS from the bay line's place (the wall ahead is there still over ASLANT.within m off)
// THE LAMP AND THE SHADOW (the lamp-sun, LAMP, is not moved): on the bay line and through the turn onto the wall leg
// the lamp stands on the STARBOARD QUARTER, the quarter away from the wall, so the boat's shadow is thrown ahead off
// the port bow: the mast's and the yard's stand on the wall ahead along the whole bay line, and BY SOME 20 m PAST
// THE MARK C (where the turn onto the wall leg begins; the proof prints the metre for each look) THE WHOLE
// SHADOW STANDS ON THE WALL AHEAD, some 30 degrees off the port bow: masthead, the yard's two ends and the stem and
// stern heads all land on the painted face, and between them the SET SAIL's whole shade, which is what the eye
// reads there (the hull's low body throws its shade on the water, where a mirror barely holds it, and on what
// stands in the water at the wall's foot).
// It stands whole on the wall from there along the whole wall leg, drawing aft toward the beam, and past the leg's end.
export const ASLANT = { least: 40, within: 200 };
export const ROUTE = { x0: -150, z0: 290, sight: 30, skew: 5, behind: 5, clear: BOAT.stem - BOAT.stern, tailR: 60, veer: 90,
  along: 230, off: 27, aslant: 45, wallTurn: 85, bayTurn: 150 };
// lays the route from its measures: a turtle of straights and arcs (side +1 to starboard, -1 to port); returns the
// way points, the legs' metre marks and the gap's bearing. Every solve is closed-form. A way point is put every
// 12 m of a straight and every 4 degrees of an arc, or closer: THE ROUTE THAT IS FLOWN. (Q.lineStep, metres, and
// Q.arcStep, degrees, which ROUTE does not carry, lay THE SAME LINE with its points closer: the proof counts the
// line itself so, beside the curve the engine flies through the route's own points. Nothing that is built reads them.)
export function layRoute(Q = ROUTE) {
  const R0 = SHELL.R, rD = R0 - Q.off, sk = Q.skew * RAD, inside = ASLANT.within + Q.clear, alongDeg = Q.along / rD / RAD;
  let pts = [], marks = {}, x = 0, z = -rD, h = 90, s = 0;
  const put = () => pts.push([x, BOAT.eye, z]);
  const line = (d) => { const n = Math.max(1, Math.ceil(d / (Q.lineStep || 12))); for (let i = 0; i < n; i++) { x += Math.sin(h * RAD) * d / n; z -= Math.cos(h * RAD) * d / n; put(); } s += d; };
  const arc = (r, deg, side) => { const n = Math.max(1, Math.ceil(Math.abs(deg) / (Q.arcStep || 4))), cx = x + side * Math.cos(h * RAD) * r, cz = z + side * Math.sin(h * RAD) * r;
    for (let i = 0; i < n; i++) { h += side * deg / n; x = cx - side * Math.cos(h * RAD) * r; z = cz - side * Math.sin(h * RAD) * r; put(); } s += r * Math.abs(deg) * RAD; };
  // THE TAIL, from the wall leg's end to the ring (closed form): the veer; the run, as long as brings the swing's
  // circle to where the last straight (skew off square at the face, begun `inside` m before it) is its tangent; the
  // swing to port onto that straight; the straight, through the face to the ring. Returns where it crossed the face.
  const tail = () => { const r = Q.tailR; arc(r, Q.veer, 1);
    const lim = Math.sqrt(R0 * R0 + inside * inside - 2 * inside * R0 * Math.cos(sk) + r * r + 2 * r * R0 * Math.sin(sk));       // the swing's centre stands this far from the dome's middle
    const hx = Math.sin(h * RAD), hz = -Math.cos(h * RAD), cx = x - hz * -r, cz = z - hx * r, B = cx * hx + cz * hz, C = cx * cx + cz * cz - lim * lim;
    const run = C > 0 ? Math.max(-B - Math.sqrt(Math.max(B * B - C, 0)), 0) : 0; if (run > 0) line(run); marks.swing = s;
    const ox = x + hz * r, oz = z - hx * r, out = bearingOf(ox, oz) + Math.asin(clamp((r + R0 * Math.sin(sk)) / Math.hypot(ox, oz), -1, 1)) / RAD;
    arc(r, ((h - out) % 360 + 360) % 360, -1); marks.straight = s;
    const dx = Math.sin(h * RAD), dz = -Math.cos(h * RAD), pd = x * dx + z * dz, t = -pd + Math.sqrt(pd * pd + R0 * R0 - x * x - z * z), cross = bearingOf(x + dx * t, z + dz * t);
    line(t + Q.behind / Math.cos(sk)); return cross; };
  // the tail's own span of wall: laid once from bearing 0 (the dome is round: the span is the same from any bearing)
  tail(); const span = ((bearingOf(x, z) + 540) % 360) - 180;
  // the seam's bearing, from the first metre's sight line (the triangle of the dome's middle, the first metre and
  // the seam's foot, by the sine rule); then the wall leg backward from it, and the bay line that meets it aslant
  const rho0 = Math.hypot(Q.x0, Q.z0), seam = bearingOf(Q.x0, Q.z0) - (180 - Q.sight - Math.asin(R0 * Math.sin(Q.sight * RAD) / rho0) / RAD);
  const wallStart = seam - span - alongDeg, dpL = R0 * Math.sin(Q.aslant * RAD), turn = Math.acos((dpL - Q.wallTurn) / (rD - Q.wallTurn)) / RAD;
  const beta = wallStart + 90 - turn, sb = Math.sin(beta * RAD), cb = Math.cos(beta * RAD), zs = -(dpL - Q.bayTurn + cb * (Q.bayTurn + Q.x0)) / sb;
  pts = []; marks = {}; x = Q.x0; z = Q.z0; h = 0; s = 0; put();
  line(Q.z0 - zs); marks.bayTurn = s;                                 // A and the first of B: north out of the harbour and up the bay
  arc(Q.bayTurn, beta, 1); marks.bayLine = s;                         // B: curving to the east-north-east
  const ct = dirOf(wallStart).multiplyScalar(rD - Q.wallTurn);
  line((ct.x - x) * sb - (ct.z - z) * cb); marks.C = s;               // B: the bay line, aslant to the sky, the lamp on the starboard quarter
  arc(Q.wallTurn, turn, 1); marks.D = s;                              // C: the starboard turn onto the wall leg
  arc(rD, alongDeg, 1); marks.E = s;                                  // D: along the sky, the wall Q.off m to port
  const cross = tail();                                               // E: out from the wall, round, and down the last straight
  // the gap's middle is the ring's own bearing (the ring stands in the middle of the gap, Q.behind m behind the
  // face); skew: degrees between the last straight and the wall's own normal where it crosses the face
  return { pts, marks, beta, gapBearing: bearingOf(x, z), cross, skew: cross - h, heading: h, length: s, wallStart, wallEnd: wallStart + alongDeg };
}
// ---- THREE LOOKS BY THE ROUTE'S OWN MARKS (the world flies them; tools/film/sky-proof.mjs counts them: one source).
// THE SEAM'S LOOK: THE TAIL'S SUBJECT IS THE SEAM. From the mark E (where the line leaves the wall) to the ring the
//   look's target is the seam's lit foot (the ring's own place, under the gantry). Its window opens
//   LOOKS.seam.before m before the mark E and stands WHOLE at the mark E (its fade is worked so); it is held whole
//   through the veer, the run and the swing and on down the last straight, and ends at the ring's own metre. It is
//   mixed ALONG THE ANGLE (arc) and keeps its whole weight for the steady camera (steady): the gaze turns
//   LOOKS.seam.weight of the seam's bearing off the bow toward it, so the seam stands within a fifth of that
//   bearing of the gaze's middle at every place of the tail, while the boat turns under the gaze. The proof counts
//   the bearing against LOOKS.limit (the engine's limit for a look's target off the route).
// THE RAIN'S LOOK: opens LOOKS.rain.after m past the mark B and ends at THE RAIN'S STATION (the place of the line
//   nearest the rain, found by the machines' homeRoute: the rain stands abeam there, 90 degrees off the bow, inside
//   the engine's limit); it stands whole until LOOKS.rain.fade of its window before the station.
// THE SHADOW'S LOOK: its target is the place where the middle of our sail's shade stands (SHADE.aim carried along
//   the light: on the water, then on the wall). It stands WHOLE at the metre from which THE WHOLE SHADOW stands on
//   the wall (shadowWholeFrom: the shadows of the masthead, the yard's two ends and the stem and stern heads all on
//   the wall, in both looks, at the middle and both ends of the lamp's creep), having opened over LOOKS.shadow.open
//   m before it; it is held whole through the turn and LOOKS.shadow.hold m of the wall leg (from the mark D), and
//   closes over LOOKS.shadow.open m more. The same stretch, from that metre to where the look is closed, is THE
//   SHADOW'S STRETCH: there the wall the shadow stands on is to be painted sky with nothing before it (shadowWall
//   tells the bearings of wall it sweeps; the proof counts it).
// THE PACE (paceAt: the world flies it, the proof reckons a look's seconds by it): 0.5 in the harbour; up to 1.3
//   from the mark B to the mark bayTurn; down to 0.9 across the mark C, 60 m either side of it; down to 0.8 from the
//   mark E to the mark swing. K: { B, bayTurn, C, E, swing } in metres of route.
export const LOOKS = { limit: 110, seam: { before: 130, weight: 0.8 }, rain: { after: 70, weight: 0.5, fade: 0.36 }, shadow: { open: 90, hold: 75, weight: 0.5 } };
export const paceAt = (m, K) => 0.5 + 0.8 * smoothstep(K.B, K.bayTurn, m) - 0.4 * smoothstep(K.C - 60, K.C + 60, m) - 0.1 * smoothstep(K.E, K.swing, m);
// (before: how far before the mark C the search for the whole shadow's first metre reaches; onWall: metres over the
// water from which a shadow counts as standing on the wall; aim: the sail's middle, the mean of its four corners.
// THE RULES THE PROOF HOLDS OVER THE SHADOW'S STRETCH: the sail's shade on the wall stands at least `wide` degrees
// wide and `tall` degrees tall at the eye (its height counted over the tops of the paddles before the wall's foot); the paint in its full shade stands at `dark` or less of the same paint
// beside it; the wall there is painted sky at least `gores` gores from the seam, nothing before it.
// THE CORNERS READ (the same stretch, both looks, on the wall as built). THE YARD AND THE HEAD CROSS THE MAST: the
// throat's shade stands `cross` m of wall or more before the mast's own line; the yard's heel stands before that
// line by a share of the yard's whole shade inside `heel` (about a quarter); and a share of the cloth's shade
// inside `fore` lies before the mast's line (some of it, and the lesser part by far). The shade's fore edge, from
// the paddles' tops up to the throat, stands `luff` or more of its after edge, from the paddles' tops up to the
// peak; the yard's shade stands out `out` m of wall or more past the peak; the mast's head stands `head` m or
// more over the yard; the least of those three lengths (the crossing, the stand-out, the head) is `sharp` or
// more times the half-shade's whole width there (the corners are not melted); and the yard's own shade is `spar`
// or more of full shade there (a spar stout enough for the lamp's half-shade).
// BEHIND EVERY GAZE (`behind`: turn, tilt, least, in degrees): the cloth as it is drawn, its belly breathed out
// and in, the boat still and lifted and tipped by the swell under the level eye, stands `least` degrees or more
// off the middle of every gaze that is turned up to `turn` degrees off the bow to either hand and tilted up to
// `tilt` degrees off the level; the proof counts it there, and counts besides how far the shadow's and the
// seam's looks turn and tilt the gaze as the engine mixes them)
export const SHADE = { before: 120, onWall: 0.05, wide: 2.4, tall: 3.6, dark: 0.5, gores: 7, luff: 0.4, out: 0.4, head: 1, cross: 0.4, heel: [0.18, 0.3], fore: [0.04, 0.2], sharp: 1.5, spar: 0.45,
  behind: { turn: 90, tilt: 20, least: 60 },
  aim: [0, 1, 2].map((i) => (BOAT.sail[0][i] + BOAT.sail[1][i] + BOAT.sail[2][i] + BOAT.sail[3][i]) / 4) };
// the shadow's heads: the masthead, the yard's two ends, the sail's throat and peak, the stem and stern heads
export const shadowHeads = () => { const Y = BOAT.cast[1]; return [[BOAT.mast.f, BOAT.mast.top, 0], [Y[0], Y[1], Y[2]], [Y[3], Y[4], Y[5]], BOAT.sail[0], BOAT.sail[1], [BOAT.stem, BOAT.stemHead - 0.06, 0], [BOAT.stern, BOAT.stemHead - 0.1, 0]]; };
// every place of the lamp the shadow is counted at: both looks, the middle and both ends of its creep
const shadowLamps = () => [0, 1].flatMap((look) => [0, Math.PI / 2, -Math.PI / 2].map((ph) => lampPlace(look, 0, new THREE.Vector3(), ph)));
// the first metre (to 1 m) from which the whole shadow stands on the wall, on to the mark D
export function shadowWholeFrom(path, length, C, D) {
  const p = new THREE.Vector3(), t = new THREE.Vector3(), out = new THREE.Vector3(), H = shadowHeads(), lamps = shadowLamps(); let first = Math.floor(D);
  for (let m = first; m > C - SHADE.before; m--) { path.pointAt(m / length, p); path.tangentAt(m / length, t); p.y = 0; const hd = Math.atan2(t.x, -t.z);
    for (const lamp of lamps) for (const h of H) if (shadowPoint(lamp, p, hd, h[0], h[1], h[2], out).y <= SHADE.onWall) return first;
    first = m; }
  return first;
}
// the wall the shadow sweeps from metre m0 to m1 (every 2 m, every lamp place above): { lo, hi } the least and the
// greatest bearing (degrees, unwrapped about the first) of any head's or sail corner's shadow on the wall, top: the
// highest of them, metres up the wall
export function shadowWall(path, length, m0, m1) {
  const p = new THREE.Vector3(), t = new THREE.Vector3(), out = new THREE.Vector3(), H = [...shadowHeads(), BOAT.sail[2], BOAT.sail[3]], lamps = shadowLamps(); let lo = Infinity, hi = -Infinity, top = 0, ref = null;
  for (let m = m0; m <= m1; m += 2) { path.pointAt(m / length, p); path.tangentAt(m / length, t); p.y = 0; const hd = Math.atan2(t.x, -t.z);
    for (const lamp of lamps) for (const h of H) { if (shadowPoint(lamp, p, hd, h[0], h[1], h[2], out).y <= SHADE.onWall) continue;
      const b = bearingOf(out.x, out.z); if (ref === null) ref = b; const bb = ref + ((b - ref + 540) % 360) - 180; lo = Math.min(lo, bb); hi = Math.max(hi, bb); top = Math.max(top, out.y); } }
  return { lo, hi, top };
}
export const shadowLook = (whole, D) => { const S = LOOKS.shadow, from = whole - S.open, to = D + S.hold + S.open; return { from, to, weight: S.weight, fade: S.open / (to - from) }; };
export const seamLook = (E, length) => ({ from: E - LOOKS.seam.before, to: length, weight: LOOKS.seam.weight, fade: LOOKS.seam.before / (length - E + LOOKS.seam.before), arc: true, steady: true });
export const rainLook = (B, station) => ({ from: B + LOOKS.rain.after, to: station, weight: LOOKS.rain.weight, fade: LOOKS.rain.fade });
const fl = (v) => { const s = String(Math.round(v * 1e4) / 1e4); return /[.e]/.test(s) ? s : s + '.'; };
const v3 = (a, b, c) => 'vec3(' + fl(a) + ',' + fl(b) + ',' + fl(c) + ')';

// ---- THE SHADOW LAW, as GLSL. One law for the water's layer and for the wall: the shade a point of the world
// takes from the boat, the light coming from the lamp-sun's OWN PLACE (uLamp) and the boat standing at its place on
// the route (uBoat: x, lift over still water, z, heading as a bearing in radians).
// THE HALF-SHADE GROWS WITH THE THROW, and a thin member's shade FADES with it. The lamp is a wide drum, not a
// point: from a place its hot core (SHADOW.core m of radius) stands SHADOW.core / T wide (T: metres from the place
// to the lamp), and the half-shade round a member's shadow is that width times the THROW (metres from the member
// to the place along the light). ON THE SURFACE the shadow lies on, ACROSS the light that half-shade is as wide as
// the light's slant draws things out there (1 / cos of the incidence, at most 1 / SHADOW.slantFloor); ALONG the
// light's run, on a surface the light only grazes, it is the WHOLE DRUM's (SHADOW.drum m of radius: the lamp stands
// as tall over the sea as it hangs above it), so that a shadow lying on the water dissolves along its length.
// A member thinner than its half-shade throws only a share of shade (its width over the half-shade's; the hull, a
// body, its two widths' shares). So on a surface that faces the lamp (the painted wall along the wall leg) the
// boat's shadow stands whole and plain: THE SET SAIL'S BROAD SHADE (a body with area and four corners: full shade
// over its whole breadth, its edges a hand or two soft), the mast's line crossing its fore part and the mast's
// head above it, the yard along the sail's head, its heel before the mast's line and its after end out past the
// peak, the hull's two high ends (a blade each,
// BOAT.ends, under the posts' heads), and the stays as the faintest hairlines: hemp cast as thin as it is, a
// share of shade the eye cannot read (the law is SHAPED so: there the core alone counts);
// and on the water, which the low lamp's light only grazes, the law gives one soft hull shape by the boat,
// dissolving away from it, and the mast's line and the sail's shade die within some tens of metres (WHAT THE
// WATER SHOWS OF IT is the sea's own paint, WATER_SHADE: a shadow on a mirror, off the water's body light alone).
// Nothing of this reads how we look: only the lamp's
// place, the boat's place, the place shaded and the facing of its surface (and the pixel's footprint foot, in
// metres, as a filter).
//   boatShadeOn(P, N, foot): the shade at world place P on a surface whose unit normal is N
//   boatShade(P, foot): the same for a surface that faces the lamp
export const SHADOW = { core: 1.7, drum: 12, slantFloor: 0.03 };
export const GLSL_SHADOW = /* glsl */`
uniform vec3 uLamp; uniform vec4 uBoat;
vec3 toBoat(vec3 p){ vec2 h = vec2(sin(uBoat.w), -cos(uBoat.w)); vec2 q = p.xz - uBoat.xz; return vec3(dot(q, h), p.y - uBoat.y, dot(q, vec2(-h.y, h.x))); }
// E: xyz the unit way ALONG the surface and across the light, w the half-shade's rate that way (metres for a metre
// of throw); kv: its rate the other way across the light
float capShade(vec3 P, vec3 D, vec3 A, vec3 B, float r, vec4 E, float kv, float foot){
  vec3 v = B - A, w = P - A; float b = dot(D, v), c = dot(v, v), d = dot(D, w), e = dot(v, w);
  float tc = clamp((e - b * d) / max(c - b * b, 1e-5), 0., 1.), sc = max(b * tc - d, 0.);
  vec3 q = w + D * sc - v * tc; float dist = length(q), ca = dot(q, E.xyz) / max(dist, 1e-4);
  float pa = E.w * sc + .5 * foot + .004, pv = kv * sc + .5 * foot + .004, pen = sqrt(mix(pv * pv, pa * pa, clamp(ca * ca, 0., 1.)));
  return (1. - smoothstep(r - pen, r + pen, dist)) * min(1., 1.5 * r / pa); }
// A FLAT CLOTH OF FOUR CORNERS (the set sail, and each blade of the hull's two ends: A, B, C, G round it), as it stands ACROSS the light from P: the shade
// is how far inside every one of its four edges P lies there, each edge soft by the half-shade the way that edge
// faces (E, kv as above), the throw taken to the cloth's middle; a cloth seen edge on by the light, narrower
// than its half-shade, throws only a share of shade (its two edges' halves meet)
float clothEdge(vec2 p, vec2 q, vec2 e2, float pa, float pv, float turn){
  vec2 t = q - p; vec2 n = vec2(-t.y, t.x) / max(length(t), 1e-4); float ca = dot(n, e2);
  float pen = sqrt(mix(pv * pv, pa * pa, clamp(ca * ca, 0., 1.)));
  return smoothstep(-pen, pen, turn * dot(-p, n)); }
float clothShade(vec3 P, vec3 D, vec3 A, vec3 B, vec3 C, vec3 G, vec4 E, float kv, float foot){
  float sc = dot((A + B + C + G) * .25 - P, D), on = step(0., sc); sc = max(sc, 0.);
  vec3 u = normalize(vec3(D.z, 0., -D.x) + vec3(1e-5, 0., 0.)), w = cross(D, u);
  vec2 a = vec2(dot(A - P, u), dot(A - P, w)), b = vec2(dot(B - P, u), dot(B - P, w)), c = vec2(dot(C - P, u), dot(C - P, w)), g = vec2(dot(G - P, u), dot(G - P, w));
  vec2 e2 = vec2(dot(E.xyz, u), dot(E.xyz, w)); float pa = E.w * sc + .5 * foot + .004, pv = kv * sc + .5 * foot + .004;
  float turn = sign(a.x * b.y - a.y * b.x + b.x * c.y - b.y * c.x + c.x * g.y - c.y * g.x + g.x * a.y - g.y * a.x);
  return on * clothEdge(a, b, e2, pa, pv, turn) * clothEdge(b, c, e2, pa, pv, turn) * clothEdge(c, g, e2, pa, pv, turn) * clothEdge(g, a, e2, pa, pv, turn); }
float boatShadeOn(vec3 Pw, vec3 Nw, float foot){
  vec3 P = toBoat(Pw), L = toBoat(uLamp), D = L - P; float T = max(length(D), 1e-3); D /= T;
  vec3 c0 = P - vec3(${fl(BOAT.mid)}, 2.6, 0.); float s0 = max(-dot(c0, D), 0.);
  if (s0 >= T || length(c0 + D * s0) > 6.4 + foot) return 0.;
  vec2 hb = vec2(sin(uBoat.w), -cos(uBoat.w)); vec3 Nb = vec3(dot(Nw.xz, hb), Nw.y, dot(Nw.xz, vec2(-hb.y, hb.x)));
  float nd = abs(dot(Nb, D)), kv = mix(${fl(SHADOW.core)}, ${fl(SHADOW.drum)}, (1. - nd) * (1. - nd)) / T, ka = ${fl(SHADOW.core)} / T / max(nd, ${fl(SHADOW.slantFloor)});
  vec3 eA = cross(Nb, D); float la = length(eA); eA = la > 1e-3 ? eA / la : vec3(0.); vec3 eV = cross(D, eA); vec4 E = vec4(eA, ka);
  vec3 ax = ${v3(BOAT.hull[3], BOAT.hull[4], BOAT.hull[5])}, Pe = (P - ${v3(BOAT.hull[0], BOAT.hull[1], BOAT.hull[2])}) / ax, De = D / ax;
  float te = max(-dot(Pe, De) / max(dot(De, De), 1e-6), 0.);
  vec3 qe = Pe + De * te, qw = qe * ax; float len = length(qe), lw = max(length(qw), 1e-4), ca = dot(qw, eA) / lw;
  float pa = ka * te + .5 * foot + .004, pv = kv * te + .5 * foot + .004, pen = sqrt(mix(pv * pv, pa * pa, clamp(ca * ca, 0., 1.)));
  float pe = pen / clamp(lw / max(len, 1e-3), ${fl(BOAT.hull[4])}, ${fl(BOAT.hull[3])});          // the half-shade in the hull's own measure that way
  float sh = (1. - smoothstep(1. - pe, 1. + pe, len)) * min(1., max(length(eA * ax), ${fl(BOAT.hull[4])}) / pa) * min(1., max(length(eV * ax), ${fl(BOAT.hull[4])}) / pv);
${BOAT.cast.map((c) => `  sh = max(sh, capShade(P, D, ${v3(c[0], c[1], c[2])}, ${v3(c[3], c[4], c[5])}, ${fl(c[6])}, E, kv, foot));`).join('\n')}
  sh = max(sh, clothShade(P, D, ${BOAT.sail.map((q) => v3(q[0], q[1], q[2])).join(', ')}, E, kv, foot));
${BOAT.ends.map((q) => `  sh = max(sh, clothShade(P, D, ${q.map((c) => v3(c[0], c[1], c[2])).join(', ')}, E, kv, foot));`).join('\n')}
  return sh; }
float boatShade(vec3 Pw, float foot){ vec3 d = uLamp - Pw; return boatShadeOn(Pw, d / max(length(d), 1e-3), foot); }
`;
// the law's two uniform objects, made once for each world built (makeSky makes them: sky.shadow); every material
// that includes GLSL_SHADOW takes these two by reference, so one write of the boat's place serves them all
export const shadowUniforms = () => ({ uLamp: { value: new THREE.Vector3(0, 100, 0) }, uBoat: { value: new THREE.Vector4(0, -1e4, 0, 0) } });
// the same law in JS, for one point of the boat (f ahead, y up, s to starboard): where its shadow lands. The ray from
// the lamp through the point meets the water inside the shell, or else the shell (out.y is then above the water).
const _q = new THREE.Vector3(), _d = new THREE.Vector3();
export function shadowPoint(lamp, boat, heading, f, y, s, out = new THREE.Vector3()) {
  const hx = Math.sin(heading), hz = -Math.cos(heading);
  _q.set(boat.x + f * hx - s * hz, boat.y + y, boat.z + f * hz + s * hx); _d.subVectors(_q, lamp);
  const tw = _d.y < -1e-6 ? -lamp.y / _d.y : Infinity;
  if (tw < 1e5) { out.copy(lamp).addScaledVector(_d, tw); if (out.x * out.x + out.z * out.z <= SHELL.R * SHELL.R) return out; }
  const a = _d.dot(_d), b = lamp.dot(_d), c = lamp.dot(lamp) - SHELL.R * SHELL.R, t = (-b + Math.sqrt(Math.max(b * b - a * c, 0))) / a;
  return out.copy(lamp).addScaledVector(_d, t);
}
// ---- THE PAINTED SHELL. One shader paints the inside of the sphere by a point's HOME place on it (a rolled panel
// carries the paint of where it came from): from the bay a sky, near to a wall of bolted panels.
// (h11, h21: THE KIT'S OWN HASHES, carried here as src/kit/sky.js has them; they follow Hash without Sine, by
// David Hoskins, 2014, MIT, which the site's notices file names: covered by section 181 a, nothing brought in)
const GLSL_NOISE = /* glsl */`
float h11(float p){ p = fract(p * .1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float fb3(vec2 p){ return vn(p) * .57 + vn(p * 2.13 + 7.1) * .29 + vn(p * 4.31 + 3.7) * .14; }
`;
// THE BACKSTAGE'S LIGHT by the height of a place in it: the work lamps' gold, strongest low down where most of them
// stand and HELD THROUGH THE WHOLE HEIGHT (galleries with their lamps stand at every level to far overhead): no
// part of the seam is a dark field (its far wall, its lit air and its image in the sea all take this one law)
const GLSL_BEYOND = /* glsl */`
vec3 beyondGlow(float y){ float g = exp(-max(y, 0.) / 80.), h = exp(-max(y, 0.) / 1800.);
  return vec3(1.2, .6, .17) * (.5 * g * g + .5 * h) + vec3(.42, .17, .05) * g * .6 + vec3(.02, .035, .08); }
`;
// THE SEAM'S SHAPE as GLSL (SEAM, seamRake, seamHalf above). seamOpen(az, e, hw, soft): how open the seam stands at
// a place of the painted face (az: rad from the gap's meridian; e: rad up the dome; hw: half the gap at the water,
// metres; soft: metres of soft edge): 0 behind a panel .. 1 in the opening
const GLSL_SEAM = /* glsl */`
float seamRake(float side, float arc){ float a = max(arc - ${fl(SEAM.plumb)}, 0.); return (side < 0. ? ${fl(SEAM.rake[0])} : ${fl(SEAM.rake[1])}) * a * a / (a * a + ${fl(SEAM.ease * SEAM.ease)}); }
float seamOpen(float az, float e, float hw, float soft){ float ce = cos(e), x = az * ${fl(SHELL.R)} * ce, arc = e * ${fl(SHELL.R)}, c = hw * ce;
  return smoothstep(-soft, soft, x + c - seamRake(-1., arc)) * smoothstep(-soft, soft, c - seamRake(1., arc) - x) * (1. - smoothstep(${fl(SEAM.top - 6)}, ${fl(SEAM.top)}, arc)); }
`;
// THE PAINTING: az (rad, 0 at the gap, wraps), e (rad of elevation from the bay's middle). Returns rgb and, in a, how
// much of the place is cloud. A GRAND sky as a scene painter builds one: a few great cumulus masses of very different
// sizes heaped up in towers (typed below, no two alike, none evenly spaced), a scatter of far small ones low in the
// haze (dealt in crowds and empty stretches), thin high streaks, the light from the lamp-sun's side of the dome.
export const PAINT_SEED = 3.7;                                  // the painting's one seed (the same painting on every seed of the world)
export const MASSES = [   // [az from the gap (rad), base (rad up), half width (rad), height (rad), towering 0..1, seed]
  [-1.24, 0.085, 0.37, 0.43, 1.0, 3.1], [-0.33, 0.06, 0.5, 0.25, 0.55, 7.7], [-0.79, 0.04, 0.17, 0.1, 0.8, 12.4],
  [-1.78, 0.05, 0.13, 0.085, 0.3, 19.9], [-2.52, 0.075, 0.46, 0.34, 0.9, 23.3], [0.57, 0.055, 0.26, 0.16, 0.7, 31.8],
  [1.48, 0.1, 0.52, 0.37, 1.0, 37.2], [2.18, 0.045, 0.3, 0.1, 0.2, 41.5], [-3.02, 0.05, 0.22, 0.13, 0.6, 47.9],
  [-0.97, 0.36, 0.13, 0.06, 0.1, 53.6], [0.95, 0.3, 0.2, 0.08, 0.15, 59.3],
  // the middle-sized ones that stand LOW, their flat bases 9 to 13 m up the wall (a degree and a half over the
  // sea-line from the bay): round the whole dome, so that the wall near carries cloud as the sky far does
  [-1.0, 0.022, 0.105, 0.08, 0.55, 61.3], [-0.55, 0.03, 0.08, 0.06, 0.35, 67.9], [-1.5, 0.026, 0.09, 0.075, 0.7, 71.2], [0.21, 0.024, 0.1, 0.07, 0.4, 77.5],
  [1.05, 0.03, 0.085, 0.065, 0.6, 83.1], [2.7, 0.02, 0.11, 0.08, 0.5, 89.7], [-2.1, 0.028, 0.095, 0.07, 0.45, 93.3],
];
const GLSL_PAINT = /* glsl */`
uniform vec3 uZen, uMid, uHaze, uCloudLit, uCloudShade, uSeaLine, uSunGlow; uniform float uBlush, uPaintSeed, uSunAz;
// PAINT HAS EDGES WHERE A PIXEL HOLDS ITS STROKES (gHard: 1 where a pixel holds one brush stroke, 0 where it holds
// many; set by the wall, and by the sea's mirror, from the pixel's footprint on the wall alone): a cloud's
// outline is a cut edge, and its light is laid in a few flat tones with hard borders, as a scene painter lays
// them; where a pixel is larger than the strokes it has their mean: the same clouds soft, and they read as sky
float gHard = 0.;
// THE PAINTED EVENING (gEve: 0 .. 1 by the BEARING ALONE, a fixed painting, the same at every metre and from every
// place): round most of the dome the painters laid an afternoon; toward the opening, from some sixty degrees either
// side of it, they turned it by degrees to an evening: a band of gold at the painted sea-line going to rose above
// it, the blue over it gone to violet, the clouds' undersides rose and gold and their heads a pale peach
float gEve = 0.;
// DEEPER BY THE SEAM (gDusk: 0 .. 1, again by the bearing alone: 0 beyond some 35 degrees from the opening, 1 at it):
// there the evening is painted a full tone darker, the band at the sea-line thin and going to rose, violet over it
// and a dusk blue above, the clouds violet with rose heads: the lit seam stands bright against a dark painted sky
float gDusk = 0.;
// one cumulus in its own frame: q.x across (-1..1), q.y up from its flat base (0..1 to its top). sd: its seed; tw: how
// far it towers; nz: the sky's shared noises (fine, broad); ls: the lamp's side (-1..1). Returns x: how much cloud,
// y: its light (0 in shade .. 1 lit). Seven heaps: three along the base, two shoulders, the tower's head, a side puff.
vec2 cumulus(vec2 q, float sd, float tw, vec2 nz, float ls){
  if (abs(q.x) > 1.25 || q.y < -.12 || q.y > 1.25) return vec2(0.);
  q += (nz.yx - .5) * vec2(.2, .12);
  float f1 = -1., f2 = -1., ws = 1e-4; vec2 nb = vec2(0., 1e-4);
  for (int j = 0; j < 7; j++){ float fj = float(j), a = h11(sd + fj * 1.7), b = h11(sd * 1.3 + fj * 2.9 + 4.);
    vec2 c; float r;
    if (j < 3) { c = vec2((fj - 1.) * .5 + (a - .5) * .28, .2 + .08 * b); r = .42 + .14 * b; }
    else if (j < 5) { c = vec2((fj - 3.5) * .66 + (a - .5) * .3, .42 + .14 * b); r = (.28 + .12 * a) * (.55 + .45 * tw); }
    else if (j < 6) { c = vec2((h11(sd + 9.) - .5) * .7 + (a - .5) * .1, .68 + .12 * b); r = (.2 + .1 * b) * tw; }
    else { c = vec2((a < .5 ? -1. : 1.) * (.78 + .1 * b), .13 + .05 * b); r = .2 + .1 * b; }
    if (r < .09) continue;                                      // (a heap too small to paint)
    vec2 d = (q - c) / vec2(r * 1.18, r); float f = 1. - length(d), w = exp(min(f, 1.) * 7.);
    nb += d * w; ws += w;                                        // the heaps melt into one another: their faces blend
    if (f > f1) { f2 = f1; f1 = f; } else if (f > f2) f2 = f; }
  float m = smoothstep(mix(-.1, .042, gHard), mix(.22, .078, gHard), f1 + (nz.x - .5) * .55) * smoothstep(mix(-.05, .009, gHard), mix(.08, .021, gHard), q.y + (nz.y - .5) * .06);
  vec2 n = nb / ws; n = n / max(length(n), .35);                // (a heap's broad face is flat to the light)
  float lit = .56 + .44 * dot(n, normalize(vec2(ls * .8, .62)));
  lit -= .12 * (1. - smoothstep(0., .3, f1 - f2)) * smoothstep(.1, .5, f1);   // the soft creases between the heaps
  lit *= .38 + .62 * smoothstep(-.02, .5, q.y);                 // the shadowed base
  return vec2(m, clamp(lit + (nz.x - .5) * .3, 0., 1.)); }
// the far small ones: one to a cell of the round, dealt in crowds and empty stretches, each its own size, height and base
vec3 farCloud(float az, float e, float cells, float sd, vec2 nz, float ls){
  float x = (az / 6.2831853 + .5) * cells + sd * 7.31, ci = floor(x), id = mod(ci, cells) + sd * 31.7, cw = 6.2831853 / cells;
  float r0 = h11(id), r1 = h11(id + 5.3), r2 = h11(id + 9.1), r3 = h11(id + 2.2);
  float crowd = smoothstep(.3, .62, vn(vec2(mod(ci, cells) * .43 + sd * 3., sd)));
  if (r0 > .3 + .62 * crowd) return vec3(0.);
  float hf = .15 + .25 * r2, off = (r3 - .5) * (1. - 2.5 * hf), eb = .005 + .05 * r1 * r1, hw = hf * cw;
  vec2 cm = cumulus(vec2((fract(x) - .5 - off) / hf, (e - eb) / (hw * (.4 + .5 * r0 / .9))), id, r1, nz, ls);
  return vec3(cm, eb); }
// lays one cloud over the sky: its lit and shaded paint, the LOW SUN's blush, the haze it stands in by its base
float gRelief = 0.;
void lay(inout vec3 col, inout float cl, vec2 cm, float eb){
  cm.y = clamp(cm.y + clamp(gRelief, -.4, .5) * (.35 + .65 * cm.y), 0., 1.);
  float qy = cm.y * 5., ky = (floor(qy) + smoothstep(.4, .6, fract(qy))) / 5.; cm.y = mix(cm.y, ky, gHard * .85);   // flat tones, hard borders
  vec3 cc = mix(uCloudShade * vec3(.8, .84, .92), uCloudLit, smoothstep(.16, .86, cm.y));
  cc = mix(cc, cc * vec3(1.06, .9, .82), uBlush * (1. - cm.y) * .8) + uBlush * vec3(.1, .02, -.02) * cm.y;
  vec3 ev = mix(mix(vec3(.6, .25, .36), vec3(1., .5, .2), smoothstep(.1, .45, cm.y)), vec3(1., .78, .5), smoothstep(.55, .95, cm.y));
  ev = mix(ev, mix(vec3(.3, .19, .4), vec3(.92, .42, .38), smoothstep(.35, .9, cm.y)), gDusk * .8);   // (by the seam: violet, rose heads)
  cc = mix(cc, ev, gEve * .9);                                  // the evening's clouds: rose and gold below, gold-cream heads
  float hz = .4 * exp(-eb * 22.); cc = mix(cc, mix(uHaze, mix(vec3(1., .62, .3), vec3(.66, .32, .42), gDusk), gEve * .85), hz);
  col = mix(col, cc, cm.x * (1. - .3 * hz)); cl = max(cl, cm.x); }
// fine, relief: the brush's own grain and the small billows' modelling at the place (signed; the wall gives them
// where a pixel is fine enough to hold them, the sea's mirror gives 0): they break the clouds' edges and tones
// into strokes and puffs
vec4 paintSky(float az, float e, float fine, float relief){
  float t = clamp(e / 1.5708, 0., 1.);
  float dS = mod(az - uSunAz + 3.14159265, 6.2831853) - 3.14159265;          // round the dome from the lamp-sun's place
  // the gradient as paint: a light blue at the sea-line (the haze band is a tint of the sky's own blue, not a
  // white, and only some 8 m tall), the clear deep blue above it (so that the wall near is sky BLUE), deepening
  // to the zenith; the dome's own air pales the far wall's foot from across the bay
  vec3 col = mix(mix(uHaze, uMid, .5), mix(uMid, uZen, .5), smoothstep(-.02, .022, t)); col = mix(col, uZen, smoothstep(.035, .7, t));
  col = mix(col, uHaze * vec3(1.03, 1., .96), .5 * exp(-e * 110.));           // the pale band at the sea-line
  gEve = 1. - smoothstep(.3, 1.08, abs(az));                                  // the painted evening, by the bearing from the opening
  gDusk = 1. - smoothstep(.05, .62, abs(az));                                 // and deeper by the seam
  col = mix(col, col * vec3(.52, .44, .82) + vec3(.03, 0., .05), gEve * .8 * smoothstep(.06, .5, e));
  col = mix(col, col * vec3(.36, .4, .78) + vec3(.008, .008, .035), gDusk * .8 * smoothstep(.1, .6, e));   // a dusk blue above
  // (the band at the painted sea-line: rose, going to a violet rose by the seam; the gold in it is a thin band at
  // the water, some 30 m tall round the evening and some 12 m by the seam)
  col = mix(col, mix(vec3(.8, .3, .34), vec3(.5, .2, .36), gDusk), gEve * .92 * exp(-e * 6.));
  col = mix(col, vec3(1., .55, .18), gEve * (.92 - .3 * gDusk) * exp(-e * (14. + 22. * gDusk)));
  col += uSunGlow * (.5 * exp(-(dS * dS * 2.4 + e * e * 10.)) + .22 * exp(-(dS * dS * .5 + e * e * 3.)));   // the lamp's side glows
  col *= 1. - .12 * smoothstep(1.3, 3., abs(dS)) * (1. - t);                 // and the far side is a deeper blue
  vec2 q0 = vec2(az * 26., e * 34.) + uPaintSeed; float n0 = fb3(q0);
  vec2 nz = vec2(n0 + fine, fb3(vec2(az * 7.3 + 3., e * 9.) + uPaintSeed * 1.7));
  float ls = clamp(sin(uSunAz - az) * 2.5, -1., 1.), cl = 0.;
  // the billows a painter models inside a cloud: every puff has its lit side toward the lamp and a blue-grey
  // underside (the same grain read a step toward the light); the wall's small puffs and strokes ride on them
  gRelief = (n0 - fb3(q0 + vec2(ls * .42, .38))) * .8 + relief;
  // thin high streaks, brushed long and slanting
  float st = fb3(vec2(az * 2.1 + e * 1.3 + uPaintSeed, (e - az * .3) * 15.)) * .7 + .3 * fb3(vec2(az * 5. - 2., (e - az * .3) * 31.));
  float wisp = smoothstep(.5, .78, st) * smoothstep(.34, .6, e) * (1. - smoothstep(1.1, 1.5, e));
  col = mix(col, mix(mix(uCloudLit, vec3(1., .66, .45), gEve * .8), col, .3), wisp * .55);
  // the far small ones low in the haze, then the great masses
  vec3 fc;
${[[41, 1.3], [26, 2.9], [15, 4.6]].map(([n, sd]) => `  fc = farCloud(az, e, ${fl(n)}, ${fl(sd)} + uPaintSeed, nz, ls); lay(col, cl, fc.xy, fc.z);`).join('\n')}
${MASSES.map((m) => `  lay(col, cl, cumulus(vec2((mod(az - ${fl(m[0])} + 3.14159265, 6.2831853) - 3.14159265) / ${fl(m[2])}, (e - ${fl(m[1])}) / ${fl(m[3])}), ${fl(m[5])}, ${fl(m[4])}, nz, ls), ${fl(m[1])});`).join('\n')}
  col *= 1. - .24 * gEve - .26 * gDusk;                          // (an evening is painted a tone deeper than an afternoon; two by the seam)
  return vec4(col, cl); }
`;
const NBOARD = 18;
// THE NOISE'S OWN LAW (for the means the filtering needs): how often the value noise vn stands under each height,
// worked from its own make by exact arithmetic. At a place of a cell vn is the sum of the cell's four dice, each
// spread evenly over its own share of the place (the four products of the place's two smoothed shares), and how
// often such a sum stands under t is known whole (vnDice: over every set of the widths, the excess of t over the
// set's sum raised to the count of the widths, signed by the set's size, over that count's factorial times the
// widths' product). VN_LAW: that, meaned over a quarter of the cell (half of it each way: the law is the same
// either side of a cell's middle, and with its two ways changed over) at VN_M even places each way, at every
// 1 / VN_N of height; vnUnder reads it between those by the cubic through the four heights about a place.
// vnMean(a, b): the mean of smoothstep(a, b, vn) over the wall: the cut's whole less the sum of its slope times
// the law (Simpson's rule on VN_S parts of the cut). vnMeanRow(a, b, ty): the same along ONE LINE of the noise
// that stands at the share ty between two rows of dice (a mark that holds the noise's second place for a whole
// course has that line's mean, not the field's). vnMean2(a, b, p, q): the same of p vn + q vn', two noises that
// do not know one another. HOW TRUE (against the same law summed by its pieces at forty places each way): within
// 1.1 in ten thousand of the mean for every cut that opens at 0.92 or under, 6 to 8 in ten thousand at 0.94 to
// 0.96, 2 in a hundred at 0.98, where the mean itself is 0.00002. Worked once when the part is read: no die is
// thrown, nothing is typed in the worked number's place.
const VN_N = 64, VN_M = 8, VN_S = 16;
const vnCell = (fx, fy) => { const w = [(1 - fx) * (1 - fy), fx * (1 - fy), (1 - fx) * fy, fx * fy].filter((v) => v > 1e-12), n = w.length, S = new Float64Array(1 << n), G = new Float64Array(1 << n); let d = 1; G[0] = 1;
  for (let k = 0; k < n; k++) { d *= (k + 1) * w[k]; for (let m = 0; m < 1 << k; m++) { S[m + (1 << k)] = S[m] + w[k]; G[m + (1 << k)] = -G[m]; } }
  return { n, S, G, d }; };
const vnDice = (c, t) => { let q = 0; for (let m = 0; m < c.S.length; m++) { const x = t - c.S[m]; if (x > 0) { let p = x; for (let e = 1; e < c.n; e++) p *= x; q += c.G[m] * p; } } return q / c.d; };
const VN_F = Array.from({ length: VN_M }, (_, i) => smoothstep(0, 1, (i + 0.5) / (2 * VN_M)));
const VN_LAW = (() => { const law = new Float64Array(VN_N + 1); law[VN_N] = 1;
  for (let i = 0; i < VN_M; i++) for (let j = 0; j <= i; j++) { const c = vnCell(VN_F[i], VN_F[j]), part = (i === j ? 1 : 2) / (VN_M * VN_M); for (let k = 1; k < VN_N; k++) law[k] += part * vnDice(c, k / VN_N); }
  return law; })();
const vnUnder = (t) => { if (t <= 0) return 0; if (t >= 1) return 1; const x = t * VN_N, k = clamp(Math.floor(x), 1, VN_N - 2), u = x - k, L = VN_LAW;
  return -u * (u - 1) * (u - 2) / 6 * L[k - 1] + (u + 1) * (u - 1) * (u - 2) / 2 * L[k] - (u + 1) * u * (u - 2) / 2 * L[k + 1] + (u + 1) * u * (u - 1) / 6 * L[k + 2]; };
const stepS = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const vnCut = (law, a, b) => { const lo = Math.max(a, 0), hi = Math.min(b, 1); if (hi <= lo) return a >= 1 ? 0 : 1; const h = (hi - lo) / VN_S; let s = 0;
  for (let i = 0; i <= VN_S; i++) { const x = lo + i * h, u = (x - a) / (b - a); s += (i === 0 || i === VN_S ? 1 : i % 2 ? 4 : 2) * 6 * u * (1 - u) / (b - a) * law(x); }
  return stepS(a, b, hi) - s * h / 3; };
const vnMean = (a, b) => vnCut(vnUnder, a, b);
const vnMeanRow = (a, b, ty) => { const cells = VN_F.map((f) => vnCell(f, smoothstep(0, 1, ty))); return vnCut((t) => t <= 0 ? 0 : t >= 1 ? 1 : cells.reduce((s, c) => s + vnDice(c, t), 0) / VN_M, a, b); };
const vnMean2 = (a, b, p, q) => { let s = 0; for (let k = 0; k < VN_N; k++) s += (VN_LAW[k + 1] - VN_LAW[k]) * vnMean((a - q * (k + 0.5) / VN_N) / p, (b - q * (k + 0.5) / VN_N) / p); return s; };
// (a line's own mean of a cut of the noise at every tenth between two rows of the noise's dice, from a row, 0, to
// midway, 5: vnRows; and as GLSL, straight between those, s naming the line's share in tenths from the nearer row:
// vnRowGLSL. STREAK_ROWS, JOINT_ROWS: the wall's two cuts that hold a line, its plates' streaks and its cross joints')
const vnRows = (a, b) => [0, 1, 2, 3, 4, 5].map((k) => vnMeanRow(a, b, k / 10));
const vnRowGLSL = (R, s) => `(${f6(R[0])}${R.slice(1).map((v, k) => ` + ${f6(v - R[k])} * clamp(${s} - ${k}., 0., 1.)`).join('')})`;
const STREAK_ROWS = vnRows(0.7, 0.95), JOINT_ROWS = vnRows(0.62, 0.9);
// THE ROAD OF GOLD'S MEAN ACROSS THE ROAD (the sea's own line reads it): either of the road's two marks is the noise
// cut by smoothstep(thr, thr + 0.1), thr = 1 - 0.44 road, road the road's own strength at a place (1 on its middle
// line, falling to nothing either hand). ROAD_MEAN[k]: that cut's mean at road = k / 20, by the noise's own law
const ROAD_MEAN = Array.from({ length: 21 }, (_, k) => vnMean(1 - 0.022 * k, 1.1 - 0.022 * k));
// (Gauss's rule at four places on -1 to 1, its places and their weights: exact for every power to the seventh)
const GAUSS4 = (() => { const a = 2 / 7 * Math.sqrt(6 / 5), x0 = Math.sqrt(3 / 7 - a), x1 = Math.sqrt(3 / 7 + a), w0 = (18 + Math.sqrt(30)) / 36, w1 = (18 - Math.sqrt(30)) / 36;
  return { x: [-x1, -x0, x0, x1], w: [w1, w0, w0, w1] }; })();
// THE LAW OF FILTERING, as GLSL (the wall, the sea's mirror and the backstage wall all take it): what a pixel
// larger than a mark has of it. Only the pixel's footprint on the thing is read; no metre from the eye.
const GLSL_FILTER = /* glsl */`
// A LINE of half width w at distance d, under a pixel fw metres wide: DRAWN A PIXEL WIDE AT THE LEAST AND CARRYING
// THE COVER IT TRULY HAS (its own width over the width drawn, whole: no floor, no share kept)
float ln(float d, float w, float fw){ float ww = max(w, .5 * fw); return clamp((ww - d) / fw + .5, 0., 1.) * (w / ww); }
// the same line where it comes again every P metres: ITS OWN MEAN, 2 w / P, once a pixel is a period wide
float lnP(float d, float w, float P, float fw){ return mix(2. * w / P, ln(d, w, fw), 1. - smoothstep(.5 * P, P, fw)); }
// A ROUND DOT of radius r likewise: drawn to the radius rr, half a pixel at the least, its edge a ramp one pixel
// wide. That drawing's sum over the wall is pi (rr rr + f f / 12), so it carries r r over that: THE DOT'S SUM IS
// ITS OWN AREA, pi r r, AT EVERY FOOTPRINT (no more while a pixel is still about the dot's size, no less after)
float dotc(float d, float r, float f){ float rr = max(r, .5 * f); return clamp((rr - d) / f + .5, 0., 1.) * (r * r) / (rr * rr + f * f / 12.); }
// HOW MUCH OF A MARK S METRES ACROSS A PIXEL f METRES WIDE STILL HOLDS (1: the mark stands; 0: the pixel has only
// its mean). res: a soft mark, whole while the pixel is under half of it, its mean where the pixel is twice it;
// resc: a cell with a cut edge, whole under a quarter of it, its mean where the pixel is as large as the cell
float res(float S, float f){ return 1. - smoothstep(.5 * S, 2. * S, f); }
float resc(float S, float f){ return 1. - smoothstep(.25 * S, S, f); }
float uni(float a, float b){ return a + b - a * b; }           // two covers laid over one another
`;
// THE PLATES' JOINTS AS BUILT (the world's own sizes, metres): over every plate joint lies a BUTT STRAP, a cover
// strip PLATE.strap wide and PLATE.proud proud of the plates, its two long edges bevelled over PLATE.bevel, its
// face hung out of true by PLATE.tilt (radians) at the most; it is bolted through by two rows of DOMED HEADS,
// PLATE.head across and PLATE.dome high (a cap of a ball), PLATE.pitch apart along the strap, a row PLATE.row
// either side of the joint's line. Strap and heads carry the painting like the plates: only the light on them differs.
const PLATE = { strap: 0.24, proud: 0.025, bevel: 0.025, tilt: 0.03, head: 0.09, dome: 0.03, pitch: 0.25, row: 0.05 };
// what follows from those sizes: the bevel's slope; the ball a head is a cap of, its facing at the rim; and A HEAD'S
// OWN NET UNDER THE LAMP (net[k]: the square metres of full shade that a head and its cast shade are worth, seen
// square on, where the lamp's light leans off the wall's normal by a tangent of k; worked here by adding up the
// head's own law over a net of 48 by 32 places, no number typed in its place), and under the dome's fill (fill)
const PL = (() => { const Q = PLATE, hyp = Math.hypot(Q.proud, Q.bevel), r = Q.head / 2, Rs = (r * r + Q.dome * Q.dome) / (2 * Q.dome), cr = (Rs - Q.dome) / Rs;
  const net = (t) => { const x0 = -(r + Q.dome * t + 0.01), nx = 48, ny = 32, dx = (r - x0) / nx, dy = 2 * r / ny, il = 1 / Math.hypot(t, 1); let s = 0;
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = x0 + (i + 0.5) * dx, y = -r + (j + 0.5) * dy, d2 = x * x + y * y;
      if (d2 <= r * r) s += 1 - Math.max(Math.sqrt(1 - d2 / (Rs * Rs)) + x * t / Rs, 0);
      else { const b = (x * t + (Rs - Q.dome)) * il, disc = b * b - d2 - (Rs - Q.dome) * (Rs - Q.dome) + Rs * Rs; if (disc > 0 && b < 0) s += 1; } }
    return s * dx * dy; };
  const area = Math.PI * r * r, nz = 2 * Rs * Rs / (3 * r * r) * (1 - cr * cr * cr);
  return { half: Q.strap / 2, cb: Q.bevel / hyp, sb: Q.proud / hyp, r, Rs, cr, area, nz, net: [0, 1, 2, 3, 4].map(net), fill: area * (1 - nz) / 2 }; })();
const f6 = (v) => v.toFixed(6);
// THE WEAR, BY PLACE (true of a steel wall that stands in a salt sea; by the wall's own place only: nothing here
// reads the eye). On the WEATHER SIDE of the dome the paint has gone along the joints: a line of bare dark steel
// along both edges of every strap, heads here and there rust-dark with a stain of rust round each, and rust
// weeping down the plate under the level joints in soft streaks. Elsewhere the paint is whole and the wall is the
// relief above, nothing more.
// ONE LAW: wear = BY SIDE times BY HEIGHT, a number from 0 to 1 at each place of the wall. BY SIDE: whole within
// WEAR.full degrees of bearing either hand of the weather side's middle (WEAR.mid, a bearing of the dome), eased
// to nothing over a further WEAR.ease degrees: no edge. BY HEIGHT over the sea: whole from the water to WEAR.low
// metres up the wall (the splash and the spray), eased to WEAR.rest of itself by WEAR.high metres (the high sky
// keeps its paint). THE MARKS (metres; each times the wear, each ending in its own mean, none faded by metres):
// edge: the width of the line along each edge of a strap, edgeDark of the way to bare steel; taken: the share of
// the heads that rust has taken, dealt head by head by the plate's own hash; a taken head is headDark of the way
// to rust and headSteel of the way on to bare steel, in a stain twice its width, stainDark of the way to rust;
// weep: under a taken head of a level strap's lower row a streak weepWide across, its length dealt between the
// two by the plate's own hash, weepDark at its head and fading down its length; steel, rust: the colours of bare
// rusted steel and of rust on paint (a warm brown)
const WEAR = { mid: 62, full: 58, ease: 30, low: 35, high: 85, rest: 0.1,
  edge: 0.035, edgeDark: 0.8, taken: 0.5, headDark: 0.9, headSteel: 0.3, stainDark: 0.55, weep: [0.3, 1.4], weepWide: 0.07, weepDark: 0.45,
  steel: [0.03, 0.018, 0.014], rust: [0.12, 0.045, 0.02] };
// (the stains of a plate strap's two rows of heads: `near` the half width of the line that carries one row's
// share of their cover where a pixel holds the row, metres: two stains of radius R whose middles stand D apart
// hold in common 2 R R acos(D / 2R) - D / 2 sqrt(4 R R - D D))
const WEAR_STAIN = (() => { const R = PLATE.head, D = 2 * PLATE.row, t = WEAR.taken, A = Math.PI * R * R;
  const common = D < 2 * R ? 2 * R * R * Math.acos(D / (2 * R)) - D / 2 * Math.sqrt(4 * R * R - D * D) : 0;
  return { common, near: (2 * t * A - t * t * common) / (4 * PLATE.pitch) }; })();
// THE RELIEF AS THE LAMP SHOWS IT, as GLSL (the wall and the sea's image of it take it). Each function gives two
// numbers: what the lamp's part of the light gains or loses there against bare plate (x) and what the dome's
// fill does (y). A facet takes the lamp's light by its own facing against the plate's (the cosine law, as light
// does); the fill by how much of the dome it faces. t: the lamp's light across the strap, its tangent over its
// normal part (signed toward the lamp; taken to 4 at the most: past that the lamp's own part is all but off the
// wall). NOTHING HERE READS THE EYE; a mark under a pixel carries its true cover and ends in ITS OWN MEAN.
const GLSL_PLATE = /* glsl */`
const float SWH = ${fl(PL.half)}, SCB = ${fl(PLATE.bevel)}, SPR = ${fl(PLATE.proud)}, SCO = ${fl(PL.cb)}, SSI = ${fl(PL.sb)};
const float HDR = ${fl(PL.r)}, HDS = ${f6(PL.Rs)}, HDC = ${fl(PL.cr)}, HDD = ${fl(PLATE.dome)}, HDP = ${fl(PLATE.pitch)}, HDO = ${fl(PLATE.row)};
// a head's own net under the lamp, square metres of full shade (PL.net: worked at t = 0, 1, 2, 3, 4, straight between)
float headNet(float tt){ return ${f6(PL.net[0])}${PL.net.slice(1).map((v, k) => ` + ${f6(v - PL.net[k])} * clamp(tt - ${k}., 0., 1.)`).join('')}; }
// ONE STRAP ACROSS ITS WIDTH: x metres (signed) from the joint's line, tl its face's own tilt, f the pixel across
// it, P metres to the next strap. Toward the lamp its bevel faces the light (cos b + t sin b of the plate's light),
// away from it the other bevel loses it (cos b - t sin b, none below nothing) and casts A SHORT SHADE on the plate,
// proud t less the bevel wide; the face is a touch lighter or darker by its tilt (as often one as the other).
// ITS OWN MEAN, where a pixel is a period wide: each band's width over P times what it holds, the tilt's nothing
vec2 strapRel(float x, float t, float tl, float f, float P){
  float xs = t < 0. ? -x : x, ta = min(abs(t), 4.), s = max(SPR * ta - SCB, 0.), on = 1. - smoothstep(.5 * P, P, f);
  float nb = ln(abs(xs - (SWH - .5 * SCB)), .5 * SCB, f), fb = ln(abs(xs + (SWH - .5 * SCB)), .5 * SCB, f);
  float kn = SCO + ta * SSI - 1., kf = max(SCO - ta * SSI, 0.) - 1.;
  return vec2(mix((SCB * (kn + kf) - s) / P, nb * kn + fb * kf - ln(abs(xs + SWH + .5 * s), .5 * s, f) + ln(abs(x), SWH - SCB, f) * tl * t, on),
              -.5 * (1. - SCO) * mix(2. * SCB / P, nb + fb, on)); }
// ONE DOMED HEAD, q metres from its middle (across the strap, along it), T the lamp's light likewise, dr the way to
// the lamp: its lit side and its shaded side by the cap's own facing, and ITS SHORT CAST SHADE where the way to the
// lamp from the plate meets the ball. Under a pixel larger than itself: its true cover by area and its own net
vec2 headAt(vec2 q, vec2 T, vec3 dr, float f, float hr, float net){
  float d = length(q), cov = dotc(d, HDR, f), nz = sqrt(max(1. - d * d / (HDS * HDS), HDC * HDC));
  vec3 w = vec3(q, HDS - HDD); float b = dot(w, dr), disc = b * b - dot(w, w) + HDS * HDS;
  float sh = clamp(disc / (2. * HDS * f) + .5, 0., 1.) * step(b, 0.) * clamp((d - HDR) / f + .5, 0., 1.) * hr;
  return vec2(cov * mix(-net / ${f6(PL.area)}, max(nz + dot(q, T) / HDS, 0.) - 1., hr) - sh, -.5 * cov * mix(${fl(1 - PL.nz)}, 1. - nz, hr)); }
// THE TWO ROWS OF HEADS ON ONE STRAP: x across it (signed), y along it, ho a row's place off the line, T the lamp's
// light (across, along), f the pixel, P metres to the next strap. Where a pixel holds the heads of a row (from
// half the pitch to the pitch) the row is A LINE AS WIDE AS ITS HEADS' NET OVER THEIR SPACING, which itself ends
// in its own mean: two such rows over P
vec2 headsRel(float x, float y, float ho, vec2 T, float f, float P){
  float tt = min(length(T), 4.), yy = (fract(y / HDP) - .5) * HDP, hr = res(HDR, f), net = headNet(tt);
  vec3 dr = vec3(T, 1.) * inversesqrt(1. + dot(T, T));
  vec2 one = headAt(vec2(x - ho, yy), T, dr, f, hr, net) + headAt(vec2(x + ho, yy), T, dr, f, hr, net);
  float wk = net / (2. * HDP), wa = ${f6(PL.fill / (2 * PLATE.pitch))}, on = 1. - smoothstep(.5 * P, P, f);
  vec2 rows = -vec2(mix(4. * wk / P, ln(abs(x - ho), wk, f) + ln(abs(x + ho), wk, f), on), mix(4. * wa / P, ln(abs(x - ho), wa, f) + ln(abs(x + ho), wa, f), on));
  return mix(rows, one, 1. - smoothstep(.5 * HDP, HDP, f)); }
// THE WEAR AT A PLACE (WEAR's one law): bearing the place's own bearing on the dome (radians), arc its metres up
const float WEDGE = ${fl(WEAR.edge)}, WTAKE = ${fl(WEAR.taken)}, WSR = ${fl(2 * PL.r)}, WL0 = ${fl(WEAR.weep[0])}, WL1 = ${fl(WEAR.weep[1])}, WWEEP = ${fl(WEAR.weepWide)};
const vec3 WSTEEL = vec3(${WEAR.steel.map(fl).join(', ')}), WRUST = vec3(${WEAR.rust.map(fl).join(', ')});
float wearAt(float bearing, float arc){
  float d = abs(mod(bearing - ${fl(WEAR.mid * RAD)} + 3.14159265, 6.2831853) - 3.14159265);
  return (1. - smoothstep(${fl(WEAR.full * RAD)}, ${fl((WEAR.full + WEAR.ease) * RAD)}, d)) * mix(1., ${fl(WEAR.rest)}, smoothstep(${fl(WEAR.low)}, ${fl(WEAR.high)}, arc)); }
// THE TWO EDGES OF ONE STRAP (x across it, f the pixel, P to the next strap): the line of bare steel WEDGE wide
// along each edge, by its true cover. ITS OWN MEAN over a period: 2 WEDGE / P
float edgeWear(float x, float f, float P){
  return mix(2. * WEDGE / P, ln(abs(x - SWH), .5 * WEDGE, f) + ln(abs(x + SWH), .5 * WEDGE, f), 1. - smoothstep(.5 * P, P, f)); }
// THE HEADS OF ONE STRAP THAT RUST HAS TAKEN (x across the strap, y along it, ho its rows' offset, f the pixel, P
// to the next strap, id the strap's own number): WTAKE of the heads, dealt head by head by the plate's own hash
// (the kit's h21). x: a taken head's own disc; y: its stain, a disc twice as wide (two stains that meet across a
// strap lie over one another). Each by its true cover by area; where a pixel holds the heads of a row, lines as
// wide as the taken discs' areas over their spacing. THEIR OWN MEANS over a period: the heads' WTAKE 2 pi r r /
// (pitch P); the stains' four times that, less (where the two rows stand nearer than a stain's width) the share
// two taken stains hold in common: WTAKE WTAKE times their common area / (pitch P)
vec2 headsWear(float x, float y, float ho, float f, float P, float id){
  float c = floor(y / HDP), yy = (fract(y / HDP) - .5) * HDP, wk = ${f6(WEAR.taken * Math.PI * PL.r * PL.r / (2 * PLATE.pitch))};
  float ws = ho < WSR ? ${f6(WEAR_STAIN.near)} : 4. * wk;
  float ta = step(h21(vec2(c + 3., id * 2. + 17.)), WTAKE), tb = step(h21(vec2(c + 3., id * 2. + 18.)), WTAKE);
  float da = length(vec2(x - ho, yy)), db = length(vec2(x + ho, yy));
  vec2 one = vec2(dotc(da, HDR, f) * ta + dotc(db, HDR, f) * tb, max(dotc(da, WSR, f) * ta, dotc(db, WSR, f) * tb));
  vec2 lines = vec2(ln(abs(x - ho), wk, f) + ln(abs(x + ho), wk, f), ln(abs(x - ho), ws, f) + ln(abs(x + ho), ws, f));
  vec2 rows = mix(vec2(4. * wk, 4. * ws) / P, lines, 1. - smoothstep(.5 * P, P, f));
  return mix(rows, one, 1. - smoothstep(.5 * HDP, HDP, f)); }
// (a strap's taken heads h.x and their stains h.y as wear both ways: a stain stainDark of the way to rust, a head
// headDark of the way where it stands in its stain, and headSteel of the way on to bare steel)
vec2 headTone(vec2 h){ return vec2(h.x * ${fl(WEAR.headSteel)}, h.y * ${fl(WEAR.stainDark)} + h.x * ${fl(WEAR.headDark - WEAR.stainDark)}); }
// THE WEEPS UNDER ONE LEVEL STRAP: x metres along the joint, y metres above its line, row the joint's own number,
// fu and fv the pixel along and up, P to the next level joint. Under each taken head of the strap's lower row a
// streak WWEEP wide hangs from the strap's lower edge line, its length dealt by the plate's own hash between WL0
// and WL1, whole at its head and fading to nothing at its foot. Where a pixel holds the columns: the taken columns'
// cover (WTAKE WWEEP over the pitch) times what is left of a streak at that depth by the lengths' own law. Where a
// pixel is deeper than the streaks: a band of their own weight, one mean length deep, which ends in ITS OWN MEAN
// over a period: WTAKE WWEEP / pitch * (WL0 + WL1) / 4 / P
float weepWear(float x, float y, float row, float fu, float fv, float P){
  float c = floor(x / HDP), wx = (fract(x / HDP) - .5) * HDP, tk = step(h21(vec2(c + 3., row * 2. + 18.)), WTAKE);
  float wl = mix(WL0, WL1, h21(vec2(c + 5., row * 2. + 31.))), wy = -(y + SWH + .5 * WEDGE);
  float top = clamp(wy / fv + .5, 0., 1.), m = clamp(wy, WL0, WL1);
  float left = clamp(((WL1 - m) - max(wy, 0.) * log(WL1 / m)) / (WL1 - WL0), 0., 1.);
  float along = mix(WTAKE * WWEEP / HDP * left, tk * ln(abs(wx), .5 * WWEEP, fu) * clamp(1. - wy / wl, 0., 1.), 1. - smoothstep(.5 * HDP, HDP, fu)) * top;
  float band = lnP(abs(wy - ${fl((WEAR.weep[0] + WEAR.weep[1]) / 4)}), ${fl((WEAR.weep[0] + WEAR.weep[1]) / 4)}, P, fv) * (WTAKE * WWEEP / HDP) * .5;
  return mix(band, along, res(WL0, fv)); }
// THE WEAR OF ONE PLACE, both ways (x: the way to bare steel, y: the way to rust), from the upright strap's marks
// (xu across it, yu along it, fu, Pu, idu its own number) and the level strap's (xv, yv, fv, Pv, row its own
// number, and its weeps); mu, mv: how much of each shows there (1 where nothing lies over it); fh the pixel for
// the heads. Where the two straps cross, the two covers lie over one another
vec2 wearMarks(float xu, float yu, float fu, float Pu, float mu, float idu, float xv, float yv, float fv, float Pv, float mv, float row, float fh){
  vec2 wu = (vec2(edgeWear(xu, fu, Pu) * ${fl(WEAR.edgeDark)}, 0.) + headTone(headsWear(xu, yu, HDO, fh, Pu, idu))) * mu;
  vec2 wv = (vec2(edgeWear(xv, fv, Pv) * ${fl(WEAR.edgeDark)}, weepWear(yv, xv, row, fu, fv, Pv) * ${fl(WEAR.weepDark)}) + headTone(headsWear(xv, yv, HDO, fh, Pv, row))) * mv;
  return wu + wv - wu * wv; }
`;
const WALL_VERT = /* glsl */`
attribute float aSide; uniform float uGapHalf; varying vec3 vWorld, vHome; varying float vSide;   // aSide: 0 the fixed shell, -1 and +1 the left and the right rolled panel
#include <fog_pars_vertex>
void main(){
  // (a rolled panel has come from its home by the gap's half width, its own way; the left one SEAM.off further)
  vHome = position; vSide = aSide; float roll = abs(aSide) > .5 ? (aSide * uGapHalf - ${fl(SEAM.off)}) / ${fl(SHELL.R)} : 0., c = cos(roll), s = sin(roll);
  vec3 p = vec3(c * position.x - s * position.z, position.y, s * position.x + c * position.z);      // a rolled panel: about the dome's own axis
  vec4 wp = modelMatrix * vec4(p, 1.); vWorld = wp.xyz;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const WALL_FRAG = /* glsl */`
varying vec3 vWorld, vHome;
uniform float uTime, uKey, uFill, uGapAz, uGapHalf, uRare; uniform vec3 uLampCol, uFillCol, uBeamAim, uSpill; varying float vSide;
uniform vec4 uBoardA[${NBOARD}], uBoardB[${NBOARD}];
const float RS = ${fl(SHELL.R)}, GORE = ${fl(SHELL.gore)}, JOINT = ${fl(SHELL.joint)};
${GLSL_NOISE}
${GLSL_SEAM}
${GLSL_PAINT}
${GLSL_SHADOW}
#include <fog_pars_fragment>
${GLSL_FILTER}
${GLSL_PLATE}
// the shade of the flat boards that hang before the wall (their places are the world's: uBoardA, uBoardB)
float boardShade(vec3 P, vec3 D){ float sh = 0.;
  for (int i = 0; i < ${NBOARD}; i++){ vec4 A = uBoardA[i], B = uBoardB[i]; if (B.w < .5) continue;
    vec3 n = vec3(sin(B.x), 0., -cos(B.x)); float dn = dot(D, n); dn = abs(dn) < 1e-3 ? 1e-3 : dn;
    float t = dot(A.xyz - P, n) / dn; if (t < 0.) continue;
    vec3 q = P + D * t - A.xyz; vec2 uv = vec2(dot(q, vec3(-n.z, 0., n.x)) / A.w, q.y / B.y);
    float r = length(uv * vec2(1., 1.15)) + .16 * sin(uv.x * 7. + B.z * 40.) * (.5 + .5 * uv.y);
    sh = max(sh, 1. - smoothstep(.82, 1.02, r)); }
  return sh; }
void main(){
  float fw = max(length(fwidth(vHome)), 1e-3), vEdge = step(.5, abs(vSide));   // metres of wall under one pixel; on a rolled panel or on the shell
  vec3 hd = normalize(vHome);
  // the pixel's footprint ALONG the wall (fu) and UP it (fv), each on its own: looked along, the wall's level lines
  // stay as crisp as their own direction allows, and only the uprights (edge on) thin away
  vec3 taz = normalize(vec3(-hd.z, 0., hd.x) + 1e-5), tup = normalize(vec3(-hd.x * hd.y, max(1. - hd.y * hd.y, 1e-4), -hd.z * hd.y));
  vec3 dxh = dFdx(vHome), dyh = dFdy(vHome);
  float fu = max(abs(dot(dxh, taz)) + abs(dot(dyh, taz)), 1e-3), fv = max(abs(dot(dxh, tup)) + abs(dot(dyh, tup)), 1e-3);
  float e = asin(clamp(hd.y, -1., 1.)), az = atan(hd.x, -hd.z + 1e-6) - uGapAz;
  az = mod(az + 3.14159265, 6.2831853) - 3.14159265;
  float arc = e * RS, rw = max(RS * cos(e), 1.), W = GORE * rw;
  float g = az / GORE, gi = floor(g), gf = fract(g) - .5, ja = arc / JOINT, ji = floor(ja);
  float sd = (gf - .5 * sign(gf)) * W, ds = abs(sd), dj = min(fract(ja), 1. - fract(ja)) * JOINT, db = (ji + 1.) * JOINT - arc;
  float pid = h21(vec2(gi + 40., ji + 3.));
  // each panel was painted flat and then hung: its painting sits a hand out of true with its neighbours'
  float slip = (pid - .5) * .0012;
  // (NO AIR OF ITS OWN: nothing here reads the metres from the eye. What takes the wall's marks away across the bay
  // is that a pixel there is larger than they are: each is filtered by the pixel's footprint ON THE WALL to ITS OWN
  // MEAN, by a ramp chosen from the mark's own size; the scene's fog is the air, and the only air)
  float su = az * rw;                                          // metres along the wall
  // BY THE OPENING THE WALL IS PLAINLY A WALL from across the bay too (BY PLACE): within some three panels of it
  // the uprights' cover straps are heavier (nearGap), and some five panels each way the level BELTS at the cross
  // joints stand deep as ring beams, with the two rails (girdP); wide marks, which a pixel across the bay holds
  float gor = abs(az) / GORE;
  float nearGap = (1. - smoothstep(2.2, 4.2, gor)) * (1. - smoothstep(120., 190., arc)), girdP = (1. - smoothstep(4., 6.5, gor)) * (1. - smoothstep(130., 200., arc));
  // THE PAINTING'S CUT EDGES AND FLAT TONES ARE LAID IN STROKES (below: a stroke some 0.3 m across), and stand
  // where a pixel holds a stroke; where it cannot, the pixel has their mean, which is the soft painting (gHard).
  // (SEEN ALONG ITS FACE the pixel's footprint is long one way: fl is its longest reach on the wall)
  float fl = max(fw, max(fu, fv));
  gHard = res(.32, fl);
  // THE BRUSH: strokes a forearm wide and a stride long laid slanting (1.2 by 0.32 m), smaller dabs among them
  // (0.45 by 0.14 m). THE PAINTING TAKES THEM AS ITS GRAIN: they break the clouds' edges and tones into strokes,
  // so that near the wall the sky is plainly PAINT at its full strength, cloud and blue, not a pale blank. Each
  // size is filtered along the wall and up it by its own length and width; as often light as dark: its mean is nothing
  float bc = .5 + (vn(vec2(su / 1.2 + arc + pid * 30., arc / .32 - su * .24)) - .5) * .6 * res(1.2, fu) * res(.32, fv)
                + (vn(vec2(su / .45 + 7., arc / .14 + pid * 11.)) - .5) * .4 * res(.45, fu) * res(.14, fv);
  // (a stroke is a dab with an edge: the same grain cut at its middle, the cut as wide as the pixel's reach across a stroke)
  float bwd = clamp(fl / .3, .03, .5), bs = smoothstep(.5 - bwd, .5 + bwd, bc);
  vec3 nrm = -normalize(vWorld), Lv = uLamp - vWorld; float Ld = max(length(Lv), 1.); vec3 Ln = Lv / Ld;
  float sl = dot(Ln, taz) >= 0. ? 1. : -1.;
  // the small billows, some 5 m across: modelled as the painter models them, light on the lamp's side and above
  // (a soft mark as often light as dark: filtered by its own 5.6 m to nothing)
  vec2 pq5 = vec2(su / 7.5, arc / 5.6); float puff = (vn(pq5) - vn(pq5 + vec2(sl * .42, .46))) * res(5.6, fl);
  vec4 pc = paintSky(az + slip * .6, max(e + slip, 0.), (bs - .5) * .3, puff * .55 + (bs - .5) * .7);
  vec3 col = pc.rgb * (1. + (pid - .5) * .016);               // (each panel a breath its own way: a panel is 30 m and more, held by every pixel in the dome)
  // THE PLATES: every panel is of bolted plates, eight across and eight between cross joints, each course set half a
  // plate along. pu, pj: the plate's place; sv, sh: metres (signed) from its nearest upright and level joint
  float PW = W / 8., PH = JOINT / 8., pj = ja * 8., pu = g * 8. + .5 * mod(floor(pj), 2.);
  float sv = (fract(pu + .5) - .5) * PW, sh = (fract(pj + .5) - .5) * PH, plate = h21(vec2(floor(pu) + 11., floor(pj) + 5.));
  // (a plate's own tone and tilt: cells with cut edges, as often light as dark; their mean is nothing)
  float plF = resc(PH, max(fu, fv));
  col *= 1. + (plate - .5) * .03 * plF;                        // each plate takes the paint a shade its own way
  // THE PLATES' RELIEF: each plate was hung a little out of true (a tilt of its own, half a degree at the most), so
  // the lamp's raking light takes each plate a shade its own way: a soft step of light at every joint, plainest where
  // the light rakes
  vec2 tiltP = (vec2(plate, h21(vec2(floor(pu) + 3., floor(pj) + 29.))) - .5) * .0175;
  col *= 1. - clamp(tiltP.x * dot(Ln, taz) + tiltP.y * dot(Ln, tup), -.0125, .0125) * 2.4 * plF;
  // the strokes' own tone on the clouds; on the blue long level sweeps (7 by 0.4 m), and THE ROLLER'S LAPS: bands
  // 0.45 m tall (a roller's width), each a shade its own way, a darker line 1.6 cm wide where one lap overlies the
  // next, the laps' edges wandering a little. (the sweeps and the laps' tones: as often light as dark, mean nothing;
  // a lap's cut edge is laid over the pixel that straddles it; the lap line ends in its own mean, 2 w over the lap)
  float bl = .5 + (vn(vec2(su / 7. + pid * 9., arc / .4 + gi * 3.)) - .5) * res(7., fu) * res(.4, fv);
  float lapI = arc / .45 + pid * 7. + (vn(vec2(su / 2.6 + pid * 5., floor(arc / .45) * 3.1)) - .5) * .3, lapF = fract(lapI), lapE = min(lapF, 1. - lapF) * .45;
  float lapT = mix(h11(floor(lapI) + gi * 13.7), h11(floor(lapI) + (lapF > .5 ? 1. : -1.) + gi * 13.7), clamp(.5 - lapE / fv, 0., .5)) - .5;
  float lapTone = lapT * .08 * resc(.45, fv) - .17 * lnP(lapE, .008, .45, fv);
  col *= 1. + (bs - .5) * .4 * pc.a + ((bl - .5) * .07 + lapTone) * (1. - pc.a);
  // (the bristles' own hairlines inside every stroke, a finger tall and a metre or two long, along the stroke:
  // filtered up the wall by their 5.5 cm and along it by their 1.6 m; as often light as dark, mean nothing)
  float hair = vn(vec2(su / 1.6 + pid * 17., (arc - su * .076) / .055));
  col *= 1. + (smoothstep(.3, .7, hair) - .5) * .13 * res(.055, fv) * res(1.6, fu);
  // PAINT RUNS: under every level joint thin drips of the paint itself (2.4 cm wide, one column of 21 cm in 0.45
  // carries one), each its own length (0.25 to 1.95 m), a bead at its end
  float dcol = su / .21 + floor(pj) * 5.3, dh = h11(floor(dcol) * 1.7 + floor(pj) * 9.1), dlen = .25 + 1.7 * dh * dh, dx = (fract(dcol) - .5) * .21;
  float dbelow = (1. - fract(pj)) * PH, dend = .5 * fv + .015;
  float drip = step(.55, h11(floor(dcol) * 3.3 + 1.)) * ln(abs(dx), .012 + .01 * smoothstep(dlen - .14, dlen, dbelow), fu) * (1. - smoothstep(dlen - dend, dlen + dend, dbelow));
  // (ITS MEAN ALONG THE WALL at a place under the joint, once a pixel is a column wide: the share of columns that
  // run, 0.45, times a run's width over the column's, 2 w / 0.21, summed over the runs that reach so far down: THE
  // PLAIN HALF WIDTH, 0.012, times their share (1 less the root of the depth past 0.25 m over 1.7: rn0), AND THE
  // BEAD, 0.01 more eased in over a run's last 0.14 m, by the runs whose bead stands at that depth. Taken by the
  // root of a run's own length past 0.25 m over 1.7, which is its die, evenly dealt, the bead's easing is a plain
  // polynomial of the sixth power between the roots rn0 and rn1: summed whole by Gauss's rule at four places.
  // The bead adds 7 to 17 in a hundred to the plain width's part from 0.3 to 1.6 m under the joint, and more than
  // half of it where the longest runs end)
  float rnq = (dbelow - .25) / 1.7, rn0 = sqrt(clamp(rnq, 0., 1.)), rn1 = sqrt(clamp(rnq + ${f6(0.14 / 1.7)}, 0., 1.));
  vec4 rng = .5 * (rn0 + rn1) + .5 * (rn1 - rn0) * vec4(${GAUSS4.x.map(f6).join(', ')}), rnu = clamp((rnq + ${f6(0.14 / 1.7)} - rng * rng) / ${f6(0.14 / 1.7)}, 0., 1.);
  float rnBead = .5 * (rn1 - rn0) * dot(vec4(${GAUSS4.w.map(f6).join(', ')}), rnu * rnu * (3. - 2. * rnu));
  drip = mix(${fl(0.45 * 2 / 0.21)} * (.012 * (1. - rn0) + .01 * rnBead), drip, 1. - smoothstep(.105, .21, fu));
  // (AND OVER A WHOLE PLATE, once a pixel is a plate tall: that share times the runs' mean length, 0.25 + 1.7 / 3 m,
  // with the bead's widening over its last 7 cm, over the plate's height)
  drip = mix(${fl(0.45 * (2 * 0.012 * (0.25 + 1.7 / 3) + 2 * 0.01 * 0.07) / 0.21)} / PH, drip, 1. - smoothstep(.5 * PH, PH, fv));
  col = mix(col, col * vec3(.64, .72, .86), drip * .9);
  // REPAINTED PATCHES: one plate in five carries a patch of fresher sky a shade off (half of them lighter, half
  // darker by the same shade: their mean is nothing), rolled on in lanes 0.25 m wide, its edge a plain line 1.6 cm
  // wide; a patch is 1.2 m and more across
  vec2 pq = vec2(fract(pu), fract(pj)); float ph = h21(vec2(floor(pu) + 3., floor(pj) + 17.)), patF = res(1.2, fl);
  vec2 p0 = vec2(.1 + .3 * h11(ph * 7.1), .12 + .3 * h11(ph * 3.3)), p1 = p0 + vec2(.3 + .28 * h11(ph * 5.7), .3 + .26 * h11(ph * 9.9));
  float pe = min(min(pq.x - p0.x, p1.x - pq.x) * PW, min(pq.y - p0.y, p1.y - pq.y) * PH), mend = step(ph, .2) * clamp(pe / max(fw, .02) + .5, 0., 1.) * patF;
  float lane = step(.5, fract(su / .5 + ph * 3.));
  col = mix(col, col * (1. + (ph < .1 ? 1. : -1.) * vec3(.025, .03, .04)) * (1. + (lane - .5) * .012 * resc(.25, fu)), mend);
  // (the edge line's own mean: one plate in five, the patch's mean girth, 2 (0.44 PW + 0.43 PH), times the line's
  // width, over the plate's area)
  col *= 1. - .2 * mix(.2 * 2. * (.44 * PW + .43 * PH) * .016 / (PW * PH), step(ph, .2) * ln(abs(pe - .012), .008, fw), patF);
  // THE RARE PLATE (when dealt: uRare): one plate on the long wall, three courses up, was hung in its red-lead primer
  // and never painted; it stands there at every metre (under a pixel larger than itself it keeps its true cover)
  float rex = (.5 - abs(fract(pu) - .5)) * PW, rey = (.5 - abs(fract(pj) - .5)) * PH;
  float rareP = uRare * step(abs(floor(pu) + 77.), .5) * step(abs(floor(pj) - 2.), .5) * clamp(min(rex / fu, rey / fv) + .5, 0., 1.) * min(1., PW / fu) * min(1., PH / fv);
  col = mix(col, vec3(.5, .15, .07) * (.8 + .4 * bc + .25 * (bl - .5)), rareP * .94);
  // RUST AND WEATHER: here and there a streak runs down from a level joint (1.2 m: it thins by that length), longer
  // and browner under the cross joints (2.5 m). EACH PART ENDS IN ITS OWN MEAN: which columns run (0.34 m and
  // 0.55 m wide, a cut of the noise, where a pixel is a column wide); the fine grain in them in
  // its middle; the run down the wall in its mean over the joint's period, L / P (1 - exp(-P / L)).
  // THE COLUMNS' MEAN IS THE COURSE'S OWN: a course holds the noise's second place, so its columns are ONE LINE of
  // the noise, and their mean is that line's, by its share between two rows of the noise's dice (rowP, rowJ: in
  // tenths from the nearer row, 0 to 5, as the courses' numbers fall; vnMeanRow, the noise's own law along a
  // line). By the share the plates' streaks stand in ${STREAK_ROWS.map((v) => v.toFixed(3)).join(', ')} of their columns (the
  // whole wall's mean ${vnMean(0.7, 0.95).toFixed(3)}), the cross joints' in ${JOINT_ROWS.map((v) => v.toFixed(3)).join(', ')} (${vnMean(0.62, 0.9).toFixed(3)})
  float below = (1. - fract(pj)) * PH;                         // metres under the level joint above
  float rowP = abs(fract(floor(pj) * 7.3 + 2.5) - .5) * 10., rowJ = abs(fract(ji * 7.3 + 2.5) - .5) * 10.;
  float streak = mix(${vnRowGLSL(STREAK_ROWS, 'rowP')}, smoothstep(.7, .95, vn(vec2(su / .34, floor(pj) * 7.3 + 2.))), resc(.34, fu))
    * mix(1.2 / PH * (1. - exp(-PH / 1.2)), exp(-below / 1.2), res(PH, fv)) * (.75 + .5 * (vn(vec2(su / .12, arc / 2.)) - .5) * res(.12, fu) * res(2., fv));
  float st = mix(${vnRowGLSL(JOINT_ROWS, 'rowJ')}, smoothstep(.62, .9, vn(vec2(su / .55, ji * 7.3 + 2.))), resc(.55, fu))
    * mix(${fl(2.5 / SHELL.joint * (1 - Math.exp(-SHELL.joint / 2.5)))}, exp(-db / 2.5), res(JOINT, fv)) * (.775 + .45 * (vn(vec2(su / .16, arc / 3.)) - .5) * res(.16, fu) * res(3., fv));
  col = mix(col, col * vec3(.66, .47, .33), min(streak * .6 + st * .5, .85));
  // (the salt bloom low on the wall, patches 2.3 by 1.4 m: its mean the mean of its cut of the noise)
  float salt = (1. - smoothstep(1.6, 7.5, arc)) * mix(${fl(vnMean(0.3, 0.8))}, smoothstep(.3, .8, vn(vec2(su / 2.3 + 5., arc / 1.4))), res(2.3, fu) * res(1.4, fv));
  col = mix(col, col * .9 + vec3(.09), salt * .3);
  // THE TIDE STAIN to 2 m: wet and dark at the water, thinning upward in runs (never a clean edge); the salt line.
  // (the foot's bands stand at every distance: each band's edge is spread over the pixel's reach up the wall, hv
  // either way, and so keeps its own cover; the salt line keeps the cover it truly has)
  float rag = mix(.5, vn(vec2(su / .33, 3.)), 1. - smoothstep(.08, .3, fw)) * .6 + mix(.5, vn(vec2(su / .09, 9.)), 1. - smoothstep(.02, .08, fw)) * .4, top = 1.25 + rag * 1.1;
  float hv = .5 * fv, tide = (1. - smoothstep(top - .9 - hv, top + hv, arc)) * mix(1., .55, smoothstep(.2, top, arc));
  col = mix(col, col * vec3(.5, .55, .47) + vec3(.01, .016, .012), tide * .62);
  col = mix(col, vec3(.8, .81, .78), ln(abs(arc - top + .05), .04, fv) * .45);
  col = mix(col, uSeaLine, (1. - smoothstep(.25 - hv, .55 + hv, arc)) * .85);          // the painted far sea-line, at the water
  float lap = .34 + .16 * sin(uTime * 1.1 + su * .21) + .09 * sin(uTime * 1.9 - su * .57);
  col *= mix(1., .74, 1. - smoothstep(lap - hv, lap + .1 + hv, arc));
  // THE JOINTS. Between plates: A BUTT STRAP over every joint and its two rows of domed heads (PLATE; drawn below
  // at THE RELIEF, by the lamp's own light: no dark line is drawn for a joint). Between panels and at the cross
  // joints: a cover strap of the same width, a shade darker than the paint, a lip of light and its far edge in
  // shade, the same two rows of heads inside its edges.
  // (EACH LINE IS FILTERED BY THE FOOTPRINT ACROSS IT, an upright by fu, a level one by fv; it carries its true
  // cover, and ends in its own mean over its period: 2 w over the panel's width or the joint's)
  // (by the opening the straps and belts are wider and darker, their lips and shades with them: BY PLACE)
  float sw = SWH + ${fl(0.6 - PL.half)} * nearGap, swv = SWH + ${fl(0.9 - PL.half)} * girdP;
  float jl = arc - ji * JOINT - JOINT * step(.5, fract(ja));   // metres (signed) from the nearest cross joint
  float strap = uni(lnP(ds, sw, W, fu), lnP(dj, swv, JOINT, fv));
  col = mix(col, col * mix(vec3(.93, .94, .96), vec3(.4, .44, .52), max(nearGap, girdP)), strap);
  float lpU = .01 + .03 * nearGap, lpV = .012 + .04 * girdP, shU = .015 + .045 * nearGap, shV = .018 + .2 * girdP;
  col *= 1. + .34 * uni(lnP(abs(sd * sl - sw + lpU), lpU, W, fu), min(lnP(abs(jl - swv + lpV), lpV, JOINT, fv) * (.6 + .6 * girdP), 1.));
  col *= 1. - .56 * uni(lnP(abs(sd * sl + sw + shU), shU, W, fu), lnP(abs(jl + swv + shV), shV, JOINT, fv));
  // THE TWO RAILS THE PANELS RIDE, PLAIN ON THE WALL either hand of the opening (BY PLACE: some five panels each
  // way, never on a rolled panel): a girder 2.2 m deep along the door-top line and a kerb rail at the water, each
  // dark steel with a bright upper flange and its shade under it; they run along the wall into the opening, where
  // the true rails carry on behind the panels. Wide marks: a pixel across the bay holds them (a wall's own lines);
  // each keeps its true cover. (they stand among the level belts, so that no line hangs alone across the painted sky)
  float railN = girdP * (1. - vEdge);
  float hiR = ln(abs(arc - ${fl(SHELL.doorTop)}), 1.1, fv), loR = ln(abs(arc - 1.3), .62, fv);
  col = mix(col, vec3(.07, .08, .1), max(hiR, loR) * railN);
  col = mix(col, vec3(.52, .54, .58), max(ln(abs(arc - ${fl(SHELL.doorTop + 0.96)}), .14, fv), ln(abs(arc - 1.84), .09, fv)) * railN * .85);
  col *= 1. - .42 * railN * max(ln(abs(arc - ${fl(SHELL.doorTop - 1.55)}), .42, fv), 0.);
  // THE RELIEF (GLSL_PLATE): the plates' butt straps and all the heads, as the lamp shows them at this place. T: the
  // lamp's light along the wall and up it, its tangent over its normal part (taken to 4 at the most). Each upright
  // strap's face hangs out of true its own way (tlt). Under a panel's cover strap or a belt the plates' own straps
  // do not show (pmU, pmV: the share of the pixel beside those, by their true cover); the cover straps and belts
  // carry their own two rows of heads, 7 cm inside their edges. rel.x goes to the lamp's part of the light below,
  // rel.y to the fill's: where a shade lies (our sail's, a board's) the lamp's part of the relief goes with it
  vec2 T = vec2(dot(Ln, taz), dot(Ln, tup)) / max(dot(Ln, nrm), .08); T *= min(1., 4. / max(length(T), 1e-3));
  float bq = max(fu, fv), tlt = (h21(vec2(floor(pu + .5) + 5., floor(pj) + 41.)) - .5) * ${fl(2 * PLATE.tilt)};
  float pmU = 1. - lnP(ds, sw + SWH, W, fu), pmV = 1. - lnP(dj, swv + SWH, JOINT, fv);
  vec2 rel = (strapRel(sv, T.x, tlt, fu, PW) + headsRel(sv, arc, HDO, T, bq, PW)) * pmU + (strapRel(sh, T.y, 0., fv, PH) + headsRel(sh, su, HDO, T.yx, bq, PH)) * pmV
           + headsRel(sd, arc, sw - ${fl(PL.half - PLATE.row)}, T, bq, W) + headsRel(jl, su, swv - ${fl(PL.half - PLATE.row)}, T.yx, bq, JOINT);
  // THE WEAR (WEAR, GLSL_PLATE): by this place's own bearing and height, nothing else. The plates' straps wear at
  // their edges, heads and weeps; the cover straps' and belts' heads wear likewise. Bare steel over rust over paint
  vec2 wm = wearMarks(sv, arc, fu, PW, pmU, floor(pu + .5), sh, su, fv, PH, pmV, floor(pj + .5), bq)
          + headTone(headsWear(sd, arc, sw - ${fl(PL.half - PLATE.row)}, bq, W, 3.) + headsWear(jl, su, swv - ${fl(PL.half - PLATE.row)}, bq, JOINT, 5.));
  wm = min(wm * wearAt(az + uGapAz, arc), 1.);
  col = mix(mix(col, WRUST, wm.y), WSTEEL, wm.x);
  // light: the dome's own fill, and the lamp-sun's key in a wide soft pool; the boat's and the boards' shade
  vec3 axis = normalize(uBeamAim - uLamp); float ca = dot(-Ln, axis), ndl = clamp(dot(nrm, Ln), 0., 1.);
  float key = uKey * mix(.74, 1., smoothstep(.8, .995, ca)) * smoothstep(0., .22, ndl);
  key *= (1. - boatShadeOn(vWorld, nrm, fw)) * (1. - .8 * boardShade(vWorld, Ln));
  vec3 lit = uFillCol * uFill * (1. + rel.y) + uLampCol * key * max(1. + rel.x, 0.) + uLampCol * .5 * exp(-Ld / 40.);
  // ROUND THE SEAM (by place; vEdge is 1 on the two rolled panels, 0 on the shell; vSide: -1 the left panel, +1 the
  // right). latW: metres along the wall from the gap's meridian to this place as it stands now. THE PANELS STAND
  // PROUD of the face: on the shell beside each panel's outer edge lies the shade it casts, wide on the side away
  // from the lamp, a narrow one on the lamp's side (outL, outR: metres out beyond those edges where they stand now).
  // THE BACKSTAGE'S GOLD spills out through the seam: on the panels' faces by their edges, and (off the water) on
  // the wall either side, fading with the metres from the seam's edge and up the wall; steady, at every metre.
  float azW = mod(atan(vWorld.x, -vWorld.z + 1e-6) - uGapAz + 3.14159265, 6.2831853) - 3.14159265, latW = abs(azW) * rw;
  float outL = (-azW - GORE - (uGapHalf + ${fl(SEAM.off)}) / RS) * rw, outR = (azW - GORE - (uGapHalf - ${fl(SEAM.off)}) / RS) * rw;
  float castP = max(.58 * (1. - smoothstep(0., 4.5, max(outL, 0.))) * step(azW, 0.), .34 * (1. - smoothstep(0., 1.8, max(outR, 0.))) * step(0., azW));
  lit *= 1. - castP * (1. - vEdge) * (1. - smoothstep(${fl(SEAM.top)}, ${fl(SEAM.top + 6)}, arc));
  float seamHW = max(uGapHalf * cos(e) - seamRake(azW, arc), 0.);
  // (the gold HUGS THE SEAM'S EDGES: strong within some ten metres of them, a faint breath of it to some forty; beyond,
  // the painted dusk stands dark)
  float spD = max(latW - seamHW, 0.), spill = (.8 * exp(-spD / 9.) + .2 * exp(-spD / 40.)) * exp(-max(arc, 0.) / 220.) * (1. - smoothstep(4. * W, 6. * W, latW));
  lit += uSpill * spill * mix(.5, .8, vEdge);
  // the cut edges of a rolled panel (its outer edge, and its meeting edge: plumb, then raking): bare steel
  float dOuter = (GORE - vSide * az) * rw, dInner = vSide * (az - ${fl(SEAM.off)} / RS) * rw + seamRake(vSide, arc);
  float cut = vEdge * (1. - smoothstep(.3, .55, min(dOuter, dInner)));
  col = mix(col, vec3(.3, .32, .36), cut);
  col *= lit;
  col += uSpill * spill * (.05 + .05 * vEdge);                  // (and the gold stands as a faint glow in the air before the wall there)
  // the paint's sheen: every panel is a flat plate hung a little out of true, and looked along it mirrors the pale
  // far side of the dome plate by plate (a sheen: it reads the eye, as a reflection must)
  vec3 nf = normalize(nrm + taz * (gf * GORE * cos(e) + (pid - .5) * .035) + tup * ((fract(ja) - .5) * JOINT / RS + (h11(pid * 91.) - .5) * .03));
  float cv = clamp(dot(nf, normalize(cameraPosition - vWorld)), 0., 1.), fr = pow(max(1. - cv, 1e-4), 5.);
  col = mix(col, uFillCol * (uFill + .5 * uKey), .3 * fr);
  gl_FragColor = vec4(col, 1.);
  #include <fog_fragment>
}`;
// the looks' paints (linear colours come from THREE.Color): AFTERNOON, LOW SUN
export const PAINTS = [
  // (AFTERNOON: cream-gold on the clouds' lit sides and a warm glow on the lamp's side of the dome, against the blue)
  { zen: '#2460b4', mid: '#69a4dd', haze: '#dfe2d6', cloudLit: '#ffe8b8', cloudShade: '#8fa3c8', seaLine: '#5c86a6', fill: '#dfeaff', glow: '#5a4420', blush: 0 },
  { zen: '#2c4d94', mid: '#8a9cc6', haze: '#f1cfae', cloudLit: '#ffe4bd', cloudShade: '#8d86aa', seaLine: '#566a8c', fill: '#d6d4f0', glow: '#70401a', blush: 1 },
];
const ROWS_LOW = [-5, 0, 10, 20, 30, 45, 60, 75, 90];
// a patch of the sphere: bearings b0..b1 (degrees) in nb columns, the arcs of rows (metres up the wall), at radius R + back.
// skip(bMid, a0, a1) leaves a quad out (the opening the two panels closed).
function patchGeometry(b0, b1, nb, rows, back, skip, pole) {
  const pos = [], idx = [], v = new THREE.Vector3(), nr = rows.length;
  for (let j = 0; j <= nb; j++) for (let i = 0; i < nr; i++) { wallPoint(lerp(b0, b1, j / nb), rows[i], -back, v); pos.push(v.x, v.y, v.z); }
  for (let j = 0; j < nb; j++) for (let i = 0; i < nr - 1; i++) {
    if (skip && skip(lerp(b0, b1, (j + 0.5) / nb), rows[i], rows[i + 1])) continue;
    const a = j * nr + i, b = (j + 1) * nr + i; idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  if (pole) { const top = pos.length / 3; pos.push(0, SHELL.R + back, 0); for (let j = 0; j < nb; j++) idx.push(j * nr + nr - 1, (j + 1) * nr + nr - 1, top); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL.R + 20);
  return g;
}
// one of the two panels in its HOME place (closed): from its outer edge, a gore from the gap's meridian, to its
// meeting edge (plumb low down, raking above: SEAM), from under the water to SEAM.top + 6 m of arc; proud of the face
const PANEL_ROWS = [-5, 0, 10, 20, 30, 37.5, 45, 52.5, 60, 67.5, 75, 82.5, 90, 105, 120, 135, 150];
for (let a = 180; a <= SEAM.top; a += 30) PANEL_ROWS.push(a);
PANEL_ROWS.push(SEAM.top + 6);
function panelGeometry(gb, sd) {
  const pos = [], idx = [], v = new THREE.Vector3(), nr = PANEL_ROWS.length, nb = 6, proud = SEAM.proud[sd < 0 ? 0 : 1];
  for (let j = 0; j <= nb; j++) for (let i = 0; i < nr; i++) { const arc = PANEL_ROWS[i], rw = SHELL.R * Math.cos(Math.max(arc, 0) / SHELL.R);
    const bo = gb + sd * (360 / SHELL.gores), bi = gb + ((SEAM.off * rw / SHELL.R - sd * seamRake(sd, arc)) / rw) / RAD;
    wallPoint(lerp(bo, bi, j / nb), arc, proud, v); pos.push(v.x, v.y, v.z); }
  for (let j = 0; j < nb; j++) for (let i = 0; i < nr - 1; i++) { const a = j * nr + i, b = (j + 1) * nr + i; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL.R + 20);
  return g;
}
function wallUniforms(look, gapBearing, beamAim, SU, rare) {
  const P = PAINTS[look], LL = LAMP_LIGHT[look], c = (h) => ({ value: new THREE.Color(h) });
  return { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLamp: SU.uLamp, uBoat: SU.uBoat,
    uZen: c(P.zen), uMid: c(P.mid), uHaze: c(P.haze), uCloudLit: c(P.cloudLit), uCloudShade: c(P.cloudShade), uSeaLine: c(P.seaLine),
    uBlush: { value: P.blush }, uPaintSeed: { value: PAINT_SEED }, uSunAz: { value: (LAMP.looks[look].bearing - gapBearing) * RAD }, uSunGlow: c(P.glow), uTime: { value: 0 }, uKey: { value: LL.key }, uFill: { value: LL.fill },
    uGapAz: { value: gapBearing * RAD }, uGapHalf: { value: GAP.first / 2 }, uSpill: c('#ffb052'), uRare: { value: rare ? 1 : 0 },
    uLampCol: { value: new THREE.Color().setRGB(lerp(1, LL.color[0], 0.5), lerp(1, LL.color[1], 0.5), lerp(1, LL.color[2], 0.5)) }, uFillCol: c(P.fill),
    uBeamAim: { value: beamAim.clone() },
    uBoardA: { value: Array.from({ length: NBOARD }, () => new THREE.Vector4(0, 0, 0, 1)) }, uBoardB: { value: Array.from({ length: NBOARD }, () => new THREE.Vector4(0, 1, 0, 0)) } };
}
// the shell and its two rolled panels, ONE DRAW (the painted sky: one mesh, one material; a vertex knows whether it
// is of the fixed shell or of a panel, and which: aSide). opts: { look, gapBearing, beamAim (Vector3: where the
// lamp's face is aimed) }. Returns { object, wall (the drawn mesh), shell (the fixed shell's own patch as built, a
// mesh that is kept for whoever reads the wall's facets and is not drawn by itself), doors, uniforms }.
function makeShell(opts) {
  const gb = opts.gapBearing, step = 360 / SHELL.gores, U = wallUniforms(opts.look, gb, opts.beamAim, opts.shadow, opts.rare);
  const rows = ROWS_LOW.slice(); for (let a = 120; a < SHELL.R * Math.PI / 2 - 10; a += 30) rows.push(a);
  const inGap = (b, a0, a1) => Math.abs(b - gb) < step && a1 <= SEAM.top + 0.01;      // (the two gores' own place, left out: the panels stand before it)
  const shell = new THREE.Mesh(patchGeometry(gb, gb + 360, SHELL.gores * 2, rows, 0, (b, a0, a1) => inGap(b, a0, a1) || inGap(b - 360, a0, a1), true));
  shell.name = 'painted-shell';
  // the two panels (SEAM): each a gore of the sky, proud of the painted face, rolled about the dome's axis (by the
  // wall's own vertex law, from the gap's half width)
  const pieces = [[shell.geometry, 0], [panelGeometry(gb, -1), -1], [panelGeometry(gb, 1), 1]]; let nv = 0, ni = 0, ov = 0, oi = 0;
  for (const [g] of pieces) { nv += g.attributes.position.count; ni += g.index.count; }
  const P = new Float32Array(nv * 3), S = new Float32Array(nv), I = new Uint32Array(ni);
  for (const [g, sd] of pieces) { const p = g.attributes.position.array, ix = g.index.array, k = p.length / 3;
    P.set(p, ov * 3); S.fill(sd, ov, ov + k); for (let i = 0; i < ix.length; i++) I[oi + i] = ix[i] + ov; ov += k; oi += ix.length; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(P, 3)); geo.setAttribute('aSide', new THREE.BufferAttribute(S, 1)); geo.setIndex(new THREE.BufferAttribute(I, 1));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL.R + 20);
  const wall = new THREE.Mesh(geo, new THREE.ShaderMaterial({ uniforms: U, vertexShader: WALL_VERT, fragmentShader: WALL_FRAG, fog: true, side: THREE.DoubleSide }));
  wall.frustumCulled = false; wall.name = 'painted-sky';
  const doors = [-1, 1].map((sd) => ({ mesh: wall, side: sd }));
  const object = new THREE.Group(); object.add(wall);
  return { object, shell, wall, doors, uniforms: U };
}

// ---- THE SKY: the shell, its two panels, the lamp-sun, the dark beyond. opts: { look, gapBearing, routeLength,
// beamAim, and the dealt things: detail (the machine's), density (how many work lamps are lit backstage), rare (one
// plate of the wall left in its primer) }; ASYNC (await it: it yields between its pieces). update(dt, time, camera, metres): metres = the metres of route flown (the gap's law reads nothing else).
export async function makeSky(ctx, opts) {
  // (all the clock's dice first, held in THIS sky alone: see THE CLOCK'S DICE)
  const dice = ctx.core.makeRng(ctx.core.hashSeed('sky-clock:' + ctx.seed)), turn = () => dice() * 2 * Math.PI;
  const clock = { lamp: turn(), hung: BEYOND.hung.map(turn), drums: turn(), glow: turn() };
  const SU = shadowUniforms(); opts = { ...opts, shadow: SU };
  const look = opts.look, shell = makeShell(opts), object = new THREE.Group(); object.name = 'sky-with-a-seam';
  const steel = steelWork(look, SU, clock.glow);                // (all the hero's steel: its pieces hand theirs in below; two meshes at the end)
  object.add(shell.object);
  const parts = [];                                             // things added by the pieces below: { update(dt, time, camera, half) }
  const gap = { bearing: opts.gapBearing, width: GAP.first, half: GAP.first / 2 };
  const lampAt = (time, out = new THREE.Vector3()) => lampPlace(look, time, out, clock.lamp);   // this sky's lamp at a clock
  const lamp = new THREE.Vector3(); lampAt(0, lamp); SU.uLamp.value.copy(lamp);
  const api = { object, shell, uniforms: shell.uniforms, shadow: SU, gap, lamp, lampAt, clock, look, parts, opts, steel,
    update(dt, time, camera, metres) {
      shell.uniforms.uTime.value = time;
      gap.width = gapWidth(metres, opts.routeLength); gap.half = gap.width / 2; shell.uniforms.uGapHalf.value = gap.half;   // (the two panels roll by it, in the wall's own vertex law: each from its home, the left one SEAM.off further)
      lampAt(time, lamp); SU.uLamp.value.copy(lamp);
      for (const p of parts) p.update(dt, time, camera, gap.half);
    },
  };
  await ctx.yield();
  for (const add of SKY_PIECES) { await add(ctx, api); await ctx.yield(); }  // (no build step over 50 ms: a breath after every piece, and inside the long ones)
  return api;
}
const SKY_PIECES = [];                                          // filled below: the lamp-sun, the rails and bogies, the dark beyond

// ---- THE SEA: a calm tank, nearly glass, that MIRRORS the painted sky and its clouds. One low regular swell runs
// out from the paddles' wall (the machines' bank stands along the wall leg and runs wider than it, from before its
// first bearing to past its last; THE SWELL COMES FROM THE MIDDLE OF THE WALL LEG: SWELL.from is the bearing halfway
// between the leg's two ends as layRoute lays them, not the middle of the paddles' bank) (straight parallel crests SWELL.length m apart, SWELL.height m high:
// too regular), and the lamp-sun's image stands in it with a narrow calm road. The part's own material: the kit's ocean has a sky
// of its own and cannot mirror this painting. SWELL and swellAt are the one law (the layers and any paddle read it).
// THE IMAGE OF A THING THAT STANDS IN OR OVER THE BAY (a board, an islet, a boat, the town) is laid by its own part,
// as the town lays its own: the sea is one OPAQUE sheet that writes depth, drawn at render order 0; an image is the
// thing's own geometry drawn AGAIN with its height negated about the still water (y -> -y; its light reckoned from
// the eye mirrored likewise), in a transparent material with premultiplied alpha, at a render order from 1.5 to
// 1.99 (after the sea, before this part's wake at 2), writing depth, its gl_FragDepth set to the depth
// where the eye's ray meets the level y = 0.24 (just over the swell's crest, so the sheet never hides it and what
// stands before it still does); its alpha is the water's own mirroring by the ray's slant (about .74 + .24 g * g,
// g = 1 - the ray's fall), its edge broken by the ripples at the water's place; what lies under water is discarded.
// from: the bearing (degrees) it comes from, the middle of the wall leg (halfway between the leg's two ends' bearings, from the route's one layer)
const WALL_LEG = layRoute();
export const SWELL = { from: (WALL_LEG.wallStart + WALL_LEG.wallEnd) / 2, length: 30, height: 0.4 };
const SW = (() => { const d = dirOf(SWELL.from + 180), k = (2 * Math.PI) / SWELL.length; return { x: d.x, z: d.z, k, w: Math.sqrt(9.81 * k), a: SWELL.height / 2 }; })();
// the water's height at a place and a clock (near the eye; far off the drawn sheet eases flat)
export const swellAt = (x, z, time) => SW.a * Math.sin(SW.k * (x * SW.x + z * SW.z) - SW.w * time);
const GLSL_SWELL = /* glsl */`
uniform float uTime; uniform vec2 uCentre;
const vec2 SWD = vec2(${fl(SW.x)}, ${fl(SW.z)}); const float SWK = ${fl(SW.k)}, SWW = ${fl(SW.w)}, SWA = ${fl(SW.a)};
float swellEase(vec2 xz){ return 1. - smoothstep(150., 360., length(xz - uCentre)); }     // (the sheet's detail by where the eye is)
vec3 seaWave(vec2 xz){ return vec3(0., SWA * sin(SWK * dot(xz, SWD) - SWW * uTime) * swellEase(xz), 0.); }
`;
const SEA_VERT = /* glsl */`
${GLSL_SWELL}
varying vec3 vWorld;
#include <fog_pars_vertex>
void main(){
  vec2 xz = position.xz + uCentre; vec3 wp = vec3(xz.x, 0., xz.y) + seaWave(xz); vWorld = wp;
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
// THE WATER'S OWN LIGHT (one source for the sea's paint and for the proof's count). straight: how much of what the
// eye has from the water is the mirror when it looks straight down on it (the rest is the tank's own body; looked
// along, the water is all mirror: straight + (1 - straight) * (1 - the ray's fall) cubed); key: the lamp's part in
// the body's light, a share of its key; sky: the lamp's part in the mirrored painting, a share of its key.
export const SEA_BODY = { straight: 0.09, key: 0.25, sky: 0.82 };
// OUR BOAT'S SHADE ON THE WATER IS A SHADOW ON A MIRROR (the sea's own paint, below; the law is GLSL_SHADOW at the
// water's still place, the water's facing straight up). THE MIRROR'S PICTURE IS NOT SHADED: the mirrored painting,
// the images that other parts lay on the sea and the lamp's own image keep their whole light inside the shade.
// ONLY THE WATER'S OWN BODY LIGHT DEEPENS there, and by the lamp's whole part of it, as on the wall: nothing is
// multiplied over the sea and no dark sheet lies on it. So the shade is plainest close by the boat, where the eye
// looks down into the body, and where the water mirrors the dark of the sky; and IT THINS WITH THE METRES FROM THE
// BOAT BY THE MIRROR'S OWN LAW (looked along, the water is all mirror), so that some 20 m off it is all but gone:
// the shadow leaves the water there, and stands again dark and crisp on the paddles and the painted clouds.
// ITS EDGES ARE SOFT AND BROKEN: along the light's run the half-shade is the whole drum's and across it the
// slant's (the law's own, on a face the light only grazes); and the eye has the body through the rippled face,
// so the shade is read at the place shifted by the ripple's own slope times `depth` metres (the water's unrest
// breaks every edge by a hand or two; where a pixel holds many ripples the shift is none).
// THE RULE THE PROOF HOLDS, in both looks: `at` metres from the eye's foot, the water in the boat's full shade
// stands at `least` or more of the same water beside it, whether it mirrors lit cloud or the blue overhead; and
// at the first of those places, where it mirrors the blue, at `seen` or less (it is a shadow, and seen).
export const WATER_SHADE = { depth: 8, at: [5, 20, 50], least: [0.8, 0.95, 0.98], seen: 0.93 };
const SEA_FRAG = /* glsl */`
varying vec3 vWorld;
uniform float uKey, uFill, uGapAz, uGapHalf, uSunGain; uniform vec3 uLampCol, uFillCol, uDeep, uGlintCol, uSpill; uniform vec4 uGantry;
const float RS = ${fl(SHELL.R)};
${GLSL_SHADOW}
${GLSL_SWELL}
${GLSL_NOISE}
${GLSL_PAINT}
${GLSL_BEYOND}
${GLSL_SEAM}
${GLSL_FILTER}
${GLSL_PLATE}
#include <fog_pars_fragment>
void main(){
  vec3 P = vWorld; vec2 xz = P.xz; float fw = max(length(fwidth(xz)), 1e-3), r = length(xz);
  // the water's face: the swell's own slope, and a breath of ripple (nearly glass), filtered by the pixel's footprint
  float th = SWK * dot(xz, SWD) - SWW * uTime, sl = SWA * SWK * cos(th) * swellEase(xz) * (1. - smoothstep(.9, 2.6, fwidth(SWK * dot(xz, SWD))));
  vec2 q1 = xz / 2.6 + vec2(uTime * .11, -uTime * .07), q2 = xz / .7 - vec2(uTime * .13, uTime * .16);
  vec2 rp = (vec2(vn(q1 + vec2(.37, 0.)) - vn(q1 - vec2(.37, 0.)), vn(q1 + vec2(0., .37)) - vn(q1 - vec2(0., .37))) * .034 * (1. - smoothstep(1.2, 6., fw))
           + vec2(vn(q2 + vec2(.37, 0.)) - vn(q2 - vec2(.37, 0.)), vn(q2 + vec2(0., .37)) - vn(q2 - vec2(0., .37))) * .016 * (1. - smoothstep(.3, 1.6, fw)));
  vec3 N = normalize(vec3(-sl * SWD.x - rp.x, 1., -sl * SWD.y - rp.y));
  vec3 V = normalize(cameraPosition - P), Rr = reflect(-V, N); Rr.y = max(Rr.y, .004); Rr = normalize(Rr);
  // THE MIRROR: where the mirrored ray meets the painted shell, the painting as the wall shows it (lit by the dome's
  // fill and the lamp); in the opening between the panels and beyond the wall, the lit backstage (below)
  float b = dot(P, Rr), c = dot(P, P) - RS * RS, inside = 1. - smoothstep(-2., 6., r - RS);
  vec3 H = P + Rr * (-b + sqrt(max(b * b - c, 0.)));
  float e = asin(clamp(H.y / RS, 0., 1.)), az = mod(atan(H.x, -H.z + 1e-6) - uGapAz + 3.14159265, 6.2831853) - 3.14159265;
  float fH = max(length(fwidth(H)), 1e-3); gHard = res(.32, fH);   // (the wall's own law: by the mirrored pixel's footprint on the wall, nothing else)
  // (the two rolled panels carry their painting with them: where the mirrored ray meets one, its clouds stand
  // shifted in the mirror as they do on the wall; the left panel laps the right)
  float eR = e * RS, ceS = max(cos(e), .05), rollL = (uGapHalf + ${fl(SEAM.off)}) / RS, rollR = (uGapHalf - ${fl(SEAM.off)}) / RS;
  float inL = step(${fl(-SHELL.gore)} - rollL, az) * step(az * RS * ceS, seamRake(-1., eR) - uGapHalf * ceS), inR = step(az, ${fl(SHELL.gore)} + rollR) * step(uGapHalf * ceS - seamRake(1., eR), az * RS * ceS);
  float azP = az + (inL > .5 ? rollL : (inR > .5 ? -rollR : 0.)) * step(eR, ${fl(SEAM.top)});
  // THE PLATES' STRAPS AND HEADS STAND IN THE IMAGE AS THE WALL SHOWS THEM (GLSL_PLATE: the same relief under the
  // same lamp, at the place of the wall the mirrored ray meets, by the mirrored pixel's own footprint there)
  float rwS = max(RS * ceS, 1.), pjS = eR / ${fl(SHELL.joint / 8)}, puS = azP / ${fl(SHELL.gore)} * 8. + .5 * mod(floor(pjS), 2.), PWS = ${fl(SHELL.gore)} * rwS / 8.;
  vec3 hS = H / RS, tzS = normalize(vec3(-hS.z, 0., hS.x) + 1e-5), tuS = normalize(vec3(-hS.x * hS.y, max(1. - hS.y * hS.y, 1e-4), -hS.z * hS.y)), LS = normalize(uLamp - H);
  vec2 TS = vec2(dot(LS, tzS), dot(LS, tuS)) / max(dot(LS, -hS), .08); TS *= min(1., 4. / max(length(TS), 1e-3));
  float svS = (fract(puS + .5) - .5) * PWS, shS = (fract(pjS + .5) - .5) * ${fl(SHELL.joint / 8)}, tlS = (h21(vec2(floor(puS + .5) + 5., floor(pjS) + 41.)) - .5) * ${fl(2 * PLATE.tilt)};
  vec2 relS = strapRel(svS, TS.x, tlS, fH, PWS) + headsRel(svS, eR, HDO, TS, fH, PWS) + strapRel(shS, TS.y, 0., fH, ${fl(SHELL.joint / 8)}) + headsRel(shS, azP * rwS, HDO, TS.yx, fH, ${fl(SHELL.joint / 8)});
  // (and THE WEAR likewise: by the place's own bearing and height on the wall, by the mirrored pixel's footprint)
  vec2 wmS = min(wearMarks(svS, eR, fH, PWS, 1., floor(puS + .5), shS, azP * rwS, fH, ${fl(SHELL.joint / 8)}, 1., floor(pjS + .5), fH) * wearAt(azP + uGapAz, eR), 1.);
  vec3 sky = mix(mix(paintSky(azP, e, 0., 0.).rgb, WRUST, wmS.y), WSTEEL, wmS.x) * (uFillCol * uFill * (1. + relS.y) + uLampCol * uKey * ${fl(SEA_BODY.sky)} * max(1. + relS.x, 0.));
  float open = seamOpen(az, e, uGapHalf, 1.);                  // (the seam's own shape: SEAM)
  // through the opening, and from the water that lies beyond the wall, the mirrored ray meets THE BACKSTAGE: its
  // far wall's light (gold low down, deep blue above) and the catwalks' rows of work lamps, long broken streaks
  float c2 = dot(P, P) - ${fl((SHELL.R + BEYOND.outer) * (SHELL.R + BEYOND.outer))}; vec3 H2 = P + Rr * (-b + sqrt(max(b * b - c2, 0.)));
  float seesBack = 1. - inside * (1. - open), rows = 0.;
  vec2 gth = vec2(-uGantry.w, uGantry.z); float rP = dot(xz, uGantry.zw) - RS, tP = dot(xz, gth);
  vec3 Rg = vec3(dot(Rr.xz, uGantry.zw), Rr.y, dot(Rr.xz, gth));                  // the mirrored ray in the gap's frame (r, y, t)
  for (int i = 0; i < 4; i++) { float t0 = i < 2 ? ${fl(BEYOND.cat.t)} : ${fl(-BEYOND.cat.t)}, y0 = (i == 0 || i == 2) ? ${fl(BEYOND.cat.y[0])} : ${fl(BEYOND.cat.y[1])};
    float st = abs(Rg.z) < 1e-3 ? 1e-3 : Rg.z, s = (t0 - tP) / st, yh = Rg.y * s - y0, rh2 = rP + Rg.x * s;
    float dr = (fract(rh2 / ${fl(BEYOND.cat.every)} + .5) - .5) * ${fl(BEYOND.cat.every)}, sy = 1.3 + .035 * abs(s), sr = .9 + .014 * abs(s);
    rows += step(0., s) * smoothstep(${fl(BEYOND.cat.r0 - 4)}, ${fl(BEYOND.cat.r0 + 2)}, rh2) * (1. - smoothstep(${fl(BEYOND.cat.r1 - 20)}, ${fl(BEYOND.cat.r1)}, rh2))
      * exp(-yh * yh / (sy * sy) - dr * dr / (sr * sr)) / (1. + abs(s) / 140.); }
  // (the ripples draw the low gold out long toward the eye, as they draw out any lamp's image: the image keeps its
  // gold over more of its length than the backstage keeps it in height)
  // THE SEAM'S OWN IMAGE (the galleries that cross it at every cross joint, and their lamps): each gallery a dark
  // bar across the gold, each lamp a LONG STREAK drawn out along the mirrored way and BROKEN by the ripples it
  // lies on (averaged where a pixel holds many ripples)
  float lt = az * RS * ceS, ka = clamp(floor((eR + 1.2) / 30. + .5), 1., ${fl(SEAM.top / 30 - 1)}), da = eR - (ka * 30. - 1.2);
  float dl = lt - (mod(ka, 2.) < .5 ? 4.2 : 0.); dl -= 8.5 * floor(dl / 8.5 + .5);
  // (the ripples' breaks, 0.6 m across: where a pixel outgrows them, their own mean, the mean of the cut of the noise)
  float brk = mix(${fl(vnMean(0.34, 0.7))}, smoothstep(.34, .7, vn(vec2(tP / 1.5, rP / .6 + uTime * .22))), res(.6, fw));
  float seamLamp = exp(-dl * dl / 1.7 - da * da / 420.) * brk, seamBar = exp(-(da + 1.2) * (da + 1.2) / 3.) * step(eR, ${fl(SEAM.top - 15)});
  // (and THE FAR WALL'S OWN BAYS stand in it: its ribs and ring beams dark, each bay of sheeting its own tone, as
  // BACK_FRAG lays them; averaged where a pixel holds many)
  float a2 = mod(atan(H2.x, -H2.z + 1e-6) - uGapAz + 3.14159265, 6.2831853) - 3.14159265;
  vec2 bq = vec2(a2 * length(H2.xz) / 24., H2.y / 18.), bf = max(fwidth(bq), vec2(1e-4)), bg = abs(fract(bq + .5) - .5);
  // (in bays: a rib 0.075 of a bay wide, a ring beam 0.078; each keeps its true cover and ends in its own mean,
  // its width over the bay; a bay's own tone, 0.55 to 1.3, ends in its middle, 0.925)
  float steel2 = uni(lnP(bg.x, .0375, 1., bf.x), lnP(bg.y, .039, 1., bf.y));
  float bayTone = mix(.925, .55 + .75 * h21(floor(bq) + 7.3), resc(1., max(bf.x, bf.y)));
  vec3 back = beyondGlow(H2.y * .36) * .9 * bayTone * (1. - .85 * steel2) * (1. - .4 * seamBar * open) + uGlintCol * (rows * 1.6 + seamLamp * open * 1.5);
  sky = mix(back, sky, 1. - seesBack);
  // the lamp-sun in the mirror: the lamp's own round disc, and its road
  vec3 Ls = uLamp - P; float ld = max(length(Ls), 1.); Ls /= ld; float cs = clamp(dot(Rr, Ls), 0., 1.), ang = 13. / ld;
  float disc = smoothstep(1. - ang * ang * .62, 1. - ang * ang * .4, cs);      // (the drum's own round, its edge plain)
  // (ITS ROAD IS NARROW AND AS CALM AS THE SEA ROUND IT: the same glass draws the image out a little toward the eye
  // and away, no wider than the lamp's own disc; no sparks, no rougher water under the lamp than anywhere else)
  float dAz = (Rr.x * Ls.z - Rr.z * Ls.x) / max(length(Rr.xz) * length(Ls.xz), 1e-3), dEl = Rr.y - Ls.y;
  float lampRoad = exp(-dAz * dAz / max(ang * ang * .5, 1e-6) - dEl * dEl / .02);
  vec3 sun = uLampCol * (disc * 1.9 + lampRoad * .5) * inside * uSunGain;
  // how much the water mirrors (more toward the far water, less straight down, where the tank's own deep shows)
  float cv = clamp(dot(N, V), 0., 1.), fr = ${fl(SEA_BODY.straight)} + ${fl(1 - SEA_BODY.straight)} * pow(max(1. - cv, 1e-4), 3.);
  // OUR BOAT'S SHADE (WATER_SHADE, above): the lamp's part goes off the water's own body, and off nothing else
  float boatSh = boatShadeOn(vec3(xz.x + rp.x * ${fl(WATER_SHADE.depth)}, 0., xz.y + rp.y * ${fl(WATER_SHADE.depth)}), vec3(0., 1., 0.), min(fw, 2.));
  vec3 body = uDeep * (uFillCol * uFill * (.55 + .45 * inside) + uLampCol * uKey * ${fl(SEA_BODY.key)} * inside * (1. - boatSh));
  vec3 col = mix(body, sky, fr) + sun;
  // THE ROAD OF GOLD (by the place alone, steady at every metre): along the gap's own line the backstage's light
  // lies out over the bay as a ROAD OF GLITTER, never a sheet: at the seam's foot it reaches 3 m and three tenths
  // of the seam's half width either hand of the line, 3 m wider for every 100 m out, half its strength 300 m out. It is
  // LIGHT ON THE RIPPLES ONLY: sparks where a ripple's face stands to it, thinning out to either hand (fewer sparks,
  // not a paler wash), averaged where a pixel holds many; the water under and beside it keeps its mirror (the
  // painted dusk's blue and violet, the clouds, the panels, the seam's lamps)
  float din = max(-rP, 0.), rdw = 3. + uGapHalf * .3 + din * .03, road = exp(-tP * tP / (rdw * rdw)) * exp(-din / 430.) * inside;
  // (TWO MARKS SIDE BY SIDE, each half of the road's light: FINE SPARKS a hand deep (ripples 0.42 m by 0.13 m) and
  // BROADER GLINTS half a metre deep (1.5 m by 0.5 m). Each stands while a pixel holds it and goes to ITS OWN MEAN
  // by the pixel's footprint on the water, the fine by their 0.13 m, the broad by their 0.5 m: none is taken away)
  float g1 = vn(vec2(tP / .42 + uTime * .3, rP / .13 - uTime * .9)), g2 = vn(vec2(tP / 1.5 - uTime * .12, rP / .5 + uTime * .3) + 7.);
  float thr = mix(1., .56, road);
  // (EITHER MARK'S OWN MEAN, WORKED ACROSS THE ROAD: how often the noise stands over the sparks' threshold at a place
  // of the road, by the noise's own law: ROAD_MEAN, the cut's mean at every twentieth of the road, read between by
  // the straight line through its CUBE ROOT. (Toward the road's edge the law falls as a tail, which a straight line
  // between far knots overshoots many times over; its cube root runs all but straight: within half a part in a
  // hundred of the law from the road's middle down to a fifth of it, 1.2 parts down to a tenth, 6 to a twentieth,
  // where the fringe's own ramp has all but closed the road.)
  // THE MEAN ACROSS THE ROAD (road: mean): ${[20, 18, 16, 14, 12, 10, 8, 6, 4, 3, 2, 1].map((k) => `${k / 20}: ${ROAD_MEAN[k].toFixed(5)}`).join(', ')}.
  // The fine sparks and the broad glints are that one noise cut at that one threshold, each at its own size, so
  // EACH HAS THIS MEAN, and THE ROAD'S MEAN IS THE SUM OF THE TWO HALVES: this very number under every pixel, near
  // and far alike)
  float rq = road * 20., glitR = ${ROAD_MEAN.slice(1).map((v, k) => `${f6(Math.cbrt(v) - Math.cbrt(ROAD_MEAN[k]))} * clamp(rq - ${k}., 0., 1.)`).join(' + ')};
  float glitM = glitR * glitR * glitR;
  float sparks = mix(glitM, smoothstep(thr, thr + .1, g1), res(.13, fw));      // the fine sparks, by their 0.13 m: their own mean, glitM
  float glints = mix(glitM, smoothstep(thr, thr + .1, g2), res(.5, fw));       // the broad glints, by their 0.5 m: theirs, the same number
  float glit = (sparks + glints) * .75 * smoothstep(.03, .2, road);
  col += uSpill * glit;
  // beyond the wall: the floodlamps' light lies on the ripples in long broken streaks down the channel
  float rr = dot(xz, uGantry.zw), tt = dot(xz, vec2(-uGantry.w, uGantry.z)), dg = length(xz - uGantry.xy);
  float rip = vn(vec2(tt * 1.4, rr * .21 - uTime * .13)) * .6 + vn(vec2(tt * 3.9 + 5., rr * .62 + uTime * .22)) * .4;
  // (streaks 0.3 to 0.7 m across: where a pixel outgrows them, their own mean, the mean of the cut of the two noises' mix)
  col += uGlintCol * mix(${fl(vnMean2(0.56, 0.86, 0.6, 0.4))}, smoothstep(.56, .86, rip), res(.5, fw)) * exp(-dg / 42.) * .5 * (1. - inside);
  gl_FragColor = vec4(col, 1.);
  #ifdef USE_FOG
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, (1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth)) * inside);   // (no bright air beyond the wall)
  #endif
}`;
const SEAS = [{ deep: '#0a3550' }, { deep: '#1c3048' }];          // the tank's own deep, by look
// THE SAME LIGHT LAW IN JS (for the proof): how bright the water stands in the boat's FULL shade against the same
// water beside it (luminance, linear), on still water d metres from the eye's foot, the eye BOAT.eye m over it,
// where the water mirrors a paint of the sky (a hex of PAINTS[look]) lit as the mirror shows it
export function waterInShade(look, d, paint) {
  const LL = LAMP_LIGHT[look], lum = (c) => 0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b, deep = new THREE.Color(SEAS[look].deep);
  const fill = new THREE.Color(PAINTS[look].fill).multiplyScalar(LL.fill), lamp = new THREE.Color().setRGB(lerp(1, LL.color[0], 0.5), lerp(1, LL.color[1], 0.5), lerp(1, LL.color[2], 0.5)).multiplyScalar(LL.key);
  const cv = BOAT.eye / Math.hypot(BOAT.eye, d), fr = SEA_BODY.straight + (1 - SEA_BODY.straight) * (1 - cv) ** 3;
  const sky = lum(new THREE.Color(paint).multiply(fill.clone().add(lamp.clone().multiplyScalar(SEA_BODY.sky))));
  const bodyFill = lum(deep.clone().multiply(fill)), bodyKey = lum(deep.clone().multiply(lamp)) * SEA_BODY.key, lit = (1 - fr) * (bodyFill + bodyKey) + fr * sky;
  return (lit - (1 - fr) * bodyKey) / lit;
}
// makes the sea. sky: what makeSky gave (the painting's and the light's uniforms are shared by reference); opts:
// { look, gapBearing, routeLength, detail }. update(dt, time, camera, metres). heightAt(x, z, time): the water under a hull.
export function makeSea(ctx, sky, opts) {
  // a round sheet drawn about the eye (fine near, coarse far: detail by where the eye is); its waves are the world's
  const pos = [], idx = [], NS = Math.max(48, Math.min(96, Math.round(72 * (opts.detail || 1) / 8) * 8)), radii = [0]; let rr = 0, st = 0.6;   // (the sheet's spokes by the machine's detail)
  while (rr < 1500) { rr += st; st = Math.min(st * 1.085, 90); radii.push(rr); }
  for (const r of radii) for (let j = 0; j < NS; j++) { const a = (j / NS) * 2 * Math.PI; pos.push(Math.cos(a) * r, 0, Math.sin(a) * r); }
  for (let i = 0; i < radii.length - 1; i++) for (let j = 0; j < NS; j++) { const a = i * NS + j, b = i * NS + (j + 1) % NS, c = a + NS, d = b + NS; idx.push(a, b, c, b, d, c); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1600);
  const W = sky.uniforms, gm = wallPoint(opts.gapBearing, 0, -30), rh = dirOf(opts.gapBearing), pick = (...k) => Object.fromEntries(k.map((n) => [n, W[n]]));
  const U = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), ...pick('uZen', 'uMid', 'uHaze', 'uCloudLit', 'uCloudShade', 'uSeaLine', 'uSunGlow', 'uBlush', 'uPaintSeed', 'uSunAz', 'uGapAz', 'uKey', 'uFill', 'uLampCol', 'uFillCol', 'uSpill'),
    uLamp: sky.shadow.uLamp, uBoat: sky.shadow.uBoat, uTime: { value: 0 }, uCentre: { value: new THREE.Vector2() }, uGapHalf: { value: GAP.first / 2 }, uDeep: { value: new THREE.Color(SEAS[opts.look].deep) },
    uGlintCol: { value: new THREE.Color('#ffc98a') }, uGantry: { value: new THREE.Vector4(gm.x, gm.z, rh.x, rh.z) }, uSunGain: { value: LAMP_SHOW[opts.look].sea } };
  const mesh = new THREE.Mesh(g, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SEA_VERT, fragmentShader: SEA_FRAG, fog: true }));
  mesh.frustumCulled = false; mesh.name = 'the-sea';
  const object = new THREE.Group(); object.name = 'sea'; object.add(mesh);
  const eyeV = new THREE.Vector3();                               // (a scratch for the eye's world place, made here once)
  return { object, mesh, uniforms: U, heightAt: swellAt,
    update(dt, time, camera, metres) { if (camera) camera.getWorldPosition(eyeV); U.uTime.value = time; U.uCentre.value.set(eyeV.x, eyeV.z); U.uGapHalf.value = gapWidth(metres, opts.routeLength) / 2; } };
}
// ---- OUR THIN LAYER JUST OVER THE PART'S OWN SEA: the boat's wake (the boat's shade on the water and the dark of
// the water beyond the wall are in the sea's own material). It rides the sea's own swell (GLSL_SWELL, the one law;
// the clock is the sea's own uniform) a finger over the water, and paints by the water's own place.
const GLSL_SEAWAVE = GLSL_SWELL;
const LAYER_FOG = /* glsl */`
#include <fog_pars_fragment>
float layerFog(){
  #ifdef USE_FOG
    return 1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth);
  #else
    return 0.;
  #endif
}`;
function seaUniforms(sea) {
  return { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uTime: sea.uniforms.uTime, uCentre: sea.uniforms.uCentre };
}
const layerMaterial = (uniforms, vertexShader, fragmentShader) => new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader, fog: true, transparent: true, premultipliedAlpha: true,
  depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
// (THE BOAT'S SHADE ON THE WATER is no layer: it is in the sea's own paint, where only the water's body light
// deepens and the mirror's picture keeps its light: WATER_SHADE, at the sea)

// THE WAKE: a ribbon laid along the whole route (its place is the route's own); only the stretch just astern of the
// boat's place on the route shows: a churned lane from the stern and the two arms of the bow wave.
const WAKE_VERT = /* glsl */`
${GLSL_SEAWAVE}
attribute vec2 aWake;                       // metres of route, metres to starboard of the line
uniform float uBoatS; varying vec3 vW; varying vec2 vXZ;
#include <fog_pars_vertex>
void main(){
  float back = uBoatS - aWake.x; vW = vec3(back, aWake.y, 0.); vXZ = position.xz;
  vec3 wp = vec3(position.x, .045, position.z) + seaWave(position.xz);
  vec4 mvPosition = viewMatrix * vec4(wp, 1.); gl_Position = projectionMatrix * mvPosition;
  if (back < -6. || back > 150.) gl_Position = vec4(2., 2., 2., 1.);      // out of the wake's stretch: not drawn
  #include <fog_vertex>
}`;
const WAKE_FRAG = /* glsl */`
${GLSL_NOISE}
uniform float uTime; uniform vec3 uFoam; varying vec3 vW; varying vec2 vXZ;
${LAYER_FOG}
void main(){
  float foot = max(length(fwidth(vXZ)), 1e-3), back = vW.x, y = abs(vW.y);
  float aft = back - ${fl(-BOAT.stern)};                                  // metres astern of the stern post
  // the churned lane: narrow at the stern, spreading and thinning astern
  float w = .5 + .035 * max(aft, 0.), lane = (1. - smoothstep(w * .5, w, y)) * smoothstep(-.6, 1.5, aft) * exp(-max(aft, 0.) / 46.);
  // the bow wave's arms: from the stem, opening at about 19 degrees a side, fading astern
  float fromStem = back + ${fl(BOAT.stem)}, ax = .45 + fromStem * .33;
  float arm = (1. - smoothstep(.0, .5 + .012 * fromStem, abs(y - ax))) * smoothstep(.3, 2.5, fromStem) * exp(-fromStem / 24.);
  float n = vn(vXZ * 1.7 + vec2(uTime * .35, 0.)) * .6 + vn(vXZ * 5.3 - vec2(0., uTime * .5)) * .4;
  // (the foam's lace, 0.2 to 0.6 m across: where a pixel outgrows it, its own mean, the mean of the cut of the two noises' mix)
  float lace = mix(${fl(vnMean2(0.34, 0.72, 0.6, 0.4))}, smoothstep(.34, .72, n), 1. - smoothstep(.3, 1.2, foot));
  float a = clamp(lane * (.25 + .75 * lace) * .85 + arm * (.35 + .65 * lace) * .7, 0., 1.) * (1. - layerFog());
  gl_FragColor = vec4(uFoam * a, a);
}`;
function wakeRibbon(ocean, path, length, look) {
  const pos = [], aw = [], idx = [], NS = Math.ceil(length / 2.5), LAT = [-9, -3.2, -0.9, 0.9, 3.2, 9], p = new THREE.Vector3(), t = new THREE.Vector3();
  for (let i = 0; i <= NS; i++) { const u = i / NS; path.pointAt(u, p); path.tangentAt(u, t); const hl = Math.hypot(t.x, t.z) || 1, sx = -t.z / hl, sz = t.x / hl;
    for (const l of LAT) { pos.push(p.x + sx * l, 0, p.z + sz * l); aw.push(u * length, l); } }
  const nl = LAT.length;
  for (let i = 0; i < NS; i++) for (let j = 0; j < nl - 1; j++) { const k = i * nl + j; idx.push(k, k + 1, k + nl, k + 1, k + nl + 1, k + nl); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('aWake', new THREE.Float32BufferAttribute(aw, 2)); g.setIndex(idx);
  const U = { ...seaUniforms(ocean), uBoatS: { value: 0 }, uFoam: { value: new THREE.Color(look ? '#f4dcc0' : '#eef4f6').multiplyScalar(0.82) } };
  const m = new THREE.Mesh(g, layerMaterial(U, WAKE_VERT, WAKE_FRAG)); m.frustumCulled = false; m.renderOrder = 2; m.name = 'boat-wake';
  return { mesh: m, uniforms: U };
}

// opts: { path, length, look } are read; gapBearing and shadow (the sky's: sky.shadow) are still taken and no longer
// read (the shade and the dark are the sea's own). update(dt, time, camera, metres): metres = the boat's place on the route.
export async function makeLayers(ctx, sea, opts) {
  // (shade: kept as an empty name, as dark is: the boat's shade on the water is in the sea's own paint and goes
  // with the boat's place, sky.shadow.uBoat; the sea itself is dark beyond the wall)
  const shade = { mesh: new THREE.Group(), uniforms: {} }; shade.mesh.name = 'boat-shadow-on-water';
  await ctx.yield();
  const wake = wakeRibbon(sea, opts.path, opts.length, opts.look);
  const object = new THREE.Group(); object.name = 'sea-layers'; object.add(shade.mesh, wake.mesh);
  return { object, shade, wake, dark: { mesh: new THREE.Group(), uniforms: {} },
    update(dt, time, camera, metres) { wake.uniforms.uBoatS.value = metres; } };
}

// ---- OUR BOAT: a clinker double-ender of the north, oiled pine, empty. Built in its own frame and laid into three's:
// x = s (to starboard), y up, z = -f (so the group's -Z heads along the route). Nothing lettered, nobody aboard.
// (the rigging's rope, in metres: r its half thickness, lay one strand's whole turn, yarns the yarns round it,
// marline the small line's thickness, lanyard and parts the foot's lashing, every / stray / seize the seizings up
// the stay, proud how far a seizing stands out of the rope, as a share of r; sides: the round's faces)
const ROPE = { r: BOAT.stay, lay: 0.085, yarns: 21, marline: 0.004, lanyard: 0.26, parts: 5, every: 0.9, stray: 0.2, seize: [0.05, 0.08], proud: 1.2, sides: 8 };
// THE ROPE'S PAINT (laid into the boat's own lit material after its vertex colour): a strand is a round ridge
// between two grooves (1 - s^3 across it, s from its crown to its groove: its mean over a strand is 3/4, which the
// vertex colour already is), a yarn a slighter rib; EACH IS DRAWN ONLY WHERE A PIXEL CAN HOLD IT (by the phase's
// own footprint in the pixel) and is the rope's plain mean tone where it cannot. The pixel's footprint is read
// (fwidth), nothing else of the eye.
const ROPE_PAINT = /* glsl */`
  float ropeF = fwidth(vRope.x), yarnF = fwidth(vRope.y);
  float ropeS = abs(fract(vRope.x) * 2. - 1.), ropeY = abs(fract(vRope.y) * 2. - 1.);
  diffuseColor.rgb *= (1. + vRope.z * (.25 - ropeS * ropeS * ropeS) * (1. - smoothstep(.3, .9, ropeF)))
    * (1. + vRope.w * (ropeY - .5) * (1. - smoothstep(.3, .9, yarnF)));
`;
// (the set sail, in metres: cloths side by side from the luff to the leech, each its even share of the head above
// and of the foot below, so that their seams lie the luff's way at the luff, up and forward, and turn to the
// leech's way at the leech; rows of its drawn grid up it; belly at its middle; breath: how far that belly
// breathes in and out by the clock; reef: the reef band's place, a share of the height up from the foot; tie: a
// reef point's length; rope: the bolt rope's half thickness; sheetTo [f, y, s]: where the sheet is made fast, on
// the port quarter's gunwale; the tack's line is made fast on the mast thwart, plumb under the tack. The proof
// reads breath, for its count of the cloth against every gaze. WHERE THE CLOTH CROSSES THE MAST it lies on the
// mast's port side, its belly toward the mast: at rest 3 mm clear of the mast's round, breathed out 16 mm into
// it at the most, as a lug's cloth lies on its mast on this tack; no picture holds it, and the shadow is thrown
// from the flat four corners)
export const SAIL = { cloths: 7, rows: 10, belly: 0.14, breath: 0.05, reef: 0.24, tie: 0.28, rope: 0.011, sheetTo: [-3.6, 1.14, -0.5] };
const sailSide = (a, b) => Math.hypot(BOAT.sail[a][0] - BOAT.sail[b][0], BOAT.sail[a][1] - BOAT.sail[b][1], BOAT.sail[a][2] - BOAT.sail[b][2]);
const SAIL_CLOTH = (sailSide(0, 1) + sailSide(3, 2)) / 2 / SAIL.cloths;      // a cloth's mean width: the head's and the foot's lengths, halved, over the cloths
// THE SAIL'S PAINT (laid into the same material; vSail: cloths across, the share of the height up from the foot,
// metres of that height, the belly's weight): THE CLOTHS' SEAMS (a dark stitched line with its doubled lap), A ROW
// OF REEF POINTS (a band across the sail, a hemp tie hanging from it in the middle of every cloth), each line
// filtered by the pixel's footprint across it (fwidth: read here as in the rope's paint, nothing else of the eye):
// drawn a pixel wide at the least with the cover it truly has, and, where a pixel is a cloth wide, its own mean
// (its width over a cloth's).
// The bolt rope is rope (the rigging's own, round the sail's edges).
const SAIL_PAINT = /* glsl */`
  float sailU = max(fwidth(vSail.x) * ${fl(SAIL_CLOTH)}, 1e-4), sailV = max(fwidth(vSail.y) * vSail.z, 1e-4), onSail = step(1e-3, vSail.z);
  float seamD = (.5 - abs(fract(vSail.x) - .5)) * ${fl(SAIL_CLOTH)}, tieD = abs(fract(vSail.x) - .5) * ${fl(SAIL_CLOTH)}, upM = (vSail.y - ${fl(SAIL.reef)}) * vSail.z;
  float sailP = 1. - smoothstep(${fl(SAIL_CLOTH * 0.5)}, ${fl(SAIL_CLOTH)}, sailU);
  float seam = mix(${fl(2 * 0.012 / SAIL_CLOTH)}, boatLine(seamD, .012, sailU), sailP), lap = mix(${fl(2 * 0.04 / SAIL_CLOTH)}, boatLine(seamD, .04, sailU), sailP), band = boatLine(abs(upM), .035, sailV);
  float tie = mix(${fl(2 * 0.012 / SAIL_CLOTH)}, boatLine(tieD, .012, sailU), sailP) * clamp((upM + ${fl(SAIL.tie)}) / sailV + .5, 0., 1.) * clamp((.02 - upM) / sailV + .5, 0., 1.);
  diffuseColor.rgb = mix(diffuseColor.rgb, mix(diffuseColor.rgb * (1. - .3 * seam) * (1. - .1 * lap) * (1. - .14 * band), ${(() => { const c = new THREE.Color('#ad9a72'); return v3(c.r, c.g, c.b); })()}, tie), onSail);
`;
function boatGeometry(rng) {
  const P = [], C = [], col = new THREE.Color(), B = BOAT;
  const tri = (a, b, c, k) => { P.push(a[0], a[1], -a[2], b[0], b[1], -b[2], c[0], c[1], -c[2]); for (let i = 0; i < 3; i++) C.push(k.r, k.g, k.b); };
  const quad = (a, b, c, d, k) => { tri(a, b, c, k); tri(a, c, d, k); };       // points as [s, y, f]
  const shade = (hex, m) => col.set(hex).multiplyScalar(m).clone();
  const pine = (m) => shade('#b4854c', m), dark = (m) => shade('#6b4a2a', m);
  const inner = (k, tone) => shade('#8a6238', (1.3 - 0.09 * k) * (k % 2 ? 0.7 : 1) * tone);       // the planking seen from inside: strake by strake
  // the hull's stations: t 0 at the stern post, 1 at the stem
  const NSt = 22, NK = 5, len = B.stem - B.stern;
  const half = (t) => B.halfBeam * Math.pow(Math.sin(Math.PI * clamp(t, 0, 1)), 0.72);
  const sheer = hullSheer, keel = hullKeel;                                   // (the hull's own profile: the blades of BOAT.ends are cut from the same)
  const ring = (t, inset) => { const f = B.stern + len * t, hb = Math.max(half(t) - inset, 0), ys = sheer(t), yk = keel(t) + inset * 0.6, out = [];
    for (let k = 0; k <= NK; k++) { const a = (k / NK) * Math.PI / 2, lap = inset ? 0 : 0.022 * (k % 2);
      out.push([hb * Math.pow(Math.cos(a), 0.62) + lap, lerp(ys, yk, Math.pow(Math.sin(a), 1.25)), f]); }
    return out; };
  for (let i = 0; i < NSt; i++) { const t0 = i / NSt, t1 = (i + 1) / NSt, tone = 0.9 + 0.2 * rng();
    for (const sd of [-1, 1]) { const flip = (p) => [p[0] * sd, p[1], p[2]];
      const o0 = ring(t0, 0).map(flip), o1 = ring(t1, 0).map(flip), n0 = ring(t0, 0.035).map(flip), n1 = ring(t1, 0.035).map(flip);
      for (let k = 0; k < NK; k++) { const kc = pine((0.82 + 0.1 * (k % 2)) * tone);
        if (sd > 0) { quad(o0[k], o1[k], o1[k + 1], o0[k + 1], kc); quad(n0[k + 1], n1[k + 1], n1[k], n0[k], inner(k, tone)); }
        else { quad(o0[k + 1], o1[k + 1], o1[k], o0[k], kc); quad(n0[k], n1[k], n1[k + 1], n0[k + 1], inner(k, tone)); } }
      // the gunwale's cap
      const g0 = [o0[0][0] + sd * 0.03, o0[0][1] + 0.035, o0[0][2]], g1 = [o1[0][0] + sd * 0.03, o1[0][1] + 0.035, o1[0][2]], h0 = [n0[0][0] - sd * 0.03, n0[0][1] + 0.035, n0[0][2]], h1 = [n1[0][0] - sd * 0.03, n1[0][1] + 0.035, n1[0][2]];
      if (sd > 0) quad(h0, h1, g1, g0, pine(1.12)); else quad(g0, g1, h1, h0, pine(1.12)); } }
  // boxes and round spars
  const box = (c, e, k, yaw = 0) => { const cs = Math.cos(yaw), sn = Math.sin(yaw), v = (x, y, z) => [c[0] + x * cs + z * sn, c[1] + y, c[2] - x * sn + z * cs];
    const [x, y, z] = e, p = [v(-x, -y, -z), v(x, -y, -z), v(x, y, -z), v(-x, y, -z), v(-x, -y, z), v(x, -y, z), v(x, y, z), v(-x, y, z)];
    quad(p[0], p[1], p[2], p[3], k); quad(p[5], p[4], p[7], p[6], k); quad(p[3], p[2], p[6], p[7], k); quad(p[4], p[5], p[1], p[0], k); quad(p[1], p[5], p[6], p[2], k); quad(p[4], p[0], p[3], p[7], k); };
  const spar = (a, b, r0, r1, k, n = 7) => { const A = new THREE.Vector3(...a), D = new THREE.Vector3(...b).sub(A), u = new THREE.Vector3(1, 0, 0);
    if (Math.abs(D.clone().normalize().x) > 0.9) u.set(0, 1, 0); const e1 = u.clone().cross(D).normalize(), e2 = D.clone().cross(e1).normalize();
    const pt = (i, r, s) => { const an = (i / n) * 2 * Math.PI, q = A.clone().addScaledVector(D, s).addScaledVector(e1, Math.cos(an) * r).addScaledVector(e2, Math.sin(an) * r); return [q.x, q.y, q.z]; };
    for (let i = 0; i < n; i++) quad(pt(i, r0, 0), pt(i + 1, r0, 0), pt(i + 1, r1, 1), pt(i, r1, 1), k); };
  // stem and stern posts (rising to their heads), three thwarts, the bottom boards, the mast's step
  for (const [t0, sgn] of [[1, 1], [0, -1]]) for (let i = 0; i < 5; i++) { const ta = t0 - sgn * i * 0.022, tb = t0 - sgn * (i + 1) * 0.022;
    spar([0, sheer(ta) + 0.1 - i * 0.02, B.stern + len * ta + sgn * 0.03], [0, keel(tb) + 0.25 * (sheer(tb) - keel(tb)) * (1 - i / 5), B.stern + len * tb + sgn * 0.02], B.post.f - 0.005, B.post.f + 0.005, dark(1.1), 5); }
  for (const [t0, sgn] of [[1, 1], [0, -1]]) { const fe = B.stern + len * t0, tb = t0 - sgn * 0.036, fb = B.stern + len * tb, hb = half(tb) - 0.03, yb = sheer(tb) + 0.012;
    // the post's squared head, proud of the gunwales, its top worn pale; the breasthook: a knee across the two gunwales
    box([0, B.stemHead - 0.13, fe + sgn * 0.035], [B.post.s, 0.13, B.post.f], pine(0.92)); box([0, B.stemHead + 0.008, fe + sgn * 0.035], [B.post.s + 0.006, 0.012, B.post.f + 0.006], pine(1.3));
    tri([-hb, yb, fb], [hb, yb, fb], [0, sheer(t0) + 0.012, fe - sgn * 0.04], pine(1.0));
    box([0, yb + 0.012, fb], [hb, 0.014, 0.028], pine(1.14)); }
  for (const f of [-2.55, -0.83, 0.75]) { const t = (f - B.stern) / len; box([0, sheer(t) - 0.2, f], [half(t) - 0.03, 0.025, 0.13], pine(1.05)); }
  for (let i = 0; i < 6; i++) { const f = -3.0 + i * 0.86, t = (f + 0.4 - B.stern) / len; box([0, 0.14, f + 0.4], [Math.min(half(t) * 0.78, 0.62), 0.015, 0.4], pine(0.7 + 0.12 * rng())); }
  box([0, 0.2, B.mast.f], [0.16, 0.06, 0.16], dark(1));
  // the mast and the yard (the shadow's casters 0 and 1, BUILT AS THEY CAST: the mast BOAT.mast.taper thicker than
  // its casting mean at its foot and as much thinner at its head; the yard likewise from its sling to either end)
  const m = B.mast, y = B.yard, S3 = (q) => [q[2], q[1], q[0]];                             // (a point [f, y, s] of the boat as [s, y, f])
  spar([0, m.foot, m.f], [0, m.top, m.f], m.r + m.taper, m.r - m.taper, pine(0.95), 8);
  for (const end of [-y.lo, y.hi]) spar(S3(y.at(0)), S3(y.at(end)), y.r + y.taper, y.r - y.taper, pine(0.85), 7);
  // their ends are ROUND, as the law's capsules are: a dome of the spar's own half thickness on the mast's head and
  // on the yard's two ends, in two rings (at `up` of the dome's height the round is sqrt(1 - up * up) of its foot)
  const dome = (a, b, r, k, n) => { const up = 0.7, at = (h) => a.map((v, i) => v + (b[i] - a[i]) * h * r / Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]));
    spar(a, at(up), r, r * Math.sqrt(1 - up * up), k, n); spar(at(up), at(1), r * Math.sqrt(1 - up * up), 0, k, n); };
  dome([0, m.top, m.f], [0, m.top + 1, m.f], m.r - m.taper, pine(0.95), 8);
  for (const end of [-y.lo, y.hi]) dome(S3(y.at(end)), S3(y.at(2 * end)), y.r - y.taper, pine(0.85), 7);
  // THE SET SAIL (BOAT.sail: the very cloth that casts): tanned canvas in SAIL.cloths cloths from the luff to the
  // leech, each cloth a shade its own way (a die a cloth), with a belly of SAIL.belly m at its middle toward the
  // lamp's hand (away from the eye; none at its four edges, which are the caster's own). A sail's vertex carries
  // aSail (cloths across, its share of the height up from the foot, metres of that height, the belly's weight: all
  // four 0 on every other vertex of the boat) and the cloth's own smooth normal; the paint is SAIL_PAINT.
  const SV = [], F3 = (q) => new THREE.Vector3(q[2], q[1], -q[0]);                          // (a point [f, y, s] of the boat, in three's frame)
  const [TH, PK, CL, TK] = B.sail.map(F3), [NU, NV] = [2 * SAIL.cloths, SAIL.rows], lee = new THREE.Vector3(1, 0, 1), grid = [];
  const flat = (u, v) => TK.clone().lerp(CL, u).lerp(TH.clone().lerp(PK, u), v), flatN = CL.clone().sub(TK).cross(TH.clone().sub(TK)).normalize(), over = flatN.dot(lee) < 0; if (over) flatN.negate();   // (over: the cloth's own winding faces the other hand)
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const u = i / NU, v = j / NV, w = Math.sin(Math.PI * u) * Math.sin(Math.PI * v);
    grid.push({ p: flat(u, v).addScaledVector(flatN, SAIL.belly * w), a: [u * SAIL.cloths, v, TH.clone().lerp(PK, u).distanceTo(TK.clone().lerp(CL, u)), w] }); }
  const G = (i, j) => grid[clamp(j, 0, NV) * (NU + 1) + clamp(i, 0, NU)];
  for (const q of grid) q.N = null;
  for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const N = G(i + 1, j).p.clone().sub(G(i - 1, j).p).cross(G(i, j + 1).p.clone().sub(G(i, j - 1).p)).normalize(); G(i, j).N = N.dot(lee) < 0 ? N.negate() : N; }
  const tones = Array.from({ length: SAIL.cloths }, () => shade('#a2623e', 0.9 + 0.2 * rng()));
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) for (const q of over ? [G(i, j), G(i + 1, j + 1), G(i + 1, j), G(i, j), G(i, j + 1), G(i + 1, j + 1)] : [G(i, j), G(i + 1, j), G(i + 1, j + 1), G(i, j), G(i + 1, j + 1), G(i, j + 1)]) { const k = tones[Math.floor(i / 2)];
    SV.push(P.length / 3, q.N.x, q.N.y, q.N.z, ...q.a); P.push(q.p.x, q.p.y, q.p.z); C.push(k.r, k.g, k.b); }
  // THE STANDING RIGGING IS ROPE (a rule of the boat, in metres along each stay from its foot at the gunwale up to
  // the masthead; the four stays are the shadow's casters 6 to 9, drawn where they cast and as thick as they cast,
  // ROPE.r being BOAT.stay): three-strand hemp laid
  // right-handed, 2 * ROPE.r thick, a strand's turn ROPE.lay long. At the foot a lanyard's lashing ROPE.lanyard m
  // long (small line in ROPE.parts parallel parts, frapped round its middle), then the seizing of the stay's eye;
  // up the stay a seizing of tarred marline about every ROPE.every m (each strayed up to ROPE.stray m along it,
  // and ROPE.seize[0] to ROPE.seize[1] m long: dealt from the boat's own stream); a last one under the masthead.
  // A rope's vertex carries aRope (its strands' phase, one to a strand; its yarns' phase; how deep each is drawn:
  // all four 0 on every other vertex of the boat) and the round's own normal; the paint is ROPE_PAINT, below.
  const RV = [], hemp = shade('#ad9a72', 1), marline = shade('#4a3524', 1), R = ROPE;
  const KIND = { laid: (u, v) => [3 * v - (3 * u) / R.lay, R.yarns * v + u / (R.lay / 2), 0.7, 0.22],
    seized: (u, v) => [v + u / R.marline, 0, 0.5, 0], lanyard: (u, v) => [R.parts * v, 3 * R.parts * v - u / (3 * R.marline), 0.6, 0.2] };
  // a rope from A to Bq (three's frame), laid in pieces by plan(piece, its length): piece(from, to, radius, kind, colour)
  const rope = (A, Bq, plan) => { const D = Bq.clone().sub(A), L = D.length(); D.normalize();
    const e1 = new THREE.Vector3(Math.abs(D.x) > 0.9 ? 0 : 1, Math.abs(D.x) > 0.9 ? 1 : 0, 0).cross(D).normalize(), e2 = D.clone().cross(e1), n = R.sides;
    const ring = (u, r, kind) => { const out = [];
      for (let i = 0; i <= n; i++) { const an = (i / n) * 2 * Math.PI, N = e1.clone().multiplyScalar(Math.cos(an)).addScaledVector(e2, Math.sin(an));
        out.push({ p: A.clone().addScaledVector(D, u).addScaledVector(N, r), N, a: kind(u, i / n) }); }
      return out; };
    plan((u0, u1, r, kind, k) => { const lo = ring(u0, r, kind), hi = ring(u1, r, kind);
      for (let i = 0; i < n; i++) for (const q of [lo[i], lo[i + 1], hi[i + 1], lo[i], hi[i + 1], hi[i]]) {
        RV.push(P.length / 3, q.N.x, q.N.y, q.N.z, ...q.a); P.push(q.p.x, q.p.y, q.p.z); C.push(k.r, k.g, k.b); } }, L); };
  // the sail's bolt rope down its luff, along its foot and up its leech (its head is laced to the yard), the tack's
  // line down to the mast thwart and the sheet from the clew to the port quarter's gunwale: plain laid hemp
  const plain = (r) => (piece, L) => piece(0, L, r, KIND.laid, hemp);
  rope(TH, TK, plain(SAIL.rope)); rope(TK, CL, plain(SAIL.rope)); rope(CL, PK, plain(SAIL.rope));
  rope(TK, F3([B.tack[0], sheer((m.f - B.stern) / len) - 0.175, B.tack[2]]), plain(R.r)); rope(CL, F3(SAIL.sheetTo), plain(R.r));      // (the mast thwart's top, plumb under the tack)
  for (const c of B.cast.slice(6, 10)) rope(F3([c[3], c[4], c[5]]), F3([c[0], c[1], c[2]]), (piece, L) => {
    const ly = R.lanyard, top = L - R.seize[1], span = top - ly - R.seize[1], cells = Math.max(Math.round(span / R.every), 1), cell = span / cells;
    piece(0, ly * 0.4, R.r * 0.8, KIND.lanyard, hemp); piece(ly * 0.4, ly * 0.6, R.r * 0.95, KIND.seized, hemp); piece(ly * 0.6, ly, R.r * 0.8, KIND.lanyard, hemp);
    piece(ly, ly + R.seize[1], R.r * R.proud, KIND.seized, marline);
    let u = ly + R.seize[1];
    for (let i = 0; i < cells; i++) { const len = lerp(R.seize[0], R.seize[1], rng()), at = ly + R.seize[1] + (i + 0.5) * cell + (2 * rng() - 1) * R.stray - len / 2;
      piece(u, at, R.r, KIND.laid, hemp); piece(at, at + len, R.r * R.proud, KIND.seized, marline); u = at + len; }
    piece(u, top, R.r, KIND.laid, hemp); piece(top, L, R.r * R.proud, KIND.seized, marline); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
  g.computeVertexNormals(); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2.5, 0.8), 7);
  // (the ropes' and the sail's own round and smooth normals, and their two paints' measures)
  const nrm = g.attributes.normal, own = (list, name) => { const arr = new Float32Array((P.length / 3) * 4);
    for (let i = 0; i < list.length; i += 8) { nrm.setXYZ(list[i], list[i + 1], list[i + 2], list[i + 3]); for (let j = 0; j < 4; j++) arr[list[i] * 4 + j] = list[i + 4 + j]; }
    g.setAttribute(name, new THREE.Float32BufferAttribute(arr, 4)); };
  own(RV, 'aRope'); own(SV, 'aSail');
  return g;
}
export function makeBoat(ctx) {
  const rng = ctx.core.makeRng(ctx.core.hashSeed('our-boat:' + ctx.seed));
  const wood = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0, side: THREE.DoubleSide });
  // (the rope's and the sail's paints: ROPE_PAINT, SAIL_PAINT; THE SAIL BREATHES: its belly moves in and out along
  // the cloth's own normal by the clock, SAIL.breath m at the most at its middle, nothing at its edges)
  const breath = { value: 0 };
  wood.onBeforeCompile = (sh) => { sh.uniforms.uSailBreath = breath;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute vec4 aRope, aSail; varying vec4 vRope, vSail; uniform float uSailBreath;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vRope = aRope; vSail = aSail; transformed += normal * (aSail.w * uSailBreath);');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec4 vRope, vSail;\nfloat boatLine(float d, float w, float fw){ float ww = max(w, .5 * fw); return clamp((ww - d) / fw + .5, 0., 1.) * (w / ww); }')
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + ROPE_PAINT + SAIL_PAINT); };
  wood.customProgramCacheKey = () => 'our-boat-rope-sail';
  const mesh = new THREE.Mesh(boatGeometry(rng), wood);
  mesh.frustumCulled = false; mesh.name = 'our-boat';
  const object = new THREE.Group(); object.name = 'our-boat'; object.rotation.order = 'YXZ'; object.add(mesh);
  return { object, mesh,
    // point: the route's place (the eye's foot); tangent: the route's heading there; lift: the water's height at the
    // hull; time: the film's clock (the sail's breathing; left out, the sail stands still)
    place(point, tangent, lift, pitch, roll, time = 0) { object.position.set(point.x, lift, point.z); object.rotation.set(pitch, Math.atan2(-tangent.x, -tangent.z), roll);
      breath.value = SAIL.breath * (0.6 * Math.sin(time * 0.8) + 0.4 * Math.sin(time * 1.9 + 1.3)); } };
}

// ---- THE MACHINERY's one material and its builder: dark steel lit by the dome's fill and the lamp-sun's key from
// its own place (inside the shell only), vertex colours, lamps by emissive (aGlow; no three.js light).
// ALL THE HERO'S STEEL IS TWO DRAWS (steelWork, below): its bodies in one mesh, its thin round members in a second.
// A piece that moves (the lamp's drum and its carriage, the two panels' bogies, their wheels, the cable drums, the
// hung cables) is carried by a matrix of its own (aPart.x: which; uPart: the matrices, laid at every frame by the
// piece's own law, as its mesh's own matrix was). A THIN ROUND MEMBER carries its axis (aAxis: the centre of its
// section, w = its radius): it is never drawn under 1.5 pixels wide, AND IT CARRIES ONLY THE COVER IT TRULY HAS,
// its own width over the width drawn (vCover: the kit's wire's law, whole; no floor): far off it is a faint line
// and comes up as we near it. THE THIN MEMBERS ARE: the lamp's arc rail (chords, web, brackets), the gantry's and
// the portal frames' lattice legs, the scaffold towers, the decks' and catwalks' rails and posts, the work lamps'
// bars, the drums' frames and their cables, the hanging loops, the fly galleries' hangers, the four hung cables.
// (the boat's stays and ropes are true round bodies 12 mm thick in the boat's own mesh: never widened)
const STEEL_PARTS = 7 + 2 * (BEYOND.trucks.at[0].length + BEYOND.trucks.at[1].length) + BEYOND.hung.length;   // the fixed steel, the lamp's drum and carriage, two bogies, two cable drums; the wheels; the hung cables
const STEEL_VERT = /* glsl */`
attribute vec3 color; attribute vec4 aAxis; attribute vec2 aGlow, aPart;   // aGlow: strength, phase of its slow breathing; aPart: its piece, whose light it gives (0 the work lamps', 1 the lamp-sun's)
uniform mat4 uPart[${STEEL_PARTS}];
uniform float uPix, uTime, uGlowPhase; uniform vec3 uLamp;
varying vec3 vCol, vN, vW; varying float vGlow, vSun, vCover;
#include <fog_pars_vertex>
void main(){
  mat4 pm = uPart[int(aPart.x + .5)];
  vec3 p = position; vCover = 1.;
  #ifdef THIN
    vec4 cw = modelMatrix * (pm * vec4(aAxis.xyz, 1.)); float dist = length(cameraPosition - cw.xyz), have = max(aAxis.w, 1e-4);
    float want = max(have, .75 * uPix * dist / projectionMatrix[1][1]); p = aAxis.xyz + (position - aAxis.xyz) * (want / have); vCover = have / want;
  #endif
  vec4 wp = modelMatrix * (pm * vec4(p, 1.)); vW = wp.xyz; vN = normalize(mat3(modelMatrix) * (mat3(pm) * normal)); vCol = color;
  vGlow = aGlow.x * (.82 + .18 * sin(uTime * .9 + aGlow.y + uGlowPhase)); vSun = aPart.y;
  vec4 mvPosition = viewMatrix * wp; gl_Position = projectionMatrix * mvPosition;
  #include <fog_vertex>
}`;
const STEEL_FRAG = /* glsl */`
uniform vec3 uLamp, uLampCol, uFillCol, uGlowCol, uSunCol; uniform float uKey, uFill; uniform vec4 uFlood[3], uGapFrame;   // floodlamps: place, strength; the gap's frame: its middle on the face (x, z), its bearing's unit (x, z)
varying vec3 vCol, vN, vW; varying float vGlow, vSun, vCover;
${GLSL_BEYOND}
#include <fog_pars_fragment>
void main(){
  vec3 n = normalize(vN + 1e-5); if (!gl_FrontFacing) n = -n;
  vec3 L = uLamp - vW; float ld = max(length(L), 1.); L /= ld;
  float inside = 1. - step(${fl(SHELL.R - 0.3)}, length(vW));
  vec3 lit = uFillCol * uFill * (.6 + .4 * n.y) + uLampCol * uKey * 1.25 * max(dot(n, L), 0.);
  // BEYOND THE WALL no light of the dome's: a deep blue dark, the gantry's floodlamps (three places along their
  // row) and THE CATWALKS' ROWS OF WORK LAMPS, four lines of warm light along the channel (all falling off by distance)
  float fl = 0.;
  for (int i = 0; i < 3; i++) { vec3 d = uFlood[i].xyz - vW; float dd = max(dot(d, d), 1e-2);
    fl += uFlood[i].w * (.22 + .78 * max(dot(n, d * inversesqrt(dd)), 0.)) / (1. + dd / 420.); }
  vec2 gq = vW.xz - uGapFrame.xy, gth = vec2(-uGapFrame.w, uGapFrame.z); float gr = dot(gq, uGapFrame.zw), gt = dot(gq, gth), rows = 0.;
  vec2 ng = vec2(dot(n.xz, gth), n.y);                                             // the normal across the channel: (t, y)
  for (int i = 0; i < 4; i++) { vec2 lp = vec2(i < 2 ? ${fl(BEYOND.cat.t)} : ${fl(-BEYOND.cat.t)}, (i == 0 || i == 2) ? ${fl(BEYOND.cat.y[0])} : ${fl(BEYOND.cat.y[1])}) - vec2(gt, vW.y);
    float dd = max(dot(lp, lp), .25); rows += (.3 + .7 * max(dot(ng, lp) * inversesqrt(dd), 0.)) / (1. + dd / 150.); }
  rows *= smoothstep(2., 16., gr) * (1. - smoothstep(${fl(BEYOND.cat.r1)}, ${fl(BEYOND.cat.r1 + 60)}, gr));
  // and THE GALLERIES' LAMPS, a row at every cross joint up the dome (every ${fl(SHELL.joint)} m of arc): their warm light on the
  // steel behind the seam at every height, strongest by each gallery
  float arcP = asin(clamp(vW.y / max(length(vW), 1.), 0., 1.)) * ${fl(SHELL.R)}, dA = (fract(arcP / ${fl(SHELL.joint)} + .5) - .5) * ${fl(SHELL.joint)};
  float gal = (.22 + .5 * exp(-dA * dA / 70.)) * smoothstep(12., 40., arcP);
  lit = mix(vec3(.03, .06, .15) * (.7 + .3 * n.y) + uGlowCol * (fl + rows * .9 + gal), lit, inside);
  vec3 col = vCol * lit + mix(uGlowCol, uSunCol, vSun) * vGlow;
  // the backstage's own lit air takes its far things by the metres they stand behind the painted face
  float rb = max(length(vW.xz) - ${fl(SHELL.R)}, 0.) * (1. - inside);
  col = mix(col, beyondGlow(vW.y) * .5, (1. - exp(-rb / 210.)) * (1. - min(vGlow, 1.) * .7));
  gl_FragColor = vec4(col, vCover);                             // (a thin member's true cover; a body's is whole)
  #ifdef USE_FOG
    gl_FragColor.rgb = mix(gl_FragColor.rgb, fogColor, (1. - exp(-fogDensity * fogDensity * vFogDepth * vFogDepth)) * inside);   // (the dome's bright air ends at the wall)
  #endif
}`;
// a piece's steel as it is built: its bodies (B) and its thin round members (T) kept apart from the first
class Steel {
  constructor() { const set = () => ({ P: [], N: [], C: [], G: [], A: [] }); this.B = set(); this.T = set(); this.col = new THREE.Color('#2b2f36'); this.glow = [0, 0]; }
  color(hex, m = 1) { this.col.set(hex).multiplyScalar(m); return this; }
  tri(a, b, c, ax) { const u = _a.subVectors(b, a), v = _b.subVectors(c, a), n = _n.crossVectors(u, v).normalize(), s = ax ? this.T : this.B;
    for (const q of [a, b, c]) { s.P.push(q.x, q.y, q.z); s.N.push(n.x, n.y, n.z); s.C.push(this.col.r, this.col.g, this.col.b); s.G.push(this.glow[0], this.glow[1]);
      if (ax) { const k = ax[q === a ? 0 : q === b ? 1 : 2]; s.A.push(k.x, k.y, k.z, ax[3]); } } }
  quad(a, b, c, d, ax) { this.tri(a, b, c, ax && [ax[0], ax[1], ax[2], ax[4]]); this.tri(a, c, d, ax && [ax[0], ax[2], ax[3], ax[4]]); }
  // a box about c with half sizes along the unit axes ex, ey, ez
  box(c, ex, ey, ez, hx, hy, hz) { const v = (i, j, k) => c.clone().addScaledVector(ex, i * hx).addScaledVector(ey, j * hy).addScaledVector(ez, k * hz);
    const p = [v(-1, -1, -1), v(1, -1, -1), v(1, 1, -1), v(-1, 1, -1), v(-1, -1, 1), v(1, -1, 1), v(1, 1, 1), v(-1, 1, 1)];
    this.quad(p[1], p[0], p[3], p[2]); this.quad(p[4], p[5], p[6], p[7]); this.quad(p[3], p[7], p[6], p[2]); this.quad(p[0], p[1], p[5], p[4]); this.quad(p[5], p[1], p[2], p[6]); this.quad(p[0], p[4], p[7], p[3]); return this; }
  // a round member from a to b, radius r, n sides; thin = true: never drawn under a pixel and a half wide, with the cover it truly has
  tube(a, b, r, n = 6, thin = false) { const d = new THREE.Vector3().subVectors(b, a), u = Math.abs(d.y) > 0.9 * d.length() ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
    const e1 = new THREE.Vector3().crossVectors(u, d).normalize(), e2 = new THREE.Vector3().crossVectors(d, e1).normalize();
    const pt = (i, base) => { const an = (i / n) * 2 * Math.PI; return base.clone().addScaledVector(e1, Math.cos(an) * r).addScaledVector(e2, Math.sin(an) * r); };
    for (let i = 0; i < n; i++) this.quad(pt(i, a), pt(i + 1, a), pt(i + 1, b), pt(i, b), thin ? [a, a, b, b, r] : null); return this; }
  // a disc about c facing along ax (unit), radius r
  disc(c, ax, r, n = 20) { const u = Math.abs(ax.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0), e1 = new THREE.Vector3().crossVectors(u, ax).normalize(), e2 = new THREE.Vector3().crossVectors(ax, e1);
    const pt = (i) => { const an = (i / n) * 2 * Math.PI; return c.clone().addScaledVector(e1, Math.cos(an) * r).addScaledVector(e2, Math.sin(an) * r); };
    for (let i = 0; i < n; i++) this.tri(c, pt(i), pt(i + 1)); return this; }
  get triangles() { return (this.B.P.length + this.T.P.length) / 9; }
}
// (glowPhase: the sky's own dealt phase of its lamps' breathing, sky.clock.glow; the lamp-sun's own colour by look)
function steelMaterial(look, SU, glowPhase = 0) {
  const P = PAINTS[look], LL = LAMP_LIGHT[look];
  const uniforms = { ...THREE.UniformsUtils.clone(THREE.UniformsLib.fog), uLamp: SU.uLamp, uPix: { value: 2 / 720 }, uTime: { value: 0 }, uGlowPhase: { value: glowPhase },
    uPart: { value: Array.from({ length: STEEL_PARTS }, () => new THREE.Matrix4()) },
    uLampCol: { value: new THREE.Color().setRGB(LL.color[0], LL.color[1], LL.color[2]) }, uFillCol: { value: new THREE.Color(P.fill) }, uGlowCol: { value: new THREE.Color('#ffd6a0') }, uSunCol: { value: new THREE.Color(look ? '#ffb060' : '#ffe2ae') },
    uKey: { value: LL.key }, uFill: { value: LL.fill }, uFlood: { value: [0, 1, 2].map(() => new THREE.Vector4(0, 0, 0, 0)) }, uGapFrame: { value: new THREE.Vector4(0, 0, 0, -1) } };
  const body = new THREE.ShaderMaterial({ vertexShader: STEEL_VERT, fragmentShader: STEEL_FRAG, fog: true, side: THREE.DoubleSide, uniforms });
  // (the thin members' twin: the same law and the very same uniforms; see-through by its cover, its front faces
  // only, so that a member's round is laid once; it writes no depth and is drawn after every solid thing)
  body.userData.thin = new THREE.ShaderMaterial({ vertexShader: STEEL_VERT, fragmentShader: STEEL_FRAG, fog: true, side: THREE.FrontSide, uniforms, defines: { THIN: 1 }, transparent: true, depthWrite: false });
  return body;
}
// ALL THE HERO'S STEEL IN TWO MESHES. add(S, part, sun): a piece hands its steel in (part: the matrix that carries
// it, 0 the fixed steel; sun 1: its lamps give the lamp-sun's own colour); part(): a new moving piece's number;
// matrix(i): its matrix, in the sky's own frame; build(): the two meshes (bodies, thin members), made once.
function steelWork(look, SU, glowPhase) {
  const material = steelMaterial(look, SU, glowPhase), chunks = [], mats = material.uniforms.uPart.value; let parts = 1;
  const lay = (key) => { let n = 0; for (const c of chunks) n += c.S[key].P.length / 3;
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3), G = new Float32Array(n * 2), Q = new Float32Array(n * 2), A = key === 'T' ? new Float32Array(n * 4) : null; let o = 0;
    for (const c of chunks) { const s = c.S[key], k = s.P.length / 3; if (!k) continue;
      P.set(s.P, o * 3); N.set(s.N, o * 3); C.set(s.C, o * 3); G.set(s.G, o * 2); if (A) A.set(s.A, o * 4);
      if (c.part || c.sun) for (let i = o; i < o + k; i++) { Q[i * 2] = c.part; Q[i * 2 + 1] = c.sun; }
      o += k; }
    const g = new THREE.BufferGeometry(), at = (name, arr, size) => g.setAttribute(name, new THREE.BufferAttribute(arr, size));
    at('position', P, 3); at('normal', N, 3); at('color', C, 3); at('aGlow', G, 2); at('aPart', Q, 2); if (A) at('aAxis', A, 4);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), SHELL.R + BEYOND.outer + 400);
    const m = new THREE.Mesh(g, key === 'T' ? material.userData.thin : material); m.frustumCulled = false; return m; };
  return { material, triangles: 0,
    part() { if (parts >= STEEL_PARTS) throw new Error('sky-with-a-seam: more moving steel than STEEL_PARTS'); return parts++; },
    matrix: (i) => mats[i],
    add(S, part = 0, sun = 0) { chunks.push({ S, part, sun }); this.triangles += S.triangles; return this; },
    build() { const body = lay('B'), thin = lay('T'); body.name = 'the-steel'; thin.name = 'the-steel-thin-members'; thin.renderOrder = 2; return { body, thin }; } };
}

// ---- THE LAMP-SUN: a drum 26 m across with one plain lit face and a hoop of smaller lamps, in a yoke on a wheeled
// carriage on its arc rail (a thin dark arc across the southern dome). Emissive, in its own glare; it is no light.
const GLARE_VERT = /* glsl */`
uniform vec3 uAt, uAxis; uniform float uSize; varying vec2 vQ; varying float vFace;
void main(){
  vQ = position.xy; vec3 toEye = normalize(cameraPosition - uAt); vFace = dot(toEye, uAxis);
  // (the card stands on the sight line 45 hundredths of the way to the eye, drawn smaller by as much, so that the shell's curve never cuts it: said at the head)
  vec4 mv = viewMatrix * vec4(mix(uAt + uAxis * 2., cameraPosition, .45), 1.); mv.xy += position.xy * uSize * .55;
  gl_Position = projectionMatrix * mv;
}`;
const GLARE_FRAG = /* glsl */`
uniform vec3 uGlare; uniform float uTime, uFall; varying vec2 vQ; varying float vFace;
void main(){
  float r = length(vQ), f = clamp(vFace, 0., 1.);               // (the flat lit face's own facing to the eye: the cosine, as light does; none from behind)
  // A SOFT EVEN HALO, round, steady: a low bell over the drum (it never blows the lit face out) and a faint
  // wide breath beyond it; no ray, no patch, no flicker
  float halo = .42 * exp(-r * r * uFall * 2.2) + .15 * exp(-r * 5.);
  gl_FragColor = vec4(uGlare * halo * f * (1. - smoothstep(.7, 1., r)), 1.);
}`;
// how bright the lamp shows, by look (AFTERNOON, LOW SUN): its lit face and its hoop of lamps (shares of their
// emissive), its glare (strength, and how fast it falls off round the drum), its image and road on the sea. A SUN
// THAT CAN BE LOOKED AT: the lamp's glare is held to the drum's own neighbourhood, so that the plain bright disc,
// the hoop of small lamps, the carriage and rail and what stands under it are seen.
// (LOW SUN too: its amber glare stays round the drum, so the horizon and the sheds under it read through it)
// (A CLEAN THING WHEREVER IT IS SEEN: a plain bright round disc in a soft even halo; nothing about it blown)
const LAMP_SHOW = [{ face: 0.17, hoop: 0.3, glare: 0.5, fall: 13, sea: 0.3 }, { face: 0.32, hoop: 0.5, glare: 0.85, fall: 10, sea: 0.36 }];
SKY_PIECES.push(async (ctx, sky) => {
  const look = sky.look, SH = LAMP_SHOW[look], W = sky.steel, mat = W.material, V =(x, y, z) => new THREE.Vector3(x, y, z);
  const X = V(1, 0, 0), Y = V(0, 1, 0), Z = V(0, 0, 1);
  // the drum, in its own frame: its lit face looks along +Z
  const S = new Steel(), n = 28, rr = LAMP.drum, ring = (r, z, i) => V(Math.cos((i / n) * 2 * Math.PI) * r, Math.sin((i / n) * 2 * Math.PI) * r, z);
  S.color('#3a3f47');
  for (let i = 0; i < n; i++) { S.quad(ring(rr, -7, i), ring(rr, -7, i + 1), ring(rr, 0.4, i + 1), ring(rr, 0.4, i)); S.tri(V(0, 0, -9), ring(rr, -7, i + 1), ring(rr, -7, i)); }
  // ITS LIT FACE: ONE PLAIN DISC of even light (emissive), set a hand inside the drum's rim; nothing stepped or ringed
  S.color('#111111'); S.glow = [9 * SH.face, 0]; S.disc(V(0, 0, 0.1), Z, rr - 0.7, n);
  // the ring of smaller lamps on a hoop
  for (let j = 0; j < 12; j++) { const c = ring(16.4, -1.5, j * n / 12); S.glow = [0, 0]; S.color('#30343b'); S.tube(c.clone().setZ(-3.2), c.clone().setZ(-0.9), 1.75, 8);
    S.color('#111111'); S.glow = [5.5 * SH.hoop, j * 1.7]; S.disc(c.clone().setZ(-0.85), Z, 1.5, 10); }
  S.glow = [0, 0]; S.color('#30343b');
  for (let i = 0; i < 24; i++) { const a = ring(16.4, -2.4, i * n / 24), b = ring(16.4, -2.4, (i + 1) * n / 24); S.tube(a, b, 0.32, 4); if (i % 2 === 0) S.tube(ring(rr, -2.4, i * n / 24), a, 0.25, 4); }
  const pDrum = W.part(); W.add(S, pDrum, 1);                    // (a moving piece; its lit face and hoop give the lamp-sun's own colour)
  await ctx.yield();
  // the yoke and carriage, in the rail's frame: x along the rail, y out toward the shell, z across
  const Cg = new Steel(), back = LAMP.railR - LAMP.R; Cg.color('#262a31');
  for (const sd of [-1, 1]) { Cg.box(V(sd * 15.2, back / 2, 0), X, Y, Z, 0.7, back / 2 + 0.6, 0.9); Cg.box(V(sd * 12, back - 0.2, 0), X, Y, Z, 2.4, 1.1, 1.5);
    for (const w of [-1.6, 1.6]) Cg.tube(V(sd * 12 + w, back + 0.5, -1.2), V(sd * 12 + w, back + 0.5, 1.2), 0.75, 8); }
  Cg.box(V(0, back - 1.6, 0), X, Y, Z, 15.9, 0.55, 1.1); Cg.tube(V(-15.2, 0, 0), V(-13.2, 0, 0), 0.6, 6); Cg.tube(V(13.2, 0, 0), V(15.2, 0, 0), 0.6, 6);
  const pCar = W.part(); W.add(Cg, pCar);
  await ctx.yield();
  // THE ARC RAIL (fixed), A BUILT THING FIXED TO THE SKY, whole from end to end. IT STANDS ONLY WHERE THE LAMP WORKS
  // IT: from the sea in the west, up past the lamp's two places, to a buffer frame ON THE WALL RAIL.up rad beyond
  // the afternoon place (some 60 m up, in the south-west). Over the south and the south-east, where it could only be
  // seen as a stray line across the painted sky, there is no rail (left out by place, on every seed, at every metre).
  // A lattice girder (two chords RAIL.half m either side of the rail's circle, a web of crossed diagonals between
  // them: an X in every bay) carried
  // on WALL BRACKETS at even steps, each a shelf bracket as on any wall: two arms from a plate on the painted wall
  // behind the rail, a post RAIL.reach m down the wall to a second plate, a brace from that up to the girder. Over
  // its last RAIL.land rad the girder closes on the wall itself.
  const Rg = new Steel(), hang = LOOK_ANG[1]; let end = hang; while (railDir(end + 0.01).y > 0 && end < 1.2) end += 0.01;
  const RAIL = { half: 1.1, reach: 9, every: 6, step: 0.012, land: 0.12, up: 0.42 }, nrmR = railNormal(new THREE.Vector3()), dn = nrmR.y > 0 ? -1 : 1;
  const a0 = -RAIL.up, steps = Math.ceil((end - a0) / RAIL.step), wallR = SHELL.R - 0.4;
  const radAt = (a) => lerp(LAMP.railR, wallR - 0.5, Math.pow(clamp((a0 + RAIL.land - a) / RAIL.land, 0, 1), 2));      // (the last stretch closes on the wall)
  const chord = (a, sd, out = new THREE.Vector3()) => railDir(a, out).multiplyScalar(radAt(a)).addScaledVector(nrmR, sd * RAIL.half);
  const plate = (a, sd, out = new THREE.Vector3()) => railDir(a, out).multiplyScalar(wallR).addScaledVector(nrmR, sd * RAIL.reach).setLength(wallR);
  for (let i = 0; i < steps; i++) { const a = a0 + (end - a0) * i / steps, b = a0 + (end - a0) * (i + 1) / steps;
    if (i % 30 === 29) await ctx.yield();
    Rg.color('#343941'); for (const sd of [-1, 1]) Rg.tube(chord(a, sd), chord(b, sd), 0.34, 5, true);
    Rg.color('#3d424b'); Rg.tube(chord(a, 1), chord(b, -1), 0.16, 4, true); Rg.tube(chord(a, -1), chord(b, 1), 0.16, 4, true);   // the web: crossed
    if (i % RAIL.every === 0 && radAt(a) < LAMP.railR + 4) { Rg.color('#444a54');
      const w0 = railDir(a).multiplyScalar(wallR), w1 = plate(a, dn), t = railDir(a + 0.001).sub(railDir(a)).normalize();
      Rg.tube(w0, chord(a, dn), 0.3, 4, true); Rg.tube(w0, chord(a, -dn), 0.3, 4, true); Rg.tube(w1, chord(a, dn), 0.26, 4, true); Rg.tube(w0, w1, 0.24, 4, true);
      for (const w of [w0, w1]) { const o = w.clone().normalize(), s = new THREE.Vector3().crossVectors(o, t); Rg.box(w.clone(), t, o, s, 0.9, 0.3, 0.9); } } }
  { const w = railDir(a0).multiplyScalar(wallR - 0.6), o = w.clone().normalize(), t = railDir(a0 + 0.001).sub(railDir(a0)).normalize(), s = new THREE.Vector3().crossVectors(o, t);
    Rg.color('#2c3038'); Rg.box(w.clone(), t, o, s, 0.5, 0.6, 2.6); Rg.box(w.clone().addScaledVector(t, -0.9), t, o, s, 0.4, 0.5, 3.4); }      // the buffer frame on the wall
  W.add(Rg);
  await ctx.yield();
  // the glare: light in the eye (THE LAMP'S GLARE, at the head): a card on the sight line, its strength by the lit face's own facing
  const GU = { uAt: { value: new THREE.Vector3() }, uAxis: { value: new THREE.Vector3(0, 0, 1) }, uSize: { value: 95 }, uTime: { value: 0 },
    uGlare: { value: new THREE.Color(look ? '#ff9a48' : '#ffe4b2').multiplyScalar(SH.glare) }, uFall: { value: SH.fall } };
  const gg = new THREE.BufferGeometry(); gg.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0], 3)); gg.setIndex([0, 1, 2, 0, 2, 3]);
  const glare = new THREE.Mesh(gg, new THREE.ShaderMaterial({ uniforms: GU, vertexShader: GLARE_VERT, fragmentShader: GLARE_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  glare.frustumCulled = false; glare.renderOrder = 4; glare.name = 'lamp-glare';
  sky.object.add(glare);
  const tng = new THREE.Vector3(), out = new THREE.Vector3(), nrm = new THREE.Vector3(), size = new THREE.Vector2(), UP = new THREE.Vector3(0, 1, 0);
  sky.lampParts = { drum: pDrum, carriage: pCar, glare, material: mat, triangles: S.triangles + Cg.triangles + Rg.triangles };   // (drum, carriage: the pieces' numbers in the steel)
  sky.parts.push({ update(dt, time) {
    W.matrix(pDrum).identity().lookAt(sky.opts.beamAim, sky.lamp, UP).setPosition(sky.lamp);        // the drum at the lamp's place, its lit face (+Z) to its aim
    // the carriage's frame at the lamp's place on the rail: x = the rail's tangent, y = out to the shell
    out.copy(sky.lamp).normalize(); railNormal(nrm); tng.crossVectors(nrm, out).normalize();
    W.matrix(pCar).makeBasis(tng, out, nrm).setPosition(sky.lamp);
    GU.uAt.value.copy(sky.lamp); GU.uAxis.value.copy(sky.opts.beamAim).sub(sky.lamp).normalize(); GU.uTime.value = time;
    mat.uniforms.uTime.value = time;
    if (ctx.renderer) { ctx.renderer.getDrawingBufferSize(size); mat.uniforms.uPix.value = 2 / Math.max(size.y, 1); }
  } });
});

// ---- THE TWO PANELS' RAILS AND BOGIES, AND THE DARK BEYOND: the shell's ribs, a floodlit gantry, cable drums.
// Places are given in the gap's own frame: r metres out behind the painted face, y up, t along the wall (clockwise).
SKY_PIECES.push(async (ctx, sky) => {
  const look = sky.look, gb = sky.gap.bearing, mat = sky.steel.material, step = 360 / SHELL.gores;
  const o = wallPoint(gb, 0, 0), rh = dirOf(gb), th = dirOf(gb + 90), Y = new THREE.Vector3(0, 1, 0);
  const at = (r, y, t) => o.clone().addScaledVector(rh, r).addScaledVector(th, t).setY(y);
  mat.uniforms.uGapFrame.value.set(o.x, o.z, rh.x, rh.z);
  const S = new Steel();
  // the two rails the panels ride: one on a sill at the water, one far up (RAILS.top), each along the wall's curve
  const railAt = (b, arc, inset, out = new THREE.Vector3()) => wallPoint(b, arc, inset, out);
  // (both lie ON THE WALL'S FACE, under the proud panels. THE UPPER RAIL NEVER CROSSES THE SEAM: it stands either
  // hand of the two gores' own place only, the same girder that shows on the wall there; nothing level spans the seam
  // before the painted face)
  for (const arc of [RAILS.foot, RAILS.top]) for (let i = -11; i < 11; i++) { const b0 = gb + i * step * 0.25, b1 = b0 + step * 0.25;
    if (arc > 1 && i >= -4 && i < 4) continue;
    const ins = arc > 1 ? 0.17 : SEAM.proud[1] + BEYOND.trucks.out / 2;      // (the foot rail lies under the trucks, before the panels' feet; the upper one is a flat girder on the face, under the left panel's thin plate)
    if (arc < 1) { S.color('#15171b'); S.tube(railAt(b0, arc, ins), railAt(b1, arc, ins), 0.22, 5, false); }   // (the sunk foot rail is not widened: it stays under the water)
    S.color(arc > 1 ? '#5b6068' : '#2a2d33'); const c = railAt((b0 + b1) / 2, arc - (arc > 1 ? 1.35 : 0.55), ins), tt = dirOf((b0 + b1) / 2 + 90), rr = dirOf((b0 + b1) / 2);
    S.box(c, tt, Y, rr, SHELL.R * step * 0.25 * RAD / 2, arc > 1 ? 1.1 : 0.3, arc > 1 ? 0.14 : 0.9); }
  // THE SHELL'S RIBS behind the seams near the gap (none behind the parted seam itself; the two that flank it run far
  // up), and THE GALLERIES: a ring girder at every cross joint up the whole height of the seam, each with its row of
  // work lamps (emissive bars: no light is made), so that the seam is lit from the water to where it closes
  const FR = SEAM.frame;
  for (let k = -4; k <= 4; k++) { if (k === 0) continue;
    for (let a = 0; a < (Math.abs(k) === 1 ? 450 : 150); a += 15) { const b = gb + k * step, lit = 0.5 + 0.9 * Math.exp(-Math.abs(k) / 2.2) * (0.35 + 0.65 * Math.exp(-a / 90));
      S.color('#70757e', lit); const rb = -(FR + BEYOND.ribBack), c = wallPoint(b, a + 7.5, rb), up = wallPoint(b, a + 15, rb).sub(wallPoint(b, a, rb)).normalize(), rr = dirOf(b), tt = dirOf(b + 90);
      S.box(c, tt, up, rr, 0.35, 7.6, BEYOND.ribHalf); } }
  await ctx.yield();
  for (let a = 30; a <= SEAM.top - 30; a += 30) { const n = a <= 120 ? 8 : 3, ce = Math.cos(a / SHELL.R);
    for (let i = -n; i < n; i++) { const b0 = gb + i * step * 0.5, b1 = b0 + step * 0.5, lit = 0.5 + 0.8 * Math.exp(-Math.abs(i + 0.5) / 4.5) * (0.4 + 0.6 * Math.exp(-a / 90));
      S.color('#666b74', lit); const c = wallPoint((b0 + b1) / 2, a, -(FR + 3.2)), tt = dirOf((b0 + b1) / 2 + 90), rr = dirOf((b0 + b1) / 2);
      S.box(c, tt, Y, rr, SHELL.R * step * 0.5 * RAD / 2 * ce, 0.55, 1.0); }
    for (let j = -3; j <= 3; j++) { const b = gb + ((j * 8.5 + (a % 60 ? 0 : 4.2)) / SHELL.R) / RAD, d = (1.1 / SHELL.R) / RAD;
      S.color('#111111'); S.glow = [3.6, a * 0.37 + j * 1.9]; S.tube(wallPoint(b - d, a - 1.2, -(FR + 2.3)), wallPoint(b + d, a - 1.2, -(FR + 2.3)), 0.22, 5, true); S.glow = [0, 0]; } }
  await ctx.yield();
  // the decks either side of the channel, their edges lit (10 m and more behind the face: the wall curves 6.7 m
  // toward a flat deck's far end)
  const DK = BEYOND.deck;
  for (const sd of [-1, 1]) { S.color('#7a7d80'); S.box(at((DK.r0 + DK.r1) / 2, DK.top - 0.45, sd * (DK.t0 + DK.t1) / 2), th, Y, rh, (DK.t1 - DK.t0) / 2, 0.45, (DK.r1 - DK.r0) / 2);
    S.color('#d0b256'); S.box(at((DK.r0 + DK.r1) / 2, DK.top + 0.05, sd * (DK.t0 + 0.4)), th, Y, rh, 0.25, 0.08, (DK.r1 - DK.r0) / 2);
    for (let i = 0; i < 12; i++) { S.color('#3c3e42'); S.tube(at(DK.r0 + 2 + i * 6, DK.top, sd * (DK.t0 + 0.2)), at(DK.r0 + 2 + i * 6, DK.rail, sd * (DK.t0 + 0.2)), 0.05, 4, true); }           // the deck's rail posts
    S.color('#b9a45c'); S.tube(at(DK.r0 + 2, DK.rail, sd * (DK.t0 + 0.2)), at(DK.r1 - 2, DK.rail, sd * (DK.t0 + 0.2)), 0.05, 4, true); }
  // the gantry: two lattice legs and a bridge 38 m up, a row of floodlamps under the bridge (emissive, breathing by the clock)
  const gr = BEYOND.gantry.r, legT = BEYOND.gantry.legT, top = BEYOND.gantry.top;
  for (const sd of [-1, 1]) for (const dr of [-3, 3]) for (const dt of [-3, 3]) { S.color('#c09a3c'); S.tube(at(gr + dr, 1.2, sd * legT + dt), at(gr + dr * 0.5, top, sd * legT + dt * 0.5), 0.28, 5, true); }
  // (every bay of each leg CROSS-BRACED ON EVERY FACE: both diagonals, a plain X, never one turned about bay by bay)
  for (const sd of [-1, 1]) for (let j = 0; j < 6; j++) { const k0 = 1 - 0.5 * j / 6, k1 = 1 - 0.5 * (j + 1) / 6, y0 = lerp(1.2, top, j / 6), y1 = lerp(1.2, top, (j + 1) / 6);
    const cg = (q, y, k) => at(gr + q[0] * 3 * k, y, sd * legT + q[1] * 3 * k), FC = [[-1, -1], [1, -1], [1, 1], [-1, 1]]; S.color('#a8862f');
    for (let q = 0; q < 4; q++) { const a = FC[q], b = FC[(q + 1) % 4]; S.tube(cg(a, y0, k0), cg(b, y1, k1), 0.16, 4, true); S.tube(cg(b, y0, k0), cg(a, y1, k1), 0.16, 4, true); } }
  S.color('#c09a3c'); S.box(at(gr, top + 1.3, 0), th, Y, rh, legT + 5, 1.3, 1.6);
  for (let j = 0; j < 9; j++) { const t = (j - 4) * 5.6; S.glow = [0, 0]; S.color('#2c2c2c'); S.box(at(gr - 1.9, top - 0.7, t), th, Y, rh, 1.4, 0.9, 0.5);
    S.color('#111111'); S.glow = [5.2, j * 2.1]; const c = at(gr - 2.45, top - 0.7, t), p = (a, b) => c.clone().addScaledVector(th, a * 1.2).addScaledVector(Y, b * 0.72); S.quad(p(-1, -1), p(1, -1), p(1, 1), p(-1, 1)); }
  S.glow = [0, 0];
  [-18, 0, 18].forEach((t, i) => { const p = at(gr - 5, top - 2, t); mat.uniforms.uFlood.value[i].set(p.x, p.y, p.z, 6); });       // the floodlamps' light (the steel's law)
  // far work lamps out in the dark, each a small lit face (points of light that give the dark its depth)
  // (how many are lit is dealt: opts.density, and the machine's detail; each draws its own dice in a fixed order,
  // so a lamp that stands in two deals stands in the same place)
  const far = ctx.core.makeRng(ctx.core.hashSeed('lamps-beyond:' + ctx.seed));
  const lampsLit = Math.max(6, Math.min(28, Math.round(16 * (sky.opts.density || 1) * (sky.opts.detail || 1))));
  for (let j = 0; j < lampsLit; j++) { const r = 120 + 260 * far(), t = (far() * 2 - 1) * (60 + r * 0.5), y = 6 + 30 * far(), c = at(r, y, t), w = 0.9 + r / 260;
    S.color('#111111'); S.glow = [2.2 + 2 * far(), far() * 6.28]; const p = (a, b) => c.clone().addScaledVector(th, a * w).addScaledVector(Y, b * w * 0.6); S.quad(p(-1, -1), p(1, -1), p(1, 1), p(-1, 1)); }
  S.glow = [0, 0];
  sky.steel.add(S);
  sky.beyond = { material: mat, at, triangles: S.triangles };   // (the steel's one material: its clock and its pixel are kept by the lamp's piece)
});

// ---- WHAT WORKS AT THE WAY OUT: the panels' bogies (their wheels turn as the panels roll), two cable drums turning
// and four hung cables swaying BY THE CLOCK, at every metre alike.
SKY_PIECES.push((ctx, sky) => {
  const gb = sky.gap.bearing, step = 360 / SHELL.gores, at = sky.beyond.at, back = SEAM.frame, TRUCK = BEYOND.trucks, Y = new THREE.Vector3(0, 1, 0);
  const V = (x, y, z) => new THREE.Vector3(x, y, z), X = V(1, 0, 0), Z = V(0, 0, 1);
  // one wheel (axle along its own z): an eight-sided tyre with a pale spoke bar, so that its turning shows
  const Wg = new Steel(); Wg.color('#1b1d21'); Wg.tube(V(0, 0, -0.22), V(0, 0, 0.22), 0.62, 8);
  Wg.disc(V(0, 0, 0.22), Z, 0.62, 8); Wg.disc(V(0, 0, -0.22), V(0, 0, -1), 0.62, 8); Wg.color('#8a8474', 1.6); Wg.box(V(0, 0, 0.25), X, Y, Z, 0.56, 0.1, 0.02); Wg.box(V(0, 0, -0.25), X, Y, Z, 0.56, 0.1, 0.02);
  const W = sky.steel, wheels = [], doorGroups = [];
  for (const sd of [-1, 1]) {
    const S = new Steel(), pr = SEAM.proud[sd < 0 ? 0 : 1], pDoor = W.part();      // (the bogies go with their panel: one moving piece a side)
    // (a place d metres into the panel from its meeting edge's plumb line, in the panel's HOME: its bearing)
    const bIn = (d) => gb + ((SEAM.off + sd * d) / SHELL.R) / RAD;
    // THE TRUCKS: two under each panel's foot, their frames PROUD of the skin at the waterline (dark steel, a pale
    // top plate), their wheels awash on the sunk foot rail; TRUCK.at metres in from the meeting edge
    for (const d of TRUCK.at[sd < 0 ? 0 : 1]) { const b = bIn(d), dp = TRUCK.out / 2, c = wallPoint(b, RAILS.foot + 0.68, pr + dp), tt = dirOf(b + 90), rr = dirOf(b);
      S.color('#2e3138', 1.2); S.box(wallPoint(b, TRUCK.top / 2 - 0.1, pr + dp), tt, Y, rr, TRUCK.half, TRUCK.top / 2 - 0.1, dp);
      S.color('#8a8474', 1.3); S.box(wallPoint(b, TRUCK.top - 0.1, pr + dp), tt, Y, rr, TRUCK.half + 0.15, 0.1, dp + 0.08);
      for (const w of [-1.5, 1.5]) { const part = W.part(); W.add(Wg, part);            // (a wheel: its hub's place and frame on the bogie, its own turn about its axle)
        wheels.push({ part, sd, door: pDoor, hub: new THREE.Matrix4().makeBasis(tt, Y, rr).setPosition(c.clone().addScaledVector(tt, w)) }); } }
    // the panel's back frame, where its edge stands in the opening: a steel edge post a hand wide
    // (a stile 0.6 m wide ON THE PANEL'S BACK, wholly within the panel's own span: nothing of it stands in the opening)
    // THE PANEL'S THICKNESS AND ITS STEEL BACK, shown at its edge: the edge beam (pale steel that takes the
    // floodlamps' gold) and, behind the plate, the ends of its back stiffeners every 7.5 m up, a comb along the edge
    // (now the panel stands BEFORE the face: its thickness shows as a pale steel edge from its skin back to the wall,
    // along its meeting edge, plumb and then raking with the cut, and along its outer edge where it laps its neighbour)
    const rwAt = (a) => SHELL.R * Math.cos(Math.max(a, 0) / SHELL.R);
    const edgeIn = (a, out) => wallPoint(gb + ((SEAM.off * rwAt(a) / SHELL.R + sd * (0.32 - seamRake(sd, a))) / rwAt(a)) / RAD, a, pr / 2 + 0.05, out);
    const edgeOut = (a, out) => wallPoint(gb + sd * (step - (0.32 / rwAt(a)) / RAD), a, pr / 2 + 0.05, out);
    for (const [edge, top, hex] of [[edgeIn, sd < 0 ? 450 : 345, '#8b9099'], [edgeOut, 300, '#7c818a']]) { S.color(hex);
      for (let a = 0; a < top; a += 15) { const p0 = edge(a, new THREE.Vector3()), p1 = edge(a + 15, new THREE.Vector3()), c = p0.clone().lerp(p1, 0.5), bb = bearingOf(c.x, c.z);
        S.box(c, dirOf(bb + 90), p1.clone().sub(p0).normalize(), dirOf(bb), 0.3, p0.distanceTo(p1) / 2 + 0.05, pr / 2 - 0.05); } }
    W.add(S, pDoor); doorGroups.push({ part: pDoor, sd });
  }
  // the cable drums on the decks, turning by the clock; their frames stand still
  const Dg = new Steel(); Dg.color('#8d8672'); Dg.tube(V(0, 0, -2.2), V(0, 0, 2.2), 1.7, 10);
  for (const z of [-2.3, 2.3]) { Dg.color('#b3542c'); Dg.tube(V(0, 0, z - 0.12), V(0, 0, z + 0.12), 2.5, 10); Dg.disc(V(0, 0, z + Math.sign(z) * 0.12), V(0, 0, Math.sign(z)), 2.5, 10);
    Dg.color('#c9b98a', 1.7); Dg.box(V(0, 0, z + Math.sign(z) * 0.15), X, Y, Z, 2.3, 0.22, 0.03); Dg.box(V(0, 0, z + Math.sign(z) * 0.15), Y, X, Z, 2.3, 0.22, 0.03); }
  const drums = [], Fs = new Steel(), th = dirOf(gb + 90), rh = dirOf(gb);
  for (const sd of [-1, 1]) { const DR = BEYOND.drums, c = at(DR.r, DR.y, sd * DR.t), part = W.part(); W.add(Dg, part);
    drums.push({ part, sd, hub: new THREE.Matrix4().makeBasis(rh, Y, th.clone().multiplyScalar(-1)).setPosition(c) });
    Fs.color('#9a8f70'); for (const z of [-2.9, 2.9]) for (const x of [-1.6, 1.6]) Fs.tube(at(DR.r + x, 1.2, sd * DR.t + z), at(DR.r, DR.y, sd * DR.t + z), 0.2, 4, true);
    // the cable from the drum up to the upper rail's sheave
    Fs.color('#8d8672', 1.5); Fs.tube(at(DR.r, DR.y + 1.7, sd * DR.t), wallPoint(gb + sd * step * 0.72, RAILS.top - 1.5, -(back + 2.2)), 0.07, 4, true); }
  W.add(Fs);
  // four hung cables with a weight, swaying
  const hung = [];
  BEYOND.hung.forEach(([f, r], i) => { const ph = sky.clock.hung[i];            // (its sway's dealt phase, this sky's own)
    const topP = wallPoint(gb + f * step, RAILS.top - 2, -(back + r)), L = topP.y - (15 + 4 * (i % 2)), S = new Steel();
    S.color('#9a927c', 1.5); S.tube(V(0, 0, 0), V(0, -L, 0), 0.06, 4, true); S.color('#5c5648', 1.5); S.box(V(0, -L - 0.8, 0), X, Y, Z, 0.55, 0.8, 0.55);
    const part = W.part(); W.add(S, part); hung.push({ part, topP, ph, L }); });
  sky.works = { wheels, drums, hung, doorGroups };              // (each a moving piece of the steel: its number, and what its law needs)
  const turn = new THREE.Matrix4(), sway = new THREE.Euler();
  sky.parts.push({ update(dt, time, camera, half) {
    for (const d of doorGroups) W.matrix(d.part).makeRotationY(-(d.sd * half - SEAM.off) / SHELL.R);      // (with its panel, from its home)
    for (const w of wheels) W.matrix(w.part).copy(W.matrix(w.door)).multiply(w.hub).multiply(turn.makeRotationZ(-w.sd * half / 0.62));   // rolling without slip on the foot rail
    for (const d of drums) W.matrix(d.part).copy(d.hub).multiply(turn.makeRotationZ(d.sd * (time * 0.22 + sky.clock.drums)));
    for (const h of hung) { sway.set(0.016 * Math.sin(time * 2 * Math.PI / (2.0 * Math.sqrt(h.L)) * 1.0 + h.ph), 0, 0.011 * Math.sin(time * 2 * Math.PI / (2.0 * Math.sqrt(h.L)) * 0.83 + h.ph * 1.7));
      W.matrix(h.part).makeRotationFromEuler(sway).setPosition(h.topP); }
  } });
});

// ---- THE BACKSTAGE, deep behind the opening (BEYOND.frames, .cat, .towers, .outer): A LIT PLACE WITH DEPTH IN IT,
// seen from across the bay as the warm light in the parted SEAM, a rising line of gold. Portal frames across the channel receding in a
// row, catwalks either side at two levels with a work lamp every 12 m, scaffold towers, hanging loops of cable,
// and the far wall of ribs and ring beams in the lamps' gold under a deep blue dark. All of it stands behind the
// ring's own plane (see BEYOND: nothing of it can cross a sight line to the ring); its lamps are emissive bars (no
// three.js light), straight and small (nothing ring-shaped, no double of the ring).
SKY_PIECES.push(async (ctx, sky) => {
  const at = sky.beyond.at, S = new Steel(), F = BEYOND.frames, CW = BEYOND.cat;
  // a work lamp: a short bright bar from a to b in a dark hood, 0.44 m thick; A THIN MEMBER by the steel's law (never
  // drawn under a pixel and a half wide, AND CARRYING ONLY THE COVER IT TRULY HAS, its own width over the width
  // drawn, its light with it: far off a faint line that comes up as we near it; no floor)
  const bar = (a, b, g, ph) => { S.color('#111111'); S.glow = [g, ph]; S.tube(a, b, 0.22, 5, true); S.glow = [0, 0]; };
  // a lattice post: four chords from y0 to y1 about (r, t), half metres square at its foot and half * taper at its
  // head; EVERY BAY CROSS-BRACED ON EVERY FACE (both diagonals, and a level strut at the bay's head): a plain X in
  // each bay, never a diagonal turned about bay by bay
  const FACES = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const lattice = (r, t, y0, y1, half, taper, bays, hex) => { const c = (i, j, f) => at(r + i * half * lerp(1, taper, f), lerp(y0, y1, f), t + j * half * lerp(1, taper, f));
    S.color(hex); for (const i of [-1, 1]) for (const j of [-1, 1]) S.tube(c(i, j, 0), c(i, j, 1), 0.2, 4, true);
    S.color(hex, 0.8); for (let k = 0; k < bays; k++) { const f0 = k / bays, f1 = (k + 1) / bays;
      for (let q = 0; q < 4; q++) { const a = FACES[q], b = FACES[(q + 1) % 4];
        S.tube(c(a[0], a[1], f0), c(b[0], b[1], f1), 0.12, 4, true); S.tube(c(b[0], b[1], f0), c(a[0], a[1], f1), 0.12, 4, true);
        S.tube(c(a[0], a[1], f1), c(b[0], b[1], f1), 0.1, 4, true); } } };
  // THE PORTAL FRAMES: two lattice legs standing in the water and a box beam over the channel, a row of lamps under it
  for (let k = 0; k < F.r.length; k++) { const r = F.r[k]; if (k) await ctx.yield();
    for (const sd of [-1, 1]) lattice(r, sd * F.legT, -0.6, F.top, F.half, 0.6, 6, k % 2 ? '#b08a36' : '#a9853a');
    S.color('#b8923c'); S.box(at(r, F.top + 1.2, 0), dirOf(sky.gap.bearing + 90), new THREE.Vector3(0, 1, 0), dirOf(sky.gap.bearing), F.legT + 4, 1.2, 1.5);
    for (let j = -3; j <= 3; j++) bar(at(r - 1.7, F.top - 0.4, j * 8 - 1.1), at(r - 1.7, F.top - 0.4, j * 8 + 1.1), 4.2, k * 1.3 + j * 2.1);
  }
  await ctx.yield();
  // THE CATWALKS: either side of the channel at two levels, from just behind the decks' near end deep into the
  // dark: a deck, a hand rail, posts every 24 m, and under each deck's channel edge a work lamp every 12 m
  const TH = dirOf(sky.gap.bearing + 90), RH = dirOf(sky.gap.bearing), Y = new THREE.Vector3(0, 1, 0), mid = (CW.r0 + CW.r1) / 2, hl = (CW.r1 - CW.r0) / 2;
  for (const sd of [-1, 1]) for (const y of CW.y) {
    S.color('#6e6a60'); S.box(at(mid, y, sd * CW.t), RH, Y, TH, hl, 0.12, CW.half);
    S.color('#9a8c62'); for (const e of [-1, 1]) S.tube(at(CW.r0, y + 1.1, sd * CW.t + e * CW.half), at(CW.r1, y + 1.1, sd * CW.t + e * CW.half), 0.05, 4, true);
    for (let r = CW.r0; r <= CW.r1 + 0.1; r += CW.every) bar(at(r - 0.9, y - 0.4, sd * (CW.t - CW.half + 0.15)), at(r + 0.9, y - 0.4, sd * (CW.t - CW.half + 0.15)), 3.6, r * 0.37 + y);
  }
  for (const sd of [-1, 1]) for (let r = CW.r0; r <= CW.r1 + 0.1; r += CW.every * 2) { S.color('#5f5a4e');
    S.tube(at(r, r < BEYOND.deck.r1 ? BEYOND.deck.top : -0.6, sd * (CW.t + CW.half - 0.1)), at(r, CW.y[1] + 1.1, sd * (CW.t + CW.half - 0.1)), 0.11, 4, true); }
  sky.steel.add(S); sky.backstage = { meshes: [], triangles: S.triangles };
});
// the backstage's far wall: sheeting in bays between ribs (24 m apart) and ring beams (18 m apart), in the lamps'
// gold low down and a deep blue dark above; a work lamp and its pool of light in some of the lower bays. All its
// pattern is filtered by the pixel's footprint; no bright air stands before it.
const BACK_VERT = /* glsl */`
varying vec3 vW;
void main(){ vec4 wp = modelMatrix * vec4(position, 1.); vW = wp.xyz; gl_Position = projectionMatrix * viewMatrix * wp; }`;
const BACK_FRAG = /* glsl */`
varying vec3 vW; uniform float uTime, uGapAz;
${GLSL_NOISE}
${GLSL_BEYOND}
${GLSL_FILTER}
void main(){
  float y = vW.y, rw = length(vW.xz), az = mod(atan(vW.x, -vW.z + 1e-6) - uGapAz + 3.14159265, 6.2831853) - 3.14159265, su = az * rw;
  float fw = max(length(fwidth(vec2(su, y))), 1e-3), bx = su / 24., by = y / 18.; vec2 id = vec2(floor(bx), floor(by));
  vec3 glow = beyondGlow(y), col = glow * mix(.925, .55 + .75 * h21(id + 7.3), resc(18., fw));   // (a bay's own tone: its middle where a pixel is a bay tall)
  // a work lamp high in some of the lower bays, its pool of light on the sheeting under it
  float has = step(.56, h21(id + 31.7)), ph = h21(id + 3.1) * 6.2831853; vec2 q = vec2((fract(bx) - .5) * 24., (fract(by) - .8) * 18.);
  float pool = exp(-length(q * vec2(1., q.y > 0. ? 2.4 : .55)) / 4.6), rad = max(.75, 1.4 * fw), dot1 = 1. - smoothstep(rad * .55, rad, length(q));
  // (the lamp's dot is drawn 1.4 pixels across at the least and keeps its true cover by area: its own round over the round drawn)
  col += vec3(1., .62, .26) * has * (pool * .5 + dot1 * 2.6 * (.75 / rad) * (.75 / rad)) * (.86 + .14 * sin(uTime * .8 + ph));
  // the ribs and the ring beams: dark steel before the lit sheeting, a lit flange on each
  // (each keeps its true cover and ends in its own mean: its width over the 24 m between ribs, the 18 m between beams)
  float dx = abs(fract(bx + .5) - .5) * 24., dy = (fract(by + .5) - .5) * 18., steel = uni(lnP(dx, .9, 24., fw), lnP(abs(dy), .7, 18., fw));
  col = mix(col, glow * .1 + vec3(.003, .006, .016), steel * .9);
  col += vec3(1., .6, .24) * .3 * glow.r * (lnP(abs(dx - 1.1), .16, 12., fw) + lnP(abs(dy + .9), .14, 18., fw));
  gl_FragColor = vec4(col, 1.);
}`;
SKY_PIECES.push(async (ctx, sky) => {
  const at = sky.beyond.at, gb = sky.gap.bearing, step = 360 / SHELL.gores, S = new Steel(), F = BEYOND.frames;
  const TH = dirOf(gb + 90), RH = dirOf(gb), Y = new THREE.Vector3(0, 1, 0);
  const bar = (a, b, g, ph) => { S.color('#111111'); S.glow = [g, ph]; S.tube(a, b, 0.22, 5, true); S.glow = [0, 0]; };
  // THE SCAFFOLD TOWERS (BEYOND.towers: r, t, height), on the decks and out in the water: four standards, a ledger
  // ring every 8 m, EVERY BAY CROSS-BRACED ON EVERY FACE (both diagonals: a plain X in each bay, never a diagonal
  // turned about bay by bay), a boarded top with a rail, lamps
  const FACES = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  for (let k = 0; k < BEYOND.towers.length; k++) { const [r, t, h] = BEYOND.towers[k]; if (k % 2 === 1) await ctx.yield();
    const sg = t < 0 ? 1 : -1, y0 = r < BEYOND.deck.r1 && Math.abs(t) < BEYOND.deck.t1 ? BEYOND.deck.top : -0.6, n = Math.round(h / 8), hf = 2.6;
    const c = (i, j, f) => at(r + i * hf, lerp(y0, h, f), t + j * hf);
    S.color('#8f8468'); for (const i of [-1, 1]) for (const j of [-1, 1]) S.tube(c(i, j, 0), c(i, j, 1), 0.1, 4, true);
    for (let m = 1; m <= n; m++) { const f0 = (m - 1) / n, f1 = m / n; S.color('#7d745c');
      for (let q = 0; q < 4; q++) { const a = FACES[q], b = FACES[(q + 1) % 4];
        S.tube(c(a[0], a[1], f1), c(b[0], b[1], f1), 0.07, 4, true);
        S.tube(c(a[0], a[1], f0), c(b[0], b[1], f1), 0.06, 4, true); S.tube(c(b[0], b[1], f0), c(a[0], a[1], f1), 0.06, 4, true); } }
    S.color('#6b6048'); S.box(at(r, h + 0.1, t), RH, Y, TH, hf + 0.3, 0.1, hf + 0.3);
    S.color('#9a8c62'); for (const [i0, j0, i1, j1] of [[-1, -1, -1, 1], [-1, 1, 1, 1], [1, 1, 1, -1], [1, -1, -1, -1]]) S.tube(at(r + i0 * hf, h + 1.2, t + j0 * hf), at(r + i1 * hf, h + 1.2, t + j1 * hf), 0.05, 4, true);
    bar(at(r - hf, h - 0.5, t - 1), at(r - hf, h - 0.5, t + 1), 4, k * 1.9); bar(at(r - 1, h - 0.5, t + sg * hf), at(r + 1, h - 0.5, t + sg * hf), 4, k * 2.7 + 1);
    if (n > 3) bar(at(r - hf, lerp(y0, h, 0.5) - 0.5, t - 1), at(r - hf, lerp(y0, h, 0.5) - 0.5, t + 1), 3.2, k * 3.3 + 2); }
  await ctx.yield();
  // HANGING LOOPS OF CABLE: from the gantry's bridge to the first frame, from frame to frame, from the towers' heads
  const loop = (a, b, sag) => { S.color('#8d8672', 1.3); let p = a; for (let i = 1; i <= 12; i++) { const f = i / 12, q = a.clone().lerp(b, f); q.y -= sag * 4 * f * (1 - f); S.tube(p, q, 0.07, 4, true); p = q; } };
  const G = BEYOND.gantry, T = BEYOND.towers, ft = F.top + 0.2;
  for (const sd of [-1, 1]) { loop(at(G.r, G.top, sd * 14), at(F.r[0], ft, sd * 14), 10); loop(at(F.r[0], ft, sd * 23), at(F.r[1], ft, sd * 23), 13);
    loop(at(F.r[1], ft, sd * 7), at(F.r[2], ft, sd * 7), 9); loop(at(F.r[2], ft, sd * 17), at(F.r[3], ft, sd * 17), 12); }
  for (const [k, fr, sag] of [[0, 0, 5], [1, 1, 9], [3, 2, 8], [4, 2, 4], [5, 3, 6]]) loop(at(T[k][0], T[k][2], T[k][1]), at(F.r[fr], ft, Math.sign(T[k][1]) * (F.legT + 2)), sag);
  // THE FLY GALLERIES (BEYOND.fly: metres of arc up, metres out behind the painted face, half length): level bridges
  // hung in the backstage behind the seam at every height, each with its row of work lamps and two hangers running
  // up and back into the dark: lit steel with depth in it, from the first gallery to far overhead
  for (const [arc, dep, hw] of BEYOND.fly) { const c = wallPoint(gb, arc, -dep), k = hw / (SHELL.R * Math.cos(arc / SHELL.R) + dep) / RAD;
    S.color('#a08a4a'); S.box(c, TH, Y, RH, hw, 0.9, 1.4); S.color('#c9b98a'); S.box(c.clone().addScaledVector(Y, 1.0), TH, Y, RH, hw, 0.1, 1.5);
    for (const sd of [-1, 1]) { S.color('#8d8672', 1.2); S.tube(wallPoint(gb + sd * k * 0.8, arc + 1, -dep), wallPoint(gb + sd * k * 0.9, arc + 46, -(dep + 40)), 0.09, 4, true); }
    for (let j = -3; j <= 3; j++) { const t = j * hw / 3.6, p = c.clone().addScaledVector(TH, t).addScaledVector(RH, -1.6).addScaledVector(Y, -0.7);
      bar(p.clone().addScaledVector(TH, -1.2), p.clone().addScaledVector(TH, 1.2), 4.2, arc * 0.11 + j * 2.3); } }
  // THE FIXED SHELL'S CUT EDGES either side of the two gores' place: the wall's own thickness, a steel return from the
  // painted face back (it stands a gore from the gap's meridian, behind the proud panels)
  for (const sd of [-1, 1]) { const be = gb + sd * (step - 0.12 / SHELL.R / RAD), tt = dirOf(be + 90), rr = dirOf(be); S.color('#8b9099');
    for (let a = 0; a < 300; a += 15) { const up = wallPoint(be, a + 15, -0.6).sub(wallPoint(be, a, -0.6)).normalize();
      S.box(wallPoint(be, a + 7.5, -0.6), tt, up, rr, 0.12, 7.6, 0.6); } }
  sky.steel.add(S);
  await ctx.yield();
  // THE FAR WALL, BEYOND.outer m behind the painted face: a patch of a greater shell about the same middle
  // (it stands behind the whole of the seam: to far overhead, and wide enough for every line of sight through it)
  const rows = [-8, 0, 15, 30, 50, 75, 105, 140, 180, 230, 290, 360, 440, 520, 590, 650];
  const U = { uTime: { value: 0 }, uGapAz: { value: gb * RAD } };
  const wall = new THREE.Mesh(patchGeometry(gb - 120, gb + 120, 48, rows, BEYOND.outer, null, false),new THREE.ShaderMaterial({ uniforms: U, vertexShader: BACK_VERT, fragmentShader: BACK_FRAG, side: THREE.DoubleSide }));
  wall.frustumCulled = false; wall.name = 'backstage-far-wall';
  sky.object.add(wall); sky.backstage.meshes.push(wall); sky.backstage.triangles += S.triangles + 48 * 15 * 2; sky.backstage.wall = wall;
  sky.parts.push({ update(dt, time) { U.uTime.value = time; } });
});
// ---- ALL THE STEEL, LAID IN ITS TWO MESHES (the last piece: every piece above has handed its steel in)
SKY_PIECES.push(async (ctx, sky) => {
  const made = sky.steel.build(); await ctx.yield();
  sky.object.add(made.body, made.thin); sky.steel.body = made.body; sky.steel.thin = made.thin;
});
